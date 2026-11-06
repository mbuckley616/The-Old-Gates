// The room over a town's market house, on the new look (Session 1905; card F9, Michael's A on #475 and on the kit in every interior;
// rooms.js's gatelandsMarketRoom of Session 1188; OG-114, OG-070). Session 1904 stood the market house on the square of every Gatelands
// town, port and city (tests/townplots); its room upstairs is a house of its own (type 'market', g_<site>_6000), its door at the foot of
// the stair up the east end. It opens on PKIT.gl.marketRoom at its true size inside the town's own shell, turned a quarter so the stair
// door is the room's front: the town's room (the long table under two rings of candles, the hearth, the press) and, through the
// partition, the clerk of the market's room (the desk, the measures, the strongbox). Dunmore's: walled below the sills but the stair
// door; you arrive clear; the prototype's four walks on foot; nobody keeps it and it is never locked; lit, within the draws; out by the
// door. A picture from inside the door down the table.
import { boot, check } from './lib/game.mjs';
import path from 'path'; import { fileURLToPath } from 'url';
const here = path.dirname(fileURLToPath(import.meta.url));

const g = await boot({ look: 'new' }); const { page } = g; await g.intoWorld(); await g.settle('dunmore');
const info = await page.evaluate(() => { const S = WORLD.settle.get('dunmore'), h = S.houses.find(h => h.type === 'market'), M = S.market;
  return h ? { id: h.id, name: h.name, keeper: h.keeper, nobody: !npcInsideNow(h), open: !shopClosedNow(h), door: Math.hypot(h.doorX - M.foot.x, h.doorZ - M.foot.z), exitClear: !WORLD.solidAt(h.exitX, h.exitZ) } : null; });
