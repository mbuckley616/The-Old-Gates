// Card F4 (Session 1195): on the new look the townsfolk wear the builder's bodies (docs/design/character-builder.md;
// vendor/people.builder.js and vendor/mh-pack.js, made by scripts/people_bundle.py). The old 17-bone rig still drives them;
// the builder's 163-bone skeleton copies its joints each frame (32-people.js, hbPose). Dunmore at noon: the people in the
// street are the genome's meshes, each the same person on a second boot, walking, under the draw-call budget at the middle
// quality, with the far ones on the cheap level. Pictures in docs/prototypes/f4/.
import { boot, check, ROOT } from './lib/game.mjs';
import { execFileSync } from 'child_process';
import fs from 'fs'; import path from 'path';
const OUT = path.join(ROOT, 'docs', 'prototypes', 'f4'); fs.mkdirSync(OUT, { recursive: true });

// the game's copy of the builder is people.js as it stands (a stale copy would put an old body in the game)
let fresh = true; try { execFileSync('python3', [path.join(ROOT, 'scripts', 'people_bundle.py'), '--check'], { stdio: 'pipe' }); } catch (e) { fresh = false; }
check('vendor/people.builder.js is what people.js makes now (python3 scripts/people_bundle.py)', fresh);

// Dunmore's square at noon, every body within reach of the eye built (one at a time, nearest first, as the game builds them)
async function dunmore(g) {
  const { page } = g;
  await g.intoWorld(); await g.settle('dunmore');
  return page.evaluate(() => { forceTime(12); for (let i = 0; i < 120; i++) WORLD.tick(1 / 60, performance.now());
    const t = WORLD.siteAnywhere('dunmore'); px = t.x; pz = t.z + 4; yaw = 0; pitch = 0; for (let i = 0; i < 30; i++) WORLD.tick(1 / 60, performance.now());
    CAM.position.set(px, worldH(px, pz) + 1.65, pz); CAM.updateMatrixWorld(true);
    const want = () => [...HB_RIGS].filter(r => (!r.hb || r.hb.cold) && !r.hbFail && r.root.parent === WORLD.scene && r.root.visible && Math.hypot(CAM.position.x - r.root.position.x, CAM.position.z - r.root.position.z) < HBODY.build).length;
    { const t1 = performance.now(); while (JOBS.length && performance.now() - t1 < 20000) runJobs(); } // the loading comes first (hbTick waits for it)
    REN.render(scene, CAM); const p0 = REN.info.programs.length; // the street drawn once, without the builder's bodies
    let k = 0; const t0 = performance.now(); while (want() && k++ < 1500) tickPeople(1 / 60, 1e5 + k * (HBODY.gap + 1));
    const p1 = REN.info.programs.length, shown = [...HB_RIGS].filter(r => r.hb && r.hb.L < 2).length; REN.render(scene, CAM);
    return { ticks: k, left: want(), ms: Math.round(performance.now() - t0), built: HBODY.n, msEach: Math.round(HBODY.ms / Math.max(1, HBODY.n)), frames: HBODY.frames, worst: Math.round(HBODY.worst), warmed: p1 - p0, shown, atDraw: REN.info.programs.length - p1 }; });
}

const g = await boot({ look: 'new' }); const { page } = g;
const b1 = await dunmore(g);
console.log('  built:', JSON.stringify(b1));
// S1284: a new body's programs are made before it is shown (hbWarm): the first frame that draws them compiles nothing
// S1294: a body is built a few pieces a frame (people.js's makePersonIter), not in one frame
check('each body is built over several frames, a few pieces at a time', b1.built >= 4 && b1.frames >= 2 * b1.built, b1);
check('the first frame that draws the new bodies compiles no program: they were made while the driver stood in', b1.shown >= 4 && b1.warmed > 0 && b1.atDraw === 0, b1);

const who = await page.evaluate(() => { const rs = [...PEOPLE_RIGS].filter(r => r.root.parent === WORLD.scene && !r.foe);
  const hb = rs.filter(r => HB_RIGS.has(r)), built = hb.filter(r => r.hb);
  return { people: rs.length, hb: hb.length, built: built.length, keys: hb.every(r => /^dunmore|:/.test(r.g.hbKey)),
    bones: [...new Set(built.map(r => r.hb.P.skeleton.bones.filter(b => !/^hemBone/.test(b.name)).length))], hem: built.filter(r => r.hb.P.hem).length, // S1989: a long cloak's hem adds one bone of its own (S1999: and its front another)
    driver: built.every(r => r.mesh.skeleton.bones.length >= 17 && r.mesh.skeleton.bones.length <= 20),
    tris: built.map(r => { let t = 0; r.hb.root.traverse(o => { if (o.isMesh) t += (o.geometry.index ? o.geometry.index.count : o.geometry.attributes.position.count) / 3; }); return Math.round(t); }),
    statures: built.map(r => +(r.hb.st * r.hb.root.scale.x * r.root.scale.x).toFixed(2)), oldStatures: built.map(r => +(r.root.scale.y * SCALE.PERSON_MODEL / PW.BODY).toFixed(2)),
    peoples: [...new Set(built.map(r => r.hbG.people))], sample: built.slice(0, 6).map(r => r.g.hbKey) }; });
check('every townsperson in Dunmore wears the builder\'s body, keyed by place and name, on its 163-bone skeleton (a long cloak adds its hem\'s bone) over the 17-bone driver',
  who.people >= 8 && who.hb === who.people && who.built >= 4 && who.keys && who.bones.length === 1 && who.bones[0] === 163 && who.driver, who);
check('at the stature the game gives them (within 2 cm of the driver\'s)', who.statures.every((s, i) => Math.abs(s - who.oldStatures[i]) < .02), { s: who.statures, old: who.oldStatures });

// the same person on every load: the genome comes from the key alone
const genomes = await page.evaluate((keys) => Object.fromEntries(keys.map(k => [k, JSON.stringify(HB.toSaved(HB_GENOMES.get(k)))])), who.sample);
const again = await page.evaluate((keys) => keys.every(k => { const r = [...HB_RIGS].find(x => x.g.hbKey === k).g, o = { people: HB_GENOMES.get(k).people, g: r.female ? 0 : 1, child: !!r.child, old: r.age === 'elder' };
  return JSON.stringify(HB.toSaved(HB.rollGenome(k, o))) === JSON.stringify(HB.toSaved(HB.rollGenome(k, o))); }), who.sample);
check('a genome is the same rolled twice from its key', again);


