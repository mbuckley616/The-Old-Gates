// Session 588: the world map is often blurry (Michael, 5 Oct 2026, backlog E). Two causes. The canvas was sized in CSS pixels, so
// a HiDPI screen stretched it twofold. And the land was a 48 px tile per cell up to 220 px a cell and a 320 px tile beyond, while
// the zoom goes to 64 (a cell some 3,000 px across), so from the opening scale on every tile was stretched, up to tenfold. Now the
// canvas draws at the screen's density, a 128 px tier sits between, and past 320 a cell is drawn in 2×2 … 16×16 squares of 320,
// only those on screen. Measured: texels per device pixel at the player's cell, its tiles finished at once, at each zoom.
// The merge of 11 Oct kept Session 704's quadtree in place of these tiers (Michael's A on #220 asked for the same thing, later);
// the measures below read its tiles (t.q, level t.L: a province in 2^L × 2^L tiles of t.res) and the thresholds stand.
import { boot, check } from './lib/game.mjs';
const g = await boot(); const { page } = g;
await g.intoWorld(); await g.settle('dunmore');
await page.evaluate(() => { Object.defineProperty(window, 'devicePixelRatio', { configurable: true, get: () => 2 }); openHub('map'); });
await g.frames(3);

const open = await page.evaluate(() => { const [sx, sy] = mapToScreen(px, pz);
  return { dpr: MAP.dpr, cw: MAP.cv.width, ch: MAP.cv.height, lw: mapLW(), lh: mapLH(), css: Math.round(MAP.cv.getBoundingClientRect().width), sx: Math.round(sx), sy: Math.round(sy), zoom: +MAP.zoom.toFixed(2) }; });
console.log(' open:', JSON.stringify(open));
check('the canvas is drawn at the screen\'s density (twice its CSS size at a dpr of 2)', open.dpr === 2 && open.cw === 2 * open.lw && open.ch === 2 * open.lh && open.css === open.lw, open);
check('the map still opens centred on you, in CSS pixels', Math.abs(open.sx - open.lw / 2) <= 2 && Math.abs(open.sy - open.lh / 2) <= 2, open);

const at = (zoom) => page.evaluate(async (zoom) => {
  MAP.zoom = zoom; const s = baseScale() * MAP.zoom; MAP.ox = mapLW() / 2 - px * s; MAP.oy = mapLH() / 2 - pz * s; mapClamp(); mapDraw();
  // the tiles this view asked for at your own spot, finished at once (the whole queue is minutes of work on software GL)
  const [i, j] = cellOf(px, pz); const c = getCell(i, j); const cellPx = WORLD.SIZE * baseScale() * MAP.zoom; const t0 = performance.now(); let made = 0;
  const mine = t => t.cell === c && (!t.q || (px >= t.X0 && px < t.X0 + t.span && pz >= t.Z0 && pz < t.Z0 + t.span));
  for (const t of MAP.jobs.slice()) { if (!mine(t)) continue; while (!t.done) { if (t.q) mapStepQ(t, 1e9, performance.now()); else tileStep(t, 1e9); } made++; }
  const ms = Math.round(performance.now() - t0); for (let k = 0; k < 4; k++) mapDraw(); mapJobs(); /* the quadtree lets go of unseen tiles in mapJobs */ const queued = MAP.jobs.filter(t => !t.done).length;
  let res = 0; for (const t of MAP.tiles.values()) { if (!t.done || !mine(t)) continue; res = Math.max(res, t.q ? t.res * (1 << t.L) : t.res); }
  let subs = 0; for (const t of MAP.tiles.values()) if (t.q) subs++;
  return { zoom, cellPx: Math.round(cellPx), res, ratio: +(res / (cellPx * MAP.dpr)).toFixed(2), made, ms, queued, subs }; }, zoom);
const rows = []; for (const z of [1, 2, 4, 8, 16, 32, 64]) { const r = await at(z); rows.push(r); console.log(' ', JSON.stringify(r)); }
const worst = rows.filter(r => r.cellPx * 2 >= 100).reduce((m, r) => Math.min(m, r.ratio), 9);
check(`from a cell of 100 device px up, the land is drawn with at least 0.4 texels a device pixel (worst ${worst})`, worst >= .4, rows);
check('at the deepest zoom, 0.8 or better (was 0.05)', rows[rows.length - 1].ratio >= .8, rows[rows.length - 1]);
check('no more than 160 squares are kept, and the queue holds only what the screen shows (at most 64 a view)', rows.every(r => r.subs <= 160 && r.queued <= 64 + 160), rows);

// panned right away at the deepest zoom: the squares queued for the old view are dropped
const pan = await page.evaluate(() => { MAP.ox += 3000; mapClamp(); mapDraw(); const before = MAP.jobs.filter(j => j.q).length; MAP.ox -= 6000; mapClamp();
  for (let k = 0; k < 4; k++) mapDraw(); MAP.jobs = MAP.jobs.filter(t => !t.done && (!t.q || t.want >= MAP.drawN - 2)); /* mapJobs' own filter, without its 8 ms of work */
  const vis = MAP.jobs.filter(j => j.q); const W = mapLW(), H = mapLH(); const s = baseScale() * MAP.zoom;
  const off = vis.filter(j => { const x = j.X0 * s + MAP.ox, y = j.Z0 * s + MAP.oy, q = j.span * s; return x > W || y > H || x + q < 0 || y + q < 0; }).length;
  return { before, after: vis.length, off }; });
console.log(' pan:', JSON.stringify(pan));
check('panned, no square off the screen is still being worked', pan.off === 0, pan);
await page.evaluate(() => { try { closeHub(); } catch (e) {} });
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
