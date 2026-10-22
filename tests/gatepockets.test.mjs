// A gate's fights in pockets (card F5, the build sheet's session 3, Session 1323; docs/design/gate-interiors-build.md, "Pockets and
// the leash" and "The suites"). The generator's pockets, twenty seeds a size: 25 to 42 m apart along each space, an end never more
// than 25 m from one, radii 7.5 to 15 m that never overlap. Then five gates built: the size's foes across the gate, seven in ten in
// pockets of 2 to 4, each inside its pocket. Then the medium gate driven by the game's own loop at fixed 1/60 ticks: a foe that wakes
// wakes its pocket and not the next; an archer of a pocket sees 20 m where a sword sees 8; a foe drawn past its pocket's radius and
// 10 m gives up and walks home, keeping its wounds.
import { boot, check } from './lib/game.mjs';
import { enterDungeon } from './lib/dungeonshot.mjs';
const g = await boot(); const { page } = g;
await g.intoWorld();
const R = await page.evaluate(() => {
  const out = [];
  for (const size of ['tiny', 'small', 'medium', 'large', 'massive']) for (let k = 0; k < 20; k++) {
    const seed = 57 + k * 1231, gen = makeGate(size, seed);
    for (const fl of gen.map2 ? [1, 2] : [1]) {
      const P = gatePocketSites(gen, fl);
      for (const sp of gen.spaces) { if (sp.type === 'stair' || (sp.floor || 1) !== fl) continue;
        const mine = P.filter(p => p.sp === sp.id).sort((a, b) => a.u - b.u), Lm = sp.L * GATE_CELL;
        const gaps = []; for (let i = 1; i < mine.length; i++) gaps.push((mine[i].u - mine[i - 1].u) * GATE_CELL);
        const ends = mine.length ? [mine[0].u * GATE_CELL, (sp.L - mine[mine.length - 1].u) * GATE_CELL] : [Lm];
        let overlap = 0; for (let i = 0; i < mine.length; i++) for (let j = i + 1; j < mine.length; j++)
          if (Math.hypot(mine[i].c - mine[j].c, mine[i].r - mine[j].r) < mine[i].rad + mine[j].rad - .01) overlap++;
        out.push({ size, seed, fl, type: sp.type, n: mine.length, Lm, gaps, ends, rads: mine.map(p => p.rad * GATE_CELL), overlap }); } } }
  return out; });
const fmt = r => [r.size, r.seed, r.type, r.Lm, r.gaps.map(x => +x.toFixed(1)), r.ends.map(x => +x.toFixed(1))];
check(`every space of every gate holds a pocket (${R.length} spaces in 100 gates)`, R.every(r => r.n >= 1), R.filter(r => r.n < 1).map(fmt));
check('pockets along a space are 25 to 42 m apart (two never wake as one)', R.every(r => r.gaps.every(x => x >= 24.9 && x <= 42.1)), R.filter(r => !r.gaps.every(x => x >= 24.9 && x <= 42.1)).map(fmt));
check('each end of a space is within 25 m of a pocket (no stretch of the way runs 50 m without one)', R.every(r => r.ends.every(x => x <= 25.1)), R.filter(r => !r.ends.every(x => x <= 25.1)).map(fmt));
check('a pocket\'s radius is 7.5 to 15 m, and no two overlap', R.every(r => r.overlap === 0 && r.rads.every(x => x >= 7.49 && x <= 15.01)), R.filter(r => r.overlap || !r.rads.every(x => x >= 7.49 && x <= 15.01)).map(r => [r.size, r.seed, r.type, r.rads, r.overlap]));
// built: the foes by pocket
const B = [];
for (const [size, seed] of [['tiny', 101], ['small', 2034], ['medium', 4021], ['large', 1078], ['massive', 3032]]) {
  await enterDungeon(page, { theme: 'ruins', size, seed });
  B.push(Object.assign({ size, seed }, await page.evaluate(() => {
    const live = ENEMIES.filter(e => !e.dead), inP = live.filter(e => e.pocket), by = {};
    for (const e of inP) (by[e.pocket.id] = by[e.pocket.id] || []).push(e);
    const off = inP.filter(e => Math.hypot(e.x - e.pocket.x, e.z - e.pocket.z) > e.pocket.r + .01).length;
    return { en: window._lastGen.cfg.en, foes: live.length, inP: inP.length, sizes: Object.values(by).map(a => a.length), off,
      floors: [...new Set(live.map(e => e.floor))].sort(), rads: [...new Set(inP.map(e => +e.pocket.r.toFixed(1)))] }; })));
}
for (const b of B) console.log(JSON.stringify(b));
check('a gate holds its size\'s foes across the gate (5, 9, 14, 20; a massive gate\'s 30 on its two floors, not 30 a floor)', B.every(b => b.foes === b.en), B.map(b => [b.size, b.foes, b.en]));
check('seven in ten stand in pockets (60 to 80%)', B.every(b => b.inP / b.foes >= .6 && b.inP / b.foes <= .8), B.map(b => [b.size, b.inP, b.foes]));
check('2 to 4 a pocket, each foe inside its pocket', B.every(b => b.sizes.every(n => n >= 2 && n <= 4) && b.off === 0), B.map(b => [b.size, b.sizes, b.off]));
// driven: the medium gate
await enterDungeon(page, { theme: 'ruins', size: 'medium', seed: 4021 });
await page.evaluate(() => { window._drive = (step, max) => {
  const raf = window.requestAnimationFrame, rr = REN.render; window.requestAnimationFrame = () => 0; REN.render = () => {};
  let t = performance.now(), n = 0;
  try { for (; n < max; n++) { if (step(n)) break; t += 1000 / 60; loop(t); } }
  finally { window.requestAnimationFrame = raf; REN.render = rr; prevT = 0; }
  return n; }; });