// S1763 (L1, OG-109's winter column): in winter, out of doors, a share of each people wear the kit's winter coat (the Aurennais the
// burnous); indoors and out of winter, none. 40 villagers a people under a test key, rolled in winter, indoors and in autumn
const winter = await page.evaluate(() => { const was = worldState.gameTimeAbsMinutes, peoples = ['gatelander', 'markman', 'oldblood', 'aurennais'];
  const forget = () => { for (const k of [...HB_GENOMES.keys()]) if (/^wtest/.test(k)) HB_GENOMES.delete(k); for (const k of [...PEOPLE_GENOMES.keys()]) if (/wtest/.test(k)) PEOPLE_GENOMES.delete(k); };
  const run = () => { const res = {}; for (const pk of peoples) { const o = { n: 0, coat: 0, fur: 0, burnous: 0, tint: 0 };
    for (let i = 0; i < 40; i++) { const root = buildNPCMesh({ role: 'villager', name: 'W' + pk + i, people: pk }, { key: 'wtest' }); const rig = [...HB_RIGS].find(x => x.root === root);
      if (!rig) continue; o.n++; const D = rig.hbG.dress; if (D.coat) { o.coat++; if (Math.abs(rig.g.cloth.r - D.coat[0]) < 1e-3) o.tint++; } if (D.coatFur) o.fur++; if (D.burnous) { o.burnous++; if (D.hood === 'down') { o.down = (o.down || 0) + 1; if (o.point == null) { const p = HB.makePerson(rig.hbG); o.point = !!(p.root.getObjectByName('hoodPoint') && p.root.getObjectByName('tassel')); } } }
      HB_RIGS.delete(rig); PEOPLE_RIGS.delete(rig); } res[pk] = o; } forget(); return res; };
  worldState.gameTimeAbsMinutes = 1440 * 28 * 4 + 600; const season = calDay().season, out = run();
  currentHouse = { id: 'wtest' }; const indoor = run(); currentHouse = null;
  worldState.gameTimeAbsMinutes = 600; const autumn = run(), season2 = calDay().season; worldState.gameTimeAbsMinutes = was;
  const sum = (R, f) => Object.values(R).reduce((s, o) => s + f(o), 0);
  return { season, season2, out, indoorAll: sum(indoor, o => o.coat + o.burnous), autumnAll: sum(autumn, o => o.coat + o.burnous) }; });
console.log('  winter:', JSON.stringify(winter));
const W = winter.out;
check('in winter, out of doors, a share of each people wear the winter coat (the Markmen most, fur-lined; the Aurennais the burnous) and the distant copy takes the coat\'s colour',
  winter.season === 'winter' && W.markman.coat >= 28 && W.markman.fur === W.markman.coat && W.gatelander.coat >= 10 && W.gatelander.coat <= 30 && W.oldblood.coat >= 5 && W.oldblood.fur === 0 &&
  W.aurennais.burnous >= 4 && W.aurennais.coat === 0 && Object.values(W).every(o => o.n === 40 && o.tint === o.coat), winter);
// S1770: a burnous worn with its hood down is built with the hood's point hanging down the back, its tassel at the point
check(`a burnous with its hood down (${W.aurennais.down || 0} of ${W.aurennais.burnous}) is built with the hood's point and its tassel`, W.aurennais.down > 0 && W.aurennais.point === true, W.aurennais);
check('indoors and out of winter nobody wears it', winter.season2 !== 'winter' && winter.indoorAll === 0 && winter.autumnAll === 0, winter);

// S1767 (L1, OG-109's Mark formal column): on a feast day seven in ten of the Mark's folk wear the woven bands (a man's tunic to the knee),
// indoors and out; nobody else, and nobody the day after. The Empty Chair falls in winter: out of doors a coat goes over the bands
const feast = await page.evaluate(() => { const was = worldState.gameTimeAbsMinutes, peoples = ['gatelander', 'markman', 'oldblood', 'aurennais'];
  const forget = () => { for (const k of [...HB_GENOMES.keys()]) if (/^ftest/.test(k)) HB_GENOMES.delete(k); for (const k of [...PEOPLE_GENOMES.keys()]) if (/ftest/.test(k)) PEOPLE_GENOMES.delete(k); };
  const run = () => { const res = {}; let one = null; for (const pk of peoples) { const o = { n: 0, bands: 0, knee: 0, men: 0, apron: 0, coat: 0, same: 0 };
    for (let i = 0; i < 40; i++) { const root = buildNPCMesh({ role: 'villager', name: 'F' + pk + i, people: pk }, { key: 'ftest' }); const rig = [...HB_RIGS].find(x => x.root === root);
      if (!rig) continue; o.n++; const D = rig.hbG.dress; if (D.bands) { o.bands++; if (D.skirt === 'knee') o.knee++; if (rig.hbG.g === 1 || rig.hbG.g === undefined && !rig.g.female) o.men++; if (D.apron) o.apron++; if (D.coat) o.coat++;
        if (D.bands.every((v, j) => Math.abs(v - D.bandsMotif[j]) < .02)) o.same++; if (!one && !D.coat) one = rig.hbG; }
      HB_RIGS.delete(rig); PEOPLE_RIGS.delete(rig); } res[pk] = o; } forget(); return { res, one }; };
  const at = n => { worldState.gameTimeAbsMinutes = 1440 * n + 600; return feastOn() ? feastOn().key : null; };
  const k1 = at(168), kind = run(); const k2 = at(169), after = run(); const k3 = at(111), season3 = calDay().season, chair = run();
  currentHouse = { id: 'ftest' }; const chairIn = run(); currentHouse = null; worldState.gameTimeAbsMinutes = was;
  let built = null; if (kind.one) { const keysOf = G => { const p = HB.makePerson(G), k = Object.fromEntries(p.meshes.filter(m => /^(tunic|skirt|cuffs)$/.test(m.name)).map(m => [m.name, m.material.customProgramCacheKey()])); p.root.traverse(o => { if (o.geometry) o.geometry.dispose(); }); return k; };
    const keys = keysOf(kind.one), plain = keysOf({ ...kind.one, dress: { ...kind.one.dress, bands: null, bandsMotif: null } });
    built = { loz: Object.keys(keys).filter(k => keys[k] !== plain[k]), knee: kind.one.dress.skirt !== 'knee' || (keys.skirt || '').includes('[-0.345,') }; }
  const sum = (R, f) => Object.values(R).reduce((s, o) => s + f(o), 0);
  return { k1, k2, k3, season3, mark: kind.res.markman, others: sum(kind.res, o => o.bands) - kind.res.markman.bands,
    after: sum(after.res, o => o.bands), chairOut: chair.res.markman, chairIn: chairIn.res.markman, built }; });
console.log('  feast:', JSON.stringify(feast));
const FM = feast.mark;
check('on a feast day seven in ten of the Mark\'s folk wear the woven bands (a man\'s tunic to the knee, the apron off, the lozenges never the ground\'s colour), nobody else, nobody the day after',
  feast.k1 === 'kindling' && feast.k2 === null && FM.n === 40 && FM.bands >= 20 && FM.bands <= 36 && FM.knee >= 1 && FM.apron === 0 && FM.same === 0 && feast.others === 0 && feast.after === 0, feast);
check('the bands are woven into the tunic, the skirt and the cuffs as the kit builds them; on the Empty Chair (winter) a coat goes over them out of doors, not by the hearth',
  !!feast.built && feast.built.loz.includes('tunic') && feast.built.knee && feast.k3 === 'emptychair' && feast.season3 === 'winter' && feast.chairOut.coat >= 15 && feast.chairIn.bands === FM.bands && feast.chairIn.coat === 0, feast);

