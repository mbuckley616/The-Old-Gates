// Who you have met (the critic, 8 Oct, s477): `worldState.met` was keyed by the first name alone, so after talking to
// Róisín in Ironhaven another Róisín in La Grise opened with *Back again?*. Since Session 649 it is keyed by the person:
// name, town and the town's number for a second of that name (`_twin`).
import { boot, check } from './lib/game.mjs';
const g = await boot(); const { page } = g;
await g.intoWorld();
for (const id of ['dunmore', 'portclare']) await g.settle(id);
const r = await page.evaluate(() => {
  const MET = ["Back again?", "You. Good.", "I remember you.", "Thought I'd seen the last of you."];
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
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
