// The Mark's alehall in a Markish inn on the new look (Session 1288; card F9, Michael's A on #321: "renting a place is renting a
// bench", and his A on #588: the keeper's bench lines first, then hang it). On ?look=new a Markish inn's lot is the kit's hall outside
// (shingle, carved gables, the louver and no chimney, as large as fits up to 10 by 18 m) and PKIT.mk.alehall inside at 10 by 18, not
// scaled. In the first Markish settlement whose inn takes it, entered as you enter it: the room is the hall's inside (9.5 by 17.5 m),
// walled all round; you arrive clear before the door; six places to let lie on the wall benches, three a bench, room 0 to 5, the left
// bench first, each from the door to the counter, as the keeper names them; each place is reached on foot, up onto its bench at the
// door's end and along it between the posts and the wall; the keeper stands behind the counter in reach across it; you rent a place
// and the bench under you is yours; the room is lit and within its draws; and you leave by the door. A picture from the door.
import { boot, check } from './lib/game.mjs';
import fs from 'fs'; import path from 'path'; import { fileURLToPath } from 'url';
const here = path.dirname(fileURLToPath(import.meta.url));
const sites = () => { anchoredPlaces(); return [...CELLS.values()].filter(c => c.type !== 'sea' && nationKeyOf(c.i, c.j) === 'mark').flatMap(c => c.sites).filter(s => ['village', 'town', 'city', 'outpost'].includes(s.kind)).slice(0, 4).map(s => s.id); };
const innOf = id => { const S = WORLD.settle.get(id), h = S && S.houses.find(h => h.siteId === id && h.type === 'inn' && h.kit && h.kit.alehall); return h ? { id: h.id, name: h.name, o: h.kit.o, kind: h.kit.kind } : null; };

const g = await boot({ look: 'new' }); const { page } = g; await g.intoWorld();
let sid = null, inn = null;
for (const id of await page.evaluate(sites)) { if (!(await g.settle(id))) continue; inn = await page.evaluate(innOf, id); if (inn) { sid = id; break; } }
check(`a Markish inn stands as the kit's hall (${sid}: ${inn && inn.name}, ${inn && inn.o.w} by ${inn && inn.o.d} m${inn && inn.o.porch ? ', porched' : ''})`, !!inn && inn.kind === 'markhall' && inn.o.roof === 'shingle' && !inn.o.chimney && inn.o.carve && inn.o.w >= 7 && inn.o.w <= 10 && inn.o.d >= 10 && inn.o.d <= 18, inn);
if (!inn) { await g.close(); process.exit(); }
const pick = `const S = WORLD.settle.get(id), h = S.houses.find(h => h.siteId === id && h.type === 'inn' && h.kit && h.kit.alehall);`;

const pre = await page.evaluate(new Function('id', `${pick} forceTime(12); return { ale: kitAlehall(h), bench: innBench(h), n: innRooms(h), names: [0, 1, 2, 3, 4, 5].map(k => innRoomName(k, 6, h)) };`), sid);
check(`its room is the alehall and the keeper lets six places on the benches (${pre.names.join('; ')})`, pre.ale && pre.bench && pre.n === 6 && pre.names[0] === 'the place by the door on the left bench' && pre.names[5] === 'the place by the counter on the right bench', pre);