// walking: a walker's builder bones follow the driver's stride
const walk = await page.evaluate(() => { const rig = [...HB_RIGS].find(r => r.hb && r.root.visible && r.root.parent === WORLD.scene && PEOPLE_RIGS.has(r) && !r.sleep && !r.g.gear && r.hb.L === 0); const root = rig.root, fy = root.rotation.y, sk = rig.hb.P.skeleton;
  const snap = () => { root.updateMatrixWorld(true); sk.update(); return Float32Array.from(sk.boneMatrices); };
  const m0 = snap(); let worst = 0, moved = 0;
  for (let i = 1; i <= 40; i++) { root.position.x += Math.sin(fy) * .012; root.position.z += Math.cos(fy) * .012; tickPeople(1 / 60, 3e5 + i * 16.7); }
  const m1 = snap(); for (let i = 0; i < m1.length; i++) { const d = Math.abs(m1[i] - m0[i]); if (d > 1e-4) moved++; worst = Math.max(worst, d); }
  // and the builder's foot stays with the driver's ankle
  const v = new THREE.Vector3(), w = new THREE.Vector3(); rig.B.anL.getWorldPosition(v); rig.hb.P.byName[HBODY.swap ? 'foot.R' : 'foot.L'].getWorldPosition(w);
  return { key: rig.g.hbKey, walk: +rig.w.walk.toFixed(2), level: rig.hb.L, moved, worst: +worst.toFixed(3), footGap: +v.distanceTo(w).toFixed(3), run: +rig.w.run.toFixed(2) }; });
check('walking, the builder\'s bones move with the stride (40 ticks) and its foot keeps to the driver\'s ankle', walk.walk > .9 && walk.moved > 200 && walk.worst > .05 && walk.footGap < .2, walk);

// S1434 — the arms under a cloak (Michael's #274): the cloak rides the pelvis, so through the walk the arms it covers are held in under
// it. Each cloaked walker's hand and forearm points (every other one) are read round the neck's axis against the cloak's columns, as
// people.js's armsThrough does at rest (one through by 3 mm counts: the shoulders still turn a little with the spine), on every third tick of a 60-tick walk; and an arm no cloak covers still swings
const cloaks = await page.evaluate(() => { const v = new THREE.Vector3();
  const test = rig => { const P = rig.hb.P, cloak = rig.hb.full.find(m => m.name === 'cloak'), body = rig.hb.full.filter(m => m.isSkinnedMesh && !m.name).sort((a, b) => b.geometry.attributes.position.count - a.geometry.attributes.position.count)[0];
    rig.root.updateMatrixWorld(true); const inv = cloak.matrixWorld.clone().invert(), K = 56, R = cloak.geometry.attributes.position.count / K, at = (m, i) => { m.getVertexPosition(i, v); return v.applyMatrix4(inv).clone(); };
    const neck = P.byName['neck01'].getWorldPosition(new THREE.Vector3()).applyMatrix4(inv), ax = neck.x, az = neck.z, pol = [];
    for (let k = 0; k < K; k++) { const c = []; for (let r = 0; r < R; r++) { const q = at(cloak, k * R + r); c.push({ th: Math.atan2(q.x - ax, -(q.z - az)), r: Math.hypot(q.x - ax, q.z - az), y: q.y }); } pol.push(c); }
    const col = (k, y) => { const c = pol[k]; let lo = 0; while (lo < R - 2 && c[lo + 1].y > y) lo++; const a = c[lo], b = c[lo + 1], t = Math.max(0, Math.min(1, (a.y - y) / Math.max(1e-6, a.y - b.y))); return { th: a.th + (b.th - a.th) * t, r: a.r + (b.r - a.r) * t }; };
    let yHem = -1e9; for (const c of pol) yHem = Math.max(yHem, c[R - 1].y); const yTop = neck.y - .14, bones = body.skeleton.bones, si = body.geometry.attributes.skinIndex, sw = body.geometry.attributes.skinWeight;
    if (!rig._arm) { rig._arm = []; for (let i = 0; i < si.count; i += 2) { let b = 0, w = 0; for (let q = 0; q < 4; q++) if (sw.getComponent(i, q) > w) { w = sw.getComponent(i, q); b = si.getComponent(i, q); } if (/upperarm|lowerarm|wrist|finger|metacarpal/.test(bones[b].name)) { rig._arm.push(i); (rig._armB = rig._armB || []).push(bones[b].name); } } }
    let tested = 0, out = 0, worst = 0, at0 = null;
    for (let ai = 0; ai < rig._arm.length; ai++) { const i = rig._arm[ai]; const p = at(body, i); if (p.y > yTop || p.y < yHem + .01) continue; const th = Math.atan2(p.x - ax, -(p.z - az)), r = Math.hypot(p.x - ax, p.z - az);
      if (th < col(1, p.y).th || th > col(K - 2, p.y).th) continue; let k = 1, A = col(1, p.y), B = col(2, p.y); while (k < K - 3 && B.th < th) { k++; A = B; B = col(k + 1, p.y); }
      const t = Math.max(0, Math.min(1, (th - A.th) / Math.max(1e-6, B.th - A.th))), cr = A.r + (B.r - A.r) * t; tested++; if (r - cr > worst) { worst = r - cr; at0 = rig._armB[ai] + '@' + p.y.toFixed(2); } if (r > cr + .003) out++; }
    return { tested, out, worst, at: at0 }; };
  const rigs = [...HB_RIGS].filter(r => r.hb && r.hb.L < 2 && r.root.parent === WORLD.scene && !r.sleep && r.hb.full.find(m => m.name === 'cloak')).slice(0, 4);
  return rigs.map(rig => { const root = rig.root, fy = root.rotation.y, hold = rig.hb.hold, o = { key: rig.g.hbKey, held: hold ? hold.size : 0, rest: test(rig), tested: 0, out: 0, worst: 0, swing: 0 };
    const wr = rig.hb.P.byName['wrist.R'], free = hold && !hold.has(rig.hb.map.findIndex(([j]) => j === 'wrR')), seen = [];
    for (let i = 1; i <= 60; i++) { root.position.x += Math.sin(fy) * .012; root.position.z += Math.cos(fy) * .012; tickPeople(1 / 60, 6e5 + i * 16.7);
      if (i > 15 && i % 3 === 0) { const c = test(rig); o.tested += c.tested; o.out += c.out; if (c.worst > o.worst) { o.worst = c.worst; o.at = c.at + ' tick ' + i + ' walk ' + rig.w.walk.toFixed(2); } if (free) seen.push(wr.getWorldPosition(new THREE.Vector3()).applyMatrix4(root.matrixWorld.clone().invert())); } }
    if (free) o.swing = +Math.max(...seen.map(a => Math.max(...seen.map(b => Math.abs(a.z - b.z))))).toFixed(3); o.free = !!free; o.worst = +o.worst.toFixed(3); o.walk = +rig.w.walk.toFixed(2); return o; }); });
console.log('  cloaks:', JSON.stringify(cloaks));
check(`walking, no arm comes out through a cloak (${cloaks.map(c => c.out + ' of ' + c.tested).join(', ')} hand and forearm points under it out by 3 mm or more, at most ${Math.max(...cloaks.map(c => c.worst)) * 1000} mm, ${cloaks.length} cloaked walkers)`,
  cloaks.length >= 2 && cloaks.every(c => c.held > 0 && c.walk > .9 && c.rest.out === 0 && c.tested > 1000 && c.out === 0 && c.worst < .006), cloaks);
