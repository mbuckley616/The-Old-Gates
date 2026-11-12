// A Gatelands smithy inside, on the new look (Session 1860; card F9, Michael's A on #303 and on the kit in every interior; rooms.js's
// gatelandsForge of Session 929; OG-043). On ?look=new a smith's shop standing as the kit's forge (lot.kit.kind 'forge', S1855) opens on
// the forge's own room at its true size: PKIT.gl.forge, the hearth under its hood against the west gable, the bellows, the anvil, the
// tub and the bin, the rack, the bench, the grindstone and the farrier's box, open to the couples. Dunmore's smithy: walled below the
// sills but the cart door; you arrive clear; the prototype's three walks on foot; the smith at the anvil, in reach; the forge works
// (smithForge); the strongbox clear and reached; lit, within the draws; out by the door. A picture from inside the cart door.
import { boot, check } from './lib/game.mjs';
import fs from 'fs'; import path from 'path'; import { fileURLToPath } from 'url';
const here = path.dirname(fileURLToPath(import.meta.url));

const g = await boot({ look: 'new' }); const { page } = g; await g.intoWorld(); await g.settle('dunmore');
const id = await page.evaluate(() => { const h = WORLD.settle.get('dunmore').houses.find(h => h.type === 'weapon' && h.kit && h.kit.kind === 'forge'); return h ? h.id : null; });
check(`Dunmore's smithy stands as the kit's forge (${id})`, !!id, id);
if (id) {
  await page.evaluate(id => { const h = WORLD.settle.get('dunmore').houses.find(h => h.id === id); window._H = h; forceTime(12); px = h.exitX; pz = h.exitZ; goToInterior(h); }, id);
  for (let k = 0; k < 60 && !(await page.evaluate(() => isInterior() && currentHouse === _H)); k++) await page.waitForTimeout(250);
  await g.frames(3);
  const r = await page.evaluate(() => {
    const h = currentHouse, T = h._forge; if (!T) return { none: true, type: h && h.type };
    const W = h.intW, D = h.intD, X = T.inner.x1, Z = T.inner.z1; interiorScene.updateMatrixWorld(true);
    const meshes = []; let lights = 0, draws = 0, tris = 0, people = 0; const inRig = o => { for (let p = o; p; p = p.parent) if (p === intNPCMesh) return true; return false; };
    interiorScene.traverse(o => { if (o.isLight && !o.isAmbientLight && o.intensity > 0) lights++; if (o.isMesh && o.visible) { if (intNPCMesh && inRig(o)) people++; else { draws++; tris += (o.geometry.index ? o.geometry.index.count : o.geometry.attributes.position.count) / 3; meshes.push(o); } } });
    const rc = new THREE.Raycaster(), O = new THREE.Vector3(), Dv = new THREE.Vector3();
    const hit = (x, y, z, dx, dy, dz, far = 20) => { O.set(x, y, z); Dv.set(dx, dy, dz).normalize(); rc.set(O, Dv); rc.far = far; return rc.intersectObjects(meshes, false)[0] || null; };
    /* walled all round below the sills (0.5 m up; the lowest sill is 1.0): from 0.6 m inside each wall, every 0.8 m along it, the wall within 1.5 m (the cart door aside) */
    const open = []; for (let x = .4; x < W - .3; x += .8) { if (Math.abs(x - h._exitX) > 1.4 && !hit(x, .5, D - .6, 0, 0, 1, 1.5)) open.push(['front', +x.toFixed(1)]); if (!hit(x, .5, .6, 0, 0, -1, 1.5)) open.push(['back', +x.toFixed(1)]); }
    for (let z = .4; z < D - .3; z += .8) { if (!hit(W - .6, .5, z, 1, 0, 0, 1.5)) open.push(['east', +z.toFixed(1)]); if (!hit(.6, .5, z, -1, 0, 0, 1.5)) open.push(['west', +z.toFixed(1)]); }
    const out = hit(h._exitX, 1.6, D - 1, 0, 0, 1, 3), door = out ? !!out.object.userData.daylight : false;
    /* open to the couples: straight up from the shoeing bay a ray meets a tie beam or the slate over 3 m */
    const up = hit(h._exitX, 1.8, Z - .2, 0, 1, 0, 10), upY = up ? +up.point.y.toFixed(2) : null;
    const az = intArrivalZ(h), arrive = { x: +px.toFixed(2), z: +az.toFixed(2), clear: !intSolidAt(px, az, .3, 0), exits: az > D - h._exitD };
    const walk = pts => { let y = 0, blocked = [], maxStep = 0, [x, z] = pts[0]; for (let i = 1; i < pts.length; i++) { const [x1, z1] = pts[i], n = Math.ceil(Math.hypot(x1 - x, z1 - z) / .05);
        for (let k = 1; k <= n; k++) { const xx = x + (x1 - x) * k / n, zz = z + (z1 - z) * k / n, ny = footholdY(xx, zz, y, 0); maxStep = Math.max(maxStep, Math.abs(ny - y)); y = ny; if (intSolidAt(xx, zz, .2, y)) blocked.push([+xx.toFixed(2), +zz.toFixed(2), +y.toFixed(2)]); } x = x1; z = z1; }
      return { blocked: blocked.length, at: blocked.slice(0, 3), maxStep: +maxStep.toFixed(3) }; };
    const walks = T.paths.map(P => walk(P.map(([x, z]) => [x + X, z + Z])));
    /* the smith at the anvil: clear, and in reach to talk from the shoeing bay's side of it (the first walk's end) */
    const P = intNPCMesh ? { x: +intNPCPos.x.toFixed(2), z: +intNPCPos.z.toFixed(2) } : null; let talk = null;
    if (P) { const ox = px, oz = pz, [ex, ez] = T.paths[0][T.paths[0].length - 1]; px = ex + X + .5; pz = ez + Z; jumpY = 0; talk = { reach: keeperInReach(), d: +Math.hypot(px - P.x, pz - P.z).toFixed(2), clear: !intSolidAt(P.x, P.z, .2, 0), byAnvil: Math.hypot(P.x - (T.anvil.x + X), P.z - (T.anvil.z + Z)) < 1 }; px = ox; pz = oz; }
    const box = INT_BOX ? { x: +INT_BOX.x.toFixed(2), z: +INT_BOX.z.toFixed(2), kind: INT_BOX.kind, front: !intSolidAt(INT_BOX.x, INT_BOX.z + .7, .25, 0), alone: INT_SOL.filter(q => INT_BOX.x + .3 > q.x0 && INT_BOX.x - .3 < q.x1 && INT_BOX.z + .26 > q.z0 && INT_BOX.z - .26 < q.z1 && q.y0 < .5).length === 1 } : null;
    return { W: +W.toFixed(2), D: +D.toFixed(2), H: h._roomH, scaledBy: T.group.scale.x, open, door, upY, arrive, walks, P, talk, box, forge: smithForge(), lights, draws, people, tris: Math.round(tris) };
  });
  console.log(JSON.stringify({ ...r, walks: r.walks && r.walks.map(w => w.blocked) }));
  check(`the room is the kit's forge inside, ${r.W} by ${r.D} m and ${r.H} m to the tie beams, at its true size (scale ${r.scaledBy})`, !r.none && Math.abs(r.W - 7.2) < .05 && Math.abs(r.D - 4.8) < .05 && r.H > 2.8 && r.scaledBy === 1, r);
  if (!r.none) {
    check(`walled all round below the sills, the cart door aside (${r.open.length} openings); through the door, the day`, r.open.length === 0 && r.door, { open: r.open.slice(0, 8), door: r.door });
    check(`open to the couples over the shoeing bay: straight up, a beam or the slate at ${r.upY} m`, r.upY != null && r.upY > 2.9, r.upY);
    check(`you arrive clear inside the cart door at ${r.arrive.x}, ${r.arrive.z} m`, r.arrive.clear && !r.arrive.exits, r.arrive);
    check(`the prototype's three walks (to the anvil, to the bench, to the grindstone) on foot, nothing in the way`, r.walks.length === 3 && r.walks.every(w => w.blocked === 0 && w.maxStep <= .1), r.walks);
    check(`the smith stands clear at the anvil, in reach to talk from the shoeing bay (${r.talk && r.talk.d} m)`, !!r.talk && r.talk.reach && r.talk.clear && r.talk.byAnvil, { P: r.P, talk: r.talk });
    check(`the forge works here (smithForge)`, r.forge === true, r.forge);
    check(`the shop's strongbox stands on its own under the rack, with clear floor before it`, !!r.box && r.box.kind === 'shop' && r.box.front && r.box.alone, r.box);
    check(`lit (${r.lights} lights); ${r.draws} meshes (40 or fewer) and ${r.tris.toLocaleString()} triangles (30,000 or fewer) besides the smith's ${r.people}`, r.lights >= 3 && r.draws <= 40 && r.tris <= 30000 && r.people >= 1, r);
    const pic = path.join(here, '../docs/prototypes/kit-forge-room.png');
    await page.evaluate(() => { const h = currentHouse; VM_SCENE.visible = false; px = h._exitX + .2; pz = h.intD - .5; jumpY = 0; yaw = 1.2; pitch = -.08; });
    await g.frames(6); await page.screenshot({ path: pic }); console.log(`  (picture: ${path.relative(path.join(here, '..'), pic)})`);
    await page.evaluate(() => { const h = currentHouse; VM_SCENE.visible = true; px = h._exitX; pz = h.intD - .4; jumpY = 0; yaw = Math.PI; pitch = 0; interact(); });
    for (let k = 0; k < 40 && (await page.evaluate(() => isInterior())); k++) await page.waitForTimeout(250);
    check(`at the cart door E takes you out`, !(await page.evaluate(() => isInterior())));
  }
}
// Session 2136 (Michael's B on #1420): the smith's tanner's rack and drying rack stand in his yard, each its island's (S2131's kit), clear of
// the town's other solids and 2.5 m from every door; what hangs on one is worldState.racks' for its key, and at it E opens the smith's page
const rk = await page.evaluate(() => { const S = WORLD.settle.get('dunmore'), h = S.houses.find(q => q.type === 'weapon'); if (!h || !S.racks) return null;
  const R = S.racks.filter(r => r.house === h.id), hitOther = r => S.sol.some(s => { if (s.bt === 'rack' && Math.abs(s.cx - r.x) < .01 && Math.abs(s.cz - r.z) < .01) return false;
    const dx = r.x - s.cx, dz = r.z - s.cz, lx = s.c !== undefined ? dx * s.c - dz * s.s : dx, lz = s.c !== undefined ? dx * s.s + dz * s.c : dz; return Math.abs(lx) < s.rx && Math.abs(lz) < s.rz; });
  const doors = Math.min(...R.flatMap(r => S.houses.map(q => Math.hypot(r.x - q.doorX, r.z - q.doorZ))));
  const T = R.find(r => r.kind === 'tan'); worldState.racks = worldState.racks || {}; worldState.racks[T.key] = [{ k: 'hide', at: gameMinNow() - 999 }, { k: 'hide', at: gameMinNow() }]; T.t = 0;
  townRacksLive(S, { x: T.x, z: T.z }); px = T.x + T.s * (T.rz + .7); pz = T.z + T.c * (T.rz + .7); const pr = townRackPrompt(), hold = curesHere().map(c => c.kind).join();
  delete worldState.racks[T.key]; return { kinds: R.map(r => r.kind + ':' + r.g.userData.rack.island).join(), clear: R.every(r => !hitOther(r)), doors: +doors.toFixed(1), slots: T.g.userData.rack.slots.join(), pr, hold }; });
console.log('racks', JSON.stringify(rk));
check(`the smith's two racks stand in his yard, the Gatelands' (${rk && rk.kinds}), clear of the town's solids and ${rk && rk.doors} m from the nearest door`, !!rk && rk.kinds === 'tan:gatelands,dry:gatelands' && rk.clear && rk.doors >= 2.5, rk);
check('a hide hung there is drawn on it, leather when it is ready; at it E opens the smith\'s two racks', !!rk && rk.slots === 'leather,salted,,' && /tanner/.test(rk.pr || '') && rk.hold === 'rack,dry', rk);
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
