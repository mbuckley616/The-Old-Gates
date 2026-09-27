// Lockpicks for sale (Session 170): the locked door says "the goods shops sell them"; now they do, one pick a unit at
// the loot table's price (12, the town's multiplier on top), and picks stack in the bag so the lock counts them all.
import { boot, check } from './lib/game.mjs';
const g = await boot(); const { page } = g;
await g.intoWorld(); await g.settle('dunmore');

await page.evaluate(() => { forceTime(13); for (let i = BAG.length - 1; i >= 0; i--) if (BAG[i].name === 'Lockpick') BAG.splice(i, 1);
  const S = WORLD.settle.get('dunmore'); const h = S.houses.find(x => x.type === 'misc' && x.keeper); window._h = h; px = h.exitX; pz = h.exitZ; goToInterior(h); });
await page.waitForTimeout(4500); await g.hide();

const shop = await page.evaluate(() => { forceTime(13); openShop(); gold = 500; renderShop();
  const row = [...document.querySelectorAll('#sh-stock .sh-row')].find(r => /Lockpick/.test(r.textContent)); if (!row) return { none: true, shop: window._h.name, rows: [...document.querySelectorAll('#sh-stock .sh-row')].map(r => r.textContent.trim().slice(0, 30)) };
  const listed = row.textContent.replace(/\s+/g, ' ').trim(); const g0 = gold; row.onclick(); const modal = document.getElementById('qty-modal').style.display === 'flex'; const unit = _qtyCtx && _qtyCtx.unitPrice;
  qtyPick(3); const paid = g0 - gold; const stacks = BAG.filter(b => b.name === 'Lockpick'); const picks = lpPicks();
  bagAdd({ name: 'Lockpick', ico: '🗝', type: 'misc', buyPrice: 12, sellMult: .4, weight: .05, qty: 3 }); const afterLoot = { stacks: BAG.filter(b => b.name === 'Lockpick').length, picks: lpPicks() };
  closeShop(); return { shop: window._h.name, listed, modal, unit, want: Math.max(1, Math.round(12 * shopMul())), paid, stacks: stacks.length, picks, afterLoot }; });
check('a goods shop sells lockpicks, one a unit, at the town’s price', !shop.none && shop.modal && shop.unit === shop.want && shop.paid === 3 * shop.unit && new RegExp(shop.unit + '🪙').test(shop.listed), shop);
check('bought picks stack, and picks found in loot join the same stack; the lock counts them all', shop.stacks === 1 && shop.picks === 3 && shop.afterLoot.stacks === 1 && shop.afterLoot.picks === 6, shop);

// a pick bought at the counter opens the lock at a door, and spends like any other
const door = await page.evaluate(async () => { exitInterior(); await new Promise(r => setTimeout(r, 2500)); forceTime(23); const S = WORLD.settle.get('dunmore');
  const h = S.houses.find(x => /weapon|armor|potion/.test(x.type) && x.keeper); px = h.doorX; pz = h.doorZ + .3; jumpY = 0;
  const opened = tryLockpick(WORLD.doorLockFor(h)); const title = document.getElementById('lp-title').textContent; const before = lpPicks(); const left = lpSpendPick();
  closeLockpick(); return { opened, title, before, left }; });
check('with a bought pick the town lock opens to the pick; spending one leaves the rest', door.opened && /door/i.test(door.title) && door.before === 6 && door.left === 5, door);
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