const freeArm = cloaks.filter(c => c.free);
if (freeArm.length) check(`the right arm a thrown-back cloak leaves out still swings (the wrist ${freeArm.map(c => c.swing).join(', ')} m fore and aft)`, freeArm.every(c => c.swing > .05), freeArm);
// S1987 — the legs under a long cloak: the cloak rode the pelvis whole, so the stride carried a skirt, the trousers or the boots out through
// its sides and front (S1980's Sinéad, her tunic through at the hip). Its skirts are weighted in part to the thighs and shins (hbCloakLegs).
// The same cloaked walkers, every other point of what they wear on the legs (the legs' bones; the body's own legs too), read round the
// neck's axis against the cloak's columns as the arms are, on every third tick of a 60-tick walk; a point out by 3 mm counts
const cloakLegs = await page.evaluate(() => { const v = new THREE.Vector3();
  const test = rig => { const P = rig.hb.P, cloak = rig.hb.full.find(m => m.name === 'cloak');
    rig.root.updateMatrixWorld(true); const inv = cloak.matrixWorld.clone().invert(), K = 56, R = cloak.geometry.attributes.position.count / K, at = (m, i) => { m.getVertexPosition(i, v); return v.applyMatrix4(inv).clone(); };
    const neck = P.byName['neck01'].getWorldPosition(new THREE.Vector3()).applyMatrix4(inv), ax = neck.x, az = neck.z, pol = [];
    for (let k = 0; k < K; k++) { const c = []; for (let r = 0; r < R; r++) { const q = at(cloak, k * R + r); c.push({ th: Math.atan2(q.x - ax, -(q.z - az)), r: Math.hypot(q.x - ax, q.z - az), y: q.y }); } pol.push(c); }
    const col = (k, y) => { const c = pol[k]; let lo = 0; while (lo < R - 2 && c[lo + 1].y > y) lo++; const a = c[lo], b = c[lo + 1], t = Math.max(0, Math.min(1, (a.y - y) / Math.max(1e-6, a.y - b.y))); return { th: a.th + (b.th - a.th) * t, r: a.r + (b.r - a.r) * t }; };
    let yHem = -1e9; for (const c of pol) yHem = Math.max(yHem, c[R - 1].y); const yTop = neck.y - .14;
    if (!rig._legs) { rig._legs = []; for (const m of rig.hb.full.filter(m => m.isSkinnedMesh && /^(|skirt|trousers|boots|legWraps|apron)$/.test(m.name))) { const g = m.geometry, si = g.attributes.skinIndex, sw = g.attributes.skinWeight, bones = m.skeleton.bones, u = new Uint8Array(g.attributes.position.count);
      if (g.index) for (const i of g.index.array) u[i] = 1; else u.fill(1); const ix = [];
      for (let i = 0; i < u.length; i += 2) { if (!u[i]) continue; let b = 0, w = 0; for (let q = 0; q < 4; q++) if (sw.getComponent(i, q) > w) { w = sw.getComponent(i, q); b = si.getComponent(i, q); } if (/^(upperleg|lowerleg|foot|toe)/.test(bones[b].name)) ix.push(i); }
      rig._legs.push([m, ix]); } }
    let tested = 0, out = 0, worst = 0;
    for (const [m, ix] of rig._legs) for (const i of ix) { const p = at(m, i); if (p.y > yTop || p.y < yHem + .01) continue; const th = Math.atan2(p.x - ax, -(p.z - az)), r = Math.hypot(p.x - ax, p.z - az);
      if (th < col(1, p.y).th || th > col(K - 2, p.y).th) continue; let k = 1, A = col(1, p.y), B = col(2, p.y); while (k < K - 3 && B.th < th) { k++; A = B; B = col(k + 1, p.y); }
      const t = Math.max(0, Math.min(1, (th - A.th) / Math.max(1e-6, B.th - A.th))), cr = A.r + (B.r - A.r) * t; tested++; worst = Math.max(worst, r - cr); if (r > cr + .003) out++; }
    return { tested, out, worst }; };
  const rigs = [...HB_RIGS].filter(r => r.hb && r.hb.L < 2 && r.root.parent === WORLD.scene && !r.sleep && r.hb.full.find(m => m.name === 'cloak')).slice(0, 4);
  return rigs.map(rig => { const root = rig.root, fy = root.rotation.y, o = { key: rig.g.hbKey, legs: rig.hb.P.cloakLegs ? rig.hb.P.cloakLegs.n : 0, tested: 0, out: 0, worst: 0, hem: rig.hb.P.hem ? 0 : -1 };
    for (let i = 1; i <= 60; i++) { root.position.x += Math.sin(fy) * .012; root.position.z += Math.cos(fy) * .012; tickPeople(1 / 60, 7e5 + i * 16.7);
      if (rig.hb.P.hem) { o.hem = Math.max(o.hem, +rig.hb.P.hem.a.toFixed(2)); o.sL = Math.max(o.sL || 0, rig.hb.P.hem.aS[0]); o.sR = Math.max(o.sR || 0, rig.hb.P.hem.aS[1]); o.side = +Math.min(o.sL, o.sR).toFixed(2); }
      if (i > 15 && i % 3 === 0) { const c = test(rig); o.tested += c.tested; o.out += c.out; o.worst = Math.max(o.worst, c.worst); } }
    o.worst = +o.worst.toFixed(3); return o; }); });
console.log('  legs under the cloaks:', JSON.stringify(cloakLegs));
{ const T = cloakLegs.reduce((a, c) => a + c.tested, 0), O = cloakLegs.reduce((a, c) => a + c.out, 0);
  check(`walking, the legs stay under a long cloak: its skirts go with the thighs (${O} of ${T} points of what the legs wear out of it by 3 mm or more, ${cloakLegs.filter(c => c.tested).length} walkers in a long cloak)`,
    cloakLegs.filter(c => c.tested).length >= 2 && T > 3000 && cloakLegs.every(c => !c.tested || c.legs > 0) && O / T < .08, cloakLegs); }
// S1989 — the hem pushed by the heel: the back of a long cloak rides a bone of its own at the hips (hbCloakLegs adds it, hbHem swings it
// back by the further-trailing leg), so a trailing heel no longer goes out through the back hem (Clodagh of Dunmore, 16.8 cm out)
check(`walking, a long cloak's back hem swings back over the trailing heel (its bone up to ${Math.max(...cloakLegs.map(c => c.hem))} rad)`,
  cloakLegs.every(c => !c.tested || c.hem >= 0) && cloakLegs.filter(c => c.tested && c.hem > .1).length >= 2, cloakLegs);
// S2026 — and each side of the back by its own leg (Clodagh's heel 30–60° off straight back): over the walk both side bones swing back
check(`walking, each side of a long cloak's back swings back over its own heel (both side bones up to ${Math.max(...cloakLegs.map(c => c.side || 0))} rad)`,
  cloakLegs.filter(c => c.tested && c.side > .1).length >= 2, cloakLegs);
