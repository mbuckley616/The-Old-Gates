// The Gatelands townhouse inside a town home on the new look (Session 1430; card F9, Michael's A on DECISION #303: the rooms inside the
// street's own shell; laid out by bays in Session 1427). On ?look=new a Gatelands town's home stands as the kit's townhouse on 3, 4 or 5
// bays, 6.75 to 8 m deep (S1072, S1126), its door at either end; inside it is PKIT.gl.townhouse on the same bays and depth, at its true
// size, not scaled, mirrored for a west door. In Dunmore, one home of each kind: the kit's room builds to the prototype's triangles and
// draws, the same twice; the room is the house's inside, walled all round on all three floors; you arrive clear, outside the door's
// reach; the dog-leg stair climbs both storeys in steps you can take with a head's height over you; the prototype's seven walks are
// clear (the doors open); five doors hung; the curtained bed upstairs is the resident's and at night the resident lies in it; the home's
// chest upstairs has a side clear to open it from; a bought house's cellar hatch is clear; the four fires and the lamps light it, and a Mages'
// cold hearth is dark on all four until its task is done; E at the arrival spot keeps you in; and a picture from the door.
import { boot, check } from './lib/game.mjs';
import path from 'path'; import { fileURLToPath } from 'url';
const here = path.dirname(fileURLToPath(import.meta.url));
// the prototype's counts (rooms.check.mjs, Session 1427: 10,288 to 11,518 triangles in 19 meshes over the nine sizes)
const PROTO = { min: 10200, max: 11600, draws: 19 };

const g = await boot({ look: 'new' }); const { page } = g; await g.intoWorld();
check('Dunmore stands on the new look', await g.settle('dunmore'));
const K = await page.evaluate(() => { const hash = b => { let h = 0; b.traverse(m => { if (!m.isMesh) return; const a = m.geometry.attributes.position.array; for (let i = 0; i < a.length; i += 3) h = (h * 31 + Math.round(a[i] * 1e4)) | 0; }); return h; };
  const out = {}; for (const [n, d] of [[3, 8], [5, 6.75]]) { const A = PKIT.gl.townhouse({ bays: n, d }, PKIT.stream('a')), B = PKIT.gl.townhouse({ bays: n, d }, PKIT.stream('a')); out[`${n}x${d}`] = { tris: A.tris, draws: A.draws, same: hash(A.group) === hash(B.group), bays: A.bays }; }
  return out; });
check(`the kit's room builds as the prototype's (${Object.entries(K).map(([k, v]) => `${k}: ${v.tris.toLocaleString()} in ${v.draws}`).join(', ')}), the same twice`, Object.values(K).every(v => v.tris >= PROTO.min && v.tris <= PROTO.max && v.draws === PROTO.draws && v.same), K);
const homes = await page.evaluate(() => WORLD.settle.get('dunmore').houses.filter(h => h.siteId === 'dunmore' && h.type === 'home' && !h.shuttered).map(h => ({ id: h.id, kit: kitTownhouse(h), bays: h.kit && h.kit.bays, d: h.d, door: h.kit && h.kit.door })));
const kits = homes.filter(h => h.kit);
check(`Dunmore's homes are kit townhouses inside (${kits.length} of ${homes.length})`, kits.length >= homes.length * .8 && kits.length >= 3, homes.filter(h => !h.kit));
// three homes: an east door on three bays, a west door on four, and a five-bay house (either end)
const picks = [kits.find(h => h.bays === 3 && h.door > 0), kits.find(h => h.bays === 4 && h.door < 0), kits.find(h => h.bays === 5)].filter(Boolean);
check(`one home of each kind to walk (${picks.map(h => `${h.bays} bays, door ${h.door > 0 ? 'east' : 'west'}`).join('; ')})`, picks.length === 3, picks);

