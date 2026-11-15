// A Gatelands town's shop inside the merchant's house on the new look (Session 2272; card F9, Michael's A on DECISION #1574: the
// merchant's house as drawn, in every Gatelands town). On ?look=new a town's armourer, apothecary, goods shop and barber stand in the
// street as the kit's merchant's house (3 to 5 bays, 6.75 to 8 m deep); inside it is PKIT.gl.townhouse with o.merchant (rooms.js's
// Session 2240): the shop across the front, the counter along the west side, the keeper's walk and the stock on the gable behind it, the
// townhouse's hall, stair, kitchen and family rooms behind and above. In Dunmore, one shop of each trade: the kit's room builds to the
// prototype's triangles and draws, the same twice; the room is the house's inside, walled all round on all three floors; you arrive clear
// at the shop door, outside its reach; the keeper stands clear behind the counter, within talking reach of its front, and sees you at his
// strongbox; the strongbox has a side clear to open it from; the stair climbs both storeys; the prototype's seven walks are clear; the
// doors are hung; the barber's chair is the one you sit in; the fires and lamps light it; E at the arrival spot keeps you in; a picture.
import { boot, check } from './lib/game.mjs';
import path from 'path'; import { fileURLToPath } from 'url';
const here = path.dirname(fileURLToPath(import.meta.url));
// the prototype's counts (rooms.check.mjs, Session 2240: 10.3k to 17.2k triangles in 19 to 20 meshes over its nine merchant keys)
const PROTO = { min: 10000, max: 17500, draws: [19, 20] };
const TRADES = ['potion', 'armor', 'misc', 'barber'];

const g = await boot({ look: 'new' }); const { page } = g; await g.intoWorld();
check('Dunmore stands on the new look', await g.settle('dunmore'));
const K = await page.evaluate(T => { const hash = b => { let h = 0; b.traverse(m => { if (!m.isMesh) return; const a = m.geometry.attributes.position.array; for (let i = 0; i < a.length; i += 3) h = (h * 31 + Math.round(a[i] * 1e4)) | 0; }); return h; };
  const out = {}; for (const t of T) for (const [n, d] of [[3, 8], [5, 6.75]]) { const o = { merchant: t, bays: n, d }, A = PKIT.gl.townhouse(o, PKIT.stream('a')), B = PKIT.gl.townhouse(o, PKIT.stream('a')); out[`${t} ${n}x${d}`] = { tris: A.tris, draws: A.draws, same: hash(A.group) === hash(B.group), shop: !!A.shop }; }
  return out; }, TRADES);
check(`the kit's merchant's room builds as the prototype's (${Object.entries(K).map(([k, v]) => `${k}: ${v.tris.toLocaleString()} in ${v.draws}`).join(', ')}), the same twice`, Object.values(K).every(v => v.tris >= PROTO.min && v.tris <= PROTO.max && PROTO.draws.includes(v.draws) && v.same && v.shop), K);
const shops = await page.evaluate(T => WORLD.settle.get('dunmore').houses.filter(h => h.siteId === 'dunmore' && T.includes(h.type) && !h.shuttered).map(h => ({ id: h.id, name: h.name, type: h.type, kind: h.kit && h.kit.kind, kit: kitMerchant(h), bays: h.kit && h.kit.bays, d: h.d, door: h.kit && h.kit.door })), TRADES);
const inMerchant = shops.filter(h => h.kind === 'merchant');
check(`Dunmore's shops in a merchant's house open on its room (${inMerchant.filter(h => h.kit).length} of ${inMerchant.length})`, inMerchant.length >= 3 && inMerchant.every(h => h.kit), shops);
const picks = TRADES.map(t => inMerchant.find(h => h.type === t && h.kit)).filter(Boolean);
check(`one shop of each trade to walk (${picks.map(h => `${h.type}: ${h.name}, ${h.bays} bays by ${h.d} m`).join('; ')})`, picks.length >= 3, picks);

