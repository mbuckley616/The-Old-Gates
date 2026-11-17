// A Markish shop on a tight lot, inside, on the new look (Session 2327; card F9, Michael's A on #1653: as drawn, each trade with its own
// piece; rooms.js's markTownRoom with o.trade, Session 2305; OG-043, OG-115). A goods shop, armourer, barber, healer or weaponsmith whose lot
// stands as the town house (lot.kit.kind 'marktown', S2003) opens on the town house's two floors with the stue as the trade's floor: the
// shelf of stock, the keeper's walk and the counter along the wall away from the stair, the strongbox at the walk's dead end, the trade's
// piece on the free floor, the loft above. In the first Markish town that has one, each of the five trades (a lot of another trade opened
// as it for the visit, then put back): the shop is drawn; you arrive clear, facing where you buy; the shop's two walks on foot; the keeper
// in his walk behind the counter, in reach from its front, the strongbox and the counter's front before him (a witness); the strongbox the
// shop's, clear before its lid; the trade's piece; the barber's chair to sit in; the stair still climbs to the loft; lit, within the draws;
// out by the door. A picture from inside the door, one a trade.
import { boot, check } from './lib/game.mjs';
import path from 'path'; import { fileURLToPath } from 'url';
const here = path.dirname(fileURLToPath(import.meta.url));
const TR = ['misc', 'armor', 'barber', 'potion', 'weapon'], WORD = { misc: 'goods shop', armor: 'armourer', barber: 'barber', potion: 'healer', weapon: 'weaponsmith' };
const PIECE = { misc: 'rack', armor: 'stand', barber: 'chair', potion: 'rack', weapon: 'rack' };
const towns = () => { anchoredPlaces(); return [...CELLS.values()].filter(c => c.type !== 'sea' && nationKeyOf(c.i, c.j) === 'mark').flatMap(c => c.sites).filter(s => ['port', 'city', 'town'].includes(s.kind)).slice(0, 4).map(s => s.id); };

const g = await boot({ look: 'new' }); const { page } = g; await g.intoWorld();
let site = null, lots = [];
for (const s of await page.evaluate(towns)) { if (!(await g.settle(s))) continue;
  lots = await page.evaluate(s => WORLD.settle.get(s).houses.filter(h => h.siteId === s && h.kit && h.kit.kind === 'marktown' && ['misc', 'armor', 'barber', 'potion', 'weapon'].includes(h.type)).map(h => ({ id: h.id, type: h.type, w: h.kit.o.w, d: h.kit.o.d, chimney: !!h.kit.o.chimney, kit: kitMarkTownRoom(h) })), s);
  if (lots.length) { site = s; break; } }
check(`a Markish town has shops standing as the town house, each its shop inside (${site}: ${lots.map(l => `${l.id} ${WORD[l.type]} ${l.w} by ${l.d}${l.chimney ? ', a stack' : ''}`).join('; ')})`, lots.length > 0 && lots.every(l => l.kit), lots);