await page.evaluate(new Function('id', `${pick} px = h.exitX; pz = h.exitZ; goToInterior(h);`), sid);
for (let k = 0; k < 40 && !(await page.evaluate(() => isInterior())); k++) await page.waitForTimeout(250);
await g.frames(2);
const r = await page.evaluate(() => {
  const h = currentHouse, T = h._alehall, W = h._roomW, D = h._roomD; interiorScene.updateMatrixWorld(true);
  const meshes = []; let lights = 0, draws = 0, tris = 0, kDraws = 0; const inKeeper = o => { for (let p = o; p; p = p.parent) if (p === intNPCMesh) return true; return false; };
  interiorScene.traverse(o => { if (o.isLight && !o.isAmbientLight) lights++; if (o.isMesh && o.visible) { if (intNPCMesh && inKeeper(o)) kDraws++; else { draws++; tris += (o.geometry.index ? o.geometry.index.count : o.geometry.attributes.position.count) / 3; if (!o.userData.daylight) meshes.push(o); } } });
  const rc = new THREE.Raycaster(), O = new THREE.Vector3(), Dv = new THREE.Vector3();
  const hit = (x, y, z, dx, dy, dz, far = 20) => { O.set(x, y, z); Dv.set(dx, dy, dz).normalize(); rc.set(O, Dv); rc.far = far; const q = rc.intersectObjects(meshes, false)[0]; return q ? +q.distance.toFixed(3) : null; };
  // walled all round: from the aisle every metre along each wall at 0.6 and 2.2 m, nothing open (the door aside)
  const open = []; for (const y of [.6, 2.2]) { for (let x = .5; x < W - .4; x += 1) { if (Math.abs(x - W / 2) > .8 && hit(x, y, D / 2, 0, 0, 1, D) == null) open.push(['front', x, y]); if (hit(x, y, D / 2, 0, 0, -1, D) == null) open.push(['back', x, y]); }
    for (let z = .5; z < D - .4; z += 1) { if (hit(W / 2, y, z, 1, 0, 0, W) == null) open.push(['right', z, y]); if (hit(W / 2, y, z, -1, 0, 0, W) == null) open.push(['left', z, y]); } }
  const floor = hit(W / 2 - 1.45, 1, D / 2, 0, -1, 0, 3);
  const az = intArrivalZ(h), exitZ = D - h._exitD, dx = intDoorX(h), arrive = { x: +px.toFixed(2), z: +az.toFixed(2), door: dx, clear: !intSolidAt(px, az, .3, 0), exits: az > exitZ, mid: Math.abs(dx - W / 2) < .01 };
  // the places: on the wall benches (left bench x < W/2 for rooms 0-2), each further from the door than the last
  const wall = INT_SOL.filter(s => s.x1 - s.x0 > .9 && s.x1 - s.x0 < 1.1 && s.z1 - s.z0 > 10 && Math.abs(s.y1 - STEP_UP) < 1e-6);
  const beds = INT_BEDS.map(b => ({ room: b.room, owner: b.owner, x: +b.x.toFixed(2), z: +b.z.toFixed(2), y: b.y, on: wall.some(s => b.x > s.x0 && b.x < s.x1 && b.z > s.z0 && b.z < s.z1) }));
  const order = beds.every((b, k) => b.room === k && (k < 3 ? b.x < W / 2 : b.x > W / 2) && (k % 3 === 0 || b.z < beds[k - 1].z));
  // each place on foot: from the floor 0.5 m short of its bench's door end, up onto the bench and along it to the place, with the
  // game's own ground (footholdY) and solids, as you walk it
  const walks = INT_BEDS.map(b => { const s = wall.find(s => b.x > s.x0 && b.x < s.x1); let y = 0, blocked = 0, maxStep = 0; const z0 = s.z1 + .5;
    for (let z = z0; z >= b.z - 1e-6; z -= .05) { if (intSolidAt(b.x, z, .3, y)) blocked++; const ny = footholdY(b.x, z, y, 0); maxStep = Math.max(maxStep, ny - y); y = ny; }
    return { room: b.room, blocked, maxStep: +maxStep.toFixed(3), on: +y.toFixed(3), from: +(z0 - b.z).toFixed(2) }; });
  const C = T.counter, cf = C.z1 + T.inner.z1, keeper = intNPCMesh ? { x: +intNPCPos.x.toFixed(2), z: +intNPCPos.z.toFixed(2), behind: intNPCPos.z < C.z0 + T.inner.z1 && intNPCPos.z > .65, reach: +(cf + .3 - intNPCPos.z).toFixed(2), clearFront: !intSolidAt(intNPCPos.x, cf + .3, .25, 0) } : null;
  const hatch = HATCH.active ? { x: +HATCH.x.toFixed(2), z: +HATCH.z.toFixed(2), clear: !intSolidAt(HATCH.x, HATCH.z, .3, 0) } : null;
  return { W, D, open, floor, arrive, exitZ: +exitZ.toFixed(2), beds, order, walks, keeper, hatch, lights, draws, kDraws, tris: Math.round(tris), scaledBy: T.group.scale.x, prompt: WORLD.bedPrompt(INT_BEDS[1]) };
});
check(`the room is the alehall's inside, ${r.W} by ${r.D} m, at its true size (scale ${r.scaledBy})`, Math.abs(r.W - 9.5) < .01 && Math.abs(r.D - 17.5) < .01 && r.scaledBy === 1, r);
check(`walled all round: no opening along the walls at 0.6 or 2.2 m but the door (${r.open.length}); the boards are the floor (${r.floor} m under a point 1 m up)`, r.open.length === 0 && r.floor != null && Math.abs(r.floor - 1) < .03, r.open.slice(0, 6));
check(`you arrive clear at ${r.arrive.x}, ${r.arrive.z} m, before the door in the gable's middle, outside its reach (from ${r.exitZ} m)`, r.arrive.clear && !r.arrive.exits && r.arrive.mid, r.arrive);
check(`six places to let on the wall benches, rooms ${r.beds.map(b => b.room).join(', ')}: the left bench, then the right, each from the door inward`, r.beds.length === 6 && r.beds.every(b => b.owner === 'inn' && b.on) && r.order, r.beds);
check(`each place is reached on foot, up onto its bench (steps of ${Math.max(...r.walks.map(w => w.maxStep))} m or less) and along it, nothing in the way (${r.walks.map(w => w.from).join(', ')} m from the bench's end)`, r.walks.every(w => w.blocked === 0 && w.maxStep <= .4 && Math.abs(w.on - .4) < .01), r.walks);
check(`before you rent, a place says to ask the keeper (“${r.prompt}”)`, /^Ask the keeper for a place on the bench/.test(r.prompt || ''), r.prompt);
check(`the keeper stands behind the counter at ${r.keeper && [r.keeper.x, r.keeper.z].join(', ')}, ${r.keeper && r.keeper.reach} m from you across it (in reach under 2.2)`, !!r.keeper && r.keeper.behind && r.keeper.clearFront && r.keeper.reach < 2.2, r.keeper);
if (r.hatch) check(`the cellar's hatch is in the boards at ${r.hatch.x}, ${r.hatch.z}, clear to stand at`, r.hatch.clear, r.hatch);
check(`the room is lit (${r.lights} lights) and draws ${r.draws} meshes (60 or fewer), ${r.tris.toLocaleString()} triangles; the keeper ${r.kDraws}`, r.lights >= 4 && r.draws <= 60 && r.kDraws >= 1, r);
const sky = await page.evaluate(() => { const h = currentHouse, T = h._alehall, W = h._roomW, D = h._roomD, S = []; interiorScene.traverse(o => { if (o.isLight && o.userData.daylight) S.push({ x: +o.position.x.toFixed(2), z: +o.position.z.toFixed(2), i: +o.intensity.toFixed(2), in: o.position.x > 0 && o.position.x < W && o.position.z > 0 && o.position.z <= D }); });
  return { hr: +gameHour().toFixed(1), want: 2 * Math.max(1, Math.floor(T.d / 4)) + 1, S }; });
