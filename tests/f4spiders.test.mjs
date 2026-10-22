// Card F4's next family (Session 1319): on the new look the Spider wears the creature kit's giant spider (OG-041: pale, thorned, egg sacs),
// driven by its old 28-bone rig (buildSpider, tickSpider). The body and abdomen copy the driver's; each of the eight legs is the kit's own
// solve (HC.footAt) on a foot put where the driver's foot is, counted from rest. Checked: built on the kit's skeleton keyed by its foe id,
// at the coarser cell; standing at the driver's footprint; a walk that keeps planted feet planted; three levels; killed, it curls with its
// driver and darkens. Picture: docs/prototypes/f4/f4-spiders.jpg. Session 1324: the middle level is one baked mesh. Session 1325: the Sand
// Scorpion on the kit's Dunescorpion, its tail and pincers following the driver's tail and fangs (f4-scorpion.jpg).
import { boot, check, ROOT } from './lib/game.mjs';
import fs from 'fs'; import path from 'path';
const OUT = path.join(ROOT, 'docs', 'prototypes', 'f4'); fs.mkdirSync(OUT, { recursive: true });

const g = await boot({ look: 'new' }); const { page } = g;
await g.intoWorld();

const made = await page.evaluate(() => { forceTime(12);
  { const t1 = performance.now(); while (JOBS.length && performance.now() - t1 < 20000) runJobs(); }
  const fx = -Math.sin(yaw), fz = -Math.cos(yaw), sx = -fz, sz = fx;
  const clear = (x, z) => { for (let dx = -2; dx <= 2; dx += .5) for (let dz = -2; dz <= 2; dz += .5) if (WORLD.solidAt(x + dx, z + dz)) return false; return true; };
  let d = 6; for (; d < 60; d += 3) if (clear(px + fx * d - sx * 1.2, pz + fz * d - sz * 1.2) && clear(px + fx * d + sx * 1.2, pz + fz * d + sz * 1.2)) break;
  window._W = [-1, 1].map((s, i) => { const x = px + fx * d + sx * s * 1.2, z = pz + fz * d + sz * s * 1.2;
    const e = keyFoe(buildZoneEnemy(WORLD.scene, [], x, z, 'Spider', null), 'f4spider:' + i); e.mesh.position.set(x, WORLD.worldH(x, z), z); e.mesh.rotation.y = Math.atan2(px - x, pz - z);
    e.combatYaw = e.mesh.rotation.y; e.locked = false; e.mesh.visible = true; if (!e.mesh.parent) WORLD.scene.add(e.mesh); const rig = e.limbs && e.limbs.wolf; if (rig) rig.e = e; return { e, rig }; });
  CAM.position.set(px, worldH(px, pz) + 1.65, pz); CAM.updateMatrixWorld(true);
  const want = () => _W.filter(f => f.rig && hcOk(f.rig) && !f.rig.hc && !f.rig.hcFail).length;
  let k = 0; const t0 = performance.now(); HBODY.last = -1e9; HC_BODY.ms = 0; HC_BODY.n = 0; while (want() && k++ < 100) tickCreatures(1 / 60, 2e5 + k * (HBODY.gap + 1));
  return { d, ticks: k, left: want(), ms: Math.round(performance.now() - t0), each: Math.round(HC_BODY.ms / Math.max(1, HC_BODY.n)) }; });
console.log('  built:', JSON.stringify(made));

const who = await page.evaluate(() => _W.map(({ e, rig }) => { const H = rig.hc;
  return { id: e.id, hc: !!H, fail: !!rig.hcFail, plan: H ? H.C.g.plan : null, seed: H ? H.C.g.seed : null, want: H ? HC.hashKey('wolf:' + e.id) : null, bones: H ? H.C.bones.length : 0,
    feet: H && H.feet ? H.feet.length : 0, tris: H ? H.C.stats.tris : 0, cell: H ? H.C.stats.cell : 0, scale: H ? +H.W.scale.x.toFixed(3) : 0 }; }));
console.log('  spiders:', JSON.stringify(who));
check(`the spiders wear the kit's giant spider on its own skeleton (${who.map(w => w.bones).join(', ')} bones, eight feet), keyed by their foe id, at the coarser cell (${who[0].tris} triangles), built in ${made.each} ms each`,
  who.every(w => w.hc && w.plan === 'game:Spider' && w.bones === 46 && w.feet === 8 && w.seed === w.want && w.cell > .02 && w.tris < 40000) && who[0].seed !== who[1].seed && made.left === 0, who);
