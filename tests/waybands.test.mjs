// Backlog G, Wayfinding (Session 138): do the direction bands a townsperson gives (*just … of here* under 14, *a short
// walk* under 55, *on across the town* under 130, *the far side of town* beyond) match the walk? The words are chosen by
// the straight line; this measures, for every townsperson and every door in two towns, the walk by the street grid
// (every one-unit cell of the town's pad that isn't solid, eight ways, no cutting a corner) and the band that walk would earn.
import { boot, check } from './lib/game.mjs';
const g = await boot(); const { page } = g;
await g.intoWorld();
const band = d => d < 14 ? 0 : d < 55 ? 1 : d < 130 ? 2 : 3;
for (const id of ['dunmore', 'portclare']) {
  await g.settle(id);
  const r = await page.evaluate((id) => { forceTime(12); const S = WORLD.settle.get(id); const cx = S.site.x, cz = S.site.z;
    const R = Math.ceil((S.site.pad || 40) + 8), N = 2 * R + 1, sol = new Uint8Array(N * N);
    for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) sol[j * N + i] = WORLD.solidAt(cx - R + i, cz - R + j) ? 1 : 0;
    const cel = p => [Math.max(0, Math.min(N - 1, Math.round(p.x - cx + R))), Math.max(0, Math.min(N - 1, Math.round(p.z - cz + R)))];
    // Dijkstra-lite: distances from one start over the grid (1 and 1.414), buckets by tenths
    const field = (a) => { const [ai, aj] = cel(a); const D = new Float32Array(N * N).fill(1e9); const s0 = aj * N + ai; D[s0] = 0; let open = [s0];
      while (open.length) { const nx = []; for (const c of open) { const ci = c % N, cj = (c - ci) / N;
        for (let dj = -1; dj <= 1; dj++) for (let di = -1; di <= 1; di++) { if (!di && !dj) continue; const ni = ci + di, nj = cj + dj; if (ni < 0 || nj < 0 || ni >= N || nj >= N) continue; const k = nj * N + ni;
          if (di && dj && (sol[cj * N + ni] || sol[nj * N + ci])) continue; const w = D[c] + (di && dj ? 1.414 : 1); if (w < D[k] - 1e-3) { D[k] = w; if (!sol[k]) nx.push(k); } } } open = nx; }
      return D; };
    const inGrid = p => Math.abs(p.x - cx) < R - 1 && Math.abs(p.z - cz) < R - 1; // one standing off the pad (a quay) is outside the grid
    const askers = [...S.npcs, ...(S.residents || []).map(x => x.n).filter(Boolean)].filter(n => n.g && n.g.visible && n.def && !n.def._lord && inGrid(n.g.position)).map(n => ({ x: n.g.position.x, z: n.g.position.z, name: n.def.name }));
    const doors = S.houses.filter(h => h.exitX != null && inGrid({ x: h.exitX, z: h.exitZ })).map(h => ({ x: h.exitX, z: h.exitZ, name: h.name }));
    const pairs = []; for (const a of askers) { const D = field(a); for (const d of doors) { const [bi, bj] = cel(d); const walk = D[bj * N + bi]; const line = Math.hypot(d.x - a.x, d.z - a.z); if (line < 1) continue; pairs.push({ a: a.name, d: d.name, line: +line.toFixed(1), walk: walk > 1e8 ? null : +walk.toFixed(1) }); } }
    return { askers: askers.length, doors: doors.length, pairs }; }, id);
  const ok = r.pairs.filter(p => p.walk != null);
  const lower = ok.filter(p => band(p.walk) > band(p.line));
  const ratio = ok.map(p => p.walk / p.line).sort((a, b) => a - b); const q = f => +ratio[Math.floor(f * (ratio.length - 1))].toFixed(2);
  const byBand = [0, 1, 2, 3].map(b => { const s = ok.filter(p => band(p.line) === b); return { said: ['just', 'short walk', 'across', 'far side'][b], n: s.length, under: s.filter(p => band(p.walk) > b).length, walkMax: s.length ? Math.max(...s.map(p => p.walk)) : 0 }; });
  const worst = [...lower].sort((a, b) => b.walk / b.line - a.walk / a.line).slice(0, 5);
  console.log(`\n${id}: ${r.askers} askers × ${r.doors} doors = ${r.pairs.length} pairs, ${r.pairs.length - ok.length} with no way by the grid`);
  console.log(`  walk ÷ straight line: median ${q(.5)}, 90% ${q(.9)}, 99% ${q(.99)}, most ${q(1)}`);
  console.log(`  by the band said: ${JSON.stringify(byBand)}`);
  console.log(`  a band too near: ${lower.length} of ${ok.length} (${(100 * lower.length / ok.length).toFixed(1)}%); worst ${JSON.stringify(worst)}`);
  const EDGE = [14, 55, 130]; const past = lower.map(p => +(p.walk - EDGE[band(p.line)]).toFixed(1));
  check(`${id}: where the walk earns a farther band than the one said, it is the next band only, and under 15 units past the edge`, lower.every(p => band(p.walk) === band(p.line) + 1) && past.every(x => x < 15), { most: Math.max(0, ...past) });
  check(`${id}: nearly every door can be walked to from where a townsperson stands`, ok.length >= .95 * r.pairs.length, { pairs: r.pairs.length, walkable: ok.length });
  check(`${id}: the walk is never shorter than the straight line`, ok.every(p => p.walk >= p.line - 1.5), ok.filter(p => p.walk < p.line - 1.5).slice(0, 3));
}
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
