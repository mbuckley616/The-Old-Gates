// Shared harness for The Old Gates. Boots the game in headless Chromium with three.js served locally
// (the CDN is unreachable in CI), starts a character, and gets them into the open world. Every test
// imports this rather than re-deriving the click path. It works on both layouts (backlog K): the one-file
// index.html, and index.html plus js/*.js, because the local copy is written BESIDE the file it was made
// from, so its relative <script src="js/…"> tags still resolve. `node tests/run.mjs --src=PATH` (or
// OG_SRC=PATH) boots another index.html, e.g. a split copy in a scratch folder.
//
//   const g = await boot();          // { page, browser, errs, close }
//   await g.intoWorld();             // new character -> Hearthwick, overlays dismissed
//   await g.settle('dunmore');       // walk to a town and wait for it to build
//   await g.spin('snow', 600);       // tick the world 600 frames at 1/60 under a weather
//   boot({ look: 'new' })            // the same game on three.js 0.170 (Session 822); OG_LOOK=new does it for every suite
//
// The scene runs on software GL at a few frames a second, so anything timing-sensitive is driven
// with spin() (deterministic ticks) rather than waitForTimeout.
import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const here = path.dirname(fileURLToPath(import.meta.url));
export const ROOT = path.resolve(here, '..', '..');

export const DEFAULT_SRC = process.env.OG_SRC ? path.resolve(process.env.OG_SRC) : path.join(ROOT, 'index.html');

