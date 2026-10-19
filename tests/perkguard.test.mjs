// Guard's and Armour's lines under combat's resolver (Session 1047; skills and perks A, the build sheet's rows and its ≤1%
// rule, left by Session 953 until the resolver merged). The parry window is Guard's, 160 ms + 1 ms a level (the sheet's
// `perkguard`: 160 and 260 ms at Guard 0 and 100, never under 150), Finesse out of it. Resolve takes 1% a point off a
// block's stamina (was 5%). Worn armour's def counts × (0.75 + 0.5 × Armour/100).
// Session 1048, Guard's perks: Deflect (25) a held shield turns arrows; Bulwark (50) a bash drains +50% posture; Second
// parry (100) within 0.4 s of a perfect parry the next is perfect too. Iron wall (75) is live since Session 1136, with the foes'
// heavy blow (`heavyblow`).
import { boot, check } from './lib/game.mjs';
const g = await boot(); const { page } = g;
await g.intoWorld();
const r = await page.evaluate(() => {
  const out = {}; const sk0 = JSON.parse(JSON.stringify(SKILLS)), at0 = { ...ATTRS }, eq0 = { ...EQ };
  const set = (id, lv) => { SKILLS[id] = { lv, p: 0 }; };
  const mk = () => { const e = buildZoneEnemy(WORLD.scene, [], px + fwdX, pz + fwdZ, 'Bandit', null); if (!e.mesh.parent) WORLD.scene.add(e.mesh);
    e.alert = true; e.spd = 0; if (typeof e.posture !== 'number') initPosture(e); return e; };
  const drop = (e) => { WORLD.scene.remove(e.mesh); staggered = staggered.filter(s => s.e !== e); };
  const reset = () => { PHP = maxHP; PPOST.posture = PPOST.maxPosture; PPOST.stagUntil = 0; ROLL = null; stamina = 100; staminaCD = 0; ACTIVE_BUFFS.length = 0; _lastParryG = -1e9; };
  // a 20-point blow with the block raised `ago` seconds before it on the play clock
  const blow = (ago, raw = 20) => { reset(); const e = mk(); const now = performance.now();
    blocking = ago != null; lastBlockAttemptT = now / 1000 - (ago == null ? 9 : ago); lastBlockAttemptG = playClockS - (ago == null ? 9 : ago);
    executeStrike(e, raw, now); blocking = false; const o = { parry: typeof e._ripUntil === 'number' && e._ripUntil > 0, hp: maxHP - PHP, st: +(100 - stamina).toFixed(2) };
    drop(e); return o; };
  ATTRS.finesse = 0; ATTRS.resolve = 0;
  for (const lv of [0, 5, 100]) { set('guard', lv); out['w' + lv] = +(parryWindowS() * 1000).toFixed(1); }
  set('guard', 0); out.g0_155 = blow(.155).parry; out.g0_170 = blow(.170).parry;
  set('guard', 100); out.g100_250 = blow(.250).parry; out.g100_270 = blow(.270).parry;
  ATTRS.finesse = 60; set('guard', 0); out.fin60_170 = blow(.170).parry; ATTRS.finesse = 0;
  // Resolve: a held block of a 40-point blow, unarmoured, no shield
  for (const k of Object.keys(EQ)) EQ[k] = null;
  for (const rs of [0, 10, 50, 90]) { ATTRS.resolve = rs; out['r' + rs] = blow(5, 40).st; }
  ATTRS.resolve = 0;
  // Armour: five pieces of 10, and what a 40-point blow keeps through them (armourShare, which foeBlow reads)
  for (const k of ['head', 'chest', 'hands', 'legs', 'feet']) EQ[k] = { name: 'Test ' + k, type: 'armor', def: 10, weight: 1 };
  for (const lv of [5, 50, 100]) { set('armour', lv); out['a' + lv] = +_armour().toFixed(2); out['hit' + lv] = +armourShare(40).toFixed(2); }
  Object.assign(EQ, eq0); Object.assign(ATTRS, at0); for (const k in sk0) SKILLS[k] = sk0[k]; reset(); return out; });
console.log(JSON.stringify(r));
check(`the parry window is ${r.w0}, ${r.w5} and ${r.w100} ms at Guard 0, 5 and 100 (160 + 1 a level, never under 150)`, r.w0 === 160 && r.w5 === 165 && r.w100 === 260, r);
check('at Guard 0 a block raised 155 ms before the blow parries, 170 ms is a held block', r.g0_155 && !r.g0_170, r);
check('at Guard 100, 250 ms parries and 270 ms does not', r.g100_250 && !r.g100_270, r);
check('Finesse is out of it: Finesse 60 at Guard 0 still holds a 170 ms block', !r.fin60_170, r);
check(`a held block of 40 costs ${r.r0}, ${r.r10}, ${r.r50} and ${r.r90} stamina at Resolve 0, 10, 50, 90 (−1% a point, floored at half)`,
  r.r0 > 0 && Math.abs(r.r10 / r.r0 - .9) < .06 && Math.abs(r.r50 / r.r0 - .5) < .06 && Math.abs(r.r90 / r.r0 - .5) < .06, r);