for (const H of picks) { const tag = `${H.type}, ${H.bays} bays`; console.log(`  -- ${H.id}: ${H.name}, ${tag}, ${H.d} m deep`);
  await page.evaluate(id => { forceTime(12); const h = WORLD.settle.get('dunmore').houses.find(x => x.id === id); px = h.exitX; pz = h.exitZ; goToInterior(h); }, H.id);
  for (let k = 0; k < 40 && !(await page.evaluate(() => isInterior())); k++) await page.waitForTimeout(250);
  await g.frames(2);
  const r = await page.evaluate(() => {
    const h = currentHouse, T = h._merchant, s = h._mirror, W = h._roomW, D = h._roomD, X = T.inner.x1, Z = T.inner.z1, rx = x => X + s * x, rz = z => z + Z, F = T.floors.map(y => +(y - T.floors[0]).toFixed(3)), S = T.shop; interiorScene.updateMatrixWorld(true);
    const meshes = []; let lights = 0, draws = 0, tris = 0; const inNpc = o => { for (let p = o; p; p = p.parent) if (p === intNPCMesh) return true; return false; };
    interiorScene.traverse(o => { if (o.isLight && !o.isAmbientLight && o.intensity > 0) lights++; if (o.isMesh && o.visible && !inNpc(o)) { draws++; tris += (o.geometry.index ? o.geometry.index.count : o.geometry.attributes.position.count) / 3; if (!o.isSkinnedMesh && !o.userData.daylight) meshes.push(o); } });
    const rc = new THREE.Raycaster(), O = new THREE.Vector3(), Dv = new THREE.Vector3();
    const hit = (x, y, z, dx, dy, dz, far = 14) => { O.set(x, y, z); Dv.set(dx, dy, dz).normalize(); rc.set(O, Dv); rc.far = far; const q = rc.intersectObjects(meshes, false)[0]; return q ? +q.distance.toFixed(3) : null; };
    const holes = [...T.windows.map(q => ({ f: q.face, x: rx(q.x), y0: q.y - T.floors[0], y1: q.y + q.h - T.floors[0], w: q.w })), { f: 'front', x: rx(T.door.x), y0: 0, y1: T.door.h, w: T.door.w }, { f: 'back', x: rx(T.back.x), y0: 0, y1: T.back.h, w: T.back.w }];
    const inHole = (f, x, y) => holes.some(o => o.f === f && Math.abs(x - o.x) < o.w / 2 + .1 && y > o.y0 - .1 && y < o.y1 + .1);
    const open = []; for (const f of F) for (const y of [f + .6, f + 2.0]) { for (let x = .4; x < W - .3; x += .5) { if (!inHole('front', x, y) && hit(x, y, D / 2, 0, 0, 1, D) == null) open.push(['S', x, y]); if (!inHole('back', x, y) && hit(x, y, D / 2, 0, 0, -1, D) == null) open.push(['N', x, y]); }
      for (let z = .4; z < D - .3; z += .5) { if (hit(W / 2, y, z, 1, 0, 0, W) == null) open.push(['E', z, y]); if (hit(W / 2, y, z, -1, 0, 0, W) == null) open.push(['W', z, y]); } }
    const ax = intArriveX(h), az = intArrivalZ(h), exitZ = D - h._exitD, arrive = { x: +ax.toFixed(2), z: +az.toFixed(2), offDoor: +Math.abs(ax - rx(T.door.x)).toFixed(2), clear: !intSolidAt(ax, az, .3, 0), exits: az > exitZ };
    // the keeper behind the counter: the counter lies between him and the shop, he stands clear, and its front is within talking reach
    const cx0 = Math.min(rx(S.counter.x0), rx(S.counter.x1)), cx1 = Math.max(rx(S.counter.x0), rx(S.counter.x1)), fx = rx(S.front[0]), fz = rz(S.front[1]);
    const keeper = intNPCMesh ? { x: +intNPCPos.x.toFixed(2), z: +intNPCPos.z.toFixed(2), clear: !intSolidAt(intNPCPos.x, intNPCPos.z, .2, 0), behind: s > 0 ? intNPCPos.x < cx0 : intNPCPos.x > cx1, reach: +Math.hypot(fx - intNPCPos.x, fz - intNPCPos.z).toFixed(2), frontClear: !intSolidAt(fx, fz, .25, 0) } : null;
    // the shop's strongbox: a side clear to open it from, and from that side the keeper sees you
    const box = INT_BOX, sides = box ? [[0, .62], [0, -.62], [.7, 0], [-.7, 0]].filter(([dx, dz]) => { const x = box.x + dx, z = box.z + dz; return x > .3 && x < W - .3 && z > .3 && z < D - .3 && !intSolidAt(x, z, .25, 0); }) : [];
    let seen = 0; if (box) { const was = [px, pz, jumpY]; for (const [dx, dz] of sides) { px = box.x + dx; pz = box.z + dz; jumpY = 0; if (witnessOf(h)) seen++; } [px, pz, jumpY] = was; }
    const chest = box ? { kind: box.kind, type: box.type, sides: sides.length, seen } : null;
    // the barber's chair is the chair you sit in: nearBarberChair answers from in front of it, facing it
    let chair = null; if (h.type === 'barber') { chair = INT_CHAIR ? { x: +INT_CHAIR.x.toFixed(2), z: +INT_CHAIR.z.toFixed(2) } : null; if (chair) { const was = [px, pz, jumpY, yaw, pitch]; let near = false;
      for (const [dx, dz] of [[0, .9], [.9, 0], [-.9, 0], [0, -.9]]) { px = INT_CHAIR.x + dx; pz = INT_CHAIR.z + dz; jumpY = 0; if (intSolidAt(px, pz, .25, 0)) continue; yaw = Math.atan2(dx, dz); pitch = -.5; CAM.position.set(px, 1.6, pz); CAM.rotation.set(pitch, yaw, 0, 'YXZ'); CAM.updateMatrixWorld(true); if (nearBarberChair()) { near = true; break; } }
      [px, pz, jumpY, yaw, pitch] = was; chair.near = near; } }
    const doorSol = new Set(INT_DOORS.map(d => d.sol)), keep = INT_SOL; INT_SOL = keep.filter(b => !doorSol.has(b));
    const fxs = f => { const q = T.steps.find(t => t.flight === f), a = rx(q.x0), b = rx(q.x1); return (a + b) / 2; }, WZ = rz(T.well.z1), LZ = rz(T.landings[0].z1), xa = fxs('A'), xb = fxs('B');
    const legs = [[[xa, WZ + .45], [xa, LZ - .35]], [[xa, LZ - .35], [xb, LZ - .35]], [[xb, LZ - .35], [xb, WZ + .45]]];
    let y = 0; const climb = []; for (let fl = 0; fl < 2; fl++) { let maxStep = 0, blocked = 0, minHead = 99;
      for (const [[x0, z0], [x1, z1]] of legs) { const n = Math.ceil(Math.hypot(x1 - x0, z1 - z0) / .04); for (let k = 0; k <= n; k++) { const x = x0 + (x1 - x0) * k / n, z = z0 + (z1 - z0) * k / n;
        if (intSolidAt(x, z, .25, y)) blocked++; const ny = footholdY(x, z, y, 0); maxStep = Math.max(maxStep, ny - y); y = ny; minHead = Math.min(minHead, headCeil(x, z, y) - y); } }
      climb.push({ top: +y.toFixed(3), want: F[fl + 1], maxStep: +maxStep.toFixed(3), blocked, minHead: +minHead.toFixed(2) }); }
    const walks = T.paths.map(P => { let blocked = [], off = 0; for (let i = 0; i + 1 < P.pts.length; i++) { const [a, b] = [P.pts[i], P.pts[i + 1]], n = Math.ceil(Math.hypot(b[0] - a[0], b[1] - a[1]) / .1);
      for (let k = 0; k <= n; k++) { const x = rx(a[0] + (b[0] - a[0]) * k / n), z = rz(a[1] + (b[1] - a[1]) * k / n); if (intSolidAt(x, z, .15, F[P.fl])) blocked.push([+x.toFixed(2), +z.toFixed(2)]); if (Math.abs(footholdY(x, z, F[P.fl], 0) - F[P.fl]) > .02) off++; } }
      return { fl: P.fl, blocked: blocked.length, at: blocked.slice(0, 3), off }; });
    INT_SOL = keep;
    const doors = INT_DOORS.map(d => ({ y: +d.y.toFixed(2), h: +d.h.toFixed(2) }));
    const fire = interiorScene.children.find(c => c.userData && c.userData.hearthFire);
    return { W, D, s, scale: Math.abs(T.group.scale.x), bays: T.bays, merchant: T.merchant, want: [+(h.kit.bays * 1.95 + .6 - .9).toFixed(3), +(h.d - .9).toFixed(3)], open, arrive, exitZ: +exitZ.toFixed(2), keeper, chest, chair, climb, walks, doors, upOK: T.upOK, lights, draws, tris: Math.round(tris),
      fireOn: !!fire && fire.userData.hearthFire.visible && fire.userData.hearthLights.every(l => l.intensity > 0) };
  });
  check(`[${tag}] the room is the ${r.merchant}'s shop and the house's inside, ${r.W} by ${r.D} m (${r.want.join(' by ')}), at its true size (scale ${r.scale})`, r.merchant === H.type && r.bays === H.bays && Math.abs(r.W - r.want[0]) < .01 && Math.abs(r.D - r.want[1]) < .01 && r.scale === 1, r);
  check(`[${tag}] walled all round on all three floors (${r.open.length} openings at 0.6 or 2 m over a floor)`, r.open.length === 0, r.open.slice(0, 8));
  check(`[${tag}] you arrive clear at ${r.arrive.x}, ${r.arrive.z} m, ${r.arrive.offDoor} m off the shop door's line, outside its reach (from ${r.exitZ} m)`, r.arrive.offDoor <= .95 && r.arrive.clear && !r.arrive.exits, r.arrive);
  check(`[${tag}] the keeper stands clear behind the counter at ${r.keeper && [r.keeper.x, r.keeper.z].join(', ')}, ${r.keeper && r.keeper.reach} m from its front (within 2.2)`, !!r.keeper && r.keeper.clear && r.keeper.behind && r.keeper.reach < 2.2 && r.keeper.frontClear, r.keeper);
  check(`[${tag}] the shop's strongbox has ${r.chest && r.chest.sides} sides clear to open it from, and the keeper sees you at ${r.chest && r.chest.seen} of them`, !!r.chest && r.chest.kind === 'shop' && r.chest.type === H.type && r.chest.sides >= 1 && r.chest.seen === r.chest.sides, r.chest);
  if (H.type === 'barber') check(`[${tag}] the barber's chair at ${r.chair && [r.chair.x, r.chair.z].join(', ')} is the one you sit in`, !!r.chair && r.chair.near, r.chair);
  for (const [i, c] of r.climb.entries()) check(`[${tag}] the stair climbs to the ${i ? 'second' : 'first'} floor at ${c.top} m in steps of ${c.maxStep} m or less, nothing in the way, ${c.minHead} m over the head`, Math.abs(c.top - c.want) < .01 && c.maxStep <= .4 && c.blocked === 0 && c.minHead >= 1.8, c);
  check(`[${tag}] the seven walks are clear on their floors (${r.walks.map(w => w.blocked).join(', ')} points in something)`, r.walks.length === 7 && r.walks.every(w => w.blocked === 0 && w.off === 0), r.walks);
  check(`[${tag}] ${r.doors.length} doors hung (${r.doors.map(d => d.y).join(', ')} m up), each ${[...new Set(r.doors.map(d => d.h))].join(' or ')} m high`, r.doors.length === (r.upOK ? 6 : 5) && r.doors.every(d => d.h > 1.95 && d.h < 2.1), r.doors);
  check(`[${tag}] lit by the three fires and the lamps (${r.lights} lights, 12 or fewer), ${r.draws} draws (60 or fewer), ${r.tris.toLocaleString()} triangles`, r.fireOn && r.lights >= 7 && r.lights <= 12 && r.draws <= 60, r);
  await page.evaluate(() => { const h = currentHouse; px = intArriveX(h); pz = intArrivalZ(h); jumpY = 0; interact(); });
  await g.frames(30);
  check(`[${tag}] at the arrival spot E does not take you out`, await page.evaluate(() => isInterior()));
  if (H === picks[0]) { await page.evaluate(() => { const h = currentHouse; try { closeDialog(); } catch (e) {} VM_SCENE.visible = false; px = intArriveX(h); pz = intArrivalZ(h); jumpY = 0; yaw = h._arriveYaw; pitch = -.1; });
    await g.frames(6); await page.screenshot({ path: path.join(here, '../docs/prototypes/kit-merchant-shop.png') }); console.log('  (picture: docs/prototypes/kit-merchant-shop.png)'); }
  await page.evaluate(() => { try { closeDialog(); } catch (e) {} exitInterior(); });
  for (let k = 0; k < 40 && (await page.evaluate(() => isInterior())); k++) await page.waitForTimeout(250);
  await page.waitForTimeout(1500);
}
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
