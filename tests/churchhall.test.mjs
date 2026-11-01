// The Church of the Weaver inside, on the new look (Session 1326; card F9, OG-043, OG-061; rooms.js's aurenneChurchHall of Session 947).
// On ?look=new an Aurennais town's church (the kit's town church, S1305) is entered into its own room: PKIT.au.churchHall inside the
// street's own shell, at its true size. Inside: walled all round below the windows, the door aside; you arrive clear in the aisle; the
// prototype's walks (to the bier, round it either side to the sanctuary's step, along the benches) are walked on foot with the game's
// ground and solids; the priest stands before the sanctuary, in reach from the floor beside him; the oculus opens into the drum; the
// room is lit and within its draws; you leave by the door. Pictures down the nave and up into the dome.
// S1690: and a village's chapel (the kit's 12 m church, S1485, lot.kit.kind 'aurchapel') opens on the same room at its own size, 10.4 m
// square inside and three rows of benches; every check above walked again in it, and a picture down its nave.
import { boot, check } from './lib/game.mjs';
import fs from 'fs'; import path from 'path'; import { fileURLToPath } from 'url';
const here = path.dirname(fileURLToPath(import.meta.url));
const towns = () => { anchoredPlaces(); return [...CELLS.values()].filter(c => c.type !== 'sea' && nationKeyOf(c.i, c.j) === 'aurenne').flatMap(c => c.sites).filter(s => s.kind === 'town' || s.kind === 'port').slice(0, 4).map(s => s.id); };
const pickOf = kind => `const S = WORLD.settle.get(id), h = S && S.houses.find(h => h.siteId === id && h.type === 'church' && h.kit && h.kit.kind === '${kind}');`;
const pick = pickOf('aurchurch');

const g = await boot({ look: 'new' }); const { page } = g; await g.intoWorld();
let sid = null, name = null;
for (const id of await page.evaluate(towns)) { if (!(await g.settle(id))) continue; name = await page.evaluate(new Function('id', `${pick} return h ? h.name : null;`), id); if (name) { sid = id; break; } }
check(`an Aurennais town's church is the Church of the Weaver (${sid}: ${name})`, !!sid);
if (!sid) { await g.close(); process.exit(); }

