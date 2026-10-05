// Charisma's merchant access (Session 333, Michael's A on #58): at 5 points a merchant shows one piece from the tier
// above its best: equipment one material up, tonics one strength up. Below 5, or a shop with nothing tiered, nothing.
import { boot, check } from './lib/game.mjs';
const g = await boot(); const { page } = g;
await g.intoWorld(); await g.settle('dunmore');

const houses = await page.evaluate(() => WORLD.settle.get('dunmore').houses.filter(h => h.keeper).map(h => h.type));
const shopAt = async (type) => {
  await page.evaluate((type) => { forceTime(13); const S = WORLD.settle.get('dunmore'); const h = S.houses.find(x => x.type === type && x.keeper);
    window._h = h; px = h.exitX; pz = h.exitZ; goToInterior(h); }, type);
  // S512 — wait for the room itself (the entry lands behind a fade's timer, which a slow runner can push past a fixed pause)
  await page.waitForFunction(() => currentHouse === window._h && !!interiorScene, null, { timeout: 60000 }); await page.waitForTimeout(500); await g.hide();
  const r = await page.evaluate(() => { forceTime(13); const rows = () => [...document.querySelectorAll('#sh-stock .sh-row')].map(r => r.textContent.replace(/\s+/g, ' ').trim());
    const tbl = currentHouse.id && currentHouse.id.startsWith('ih') ? IH_SHOP_STOCK : SHOP_STOCK; const base = tbl[currentHouse.type] || tbl.misc;
    ATTRS.charisma = 4; openShop(); gold = 99999; renderShop(); const at4 = rows();
    ATTRS.charisma = 5; renderShop(); const at5 = rows(); const extra = _chaExtraItem(base, 5);
    let bought = null; if (extra) { const row = [...document.querySelectorAll('#sh-stock .sh-row')].find(r => r.textContent.includes(extra.name)); const g0 = gold; const n0 = BAG.filter(b => b.name === extra.name).length;
      if (row) { row.onclick(); if (document.getElementById('qty-modal').style.display === 'flex') qtyPick(1); } bought = { paid: g0 - gold, cost: shopCost(extra), got: BAG.filter(b => b.name === extra.name).length - n0 }; }
    closeShop(); ATTRS.charisma = 0;
    const tiers = base.filter(i => i.type === 'equip' && i.tier && !i.torchType).map(i => i.tier); const ptiers = base.filter(i => i._tier).map(i => i._tier);
    return { type: currentHouse.type, n4: at4.length, n5: at5.length, extra: extra && { name: extra.name, tier: extra.tier, _tier: extra._tier }, top: tiers.length ? Math.max(...tiers) : 0, ptop: ptiers.length ? Math.max(...ptiers) : 0, bought }; });
  await page.evaluate(() => exitInterior()); await page.waitForFunction(() => !currentHouse && !isInterior(), null, { timeout: 60000 }); await page.waitForTimeout(500);
  return r;
};

const w = await shopAt(houses.includes('weapon') ? 'weapon' : 'armor');
check('a smith at Charisma 5 shows one more row than at 4: the same kind one material up', w.n5 === w.n4 + 1 && w.extra && w.extra.tier === w.top + 1, w);
check('the next-tier piece is bought at the counter like any other', w.bought && w.bought.got === 1 && w.bought.paid === w.bought.cost && w.bought.cost > 0, w);
const p = await shopAt('potion');
check('an apothecary at 5 shows one tonic a strength up', p.n5 === p.n4 + 1 && p.extra && p.extra._tier === p.ptop + 1, p);

const edge = await page.evaluate(() => ({
  below: _chaExtraItem(SHOP_STOCK.weapon, 4),
  inn: _chaExtraItem(SHOP_STOCK.inn, 10),
  cap: _chaExtraItem([makeItem(10, WEAPON_TYPES.find(t => t.type === 'Sword'), null, false)], 10),
  armour: (x => x && [x.name, x.tier])(_chaExtraItem(SHOP_STOCK.armor, 5)),
  ih: (x => x && [x.name, x.tier])(_chaExtraItem(IH_SHOP_STOCK.weapon, 5)),
  master: _chaExtraItem([makePotion('ward_master')], 5) }));
check('nothing below 5, nothing at an inn, nothing past Cosmic or past Master', edge.below === null && edge.inn === null && edge.cap === null && edge.master === null, edge);
check('armour goes up by its own kind (Iron Cuirass → Steel Cuirass); Ironhaven’s armory to Mithril', edge.armour && edge.armour[0] === 'Steel Cuirass' && edge.armour[1] === 4 && edge.ih && edge.ih[1] === 5, edge);
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
