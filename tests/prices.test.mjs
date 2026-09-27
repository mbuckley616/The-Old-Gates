// Prices at the counter (Session 169): indoors the shop charges its own town's price (prosperity and the faction
// discount); the list, the quantity prompt and the "Bought" line all show what is charged. The critic found the
// multiplier 1 at every counter (the room's coordinates are no place on the map) and the list showing the base price.
import { boot, check } from './lib/game.mjs';
const g = await boot(); const { page } = g;
await g.intoWorld(); await g.settle('dunmore');

const out = await page.evaluate(() => { forceTime(13); const S = WORLD.settle.get('dunmore'); px = S.site.x; pz = S.site.z; worldState.crime = {}; const F = WORLD.fstate(); F.crown.rank = 0;
  const h = S.houses.find(x => x.type === 'potion' && x.keeper) || S.houses.find(x => /weapon|armor|potion|misc/.test(x.type) && x.keeper); window._h = h;
  const square = WORLD.priceMulHere(), at = WORLD.priceMulAt('dunmore'); px = h.exitX; pz = h.exitZ; goToInterior(h); return { square, at, shop: h.name }; });
await page.waitForTimeout(4500); await g.hide();

const counter = await page.evaluate(() => { forceTime(13); const mul = shopMul(); openShop(); const open = shopOpen;
  const rows = [...document.querySelectorAll('#sh-stock .sh-row')].map(r => r.textContent.replace(/\s+/g, ' ').trim()).slice(0, 4);
  return { mul, open, rows, inside: isInterior() }; });
check('at the counter the multiplier is the town’s own, as in the square', counter.inside && counter.open && Math.abs(counter.mul - out.at) < 1e-9 && Math.abs(out.at - out.square) < 1e-9 && counter.mul !== 1, { out, counter });

// buy one thing whole and one by the quantity prompt; the list, the charge and the message agree
const buy = await page.evaluate(() => { gold = 5000; renderShop(); const mul = shopMul();
  // the first row that buys on a click, and the first that opens the quantity prompt
  const rows = [...document.querySelectorAll('#sh-stock .sh-row')]; let whole = null, stack = null;
  for (const r of rows) { if (!r.onclick) continue; const g0 = gold, n0 = BAG.length; const txt = r.textContent.replace(/\s+/g, ' ');
    r.onclick(); const modal = document.getElementById('qty-modal').style.display === 'flex';
    if (modal) { if (stack) { closeQtyModal(); continue; } const unit = _qtyCtx.unitPrice, base = _qtyCtx.it.buyPrice, name = _qtyCtx.it.name; qtyPick(1); stack = { name, base, unit, want: Math.max(1, Math.round(base * mul)), paid: g0 - gold, listed: txt }; }
    else { if (whole) continue; const last = document.getElementById('msg').textContent; const it = BAG[BAG.length - 1]; whole = { name: it && it.name, paid: g0 - gold, msg: last, listed: txt }; }
    if (whole && stack) break; }
  return { mul, whole, stack }; });
const listedHas = (row, n) => row && new RegExp('(^|\\D)' + n + '(\\D|$)').test(row.listed);
check('by the quantity prompt: the unit is the town’s price, and that is what is charged', !!buy.stack && (buy.stack.unit === buy.stack.want && buy.stack.paid === buy.stack.unit), buy.stack);

// the Crown's discount reaches the counter too, and goes with a fine
const disc = await page.evaluate(() => { const F = WORLD.fstate(); F.crown.done = 6; F.crown.rank = 2; const ranked = shopMul();
  worldState.crime = { dunmore: { bounty: 25, debt: 1, last: 0 } }; const fined = shopMul(); worldState.crime = {}; F.crown.rank = 0; F.crown.done = 0; closeShop(); return { ranked, fined }; });
check('the faction discount applies at the counter and is withdrawn while a fine stands', Math.abs(disc.ranked / out.at - .9) < .005 && Math.abs(disc.fined - out.at) < 1e-9, { disc, at: out.at });
// a whole item, at the forge: charged the town's price, and the list and the message show that price
await page.evaluate(() => { exitInterior(); }); await page.waitForTimeout(2500); await g.hide();
await page.evaluate(() => { forceTime(13); const S = WORLD.settle.get('dunmore'); const h = S.houses.find(x => /weapon|armor/.test(x.type) && x.keeper); px = h.exitX; pz = h.exitZ; goToInterior(h); });
await page.waitForTimeout(4500); await g.hide();
const forge = await page.evaluate(() => { forceTime(13); openShop(); gold = 5000; renderShop(); const mul = shopMul(); let whole = null;
  for (const r of [...document.querySelectorAll('#sh-stock .sh-row')]) { if (!r.onclick) continue; const g0 = gold, n0 = BAG.length; const txt = r.textContent.replace(/\s+/g, ' ');
    r.onclick(); if (document.getElementById('qty-modal').style.display === 'flex') { closeQtyModal(); continue; }
    const it = BAG[BAG.length - 1]; whole = { name: it && it.name, paid: g0 - gold, msg: document.getElementById('msg').textContent, listed: txt, mul }; break; }
  closeShop(); return whole; });
buy.whole = forge;
check('a whole item: charged the town’s price, and the list and the message show that price', buy.whole && buy.whole.paid > 0 && new RegExp('for ' + buy.whole.paid + '🪙').test(buy.whole.msg) && listedHas(buy.whole, buy.whole.paid), buy.whole);
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
