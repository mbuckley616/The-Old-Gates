// Card F4 (Session 1404): on the new look the risen dead (S173), the Hollowed and the Ghoul, wear the builder's body, as the hag (S1389)
// does: old and wasted, barefoot in a grave's drab tunic and trousers, their skin rotted in the builder's shader (people.js's rot, S1403;
// .7 and 1), and the driver's burning eyes laid over the builder's own eyes (hbEyeGlow). Picture: docs/prototypes/f4/f4-dead.jpg.
import { boot, check, ROOT } from './lib/game.mjs';
import fs from 'fs'; import path from 'path';
const OUT = path.join(ROOT, 'docs', 'prototypes', 'f4'); fs.mkdirSync(OUT, { recursive: true });

const KINDS = ['Hollowed', 'Bandit', 'Ghoul'];
const g = await boot({ look: 'new' }); const { page } = g;
await g.intoWorld();

const made = await page.evaluate((KINDS) => { forceTime(12);
  { const t1 = performance.now(); while (JOBS.length && performance.now() - t1 < 20000) runJobs(); }
  const fx = -Math.sin(yaw), fz = -Math.cos(yaw), sx = -fz, sz = fx;
  const clear = (x, z) => { for (let dx = -2; dx <= 2; dx += .5) for (let dz = -2; dz <= 2; dz += .5) if (WORLD.solidAt(x + dx, z + dz)) return false; return true; };
  let d = 6; for (; d < 60; d += 3) { let ok = true; for (let i = 0; i < KINDS.length; i++) if (!clear(px + fx * d + sx * (i - 1) * 2.2, pz + fz * d + sz * (i - 1) * 2.2)) { ok = false; break; } if (ok) break; }
  window._F = KINDS.map((n, i) => { const x = px + fx * d + sx * (i - 1) * 2.2, z = pz + fz * d + sz * (i - 1) * 2.2;
    const e = keyFoe(buildZoneEnemy(WORLD.scene, [], x, z, n, null), 'f4dead:' + i); e.mesh.position.set(x, WORLD.worldH(x, z), z); e.mesh.rotation.y = Math.atan2(px - x, pz - z); e.combatYaw = e.mesh.rotation.y;
    e.locked = false; e.mesh.visible = true; if (!e.mesh.parent) WORLD.scene.add(e.mesh); const rig = e.limbs && e.limbs.person; if (rig) rig.e = e; return { n, e, rig }; });
  CAM.position.set(px, worldH(px, pz) + 1.65, pz); CAM.updateMatrixWorld(true);
  const want = () => _F.filter(f => f.rig && HB_RIGS.has(f.rig) && (!f.rig.hb || f.rig.hb.cold) && !f.rig.hbFail).length;
  let k = 0; const t0 = performance.now(); HBODY.last = -1e9; while (want() && k++ < 1500) tickPeople(1 / 60, 2e5 + k * (HBODY.gap + 1));
  return { d, ticks: k, left: want(), ms: Math.round(performance.now() - t0) }; }, KINDS);
console.log('  built:', JSON.stringify(made));

const who = await page.evaluate(() => _F.map(({ n, e, rig }) => { const H = rig && rig.hb, names = new Set(); if (H) H.root.traverse(o => { if (o.isMesh || o.isGroup) names.add(o.name); });
  const G = rig && rig.hbG; let tris = 0, rot = false; if (H) for (const o of H.full) { if (o.isMesh && o.geometry.index) tris += o.geometry.index.count / 3; if (o.isSkinnedMesh && o.material.customProgramCacheKey && /\+rot/.test(o.material.customProgramCacheKey())) rot = true; }
  return { n, id: e.id, hb: !!H, fail: !!(rig && rig.hbFail), key: G ? [...HB_GENOMES].find(([, x]) => x === G)?.[0] : null, bones: H ? H.P.skeleton.bones.length : 0, tris,
    age: G && G.age, weight: G && G.weight, rot: G && G.rot, rotSkin: rot, boots: !!(G && G.dress && G.dress.boots), drab: !!(G && G.dress && [G.dress.tunic, G.dress.trousers, G.dress.skirtColor].every(c => !c || Math.max(...c) < .35)), cloak: names.has('cloak'), glow: !!(H && H.eyeGlow), names: [...names].slice(0, 40) }; }));
console.log('  foes:', JSON.stringify(who.map(w => ({ ...w, names: undefined }))));
const dd = who.filter(w => w.n !== 'Bandit'), ban = who[1];
check(`the Hollowed and the Ghoul wear the builder's body on its 163-bone skeleton, keyed by their foe id (${dd.map(w => w.tris + ' tris').join(', ')})`, made.left === 0 && dd.length === 2 && dd.every(w => w.hb && !w.fail && w.bones === 163 && w.key === 'foe:' + w.id && w.tris < 70000), who);
check(`their skin is rotted in the builder's shader: the Hollowed at ${dd[0].rot}, the Ghoul at ${dd[1].rot}`, dd[0].rot === .7 && dd[1].rot === 1 && dd.every(w => w.rotSkin), dd);
check(`each is old and wasted, barefoot, in the grave's drab with nothing over it: age ${dd.map(w => w.age).join(', ')}, weight ${dd.map(w => w.weight).join(', ')}`, dd.every(w => w.age > .7 && w.weight < .3 && !w.boots && !w.cloak && w.drab), dd);
check('the Bandit beside them is alive: no rot, no lit eyes', ban.hb && !ban.rot && !ban.rotSkin && !ban.glow, ban);

