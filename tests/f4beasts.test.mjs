// Card F4's next family (Session 1251): on the new look the Boar and the Cave Bear wear the creature kit's body as the wolves do
// (Session 1202, f4wolves), driven by their old 24-bone rig. The boar is the kit's wild boar; the Cave Bear its Frostreach bear in the
// Cave Bear's own brown, whose plantigrade legs have three bones to the driver's four (hcMap: the paw takes the driver's paw). A line of
// the two and an Ash Hound (its own plan since Session 1274) ahead of you: each on the kit's skeleton, keyed by its foe id; its hips at its driver's;
// three levels by distance; a run that moves the kit's bones with its feet by the driver's; the tell's glow; and killed, a corpse
// darkened with its shaders kept that lies with its driver. Session 1273 adds the coach's two horses on the kit's horse, Session 2148 the ox and the yoked ox, Session 2154 the donkey and the pack mule, Session 2155 the camel, Session 2156 the reindeer and the highland yak, Session 2164 the giant goat. Pictures: docs/prototypes/f4/f4-beasts.jpg, f4-beasts-near.jpg, f4-oxen.jpg, f4-packbeasts.jpg, f4-camel.jpg, f4-markburden.jpg and f4-giantgoat.jpg.
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
const ash = await page.evaluate(() => { const H = _W[2].rig.hc; if (!H) return null; const a = H.C.meshes[0].geometry.attributes.aGlow, y = H.C.meshes[0].geometry.attributes.position; let lit = 0, low = 0;
  for (let i = 0; i < a.count; i++) if (a.getX(i) > .5) { lit++; if (y.getY(i) < .5) low++; } return { lit, low, n: a.count, eyes: H.C.plan.parts.find(p => p[0] === 'head')[1].eyes[0].glow }; });
check(`the Ash Hound wears the kit's own Ash Hound (Session 1274): its embers a broken seam down the back (${ash && ash.lit} of ${ash && ash.n} hide points lit, none low on the body), its eyes lit`,
  who[2].hc && who[2].plan === 'ashhound' && who[2].seed === who[2].want && ash.lit > 20 && ash.lit < ash.n * .1 && ash.low === 0 && ash.eyes > 1, { who: who[2], ash });
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
check('each kit body stands at its driver\'s size: its hips within 3 cm of the driver\'s', size.length === 3 && size.every(([, , , d]) => d < .03), size);

// the levels: near, the hide and its fur; at 25 m, the hide alone; at 60 m, the driver
const lv = await page.evaluate(() => { const out = {}, f = _W[0], g0 = f.e.mesh, fx = -Math.sin(yaw), fz = -Math.cos(yaw);
  const at = (dd, k) => { CAM.position.set(g0.position.x - fx * dd, g0.position.y + 1.65, g0.position.z - fz * dd); CAM.updateMatrixWorld(true); for (let i = 0; i < 3; i++) tickCreatures(1 / 60, 3e5 + k * 100 + i * 17);
    const H = f.rig.hc; let n = 0; if (H.W.visible) H.W.traverse(o => { if (o.isMesh && o.visible) n++; }); return { L: H.L, kit: n, driver: f.rig.mesh.visible }; };
  out.near = at(4, 1); out.mid = at(25, 2); out.far = at(60, 3); out.back = at(4, 4); /* S1561 — 4 m: past 6 m the near level draws three of the fur shells */ return out; });
check(`three levels: near the hide and fur (${lv.near.kit} meshes), at 25 m the hide and its ears and tusks without the fur's nine shells (${lv.mid.kit}), at 60 m the driver's own body`,
  lv.near.L === 0 && lv.near.kit >= 10 && !lv.near.driver && lv.mid.L === 1 && lv.mid.kit <= lv.near.kit - 9 && !lv.mid.driver && lv.far.L === 2 && lv.far.driver && lv.back.L === 0, lv);

// a run: the bear moved along the ground, its kit bones turn, and its paws stay by the driver's
const trot = await page.evaluate(() => { const f = _W[1], e = f.e, rig = f.rig, by = rig.hc.C.byName, mats = () => Array.from(rig.hc.C.skel.boneMatrices);
  const dx = Math.sin(e.mesh.rotation.y), dz = Math.cos(e.mesh.rotation.y), a = mats(); let worst = 0, dy = 0, bend = 0, gait = '';
  rig.root.parent.updateMatrixWorld(true); rig.hc.C.skel.update();
  // against the ground the driver was set on (e.mesh's own height): on CI's runner that sat ~0.6 m off worldH at this spot (S1251)
  const toes = ['leg0L_3', 'leg0R_3', 'leg1L_3', 'leg1R_3'].map(n => +(by[n].getWorldPosition(new THREE.Vector3()).y - e.mesh.position.y).toFixed(3));
  for (let i = 0; i < 40; i++) { e.x += dx * .05; e.z += dz * .05; e.mesh.position.set(e.x, WORLD.worldH(e.x, e.z), e.z); tickCreatures(1 / 60, 4e5 + i * 16.7); rig.hc.C.skel.update();
    if (i > 20) { rig.root.parent.updateMatrixWorld(true); for (const [d, k] of [['pfL', 'leg0L_2'], ['phR', 'leg1R_2']]) { const p = rig.B[d].getWorldPosition(new THREE.Vector3()), q = by[k].getWorldPosition(new THREE.Vector3()); worst = Math.max(worst, p.distanceTo(q)); dy = Math.max(dy, Math.abs(p.y - q.y)); }
      for (const L of rig.hc.ik || []) bend = Math.max(bend, Math.abs(L.end.getWorldPosition(new THREE.Vector3()).y - rig.B[L.d].getWorldPosition(new THREE.Vector3()).y - L.oy)); } }
  const b = mats(); let moved = 0; for (let i = 0; i < a.length; i++) moved = Math.max(moved, Math.abs(a[i] - b[i]));
  return { moved: +moved.toFixed(3), worst: +worst.toFixed(3), dy: +dy.toFixed(3), bend: +bend.toFixed(3), ik: !!rig.hc.ik, toes, hip: +wolfHipY(rig.k).toFixed(2), scale: +rig.root.scale.x.toFixed(2), w: Object.fromEntries(Object.entries(rig.w).map(([k, v]) => [k, +v.toFixed(2)])) }; });
check(`the bear standing puts its four toes on the ground (${trot.toes.join(', ')} m)`, trot.toes.every(y => Math.abs(y) < .05), trot.toes);
// the kit's bear carries its shoulders about 0.19 m ahead of the wolf rig's, so its fore paw lands that far forward of the driver's
// Session 1557: the bear's legs are bent onto the driver's paws (hcLegIK, as the horse's): its toes hold the driver's paw's height and
// its own rest offset, so its paw joint above them rides with the heel's lift (0.081 m off the driver's paw, 0.057 without the bend)
check(`the bear's run turns the kit's bones (by ${trot.moved}); its toes keep within ${trot.bend} m of the driver's paws' height (its paws within ${trot.dy} m) and within ${trot.worst} m`,
  trot.moved > .02 && trot.ik && trot.bend < .03 && trot.dy < .1 && trot.worst < .35, trot);

