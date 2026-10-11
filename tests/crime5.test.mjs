// A seen theft (Session 181, the critic's section I): the fine is the spec's 50 gold and the value of what was taken
// (backlog B: "theft 50 + the goods' value"), not 50 flat. A strongbox emptied in the day with the keeper beside you.
import { boot, check } from './lib/game.mjs';
const g = await boot(); const { page } = g;
await g.intoWorld(); await g.settle('dunmore');

await page.evaluate(() => { forceTime(13); const S = WORLD.settle.get('dunmore'); const h = S.houses.find(x => /armor/.test(x.type)) || S.houses.find(x => /weapon|potion|misc/.test(x.type)); window._h = h; window._S = S;
  worldState.crime = {}; px = h.doorX; pz = h.doorZ + .3; jumpY = 0; goToInterior(h); });
// the room builds over a few frames: wait for its strongbox and its keeper
await page.waitForFunction(() => !!WORLD.intBox && typeof intNPCMesh !== 'undefined' && !!intNPCMesh, null, { timeout: 60000, polling: 250 });
const theft = await page.evaluate(() => { const X = WORLD.intBox; px = X.x; pz = X.z + .8; jumpY = 0; lookAtPt(X.x, .3, X.z);
  // the keeper steps over to the counter beside you (the room's own layout decides whether they would; the fine is what is tested)
  intNPCMesh.position.x = px + 1.5; intNPCMesh.position.z = pz; intNPCMesh.rotation.y = Math.atan2(px - intNPCMesh.position.x, pz - intNPCMesh.position.z); // (S368: and faces you)
  const site = window._S.site, b0 = WORLD.bountyAt(site), gold0 = gold, bag0 = BAG.length; X.open = true;
  WORLD.boxInteract(); const coins = gold - gold0; const taken = BAG.slice(bag0); const goods = taken.reduce((t, it) => t + (it.buyPrice || 0), 0);
  return { shop: window._h.name, seen: WORLD.bountyAt(site) > b0, coins, goods, items: taken.length, bounty: WORLD.bountyAt(site) - b0, expect: 50 + coins + goods, log: (GAME_LOG.slice(-3).map(l => l.text)).join(' | ') }; });
check('a seen theft is fined 50 gold and the value of what was taken (the coins and the thing from the stock)', theft.seen && theft.items === 1 && theft.coins > 0 && theft.goods > 0 && theft.bounty === theft.expect, theft);
// a wall between you and the keeper (Session 182): behind a partition you are not seen; with nothing between, at the
// same distance, you are
const wall = await page.evaluate(() => { const W = INT_SOL.filter(s => (s.y1 == null || s.y1 >= 2) && (s.y0 == null || s.y0 < 1) && Math.min(s.x1 - s.x0, s.z1 - s.z0) < .6 && Math.max(s.x1 - s.x0, s.z1 - s.z0) > 1.5);
  if (!W.length) return { none: true, n: INT_SOL.length }; const w = W[0]; const thinX = (w.x1 - w.x0) < (w.z1 - w.z0); const cx = (w.x0 + w.x1) / 2, cz = (w.z0 + w.z1) / 2;
  const at = (k, t) => thinX ? [cx + k, cz + t] : [cx + t, cz + k];
  [px, pz] = at(-1.2, 0); [intNPCMesh.position.x, intNPCMesh.position.z] = at(1.2, 0); const face = () => { intNPCMesh.rotation.y = Math.atan2(px - intNPCMesh.position.x, pz - intNPCMesh.position.z); }; face(); const behind = WORLD.witnessOf(window._h);
  [intNPCMesh.position.x, intNPCMesh.position.z] = at(-1.2, 2.4 * (Math.max(w.x1 - w.x0, w.z1 - w.z0) > 5 ? 1 : .5)); face(); const beside = WORLD.witnessOf(window._h);
  return { walls: W.length, behind: behind && behind.name, beside: beside && beside.name, clear: WORLD.intClearLine(...at(-1.2, 0), ...at(-1.2, 1)), blocked: !WORLD.intClearLine(...at(-1.2, 0), ...at(1.2, 0)) }; });
check('indoors, a keeper behind a wall does not see you; beside you with nothing between, they do', !wall.none && !wall.behind && !!wall.beside && wall.clear && wall.blocked, wall);
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
