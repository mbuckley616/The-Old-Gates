// F2b, the body in the world: the step (Session 1070; docs/design/scale-numbers-build.md, *Movement*). STEP_UP is 0.40 m at true
// scale, so you walk up a stair's rise and over a bench's 0.39, but a chair's or a chest's 0.45, a bed's and a table's 0.68 stop
// you; a jump (apex 0.84) puts you on the table. Measured on a Dunmore cottage and its inn by the rules (intSolidAt, footholdY),
// then walked through the game's own loop at fixed steps, the draw held off.
import { boot, check } from './lib/game.mjs';
const g = await boot(); const { page } = g;
await g.intoWorld();
await page.evaluate(() => {
  window._drive = (step, max, ms = 1000 / 60) => {
    const raf = window.requestAnimationFrame, rr = REN.render; window.requestAnimationFrame = () => 0; REN.render = () => {};
    let t = performance.now(), n = 0; prevT = t;
    try { for (; n < max; n++) { if (step(n)) break; t += ms; loop(t); } }
    finally { window.requestAnimationFrame = raf; REN.render = rr; prevT = 0; }
    return n; };
  // walk from (x, z) toward (tx, tz) for up to 2 s; jump at the start if asked. Returns where you stopped and at what height.
  window._walk = (x, z, tx, tz, jump) => {
    for (const k in K) K[k] = false; px = x; pz = z; jumpY = footholdY(px, pz, 0, 0); velY = 0; onGround = true; stamina = maxStamina; ROLL = null;
    yaw = Math.atan2(-(tx - x), -(tz - z)); pitch = 0; let top = 0;
    _drive(i => { K['KeyW'] = Math.hypot(tx - px, tz - pz) > .05; K['Space'] = !!jump && i < 2; top = Math.max(top, jumpY);
      return i > 20 && !K['KeyW'] && onGround; }, 120);
    for (const k in K) K[k] = false; for (let i = 0; i < 40 && !onGround; i++) _drive(() => false, 1);
    return { x: +px.toFixed(3), z: +pz.toFixed(3), y: +jumpY.toFixed(3), top: +top.toFixed(3), left: +Math.hypot(tx - px, tz - pz).toFixed(3) }; };
});
await g.settle('dunmore');
async function room(type) {
  await page.evaluate((type) => { const S = WORLD.settle.get('dunmore'); const h = S.houses.find(x => x.type === type && (type === 'inn' || !x.two));
    forceTime(13); px = h.exitX; pz = h.exitZ; goToInterior(h); }, type);
  await page.waitForTimeout(4000); await g.hide();
}
await room('home');
const r = await page.evaluate(() => {
  const near = (y, w) => INT_SOL.filter(s => s.y1 != null && Math.abs(s.y1 - y) < .02 && (!w || w(s))).sort((a, b) => (b.x1 - b.x0) * (b.z1 - b.z0) - (a.x1 - a.x0) * (a.z1 - a.z0));
  const bed = near(.448, s => (s.x1 - s.x0) * (s.z1 - s.z0) > 2)[0], chest = near(.448, s => (s.x1 - s.x0) * (s.z1 - s.z0) < 1)[0];
  const table = INT_SOL.filter(s => s.y1 != null && s.y1 > .6 && s.y1 < .8).sort((a, b) => (b.x1 - b.x0) * (b.z1 - b.z0) - (a.x1 - a.x0) * (a.z1 - a.z0))[0];
  const mid = s => s && [(s.x0 + s.x1) / 2, (s.z0 + s.z1) / 2];
  const at = (s, y) => s ? intSolidAt(...mid(s), .3, y) : null;
  // a clear spot 0.9 m out from a box's long side, toward the room's middle
  const W = currentHouse.intW, D = currentHouse.intD;
  const from = s => { const [cx, cz] = mid(s), out = []; for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const x = dx ? (dx > 0 ? s.x1 + .9 : s.x0 - .9) : cx, z = dz ? (dz > 0 ? s.z1 + .9 : s.z0 - .9) : cz;
      if (x > .4 && x < W - .4 && z > .4 && z < D - .4 && !intSolidAt(x, z, .3, 0)) out.push({ x, z, d: Math.hypot(x - W / 2, z - D / 2) }); } out.sort((a, b) => a.d - b.d); return out[0] || null; };
  const res = { step: STEP_UP, bed: bed && +bed.y1.toFixed(3), chest: chest && +chest.y1.toFixed(3), table: table && +table.y1.toFixed(3),
    blocks: { bed: at(bed, 0), chest: at(chest, 0), table: at(table, 0) }, overAt: { bed: at(bed, .1), table: at(table, .3) } };
  const fb = bed && from(bed), ft = table && from(table);
  res.walkBed = fb && { ..._walk(fb.x, fb.z, ...mid(bed), false), box: [bed.x0, bed.x1, bed.z0, bed.z1].map(v => +v.toFixed(2)) };
  res.walkTable = ft && _walk(ft.x, ft.z, ...mid(table), false);
  res.jumpTable = ft && _walk(ft.x, ft.z, ...mid(table), true);
  return res; });