// Session 1547: on a slope each toe meets the ground under it (hcGround). The bear set on the steepest clear spot near the start,
// facing down the fall line, left to come to a stand (the jump there reads as a gallop); its four toes against activeTerrainH under
// each, with the ground pass and without it (rig.hc.gr off)
const slope = await page.evaluate(() => { const f = _W[1], e = f.e, rig = f.rig, by = rig.hc.C.byName, Hh = (x, z) => activeTerrainH(x, z), was = [e.x, e.z, e.mesh.position.y, e.mesh.rotation.y]; let best = null;
  for (let d = 6; d < 60; d += 2) for (let a = 0; a < 6.28; a += .2) { const x = px + Math.cos(a) * d, z = pz + Math.sin(a) * d; if (WORLD.solidAt(x, z) || Hh(x, z) < WORLD.SEA_Y + .5) continue;
    const gx = Hh(x + .5, z) - Hh(x - .5, z), gz = Hh(x, z + .5) - Hh(x, z - .5), sl = Math.hypot(gx, gz); if (!best || sl > best.sl) best = { x, z, sl, ang: Math.atan2(gx, gz) }; }
  e.x = best.x; e.z = best.z; e.mesh.position.set(e.x, Hh(e.x, e.z), e.z); e.mesh.rotation.y = e.combatYaw = best.ang;
  CAM.position.set(e.x + 5, e.mesh.position.y + 1.65, e.z); CAM.updateMatrixWorld(true);
  const toes = () => { for (let i = 0; i < 3; i++) tickCreatures(1 / 60, 7e5 + i * 17); rig.root.parent.updateMatrixWorld(true);
    return ['leg0L_3', 'leg0R_3', 'leg1L_3', 'leg1R_3'].map(n => { const p = by[n].getWorldPosition(new THREE.Vector3()); return +(p.y - Hh(p.x, p.z)).toFixed(3); }); };
  for (let i = 0; i < 90; i++) tickCreatures(1 / 60, 6.5e5 + i * 17);
  const gr = rig.hc.gr; rig.hc.gr = null; const off = toes(); rig.hc.gr = gr; const on = toes();
  e.x = was[0]; e.z = was[1]; e.mesh.position.set(e.x, was[2], e.z); e.mesh.rotation.y = e.combatYaw = was[3]; CAM.position.set(px, worldH(px, pz) + 1.65, pz); CAM.updateMatrixWorld(true); tickCreatures(1 / 60, 7e5 + 99);
  return { slope: +best.sl.toFixed(2), off, on, worstOff: Math.max(...off.map(Math.abs)), worstOn: Math.max(...on.map(Math.abs)), drop: +(rig.hc.drop || 0).toFixed(3), stand: +rig.w.stand.toFixed(2) }; });
check(`on a slope of ${slope.slope} the bear's toes meet the ground under each (${slope.on.join(', ')} m; ${slope.off.join(', ')} without the ground pass)`,
  slope.stand > .9 && slope.worstOn < .05 && (slope.slope < .15 || slope.worstOn < slope.worstOff * .5), slope);

// Session 1556: a beast that moves sideways or backs off while it faces you (a pack's flank, an archer's retreat) sweeps its paws the
// way its hips go over the ground (WG_U), not straight back under it. The bear walked 1.2 m/s ahead, to its left and back, facing one
// way; a planted paw (the lowest 30% of its frames) should stand still on the ground. The driver's paws are where the sweep is made
// (before, sideways they slid as fast as the body went); the kit's, which stray up to 0.3 m from the driver's, no worse than ahead
const sweep = await page.evaluate(() => { const f = _W[1], e = f.e, rig = f.rig, gg = rig.root.parent, by = rig.hc.C.byName, was = [e.x, e.z, gg.position.y, gg.rotation.y], V = o => o.getWorldPosition(new THREE.Vector3());
  const paws = [...['leg0L', 'leg0R', 'leg1L', 'leg1R'].map(l => { let n = 0; while (by[l + '_' + (n + 1)]) n++; return by[l + '_' + n]; }), ...['pfL', 'pfR', 'phL', 'phR'].map(j => rig.B[j])];
  let t = 8e5; const run = (dx, dz) => { let x = was[0], z = was[1]; e.x = x; e.z = z; gg.position.set(x, activeTerrainH(x, z), z); gg.rotation.y = 0; rig.lx = rig.px = rig.lyaw = null;
    for (let i = 0; i < 40; i++) tickCreatures(1 / 60, t += 17); const rec = paws.map(() => []), prev = [];
    for (let i = 0; i < 200; i++) { x += dx * 1.2 / 60; z += dz * 1.2 / 60; e.x = x; e.z = z; gg.position.set(x, activeTerrainH(x, z), z); tickCreatures(1 / 60, t += 17); gg.updateMatrixWorld(true);
      paws.forEach((o, j) => { const w = V(o); if (prev[j] && i > 30) rec[j].push([w.y - activeTerrainH(w.x, w.z), Math.hypot(w.x - prev[j].x, w.z - prev[j].z) * 60]); prev[j] = w; }); }
    const sl = rs => { let s = 0, n = 0; for (const r of rs) { const a = r.sort((u, v) => u[0] - v[0]).slice(0, Math.floor(r.length * .3)); for (const u of a) { s += u[1]; n++; } } return +(s / n).toFixed(2); };
    return { slip: sl(rec.slice(4)), kit: sl(rec.slice(0, 4)), gallop: rig.gallop }; };
  const out = { ahead: run(0, 1), side: run(1, 0), back: run(0, -1) };
  e.x = was[0]; e.z = was[1]; gg.position.set(e.x, was[2], e.z); gg.rotation.y = e.combatYaw = was[3]; rig.lx = rig.px = rig.lyaw = null; tickCreatures(1 / 60, t += 17); return out; });
// Session 1557: and the kit's own paws, bent onto the driver's, planted ahead too (0.95 m/s before the bend)
check(`the bear walked sideways and backwards plants its paws (${sweep.side.slip} and ${sweep.back.slip} m/s against ${sweep.ahead.slip} ahead; the kit's ${sweep.side.kit} and ${sweep.back.kit} against ${sweep.ahead.kit})`,
  !sweep.side.gallop && sweep.side.slip < .35 && sweep.back.slip < .35 && sweep.ahead.kit < .35 && sweep.side.kit < sweep.ahead.kit + .2 && sweep.back.kit < sweep.ahead.kit + .2, sweep);

// the tell's glow reaches the kit's hide, and goes out with it
const glow = await page.evaluate(() => { const f = _W[0], rig = f.rig, mats = () => [...rig.hc.hide, ...rig.hc.fur].map(o => o.material);
  const lit = () => mats().filter(m => m.emissive && m.emissive.getHex() !== 0).length;
  telegraphPulse(f.e, 1); tickCreatures(1 / 60, 6e5); const on = lit(), all = mats().length; telegraphReset(f.e); tickCreatures(1 / 60, 6e5 + 17); return { on, all, off: lit() }; });
check('the tell\'s glow lights the kit\'s hide and fur and goes out with it', glow.on > 0 && glow.on === glow.all && glow.off === 0, glow);

