// What you were told (Session 490, Michael's C on DECISION #132, part C; filed by person and place since Session 654,
// Michael's A on DECISION #183): an answer is filed once on its teller's page in worldState.told (a character key, saved in
// the character row), with where and when; *What is this place?* is filed on the place's page, one answer a teller; quest
// talk and a sale's yes are not filed. The Journal's Told view is an index by town (people, then places), a page each, and
// a search box that shows the matching answers; typing in it is not play (the hub's keys stay quiet).
import { boot, check } from './lib/game.mjs';
const g = await boot(); const { page } = g;
await g.intoWorld();
await g.settle('dunmore');
const click = (re) => page.evaluate((src) => { const b = [...document.querySelectorAll('#dlg-choices > *')].find(x => new RegExp(src).test(x.textContent.trim().replace(/^\d+\.\s*/, ''))); if (b) b.click(); return b ? b.textContent.trim() : null; }, re.source);
const close = () => page.evaluate(() => { try { if (dlgOpen) closeDialog(); } catch (e) {} });

// 1. a person of their own: two topics, one asked twice
await page.evaluate(() => { worldState.told = {}; worldState.gameTimeAbsMinutes = 1440 * 3 + 600; worldState.gameTimeMinutes = 600;
  window._elder = { name: 'Old Tadhg', role: 'Elder', greeting: ['Sit.'], topics: [{ label: 'What is under the hill?', response: 'Bones, and the gate the bones were guarding.', follow: [{ label: 'Whose bones?', response: 'Nobody has asked them.' }] }, { label: 'Farewell.', bye: true }] };
  openDialog(window._elder); });
await g.frames(2); const c1 = await click(/^What is under the hill\?$/); await g.frames(1); const c2 = await click(/^Whose bones\?$/); await close();
await page.evaluate(() => { worldState.gameTimeAbsMinutes += 300; worldState.gameTimeMinutes += 300; openDialog(window._elder); }); await g.frames(2); await click(/^What is under the hill\?$/); await close();
// 2. Dunmore's generated people: the Fighters' and the Mages' heads each say what their house is (two entries); a
// villager's rumour repeated word for word by another of the town is kept once
const town = await page.evaluate(() => { const S = WORLD.settle.get('dunmore'); const f = S.houses.find(h => h.type === 'guild_f'), m = S.houses.find(h => h.type === 'guild_m'), home = S.houses.find(h => h.type === 'home' && h.dlg);
  window._defs = [f.dlg, m.dlg]; const kin = Object.assign(Object.create(Object.getPrototypeOf(home.dlg)), home.dlg, { name: home.dlg.name + ' the younger' }); window._homes = [home.dlg, kin];
  return { f: f.dlg.name, m: m.dlg.name, home: home.dlg.name, site: f.dlg._siteId }; });
const askAll = [];
for (let i = 0; i < 2; i++) { await page.evaluate((i) => openDialog(window._defs[i]), i); await g.frames(2); askAll.push(await click(/^What is this place\?$/)); await close(); }
const rumour = [];
for (let i = 0; i < 2; i++) { await page.evaluate((i) => openDialog(window._homes[i]), i); await g.frames(2); const a = await click(/^About this place/); await g.frames(1);
  const labels = await page.evaluate(() => [...document.querySelectorAll('#dlg-choices > *')].map(x => x.textContent.trim().replace(/^\d+\.\s*/, '')));
  const b = await click(new RegExp('^' + (labels.find(l => !/Back/.test(l)) || 'zzz').replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '$')); rumour.push({ a, b, labels }); await close(); }
