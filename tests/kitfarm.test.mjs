// A Gatelands village's farm on the new look (Session 1455; card F6, Michael's C on DECISION #744: a farm at each village's edge, and a
// few alone in the country, the second half a later session's; the farmstead round its yard behind the house, his A on #498). The kit's
// farmstead (PKIT.gl.farmstead, copied from pieces.js's Session 1194) builds as the prototype's, the same twice. villageFarm lays one
// beside a road out of each Gatelands village, its middle 60 to 150 m past the last lots, its front 10.2 m off the road (clear of its bed) and its gate to it,
// from the cells alone: the same answer twice, none on another people's village, no two farms or a farm and a gate's or fort's pad on
// one another. In the first village: the farm stands on its own pad, flat under the whole lot; its buildings, walls and things in the
// yard are solids that match the kit's footprints, and the way in from the road through the gate to the yard is clear; its far copy
// stands in for it from outside 80 m, its 20 draws near.
// Session 1473 (#744 C's second half): loneFarms lays one farm (one Gatelands cell in three, two) beside a road between the cell's
// places, from the cells alone: the same answer twice, only in the Gatelands, each LONE_GAP farther from every pad than a village's farm
// and as far from every other farm, none on a gate's spot, the ground across its lot rising 5 m at most, among the fields (farmOpen). The one nearest the start
// stands as a place of its own: its farmstead and pad as a village's, a home with a farmer, its door taking you into the farmhouse's room.
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
const N = await page.evaluate(() => { const all = [], other = []; let cells = 0;
  for (const c of CELLS.values()) { if (c.type === 'sea') continue; const gl = nationOf(c.i, c.j).people === 'gatelander'; if (gl && !c.home) cells++;
    const L = loneFarms(c), was = c._lone; if (!gl && L.length) other.push(c.i + ',' + c.j); if (!gl) continue;
    delete c._lone; for (const F of was) delete F._site; const L2 = loneFarms(c); c._lone = was; for (const F of L) all.push({ F, c, same: JSON.stringify(L) === JSON.stringify(L2) }); }
  const vf = []; for (const c of CELLS.values()) if (c.type !== 'sea') for (const t of c.sites) if (t.kind === 'village') { const F = villageFarm(t, c); if (F) vf.push(F); }
  let pad = 1e9, near = 1e9, gates = 0, rise = 0, open = 9;
  for (const { F, c } of all) { for (let dj = -1; dj <= 1; dj++) for (let di = -1; di <= 1; di++) { const n = getCell(c.i + di, c.j + dj); if (!n) continue;
      for (const s of n.sites) if (s.pad > 0) pad = Math.min(pad, Math.hypot(F.cx - s.x, F.cz - s.z) - (s.pad + Math.max(30, s.pad * .7) + FARM_R + 5));
      for (const e of n.doors) { if (e.wet) continue; const p = fixedDoorSpot(e); if (p && Math.hypot(p.x - F.cx, p.z - F.cz) < FARM_R + 30) gates++; } }
    for (const G of all.map(a => a.F).concat(vf)) if (G !== F) near = Math.min(near, Math.hypot(G.cx - F.cx, G.cz - F.cz));
    open = Math.min(open, farmOpen(F.cx, F.cz, [-1, 0, 1].flatMap(dj => [-1, 0, 1].map(di => getCell(c.i + di, c.j + dj))).filter(Boolean)));
    const cs = Math.cos(F.ry), sn = Math.sin(F.ry); let lo = 1e9, hi = -1e9; for (const [u, v] of [[FARM_LOT.x0, FARM_LOT.z0], [FARM_LOT.x1, FARM_LOT.z0], [FARM_LOT.x0, FARM_LOT.z1], [FARM_LOT.x1, FARM_LOT.z1]]) { const y = landH(F.x + u * cs + v * sn, F.z - u * sn + v * cs); lo = Math.min(lo, y); hi = Math.max(hi, y); } rise = Math.max(rise, hi - lo); }
  let first = null, fd = 1e9; for (const { F } of all) { const d = Math.hypot(F.cx - px, F.cz - pz); if (d < fd) { fd = d; first = F.id; } }
  return { n: all.length, cells, same: all.every(a => a.same), other, pad, near, gap: LONE_GAP, gates, rise, open, want: LONE_OPEN, first }; });
check(`loneFarms lays ${N.n} farms alone in the country over the Gatelands' ${N.cells} cells, the same answer twice, none in another people's (${N.other.length})`, N.n >= 5 && N.n <= N.cells * 2 && N.same && !N.other.length, N);
check(`each stands ${N.pad.toFixed(0)} m or more past a village farm's margin from every pad, ${N.near.toFixed(0)} m or more from another farm, none on a gate's spot (${N.gates}), its lot rising ${N.rise.toFixed(2)} m at most, in open country (fields less woods ${N.open.toFixed(2)} or more)`, N.open >= N.want && N.pad >= N.gap && N.near >= 2 * 23 + 20 + N.gap && !N.gates && N.rise <= 5.01, N);
check(`${N.first}, the lone farm nearest the start, stands`, !!N.first && await g.settle(N.first));
const LF = await page.evaluate(id => { const S = WORLD.settle.get(id), F = S.farm, h = S.houses[0]; if (!F || !h) return { none: true }; const c = Math.cos(F.ry), s_ = Math.sin(F.ry), L = FARM_LOT;
  let dev = 0; for (let u = L.x0; u <= L.x1 + 1e-6; u += (L.x1 - L.x0) / 8) for (let v = L.z0; v <= L.z1 + 1e-6; v += (L.z1 - L.z0) / 8) dev = Math.max(dev, Math.abs(worldH(F.x + u * c + v * s_, F.z - u * s_ + v * c) - F.y));
  const sol = S.sol.find(q => q.farm === 'Farmhouse');
  return { name: S.site.name, id: h.id, house: h.name, kit: kitFarmhouse(h), listed: ZONES.world.houses.includes(h), resident: S.residents.some(r => r.def === h.dlg), keepsYard: S.residents.some(r => r.def === h.dlg && r.farm) && !!(F.yard && F.yardDoor), sol: S.sol.length, home: sol && sol.hid === h.id, dev, exitClear: !settleSolid(h.exitX, h.exitZ, .3), calls: S.group.children.find(o => o.name === 'farmstead').children.length }; }, N.first);
