// Card F10, part two (Session 1252): first person's hands are the player's own body's. The forearm and hand of the builder's body that
// third person wears, its fingers folded in the fist, cut by bone weight and laid in the fist's frame, at the genome's own size in metres;
// the sleeve is what is worn, a pair of gauntlets tints the hand, and every grip (a sword, a shield, a torch) is the same hand. A change
// of what is held keeps the builder's body that was built for the kit (it is not built again). F10_SHOTS=1 writes the pictures to
// docs/prototypes/f10/.
import { boot, check, ROOT } from './lib/game.mjs';
import fs from 'fs'; import path from 'path';
const g = await boot(); const { page } = g;
page.on('pageerror', e => console.log('  pageerror:', (e.stack || e.message).slice(0, 500)));
await g.intoWorld();
const r = await page.evaluate(() => { thirdPerson = false; forceTime(11); const out = {}, v = new THREE.Vector3();
  const mesh = f => f.children.find(o => o.isMesh);
  const meanCol = f => { const c = mesh(f).geometry.attributes.color, s = [0, 0, 0]; for (let i = 0; i < c.count; i++) { s[0] += c.getX(i); s[1] += c.getY(i); s[2] += c.getZ(i); } return s.map(x => +(x / c.count).toFixed(3)); };
  EQ.weapon = null; EQ.offhand = null; EQ.hands = null; buildViewmodel(); buildShieldViewmodel();
  const f = vmSword, m = mesh(f), bb = new THREE.Box3().setFromBufferAttribute(m.geometry.attributes.position);
  out.fist = { hb: !!f.userData.hb, left: !!(f.userData.fistL && f.userData.fistL.userData.hb), tris: m.geometry.index.count / 3, elbow: +f.userData.elbow.position.z.toFixed(3),
    w: +(bb.max.x - bb.min.x).toFixed(3), lo: +bb.min.y.toFixed(3), hi: +bb.max.y.toFixed(3), front: +bb.min.z.toFixed(3), col: meanCol(f), arm: f.userData.armCol };
  // the same hand as third person's: the knuckles to the wrist, in metres, on the body third person shows (its world is in metres)
  const R = TP.rig, by = R.rig.hb.P.byName, sd = HBODY.swap ? 'L' : 'R'; R.root.updateMatrixWorld(true);
  const at = n => new THREE.Vector3().setFromMatrixPosition(by[n].matrixWorld), kc = at('finger2-1.' + sd).add(at('finger5-1.' + sd)).multiplyScalar(.5);
  const ws = new THREE.Vector3(); R.root.getWorldScale(ws);
  // the thumb laid across the folded fingers: its last joint near the index finger's second joint (a hand's knuckles-to-wrist apart, straight)
  out.thumb = { tip: +at('finger1-3.' + sd).distanceTo(at('finger2-2.' + sd)).toFixed(4), hand: +kc.distanceTo(at('wrist.' + sd)).toFixed(4) };
  out.size = { fp: +(2 * f.userData.wrist.z).toFixed(4), tp: +kc.distanceTo(at('wrist.' + sd)).toFixed(4), st: +(R.rig.hb.st).toFixed(3), lenFP: +f.userData.wrist.length().toFixed(4) };
  // the gauntlets and a sleeve
  EQ.hands = { name: 'Iron Gauntlets', slot: 'hands', matCol: 0x9aa4b0, matGuard: 0x606870 }; buildViewmodel(); out.gaunt = { hb: !!vmSword.userData.hb, col: meanCol(vmSword) };
  EQ.hands = null; const keepC = EQ.chest; EQ.chest = { name: 'Red Tunic', slot: 'chest', matCol: 0x8a2018 }; const n0 = TP_HB.n; buildViewmodel(); out.sleeve = { hb: !!vmSword.userData.hb, arm: vmSword.userData.armCol, built: TP_HB.n - n0 };
  EQ.chest = keepC; buildViewmodel();
  // what is held: the same hand on every grip, and the body kept across the change
  const n1 = TP_HB.n, k1 = TP_HB.kept || 0, grips = {};
  for (const [k, w, o] of [['sword and kite', { name: 'Steel Sword', slot: 'weapon', weaponShape: 'sword', matCol: '#dde8ec', matGuard: '#a0b0b8' }, { name: 'Iron Kite Shield', slot: 'offhand', shieldType: 'shield', matCol: '#a8b0b8', matGuard: '#787880' }],
    ['dagger and torch', { name: 'Iron Dagger', slot: 'weapon', weaponShape: 'dagger', matCol: '#a8b0b8', matGuard: '#787880' }, { name: 'Torch', slot: 'offhand', torchType: 'torch' }],
    ['bow', { name: 'Hunting Bow', slot: 'weapon', weaponShape: 'bow', twoHand: true, matCol: '#6a4a2a' }, null]]) {
    EQ.weapon = w; EQ.offhand = o; buildViewmodel(); buildShieldViewmodel();
    const hs = [vmSword.userData.handMain, vmSword.userData.handLow, vmShield && vmShield.userData.handMain].filter(Boolean);
    grips[k] = hs.map(h => { const fi = h.userData.fist; h.updateMatrixWorld(true); const inv = new THREE.Matrix4().copy(h.matrixWorld).invert(), b = new THREE.Box3(), mm = mesh(fi), p = mm.geometry.attributes.position;
      for (let i = 0; i < p.count; i += 2) b.expandByPoint(v.fromBufferAttribute(p, i).applyMatrix4(mm.matrixWorld).applyMatrix4(inv));
      return { hb: !!fi.userData.hb, around: b.min.x < -.015 && b.max.x > .015 && b.min.z < -.015 && b.max.z > .015 }; }); }
  // first person built nothing for those (what the hands are cut from did not change); third person, asked now, carries the body over
  const n1b = TP_HB.n; tpEnsure(); out.held = { grips, fpBuilt: n1b - n1, built: TP_HB.n - n1, kept: (TP_HB.kept || 0) - k1, hb: !!TP.rig.rig.hb, onNew: TP.rig.rig.hb && TP.rig.rig.hb.root.parent === TP.rig.root };
  // sheathed after five seconds at peace, the view is the fists again: no body is built for that either
  const n2 = TP_HB.n; EQ.weapon = { name: 'Steel Sword', slot: 'weapon', weaponShape: 'sword', matCol: '#dde8ec', matGuard: '#a0b0b8' }; EQ.offhand = null; buildViewmodel();
  SHEATHED = true; sheathView(); out.sheath = { fists: !!vmSword.userData.fists, hb: !!vmSword.userData.hb, built: TP_HB.n - n2 }; SHEATHED = false; buildViewmodel();
  out.cost = { bakeMs: +(FP_HB.ms / Math.max(1, FP_HB.n)).toFixed(1), bakes: FP_HB.n };
  return out; });
