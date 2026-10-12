// Session 754 — the quest writer's Finding 28, word for word: the war's notices name the power that acts (the Crown, the League,
// the Compact: NATIONS[nk].crown, through polityName) and open with a capital, the peace counts *1 siege* and *1 town*, and the
// lord answers *Who holds the town?* and *The siege?* in his own people's voice (the province's people, not the occupier's).
import { boot, check } from './lib/game.mjs';
const g = await boot(); const { page } = g;
await g.intoWorld();

// a place on each people's land, found by the cells' nations; the lord's two answers there
const lords = await page.evaluate(() => { const at = {};
  for (let i = 0; i < 80; i++) for (let j = 0; j < 80; j++) { let p; try { p = nationOf(i, j).people; } catch (e) { continue; } if (!at[p]) at[p] = { x: (i + .5) * WORLD.SIZE, z: (j + .5) * WORLD.SIZE }; }
  const out = {}; let n = 0;
  for (const p in at) { const site = { id: 'test_lord_' + (n++), name: 'Testford', kind: 'town', x: at[p].x, z: at[p].z }; const st = TS(site);
    st.flags.occupied = 1; st.occupier = 'mark'; const occ = lordTopics(site)[0]; delete st.flags.occupied; delete st.occupier;
    st.flags.besieged = 1; st.siegeBy = 'aurenne'; const sie = lordTopics(site)[0]; delete st.flags.besieged; delete st.siegeBy;
    out[p] = { people: nationOf(...cellOf(site.x, site.z)).people, occ, sie }; }
  return out; });
console.log(JSON.stringify(lords, null, 1));
const P = Object.keys(lords);
check(`a place found on each people's land (${P.join(', ')})`, ['gatelander', 'markman', 'aurennais'].every(p => P.includes(p)), P);
const occStart = { gatelander: 'The League, for now. Their captain sits in my chair', markman: "The League. Their captain's in my chair", aurennais: 'The League, Master, under terms we were not asked to sign.' };
const sieStart = { gatelander: "The Compact's camp is on the road and the gate is shut.", markman: "The Compact's camp. On the road, past the gate.", aurennais: 'The Compact has encamped on the road, Master.' };
for (const p of ['gatelander', 'markman', 'aurennais']) { const L = lords[p]; if (!L) continue;
  check(`${p}: *Who holds the town?* (the Mark's men in it) opens *${occStart[p]}*`, L.occ.label === 'Who holds the town?' && L.occ.response.startsWith(occStart[p]), L.occ);
  check(`${p}: *The siege?* (Aurenne's camp) opens *${sieStart[p]}*`, L.sie.label === 'The siege?' && L.sie.response.startsWith(sieStart[p]), L.sie); }

// the notices: a siege laid, the peace's count
const notes = await page.evaluate(() => { const logs = []; const keep = window.addLog; window.addLog = (i, t) => logs.push(t);
  const t = { id: 'test_siegetown', name: 'Testford', kind: 'town', x: 0, z: 0 }; laySiege(t, 'mark'); const st = TS(t); delete st.flags.besieged; delete st.siegeBy;
  const w0 = worldState.war; worldState.war = { a: 'gatelands', b: 'mark', day: 0, resolved: 5, broken: 1, lost: 1 }; endWarIf();
  worldState.war = { a: 'aurenne', b: 'mark', day: 0, resolved: 5, broken: 3, lost: 2 }; endWarIf(); worldState.war = w0;
  window.addLog = keep; return logs; });
check(`a siege laid by the Mark: *${notes[0]}*`, notes[0] === 'The League has laid siege to Testford.', notes);
check(`the peace counts one: *${notes[1]}*`, notes[1] === 'Peace between the Gatelands and the Mark. 1 siege broken, 1 town lost.', notes);
check(`and more: *${notes[2]}*`, notes[2] === 'Peace between Aurenne and the Mark. 3 sieges broken, 2 towns lost.', notes);

// the camp and the garrison, as you come to Dunmore
await g.settle('dunmore');
const msgs = await page.evaluate(() => { const seen = []; const keep = window.showMsg; window.showMsg = (m, c) => { seen.push(m); return keep(m, c); };
  const t = WORLD.siteAnywhere('dunmore'); px = t.x; pz = t.z; const st = TS(t);
  st.flags.besieged = 1; st.siegeBy = 'mark'; tickSieges();
  delete st.flags.besieged; delete st.siegeBy; tickSieges(); st.flags.occupied = 1; st.occupier = 'aurenne'; tickSieges();
  delete st.flags.occupied; delete st.occupier; tickSieges(); window.showMsg = keep; return seen; });
check(`the camp: *${msgs[0]}*`, msgs.includes('The League’s camp is on the road outside Dunmore.'.replace('’', "'")), msgs);
check(`the garrison: *${msgs.find(m => /garrison/.test(m))}*`, msgs.includes("The Compact's garrison holds Dunmore."), msgs);
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
