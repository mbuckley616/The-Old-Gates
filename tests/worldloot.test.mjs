// Session 472: the world's containers (a town's barrels and crates, a wreck's sea chest, a ship's chest, a lair's hoard, a
// camp's takings, a tower's hoard) pass a number for the loot's difficulty, where `rollLoot` reads `diffScale.hp`. The
// number had no `.hp`, so the chance of arms and the tier cap were NaN and every roll was tier-1 equipment: a town barrel
// (which keeps everyday goods only) always fell back to the town's own list, and every hoard held nothing but tier-1 arms.
// A number now counts as that difficulty. Checked over keyed rolls (Session 471's stream), so the counts are exact.
import { boot, check } from './lib/game.mjs';
const g = await boot(); const { page } = g;
await g.intoWorld();

const r = await page.evaluate(() => { level = 5; const N = 1500;
  const isEq = x => x && (x.slot || x.dmg != null || x.def != null || x.type === 'weapon' || x.type === 'armor');
  const run = (kind, ds, bc) => { let n = 0, eq = 0, goods = 0, gold = 0, maxT = 0;
    for (let i = 0; i < N; i++) for (const x of rollContainerLoot(kind, ds, null, bc, 'wl:' + kind + ':' + i)) { n++; if (isEq(x)) { eq++; maxT = Math.max(maxT, x.tier || 0); } else goods++; if (x.type === 'gold') gold++; }
    return { n, eq: +(eq / Math.max(1, n)).toFixed(3), goods, gold, maxT }; };
  const same = ['chest', 'treasure', 'barrel'].every(k => { for (let i = 0; i < 50; i++) { const key = 'same:' + k + ':' + i;
    if (JSON.stringify(rollContainerLoot(k, 1.4, null, 1, key)) !== JSON.stringify(rollContainerLoot(k, { hp: 1.4 }, null, 1, key))) return false; } return true; });
  return { barrel: run('barrel', 1, .9), wreck: run('chest', 1.4, 1), hoard: run('treasure', 2.4, 1), dungeon: run('chest', { hp: 1 }, 1), same }; });
console.log(JSON.stringify(r));
check('a number is read as that difficulty: keyed, a 1.4 chest rolls what a {hp: 1.4} chest rolls', r.same, r);
check(`a town barrel (1) now rolls everyday goods: ${r.barrel.goods} of ${r.barrel.n} items in ${1500} barrels, ${r.barrel.gold} of them gold`, r.barrel.goods > r.barrel.n * .5 && r.barrel.gold > 0, r.barrel);
check(`a wreck's chest (1.4) holds goods and arms: ${(r.wreck.eq * 100).toFixed(0)}% arms, up to tier ${r.wreck.maxT} at level 5`, r.wreck.eq > .2 && r.wreck.eq < .6 && r.wreck.maxT > 1, r.wreck);
check(`a lair's hoard (2.4) leans further to arms and to better ones: ${(r.hoard.eq * 100).toFixed(0)}% arms, up to tier ${r.hoard.maxT}`, r.hoard.eq > r.wreck.eq && r.hoard.maxT >= r.wreck.maxT, r.hoard);

check('no page errors', g.errs.length === 0, g.errs);
await g.close();
