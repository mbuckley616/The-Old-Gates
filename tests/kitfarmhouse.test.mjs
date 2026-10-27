// The farmhouse of a Gatelands village's farm as a home on the new look (Session 1459; card F9, Michael's A on DECISION #303: the rooms
// inside the street's own shell, and his C on #744: a farm at each village's edge). The farm's house (S1455's villageFarm, the kit's
// farmstead) is a home now: its front door on the road side, a farmer who keeps it, and inside PKIT.gl.farmhouse (rooms.js's Session
// 1192), at its true size. In the first Gatelands village with a farm: the kit's room builds to the prototype's triangles and draws, the
// same twice; the home's door is the farmhouse's front door, outside the house's solid; the room is the house's inside, walled all round
// on both floors; you arrive clear, outside the door's reach; the straight stair climbs to the upper floor in steps you can take with a
// head's height over you; the prototype's seven walks are clear (the doors open); four doors hung; the parents' bed is the resident's and
// at night the resident lies in it; the home's chest upstairs has a side clear to open it from; a bought house's cellar hatch is clear;
// the four fires and the two lanterns light it, and a Mages' cold hearth is dark on all four until its task is done; E at the arrival
// spot keeps you in; and a picture of the kitchen. And the farmer's day (S1471): the yard by day, in at evening.
import { boot, check } from './lib/game.mjs';
import path from 'path'; import { fileURLToPath } from 'url';
const here = path.dirname(fileURLToPath(import.meta.url));
// the prototype's count (rooms.check.mjs, Session 1192: 9.7k triangles in 19 meshes on the shell's 2.1k)
const PROTO = { min: 9000, max: 10500, draws: 19 };

const g = await boot({ look: 'new' }); const { page } = g; await g.intoWorld();
const K = await page.evaluate(() => { const hash = b => { let h = 0; b.traverse(m => { if (!m.isMesh) return; const a = m.geometry.attributes.position.array; for (let i = 0; i < a.length; i += 3) h = (h * 31 + Math.round(a[i] * 1e4)) | 0; }); return h; };
  const A = PKIT.gl.farmhouse({}, PKIT.stream('a')), B = PKIT.gl.farmhouse({}, PKIT.stream('a')); return { tris: A.tris, draws: A.draws, same: hash(A.group) === hash(B.group) }; });
check(`the kit's room builds as the prototype's (${K.tris.toLocaleString()} triangles in ${K.draws} meshes), the same twice`, K.tris >= PROTO.min && K.tris <= PROTO.max && K.draws === PROTO.draws && K.same, K);

const tid = await page.evaluate(() => { anchoredPlaces(); for (const c of CELLS.values()) { if (c.type === 'sea' || nationOf(c.i, c.j).people !== 'gatelander') continue; for (const t of c.sites) if (t.kind === 'village' && villageFarm(t, c)) return t.id; } return null; });
check(`${tid}, the first Gatelands village with a farm, stands`, !!tid && await g.settle(tid));
const H = await page.evaluate(tid => { const S = WORLD.settle.get(tid), F = S.farm, h = S.houses.find(x => x.farm && x.kit && x.kit.kind === 'farm'); if (!h || !F) return null;
  const c = Math.cos(F.ry), s_ = Math.sin(F.ry), fx = F.x + 3.1 * s_, fz = F.z + 3.1 * c; /* the house's front, its middle */
  const sol = S.sol.find(q => q.farm === 'Farmhouse');
  return { id: h.id, name: h.name, keeper: h.keeper, kit: kitFarmhouse(h), door: Math.hypot(h.doorX - fx, h.doorZ - fz), inSolid: settleSolid(h.doorX, h.doorZ, 0), exitClear: !settleSolid(h.exitX, h.exitZ, .3), hid: sol && sol.hid === h.id && sol.bt === 'home',
    listed: ZONES.world.houses.includes(h), resident: S.residents.some(r => r.def === h.dlg) }; }, tid);
check(`its farmhouse is a home (${H && H.name}, ${H && H.keeper}'s), a kit farmhouse inside, listed, its farmer among the village's people`, !!H && H.kit && H.listed && H.resident && H.hid, H);
check(`the home's door is the farmhouse's front door (${H && H.door.toFixed(2)} m off its middle), outside the house's solid, the step out clear`, !!H && H.door < .2 && !H.inSolid && H.exitClear, H);

