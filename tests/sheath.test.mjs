// The sheath and Draw cut (Blade 25; Session 1080, Michael's A on DECISION #399 and his note: "a 'sheath' button where you can
// sheath your equipped weapon. Torches or shields in your off hand stay equipped and in hand"). H sheathes and draws (since
// Session 2659 only H: the sheathe on its own after 5 s at peace is gone, Michael's playtest of 25 Nov); sheathed, the first-person hand is empty and
// the shield stays; a swing from the sheath draws as it swings, and with Draw cut it drains ×2 posture.
import { boot, check } from './lib/game.mjs';
const g = await boot(); const { page } = g;
await g.intoWorld();
const r = await page.evaluate(() => {
  const out = {}; const sk0 = JSON.parse(JSON.stringify(SKILLS)), eq0 = { ...EQ }, keepZ = ZE, rnd = Math.random;
  const SWORD = { name: 'Test Sword', type: 'weapon', atk: [10, 11], wType: 'slash', weaponShape: 'sword', weight: 3 };
  const SHIELD = { name: 'Test Buckler', type: 'equip', slot: 'offhand', shieldType: 'shield', def: 2, block: .6, weight: 3 };
  const meshes = () => { let n = 0; if (vmSword) vmSword.traverse(o => { if (o.isMesh) n++; }); return n; };
  // the hand's view: fists build fewer meshes than a sword in the fist
  EQ.weapon = null; buildViewmodel(); out.fistMeshes = meshes();
  EQ.weapon = SWORD; EQ.offhand = SHIELD; SHEATHED = false; buildViewmodel(); buildShieldViewmodel(); out.swordMeshes = meshes();
  // H: sheathe, then draw
  toggleSheath(); out.afterH = { sheathed: SHEATHED, meshes: meshes(), weapon: EQ.weapon === SWORD, offhand: EQ.offhand === SHIELD };
  toggleSheath(); out.afterH2 = { sheathed: SHEATHED, meshes: meshes() };
  // S2659: never on its own: no foe about, 5.1 s and 60 s after the last swing, the weapon stays drawn (Michael's playtest, 25 Nov)
  ZE = []; _lastSwingG = playClockS - 5.1; tickSheath(); out.at51 = SHEATHED; _lastSwingG = playClockS - 60; tickSheath(); out.at60 = SHEATHED; drawWeapon();
  const mk = (d) => { const e = buildZoneEnemy(WORLD.scene, [], px + fwdX * d, pz + fwdZ * d, 'Bandit', null); if (!e.mesh.parent) WORLD.scene.add(e.mesh);
    e.locked = false; e.alert = true; e.spd = 0; e.atkCd = 1e9; e.rng = null; e.hp = e.maxHp = 1000; e.def = 0; e.resist = {};
    e.combatYaw = Math.atan2(px - e.x, pz - e.z); if (typeof e.posture !== 'number') initPosture(e); e.posture = e.maxPosture = 1000; return e; };
  // a new weapon in hand is drawn
  sheathWeapon(); EQ.weapon = { ...SWORD, name: 'Other Sword' }; tickSheath(); out.swapped = SHEATHED; EQ.weapon = SWORD;
  // Draw cut: the posture the swing drains, drawn and from the sheath, at Blade 24 and 25
  Math.random = () => .5;
  const reset = () => { PHP = maxHP; PPOST.posture = PPOST.maxPosture; PPOST.stagUntil = 0; ROLL = null; stamina = 100; staminaCD = 0; ACTIVE_BUFFS.length = 0; _exhaustedStrike = false; CHAIN.n = 0; };
  const drain = (lv, sheathed) => { SKILLS.blade = { lv, p: 0 }; drawWeapon(); if (sheathed) sheathWeapon(); const e = mk(1); reset(); ZE = [e];
    beginSwing(false); const wasDrawn = !SHEATHED, dc = !!(SWING && SWING.drawCut); resolvePlayerStrike(false); SWING = null;
    const d = 1000 - e.posture; WORLD.scene.remove(e.mesh); ZE = keepZ; staggered = []; return { d: +d.toFixed(2), wasDrawn, dc }; };
  out.d24 = drain(24, true); out.d25drawn = drain(25, false); out.d25 = drain(25, true);
  out.live = PERK_LIVE.has('blade:25');
  // S2466: the first-person draw and sheathe are seen, not swapped in a frame: the hand left goes as a ghost (0.2 s), the new comes up (done by 0.56 s); a swing ends it
  { SWING = null; EQ.weapon = SWORD; drawWeapon(); FP_DRAW.now = () => 500; const ph = () => ({ ghost: !!FP_DRAW.ghost, run: FP_DRAW.t0 != null, fists: !!(vmSword && vmSword.userData.fists) });
    const at = (t) => { FP_DRAW.now = () => t; vmDraw(); return ph(); };
    sheathWeapon(); const sh = [ph(), at(500.1), at(500.25), at(500.6)];
    FP_DRAW.now = () => 600; drawWeapon(); const dr = [ph(), at(600.1), at(600.6)];
    FP_DRAW.now = () => 700; sheathWeapon(); drawWeapon(); SWING = { test: 1 }; at(700.05); const sw = ph(); SWING = null; FP_DRAW.now = null;
    out.fpDraw = { sh, dr, sw }; }
  Math.random = rnd; Object.assign(SKILLS, sk0); Object.assign(EQ, eq0); SHEATHED = false; buildViewmodel(); buildShieldViewmodel(); return out; });
