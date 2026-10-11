// Whether black sails sack a port rolls on the port and the day (Session 607, CLAUDE.md's co-op rules: a roll that decides
// an outcome comes from a stream keyed by place and id). `tickPortsDay` asked Math.random each day whether an unprotected
// port falls (2.5% a day from Act II, 5% while the Mark is at war). It now asks `seededRng('sack', '<site>:<day>')`: the same
// port on the same day falls or stands whatever Math.random says, so a host and a guest, or a reload, agree.
import { boot, check } from './lib/game.mjs';
const g = await boot(); const { page } = g;
await g.intoWorld();

// in the page: Act II, no war; for each of `days` days, every port's flags as they were, then the day's tick; which fell
const run = (rnd, days) => page.evaluate(([rnd, days]) => {
  const keep = JSON.stringify(worldState.towns || {}), abs0 = worldState.gameTimeAbsMinutes;
  const ports = WORLD.SITES.filter(t => t.kind === 'port'); ports.forEach(t => WORLD.TS(t));
  const base = JSON.stringify(worldState.towns);
  const _r = Math.random, _st = story, _w = war, _m = showMsg, _l = window.addLog; const S0 = story();
  const fell = [];
  Math.random = () => rnd; story = () => Object.assign({}, S0, { act: 2 }); war = () => null; showMsg = () => {}; window.addLog = () => {};
  try { for (let d = 100; d < 100 + days; d++) { worldState.towns = JSON.parse(base); worldState.gameTimeAbsMinutes = d * 1440 + 6 * 60; tickPortsDay();
      for (const t of ports) { const st = worldState.towns[t.id]; if (st && st.flags.sacked != null) fell.push(d + ':' + t.id); } } }
  finally { Math.random = _r; story = _st; war = _w; showMsg = _m; window.addLog = _l; worldState.towns = JSON.parse(keep); worldState.gameTimeAbsMinutes = abs0; }
  const open = ports.filter(t => { worldState.towns = JSON.parse(base); return !portProtected(t); }).length; worldState.towns = JSON.parse(keep);
  return { ports: ports.length, open, fell };
}, [rnd, days]);

const lo = await run(0.001, 200), hi = await run(0.999, 200);
const rate = lo.fell.length / (lo.open * 200);
console.log(JSON.stringify({ ports: lo.ports, open: lo.open, fellLo: lo.fell.length, fellHi: hi.fell.length, rate: +rate.toFixed(4), first: lo.fell.slice(0, 6) }));
check('ports, some of them unprotected', lo.ports > 0 && lo.open > 0, { ports: lo.ports, open: lo.open });
check('two hundred days of Act II: the same ports fall on the same days whatever Math.random says', lo.fell.length > 0 && lo.fell.join() === hi.fell.join(), { lo: lo.fell.length, hi: hi.fell.length });
check('about 2.5% of unprotected port-days fall (1–5%)', rate > .01 && rate < .05, rate);
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
