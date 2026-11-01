// Who you have met (the critic, 8 Oct, s477): `worldState.met` was keyed by the first name alone, so after talking to
// Róisín in Ironhaven another Róisín in La Grise opened with *Back again?*. Since Session 649 it is keyed by the person:
// name, town and the town's number for a second of that name (`_twin`). Since Session 1432 (First Words) a later greeting
// is the speaker's people's *Again* line or the temper's, and the first is never one of those, nor an opinion of your people.
import { boot, check } from './lib/game.mjs';
const g = await boot(); const { page } = g;
await g.intoWorld();
for (const id of ['dunmore', 'portclare']) await g.settle(id);
const r = await page.evaluate(() => {
  const MET = [...Object.values(GREET_AGAIN).flat(), ...Object.values(GREET_AGAIN_OB).flat(), ...Object.values(TEMPERS).flatMap(t => t.greet)];
  const isMet = s => MET.some(m => String(s).startsWith(m));
  const defs = [];
  for (const id of ['dunmore', 'portclare']) { const S = WORLD.settle.get(id); if (!S) continue;
    for (const d of S.npcs.map(n => n.def).concat((S.houses || []).map(h => h.dlg).filter(Boolean)))
      if (d && d.bio && Object.getOwnPropertyDescriptor(d, 'greeting')) defs.push(d); }
  const byName = new Map(); for (const d of defs) { if (!byName.has(d.name)) byName.set(d.name, []); byName.get(d.name).push(d); }
  const across = [...byName.values()].find(L => L.some(d => d._siteId !== L[0]._siteId));
  const within = [...byName.values()].find(L => L.filter(d => d._siteId === L[0]._siteId).length > 1);
  const out = { n: defs.length, pairs: 0, sameWrong: 0, aFirst: [], aAgain: [], b: [], keys: [] };
  const trial = (A, B) => { worldState.met = {};
    const a1 = String(A.greeting); const a2 = String(A.greeting); const b1 = String(B.greeting);
    out.pairs++; out.aFirst.push(a1); out.aAgain.push(a2); out.b.push(A.name + ' (' + A._siteId + '/' + (A._twin || 0) + ') → ' + B.name + ' (' + B._siteId + '/' + (B._twin || 0) + '): ' + b1);
    return { a1: isMet(a1), a2: isMet(a2), b1: isMet(b1) }; };
  const res = [];
  if (across) { const A = across[0], B = across.find(d => d._siteId !== A._siteId); for (let i = 0; i < 6; i++) res.push(Object.assign({ kind: 'across' }, trial(A, B))); }
  if (within) { const L = within.filter(d => d._siteId === within[0]._siteId); for (let i = 0; i < 6; i++) res.push(Object.assign({ kind: 'within' }, trial(L[0], L[1]))); }
  out.keys = Object.keys(worldState.met || {});
  return { out, res, across: !!across, within: !!within };
});
console.log(JSON.stringify(r).slice(0, 1800));
check('two people of one first name in two towns found, and two in one town', r.across && r.within, r.out.n);
check('the first greeting is a stranger\'s, the second remembers you', r.res.length > 0 && r.res.every(x => !x.a1 && x.a2), r.res);
check('the other person of that name greets you as a stranger', r.res.every(x => !x.b1), r.out.b.slice(0, 4));
check('the key names the person: name|town|number', r.out.keys.length > 0 && r.out.keys.every(k => /^[^|]+\|[^|]+\|\d+$/.test(k)), r.out.keys);

// First Words (S1432): a Markman greets a Markman player with a line of GREET_FIRST.markman.markman and nothing after it (or his trade's
// own line, one time in three); his second greeting is an Again line or his temper's; no greeting carries an opinion of your people.
const fw = await page.evaluate(() => {
  const defs = []; for (const id of ['dunmore', 'portclare']) { const S = WORLD.settle.get(id); if (!S) continue;
    for (const d of S.npcs.map(n => n.def).concat((S.houses || []).map(h => h.dlg).filter(Boolean))) if (d && d.bio) defs.push(d); }
  const OF = Object.values(PEOPLES).flatMap(P => Object.values(P.of || {}).flat());
  const out = { first: [], again: [], bad: [], ofHits: [], peoples: {}, hinted: 0 };
  const esc = t => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const HINTS = [ER_DEBT.hint.markman, ER_LETTER.hint.markman, ER_FEVER.hint.markman].map(t => new RegExp(' ' + esc(t) + '$'))
    .concat([new RegExp(' ' + esc(ER_NAME.hint.markman({ who: '\u0001' })).replace('\u0001', '.+') + '$')]);
  const save = worldState.people;
  for (const pp of ['markman', 'gatelander', 'aurennais', 'oldblood']) { worldState.people = pp;
    for (const d of defs) { out.peoples[d.people] = (out.peoples[d.people] || 0) + 1;
      for (let i = 0; i < 4; i++) { worldState.met = {}; const a = String(d.greeting), b = String(d.greeting);
        if (OF.some(o => a.includes(o) || b.includes(o))) out.ofHits.push(a + ' / ' + b);
        if (pp === 'markman' && d.people === 'markman' && i === 0) { out.first.push(a); out.again.push(b);
          const okA = GREET_FIRST.markman.markman.includes(a) || (d._roleGreet || []).includes(a);
          // an errand's giver says its hint after the Again line while the errand is on offer (S1554, S1600, S1677; errandGreet). Whether
          // one is on offer turns with the game's week, so the hint is read off the end first: one of the markman hints, the name's with
          // any name (its own words are the errands suite's)
          let b0 = b; for (const h of HINTS) { const m = b0.match(h); if (m) { b0 = b0.slice(0, m.index); out.hinted++; break; } }
          const okB = GREET_AGAIN.markman.includes(b0) || (TEMPERS[d.temper] || { greet: [] }).greet.includes(b0);
          if (!okA || !okB) out.bad.push(d.name + ' (' + d.role + '): ' + a + ' / ' + b); } } } }
  worldState.people = save; worldState.met = {};
  return out;
});
console.log(' first words:', JSON.stringify({ first: fw.first.slice(0, 6), again: fw.again.slice(0, 6), peoples: fw.peoples, hinted: fw.hinted }));
check('a Markman greets a Markman from First words (or his trade\'s line), then from Again (or his temper)', fw.first.length > 0 && fw.bad.length === 0, fw.bad.slice(0, 6));
check('no greeting, first or later, to any of the four peoples carries an opinion of the listener\'s people', fw.ofHits.length === 0, fw.ofHits.slice(0, 4));
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
