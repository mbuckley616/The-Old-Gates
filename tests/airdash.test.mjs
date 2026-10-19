// Swallow's turn, the air dash at Acrobatics 100 (Session 1010; docs/design/double-jump-and-dash-build.md, its session 2).
// Q in the air while it is unspent: 3.0 m level in 0.2 s toward the held keys or straight on, the fall paused; once a
// flight, 20 stamina, none over 70% load; it stops at a wall as the walk does; a dash ending within 0.2 s of landing is
// the landing roll. The sheet's `airdash`, `airdashwall`, `airdashframes` and `airroll` in one. Driven through the game's
// own loop at fixed steps with the draw held off, and the page's clock held to the loop's (the dash reads performance.now()).
import { boot, check } from './lib/game.mjs';
const g = await boot(); const { page } = g;
await g.intoWorld();
await page.evaluate(() => {
  window._drive = (step, max, ms = 1000 / 60) => {
    const raf = window.requestAnimationFrame, rr = REN.render, pn = performance.now; window.requestAnimationFrame = () => 0; REN.render = () => {};
    let t = pn.call(performance), n = 0; prevT = t; performance.now = () => t;
    try { for (; n < max; n++) { if (step(n)) break; t += ms; loop(t); } }
    finally { window.requestAnimationFrame = raf; REN.render = rr; performance.now = pn; prevT = 0; }
    return n; };
  window._ground = () => isInterior() || (lid && lid.startsWith('dyn_')) ? footholdY(px, pz, jumpY, 0) : activeTerrainH(px, pz);
  window._reset = lv => { SKILLS.acrobatics = { lv, p: 0 }; for (const k in K) K[k] = false; PHP = maxHP; stamina = maxStamina; staminaCD = 0; ROLL = null;
    FALL.pend = null; FALL.last = null; FALL.qAt = -9; PPOST.stagUntil = 0; AIRDASH.t0 = null; AIRDASH.used = false; AIRDASH.endAt = -9; };
  // a jump, Q at the top (keys held from then on), a second Q opt.again frames later; the dash's run in x, z and y
  window._dash = (lv, opt = {}) => { _reset(lv); onGround = true; velY = 0; jumpY = _ground(); yaw = opt.yaw || 0;
    let phase = 0, prevV = 0, s0 = null, s1 = null, at = null, end = null, ys = [], again = null, frames = 0;
    _drive(i => {
      if (i === 0) { K['Space'] = true; return false; } if (i === 1) K['Space'] = false;
      if (i > 1 && onGround) return true;
      if (phase === 0 && i > 1 && prevV > 0 && velY <= 0) { for (const k of opt.keys || []) K[k] = true; s0 = stamina; at = { x: px, z: pz, y: jumpY }; startRoll(performance.now() / 1000, K); s1 = stamina; phase = 1; frames = 0; }
      else if (phase === 1) { frames++; ys.push(jumpY); if (!airDashing()) { end = { x: px, z: pz, y: jumpY, frames }; phase = 2; if (opt.again) { const x = px, z = pz, ok = startRoll(performance.now() / 1000, K); again = { ok, dashing: airDashing() }; } } }
      prevV = velY; return false;
    }, 2000, opt.ms);
    for (const k in K) K[k] = false;
    if (!at) return { noTop: true };
    const d = end ? Math.hypot(end.x - at.x, end.z - at.z) : 0;
    return { lv, used: AIRDASH.used || !!end, dist: +d.toFixed(3), dx: end ? +(end.x - at.x).toFixed(3) : null, dz: end ? +(end.z - at.z).toFixed(3) : null,
      frames: end && end.frames, level: ys.length ? +(Math.max(...ys) - Math.min(...ys)).toFixed(4) : null, cost: +(s0 - s1).toFixed(2), again, fwd: [+fwdX.toFixed(3), +fwdZ.toFixed(3)], rgt: [+rgtX.toFixed(3), +rgtZ.toFixed(3)] };
  };
});
const o = {};
o.d99 = await page.evaluate(() => _dash(99));
o.d100 = await page.evaluate(() => _dash(100, { again: true }));
o.left = await page.evaluate(() => _dash(100, { keys: ['KeyA'] }));
o.slow = await page.evaluate(() => _dash(100, { ms: 50 }));
o.heavy = await page.evaluate(() => { const t = totalCarryWeight; totalCarryWeight = () => maxCarry() * .75; try { return _dash(100); } finally { totalCarryWeight = t; } });
console.log(JSON.stringify(o));
check(`nothing at Acrobatics 99: Q in the air only buffers the roll (${o.d99.dist} m)`, o.d99.dist === 0 && o.d99.cost === 0, o.d99);
check(`at 100, straight on: ${o.d100.dist} m level (y moves ${o.d100.level}, the last frame's fall from rest) in ${o.d100.frames} frames of 1/60 (3.0 in 0.2 s), along the eye`, Math.abs(o.d100.dist - 3) < .05 && o.d100.level <= .0026 && o.d100.frames >= 11 && o.d100.frames <= 13 && Math.abs(o.d100.dx / 3 - o.d100.fwd[0]) < .02 && Math.abs(o.d100.dz / 3 - o.d100.fwd[1]) < .02, o.d100);
check(`it costs 20 stamina (${o.d100.cost}), and once a flight: a second Q dashes nothing`, o.d100.cost === 20 && o.d100.again && !o.d100.again.dashing, o.d100);
check(`toward the held keys: A held, ${o.left.dist} m to the left`, Math.abs(o.left.dist - 3) < .05 && Math.abs(o.left.dx / 3 + o.left.rgt[0]) < .02 && Math.abs(o.left.dz / 3 + o.left.rgt[1]) < .02, o.left);
check(`at 20 fps the same: ${o.slow.dist} m (60 fps ${o.d100.dist})`, Math.abs(o.slow.dist - o.d100.dist) < .05, { slow: o.slow, fast: o.d100 });
check(`carrying 75% of your weight: no dash (${o.heavy.dist} m)`, o.heavy.dist === 0 && o.heavy.cost === 0, o.heavy);

