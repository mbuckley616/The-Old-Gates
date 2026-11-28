// Charisma's barter (Session 339, Michael's A on #61): 1% a point off what you pay at a counter and on what you're
// paid, up to a quarter. A bought-back item keeps the price you were paid. The hub's row shows the same number.
import { boot, check } from './lib/game.mjs';
const g = await boot(); const { page } = g;
await g.intoWorld(); await g.settle('dunmore');
await page.evaluate(() => { forceTime(13); const S = WORLD.settle.get('dunmore'); const h = S.houses.find(x => x.type === 'weapon' && x.keeper) || S.houses.find(x => x.type === 'armor' && x.keeper);
  px = h.exitX; pz = h.exitZ; goToInterior(h); });
await page.waitForTimeout(4500); await g.hide();
const r = await page.evaluate(() => {
  // S953 (skills and perks A): Charisma 0.5% a point to a quarter, Speech 0.2% a level on top; Speech is pinned at 0 so Charisma is measured alone
  forceTime(13); SKILLS.speech = { lv: 0, p: 0 }; openShop(); gold = 99999;
  const tbl = currentHouse.id && currentHouse.id.startsWith('ih') ? IH_SHOP_STOCK : SHOP_STOCK; const base = tbl[currentHouse.type] || tbl.misc;
  const it = base.find(i => i.type === 'equip' && i.buyPrice > 20 && !i.torchType);
  const rowOf = (sel, name) => [...document.querySelectorAll(sel + ' .sh-row')].find(r => r.textContent.includes(name));
  const buy = (cha) => { ATTRS.charisma = cha; renderShop(); const row = rowOf('#sh-stock', it.name); const g0 = gold; row.onclick();
    if (document.getElementById('qty-modal').style.display === 'flex') qtyPick(1); return { cost: shopCost(it), paid: g0 - gold, row: row.textContent.replace(/\s+/g, ' ').trim() }; };
  const mul = shopMul(), home = homeMul(it); /* S2643 — prices by home (#1971 B): the counter's own make is ×0.85 at home */
  const b0 = buy(0), b10 = buy(10), b40 = buy(60);
  // sell a copy of the same piece: its row and the gold it pays, at Charisma 0 and 10
  shopTab = 'all';
  const sell = (cha) => { ATTRS.charisma = cha; const s = { ...it, qty: 1, buyPrice: it.buyPrice * 5 }; /* S2643 — a dearer copy: at 16 raw the home's ×0.85 rounded Charisma 10's 5% away */ delete s._boughtBack; BAG.push(s); renderShop();
    const raw = sellPrice(s); const g0 = gold; const rows = [...document.querySelectorAll('#sh-bag .sh-row')];
    rows[rows.length - 1].onclick(); if (document.getElementById('qty-modal').style.display === 'flex') qtyPick(1);
    return { raw, got: gold - g0, inBag: BAG.includes(s) }; };
  const s0 = sell(0), s10 = sell(10), s40 = sell(60);
  const backs = (merchantStock[_merchantKey()] || []).filter(x => x._boughtBack && x.name === it.name).map(x => x.buyPrice);
  ATTRS.charisma = 60; const backCost = backs.map(b => shopCost({ buyPrice: b, _boughtBack: true }));
  closeShop(); ATTRS.charisma = 0;
  return { name: it.name, base: it.buyPrice, mul, home, b0, b10, b40, s0, s10, s40, backs, backCost };
});
const want = (p) => Math.max(1, Math.round(r.base * r.mul * r.home * (1 - p)));
check('Charisma 0 pays the town’s price', r.b0.paid === r.b0.cost && r.b0.cost === want(0), r.b0);
check('Charisma 10 pays 5% less, and the row shows what is charged', r.b10.paid === want(.05) && r.b10.paid < r.b0.paid && r.b10.row.includes(String(r.b10.paid)), { b10: r.b10, want: want(.1) });
check('Charisma 60 is capped at a quarter off', r.b40.paid === want(.25), { b40: r.b40, want: want(.25) });
check('selling: Charisma 10 is paid 5% more, 60 a quarter more', r.s0.got === Math.max(1, Math.round(r.s0.raw * r.home)) && r.s10.got === Math.round(r.s10.raw * r.home * 1.05) && r.s40.got === Math.round(r.s40.raw * r.home * 1.25) && r.s10.got > r.s0.got, { s0: r.s0, s10: r.s10, s40: r.s40, home: r.home });
const hub = await page.evaluate(() => { SKILLS.speech = { lv: 0, p: 0 }; const rd = () => { const t = document.getElementById('derived-grid').textContent; const m = /Barter Bonus\s*\+(\d+)%/.exec(t); return m && +m[1]; };
  ATTRS.intelligence = 10; ATTRS.charisma = 0; renderHubAttrs(); const i10 = rd(); ATTRS.intelligence = 0; ATTRS.charisma = 7; renderHubAttrs(); const c7 = rd();
  ATTRS.charisma = 60; renderHubAttrs(); const c40 = rd(); ATTRS.charisma = 0; renderHubAttrs(); return { i10, c7, c40 }; });