console.log(JSON.stringify(r));
check(`H sheathes: the hand is empty (${r.afterH.meshes} meshes, as the fists' ${r.fistMeshes}; the sword's ${r.swordMeshes}), the sword and the shield still equipped`, r.afterH.sheathed && r.afterH.meshes === r.fistMeshes && r.swordMeshes !== r.fistMeshes && r.afterH.weapon && r.afterH.offhand, r);
check('H again draws it', !r.afterH2.sheathed && r.afterH2.meshes === r.swordMeshes, r.afterH2);
check('never sheathed on its own: still drawn 5.1 s and 60 s after the last swing with no foe about', !r.at51 && !r.at60, r);
check('a new weapon in hand is drawn', !r.swapped, r);
check('a swing from the sheath draws as it swings, and is the draw cut', r.d25.wasDrawn && r.d25.dc && !r.d25drawn.dc, r);
check(`Draw cut (Blade 25): the swing from the sheath drains ×2 posture (${r.d25.d} against ${r.d25drawn.d} drawn and ${r.d24.d} at Blade 24)`, r.d24.d > 0 && r.d24.d === r.d25drawn.d && Math.abs(r.d25.d / r.d25drawn.d - 2) < .01, r);
check('Draw cut is live on the Skills tab', r.live);
{ const D = r.fpDraw, k = p => (p.ghost ? 'G' : '-') + (p.run ? 'R' : '.') + (p.fists ? 'F' : 'W');
  check(`the first-person sheathe and draw are seen: the hand left goes as a ghost, the new one comes up, a swing ends it (${D.sh.map(k)} / ${D.dr.map(k)} / ${k(D.sw)})`,
    D.sh.map(k).join() === 'GRF,GRF,-RF,-.F' && D.dr.map(k).join() === 'GRW,GRW,-.W' && k(D.sw) === '-.W', D); }
// Session 2451: in third person on the new look a sheathed weapon is worn, not held: a sword at the hip (on the builder's spine05), a
// claymore across the back (spine02), the hand empty and the arms not in the fist-fighter's guard; the builder's body is carried over, not
// built again; drawn, it is back in the fist and the worn copy is gone (S2472: a blade's scabbard stays on, empty; a mace's nothing)
const tp = await page.evaluate(() => { const out = {}; const eq0 = { ...EQ }; thirdPerson = true; EQ.offhand = null;
  const wear = (shape, two) => { EQ.weapon = { name: 'Test ' + shape, type: 'weapon', atk: [10, 11], wType: 'slash', weaponShape: shape, twoHand: two, weight: 3 };
    SHEATHED = false; tpEnsure(); const kept = TP_HB.kept || 0, t0 = performance.now(); sheathWeapon(); tpEnsure(); const ms = performance.now() - t0, R = TP.rig, c = R.hbSheath; tpDrawEnd(R); /* S2471: the worn state, not the sheathe's 0.56 s */
    let near = null; if (c && R.rig.hb) { R.root.updateMatrixWorld(true); const p = c.getWorldPosition(new THREE.Vector3()), b = c.parent.getWorldPosition(new THREE.Vector3()); near = +p.distanceTo(b).toFixed(3); }
    let meshes = 0; if (c) c.traverse(o => { if (o.isMesh && o.visible) meshes++; });
    const r = { hb: !!R.rig.hb, bone: c && c.parent && c.parent.name, at: R.sheathAt, meshes, near, held: !!R.weapon, unarmed: R.unarmed, kept: (TP_HB.kept || 0) - kept, ms: Math.round(ms) };
    // S2456: a blade worn is in a scabbard: every point of the blade between its mouth and the point inside the leather's section there
    const sc = R.scabbard; r.scab = !!(sc && c && c.getObjectByName('scabbard'));
    if (sc) { let n = 0, out_ = 0, worst = 0; const W = R.sheathW, inv = new THREE.Matrix4().copy(W.matrixWorld).invert(), M = new THREE.Matrix4(), v = new THREE.Vector3(), L = sc.R.length - 3;
      W.traverse(m => { if (!m.isMesh) return; M.multiplyMatrices(inv, m.matrixWorld); const p = m.geometry.attributes.position, ix = m.geometry.index, nT = ix ? ix.count : p.count, at = k => ix ? ix.getX(k) : k, A = new THREE.Vector3(), B = new THREE.Vector3();
        /* S2459: along every triangle's edges, 5 mm apart, not its corners alone (the cutlass's long spine triangles stood out of a scabbard that held every corner) */
        const S = []; for (let t = 0; t + 2 < nT; t += 3) for (let e = 0; e < 3; e++) { A.fromBufferAttribute(p, at(t + e)).applyMatrix4(M); B.fromBufferAttribute(p, at(t + (e + 1) % 3)).applyMatrix4(M); const n = Math.max(1, Math.floor(A.distanceTo(B) / .005)); for (let k = 0; k < n; k++) S.push(A.clone().lerp(B, k / n)); }
        for (const q of S) { v.copy(q); if (v.y < sc.mouth || v.y > sc.tip) continue; n++;
        const f = (v.y - sc.mouth) / (sc.tip - sc.mouth) * L, i0 = Math.min(L - 1, Math.floor(f)), A = sc.R[i0], B = sc.R[i0 + 1], t = f - i0, ip = k => A[k] + (B[k] - A[k]) * t;
        const e = Math.max(Math.abs(v.x - ip('cx')) - ip('hw'), Math.abs(v.z - ip('cz')) - ip('ht')); if (e > .002) { out_++; worst = Math.max(worst, e); } } });
      r.blade = { n, out: out_, worst: +worst.toFixed(4), mouth: +sc.mouth.toFixed(3), tip: +sc.tip.toFixed(3), tris: sc.tris }; }
    // S2459: a blade at the hip hangs in a frog: a loop round the scabbard under the locket, its strap up the belt's outside and over its top
    const fr = c && c.getObjectByName('frog'); r.frog = null;
    if (fr) { const F = tpSheathFit(R.rig.hb), L = fr.userData.frog.line, top = L[2], yt = F.yBt - F.p5.y, xo = (F.xBelt || F.side) - F.p5.x;
      r.frog = { col: new THREE.Color().fromBufferAttribute(fr.geometry.attributes.color, 0).getHex(), belt: F.leather, tris: fr.userData.frog.tris, below: +(yt - L[0][1]).toFixed(3), topOff: +(top[1] - yt).toFixed(3), out: +(top[0] - xo).toFixed(4), hooked: L[4][1] < top[1] && L[4][0] < xo }; }
    drawWeapon(); tpEnsure(); tpDrawEnd(TP.rig); const S = TP.rig.hbSheath; r.drawn = { held: !!TP.rig.weapon, worn: !!S, scab: !!(S && S.getObjectByName('scabbard')), bladeShown: !!(S && S.children[0].visible), old: !!(c && c.parent) }; return r; };
  out.sword = wear('sword', false); out.claymore = wear('claymore', true); out.cutlass = wear('cutlass', false); out.mace = wear('mace', false);
  Object.assign(EQ, eq0); SHEATHED = false; thirdPerson = false; return out; });
