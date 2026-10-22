// Card F4 (Session 1202): on the new look the Wolf, the Snow Wolf and the Dire Wolf wear the creature kit's body (creatures.js, as
// vendor/creatures.builder.js), driven by their old 24-bone rig as the townsfolk's builder bodies are by theirs. A line of the three
// and an Ash Hound (its own plan since Session 1274) ahead of you in the open world: each wolf on the kit's skeleton, its genome rolled from its
// foe id (`wolf:<id>`); its hips at its driver's height; three levels by distance (the hide and fur near, the hide and its ears, the driver
// far); a run that moves the kit's bones with its paws by the driver's; the tell's glow on the kit's hide; and killed, a corpse
// darkened with its shaders kept that falls with its driver. Pictures: docs/prototypes/f4/f4-wolves.jpg and f4-wolves-near.jpg.
import { boot, check, ROOT } from './lib/game.mjs';
import fs from 'fs'; import path from 'path';
const OUT = path.join(ROOT, 'docs', 'prototypes', 'f4'); fs.mkdirSync(OUT, { recursive: true });

const KINDS = ['Wolf', 'Snow Wolf', 'Dire Wolf', 'Ash Hound'];
const g = await boot({ look: 'new' }); const { page } = g;
await g.intoWorld();

const made = await page.evaluate((KINDS) => { forceTime(12);
  { const t1 = performance.now(); while (JOBS.length && performance.now() - t1 < 20000) runJobs(); }
  const fx = -Math.sin(yaw), fz = -Math.cos(yaw), sx = -fz, sz = fx;
  const clear = (x, z) => { for (let dx = -2.5; dx <= 2.5; dx += .5) for (let dz = -2.5; dz <= 2.5; dz += .5) if (WORLD.solidAt(x + dx, z + dz)) return false; return true; };
  let d = 8; for (; d < 60; d += 3) { let ok = true; for (let i = 0; i < KINDS.length; i++) if (!clear(px + fx * d + sx * (i - 1.5) * 2.6, pz + fz * d + sz * (i - 1.5) * 2.6)) { ok = false; break; } if (ok) break; }
  window._W = KINDS.map((n, i) => { const x = px + fx * d + sx * (i - 1.5) * 2.6, z = pz + fz * d + sz * (i - 1.5) * 2.6;
    const e = keyFoe(buildZoneEnemy(WORLD.scene, [], x, z, n, null), 'f4wolf:' + i); e.mesh.position.set(x, WORLD.worldH(x, z), z); e.mesh.rotation.y = Math.atan2(px - x, pz - z) + Math.PI / 2;
    e.combatYaw = e.mesh.rotation.y; e.locked = false; e.mesh.visible = true; if (!e.mesh.parent) WORLD.scene.add(e.mesh); const rig = e.limbs && e.limbs.wolf; if (rig) rig.e = e; return { n, e, rig }; });
  CAM.position.set(px, worldH(px, pz) + 1.65, pz); CAM.updateMatrixWorld(true);
  const want = () => _W.filter(f => f.rig && hcOk(f.rig) && !f.rig.hc && !f.rig.hcFail).length;
  let k = 0; const t0 = performance.now(); HBODY.last = -1e9; while (want() && k++ < 100) tickCreatures(1 / 60, 2e5 + k * (HBODY.gap + 1));
  return { d, ticks: k, left: want(), ms: Math.round(performance.now() - t0), each: Math.round(HC_BODY.ms / Math.max(1, HC_BODY.n)) }; }, KINDS);
console.log('  built:', JSON.stringify(made));

const who = await page.evaluate(() => _W.map(({ n, e, rig }) => { const H = rig.hc;
  return { n, id: e.id, hc: !!H, fail: !!rig.hcFail, plan: H ? H.C.g.plan : null, seed: H ? H.C.g.seed : null, want: H ? HC.hashKey('wolf:' + e.id) : null, bones: H ? H.C.bones.length : 0,
    meshes: H ? H.C.meshes.length : 0, fur: H ? H.fur.length : 0, tris: H ? H.C.stats.tris : 0, coat: H ? H.C.plan.palette.coat.map(v => +v.toFixed(2)) : null }; }));
