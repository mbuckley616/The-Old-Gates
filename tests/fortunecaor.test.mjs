// Two of decision #58's four (Session 328, Michael's A): Fortune's *+2% crit chance a point* now has a crit behind it,
// and Caor Dubh's *risky* has a cost: while its fury lasts you take a fifth more.
import { boot, check } from './lib/game.mjs';
const g = await boot(); const { page } = g;
await g.intoWorld();

// Fortune: with the roll pinned at .01, a point of Fortune (2%) crits and none does not; the crit is half again and says so
const crit = await page.evaluate(() => {
  const R = Math.random; const e = () => ({ name: 'Dummy', def: 0, hp: 500, maxHp: 500, x: px + 900, z: pz + 900, resist: null });
  const hit = (fort, roll) => { ATTRS.fortune = fort; Math.random = () => roll; try { return applyMeleeDamage(e(), 100); } finally { Math.random = R; } };
  const r = { none: hit(0, .01), one: hit(1, .01), oneMiss: hit(1, .03), ten: hit(10, .19), tenMiss: hit(10, .21) };
  let n = 0; ATTRS.fortune = 5; for (let i = 0; i < 4000; i++) if (applyMeleeDamage(e(), 100).lucky) n++;
  ATTRS.fortune = 0; r.rate5 = n / 4000; return r; });
console.log('crit', JSON.stringify(crit));
check('Fortune 0: no crit at a roll of .01 (100 → 100)', crit.none.dmg === 100 && !crit.none.lucky, crit.none);
check('Fortune 1: a roll under .02 crits for ×1.5 and is tagged a crit (150); .03 does not', crit.one.dmg === 150 && crit.one.lucky && crit.one.crit && crit.oneMiss.dmg === 100, crit);
check('Fortune 10: under .20 crits, over does not; at Fortune 5 about one blow in ten crits', crit.ten.dmg === 150 && crit.tenMiss.dmg === 100 && crit.rate5 > .085 && crit.rate5 < .115, crit);

// Caor Dubh: eaten with its hidden effect known, blows land a fifth harder until it wears off; a hit still does +40%
const caor = await page.evaluate(() => {
  ACTIVE_BUFFS.length = 0; const bare = _warded(50);
  HERB_CONSUME_COUNTS.caordubh = 20; BAG.push(Object.assign({}, HERB_DEF.caordubh.item, { _typeKey: 'caordubh', qty: 1 })); useHerb(BAG.length - 1);
  const buff = ACTIVE_BUFFS.find(b => b.type === 'dmgBurst'); const under = _warded(50), mult = _buffMult('dmgBurst', 1);
  ACTIVE_BUFFS.length = 0; const after = _warded(50); return { bare, under, mult, has: !!buff, after }; });
console.log('caor', JSON.stringify(caor));
check('Caor Dubh: a 50-point blow lands for 60 while the fury lasts (50 bare, 50 after), and the +40% to your blows still holds', caor.has && caor.bare === 50 && caor.under === 60 && caor.after === 50 && caor.mult === 1.4, caor);
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