console.log(JSON.stringify(tp));
if (tp.sword.hb) {
  check(`third person: a sheathed sword is worn at the hip on the builder's spine05 (${tp.sword.near} m from it, ${tp.sword.meshes} meshes), the hand empty and the arms out of the guard`, tp.sword.bone === 'spine05' && tp.sword.at === 'hip' && tp.sword.meshes > 0 && tp.sword.near < .4 && !tp.sword.held && !tp.sword.unarmed, tp.sword);
  check(`third person: a sheathed claymore is worn across the back on spine02 (${tp.claymore.near} m)`, tp.claymore.bone === 'spine02' && tp.claymore.at === 'back' && tp.claymore.meshes > 0 && tp.claymore.near < .6 && !tp.claymore.held, tp.claymore);
  check(`sheathing keeps the builder's body (carried over, ${tp.sword.ms} and ${tp.claymore.ms} ms)`, tp.sword.kept === 1 && tp.claymore.kept === 1, tp);
  check(`a sheathed blade is in a scabbard, the whole blade inside it (sword ${JSON.stringify(tp.sword.blade)}, claymore on the back, a curved cutlass); a mace through the belt has none`,
    ['sword', 'claymore', 'cutlass'].every(k => tp[k].scab && tp[k].blade && tp[k].blade.n > 20 && tp[k].blade.out === 0) && !tp.mace.scab && tp.mace.at === 'belt', tp);
  check(`a blade at the hip hangs in a frog: its loop under the belt (sword ${JSON.stringify(tp.sword.frog)}), the strap's top over the belt's and outside it, hooked behind; none on the back or for a mace`,
    ['sword', 'cutlass'].every(k => { const f = tp[k].frog; return f && f.tris > 50 && f.below > .02 && f.topOff > 0 && f.topOff < .012 && f.out > 0 && f.out < .006 && f.hooked; }) && !tp.claymore.frog && !tp.mace.frog, tp);
  check('drawn, it is in the fist again and the sheathed copy is gone; a blade leaves its scabbard on, empty (S2472), a mace nothing', ['sword', 'claymore', 'cutlass'].every(k => tp[k].drawn.held && tp[k].drawn.worn && tp[k].drawn.scab && !tp[k].drawn.bladeShown && !tp[k].drawn.old) && tp.mace.drawn.held && !tp.mace.drawn.worn, tp);
} else console.log('  (the old look: no builder body, the sheathed weapon is not drawn)');
// S2462: a claymore on the back hangs from a baldric: a strap skinned to the body, over the right shoulder (between the neck and the joint),
// across the chest to the left flank about the belt; the scabbard's axis lies in the strap's plane;
// in the walk the strap keeps to the body (each point's distance to the body point nearest it at the bind moves under 2 cm); drawn, it stays with the empty scabbard (S2472)
const bd = await page.evaluate(() => { const out = {}; const eq0 = { ...EQ }; thirdPerson = true; EQ.offhand = null;
  EQ.weapon = { name: 'Test claymore', type: 'weapon', atk: [10, 11], wType: 'slash', weaponShape: 'claymore', twoHand: true, weight: 3 };
  SHEATHED = false; tpEnsure(); sheathWeapon(); tpEnsure(); const R = TP.rig, H = R.rig.hb; if (!H) return { hb: false }; tpDrawEnd(R);
  const c = R.hbSheath, b = c && c.userData.baldric; out.hb = true; out.has = !!(b && b.isSkinnedMesh && b.parent && b.name === 'baldric'); if (!out.has) return out;
  const B = b.userData.baldric, sk = H.P.skeleton, bp = n => new THREE.Vector3().setFromMatrixPosition(new THREE.Matrix4().copy(sk.boneInverses[sk.bones.indexOf(H.P.byName[n])]).invert());
  const pa = b.geometry.attributes.position, F = tpSheathFit(H); let top = null, low = null;
  for (let i = 0; i < pa.count; i++) { const v = new THREE.Vector3().fromBufferAttribute(pa, i); if (!top || v.y > top.y) top = v; if (!low || v.y < low.y) low = v; }
  const S = bp('shoulder01.R'), N = bp('neck01');
  out.leather = { strap: new THREE.Color().fromBufferAttribute(b.geometry.attributes.color, 0).getHex(), belt: F.leather };
  out.top = { y: +(top.y - S.y).toFixed(3), x: +top.x.toFixed(3), between: top.x < N.x && top.x > S.x - .02 }; out.low = { x: +low.x.toFixed(3), dyB: +(low.y - F.yB).toFixed(3) }; out.tris = B.tris;
  // the scabbard's axis in the strap's plane, its leather on the strap
  const n = new THREE.Vector3(...B.n), o = new THREE.Vector3(...B.o), q = c.quaternion, d = new THREE.Vector3(0, 1, 0).applyQuaternion(q), p0 = c.position.clone().add(F.p2);
  out.plane = { d: +Math.abs(d.dot(n)).toFixed(4), off: +Math.abs(p0.clone().sub(o).dot(n)).toFixed(4) };
  // the walk: every strap point against the nearest body point at the bind, posed
  const body = H.full.filter(m => m.isSkinnedMesh && !/hair|brow|lash|cloak/.test(m.name) && m !== b), pairs = [], v = new THREE.Vector3(), w = new THREE.Vector3();
  for (let i = 0; i < pa.count; i += 4) { v.fromBufferAttribute(pa, i); let best = null, bd = 1e9; for (const m of body) { const p = m.geometry.attributes.position; for (let j = 0; j < p.count; j++) { const dd = v.distanceToSquared(w.fromBufferAttribute(p, j)); if (dd < bd) { bd = dd; best = [m, j]; } } } pairs.push([i, best, Math.sqrt(bd)]); }
  const drift = () => { R.root.updateMatrixWorld(true); let worst = 0; for (const [i, [m, j], d0] of pairs) { b.getVertexPosition(i, v); m.getVertexPosition(j, w); worst = Math.max(worst, Math.abs(v.distanceTo(w) - d0)); } return +worst.toFixed(4); };
  let t = performance.now(); const step = (k, mv) => { for (let i = 0; i < k; i++) { if (mv) { px -= Math.sin(yaw) * .025; pz -= Math.cos(yaw) * .025; } t += 16.7; tpUpdate(1 / 60, { moving: mv, sprinting: false, camY: 0, now: t, roll: null }); } };
  step(2, false); out.stand = drift(); let wk = 0; for (let k = 0; k < 4; k++) { step(9, true); wk = Math.max(wk, drift()); } out.walk = wk;
  drawWeapon(); tpEnsure(); tpDrawEnd(TP.rig); const S2 = TP.rig.hbSheath, b2 = S2 && S2.userData.baldric; out.drawn = { gone: !b.parent, worn: !!S2, bald: !!(b2 && b2.parent && b2 !== b), bladeShown: !!(S2 && S2.children[0].visible) };
  Object.assign(EQ, eq0); SHEATHED = false; thirdPerson = false; return out; });
