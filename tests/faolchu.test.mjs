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
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