// S1974 — a braid laid over a long cloak stays over it in the walk (S1966 laid it there in the builder's pose). The cloak rides the pelvis
// (hbSkinLoose) and the hair the head, so the walk sank most of a braid under the sheet; the hair on the sheet now rides the pelvis too
// (hbHairOnCloak). Before the cast's checks, which leave Dunmore. One cloaked walker of Dunmore rebuilt with a long braid; every third point of it near the sheet (within 4 cm) read
// along the sheet's normal, at rest and on every third tick of a 60-tick walk past the 24th; then her own body is put back
const braidWalk = await page.evaluate(() => { const v = new THREE.Vector3();
  const rig = [...HB_RIGS].find(r => r.hb && r.root.parent === WORLD.scene && !r.sleep && r.hbG && r.hbG.dress && r.hbG.dress.cloak && !r.hbG.dress.cape); if (!rig) return null;
  const G0 = rig.hbG, G = JSON.parse(JSON.stringify(G0)); G.hair = { style: 'braid', len: .75 }; G.dress = Object.assign({}, G.dress, { hood: null, cloakLen: .9 });
  hbDrop(rig); rig.hbG = G; hbAttach(rig); if (!rig.hb) return { fail: true }; hbLevel(rig, 0); hbPose(rig);
  const P = rig.hb.P, full = rig.hb.full, hair = full.filter(m => m.isSkinnedMesh && /^(braid\d|tie|brush)$/.test(m.name)), parts = full.filter(m => m.isSkinnedMesh && /^(cloak|cloakHem|hood|collar\d)$/.test(m.name));
  const sample = () => { rig.root.updateMatrixWorld(true); const CP = [], CN = [];
    for (const m of parts) { const n = m.geometry.attributes.position.count, g2 = new THREE.BufferGeometry(), a = new Float32Array(n * 3); for (let i = 0; i < n; i++) { m.getVertexPosition(i, v); v.applyMatrix4(m.matrixWorld); a[i * 3] = v.x; a[i * 3 + 1] = v.y; a[i * 3 + 2] = v.z; }
      g2.setAttribute('position', new THREE.BufferAttribute(a, 3)); if (m.geometry.index) g2.setIndex(m.geometry.index); g2.computeVertexNormals(); const nn = g2.attributes.normal.array; for (let i = 0; i < a.length; i++) { CP.push(a[i]); CN.push(nn[i]); } }
    const cell = .04, grid = new Map(); for (let q = 0; q < CP.length / 3; q++) { const h = Math.floor(CP[q * 3] / cell) + ',' + Math.floor(CP[q * 3 + 1] / cell) + ',' + Math.floor(CP[q * 3 + 2] / cell); let l = grid.get(h); if (!l) grid.set(h, l = []); l.push(q); }
    let n = 0, under = 0, worst = 0;
    for (const m of hair) { const c = m.geometry.attributes.position.count; for (let i = 0; i < c; i += 3) { m.getVertexPosition(i, v); v.applyMatrix4(m.matrixWorld); let best = -1, bd = cell * cell; const cx = Math.floor(v.x / cell), cy = Math.floor(v.y / cell), cz = Math.floor(v.z / cell);
      for (let a = -1; a <= 1; a++) for (let b = -1; b <= 1; b++) for (let e = -1; e <= 1; e++) { const l = grid.get((cx + a) + ',' + (cy + b) + ',' + (cz + e)); if (l) for (const q of l) { const d = (CP[q * 3] - v.x) ** 2 + (CP[q * 3 + 1] - v.y) ** 2 + (CP[q * 3 + 2] - v.z) ** 2; if (d < bd) { bd = d; best = q; } } }
      if (best < 0) continue; const s = (v.x - CP[best * 3]) * CN[best * 3] + (v.y - CP[best * 3 + 1]) * CN[best * 3 + 1] + (v.z - CP[best * 3 + 2]) * CN[best * 3 + 2]; n++; if (s < -.003) under++; worst = Math.min(worst, s); } }
    return { n, under, worst }; };
  const rest = sample(), root = rig.root, fy = root.rotation.y, o = { key: rig.g.hbKey, ride: P.cloak && P.cloak.hairOver && P.cloak.hairOver.ride, rest, tested: 0, under: 0, worst: 0 };
  const T = performance.now() + 1e5; for (let i = 1; i <= 60; i++) { root.position.x += Math.sin(fy) * .012; root.position.z += Math.cos(fy) * .012; tickPeople(1 / 60, T + i * 16.7);
    if (i > 24 && i % 3 === 0) { const c = sample(); o.tested += c.n; o.under += c.under; o.worst = Math.min(o.worst, c.worst); } }
  o.worst = +o.worst.toFixed(4); o.walk = +rig.w.walk.toFixed(2); o.w = Object.fromEntries(Object.entries(rig.w).map(([k, x]) => [k, +x.toFixed(2)]));
  hbDrop(rig); rig.hbG = G0; hbAttach(rig); if (rig.hb) { hbLevel(rig, 0); hbPose(rig); } o.back = !!rig.hb && rig.hbG === G0 && rig.hb.P.hair.style === (G0.hair && G0.hair.style || rig.hb.P.hair.style); return o; });
console.log('  braid over the cloak:', JSON.stringify(braidWalk));
check(`walking, a braid laid over a long cloak stays over it (${braidWalk && braidWalk.under} of ${braidWalk && braidWalk.tested} of its points near the sheet under it by 3 mm or more; it rides the pelvis where it lies on the cloth)`,
  !!braidWalk && !braidWalk.fail && braidWalk.ride && braidWalk.ride.n > 500 && braidWalk.rest.under === 0 && braidWalk.walk > .9 && braidWalk.tested > 3000 && braidWalk.under <= braidWalk.tested * .002 && braidWalk.back, braidWalk);

// the levels by distance, and the budget at the middle quality
const lv = await page.evaluate(() => { SETTINGS.quality = 1; const t = WORLD.siteAnywhere('dunmore'); px = t.x; pz = t.z + 4; yaw = 0; pitch = 0;
  CAM.position.set(px, worldH(px, pz) + 1.65, pz); CAM.rotation.set(0, 0, 0); CAM.updateMatrixWorld(true); tickPeople(1 / 60, 4e5);
  const rs = [...HB_RIGS].filter(r => r.hb && r.root.parent === WORLD.scene && r.root.visible), d = r => Math.hypot(CAM.position.x - r.root.position.x, CAM.position.z - r.root.position.z);
  const bad = rs.filter(r => (d(r) < HBODY.near - 1 && r.hb.L !== 0) || (d(r) > HBODY.mid + 1 && r.hb.L !== 2) || (r.hb.L === 2) !== r.mesh.visible || (r.hb.L < 2) !== r.hb.root.visible).map(r => [r.g.hbKey, +d(r).toFixed(1), r.hb.L]);
  const t0 = performance.now(); REN.render(scene, CAM); const ms = performance.now() - t0, calls = REN.info.render.calls, tris = REN.info.render.triangles;
  // the same view with every builder's body on its driver's distant copy: what the old bodies cost here
  const keep = rs.map(r => r.hb.L); rs.forEach(r => hbLevel(r, 2)); REN.render(scene, CAM); const base = { calls: REN.info.render.calls, tris: REN.info.render.triangles }; rs.forEach((r, i) => hbLevel(r, keep[i]));
  const big = rs.map(r => { const m = []; r.hb.root.traverse(o => { if (o.isMesh) m.push([o.name || '?', Math.round((o.geometry.index ? o.geometry.index.count : o.geometry.attributes.position.count) / 3)]); }); return { k: r.g.hbKey, n: m.length, top: m.sort((a, b) => b[1] - a[1]).slice(0, 4) }; }).sort((a, b) => b.top[0][1] - a.top[0][1])[0];
  return { calls, tris, base, big, n: rs.length, levels: [0, 1, 2].map(L => rs.filter(r => r.hb.L === L).length), bad, ms: Math.round(ms) }; });