console.log(JSON.stringify(bd));
if (bd.hb) {
  check(`a claymore on the back hangs from a baldric skinned to the body (${bd.tris} tris): over the right shoulder between the neck and the joint (top ${JSON.stringify(bd.top)}), down to the left flank about the belt (${JSON.stringify(bd.low)})`,
    bd.has && bd.tris > 500 && bd.top.between && bd.top.y > -.02 && bd.low.x > .08 && Math.abs(bd.low.dyB) < .15, bd);
  check(`the scabbard lies in the strap's plane (axis ${bd.plane && bd.plane.d}, ${bd.plane && bd.plane.off} m off it)`, bd.plane && bd.plane.d < .01 && bd.plane.off < .01, bd);
  check(`in the walk the strap keeps to the body: its points move from the body's nearest by ${bd.walk} m at worst (standing ${bd.stand})`, bd.walk < .02 && bd.stand < .02, bd);
  check('drawn, the baldric stays on with the empty scabbard (S2472)', bd.drawn.gone && bd.drawn.worn && bd.drawn.bald && !bd.drawn.bladeShown, bd);
  // S2463: the frog and the baldric are cut from the wearer's own belt leather
  check(`the frog and the baldric are the belt's leather (belt ${bd.leather.belt}, strap ${bd.leather.strap}, the sword's frog ${tp.sword.frog && tp.sword.frog.col})`,
    bd.leather.belt != null && bd.leather.strap === bd.leather.belt && ['sword', 'cutlass'].every(k => tp[k].frog && tp[k].frog.col === tp[k].frog.belt), { bd: bd.leather, sword: tp.sword.frog });
}
check('no page errors', g.errs.length === 0, g.errs);
// Session 2471: the third-person draw and sheathe are seen (S2466's owed note: the worn copy swapped to the fist in one frame). Drawing, the
// worn group stays on the body with its blade hidden while the builder's grip goes to the hilt, and the blade is carried out from it to the
// fist; sheathing, the blade rides from the fist to the scabbard by 0.3 s and is in it again; both are over by 0.56 s; a swing ends it
const dw = await page.evaluate(() => { const eq0 = { ...EQ }; thirdPerson = true; EQ.offhand = null;
  EQ.weapon = { name: 'Test sword', type: 'weapon', atk: [10, 11], wType: 'slash', weaponShape: 'sword', weight: 3 };
  let t = performance.now(); const step = () => { t += 16.7; tpUpdate(1 / 60, { moving: false, sprinting: false, camY: 0, now: t, roll: null }); };
  SHEATHED = false; FP_DRAW.now = () => 100; tpEnsure(); step(); if (!TP.rig.rig.hb) { thirdPerson = false; FP_DRAW.now = null; return { hb: false }; }
  const at = (tt) => { FP_DRAW.now = () => tt; step(); const R = TP.rig, D = R.tpDraw, H = R.rig.hb; if (!D) return { on: false };
    const k = D.G.children[0], hilt = k.getWorldPosition(new THREE.Vector3()), fg = [2, 3, 4, 5].map(f => H.P.byName[`finger${f}-2.${HBODY.swap ? 'L' : 'R'}`]), gp = new THREE.Vector3();
    fg.forEach(b => gp.add(b.getWorldPosition(new THREE.Vector3()))); gp.multiplyScalar(1 / fg.length);
    const h = D.h || R.hbHeld.find(x => x.o === R.weapon), cp = h ? h.c.getWorldPosition(new THREE.Vector3()) : null;
    const hw = D.way === 'draw' ? R.weapon : D.a, qh = hw ? R.handR.getWorldQuaternion(new THREE.Quaternion()).multiply(hw.quaternion) : null, qk = k.getWorldQuaternion(new THREE.Quaternion());
    return { on: true, way: D.way, bladeShown: k.visible, turn: qh ? +(2 * Math.acos(Math.min(1, Math.abs(qh.dot(qk))))).toFixed(3) : null, carried: !!(h && h.c.parent), grip: +gp.distanceTo(hilt).toFixed(3), car: cp ? +cp.distanceTo(hilt).toFixed(3) : null, worn: !!D.G.parent }; };
  const out = {}; sheathWeapon(); tpEnsure(); out.sh = [at(100), at(100.1), at(100.32), at(100.6)]; out.shEnd = { shown: TP.rig.hbSheath.children[0].visible, held: TP.rig.hbHeld.length };
  FP_DRAW.now = () => 200; drawWeapon(); tpEnsure(); const G = TP.rig.tpDraw && TP.rig.tpDraw.G; out.dr = [at(200), at(200.2), at(200.4), at(200.6)]; out.drGone = !!G && G === TP.rig.hbSheath && !!G.parent && !G.children[0].visible;
  FP_DRAW.now = () => 300; sheathWeapon(); tpEnsure(); drawWeapon(); tpEnsure(); SWING = { test: 1 }; out.sw = at(300.05); SWING = null;
  Object.assign(EQ, eq0); SHEATHED = false; tpEnsure(); FP_DRAW.now = null; thirdPerson = false; return out; });
