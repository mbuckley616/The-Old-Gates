// Card F4's next family (Session 1251): on the new look the Boar and the Cave Bear wear the creature kit's body as the wolves do
// (Session 1202, f4wolves), driven by their old 24-bone rig. The boar is the kit's wild boar; the Cave Bear its Frostreach bear in the
// Cave Bear's own brown, whose plantigrade legs have three bones to the driver's four (hcMap: the paw takes the driver's paw). A line of
// the two and an Ash Hound (which keeps its own) ahead of you: each on the kit's skeleton, keyed by its foe id; its hips at its driver's;
// three levels by distance; a run that moves the kit's bones with its feet by the driver's; the tell's glow; and killed, a corpse
// darkened with its shaders kept that lies with its driver. Session 1272 adds the coach's two horses on the kit's horse. Pictures: docs/prototypes/f4/f4-beasts.jpg and f4-beasts-near.jpg.
import { boot, check, ROOT } from './lib/game.mjs';
import fs from 'fs'; import path from 'path';
const OUT = path.join(ROOT, 'docs', 'prototypes', 'f4'); fs.mkdirSync(OUT, { recursive: true });

const KINDS = ['Boar', 'Cave Bear', 'Ash Hound'];
const g = await boot({ look: 'new' }); const { page } = g;
await g.intoWorld();

