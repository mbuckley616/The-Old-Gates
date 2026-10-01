// Fortune's card (Session 346, Michael's A on #64): the card said *+1% loot quality*, which nothing read. It now says what
// Fortune does: +2% crit, +5% gold found (`rollGold`) and +2.5% item drop chance (`lootDropChance`) a point.
import { boot, check } from './lib/game.mjs';
const g = await boot(); const { page } = g;
await g.intoWorld();
const r = await page.evaluate(() => {
  const card = ATTR_DEF.fortune.gainDesc, lines = gainLines('fortune', 1), lines2 = gainLines('fortune', 2);
  const rnd = Math.random; Math.random = () => 0; const lv = level; level = 1;
  const gold = (f) => { ATTRS.fortune = f; return rollGold('chest'); };
  const g0 = gold(0), g10 = gold(10);
  const e = { maxHp: 20 };
  const d0 = (ATTRS.fortune = 0, lootDropChance(e)), d10 = (ATTRS.fortune = 10, lootDropChance(e));
  Math.random = rnd; level = lv;
  ATTRS.fortune = 4; openHub('attrs'); if (typeof hubTab === 'function') hubTab('attrs');
  const rows = [...document.querySelectorAll('#derived-grid .derived-row')].map(d => d.textContent);
  closeHub(); ATTRS.fortune = 0;
  return { card, lines, lines2, g0, g10, d0, d10, rows };
});
check('the card reads crit, gold found and item drop chance, and no loot quality', /\+2% crit chance, \+5% gold found, \+2\.5% item drop chance/.test(r.card) && !/quality/.test(r.card + r.lines), r);
check('the level-up lines read +2% crit, +5% gold, +2.5% drop a point, doubled at two points', /\+5% gold found/.test(r.lines) && /\+2\.5% item drop chance/.test(r.lines) && /\+10% gold found/.test(r.lines2) && /\+5% item drop chance/.test(r.lines2), r);
check('ten points of Fortune find half again the gold', r.g0 === 5 && r.g10 === Math.round(5 * 1.5), r);
check('ten points of Fortune add 25 points to the drop chance', Math.abs(r.d10 - r.d0 - 0.25) < 1e-9, r);
check('the hub shows the three rows at Fortune 4', r.rows.some(t => /Crit Chance\+8%/.test(t)) && r.rows.some(t => /Gold Found\+20%/.test(t)) && r.rows.some(t => /Item Drop\+10%/.test(t)), r.rows);
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
