// Today's world map (build on main): plays into Dunmore, takes four of the lord's jobs (one done), opens Tab's map and
// photographs it at the zoom it opens at — at once and after the fine tiles finish — zoomed into the town, and at the
// whole continent; once at a desktop's pixel ratio (1) and once at a laptop's (2). current.json has the numbers.
// node docs/prototypes/worldmap/shoot-current.mjs
import { bootAt, takeQuests } from './lib.mjs';
import fs from 'fs'; import path from 'path'; import { fileURLToPath } from 'url';
const here = path.dirname(fileURLToPath(import.meta.url));
const out = {};
for (const dpr of [1, 2]) {
  const g = await bootAt(dpr); const { page } = g;
  await g.intoWorld(); await g.settle('dunmore');
  const q = await takeQuests(page); if (dpr === 1) out.quests = q;
  await page.evaluate(() => { worldState.wdisc = worldState.wdisc || {}; for (const c of CELLS.values()) c.sites.forEach(t => { if (Math.hypot(t.x - px, t.z - pz) < 2600) worldState.wdisc[t.id] = 1; }); });
  const shot = n => page.screenshot({ path: path.join(here, `current-${n}${dpr === 2 ? '-x2' : ''}.png`) });
  const t0 = Date.now();
  await page.evaluate(() => openHub('map')); await page.waitForTimeout(250); await g.hide();
  await shot('open');
  const m0 = await page.evaluate(() => ({ cssW: MAP.cv.getBoundingClientRect().width, cssH: MAP.cv.getBoundingClientRect().height, bw: MAP.cv.width, bh: MAP.cv.height, zoom: MAP.zoom, cellPx: SIZE * baseScale() * MAP.zoom, jobs: MAP.jobs.length, entries: MAP._entries.length, quests: MAP._entries.filter(e => e.kind === 'quest').map(e => e.name) }));
  // wait for every fine tile
  let k = 0; while (k < 240 && await page.evaluate(() => MAP.jobs.length) > 0) { await page.waitForTimeout(250); k++; }
  m0.fineMs = Date.now() - t0; m0.fineFramesPerTile = Math.ceil((321 + 320) / 12);
  await page.waitForTimeout(300); await shot('settled');
  // zoom into Dunmore ×3.4 and photograph the instant before the new tiles land
  const zin = async (f, name) => {
    await page.evaluate((f) => { const d = WORLD.siteAnywhere('dunmore'); MAP.zoom = Math.min(64, MAP.zoom * f); const s = baseScale() * MAP.zoom; MAP.ox = MAP.cv.width / 2 - d.x * s; MAP.oy = MAP.cv.height / 2 - d.z * s; mapClamp(); MAP.dirty = true; mapDraw(); }, f);
    await page.waitForTimeout(150); await shot(name);
  };
  await zin(3.4, 'town');
  // pan one province east: the tiles there are the 48-px ones until their jobs run
  await page.evaluate(() => { MAP.ox -= SIZE * baseScale() * MAP.zoom * .9; mapClamp(); MAP.dirty = true; mapDraw(); }); await page.waitForTimeout(150); await shot('pan');
  m0.panCellPx = await page.evaluate(() => SIZE * baseScale() * MAP.zoom);
  await page.evaluate(() => { MAP.zoom = 1; mapClamp(); MAP.dirty = true; mapDraw(); }); await page.waitForTimeout(400); await shot('continent');
  m0.contEntries = await page.evaluate(() => MAP._entries.length);
  m0.contCellPx = await page.evaluate(() => SIZE * baseScale() * MAP.zoom);
  out['dpr' + dpr] = m0; console.log(dpr, m0, g.errs);
  if (dpr === 1) {
    // cost of one tile row at 320 (worldH + mapPixel), for the budget
    out.rowMs = await page.evaluate(() => { const c = getCell(...cellOf(px, pz)); const key = c.i + ',' + c.j + ':320'; MAP.tiles.delete(key); const t = startTile(c, 320); const t0 = performance.now(); let n = 0; while (!t.done) { tileStep(t, 12); n++; } return { steps: n, ms: +(performance.now() - t0).toFixed(1) }; });
  }
  await g.close();
}
fs.writeFileSync(path.join(here, 'current.json'), JSON.stringify(out, null, 1));
console.log(JSON.stringify(out.quests, null, 1), out.rowMs);