// the coach's two horses (Session 1273): the kit's horse in each one's coat, keyed by the coach's road and the place in the team as
// buildCoachLine keys them; standing on their hooves, and at the trot each planted hoof kept on the driver's (hcLegIK)
const horses = await page.evaluate(() => { const fx = -Math.sin(yaw), fz = -Math.cos(yaw), sx = -fz, sz = fx;
  window._HS = ['Horse', 'Grey Horse'].map((n, i) => { const hg = new THREE.Group(), rg = buildWolf(n, 1.6); rg.hcKey = 'coach:f4beasts:' + i; hg.add(rg.root);
    const x = px + fx * 14 + sx * (i - .5) * 3.4, z = pz + fz * 14 + sz * (i - .5) * 3.4; hg.position.set(x, WORLD.worldH(x, z), z); hg.rotation.y = yaw; WORLD.scene.add(hg); return { n, hg, rg }; });
  CAM.position.set(px, worldH(px, pz) + 1.65, pz); CAM.updateMatrixWorld(true);
  { const t1 = performance.now(); while (JOBS.length && performance.now() - t1 < 20000) runJobs(); }
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

// the teams by island (Session 1825, #1046 B): buildCoachBeast as buildCoachLine calls it with its road's island. The Mark's two are the
// kit's horse in the Mark's dun (paler than the Gatelands' bay), Aurenne's two the kit's mule; each on its hooves, keyed by its place
const teams = await page.evaluate(() => { const fx = -Math.sin(yaw), fz = -Math.cos(yaw), sx = -fz, sz = fx;
  const T = [['gatelands', 0], ['mark', 0], ['mark', 1], ['aurenne', 0], ['aurenne', 1]].map(([isle, i], j) => { const hg = new THREE.Group(), rg = buildCoachBeast('f4teams', i, isle); hg.add(rg.root);
    const x = px + fx * 14 + sx * (j - 2) * 3.4, z = pz + fz * 14 + sz * (j - 2) * 3.4; hg.position.set(x, WORLD.worldH(x, z), z); hg.rotation.y = yaw; WORLD.scene.add(hg); return { isle, i, hg, rg }; });
  window._TS = T; CAM.position.set(px, worldH(px, pz) + 1.65, pz); CAM.updateMatrixWorld(true);
  let k = 0; HBODY.last = -1e9; while (T.some(h => !h.rg.hc && !h.rg.hcFail) && k++ < 200) tickCreatures(1 / 60, 9.5e5 + k * (HBODY.gap + 1));
  const mean = H => { let r = 0, g = 0, b = 0, n = 0; for (const m of H.C.meshes) { const c = m.geometry.attributes.color; if (!c) continue; for (let v = 0; v < c.count; v++) { r += c.getX(v); g += c.getY(v); b += c.getZ(v); n++; } break; } return +((r + g + b) / 3 / n).toFixed(3); };
  const out = T.map(({ isle, i, hg, rg }) => { const H = rg.hc; if (!H) return { isle, i, hc: false }; hg.updateMatrixWorld(true); const by = H.C.byName;
    return { isle, i, hc: true, kind: rg.name, plan: H.C.g.plan, island: H.C.g.island || null, seed: H.C.g.seed, want: HC.hashKey(rg.hcKey), map: H.map.length, tris: H.C.stats.tris, light: mean(H),
      toes: ['leg0L_4', 'leg0R_4', 'leg1L_4', 'leg1R_4'].map(t => +(by[t].getWorldPosition(new THREE.Vector3()).y - hg.position.y).toFixed(3)) }; });
  for (const { hg } of T) hg.parent.remove(hg); tickCreatures(1 / 60, 9.9e5); return out; });
console.log('  teams:', JSON.stringify(teams));
const [tg, tm0, tm1, ta0, ta1] = teams;
check(`the Mark's coach horses are the kit's horse in the Mark's dun (mean colour ${tm0.light}, ${tm1.light} against the Gatelands' ${tg.light})`,
  [tg, tm0, tm1].every(h => h.hc && h.plan === 'game:Horse' && h.map === 24 && h.seed === h.want) && tg.island === 'gatelands' && tm0.island === 'mark' && tm1.island === 'mark'
  && tm0.seed !== tm1.seed && tm0.light > tg.light + .08 && tm1.light > tg.light + .08, teams);
check(`Aurenne's coach team is two mules (${ta0.tris}, ${ta1.tris} triangles), keyed by their place`,
  [ta0, ta1].every(h => h.hc && h.kind === 'Mule' && h.plan === 'mule' && h.island === 'aurenne' && h.map === 24 && h.seed === h.want) && ta0.seed !== ta1.seed, teams);
check(`every team stands on its hooves (${teams.map(h => h.toes.join(', ')).join('; ')} m)`, teams.every(h => h.toes && h.toes.every(y => Math.abs(y) < .05)), teams.map(h => h.toes));

// Session 2148 (L3, OG-046; backlog L3's "oxen on a driver of their own for the ox cart"): buildAnimal('Ox' | 'Yoked Ox', key) builds the
// kit's ox (the cow's plan at 1.15) and the same ox under its yoke and bow, on a driver of their own (WOLF_KINDS' Ox, the cow's legs, broader),
// keyed burden:<key>, which no spawn rolls. The plain ox and the yoked one on the same key are the same beast, the yoke the only difference;
// each stands on its hooves with its hips at 1.41 m, its back about a man's shoulder; at a walk its bones move and its hooves keep the ground
const oxen = await page.evaluate(() => { const fx = -Math.sin(yaw), fz = -Math.cos(yaw), sx = -fz, sz = fx;
  window._OX = [['Ox', 'f4oxen:0'], ['Yoked Ox', 'f4oxen:0'], ['Yoked Ox', 'f4oxen:1']].map(([n, key], j) => { const hg = new THREE.Group(), rg = buildAnimal(n, key); hg.add(rg.root);
    const x = px + fx * 9 + sx * (j - 1) * 3.4, z = pz + fz * 9 + sz * (j - 1) * 3.4; hg.position.set(x, WORLD.worldH(x, z), z); hg.rotation.y = yaw + Math.PI / 2; WORLD.scene.add(hg); return { n, key, hg, rg }; });
  CAM.position.set(px, worldH(px, pz) + 1.65, pz); CAM.updateMatrixWorld(true);
  let k = 0; HBODY.last = -1e9; while (_OX.some(h => !h.rg.hc && !h.rg.hcFail) && k++ < 300) tickCreatures(1 / 60, 1.05e6 + k * (HBODY.gap + 1));
  return _OX.map(({ n, hg, rg }) => { const H = rg.hc; if (!H) return { n, hc: false }; hg.updateMatrixWorld(true); const by = H.C.byName;
    const a = by.spine0.getWorldPosition(new THREE.Vector3()), b = rg.B.hips.getWorldPosition(new THREE.Vector3()), box = new THREE.Box3(); for (const m of H.C.meshes) box.expandByObject(m);
    return { n, hc: true, key: rg.hcKey, plan: H.C.g.plan, seed: H.C.g.seed, want: HC.hashKey(rg.hcKey), map: H.map.length, tris: H.C.stats.tris, hips: +a.distanceTo(b).toFixed(3),
      hipY: +(a.y - hg.position.y).toFixed(3), man: +((box.max.y - hg.position.y) / SCALE.PEOPLE.gatelander.m).toFixed(2), yoke: H.C.plan.parts.some(([p, o]) => p === 'harness' && o.kind === 'yoke'),
      ...(() => { let n = 0, all = 0; H.C.root.traverse(o => { if (o.isMesh && !H.C.meshes.includes(o)) { n++; const G = o.geometry; all += (G.index ? G.index.count : G.attributes.position.count) / 3; } }); return { bits: n, bitTris: all }; })(),
      toes: ['leg0L_4', 'leg0R_4', 'leg1L_4', 'leg1R_4'].map(t => +(by[t].getWorldPosition(new THREE.Vector3()).y - hg.position.y).toFixed(3)) }; }); });
console.log('  oxen:', JSON.stringify(oxen));
const [ox0, oy0, oy1] = oxen;
check(`the ox and the yoked ox wear the kit's ox (${oxen.map(o => o.plan + ' ' + o.tris).join(', ')} triangles of hide), keyed burden:<key>; on one key the same hide, the yoke and its bow ${oy0.bits - ox0.bits} more pieces and ${oy0.bitTris - ox0.bitTris} triangles`,
  oxen.every(o => o.hc && o.map === 24 && o.seed === o.want && /^burden:/.test(o.key) && o.hips < .03) && ox0.plan === 'ox' && !ox0.yoke && oy0.plan === 'yokedox' && oy0.yoke && oy1.yoke
  && ox0.seed === oy0.seed && oy0.seed !== oy1.seed && oy0.tris === ox0.tris && oy0.bits === ox0.bits + 2 && oy0.bitTris - ox0.bitTris > 100, oxen);
check(`each ox stands on its hooves (${oxen.map(o => o.toes.join(', ')).join('; ')} m), its hips at ${oxen.map(o => o.hipY).join(', ')} m and its horns at ${oxen.map(o => o.man).join(', ')} of a man`,
  oxen.every(o => o.toes.every(y => Math.abs(y) < .05) && Math.abs(o.hipY - 1.41) < .05 && o.man > .95 && o.man < 1.3), oxen);
{ const url = await page.evaluate(() => { const a = _OX[0].hg.position, b = _OX[2].hg.position, mx = (a.x + b.x) / 2, mz = (a.z + b.z) / 2, fx = -Math.sin(yaw), fz = -Math.cos(yaw);
    window._OXP = [px, pz]; px = mx - fx * 6; pz = mz - fz * 6; CAM.position.set(px, worldH(px, pz) + 1.65, pz); CAM.lookAt(mx, worldH(mx, mz) + .9, mz); CAM.updateMatrixWorld(true); const hid = _W.map(w => [w.e.mesh, w.e.mesh.visible]); for (const [m] of hid) m.visible = false;
    REN.render(scene, CAM); const u = REN.domElement.toDataURL('image/jpeg', .85); for (const [m, v] of hid) m.visible = v; return u; });
  fs.writeFileSync(path.join(OUT, 'f4-oxen.jpg'), Buffer.from(url.split(',')[1], 'base64')); }
const oxWalk = await page.evaluate(() => { const { hg, rg } = _OX[1], H = rg.hc, by = H.C.byName, sk = H.C.skel; sk.update(); const a = Array.from(sk.boneMatrices); let low = 9;
  for (let i = 0; i < 120; i++) { hg.position.x += Math.sin(hg.rotation.y) * 1.1 / 60; hg.position.z += Math.cos(hg.rotation.y) * 1.1 / 60; hg.position.y = WORLD.worldH(hg.position.x, hg.position.z); tickCreatures(1 / 60, 1.1e6 + i * 16.7);
    if (i > 50) { hg.updateMatrixWorld(true); for (const t of ['leg0L_4', 'leg0R_4', 'leg1L_4', 'leg1R_4']) { const p = by[t].getWorldPosition(new THREE.Vector3()); low = Math.min(low, p.y - WORLD.worldH(p.x, p.z)); } } }
  sk.update(); const b = Array.from(sk.boneMatrices); let moved = 0; for (let i = 0; i < a.length; i++) moved = Math.max(moved, Math.abs(a[i] - b[i]));
  return { moved: +moved.toFixed(3), low: +low.toFixed(3), stand: +rg.w.stand.toFixed(2) }; });
check(`the yoked ox walked 1.1 m/s: its bones move (by ${oxWalk.moved}) and its lowest hoof stays by the ground (${oxWalk.low} m)`, oxWalk.moved > .01 && oxWalk.stand < .2 && Math.abs(oxWalk.low) < .06, oxWalk);
await page.evaluate(() => { for (const { hg } of _OX) hg.parent.remove(hg); [px, pz] = _OXP; tickCreatures(1 / 60, 1.2e6); });

// Session 2173 (L3, OG-046; owed from S2148): the ox by island. buildAnimal('Ox' | 'Yoked Ox', key, island) wears the kit's island coat: the
// Mark's black, Aurenne's pale grey; with no island the kit's own brown. One key, so the same beast in three coats on the same bones
const oxIsle = await page.evaluate(() => { const fx = -Math.sin(yaw), fz = -Math.cos(yaw), sx = -fz, sz = fx;
  window._OXI = [['Ox', null], ['Ox', 'mark'], ['Ox', 'aurenne'], ['Yoked Ox', 'mark'], ['Yoked Ox', 'aurenne']].map(([n, isle], j) => { const hg = new THREE.Group(), rg = buildAnimal(n, 'f4oxisle:0', isle); hg.add(rg.root);
    const x = px + fx * 10 + sx * (j - 1) * 3.4, z = pz + fz * 10 + sz * (j - 1) * 3.4; hg.position.set(x, WORLD.worldH(x, z), z); hg.rotation.y = yaw + Math.PI / 2; WORLD.scene.add(hg); return { n, isle, hg, rg }; });
  CAM.position.set(px, worldH(px, pz) + 1.65, pz); CAM.updateMatrixWorld(true);
  let k = 0; HBODY.last = -1e9; while (_OXI.some(h => !h.rg.hc && !h.rg.hcFail) && k++ < 400) tickCreatures(1 / 60, 1.25e6 + k * (HBODY.gap + 1));
  const lum = H => { const c = H.C.meshes[0].geometry.attributes.color; let s = 0; for (let v = 0; v < c.count; v++) s += (c.getX(v) + c.getY(v) + c.getZ(v)) / 3; return +(s / c.count).toFixed(3); };
  return _OXI.map(({ n, isle, rg }) => { const H = rg.hc; return H ? { n, isle, hc: true, island: H.C.g.island || null, plan: H.C.g.plan, seed: H.C.g.seed, tris: H.C.stats.tris, bones: H.C.skel.bones.length, L: lum(H) } : { n, isle, hc: false }; }); });
console.log('  oxen by island:', JSON.stringify(oxIsle));
{ const [o0, om, oa, ym, ya] = oxIsle;
  check(`the ox by island on one key: the kit's brown (${o0.L}), the Mark's black (${om.L}, yoked ${ym.L}), Aurenne's pale grey (${oa.L}, yoked ${ya.L}), the same ${o0.tris} triangles and ${o0.bones} bones`,
    oxIsle.every(o => o.hc && o.island === o.isle && o.seed === o0.seed) && [om, oa].every(o => o.tris === o0.tris && o.bones === o0.bones)
    && om.L < o0.L - .03 && ym.L < o0.L - .03 && oa.L > o0.L + .2 && ya.L > o0.L + .2, oxIsle); }
{ const url = await page.evaluate(() => { const a = _OXI[0].hg.position, b = _OXI[2].hg.position, mx = (a.x + b.x) / 2, mz = (a.z + b.z) / 2, fx = -Math.sin(yaw), fz = -Math.cos(yaw);
    const P = [px, pz]; px = mx - fx * 7; pz = mz - fz * 7; CAM.position.set(px, worldH(px, pz) + 1.65, pz); CAM.lookAt(mx, worldH(mx, mz) + .9, mz); CAM.updateMatrixWorld(true); const hid = _W.map(w => [w.e.mesh, w.e.mesh.visible]); for (const [m] of hid) m.visible = false; _OXI[3].hg.visible = _OXI[4].hg.visible = false;
    REN.render(scene, CAM); const u = REN.domElement.toDataURL('image/jpeg', .85); for (const [m, v] of hid) m.visible = v; [px, pz] = P; return u; });
  fs.writeFileSync(path.join(OUT, 'f4-oxen-isles.jpg'), Buffer.from(url.split(',')[1], 'base64')); }
await page.evaluate(() => { for (const { hg } of _OXI) hg.parent.remove(hg); tickCreatures(1 / 60, 1.26e6); });

// Session 2154 (L3, OG-046): buildAnimal('Donkey' | 'Pack Mule', key) builds the kit's donkey (the horse at .72) and its pack mule (the mule
// under two packs) on the horse's legs, keyed burden:<key> as the ox; each on its hooves, the donkey the smaller, the packs rigid pieces on
// the spine; walked, the pack mule's bones move and its hooves keep the ground
const pack = await page.evaluate(() => { const fx = -Math.sin(yaw), fz = -Math.cos(yaw), sx = -fz, sz = fx;
  window._PK = [['Donkey', 'f4pack:0'], ['Donkey', 'f4pack:1'], ['Pack Mule', 'f4pack:0'], ['Camel', 'f4pack:0']].map(([n, key], j) => { const hg = new THREE.Group(), rg = buildAnimal(n, key); hg.add(rg.root);
    const x = px + fx * 7 + sx * (j - 1.5) * 2.6, z = pz + fz * 7 + sz * (j - 1.5) * 2.6; hg.position.set(x, WORLD.worldH(x, z), z); hg.rotation.y = yaw + Math.PI / 2; WORLD.scene.add(hg); return { n, key, hg, rg }; });
  CAM.position.set(px, worldH(px, pz) + 1.65, pz); CAM.updateMatrixWorld(true);
  let k = 0; HBODY.last = -1e9; while (_PK.some(h => !h.rg.hc && !h.rg.hcFail) && k++ < 300) tickCreatures(1 / 60, 1.3e6 + k * (HBODY.gap + 1));
  return _PK.map(({ n, hg, rg }) => { const H = rg.hc; if (!H) return { n, hc: false }; hg.updateMatrixWorld(true); const by = H.C.byName;
    const a = by.spine0.getWorldPosition(new THREE.Vector3()), b = rg.B.hips.getWorldPosition(new THREE.Vector3()), box = new THREE.Box3(); for (const m of H.C.meshes) box.expandByObject(m);
    let bits = 0, bitTris = 0; H.C.root.traverse(o => { if (o.isMesh && !H.C.meshes.includes(o)) { bits++; const G = o.geometry; bitTris += (G.index ? G.index.count : G.attributes.position.count) / 3; } });
    return { n, hc: true, key: rg.hcKey, plan: H.C.g.plan, seed: H.C.g.seed, want: HC.hashKey(rg.hcKey), map: H.map.length, tris: H.C.stats.tris, hips: +a.distanceTo(b).toFixed(3), bones: H.C.skel.bones.length,
      hipY: +(a.y - hg.position.y).toFixed(3), man: +((box.max.y - hg.position.y) / SCALE.PEOPLE.gatelander.m).toFixed(2), packs: H.C.plan.parts.some(([p]) => p === 'packs'), bits, bitTris,
      toes: ['leg0L_4', 'leg0R_4', 'leg1L_4', 'leg1R_4'].map(t => +(by[t].getWorldPosition(new THREE.Vector3()).y - hg.position.y).toFixed(3)) }; }); });
console.log('  donkeys and the pack mule:', JSON.stringify(pack));
const [dk0, dk1, pm0, cm0] = pack;
check(`the donkey and the pack mule wear the kit's donkey and packmule (${pack.slice(0, 3).map(o => o.plan + ' ' + o.tris).join(', ')} triangles of hide), keyed burden:<key>; the packs ${pm0.bits - dk0.bits} more pieces, ${pm0.bitTris - dk0.bitTris} triangles`,
  pack.slice(0, 3).every(o => o.hc && o.map === 24 && o.seed === o.want && /^burden:/.test(o.key) && o.hips < .03) && dk0.plan === 'donkey' && dk1.plan === 'donkey' && !dk0.packs && pm0.plan === 'packmule' && pm0.packs
  && dk0.seed !== dk1.seed && pm0.bits > dk0.bits, pack);
check(`each stands on its hooves (${pack.map(o => o.toes.join(', ')).join('; ')} m), the donkey's hips at ${dk0.hipY} m and the pack mule's at ${pm0.hipY}; their tops at ${pack.map(o => o.man).join(', ')} of a man`,
  pack.every(o => o.toes.every(y => Math.abs(y) < .05)) && dk0.hipY < pm0.hipY * .85 && dk0.man > .5 && dk0.man < 1 && pm0.man > .75 && pm0.man < 1.3, pack);
// Session 2155 (L3, OG-046's caravans): the camel on the same path, the kit's own camel plan (its tail two bones, so 23 of the driver's joints
// drive it), its hips a head above the pack mule's and its head carried above a man's
const camel = await page.evaluate(() => { const { hg, rg } = _PK[3], H = rg.hc, by = H.C.byName; hg.updateMatrixWorld(true); const y = n => +(by[n].getWorldPosition(new THREE.Vector3()).y - hg.position.y).toFixed(3);
  const sp = Object.keys(by).filter(n => /^spine\d+$/.test(n)); return { spine: sp.map(y), hump: Math.max(...sp.map(y)), hip: y('spine0'), head: Object.keys(by).filter(n => /^head/.test(n)).map(y) }; });
console.log('  camel:', JSON.stringify(camel));
check(`the camel wears the kit's camel (${cm0.tris} triangles of hide, ${cm0.bones} bones, ${cm0.map} driven), keyed burden:<key>, on its hooves (${cm0.toes.join(', ')} m), its hips at ${cm0.hipY} m, its top at ${cm0.man} of a man`,
  cm0.hc && cm0.plan === 'camel' && cm0.map === 23 && cm0.seed === cm0.want && /^burden:/.test(cm0.key) && cm0.hips < .03 && cm0.toes.every(y => Math.abs(y) < .05) && cm0.hipY > pm0.hipY * 1.15 && cm0.man > 1 && cm0.man < 1.5, { cm0, camel });
{ const url = await page.evaluate(() => { const a = _PK[0].hg.position, b = _PK[3].hg.position, mx = (a.x + b.x) / 2, mz = (a.z + b.z) / 2, fx = -Math.sin(yaw), fz = -Math.cos(yaw);
    window._PKP = [px, pz]; px = mx - fx * 6; pz = mz - fz * 6; CAM.position.set(px, worldH(px, pz) + 1.5, pz); CAM.lookAt(mx, worldH(mx, mz) + .9, mz); CAM.updateMatrixWorld(true); const hid = _W.map(w => [w.e.mesh, w.e.mesh.visible]); for (const [m] of hid) m.visible = false;
    REN.render(scene, CAM); const u = REN.domElement.toDataURL('image/jpeg', .85); for (const [m, v] of hid) m.visible = v; return u; });
  fs.writeFileSync(path.join(OUT, 'f4-packbeasts.jpg'), Buffer.from(url.split(',')[1], 'base64')); }
{ const url = await page.evaluate(() => { const c = _PK[3].hg.position, fx = -Math.sin(yaw), fz = -Math.cos(yaw), ex = c.x + fx * 6.5, ez = c.z + fz * 6.5;
    CAM.position.set(ex, worldH(ex, ez) + 1.4, ez); CAM.lookAt(c.x, worldH(c.x, c.z) + 1.1, c.z); CAM.updateMatrixWorld(true); const hid = _W.map(w => [w.e.mesh, w.e.mesh.visible]); for (const [m] of hid) m.visible = false;
    REN.render(scene, CAM); const u = REN.domElement.toDataURL('image/jpeg', .85); for (const [m, v] of hid) m.visible = v; return u; });
  fs.writeFileSync(path.join(OUT, 'f4-camel.jpg'), Buffer.from(url.split(',')[1], 'base64')); }
// Session 2156 (L3, OG-046, the Mark's): the reindeer on the Elderstag's legs and the highland yak on the ox's, keyed burden:<key>, each on its
// hooves; the reindeer's head below a man's (its antlers are rigid pieces, not the hide), the yak's hips below the ox's (1.05 of the cow to its 1.15)
const mk = await page.evaluate(() => { const fx = -Math.sin(yaw), fz = -Math.cos(yaw), sx = -fz, sz = fx;
  window._MK = [['Reindeer', 'f4mk:0'], ['Highland Yak', 'f4mk:0']].map(([n, key], j) => { const hg = new THREE.Group(), rg = buildAnimal(n, key); hg.add(rg.root);
    const x = px - fx * 7 + sx * (j - .5) * 3, z = pz - fz * 7 + sz * (j - .5) * 3; hg.position.set(x, WORLD.worldH(x, z), z); hg.rotation.y = yaw + Math.PI / 2; WORLD.scene.add(hg); return { n, key, hg, rg }; });
  let k = 0; HBODY.last = -1e9; while (_MK.some(h => !h.rg.hc && !h.rg.hcFail) && k++ < 300) tickCreatures(1 / 60, 1.32e6 + k * (HBODY.gap + 1));
  return _MK.map(({ n, hg, rg }) => { const H = rg.hc; if (!H) return { n, hc: false }; hg.updateMatrixWorld(true); const by = H.C.byName;
    const a = by.spine0.getWorldPosition(new THREE.Vector3()), b = rg.B.hips.getWorldPosition(new THREE.Vector3()), box = new THREE.Box3(); for (const m of H.C.meshes) box.expandByObject(m);
    return { n, hc: true, key: rg.hcKey, plan: H.C.g.plan, seed: H.C.g.seed, want: HC.hashKey(rg.hcKey), map: H.map.length, tris: H.C.stats.tris, bones: H.C.skel.bones.length, hips: +a.distanceTo(b).toFixed(3),
      hipY: +(a.y - hg.position.y).toFixed(3), man: +((box.max.y - hg.position.y) / SCALE.PEOPLE.gatelander.m).toFixed(2),
      toes: ['leg0L_4', 'leg0R_4', 'leg1L_4', 'leg1R_4'].map(t => +(by[t].getWorldPosition(new THREE.Vector3()).y - hg.position.y).toFixed(3)) }; }); });
console.log('  the Mark\'s:', JSON.stringify(mk));
const [rd0, yk0] = mk;
check(`the reindeer and the highland yak wear the kit's reindeer and yak (${mk.map(o => o.plan + ' ' + o.tris + ' tris, ' + o.bones + ' bones, ' + o.map + ' driven').join('; ')}), keyed burden:<key>, on their hooves (${mk.map(o => o.toes.join(', ')).join('; ')} m)`,
  mk.every(o => o.hc && o.map >= 22 && o.seed === o.want && /^burden:/.test(o.key) && o.hips < .03 && o.toes.every(y => Math.abs(y) < .05)) && rd0.plan === 'reindeer' && yk0.plan === 'yak', mk);
check(`the reindeer's head at ${rd0.man} of a man, its hips at ${rd0.hipY} m; the yak's hips at ${yk0.hipY} m, below the ox's (${ox0.hipY})`,
  rd0.man > .7 && rd0.man < 1.1 && rd0.hipY > .9 && rd0.hipY < 1.3 && yk0.hipY < ox0.hipY && yk0.hipY > ox0.hipY * .85, mk);
// Session 2167: the reindeer's antlers in velvet, a mid brown a third thicker, so they read against snow (S2156's pale beam vanished)
const ant = await page.evaluate(() => { const out = []; _MK[0].hg.traverse(o => { if (o.isMesh && o.name === 'antler') { const c = o.material.color; o.geometry.computeBoundingBox(); const s = o.geometry.boundingBox.getSize(new THREE.Vector3());
  out.push({ lum: +(.2126 * c.r + .7152 * c.g + .0722 * c.b).toFixed(3), tris: (o.geometry.index ? o.geometry.index.count : o.geometry.attributes.position.count) / 3, h: +s.y.toFixed(3) }); } }); return out; });
console.log('  the reindeer\'s antlers:', JSON.stringify(ant));
check(`the reindeer carries two antlers (${ant.map(a => a.tris + ' tris, ' + a.h + ' m high').join('; ')}), brown, their colour's luminance ${ant.map(a => a.lum).join(', ')} under snow's by half`,
  ant.length === 2 && ant.every(a => a.lum < .4 && a.tris > 200 && a.h > .3), ant);
{ const url = await page.evaluate(() => { const a = _MK[0].hg.position, b = _MK[1].hg.position, mx = (a.x + b.x) / 2, mz = (a.z + b.z) / 2, fx = -Math.sin(yaw), fz = -Math.cos(yaw), ex = mx + fx * 6, ez = mz + fz * 6;
    CAM.position.set(ex, worldH(ex, ez) + 1.5, ez); CAM.lookAt(mx, worldH(mx, mz) + 1, mz); CAM.updateMatrixWorld(true); const hid = [..._W.map(w => w.e.mesh), ..._PK.map(h => h.hg)].map(m => [m, m.visible]); for (const [m] of hid) m.visible = false;
    REN.render(scene, CAM); const u = REN.domElement.toDataURL('image/jpeg', .85); for (const [m, v] of hid) m.visible = v; return u; });
  fs.writeFileSync(path.join(OUT, 'f4-markburden.jpg'), Buffer.from(url.split(',')[1], 'base64')); }
// Session 2164 (L3, OG-046): the giant goat, the kit's goat at 2.1 under a saddle, on the goat's legs, keyed burden:<key>, beside a farm goat;
// a mount's back: its hips about 2.1 times the goat's, under the kit's saddle
const gg = await page.evaluate(() => { const fx = -Math.sin(yaw), fz = -Math.cos(yaw), sx = -fz, sz = fx;
  window._GG = [['Giant Goat', 'f4gg:0'], ['Goat', 'f4gg:0']].map(([n, key], j) => { const hg = new THREE.Group(), rg = buildAnimal(n, key); hg.add(rg.root);
    const x = px - fx * 7 + sx * (j - .5) * 3, z = pz - fz * 7 + sz * (j - .5) * 3; hg.position.set(x, WORLD.worldH(x, z), z); hg.rotation.y = yaw + Math.PI / 2; WORLD.scene.add(hg); return { n, key, hg, rg }; });
  let k = 0; HBODY.last = -1e9; while (_GG.some(h => !h.rg.hc && !h.rg.hcFail) && k++ < 300) tickCreatures(1 / 60, 1.5e6 + k * (HBODY.gap + 1));
  return _GG.map(({ n, hg, rg }) => { const H = rg.hc; if (!H) return { n, hc: false }; hg.updateMatrixWorld(true); const by = H.C.byName;
    const a = by.spine0.getWorldPosition(new THREE.Vector3()), b = rg.B.hips.getWorldPosition(new THREE.Vector3()), box = new THREE.Box3(); for (const m of H.C.meshes) box.expandByObject(m);
    return { n, hc: true, key: rg.hcKey, plan: H.C.g.plan, seed: H.C.g.seed, want: HC.hashKey(rg.hcKey), map: H.map.length, tris: H.C.stats.tris, bones: H.C.skel.bones.length, hips: +a.distanceTo(b).toFixed(3),
      hipY: +(a.y - hg.position.y).toFixed(3), top: +(box.max.y - hg.position.y).toFixed(2), saddle: H.C.plan.parts.some(([p]) => p === 'saddle'),
      toes: ['leg0L_4', 'leg0R_4', 'leg1L_4', 'leg1R_4'].map(t => +(by[t].getWorldPosition(new THREE.Vector3()).y - hg.position.y).toFixed(3)) }; }); });
console.log('  the giant goat:', JSON.stringify(gg));
const [gg0, gt0] = gg;
check(`the giant goat wears the kit's giantgoat (${gg0.tris} tris, ${gg0.bones} bones, ${gg0.map} driven), keyed burden:<key>, on its hooves (${gg0.toes && gg0.toes.join(', ')} m), under its saddle, which the farm goat has not`,
  gg0.hc && gt0.hc && gg0.plan === 'giantgoat' && gg0.map >= 22 && gg0.seed === gg0.want && /^burden:/.test(gg0.key) && gg0.hips < .03 && gg0.toes.every(y => Math.abs(y) < .05) && gg0.saddle && !gt0.saddle, gg);
check(`its hips at ${gg0.hipY} m, ${(gg0.hipY / gt0.hipY).toFixed(2)} of the farm goat's ${gt0.hipY}; a mount's back, above a man's waist`,
  gg0.hipY / gt0.hipY > 1.8 && gg0.hipY / gt0.hipY < 2.4 && gg0.hipY > 1, gg);
{ const url = await page.evaluate(() => { const a = _GG[0].hg.position, b = _GG[1].hg.position, mx = (a.x + b.x) / 2, mz = (a.z + b.z) / 2, fx = -Math.sin(yaw), fz = -Math.cos(yaw), ex = mx + fx * 6, ez = mz + fz * 6;
    CAM.position.set(ex, worldH(ex, ez) + 1.5, ez); CAM.lookAt(mx, worldH(mx, mz) + 1, mz); CAM.updateMatrixWorld(true); const hid = [..._W.map(w => w.e.mesh), ..._PK.map(h => h.hg), ..._MK.map(h => h.hg)].map(m => [m, m.visible]); for (const [m] of hid) m.visible = false;
    REN.render(scene, CAM); const u = REN.domElement.toDataURL('image/jpeg', .85); for (const [m, v] of hid) m.visible = v; return u; });
  fs.writeFileSync(path.join(OUT, 'f4-giantgoat.jpg'), Buffer.from(url.split(',')[1], 'base64')); }
await page.evaluate(() => { for (const { hg } of _GG) hg.parent.remove(hg); });
await page.evaluate(() => { for (const { hg } of _MK) hg.parent.remove(hg); });
const pkWalk = await page.evaluate(() => { const { hg, rg } = _PK[2], H = rg.hc, by = H.C.byName, sk = H.C.skel; sk.update(); const a = Array.from(sk.boneMatrices); let low = 9;
  for (let i = 0; i < 120; i++) { hg.position.x += Math.sin(hg.rotation.y) * 1.2 / 60; hg.position.z += Math.cos(hg.rotation.y) * 1.2 / 60; hg.position.y = WORLD.worldH(hg.position.x, hg.position.z); tickCreatures(1 / 60, 1.4e6 + i * 16.7);
    if (i > 50) { hg.updateMatrixWorld(true); for (const t of ['leg0L_4', 'leg0R_4', 'leg1L_4', 'leg1R_4']) { const p = by[t].getWorldPosition(new THREE.Vector3()); low = Math.min(low, p.y - WORLD.worldH(p.x, p.z)); } } }
  sk.update(); const b = Array.from(sk.boneMatrices); let moved = 0; for (let i = 0; i < a.length; i++) moved = Math.max(moved, Math.abs(a[i] - b[i]));
  return { moved: +moved.toFixed(3), low: +low.toFixed(3), stand: +rg.w.stand.toFixed(2) }; });
check(`the pack mule walked 1.2 m/s: its bones move (by ${pkWalk.moved}) and its lowest hoof stays by the ground (${pkWalk.low} m)`, pkWalk.moved > .01 && pkWalk.stand < .2 && Math.abs(pkWalk.low) < .06, pkWalk);
await page.evaluate(() => { for (const { hg } of _PK) hg.parent.remove(hg); [px, pz] = _PKP; tickCreatures(1 / 60, 1.5e6); });

// the beasts by island (Session 1969, L3, OG-031): a foe made in the open world wears its island's coat, read at its home. The Mark's Snow
// Wolf is the kit's Stonefang (the Ironwolf's stone grey, darker than the white), its Cave Bear the kit's own Frostreach (paler than the
// brown), its Wolf the kit's colder coat; made at home each is as before
const isles = await page.evaluate(() => { let mk = null; for (let i = 0; i < 99 && !mk; i++) for (let j = 0; j < 99 && !mk; j++) if (nationKeyOf(i, j) === 'mark') mk = [i, j];
  const fx = -Math.sin(yaw), fz = -Math.cos(yaw), sx = -fz, sz = fx;
  const one = (n, j, mark) => { const x = px + fx * 20 + sx * (j - 2.5) * 3.4, z = pz + fz * 20 + sz * (j - 2.5) * 3.4;
    const e = keyFoe(buildZoneEnemy(WORLD.scene, [], x, z, n, null), 'f4isle:' + j); e.mesh.position.set(x, WORLD.worldH(x, z), z); if (!e.mesh.parent) WORLD.scene.add(e.mesh); e.mesh.visible = true;
    if (mark) { e.homeX = (mk[0] + .5) * SIZE; e.homeZ = (mk[1] + .5) * SIZE; }
    const rig = e.limbs.wolf; rig.e = e; return { n, mark, e, rig }; };
  const L = [['Snow Wolf', 0], ['Snow Wolf', 1], ['Cave Bear', 0], ['Cave Bear', 1], ['Wolf', 0], ['Wolf', 1]].map(([n, m], j) => one(n, j, !!m)); window._IS = L;
  CAM.position.set(px, worldH(px, pz) + 1.65, pz); CAM.updateMatrixWorld(true);
  let k = 0; HBODY.last = -1e9; while (L.some(f => !f.rig.hc && !f.rig.hcFail) && k++ < 200) tickCreatures(1 / 60, 1.1e6 + k * (HBODY.gap + 1));
  const lum = H => { const c = H.C.meshes[0].geometry.attributes.color; let s = 0; for (let v = 0; v < c.count; v++) s += .2126 * c.getX(v) + .7152 * c.getY(v) + .0722 * c.getZ(v); return +(s / c.count).toFixed(3); };
  const out = L.map(({ n, mark, e, rig }) => { const H = rig.hc; return H ? { n, mark, isle: H.C.g.island || null, home: nationKeyOf(...cellOf(e.homeX, e.homeZ)), plan: H.C.g.plan, seed: H.C.g.seed, want: HC.hashKey('wolf:' + e.id), L: lum(H) } : { n, mark, hc: false }; });
  for (const { e } of L) { e.dead = true; if (e.mesh.parent) e.mesh.parent.remove(e.mesh); } tickCreatures(1 / 60, 1.2e6); return { mk, out }; });
console.log('  by island:', JSON.stringify(isles));
{ const [sw0, sw1, cb0, cb1, w0, w1] = isles.out;
  check(`on the Mark the Snow Wolf wears the Stonefang's grey (${sw1.L} against ${sw0.L} at home) and the Cave Bear the Frostreach's pale (${cb1.L} against ${cb0.L}), the Wolf the kit's colder coat (${w1.L} against ${w0.L})`,
    isles.out.every(w => w.plan && w.seed === w.want) && [sw1, cb1, w1].every(w => w.isle === 'mark' && w.home === 'mark') && [sw0, cb0, w0].every(w => w.isle === null && w.home !== 'mark')
    && sw1.L < sw0.L - .25 && cb1.L > cb0.L + .3 && w1.L > w0.L + .05, isles); }

// the pictures: the line from 7 m, then the bear from 4 m
// Session 2148: each a frame drawn and read back from the canvas (f4animals' way, S1745); Playwright's screenshot waited on the live loop's
// queue of frames and ran past 120 s on both tries here
const shoot = async (file) => { const url = await page.evaluate(() => { const fx = -Math.sin(yaw), fz = -Math.cos(yaw); CAM.position.set(px, worldH(px, pz) + 1.65, pz);
  CAM.rotation.order = 'YXZ'; CAM.rotation.set(pitch, yaw, 0); CAM.updateMatrixWorld(true); REN.render(scene, CAM); return REN.domElement.toDataURL('image/jpeg', .85); });
  fs.writeFileSync(path.join(OUT, file), Buffer.from(url.split(',')[1], 'base64')); };
await page.evaluate(() => { const a = _W[0].e, b = _W[2].e, mx = (a.x + b.x) / 2, mz = (a.z + b.z) / 2, fx = -Math.sin(yaw), fz = -Math.cos(yaw); px = mx - fx * 7; pz = mz - fz * 7; pitch = -.12; });
for (let i = 0; i < 8; i++) { await page.evaluate(() => tickCreatures(1 / 60, performance.now())); await g.frames(1); }
await shoot('f4-beasts.jpg');
await page.evaluate(() => { const f = _W[1].e; const fx = -Math.sin(yaw), fz = -Math.cos(yaw); px = f.x - fx * 4; pz = f.z - fz * 4; pitch = -.2; });
for (let i = 0; i < 6; i++) { await page.evaluate(() => tickCreatures(1 / 60, performance.now())); await g.frames(1); }
await shoot('f4-beasts-near.jpg');

const dead = await page.evaluate(() => { const f = _W[0], rig = f.rig, before = []; rig.hc.W.traverse(o => { if (o.isMesh) before.push([o, o.material]); });
  f.e.hp = 0; killZoneEnemy(f.e, WORLD.scene, '');
  for (let i = 0; i < 120; i++) { tickPeople(1 / 60, 7e5 + i * 16.7); tickCreatures(1 / 60, 7e5 + i * 16.7); }
  rig.root.parent.updateMatrixWorld(true); const a = rig.hc.C.byName.spine0.getWorldPosition(new THREE.Vector3()), b = rig.B.hips.getWorldPosition(new THREE.Vector3());
  const shaded = before.filter(([o, m]) => m.onBeforeCompile !== THREE.Material.prototype.onBeforeCompile);
  return { cloned: before.filter(([o, m]) => o.material !== m).length, n: before.length, shaded: shaded.length, kept: shaded.filter(([o, m]) => o.material.onBeforeCompile === m.onBeforeCompile).length,
    darker: before.filter(([o, m]) => o.material !== m && o.material.color && o.material.color.r <= m.color.r * .36 + 1e-6).length, hips: +(a.y - WORLD.worldH(a.x, a.z)).toFixed(2), gap: +a.distanceTo(b).toFixed(3), dead: !!f.e.dead }; });
check('killed, the kit\'s body is darkened with its shaders kept, and lies with its driver', dead.dead && dead.cloned === dead.n && dead.shaded > 0 && dead.kept === dead.shaded && dead.darker === dead.n && dead.gap < .05, dead);
// Session 1348: the dragon, the last family on the old body, wears the kit's dragon over the same driver. Its wings fold along the back
// at the plan's rest and rise and beat once roused (the driver's rig.wing and rig.flap); its tail is the kit's own, carried, with the
// driver's sway spread over its ten joints
const drag = await page.evaluate(() => { const fx = -Math.sin(yaw), fz = -Math.cos(yaw), x = px + fx * 14, z = pz + fz * 14;
  const w = buildWolf('Dragon', WOLF_KINDS.Dragon.world), G = new THREE.Group(); G.add(w.root); G.position.set(x, WORLD.worldH(x, z), z); scene.add(G);
  const e = { x, z, dead: false, alert: false, id: 'f4drag:0' }; w.e = e;
  let k = 0, t = 7e5; HBODY.last = -1e9; while (!w.hc && !w.hcFail && k++ < 200) tickCreatures(1 / 60, t += HBODY.gap + 1);
  const H = w.hc; if (!H) return { none: true, fail: !!w.hcFail };
  const by = H.C.byName, at = n => { G.updateMatrixWorld(true); return w.root.worldToLocal((by[n] || n).getWorldPosition(new THREE.Vector3())); }, wr = H.wings[0].arm[2];
  for (let i = 0; i < 60; i++) tickCreatures(1 / 60, t += 17);
  const hipY = at('spine0').y, tails = Object.keys(by).filter(n => /^tail\d+$/.test(n)), tip = at(tails[tails.length - 1]).y, calm = at(wr).y;
  e.alert = true; let top = -9, bot = 9; for (let i = 0; i < 150; i++) { tickCreatures(1 / 60, t += 17); if (i > 90) { const y = at(wr).y; top = Math.max(top, y); bot = Math.min(bot, y); } }
  const a = by.spine0.getWorldPosition(new THREE.Vector3()), b = w.B.hips.getWorldPosition(new THREE.Vector3()); scene.remove(G); tickCreatures(1 / 60, t += 17);
  const f = v => +v.toFixed(2);
  return { plan: H.C.g.plan, bones: H.C.bones.length, tris: H.C.stats.tris, wings: H.wings.length, tails: tails.length, mapTail: H.map.some(([j]) => /^tail/.test(j)), hips: f(a.distanceTo(b)),
    hipY: f(hipY), tip: f(tip), calm: f(calm), top: f(top), beat: f(top - bot), dropped: !w.hc }; });
console.log('  dragon:', JSON.stringify(drag));
check(`the dragon wears the kit's dragon (${drag.bones} bones, ${drag.tris} triangles), its hips at the driver's (${drag.hips} m); gone from the scene, it is dropped`,
  drag.plan === 'game:Dragon' && drag.bones > 60 && drag.tris < 25000 && drag.hips < .03 && drag.dropped, drag);
check(`its wings fold on the back at rest (the wrist ${drag.calm} up) and, roused, rise (to ${drag.top}) and beat (${drag.beat}); its tail, the kit's own, is carried (its tip ${drag.tip} up, the hips ${drag.hipY})`,
  drag.wings === 2 && drag.top > drag.calm && drag.beat > .1 * drag.hipY && !drag.mapTail && drag.tip > .25 * drag.hipY, drag);
await page.evaluate(() => { REN.render(scene, CAM); });
check('no page errors', g.errs.length === 0, g.errs.slice(0, 3));
await g.close();
