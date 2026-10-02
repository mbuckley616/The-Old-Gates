// The quantity prompt's typed-amount button (Session 409): it read "Buy" on a sale too (the concept artist, drawing the
// counter on the parchment, 1 Oct). It now names the side, as the prompt's title does, and a typed amount sells.
import { boot, check } from './lib/game.mjs';
const g = await boot(); const { page } = g;
await g.intoWorld(); await g.settle('dunmore');

await page.evaluate(() => { forceTime(13); const S = WORLD.settle.get('dunmore'); worldState.crime = {};
  const h = S.houses.find(x => x.type === 'potion' && x.keeper) || S.houses.find(x => /weapon|armor|potion|misc/.test(x.type) && x.keeper);
  px = h.exitX; pz = h.exitZ; goToInterior(h); });
await page.waitForTimeout(4500); await g.hide();

const r = await page.evaluate(() => { forceTime(13); openShop(); gold = 5000; renderShop();
  const go = () => document.getElementById('qty-custom-go').textContent, title = () => document.getElementById('qty-title').textContent;
  const out = { open: shopOpen };
  // buy: the first stock row that opens the prompt
  const rows = [...document.querySelectorAll('#sh-stock .sh-row')];
  for (const row of rows) { if (!row.onclick) continue; row.onclick(); if (document.getElementById('qty-modal').style.display === 'flex') { out.buy = { title: title(), go: go() }; closeQtyModal(); break; } }
  // sell: a stack of 20 draughts in the bag, its row, a typed 5
  const it = { name: 'Test Draught', ico: '🧪', type: 'potion', qty: 20, heal: 20, price: 30 };
  BAG.push(it); renderShop(); const i = BAG.indexOf(it);
  openQtyModal(it, 'sell', i); out.sell = { title: title(), go: go() };
  const g0 = gold; document.getElementById('qty-custom').value = '5'; document.getElementById('qty-custom-go').click();
  out.sold = { left: it.qty, inBag: BAG.includes(it), gained: gold - g0 };
  openQtyModal(it, 'buy', -1); out.buyAgain = go(); closeQtyModal();
  return out; });
console.log(JSON.stringify(r));
check('the shop is open', r.open, r);
check('buying, the prompt and its typed-amount button say Buy', !!r.buy && /^Buy /.test(r.buy.title) && r.buy.go === 'Buy', r.buy);
check('selling, they say Sell (the button said Buy)', /^Sell /.test(r.sell.title) && r.sell.go === 'Sell', r.sell);
check('a typed 5 on the Sell button sells five', r.sold.left === 15 && r.sold.gained > 0, r.sold);
check('opened again to buy, it says Buy again', r.buyAgain === 'Buy', r.buyAgain);
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
