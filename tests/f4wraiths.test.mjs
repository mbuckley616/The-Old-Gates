// Card F4 (Session 1429): on the new look the Wraith and the Phantom wear the creature kit's (Session 1177's wraith, a hollow hood over
// a floating robe; Session 1428's phantom, its face kept), driven by their old bodies: the people's 17-bone rig (buildFoe's g.wraith)
// through the Skeleton's map less the legs (HC_KINDS' legless), sized by stature, with the driver's hunting stance taken off its turns
// (HC_WRAITH_REST) since the kit's plan already stands in it. Checked: on the kit's bones, keyed by the foe id; floating clear of the
// ground, not 0.35 m up as the driver's root is; the driver's hood darkness hidden with its body; the claws swing with a blow; three
// levels by distance. Picture: docs/prototypes/f4/f4-wraiths.jpg.
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
  for (const [i, type] of ['Wraith', 'Phantom'].entries()) { const at = i ? 1 : -1, X = px + fx * d + sx * at * 1.6, Z = pz + fz * d + sz * at * 1.6;
    const pr = buildFoe(type, X, Z, null, 0xa0e0ff), m = new THREE.Group(); m.add(pr.root); const e = { id: 'f4wraiths:' + i, name: type, mesh: m, limbs: { torso: pr.mesh, armR: pr.B.shR, person: pr } }; // as a dungeon builds a person-bodied foe (buildDungeon)
    const rig = e.limbs.person; e.x = X; e.z = Z;
    e.mesh.position.set(X, WORLD.worldH(X, Z), Z); e.mesh.rotation.y = Math.atan2(px - X, pz - Z); e.combatYaw = e.mesh.rotation.y; e.locked = false; e.mesh.visible = true;
    WORLD.scene.add(e.mesh); rig.e = e; _S.push({ k: type, e, rig }); }
  CAM.position.set(px, worldH(px, pz) + 1.65, pz); CAM.updateMatrixWorld(true);
  const want = () => _S.filter(f => !f.rig.hc && !f.rig.hcFail).length;
  let k = 0; HBODY.last = -1e9; while (want() && k++ < 100) { tickPeople(1 / 60, 2e5 + k * (HBODY.gap + 1)); tickCreatures(1 / 60, 2e5 + k * (HBODY.gap + 1)); }
  return { d, n: _S.length, kinds: _S.map(f => f.k + ':' + f.rig.hcKind), left: want(), each: Math.round(HC_BODY.ms / Math.max(1, HC_BODY.n)) }; });
console.log('  built:', JSON.stringify(made));

const who = await page.evaluate(() => _S.map(({ k, e, rig }) => { const H = rig.hc; let hood = false, lights = 0;
  if (H) H.C.root.traverse(o => { if (o.name === 'hood') hood = true; if (o.isMesh && o.material && o.material.emissive && o.material.emissive.b > .5) lights++; });
  return { k, hc: !!H, fail: !!rig.hcFail, plan: H && HC.PLANS[H.C.g.plan].name, seed: H && H.C.g.seed, want: H && HC.hashKey('foe:' + e.id), map: H ? H.map.length : 0, legs: H ? H.C.B.legs.length : -1,
    tris: H ? H.C.stats.tris : 0, hood, lights, driver: rig.mesh.visible, hollow: (rig.hollow || []).filter(m => m.visible).length, clear: H && H.C.plan.clear }; }));
console.log('  ghosts:', JSON.stringify(who));
check(`the Wraith and the Phantom wear the kit's (${who.map(w => w.plan + ', ' + w.tris + ' triangles').join('; ')}), keyed by their foe id, with no legs to move (${who.map(w => w.map).join(', ')} joints copied), built in ${made.each} ms each`,
  made.n === 2 && made.left === 0 && who.every(w => w.hc && w.legs === 0 && w.map === 10 && w.seed === w.want) && who[0].plan === 'Wraith' && who[1].plan === 'Phantom', who);
