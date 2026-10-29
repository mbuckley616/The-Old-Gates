// Card F4 (Session 1386): on the new look the Ogre wears the builder's body, as the kobolds have since Session 1379: Michael's answer
// on Session 214 (S221's look), the people's body grown huge and fat, bald and ruddy, bare to the waist in a leather kilt, carrying a
// club. MakeHuman's fat body is its least muscle at its most weight (HB_FOE_BODY); the kit's greatclub in its fist. Picture:
// docs/prototypes/f4/f4-ogres.jpg.
import { boot, check, ROOT } from './lib/game.mjs';
import fs from 'fs'; import path from 'path';
const OUT = path.join(ROOT, 'docs', 'prototypes', 'f4'); fs.mkdirSync(OUT, { recursive: true });

const KINDS = ['Ogre', 'Bandit', 'Ogre'];
const g = await boot({ look: 'new' }); const { page } = g;
await g.intoWorld();

const made = await page.evaluate((KINDS) => { forceTime(12);
  { const t1 = performance.now(); while (JOBS.length && performance.now() - t1 < 20000) runJobs(); }
  const fx = -Math.sin(yaw), fz = -Math.cos(yaw), sx = -fz, sz = fx;
  const clear = (x, z) => { for (let dx = -2; dx <= 2; dx += .5) for (let dz = -2; dz <= 2; dz += .5) if (WORLD.solidAt(x + dx, z + dz)) return false; return true; };
  let d = 6; for (; d < 60; d += 3) { let ok = true; for (let i = 0; i < KINDS.length; i++) if (!clear(px + fx * d + sx * (i - 1) * 2.2, pz + fz * d + sz * (i - 1) * 2.2)) { ok = false; break; } if (ok) break; }
  window._F = KINDS.map((n, i) => { const x = px + fx * d + sx * (i - 1) * 2.2, z = pz + fz * d + sz * (i - 1) * 2.2;
    const e = keyFoe(buildZoneEnemy(WORLD.scene, [], x, z, n, null), 'f4ogre:' + i); e.mesh.position.set(x, WORLD.worldH(x, z), z); e.mesh.rotation.y = Math.atan2(px - x, pz - z); e.combatYaw = e.mesh.rotation.y;
    e.locked = false; e.mesh.visible = true; if (!e.mesh.parent) WORLD.scene.add(e.mesh); const rig = e.limbs && e.limbs.person; if (rig) rig.e = e; return { n, e, rig }; });
  CAM.position.set(px, worldH(px, pz) + 1.65, pz); CAM.updateMatrixWorld(true);
  const want = () => _F.filter(f => f.rig && HB_RIGS.has(f.rig) && (!f.rig.hb || f.rig.hb.cold) && !f.rig.hbFail).length;
  let k = 0; const t0 = performance.now(); HBODY.last = -1e9; while (want() && k++ < 1500) tickPeople(1 / 60, 2e5 + k * (HBODY.gap + 1));
  return { d, ticks: k, left: want(), ms: Math.round(performance.now() - t0) }; }, KINDS);
console.log('  built:', JSON.stringify(made));

const who = await page.evaluate(() => _F.map(({ n, e, rig }) => { const H = rig && rig.hb, names = new Set(); if (H) H.root.traverse(o => { if (o.isMesh || o.isGroup) names.add(o.name); });
  const G = rig && rig.hbG; let tris = 0; if (H) for (const o of H.full) if (o.isMesh && o.geometry.index) tris += o.geometry.index.count / 3;
  return { n, id: e.id, hb: !!H, fail: !!(rig && rig.hbFail), key: G ? [...HB_GENOMES].find(([, x]) => x === G)?.[0] : null, bones: H ? H.P.skeleton.bones.length : 0, tris,
    muscle: G && G.muscle, weight: G && G.weight, tunic: names.has('tunic'), skirt: names.has('skirt'), boots: names.has('boots'), trousers: names.has('trousers'), hair: names.has('hair'), depth: (() => { if (!H) return 0; let b = null, bh = 0; for (const o of H.full) if (o.isSkinnedMesh) { o.geometry.computeBoundingBox(); const h = o.geometry.boundingBox.max.y - o.geometry.boundingBox.min.y; if (h > bh) { bh = h; b = o; } }
    if (!b) return 0; const p = b.geometry.attributes.position.array, y0 = b.geometry.boundingBox.min.y; let z0 = 1e9, z1 = -1e9; for (let i = 0; i < p.length; i += 3) { const f = (p[i + 1] - y0) / bh; if (f > .5 && f < .66 && Math.abs(p[i]) < bh * .15) { z0 = Math.min(z0, p[i + 2]); z1 = Math.max(z1, p[i + 2]); } } return +((z1 - z0) / bh).toFixed(3); })(), wpn: rig && rig.g.wpn, weapon: !!(rig && rig.weapon) }; }));
