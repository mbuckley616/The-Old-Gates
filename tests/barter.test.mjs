// Charisma's barter (Session 339, Michael's A on #61): 1% a point off what you pay at a counter and on what you're
// paid, up to a quarter. A bought-back item keeps the price you were paid. The hub's row shows the same number.
import { boot, check } from './lib/game.mjs';
const g = await boot(); const { page } = g;
await g.intoWorld(); await g.settle('dunmore');
await page.evaluate(() => { forceTime(13); const S = WORLD.settle.get('dunmore'); const h = S.houses.find(x => x.type === 'weapon' && x.keeper) || S.houses.find(x => x.type === 'armor' && x.keeper);
  px = h.exitX; pz = h.exitZ; goToInterior(h); });
await page.waitForTimeout(4500); await g.hide();
const r = await page.evaluate(() => {
  forceTime(13); openShop(); gold = 99999;
  const tbl = currentHouse.id && currentHouse.id.startsWith('ih') ? IH_SHOP_STOCK : SHOP_STOCK; const base = tbl[currentHouse.type] || tbl.misc;
  const it = base.find(i => i.type === 'equip' && i.buyPrice > 20 && !i.torchType);
  const rowOf = (sel, name) => [...document.querySelectorAll(sel + ' .sh-row')].find(r => r.textContent.includes(name));
  const buy = (cha) => { ATTRS.charisma = cha; renderShop(); const row = rowOf('#sh-stock', it.name); const g0 = gold; row.onclick();
    if (document.getElementById('qty-modal').style.display === 'flex') qtyPick(1); return { cost: shopCost(it), paid: g0 - gold, row: row.textContent.replace(/\s+/g, ' ').trim() }; };
  const mul = shopMul();
  const b0 = buy(0), b10 = buy(10), b40 = buy(40);
  // sell a copy of the same piece: its row and the gold it pays, at Charisma 0 and 10
  shopTab = 'all';
  const sell = (cha) => { ATTRS.charisma = cha; const s = { ...it, qty: 1 }; delete s._boughtBack; BAG.push(s); renderShop();
    const raw = sellPrice(s); const g0 = gold; const rows = [...document.querySelectorAll('#sh-bag .sh-row')];
    rows[rows.length - 1].onclick(); if (document.getElementById('qty-modal').style.display === 'flex') qtyPick(1);
    return { raw, got: gold - g0, inBag: BAG.includes(s) }; };
  const s0 = sell(0), s10 = sell(10), s40 = sell(40);
  const backs = (merchantStock[_merchantKey()] || []).filter(x => x._boughtBack && x.name === it.name).map(x => x.buyPrice);
  ATTRS.charisma = 40; const backCost = backs.map(b => shopCost({ buyPrice: b, _boughtBack: true }));
  closeShop(); ATTRS.charisma = 0;
  return { name: it.name, base: it.buyPrice, mul, b0, b10, b40, s0, s10, s40, backs, backCost };
});
const want = (p) => Math.max(1, Math.round(r.base * r.mul * (1 - p)));
check('Charisma 0 pays the town’s price', r.b0.paid === r.b0.cost && r.b0.cost === want(0), r.b0);
check('Charisma 10 pays 10% less, and the row shows what is charged', r.b10.paid === want(.1) && r.b10.paid < r.b0.paid && r.b10.row.includes(String(r.b10.paid)), { b10: r.b10, want: want(.1) });
check('Charisma 40 is capped at a quarter off', r.b40.paid === want(.25), { b40: r.b40, want: want(.25) });
check('selling: Charisma 10 is paid 10% more, 40 a quarter more', r.s0.got === r.s0.raw && r.s10.got === Math.round(r.s10.raw * 1.1) && r.s40.got === Math.round(r.s40.raw * 1.25) && r.s10.got > r.s0.got, { s0: r.s0, s10: r.s10, s40: r.s40 });
const hub = await page.evaluate(() => { const rd = () => { const t = document.getElementById('derived-grid').textContent; const m = /Barter Bonus\s*\+(\d+)%/.exec(t); return m && +m[1]; };
  ATTRS.intelligence = 10; ATTRS.charisma = 0; renderHubAttrs(); const i10 = rd(); ATTRS.intelligence = 0; ATTRS.charisma = 7; renderHubAttrs(); const c7 = rd();
  ATTRS.charisma = 40; renderHubAttrs(); const c40 = rd(); ATTRS.charisma = 0; renderHubAttrs(); return { i10, c7, c40 }; });
check('a bought-back piece costs what you were paid for it, whatever your Charisma', r.backs.length === 3 && r.backs.join() === [r.s0.got, r.s10.got, r.s40.got].join() && r.backCost.join() === r.backs.join(), { backs: r.backs, backCost: r.backCost });
check('the hub’s Barter row reads Charisma only, capped at 25%', hub.i10 === 0 && hub.c7 === 7 && hub.c40 === 25, hub);
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
