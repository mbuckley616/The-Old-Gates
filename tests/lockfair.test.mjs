// The lock's timing, by the numbers (Session 376; G's owed check from Session 142: "whether the hold window is fair, and
// whether losing a set pin on a snap is too harsh"). The feel is Michael's. This reads every town lock in Dunmore and
// Portclare (shop and home doors, strongboxes and home chests) and a spread of dungeon chests through the game's own
// `lpDifficulty`, at Finesse 0 (a new character), 5 and 10: pins, and how long the pin holds at the top. The press must
// land between 170 ms after the push (the rise) and 170 ms + the hold. Then the snap: the exact expected picks to open a
// lock of n pins for a hand that misses 1 in 10, 1 in 5 or 1 in 3, with the rule as built (a snap drops the last pin set)
// and without it.
import { boot, check } from './lib/game.mjs';
const g = await boot(); const { page } = g;
await g.intoWorld();
const locks = [];
for (const id of ['dunmore', 'portclare']) {
  await g.settle(id);
  locks.push(...await page.evaluate((id) => { const S = WORLD.settle.get(id); const out = [];
    for (const h of S.houses) { if (!(h.type === 'home' || (h.keeper && /weapon|armor|potion|misc/.test(h.type)))) continue; const d = WORLD.doorLockFor(h); const home = h.type === 'home';
      out.push({ kind: home ? 'home door' : 'shop door', lock: d }); out.push({ kind: home ? 'home chest' : 'strongbox', lock: { seed: 'box_' + h.id, minPins: d.minPins, lockBonus: home ? -1 : 0 } }); }
    return out.map(o => ({ kind: o.kind, seed: o.lock.seed, minPins: o.lock.minPins, lockBonus: o.lock.lockBonus })); }, id));
}
const res = await page.evaluate((locks) => {
  // dungeon chests: 200 spots on floors 1–3, ordinary and treasure (treasure carries a pin)
  const dun = []; for (let i = 0; i < 200; i++) { const floor = 1 + (i % 3), tr = i % 2 === 0; dun.push({ kind: tr ? 'treasure chest' : 'dungeon chest', x: 20 + (i * 37) % 180, z: 30 + (i * 53) % 170, floor, lockBonus: tr ? 1 : 0 }); }
  const all = [...locks, ...dun]; const save = ATTRS.finesse, out = {};
  for (const f of [0, 5, 10]) { ATTRS.finesse = f; out[f] = all.map(l => ({ kind: l.kind, ...lpDifficulty(l) })); }
  ATTRS.finesse = save; return { out, fin0: attrEff('finesse'), rise: LP.rise };
}, locks);
// the snap, exactly: from k pins set, a press sets one (1 − p) or snaps a pick and drops the last set pin (p)
const picks = (n, p, drop) => { // expected snaps to reach n set pins; solve E_k = p(1 + E_{k'}) + (1 − p) E_{k+1}, E_n = 0
  if (!drop) return n * p / (1 - p);
  // E_k − E_{k+1} = d_k; d_0 = p/(1−p) (from 0 a snap stays at 0); d_k = (p + p·d_{k−1}) / (1 − p)
  let d = p / (1 - p), sum = d; for (let k = 1; k < n; k++) { d = (p + p * d) / (1 - p); sum += d; } return sum; };
const kinds = {}; for (const f of [0, 5, 10]) for (const l of res.out[f]) { const K = kinds[l.kind] || (kinds[l.kind] = {}); const r = K[f] || (K[f] = { n: 0, pins: {}, lo: 1e9, hi: 0, sum: 0 }); r.n++; r.pins[l.pins] = (r.pins[l.pins] || 0) + 1; r.lo = Math.min(r.lo, l.dwell); r.hi = Math.max(r.hi, l.dwell); r.sum += l.dwell; }
console.log(`the pin rises for ${res.rise} ms, then holds; the press must land in the hold`);
for (const k in kinds) { const K = kinds[k]; console.log(`  ${k.padEnd(15)} ${String(K[0].n).padStart(3)} locks, pins ${JSON.stringify(K[0].pins)}: hold at Finesse 0 ${K[0].lo}–${K[0].hi} ms (mean ${Math.round(K[0].sum / K[0].n)}), Finesse 5 ${K[5].lo}–${K[5].hi}, Finesse 10 ${K[10].lo}–${K[10].hi}`); }
const table = []; for (const n of [2, 3, 4, 5]) for (const p of [.1, .2, 1 / 3]) table.push({ n, miss: p === 1 / 3 ? '1 in 3' : p === .2 ? '1 in 5' : '1 in 10', asBuilt: +picks(n, p, true).toFixed(2), noDrop: +picks(n, p, false).toFixed(2) });
console.log('expected picks snapped to open a lock:'); for (const t of table) console.log(`  ${t.n} pins, a hand that misses ${t.miss}: ${t.asBuilt} as built, ${t.noDrop} if a snap kept the pins`);
const f0 = res.out[0];
check('a new character has Finesse 0 here', res.fin0 === 0, res.fin0);
check('every town and dungeon lock was read at Finesse 0, 5 and 10', f0.length === res.out[5].length && f0.length > 200 && Object.keys(kinds).length >= 5, Object.keys(kinds));
// S716 — the floor is the co-op rule's 150 ms (CLAUDE.md, Michael's A on #119); it was 110, and 121 ms holds were found (the concept artist, s488)
check('the hold never falls below its 150 ms floor, and Finesse only lengthens it', f0.every((l, i) => l.dwell >= 150 && res.out[5][i].dwell >= l.dwell && res.out[10][i].dwell >= res.out[5][i].dwell), null);
check('the exact snap count matches a simulation (4 pins, 1 in 3, 200,000 locks)', (() => { let snaps = 0; const N = 200000; for (let i = 0; i < N; i++) { let k = 0; while (k < 4) { if (Math.random() < 1 / 3) { snaps++; if (k > 0) k--; } else k++; } } return Math.abs(snaps / N - picks(4, 1 / 3, true)) < .05; })(), picks(4, 1 / 3, true));
check('some locks at Finesse 0 stand on the floor, so it is the floor that holds them', f0.some(l => l.dwell === 150), Math.min(...f0.map(l => l.dwell)));
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
