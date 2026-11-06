// The common land animals (Session 1704; backlog L3, OG-084; Michael's A on #984): the Deer, the Red Fox, the Brown Hare, the Badger and
// the Otter, built by buildAnimal on the wolf's bones and gait and, on the new look, dressed in the creature kit's own plan for each, at
// the kit's size in metres. A line of the five ahead of you: each on the kit's skeleton, keyed by the spawner's key; its hips at its
// driver's and at its own height; the same key the same body; walked along the ground, its bones move and its toes stay by the ground;
// three levels by distance; the driver's shadow copy swaps by distance. Session 1719: the farms' Cow, Sheep and Goat beside them, on the
// deer's legs, keyed farm:<key>. Picture: docs/prototypes/f4/f4-animals.jpg.
import { boot, check, ROOT } from './lib/game.mjs';
import fs from 'fs'; import path from 'path';
const OUT = path.join(ROOT, 'docs', 'prototypes', 'f4'); fs.mkdirSync(OUT, { recursive: true });

const KINDS = { 'Deer': ['deer', .87], 'Red Fox': ['redfox', .35], 'Brown Hare': ['brownhare', .29], 'Badger': ['badger', .21], 'Otter': ['otter', .13],
  // Session 1719: the farms' livestock, keyed farm:<key>
  'Cow': ['cow', 1.23], 'Sheep': ['sheep', .65], 'Goat': ['goat', .55],
  // Session 1727 (first numbered 1722): the Gatelands' own
  'Elderstag': ['stag', 1.15], 'Gatefen Boar': ['gatefenboar', .50], 'Redspine Fox': ['redspinefox', .35], 'Hollowcat': ['hollowcat', .3], 'Greenward Stoat': ['stoat', .065],
  // Session 1739: the Mark's own on four legs
  'Icehorn': ['icehorn', .69], 'Ironpine Elk': ['ironpineelk', 1.44], 'Craghorn Ram': ['craghornram', .60], 'Stormlynx': ['stormlynx', .40], 'Glacial Marmot': ['glacialmarmot', .125], 'Snowleap Hare': ['snowhare', .26],
  // Session 1744: Aurenne's own on four legs
  'Duneskimmer': ['duneskimmer', .69], 'Terrace Ram': ['terraceram', .58], 'Sunspire Lynx': ['sunspirelynx', .39], 'Oasis Hare': ['oasishare', .275], 'Mirage Fox': ['miragefox', .21],
  // Session 1852: OG-040's strange beasts on four legs
  'Crownstag': ['crownstag', 1.48], 'Frostmane': ['frostmane', 1.08], 'Lanternfox': ['lanternfox', .36], 'Thornrunner': ['thornrunner', .70], 'Stonejaw': ['stonejaw', .30] };
const g = await boot({ look: 'new' }); const { page } = g;
// Session 1745: a picture is one frame drawn and read back from the canvas (autumn's way, S1470). Playwright's screenshot waited on the
// live loop's queue of frames, and with two dozen furred bodies on software GL it ran past 120 s (the line's, here, after S1744's fix)
const shoot = async (file) => { await page.evaluate(() => { window._ogDraw = REN.render; REN.render = () => {}; }); await g.frames(2);
  const url = await page.evaluate(() => { REN.render = window._ogDraw; CAM.updateMatrixWorld(true); REN.render(scene, CAM); return REN.domElement.toDataURL('image/jpeg', .8); });
  fs.writeFileSync(path.join(OUT, file), Buffer.from(url.split(',')[1], 'base64')); };
await g.intoWorld();

const made = await page.evaluate((names) => { forceTime(12);
  { const t1 = performance.now(); while (JOBS.length && performance.now() - t1 < 20000) runJobs(); }
  const fx = -Math.sin(yaw), fz = -Math.cos(yaw), sx = -fz, sz = fx, n = names.length;
  const clear = (x, z) => { for (let dx = -2; dx <= 2; dx += .5) for (let dz = -2; dz <= 2; dz += .5) if (WORLD.solidAt(x + dx, z + dz)) return false; return true; };
  let d = 6; for (; d < 60; d += 2) { let ok = true; for (let i = 0; i < n; i++) if (!clear(px + fx * d + sx * (i - (n - 1) / 2) * 2.5, pz + fz * d + sz * (i - (n - 1) / 2) * 2.5)) { ok = false; break; } if (ok) break; }
  window._A = names.map((nm, i) => { const x = px + fx * d + sx * (i - (n - 1) / 2) * 2.5, z = pz + fz * d + sz * (i - (n - 1) / 2) * 2.5;
    const rig = buildAnimal(nm, 'f4animals:' + i), G = new THREE.Group(); G.add(rig.root); G.position.set(x, WORLD.worldH(x, z), z); G.rotation.y = yaw + Math.PI / 2; WORLD.scene.add(G); return { nm, rig, G }; });
  CAM.position.set(px, worldH(px, pz) + 1.65, pz); CAM.updateMatrixWorld(true);
  const want = () => _A.filter(f => hcOk(f.rig) && !f.rig.hc && !f.rig.hcFail).length;
  let k = 0; HBODY.last = -1e9; while (want() && k++ < 1200) tickCreatures(1 / 60, 2e5 + k * (HBODY.gap + 1));
  return { d, ticks: k, left: want(), fails: _A.filter(f => f.rig.hcFail).map(f => f.nm), nope: buildAnimal('Wolf') === null, each: Math.round(HC_BODY.ms / Math.max(1, HC_BODY.n)) }; }, Object.keys(KINDS));
console.log('  built:', JSON.stringify(made));
check('buildAnimal builds the twenty-nine and only the wild and farm kinds (a Wolf is a foe\'s)', made.nope && made.left === 0 && made.fails.length === 0, made);