console.log('  wolves:', JSON.stringify(who));
const wolves = who.filter(w => w.n !== 'Ash Hound');
check(`the three wolves wear the kit's body on its own skeleton (${wolves.map(w => w.bones).join(', ')} bones), keyed by their foe id, built in ${made.each} ms each`, wolves.every(w => w.hc && w.bones > 20 && w.seed === w.want) && made.left === 0, wolves);
check('the Wolf and the Snow Wolf are the kit\'s grey wolf, the Dire Wolf its Ironwolf; the Snow Wolf pale and the Dire Wolf dark in their own coats',
  who[0].plan === 'wolf' && who[1].plan === 'game:Snow Wolf' && who[2].plan === 'game:Dire Wolf' && who[1].coat[0] > .8 && who[2].coat[0] < .3, who.map(w => [w.n, w.plan, w.coat]));
check('the Ash Hound wears the kit\'s own Ash Hound, keyed by its foe id (Session 1274)', who[3].hc && who[3].plan === 'ashhound' && who[3].seed === who[3].want, who[3]);

// the same wolf is the same body: the genome comes from the id alone
const same = await page.evaluate(() => _W.filter(f => f.rig.hc).every(f => JSON.stringify(HC.toSaved(HC.genome(hcPlan(f.n), 'wolf:' + f.e.id))) === JSON.stringify(HC.toSaved(f.rig.hc.C.g))));
check('a wolf\'s genome is the same rolled again from its id', same);

// its size: the kit's hips at the driver's, its back over them
const size = await page.evaluate(() => _W.filter(f => f.rig.hc).map(f => { const rig = f.rig; rig.root.parent.updateMatrixWorld(true);
  const a = rig.hc.C.byName.spine0.getWorldPosition(new THREE.Vector3()), b = rig.B.hips.getWorldPosition(new THREE.Vector3()), gy = WORLD.worldH(b.x, b.z);
  return [f.n, +(a.y - gy).toFixed(2), +(b.y - gy).toFixed(2), +a.distanceTo(b).toFixed(3)]; }));
check('each kit body stands at its driver\'s size: its hips within 3 cm of the driver\'s', size.every(([, , , d]) => d < .03), size);

// the levels: near, the hide and its fur; at 25 m, the hide alone; at 60 m, the driver
const lv = await page.evaluate(() => { const out = {}, f = _W[0], g0 = f.e.mesh, fx = -Math.sin(yaw), fz = -Math.cos(yaw);
  const at = (dd, k) => { CAM.position.set(g0.position.x - fx * dd, g0.position.y + 1.65, g0.position.z - fz * dd); CAM.updateMatrixWorld(true); for (let i = 0; i < 3; i++) tickCreatures(1 / 60, 3e5 + k * 100 + i * 17);
    const H = f.rig.hc; let n = 0; if (H.W.visible) H.W.traverse(o => { if (o.isMesh && o.visible) n++; }); return { L: H.L, kit: n, driver: f.rig.mesh.visible }; };
  out.near = at(6, 1); out.mid = at(25, 2); out.far = at(60, 3); out.back = at(6, 4); return out; });
check(`three levels: near the hide and fur (${lv.near.kit} meshes), at 25 m the hide and its ears (${lv.mid.kit}), at 60 m the driver's own body`,
  lv.near.L === 0 && lv.near.kit >= 10 && !lv.near.driver && lv.mid.L === 1 && lv.mid.kit <= 3 && !lv.mid.driver && lv.far.L === 2 && lv.far.driver && lv.back.L === 0, lv);

// a run: the wolf moved along the ground, its kit bones turn, and its paws stay by the driver's
const trot = await page.evaluate(() => { const f = _W[0], e = f.e, rig = f.rig, by = rig.hc.C.byName, mats = () => Array.from(rig.hc.C.skel.boneMatrices);
  const dx = Math.sin(e.mesh.rotation.y), dz = Math.cos(e.mesh.rotation.y), a = mats(); let worst = 0, gait = '';
  for (let i = 0; i < 40; i++) { e.x += dx * .05; e.z += dz * .05; e.mesh.position.set(e.x, WORLD.worldH(e.x, e.z), e.z); tickCreatures(1 / 60, 4e5 + i * 16.7); rig.hc.C.skel.update();
    if (i > 20) { rig.root.parent.updateMatrixWorld(true); for (const [d, k] of [['pfL', 'leg0L_3'], ['phR', 'leg1R_3']]) worst = Math.max(worst, rig.B[d].getWorldPosition(new THREE.Vector3()).distanceTo(by[k].getWorldPosition(new THREE.Vector3()))); } }
  const b = mats(); let moved = 0; for (let i = 0; i < a.length; i++) moved = Math.max(moved, Math.abs(a[i] - b[i]));
  return { moved: +moved.toFixed(3), worst: +worst.toFixed(3), hip: +wolfHipY(rig.k).toFixed(2), scale: +rig.root.scale.x.toFixed(2), w: Object.fromEntries(Object.entries(rig.w).map(([k, v]) => [k, +v.toFixed(2)])) }; });