// the burning eyes over the builder's own, and the driver's with the driver's body
const eyes = await page.evaluate(() => _F.filter(f => f.n !== 'Bandit').map(f => { const rig = f.rig, H = rig.hb; tickPeople(1 / 60, 3e5); rig.root.updateMatrixWorld(true);
  const balls = []; H.P.byName.head.children.forEach(o => { if (o.isMesh && o.geometry.type === 'SphereGeometry') balls.push(o.localToWorld((o.geometry.boundingSphere || (o.geometry.computeBoundingSphere(), o.geometry.boundingSphere)).center.clone())); });
  const pa = H.eyeGlow.geometry.attributes.position, n = pa.count / 2, cen = [0, 1].map(k => { const v = new THREE.Vector3(); for (let i = k * n; i < (k + 1) * n; i++) v.add(new THREE.Vector3().fromBufferAttribute(pa, i)); return H.eyeGlow.localToWorld(v.divideScalar(n)); });
  const d = cen.map(c => Math.min(...balls.map(b => b.distanceTo(c)))), fwd = new THREE.Vector3(Math.sin(rig.root.parent.rotation.y), 0, Math.cos(rig.root.parent.rotation.y));
  const ahead = cen.map((c, i) => { const b = balls.reduce((a, x) => x.distanceTo(c) < a.distanceTo(c) ? x : a); return +c.clone().sub(b).dot(fwd).toFixed(4); });
  const lv = H.L; hbLevel(rig, 2); const far = [rig.eyeGlow.visible, H.root.visible]; hbLevel(rig, 0); const near = [rig.eyeGlow.visible, H.root.visible && H.eyeGlow.visible]; hbLevel(rig, lv < 0 ? 0 : lv);
  return { n: f.n, d: d.map(x => +x.toFixed(4)), ahead, far, near, col: H.eyeGlow.material.color.getHexString() }; }));
console.log('  eyes:', JSON.stringify(eyes));
check(`the lit eyes sit over the builder's eyeballs, a little in front (${eyes.map(e => e.d.join('/') + ' m off, ' + e.ahead.join('/') + ' ahead').join('; ')})`, eyes.every(e => e.d.every(x => x < .02) && e.ahead.every(x => x > 0 && x < .02)), eyes);
check('near, the builder\'s lit eyes show and the driver\'s are hidden; far, the driver\'s show with its body', eyes.every(e => e.near[0] === false && e.near[1] === true && e.far[0] === true && e.far[1] === false), eyes);

// it walks: the builder's bones follow the driver's stride
const walk = await page.evaluate(() => { const { e, rig } = _F[0], H = rig.hb, sk = H.P.skeleton, mats = () => Array.from(sk.boneMatrices);
  const dx = Math.sin(e.mesh.rotation.y), dz = Math.cos(e.mesh.rotation.y); rig.root.parent.updateMatrixWorld(true); sk.update(); const a = mats(); let w = 0;
  for (let i = 0; i < 120; i++) { e.x += dx * .011; e.z += dz * .011; e.mesh.position.set(e.x, WORLD.worldH(e.x, e.z), e.z); tickPeople(1 / 60, 4e5 + i * 16.7); if (i > 40) w = Math.max(w, (rig.w && rig.w.walk) || 0); }
  rig.root.parent.updateMatrixWorld(true); sk.update(); const b = mats(); let moved = 0; for (let i = 0; i < a.length; i++) moved = Math.max(moved, Math.abs(a[i] - b[i])); return { moved: +moved.toFixed(3), w: +w.toFixed(2) }; });
console.log('  walk:', JSON.stringify(walk));
check(`it walks: the builder's bones turn with the driver's stride (by ${walk.moved})`, walk.moved > .02, walk);

// the picture: the line from 6 m, and close on the Hollowed's face
await page.evaluate(() => { const f = _F[1].e; const fx = -Math.sin(yaw), fz = -Math.cos(yaw); px = f.x - fx * 6; pz = f.z - fz * 6; pitch = .05; });
for (let i = 0; i < 8; i++) { await page.evaluate(() => tickPeople(1 / 60, performance.now())); await g.frames(1); }
await page.screenshot({ path: path.join(OUT, 'f4-dead.jpg') });
await page.evaluate(() => { const f = _F[0].e; const fx = -Math.sin(yaw), fz = -Math.cos(yaw); px = f.x - fx * 1.6; pz = f.z - fz * 1.6; pitch = -.05; });
for (let i = 0; i < 8; i++) { await page.evaluate(() => tickPeople(1 / 60, performance.now())); await g.frames(1); }
await page.screenshot({ path: path.join(OUT, 'f4-dead-near.jpg') });

const dead = await page.evaluate(() => { const f = _F[0], rig = f.rig;
  f.e.hp = 0; killZoneEnemy(f.e, WORLD.scene, '');
  for (let i = 0; i < 90; i++) tickPeople(1 / 60, 7e5 + i * 16.7);
  rig.root.parent.updateMatrixWorld(true); const hb = rig.hb.map.find(([j]) => j === 'head')[1].getWorldPosition(new THREE.Vector3()), hd = rig.B.head.getWorldPosition(new THREE.Vector3());
  return { head: +(hb.y - WORLD.worldH(hb.x, hb.z)).toFixed(2), gap: +hb.distanceTo(hd).toFixed(2) }; });
check('killed, the Hollowed falls with its driver', dead.head < .7 && dead.gap < .45, dead);
await page.evaluate(() => { REN.render(scene, CAM); });
check('no page errors', g.errs.length === 0, g.errs.slice(0, 3));
await g.close();