console.log('  budget: Dunmore at noon with the builder\'s townsfolk:', JSON.stringify(lv));
check('near bodies whole, middle ones without their cards, far ones the driver\'s distant copy', lv.n >= 4 && lv.bad.length === 0, lv);
check('Dunmore at noon stays under the budget\'s 1,000 draw calls at the middle quality', lv.calls > 50 && lv.calls < 1000, lv);
// the middle level is one draw call: the body baked into one mesh on the same skeleton
const mid = await page.evaluate(() => { const rig = [...HB_RIGS].find(r => r.hb && r.root.visible && r.root.parent === WORLD.scene); const p = rig.root.position;
  CAM.position.set(p.x + 25, worldH(p.x + 25, p.z) + 1.65, p.z); CAM.updateMatrixWorld(true); tickPeople(1 / 60, 4.5e5);
  const shown = []; rig.hb.root.traverse(o => { if (!o.isMesh) return; let v = true; for (let q = o; q && q !== rig.root; q = q.parent) v = v && q.visible; if (v) shown.push(o); });
  const m = rig.hb.mid, t = (m.geometry.index.count / 3) | 0; let full = 0; for (const o of rig.hb.full) full += ((o.geometry.index ? o.geometry.index.count : o.geometry.attributes.position.count) / 3) | 0;
  return { key: rig.g.hbKey, level: rig.hb.L, shown: shown.length, mid: shown[0] === m, skinned: m.isSkinnedMesh && m.skeleton === rig.hb.P.skeleton, tris: t, fullTris: full, ok: !!rig.hb.full.length }; });
check('a body in the middle range is one mesh on its own skeleton, the whole body baked', mid.level === 1 && mid.shown === 1 && mid.mid && mid.skinned && mid.tris > 10000, mid);
// far away every body is the cheap level
const far = await page.evaluate(() => { const t = WORLD.siteAnywhere('dunmore'); CAM.position.set(t.x, worldH(t.x, t.z + 70) + 1.65, t.z + 70); CAM.updateMatrixWorld(true); tickPeople(1 / 60, 5e5);
  const rs = [...HB_RIGS].filter(r => r.hb && r.root.parent === WORLD.scene && r.root.visible && Math.hypot(CAM.position.x - r.root.position.x, CAM.position.z - r.root.position.z) > HBODY.mid + 1);
  return { n: rs.length, cheap: rs.filter(r => r.hb.L === 2 && r.mesh.visible && !r.hb.root.visible).length }; });
check('from 70 m every body past the middle range is on the cheap level', far.n >= 1 && far.cheap === far.n, far);

// pictures: the square, a market, a crowd at 60 m, an inn's common room
// S1224: a frame of the square with its bodies whole takes 7 to 21 s here on software GL and about five times that on a CI runner, so
// the harness's 120 s a picture (S808) ran out on the square twice in a row (#513's run); the pictures get 300 s
const SHOT_MS = 300000;
// S1262: the pictures only when asked (F4_PICS=1). On CI they took about 12 of the suite's 15 minutes, so with the second boot after them it
// met the 900 s a suite is given on both tries (#568, run 39648922301); and each run rewrote the committed pictures. Every check stays
const PICS = process.env.F4_PICS === '1';
if (PICS) {
const shoot = async (name, fn) => { await page.evaluate(fn); for (let i = 0; i < 6; i++) { await page.evaluate(() => tickPeople(1 / 60, performance.now())); await g.frames(1); } await page.screenshot({ path: path.join(OUT, name), timeout: SHOT_MS }); };
await shoot('f4-square.jpg', () => { const t = WORLD.siteAnywhere('dunmore'); px = t.x; pz = t.z + 4; yaw = 0; pitch = -.06; });
await shoot('f4-market.jpg', () => { const r = [...HB_RIGS].filter(r => r.hb && r.root.visible && r.root.parent === WORLD.scene).sort((a, b) => Math.hypot(a.root.position.x - px, a.root.position.z - pz) - Math.hypot(b.root.position.x - px, b.root.position.z - pz))[0];
  const p = r.root.position, fy = r.root.rotation.y; px = p.x + Math.sin(fy) * 3; pz = p.z + Math.cos(fy) * 3; yaw = Math.atan2(-(p.x - px), -(p.z - pz)); pitch = -.08; });
// the middle level close up beside the whole body: the market's person from 3 m (near 0 shows the bake; then restored)
for (const [name, near] of [['f4-whole.jpg', 16], ['f4-baked.jpg', 0]]) {
  await page.evaluate((near) => { HBODY.near = near; }, near); for (let i = 0; i < 4; i++) { await page.evaluate(() => tickPeople(1 / 60, performance.now())); await g.frames(1); }
  await page.screenshot({ path: path.join(OUT, name), clip: { x: 440, y: 120, width: 400, height: 480 }, timeout: SHOT_MS }); }
await page.evaluate(() => { HBODY.near = 16; });
await shoot('f4-crowd60.jpg', () => { const t = WORLD.siteAnywhere('dunmore'); px = t.x; pz = t.z + 60; yaw = 0; pitch = -.03; });
}
const inn = await page.evaluate(() => { const S = WORLD.settle.get('dunmore'); const h = S.houses.find(x => x.type === 'inn') || S.houses[0]; px = h.exitX; pz = h.exitZ; goToInterior(h); return h.type; });
for (let k = 0; k < 40 && !(await page.evaluate(() => isInterior())); k++) await page.waitForTimeout(250);
await page.evaluate(() => { HBODY.last = -1e9; }); // the ticks above ran on made-up clocks; the room runs on the page's own
for (let k = 0; k < 12; k++) { await g.frames(1); await page.evaluate(() => tickPeople(1 / 60, performance.now())); }
const room = await page.evaluate(() => { const rs = [...HB_RIGS].filter(r => r.root.parent === scene);
  return { inside: isInterior(), people: rs.length, built: rs.filter(r => r.hb).length }; });
if (PICS) await page.screenshot({ path: path.join(OUT, 'f4-inn.jpg'), timeout: SHOT_MS });
check('in the inn\'s common room the keeper and the drinkers wear the builder\'s bodies too', room.inside && room.people >= 1 && room.built === room.people, { inn, ...room });
check('no page errors', g.errs.length === 0, g.errs.slice(0, 3));
// S1792 (L2, OG-069): the cast (last on this boot: the cloak walk above is sensitive to what ran before it, S1770). Bram, Edna and Corwin at Ashenmoor (and Corwin authored at a harbour) wear the builder's CAST genome, not a
// roll of their key, and the driver follows it (Edna's town roll had made her a young man of 1.85); an Edna of another town is her own woman
const cast = await page.evaluate(() => { const forget = () => { for (const m of [HB_GENOMES, PEOPLE_GENOMES]) for (const k of [...m.keys()]) if (/ctest|ashenmoor|Corwin/.test(k)) m.delete(k); };
  const one = (def, key) => { const root = buildNPCMesh(def, { key }), r = [...HB_RIGS].find(x => x.root === root); HB_RIGS.delete(r); PEOPLE_RIGS.delete && PEOPLE_RIGS.delete(r);
    return { cast: r.hbG.cast || null, fem: r.g.female, age: r.g.age, st: +(r.g.height * personScale(r.g) * SCALE.PERSON_MODEL).toFixed(2), sheet: r.hbG.g === 0,
      hair: r.hbG.hair.style, apron: !!r.hbG.dress.apronLeather, tartan: !!r.hbG.dress.tartan, cape: !!r.hbG.dress.cape, waistcoat: !!r.hbG.dress.waistcoat,
      dHat: r.g.hat, dGear: r.g.gear, dEx: r.g.extras.length, dApron: r.g.apron != null, dStyle: r.g.style, dCloth: r.g.cloth && r.g.cloth.isColor ? r.g.cloth.getHexString() : null }; };
  forget(); const out = { bram: one({ name: 'Bram', role: 'Blacksmith' }, 'ashenmoor'), edna: one({ name: 'Edna', role: 'Herbalist' }, 'ashenmoor'),
    corwin: one({ name: 'Corwin', role: '', authored: true, people: 'gatelander' }, 'ctest_port'), other: one({ name: 'Edna', role: 'Herbalist' }, 'ctest_town'),
    corwinHome: one({ name: 'Corwin', role: 'Traveling Merchant' }, 'ashenmoor') }; forget(); return out; });
