// The counters (Session 298; combat, Michael's B). A perfect parry drains 40% of the foe's posture and opens a riposte
// for 0.8 s: the first swing begun in it lands ×2.5 and goes through a raised shield. A broken posture opens a finisher
// from the front while the stagger lasts: ×3, and 1.2 s in which you are untouchable. Other blows on a staggered foe
// keep ×1.5. Times are passed in or set, so nothing reads the runner's clock.
import { boot, check } from './lib/game.mjs';
const g = await boot(); const { page } = g;
await g.intoWorld();
const stop = g.keepAlive();

const r = await page.evaluate(() => {
  const out = {}; const keep = ZE;
  const mk = (d) => { const e = buildZoneEnemy(WORLD.scene, [], px + fwdX * (d || 1.2), pz + fwdZ * (d || 1.2), 'Bandit', null);
    if (!e.mesh.parent) WORLD.scene.add(e.mesh); e.locked = false; e.spd = 0; e.atkCd = 1e9; e.telegraphT = 0;
    e.combatYaw = Math.atan2(px - e.x, pz - e.z); if (typeof e.posture !== 'number') initPosture(e); return e; };
  const clean = (...es) => es.forEach(e => { WORLD.scene.remove(e.mesh); staggered = staggered.filter(s => s.e !== e); });
  const want = (e, m, info) => Math.max(1, Math.round(20 * m * info.resistMult) - (e.def || 0));
  _exhaustedStrike = false; FINISHER_SAFE_UNTIL = 0;

  // the parry: 40% of posture, a riposte for 0.8 s
  const a = mk(); const now = performance.now() / 1000;
  blocking = true; lastBlockAttemptT = now - .05; lastBlockAttemptG = playClockS - .05;
  executeStrike(a, 20, now * 1000); blocking = false;
  out.maxP = a.maxPosture; out.postAfter = +a.posture.toFixed(2); out.stag = isStaggered(a);
  out.ripFor = +(a._ripUntil - a._ripAt).toFixed(3);
  out.msg = document.getElementById('msg') ? document.getElementById('msg').textContent : '';
  _swingStartS = now + .5;
  const i1 = applyMeleeDamage(a, 20); out.rip = { riposte: i1.riposte, dmg: i1.dmg, want: want(a, 2.5, i1) };
  const i2 = applyMeleeDamage(a, 20); out.after = { riposte: i2.riposte, crit: i2.crit, dmg: i2.dmg, want: want(a, 1.5, i2) };
  clean(a);
  // a swing begun after the window: only the stagger's ×1.5
  const b = mk(); blocking = true; lastBlockAttemptT = now - .05; lastBlockAttemptG = playClockS - .05; executeStrike(b, 20, now * 1000); blocking = false;
  _swingStartS = now + .85; const i3 = applyMeleeDamage(b, 20); out.late = { riposte: i3.riposte, dmg: i3.dmg, want: want(b, 1.5, i3) };
  clean(b);

  // through a raised shield: the resolver, a real swing's impact, the dice pinned
  const rnd = Math.random; Math.random = () => .5;
  const shielded = (riposte, pow) => { const e = mk(1.2); e.shieldUp = true; e.hp = e.maxHp = 500; ZE = [e];
    if (riposte) { e._ripAt = now; e._ripUntil = now + .8; _swingStartS = now + .3; staggered.push({ e, t: 1.2 }); } else _swingStartS = -1e9;
    const h0 = e.hp; try { _resolveZoneStrike(!!pow); } finally { ZE = keep; } const lost = h0 - e.hp; clean(e); return lost; };
  out.shieldPlain = shielded(false); out.shieldRip = shielded(true); out.shieldRipPow = shielded(true, true); out.shieldPow = shielded(false, true);
  Math.random = rnd;

  // the finisher: posture broken, from the front
  const c = mk(); const t = performance.now() / 1000;
  out.broke = applyPostureDamage(c, c.maxPosture, t); staggered.push({ e: c, t: POSTURE_BREAK_STUN });
  const f1 = applyMeleeDamage(c, 20); out.fin = { finisher: f1.finisher, dmg: f1.dmg, want: want(c, 3, f1) };
  out.safeFor = +(FINISHER_SAFE_UNTIL - t).toFixed(2);
  out.safeAt1 = rollUntouchable(t + 1.0); out.safeAt13 = rollUntouchable(t + 1.3);
  const hitter = mk(1.0); PHP = maxHP; blocking = false; executeStrike(hitter, 20, (t + .5) * 1000); out.hitInSafe = maxHP - PHP;
  PHP = maxHP; executeStrike(hitter, 20, (t + 1.4) * 1000); out.hitAfterSafe = maxHP - PHP; PHP = maxHP;
  const f2 = applyMeleeDamage(c, 20); out.fin2 = { finisher: f2.finisher, dmg: f2.dmg, want: want(c, 1.5, f2) };
  clean(c, hitter); FINISHER_SAFE_UNTIL = 0;
  // from behind: no finisher (the backstab's own rule applies instead)
  const d = mk(); d.combatYaw += Math.PI; applyPostureDamage(d, d.maxPosture, t); staggered.push({ e: d, t: POSTURE_BREAK_STUN });
  const f3 = applyMeleeDamage(d, 20); out.behind = { finisher: f3.finisher, safe: FINISHER_SAFE_UNTIL > t }; clean(d); FINISHER_SAFE_UNTIL = 0;
  // a parry that empties posture opens both; the finisher takes the blow and closes the riposte
  const h = mk(); h.posture = h.maxPosture * .3; blocking = true; lastBlockAttemptT = now - .05; lastBlockAttemptG = playClockS - .05; executeStrike(h, 20, now * 1000); blocking = false;
  out.both = { stagT: +(staggered.find(s => s.e === h) || {}).t, fin: finisherOpen(h, performance.now() / 1000) };
  _swingStartS = now + .2; const f4 = applyMeleeDamage(h, 20); out.both.hitFin = f4.finisher; out.both.ripLeft = riposteOpen(h);
  clean(h); FINISHER_SAFE_UNTIL = 0;
  return out;
});
console.log(JSON.stringify(r));
check('a perfect parry drains 40% of posture and staggers', Math.abs(r.postAfter - r.maxP * .6) < .01 && r.stag, r);
check('it opens a riposte of 0.8 s, and says so', r.ripFor === .8 && /riposte/.test(r.msg), r);
check('the first swing in the window lands ×2.5', r.rip.riposte && r.rip.dmg === r.rip.want, r.rip);
check('the next is the stagger\'s ×1.5', !r.after.riposte && r.after.crit && r.after.dmg === r.after.want, r.after);
check('a swing begun after 0.8 s is no riposte', !r.late.riposte && r.late.dmg === r.late.want, r.late);
check('a riposte goes through a raised shield (×2.5 against the shield\'s .35)', r.shieldRip > r.shieldPlain * 5, r);
check('a power riposte on a shield wounds, where a power blow only breaks the guard', r.shieldRipPow > 0 && r.shieldPow === 0, r);
check('a broken posture: the first blow from the front is a finisher, ×3', r.broke && r.fin.finisher && r.fin.dmg === r.fin.want, r.fin);
check('the finisher leaves you untouchable 1.2 s', r.safeFor === 1.2 && r.safeAt1 && !r.safeAt13, r);
check('a foe\'s blow inside it misses, after it lands', r.hitInSafe === 0 && r.hitAfterSafe > 0, r);
check('the next blow on the staggered foe is ×1.5', !r.fin2.finisher && r.fin2.dmg === r.fin2.want, r.fin2);
check('from behind there is no finisher', !r.behind.finisher && !r.behind.safe, r.behind);
check('a parry that empties posture staggers 1.5 s and opens both; the finisher takes the blow', r.both.stagT === 1.5 && r.both.fin && r.both.hitFin && !r.both.ripLeft, r.both);