const visit = async (t, lot) => {
  const as = lot.type !== t, tag = `${WORD[t]}${as ? ` (${lot.id}, a ${WORD[lot.type]}’s lot)` : ` (${lot.id})`}`;
  await page.evaluate(([s, id, t]) => { const h = WORLD.settle.get(s).houses.find(h => h.id === id); h._was = h.type; h.type = t; delete h._mtShop; window._H = h; forceTime(12); px = h.exitX; pz = h.exitZ; goToInterior(h); }, [site, lot.id, t]);
  for (let k = 0; k < 60 && !(await page.evaluate(() => isInterior() && currentHouse === _H)); k++) await page.waitForTimeout(250);
  await g.frames(3);
  const r = await page.evaluate(() => {
    const h = currentHouse, T = h._markTown, S = T && T.shop; if (!S) return { none: true };
    const X = T.inner.x1, Z = T.inner.z1, FY = T.floors[0], F1 = T.floors[1] - FY, rx = x => x + X, rz = z => z + Z; interiorScene.updateMatrixWorld(true);
    let lights = 0, draws = 0, tris = 0, people = 0; const inRig = o => { for (let p = o; p; p = p.parent) if (p === intNPCMesh) return true; return false; };
    interiorScene.traverse(o => { if (o.isLight && !o.isAmbientLight && o.intensity > 0) lights++; if (o.isMesh && o.visible) { if (intNPCMesh && inRig(o)) people++; else if (!o.userData.daylight) { draws++; tris += (o.geometry.index ? o.geometry.index.count : o.geometry.attributes.position.count) / 3; } } });
    const ax = intArriveX(h), az = intArrivalZ(h), fyaw = Math.atan2(-(rx(S.front[0]) - ax), -(rz(S.front[1]) - az));
    const arrive = { x: +ax.toFixed(2), z: +az.toFixed(2), clear: !intSolidAt(ax, az, .3, 0), exits: az > h.intD - h._exitD, yaw: h._arriveYaw, faces: h._arriveYaw != null && Math.abs(Math.atan2(Math.sin(h._arriveYaw - fyaw), Math.cos(h._arriveYaw - fyaw))) < .05 };
    /* the shop's two walks, every 5 cm, a 0.2 m body on its floor; each stops 5 cm short of its end (the counter's front, the keeper) */
    const walk = P => { const Q = P.map(([x, z]) => [rx(x), rz(z)]), [a, b] = [Q[Q.length - 2], Q[Q.length - 1]], L = Math.hypot(b[0] - a[0], b[1] - a[1]); Q[Q.length - 1] = [b[0] - (b[0] - a[0]) / L * .05, b[1] - (b[1] - a[1]) / L * .05];
      let y = 0, blocked = [], maxStep = 0, [x, z] = Q[0]; for (let i = 1; i < Q.length; i++) { const [x1, z1] = Q[i], n = Math.ceil(Math.hypot(x1 - x, z1 - z) / .05);
        for (let k = 1; k <= n; k++) { const xx = x + (x1 - x) * k / n, zz = z + (z1 - z) * k / n; if (zz > h.intD - .35) continue; const ny = footholdY(xx, zz, y, 0); maxStep = Math.max(maxStep, Math.abs(ny - y)); y = ny; if (intSolidAt(xx, zz, .2, y)) blocked.push([+xx.toFixed(2), +zz.toFixed(2)]); } x = x1; z = z1; }
      return { blocked: blocked.length, at: blocked.slice(0, 3), maxStep: +maxStep.toFixed(3) }; };
    const walks = S.walks.map(walk);
    const P = intNPCMesh ? { x: +intNPCPos.x.toFixed(2), z: +intNPCPos.z.toFixed(2) } : null; let talk = null;
    if (P) { const ox = px, oz = pz, C = S.counter, cx = rx((C.x0 + C.x1) / 2); px = rx(S.front[0]); pz = rz(S.front[1]); jumpY = 0;
      talk = { reach: keeperInReach(), d: +Math.hypot(px - P.x, pz - P.z).toFixed(2), clear: !intSolidAt(P.x, P.z, .2, 0), behind: Math.sign(cx - P.x) === Math.sign(px - P.x) && Math.abs(cx - P.x) < Math.abs(px - P.x) };
      const f = [Math.sin(intNPCMesh.rotation.y), Math.cos(intNPCMesh.rotation.y)], deg = (x, z) => { const dx = x - P.x, dz = z - P.z; return Math.round(Math.acos((dx * f[0] + dz * f[1]) / Math.hypot(dx, dz)) * 180 / Math.PI); };
      talk.sees = { box: INT_BOX ? deg(INT_BOX.x, INT_BOX.z) : null, front: deg(px, pz) }; px = ox; pz = oz; }
    /* the strongbox: the shop's, and the keeper's walk clear before its lid (0.45 m toward him) */
    const box = INT_BOX ? (() => { const s = P ? Math.sign(P.z - INT_BOX.z) : 0; return { kind: INT_BOX.kind, front: s !== 0 && !intSolidAt(INT_BOX.x, INT_BOX.z + s * .5, .2, 0) }; })() : null;
    const piece = S[{ misc: 'rack', armor: 'stand', barber: 'chair', potion: 'rack', weapon: 'rack' }[S.trade]], chair = INT_CHAIR ? { x: +INT_CHAIR.x.toFixed(2), z: +INT_CHAIR.z.toFixed(2) } : null;
    /* the climb: from the stair's foot up its middle to the landing, each rise no more than STEP_UP */
    const st = T.stair, sx = rx((st.x0 + st.x1) / 2); let y = 0, maxRise = 0; for (let z = rz(st.z1 + .45); z >= rz(T.inner.z0 + .3); z -= .04) { const y2 = footholdY(sx, z, y, 0); maxRise = Math.max(maxRise, y2 - y); y = y2; }
    return { trade: S.trade, W: +h.intW.toFixed(2), D: +h.intD.toFixed(2), L: +Math.abs(S.counter.z1 - S.counter.z0).toFixed(2), arrive, walks, P, talk, box, piece: !!piece, crate: !!S.crate, chair,
      climb: { top: +y.toFixed(2), F1: +F1.toFixed(2), maxRise: +maxRise.toFixed(3) }, lights, draws, people, tris: Math.round(tris), bed: INT_BEDS.length };
  });
  console.log(JSON.stringify({ ...r, walks: r.walks && r.walks.map(w => w.at) }));
  check(`${tag}: the shop is drawn on the stue (${r.W} by ${r.D} m, the counter ${r.L} m)`, !r.none && r.trade === t && r.L >= 1.0 - 1e-6 && r.L <= 1.8 + 1e-6, r);
  if (!r.none) {
    check(`${tag}: you arrive clear inside the door at ${r.arrive.x}, ${r.arrive.z} m, facing where you buy`, r.arrive.clear && !r.arrive.exits && r.arrive.faces, r.arrive);
    check(`${tag}: the shop's two walks (to the counter's front, into the keeper's walk) on foot, nothing in the way`, r.walks.length === 2 && r.walks.every(w => w.blocked === 0 && w.maxStep <= .1), r.walks);
    check(`${tag}: the keeper stands clear in his walk behind the counter, in reach from its front (${r.talk && r.talk.d} m), the strongbox ${r.talk && r.talk.sees.box}° and the counter's front ${r.talk && r.talk.sees.front}° off his face`, !!r.talk && r.talk.reach && r.talk.clear && r.talk.behind && r.talk.sees.box <= 60 && r.talk.sees.front <= 60, { P: r.P, talk: r.talk });
    check(`${tag}: the strongbox is the shop's, clear before its lid; the loft's bed is not slept in by the keeper (${r.bed} beds)`, !!r.box && r.box.kind === 'shop' && r.box.front && r.bed === 0, r.box);
    check(`${tag}: the trade's own piece on the floor${t === 'barber' ? `, the chair one to sit in (${JSON.stringify(r.chair)})` : ''}`, r.piece && (t !== 'barber' || !!r.chair), r);
    check(`${tag}: the stair still climbs to the loft (${r.climb.top} of ${r.climb.F1} m, rises of ${r.climb.maxRise} m at most)`, Math.abs(r.climb.top - r.climb.F1) < .05 && r.climb.maxRise <= .45, r.climb);
    check(`${tag}: lit (${r.lights} lights); ${r.draws} meshes (45 or fewer) and ${r.tris.toLocaleString()} triangles (20,000 or fewer) besides the keeper's ${r.people}`, r.lights >= 2 && r.draws <= 45 && r.tris <= 20000 && r.people >= 1, r);
    const pic = path.join(here, `../docs/prototypes/kit-marktownshop-${t}.png`);
    await page.evaluate(() => { const h = currentHouse; VM_SCENE.visible = false; px = intArriveX(h); pz = intArrivalZ(h); jumpY = 0; yaw = h._arriveYaw; pitch = -.12; });
    await g.frames(6); await page.screenshot({ path: pic }); console.log(`  (picture: ${path.relative(path.join(here, '..'), pic)})`);
    await page.evaluate(() => { const h = currentHouse; VM_SCENE.visible = true; px = h._exitX; pz = h.intD - .4; jumpY = 0; yaw = Math.PI; pitch = 0; interact(); });
    for (let k = 0; k < 40 && (await page.evaluate(() => isInterior())); k++) await page.waitForTimeout(250);
    check(`${tag}: at the door E takes you out`, !(await page.evaluate(() => isInterior())));
  } else await page.evaluate(() => exitInterior());
  await page.evaluate(() => { const h = window._H; h.type = h._was; delete h._was; delete h._mtShop; });
};
if (lots.length) for (const t of TR) await visit(t, lots.find(l => l.type === t) || lots[0]);
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
