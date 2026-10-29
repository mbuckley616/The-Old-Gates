// Magic B's guild and books (Session 1587; magic-build.md, "Where the words are", the sheet's `wordguild`). The Mages' Guild teaches the
// five forms by rank (Sent and Worn at Novice, Touched at Adept, Laid at Evoker, Held at Warlock), free, and never sells a word. At Adept
// and above its tutor deepens a word held at Impression to Comprehension in two clock hours, free, if Intelligence meets the word's
// need, and stops there. A found book deepens its word to Comprehension if you hold it, and does nothing if you don't.
import { boot, check } from './lib/game.mjs';
const g = await boot(); const { page } = g;
await g.intoWorld();
const r = await page.evaluate(() => { const out = {};
  for (const k of Object.keys(knownWords)) delete knownWords[k]; formsGranted.length = 0;
  const G = worldState.guild || (worldState.guild = {}); G.guild_m = G.guild_m || { done: 0, active: null };
  const at = (done) => { G.guild_m.done = done; const rk = Math.min(4, Math.floor(done / 3)); const t = spellShopTopics(rk);
    return { rank: mageRank(), forms: formsHeld().join(','), labels: t.map(x => x.label), priced: t.filter(x => /\d+\s*g\)/.test(x.label)).length, say: t[0].response }; };
  knownWords.sioc = 1; knownWords.caor = 2; knownWords.reo = 1;
  out.novice = at(2); out.adept = at(3); out.evoker = at(6); out.warlock = at(9);
  // the tutor at Adept: Sioc needs Intelligence 15 at Comprehension
  G.guild_m.done = 3; ATTRS.intelligence = 10;
  const tut = () => spellShopTopics(1).find(x => /Study Sioc/.test(x.label));
  out.lowSay = tut().fn(); out.lowTier = knownWords.sioc;
  ATTRS.intelligence = 20; const m0 = worldState.gameTimeAbsMinutes; out.okSay = tut().fn(); out.okTier = knownWords.sioc; out.mins = worldState.gameTimeAbsMinutes - m0;
  out.after = spellShopTopics(1).filter(x => /Study/.test(x.label)).map(x => x.label);
  // a migrated character keeps a form it used, below its rank
  G.guild_m.done = 0; formsGranted.push('laid'); out.granted = formsHeld().join(','); formsGranted.length = 0;
  // books
  ATTRS.intelligence = 30; BAG.push(spellbookItem('tonn', 1)); let i = BAG.length - 1; readSpellbook(i);
  out.unheld = { tier: knownWords.tonn || 0, kept: BAG[i] && BAG[i].spellId === 'tonn' }; BAG.splice(i, 1);
  knownWords.tonn = 1; BAG.push(spellbookItem('tonn', 1)); i = BAG.length - 1; const n0 = BAG.length; readSpellbook(i);
  out.held = { tier: knownWords.tonn, used: BAG.length === n0 - 1 };
  BAG.push(spellbookItem('tonn', 1)); i = BAG.length - 1; const n1 = BAG.length; readSpellbook(i);
  out.comp = { tier: knownWords.tonn, kept: BAG.length === n1 }; BAG.splice(i, 1);
  return out; });
console.log(JSON.stringify(r));
check(`a Novice: Sent and Worn (${r.novice.forms}), no tutor, nothing for sale (${r.novice.labels.join(' | ')})`, r.novice.forms === 'sent,worn' && r.novice.labels.length === 1 && !r.novice.priced, r.novice);
check(`an Adept: and Touched (${r.adept.forms}); the tutor offers the two Impression words`, r.adept.rank === 1 && r.adept.forms === 'sent,worn,touched' && r.adept.labels.filter(l => /^Study/.test(l)).length === 2 && !r.adept.priced, r.adept);
check(`an Evoker: and Laid (${r.evoker.forms})`, r.evoker.forms === 'sent,worn,touched,laid' && !r.evoker.priced, r.evoker);
check(`a Warlock: all five (${r.warlock.forms}); no word for sale at any rank`, r.warlock.forms === 'sent,worn,touched,laid,held' && !r.warlock.priced && !r.warlock.labels.some(l => /^(Learn|Deepen)/.test(l)), r.warlock);
check(`the tutor refuses at Intelligence 10 (${r.lowSay}), Sioc kept at ${r.lowTier}`, r.lowTier === 1 && /Intelligence 15/.test(r.lowSay), r);
check(`at 20 Sioc is deepened to Comprehension (${r.okTier}) in two hours (${r.mins} minutes), free`, r.okTier === 2 && r.mins === 120, r);
check(`the tutor stops at Comprehension: only Reo is left to study (${r.after.join(' | ')})`, r.after.length === 1 && /Reo/.test(r.after[0]), r);
check(`a form a migrated character used is kept below its rank (${r.granted})`, r.granted === 'sent,worn,laid', r);
check(`a book of a word not held gives nothing and is kept (${JSON.stringify(r.unheld)})`, r.unheld.tier === 0 && r.unheld.kept, r.unheld);
check(`a book of a word held at Impression deepens it (${r.held.tier}) and is used; at Comprehension it gives nothing (${r.comp.tier}, kept)`, r.held.tier === 2 && r.held.used && r.comp.tier === 2 && r.comp.kept, r);
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
