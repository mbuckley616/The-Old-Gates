// The town's coaching inn inside on the new look (Session 1368; card F9, Michael's A on DECISION #660: three rooms to let across the
// first floor's front, eight in all). On ?look=new a Gatelands town's first inn is the kit's coaching inn on its plot (S1339, S1343),
// and inside it is PKIT.gl.coachRoom (rooms.js's Session 1351) at its true size, not scaled. In Dunmore, entered as you enter it: the
// kit's room builds to the prototype's triangles and draws, the same twice; the room is the front's inside (11.7 by 8.1 m, so no longer
// deeper than the house, the critic's s863), walled all round on all three floors; you arrive clear at the door; the dog-leg stair
// climbs both storeys in steps you can take with a head's height over you; each corridor runs clear from the stair head to its last
// door; eight rooms with doors, a bed to let in each behind its door, as the innkeeper names them; the innkeeper behind the bar and in
// reach across it; the cellar's hatch clear; the room lit inside its budget; and a picture from the door.
import { boot, check } from './lib/game.mjs';
import path from 'path'; import { fileURLToPath } from 'url';
const here = path.dirname(fileURLToPath(import.meta.url));
// the prototype's counts for the rooms way (rooms.check.mjs, Session 1351: 12,680 to 12,920 in 20 draws, by key)
const PROTO = { min: 12600, max: 13000, draws: 20 };

const g = await boot({ look: 'new' }); const { page } = g; await g.intoWorld();
check('Dunmore stands on the new look', await g.settle('dunmore'));
const K = await page.evaluate(() => { const hash = b => { let h = 0; b.traverse(m => { if (!m.isMesh) return; const a = m.geometry.attributes.position.array; for (let i = 0; i < a.length; i += 3) h = (h * 31 + Math.round(a[i] * 1e4)) | 0; }); return h; };
  const out = {}; for (const k of ['a', 'b']) { const A = PKIT.gl.coachRoom({}, PKIT.stream(k)), B = PKIT.gl.coachRoom({}, PKIT.stream(k)); out[k] = { tris: A.tris, draws: A.draws, same: hash(A.group) === hash(B.group), rooms: A.rooms.length, first: A.first }; }
  return out; });
check(`the kit's room builds as the prototype's (${Object.values(K).map(v => `${v.tris.toLocaleString()} in ${v.draws}`).join(', ')}), the same twice, with eight rooms`, Object.values(K).every(v => v.tris >= PROTO.min && v.tris <= PROTO.max && v.draws === PROTO.draws && v.same && v.rooms === 8 && v.first === 'rooms'), K);

const pre = await page.evaluate(() => { forceTime(12); const S = WORLD.settle.get('dunmore'), h = S.houses.find(h => h.siteId === 'dunmore' && h.type === 'inn' && h.kit && h.kit.kind === 'coachinn'); window._ci = h;
  return h ? { name: h.name, room: kitCoachRoom(h), rooms: innRooms(h), names: [0, 1, 2, 3, 4, 5, 6, 7].map(k => innRoomName(k, 8, h)), colour: h.kit.colour, paint: h.kit.paint } : null; });
check(`Dunmore's coaching inn (${pre && pre.name}) is the kit's, so its room is the coaching inn's own`, !!pre && pre.room, pre);
check(`the innkeeper lets eight rooms, named by floor and side (${pre && pre.names[0]}; … ${pre && pre.names[7]})`, !!pre && pre.rooms === 8 && new Set(pre.names).size === 8 && pre.names.every(s => /^the (west|middle|east) (front|back) room on the (first|second) floor$/.test(s)), pre && pre.names);

