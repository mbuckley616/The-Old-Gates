// A guard's fine and his yield do not open with *My name is …* (Session 734; the critic's s572 run). The stranger's introduction
// topic was offered first to a man halting you over a fine, or offering you the cells, above *Pay the fine* and *The cells.*
// Those three dialogues carry `noIntro`; the same guard, spoken to in the street, still lets you give your name.
import { boot, check } from './lib/game.mjs';
const g = await boot(); const { page } = g;
await g.intoWorld(); await g.settle('dunmore');
const r = await page.evaluate(() => {
  const S = WORLD.settle.get('dunmore'); const site = S.site; forceTime(11);
  const n = (S.npcs || []).find(x => x.def && x.def.role === 'Guard');
  if (!n) return { none: true };
  metNPCs.delete(n.def.name);
  const C = worldState.crime || (worldState.crime = {}); C[site.id] = { bounty: 50, debt: 2, last: dayNow() }; const c = C[site.id];
  const labels = () => [...document.querySelectorAll('#dlg-choices > button')].map(b => b.textContent.trim());
  const out = {};
  confront(n, S, c); out.halt = labels(); try { closeDialog(); } catch (e) {}
  confrontIndoor({ npc: n }, S, c); out.indoor = labels(); try { closeDialog(); } catch (e) {}
  offerYield(S, c); out.yield = labels(); try { closeDialog(); } catch (e) {}
  openDialog(n.def); out.street = labels(); try { closeDialog(); } catch (e) {}
  out.name = n.def.name; return out; });
console.log(JSON.stringify(r));
check('a guard in Dunmore', !r.none, r);
const intro = l => l.some(x => /My name is/.test(x));
check('the halt over a fine: *Pay the fine* first, no introduction', !intro(r.halt) && /^1?\.?\s*Pay the fine/.test(r.halt[0].replace(/^\d+\.\s*/, '')), r.halt);
check('the halt indoors: *Pay the fine* first, no introduction', !intro(r.indoor) && /Pay the fine/.test(r.indoor[0]), r.indoor);
// S2227 (Michael's B on #1540): Dunmore is the Crown's, and the Crown's court offers the stocks after the yield, not the cells
check('the yield: *Pay double* first, *The stocks* offered (the Crown\'s court), no introduction', !intro(r.yield) && /Pay double/.test(r.yield[0]) && r.yield.some(x => /The stocks \(\d h\)\./.test(x)), r.yield);
check('the same guard spoken to in the street still lets you give your name', intro(r.street), r.street);
// S2227 (Michael's B on #1540, the Crown's court): goods stolen in Dunmore handed back at the halt take their worth off the fine and the
// points' 25 stays; goods of another town are kept; an hour in the stocks for every 50 gold, from 1 to 6
const rs = await page.evaluate(() => { const S = WORLD.settle.get('dunmore'), id = S.site.id, c = { bounty: 110, debt: 2, last: dayNow() };
  BAG.push({ name: 'A tin locket', type: 'misc', buyPrice: 20, qty: 1, stolen: true, stolenAt: id }, { name: 'Wool Cloak', type: 'misc', buyPrice: 40, qty: 1, stolen: true, stolenAt: id }, { name: 'A bone comb', type: 'misc', buyPrice: 15, qty: 1, stolen: true, stolenAt: 'elsewhere' });
  const lbl = restitutionTopic(S, c, () => {}, false).map(t => t.label); const fell = restitute(S, c), left = c.bounty, kept = BAG.filter(b => b.stolen).map(b => b.name);
  for (let i = BAG.length - 1; i >= 0; i--) if (BAG[i].stolen) BAG.splice(i, 1);
  return { court: courtOf(S), lbl, fell, left, kept, hours: [0, 50, 51, 180, 400].map(b => stocksHours({ bounty: b })) }; });
check(`Dunmore's court is the Crown's: “${rs.lbl[0]}”, the fine 110 → ${rs.left} (the goods' ${rs.fell}), another town's comb kept; the stocks ${rs.hours} h`,
  rs.court === 'gatelands' && rs.lbl[0] === 'Hand back the goods (the fine falls to 50 gold)' && rs.fell === 60 && rs.left === 50 && rs.kept.join() === 'A bone comb' && rs.hours.join() === '1,1,2,4,6', rs);