check(`the wraith's hollow hood and the phantom's face (${who.map(w => w.lights).join(', ')} lit eyes); the driver's body and its hood's darkness hidden while the kit shows`,
  who[0].hood && !who[1].hood && who.every(w => w.lights >= 2 && !w.driver && w.hollow === 0), who);

// it floats: through the glide its lowest point is clear of the ground but close to it (the driver's root is 0.35 m up for the old robe);
// its head stands near the driver's; its sway turns the kit's bones
const fl = await page.evaluate(() => {
  // the lowest vertex of a kit mesh, skinned here as the shader does: the kit's bone matrices are in its rig's frame (hcAttach's skel.update)
  const skinLow = (m, H) => { const P = m.geometry.attributes.position, SI = m.geometry.attributes.skinIndex, SW = m.geometry.attributes.skinWeight, bm = H.C.skel.boneMatrices, M = new THREE.Matrix4(), v = new THREE.Vector3(), a = new THREE.Vector3(), t = new THREE.Vector3(); let lo = 1e9;
    for (let i = 0; i < P.count; i += 3) { v.fromBufferAttribute(P, i); a.set(0, 0, 0); for (let j = 0; j < 4; j++) { const w = SW.getComponent(i, j); if (!w) continue; M.fromArray(bm, SI.getComponent(i, j) * 16); a.addScaledVector(t.copy(v).applyMatrix4(M), w); }
      a.applyMatrix4(H.C.rig.matrixWorld); lo = Math.min(lo, a.y); } return lo; };
  return _S.map(({ k, e, rig }) => { const H = rig.hc, W = o => o.getWorldPosition(new THREE.Vector3()), gy = e.mesh.position.y;
  H.C.skel.update(); const a = Array.from(H.C.skel.boneMatrices); let low = 9, high = -9, head = 0, drv = 0;
  for (let i = 0; i < 90; i++) { const t = 3e5 + i * 16.7; tickPeople(1 / 60, t); tickCreatures(1 / 60, t); rig.root.parent.updateMatrixWorld(true); H.C.skel.update();
    let lo = 9; for (const m of H.C.meshes) lo = Math.min(lo, skinLow(m, H) - gy); low = Math.min(low, lo); high = Math.max(high, lo);
    head = W(H.C.byName.head).y - gy; drv = W(rig.B.head).y - gy; }
  H.C.skel.update(); const b = Array.from(H.C.skel.boneMatrices); let moved = 0; for (let i = 0; i < a.length; i++) moved = Math.max(moved, Math.abs(a[i] - b[i]));
  return { k, low: +low.toFixed(3), high: +high.toFixed(3), head: +head.toFixed(2), drv: +drv.toFixed(2), root: +rig.root.position.y.toFixed(2), moved: +moved.toFixed(4) }; }); });
console.log('  float:', JSON.stringify(fl));
check(`each floats clear of the ground through its glide, its lowest point ${fl.map(f => f.low + '–' + f.high).join(', ')} m up (the driver's root ${fl[0].root} m), its head ${fl.map(f => f.head).join(', ')} m up (the driver's ${fl.map(f => f.drv).join(', ')}), its sway turning the kit's bones`,
  fl.every(f => f.low > .02 && f.high < .3 && Math.abs(f.head - f.drv) < .35 && f.moved > .001), fl);

// the stance: the kit's arms reach ahead of its chest at rest, as the plan's (the driver's own reach is taken off), not up over its head
const reach = await page.evaluate(() => _S.map(({ k, e, rig }) => { const H = rig.hc, by = H.C.byName, inv = new THREE.Matrix4().copy(e.mesh.matrixWorld).invert(), L = o => o.getWorldPosition(new THREE.Vector3()).applyMatrix4(inv);
  const ch = L(by.spine3 || by.spine2), hand = L(by.arm0R_2), head = L(by.head); return { k, ahead: +(hand.z - ch.z).toFixed(2), below: +(head.y - hand.y).toFixed(2) }; }));
console.log('  reach:', JSON.stringify(reach));
check(`its clawed arms reach ahead of its chest (${reach.map(r => r.ahead).join(', ')} m), below its head (${reach.map(r => r.below).join(', ')} m)`, reach.every(r => r.ahead > .25 && r.below > 0), reach);

