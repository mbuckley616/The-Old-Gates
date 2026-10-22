// Aurenne's tavern on the quay of an Aurennais port, on the new look (Session 1316; card F9, Michael's 1 A and 2 B on #602: the tavern two
// storeys high with three rooms upstairs, the keeper's words as they stand; in the ports only, on the quay). On ?look=new the port's first
// inn is PKIT.au.tavern({ rooms: true }) on its own lot across the quay head from the shipwright, its terrace out over the water and its
// gate toward the town; the inn's old building is gone. Outside: the solid is the whole lot, the door you knock at is the gate's step with
// the gate open before it, a quay wall stands under the terrace's edge, and the far copy covers it. Inside (entered as you enter it, at its
// true size): walled all round, you arrive clear; three rooms to let upstairs, room 0 the west; each bed is reached on foot from the door,
// up the 16 risers and along the passage, through its room's door; the keeper stands behind the counter in reach; you rent a room and
// its bed is yours; the room is lit and within its draws; you leave by the door. Pictures from the quay and from the stair's foot.
import { boot, check } from './lib/game.mjs';
import fs from 'fs'; import path from 'path'; import { fileURLToPath } from 'url';
const here = path.dirname(fileURLToPath(import.meta.url));
const ports = () => { anchoredPlaces(); return [...CELLS.values()].filter(c => c.type !== 'sea' && nationKeyOf(c.i, c.j) === 'aurenne').flatMap(c => c.sites).filter(s => s.kind === 'port').slice(0, 3).map(s => s.id); };
const pick = `const S = WORLD.settle.get(id), h = S.houses.find(h => h.siteId === id && h.type === 'inn' && h.kit && h.kit.kind === 'aurtavern');`;

const g = await boot({ look: 'new' }); const { page } = g; await g.intoWorld();
let sid = null, out = null;
for (const id of await page.evaluate(ports)) { if (!(await g.settle(id))) continue; out = await page.evaluate(new Function('id', `${pick} if (!h) return null;
  const site = siteAnywhere(id), q = site.quayStart, sw = S.houses.find(x => x.siteId === id && x.type === 'shipwright'), s = S.sol.find(o => o.hid === h.id), T = site.tavernLot;
  let kitG = null; S.group.traverse(x => { if (x.name === 'kit houses') kitG = x; }); WORLD.scene.updateMatrixWorld(true);
  const meshes = []; kitG.traverse(m => { if (m.isMesh) meshes.push(m); });
  const rc = new THREE.Raycaster(), O = new THREE.Vector3(), Dv = new THREE.Vector3(), hit = (x, y, z, dx, dy, dz, far) => { O.set(x, y, z); Dv.set(dx, dy, dz).normalize(); rc.set(O, Dv); rc.far = far; const r = rc.intersectObjects(meshes, false)[0]; return r ? +r.distance.toFixed(2) : null; };
  const fx = -Math.sin(h.exitYaw), fz = -Math.cos(h.exitYaw), gy = WORLD.worldH(h.doorX, h.doorZ);
  /* the gate: from the knock point 0.6 m up, straight in across the terrace: open for the parapet's width, to the first stool; and 1.0 m to
     either side of it the parapet stands 0.15 m in */
  const gate = hit(h.doorX, gy + .6, h.doorZ, -fx, 0, -fz, 6), side = [-1, 1].map(k => hit(h.doorX + fz * k * 1.0, gy + .6, h.doorZ - fx * k * 1.0, -fx, 0, -fz, 3));
  /* the quay wall: under the terrace's outer edge, 0.3 m out, looking back at it 0.5 m under the paving and at the ground */
  const F = h.kit.F, ox = T.x - F.x * 2.95, oz = T.z - F.z * 2.95, ex = ox + F.x * 10.3, ez = oz + F.z * 10.3, base = WORLD.worldH(ox, oz);
  const wall = [hit(ex, base - .5, ez, -F.x, 0, -F.z, 2), hit(ex, Math.max(WORLD.worldH(ex, ez), WORLD.SEA_Y) + .2, ez, -F.x, 0, -F.z, 2)];
  const far = S.group.children.find(m => m.name === 'kit houses far'), fb = far && new THREE.Box3().setFromObject(far);
  const inFar = fb ? [0, 5, 10].every(v => fb.containsPoint(new THREE.Vector3(ox + F.x * v, base + 1, oz + F.z * v))) : false;
  const inns = S.houses.filter(x => x.siteId === id && x.type === 'inn').map(x => x.kit ? x.kit.kind : 'old');
  return { name: h.name, n: h.kit.tris, calls: h.kit.calls, lot: [+(2 * s.rx).toFixed(2), +(2 * s.rz).toFixed(2)], dq: +Math.hypot(T.x - q.x, T.z - q.z).toFixed(1), sw: sw ? +Math.hypot(sw.doorX - T.x, sw.doorZ - T.z).toFixed(1) : null,
    gate, side, wall, ground: +(WORLD.worldH(ex, ez) - base).toFixed(2), inFar, inns, wallH: h.wallH, storeys: h.storeys, rooms: innRooms(h), tv: kitTavern(h), names: [0, 1, 2].map(k => innRoomName(k, 3, h)) };`), id);
  if (out) { sid = id; break; } }
