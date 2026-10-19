// The two-hit string (Session 1162; combat.md's move sets, Michael's A on DECISION #438): the wolf's lunge and snap, the troll's
// sweep and stamp. One wind-up in four, a seeded roll of its own after the heavy roll has said light, never twice running. The first
// blow is a light blow; the second comes 0.45 s after it, a wind-up of its own with a gold glow in its last 0.15 s, so one roll cannot
// cover both. The snap is a second bite with no second leap; the stamp reaches 1.6 m hull to hull all round the troll. A perfect
// parry of the first staggers the foe and the second never comes.
import { boot, check } from './lib/game.mjs';
const g = await boot(); const { page } = g;
await g.intoWorld();
const r = await page.evaluate(() => {
  const out = {};
  const winds = e => { e._blowN = 0; e._heavyLast = false; e._feintLast = false; e._stringLast = false; let s = ''; const t = {};
    for (let i = 0; i < 4000; i++) { const v = +foeWindUp(e).toFixed(3); const c = e._heavy ? 'H' : e._feint ? 'F' : e._string ? 'S' : 'l'; s += c; t[c] = v; } return { s, t }; };
  const n = (s, ch) => (s.match(new RegExp(ch, 'g')) || []).length / s.length;
  const W = { id: 'stringtest:wolf:0', shape: 'wolf', name: 'Wolf' }, T = { id: 'stringtest:troll:0', baseType: 'Cave Troll', name: 'Cave Troll' };
  const a = winds(W), b = winds(W), c = winds({ id: 'stringtest:wolf:1', shape: 'wolf', name: 'Wolf' }), t = winds(T);
  out.wolf = n(a.s, 'S'); out.wolfH = n(a.s, 'H'); out.troll = n(t.s, 'S'); out.trollH = n(t.s, 'H');
  out.twice = a.s.includes('SS') || t.s.includes('SS'); out.same = a.s === b.s; out.other = c.s !== a.s; out.tells = { wolf: a.t, troll: t.t };
  W._blowN = 0; W._heavyLast = false; let h = ''; for (let i = 0; i < 4000; i++) h += foeHeavyRoll(W) ? 'H' : '.';
  out.heavySame = h === a.s.replace(/[lS]/g, '.');
  out.none = [{ id: 'b', baseType: 'Bandit', baseName: 'Bandit' }, { id: 'g', baseType: 'Golem', baseName: 'Golem' }, { id: 'sp', baseType: 'Spider', baseName: 'Spider' },
    { id: 'f', isBoss: true, shape: 'wolf' }, { id: 'sh', baseType: 'Shark', baseName: 'Shark' }].map(e => winds(e).s.includes('S'));
  return out; });
console.log(JSON.stringify(r));
check(`one wind-up in four is a string: the wolf ${(r.wolf * 100).toFixed(1)}%, the troll ${(r.troll * 100).toFixed(1)}% of 4,000; the heavy still ${(r.wolfH * 100).toFixed(1)}% and ${(r.trollH * 100).toFixed(1)}%`,
  Math.abs(r.wolf - .25) < .03 && Math.abs(r.troll - .25) < .03 && Math.abs(r.wolfH - .25) < .03 && Math.abs(r.trollH - .25) < .03, r);
check('never two strings running', !r.twice, r);
check('seeded on the foe and the count: the same wolf gives the same 4,000 again, another wolf another', r.same && r.other, r);
check('the string roll moves no heavy: the heavies fall on the same blows as the heavy roll alone gives', r.heavySame, r);
check(`the string's first blow is the light tell (wolf ${r.tells.wolf.S}, troll ${r.tells.troll.S})`, r.tells.wolf.S === r.tells.wolf.l && r.tells.troll.S === r.tells.troll.l, r.tells);
check('a bandit, a golem, a spider, a boss and the shark have no string', r.none.every(x => !x), r.none);

