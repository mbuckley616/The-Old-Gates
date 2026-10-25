// Card F4 (Session 1375): on the new look the Gargoyle wears the creature kit's gargoyle (OG-018's stone Gargoyle, Session 956: the goblin's
// crouched frame in stone, horns, a tail, stone bat wings), driven by its old body: the people's 17-bone rig (buildFoe's g.gargoyle) through
// the Skeleton's map (HC_PMAP), sized by its legs with its ankles held, as the goblin is. Its eyes are the driver's ember; its wings fold
// down its back while it sleeps as a statue and open, beating, once it wakes (hcGarg, from the driver's fold). Checked: on the kit's bones,
// keyed by its foe id; the wings folded asleep and open awake; its feet on the ground through the crouch, the stand, the walk and the run;
// three levels by distance, the middle one baked; killed, darkened, lying with its driver. Picture: docs/prototypes/f4/f4-gargoyles.jpg.
import { boot, check, ROOT } from './lib/game.mjs';
import fs from 'fs'; import path from 'path';
const OUT = path.join(ROOT, 'docs', 'prototypes', 'f4'); fs.mkdirSync(OUT, { recursive: true });

const g = await boot({ look: 'new' }); const { page } = g;
await g.intoWorld();

const made = await page.evaluate(() => { forceTime(12);
  { const t1 = performance.now(); while (JOBS.length && performance.now() - t1 < 20000) runJobs(); }
  const fx = -Math.sin(yaw), fz = -Math.cos(yaw), sx = -fz, sz = fx;
  const clear = (x, z) => { for (let dx = -2; dx <= 2; dx += .5) for (let dz = -2; dz <= 2; dz += .5) if (WORLD.solidAt(x + dx, z + dz)) return false; return true; };
  let d = 7; for (; d < 60; d += 3) { let ok = true; for (let i = -1; i <= 1; i++) if (!clear(px + fx * d + sx * i * 1.6, pz + fz * d + sz * i * 1.6)) { ok = false; break; } if (ok) break; }
  window._S = [];
  // two gargoyles as a dungeon builds them (buildFoe on its own body at the Gargoyle's scale, 1.35): the first asleep, the second awake
  for (const [i, type] of ['Gargoyle', 'Gargoyle'].entries()) { const at = i ? 1 : -1, X = px + fx * d + sx * at * 1.6, Z = pz + fz * d + sz * at * 1.6;
    const pr = buildFoe(type, X, Z, null, 0x880000), m = new THREE.Group(); pr.root.scale.multiplyScalar(1.35); m.add(pr.root); const e = { id: 'f4gargoyles:' + i, name: type, mesh: m, limbs: { person: pr }, dormant: !i, alert: !!i };
    const rig = e.limbs && e.limbs.person; if (!rig) continue; e.x = X; e.z = Z;
    e.mesh.position.set(X, WORLD.worldH(X, Z), Z); e.mesh.rotation.y = Math.atan2(px - X, pz - Z); e.combatYaw = e.mesh.rotation.y; e.locked = false; e.mesh.visible = true;
    if (!e.mesh.parent) WORLD.scene.add(e.mesh); rig.e = e; _S.push({ k: type, e, rig }); }
  CAM.position.set(px, worldH(px, pz) + 1.65, pz); CAM.updateMatrixWorld(true);
  const want = () => _S.filter(f => !f.rig.hc && !f.rig.hcFail).length;
  let k = 0; const t0 = performance.now(); HBODY.last = -1e9; while (want() && k++ < 100) { tickPeople(1 / 60, 2e5 + k * (HBODY.gap + 1)); tickCreatures(1 / 60, 2e5 + k * (HBODY.gap + 1)); }
  return { d, n: _S.length, kinds: _S.map(f => f.k + ':' + f.rig.hcKind), ticks: k, left: want(), ms: Math.round(performance.now() - t0), each: Math.round(HC_BODY.ms / Math.max(1, HC_BODY.n)) }; });
console.log('  built:', JSON.stringify(made));

