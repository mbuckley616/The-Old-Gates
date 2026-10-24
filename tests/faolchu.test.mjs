// The Faolchú on the shape kit (Session 211, Michael's answer on Session 201's prototype: "great as is"): the Dire Wolf's
// skinned body hunched, two pairs of clawed arms from a red seam down its spine, orange sigil-script on its flanks,
// at the old box's size; the seam still takes the phases' colour and the death burst still finds the sigils.
import { boot, check } from './lib/game.mjs';
import fs from 'fs';
const g = await boot(); const { page } = g;
await g.intoWorld();
fs.mkdirSync('tests/out', { recursive: true });

const r = await page.evaluate(() => { const fx = -Math.sin(yaw), fz = -Math.cos(yaw); const x = px + fx * 12, z = pz + fz * 12;
  const out = {}; const { g: G, limbs } = buildFaolchuMesh(BOSSES.Faolchu); G.position.set(x, WORLD.worldH(x, z), z); WORLD.scene.add(G); window._F = { G, limbs };
  const w = limbs.wolf; out.skinned = !!(w && w.mesh.isSkinnedMesh); out.torso = limbs.torso === (w && w.mesh); out.inRigs = WOLF_RIGS.has(w);
  out.sigils = limbs.sigilMeshes.length; out.arms = !!(limbs.backArmL && limbs.backArmR); out.onBones = limbs.sigilMeshes.every(m => m.parent && (m.parent.isBone || m.parent.parent));
  const e = { x, z, dead: false, alert: true }; w.e = e; let t = 4e5; for (let k = 0; k < 30; k++) tickCreatures(1 / 60, t += 16.7);
  const plain = buildWolf('Dire Wolf', 1), PG = new THREE.Group(); PG.add(plain.root); PG.position.set(x + 4, WORLD.worldH(x, z), z); WORLD.scene.add(PG); plain.e = { x: x + 4, z, dead: false }; plain.t0 = w.t0; // S233 — the same breathing phase: each rig's random t0 moved the neck ±.04 and made the comparison flaky
  for (let k = 0; k < 30; k++) tickCreatures(1 / 60, t += 16.7); out.hunch = +(w.B.neck.rotation.x - plain.B.neck.rotation.x).toFixed(2); WORLD.scene.remove(PG);
  G.updateMatrixWorld(true); const bb = new THREE.Box3().setFromObject(w.mesh); out.tall = +(bb.max.y - bb.min.y).toFixed(2); out.long = +(bb.max.z - bb.min.z).toFixed(2);
  // it strides by its own position
  for (let k = 0; k < 120; k++) { e.x += 3 / 60; G.position.x = e.x; tickCreatures(1 / 60, t += 16.7); } out.moving = +(w.w.trot + w.w.gallop).toFixed(2);
  // the phases recolour the seam; the death burst reads the sigils' positions
  limbs.sigilTrace.color.setRGB(1, .85, .6); out.recolour = limbs.sigilMeshes[0].material.color.g > .8;
  try { spawnFaolchuDeathBurst({ limbs, mesh: G, x: e.x, z: e.z }, WORLD.scene); out.burst = true; } catch (err) { out.burst = String(err); }
  const L = buildFaolchuMesh({ ...BOSSES.Faolchu, scale: 1.1 }); out.lesser = !!L.limbs.wolf; L.g.parent && L.g.parent.remove(L.g);
  return out; });
check('the Faolchú is the dire wolf\'s skinned body, in the rig set, its own material lit by the wind-up', r.skinned && r.torso && r.inRigs, r);
check('two pairs of arms, and a seam and sigils hung on the bones, unlit', r.arms && r.sigils >= 20 && r.onBones, r);
check('hunched: the neck carried .35 lower than a dire wolf\'s in the same pose', Math.abs(r.hunch - .35) < .02, r);
check('about the old box\'s size (its ears topped out near 1.7; about 3 from nose to tail)', r.tall > 1.5 && r.tall < 2.1 && r.long > 2.5 && r.long < 4, r);
check('it strides by its own position', r.moving > .9, r);
check('the phases still recolour the seam and the death burst still finds the sigils; the lesser ones build too', r.recolour && r.burst === true && r.lesser, r);

