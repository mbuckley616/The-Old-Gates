// limecave (Session 1768, card F8; Michael's A on #1026, "through a mouth, into a place of its own"): on the new look one Gatelands cell in
// two keeps a limestone cave (limeCave, 82), its mouth an outcrop on a hillside (PKIT.places.cavemouth) and behind it a place of its own,
// places.js's gatelandsCave (PKIT.places.cave, buildKitLimeCave). The suite counts the caves, stands at the nearest mouth (the outcrop
// solid, its throat open, the prompt), goes in, walks the prototype's path from the passage down the ramp, along the shore and over the
// bridge to the far shelf with no wall in the way and no step up over 0.4 m, finds the lake a wall, and comes out at the mouth again.
import { boot, check } from './lib/game.mjs';
const g = await boot({ look: 'new' }); const { page } = g; await g.intoWorld();
await page.evaluate(() => REN.setSize(320, 180, false));
const k = await page.evaluate(() => { const G = [...CELLS.values()].filter(c => c.type !== 'sea' && !c.home && nationKeyOf(c.i, c.j) === 'gatelands'); const C = G.map(c => limeCave(c)).filter(Boolean);
  C.sort((a, b) => Math.hypot(a.x - px, a.z - pz) - Math.hypot(b.x - px, b.z - pz)); return { cells: G.length, caves: C.length, near: C[0] }; });
check(`${k.caves} of ${k.cells} Gatelands cells keep a limestone cave`, k.caves > 0 && k.caves < k.cells, k);
await page.evaluate(C => { px = C.x + Math.sin(C.ry) * 8; pz = C.z + Math.cos(C.ry) * 8; }, k.near);
for (let n = 0; n < 6; n++) { await g.cells(); const ok = await page.evaluate(id => { const c = [...CELLS.values()].find(c => c._cave && c._cave.id === id); return !!(c && c._cave.house); }, k.near.id); if (ok) break; await page.waitForTimeout(1000); }
const w = await page.evaluate(id => { const c = [...CELLS.values()].find(c => c._cave && c._cave.id === id), C = c && c._cave; if (!C || !C.house) return { none: true };
  const co = Math.cos(C.ry), s = Math.sin(C.ry), W = (u, v) => [C.x + u * co + v * s, C.z - u * s + v * co], at = (u, v) => solidAt(...W(u, v)), gy = (u, v) => +(worldH(...W(u, v)) - C.y).toFixed(2);
  [px, pz] = W(0, 5); jumpY = activeTerrainH(px, pz); const away = limeCavePrompt(); [px, pz] = W(0, -1); jumpY = activeTerrainH(px, pz); const inn = limeCavePrompt();
  const r = { id, tris: C.tris, draws: C.draws, away, inn, open: { before: at(0, 3), mouth: at(0, 1), throat: at(0, -1.2) }, solid: { left: at(-3.2, -1.5), right: at(3.2, -1.5), back: at(0, -4), rim: at(-7, -4) },
    floor: { mouth: gy(0, 0), throat: gy(0, -3) } };
  if (inn) interact(); return r; }, k.near.id);
console.log(JSON.stringify(w));
check(`the mouth of ${w.id} (${w.tris} triangles in ${w.draws} draws) stands on its pad and offers the way in only in its throat`, !w.none && w.tris < 10000 && w.draws <= 6 && !w.away && /into the cave/.test(w.inn) && Math.abs(w.floor.mouth) < .1 && Math.abs(w.floor.throat) < .1, w);
check('its throat open, the outcrop round it solid', !w.none && Object.values(w.open).every(v => !v) && Object.values(w.solid).every(v => v), w);
const inside = () => page.waitForFunction(() => isInterior() && currentHouse && currentHouse.type === 'limecave', null, { timeout: 40000 }).then(() => true, () => false);
check('into the cave', await inside());
await page.waitForTimeout(1500);
const c = await page.evaluate(() => { const T = currentHouse._limeCave, Bd = T.bounds, FY = T.low - .25; let x = px, z = pz, y = jumpY, blocked = [], maxStep = 0;
  const step = (nx, nz) => { if (intSolidAt(nx, nz, .3, y)) { blocked.push([+(nx + Bd.x0).toFixed(1), +(nz + Bd.z0).toFixed(1), +(y + FY).toFixed(2)]); return false; } const ny = footholdY(nx, nz, y, 0); maxStep = Math.max(maxStep, ny - y); x = nx; z = nz; y = ny; return true; };
  const clear = !intSolidAt(px, pz, .3, jumpY), y0 = +(jumpY + FY).toFixed(2);
  for (const [tx, tz] of T.path.slice(1)) { const X = tx - Bd.x0, Z = tz - Bd.z0; let n = 0; while (Math.hypot(X - x, Z - z) > .03 && n++ < 4000) { const d = Math.hypot(X - x, Z - z), s = Math.min(.05, d); if (!step(x + (X - x) / d * s, z + (Z - z) / d * s)) break; } }
  const zm = (T.lake.z0 + T.lake.z1) / 2;
  return { tris: T.tris, draws: T.draws, clear, y0, blocked: blocked.slice(0, 3), nb: blocked.length, maxStep: +maxStep.toFixed(2), end: [+(x + Bd.x0).toFixed(2), +(z + Bd.z0).toFixed(2), +(y + FY).toFixed(2)], goal: T.path[T.path.length - 1],
    lake: intSolidAt(-6 - Bd.x0, zm - Bd.z0, .3, 0 - FY), head: +(headCeil(T.arrive[0] - Bd.x0, -10 - Bd.z0, T.ledge - FY) + FY).toFixed(2) }; });
console.log(JSON.stringify(c));
check(`the cave (${c.tris} triangles in ${c.draws} draws): arrived on the passage's floor at ${c.y0} m, clear`, c.clear && Math.abs(c.y0 - 4.5) < .05 && c.tris < 160000 && c.draws <= 16, c);
check(`walked the passage, the ramp, the shore and the bridge to the far shelf with no wall in the way and no step up over 0.4 m (${c.nb} blocked)`, c.nb === 0 && c.maxStep <= .4 && Math.hypot(c.end[0] - c.goal[0], c.end[1] - c.goal[1]) < .1, c);
check('the lake is a wall at the water\'s edge', c.lake, c);
const back = await page.evaluate(() => { const T = currentHouse._limeCave, Bd = T.bounds; px = T.arrive[0] - Bd.x0; pz = T.arrive[2] - Bd.z0; jumpY = T.ledge - (T.low - .25); const p = limeCavePrompt(); if (p) interact(); return p; });
const outside = await page.waitForFunction(() => !isInterior(), null, { timeout: 30000 }).then(() => true, () => false); await page.waitForTimeout(1500);
const o = await page.evaluate(id => { const C = [...CELLS.values()].find(c => c._cave && c._cave.id === id)._cave; return { d: +Math.hypot(px - C.out.x, pz - C.out.z).toFixed(2), dy: +(jumpY - activeTerrainH(px, pz)).toFixed(2), solid: solidAt(px, pz) }; }, k.near.id);
check(`out at the mouth, on the ground (${o.d} m from the spot)`, /out into the day/.test(back) && outside && o.d < .5 && Math.abs(o.dy) < .3 && !o.solid, o);
await g.close();