check(`at noon the day comes in through the hall's ${sky.want - 1} shuttered windows and the door (${sky.S.length} sky spots inside the hall; S1507)`, sky.hr >= 7 && sky.hr < 18 ? sky.S.length === sky.want && sky.S.every(q => q.in && q.i > 0) : sky.S.length === 0, sky);

// Session 1521 (#805, Michael's C: each island its own): the Mark's torches, three on each side wall halfway between its windows, each
// flame at about 2.25 m, each with its own light, the flames flickering from one tick to the next
const tor = await page.evaluate(() => { const h = currentHouse, T = h._alehall, W = h._roomW, F = h._hallFix; if (!F) return null; interiorScene.updateMatrixWorld(true);
  const n = Math.max(1, Math.floor(T.d / 4)), win = Array.from({ length: n }, (_, i) => T.inner.z1 + (-T.d / 2 + (i + .5) * T.d / n)), v = new THREE.Vector3();
  const fl = F.flames.map(m => { m.getWorldPosition(v); return { x: +v.x.toFixed(2), y: +v.y.toFixed(2), z: +v.z.toFixed(2), wall: +Math.min(v.x, W - v.x).toFixed(2), win: +Math.min(...win.map(z => Math.abs(z - v.z))).toFixed(2) }; });
  const L = []; interiorScene.traverse(o => { if (o.isLight && o.userData.hallFix) L.push(o); }); const P = _LPS.get(interiorScene); if (P) for (const v of P.src) if (v.mirror.userData.hallFix && !L.includes(v.mirror)) L.push(v.mirror); /* the room's pool takes them as sources */
  const s0 = F.flames[0].scale.y; interiorScene.userData.hallTick(performance.now() + 37); const s1 = F.flames[0].scale.y;
  return { n: fl.length, fl, lights: L.length, lit: L.every(l => l.intensity > 0), tris: F.tris, draws: F.draws, flick: s0 !== s1 }; });
