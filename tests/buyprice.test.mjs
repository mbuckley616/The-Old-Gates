// A bought piece keeps its price (Session 366; the critic's s321, backlog I). `buyItem` deleted the bought copy's
// `buyPrice`, so `sellPrice` fell through to its type's default: a dozen Iron Arrows bought for 2 sold back for 5 a piece
// (60, a money loop), an Iron Sword bought for 35 sold for 5, every potion for 8, and cheap goods (a Wooden Bow at 4) sold
// for more than they cost. Now the copy keeps its price and sells at price × sellMult, as a found copy does, and ammo is
// priced by its bundle (a piece is a twelfth of the dozen's price: under a coin, not bought at the counter).
import { boot, check } from './lib/game.mjs';
const g = await boot(); const { page } = g;
await g.intoWorld(); await g.settle('dunmore');
const out = [];
for (const kind of ['misc', 'weapon', 'armor', 'potion']) {
  const ok = await page.evaluate((kind) => { forceTime(13); const S = WORLD.settle.get('dunmore'); const h = S.houses.find(x => x.type === kind && x.keeper);
    if (!h) return false; px = h.exitX; pz = h.exitZ; goToInterior(h); return true; }, kind);
  if (!ok) { out.push({ kind, none: true }); continue; }
  await page.waitForTimeout(4500); await g.hide();
  out.push(await page.evaluate((kind) => {
    forceTime(13); openShop(); shopTab = 'all';
    const tbl = currentHouse.id && currentHouse.id.startsWith('ih') ? IH_SHOP_STOCK : SHOP_STOCK; const stock = (tbl[currentHouse.type] || tbl.misc).filter(i => i.buyPrice > 0);
    const rows = [];
    for (const cha of [0, 10, 25]) { ATTRS.charisma = cha;
      for (const it of stock) {
        // buy one bundle through the counter's own call, then sell every piece of it back through the counter's own call
        BAG.length = 0; gold = 10000; const g0 = gold; buyItem(it); const paid = g0 - gold; const bought = BAG.find(b => b.name === it.name);
        if (!bought) { rows.push({ name: it.name, cha, notBought: true }); continue; }
        const pieces = bought.qty || 1; const kept = bought.buyPrice; const found = counterSellPrice({ ...it, qty: 1 }); const g1 = gold; let n = 0;
        while (BAG.includes(bought) && n < 40) { n++; renderShop(); sellItem(BAG.indexOf(bought), counterSellPrice(bought)); if (BAG.includes(bought) && counterSellPrice(bought) <= 0) break; }
        rows.push({ name: it.name, type: it.type, cha, paid, pieces, kept, found, base: it.buyPrice, got: gold - g1, left: BAG.includes(bought) ? bought.qty : 0 });
        // clear the buy-back overlay so each row starts clean
        merchantStock[_merchantKey()] = [];
      } }
    // a bought-back piece goes home at its own price: sell a found copy, buy it back, and read the bag's copy
    ATTRS.charisma = 0; BAG.length = 0; gold = 10000; const eq = stock.find(i => i.type === 'equip') || stock[0];
    BAG.push({ ...eq, qty: 1 }); renderShop(); sellItem(0, counterSellPrice(BAG[0]));
    const back = (merchantStock[_merchantKey()] || []).find(x => x._boughtBack && x.name === eq.name);
    let backKept = null, backSer = null; if (back) { buyItem(back); const b = BAG.find(x => x.name === eq.name); backKept = b && b.buyPrice; backSer = back && _serItem(back)._bagPrice; }
    closeShop(); ATTRS.charisma = 0; BAG.length = 0;
    return { kind, shop: currentHouse && currentHouse.name, rows, back: { base: eq.buyPrice, kept: backKept, ser: backSer } }; }, kind));
  await page.evaluate(() => exitInterior()); await page.waitForTimeout(2500); await g.hide();
}
for (const o of out) { if (o.none) { console.log(`  no ${o.kind} shop`); continue; }
  console.log(`\n${o.shop} (${o.kind}):  name / Charisma / paid for the bundle / pieces / sold back for`);
  for (const r of o.rows) console.log(`  ${r.name.padEnd(26)} ${String(r.cha).padStart(2)}  ${String(r.paid).padStart(4)}  ${String(r.pieces).padStart(3)}  ${String(r.got).padStart(4)}${r.left ? '  (' + r.left + ' kept: not worth a coin)' : ''}`); }
const all = out.filter(o => !o.none).flatMap(o => o.rows).filter(r => !r.notBought);
const arrows = all.filter(r => r.type === 'ammo');
check('the four kinds of counter were visited and every row bought', out.filter(o => !o.none).length >= 3 && all.length >= 20, out.map(o => [o.kind, o.rows && o.rows.length]));
check('a bought copy keeps its price', all.every(r => r.kept === r.base), all.filter(r => r.kept !== r.base).map(r => [r.name, r.kept, r.base]));
check('nothing bought at a counter sells back for more than it cost, at Charisma 0, 10 or 25', all.every(r => r.got <= r.paid), all.filter(r => r.got > r.paid));
check('a bought sword or potion sells for what the same piece found in a chest does (price × its share, with barter)',
  all.filter(r => r.type !== 'ammo').every(r => r.got === r.found * r.pieces) && all.some(r => r.type === 'equip' && r.base >= 30 && r.got >= 10), all.filter(r => r.type !== 'ammo').map(r => [r.name, r.cha, r.paid, r.got, r.found]));
check('a dozen arrows is no longer a money loop: sold back for nothing, the arrows kept', arrows.length >= 1 && arrows.every(r => r.got === 0 && r.left === r.pieces), arrows);
check('a bought-back piece goes back to its own price, and the save keeps it', out.filter(o => !o.none).every(o => o.back.kept === o.back.base && o.back.ser === o.back.base), out.map(o => o.back));
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
