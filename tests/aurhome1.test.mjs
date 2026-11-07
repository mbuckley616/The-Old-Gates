// Aurenne's one-storey home in the game (Session 1968; card F9, OG-115; the flat of Michael's A on #318 brought down to one storey, rooms.js's
// aurenneHomeOne). On the new look a one-storey flat-roofed Aurennais street home opens on its own room: the street's own shell at its true
// size (its wall's colour the street's), the divan, the bed and its chest, the cooking bench, and the steep stair up through the hatch to the
// roof terrace (unless the street's house has its outside stair). You arrive clear; the prototype's three walks on foot with the game's
// ground and solids; up the roof stair onto the terrace; the room's head room is the roof, the terrace's the sky; the resident's bed and the
// home's chest; lit and within its draws; you leave by the door. Pictures.
import { boot, check } from './lib/game.mjs';
import fs from 'fs'; import path from 'path'; import { fileURLToPath } from 'url';
const here = path.dirname(fileURLToPath(import.meta.url));
const towns = () => { anchoredPlaces(); return [...CELLS.values()].filter(c => c.type !== 'sea' && nationKeyOf(c.i, c.j) === 'aurenne').flatMap(c => c.sites).filter(s => ['town', 'port', 'city'].includes(s.kind)).slice(0, 3).map(s => s.id); };

