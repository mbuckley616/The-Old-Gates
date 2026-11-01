// A town's guild hall inside, on the new look (Session 1701; card F9, Michael's C on #352; rooms.js's gatelandsGuildHall of Sessions
// 939, 965 and 966; OG-043). On ?look=new a guild hall standing as the kit's own hall (lot.kit.kind 'guildhall', S1083) opens on that
// hall inside, at its true size: PKIT.gl.guildHall, the hall open to its trusses, the gallery along the back wall at 3.2 m and its stair,
// the dormitory of six beds over the steward's room. Both guilds (Dunmore has one of each): walled all round below the windows but the
// great door; you arrive clear; the prototype's six walks on foot with the game's ground and solids (four on the floor, two upstairs);
// up the stair onto the gallery; through the partition's doors; the six beds the guild's, upstairs; the steward behind the desk in reach
// from before it; the three members on clear floor; the cellar's hatch; the Mages' book on the gallery's press; lit, within the draws;
// out by the door. Pictures from the great door, at the desk, and along the gallery.
import { boot, check } from './lib/game.mjs';
import fs from 'fs'; import path from 'path'; import { fileURLToPath } from 'url';
const here = path.dirname(fileURLToPath(import.meta.url));

const g = await boot({ look: 'new' }); const { page } = g; await g.intoWorld(); await g.settle('dunmore');
const halls = await page.evaluate(() => WORLD.settle.get('dunmore').houses.filter(h => (h.type === 'guild_f' || h.type === 'guild_m') && h.kit && h.kit.kind === 'guildhall').map(h => h.type));
check(`Dunmore's two guild halls stand as the kit's hall (${halls.join(', ')})`, halls.includes('guild_f') && halls.includes('guild_m'), halls);
fs.mkdirSync(path.join(here, '../docs/prototypes'), { recursive: true });