check('the cast: Bram and Edna at Ashenmoor wear the sheet (the leather apron; the green cape and the bun), the driver at the sheet\'s sex, age and stature',
  cast.bram.cast === 'Bram' && cast.bram.apron && !cast.bram.tartan && cast.bram.st === 1.82 && !cast.bram.fem &&
  cast.edna.cast === 'Edna' && cast.edna.fem && cast.edna.age === 'elder' && cast.edna.cape && cast.edna.hair === 'bun' && cast.edna.st === 1.6, cast);
check('Corwin authored at a harbour is the same man in his madder and gold; an Edna of another town keeps her own roll', cast.corwin.cast === 'Corwin' && cast.corwin.waistcoat && cast.other.cast === null, cast);
// S1798 (section I): Edna and Áine carry their sticks again, and the short cape opens on the staff's side instead of being draped over its
// forearm (S1792: it came out level with the arm as a slab 38 cm in front of the neck; without the staff 23 cm)
// S1832 (section I, critic 4 Nov): the far copy wears the sheet too, not the role's hat and gear: no hat on any, Edna's stick, Bram's apron, no bag
check('the cast\'s driver (the far copy) wears the sheet: no hat, Edna\'s stick, Bram\'s apron and hammer (S1835), Corwin no merchant\'s brim or bag; another town\'s Edna keeps her kerchief',
  cast.bram.dHat === 'none' && cast.bram.dApron && cast.bram.dGear === 'hammer' && cast.edna.dHat === 'none' && cast.edna.dGear === 'stick' && cast.edna.dEx === 0 && cast.edna.dStyle === 'bun' &&
  cast.corwinHome.cast === 'Corwin' && cast.corwinHome.dHat === 'none' && cast.corwinHome.dEx === 0 && cast.corwinHome.dGear === null && cast.corwin.dHat === 'none' &&
  cast.other.dHat === 'kerchief', cast);
const capes = await page.evaluate(() => { const out = {}; for (const nm of ['Edna', 'Áine']) { const G = HB.castGenome(nm, {}), P = HB.makePerson(G, { hoodStats: false });
    P.root.updateMatrixWorld(true); const cl = P.root.getObjectByName('cloak'), pa = cl.geometry.attributes.position, v = new THREE.Vector3(), n = new THREE.Vector3(); P.byName['neck01'].getWorldPosition(n);
    let fwd = -1; for (let i = 0; i < pa.count; i++) fwd = Math.max(fwd, v.fromBufferAttribute(pa, i).applyMatrix4(cl.matrixWorld).z - n.z);
    out[nm] = { staff: !!P.root.getObjectByName('staff'), fwd: +fwd.toFixed(3), out: P.cloak.through.out, under: P.cloak.under }; } return out; });
check('Edna and Áine carry their sticks, and the cape stays on the shoulder: under 30 cm in front of the neck, nothing through it', Object.values(capes).every(c => c.staff && c.fwd < .3 && c.out === 0 && c.under === 0), capes);
// S1809 (L2, OG-069): Niamh's lantern, in her right fist on the basket's grip, hanging clear of her and her cloak, on her wrist so it goes where the arm goes
const lantern = await page.evaluate(() => { const P = HB.makePerson(HB.castGenome('Niamh', {}), { hoodStats: false }), ln = P.root.getObjectByName('lantern');
  return { on: !!ln, wrist: ln && ln.parent && ln.parent.name, st: P.lantern, cloak: P.cloak.through.out, under: P.cloak.under }; });
check('Niamh carries her lantern in her right fist: on the wrist, nothing of her within a centimetre of it, the fingers closed and none through its grip, her cloak clear',
  lantern.on && lantern.wrist === 'wrist.R' && lantern.st.inside === 0 && lantern.st.fist === 0 && lantern.st.gap > -.002 && lantern.st.foot > .3 && lantern.cloak === 0 && lantern.under === 0, lantern);
// S1816 (L2, OG-069): Edna's clay pipe, in the left corner of her mouth, carried by the head, nothing of her within 2 mm of it past her lips
const pipe = await page.evaluate(() => { const P = HB.makePerson(HB.castGenome('Edna', {}), { hoodStats: false }), pi = P.root.getObjectByName('pipe');
  return { on: !!pi, bone: pi && pi.parent && pi.parent.name, st: P.pipe }; });
check('Edna smokes her clay pipe: on the head, its mouthpiece inside her lips, nothing worn within 2 mm of the stem past them or of the bowl',
  pipe.on && pipe.bone === 'head' && pipe.st.inside === 0 && pipe.st.tipIn && pipe.st.side === 'L', pipe);
// S1829 (L2, OG-069): Corwin's tankard, by its handle in his right fist, upright, nothing of him near it and no finger through its pewter
const tankard = await page.evaluate(() => { const P = HB.makePerson(HB.castGenome('Corwin', {}), { hoodStats: false }), tk = P.root.getObjectByName('tankard');
  return { on: !!tk, wrist: tk && tk.parent && tk.parent.name, st: P.tankard }; });
check('Corwin holds his tankard: on the wrist, upright, nothing of him within 8 mm of it, no point of the hand in its pewter',
  tankard.on && tankard.wrist === 'wrist.R' && tankard.st.inside === 0 && tankard.st.handIn === 0 && tankard.st.sideIn === 0 && tankard.st.thumbIn === 0 && tankard.st.lean < .1, tankard);
// S1846 (L2, OG-069): Corwin's red coat worn open to the knee over the waistcoat: both shells holed down the front, and the middle-level
// bake (hbCutFn) reads the hole; the waistcoat, its buttons and the belt kept under it; gold at its edges; nothing of the legs out of its
// skirt; the far copy (the driver) in the coat's red, not the shirt's linen
const ocoat = await page.evaluate(() => { const P = HB.makePerson(HB.castGenome('Corwin', {}), { hoodStats: false }), m = k => P.root.getObjectByName(k), c = m('coat'), cs = m('coatSkirt'), f = c && hbCutFn(c.material.userData), fs = cs && hbCutFn(cs.material.userData);
  return { coat: !!c, skirt: !!cs, wc: !!m('waistcoat'), belt: !!m('belt'), btn: P.buttons && P.buttons.buttons, legsOut: P.coat && P.coat.legsOut, trim: !!(c && c.material.customProgramCacheKey().includes('trim')),
    bake: !!(f && fs && f({ x: 0, y: .3, z: .1 }) && !f({ x: .15, y: .3, z: .1 }) && !f({ x: 0, y: .3, z: -.1 }) && fs({ x: 0, y: -.2, z: .1 }) && !fs({ x: .15, y: -.2, z: .1 })), red: new THREE.Color(.5, .12, .1).getHexString() }; });