const same = await page.evaluate(() => _W.every(f => JSON.stringify(HC.toSaved(HC.genome(hcPlan('Spider'), 'wolf:' + f.e.id))) === JSON.stringify(HC.toSaved(f.rig.hc.C.g))));
check('a spider\'s genome is the same rolled again from its id', same);

// the footprint: standing, each of the kit's eight toes on the ground within a hand of where the driver's foot is
const stand = await page.evaluate(() => { const out = []; for (const { e, rig } of _W) { for (let i = 0; i < 3; i++) tickCreatures(1 / 60, 2.5e5 + i * 16.7); rig.root.parent.updateMatrixWorld(true);
  const H = rig.hc, by = H.C.byName; let dy = 0, dxz = 0;
  for (const F of H.feet) { const L = H.C.B.legs[F.i], t = by[L.names[L.names.length - 1]].getWorldPosition(new THREE.Vector3()), p = rig.B['tib' + F.n].localToWorld(new THREE.Vector3(F.lt, 0, 0));
    dy = Math.max(dy, Math.abs(t.y - e.mesh.position.y)); dxz = Math.max(dxz, Math.hypot(t.x - p.x, t.z - p.z)); }
  const b = by.spine0.getWorldPosition(new THREE.Vector3()).y - e.mesh.position.y, d = rig.B.body.getWorldPosition(new THREE.Vector3()).y - e.mesh.position.y;
  out.push({ dy: +dy.toFixed(3), dxz: +dxz.toFixed(3), body: +b.toFixed(2), drv: +d.toFixed(2) }); } return out; });
check(`standing, every toe of the kit's spider is on the ground (within ${Math.max(...stand.map(s => s.dy))} m) and by the driver's foot (within ${Math.max(...stand.map(s => s.dxz))} m); its body ${stand[0].body} m up to the driver's ${stand[0].drv}`,
  stand.every(s => s.dy < .04 && s.dxz < .12 && s.body > s.drv * .7 && s.body < s.drv * 2.5), stand);

// a walk: the bones turn, a toe on a planted driver foot stays put, and a lifted one rises
const walk = await page.evaluate(() => { const { e, rig } = _W[0], H = rig.hc, by = H.C.byName, mats = () => Array.from(H.C.skel.boneMatrices);
  const dx = Math.sin(e.mesh.rotation.y), dz = Math.cos(e.mesh.rotation.y); H.C.skel.update(); const a = mats(); let slide = 0, n = 0, lift = 0, miss = 0; const prev = new Map();
  for (let i = 0; i < 90; i++) { e.x += dx * .012; e.z += dz * .012; e.mesh.position.set(e.x, WORLD.worldH(e.x, e.z), e.z); tickCreatures(1 / 60, 3e5 + i * 16.7); rig.root.parent.updateMatrixWorld(true);
    for (const F of H.feet) { const L = H.C.B.legs[F.i], t = by[L.names[L.names.length - 1]].getWorldPosition(new THREE.Vector3()), p = rig.B['tib' + F.n].localToWorld(new THREE.Vector3(F.lt, 0, 0));
      const up = p.y - e.mesh.position.y, q = prev.get(F.n); lift = Math.max(lift, t.y - e.mesh.position.y);
      if (i > 30 && q && up < .004 && q.up < .004) { slide = Math.max(slide, Math.hypot(t.x - q.t.x, t.z - q.t.z)); n++; }
      if (i > 30) miss = Math.max(miss, Math.abs((t.y - e.mesh.position.y) - up)); prev.set(F.n, { t, up }); } }
  H.C.skel.update(); const b = mats(); let moved = 0; for (let i = 0; i < a.length; i++) moved = Math.max(moved, Math.abs(a[i] - b[i]));
  return { moved: +moved.toFixed(3), slide: +slide.toFixed(4), n, lift: +lift.toFixed(3), miss: +miss.toFixed(3), w: Object.fromEntries(Object.entries(rig.w).map(([k, v]) => [k, +v.toFixed(2)])) }; });
console.log('  walk:', JSON.stringify(walk));
check(`walking, the kit's bones turn (by ${walk.moved}); a toe on a planted foot slides at most ${walk.slide} m a frame (${walk.n} samples), a lifted one rises ${walk.lift} m, every toe within ${walk.miss} m of its driver's height`,
  walk.w.walk > .5 && walk.moved > .02 && walk.n > 50 && walk.slide < .006 && walk.lift > .015 && walk.miss < .04, walk);

