// Aurenne's courtyard house in the game (Session 1419; card F6, Michael's A on #318 and #329: 15 by 15 m, pantile sloping into the court;
// OG-115). On the new look an Aurennais town's or port's better quarter has one courtyard house (a city's two), PKIT.au.courtyard on the home
// lot nearest the heart where it stands on level ground, clear of roads, streets, plots, shops and kit lots; the homes it would stand on are
// let go. Measured on three towns of Aurenne: its solid is its lot, the walls stand inside it, the street door is straight ahead from the
// knock point, no other building's solid reaches into it, the ground under it is level to 0.2 m, it is within its triangles and draws, and
// the far copy covers it. A picture from the street at noon.
import { boot, check } from './lib/game.mjs';
import fs from 'fs'; import path from 'path'; import { fileURLToPath } from 'url';
const here = path.dirname(fileURLToPath(import.meta.url));
const towns = () => { anchoredPlaces(); return [...CELLS.values()].filter(c => c.type !== 'sea' && nationKeyOf(c.i, c.j) === 'aurenne').flatMap(c => c.sites).filter(s => ['town', 'port', 'city'].includes(s.kind)).slice(0, 3).map(s => s.id); };

const g = await boot({ look: 'new' }); const { page } = g; await g.intoWorld();
let shot = null, found = 0, inside = null;
for (const id of await page.evaluate(towns)) {
  if (!(await g.settle(id))) { check(`${id} stands`, false); continue; }
  const r = await page.evaluate(id => {
    const S = WORLD.settle.get(id), site = siteAnywhere(id), H = S.houses.filter(h => h.siteId === id && h.kit && h.kit.kind === 'aurcourt');
    let kitG = null; S.group.traverse(x => { if (x.name === 'kit houses') kitG = x; }); WORLD.scene.updateMatrixWorld(true);
    const far = S.group.children.find(m => m.name === 'kit houses far'), fb = far && new THREE.Box3().setFromObject(far);
    const rc = new THREE.Raycaster(), O = new THREE.Vector3(), Dv = new THREE.Vector3();
    const inRect = (s, x, z, m) => { const ex = x - s.cx, ez = z - s.cz; return Math.abs(ex * s.c - ez * s.s) < s.rx + m && Math.abs(ex * s.s + ez * s.c) < s.rz + m; };
    return { kind: site.kind, n: H.length, homes: S.houses.filter(h => h.siteId === id && h.type === 'home').length, houses: H.map(h => {
      const s = S.sol.find(o => o.hid === h.id), meshes = []; kitG.traverse(m => { if (m.isMesh) meshes.push(m); });
      const ray = (x, y, z, dx, dz, far) => { O.set(x, y, z); Dv.set(dx, 0, dz).normalize(); rc.set(O, Dv); rc.far = far; return rc.intersectObjects(meshes, false)[0] || null; };
      /* its walls stand inside its solid: from 0.5 m outside the solid at the back and the two sides, 1.5 m up, at three places along each,
         the wall is met within 1.0 m (the solid's 0.15 margin, the plinth's 0.08 and the cornice's overhang) */
      const nx = s.s, nz = s.c, ex = s.c, ez = -s.s, base = WORLD.worldH(s.cx, s.cz) + 1.5, walls = [];
      for (const t of [-.6, 0, .6]) { walls.push(ray(s.cx - nx * (s.rz + .5) + ex * t * s.rx, base, s.cz - nz * (s.rz + .5) + ez * t * s.rx, nx, nz, 1.0));
        for (const sd of [-1, 1]) walls.push(ray(s.cx + sd * ex * (s.rx + .5) + nx * t * s.rz, base, s.cz + sd * ez * (s.rx + .5) + nz * t * s.rz, -sd * ex, -sd * ez, 1.0)); }
      const gy = WORLD.worldH(h.doorX, h.doorZ), fx = -Math.sin(h.exitYaw), fz = -Math.cos(h.exitYaw);
      O.set(h.doorX + fz * .1, gy + 1.2, h.doorZ - fx * .1); /* 0.1 m off the middle: the leaf's six boards meet there */ Dv.set(-fx, 0, -fz).normalize(); rc.set(O, Dv); rc.far = 3; const dh = rc.intersectObjects(meshes, false)[0];
      const door = dh ? { d: +dh.distance.toFixed(2), leaf: PKIT.au.mats().door.includes(dh.object.material) } : null;
      const others = S.sol.filter(o => o !== s && o.cx != null && Math.hypot(o.cx - s.cx, o.cz - s.cz) < 30 && [[-1, -1], [1, -1], [1, 1], [-1, 1], [0, 0]].some(([u, v]) => inRect(s, o.cx + u * o.rx * .95 * o.c + v * o.rz * .95 * (o.s || 0), o.cz - u * o.rx * .95 * (o.s || 0) + v * o.rz * .95 * o.c, -.2))).map(o => o.hid || o.bt);
      const ys = []; for (let u = -1; u <= 1; u += .5) for (let v = -1; v <= 1; v += .5) ys.push(WORLD.worldH(s.cx + u * (s.rx - .15) * s.c + v * (s.rz - .15) * s.s, s.cz - u * (s.rx - .15) * s.s + v * (s.rz - .15) * s.c));
      const wi = walls[0] ? PKIT.au.mats().wall.indexOf(walls[0].object.material) : -1; /* the wall's colour, as the ray from the back meets it */
      return { id: h.id, name: h.name, wall: wi >= 0 ? 'wall:' + wi : null, tris: h.kit.tris, calls: h.kit.calls, lot: [+(2 * s.rx).toFixed(2), +(2 * s.rz).toFixed(2)], walls: walls.every(Boolean), wallD: walls.map(w => w && +w.distance.toFixed(2)), door, others, level: +(Math.max(...ys) - Math.min(...ys)).toFixed(2),
        inFar: !!fb && fb.containsPoint(new THREE.Vector3(s.cx, WORLD.worldH(s.cx, s.cz) + 3, s.cz)), heart: +Math.hypot(s.cx - site.x, s.cz - site.z).toFixed(1), top: h.kit.top,
        knockClear: !S.sol.some(o => o.cx != null && inRect(o, h.exitX, h.exitZ, .3)), view: { x: h.exitX + fx * 9, z: h.exitZ + fz * 9, yaw: h.exitYaw + Math.PI } }; }) };
  }, id);
  console.log(`  ${id} (a ${r.kind}): ${r.n} courtyard house${r.n === 1 ? '' : 's'} among ${r.homes} homes`); found += r.n;
  check(`${id} has no more courtyard houses than its kind allows (${r.n})`, r.n <= (r.kind === 'city' ? 2 : 1), r);
  for (const h of r.houses) {
    check(`${h.name} (${h.id}, ${h.heart} m from the heart): ${h.tris && h.tris.toLocaleString()} triangles in ${h.calls} draws, two storeys and ${h.top} m to the cornice`, h.tris < 32000 && h.calls <= 16 && h.top > 7, h);
    check(`its solid is its lot (${h.lot && h.lot.join(' by ')} m) with its walls inside (${h.wallD && h.wallD.join(', ')} m), and no other building's solid reaches into it (${h.others && h.others.length})`, h.lot && Math.abs(h.lot[0] - 15.46) < .05 && Math.abs(h.lot[1] - 15.83) < .05 && h.walls && h.others.length === 0, h);
    check(`from the knock point (clear: ${h.knockClear}) the street door is straight ahead, ${h.door && h.door.d} m in`, h.knockClear && h.door && h.door.leaf && h.door.d < 1.2, h);
    check(`it stands on level ground (${h.level} m across its lot), and the far copy covers it`, h.level <= .3 && h.inFar, h);
    if (!shot) shot = h.view && { id, ...h.view };
    if (!inside) inside = { id, wall: h.wall };
  }
}
check(`the courtyard house stands in at least two of the three towns (${found}; one on a slope keeps its homes)`, found >= 2);
if (shot) {
  await g.settle(shot.id);
  await page.evaluate(v => { forceTime(12); VM_SCENE.visible = false; if (typeof TP !== 'undefined' && TP.on) TP.on = false; px = v.x; pz = v.z; yaw = v.yaw; pitch = .05; }, shot);
  await g.frames(8);
  fs.mkdirSync(path.join(here, '../docs/prototypes'), { recursive: true });
  await page.screenshot({ path: path.join(here, '../docs/prototypes/courtyard-street-ingame.png') }); console.log('  (picture: docs/prototypes/courtyard-street-ingame.png)');
}

