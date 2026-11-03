// seagrotto (Session 1787, card F8; Michael's A on #339, "both ways, as drawn", and his A on #1026, "through a mouth, into a place of its
// own"): on the new look one coastal Aurenne cell in two keeps a sea grotto (seaGrotto, 82), its way in the stair's plastered frame on an
// outcrop of pale rock on the land behind the shore (PKIT.places.cavemouth, rock 'aurenne', frame), and behind it places.js's aurenneGrotto
// (PKIT.places.grotto, buildKitGrotto), its arch on the sea. The suite counts the grottoes, stands at the nearest mouth (the outcrop solid,
// its throat open, the prompt), goes in, walks the prototype's path down the stair, over the landing to the spring and down the quay to
// the water stairs with no wall in the way, finds the sea a wall off the quay and the rock beside the stair, and comes out at the mouth.
// Session 1788: the way in from the sea. The grotto's sea arch stands in the water down its line, a swimmer at it is offered the way in,
// comes up on the water stairs' lowest dry tread, and is offered the way out there, back into the water beyond the arch.
import { boot, check } from './lib/game.mjs';
const g = await boot({ look: 'new' }); const { page } = g; await g.intoWorld();
await page.evaluate(() => REN.setSize(320, 180, false));
const k = await page.evaluate(() => { const G = [...CELLS.values()].filter(c => c.type !== 'sea' && !c.home && nationKeyOf(c.i, c.j) === 'aurenne'); const C = G.map(c => seaGrotto(c)).filter(Boolean);
  const bad = C.filter(C => { const dx = -Math.sin(C.ry), dz = -Math.cos(C.ry); return withPlace(C.x, C.z, () => rawH(C.x + dx * (C.sea + 20), C.z + dz * (C.sea + 20)) > -.5 || rawH(C.x + dx * 40, C.z + dz * 40) < 1.5); }).map(C => C.id);
  const again = G.map(c => { const keep = c._grotto; c._grotto = undefined; const d = seaGrotto(c); c._grotto = keep; return d; }).filter(Boolean), same = again.length === C.length && again.every((d, i) => d.id === C[i].id && d.x === C[i].x && d.ry === C[i].ry);
  C.sort((a, b) => Math.hypot(a.x - px, a.z - pz) - Math.hypot(b.x - px, b.z - pz)); return { cells: G.length, n: C.length, bad, same, near: C[0] }; });
console.log(JSON.stringify(k));
check(`${k.n} of ${k.cells} Aurenne cells keep a sea grotto, the same when asked again, each with land over its stair and the sea past its arch`, k.n > 0 && k.n < k.cells && !k.bad.length && k.same, k);
await page.evaluate(C => { px = C.x + Math.sin(C.ry) * 8; pz = C.z + Math.cos(C.ry) * 8; }, k.near);
for (let n = 0; n < 10; n++) { await g.cells(); const ok = await page.evaluate(id => { const c = [...CELLS.values()].find(c => c._grotto && c._grotto.id === id); return !!(c && c._grotto.house); }, k.near.id); if (ok) break; await page.waitForTimeout(1000); }
const w = await page.evaluate(id => { const c = [...CELLS.values()].find(c => c._grotto && c._grotto.id === id), C = c && c._grotto; if (!C || !C.house) return { none: true };
  const co = Math.cos(C.ry), s = Math.sin(C.ry), W = (u, v) => [C.x + u * co + v * s, C.z - u * s + v * co], at = (u, v) => solidAt(...W(u, v)), gy = (u, v) => +(worldH(...W(u, v)) - C.y).toFixed(2);
  [px, pz] = W(0, 5); jumpY = activeTerrainH(px, pz); const away = limeCavePrompt(); [px, pz] = W(0, -1); jumpY = activeTerrainH(px, pz); const inn = limeCavePrompt();
  const fr = C.house && [...CELLS.values()].length && (() => { let n = null; sc.traverse(o => { if (o.name === 'grotto mouth' && Math.abs(o.position.x - C.x) < .01) n = o; }); return n && !!n.getObjectByName('zellige'); })();
  const r = { id, tris: C.tris, draws: C.draws, away, inn, frame: fr, open: { before: at(0, 3), mouth: at(0, 1), throat: at(0, -1.2) }, solid: { left: at(-3.2, -1.5), right: at(3.2, -1.5), back: at(0, -4) },
    floor: { mouth: gy(0, 0), throat: gy(0, -3) } };
  if (inn) interact(); return r; }, k.near.id);
