// The Journal's Due view (Session 498, Michael's C on DECISION #132, part B): what the calendar owes you, from things that
// already carry a date (calendarDue): the rent from the towns you own on the first day of the week, the ship on the
// shipwright's slip, the masons at a town, the room you have let, the coach seat held; soonest first, each with the
// calendar's date (calDateLine; the quest writer's names since Session 549) and how far off.
import { boot, check } from './lib/game.mjs';
const g = await boot(); const { page } = g;
await g.intoWorld();
const r = await page.evaluate(() => {
  const empty = (() => { worldState.gameTimeAbsMinutes = 1440 * 9 + 600; worldState.gameTimeMinutes = 600; return calendarDue().length; })();
  openHub('journal'); journalView('due'); const emptyTxt = document.getElementById('jn-body').innerText; closeHub();
  const t = siteAnywhere('dunmore'); flag(t, 'owned', true); const st = TS(t); const p = st.p;
  st.builds.push({ key: 'well', name: 'well', p: 2, doneDay: 11, done: false });
  worldState.ship = Object.assign(worldState.ship || {}, { name: 'Gull', sunk: true, raise: { site: 'dunmore', due: 1440 * 10 + 300 } });
  worldState.rented = { id: 'x', room: 0, until: 1440 * 9 + 600 + 24 * 60 };
  worldState.coachSeat = { key: 'k', at: 1440 * 9 + 700, tod: 700, dir: 1 };
  const D = calendarDue();
  openHub('journal'); journalView('due'); const txt = document.getElementById('jn-body').innerText; const btn = [...document.querySelectorAll('#jn-views button')].map(b => b.textContent); closeHub();
  const rentBefore = gold; worldState._rentWk = 1; worldState.gameTimeAbsMinutes = 1440 * 14; tickRents(); const paid = gold - rentBefore;
  return { empty, emptyTxt, D, txt, btn, p, paid, line0: calDateLine(0), line9: calDateLine(1440 * 9 + 600), line22: calDateLine(1440 * 21) };
});
console.log(JSON.stringify(r).slice(0, 2000));
check('the calendar\'s date line: day 1 is Hearthday, the 1st of Reaping; day 10 Beastday, the 10th; day 22 Hearthday, the 22nd', r.line0 === 'Hearthday, the 1st of Reaping' && r.line9 === 'Beastday, the 10th of Reaping' && r.line22 === 'Hearthday, the 22nd of Reaping', [r.line0, r.line9, r.line22]);
/* S2531 — since Session 2313 the view also lists the next festival of the island you stand on (the Gatelands' Night of the Lanterns,
   Skyday the 26th of Leaffall): the two checks below read it after the feast, and are otherwise unchanged */
check('the Journal has a Due view, and with nothing dated it lists only the next feast under today\'s date (Session 550: the Giving, Stoneday the 23rd), then the island\'s next festival (Session 2313: the Night of the Lanterns, in 44 days), and its market day (Session 2641: Stoneday the 16th, in 6 days)', r.btn.includes('Due') && r.empty === 3 && /in 6 days\s+⚖ Market day in the towns here, 7 to 15: a tenth off what you buy at a counter, a tenth more for what you sell\. Stoneday, the 16th of Reaping/.test(r.emptyTxt) && /in 44 days\s+🏮 The Night of the Lanterns — at dusk, a lantern for each who went into a gate and did not come out\. Skyday, the 26th of Leaffall/.test(r.emptyTxt) && /Today is Beastday, the 10th of Reaping/.test(r.emptyTxt) && /in 13 days\s+🪨 The Giving — the year’s dead named at the old gate\. Stoneday, the 23rd of Reaping/.test(r.emptyTxt) && !/Nothing falls due\./.test(r.emptyTxt), r.emptyTxt);
const at = r.D.map(e => e.at), texts = r.D.map(e => e.text).join(' | ');
/* S2641 — and the island's market day (#1971 B: the Gatelands' on Stoneday, from 7), Stoneday the 16th, between the rent and the Giving */
check('eight dated things, soonest first: the coach seat, the ship, the room, the masons, the rent, the market day, the Giving, the Lanterns', r.D.length === 8 && r.D[5].market === true && r.D[5].at === 1440 * 15 + 420 && r.D[6].feast === 'giving' && r.D[6].at === 1440 * 22 && r.D[7].festival === 'lanterns' && r.D[7].at > r.D[6].at && at.every((a, i) => !i || at[i - 1] <= a) && /coach/.test(r.D[0].text) && /Gull raised and lying at Dunmore/.test(r.D[1].text) && /room you let/.test(r.D[2].text) && /The well at Dunmore finished/.test(r.D[3].text) && /Rent from your town/.test(r.D[4].text) && r.D[4].at === 1440 * 14, texts);
check('the rent named is the rent paid on the first day of the week', new RegExp(`about ${r.paid} gold`).test(r.D[4].text) && r.paid > 0, { paid: r.paid, rent: r.D[4].text });
check('the view lists each with how far off and its date', /today\s+🐎 Your seat on the 11:40 coach\./.test(r.txt) && /tomorrow\s+⛵ The Gull raised/.test(r.txt) && /in 2 days\s+🧱 The well at Dunmore finished\. Skyday, the 12th of Reaping/.test(r.txt) && /in 5 days\s+🪙 Rent from your town/.test(r.txt) && /Hearthday, the 15th of Reaping/.test(r.txt), r.txt);
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
