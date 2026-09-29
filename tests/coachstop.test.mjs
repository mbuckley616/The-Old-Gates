// The coach stops at the coaching inn (Session 178): halfway along a coaching road it draws up at the inn and waits a
// quarter of an hour (15 s, a game minute each) before going on, once each way. Before, it ran straight past.
import { boot, check } from './lib/game.mjs';
const g = await boot(); const { page } = g;
await g.intoWorld(); await g.settle('dunmore');

const r = await page.evaluate(() => {
  // no camp breaks any road for this test
  worldState.lairs = new Proxy({}, { get: () => true }); worldState.routes = {};
  const C0 = WORLD.coaches(); let key = null, line = null;
  const town = s => s && /town|city|port/.test(s.kind);
  for (const d of WORLD.ROAD_DEFS) { const a = WORLD.siteAnywhere(d.a), b = WORLD.siteAnywhere(d.b); if (!town(a) || !town(b)) continue;
    const k = d.a < d.b ? d.a + '|' + d.b : d.b + '|' + d.a; C0[k] = { a: d.a, b: d.b }; px = (a.x + b.x) / 2; pz = (a.z + b.z) / 2;
    WORLD.tick(1 / 60, performance.now()); const C = WORLD.coachLines.get(k); if (C) { key = k; line = C; break; } delete C0[k]; }
  if (!line) return { key: null };
  const run = (dir, from, max) => { const C = line; C.u = from; C.state = 'run'; C.dir = dir; C.stopped = false; C.riding = false; const log = [];
    let stopAt = null, stopT = 0, t = 0; while (t < max) { WORLD.tick(1 / 60, performance.now()); t += 1 / 60;
      if (C.state === 'stop') { if (stopAt == null) stopAt = { u: C.u, t }; stopT += 1 / 60; }
      if (C.state === 'wait') break; }
    return { end: +C.u.toFixed(3), state: C.state, stopU: stopAt && +stopAt.u.toFixed(3), stopS: +stopT.toFixed(1), total: +t.toFixed(1), len: Math.round(C.len) }; };
  const out = run(1, .3, 120), back = run(-1, .7, 120);
  // a passenger rides through the stop and stays aboard
  line.u = .45; line.state = 'run'; line.dir = 1; line.stopped = false; line.riding = true; let seated = null;
  for (let i = 0; i < 60 * 20; i++) { WORLD.tick(1 / 60, performance.now()); if (line.state === 'stop' && !seated) { seated = { riding: line.riding, onCoach: +Math.hypot(px - line.cart.position.x, pz - line.cart.position.z).toFixed(2) }; } }
  line.riding = false;
  return { key, out, back, seated };
});
console.log(JSON.stringify(r));
check('a coaching road was raised and its coach built', !!r.key, r);
check('outbound: the coach stops at the inn halfway for a quarter of an hour, then reaches the far end', r.out && r.out.stopU === .5 && Math.abs(r.out.stopS - 15) < .1 && r.out.end === 1 && r.out.state === 'wait', r.out);
check('homebound: it stops there again, then reaches the near end', r.back && r.back.stopU === .5 && Math.abs(r.back.stopS - 15) < .1 && r.back.end === 0, r.back);
check('a passenger stays aboard through the stop', r.seated && r.seated.riding && r.seated.onCoach < .5, r.seated);
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
