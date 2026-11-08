// academy (Session 1959, card F6; Michael's A on #296, "round, galleries, pointed white caps, as drawn"): on the new look Aurenne's
// capital (the first Aurennais city in grid order, guestChapelHouse's) keeps a plot beside a street through the heart for the Mages'
// academy, pieces.js's of Session 836 (PKIT.au.academy), its arcade to the street. The suite builds the kit alone at its three sizes,
// then stands at the capital and reads its plot, its solids, its plinth, its neighbours and its far copy; since Session 1963 it goes in at
// the arcade and reads the library. --shots writes the pictures.
import fs from 'node:fs';
import { boot, check } from './lib/game.mjs';
const g = await boot({ look: 'new' }); const { page } = g; await g.intoWorld();
const SHOTS = process.argv.includes('--shots');
await page.evaluate(s => REN.setSize(s ? 1280 : 320, s ? 720 : 180, false), SHOTS);
const kit = await page.evaluate(() => [[30, 3], [26, 3], [24, 2]].map(([w, t]) => { const A = PKIT.au.academy({ w, towers: t }, PKIT.stream('test')), B = PKIT.au.academyBox({ w, towers: t }), b = new THREE.Box3().setFromObject(A.group);
  return { w, t, tris: A.tris, draws: A.draws, tops: A.towerTops, inBox: b.min.x >= B.x0 - .01 && b.max.x <= B.x1 + .01 && b.min.z >= B.z0 - .01 && b.max.z <= B.z1 + .01, foot: +b.min.y.toFixed(3) }; }));
console.log(JSON.stringify(kit));
check(`the kit's academy at 30, 26 and 24 m (${kit.map(k => `${k.tris} triangles in ${k.draws} draws`).join(', ')}), every tower over the hall, the observatory's the tallest`,
  kit.every(k => k.tris < 20000 && k.draws <= 8 && k.tops.length === k.t && Math.min(...k.tops) > 25 && Math.max(...k.tops) > 38 && k.inBox && k.foot === 0), kit);
const cap = await page.evaluate(() => { const c = guestChapelHouse(); return c && { id: c.id, name: c.name }; });
check(`Aurenne's capital is ${cap && cap.name} (${cap && cap.id})`, !!cap, cap);
check('it stands on the new look', await g.settle(cap.id));
const a = await page.evaluate(id => { const S = WORLD.settle.get(id), A = S.academy; if (!A) return { none: true };
  const c = Math.cos(A.ry), s = Math.sin(A.ry), at = (u, v) => [A.x + u * c + v * s, A.z - u * s + v * c];
  const hall = [[0, 0], [-A.W / 2 + .5, -A.D / 2 + .5], [A.W / 2 - .5, A.D / 2 - .5]].map(p => solidAt(...at(...p)));
  const towers = A.sols.filter(q => q.rx < 3).length;
  const apron = [-A.W / 3, 0, A.W / 3].map(u => { const p = at(u, A.D / 2 + 1.8); return { solid: solidAt(...p), y: +activeTerrainH(...p).toFixed(2) }; });
  const off = at(0, A.D / 2 + 6), ground = +activeTerrainH(...off).toFixed(2);
  const hs = ZONES.world.houses.filter(h => h.siteId === id), near = hs.filter(h => h.id !== A.house).filter(h => { const dx = h.doorX - A.x, dz = h.doorZ - A.z, lu = dx * c - dz * s, lv = dx * s + dz * c; return Math.abs(lu) < A.W / 2 + 1 && lv > -A.D / 2 - 4 && lv < A.D / 2 + 3.4; }).map(h => h.name);
  const others = S.sol.filter(q => q.bt !== 'academy' && q.rx && Math.hypot(q.cx - A.cx, q.cz - A.cz) < A.r + Math.hypot(q.rx, q.rz) && (() => { const dx = q.cx - A.x, dz = q.cz - A.z, lu = dx * c - dz * s, lv = dx * s + dz * c; return Math.abs(lu) < A.W / 2 + .2 + q.rx && lv > -A.D / 2 - 3.5 - q.rz && lv < A.D / 2 + 3.4 + q.rz; })()).length;
  const K = S.kitLod, P = CAM.position.clone(), fx = Math.sin(A.ry), fz = Math.cos(A.ry);
  CAM.position.set(A.x + fx * 400, 30, A.z + fz * 400); houseLod(); const far = [K.hi.visible, K.lo.visible];
  CAM.position.set(A.x + fx * 20, 3, A.z + fz * 20); houseLod(); const near2 = [K.hi.visible, K.lo.visible]; CAM.position.copy(P);
  return { W: A.W, towers: A.towers, tops: A.tops, tris: A.tris, y: +A.y.toFixed(2), plat: +A.plat.y.toFixed(2), hall, towerSols: towers, apron, ground, near, others, far, near2, reach: +K.r.toFixed(1), dist: +(Math.hypot(A.cx - S.site.x, A.cz - S.site.z) + A.r).toFixed(1) }; }, cap.id);
