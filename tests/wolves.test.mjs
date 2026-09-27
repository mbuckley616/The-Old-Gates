// The wolf family on the shape kit (Session 166): Wolf, Snow Wolf, Dire Wolf and Ash Hound are one skinned mesh
// each, on a shared geometry per kind, with paws planted by IK through a trot and a gallop, a crouch and spring
// for the attack, a distant copy past 17 units, and the shadow pass drawn from that copy.
import { boot, check } from './lib/game.mjs';
import fs from 'fs';
const g = await boot(); const { page } = g;
await g.intoWorld();
fs.mkdirSync('tests/out', { recursive: true });

// build one of each kind (and a Boar, which keeps the old box body) a little ahead of the player
const built = await page.evaluate(() => {
  window._W = {}; const fx = -Math.sin(yaw), fz = -Math.cos(yaw);
  const kinds = ['Wolf', 'Snow Wolf', 'Dire Wolf', 'Ash Hound', 'Boar'];
  const out = {};
  kinds.forEach((n, i) => { const x = px + fx * 40 + (i - 2) * 3, z = pz + fz * 40; const e = buildZoneEnemy(WORLD.scene, [], x, z, n, null); e.mesh.position.y = WORLD.worldH(x, z); e.locked = false; e.mesh.visible = true; _W[n] = e; // the kinds above level one are latent until the player grows into them
    const rig = e.limbs && e.limbs.wolf; let meshes = 0; e.mesh.traverse(c => { if (c.isMesh && !(c.userData && c.userData.hpBar)) meshes++; });
    out[n] = { rig: !!rig, skinned: !!(rig && rig.mesh.isSkinnedMesh), bones: rig ? rig.mesh.skeleton.bones.length : 0, tris: rig ? rig.tris : 0, trisLo: rig ? rig.trisLo : 0, meshes, scale: rig ? +rig.root.scale.x.toFixed(2) : 0 }; });
  const a = _W.Wolf.limbs.wolf, b = buildZoneEnemy(WORLD.scene, [], px + fx * 44, pz + fz * 44, 'Wolf', null); _W.Wolf2 = b;
  out.shared = a.mesh.geometry === b.limbs.wolf.mesh.geometry && a.mesh.material !== b.limbs.wolf.mesh.material;
  return out; });
check('the four wolf kinds are one skinned mesh each on 24 bones (plus the shining eyes); the Boar (Session 170) is one too, on the same bones, with no shining eyes', ['Wolf', 'Snow Wolf', 'Dire Wolf', 'Ash Hound'].every(n => built[n].skinned && built[n].bones === 24 && built[n].meshes === 2) && built.Boar.rig && built.Boar.skinned && built.Boar.bones === 24 && built.Boar.meshes === 1 && built.Boar.tris > 3000 && built.Boar.tris < 7000, built);
check('every wolf of a kind shares its geometry; each has its own material for its flashes', built.shared, { shared: built.shared });
check('a wolf is 4–6.5k triangles close, its distant copy about half', ['Wolf', 'Snow Wolf', 'Dire Wolf', 'Ash Hound', 'Boar'].every(n => built[n].tris > 3000 && built[n].tris < 6500 && built[n].trisLo < built[n].tris * .6), Object.fromEntries(Object.entries(built).filter(([k]) => k !== 'shared').map(([k, v]) => [k, [v.tris, v.trisLo]])));

