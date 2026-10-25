// The proven way through a gate (card F5, Session 1293; docs/design/gate-interiors-build.md, "Condition" and "The suites"): from
// the way in to the ring chamber there is always a way on foot, and nothing on it needs a skill (every gap under 2.5 m, anyone's
// running jump). Twenty seeds a size through the generator in each of the three conditions (S1327: a failing gate loses one span in
// three of a chasm's bridge and has gaps in its naves' floors, a catastrophic one loses every span; a gone span is crossed by the
// floating stones), the way found over the cells you can stand on (a chasm's open air and a pier are not) and the stones, a jump
// from a stone to the next or to a cell's edge counted as a gap. Then three gates built and the way walked by a body 0.3 round
// with the game's own dSlide, cell by cell, through every threshold; and a broken gate's stones crossed by the loop, jumping at
// each edge, and the pit's fall.
import { boot, check } from './lib/game.mjs';
import { enterDungeon } from './lib/dungeonshot.mjs';
const g = await boot(); const { page } = g;
await g.intoWorld();
const R = await page.evaluate(() => {
  const out = [];
  for (const cond of ['steady', 'failing', 'catastrophic']) for (const size of ['tiny', 'small', 'medium', 'large', 'massive']) for (let k = 0; k < 20; k++) {
    const seed = 57 + k * 1231, gen = makeGate(size, seed, 0, cond), W = gen.W, H = gen.H, N = W * H;
    // S1298 — a massive gate's way runs on two floors: a node is a floor's cell (floor two's from N on), and the stair hall's cells,
    // open on both maps, join the two (the flights carry you down between them). S1327 — a stone is a node after them (2N + i).
    const maps = [gen.map, gen.map2], CSs = [gen.cellSpace, gen.cellSpace2], C = GATE_CELL, ST = gen.stones || [];
    const stand = (f, c, r) => { const m = maps[f]; return !!m && r >= 0 && c >= 0 && r < H && c < W && m[r][c] !== 0 && m[r][c] !== 8 && m[r][c] !== 9; };
    // the gap between two rectangles in metres (cells' squares and stones alike, in cells)
    const gapM = (a, b) => Math.hypot(Math.max(0, a.x0 - b.x1, b.x0 - a.x1), Math.max(0, a.z0 - b.z1, b.z0 - a.z1)) * C;
    const cellR = (c, r) => ({ x0: c - .5, x1: c + .5, z0: r - .5, z1: r + .5 });
    const jump = new Map(); const link = (i, j, d) => { if (d >= 2) return; /* the proof takes no jump over 2 m, short of the 2.5 */ (jump.get(i) || jump.set(i, []).get(i)).push([j, d]); (jump.get(j) || jump.set(j, []).get(j)).push([i, d]); };
    ST.forEach((q, a) => { const f = q.floor - 1, si = 2 * N + a;
      ST.forEach((o, b) => { if (b > a && o.floor === q.floor) link(si, 2 * N + b, gapM(q, o)); });
      for (let r = Math.floor(q.z0) - 2; r <= Math.ceil(q.z1) + 2; r++) for (let c = Math.floor(q.x0) - 2; c <= Math.ceil(q.x1) + 2; c++) if (stand(f, c, r)) link(si, f * N + r * W + c, gapM(q, cellR(c, r))); });
    const prev = new Int32Array(2 * N + ST.length).fill(-2), gapAt = new Float32Array(2 * N + ST.length), q = [gen.entR * W + gen.entC]; prev[q[0]] = -1;
    const ring = gen.spaces[gen.ring], rf = (ring.floor || 1) - 1, inRing = i => { if (i >= 2 * N || ((i / N) | 0) !== rf) return false; const c = i % W, r = ((i % N) / W) | 0; return c >= ring.x && c < ring.x + ring.w && r >= ring.y && r < ring.y + ring.h; };
    let end = -1;
    while (q.length && end < 0) { const i = q.shift(); if (inRing(i)) { end = i; break; }
      const next = (jump.get(i) || []).slice();
      if (i < 2 * N) { const f = (i / N) | 0, c = i % W, r = ((i % N) / W) | 0;
        for (const [dc, dr] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) if (stand(f, c + dc, r + dr)) next.push([f * N + (r + dr) * W + c + dc, 0]);
        if (maps[1] && maps[0][r][c] === 3 && maps[1][r][c] === 3) next.push([(1 - f) * N + r * W + c, 0]); }
      for (const [j, d] of next) { if (prev[j] !== -2) continue; prev[j] = i; gapAt[j] = d; q.push(j); } }
    const path = []; for (let i = end; i >= 0; i = prev[i]) path.push(i);
    // a gap on the way: the longest jump it takes (a steady gate's way takes none)
    let gap = 0, stonesOn = 0; for (const i of path) { gap = Math.max(gap, gapAt[i]); if (i >= 2 * N) stonesOn++; }
    const cellsOn = path.filter(i => i < 2 * N);
    const spacesOn = new Set(cellsOn.map(i => CSs[(i / N) | 0][((i % N) / W) | 0][i % W]).filter(s => s >= 0)), floorsOn = new Set(cellsOn.map(i => (i / N) | 0)).size;
    out.push({ cond, size, seed, found: end >= 0, cells: path.length, metres: cellsOn.length * C + stonesOn * 2, gap: +gap.toFixed(2), stonesOn, stones: ST.length, holes: (gen.gaps || []).length, spacesOn: spacesOn.size, nSpaces: gen.spaces.length, floorsOn, floors: gen.map2 ? 2 : 1 }); }
  const roll = { steady: 0, failing: 0, catastrophic: 0 }; for (let s = 1; s <= 2000; s++) roll[gateCondRoll(s)]++;
  return { out, roll }; });
