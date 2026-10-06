// *an* before a vowel (Session 597). The concept artist's run of 5 Oct heard townsfolk say *I'm a armourer*: a
// townsperson's trade is spoken after a fixed *a* (`I'm a ${bio.trade}`), and three trades start with a vowel (armourer,
// apothecary, innkeeper). The Mages' Guild's rank-up had the same fault (*You're a Adept / a Evoker / a Archmage of the
// Mages' Guild now.*), and so had one rumour (*They say a <word> walks the marsh*) when the made-up word began with one.
// All three take `aOrAn(w)` now.
import { boot, check } from './lib/game.mjs';
const g = await boot(); const { page } = g;
await g.intoWorld();
const towns = ['dunmore', 'portclare'];
const found = { trades: {}, bad: [], topics: 0 };
for (const id of towns) {
  await g.settle(id);
  const r = await page.evaluate((id) => { const S = WORLD.settle.get(id); if (!S) return null; const out = { trades: {}, bad: [], topics: 0 };
    const defs = S.npcs.map(n => n.def).concat((S.houses || []).map(h => h.dlg).filter(Boolean));
    for (const d of defs) { if (d.bio) out.trades[d.bio.trade] = (out.trades[d.bio.trade] || 0) + 1;
      let ts = []; try { ts = d.topics || []; } catch (e) {}
      const walk = (L) => { for (const t of L || []) { if (!t) continue; let s = ''; try { s = typeof t.response === 'string' ? t.response : ''; } catch (e) {} if (s) { out.topics++; const m = s.match(/\b[Aa] [AEIOUaeiou][a-z]+/g); if (m) out.bad.push(d.name + ': ' + m.join(', ')); } if (t.follow) walk(t.follow); } };
      walk(ts); }
    return out; }, id);
  if (!r) continue;
  for (const k in r.trades) found.trades[k] = (found.trades[k] || 0) + r.trades[k];
  found.bad.push(...r.bad); found.topics += r.topics;
}
console.log(JSON.stringify(found));
check('the towns\' people have trades, among them one that starts with a vowel', Object.keys(found.trades).some(t => /^[aeiou]/.test(t)), found.trades);
check(`no townsperson's topic says *a* before a vowel (${found.topics} replies read)`, found.topics > 100 && found.bad.length === 0, found.bad.slice(0, 10));
const said = await page.evaluate(() => { const L = ['armourer', 'apothecary', 'innkeeper', 'farmer', 'Adept', 'Evoker', 'Archmage', 'Novice', 'Warlock'];
  return L.map(w => aOrAn(w) + ' ' + w); });
console.log(JSON.stringify(said));
check('*an armourer*, *an apothecary*, *an innkeeper*, *a farmer*', said.slice(0, 4).join('|') === 'an armourer|an apothecary|an innkeeper|a farmer', said);
// the Mages' Guild's rank-ups, through the guild's own turn-in: done 2 → Adept at 3, 5 → Evoker at 6, 11 → Archmage at 12
const ranks = await page.evaluate(() => { const st = gstate().guild_m, S = WORLD.settle.get('dunmore'), out = [], _td = taskDone; taskDone = () => true;
  try { for (const d of [2, 5, 8, 11]) { st.active = null; st.done = d; offer('guild_m', S.site); out.push(turnIn('guild_m').replace(/^Good work\. \d+ gold\. /, '')); } } finally { taskDone = _td; }
  return out; });
console.log(JSON.stringify(ranks));
check('the Mages\' Guild names you *an Adept*, *an Evoker*, *a Warlock*, *an Archmage*', ranks.join('|') === "You're an Adept of the Mages' Guild now.|You're an Evoker of the Mages' Guild now.|You're a Warlock of the Mages' Guild now.|You're an Archmage of the Mages' Guild now.", ranks);
const rum = await page.evaluate(() => { const all = []; for (const k in RUMORS) for (const s of RUMORS[k]) all.push(s); return { n: all.length, bad: all.filter(s => /\b[Aa] [AEIOUaeiou]/.test(s)) }; });
console.log(JSON.stringify(rum));
check(`no rumour says *a* before a vowel (${rum.n} read)`, rum.n > 10 && rum.bad.length === 0, rum);
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
