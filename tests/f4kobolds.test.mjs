// Card F4 (Session 1379): on the new look the Kobold (the moor's) and the Kobold Thief (an occupied gate's) wear the builder's body, as
// the human foes have since Session 1201: Michael's B on Session 178, the old mine-sprite, an old man hooded and caped with a long grey
// beard (HB_FOE_BODY), sized to its driver's small stature; the kit's new mattock in its fist, the driver's baked hammer gone with the
// driver. Picture: docs/prototypes/f4/f4-kobolds.jpg.
import { boot, check, ROOT } from './lib/game.mjs';
import fs from 'fs'; import path from 'path';
const OUT = path.join(ROOT, 'docs', 'prototypes', 'f4'); fs.mkdirSync(OUT, { recursive: true });

const KINDS = ['Kobold', 'Kobold Thief', 'Kobold', 'Bandit'];
const g = await boot({ look: 'new' }); const { page } = g;
await g.intoWorld();

const made = await page.evaluate((KINDS) => { forceTime(12);
  { const t1 = performance.now(); while (JOBS.length && performance.now() - t1 < 20000) runJobs(); }
  const fx = -Math.sin(yaw), fz = -Math.cos(yaw), sx = -fz, sz = fx;
  const clear = (x, z) => { for (let dx = -2; dx <= 2; dx += .5) for (let dz = -2; dz <= 2; dz += .5) if (WORLD.solidAt(x + dx, z + dz)) return false; return true; };
  let d = 6; for (; d < 60; d += 3) { let ok = true; for (let i = 0; i < KINDS.length; i++) if (!clear(px + fx * d + sx * (i - 1.5) * 1.4, pz + fz * d + sz * (i - 1.5) * 1.4)) { ok = false; break; } if (ok) break; }
  window._F = KINDS.map((n, i) => { const x = px + fx * d + sx * (i - 1.5) * 1.4, z = pz + fz * d + sz * (i - 1.5) * 1.4;
    // the Kobold Thief is the dungeon's (an occupied gate's roster): built with buildFoe and keyed, as the dungeon does
    if (n === 'Kobold Thief') { const rig = buildFoe(n, x, z), grp = new THREE.Group(); grp.add(rig.root); grp.position.set(x, WORLD.worldH(x, z), z); grp.rotation.y = Math.atan2(px - x, pz - z); WORLD.scene.add(grp);
      const e = keyFoe({ x, z, mesh: grp, dead: false, name: n, limbs: { person: rig } }, 'f4kob:' + i); rig.e = e; return { n, e, rig }; }
    const e = keyFoe(buildZoneEnemy(WORLD.scene, [], x, z, n, null), 'f4kob:' + i); e.mesh.position.set(x, WORLD.worldH(x, z), z); e.mesh.rotation.y = Math.atan2(px - x, pz - z); e.combatYaw = e.mesh.rotation.y;
    e.locked = false; e.mesh.visible = true; if (!e.mesh.parent) WORLD.scene.add(e.mesh); const rig = e.limbs && e.limbs.person; if (rig) rig.e = e; return { n, e, rig }; });
  CAM.position.set(px, worldH(px, pz) + 1.65, pz); CAM.updateMatrixWorld(true);
  const want = () => _F.filter(f => f.rig && HB_RIGS.has(f.rig) && (!f.rig.hb || f.rig.hb.cold) && !f.rig.hbFail).length;
  let k = 0; const t0 = performance.now(); HBODY.last = -1e9; while (want() && k++ < 1500) tickPeople(1 / 60, 2e5 + k * (HBODY.gap + 1));
  return { d, ticks: k, left: want(), ms: Math.round(performance.now() - t0) }; }, KINDS);
console.log('  built:', JSON.stringify(made));

const who = await page.evaluate(() => _F.map(({ n, e, rig }) => { const H = rig && rig.hb, names = new Set(); if (H) H.root.traverse(o => { if (o.isMesh || o.isGroup) names.add(o.name); });
  const G = rig && rig.hbG; let tris = 0; if (H) for (const o of H.full) if (o.isMesh && o.geometry.index) tris += o.geometry.index.count / 3;
  return { n, id: e.id, hb: !!H, fail: !!(rig && rig.hbFail), key: G ? [...HB_GENOMES].find(([, x]) => x === G)?.[0] : null, bones: H ? H.P.skeleton.bones.length : 0, tris,
    age: G && G.age, beard: G && G.beard, hood: names.has('hoodUp'), beardMesh: names.has('beard'), cape: [...names].some(x => /cloak|cape/.test(x)), wpn: rig && rig.g.wpn, weapon: !!(rig && rig.weapon) }; }));
console.log('  foes:', JSON.stringify(who));
const kob = who.filter(w => /Kobold/.test(w.n));
check(`the kobolds wear the builder's body on its 163-bone skeleton, keyed by their foe id (${kob.map(w => w.tris + ' tris').join(', ')})`, made.left === 0 && kob.length === 3 && kob.every(w => w.hb && !w.fail && w.bones === 163 && w.key === 'foe:' + w.id), kob);
check('each is Michael\'s mine-sprite: old, a long beard, hooded and caped; the bandit beside them is not old by it', kob.every(w => w.age >= .8 && w.beard >= .8 && w.beardMesh && w.hood && w.cape) && who[3].hb && !(who[3].age >= .8 && who[3].beard >= .8), who);