await page.evaluate(() => { const h = _ci; px = h.exitX; pz = h.exitZ; goToInterior(h); });
for (let k = 0; k < 40 && !(await page.evaluate(() => isInterior())); k++) await page.waitForTimeout(250);
await g.frames(2);
const r = await page.evaluate(() => {
  const h = currentHouse, T = h._coachRoom, W = h._roomW, D = h._roomD, X = T.inner.x1, Z = T.inner.z1, F = T.floors.map(y => +(y - T.floors[0]).toFixed(3)); interiorScene.updateMatrixWorld(true);
  const meshes = []; let lights = 0, draws = 0, tris = 0, kDraws = 0; const inKeeper = o => { for (let p = o; p; p = p.parent) if (p === intNPCMesh) return true; return false; };
  interiorScene.traverse(o => { if (o.isLight && !o.isAmbientLight && o.intensity > 0) lights++; /* the spell lights' pool waits at zero, 100 m down */ if (o.isMesh && o.visible) { if (intNPCMesh && inKeeper(o)) kDraws++; else draws++; tris += (o.geometry.index ? o.geometry.index.count : o.geometry.attributes.position.count) / 3; if (!o.isSkinnedMesh) meshes.push(o); } });
  const rc = new THREE.Raycaster(), O = new THREE.Vector3(), Dv = new THREE.Vector3();
  const hit = (x, y, z, dx, dy, dz, far = 14) => { O.set(x, y, z); Dv.set(dx, dy, dz).normalize(); rc.set(O, Dv); rc.far = far; const q = rc.intersectObjects(meshes, false)[0]; return q ? +q.distance.toFixed(3) : null; };
  // walled all round on every floor: every metre along each wall at 0.6 and 2 m over each floor, a ray from the middle meets something
  const open = []; for (const f of F) for (const y of [f + .6, f + 2.0]) { for (let x = .5; x < W - .4; x += 1) { if (hit(x, y, D / 2, 0, 0, 1, D) == null) open.push(['S', x, y]); if (hit(x, y, D / 2, 0, 0, -1, D) == null) open.push(['N', x, y]); }
    for (let z = .5; z < D - .4; z += 1) { if (hit(W / 2, y, z, 1, 0, 0, W) == null) open.push(['E', z, y]); if (hit(W / 2, y, z, -1, 0, 0, W) == null) open.push(['W', z, y]); } }
  // you arrive clear, before the door, outside its reach
  const az = intArrivalZ(h), exitZ = D - h._exitD, dx = intDoorX(h), arrive = { x: +px.toFixed(2), z: +az.toFixed(2), atDoor: Math.abs(dx - (T.door.x + X)) < .01, clear: !intSolidAt(px, az, .3, 0), exits: az > exitZ };
  // the stair, walked with the game's own ground, solids and ceiling: up flight A toward the back, west along the half-landing, back up
  // flight B to the floor above, onto it; then the same again to the top floor
  const S0 = T.well.x0 + X, S1 = T.well.x1 + X, SM = (T.steps.find(s => s.flight === 'B').x1) + X, WZ = T.well.z1 + Z, LZ = T.landings[0].z1 + Z, xa = (SM + S1) / 2 + .03, xb = (S0 + SM) / 2;
  const legs = [[[xa, WZ + .45], [xa, LZ - .35]], [[xa, LZ - .35], [xb, LZ - .35]], [[xb, LZ - .35], [xb, WZ + .45]]];
  let y = 0; const climb = []; for (let fl = 0; fl < 2; fl++) { let maxStep = 0, blocked = 0, minHead = 99;
    for (const [[x0, z0], [x1, z1]] of legs) { const n = Math.ceil(Math.hypot(x1 - x0, z1 - z0) / .04); for (let k = 0; k <= n; k++) { const x = x0 + (x1 - x0) * k / n, z = z0 + (z1 - z0) * k / n;
      if (intSolidAt(x, z, .3, y)) blocked++; const ny = footholdY(x, z, y, 0); maxStep = Math.max(maxStep, ny - y); y = ny; minHead = Math.min(minHead, headCeil(x, z, y) - y); } }
    climb.push({ top: +y.toFixed(3), want: F[fl + 1], maxStep: +maxStep.toFixed(3), blocked, minHead: +minHead.toFixed(2) });
    /* the next flight starts where this one began, a storey up */ }
  // each corridor: from the stair head west and east to its last door, on the floor, nothing in the way, a head's height clear
  const cz = (T.corridor.z0 + T.corridor.z1) / 2 + Z, corr = [1, 2].map(fl => { let blocked = 0, off = 0, head = 99; const xs = T.rooms.filter(R => R.fl === fl).map(R => R.door.x + X), x0 = Math.min(...xs), x1 = Math.max(...xs);
    for (let x = x0; x <= x1 + 1e-6; x += .1) { if (intSolidAt(x, cz, .3, F[fl])) blocked++; if (Math.abs(footholdY(x, cz, F[fl], 0) - F[fl]) > .01) off++; head = Math.min(head, headCeil(x, cz, F[fl]) - F[fl]); }
    return { fl, blocked, off, head: +head.toFixed(2) }; });
  const doors = INT_DOORS.map(d => { const b = new THREE.Box3().setFromObject(d.g); return { y: +d.y.toFixed(2), h: +(b.max.y - b.min.y).toFixed(2), x: +d.x.toFixed(2), z: +d.z.toFixed(2) }; });
  const beds = INT_BEDS.map(b => { const R = T.rooms[b.room], d = doors[b.room]; return { room: b.room, owner: b.owner, y: b.y, want: F[R.fl], inRoom: b.x > R.x0 + X && b.x < R.x1 + X && b.z > R.z0 + Z && b.z < R.z1 + Z, behind: R.z0 > 0 ? b.z > d.z : b.z < d.z }; });
  const bar = T.bar, keeper = intNPCMesh ? { behind: intNPCPos.z < bar.z0 + Z && intNPCPos.z > -Z + .55 + Z - .01, reach: +(bar.z1 + Z + .3 - intNPCPos.z).toFixed(2), clearFront: !intSolidAt(intNPCPos.x, bar.z1 + Z + .3, .25, 0) } : null;
  const hatch = HATCH.active ? { x: +HATCH.x.toFixed(2), z: +HATCH.z.toFixed(2), clear: !intSolidAt(HATCH.x, HATCH.z, .2, 0) && !intSolidAt(HATCH.x + .6, HATCH.z - .6, .3, 0) } : null;
  return { W, D, F, front: [T.w, T.d], scaledBy: T.group.scale.x, open, arrive, exitZ: +exitZ.toFixed(2), climb, corr, doors, beds, keeper, hatch, lights, draws, kDraws, tris: Math.round(tris), roomH: h._roomH };
});
check(`the room is the front's inside, ${r.W} by ${r.D} m inside its ${r.front.join(' by ')} m walls, at its true size (scale ${r.scaledBy})`, Math.abs(r.W - 11.7) < .01 && Math.abs(r.D - 8.1) < .01 && r.D < r.front[1] && r.scaledBy === 1, r);
check(`walled all round on all three floors: no opening along the walls at 0.6 or 2 m over a floor (${r.open.length})`, r.open.length === 0, r.open.slice(0, 8));
check(`you arrive clear at ${r.arrive.x}, ${r.arrive.z} m, before the door, outside its reach (from ${r.exitZ} m)`, r.arrive.atDoor && r.arrive.clear && !r.arrive.exits, r.arrive);
for (const [i, c] of r.climb.entries()) check(`the stair climbs to the ${i ? 'second' : 'first'} floor at ${c.top} m in steps of ${c.maxStep} m or less, nothing in the way, ${c.minHead} m or more over the head`, Math.abs(c.top - c.want) < .01 && c.maxStep <= .4 && c.blocked === 0 && c.minHead >= 1.8, c);
for (const c of r.corr) check(`the ${c.fl === 1 ? 'first' : 'second'} floor's corridor runs clear from door to door, on the boards, ${c.head} m over the head`, c.blocked === 0 && c.off === 0 && c.head >= 1.8, c);
check(`eight rooms with doors hung, ${[...new Set(r.doors.map(d => d.h))].join(', ')} m high, five on the first floor and three on the second`, r.doors.length === 8 && r.doors.filter(d => Math.abs(d.y - r.F[1]) < .01).length === 5 && r.doors.filter(d => Math.abs(d.y - r.F[2]) < .01).length === 3 && r.doors.every(d => d.h > 1.85 && d.h < 2.1), r.doors);
check(`a bed to let in each room, behind its door: rooms ${r.beds.map(b => b.room).join(', ')}`, r.beds.length === 8 && r.beds.every((b, k) => b.room === k && b.owner === 'inn' && Math.abs(b.y - b.want) < .01 && b.inRoom && b.behind), r.beds);
check(`the innkeeper stands behind the bar, ${r.keeper && r.keeper.reach} m from you across it (in reach under 2.2)`, !!r.keeper && r.keeper.behind && r.keeper.clearFront && r.keeper.reach < 2.2, r.keeper);
check(`the cellar's hatch is in the flags at ${r.hatch && [r.hatch.x, r.hatch.z].join(', ')}, clear to stand at`, !r.hatch || r.hatch.clear, r.hatch);
// the taproom's line is 59 with three doors; each of the eight doors here is four draws (its leaf, two bands and the knob)
check(`the room is lit (${r.lights} lights, 12 or fewer) and draws ${r.draws} meshes (70 or fewer), ${r.tris.toLocaleString()} triangles with the innkeeper`, r.lights >= 6 && r.lights <= 12 && r.draws <= 70, { lights: r.lights, draws: r.draws, tris: r.tris });

