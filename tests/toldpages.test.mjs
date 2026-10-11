// Told by person and place (Session 654, Michael's A on DECISION #183): quest talk and a sale's yes are not filed; two
// people of one name in two towns, or a town's second of a name, keep a page each; the index names a person's trade;
// a place's page is the building you stood in when you asked *What is this place?*.
import { boot, check } from './lib/game.mjs';
const g = await boot(); const { page } = g;
await g.intoWorld();
const r = await page.evaluate(() => {
  worldState.told = {}; const ask = (npc, label, response, extra) => journalTold(npc, Object.assign({ label, response }, extra || {}));
  const keeper = { name: 'Ruairí', roleTag: 'Innkeeper', _siteId: 'dunmore' };
  ask(keeper, 'Who are you?', 'Born here, and here these 3 years.');
  ask(keeper, "I'm looking for work.", 'Try the board.'); ask(keeper, "It's done.", 'Good.'); ask(keeper, 'Yes. 11 gold.', 'Up the stairs.');
  ask(keeper, 'Any work?', 'Rats in the cellar.', { quest: true }); ask(keeper, 'A bed for the night?', 'A room is 11 gold.');
  ask({ name: 'Ruairí', roleTag: 'Smith', _siteId: 'portclare' }, 'Who are you?', 'A smith.');
  ask({ name: 'Ruairí', roleTag: 'Trader', _siteId: 'dunmore', _twin: 1 }, 'Who are you?', 'The other one.');
  const H0 = currentHouse; currentHouse = { name: 'The Bramble Hearth' }; try { ask(keeper, 'What is this place?', 'An inn.'); } finally { currentHouse = H0; }
  const E = Object.values(worldState.told);
  openHub('journal'); journalPage(null); _jnSearch = ''; journalView('topics'); const idx = document.getElementById('jn-topics').innerText; closeHub();
  return { labels: E.map(e => e.l), pages: [...new Set(E.map(e => e.pk))], place: E.find(e => e.k === 'w'), idx };
});
console.log(JSON.stringify(r).slice(0, 1500));
check('quest talk and a sale\'s yes are not filed; the keeper\'s own answers are', r.labels.filter(l => /^(Who are you\?|A bed for the night\?)$/.test(l)).length === 4 && !r.labels.some(l => /work|done|gold/i.test(l)), r.labels);
check('three Ruairís, three pages (two towns, and Dunmore\'s second of the name), and a place', r.pages.length === 4 && r.pages.filter(p => p.startsWith('p:Ruairí|')).length === 3, r.pages);
check('a place\'s page is the building you stood in', r.place && r.place.pn === 'The Bramble Hearth' && r.place.w === 'Dunmore', r.place);
check('the index names each person\'s trade, by town', /Dunmore · People[\s\S]*Ruairí innkeeper[\s\S]*Ruairí trader/.test(r.idx) && /Dunmore · Places[\s\S]*The Bramble Hearth told by Ruairí/.test(r.idx) && /Portclare · People[\s\S]*Ruairí smith/.test(r.idx), r.idx);
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
