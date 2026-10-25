// Card F4 (Session 1389): on the new look the Marsh Hag wears the builder's body, as the kobolds (S1379) and the Ogre (S1386) do:
// S216's look, the fen's witch, an old woman in bog rags, hooded, with a crooked staff. A robe under a long hooded cloak, and the
// builder's own hazel walking staff (S1085) in her right fist where the driver's stick was. Picture: docs/prototypes/f4/f4-hags.jpg.
import { boot, check, ROOT } from './lib/game.mjs';
import fs from 'fs'; import path from 'path';
const OUT = path.join(ROOT, 'docs', 'prototypes', 'f4'); fs.mkdirSync(OUT, { recursive: true });

const KINDS = ['Marsh Hag', 'Bandit', 'Marsh Hag'];
const g = await boot({ look: 'new' }); const { page } = g;
await g.intoWorld();

const made = await page.evaluate((KINDS) => { forceTime(12);
  { const t1 = performance.now(); while (JOBS.length && performance.now() - t1 < 20000) runJobs(); }
  const fx = -Math.sin(yaw), fz = -Math.cos(yaw), sx = -fz, sz = fx;
  const clear = (x, z) => { for (let dx = -2; dx <= 2; dx += .5) for (let dz = -2; dz <= 2; dz += .5) if (WORLD.solidAt(x + dx, z + dz)) return false; return true; };
  let d = 6; for (; d < 60; d += 3) { let ok = true; for (let i = 0; i < KINDS.length; i++) if (!clear(px + fx * d + sx * (i - 1) * 2.2, pz + fz * d + sz * (i - 1) * 2.2)) { ok = false; break; } if (ok) break; }
  window._F = KINDS.map((n, i) => { const x = px + fx * d + sx * (i - 1) * 2.2, z = pz + fz * d + sz * (i - 1) * 2.2;
    const e = keyFoe(buildZoneEnemy(WORLD.scene, [], x, z, n, null), 'f4hag:' + i); e.mesh.position.set(x, WORLD.worldH(x, z), z); e.mesh.rotation.y = Math.atan2(px - x, pz - z); e.combatYaw = e.mesh.rotation.y;
    e.locked = false; e.mesh.visible = true; if (!e.mesh.parent) WORLD.scene.add(e.mesh); const rig = e.limbs && e.limbs.person; if (rig) rig.e = e; return { n, e, rig }; });
  CAM.position.set(px, worldH(px, pz) + 1.65, pz); CAM.updateMatrixWorld(true);
  const want = () => _F.filter(f => f.rig && HB_RIGS.has(f.rig) && (!f.rig.hb || f.rig.hb.cold) && !f.rig.hbFail).length;
  let k = 0; const t0 = performance.now(); HBODY.last = -1e9; while (want() && k++ < 1500) tickPeople(1 / 60, 2e5 + k * (HBODY.gap + 1));
  return { d, ticks: k, left: want(), ms: Math.round(performance.now() - t0) }; }, KINDS);
console.log('  built:', JSON.stringify(made));

const who = await page.evaluate(() => _F.map(({ n, e, rig }) => { const H = rig && rig.hb, names = new Set(); if (H) H.root.traverse(o => { if (o.isMesh || o.isGroup) names.add(o.name); });
  const G = rig && rig.hbG; let tris = 0; if (H) for (const o of H.full) if (o.isMesh && o.geometry.index) tris += o.geometry.index.count / 3;
  return { n, id: e.id, hb: !!H, fail: !!(rig && rig.hbFail), key: G ? [...HB_GENOMES].find(([, x]) => x === G)?.[0] : null, bones: H ? H.P.skeleton.bones.length : 0, tris,
    age: G && G.age, g: G && G.g, weight: G && G.weight, robe: !!(G && G.dress && G.dress.robe) && names.has('tunic'), tartan: !!(G && G.dress && G.dress.tartan), cloak: names.has('cloak'), hood: [...names].some(n => /hood/.test(n)), staff: names.has('staff'), names: [...names].join(' '), depth: (() => { if (!H) return 0; let b = null, bh = 0; for (const o of H.full) if (o.isSkinnedMesh) { o.geometry.computeBoundingBox(); const h = o.geometry.boundingBox.max.y - o.geometry.boundingBox.min.y; if (h > bh) { bh = h; b = o; } }
    if (!b) return 0; const p = b.geometry.attributes.position.array, y0 = b.geometry.boundingBox.min.y; let z0 = 1e9, z1 = -1e9; for (let i = 0; i < p.length; i += 3) { const f = (p[i + 1] - y0) / bh; if (f > .5 && f < .66 && Math.abs(p[i]) < bh * .15) { z0 = Math.min(z0, p[i + 2]); z1 = Math.max(z1, p[i + 2]); } } return +((z1 - z0) / bh).toFixed(3); })(), wpn: rig && rig.g.wpn, weapon: !!(rig && rig.weapon) }; }));
console.log('  foes:', JSON.stringify(who));
const og = who.filter(w => w.n === 'Marsh Hag'), ban = who[1];
check(`the hags wear the builder's body on its 163-bone skeleton, keyed by their foe id (${og.map(w => w.tris + ' tris').join(', ')})`, made.left === 0 && og.length === 2 && og.every(w => w.hb && !w.fail && w.bones === 163 && w.key === 'foe:' + w.id), og);
check('each wears a robe under a long plain cloak with its hood up', og.every(w => w.robe && !w.tartan && w.cloak && w.hood), og.map(w => w.names));
check(`each is an old, thin woman: age ${og.map(w => w.age).join(', ')}, weight ${og.map(w => w.weight).join(', ')}`, og.every(w => w.age > .9 && w.g === 0 && w.weight < .5), who);

