// A spike plate's hit rolls on the trap's own stream (Session 606, CLAUDE.md's co-op rules: a hit's damage comes from a
// stream keyed by place and id). The plate drew its 8–15 (+ level × 0.8) from Math.random. A trap now takes an id the
// first time it is sprung, `<seed>:<floor>:trap:<n>` (the seed's placement makes the list the same every visit), and
// `trapRand(t)` draws its hits in turn from `seededRng('trap', id)`, as `foeRand(e)` does a foe's blows.
import { boot, check } from './lib/game.mjs';
import { enterDungeon } from './lib/dungeonshot.mjs';
const g = await boot(); const { page } = g;
await g.intoWorld();
const stop = g.keepAlive();

let found = null;
for (const seed of [11, 3, 7, 21, 42, 5, 13, 29]) {
  await enterDungeon(page, { theme: 'ruins', seed, interior: 'cave', size: 'medium' });
  found = await page.evaluate(() => { const i = D_TRAPS.findIndex(t => t.kind === 'spike' && t.floor === currentFloor); return i < 0 ? null : { i, n: D_TRAPS.length }; });
  if (found) { found.seed = seed; break; }
}
console.log(' ', JSON.stringify(found));
check('a dungeon with a spike plate', !!found, found);

// in the page: spring the plate `k` times with Math.random pinned to `rnd`, a fresh stream (as after a reload), and read each hit
const spring = (rnd, k) => page.evaluate(([rnd, k]) => {
  const t = D_TRAPS.filter(t => t.kind === 'spike' && t.floor === currentFloor)[0]; const gy = currentFloor === 2 ? FLOOR2_Y : 0;
  ENEMIES.forEach(e => { e.dead = true; }); delete t.rng; delete t.id; const _r = Math.random, _m = showMsg; const hits = [];
  Math.random = () => rnd; showMsg = () => {};
  try { for (let j = 0; j < k; j++) { PHP = maxHP; t.armed = true; px = t.x; pz = t.z; jumpY = gy; const h0 = PHP; tickDungeonTraps(1 / 60); hits.push(h0 - PHP); } }
  finally { Math.random = _r; showMsg = _m; }
  PHP = maxHP; t.armed = true; px = t.x + 3; return { id: t.id, hits, lv: level }; }, [rnd, k]);

const a = await spring(0.05, 6), b = await spring(0.95, 6);
console.log('a', JSON.stringify(a), 'b', JSON.stringify(b));
check('the plate takes an id of seed, floor and place', a.id === `${found.seed}:1:trap:${found.i}`, a.id);
check('six springs: the same hits in the same order whatever Math.random says', a.hits.length === 6 && a.hits.every(h => h > 0) && a.hits.join() === b.hits.join(), { a: a.hits, b: b.hits });
const lo = 8 + Math.floor(a.lv * .8), hi = 15 + Math.floor(a.lv * .8);
check('the hits stay in the plate\'s band (8–15 + level × 0.8, before any ward) and vary', a.hits.every(h => h <= hi) && new Set(a.hits).size >= 2, { hits: a.hits, lo, hi });
stop();
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
