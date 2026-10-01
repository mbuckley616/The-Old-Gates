// Prosperity's fractions (Session 272, Michael's B on issue #44): a town's own conditions (occupied −.5, owned +.4, burned or
// sacked −.2) keep what they leave under a whole point, so they count in full; roads, the lair and the drift home round as before.
import { boot, check } from './lib/game.mjs';
const g = await boot(); const { page } = g;
await g.intoWorld();
// S367 — the daily tick runs over the towns of the loaded cells (WORLD.SITES), which fill in while the loader works (17
// towns a moment after arrival, 52 once the nine cells round home are in). Load those nine now, so a slow runner measures
// the same 52 towns a fast one does.
await page.evaluate(() => { for (let j = WORLD.HOME_J - 1; j <= WORLD.HOME_J + 1; j++) for (let i = WORLD.HOME_I - 1; i <= WORLD.HOME_I + 1; i++) WORLD.loadCell(i, j); });

const r = await page.evaluate(() => {
  const snap = JSON.stringify(worldState.towns || {}); const tBoot = worldState.gameTimeAbsMinutes || 0, t0 = 0; const war0 = worldState.war;
  const towns = WORLD.SITES.filter(t => ['village', 'town', 'city', 'port', 'garrison', 'outpost'].includes(t.kind));
  const seeded = f => { const R0 = Math.random; let seed = 7; Math.random = () => ((seed = (seed * 16807) % 2147483647) / 2147483647); try { return f(); } finally { Math.random = R0; } };
  const days = n => { for (let d = 0; d < n; d++) { worldState.gameTimeAbsMinutes += 1440; WORLD.tick(1 / 60, performance.now()); } };
  // S367 — every town starts from its own base (TS() makes it from its id alone), not from the boot's snapshot: a town the
  // world had not yet touched was made inside the seeded run, so how far the loader got before this line (a runner's speed)
  // changed the untended world's numbers (CI on 4a128db: mean −6.5, least −67; here −6.7, −77).
  const reset = () => { worldState.war = null; worldState.gameTimeAbsMinutes = t0; worldState.towns = {}; towns.forEach(t => WORLD.TS(t)); WORLD.tick(1 / 60, performance.now()); };
  // 1. the untended world, 120 days
  reset(); const world = seeded(() => { const p0 = towns.map(t => WORLD.TS(t).p); days(120); const dp = towns.map((t, i) => WORLD.TS(t).p - p0[i]); return { n: towns.length, mean: +(dp.reduce((a, b) => a + b, 0) / dp.length).toFixed(1), min: Math.min(...dp), max: Math.max(...dp) }; });
  // 2. one town under each condition, 10 days, against the same town with none
  const cond = (id, set) => { reset(); return seeded(() => { const st = WORLD.TS(WORLD.siteAnywhere(id)); st.p = 50; st.flags = {}; delete st.pf; delete st.tithe; set(st); const log = []; for (let d = 0; d < 10; d++) { days(1); log.push(st.p); } return { p: st.p, pf: st.pf, log: log.join(' ') }; }); };
  const out = {};
  for (const id of ['dunmore', 'portclare']) out[id] = { none: cond(id, () => {}), occupied: cond(id, st => { st.flags.occupied = 0; st.occupier = 'mark'; }), owned: cond(id, st => { st.flags.owned = 0; }), burned: cond(id, st => { st.flags.burned = 0; }) };
  worldState.towns = JSON.parse(snap); worldState.war = war0; worldState.gameTimeAbsMinutes = tBoot;
  return { world, out };
});
console.log(JSON.stringify(r));
const D = r.out.dunmore, P = r.out.portclare;
check('the untended world over 120 days moves as it did before (52 towns from their own base: mean −6.8, least −77, most 0; S367)', r.world.n === 52 && r.world.mean === -6.8 && r.world.min === -77 && r.world.max === 0, r.world);
check('occupied: ten days cost five points more than none (half a point a day, in full)', D.none.p - D.occupied.p === 5 && P.none.p - P.occupied.p === 5, r.out);
check('owned: ten days bring four points more than none (.4 a day)', D.owned.p - D.none.p === 4 && P.owned.p - P.none.p === 4, r.out);
check('burned: ten days cost two points more than none (.2 a day)', D.none.p - D.burned.p === 2 && P.none.p - P.burned.p === 2, r.out);
check('the carried fraction is under a point and kept on the town (saved with worldState.towns)', [D, P].every(x => ['occupied', 'owned', 'burned'].every(k => typeof x[k].pf === 'number' && Math.abs(x[k].pf) < 1)), r.out);
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
