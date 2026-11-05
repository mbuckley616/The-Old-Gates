// Card F4 (Session 1356): on the new look the Skeleton foe wears the creature kit's skeleton (OG-041; the kit's first bare body, Session
// 934), driven by its old body: the people's 17-bone rig (buildFoe's g.skel), whose hips, spine, neck, head, arms and legs turn the kit's
// biped bones (HC_PMAP). What it holds is the game's: a skeleton dealt a sword carries the kit's notched sword, one dealt a spear the kit's
// spear, and neither the plan's shield. Checked: each on the kit's 23 bones, keyed by its foe id; the driver's weapon and lit eyes hidden
// while the kit's show; its hips at the driver's and its feet on the ground; a walk that turns the kit's bones with its ankles by the
// driver's; three levels by distance; and killed, darkened, lying with its driver. Picture: docs/prototypes/f4/f4-skeletons.jpg.
// Session 1867 (L4, OG-073): in a failing gate a skeleton wears the kit's failing skeleton (two more pairs of arms, posed by hcArms; spurs
// down the back; only its cracks lit), holding what it was dealt as the steady one does. Picture: docs/prototypes/f4/f4-failingskeletons.jpg.
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
  // a sword and a spear: the gear is dealt by the genome's seed (buildFoe), so foes are made along the line until one of each stands
  const got = {}; window._S = [];
  for (let i = 0; i < 12 && !(got.sword && got.spear); i++) { const x = px + fx * d + sx * (i * .37 - 2), z = pz + fz * d + sz * (i * .37 - 2);
    const e = keyFoe(buildZoneEnemy(WORLD.scene, [], x, z, 'Skeleton', null), 'f4bones:' + i), rig = e.limbs && e.limbs.person, k = rig && rig.g.gear === 'spear' ? 'spear' : 'sword';
    if (!rig || got[k]) { if (e.mesh.parent) e.mesh.parent.remove(e.mesh); continue; } got[k] = 1;
    const at = _S.length ? 1 : -1, X = px + fx * d + sx * at * 1.6, Z = pz + fz * d + sz * at * 1.6; e.x = X; e.z = Z;
    e.mesh.position.set(X, WORLD.worldH(X, Z), Z); e.mesh.rotation.y = Math.atan2(px - X, pz - Z); e.combatYaw = e.mesh.rotation.y; e.locked = false; e.mesh.visible = true;
    if (!e.mesh.parent) WORLD.scene.add(e.mesh); rig.e = e; _S.push({ k, e, rig }); }
  CAM.position.set(px, worldH(px, pz) + 1.65, pz); CAM.updateMatrixWorld(true);
  const want = () => _S.filter(f => !f.rig.hc && !f.rig.hcFail).length;
  let k = 0; const t0 = performance.now(); HBODY.last = -1e9; while (want() && k++ < 100) { tickPeople(1 / 60, 2e5 + k * (HBODY.gap + 1)); tickCreatures(1 / 60, 2e5 + k * (HBODY.gap + 1)); }
  return { d, n: _S.length, kinds: _S.map(f => f.k), ticks: k, left: want(), ms: Math.round(performance.now() - t0), each: Math.round(HC_BODY.ms / Math.max(1, HC_BODY.n)) }; });
console.log('  built:', JSON.stringify(made));

const who = await page.evaluate(() => _S.map(({ k, e, rig }) => { const H = rig.hc;
  return { k, id: e.id, hc: !!H, fail: !!rig.hcFail, plan: H && H.C.g.plan, seed: H && H.C.g.seed, want: H && HC.hashKey('foe:' + e.id), bones: H ? H.C.bones.length : 0, map: H ? H.map.length : 0,
    tris: H ? H.C.stats.tris : 0, gear: H ? H.C.B.gear : null, weapon: rig.weapon ? rig.weapon.visible : null, eyes: rig.eyeGlow ? rig.eyeGlow.visible : null, driver: rig.mesh.visible }; }));
console.log('  skeletons:', JSON.stringify(who));
check(`two skeletons, a sword's and a spear's, wear the kit's skeleton (${who.map(w => w.bones + ' bones, ' + w.tris + ' triangles').join('; ')}), keyed by their foe id, built in ${made.each} ms each`,
  made.n === 2 && made.left === 0 && who.every(w => w.hc && w.bones === 23 && w.map === 16 && w.seed === w.want) && who[0].plan !== who[1].plan, who);