// the farmer's day (Session 1471, Michael's A on #762): out of the yard door in the morning, about the yard within 12 m of it by day,
// never in a solid; in by that door at evening, and the house has them in from 18h
const st = () => page.evaluate(tid => { const S = WORLD.settle.get(tid), res = S.residents.find(r => r.farm), n = res && res.n, Y = n && n.sched.yard, h = S.houses.find(x => x.farm);
  return { type: n && n.sched.type, pts: Y ? Y.pts.length : 0, vis: !!n && n.g.visible, d: n && Y ? +Math.hypot(n.g.position.x - Y.door.x, n.g.position.z - Y.door.z).toFixed(2) : 99,
    solid: !!n && settleSolid(n.g.position.x, n.g.position.z, .2), inside: npcInsideNow(h) }; }, tid);
await page.evaluate(tid => { forceTime(10); const F = WORLD.settle.get(tid).farm; px = F.x; pz = F.z + 12; }, tid);
await g.spin(null, 60); const day = [await st()]; for (let k = 0; k < 4; k++) { await g.spin(null, 600); day.push(await st()); }
check(`by day the farmer keeps the yard (${day[0].pts} spots): out of its door (${day[0].d} m), then ${day.slice(1).map(s => s.d).join(', ')} m from it, never in a solid`,
  day.every(s => s.type === 'farmer' && s.vis && s.d <= 12.5 && !s.solid) && day[0].d < 1 && day[0].pts >= 20, day);
await page.evaluate(() => forceTime(18.2)); await g.spin(null, 3600); const eve = await st();
check(`at evening the farmer goes in by the yard door (${eve.d} m from it, hidden), and the house has them in`, !eve.vis && eve.d < 1.5 && eve.inside, eve);
// S1478 — from wherever in the yard evening finds them: the walk from one spot in ten (the look builder saw one run in five go in 4.1 m
// off, where the straight line met the rick and npcStep gave up)
const ways = await page.evaluate(tid => new Promise(res => { const S = WORLD.settle.get(tid), m = S.residents.find(r => r.farm).n, Y = m.sched.yard, out = []; let i = 0;
  const one = () => { if (i >= Y.pts.length) return res(out); forceTime(18.2); const q = Y.pts[i]; m.g.visible = true; m._arrivedHide = false; m.g.position.x = q.x; m.g.position.z = q.z; m._stuck = 0; let k = 0;
    const f = () => { for (let j = 0; j < 60; j++) WORLD.tick(1 / 60, performance.now()); k += 60;
      if (!m.g.visible || k >= 2400) { out.push({ i, hid: !m.g.visible, d: +Math.hypot(m.g.position.x - Y.door.x, m.g.position.z - Y.door.z).toFixed(2) }); i += 10; setTimeout(one, 0); } else setTimeout(f, 0); }; f(); };
  one(); }), tid);
check(`from ${ways.length} spots of the yard the farmer goes in by its door (at most ${Math.max(...ways.map(w => w.d))} m from it)`, ways.length >= 2 && ways.every(w => w.hid && w.d < 1.5), ways.filter(w => !w.hid || w.d >= 1.5));

