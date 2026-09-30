// The parry on the play clock (Session 368; the critic's s321 note). A foe's wind-up runs on the loop's dt, which is capped at
// 0.05 s a frame; the parry window was read on the real clock. Below 20 fps the two part: a block raised two frames before
// the blow is 0.1 s of wind-up but, at a second a frame, two seconds of real time, and the 0.2 s window had shut. Now the
// window is read on `playClockS`, the loop's capped dt summed. Headless Chromium draws the world at about a frame a second,
// so this test runs the game's own loop, not fixed ticks: it is the slow machine.
import { boot, check } from './lib/game.mjs';
const g = await boot(); const { page } = g;
await g.intoWorld();
const stop = g.keepAlive();

// a Bandit in front with `left` seconds of wind-up to go, the block raised now as the right button does it, and the game's
// own loop run until the blow falls
const trial = (left) => page.evaluate((left) => new Promise(res => {
  const e = buildZoneEnemy(WORLD.scene, [], px + fwdX * 1.0, pz + fwdZ * 1.0, 'Bandit', null); if (!e.mesh.parent) WORLD.scene.add(e.mesh);
  e.locked = false; e.alert = true; e.spd = 0; e.combatYaw = Math.atan2(px - e.x, pz - e.z); e._yaw0 = e.combatYaw; if (typeof e.posture !== 'number') initPosture(e);
  e.telegraphMax = .5; e.telegraphT = left; e.atkCd = 0; ZE.push(e);
  PHP = maxHP; PPOST.posture = PPOST.maxPosture; PPOST.stagUntil = 0; ROLL = null; stamina = 100;
  blocking = true; lastBlockAttemptT = performance.now() / 1000; lastBlockAttemptG = playClockS;
  const t0 = performance.now(), c0 = playClockS, hp0 = PHP, post0 = PPOST.posture; let n = 0;
  const f = () => { n++;
    const struck = e.telegraphT <= 0 && e.atkCd > 0;
    if (struck || n > 60) { const out = { left, frames: n, real: +((performance.now() - t0) / 1000).toFixed(2), play: +(playClockS - c0).toFixed(3), struck,
        lost: hp0 - PHP, postureLost: +(post0 - PPOST.posture).toFixed(1), riposte: typeof e._ripUntil === 'number' && e._ripUntil > 0, fps: +(n / ((performance.now() - t0) / 1000)).toFixed(1) };
      blocking = false; ZE.splice(ZE.indexOf(e), 1); WORLD.scene.remove(e.mesh); staggered = staggered.filter(s => s.e !== e); res(out); return; }
    requestAnimationFrame(f); };
  requestAnimationFrame(f); }), left);

const late = await trial(.1);
console.log('raised 0.1 s of wind-up before the blow:', JSON.stringify(late));
check('the game loop ran below 20 fps (so real time outran the wind-up)', late.real > late.play + .2, late);
check('a block raised two capped frames before the blow parries it: no health lost, a riposte opens', late.struck && late.lost === 0 && late.riposte, late);
const early = await trial(.5);
console.log('raised 0.5 s of wind-up before the blow:', JSON.stringify(early));
check('a block raised 0.5 s of wind-up before is a held block, not a parry (no riposte, posture spent)', early.struck && !early.riposte && early.postureLost > 0, early);
stop();
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
