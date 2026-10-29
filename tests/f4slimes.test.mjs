// Card F4 (Session 1586): on the new look the dungeon's Slime and Small Slime wear the creature kit's `slime` (Session 928, OG-041: arched
// like a wave, holes through it, bones and rubble inside), by the shark's path (Session 1529), since the old blob has no skeleton either:
// keyed by its foe id (`slime:<id>`); the old blob's length, centred on it, on the floor; three levels by distance; the old quiver copied
// onto it about the floor; the tell's glow on its hide; a dead one never dressed; killed, darkened with its shaders kept; the split's
// two Small Slimes dressed too. Picture: docs/prototypes/f4/f4-slimes.jpg (the kit's and the old, side by side).
// Session 1588: the Fire Elemental in the same gate wears the kit's `fireelemental`, fitted by its height; f4-elemental.jpg.
import { boot, check, ROOT } from './lib/game.mjs';
import { enterDungeon } from './lib/dungeonshot.mjs';
import fs from 'fs'; import path from 'path';
const OUT = path.join(ROOT, 'docs', 'prototypes', 'f4'); fs.mkdirSync(OUT, { recursive: true });
const g = await boot({ look: 'new' }); const { page } = g;
await g.intoWorld();
let found = null;
for (const seed of [5, 11, 17, 23, 31, 44, 52]) { await page.evaluate(() => { level = 6; }); await enterDungeon(page, { theme: 'elemental', seed });
  found = await page.evaluate(() => ENEMIES.filter(x => !x.dead && x.floor === currentFloor && x.limbs && x.limbs.slime && x.variant !== 'small').length >= 2 ? { seed: currentPortal.seed } : null);
  if (found) break; }
check('an elemental gate holds two slimes', !!found, found);

// one slime ahead of you, one killed before its body was built (never dressed)
const made = await page.evaluate(() => { const L = ENEMIES.filter(x => !x.dead && x.floor === currentFloor && x.limbs && x.limbs.slime && x.variant !== 'small');
  const S = L[0], O = L[1]; window._S = S; window._O = O; O.dead = true;
  const J = { fn: () => false, name: 'f4slimes' }; JOBS.push(J); /* S1586 — a town job still queued, as when you come in from a town: only the open world runs the queue */
  const rig = () => [...HC_RIGS].find(r => r.e === S); let k = 0; HBODY.last = -1e9; const n0 = HC_BODY.n;
  const at = () => { CAM.position.set(S.mesh.position.x - 3, S.mesh.position.y + 1.6, S.mesh.position.z); CAM.updateMatrixWorld(true); };
  while (!(rig() && rig().hc) && k++ < 300) { at(); tickCreatures(1 / 60, 2e5 + k * (HBODY.gap + 1)); }
  const jobs = JOBS.length; JOBS.splice(JOBS.indexOf(J), 1);
  const R = rig(); window._R = R; if (!R || !R.hc) return { k, jobs, rig: !!R, fail: R && R.hcFail };
  return { k, jobs, bodies: HC_BODY.n - n0, plan: R.hc.C.g.plan, seed: R.hc.C.g.seed, want: HC.hashKey('slime:' + S.id), bones: R.hc.C.bones.length, tris: R.hc.C.stats.tris, f: +R.hc.f.toFixed(3),
    other: [...HC_RIGS].some(r => r.e === O && r.hc), oldKids: R.mesh.children.length, bar: S.mesh.children.filter(o => o.isMesh && o.geometry.type === 'PlaneGeometry').length }; });
console.log('  built:', JSON.stringify(made));
check(`the Slime wears the kit's slime (${made.bones} bones, ${made.tris} tris), keyed by its foe id, built with ${made.jobs} world job(s) still queued`, made.plan === 'slime' && made.jobs > 0 && made.seed === made.want && made.bones > 2, made);
check('a slime already dead gets no kit body; the health bar stays out of the old body\'s group', made.plan && !made.other && made.bar === 2 && made.oldKids >= 1, made);