// the photograph: a bandit for scale beside the Faolchú, from the side
const shot = await page.evaluate(() => { forceTime(12); const cv = REN.domElement, sc = WORLD.scene; const bx = px + 300, bz = pz, y = WORLD.worldH(bx, bz) + 60;
  const cam = new THREE.PerspectiveCamera(30, cv.width / cv.height, .05, 100);
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(20, 12), new THREE.MeshLambertMaterial({ color: 0x4a4038 })); floor.rotation.x = -Math.PI / 2; floor.position.set(bx, y, bz); sc.add(floor);
  const man = buildFoe('Bandit', 1, 2); PEOPLE_RIGS.delete(man); man.root.position.set(bx - 2.6, y, bz); man.root.rotation.y = .4; sc.add(man.root); pwApply(man, pwIdle(1, { holds: man.holds, gear: man.g.gear }));
  const { g: G, limbs } = buildFaolchuMesh(BOSSES.Faolchu); G.position.set(bx + .6, y, bz); G.rotation.y = Math.PI / 2 + .45; sc.add(G);
  limbs.wolf.e = { x: G.position.x, z: G.position.z, dead: false }; let t = 5e5; for (let k = 0; k < 20; k++) tickCreatures(1 / 60, t += 16.7);
  cam.position.set(bx, y + 1.8, bz + 8.5); cam.lookAt(bx, y + .8, bz); sc.updateMatrixWorld(true); REN.render(sc, cam);
  const o = document.createElement('canvas'); o.width = cv.width; o.height = cv.height; o.getContext('2d').drawImage(cv, 0, 0);
  sc.remove(man.root); sc.remove(G); sc.remove(floor); return o.toDataURL(); });
fs.writeFileSync('tests/out/faolchu.png', Buffer.from(shot.split(',')[1], 'base64'));

// Session 1342 (card F4): on the new look the creature kit's own Faolchú dresses it, driven by the same rig. Its two pairs of arms come
// from the seam, the seam takes the phases' colour, and the kit's body is not hunched twice (the plan has its own arch)
const kit = await page.evaluate(() => { forceTime(12); { const t1 = performance.now(); while (JOBS.length && performance.now() - t1 < 20000) runJobs(); }
  const fx = -Math.sin(yaw), fz = -Math.cos(yaw), x = px + fx * 9, z = pz + fz * 9;
  const { g: G, limbs } = buildFaolchuMesh(BOSSES.Faolchu); G.position.set(x, WORLD.worldH(x, z), z); WORLD.scene.add(G);
  const w = limbs.wolf, e = { x, z, dead: false, alert: true, id: 'f4faol:0' }; w.e = e;
  CAM.position.set(px, worldH(px, pz) + 1.65, pz); CAM.updateMatrixWorld(true);
  let k = 0, t = 9e5; HBODY.last = -1e9; while (!w.hc && !w.hcFail && k++ < 100) tickCreatures(1 / 60, t += HBODY.gap + 1);
  const H = w.hc; if (!H) return { ok: hcOk(w), fail: !!w.hcFail };
  G.updateMatrixWorld(true); const a = H.C.byName.spine0.getWorldPosition(new THREE.Vector3()), b = w.B.hips.getWorldPosition(new THREE.Vector3());
  const neck = w.B.neck.rotation.x; hcPose(w); const kept = Math.abs(w.B.neck.rotation.x - neck) < 1e-6;
  limbs.sigilTrace.color.setRGB(1, .85, .6); tickCreatures(1 / 60, t += 17); const flare = H.glow.map(u => u.value.toArray().map(v => +v.toFixed(2)));
  limbs.sigilTrace.color.setRGB(1, .1, .04); tickCreatures(1 / 60, t += 17);
  const L = buildFaolchuMesh({ ...BOSSES.Faolchu, scale: 1.1 }); const lesser = hcOk(L.limbs.wolf);
  WORLD.scene.remove(G); tickCreatures(1 / 60, t += 17);
  return { plan: H.C.g.plan, bones: H.C.bones.length, tris: H.C.stats.tris, ms: Math.round(HC_BODY.ms / Math.max(1, HC_BODY.n)), map: H.map.length, unhunch: H.unhunch, kept,
    arms: Object.keys(H.C.byName).filter(n => /^arm\d[LR]_0$/.test(n)).length, hips: +a.distanceTo(b).toFixed(3), glow: H.glow.length, flare, lesser, dropped: !w.hc }; });
console.log('  kit:', JSON.stringify(kit));
check(`new look: the kit's own Faolchú dresses it (${kit.bones} bones, ${kit.tris} triangles), its hips at the driver's (${kit.hips} m), all ${kit.map} joints copied`,
  kit.plan === 'game:Faolchú' && kit.bones > 40 && kit.map === 24 && kit.hips < .03, kit);
check('its two pairs of arms come out of its back; the driver keeps its hunch while the kit, arched by its plan, is not hunched again',
  kit.arms === 4 && kit.unhunch && kit.kept, kit);
check(`the phases recolour the kit's seam (the flare: ${JSON.stringify(kit.flare)}); the lesser Faolchú is dressed too; and gone from the scene, it is dropped`,
  kit.glow === 1 && Math.abs(kit.flare[0][1] - 2.72) < .02 && kit.lesser && kit.dropped, kit);
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