// leaving: at the arrival spot E does not take you out
await page.evaluate(() => { px = intDoorX(currentHouse); pz = intArrivalZ(currentHouse); jumpY = 0; interact(); });
await g.frames(30);
check('at the arrival spot E does not take you out', await page.evaluate(() => isInterior()));
// the pictures: from inside the door toward the hearth and the bar, and along the first floor's corridor
await page.evaluate(() => { const h = currentHouse; try { closeDialog(); } catch (e) {} VM_SCENE.visible = false; px = intDoorX(h) + .8; pz = h._roomD - .45; jumpY = 0; yaw = -.75; pitch = -.08; });
await g.frames(6); await page.screenshot({ path: path.join(here, '../docs/prototypes/kit-coachroom-ingame.png') });
await page.evaluate(() => { const h = currentHouse, T = h._coachRoom; px = h._roomW / 2 - 1.0; pz = (T.corridor.z0 + T.corridor.z1) / 2 + T.inner.z1; jumpY = T.floors[1] - T.floors[0]; yaw = Math.PI / 2; pitch = -.05; });
await g.frames(6); await page.screenshot({ path: path.join(here, '../docs/prototypes/kit-coachroom-corridor.png') });
console.log('  (pictures: docs/prototypes/kit-coachroom-ingame.png, kit-coachroom-corridor.png)');
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
