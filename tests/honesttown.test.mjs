// *How are things here, honestly?* (Session 728, the quest writer's Finding 25). Since Session 698 the answer was the
// map card's word and a second sentence that read prosperity alone: between 35 and 59 it said *Getting by. We get by.*,
// and an occupied town at 60 or more said *Occupied. Better than my father saw.* It is now one line per people and per
// state (good, fair, poor, under siege, held), the siege and the occupation read before prosperity.
import { boot, check } from './lib/game.mjs';
const g = await boot(); const { page } = g;
await g.intoWorld();
await g.settle('dunmore');
const r = await page.evaluate(() => {
  const S = WORLD.settle.get('dunmore'); if (!S) return null;
  const site = S.site, st = TS(site), keep = { p: st.p, flags: { ...st.flags } };
  const flat = (L) => (L || []).flatMap(t => t ? [t, ...flat(t.follow), ...flat(t.then)] : []);
  const defs = S.npcs.map(n => n.def).concat((S.houses || []).map(h => h.dlg).filter(Boolean)).filter(d => d.bio);
  const ask = (d) => { let ts = []; try { ts = d.topics || []; } catch (e) {} const t = flat(ts).find(t => t.label === 'How are things here, honestly?'); if (!t) return null; try { return t.response; } catch (e) { return 'ERR ' + e.message; } };
  const d = defs.find(d => ask(d)); if (!d) return { none: true, defs: defs.length };
  const own = d.people;
  const states = { good: () => { st.p = 77; }, fair: () => { st.p = 45; }, poor: () => { st.p = 20; },
    siege: () => { st.p = 77; st.flags.besieged = 'x'; }, held: () => { st.p = 77; st.flags.occupied = 'x'; } };
  const T = {};
  for (const pp of ['gatelander', 'markman', 'aurennais', 'oldblood']) { T[pp] = {}; d.people = pp;
    for (const k in states) { st.flags = { ...keep.flags }; delete st.flags.besieged; delete st.flags.occupied; states[k](); T[pp][k] = ask(d); } }
  d.people = undefined; st.flags = { ...keep.flags }; delete st.flags.besieged; delete st.flags.occupied; st.p = 45;
  const natFair = ask(d), nat = nationOf(...cellOf(site.x, site.z)).people;
  d.people = own; st.p = keep.p; st.flags = keep.flags;
  return { T, natFair, nat, name: d.name };
});
console.log(JSON.stringify(r).slice(0, 1400));
const T = r && r.T || {}, P = ['gatelander', 'markman', 'aurennais', 'oldblood'], K = ['good', 'fair', 'poor', 'siege', 'held'];
const all = P.flatMap(p => K.map(k => (T[p] || {})[k]));
check('every people answers every state with a line of its own (20 distinct)', all.every(s => typeof s === 'string' && s.length > 5) && new Set(all).size === 20, all);
check('no answer carries a number, and none says *get by* twice', all.every(s => typeof s === 'string' && !/\d/.test(s) && (s.match(/get by/g) || []).length <= 1), all.filter(s => /\d/.test(s || '') || ((s || '').match(/get by/g) || []).length > 1));
check('the lines are the review\'s, word for word (four anchors)', T.oldblood?.held === 'Held. Not by us.' && T.markman?.fair === 'We get by. Could be worse. Has been.' && T.aurennais?.good === 'Prosperous, Master, by any accounting. The books have not looked so well in my lifetime.' && T.gatelander?.siege === "Their camp's on the road and the gate's shut. A town under siege counts its loaves, not its blessings.", { ob: T.oldblood?.held, mm: T.markman?.fair });
check('a held or besieged town at 77 is not praised (*Better than my father saw* only when good)', P.every(p => !/father/.test(T[p]?.siege || '') && !/father/.test(T[p]?.held || '')) && /father/.test(T.gatelander?.good || '') && /father/.test(T.markman?.good || ''), P.map(p => T[p]?.held));
check('a speaker with no people of their own answers in the nation\'s', r && r.natFair === (T[r.nat] || T.gatelander)?.fair, { nat: r && r.nat, said: r && r.natFair });
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