await page.evaluate(id => { forceTime(12); const h = ZONES.world.houses.find(x => x.id === id); px = h.exitX; pz = h.exitZ; goToInterior(h); }, H.id);
for (let k = 0; k < 40 && !(await page.evaluate(() => isInterior())); k++) await page.waitForTimeout(250);
await g.frames(2);
const r = await page.evaluate(() => {
  const h = currentHouse, T = h._farmhouse, W = h._roomW, D = h._roomD, X = T.inner.x1, Z = T.inner.z1, rx = x => X + x, rz = z => z + Z, F = T.floors.map(y => +(y - T.floors[0]).toFixed(3)); interiorScene.updateMatrixWorld(true);
  const meshes = []; let lights = 0, draws = 0, tris = 0; const inNpc = o => { for (let p = o; p; p = p.parent) if (p === intNPCMesh) return true; return false; };
  interiorScene.traverse(o => { if (o.isLight && !o.isAmbientLight && o.intensity > 0) lights++; if (o.isMesh && o.visible && !inNpc(o)) { draws++; tris += (o.geometry.index ? o.geometry.index.count : o.geometry.attributes.position.count) / 3; if (!o.isSkinnedMesh && !o.userData.daylight) meshes.push(o); } });
  const rc = new THREE.Raycaster(), O = new THREE.Vector3(), Dv = new THREE.Vector3();
  const hit = (x, y, z, dx, dy, dz, far = 14) => { O.set(x, y, z); Dv.set(dx, dy, dz).normalize(); rc.set(O, Dv); rc.far = far; const q = rc.intersectObjects(meshes, false)[0]; return q ? +q.distance.toFixed(3) : null; };
  // walled all round on both floors: every half metre along each wall at 0.6 and 2 m over each floor, a ray from the middle meets
  // something, but where the plan opens a window or the front door (it stands ajar; a pane lets a ray through)
  const holes = [...T.windows.map(q => ({ f: q.face, x: rx(q.x), y0: q.y - T.floors[0], y1: q.y + q.h - T.floors[0], w: q.w })), { f: 'front', x: rx(T.door.x), y0: 0, y1: T.door.h, w: T.door.w }];
  const inHole = (f, x, y) => holes.some(o => o.f === f && Math.abs(x - o.x) < o.w / 2 + .1 && y > o.y0 - .1 && y < o.y1 + .1);
  const open = []; for (const f of F) for (const y of [f + .6, f + 2.0]) { for (let x = .4; x < W - .3; x += .5) { if (!inHole('front', x, y) && hit(x, y, D / 2, 0, 0, 1, D) == null) open.push(['S', x, y]); if (!inHole('back', x, y) && hit(x, y, D / 2, 0, 0, -1, D) == null) open.push(['N', x, y]); }
    for (let z = .4; z < D - .3; z += .5) { if (hit(W / 2, y, z, 1, 0, 0, W) == null) open.push(['E', z, y]); if (hit(W / 2, y, z, -1, 0, 0, W) == null) open.push(['W', z, y]); } }
  const ax = intArriveX(h), az = intArrivalZ(h), exitZ = D - h._exitD, arrive = { x: +ax.toFixed(2), z: +az.toFixed(2), atDoor: Math.abs(intDoorX(h) - rx(T.door.x)) < .01, clear: !intSolidAt(ax, az, .3, 0), exits: az > exitZ };
  // the doors stand open for the walks (a shut leaf is a solid)
  const doorSol = new Set(INT_DOORS.map(d => d.sol)), keep = INT_SOL; INT_SOL = keep.filter(b => !doorSol.has(b));
  // the stair with the game's own ground, solids and ceiling: from the hall in front of its foot up the one flight to the landing at the back
  const sx = rx((T.steps[0].x0 + T.steps[0].x1) / 2), z0 = rz(T.steps[0].z1 + .35), z1 = rz(T.well.z0 - .4);
  let y = 0, maxStep = 0, blocked = 0, minHead = 99; { const n = Math.ceil(Math.abs(z1 - z0) / .04); for (let k = 0; k <= n; k++) { const z = z0 + (z1 - z0) * k / n;
    if (intSolidAt(sx, z, .25, y)) blocked++; const ny = footholdY(sx, z, y, 0); maxStep = Math.max(maxStep, ny - y); y = ny; minHead = Math.min(minHead, headCeil(sx, z, y) - y); } }
  const climb = { top: +y.toFixed(3), want: F[1], maxStep: +maxStep.toFixed(3), blocked, minHead: +minHead.toFixed(2) };
  // the prototype's seven walks (from the front door to the hearth, the parlour, the stair's foot; from the back door to the kitchen; from
  // the stair's top to the parents' room, the children's and the landing's window), on their floor, nothing within 0.15 m
  const walks = T.paths.map(P => { let blocked = [], off = 0; for (let i = 0; i + 1 < P.pts.length; i++) { const [a, b] = [P.pts[i], P.pts[i + 1]], n = Math.ceil(Math.hypot(b[0] - a[0], b[1] - a[1]) / .1);
    for (let k = 0; k <= n; k++) { const x = rx(a[0] + (b[0] - a[0]) * k / n), z = rz(a[1] + (b[1] - a[1]) * k / n); if (intSolidAt(x, z, .15, F[P.fl])) blocked.push([+x.toFixed(2), +z.toFixed(2)]); if (Math.abs(footholdY(x, z, F[P.fl], 0) - F[P.fl]) > .02) off++; } }
    return { fl: P.fl, blocked: blocked.length, at: blocked.slice(0, 3), off }; });
  INT_SOL = keep;
  const doors = INT_DOORS.map(d => ({ y: +d.y.toFixed(2), h: +d.h.toFixed(2) }));
  const bed = residentBed(), B = T.beds[0], inBed = !!bed && bed.x > rx(B.x0) && bed.x < rx(B.x1) && bed.cz > rz(B.z0) && bed.cz < rz(B.z1) && Math.abs(bed.y - F[1]) < .01;
  const box = INT_BOX, boxSide = box && Math.abs(box.y - F[1]) < .01 ? [[0, .62], [0, -.62], [.7, 0], [-.7, 0]].filter(([dx, dz]) => { const x = box.x + dx, z = box.z + dz; return x > .3 && x < W - .3 && z > .3 && z < D - .3 && !intSolidAt(x, z, .25, F[1]); }).length : 0;
  const boxFree = box && !keep.some(b => b !== keep[keep.length - 1] && b.y0 < F[1] + .5 && b.y1 > F[1] + .05 && box.x + .3 > b.x0 && box.x - .3 < b.x1 && box.z + .26 > b.z0 && box.z - .26 < b.z1 && !(Math.abs(b.x0 - (box.x - .32)) < 1e-6 && Math.abs(b.z0 - (box.z - .28)) < 1e-6));
  const fire = interiorScene.children.find(c => c.userData && c.userData.hearthFire);
  return { W, D, F, want: [+(T.w - 1).toFixed(3), +(T.d - 1).toFixed(3)], open, arrive, exitZ: +exitZ.toFixed(2), climb, walks, doors, bed: bed && { x: +bed.x.toFixed(2), cz: +bed.cz.toFixed(2), owner: bed.owner }, inBed, box: !!box, boxSide, boxFree, lights, draws, tris: Math.round(tris),
    fireOn: !!fire && fire.userData.hearthFire.visible && fire.userData.hearthLights.length === 4 && fire.userData.hearthLights.every(l => l.intensity > 0) };
});
check(`the room is the house's inside, ${r.W} by ${r.D} m (${r.want.join(' by ')}), at its true size`, Math.abs(r.W - r.want[0]) < .01 && Math.abs(r.D - r.want[1]) < .01, r);
check(`walled all round on both floors (${r.open.length} openings at 0.6 or 2 m over a floor)`, r.open.length === 0, r.open.slice(0, 8));
check(`you arrive clear at ${r.arrive.x}, ${r.arrive.z} m, at the door, outside its reach (from ${r.exitZ} m)`, r.arrive.atDoor && r.arrive.clear && !r.arrive.exits, r.arrive);
check(`the stair climbs to the upper floor at ${r.climb.top} m in steps of ${r.climb.maxStep} m or less, nothing in the way, ${r.climb.minHead} m over the head`, Math.abs(r.climb.top - r.climb.want) < .01 && r.climb.maxStep <= .4 && r.climb.blocked === 0 && r.climb.minHead >= 1.8, r.climb);
check(`the seven walks are clear on their floors (${r.walks.map(w => w.blocked).join(', ')} points in something)`, r.walks.length === 7 && r.walks.every(w => w.blocked === 0 && w.off === 0), r.walks);
check(`four doors hung (${r.doors.map(d => d.y).join(', ')} m up), each ${[...new Set(r.doors.map(d => d.h))].join(' or ')} m high`, r.doors.length === 4 && r.doors.every(d => d.h > 1.9 && d.h < 2.1), r.doors);
check(`the parents' bed is the resident's (${r.bed && r.bed.owner}, at ${r.bed && [r.bed.x, r.bed.cz].join(', ')}); the home's chest upstairs stands clear of the furniture, ${r.boxSide} sides clear to open it from`, r.inBed && r.bed.owner === 'home' && r.box && r.boxFree && r.boxSide >= 1, r);
check(`lit by the four fires and the two lanterns (${r.lights} lights, 10 or fewer), ${r.draws} draws (60 or fewer), ${r.tris.toLocaleString()} triangles`, r.fireOn && r.lights >= 6 && r.lights <= 10 && r.draws <= 60, r);