const roll = R.roll, rows = R.out;
check(`the condition by seed: half steady, a third failing, one in seven catastrophic (Michael's A, 50 / 35 / 15, ±4 in 2,000)`, Math.abs(roll.steady / 20 - 50) <= 4 && Math.abs(roll.failing / 20 - 35) <= 4 && Math.abs(roll.catastrophic / 20 - 15) <= 4, roll);
const by = c => rows.filter(r => r.cond === c), sum = (a, k) => a.reduce((s, r) => s + r[k], 0);
check('a steady gate has no gone span and no gap in its floor; a failing one has fewer stones than a broken one, and gaps', sum(by('steady'), 'stones') === 0 && sum(by('steady'), 'holes') === 0 && sum(by('failing'), 'stones') < sum(by('catastrophic'), 'stones') && sum(by('failing'), 'holes') > 0,
  { steady: [sum(by('steady'), 'stones'), sum(by('steady'), 'holes')], failing: [sum(by('failing'), 'stones'), sum(by('failing'), 'holes')], catastrophic: [sum(by('catastrophic'), 'stones'), sum(by('catastrophic'), 'holes')] });
const Rr = rows;
const MAXMIN = { tiny: 12, small: 12, medium: 25, large: 25, massive: 40 };
check(`a way on foot from the way in to the ring chamber in every gate, in all three conditions (${Rr.length})`, Rr.every(r => r.found), Rr.filter(r => !r.found).map(r => [r.cond, r.size, r.seed]));
check('nothing on it needs a skill: every jump on the way under 2.5 m (a steady gate takes none)', Rr.every(r => r.gap < 2.5) && by('steady').every(r => r.gap === 0), Rr.filter(r => r.gap >= 2.5).map(r => [r.cond, r.size, r.seed, r.gap]).concat([['widest', Math.max(...Rr.map(r => r.gap))], ['stones on the way', sum(Rr, 'stonesOn')]]));
const jog = Rr.map(r => [r.size, r.seed, r.metres, +(r.metres / 3.83 / 60).toFixed(1)]);
check('its length at a jog (3.83 m/s) is inside the size\'s time to clear (12, 25, 40 min), the fights aside', Rr.every(r => r.metres / 3.83 / 60 < MAXMIN[r.size]), jog.slice(0, 5).concat(jog.filter(j => j[0] === 'massive').slice(0, 3)));
check('it passes through spaces, not round them (at least the ring and one more)', Rr.every(r => r.spacesOn >= 2), Rr.filter(r => r.spacesOn < 2).map(r => [r.cond, r.size, r.seed, r.spacesOn, r.nSpaces]));
check('in a massive gate it goes down the stair hall to floor two, where the ring is (S1298)', Rr.every(r => r.floorsOn === r.floors), Rr.filter(r => r.floorsOn !== r.floors).map(r => [r.cond, r.size, r.seed]));
// walked: three gates built steady (the foes' bfs meets a gone span as a wall; the stones are walked below), a body 0.3 round led
// cell by cell along the game's own bfs from the way in to the ring's middle, its unlocked doors open
const Wk = [];
await page.evaluate(() => { window._condRoll = gateCondRoll; gateCondRoll = () => 'steady'; });
for (const [size, seed] of [['small', 101], ['large', 1078], ['massive', 3032]]) {
  await enterDungeon(page, { theme: 'ruins', size, seed });
  Wk.push(Object.assign({ size, seed }, await page.evaluate(() => {
    const gen = window._lastGen, ring = gen.spaces[gen.ring], tx = dAt(ring.x - .5 + ring.w / 2), tz = dAt(ring.y - .5 + ring.h / 2);
    // S1298 — in a gate of two floors, first to the stair hall's foot on floor one's map, then on floor two's to the ring
    const legs = []; const hs = gen.hall; if (hs) { const [fc, fr] = gateCellAt(hs, hs.L - 1, Math.floor(hs.A / 2)); legs.push([1, dAt(fc), dAt(fr)]); }
    legs.push([ring.floor || 1, tx, tz]);
    // S1378 — the side doors on the way are opened, as you open them (a shut door is solid to bfs); the locked treasure doors stay shut
    for (const d of DOORS) if (!d.locked) d.open = true;
    let x = px, z = pz, stuck = 0, steps = 0, cells = 0, thrOn = 0, path = [];
    for (const [f, gx0, gz0] of legs) { currentFloor = f; path = bfs(x, z, gx0, gz0); cells += path.length;
      for (const [c, r] of path) { const gx = dAt(c), gz = dAt(r);
        for (let i = 0; i < 200 && Math.hypot(gx - x, gz - z) > .15; i++) { const d = Math.hypot(gx - x, gz - z), s = Math.min(.1, d); const [nx, nz] = dSlide(x, z, (gx - x) / d * s, (gz - z) / d * s); if (Math.hypot(nx - x, nz - z) < 1e-4) { stuck++; break; } x = nx; z = nz; steps++; } }
      thrOn += gen.thresholds.filter(t => (t.floor || 1) === f && path.some(([c, r]) => c === t.c && r === t.r)).length; }
    const [lc, lr] = path[path.length - 1] || [-1, -1], inRing = lc >= ring.x && lc < ring.x + ring.w && lr >= ring.y && lr < ring.y + ring.h;
    currentFloor = 1;
    return { cells, legs: legs.length, metres: +(steps * .1).toFixed(0), stuck, at: +Math.hypot(x - dAt(lc), z - dAt(lr)).toFixed(2), inRing, thrOn }; })));
}
await page.evaluate(() => { gateCondRoll = window._condRoll; });
for (const w of Wk) console.log(JSON.stringify(w));
check('walked: a body 0.3 round reaches the ring chamber\'s middle cell along the way, through its thresholds, never stuck', Wk.every(w => w.cells > 10 && w.stuck === 0 && w.at < .2 && w.inRing && w.thrOn >= 1), Wk);
// S1327 — a broken gate's stones crossed by the loop at 1/60 (hold W, Space at each edge), and the pit: off the bridge's side, 25 m down
const seedX = await page.evaluate(() => { for (let s = 1; s < 5000; s++) if (gateCondRoll(s) === 'catastrophic' && makeGate('small', s).spaces.some(q => q.type === 'chasm')) return s; });
await enterDungeon(page, { theme: 'ruins', size: 'small', seed: seedX });
const X = await page.evaluate(() => {
  const drive = (step, max, ms = 1000 / 60) => { const raf = window.requestAnimationFrame, rr = REN.render; window.requestAnimationFrame = () => 0; REN.render = () => {};
    let t = performance.now(), n = 0; prevT = t; try { for (; n < max; n++) { if (step(n)) break; t += ms; loop(t); } } finally { window.requestAnimationFrame = raf; REN.render = rr; prevT = 0; } return n; };
  const gen = window._lastGen, ch = gen.spaces.find(s => s.type === 'chasm'), byId = id => FOOTHOLDS.find(f => f.id === id);
  const span = gen.stones.filter(q => q.space === ch.id && q.span === ch.gone[0]).map(q => byId(q.id)), ctr = f => [(f.x0 + f.x1) / 2, (f.z0 + f.z1) / 2];
  const [ax, az] = ctr(span[0]), [bx, bz] = ctr(span[span.length - 1]), L = Math.hypot(bx - ax, bz - az), ux = (bx - ax) / L, uz = (bz - az) / L;
  const sx = ax - ux * 3.5, sz = az - uz * 3.5, ex = bx + ux * 3.5, ez = bz + uz * 3.5;
  const reset = () => { for (const k in K) K[k] = false; px = sx; pz = sz; jumpY = 0; velY = 0; onGround = true; dead = false; PHP = maxHP; FALL.top = null; FALL.pend = null; ROLL = null; for (const e of ENEMIES) { e.hp = 0; e.dead = true; } };
  const res = { seed: gen.seed, cond: gen.cond, stones: span.length, foeWall: dSolid((ax + bx) / 2, (az + bz) / 2), air: dAirAt((ax + bx) / 2, (az + bz) / 2) };
  reset(); let minY = 0, jumps = 0, crossed = false;
  drive(() => { stamina = maxStamina; yaw = Math.atan2(-(ex - px), -(ez - pz)); pitch = 0; K['KeyW'] = true;
    K['Space'] = onGround && dAirAt(px + ux * .7, pz + uz * .7) && footholdY(px + ux * .7, pz + uz * .7, jumpY, -99) < jumpY - .6; if (K['Space']) jumps++;
    minY = Math.min(minY, jumpY); if (Math.hypot(px - ex, pz - ez) < .5) { crossed = true; return true; } return jumpY < -3 || dead; }, 1500);
  Object.assign(res, { crossed, jumps, minY: +minY.toFixed(2), hp: Math.round(PHP / maxHP * 100) });
  reset(); let low = 0;
  drive(() => { yaw = Math.atan2(uz, -ux); K['KeyW'] = true; low = Math.min(low, jumpY); return dead; }, 700);
  Object.assign(res, { fell: +low.toFixed(1), dead }); reset(); return res; });
