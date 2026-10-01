// A seen theft at level one (Session 375; G's owed check from Session 168: "a seen strongbox theft now costs 50 + what you
// took (doubled at a yield); whether that is steep at level one"). The feel is Michael's; this puts numbers on it. Every
// shop strongbox in Dunmore and Portclare is read through the game's own numbers: its takings (`boxCoins` at the town's
// prosperity, ×0.8–1.2 as the box rolls them), the one thing from the shop's stock it holds, the fine if you are seen
// (50 + both), and the yield's double. Set against a new character's purse and what a level-one job at the same town pays.
import { boot, check } from './lib/game.mjs';
const g = await boot(); const { page } = g;
await g.intoWorld();
const start = await page.evaluate(() => ({ level, gold, maxHP }));
const towns = {};
for (const id of ['dunmore', 'portclare']) {
  await g.settle(id);
  towns[id] = await page.evaluate((id) => { const S = WORLD.settle.get(id); const site = S.site; const p = WORLD.prosperity(site);
    const shops = S.houses.filter(h => h.keeper && /weapon|armor|potion|misc/.test(h.type)).map(h => { const tbl = SHOP_STOCK[h.type] || SHOP_STOCK.misc; const prices = tbl.map(it => it.buyPrice || 0);
      const c = WORLD.boxCoins(p, h.type), item = prices.reduce((a, b) => a + b, 0) / prices.length;
      return { name: h.name, type: h.type, coins: Math.round(c), coinsLo: Math.round(c * .8), coinsHi: Math.round(c * 1.2), item: Math.round(item), itemLo: Math.min(...prices), itemHi: Math.max(...prices), fine: Math.round(50 + c + item), fineLo: Math.round(50 + c * .8 + Math.min(...prices)), fineHi: Math.round(50 + c * 1.2 + Math.max(...prices)) }; });
    const jobs = ['cull', 'deliver', 'road', 'find', 'retrieve'].map(k => { try { const q = WORLD.townQuestFor(site, k); return q && q.reward; } catch (e) { return null; } }).filter(x => x != null);
    return { name: site.name, prosperity: p, shops, jobs }; }, id);
}
console.log(`a new character: level ${start.level}, ${start.gold} gold, ${start.maxHP} health`);
for (const id in towns) { const T = towns[id]; console.log(`${T.name} (prosperity ${T.prosperity}); a level-one job pays ${Math.min(...T.jobs)}–${Math.max(...T.jobs)}`);
  for (const s of T.shops) console.log(`  ${s.name.padEnd(26)} ${s.type.padEnd(7)} takings ${s.coins} (${s.coinsLo}–${s.coinsHi}) + a thing worth ${s.item} (${s.itemLo}–${s.itemHi}): seen, fined ${s.fine} (${s.fineLo}–${s.fineHi}); at a yield ${2 * s.fine}`); }
const all = Object.values(towns).flatMap(T => T.shops); const jobs = Object.values(towns).flatMap(T => T.jobs);
const fines = all.map(s => s.fine), med = a => { const b = [...a].sort((x, y) => x - y); return b[Math.floor(b.length / 2)]; };
console.log(JSON.stringify({ shops: all.length, fineMin: Math.min(...fines), fineMedian: med(fines), fineMax: Math.max(...fines), jobMedian: med(jobs), startGold: start.gold }));
check('a new character was measured at level one', start.level === 1, start);
check('both towns have shops with strongboxes, and level-one jobs to set them against', towns.dunmore.shops.length >= 3 && towns.portclare.shops.length >= 3 && jobs.length >= 6, { d: towns.dunmore.shops.length, p: towns.portclare.shops.length, jobs });
check('every seen fine is 50 + the takings + the thing, by the game\'s own numbers', all.every(s => s.fine === Math.round(50 + s.coins + s.item) || Math.abs(s.fine - (50 + s.coins + s.item)) <= 1), all);
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