console.log(JSON.stringify(a));
check(`${cap.name}'s academy (${a.W} m, ${a.towers} towers to ${a.tops && Math.max(...a.tops)} m, ${a.tris} triangles) is built, solid through its hall`, !a.none && a.hall.every(Boolean), a);
check(`each of its ${a.towers} towers is a solid`, !a.none && a.towerSols === a.towers + 2, a);
check(`its plinth's apron is open to walk on at the plinth's top (${(a.apron || []).map(p => p.y).join(', ')} m; the ground before it ${a.ground})`, !a.none && a.apron.every(p => !p.solid && Math.abs(p.y - a.plat) < .02), a);
check(`no house's door but its own and no other solid stands on its plot (${(a.near || []).join(', ') || 'none'})`, !a.none && a.near.length === 0 && a.others === 0, a);
check(`the town's far copy carries it from 400 m (the kit's reach ${a.reach} m covers its ${a.dist}), the town itself from 20`, !a.none && a.far[0] === false && a.far[1] === true && a.near2[0] === true && a.near2[1] === false && a.reach >= a.dist - .01, a);
// S1963 (card F9; rooms.js's aurenneLibrary of Session 948, OG-043) — the library behind the arcade: a house of its own (type 'academy'),
// its door on the apron at the arch at x 10, nobody keeps it and it is never locked; inside at its true size, you arrive clear, the
// prototype's four walks on foot, the lattice screen keeps you to its doorways, lit within the room budget, and E at the arch takes you out.
const lib = await page.evaluate(id => { const S = WORLD.settle.get(id), A = S.academy, h = A && ZONES.world.houses.find(q => q.id === A.house); if (!h) return { none: true };
  const c = Math.cos(A.ry), s = Math.sin(A.ry), dx = h.doorX - A.x, dz = h.doorZ - A.z, lu = dx * c - dz * s, lv = dx * s + dz * c;
  return { id: h.id, type: h.type, name: h.name, lu: +lu.toFixed(2), lv: +lv.toFixed(2), onApron: Math.abs(activeTerrainH(h.doorX, h.doorZ) - A.plat.y) < .02, exitClear: !solidAt(h.exitX, h.exitZ),
    keeper: npcInsideNow(h), locked: shopClosedNow(h), noonLocked: (forceTime(12), shopClosedNow(h)) }; }, cap.id);
