// The player's posture (Session 281; combat, Michael's B, A's third piece). 100 + 2 an armour point. An unblocked
// blow drains its damage ×1.5, a held block ×1, a perfect parry nothing. Empty: staggered 0.8 s, open (the guard
// drops, no roll, no swing, no step), and you come out of it full. Otherwise it refills 5 a second, 1.5 s after the
// last blow. Times are passed in, so nothing here reads the runner's clock.
import { boot, check } from './lib/game.mjs';
const g = await boot(); const { page } = g;
await g.intoWorld();

const r = await page.evaluate(() => {
  const out = {};
  const def = Object.values(EQ).reduce((a, v) => a + (v && v.def ? v.def : 0), 0);
  out.def = def; out.max = playerMaxPosture();
  const mk = () => ({ name: 'Test Bandit', x: px + fwdX, z: pz + fwdZ, mesh: new THREE.Group(), dmg: 10 });
  const reset = () => { PPOST.posture = PPOST.maxPosture = playerMaxPosture(); PPOST.stagUntil = 0; PPOST.broke = false; PPOST.lastHitAt = 0; ROLL = null; PHP = maxHP; stamina = maxStamina; staminaCD = 0; };
  const T = 5000;
  // unblocked
  reset(); blocking = false; lastBlockAttemptT = -99; lastBlockAttemptG = -99; lastHitT = -99; executeStrike(mk(), 20, T * 1000); out.open = +(out.max - PPOST.posture).toFixed(2);
  // held block (raised long before the blow)
  reset(); blocking = true; lastBlockAttemptT = T - 5; lastBlockAttemptG = playClockS - 5; executeStrike(mk(), 20, T * 1000); out.held = +(out.max - PPOST.posture).toFixed(2); out.heldBlock = blocking;
  // perfect parry (raised just now)
  reset(); blocking = true; lastBlockAttemptT = T - .05; lastBlockAttemptG = playClockS - .05; executeStrike(mk(), 20, T * 1000); out.parry = +(out.max - PPOST.posture).toFixed(2);
  // the guard breaks: 10 left, a held block of 20
  reset(); PPOST.posture = 10; blocking = true; lastBlockAttemptT = T - 5; lastBlockAttemptG = playClockS - 5; executeStrike(mk(), 20, T * 1000);
  out.broke = { stag: playerStaggered(T + .01), blocking, msg: document.getElementById('msg') ? document.getElementById('msg').textContent : '', posture: PPOST.posture };
  out.stagAt79 = playerStaggered(T + .79); out.stagAt81 = playerStaggered(T + .81);
  // open: no roll while staggered; a second blow in the stagger drains nothing more and doesn't re-stagger
  out.rollInStagger = startRoll(T + .3, {}); ROLL = null;
  blocking = false; executeStrike(mk(), 20, (T + .4) * 1000); out.stagUntilAfter2nd = +(PPOST.stagUntil - T).toFixed(2);
  // out of it, full
  tickPlayerPosture(1 / 60, T + .81); out.after = +(PPOST.posture).toFixed(2);
  // regen: 50 left; 1.0 s after the blow nothing, 1.6 s after it 5 a second
  reset(); PPOST.posture = 50; PPOST.lastHitAt = T; tickPlayerPosture(1, T + 1.0); out.regen10 = PPOST.posture; tickPlayerPosture(1, T + 1.6); out.regen16 = PPOST.posture;
  // armour raises it
  const keep = EQ.chest; EQ.chest = { name: 'Test Plate', slot: 'chest', def: 20, type: 'equip' }; out.maxArmoured = playerMaxPosture(); out.chestDef = (keep && keep.def) || 0; EQ.chest = keep;
  // the bar under stamina shows once it is below full
  reset(); PPOST.posture = out.max / 2; tickPlayerPosture(0, T); const w = document.getElementById('psw'), b = document.getElementById('psb');
  out.bar = { shown: w && w.style.opacity, width: b && b.style.width };
  reset(); tickPlayerPosture(0, T); out.barFull = w && w.style.opacity;
  reset(); blocking = false; lastHitT = -99; lastBlockAttemptT = -99; lastBlockAttemptG = -99;
  return out;
});
console.log(JSON.stringify(r));
check('posture is 100 + 2 an armour point', r.max === 100 + 2 * r.def && r.maxArmoured === 100 + 2 * (r.def - r.chestDef + 20), r);
check('an unblocked 20 drains 30', r.open === 30, r);
check('a held block of 20 drains 20', r.held === 20 && r.heldBlock === true, r);
check('a perfect parry drains nothing', r.parry === 0, r);
check('empty on a block: the guard breaks, staggered', r.broke.stag && r.broke.blocking === false && /guard breaks/.test(r.broke.msg), r.broke);
check('the stagger lasts 0.8 s', r.stagAt79 && !r.stagAt81, r);
check('no roll while staggered; a blow in it does not re-stagger', r.rollInStagger === false && r.stagUntilAfter2nd === .8, r);
check('you come out of it full', r.after === r.max, r);
check('it refills 5 a second from 1.5 s after the blow', r.regen10 === 50 && r.regen16 === 55, r);
check('the bar under stamina shows at half, hides at full', r.bar.shown === '1' && r.bar.width === '50%' && r.barFull === '0', r);

// end to end: a real bandit's blow through the world's tick drains 1.5× what it took off your health
const e2e = await page.evaluate(() => {
  const e = buildZoneEnemy(WORLD.scene, [], px + 1, pz, 'Bandit', null); if (!e.mesh.parent) WORLD.scene.add(e.mesh);
  e.locked = false; e.alert = true; e.x = px + 1; e.z = pz; e.combatYaw = Math.atan2(px - e.x, pz - e.z);
  e.telegraphMax = .5; e.telegraphT = .001; e.atkCd = 0; e.spd = 0;
  PPOST.posture = PPOST.maxPosture = playerMaxPosture(); PPOST.stagUntil = 0; PPOST.broke = false; PHP = maxHP; blocking = false; ROLL = null; lastHitT = -99; lastBlockAttemptT = -99; lastBlockAttemptG = -99;
  const keep = ZE; ZE = [e]; const rnd = Math.random; Math.random = () => 0;
  const def2 = Object.values(EQ).reduce((a, v) => a + (v && v.def ? v.def : 0), 0), raw = Math.max(1, e.dmg - Math.floor(def2 * .5));
  try { tickZoneEnemies(1 / 60, performance.now(), WORLD.scene); } finally { ZE = keep; Math.random = rnd; }
  const hp = maxHP - PHP, post = PPOST.maxPosture - PPOST.posture; PHP = maxHP; WORLD.scene.remove(e.mesh);
  PPOST.posture = PPOST.maxPosture;
  return { hp, post, raw };
});
console.log(JSON.stringify(e2e));
check('a bandit\'s unblocked blow drains 1.5× its damage', e2e.hp > 0 && Math.abs(e2e.post - 1.5 * e2e.raw) < .01, e2e);
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
