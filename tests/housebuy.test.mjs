// Sessions 527–528 (the critic, 5 Oct, s418): buying a house. The seller went on offering the house after the sale and
// took the price each time (`buyHouse` had no owned check, and the topic stayed on her from the town's build); she stood
// at the door of Your House day and night (her `gone` schedule fell to idle), came back when the town streamed her in
// again, and after a reload was the house's resident again. Now the sale is once, the topic comes off her, she leaves
// the town's residents for good and a rebuilt town makes no resident for an owned house. A save in the cellar names
// its town (S528).
import { boot, check } from './lib/game.mjs';
const g = await boot(); const { page } = g;
await g.intoWorld(); await g.settle('dunmore');

const pick = await page.evaluate(() => { const S = WORLD.settle.get('dunmore');
  const h = S.houses.find(h => h.type === 'home' && forSale(h) && S.residents.some(r => r.def === h.dlg));
  if (!h) return null; const res = S.residents.find(r => r.def === h.dlg); px = res.def.x + 3; pz = res.def.z + 3; forceTime(11);
  return { id: h.id, name: h.name, keeper: h.keeper, price: housePrice(h) }; });
check(`Dunmore has a home for sale with its resident (${pick && pick.name}, ${pick && pick.price} gold)`, !!pick, pick);
await g.spin(null, 120);
const before = await page.evaluate((id) => { const S = WORLD.settle.get('dunmore'); const h = S.houses.find(h => h.id === id);
  const res = S.residents.find(r => r.def === h.dlg); const labels = h.dlg.topics.map(t => t.label);
  return { spawned: !!(res && res.n), offers: labels.filter(l => /^Buy this house/.test(l)).length }; }, pick.id);
check('before the sale she is about and offers the house', before.spawned && before.offers === 1, before);

const sale = await page.evaluate((id) => { const S = WORLD.settle.get('dunmore'); const h = S.houses.find(h => h.id === id);
  gold = 5000; const t = h.dlg.topics.find(t => /^Buy this house/.test(t.label)); t.fn(); const g1 = gold;
  t.fn(); buyHouse(h); const g2 = gold;
  return { g1, g2, owned: !!(worldState.owned && worldState.owned[id]), name: h.name,
    offers: h.dlg.topics.filter(t => /^Buy this house/.test(t.label)).length,
    resident: S.residents.some(r => r.def === h.dlg), inNpcs: npcs.some(n => n.def === h.dlg),
    logs: (typeof LOG !== 'undefined' ? LOG : []).length }; }, pick.id);
check(`the sale takes ${pick.price} once (5000 → ${sale.g1}); the old topic and a second buy take nothing (${sale.g2})`, sale.g1 === 5000 - pick.price && sale.g2 === sale.g1 && sale.owned && sale.name === 'Your House', sale);
check('the topic comes off her, and she leaves the town\'s residents and the scene', sale.offers === 0 && !sale.resident && !sale.inNpcs, sale);

await g.spin(null, 240);
const later = await page.evaluate((id) => { const S = WORLD.settle.get('dunmore'); const h = S.houses.find(h => h.id === id); forceTime(23);
  return { back: npcs.some(n => n.def && n.def.name === h.keeper && n.g.visible && Math.hypot(n.g.position.x - h.doorX, n.g.position.z - h.doorZ) < 6) }; }, pick.id);
await g.spin(null, 120);
const night = await page.evaluate((id) => { const S = WORLD.settle.get('dunmore'); const h = S.houses.find(h => h.id === id);
  return { back: npcs.some(n => n.def && n.def.name === h.keeper && n.g.visible && Math.hypot(n.g.position.x - h.doorX, n.g.position.z - h.doorZ) < 6) }; }, pick.id);
check('nobody of her name stands by Your House\'s door at 11h or at 23h', !later.back && !night.back, { later, night });

const rebuilt = await page.evaluate((id) => { const t = WORLD.siteAnywhere('dunmore'); disposeSettlement('dunmore'); genSettlement(t);
  const S = WORLD.settle.get('dunmore'); const h = S.houses.find(h => h.id === id);
  return { name: h && h.name, owned: h && h.ownedByPlayer, resident: S.residents.some(r => r.def === h.dlg), offers: h && h.dlg ? h.dlg.topics.filter(t => /^Buy this house/.test(t.label)).length : 0,
    residents: S.residents.length }; }, pick.id);
check(`the town built again: Your House, no resident for it, nothing on sale (${rebuilt.residents} other residents)`, rebuilt.name === 'Your House' && rebuilt.owned && !rebuilt.resident && rebuilt.offers === 0 && rebuilt.residents > 0, rebuilt);

const cellar = await page.evaluate((id) => { const S = WORLD.settle.get('dunmore'); const h = S.houses.find(h => h.id === id); const was = currentHouse;
  currentHouse = cellarFor(h); const a = ssPlaceName(); currentHouse = h; const b = ssPlaceName(); currentHouse = was; return { cellar: a, upstairs: b }; }, pick.id);
check(`a save in the cellar names the town ("${cellar.cellar}"), as upstairs does ("${cellar.upstairs}")`, /, Dunmore$/.test(cellar.cellar) && /cellar/.test(cellar.cellar) && cellar.upstairs === 'Your House, Dunmore', cellar);
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
