// Shared harness for The Old Gates. Boots the single-file build in headless Chromium with three.js
// served locally (the CDN is unreachable in CI), starts a character, and gets them into the open
// world. Every test imports this rather than re-deriving the click path.
//
//   const g = await boot();          // { page, browser, errs, close }
//   await g.intoWorld();             // new character -> Hearthwick, overlays dismissed
//   await g.settle('dunmore');       // walk to a town and wait for it to build
//   await g.spin('snow', 600);       // tick the world 600 frames at 1/60 under a weather
//
// The scene runs on software GL at a few frames a second, so anything timing-sensitive is driven
// with spin() (deterministic ticks) rather than waitForTimeout.
import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const here = path.dirname(fileURLToPath(import.meta.url));
export const ROOT = path.resolve(here, '..', '..');
const TMP = path.join(here, '..', 'tmp');

export function localBuild(src = path.join(ROOT, 'index.html')) {
  fs.mkdirSync(TMP, { recursive: true });
  const out = path.join(TMP, 'index.local.html');
  const html = fs.readFileSync(src, 'utf8').replace(
    /https:\/\/cdnjs\.cloudflare\.com\/ajax\/libs\/three\.js\/r128\/three\.min\.js/,
    '../vendor/three.min.js');
  fs.writeFileSync(out, html);
  return out;
}

const PREINSTALLED = '/opt/pw-browsers/chromium';

export async function boot(opts = {}) {
  const file = localBuild(opts.src);
  const launch = { args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] };
  if (process.env.CHROME) launch.executablePath = process.env.CHROME;
  else if (!fs.existsSync(chromium.executablePath()) && fs.existsSync(PREINSTALLED)) {
    // Cloud containers ship their own Chromium; use it when Playwright's download was blocked.
    launch.executablePath = PREINSTALLED;
  }
  const browser = await chromium.launch(launch);
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 720 }, acceptDownloads: true });
  const page = await ctx.newPage();
  // a reload of the 2.7 MB page on a busy CI runner can take longer than Playwright's 30 s default (Session 274: reader, placesave)
  page.setDefaultNavigationTimeout(180000);
  const errs = [];
  page.on('pageerror', e => errs.push(e.message.slice(0, 200)));
  await page.goto('file://' + file);
  await page.waitForTimeout(4000);

  const g = { page, browser, errs };
  g.hide = () => page.evaluate(() => {
    for (const id of ['intro-overlay', 'quest-popup']) { const e = document.getElementById(id); if (e) e.style.display = 'none'; }
    try { _introFadeActive = false; } catch (e) {}
  });
  g.intoWorld = async () => {
    await page.click('#sb'); await page.waitForTimeout(800);
    await page.evaluate(() => ccBegin()); await page.waitForTimeout(9000); await g.hide();
    await page.evaluate(() => goToZone('world', 1130, 1480, 0, 'Hearthwick')); await page.waitForTimeout(9000); await g.hide();
    // legacy-cell Hearthwick is the safe start; the continent's own home province is at 13100,25450
    await page.evaluate(() => goToZone('world', 13100, 25450, 0, 'x')); await page.waitForTimeout(9000); await g.hide();
  };
  g.keepAlive = () => { const t = setInterval(() => page.evaluate(() => { PHP = maxHP; }).catch(() => {}), 800); return () => clearInterval(t); };
  g.settle = async (id) => {
    await page.evaluate(() => WORLD.devUnlockAll());
    for (let k = 0; k < 24; k++) {
      await page.waitForTimeout(2500);
      await page.evaluate((id) => { const t = WORLD.siteAnywhere(id); if (Math.hypot(px - t.x, pz - t.z) > 40) { px = t.x; pz = t.z + 4; } }, id);
      if (await page.evaluate((id) => !!WORLD.settle.get(id), id)) break;
    }
    await page.waitForTimeout(2000); await g.hide();
  };
  g.spin = (weather, frames) => page.evaluate(([w, n]) => {
    if (w) { const wx = WORLD.wx; wx.type = w; wx.next = w; wx.k = 1; }
    for (let i = 0; i < n; i++) WORLD.tick(1 / 60, performance.now());
  }, [weather, frames]);
  // wait for n real frames of the game's own loop: HUD text (the door prompt) is only written there, and on a slow
  // runner a fixed pause can pass without one (Session 156)
  g.frames = (n = 2) => page.evaluate(n => new Promise(r => { let k = 0; const f = () => (++k >= n ? r() : requestAnimationFrame(f)); requestAnimationFrame(f); }), n);
  g.close = () => browser.close();
  return g;
}

// tiny assertion helpers so tests read as sentences
export function check(name, cond, detail) {
  const ok = !!cond;
  console.log(`${ok ? '  ok ' : ' FAIL'} ${name}${detail !== undefined ? '  ' + JSON.stringify(detail) : ''}`);
  if (!ok) process.exitCode = 1;
  return ok;
}
