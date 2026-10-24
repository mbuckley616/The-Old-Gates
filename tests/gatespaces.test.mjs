// A gate as spaces (card F5, Session 1293; Michael's B on #448, docs/design/gate-interiors-build.md, "The six spaces" and "Grids and
// counts by gate"). makeGate lays a gate's great spaces first on its 3 m grid, joined through thresholds (a slit 1 cell wide and
// 8 m high), never a corridor, with the ring chamber last; side rooms hang off one space each. Twenty seeds a size through the
// generator alone, then one gate of each lesser size built and measured with the game's own solids and roof (dSolid, dCeil).
// S1376: Cloch's toll on the Mark (gateBlock): a fallen block closes a passage on each floor and a way round of five cells is cut
// beside it; the generator's 100 gates, then a gate on the Mark built with the toll off and on.
import { boot, check } from './lib/game.mjs';
import { enterDungeon } from './lib/dungeonshot.mjs';
const g = await boot(); const { page } = g;
await g.intoWorld();
const SIZES = ['tiny', 'small', 'medium', 'large', 'massive'];
const gens = await page.evaluate((SIZES) => {
  const out = [];
  for (const size of SIZES) for (let k = 0; k < 20; k++) {
    const seed = 101 + k * 977, gen = makeGate(size, seed), W = gen.W, H = gen.H;
    // S1298 — a massive gate's two floors: each floor's map, its spaces by cell and its thresholds (the stair hall is on both)
    let joins = 0;
    for (const [map, CS, fl] of [[gen.map, gen.cellSpace, 1]].concat(gen.map2 ? [[gen.map2, gen.cellSpace2, 2]] : [])) {
    const thr = new Set(gen.thresholds.filter(t => (t.floor || 1) === fl).map(t => t.r * W + t.c));
    // the open cells that belong to no space and are no threshold, in pieces; a piece touching two spaces (or a threshold) is a
    // corridor between spaces
    const comp = new Int32Array(W * H).fill(-1);
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { if (map[y][x] === 0 || CS[y][x] >= 0 || thr.has(y * W + x) || comp[y * W + x] >= 0) continue;
      const st = [[x, y]]; comp[y * W + x] = 1; const touch = new Set();
      while (st.length) { const [c, r] = st.pop(); for (const [dc, dr] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const nc = c + dc, nr = r + dr; if (nr < 0 || nc < 0 || nr >= H || nc >= W || map[nr][nc] === 0) continue;
        const key = nr * W + nc; if (CS[nr][nc] >= 0) { touch.add(CS[nr][nc]); continue; } if (thr.has(key)) { touch.add('T'); continue; } if (comp[key] >= 0) continue; comp[key] = 1; st.push([nc, nr]); } }
      if (touch.size > 1 || touch.has('T')) joins++; }
    }
    // each threshold: one cell wide (rock either side across it), a space on each side along it, 8 m high
    const thrOk = gen.thresholds.every(t => { const f2 = t.floor === 2, map = f2 ? gen.map2 : gen.map, CS = f2 ? gen.cellSpace2 : gen.cellSpace, CA = f2 ? gen.ceilAt2 : gen.ceilAt;
      const ac = t.dr !== 0; const s1 = map[t.r + (ac ? 0 : 1)]?.[t.c + (ac ? 1 : 0)], s2 = map[t.r - (ac ? 0 : 1)]?.[t.c - (ac ? 1 : 0)];
      const a = CS[t.r - t.dr]?.[t.c - t.dc], b = CS[t.r + t.dr]?.[t.c + t.dc];
      return s1 === 0 && s2 === 0 && a === t.a && b === t.b && Math.abs(CA(t.c, t.r, t.c, t.r, 6) - 8) < 1e-6; });
    // the ring last: the farthest space from the first through the thresholds, and a dead end
    const D = gen.spaces.map(() => 1e9); D[0] = 0; const q = [0]; while (q.length) { const a = q.shift(); for (const t of gen.thresholds) { const b = t.a === a ? t.b : t.b === a ? t.a : -1; if (b >= 0 && D[b] > D[a] + 1) { D[b] = D[a] + 1; q.push(b); } } }
    const ring = gen.spaces[gen.ring], ringLinks = gen.thresholds.filter(t => t.a === gen.ring || t.b === gen.ring).length;
    const sp = gen.spaces.map(s => { const cx = s.x - .5 + s.w / 2, cz = s.y - .5 + s.h / 2, CA = s.floor === 2 ? gen.ceilAt2 : gen.ceilAt; return { type: s.type, floor: s.floor, A: Math.min(s.w, s.h), L: Math.max(s.w, s.h), top: +CA(Math.floor(cx + .5), Math.floor(cz + .5), cx, cz, 6).toFixed(2) }; });
    // S1298 — a massive gate: floor two's spaces and chapels under floor one's rock; the stair hall's head and foot by its thresholds
    let under = 0; if (gen.map2) { for (const s of gen.spaces) if (s.floor === 2) for (let y = s.y; y < s.y + s.h; y++) for (let x = s.x; x < s.x + s.w; x++) if (gen.map[y][x] !== 0) under++;
      for (const q of gen.chapels) if (q.floor === 2) for (let y = q.y; y < q.y + q.h; y++) for (let x = q.x; x < q.x + q.w; x++) if (gen.map[y][x] !== 0) under++; }
    const hs = gen.hall, hall = hs ? { flights: hs.flights, D: hs.D, L: hs.L, A: hs.A, head: gen.thresholds.filter(t => t.b === hs.id).map(t => [t.floor, gateUV(hs, t.c + t.dc, t.r + t.dr)[0]]),
      foot: gen.thresholds.filter(t => t.a === hs.id).map(t => [t.floor, gateUV(hs, t.c - t.dc, t.r - t.dr)[0]]), stair: [gen.stairC, gen.stairR], top: gen.map[gen.stairR][gen.stairC] === 3 && gen.map2[gen.stairR][gen.stairC] === 3,
      floors: gen.spaces.map(s => s.type + s.floor).join(' ') } : null;
    out.push({ size, seed, layout: gen.layout, sp, joins, thrOk, nThr: gen.thresholds.length, ringLast: gen.ring === gen.spaces.length - 1 && ringLinks === 1 && D[gen.ring] === Math.max(...D) && D[gen.ring] < 1e9,
      side: gen.side.length, sideSizes: gen.side.every(r => r.w >= 3 && r.h >= 3 && r.w <= 12 && r.h <= 12), W, floors: gen.map2 ? 2 : 1, kinds: gen.rooms.concat(gen.rooms2 || []).filter(r => r.kind === 'space').length, under, hall });
  }
  return out; }, SIZES);