const who = await page.evaluate(() => _S.map(({ k, e, rig }) => { const H = rig.hc;
  return { k, id: e.id, hc: !!H, fail: !!rig.hcFail, plan: H && H.C.g.plan, seed: H && H.C.g.seed, want: H && HC.hashKey('foe:' + e.id), bones: H ? H.C.bones.length : 0, map: H ? H.map.length : 0,
    tris: H ? H.C.stats.tris : 0, gear: H ? H.C.B.gear || [] : null, weapon: rig.weapon ? rig.weapon.visible : null, driver: rig.mesh.visible, driverWpn: !!rig.weapon, drvGear: rig.B.gear.visible && rig.mesh.visible,
    coat: H ? H.C.plan.palette.coat.map(v => +v.toFixed(2)) : null, scale: +e.mesh.scale.x.toFixed(2) }; }));
console.log('  gargoyles:', JSON.stringify(who));
check(`two gargoyles wear the kit's gargoyle (${who.map(w => w.bones + ' bones, ' + w.tris + ' triangles').join('; ')}), keyed by their foe id, in grey stone (${who[0] && who[0].coat}), built in ${made.each} ms each`,
  made.n === 2 && made.left === 0 && who.every(w => w.hc && w.bones > 23 && w.map === 16 && w.seed === w.want && Math.abs(w.coat[0] - w.coat[2]) < .1) && who[0].seed !== who[1].seed, who);
const eyes = await page.evaluate(() => _S.map(({ rig }) => { let lit = 0; rig.hc.W.traverse(o => { if (o.isMesh && o.material && o.material.emissive && o.material.emissive.r > .5 && o.material.emissive.b < .4) lit++; });
  return { lit, glow: !!rig.eyeGlow, shown: !!(rig.eyeGlow && rig.eyeGlow.visible), driver: rig.mesh.visible }; }));
check(`its eyes lit ember (${eyes.map(x => x.lit).join(', ')} lit meshes); the driver's lit eyes and its body hidden while the kit shows`,
  eyes.every(x => x.lit >= 1 && !x.shown && !x.driver), eyes);
// the wings: asleep folded down its back, awake open; each wing's tip from the body's middle line, and behind or ahead of it
const wings = await page.evaluate(() => _S.map(({ e, rig }) => { for (let i = 0; i < 90; i++) { tickPeople(1 / 60, 2.5e5 + i * 16.7); tickCreatures(1 / 60, 2.5e5 + i * 16.7); }
  rig.root.parent.updateMatrixWorld(true); const G = rig.hc.garg, sp = rig.hc.C.byName.spine1.getWorldPosition(new THREE.Vector3()), r = e.mesh.rotation.y, sx = Math.cos(r), sz = -Math.sin(r);
  const tips = G.wings.map(W => { const p = W.fing[0].getWorldPosition(new THREE.Vector3()).sub(sp); return Math.abs(p.x * sx + p.z * sz); });
  return { dormant: !!e.dormant, fold: +rig.fold.toFixed(2), out: +Math.max(...tips).toFixed(3), n: G.wings.length, tail: G.tail.length }; }));
console.log('  wings:', JSON.stringify(wings));
check(`its two stone wings fold asleep (their tips ${wings[0].out} m out from its spine, fold ${wings[0].fold}) and open awake (${wings[1].out} m, fold ${wings[1].fold}); its tail ${wings[0].tail} joints`,
  wings.every(w => w.n === 2 && w.tail >= 3) && wings[0].fold > .95 && wings[1].fold < .05 && wings[1].out > wings[0].out * 1.4, wings);

