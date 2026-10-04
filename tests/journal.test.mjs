// The journal kept (Session 486, Michael's C on DECISION #132, part A's first slice; docs/design/journal-and-calendar.md):
// every `addLog` line is stamped with the minute it was written and lives in `worldState.journal`, a character key, so it
// is saved in the character row and comes back on a reload. Before, `GAME_LOG` was never saved: every line was lost on
// reload, and a loaded character kept the running one's lines. The Journal shows each line under its date.
import { boot, check } from './lib/game.mjs';
const g = await boot(); const { page } = g;
await g.intoWorld();
const W = ms => page.waitForTimeout(ms);

// 1. two lines, at two moments of the clock
const a = await page.evaluate(async () => {
  GAME_LOG.length = 0;
  worldState.gameTimeAbsMinutes = 5000; worldState.gameTimeMinutes = 1000; addLog('📜', 'The first line of the test.');
  worldState.gameTimeAbsMinutes = 5000 + 1440 * 2 + 75; worldState.gameTimeMinutes = 1075 % 1440 + 0; addLog('⚔', 'The second line of the test.');
  const same = worldState.journal === GAME_LOG;
  const L = GAME_LOG.map(e => ({ t: e.t, tod: e.tod, text: e.text, level: e.level }));
  openHub('log'); const txt = document.getElementById('log-body').innerText; closeHub();
  await saveToSlot(0);
  const m = SS.idx.find(e => e.kind === 'manual' && e.slot === 0); const c = JSON.parse(await ssGet(m.key)), w = JSON.parse(await ssGet(ssWorldKey(m.key)));
  return { same, L, txt, cJ: c.wS && c.wS.journal, wJ: w.wS && w.wS.journal };
});
console.log(JSON.stringify(a));
check('each line carries the minute it was written and the time of day', a.L.length === 2 && a.L[0].t === 5000 && a.L[0].tod === 1000 && a.L[1].t === 7955 && a.L[1].tod === 1075, a.L);
check('the journal is a character key in worldState, the same list GAME_LOG reads', a.same, a.same);
check('the Journal shows each line under its date (Day 4 · 4:40 pm, Day 6 · 5:55 pm)', /Day 4 · 4:40 pm/.test(a.txt) && /Day 6 · 5:55 pm/.test(a.txt) && /The first line of the test\./.test(a.txt), a.txt.slice(-400));
check('the character row carries the journal; the world row does not', Array.isArray(a.cJ) && a.cJ.length === 2 && a.cJ[1].text === 'The second line of the test.' && a.wJ === undefined, { c: a.cJ && a.cJ.length, w: a.wJ });

// 2. reload the page and Continue: the lines come back, and a new one joins them
g.errs.length = 0; await page.reload(); await W(5000);
await page.evaluate(() => document.getElementById('cb').click()); await W(12000); await g.hide();
const b = await page.evaluate(() => { const n0 = GAME_LOG.length; const texts = GAME_LOG.map(e => e.text); addLog('🗝', 'A line after the reload.');
  return { n0, texts, t0: GAME_LOG[0] && GAME_LOG[0].t, same: worldState.journal === GAME_LOG, n1: worldState.journal.length }; });
console.log(JSON.stringify(b));
check('after a reload the journal comes back whole, in order, with its stamps', b.n0 >= 2 && b.texts.indexOf('The first line of the test.') >= 0 && b.texts.indexOf('The second line of the test.') > b.texts.indexOf('The first line of the test.') && b.t0 === 5000, b);
check('and new lines are written into the saved list', b.same && b.n1 === b.n0 + 1, b);

// 3. a save with no journal (one made before this session) loads with an empty journal, not the running character's
const c = await page.evaluate(() => { const d = JSON.parse(ssStringify(_buildSavePayload())); delete d.wS.journal; const before = GAME_LOG.length; _applyLoadData(d);
  return { before, after: GAME_LOG.length, same: worldState.journal === GAME_LOG }; });
check('an older save without a journal loads with none, and the list is still the one GAME_LOG reads', c.before > 0 && c.after === 0 && c.same, c);
// 4. a quest's own words (Session 487): taken, done and turned in, each line goes into the journal under the quest,
// at the moment it happens, and the Quests tab shows them under the quest's card with their dates
const q = await page.evaluate(() => { const id = 'q1_first_blood', d = QUEST_DEFS.find(x => x.id === id);
  QS[id].state = 'available'; worldState.gameTimeAbsMinutes = 20000; worldState.gameTimeMinutes = 20000 % 1440; acceptQuest(id);
  worldState.gameTimeAbsMinutes = 20600; worldState.gameTimeMinutes = 20600 % 1440; for (let k = 0; k < 5; k++) checkQuestProgress('kill_in_dungeon', { seed: 42 });
  worldState.gameTimeAbsMinutes = 21000; worldState.gameTimeMinutes = 21000 % 1440; completeQuest(id);
  const L = journalOf(id).map(e => ({ t: e.t, k: e.qk, text: e.text }));
  openHub('quests'); const card = [...document.querySelectorAll('#qlog-body .qlog-quest')].find(el => el.textContent.includes(d.title)); const ctext = card ? card.innerText : ''; closeHub();
  openHub('log'); const jtext = document.getElementById('log-body').innerText; closeHub();
  return { L, accept: d.acceptText || null, ready: d.readyText, complete: d.completeText, ctext, jtext, title: d.title }; });
console.log(JSON.stringify(q).slice(0, 1500));
const acc = q.L.find(e => e.k === 'accept'), rdy = q.L.find(e => e.k === 'ready'), com = q.L.find(e => e.k === 'complete');
check('taking a quest writes its words into the journal under the quest, stamped when it was taken', acc && acc.t === 20000 && (q.accept ? acc.text === q.accept : acc.text.length > 0), q.L);
check('finishing the work writes its ready words', rdy && rdy.t === 20600 && rdy.text === q.ready, q.L);
check('turning it in writes its closing words, stamped then', com && com.t === 21000 && com.text === q.complete, q.L);
check('the Quests tab shows those lines under the quest, each with its date', q.ctext.includes(q.complete) && /Day 14 · /.test(q.ctext) && /Day 15 · /.test(q.ctext), q.ctext.slice(-600));
check('and the Journal shows them under the quest\'s name', q.jtext.includes(q.title + ' — ' + q.complete), q.jtext.slice(-500));

check('no page errors', g.errs.length === 0, g.errs);
await g.close();