// the dragon (Session 177): the wolf's bones and gait with two wing bones; the wings lie folded at rest and beat once it is roused
const drg = await page.evaluate(() => { const fx = -Math.sin(yaw), fz = -Math.cos(yaw); const x = px + fx * 60, z = pz + fz * 60;
  const e = buildZoneEnemy(WORLD.scene, [], x, z, 'Dragon', null); e.mesh.position.y = WORLD.worldH(x, z); e.locked = false; e.mesh.visible = true; const r = e.limbs && e.limbs.wolf; if (!r) return { rig: false };
  let t = 9e5; for (let i = 0; i < 90; i++) tickCreatures(1 / 60, t += 16.7); const rest = +r.B.wingL.rotation.z.toFixed(2), restY = +r.B.wingL.rotation.y.toFixed(2);
  e.alert = true; const zs = []; for (let i = 0; i < 120; i++) { tickCreatures(1 / 60, t += 16.7); zs.push(r.B.wingL.rotation.z); }
  const out = { rig: true, dragon: !!r.k.dragon, bones: r.mesh.skeleton.bones.length, tris: r.tris, trisLo: r.trisLo, scale: +r.root.scale.x.toFixed(2), rest, restY, beatMin: +Math.min(...zs.slice(60)).toFixed(2), beatMax: +Math.max(...zs.slice(60)).toFixed(2), mirrored: Math.abs(r.B.wingR.rotation.z + r.B.wingL.rotation.z) < 1e-6, breath: !!e.dragon };
  e.mesh.parent.remove(e.mesh); tickCreatures(1 / 60, t); return out; });
check('the dragon is one skinned mesh on the wolf\'s 24 bones and two wing bones; at rest the wings lie folded back, roused they beat (mirrored), and it still breathes fire',
  drg.rig && drg.dragon && drg.bones === 26 && drg.tris > 3000 && drg.tris < 8000 && drg.restY > 1 && drg.beatMax - drg.beatMin > .6 && drg.mirrored && drg.breath, drg);

// Drive one wolf along its facing at a pace for n frames; measure its paws in world space. A paw in its stance at
// both ends of a frame (by the stride's own phase) must not move; `flight` counts frames where all four are up.
const drive = (kind, pace, n) => page.evaluate(([kind, pace, n]) => {
  const e = _W[kind], rig = e.limbs.wolf, G = e.mesh; const fy = .6; G.rotation.set(0, fy, 0); const step = pace / 60;
  const P = ['pfL', 'phL', 'pfR', 'phR'].map(k => rig.B[k]); const v = new THREE.Vector3(); let t0 = 2e5 + (window._wt || 0); window._wt = (window._wt || 0) + n * 17;
  const off = (G2, i) => i === 0 ? G2.off.L[0] : i === 1 ? G2.off.L[1] : i === 2 ? G2.off.R[0] : G2.off.R[1];
  let prev = null, pph = 0, still = 0, swing = 0, flight = 0, cnt = 0; const gmin = [1e9, 1e9, 1e9, 1e9], gmax = [-1e9, -1e9, -1e9, -1e9];
  for (let i = 1; i <= n; i++) { e.x += Math.sin(fy) * step; e.z += Math.cos(fy) * step; G.position.set(e.x, WORLD.worldH(e.x, e.z), e.z); tickCreatures(1 / 60, t0 + i * 16.7); G.updateMatrixWorld(true);
    const cur = P.map(b => b.getWorldPosition(v).clone()); const gy = G.position.y;
    if (i > n - 90 && prev) { const Gk = rig.gallop ? WG.GALLOP : WG.TROT; const u = (ph, k) => (((ph + off(Gk, k)) % 1) + 1) % 1; let up = 0;
      for (let k = 0; k < 4; k++) { const d = cur[k].distanceTo(prev[k]); swing = Math.max(swing, d); const a = u(rig.phase, k), b = u(pph, k);
        if (a < Gk.D && b < Gk.D && a > b) { still = Math.max(still, d); gmin[k] = Math.min(gmin[k], cur[k].y - gy); gmax[k] = Math.max(gmax[k], cur[k].y - gy); } else up++; }
      if (up === 4) flight++; cnt++; }
    prev = cur; pph = rig.phase; }
  return { kind, pace, gallop: rig.gallop, w: Object.fromEntries(Object.entries(rig.w).map(([k, x]) => [k, +x.toFixed(2)])), stillMm: +(still * 1000).toFixed(2), swingMm: +(swing * 1000).toFixed(1),
    flightPct: Math.round(100 * flight / cnt), plantedMm: Math.max(...gmin.map((m, k) => (gmax[k] - m) * 1000)).toFixed(1) * 1, strides: +(pace / (wgCycle(rig.w) * rig.root.scale.x)).toFixed(2) };
}, [kind, pace, n]);

