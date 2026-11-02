// The common land animals (Session 1704; backlog L3, OG-084; Michael's A on #984): the Deer, the Red Fox, the Brown Hare, the Badger and
// the Otter, built by buildAnimal on the wolf's bones and gait and, on the new look, dressed in the creature kit's own plan for each, at
// the kit's size in metres. A line of the five ahead of you: each on the kit's skeleton, keyed by the spawner's key; its hips at its
// driver's and at its own height; the same key the same body; walked along the ground, its bones move and its toes stay by the ground;
// three levels by distance; the driver's shadow copy swaps by distance. Picture: docs/prototypes/f4/f4-animals.jpg.
import { boot, check, ROOT } from './lib/game.mjs';
import fs from 'fs'; import path from 'path';
const OUT = path.join(ROOT, 'docs', 'prototypes', 'f4'); fs.mkdirSync(OUT, { recursive: true });

const KINDS = { 'Deer': ['deer', .87], 'Red Fox': ['redfox', .35], 'Brown Hare': ['brownhare', .29], 'Badger': ['badger', .21], 'Otter': ['otter', .13] };
const g = await boot({ look: 'new' }); const { page } = g;
await g.intoWorld();

const made = await page.evaluate((names) => { forceTime(12);
  { const t1 = performance.now(); while (JOBS.length && performance.now() - t1 < 20000) runJobs(); }
  const fx = -Math.sin(yaw), fz = -Math.cos(yaw), sx = -fz, sz = fx, n = names.length;
  const clear = (x, z) => { for (let dx = -2; dx <= 2; dx += .5) for (let dz = -2; dz <= 2; dz += .5) if (WORLD.solidAt(x + dx, z + dz)) return false; return true; };
  let d = 6; for (; d < 60; d += 2) { let ok = true; for (let i = 0; i < n; i++) if (!clear(px + fx * d + sx * (i - 2) * 2, pz + fz * d + sz * (i - 2) * 2)) { ok = false; break; } if (ok) break; }
  window._A = names.map((nm, i) => { const x = px + fx * d + sx * (i - 2) * 2, z = pz + fz * d + sz * (i - 2) * 2;
    const rig = buildAnimal(nm, 'f4animals:' + i), G = new THREE.Group(); G.add(rig.root); G.position.set(x, WORLD.worldH(x, z), z); G.rotation.y = yaw + Math.PI / 2; WORLD.scene.add(G); return { nm, rig, G }; });
  CAM.position.set(px, worldH(px, pz) + 1.65, pz); CAM.updateMatrixWorld(true);
  const want = () => _A.filter(f => hcOk(f.rig) && !f.rig.hc && !f.rig.hcFail).length;
  let k = 0; HBODY.last = -1e9; while (want() && k++ < 200) tickCreatures(1 / 60, 2e5 + k * (HBODY.gap + 1));
  return { d, ticks: k, left: want(), fails: _A.filter(f => f.rig.hcFail).map(f => f.nm), nope: buildAnimal('Wolf') === null, each: Math.round(HC_BODY.ms / Math.max(1, HC_BODY.n)) }; }, Object.keys(KINDS));
console.log('  built:', JSON.stringify(made));
check('buildAnimal builds the five and only the wild kinds (a Wolf is a foe\'s)', made.nope && made.left === 0 && made.fails.length === 0, made);

const who = await page.evaluate(() => _A.map(({ nm, rig, G }) => { const H = rig.hc; if (!H) return { nm, hc: false }; G.updateMatrixWorld(true);
  const a = H.C.byName.spine0.getWorldPosition(new THREE.Vector3()), b = rig.B.hips.getWorldPosition(new THREE.Vector3());
  return { nm, hc: true, plan: H.C.g.plan, seed: H.C.g.seed, want: HC.hashKey('wild:' + rig.hcKey.slice(5)), bones: H.C.bones.length, map: H.map.length, tris: H.C.stats.tris,
    hipGap: +a.distanceTo(b).toFixed(3), hipY: +(a.y - G.position.y).toFixed(3), own: +(H.C.byName.spine0.position.y * H.C.S).toFixed(3),
    same: JSON.stringify(HC.toSaved(HC.genome(hcPlan(nm), rig.hcKey))) === JSON.stringify(HC.toSaved(H.C.g)) }; }));
