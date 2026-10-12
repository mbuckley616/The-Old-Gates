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
check('the yield: *Pay double* first, *The cells.* offered, no introduction', !intro(r.yield) && /Pay double/.test(r.yield[0]) && r.yield.some(x => /The cells\./.test(x)), r.yield);
check('the same guard spoken to in the street still lets you give your name', intro(r.street), r.street);
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