console.log(JSON.stringify(w));
check(`the mouth of ${w.id} (${w.tris} triangles in ${w.draws} draws), its frame tiled, stands on its pad and offers the stair only in its throat`, !w.none && w.frame && w.tris < 12000 && w.draws <= 8 && !w.away && /down the stair/.test(w.inn) && Math.abs(w.floor.mouth) < .1 && Math.abs(w.floor.throat) < .1, w);
check('its throat open, the outcrop round it solid', !w.none && Object.values(w.open).every(v => !v) && Object.values(w.solid).every(v => v), w);
const inside = () => page.waitForFunction(() => isInterior() && currentHouse && currentHouse.grotto, null, { timeout: 40000 }).then(() => true, () => false);
check('into the sea grotto', await inside());
await page.waitForTimeout(1500);
const c = await page.evaluate(() => { const T = currentHouse._limeCave, Bd = T.bounds, FY = T.low - .25; let x = px, z = pz, y = jumpY, blocked = [], maxStep = 0;
  const step = (nx, nz) => { if (intSolidAt(nx, nz, .3, y)) { blocked.push([+(nx + Bd.x0).toFixed(1), +(nz + Bd.z0).toFixed(1), +(y + FY).toFixed(2)]); return false; } const ny = footholdY(nx, nz, y, 0); maxStep = Math.max(maxStep, ny - y); x = nx; z = nz; y = ny; return true; };
  const walk = pts => { for (const [tx, tz] of pts) { const X = tx - Bd.x0, Z = tz - Bd.z0; let n = 0; while (Math.hypot(X - x, Z - z) > .03 && n++ < 4000) { const d = Math.hypot(X - x, Z - z), s = Math.min(.05, d); if (!step(x + (X - x) / d * s, z + (Z - z) / d * s)) return; } } };
  const clear = !intSolidAt(px, pz, .3, jumpY), y0 = +(jumpY + FY).toFixed(2); let low = 99;
  for (const p of T.path.slice(1)) { walk([p]); low = Math.min(low, y + FY); } const end = [+(x + Bd.x0).toFixed(2), +(z + Bd.z0).toFixed(2), +(y + FY).toFixed(2)];
  const Q = T.quay, qz = (Q.z0 + Q.z1) / 2, wy = Q.y - FY;
  return { tris: T.tris, draws: T.draws, clear, y0, top: T.stair.top, blocked: blocked.slice(0, 3), nb: blocked.length, maxStep: +maxStep.toFixed(2), end, goal: T.path[T.path.length - 1], low: +low.toFixed(2),
    sea: intSolidAt(Q.x(qz) - 3 - Bd.x0, qz - Bd.z0, .3, wy), quay: intSolidAt(Q.x(qz) + 1.8 - Bd.x0, qz - Bd.z0, .3, wy), rock: intSolidAt(2.4 - Bd.x0, -8 - Bd.z0, .3, 4 - FY),
    basin: intSolidAt(T.spring.x - Bd.x0, T.spring.z - Bd.z0, .3, wy) }; });