console.log(JSON.stringify(X));
check('a broken gate\'s gone span: a foe meets a wall, you jump from stone to stone across it at a walk, and lose nothing', X.foeWall && X.air && X.crossed && X.jumps >= X.stones && X.minY > -1 && X.hp === 100, X);
check('off the bridge\'s side you fall the pit\'s 25 m, and it kills', X.dead && X.fell <= -24, X);
// S1358 — a gate of two floors shows its condition on floor one too (critic, s863: the Dungeon of Shadows and the Vault of the Tide read
// 0 stones and 0 gaps): a failing or broken gate's floor-one naves have their gaps, each over floor two's rock a cell round and open in
// floor one's foothold; and the loop, walked into one, keeps you on floor one down its 25 m pit, which kills
const T = await page.evaluate(() => {
  const look = gen => { const g1 = gen.gaps.filter(q => q.floor === 1), M2 = gen.map2, H = M2.length, W = M2[0].length;
    const rock = (c, y) => { for (let dy = -1; dy <= 1; dy++) for (let dc = -1; dc <= 1; dc++) { const yy = y + dy, cc = c + dc; if (yy >= 0 && cc >= 0 && yy < H && cc < W && M2[yy][cc] !== 0) return false; } return true; };
    const cells = g1.flatMap(q => q.cells);
    return { cond: gen.cond, f1: g1.length, rock: cells.every(([c, y]) => rock(c, y)), holed: cells.every(([c, y]) => (gen.stairHoles || []).some(h => c > h.x0 && c < h.x1 && y > h.z0 && y < h.z1)) }; };
  const named = { shadows: look(makeGate('large', 42, 2)), tide: look(makeGate('large', 845, 2)) };
  const massive = []; for (let k = 0; k < 20; k++) for (const cond of ['failing', 'catastrophic']) massive.push(look(makeGate('massive', 57 + k * 1231, 0, cond)));
  return { named, massive: { gates: massive.length, withGaps: massive.filter(m => m.f1 > 0).length, rock: massive.every(m => m.rock), holed: massive.every(m => m.holed) } }; });
