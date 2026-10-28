// The Gatelander taproom inside a village inn on the new look (Session 1161; card F9, Michael's 2 A on DECISION #320: the taproom
// drawn inside the kit's farmhouse). On ?look=new a Gatelands village inn on three bays is the kit's farmhouse outside (S1086) and
// PKIT.gl.inn inside (S1157), at its true size, not scaled. In the village nearest Dunmore, entered as you enter it: the room is the
// farmhouse's inside (9.5 by 5.2 m), walled all round; you arrive clear and leave by the door, and not from the tables; the stair
// climbs in steps you can take, under a head's height, to the upper floor; the passage leads to three rooms with doors, each with a
// bed to let as room 0, 1 and 2, as the innkeeper names them (three rooms, the stair east); the innkeeper stands behind the bar and is
// in reach across it; the cellar's hatch is clear; the room is lit; and a picture from the door. Session 1276: a village inn on two
// bays (7.4 m, its door in the west bay) is the same taproom in the narrower house (6.4 by 5.2 m inside, one table, two rooms): the
// nearest village's inn is built again as the two-bay house's room and walked through the same checks; you arrive, and leave, by
// its door, not the room's middle.
// Session 1504: at noon the day comes in through the open door and the taproom's windows, a sky spot inside each (kitDaylight).
import { boot, check } from './lib/game.mjs';
import fs from 'fs'; import path from 'path'; import { fileURLToPath } from 'url';
const here = path.dirname(fileURLToPath(import.meta.url));
const pick = () => { const nat = t => nationKeyOf(...cellOf(t.x, t.z)), d = siteAnywhere('dunmore');
  return allSites().filter(t => nat(t) === 'gatelands' && t.kind === 'village' && t.pad > 0).sort((a, b) => Math.hypot(a.x - d.x, a.z - d.z) - Math.hypot(b.x - d.x, b.z - d.z)).map(t => t.id).slice(0, 10); };

