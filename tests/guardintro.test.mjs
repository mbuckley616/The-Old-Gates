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
// S2229 (Michael's B on #1540, Aurenne's court): a fine booked in a town of Aurenne is on the Compact's one ledger for the island, so
// another Aurenne town's guard halts you for it; it grows 10% a game-week, never past double; after the yield, prison, a night a 100
// gold (1 to 3), the ledger cleared and the stolen goods taken.
const auIds = await page.evaluate(() => { anchoredPlaces(); const S = [...CELLS.values()].filter(c => c.type !== 'sea' && nationKeyOf(c.i, c.j) === 'aurenne').flatMap(c => c.sites); const T = S.filter(s => s.kind === 'town'); return T.slice(0, 2).map(s => s.id); });
check(`two towns of Aurenne (${auIds})`, auIds.length === 2 && await g.settle(auIds[0]));
const au_a = await page.evaluate(([A, B]) => { const S = WORLD.settle.get(A); forceTime(11);
  worldState.crime = { dunmore: { bounty: 40, debt: 1, last: dayNow() } }; BAG.splice(0, BAG.length, ...BAG.filter(b => !b.stolen));
  bookCrime(S.site, 'theft', 40); const L = fineRec(S); const town = worldState.crime[A].bounty;
  const r = { town, ledger: L.bounty, atB: bountyAt(B), dun: bountyAt('dunmore'), nat: (nationRecord('aurenne') || {}).name, court: courtOf(S), debt: worldState.crime[A].debt };
  const n = (S.npcs || []).find(x => x.def && x.def.role === 'Guard'); px = n.g.position.x + 2; pz = n.g.position.z; CR.cool = 0; tickCrime(1 / 60, 0);
  r.halt = [...document.querySelectorAll('#dlg-choices > button')].map(b => b.textContent.trim()); try { closeDialog(); } catch (e) {}
  const d0 = worldState.gameTimeAbsMinutes; const wk = []; for (let k = 1; k <= 12; k++) { worldState.gameTimeAbsMinutes = d0 + k * 7 * 1440; tickCrimeDay(); wk.push(fineRec(S).bounty); } r.wk = wk;
  worldState.gameTimeAbsMinutes = d0 + 12 * 7 * 1440; worldState.gameTimeMinutes = 11 * 60;
  return r; }, auIds);
console.log(JSON.stringify(au_a));
check(`a theft in ${auIds[0]} (90) is on the Compact's ledger, not the town's (${au_a.town}), and ${auIds[1]}'s guard would halt you for ${au_a.atB}; Dunmore's 40 its own`, au_a.court === 'aurenne' && au_a.town === 0 && au_a.ledger === 90 && au_a.atB === 90 && au_a.dun === 40 && au_a.debt === 2 && au_a.nat === "the Compact's ledger", au_a);
check(`the guard halts you for the ledger: ${au_a.halt[0]}`, /Pay the fine \(90 gold\)/.test(au_a.halt[0]), au_a.halt);
check(`10% a week, capped at double: ${au_a.wk.join(' → ')}`, au_a.wk[0] === 99 && au_a.wk[1] === 109 && au_a.wk[3] === 132 && au_a.wk[11] === 180 && au_a.wk[7] === 180, au_a.wk);
const au_y = await page.evaluate(([A]) => { const S = WORLD.settle.get(A); const L = fineRec(S); L.bounty = 250; BAG.push({ name: 'A brass cup', type: 'misc', buyPrice: 10, qty: 1, stolen: true });
  offerYield(S, L); const lbl = [...document.querySelectorAll('#dlg-choices > button')].map(b => b.textContent.trim()); try { closeDialog(); } catch (e) {}
  const t0 = worldState.gameTimeAbsMinutes, h0 = worldState.gameTimeMinutes; toPrison(S, L); return { lbl, t0, h0 }; }, auIds);
