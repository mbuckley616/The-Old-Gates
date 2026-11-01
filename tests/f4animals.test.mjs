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
await page.evaluate(() => { REN.render(scene, CAM); });
check('no page errors', g.errs.length === 0, g.errs.slice(0, 3));
await g.close();