check(`each holds what it was dealt, from the kit (${who.map(w => w.k + ': ' + (w.gear || []).join('+')).join('; ')}), no shield; the driver's weapon and lit eyes hidden while the kit shows`,
  who.every(w => w.gear && w.gear.length === 1 && w.gear[0] === w.k && w.weapon !== true && w.eyes === false && !w.driver), who);

// its size, by its stature: the kit's head at the driver's, its hips over the driver's, its feet on the ground (its own legs are longer)
const size = await page.evaluate(() => _S.map(({ k, e, rig }) => { rig.root.parent.updateMatrixWorld(true); const by = rig.hc.C.byName, W = o => o.getWorldPosition(new THREE.Vector3());
  const a = W(by.spine0), b = W(rig.B.hips), gy = e.mesh.position.y;
  return { k, hips: +Math.hypot(a.x - b.x, a.z - b.z).toFixed(3), up: +(a.y - b.y).toFixed(3), head: +(W(by.head).y - W(rig.B.head).y).toFixed(3), toes: ['leg0L_3', 'leg0R_3'].map(n => +(W(by[n]).y - gy).toFixed(3)),
    ankles: [['anL', 'leg0L_2'], ['anR', 'leg0R_2']].map(([d, n]) => +W(by[n]).distanceTo(W(rig.B[d])).toFixed(3)) }; }));
console.log('  size:', JSON.stringify(size));
check(`each stands at its driver's stature: its head within 3 cm of the driver's (${size.map(s => s.head).join(', ')} m), its hips over the driver's (${size.map(s => s.up).join(', ')} m higher), its toes on the ground (${size.map(s => s.toes.join(', ')).join('; ')} m)`,
  size.every(s => s.hips < .03 && Math.abs(s.head) < .03 && s.toes.every(y => Math.abs(y) < .06)), size);

// Session 1867: a failing gate's two, a sword's and a spear's, built 2.5 m behind as buildDungeon builds them there (hcFailing true)
const fs1 = await page.evaluate(() => { const fx = -Math.sin(yaw), fz = -Math.cos(yaw), sx = -fz, sz = fx, real = window.hcFailing, got = {}; window._F = []; window.hcFailing = () => true;
  const a = _S[0].e, b = _S[1].e, mx = (a.x + b.x) / 2 + fx * 2.5, mz = (a.z + b.z) / 2 + fz * 2.5;
  for (let i = 0; i < 24 && !(got.sword && got.spear); i++) { const e = keyFoe(buildZoneEnemy(WORLD.scene, [], mx + sx * (i * .37 - 2), mz + sz * (i * .37 - 2), 'Skeleton', null), 'f4bones:failing:' + i), rig = e.limbs && e.limbs.person, k = rig && rig.g.gear === 'spear' ? 'spear' : 'sword';
    if (!rig || got[k]) { if (e.mesh.parent) e.mesh.parent.remove(e.mesh); continue; } got[k] = 1;
    const at = _F.length ? 1 : -1, X = mx + sx * at * 1.1, Z = mz + sz * at * 1.1; e.x = X; e.z = Z;
    e.mesh.position.set(X, WORLD.worldH(X, Z), Z); e.mesh.rotation.y = Math.atan2(px - X, pz - Z); e.combatYaw = e.mesh.rotation.y; e.locked = false; e.mesh.visible = true;
    if (!e.mesh.parent) WORLD.scene.add(e.mesh); rig.e = e; _F.push({ k, e, rig }); }
  window.hcFailing = real;
  let n = 0; HBODY.last = -1e9; while (_F.some(f => !f.rig.hc && !f.rig.hcFail) && n++ < 100) { tickPeople(1 / 60, 2.5e5 + n * (HBODY.gap + 1)); tickCreatures(1 / 60, 2.5e5 + n * (HBODY.gap + 1)); }
  return _F.map(({ k, e, rig }) => { const H = rig.hc; if (!H) return { k, hc: false }; rig.root.parent.updateMatrixWorld(true); const by = H.C.byName, W = o => o.getWorldPosition(new THREE.Vector3()), gy = e.mesh.position.y;
    return { k, hc: true, kind: rig.hcKind, plan: HC.PLANS[H.C.g.plan].from || HC.PLANS[H.C.g.plan].plan, name: HC.PLANS[H.C.g.plan].name, seed: H.C.g.seed, want: HC.hashKey('foe:' + e.id), pairs: H.C.B.arms.length / 2,
      posed: (H.arms || []).map(A => A.pair).join(''), gear: H.C.B.gear, tris: H.C.stats.tris, steady: _S[0].rig.hc.C.stats.tris, toes: ['leg0L_3', 'leg0R_3'].map(nm => +(W(by[nm]).y - gy).toFixed(3)), driver: rig.mesh.visible }; }); });
