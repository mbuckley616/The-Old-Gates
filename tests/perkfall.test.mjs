// The perks, first wave: Acrobatics' Cat's fall and Armour's Fitted (Session 977; skills and perks A, the build sheet's
// third session). Cat's fall (Acrobatics 50): a fall is free to 8 m, not 4 (the sheet's `perkranks`: 4 → 8 m at 49 and 50).
// Fitted (Armour 25): the five worn pieces (head, chest, hands, legs, feet) weigh half; a shield, a weapon and the bag do not.
import { boot, check } from './lib/game.mjs';
const g = await boot(); const { page } = g;
await g.intoWorld();
const r = await page.evaluate(() => {
  const out = {}; const sk0 = JSON.parse(JSON.stringify(SKILLS)); const set = (id, lv) => { SKILLS[id] = { lv, p: 0 }; };
  // a fall measured by the game's own landing: the top of the air time, then land at y
  const fall = (lv, h) => { set('acrobatics', lv); FALL.pend = null; const y = jumpY; FALL.top = y + h; FALL.key = fallKey(); FALL.x = px; FALL.z = pz; fallLand(y);
    const p = FALL.pend; FALL.pend = null; return p ? p.dmg : 0; };
  out.f49_6 = fall(49, 6); out.f50_6 = fall(50, 6); out.f50_8 = fall(50, 7.9); out.f50_9 = fall(50, 9); out.f49_5 = fall(49, 5); out.maxHP = maxHP;
  out.free49 = (set('acrobatics', 49), fallFree()); out.free50 = (set('acrobatics', 50), fallFree());
  // Fitted: five pieces of 10 each, a shield of 6, a sword of 3
  const eq0 = { ...EQ }; for (const k of Object.keys(EQ)) EQ[k] = null;
  for (const k of ['head', 'chest', 'hands', 'legs', 'feet']) EQ[k] = { name: 'Test ' + k, type: 'armor', def: 3, weight: 10 };
  EQ.offhand = { name: 'Test Shield', type: 'shield', def: 2, weight: 6 }; EQ.weapon = { name: 'Test Sword', type: 'weapon', dmg: 5, weight: 3 };
  set('armour', 24); out.w24 = equipWeight(); set('armour', 25); out.w25 = equipWeight();
  Object.assign(EQ, eq0);
  for (const k in sk0) SKILLS[k] = sk0[k]; return out; });
console.log(JSON.stringify(r));
check(`Cat's fall: free to ${r.free49} m at Acrobatics 49, ${r.free50} m at 50`, r.free49 === 4 && r.free50 === 8, r);
check(`a 6 m fall costs ${r.f49_6} at 49 (2 m past 4, 12% of ${r.maxHP}), and nothing at 50`, r.f49_6 === Math.round(r.maxHP * .12) && r.f50_6 === 0, r);
check(`at 50, 7.9 m is free (${r.f50_8}) and 9 m costs the 1 m past 8 (${r.f50_9})`, r.f50_8 === 0 && r.f50_9 === Math.max(1, Math.round(r.maxHP * .06)), r);
check(`a 5 m fall still costs at 49 (${r.f49_5})`, r.f49_5 > 0, r);
check(`Fitted: five pieces of 10, a shield of 6 and a sword of 3 weigh ${r.w24} at Armour 24 and ${r.w25} at 25`, r.w24 === 59 && r.w25 === 34, r);
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
