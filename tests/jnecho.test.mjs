// One line a quest event in the Journal's By day view (Session 654, Michael's A on DECISION #183): a plain log line of the
// same minute that repeats a quest line's title (*Quest: First Blood*, *First Blood: 56 gold.*) is not shown beside the
// quest's own words. A line of another minute, a line of your own, and every line in the Log are kept.
import { boot, check } from './lib/game.mjs';
const g = await boot(); const { page } = g;
await g.intoWorld();
const r = await page.evaluate(() => {
  GAME_LOG.length = 0; const at = (m) => { worldState.gameTimeAbsMinutes = 1440 * 5 + m; worldState.gameTimeMinutes = m; };
  const def = { id: 'w_rats_test', title: "The Miller's Rats" };
  at(600); addLog('📜', "Quest: The Miller's Rats"); journalQuest('accept', def, 'Rats in the mill. Clear them, and Niamh pays.');
  at(700); addLog('🏅', "The Miller's Rats: 56 gold."); journalQuest('complete', def, 'Turned in to Mayor Niamh: 56 gold.');
  at(701); addLog('📜', "The Miller's Rats: the miller thanks you again.");
  at(702); journalNote("The Miller's Rats were bigger than he said.");
  at(703); addLog('🗡', 'Found a rusty sword.');
  openHub('journal'); journalView('day'); const day = document.getElementById('jn-body').innerText; closeHub();
  return { day, n: GAME_LOG.length };
});
console.log(JSON.stringify(r));
check('the quest\'s own words are shown, with its title', /The Miller's Rats — Rats in the mill/.test(r.day) && /The Miller's Rats — Turned in to Mayor Niamh: 56 gold\./.test(r.day), r.day);
check('the plain lines of the same minute that repeat its title are not', !/Quest: The Miller's Rats/.test(r.day) && !/The Miller's Rats: 56 gold\./.test(r.day), r.day);
check('a line of another minute, a line of your own and an unrelated line are kept', /the miller thanks you again/.test(r.day) && /were bigger than he said/.test(r.day) && /Found a rusty sword/.test(r.day), r.day);
check('the log itself keeps every line', r.n === 7, r.n);
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
