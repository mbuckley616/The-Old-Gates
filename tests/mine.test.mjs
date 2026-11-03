// mine (Session 1790, card F8; Michael's A on #305, "the levels as built, lamps only while worked", and his A on #1026, "through a mouth,
// into a place of its own"): one cell of the Mark in two keeps a silver mine (mineAt, 82), its adit's mouth the cave's outcrop in the
// ranges' granite with the mine's timber sets and tramway (PKIT.places.cavemouth, rock 'mark', adit), and behind it places.js's markMine
// (PKIT.places.mine). The suite counts them, stands at the nearest mouth (its throat open between the posts, the rock round it solid, the
// prompt), goes in, walks the adit, the landing, the gallery and the ledge to the face, finds the void over the stope a wall, and comes out.
import { boot, check } from './lib/game.mjs';
const g = await boot({ look: 'new' }); const { page } = g; await g.intoWorld();
await page.evaluate(() => REN.setSize(320, 180, false));
const k = await page.evaluate(() => { const G = [...CELLS.values()].filter(c => c.type !== 'sea' && !c.home && nationOf(c.i, c.j).people === 'markman'); const C = G.map(c => mineAt(c)).filter(Boolean);
  C.sort((a, b) => Math.hypot(a.x - px, a.z - pz) - Math.hypot(b.x - px, b.z - pz)); const caves = G.map(c => [c._cave, c._mine]).filter(([a, b]) => a && b).map(([a, b]) => Math.hypot(a.x - b.x, a.z - b.z));
  return { cells: G.length, mines: C.length, worked: C.filter(m => m.worked).length, near: C[0], minCave: caves.length ? Math.round(Math.min(...caves)) : null }; });
console.log(JSON.stringify(k));
check(`${k.mines} of ${k.cells} cells of the Mark keep a mine (${k.worked} worked), each named so, none within 200 m of its cell's ice cave`, k.mines > 0 && k.mines < k.cells && /Mine$/.test(k.near.name) && (k.minCave == null || k.minCave >= 200), k);
await page.evaluate(C => { px = C.x + Math.sin(C.ry) * 8; pz = C.z + Math.cos(C.ry) * 8; }, k.near);
for (let n = 0; n < 6; n++) { await g.cells(); const ok = await page.evaluate(id => { const c = [...CELLS.values()].find(c => c._mine && c._mine.id === id); return !!(c && c._mine.house); }, k.near.id); if (ok) break; await page.waitForTimeout(1000); }
const w = await page.evaluate(id => { const c = [...CELLS.values()].find(c => c._mine && c._mine.id === id), C = c && c._mine; if (!C || !C.house) return { none: true };
  const co = Math.cos(C.ry), s = Math.sin(C.ry), W = (u, v) => [C.x + u * co + v * s, C.z - u * s + v * co], at = (u, v) => solidAt(...W(u, v)), gy = (u, v) => +(worldH(...W(u, v)) - C.y).toFixed(2);
  [px, pz] = W(0, 5); jumpY = activeTerrainH(px, pz); const away = limeCavePrompt(); [px, pz] = W(0, -1); jumpY = activeTerrainH(px, pz); const inn = limeCavePrompt();
  const mo = sc.children.find(o => o.name === 'mine mouth' && Math.hypot(o.position.x - C.x, o.position.z - C.z) < .1), names = mo ? mo.children.map(m => m.name) : [];
  const r = { id, worked: C.worked, snow: C.snow, y: +C.y.toFixed(1), tris: C.tris, draws: C.draws, names, away, inn, open: { before: at(0, 3), portal: at(0, .6), throat: at(0, -1.5), offset: at(.6, -2.4) }, solid: { post: at(1.15, -.9), left: at(-3.2, -1.5), right: at(3.2, -1.5), back: at(0, -4), rim: at(-7, -4) },
    floor: { mouth: gy(0, 0), throat: gy(0, -3) } };
  if (inn) interact(); return r; }, k.near.id);
