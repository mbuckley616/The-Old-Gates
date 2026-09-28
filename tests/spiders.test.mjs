// The spider on the shape kit (Session 169): one skinned mesh, eight legs placed by IK with the knee up, walking on
// alternating tetrapods with the planted feet still, rearing to strike, curling up dead.
import { boot, check } from './lib/game.mjs';
import fs from 'fs';
const g = await boot(); const { page } = g;
await g.intoWorld();
fs.mkdirSync('tests/out', { recursive: true });

const built = await page.evaluate(() => { const fx = -Math.sin(yaw), fz = -Math.cos(yaw); const x = px + fx * 40, z = pz + fz * 40;
  const e = buildZoneEnemy(WORLD.scene, [], x, z, 'Spider', null); e.mesh.position.y = WORLD.worldH(x, z); e.locked = false; e.mesh.visible = true; window._S = e;
  const e2 = buildZoneEnemy(WORLD.scene, [], x + 3, z, 'Spider', null); window._S2 = e2; const r = e.limbs.wolf;
  let meshes = 0; e.mesh.traverse(c => { if (c.isMesh && !(c.userData && c.userData.hpBar)) meshes++; });
  // S224: the Sand Scorpion is on the spider's kit now (tests/scorpion.test.mjs); the Bog Crawler still keeps its own body
  const sc = buildZoneEnemy(WORLD.scene, [], x - 3, z, 'Bog Crawler', null); const scorp = !(sc.limbs && sc.limbs.wolf); sc.mesh.parent.remove(sc.mesh);
  return { spider: !!r && r.spider, skinned: r.mesh.isSkinnedMesh, bones: r.mesh.skeleton.bones.length, meshes, tris: r.tris, trisLo: r.trisLo, shared: r.mesh.geometry === e2.limbs.wolf.mesh.geometry, ownMat: r.mesh.material !== e2.limbs.wolf.mesh.material, scorpionUnchanged: scorp }; });
check('the spider is one skinned mesh on 28 bones plus its shining eyes, shared by its kind with its own material; the bog crawler keeps its body',
  built.spider && built.skinned && built.bones === 28 && built.meshes === 2 && built.shared && built.ownMat && built.scorpionUnchanged && built.tris > 2500 && built.tris < 8000 && built.trisLo < built.tris * .65, built);

// drive it along its facing; each foot in its stance (by the stride's own phase) must not move
const drive = (pace, n) => page.evaluate(([pace, n]) => { const e = _S, rig = e.limbs.wolf, G = e.mesh; const fy = .4; G.rotation.set(0, fy, 0); const step = pace / 60;
  const feet = SPIDER_FEET.map(L => rig.B['tib' + L.n]); const tip = SPIDER_FEET.map(L => SPIDER_LEGS[L.i][4]); const v = new THREE.Vector3(); let t0 = 2e5 + (window._st || 0); window._st = (window._st || 0) + n * 17;
  const pos = () => feet.map((b, k) => v.set(tip[k], 0, 0).applyMatrix4(b.matrixWorld).clone());
  let prev = null, pph = 0, still = 0, swing = 0, cnt = 0, grounded = [1e9, -1e9];
  for (let i = 1; i <= n; i++) { e.x += Math.sin(fy) * step; e.z += Math.cos(fy) * step; G.position.set(e.x, WORLD.worldH(e.x, e.z), e.z); tickCreatures(1 / 60, t0 + i * 16.7); G.updateMatrixWorld(true);
    const cur = pos(); if (i > n - 90 && prev) { for (let k = 0; k < 8; k++) { const Gd = rig.run ? SG.RUN.D : SG.D; const a = ((rig.phase + .5 * SG.group(k)) % 1 + 1) % 1, b = ((pph + .5 * SG.group(k)) % 1 + 1) % 1; const d = cur[k].distanceTo(prev[k]); swing = Math.max(swing, d);
        if (a < Gd && b < Gd && a > b) { still = Math.max(still, d); const y = cur[k].y - G.position.y; grounded = [Math.min(grounded[0], y), Math.max(grounded[1], y)]; } } cnt++; }
    prev = cur; pph = rig.phase; }
  return { pace, run: rig.run, w: +(rig.run ? rig.w.run : rig.w.walk).toFixed(2), stillMm: +(still * 1000).toFixed(2), swingMm: +(swing * 1000).toFixed(1), plantedYmm: grounded.map(y => +(y * 1000).toFixed(1)), strides: +(pace / (sgCycle(rig.w) * rig.root.scale.x)).toFixed(2) }; }, [pace, n]);
const wander = await drive(.42, 150), chase = await drive(1.75, 150);
check('walking (its wander) and running at it (its chase, a longer stride), the planted feet stay put and sit on the ground', !wander.run && chase.run && chase.strides < 6 && wander.w > .95 && chase.w > .95 && wander.stillMm < 1 && chase.stillMm < 1.5 && chase.swingMm > 20 && Math.abs(wander.plantedYmm[0]) < 3 && Math.abs(chase.plantedYmm[1]) < 3, { wander, chase });