for (const type of ['guild_f', 'guild_m']) {
  if (!halls.includes(type)) continue;
  const tag = type === 'guild_f' ? 'the Fighters’ hall' : 'the Mages’ hall';
  await page.evaluate(type => { const h = WORLD.settle.get('dunmore').houses.find(h => h.type === type && h.kit && h.kit.kind === 'guildhall'); window._H = h; forceTime(12); px = h.exitX; pz = h.exitZ; goToInterior(h); }, type);
  for (let k = 0; k < 60 && !(await page.evaluate(() => isInterior() && currentHouse === _H)); k++) await page.waitForTimeout(250);
  await g.frames(3);
  const r = await page.evaluate(() => {
    const h = currentHouse, T = h._guildHall; if (!T) return { none: true, type: h && h.type };
    const W = h.intW, D = h.intD, X = T.inner.x1, Z = T.inner.z1, F1 = T.floors[1] - T.floors[0]; interiorScene.updateMatrixWorld(true);
    const meshes = []; let lights = 0, draws = 0, tris = 0, people = 0; const rigs = [intNPCMesh, ...INT_NPCS.map(n => n.g)].filter(Boolean), inRig = o => { for (let p = o; p; p = p.parent) if (rigs.includes(p)) return true; return false; };
    interiorScene.traverse(o => { if (o.isLight && !o.isAmbientLight && o.intensity > 0) lights++; if (o.isMesh && o.visible) { if (inRig(o)) people++; else { draws++; tris += (o.geometry.index ? o.geometry.index.count : o.geometry.attributes.position.count) / 3; meshes.push(o); } } });
    const rc = new THREE.Raycaster(), O = new THREE.Vector3(), Dv = new THREE.Vector3();
    const hit = (x, y, z, dx, dy, dz, far = 20) => { O.set(x, y, z); Dv.set(dx, dy, dz).normalize(); rc.set(O, Dv); rc.far = far; return rc.intersectObjects(meshes, false)[0] || null; };
    /* walled all round below the sills (0.5 m up; the lowest sill is 1.0): from 0.6 m inside each wall, every metre along it, the wall (or a door's leaf, at the wall's outer face) within 1.5 m */
    const open = []; for (let x = .5; x < W - .4; x += 1) { if (Math.abs(x - h._exitX) > 1.3 && !hit(x, .5, D - .6, 0, 0, 1, 1.5)) open.push(['front', +x.toFixed(1)]); if (!hit(x, .5, .6, 0, 0, -1, 1.5)) open.push(['back', +x.toFixed(1)]); }
    for (let z = .5; z < D - .4; z += 1) { if (!hit(W - .6, .5, z, 1, 0, 0, 1.5)) open.push(['east', +z.toFixed(1)]); if (!hit(.6, .5, z, -1, 0, 0, 1.5)) open.push(['west', +z.toFixed(1)]); }
    const out = hit(h._exitX, 1.6, D - 1, 0, 0, 1, 3), door = out ? !!out.object.userData.daylight : false;
    /* open to the roof over the hall: straight up from the practice floor a ray meets the lining or a truss over 5.6 m */
    const up = hit(T.pell.x + X + .4, 2, T.pell.z + Z + .4, 0, 1, 0, 30), upY = up ? +up.point.y.toFixed(2) : null;
    const az = intArrivalZ(h), arrive = { x: +px.toFixed(2), z: +az.toFixed(2), clear: !intSolidAt(px, az, .3, 0), exits: az > D - h._exitD };
    const walk = (pts, y0 = 0) => { let y = y0, blocked = [], maxStep = 0, [x, z] = pts[0]; for (let i = 1; i < pts.length; i++) { const [x1, z1] = pts[i], n = Math.ceil(Math.hypot(x1 - x, z1 - z) / .05);
        for (let k = 1; k <= n; k++) { const xx = x + (x1 - x) * k / n, zz = z + (z1 - z) * k / n, ny = footholdY(xx, zz, y, 0); maxStep = Math.max(maxStep, Math.abs(ny - y)); y = ny; if (intSolidAt(xx, zz, .2, y)) blocked.push([+xx.toFixed(2), +zz.toFixed(2), +y.toFixed(2)]); } x = x1; z = z1; }
      return { blocked: blocked.length, at: blocked.slice(0, 3), maxStep: +maxStep.toFixed(3), y: +y.toFixed(3) }; };
    const walks = T.paths.map(P => walk(P.pts.map(([x, z]) => [x + X, z + Z]), P.fl ? F1 : 0));
    /* up the stair from its foot onto the gallery, along it to the west gable, and back and in at the dormitory's door to its far bed */
    const S = T.stair, sx = (S.x0 + S.x1) / 2 + X, dd = (T.doors.dorm.z0 + T.doors.dorm.z1) / 2 + Z, sd = (T.doors.steward.z0 + T.doors.steward.z1) / 2 + Z;
    const stair = walk([[sx, S.z1 + Z + .45], [sx, S.z0 + Z - .5], [.7, S.z0 + Z - .5]]);
    const dorm = walk([[sx, S.z1 + Z + .45], [sx, dd], [T.part.x1 + X + .45, dd], [T.part.x1 + X + .45, D - .5]]);
    /* through the steward's door on the ground floor, from the hall to the strongbox */
    const steward = walk([[T.part.x0 + X - .45, sd], [T.part.x1 + X + .45, sd], [T.part.x1 + X + .45, Z]]);
    const beds = INT_BEDS.map(b => ({ y: b.y, owner: b.owner, reach: Math.abs(b.y - F1) < .01 && !intSolidAt(b.x - 1.9, b.z, .2, F1) && Math.abs(footholdY(b.x - 1.9, b.z, F1, 0) - F1) < .01 })); /* from the aisle beyond the chest at its foot */
    const P = intNPCMesh ? { x: +intNPCPos.x.toFixed(2), z: +intNPCPos.z.toFixed(2) } : null;
    /* the steward: stood clear behind the desk, and from before the desk (0.35 m off its front) in reach to talk */
    let talk = null; if (P) { const ox = px, oz = pz; px = P.x - .2; pz = T.desk.z1 + Z + .35; jumpY = 0; talk = { reach: keeperInReach(), d: +Math.hypot(px - P.x, pz - P.z).toFixed(2), behind: P.z < T.desk.z0 + Z, clear: !intSolidAt(P.x, P.z, .2, 0) }; px = ox; pz = oz; }
    const members = INT_NPCS.map(n => ({ x: +n.g.position.x.toFixed(2), z: +n.g.position.z.toFixed(2), clear: !intSolidAt(n.g.position.x, n.g.position.z, .25, 0), apart: !intNPCMesh || Math.hypot(n.g.position.x - intNPCPos.x, n.g.position.z - intNPCPos.z) > .8 }));
    const hatch = HATCH.active ? { x: +HATCH.x.toFixed(2), z: +HATCH.z.toFixed(2), clear: !intSolidAt(HATCH.x, HATCH.z, .45, 0), back: !intSolidAt(HATCH.x, HATCH.z + .9, .3, 0) && HATCH.z + .9 < D - .3, inSteward: HATCH.x > T.part.x1 + X } : null;
    const shelf = INT_SHELF ? { x: +INT_SHELF.x.toFixed(2), z: +INT_SHELF.z.toFixed(2), y: INT_SHELF.y, stand: !intSolidAt(INT_SHELF.x, INT_SHELF.z + .7, .25, INT_SHELF.y) && Math.abs(footholdY(INT_SHELF.x, INT_SHELF.z + .7, INT_SHELF.y, 0) - INT_SHELF.y) < .01 } : null;
    return { guild: T.guild, W: +W.toFixed(2), D: +D.toFixed(2), H: h._roomH, scaledBy: T.group.scale.x, open, door, upY, arrive, walks, stair, dorm, steward, beds, P, talk, members, hatch, shelf, lights, draws, people, tris: Math.round(tris) };
  });
  console.log(type, JSON.stringify({ ...r, walks: r.walks && r.walks.map(w => w.blocked) }));
  check(`${tag}: the room is the kit's guild hall inside, ${r.W} by ${r.D} m and open to ${r.H} m under the ridge, at its true size (scale ${r.scaledBy})`, !r.none && Math.abs(r.W - 13) < .05 && Math.abs(r.D - 7.6) < .05 && r.H > 9.5 && r.scaledBy === 1, r);
  if (r.none) continue;
  check(`${tag}: walled all round below the sills, the great door aside (${r.open.length} openings); through the door, the day`, r.open.length === 0 && r.door, { open: r.open.slice(0, 8), door: r.door });
  check(`${tag}: open to the roof over the practice floor: straight up, the trusses or the lining at ${r.upY} m`, r.upY != null && r.upY > 5.6, r.upY);
  check(`${tag}: you arrive clear inside the great door at ${r.arrive.x}, ${r.arrive.z} m`, r.arrive.clear && !r.arrive.exits, r.arrive);
  check(`${tag}: the prototype's six walks (to the desk, to the steward's table, from the back door, to the hearth, along the gallery, down the dormitory) on foot, nothing in the way`, r.walks.length === 6 && r.walks.every(w => w.blocked === 0 && w.maxStep <= .4), r.walks);
  check(`${tag}: up the stair onto the gallery (${r.stair.y} m, steps of ${r.stair.maxStep} m) and along it to the west gable`, r.stair.blocked === 0 && Math.abs(r.stair.y - 3.15) < .02 && r.stair.maxStep <= .25, r.stair);
  check(`${tag}: from the stair's head in at the dormitory's door and down its aisle, on the floor at ${r.dorm.y} m`, r.dorm.blocked === 0 && Math.abs(r.dorm.y - 3.15) < .02, r.dorm);
  check(`${tag}: through the partition's door into the steward's room`, r.steward.blocked === 0 && Math.abs(r.steward.y) < .01, r.steward);
  check(`${tag}: six beds upstairs, the guild's, each with clear floor beside it`, r.beds.length === 6 && r.beds.every(b => b.owner === 'guild' && b.reach), r.beds);
  check(`${tag}: the steward stands clear behind the desk, in reach to talk from before it (${r.talk && r.talk.d} m)`, !!r.talk && r.talk.reach && r.talk.behind && r.talk.clear, { P: r.P, talk: r.talk });
  check(`${tag}: three members, each on clear floor and apart from the steward`, r.members.length === 3 && r.members.every(m => m.clear && m.apart), r.members);
  check(`${tag}: the cellar's hatch in the steward's room, on clear flags, with room to come back up beside it`, !!r.hatch && r.hatch.clear && r.hatch.back && r.hatch.inSteward, r.hatch);
  if (type === 'guild_m') check(`${tag}: the guild's book is on the gallery's middle press, ${r.shelf && r.shelf.y} m up, with gallery floor before it`, !!r.shelf && r.shelf.y > 3 && r.shelf.stand, r.shelf);
  else check(`${tag}: no shelf book (the Fighters keep none)`, r.shelf === null, r.shelf);
  check(`${tag}: lit (${r.lights} lights); ${r.draws} meshes (40 or fewer) and ${r.tris.toLocaleString()} triangles (30,000 or fewer) besides the ${r.people} of its people`, r.lights >= 4 && r.draws <= 40 && r.tris <= 30000 && r.people >= 4, r);

  const pic = n => path.join(here, `../docs/prototypes/guildhall-${type === 'guild_f' ? 'fighters' : 'mages'}-${n}.png`);
  await page.evaluate(() => { const h = currentHouse; VM_SCENE.visible = false; px = h._exitX + .9; pz = h.intD - .7; jumpY = 0; yaw = .35; pitch = .1; });
  await g.frames(6); await page.screenshot({ path: pic('hall') }); console.log(`  (picture: ${path.relative(path.join(here, '..'), pic('hall'))})`);
  await page.evaluate(() => { const h = currentHouse, T = h._guildHall; px = T.part.x0 + T.inner.x1 - .8; pz = .75; jumpY = T.floors[1] - T.floors[0]; yaw = Math.PI / 2 + .35; pitch = -.3; });
  await g.frames(6); await page.screenshot({ path: pic('gallery') }); console.log(`  (picture: ${path.relative(path.join(here, '..'), pic('gallery'))})`);
  await page.evaluate(() => { const h = currentHouse; px = h._exitX; pz = h.intD - .4; jumpY = 0; yaw = Math.PI; pitch = 0; interact(); });
  for (let k = 0; k < 40 && (await page.evaluate(() => isInterior())); k++) await page.waitForTimeout(250);
  check(`${tag}: at the great door E takes you out`, !(await page.evaluate(() => isInterior())));
  await g.spin(null, 10);
}
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