console.log('  failing:', JSON.stringify(fs1));
check(`a failing gate's sword and spear skeletons wear the kit's failing skeleton (${fs1.map(f => f.kind + ', ' + f.pairs + ' pairs of arms, ' + f.tris + ' triangles').join('; ')}; the steady ${fs1[0] && fs1[0].steady}), keyed by their foe id, holding what they were dealt, their toes on the ground (${fs1.map(f => (f.toes || []).join(', ')).join('; ')} m)`,
  fs1.length === 2 && fs1.every(f => f.hc && /failing/.test(f.kind) && f.pairs === 3 && f.posed === '1122' && f.seed === f.want && f.gear && f.gear.length === 1 && f.gear[0] === f.k && !f.driver && f.tris > f.steady && f.toes.every(y => Math.abs(y) < .06)), fs1);
const fb = await page.evaluate(() => { const { e, rig } = _F[0], by = rig.hc.C.byName, inv = () => new THREE.Matrix4().copy(e.mesh.matrixWorld).invert(), L = o => o.getWorldPosition(new THREE.Vector3()).applyMatrix4(inv()), out = [];
  for (const [wind, anim] of [[0, 0], [1, 0], [0, .1]]) { tickPeople(1 / 60, 6e5); tickCreatures(1 / 60, 6e5); e._wind = wind; e.atkAnim = anim; attackPose(e, true); hcPose(rig); rig.root.parent.updateMatrixWorld(true);
    out.push(['arm1R_2', 'arm2R_2'].map(n => +L(by[n]).z.toFixed(2))); }
  e._wind = 0; e.atkAnim = 0; return { rest: out[0], wind: out[1], rake: out[2] }; });
console.log('  failing blow:', JSON.stringify(fb));
check(`its two lower pairs draw back through the wind-up and rake forward in the strike (wrists ${fb.rest.join(', ')} m ahead at rest, ${fb.wind.join(', ')} at the wind-up, ${fb.rake.join(', ')} in the rake)`,
  [0, 1].every(i => fb.wind[i] < fb.rest[i] - .015 && fb.rake[i] > fb.wind[i] + .04), fb);
await page.evaluate(() => { const a = _F[0].e, b = _F[1].e, mx = (a.x + b.x) / 2, mz = (a.z + b.z) / 2, fx = -Math.sin(yaw), fz = -Math.cos(yaw); const ox = px, oz = pz; px = mx - fx * 3; pz = mz - fz * 3; pitch = -.12; window._P = [ox, oz]; });
for (let i = 0; i < 8; i++) { await page.evaluate(() => { tickPeople(1 / 60, performance.now()); tickCreatures(1 / 60, performance.now()); }); await g.frames(1); }
await page.screenshot({ path: path.join(OUT, 'f4-failingskeletons.jpg') });
await page.evaluate(() => { for (const f of _F) if (f.e.mesh.parent) f.e.mesh.parent.remove(f.e.mesh); [px, pz] = _P; });

// Session 1878 (L4, OG-018): an Uisce gate's two wear the kit's drowned skeleton, weed-hung, its sockets the sea's blue; a failing Uisce gate's
// the failing skeleton (the condition shows over the school); any other school's the steady
const kinds = await page.evaluate(() => { const rF = window.hcFailing, rS = window.hcGateSchool, out = [];
  for (const [f, s] of [[false, 'uisce'], [true, 'uisce'], [false, 'cloch'], [false, null]]) { window.hcFailing = () => f; window.hcGateSchool = () => s; out.push(hcSkelKind('Skeleton') + '|' + hcSkelKind('Skeleton (spear)')); }
  window.hcFailing = rF; window.hcGateSchool = rS; return out; });
