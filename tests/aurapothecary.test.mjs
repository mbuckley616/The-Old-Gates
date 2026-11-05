// An Aurennais apothecary, on the street and inside, on the new look (Session 1894; card F9, Michael's A on #303 and on the kit in every
// interior; rooms.js's aurenneApothecary of Session 938; OG-043, OG-114, OG-133). An Aurennais 'potion' shop that fits stands as the smithy's
// Roman house of 7.2 by 6 m with its arcade and the still's flue through the roof at the back right (lot.kit.apothecary), and opens on the
// shop of glass and glazed jars at its true size (PKIT.au.apothecary) inside the street's own shell: walled below the sills but the door; you
// arrive clear; the prototype's three walks on foot; the apothecary behind the counter, in reach from its front; the strongbox clear; lit,
// within the draws; out by the door. A picture from the door.
import { boot, check } from './lib/game.mjs';
import path from 'path'; import { fileURLToPath } from 'url';
const here = path.dirname(fileURLToPath(import.meta.url));
const towns = () => { anchoredPlaces(); return [...CELLS.values()].filter(c => c.type !== 'sea' && nationKeyOf(c.i, c.j) === 'aurenne').flatMap(c => c.sites).filter(s => ['town', 'port', 'city', 'village'].includes(s.kind)).slice(0, 6).map(s => s.id); };