console.log('  animals:', JSON.stringify(who));
check(`each wears the kit's own plan (${who.map(w => w.nm + ' ' + w.plan + ', ' + w.bones + ' bones, ' + w.tris + ' triangles').join('; ')}), keyed by the spawner's key, the same body rolled again from it`,
  who.every(w => w.hc && w.plan === KINDS[w.nm][0] && w.seed === w.want && w.bones > 16 && w.same), who);
check(`each stands at its own size: its hips at the driver's (within ${Math.max(...who.map(w => w.hipGap))} m) and at its height in metres (${who.map(w => w.nm + ' ' + w.hipY).join(', ')})`,
  who.every(w => w.hipGap < .03 && Math.abs(w.hipY - KINDS[w.nm][1]) < .04 && Math.abs(w.hipY - w.own) < .04), who.map(w => [w.nm, w.hipY, w.own, w.hipGap]));
const twin = await page.evaluate(() => { const a = buildAnimal('Deer', 'f4animals:0'), b = buildAnimal('Deer', 'f4animals:9');
  const s = r => HC.toSaved(HC.genome(hcPlan('Deer'), r.hcKey)); WOLF_RIGS.delete(a); WOLF_RIGS.delete(b); return { same: JSON.stringify(s(a)) === JSON.stringify(HC.toSaved(_A[0].rig.hc.C.g)), other: JSON.stringify(s(b)) !== JSON.stringify(s(a)) }; });
check('the same key is the same deer, another key another', twin.same && twin.other, twin);

// against the man: the deer's back near his chest, the hare's at his shin (F2a: people are the measure)
const man = await page.evaluate(() => { const r = {}; for (const { nm, rig, G } of _A) { G.updateMatrixWorld(true); let top = -1e9; rig.hc.C.meshes[0].geometry.computeBoundingBox();
  const b = new THREE.Box3().setFromObject(rig.hc.C.meshes[0]); r[nm] = +((b.max.y - G.position.y) / SCALE.PEOPLE.gatelander.m).toFixed(2); } return r; });
check(`against a man's stature (${JSON.stringify(man)}): the deer stands about two thirds of him, the hare and the otter under a fifth`,
  man['Deer'] > .5 && man['Deer'] < .9 && man['Brown Hare'] < .3 && man['Otter'] < .2 && man['Red Fox'] < man['Deer'], man);

// walked along the ground: the bones move, the toes stay near it
const walk = await page.evaluate(() => _A.map(({ nm, rig, G }) => { const H = rig.hc, by = H.C.byName, sk = H.C.skel; sk.update(); const a = Array.from(sk.boneMatrices);
  const toes = Object.keys(by).filter(n => /^leg\d[LR]_\d$/.test(n)).reduce((m, n) => { const l = n.slice(0, 5), i = +n[6]; if (!m[l] || i > m[l][1]) m[l] = [n, i]; return m; }, {});
  const dx = Math.sin(G.rotation.y), dz = Math.cos(G.rotation.y); let low = 9, high = -9;
  for (let i = 0; i < 90; i++) { G.position.x += dx * 1.0 / 60; G.position.z += dz * 1.0 / 60; G.position.y = WORLD.worldH(G.position.x, G.position.z); tickCreatures(1 / 60, 4e5 + i * 16.7);
    if (i > 40) { G.updateMatrixWorld(true); for (const [n] of Object.values(toes)) { const p = by[n].getWorldPosition(new THREE.Vector3()), y = p.y - WORLD.worldH(p.x, p.z); low = Math.min(low, y); high = Math.max(high, y); } } }
  sk.update(); const b = Array.from(sk.boneMatrices); let moved = 0; for (let i = 0; i < a.length; i++) moved = Math.max(moved, Math.abs(a[i] - b[i]));
  return { nm, moved: +moved.toFixed(3), low: +low.toFixed(3), high: +high.toFixed(3), gait: rig.gallop ? 'gallop' : 'trot', stand: +rig.w.stand.toFixed(2) }; }));
console.log('  walk:', JSON.stringify(walk));
check(`walked 1 m/s along the ground (the deer and the fox trot, the small ones bound at a gallop) each one's bones move and its lowest toe stays by the ground (${walk.map(w => w.nm + ' ' + w.low).join(', ')} m)`,
  walk.every(w => w.moved > .01 && w.stand < .2 && Math.abs(w.low) < .06), walk);