console.log(JSON.stringify(r));
check('the empty hands are both the builder\'s body\'s, the right one forearm and fist of 2,000–5,000 triangles, cut at the elbow (.34)', r.fist.hb && r.fist.left && r.fist.tris >= 2000 && r.fist.tris <= 5000 && Math.abs(r.fist.elbow - .34) < 1e-6, r.fist);
check('the fist is a hand\'s size in metres: 8 to 14 cm across the thumb and knuckles, the fingers folded under the back of the hand', r.fist.w > .08 && r.fist.w < .14 && r.fist.lo < -.05 && r.fist.hi < .07, r.fist);
check('it is the same hand as third person\'s: knuckles to wrist the same length to the millimetre', Math.abs(r.size.fp - r.size.tp) < .001 && r.size.fp > .06 && r.size.fp < .13, r.size);
check('gauntlets tint the hand towards their metal', r.gaunt.hb && Math.abs(r.gaunt.col[2] - r.fist.col[2]) > .02, { bare: r.fist.col, gaunt: r.gaunt.col });
check('a red tunic is the forearm\'s sleeve (and the arm\'s), built from the dressed body', r.sleeve.hb && r.sleeve.arm !== r.fist.arm && ((r.sleeve.arm >> 16) & 255) > 2 * ((r.sleeve.arm >> 8) & 255), { bare: r.fist.arm.toString(16), red: r.sleeve.arm.toString(16) });
check('every grip is the builder\'s hand with the haft through it: sword and kite, dagger and torch, the bow', Object.values(r.held.grips).every(a => a.length && a.every(h => h.hb && h.around)), r.held.grips);
check('changing what is held builds no new body: first person cuts the hands from the one it has, third person carries it over', r.held.built === 0 && r.held.kept === 1 && r.held.hb && r.held.onNew, r.held);
check('the thumb lies across the folded fingers, its last joint within 4 cm of the index finger\'s second joint', r.thumb.tip < .04, r.thumb);
check('sheathing shows the builder\'s fists and builds no body', r.sheath.fists && r.sheath.hb && r.sheath.built === 0, r.sheath);
check('a hand\'s cut costs under 60 ms', r.cost.bakeMs < 60, r.cost);
if (process.env.F10_SHOTS) {
  const OUT = path.join(ROOT, 'docs', 'prototypes', 'f10'); fs.mkdirSync(OUT, { recursive: true });
  for (const [name, w, o] of [['f10-first-fists', null, null], ['f10-first-sword', { name: 'Steel Sword', slot: 'weapon', weaponShape: 'sword', matCol: '#dde8ec', matGuard: '#a0b0b8' }, { name: 'Iron Kite Shield', slot: 'offhand', shieldType: 'shield', matCol: '#a8b0b8', matGuard: '#787880' }]]) {
    const url = await page.evaluate(([w, o]) => { EQ.weapon = w; EQ.offhand = o; buildViewmodel(); buildShieldViewmodel(); if (typeof drawWeapon === 'function' && w) { drawWeapon(); _lastSwingG = playClockS; }
      const cv = REN.domElement; vmSword && vmSword.updateMatrixWorld(true); vmShield && vmShield.updateMatrixWorld(true); _updateArmBridge(vmArmR); _updateArmBridge(vmArmL);
      if (!w) vmFistPose(0, 0, 0, 0);
      REN.render(scene, CAM); REN.autoClear = false; REN.clearDepth(); REN.render(VM_SCENE, VM_CAM); REN.autoClear = true; return cv.toDataURL(); }, [w, o]);
    fs.writeFileSync(path.join(OUT, name + '.png'), Buffer.from(url.split(',')[1], 'base64')); }
  // closer: the view model alone from its own camera lowered and drawn back, so the hands on the grips are in frame (as fphands)
  const near = await page.evaluate(() => { const cv = REN.domElement, c = VM_CAM.clone(); c.position.y -= .2; c.position.z += .12; c.updateMatrixWorld(true);
    REN.setClearColor(0x8aa0b8, 1); REN.clear(); REN.render(VM_SCENE, c); return cv.toDataURL(); });
  fs.writeFileSync(path.join(OUT, 'f10-first-sword-close.png'), Buffer.from(near.split(',')[1], 'base64'));
}
// S1306 — the hands take the lights of the place they are in (backlog I, s827): drawn over the world at noon, then over a black room
// lit by one dim ambient and a lamp at 3 m, the view model's light follows; the old fixed 0.8 ambient and 1.2 sun lit both alike
const lit = await page.evaluate(() => { forceTime(12); applyDayNightLighting(performance.now() / 1000 + 9); const sum = () => { let s = 0; const m = c => (c.r + c.g + c.b) / 3; VM_SCENE.children.forEach(o => { if (o.isLight) s += o.intensity * (o.isHemisphereLight ? (m(o.color) + m(o.groundColor)) / 2 : m(o.color)); }); return +s.toFixed(3); };
  vmLight(scene, 9); const day = sum(); const dark = new THREE.Scene(); dark.add(new THREE.AmbientLight(0x404050, .2)); vmLight(dark, 0); const vault = sum();
  const lamp = new THREE.PointLight(0xffa050, 2, 10); lamp.position.set(CAM.position.x + 3, CAM.position.y, CAM.position.z); dark.add(lamp); vmLight(dark, 1 / 60); const eased = sum(); vmLight(dark, 9); const lamped = sum();
  vmLight(scene, 9); return { day, vault, eased, lamped, back: sum() }; });
check('the hands are lit by the place: bright over the world at noon, dim in a black vault, brighter by a lamp, eased toward it', lit.day > 1 && lit.vault < .1 && lit.lamped > lit.vault + .5 && lit.eased > lit.vault && lit.eased < lit.lamped && lit.back === lit.day, lit);
check('no page errors, and the hands never fell back (no F10 or F4 warning)', g.errs.length === 0 && !g.logs.some(l => /F10:|F4:/.test(l)), { errs: g.errs, logs: g.logs.filter(l => /F10:|F4:/.test(l)) });
await g.close();
