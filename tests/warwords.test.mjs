// Session 766 (committed as 754, then 755) — the quest writer's Finding 28, word for word: the war's notices name the power that acts (the Crown, the League,
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

// Session 2055 — Under Another Flag §3–5 (the quest writer's approved draft): the townsfolk's talk while their town is held or besieged,
// by the speaker's people (and the law by who holds it); at peace every topic answers as before
const talk = await page.evaluate(() => { const at = {};
  for (let i = 0; i < 80; i++) for (let j = 0; j < 80; j++) { let p; try { p = nationOf(i, j).people; } catch (e) { continue; } if (!at[p]) at[p] = { x: (i + .5) * WORLD.SIZE, z: (j + .5) * WORLD.SIZE }; }
  const out = {}; let n = 0;
  for (const p in at) { const site = { id: 'test_talk_' + (n++), name: 'Testford', kind: 'town', x: at[p].x, z: at[p].z }; const st = TS(site);
    const def = makeDef(site, 'irish', Math.random, 'Guard', 'Tess Hale', { x: site.x, z: site.z });
    const ask = lab => { const T = richTopics(site, 'irish', Math.random, 'Guard', 'Tess Hale', def); const x = T.find(t => typeof lab === 'string' ? t.label === lab : lab.test(t.label)); return x ? x.response : '(none)'; };
    const o = { people: def.people, peace: [ask('Who runs things here?'), ask('What’s the law here?')] };
    st.flags.occupied = 1; st.occupier = p === 'aurennais' ? 'mark' : 'aurenne';
    o.held = [ask('Who runs things here?'), ask('What’s the law here?'), ask(/^What of /), ask('How’s trade?'), ask('Any trouble on the watch?')];
    delete st.flags.occupied; delete st.occupier; st.flags.besieged = 1; st.siegeBy = 'mark';
    o.siege = [ask('Who runs things here?'), ask(/^What of /), ask('How’s trade?')]; delete st.flags.besieged; delete st.siegeBy;
    out[p] = o; }
  // an Old Blood speaker in a town the Crown holds, and the Compact's capital while it tithes a town it holds
  const ob = { id: 'test_talk_ob', name: 'Testford', kind: 'town', x: at.gatelander.x, z: at.gatelander.z }; const so = TS(ob); so.flags.occupied = 1; so.occupier = 'gatelands';
  out.oldblood = warTalkFor('law', ob, { people: 'oldblood' }, nationOf(...cellOf(ob.x, ob.z))); delete so.flags.occupied; delete so.occupier;
  const cap = { id: 'test_talk_cap', name: 'Capitol', kind: 'city', x: at.aurennais.x, z: at.aurennais.z }; const seat = FACTIONS.compact.seat; FACTIONS.compact.seat = cap.id;
  const held = allSites().find(t => t.pad > 0); const sh = TS(held), was = [sh.flags.occupied, sh.occupier]; sh.flags.occupied = 1; sh.occupier = 'aurenne';
  out.capital = { town: held.name, line: warTalkFor('trade', cap, { people: 'aurennais' }, nationOf(...cellOf(cap.x, cap.z))) };
  if (was[0] == null) delete sh.flags.occupied; else sh.flags.occupied = was[0]; if (was[1] == null) delete sh.occupier; else sh.occupier = was[1]; FACTIONS.compact.seat = seat;
  return out; });
console.log(JSON.stringify(talk, null, 1));
const heldStart = { gatelander: ["Mayor ", "The Compact's, now.", "The Crown's a long way off", "There's trade, and there's the Compact's factor", 'Watch? They do the watching now.'],
  markman: ["The Compact's captain. For now.", "The Compact's. No duels.", 'The League? Arguing in a hall.', 'Their factor takes a tenth.', 'Their men watch.'],
  aurennais: ['Formally, ', "The League's, Master, insofar as it is a law at all.", 'The Compact has been informed, Master, in triplicate.', 'Constrained, Master.', 'The watch has been assumed by the garrison, Master.'] };
const siegeStart = { gatelander: ['The Crown knows. Whether the Crown comes', "Trade? The gate's shut."], markman: ['The League knows. Twelve days.', "Gate's shut. No carts."],
  aurennais: ['The Compact has acknowledged our letter, Master.', 'Suspended, Master.'] };
for (const p of ['gatelander', 'markman', 'aurennais']) { const T = talk[p]; if (!T) continue;
  check(`${p} (${T.people}), held: the five topics answer from the draft`, T.people !== p || T.held.every((l, k) => l.startsWith(heldStart[p][k])), T.held);
  check(`${p}, held: the lord's name and the occupier's power are filled (*${T.held[0]}*)`, !/[{}]/.test(T.held.join(' ')) && (T.people !== p || /captain/.test(T.held[0])), T.held[0]);
  check(`${p}, besieged: *Who runs things here?* as at peace, the two others from the draft`, T.siege[0] === T.peace[0] && (T.people !== p || T.siege.slice(1).every((l, k) => l.startsWith(siegeStart[p][k]))), T.siege);
  check(`${p}, at peace: the law as before`, !/occupation|since they came|now\./.test(T.peace[1]), T.peace); }
check(`an Old Blood speaker, the Crown holding: *${talk.oldblood}*`, talk.oldblood === "The Crown's. They say the old gates are theirs. The gates say nothing.", talk.oldblood);
check(`the Compact's capital while it tithes ${talk.capital.town}: *${talk.capital.line}*`, talk.capital.line === `Brisk, Master. The tithe from ${talk.capital.town} comes in on every ship. The Prior calls it providence. The Factors call it accounts receivable.`, talk.capital);