for (const H of picks) { const tag = `${H.bays} bays, ${H.door > 0 ? 'east' : 'west'}`; console.log(`  -- ${H.id}: ${tag}, ${H.d} m deep`);
  await page.evaluate(id => { forceTime(12); const h = WORLD.settle.get('dunmore').houses.find(x => x.id === id); px = h.exitX; pz = h.exitZ; goToInterior(h); }, H.id);
  for (let k = 0; k < 40 && !(await page.evaluate(() => isInterior())); k++) await page.waitForTimeout(250);
  await g.frames(2);
  const r = await page.evaluate(() => {
    const h = currentHouse, T = h._townhouse, s = h._mirror, W = h._roomW, D = h._roomD, X = T.inner.x1, Z = T.inner.z1, rx = x => X + s * x, rz = z => z + Z, F = T.floors.map(y => +(y - T.floors[0]).toFixed(3)); interiorScene.updateMatrixWorld(true);
    const meshes = []; let lights = 0, draws = 0, tris = 0; const inNpc = o => { for (let p = o; p; p = p.parent) if (p === intNPCMesh) return true; return false; };
    interiorScene.traverse(o => { if (o.isLight && !o.isAmbientLight && o.intensity > 0) lights++; if (o.isMesh && o.visible && !inNpc(o)) { draws++; tris += (o.geometry.index ? o.geometry.index.count : o.geometry.attributes.position.count) / 3; if (!o.isSkinnedMesh && !o.userData.daylight) meshes.push(o); } });
    const rc = new THREE.Raycaster(), O = new THREE.Vector3(), Dv = new THREE.Vector3();
    const hit = (x, y, z, dx, dy, dz, far = 14) => { O.set(x, y, z); Dv.set(dx, dy, dz).normalize(); rc.set(O, Dv); rc.far = far; const q = rc.intersectObjects(meshes, false)[0]; return q ? +q.distance.toFixed(3) : null; };
    // walled all round on every floor: every half metre along each wall at 0.6 and 2 m over each floor, a ray from the middle meets
    // something, but where the plan opens a window or a door (the front and back doors stand ajar; a pane lets a ray through)
    const holes = [...T.windows.map(q => ({ f: q.face, x: rx(q.x), y0: q.y - T.floors[0], y1: q.y + q.h - T.floors[0], w: q.w })), { f: 'front', x: rx(T.door.x), y0: 0, y1: T.door.h, w: T.door.w }, { f: 'back', x: rx(T.back.x), y0: 0, y1: T.back.h, w: T.back.w }];
    const inHole = (f, x, y) => holes.some(o => o.f === f && Math.abs(x - o.x) < o.w / 2 + .1 && y > o.y0 - .1 && y < o.y1 + .1);
    const open = []; for (const f of F) for (const y of [f + .6, f + 2.0]) { for (let x = .4; x < W - .3; x += .5) { if (!inHole('front', x, y) && hit(x, y, D / 2, 0, 0, 1, D) == null) open.push(['S', x, y]); if (!inHole('back', x, y) && hit(x, y, D / 2, 0, 0, -1, D) == null) open.push(['N', x, y]); }
      for (let z = .4; z < D - .3; z += .5) { if (hit(W / 2, y, z, 1, 0, 0, W) == null) open.push(['E', z, y]); if (hit(W / 2, y, z, -1, 0, 0, W) == null) open.push(['W', z, y]); } }
    const ax = intArriveX(h), az = intArrivalZ(h), exitZ = D - h._exitD, arrive = { x: +ax.toFixed(2), z: +az.toFixed(2), atDoor: Math.abs(intDoorX(h) - rx(T.door.x)) < .01, clear: !intSolidAt(ax, az, .3, 0), exits: az > exitZ };
    // the doors stand open for the walks (a shut leaf is a solid)
    const doorSol = new Set(INT_DOORS.map(d => d.sol)), keep = INT_SOL; INT_SOL = keep.filter(b => !doorSol.has(b));
    // the stair with the game's own ground, solids and ceiling: up flight A to the back, across the half-landing, up flight B to the floor
    // above; the same again to the top floor
    const fx = f => { const q = T.steps.find(t => t.flight === f), a = rx(q.x0), b = rx(q.x1); return (a + b) / 2; }, WZ = rz(T.well.z1), LZ = rz(T.landings[0].z1), xa = fx('A'), xb = fx('B');
    const legs = [[[xa, WZ + .45], [xa, LZ - .35]], [[xa, LZ - .35], [xb, LZ - .35]], [[xb, LZ - .35], [xb, WZ + .45]]];
    let y = 0; const climb = []; for (let fl = 0; fl < 2; fl++) { let maxStep = 0, blocked = 0, minHead = 99;
      for (const [[x0, z0], [x1, z1]] of legs) { const n = Math.ceil(Math.hypot(x1 - x0, z1 - z0) / .04); for (let k = 0; k <= n; k++) { const x = x0 + (x1 - x0) * k / n, z = z0 + (z1 - z0) * k / n;
        if (intSolidAt(x, z, .25, y)) blocked++; const ny = footholdY(x, z, y, 0); maxStep = Math.max(maxStep, ny - y); y = ny; minHead = Math.min(minHead, headCeil(x, z, y) - y); } }
      climb.push({ top: +y.toFixed(3), want: F[fl + 1], maxStep: +maxStep.toFixed(3), blocked, minHead: +minHead.toFixed(2) }); }
    // the prototype's seven walks (front door to back door, to the parlour's chairs, to the stair's foot; from the stair's top to the
    // drawing room, the dining room, the bed's side and the children's room), on their floor, nothing within 0.15 m (the prototype's clearance)
    const walks = T.paths.map(P => { let blocked = [], off = 0; for (let i = 0; i + 1 < P.pts.length; i++) { const [a, b] = [P.pts[i], P.pts[i + 1]], n = Math.ceil(Math.hypot(b[0] - a[0], b[1] - a[1]) / .1);
      for (let k = 0; k <= n; k++) { const x = rx(a[0] + (b[0] - a[0]) * k / n), z = rz(a[1] + (b[1] - a[1]) * k / n); if (intSolidAt(x, z, .15, F[P.fl])) blocked.push([+x.toFixed(2), +z.toFixed(2)]); if (Math.abs(footholdY(x, z, F[P.fl], 0) - F[P.fl]) > .02) off++; } }
      return { fl: P.fl, blocked: blocked.length, at: blocked.slice(0, 3), off }; });
    INT_SOL = keep;
    const doors = INT_DOORS.map(d => ({ y: +d.y.toFixed(2), h: +d.h.toFixed(2) }));
    const bed = residentBed(), B = T.boxes.find(q => q.tag === 'bed'), bx0 = Math.min(rx(B.x0), rx(B.x1)), bx1 = Math.max(rx(B.x0), rx(B.x1)), inBed = !!bed && bed.x > bx0 && bed.x < bx1 && bed.cz > rz(B.z0) && bed.cz < rz(B.z1) && Math.abs(bed.y - F[2]) < .01;
    // the home's chest on the second floor, on its own floor, with a side clear to open it from
    const box = INT_BOX, boxSide = box && Math.abs(box.y - F[2]) < .01 ? [[0, .62], [0, -.62], [.7, 0], [-.7, 0]].filter(([dx, dz]) => { const x = box.x + dx, z = box.z + dz; return x > .3 && x < W - .3 && z > .3 && z < D - .3 && !intSolidAt(x, z, .25, F[2]); }).length : 0;
    const resident = intNPCMesh ? { x: +intNPCPos.x.toFixed(2), z: +intNPCPos.z.toFixed(2), clear: !intSolidAt(intNPCPos.x, intNPCPos.z, .2, 0) } : null;
    const fire = interiorScene.children.find(c => c.userData && c.userData.hearthFire);
    return { W, D, s, F, scale: Math.abs(T.group.scale.x), bays: T.bays, want: [+(h.kit.bays * 1.95 + .6 - .9).toFixed(3), +(h.d - .9).toFixed(3)], open, arrive, exitZ: +exitZ.toFixed(2), climb, walks, doors, bed: bed && { x: +bed.x.toFixed(2), cz: +bed.cz.toFixed(2), owner: bed.owner }, inBed, box: !!box, boxSide, resident, lights, draws, tris: Math.round(tris),
      fireOn: !!fire && fire.userData.hearthFire.visible && fire.userData.hearthLights.every(l => l.intensity > 0) };
  });
  check(`[${tag}] the room is the house's inside, ${r.W} by ${r.D} m (${r.want.join(' by ')}), at its true size (scale ${r.scale}), ${r.s < 0 ? 'mirrored' : 'as drawn'}`, r.bays === H.bays && Math.abs(r.W - r.want[0]) < .01 && Math.abs(r.D - r.want[1]) < .01 && r.scale === 1 && r.s === Math.sign(H.door), r);
  check(`[${tag}] walled all round on all three floors (${r.open.length} openings at 0.6 or 2 m over a floor)`, r.open.length === 0, r.open.slice(0, 8));
  check(`[${tag}] you arrive clear at ${r.arrive.x}, ${r.arrive.z} m, at the door, outside its reach (from ${r.exitZ} m)`, r.arrive.atDoor && r.arrive.clear && !r.arrive.exits, r.arrive);
  for (const [i, c] of r.climb.entries()) check(`[${tag}] the stair climbs to the ${i ? 'second' : 'first'} floor at ${c.top} m in steps of ${c.maxStep} m or less, nothing in the way, ${c.minHead} m over the head`, Math.abs(c.top - c.want) < .01 && c.maxStep <= .4 && c.blocked === 0 && c.minHead >= 1.8, c);
  check(`[${tag}] the seven walks are clear on their floors (${r.walks.map(w => w.blocked).join(', ')} points in something)`, r.walks.length === 7 && r.walks.every(w => w.blocked === 0 && w.off === 0), r.walks);
  check(`[${tag}] five doors hung (${r.doors.map(d => d.y).join(', ')} m up), each ${[...new Set(r.doors.map(d => d.h))].join(' or ')} m high`, r.doors.length === 5 && r.doors.every(d => d.h > 1.95 && d.h < 2.1), r.doors);
  check(`[${tag}] the curtained bed is the resident's (${r.bed && r.bed.owner}, at ${r.bed && [r.bed.x, r.bed.cz].join(', ')}), the home's chest upstairs has ${r.boxSide} sides clear to open it from`, r.inBed && r.bed.owner === 'home' && r.box && r.boxSide >= 1, r);
  check(`[${tag}] lit by the four fires and the lamps (${r.lights} lights, 12 or fewer), ${r.draws} draws (60 or fewer), ${r.tris.toLocaleString()} triangles`, r.fireOn && r.lights >= 8 && r.lights <= 12 && r.draws <= 60, r);

  // at night the resident lies in the bed; a bought house has its cellar hatch, clear; a Mages' cold hearth is dark until done
  const more = await page.evaluate(id => { const h = currentHouse, rebuild = () => { WORLD.buildInteriorFor(h); scene = interiorScene; };
    forceTime(22); rebuild(); const res22 = intNPCMesh ? { x: +intNPCPos.x.toFixed(2), z: +intNPCPos.z.toFixed(2), clear: !intSolidAt(intNPCPos.x, intNPCPos.z, .2, 0) } : null;
    forceTime(1); rebuild(); const am = intNPCMesh && intNPCMesh.userData.asleep, b = residentBed(), asleep = !!am && !!b && Math.abs(am.x - b.x) < .01 && Math.abs(am.z - b.z) < .01;
    forceTime(12); h.ownedByPlayer = true; rebuild(); const hatch = HATCH.active ? { x: +HATCH.x.toFixed(2), z: +HATCH.z.toFixed(2), clear: !intSolidAt(HATCH.x, HATCH.z, .2, 0) && [[0, .6], [0, -.6], [.6, 0], [-.6, 0]].some(([dx, dz]) => !intSolidAt(HATCH.x + dx, HATCH.z + dz, .3, 0)) } : null; h.ownedByPlayer = false;
    const G = worldState.guild || (worldState.guild = {}); G.guild_m = G.guild_m || {}; const was = G.guild_m.active; G.guild_m.active = { kind: 'hearth', done: false, house: h.id, siteId: h.siteId };
    rebuild(); const holder = interiorScene.children.find(c => c.userData && c.userData.hearthFire), cold = !!holder && !holder.userData.hearthFire.visible && holder.userData.hearthLights.every(l => l.intensity === 0);
    G.guild_m.active.done = true; WORLD.tickInterior(1 / 60, performance.now()); const lit = !!holder && holder.userData.hearthFire.visible && holder.userData.hearthLights.every(l => l.intensity > 0);
    G.guild_m.active = was; rebuild(); return { res22, asleep, hatch, cold, lit }; }, H.id);
  check(`[${tag}] at 22h the resident is in, standing clear in the kitchen at ${more.res22 && [more.res22.x, more.res22.z].join(', ')}`, !!more.res22 && more.res22.clear, more.res22);
  check(`[${tag}] at night the resident lies in the curtained bed`, more.asleep, more);
  check(`[${tag}] a bought house's cellar hatch lies in the hall's flags at ${more.hatch && [more.hatch.x, more.hatch.z].join(', ')}, clear to stand by`, !!more.hatch && more.hatch.clear, more.hatch);
  check(`[${tag}] a Mages' cold hearth shows no fire and no light on the four, and they catch when its task is done`, more.cold && more.lit, more);

  await page.evaluate(() => { const h = currentHouse; px = intArriveX(h); pz = intArrivalZ(h); jumpY = 0; interact(); });
  await g.frames(30);
  check(`[${tag}] at the arrival spot E does not take you out`, await page.evaluate(() => isInterior()));
  if (H === picks[0]) { await page.evaluate(() => { const h = currentHouse; try { closeDialog(); } catch (e) {} VM_SCENE.visible = false; px = intArriveX(h); pz = intArrivalZ(h) + .3; jumpY = 0; yaw = -.45 * h._mirror; pitch = -.06; });
    await g.frames(6); await page.screenshot({ path: path.join(here, '../docs/prototypes/kit-townhouse-hall.png') });
    await page.evaluate(() => { const h = currentHouse, T = h._townhouse, X = T.inner.x1, Z = T.inner.z1; px = X + h._mirror * (T.part.x - .25); pz = Z + T.mid.front + .9; jumpY = T.floors[1] - T.floors[0]; yaw = h._mirror * (Math.PI / 2 - .25); pitch = -.12; });
    await g.frames(6); await page.screenshot({ path: path.join(here, '../docs/prototypes/kit-townhouse-drawing.png') });
    console.log('  (pictures: docs/prototypes/kit-townhouse-hall.png, kit-townhouse-drawing.png)'); }
  await page.evaluate(() => { exitInterior(); });
  for (let k = 0; k < 40 && (await page.evaluate(() => isInterior())); k++) await page.waitForTimeout(250);
  await page.waitForTimeout(1500);
}
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