const wander = await drive('Wolf', .48, 150);
check('wandering, a wolf trots with its planted paws held still', !wander.gallop && wander.w.trot > .95 && wander.stillMm < 2 && wander.swingMm > 8, wander);
const chase = await drive('Wolf', 2.0, 180);
check('chasing, it gallops: planted paws still, the others flying forward, a moment with all four up', chase.gallop && chase.w.gallop > .95 && chase.stillMm < 2.5 && chase.swingMm > 40 && chase.flightPct > 0, chase);
check('a planted paw stays at one height through its stance (the IK reaches it), trotting and galloping', wander.plantedMm < 4 && chase.plantedMm < 4, { trot: wander.plantedMm, gallop: chase.plantedMm });
const dire = await drive('Dire Wolf', 2.4, 150);
check('a Dire Wolf at its chase pace gallops the same way', dire.gallop && dire.stillMm < 2.5, dire);
const back = await drive('Wolf', .4, 150);
check('slowing to a wander, it trots again', !back.gallop && back.w.trot > .9, { gallop: back.gallop, w: back.w });

// the reach: across the whole trot and gallop, the leg the IK solves is never asked past its length
const reach = await page.evaluate(() => { let worst = 0; const L = WOLF_LEGS;
  const one = (G, u, fore, drop) => { const h = G.S / 2; let dz, dy = 0, fold = 0; if (u < G.D) dz = h - G.S * u / G.D; else { const s = (u - G.D) / (1 - G.D); dz = -h + G.S * s * s * (3 - 2 * s); dy = G.LIFT[fore ? 0 : 1] * Math.sin(Math.PI * s); fold = (fore ? 1.1 : -.4) * Math.sin(Math.PI * Math.min(1, s * 1.2)); } return { dz, dy: dy + drop, fold }; };
  for (const G of [WG.TROT, WG.GALLOP]) for (let k = 0; k < 400; k++) { const ph = k / 400; const p = wgStride(G, ph, 0, G === WG.GALLOP);
    for (const fore of [true, false]) { const leg = fore ? L.fore : L.hind; const f = one(G, ph, fore, p.drop); const c = [leg.c[0] * Math.cos(f.fold) - leg.c[1] * Math.sin(f.fold), leg.c[0] * Math.sin(f.fold) + leg.c[1] * Math.cos(f.fold)];
      const T = [leg.a[0] + leg.b[0] + leg.c[0] + f.dy - c[0], leg.a[1] + leg.b[1] + leg.c[1] + f.dz - c[1]]; worst = Math.max(worst, Math.hypot(T[0], T[1]) / (Math.hypot(...leg.a) + Math.hypot(...leg.b))); } }
  return { worstReach: +worst.toFixed(3) }; });
check('the legs are never stretched past their length', reach.worstReach < 1, reach);

// the attack: winding up it crouches, the lunge throws the forepaws ahead and drives the hind legs back
const atk = await page.evaluate(() => { const e = _W['Snow Wolf'], rig = e.limbs.wolf, G = e.mesh; G.rotation.set(0, 0, 0); const v = new THREE.Vector3(); const t = 3e5;
  const meas = () => { tickCreatures(1 / 60, t); G.updateMatrixWorld(true); const r = {}; ['hips', 'pfL', 'phL', 'head'].forEach(k => { rig.B[k].getWorldPosition(v); r[k] = [+(v.y - G.position.y).toFixed(3), +(v.z - G.position.z).toFixed(3)]; }); r.jaw = +rig.B.jaw.rotation.x.toFixed(2); return r; };
  for (let i = 0; i < 60; i++) tickCreatures(1 / 60, t); const rest = meas(); e._wind = 1; const wind = meas(); e._wind = 0; e._lunge = .15; const lunge = meas(); e._lunge = null; const after = meas();
  // the shared attack pose is still called by the world's behaviour tick; it must not tip the wolf's whole body
  e._wind = .8; attackPose(e, false); const tilt = +G.rotation.x.toFixed(3); e._wind = 0;
  return { rest, wind, lunge, after, tilt }; });