// at night the resident lies in the bed; a bought house has its cellar hatch, clear; a Mages' cold hearth is dark until done
const more = await page.evaluate(() => { const h = currentHouse, rebuild = () => { WORLD.buildInteriorFor(h); scene = interiorScene; };
  forceTime(22); rebuild(); const res22 = intNPCMesh ? { x: +intNPCPos.x.toFixed(2), z: +intNPCPos.z.toFixed(2), clear: !intSolidAt(intNPCPos.x, intNPCPos.z, .2, 0) } : null;
  forceTime(1); rebuild(); const am = intNPCMesh && intNPCMesh.userData.asleep, b = residentBed(), asleep = !!am && !!b && Math.abs(am.x - b.x) < .01 && Math.abs(am.z - b.z) < .01;
  const pts = () => { const a = []; interiorScene.traverse(o => { if (o.isPointLight && o.intensity > 0) a.push(o); }); return a; }, abed = { lamps: pts().filter(l => l.color.getHex() === 0xffaa44).length, fire: Math.max(...pts().filter(l => l.color.getHex() === 0xff6a20).map(l => +l.intensity.toFixed(3))) };
  forceTime(12); h.ownedByPlayer = true; rebuild(); const hatch = HATCH.active ? { x: +HATCH.x.toFixed(2), z: +HATCH.z.toFixed(2), clear: !intSolidAt(HATCH.x, HATCH.z, .2, 0) && [[0, .6], [0, -.6], [.6, 0], [-.6, 0]].some(([dx, dz]) => !intSolidAt(HATCH.x + dx, HATCH.z + dz, .3, 0)) } : null; h.ownedByPlayer = false;
  const G = worldState.guild || (worldState.guild = {}); G.guild_m = G.guild_m || {}; const was = G.guild_m.active; G.guild_m.active = { kind: 'hearth', done: false, house: h.id, siteId: h.siteId };
  rebuild(); const holder = interiorScene.children.find(c => c.userData && c.userData.hearthFire), cold = !!holder && !holder.userData.hearthFire.visible && holder.userData.hearthLights.every(l => l.intensity === 0);
  G.guild_m.active.done = true; WORLD.tickInterior(1 / 60, performance.now()); const lit = !!holder && holder.userData.hearthFire.visible && holder.userData.hearthLights.every(l => l.intensity > 0);
  G.guild_m.active = was; rebuild(); return { res22, asleep, abed, hatch, cold, lit }; });