// the mattock in the fist, and the stature the driver's
const fit = await page.evaluate(() => _F.filter(f => /Kobold/.test(f.n)).map(f => { const rig = f.rig, H = rig.hb, v = new THREE.Vector3(), w = new THREE.Vector3();
  tickPeople(1 / 60, 3e5); rig.root.updateMatrixWorld(true); const hd = H.map.find(([j]) => j === 'head')[1].getWorldPosition(new THREE.Vector3()), dh = rig.B.head.getWorldPosition(new THREE.Vector3());
  const by = H.P.byName, gy0 = rig.root.parent.position.y, feet = ['foot.L', 'foot.R'].map(k => by[k] ? +(by[k].getWorldPosition(new THREE.Vector3()).y - gy0).toFixed(3) : null);
  const gy = rig.root.parent.position.y; let d = null;
  if (rig.weapon) { rig.weapon.getWorldPosition(v); const b = H.map.find(([j]) => j === (H.held.find(h => h.o === rig.weapon).sd === 'L' ? 'wrL' : 'wrR'))[1]; b.getWorldPosition(w); d = +v.distanceTo(w).toFixed(3); }
  return { n: f.n, d, carried: !!rig.weapon && rig.weapon.parent === H.root, head: +(hd.y - gy).toFixed(3), drvHead: +(dh.y - gy).toFixed(3), feet }; }));
console.log('  fit:', JSON.stringify(fit));
check(`each holds the kit's mattock in the builder's fist, within 12 cm of its wrist (${fit.map(f => f.d).join(', ')} m)`, fit.every(f => f.d != null && f.d < .12 && f.carried) && kob.every(w => w.wpn === 'mattock'), fit);
check(`each stands at its driver's small stature: head bone ${fit.map(f => f.head).join(', ')} m up, within 18 cm of the driver's, its ankles by the ground (${fit.map(f => f.feet.join('/')).join(', ')} m)`, fit.every(f => f.head > .8 && f.head < 1.5 && Math.abs(f.head - f.drvHead) < .18 && f.feet.every(y => y != null && y > -.03 && y < .15)), fit);

// it walks: the builder's bones follow the driver's stride
const walk = await page.evaluate(() => { const { e, rig } = _F[0], H = rig.hb, sk = H.P.skeleton, mats = () => Array.from(sk.boneMatrices);
  const dx = Math.sin(e.mesh.rotation.y), dz = Math.cos(e.mesh.rotation.y); sk.update(); const a = mats(); let w = 0;
  for (let i = 0; i < 120; i++) { e.x += dx * .011; e.z += dz * .011; e.mesh.position.set(e.x, WORLD.worldH(e.x, e.z), e.z); tickPeople(1 / 60, 4e5 + i * 16.7); if (i > 40) w = Math.max(w, (rig.w && rig.w.walk) || 0); }
  sk.update(); const b = mats(); let moved = 0; for (let i = 0; i < a.length; i++) moved = Math.max(moved, Math.abs(a[i] - b[i])); return { moved: +moved.toFixed(3), w: +w.toFixed(2) }; });
console.log('  walk:', JSON.stringify(walk));
check(`it walks: the builder's bones turn with the driver's stride (by ${walk.moved})`, walk.moved > .02 && walk.w > .5, walk);

// the picture: the line from 4 m, near
await page.evaluate(() => { const f = _F[1].e; const fx = -Math.sin(yaw), fz = -Math.cos(yaw); px = f.x - fx * 3.4; pz = f.z - fz * 3.4; pitch = -.12; });
for (let i = 0; i < 8; i++) { await page.evaluate(() => tickPeople(1 / 60, performance.now())); await g.frames(1); }
await page.screenshot({ path: path.join(OUT, 'f4-kobolds.jpg') });

const dead = await page.evaluate(() => { const f = _F[0], rig = f.rig, before = []; rig.hb.root.traverse(o => { if (o.isMesh) before.push([o, o.material]); });
  f.e.hp = 0; killZoneEnemy(f.e, WORLD.scene, '');
  for (let i = 0; i < 90; i++) tickPeople(1 / 60, 7e5 + i * 16.7);
  rig.root.parent.updateMatrixWorld(true); const hb = rig.hb.map.find(([j]) => j === 'head')[1].getWorldPosition(new THREE.Vector3()), hd = rig.B.head.getWorldPosition(new THREE.Vector3());
  return { n: before.length, darker: before.filter(([o, m]) => o.material !== m && o.material.color && o.material.color.r <= m.color.r * .36 + 1e-6).length, head: +(hb.y - WORLD.worldH(hb.x, hb.z)).toFixed(2), gap: +hb.distanceTo(hd).toFixed(2) }; });
check('killed, its body is darkened and falls with its driver', dead.darker === dead.n && dead.head < .5 && dead.gap < .3, dead);
await page.evaluate(() => { REN.render(scene, CAM); });
check('no page errors', g.errs.length === 0, g.errs.slice(0, 3));
await g.close();
