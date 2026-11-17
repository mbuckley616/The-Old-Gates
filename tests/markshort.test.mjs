// The Mark's shops on a wide, shallow lot, on the street and inside, on the new look (Session 2328; card F9, Michael's A on #1662 and on
// #1666; rooms.js's short trader's hall of Session 2310 and the smith's hall at the lot's size of Session 2312; OG-043, OG-115). A Markish
// goods shop, armourer or barber whose lot takes no 6.4 by 9 m hall but one of 6.8 by 6.8 m or more stands as that hall under shingle with
// no chimney (lot.kit.trader) and opens on the trader's hall short (PKIT.mk.trader at the hall's size); a weaponsmith's of 6.0 by 6.55 m or
// more, the smith's hall at that size (lot.kit.smithy, PKIT.mk.smithy). In the Mark's first ports and its city, one of each: the hall on the
// street; inside at the hall's size, walled below the windows, you arrive clear, the prototype's walks on foot, the keeper in reach, the
// strongbox the shop's and clear, lit within the draws, out by the door. A picture from inside the door, one a hall.
import { boot, check } from './lib/game.mjs';
import path from 'path'; import { fileURLToPath } from 'url';
const here = path.dirname(fileURLToPath(import.meta.url));
const towns = () => { anchoredPlaces(); return [...CELLS.values()].filter(c => c.type !== 'sea' && nationKeyOf(c.i, c.j) === 'mark').flatMap(c => c.sites).filter(s => ['port', 'city'].includes(s.kind)).slice(0, 5).map(s => s.id); };