async function walkRoom(sid, pick, W0, tag) {
await page.evaluate(new Function('id', `${pick} forceTime(12); px = h.exitX; pz = h.exitZ; goToInterior(h);`), sid);
for (let k = 0; k < 40 && !(await page.evaluate(() => isInterior())); k++) await page.waitForTimeout(250);
await g.frames(2);
const r = await page.evaluate(() => {
  const h = currentHouse, T = h._churchHall; if (!T) return { none: true, type: h && h.type };
  const W = h._roomW, D = h._roomD, X = T.inner.x1, Z = T.inner.z1, F0 = T.floor; interiorScene.updateMatrixWorld(true);
  const meshes = []; let lights = 0, draws = 0, tris = 0, kDraws = 0; const inPriest = o => { for (let p = o; p; p = p.parent) if (p === intNPCMesh) return true; return false; };
  interiorScene.traverse(o => { if (o.isLight && !o.isAmbientLight && o.intensity > 0) lights++; if (o.isMesh && o.visible) { if (intNPCMesh && inPriest(o)) kDraws++; else { draws++; tris += (o.geometry.index ? o.geometry.index.count : o.geometry.attributes.position.count) / 3; meshes.push(o); } } });
  const rc = new THREE.Raycaster(), O = new THREE.Vector3(), Dv = new THREE.Vector3();
  const hit = (x, y, z, dx, dy, dz, far = 20) => { O.set(x, y, z); Dv.set(dx, dy, dz).normalize(); rc.set(O, Dv); rc.far = far; const q = rc.intersectObjects(meshes, false)[0]; return q ? q : null; };
  /* walled all round below the windows (3.2 m up): from 0.6 m inside each wall, every metre along it at 0.6 and 2.2 m, a wall within 1 m (the door aside) */
  const open = []; for (const y of [.6, 2.2]) { for (let x = .5; x < W - .4; x += 1) { if (Math.abs(x - intDoorX(h)) > 1.5 && !hit(x, y, D - .6, 0, 0, 1, 1)) open.push(['front', +x.toFixed(1), y]); if (!hit(x, y + .32, .6, 0, 0, -1, 1)) open.push(['back', +x.toFixed(1), y]); }
    for (let z = .5; z < D - .4; z += 1) { if (!hit(W - .6, y, z, 1, 0, 0, 1)) open.push(['right', +z.toFixed(1), y]); if (!hit(.6, y, z, -1, 0, 0, 1)) open.push(['left', +z.toFixed(1), y]); } }
  /* the door: straight out from the aisle the daylight beyond it, past the open leaves */
  const out = hit(intDoorX(h), 1.6, D - 1, 0, 0, 1, 3), door = out ? !!out.object.userData.daylight : false;
  /* up through the oculus from under it: past the ceiling (10.1 m) into the drum and the painted dome */
  const up = hit(X + .3, 2, Z + .3, 0, 1, 0, 40), upY = up ? +(up.point.y).toFixed(2) : null;
  const az = intArrivalZ(h), arrive = { x: +px.toFixed(2), z: +az.toFixed(2), clear: !intSolidAt(px, az, .3, 0), exits: az > D - h._exitD };
  const walk = pts => { let y = 0, blocked = [], maxStep = 0, [x, z] = pts[0]; for (let i = 1; i < pts.length; i++) { const [x1, z1] = pts[i], n = Math.ceil(Math.hypot(x1 - x, z1 - z) / .05);
      for (let k = 1; k <= n; k++) { const xx = x + (x1 - x) * k / n, zz = z + (z1 - z) * k / n, ny = footholdY(xx, zz, y, 0); maxStep = Math.max(maxStep, ny - y); y = ny; if (intSolidAt(xx, zz, .25, y)) blocked.push([+xx.toFixed(2), +zz.toFixed(2), +y.toFixed(2)]); } x = x1; z = z1; }
    return { blocked: blocked.length, at: blocked.slice(0, 3), maxStep: +maxStep.toFixed(3), y: +y.toFixed(3) }; };
  const walks = T.paths.map(P => walk(P.map(([x, z]) => [x + X, z + Z])));
  /* the sanctuary: up its step and onto it beside the altar, 0.32 m over the nave */
  const sanct = walk([[X - 2.0, Z + Math.max(-2.05, T.sanctuary.z1 + .65)], [X - 2.0, Z + T.sanctuary.z1 + .2], [X - 2.0, Z - 4.2]]);
  const P = intNPCMesh ? { x: +intNPCPos.x.toFixed(2), z: +intNPCPos.z.toFixed(2) } : null, beside = P && [-1, 1].map(s => ({ x: P.x + s * 1.3, z: P.z })).filter(q => !intSolidAt(q.x, q.z, .3, 0)).length;
  const before = P && { step: +(P.z - (T.sanctuary.z1 + .34 + Z)).toFixed(2), bier: +((T.bier.z0 + Z - .45) - P.z).toFixed(2), clear: !intSolidAt(P.x, P.z, .25, 0) };
  return { rows: T.benches.length / 2, W: +W.toFixed(2), D: +D.toFixed(2), H: h._roomH, open, door, upY, ceil: +(T.ceil - F0).toFixed(2), arrive, walks, sanct, priest: P, beside, before, lights, draws, kDraws, tris: Math.round(tris), scaledBy: T.group.scale.x, sols: INT_SOL.length };
});
check(`${tag}: the room is the Church of the Weaver inside, ${r.W} by ${r.D} m and ${r.H} m to the ceiling, at its true size (scale ${r.scaledBy})`, !r.none && Math.abs(r.W - W0) < .05 && Math.abs(r.D - W0) < .05 && r.H > W0 * .75 && r.scaledBy === 1, r);
if (r.none) return r;
check(`${tag}: walled all round below the windows: no opening at 0.6 or 2.2 m but the great door (${r.open.length}); through the door, the day`, r.open.length === 0 && r.door, { open: r.open.slice(0, 8), door: r.door });
check(`${tag}: the oculus opens over the bier: straight up from the floor a ray meets the dome at ${r.upY} m, over the ${r.ceil} m ceiling`, r.upY != null && r.upY > r.ceil + 2, r.upY);
check(`${tag}: you arrive clear in the aisle at ${r.arrive.x}, ${r.arrive.z} m`, r.arrive.clear && !r.arrive.exits, r.arrive);
check(`${tag}: the prototype's ${r.walks.length} walks (to the bier, round it either side to the sanctuary, along the benches) on foot, nothing in the way`, r.walks.length >= 4 && r.walks.every(w => w.blocked === 0 && w.maxStep <= .4), r.walks);
check(`${tag}: up the sanctuary's step beside the altar, ${r.sanct.y} m over the nave in steps of ${r.sanct.maxStep} m`, r.sanct.blocked === 0 && Math.abs(r.sanct.y - .32) < .02 && r.sanct.maxStep <= .4, r.sanct);
check(`${tag}: the priest stands before the sanctuary at ${r.priest && [r.priest.x, r.priest.z].join(', ')}, ${r.before && r.before.step} m off its step and ${r.before && r.before.bier} m short of the bier's candles; clear ground beside him (${r.beside} sides)`, !!r.priest && r.before.clear && r.before.step > .3 && r.before.bier > .3 && r.beside === 2, { priest: r.priest, before: r.before });
check(`${tag}: the room is lit (${r.lights} lights) and draws ${r.draws} meshes (40 or fewer), ${r.tris.toLocaleString()} triangles; the priest ${r.kDraws}`, r.lights >= 3 && r.draws <= 40 && r.kDraws >= 1, r);

  return r;
}
await walkRoom(sid, pick, 12.4, 'the town');