check(`an Aurennais port's inn is Aurenne's tavern on the quay (${sid}: ${out && out.name}, ${out && out.n.toLocaleString()} triangles in ${out && out.calls} meshes; inns ${out && out.inns.join(', ')})`, !!out && out.tv && out.dq < 25 && out.n < 30000, out);
if (!out) { await g.close(); process.exit(); }
check(`its lot is the tavern's ground (${out.lot.join(' by ')} m with the margin), ${out.dq} m from the quay's head, the shipwright across it (${out.sw} m)`, Math.abs(out.lot[0] - 14.4) < .05 && Math.abs(out.lot[1] - 10.1) < .05 && (out.sw == null || out.sw > 12), out);
check(`you knock at the gate: open before you to the first stool (${out.gate} m in), the parapet either side at ${out.side.join(' and ')} m`, out.gate > .9 && out.side.every(d => d != null && d < .4), out);
check(`a quay wall under the terrace's edge (${out.wall.join(' and ')} m back, the ground ${out.ground} m under the house's), and the far copy covers it`, out.wall.every(d => d != null && d < .5) && out.inFar, out);
check(`two storeys of ${out.wallH && out.wallH.toFixed(2)} m to the eaves; three rooms to let, named from the stair's head (${out.names.join('; ')})`, out.storeys === 2 && out.rooms === 3 && out.names[0] === 'the first door on the right' && out.names[2] === 'the last door on the right', out);

// the picture from the quay, at noon
await page.evaluate(new Function('id', `${pick} forceTime(12); const T = siteAnywhere(id).tavernLot, F = h.kit.F, N = T.N; VM_SCENE.visible = false; if (typeof TP !== 'undefined' && TP.on) TP.on = false;
  px = T.x + N.x * 13 + F.x * 9; pz = T.z + N.z * 13 + F.z * 9; const dx = T.x + F.x * 2 - px, dz = T.z + F.z * 2 - pz; yaw = Math.atan2(-dx, -dz); pitch = -.05;`), sid);
await g.frames(8);
fs.mkdirSync(path.join(here, '../docs/prototypes'), { recursive: true });
await page.screenshot({ path: path.join(here, '../docs/prototypes/tavern-quay-ingame.png') }); console.log('  (picture: docs/prototypes/tavern-quay-ingame.png)');

