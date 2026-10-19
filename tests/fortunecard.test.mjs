// Fortune's card (Session 346, Michael's A on #64): the card said *+1% loot quality*, which nothing read. It now says what
// Fortune does: +2% crit, +5% gold found (`rollGold`) and +2.5% item drop chance (`lootDropChance`) a point; since Session 953
// (the attributes at ≤1%) +0.5%, +1% and +1%.
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
check('the card reads crit, gold found and item drop chance, and no loot quality', /\+0\.5% crit chance, \+1% gold found, \+1% item drop chance/.test(r.card) && !/quality/.test(r.card + r.lines), r);
check('the level-up lines read +0.5% crit, +1% gold, +1% drop a point (since S953), doubled at two points', /\+1% gold found/.test(r.lines) && /\+1% item drop chance/.test(r.lines) && /\+2% gold found/.test(r.lines2) && /\+2% item drop chance/.test(r.lines2), r);
check('ten points of Fortune find a tenth more gold (1% a point since S953)', r.g0 === 5 && r.g10 === Math.round(5 * 1.1), r);
check('ten points of Fortune add 10 points to the drop chance', Math.abs(r.d10 - r.d0 - 0.10) < 1e-9, r);
check('the hub shows the three rows at Fortune 4', r.rows.some(t => /Crit Chance\+2%/.test(t)) && r.rows.some(t => /Gold Found\+4%/.test(t)) && r.rows.some(t => /Item Drop\+4%/.test(t)), r.rows);
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
