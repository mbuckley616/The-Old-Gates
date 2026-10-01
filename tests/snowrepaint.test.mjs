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
  WORLD.tick(1 / 60, performance.now()); const queued = W.coverQ ? W.coverQ.length : 0; const all = W.coverQ ? [...W.coverQ] : [];
  while (W.coverQ && W.coverQ.length && ticks < 2000) { const t = performance.now(); WORLD.tick(1 / 60, performance.now()); const d = performance.now() - t; per.push(d); total += d; ticks++; }
  per.sort((a, b) => a - b);
  // Session 386: ticks with nothing, one chunk and eight chunks queued, interleaved so all three share the moment's
  // streaming and timer noise; the eight-chunk tick repaints as many as the rule lets it
  const T = { 0: [], 1: [], 8: [] }; const time = (n, i) => { W.coverQ = all.slice(i % (all.length - 8), i % (all.length - 8) + n); const t = performance.now(); WORLD.tick(1 / 60, performance.now()); T[n].push(performance.now() - t); W.coverQ.length = 0; };
  for (let i = 0; i < 40; i++) { time(0, i); time(1, i); time(8, i); }
  const med = a => { a.sort((x, y) => x - y); return +a[Math.floor(a.length / 2)].toFixed(2); }; const m0 = med(T[0]), one = med(T[1]), full = med(T[8]);
  return { rest: +rest.toFixed(2), m0, one, full, queued, ticks, median: +per[Math.floor(per.length / 2)].toFixed(2), p90: +per[Math.floor(per.length * .9)].toFixed(2), totalMs: Math.round(total), left: W.coverQ ? W.coverQ.length : 0 };
});
console.log(JSON.stringify(r));
check('the repaint finishes, and within a second at 60 fps', r.queued > 0 && r.left === 0 && r.ticks <= 60, r);
// Session 299: what Session 177 set is two chunks a tick, and that is exact: the queue drains in half its length in ticks.
// The cost in milliseconds follows the runner: locally a repainting tick is 1.1× one at rest (6.6 against 5.8 ms), on a
// CI runner 2× (16 against 8), so the old 3 ms over rest failed there on the runner's speed alone. Six chunks a tick,
// the cost this guards against, made a repainting tick nearly three times the two-chunk one (25 against 9 ms, Session 177).
check('it repaints two chunks a tick, no more', r.ticks >= Math.ceil(r.queued / 2), r);
// Session 386: the ratio to a tick at rest failed on a fast runner (rest 1.07 ms, a repainting tick 7.5) and passed
// locally (12.7 against 13.1), because a tick at rest is nearly free on one machine and carries the chunk streaming on
// another. What one chunk costs to repaint is the machine's own yardstick: with eight queued, a tick's cost over an empty
// tick is held under 3.5 one-chunk ticks' (two chunks make it about 2; six a tick would make it about 6), a millisecond
// allowed for timer noise.
check('with eight chunks queued a tick repaints about two chunks\' worth (its cost over an empty tick, against a one-chunk tick)', r.full - r.m0 < 3.5 * Math.max(0, r.one - r.m0) + 1, r);
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