// Session 1706: a deer is a hind one time in two by its key (f4animals:0 a stag, f4animals:5 a hind): the kit's deer without antlers,
// a tenth smaller; over a field of keys about half are hinds
const hind = await page.evaluate(() => { const fx = -Math.sin(yaw), fz = -Math.cos(yaw), x = px + fx * 12, z = pz + fz * 12;
  const rig = buildAnimal('Deer', 'f4animals:5'), G = new THREE.Group(); G.add(rig.root); G.position.set(x, WORLD.worldH(x, z), z); WORLD.scene.add(G);
  let k = 0; HBODY.last = -1e9; while (!rig.hc && !rig.hcFail && k++ < 200) tickCreatures(1 / 60, 3e5 + k * (HBODY.gap + 1));
  const H = rig.hc; if (!H) { G.parent.remove(G); return { none: true, fail: !!rig.hcFail }; } G.updateMatrixWorld(true);
  const a = H.C.byName.spine0.getWorldPosition(new THREE.Vector3()), b = rig.B.hips.getWorldPosition(new THREE.Vector3());
  const head = P => P.parts.find(p => p[0] === 'head')[1];
  let n = 0, hinds = 0; for (let cx = 0; cx < 20; cx++) for (let cz = 0; cz < 20; cz++) { const r = buildAnimal('Deer', cx + ',' + cz + ':0'); WOLF_RIGS.delete(r); n++; if (r.hcKind === 'Hind') hinds++; }
  const out = { kind: rig.hcKind, plan: H.C.g.plan, antlers: !!head(H.C.plan).antlers, stag: !!head(HC.PLANS.deer).antlers, stagKind: _A[0].rig.hcKind || null,
    hipY: +(a.y - G.position.y).toFixed(3), gap: +a.distanceTo(b).toFixed(3), tris: H.C.stats.tris, share: +(hinds / n).toFixed(2) };
  G.parent.remove(G); tickCreatures(1 / 60, 3.5e5); return out; });
console.log('  hind:', JSON.stringify(hind));
check(`a deer keyed f4animals:5 is a hind: the kit's deer without its antlers (${hind.tris} triangles), its hips at ${hind.hipY} m (the stag's ${who[0].hipY}); ${hind.share} of 400 keys are hinds`,
  hind.kind === 'Hind' && hind.plan === 'game:Hind' && !hind.antlers && hind.stag && hind.stagKind === null && hind.gap < .03 && Math.abs(hind.hipY - who[0].hipY * .9) < .03 && hind.share > .4 && hind.share < .6, hind);

// the levels: near the hide and its fur, at 25 m without the fur, at 60 m the driver; and the driver's own copy swaps by distance
const lv = await page.evaluate(() => { const f = _A[0], G = f.G, fx = -Math.sin(yaw), fz = -Math.cos(yaw);
  const at = (dd, k) => { CAM.position.set(G.position.x - fx * dd, G.position.y + 1.65, G.position.z - fz * dd); CAM.updateMatrixWorld(true); for (let i = 0; i < 3; i++) tickCreatures(1 / 60, 5e5 + k * 100 + i * 17);
    const H = f.rig.hc; let n = 0; if (H.W.visible) H.W.traverse(o => { if (o.isMesh && o.visible) n++; }); return { L: H.L, kit: n, driver: f.rig.mesh.visible, lo: f.rig.mesh.geometry === f.rig.geoLo }; };
  return { near: at(4, 1), mid: at(25, 2), far: at(60, 3), back: at(4, 4) }; });
check(`the deer's three levels: near its hide and fur (${lv.near.kit} meshes), at 25 m fewer (${lv.mid.kit}), at 60 m the driver's own body, its low copy`,
  lv.near.L === 0 && !lv.near.driver && !lv.near.lo && lv.mid.L === 1 && lv.mid.kit < lv.near.kit && lv.far.L === 2 && lv.far.driver && lv.far.lo && lv.back.L === 0 && !lv.back.lo, lv);

await page.evaluate(() => { const a = _A[0].G, b = _A[4].G, mx = (a.position.x + b.position.x) / 2, mz = (a.position.z + b.position.z) / 2, fx = -Math.sin(yaw), fz = -Math.cos(yaw);
  px = mx - fx * 5; pz = mz - fz * 5; pitch = -.18; });
for (let i = 0; i < 8; i++) { await page.evaluate(() => tickCreatures(1 / 60, performance.now())); await g.frames(1); }
await page.screenshot({ path: path.join(OUT, 'f4-animals.jpg'), type: 'jpeg', quality: 80 });