// a blow: the wind-up raises the kit's claw over its head and the rake brings it down
const blow = await page.evaluate(() => _S.map(({ e, rig }) => { const by = rig.hc.C.byName, W = o => o.getWorldPosition(new THREE.Vector3()), gy = e.mesh.position.y; const out = [];
  for (const [wind, anim] of [[0, 0], [1, 0], [0, .17]]) { tickPeople(1 / 60, 4e5); tickCreatures(1 / 60, 4e5); e._wind = wind; e.atkAnim = anim; attackPose(e, true); rig.root.parent.updateMatrixWorld(true); out.push(+(W(by.arm0R_2).y - gy).toFixed(2)); }
  e._wind = 0; e.atkAnim = 0; return out; }));
console.log('  blow:', JSON.stringify(blow));
check(`a blow swings the kit's claw: its wrist ${blow.map(b => b[0]).join(', ')} m up at rest, ${blow.map(b => b[1]).join(', ')} at the wind-up, ${blow.map(b => b[2]).join(', ')} in the rake`, blow.every(b => b[1] > b[0] + .2 && b[2] < b[1] - .2), blow);

// the picture: the two from 4 m
await page.evaluate(() => { const a = _S[0].e, b = _S[1].e, mx = (a.x + b.x) / 2, mz = (a.z + b.z) / 2, fx = -Math.sin(yaw), fz = -Math.cos(yaw); px = mx - fx * 4.5; pz = mz - fz * 4.5; pitch = .05; });
for (let i = 0; i < 8; i++) { await page.evaluate(() => { tickPeople(1 / 60, performance.now()); tickCreatures(1 / 60, performance.now()); }); await g.frames(1); }
await page.screenshot({ path: path.join(OUT, 'f4-wraiths.jpg') });

// the levels: near and at 25 m the kit's body; at 60 m the driver's, with its hood's darkness back
const lv = await page.evaluate(() => { const out = {}, f = _S[0], g0 = f.e.mesh, fx = -Math.sin(yaw), fz = -Math.cos(yaw);
  const at = (dd, k) => { CAM.position.set(g0.position.x - fx * dd, g0.position.y + 1.65, g0.position.z - fz * dd); CAM.updateMatrixWorld(true); for (let i = 0; i < 3; i++) { tickPeople(1 / 60, 5e5 + k * 100 + i * 17); tickCreatures(1 / 60, 5e5 + k * 100 + i * 17); }
    const H = f.rig.hc; let n = 0; if (H.W.visible) H.W.traverse(o => { if (o.isMesh && o.visible) n++; }); return { L: H.L, kit: n, driver: f.rig.mesh.visible, hollow: f.rig.hollow.every(m => m.visible) }; };
  out.near = at(5, 1); out.mid = at(25, 2); out.far = at(60, 3); out.back = at(5, 4); return out; });
check(`three levels: near the kit's body (${lv.near.kit} meshes), at 25 m still the kit's (${lv.mid.kit}), at 60 m the driver's own with its hood's darkness back`,
  lv.near.L === 0 && lv.near.kit > 1 && !lv.near.driver && !lv.near.hollow && lv.mid.L === 1 && lv.mid.kit > 0 && !lv.mid.driver && lv.far.L === 2 && lv.far.driver && lv.far.hollow && lv.back.L === 0 && !lv.back.hollow, lv);

const drop = await page.evaluate(() => { const f = _S[0]; f.e.mesh.parent.remove(f.e.mesh); tickPeople(1 / 60, 9e5); tickCreatures(1 / 60, 9e5); return { hc: !!f.rig.hc, held: HC_RIGS.has(f.rig) }; });
check('taken from the scene, its kit body is dropped', !drop.hc && !drop.held, drop);
await page.evaluate(() => { REN.render(scene, CAM); });
check('no page errors', g.errs.length === 0, g.errs.slice(0, 3));
await g.close();