console.log('  foes:', JSON.stringify(who));
const og = who.filter(w => w.n === 'Ogre'), ban = who[1];
check(`the ogres wear the builder's body on its 163-bone skeleton, keyed by their foe id (${og.map(w => w.tris + ' tris').join(', ')})`, made.left === 0 && og.length === 2 && og.every(w => w.hb && !w.fail && w.bones === 163 && w.key === 'foe:' + w.id), og);
check('each is bare to the waist and barefoot in a knee-length kilt: no tunic, trousers or boots, a skirt', og.every(w => !w.tunic && !w.trousers && !w.boots && w.skirt), og);
check(`each is fat: its belly's depth is ${og.map(w => w.depth).join(', ')} of its height, the bandit's ${ban.depth} (least muscle, most weight)`, og.every(w => w.muscle < .2 && w.weight >= 1 && w.depth > ban.depth * 1.3), who);

// the mattock in the fist, and the stature the driver's
const fit = await page.evaluate(() => _F.filter(f => f.n === 'Ogre').map(f => { const rig = f.rig, H = rig.hb, v = new THREE.Vector3(), w = new THREE.Vector3();
  tickPeople(1 / 60, 3e5); rig.root.updateMatrixWorld(true); const hd = H.map.find(([j]) => j === 'head')[1].getWorldPosition(new THREE.Vector3()), dh = rig.B.head.getWorldPosition(new THREE.Vector3());
  const by = H.P.byName, gy0 = rig.root.parent.position.y, feet = ['foot.L', 'foot.R'].map(k => by[k] ? +(by[k].getWorldPosition(new THREE.Vector3()).y - gy0).toFixed(3) : null);
  const gy = rig.root.parent.position.y; let d = null;
  if (rig.weapon) { rig.weapon.getWorldPosition(v); const b = H.map.find(([j]) => j === (H.held.find(h => h.o === rig.weapon).sd === 'L' ? 'wrL' : 'wrR'))[1]; b.getWorldPosition(w); d = +v.distanceTo(w).toFixed(3); }
  return { n: f.n, d, carried: !!rig.weapon && rig.weapon.parent === H.root, head: +(hd.y - gy).toFixed(3), drvHead: +(dh.y - gy).toFixed(3), feet }; }));
console.log('  fit:', JSON.stringify(fit));
check(`each holds the kit's greatclub in the builder's fist, within 24 cm of its wrist (the ogre is 1.6 times a man) (${fit.map(f => f.d).join(', ')} m)`, fit.every(f => f.d != null && f.d < .24 && f.carried) && og.every(w => w.wpn === 'greatclub'), fit);
check(`each stands at its driver's great stature: head bone ${fit.map(f => f.head).join(', ')} m up, within 40 cm of the driver's, its ankles by the ground (${fit.map(f => f.feet.join('/')).join(', ')} m)`, fit.every(f => f.head > 1.6 && f.head < 3.4 && Math.abs(f.head - f.drvHead) < .4 && f.feet.every(y => y != null && y > -.03 && y < .25)), fit);

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
await page.screenshot({ path: path.join(OUT, 'f4-ogres.jpg') });
// and side-on, the two ogres turned a quarter, for the belly
await page.evaluate(() => { for (const f of _F) if (f.n === 'Ogre') { f.e.mesh.rotation.y += Math.PI / 2; f.e.combatYaw = f.e.mesh.rotation.y; } });
for (let i = 0; i < 8; i++) { await page.evaluate(() => tickPeople(1 / 60, performance.now())); await g.frames(1); }
await page.screenshot({ path: path.join(OUT, 'f4-ogres-side.jpg') });

