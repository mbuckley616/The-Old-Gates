// The calendar the world keeps (Session 496, Michael's C on DECISION #132, part B; docs/design/journal-and-calendar.md):
// a seven-day week with a day to each god, 28-day months, twelve months in four seasons, begun on the first day of the
// first autumn month (calDay, the placeholder names in CAL). First rule on it: on its god's own day a shrine's boon
// lasts twice as long, two days; on any other day one, and the altar still answers once a day.
import { boot, check } from './lib/game.mjs';
const g = await boot(); const { page } = g;
await g.intoWorld();

// 1. the arithmetic
const c = await page.evaluate(() => {
  const at = d => calDay(d * 1440 + 600);
  return { d0: at(0), d6: at(6), d7: at(7), d27: at(27), d28: at(28), d84: at(84), d335: at(335), d336: at(336), d167: at(167), d168: at(168), names: CAL.days.map(x => x.name), godsDay: [isGodsDay('muir', 0), isGodsDay('muir', 1440), isGodsDay('muir', 7 * 1440 + 1439)] };
});
console.log(JSON.stringify(c).slice(0, 1200));
check('day one is the first of the week, the first of the month, in autumn, year one', c.d0.weekday === 0 && c.d0.god === 'muir' && c.d0.dom === 1 && c.d0.season === 'autumn' && c.d0.year === 1, c.d0);
check('seven days to the week, a god to each, the Guest\'s last; the eighth day is the first again', c.d6.god === 'guest' && c.d7.weekday === 0 && c.names.length === 7 && new Set(c.names).size === 7, { d6: c.d6, d7: c.d7 });
check('28 days to the month: a weekday keeps its dates (the 1st is always the first day)', c.d27.dom === 28 && c.d28.dom === 1 && c.d28.month === c.d0.month + 1 && c.d28.weekday === 0, { d27: c.d27, d28: c.d28 });
check('three months to a season, twelve to a year: 84 days on is winter; the year turns with the first month, 168 days on; 336 days on is the same date a year later', c.d84.season === 'winter' && c.d167.year === 1 && c.d168.year === 2 && c.d168.month === 0 && c.d168.season === 'spring' && c.d336.year === 2 && c.d336.month === c.d0.month && c.d336.dom === 1 && c.d336.weekday === 0, { d84: c.d84, d167: c.d167, d168: c.d168, d336: c.d336 });
check('isGodsDay reads the whole day', JSON.stringify(c.godsDay) === '[true,false,true]', c.godsDay);

// 2. a shrine on its god's day and on another
const id = await page.evaluate(() => { let best = null, bd = 1e9; for (const c of CELLS.values()) for (const s of c.sites) if (s.kind === 'shrine' && godOf(s).boon) { const d = Math.hypot(s.x - px, s.z - pz); if (d < bd) { bd = d; best = s.id; } } return best; });
check('a shrine to try', !!id, id);
await g.settle(id); await page.evaluate((id) => { const t = WORLD.siteAnywhere(id); px = t.x; pz = t.z + 3; }, id); await page.waitForTimeout(3000);
const r = await page.evaluate(() => {
  const S = [...SETTLE.values()].find(S => S.site.kind === 'shrine' && S.altar && S.god && S.god.boon);
  if (!S) return { none: [...SETTLE.values()].map(S => [S.site.kind, !!S.altar, S.god && S.god.key]) };
  const god = S.god, idx = CAL.days.findIndex(d => d.god === god.key);
  const pray = (dayN) => { worldState.gameTimeAbsMinutes = dayN * 1440 + 600; worldState.gameTimeMinutes = 600; px = S.altar.x + 1; pz = S.altar.z; ACTIVE_BUFFS.length = 0;
    let msg = ''; const sm = window.showMsg; window.showMsg = (t) => { msg = t; }; try { shrineInteract(); } finally { window.showMsg = sm; }
    const b = ACTIVE_BUFFS.find(b => b.label === god.boon.label); return { msg, rem: b ? b.remaining : null }; };
  delete (worldState.shrines || {})[S.site.id];
  const own = pray(14 + idx);
  const again = pray(14 + idx);
  delete worldState.shrines[S.site.id];
  const other = pray(14 + (idx + 1) % 7);
  return { site: S.site.name, god: god.en, dayName: CAL.days[idx].name, own, again, other };
});
console.log(JSON.stringify(r));
check('on its god\'s own day the boon lasts two days, and it says so', r && r.own.rem === 3600 && r.own.msg.startsWith(`It is ${r.dayName}. You are restored`) && /two days/.test(r.own.msg), r);
check('prayed again the same day, the altar is quiet', r && /The altar is quiet/.test(r.again.msg), r && r.again);
check('on another day the boon lasts one, as before', r && r.other.rem === 1800 && /until tomorrow/.test(r.other.msg), r && r.other);
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
