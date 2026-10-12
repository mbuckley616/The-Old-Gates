// Stolen goods keep their mark in the bag (Session 732; the critic's s572 run). `bagAdd` stacked by name alone, so a stolen
// Lockpick from a goods shop's strongbox went onto a bought stack and the stack read honest: the cells (`BAG[i].stolen`) never
// took it. The other way round, picks bought after a stolen one joined the stolen stack and the cells took them all. A stack is
// now one name and one mark (`sameStack`), in the bag, the stash and the buy-back; the lock counts every stack of picks.
import { boot, check } from './lib/game.mjs';
const g = await boot(); const { page } = g;
await g.intoWorld(); await g.settle('dunmore');
const stop = g.keepAlive();

const id = await page.evaluate(() => { forceTime(13); const H = WORLD.settle.get('dunmore').houses;
  const shop = H.find(x => x.type === 'misc' && x.keeper); return shop && shop.id; });
check('a goods shop with a keeper in Dunmore', !!id, id);
await page.evaluate((id) => { const h = WORLD.settle.get('dunmore').houses.find(x => x.id === id); window._h = h; forceTime(13); px = h.exitX; pz = h.exitZ; goToInterior(h); }, id);
await page.waitForFunction(() => currentHouse === window._h && !!WORLD.intBox, null, { timeout: 60000 }); await g.frames(2); await g.hide();

// the strongbox opened on day `day` with the real bagAdd: what came out, and the bag after
const rob = (day) => page.evaluate((day) => {
  const X = WORLD.intBox; worldState.gameTimeAbsMinutes = day * 1440 + 13 * 60; worldState.crime = {};
  if (worldState.boxes) delete worldState.boxes[X.id]; X.open = true; px = X.x; pz = X.z + .8; jumpY = 0; lookAtPt(X.x, .3, X.z);
  const _m = showMsg; showMsg = () => {};
  try { WORLD.boxInteract(); } finally { showMsg = _m; }
  try { closeDialog(); } catch (e) {}
  return BAG.map(b => ({ name: b.name, qty: b.qty, stolen: !!b.stolen }));
}, day);
const pickDay = await page.evaluate(() => {
  // find a day whose strongbox thing is a Lockpick, by its own stream (no bag touched)
  const X = WORLD.intBox; const tbl = SHOP_STOCK[X.type] || SHOP_STOCK.misc;
  for (let d = 40; d < 400; d++) { const R = seededRng('loot', X.id + ':box:' + d); R(); /* the coins' roll */ const it = tbl[Math.floor(R() * tbl.length)]; if (it && it.name === 'Lockpick') return d; }
  return -1; });
check('a day on which the strongbox holds a Lockpick', pickDay > 0, pickDay);

// 1. three picks bought, then the stolen one
await page.evaluate(() => { BAG.length = 0; const P = SHOP_STOCK.misc.find(x => x.name === 'Lockpick'); for (let k = 0; k < 3; k++) bagAdd({ ...P, qty: 1 }); });
const a = await rob(pickDay);
const picksA = await page.evaluate(() => lpPicks());
console.log('bought then stolen', JSON.stringify(a), 'lpPicks', picksA);
const honA = a.find(b => b.name === 'Lockpick' && !b.stolen), stA = a.find(b => b.name === 'Lockpick' && b.stolen);
check('bought then stolen: the bought stack stays 3 and honest, the stolen pick is a stack of its own', honA && honA.qty === 3 && stA && stA.qty === 1, a);
check('the lock counts both stacks (4 picks)', picksA === 4, picksA);

// the cells take what is marked stolen, and only that
const cellsA = await page.evaluate(() => BAG.filter(b => !b.stolen && b.name === 'Lockpick').reduce((s, b) => s + b.qty, 0));
check('after the cells, the three bought picks are left', cellsA === 3, cellsA);

// 2. the reverse: the stolen pick first, then three bought
await page.evaluate(() => { BAG.length = 0; });
await rob(pickDay + 0);
const b = await page.evaluate(() => { const P = SHOP_STOCK.misc.find(x => x.name === 'Lockpick'); for (let k = 0; k < 3; k++) bagAdd({ ...P, qty: 1 });
  return BAG.filter(x => x.name === 'Lockpick').map(x => ({ qty: x.qty, stolen: !!x.stolen })); });
console.log('stolen then bought', JSON.stringify(b));
check('stolen then bought: the bought picks do not join the stolen stack', b.length === 2 && b.some(x => x.stolen && x.qty === 1) && b.some(x => !x.stolen && x.qty === 3), b);

// 3. through the stash and back, the two stacks stay two
const c = await page.evaluate(() => { stashBag.length = 0;
  while (BAG.some(x => x.name === 'Lockpick')) depositToStash(BAG.findIndex(x => x.name === 'Lockpick'));
  const inStash = stashBag.filter(x => x.name === 'Lockpick').map(x => ({ qty: x.qty, stolen: !!x.stolen }));
  while (stashBag.some(x => x.name === 'Lockpick')) withdrawFromStash(stashBag.findIndex(x => x.name === 'Lockpick'));
  try { closeStash(); } catch (e) {}
  return { inStash, back: BAG.filter(x => x.name === 'Lockpick').map(x => ({ qty: x.qty, stolen: !!x.stolen })) }; });
console.log('stash', JSON.stringify(c));
check('in the stash and back in the bag, the stolen stack and the bought stack stay apart', c.inStash.length === 2 && c.back.length === 2 && c.back.some(x => x.stolen && x.qty === 1) && c.back.some(x => !x.stolen && x.qty === 3), c);

// 4. spending picks still works across stacks
const d = await page.evaluate(() => { const out = []; for (let k = 0; k < 5; k++) out.push(lpSpendPick()); return out; });
check('spending picks one by one counts 3, 2, 1, 0 and stops', d.join(',') === '3,2,1,0,0', d);
stop();
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
