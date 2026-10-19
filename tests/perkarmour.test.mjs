// Armour's perks under combat's resolver (Session 1050; skills and perks A, the build sheet's Armour row). Unbowed (50): your
// posture +25%. Hold the line (75): a light hit taken above half your posture does not stagger you (every foe's blow is light
// until FOE_ATTACKS' heavy column is filled). Second skin (100): worn armour never slows the roll (the roll is heavy over 70%
// of what you can carry; at 100 the five worn pieces do not count toward it). Fitted (25) is Session 977's, in `perkfall`.
import { boot, check } from './lib/game.mjs';
const g = await boot(); const { page } = g;
await g.intoWorld();
const r = await page.evaluate(() => {
  const out = {}; const sk0 = JSON.parse(JSON.stringify(SKILLS)), eq0 = { ...EQ }, bag0 = BAG.slice();
  const set = (id, lv) => { SKILLS[id] = { lv, p: 0 }; };
  for (const k of Object.keys(EQ)) EQ[k] = null;
  EQ.chest = { name: 'Test Plate', type: 'armor', slot: 'chest', def: 20, weight: 1 };
  set('armour', 49); out.max49 = playerMaxPosture(); set('armour', 50); out.max50 = playerMaxPosture();
  // Hold the line: from full posture a blow worth more than all of it; from below half a blow worth more than what is left
  const hit = (lv, from, amt) => { set('armour', lv); PPOST.maxPosture = playerMaxPosture(); PPOST.posture = PPOST.maxPosture * from; PPOST.stagUntil = 0; PPOST.broke = false;
    const broke = playerPostureHit(PPOST.maxPosture * amt, performance.now() / 1000 + 100, false); const o = { broke, left: +PPOST.posture.toFixed(1) };
    PPOST.stagUntil = 0; PPOST.broke = false; PPOST.posture = PPOST.maxPosture; blocking = false; return o; };
  out.h74 = hit(74, 1, 1.2); out.h75 = hit(75, 1, 1.2); out.h75low = hit(75, .4, .5); out.h75heavy = (() => { set('armour', 75); PPOST.posture = PPOST.maxPosture;
    const b = playerPostureHit(PPOST.maxPosture * 1.2, performance.now() / 1000 + 200, false, true); PPOST.stagUntil = 0; PPOST.broke = false; PPOST.posture = PPOST.maxPosture; return b; })();
  // Second skin: worn armour weighing 80% of what you can carry, the bag empty, then the same weight in the bag
  BAG.length = 0; for (const k of Object.keys(EQ)) EQ[k] = null;
  const cap = maxCarry(); for (const k of ['head', 'chest', 'hands', 'legs', 'feet']) EQ[k] = { name: 'Test ' + k, type: 'armor', slot: k, def: 1, weight: cap * .8 / 5 * 2 };
  const roll = (lv) => { set('armour', lv); ROLL = null; stamina = maxStamina; staminaCD = 0; PPOST.stagUntil = 0; onGround = true;
    const ok = startRoll(performance.now() / 1000 + 300, {}); const o = { ok, heavy: !!(ROLL && ROLL.heavy), dist: ROLL && ROLL.dist }; ROLL = null; return o; };
  out.cap = cap; out.r99 = roll(99); out.r100 = roll(100);
  for (const k of Object.keys(EQ)) EQ[k] = null; BAG.push({ name: 'Test Stone', type: 'misc', weight: cap * .8, qty: 1 }); out.bag100 = roll(100);
  out.live = [25, 50, 75, 100].map(rk => PERK_LIVE.has('armour:' + rk));
  BAG.length = 0; for (const it of bag0) BAG.push(it); Object.assign(EQ, eq0); for (const k in sk0) SKILLS[k] = sk0[k];
  PPOST.maxPosture = PPOST.posture = playerMaxPosture(); stamina = maxStamina; return out; });
console.log(JSON.stringify(r));
check(`Unbowed: 20 armour gives ${r.max49} posture at Armour 49 and ${r.max50} at 50 (+25%)`, r.max49 === 140 && r.max50 === 175, r);
check(`Hold the line: a blow worth 1.2 of a full posture breaks you at Armour 74 (${JSON.stringify(r.h74)}), not at 75 (${JSON.stringify(r.h75)})`,
  r.h74.broke && !r.h75.broke && r.h75.left === 1, r);
check('below half posture the perk does not hold: a blow worth more than what is left breaks you at 75', r.h75low.broke, r);
check('a hit marked heavy breaks you at 75 from full', r.h75heavy === true, r);
check(`Second skin: worn armour at 80% of the load rolls heavy at Armour 99 (${r.r99.dist}) and light at 100 (${r.r100.dist})`,
  r.r99.ok && r.r99.heavy && r.r100.ok && !r.r100.heavy && r.r100.dist === 2.6, r);
check('the same weight in the bag still rolls heavy at 100', r.bag100.ok && r.bag100.heavy, r);
check('all four of Armour\'s perks are live', r.live.every(Boolean), r);
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