check(`at 22h the resident is in, standing clear in the kitchen at ${more.res22 && [more.res22.x, more.res22.z].join(', ')}`, !!more.res22 && more.res22.clear, more.res22);
check(`at night the resident lies in the parents' bed`, more.asleep, more);
check(`a household abed has one lantern lit (${more.abed.lamps}, the landing's) and its grates banked (${more.abed.fire}, 0.4 of theirs)`, more.abed.lamps === 1 && more.abed.fire > 0 && more.abed.fire <= .4, more.abed);
check(`a bought house's cellar hatch lies in the hall's flags at ${more.hatch && [more.hatch.x, more.hatch.z].join(', ')}, clear to stand by`, !!more.hatch && more.hatch.clear, more.hatch);
check(`a Mages' cold hearth shows no fire and no light on the four, and they catch when its task is done`, more.cold && more.lit, more);

await page.evaluate(() => { forceTime(12); WORLD.buildInteriorFor(currentHouse); scene = interiorScene; const h = currentHouse; px = intArriveX(h); pz = intArrivalZ(h); jumpY = 0; interact(); });
await g.frames(30);
check(`at the arrival spot E does not take you out`, await page.evaluate(() => isInterior()));
await page.evaluate(() => { const h = currentHouse, T = h._farmhouse, X = T.inner.x1, Z = T.inner.z1; try { closeDialog(); } catch (e) {} VM_SCENE.visible = false; px = X + 1.15; pz = Z + 2.1; jumpY = 0; yaw = -1.05; pitch = -.1; });
await g.frames(6); await page.screenshot({ path: path.join(here, '../docs/prototypes/kit-farmhouse-kitchen.png') });
console.log('  (picture: docs/prototypes/kit-farmhouse-kitchen.png)');
await page.evaluate(() => { exitInterior(); });
for (let k = 0; k < 40 && (await page.evaluate(() => isInterior())); k++) await page.waitForTimeout(250);
// the byre (Session 1480): its half-door nearer the farmhouse's yard door opens into the byre's own room (PKIT.gl.byre, rooms.js's
// Session 1198), never locked, nobody in; the walks along the passage clear, the hay loft out of reach (2.1 m to the slate at most)
const BY = await page.evaluate(tid => { const S = WORLD.settle.get(tid), h = S.houses.find(x => x.type === 'byre'), F = S.farm; if (!h || !F) return null;
  const sol = S.sol.find(q => q.farm === 'Byre'), inSol = (x, z) => { const dx = x - sol.cx, dz = z - sol.cz, lx = dx * sol.c - dz * sol.s, lz = dx * sol.s + dz * sol.c; return Math.abs(lx) < sol.rx && Math.abs(lz) < sol.rz; };
  forceTime(2); const night = WORLD.doorLockNow(h);
  return { id: h.id, name: h.name, door: [+h.doorX.toFixed(2), +h.doorZ.toFixed(2)], onWall: !inSol(h.doorX - (h.exitX - h.doorX) * .2, h.doorZ - (h.exitZ - h.doorZ) * .2) ? false : !inSol(h.exitX, h.exitZ), exitClear: !settleSolid(h.exitX, h.exitZ, .3), listed: ZONES.world.houses.includes(h), night, farmhouse: S.houses.find(x => x.farm) === S.houses.find(x => x.kit && x.kit.kind === 'farm') }; }, tid);