const g = await boot({ look: 'new' }); const { page } = g; await g.intoWorld();
const visit = async (kind, id, site) => {
  const st = await page.evaluate(([s, id]) => { const h = WORLD.settle.get(s).houses.find(h => h.id === id), o = h.kit.o; return { type: h.type, o: { roof: o.roof, w: o.w, d: o.d, chimney: o.chimney, porch: o.porch } }; }, [site, id]);
  const tag = `${kind === 'trader' ? 'the trader’s hall short' : 'the smith’s hall'} (${id}, ${st.type}, ${st.o.w} by ${st.o.d} m)`;
  check(`${tag} on the street: under shingle, no chimney, inside the prototype's sizes`, st.o.roof === 'shingle' && !st.o.chimney && st.o.d < 9 && st.o.d <= 7.9 && st.o.w <= 8.4 && st.o.w >= (kind === 'trader' ? 6.8 : 6.0) && st.o.d >= (kind === 'trader' ? 6.8 : 6.55), st);
  await page.evaluate(([s, id]) => { const h = WORLD.settle.get(s).houses.find(h => h.id === id); window._H = h; forceTime(12); px = h.exitX; pz = h.exitZ; goToInterior(h); }, [site, id]);
  for (let k = 0; k < 60 && !(await page.evaluate(() => isInterior() && currentHouse === _H)); k++) await page.waitForTimeout(250);
  await g.frames(3);
  const r = await page.evaluate(kind => {
    const h = currentHouse, T = kind === 'trader' ? h._markTrader : h._markSmithy; if (!T) return { none: true };
    const W = h.intW, D = h.intD, X = T.inner.x1, Z = T.inner.z1; interiorScene.updateMatrixWorld(true);
    const meshes = []; let lights = 0, draws = 0, tris = 0, people = 0; const inRig = o => { for (let p = o; p; p = p.parent) if (p === intNPCMesh) return true; return false; };
    interiorScene.traverse(o => { if (o.isLight && !o.isAmbientLight && o.intensity > 0) lights++; if (o.isMesh && o.visible) { if (intNPCMesh && inRig(o)) people++; else if (!o.userData.daylight) { draws++; tris += (o.geometry.index ? o.geometry.index.count : o.geometry.attributes.position.count) / 3; meshes.push(o); } } });
    const rc = new THREE.Raycaster(), O = new THREE.Vector3(), Dv = new THREE.Vector3();
    const hit = (x, y, z, dx, dy, dz, far = 20) => { O.set(x, y, z); Dv.set(dx, dy, dz).normalize(); rc.set(O, Dv); rc.far = far; return rc.intersectObjects(meshes, false)[0] || null; };
    /* walled all round below the windows: from 0.6 m inside each wall, every 0.8 m along it, the wall within 1.5 m (the door aside) */
    const open = []; for (let x = .4; x < W - .3; x += .8) { if (Math.abs(x - h._exitX) > 1.0 && !hit(x, .5, D - .6, 0, 0, 1, 1.5)) open.push(['front', +x.toFixed(1)]); if (!hit(x, .5, .6, 0, 0, -1, 1.5)) open.push(['back', +x.toFixed(1)]); }
    for (let z = .4; z < D - .3; z += .8) { if (!hit(W - .6, .5, z, 1, 0, 0, 1.5)) open.push(['east', +z.toFixed(1)]); if (!hit(.6, .5, z, -1, 0, 0, 1.5)) open.push(['west', +z.toFixed(1)]); }
    const az = intArrivalZ(h), ax = intArriveX(h), arrive = { x: +ax.toFixed(2), z: +az.toFixed(2), clear: !intSolidAt(ax, az, .3, 0), exits: az > D - h._exitD };
    const walk = pts => { let y = 0, blocked = [], maxStep = 0, [x, z] = pts[0]; for (let i = 1; i < pts.length; i++) { const [x1, z1] = pts[i], n = Math.ceil(Math.hypot(x1 - x, z1 - z) / .05);
        for (let k = 1; k <= n; k++) { const xx = x + (x1 - x) * k / n, zz = z + (z1 - z) * k / n, ny = footholdY(xx, zz, y, 0); maxStep = Math.max(maxStep, Math.abs(ny - y)); y = ny; if (intSolidAt(xx, zz, .2, y)) blocked.push([+xx.toFixed(2), +zz.toFixed(2), +y.toFixed(2)]); } x = x1; z = z1; }
      return { blocked: blocked.length, at: blocked.slice(0, 3), maxStep: +maxStep.toFixed(3) }; };
    /* each walk stops 5 cm short of its end */
    const short = P => { const Q = P.map(([x, z]) => [x + X, z + Z]), [a, b] = [Q[Q.length - 2], Q[Q.length - 1]], L = Math.hypot(b[0] - a[0], b[1] - a[1]); Q[Q.length - 1] = [b[0] - (b[0] - a[0]) / L * .05, b[1] - (b[1] - a[1]) / L * .05]; return Q; };
    const walks = T.paths.map(P => walk(short(P)));
    const P = intNPCMesh ? { x: +intNPCPos.x.toFixed(2), z: +intNPCPos.z.toFixed(2) } : null; let talk = null;
    if (P) { const ox = px, oz = pz, [ex, ez] = kind === 'trader' ? T.front : T.paths[0][T.paths[0].length - 1]; px = ex + X; pz = ez + Z; jumpY = 0; talk = { reach: keeperInReach(), d: +Math.hypot(px - P.x, pz - P.z).toFixed(2), clear: !intSolidAt(P.x, P.z, .2, 0) }; px = ox; pz = oz; }
    const box = INT_BOX ? { kind: INT_BOX.kind, clear: [[.7, 0], [-.7, 0], [0, .7], [0, -.7]].some(([dx, dz]) => !intSolidAt(INT_BOX.x + dx, INT_BOX.z + dz, .25, 0)) } : null;
    return { W: +W.toFixed(2), D: +D.toFixed(2), H: h._roomH, scaledBy: T.group.scale.x, open, arrive, walks, P, talk, box, lights, draws, people, tris: Math.round(tris) };
  }, kind);
  console.log(JSON.stringify({ ...r, walks: r.walks && r.walks.map(w => w.at) }));
  check(`${tag}: inside at the hall's size, ${r.W} by ${r.D} m, ${r.H} m to the tie beams (scale ${r.scaledBy})`, !r.none && Math.abs(r.W - (st.o.w - .5)) < .05 && Math.abs(r.D - (st.o.d - .5)) < .05 && r.H > 2.4 && r.scaledBy === 1, r);
  if (r.none) return;
  check(`${tag}: walled all round below the windows, the door aside (${r.open.length} openings)`, r.open.length === 0, r.open.slice(0, 8));
  check(`${tag}: you arrive clear inside the door at ${r.arrive.x}, ${r.arrive.z} m`, r.arrive.clear && !r.arrive.exits, r.arrive);
  check(`${tag}: the prototype's ${r.walks.length} walks on foot, nothing in the way`, r.walks.length >= 3 && r.walks.every(w => w.blocked === 0 && w.maxStep <= .1), r.walks);
  check(`${tag}: the keeper stands clear, in reach to talk (${r.talk && r.talk.d} m)`, !!r.talk && r.talk.reach && r.talk.clear, { P: r.P, talk: r.talk });
  check(`${tag}: the shop's strongbox, with clear floor beside it`, !!r.box && r.box.kind === 'shop' && r.box.clear, r.box);
  check(`${tag}: lit (${r.lights} lights); ${r.draws} meshes (45 or fewer) and ${r.tris.toLocaleString()} triangles (30,000 or fewer) besides the keeper's ${r.people}`, r.lights >= 2 && r.draws <= 45 && r.tris <= 30000 && r.people >= 1, r);
  const pic = path.join(here, `../docs/prototypes/kit-markshort-${kind}.png`);
  await page.evaluate(() => { const h = currentHouse; VM_SCENE.visible = false; px = intArriveX(h); pz = intArrivalZ(h); jumpY = 0; yaw = h._arriveYaw ?? 0; pitch = -.1; });
  await g.frames(6); await page.screenshot({ path: pic }); console.log(`  (picture: ${path.relative(path.join(here, '..'), pic)})`);
  await page.evaluate(() => { const h = currentHouse; VM_SCENE.visible = true; px = h._exitX; pz = h.intD - .4; jumpY = 0; yaw = Math.PI; pitch = 0; interact(); });
  for (let k = 0; k < 40 && (await page.evaluate(() => isInterior())); k++) await page.waitForTimeout(250);
  check(`${tag}: at the door E takes you out`, !(await page.evaluate(() => isInterior())));
};
const found = {}, seen = [];
for (const s of await page.evaluate(towns)) {
  if (found.trader && found.smithy) break;
  if (!(await g.settle(s))) continue;
  const r = await page.evaluate(s => { const H = WORLD.settle.get(s).houses.filter(h => h.siteId === s && h.kit && h.kit.kind === 'markhall' && h.kit.o.d < 9);
    return { trader: (H.find(h => h.kit.trader === h.type) || {}).id, smithy: (H.find(h => h.type === 'weapon' && h.kit.smithy) || {}).id, n: H.filter(h => h.type !== 'home').length }; }, s);
  seen.push(`${s}: ${r.n} shops in a hall under 9 m`);
  for (const k of ['trader', 'smithy']) if (r[k] && !found[k]) { found[k] = r[k]; await visit(k, r[k], s); }
}
check(`the wide, shallow lots' shops stand as the short halls (${Object.entries(found).map(([k, v]) => `${k} ${v}`).join(', ') || seen.join('; ')})`, !!found.trader && !!found.smithy, seen);
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
