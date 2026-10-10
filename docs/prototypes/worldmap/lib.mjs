// boot() from tests/lib/game.mjs with a device pixel ratio: a laptop's Retina screen is 2, a desktop monitor 1.
import { chromium } from 'playwright';
import fs from 'fs';
import { localBuild } from '../../../tests/lib/game.mjs';
export async function bootAt(dpr = 1) {
  const file = localBuild();
  const launch = { args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] };
  if (!fs.existsSync(chromium.executablePath()) && fs.existsSync('/opt/pw-browsers/chromium')) launch.executablePath = '/opt/pw-browsers/chromium';
  const browser = await chromium.launch(launch);
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 720 }, deviceScaleFactor: dpr });
  const page = await ctx.newPage(); page.setDefaultNavigationTimeout(180000);
  const errs = []; page.on('pageerror', e => errs.push(e.message.slice(0, 200)));
  await page.goto('file://' + file); await page.waitForTimeout(4000);
  const g = { page, browser, errs };
  g.hide = () => page.evaluate(() => { for (const id of ['intro-overlay', 'quest-popup']) { const e = document.getElementById(id); if (e) e.style.display = 'none'; } try { _introFadeActive = false; } catch (e) {} });
  g.intoWorld = async () => {
    await page.click('#sb'); await page.waitForTimeout(800);
    await page.evaluate(() => ccBegin()); await page.waitForTimeout(9000); await g.hide();
    await page.evaluate(() => goToZone('world', 13100, 25450, 0, 'x')); await page.waitForTimeout(9000); await g.hide();
  };
  g.settle = async (id) => {
    for (let k = 0; k < 24; k++) {
      await page.waitForTimeout(2500);
      await page.evaluate((id) => { const t = WORLD.siteAnywhere(id); if (Math.hypot(px - t.x, pz - t.z) > 40) { px = t.x; pz = t.z + 4; } }, id);
      if (await page.evaluate((id) => !!WORLD.settle.get(id), id)) break;
    }
    await page.waitForTimeout(2000); await g.hide();
  };
  g.close = () => browser.close();
  return g;
}
// The quests every shot carries: three of Dunmore's lord's jobs (one done, waiting to be reported), and a direction
// asked of a townsperson. Returns what the compass and the map each mark.
export async function takeQuests(page) {
  return page.evaluate(() => {
    const d = WORLD.siteAnywhere('dunmore'); worldState.wdisc = worldState.wdisc || {};
    const qs = [];
    for (const k of ['cull', 'retrieve', 'deliver', 'find']) { const q = townQuestFor(d, k, true); if (q) { q.id = q.id + ':' + k; qAdd(q); qs.push(q); } }
    const dl = qs.find(q => q.kind === 'deliver'); if (dl) qComplete(dl);
    for (const id of ['showMsg']) {}
    const comp = compassMarkers().map(m => ({ label: m.label, x: Math.round(m.x), z: Math.round(m.z), col: m.col }));
    const map = []; for (const c of CELLS.values()) questMarkers(c).forEach(m => map.push({ name: m.name, sub: m.sub, x: Math.round(m.x), z: Math.round(m.z) }));
    return { quests: qs.map(q => ({ id: q.id, kind: q.kind, title: q.title, objective: q.objective, done: !!q.done, giver: q.giver, x: q.data && Math.round(q.data.x), z: q.data && Math.round(q.data.z) })), comp, map, you: { x: Math.round(px), z: Math.round(pz) } };
  });
}