fs.mkdirSync(path.join(here, '../docs/prototypes'), { recursive: true });
await page.evaluate(() => { const h = currentHouse; VM_SCENE.visible = false; px = intDoorX(h); pz = h._roomD - 1.0; jumpY = 0; yaw = 0; pitch = .05; });
await g.frames(6);
await page.screenshot({ path: path.join(here, '../docs/prototypes/churchhall-nave-ingame.png') }); console.log('  (picture: docs/prototypes/churchhall-nave-ingame.png)');
await page.evaluate(() => { const h = currentHouse; px = intDoorX(h) - 3.2; pz = h._roomD / 2 + 2.2; yaw = -.97; pitch = .9; });
await g.frames(6);
await page.screenshot({ path: path.join(here, '../docs/prototypes/churchhall-dome-ingame.png') }); console.log('  (picture: docs/prototypes/churchhall-dome-ingame.png)');

await page.evaluate(() => { const h = currentHouse; px = intDoorX(h); pz = h._roomD - .4; jumpY = 0; yaw = Math.PI; pitch = 0; interact(); });
for (let k = 0; k < 40 && (await page.evaluate(() => isInterior())); k++) await page.waitForTimeout(250);
check('at the door E takes you out', !(await page.evaluate(() => isInterior())));

// S1690 — a village's chapel: the Aurennais village nearest the first town whose church stands on its plot as the kit's 12 m church
const vid = await page.evaluate(() => { const A = allSites(), nat = t => nationKeyOf(...cellOf(t.x, t.z)), c = A.find(t => nat(t) === 'aurenne' && t.kind === 'town') || A.find(t => nat(t) === 'aurenne');
  const V = A.filter(t => nat(t) === 'aurenne' && t.kind === 'village' && t.pad > 0).sort((a, b) => Math.hypot(a.x - c.x, a.z - c.z) - Math.hypot(b.x - c.x, b.z - c.z));
  for (const t of V.slice(0, 25)) { if (!WORLD.settle.get(t.id)) genSettlement(t); if (WORLD.settle.get(t.id).houses.some(h => h.siteId === t.id && h.type === 'church' && h.kit && h.kit.kind === 'aurchapel')) return t.id; } return null; });
check(`an Aurennais village's church is the village's Church of the Weaver (${vid})`, !!vid);
if (vid) { await g.settle(vid); const pv = pickOf('aurchapel'), rv = await walkRoom(vid, pv, 10.4, 'the village');
  if (!rv.none) { await page.evaluate(() => { const h = currentHouse; px = intDoorX(h); pz = h._roomD - 1.0; jumpY = 0; yaw = 0; pitch = .05; });
    await g.frames(6); await page.screenshot({ path: path.join(here, '../docs/prototypes/chapelhall-nave-ingame.png') }); console.log('  (picture: docs/prototypes/chapelhall-nave-ingame.png)');
    check(`the village: three rows of benches to the town's four (${rv.rows})`, rv.rows === 3, rv.rows);
    await page.evaluate(() => { const h = currentHouse; px = intDoorX(h); pz = h._roomD - .4; jumpY = 0; yaw = Math.PI; pitch = 0; interact(); });
    for (let k = 0; k < 40 && (await page.evaluate(() => isInterior())); k++) await page.waitForTimeout(250);
    check('the village: at the door E takes you out', !(await page.evaluate(() => isInterior()))); } }
check('no errors on the new look', g.errs.length === 0, g.errs);
await g.close();
