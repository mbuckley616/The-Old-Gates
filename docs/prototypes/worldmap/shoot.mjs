// The proposal in today's game: the same run as shoot-current.mjs (Dunmore, four of the lord's jobs, one done), with
// proposal.js loaded over the game's map functions. Photographs at a laptop's pixel ratio (2) and a desktop's (1); writes
// proposed.json (tile counts, time to sharp, the marks). node docs/prototypes/worldmap/shoot.mjs
import { bootAt, takeQuests } from './lib.mjs';
import fs from 'fs'; import path from 'path'; import { fileURLToPath } from 'url';
const here = path.dirname(fileURLToPath(import.meta.url));
// Headless, the game draws a few frames a second, so the map's 8 ms a frame would take minutes: drain() runs the frames
// back to back (mapJobs then mapDraw, as the map's own loop does) and returns the tile work's CPU time and its frame count.
const drain = page => page.evaluate(() => { const t0 = performance.now(); let f = 0; mapDraw(); while (MAP.jobs.length && f < 20000) { mapJobs(); f++; if (f % 50 === 0) mapDraw(); } mapDraw(); return { ms: Math.round(performance.now() - t0), frames: f, s60: +(f / 60).toFixed(1) }; });
const out = {};
for (const dpr of (process.argv[2] ? [+process.argv[2]] : [2, 1])) {
  const g = await bootAt(dpr); const { page } = g;
  await g.intoWorld(); await g.settle('dunmore');
  await takeQuests(page);
  // a townsperson's directions, as the compass shows them (WAY), to the Old Mound's nearest town
  await page.evaluate(() => { worldState.wdisc = worldState.wdisc || {}; for (const c of CELLS.values()) c.sites.forEach(t => { if (Math.hypot(t.x - px, t.z - pz) < 2600) worldState.wdisc[t.id] = 1; }); });
  await page.addScriptTag({ path: path.join(here, 'proposal.js') });
  const sfx = dpr === 2 ? '' : '-x1';
  const shot = n => page.screenshot({ path: path.join(here, `proposed-${n}${sfx}.png`) });
    await page.evaluate(() => openHub('map')); await page.waitForTimeout(250); await g.hide();
  await shot('open');
  const m0 = await page.evaluate(() => ({ cssW: MAP.cssW, cssH: MAP.cssH, bw: MAP.cv.width, bh: MAP.cv.height, cellPx: SIZE * baseScale() * MAP.zoom, jobs: MAP.jobs.length, marks: mapMarks().map(m => ({ n: m.n, title: m.title, line: m.line, st: m.st })) }));
  m0.sharp = await drain(page);
  m0.tiles = await page.evaluate(() => [...MAP.tiles.values()].filter(t => t.q && t.done).length);
  await page.waitForTimeout(300); await shot('settled');
  const zin = async (f, name, wait) => {
    await page.evaluate((f) => { const d = WORLD.siteAnywhere('dunmore'); MAP.zoom = Math.min(64, MAP.zoom * f); const s = baseScale() * MAP.zoom; MAP.ox = MAP.cssW / 2 - d.x * s; MAP.oy = MAP.cssH / 2 - d.z * s; mapClamp(); MAP.dirty = true; mapDraw(); }, f);
    await page.waitForTimeout(150); await shot(name + '-first');
    const r = await drain(page); await page.waitForTimeout(200); await shot(name); return r;
  };
  m0.town = await zin(3.4, 'town');
  m0.townLevel = await page.evaluate(() => { const c = SIZE * baseScale() * MAP.zoom; return { cellPx: c, tiles: [...MAP.tiles.values()].filter(t => t.q && t.done).map(t => t.L).reduce((a, l) => (a[l] = (a[l] || 0) + 1, a), {}) }; });
  await page.evaluate(() => { MAP.ox -= SIZE * baseScale() * MAP.zoom * .9; mapClamp(); MAP.dirty = true; mapDraw(); }); await page.waitForTimeout(150); await shot('pan');
  // close in (×64 asked; the clamp holds the view on the map): the marks to the west sit on the frame, with their distance
  await page.evaluate(() => { MAP.zoom = 64; const s = baseScale() * MAP.zoom; MAP.ox = MAP.cssW / 2 - 13747 * s; MAP.oy = MAP.cssH / 2 - 25254 * s; mapClamp(); MAP.dirty = true; mapDraw(); });
  m0.deep = await drain(page); await page.waitForTimeout(200); await shot('deep');
  await page.evaluate(() => { MAP.zoom = 1; MAP.sel = null; mapClamp(); MAP.dirty = true; mapDraw(); }); await page.waitForTimeout(600); await shot('continent');
  m0.errs = g.errs; out['dpr' + dpr] = m0; console.log(dpr, JSON.stringify(m0));
  await g.close();
}
fs.writeFileSync(path.join(here, 'proposed.json'), JSON.stringify(out, null, 1));