console.log(JSON.stringify(r));
check(`STEP_UP is 0.40 (it was 0.62)`, r.step === .4, r.step);
check(`a bed (${r.bed}), a chest (${r.chest}) and a table (${r.table}) stand in the cottage, and each stops you at the floor`, r.bed > .4 && r.chest > .4 && r.table > .6 && r.blocks.bed && r.blocks.chest && r.blocks.table, r);
check('walked at, the bed stops you at its edge: your feet stay on the floor, outside it', !!r.walkBed && r.walkBed.y < .01 && r.walkBed.left > .3, r.walkBed);
check('walked at, the table stops you too', !!r.walkTable && r.walkTable.y < .01 && r.walkTable.left > .3, r.walkTable);
check(`a running jump puts you on the table (the apex ${r.jumpTable && r.jumpTable.top} over the floor; you stand at ${r.jumpTable && r.jumpTable.y})`, !!r.jumpTable && Math.abs(r.jumpTable.y - r.table) < .01, r.jumpTable);

// the inn: its stair is walked, and a bench is stepped onto
await page.evaluate(() => exitInterior()); await page.waitForTimeout(2500);
await room('inn');
const inn = await page.evaluate(() => {
  const f = FOOTHOLDS.find(f => f.axis); if (!f) return { none: true };
  const along = f.axis === 'x' ? 'x' : 'z', a0 = f[along + '0'], a1 = f[along + '1'], up = f.y1 > f.y0 ? 1 : -1, c = f.axis === 'x' ? (f.z0 + f.z1) / 2 : (f.x0 + f.x1) / 2;
  // up the flight from its foot, 5 cm a sample, each time from where you stand: the largest rise between samples
  let y = Math.min(f.y0, f.y1), worst = 0, n = 0; const start = up > 0 ? a0 : a1, end = up > 0 ? a1 : a0;
  for (let a = start; up > 0 ? a <= end : a >= end; a += .05 * up) { const [x, z] = f.axis === 'x' ? [a, c] : [c, a]; const ny = footholdY(x, z, y, 0); worst = Math.max(worst, ny - y); y = ny; n++; }
  const bench = FOOTHOLDS.filter(q => !q.axis && q.kind !== 'spiral' && q.y > .3 && q.y < .4)[0];
  const onBench = bench ? footholdY((bench.x0 + bench.x1) / 2, (bench.z0 + bench.z1) / 2, 0, 0) : null;
  return { top: +Math.max(f.y0, f.y1).toFixed(3), reached: +y.toFixed(3), worst: +worst.toFixed(3), n, bench: bench && +bench.y.toFixed(3), onBench: onBench && +onBench.toFixed(3) }; });
console.log(JSON.stringify(inn));
check(`the inn's stair is climbed to its top (${inn.reached} of ${inn.top} m), no rise between 5 cm steps over ${inn.worst}`, !inn.none && Math.abs(inn.reached - inn.top) < .01 && inn.worst < .4, inn);
check(`a bench's seat (${inn.bench} m) is still a step: you stand on it from the floor`, inn.bench != null && inn.onBench === inn.bench, inn);
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