// live foes through the world's own enemy tick at 1/60, the string forced on: every wind-up's length, the damage each blow does,
// where the foe stands at each blow, and the second wind-up's glow
const live = await page.evaluate(() => {
  const keepS = foeStringRoll, keepF = foeFeintRoll;
  const one = (kind, o) => {
    o = o || {};
    const e = keyFoe(buildZoneEnemy(WORLD.scene, [], px + 3, pz, kind, null), 'stringtest:live:' + kind); if (!e.mesh.parent) WORLD.scene.add(e.mesh);
    const ex = px + reachTo(e, o.at != null ? o.at : .3), ez = pz, p0 = { x: px, z: pz };
    e.locked = false; e.alert = true; e.x = ex; e.z = ez; e.telegraphT = 0; e.atkCd = 0; e.spd = 0; e._heavyLast = true; e._stringLast = false;
    foeStringRoll = () => o.string !== false; foeFeintRoll = () => false;
    PHP = maxHP; blocking = false; ROLL = null; lastHitT = -99; lastBlockAttemptT = -99; lastBlockAttemptG = -99; PPOST.posture = PPOST.maxPosture = playerMaxPosture(); PPOST.stagUntil = 0;
    staggered.length = 0;
    const keep = ZE; ZE = [e]; const res = { tells: [], lost: [], at: [], glow2: [], frames2: 0 }; let prevT = 0, blows = 0;
    try {
      for (let i = 0; i < 160 && blows < 2; i++) {
        const hp0 = PHP, inTell = e.telegraphT > 0, last = inTell && e.telegraphT <= 1 / 60 + 1e-9;
        if (last && o.parryFirst && blows === 0) { blocking = true; lastBlockAttemptG = playClockS - .02; }
        if (last && o.rollFirst && blows === 0) ROLL = { t0: performance.now() / 1000 - .15, dur: .45, dist: 0, i0: .08, i1: .3, dx: 0, dz: 0, done: 0, fwd: 1 };
        const x0 = e.x, z0 = e.z;
        tickZoneEnemies(1 / 60, performance.now(), WORLD.scene); ROLL = null; blocking = false;
        if (inTell && (e.telegraphT <= 0 || e.telegraphT > prevT)) { blows++; res.lost.push(hp0 - PHP); res.at.push(+Math.hypot(e.x - x0, e.z - z0).toFixed(3)); PHP = maxHP;
          if (blows === 1 && o.after) o.after(e); }
        if (e.telegraphT > 0 && (prevT <= 0 || e.telegraphT > prevT)) res.tells.push(+e.telegraphMax.toFixed(2));
        if (e._string === 2 && e.telegraphT > 0) { res.frames2++; res.glow2.push(+enemyBodyMesh(e).material.emissive.r.toFixed(2)); }
        prevT = e.telegraphT;
        if (blows >= 1 && e.telegraphT <= 0 && !(e._string === 2)) break;
      }
    } finally { ZE = keep; foeStringRoll = keepS; foeFeintRoll = keepF; staggered.length = 0; px = p0.x; pz = p0.z; }
    e._heavy = false; res.light = [foeBlow(e, e.dmg), foeBlow(e, e.dmg + 3)];
    res.leftOver = e._string; WORLD.scene.remove(e.mesh); PHP = maxHP; return res; };
  const back = (e, d) => { px = e.x - Math.sin(e.combatYaw) * d; pz = e.z - Math.cos(e.combatYaw) * d; };
  const out = {
    wolf: one('Wolf'), wolfPlain: one('Wolf', { string: false }),
    wolfLeap: one('Wolf', { at: 1.4, after: e => { px += .5 * Math.sin(e.combatYaw); pz += .5 * Math.cos(e.combatYaw); } }),
    wolfRoll: one('Wolf', { rollFirst: true }), wolfParry: one('Wolf', { parryFirst: true }),
    troll: one('Cave Troll'),
    trollBehind: one('Cave Troll', { after: e => back(e, reachTo(e, 1.2)) }),
    trollFar: one('Cave Troll', { after: e => back(e, reachTo(e, 2.0)) }),
  };
  // a light sweep (the first blow) does not reach behind the troll; the stamp does
  const e = keyFoe(buildZoneEnemy(WORLD.scene, [], px + 3, pz, 'Cave Troll', null), 'stringtest:arc'); e.x = px + 3; e.z = pz; e.combatYaw = Math.atan2(px - e.x, pz - e.z);
  const sx = px, sz = pz; px = e.x - Math.sin(e.combatYaw) * reachTo(e, 1.2); pz = e.z - Math.cos(e.combatYaw) * reachTo(e, 1.2);
  e._string = 1; out.sweepBehind = strikeReaches(e); e._string = 2; out.stampBehind = strikeReaches(e); e._string = 0; px = sx; pz = sz; WORLD.scene.remove(e.mesh);
  return out; });
console.log(JSON.stringify(live));
const W = live.wolf, glowAt = a => a.findIndex(v => v > 0);
check(`a wolf's string: two wind-ups, ${W.tells.join(' then ')} s, and both bites land (${W.lost.join(' and ')})`,
  W.tells.length === 2 && W.tells[1] === .45 && W.lost.length === 2 && W.lost.every(x => x > 0) && !W.leftOver, W);
check(`each is a light blow: the wolf's bites ${W.lost.join(' and ')} and the troll's ${live.troll.lost.join(' and ')}, in the light ranges ${W.light.join('–')} and ${live.troll.light.join('–')}`,
  [W, live.troll].every(R => R.lost.every(x => x >= R.light[0] && x <= R.light[1])), { W, troll: live.troll });
check(`the second wind-up glows only in its last 0.15 s (frame ${glowAt(W.glow2)} of ${W.frames2}), gold`,
  W.frames2 >= 26 && W.frames2 <= 28 && glowAt(W.glow2) >= W.frames2 - 10 && glowAt(W.glow2) > 0, W.glow2);
const Lp = live.wolfLeap;
check(`the wolf leaps at the first bite (${Lp.at[0]} m) and not at the snap (${Lp.at[1]} m): stepped back half a metre, the snap misses (${Lp.lost[1]})`,
  Lp.at[0] > .3 && Lp.at[1] === 0 && Lp.lost[1] === 0, Lp);
check(`one roll covers one blow: the roll takes the first bite (${live.wolfRoll.lost[0]}) and the snap lands (${live.wolfRoll.lost[1]})`,
  live.wolfRoll.lost[0] === 0 && live.wolfRoll.lost[1] > 0, live.wolfRoll);
check(`a perfect parry of the first bite staggers the wolf and the snap never comes (${live.wolfParry.tells.length} wind-up)`,
  live.wolfParry.tells.length === 1 && live.wolfParry.lost[0] === 0 && !live.wolfParry.leftOver, live.wolfParry);
check(`a troll's string: the sweep then the stamp (${live.troll.tells.join(' then ')} s), both land (${live.troll.lost.join(' and ')})`,
  live.troll.tells.length === 2 && live.troll.tells[1] === .45 && live.troll.lost.every(x => x > 0), live.troll);
check(`behind the troll at 1.2 m the sweep would miss (${live.sweepBehind}) and the stamp lands (${live.trollBehind.lost[1]}); at 2.0 m it misses (${live.trollFar.lost[1]})`,
  !live.sweepBehind && live.stampBehind && live.trollBehind.lost[1] > 0 && live.trollFar.lost[1] === 0, live);
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