const gone = await page.evaluate(() => { for (const { G } of _A) G.parent.remove(G); tickCreatures(1 / 60, 9e5); return _A.every(f => !WOLF_RIGS.has(f.rig)); });
check('taken from the scene, each is dropped', gone);

// Session 1710: the raven and the crow. No wolf's driver: buildAnimal gives a rig holding a plain stand-in (the far level), and near the
// kit's bird, fitted to the stand-in's length; hcTick finds it among the world's foes once `rig.e` is set. Its gait is read from its
// group: standing, walking, hopping by the ground covered a second, soaring when the group is lifted off the ground
const birds = await page.evaluate(() => { const fx = -Math.sin(yaw), fz = -Math.cos(yaw), sx = -fz, sz = fx;
  window._B = ['Raven', 'Crow'].map((nm, i) => { const x = px + fx * 4 + sx * (i - .5) * 1.2, z = pz + fz * 4 + sz * (i - .5) * 1.2;
    const rig = buildAnimal(nm, 'f4birds:' + i), G = new THREE.Group(); G.add(rig.root); G.position.set(x, WORLD.worldH(x, z), z); G.rotation.y = yaw + Math.PI / 2; WORLD.scene.add(G);
    const e = { name: nm, x, z, mesh: G, limbs: { wolf: rig, torso: rig.mesh }, dead: false }; rig.e = e; return { nm, rig, G, e }; });
  CAM.position.set(px, worldH(px, pz) + 1.65, pz); CAM.updateMatrixWorld(true);
  const ZE = ZONES.world.enemies; for (const b of _B) ZE.push(b.e);
  let k = 0; HBODY.last = -1e9; while (_B.some(b => !b.rig.hc && !b.rig.hcFail) && k++ < 300) hcTick(6e5 + k * (HBODY.gap + 1));
  for (const b of _B) ZE.splice(ZE.indexOf(b.e), 1);
  return _B.map(({ nm, rig, G }) => { const H = rig.hc; if (!H) return { nm, fail: !!rig.hcFail };
    const r0 = G.rotation.y; G.rotation.y = 0; G.updateMatrixWorld(true); const bx = new THREE.Box3(); for (const m of H.C.meshes) bx.union(new THREE.Box3().setFromObject(m));
    const sp = H.C.byName.spine0.getWorldPosition(new THREE.Vector3()).y - G.position.y; G.rotation.y = r0; G.updateMatrixWorld(true);
    return { nm, plan: H.C.g.plan, seed: H.C.g.seed, want: HC.hashKey(rig.hcKey), bones: H.C.bones.length, tris: H.C.stats.tris, stand: rig.mesh.geometry.attributes.position.count / 3,
      len: +(bx.max.z - bx.min.z).toFixed(3), low: +(bx.min.y - G.position.y).toFixed(3), spine: +sp.toFixed(3), wolf: WOLF_RIGS.has(rig) }; }); });
console.log('  birds:', JSON.stringify(birds));
check(`the raven and the crow wear the kit's (${birds.map(b => b.nm + ' ' + b.plan + ', ' + b.bones + ' bones, ' + b.tris + ' triangles, ' + b.len + ' m beak to tail').join('; ')}), keyed by the spawner's key, over a ${birds[0].stand}-triangle stand-in, no wolf's driver`,
  birds.every(b => !b.fail && /^game:(Raven|Crow)$/.test(b.plan) && b.seed === b.want && b.bones > 16 && b.tris < 8000 && !b.wolf && Math.abs(b.low) < .01) &&
  Math.abs(birds[0].len - .58) < .03 && Math.abs(birds[1].len - .45) < .03, birds);