const g = await boot({ look: 'new' }); const { page } = g; await g.intoWorld();
let home = null; const tally = [];
for (const id of await page.evaluate(towns)) {
  if (!(await g.settle(id))) { check(`${id} stands`, false); continue; }
  const r = await page.evaluate(id => { const S = WORLD.settle.get(id), H = S.houses.filter(h => h.siteId === id && h.type === 'home' && h.kit && h.kit.kind === 'aurhouse'),
      one = H.filter(h => h.kit.o.kind === 'flat' && !h.kit.o.two), hatch = one.filter(h => !h.kit.o.stair);
    const pick = hatch.sort((a, b) => b.kit.o.w - a.kit.o.w)[0];
    return { kit: H.length, one: one.length, hatch: hatch.length, pick: pick && { id: pick.id, w: pick.kit.o.w, d: pick.kit.o.d, dome: pick.kit.o.dome || null, wall: 'wall:' + Math.floor(PKIT.stream(pick.kit.shell)() * PKIT.au.AUR.walls.length) } }; }, id);
  tally.push(`${id}: ${r.one} one-storey flat homes of ${r.kit} (${r.hatch} with the hatch)`); if (!home && r.pick) home = { site: id, ...r.pick };
}
console.log('  ' + tally.join('; '));
check(`a one-storey flat-roofed home with its hatch stands in the first three towns of Aurenne (${home && home.id}, ${home && home.w} by ${home && home.d} m)`, !!home, tally);
if (home) {
  await g.settle(home.site);
  await page.evaluate(([site, id]) => { const h = WORLD.settle.get(site).houses.find(h => h.id === id); forceTime(12); px = h.exitX; pz = h.exitZ; goToInterior(h); }, [home.site, home.id]);
  for (let k = 0; k < 40 && !(await page.evaluate(() => isInterior())); k++) await page.waitForTimeout(250);
  await g.frames(2);
  const r = await page.evaluate(street => {
    const h = currentHouse, T = h._aurHomeOne; if (!T) return { none: true, type: h && h.type, kit: h && h.kit && h.kit.kind };
    const W = h._roomW, D = h._roomD, X = T.inner.x1, Z = T.inner.z1, F0 = T.floors[0], FL = T.floors.map(y => y - F0); interiorScene.updateMatrixWorld(true);
    const meshes = []; let lights = 0, draws = 0, tris = 0; const inNPC = o => { for (let p = o; p; p = p.parent) if (p === intNPCMesh) return true; return false; };
    interiorScene.traverse(o => { if (o.isLight && !o.isAmbientLight && !o.isHemisphereLight && o.intensity > 0) lights++; if (o.isMesh && o.visible && !(intNPCMesh && inNPC(o))) { draws++; tris += (o.geometry.index ? o.geometry.index.count : o.geometry.attributes.position.count) / 3; meshes.push(o); } });
    const wm = T.shell.children.find(m => /^wall:/.test(m.name)), wall = wm ? wm.name : null;
    const rc = new THREE.Raycaster(), O = new THREE.Vector3(), Dv = new THREE.Vector3();
    const hit = (x, y, z, dx, dy, dz, far = 40) => { O.set(x, y, z); Dv.set(dx, dy, dz).normalize(); rc.set(O, Dv); rc.far = far; return rc.intersectObjects(meshes, false)[0] || null; };
    const out = hit(intDoorX(h), 1.6, D - 1.0, 0, 0, 1, 30), door = !!(out && out.object.userData.daylight);
    const az = intArrivalZ(h), arrive = { x: +px.toFixed(2), z: +az.toFixed(2), clear: !intSolidAt(px, az, .3, 0), exits: az > D - h._exitD };
    const walk = (pts, y0) => { let y = y0, blocked = [], maxStep = 0, [x, z] = pts[0]; for (let i = 1; i < pts.length; i++) { const [x1, z1] = pts[i], n = Math.ceil(Math.hypot(x1 - x, z1 - z) / .05);
        for (let k = 1; k <= n; k++) { const xx = x + (x1 - x) * k / n, zz = z + (z1 - z) * k / n, ny = footholdY(xx, zz, y, 0); maxStep = Math.max(maxStep, Math.abs(ny - y)); y = ny; if (intSolidAt(xx, zz, .15, y)) blocked.push([+xx.toFixed(2), +zz.toFixed(2), +y.toFixed(2)]); } x = x1; z = z1; }
      return { blocked: blocked.length, at: blocked.slice(0, 3), maxStep: +maxStep.toFixed(3), y: +y.toFixed(3), y0 }; };
    const L = ([x, z]) => [x + X, z + Z], walks = T.paths.map(P => walk(P.map(L), 0));
    /* the roof stair: from its foot, along its treads (x rising) to its head under the hatch, and off forward onto the terrace */
    const R = T.roofStair, rz = (R.z0 + R.z1) / 2, roof = walk([[R.x0 - .25, rz], [R.x1 - .05, rz], [R.x1 - .05, R.z1 + .8]].map(L), 0);
    const head = { room: +headCeil(X, Z + .3, 0).toFixed(2), terrace: +(headCeil(X, Z, FL[1]) - FL[1]).toFixed(2) };
    const bed = INT_BEDS.find(b => b.owner === 'home'), B = INT_BOX;
    const P = intNPCMesh ? { x: +intNPCPos.x.toFixed(2), z: +intNPCPos.z.toFixed(2), clear: !intSolidAt(intNPCPos.x, intNPCPos.z, .2, 0) } : null;
    return { W: +W.toFixed(2), D: +D.toFixed(2), w: T.w, d: T.d, scaledBy: T.group.scale.x, wall, street, door, arrive, walks, roof, head, FL: FL.map(v => +v.toFixed(3)), bed: bed && { y: bed.y }, box: B && { y: B.y }, npc: P, lights, draws, tris: Math.round(tris) };
  }, home.wall);
  check(`its door opens on the one-storey home, ${r.W} by ${r.D} m inside a house of ${r.w} by ${r.d}, at its true size (scale ${r.scaledBy}), in the street's own walls (${r.wall}, the street's ${r.street})`, !r.none && r.w === home.w && r.d === home.d && r.scaledBy === 1 && r.wall === r.street, r);
  if (!r.none) {
    check(`through the street door the day`, r.door, { door: r.door });
    check(`you arrive clear at ${r.arrive.x}, ${r.arrive.z} m`, r.arrive.clear && !r.arrive.exits, r.arrive);
    check(`the prototype's ${r.walks.length} walks (to the roof stair, the table, the bed) on foot, nothing in the way`, r.walks.length === 3 && r.walks.every(w => w.blocked === 0 && w.maxStep <= .4 && Math.abs(w.y) < .01), r.walks);
    check(`up the roof stair through the hatch onto the terrace, ${r.roof.y} m up, in steps of ${r.roof.maxStep} m`, r.roof.blocked === 0 && Math.abs(r.roof.y - r.FL[1]) < .01 && r.roof.maxStep <= .4, r.roof);
    check(`head room: the room's is the roof (${r.head.room} m), the terrace's the sky (${r.head.terrace} m)`, r.head.room > 2.5 && r.head.room < r.FL[1] && r.head.terrace > 3, r.head);
    check(`the resident's bed and the home's chest on the room's floor (${r.bed && r.bed.y}, ${r.box && r.box.y} m)`, r.bed && r.bed.y === 0 && r.box && r.box.y === 0, { bed: r.bed, box: r.box });
    check(`the resident at the cooking bench at ${r.npc && [r.npc.x, r.npc.z].join(', ')}, clear`, !r.npc || r.npc.clear, r.npc);
    check(`lit (${r.lights} lights) in ${r.draws} draws (40 or fewer), ${r.tris.toLocaleString()} triangles`, r.lights >= 3 && r.lights <= 10 && r.draws <= 40 && r.tris < 60000, r);
    fs.mkdirSync(path.join(here, '../docs/prototypes'), { recursive: true });
    const shot = async (name, set) => { await page.evaluate(set); await g.frames(6); await page.screenshot({ path: path.join(here, '../docs/prototypes/' + name) }); console.log('  (picture: docs/prototypes/' + name + ')'); };
    await shot('aurhome1-room-ingame.png', () => { const h = currentHouse; VM_SCENE.visible = false; px = intDoorX(h); pz = h._roomD - .7; jumpY = 0; yaw = 0; pitch = -.08; });
    await shot('aurhome1-terrace-ingame.png', () => { const h = currentHouse, T = h._aurHomeOne, X = T.inner.x1, Z = T.inner.z1; px = 2 * X - .5; pz = .9; jumpY = T.floors[1] - T.floors[0]; yaw = Math.PI * .75; pitch = -.2; });
    await page.evaluate(() => { const h = currentHouse; px = intDoorX(h); pz = h._roomD - .4; jumpY = 0; yaw = Math.PI; pitch = 0; interact(); });
    for (let k = 0; k < 40 && (await page.evaluate(() => isInterior())); k++) await page.waitForTimeout(250);
    check('at the door E takes you out', !(await page.evaluate(() => isInterior())));
  }
}
check('no errors', g.errs.length === 0, g.errs.slice(0, 5));
await g.close();
