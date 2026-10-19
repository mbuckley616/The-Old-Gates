// The aim's sway and Steady (Session 1028; Michael's A on DECISION #369). A full draw held past 1 s starts to drift: the arrow
// leaves up to 2° off the crosshair, the drift growing over the next 2 s, and the bow in hand wobbles with it. Steady (Bow 25)
// holds the aim true for the first 3 s of a full draw. The draw is held by the game's own loop at fixed 1/60 steps (the draw
// held off), and arrows are loosed by `fireArrow` at chosen holds; the angle is the arrow's line against the crosshair's.
import { boot, check } from './lib/game.mjs';
const g = await boot(); const { page } = g;
await g.intoWorld();
await page.evaluate(() => { window._drive = (step, max) => {
  const raf = window.requestAnimationFrame, rr = REN.render; window.requestAnimationFrame = () => 0; REN.render = () => {};
  let t = performance.now(), n = 0;
  try { for (; n < max; n++) { if (step && step(n)) break; PHP = maxHP; dead = false; t += 1000 / 60; loop(t); } }
  finally { window.requestAnimationFrame = raf; REN.render = rr; prevT = 0; }
  return n; };
  // hold a draw at Bow `lv`; at each of `at` (seconds past the full draw) loose an arrow and note its angle off the crosshair,
  // the sway's amplitude and the bow's tilt in hand against the frame before the drift began
  window._hold = (lv, at) => {
    const w0 = EQ.weapon, a0 = EQ.ammo, tp0 = thirdPerson, sk0 = JSON.stringify(SKILLS.bow);
    EQ.weapon = { name: 'Test Bow', ico: '🏹', type: 'equip', slot: 'weapon', atk: [5, 30], weaponShape: 'bow', wType: 'pierce', twoHand: true, weight: 3 };
    EQ.ammo = { name: 'Iron Arrow', ico: '➶', type: 'ammo', qty: 500, arrowDmg: [2, 12] }; thirdPerson = false; SKILLS.bow = { lv, p: 0 };
    yaw = 0.4; pitch = 0.05; for (const k in K) K[k] = false;
    _bowDrawing = true; _bowDrawT = 0;
    const out = [], todo = at.slice(); let fullAt = null, vm0 = null, vmMax = 0;
    const cx = -Math.sin(yaw) * Math.cos(pitch), cy = Math.sin(pitch), cz = -Math.cos(yaw) * Math.cos(pitch);
    _drive(n => {
      stamina = maxStamina; staminaCD = 0; yaw = 0.4; pitch = 0.05;
      if (fullAt == null && _bowFullS >= 0) fullAt = n;
      if (vmSword) { const r = { x: vmSword.rotation.x, y: vmSword.rotation.y };
        if (_bowFullS >= 0 && _bowFullS < .5) vm0 = r; else if (vm0) vmMax = Math.max(vmMax, Math.hypot(r.x - vm0.x, r.y - vm0.y)); }
      if (_bowFullS >= 0 && todo.length && _bowFullS >= todo[0] - 1e-9) {
        const t = todo.shift(), amp = bowSwayAmp(), keep = ZB.length;
        fireArrow(1); const a = ZB[ZB.length - 1], u = a && ZB.length > keep ? a.userData : null;
        let ang = null; if (u) { const L = Math.hypot(u.vx, u.vy, u.vz); ang = Math.acos(Math.min(1, (u.vx * cx + u.vy * cy + u.vz * cz) / L)) * 180 / Math.PI; }
        out.push({ t, hold: +_bowFullS.toFixed(3), amp: +(amp * 180 / Math.PI).toFixed(3), ang: ang == null ? null : +ang.toFixed(3) });
        if (a) { a.parent && a.parent.remove(a); ZB.splice(ZB.indexOf(a), 1); }
      }
      return !todo.length;
    }, 60 * 8);
    _bowDrawing = false; _bowDrawT = 0; _drive(null, 1); const after = _bowFullS;
    EQ.weapon = w0; EQ.ammo = a0; thirdPerson = tp0; SKILLS.bow = JSON.parse(sk0);
    return { lv, shots: out, fullAt, vmTilt: +(vmMax * 180 / Math.PI).toFixed(3), after, steady: PERK_LIVE.has('bow:25') };
  }; });

const at = [0.5, 0.99, 1.5, 2, 2.5, 2.99, 3.5, 4, 5];
const R = { b24: await page.evaluate(at => _hold(24, at), at), b25: await page.evaluate(at => _hold(25, at), at) };
console.log(JSON.stringify(R));
const S = (r, t) => r.shots.find(s => s.t === t);
const { b24, b25 } = R;
check(`Bow 24: the first second of a full draw flies true (${S(b24, .5).ang}° and ${S(b24, .99).ang}° off at 0.5 and 0.99 s)`, S(b24, .5).ang < .01 && S(b24, .99).ang < .01, b24.shots);
check(`then it drifts, growing over 2 s: amplitude ${S(b24, 1.5).amp}° at 1.5 s, ${S(b24, 2).amp}° at 2, ${S(b24, 3.5).amp}° at 3.5 (the sheet's 0.5, 1, 2)`,
  Math.abs(S(b24, 1.5).amp - .5) < .05 && Math.abs(S(b24, 2).amp - 1) < .05 && Math.abs(S(b24, 3.5).amp - 2) < .01 && Math.abs(S(b24, 5).amp - 2) < .01, b24.shots);
check(`each arrow leaves within its amplitude and never past 2° (${b24.shots.map(s => s.ang).join(', ')}°), and some leave off true`,
  b24.shots.every(s => s.ang <= s.amp + .01 && s.ang <= 2.01) && b24.shots.some(s => s.ang > .3), b24.shots);
check(`Steady (Bow 25) is live and holds the aim true for 3 s (${b25.shots.filter(s => s.t < 3).map(s => s.ang).join(', ')}°)`,
  b25.steady && b25.shots.filter(s => s.t < 3).every(s => s.ang < .01), b25.shots);
check(`past 3 s with Steady it drifts as before, a second later (${S(b25, 3.5).amp}° at 3.5 s, ${S(b25, 4).amp}° at 4, ${S(b25, 5).amp}° at 5)`,
  Math.abs(S(b25, 3.5).amp - .5) < .05 && Math.abs(S(b25, 4).amp - 1) < .05 && Math.abs(S(b25, 5).amp - 2) < .01, b25.shots);
check(`the bow in hand wobbles with the drift (${b24.vmTilt}° of tilt at most), and the hold ends with the draw (${b24.after})`, b24.vmTilt > .5 && b24.vmTilt < 4 && b24.after === -1, b24);
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