console.log(JSON.stringify(T));
// S1365 (Michael's A on #664) — a crossing takes gaps on the nave's rule: the Vault of the Tide (catastrophic) has no nave, and its
// crossings on both floors now have them, floor one's over floor two's rock as the naves' are
const V = await page.evaluate(() => { const t = makeGate('large', 845, 2), type = q => t.spaces.find(s => s.id === q.space).type;
  return { cond: t.cond, cross: t.gaps.filter(q => type(q) === 'crossing').map(q => q.floor), others: t.gaps.filter(q => type(q) !== 'crossing').length }; });
console.log(JSON.stringify(V));
check('a crossing takes gaps on the nave\'s rule: the Vault of the Tide (catastrophic, no nave) has them on both floors\' crossings',
  V.cond === 'catastrophic' && V.cross.includes(1) && V.cross.includes(2) && T.named.tide.f1 > 0 && T.named.tide.rock && T.named.tide.holed, { V, tide: T.named.tide });
check('a gate of two floors has its gaps on floor one, the Dungeon of Shadows (failing) among them, each over floor two\'s rock and open in floor one\'s floor',
  T.named.shadows.f1 > 0 && T.named.shadows.rock && T.named.shadows.holed && T.massive.withGaps >= T.massive.gates / 2 && T.massive.rock && T.massive.holed, T);
