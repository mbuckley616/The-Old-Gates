// The four feasts (Session 550): the rules are Michael's C on DECISION #132 (the inn's meal is free, a petty crime's fine
// is halved that day), the names, dates and lines the quest writer's drafted set (Michael's A on #146). One a season, fixed
// to a date and so to a weekday; a townsperson greets you with the feast's line; the innkeeper says hers before the room
// offer and the meal (a Hot Stew) is the house's, once a feast at each inn; a guard halting you for a halved fine says so;
// the Journal's Due view lists the next feast.
import { boot, check } from './lib/game.mjs';
const g = await boot(); const { page } = g;
await g.intoWorld(); await g.settle('dunmore');

// 1. the dates
const d = await page.evaluate(() => {
  const at = n => feastOn(n * 1440 + 600);
  const days = [0, 21, 22, 23, 111, 168, 326].map(n => { const f = at(n); return [n, f ? f.key : null, calDay(n * 1440).day.name]; });
  return { days, n9: nextFeast(9 * 1440), n23: nextFeast(23 * 1440), n22: nextFeast(22 * 1440 + 900), n112: nextFeast(112 * 1440) };
});
console.log(JSON.stringify(d));
const k = Object.fromEntries(d.days.map(([n, f, w]) => [n, [f, w]]));
check('the Giving is the 23rd of Reaping, a Stoneday (day 23 of a tale); the days either side are no feast', k[22][0] === 'giving' && k[22][1] === 'Stoneday' && k[21][0] === null && k[23][0] === null && k[0][0] === null, d.days);
check('the Empty Chair on Guestday the 28th of Longnight, the Kindling on Hearthday the 1st of Thaw, the Long Light on Skyday the 19th of Highsun', k[111][0] === 'emptychair' && k[111][1] === 'Guestday' && k[168][0] === 'kindling' && k[168][1] === 'Hearthday' && k[326][0] === 'longlight' && k[326][1] === 'Skyday', d.days);
check('the next feast: from day 10 the Giving on day 23; on its own day it is today\'s; after it the Empty Chair; after that the Kindling', d.n9.f.key === 'giving' && d.n9.at === 22 * 1440 && d.n22.f.key === 'giving' && d.n22.at === 22 * 1440 && d.n23.f.key === 'emptychair' && d.n23.at === 111 * 1440 && d.n112.f.key === 'kindling' && d.n112.at === 168 * 1440, { n9: d.n9.at, n22: d.n22.at, n23: d.n23.at, n112: d.n112.at });

// 2. a townsperson's greeting, the inn and its meal
const t = await page.evaluate(() => {
  const S = WORLD.settle.get('dunmore'); const day = n => { worldState.gameTimeAbsMinutes = n * 1440 + 660; worldState.gameTimeMinutes = 660; };
  const folk = (S.npcs || []).filter(n => n.def && n.def._siteId && n.def.people).slice(0, 6);
  const said = n => { openDialog(n.def); const t = document.getElementById('dlg-text').textContent; try { closeDialog(); } catch (e) {} return t; };
  day(21); const plain = folk.map(said);
  day(22); const feast = folk.map(n => [n.def.people, said(n)]);
  const inn = S.houses.find(h => h.type === 'inn'); const people = inn && inn.dlg ? inn.dlg.people : 'gatelander';
  const T = innTopics(inn, people); worldState.rented = null;
  day(21); const offer21 = T[1].response; const bag21 = BAG.filter(i => i.name === 'Hot Stew').reduce((a, i) => a + (i.qty || 1), 0); T[0].fn(); const after21 = BAG.filter(i => i.name === 'Hot Stew').reduce((a, i) => a + (i.qty || 1), 0);
  day(22); const offer22 = T[1].response; T[0].fn(); const once = BAG.filter(i => i.name === 'Hot Stew').reduce((a, i) => a + (i.qty || 1), 0); T[0].fn(); const twice = BAG.filter(i => i.name === 'Hot Stew').reduce((a, i) => a + (i.qty || 1), 0);
  const meals = JSON.parse(JSON.stringify(worldState.feastMeals || {}));
  return { n: folk.length, plain, feast, people, innLine: FEAST_INN[people] || FEAST_INN.gatelander, giving: FEASTS.find(f => f.key === 'giving').greet, offer21, offer22, bag21, after21, once, twice, meals, charKey: !!SS_CHAR_WS.feastMeals };
});
console.log(JSON.stringify(t).slice(0, 1500));
check('on the Giving every townsperson greets with the Giving\'s line in their people\'s voice', t.n >= 3 && t.feast.every(([p, gr]) => gr.startsWith(t.giving[p] || t.giving.gatelander)), t.feast);
check('the day before, none of them does', t.plain.every(gr => !Object.values(t.giving).some(l => gr.startsWith(l))), t.plain);
check('on the feast the innkeeper\'s line comes before the room offer; the day before it does not', t.offer22.startsWith(t.innLine + ' ') && !t.offer21.includes(t.innLine) && t.offer22.endsWith(t.offer21.slice(-20)), { offer21: t.offer21, offer22: t.offer22 });
check('asking for something to eat on the feast puts one Hot Stew in your pack, once; the day before, none', t.after21 === t.bag21 && t.once === t.bag21 + 1 && t.twice === t.once, t);
check('the meals given are the character\'s (saved with the character row)', t.charKey && t.meals.day === 22 && Object.keys(t.meals).length === 2, t.meals);

// 3. a petty crime's fine is halved on the feast, and the guard says so
const f = await page.evaluate(() => {
  const S = WORLD.settle.get('dunmore'); const site = S.site; const day = n => { worldState.gameTimeAbsMinutes = n * 1440 + 660; worldState.gameTimeMinutes = 660; };
  const house = S.houses.find(h => /weapon|armor|potion|misc/.test(h.type)); const C = worldState.crime || (worldState.crime = {});
  const fine = n => { day(n); delete C[site.id]; seenCrime('theft', house, { name: 'x' }, 10); return C[site.id].bounty; };
  const b21 = fine(21), b22 = fine(22); const c = C[site.id];
  const n = (S.npcs || []).find(x => x.def && x.def.role === 'Guard') || (S.npcs || [])[0];
  confront(n, S, c); const said = document.getElementById('dlg-text').textContent; try { closeDialog(); } catch (e) {}
  day(23); confront(n, S, c); const said23 = document.getElementById('dlg-text').textContent; try { closeDialog(); } catch (e) {}
  const people = peopleOfSite(site); delete C[site.id];
  return { b21, b22, said, said23, line: FEAST_FINE[people] || FEAST_FINE.gatelander, people };
});
console.log(JSON.stringify(f));
check('a theft of goods worth 10 is fined 60 on an ordinary day and 30 on the feast', f.b21 === 60 && f.b22 === 30, f);
check('halted for it that day, the guard says the feast\'s half after the halt; the day after, he does not', f.said.endsWith(f.line) && /fine of 30 gold/.test(f.said) && !f.said23.includes(f.line), f);

// 4. the Due view
const due = await page.evaluate(() => { worldState.gameTimeAbsMinutes = 9 * 1440 + 600; worldState.gameTimeMinutes = 600; const D = calendarDue(); openHub('journal'); journalView('due'); const txt = document.getElementById('jn-body').innerText; closeHub(); return { D: D.filter(e => e.feast), txt }; });
check('the Due view lists the next feast with its line and its date', due.D.length === 1 && /in 13 days\s+🪨 The Giving — the year’s dead named at the old gate\. Stoneday, the 23rd of Reaping/.test(due.txt), due);
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