await page.waitForTimeout(3000);
const au_p = await page.evaluate(([A, t0]) => ({ d: (worldState.gameTimeAbsMinutes - t0) / 60, h: worldState.gameTimeMinutes / 60, led: fineRecAt(A).bounty, cup: BAG.some(b => b.name === 'A brass cup'), nat: nationRecord('aurenne') }), [auIds[0], au_y.t0]);
console.log(JSON.stringify(au_y), JSON.stringify(au_p));
check(`the yield offers *${au_y.lbl.find(x => /Prison/.test(x))}*; taken, ${au_p.d.toFixed(1)} h pass to 7:00, the ledger is clear and the stolen cup taken`, au_y.lbl.some(x => /Prison \(3 nights\)\./.test(x)) && !au_y.lbl.some(x => /cells/.test(x)) && Math.abs(au_p.d - (20 + 48)) < 0.1 && Math.abs(au_p.h - 7) < .1 && au_p.led === 0 && !au_p.cup && !au_p.nat, au_p);
// S2230 (Michael's B on #1540, Aurenne's contract): at the halt the Factor's work (the town's own job) is set against the ledger, due
// in 5 days; the guards let you by while it runs unless the ledger grows; turned in, no gold and the ledger falls by its sum; lapsed, it stands.
const k = await page.evaluate(([A]) => { const S = WORLD.settle.get(A); forceTime(11); worldState.crime = {};
  bookCrime(S.site, 'theft', 70); const L = fineRec(S); const labels = () => [...document.querySelectorAll('#dlg-choices > button')].map(b => b.textContent.trim());
  const n = (S.npcs || []).find(x => x.def && x.def.role === 'Guard'); px = n.g.position.x + 2; pz = n.g.position.z;
  confront(n, S, L); const halt = labels(); try { closeDialog(); } catch (e) {}
  const g0 = gold; const q = contractTake(S, L); const r = { halt, ledger: L.bounty, title: q && q.title, active: !!qFind(q.id), days: (q.due - absMin()) / 1440, again: contractTopic(n, S, L).length };
  CR.cool = 0; tickCrime(1 / 60, 0); r.letBy = !dlgOpen; try { closeDialog(); } catch (e) {}
  bookCrime(S.site, 'lock', 0); fineRec(S); CR.cool = 0; tickCrime(1 / 60, 0); r.haltNew = dlgOpen; try { closeDialog(); } catch (e) {}
  qComplete(q); const paid = qTurnIn(q); r.paid = paid; r.gold = gold - g0; r.after = fineRec(S).bounty; r.turned = q.turnedIn;
  return r; }, auIds);
console.log(JSON.stringify(k));
check(`the halt offers *${k.halt.find(x => /contract/.test(x))}*; taken on a ledger of ${k.ledger}, ${k.title}, due in ${k.days.toFixed(2)} days, the guards let you by`, k.halt.some(x => /A contract\. \(the Factor.s work, by /.test(x)) && k.ledger === 120 && k.active && Math.abs(k.days - 5) < .01 && k.again === 0 && k.letBy, k);
check(`a new wrong while it runs is halted for; done and turned in, no gold (${k.gold}) and the ledger 145 → ${k.after}`, k.haltNew && k.paid === 0 && k.gold === 0 && k.after === 25 && k.turned, k);
const lp = await page.evaluate(([A]) => { const S = WORLD.settle.get(A); worldState.crime = {}; bookCrime(S.site, 'theft', 30); const L = fineRec(S);
  const q = contractTake(S, L); const live0 = contractLive(L); worldState.gameTimeAbsMinutes += 6 * 1440; _datedAt = 0; tickDatedWork(); return { live0, lapsed: !!q.lapsed, live: contractLive(L), ledger: L.bounty, topic: contractTopic(null, S, L).length }; }, auIds);
console.log(JSON.stringify(lp));
check(`past the 5 days the work is taken back and the ledger (${lp.ledger}) stands; a new contract may be asked`, lp.live0 && lp.lapsed && !lp.live && lp.ledger === 80 && lp.topic === 1, lp);
const fd = await page.evaluate(([A]) => { const S = WORLD.settle.get(A); worldState.crime = {}; bookCrime(S.site, 'theft', 30); const L = fineRec(S); const g0 = gold;
  const q = contractTake(S, L); qComplete(q); const t = lordTopics(S.site).find(x => /done/.test(x.label)); const line = t && t.fn(); return { line, gold: gold - g0, ledger: fineRec(S).bounty }; }, auIds);
console.log(JSON.stringify(fd));
check(`turned in to the Factor: “${fd.line}”, no gold`, /contract is met.*ledger is clear/.test(fd.line || '') && fd.gold === 0 && fd.ledger === 0, fd);
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