console.log(JSON.stringify(lib));
check(`the library is a house of its own (${lib.id}), its door on the plinth's apron at the arch ${lib.lu} m along, its exit clear`, !lib.none && lib.type === 'academy' && Math.abs(lib.lu - 10) < .05 && lib.onApron && lib.exitClear, lib);
check('nobody keeps it and it is never locked', !lib.none && !lib.keeper && !lib.locked && !lib.noonLocked, lib);
if (!lib.none) {
  await page.evaluate(id => { const h = ZONES.world.houses.find(q => q.id === id); window._H = h; forceTime(12); px = h.exitX; pz = h.exitZ; goToInterior(h); }, lib.id);
  for (let k = 0; k < 60 && !(await page.evaluate(() => isInterior() && currentHouse === _H)); k++) await page.waitForTimeout(250);
  await g.frames(3);
  const r = await page.evaluate(() => {
    const h = currentHouse, T = h._library; if (!T) return { none: true, type: h && h.type };
    const W = h.intW, D = h.intD; interiorScene.updateMatrixWorld(true);
    const meshes = []; let lights = 0, draws = 0, tris = 0;
    interiorScene.traverse(o => { if (o.isLight && !o.isAmbientLight && !o.isHemisphereLight && o.intensity > 0) lights++; if (o.isMesh && o.visible) { draws++; tris += (o.geometry.index ? o.geometry.index.count : o.geometry.attributes.position.count) / 3; meshes.push(o); } });
    const rc = new THREE.Raycaster(), O = new THREE.Vector3(), Dv = new THREE.Vector3();
    const hit = (x, y, z, dx, dy, dz, far = 20) => { O.set(x, y, z); Dv.set(dx, dy, dz).normalize(); rc.set(O, Dv); rc.far = far; return rc.intersectObjects(meshes, false)[0] || null; };
    const out = hit(h._exitX, 1.4, D - 1, 0, 0, 1, 6), door = out ? !!out.object.userData.daylight : false;
    const up = hit(W / 2 + 4, 1.8, D / 2, 0, 1, 0, 14), upY = up ? +up.point.y.toFixed(2) : null;
    const az = intArrivalZ(h), arrive = { x: +px.toFixed(2), z: +az.toFixed(2), clear: !intSolidAt(px, az, .3, 0), exits: az > D - h._exitD };
    const walk = pts => { let y = 0, blocked = [], maxStep = 0, [x, z] = pts[0]; for (let i = 1; i < pts.length; i++) { const [x1, z1] = pts[i], n = Math.ceil(Math.hypot(x1 - x, z1 - z) / .05);
        for (let k = 1; k <= n; k++) { const xx = x + (x1 - x) * k / n, zz = z + (z1 - z) * k / n, ny = footholdY(xx, zz, y, 0); maxStep = Math.max(maxStep, Math.abs(ny - y)); y = ny; if (intSolidAt(xx, zz, .2, y)) blocked.push([+xx.toFixed(2), +zz.toFixed(2), +y.toFixed(2)]); } x = x1; z = z1; }
      return { blocked: blocked.length, at: blocked.slice(0, 3), maxStep: +maxStep.toFixed(3) }; };
    const walks = h._libraryPaths.map(walk);
    /* the gallery (Session 1995): overhead, so the floor under it is open; its ladders stand on the floor as solids */
    const G = T.gallery, gal = G ? { under: [-1, 1].map(sx => !intSolidAt(T.inner.x1 + sx * 7.6, T.inner.z1 - 5.0, .3, 0)), ladders: G.ladders.map(L => intSolidAt(L.x + T.inner.x1, (L.z0 + L.z1) / 2 + T.inner.z1, .2, 0)), deckY: +(G.y - T.floor).toFixed(2) } : null;
    /* the screen: from the loggia straight through the lattice between two doorways (x 5 m off the middle, either side), at a walker's height */
    const sz = T.screen.z + D / 2, screen = [-5, 5].map(u => intSolidAt(W / 2 + u, sz, .2, 0) && intSolidAt(W / 2 + u, sz, .2, 1.2));
    return { W: +W.toFixed(2), D: +D.toFixed(2), H: h._roomH, door, upY, arrive, walks, screen, gal, lights, draws, tris: Math.round(tris), npc: !!intNPCMesh };
  });
  console.log(JSON.stringify(r));
  check(`the room is the academy's library, ${r.W} by ${r.D} m and ${r.H} m to the ceiling, at its true size`, !r.none && Math.abs(r.W - 28.8) < .05 && Math.abs(r.D - 11.8) < .05 && Math.abs(r.H - 10.5) < .05, r);
  if (!r.none) {
    check(`through the arch you came in by, the day; straight up, the painted ceiling at ${r.upY} m`, r.door && r.upY != null && r.upY > 9.5 && r.upY <= 10.5, { door: r.door, upY: r.upY });
    check(`you arrive clear in the loggia at ${r.arrive.x}, ${r.arrive.z} m`, r.arrive.clear && !r.arrive.exits, r.arrive);
    check(`the prototype's four walks (in at the arch, through the screen's three doorways, to the tables, the ladder and the armillary) on foot, nothing in the way`, r.walks.length === 4 && r.walks.every(w => w.blocked === 0 && w.maxStep <= .1), r.walks);
    check('the lattice screen between its doorways is a wall: you go round by a doorway', r.screen.every(Boolean), r.screen);
    check(`the gallery's boards ${r.gal && r.gal.deckY} m up along the back wall: the floor under it open, its two ladders solid`, r.gal && r.gal.deckY >= 3.5 && r.gal.under.every(Boolean) && r.gal.ladders.length === 2 && r.gal.ladders.every(Boolean), r.gal);
    check(`nobody in it; lit (${r.lights} lights, 12 or fewer); ${r.draws} meshes (60 or fewer) and ${r.tris.toLocaleString()} triangles (60,000 or fewer)`, !r.npc && r.lights >= 4 && r.lights <= 12 && r.draws <= 60 && r.tris <= 60000, r);
    if (SHOTS) {
      for (const [name, set] of [['academy-library-hall.jpg', 'px=h._exitX-1.2;pz=h.intD-4.6;yaw=.55;pitch=.12;'], ['academy-library-loggia.jpg', 'px=h._exitX+.4;pz=h.intD-1.0;yaw=-Math.PI/2+.12;pitch=.04;']]) {
        await page.evaluate(s => { const h = currentHouse; VM_SCENE.visible = false; jumpY = 0; new Function('h', s)(h); }, set);
        await g.frames(6); await page.screenshot({ path: 'docs/prototypes/' + name }); console.log('  (picture: docs/prototypes/' + name + ')'); }
      await page.evaluate(() => { VM_SCENE.visible = true; });
    }
    await page.evaluate(() => { const h = currentHouse; px = h._exitX; pz = h.intD - .4; jumpY = 0; yaw = Math.PI; pitch = 0; interact(); });
    for (let k = 0; k < 40 && (await page.evaluate(() => isInterior())); k++) await page.waitForTimeout(250);
    check('at the arch E takes you out, onto the apron', !(await page.evaluate(() => isInterior())));
  }
}
check('no page errors', g.errs.length === 0, g.errs);
if (SHOTS) {
  const shot = async (name, set) => { await page.evaluate(set); await g.frames(4); await page.screenshot({ path: 'docs/prototypes/' + name }); console.log('  (picture: docs/prototypes/' + name + ')'); };
  await page.evaluate(() => { forceTime(10); VM_SCENE.visible = false; });
  await shot('academy-ingame-street.jpg', `{const A=WORLD.settle.get('${cap.id}').academy,fx=Math.sin(A.ry),fz=Math.cos(A.ry),rx=Math.cos(A.ry),rz=-Math.sin(A.ry);px=A.x+fx*20+rx*9;pz=A.z+fz*20+rz*9;yaw=A.ry+.38;pitch=.32;}`);
  await shot('academy-ingame-arcade.jpg', `{const A=WORLD.settle.get('${cap.id}').academy,fx=Math.sin(A.ry),fz=Math.cos(A.ry),rx=Math.cos(A.ry),rz=-Math.sin(A.ry);px=A.x+fx*(A.D/2+2.4)+rx*(A.W/2-3);pz=A.z+fz*(A.D/2+2.4)+rz*(A.W/2-3);yaw=A.ry+Math.PI/2+.25;pitch=.08;}`);
}
await g.close();
