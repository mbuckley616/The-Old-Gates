// The gates by school, the rosters (Session 763; Michael's A on DECISION #252): each school's gate holds the canon's table
// (lore_canon Part II §9a) with a level-one foe kept in each. Goblins, kobolds and Shieldbearers only in occupied gates.
import { boot, check } from './lib/game.mjs';
import { enterDungeon } from './lib/dungeonshot.mjs';
const g = await boot(); const { page } = g;
await g.intoWorld();
const WANT = {
  undead: { Skeleton: 4, Phantom: 1, Wraith: 1 },
  elemental: { 'Fire Elemental': 2, Slime: 2, Golem: 1, 'Cave Troll': 1 },
  deep: { Slime: 3, Skeleton: 1, 'Cave Troll': 1, Mimic: 1 },
  ruins: { Golem: 2, Gargoyle: 1, 'Cave Troll': 1, Skeleton: 2 },
  haunted: { Phantom: 2, Wraith: 1, Mimic: 1, Skeleton: 2 },
};
// the levels from which each foe joins (EM, 56-dungeon-build.js, private to the dungeon's build)
const LV = { Skeleton: 1, Goblin: 1, Slime: 1, 'Cave Troll': 2, Golem: 3, Phantom: 3, 'Fire Elemental': 3, Gargoyle: 4, Mimic: 4, Wraith: 5 };
const T = await page.evaluate((LV) => { const o = {}; for (const k of ['undead', 'elemental', 'deep', 'ruins', 'haunted']) { const c = {}; THEME_DEF[k].enemies.forEach(n => c[n] = (c[n] || 0) + 1); o[k] = { c, lv: Object.fromEntries(THEME_DEF[k].enemies.map(n => [n, LV[n] || 9])) }; } return o; }, LV);
console.log(JSON.stringify(T));
for (const k of Object.keys(WANT)) {
  const c = T[k].c, same = Object.keys(WANT[k]).length === Object.keys(c).length && Object.entries(WANT[k]).every(([n, v]) => c[n] === v);
  check(`${k}'s roster is the table: ${Object.entries(WANT[k]).map(([n, v]) => v > 1 ? n + ' ×' + v : n).join(', ')}`, same, c);
  check(`${k}'s roster holds a level-one foe`, Object.values(T[k].lv).some(l => l <= 1), T[k].lv);
}
check('no school\'s roster holds a goblin, a kobold or a Shieldbearer', Object.values(T).every(t => !Object.keys(t.c).some(n => /Goblin|Kobold|Shieldbearer/.test(n))));

// inside: each school's gate at level 1 and at level 6
const seen = {};
for (const lv of [1, 6]) for (const theme of Object.keys(WANT)) for (const seed of [11, 23]) {
  await page.evaluate((lv) => { level = lv; }, lv);
  await enterDungeon(page, { theme, seed });
  const foes = await page.evaluate(() => [...new Set(ENEMIES.map(e => e.baseType || e.name))]);
  const k = theme + '@' + lv; seen[k] = [...new Set([...(seen[k] || []), ...foes])];
}
console.log(JSON.stringify(seen));
const ok = (k) => { const [th] = k.split('@'); return seen[k].length > 0 && seen[k].every(n => WANT[th][n] || (n === 'Small Slime' && WANT[th].Slime)); };
check('at level 1 every school\'s gate holds foes, and only from its table', Object.keys(seen).filter(k => k.endsWith('@1')).every(ok), seen);
check('at level 6 the same, and each shows more than one kind of its table', Object.keys(seen).filter(k => k.endsWith('@6')).every(k => ok(k) && seen[k].filter(n => n !== 'Small Slime').length >= 2), seen);
check('Cloch\'s (ruins) gate at level 6 meets its stone: a Golem or a Gargoyle', seen['ruins@6'].some(n => n === 'Golem' || n === 'Gargoyle'), seen['ruins@6']);
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