check('a bought-back piece costs what you were paid for it, whatever your Charisma', r.backs.length === 3 && r.backs.join() === [r.s0.got, r.s10.got, r.s40.got].join() && r.backCost.join() === r.backs.join(), { backs: r.backs, backCost: r.backCost });
check('the hub’s Barter row reads Charisma only, capped at 25%', hub.i10 === 0 && hub.c7 === 4 && hub.c40 === 25, hub);
// S2755 — a counter never pays more for a piece than it asks for one like it: every Dunmore counter's stock, bought and sold back
// at the full barter (Charisma's quarter, Speech's fifth, Haggle, the cape) on a market day, then the sale through the bag's row,
// a stack's prompt and a gold-find buff. Before, a Greater Potion bought for 26 sold back for 28 at Charisma 50 on market day.
const rt = await page.evaluate(() => {
  const S = WORLD.settle.get('dunmore'); const shops = S.houses.filter(x => x.keeper && SHOP_STOCK[x.type]); const keep = currentHouse;
  const mk = window.marketHere, bp = window.barterPct, cost = shopCost; let n = 0, over = [], equal = 0, low = null;
  for (const h of shops) { currentHouse = h; const seen = []; window.shopCost = it => { seen.push(it); return cost(it); }; try { renderShop(); } catch (e) {} window.shopCost = cost;
    const stock = [...new Set(seen)].filter(it => !it._boughtBack && it.buyPrice > 0);
    for (const B of [0, .25, .52]) { window.barterPct = () => B; window.marketHere = () => B > 0;
      for (const it of stock) { n++; const c = shopCost(it), s = counterSellPrice({ ...it, qty: 1 }); if (s >= c && c > 1) over.push({ shop: h.type, B, name: it.name, c, s }); if (s === c) equal++;
        if (B === 0 && it.name === 'Greater Potion') low = { c, s, raw: sellPrice(it), home: homeMul(it) }; } } }
  window.barterPct = () => .52; window.marketHere = () => true; currentHouse = shops.find(h => h.type === 'potion') || shops[0];
  const pot = (SHOP_STOCK[currentHouse.type] || []).find(i => i.buyPrice >= 20) || { name: 'Greater Potion', ico: '🫙', type: 'potion', heal: 60, weight: .5, sellMult: .5, buyPrice: 40 };
  const ask = shopCost(pot); gold = 1000; const s1 = { ...pot, qty: 1 }; BAG.push(s1); const g0 = gold; sellItem(BAG.indexOf(s1), counterSellPrice(s1)); const one = gold - g0;
  const fb = { type: 'goldFind', mult: 2, remaining: 1e9 }; ACTIVE_BUFFS.unshift(fb); let buff = null; try { const s2 = { ...pot, qty: 1 }; BAG.push(s2); const g1 = gold; sellItem(BAG.indexOf(s2), counterSellPrice(s2)); buff = gold - g1;
    const s3 = { ...pot, qty: 3 }; BAG.push(s3); openQtyModal(s3, 'sell', BAG.indexOf(s3)); var stackEach = _qtyCtx && _qtyCtx.unitPrice; closeQtyModal(); BAG.splice(BAG.indexOf(s3), 1); } finally { ACTIVE_BUFFS.splice(ACTIVE_BUFFS.indexOf(fb), 1); }
  window.marketHere = mk; window.barterPct = bp; currentHouse = keep;
  return { n, over, equal, low, ask, one, buff, stackEach, name: pot.name };
});
check('no Dunmore counter pays as much as it asks, at full barter on a market day', rt.n > 100 && rt.over.length === 0, { n: rt.n, over: rt.over.slice(0, 6) });
check('a sale at the full barter is a coin under the price, through the row, a gold-find buff and a stack', rt.one === rt.ask - 1 && rt.buff === rt.ask - 1 && rt.stackEach === rt.ask - 1, rt);
check('with no barter the sale is unchanged: half the potion’s price', !!rt.low && rt.low.s === Math.max(1, Math.round(rt.low.raw * rt.low.home)) && rt.low.s < rt.low.c, rt.low);
// S2762 — a trade undone teaches no Speech: selling a piece and buying it back moved no gold and taught two uses, one a second,
// for as long as you clicked. Through buyItem and sellItem at two Dunmore counters, the second's limit cleared before each trade.
const sp = await page.evaluate(() => {
  const S = WORLD.settle.get('dunmore'); const shops = S.houses.filter(x => x.keeper && SHOP_STOCK[x.type]); const keep = currentHouse;
  const A = shops[0], B = shops.find(h => h.id !== A.id); gold = 99999; SKILLS.speech = { lv: 20, p: 0 };
  const use = f => { SKILL_LAST.clear(); const p0 = SKILLS.speech.p, l0 = SKILLS.speech.lv; f(); return SKILLS.speech.lv > l0 ? 'up' : +(SKILLS.speech.p - p0).toFixed(3); };
  const stock = h => (SHOP_STOCK[h.type] || []).filter(i => i.buyPrice > 0 && !isStackable(i));
  const sellLast = () => { const it = BAG[BAG.length - 1]; sellItem(BAG.length - 1, counterSellPrice(it)); };
  const backOf = name => (merchantStock[_merchantKey()] || []).find(x => x._boughtBack && x.name === name);
  currentHouse = A; const it = stock(A)[0], other = stock(A).find(i => i.name !== it.name) || it;
  const r = {};
  r.buy = use(() => buyItem(it)); r.sellSame = use(sellLast); r.buyBack = use(() => buyItem(backOf(it.name))); r.sellAgain = use(sellLast);
  r.buyOther = use(() => buyItem(other)); r.buyOther2 = use(() => buyItem(other));
  const loot = { ...stock(B)[0], qty: 1 }; currentHouse = B; BAG.push(loot); r.sellLoot = use(sellLast);
  currentHouse = A; const found = { ...it, qty: 1 }; currentHouse = B; BAG.push(found); r.sellElsewhere = use(sellLast);
  worldState.gameTimeAbsMinutes = (worldState.gameTimeAbsMinutes || 0) + 1440; r.nextDay = use(() => buyItem(backOf(found.name)));
  currentHouse = keep; return { A: A.type, B: B.type, it: it.name, other: other.name, ...r };
});
check('a sale and its buy-back at one counter teach no Speech; other trade teaches 1 a time', sp.buy === 1 && sp.sellSame === 0 && sp.buyBack === 0 && sp.sellAgain === 0 && sp.buyOther === 1 && sp.buyOther2 === 1 && sp.sellLoot === 1 && sp.sellElsewhere === 1 && sp.nextDay === 1, sp);
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
