// The Bandit who never struck back (the critic, 2026-10-02, build s360): fought bare-handed in the street by a bot that
// faced him and punched whenever the cooldown was down, a Bandit (25 health) died to nine punches and in 99 frames never
// landed a blow. The critic left open whether that was the bot's speed or the Bandit's. This settles it in the running
// game: the loop's own tick at fixed 1/60 (the scene's draw and the browser's frames held off, as `duelrhythm` does), a
// Bandit set down as a quest sets one (`unlockFoe`), alert, four units off.
// - Stood still, the Bandit winds up (its tell) and lands its blows, about one every 1.9 s (its 1.3 s recovery and the tell).
// - Punched, the fists break its 25 posture (Session 431's regen delay) and it stands staggered for much of a short fight,
//   so it lands a blow or two at most before it dies. It is the fists' rhythm against posture, not a Bandit that cannot strike.
// The player's stagger is read on `performance.now()`, the loop's `now` here runs ahead of it, so each fight starts with the
// player's posture full and no stagger standing.
import { boot, check } from './lib/game.mjs';
const g = await boot(); const { page } = g;
await g.intoWorld();
await page.evaluate(() => { window._keepW = EQ.weapon; window._drive = (step, max) => {
  const raf = window.requestAnimationFrame, rr = REN.render; window.requestAnimationFrame = () => 0; REN.render = () => {};
  let t = performance.now(), n = 0;
  try { for (; n < max; n++) { if (step()) break; t += 1000 / 60; loop(t); } }
  finally { window.requestAnimationFrame = raf; REN.render = rr; prevT = 0; }
  return n; }; });

// one fight: `punch` swings whenever the cooldown is down and the Bandit is within reach; `fists` empties the weapon hand
const fight = (punch, fists, max) => page.evaluate(([punch, fists, max]) => {
  forceTime(12); EQ.weapon = fists ? null : window._keepW; buildViewmodel();
  PHP = maxHP; dead = false; stamina = maxStamina; atkCd = 0; PPOST.stagUntil = 0; PPOST.posture = PPOST.maxPosture;
  const e = unlockFoe(buildZoneEnemy(WORLD.scene, [], px, pz - 4, 'Bandit', null)); e.alert = true; ZONES.world.enemies.push(e);
  const log = { weapon: EQ.weapon ? EQ.weapon.name : 'fists', hp0: e.hp, posture: e.maxPosture || e.posture, tells: 0, blows: 0, landed: 0, swings: 0, hits: 0, stagFrames: 0, frames: 0 };
  const _t = sndTelegraph, _x = executeStrike, _r = _resolveZoneStrike;
  sndTelegraph = function () { log.tells++; return _t.apply(this, arguments); };
  executeStrike = function () { log.blows++; const h = PHP; const out = _x.apply(this, arguments); if (PHP < h) log.landed++; return out; };
  _resolveZoneStrike = function () { const h = e.hp; const out = _r.apply(this, arguments); if (e.hp < h) log.hits++; return out; };
  const step = () => { if (e.dead || e.hp <= 0 || PHP <= 0) return true; stamina = maxStamina; yaw = Math.atan2(-(e.x - px), -(e.z - pz));
    if (staggered.find(s => s.e === e)) log.stagFrames++;
    if (punch && atkCd <= 0 && !_pendingStrike && Math.hypot(e.x - px, e.z - pz) < 1.6) { attack(false); log.swings++; } };
  try { log.frames = _drive(step, max); } finally { sndTelegraph = _t; executeStrike = _x; _resolveZoneStrike = _r; }
  Object.assign(log, { secs: +(log.frames / 60).toFixed(2), hpEnd: e.hp, dead: !!e.dead, php0: maxHP, phpEnd: PHP, tell: +telegraphDuration(e).toFixed(2), recover: e.atkSpd });
  if (!e.dead) { e.dead = true; if (e.mesh) WORLD.scene.remove(e.mesh); }
  const L = ZONES.world.enemies, i = L.indexOf(e); if (i >= 0) L.splice(i, 1);
  return log; }, [punch, fists, max]);

const stand = await fight(false, true, 60 * 30);
console.log('stood still', JSON.stringify(stand));
check('stood still, the Bandit winds up and strikes: 12+ blows in 30 s, each after its tell, most landing', stand.blows >= 12 && stand.tells >= stand.blows && stand.landed >= stand.blows * .8 && stand.phpEnd < stand.php0 - 60, stand);

const runs = [];
for (let k = 0; k < 5; k++) runs.push(await fight(true, true, 60 * 30));
for (const r of runs) console.log('punched', JSON.stringify(r));
const sum = (f) => runs.reduce((a, r) => a + f(r), 0);
check('punched bare-handed, the Bandit dies every time, in 7–12 punches that land', runs.every(r => r.dead && r.hits >= 7 && r.hits <= 12), runs.map(r => [r.dead, r.hits, r.swings]));
check('the punches break its posture: it stands staggered for a quarter of the fight or more', runs.every(r => r.stagFrames >= r.frames * .25), runs.map(r => [r.stagFrames, r.frames]));
check('so it starts few wind-ups and lands two blows at most a fight', runs.every(r => r.landed <= 2), runs.map(r => [r.tells, r.blows, r.landed]));
console.log('fists over five fights:', { secs: runs.map(r => r.secs), punches: sum(r => r.swings), landedOnYou: sum(r => r.landed), staggeredShare: +(sum(r => r.stagFrames) / sum(r => r.frames)).toFixed(2) });

const armed = await fight(true, false, 60 * 30);
console.log('armed', JSON.stringify(armed));
check('with the starting weapon the Bandit dies too, and its blows still come only after a tell', armed.dead && armed.tells >= armed.blows, armed);
check('no page errors', g.errs.length === 0, g.errs);
await page.evaluate(() => { EQ.weapon = window._keepW; buildViewmodel(); });
await g.close();
