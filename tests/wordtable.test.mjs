// Magic B's tables (Session 1570; magic-build.md, the deep-work card's first slice): the 24 words, six schools, 42 live cells of the
// 120, the five forms by the guild's rank, the six riders and the join rule, and the sheet's worked costs (its `wordcost`, folded in):
// Caor sent 30, Cloch laid 42, Caor held 15 a second, Sioc with Tonn laid 98, 59 at Uisce 100, 41 with both at Mastery.
import { boot, check } from './lib/game.mjs';
const g = await boot(); const { page } = g;
const r = await page.evaluate(() => {
  const out = {};
  out.n = WORDS.length; out.ids = new Set(WORDS.map(w => w.id)).size;
  out.schools = {}; for (const w of WORDS) out.schools[w.school] = (out.schools[w.school] || 0) + 1;
  out.cells = WORDS.reduce((t, w) => t + FORM_ORDER.filter(f => wordLive(w.id, f)).length, 0);
  out.formsOnly = WORDS.every(w => Object.keys(w.forms).every(f => FORMS[f]));
  // the sixteen spells keep their ids, Intelligence needs and costs
  out.kept = SPELLS.map(s => { const w = WORD_BY[s.id]; return w && w.cost === s.cost && w.intReqs.join() === s.intReqs.join() ? null : s.id; }).filter(Boolean);
  out.renamed = ['siul_uisce', 'suil_oiche', 'suil_fiodora'].map(id => WORD_BY[id].nameIr);
  out.ranks = FORM_ORDER.map(f => FORMS[f].rank);
  out.riders = Object.keys(RIDERS).sort();
  // joins
  out.join = {
    ok: wordJoin('tonn', 'laid', 'sioc', 2, 2).ok, plain: wordJoin('caor', 'sent', null, 1, 0).ok,
    notRider: wordJoin('caor', 'sent', 'tonn', 2, 2), self: wordJoin('caor', 'sent', 'caor', 2, 2).ok,
    worn: wordJoin('luas', 'worn', 'caor', 2, 2).ok, low: wordJoin('tonn', 'laid', 'sioc', 2, 1).ok,
    dead: wordJoin('caor', 'laid', null, 2, 0).ok };
  // the worked costs, the school at 50 and no buff
  const c = (id, f, rd, o) => wordCost(id, f, rd, Object.assign({ skill: 50, buff: 1, tier: 2, riderTier: 2 }, o));
  out.cost = [c('caor', 'sent'), c('cloch_ghear', 'laid'), c('caor', 'held'), c('tonn', 'laid', 'sioc'),
    c('tonn', 'laid', 'sioc', { skill: 100 }), c('tonn', 'laid', 'sioc', { skill: 100, tier: 3, riderTier: 3 })];
  out.touched = c('caor', 'touched');
  return out; });
console.log(JSON.stringify(r));
check(`24 words, all ids distinct (${r.n}, ${r.ids})`, r.n === 24 && r.ids === 24, r);
check(`six schools: Tine 3, Uisce 5, Gaoth 5, Cloch 3, Scáth 4, Solas 4 (${JSON.stringify(r.schools)})`,
  JSON.stringify(r.schools) === JSON.stringify({ tine: 3, uisce: 5, gaoth: 5, cloch: 3, scath: 4, solas: 4 }), r);
check(`42 live cells of 120 (${r.cells}), every one a form`, r.cells === 42 && r.formsOnly, r);
check(`the sixteen spells keep their ids, Intelligence needs and costs (off: ${r.kept.join(', ') || 'none'})`, r.kept.length === 0, r);
check(`three take their head word: ${r.renamed.join(', ')}`, r.renamed.join() === 'Uisce,Oíche,Súil', r);
check(`the forms by rank: Sent and Worn Novice, Touched Adept, Laid Evoker, Held Warlock (${r.ranks})`, r.ranks.join() === '0,0,1,2,3', r);
check(`six riders: ${r.riders.join(', ')}`, r.riders.join() === 'caor,freamh,leigheas,sideen,sioc,solas_gheal', r);
check(`Sioc joins Tonn laid; a lone word needs no join`, r.join.ok && r.join.plain, r);
check(`a refused join says so: "${r.join.notRider.say}"`, !r.join.notRider.ok && r.join.notRider.say === 'The words won’t join.', r);
check('no word joins itself, nothing joins Worn, both must be at Comprehension, a dead cell refuses', !r.join.self && !r.join.worn && !r.join.low && !r.join.dead, r);
check(`the worked costs: ${r.cost.join(', ')} (30, 42, 15, 98, 59, 41)`, r.cost.join() === '30,42,15,98,59,41', r);
check(`Touched is ×0.6: Caor touched ${r.touched}`, r.touched === 18, r);
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