check(`Dunmore's market house has its room upstairs, a house of its own (${info && info.id}), its door at the stair's foot`, !!info && info.id === 'g_dunmore_6000' && info.door < .5 && info.exitClear, info);
check('nobody keeps it, and it is never locked', !!info && info.nobody && info.open, info);
if (info) {
  await page.evaluate(id => { const h = WORLD.settle.get('dunmore').houses.find(h => h.id === id); window._H = h; forceTime(12); px = h.exitX; pz = h.exitZ; goToInterior(h); }, info.id);
  for (let k = 0; k < 60 && !(await page.evaluate(() => isInterior() && currentHouse === _H)); k++) await page.waitForTimeout(250);
  await g.frames(3);
  const r = await page.evaluate(() => {
    const h = currentHouse, T = h._marketRoom; if (!T) return { none: true, type: h && h.type };
    const W = h.intW, D = h.intD; interiorScene.updateMatrixWorld(true);
    const meshes = []; let lights = 0, draws = 0, tris = 0;
    interiorScene.traverse(o => { if (o.isLight && !o.isAmbientLight && o.intensity > 0) lights++; if (o.isMesh && o.visible) { draws++; tris += (o.geometry.index ? o.geometry.index.count : o.geometry.attributes.position.count) / 3; meshes.push(o); } });
    const rc = new THREE.Raycaster(), O = new THREE.Vector3(), Dv = new THREE.Vector3();
    const hit = (x, y, z, dx, dy, dz, far = 20) => { O.set(x, y, z); Dv.set(dx, dy, dz).normalize(); rc.set(O, Dv); rc.far = far; return rc.intersectObjects(meshes, false)[0] || null; };
    /* walled all round below the sills (0.5 m up; the sills are 0.55 over the floor): from 0.6 m inside each wall, every 0.8 m along it, the wall within 1.5 m (the stair door aside) */
    const open = []; for (let x = .4; x < W - .3; x += .8) { if (Math.abs(x - h._exitX) > .9 && !hit(x, .5, D - .6, 0, 0, 1, 1.5)) open.push(['door end', +x.toFixed(1)]); if (!hit(x, .5, .6, 0, 0, -1, 1.5)) open.push(['west end', +x.toFixed(1)]); }
    for (let z = .4; z < D - .3; z += .8) { if (!hit(W - .6, .5, z, 1, 0, 0, 1.5)) open.push(['back', +z.toFixed(1)]); if (!hit(.6, .5, z, -1, 0, 0, 1.5)) open.push(['front', +z.toFixed(1)]); }
    const out = hit(h._exitX, 1.4, D - 1, 0, 0, 1, 3), door = out ? !!out.object.userData.daylight : false;
    const up = hit(W / 2, 1.8, D / 2, 0, 1, 0, 10), upY = up ? +up.point.y.toFixed(2) : null;
    const az = intArrivalZ(h), arrive = { x: +px.toFixed(2), z: +az.toFixed(2), clear: !intSolidAt(px, az, .3, 0), exits: az > D - h._exitD };
    const walk = pts => { let y = 0, blocked = [], maxStep = 0, [x, z] = pts[0]; for (let i = 1; i < pts.length; i++) { const [x1, z1] = pts[i], n = Math.ceil(Math.hypot(x1 - x, z1 - z) / .05);
        for (let k = 1; k <= n; k++) { const xx = x + (x1 - x) * k / n, zz = z + (z1 - z) * k / n, ny = footholdY(xx, zz, y, 0); maxStep = Math.max(maxStep, Math.abs(ny - y)); y = ny; if (intSolidAt(xx, zz, .2, y)) blocked.push([+xx.toFixed(2), +zz.toFixed(2), +y.toFixed(2)]); } x = x1; z = z1; }
      return { blocked: blocked.length, at: blocked.slice(0, 3), maxStep: +maxStep.toFixed(3) }; };
    const walks = h._marketPaths.map(walk);
    return { W: +W.toFixed(2), D: +D.toFixed(2), H: h._roomH, open, door, upY, arrive, walks, lights, draws, tris: Math.round(tris), npc: !!intNPCMesh };
  });
  console.log(JSON.stringify(r));
  check(`the room is the market house's upstairs, ${r.W} by ${r.D} m and ${r.H} m to the ceiling, at its true size`, !r.none && Math.abs(r.W - 7.4) < .05 && Math.abs(r.D - 13.8) < .05 && Math.abs(r.H - 2.85) < .05, r);
  if (!r.none) {
    check(`walled all round below the sills, the stair door aside (${r.open.length} openings); through the door, the day`, r.open.length === 0 && r.door, { open: r.open.slice(0, 8), door: r.door });
    check(`ceiled: straight up from the middle, the plaster at ${r.upY} m`, r.upY != null && Math.abs(r.upY - 2.85) < .1, r.upY);
    check(`you arrive clear inside the stair door at ${r.arrive.x}, ${r.arrive.z} m`, r.arrive.clear && !r.arrive.exits, r.arrive);
    check(`the prototype's four walks (to the hearth, through the partition to the clerk's desk, to the measures, across the hall) on foot, nothing in the way`, r.walks.length === 4 && r.walks.every(w => w.blocked === 0 && w.maxStep <= .1), r.walks);
    check(`nobody in it`, !r.npc);
    check(`lit (${r.lights} lights, 12 or fewer); ${r.draws} meshes (40 or fewer) and ${r.tris.toLocaleString()} triangles (30,000 or fewer)`, r.lights >= 4 && r.lights <= 12 && r.draws <= 40 && r.tris <= 30000, r);
    const pic = path.join(here, '../docs/prototypes/kit-market-room.png');
    await page.evaluate(() => { const h = currentHouse; VM_SCENE.visible = false; px = h._exitX - .3; pz = h.intD - .6; jumpY = 0; yaw = -.35; pitch = -.06; });
    await g.frames(6); await page.screenshot({ path: pic }); console.log(`  (picture: ${path.relative(path.join(here, '..'), pic)})`);
    await page.evaluate(() => { const h = currentHouse; VM_SCENE.visible = true; px = h._exitX; pz = h.intD - .4; jumpY = 0; yaw = Math.PI; pitch = 0; interact(); });
    for (let k = 0; k < 40 && (await page.evaluate(() => isInterior())); k++) await page.waitForTimeout(250);
    check(`at the stair door E takes you out, onto the square`, !(await page.evaluate(() => isInterior())));
  }
}
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