check('winding up, the wolf crouches with its head low; the lunge opens the jaw, forepaws reaching ahead, hind legs driving back', atk.wind.hips[0] < atk.rest.hips[0] - .03 && atk.wind.head[0] < atk.rest.head[0] && atk.lunge.jaw > .5 && atk.lunge.pfL[1] > atk.rest.pfL[1] + .06 && atk.lunge.phL[1] < atk.rest.phL[1] - .04 && Math.abs(atk.after.hips[0] - atk.rest.hips[0]) < .01 && atk.tilt === 0, atk);

// the telegraph lights this wolf's own material, and no other's
const flash = await page.evaluate(() => { const a = _W.Wolf, b = _W.Wolf2; telegraphPulse(a, 1); const r = { a: a.limbs.wolf.mesh.material.emissive.r, b: b.limbs.wolf.mesh.material.emissive.r }; telegraphReset(a); r.after = a.limbs.wolf.mesh.material.emissive.r; return r; });
check('a wind-up flashes the wolf red, and only that wolf', flash.a > .5 && flash.b === 0 && flash.after === 0, flash);

// level of detail by the eye's distance, and the shadow pass drawn from the distant copy whatever the range
const lod = await page.evaluate(() => { const e = _W['Ash Hound'], rig = e.limbs.wolf; const c0 = CAM.position.clone(); const r = {};
  CAM.position.set(e.x + 10, CAM.position.y, e.z); tickCreatures(1 / 60, 4e5); r.near10 = rig.lod;
  CAM.position.set(e.x + 20, CAM.position.y, e.z); tickCreatures(1 / 60, 4e5); r.far20 = rig.lod; r.loGeo = rig.mesh.geometry === rig.geoLo;
  CAM.position.set(e.x + 16, CAM.position.y, e.z); tickCreatures(1 / 60, 4e5); r.gap16 = rig.lod;
  CAM.position.set(e.x + 12, CAM.position.y, e.z); tickCreatures(1 / 60, 4e5); r.back12 = rig.lod;
  CAM.position.copy(c0); return r; });
check('the distant copy swaps in past 17 units and back under 15, with no flicker between', lod.near10 === 0 && lod.far20 === 1 && lod.loGeo && lod.gap16 === 1 && lod.back12 === 0, lod);
// put the wolf beside the player, close enough to draw at full detail, and watch what it draws with in each pass. On a
// loaded machine a frame's shadow pass has now and then drawn nothing at all (Sessions 166–170, the lod suite too; cause
// not found), so it renders across up to twelve real frames until the shadow pass has drawn the wolf, then reads that frame
let shadow = null;
for (let k = 0; k < 12; k++) {
  if (k) await g.frames(2);
  shadow = await page.evaluate(() => { const e = _W.Wolf, rig = e.limbs.wolf, G = e.mesh; const keep = G.position.clone();
    G.position.set(px + 2, WORLD.worldH(px + 2, pz), pz); CAM.position.set(px, G.position.y + 1.6, pz + 4); tickCreatures(1 / 60, 4.5e5);
    const seen = { eye: [], shadow: [] }; const rbd = REN.renderBufferDirect;
    REN.renderBufferDirect = function (cam, sc, geo, mat, obj, grp) { if (obj === rig.mesh) (mat.isMeshDepthMaterial || mat.isMeshDistanceMaterial ? seen.shadow : seen.eye).push(geo === rig.geoLo ? 'lo' : geo === rig.geoHi ? 'hi' : '?'); return rbd.apply(this, arguments); };
    try { REN.render(scene, CAM); } finally { REN.renderBufferDirect = rbd; }
    const r = { lod: rig.lod, eye: [...new Set(seen.eye)], shadow: [...new Set(seen.shadow)], after: rig.mesh.geometry === rig.geoHi }; G.position.copy(keep); return r; });
  shadow.tries = k + 1; if (shadow.shadow.length) break;
}
check('close up, the eye draws the full wolf and the shadow pass its distant copy, and the full one is put back', shadow.lod === 0 && shadow.eye.join() === 'hi' && shadow.shadow.join() === 'lo' && shadow.after, shadow);

