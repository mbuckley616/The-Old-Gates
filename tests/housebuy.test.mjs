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
  /* S2222 — a rack of tools hangs only on whole wall: rays every 0.1 m across the rack at 1.05 and 1.3 m meet the wall (Maeve's, s1572: over two sashes); a bench with none stands before a window */
  let rackWall = null; if (B && B.userData.kit.rack) { const ms = []; interiorScene.traverse(o => { if (o.isMesh && o.visible && !o.userData.daylight) { for (let p = o; p; p = p.parent) if (p.userData && p.userData.homeFit) return; ms.push(o); } });
    const ry = B.rotation.y, nx = Math.sin(ry), nz = Math.cos(ry), ax = Math.cos(ry), az = -Math.sin(ry), R = new THREE.Raycaster(), hw = B.userData.kit.L / 2 - .02; rackWall = 0; let n = 0;
    for (let u = -hw; u <= hw + 1e-6; u += .1) for (const y of [1.05, 1.3]) { n++; R.set(new THREE.Vector3(B.position.x + ax * u + nx * .3, y, B.position.z + az * u + nz * .3), new THREE.Vector3(-nx, 0, -nz)); R.far = .45; if (R.intersectObjects(ms, false).length) rackWall++; } rackWall = rackWall + '/' + n; }
  return { placed: !!B, sp, others, inRoom: !!mine && mine.x0 >= 0 && mine.z0 >= 0 && mine.x1 <= h._roomW && mine.z1 <= h._roomD, at, far, L: B && B.userData.kit.L, rack: B && B.userData.kit.rack, rackWall }; });
check(fit.placed ? `a workbench fitted stands in Your House (${fit.L} m, its front at ${fit.sp.x}, ${fit.sp.z}), clear of the room's solids, worked from its front, its rack ${fit.rack ? 'on whole wall (' + fit.rackWall + ' rays)' : 'left off before a window'}` : 'a workbench fitted in a room with no whole wall free for it is worked anywhere in the house (the rules\' fallback)',
  fit.placed ? fit.others === 0 && fit.inRoom && fit.at && !fit.far && (!fit.rack || fit.rackWall.split('/')[0] === fit.rackWall.split('/')[1]) : !fit.sp && fit.far, fit);
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
// Session 2153: the house's own yard counts. A fitting stood outdoors (h._yardFits[k], world metres, the look builder's to lay) is the house
// within 2 m: E there opens the house's page, and homeFitHere holds for that fitting and no other; 3 m off, nothing
const yd = await page.evaluate((id) => { if (isInterior()) exitInterior(); const S = WORLD.settle.get('dunmore'); const h = S.houses.find(h => h.id === id);
  const r = homeFitRec(h); if (!r.fit.includes('garden')) r.fit.push('garden'); const x0 = px, z0 = pz;
  h._yardFits = { garden: { x: px + 1.2, z: pz } }; const o = { out: !isInterior() };
  const Y = homeYardAt(); o.at = !!Y && Y.h === h && Y.k === 'garden'; o.here = homeHere() === h; o.garden = homeFitHere('garden'); o.kiln = homeFitHere('kiln');
  interact(); o.page = homeOpen; if (homeOpen) closeHousePage();
  px = x0 + 4.5; o.far = !homeYardAt() && !homeHere() && !homeFitHere('garden');
  r.fit.splice(r.fit.indexOf('garden'), 1); px = x0 + 1.2; o.unfitted = !homeYardAt(); delete h._yardFits; px = x0; pz = z0; return o; }, pick.id);
