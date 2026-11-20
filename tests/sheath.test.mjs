// The sheath and Draw cut (Blade 25; Session 1080, Michael's A on DECISION #399 and his note: "a 'sheath' button where you can
// sheath your equipped weapon. Torches or shields in your off hand stay equipped and in hand"). H sheathes and draws; a drawn
// weapon is sheathed on its own after 5 s with no swing and no alert foe within 14 m; sheathed, the first-person hand is empty and
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
  // on its own: no foe about, 5 s after the last swing
  ZE = []; _lastSwingG = playClockS - 4.9; tickSheath(); out.at49 = SHEATHED; _lastSwingG = playClockS - 5.1; tickSheath(); out.at51 = SHEATHED; drawWeapon();
  // not with an alert foe within 14 m
  const mk = (d) => { const e = buildZoneEnemy(WORLD.scene, [], px + fwdX * d, pz + fwdZ * d, 'Bandit', null); if (!e.mesh.parent) WORLD.scene.add(e.mesh);
    e.locked = false; e.alert = true; e.spd = 0; e.atkCd = 1e9; e.rng = null; e.hp = e.maxHp = 1000; e.def = 0; e.resist = {};
    e.combatYaw = Math.atan2(px - e.x, pz - e.z); if (typeof e.posture !== 'number') initPosture(e); e.posture = e.maxPosture = 1000; return e; };
  const near = mk(10); ZE = [near]; _lastSwingG = playClockS - 6; tickSheath(); out.foeNear = SHEATHED; WORLD.scene.remove(near.mesh);
  const far = mk(16); ZE = [far]; tickSheath(); out.foeFar = SHEATHED; WORLD.scene.remove(far.mesh); drawWeapon();
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
  Math.random = rnd; Object.assign(SKILLS, sk0); Object.assign(EQ, eq0); SHEATHED = false; buildViewmodel(); buildShieldViewmodel(); return out; });
