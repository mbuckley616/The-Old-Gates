// Aurenne's flat over the dyer's shop in the game (Session 1831; card F9, Michael's A on #318; OG-115; rooms.js's aurenneHome of Session 891,
// laid to the street's lots in Session 1802). On the new look a two-storey flat-roofed Aurennais street home of 6.4 by 6.0 m or more opens on
// its own rooms: the street's own shell at its true size (its wall's colour the street's), the dyer's shop below, the stair of 16 risers to
// the flat, the steep stair through the hatch to the roof terrace. You arrive clear; the prototype's three walks, the stair up to the flat
// and the roof stair up onto the terrace, on foot with the game's ground and solids; the shop's head room is the floor above, the flat's the
// roof, the terrace's the sky; the resident's bed and the home's chest are upstairs; lit and within its draws; you leave by the door. Pictures.
import { boot, check } from './lib/game.mjs';
import fs from 'fs'; import path from 'path'; import { fileURLToPath } from 'url';
const here = path.dirname(fileURLToPath(import.meta.url));
const towns = () => { anchoredPlaces(); return [...CELLS.values()].filter(c => c.type !== 'sea' && nationKeyOf(c.i, c.j) === 'aurenne').flatMap(c => c.sites).filter(s => ['town', 'port', 'city'].includes(s.kind)).slice(0, 3).map(s => s.id); };

