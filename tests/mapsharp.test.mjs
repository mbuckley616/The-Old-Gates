// Session 588: the world map is often blurry (Michael, 5 Oct 2026, backlog E). Two causes. The canvas was sized in CSS pixels, so
// a HiDPI screen stretched it twofold. And the land was a 48 px tile per cell up to 220 px a cell and a 320 px tile beyond, while
// the zoom goes to 64 (a cell some 3,000 px across), so from the opening scale on every tile was stretched, up to tenfold. Now the
// canvas draws at the screen's density, a 128 px tier sits between, and past 320 a cell is drawn in 2×2 … 16×16 squares of 320,
// only those on screen. Measured: texels per device pixel at the player's cell, its tiles finished at once, at each zoom.
import { boot, check } from './lib/game.mjs';
const g = await boot(); const { page } = g;
await g.intoWorld(); await g.settle('dunmore');
await page.evaluate(() => { Object.defineProperty(window, 'devicePixelRatio', { configurable: true, get: () => 2 }); openHub('map'); });
await g.frames(3);

const open = await page.evaluate(() => { const [sx, sy] = mapToScreen(px, pz);
  return { dpr: MAP.dpr, cw: MAP.cv.width, ch: MAP.cv.height, lw: MAP.lw, lh: MAP.lh, css: Math.round(MAP.cv.getBoundingClientRect().width), sx: Math.round(sx), sy: Math.round(sy), zoom: +MAP.zoom.toFixed(2) }; });
console.log(' open:', JSON.stringify(open));
check('the canvas is drawn at the screen\'s density (twice its CSS size at a dpr of 2)', open.dpr === 2 && open.cw === 2 * open.lw && open.ch === 2 * open.lh && open.css === open.lw, open);
check('the map still opens centred on you, in CSS pixels', Math.abs(open.sx - open.lw / 2) <= 2 && Math.abs(open.sy - open.lh / 2) <= 2, open);

const at = (zoom) => page.evaluate(async (zoom) => {
  MAP.zoom = zoom; const s = baseScale() * MAP.zoom; MAP.ox = MAP.lw / 2 - px * s; MAP.oy = MAP.lh / 2 - pz * s; mapClamp(); mapDraw();
  // the tiles this view asked for at your own cell, finished at once (the whole queue is minutes of work on software GL)
  const [i, j] = cellOf(px, pz); const c = getCell(i, j); const cellPx = WORLD.SIZE * baseScale() * MAP.zoom; const t0 = performance.now(); let made = 0;
  for (const t of MAP.jobs.slice()) { if (t.cell !== c) continue; if (t.sub) { const a = Math.floor((px - c.ox) / WORLD.SIZE * t.n), b = Math.floor((pz - c.oz) / WORLD.SIZE * t.n); if (t.sub.a !== a || t.sub.b !== b) continue; } while (!t.done) tileStep(t, 1e9); made++; }
  const ms = Math.round(performance.now() - t0); const queued = MAP.jobs.length; mapDraw();
  let res = 0; for (const [k, t] of MAP.tiles) { if (!t.done || t.cell !== c) continue; if (t.sub) { const a = Math.floor((px - c.ox) / WORLD.SIZE * t.n), b = Math.floor((pz - c.oz) / WORLD.SIZE * t.n); if (t.sub.a !== a || t.sub.b !== b) continue; }
    res = Math.max(res, t.res * (t.n || 1)); }
  let subs = 0; for (const t of MAP.tiles.values()) if (t.sub) subs++;
  return { zoom, cellPx: Math.round(cellPx), res, ratio: +(res / (cellPx * MAP.dpr)).toFixed(2), made, ms, queued, subs }; }, zoom);
const rows = []; for (const z of [1, 2, 4, 8, 16, 32, 64]) { const r = await at(z); rows.push(r); console.log(' ', JSON.stringify(r)); }
const worst = rows.filter(r => r.cellPx * 2 >= 100).reduce((m, r) => Math.min(m, r.ratio), 9);
check(`from a cell of 100 device px up, the land is drawn with at least 0.4 texels a device pixel (worst ${worst})`, worst >= .4, rows);
check('at the deepest zoom, 0.8 or better (was 0.05)', rows[rows.length - 1].ratio >= .8, rows[rows.length - 1]);
check('no more than 160 squares are kept, and the queue holds only what the screen shows (at most 64 a view)', rows.every(r => r.subs <= 160 && r.queued <= 64 + 160), rows);

// panned right away at the deepest zoom: the squares queued for the old view are dropped
const pan = await page.evaluate(() => { MAP.ox += 3000; mapClamp(); mapDraw(); const before = MAP.jobs.filter(j => j.sub).length; MAP.ox -= 6000; mapClamp(); mapDraw();
  const vis = MAP.jobs.filter(j => j.sub); const W = MAP.lw, H = MAP.lh; const s = baseScale() * MAP.zoom;
  const off = vis.filter(j => { const x = j.X0 * s + MAP.ox, y = j.Z0 * s + MAP.oy, q = WORLD.SIZE / j.n * s; return x > W || y > H || x + q < 0 || y + q < 0; }).length;
  return { before, after: vis.length, off }; });
console.log(' pan:', JSON.stringify(pan));
check('panned, no square off the screen is still being worked', pan.off === 0, pan);
await page.evaluate(() => { try { closeHub(); } catch (e) {} });
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
