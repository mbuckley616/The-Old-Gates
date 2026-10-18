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
const fight = (punch, fists, max, hand = 5, noThrow = false) => page.evaluate(([punch, fists, max, hand, noThrow]) => {
  const _thr = PERK_LIVE.has('hand:50'); if (noThrow) PERK_LIVE.delete('hand:50');
  forceTime(12); SKILLS.hand = { lv: hand, p: 0 }; EQ.weapon = fists ? null : window._keepW; buildViewmodel();
  PHP = maxHP; dead = false; stamina = maxStamina; atkCd = 0; PPOST.stagUntil = 0; PPOST.posture = PPOST.maxPosture;
  const e = unlockFoe(buildZoneEnemy(WORLD.scene, [], px, pz - 4, 'Bandit', null)); e.alert = true; ZONES.world.enemies.push(e);
  const log = { weapon: EQ.weapon ? EQ.weapon.name : 'fists', hp0: e.hp, posture: e.maxPosture || e.posture, tells: 0, blows: 0, heavy: 0, landed: 0, swings: 0, hits: 0, stagFrames: 0, frames: 0 };
  const _t = sndTelegraph, _x = executeStrike, _r = _resolveZoneStrike;
  sndTelegraph = function () { log.tells++; return _t.apply(this, arguments); };
  executeStrike = function () { log.blows++; if (arguments[0] && arguments[0]._heavy) log.heavy++; const h = PHP; const out = _x.apply(this, arguments); if (PHP < h) log.landed++; return out; };
  _resolveZoneStrike = function () { const h = e.hp; const out = _r.apply(this, arguments); if (e.hp < h) log.hits++; return out; };
  const step = () => { if (e.dead || e.hp <= 0 || PHP <= 0) return true; stamina = maxStamina; yaw = Math.atan2(-(e.x - px), -(e.z - pz));
    if (staggered.find(s => s.e === e)) log.stagFrames++;
    if (punch && atkCd <= 0 && !_pendingStrike && Math.hypot(e.x - px, e.z - pz) < 1.6) { attack(false); log.swings++; } };
  try { log.frames = _drive(step, max); } finally { sndTelegraph = _t; executeStrike = _x; _resolveZoneStrike = _r; if (_thr) PERK_LIVE.add('hand:50'); }
  Object.assign(log, { secs: +(log.frames / 60).toFixed(2), hpEnd: e.hp, dead: !!e.dead, php0: maxHP, phpEnd: PHP, tell: +telegraphDuration(e).toFixed(2), recover: e.atkSpd });
  if (!e.dead) { e.dead = true; if (e.mesh) WORLD.scene.remove(e.mesh); }
  const L = ZONES.world.enemies, i = L.indexOf(e); if (i >= 0) L.splice(i, 1);
  return log; }, [punch, fists, max, hand, noThrow]);

const stand = await fight(false, true, 60 * 30);
console.log('stood still', JSON.stringify(stand));
// S940 — armour as a share (decision #181 B, the attack table): stood still you fall, where you used to outlast 30 s. S949 — an
// ordinary blow at your level's kit is a sixth of your health (Michael's B on #355), so you fall at the sixth blow (6 of 6 landed,
// 10.9 s, 130 health); 5 to 7 allows for the Bandit's roll. The rhythm is the same: 12 or more blows a 30 s.
check('stood still, the Bandit winds up and strikes, 12+ blows a 30 s, each after its tell, most landing, until you fall at about the sixth (a heavy counts two since S1136)', stand.blows / stand.secs >= 12 / 30 && stand.tells >= stand.blows && stand.landed >= stand.blows * .8 && (stand.blows >= 12 || (stand.phpEnd <= 0 && stand.landed + stand.heavy >= 5 && stand.landed + stand.heavy <= 7)), stand);