const g = await boot({ look: 'new' }); const { page } = g; await g.intoWorld();
let home = null, roman = null; const tally = [];
for (const id of await page.evaluate(towns)) {
  if (!(await g.settle(id))) { check(`${id} stands`, false); continue; }
  const r = await page.evaluate(id => { const S = WORLD.settle.get(id), H = S.houses.filter(h => h.siteId === id && h.type === 'home' && h.kit && h.kit.kind === 'aurhouse'),
      flat2 = H.filter(h => h.kit.o.kind === 'flat' && h.kit.o.two), ok = flat2.filter(h => h.kit.o.w >= 6.4 && h.kit.o.d >= 6.0);
    /* the street's wall colour, as the street's house draws it: the shell's stream's first draw, as aurenneHouse takes it */
    const pick = ok.sort((a, b) => b.kit.o.w - a.kit.o.w)[0], tile2 = H.filter(h => h.kit.o.kind === 'tile' && h.kit.o.two), tok = tile2.filter(h => h.kit.o.w >= 6.4 && h.kit.o.d >= 6.0).sort((a, b) => b.kit.o.w - a.kit.o.w);
    return { tile2: tile2.length, tok: tok.length, tsz: tile2.map(h => h.kit.o.w + 'x' + h.kit.o.d), roman: tok[0] && { id: tok[0].id, w: tok[0].kit.o.w, d: tok[0].kit.o.d, arcade: !!tok[0].kit.o.arcade }, kit: H.length, flat2: flat2.length, ok: ok.length, pick: pick && { id: pick.id, w: pick.kit.o.w, d: pick.kit.o.d, wall: 'wall:' + Math.floor(PKIT.stream(pick.kit.shell)() * PKIT.au.AUR.walls.length) } }; }, id);
  tally.push(`${id}: ${r.ok} of ${r.flat2} two-storey flat homes of ${r.kit}, ${r.tok} of ${r.tile2} two-storey Roman (${r.tsz.join(' ')})`); if (!home && r.pick) home = { site: id, ...r.pick }; if (!roman && r.roman) roman = { site: id, ...r.roman };
}
console.log('  ' + tally.join('; '));
check(`a two-storey flat-roofed home of 6.4 by 6.0 m or more stands in the first three towns of Aurenne (${home && home.id}, ${home && home.w} by ${home && home.d} m)`, !!home, tally);
if (home) {
  await g.settle(home.site);
  await page.evaluate(([site, id]) => { const h = WORLD.settle.get(site).houses.find(h => h.id === id); forceTime(12); px = h.exitX; pz = h.exitZ; goToInterior(h); }, [home.site, home.id]);
  for (let k = 0; k < 40 && !(await page.evaluate(() => isInterior())); k++) await page.waitForTimeout(250);
  await g.frames(2);
  const r = await page.evaluate(street => {
    const h = currentHouse, T = h._aurHome; if (!T) return { none: true, type: h && h.type, kit: h && h.kit && h.kit.kind };
    const W = h._roomW, D = h._roomD, X = T.inner.x1, Z = T.inner.z1, F0 = T.floors[0], FL = T.floors.map(y => y - F0); interiorScene.updateMatrixWorld(true);
    const meshes = []; let lights = 0, draws = 0, tris = 0; const inNPC = o => { for (let p = o; p; p = p.parent) if (p === intNPCMesh) return true; return false; };
    interiorScene.traverse(o => { if (o.isLight && !o.isAmbientLight && !o.isHemisphereLight && o.intensity > 0) lights++; if (o.isMesh && o.visible && !(intNPCMesh && inNPC(o))) { draws++; tris += (o.geometry.index ? o.geometry.index.count : o.geometry.attributes.position.count) / 3; meshes.push(o); } });
    const wm = T.shell.children.find(m => /^wall:/.test(m.name)), wall = wm ? wm.name : null;
    const rc = new THREE.Raycaster(), O = new THREE.Vector3(), Dv = new THREE.Vector3();
    const hit = (x, y, z, dx, dy, dz, far = 40) => { O.set(x, y, z); Dv.set(dx, dy, dz).normalize(); rc.set(O, Dv); rc.far = far; return rc.intersectObjects(meshes, false)[0] || null; };
    const out = hit(intDoorX(h), 1.6, D - 1.0, 0, 0, 1, 30), door = !!(out && out.object.userData.daylight);
    /* the windows upstairs on the street: straight out through each, past its lattice if it has one, the day */
    const wins = T.windows.filter(q => q.face === 'front' && q.y > T.floors[1] - .3).map(q => { const o = hit(q.x + q.w / 6 + X, q.y - F0 + q.h * .4, D - .3, 0, 0, 1, 30) /* between the grille's bars */; return o && (o.object.userData.daylight || o.distance > .3 + .32 + .15) ? true : (o ? o.object.name + '@' + o.distance.toFixed(2) : 'none'); }); /* the day, or the street's own creeper on the wall outside */
    const az = intArrivalZ(h), arrive = { x: +px.toFixed(2), z: +az.toFixed(2), clear: !intSolidAt(px, az, .3, 0), exits: az > D - h._exitD };
    const walk = (pts, y0) => { let y = y0, blocked = [], maxStep = 0, [x, z] = pts[0]; for (let i = 1; i < pts.length; i++) { const [x1, z1] = pts[i], n = Math.ceil(Math.hypot(x1 - x, z1 - z) / .05);
        for (let k = 1; k <= n; k++) { const xx = x + (x1 - x) * k / n, zz = z + (z1 - z) * k / n, ny = footholdY(xx, zz, y, 0); maxStep = Math.max(maxStep, Math.abs(ny - y)); y = ny; if (intSolidAt(xx, zz, .15, y)) blocked.push([+xx.toFixed(2), +zz.toFixed(2), +y.toFixed(2)]); } x = x1; z = z1; }
      return { blocked: blocked.length, at: blocked.slice(0, 3), maxStep: +maxStep.toFixed(3), y: +y.toFixed(3), y0 }; };
    const L = ([x, z]) => [x + X, z + Z], walks = T.paths.map((P, i) => walk(P.map(L), FL[[0, 1, 1][i]])); /* the third, from the landing to the roof stair's foot, is on the flat's floor */
    /* up the stair: from the way in's last point along the treads (x rising) to the landing, then off it onto the flat's floor */
    const S = T.stair, sz = (S.z0 + S.z1) / 2, up = walk([[S.x0 - .35, sz], [S.x1 + .4, sz], [S.x1 + .4, S.z1 + .5]].map(L), 0);
    /* the roof stair: from its foot by the landing, along its treads (x falling) to its head under the hatch, and off onto the terrace */
    const R = T.roofStair, rz = (R.z0 + R.z1) / 2, roof = walk([[R.x1 + .25, rz], [R.x0 + .05, rz], [R.x0 - .45, rz], [R.x0 - .45, R.z1 + .8]].map(L), FL[1]); /* its treads are footholds only (a stepladder's going), so nothing on it is solid */
    const head = { shop: +headCeil(X + U0(T), Z + .3, 0).toFixed(2), flat: +(headCeil(X - 1, Z, FL[1]) - FL[1]).toFixed(2), terrace: +(headCeil(X, Z, FL[2]) - FL[2]).toFixed(2) };
    function U0(T) { return T.door.x < 0 ? 1 : -1; }
    const bed = INT_BEDS.find(b => b.owner === 'home'), B = INT_BOX;
    const P = intNPCMesh ? { x: +intNPCPos.x.toFixed(2), z: +intNPCPos.z.toFixed(2), clear: !intSolidAt(intNPCPos.x, intNPCPos.z, .2, 0) } : null;
    return { W: +W.toFixed(2), D: +D.toFixed(2), w: T.w, d: T.d, scaledBy: T.group.scale.x, wall, street, door, wins, arrive, walks, up, roof, head, FL: FL.map(v => +v.toFixed(3)), bed: bed && { y: bed.y }, box: B && { y: B.y }, npc: P, lights, draws, tris: Math.round(tris) };
  }, home.wall);
  check(`its door opens on the flat over the dyer's shop, ${r.W} by ${r.D} m inside a house of ${r.w} by ${r.d}, at its true size (scale ${r.scaledBy}), in the street's own walls (${r.wall}, the street's ${r.street})`, !r.none && r.w === home.w && r.d === home.d && r.scaledBy === 1 && r.wall === r.street, r);
  if (!r.none) {
    check(`through the street door the day, and through the ${r.wins.length} street windows upstairs the street (nothing inside in the way) (${r.wins.filter(v => v === true).length})`, r.door && r.wins.length > 0 && r.wins.every(v => v === true), { door: r.door, wins: r.wins });
    check(`you arrive clear in the shop at ${r.arrive.x}, ${r.arrive.z} m`, r.arrive.clear && !r.arrive.exits, r.arrive);
    check(`the prototype's ${r.walks.length} walks (the shop, the flat, to the roof stair) on foot, nothing in the way, each on its own floor`, r.walks.length === 3 && r.walks.every(w => w.blocked === 0 && w.maxStep <= .4 && Math.abs(w.y - w.y0) < .01), r.walks);
    check(`up the stair's 16 risers onto the flat's floor, ${r.up.y} m up, in steps of ${r.up.maxStep} m`, r.up.blocked === 0 && Math.abs(r.up.y - r.FL[1]) < .01 && r.up.maxStep <= .4, r.up);
    check(`up the roof stair through the hatch onto the terrace, ${r.roof.y} m up, in steps of ${r.roof.maxStep} m`, r.roof.blocked === 0 && Math.abs(r.roof.y - r.FL[2]) < .01 && r.roof.maxStep <= .4, r.roof);
    check(`head room: the shop's is the floor above (${r.head.shop} m), the flat's the roof (${r.head.flat} m), the terrace's the sky (${r.head.terrace} m)`, r.head.shop < r.FL[1] && r.head.shop > 2.5 && r.head.flat > 2.2 && r.head.flat < 3 && r.head.terrace > 3, r.head);
    check(`the resident's bed and the home's chest are in the flat upstairs (${r.bed && r.bed.y}, ${r.box && r.box.y} m)`, r.bed && Math.abs(r.bed.y - r.FL[1]) < .01 && r.box && r.box.y === r.bed.y, { bed: r.bed, box: r.box });
    check(`the dyer behind the counter at ${r.npc && [r.npc.x, r.npc.z].join(', ')}, clear`, !r.npc || r.npc.clear, r.npc);
    check(`lit (${r.lights} lights) in ${r.draws} draws (40 or fewer), ${r.tris.toLocaleString()} triangles`, r.lights >= 4 && r.lights <= 10 && r.draws <= 40 && r.tris < 80000, r);
    fs.mkdirSync(path.join(here, '../docs/prototypes'), { recursive: true });
    const shot = async (name, set) => { await page.evaluate(set); await g.frames(6); await page.screenshot({ path: path.join(here, '../docs/prototypes/' + name) }); console.log('  (picture: docs/prototypes/' + name + ')'); };
    await shot('aurhome-shop-ingame.png', () => { const h = currentHouse; VM_SCENE.visible = false; px = intDoorX(h); pz = h._roomD - .7; jumpY = 0; yaw = 0; pitch = -.05; });
    await shot('aurhome-flat-ingame.png', () => { const h = currentHouse, T = h._aurHome, X = T.inner.x1, Z = T.inner.z1; px = X + T.well.x1 - .4; pz = Z + T.well.z1 + .6; jumpY = T.floors[1] - T.floors[0]; yaw = Math.PI / 2 + .5; pitch = -.12; });
    await shot('aurhome-terrace-ingame.png', () => { const h = currentHouse, T = h._aurHome, X = T.inner.x1, Z = T.inner.z1; px = X - X + .8; pz = Z + Z - .6; jumpY = T.floors[2] - T.floors[0]; yaw = -Math.PI / 4; pitch = -.25; });
    await page.evaluate(() => { const h = currentHouse; px = intDoorX(h); pz = h._roomD - .4; jumpY = 0; yaw = Math.PI; pitch = 0; interact(); });
    for (let k = 0; k < 40 && (await page.evaluate(() => isInterior())); k++) await page.waitForTimeout(250);
    check('at the door E takes you out', !(await page.evaluate(() => isInterior())));
  }
}
// the two-storey Roman (tiled) home (Session 1974): the same shop and flat round its door in the middle, the flat under cedar boards, no roof stair
check(`a two-storey Roman home of 6.4 by 6.0 m or more stands in the first three towns of Aurenne (${roman && roman.id}, ${roman && roman.w} by ${roman && roman.d} m${roman && roman.arcade ? ', arcaded' : ''})`, !!roman, tally);
if (roman) {
  await g.settle(roman.site);
  await page.evaluate(([site, id]) => { const h = WORLD.settle.get(site).houses.find(h => h.id === id); forceTime(12); px = h.exitX; pz = h.exitZ; goToInterior(h); }, [roman.site, roman.id]);
  for (let k = 0; k < 40 && !(await page.evaluate(() => isInterior())); k++) await page.waitForTimeout(250);
  await g.frames(2);
  const r = await page.evaluate(() => {
    const h = currentHouse, T = h._aurHome; if (!T) return { none: true, type: h && h.type, kit: h && h.kit && h.kit.kind };
    const D = h._roomD, X = T.inner.x1, Z = T.inner.z1, F0 = T.floors[0], FL = T.floors.map(y => y - F0); interiorScene.updateMatrixWorld(true);
    let lights = 0, draws = 0, tris = 0; const inNPC = o => { for (let p = o; p; p = p.parent) if (p === intNPCMesh) return true; return false; };
    interiorScene.traverse(o => { if (o.isLight && !o.isAmbientLight && !o.isHemisphereLight && o.intensity > 0) lights++; if (o.isMesh && o.visible && !(intNPCMesh && inNPC(o))) { draws++; tris += (o.geometry.index ? o.geometry.index.count : o.geometry.attributes.position.count) / 3; } });
    const az = intArrivalZ(h), arrive = { x: +px.toFixed(2), z: +az.toFixed(2), clear: !intSolidAt(px, az, .3, 0), exits: az > D - h._exitD };
    const walk = (pts, y0) => { let y = y0, blocked = 0, maxStep = 0, [x, z] = pts[0]; for (let i = 1; i < pts.length; i++) { const [x1, z1] = pts[i], n = Math.ceil(Math.hypot(x1 - x, z1 - z) / .05);
        for (let k = 1; k <= n; k++) { const xx = x + (x1 - x) * k / n, zz = z + (z1 - z) * k / n, ny = footholdY(xx, zz, y, 0); maxStep = Math.max(maxStep, Math.abs(ny - y)); y = ny; if (intSolidAt(xx, zz, .15, y)) blocked++; } x = x1; z = z1; }
      return { blocked, maxStep: +maxStep.toFixed(3), y: +y.toFixed(3), y0 }; };
    const L = ([x, z]) => [x + X, z + Z], walks = T.paths.map((P, i) => walk(P.map(L), FL[i ? 1 : 0]));
    const S = T.stair, sz = (S.z0 + S.z1) / 2, up = walk([[S.x0 - .35, sz], [S.x1 + .4, sz], [S.x1 + .4, S.z1 + .5]].map(L), 0);
    /* a jump in the flat's middle meets the boards, and nothing stands over them */
    const head = { shop: +headCeil(X - 1, Z + .3, 0).toFixed(2), flat: +(headCeil(X, Z, FL[1]) - FL[1]).toFixed(2) }, over = FOOTHOLDS.some(f => f.y > FL[1] + 1);
    const bed = INT_BEDS.find(b => b.owner === 'home'), B = INT_BOX;
    const P = intNPCMesh ? { x: +intNPCPos.x.toFixed(2), z: +intNPCPos.z.toFixed(2), clear: !intSolidAt(intNPCPos.x, intNPCPos.z, .2, 0) } : null;
    return { tile: !!T.tile, roof: T.roof, stair: !!T.roofStair, doorX: +T.door.x.toFixed(2), exitX: +(h._exitX - X).toFixed(2), scaledBy: T.group.scale.x, arrive, walks, up, head, over, roomH: h._roomH, FL: FL.map(v => +v.toFixed(3)), bed: bed && bed.y, box: B && B.y, npc: P, lights, draws, tris: Math.round(tris) };
  });
  check(`its door opens on the Roman flat over the dyer's shop at its true size (scale ${r.scaledBy}), its door in the middle of the front (${r.doorX}), no roof stair`, !r.none && r.tile && r.roof === false && !r.stair && r.doorX === 0 && r.exitX === 0 && r.scaledBy === 1, r);
  if (!r.none) {
    check(`you arrive clear; the ${r.walks.length} walks (the shop, the flat) on foot, nothing in the way, each on its own floor`, r.arrive.clear && !r.arrive.exits && r.walks.length === 2 && r.walks.every(w => w.blocked === 0 && w.maxStep <= .4 && Math.abs(w.y - w.y0) < .01), { arrive: r.arrive, walks: r.walks });
    check(`up the stair onto the flat's floor, ${r.up.y} m up, in steps of ${r.up.maxStep} m`, r.up.blocked === 0 && Math.abs(r.up.y - r.FL[1]) < .01 && r.up.maxStep <= .4, r.up);
    check(`head room: the shop's is the floor above (${r.head.shop} m), the flat's the cedar boards (${r.head.flat} m; the room ${r.roomH} m high), nothing over them`, r.head.shop > 2.5 && r.head.shop < r.FL[1] && r.head.flat > 2.2 && r.head.flat < 2.7 && r.roomH < r.FL[1] + 2.8 && !r.over, r);
    check(`the resident's bed and the home's chest in the flat upstairs (${r.bed}, ${r.box} m); the dyer behind the counter, clear`, Math.abs(r.bed - r.FL[1]) < .01 && r.box === r.bed && (!r.npc || r.npc.clear), r);
    check(`lit (${r.lights} lights) in ${r.draws} draws (40 or fewer), ${r.tris.toLocaleString()} triangles`, r.lights >= 4 && r.lights <= 10 && r.draws <= 40 && r.tris < 80000, r);
    const shot = async (name, set) => { await page.evaluate(set); await g.frames(6); await page.screenshot({ path: path.join(here, '../docs/prototypes/' + name) }); console.log('  (picture: docs/prototypes/' + name + ')'); };
    await shot('aurhome-roman-shop-ingame.png', () => { const h = currentHouse; VM_SCENE.visible = false; px = intDoorX(h); pz = h._roomD - .7; jumpY = 0; yaw = 0; pitch = -.05; });
    await shot('aurhome-roman-flat-ingame.png', () => { const h = currentHouse, T = h._aurHome, X = T.inner.x1, Z = T.inner.z1; px = X + T.well.x1 - .4; pz = Z + T.well.z1 + .6; jumpY = T.floors[1] - T.floors[0]; yaw = Math.PI / 2 + .5; pitch = -.05; });
    await page.evaluate(() => { const h = currentHouse; px = intDoorX(h); pz = h._roomD - .4; jumpY = 0; yaw = Math.PI; pitch = 0; interact(); });
    for (let k = 0; k < 40 && (await page.evaluate(() => isInterior())); k++) await page.waitForTimeout(250);
    check('at the Roman home\'s door E takes you out', !(await page.evaluate(() => isInterior())));
  }
}
check('no errors', g.errs.length === 0, g.errs.slice(0, 5));
await g.close();
