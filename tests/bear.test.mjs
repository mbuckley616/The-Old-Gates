// The Cave Bear on the wolf's bones (Session 223, Michael's answer B on Session 214: "as shown"): a heavy shaggy barrel with
// a shoulder hump, thick legs on broad clawed paws, a round head with a short muzzle and round ears, the tail a stub. It
// walks on the wolf's gait and keeps the brute's numbers.
import { boot, check } from './lib/game.mjs';
import fs from 'fs';
const g = await boot(); const { page } = g;
await g.intoWorld();
fs.mkdirSync('tests/out', { recursive: true });

const built = await page.evaluate(() => { const fx = -Math.sin(yaw), fz = -Math.cos(yaw); window._T = {}; const out = {};
  ['Cave Bear', 'Dire Wolf', 'Boar'].forEach((n, i) => { const x = px + fx * 30 + (i - 1) * 3, z = pz + fz * 30;
    const e = buildZoneEnemy(WORLD.scene, [], x, z, n, null); e.mesh.position.y = WORLD.worldH(x, z); e.locked = false; e.mesh.visible = true; if (!e.mesh.parent) WORLD.scene.add(e.mesh); _T[n] = e; const w = e.limbs && e.limbs.wolf;
    e.mesh.updateMatrixWorld(true); const bb = w ? new THREE.Box3().setFromObject(w.mesh) : null; let boxes = 0; e.mesh.traverse(o => { if (o.isMesh && o.geometry && o.geometry.type === 'BoxGeometry') boxes++; });
    out[n] = w ? { rig: true, skinned: w.mesh.isSkinnedMesh, linked: w.e === e, inRigs: WOLF_RIGS.has(w), bear: !!w.k.bear, tall: +(bb.max.y - bb.min.y).toFixed(2), wide: +(bb.max.x - bb.min.x).toFixed(2), long: +(bb.max.z - bb.min.z).toFixed(2), tris: w.tris, shape: e.shape, hp: e.maxHp, boxes } : { rig: false, boxes }; });
  return out; });
const B = built['Cave Bear'];
check('the cave bear is one skinned mesh on the wolf\'s bones, linked to its enemy, still a brute with its numbers, no box left', B.rig && B.skinned && B.linked && B.inRigs && B.bear && B.shape === 'brute' && B.boxes === 0, B);
check('a cave bear is taller, wider and heavier than a dire wolf and a boar', B.tall > built['Dire Wolf'].tall && B.wide > built['Dire Wolf'].wide * 1.3 && B.tall > built.Boar.tall * 1.5, built);

const move = await page.evaluate(() => { const e = _T['Cave Bear'], w = e.limbs.wolf, G = e.mesh; let t = 3e5;
  const drive = (pace, n) => { for (let i = 0; i < n; i++) { e.x += pace / 60; G.position.set(e.x, WORLD.worldH(e.x, e.z), e.z); t += 16.7; tickCreatures(1 / 60, t); } return { stand: +w.w.stand.toFixed(2), trot: +w.w.trot.toFixed(2), gallop: +w.w.gallop.toFixed(2) }; };
  return { still: drive(0, 60), chase: drive(1.1, 150) }; });
check('a cave bear stands still, and walks on the wolf\'s gait when it chases', move.still.stand > .9 && move.chase.trot + move.chase.gallop > .9, move);

// the photograph: a bandit for scale, two bears (one walking), a dire wolf
const shot = await page.evaluate(() => { forceTime(12); const cv = REN.domElement, sc = WORLD.scene; const bx = px + 300, bz = pz, y = WORLD.worldH(bx, bz) + 60;
  const cam = new THREE.PerspectiveCamera(30, cv.width / cv.height, .05, 100);
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(16, 10), new THREE.MeshLambertMaterial({ color: 0x5a6040 })); floor.rotation.x = -Math.PI / 2; floor.position.set(bx, y, bz); sc.add(floor);
  const objs = [floor]; const bd = buildFoe('Bandit', 3, 3); PEOPLE_RIGS.delete(bd); pwApply(bd, pwIdle(1, { holds: bd.holds, gear: bd.g.gear })); bd.root.position.set(bx - 2.6, y, bz); bd.root.rotation.y = .35; sc.add(bd.root); objs.push(bd.root);
  [['Cave Bear', 1.35, -.9, .6, 0], ['Cave Bear', 1.35, 1.1, Math.PI / 2, 1], ['Dire Wolf', .95, 2.9, .4, 0]].forEach(([n, s, x, ry, walk]) => { const w = buildWolf(n, s); WOLF_RIGS.delete(w); w.root.position.set(bx + x, y, bz); w.root.rotation.y = ry; sc.add(w.root); objs.push(w.root);
    wgApply(w, walk ? wgStride(WG.TROT, .3, 1, false) : wgStand(1)); });
  cam.position.set(bx, y + 1.3, bz + 6.6); cam.lookAt(bx, y + .55, bz); sc.updateMatrixWorld(true); REN.render(sc, cam);
  const o = document.createElement('canvas'); o.width = cv.width; o.height = cv.height; o.getContext('2d').drawImage(cv, 0, 0); objs.forEach(x => sc.remove(x)); return o.toDataURL(); });
fs.writeFileSync('tests/out/bear.png', Buffer.from(shot.split(',')[1], 'base64'));
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