check(`a skeleton's form by its gate: Uisce ${kinds[0]}; Uisce failing ${kinds[1]}; Cloch ${kinds[2]}; outside ${kinds[3]}`,
  kinds.join() === 'Skeleton (drowned)|Skeleton (spear, drowned),Skeleton (failing)|Skeleton (spear, failing),Skeleton|Skeleton (spear),Skeleton|Skeleton (spear)', kinds);
const dr = await page.evaluate(() => { const fx = -Math.sin(yaw), fz = -Math.cos(yaw), sx = -fz, sz = fx, real = window.hcGateSchool, got = {}; window._D = []; window.hcGateSchool = () => 'uisce';
  const a = _S[0].e, b = _S[1].e, mx = (a.x + b.x) / 2 + fx * 2.5, mz = (a.z + b.z) / 2 + fz * 2.5;
  for (let i = 0; i < 24 && !(got.sword && got.spear); i++) { const e = keyFoe(buildZoneEnemy(WORLD.scene, [], mx + sx * (i * .37 - 2), mz + sz * (i * .37 - 2), 'Skeleton', null), 'f4bones:drowned:' + i), rig = e.limbs && e.limbs.person, k = rig && rig.g.gear === 'spear' ? 'spear' : 'sword';
    if (!rig || got[k]) { if (e.mesh.parent) e.mesh.parent.remove(e.mesh); continue; } got[k] = 1;
    const at = _D.length ? 1 : -1, X = mx + sx * at * 1.1, Z = mz + sz * at * 1.1; e.x = X; e.z = Z;
    e.mesh.position.set(X, WORLD.worldH(X, Z), Z); e.mesh.rotation.y = Math.atan2(px - X, pz - Z); e.combatYaw = e.mesh.rotation.y; e.locked = false; e.mesh.visible = true;
    if (!e.mesh.parent) WORLD.scene.add(e.mesh); rig.e = e; _D.push({ k, e, rig }); }
  window.hcGateSchool = real;
  let n = 0; HBODY.last = -1e9; while (_D.some(f => !f.rig.hc && !f.rig.hcFail) && n++ < 100) { tickPeople(1 / 60, 2.7e5 + n * (HBODY.gap + 1)); tickCreatures(1 / 60, 2.7e5 + n * (HBODY.gap + 1)); }
  for (let i = 0; i < 30; i++) { tickPeople(1 / 60, 3.7e5 + i * 16.7); tickCreatures(1 / 60, 3.7e5 + i * 16.7); }
  return _D.map(({ k, e, rig }) => { const H = rig.hc; if (!H) return { k, hc: false, kind: rig.hcKind, fail: !!rig.hcFail }; rig.root.parent.updateMatrixWorld(true); const by = H.C.byName, W = o => o.getWorldPosition(new THREE.Vector3()), gy = e.mesh.position.y;
    const P = H.C.plan, head = P.parts.find(([q]) => q === 'head')[1];
    return { k, hc: true, kind: rig.hcKind, name: P.name, seed: H.C.g.seed, want: HC.hashKey('foe:' + e.id), bones: H.C.bones.length, fronds: P.parts.some(([q]) => q === 'fronds'), eye: head.eyes[0].color.map(v => +v.toFixed(2)),
      coat: P.palette.coat.map(v => +v.toFixed(2)), gear: H.C.B.gear, tris: H.C.stats.tris, steady: _S[0].rig.hc.C.stats.tris, head: +(W(by.head).y - gy).toFixed(2), drvHead: +(W(rig.B.head).y - gy).toFixed(2),
      toes: ['leg0L_3', 'leg0R_3'].map(nm => +(W(by[nm]).y - gy).toFixed(3)), driver: rig.mesh.visible }; }); });