const made = await page.evaluate((KINDS) => { forceTime(12);
  { const t1 = performance.now(); while (JOBS.length && performance.now() - t1 < 20000) runJobs(); }
  const fx = -Math.sin(yaw), fz = -Math.cos(yaw), sx = -fz, sz = fx;
  const clear = (x, z) => { for (let dx = -2.5; dx <= 2.5; dx += .5) for (let dz = -2.5; dz <= 2.5; dz += .5) if (WORLD.solidAt(x + dx, z + dz)) return false; return true; };
  let d = 8; for (; d < 60; d += 3) { let ok = true; for (let i = 0; i < KINDS.length; i++) if (!clear(px + fx * d + sx * (i - 1) * 3.4, pz + fz * d + sz * (i - 1) * 3.4)) { ok = false; break; } if (ok) break; }
  window._W = KINDS.map((n, i) => { const x = px + fx * d + sx * (i - 1) * 3.4, z = pz + fz * d + sz * (i - 1) * 3.4;
    const e = keyFoe(buildZoneEnemy(WORLD.scene, [], x, z, n, null), 'f4beast:' + i); e.mesh.position.set(x, WORLD.worldH(x, z), z); e.mesh.rotation.y = Math.atan2(px - x, pz - z) + Math.PI / 2;
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
const beasts = who.filter(w => w.n !== 'Ash Hound');
check(`the boar and the bear wear the kit's body on its own skeleton (${beasts.map(w => w.bones).join(', ')} bones), keyed by their foe id, built in ${made.each} ms each`, beasts.every(w => w.hc && w.bones > 18 && w.seed === w.want) && made.left === 0, beasts);
check('the Boar is the kit\'s wild boar; the Cave Bear its bear in the Cave Bear\'s own brown, not the Frostreach\'s white',
  who[0].plan === 'boar' && who[1].plan === 'game:Cave Bear' && who[1].coat.every((v, i) => Math.abs(v - [0x4a, 0x3a, 0x2a][i] / 255) < .01), who.map(w => [w.n, w.plan, w.coat]));
check('the Ash Hound keeps its own body (its embers are its own)', !who[2].hc && !who[2].fail, who[2]);
const legs = await page.evaluate(() => { const m = hcMap(_W[1].rig.hc.C.byName); return { n: m.length, paw: m.filter(([j]) => /^p[fh]/.test(j)).map(([j, b]) => j + '>' + b.name), wr: m.filter(([j]) => /^(wr|hk)/.test(j)).length, boar: hcMap(_W[0].rig.hc.C.byName).length }; });
check(`the bear's plantigrade legs: each paw takes the driver's paw (${legs.paw.join(', ')}), the wrists and hocks drive nothing; the boar takes all ${legs.boar} joints but its tail's third`,
  legs.paw.length === 4 && legs.paw.every(p => /_2$/.test(p)) && legs.wr === 0 && legs.boar === 23, legs);

// the same beast is the same body: the genome comes from the id alone
const same = await page.evaluate(() => _W.filter(f => f.rig.hc).every(f => JSON.stringify(HC.toSaved(HC.genome(hcPlan(f.n), 'wolf:' + f.e.id))) === JSON.stringify(HC.toSaved(f.rig.hc.C.g))));
check('a beast\'s genome is the same rolled again from its id', same);

// its size: the kit's hips at the driver's, its back over them
const size = await page.evaluate(() => _W.filter(f => f.rig.hc).map(f => { const rig = f.rig; rig.root.parent.updateMatrixWorld(true);
  const a = rig.hc.C.byName.spine0.getWorldPosition(new THREE.Vector3()), b = rig.B.hips.getWorldPosition(new THREE.Vector3()), gy = WORLD.worldH(b.x, b.z);
  return [f.n, +(a.y - gy).toFixed(2), +(b.y - gy).toFixed(2), +a.distanceTo(b).toFixed(3)]; }));
check('each kit body stands at its driver\'s size: its hips within 3 cm of the driver\'s', size.length === 2 && size.every(([, , , d]) => d < .03), size);

// the levels: near, the hide and its fur; at 25 m, the hide alone; at 60 m, the driver
const lv = await page.evaluate(() => { const out = {}, f = _W[0], g0 = f.e.mesh, fx = -Math.sin(yaw), fz = -Math.cos(yaw);
  const at = (dd, k) => { CAM.position.set(g0.position.x - fx * dd, g0.position.y + 1.65, g0.position.z - fz * dd); CAM.updateMatrixWorld(true); for (let i = 0; i < 3; i++) tickCreatures(1 / 60, 3e5 + k * 100 + i * 17);
    const H = f.rig.hc; let n = 0; if (H.W.visible) H.W.traverse(o => { if (o.isMesh && o.visible) n++; }); return { L: H.L, kit: n, driver: f.rig.mesh.visible }; };
  out.near = at(6, 1); out.mid = at(25, 2); out.far = at(60, 3); out.back = at(6, 4); return out; });
check(`three levels: near the hide and fur (${lv.near.kit} meshes), at 25 m the hide and its ears and tusks without the fur's nine shells (${lv.mid.kit}), at 60 m the driver's own body`,
  lv.near.L === 0 && lv.near.kit >= 10 && !lv.near.driver && lv.mid.L === 1 && lv.mid.kit <= lv.near.kit - 9 && !lv.mid.driver && lv.far.L === 2 && lv.far.driver && lv.back.L === 0, lv);

// a run: the bear moved along the ground, its kit bones turn, and its paws stay by the driver's
const trot = await page.evaluate(() => { const f = _W[1], e = f.e, rig = f.rig, by = rig.hc.C.byName, mats = () => Array.from(rig.hc.C.skel.boneMatrices);
  const dx = Math.sin(e.mesh.rotation.y), dz = Math.cos(e.mesh.rotation.y), a = mats(); let worst = 0, dy = 0, gait = '';
  rig.root.parent.updateMatrixWorld(true); rig.hc.C.skel.update();
  // against the ground the driver was set on (e.mesh's own height): on CI's runner that sat ~0.6 m off worldH at this spot (S1251)
  const toes = ['leg0L_3', 'leg0R_3', 'leg1L_3', 'leg1R_3'].map(n => +(by[n].getWorldPosition(new THREE.Vector3()).y - e.mesh.position.y).toFixed(3));
  for (let i = 0; i < 40; i++) { e.x += dx * .05; e.z += dz * .05; e.mesh.position.set(e.x, WORLD.worldH(e.x, e.z), e.z); tickCreatures(1 / 60, 4e5 + i * 16.7); rig.hc.C.skel.update();
    if (i > 20) { rig.root.parent.updateMatrixWorld(true); for (const [d, k] of [['pfL', 'leg0L_2'], ['phR', 'leg1R_2']]) { const p = rig.B[d].getWorldPosition(new THREE.Vector3()), q = by[k].getWorldPosition(new THREE.Vector3()); worst = Math.max(worst, p.distanceTo(q)); dy = Math.max(dy, Math.abs(p.y - q.y)); } } }
  const b = mats(); let moved = 0; for (let i = 0; i < a.length; i++) moved = Math.max(moved, Math.abs(a[i] - b[i]));
  return { moved: +moved.toFixed(3), worst: +worst.toFixed(3), dy: +dy.toFixed(3), toes, hip: +wolfHipY(rig.k).toFixed(2), scale: +rig.root.scale.x.toFixed(2), w: Object.fromEntries(Object.entries(rig.w).map(([k, v]) => [k, +v.toFixed(2)])) }; });
check(`the bear standing puts its four toes on the ground (${trot.toes.join(', ')} m)`, trot.toes.every(y => Math.abs(y) < .05), trot.toes);
// the kit's bear carries its shoulders about 0.19 m ahead of the wolf rig's, so its fore paw lands that far forward of the driver's
check(`the bear's run turns the kit's bones (by ${trot.moved}); its paws rise and fall within ${trot.dy} m of the driver's and keep within ${trot.worst} m`, trot.moved > .02 && trot.dy < .08 && trot.worst < .35, trot);

// the tell's glow reaches the kit's hide, and goes out with it
const glow = await page.evaluate(() => { const f = _W[0], rig = f.rig, mats = () => [...rig.hc.hide, ...rig.hc.fur].map(o => o.material);
  const lit = () => mats().filter(m => m.emissive && m.emissive.getHex() !== 0).length;
  telegraphPulse(f.e, 1); tickCreatures(1 / 60, 6e5); const on = lit(), all = mats().length; telegraphReset(f.e); tickCreatures(1 / 60, 6e5 + 17); return { on, all, off: lit() }; });
check('the tell\'s glow lights the kit\'s hide and fur and goes out with it', glow.on > 0 && glow.on === glow.all && glow.off === 0, glow);

// the coach's two horses (Session 1272): the kit's horse in each one's coat, keyed by the coach's road and the place in the team as
// buildCoachLine keys them; standing on their hooves, and at the trot each planted hoof kept on the driver's (hcLegIK)
const horses = await page.evaluate(() => { const fx = -Math.sin(yaw), fz = -Math.cos(yaw), sx = -fz, sz = fx;
  window._HS = ['Horse', 'Grey Horse'].map((n, i) => { const hg = new THREE.Group(), rg = buildWolf(n, 1.6); rg.hcKey = 'coach:f4beasts:' + i; hg.add(rg.root);
    const x = px + fx * 14 + sx * (i - .5) * 3.4, z = pz + fz * 14 + sz * (i - .5) * 3.4; hg.position.set(x, WORLD.worldH(x, z), z); hg.rotation.y = yaw; WORLD.scene.add(hg); return { n, hg, rg }; });
  CAM.position.set(px, worldH(px, pz) + 1.65, pz); CAM.updateMatrixWorld(true);
  let k = 0; HBODY.last = -1e9; while (_HS.some(h => !h.rg.hc && !h.rg.hcFail) && k++ < 100) tickCreatures(1 / 60, 8e5 + k * (HBODY.gap + 1));
  return _HS.map(({ n, hg, rg }) => { const H = rg.hc; if (!H) return { n, hc: false }; hg.updateMatrixWorld(true); const by = H.C.byName;
    const a = by.spine0.getWorldPosition(new THREE.Vector3()), b = rg.B.hips.getWorldPosition(new THREE.Vector3());
    return { n, hc: true, plan: H.C.g.plan, seed: H.C.g.seed, want: HC.hashKey(rg.hcKey), bones: H.C.bones.length, map: H.map.length, tris: H.C.stats.tris,
      coat: H.C.plan.palette.coat.map(v => +v.toFixed(2)), hips: +a.distanceTo(b).toFixed(3),
      toes: ['leg0L_4', 'leg0R_4', 'leg1L_4', 'leg1R_4'].map(t => +(by[t].getWorldPosition(new THREE.Vector3()).y - hg.position.y).toFixed(3)) }; }); });
console.log('  horses:', JSON.stringify(horses));
check(`the coach's horses wear the kit's horse (${horses.map(h => h.bones + ' bones, ' + h.tris + ' triangles').join('; ')}), each in its own coat and keyed by its place in the team`,
  horses.every(h => h.hc && h.map === 24 && h.seed === h.want && h.hips < .03) && horses[0].plan === 'game:Horse' && horses[1].plan === 'game:Grey Horse' && horses[0].seed !== horses[1].seed
  && horses[1].coat.every((v, i) => Math.abs(v - [0xb4, 0xae, 0xa4][i] / 255) < .01), horses);
check(`the horses stand on their hooves (${horses.map(h => h.toes.join(', ')).join('; ')} m)`, horses.every(h => h.toes.every(y => Math.abs(y) < .05)), horses.map(h => h.toes));
const hoof = await page.evaluate(() => { const { hg, rg } = _HS[0], H = rg.hc, by = H.C.byName, out = { n: 0, worst: 0 };
  const lift = (d) => { const p = rg.B[d].getWorldPosition(new THREE.Vector3()); return p.y - WORLD.worldH(p.x, p.z); }; hg.updateMatrixWorld(true); const rest = lift('pfL');
  for (let i = 0; i < 120; i++) { hg.position.x += Math.sin(hg.rotation.y) * 2.2 / 60; hg.position.z += Math.cos(hg.rotation.y) * 2.2 / 60; hg.position.y = WORLD.worldH(hg.position.x, hg.position.z); tickCreatures(1 / 60, 8.5e5 + i * 16.7);
    if (i > 50) { hg.updateMatrixWorld(true); for (const L of H.ik) { if (lift(L.d) > rest + .03) continue; out.n++;
      out.worst = Math.max(out.worst, Math.abs(L.end.getWorldPosition(new THREE.Vector3()).y - rg.B[L.d].getWorldPosition(new THREE.Vector3()).y - L.oy)); } } }
  out.worst = +out.worst.toFixed(3); out.trot = +rg.w.trot.toFixed(2); return out; });
check(`at the trot each planted hoof keeps within ${hoof.worst} m of the driver's (${hoof.n} planted samples; it was 0.11 m before the legs were bent onto it)`, hoof.trot > .5 && hoof.n > 20 && hoof.worst < .06, hoof);
await page.evaluate(() => { for (const { hg } of _HS) hg.parent.remove(hg); tickCreatures(1 / 60, 9e5); });

// the pictures: the line from 7 m, then the bear from 4 m
await page.evaluate(() => { const a = _W[0].e, b = _W[2].e, mx = (a.x + b.x) / 2, mz = (a.z + b.z) / 2, fx = -Math.sin(yaw), fz = -Math.cos(yaw); px = mx - fx * 7; pz = mz - fz * 7; pitch = -.12; });
for (let i = 0; i < 8; i++) { await page.evaluate(() => tickCreatures(1 / 60, performance.now())); await g.frames(1); }
await page.screenshot({ path: path.join(OUT, 'f4-beasts.jpg') });
await page.evaluate(() => { const f = _W[1].e; const fx = -Math.sin(yaw), fz = -Math.cos(yaw); px = f.x - fx * 4; pz = f.z - fz * 4; pitch = -.2; });
for (let i = 0; i < 6; i++) { await page.evaluate(() => tickCreatures(1 / 60, performance.now())); await g.frames(1); }
await page.screenshot({ path: path.join(OUT, 'f4-beasts-near.jpg') });

const dead = await page.evaluate(() => { const f = _W[0], rig = f.rig, before = []; rig.hc.W.traverse(o => { if (o.isMesh) before.push([o, o.material]); });
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