console.log(JSON.stringify(dw));
if (dw.hb !== false) {
  const [s0, s1, s3, s6] = dw.sh, [d0, d2, d4, d6] = dw.dr;
  check(`third person: the sheathe carries the blade from the fist (${s0.car} m from the scabbard) into the scabbard by 0.32 s (${s1.car} m at 0.1 s), shown there again; over by 0.56 s`,
    s0.on && s0.way === 'sheathe' && s0.carried && !s0.bladeShown && s0.car > .2 && s1.car < s0.car && s3.on && !s3.carried && s3.bladeShown && !s6.on && dw.shEnd.shown && dw.shEnd.held === 0, dw);
  check(`third person: the draw takes the grip to the hilt (${d2.grip} m at 0.2 s, ${d0.grip} at the start) with the worn group still on and the blade in it, then carries it out (${d4.car} m at 0.4 s); over by 0.56 s, the scabbard left on, empty`,
    d0.on && d0.way === 'draw' && d0.worn && !d0.bladeShown && d0.car === 0 && d2.grip < .06 && d2.grip < d0.grip && d4.car > .05 && !d6.on && dw.drGone, dw);
  check('third person: a swing ends the draw at once', !dw.sw.on, dw.sw);
  // Session 2478: the hand takes the hilt in its grip (S2471's note: it arrived palm up): at the hilt the wrist holds the blade's way as the worn blade lies
  check(`third person: at the hilt the hand is turned to take the grip, the blade's way in the fist within 0.5 rad of the worn blade's (about 1.7 before) (${d2.turn} at 0.2 s of the draw; ${s3.turn} at 0.32 s of the sheathe)`, d2.turn != null && d2.turn < .5 && s3.turn != null && s3.turn < .5, dw);
}
// Session 2484: the claymore's left hand on the draw (S2479's owed note: tpGripL kept the left wrist on the driver's blade, which the reach
// carried up behind the right shoulder, so the left hand rose empty to the shoulder while the blade was still in its scabbard). While the right
// hand reaches, the left stays below the shoulders; it takes the seen blade's grip as the blade comes down; sheathing,
// it lets go by 0.15 s
const lh = await page.evaluate(() => { const eq0 = { ...EQ }; thirdPerson = true; EQ.offhand = null;
  EQ.weapon = { name: 'Test claymore', type: 'weapon', atk: [10, 11], wType: 'slash', weaponShape: 'claymore', twoHand: true, weight: 3 };
  let t = performance.now(); const step = () => { t += 16.7; tpUpdate(1 / 60, { moving: false, sprinting: false, camY: 0, now: t, roll: null }); };
  SHEATHED = false; FP_DRAW.now = () => 100; tpEnsure(); step(); if (!TP.rig.rig.hb) { thirdPerson = false; FP_DRAW.now = null; return { hb: false }; }
  const gl = TP.rig.gripL.clone(), V = () => new THREE.Vector3();
  const at = (tt) => { FP_DRAW.now = () => tt; step(); step(); const R = TP.rig, D = R.tpDraw, H = R.rig.hb; if (!D) return { on: false };
    const fg = [2, 3, 4, 5].map(f => H.P.byName[`finger${f}-2.${HBODY.swap ? 'R' : 'L'}`]), lp = V(); fg.forEach(b => lp.add(b.getWorldPosition(V()))); lp.multiplyScalar(1 / fg.length);
    const h = D.h || R.hbHeld.find(x => x.o === R.weapon); h.c.updateMatrixWorld(true); const gp = gl.clone().applyMatrix4(h.c.matrixWorld);
    return { on: true, lw: D.lw, lerr: D.lerr, seen: +lp.distanceTo(gp).toFixed(3), under: +(R.shR.getWorldPosition(V()).y - R.handL.getWorldPosition(V()).y).toFixed(3) }; };
  const out = { hb: true }; sheathWeapon(); tpEnsure(); out.sh = [at(100), at(100.05), at(100.15)];
  FP_DRAW.now = () => 200; drawWeapon(); tpEnsure(); out.dr = [at(200.1), at(200.2), at(200.4), at(200.5)];
  FP_DRAW.now = () => 201; for (let i = 0; i < 20; i++) step(); out.hold = TP.rig.gMiss; out.holdOn = !TP.rig.tpDraw;
  Object.assign(EQ, eq0); SHEATHED = false; tpEnsure(); FP_DRAW.now = null; thirdPerson = false; return out; });