const T = { tiny: [1, 1, 48, 3, 6, 1], small: [1, 1, 48, 3, 6, 1], medium: [2, 3, 64, 6, 12, 1], large: [2, 3, 64, 6, 12, 1], massive: [4, 4, 90, 12, 18, 2] };
const LAY = { tiny: ['linear'], small: ['linear'], medium: ['linear', 'hub', 'loops'], large: ['linear', 'hub', 'loops'], massive: ['linear', 'labyrinth', 'hub', 'vertical', 'loops', 'cave'] };
const NAVE = { tiny: [34, 43], small: [34, 43], medium: [43, 60], large: [43, 60], massive: [60, 84] };
const counts = gens.map(x => [x.size, x.seed, x.sp.length - 1, x.W, x.floors]);
check(`spaces by gate (${gens.length} gates): 1 and the ring tiny and small, 2 to 3 medium and large, 4 massive; grids 48, 64 and 90; a massive gate two floors`,
  gens.every(x => { const t = T[x.size], n = x.sp.length - 1; return n >= t[0] && n <= t[1] && x.W === t[2] && x.floors === t[5]; }), counts.filter(c => { const t = T[c[0]]; return c[2] < t[0] || c[2] > t[1] || c[3] !== t[2] || c[4] !== t[5]; }));