// its size, by its legs: its hips over the driver's, its toes on the ground, asleep in its crouch and awake at a stand
const size = await page.evaluate(() => _S.map(({ k, e, rig }) => { for (let i = 0; i < 30; i++) { tickPeople(1 / 60, 3e5 + i * 16.7); tickCreatures(1 / 60, 3e5 + i * 16.7); }
  rig.root.parent.updateMatrixWorld(true); const by = rig.hc.C.byName, W = o => o.getWorldPosition(new THREE.Vector3());
  const a = W(by.spine0), b = W(rig.B.hips), gy = e.mesh.position.y;
  return { k, hand: +W(by.arm0R_2).distanceTo(W(rig.B.wrR)).toFixed(3), hips: +Math.hypot(a.x - b.x, a.z - b.z).toFixed(3), up: +(a.y - b.y).toFixed(3), head: +(W(by.head).y - gy).toFixed(3), drvHead: +(W(rig.B.head).y - gy).toFixed(3), toes: ['leg0L_3', 'leg0R_3'].map(n => +(W(by[n]).y - gy).toFixed(3)),
    ankles: [['anL', 'leg0L_2'], ['anR', 'leg0R_2']].map(([d, n]) => +(W(by[n]).y - W(rig.B[d]).y).toFixed(3)) }; }));
console.log('  size:', JSON.stringify(size));
check(`each at its driver's size, by its legs: its head ${size.map(s => s.head).join(', ')} m up asleep and awake (the driver's ${size.map(s => s.drvHead).join(', ')}), its hips over the driver's (${size.map(s => s.hips).join(', ')} m across), its toes on the ground (${size.map(s => s.toes.join(', ')).join('; ')} m)`,
  size.length === 2 && size.every(s => s.hips < .05 && s.head < s.drvHead + .1 && s.toes.every(y => Math.abs(y) < .06)), size);

// the picture: the two from 3.5 m
await page.evaluate(() => { const a = _S[0].e, b = _S[1].e, mx = (a.x + b.x) / 2, mz = (a.z + b.z) / 2, fx = -Math.sin(yaw), fz = -Math.cos(yaw); px = mx - fx * 5; pz = mz - fz * 5; pitch = .05; });
for (let i = 0; i < 8; i++) { await page.evaluate(() => { tickPeople(1 / 60, performance.now()); tickCreatures(1 / 60, performance.now()); }); await g.frames(1); }
await page.screenshot({ path: path.join(OUT, 'f4-gargoyles.jpg') });

// a walk, then a run: the kit's bones turn, its toes lift with the stride and never sink into the ground, its wrist keeps by the driver's
const hand0 = size[1].hand;
const walk = await page.evaluate(() => { const { e, rig } = _S[1], by = rig.hc.C.byName, mats = () => Array.from(rig.hc.C.skel.boneMatrices), W = o => o.getWorldPosition(new THREE.Vector3());
  const dx = Math.sin(e.mesh.rotation.y), dz = Math.cos(e.mesh.rotation.y); rig.hc.C.skel.update(); const a = mats(), out = {};
  for (const [name, v, n] of [['walk', .011, 120], ['run', .04, 120]]) { const o = out[name] = { low: 9, lift: 0, hand: 0, w: 0 };
    for (let i = 0; i < n; i++) { e.x += dx * v; e.z += dz * v; e.mesh.position.set(e.x, WORLD.worldH(e.x, e.z), e.z); const t = (name === 'run' ? 5e5 : 4e5) + i * 16.7; tickPeople(1 / 60, t); tickCreatures(1 / 60, t);
      if (i > 40) { rig.root.parent.updateMatrixWorld(true); o.w = Math.max(o.w, rig.w[name] || 0);
        for (const k of ['leg0L_3', 'leg0R_3']) { const y = W(by[k]).y - WORLD.worldH(W(by[k]).x, W(by[k]).z); o.low = Math.min(o.low, y); o.lift = Math.max(o.lift, y); }
        o.hand = Math.max(o.hand, W(by.arm0R_2).distanceTo(W(rig.B.wrR))); } }
    for (const k in o) o[k] = +o[k].toFixed(3); }
  rig.hc.C.skel.update(); const b = mats(); let moved = 0; for (let i = 0; i < a.length; i++) moved = Math.max(moved, Math.abs(a[i] - b[i])); out.moved = +moved.toFixed(3); return out; });