const g = await boot({ look: 'new' }); const { page } = g; await g.intoWorld();
let id = null, site = null; const seen = [];
for (const s of await page.evaluate(towns)) {
  if (!(await g.settle(s))) continue;
  const r = await page.evaluate(s => { const H = WORLD.settle.get(s).houses.filter(h => h.siteId === s && h.type === 'potion'); return { n: H.length, sm: (H.find(h => h.kit && h.kit.apothecary) || {}).id || null }; }, s);
  seen.push(`${s}: ${r.n} apothecar${r.n === 1 ? 'y' : 'ies'}${r.sm ? ', the kit’s' : ''}`); if (r.sm) { id = r.sm; site = s; break; }
}
check(`an Aurennais apothecary stands as rooms.js's apothecary (${id || seen.join('; ')})`, !!id, seen);
if (id) {
  const st = await page.evaluate(([s, id]) => { const S = WORLD.settle.get(s), h = S.houses.find(h => h.id === id), o = h.kit.o, k = h.kit.stack; if (!k) return { o, none: true };
    /* straight down onto the stack from 5 m over its cap: the first thing met is the cap, at the stack's top */
    const meshes = []; S.group.traverse(m => { if (m.isMesh && m.visible) meshes.push(m); }); S.group.updateMatrixWorld(true);
    const rc = new THREE.Raycaster(new THREE.Vector3(k.x, k.y + 5, k.z), new THREE.Vector3(0, -1, 0)); rc.far = 10; const hit = rc.intersectObjects(meshes, false)[0];
    const smoke = S.chimneys.some(c => Math.hypot(c.x - k.x, c.z - k.z) < .1);
    return { o: { kind: o.kind, w: o.w, d: o.d, two: o.two, arcade: o.arcade }, tris: h.kit.tris, calls: h.kit.calls, over: +(k.y - worldH(k.x, k.z)).toFixed(2), capAt: hit ? +(hit.point.y - k.y).toFixed(2) : null, smoke }; }, [site, id]);
  check(`on the street: the Roman house of 7.2 by 6 m, one storey, its arcade (${st.tris} triangles, ${st.calls} calls)`, st.o.kind === 'tile' && st.o.w === 7.2 && st.o.d === 6 && !st.o.two && st.o.arcade, st);
  check(`the still's stack stands through the roof, its cap ${st.over} m over the ground (met from above ${st.capAt} m from it), and it smokes`, !st.none && st.over > 4 && st.over < 7 && st.capAt != null && Math.abs(st.capAt) < .1 && st.smoke, st);
  await page.evaluate(([s, id]) => { const h = WORLD.settle.get(s).houses.find(h => h.id === id); window._H = h; forceTime(12); px = h.exitX; pz = h.exitZ; goToInterior(h); }, [site, id]);
  for (let k = 0; k < 60 && !(await page.evaluate(() => isInterior() && currentHouse === _H)); k++) await page.waitForTimeout(250);
  await g.frames(3);
  const r = await page.evaluate(() => {
    const h = currentHouse, T = h._aurApothecary; if (!T) return { none: true, type: h && h.type };
    const W = h.intW, D = h.intD, X = T.inner.x1, Z = T.inner.z1; interiorScene.updateMatrixWorld(true);
    const meshes = []; let lights = 0, draws = 0, tris = 0, people = 0; const inRig = o => { for (let p = o; p; p = p.parent) if (p === intNPCMesh) return true; return false; };
    interiorScene.traverse(o => { if (o.isLight && !o.isAmbientLight && o.intensity > 0) lights++; if (o.isMesh && o.visible) { if (intNPCMesh && inRig(o)) people++; else if (!o.userData.daylight) { draws++; tris += (o.geometry.index ? o.geometry.index.count : o.geometry.attributes.position.count) / 3; meshes.push(o); } } });
    const rc = new THREE.Raycaster(), O = new THREE.Vector3(), Dv = new THREE.Vector3();
    const hit = (x, y, z, dx, dy, dz, far = 20) => { O.set(x, y, z); Dv.set(dx, dy, dz).normalize(); rc.set(O, Dv); rc.far = far; return rc.intersectObjects(meshes, false)[0] || null; };
    /* walled all round below the sills (0.5 m up; the sills are 1.1): from 0.6 m inside each wall, every 0.8 m along it, the wall within 1.5 m (the door aside) */
    const open = []; for (let x = .4; x < W - .3; x += .8) { if (Math.abs(x - h._exitX) > 1.0 && !hit(x, .5, D - .6, 0, 0, 1, 1.5)) open.push(['front', +x.toFixed(1)]); if (!hit(x, .5, .6, 0, 0, -1, 1.5)) open.push(['back', +x.toFixed(1)]); }
    for (let z = .4; z < D - .3; z += .8) { if (!hit(W - .6, .5, z, 1, 0, 0, 1.5)) open.push(['east', +z.toFixed(1)]); if (!hit(.6, .5, z, -1, 0, 0, 1.5)) open.push(['west', +z.toFixed(1)]); }
    /* the ceiling: straight up from the middle the joists or the slab within 3.5 m */
    const up = hit(W / 2 + .3, 1.8, D / 2, 0, 1, 0, 5), upY = up ? +up.point.y.toFixed(2) : null;
    const az = intArrivalZ(h), arrive = { x: +px.toFixed(2), z: +az.toFixed(2), clear: !intSolidAt(px, az, .3, 0), exits: az > D - h._exitD };
    const walk = pts => { let y = 0, blocked = [], maxStep = 0, [x, z] = pts[0]; for (let i = 1; i < pts.length; i++) { const [x1, z1] = pts[i], n = Math.ceil(Math.hypot(x1 - x, z1 - z) / .05);
        for (let k = 1; k <= n; k++) { const xx = x + (x1 - x) * k / n, zz = z + (z1 - z) * k / n, ny = footholdY(xx, zz, y, 0); maxStep = Math.max(maxStep, Math.abs(ny - y)); y = ny; if (intSolidAt(xx, zz, .2, y)) blocked.push([+xx.toFixed(2), +zz.toFixed(2), +y.toFixed(2)]); } x = x1; z = z1; }
      return { blocked: blocked.length, at: blocked.slice(0, 3), maxStep: +maxStep.toFixed(3) }; };
    const walks = T.paths.map(P => walk(P.map(([x, z]) => [x + X, z + Z])));
    const P = intNPCMesh ? { x: +intNPCPos.x.toFixed(2), z: +intNPCPos.z.toFixed(2) } : null; let talk = null;
    if (P) { const ox = px, oz = pz; px = P.x; pz = T.counter.z1 + Z + .55; jumpY = 0; talk = { reach: keeperInReach(), d: +Math.hypot(px - P.x, pz - P.z).toFixed(2), clear: !intSolidAt(P.x, P.z, .2, 0), behind: P.z < T.counter.z0 + Z && P.x < T.counter.x1 + X, offWalk: T.paths.every(Q => Q.every((q, i) => { if (!i) return true; const [ax, az] = Q[i - 1], [bx, bz] = q, ux = bx - ax, uz = bz - az, L = ux * ux + uz * uz, t = Math.max(0, Math.min(1, ((P.x - X - ax) * ux + (P.z - Z - az) * uz) / L)); return Math.hypot(ax + ux * t - (P.x - X), az + uz * t - (P.z - Z)) > .45; })) }; px = ox; pz = oz; }
    const box = INT_BOX ? { x: +INT_BOX.x.toFixed(2), z: +INT_BOX.z.toFixed(2), kind: INT_BOX.kind, front: !intSolidAt(INT_BOX.x, INT_BOX.z + .7, .25, 0), alone: INT_SOL.filter(q => INT_BOX.x + .26 > q.x0 && INT_BOX.x - .26 < q.x1 && INT_BOX.z + .3 > q.z0 && INT_BOX.z - .3 < q.z1 && q.y0 < .5).length === 1 } : null;
    return { W: +W.toFixed(2), D: +D.toFixed(2), H: h._roomH, scaledBy: T.group.scale.x, open, upY, arrive, walks, P, talk, box, flueRight: T.flue.x0 > 0, lights, draws, people, tris: Math.round(tris) };
  });
  console.log(JSON.stringify({ ...r, walks: r.walks && r.walks.map(w => w.blocked) }));
  check(`the room is the apothecary's shop inside, ${r.W} by ${r.D} m and ${r.H} m to the ceiling, at its true size (scale ${r.scaledBy})`, !r.none && Math.abs(r.W - 6.56) < .05 && Math.abs(r.D - 5.36) < .05 && r.H > 2.4 && r.scaledBy === 1, r);
  if (!r.none) {
    check(`walled all round below the sills, the door aside (${r.open.length} openings)`, r.open.length === 0, r.open.slice(0, 8));
    check(`under the joists: straight up, the ceiling at ${r.upY} m`, r.upY != null && r.upY > 2.4 && r.upY < 3.3, r.upY);
    check(`you arrive clear inside the door at ${r.arrive.x}, ${r.arrive.z} m`, r.arrive.clear && !r.arrive.exits, r.arrive);
    check(`the prototype's three walks (to the counter, round its end to the still, behind it to the jars) on foot, nothing in the way`, r.walks.length === 3 && r.walks.every(w => w.blocked === 0 && w.maxStep <= .1), r.walks);
    check(`the apothecary stands clear behind the counter and off the walks, in reach from the counter's front (${r.talk && r.talk.d} m)`, !!r.talk && r.talk.reach && r.talk.clear && r.talk.behind && r.talk.offWalk, { P: r.P, talk: r.talk });
    check(`the still's flue rises at the back right, over the furnace`, r.flueRight === true, r.flueRight);
    check(`the shop's strongbox stands on its own against the back wall, with clear floor before it`, !!r.box && r.box.kind === 'shop' && r.box.front && r.box.alone, r.box);
    check(`lit (${r.lights} lights); ${r.draws} meshes (45 or fewer) and ${r.tris.toLocaleString()} triangles (30,000 or fewer) besides the apothecary's ${r.people}`, r.lights >= 3 && r.draws <= 45 && r.tris <= 30000 && r.people >= 1, r);
    const pic = path.join(here, '../docs/prototypes/kit-aurapothecary-room.png');
    await page.evaluate(() => { const h = currentHouse; VM_SCENE.visible = false; px = h._exitX + .3; pz = h.intD - .4; jumpY = 0; yaw = .5; pitch = -.1; });
    await g.frames(6); await page.screenshot({ path: pic }); console.log(`  (picture: ${path.relative(path.join(here, '..'), pic)})`);
    await page.evaluate(() => { const h = currentHouse; VM_SCENE.visible = true; px = h._exitX; pz = h.intD - .4; jumpY = 0; yaw = Math.PI; pitch = 0; interact(); });
    for (let k = 0; k < 40 && (await page.evaluate(() => isInterior())); k++) await page.waitForTimeout(250);
    check(`at the door E takes you out`, !(await page.evaluate(() => isInterior())));
  }
}
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