console.log(JSON.stringify({ town, askAll, rumour }).slice(0, 900));
const r = await page.evaluate(() => { const T = worldState.told; return { keys: Object.keys(T), T }; });
console.log(JSON.stringify(r).slice(0, 1500));
const T = r.T, E = Object.values(T), hill = E.find(e => e.l === 'What is under the hill?' && e.s === 'Old Tadhg'), bones = E.find(e => e.l === 'Whose bones?' && e.s === 'Old Tadhg');
check('a person\'s answer is filed on their page, with the question and when', c1 && hill && hill.k === 'p' && hill.pn === 'Old Tadhg' && hill.s === 'Old Tadhg' && hill.r === 'Bones, and the gate the bones were guarding.' && hill.t === 1440 * 3 + 600 && hill.tod === 600, hill);
check('a follow-up is a topic of its own', c2 && bones && bones.r === 'Nobody has asked them.', bones);
check('asked again, it is filed once, the first telling kept', E.filter(e => e.l === 'What is under the hill?').length === 1 && hill.t === 1440 * 3 + 600, r.keys);
const place = E.filter(e => e.l === 'What is this place?');
const fromHomes = E.filter(e => e.s === town.home || e.s === town.home + ' the younger');
check('the two guild heads\' answers about the place are on the place\'s page (asked in the street: Dunmore), one a teller', askAll.filter(Boolean).length === 2 && place.some(e => e.s === town.f) && place.some(e => e.s === town.m) && place.every(e => e.k === 'w' && e.pn === 'Dunmore' && e.w === 'Dunmore'), place.map(e => [e.s, e.pn, e.r.slice(0, 40)]));
check('two of the town\'s people asked about the place: each answer is kept on the place\'s page under its teller, and the folder itself is not filed', rumour.every(x => x.b) && fromHomes.length === 2 && fromHomes.every(e => e.k === 'w' && e.pk === place[0].pk) && new Set(place.map(e => e.s)).size === place.length && !E.some(e => /^About this place/.test(e.l)), { fromHomes: fromHomes.map(e => [e.s, e.pk]), keys: Object.keys(T) });
// 3. the Journal's Topics view, and its search
const v = await page.evaluate(() => { openHub('journal'); journalView('topics'); const all = document.getElementById('jn-body').innerText;
  const who = [...document.querySelectorAll('#jn-topics .jn-who')].find(d => /Old Tadhg/.test(d.textContent)); if (who) who.click(); const page = document.getElementById('jn-topics').innerText; journalPage(null);
  const inp = document.getElementById('jn-search');
  inp.value = 'bones'; inp.dispatchEvent(new Event('input')); const found = document.getElementById('jn-topics').innerText;
  inp.value = 'nothing like this'; inp.dispatchEvent(new Event('input')); const none = document.getElementById('jn-topics').innerText; inp.value = ''; inp.dispatchEvent(new Event('input')); return { all, page, found, none }; });
console.log(JSON.stringify(v).slice(0, 900));
check('the Told view is an index by town: people, then places', /Elsewhere · People[\s\S]*Old Tadhg/.test(v.all) && /Dunmore · Places[\s\S]*Dunmore told by Gráinne, Sorcha/.test(v.all) && !/Bones, and the gate/.test(v.all), v.all.slice(0, 500));
check('a person\'s page: who, when first met, each question with its date and the answer', /^Old Tadhg/m.test(v.page) && /first met Seaday 4 Reaping/.test(v.page) && /What is under the hill\? · Seaday 4 Reaping · 10:00 am/.test(v.page) && /Bones, and the gate/.test(v.page) && /Whose bones\?/.test(v.page), v.page.slice(0, 400));
check('the search finds by any word of it and says so when nothing matches', /What is under the hill\?/.test(v.found) && /Whose bones\?/.test(v.found) && !/What is this place/.test(v.found) && /Nothing you were told matches\./.test(v.none), { found: v.found.slice(0, 200), none: v.none });
// typing in the search: X does not arm quick-destroy, Tab does not close the hub
await page.focus('#jn-search'); await page.keyboard.type('xw'); await page.keyboard.press('Tab');
const k = await page.evaluate(() => ({ hub: hubOpen, val: document.getElementById('jn-search') && document.getElementById('jn-search').value, qd: invQuickDestroy }));
check('typing in the search is typing: the letters land, the hub stays open', k.hub && k.val === 'xw' && !k.qd, k);
await page.evaluate(() => { closeHub(); });
// 4. saved with the character, back after a reload
await page.evaluate(async () => { await saveToSlot(0); });
const rows = await page.evaluate(async () => { const m = SS.idx.find(e => e.kind === 'manual' && e.slot === 0); const c = JSON.parse(await ssGet(m.key)), w = JSON.parse(await ssGet(ssWorldKey(m.key))); return { c: c.wS && c.wS.told && Object.keys(c.wS.told).length, w: w.wS && w.wS.told }; });
g.errs.length = 0; await page.reload(); await page.waitForTimeout(5000);
await page.evaluate(() => document.getElementById('cb').click()); await page.waitForTimeout(12000); await g.hide();
const back = await page.evaluate(() => ({ n: worldState.told ? Object.keys(worldState.told).length : 0, hill: worldState.told && (Object.values(worldState.told).find(e => e.l === 'What is under the hill?') || {}).r }));
check('what you were told rides the character row and comes back on a reload', rows.c === Object.keys(T).length && rows.w === undefined && back.n === rows.c && /^Bones/.test(back.hill || ''), { rows, back });
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