check(`the byre is a door of its own (${BY && BY.name}), on the byre's wall, the step out clear, never locked (at 2h: ${BY && JSON.stringify(BY.night)}), the farmhouse still the farm's home`, !!BY && BY.onWall && BY.exitClear && BY.listed && !BY.night && BY.farmhouse, BY);
await page.evaluate(id => { forceTime(12); const h = ZONES.world.houses.find(x => x.id === id); px = h.exitX; pz = h.exitZ; goToInterior(h); }, BY.id);
for (let k = 0; k < 40 && !(await page.evaluate(() => isInterior())); k++) await page.waitForTimeout(250);
await g.frames(2);
const b = await page.evaluate(() => {
  const h = currentHouse, T = h._byre; if (!T) return null; const W = h._roomW, D = h._roomD, X = T.inner.x1, Z = T.inner.z1, rx = x => X + x, rz = z => z + Z, F = T.floors.map(y => +(y - T.floors[0]).toFixed(3)); interiorScene.updateMatrixWorld(true);
  let lights = 0, draws = 0, tris = 0; interiorScene.traverse(o => { if (o.isLight && !o.isAmbientLight && !o.isHemisphereLight && o.intensity > 0) lights++; if (o.isMesh && o.visible) { draws++; tris += (o.geometry.index ? o.geometry.index.count : o.geometry.attributes.position.count) / 3; } });
  const ax = intArriveX(h), az = intArrivalZ(h), arrive = { x: +ax.toFixed(2), z: +az.toFixed(2), clear: !intSolidAt(ax, az, .3, 0), exits: az > D - h._exitD, floor: footholdY(ax, az, 0, 0) };
  const walks = T.paths.map(P => { let blocked = [], off = 0; for (let i = 0; i + 1 < P.pts.length; i++) { const [a, c] = [P.pts[i], P.pts[i + 1]], n = Math.ceil(Math.hypot(c[0] - a[0], c[1] - a[1]) / .1);
    for (let k = 0; k <= n; k++) { const x = rx(a[0] + (c[0] - a[0]) * k / n), z = rz(a[1] + (c[1] - a[1]) * k / n); if (intSolidAt(x, z, .15, F[P.fl])) blocked.push([+x.toFixed(2), +z.toFixed(2)]); if (Math.abs(footholdY(x, z, F[P.fl], 0) - F[P.fl]) > .02) off++; } }
    return { fl: P.fl, blocked: blocked.length, at: blocked.slice(0, 3), off }; });
  // the loft (2.1 m to the slate under the ridge) is out of reach: under it the head stops at the joists, and no foothold stands over the step
  const ux = rx(-3), uz = rz(1.2), under = +(headCeil(ux, uz, 0)).toFixed(2), high = FOOTHOLDS.filter(f => (f.y || 0) > .7).length;
  return { W, D, want: [+(T.inner.x1 - T.inner.x0).toFixed(2), +(T.inner.z1 - T.inner.z0).toFixed(2)], lights, draws, tris: Math.round(tris), arrive, walks: walks.filter(w => w.fl === 0), under, joists: +(T.loft.joists - T.floors[0]).toFixed(2), high, npc: !!intNPCMesh }; });