const g = await boot({ look: 'new' }); const { page } = g; await g.intoWorld();
const vid = (await page.evaluate(pick))[0];
check(`${vid} stands on the new look`, await g.settle(vid));
// two-bay inns are few (none among the inns of the 24 Gatelands villages nearest Dunmore, Session 1276), so the same inn's room is built a second
// time as the two-bay house's: the room is made from house.kit alone, and its bays are what it reads
for (const n of [3, 2]) { console.log(`  -- ${vid}'s inn, its room on ${n} bays`);
  if (n === 2) await page.evaluate(id => { const S = WORLD.settle.get(id), h = S.houses.find(h => h.siteId === id && h.type === 'inn'); h._kit3 = h.kit; h.kit = { ...h.kit, bays: 2 }; }, vid);
const pre = await page.evaluate(id => { forceTime(12); const S = WORLD.settle.get(id), h = S.houses.find(h => h.siteId === id && h.type === 'inn');
  return { kit: h.kit && { bays: h.kit.bays, paint: h.kit.paint }, taproom: kitTaproom(h), rooms: innRooms(h), east: galleryEast(h), names: [0, 1, 2].slice(0, h.kit.bays).map(k => innRoomName(k, h.kit.bays, h)), name: h.name }; }, vid);
check(`its inn (${pre.name}) is the farmhouse on ${pre.kit && pre.kit.bays} bays, its door painted ${pre.kit && pre.kit.paint}, so its room is the kit's taproom`, pre.taproom && pre.kit.bays === n && !!pre.kit.paint, pre);
check(`the innkeeper counts its ${n} rooms from the stair up the east gable (${pre.names.join('; ')})`, pre.rooms === n && pre.east && pre.names[n - 1] === 'the first door on the left', pre);

await page.evaluate(id => { const S = WORLD.settle.get(id), h = S.houses.find(h => h.siteId === id && h.type === 'inn'); px = h.exitX; pz = h.exitZ; goToInterior(h); }, vid);
for (let k = 0; k < 40 && !(await page.evaluate(() => isInterior())); k++) await page.waitForTimeout(250);
await g.frames(2);
const r = await page.evaluate(n => {
  const h = currentHouse, T = h._taproom, W = h._roomW, D = h._roomD, F1 = +(T.floors[1] - T.floors[0]).toFixed(3); interiorScene.updateMatrixWorld(true);
  const meshes = []; let lights = 0, draws = 0, tris = 0, kDraws = 0, kBuilder = false; const kinds = {}; const inKeeper = o => { for (let p = o; p; p = p.parent) if (p === intNPCMesh) return true; return false; };
  if (intNPCMesh) intNPCMesh.traverse(o => { if (o.name === 'builder') kBuilder = true; });
  const sky = []; interiorScene.traverse(o => { if (o.isLight && o.userData.daylight) sky.push({ x: +o.position.x.toFixed(2), z: +o.position.z.toFixed(2), i: +o.intensity.toFixed(2), in: o.position.x > 0 && o.position.x < W && o.position.z >= 0 && o.position.z <= D && Math.abs(o.target.position.z - D / 2) < Math.abs(o.position.z - D / 2) }); });
  const wins = T.windows.filter(q => (q.face === 'front' || q.face === 'back') && q.y - T.floors[0] < F1 - .3).length;
  interiorScene.traverse(o => { if (o.isLight && !o.isAmbientLight) { lights++; const k = o.type + (o.parent === interiorScene ? '' : ' in ' + (o.parent.name || o.parent.type)); kinds[k] = (kinds[k] || 0) + 1; } if (o.isMesh && o.visible) { if (intNPCMesh && inKeeper(o)) kDraws++; else draws++; tris += (o.geometry.index ? o.geometry.index.count : o.geometry.attributes.position.count) / 3; if (!o.isSkinnedMesh) meshes.push(o); } });
  const rc = new THREE.Raycaster(), O = new THREE.Vector3(), Dv = new THREE.Vector3();
  const hit = (x, y, z, dx, dy, dz, far = 12) => { O.set(x, y, z); Dv.set(dx, dy, dz).normalize(); rc.set(O, Dv); rc.far = far; const q = rc.intersectObjects(meshes, false)[0]; return q ? +q.distance.toFixed(3) : null; };
  // walled all round: from the middle of the floor at 1.2 m, the four walls, and every metre along each wall at 0.6 and 2 m nothing is open
  const cx = W / 2 + (n === 3 ? -1.0 : .4) /* clear of the settle */, cz = D / 2 + .3, walls = [hit(cx, 1.2, cz, 1, 0, 0), hit(cx, 1.2, cz, -1, 0, 0), hit(cx, 1.2, cz, 0, 0, 1), hit(cx, 1.2, cz, 0, 0, -1)];
  let open = []; for (const y of [.6, 2.0, F1 + 1.2]) { for (let x = .5; x < W - .4; x += 1) { if (hit(x, y, D / 2, 0, 0, 1, D) == null) open.push(['S', x, y]); if (hit(x, y, D / 2, 0, 0, -1, D) == null) open.push(['N', x, y]); }
    for (let z = .5; z < D - .4; z += 1) { if (hit(W / 2, y, z, 1, 0, 0, W) == null) open.push(['E', z, y]); if (hit(W / 2, y, z, -1, 0, 0, W) == null) open.push(['W', z, y]); } }
  const floor = hit(W / 2, 1, D / 2 + .5, 0, -1, 0, 3), ceilDown = hit(cx, 1.7, cz, 0, 1, 0, 6);
  // you arrive clear, inside the room and outside the door's reach; the door's reach (where E takes you out) is by the door only
  const az = intArrivalZ(h), exitZ = D - h._exitD, dx = intDoorX(h), doorX = +(T.door.x + T.inner.x1).toFixed(3), arrive = { x: +px.toFixed(2), z: +az.toFixed(2), door: dx, kitDoor: doorX, atDoor: Math.abs(px - doorX) < .01 && Math.abs(dx - doorX) < .01, clear: !intSolidAt(px, az, .3, 0), exits: az > exitZ };
  const tables = INT_SOL.filter(s => s.y0 > .6 && s.y0 < .8 && s.x1 - s.x0 > 1.2), tableInExit = tables.filter(s => s.z1 > exitZ && s.x1 > dx - h._exitW && s.x0 < dx + h._exitW).length;
  // the stair: walked from its foot to the landing with the game's own ground (footholdY) and solids, as you climb it
  const S = T.stair, sx = S.x0 + (S.x1 - S.x0) / 2 + W / 2, z0 = S.z1 + D / 2 + .35, z1 = S.z0 + D / 2 - .4; let y = 0, maxStep = 0, blocked = 0, minHead = 99, path = [];
  for (let z = z0; z >= z1 - 1e-6; z -= .05) { if (intSolidAt(sx, z, .3, y)) blocked++; const ny = footholdY(sx, z, y, 0); maxStep = Math.max(maxStep, ny - y); y = ny; minHead = Math.min(minHead, headCeil(sx, z, y) - y); path.push(+y.toFixed(2)); }
  const top = +y.toFixed(3);
  // upstairs: from the landing west along the passage to each room's door, on the floor, nothing in the way, a head's height clear
  const passZ = ((-T.inner.z1 + T.passage) / 2) + D / 2; let upBlocked = 0, upFloor = [], upHead = 99;
  for (let x = sx; x >= T.rooms[0].door.x + W / 2; x -= .1) { if (intSolidAt(x, passZ, .3, F1)) upBlocked++; upFloor.push(footholdY(x, passZ, F1, 0)); upHead = Math.min(upHead, headCeil(x, passZ, F1) - F1); }
  const upOn = upFloor.every(v => Math.abs(v - F1) < .01);
  const doors = INT_DOORS.map(d => { const b = new THREE.Box3().setFromObject(d.g); return { y: +d.y.toFixed(2), h: +(b.max.y - b.min.y).toFixed(2), x: +d.x.toFixed(2), z: +d.z.toFixed(2) }; });
  // the beds to let: one in each room, behind its door, on the upper floor, the bed's prompt for each
  const beds = INT_BEDS.map(b => ({ room: b.room, owner: b.owner, y: b.y, x: +b.x.toFixed(2), z: +b.z.toFixed(2), behind: b.z > doors[b.room].z, inRoom: b.x > T.rooms[b.room].x0 + W / 2 && b.x < T.rooms[b.room].x1 + W / 2 }));
  // the innkeeper: behind the bar, in reach across it
  const bar = T.bar, barFront = bar.z1 + D / 2, keeper = intNPCMesh ? { x: +intNPCPos.x.toFixed(2), z: +intNPCPos.z.toFixed(2), behind: intNPCPos.z < bar.z0 + D / 2 && intNPCPos.z > -T.inner.z1 + .55 + D / 2 - .01, reach: +Math.hypot(intNPCPos.x - intNPCPos.x, barFront + .3 - intNPCPos.z).toFixed(2), clearFront: !intSolidAt(intNPCPos.x, barFront + .3, .25, 0) } : null;
  const hatch = HATCH.active ? { x: +HATCH.x.toFixed(2), z: +HATCH.z.toFixed(2), clear: !intSolidAt(HATCH.x, HATCH.z + .6, .3, 0) && !intSolidAt(HATCH.x, HATCH.z, .2, 0) } : null;
  return { W, D, F1, walls, open, floor, ceilDown, arrive, exitZ: +exitZ.toFixed(2), tableInExit, nTables: tables.length, top, maxStep: +maxStep.toFixed(3), blocked, minHead: +minHead.toFixed(2), path: path.filter((_, i) => i % 6 === 0),
    upBlocked, upOn, upHead: +upHead.toFixed(2), kinds, doors, beds, keeper, hatch, sky, wins, lights, draws, kDraws, kBuilder, tris: Math.round(tris), roomH: h._roomH, scaledBy: interiorScene.children.find(c => c === T.group) ? T.group.scale.x : null };
}, n);
check(`the room is the farmhouse's inside, ${r.W} by ${r.D} m, at its true size (scale ${r.scaledBy})`, Math.abs(r.W - (n === 3 ? 9.5 : 6.4)) < .01 && Math.abs(r.D - 5.2) < .01 && r.scaledBy === 1, r);
check(`walled all round: the walls ${r.walls.join(', ')} m from the floor's middle, and no opening along them at 0.6 m, 2 m or upstairs (${r.open.length})`, r.walls.every(v => v != null && v < 6) && r.open.length === 0, r.open.slice(0, 6));
check(`the flags are the floor (${r.floor} m under a point 1 m up) and the beams are ${r.ceilDown != null ? +(r.ceilDown + 1.7).toFixed(2) : '?'} m up`, r.floor != null && Math.abs(r.floor - 1) < .03 && r.ceilDown + 1.7 > 2.3, r);
check(`you arrive clear at ${r.arrive.x}, ${r.arrive.z} m, before the door (${r.arrive.kitDoor} m along the front), outside its reach (from ${r.exitZ} m), and no table stands in it`, r.arrive.atDoor && r.arrive.clear && !r.arrive.exits && r.tableInExit === 0 && r.nTables === n - 1, { arrive: r.arrive, exitZ: r.exitZ, tableInExit: r.tableInExit, nTables: r.nTables });
check(`the stair climbs to the upper floor at ${r.top} m in steps of ${r.maxStep} m or less, nothing in the way, ${r.minHead} m or more over the head`, Math.abs(r.top - r.F1) < .01 && r.maxStep <= .4 && r.blocked === 0 && r.minHead >= 1.8, { top: r.top, maxStep: r.maxStep, blocked: r.blocked, minHead: r.minHead, path: r.path });
check(`upstairs the passage runs from the landing to the last door on the floor, clear, ${r.upHead} m over the head`, r.upOn && r.upBlocked === 0 && r.upHead >= 1.8, r);
check(`${n} rooms with doors hung on the upper floor, ${r.doors.map(d => d.h).join(', ')} m high`, r.doors.length === n && r.doors.every(d => Math.abs(d.y - r.F1) < .01 && d.h > 1.85 && d.h < 2), r.doors);
check(`a bed to let in each room, behind its door: rooms ${r.beds.map(b => b.room).join(', ')}`, r.beds.length === n && r.beds.every((b, k) => b.room === k && b.owner === 'inn' && Math.abs(b.y - r.F1) < .01 && b.behind && b.inRoom), r.beds);
check(`the innkeeper stands behind the bar at ${r.keeper && [r.keeper.x, r.keeper.z].join(', ')}, ${r.keeper && r.keeper.reach} m from you across it (in reach under 2.2)`, !!r.keeper && r.keeper.behind && r.keeper.clearFront && r.keeper.reach < 2.2, r.keeper);
check(`the cellar's hatch is in the flags at ${r.hatch && [r.hatch.x, r.hatch.z].join(', ')}, clear to stand at`, !!r.hatch && r.hatch.clear, r.hatch);
// F4 (Session 1200): the budget was the room and the old innkeeper, whose body was one draw call; on the new look the innkeeper wears
// the builder's body (F4), counted on its own. The room keeps its number: 60 less the old body's one call.
check(`at noon the day comes in through the door and the taproom's ${r.wins} windows (${r.sky.length} sky spots inside the room, aimed in; S1504)`, r.sky.length === r.wins + 1 && r.wins >= 2 && r.sky.every(q => q.in && q.i > 0), { wins: r.wins, sky: r.sky });
check(`the room is lit (${r.lights} lights) and draws ${r.draws} meshes (59 or fewer), ${r.tris.toLocaleString()} triangles with the innkeeper`, r.lights >= 6 && r.draws <= 59, { lights: r.lights, kinds: r.kinds, draws: r.draws, tris: r.tris });
check(`the innkeeper is a body of ${r.kDraws} draw calls${r.kBuilder ? ', the builder\'s' : ''}`, r.kDraws >= 1, { kDraws: r.kDraws, kBuilder: r.kBuilder });

// leaving: at the arrival spot E does not take you out; at the door it does
const stay = await page.evaluate(() => { px = intDoorX(currentHouse); pz = intArrivalZ(currentHouse); jumpY = 0; interact(); return true; });
await g.frames(30);
const still = await page.evaluate(() => isInterior());
check('at the arrival spot E does not take you out', stay && still);

// the picture: from inside the door, at the eye, toward the bar and the hearth
await page.evaluate(() => { const h = currentHouse; closeDialog(); /* in the two-bay room E at the arrival spot reaches the innkeeper */ VM_SCENE.visible = false; px = intDoorX(h) + .6; pz = h._roomD - .35; jumpY = 0; yaw = .35; pitch = -.05; });
await g.frames(6);
await page.screenshot({ path: path.join(here, `../docs/prototypes/kit-taproom${n === 2 ? '2' : ''}-ingame.png`) });
console.log(`  (picture: docs/prototypes/kit-taproom${n === 2 ? '2' : ''}-ingame.png)`);
await page.evaluate(() => { const h = currentHouse, T = h._taproom; px = T.stair.x0 + h._roomW / 2 - 1.1; pz = (-T.inner.z1 + T.passage) / 2 + h._roomD / 2; jumpY = T.floors[1] - T.floors[0]; yaw = Math.PI / 2; pitch = -.05; });
await g.frames(6);
await page.screenshot({ path: path.join(here, `../docs/prototypes/kit-taproom${n === 2 ? '2' : ''}-upstairs.png`) });
console.log(`  (picture: docs/prototypes/kit-taproom${n === 2 ? '2' : ''}-upstairs.png)`);

await page.evaluate(() => { const h = currentHouse; px = intDoorX(h); pz = h._roomD - .4; jumpY = 0; yaw = Math.PI; interact(); });
for (let k = 0; k < 40 && (await page.evaluate(() => isInterior())); k++) await page.waitForTimeout(250);
check('at the door E takes you out', !(await page.evaluate(() => isInterior())));
  if (n === 2) await page.evaluate(id => { const S = WORLD.settle.get(id), h = S.houses.find(h => h.siteId === id && h.type === 'inn'); h.kit = h._kit3; delete h._kit3; }, vid);
}
check('no errors on the new look', g.errs.length === 0, g.errs);
await g.close();