check('the layouts are drawn from the size\'s list (linear only for the small gates)', gens.every(x => LAY[x.size].includes(x.layout)), [...new Set(gens.map(x => x.size + ':' + x.layout))]);
const bad = [];
for (const x of gens) for (const s of x.sp) {
  const ok = s.type === 'nave' ? s.A === 9 && s.L >= NAVE[x.size][0] && s.L <= NAVE[x.size][1] && s.top >= 40 - .01 && s.top <= 50.01
    : s.type === 'crossing' ? s.A === 13 && s.L === 13 && Math.abs(s.top - 45) < .01
    : s.type === 'chasm' ? s.A === 14 && s.L >= 20 && s.L <= 40 && Math.abs(s.top - 30) < .01
    : s.type === 'flooded' ? s.A === 10 && s.L === 27 && Math.abs(s.top - 30) < .01
    : s.type === 'ring' ? s.A === 20 && s.L === 20 && s.top >= 30 - .01 && s.top <= 40.01
    : s.type === 'stair' ? s.A === 10 && (s.L === 18 || s.L === 25) && Math.abs(s.top - 20) < .01 : false;
  if (!ok) bad.push([x.size, x.seed, s]); }
check('every space inside the sheet\'s table: a nave 9 cells (27 m) by 34 to 84 by size, vault 40 to 50; a crossing 13 × 13, dome 45; a chasm 14 by 20 to 40, roof 30; a flooded hall 10 × 27, 30; the ring 20 × 20, 30 to 40', bad.length === 0, bad.slice(0, 6));
const types = {}; for (const x of gens) for (const s of x.sp) types[s.type] = (types[s.type] || 0) + 1;
check('all five built types turn up across the seeds (nave, crossing, chasm, flooded hall, ring)', ['nave', 'crossing', 'chasm', 'flooded', 'ring'].every(t => types[t] > 0), types);
check('no corridor joins two spaces: every piece of corridor and side room touches one space only', gens.every(x => x.joins === 0), gens.filter(x => x.joins).map(x => [x.size, x.seed, x.joins]));
check('every threshold is one cell wide in a cell of rock, a space each side of it, 8 m high', gens.every(x => x.thrOk && x.nThr >= x.sp.length - 1), gens.filter(x => !x.thrOk).map(x => [x.size, x.seed]));
check('the ring chamber is last: the farthest space from the way in, with one way into it', gens.every(x => x.ringLast), gens.filter(x => !x.ringLast).map(x => [x.size, x.seed]));
check('side rooms: 1 to the table\'s most (6, 12, 18), each 3 to 12 cells (9 to 36 m)', gens.every(x => x.side >= 1 && x.side <= T[x.size][4] && x.sideSizes), gens.map(x => [x.size, x.side]).filter(([s, n]) => n < 1 || n > T[s][4]));
check('the spaces are rooms to every system (kind \'space\'), the side rooms plain (the stair hall is neither)', gens.every(x => x.kinds === x.sp.filter(s => s.type !== 'stair').length));
// S1298 — a massive gate is two floors of spaces joined by its stair hall
const M = gens.filter(x => x.size === 'massive');
check('a massive gate: two spaces on floor one, the stair hall, one space on floor two and the ring there, last', M.every(x => x.hall && /^\w+1 \w+1 stair1 \w+2 ring2$/.test(x.hall.floors)), M.map(x => x.hall && x.hall.floors));
check('the stair hall: 10 cells wide, 2 or 3 flights of 4.2 m (18 or 25 cells long), entered at its head on floor one and left from its foot landing on floor two; its head cell open on both maps', M.every(x => { const h = x.hall;
  return h.A === 10 && (h.flights === 2 || h.flights === 3) && h.L === 4 + 7 * h.flights && Math.abs(h.D - 4.2 * h.flights) < 1e-6 && h.head.length === 1 && h.head.every(([f, u]) => f === 1 && u === 0) && h.foot.length >= 1 && h.foot.every(([f, u]) => f === 2 && u >= h.L - 4) && h.top; }), M.map(x => x.hall));
