// Today's Journal tab (auto/systems, Sessions 486–511: By day, By quest, Topics, Due) with a few days of real play in it,
// for the journal page. Boots the systems build (SYS=folder holding its index.html and js/, from
// `git archive origin/auto/systems index.html js`), writes current-*.png, backdrop-inn.png and current.json beside this file.
// SYS=… node docs/prototypes/journal/shoot-current.mjs
import { boot } from '../../../tests/lib/game.mjs';
import fs from 'fs'; import path from 'path'; import { fileURLToPath } from 'url';
const here = path.dirname(fileURLToPath(import.meta.url));
const g = await boot({ src: path.join(process.env.SYS, 'index.html') }); const { page } = g;
await g.intoWorld(); await g.settle('dunmore');
const shot = n => page.screenshot({ path: path.join(here, n + '.png'), timeout: 90000 });
const at = (d, h) => page.evaluate(([d, h]) => { worldState.gameTimeAbsMinutes = Math.round(d * 1440 + h * 60); forceTime(h); }, [d, h]);
// the lord, and what he is asked
const say = (re) => page.evaluate((src) => { const re = new RegExp(src); try { if (dlgOpen) closeDialog(); } catch (e) {}
  const S = WORLD.settle.get('dunmore'); openDialog(S.lordNpc ? S.lordNpc.def : (S.houses.find(h => h.type === 'castle') || {}).dlg);
  const b = [...document.querySelectorAll('#dlg-choices > *')].find(x => re.test(x.textContent.trim().replace(/^\d+\.\s*/, ''))); if (b) b.click();
  return !!b; }, re.source);
// townsfolk: open each, ask every plain topic (the real path files it: openDialog → the choice → journalTold)
const ask = (i0, n, mins) => page.evaluate(([i0, n, mins]) => { const S = WORLD.settle.get('dunmore'); const out = [];
  const tick = () => { worldState.gameTimeAbsMinutes += mins; forceTime((worldState.gameTimeAbsMinutes % 1440) / 60); };
  const click = (l) => { const b = [...document.querySelectorAll('#dlg-choices > *')].find(x => x.textContent.includes(l)); if (b) b.click(); return !!b; };
  const plain = c => c && !c.folder && typeof c.response === 'string' && !/sell|bed for|work|done|goodbye|farewell|trade/i.test(c.label);
  for (const p of (S.npcs || []).slice(i0, i0 + n)) { const def = p.def; if (!def) continue; let k = 0;
    for (const c of (def.topics || [])) { if (k >= 3) break;
      if (plain(c)) { try { if (dlgOpen) closeDialog(); } catch (e) {} openDialog(def); if (click(c.label)) { out.push(def.name + ': ' + c.label); k++; tick(); } }
      else if (c && c.folder && Array.isArray(c.follow)) for (const f of c.follow) { if (k >= 3 || !plain(f)) continue;
        try { if (dlgOpen) closeDialog(); } catch (e) {} openDialog(def); if (click(c.label) && click(f.label)) { out.push(def.name + ': ' + c.label + ' › ' + f.label); k++; tick(); } } }
    try { if (dlgOpen) closeDialog(); } catch (e) {} }
  return out; }, [i0, n, mins]);
const asked = []; const data0 = {};
await at(1, 10.25); asked.push(...await ask(0, 4, 6));
await at(1, 11.5); await say(/^I.m looking for work\.$/);
const job = await page.evaluate(() => { const q = (worldState.quests || []).filter(q => !q.turnedIn).slice(-1)[0]; return q && { id: q.id, title: q.title }; });
await at(1, 15.75); asked.push(...await ask(4, 3, 5));
// the story's first quest, taken in the evening and done in the barrow the next day
await page.evaluate(() => { const id = 'q1_first_blood'; QS[id].state = 'available'; worldState.gameTimeAbsMinutes = 1 * 1440 + 20 * 60 + 10; forceTime(20 + 10 / 60); acceptQuest(id); });
await at(1, 20.4); await page.evaluate(() => journalNote('The lord pays in silver he weighs twice. Count it at the door, not after.'));
await at(2, 9.1); await page.evaluate(() => addLog('🗺️', 'Discovered the Barrow of Cnoc Rua.'));
await page.evaluate(() => { worldState.gameTimeAbsMinutes = 2 * 1440 + 13 * 60 + 40; forceTime(13 + 40 / 60); for (let k = 0; k < 5; k++) checkQuestProgress('kill_in_dungeon', { seed: 42 }); });
await page.evaluate((id) => { worldState.gameTimeAbsMinutes = 2 * 1440 + 16 * 60 + 20; forceTime(16 + 20 / 60); const q = WORLD.quests.find(x => x.id === id); if (q) qComplete(q); }, job && job.id);
await at(2, 19.5); await say(/^It.s done\.$/);
await page.evaluate(() => { worldState.gameTimeAbsMinutes = 2 * 1440 + 19 * 60 + 55; forceTime(19 + 55 / 60); completeQuest('q1_first_blood'); });
await at(3, 8.4); asked.push(...await ask(7, 3, 7));
// a second job taken in the morning, still in hand; a room let at the inn for the night
await at(3, 10.2); await say(/^I.m looking for work\.$/);
data0.inn = await page.evaluate(() => { const S = WORLD.settle.get('dunmore'); const out = [];
  const inn = (S.npcs || []).find(p => p.def && (p.def.topics || []).some(c => c && /bed for/i.test(c.label || '')));
  if (!inn) return out; try { if (dlgOpen) closeDialog(); } catch (e) {} openDialog(inn.def);
  const pick = re => { const b = [...document.querySelectorAll('#dlg-choices > *')].find(x => re.test(x.textContent)); if (b) { out.push(b.textContent.trim()); b.click(); } return !!b; };
  pick(/bed for/i); pick(/take|yes|room|pay|\d+ gold/i); try { if (dlgOpen) closeDialog(); } catch (e) {}
  out.push(JSON.stringify(worldState.rented || null)); return out; });