console.log(JSON.stringify(w));
check(`the mouth of ${w.id} (${w.tris} triangles in ${w.draws} draws) has its timber sets and rails, stands on its pad and offers the way in only in its throat`, !w.none && w.tris < 12000 && w.draws <= 6 && w.names.includes('timber') && w.names.includes('iron') && !w.away && /into the mine/.test(w.inn) && Math.abs(w.floor.mouth) < .1 && Math.abs(w.floor.throat) < .1, w);
check('its throat open between the posts, the posts and the outcrop round it solid', !w.none && Object.values(w.open).every(v => !v) && Object.values(w.solid).every(v => v), w);
const inside = () => page.waitForFunction(() => isInterior() && currentHouse && currentHouse.type === 'mine', null, { timeout: 40000 }).then(() => true, () => false);
check('into the mine', await inside());
await page.waitForTimeout(1500);
const m = await page.evaluate(() => { const T = currentHouse._limeCave, Bd = T.bounds, FY = T.low - .25; let x = px, z = pz, y = jumpY, blocked = [], maxStep = 0;
  const step = (nx, nz) => { if (intSolidAt(nx, nz, .3, y)) { blocked.push([+(nx + Bd.x0).toFixed(2), +(nz + Bd.z0).toFixed(2)]); return false; } const ny = footholdY(nx, nz, y, 0); maxStep = Math.max(maxStep, Math.abs(ny - y)); x = nx; z = nz; y = ny; return true; };
  const clear = !intSolidAt(px, pz, .3, jumpY), y0 = +(jumpY + FY).toFixed(2);
  for (const [tx, tz] of T.path.slice(1)) { const X = tx - Bd.x0, Z = tz - Bd.z0; let n = 0; while (Math.hypot(X - x, Z - z) > .03 && n++ < 4000) { const d = Math.hypot(X - x, Z - z), s = Math.min(.05, d); if (!step(x + (X - x) / d * s, z + (Z - z) / d * s)) break; } }
  const V = T.void, wall = (u, v) => intSolidAt(u - Bd.x0, v - Bd.z0, .3, -FY), P = _LPS.get(interiorScene), lit = P ? P.src.filter(v => v.mirror.userData.mineLamp).length : interiorScene.children.filter(o => o.isPointLight && o.userData.mineLamp).length, /* the room's light pool (68) takes them in */ out = PKIT.places.mine({ key: 'test', worked: false }), outHorn = out.group.children.some(c => c.name === 'horn' || c.name === 'flame');
  return { worked: T.worked, lamps: T.lamps.length, lit, tris: T.tris, draws: T.draws, clear, y0, blocked: blocked.slice(0, 3), nb: blocked.length, maxStep: +maxStep.toFixed(2), end: [+(x + Bd.x0).toFixed(2), +(z + Bd.z0).toFixed(2)], goal: T.path[T.path.length - 1],
    outLamps: out.lamps.length, outHorn, outTris: out.tris, clearW: T.adit.w, cap: T.adit.cap, voidWall: wall((V.x0 + V.x1) / 2, (V.z0 + V.z1) / 2), edgeWall: wall(1.5, V.z0 - .3), railWall: wall(V.x0 + .3, (V.z0 + V.z1) / 2) }; });
console.log(JSON.stringify(m));
check(`the mine (${m.tris} triangles in ${m.draws} draws), its levels as built (${(+m.clearW).toFixed(2)} m clear, the cap at ${m.cap} m): arrived on the adit's floor, clear`, m.clear && Math.abs(m.y0) < .05 && Math.abs(m.clearW - 2.08) < .02 && m.cap === 2.3 && m.tris < 120000 && m.draws <= 16, m);
check(`lamps only while worked: this one ${m.worked ? 'worked' : 'worked out'}, ${m.lamps} lamps drawn, ${m.lit} lit; a worked-out one, ${m.outLamps} lamps and no flame`, (m.worked ? m.lamps > 4 && m.lit === 5 : m.lamps === 0 && m.lit === 0) && m.outLamps === 0 && !m.outHorn, m);
check(`walked the adit, the landing, the gallery and the ledge to the face with no wall in the way and no step (${m.nb} blocked)`, m.nb === 0 && m.maxStep <= .01 && Math.hypot(m.end[0] - m.goal[0], m.end[1] - m.goal[1]) < .1, m);
check('the void over the stope is a wall: past the landing\'s edge, off the gallery\'s rail, in its middle', m.voidWall && m.edgeWall && m.railWall, m);
const back = await page.evaluate(() => { const T = currentHouse._limeCave, Bd = T.bounds; px = T.arrive[0] - Bd.x0; pz = T.arrive[2] - Bd.z0; jumpY = T.arrive[1] - (T.low - .25); const p = limeCavePrompt(); if (p) interact(); return p; });
const outside = await page.waitForFunction(() => !isInterior(), null, { timeout: 30000 }).then(() => true, () => false); await page.waitForTimeout(1500);
const o = await page.evaluate(id => { const C = [...CELLS.values()].find(c => c._mine && c._mine.id === id)._mine; return { d: +Math.hypot(px - C.out.x, pz - C.out.z).toFixed(2), dy: +(jumpY - activeTerrainH(px, pz)).toFixed(2), solid: solidAt(px, pz) }; }, k.near.id);
check(`out at the mouth, on the ground (${o.d} m from the spot)`, /go out of the mine/.test(back) && outside && o.d < .5 && Math.abs(o.dy) < .3 && !o.solid, o);
await g.close();
