// Session 530 (the critic, 5 Oct, s418): buying a house. The seller went on offering the house after the sale and
// took the price each time (`buyHouse` had no owned check, and the topic stayed on her from the town's build); she stood
// at the door of Your House day and night (her `gone` schedule fell to idle), came back when the town streamed her in
// again, and after a reload was the house's resident again. Now the sale is once, the topic comes off her, she leaves
// the town's residents for good and a rebuilt town makes no resident for an owned house. A save in the cellar names
// its town.
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
// S2143 (the look builder): a workbench fitted in Your House stands against a whole wall of its ground floor, clear of the room's solids,
// and you work at it from its front (house._fits.bench, homeFitHere at 2 m); Dunmore's townhouse has no such wall free (its one run is the
// back door), so there it is worked anywhere in the house. A tanner's rack fitted stands in the yard at once
await page.evaluate((id) => { const S = WORLD.settle.get('dunmore'); const h = S.houses.find(h => h.id === id); gold = 5000; homeFit(h, 'bench'); px = h.exitX; pz = h.exitZ; goToInterior(h); }, pick.id);
for (let n = 0; n < 40 && !(await page.evaluate(() => isInterior())); n++) await page.waitForTimeout(250);
await g.frames(2);
const fit = await page.evaluate(() => { const h = currentHouse, B = interiorScene.children.find(o => o.userData.homeFit === 'bench'), sp = h._fits && h._fits.bench, mine = INT_SOL.find(s => s.homeFit === 'bench');
  const others = mine ? INT_SOL.filter(s => !s.homeFit && s.y0 < 1.6 && s.y1 > .05 && s.x0 < mine.x1 && s.x1 > mine.x0 && s.z0 < mine.z1 && s.z1 > mine.z0).length : -1;
  const sx = px, sz = pz, far = homeFitHere('bench'); let at = false; if (sp) { px = sp.x; pz = sp.z; at = homeFitHere('bench'); px = sx; pz = sz; }
  return { placed: !!B, sp, others, inRoom: !!mine && mine.x0 >= 0 && mine.z0 >= 0 && mine.x1 <= h._roomW && mine.z1 <= h._roomD, at, far, L: B && B.userData.kit.L }; });
check(fit.placed ? `a workbench fitted stands in Your House (${fit.L} m, its front at ${fit.sp.x}, ${fit.sp.z}), clear of the room's solids, worked from its front` : 'a workbench fitted in a room with no whole wall free for it is worked anywhere in the house (the rules\' fallback)',
  fit.placed ? fit.others === 0 && fit.inRoom && fit.at && !fit.far : !fit.sp && fit.far, fit);
// S2147 (the look builder): a clay oven and a kiln fitted (PKIT.props.clay) stand by a wall too, each clear of the room's solids and of the
// bench, worked from its front; a room with no wall free for one keeps the rules' fallback for it
const clay = await page.evaluate(() => { const h = currentHouse, r = homeFitRec(h); for (const k of ['oven', 'kiln']) if (!r.fit.includes(k)) r.fit.push(k); homeFitsDress(h); const o = {};
  for (const k of ['oven', 'kiln']) { const G = interiorScene.children.find(x => x.userData.homeFit === k), mine = INT_SOL.find(s => s.homeFit === k), sp = h._fits[k];
    const hit = mine ? INT_SOL.filter(s => s !== mine && s.y0 < 1.6 && s.y1 > .05 && s.x0 < mine.x1 - 1e-6 && s.x1 > mine.x0 + 1e-6 && s.z0 < mine.z1 - 1e-6 && s.z1 > mine.z0 + 1e-6).length : -1;
    let at = true; if (sp) { const sx = px, sz = pz; px = sp.x; pz = sp.z; at = homeFitHere(k); px = sx; pz = sz; }
    o[k] = { placed: !!G, hit, at, tris: G && G.userData.kit.tris, draws: G && G.userData.kit.draws, inRoom: !mine || (mine.x0 >= 0 && mine.z0 >= 0 && mine.x1 <= h._roomW && mine.z1 <= h._roomD) }; }
  return o; });
check(`a clay oven and a kiln fitted stand clear of the room and the bench, worked from their fronts, or fall back (oven ${clay.oven.placed ? clay.oven.tris + ' tris' : 'anywhere'}, kiln ${clay.kiln.placed ? clay.kiln.tris + ' tris' : 'anywhere'})`,
  ['oven', 'kiln'].every(k => clay[k].placed ? clay[k].hit === 0 && clay[k].inRoom && clay[k].at && clay[k].draws <= 5 : clay[k].at), clay);
await page.evaluate(() => exitInterior()); for (let n = 0; n < 40 && (await page.evaluate(() => isInterior())); n++) await page.waitForTimeout(250);
const yard = await page.evaluate((id) => { const S = WORLD.settle.get('dunmore'); const h = S.houses.find(h => h.id === id); homeFit(h, 'rack'); const n1 = S.racks.filter(R => R.house === id).length;
  homeUnfit(h, 'rack'); return { n1, n2: S.racks.filter(R => R.house === id).length }; }, pick.id);
check('a tanner\'s rack fitted stands in the yard at once, and goes when taken out', yard.n1 === 1 && yard.n2 === 0, yard);
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
