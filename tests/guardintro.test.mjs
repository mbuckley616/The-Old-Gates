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
// S2222 (Michael's B on #1540): Dunmore is the Crown's, and the Crown's court offers the stocks after the yield, not the cells
check('the yield: *Pay double* first, *The stocks* offered (the Crown\'s court), no introduction', !intro(r.yield) && /Pay double/.test(r.yield[0]) && r.yield.some(x => /The stocks \(\d h\)\./.test(x)), r.yield);
check('the same guard spoken to in the street still lets you give your name', intro(r.street), r.street);
// S2222 (Michael's B on #1540, the Crown's court): goods stolen in Dunmore handed back at the halt take their worth off the fine and the
// points' 25 stays; goods of another town are kept; an hour in the stocks for every 50 gold, from 1 to 6
const rs = await page.evaluate(() => { const S = WORLD.settle.get('dunmore'), id = S.site.id, c = { bounty: 110, debt: 2, last: dayNow() };
  BAG.push({ name: 'A tin locket', type: 'misc', buyPrice: 20, qty: 1, stolen: true, stolenAt: id }, { name: 'Wool Cloak', type: 'misc', buyPrice: 40, qty: 1, stolen: true, stolenAt: id }, { name: 'A bone comb', type: 'misc', buyPrice: 15, qty: 1, stolen: true, stolenAt: 'elsewhere' });
  const lbl = restitutionTopic(S, c, () => {}, false).map(t => t.label); const fell = restitute(S, c), left = c.bounty, kept = BAG.filter(b => b.stolen).map(b => b.name);
  for (let i = BAG.length - 1; i >= 0; i--) if (BAG[i].stolen) BAG.splice(i, 1);
  return { court: courtOf(S), lbl, fell, left, kept, hours: [0, 50, 51, 180, 400].map(b => stocksHours({ bounty: b })) }; });
check(`Dunmore's court is the Crown's: “${rs.lbl[0]}”, the fine 110 → ${rs.left} (the goods' ${rs.fell}), another town's comb kept; the stocks ${rs.hours} h`,
  rs.court === 'gatelands' && rs.lbl[0] === 'Hand back the goods (the fine falls to 50 gold)' && rs.fell === 60 && rs.left === 50 && rs.kept.join() === 'A bone comb' && rs.hours.join() === '1,1,2,4,6', rs);
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