check(`a run turns the kit's bones (by ${trot.moved}) and its paws keep within ${trot.worst} m of the driver's`, trot.moved > .02 && trot.worst < .25, trot);

// the tell's glow reaches the kit's hide, and goes out with it
const glow = await page.evaluate(() => { const f = _W[0], rig = f.rig, mats = () => [...rig.hc.hide, ...rig.hc.fur].map(o => o.material);
  const lit = () => mats().filter(m => m.emissive && m.emissive.getHex() !== 0).length;
  telegraphPulse(f.e, 1); tickCreatures(1 / 60, 6e5); const on = lit(), all = mats().length; telegraphReset(f.e); tickCreatures(1 / 60, 6e5 + 17); return { on, all, off: lit() }; });
check('the tell\'s glow lights the kit\'s hide and fur and goes out with it', glow.on > 0 && glow.on === glow.all && glow.off === 0, glow);

// the pictures: the line from 7 m, then the wolf from 3 m
await page.evaluate(() => { const a = _W[0].e, b = _W[3].e, mx = (a.x + b.x) / 2, mz = (a.z + b.z) / 2, fx = -Math.sin(yaw), fz = -Math.cos(yaw); px = mx - fx * 7; pz = mz - fz * 7; pitch = -.12; });
for (let i = 0; i < 8; i++) { await page.evaluate(() => tickCreatures(1 / 60, performance.now())); await g.frames(1); }
await page.screenshot({ path: path.join(OUT, 'f4-wolves.jpg') });
await page.evaluate(() => { const f = _W[1].e; const fx = -Math.sin(yaw), fz = -Math.cos(yaw); px = f.x - fx * 3; pz = f.z - fz * 3; pitch = -.2; });
for (let i = 0; i < 6; i++) { await page.evaluate(() => tickCreatures(1 / 60, performance.now())); await g.frames(1); }
await page.screenshot({ path: path.join(OUT, 'f4-wolves-near.jpg') });

const dead = await page.evaluate(() => { const f = _W[2], rig = f.rig, before = []; rig.hc.W.traverse(o => { if (o.isMesh) before.push([o, o.material]); });
  f.e.hp = 0; killZoneEnemy(f.e, WORLD.scene, '');
  for (let i = 0; i < 120; i++) { tickPeople(1 / 60, 7e5 + i * 16.7); tickCreatures(1 / 60, 7e5 + i * 16.7); }
  rig.root.parent.updateMatrixWorld(true); const a = rig.hc.C.byName.spine0.getWorldPosition(new THREE.Vector3()), b = rig.B.hips.getWorldPosition(new THREE.Vector3());
  const shaded = before.filter(([o, m]) => m.onBeforeCompile !== THREE.Material.prototype.onBeforeCompile);
  return { cloned: before.filter(([o, m]) => o.material !== m).length, n: before.length, shaded: shaded.length, kept: shaded.filter(([o, m]) => o.material.onBeforeCompile === m.onBeforeCompile).length,
    darker: before.filter(([o, m]) => o.material !== m && o.material.color && o.material.color.r <= m.color.r * .36 + 1e-6).length, hips: +(a.y - WORLD.worldH(a.x, a.z)).toFixed(2), gap: +a.distanceTo(b).toFixed(3), dead: !!f.e.dead }; });
check('killed, the kit\'s body is darkened with its shaders kept, and lies with its driver', dead.dead && dead.cloned === dead.n && dead.shaded > 0 && dead.kept === dead.shaded && dead.darker === dead.n && dead.gap < .05, dead);
await page.evaluate(() => { REN.render(scene, CAM); });
check('no page errors', g.errs.length === 0, g.errs.slice(0, 3));
await g.close();