const who = await page.evaluate(() => _A.map(({ nm, rig, G }) => { const H = rig.hc; if (!H) return { nm, hc: false }; G.updateMatrixWorld(true);
  const a = H.C.byName.spine0.getWorldPosition(new THREE.Vector3()), b = rig.B.hips.getWorldPosition(new THREE.Vector3());
  return { nm, hc: true, plan: H.C.g.plan, seed: H.C.g.seed, want: HC.hashKey(rig.hcKey), bones: H.C.bones.length, map: H.map.length, tris: H.C.stats.tris,
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
check(`against a man's stature (${JSON.stringify(man)}): the deer stands about two thirds of him, the hare and the otter under a fifth, the cow's horns about his height, the sheep and the goat half`,
  man['Cow'] > .8 && man['Cow'] < 1.15 && man['Sheep'] > .35 && man['Sheep'] < .65 && man['Goat'] > .35 && man['Goat'] < .65 && man['Deer'] > .5 && man['Deer'] < .9 && man['Brown Hare'] < .3 && man['Otter'] < .2 && man['Red Fox'] < man['Deer'], man);

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

// Session 1853: the Lanternfox's glow (OG-040: "glows blue and silver at night") is out by day and at full by night, by the clock
const lamp = await page.evaluate(() => { const f = _A.find(a => a.nm === 'Lanternfox'), H = f.rig.hc, at = h => { forceTime(h); tickCreatures(1 / 60, 8e5 + h * 100);
  return +Math.max(...H.glow.map(u => u.value.r + u.value.g + u.value.b)).toFixed(2); };
  const r = { noon: at(12), dusk: at(18), night: at(23), full: +Math.max(...(H.night || []).map(c => c.r + c.g + c.b)).toFixed(2), uniforms: H.glow.length }; forceTime(12); tickCreatures(1 / 60, 8.1e5); return r; });
console.log('  lamp:', JSON.stringify(lamp));
check(`the Lanternfox's glow by the clock: ${lamp.noon} at noon, ${lamp.dusk} at 18:00, ${lamp.night} at 23:00 (its full ${lamp.full})`,
  lamp.uniforms > 0 && lamp.full > 1 && lamp.noon === 0 && Math.abs(lamp.night - lamp.full) < .01 && lamp.dusk > .3 * lamp.full && lamp.dusk < .7 * lamp.full, lamp);

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

// Session 1744: the line is 24 animals and 57 m long; only its middle is in the picture, but every furred body in it drew (and cast its
// shadow), so one frame took over 120 s on CI. The ones the frame cannot hold are hidden for the picture
await page.evaluate(() => { const a = _A[0].G, b = _A[_A.length - 1].G, mx = (a.position.x + b.position.x) / 2, mz = (a.position.z + b.position.z) / 2, fx = -Math.sin(yaw), fz = -Math.cos(yaw);
  for (const { G } of _A) G.visible = Math.abs((G.position.x - mx) * -fz + (G.position.z - mz) * fx) < 7;
  px = mx - fx * 9; pz = mz - fz * 9; pitch = -.16; });
for (let i = 0; i < 8; i++) { await page.evaluate(() => tickCreatures(1 / 60, performance.now())); await g.frames(1); }
await shoot('f4-animals.jpg');

const gone = await page.evaluate(() => { for (const { G } of _A) G.parent.remove(G); tickCreatures(1 / 60, 9e5); return _A.every(f => !WOLF_RIGS.has(f.rig)); });
check('taken from the scene, each is dropped', gone);

// Session 1710: the raven and the crow. No wolf's driver: buildAnimal gives a rig holding a plain stand-in (the far level), and near the
// kit's bird, fitted to the stand-in's length; hcTick finds it among the world's foes once `rig.e` is set. Its gait is read from its
// group: standing, walking, hopping by the ground covered a second, soaring when the group is lifted off the ground. Session 1719: the
// farms' hen on the same path, keyed farm:<key>, running at a trot and never soaring. Session 1723: the Gatelands' Great Heron, Crag Hawk
// and Capercaillie, fast and aloft by their plans' gaits
// Session 1892: OG-040's four strange birds at the kit's own size: beak to tail and crown (m); their fur and size allow them more triangles
const BIG = { Glasswing: [2.40, 1.06], Stormplume: [2.56, 2.58], Redcrest: [2.69, 1.15], Sunfan: [1.07, 1.59] };
const birds = await page.evaluate(() => { const fx = -Math.sin(yaw), fz = -Math.cos(yaw), sx = -fz, sz = fx;
  window._B = ['Raven', 'Crow', 'Hen', 'Great Heron', 'Crag Hawk', 'Capercaillie', 'Skyraven', 'Stormshrike', 'Tundra Grouse', 'Scarlet Ibis', 'Cypress Stalker', 'Sunbeak Vulture', 'Cliffswift', 'Glasswing Moth', 'Glasswing', 'Stormplume', 'Redcrest', 'Sunfan'].map((nm, i) => { const r2 = i >= 14, j = r2 ? (i - 15.5) * 3 : (i - 6) * 1.3, x = px + fx * (r2 ? 8 : 4) + sx * j, z = pz + fz * (r2 ? 8 : 4) + sz * j; /* S1892: OG-040's four big birds a row behind, 3 m apart */
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
      len: +(bx.max.z - bx.min.z).toFixed(3), top: +(bx.max.y - G.position.y).toFixed(3), key: rig.hcKey.split(':')[0], low: +(bx.min.y - G.position.y).toFixed(3), spine: +sp.toFixed(3), wolf: WOLF_RIGS.has(rig) }; }); });
console.log('  birds:', JSON.stringify(birds));
check(`the raven, the crow, the hen, the Gatelands' heron, hawk and capercaillie the Mark's Skyraven, Stormshrike and Tundra Grouse and Aurenne's Scarlet Ibis, Cypress Stalker, Sunbeak Vulture, Cliffswift and Glasswing Moth and OG-040's Glasswing, Stormplume, Redcrest and Sunfan wear the kit's (${birds.map(b => b.nm + ' ' + b.plan + ', ' + b.bones + ' bones, ' + b.tris + ' triangles, ' + b.len + ' m beak to tail').join('; ')}), keyed by the spawner's key, over a ${birds[0].stand}-triangle stand-in, no wolf's driver`,
  birds.every(b => !b.fail && b.plan === 'game:' + b.nm && b.key === (b.nm === 'Hen' ? 'farm' : 'wild') && b.seed === b.want && b.bones > 16 && b.tris < (BIG[b.nm] ? 30000 : 8000) && !b.wolf && Math.abs(b.low) < .01) &&
  Math.abs(birds[0].len - .58) < .03 && Math.abs(birds[1].len - .45) < .03 && Math.abs(birds[2].len - .40) < .03 && birds[2].top > .3 && birds[2].top < .55 && Math.abs(birds[3].len - .95) < .05 && Math.abs(birds[4].len - .55) < .03 && Math.abs(birds[5].len - .85) < .05 && Math.abs(birds[6].len - .64) < .03 && Math.abs(birds[7].len - .47) < .03 && Math.abs(birds[8].len - .40) < .03 &&
  Math.abs(birds[9].len - .68) < .04 && Math.abs(birds[10].len - 1.0) < .05 && Math.abs(birds[11].len - .77) < .04 && Math.abs(birds[12].len - .27) < .02 && Math.abs(birds[13].len - .07) < .01 &&
  birds.slice(14).every(b => Math.abs(b.len - BIG[b.nm][0]) < .06 && Math.abs(b.top - BIG[b.nm][1]) < .12), birds);
const fly = await page.evaluate(() => _B.map(({ nm, rig, G }) => { const H = rig.hc, sk = H.C.skel, seen = {}, t0 = performance.now; let i0 = 0;
  const run = (n, sp, lift) => { for (let i = 0; i < n; i++) { G.position.x += Math.sin(G.rotation.y) * sp / 60; G.position.z += Math.cos(G.rotation.y) * sp / 60;
      G.position.y = WORLD.worldH(G.position.x, G.position.z) + lift; i0++; performance.now = () => 7e5 + i0 * 1000 / 60; try { hcBirdPose(rig); } finally { performance.now = t0; } }
    sk.update(); return Array.from(sk.boneMatrices); };
  const mv = (p, q) => { let m = 0; for (let i = 0; i < p.length; i++) m = Math.max(m, Math.abs(p[i] - q[i])); return +m.toFixed(3); };
  const a = run(30, 0, 0); seen.still = rig.gaitNow; const b = run(60, .4, 0); seen.slow = rig.gaitNow; const c = run(60, 1.6, 0); seen.fast = rig.gaitNow;
  const d = run(60, 6, 4); seen.up = rig.gaitNow; G.updateMatrixWorld(true); const sp = H.C.byName.spine0.getWorldPosition(new THREE.Vector3()).y - G.position.y;
  run(30, 0, 0); return { nm, seen, moved: [mv(a, b), mv(b, c), mv(c, d)], soarSpine: +sp.toFixed(3) }; }));
console.log('  fly:', JSON.stringify(fly));
const FAST = { Raven: 'hop', Crow: 'hop', Hen: 'trot', 'Great Heron': 'walk', 'Crag Hawk': 'walk', Capercaillie: 'trot', Skyraven: 'hop', Stormshrike: 'walk', 'Tundra Grouse': 'trot', 'Scarlet Ibis': 'walk', 'Cypress Stalker': 'walk', 'Sunbeak Vulture': 'walk', Cliffswift: 'stand', 'Glasswing Moth': 'walk', Glasswing: 'walk', Stormplume: 'trot', Redcrest: 'trot', Sunfan: 'walk' }, UP = { Raven: 'soar', Crow: 'soar', 'Crag Hawk': 'soar', Skyraven: 'soar', Stormshrike: 'soar', 'Sunbeak Vulture': 'soar', Cliffswift: 'soar', 'Glasswing Moth': 'soar', Glasswing: 'soar' }, SLOW = { Cliffswift: 'stand' };
check(`each bird's gait is its group's, fast and aloft by its plan's gaits (the hen, the heron, the capercaillie, the ibis, the stalker, the Stormplume, the Redcrest and the Sunfan never soar; the swift never walks): still ${fly.map(f => f.seen.still).join('/')}, 0.4 m/s ${fly.map(f => f.seen.slow).join('/')}, 1.6 m/s ${fly.map(f => f.seen.fast).join('/')}, 4 m up ${fly.map(f => f.seen.up).join('/')}; aloft its spine ${fly.map(f => f.soarSpine).join(', ')} m over the group (standing ${birds.map(b => b.spine).join(', ')})`,
  fly.every((f, i) => f.seen.still === 'stand' && f.seen.slow === (SLOW[f.nm] || 'walk') && f.seen.fast === FAST[f.nm] && f.seen.up === (UP[f.nm] || FAST[f.nm]) && f.moved.every(m => m > .01) && Math.abs(f.soarSpine - birds[i].spine) < .08), fly);
// Session 1915: the Stormplume and the Redcrest kick (HC.KICK through hcBirdKick): the strike's wind-up chambers a foot (raised, by the
// leg's height), the lunge drives it forward and up, and the next strike kicks with the other foot; standing again, the feet are back;
// a raven given the same wind-up is posed as before
const kick = await page.evaluate(() => _B.filter(b => ['Stormplume', 'Redcrest', 'Raven'].includes(b.nm)).map(({ nm, rig, e }) => { const H = rig.hc, C = H.C, t0 = performance.now; let i0 = 0;
  const pose = () => { i0++; performance.now = () => 8e5 + i0 * 1000 / 60; try { hcBirdPose(rig); } finally { performance.now = t0; } C.rig.updateMatrixWorld(true);
    return C.B.legs.map(L => { const p = C.rig.worldToLocal(C.byName[L.names[L.names.length - 1]].getWorldPosition(new THREE.Vector3())); return { side: L.side, y: p.y, f: p.dot(C.dir), h: L.hR }; }); };
  const best = (a, b, k) => Math.max(...a.map((p, i) => (b[i][k] - p[k]) / p.h));
  rig.e.mesh.position.y = WORLD.worldH(rig.e.mesh.position.x, rig.e.mesh.position.z); e._wind = 0; e._lunge = null; for (let i = 0; i < 120; i++) pose(); const rest = pose(); e._wind = 1; const ch = pose(); e._wind = 0; e._lunge = .15; const st = pose(); const side1 = rig.kickSide;
  e._lunge = null; pose(); e._lunge = .15; pose(); const side2 = rig.kickSide; e._lunge = null; for (let i = 0; i < 5; i++) pose(); const back = pose();
  const r = v => +v.toFixed(2); return { nm, up: r(best(rest, ch, 'y')), fwd: r(best(rest, st, 'f')), hi: r(best(rest, st, 'y')), sides: [side1, side2], back: r(Math.max(...rest.map((p, i) => Math.hypot(back[i].y - p.y, back[i].f - p.f) / p.h))) }; }));
console.log('  kick:', JSON.stringify(kick));
check(`the Stormplume and the Redcrest kick: chambered a foot rises ${kick.filter(k => k.nm !== 'Raven').map(k => k.nm + ' ' + k.up).join(', ')} of the leg's height; struck it goes ${kick.filter(k => k.nm !== 'Raven').map(k => k.fwd + ' forward, ' + k.hi + ' up').join('; ')}; the next strike the other foot (${kick.map(k => k.sides.join('/')).join(', ')}); standing, back within ${Math.max(...kick.map(k => k.back))}; the raven ${kick.find(k => k.nm === 'Raven').up} with the same wind-up`,
  kick.length === 3 && kick.every(k => k.nm === 'Raven' ? Math.abs(k.up) < .02 && Math.abs(k.fwd) < .02 : k.up > .3 && k.fwd > .6 && k.hi > .2 && k.sides[0] === -k.sides[1] && k.back < .02), kick);
await page.evaluate(() => { const a = _B[0].G, b = _B[_B.length - 1].G, mx = (a.position.x + b.position.x) / 2, mz = (a.position.z + b.position.z) / 2, fx = -Math.sin(yaw), fz = -Math.cos(yaw);
  for (const { G } of _B) G.position.y = WORLD.worldH(G.position.x, G.position.z); px = mx - fx * 5; pz = mz - fz * 5; pitch = -.24; });
for (let i = 0; i < 8; i++) await g.frames(1);
await shoot('f4-birds.jpg');
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
await shoot('f4-trout.jpg');
const tlv = await page.evaluate(() => { const { rig, G } = _T, fx = -Math.sin(yaw), fz = -Math.cos(yaw);
  CAM.position.set(G.position.x - fx * 60, G.position.y + 1.65, G.position.z - fz * 60); CAM.updateMatrixWorld(true); hcTick(9.8e5);
  const far = { L: rig.hc.L, stand: rig.mesh.visible }; G.parent.remove(G); hcTick(9.9e5); return { far, dropped: !rig.hc && !HC_RIGS.has(rig) }; });
check(`at 60 m the trout is its stand-in (L${tlv.far.L}); taken from the scene, it is dropped (${tlv.dropped})`, tlv.far.L === 2 && tlv.far.stand && tlv.dropped, tlv);
// Session 1724: the River Pike on the trout's path, twice its length
const pike = await page.evaluate(() => { const fx = -Math.sin(yaw), fz = -Math.cos(yaw), x = px + fx * 3, z = pz + fz * 3;
  const rig = buildAnimal('River Pike', 'f4pike:0'), G = new THREE.Group(); G.add(rig.root); G.position.set(x, WORLD.worldH(x, z) + .6, z); G.rotation.y = yaw + Math.PI / 2; WORLD.scene.add(G);
  const e = { name: 'River Pike', x, z, mesh: G, limbs: { wolf: rig, torso: rig.mesh }, dead: false }; rig.e = e;
  CAM.position.set(px, worldH(px, pz) + 1.65, pz); CAM.updateMatrixWorld(true);
  const ZE = ZONES.world.enemies; ZE.push(e); let k = 0; HBODY.last = -1e9; while (!rig.hc && !rig.hcFail && k++ < 300) hcTick(9.92e5 + k * (HBODY.gap + 1)); ZE.splice(ZE.indexOf(e), 1);
  const H = rig.hc; if (!H) { G.parent.remove(G); return { fail: !!rig.hcFail }; }
  G.rotation.y = 0; G.updateMatrixWorld(true); const bx = new THREE.Box3(); for (const m of H.C.meshes) bx.union(new THREE.Box3().setFromObject(m)); const sb = new THREE.Box3().setFromObject(rig.mesh);
  const sk = H.C.skel, t0 = performance.now; let i0 = 0; const run = (n, sp) => { for (let i = 0; i < n; i++) { G.position.z += sp / 60; i0++;
      performance.now = () => 9.95e5 + i0 * 1000 / 60; try { hcSwimPose(rig); } finally { performance.now = t0; } } sk.update(); return { m: Array.from(sk.boneMatrices), ph: rig.ph, g: rig.gaitNow }; };
  const a = run(60, 0), b = run(60, .8); let mv = 0; for (let i = 0; i < a.m.length; i++) mv = Math.max(mv, Math.abs(a.m[i] - b.m[i]));
  const out = { plan: H.C.g.plan, seed: H.C.g.seed, want: HC.hashKey(rig.hcKey), bones: H.C.bones.length, tris: H.C.stats.tris, len: +(bx.max.z - bx.min.z).toFixed(3), nose: +(bx.max.z - sb.max.z).toFixed(3),
    hold: a.g, swim: b.g, cyc: +(b.ph - a.ph).toFixed(2), moved: +mv.toFixed(3) }; G.parent.remove(G); hcTick(9.99e5); out.dropped = !rig.hc; return out; });
console.log('  pike:', JSON.stringify(pike));
check(`the River Pike wears the kit's (${pike.plan}, ${pike.bones} bones, ${pike.tris} triangles, ${pike.len} m nose to tail, its nose ${pike.nose} m off the stand-in's); it holds and swims by its group (${pike.hold}, ${pike.swim} at ${pike.cyc} beats a second, the bones moving ${pike.moved}); taken away, dropped`,
  !pike.fail && pike.plan === 'game:River Pike' && pike.seed === pike.want && pike.tris < 10000 && pike.len > .68 && pike.len < .84 && Math.abs(pike.nose) < .02 && pike.hold === 'hold' && pike.swim === 'swim' && pike.moved > .005 && pike.dropped, pike);
// Session 1741: the Mark's Riverjaw Salmon on the same path, the pike's parent
const salmon = await page.evaluate(() => { const fx = -Math.sin(yaw), fz = -Math.cos(yaw), x = px + fx * 3, z = pz + fz * 3;
  const rig = buildAnimal('Riverjaw Salmon', 'f4salmon:0'), G = new THREE.Group(); G.add(rig.root); G.position.set(x, WORLD.worldH(x, z) + .6, z); G.rotation.y = yaw + Math.PI / 2; WORLD.scene.add(G);
  const e = { name: 'Riverjaw Salmon', x, z, mesh: G, limbs: { wolf: rig, torso: rig.mesh }, dead: false }; rig.e = e;
  CAM.position.set(px, worldH(px, pz) + 1.65, pz); CAM.updateMatrixWorld(true);
  const ZE = ZONES.world.enemies; ZE.push(e); let k = 0; HBODY.last = -1e9; while (!rig.hc && !rig.hcFail && k++ < 300) hcTick(9.92e5 + k * (HBODY.gap + 1)); ZE.splice(ZE.indexOf(e), 1);
  const H = rig.hc; if (!H) { G.parent.remove(G); return { fail: !!rig.hcFail }; }
  G.rotation.y = 0; G.updateMatrixWorld(true); const bx = new THREE.Box3(); for (const m of H.C.meshes) bx.union(new THREE.Box3().setFromObject(m)); const sb = new THREE.Box3().setFromObject(rig.mesh);
  const sk = H.C.skel, t0 = performance.now; let i0 = 0; const run = (n, sp) => { for (let i = 0; i < n; i++) { G.position.z += sp / 60; i0++;
      performance.now = () => 9.95e5 + i0 * 1000 / 60; try { hcSwimPose(rig); } finally { performance.now = t0; } } sk.update(); return { m: Array.from(sk.boneMatrices), ph: rig.ph, g: rig.gaitNow }; };
  const a = run(60, 0), b = run(60, .8); let mv = 0; for (let i = 0; i < a.m.length; i++) mv = Math.max(mv, Math.abs(a.m[i] - b.m[i]));
  const out = { plan: H.C.g.plan, seed: H.C.g.seed, want: HC.hashKey(rig.hcKey), bones: H.C.bones.length, tris: H.C.stats.tris, len: +(bx.max.z - bx.min.z).toFixed(3), nose: +(bx.max.z - sb.max.z).toFixed(3),
    hold: a.g, swim: b.g, cyc: +(b.ph - a.ph).toFixed(2), moved: +mv.toFixed(3) }; G.parent.remove(G); hcTick(9.99e5); out.dropped = !rig.hc; return out; });
console.log('  salmon:', JSON.stringify(salmon));
check(`the Riverjaw Salmon wears the kit's (${salmon.plan}, ${salmon.bones} bones, ${salmon.tris} triangles, ${salmon.len} m nose to tail, its nose ${salmon.nose} m off the stand-in's); it holds and swims by its group (${salmon.hold}, ${salmon.swim} at ${salmon.cyc} beats a second, the bones moving ${salmon.moved}); taken away, dropped`,
  !salmon.fail && salmon.plan === 'game:Riverjaw Salmon' && salmon.seed === salmon.want && salmon.tris < 10000 && salmon.len > .75 && salmon.len < .9 && Math.abs(salmon.nose) < .02 && salmon.hold === 'hold' && salmon.swim === 'swim' && salmon.moved > .005 && salmon.dropped, salmon);
// Session 1728: the Mire Snake on the trout's path on land: its belly on the ground, its length the stand-in's, slithering as its group moves
const snake = await page.evaluate(() => { const fx = -Math.sin(yaw), fz = -Math.cos(yaw), x = px + fx * 3, z = pz + fz * 3;
  const rig = buildAnimal('Mire Snake', 'f4snake:0'), G = new THREE.Group(); G.add(rig.root); G.position.set(x, WORLD.worldH(x, z), z); G.rotation.y = yaw + Math.PI / 2; WORLD.scene.add(G);
  const e = { name: 'Mire Snake', x, z, mesh: G, limbs: { wolf: rig, torso: rig.mesh }, dead: false }; rig.e = e;
  CAM.position.set(px, worldH(px, pz) + 1.65, pz); CAM.updateMatrixWorld(true);
  const ZE = ZONES.world.enemies; ZE.push(e); let k = 0; HBODY.last = -1e9; while (!rig.hc && !rig.hcFail && k++ < 300) hcTick(9.993e5 + k * (HBODY.gap + 1)); ZE.splice(ZE.indexOf(e), 1);
  const H = rig.hc; if (!H) { G.parent.remove(G); return { fail: !!rig.hcFail }; }
  G.rotation.y = 0; G.updateMatrixWorld(true); const bx = new THREE.Box3(); for (const m of H.C.meshes) bx.union(new THREE.Box3().setFromObject(m)); const sb = new THREE.Box3().setFromObject(rig.mesh);
  const sk = H.C.skel, t0 = performance.now; let i0 = 0; const run = (n, sp) => { for (let i = 0; i < n; i++) { G.position.z += sp / 60; i0++;
      performance.now = () => 9.996e5 + i0 * 1000 / 60; try { hcSwimPose(rig); } finally { performance.now = t0; } } sk.update(); return { m: Array.from(sk.boneMatrices), ph: rig.ph, g: rig.gaitNow }; };
  const a = run(60, 0), b = run(60, .6), c = run(30, .6); let mv = 0, mv2 = 0; for (let i = 0; i < a.m.length; i++) { mv = Math.max(mv, Math.abs(a.m[i] - b.m[i])); mv2 = Math.max(mv2, Math.abs(c.m[i] - b.m[i])); }
  const out = { plan: H.C.g.plan, seed: H.C.g.seed, want: HC.hashKey(rig.hcKey), bones: H.C.bones.length, tris: H.C.stats.tris, len: +(bx.max.z - bx.min.z).toFixed(3), low: +(bx.min.y - G.position.y).toFixed(3), high: +(bx.max.y - G.position.y).toFixed(3),
    standTris: rig.tris, rest: a.g, move: b.g, cyc: +(b.ph - a.ph).toFixed(2), moved: +mv.toFixed(3), still: +mv2.toFixed(3) }; G.parent.remove(G); hcTick(9.999e5); out.dropped = !rig.hc; return out; });
console.log('  snake:', JSON.stringify(snake));
check(`the Mire Snake wears the kit's (${snake.plan}, ${snake.bones} bones, ${snake.tris} triangles; stand-in ${snake.standTris}), ${snake.len} m long, lying from ${snake.low} to ${snake.high} m over its ground; at rest it is ${snake.rest}, moving it is ${snake.move} (${snake.cyc} cycles over 0.6 m (the kit's stride, a wave's length), the bones moving ${snake.moved}, and again ${snake.still}); taken away, dropped`,
  !snake.fail && snake.plan === 'game:Mire Snake' && snake.seed === snake.want && snake.tris < 12000 && snake.len > .8 && snake.len < 1.1 && Math.abs(snake.low) < .03 && snake.high < .15 && snake.rest === 'stand' && snake.move === 'slither' && snake.cyc > .9 && snake.cyc < 1.6 && snake.moved > .005 && snake.still > .005 && snake.dropped, snake);
// Session 1757: Aurenne's Sand Wyrm on the snake's path, 14 m long, lying on its ground and slithering as its group moves; its levels by its
// size, so at 60 m it is still the kit's body, not the stand-in
const wyrm = await page.evaluate(() => { const fx = -Math.sin(yaw), fz = -Math.cos(yaw), x = px + fx * 14, z = pz + fz * 14;
  const rig = buildAnimal('Sand Wyrm', 'f4wyrm:0'), G = new THREE.Group(); G.add(rig.root); G.position.set(x, WORLD.worldH(x, z), z); G.rotation.y = yaw + Math.PI / 2; WORLD.scene.add(G);
  const e = { name: 'Sand Wyrm', x, z, mesh: G, limbs: { wolf: rig, torso: rig.mesh }, dead: false }; rig.e = e;
  CAM.position.set(px, worldH(px, pz) + 1.65, pz); CAM.updateMatrixWorld(true);
  const ZE = ZONES.world.enemies; ZE.push(e); let k = 0; HBODY.last = -1e9; while (!rig.hc && !rig.hcFail && k++ < 300) hcTick(9.9993e5 + k * (HBODY.gap + 1));
  const H = rig.hc; if (!H) { ZE.splice(ZE.indexOf(e), 1); G.parent.remove(G); return { fail: !!rig.hcFail }; }
  CAM.position.set(x - fx * 60, worldH(px, pz) + 1.65, z - fz * 60); CAM.updateMatrixWorld(true); hcTick(9.9996e5); const far = rig.hc.L; ZE.splice(ZE.indexOf(e), 1);
  G.rotation.y = 0; G.updateMatrixWorld(true); const bx = new THREE.Box3(); for (const m of H.C.meshes) bx.union(new THREE.Box3().setFromObject(m));
  const sk = H.C.skel, t0 = performance.now; let i0 = 0; const run = (n, sp) => { for (let i = 0; i < n; i++) { G.position.z += sp / 60; i0++;
      performance.now = () => 9.9997e5 + i0 * 1000 / 60; try { hcSwimPose(rig); } finally { performance.now = t0; } } sk.update(); return { m: Array.from(sk.boneMatrices), ph: rig.ph, g: rig.gaitNow }; };
  const a = run(60, 0), b = run(120, 4); let mv = 0; for (let i = 0; i < a.m.length; i++) mv = Math.max(mv, Math.abs(a.m[i] - b.m[i]));
  const out = { plan: H.C.g.plan, seed: H.C.g.seed, want: HC.hashKey(rig.hcKey), bones: H.C.bones.length, tris: H.C.stats.tris, len: +(bx.max.z - bx.min.z).toFixed(2), low: +(bx.min.y - G.position.y).toFixed(3), high: +(bx.max.y - G.position.y).toFixed(3),
    standTris: rig.tris, far, rest: a.g, move: b.g, cyc: +(b.ph - a.ph).toFixed(2), moved: +mv.toFixed(3) }; G.parent.remove(G); hcTick(9.9999e5); out.dropped = !rig.hc; return out; });
console.log('  wyrm:', JSON.stringify(wyrm));
check(`the Sand Wyrm wears the kit's (${wyrm.plan}, ${wyrm.bones} bones, ${wyrm.tris} triangles; stand-in ${wyrm.standTris}), ${wyrm.len} m long, lying from ${wyrm.low} to ${wyrm.high} m over its ground; at 60 m it is level ${wyrm.far} (its levels by its size); at rest ${wyrm.rest}, moving ${wyrm.move} (${wyrm.cyc} cycles over 8 m, the bones moving ${wyrm.moved}); taken away, dropped`,
  !wyrm.fail && wyrm.plan === 'game:Sand Wyrm' && wyrm.seed === wyrm.want && wyrm.tris < 16000 && wyrm.len > 12.5 && wyrm.len < 15 && Math.abs(wyrm.low) < .1 && wyrm.high < 2 && wyrm.far < 2 && wyrm.rest === 'stand' && wyrm.move === 'slither' && wyrm.cyc > .6 && wyrm.cyc < 2 && wyrm.moved > .005 && wyrm.dropped, wyrm);
// Session 1730: the Lantern Beetle on the same path, walking on the kit's own six legs, 6 cm long, its glow the kit's
const beetle = await page.evaluate(() => { const fx = -Math.sin(yaw), fz = -Math.cos(yaw), x = px + fx * 2, z = pz + fz * 2;
  const rig = buildAnimal('Lantern Beetle', 'f4beetle:0'), G = new THREE.Group(); G.add(rig.root); G.position.set(x, WORLD.worldH(x, z), z); G.rotation.y = yaw + Math.PI / 2; WORLD.scene.add(G);
  const e = { name: 'Lantern Beetle', x, z, mesh: G, limbs: { wolf: rig, torso: rig.mesh }, dead: false }; rig.e = e;
  CAM.position.set(px, worldH(px, pz) + 1.65, pz); CAM.updateMatrixWorld(true);
  const ZE = ZONES.world.enemies; ZE.push(e); let k = 0; HBODY.last = -1e9; while (!rig.hc && !rig.hcFail && k++ < 300) hcTick(1.0003e6 + k * (HBODY.gap + 1)); ZE.splice(ZE.indexOf(e), 1);
  const H = rig.hc; if (!H) { G.parent.remove(G); return { fail: !!rig.hcFail }; }
  G.rotation.y = 0; G.updateMatrixWorld(true); const bx = new THREE.Box3(); for (const m of H.C.meshes) bx.union(new THREE.Box3().setFromObject(m));
  const sk = H.C.skel, t0 = performance.now; let i0 = 0; const run = (n, sp) => { for (let i = 0; i < n; i++) { G.position.z += sp / 60; i0++;
      performance.now = () => 1.0006e6 + i0 * 1000 / 60; try { hcSwimPose(rig); } finally { performance.now = t0; } } sk.update(); return { m: Array.from(sk.boneMatrices), ph: rig.ph, g: rig.gaitNow }; };
  const a = run(60, 0), b = run(60, .1); let mv = 0; for (let i = 0; i < a.m.length; i++) mv = Math.max(mv, Math.abs(a.m[i] - b.m[i]));
  const glow = H.glow.length ? Math.max(...H.glow.map(u => u.value.r + u.value.g + u.value.b)) : 0, legs = H.C.bones.filter(b => /^leg\d[LR]_0$/.test(b.name)).length;
  const out = { plan: H.C.g.plan, bones: H.C.bones.length, legs, tris: H.C.stats.tris, len: +(bx.max.z - bx.min.z).toFixed(3), low: +(bx.min.y - G.position.y).toFixed(3), high: +(bx.max.y - G.position.y).toFixed(3),
    standTris: rig.tris, rest: a.g, move: b.g, cyc: +(b.ph - a.ph).toFixed(2), moved: +mv.toFixed(4), glow: +glow.toFixed(2) }; G.parent.remove(G); hcTick(1.0009e6); out.dropped = !rig.hc; return out; });
console.log('  beetle:', JSON.stringify(beetle));
check(`the Lantern Beetle wears the kit's (${beetle.plan}, ${beetle.bones} bones, ${beetle.legs} legs, ${beetle.tris} triangles; stand-in ${beetle.standTris}), ${beetle.len} m long, from ${beetle.low} to ${beetle.high} m over its ground, glowing ${beetle.glow}; at rest ${beetle.rest}, moving ${beetle.move} (${beetle.cyc} cycles over 0.1 m, the bones moving ${beetle.moved}); taken away, dropped`,
  !beetle.fail && beetle.plan === 'game:Lantern Beetle' && beetle.legs === 6 && beetle.tris < 6000 && beetle.len > .045 && beetle.len < .075 && Math.abs(beetle.low) < .01 && beetle.high < .04 && beetle.glow > 1 && beetle.rest === 'stand' && beetle.move === 'walk' && beetle.cyc > .3 && beetle.moved > 1e-4 && beetle.dropped, beetle);
// Session 1731: the Stonecrawler and the Marsh Frog on the same path, scurrying at the kit's trot and going by its hop
// Session 1742: the Mark's Frostspine Lizard (the trot) and Icecrab (eight legs, the walk) too
// Session 1747: Aurenne's Saltspine Monitor and Spined Gekko (the trot) and Amber Shellcrab (eight legs, the walk)
// Session 1893: OG-040's Bellthroat, the Marsh Frog's parent at the kit's own size (the hop)
// Session 1906: OG-040's two tortoises, the Mossback and the Sailshell, at the kit's own size (the walk)
// Session 1907: OG-040's two on six legs, the Shatterhorn (the walk) and the Mineprowler (the trot), at the kit's own size
for (const [nm, move, L, sp, legs] of [['Stonecrawler', 'trot', .3, .5, 4], ['Marsh Frog', 'hop', .12, .4, 4], ['Frostspine Lizard', 'trot', .5, .6, 4], ['Icecrab', 'walk', .8, .3, 8], ['Saltspine Monitor', 'trot', 1.8, 1.2, 4], ['Spined Gekko', 'trot', .3, .5, 4], ['Amber Shellcrab', 'walk', .4, .3, 8], ['Bellthroat', 'hop', .37, .8, 4], ['Mossback', 'walk', 2.3, .8, 4], ['Sailshell', 'walk', 2, .8, 4], ['Shatterhorn', 'walk', 6.6, 2.4, 6], ['Mineprowler', 'trot', 2.5, 1.2, 6]]) {
  const r = await page.evaluate(([nm, sp, T]) => { const fx = -Math.sin(yaw), fz = -Math.cos(yaw), x = px + fx * 2, z = pz + fz * 2;
    const rig = buildAnimal(nm, 'f4crawl:' + nm), G = new THREE.Group(); G.add(rig.root); G.position.set(x, WORLD.worldH(x, z), z); G.rotation.y = yaw + Math.PI / 2; WORLD.scene.add(G);
    const e = { name: nm, x, z, mesh: G, limbs: { wolf: rig, torso: rig.mesh }, dead: false }; rig.e = e;
    CAM.position.set(px, worldH(px, pz) + 1.65, pz); CAM.updateMatrixWorld(true);
    const ZE = ZONES.world.enemies; ZE.push(e); let k = 0; HBODY.last = -1e9; while (!rig.hc && !rig.hcFail && k++ < 300) hcTick(T + k * (HBODY.gap + 1)); ZE.splice(ZE.indexOf(e), 1);
    const H = rig.hc; if (!H) { G.parent.remove(G); return { fail: !!rig.hcFail }; }
    G.rotation.y = 0; G.updateMatrixWorld(true); const bx = new THREE.Box3(); for (const m of H.C.meshes) bx.union(new THREE.Box3().setFromObject(m));
    const sk = H.C.skel, t0 = performance.now; let i0 = 0; const run = (n, v) => { for (let i = 0; i < n; i++) { G.position.z += v / 60; i0++;
        performance.now = () => T + 5e3 + i0 * 1000 / 60; try { hcSwimPose(rig); } finally { performance.now = t0; } } sk.update(); return { m: Array.from(sk.boneMatrices), ph: rig.ph, g: rig.gaitNow }; };
    const a = run(60, 0), b = run(60, sp); let mv = 0; for (let i = 0; i < a.m.length; i++) mv = Math.max(mv, Math.abs(a.m[i] - b.m[i]));
    const out = { plan: H.C.g.plan, seed: H.C.g.seed, want: HC.hashKey(rig.hcKey), legs: H.C.B.legs.length, tris: H.C.stats.tris, len: +(bx.max.z - bx.min.z).toFixed(3), low: +(bx.min.y - G.position.y).toFixed(3),
      rest: a.g, move: b.g, cyc: +(b.ph - a.ph).toFixed(2), moved: +mv.toFixed(4) }; G.parent.remove(G); hcTick(T + 9e3); out.dropped = !rig.hc; return out; }, [nm, sp, 1.001e6 + ['Stonecrawler', 'Marsh Frog', 'Frostspine Lizard', 'Icecrab', 'Saltspine Monitor', 'Spined Gekko', 'Amber Shellcrab', 'Bellthroat', 'Mossback', 'Sailshell', 'Shatterhorn', 'Mineprowler'].indexOf(nm) * 2e4]);
  console.log('  ' + nm + ':', JSON.stringify(r));
  check(`the ${nm} wears the kit's (${r.plan}, ${r.legs} legs, ${r.tris} triangles), ${r.len} m long, its lowest ${r.low} m off its ground at rest; at rest ${r.rest}, moving ${r.move} (${r.cyc} cycles over ${sp} m, the bones moving ${r.moved}); taken away, dropped`,
    !r.fail && r.plan === 'game:' + nm && r.seed === r.want && r.legs === legs && r.tris < 9000 && r.len > L * .8 && r.len < L * 1.15 && Math.abs(r.low) < .01 && r.rest === 'stand' && r.move === move && r.cyc > .3 && r.moved > 1e-3 && r.dropped, r);
}
// Session 1914: the Bellthroat's sac swells as it calls (bellthroatCall counts e._calls): over the call's three booms it fills to more than
// half again its rest size, peaks on a boom, and is back to rest a second and a half later; with no call it stays at rest
{ const r = await page.evaluate((T) => { const fx = -Math.sin(yaw), fz = -Math.cos(yaw), x = px + fx * 2, z = pz + fz * 2;
    const rig = buildAnimal('Bellthroat', 'f4sac'), G = new THREE.Group(); G.add(rig.root); G.position.set(x, WORLD.worldH(x, z), z); WORLD.scene.add(G);
    const e = { name: 'Bellthroat', baseName: 'Bellthroat', x, z, mesh: G, limbs: { wolf: rig, torso: rig.mesh }, dead: false }; rig.e = e;
    const ZE = ZONES.world.enemies; ZE.push(e); let k = 0; HBODY.last = -1e9; while (!rig.hc && !rig.hcFail && k++ < 300) hcTick(T + k * (HBODY.gap + 1)); ZE.splice(ZE.indexOf(e), 1);
    const H = rig.hc; if (!H || !H.C.sac) { G.parent.remove(G); return { fail: true, hc: !!H }; }
    const t0 = performance.now, sx = () => H.C.sac.scale.x / 1.15; let now = T + 5e3; const at = ms => { now += ms; performance.now = () => now; try { hcSwimPose(rig); } finally { performance.now = t0; } return sx(); };
    let quiet = 0; for (let i = 0; i < 60; i++) quiet = Math.max(quiet, at(1000 / 60));
    e._calls = 1; const sw = []; for (let i = 0; i < 90; i++) sw.push(at(1000 / 60));
    const out = { quiet: +quiet.toFixed(3), peak: +Math.max(...sw).toFixed(3), peakAt: +((sw.indexOf(Math.max(...sw)) + 1) / 60).toFixed(2), mid: +sw[30].toFixed(3), after: +at(600).toFixed(3) };
    G.parent.remove(G); hcTick(T + 9e3); return out; }, 1.0015e6);
  console.log('  sac:', JSON.stringify(r));
  check(`the Bellthroat's sac swells as it calls: at rest ${r.quiet} of its size, ${r.peak} at the peak (${r.peakAt} s in), ${r.mid} between booms, ${r.after} after`,
    !r.fail && r.quiet < 1.05 && r.peak > 1.9 && r.mid > 1.4 && r.after < 1.05, r); }
// Session 1721: an island given to buildAnimal is the kit's coat for it (HC.COATS): the Mark's black hill cow and grey hen, Aurenne's cream
// cow and buff hen; the hind (an own plan) takes the deer's. The same key keeps its seed; an unknown island is none
const isles = await page.evaluate(() => { const mean = C => { const a = C.meshes[0].geometry.attributes.color.array; let r = 0, g = 0, b = 0; const n = a.length / 3;
    for (let i = 0; i < a.length; i += 3) { r += a[i]; g += a[i + 1]; b += a[i + 2]; } return [r / n, g / n, b / n].map(v => +v.toFixed(3)); };
  const out = {}; for (const [nm, key] of [['Cow', 'f4isles:0'], ['Hen', 'f4isles:1'], ['Deer', 'f4animals:5']]) { out[nm] = {};
    for (const isle of [undefined, 'mark', 'aurenne']) { const rig = buildAnimal(nm, key, isle); WOLF_RIGS.delete(rig); const g = hcGenome(rig);
      const C = HC.build(g); out[nm][isle || 'none'] = { island: g.island || null, seed: g.seed, col: mean(C) }; for (const m of C.meshes) m.geometry.dispose(); } }
  { const r = buildAnimal('Cow', 'f4isles:0', 'atlantis'); WOLF_RIGS.delete(r); out.bad = r.hcIsland === undefined; } return out; });
console.log('  isles:', JSON.stringify(isles));
const lum = c => c[0] + c[1] + c[2], differ = (a, b) => Math.max(...a.map((v, i) => Math.abs(v - b[i]))) > .03;
check(`by island the coat (mean colour, plan / Mark / Aurenne): cow ${['none', 'mark', 'aurenne'].map(k => isles.Cow[k].col.join(' ')).join(' / ')}; hen ${['none', 'mark', 'aurenne'].map(k => isles.Hen[k].col.join(' ')).join(' / ')}; the hind's from the deer's`,
  ['Cow', 'Hen', 'Deer'].every(nm => isles[nm].none.island === null && isles[nm].mark.island === 'mark' && isles[nm].aurenne.island === 'aurenne' &&
    isles[nm].mark.seed === isles[nm].none.seed && differ(isles[nm].none.col, isles[nm].mark.col) && differ(isles[nm].none.col, isles[nm].aurenne.col)) &&
  lum(isles.Cow.mark.col) < lum(isles.Cow.none.col) && lum(isles.Cow.aurenne.col) > lum(isles.Cow.none.col) && isles.bad, isles);
await page.evaluate(() => { REN.render(scene, CAM); });
check('no page errors', g.errs.length === 0, g.errs.slice(0, 3));
await g.close();