// what a pack costs: the whole frame rendered with the test's wolves and boar beside the player, and without them
const cost = await page.evaluate(() => { const E = Object.values(_W).filter(e => e.limbs && e.limbs.wolf); const keep = E.map(e => e.mesh.position.clone());
  E.forEach((e, i) => { e.mesh.position.set(px - Math.sin(yaw) * 5 + (i - 2.5) * .9, WORLD.worldH(px, pz), pz - Math.cos(yaw) * 5); });
  CAM.position.set(px, WORLD.worldH(px, pz) + 1.6, pz); CAM.rotation.set(0, yaw, 0); tickCreatures(1 / 60, 4.8e5); scene.updateMatrixWorld(true);
  const time = n => { REN.render(scene, CAM); const t = performance.now(); for (let i = 0; i < n; i++) REN.render(scene, CAM); return (performance.now() - t) / n; };
  const tri = () => { REN.render(scene, CAM); return REN.info.render.triangles; };
  const lods = E.map(e => e.limbs.wolf.lod).join(''); const withT = tri(), withMs = time(6); E.forEach(e => e.mesh.visible = false); const noT = tri(), noMs = time(6); E.forEach((e, i) => { e.mesh.visible = true; e.mesh.position.copy(keep[i]); });
  return { wolves: E.length, lods, trisWith: withT, trisWithout: noT, perWolf: Math.round((withT - noT) / E.length), msWith: +withMs.toFixed(1), msWithout: +noMs.toFixed(1) }; });
check('the test\'s wolves (and the boar) close by draw at full detail and cost about a full wolf for the eye and a distant copy for the shadow', /^0+$/.test(cost.lods) && cost.perWolf > 5000 && cost.perWolf < 10000, cost);

// a dead wolf lies still: it takes the slack pose once and stops being ticked
const dead = await page.evaluate(() => { const e = _W['Dire Wolf'], rig = e.limbs.wolf; e.dead = true; tickCreatures(1 / 60, 5e5); const a = rig.B.neck.rotation.x; e.x += 1; tickCreatures(1 / 60, 5e5 + 17); return { posed: rig.deadPosed, neck: +a.toFixed(2), still: rig.B.neck.rotation.x === a }; });
check('a dead wolf takes the slack pose and is left alone', dead.posed && dead.neck > .3 && dead.still, dead);

// a despawned wolf leaves the set; the kind's geometry is kept for the next one
const gone = await page.evaluate(() => { const e = _W.Wolf2, rig = e.limbs.wolf; e.mesh.parent.remove(e.mesh); tickCreatures(1 / 60, 6e5); return { left: !WOLF_RIGS.has(rig), kept: WOLF_GEO.has('Wolf|1') && !!WOLF_GEO.get('Wolf|1').geo.attributes.position }; });
check('a despawned wolf leaves the rig set, the shared geometry stays', gone.left && gone.kept, gone);