// the levels: near, the hide and its bits; at 25 m, the hide and its bits baked into one mesh (Session 1324); at 60 m, the driver
const lv = await page.evaluate(() => { const out = {}, f = _W[0], g0 = f.e.mesh, fx = -Math.sin(yaw), fz = -Math.cos(yaw);
  const at = (dd, k) => { CAM.position.set(g0.position.x - fx * dd, g0.position.y + 1.65, g0.position.z - fz * dd); CAM.updateMatrixWorld(true); for (let i = 0; i < 3; i++) tickCreatures(1 / 60, 4e5 + k * 100 + i * 17);
    const H = f.rig.hc; let n = 0; if (H.W.visible) H.W.traverse(o => { if (o.isMesh && o.visible) n++; }); return { L: H.L, kit: n, driver: f.rig.mesh.visible }; };
  out.near = at(5, 1); out.mid = at(25, 2);
  // the baked mesh against the bits it was baked from, at this pose: a vertex of each bit not small, skinned, against the bit's own
  { const H = f.rig.hc, M = H.mid, small = new Set(H.small); f.rig.root.parent.updateMatrixWorld(true); let base = 0, err = 0, n = 0;
    H.C.root.traverse(o => { if (!o.isMesh || o === M || small.has(o)) return; const pa = o.geometry.attributes.position, i = pa.count >> 1;
      if (H.hide.includes(o)) { base += pa.count; return; }
      const a = o.localToWorld(new THREE.Vector3().fromBufferAttribute(pa, i)), b = M.getVertexPosition(base + i, new THREE.Vector3()); err = Math.max(err, a.distanceTo(b)); n++; base += pa.count; });
    out.mid.bake = { n, err: +err.toFixed(4), tris: M.geometry.index.count / 3, ms: Math.round(H.bakeMs) }; }
  out.far = at(60, 3); out.back = at(5, 4); return out; });
console.log('  levels:', JSON.stringify(lv));
check(`three levels: near the hide and its thorns, eggs and eyes (${lv.near.kit} meshes), at 25 m one baked mesh (${lv.mid.kit}: ${lv.mid.bake.tris} triangles, ${lv.mid.bake.n} bits within ${lv.mid.bake.err} m of where they hang, baked in ${lv.mid.bake.ms} ms), at 60 m the driver's own body`,
  lv.near.L === 0 && !lv.near.driver && lv.near.kit > 20 && lv.mid.L === 1 && lv.mid.kit === 1 && lv.mid.bake.n > 20 && lv.mid.bake.err < .002 && !lv.mid.driver && lv.far.L === 2 && lv.far.driver && lv.back.L === 0 && lv.back.kit === lv.near.kit, lv);

// the picture, from 3 m
await page.evaluate(() => { const a = _W[0].e, b = _W[1].e, mx = (a.x + b.x) / 2, mz = (a.z + b.z) / 2, fx = -Math.sin(yaw), fz = -Math.cos(yaw); px = mx - fx * 3; pz = mz - fz * 3; pitch = -.3; });
for (let i = 0; i < 8; i++) { await page.evaluate(() => tickCreatures(1 / 60, performance.now())); await g.frames(1); }
await page.screenshot({ path: path.join(OUT, 'f4-spiders.jpg') });

const dead = await page.evaluate(() => { const f = _W[1], rig = f.rig, before = []; rig.hc.W.traverse(o => { if (o.isMesh) before.push([o, o.material]); });
  const H = rig.hc, by = H.C.byName, toes = () => { rig.root.parent.updateMatrixWorld(true); return H.feet.map(F => { const L = H.C.B.legs[F.i]; return by[L.names[L.names.length - 1]].getWorldPosition(new THREE.Vector3()); }); };
  const c = by.spine0.getWorldPosition(new THREE.Vector3()), spread = () => toes().reduce((s, t) => s + Math.hypot(t.x - c.x, t.z - c.z), 0) / 8, s0 = spread();
  f.e.hp = 0; killZoneEnemy(f.e, WORLD.scene, '');
  for (let i = 0; i < 90; i++) { tickPeople(1 / 60, 7e5 + i * 16.7); tickCreatures(1 / 60, 7e5 + i * 16.7); }
  return { dead: !!f.e.dead, cloned: before.filter(([o, m]) => o.material !== m).length, n: before.length, s0: +s0.toFixed(2), s1: +spread().toFixed(2), kit: !!rig.hc && rig.hc.W.parent === rig.root }; });