// Hand-to-hand (Session 950, Michael's C on #357): bare fists are a skill of their own, the fists' 2–3 on its multiplier. The
// critic's 7–12 punches was measured with the level's flat +1.5 in every hit; with it gone, an untrained fist (5, ×0.64) is
// the longer brawl Michael chose, and the critic's brawl comes back as the fist is trained (100, ×1.4).
const runsAt = async (hand, n, noThrow = false) => { const out = []; for (let k = 0; k < n; k++) out.push(await fight(true, true, 60 * 40, hand, noThrow)); return out; };
// S1051 — the multiplier's brawl is measured at 99, a point under Stone hand (Hand-to-hand 100: the fists roll 4 to 7, `perkarms`),
// which is fought on its own below. S1104 — and with Throw (Hand-to-hand 50, S1078) held out of the live list: a thrown Bandit lies with
// its finisher open from any side, which ends the brawl sooner (5 punches on CI), so the multiplier is measured without it and
// Throw's own brawl beside it
const raw = await runsAt(5, 3), master = await runsAt(99, 3, true), thrown = await runsAt(99, 3), stone = await runsAt(100, 2, true), runs = raw.concat(master);
for (const r of raw) console.log('punched at Hand-to-hand 5', JSON.stringify(r));
for (const r of master) console.log('punched at Hand-to-hand 99', JSON.stringify(r));
for (const r of thrown) console.log('punched at Hand-to-hand 99, with Throw', JSON.stringify(r));
for (const r of stone) console.log('punched at Hand-to-hand 100, Stone hand', JSON.stringify(r));
const sum = (f) => runs.reduce((a, r) => a + f(r), 0);
check(`untrained (Hand-to-hand 5), the Bandit dies every time, in 15–28 punches that land (${raw.map(r => r.hits).join(', ')})`, raw.every(r => r.dead && r.hits >= 15 && r.hits <= 28), raw.map(r => [r.dead, r.hits, r.swings]));
// S940 — the light chain lands every third punch ×1.3, so the critic's 7–12 is 6–11 (main's re-measure, carried here: the merge of
// Session 1013 kept the old range, and CI's slower frames keep the chain and reached 6)
check(`trained to 99, the critic's brawl under the light chain: dead in 6–11 punches (${master.map(r => r.hits).join(', ')})`, master.every(r => r.dead && r.hits >= 6 && r.hits <= 11), master.map(r => [r.dead, r.hits, r.swings]));
check(`Throw at 99: the Bandit still dies, in no more punches than the multiplier's 11 (${thrown.map(r => r.hits).join(', ')})`, thrown.every(r => r.dead && r.hits >= 2 && r.hits <= 11), thrown.map(r => [r.dead, r.hits, r.swings]));
check(`Stone hand at 100: the fists' 4 to 7 end it in about half the punches (${stone.map(r => r.hits).join(', ')}, against ${master.map(r => r.hits).join(', ')} at 99)`, stone.every(r => r.dead && r.hits >= 2 && r.hits * 1.5 <= Math.min(...master.map(m => m.hits))), stone.map(r => [r.dead, r.hits, r.swings]));
check('the punches break its posture: it stands staggered for a quarter of the fight or more', runs.every(r => r.stagFrames >= r.frames * .25), runs.map(r => [r.stagFrames, r.frames]));
check('so it starts few wind-ups and lands two blows at most a fight', runs.every(r => r.landed <= 2), runs.map(r => [r.tells, r.blows, r.landed]));
console.log('fists over six fights:', { secs: runs.map(r => r.secs), punches: sum(r => r.swings), landedOnYou: sum(r => r.landed), staggeredShare: +(sum(r => r.stagFrames) / sum(r => r.frames)).toFixed(2) });

const armed = await fight(true, false, 60 * 30);
console.log('armed', JSON.stringify(armed));
check('with the starting weapon the Bandit dies too, and its blows still come only after a tell', armed.dead && armed.tells >= armed.blows, armed);
check('no page errors', g.errs.length === 0, g.errs);
await page.evaluate(() => { EQ.weapon = window._keepW; buildViewmodel(); });
await g.close();
