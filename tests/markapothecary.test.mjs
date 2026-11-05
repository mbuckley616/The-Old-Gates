// A Markish apothecary, on the street and inside, on the new look (Session 1879; card F9, Michael's A on #303 and on the kit in every
// interior; rooms.js's markApothecary of Session 937; OG-043, OG-133). A Markish 'potion' shop that fits stands as pieces.js's Mark hall of
// 6.4 by 9 m under shingle (lot.kit.apothecary), and opens on the healer's hall at its true size (PKIT.mk.apothecary) inside the street's
// own shell: walled below the windows but the door; you arrive clear; the prototype's five walks on foot; no walking into the hearth's
// fires; the healer behind the trade board, in reach; the strongbox clear; lit, within the draws; out by the door. A picture from the door.
import { boot, check } from './lib/game.mjs';
import path from 'path'; import { fileURLToPath } from 'url';
const here = path.dirname(fileURLToPath(import.meta.url));
const towns = () => { anchoredPlaces(); return [...CELLS.values()].filter(c => c.type !== 'sea' && nationKeyOf(c.i, c.j) === 'mark').flatMap(c => c.sites).filter(s => ['town', 'port', 'city', 'village'].includes(s.kind)).slice(0, 6).map(s => s.id); };

const g = await boot({ look: 'new' }); const { page } = g; await g.intoWorld();
let id = null, site = null; const seen = [];
for (const s of await page.evaluate(towns)) {
  if (!(await g.settle(s))) continue;
  const r = await page.evaluate(s => { const H = WORLD.settle.get(s).houses.filter(h => h.siteId === s && h.type === 'potion'); return { n: H.length, sm: (H.find(h => h.kit && h.kit.apothecary) || {}).id || null }; }, s);
  seen.push(`${s}: ${r.n} apothecar${r.n === 1 ? 'y' : 'ies'}${r.sm ? ', the kit’s' : ''}`); if (r.sm) { id = r.sm; site = s; break; }
}
check(`a Markish apothecary stands as rooms.js's healer's hall (${id || seen.join('; ')})`, !!id, seen);
if (id) {
  const st = await page.evaluate(([s, id]) => { const S = WORLD.settle.get(s), h = S.houses.find(h => h.id === id), o = h.kit.o, lot = (S.lots || []).find(l => l.kit === h.kit);
    return { o: { roof: o.roof, w: o.w, d: o.d, chimney: o.chimney, porch: o.porch }, tris: h.kit.tris, calls: h.kit.calls }; }, [site, id]);
  check(`on the street: the Mark hall of 6.4 by 9 m under shingle, no chimney (${st.o.porch ? 'with' : 'without'} its porch; ${st.tris} triangles, ${st.calls} calls)`, st.o.roof === 'shingle' && st.o.w === 6.4 && st.o.d === 9 && !st.o.chimney, st);
  await page.evaluate(([s, id]) => { const h = WORLD.settle.get(s).houses.find(h => h.id === id); window._H = h; forceTime(12); px = h.exitX; pz = h.exitZ; goToInterior(h); }, [site, id]);
  for (let k = 0; k < 60 && !(await page.evaluate(() => isInterior() && currentHouse === _H)); k++) await page.waitForTimeout(250);
  await g.frames(3);
  const r = await page.evaluate(() => {
    const h = currentHouse, T = h._markApothecary; if (!T) return { none: true, type: h && h.type };
    const W = h.intW, D = h.intD, X = T.inner.x1, Z = T.inner.z1; interiorScene.updateMatrixWorld(true);
    const meshes = []; let lights = 0, draws = 0, tris = 0, people = 0; const inRig = o => { for (let p = o; p; p = p.parent) if (p === intNPCMesh) return true; return false; };
    interiorScene.traverse(o => { if (o.isLight && !o.isAmbientLight && o.intensity > 0) lights++; if (o.isMesh && o.visible) { if (intNPCMesh && inRig(o)) people++; else if (!o.userData.daylight) { draws++; tris += (o.geometry.index ? o.geometry.index.count : o.geometry.attributes.position.count) / 3; meshes.push(o); } } });
    const rc = new THREE.Raycaster(), O = new THREE.Vector3(), Dv = new THREE.Vector3();
    const hit = (x, y, z, dx, dy, dz, far = 20) => { O.set(x, y, z); Dv.set(dx, dy, dz).normalize(); rc.set(O, Dv); rc.far = far; return rc.intersectObjects(meshes, false)[0] || null; };
    /* walled all round below the windows (0.5 m up; the windows' sills are 1.26): from 0.6 m inside each wall, every 0.8 m along it, the wall within 1.5 m (the door aside) */
    const open = []; for (let x = .4; x < W - .3; x += .8) { if (Math.abs(x - h._exitX) > 1.0 && !hit(x, .5, D - .6, 0, 0, 1, 1.5)) open.push(['front', +x.toFixed(1)]); if (!hit(x, .5, .6, 0, 0, -1, 1.5)) open.push(['back', +x.toFixed(1)]); }
    for (let z = .4; z < D - .3; z += .8) { if (!hit(W - .6, .5, z, 1, 0, 0, 1.5)) open.push(['east', +z.toFixed(1)]); if (!hit(.6, .5, z, -1, 0, 0, 1.5)) open.push(['west', +z.toFixed(1)]); }
    /* the roof: straight up beside the hearth (clear of the louver's hole), the lining or a rafter */
    const up = hit(W / 2 + 1.2, 1.8, D / 2 + 1.5, 0, 1, 0, 8), upY = up ? +up.point.y.toFixed(2) : null;
    const az = intArrivalZ(h), arrive = { x: +px.toFixed(2), z: +az.toFixed(2), clear: !intSolidAt(px, az, .3, 0), exits: az > D - h._exitD };
    const walk = pts => { let y = 0, blocked = [], maxStep = 0, [x, z] = pts[0]; for (let i = 1; i < pts.length; i++) { const [x1, z1] = pts[i], n = Math.ceil(Math.hypot(x1 - x, z1 - z) / .05);
        for (let k = 1; k <= n; k++) { const xx = x + (x1 - x) * k / n, zz = z + (z1 - z) * k / n, ny = footholdY(xx, zz, y, 0); maxStep = Math.max(maxStep, Math.abs(ny - y)); y = ny; if (intSolidAt(xx, zz, .2, y)) blocked.push([+xx.toFixed(2), +zz.toFixed(2), +y.toFixed(2)]); } x = x1; z = z1; }
      return { blocked: blocked.length, at: blocked.slice(0, 3), maxStep: +maxStep.toFixed(3) }; };
    /* each walk stops 5 cm short of its end */
    const short = P => { const Q = P.map(([x, z]) => [x + X, z + Z]), [a, b] = [Q[Q.length - 2], Q[Q.length - 1]], L = Math.hypot(b[0] - a[0], b[1] - a[1]); Q[Q.length - 1] = [b[0] - (b[0] - a[0]) / L * .05, b[1] - (b[1] - a[1]) / L * .05]; return Q; };
    const walks = T.paths.map(P => walk(short(P)));
    const P = intNPCMesh ? { x: +intNPCPos.x.toFixed(2), z: +intNPCPos.z.toFixed(2) } : null; let talk = null;
    if (P) { const ox = px, oz = pz, [ex, ez] = T.paths[0][T.paths[0].length - 1]; px = ex + X; pz = ez + Z; jumpY = 0; talk = { reach: keeperInReach(), d: +Math.hypot(px - P.x, pz - P.z).toFixed(2), clear: !intSolidAt(P.x, P.z, .2, 0), behind: P.z < T.board.z0 + Z && P.x > T.board.x0 + X && P.x < T.board.x1 + X };
    /* the hearth: nothing walks into its fires; from the hall's axis 0.4 m before the kerb, a step onto the ash bed is a solid */
    const fire = { kerb: intSolidAt(X, T.hearth.z1 + Z - .2, .2, 0), over: intSolidAt(X, T.hearth.z1 + Z - .2, .2, 1.0) }; px = ox; pz = oz; }
    const box = INT_BOX ? { x: +INT_BOX.x.toFixed(2), z: +INT_BOX.z.toFixed(2), kind: INT_BOX.kind, front: !intSolidAt(INT_BOX.x, INT_BOX.z + .65, .25, 0), alone: INT_SOL.filter(q => INT_BOX.x + .26 > q.x0 && INT_BOX.x - .26 < q.x1 && INT_BOX.z + .3 > q.z0 && INT_BOX.z - .3 < q.z1 && q.y0 < .5).length === 1 } : null;
    return { W: +W.toFixed(2), D: +D.toFixed(2), H: h._roomH, scaledBy: T.group.scale.x, open, upY, arrive, walks, P, talk, box, fire, lights, draws, people, tris: Math.round(tris) };
  });
  console.log(JSON.stringify({ ...r, walks: r.walks && r.walks.map(w => w.blocked) }));
  check(`the room is the healer's hall inside, ${r.W} by ${r.D} m and ${r.H} m to the tie beams, at its true size (scale ${r.scaledBy})`, !r.none && Math.abs(r.W - 5.9) < .05 && Math.abs(r.D - 8.5) < .05 && r.H > 2.4 && r.scaledBy === 1, r);
  if (!r.none) {
    check(`walled all round below the windows, the door aside (${r.open.length} openings)`, r.open.length === 0, r.open.slice(0, 8));
    check(`under the roof: straight up, the lining at ${r.upY} m`, r.upY != null && r.upY > 2.4 && r.upY < 6.5, r.upY);
    check(`you arrive clear inside the door at ${r.arrive.x}, ${r.arrive.z} m`, r.arrive.clear && !r.arrive.exits, r.arrive);
    check(`the prototype's five walks (to the board's front, behind it, down the left aisle to the table, the right aisle to the bench, round the hearth to the bed) on foot, nothing in the way`, r.walks.length === 5 && r.walks.every(w => w.blocked === 0 && w.maxStep <= .1), r.walks);
    check(`the healer stands clear behind the trade board, in reach to talk from its front (${r.talk && r.talk.d} m)`, !!r.talk && r.talk.reach && r.talk.clear && r.talk.behind, { P: r.P, talk: r.talk });
    check(`no walking into the hearth's fires: solid at the kerb and a metre over it`, r.fire.kerb && r.fire.over, r.fire);
    check(`the shop's strongbox stands on its own against the back wall, with clear floor before it`, !!r.box && r.box.kind === 'shop' && r.box.front && r.box.alone, r.box);
    check(`lit (${r.lights} lights); ${r.draws} meshes (45 or fewer) and ${r.tris.toLocaleString()} triangles (30,000 or fewer) besides the healer's ${r.people}`, r.lights >= 2 && r.draws <= 45 && r.tris <= 30000 && r.people >= 1, r);
    const pic = path.join(here, '../docs/prototypes/kit-markapothecary-room.png');
    await page.evaluate(() => { const h = currentHouse; VM_SCENE.visible = false; px = h._exitX + .3; pz = h.intD - .4; jumpY = 0; yaw = .0; pitch = -.08; });
    await g.frames(6); await page.screenshot({ path: pic }); console.log(`  (picture: ${path.relative(path.join(here, '..'), pic)})`);
    await page.evaluate(() => { const h = currentHouse; VM_SCENE.visible = true; px = h._exitX; pz = h.intD - .4; jumpY = 0; yaw = Math.PI; pitch = 0; interact(); });
    for (let k = 0; k < 40 && (await page.evaluate(() => isInterior())); k++) await page.waitForTimeout(250);
    check(`at the door E takes you out`, !(await page.evaluate(() => isInterior())));
  }
}
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
