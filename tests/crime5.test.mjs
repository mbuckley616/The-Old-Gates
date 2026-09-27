// A seen theft (Session 181, the critic's section I): the fine is the spec's 50 gold and the value of what was taken
// (backlog B: "theft 50 + the goods' value"), not 50 flat. A strongbox emptied in the day with the keeper beside you.
import { boot, check } from './lib/game.mjs';
const g = await boot(); const { page } = g;
await g.intoWorld(); await g.settle('dunmore');

await page.evaluate(() => { forceTime(13); const S = WORLD.settle.get('dunmore'); const h = S.houses.find(x => /armor/.test(x.type)) || S.houses.find(x => /weapon|potion|misc/.test(x.type)); window._h = h; window._S = S;
  worldState.crime = {}; px = h.doorX; pz = h.doorZ + .3; jumpY = 0; goToInterior(h); });
// the room builds over a few frames: wait for its strongbox and its keeper
await page.waitForFunction(() => !!WORLD.intBox && typeof intNPCMesh !== 'undefined' && !!intNPCMesh, null, { timeout: 60000, polling: 250 });
const theft = await page.evaluate(() => { const X = WORLD.intBox; px = X.x; pz = X.z + .8; jumpY = 0;
  // the keeper steps over to the counter beside you (the room's own layout decides whether they would; the fine is what is tested)
  intNPCMesh.position.x = px + 1.5; intNPCMesh.position.z = pz;
  const site = window._S.site, b0 = WORLD.bountyAt(site), gold0 = gold, bag0 = BAG.length; X.open = true;
  WORLD.boxInteract(); const coins = gold - gold0; const taken = BAG.slice(bag0); const goods = taken.reduce((t, it) => t + (it.buyPrice || 0), 0);
  return { shop: window._h.name, seen: WORLD.bountyAt(site) > b0, coins, goods, items: taken.length, bounty: WORLD.bountyAt(site) - b0, expect: 50 + coins + goods, log: (GAME_LOG.slice(-3).map(l => l.text)).join(' | ') }; });
check('a seen theft is fined 50 gold and the value of what was taken (the coins and the thing from the stock)', theft.seen && theft.items === 1 && theft.coins > 0 && theft.goods > 0 && theft.bounty === theft.expect, theft);
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