// its size: the old blob's length, centred on it along the axis, its foot on the floor
const size = await page.evaluate(() => { const m = _S.mesh, R = _R; m.updateMatrixWorld(true); const inv = new THREE.Matrix4().copy(m.matrixWorld).invert(), box = (root, skin) => { const b = new THREE.Box3(), v = new THREE.Vector3();
  root.traverse(o => { if (!o.isMesh || !o.geometry.attributes.position) return; const p = o.geometry.attributes.position; for (let i = 0; i < p.count; i += 5) { v.fromBufferAttribute(p, i); if (skin && o.isSkinnedMesh) o.applyBoneTransform(i, v); else v.applyMatrix4(o.matrixWorld); v.applyMatrix4(inv); b.expandByPoint(v); } }); return b; };
  R.hc.C.skel.update(); const k = box(R.hc.W, true), o = box(R.mesh, false), r = b => [b.min.y, b.max.y, b.min.z, b.max.z].map(v => +v.toFixed(3));
  return { kit: r(k), old: r(o), sc: +m.scale.x.toFixed(3) }; });
const kl = size.kit[3] - size.kit[2], ol = size.old[3] - size.old[2];
check(`it is the old blob's length (${kl.toFixed(2)} against ${ol.toFixed(2)} in the foe's frame), centred on it, on the floor (its foot at ${size.kit[0]})`,
  kl / ol > .85 && kl / ol < 1.15 && Math.abs((size.kit[2] + size.kit[3]) - (size.old[2] + size.old[3])) / 2 < .1 * ol && Math.abs(size.kit[0]) < .06 * ol, size);

// the levels (the dungeon is in metres)
const lv = await page.evaluate(() => { const m = _S.mesh, R = _R, at = (dd, k) => { CAM.position.set(m.position.x - dd, m.position.y + 1.6, m.position.z); CAM.updateMatrixWorld(true); for (let i = 0; i < 3; i++) tickCreatures(1 / 60, 3e5 + k * 100 + i * 17);
  let n = 0; if (R.hc.W.visible) R.hc.W.traverse(o => { if (o.isMesh && o.visible) n++; }); return { L: R.hc.L, kit: n, old: R.mesh.visible }; };
  return { near: at(4, 1), mid: at(20, 2), far: at(45, 3), back: at(4, 4) }; });
check(`three levels: near the kit's ${lv.near.kit} meshes, at 20 m ${lv.mid.kit}, at 45 m the old blob`, lv.near.L === 0 && !lv.near.old && lv.near.kit >= 1 && lv.mid.L === 1 && !lv.mid.old && lv.mid.kit <= lv.near.kit && lv.far.L === 2 && lv.far.old && lv.back.L === 0, lv);

// the quiver: the old blob's squash, copied onto the kit's body about the floor
const qv = await page.evaluate(() => { const R = _R, b = _S.limbs.body, f = R.hc.f; b.scale.set(1.05, .93, 1.05); hcFishPose(R); const w = R.hc.W;
  const out = { sx: +(w.scale.x / f).toFixed(3), sy: +(w.scale.y / f).toFixed(3), foot: +(w.position.y + (R.hc.y0 / f) * -1 * w.scale.y).toFixed(4) }; b.scale.set(1, 1, 1); hcFishPose(R); out.back = +(w.scale.y / f).toFixed(3); return out; });
check(`the old quiver is the kit's: squashed to ${qv.sy} and spread to ${qv.sx}, its foot still on the floor`, qv.sx === 1.05 && qv.sy === .93 && Math.abs(qv.foot) < 1e-3 && qv.back === 1, qv);

// the tell's glow
const glow = await page.evaluate(() => { const lit = () => _R.hc.hide.filter(o => o.material.emissive && o.material.emissive.getHex() !== 0).length;
  telegraphPulse(_S, 1); hcFishPose(_R); const on = lit(); telegraphReset(_S); hcFishPose(_R); return { on, all: _R.hc.hide.length, off: lit() }; });
check('the tell\'s glow lights the kit\'s hide and goes out with it', glow.on === glow.all && glow.on > 0 && glow.off === 0, glow);

// the picture: the kit's slime and, beside it, the old blob, by a lantern
const shot = await page.evaluate(() => { const S = _S, O = _O, R = _R, m = S.mesh; R.hc.C.skel.update();
  const x = m.position.x, y = m.position.y, z = m.position.z, L = new THREE.PointLight(0xffb070, 1.4, 12); L.position.set(x + 1.6, y + 1.6, z + .6); dScene.add(L);
  ENEMIES.forEach(e => { if (e.mesh && e !== S) e.mesh.visible = false; });
  const twin = R.mesh.clone(); twin.visible = true; twin.position.set(x, y, z + 1.2 * m.scale.x); twin.scale.copy(m.scale); twin.rotation.copy(m.rotation); dScene.add(twin);
  const cv = REN.domElement, cam = new THREE.PerspectiveCamera(45, cv.width / cv.height, .05, 60); cam.position.set(x + 2.3 * m.scale.x, y + .8 * m.scale.x, z + .6 * m.scale.x); cam.lookAt(x, y + .22 * m.scale.x, z + .6 * m.scale.x); /* from its side: the old blob left, the kit's right */
  dScene.updateMatrixWorld(true); REN.render(dScene, cam); dScene.remove(L); dScene.remove(twin); ENEMIES.forEach(e => { if (e.mesh && !e.dead) e.mesh.visible = true; });
  const o = document.createElement('canvas'); o.width = cv.width; o.height = cv.height; o.getContext('2d').drawImage(cv, 0, 0); return o.toDataURL('image/jpeg', .85); });
