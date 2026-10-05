// Dated work (Session 500, Michael's C on DECISION #132, part B): one lord's job in three carries a date 7 to 14 days out,
// rolled from a stream keyed by the town and the day; done by then it pays a quarter more, and past it, undone, the lord
// takes the work back. The Due view names it.
import { boot, check } from './lib/game.mjs';
const g = await boot(); const { page } = g;
await g.intoWorld();
const r = await page.evaluate(() => {
  const site = siteAnywhere('dunmore');
  // 1. the rate and the spread, over 600 days
  let dated = 0; const spans = new Set(); const again = [];
  for (let d = 0; d < 600; d++) { worldState.gameTimeAbsMinutes = d * 1440 + 500; const q = datedWork({ reward: 100 }, site); if (q.due) { dated++; spans.add(q.due / 1440 - d - 1); } if (d < 20) again.push(q.due || 0); }
  const same = []; for (let d = 0; d < 20; d++) { worldState.gameTimeAbsMinutes = d * 1440 + 900; same.push(datedWork({ reward: 100 }, site).due || 0); }
  // 2. a dated job from the lord, done in time
  const dayWith = from => { for (let d = from; d < from + 60; d++) if (seededRng('dated:dunmore', d)() < 1 / 3) return d; };
  const clean = () => { worldState.quests = (worldState.quests || []).filter(q => q.giverSite !== 'dunmore'); };
  clean(); const d1 = dayWith(30); worldState.gameTimeAbsMinutes = d1 * 1440 + 600; worldState.gameTimeMinutes = 600;
  const T = lordTopics(site); const said = T[0].fn(); const q1 = qActive().find(q => q.giverSite === 'dunmore');
  const due1 = q1 && q1.due; worldState.gameTimeAbsMinutes = due1 - 120; qComplete(q1);
  openHub('journal'); journalView('due'); closeHub();
  const g0 = gold; const doneSaid = lordTopics(site)[1].fn(); const paid1 = gold - g0;
  // 3. another, let lapse
  const d2 = dayWith(d1 + 20); worldState.gameTimeAbsMinutes = d2 * 1440 + 600; lordTopics(site)[0].fn(); const q2 = qActive().find(q => q.giverSite === 'dunmore');
  const D = calendarDue().filter(e => /gold if it is done by then/.test(e.text));
  openHub('journal'); journalView('due'); const dueTxt = document.getElementById('jn-body').innerText; closeHub();
  worldState.gameTimeAbsMinutes = q2.due - 1; tickDatedWork(); const before = { lapsed: !!q2.lapsed, active: qActive().includes(q2) };
  worldState.gameTimeAbsMinutes = q2.due + 30; tickDatedWork(); const after = { lapsed: !!q2.lapsed, active: qActive().includes(q2), log: GAME_LOG.slice(-3).map(e => e.text) };
  qComplete(q2); const late = { done: !!q2.done };
  // 4. an undated job pays as before
  const d3 = (() => { for (let d = d2 + 20; d < d2 + 80; d++) if (seededRng('dated:dunmore', d)() >= 1 / 3) return d; })();
  worldState.gameTimeAbsMinutes = d3 * 1440 + 600; const said3 = lordTopics(site)[0].fn(); const q3 = qActive().find(q => q.giverSite === 'dunmore'); qComplete(q3); const g3 = gold; lordTopics(site)[1].fn(); const paid3 = gold - g3;
  return { dated, spans: [...spans].sort((a, b) => a - b), again, same, said, reward1: q1 && q1.reward, due1, d1, paid1, want1: questGold(Math.round(q1.reward * 1.25)), doneSaid, D, dueTxt, before, after, late, q3due: q3.due, paid3, want3: questGold(q3.reward), said3 };
});
console.log(JSON.stringify(r).slice(0, 2500));
check('about one job in three is dated (over 600 days), 7 to 14 days out', r.dated >= 170 && r.dated <= 230 && JSON.stringify(r.spans) === '[7,8,9,10,11,12,13,14]', { dated: r.dated, spans: r.spans });
check('the roll is the town\'s and the day\'s: the same day gives the same answer at any hour', JSON.stringify(r.again) === JSON.stringify(r.same), { again: r.again, same: r.same });
check('the lord names the date and the quarter more', r.due1 > r.d1 * 1440 && new RegExp(`\\(${r.reward1} gold; ${Math.round(r.reward1 * 1.25)} if it is done by \\w+, the \\d+(st|nd|rd|th) of \\w+\\. After that, the work goes to someone else\\.\\)$`).test(r.said), r.said);
check('done two hours before the date, it pays a quarter more', r.paid1 === r.want1 && r.paid1 > 0, { paid: r.paid1, want: r.want1, said: r.doneSaid });
check('the Due view names a dated job, its sum and its date', r.D.length === 1 && /gold if it is done by then; after it, the work is taken back\./.test(r.dueTxt), { D: r.D, txt: r.dueTxt.slice(0, 300) });
check('a minute before the date it stands; past it, undone, the lord takes it back, and the journal says so', !r.before.lapsed && r.before.active && r.after.lapsed && !r.after.active && r.after.log.some(t => /the date passed, and .+ has given the work to someone else/.test(t)), { before: r.before, after: r.after });
check('finished after it lapsed, it counts for nothing', !r.late.done, r.late);
check('an undated job pays as before and names no date', !r.q3due && r.paid3 === r.want3 && /\(\d+ gold\.\)$/.test(r.said3), { paid: r.paid3, want: r.want3, said: r.said3.slice(-40) });
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
