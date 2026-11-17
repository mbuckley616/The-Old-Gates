// A Markish goods shop, armourer and barber, on the street and inside, on the new look (Session 2303; card F9, Michael's A on #1632;
// rooms.js's markTrader of Session 2290; OG-043, OG-115). A Markish 'misc', 'armor' or 'barber' shop that fits stands as pieces.js's Mark
// hall of 6.4 by 9 m under shingle (lot.kit.trader), and opens on the trader's hall at its true size (PKIT.mk.trader) inside the street's
// own shell: walled below the windows but the door; you arrive clear; the prototype's walks on foot; no walking into the hearth's fire; the
// keeper behind the counter, in reach from its front, the strongbox and the counter's front before him (a witness); the strongbox clear;
// the barber's chair to sit in; lit, within the draws; out by the door. A picture from inside the door toward the trade's side, one a trade.
import { boot, check } from './lib/game.mjs';
import path from 'path'; import { fileURLToPath } from 'url';
const here = path.dirname(fileURLToPath(import.meta.url));
const towns = () => { anchoredPlaces(); return [...CELLS.values()].filter(c => c.type !== 'sea' && nationKeyOf(c.i, c.j) === 'mark').flatMap(c => c.sites).filter(s => ['town', 'port', 'city', 'village'].includes(s.kind)).slice(0, 6).map(s => s.id); };
const WORD = { misc: 'goods shop', armor: 'armourer', barber: 'barber' };