const fly = await page.evaluate(() => _B.map(({ nm, rig, G }) => { const H = rig.hc, sk = H.C.skel, seen = {}, t0 = performance.now; let i0 = 0;
  const run = (n, sp, lift) => { for (let i = 0; i < n; i++) { G.position.x += Math.sin(G.rotation.y) * sp / 60; G.position.z += Math.cos(G.rotation.y) * sp / 60;
      G.position.y = WORLD.worldH(G.position.x, G.position.z) + lift; i0++; performance.now = () => 7e5 + i0 * 1000 / 60; try { hcBirdPose(rig); } finally { performance.now = t0; } }
    sk.update(); return Array.from(sk.boneMatrices); };
  const mv = (p, q) => { let m = 0; for (let i = 0; i < p.length; i++) m = Math.max(m, Math.abs(p[i] - q[i])); return +m.toFixed(3); };
  const a = run(30, 0, 0); seen.still = rig.gaitNow; const b = run(60, .4, 0); seen.slow = rig.gaitNow; const c = run(60, 1.6, 0); seen.fast = rig.gaitNow;
  const d = run(60, 6, 4); seen.up = rig.gaitNow; G.updateMatrixWorld(true); const sp = H.C.byName.spine0.getWorldPosition(new THREE.Vector3()).y - G.position.y;
  run(30, 0, 0); return { nm, seen, moved: [mv(a, b), mv(b, c), mv(c, d)], soarSpine: +sp.toFixed(3) }; }));
console.log('  fly:', JSON.stringify(fly));
check(`each bird's gait is its group's: still ${fly.map(f => f.seen.still).join('/')}, 0.4 m/s ${fly.map(f => f.seen.slow).join('/')}, 1.6 m/s ${fly.map(f => f.seen.fast).join('/')}, 4 m up ${fly.map(f => f.seen.up).join('/')}; aloft its spine ${fly.map(f => f.soarSpine).join(', ')} m over the group (standing ${birds.map(b => b.spine).join(', ')})`,
  fly.every((f, i) => f.seen.still === 'stand' && f.seen.slow === 'walk' && f.seen.fast === 'hop' && f.seen.up === 'soar' && f.moved.every(m => m > .01) && Math.abs(f.soarSpine - birds[i].spine) < .08), fly);
await page.evaluate(() => { const a = _B[0].G, b = _B[1].G, mx = (a.position.x + b.position.x) / 2, mz = (a.position.z + b.position.z) / 2, fx = -Math.sin(yaw), fz = -Math.cos(yaw);
  for (const { G } of _B) G.position.y = WORLD.worldH(G.position.x, G.position.z); px = mx - fx * 1.8; pz = mz - fz * 1.8; pitch = -.42; });
for (let i = 0; i < 8; i++) await g.frames(1);
await page.screenshot({ path: path.join(OUT, 'f4-birds.jpg'), type: 'jpeg', quality: 80 });
const blv = await page.evaluate(() => { const { rig, G } = _B[0], fx = -Math.sin(yaw), fz = -Math.cos(yaw);
  CAM.position.set(G.position.x - fx * 60, G.position.y + 1.65, G.position.z - fz * 60); CAM.updateMatrixWorld(true); hcTick(8e5);
  const far = { L: rig.hc.L, stand: rig.mesh.visible }; for (const { G } of _B) G.parent.remove(G); hcTick(8.1e5); return { far, dropped: _B.every(b => !b.rig.hc && !HC_RIGS.has(b.rig)) }; });
