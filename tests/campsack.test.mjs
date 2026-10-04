// A bandit camp sacks a town (Session 95, owed by eye since: *try it beside a village camp*). A camp left alive counts days;
// at 20 the nearest unburned village or town it threatens (a town whose nearest lair or camp it is, within 700 units) is
// sacked: prosperity 15, half its houses shells, a log line. Session 437: it counted once a day for every town it
// threatened, so Dunowen Camp, nearest to three home towns, sacked on day 7 and again within the week, and took whichever
// town the day's loop met first. It now counts once a day and takes the nearest town it threatens not already sacked or burned.
import { boot, check } from './lib/game.mjs';
const g = await boot(); const { page } = g;
await g.intoWorld();
// the nine home cells, built out before the days run (as `wholepoints` does), so every runner has the same towns
await page.evaluate(() => { for (let j = WORLD.HOME_J - 1; j <= WORLD.HOME_J + 1; j++) for (let i = WORLD.HOME_I - 1; i <= WORLD.HOME_I + 1; i++) WORLD.loadCell(i, j); });
await page.evaluate(() => { let quiet = 0; for (let n = 0; n < 3000 && quiet < 20; n++) { WORLD.tick(1 / 60, performance.now()); quiet = WORLD.jobs.length === 0 ? quiet + 1 : 0; } });

// which towns each live camp threatens (the daily tick's own rule: the nearest lair or camp, within 700)
const threat = await page.evaluate(() => {
  const BP = ['village', 'town', 'city', 'port', 'garrison', 'outpost'];
  const towns = WORLD.SITES.filter(t => BP.includes(t.kind)), lairs = WORLD.SITES.filter(t => t.kind === 'lair' || t.kind === 'bcamp');
  const by = {};
  for (const t of towns) { let near = null, nd = 1e9; for (const o of lairs) { const d = Math.hypot(o.x - t.x, o.z - t.z); if (d < nd) { nd = d; near = o; } }
    if (near && nd < 700 && near.kind === 'bcamp') (by[near.id] = by[near.id] || { id: near.id, camp: near.name, towns: [] }).towns.push({ id: t.id, name: t.name, kind: t.kind, d: Math.round(nd) }); }
  for (const k in by) by[k].towns.sort((a, b) => a.d - b.d);
  return { towns: towns.length, by: Object.values(by) };
});
console.log('threatened', JSON.stringify(threat));
const camp = threat.by.find(c => c.towns.length >= 2);
check('a home camp threatens two or more towns (Dunowen Camp: Dunderry, Cnocbeg, Inisnashane)', !!camp, threat.by);

// run the days from a clean world: no war, every town at its base, no camp counting, the camp alive; record each sack the
// game logs (*X was sacked by the bandits of Y.*) with its day
const run = (days, killCamp) => page.evaluate(([days, campId, killCamp]) => {
  const snap = { towns: JSON.stringify(worldState.towns || {}), camps: JSON.stringify(worldState.camps || {}), lairs: JSON.stringify(worldState.lairs || {}), war: worldState.war, t: worldState.gameTimeAbsMinutes };
  worldState.war = null; worldState.towns = {}; worldState.camps = {}; worldState.lairs = Object.assign({}, worldState.lairs); delete worldState.lairs[campId];
  if (killCamp) worldState.lairs[campId] = worldState.gameTimeAbsMinutes || 0;
  worldState.gameTimeAbsMinutes = 0; WORLD.tick(1 / 60, performance.now());
  const sacks = [], counts = []; const _a = addLog;
  addLog = function (ico, txt) { const m = /^(.+) was sacked by the bandits of (.+)\.$/.exec(txt || ''); if (m) sacks.push({ day: Math.floor(worldState.gameTimeAbsMinutes / 1440), town: m[1], camp: m[2], p: null }); return _a.apply(this, arguments); };
  try { for (let d = 1; d <= days; d++) { worldState.gameTimeAbsMinutes += 1440; WORLD.tick(1 / 60, performance.now()); counts.push(worldState.camps[campId] || 0);
      for (const s of sacks) if (s.p == null) { const t = WORLD.SITES.find(x => x.name === s.town); s.p = t ? WORLD.TS(t).p : null; s.shells = t ? WORLD.TS(t).flags.sacked != null : null; } } }
  finally { addLog = _a; worldState.towns = JSON.parse(snap.towns); worldState.camps = JSON.parse(snap.camps); worldState.lairs = JSON.parse(snap.lairs); worldState.war = snap.war; worldState.gameTimeAbsMinutes = snap.t; }
  return { sacks, counts: counts.slice(0, 22).join(' ') }; }, [days, camp && camp.id, killCamp]);

const live = await run(65, false);
console.log('camp alive, 65 days', JSON.stringify(live));
const mine = live.sacks.filter(s => s.camp === camp.camp);
check('the camp counts one a day: 1 on day 1, 19 on day 19', /^1 2 3 /.test(live.counts) && live.counts.split(' ')[18] === '19', live.counts);
check('its first sack falls on day 20, on the town nearest the camp, which drops to 15 and stands sacked', mine.length > 0 && mine[0].day === 20 && mine[0].town === camp.towns[0].name && mine[0].p === 15 && mine[0].shells, { mine, nearest: camp.towns[0] });
check('the next falls 20 days later on the next nearest, and the third 20 after that', camp.towns.length < 3 ? true : mine.length === 3 && mine[1].day === 40 && mine[1].town === camp.towns[1].name && mine[2].day === 60 && mine[2].town === camp.towns[2].name, mine);
check('no camp sacks any other town in those days', live.sacks.every(s => s.camp === camp.camp), live.sacks);

const dead = await run(25, true);
console.log('camp dead, 25 days', JSON.stringify(dead));
check('a cleared camp counts nothing and sacks nothing', dead.sacks.length === 0 && /^0 0 0/.test(dead.counts), dead);
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