fs.writeFileSync(path.join(OUT, 'f4-slimes.jpg'), Buffer.from(shot.split(',')[1], 'base64'));

// killed: darkened with its shaders kept, no longer posed; the split's two Small Slimes are dressed in their turn
const dead = await page.evaluate(() => { const R = _R, before = []; R.hc.W.traverse(o => { if (o.isMesh) before.push([o, o.material]); });
  const n0 = ENEMIES.length; _S.hp = 0; killE(_S, ''); const a = Array.from(R.hc.C.skel.boneMatrices); for (let i = 0; i < 20; i++) { R.t = performance.now() / 1000 - 1 / 30; hcFishPose(R); } R.hc.C.skel.update();
  const b = Array.from(R.hc.C.skel.boneMatrices); let mv = 0; for (let i = 0; i < a.length; i++) mv = Math.max(mv, Math.abs(a[i] - b[i]));
  const shaded = before.filter(([o, m]) => m.onBeforeCompile !== THREE.Material.prototype.onBeforeCompile);
  return { n: before.length, cloned: before.filter(([o, m]) => o.material !== m).length, shaded: shaded.length, kept: shaded.filter(([o, m]) => o.material.onBeforeCompile === m.onBeforeCompile).length,
    darker: before.filter(([o, m]) => o.material !== m && o.material.color && o.material.color.r <= m.color.r * .36 + 1e-6).length, still: +mv.toFixed(4), hc: !!R.hc, smalls: ENEMIES.slice(n0).filter(e => e.name === 'Small Slime').map(e => e.id) }; });
check('killed, the kit\'s body is darkened with its shaders kept, and it stops', dead.hc && dead.n > 0 && dead.cloned === dead.n && dead.darker === dead.n && dead.kept === dead.shaded && dead.still < 1e-3, dead);
const small = await page.evaluate(() => { const L = ENEMIES.filter(e => e.name === 'Small Slime' && !e.dead); const S = L[0]; if (!S) return { n: 0 };
  const rig = () => [...HC_RIGS].find(r => r.e === S); let k = 0;
  while (!(rig() && rig().hc) && k++ < 300) { CAM.position.set(S.mesh.position.x - 3, S.mesh.position.y + 1.6, S.mesh.position.z); CAM.updateMatrixWorld(true); tickCreatures(1 / 60, 5e5 + k * (HBODY.gap + 1)); }
  const R = rig(); return { n: L.length, k, plan: R && R.hc && R.hc.C.g.plan, seed: R && R.hc && R.hc.C.g.seed, want: HC.hashKey('slime:' + S.id), f: R && R.hc && +R.hc.f.toFixed(3), big: _R.hc.f }; });