// the staff in the fist, and the stature the driver's
const fit = await page.evaluate(() => _F.filter(f => f.n === 'Marsh Hag').map(f => { const rig = f.rig, H = rig.hb, v = new THREE.Vector3(), w = new THREE.Vector3();
  tickPeople(1 / 60, 3e5); rig.root.updateMatrixWorld(true); const hd = H.map.find(([j]) => j === 'head')[1].getWorldPosition(new THREE.Vector3()), dh = rig.B.head.getWorldPosition(new THREE.Vector3());
  const by = H.P.byName, gy0 = rig.root.parent.position.y, feet = ['foot.L', 'foot.R'].map(k => by[k] ? +(by[k].getWorldPosition(new THREE.Vector3()).y - gy0).toFixed(3) : null);
  const gy = rig.root.parent.position.y; let d = null;
  let st = null; H.root.traverse(o => { if (o.name === 'staff') st = o; }); let foot = null; if (st) { const bb = new THREE.Box3().setFromObject(st), wr = by['wrist.R'] || by['wrist.L']; bb.getCenter(v); wr.getWorldPosition(w); d = +bb.distanceToPoint(w).toFixed(3); foot = +(bb.min.y - gy).toFixed(3); }
  return { n: f.n, d, foot, carried: !!st, head: +(hd.y - gy).toFixed(3), drvHead: +(dh.y - gy).toFixed(3), feet }; }));
console.log('  fit:', JSON.stringify(fit));
check(`each holds the hazel staff in the builder's fist (its wood within ${fit.map(f => f.d).join(', ')} m of the wrist), its foot by the ground (${fit.map(f => f.foot).join(', ')} m)`, fit.every(f => f.carried && f.d != null && f.d < .06 && f.foot != null && f.foot < .3), fit);
check(`each stands at its driver's stature: head bone ${fit.map(f => f.head).join(', ')} m up, within 20 cm of the driver's, its ankles by the ground (${fit.map(f => f.feet.join('/')).join(', ')} m)`, fit.every(f => f.head > 1.2 && f.head < 1.9 && Math.abs(f.head - f.drvHead) < .2 && f.feet.every(y => y != null && y > -.03 && y < .16)), fit);

// it walks: the builder's bones follow the driver's stride
const walk = await page.evaluate(() => { const { e, rig } = _F[0], H = rig.hb, sk = H.P.skeleton, mats = () => Array.from(sk.boneMatrices);
  const dx = Math.sin(e.mesh.rotation.y), dz = Math.cos(e.mesh.rotation.y); sk.update(); const a = mats(); let w = 0;
  for (let i = 0; i < 120; i++) { e.x += dx * .011; e.z += dz * .011; e.mesh.position.set(e.x, WORLD.worldH(e.x, e.z), e.z); tickPeople(1 / 60, 4e5 + i * 16.7); if (i > 40) w = Math.max(w, (rig.w && rig.w.walk) || 0); }
  sk.update(); const b = mats(); let moved = 0; for (let i = 0; i < a.length; i++) moved = Math.max(moved, Math.abs(a[i] - b[i])); return { moved: +moved.toFixed(3), w: +w.toFixed(2) }; });
console.log('  walk:', JSON.stringify(walk));
check(`it walks: the builder's bones turn with the driver's stride (by ${walk.moved})`, walk.moved > .02 && walk.w > .5, walk);

// the picture: the line from 4 m, near
await page.evaluate(() => { const f = _F[1].e; const fx = -Math.sin(yaw), fz = -Math.cos(yaw); px = f.x - fx * 6; pz = f.z - fz * 6; pitch = .05; });
for (let i = 0; i < 8; i++) { await page.evaluate(() => tickPeople(1 / 60, performance.now())); await g.frames(1); }
await page.screenshot({ path: path.join(OUT, 'f4-hags.jpg') });
// and side-on, the two hags turned a quarter, for the staff and the cloak's fall
await page.evaluate(() => { for (const f of _F) if (f.n === 'Marsh Hag') { f.e.mesh.rotation.y += Math.PI / 2; f.e.combatYaw = f.e.mesh.rotation.y; } });
for (let i = 0; i < 8; i++) { await page.evaluate(() => tickPeople(1 / 60, performance.now())); await g.frames(1); }
await page.screenshot({ path: path.join(OUT, 'f4-hags-side.jpg') });

const dead = await page.evaluate(() => { const f = _F[0], rig = f.rig, before = []; rig.hb.root.traverse(o => { if (o.isMesh) before.push([o, o.material]); });
  f.e.hp = 0; killZoneEnemy(f.e, WORLD.scene, '');
  for (let i = 0; i < 90; i++) tickPeople(1 / 60, 7e5 + i * 16.7);
  rig.root.parent.updateMatrixWorld(true); const hb = rig.hb.map.find(([j]) => j === 'head')[1].getWorldPosition(new THREE.Vector3()), hd = rig.B.head.getWorldPosition(new THREE.Vector3());
  return { n: before.length, darker: before.filter(([o, m]) => o.material !== m && o.material.color && o.material.color.r <= m.color.r * .36 + 1e-6).length, head: +(hb.y - WORLD.worldH(hb.x, hb.z)).toFixed(2), gap: +hb.distanceTo(hd).toFixed(2) }; });
check('killed, her body is darkened and falls with its driver', dead.darker === dead.n && dead.head < .7 && dead.gap < .45, dead);
await page.evaluate(() => { REN.render(scene, CAM); });
check('no page errors', g.errs.length === 0, g.errs.slice(0, 3));
await g.close();
