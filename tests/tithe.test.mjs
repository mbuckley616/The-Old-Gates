// The Compact's tithe (Session 266, Michael's A on issue #37): a town Aurenne occupies loses half a point of prosperity
// a game-day more than a town the Mark or the Gatelands occupies, and Aurenne's capital, the Compact's seat, gains it.
import { boot, check } from './lib/game.mjs';
const g = await boot(); const { page } = g;
await g.intoWorld();

const r = await page.evaluate(() => { WORLD.anchoredPlaces(); const seat = WORLD.FACTIONS.compact.seat; const cap = WORLD.siteAnywhere(seat);
  const towns = ['dunmore', 'portclare'].map(id => WORLD.siteAnywhere(id));
  const snap = JSON.stringify(worldState.towns || {}); const t0 = worldState.gameTimeAbsMinutes || 0; const war0 = worldState.war;
  const run = (occupier, days) => { worldState.towns = JSON.parse(snap); worldState.war = null; worldState.gameTimeAbsMinutes = t0; WORLD.tick(1 / 60, performance.now());
    towns.forEach(t => { const st = WORLD.TS(t); st.p = 50; st.flags = { occupied: 0 }; st.occupier = occupier; delete st.tithe; });
    WORLD.TS(cap).p = 50; WORLD.TS(cap).flags = {}; delete WORLD.TS(cap).tithe;
    const R0 = Math.random; let seed = 11; Math.random = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    try { const log = []; for (let d = 0; d < days; d++) { worldState.gameTimeAbsMinutes += 1440; WORLD.tick(1 / 60, performance.now()); log.push(towns.map(t => WORLD.TS(t).p + (WORLD.TS(t).flags.occupied != null ? "o" : "")).join("/")); } window._log = (window._log || []).concat([log.join(" ")]); }
    finally { Math.random = R0; }
    return { towns: towns.map(t => WORLD.TS(t).p), cap: WORLD.TS(cap).p }; };
  const aur = run('aurenne', 10), mark = run('mark', 10);
  worldState.towns = JSON.parse(snap); worldState.war = war0; worldState.gameTimeAbsMinutes = t0;
  return { log: window._log, seat, capName: cap && cap.name, capKind: cap && cap.kind, aur, mark }; });
console.log(JSON.stringify(r));
check('the Compact has a seat: a city of Aurenne', !!r.seat && r.capKind === 'city', r);
check('ten days held by Aurenne cost each town five points more than ten days held by the Mark', r.aur.towns.every((p, i) => r.mark.towns[i] - p === 5), r);
check('and the capital gains the tithe: two towns, a point a day, ten in ten days', r.aur.cap - r.mark.cap === 10, r);
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