check('floor two\'s spaces and chapels lie under floor one\'s rock (their vaults rise through it), never under an open cell of floor one', M.every(x => x.under === 0), M.filter(x => x.under).map(x => [x.seed, x.under]));
// one gate of each lesser size, built: the roof, the piers, the chasm, the islands
const B = [];
for (const [size, seed] of [['small', 101], ['medium', 2055], ['large', 1078], ['massive', 3032]]) {
  await enterDungeon(page, { theme: 'ruins', size, seed });
  B.push(Object.assign({ size, seed }, await page.evaluate(() => {
    const gen = window._lastGen, k = DCELL, at = (c, r) => [dAt(c), dAt(r)];
    const corr = []; for (let r = 1; r < dR - 1 && corr.length < 20; r++) for (let c = 1; c < dC - 1 && corr.length < 20; c++) if (dMap[r][c] === 1 && gen.cellSpace[r][c] < 0 && !gen.thresholds.some(t => t.c === c && t.r === r)) corr.push(+dCeil(...at(c, r)).toFixed(2));
    const thr = gen.thresholds.map(t => { currentFloor = t.floor || 1; const h = +dCeil(...at(t.c, t.r)).toFixed(2); currentFloor = 1; return h; }); /* S1298 — each on its own floor */
    const piers = []; for (let r = 0; r < dR; r++) for (let c = 0; c < dC; c++) if (dMap[r][c] === 9) piers.push([dSolid(...at(c, r)), dSolid(dAt(c) + 1.7, dAt(r)) && dSolid(dAt(c) - 1.7, dAt(r)), !dSolid(dAt(c) + 2.3, dAt(r)) || dMap[r][c + 1] !== 1]);
    const pits = []; for (const [M, f] of [[dMap, 1], [dMap2, 2]]) { if (!M) continue; currentFloor = f; for (let r = 0; r < dR; r++) for (let c = 0; c < dC; c++) if (M[r][c] === 8) pits.push(dSolid(...at(c, r))); } currentFloor = 1;
    /* S1298 — an island or the dais on floor two stands over floor two's floor */
    const isl = FOOTHOLDS.filter(f => f.gate === 'island' || f.gate === 'dais').map(f => { const b = f.y < -1 ? FLOOR2_Y : 0; return [f.gate, +(f.x1 - f.x0).toFixed(2), +(f.y - b).toFixed(2), +(footholdY((f.x0 + f.x1) / 2, (f.z0 + f.z1) / 2, b, b) - b).toFixed(2)]; });
    const tops = gen.spaces.map(s => { const cx = (s.x - .5 + s.w / 2) * k, cz = (s.y - .5 + s.h / 2) * k; currentFloor = s.floor || 1; const h = +dCeil(cx, cz).toFixed(2); currentFloor = 1; return [s.type, h, s.top, s.floor || 1]; });
    const shell = dScene.children.find(o => o.userData && o.userData.dunShell === 'walls'); const wb = new THREE.Box3().setFromObject(shell);
    const cm = dScene.children.find(o => o.userData && o.userData.dunShell === 'ceiling'); const cb = new THREE.Box3().setFromObject(cm);
    return { corr, thr, piers: piers.length, pierOk: piers.every(p => p[0] && p[1]), pits: pits.length, pitOk: pits.every(Boolean), isl, tops, wallTop: +wb.max.y.toFixed(1), ceilTop: +cb.max.y.toFixed(1), wallLow: +Math.min(...dScene.children.filter(o => o.userData && o.userData.dunShell === 'walls').map((o, i) => new THREE.Box3().setFromObject(o).min.y - (i ? FLOOR2_Y : 0))).toFixed(1), /* S1298 — under its own floor */
      foesIn: ENEMIES.filter(e => e.floor === 1 && !e.dead).every(e => !dSolid(e.x, e.z)), clear: !dBlk(px, pz), types: gen.spaces.map(s => s.type) }; })));
}
for (const b of B) console.log(JSON.stringify(b));
check('built: a corridor\'s roof 6 m and a threshold\'s 8 (dCeil)', B.every(b => b.corr.length && b.corr.every(h => h === 6) && b.thr.every(h => h === 8)), B.map(b => [b.size, b.corr.slice(0, 3), b.thr]));
check('built: each space\'s roof at its middle is its vault\'s or dome\'s top; the ceiling\'s mesh reaches the highest, the walls to the springing (20 m and more)', B.every(b => b.tops.every(([t, h, top]) => Math.abs(h - top) < .05) && Math.abs(b.ceilTop - Math.max(...b.tops.filter(t => t[3] === 1).map(t => t[2]))) < .3 && b.wallTop >= 20), B.map(b => [b.size, b.tops, b.ceilTop, b.wallTop]));
const naves = B.filter(b => b.piers);
check('built: a nave\'s piers are solid 2 m round (4 m across), the aisle beside them open', naves.length >= 1 && naves.every(b => b.pierOk), B.map(b => [b.size, b.piers, b.pierOk]));
const ch = B.filter(b => b.pits);
check('built: a chasm\'s open air is solid to walk into and its walls go down 25 m', ch.every(b => b.pitOk && b.wallLow <= -24.9), B.map(b => [b.size, b.pits, b.pitOk, b.wallLow]));
check('built: islands and the ring\'s dais stand 0.4 (a step up), the dais 10 m across', B.every(b => b.isl.some(i => i[0] === 'dais' && Math.abs(i[1] - 10) < .05) && b.isl.every(i => Math.abs(i[2] - .4) < 1e-6 && Math.abs(i[3] - .4) < 1e-6)), B.map(b => [b.size, b.isl]));
check('built: every foe on open floor, and you start clear', B.every(b => b.foesIn && b.clear), B.map(b => [b.size, b.foesIn, b.clear]));
// S1376 — Cloch's fallen blocks: the generator's own rule over the same 100 gates, then a large gate on the Mark built twice
const BL = await page.evaluate(() => {
  const open = v => v !== 0 && v !== 8 && v !== 9, out = { floors: 0, blocked: 0, conn: 0, six: 0, round: [], same: 0 };
  const parts = (M, W, H) => { const seen = new Uint8Array(W * H); let n = 0; for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { if (!open(M[y][x]) || seen[y * W + x]) continue; n++; const q = [y * W + x]; seen[q[0]] = 1; while (q.length) { const i = q.pop(), cx = i % W, cy = (i / W) | 0; for (const [dc, dr] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const nx = cx + dc, ny = cy + dr, j = ny * W + nx; if (nx < 0 || ny < 0 || nx >= W || ny >= H || seen[j] || !open(M[ny][nx])) continue; seen[j] = 1; q.push(j); } } } return n; };
  const dist = (M, W, H, a, b) => { const D = new Int32Array(W * H).fill(-1), q = [a[1] * W + a[0]]; D[q[0]] = 0; for (let h = 0; h < q.length; h++) { const i = q[h], cx = i % W, cy = (i / W) | 0; for (const [dc, dr] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const nx = cx + dc, ny = cy + dr, j = ny * W + nx; if (nx < 0 || ny < 0 || nx >= W || ny >= H || D[j] >= 0 || !open(M[ny][nx])) continue; D[j] = D[i] + 1; q.push(j); } } return D[b[1] * W + b[0]]; };
  for (const size of ['tiny', 'small', 'medium', 'large', 'massive']) for (let k = 0; k < 20; k++) {
    const seed = 57 + k * 1231, A = makeGate(size, seed, 0, 'steady'), W = A.W, H = A.H, M0 = [A.map, A.map2].map(M => M && M.map(r => r.slice())), P0 = M0.map(M => M ? parts(M, W, H) : 0);
    const B2 = JSON.parse(JSON.stringify({ map: A.map, map2: A.map2 })), bl = gateBlock(A, seed), bl2 = gateBlock(Object.assign({}, A, B2), seed);
    out.floors += A.map2 ? 2 : 1; out.blocked += bl.length; if (JSON.stringify(bl) === JSON.stringify(bl2)) out.same++;
    for (const b of bl) { const M = b.floor === 2 ? A.map2 : A.map, m0 = M0[b.floor - 1]; if (parts(M, W, H) === P0[b.floor - 1]) out.conn++;
      let d = 0; for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (M[y][x] !== m0[y][x]) d++; if (d === 6) out.six++;
      const a = b.ew ? [b.c - 1, b.r] : [b.c, b.r - 1], c = b.ew ? [b.c + 1, b.r] : [b.c, b.r + 1]; out.round.push(dist(M, W, H, a, c)); } }
  for (let j = 0; j < GRID && !out.mark; j++) for (let i = 0; i < GRID; i++) if (isLandCell(i, j) && nationKeyOf(i, j) === 'mark') { out.mark = [(i + .5) * SIZE, (j + .5) * SIZE]; break; }
  for (let j = 0; j < GRID && !out.home; j++) for (let i = 0; i < GRID; i++) if (isLandCell(i, j) && nationKeyOf(i, j) === 'gatelands') { out.home = [(i + .5) * SIZE, (j + .5) * SIZE]; break; }
  greatGates().gates = { cloch: 'torn', tine: 'torn', uisce: 'torn' }; out.due = [clochBlockDue({ seed: 9, x: out.mark[0], z: out.mark[1] }), clochBlockDue({ seed: 9, x: out.home[0], z: out.home[1] }), nationAt(out.home[0], out.home[1])];
  greatGates().gates = { tine: 'torn', uisce: 'torn', scath: 'torn' }; out.due.push(clochBlockDue({ seed: 9, x: out.mark[0], z: out.mark[1] }));
  return out; });