check('Corwin wears his coat open: the fronts holed collar to hem (and the bake drops them), the waistcoat, its six buttons and the belt under it, gold at the edges, no leg out of its skirt; his far copy in its red',
  ocoat.coat && ocoat.skirt && ocoat.bake && ocoat.wc && ocoat.belt && ocoat.btn === 6 && ocoat.legsOut === 0 && ocoat.trim && cast.corwinHome.dCloth === ocoat.red && cast.corwin.dCloth === ocoat.red, { ocoat, far: cast.corwinHome.dCloth });
// S1835 (L2, OG-069, OG-057): Bram's smith's hammer, by the throat of its haft in his right fist, head up, nothing of him near it, no finger in it
const hammer = await page.evaluate(() => { const P = HB.makePerson(HB.castGenome('Bram', {}), { hoodStats: false }), hm = P.root.getObjectByName('hammer');
  return { on: !!hm, wrist: hm && hm.parent && hm.parent.name, st: P.hammer }; });
check('Bram holds his hammer: on the wrist, upright, nothing of him within 8 mm of it, no point of the hand in its haft or head',
  hammer.on && hammer.wrist === 'wrist.R' && hammer.st.inside === 0 && hammer.st.handIn === 0 && hammer.st.headIn === 0 && hammer.st.thumbIn === 0 && hammer.st.lean < .1, hammer);
// S1841 (L2, OG-069): Bram's sleeves rolled above the elbow: the roll on both arms, the tunic's sleeve cut under it, the forearm's skin drawn;
// Corwin's sleeves down
const rolled = await page.evaluate(() => { const one = n => { const P = HB.makePerson(HB.castGenome(n, {}), { hoodStats: false }), R0 = HB.PACK.rest, m = k => P.root.getObjectByName(k);
    const roll = m('roll'), tunic = m('tunic'), body = P.meshes ? P.meshes[0] : P.root.children.find(c => c.isSkinnedMesh);
    const ua = i => ((Math.abs(R0[i * 3]) - .1677) * .638 - (R0[i * 3 + 1] - .5246) * .7702 - (R0[i * 3 + 2] - .0146) * .0062) / .2276;
    const bodyIdx = new Set(body.geometry.index.array), fore = [...bodyIdx].filter(i => Math.abs(R0[i * 3]) > .26 && R0[i * 3 + 1] > .1 && R0[i * 3 + 1] < .55 && ua(i) > 1.05 && HB.slvX(R0[i * 3], R0[i * 3 + 1], R0[i * 3 + 2]) < .365).length;
    return { roll: !!roll, rollTris: roll ? roll.geometry.index.count / 3 : 0, hole: !!(tunic && tunic.material.userData.hole), fore, gene: !!HB.castGenome(n, {}).dress.sleevesRolled }; };
  return { bram: one('Bram'), corwin: one('Corwin') }; });
check('Bram\'s sleeves are rolled above the elbow (S1841): the roll drawn, the tunic\'s sleeve holed under it, his forearms\' skin drawn; Corwin\'s sleeves down',
  rolled.bram.gene && rolled.bram.roll && rolled.bram.rollTris > 200 && rolled.bram.hole && rolled.bram.fore > 100 &&
  !rolled.corwin.gene && !rolled.corwin.roll && !rolled.corwin.hole && rolled.corwin.fore < 20, rolled);
await g.close();

// a second boot: the same people, the same bodies
const g2 = await boot({ look: 'new' }); await dunmore(g2);
const g2genomes = await g2.page.evaluate((keys) => Object.fromEntries(keys.map(k => [k, HB_GENOMES.has(k) ? JSON.stringify(HB.toSaved(HB_GENOMES.get(k))) : null])), who.sample);
const same = who.sample.filter(k => g2genomes[k] === genomes[k]).length;
check('on a second boot each of them is the same person (the same genome from the same place and name)', same === who.sample.length && same >= 4, { same, of: who.sample.length });
// S1224 (card F4): the near level's cost where the crowd is thickest. At 18h, the most of Dunmore's people within 16 m of one of them
// (seven, Session 1224); 6 m off their middle, every body within 46 m built, the frame at the middle quality looking four ways
const crowd = await g2.page.evaluate(() => { forceTime(18); for (let i = 0; i < 120; i++) WORLD.tick(1 / 60, performance.now());
  let rs = [...HB_RIGS].filter(r => r.root.parent === WORLD.scene && r.root.visible), P = rs.map(r => [r.root.position.x, r.root.position.z]);
  let best = 0, at = null; for (const [x, z] of P) { const n = P.filter(([a, b]) => Math.hypot(a - x, b - z) < 16).length; if (n > best) { best = n; at = [x, z]; } }
  const near = P.filter(([a, b]) => Math.hypot(a - at[0], b - at[1]) < 16), cx = near.reduce((s, p) => s + p[0], 0) / near.length, cz = near.reduce((s, p) => s + p[1], 0) / near.length;
  px = cx; pz = cz + 6; for (let i = 0; i < 30; i++) WORLD.tick(1 / 60, performance.now());
  { const t1 = performance.now(); while (JOBS.length && performance.now() - t1 < 30000) runJobs(); }
  pitch = -.05; CAM.position.set(px, worldH(px, pz) + 1.65, pz); CAM.rotation.set(pitch, 0, 0, 'YXZ'); CAM.updateMatrixWorld(true);
  const want = () => [...HB_RIGS].filter(r => (!r.hb || r.hb.cold) && !r.hbFail && r.root.parent === WORLD.scene && r.root.visible && Math.hypot(CAM.position.x - r.root.position.x, CAM.position.z - r.root.position.z) < HBODY.build).length;
  let k = 0; while (want() && k++ < 1500) tickPeople(1 / 60, 1e5 + k * (HBODY.gap + 1));
  SETTINGS.quality = 1; rs = [...HB_RIGS].filter(r => r.hb && r.root.parent === WORLD.scene && r.root.visible);
  const views = [0, Math.PI / 2, Math.PI, -Math.PI / 2].map(yw => { yaw = yw; CAM.rotation.set(pitch, yaw, 0, 'YXZ'); CAM.updateMatrixWorld(true); tickPeople(1 / 60, 4e5); REN.render(scene, CAM); return REN.info.render.calls; });
  return { most16: best, built: rs.length, left: want(), near: rs.filter(r => r.hb.L === 0).length, views, worst: Math.max(...views) }; });
console.log('  crowd:', JSON.stringify(crowd));
check(`where Dunmore's crowd is thickest (${crowd.most16} people within 16 m, ${crowd.near} bodies whole), the frame stays under 1,000 draw calls every way you look (${crowd.worst})`, crowd.left === 0 && crowd.most16 >= 4 && crowd.near >= 4 && crowd.worst < 1000, crowd);
await g2.close();
