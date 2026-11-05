// A Gatelands village's apothecary inside, on the new look (Session 1876; card F9, Michael's A on #303 and on the kit in every interior;
// rooms.js's gatelandsApothecary of Session 936; OG-043, OG-133). On ?look=new a village's potion shop standing as the drawn cottage
// (lot.kit.kind 'apothecary') opens on the apothecary's own room at its true size: PKIT.gl.apothecary, the hearth and the counter, the
// four steps behind it, the store through the hearth wall. Droichead's apothecary: walled below the sills but the doors; you arrive
// clear; the prototype's walks on foot; the apothecary behind the counter, in reach; the strongbox behind the store's door; lit, within
// the draws; out by the door. A picture from inside the door.
import { boot, check } from './lib/game.mjs';
import fs from 'fs'; import path from 'path'; import { fileURLToPath } from 'url';
const here = path.dirname(fileURLToPath(import.meta.url));

const g = await boot({ look: 'new' }); const { page } = g; await g.intoWorld(); await g.settle('droichead');
const id = await page.evaluate(() => { const h = WORLD.settle.get('droichead').houses.find(h => h.type === 'potion' && h.kit && h.kit.kind === 'apothecary'); return h ? h.id : null; });
check(`Droichead's apothecary stands as the drawn cottage (${id})`, !!id, id);
if (id) {
  await page.evaluate(id => { const h = WORLD.settle.get('droichead').houses.find(h => h.id === id); window._H = h; forceTime(12); px = h.exitX; pz = h.exitZ; goToInterior(h); }, id);
  for (let k = 0; k < 60 && !(await page.evaluate(() => isInterior() && currentHouse === _H)); k++) await page.waitForTimeout(250);
  await g.frames(3);
  const r = await page.evaluate(() => {
    const h = currentHouse, T = h._apothecary; if (!T) return { none: true, type: h && h.type };
    const W = h.intW, D = h.intD, X = T.inner.x1, Z = T.inner.z1; interiorScene.updateMatrixWorld(true);
    const meshes = []; let lights = 0, draws = 0, tris = 0, people = 0; const inRig = o => { for (let p = o; p; p = p.parent) if (p === intNPCMesh) return true; return false; };
    interiorScene.traverse(o => { if (o.isLight && !o.isAmbientLight && o.intensity > 0) lights++; if (o.isMesh && o.visible) { if (intNPCMesh && inRig(o)) people++; else { draws++; tris += (o.geometry.index ? o.geometry.index.count : o.geometry.attributes.position.count) / 3; meshes.push(o); } } });
    const rc = new THREE.Raycaster(), O = new THREE.Vector3(), Dv = new THREE.Vector3();
    const hit = (x, y, z, dx, dy, dz, far = 20) => { O.set(x, y, z); Dv.set(dx, dy, dz).normalize(); rc.set(O, Dv); rc.far = far; return rc.intersectObjects(meshes, false)[0] || null; };
    /* walled all round below the sills (0.5 m up; the lowest sill is 0.95): from 0.6 m inside each wall, every 0.8 m along it, the wall within 1.5 m (the front and back doors aside) */
    const open = []; for (let x = .4; x < W - .3; x += .8) { if (Math.abs(x - h._exitX) > .7 && !hit(x, .5, D - .6, 0, 0, 1, 1.5)) open.push(['front', +x.toFixed(1)]); if (Math.abs(x - (T.back.x + X)) > .7 && !hit(x, .5, .6, 0, 0, -1, 1.5)) open.push(['back', +x.toFixed(1)]); }
    for (let z = .4; z < D - .3; z += .8) { if (!hit(W - .6, .5, z, 1, 0, 0, 1.5)) open.push(['east', +z.toFixed(1)]); if (!hit(.6, .5, z, -1, 0, 0, 1.5)) open.push(['west', +z.toFixed(1)]); }
    const out = hit(h._exitX, 1.6, D - 1, 0, 0, 1, 3), door = out ? !!out.object.userData.daylight : false;
    /* open to the thatch: straight up from the customers' side a ray meets a collar or the thatch over 3 m */
    const up = hit(h._exitX + .6, 1.8, Z + .5, 0, 1, 0, 10), upY = up ? +up.point.y.toFixed(2) : null;
    const az = intArrivalZ(h), arrive = { x: +px.toFixed(2), z: +az.toFixed(2), clear: !intSolidAt(px, az, .3, 0), exits: az > D - h._exitD };
    const walk = (pts, rad = .15) => { let y = 0, blocked = [], maxStep = 0, [x, z] = pts[0]; for (let i = 1; i < pts.length; i++) { const [x1, z1] = pts[i], n = Math.ceil(Math.hypot(x1 - x, z1 - z) / .05);
        for (let k = 1; k <= n; k++) { const xx = x + (x1 - x) * k / n, zz = z + (z1 - z) * k / n, ny = footholdY(xx, zz, y, 0); maxStep = Math.max(maxStep, Math.abs(ny - y)); y = ny; if (intSolidAt(xx, zz, rad, y)) blocked.push([+xx.toFixed(2), +zz.toFixed(2), +y.toFixed(2)]); } x = x1; z = z1; }
      return { blocked: blocked.length, at: blocked.slice(0, 3), maxStep: +maxStep.toFixed(3) }; };
    const walks = T.paths.map(P => walk(P.map(([x, z]) => [x + X, z + Z])));
    /* the apothecary behind the counter: clear, and in reach to talk from the customers' side (the first walk's end) */
    const P = intNPCMesh ? { x: +intNPCPos.x.toFixed(2), z: +intNPCPos.z.toFixed(2) } : null; let talk = null;
    if (P) { const ox = px, oz = pz, [ex, ez] = T.paths[0][T.paths[0].length - 1]; px = ex + X; pz = ez + Z; jumpY = 0; talk = { reach: keeperInReach(), d: +Math.hypot(px - P.x, pz - P.z).toFixed(2), clear: !intSolidAt(P.x, P.z, .2, 0), behind: P.x > T.counter.x1 + X && P.z > T.counter.z0 + Z && P.z < T.counter.z1 + Z }; px = ox; pz = oz; }
    const box = INT_BOX ? { x: +INT_BOX.x.toFixed(2), z: +INT_BOX.z.toFixed(2), kind: INT_BOX.kind, front: !intSolidAt(INT_BOX.x + .7, INT_BOX.z, .25, 0), store: INT_BOX.x < T.doors[0].x + X, alone: INT_SOL.filter(q => INT_BOX.x + .3 > q.x0 && INT_BOX.x - .3 < q.x1 && INT_BOX.z + .26 > q.z0 && INT_BOX.z - .26 < q.z1 && q.y0 < .5).length === 1 } : null;
    return { W: +W.toFixed(2), D: +D.toFixed(2), H: h._roomH, scaledBy: T.group.scale.x, open, door, upY, arrive, walks, P, talk, box, doorShut: INT_DOORS.length, lights, draws, people, tris: Math.round(tris) };
  });
  console.log(JSON.stringify({ ...r, walks: r.walks && r.walks.map(w => w.blocked) }));
  check(`the room is the apothecary inside, ${r.W} by ${r.D} m and ${r.H} m to the collars, at its true size (scale ${r.scaledBy})`, !r.none && Math.abs(r.W - 8.4) < .05 && Math.abs(r.D - 4.2) < .05 && r.H > 3.5 && r.scaledBy === 1, r);
  if (!r.none) {
    check(`walled all round below the sills, the doors aside (${r.open.length} openings); through the front door, the day`, r.open.length === 0 && r.door, { open: r.open.slice(0, 8), door: r.door });
    check(`open to the thatch over the customers' side: straight up, a collar or the thatch at ${r.upY} m`, r.upY != null && r.upY > 2.9, r.upY);
    check(`you arrive clear inside the door at ${r.arrive.x}, ${r.arrive.z} m`, r.arrive.clear && !r.arrive.exits, r.arrive);
    check(`the prototype's ${r.walks.length} walks (door to counter, back door to counter, behind the counter to the still and the bench, to the hearth wall's door, in the store) on foot, nothing in the way`, r.walks.length === 6 && r.walks.every(w => w.blocked === 0 && w.maxStep <= .1), r.walks);
    check(`the apothecary stands clear behind the counter, in reach to talk from the customers' side (${r.talk && r.talk.d} m)`, !!r.talk && r.talk.reach && r.talk.clear && r.talk.behind, { P: r.P, talk: r.talk });
    check(`the shop's strongbox stands on its own in the store, behind the hearth wall's door (${r.doorShut} door hung), with clear floor before it`, !!r.box && r.box.kind === 'shop' && r.box.front && r.box.alone && r.box.store && r.doorShut >= 1, r.box);
    check(`lit (${r.lights} lights); ${r.draws} meshes (40 or fewer) and ${r.tris.toLocaleString()} triangles (30,000 or fewer) besides the apothecary's ${r.people}`, r.lights >= 3 && r.draws <= 40 && r.tris <= 30000 && r.people >= 1, r);
    const pic = path.join(here, '../docs/prototypes/kit-apothecary-room.png');
    await page.evaluate(() => { const h = currentHouse; VM_SCENE.visible = false; px = h._arriveX - .3; pz = h._arriveZ + .3; jumpY = 0; yaw = -1.15; pitch = -.12; });
    await g.frames(6); await page.screenshot({ path: pic }); console.log(`  (picture: ${path.relative(path.join(here, '..'), pic)})`);
    await page.evaluate(() => { const h = currentHouse; VM_SCENE.visible = true; px = h._exitX; pz = h.intD - .4; jumpY = 0; yaw = Math.PI; pitch = 0; });
    await g.frames(2); await page.evaluate(() => interact()); /* the camera drawn facing the door first: the picture's aim was on the keeper */
    for (let k = 0; k < 40 && (await page.evaluate(() => isInterior())); k++) await page.waitForTimeout(250);
    check(`at the door E takes you out`, !(await page.evaluate(() => isInterior())));
  }
}
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
