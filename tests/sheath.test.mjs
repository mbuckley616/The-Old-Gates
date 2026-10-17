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
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