console.log('  walk:', JSON.stringify(walk));
check(`its walk and its run turn the kit's bones (by ${walk.moved}); its toes lift (${walk.walk.lift}, ${walk.run.lift} m) and sink no lower than ${Math.min(walk.walk.low, walk.run.low)} m; its wrist within ${Math.max(walk.walk.hand, walk.run.hand)} m of the driver's (${hand0} at a stand)`,
  walk.moved > .02 && walk.walk.w > .5 && walk.run.w > .5 && walk.walk.lift > .03 && walk.run.lift > .05 && Math.min(walk.walk.low, walk.run.low) > -.06 && Math.max(walk.walk.hand, walk.run.hand) < hand0 + .25, walk);

// the levels: near and at 25 m the kit's body; at 60 m the driver's, with its knife back
const lv = await page.evaluate(() => { const out = {}, f = _S[1], g0 = f.e.mesh, fx = -Math.sin(yaw), fz = -Math.cos(yaw);
  const at = (dd, k) => { CAM.position.set(g0.position.x - fx * dd, g0.position.y + 1.65, g0.position.z - fz * dd); CAM.updateMatrixWorld(true); for (let i = 0; i < 3; i++) { tickPeople(1 / 60, 5e5 + k * 100 + i * 17); tickCreatures(1 / 60, 5e5 + k * 100 + i * 17); }
    const H = f.rig.hc; let n = 0; if (H.W.visible) H.W.traverse(o => { if (o.isMesh && o.visible) n++; }); return { L: H.L, kit: n, driver: f.rig.mesh.visible, gear: !!f.rig.eyeGlow && f.rig.eyeGlow.visible }; };
  out.near = at(5, 1); out.mid = at(25, 2); out.baked = !!f.rig.hc.mid && f.rig.hc.mid.visible; out.far = at(60, 3); out.back = at(5, 4); return out; });
check(`three levels: near the kit's body (${lv.near.kit} meshes), at 25 m baked into one (${lv.mid.kit}), at 60 m the driver's own, its lit eyes back`,
  lv.near.L === 0 && lv.near.kit > 1 && !lv.near.driver && !lv.near.gear && lv.mid.L === 1 && lv.baked && !lv.mid.driver && lv.far.L === 2 && lv.far.driver && lv.far.gear && lv.back.L === 0, lv);

const dead = await page.evaluate(() => { const f = _S[0], rig = f.rig, before = []; rig.hc.W.traverse(o => { if (o.isMesh) before.push([o, o.material]); });
  f.e.hp = 0; killZoneEnemy(f.e, WORLD.scene, '');
  for (let i = 0; i < 120; i++) { tickPeople(1 / 60, 7e5 + i * 16.7); tickCreatures(1 / 60, 7e5 + i * 16.7); }
  rig.root.parent.updateMatrixWorld(true); const a = rig.hc.C.byName.spine0.getWorldPosition(new THREE.Vector3()), b = rig.B.hips.getWorldPosition(new THREE.Vector3());
  return { n: before.length, darker: before.filter(([o, m]) => o.material !== m && o.material.color && o.material.color.r <= m.color.r * .36 + 1e-6).length, gap: +Math.hypot(a.x - b.x, a.z - b.z).toFixed(3),
    low: +(a.y - f.e.mesh.position.y).toFixed(2), dead: !!f.e.dead }; });
console.log('  dead:', JSON.stringify(dead));
check(`killed, the kit's body is darkened and lies with its driver (its hips ${dead.gap} m from over the driver's, ${dead.low} m up)`, dead.dead && dead.darker === dead.n && dead.gap < .08 && dead.low < .5, dead);
// gone from the scene, it is dropped
const drop = await page.evaluate(() => { const f = _S[1]; f.e.mesh.parent.remove(f.e.mesh); tickPeople(1 / 60, 9e5); tickCreatures(1 / 60, 9e5); return { hc: !!f.rig.hc, held: HC_RIGS.has(f.rig) }; });
check('taken from the scene, its kit body is dropped', !drop.hc && !drop.held, drop);
await page.evaluate(() => { REN.render(scene, CAM); });
check('no page errors', g.errs.length === 0, g.errs.slice(0, 3));
await g.close();
