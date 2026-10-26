// A Gatelands village's farm on the new look (Session 1455; card F6, Michael's C on DECISION #744: a farm at each village's edge, and a
// few alone in the country, the second half a later session's; the farmstead round its yard behind the house, his A on #498). The kit's
// farmstead (PKIT.gl.farmstead, copied from pieces.js's Session 1194) builds as the prototype's, the same twice. villageFarm lays one
// beside a road out of each Gatelands village, its middle 60 to 150 m past the last lots, its front 10.2 m off the road (clear of its bed) and its gate to it,
// from the cells alone: the same answer twice, none on another people's village, no two farms or a farm and a gate's or fort's pad on
// one another. In the first village: the farm stands on its own pad, flat under the whole lot; its buildings, walls and things in the
// yard are solids that match the kit's footprints, and the way in from the road through the gate to the yard is clear; its far copy
// stands in for it from outside 80 m, its 20 draws near.
import { boot, check } from './lib/game.mjs';
// the prototype's counts (pieces.check.mjs, Session 1194: about 8.5k triangles in 20 draws a layout)
const PROTO = { min: 8000, max: 9000, draws: 20 };

const g = await boot({ look: 'new' }); const { page } = g; await g.intoWorld();
const K = await page.evaluate(() => { const hash = b => { let h = 0; b.traverse(m => { if (!m.isMesh) return; const a = m.geometry.attributes.position.array; for (let i = 0; i < a.length; i += 3) h = (h * 31 + Math.round(a[i] * 1e4)) | 0; }); return h; };
  const A = PKIT.gl.farmstead({ kind: 'yard', r: PKIT.stream('a') }), B = PKIT.gl.farmstead({ kind: 'yard', r: PKIT.stream('a') }), U = A.userData;
  return { tris: U.tris, calls: U.calls, same: hash(A) === hash(B), lot: U.lot, foot: U.foot.map(p => p.name), lotOK: JSON.stringify(U.lot) === JSON.stringify(FARM_LOT), doors: U.doors.length }; });
check(`the kit's farmstead builds as the prototype's (${K.tris.toLocaleString()} triangles in ${K.calls} draws; ${K.foot.length} footprints, ${K.doors} doors on the yard), the same twice, its lot villageFarm's`,
  K.tris >= PROTO.min && K.tris <= PROTO.max && K.calls <= PROTO.draws && K.same && K.lotOK && ['Farmhouse', 'Byre', 'Barn'].every(n => K.foot.includes(n)), K);

const P = await page.evaluate(() => { anchoredPlaces(); const all = [], other = []; for (const c of CELLS.values()) { if (c.type === 'sea') continue; for (const t of c.sites) { if (t.kind !== 'village') continue;
    const F = villageFarm(t, c); if (nationOf(c.i, c.j).people !== 'gatelander') { if (F) other.push(t.id); continue; }
    const was = t._farm; delete t._farm; const F2 = villageFarm(t, c); t._farm = was;
    let road = 1e9; if (F) { const [ci, cj] = cellOf(t.x, t.z), byId = {}; for (let j = cj - 1; j <= cj + 1; j++) for (let i = ci - 1; i <= ci + 1; i++) if (i >= 0 && j >= 0 && i < GRID && j < GRID) getCell(i, j).sites.forEach(s => { byId[s.id] = s; });
      const cs = Math.cos(F.ry), sn = Math.sin(F.ry), fx = F.x + 0 * cs + FARM_LOT.z1 * sn, fz = F.z + FARM_LOT.z1 * cs; /* the front's middle */
      for (const d of c.roadDefs) if ((d.a === t.id || d.b === t.id) && byId[d.a] && byId[d.b]) { const pts = roadCurve(d, byId[d.a], byId[d.b]); for (let i = 0; i < pts.length - 1; i++) { const a = pts[i], b = pts[i + 1], vx = b.x - a.x, vz = b.z - a.z, l2 = vx * vx + vz * vz || 1; let u = ((fx - a.x) * vx + (fz - a.z) * vz) / l2; u = Math.max(0, Math.min(1, u)); road = Math.min(road, Math.hypot(fx - a.x - vx * u, fz - a.z - vz * u)); } } }
    all.push({ id: t.id, F, same: JSON.stringify(F) === JSON.stringify(F2), past: F ? Math.hypot(F.cx - t.x, F.cz - t.z) - (t.pad - 5) : null, road }); } }
  const farms = all.filter(v => v.F); let close = 0, gates = 0;
  for (let i = 0; i < farms.length; i++) for (let j = i + 1; j < farms.length; j++) if (Math.hypot(farms[i].F.cx - farms[j].F.cx, farms[i].F.cz - farms[j].F.cz) < 2 * FARM_R + 20) close++;
  for (const v of farms) { const [ci, cj] = cellOf(v.F.cx, v.F.cz); for (let j = cj - 1; j <= cj + 1; j++) for (let i = ci - 1; i <= ci + 1; i++) if (i >= 0 && j >= 0 && i < GRID && j < GRID) for (const e of getCell(i, j).doors) { if (e.wet) continue; const p = fixedDoorSpot(e); if (p && Math.hypot(p.x - v.F.cx, p.z - v.F.cz) < FARM_R + 30) gates++; } }
  return { n: all.length, farms: farms.length, same: all.every(v => v.same), past: [Math.min(...farms.map(v => v.past)), Math.max(...farms.map(v => v.past))], road: [Math.min(...farms.map(v => v.road)), Math.max(...farms.map(v => v.road))], close, gates, other, first: farms[0] && farms[0].id }; });