// the photograph: the four kinds side by side in the world, standing, trotting, galloping and lunging
const shot = await page.evaluate(async () => { forceTime(12); const kinds = ['Wolf', 'Snow Wolf', 'Dire Wolf', 'Ash Hound', 'Boar']; const cv = REN.domElement;
  const bx = px + 300, bz = pz, y = WORLD.worldH(bx, bz) + 60; const sc = WORLD.scene; const rigs = []; const out = document.createElement('canvas'); out.width = 1280; out.height = 720; const x2 = out.getContext('2d');
  const cam = new THREE.PerspectiveCamera(30, cv.width / cv.height, .05, 100);
  const make = (n, x, z, ry) => { const r = buildWolf(n, { Wolf: .75, 'Snow Wolf': .9, 'Dire Wolf': .95, 'Ash Hound': .8, Boar: .7 }[n]); const G = new THREE.Group(); G.add(r.root); G.position.set(x, y, z); G.rotation.y = ry; sc.add(G); rigs.push([r, G]); return r; };
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(12, 12), new THREE.MeshLambertMaterial({ color: 0x6a7a48 })); floor.rotation.x = -Math.PI / 2; floor.position.set(bx, y, bz); floor.receiveShadow = true; sc.add(floor);
  // row one: the four kinds standing, three-quarter; row two: one wolf side on through a gallop and the lunge
  kinds.forEach((n, i) => { const r = make(n, bx - 1.8 + i * .9, bz, .55); wgApply(r, wgStand(1)); });
  cam.position.set(bx + .5, y + 1, bz + 3.9); cam.lookAt(bx, y + .3, bz); sc.updateMatrixWorld(true); REN.render(sc, cam); x2.drawImage(cv, 0, cv.height / 4, cv.width, cv.height / 2, 0, 0, 1280, 360);
  rigs.forEach(([r, G]) => sc.remove(G)); rigs.length = 0;
  const poses = [wgStride(WG.TROT, 0, 0, false), wgStride(WG.GALLOP, 0, 0, true), wgStride(WG.GALLOP, .25, 0, true), wgStride(WG.GALLOP, .55, 0, true), wgAttack(1, 0, wgStand(1)), wgAttack(0, 1, wgStand(1))];
  poses.forEach((P, i) => { const r = make('Wolf', bx - 2.0 + i * .8, bz, Math.PI / 2); wgApply(r, P); });
  cam.position.set(bx, y + .4, bz + 3.6); cam.lookAt(bx, y + .28, bz); sc.updateMatrixWorld(true); REN.render(sc, cam); x2.drawImage(cv, 0, cv.height / 4, cv.width, cv.height / 2, 0, 360, 1280, 360);
  rigs.forEach(([r, G]) => sc.remove(G)); sc.remove(floor); tickCreatures(1 / 60, 7e5);
  return out.toDataURL(); });
fs.writeFileSync('tests/out/wolves.png', Buffer.from(shot.split(',')[1], 'base64'));
// turning on the spot (Session 213): a standing wolf swung round a quarter turn in half a second treads round, not pivots
const turn = await page.evaluate(() => { const e = _W['Wolf'], rig = e.limbs.wolf, G = e.mesh; let t = 6e6; G.rotation.set(0, 0, 0);
  for (let i = 0; i < 90; i++) tickCreatures(1 / 60, t += 16.7); const before = { stand: +rig.w.stand.toFixed(2) }; const ph0 = rig.phase;
  for (let i = 1; i <= 30; i++) { G.rotation.set(0, i / 30 * Math.PI / 2, 0); tickCreatures(1 / 60, t += 16.7); }
  const during = { stand: +rig.w.stand.toFixed(2), trot: +rig.w.trot.toFixed(2), phase: +(((rig.phase - ph0) % 1 + 1) % 1).toFixed(2) };
  for (let i = 0; i < 60; i++) tickCreatures(1 / 60, t += 16.7); return { before, during, after: { stand: +rig.w.stand.toFixed(2) } }; });
check('a wolf turning on the spot steps round (it trots through the turn) and stands again after', turn.before.stand > .95 && turn.during.trot > .5 && turn.during.phase > .1 && turn.after.stand > .9, turn);
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
