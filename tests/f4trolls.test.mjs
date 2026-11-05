// Card F4 (Session 1378): on the new look the trolls (the Cave, Forest and Frost Troll) wear the creature kit's troll (OG-041's hunched cave
// troll, Session 926, with its lashed-on armour, Session 945), driven by their old body: the people's 17-bone rig (buildFoe's g.troll)
// through the Skeleton's map (HC_PMAP), sized by its legs and its ankles held over the driver's (hcLegIK), as the goblin's. It holds the
// kit's maul (Session 1378, the game's S208 maul) and the driver's is hidden while it shows; its hide is its kind's (FOE_DRESS), its eyes the
// driver's. Checked: each on the kit's 23 bones, keyed by its foe id, in its own hide; its feet on the ground through the stand, the walk and
// the run; three levels by distance, the middle one baked; killed, darkened, lying with its driver. Picture: docs/prototypes/f4/f4-trolls.jpg.
import { boot, check, ROOT } from './lib/game.mjs';
import fs from 'fs'; import path from 'path';
const OUT = path.join(ROOT, 'docs', 'prototypes', 'f4'); fs.mkdirSync(OUT, { recursive: true });

const g = await boot({ look: 'new' }); const { page } = g;
await g.intoWorld();

const made = await page.evaluate(() => { forceTime(12);
  { const t1 = performance.now(); while (JOBS.length && performance.now() - t1 < 20000) runJobs(); }
  const fx = -Math.sin(yaw), fz = -Math.cos(yaw), sx = -fz, sz = fx;
  const clear = (x, z) => { for (let dx = -2; dx <= 2; dx += .5) for (let dz = -2; dz <= 2; dz += .5) if (WORLD.solidAt(x + dx, z + dz)) return false; return true; };
  let d = 7; for (; d < 60; d += 3) { let ok = true; for (let i = -1; i <= 1; i++) if (!clear(px + fx * d + sx * i * 2.4, pz + fz * d + sz * i * 2.4)) { ok = false; break; } if (ok) break; }
  window._S = [];
  // the Forest and Frost Trolls as the world spawns them; the Cave Troll, a dungeon's (buildDungeon), on its own body at its dungeon scale
  for (const [i, type] of ['Forest Troll', 'Frost Troll', 'Cave Troll'].entries()) { const at = i - 1, X = px + fx * d + sx * at * 2.4, Z = pz + fz * d + sz * at * 2.4;
    let e; if (i < 2) e = keyFoe(buildZoneEnemy(WORLD.scene, [], X, Z, type, null), 'f4trolls:' + i);
    else { const pr = buildFoe(type, X, Z, null, 0xff2200), m = new THREE.Group(); pr.root.scale.multiplyScalar(1.5); m.add(pr.root); e = { id: 'f4trolls:' + i, name: type, mesh: m, limbs: { person: pr } }; }
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
console.log('  trolls:', JSON.stringify(who));
const hex = h => [(h >> 16 & 255) / 255, (h >> 8 & 255) / 255, (h & 255) / 255].map(v => +v.toFixed(2));
check(`the three trolls wear the kit's troll (${who.map(w => w.k + ': ' + w.bones + ' bones, ' + w.tris + ' triangles').join('; ')}), keyed by their foe id, each in its kind's hide, built in ${made.each} ms each`,
  made.n === 3 && made.left === 0 && who.every(w => w.hc && w.bones === 23 && w.map === 16 && w.seed === w.want) && new Set(who.map(w => w.plan)).size === 3
  && who.every((w, i) => w.coat.join() === hex([0x5a6e40, 0xaebac2, 0x6e7a5c][i]).join()), who);
check(`each holds the kit's maul (${who.map(w => w.gear.join('+') || 'nothing').join(', ')}); the driver's maul and body hidden while the kit shows`,
  who.every(w => w.gear.join() === 'maul' && !w.driver && w.drvGear === false), who);

// its size, by its legs: its hips over the driver's, its ankles at the driver's, its toes on the ground at its stand
const size = await page.evaluate(() => _S.map(({ k, e, rig }) => { for (let i = 0; i < 30; i++) { tickPeople(1 / 60, 3e5 + i * 16.7); tickCreatures(1 / 60, 3e5 + i * 16.7); }
  rig.root.parent.updateMatrixWorld(true); const by = rig.hc.C.byName, W = o => o.getWorldPosition(new THREE.Vector3());
  const a = W(by.spine0), b = W(rig.B.hips), gy = e.mesh.position.y;
  return { k, hand: +W(by.arm0R_2).distanceTo(W(rig.B.wrR)).toFixed(3), hips: +Math.hypot(a.x - b.x, a.z - b.z).toFixed(3), up: +(a.y - b.y).toFixed(3), head: +(W(by.head).y - gy).toFixed(3), drvHead: +(W(rig.B.head).y - gy).toFixed(3), toes: ['leg0L_3', 'leg0R_3'].map(n => +(W(by[n]).y - gy).toFixed(3)),
    ankles: [['anL', 'leg0L_2'], ['anR', 'leg0R_2']].map(([d, n]) => +(W(by[n]).y - W(rig.B[d]).y).toFixed(3)) }; }));
console.log('  size:', JSON.stringify(size));
check(`each stands at its driver's size, by its legs: its head ${size.map(s => s.head).join(', ')} m up (the driver's ${size.map(s => s.drvHead).join(', ')}; the kit's troll stoops), its hips over the driver's (${size.map(s => s.hips).join(', ')} m across), its toes on the ground (${size.map(s => s.toes.join(', ')).join('; ')} m)`,
  size.length === 3 && size.every(s => s.hips < .05 && s.head < s.drvHead && s.head > .85 * s.drvHead && s.toes.every(y => Math.abs(y) < .06)), size);

// Session 1877 (L4, OG-018 and OG-088): a gate's cave troll wears its school's: Tine's basalt troll, Uisce's drowned-pale one, Cloch's stone
// troll fused with rock; any other school's, and an occupied gate's, the moss-backed troll. The school is read off the gate's world entry
const sch = await page.evaluate(() => { const realC = window.hcGateCond, realP = currentPortal, out = {}; window.hcGateCond = () => 'steady';
  for (const th of ['elemental', 'deep', 'ruins', 'haunted', 'goblin']) { const e = WORLD_DUNGEONS.find(d => d.theme === th && seededRng('gaoth', d.seed)() >= 1 / 6 && (th === 'goblin' || !d.occupied));
    if (!e) { out[th] = 'none'; continue; } currentPortal = { seed: e.seed }; out[th] = hcGateSchool() + ':' + hcTrollKind('Cave Troll') + ':' + hcTrollKind('Forest Troll'); }
  window.hcGateCond = () => null; out.outside = String(hcGateSchool()) + ':' + hcTrollKind('Cave Troll'); window.hcGateCond = realC; currentPortal = realP; return out; });
console.log('  schools:', JSON.stringify(sch));
check(`a gate's school picks its cave troll (${Object.entries(sch).map(([k, v]) => k + ' ' + v).join('; ')}); a Forest Troll keeps its own`,
  sch.elemental === 'tine:Cave Troll (tine):Forest Troll' && sch.deep === 'uisce:Cave Troll (uisce):Forest Troll' && sch.ruins === 'cloch:Cave Troll (cloch):Forest Troll'
  && sch.haunted === 'scath:Cave Troll:Forest Troll' && /^null:Cave Troll:/.test(sch.goblin) && sch.outside === 'null:Cave Troll', sch);
const gt = await page.evaluate(() => { const fx = -Math.sin(yaw), fz = -Math.cos(yaw), sx = -fz, sz = fx, a = _S[1].e, real = window.hcGateSchool; window._GT = [];
  for (const [i, s] of ['tine', 'uisce', 'cloch'].entries()) { window.hcGateSchool = () => s; const X = a.x + fx * 3.5 + sx * (i - 1) * 2.4, Z = a.z + fz * 3.5 + sz * (i - 1) * 2.4;
    const pr = buildFoe('Cave Troll', X, Z, null, 0xff2200), m = new THREE.Group(); pr.root.scale.multiplyScalar(1.5); m.add(pr.root);
    const e = { id: 'f4trolls:gate:' + s, name: 'Cave Troll', mesh: m, limbs: { person: pr } }; e.x = X; e.z = Z; m.position.set(X, WORLD.worldH(X, Z), Z); m.rotation.y = Math.atan2(px - X, pz - Z);
    e.combatYaw = m.rotation.y; e.locked = false; WORLD.scene.add(m); pr.e = e; _GT.push({ s, e, rig: pr }); }
  window.hcGateSchool = real; let n = 0; HBODY.last = -1e9; const want = () => _GT.filter(f => !f.rig.hc && !f.rig.hcFail).length;
  while (want() && n++ < 120) { tickPeople(1 / 60, 2.6e5 + n * (HBODY.gap + 1)); tickCreatures(1 / 60, 2.6e5 + n * (HBODY.gap + 1)); }
  for (let i = 0; i < 30; i++) { tickPeople(1 / 60, 3.6e5 + i * 16.7); tickCreatures(1 / 60, 3.6e5 + i * 16.7); }
  const moss = _S[2].rig.hc.C.stats.tris;
  return _GT.map(({ s, e, rig }) => { const H = rig.hc; if (!H) return { s, hc: false, kind: rig.hcKind, fail: !!rig.hcFail }; rig.root.parent.updateMatrixWorld(true);
    const by = H.C.byName, W = o => o.getWorldPosition(new THREE.Vector3()), gy = e.mesh.position.y, P = HC.PLANS[H.C.g.plan] || {};
    const lit = H.C.plan.glow ? H.C.plan.glow.color.map(v => +v.toFixed(2)).join('/') : 'none';
    return { s, hc: true, kind: rig.hcKind, plan: H.C.g.plan, seed: H.C.g.seed, want: HC.hashKey('foe:' + e.id), bones: H.C.bones.length, map: H.map.length, tris: H.C.stats.tris, moss,
      gear: (H.C.B.gear || []).join('+'), driver: rig.mesh.visible, coat: H.C.plan.palette.coat.map(v => +v.toFixed(2)), own: (P.palette || {}).coat ? P.palette.coat.map(v => +v.toFixed(2)) : null, lit,
      head: +(W(by.head).y - gy).toFixed(2), drvHead: +(W(rig.B.head).y - gy).toFixed(2), toes: ['leg0L_3', 'leg0R_3'].map(nm => +(W(by[nm]).y - gy).toFixed(3)) }; }); });
console.log('  gate trolls:', JSON.stringify(gt));
check(`each school's troll is built on the kit's 23 bones in its plan's own hide (${gt.map(t => t.s + ': ' + t.plan + ', ' + t.tris + ' triangles, cracks ' + t.lit).join('; ')}; the moss troll ${gt[0] && gt[0].moss}), keyed by its foe id, holding the maul`,
  gt.length === 3 && gt.every(t => t.hc && t.bones === 23 && t.map === 16 && t.seed === t.want && t.gear === 'maul' && !t.driver && t.coat.join() === (t.own || []).join())
  && gt.map(t => t.plan).join() === 'game:Cave Troll (tine),game:Cave Troll (uisce),game:Cave Troll (cloch)' && gt[2].tris > gt[2].moss && gt[0].lit !== 'none' && gt[2].lit !== 'none' && gt[1].lit === 'none', gt);
check(`each stands at its driver's size (heads ${gt.map(t => t.head).join(', ')} m up, the drivers' ${gt.map(t => t.drvHead).join(', ')}), its toes on the ground (${gt.map(t => (t.toes || []).join(', ')).join('; ')} m)`,
  gt.every(t => t.hc && t.head < t.drvHead + .1 && t.head > .8 * t.drvHead && t.toes.every(y => Math.abs(y) < .06)), gt);
await page.evaluate(() => { const m = _GT[1].e.mesh, fx = -Math.sin(yaw), fz = -Math.cos(yaw); window._P = [px, pz]; for (const f of _S) f.e.mesh.visible = false; px = m.position.x - fx * 6; pz = m.position.z - fz * 6; pitch = .06; });
for (let i = 0; i < 8; i++) { await page.evaluate(() => { tickPeople(1 / 60, performance.now()); tickCreatures(1 / 60, performance.now()); }); await g.frames(1); }
await page.screenshot({ path: path.join(OUT, 'f4-gatetrolls.jpg') });
await page.evaluate(() => { for (const f of _GT) f.e.mesh.parent.remove(f.e.mesh); for (const f of _S) f.e.mesh.visible = true; [px, pz] = _P; });

// the picture: the two from 3.5 m
await page.evaluate(() => { const a = _S[1].e, mx = a.x, mz = a.z, fx = -Math.sin(yaw), fz = -Math.cos(yaw); px = mx - fx * 6.5; pz = mz - fz * 6.5; pitch = .02; });
for (let i = 0; i < 8; i++) { await page.evaluate(() => { tickPeople(1 / 60, performance.now()); tickCreatures(1 / 60, performance.now()); }); await g.frames(1); }
await page.screenshot({ path: path.join(OUT, 'f4-trolls.jpg') });

// a walk, then a run: the kit's bones turn, its toes lift with the stride and never sink into the ground, its wrist keeps by the driver's
const hand0 = size[0].hand;
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
check(`its walk and its run turn the kit's bones (by ${walk.moved}); its toes lift (${walk.walk.lift}, ${walk.run.lift} m) and sink no lower than ${Math.min(walk.walk.low, walk.run.low)} m; its wrist within ${Math.max(walk.walk.hand, walk.run.hand)} m of the driver's (${hand0} at a stand: the kit's arms hang to its knees)`,
  walk.moved > .02 && walk.walk.w > .5 && walk.run.w > .5 && walk.walk.lift > .03 && walk.run.lift > .05 && Math.min(walk.walk.low, walk.run.low) > -.06 && Math.max(walk.walk.hand, walk.run.hand) < hand0 + .25, walk);

// the levels: near and at 25 m the kit's body; at 60 m the driver's, with its knife back
const lv = await page.evaluate(() => { const out = {}, f = _S[0], g0 = f.e.mesh, fx = -Math.sin(yaw), fz = -Math.cos(yaw);
  const at = (dd, k) => { CAM.position.set(g0.position.x - fx * dd, g0.position.y + 1.65, g0.position.z - fz * dd); CAM.updateMatrixWorld(true); for (let i = 0; i < 3; i++) { tickPeople(1 / 60, 5e5 + k * 100 + i * 17); tickCreatures(1 / 60, 5e5 + k * 100 + i * 17); }
    const H = f.rig.hc; let n = 0; if (H.W.visible) H.W.traverse(o => { if (o.isMesh && o.visible) n++; }); return { L: H.L, kit: n, driver: f.rig.mesh.visible, gear: f.rig.mesh.visible && f.rig.B.gear.visible }; };
  out.near = at(5, 1); out.mid = at(25, 2); out.baked = !!f.rig.hc.mid && f.rig.hc.mid.visible; out.far = at(60, 3); out.back = at(5, 4); return out; });
check(`three levels: near the kit's body (${lv.near.kit} meshes), at 25 m baked into one (${lv.mid.kit}), at 60 m the driver's own, its maul back`,
  lv.near.L === 0 && lv.near.kit > 1 && !lv.near.driver && lv.mid.L === 1 && lv.baked && !lv.mid.driver && lv.far.L === 2 && lv.far.driver && lv.far.gear && lv.back.L === 0, lv);

const dead = await page.evaluate(() => { const f = _S[1], rig = f.rig, before = []; rig.hc.W.traverse(o => { if (o.isMesh) before.push([o, o.material]); });
  f.e.hp = 0; killZoneEnemy(f.e, WORLD.scene, '');
  for (let i = 0; i < 120; i++) { tickPeople(1 / 60, 7e5 + i * 16.7); tickCreatures(1 / 60, 7e5 + i * 16.7); }
  rig.root.parent.updateMatrixWorld(true); const a = rig.hc.C.byName.spine0.getWorldPosition(new THREE.Vector3()), b = rig.B.hips.getWorldPosition(new THREE.Vector3());
  return { n: before.length, darker: before.filter(([o, m]) => o.material !== m && o.material.color && o.material.color.r <= m.color.r * .36 + 1e-6).length, gap: +Math.hypot(a.x - b.x, a.z - b.z).toFixed(3),
    low: +(a.y - f.e.mesh.position.y).toFixed(2), dead: !!f.e.dead }; });
console.log('  dead:', JSON.stringify(dead));
check(`killed, the kit's body is darkened and lies with its driver (its hips ${dead.gap} m from over the driver's, ${dead.low} m up)`, dead.dead && dead.darker === dead.n && dead.gap < .08 && dead.low < .6, dead);
// gone from the scene, it is dropped
const drop = await page.evaluate(() => { const f = _S[0]; f.e.mesh.parent.remove(f.e.mesh); tickPeople(1 / 60, 9e5); tickCreatures(1 / 60, 9e5); return { hc: !!f.rig.hc, held: HC_RIGS.has(f.rig) }; });
check('taken from the scene, its kit body is dropped', !drop.hc && !drop.held, drop);
await page.evaluate(() => { REN.render(scene, CAM); });
check('no page errors', g.errs.length === 0, g.errs.slice(0, 3));
await g.close();
