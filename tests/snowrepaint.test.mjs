// The snow repaint, spread thinner (Session 177): when the snow cover moves, every loaded chunk's ground colour is
// repainted, a few chunks a frame. At six a frame a repaint cost ~7 ms a tick while it ran (Session 176's profile);
// at two it costs a third of that a frame and is still done inside a second at 60 fps.
import { boot, check } from './lib/game.mjs';
const g = await boot(process.env.SRC ? { src: process.env.SRC } : {}); const { page } = g;
await g.intoWorld(); await page.waitForTimeout(15000);
const r = await page.evaluate(() => { const W = WORLD.wx; W.type = W.next = 'clear'; W.k = 0;
  // at rest: no cover, nothing queued (the harness passes through a cold legacy cell and arrives with snow melting)
  W.cover = 0; W.coverPainted = 0; if (W.coverQ) W.coverQ.length = 0;
  for (let i = 0; i < 30; i++) WORLD.tick(1 / 60, performance.now());
  let t0 = performance.now(); for (let i = 0; i < 60; i++) WORLD.tick(1 / 60, performance.now()); const rest = (performance.now() - t0) / 60;
  // a cover change big enough to repaint, then tick until the queue is empty
  W.cover = 0; W.coverPainted = .2; const per = []; let ticks = 0, total = 0;
  WORLD.tick(1 / 60, performance.now()); const queued = W.coverQ ? W.coverQ.length : 0;
  while (W.coverQ && W.coverQ.length && ticks < 2000) { const t = performance.now(); WORLD.tick(1 / 60, performance.now()); const d = performance.now() - t; per.push(d); total += d; ticks++; }
  per.sort((a, b) => a - b);
  return { rest: +rest.toFixed(2), queued, ticks, median: +per[Math.floor(per.length / 2)].toFixed(2), p90: +per[Math.floor(per.length * .9)].toFixed(2), totalMs: Math.round(total), left: W.coverQ ? W.coverQ.length : 0 };
});
console.log(JSON.stringify(r));
check('the repaint finishes, and within a second at 60 fps', r.queued > 0 && r.left === 0 && r.ticks <= 60, r);
// Session 299: what Session 177 set is two chunks a tick, and that is exact: the queue drains in half its length in ticks.
// The cost in milliseconds follows the runner: locally a repainting tick is 1.1× one at rest (6.6 against 5.8 ms), on a
// CI runner 2× (16 against 8), so the old 3 ms over rest failed there on the runner's speed alone. Six chunks a tick,
// the cost this guards against, made a repainting tick nearly three times the two-chunk one (25 against 9 ms, Session 177).
check('it repaints two chunks a tick, no more', r.ticks >= Math.ceil(r.queued / 2), r);
check('a repainting tick costs under 2.5× one at rest (median)', r.median < 2.5 * r.rest + 1, r);
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