// A copy of `src` with three.js pointed at tests/vendor, written next to `src` as index.local.html (gitignored)
// so that a split build's js/ folder is found. Written whole then renamed: the shards run side by side and share it.
export function localBuild(src = DEFAULT_SRC) {
  const dir = path.dirname(src);
  const out = path.join(dir, path.basename(src, '.html') + '.local.html');
  const three = path.relative(dir, path.join(ROOT, 'tests', 'vendor', 'three.min.js')).split(path.sep).join('/');
  const html = fs.readFileSync(src, 'utf8').replace(
    /https:\/\/cdnjs\.cloudflare\.com\/ajax\/libs\/three\.js\/r128\/three\.min\.js/,
    three);
  const tmp = out + '.' + process.pid;
  fs.writeFileSync(tmp, html); fs.renameSync(tmp, out);
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
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 720 }, acceptDownloads: true, deviceScaleFactor: opts.dpr || 1 });
  const page = await ctx.newPage();
  // a reload of the 2.7 MB page on a busy CI runner can take longer than Playwright's 30 s default (Session 274: reader, placesave)
  page.setDefaultNavigationTimeout(180000);
  // Session 808: a screenshot waits for the next frame the page paints, and on a CI runner one frame of the town can take over
  // 30 s, Playwright's default (pauseleaf crashed so four times in 11–13 Oct; Session 765 gave two suites 120 s by hand).
  // Every suite's pictures get 120 s unless they ask for their own.
  const _shot = page.screenshot.bind(page);
  page.screenshot = (o = {}) => _shot({ timeout: 120000, ...o });
  const errs = [];
  page.on('pageerror', e => errs.push(e.message.slice(0, 200)));
  // S822: the console's errors and warnings from the first line on (a suite may assert there are none)
  const logs = [];
  page.on('console', m => { const t = m.type(); if (t === 'error' || t === 'warning') logs.push(t + ': ' + m.text().slice(0, 200)); });
  // S646: indoors, E reaches a thing only with the crosshair on it. A suite that puts you beside one calls lookAtPt(x, y, z) in the
  // page: the eye goes where the loop would put it (px, jumpY + the eye height, pz) and turns to the point, as yaw and pitch do
  await page.addInitScript(() => { window.lookAtPt = (x, y, z) => { const ey = jumpY + (typeof _eyeHeightCur === 'number' ? _eyeHeightCur : 1.6);
    yaw = Math.atan2(-(x - px), -(z - pz)); pitch = Math.atan2(y - ey, Math.hypot(x - px, z - pz)); CAM.position.set(px, ey, pz); CAM.rotation.set(pitch, yaw, 0, 'YXZ'); CAM.updateMatrixWorld(true); }; });
  // S822: `boot({ look: 'new' })`, or OG_LOOK=new (run.mjs --look=new), boots on three.js 0.170 (vendor/three.r170.min.js, beside
  // index.html, so it needs no swap); the default is the old look on tests/vendor's r128, as before
  const look = opts.look || process.env.OG_LOOK || '';
  // 20 Oct 2026: boot and intoWorld waited for the game to say each step is done, not a fixed pause. The pauses came to 31.8 s
  // a suite (4 + 0.8 + 9 + 9 + 9), about 4.4 of a full run's 11.8 runner-hours, and sampled every 250 ms most of each was
  // slack: the title is up when goto returns, the crypt stands 0.8 s into ccBegin's 9 (the rest is the intro text hide()
  // throws away), and the home province's 9 s ended with nine of the world's jobs still queued. The floor is the intro's own
  // timers (the popup, below in intoWorld). Measured on one machine: boot and intoWorld 34.5 s to 23.3 s, and seven suites
  // (wyrm, bear, player, dungeon, saves, crawler, peopleao) 400 s to 328 s, every check the same. A check that is never seen
  // gives up after READY_MS (60 s by default) with a line in the log and the suite goes on, as it did after the pause, so a
  // slow runner is slower, never red. OG_FIXED_WAITS=1 puts the old pauses back (to compare, or to rule this out).
  const fixed = !!process.env.OG_FIXED_WAITS;
  const ready = async (ms, what, fn, arg) => {
    if (fixed) return page.waitForTimeout(ms);
    const t0 = Date.now();
    try { await page.waitForFunction(fn, arg, { polling: 100, timeout: +process.env.READY_MS || 60000 }); }
    catch (e) { console.log(`  ready: ${what} not seen after ${Math.round((Date.now() - t0) / 1000)} s`); }
  };
  // a goToZone is done when its fade has lifted with the player at the spot asked for (freeSpot may nudge them a little)
  const arrived = ([x, z]) => document.getElementById('fd').style.opacity === '0' && activeZoneId === 'world' && Math.hypot(px - x, pz - z) < 50;
  await page.goto('file://' + file + (look ? '?look=' + look : ''));
  await ready(4000, 'the title screen', () => typeof ccBegin === 'function' && getComputedStyle(document.getElementById('sb')).display !== 'none');

  const g = { page, browser, errs, logs };
  g.hide = () => page.evaluate(() => {
    for (const id of ['intro-overlay', 'quest-popup']) { const e = document.getElementById(id); if (e) e.style.display = 'none'; }
    try { _introFadeActive = false; } catch (e) {}
  });
  // the 3×3 of cells around the player loaded, as the old 9 s pause left it, by running the world's job queue the way settle()
  // does (the same jobs in the same order, more of them a frame). The cells are only asked for every 0.75 s of world time
  // (`tickCells`), so each round asks first, as the next tick would. It stops when the nine stand and leaves the rest queued
  // as the pause did: run to empty, the queue also built the statics near the player (628 objects in the world's scene for
  // 281), and a dungeon entered after drew at 1.2 fps for 2.2, which put `dungeon` at 160 s for 67.
  g.cells = async () => {
    for (let k = 0; k < 40; k++) {
      const done = await page.evaluate(() => { const nine = () => { const [pi, pj] = cellOf(px, pz); for (let j = pj - 1; j <= pj + 1; j++) for (let i = pi - 1; i <= pi + 1; i++) {
          if (i < 0 || j < 0 || i >= GRID || j >= GRID) continue; const L = LOADED.get(cellKey(i, j)); if (!L || L.pending) return false; } return true; };
        tickCells(1); const t0 = performance.now(); while (!nine() && JOBS.length && performance.now() - t0 < 1500) runJobs(); return nine(); });
      if (done) break;
      await g.frames(2);
    }
  };
  g.intoWorld = async () => {
    await page.click('#sb');
    await ready(800, 'the character creator', () => getComputedStyle(document.getElementById('cc-modal')).display !== 'none');
    await page.evaluate(() => ccBegin());
    await ready(9000, 'the tutorial crypt', () => document.getElementById('fd').style.opacity === '0' && activeZoneId === 'dungeon' && scene === dScene);
    await g.hide();
    await page.evaluate(() => goToZone('world', 1130, 1480, 0, 'Hearthwick'));
    await ready(9000, 'Hearthwick', arrived, [1130, 1480]); await g.hide();
    // legacy-cell Hearthwick is the safe start; the continent's own home province is at 13100,25450
    await page.evaluate(() => goToZone('world', 13100, 25450, 0, 'x'));
    await ready(9000, 'the home province', arrived, [13100, 25450]);
    if (!fixed) await g.cells();
    // ccBegin's intro runs on its own timers, about 15.7 s from the call (1.4 s, four lines 2.6 s apart, a 3 s hold, a 1.6 s
    // fade), and ends by opening the first quest's popup, which stops the loop. The old pauses outlasted it and the last hide()
    // took the popup down; returning before it opened left it to open in the suite, the camera frozen (`dungeon`'s fort waited
    // out its 120 s for it). So the popup is waited for, then hidden, as before.
    await ready(0, 'the first quest\'s popup', () => { const e = document.getElementById('quest-popup'); return !!e && e.style.display === 'flex'; });
    await g.hide();
  };
  g.keepAlive = () => { const t = setInterval(() => page.evaluate(() => { PHP = maxHP; }).catch(() => {}), 800); return () => clearInterval(t); };
  // Session 1006: it waited 24 polls (60 s) and then went on as if the town stood. A cell builds on the world's job queue,
  // at most two jobs a frame (`runJobs`, 81-world-cells.js), so on software GL a load is counted in frames, not seconds:
  // shrine c6_8_p1, its cell's sixth site, stood after 42 s with one boot running and not after 180 s with six, so `renewal`
  // and `dayseed` read no shrine on 16 Oct. Each poll now also runs the queue the game has laid out (the same jobs in the
  // same order, only more of them per frame), and polls until the site is in SETTLE, up to SETTLE_MS (180 s by default); a
  // site that never builds says so in the log and returns false, so the suite's own check names the fault.
  g.settle = async (id) => {
    await page.evaluate(() => WORLD.devUnlockAll());
    const until = Date.now() + (+process.env.SETTLE_MS || 180000); let built = false;
    while (!built && Date.now() < until) {
      await page.waitForTimeout(2500);
      await page.evaluate((id) => { const t = WORLD.siteAnywhere(id); if (Math.hypot(px - t.x, pz - t.z) > 40) { px = t.x; pz = t.z + 4; } }, id);
      await page.evaluate(() => { const t0 = performance.now(); while (JOBS.length && performance.now() - t0 < 1500) runJobs(); });
      built = await page.evaluate((id) => !!WORLD.settle.get(id), id);
    }
    if (!built) console.log(`  settle: ${id} not built after ${Math.round((+process.env.SETTLE_MS || 180000) / 1000)} s`);
    await page.waitForTimeout(2000); await g.hide();
    return built;
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