check(`inside is the byre's room, ${b && b.W.toFixed(1)} by ${b && b.D.toFixed(1)} m, at its true size, with nobody in it`, !!b && Math.abs(b.W - b.want[0]) < .01 && Math.abs(b.D - b.want[1]) < .01 && !b.npc, b);
check(`you arrive clear in the passage at ${b && [b.arrive.x, b.arrive.z].join(', ')}, on its flags, outside the door's reach`, !!b && b.arrive.clear && !b.arrive.exits && Math.abs(b.arrive.floor) < .02, b && b.arrive);
check(`the prototype's four walks on the passage are clear (${b && b.walks.map(w => w.blocked).join(', ')} points in something)`, !!b && b.walks.length === 4 && b.walks.every(w => !w.blocked && !w.off), b && b.walks);
check(`the hay loft is out of reach: under it a jump's head stops at its joists (${b && b.under} m, ${b && b.joists}), no foothold above 0.7 m (${b && b.high})`, !!b && Math.abs(b.under - b.joists) < .02 && b.high === 0, b);
check(`lit by its two lanterns (${b && b.lights}), ${b && b.draws} draws (20 or fewer), ${b && b.tris.toLocaleString()} triangles`, !!b && b.lights === 2 && b.draws <= 20, b);
await page.evaluate(() => { forceTime(12); WORLD.buildInteriorFor(currentHouse); scene = interiorScene; const h = currentHouse; px = intArriveX(h); pz = intArrivalZ(h); jumpY = 0; interact(); });
await g.frames(30);
check(`at the byre's arrival spot E does not take you out`, await page.evaluate(() => isInterior()));
await page.evaluate(() => { const h = currentHouse, T = h._byre, X = T.inner.x1, Z = T.inner.z1; try { closeDialog(); } catch (e) {} VM_SCENE.visible = false; px = X + 4.0; pz = Z + 1.5; jumpY = 0; yaw = 1.3; pitch = .02; });
await g.frames(6); await page.screenshot({ path: path.join(here, '../docs/prototypes/kit-byre-passage.png') });
console.log('  (picture: docs/prototypes/kit-byre-passage.png)');
await page.evaluate(() => { exitInterior(); });
for (let k = 0; k < 40 && (await page.evaluate(() => isInterior())); k++) await page.waitForTimeout(250);
// the barn (Session 1475): its cart arch or stable door, whichever is nearer the farmhouse's yard door, opens into the barn's rooms
// (PKIT.gl.barn, rooms.js's Session 1198): the cart bay and the stable below, the stair of 16 risers up the west gable to the loft
const BN = await page.evaluate(tid => { const S = WORLD.settle.get(tid), h = S.houses.find(x => x.type === 'barn'); if (!h) return null;
  const sol = S.sol.find(q => q.farm === 'Barn'), inSol = (x, z) => { const dx = x - sol.cx, dz = z - sol.cz, lx = dx * sol.c - dz * sol.s, lz = dx * sol.s + dz * sol.c; return Math.abs(lx) < sol.rx && Math.abs(lz) < sol.rz; };
  forceTime(2); const night = WORLD.doorLockNow(h);
  return { id: h.id, name: h.name, door: h.kit.door, onWall: inSol(h.doorX - (h.exitX - h.doorX) * .2, h.doorZ - (h.exitZ - h.doorZ) * .2) && !inSol(h.exitX, h.exitZ), exitClear: !settleSolid(h.exitX, h.exitZ, .3), listed: ZONES.world.houses.includes(h), night }; }, tid);
check(`the barn is a door of its own (${BN && BN.name}, its ${BN && (BN.door ? 'stable door' : 'cart arch')}), on the barn's wall, the step out clear, never locked (at 2h: ${BN && JSON.stringify(BN.night)})`, !!BN && BN.onWall && BN.exitClear && BN.listed && !BN.night, BN);
await page.evaluate(id => { forceTime(12); const h = ZONES.world.houses.find(x => x.id === id); px = h.exitX; pz = h.exitZ; goToInterior(h); }, BN.id);
for (let k = 0; k < 40 && !(await page.evaluate(() => isInterior() && currentHouse && currentHouse.type === 'barn')); k++) await page.waitForTimeout(250);
await g.frames(2);
const n = await page.evaluate(() => {
  const h = currentHouse, T = h._barn; if (!T) return null; const W = h._roomW, D = h._roomD, X = T.inner.x1, Z = T.inner.z1, rx = x => X + x, rz = z => z + Z, F = T.floors.map(y => +(y - T.floors[0]).toFixed(3)); interiorScene.updateMatrixWorld(true);
  let lights = 0, day = 0, draws = 0, tris = 0; interiorScene.traverse(o => { if (o.isLight && o.userData.daylight) { day++; return; } if (o.isLight && !o.isAmbientLight && !o.isHemisphereLight && o.intensity > 0) lights++; if (o.isMesh && o.visible) { draws++; tris += (o.geometry.index ? o.geometry.index.count : o.geometry.attributes.position.count) / 3; } });
  const ax = intArriveX(h), az = intArrivalZ(h), arrive = { x: +ax.toFixed(2), z: +az.toFixed(2), clear: !intSolidAt(ax, az, .3, 0), exits: az > D - h._exitD, floor: footholdY(ax, az, 0, 0) };
  // S1488: the way you face on arriving (the room's _arriveYaw), and how far the line you face runs along the floor before it meets a solid
  { const ya = h._arriveYaw != null ? h._arriveYaw : 0; let d = 0; while (d < 6 && !intSolidAt(ax - Math.sin(ya) * d, az - Math.cos(ya) * d, .05, 0)) d += .05; arrive.yaw = ya; arrive.sight = +d.toFixed(2); }
  const walks = T.paths.map(P => { let blocked = [], off = 0; for (let i = 0; i + 1 < P.pts.length; i++) { const [a, c] = [P.pts[i], P.pts[i + 1]], m = Math.ceil(Math.hypot(c[0] - a[0], c[1] - a[1]) / .1);
    for (let k = 0; k <= m; k++) { const x = rx(a[0] + (c[0] - a[0]) * k / m), z = rz(a[1] + (c[1] - a[1]) * k / m); if (intSolidAt(x, z, .15, F[P.fl])) blocked.push([+x.toFixed(2), +z.toFixed(2)]); if (Math.abs(footholdY(x, z, F[P.fl], 0) - F[P.fl]) > .02) off++; } }
    return { fl: P.fl, blocked: blocked.length, at: blocked.slice(0, 3), off }; });
  // the stair with the game's own ground, solids and ceiling: from the bay in front of its foot up the one flight to the landing at the back
  const sx = rx((T.steps[0].x0 + T.steps[0].x1) / 2), z0 = rz(T.steps[0].z1 + .35), z1 = rz(T.well.z0 - .4);
  let y = 0, maxStep = 0, blocked = 0, minHead = 99; { const m = Math.ceil(Math.abs(z1 - z0) / .04); for (let k = 0; k <= m; k++) { const z = z0 + (z1 - z0) * k / m;
    if (intSolidAt(sx, z, .25, y)) blocked++; const ny = footholdY(sx, z, y, 0); maxStep = Math.max(maxStep, ny - y); y = ny; minHead = Math.min(minHead, headCeil(sx, z, y) - y); } }
  const climb = { top: +y.toFixed(3), want: F[1], maxStep: +maxStep.toFixed(3), blocked, minHead: +minHead.toFixed(2) };
  return { W, D, want: [+(T.inner.x1 - T.inner.x0).toFixed(2), +(T.inner.z1 - T.inner.z0).toFixed(2)], lights, day, draws, tris: Math.round(tris), arrive, walks, climb, npc: !!intNPCMesh }; });