await page.evaluate(new Function('id', `${pick} px = h.exitX; pz = h.exitZ; goToInterior(h);`), sid);
for (let k = 0; k < 40 && !(await page.evaluate(() => isInterior())); k++) await page.waitForTimeout(250);
await g.frames(2);
const r = await page.evaluate(() => {
  const h = currentHouse, T = h._tavern, W = h._roomW, D = h._roomD, X = T.inner.x1, Z = T.inner.z1, F1 = T.floors[1] - T.floors[0]; interiorScene.updateMatrixWorld(true);
  const meshes = []; let lights = 0, draws = 0, tris = 0, kDraws = 0; const inKeeper = o => { for (let p = o; p; p = p.parent) if (p === intNPCMesh) return true; return false; };
  interiorScene.traverse(o => { if (o.isLight && !o.isAmbientLight && o.intensity > 0) lights++; if (o.isMesh && o.visible) { if (intNPCMesh && inKeeper(o)) kDraws++; else { draws++; tris += (o.geometry.index ? o.geometry.index.count : o.geometry.attributes.position.count) / 3; meshes.push(o); } } }); /* a window's daylight closes it */
  const rc = new THREE.Raycaster(), O = new THREE.Vector3(), Dv = new THREE.Vector3();
  const hit = (x, y, z, dx, dy, dz, far = 20) => { O.set(x, y, z); Dv.set(dx, dy, dz).normalize(); rc.set(O, Dv); rc.far = far; const q = rc.intersectObjects(meshes, false)[0]; return q ? +q.distance.toFixed(3) : null; };
  /* walled all round on the ground floor: from the room's middle every metre along each wall at 0.6 and 2.2 m, nothing open (the door aside) */
  const open = []; for (const y of [.6, 2.2]) { for (let x = .5; x < W - .4; x += 1) { if (Math.abs(x - intDoorX(h)) > .8 && hit(x, y, D / 2, 0, 0, 1, D) == null) open.push(['front', x, y]); if (hit(x, y, D / 2, 0, 0, -1, D) == null) open.push(['back', x, y]); }
    for (let z = .5; z < D - .4; z += 1) { if (hit(W / 2, y, z, 1, 0, 0, W) == null) open.push(['right', z, y]); if (hit(W / 2, y, z, -1, 0, 0, W) == null) open.push(['left', z, y]); } }
  const az = intArrivalZ(h), arrive = { x: +px.toFixed(2), z: +az.toFixed(2), clear: !intSolidAt(px, az, .3, 0), exits: az > D - h._exitD };
  const beds = INT_BEDS.map(b => ({ room: b.room, owner: b.owner, x: +b.x.toFixed(2), z: +b.z.toFixed(2), y: b.y }));
  const order = beds.every((b, k) => b.room === k && (k === 0 || b.x > beds[k - 1].x) && Math.abs(b.y - F1) < .01);
  /* every room's door opens */
  INT_DOORS.forEach(d => WORLD.intDoorInteract(d));
  /* each bed on foot, with the game's own ground and solids: in from the door to the stair's foot, up it, off the landing along the
     passage, in at the room's door to the bed's side */
  const walk = pts => { let y = 0, blocked = [], maxStep = 0, [x, z] = pts[0]; for (let i = 1; i < pts.length; i++) { const [x1, z1] = pts[i], n = Math.ceil(Math.hypot(x1 - x, z1 - z) / .05);
      for (let k = 1; k <= n; k++) { const xx = x + (x1 - x) * k / n, zz = z + (z1 - z) * k / n, ny = footholdY(xx, zz, y, 0); maxStep = Math.max(maxStep, ny - y); y = ny; if (intSolidAt(xx, zz, .25, y)) blocked.push([+xx.toFixed(2), +zz.toFixed(2), +y.toFixed(2)]); } x = x1; z = z1; }
    return { blocked: blocked.length, at: blocked.slice(0, 3), maxStep: +maxStep.toFixed(3), y: +y.toFixed(3) }; };
  const S = T.stair, ax = (S.x0 + S.x1) / 2 + X, PM = (-Z + T.passage) / 2 + Z;
  const walks = T.rooms.map((R, i) => { const b = T.beds[i], bx = (i < 2 ? b.x1 + .4 : b.x0 - .4) + X, bz = b.z0 + Z + .9 /* the bed's side, past the chest at its foot */;
    const w = walk([[intDoorX(h), D - .6], [intDoorX(h), Z + 2.3], [ax, Z + 2.3], [ax, S.z1 + Z + .2], [ax, S.z0 + Z - .5], [ax + .6, PM], [R.door.x + X, PM], [R.door.x + X, T.passage + Z + .5], [R.door.x + X, bz], [bx, bz]]);
    return { room: i, ...w, upstairs: Math.abs(w.y - F1) < .01 }; });
  const C = T.counter, cf = C.z1 + Z, keeper = intNPCMesh ? { x: +intNPCPos.x.toFixed(2), z: +intNPCPos.z.toFixed(2), behind: intNPCPos.z < C.z0 + Z, reach: +(cf + .3 - intNPCPos.z).toFixed(2), clearFront: !intSolidAt(intNPCPos.x, cf + .3, .25, 0) } : null;
  const hatch = HATCH.active ? { x: +HATCH.x.toFixed(2), z: +HATCH.z.toFixed(2), clear: !intSolidAt(HATCH.x, HATCH.z, .3, 0) } : null;
  return { W: +W.toFixed(2), D: +D.toFixed(2), open, arrive, beds, order, walks, doors: INT_DOORS.length, keeper, hatch, lights, draws, kDraws, tris: Math.round(tris), scaledBy: T.group.scale.x, rise: S.rise, prompt: WORLD.bedPrompt(INT_BEDS[1]) };
});
check(`the room is the tavern's inside, ${r.W} by ${r.D} m, at its true size (scale ${r.scaledBy})`, r.W > 8.5 && r.W < 9.6 && r.D > 6.9 && r.D < 8 && r.scaledBy === 1, r);
check(`walled all round downstairs: no opening at 0.6 or 2.2 m but the door (${r.open.length}); you arrive clear at ${r.arrive.x}, ${r.arrive.z} m`, r.open.length === 0 && r.arrive.clear && !r.arrive.exits, { open: r.open.slice(0, 6), arrive: r.arrive });
check(`three rooms to let upstairs, rooms ${r.beds.map(b => b.room).join(', ')} from the west, a door hung in each doorway (${r.doors})`, r.beds.length === 3 && r.beds.every(b => b.owner === 'inn') && r.order && r.doors === 3, r.beds);
check(`each bed is reached on foot from the door, up ${16} risers of ${r.rise} m (steps of ${Math.max(...r.walks.map(w => w.maxStep))} m or less) and through its door, nothing in the way`, r.walks.every(w => w.blocked === 0 && w.maxStep <= .4 && w.upstairs), r.walks);
check(`before you rent, a bed says to ask the keeper (“${r.prompt}”)`, /keeper/i.test(r.prompt || ''), r.prompt);
check(`the keeper stands behind the counter at ${r.keeper && [r.keeper.x, r.keeper.z].join(', ')}, ${r.keeper && r.keeper.reach} m from you across it`, !!r.keeper && r.keeper.behind && r.keeper.clearFront && r.keeper.reach < 2.2, r.keeper);
if (r.hatch) check(`the cellar's hatch is in the tiles at ${r.hatch.x}, ${r.hatch.z}, clear to stand at`, r.hatch.clear, r.hatch);
check(`the room is lit (${r.lights} lights) and draws ${r.draws} meshes (50 or fewer), ${r.tris.toLocaleString()} triangles; the keeper ${r.kDraws}`, r.lights >= 6 && r.draws <= 50 && r.kDraws >= 1, r);

