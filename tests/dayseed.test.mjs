// The world's daily rolls ride the place and the day (Session 679; the co-op rules' seeded-stream line, after Session 607's
// sack of a port). A shrine's boon, the war's sieges (whether one is laid today, by which side and where), the plague's
// onset at a town by an uncleared lair, and the hour a bandit camp springs on a caravan rolled on Math.random, so a reload,
// or a host and a guest, saw different days. Each now rolls on `seededRng(<what>, <place>:<day>)`. Drive each over the same
// days twice from one saved state, with Math.random pinned at .001 and then at .999: the two runs agree, and the rates are
// still the old ones.
import { boot, check } from './lib/game.mjs';
const g = await boot(); const { page } = g;
await g.intoWorld();
const r = await page.evaluate(() => {
  const rnd = Math.random; const T0 = worldState.gameTimeAbsMinutes || 0; const out = {};
  const snap = () => JSON.stringify({ towns: worldState.towns || {}, war: worldState.war || null, lairDays: worldState.lairDays || {}, routes: worldState.routes || {}, lairs: worldState.lairs || {} });
  const restore = s => { const o = JSON.parse(s); worldState.towns = o.towns; worldState.war = o.war; worldState.lairDays = o.lairDays; worldState.routes = o.routes; worldState.lairs = o.lairs; };
  const twice = (fn) => { const s0 = snap(); const res = []; for (const v of [.001, .999]) { restore(s0); Math.random = () => v; res.push(fn()); } Math.random = rnd; restore(s0); worldState.gameTimeAbsMinutes = T0; return res; };
  // the war: 120 days of a war between the first faction's nation and its opponent
  const fk = Object.keys(FACTIONS).find(k => OPPONENT[k] && borderTowns(FACTIONS[k].nation, OPPONENT[k]).length);
  const A = FACTIONS[fk].nation, B = OPPONENT[fk];
  out.war = twice(() => { worldState.war = null; startWar(A, B, null); const laid = [];
    for (let d = 1; d <= 120; d++) { worldState.gameTimeAbsMinutes = T0 + d * 1440; const before = new Set(Object.keys(worldState.towns || {}).filter(id => worldState.towns[id].flags.besieged != null));
      tickWarDay(); for (const id in worldState.towns) if (worldState.towns[id].flags.besieged != null && !before.has(id)) laid.push(d + ':' + id + ':' + worldState.towns[id].siegeBy); }
    worldState.war = null; return laid; });
  // the plague: every town by a live lair held at 30 days, rolled over 100 days
  out.plague = twice(() => { const hit = []; for (let d = 1; d <= 100; d++) { worldState.gameTimeAbsMinutes = T0 + d * 1440; const L = worldState.lairDays || (worldState.lairDays = {});
      for (const t of SITES) if (t.kind in BASE_P) { const st = TS(t); delete st.flags.plague; L[t.id] = 29; }
      tickPlagueDay(); for (const t of SITES) if (t.kind in BASE_P && TS(t).flags.plague != null) hit.push(d + ':' + t.id); }
    for (const t of SITES) if (t.kind in BASE_P) delete TS(t).flags.plague; return hit; });
  // the caravan's ambush hour: a route from every town within 500 of a live bandit camp, to itself, over 30 days
  const camps = SITES.filter(t => t.kind === 'bcamp'); const towns = SITES.filter(t => t.kind in BASE_P && camps.some(c => Math.hypot(c.x - t.x, c.z - t.z) < 480)).slice(0, 8);
  out.routeTowns = towns.length;
  out.threat = twice(() => { const fs = []; worldState.routes = {}; for (const t of towns) worldState.routes['test:' + t.id] = { a: t.id, b: t.id, open: true };
    for (let d = 1; d <= 30; d++) { worldState.gameTimeAbsMinutes = T0 + d * 1440; for (const k in worldState.routes) { const rt = worldState.routes[k]; rt.broken = false; if (rt.threat) rt.threat.won = true; }
      tickRoutesDay(); for (const k in worldState.routes) { const th = worldState.routes[k].threat; if (th) fs.push(+th.f.toFixed(4)); } }
    return fs; });
  return out;
});
const war = r.war, pl = r.plague, th = r.threat;
console.log('  war', JSON.stringify({ a: war[0].length, b: war[1].length, first: war[0].slice(0, 4) }));
console.log('  plague', JSON.stringify({ a: pl[0].length, b: pl[1].length, first: pl[0].slice(0, 4) }));
console.log('  threat', JSON.stringify({ towns: r.routeTowns, a: th[0].length, b: th[1].length, lo: Math.min(...th[0]), hi: Math.max(...th[0]), distinct: new Set(th[0]).size }));
// the shrine: a shrine with no god's boon, prayed at on five days
const shrine = await page.evaluate(() => { const s = SITES.find(t => t.kind === 'shrine'); return s ? s.id : null; });
let boons = null;
if (shrine) {
  await g.settle(shrine);
  boons = await page.evaluate(() => { const rnd = Math.random; const T0 = worldState.gameTimeAbsMinutes || 0; const S = [...SETTLE.values()].find(S => S.site.kind === 'shrine' && S.altar);
    if (!S) return null; const god = S.god; S.god = null; const res = [];
    for (const v of [.001, .999]) { Math.random = () => v; const got = []; const _l = addLog; window.addLog = (i, t) => { if (/^Prayed at/.test(t)) got.push(t.replace(/^Prayed at [^:]*: /, '')); };
      for (let d = 1; d <= 6; d++) { worldState.gameTimeAbsMinutes = T0 + d * 1440 + 600; worldState.shrines = {}; px = S.altar.x; pz = S.altar.z; shrineInteract(); }
      window.addLog = _l; res.push(got); }
    Math.random = rnd; S.god = god; worldState.gameTimeAbsMinutes = T0; worldState.shrines = {}; return { site: S.site.name, res }; });
  console.log('  shrine', JSON.stringify(boons));
}
check('the war\'s sieges fall on the same days, towns and sides whatever Math.random says', JSON.stringify(war[0]) === JSON.stringify(war[1]) && war[0].length >= 3, war);
check('a siege is still laid on about one day in seven (0.15 a day, less the towns already taken)', war[0].length >= 6 && war[0].length <= 30, war[0].length);
check('the plague comes to the same towns on the same days whatever Math.random says', JSON.stringify(pl[0]) === JSON.stringify(pl[1]), { a: pl[0].length, b: pl[1].length });
check('the plague still comes to a town held at 30 days by a live lair', pl[0].length > 0, pl[0].length);
check('a camp\'s ambush hour is the same whatever Math.random says, and spreads over .175–.325', r.routeTowns > 0 && JSON.stringify(th[0]) === JSON.stringify(th[1]) && th[0].length > 0 && Math.min(...th[0]) >= .175 && Math.max(...th[0]) <= .325 && new Set(th[0]).size > th[0].length / 2, { towns: r.routeTowns, n: th[0].length });
check('a shrine\'s boon is the same on each day whatever Math.random says, and not one boon every day', !!boons && boons.res[0].length === 6 && JSON.stringify(boons.res[0]) === JSON.stringify(boons.res[1]) && new Set(boons.res[0]).size > 1, boons);
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
