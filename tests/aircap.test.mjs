// The air-speed cap (Session 1027; Michael's A on DECISION #370, docs/design/double-jump-and-dash-build.md, *Three rules
// the two need*): in the air nobody crosses the ground faster than 4.7 m/s, the sprint of untrained legs, so a gap's length
// is the jump's and Acrobatics' alone. The sheet's `aircap` row: Athletics 100, Swiftness 40 and Haste, sprinting off a
// ledge, holds 4.7 ±0.05 in the air and 6.2 on the ground; the gaps are 2.87, 3.44, 4.85 and 4.98 m, never over 5.9.
// Driven through the game's own loop at fixed steps, the draw held off. The ground is held flat at the start's height for
// the measure (the sheet's figures land level with the take-off), and nothing on it is solid.
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
  const H0 = activeTerrainH(px, pz), _ath = activeTerrainH, _sol = currentZoneSolid;
  window._flat = (on) => { if (on) { activeTerrainH = () => H0; currentZoneSolid = () => false; } else { activeTerrainH = _ath; currentZoneSolid = _sol; } };
  // one run: o.ath, o.acro, o.swift set the skills and Swiftness; o.haste; o.sprint holds Shift; o.step presses Space again
  // at the top. Ten frames on the ground, then Space. Returns the speed on the ground, the fastest frame in the air, and the
  // gap (o.ms the frame's length): the distance from the take-off to where the flight comes back to the take-off's height.
  window._run = (o) => {
    _flat(true);
    SKILLS.athletics = { lv: o.ath || 5, p: 0 }; SKILLS.acrobatics = { lv: o.acro || 5, p: 0 }; ATTRS.swiftness = o.swift || 0;
    SPELL_FX.haste = o.haste ? performance.now() + 1e7 : 0; SPELL_FX.levitate = 0;
    for (const k in K) K[k] = false; ROLL = null; FALL.pend = null; FALL.last = null; PPOST.stagUntil = 0; AIRSTEP.used = false;
    onGround = true; velY = 0; jumpY = activeTerrainH(px, pz); yaw = 0.7; pitch = 0;
    let groundV = 0, airMax = 0, x0 = null, z0 = null, gap = null, prev = null, stepped = false, pressedStep = false;
    const dt = (o.ms || 1000 / 60) / 1000, n0 = o.ms ? 4 : 10;
    _drive(i => {
      stamina = maxStamina; staminaCD = 0; PHP = maxHP;
      K['KeyW'] = true; K['ShiftLeft'] = !!o.sprint;
      if (prev) {
        const d = Math.hypot(px - prev.x, pz - prev.z) / dt;
        if (i > 1 && i < n0 && onGround) groundV = d;
        if (x0 != null && !prev.ground && i > n0 + 1) airMax = Math.max(airMax, d);
        if (x0 != null && !prev.ground && i > n0 + 1 && onGround) {
          // the flight came down this frame: where it crossed the take-off's height, from the frame before's height and rise
          const y = prev.y - H0, v = prev.v, s = (v + Math.sqrt(v * v + 2 * 18 * y)) / 18;
          gap = Math.hypot(prev.x - x0, prev.z - z0) + Math.min(dt, s) * Math.hypot(px - prev.x, pz - prev.z) / dt;
          return true;
        }
      }
      if (i === n0) { x0 = px; z0 = pz; K['Space'] = true; }
      if (i === n0 + 1) K['Space'] = false;
      if (o.step && i > n0 + 1 && !pressedStep && velY <= 18 * dt / 2) { K['Space'] = true; pressedStep = true; }
      else if (pressedStep) { K['Space'] = false; stepped = stepped || AIRSTEP.used; }
      prev = { x: px, z: pz, y: jumpY, v: velY, ground: onGround };
      return false;
    }, 600, o.ms);
    for (const k in K) K[k] = false; SPELL_FX.haste = 0; _flat(false);
    return { groundV: +groundV.toFixed(3), airMax: +airMax.toFixed(3), gap: gap != null ? +gap.toFixed(3) : null, stepped };
  };
});
const R = {};
R.fast = await page.evaluate(() => _run({ ath: 100, swift: 40, sprint: true }));
R.haste = await page.evaluate(() => _run({ ath: 100, swift: 40, sprint: true, haste: true }));
R.walk = await page.evaluate(() => _run({}));
R.untrained = await page.evaluate(() => _run({ sprint: true }));
R.acro100 = await page.evaluate(() => _run({ ath: 100, swift: 40, sprint: true, acro: 100 }));
R.step75 = await page.evaluate(() => _run({ ath: 100, swift: 40, sprint: true, haste: true, acro: 75, step: true }));
R.slow = await page.evaluate(() => _run({ ath: 100, swift: 40, sprint: true, haste: true, acro: 100, ms: 50 }));
R.step100 = await page.evaluate(() => _run({ ath: 100, swift: 40, sprint: true, haste: true, acro: 100, step: true }));
console.log(JSON.stringify(R));
const near = (a, b, e) => a != null && Math.abs(a - b) <= e;
check(`Athletics 100 and Swiftness 40, sprinting: ${R.fast.groundV} m/s on the ground (the sheet's 6.2), ${R.fast.airMax} in the air (4.7 ±0.05)`, near(R.fast.groundV, 6.2, .05) && near(R.fast.airMax, 4.7, .05), R.fast);
check(`with Haste too: ${R.haste.groundV} m/s on the ground, still ${R.haste.airMax} in the air`, R.haste.groundV > 9 && near(R.haste.airMax, 4.7, .05), R.haste);
check(`a walk is under the cap and keeps its pace in the air (${R.walk.groundV} and ${R.walk.airMax} m/s)`, R.walk.groundV < 4.7 && near(R.walk.airMax, R.walk.groundV, .02), R.walk);
check(`untrained sprint off a ledge clears ${R.fast.gap} m at Athletics 100 (the sheet's 2.87), as untrained legs do (${R.untrained.gap} m)`, near(R.fast.gap, 2.87, .05) && near(R.untrained.gap, 2.87, .05), { fast: R.fast, untrained: R.untrained });
check(`Acrobatics 100's jump clears ${R.acro100.gap} m (3.44)`, near(R.acro100.gap, 3.44, .05), R.acro100);
check(`the double jump at the top, under Haste at full sprint: ${R.step75.gap} m at Acrobatics 75 (4.85), ${R.step100.gap} m at 100 (4.98), never over 5.9`, R.step75.stepped && R.step100.stepped && near(R.step75.gap, 4.85, .06) && near(R.step100.gap, 4.98, .06) && R.step100.gap < 5.9, { step75: R.step75, step100: R.step100 });
check(`at 20 fps under Haste the jump clears ${R.slow.gap} m, the same as at 60 (${R.acro100.gap})`, near(R.slow.gap, R.acro100.gap, .03) && near(R.slow.airMax, 4.7, .05), { slow: R.slow, acro100: R.acro100 });
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
