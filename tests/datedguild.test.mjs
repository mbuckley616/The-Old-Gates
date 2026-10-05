// Dated guild work (Session 501, Michael's C on DECISION #132, part B, as the lords' jobs in Session 500): one generated
// guild task in three carries a date 7 to 14 days out (a stream keyed by the guild, the hall's town and the day); done by
// then (stamped by the guild's hooks) it pays a quarter more; past it, undone, the guild takes it back, checked at the
// hall itself (indoors, where the world's tick does not run) as well as hourly outdoors.
import { boot, check } from './lib/game.mjs';
const g = await boot(); const { page } = g;
await g.intoWorld();
const r = await page.evaluate(() => {
  const site = siteAnywhere('dunmore');
  const dayWith = (from, dated) => { for (let d = from; d < from + 80; d++) if ((seededRng('dated:guild_f:dunmore', d)() < 1 / 3) === dated) return d; };
  let n = 0; for (let d = 0; d < 600; d++) if (seededRng('dated:guild_f:dunmore', d)() < 1 / 3) n++;
  const reset = () => { const G = gstate(); G.guild_f = { done: 0, active: null }; };
  const finish = t => { if ('need' in t) t.have = t.need; else if ('count' in t) { t.spawned = true; t.have = t.count; } else if (t.kind === 'relic') t.got = true; else t.done = true; };
  // 1. a dated task, done by the kill hook a day before its date, paid a quarter more
  reset(); const d1 = dayWith(40, true); worldState.gameTimeAbsMinutes = d1 * 1440 + 600; worldState.gameTimeMinutes = 600;
  const said = offer('guild_f', site); const t1 = gstate().guild_f.active;
  worldState.gameTimeAbsMinutes = t1.due - 1440; finish(t1); WORLD.guild.onKill({ name: 'nobody' }, 'zone');
  const stamped = t1.doneAt;
  const D1 = calendarDue().filter(e => /for the Fighters/.test(e.text)).length;
  worldState.gameTimeAbsMinutes = t1.due + 600; const g0 = gold; const said1 = turnIn('guild_f'); const paid1 = gold - g0;
  // 2. another, left undone: the Due view lists it; at the hall past its date it is gone
  const d2 = dayWith(d1 + 20, true); worldState.gameTimeAbsMinutes = d2 * 1440 + 600; offer('guild_f', site); const t2 = gstate().guild_f.active;
  const D2 = calendarDue().filter(e => /for the Fighters/.test(e.text)).map(e => e.text);
  worldState.gameTimeAbsMinutes = t2.due - 1; const still = turnIn('guild_f');
  worldState.gameTimeAbsMinutes = t2.due + 5; const gone = turnIn('guild_f'); const log = GAME_LOG.slice(-2).map(e => e.text);
  // 3. an undated one, as before
  const d3 = dayWith(d2 + 20, false); worldState.gameTimeAbsMinutes = d3 * 1440 + 600; const said3 = offer('guild_f', site); const t3 = gstate().guild_f.active; finish(t3); const g3 = gold; turnIn('guild_f'); const paid3 = gold - g3;
  return { n, said, gold1: t1.gold, due1: t1.due, d1, stamped, D1, said1, paid1, want1: questGold(Math.round(t1.gold * 1.25)), D2, still, gone, log, active: gstate().guild_f.active, said3, t3due: t3.due, paid3, want3: questGold(t3.gold) };
});
console.log(JSON.stringify(r).slice(0, 2200));
check('about one guild task in three is dated over 600 days', r.n >= 170 && r.n <= 230, r.n);
check('the hall names the date and the quarter more', r.due1 > r.d1 * 1440 + 7 * 1440 && r.due1 <= (r.d1 + 15) * 1440 && new RegExp(`Pay is ${r.gold1} gold; ${Math.round(r.gold1 * 1.25)} if it is done by the .+ month\\. After that, the guild gives it to someone else\\.$`).test(r.said), r.said.slice(-160));
check('done a day before the date (stamped by the hook) and turned in after it, it pays a quarter more', r.stamped === r.due1 - 1440 && r.D1 === 0 && r.paid1 === r.want1, { stamped: r.stamped, paid: r.paid1, want: r.want1, said: r.said1 });
check('an undone dated task is in the Due view', r.D2.length === 1 && /gold if it is done by then; after it, the task is taken back\./.test(r.D2[0]), r.D2);
check('a minute before its date it stands; past it, at the hall, the guild has taken it back and says so in the journal', /^Not yet\./.test(r.still) && r.gone === "You've no task from us." && !r.active && r.log.some(t => /The date passed, and the guild has given it to someone else\./.test(t)), { still: r.still, gone: r.gone, log: r.log });
check('an undated task names no date and pays as before', !r.t3due && /Pay is \d+ gold\.$/.test(r.said3) && r.paid3 === r.want3, { said: r.said3.slice(-40), paid: r.paid3, want: r.want3 });
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