check(`the split's ${small.n} Small Slimes wear the kit's slime too, keyed by their own ids, smaller (×${small.f} against ×${(+small.big).toFixed(3)})`, small.n === 2 && small.plan === 'slime' && small.seed === small.want && small.f < small.big, small);
// Session 1588: the Fire Elemental wears the kit's `fireelemental`, standing: fitted by its height, hovering on the plan's bob
const el = await page.evaluate(() => { const F = ENEMIES.find(x => !x.dead && x.floor === currentFloor && x.limbs && x.limbs.flames); if (!F) return { none: true }; window._F = F;
  const rig = () => [...HC_RIGS].find(r => r.e === F); let k = 0; HBODY.last = -1e9;
  while (!(rig() && rig().hc) && k++ < 400) { CAM.position.set(F.mesh.position.x - 3, F.mesh.position.y + 1.6, F.mesh.position.z); CAM.updateMatrixWorld(true); tickCreatures(1 / 60, 9e5 + k * (HBODY.gap + 1)); }
  const R = rig(); window._RF = R; if (!R || !R.hc) return { k, rig: !!R, fail: R && R.hcFail };
  const m = F.mesh; m.updateMatrixWorld(true); const inv = new THREE.Matrix4().copy(m.matrixWorld).invert(), box = (root, skin) => { const b = new THREE.Box3(), v = new THREE.Vector3();
    root.traverse(o => { if (!o.isMesh || !o.geometry.attributes.position) return; const p = o.geometry.attributes.position; for (let i = 0; i < p.count; i += 5) { v.fromBufferAttribute(p, i); if (skin && o.isSkinnedMesh) o.applyBoneTransform(i, v); else v.applyMatrix4(o.matrixWorld); v.applyMatrix4(inv); b.expandByPoint(v); } }); return b; };
  R.hc.C.skel.update(); const kb = box(R.hc.W, true), ob = box(R.mesh, false);
  const lit = () => R.hc.hide.filter(o => o.material.emissive && o.material.emissive.getHex() !== 0).length;
  hcFishPose(R); const idle = lit(); telegraphPulse(F, 1); hcFishPose(R); const on = lit(); telegraphReset(F); F.limbs.body.material.emissive.setHex(0xaa3300); hcFishPose(R); const easing = lit();
  F.limbs.body.material.emissive.copy(F.limbs.coreEm);
  const p0 = R.ph, a = Array.from(R.hc.C.skel.boneMatrices); for (let i = 0; i < 8; i++) { R.t = performance.now() / 1000 - 1 / 30; hcFishPose(R); } R.hc.C.skel.update(); const b = Array.from(R.hc.C.skel.boneMatrices);
  let mv = 0; for (let i = 0; i < a.length; i++) mv = Math.max(mv, Math.abs(a[i] - b[i]));
  return { k, plan: R.hc.C.g.plan, seed: R.hc.C.g.seed, want: HC.hashKey('fireelemental:' + F.id), bones: R.hc.C.bones.length, tris: R.hc.C.stats.tris, f: +R.hc.f.toFixed(3),
    kit: [kb.min.y, kb.max.y].map(v => +v.toFixed(3)), old: [ob.min.y, ob.max.y].map(v => +v.toFixed(3)), idle, on, easing, all: R.hc.hide.length, mv: +mv.toFixed(3) }; });
console.log('  elemental:', JSON.stringify(el));
check(`the Fire Elemental wears the kit's fire elemental (${el.bones} bones, ${el.tris} tris), keyed by its foe id`, el.plan === 'fireelemental' && el.seed === el.want, el);
check(`it stands the old figure's height (${el.kit && el.kit[1]} against ${el.old && el.old[1]}), off the floor`, el.kit && Math.abs(el.kit[1] - el.old[1]) < .08 * el.old[1] && el.kit[0] > -.02, el);
check('its crust is lit by the wind-up only, not by the core\'s own glow or its ease back to it; its flames lick (the bones move)', el.idle === 0 && el.on === el.all && el.on > 0 && el.easing === 0 && el.mv > 1e-3, el);
const shotF = await page.evaluate(() => { const F = _F, R = _RF, m = F.mesh; R.hc.C.skel.update();
  const x = m.position.x, y = m.position.y, z = m.position.z, s = Math.max(m.scale.x, .5), L = new THREE.PointLight(0xffb070, 1.0, 12); L.position.set(x + 1.6 * s, y + 1.6 * s, z + 1.4 * s); dScene.add(L);
  ENEMIES.forEach(e => { if (e.mesh && e !== F) e.mesh.visible = false; });
  const twin = R.mesh.clone(); twin.visible = true; twin.position.set(x + 1.1 * s, y, z); twin.scale.copy(m.scale); twin.rotation.copy(m.rotation); dScene.add(twin);
  const cv = REN.domElement, cam = new THREE.PerspectiveCamera(45, cv.width / cv.height, .05, 60); cam.position.set(x + .55 * s, y + .9 * s, z + 2.6 * s); cam.lookAt(x + .55 * s, y + .55 * s, z);
  dScene.updateMatrixWorld(true); REN.render(dScene, cam); dScene.remove(L); dScene.remove(twin); ENEMIES.forEach(e => { if (e.mesh && !e.dead) e.mesh.visible = true; });
  const o = document.createElement('canvas'); o.width = cv.width; o.height = cv.height; o.getContext('2d').drawImage(cv, 0, 0); return o.toDataURL('image/jpeg', .85); });
fs.writeFileSync(path.join(OUT, 'f4-elemental.jpg'), Buffer.from(shotF.split(',')[1], 'base64'));
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