console.log(JSON.stringify(r));
check(`H sheathes: the hand is empty (${r.afterH.meshes} meshes, as the fists' ${r.fistMeshes}; the sword's ${r.swordMeshes}), the sword and the shield still equipped`, r.afterH.sheathed && r.afterH.meshes === r.fistMeshes && r.swordMeshes !== r.fistMeshes && r.afterH.weapon && r.afterH.offhand, r);
check('H again draws it', !r.afterH2.sheathed && r.afterH2.meshes === r.swordMeshes, r.afterH2);
check('on its own after 5 s with no swing and no foe about (not at 4.9 s)', !r.at49 && r.at51, r);
check('not while an alert foe is within 14 m (10 m); one at 16 m does not hold it', !r.foeNear && r.foeFar, r);
check('a new weapon in hand is drawn', !r.swapped, r);
check('a swing from the sheath draws as it swings, and is the draw cut', r.d25.wasDrawn && r.d25.dc && !r.d25drawn.dc, r);
check(`Draw cut (Blade 25): the swing from the sheath drains ×2 posture (${r.d25.d} against ${r.d25drawn.d} drawn and ${r.d24.d} at Blade 24)`, r.d24.d > 0 && r.d24.d === r.d25drawn.d && Math.abs(r.d25.d / r.d25drawn.d - 2) < .01, r);
check('Draw cut is live on the Skills tab', r.live);
// Session 2451: in third person on the new look a sheathed weapon is worn, not held: a sword at the hip (on the builder's spine05), a
// claymore across the back (spine02), the hand empty and the arms not in the fist-fighter's guard; the builder's body is carried over, not
// built again; drawn, it is back in the fist and the worn copy is gone
const tp = await page.evaluate(() => { const out = {}; const eq0 = { ...EQ }; thirdPerson = true; EQ.offhand = null;
  const wear = (shape, two) => { EQ.weapon = { name: 'Test ' + shape, type: 'weapon', atk: [10, 11], wType: 'slash', weaponShape: shape, twoHand: two, weight: 3 };
    SHEATHED = false; tpEnsure(); const kept = TP_HB.kept || 0, t0 = performance.now(); sheathWeapon(); tpEnsure(); const ms = performance.now() - t0, R = TP.rig, c = R.hbSheath;
    let near = null; if (c && R.rig.hb) { R.root.updateMatrixWorld(true); const p = c.getWorldPosition(new THREE.Vector3()), b = c.parent.getWorldPosition(new THREE.Vector3()); near = +p.distanceTo(b).toFixed(3); }
    let meshes = 0; if (c) c.traverse(o => { if (o.isMesh && o.visible) meshes++; });
    const r = { hb: !!R.rig.hb, bone: c && c.parent && c.parent.name, at: R.sheathAt, meshes, near, held: !!R.weapon, unarmed: R.unarmed, kept: (TP_HB.kept || 0) - kept, ms: Math.round(ms) };
    // S2456: a blade worn is in a scabbard: every point of the blade between its mouth and the point inside the leather's section there
    const sc = R.scabbard; r.scab = !!(sc && c && c.getObjectByName('scabbard'));
    if (sc) { let n = 0, out_ = 0, worst = 0; const W = R.sheathW, inv = new THREE.Matrix4().copy(W.matrixWorld).invert(), M = new THREE.Matrix4(), v = new THREE.Vector3(), L = sc.R.length - 3;
      W.traverse(m => { if (!m.isMesh) return; M.multiplyMatrices(inv, m.matrixWorld); const p = m.geometry.attributes.position; for (let i = 0; i < p.count; i++) { v.fromBufferAttribute(p, i).applyMatrix4(M); if (v.y < sc.mouth || v.y > sc.tip) continue; n++;
        const f = (v.y - sc.mouth) / (sc.tip - sc.mouth) * L, i0 = Math.min(L - 1, Math.floor(f)), A = sc.R[i0], B = sc.R[i0 + 1], t = f - i0, ip = k => A[k] + (B[k] - A[k]) * t;
        const e = Math.max(Math.abs(v.x - ip('cx')) - ip('hw'), Math.abs(v.z - ip('cz')) - ip('ht')); if (e > .002) { out_++; worst = Math.max(worst, e); } } });
      r.blade = { n, out: out_, worst: +worst.toFixed(4), mouth: +sc.mouth.toFixed(3), tip: +sc.tip.toFixed(3), tris: sc.tris }; }
    drawWeapon(); tpEnsure(); r.drawn = { held: !!TP.rig.weapon, worn: !!TP.rig.hbSheath, old: !!(c && c.parent) }; return r; };
  out.sword = wear('sword', false); out.claymore = wear('claymore', true); out.cutlass = wear('cutlass', false); out.mace = wear('mace', false);
  Object.assign(EQ, eq0); SHEATHED = false; thirdPerson = false; return out; });
console.log(JSON.stringify(tp));
if (tp.sword.hb) {
  check(`third person: a sheathed sword is worn at the hip on the builder's spine05 (${tp.sword.near} m from it, ${tp.sword.meshes} meshes), the hand empty and the arms out of the guard`, tp.sword.bone === 'spine05' && tp.sword.at === 'hip' && tp.sword.meshes > 0 && tp.sword.near < .4 && !tp.sword.held && !tp.sword.unarmed, tp.sword);
  check(`third person: a sheathed claymore is worn across the back on spine02 (${tp.claymore.near} m)`, tp.claymore.bone === 'spine02' && tp.claymore.at === 'back' && tp.claymore.meshes > 0 && tp.claymore.near < .6 && !tp.claymore.held, tp.claymore);
  check(`sheathing keeps the builder's body (carried over, ${tp.sword.ms} and ${tp.claymore.ms} ms)`, tp.sword.kept === 1 && tp.claymore.kept === 1, tp);
  check(`a sheathed blade is in a scabbard, the whole blade inside it (sword ${JSON.stringify(tp.sword.blade)}, claymore on the back, a curved cutlass); a mace through the belt has none`,
    ['sword', 'claymore', 'cutlass'].every(k => tp[k].scab && tp[k].blade && tp[k].blade.n > 20 && tp[k].blade.out === 0) && !tp.mace.scab && tp.mace.at === 'belt', tp);
  check('drawn, it is in the fist again and the worn copy is gone', ['sword', 'claymore'].every(k => tp[k].drawn.held && !tp[k].drawn.worn && !tp[k].drawn.old), tp);
} else console.log('  (the old look: no builder body, the sheathed weapon is not drawn)');
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