check(`killed, its kit body is darkened and curls its legs in with the driver's (feet ${dead.s0} m from the middle, then ${dead.s1})`, dead.dead && dead.kit && dead.cloned === dead.n && dead.s1 < dead.s0 * .9, dead);
// the Sand Scorpion (Session 1325): the kit's Dunescorpion on the same driver; its tail and pincers from the driver's tail bone and fangs
const sc = await page.evaluate(() => { const a = _W[0].e, fx = -Math.sin(yaw), fz = -Math.cos(yaw), x = a.x - fx * 1.5, z = a.z - fz * 1.5;
  const e = keyFoe(buildZoneEnemy(WORLD.scene, [], x, z, 'Sand Scorpion', null), 'f4scorp:0'); e.mesh.position.set(x, WORLD.worldH(x, z), z); e.mesh.rotation.y = Math.atan2(px - x, pz - z);
  e.combatYaw = e.mesh.rotation.y; e.locked = false; e.mesh.visible = true; if (!e.mesh.parent) WORLD.scene.add(e.mesh); const rig = e.limbs && e.limbs.wolf; if (rig) rig.e = e; window._S = { e, rig };
  CAM.position.set(x - fx * 4, e.mesh.position.y + 1.65, z - fz * 4); CAM.updateMatrixWorld(true);
  let k = 0; HBODY.last = -1e9; HC_BODY.ms = 0; HC_BODY.n = 0; while (rig && !rig.hc && !rig.hcFail && k++ < 60) tickCreatures(1 / 60, 8e5 + k * (HBODY.gap + 1));
  const H = rig && rig.hc; if (!H) return { hc: false, fail: rig && rig.hcFail };
  const by = H.C.byName, loc = b => rig.root.worldToLocal(b.getWorldPosition(new THREE.Vector3())), at = (w, l, n) => { e._wind = w; e._lunge = l; for (let i = 0; i < n; i++) tickCreatures(1 / 60, 9e5 + k++ * 16.7); rig.root.parent.updateMatrixWorld(true);
    return { sting: loc(by.tail6), claw: loc(by.arm0L_3), clawR: loc(by.arm0R_3) }; };
  const r = at(0, null, 20); let dy = 0; for (const F of H.feet) { const L = H.C.B.legs[F.i]; dy = Math.max(dy, Math.abs(by[L.names[L.names.length - 1]].getWorldPosition(new THREE.Vector3()).y - e.mesh.position.y)); }
  const w = at(1, null, 20), s = at(0, .15, 1), f = v => [+v.x.toFixed(2), +v.y.toFixed(2), +v.z.toFixed(2)];
  return { hc: true, plan: H.C.g.plan, bones: H.C.bones.length, tris: H.C.stats.tris, ms: Math.round(HC_BODY.ms), feet: H.feet.length, dy: +dy.toFixed(3), tail: H.scorp.tail.length,
    rest: { sting: f(r.sting), claw: f(r.claw), clawR: f(r.clawR) }, wind: { sting: f(w.sting), claw: f(w.claw), clawR: f(w.clawR) }, strike: { sting: f(s.sting) } }; });
console.log('  scorpion:', JSON.stringify(sc));
check(`the Sand Scorpion wears the kit's Dunescorpion (${sc.bones} bones, ${sc.tris} triangles, ${sc.ms} ms), every toe of its eight feet on the ground (within ${sc.dy} m)`,
  sc.hc && sc.plan === 'game:Sand Scorpion' && sc.feet === 8 && sc.tail === 7 && sc.tris < 25000 && sc.dy < .04, sc);
check(`its sting follows the driver's tail: at rest ${sc.rest && sc.rest.sting} m, wound up ${sc.wind && sc.wind.sting} (cocked back), striking ${sc.strike && sc.strike.sting} (forward over the back); its pincers lift with the fangs' spread (${sc.rest && sc.rest.claw[1]} to ${sc.wind && sc.wind.claw[1]} m, the right ${sc.rest && sc.rest.clawR[1]} to ${sc.wind && sc.wind.clawR[1]})`,
  sc.hc && sc.wind.sting[2] < sc.rest.sting[2] - .01 && sc.strike.sting[2] > sc.rest.sting[2] + .02 && sc.wind.claw[1] > sc.rest.claw[1] + .01 && sc.wind.clawR[1] > sc.rest.clawR[1] + .01, sc);
await page.evaluate(() => { const e = _S.e; e._wind = .6; e._lunge = null; const fx = -Math.sin(yaw), fz = -Math.cos(yaw); px = e.x - fx * 1.6 + 0.6; pz = e.z - fz * 1.6; pitch = -.45; });
for (let i = 0; i < 8; i++) { await page.evaluate(() => tickCreatures(1 / 60, performance.now())); await g.frames(1); }
await page.screenshot({ path: path.join(OUT, 'f4-scorpion.jpg') });
await page.evaluate(() => { REN.render(scene, CAM); });
check('no page errors', g.errs.length === 0, g.errs.slice(0, 3));
await g.close();