check(`five pieces of 10 count ${r.a5}, ${r.a50} and ${r.a100} at Armour 5, 50 and 100`, r.a5 === 38.75 && r.a50 === 50 && r.a100 === 62.5, r);
check(`a blow of 40 keeps ${r.hit5}, ${r.hit50} and ${r.hit100} through them`, r.hit5 > r.hit50 && r.hit50 > r.hit100, r);

const p = await page.evaluate(() => {
  const out = {}; const sk0 = JSON.parse(JSON.stringify(SKILLS)), eq0 = { ...EQ };
  const set = (id, lv) => { SKILLS[id] = { lv, p: 0 }; };
  const mk = (d = 1) => { const e = buildZoneEnemy(WORLD.scene, [], px + fwdX * d, pz + fwdZ * d, 'Bandit', null); if (!e.mesh.parent) WORLD.scene.add(e.mesh);
    e.alert = true; e.spd = 0; e.locked = false; if (typeof e.posture !== 'number') initPosture(e); return e; };
  const drop = (e) => { WORLD.scene.remove(e.mesh); const i = ZE.indexOf(e); if (i >= 0) ZE.splice(i, 1); staggered = staggered.filter(s => s.e !== e); };
  const reset = () => { PHP = maxHP; PPOST.posture = PPOST.maxPosture; PPOST.stagUntil = 0; ROLL = null; stamina = 100; staminaCD = 0; atkCd = 0; ACTIVE_BUFFS.length = 0; };
  const shield = { name: 'Test Shield', type: 'shield', shieldType: 'shield', def: 0, block: .65, weight: 4 };
  // an arrow from a Bandit 6 m in front, laid 0.3 m short of you, and one tick of the arrows
  const arrow = (guardLv, withShield, block) => { reset(); set('guard', guardLv); EQ.offhand = withShield ? shield : null; const e = mk(6); blocking = block;
    const ax = px + fwdX * .3, az = pz + fwdZ * .3; const m = new THREE.Mesh(new THREE.BoxGeometry(.05, .05, .7)); WORLD.scene.add(m);
    ZARROWS.push({ m, x: ax, z: az, y: activeTerrainH(ax, az) + 1, vx: -fwdX * 17, vz: -fwdZ * 17, life: 1.6, dmg: 12, from: e, sc: WORLD.scene });
    tickZoneArrows(1 / 60, performance.now()); blocking = false; const o = { hp: maxHP - PHP, left: ZARROWS.length }; drop(e); return o; };
  out.d24 = arrow(24, true, true); out.d25 = arrow(25, true, true); out.d25bare = arrow(25, false, true); out.d25open = arrow(25, true, false);
  // a bare-handed bash on a Bandit 1 m in front: the posture it takes
  const bash = (guardLv) => { reset(); set('guard', guardLv); EQ.offhand = null; const e = mk(1); e.maxPosture = e.posture = 500; ZE.push(e);
    doBash(); const o = +(500 - e.posture).toFixed(1); drop(e); return o; };
  out.b49 = bash(49); out.b50 = bash(50);
  // Second parry: a real parry, then a blow with the block held since long ago at 0.3 s and 0.5 s after it
  const strike = (ago) => { const e = mk(1); const now = performance.now(); blocking = true; lastBlockAttemptT = now / 1000 - ago; lastBlockAttemptG = playClockS - ago;
    executeStrike(e, 20, now); const r = typeof e._ripUntil === 'number' && e._ripUntil > 0; drop(e); return r; };
  EQ.offhand = null;
  for (const lv of [99, 100]) { reset(); set('guard', lv); const first = strike(.05); const at = _lastParryG === playClockS;
    _lastParryG = playClockS - .3; const second = strike(5); _lastParryG = playClockS - .5; const late = strike(5); blocking = false; out['s' + lv] = { first, at, second, late }; }
  out.live = [25, 50, 75, 100].map(r => PERK_LIVE.has('guard:' + r));
  Object.assign(EQ, eq0); for (const k in sk0) SKILLS[k] = sk0[k]; reset(); return out; });
console.log(JSON.stringify(p));
check(`Deflect: a held shield takes ${p.d24.hp} from an arrow at Guard 24 and ${p.d25.hp} at 25`, p.d24.hp > 0 && p.d25.hp === 0 && p.d25.left === 0, p);
check(`it is the shield's: bare-handed at 25 a held block still takes ${p.d25bare.hp}, an open guard ${p.d25open.hp}`, p.d25bare.hp > 0 && p.d25open.hp > p.d25bare.hp, p);
check(`Bulwark: a bare bash drains ${p.b49} posture at Guard 49 and ${p.b50} at 50 (×1.5)`, p.b49 > 0 && Math.abs(p.b50 / p.b49 - 1.5) < .01, p);
check('Second parry: at Guard 100 a held block 0.3 s after a parry parries again; not at 0.5 s', p.s100.first && p.s100.at && p.s100.second && !p.s100.late, p);
check('at Guard 99 the held block 0.3 s after is only a held block', p.s99.first && !p.s99.second, p);
check('all four of Guard\'s perks are live (Iron wall since S1136, with the heavy blow)', p.live.join() === 'true,true,true,true', p);
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
