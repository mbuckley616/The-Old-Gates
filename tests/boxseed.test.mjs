// A town's strongbox and a home's chest roll their takings on a seeded stream (Session 604, CLAUDE.md's co-op rules: a
// roll that decides an outcome comes from a stream keyed by place and id). Session 471 put the barrels, wrecks and hoards
// on `seededRng('loot', key)`; the strongbox (Session 155) and the home chest still drew their coins, their thing and its
// price from Math.random. Now they draw from `seededRng('loot', '<house id>:box:<day>')`: the same box on the same day
// gives the same takings whatever Math.random says, and another day another roll.
import { boot, check } from './lib/game.mjs';
const g = await boot(); const { page } = g;
await g.intoWorld(); await g.settle('dunmore');
const stop = g.keepAlive();

const ids = await page.evaluate(() => { forceTime(13); const H = WORLD.settle.get('dunmore').houses;
  const shop = H.find(x => /weapon|armor|potion|misc/.test(x.type) && x.keeper), home = H.find(x => x.type === 'home');
  return { shop: shop && shop.id, home: home && home.id }; });
check('a shop with a keeper and a home in Dunmore', ids.shop && ids.home, ids);

const enter = async (id) => {
  await page.evaluate((id) => { const h = WORLD.settle.get('dunmore').houses.find(x => x.id === id); window._h = h; forceTime(13); px = h.exitX; pz = h.exitZ; goToInterior(h); }, id);
  await page.waitForFunction(() => currentHouse === window._h && !!WORLD.intBox, null, { timeout: 60000 }); await g.frames(2); await g.hide(); };
const leave = async () => { await page.evaluate(() => exitInterior()); await page.waitForFunction(() => currentHouse == null, null, { timeout: 60000 }); await g.frames(2); };

// in the page: open the box on day `day` with Math.random pinned to `rnd`, and read what it hands over
const takings = (rnd, day) => page.evaluate(([rnd, day]) => {
  const X = WORLD.intBox; worldState.gameTimeAbsMinutes = day * 1440 + 13 * 60; worldState.crime = {};
  if (worldState.boxes) delete worldState.boxes[X.id]; X.open = true; px = X.x; pz = X.z + .8; jumpY = 0;
  const gold0 = gold, got = [], _ba = window.bagAdd, _r = Math.random, _m = showMsg;
  window.bagAdd = function (it) { got.push(it.name + ':' + (it.buyPrice || 0)); return true; }; Math.random = () => rnd; showMsg = () => {};
  try { boxInteract(); } finally { Math.random = _r; window.bagAdd = _ba; showMsg = _m; }
  try { closeDialog(); } catch (e) {}
  const p = prosperity(houseSite(X.house)); const base = X.kind === 'home' ? null : boxCoins(p, X.type);
  return { kind: X.kind, coins: gold - gold0, items: got, lo: base && Math.round(base * .8), hi: base && Math.round(base * 1.2) };
}, [rnd, day]);

const same = (a, b) => a.coins === b.coins && a.items.join('|') === b.items.join('|');
const res = {};
for (const which of ['shop', 'home']) {
  await enter(ids[which]);
  const a = await takings(0.1, 40), b = await takings(0.9, 40), again = await takings(0.5, 40);
  const days = []; for (let d = 41; d <= 48; d++) days.push(await takings(0.1, d));
  await leave();
  res[which] = { a, b, again, days };
  console.log(which, JSON.stringify({ a, b, days: days.map(x => [x.coins, x.items.join(',')]) }));
}
const S = res.shop, H = res.home;
check('the strongbox: one day, the same coins and the same thing whatever Math.random says', S.a.kind === 'shop' && S.a.coins > 0 && S.a.items.length === 1 && same(S.a, S.b) && same(S.a, S.again), { a: S.a, b: S.b });
check('the strongbox: the coins stay in the takings\' band (boxCoins, ×0.8–1.2)', [S.a, ...S.days].every(x => x.coins >= x.lo && x.coins <= x.hi), [S.a, ...S.days].map(x => [x.coins, x.lo, x.hi]));
check('the strongbox: other days roll other takings', new Set([S.a, ...S.days].map(x => x.coins + '|' + x.items.join())).size >= 4, S.days.map(x => x.coins));
check('the home chest: one day, the same coins and the same keepsake at the same price', H.a.kind === 'home' && H.a.coins >= 2 && H.a.coins <= 12 && H.a.items.length === 1 && same(H.a, H.b) && same(H.a, H.again), { a: H.a, b: H.b });
check('the home chest: other days roll other coins or keepsakes', new Set([H.a, ...H.days].map(x => x.coins + '|' + x.items.join())).size >= 4, H.days.map(x => [x.coins, x.items[0]]));
stop();
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