check(`inside is the barn's room, ${n && n.W.toFixed(1)} by ${n && n.D.toFixed(1)} m, at its true size, with nobody in it`, !!n && Math.abs(n.W - n.want[0]) < .01 && Math.abs(n.D - n.want[1]) < .01 && !n.npc, n);
check(`you arrive clear at ${n && [n.arrive.x, n.arrive.z].join(', ')}, on the floor, outside the door's reach`, !!n && n.arrive.clear && !n.arrive.exits && Math.abs(n.arrive.floor) < .02, n && n.arrive);
check(`you arrive facing into the barn with ${n && n.arrive.sight} m clear before the eye (2.5 or more; a stall's post stood 0.9 m off, S1488)`, !!n && n.arrive.sight >= 2.5, n && n.arrive);
check(`the prototype's five walks are clear on their floors, through the partition's doorway and across the loft (${n && n.walks.map(w => w.blocked).join(', ')} points in something)`, !!n && n.walks.length === 5 && n.walks.every(w => !w.blocked && !w.off), n && n.walks);
check(`the stair climbs to the loft at ${n && n.climb.want} m in steps of ${n && n.climb.maxStep} m or less, nothing in the way, ${n && n.climb.minHead} m over the head`, !!n && Math.abs(n.climb.top - n.climb.want) < .02 && n.climb.maxStep <= .2 && !n.climb.blocked && n.climb.minHead >= 1.9, n && n.climb);
check(`lit by its three lanterns (${n && n.lights}), ${n && n.draws} draws (20 or fewer), ${n && n.tris.toLocaleString()} triangles`, !!n && n.lights === 3 && n.draws <= 20, n);
check(`at noon the day comes in through both doorways and the pitching door (${n && n.day} sky spots; the slits light only themselves, S1489)`, !!n && n.day === 3, n);
await page.evaluate(() => { forceTime(12); WORLD.buildInteriorFor(currentHouse); scene = interiorScene; const h = currentHouse; px = intArriveX(h); pz = intArrivalZ(h); jumpY = 0; interact(); });
await g.frames(30);
check(`at the barn's arrival spot E does not take you out`, await page.evaluate(() => isInterior()));
await page.evaluate(() => { const h = currentHouse, T = h._barn, X = T.inner.x1, Z = T.inner.z1; try { closeDialog(); } catch (e) {} VM_SCENE.visible = false; px = X + .1; pz = Z + 2.0; jumpY = 0; yaw = 1.3; pitch = .12; });
await g.frames(6); await page.screenshot({ path: path.join(here, '../docs/prototypes/kit-barn-bay.png') });
console.log('  (picture: docs/prototypes/kit-barn-bay.png)');
await page.evaluate(() => { exitInterior(); });
for (let k = 0; k < 40 && (await page.evaluate(() => isInterior())); k++) await page.waitForTimeout(250);
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