console.log(JSON.stringify(lh));
if (lh.hb) {
  const [d1, d2, d4, d5] = lh.dr, [s0, , s15] = lh.sh;
  check(`third person, a claymore drawn: the left hand stays below the shoulders while the right reaches (${d1.under} and ${d2.under} m under at 0.1 and 0.2 s; it was at the shoulder), takes the seen grip by 0.4 s (${d4.seen} m from it, its fingers to the grip's left mark) and keeps it (${d5.seen} m at 0.5 s; 0.28 in the hold after)`,
    d1.on && d1.lw === 0 && d2.lw === 0 && d1.under > .25 && d2.under > .25 && d4.lw === 1 && d4.seen < .35 && d5.lw === 1 && d5.seen < .3, lh);
  // Session 2485: held, the builder's left fingers on the seen blade's left grip mark (S2484's note: 0.31 m under it, holding nothing; tpHBGripL)
  check(`third person, a claymore held: the builder's left hand is on the seen grip (${lh.hold && lh.hold.after} m from the mark; ${lh.hold && lh.hold.before} m as the driver put it)`,
    lh.holdOn && lh.hold && lh.hold.before > .2 && lh.hold.after < .03 && lh.hold.w === 1, lh.hold);
  // Session 2489: the left fist closed round the grip (S2485's note: placed, not turned): the knuckles' line along the blade, the curl's middle on the mark
  check(`third person, a claymore held: the left fist is turned round the grip, its knuckles' line ${lh.hold && lh.hold.kAng} rad off the blade (0.68 before)`,
    lh.hold && lh.hold.kAng != null && lh.hold.kAng < .25, lh.hold);
  // Session 2499: the right fist turned the same way (S2489's note: its knuckles' line 0.42 rad off the blade, the driver's wrist carried across)
  check(`third person, a claymore held: the right fist is turned round the grip too, its knuckles' line ${lh.hold && lh.hold.kAngR} rad off the blade (0.42 before)`,
    lh.hold && lh.hold.kAngR != null && lh.hold.kAngR < .25, lh.hold);
  check(`third person, a claymore sheathed: the left hand leaves the grip (${s0.lw} at the start, ${s15.lw} by 0.15 s)`, s0.on && s0.lw === 1 && s15.lw === 0, lh);
}
// Session 2478: under a cloak a sword at the hip lifts the sheet (S2451's note: its hilt was lost inside the cloak and the scabbard's point
// stood out through its back). In the bind's metres every point of the worn group (blade, scabbard, frog) has the sheet at its bearing and
// height (within 2.5 cm across and up) standing outside it; a mace drawn wears nothing at the hip and the sheet is back on its own points
const ct = await page.evaluate(() => { const eq0 = { ...EQ }; thirdPerson = true; EQ.offhand = null; EQ.back = { name: 'Wool Cloak', slot: 'back', cloak: 'wool' };
  EQ.weapon = { name: 'Test sword', type: 'weapon', atk: [10, 11], wType: 'slash', weaponShape: 'sword', weight: 3 };
  SHEATHED = false; tpEnsure(); sheathWeapon(); tpEnsure(); const R = TP.rig, H = R.rig.hb; if (!H) { thirdPerson = false; return { hb: false }; } tpDrawEnd(R);
  const out = { hb: true, tent: R.cloakTent }, sk = H.P.skeleton, c = R.hbSheath, b = c.parent, bind = new THREE.Matrix4().copy(sk.boneInverses[sk.bones.indexOf(b)]).invert();
  R.root.updateMatrixWorld(true); const toB = new THREE.Matrix4().multiplyMatrices(bind, new THREE.Matrix4().copy(b.matrixWorld).invert()), o = new THREE.Vector3().setFromMatrixPosition(bind), M = new THREE.Matrix4(), v = new THREE.Vector3();
  const sheet = H.full.find(m => m.isSkinnedMesh && m.name === 'cloak'), A = sheet.geometry.attributes.position, S = [];
  for (let j = 0; j < A.count; j++) { const x = A.getX(j) - o.x, z = A.getZ(j) - o.z; S.push([Math.atan2(x, z), A.getY(j), Math.hypot(x, z)]); }
  let n = 0, cov = 0, inside = 0, worst = 0;
  c.traverse(m => { if (!m.isMesh || !m.visible) return; M.multiplyMatrices(toB, m.matrixWorld); const p = m.geometry.attributes.position;
    for (let j = 0; j < p.count; j += 3) { v.fromBufferAttribute(p, j).applyMatrix4(M); const x = v.x - o.x, z = v.z - o.z, r = Math.hypot(x, z), th = Math.atan2(x, z); n++;
      let near = null; for (const q of S) { let d = q[0] - th; d -= 2 * Math.PI * Math.round(d / (2 * Math.PI)); if (Math.abs(d * r) < .025 && Math.abs(q[1] - v.y) < .025 && (!near || q[2] < near)) near = q[2]; }
      if (near == null) continue; cov++; if (near < r) { inside++; worst = Math.max(worst, r - near); } } });
  out.sword = { n, cov, inside, worst: +worst.toFixed(4) };
  EQ.weapon = { name: 'Test mace', type: 'weapon', atk: [10, 11], wType: 'blunt', weaponShape: 'mace', weight: 3 }; SHEATHED = false; tpEnsure(); tpDrawEnd(TP.rig);
  const H2 = TP.rig.rig.hb, sh2 = H2 && H2.full.find(m => m.isSkinnedMesh && m.name === 'cloak'), u = sh2 && sh2.geometry.userData;
  out.mace = { worn: !!TP.rig.hbSheath, kept: H2 === H, back: !!(u && u.tent0 && !u.tent && sh2.geometry.attributes.position.array.every((x, i) => x === u.tent0[i])) };
  Object.assign(EQ, eq0); SHEATHED = false; tpEnsure(); thirdPerson = false; return out; });