const dead = await page.evaluate(() => { const f = _F[0], rig = f.rig, before = []; rig.hb.root.traverse(o => { if (o.isMesh) before.push([o, o.material]); });
  f.e.hp = 0; killZoneEnemy(f.e, WORLD.scene, '');
  // Session 1560: until the fall has come to rest (the head still to 1 mm over 10 ticks), not a fixed 90 ticks. The ragdoll's push is
  // random (cosmetic, ragdollStart), and 2 of 12 falls were still on their way down at 90 (the head 1.14 and 0.70 up; CI's 0.70), all
  // twelve at rest by 240 at 0.46–0.55
  const headY = () => { rig.root.parent.updateMatrixWorld(true); return rig.hb.map.find(([j]) => j === 'head')[1].getWorldPosition(new THREE.Vector3()).y; };
  let i = 0, y0 = headY(); for (; i < 600; i++) { tickPeople(1 / 60, 7e5 + i * 16.7); if (i % 10 === 9) { const y = headY(); if (i >= 59 && Math.abs(y - y0) < 1e-3) break; y0 = y; } }
  rig.root.parent.updateMatrixWorld(true); const hb = rig.hb.map.find(([j]) => j === 'head')[1].getWorldPosition(new THREE.Vector3()), hd = rig.B.head.getWorldPosition(new THREE.Vector3());
  return { n: before.length, darker: before.filter(([o, m]) => o.material !== m && o.material.color && o.material.color.r <= m.color.r * .36 + 1e-6).length, head: +(hb.y - WORLD.worldH(hb.x, hb.z)).toFixed(2), gap: +hb.distanceTo(hd).toFixed(2), ticks: i + 1 }; });
check('killed, its body is darkened and falls with its driver', dead.darker === dead.n && dead.head < .7 && dead.gap < .45, dead);
// Session 1548 — under a cavern's roof the club tips forward (foeUnderRoof; QA's s1008: a lair's Ogre master, 3.45 m, held the
// greatclub's head 3.63–3.67 m up in a 3.6 m cavern). In the open it stands upright from the fist, as before.
const upright = await page.evaluate(() => { const rig = _F[2].rig; tickPeople(1 / 60, 5e5); rig.root.parent.updateMatrixWorld(true); const m = rig.B.gear.matrixWorld.elements;
  return +(m[5] / Math.hypot(m[4], m[5], m[6])).toFixed(3); });
await page.evaluate(() => { window._lairBoss = null; delete (worldState.masters || {})[5104];
  goToDungeon(Object.assign({}, PORTALS[0], { theme: 'deep', seed: 5104, size: 'medium', interior: 'cave', zone: 'world', tutorial: false, diff: 'hard', diffScale: DIFF_SCALE.hard, lair: { place: 'Testmoor', boss: 'Ogre' } })); });
for (let i = 0; i < 60; i++) { await page.waitForTimeout(400); if (await page.evaluate(() => activeZoneId === 'dungeon' && !!window._lairBoss)) break; }
await page.evaluate(() => { const e = window._lairBoss; if (e) { px = e.mesh.position.x + 6; pz = e.mesh.position.z; } });
for (let i = 0; i < 60; i++) { if (await page.evaluate(() => { const r = window._lairBoss && window._lairBoss.limbs.person; return !r || (r.hb && !r.hb.cold) || r.hbFail; })) break; await page.waitForTimeout(500); }
const roof = await page.evaluate(() => { const e = window._lairBoss; if (!e) return { none: true }; const rig = e.limbs.person;
  const f = D_CEIL[e.floor || 1], ceil = f ? f(e.x / DCELL, e.z / DCELL) : FLOOR_HEIGHT; let top = -1e9, lo = 1e9;
  for (let i = 0; i < 90; i++) { tickPeople(1 / 60, 7e5 + i * 16.7); if (i < 2) continue; e.mesh.updateMatrixWorld(true); const b = new THREE.Box3().setFromObject(rig.weapon);
    const t = b.max.y - e.baseY; top = Math.max(top, t); lo = Math.min(lo, t); }
  return { hb: !!rig.hb, carried: !!rig.hb && rig.weapon.parent === rig.hb.root, ceil, top: +top.toFixed(2), lo: +lo.toFixed(2) }; });
console.log('  roof:', JSON.stringify({ upright, ...roof }));
check(`in the open the club stands upright from the fist (${upright}); in a ${roof.ceil} m cavern the master's tips forward, its top ${roof.lo}–${roof.top} m up through 1.5 s of the idle (${roof.hb ? 'in the builder\'s fist' : 'on the driver'})`,
  upright > .97 && !roof.none && (!roof.hb || roof.carried) && roof.top <= roof.ceil - .05 && roof.top > roof.ceil - .6, roof);
await page.evaluate(() => { REN.render(scene, CAM); });
check('no page errors', g.errs.length === 0, g.errs.slice(0, 3));
await g.close();