const rent = await page.evaluate(() => { const h = currentHouse; gold = 200; const t = h.dlg._extra.find(t => /room|bed/i.test(t.label) && t.follow); const yes = t && t.follow.find(f => /^Yes/.test(f.label)); const said = yes ? yes.fn() : null;
  const mine = worldState.rented && worldState.rented.room, b = INT_BEDS.find(b => b.room === mine), o = INT_BEDS.find(b => b.room !== mine);
  return { label: t && t.label, said, mine, p: b && WORLD.bedPrompt(b), q: o && WORLD.bedPrompt(o) }; });
check(`rented: “${rent.said}”; room ${rent.mine} says “${rent.p}”, another “${rent.q}”`, rent.mine != null && /^Your/.test(rent.p || '') && !/^Your/.test(rent.q || ''), rent);

await page.evaluate(() => { const h = currentHouse, T = h._tavern; VM_SCENE.visible = false; px = intDoorX(h) - .3; pz = h._roomD - .7; jumpY = 0; yaw = .55; pitch = .12; });
await g.frames(6);
await page.screenshot({ path: path.join(here, '../docs/prototypes/tavern-stair-ingame.png') }); console.log('  (picture: docs/prototypes/tavern-stair-ingame.png)');

await page.evaluate(() => { const h = currentHouse; px = intDoorX(h); pz = h._roomD - .4; jumpY = 0; yaw = Math.PI; pitch = 0; interact(); });
for (let k = 0; k < 40 && (await page.evaluate(() => isInterior())); k++) await page.waitForTimeout(250);
check('at the door E takes you out', !(await page.evaluate(() => isInterior())));
check('no errors on the new look', g.errs.length === 0, g.errs);
await g.close();