console.log(JSON.stringify(ct));
if (ct.hb) {
  check(`under a cloak the sheathed sword lifts the sheet (${ct.tent && ct.tent.moved} points, ${ct.tent && ct.tent.most} m at most): every worn point with sheet at its bearing and height has the sheet outside it (${JSON.stringify(ct.sword)})`,
    ct.tent && ct.tent.moved > 50 && ct.sword.cov > 100 && ct.sword.inside === 0, ct);
  check('a mace drawn wears nothing at the hip, and the sheet of the body carried over is back on its own points', !ct.mace.worn && ct.mace.kept && ct.mace.back, ct.mace);
}
// Session 2515: the draw and the sheathe are heard. Three voices by how the thing is worn (a blade from its scabbard, a hafted weapon from
// the belt's frog, a staff or wand in wood), each sounding on the audio clock; H, the idle sheathe and a swing from the sheath all sound;
// a new weapon taken in hand while sheathed does not (it is not drawn, it is changed)
const au = await page.evaluate(() => { const out = { err: null }; const eq0 = { ...EQ };
  try { initAudio(); } catch (e) { out.err = 'init ' + e.message; }
  out.ax = !!AX; out.vol = volLevel;
  let nodes = 0; const cs = AX && AX.createBufferSource.bind(AX), co = AX && AX.createOscillator.bind(AX);
  if (AX) { AX.createBufferSource = () => { nodes++; return cs(); }; AX.createOscillator = () => { nodes++; return co(); }; }
  const W = (shape, extra) => ({ name: 'Test ' + shape, type: 'weapon', atk: [10, 11], wType: 'slash', weaponShape: shape, weight: 3, ...extra });
  const hear = (fn) => { const n0 = DRAW_SND.n, k0 = nodes; try { fn(); } catch (e) { out.err = e.message; } return { calls: DRAW_SND.n - n0, nodes: nodes - k0, last: DRAW_SND.last }; };
  const one = (it) => { SWING = null; EQ.weapon = it; SHEATHED = false; const sh = hear(() => toggleSheath()), dr = hear(() => toggleSheath());
    return { sh: sh.calls + ':' + (sh.last && sh.last.kind + '/' + sh.last.voice), dr: dr.calls + ':' + (dr.last && dr.last.kind + '/' + dr.last.voice), nodes: [sh.nodes, dr.nodes] }; };
  out.sword = one(W('sword')); out.dagger = one(W('dagger', { wType: 'pierce' })); out.claymore = one(W('claymore', { twoHand: true }));
  out.mace = one(W('mace', { wType: 'blunt' })); out.staff = one(W('staff', { wType: 'blunt', implement: 'staff', twoHand: true }));
  const keepZ = ZE; ZE = []; EQ.weapon = W('sword'); SHEATHED = false; SWING = null;
  _lastSwingG = playClockS - 5.1; out.idle = hear(() => tickSheath()); out.idle.sheathed = SHEATHED;
  sheathWeapon(); out.swing = hear(() => { beginSwing(false); }); /* S2659: sheathed by H now, not by the idle */ out.swing.drawn = !SHEATHED; swingCancel();
  sheathWeapon(); out.swap = hear(() => { EQ.weapon = W('sword', { name: 'Other Sword' }); tickSheath(); }); out.swap.sheathed = SHEATHED;
  ZE = keepZ; if (AX) { AX.createBufferSource = cs; AX.createOscillator = co; } Object.assign(EQ, eq0); SHEATHED = false; buildViewmodel(); return out; });
