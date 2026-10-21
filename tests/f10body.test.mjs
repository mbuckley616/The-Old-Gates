// Card F10 (Session 1246): the player's own body from the builder's genome, in the new look. The creator writes the genome
// (worldState.look.hb, the character row), third person wears the builder's body over the 17-bone driver (F4's hbAttach and
// hbPose), the same body after a save and a reload, its bones moving through a walk, a swing and a roll over fixed ticks, and
// what the player wears and holds on it. Pictures in docs/prototypes/f10/.
import { boot, check, ROOT } from './lib/game.mjs';
import fs from 'fs'; import path from 'path';
const OUT = path.join(ROOT, 'docs', 'prototypes', 'f10'); fs.mkdirSync(OUT, { recursive: true });
const g = await boot(); const { page } = g;
page.on('pageerror', e => console.log('  pageerror:', (e.stack || e.message).slice(0, 500)));

// ── the creator: a tall woman of the Markmen, her face rolled from her seed ──
await page.click('#sb'); await page.waitForTimeout(1500);
const pick = (label) => page.evaluate((label) => { const b = [...document.querySelectorAll('#cc-look-rows button')].find(x => x.textContent === label); if (b) b.click(); return !!b; }, label);
await page.evaluate(() => { const b = [...document.querySelectorAll('#cc-people-grid button')].find(x => /mark/i.test(x.textContent)); if (b) b.click(); });
await page.waitForTimeout(500);
const rows = { woman: await pick('Woman'), tall: await pick('Tall'), strong: await pick('Strong') };
const cc = await page.evaluate(() => { const R = CCL.rig, H = R && R.rig.hb, L = window._ccLook;
  return { people: window._ccPeople, body: L.body, tall: L.tall, hb: !!H, bones: H && H.P.skeleton.bones.length, driverHidden: H && !R.rig.mesh.visible,
    g: L.hb && L.hb.sliders.g, body: H && +HB.statureOf(R.rig.hbG).toFixed(3), hbPeople: L.hb && L.hb.people, st: H && +H.st.toFixed(3), beardRow: [...document.querySelectorAll('#cc-look-rows span')].some(s => s.textContent === 'Beard') }; });
check('the creator offers the body, the height and the build on the new look', rows.woman && rows.tall && rows.strong, rows);
check('the creator\'s figure is the builder\'s body (163 bones) over a hidden driver, and the look carries its genome', cc.hb && cc.bones === 163 && cc.driverHidden && cc.g === 0 && cc.hbPeople === cc.people, cc);
check('a tall Markish woman\'s body is at the top of her people\'s range (1.72 to 1.84 m, crown to sole), and there is no beard row', cc.body > 1.82 && cc.body < 1.85 && !cc.beardRow, cc);
fs.writeFileSync(path.join(OUT, 'f10-creator.png'), await page.locator('#cc-look-cv').screenshot());

