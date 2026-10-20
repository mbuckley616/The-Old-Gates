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
    const want = () => [...HB_RIGS].filter(r => !r.hb && !r.hbFail && r.root.parent === WORLD.scene && r.root.visible && Math.hypot(CAM.position.x - r.root.position.x, CAM.position.z - r.root.position.z) < HBODY.build).length;
    { const t1 = performance.now(); while (JOBS.length && performance.now() - t1 < 20000) runJobs(); } // the loading comes first (hbTick waits for it)
    let k = 0; const t0 = performance.now(); while (want() && k++ < 200) tickPeople(1 / 60, 1e5 + k * (HBODY.gap + 1));
    return { ticks: k, left: want(), ms: Math.round(performance.now() - t0), built: HBODY.n, msEach: Math.round(HBODY.ms / Math.max(1, HBODY.n)) }; });
}

const g = await boot({ look: 'new' }); const { page } = g;
const b1 = await dunmore(g);
console.log('  built:', JSON.stringify(b1));

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
const shoot = async (name, fn) => { await page.evaluate(fn); for (let i = 0; i < 6; i++) { await page.evaluate(() => tickPeople(1 / 60, performance.now())); await g.frames(1); } await page.screenshot({ path: path.join(OUT, name) }); };
await shoot('f4-square.jpg', () => { const t = WORLD.siteAnywhere('dunmore'); px = t.x; pz = t.z + 4; yaw = 0; pitch = -.06; });
await shoot('f4-market.jpg', () => { const r = [...HB_RIGS].filter(r => r.hb && r.root.visible && r.root.parent === WORLD.scene).sort((a, b) => Math.hypot(a.root.position.x - px, a.root.position.z - pz) - Math.hypot(b.root.position.x - px, b.root.position.z - pz))[0];
  const p = r.root.position, fy = r.root.rotation.y; px = p.x + Math.sin(fy) * 3; pz = p.z + Math.cos(fy) * 3; yaw = Math.atan2(-(p.x - px), -(p.z - pz)); pitch = -.08; });
// the middle level close up beside the whole body: the market's person from 3 m (near 0 shows the bake; then restored)
for (const [name, near] of [['f4-whole.jpg', 16], ['f4-baked.jpg', 0]]) {
  await page.evaluate((near) => { HBODY.near = near; }, near); for (let i = 0; i < 4; i++) { await page.evaluate(() => tickPeople(1 / 60, performance.now())); await g.frames(1); }
  await page.screenshot({ path: path.join(OUT, name), clip: { x: 440, y: 120, width: 400, height: 480 } }); }
await page.evaluate(() => { HBODY.near = 16; });
await shoot('f4-crowd60.jpg', () => { const t = WORLD.siteAnywhere('dunmore'); px = t.x; pz = t.z + 60; yaw = 0; pitch = -.03; });
const inn = await page.evaluate(() => { const S = WORLD.settle.get('dunmore'); const h = S.houses.find(x => x.type === 'inn') || S.houses[0]; px = h.exitX; pz = h.exitZ; goToInterior(h); return h.type; });
for (let k = 0; k < 40 && !(await page.evaluate(() => isInterior())); k++) await page.waitForTimeout(250);
await page.evaluate(() => { HBODY.last = -1e9; }); // the ticks above ran on made-up clocks; the room runs on the page's own
for (let k = 0; k < 12; k++) { await g.frames(1); await page.evaluate(() => tickPeople(1 / 60, performance.now())); }
const room = await page.evaluate(() => { const rs = [...HB_RIGS].filter(r => r.root.parent === scene);
  return { inside: isInterior(), people: rs.length, built: rs.filter(r => r.hb).length }; });
await page.screenshot({ path: path.join(OUT, 'f4-inn.jpg') });
check('in the inn\'s common room the keeper and the drinkers wear the builder\'s bodies too', room.inside && room.people >= 1 && room.built === room.people, { inn, ...room });
check('no page errors', g.errs.length === 0, g.errs.slice(0, 3));
await g.close();

// a second boot: the same people, the same bodies
const g2 = await boot({ look: 'new' }); await dunmore(g2);
const g2genomes = await g2.page.evaluate((keys) => Object.fromEntries(keys.map(k => [k, HB_GENOMES.has(k) ? JSON.stringify(HB.toSaved(HB_GENOMES.get(k))) : null])), who.sample);
const same = who.sample.filter(k => g2genomes[k] === genomes[k]).length;
check('on a second boot each of them is the same person (the same genome from the same place and name)', same === who.sample.length && same >= 4, { same, of: who.sample.length });
await g2.close();
