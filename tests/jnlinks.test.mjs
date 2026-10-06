// Names in an entry are links to their topic (Session 495, Michael's C on DECISION #132, part C): a name the Journal's
// Topics view knows (who told you, the town they told you in, a capitalised name in a topic's label past its first word)
// is a link wherever a journal line says it, whole word; a click opens Topics searched for that name.
import { boot, check } from './lib/game.mjs';
const g = await boot(); const { page } = g;
await g.intoWorld();

const r = await page.evaluate(() => {
  GAME_LOG.length = 0;
  worldState.told = {
    'Tell me about Ashenmoor.|Old Tadhg': { l: 'Tell me about Ashenmoor.', s: 'Old Tadhg', w: '', r: 'Forty died when the binding broke.', t: 4000, tod: 1000 },
    'What is this place?|@dunmore:x': { l: 'What is this place?', s: 'Brona Keane', w: 'Dunmore', r: 'A market town on the river.', t: 4100, tod: 1100 },
    'What about the Enchanted Ring?|Old Tadhg': { l: 'What about the Enchanted Ring?', s: 'Old Tadhg', w: '', r: 'Lost in the Crypt.', t: 4200, tod: 1200 } };
  worldState.gameTimeAbsMinutes = 5000; worldState.gameTimeMinutes = 1000;
  addLog('📜', 'Old Tadhg says Ashenmoor burned, and Brona Keane of Dunmore says it did not.');
  addLog('📜', 'Ashenmoorish weather, and a tadhg is not a name. <b>not bold</b>');
  journalNote('Ask Old Tadhg about the Enchanted Ring again.');
  const names = journalNames();
  openHub('journal'); journalView('day');
  const links = [...document.querySelectorAll('#jn-body .jn-link')].map(a => a.textContent);
  const bold = document.querySelectorAll('#jn-body .jn-text b').length;
  const second = [...document.querySelectorAll('#jn-body .jn-line')].map(x => x.textContent).find(t => /Ashenmoorish/.test(t));
  journalView('quest'); const inQuest = document.querySelectorAll('#jn-body .jn-link').length;
  journalView('day');
  const a = [...document.querySelectorAll('#jn-body .jn-link')].find(x => x.textContent === 'Ashenmoor'); a.click();
  const after = { view: _jnView, search: document.getElementById('jn-search') && document.getElementById('jn-search').value, list: document.getElementById('jn-topics').innerText };
  journalView('day'); const b = [...document.querySelectorAll('#jn-body .jn-link')].find(x => x.textContent === 'Brona Keane'); b.click();
  const after2 = { search: document.getElementById('jn-search').value, list: document.getElementById('jn-topics').innerText };
  journalSearch(''); closeHub();
  return { names, links, bold, second, inQuest, after, after2 };
});
console.log(JSON.stringify(r).slice(0, 1500));
check('the names come from who told you, the town, and the label\'s names past its first word', ['Old Tadhg', 'Brona Keane', 'Dunmore', 'Ashenmoor', 'Enchanted Ring'].every(n => r.names.includes(n)) && !r.names.includes('Tell') && !r.names.includes('What'), r.names);
check('each name a line says is a link, a note\'s too', JSON.stringify([...r.links].sort()) === JSON.stringify(['Ashenmoor', 'Brona Keane', 'Dunmore', 'Enchanted Ring', 'Old Tadhg', 'Old Tadhg']), r.links);
check('only whole words, as written: Ashenmoorish and tadhg are not links, and the line\'s own text stays text', r.bold === 0 && r.links.length === 6 && /<b>not bold<\/b>/.test(r.second), { n: r.links.length, second: r.second });
check('a click on a name opens Topics searched for it, and the search finds what was told', r.after.view === 'topics' && r.after.search === 'Ashenmoor' && /Tell me about Ashenmoor\./.test(r.after.list) && !/What is this place/.test(r.after.list), r.after);
check('a teller\'s name finds what they told you', r.after2.search === 'Brona Keane' && /What is this place\?/.test(r.after2.list) && !/Ashenmoor/.test(r.after2.list), r.after2);
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