const D = await page.evaluate(() => {
  const live = ENEMIES.filter(e => !e.dead && !e.disguised && !e.dormant && e.floor === 1), by = {};
  for (const e of live) if (e.pocket) (by[e.pocket.id] = by[e.pocket.id] || []).push(e);
  const ids = Object.keys(by).filter(id => by[id].length >= 2);
  const park = keep => ENEMIES.forEach(x => { if (!keep.includes(x) && !x.dead) { x.dead = true; x._tmp = true; } });
  const unpark = () => ENEMIES.forEach(x => { if (x._tmp) { x.dead = false; x._tmp = false; } });
  const calm = () => { for (const e of ENEMIES) { e.alert = false; e._pkAwake = false; e._homing = false; e.hasCried = true; e.path = []; e.pathT = 0; } };
  const me = (x, z) => { px = x; pz = z; jumpY = 0; currentFloor = 1; PHP = 9999; dead = false; ROLL = null; blocking = false; _sneaking = false; staggered.length = 0; };
  const open = (x, z) => !dSolid(x, z);
  const out = {};
  // 1. a foe struck wakes its pocket in one tick; the next pocket's foe sleeps on
  { const A = by[ids[0]], other = live.find(e => e.pocket && e.pocket.id !== ids[0]); calm(); park(A.concat(other ? [other] : []));
    // you stand where the struck foe still has you (under 14 m) and no other is near enough to see or hear you (over 9 m)
    let spot = null; for (let r = 0; r < dR && !spot; r++) for (let c = 0; c < dC && !spot; c++) { const x = dAt(c), z = dAt(r);
      if (open(x, z) && Math.hypot(x - A[0].x, z - A[0].z) < 13 && A.slice(1).concat(other ? [other] : []).every(o => Math.hypot(x - o.x, z - o.z) > 9)) spot = [x, z]; }
    me(spot[0], spot[1]); A[0].alert = true;
    _drive(n => n >= 2, 2); out.wake = { pocket: A.length, awake: A.filter(e => e.alert).length, other: other ? other.alert : null, otherD: other ? +Math.hypot(other.x - A[0].x, other.z - A[0].z).toFixed(1) : null };
    unpark(); calm(); }
  // 2. an archer of a pocket sees you at 15 m straight ahead; the same foe as a sword does not
  { const look = []; for (const e of live.filter(e => e.pocket)) for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      let ok = true; for (let s = 0; s <= 15.5; s += .5) if (!open(e.x + dx * s, e.z + dz * s)) { ok = false; break; } if (ok) { look.push([e, dx, dz]); break; } }
    out.archer = [];
    for (const [e, dx, dz] of look.slice(0, 2)) for (const ranged of [true, false]) { const r0 = e.ranged, x0 = e.x, z0 = e.z; calm(); park([e]);
      e.ranged = ranged; e.patrolType = 'scan'; me(e.x + dx * 15, e.z + dz * 15); let seen = null;
      _drive(n => { e.x = x0; e.z = z0; e.scanT = 0; e.patrolPhase = Math.atan2(dx, dz); e.combatYaw = e.patrolPhase; if (e.alert) { seen = n; return true; } return false; }, 30);
      out.archer.push({ name: e.name, ranged, seen }); e.ranged = r0; e.x = x0; e.z = z0; unpark(); calm(); } }
  // 3. drawn past the leash it walks home, keeping its wounds
  { const e = live.find(e => e.pocket), P = e.pocket; let spot = null;
    for (let r = 0; r < dR && !spot; r++) for (let c = 0; c < dC && !spot; c++) { const x = dAt(c), z = dAt(r), d = Math.hypot(x - P.x, z - P.z);
      if (d > P.r + 11 && d < P.r + 15 && open(x, z) && bfs(x, z, e.homeX, e.homeZ).length) spot = [x, z]; }
    calm(); park([e]); const hx = e.homeX, hz = e.homeZ; e.hp = e.maxHp - 7; const hp0 = e.hp;
    e.x = spot[0]; e.z = spot[1]; me(spot[0] + .9, spot[1]); e.alert = true;
    _drive(n => n >= 2, 2); const gaveUp = !e.alert && !!e._homing;
    me(dAt(dEntranceX), dAt(dEntranceZ));
    let home = null; const from = +Math.hypot(e.x - hx, e.z - hz).toFixed(1);
    _drive(n => { if (!e._homing) { home = +(n / 60).toFixed(1); return true; } return false; }, 60 * 60);
    out.leash = { name: e.name, r: +P.r.toFixed(1), from, gaveUp, home, off: +Math.hypot(e.x - hx, e.z - hz).toFixed(2), hp: [hp0, e.hp], homing: e._homing };
    unpark(); calm(); }
  return out; });
console.log(JSON.stringify(D));
check('a foe that wakes wakes its whole pocket within two ticks', D.wake.pocket >= 2 && D.wake.awake === D.wake.pocket, D.wake);
check('and not the next pocket\'s', D.wake.other === false, D.wake);
check('an archer of a pocket sees you 15 m ahead; the same foe with a sword (sight 8) does not', D.archer.length >= 1 && D.archer.every(a => a.ranged ? a.seen != null : a.seen == null), D.archer);
check('a foe drawn past its pocket\'s radius + 10 m gives up within two ticks', D.leash.gaveUp, D.leash);
check('and walks home within a minute, keeping its wounds', D.leash.home != null && D.leash.off < .8 && D.leash.hp[0] === D.leash.hp[1] && !D.leash.homing, D.leash);
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