// Inside (Session 1423; card F9, rooms.js's aurenneCourtyardHouse of Session 899): the street door opens on the house's own rooms, in the
// street's own shell at its true size; you arrive clear in the vestibule; the prototype's eleven walks of both floors, and up the stair to
// the landing, on foot with the game's ground and solids, clear by the prototype's 0.15 m; the ground floor's head room is the floor above, the court's is the sky; the
// resident's bed and the home's chest are upstairs, in reach; the room is lit and within its draws; you leave by the door. Pictures.
if (inside) {
  await g.settle(inside.id);
  await page.evaluate(id => { const S = WORLD.settle.get(id), h = S.houses.find(h => h.siteId === id && h.kit && h.kit.kind === 'aurcourt'); forceTime(12); px = h.exitX; pz = h.exitZ; goToInterior(h); }, inside.id);
  for (let k = 0; k < 40 && !(await page.evaluate(() => isInterior())); k++) await page.waitForTimeout(250);
  await g.frames(2);
  const r = await page.evaluate(street => {
    const h = currentHouse, T = h._courtHouse; if (!T) return { none: true, type: h && h.type, kit: h && h.kit && h.kit.kind };
    const W = h._roomW, D = h._roomD, X = T.sh.A, Z = T.sh.A, FL = T.floors.map(y => y - T.floors[0]); interiorScene.updateMatrixWorld(true);
    const meshes = []; let lights = 0, draws = 0, tris = 0, kDraws = 0; const inNPC = o => { for (let p = o; p; p = p.parent) if (p === intNPCMesh) return true; return false; };
    interiorScene.traverse(o => { if (o.isLight && !o.isAmbientLight && !o.isHemisphereLight && o.intensity > 0) lights++; if (o.isMesh && o.visible) { if (intNPCMesh && inNPC(o)) kDraws++; else { draws++; tris += (o.geometry.index ? o.geometry.index.count : o.geometry.attributes.position.count) / 3; meshes.push(o); } } });
    const wm = T.shell.children.find(m => /^wall:/.test(m.name)), wall = wm ? wm.name : null;
    const rc = new THREE.Raycaster(), O = new THREE.Vector3(), Dv = new THREE.Vector3();
    const hit = (x, y, z, dx, dy, dz, far = 20) => { O.set(x, y, z); Dv.set(dx, dy, dz).normalize(); rc.set(O, Dv); rc.far = far; return rc.intersectObjects(meshes, false)[0] || null; };
    const out = hit(intDoorX(h), 1.6, D - 1.2, 0, 0, 1, 4), door = !!(out && out.object.userData.daylight);
    const up = hit(X + 1.2, 1.5, Z + .2, 0, 1, 0, 30), sky = !!(up && up.object.userData.daylight);
    /* the upper storey's street windows: straight out through each, past its lattice, the day */
    const wins = T.sh.outer.front[1].map(q => { const o = hit(X + q.at, FL[1] + .75 + q.h * .4, D - .3, 0, 0, 1, 2); return !!(o && o.object.userData.daylight); });
    const az = intArrivalZ(h), arrive = { x: +px.toFixed(2), z: +az.toFixed(2), clear: !intSolidAt(px, az, .3, 0), exits: az > D - h._exitD };
    const walk = (pts, y0) => { let y = y0, blocked = [], maxStep = 0, [x, z] = pts[0]; for (let i = 1; i < pts.length; i++) { const [x1, z1] = pts[i], n = Math.ceil(Math.hypot(x1 - x, z1 - z) / .05);
        for (let k = 1; k <= n; k++) { const xx = x + (x1 - x) * k / n, zz = z + (z1 - z) * k / n, ny = footholdY(xx, zz, y, 0); maxStep = Math.max(maxStep, Math.abs(ny - y)); y = ny; if (intSolidAt(xx, zz, .15, y)) blocked.push([+xx.toFixed(2), +zz.toFixed(2), +y.toFixed(2)]); } x = x1; z = z1; }
      return { blocked: blocked.length, at: blocked.slice(0, 3), maxStep: +maxStep.toFixed(3), y: +y.toFixed(3), y0 }; };
    const walks = T.paths.map(([fl, P]) => walk(P.map(([x, z]) => [x + X, z + Z]), FL[fl]));
    const stair = walk([[-5.85, 3.05], [-6.68, 3.05], [-6.68, -1.2], [-5.4, -1.2], [-5.4, -2.6]].map(([x, z]) => [x + X, z + Z]), 0);
    const head = { hall: +headCeil(X, Z - 5, 0).toFixed(2), court: +headCeil(X + 1.2, Z + .2, 0).toFixed(2), bedroom: +(headCeil(X, Z - 4.2, FL[1]) - FL[1]).toFixed(2), eaves: +(headCeil(X, Z - 2.3, FL[1]) - FL[1]).toFixed(2) };
    const bed = INT_BEDS.find(b => b.owner === 'home'), B = INT_BOX, boxStand = B && { x: B.x, z: B.z + .75 }, boxOk = !!B && !intSolidAt(boxStand.x, boxStand.z, .3, B.y) && footholdY(boxStand.x, boxStand.z, B.y, 0) === B.y;
    const P = intNPCMesh ? { x: +intNPCPos.x.toFixed(2), z: +intNPCPos.z.toFixed(2), clear: !intSolidAt(intNPCPos.x, intNPCPos.z, .25, 0) } : null;
    return { W: +W.toFixed(2), D: +D.toFixed(2), H: h._roomH, scaledBy: T.group.scale.x, wall, street, door, sky, wins, arrive, walks, stair, head, bed: bed && { y: bed.y, z: +bed.z.toFixed(2) }, F1: +FL[1].toFixed(2), box: B && { y: B.y, ok: boxOk }, npc: P, lights, draws, kDraws, tris: Math.round(tris) };
  }, inside.wall);
  check(`its door opens on the courtyard house inside, ${r.W} by ${r.D} m, at its true size (scale ${r.scaledBy}), in the street's own walls (${r.wall}, the street's ${r.street})`, !r.none && Math.abs(r.W - 14.36) < .05 && Math.abs(r.D - 14.36) < .05 && r.scaledBy === 1 && r.wall === r.street, r);
  if (!r.none) {
    check(`through the street door the day, over the court the sky, and through the ${r.wins.length} street windows upstairs the day (${r.wins.filter(Boolean).length})`, r.door && r.sky && r.wins.every(Boolean), { door: r.door, sky: r.sky, wins: r.wins });
    check(`you arrive clear in the vestibule at ${r.arrive.x}, ${r.arrive.z} m`, r.arrive.clear && !r.arrive.exits, r.arrive);
    check(`the prototype's ${r.walks.length} walks of both floors on foot, nothing in the way, each on its own floor`, r.walks.length === 11 && r.walks.every(w => w.blocked === 0 && w.maxStep <= .4 && Math.abs(w.y - w.y0) < .01), r.walks);
    check(`up the stair's 16 risers to the landing and onto the upper floor, ${r.stair.y} m up, in steps of ${r.stair.maxStep} m`, r.stair.blocked === 0 && Math.abs(r.stair.y - r.F1) < .01 && r.stair.maxStep <= .4, r.stair);
    check(`head room: the hall's is the floor above (${r.head.hall} m), the court's the sky (${r.head.court} m); upstairs ${r.head.bedroom} m in the bedroom and ${r.head.eaves} m by the gallery's eaves`, r.head.hall < r.F1 && r.head.hall > 2.5 && r.head.court > 7 && r.head.bedroom > 2.6 && r.head.eaves > 1.9 && r.head.eaves < r.head.bedroom, r.head);
    check(`the resident's bed is upstairs across the back (${r.bed && r.bed.y} m), the home's chest beside it with clear floor before it (${r.box && r.box.ok})`, r.bed && Math.abs(r.bed.y - r.F1) < .01 && r.box && r.box.y === r.bed.y && r.box.ok, { bed: r.bed, box: r.box });
    check(`the resident in the hall at ${r.npc && [r.npc.x, r.npc.z].join(', ')}, clear`, !r.npc || r.npc.clear, r.npc);
    check(`lit (${r.lights} lights) in ${r.draws} draws (50 or fewer), ${r.tris.toLocaleString()} triangles`, r.lights >= 6 && r.lights <= 14 && r.draws <= 50 && r.tris < 120000, r);
    await page.evaluate(() => { const h = currentHouse; VM_SCENE.visible = false; px = intDoorX(h); pz = h._roomD - 2.75; jumpY = 0; yaw = 0; pitch = .12; });
    await g.frames(6);
    await page.screenshot({ path: path.join(here, '../docs/prototypes/courtyard-court-ingame.png') }); console.log('  (picture: docs/prototypes/courtyard-court-ingame.png)');
    await page.evaluate(() => { const h = currentHouse, T = h._courtHouse, F1 = T.floors[1] - T.floors[0]; px = T.sh.A + 2.9; pz = T.sh.A + 2.9; jumpY = F1; yaw = Math.PI / 4; pitch = -.2; });
    await g.frames(6);
    await page.screenshot({ path: path.join(here, '../docs/prototypes/courtyard-gallery-ingame.png') }); console.log('  (picture: docs/prototypes/courtyard-gallery-ingame.png)');
    await page.evaluate(() => { const h = currentHouse; px = intDoorX(h); pz = h._roomD - .4; jumpY = 0; yaw = Math.PI; pitch = 0; interact(); });
    for (let k = 0; k < 40 && (await page.evaluate(() => isInterior())); k++) await page.waitForTimeout(250);
    check('at the door E takes you out', !(await page.evaluate(() => isInterior())));
  }
}
check('no errors', g.errs.length === 0, g.errs.slice(0, 5));
await g.close();