// end to end: a real Bandit's wind-up ends on the tick, the block raised just before it
const e2e = await page.evaluate(() => {
  const e = buildZoneEnemy(WORLD.scene, [], px + fwdX * 1.0, pz + fwdZ * 1.0, 'Bandit', null); if (!e.mesh.parent) WORLD.scene.add(e.mesh);
  e.locked = false; e.alert = true; e.combatYaw = Math.atan2(px - e.x, pz - e.z); e._yaw0 = e.combatYaw;
  e.telegraphMax = .5; e.telegraphT = .001; e.atkCd = 0; e.spd = 0; if (typeof e.posture !== 'number') initPosture(e);
  const keep = ZE; ZE = [e]; PHP = maxHP; blocking = true; lastBlockAttemptT = performance.now() / 1000 - .02; lastBlockAttemptG = playClockS - .02;
  try { tickZoneEnemies(1 / 60, performance.now(), WORLD.scene); } finally { ZE = keep; blocking = false; }
  const out = { lost: maxHP - PHP, open: typeof e._ripUntil === 'number' && e._ripUntil > performance.now() / 1000, post: +(e.posture / e.maxPosture).toFixed(2) };
  WORLD.scene.remove(e.mesh); staggered = staggered.filter(s => s.e !== e); return out;
});
check('through the world\'s own enemy tick, a parried Bandit opens a riposte and loses 40% posture', e2e.lost === 0 && e2e.open && e2e.post === .6, e2e);

stop();
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