console.log('  drowned:', JSON.stringify(dr));
check(`an Uisce gate's sword and spear skeletons wear the kit's drowned skeleton (${dr.map(f => f.kind + ', ' + f.bones + ' bones, ' + f.tris + ' triangles').join('; ')}; the steady ${dr[0] && dr[0].steady}): weed-hung, grey-green (${dr[0] && dr[0].coat}), sockets ${dr[0] && dr[0].eye}, keyed by their foe id, holding what they were dealt`,
  dr.length === 2 && dr.every(f => f.hc && /drowned/.test(f.kind) && f.name === f.kind && f.fronds && f.bones === 23 && f.seed === f.want && f.gear && f.gear.length === 1 && f.gear[0] === f.k && !f.driver
    && f.tris > f.steady && f.eye.join() === '0.35,0.75,0.95'), dr);
check(`each stands at its driver's stature (heads ${dr.map(f => f.head).join(', ')} m up, the drivers' ${dr.map(f => f.drvHead).join(', ')}), its toes on the ground (${dr.map(f => (f.toes || []).join(', ')).join('; ')} m)`,
  dr.every(f => f.hc && Math.abs(f.head - f.drvHead) < .12 && f.toes.every(y => Math.abs(y) < .06)), dr);
await page.evaluate(() => { const a = _D[0].e, b = _D[1].e, mx = (a.x + b.x) / 2, mz = (a.z + b.z) / 2, fx = -Math.sin(yaw), fz = -Math.cos(yaw); window._P2 = [px, pz]; for (const f of _S) f.e.mesh.visible = false; px = mx - fx * 3; pz = mz - fz * 3; pitch = -.12; });
for (let i = 0; i < 8; i++) { await page.evaluate(() => { tickPeople(1 / 60, performance.now()); tickCreatures(1 / 60, performance.now()); }); await g.frames(1); }
await page.screenshot({ path: path.join(OUT, 'f4-drownedskeletons.jpg') });
await page.evaluate(() => { for (const f of _D) if (f.e.mesh.parent) f.e.mesh.parent.remove(f.e.mesh); for (const f of _S) f.e.mesh.visible = true; [px, pz] = _P2; });

// the picture: the two from 3.5 m
await page.evaluate(() => { const a = _S[0].e, b = _S[1].e, mx = (a.x + b.x) / 2, mz = (a.z + b.z) / 2, fx = -Math.sin(yaw), fz = -Math.cos(yaw); px = mx - fx * 3.2; pz = mz - fz * 3.2; pitch = -.08; });
for (let i = 0; i < 8; i++) { await page.evaluate(() => { tickPeople(1 / 60, performance.now()); tickCreatures(1 / 60, performance.now()); }); await g.frames(1); }
await page.screenshot({ path: path.join(OUT, 'f4-skeletons.jpg') });

// a walk, then a run: the kit's bones turn, its toes lift with the stride and never sink into the ground, its wrist keeps by the driver's
const walk = await page.evaluate(() => { const { e, rig } = _S[0], by = rig.hc.C.byName, mats = () => Array.from(rig.hc.C.skel.boneMatrices), W = o => o.getWorldPosition(new THREE.Vector3());
  const dx = Math.sin(e.mesh.rotation.y), dz = Math.cos(e.mesh.rotation.y); rig.hc.C.skel.update(); const a = mats(), out = {};
  for (const [name, v, n] of [['walk', .011, 120], ['run', .04, 120]]) { const o = out[name] = { low: 9, lift: 0, hand: 0, w: 0 };
    for (let i = 0; i < n; i++) { e.x += dx * v; e.z += dz * v; e.mesh.position.set(e.x, WORLD.worldH(e.x, e.z), e.z); const t = (name === 'run' ? 5e5 : 4e5) + i * 16.7; tickPeople(1 / 60, t); tickCreatures(1 / 60, t);
      if (i > 40) { rig.root.parent.updateMatrixWorld(true); o.w = Math.max(o.w, rig.w[name] || 0);
        for (const k of ['leg0L_3', 'leg0R_3']) { const y = W(by[k]).y - WORLD.worldH(W(by[k]).x, W(by[k]).z); o.low = Math.min(o.low, y); o.lift = Math.max(o.lift, y); }
        o.hand = Math.max(o.hand, W(by.arm0R_2).distanceTo(W(rig.B.wrR))); } }
    for (const k in o) o[k] = +o[k].toFixed(3); }
  rig.hc.C.skel.update(); const b = mats(); let moved = 0; for (let i = 0; i < a.length; i++) moved = Math.max(moved, Math.abs(a[i] - b[i])); out.moved = +moved.toFixed(3); return out; });
