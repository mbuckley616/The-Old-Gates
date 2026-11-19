// Spells as keys, and secrets: the seals (Session 2402; Michael's B on #1678, docs/design/spells-as-keys-build.md, session 1). A gate's
// seals are laid on its own stream after its braziers, webs and pools: one a gate, two in a massive gate, the gate's own school first,
// each in a side room with one mouth and no web or pool, never where closing it cuts off anything you could reach. 40 gates of every
// size built twice, pure; then a real gate with a shut seal walked into, its mouth rock until openSecret opens it for good.
// (gatesave holds a seal opened across a save and a reload.)
import { boot, check } from './lib/game.mjs';
const g = await boot(); const { page } = g;
await g.intoWorld();
const pure = await page.evaluate(() => { const out = { rows: [], bad: [] };
  const sizes = ['tiny', 'small', 'medium', 'large', 'massive'];
  // an independent walk: with every seal's room and mouth shut, the entry still reaches floor one's stair (or the ring), and floor
  // two's stair hall still reaches the ring
  const walk = (gen, fl, from, to, shut) => { const M = fl === 2 ? gen.map2 : gen.map, W = gen.W, H = gen.H, seen = new Set(), q = [];
    const ok = (c, y) => y >= 0 && c >= 0 && y < H && c < W && M[y][c] > 0 && !shut.has(fl + ':' + (y * W + c));
    for (const [c, y] of from) if (ok(c, y)) { seen.add(y * W + c); q.push([c, y]); }
    for (let i = 0; i < q.length; i++) { const [c, y] = q[i]; if (to(c, y)) return true;
      for (const [a, b] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const nc = c + a, ny = y + b, k = ny * W + nc; if (!ok(nc, ny) || seen.has(k)) continue; seen.add(k); q.push([nc, ny]); } }
    return false; };
  for (let i = 0; i < 40; i++) { const size = sizes[i % 5], seed = 1000 + i * 7919, school = SECRET_SCHOOLS[i % 6];
    const one = () => { const gen = makeGate(size, seed); gateThings(gen, seed); gateSecrets(gen, seed, size, school); return gen; };
    const a = one(), b = one(), key = s => JSON.stringify(s.map(q => [q.id, q.school, q.floor, q.c, q.r, q.room]));
    const S = a.secrets, shut = new Set(); S.forEach(q => q.cells.forEach(k => shut.add(q.floor + ':' + k)));
    const ring = a.spaces[a.ring], rf = ring.floor || 1, d = ring.dais, rc = d ? Math.round((d.x0 + d.x1) / 2) : ring.x, rr = d ? Math.round((d.z0 + d.z1) / 2) : ring.y;
    const atRing = (c, y) => Math.abs(c - rc) <= 1 && Math.abs(y - rr) <= 1;
    let path;
    if (rf === 1) path = walk(a, 1, [[a.entC, a.entR]], atRing, shut);
    else { const hid = a.hall.id, hall2 = []; for (let y = 0; y < a.H; y++) for (let c = 0; c < a.W; c++) if (a.cellSpace2[y][c] === hid) hall2.push([c, y]);
      path = walk(a, 1, [[a.entC, a.entR]], (c, y) => a.cellSpace[y][c] === hid, shut) && walk(a, 2, hall2, atRing, shut); }
    const things = new Set((a.things || []).filter(t => t.room).map(t => t.floor + ':' + t.room.x + ',' + t.room.y));
    const row = { size, seed, n: S.length, max: SECRET_SEAL_N[size], same: key(S) === key(b.secrets), first: S[0] ? S[0].school : null, school,
      ids: S.every((q, k) => q.id === seed + ':' + q.floor + ':secret' + k), path, free: S.every(q => !things.has(q.floor + ':' + q.room.x + ',' + q.room.y)),
      two: S.length < 2 || S[1].school !== S[0].school };
    out.rows.push(row); if (!(row.same && row.n <= row.max && (!row.n || row.first === school) && row.ids && row.path && row.free && row.two)) out.bad.push(row); }
  return out; });
const R = pure.rows, full = R.filter(r => r.n === r.max).length, none = R.filter(r => !r.n).length;
console.log('pure', JSON.stringify(R.map(r => r.size[0] + r.n + (r.first || '-'))), 'bad', JSON.stringify(pure.bad));
check(`40 gates built twice lay the same seals, ids <seed>:<floor>:secret<n> (${R.filter(r => r.same && r.ids).length} of 40)`, R.every(r => r.same && r.ids), pure.bad);
check(`the table's count or fewer: one a gate, two in a massive one (${full} full, ${none} with none)`, R.every(r => r.n <= r.max) && full >= 30, R.map(r => r.size + ' ' + r.n));
check(`the first seal is the gate's own school, a massive gate's second another (${R.filter(r => r.n && r.first === r.school && r.two).length} of ${R.filter(r => r.n).length})`, R.every(r => !r.n || (r.first === r.school && r.two)), pure.bad);
check(`no seal takes a web's or a pool's room, and with every seal shut the entry still reaches the ring (${R.filter(r => r.path && r.free).length} of 40)`, R.every(r => r.path && r.free), pure.bad);

// a real gate of the world with a shut seal (the stone leaf, the fallen block or the dark wall), walked into
const pick = await page.evaluate(() => { for (const p of PORTALS) { if (!p || p.seed == null || p.zone !== 'world' || p.lair || p.tutorial) continue;
    let gen; try { const w = WORLD_DUNGEONS.find(e => e.seed === p.seed) || {}; gen = makeGate(p.size, p.seed, w.floors, w.cond); if (clochBlockDue(p)) gateBlock(gen, p.seed); gateThings(gen, p.seed); gateSecrets(gen, p.seed, p.size, gateOrbSchool(p)); } catch (e) { continue; }
    const s = gen.secrets.find(q => SECRET_SEAL_SHUT[q.school]); if (s) { window._sealP = p; return { seed: p.seed, size: p.size, id: s.id, school: s.school }; } }
  return null; });
console.log('pick', JSON.stringify(pick));
check('a gate of the world has a shut seal', !!pick, pick);
if (pick) {
  await page.evaluate(() => { const p = window._sealP; px = p.x; pz = p.z + 3; goToDungeon(p); });
  await page.waitForFunction((s) => String(lid).startsWith('dyn_') && currentPortal && currentPortal.seed === s && document.getElementById('fd').style.opacity === '0', pick.seed, { timeout: 120000, polling: 200 });
  await g.hide();
  const run = await page.evaluate((id) => { const q = GATE_SECRETS.find(s => s.id === id); if (!q) return { found: false, list: GATE_SECRETS.map(s => s.id) };
    const S = q.solid, cx = (S.x0 + S.x1) / 2, cz = (S.z0 + S.z1) / 2, fl0 = currentFloor; currentFloor = q.floor;
    const shut = dSolid(cx, cz), first = openSecret(id), open = !dSolid(cx, cz), again = openSecret(id); currentFloor = fl0;
    const R = worldState.gateSecrets && worldState.gateSecrets[currentPortal.seed];
    return { found: true, shut, first, open, again, shown: q.shut.visible, rec: R && R.o.slice(), n: q.n }; }, pick.id);
  console.log('run', JSON.stringify(run));
  check(`in the gate its mouth is rock until opened (${pick.school}, ${pick.id})`, run.found && run.shut, run);
  check('openSecret opens it for good: the rock gone, kept in the world\'s record, and a second call does nothing', run.first && run.open && !run.again && !run.shown && JSON.stringify(run.rec) === JSON.stringify([run.n]), run);
}
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
