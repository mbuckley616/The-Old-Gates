// A foe's posture comes back 5 a second only after 1.5 s unhit, and full when its stagger ends (Session 47's rule;
// Session 430's fix). Both enemy ticks pass `tickPostureRegen` the loop's clock in milliseconds, and every strike stamps
// `lastHitAt` in seconds, so the delay was never met: a foe's posture refilled 5 a second straight after every blow, and a
// sustained attack needed more swings to break it than Session 47's figures (a 60-posture troll in 8 swings).
// Checked through the real `tickZoneEnemies`, on a Bandit the world builds beside you.
import { boot, check } from './lib/game.mjs';
const g = await boot(); const { page } = g;
await g.intoWorld();
const stop = g.keepAlive();

const r = await page.evaluate(() => {
  const out = {};
  const mk = () => { const e = buildZoneEnemy(WORLD.scene, [], px + fwdX * 6, pz + fwdZ * 6, 'Bandit', null); if (!e.mesh.parent) WORLD.scene.add(e.mesh);
    e.locked = false; e.spd = 0; e.atkCd = 1e9; e.telegraphT = 0; e.alert = true; e.hp = e.maxHp = 1e4; if (!ZE.includes(e)) ZE.push(e);
    delete e.posture; e.maxHp = 50; initPosture(e); e.maxHp = 1e4; return e; };
  const drop = e => { ZE.splice(ZE.indexOf(e), 1); WORLD.scene.remove(e.mesh); staggered = staggered.filter(s => s.e !== e); };
  const tick = (n) => { for (let i = 0; i < n; i++) tickZoneEnemies(1 / 60, performance.now(), WORLD.scene); };

  // 1. one blow, then the loop's own tick for well under 1.5 s of real time: nothing comes back
  let e = mk(); out.max = e.maxPosture;
  const t0 = performance.now();
  applyPostureDamage(e, POSTURE_DRAIN_NORMAL, performance.now() / 1000); out.afterHit = e.posture;
  tick(60); out.tickMs = Math.round(performance.now() - t0); out.after60 = +e.posture.toFixed(2);
  // 2. the same foe, its last blow 2 s ago: 5 a second
  e.lastHitAt = performance.now() / 1000 - 2; tick(60); out.afterRegen = +e.posture.toFixed(2);
  // 3. broken, staggered, and still being hit as the stagger ends: a full pool on recovery
  applyPostureDamage(e, 999, performance.now() / 1000); staggered.push({ e, t: 1 / 120 }); out.broken = e.posture;
  tick(1); out.inStagger = e.posture; e.lastHitAt = performance.now() / 1000; tick(2); out.recovered = e.posture; out.stillStaggered = isStaggered(e);
  drop(e);

  // 4. a sustained attack on a simulated clock, through tickPostureRegen as the loop calls it (ms):
  // a swing every 0.5 s with the drain of a normal blow, ticks of 1/60 between; Session 47's troll, posture 60
  const swings = (maxP, drain, every) => { const f = { posture: maxP, maxPosture: maxP, lastHitAt: 0 }; let t = 1000, n = 0;
    while (n < 60) { n++; if (applyPostureDamage(f, drain, t)) return n; for (let k = 0; k < Math.round(every * 60); k++) { t += 1 / 60; tickPostureRegen(f, 1 / 60, t * 1000); } }
    return n; };
  out.troll = swings(60, POSTURE_DRAIN_NORMAL, .5); out.trollDesigned = Math.ceil(60 / POSTURE_DRAIN_NORMAL);
  out.bandit = swings(out.max, POSTURE_DRAIN_NORMAL, .5); out.banditDesigned = Math.ceil(out.max / POSTURE_DRAIN_NORMAL);
  out.slow = swings(60, POSTURE_DRAIN_NORMAL, 2); // a blow every 2 s: past the delay, so it regenerates between
  out.errsFree = true;
  return out;
});
console.log(JSON.stringify(r));

check('a Bandit of 50 health has 25 posture, and a blow takes 8', r.max === 25 && r.afterHit === 17, r);
check(`through tickZoneEnemies, 60 ticks (${r.tickMs} ms of real time) after a blow: no posture back`, r.tickMs < 1500 && r.after60 === 17, r);
check('2 s after the last blow, 60 ticks of 1/60 bring back 5', Math.abs(r.afterRegen - 22) < .05, r);
check('broken and staggered, still hit as the stagger ends: it recovers with a full pool', r.broken === 0 && r.inStagger === 0 && !r.stillStaggered && r.recovered === r.max, r);
check(`a swing every 0.5 s breaks Session 47's 60-posture troll in ${r.trollDesigned} swings, as designed`, r.troll === r.trollDesigned, r);
check(`and the Bandit in ${r.banditDesigned}`, r.bandit === r.banditDesigned, r);
check('a blow every 2 s lets it regenerate between, so it takes longer', r.slow > r.trollDesigned, r);
stop();
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