const g = await boot({ look: 'new' }); const { page } = g; await g.intoWorld();
const visit = async (t, id, site, as) => {
  if (await page.evaluate(() => isInterior())) { await page.evaluate(() => exitInterior()); for (let k = 0; k < 40 && (await page.evaluate(() => isInterior())); k++) await page.waitForTimeout(250); }
  const st = await page.evaluate(([s, id]) => { const S = WORLD.settle.get(s), h = S.houses.find(h => h.id === id), o = h.kit.o;
    return { o: { roof: o.roof, w: o.w, d: o.d, chimney: o.chimney, porch: o.porch } }; }, [site, id]);
  check(`${WORD[t]} (${id}${as ? ', the goods shop’s lot opened as a barber’s' : ''}) on the street: the Mark hall of 6.4 by 9 m under shingle, no chimney (${st.o.porch ? 'with' : 'without'} its porch)`, st.o.roof === 'shingle' && st.o.w === 6.4 && st.o.d === 9 && !st.o.chimney, st);
  await page.evaluate(([s, id, as]) => { const h = WORLD.settle.get(s).houses.find(h => h.id === id); if (as) { h._was = h.type; h.type = h.kit.trader = 'barber'; } window._H = h; forceTime(12); px = h.exitX; pz = h.exitZ; goToInterior(h); }, [site, id, as]);
  for (let k = 0; k < 60 && !(await page.evaluate(() => isInterior() && currentHouse === _H)); k++) await page.waitForTimeout(250);
  await g.frames(3);
  const r = await page.evaluate(() => {
    const h = currentHouse, T = h._markTrader; if (!T) return { none: true, type: h && h.type };
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
    const chair = INT_CHAIR ? { x: +INT_CHAIR.x.toFixed(2), z: +INT_CHAIR.z.toFixed(2) } : null;
    const P = intNPCMesh ? { x: +intNPCPos.x.toFixed(2), z: +intNPCPos.z.toFixed(2) } : null; let talk = null;
    if (P) { const ox = px, oz = pz, [ex, ez] = T.paths[0][T.paths[0].length - 1]; px = ex + X; pz = ez + Z; jumpY = 0; talk = { reach: keeperInReach(), d: +Math.hypot(px - P.x, pz - P.z).toFixed(2), clear: !intSolidAt(P.x, P.z, .2, 0), behind: P.x > T.counter.x1 + X && P.z > T.counter.z0 + Z && P.z < T.counter.z1 + Z };
      const f = [Math.sin(intNPCMesh.rotation.y), Math.cos(intNPCMesh.rotation.y)], deg = (x, z) => { const dx = x - P.x, dz = z - P.z; return Math.round(Math.acos((dx * f[0] + dz * f[1]) / Math.hypot(dx, dz)) * 180 / Math.PI); };
      talk.sees = { box: INT_BOX ? deg(INT_BOX.x, INT_BOX.z) : null, front: deg(T.front[0] + X, T.front[1] + Z), door: deg(h._exitX, D) }; px = ox; pz = oz; }
    /* the hearth: nothing walks into its fires; on the hall's axis 0.2 m inside the kerb, solid on the floor and a metre up */
    const fire = { kerb: intSolidAt(X, T.hearth.z1 + Z - .2, .2, 0), over: intSolidAt(X, T.hearth.z1 + Z - .2, .2, 1.0) };
    const box = INT_BOX ? { x: +INT_BOX.x.toFixed(2), z: +INT_BOX.z.toFixed(2), kind: INT_BOX.kind, front: !intSolidAt(INT_BOX.x - .65, INT_BOX.z, .25, 0), alone: INT_SOL.filter(q => INT_BOX.x + .26 > q.x0 && INT_BOX.x - .26 < q.x1 && INT_BOX.z + .3 > q.z0 && INT_BOX.z - .3 < q.z1 && q.y0 < .5).length === 1 } : null;
    return { W: +W.toFixed(2), D: +D.toFixed(2), H: h._roomH, scaledBy: T.group.scale.x, open, upY, arrive, walks, P, talk, box, fire, chair, kind: T.kind, lights, draws, people, tris: Math.round(tris) };
  });
  console.log(JSON.stringify({ ...r, walks: r.walks && r.walks.map(w => w.blocked) }));
  check(`${WORD[t]}: the room is the trader's hall inside, ${r.W} by ${r.D} m and ${r.H} m to the tie beams, at its true size (scale ${r.scaledBy})`, !r.none && r.kind === t && Math.abs(r.W - 5.9) < .05 && Math.abs(r.D - 8.5) < .05 && r.H > 2.4 && r.scaledBy === 1, r);
  if (r.none) { if (as) await page.evaluate(() => { const h = window._H; h.type = h.kit.trader = h._was; delete h._was; }); return; }
  check(`${WORD[t]}: walled all round below the windows, the door aside (${r.open.length} openings)`, r.open.length === 0, r.open.slice(0, 8));
  check(`${WORD[t]}: under the roof: straight up, the lining at ${r.upY} m`, r.upY != null && r.upY > 2.4 && r.upY < 6.5, r.upY);
  check(`${WORD[t]}: you arrive clear inside the door at ${r.arrive.x}, ${r.arrive.z} m`, r.arrive.clear && !r.arrive.exits, r.arrive);
  check(`${WORD[t]}: the prototype's ${r.walks.length} walks (to the counter's front, into the keeper's walk, to the trade's side, round the hearth to the bed${t === 'barber' ? ', to the chair' : ''}) on foot, nothing in the way`, r.walks.length === (t === 'barber' ? 5 : 4) && r.walks.every(w => w.blocked === 0 && w.maxStep <= .1), r.walks);
  check(`${WORD[t]}: the keeper stands clear behind the counter, in reach from its front (${r.talk && r.talk.d} m), the strongbox ${r.talk && r.talk.sees.box}° and the counter's front ${r.talk && r.talk.sees.front}° off his face`, !!r.talk && r.talk.reach && r.talk.clear && r.talk.behind && r.talk.sees.box <= 60 && r.talk.sees.front <= 60, { P: r.P, talk: r.talk });
  check(`${WORD[t]}: no walking into the hearth's fire: solid at the kerb and a metre over it`, r.fire.kerb && r.fire.over, r.fire);
  check(`${WORD[t]}: the shop's strongbox stands on its own at the keeper's walk's door end, with clear floor before its lid`, !!r.box && r.box.kind === 'shop' && r.box.front && r.box.alone, r.box);
  if (t === 'barber') check(`barber: the chair is one to sit in (${JSON.stringify(r.chair)})`, !!r.chair, r.chair);
  check(`${WORD[t]}: lit (${r.lights} lights); ${r.draws} meshes (45 or fewer) and ${r.tris.toLocaleString()} triangles (30,000 or fewer) besides the keeper's ${r.people}`, r.lights >= 2 && r.draws <= 45 && r.tris <= 30000 && r.people >= 1, r);
  const pic = path.join(here, `../docs/prototypes/kit-marktrader-${t}.png`);
  await page.evaluate(() => { const h = currentHouse; VM_SCENE.visible = false; px = h._exitX + .7; pz = h.intD - 1.6; jumpY = 0; yaw = .62; pitch = -.1; /* in past the door's leaf, toward the trade's side */ });
  await g.frames(6); await page.screenshot({ path: pic }); console.log(`  (picture: ${path.relative(path.join(here, '..'), pic)})`);
  await page.evaluate(() => { const h = currentHouse; VM_SCENE.visible = true; px = h._exitX; pz = h.intD - .4; jumpY = 0; yaw = Math.PI; pitch = 0; interact(); });
  for (let k = 0; k < 40 && (await page.evaluate(() => isInterior())); k++) await page.waitForTimeout(250);
  check(`${WORD[t]}: at the door E takes you out`, !(await page.evaluate(() => isInterior())));
  if (as) await page.evaluate(() => { const h = window._H; h.type = h.kit.trader = h._was; delete h._was; });
};
// Each trade is visited as soon as its town is settled, so no town is settled twice (CI's 900 s). The Mark's first six settlements hold a
// goods shop and an armourer in the hall, and no barber (the first is the eighth town's). A barber's room is the same build with its own
// pieces and the chair: where none has been found, the goods shop's lot is opened as a barber's (its type and kit.trader set for the
// visit, then put back), while its town is loaded.
const found = {}, seen = [];
for (const s of await page.evaluate(towns)) {
  if (found.misc && found.armor) break;
  if (!(await g.settle(s))) continue;
  const r = await page.evaluate(s => { const H = WORLD.settle.get(s).houses.filter(h => h.siteId === s && ['misc', 'armor', 'barber'].includes(h.type)), o = {};
    for (const h of H) if (h.kit && h.kit.trader === h.type && h.kit.o.d === 9 && !o[h.type]) o[h.type] = h.id; return { n: H.length, o }; }, s);
  seen.push(`${s}: ${r.n} shops, ${Object.keys(r.o).join(' ') || 'no hall'}`);
  for (const t of ['misc', 'armor', 'barber']) if (r.o[t] && !found[t]) { found[t] = { id: r.o[t], site: s }; await visit(t, r.o[t], s, false);
    if (t === 'misc' && !found.barber && !r.o.barber) { found.barber = { id: r.o.misc, site: s, as: true }; await visit('barber', r.o.misc, s, true); } }
}
check(`Markish shops stand as rooms.js's trader's hall (${Object.keys(found).map(t => WORD[t] + (found[t].as ? ' (the goods shop’s lot)' : '')).join(', ') || seen.join('; ')})`, !!found.misc && !!found.armor, seen);
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