check(`at 60 m the raven is its stand-in (L${blv.far.L}); taken from the scene, both birds are dropped (${blv.dropped})`, blv.far.L === 2 && blv.far.stand && blv.dropped, blv);
// Session 1712: the trout. No driver either: a stand-in (the far level), and near the kit's trout fitted nose to nose on its axis; it swims
// by the water its group covers, and holding still its tail beats slowly on the clock
const fish = await page.evaluate(() => { const fx = -Math.sin(yaw), fz = -Math.cos(yaw), x = px + fx * 2.5, z = pz + fz * 2.5;
  const rig = buildAnimal('Trout', 'f4trout:0'), G = new THREE.Group(); G.add(rig.root); G.position.set(x, WORLD.worldH(x, z) + .5, z); G.rotation.y = yaw + Math.PI / 2; WORLD.scene.add(G);
  const e = { name: 'Trout', x, z, mesh: G, limbs: { wolf: rig, torso: rig.mesh }, dead: false }; rig.e = e; window._T = { rig, G, e };
  CAM.position.set(px, worldH(px, pz) + 1.65, pz); CAM.updateMatrixWorld(true);
  const ZE = ZONES.world.enemies; ZE.push(e); let k = 0; HBODY.last = -1e9; while (!rig.hc && !rig.hcFail && k++ < 300) hcTick(9e5 + k * (HBODY.gap + 1)); ZE.splice(ZE.indexOf(e), 1);
  const H = rig.hc; if (!H) return { fail: !!rig.hcFail };
  const r0 = G.rotation.y; G.rotation.y = 0; G.updateMatrixWorld(true); const bx = new THREE.Box3(); for (const m of H.C.meshes) bx.union(new THREE.Box3().setFromObject(m));
  const sb = new THREE.Box3().setFromObject(rig.mesh); G.rotation.y = r0; G.updateMatrixWorld(true);
  const sk = H.C.skel, t0 = performance.now; let i0 = 0;
  const run = (n, sp) => { for (let i = 0; i < n; i++) { G.position.x += Math.sin(G.rotation.y) * sp / 60; G.position.z += Math.cos(G.rotation.y) * sp / 60; i0++;
      performance.now = () => 9.5e5 + i0 * 1000 / 60; try { hcSwimPose(rig); } finally { performance.now = t0; } } sk.update(); return { m: Array.from(sk.boneMatrices), ph: rig.ph, g: rig.gaitNow }; };
  const mv = (p, q) => { let m = 0; for (let i = 0; i < p.length; i++) m = Math.max(m, Math.abs(p[i] - q[i])); return +m.toFixed(3); };
  const a = run(60, 0), b = run(60, .8), c = run(60, 0);
  return { plan: H.C.g.plan, seed: H.C.g.seed, want: HC.hashKey(rig.hcKey), bones: H.C.bones.length, tris: H.C.stats.tris, stand: rig.tris, wolf: WOLF_RIGS.has(rig),
    len: +(bx.max.z - bx.min.z).toFixed(3), nose: +(bx.max.z - sb.max.z).toFixed(3), mid: +((bx.max.y + bx.min.y) / 2 - G.position.y).toFixed(3),
    hold: { g: a.g, cyc: +(a.ph).toFixed(2) }, swim: { g: b.g, cyc: +(b.ph - a.ph).toFixed(2) }, moved: [mv(a.m, b.m), mv(b.m, c.m)] }; });
console.log('  trout:', JSON.stringify(fish));
check(`the trout wears the kit's (${fish.plan}, ${fish.bones} bones, ${fish.tris} triangles, ${fish.len} m nose to tail swimming (the stand-in 0.4 straight), its nose ${fish.nose} m off the stand-in's, its middle ${fish.mid} m off the axis) over a ${fish.stand}-triangle stand-in, no wolf's driver`,
  !fish.fail && fish.plan === 'game:Trout' && fish.seed === fish.want && fish.bones > 8 && fish.tris < 8000 && !fish.wolf && fish.len > .34 && fish.len < .42 && Math.abs(fish.nose) < .01 && Math.abs(fish.mid) < .06, fish);
check(`it swims by its group: holding still ${fish.hold.g}, ${fish.hold.cyc} beats a second; at 0.8 m/s ${fish.swim.g}, ${fish.swim.cyc} beats a second; the bones moving (${fish.moved.join(', ')})`,
  fish.hold.g === 'hold' && fish.swim.g === 'swim' && fish.swim.cyc > fish.hold.cyc * 2 && fish.moved.every(m => m > .005), fish);
await page.evaluate(() => { const { G } = _T, fx = -Math.sin(yaw), fz = -Math.cos(yaw); G.position.y = WORLD.worldH(G.position.x, G.position.z) + .5; px = G.position.x - fx * 1.1; pz = G.position.z - fz * 1.1; pitch = -.78; });
for (let i = 0; i < 8; i++) await g.frames(1);
await page.screenshot({ path: path.join(OUT, 'f4-trout.jpg'), type: 'jpeg', quality: 80 });
const tlv = await page.evaluate(() => { const { rig, G } = _T, fx = -Math.sin(yaw), fz = -Math.cos(yaw);
  CAM.position.set(G.position.x - fx * 60, G.position.y + 1.65, G.position.z - fz * 60); CAM.updateMatrixWorld(true); hcTick(9.8e5);
  const far = { L: rig.hc.L, stand: rig.mesh.visible }; G.parent.remove(G); hcTick(9.9e5); return { far, dropped: !rig.hc && !HC_RIGS.has(rig) }; });
check(`at 60 m the trout is its stand-in (L${tlv.far.L}); taken from the scene, it is dropped (${tlv.dropped})`, tlv.far.L === 2 && tlv.far.stand && tlv.dropped, tlv);
await page.evaluate(() => { REN.render(scene, CAM); });
check('no page errors', g.errs.length === 0, g.errs.slice(0, 3));
await g.close();