// S2228 (Michael's B on #1540, the Mark's court): a fine in a town of the Mark is a claim, fought at the halt to a yield against the
// guard (tier 3, the bout's rules), 6:00 to noon only; asked later, the halt waits for 6:00. Won: void, half the favour back, the
// keepers serve you; lost: 1.5×, fought once; a blow after his yield is a guard's death. The Mark's half draws into a quarter buffer.
await page.evaluate(() => REN.setSize(320, 180, false));
const id = await page.evaluate(() => { anchoredPlaces(); const S = [...CELLS.values()].filter(c => c.type !== 'sea' && nationKeyOf(c.i, c.j) === 'mark').flatMap(c => c.sites); return (S.find(s => s.kind === 'town') || {}).id; });
check(`a Markish town (${id}) stands`, !!id && await g.settle(id));
const a = await page.evaluate(id => { const S = WORLD.settle.get(id), site = S.site; forceTime(14);
  const n = (S.npcs || []).find(x => x.def && x.def.role === 'Guard'); if (!n) return { none: true };
  const C = worldState.crime || (worldState.crime = {}); const c = C[site.id] = { bounty: 100, debt: 4, last: dayNow() };
  const shop = S.houses.find(h => h.keeper && h.type !== 'home'); (worldState.refuse || (worldState.refuse = {}))[shop.id] = dayNow() + 5;
  const labels = () => [...document.querySelectorAll('#dlg-choices > button')].map(b => b.textContent.trim());
  confront(n, S, c); const late = labels(); const t = claimTopic(n, S, c)[0]; t.fn(); try { closeDialog(); } catch (e) {}
  const at = c.claimAt, waitH = (at - absMin()) / 60;
  px = n.g.position.x + 2; pz = n.g.position.z; CR.cool = 0; tickCrime(1 / 60, 0); const haltedEarly = dlgOpen; try { closeDialog(); } catch (e) {}
  forceTime(9); worldState.gameTimeAbsMinutes = at + 180; CR.cool = 0; tickCrime(1 / 60, 0); const halted = dlgOpen; const morning = labels(); try { closeDialog(); } catch (e) {}
  const fav0 = favor(site.id) ; claimStart(n, S, c); const B = WORLD.bout; return { court: courtOf(S), late, waitH, haltedEarly, halted, morning, bout: !!B && B.foe.name, guardHidden: !n.g.visible, fav0, shop: shop.id, hp: B && B.foe.maxHp }; }, id);
console.log(JSON.stringify(a));
check(`${id}'s court is the Mark's: after noon *${a.late.find(x => /claim/.test(x))}*, and the halt waits ${a.waitH.toFixed(1)} h`, a.court === 'mark' && a.late.some(x => /Fight the claim\. \(from 6:00\)/.test(x)) && a.waitH > 0 && a.waitH <= 24 && !a.haltedEarly, a);
check(`at 9:00 the guard halts you again, *${(a.morning.find(x => /claim/.test(x)) || '')}*; fought, he draws as ${a.bout} (${a.hp} health)`, a.halted && a.morning.some(x => /Fight the claim\. \(to a yield; lose, and it is 150 gold\)/.test(x)) && !!a.bout && a.guardHidden, a);
await page.evaluate(() => { const e = WORLD.bout.foe; e.hp = Math.floor(e.maxHp * .2); });
await g.spin(null, 300);
const w = await page.evaluate(([id, shop, fav0]) => { const c = worldState.crime[id], S = WORLD.settle.get(id); const n = (S.npcs || []).find(x => x.def && x.def.role === 'Guard');
  return { bout: !!WORLD.bout, bounty: c.bounty, debt: c.debt, fav: favor(id) - fav0, refuse: worldState.refuse[shop] != null, guard: n.g.visible, foes: ZONES.world.enemies.filter(e => e._claim && !e.dead).length }; }, [id, a.shop, a.fav0]);
console.log(JSON.stringify(w));
check(`won: the claim void (${w.bounty}), the town +${w.fav} (debt 4 → ${w.debt}), the keeper serves you, the guard back at his post`, !w.bout && w.bounty === 0 && w.fav === 2 && w.debt === 2 && !w.refuse && w.guard && w.foes === 0, w);
const l = await page.evaluate(id => { const S = WORLD.settle.get(id), n = (S.npcs || []).find(x => x.def && x.def.role === 'Guard'); const c = worldState.crime[id]; c.bounty = 80; forceTime(10);
  claimStart(n, S, c); const B = WORLD.bout; px = B.x + 6.5; pz = B.z; return !!B; }, id);
await g.spin(null, 5);
const lo = await page.evaluate(id => { const S = WORLD.settle.get(id), n = (S.npcs || []).find(x => x.def && x.def.role === 'Guard'); const c = worldState.crime[id];
  return { bout: !!WORLD.bout, bounty: c.bounty, lost: c.claimLost, again: claimTopic(n, S, c).length, guard: n.g.visible }; }, id);
console.log(JSON.stringify(lo));
check(`lost over the rope: the claim stands at 1.5× (80 → ${lo.bounty}), and is not fought twice`, l && !lo.bout && lo.bounty === 120 && lo.lost && lo.again === 0 && lo.guard, lo);
await page.evaluate(id => { const S = WORLD.settle.get(id), n = (S.npcs || []).find(x => x.def && x.def.role === 'Guard'); const c = worldState.crime[id]; c.bounty = 80; delete c.claimLost; forceTime(10);
  claimStart(n, S, c); const B = WORLD.bout; px = B.x; pz = B.z; }, id);
await page.evaluate(() => { const e = WORLD.bout.foe; e.hp = Math.floor(e.maxHp * .2); });
await g.spin(null, 60);
const mu = await page.evaluate(id => { const B = WORLD.bout; const st = B && B.state; const e = B.foe; e.hp = e.hp - 5; _offenceS = playClockS + 1; return st; }, id);
await g.spin(null, 5);
const mr = await page.evaluate(id => ({ bout: !!WORLD.bout, shut: !!worldState.crime[id].shut, bounty: worldState.crime[id].bounty }), id);
console.log(mu, JSON.stringify(mr));
check(`a blow after the yield is a guard's death: the gates shut (${mr.bounty})`, mu === 'yielded' && !mr.bout && mr.shut, mr);
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