check(`villageFarm lays a farm by ${P.farms} of the Gatelands' ${P.n} villages, the same answer twice`, P.farms >= .9 * P.n && P.same, P);
check(`each farm's middle is ${P.past.map(v => v.toFixed(1)).join(' to ')} m past its village's last lots, its front ${P.road.map(v => v.toFixed(2)).join(' to ')} m off its road's line`, P.past[0] >= 60 && P.past[1] <= 150 && P.road[0] >= 10 && P.road[1] <= 10.5, P);
check(`no two farms on one another (${P.close}), none on a gate's or fort's spot (${P.gates}), none by another people's village (${P.other.length})`, !P.close && !P.gates && !P.other.length, P);

const tid = P.first;
check(`${tid}, the first of them, stands`, !!tid && await g.settle(tid));
const S = await page.evaluate(tid => { const S = WORLD.settle.get(tid), F = S.farm; if (!F) return { none: true }; const c = Math.cos(F.ry), s_ = Math.sin(F.ry), W = (u, v) => [F.x + u * c + v * s_, F.z - u * s_ + v * c], L = FARM_LOT;
  let dev = 0; for (let u = L.x0; u <= L.x1 + 1e-6; u += (L.x1 - L.x0) / 12) for (let v = L.z0; v <= L.z1 + 1e-6; v += (L.z1 - L.z0) / 12) { const [x, z] = W(u, v); dev = Math.max(dev, Math.abs(worldH(x, z) - F.y)); }
  const U = PKIT.gl.farmstead({ kind: 'yard' }).userData, sol = S.sol.filter(q => q.farm); let match = 0;
  for (const p of U.foot) { const [x, z] = W((p.x0 + p.x1) / 2, (p.z0 + p.z1) / 2), q = sol.find(q => q.farm === p.name && Math.abs(q.cx - x) < .01 && Math.abs(q.cz - z) < .01 && Math.abs(q.rx - (p.x1 - p.x0) / 2) < .01 && Math.abs(q.rz - (p.z1 - p.z0) / 2) < .01); if (q) match++; }
  const inside = ['Farmhouse', 'Byre', 'Barn'].every(n => { const p = U.foot.find(f => f.name === n), [x, z] = W((p.x0 + p.x1) / 2, (p.z0 + p.z1) / 2); return settleSolid(x, z, 0); });
  /* the walk: from 4 m out on the road side straight in through the gate, across the yard behind the house, and down its middle */
  let blocked = 0, walked = 0; const gx = U.gate.x, gz = U.gate.z, path = [[gx, gz + 4], [gx, -4.9], [0, -4.9], [0, -14]];
  for (let k = 0; k < path.length - 1; k++) { const [a, b] = [path[k], path[k + 1]], n = Math.ceil(Math.hypot(b[0] - a[0], b[1] - a[1]) / .25); for (let i = 0; i < n; i++) { const t = i / n, [x, z] = W(a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t); walked++; if (settleSolid(x, z, .35)) blocked++; } }
  const yard = U.yard.slice(0, 2).every(r => { const [x, z] = W((r.x0 + r.x1) / 2, (r.z0 + r.z1) / 2); return !settleSolid(x, z, .3); });
  const FS = S.group.children.find(o => o.name === 'farmstead'), far = S.group.children.find(o => o.name === 'farmstead far');
  return { F, dev, sol: sol.length, foot: U.foot.length, match, inside, blocked, walked, yard, calls: FS && FS.children.length, farTris: F.farTris, hasFar: !!far }; }, tid);
check(`the farm stands on its pad, flat under the whole lot (${S.dev != null ? S.dev.toFixed(3) : '?'} m at most off its floor)`, !S.none && S.dev < .05, S);
check(`its ${S.sol} solids are the kit's ${S.foot} footprints, turned and placed (${S.match} match); inside each building is solid, the yard behind the house and the band across it clear`, S.sol === S.foot && S.match === S.foot && S.inside && S.yard, S);
check(`the way in from the road through the gate into the yard is clear (${S.blocked} of ${S.walked} points 0.35 m from a solid)`, S.blocked === 0, S);
const L = await page.evaluate(tid => { const S = WORLD.settle.get(tid), F = S.farm, K = S.farmLod, out = {};
  for (const [k, d] of [['near', 20], ['far', 160]]) { CAM.position.set(F.cx + d, F.y + 2, F.cz); houseLod(); houseLod(); out[k] = { hi: K.hi.visible, lo: K.lo.visible }; } return out; }, tid);
check(`its far copy (${S.farTris} triangles) stands in for it from 160 m, the farmstead (${S.calls} draws) at 20 m`, L.near.hi && !L.near.lo && !L.far.hi && L.far.lo && S.hasFar && S.calls <= PROTO.draws, L);
await g.close();