check(`the Mark's torches: ${tor && tor.n} on the side walls, flames at ${tor && [...new Set(tor.fl.map(f => f.y))].join(', ')} m, ${tor && Math.min(...tor.fl.map(f => f.win))} m or more from a window, each its own light, flickering; ${tor && tor.tris} triangles in ${tor && tor.draws} draws (S1521)`,
  !!tor && tor.n === 6 && tor.fl.every(f => f.wall < .45 && f.y > 2.1 && f.y < 2.4 && f.win > 1.5) && tor.lights === 6 && tor.lit && tor.flick, tor);

// renting: the keeper's yes takes a place, and that place is yours to rest on, the others not
const rent = await page.evaluate(() => { const h = currentHouse; gold = 200; const t = h.dlg._extra.find(t => /bed for the night/i.test(t.label)); const yes = t.follow.find(f => /^Yes/.test(f.label)); const said = yes.fn();
  const mine = worldState.rented && worldState.rented.room, b = INT_BEDS.find(b => b.room === mine), o = INT_BEDS.find(b => b.room !== mine);
  return { said, mine, bench: worldState.rented && worldState.rented.bench, p: WORLD.bedPrompt(b), q: WORLD.bedPrompt(o) }; });
check(`rented: “${rent.said}”; place ${rent.mine} says “${rent.p}”, another “${rent.q}”`, rent.mine != null && rent.bench === 1 && /^Your place/.test(rent.p) && /place/.test(rent.q) && !/^Your/.test(rent.q), rent);

// the pictures (the room was built at noon): down the hall from inside the door, and by the left bench toward the hearth and the counter
fs.mkdirSync(path.join(here, '../docs/prototypes'), { recursive: true });
for (const [name, x, z, yw] of [['ingame', -.6, -.5, -.1], ['hearth', -2.6, -4, .5]]) {
  await page.evaluate(([x, z, yw]) => { const h = currentHouse; VM_SCENE.visible = false; px = h._roomW / 2 + x; pz = h._roomD + z; jumpY = 0; yaw = yw; pitch = -.08; }, [x, z, yw]);
  await g.frames(6);
  await page.screenshot({ path: path.join(here, `../docs/prototypes/alehall-${name}.png`) });
  console.log(`  (picture: docs/prototypes/alehall-${name}.png)`); }

await page.evaluate(() => { const h = currentHouse; px = intDoorX(h); pz = h._roomD - .4; jumpY = 0; yaw = Math.PI; interact(); });
for (let k = 0; k < 40 && (await page.evaluate(() => isInterior())); k++) await page.waitForTimeout(250);
check('at the door E takes you out', !(await page.evaluate(() => isInterior())));
check('no errors on the new look', g.errs.length === 0, g.errs);
await g.close();
