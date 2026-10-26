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
    bones: [...new Set(built.map(r => r.hb.P.skeleton.bones.length))], driver: built.every(r => r.mesh.skeleton.bones.length >= 17 && r.mesh.skeleton.bones.length <= 20),
    tris: built.map(r => { let t = 0; r.hb.root.traverse(o => { if (o.isMesh) t += (o.geometry.index ? o.geometry.index.count : o.geometry.attributes.position.count) / 3; }); return Math.round(t); }),
    statures: built.map(r => +(r.hb.st * r.hb.root.scale.x * r.root.scale.x).toFixed(2)), oldStatures: built.map(r => +(r.root.scale.y * SCALE.PERSON_MODEL / PW.BODY).toFixed(2)),
    peoples: [...new Set(built.map(r => r.hbG.people))], sample: built.slice(0, 6).map(r => r.g.hbKey) }; });
check('every townsperson in Dunmore wears the builder\'s body, keyed by place and name, on its 163-bone skeleton over the 17-bone driver',
  who.people >= 8 && who.hb === who.people && who.built >= 4 && who.keys && who.bones.length === 1 && who.bones[0] === 163 && who.driver, who);
check('at the stature the game gives them (within 2 cm of the driver\'s)', who.statures.every((s, i) => Math.abs(s - who.oldStatures[i]) < .02), { s: who.statures, old: who.oldStatures });

// the same person on every load: the genome comes from the key alone
const genomes = await page.evaluate((keys) => Object.fromEntries(keys.map(k => [k, JSON.stringify(HB.toSaved(HB_GENOMES.get(k)))])), who.sample);
const again = await page.evaluate((keys) => keys.every(k => { const r = [...HB_RIGS].find(x => x.g.hbKey === k).g, o = { people: HB_GENOMES.get(k).people, g: r.female ? 0 : 1, child: !!r.child, old: r.age === 'elder' };
  return JSON.stringify(HB.toSaved(HB.rollGenome(k, o))) === JSON.stringify(HB.toSaved(HB.rollGenome(k, o))); }), who.sample);
check('a genome is the same rolled twice from its key', again);

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
    if (!rig._arm) { rig._arm = []; for (let i = 0; i < si.count; i += 2) { let b = 0, w = 0; for (let q = 0; q < 4; q++) if (sw.getComponent(i, q) > w) { w = sw.getComponent(i, q); b = si.getComponent(i, q); } if (/upperarm|lowerarm|wrist|finger|metacarpal/.test(bones[b].name)) rig._arm.push(i); } }
    let tested = 0, out = 0, worst = 0;
    for (const i of rig._arm) { const p = at(body, i); if (p.y > yTop || p.y < yHem + .01) continue; const th = Math.atan2(p.x - ax, -(p.z - az)), r = Math.hypot(p.x - ax, p.z - az);
      if (th < col(1, p.y).th || th > col(K - 2, p.y).th) continue; let k = 1, A = col(1, p.y), B = col(2, p.y); while (k < K - 3 && B.th < th) { k++; A = B; B = col(k + 1, p.y); }
      const t = Math.max(0, Math.min(1, (th - A.th) / Math.max(1e-6, B.th - A.th))), cr = A.r + (B.r - A.r) * t; tested++; worst = Math.max(worst, r - cr); if (r > cr + .003) out++; }
    return { tested, out, worst }; };
  const rigs = [...HB_RIGS].filter(r => r.hb && r.hb.L < 2 && r.root.parent === WORLD.scene && !r.sleep && r.hb.full.find(m => m.name === 'cloak')).slice(0, 4);
  return rigs.map(rig => { const root = rig.root, fy = root.rotation.y, hold = rig.hb.hold, o = { key: rig.g.hbKey, held: hold ? hold.size : 0, rest: test(rig), tested: 0, out: 0, worst: 0, swing: 0 };
    const wr = rig.hb.P.byName['wrist.R'], free = hold && !hold.has(rig.hb.map.findIndex(([j]) => j === 'wrR')), seen = [];
    for (let i = 1; i <= 60; i++) { root.position.x += Math.sin(fy) * .012; root.position.z += Math.cos(fy) * .012; tickPeople(1 / 60, 6e5 + i * 16.7);
      if (i > 15 && i % 3 === 0) { const c = test(rig); o.tested += c.tested; o.out += c.out; o.worst = Math.max(o.worst, c.worst); if (free) seen.push(wr.getWorldPosition(new THREE.Vector3()).applyMatrix4(root.matrixWorld.clone().invert())); } }
    if (free) o.swing = +Math.max(...seen.map(a => Math.max(...seen.map(b => Math.abs(a.z - b.z))))).toFixed(3); o.free = !!free; o.worst = +o.worst.toFixed(3); o.walk = +rig.w.walk.toFixed(2); return o; }); });
console.log('  cloaks:', JSON.stringify(cloaks));
check(`walking, no arm comes out through a cloak (${cloaks.map(c => c.out + ' of ' + c.tested).join(', ')} hand and forearm points under it out by 3 mm or more, at most ${Math.max(...cloaks.map(c => c.worst)) * 1000} mm, ${cloaks.length} cloaked walkers)`,
  cloaks.length >= 2 && cloaks.every(c => c.held > 0 && c.walk > .9 && c.rest.out === 0 && c.tested > 1000 && c.out === 0 && c.worst < .006), cloaks);
const freeArm = cloaks.filter(c => c.free);
if (freeArm.length) check(`the right arm a thrown-back cloak leaves out still swings (the wrist ${freeArm.map(c => c.swing).join(', ')} m fore and aft)`, freeArm.every(c => c.swing > .05), freeArm);

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