check(`it is ${LF.name}: the farmstead (${LF.calls} draws) on its flat pad (${LF.dev != null ? LF.dev.toFixed(3) : '?'} m), ${LF.sol} solids, its farmhouse a home with its farmer, the step out clear`, !LF.none && LF.dev < .05 && LF.sol === K.foot.length && LF.home && LF.kit && LF.listed && LF.resident && LF.exitClear && LF.house === LF.name, LF);
// Session 1482: a lone farm on the map. Its name is known before it is built (loneFarmName, the farmer's stream's first two draws) and
// is the built house's; standing by it discovers it; the map's entries for its cell carry it with its own icon; the search finds it;
// fast travel puts you on the road's verge in front of it, clear of its solids, facing it.
const MP = await page.evaluate(id => { const S = WORLD.settle.get(id), t = siteAnywhere(id), F = t._farm, [ci, cj] = cellOf(t.x, t.z);
  const pre = loneFarmName(t); if (worldState.wdisc) delete worldState.wdisc[id]; const before = discovered(id);
  px = t.x; pz = t.z; for (let i = 0; i < 3; i++) tickDiscovery(1); const after = discovered(id);
  const e = mapEntries(getCell(ci, cj)).find(x => x.id === id);
  let search = null; const box = document.getElementById('wm-results'); if (box) { mapSearch(t.name.slice(0, 6)); search = [...box.querySelectorAll('.wm-res')].some(el => el.textContent.includes(t.name)); box.style.display = 'none'; }
  const a = arrivalFor(id); const cs = Math.cos(F.ry), sn = Math.sin(F.ry), dx = a.x - F.x, dz = a.z - F.z, lu = dx * cs - dz * sn, lv = dx * sn + dz * cs;
  const look = { x: -Math.sin(a.yaw), z: -Math.cos(a.yaw) }, toF = { x: t.x - a.x, z: t.z - a.z }, faces = (look.x * toF.x + look.z * toF.z) / Math.hypot(toF.x, toF.z);
  px = t.x + 900; pz = t.z; const went = fastTravel(id);
  return { pre, built: t.name, house: S.houses[0].name, before, after, entry: e ? { kind: e.kind, name: e.name, sub: e.sub } : null, search, a: { x: +a.x.toFixed(2), z: +a.z.toFixed(2) }, lu: +lu.toFixed(2), lv: +lv.toFixed(2), clear: !settleSolid(a.x, a.z, .3), faces: +faces.toFixed(3), went, ax: a.x, az: a.z, z1: FARM_LOT.z1 }; }, N.first);
for (let k = 0; k < 120 && (MP.at = await page.evaluate(([x, z]) => Math.hypot(px - x, pz - z), [MP.ax, MP.az])) > .5; k++) await page.waitForTimeout(250);
check(`a lone farm is named before it is built (${MP.pre}), the built house's name (${MP.house})`, MP.pre === MP.built && MP.pre === MP.house, MP);
check(`standing by it discovers it, and the map carries it in its cell (kind ${MP.entry && MP.entry.kind}, ${MP.entry && MP.entry.sub})${MP.search == null ? '' : ', the search finds it'}`, !MP.before && MP.after && MP.entry && MP.entry.kind === 'farm' && MP.entry.name === MP.built && MP.search !== false, MP);
check(`fast travel puts you on the road's verge ${MP.lv} m out from its lot's origin, past the front at ${MP.z1} (${MP.lu} across), clear of its solids, facing it (${MP.faces})`, MP.went && MP.at < .5 && MP.clear && Math.abs(MP.lu) < .01 && MP.lv > MP.z1 && MP.faces > .9, MP);
await page.evaluate(id => { forceTime(12); const h = ZONES.world.houses.find(x => x.id === id); px = h.exitX; pz = h.exitZ; goToInterior(h); }, LF.id);
for (let k = 0; k < 40 && !(await page.evaluate(() => isInterior())); k++) await page.waitForTimeout(250);
const IN = await page.evaluate(() => ({ inside: isInterior(), id: currentHouse && currentHouse.id, room: !!(currentHouse && currentHouse._farmhouse), w: currentHouse && currentHouse._roomW, d: currentHouse && currentHouse._roomD }));
check(`its farmer keeps the yard by day, as the village farm's (S1471's rule: the resident marked a farmer's, the yard and its door on the farm)`, !!LF.keepsYard, LF);
check(`its door takes you into the farmhouse's own room (${IN.w && IN.w.toFixed(1)} by ${IN.d && IN.d.toFixed(1)} m)`, IN.inside && IN.id === LF.id && IN.room, IN);
await g.close();