await page.evaluate(() => { window._condRoll = gateCondRoll; gateCondRoll = () => 'failing'; });
await enterDungeon(page, { theme: 'ruins', size: 'large', seed: 42 });
const Y = await page.evaluate(() => {
  const drive = (step, max, ms = 1000 / 60) => { const raf = window.requestAnimationFrame, rr = REN.render; window.requestAnimationFrame = () => 0; REN.render = () => {};
    let t = performance.now(), n = 0; prevT = t; try { for (; n < max; n++) { if (step(n)) break; t += ms; loop(t); } } finally { window.requestAnimationFrame = raf; REN.render = rr; prevT = 0; } return n; };
  const gen = window._lastGen, gp = gen.gaps.find(q => q.floor === 1); if (!gen.map2 || !gp) return { two: !!gen.map2, gap: !!gp };
  const [gc, gr] = gp.cells[0]; let from = null;
  for (const [dc, dr] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) if (dMap[gr + dr] && dMap[gr + dr][gc + dc] === 1 && dMap[gr + 2 * dr] && dMap[gr + 2 * dr][gc + 2 * dc] === 1) { from = [dc, dr]; break; }
  if (!from) return { from: null };
  for (const k in K) K[k] = false; for (const e of ENEMIES) { e.hp = 0; e.dead = true; }
  currentFloor = 1; px = dAt(gc + 2 * from[0]); pz = dAt(gr + 2 * from[1]); jumpY = 0; velY = 0; onGround = true; dead = false; PHP = maxHP; FALL.top = null; FALL.pend = null; ROLL = null;
  const tx = dAt(gc), tz = dAt(gr), before = { floor: currentFloor, y: +jumpY.toFixed(2), air: dAirAt(tx, tz), gapOne: dGapOne(tx, tz) };
  let low = 0, floors = new Set();
  drive(() => { yaw = Math.atan2(-(tx - px), -(tz - pz)); pitch = 0; K['KeyW'] = Math.hypot(tx - px, tz - pz) > .2; low = Math.min(low, jumpY); floors.add(currentFloor); return dead; }, 900);
  for (const k in K) K[k] = false;
  return { two: true, gap: true, cond: gen.cond, before, fell: +low.toFixed(1), dead, floors: [...floors] }; });
await page.evaluate(() => { gateCondRoll = window._condRoll; });
console.log(JSON.stringify(Y));
check('in the Dungeon of Shadows, walked into a floor-one gap you stay on floor one, fall its 25 m pit, and it kills', Y.gap && Y.before.air && Y.before.gapOne && Y.dead && Y.fell <= -24 && Y.floors.length === 1 && Y.floors[0] === 1, Y);
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
