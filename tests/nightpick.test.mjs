// Night burglary against the watch (Session 609; backlog G's owed check from Session 166: "whether night burglary is now fair
// before the numbers are tuned"). The feel is Michael's; this gives the numbers. A town lock picked under anyone's eye is a
// crime seen (`pickSeen`, asked every frame of the pick, Session 327); outdoors a witness sees you to 12 units by day, 6 at
// night, 3 at night sneaking, with a clear line (`witnessOf`). This stands at every shop door in Dunmore, hour by hour
// through a night from 20h to 4h, with the town's own ticks walking the watch and the guards, and counts how often someone
// would see a pick there: at an instant, and over a five-second pick.
import { boot, check } from './lib/game.mjs';
const g = await boot(); const { page } = g;
await g.intoWorld(); await g.settle('dunmore');
const stop = g.keepAlive();

const HOURS = [20, 21, 22, 23, 0, 1, 2, 3, 4];
const res = await page.evaluate((HOURS) => {
  const S = WORLD.settle.get('dunmore'); const site = S.site;
  const doors = S.houses.filter(h => h.keeper && /weapon|armor|potion|misc|inn/.test(h.type) && h.type !== 'inn').map(h => ({ h, x: h.exitX, z: h.exitZ }));
  const cx = site.x, cz = site.z + 4; const out = {}; const _sn = _sneaking;
  for (const hr of HOURS) { forceTime(hr + .25); px = cx; pz = cz; for (let i = 0; i < 300; i++) WORLD.tick(1 / 60, performance.now());
    const series = doors.map(() => ({ walk: [], sneak: [] })); const who = {};
    for (let f = 0; f < 1200; f++) { px = cx; pz = cz; WORLD.tick(1 / 60, performance.now());
      if (f % 15) continue; // every quarter second of the town's time
      doors.forEach((d, k) => { px = d.x; pz = d.z;
        for (const sn of [false, true]) { _sneaking = sn; const w = WORLD.witnessOf(d.h); series[k][sn ? 'sneak' : 'walk'].push(!!w);
          if (w && !sn) { const role = w.npc && w.npc.sched ? w.npc.sched.type : 'other'; who[role] = (who[role] || 0) + 1; } } }); }
    // at an instant: the share of samples seen; over a five-second pick: the share of 20-sample windows with any sample seen
    const inst = sn => series.reduce((a, s) => a + s[sn].filter(Boolean).length, 0) / series.reduce((a, s) => a + s[sn].length, 0);
    const pick = sn => { let n = 0, seen = 0; for (const s of series) { const L = s[sn]; for (let i = 0; i + 20 <= L.length; i += 4) { n++; if (L.slice(i, i + 20).some(Boolean)) seen++; } } return seen / n; };
    const doorAny = sn => series.filter(s => s[sn].some(Boolean)).length;
    out[hr] = { inst: +inst('walk').toFixed(3), instSneak: +inst('sneak').toFixed(3), pick: +pick('walk').toFixed(3), pickSneak: +pick('sneak').toFixed(3), doorsEverSeen: doorAny('walk'), doorsEverSeenSneak: doorAny('sneak'), who,
      out: S.npcs.filter(n => n.g.visible && !n._retreated).length, watch: S.npcs.filter(n => n.sched && n.sched.type === 'watch' && n.g.visible).length }; }
  _sneaking = _sn; px = cx; pz = cz; forceTime(12);
  return { doors: doors.length, rows: out, day: null };
}, HOURS);

console.log(`Dunmore, ${res.doors} shop doors; seen while picking (walking / sneaking): at an instant, over a five-second pick`);
for (const h of HOURS) { const r = res.rows[h]; console.log(`  ${String(h).padStart(2)}h: out ${r.out} (watch ${r.watch}); instant ${(r.inst * 100).toFixed(1)}% / ${(r.instSneak * 100).toFixed(1)}%; a pick ${(r.pick * 100).toFixed(1)}% / ${(r.pickSneak * 100).toFixed(1)}%; doors ever seen ${r.doorsEverSeen} / ${r.doorsEverSeenSneak}; by ${JSON.stringify(r.who)}`); }
const rows = HOURS.map(h => res.rows[h]);
const mean = k => rows.reduce((a, r) => a + r[k], 0) / rows.length;
console.log(JSON.stringify({ meanInst: +mean('inst').toFixed(3), meanInstSneak: +mean('instSneak').toFixed(3), meanPick: +mean('pick').toFixed(3), meanPickSneak: +mean('pickSneak').toFixed(3) }));
check('Dunmore\'s shop doors measured through a night', res.doors >= 4 && rows.length === HOURS.length, res.doors);
check('sneaking is never seen more than walking', rows.every(r => r.instSneak <= r.inst + 1e-9 && r.pickSneak <= r.pick + 1e-9), rows.map(r => [r.inst, r.instSneak]));
check('the watch is out at night', rows.some(r => r.watch > 0), rows.map(r => r.watch));
stop();
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
