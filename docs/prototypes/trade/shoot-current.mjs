// Today's counter and loot window, for the trade page: Dunmore's smith at 1 pm, and a bandit's chest.
// node docs/prototypes/trade/shoot-current.mjs  (writes current-*.png and current.json beside this file)
import { boot } from '../../../tests/lib/game.mjs';
import fs from 'fs'; import path from 'path'; import { fileURLToPath } from 'url';
const here = path.dirname(fileURLToPath(import.meta.url));
const g = await boot(); const { page } = g;
await g.intoWorld(); await g.settle('dunmore');
await page.evaluate(() => { forceTime(13); const S = WORLD.settle.get('dunmore');
  const h = S.houses.find(x => x.type === 'weapon' && x.keeper) || S.houses.find(x => x.type === 'armor' && x.keeper);
  px = h.exitX; pz = h.exitZ; goToInterior(h); });
await page.waitForTimeout(4500);
await page.evaluate(() => { forceTime(13); PHP = Math.round(maxHP * .72); ATTRS.charisma = 6;
  for (const it of [SHOP_STOCK.weapon[0], SHOP_STOCK.armor[0], SHOP_STOCK.potion[0], SHOP_STOCK.potion[0], SHOP_STOCK.potion[2], SHOP_STOCK.misc[2], SHOP_STOCK.misc[2], SHOP_STOCK.misc[0]]) bagAdd(JSON.parse(JSON.stringify(it)));
  gold = 142;
  if (typeof intNPCPos !== 'undefined' && intNPCPos) { px = intNPCPos.x + .4; pz = intNPCPos.z + 2.6; const dx = intNPCPos.x - px, dz = intNPCPos.z - pz; yaw = Math.atan2(-dx, -dz); pitch = -.06; } });
await g.frames(30);
// the forge alone, for the proposed sheets to sit on (the game frame is 600 tall; the page's screens are 720)
await page.evaluate(() => { for (const e of document.querySelectorAll('#g > *')) if (e.id !== 'c') { e.dataset.v = e.style.visibility; e.style.visibility = 'hidden'; } });
await page.screenshot({ path: path.join(here, 'backdrop-forge.png'), clip: { x: 0, y: 0, width: 1280, height: 600 } });
await page.evaluate(() => { for (const e of document.querySelectorAll('#g > *')) if (e.id !== 'c') e.style.visibility = e.dataset.v || ''; });
const data = {};
data.shop = await page.evaluate(() => { openShop();
  const rows = sel => [...document.querySelectorAll(sel + ' .sh-row')].map(r => ({ t: r.innerText.replace(/\s*\n\s*/g, ' | ').trim(), cls: r.className }));
  return { title: document.getElementById('sh-title').textContent, sub: document.getElementById('sh-sub').textContent, gold, cha: ATTRS.charisma, barter: barterPct(), mul: shopMul(),
    wt: (document.getElementById('sh-bag-wt') || {}).textContent, eq: Object.fromEntries(Object.entries(EQ).map(([k, v]) => [k, v && v.name])),
    tabs: [...document.querySelectorAll('#sh-tabs .sh-tab')].map(t => t.textContent.trim()), stock: rows('#sh-stock'), bag: rows('#sh-bag'),
    locks: SHOP_STOCK[currentHouse.type].filter(it => it.type === 'equip').map(it => [it.name, canEquip(it).msg || '', it.reqAttr, it.reqVal, sellPrice(it), it.buyPrice]),
    attrs: { ...ATTRS }, level: typeof plvl !== 'undefined' ? plvl : null,
    house: { name: currentHouse.name, type: currentHouse.type, keeper: currentHouse.keeper, tagline: currentHouse.tagline } }; });
await page.screenshot({ path: path.join(here, 'current-shop.png') });
// the quantity prompt on a stack of arrows if the smith sells them, else the first potion in the bag
data.qty = await page.evaluate(() => { const rs = [...document.querySelectorAll('#sh-stock .sh-row')]; const r = rs.find(r => /Arrow/.test(r.textContent));
  if (r) r.onclick(); else { const b = [...document.querySelectorAll('#sh-bag .sh-row')].find(r => /Potion|Tonic|Draught/.test(r.textContent)); b && b.onclick(); }
  const m = document.getElementById('qty-modal'); return m && m.style.display === 'flex' ? m.innerText.replace(/\s*\n\s*/g, ' | ') : null; });
if (data.qty) await page.screenshot({ path: path.join(here, 'current-qty.png') });
await page.evaluate(() => { closeQtyModal(); closeShop(); });
data.loot = await page.evaluate(() => {
  const R = Math.random; let sd = 7; Math.random = () => (sd = (sd * 16807) % 2147483647) / 2147483647;
  const items = []; for (let i = 0; i < 5; i++) { const it = rollLoot(1.2, 'bandit'); if (it) items.push(it); }
  Math.random = R;
  items.push({ name: 'Gold Coins', ico: '🪙', type: 'gold', value: 37 });
  openLoot({ displayName: 'Bandit’s Chest', items });
  return { title: document.getElementById('lp-title').textContent, sub: document.getElementById('lp-sub').textContent,
    rows: [...document.querySelectorAll('#lp-list .lp-item')].map(r => r.innerText.replace(/\s*\n\s*/g, ' | ')),
    items: items.map(it => ({ name: it.name, type: it.type, qty: it.qty, value: it.value, wt: itemWeight(it), sell: sellPrice(it), stat: itemStatShort(it), desc: lootItemDesc(it), tier: it.tier, mat: it.matCol, ench: !!it.enchant })) };
});
await page.screenshot({ path: path.join(here, 'current-loot.png') });
await page.evaluate(() => closeLoot());
fs.writeFileSync(path.join(here, 'current.json'), JSON.stringify(data, null, 1));
console.log('errors', g.errs);
await g.close();