console.log(JSON.stringify(au));
check(`the draw and the sheathe are heard by how the thing is worn: sword ${au.sword.sh} ${au.sword.dr}, mace ${au.mace.sh} ${au.mace.dr}, staff ${au.staff.sh} ${au.staff.dr}`,
  !au.err && au.sword.sh === '1:sheathe/blade' && au.sword.dr === '1:draw/blade' && au.dagger.dr === '1:draw/blade' && au.claymore.dr === '1:draw/blade'
  && au.mace.sh === '1:sheathe/haft' && au.mace.dr === '1:draw/haft' && au.staff.sh === '1:sheathe/wood' && au.staff.dr === '1:draw/wood', au);
check(`each sounds on the audio clock (nodes made: sword ${au.sword.nodes}, mace ${au.mace.nodes}, staff ${au.staff.nodes})`,
  au.ax && au.vol > 0 && [au.sword, au.dagger, au.claymore, au.mace, au.staff].every(o => o.nodes[0] >= 2 && o.nodes[1] >= 2), au);
check('idle, nothing is sheathed or heard; a swing from the sheath sounds; a new weapon taken in hand while sheathed does not',
  au.idle.calls === 0 && !au.idle.sheathed && au.swing.calls === 1 && au.swing.drawn && au.swing.last.kind === 'draw'
  && au.swap.calls === 0 && !au.swap.sheathed, au);
await g.close();