// ── into the world, third person ──
await page.evaluate(() => ccBegin()); await page.waitForTimeout(9000); await g.hide();
await page.evaluate(() => goToZone('world', 13100, 25450, 0, 'x')); await page.waitForTimeout(9000); await g.hide();
// the game's own loop driven a tick at a time (1/60 s), the render stubbed; the loop's clock (prevT) is cleared afterwards, so the
// next real frame takes the loop's longest step (0.05 s): left ahead of the page's frames (or set to performance.now(), which on
// software GL can be 18 s past the next frame's own timestamp) the next real frame reads a negative step
const drive = (fn, arg) => page.evaluate(([src, arg]) => { const raf = window.requestAnimationFrame, rr = REN.render; window.requestAnimationFrame = () => 0; REN.render = () => {};
  let t = performance.now(); prevT = t; const step = () => { t += 1000 / 60; loop(t); };
  // a quest's popup (it comes on a timer) pauses the loop: kept shut, as g.hide() does
  for (const id of ['intro-overlay', 'quest-popup']) { const e = document.getElementById(id); if (e) e.style.display = 'none'; } try { _introFadeActive = false; } catch (e) {}
  try { return (new Function('step', 'arg', src))(step, arg); } finally { window.requestAnimationFrame = raf; REN.render = rr; prevT = 0; } }, [fn.toString().replace(/^[^{]*{/, '').replace(/}$/, ''), arg]);
const body = () => drive(() => { thirdPerson = true; for (let i = 0; i < 4; i++) step(); const R = TP.rig, H = R.rig.hb;
  return { hb: !!H, bones: H && H.P.skeleton.bones.length, driverHidden: H && !R.rig.mesh.visible, full: H && H.full.every(m => m.visible), inScene: R.root.parent === scene,
    stature: H && +(H.st * H.root.scale.x * R.root.scale.x).toFixed(3), st: H && +H.st.toFixed(3), body: H && +HB.statureOf(R.rig.hbG).toFixed(3), meshes: H && H.full.length, saved: JSON.stringify(worldState.look.hb), built: JSON.stringify(R.hbSaved),
    tris: H && H.full.reduce((a, m) => a + (m.geometry.index ? m.geometry.index.count : m.geometry.attributes.position.count) / 3, 0), ms: Math.round(TP_HB.ms / Math.max(1, TP_HB.n)) }; });
const b1 = await body();
console.log('  body:', JSON.stringify({ ...b1, saved: b1.saved.length, built: b1.built.length }));
check('in third person the player is the builder\'s body (163 bones), the 17-bone driver hidden under it', b1.hb && b1.bones === 163 && b1.driverHidden && b1.full && b1.inScene, b1);
check('at the genome\'s own stature (within 1 cm), the one the creator showed', Math.abs(b1.stature - b1.st) < .01 && Math.abs(b1.st - cc.st) < .005, { b1: b1.stature, cc: cc.st });
check('the body is built from the genome the character row holds', b1.saved === b1.built && b1.saved.length > 100, { saved: b1.saved.slice(0, 120) });

// ── its bones move through a walk, a swing and a roll, over fixed ticks ──
const motion = await drive(() => { EQ.weapon = { name: 'Steel Sword', slot: 'weapon', weaponShape: 'sword', weight: 3 }; EQ.offhand = null; swingT = 0; _pendingStrike = null; for (let i = 0; i < 6; i++) step();
  const R = TP.rig, sk = R.rig.hb.P.skeleton, snap = () => { R.root.updateMatrixWorld(true); sk.update(); return Float32Array.from(sk.boneMatrices); };
  const diff = (a, b) => { let n = 0, w = 0; for (let i = 0; i < a.length; i++) { const d = Math.abs(a[i] - b[i]); if (d > 1e-4) n++; w = Math.max(w, d); } return { n, w: +w.toFixed(3) }; };
  const rest = snap(), out = {};
  // a walk: W held for 40 ticks, the game's own loop moving you
  K['KeyW'] = true; for (let i = 0; i < 40; i++) step(); out.walk = diff(rest, snap()); K['KeyW'] = false; for (let i = 0; i < 30; i++) step();
  // a swing
  const r2 = snap(); swingT = ANIM_PARAMS.swing.normalDur; _pendingStrike = { resolveFn: () => {}, isPow: false, fired: false }; let mid = null, k = 0;
  while (swingT > 0 && k++ < 120) { step(); if (!mid && TP.swMax > 0 && 1 - swingT / TP.swMax > .45) mid = snap(); } out.swing = mid ? diff(r2, mid) : null;
  // the sword's grip stays in the builder's right fist through it
  for (let i = 0; i < 10; i++) step();
  // a roll: the body tumbles head over heels (the root turns), the builder's group with it
  const tr = () => { const q = new THREE.Quaternion(); R.rig.hb.root.getWorldQuaternion(q); return q; };
  const q0 = tr(); let turned = 0; const rl = { p: 0 }; for (let i = 0; i <= 20; i++) { rl.p = i / 20; tpRollTumble(R, rl); tpHBPose(R); turned = Math.max(turned, 2 * Math.acos(Math.min(1, Math.abs(q0.dot(tr()))))); }
  out.roll = +turned.toFixed(2); for (let i = 0; i < 4; i++) step();
  return out; });
console.log('  motion:', JSON.stringify(motion));
check('walking 40 ticks, the builder\'s bones move with the stride', motion.walk.n > 300 && motion.walk.w > .05, motion.walk);
check('mid-swing the builder\'s bones are in the swing\'s pose', motion.swing && motion.swing.n > 150 && motion.swing.w > .1, motion.swing);
check('through a roll the body turns over (past 2.5 rad)', motion.roll > 2.5, motion.roll);

// ── what is worn and held: a cuirass, a sword, a shield and a cloak on the builder's body ──
const worn = await drive(() => { const mat = MATERIALS.find(m => m.name === 'Iron');
  EQ.chest = { name: 'Iron Cuirass', slot: 'chest', material: 'Iron', tier: mat.tier }; EQ.weapon = { name: 'Steel Sword', slot: 'weapon', weaponShape: 'sword', weight: 3 };
  EQ.offhand = { name: 'Kite Shield', slot: 'offhand', shieldType: 'shield', matCol: 0x8a6030 }; EQ.back = { name: 'Wool Cloak', slot: 'back', cloak: 'wool' };
  EQ.head = { name: 'Steel Helm', slot: 'head', material: 'Steel', tier: 4 };
  for (let i = 0; i < 4; i++) step(); const R = TP.rig, H = R.rig.hb, names = new Set(); if (TP.sig !== tpSig()) return { names: ['not rebuilt'], held: [], dress: [] }; H.root.traverse(o => { if (o.isMesh && o.visible) names.add(o.name.replace(/\d+$/, '')); });
  R.root.updateMatrixWorld(true); const by = H.P.byName, sd = HBODY.swap ? 'L' : 'R', fist = new THREE.Vector3(); [2, 3, 4, 5].forEach(f => fist.add(by[`finger${f}-2.${sd}`].getWorldPosition(new THREE.Vector3()))); fist.multiplyScalar(.25);
  const held = R.hbHeld.map(h => { const v = new THREE.Vector3(); h.c.getWorldPosition(v); let n = 0; h.c.traverse(o => { if (o.isMesh && o.visible) n++; }); return { kit: h.o.userData.kit || null, meshes: n, inBuilder: h.c.parent === H.root, gap: +v.distanceTo(fist).toFixed(3) }; });
  return { names: [...names].sort(), held, dress: Object.keys(R.rig.hbG.dress).filter(k => R.rig.hbG.dress[k] && typeof R.rig.hbG.dress[k] === 'object'),
    helm: H.P.helm && H.P.helm.tier, helmFit: !!(H.P.tierFit && H.P.tierFit.h.group.parent === by.head), mid: !!H.mid }; });
console.log('  worn:', JSON.stringify(worn));
check('the cuirass is mail on the builder\'s body, the cloak its cloak', worn.names.includes('mail') && worn.names.some(n => /^cloak/.test(n)), worn.names);
check('a Steel helm is the builder\'s helm of its tier (helms.js), fitted to the player\'s head', worn.helm === 4 && worn.helmFit, { helm: worn.helm, fit: worn.helmFit });
// the heavy line's chest by its family (Session 1260): Wooden's lamellar the builder's scales, Bronze's muscle cuirass and Steel's plate its sheet metal
const fam = await drive(() => { const out = {}; for (const t of [1, 2, 3, 4, 10]) { const m = MATERIALS[t - 1]; EQ.chest = { name: m.name + ' Cuirass', slot: 'chest', material: m.name, tier: t };
    for (let i = 0; i < 4; i++) step(); const H = TP.rig.rig.hb, k = []; H.root.traverse(o => { if (o.isMesh && /^mail/.test(o.name)) k.push(o.material.customProgramCacheKey().replace(/[\[{].*$/, '').replace(/[-\d.,]+$/, '')); }); out[m.name] = [...new Set(k)].join('+'); }
  EQ.chest = { name: 'Iron Cuirass', slot: 'chest', material: 'Iron', tier: 3 }; for (let i = 0; i < 4; i++) step(); return out; });
console.log('  chest by family:', JSON.stringify(fam));
check('a Wooden chest is lamellar (the builder\'s scales), Bronze the muscle cuirass, Iron mail, Steel and Cosmic plate', fam.Wooden === 'scales' && fam.Bronze === 'muscle' && fam.Iron === 'mail' && fam.Steel === 'plate' && fam.Cosmic === 'plate', fam);
// gauntlets and greaves by family (Session 1263): Wooden's boards over leather gloves, Bronze's sheet, Iron's mail with cuisses, Steel's
// and Cosmic's plate with cuisses; each piece a shell of its own on the builder's body, read off its material
const gg = await drive(() => { const out = {}; for (const t of [1, 2, 3, 4, 10]) { const m = MATERIALS[t - 1];
    EQ.hands = { name: m.name + ' Gauntlets', slot: 'hands', material: m.name, tier: t }; EQ.legs = { name: m.name + ' Greaves', slot: 'legs', material: m.name, tier: t };
    for (let i = 0; i < 4; i++) step(); const H = TP.rig.rig.hb, k = {}; H.root.traverse(o => { if (o.isMesh && o.visible && /^(vambrace|gloves|greaves|cuisses)$/.test(o.name)) k[o.name] = o.material.customProgramCacheKey ? o.material.customProgramCacheKey().replace(/[\[{(].*$/, '').replace(/[-\d.,]+$/, '') : 'leather'; });
    out[m.name] = ['vambrace', 'gloves', 'greaves', 'cuisses'].map(n => k[n] || '-').join(' '); }
  EQ.hands = null; EQ.legs = null; for (let i = 0; i < 4; i++) step(); return out; });
console.log('  gauntlets and greaves:', JSON.stringify(gg));
check('gauntlets and greaves on the body by family: Wooden boards, Bronze sheet, Iron mail with cuisses, Steel and Cosmic plate with cuisses',
  /^scales \S*leather\S* scales -$/.test(gg.Wooden) && /^sheet \S*leather\S* sheet -$/.test(gg.Bronze) && gg.Iron === 'mail mail mail mail' && gg.Steel === 'sheet sheet sheet sheet' && gg.Cosmic === 'sheet sheet sheet sheet', gg);
check('in third person the new body bakes no middle level (it is baked when first person asks)', worn.mid === false, { mid: worn.mid });
const sword = worn.held.find(h => h.kit === 'sword'), shield = worn.held.find(h => h.kit === 'kite');
check('a copy of the sword is carried in the builder\'s group with its grip in the right fist (within 2 cm), the shield with it', sword && sword.inBuilder && sword.meshes > 0 && sword.gap < .02 && shield && shield.inBuilder && shield.meshes > 0, worn.held);

// pictures, at noon, in the game's own frames: the third-person camera swapped for one framed on the body (front three-quarters
// at rest and mid-swing, the cloak from behind), the overlays shut and the player kept alive; taken when F10_SHOTS is set (a few
// frames of the world on software GL take minutes, more than CI's shard can spare): F10_SHOTS=1 node tests/f10body.test.mjs
if (process.env.F10_SHOTS) {
  await page.evaluate(() => { forceTime(12); PHP = maxHP; dead = false; TP.deadT = 0; pitch = 0; window._tpCam0 = tpCamera; });
  const shot = async (name, ang, prep) => {
    await page.evaluate(([ang, prep]) => { PHP = maxHP; dead = false; for (const id of ['intro-overlay', 'quest-popup']) { const e = document.getElementById(id); if (e) e.style.display = 'none'; }
      window.tpCamera = () => { const a = yaw + Math.PI + ang, cx = px + Math.sin(a) * 2.3, cz = pz + Math.cos(a) * 2.3; CAM.position.set(cx, jumpY + 1.55, cz); CAM.lookAt(px, jumpY + 1.05, pz); TP.near = 3.2; TP.dist = 3.2; };
      (new Function(prep))(); }, [ang, prep.toString().replace(/^[^{]*{/, '').replace(/}$/, '')]);
    await g.frames(3); await page.screenshot({ path: path.join(OUT, name) }); };
  await shot('f10-third-rest.png', .6, () => { swingT = 0; EQ.back = null; });
  await shot('f10-third-swing.png', .6, () => { swingT = ANIM_PARAMS.swing.normalDur * .62; _pendingStrike = null; });
  await shot('f10-cloak-back.png', Math.PI + .3, () => { swingT = 0; EQ.back = { name: 'Wool Cloak', slot: 'back', cloak: 'wool' }; });
  await shot('f10-third-helm-steel.png', .6, () => { EQ.back = null; EQ.head = { name: 'Steel Helm', slot: 'head', material: 'Steel', tier: 4 }; });
  await shot('f10-third-helm-draconic.png', .6, () => { EQ.head = { name: 'Draconic Helm', slot: 'head', material: 'Draconic', tier: 8 }; });
  // the chest by its family (Session 1260); shot()'s prep is sent as source, so each names its tier itself
  await shot('f10-third-lamellar-wooden.png', .6, () => { EQ.head = null; EQ.chest = { name: MATERIALS[0].name + ' Cuirass', slot: 'chest', material: MATERIALS[0].name, tier: 1 }; });
  await shot('f10-third-muscle-bronze.png', .6, () => { EQ.chest = { name: MATERIALS[1].name + ' Cuirass', slot: 'chest', material: MATERIALS[1].name, tier: 2 }; });
  await shot('f10-third-plate-steel.png', .6, () => { EQ.chest = { name: MATERIALS[3].name + ' Cuirass', slot: 'chest', material: MATERIALS[3].name, tier: 4 }; });
  await shot('f10-third-plate-steel-back.png', Math.PI + .5, () => {});
  // gauntlets and greaves (Session 1263)
  for (const [t, n] of [[1, 'wooden'], [3, 'iron'], [4, 'steel']]) await shot(`f10-gauntlets-greaves-${n}.png`, .6, new Function(`const m = MATERIALS[${t - 1}]; for (const [s, k] of [['chest', 'Cuirass'], ['hands', 'Gauntlets'], ['legs', 'Greaves']]) EQ[s] = { name: m.name + ' ' + k, slot: s, material: m.name, tier: ${t} };`));
  await page.evaluate(() => { EQ.hands = null; EQ.legs = null; });
  await shot('f10-third-plate-cosmic.png', .6, () => { EQ.chest = { name: MATERIALS[9].name + ' Cuirass', slot: 'chest', material: MATERIALS[9].name, tier: 10 }; });
  await page.evaluate(() => { window.tpCamera = window._tpCam0; });
}

// ── the same body after a save and a reload ──
await page.evaluate(() => { EQ.chest = null; EQ.offhand = null; EQ.back = null; EQ.weapon = null; EQ.head = null; return saveToSlot(0).then(() => 1); });
g.errs.length = 0; await page.reload(); await page.waitForTimeout(5000);
await page.evaluate(() => document.getElementById('cb').click()); await page.waitForTimeout(12000); await g.hide();
const b2 = await body();
check('after a save and a reload the body is built from the same genome, at the same stature', b2.hb && b2.saved === b1.saved && b2.built === b1.saved && Math.abs(b2.stature - b1.stature) < .002, { b1: b1.stature, b2: b2.stature, same: b2.saved === b1.saved });
check('the player\'s body at its near level is lighter than a townsperson\'s (F4: up to 273,000 triangles), in under 40 meshes', b1.tris > 5000 && b1.tris < 120000 && b1.meshes < 40, { tris: b1.tris, meshes: b1.meshes, msBuild: b1.ms });
check('no page errors, and third person never threw (the loop catches it and warns once)', g.errs.length === 0 && !g.logs.some(l => /third person|F10:|F4:/.test(l)), { errs: g.errs, logs: g.logs.filter(l => /third person|F10:|F4:/.test(l)) });
await g.close();