await at(3, 21.6); await page.evaluate(() => journalNote('Ask the smith what a barrow-blade is worth before the Giving. The whole town will be at the gate that day.'));
await g.frames(4);
// today's tab, each view
const views = {};
for (const v of ['day', 'quest', 'topics', 'due']) { await page.evaluate((v) => { openHub('journal'); journalView(v); }, v); await g.frames(3); await page.waitForTimeout(500);
  await shot('current-' + v); views[v] = await page.evaluate(() => document.getElementById('jn-body').innerText); }
await page.evaluate(() => closeHub());
// a clean plate: the inn's common room at night, no HUD or hand (the journal is read anywhere; the backdrop is only behind the book)
await page.evaluate(() => { const c = REN.domElement; window._hid = [];
  for (const e of document.querySelectorAll('body *')) if (e !== c && !e.contains(c) && getComputedStyle(e).display !== 'none' && getComputedStyle(e).visibility !== 'hidden') { e.style.visibility = 'hidden'; window._hid.push(e); }
  const gEl = document.getElementById('g'); gEl.style.height = '720px'; window.dispatchEvent(new Event('resize')); if (typeof VM_SCENE !== 'undefined') VM_SCENE.visible = false; });
await g.spin(null, 4); await page.waitForTimeout(1500); await shot('backdrop-street');
// the data the page lays out, every string made by the game's own functions
const data = await page.evaluate(() => {
  const qd = id => (typeof QUEST_DEFS !== 'undefined' && QUEST_DEFS.find(x => x.id === id)) || (worldState.quests || []).find(x => x && x.id === id) || null;
  const L = GAME_LOG.filter(e => e && typeof e.text === 'string').map(e => ({ t: e.t, icon: e.icon || '', text: e.text, q: e.q || null, qk: e.qk || null, note: !!e.note, qt: e.q ? ((qd(e.q) || {}).title || e.qt || e.q) : null,
    day: Math.floor((e.t || 0) / 1440), date: gameDateLine(e.t, e.tod, 'date'), short: gameDateLine(e.t, e.tod, 'short'), time: gameDateLine(e.t, e.tod, 'time') }));
  const T = Object.values(worldState.told || {}).map(e => ({ l: e.l, s: e.s, w: e.w, r: e.r, t: e.t, short: gameDateLine(e.t, e.tod, 'short') }));
  const now = worldState.gameTimeAbsMinutes || 0; const D = (typeof calendarDue === 'function' ? calendarDue() : []).map(e => ({ ...e, day: calDateLine(e.at), dd: Math.floor(e.at / 1440) - Math.floor(now / 1440) }));
  const c = calDay(now);
  return { L, T, D, names: journalNames(), today: gameDateLine(now, null, 'full'), todayDay: calDateLine(now), cal: { day: c.day, dom: c.dom, month: CAL.monthNames[c.month], year: c.year, era: CAL.era, season: c.season, months: CAL.monthNames, days: CAL.days, feasts: FEASTS.map(f => ({ name: f.name, month: f.month, dom: f.dom, ico: f.ico, due: f.due })) },
    who: { name: (typeof playerName !== 'undefined' && playerName) || '', level } };
});
Object.assign(data, data0); data.asked = asked; data.views = views; data.job = job;
fs.writeFileSync(path.join(here, 'current.json'), JSON.stringify(data, null, 1));
console.log('errors', g.errs, 'lines', data.L.length, 'told', data.T.length, 'due', data.D.length, data.today);
await g.close();