console.log(JSON.stringify({ ...BL, round: [...new Set(BL.round)] }));
check('Cloch\'s blocks: a passage closed on most floors of the 100 gates (a straight corridor 3 from any room), the same from the seed every time', BL.blocked >= BL.floors * .6 && BL.same === 100, [BL.blocked, BL.floors, BL.same]);
check('Cloch\'s blocks: every floor as connected after as before, the block\'s cell rock and the five of the way round floor, nothing else changed', BL.conn === BL.blocked && BL.six === BL.blocked, [BL.conn, BL.six, BL.blocked]);
check('Cloch\'s blocks: the way round is 6 steps where the passage was 2', BL.round.every(n => n === 6), [...new Set(BL.round)]);
check('Cloch\'s blocks: due in a lesser gate on the Mark while Cloch\'s toll holds; not in the Gatelands, not with Cloch whole', BL.due[0] && !BL.due[1] && !BL.due[3], BL.due);
const fallSeed = 4242, built = {};
for (const on of [false, true]) {
  await page.evaluate((on) => { greatGates().gates = on ? { cloch: 'torn', tine: 'torn', uisce: 'torn' } : {}; }, on);
  await enterDungeon(page, { theme: 'ruins', size: 'large', seed: fallSeed, x: BL.mark[0] + (on ? 1 : 0), z: BL.mark[1] });
  built[on] = await page.evaluate(() => { const falls = dScene.children.filter(o => o.userData && o.userData.fall), b = falls[0] && falls[0].userData.fall;
    return { foes: ENEMIES.map(e => e.id + ':' + e.name + ':' + (+e.homeX).toFixed(2) + ':' + (+e.homeZ).toFixed(2)).join(','), chests: CHESTS.map(c => c.floor + ':' + c.x + ':' + c.z).join(','),
      falls: falls.length, tris: falls.map(m => m.geometry.index.count / 3), solid: b ? dSolid(dAt(b.c), dAt(b.r)) : null, way: b ? b.way.every(([c, r]) => !dSolid(dAt(c), dAt(r))) : null,
      near: b ? Math.hypot(falls[0].position.x - dAt(b.c), falls[0].position.z - dAt(b.r)) : null }; }); }
console.log(JSON.stringify({ off: { falls: built[false].falls }, on: { ...built[true], foes: undefined, chests: undefined } }));
check('Cloch\'s blocks built: none with the toll off; with it on a fall drawn at each block (one mesh), its cell solid and the way round open', built[false].falls === 0 && built[true].falls >= 1 && built[true].solid === true && built[true].way === true && built[true].near < .01, [built[false].falls, built[true].falls, built[true].tris, built[true].solid, built[true].way]);
{ const fo = built[false].foes.split(','), fn = built[true].foes.split(','), co = built[false].chests.split(','), cn = built[true].chests.split(',');
  check('Cloch\'s blocks built: every foe (id, kind and spawn) and every chest where it stood without them (a foe\'s and a chest\'s id is its index)', built[false].foes === built[true].foes && built[false].chests === built[true].chests,
    { foes: [fo.length, fn.length, fo.filter((f, i) => f !== fn[i]).slice(0, 3), fn.filter((f, i) => f !== fo[i]).slice(0, 3)], chests: [co.length, cn.length, co.filter((c, i) => c !== cn[i]).slice(0, 3)] }); }
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
