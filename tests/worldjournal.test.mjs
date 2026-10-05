// Session 510: the world's quests in the journal (Michael's C on DECISION #132; backlog E, owed since Session 487). The
// story's quests write their card's words into the journal under their id (S487); the world's (a lord's job, a faction's
// service, the story's world steps) wrote only the short log lines. Now they write their own: the ask when taken, *done*
// when the work is, the pay when turned in, a lapse when a dated job is taken back. Taken and handed in through the lord's
// own dialogue in Dunmore; the work itself is marked done by hand (what it is does not matter here).
import { boot, check } from './lib/game.mjs';
const g = await boot(); const { page } = g;
await g.intoWorld(); await g.settle('dunmore');

const say = (re) => page.evaluate((src) => { const re = new RegExp(src); try { if (dlgOpen) closeDialog(); } catch (e) {}
  const S = WORLD.settle.get('dunmore'); openDialog(S.lordNpc ? S.lordNpc.def : (S.houses.find(h => h.type === 'castle') || {}).dlg);
  const b = [...document.querySelectorAll('#dlg-choices > *')].find(x => re.test(x.textContent.trim().replace(/^\d+\.\s*/, ''))); if (b) b.click();
  const said = (document.getElementById('dlg-text') || {}).textContent || ''; return { clicked: !!b, said }; }, re.source);
const lines = (id) => page.evaluate((id) => GAME_LOG.filter(e => e.q === id).map(e => ({ qk: e.qk, t: e.t, text: e.text })), id);

// taken
await page.evaluate(() => { worldState.gameTimeAbsMinutes = 30000; forceTime(10); });
const t1 = await say(/^I.m looking for work\.$/); await g.frames(2);
const q = await page.evaluate(() => { const q = (worldState.quests || []).filter(q => !q.turnedIn).slice(-1)[0]; return q && { id: q.id, title: q.title, giver: q.giver, desc: q.desc, reward: q.reward }; });
const L1 = await lines(q && q.id);
console.log('taken', JSON.stringify(t1), JSON.stringify(q), JSON.stringify(L1));
check(`the lord's job (${q && q.title}, ${q && q.id}) writes its ask into the journal under its id`, t1.clicked && q && L1.length === 1 && L1[0].qk === 'accept' && L1[0].text === q.desc, { q, L1 });

// done
await page.evaluate((id) => { worldState.gameTimeAbsMinutes = 30600; const q = WORLD.quests.find(x => x.id === id); qComplete(q); }, q.id);
const L2 = await lines(q.id);
check(`the work done writes *Done — report to ${q.giver}.*`, L2.length === 2 && L2[1].qk === 'ready' && L2[1].text === `Done — report to ${q.giver}.` && L2[1].t === 30600, L2);
const card = await page.evaluate((title) => { openHub('quests'); const c = [...document.querySelectorAll('#qlog-body .qlog-card')].find(el => el.textContent.includes(title)); const t = c ? c.innerText : ''; closeHub(); return t; }, q.title);
check('its card in the Quests tab shows the journal\'s line under its date (the ask is the card\'s own text, not repeated)', /Done — report to/.test(card) && card.split(q.desc).length === 2, card);

// turned in through the lord
const t3 = await say(/^It.s done\.$/); await g.frames(2);
const L3 = await lines(q.id); const paid = await page.evaluate((id) => WORLD.quests.find(x => x.id === id).paid, q.id);
console.log('turned in', JSON.stringify(t3), JSON.stringify(L3));
check(`turned in, it writes *Turned in to ${q.giver}: ${paid} gold.*`, t3.clicked && L3.length === 3 && L3[2].qk === 'complete' && L3[2].text === `Turned in to ${q.giver}: ${paid} gold.` && paid > 0, L3);

// the Journal's views
const views = await page.evaluate(() => { openHub('journal'); journalView('quest'); const qt = document.getElementById('jn-body').innerText; journalView('day'); const dt = document.getElementById('jn-body').innerText; closeHub(); return { qt, dt }; });
console.log(views.qt.slice(0, 400));
check('By quest: the job under its own title, *complete*, its three lines in order', views.qt.includes(q.title) && /complete/.test(views.qt.split(q.title)[1] || '') && views.qt.indexOf(q.desc) < views.qt.indexOf('Done — report') && views.qt.indexOf('Done — report') < views.qt.indexOf('Turned in to'), views.qt);
check('By day: the line reads after the job\'s name', views.dt.includes(`${q.title} — Turned in to ${q.giver}`), views.dt.slice(0, 600));

// a dated job taken back writes the lapse
const lp = await page.evaluate(() => { const q = { id: 'tq:test:lapse', title: 'A test of dates', giver: 'Lord Test', desc: 'Do it by the date.', objective: 'Do it', reward: 40, kind: 'cull', data: {} };
  WORLD.quests.push(q); q.due = (worldState.gameTimeAbsMinutes || 0) + 10; worldState.gameTimeAbsMinutes += 20; qComplete(q);
  return { lapsed: !!q.lapsed, L: GAME_LOG.filter(e => e.q === q.id).map(e => e.qk + ':' + e.text) }; });
check('a dated job taken back writes its lapse under its id', lp.lapsed && lp.L.length === 1 && lp.L[0] === 'lapsed:The date passed, and Lord Test has given the work to someone else.', lp);

check('no page errors', g.errs.length === 0, g.errs);
await g.close();