// Session 2093 — Under Another Flag §6–7: a held town's first words by whose people you are, the freed town's greeting once a person,
// and the rumours of a town besieged, held, freed or relieved in the towns within 900
const greet = await page.evaluate(() => { const at = {};
  for (let i = 0; i < 80; i++) for (let j = 0; j < 80; j++) { let p; try { p = nationOf(i, j).people; } catch (e) { continue; } if (!at[p]) at[p] = { x: (i + .5) * WORLD.SIZE, z: (j + .5) * WORLD.SIZE }; }
  const keepP = worldState.people, out = {}; let n = 0;
  const say = (site, people, who) => { const def = { name: 'Test Person ' + (n++), people }; return firstWords(def, site); };
  const gs = { id: 'test_greet_g', name: 'Testford', kind: 'town', x: at.gatelander.x, z: at.gatelander.z }; const st = TS(gs);
  st.flags.occupied = 1; st.occupier = 'mark';
  worldState.people = 'markman'; out.occG = say(gs, 'gatelander'); out.occA = say(gs, 'aurennais'); out.occO = say(gs, 'oldblood');
  worldState.people = 'gatelander'; out.ownG = say(gs, 'gatelander'); out.ownM = say(gs, 'markman');
  worldState.people = 'oldblood'; out.obPlayer = say(gs, 'gatelander');
  worldState.people = 'gatelander';
  const dm = WORLD.siteAnywhere('dunmore'), sd = TS(dm), near = { id: 'test_greet_near', name: 'Nearby', kind: 'town', x: dm.x + 300, z: dm.z };
  sd.flags.occupied = 1; sd.occupier = 'mark'; out.rumHeld = warRumours(near).filter(r => /Dunmore/.test(r)); liberate(dm);
  out.rumFreed = warRumours(near).filter(r => /Dunmore/.test(r)); out.rumFar = warRumours({ id: 'far', x: dm.x + 2000, z: dm.z }).filter(r => /Dunmore/.test(r));
  sd.freed.day -= 20; out.rumOld = warRumours(near).filter(r => /Dunmore/.test(r)); delete sd.freed;
  laySiege(dm, 'aurenne'); out.rumSiege = warRumours(near).filter(r => /Dunmore/.test(r)); breakSiege(dm); out.rumRelieved = warRumours(near).filter(r => /Dunmore/.test(r)); delete sd.freed;
  liberate(gs);
  out.freed = JSON.parse(JSON.stringify(st.freed));
  const def = { name: 'Test Freed', people: 'markman' }; out.free1 = firstWords(def, gs); out.free2 = firstWords(def, gs);
  delete st.freed; laySiege(gs, 'aurenne'); breakSiege(gs); out.relieved = st.freed.how;
  out.relG = firstWords({ name: 'Test Relief', people: 'aurennais' }, gs); delete st.freed;
  worldState.people = keepP; return out; });
console.log(JSON.stringify(greet, null, 1));
const WG = { occG: "You're one of theirs, by the look of you.", occA: 'Ah. One of the administration', occO: 'You are of them. You are not them.', ownG: 'One of our own. Good. Walk soft past the plaza.' };
for (const k in WG) check(`a held town, ${k}: *${greet[k]}*`, greet[k].startsWith(WG[k]), greet[k]);
check(`a Markman speaker to a Gatelander in a Gatelands town held by the Mark keeps his own first words (*${greet.ownM}*)`, !/^(One of|Markman\. Good)/.test(greet.ownM), greet.ownM);
check(`an Old Blood player keeps their own aside (*${greet.obPlayer}*)`, !/one of theirs|One of our own/i.test(greet.obPlayer), greet.obPlayer);
check(`held, rumoured 300 off: *${greet.rumHeld[0]}*`, greet.rumHeld[0] === "The League's men hold Dunmore. A handful on the plaza, they say, and nobody coming to shift them.", greet.rumHeld);
check('liberate writes the freed record, by the League', greet.freed.how === 'garrison' && greet.freed.by === 'mark', greet.freed);
check(`freed: a Markman's next greeting *${greet.free1}*, and once only`, greet.free1.startsWith('Sweeper. Good.') && !greet.free2.startsWith('Sweeper'), [greet.free1, greet.free2]);
check(`freed, rumoured: *${greet.rumFreed[0]}*; not 2,000 off, not after fourteen days`, greet.rumFreed[0] === "Somebody walked into Dunmore and cleared the League's garrison off the plaza. Everyone's cousin saw it. Nobody agrees what they looked like." && !greet.rumFar.length && !greet.rumOld.length, greet);
check(`besieged, rumoured: *${greet.rumSiege[0]}*`, greet.rumSiege[0] === "Dunmore's shut up behind its gate with the Compact's camp on the road. Twelve days, they reckon, before hunger opens it.", greet.rumSiege);
check(`relieved, rumoured: *${greet.rumRelieved[0]}*`, greet.rumRelieved[0] === "The camp outside Dunmore is ashes. Whoever did it didn't stop to be thanked.", greet.rumRelieved);
check(`relieved: an Aurennais greets *${greet.relG}*`, greet.relieved === 'siege' && greet.relG.startsWith('Master, the road is open again'), greet.relG);
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