// the landing roll: a 10 m drop at Acrobatics 100, Q 0.1 s before landing (the dash), then with the dash spent (the buffered roll)
const drop = (spent) => page.evaluate(spent => { _reset(100); if (spent) AIRDASH.used = true;
  const g0 = _ground(); jumpY = g0 + 10; velY = 0; onGround = false; let pressed = false, t = 0;
  _drive(i => { t += 1 / 60;
    if (!pressed && velY < 0) { const v = -velY, h = jumpY - g0, tl = (-v + Math.sqrt(v * v + 36 * h)) / 18; if (tl <= .1) { pressed = true; startRoll(performance.now() / 1000, K); } }
    return onGround && !FALL.pend && i > 5; }, 1500);
  return { pressed, last: FALL.last, full: Math.max(1, Math.round(maxHP * .06 * ((FALL.last ? FALL.last.drop : 0) - fallFree()))), free: fallFree() }; }, spent);
const r1 = await drop(false), r2 = await drop(true);
check(`a 10 m drop, the dash 0.1 s before landing: the fall is halved (${r1.last && r1.last.dmg} of ${r1.full})`, r1.pressed && r1.last && r1.last.rolled && r1.last.dmg === Math.max(1, Math.round(r1.full / 2)), r1);
check(`the dash spent, Q 0.1 s before landing rolls and halves it as before (${r2.last && r2.last.dmg} of ${r2.full})`, r2.pressed && r2.last && r2.last.rolled && r2.last.dmg === Math.max(1, Math.round(r2.full / 2)), r2);

// a wall: in a dungeon, a floor cell with a wall on its east side, the dash eastwards from its middle
await page.evaluate(() => { const p = PORTALS.find(p => p && p.seed != null && p.zone === 'world'); px = p.x; pz = p.z + 3; goToDungeon(p); });
await page.waitForTimeout(6000); await g.hide();
const wall = await page.evaluate(() => {
  let cell = null; for (let z = 1; z < 60 && !cell; z++) for (let x = 1; x < 60 && !cell; x++) if (!dSolid(x, z) && !dSolid(x - 1, z) && !dSolid(x - 2, z) && dSolid(x + 1, z) && !dSolid(x, z - 1) && !dSolid(x, z + 1)) cell = { x, z };
  if (!cell) return { noCell: true };
  px = cell.x - 1; pz = cell.z; const r = _dash(100, { yaw: -Math.PI / 2 });
  return { cell, ...r, endX: +(px).toFixed(3), wallFace: cell.x + .5, dun: lid.startsWith('dyn_') };
});
check(`in a dungeon, a wall 1.5 m ahead: the dash stops short of it (${wall.dist} m, the wall's face at ${wall.wallFace - (wall.cell ? wall.cell.x - 1 : 0)} m)`, wall.dun && !wall.noCell && wall.dist > .8 && wall.dist < 1.5 && wall.dx > 0, wall);
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