console.log(JSON.stringify(c));
check(`the grotto (${c.tris} triangles in ${c.draws} draws): arrived at the stair's head at ${c.y0} m, clear`, c.clear && Math.abs(c.y0 - c.top) < .05 && c.tris < 220000 && c.draws <= 24, c);
check(`walked down the stair, to the spring and down the quay to the water stairs with no wall in the way (${c.nb} blocked, steps of ${c.maxStep} at most)`, c.nb === 0 && c.maxStep <= .4 && Math.hypot(c.end[0] - c.goal[0], c.end[1] - c.goal[1]) < .1 && Math.abs(c.end[2] - 1.2) < .05, c);
check('the sea a wall off the quay, the rock beside the stair and the spring\'s basin solid, the quay open', c.sea && c.rock && c.basin && !c.quay, c);
const back = await page.evaluate(() => { const T = currentHouse._limeCave, Bd = T.bounds; px = T.arrive[0] - Bd.x0; pz = T.arrive[2] - Bd.z0; jumpY = T.stair.top - (T.low - .25); const p = limeCavePrompt(); if (p) interact(); return p; });
const outside = await page.waitForFunction(() => !isInterior(), null, { timeout: 30000 }).then(() => true, () => false); await page.waitForTimeout(1500);
const o = await page.evaluate(id => { const C = [...CELLS.values()].find(c => c._grotto && c._grotto.id === id)._grotto; return { d: +Math.hypot(px - C.out.x, pz - C.out.z).toFixed(2), dy: +(jumpY - activeTerrainH(px, pz)).toFixed(2), solid: solidAt(px, pz) }; }, k.near.id);
check(`out at the mouth, on the ground (${o.d} m from the spot)`, /up the stair/.test(back) && outside && o.d < .5 && Math.abs(o.dy) < .3 && !o.solid, o);
const a = await page.evaluate(id => { const C = [...CELLS.values()].find(c => c._grotto && c._grotto.id === id)._grotto, A = C.arch; if (!A) return { none: true };
  const sx = -Math.sin(C.ry), sz = -Math.cos(C.ry), W = (along, across) => [A.x + sx * along + sz * across, A.z + sz * along - sx * across];
  let mesh = null; sc.traverse(o => { if (o.name === 'grotto sea arch') mesh = o; });
  const r = { u: A.u, tris: A.tris, draws: A.draws, mesh: !!mesh, floor: +(worldH(A.x, A.z) - SEA_Y).toFixed(2), throat: solidAt(...W(-1, 0)), sides: [solidAt(...W(-2, -3.6)), solidAt(...W(-2, 3.6))] };
  [px, pz] = W(9, 0); jumpY = SWIM_Y; r.far = limeCavePrompt(); [px, pz] = W(1.5, 0); jumpY = SWIM_Y; r.swim = isSwimming(); r.at = limeCavePrompt(); if (r.at) interact(); return r; }, k.near.id);
console.log(JSON.stringify(a));
check(`the sea arch ${a.u} m down the grotto's line (${a.tris} triangles in ${a.draws} draws), its throat open and its sides solid, offers the way in to a swimmer at it and not 9 m off`, !a.none && a.mesh && a.u >= 50 && a.tris < 12000 && a.floor < -1.6 && !a.throat && a.sides.every(v => v) && a.swim && !a.far && /swim in under the arch/.test(a.at), a);
check('in from the sea', await inside());
await page.waitForTimeout(1500);
const s = await page.evaluate(() => { const T = currentHouse._limeCave, Bd = T.bounds, FY = T.low - .25, x = px + Bd.x0, z = pz + Bd.z0, y = jumpY + FY, w = currentHouse._seaArrive, ws = T.waterStairs;
  const onWS = ws.some(t => x > t.x0 && x < t.x1 && z > t.z0 - .3 && z < t.z1 + .3);
  return { at: [+x.toFixed(2), +z.toFixed(2), +y.toFixed(2)], tread: w, on: !!w && onWS && Math.abs(x - w.x) < .05 && Math.abs(y - w.y) < .05 && y > 0 && y < .7, clear: !intSolidAt(px, pz, .3, jumpY), prompt: limeCavePrompt() }; });
console.log(JSON.stringify(s));
check(`came up on the water stairs (a tread at ${s.tread && s.tread.y} m), clear, offered the way out`, s.on && s.clear && /swim out under the arch/.test(s.prompt), s);
await page.evaluate(() => interact());
const outsea = await page.waitForFunction(() => !isInterior(), null, { timeout: 30000 }).then(() => true, () => false); await page.waitForTimeout(1500);
const q = await page.evaluate(id => { const C = [...CELLS.values()].find(c => c._grotto && c._grotto.id === id)._grotto; return { d: +Math.hypot(px - C.arch.out.x, pz - C.arch.out.z).toFixed(2), swim: isSwimming(), solid: solidAt(px, pz) }; }, k.near.id);
check(`out under the arch, swimming in the sea beyond it (${q.d} m from the spot)`, outsea && q.d < .5 && q.swim && !q.solid, q);
await g.close();