check('in your house\'s yard, 1.2 m from a garden stood there, E opens the house\'s page and the garden counts (the kiln, not stood there, does not); 3.3 m off, nothing', yd.out && yd.at && yd.here && yd.garden && !yd.kiln && yd.page && yd.far && yd.unfitted, yd);
// S2165 (the look builder): a garden fitted is stood in the yard at once (PKIT.props.garden): four beds, each a solid, the paths between them
// free; its middle, where the paths cross, is the yard's spot (h._yardFits.garden), the garden within reach there and every bed within 2.3 m;
// what is sown shows at its stage; taken out, it goes with its solids and its spot
const gd = await page.evaluate((id) => { if (isInterior()) exitInterior(); const S = WORLD.settle.get('dunmore'); const h = S.houses.find(h => h.id === id);
  const r = homeFitRec(h); if (!r.fit.includes('garden')) r.fit.push('garden'); gardenBeds(h); homeFitsDress(h);
  const G = (S.gardens || []).find(G => G.house === id), sp = h._yardFits && h._yardFits.garden, o = { stood: !!G && !!sp, sol: S.sol.filter(s => s.bt === 'garden' && s.house === id).length };
  if (!o.stood) return o; const x0 = px, z0 = pz; px = sp.x; pz = sp.z; const Y = homeYardAt(); o.at = !!Y && Y.h === h && Y.k === 'garden'; o.free = !WORLD.solidAt(px, pz);
  const c = Math.cos(G.g.rotation.y), s_ = Math.sin(G.g.rotation.y), U = G.g.userData.garden;
  o.beds = U.plots.map(P => { const bx = G.x + P.x * c + P.z * s_, bz = G.z - P.x * s_ + P.z * c; return { solid: WORLD.solidAt(bx, bz), d: +Math.hypot(bx - sp.x, bz - sp.z).toFixed(2) }; });
  /* S2222 — fitted from the page (the house alone), it still keeps off every door of the town and the step before it: no bed's corner within 2 m (Róisín's Goods, s1572: 2.3 m from her step) */
  { let md = 1e9, who = ''; for (const P of U.plots) for (const [u, v] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) { const lx = P.x + u * P.w / 2, lz = P.z + v * P.d / 2, wx = G.x + lx * c + lz * s_, wz = G.z - lx * s_ + lz * c;
      for (const q of S.houses) for (const [a, b] of [[q.doorX, q.doorZ], [q.exitX, q.exitZ]]) { if (a == null) continue; const d = Math.hypot(wx - a, wz - b); if (d < md) { md = d; who = q.id; } } } o.door = { d: +md.toFixed(2), who }; }
  o.draws0 = U.draws; o.tris0 = U.tris; worldState.garden[id][0] = { k: 'second', s: 'oats', at: gameMinNow() - GARDEN_DAYS * 1440 }; U.set(gardenBedsOf(h));
  o.ready = U.beds[0] && U.beds[0].stage === 'ready'; o.tris1 = U.tris; o.draws1 = U.draws; worldState.garden[id][0] = null;
  homeUnfit(h, 'garden'); o.gone = !S.gardens.some(G => G.house === id) && !S.sol.some(s => s.bt === 'garden' && s.house === id) && !(h._yardFits && h._yardFits.garden) && !homeYardAt();
  px = x0; pz = z0; return o; }, pick.id);
check(`a garden fitted stands in the yard (${gd.tris0} tris in ${gd.draws0} draws bare, ${gd.tris1} with ripe oats): four beds solid, its middle free and the house's spot, every bed within 2.3 m and none within 2 m of a door of the town; taken out, it goes`,
  gd.stood && gd.sol === 4 && gd.at && gd.free && gd.door.d >= 2 && gd.beds.length === 4 && gd.beds.every(b => b.solid && b.d < 2.3) && gd.ready && gd.tris1 > gd.tris0 && gd.draws1 <= 6 && gd.gone, gd);
// S2175 (Michael's A on #1495): a bed grows crops only; butter and curd stay bought. A Gatelands house offers oats and apples, not butter,
// and sowing butter or curd is refused with nothing taken from the bag
const crops = await page.evaluate((id) => { const S = WORLD.settle.get('dunmore'); const h = S.houses.find(h => h.id === id);
  const r = homeFitRec(h); if (!r.fit.includes('garden')) r.fit.push('garden'); const L = gardenBeds(h); L[1] = null;
  bagAdd(secondItem('butter', 2)); const n0 = bagCount(b => b.second === 'butter');
  const o = { isle: houseIsle(h), secs: gardenSeconds(h), butter: gardenPlant(h, 1, 'second', 'butter'), curd: gardenPlant(h, 1, 'second', 'curd') };
  o.kept = bagCount(b => b.second === 'butter') === n0; o.bare = !L[1]; bagTake(b => b.second === 'butter', n0); homeUnfit(h, 'garden'); return o; }, pick.id);
check(`a garden bed takes crops only (${crops.isle}: ${crops.secs && crops.secs.join(', ')}); butter is refused (“${crops.butter && crops.butter.why}”) and kept, curd refused`,
  crops.isle === 'gatelands' && crops.secs.join() === 'oats,apples' && !crops.butter.done && crops.kept && crops.bare && !crops.curd.done, crops);
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