console.log('  walk:', JSON.stringify(walk));
check(`its walk and its run turn the kit's bones (by ${walk.moved}); its toes lift (${walk.walk.lift}, ${walk.run.lift} m) and sink no lower than ${Math.min(walk.walk.low, walk.run.low)} m; its wrist within ${Math.max(walk.walk.hand, walk.run.hand)} m of the driver's`,
  walk.moved > .02 && walk.walk.w > .5 && walk.run.w > .5 && walk.walk.lift > .03 && walk.run.lift > .05 && Math.min(walk.walk.low, walk.run.low) > -.06 && Math.max(walk.walk.hand, walk.run.hand) < .2, walk);

// the levels: near and at 25 m the kit's body; at 60 m the driver's, with its weapon and eyes back
const lv = await page.evaluate(() => { const out = {}, f = _S[0], g0 = f.e.mesh, fx = -Math.sin(yaw), fz = -Math.cos(yaw);
  const at = (dd, k) => { CAM.position.set(g0.position.x - fx * dd, g0.position.y + 1.65, g0.position.z - fz * dd); CAM.updateMatrixWorld(true); for (let i = 0; i < 3; i++) { tickPeople(1 / 60, 5e5 + k * 100 + i * 17); tickCreatures(1 / 60, 5e5 + k * 100 + i * 17); }
    const H = f.rig.hc; let n = 0; if (H.W.visible) H.W.traverse(o => { if (o.isMesh && o.visible) n++; }); return { L: H.L, kit: n, driver: f.rig.mesh.visible, eyes: f.rig.eyeGlow.visible }; };
  out.near = at(5, 1); out.mid = at(25, 2); out.far = at(60, 3); out.back = at(5, 4); return out; });
check(`three levels: near the kit's body (${lv.near.kit} meshes), at 25 m the kit's (${lv.mid.kit}), at 60 m the driver's own with its lit eyes`,
  lv.near.L === 0 && lv.near.kit > 0 && !lv.near.driver && lv.mid.L === 1 && lv.mid.kit > 0 && !lv.mid.driver && lv.far.L === 2 && lv.far.driver && lv.far.eyes && lv.back.L === 0 && !lv.back.eyes, lv);

const dead = await page.evaluate(() => { const f = _S[1], rig = f.rig, before = []; rig.hc.W.traverse(o => { if (o.isMesh) before.push([o, o.material]); });
  f.e.hp = 0; killZoneEnemy(f.e, WORLD.scene, '');
  for (let i = 0; i < 120; i++) { tickPeople(1 / 60, 7e5 + i * 16.7); tickCreatures(1 / 60, 7e5 + i * 16.7); }
  rig.root.parent.updateMatrixWorld(true); const a = rig.hc.C.byName.spine0.getWorldPosition(new THREE.Vector3()), b = rig.B.hips.getWorldPosition(new THREE.Vector3());
  return { n: before.length, darker: before.filter(([o, m]) => o.material !== m && o.material.color && o.material.color.r <= m.color.r * .36 + 1e-6).length, gap: +Math.hypot(a.x - b.x, a.z - b.z).toFixed(3),
    low: +(a.y - f.e.mesh.position.y).toFixed(2), dead: !!f.e.dead }; });
console.log('  dead:', JSON.stringify(dead));
check(`killed, the kit's body is darkened and lies with its driver (its hips ${dead.gap} m from over the driver's, ${dead.low} m up)`, dead.dead && dead.darker === dead.n && dead.gap < .06 && dead.low < .35, dead);
// gone from the scene, it is dropped
const drop = await page.evaluate(() => { const f = _S[0]; f.e.mesh.parent.remove(f.e.mesh); tickPeople(1 / 60, 9e5); tickCreatures(1 / 60, 9e5); return { hc: !!f.rig.hc, held: HC_RIGS.has(f.rig) }; });
check('taken from the scene, its kit body is dropped', !drop.hc && !drop.held, drop);
await page.evaluate(() => { REN.render(scene, CAM); });
check('no page errors', g.errs.length === 0, g.errs.slice(0, 3));
await g.close();