// the reach: every foot target through the stride and the attack is within the leg's length
const reach = await page.evaluate(() => { let worst = 0; const check1 = (feet, drop) => SPIDER_FEET.forEach((L, k) => { const f = feet[k], lg = SPIDER_LEGS[L.i]; const dx = L.fx + f[0] - L.hx, dz = L.fz + f[2] - L.hz, dy = -SPIDER_H + drop + f[1]; worst = Math.max(worst, Math.hypot(dx, dy, dz) / (lg[3] + lg[4])); });
  for (const G of [SG, SG.RUN]) for (let q = 0; q < 200; q++) { const ph = q / 200, h = G.S / 2; check1(SPIDER_FEET.map((L, k) => { const u = ((ph + .5 * SG.group(k)) % 1 + 1) % 1; if (u < G.D) return [0, 0, h - G.S * u / G.D]; const s = (u - G.D) / (1 - G.D); return [0, G.LIFT * Math.sin(Math.PI * s), -h + G.S * s * s * (3 - 2 * s)]; }), G === SG ? .006 : .024); }
  return { worstReach: +worst.toFixed(3) }; });
check('the legs are never asked past their length', reach.worstReach < 1, reach);

// the attack rears the front legs and spreads the fangs; dead, the legs curl in under it
const atk = await page.evaluate(() => { const e = _S, rig = e.limbs.wolf, G = e.mesh; const v = new THREE.Vector3(); const t = 3e5; G.rotation.set(0, 0, 0);
  const tipY = n => { const b = rig.B['tib' + n]; G.updateMatrixWorld(true); return +(v.set(SPIDER_LEGS[+n[1]][4], 0, 0).applyMatrix4(b.matrixWorld).y - G.position.y).toFixed(3); };
  for (let i = 0; i < 40; i++) tickCreatures(1 / 60, t); const rest = { L0: tipY('L0'), L3: tipY('L3'), fang: +rig.B.fangL.rotation.z.toFixed(2) };
  e._wind = 1; tickCreatures(1 / 60, t); const wind = { L0: tipY('L0'), L3: tipY('L3'), fang: +rig.B.fangL.rotation.z.toFixed(2) }; e._wind = 0; tickCreatures(1 / 60, t);
  e.dead = true; tickCreatures(1 / 60, t); const dead = { posed: rig.deadPosed, L0: tipY('L0'), tib: +rig.B.tibL0.rotation.z.toFixed(2) };
  return { rest, wind, dead }; });
check('winding up, the front legs rise off the ground and the fangs spread; the hind legs stay down; dead, the legs curl under',
  atk.wind.L0 > atk.rest.L0 + .08 && Math.abs(atk.wind.L3 - atk.rest.L3) < .02 && atk.wind.fang > atk.rest.fang + .2 && atk.dead.posed && atk.dead.tib < -2, atk);

// the photograph: a spider three-quarter, and side on through the stride and the rear
const shot = await page.evaluate(() => { forceTime(12); const cv = REN.domElement, sc = WORLD.scene; const bx = px + 300, bz = pz, y = WORLD.worldH(bx, bz) + 60;
  const out = document.createElement('canvas'); out.width = 1280; out.height = 720; const x2 = out.getContext('2d'); const cam = new THREE.PerspectiveCamera(30, cv.width / cv.height, .05, 100);
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(12, 12), new THREE.MeshLambertMaterial({ color: 0x6a7a48 })); floor.rotation.x = -Math.PI / 2; floor.position.set(bx, y, bz); floor.receiveShadow = true; sc.add(floor);
  const rigs = []; const make = (x, z, ry, P) => { const r = buildSpider('Spider', 1); const G = new THREE.Group(); G.add(r.root); G.position.set(bx + x, y, bz + z); G.rotation.y = ry; sc.add(G); sgApply(r, P); rigs.push(G); return r; };
  make(-.6, 0, .6, sgStand(1)); make(.7, 0, -.5, sgAttack(1, 0, sgStand(1)));
  cam.position.set(bx, y + 1.1, bz + 2.4); cam.lookAt(bx, y + .15, bz); sc.updateMatrixWorld(true); REN.render(sc, cam); x2.drawImage(cv, 0, cv.height / 4, cv.width, cv.height / 2, 0, 0, 1280, 360);
  rigs.splice(0).forEach(G => sc.remove(G));
  [0, .25, .5, .75].forEach((ph, i) => make(-1.5 + i * 1, 0, Math.PI / 2, sgStride(ph, 0, i < 2 ? SG : SG.RUN)));
  cam.position.set(bx, y + .5, bz + 3.2); cam.lookAt(bx, y + .15, bz); sc.updateMatrixWorld(true); REN.render(sc, cam); x2.drawImage(cv, 0, cv.height / 4, cv.width, cv.height / 2, 0, 360, 1280, 360);
  rigs.forEach(G => sc.remove(G)); sc.remove(floor); tickCreatures(1 / 60, 7e5); return out.toDataURL(); });
fs.writeFileSync('tests/out/spiders.png', Buffer.from(shot.split(',')[1], 'base64'));
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
