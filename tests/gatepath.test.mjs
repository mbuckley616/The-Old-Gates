// The proven way through a gate (card F5, Session 1293; docs/design/gate-interiors-build.md, "Condition" and "The suites"): from
// the way in to the ring chamber there is always a way on foot, and nothing on it needs a skill (every gap under 2.5 m, anyone's
// running jump). Twenty seeds a size through the generator, the way found over the cells you can stand on (a chasm's open air and
// a pier are not); then three gates built and the way walked by a body 0.3 round with the game's own dSlide, cell by cell, through
// every threshold. Condition (failing and broken gates, their gone spans and floating stones) is the sheet's session 4: until it is
// built every gate is steady, so the way has no gap at all.
import { boot, check } from './lib/game.mjs';
import { enterDungeon } from './lib/dungeonshot.mjs';
const g = await boot(); const { page } = g;
await g.intoWorld();
const R = await page.evaluate(() => {
  const out = [];
  for (const size of ['tiny', 'small', 'medium', 'large', 'massive']) for (let k = 0; k < 20; k++) {
    const seed = 57 + k * 1231, gen = makeGate(size, seed), W = gen.W, H = gen.H, map = gen.map;
    const stand = (c, r) => r >= 0 && c >= 0 && r < H && c < W && map[r][c] !== 0 && map[r][c] !== 8 && map[r][c] !== 9;
    const prev = new Int32Array(W * H).fill(-2), q = [gen.entR * W + gen.entC]; prev[q[0]] = -1;
    const ring = gen.spaces[gen.ring], inRing = i => { const c = i % W, r = (i / W) | 0; return c >= ring.x && c < ring.x + ring.w && r >= ring.y && r < ring.y + ring.h; };
    let end = -1;
    while (q.length && end < 0) { const i = q.shift(); if (inRing(i)) { end = i; break; } const c = i % W, r = (i / W) | 0;
      for (const [dc, dr] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const nc = c + dc, nr = r + dr; if (!stand(nc, nr)) continue; const j = nr * W + nc; if (prev[j] !== -2) continue; prev[j] = i; q.push(j); } }
    const path = []; for (let i = end; i >= 0; i = prev[i]) path.push(i);
    // a gap on the way: a run of cells you cannot stand on between two you can, in a straight line (none while every gate is steady)
    let gap = 0; for (let a = 1; a < path.length; a++) { const i = path[a - 1], j = path[a]; if (Math.abs(i - j) !== 1 && Math.abs(i - j) !== W) gap = Math.max(gap, 99); }
    const spacesOn = new Set(path.map(i => gen.cellSpace[(i / W) | 0][i % W]).filter(s => s >= 0));
    out.push({ size, seed, found: end >= 0, cells: path.length, metres: path.length * GATE_CELL, gap, spacesOn: spacesOn.size, nSpaces: gen.spaces.length }); }
  return out; });
const MAXMIN = { tiny: 12, small: 12, medium: 25, large: 25, massive: 40 };
check(`a way on foot from the way in to the ring chamber in every gate (${R.length})`, R.every(r => r.found), R.filter(r => !r.found).map(r => [r.size, r.seed]));
check('nothing on it needs a skill: no gap on the way (under 2.5 m; a steady gate has none)', R.every(r => r.gap < 2.5), R.filter(r => r.gap >= 2.5).map(r => [r.size, r.seed, r.gap]));
const jog = R.map(r => [r.size, r.seed, r.metres, +(r.metres / 3.83 / 60).toFixed(1)]);
check('its length at a jog (3.83 m/s) is inside the size\'s time to clear (12, 25, 40 min), the fights aside', R.every(r => r.metres / 3.83 / 60 < MAXMIN[r.size]), jog.slice(0, 5).concat(jog.filter(j => j[0] === 'massive').slice(0, 3)));
check('it passes through spaces, not round them (at least the ring and one more)', R.every(r => r.spacesOn >= 2), R.filter(r => r.spacesOn < 2).map(r => [r.size, r.seed, r.spacesOn, r.nSpaces]));
// walked: three gates built, a body 0.3 round led cell by cell along the game's own bfs from the way in to the ring's middle
const Wk = [];
for (const [size, seed] of [['small', 101], ['large', 1078], ['massive', 3032]]) {
  await enterDungeon(page, { theme: 'ruins', size, seed });
  Wk.push(Object.assign({ size, seed }, await page.evaluate(() => {
    const gen = window._lastGen, ring = gen.spaces[gen.ring], tx = dAt(ring.x - .5 + ring.w / 2), tz = dAt(ring.y - .5 + ring.h / 2);
    const path = bfs(px, pz, tx, tz); let x = px, z = pz, stuck = 0, steps = 0;
    for (const [c, r] of path) { const gx = dAt(c), gz = dAt(r);
      for (let i = 0; i < 200 && Math.hypot(gx - x, gz - z) > .15; i++) { const d = Math.hypot(gx - x, gz - z), s = Math.min(.1, d); const [nx, nz] = dSlide(x, z, (gx - x) / d * s, (gz - z) / d * s); if (Math.hypot(nx - x, nz - z) < 1e-4) { stuck++; break; } x = nx; z = nz; steps++; } }
    const thrOn = gen.thresholds.filter(t => path.some(([c, r]) => c === t.c && r === t.r)).length;
    const [lc, lr] = path[path.length - 1] || [-1, -1], inRing = lc >= ring.x && lc < ring.x + ring.w && lr >= ring.y && lr < ring.y + ring.h;
    return { cells: path.length, metres: +(steps * .1).toFixed(0), stuck, at: +Math.hypot(x - dAt(lc), z - dAt(lr)).toFixed(2), inRing, thrOn }; })));
}
for (const w of Wk) console.log(JSON.stringify(w));
check('walked: a body 0.3 round reaches the ring chamber\'s middle cell along the way, through its thresholds, never stuck', Wk.every(w => w.cells > 10 && w.stuck === 0 && w.at < .2 && w.inRing && w.thrOn >= 1), Wk);
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
