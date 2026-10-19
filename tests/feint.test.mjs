// The bandit's feint (Session 1140; combat.md's move sets, the third moves under Michael's A on DECISION #430). The humanoids'
// third move is the page's delayed swing: the wind-up pose tops out at the kind's own tell and holds there 0.3 s before the blow,
// so a roll timed to the usual tell is spent when it lands. One wind-up in four, a seeded roll of its own made after the heavy
// roll has said light, never twice running; the heavy stays one in four. A light blow in all else (the gold glow, the damage).
import { boot, check } from './lib/game.mjs';
const g = await boot(); const { page } = g;
await g.intoWorld();
const r = await page.evaluate(() => {
  const out = {};
  // 4,000 wind-ups of one keyed Bandit, again from the start, and another Bandit
  const winds = e => { e._blowN = 0; e._heavyLast = false; e._feintLast = false; let s = ''; const t = {};
    for (let i = 0; i < 4000; i++) { const v = +foeWindUp(e).toFixed(3); const c = e._heavy ? 'H' : e._feint ? 'F' : 'l'; s += c; t[c] = v; } return { s, t }; };
  const B = { id: 'feinttest:bandit:0', baseType: 'Bandit', baseName: 'Bandit', shape: 'humanoid' };
  const a = winds(B), b = winds(B), c = winds({ id: 'feinttest:bandit:1', baseType: 'Bandit', baseName: 'Bandit' });
  const n = (s, ch) => (s.match(new RegExp(ch, 'g')) || []).length / s.length;
  out.feint = n(a.s, 'F'); out.heavy = n(a.s, 'H'); out.twice = a.s.includes('FF'); out.same = a.s === b.s; out.other = c.s !== a.s;
  out.tellB = a.t;
  const tellOf = e => winds(e).t;
  out.tellK = tellOf({ id: 'k', baseType: 'Kobold Thief', baseName: 'Kobold Thief' }); out.tellS = tellOf({ id: 's', baseType: 'Skeleton', baseName: 'Skeleton' });
  // the heavy roll is untouched by the feint's: the same H at the same blows as foeHeavyRoll alone
  B._blowN = 0; B._heavyLast = false; let h = ''; for (let i = 0; i < 4000; i++) h += foeHeavyRoll(B) ? 'H' : '.';
  out.heavySame = h === a.s.replace(/[lF]/g, '.');
  // the families with no third move yet never feint
  out.none = [{ id: 'w', shape: 'wolf', name: 'Wolf' }, { id: 'g', baseType: 'Golem', baseName: 'Golem' }, { id: 't', baseType: 'Cave Troll', name: 'Cave Troll' },
    { id: 'f', isBoss: true, shape: 'humanoid' }, { id: 'sh', baseType: 'Shark', baseName: 'Shark' }].map(e => winds(e).s.includes('F'));
  return out; });
console.log(JSON.stringify(r));
check(`one wind-up in four is a feint: ${(r.feint * 100).toFixed(1)}% of 4,000 for a Bandit; the heavy still ${(r.heavy * 100).toFixed(1)}%`, Math.abs(r.feint - .25) < .03 && Math.abs(r.heavy - .25) < .03, r);
check('never two feints running', !r.twice, r);
check('seeded on the foe and the count: the same Bandit gives the same 4,000 again, another Bandit another', r.same && r.other, r);
check('the feint roll moves no heavy: the heavies fall on the same blows as the heavy roll alone gives', r.heavySame, r);
check(`the feint is the light tell + 0.3: Bandit ${r.tellB.l} → ${r.tellB.F}, kobold ${r.tellK.l} → ${r.tellK.F}, skeleton ${r.tellS.l} → ${r.tellS.F}; the heavy 1.0`,
  r.tellB.l === .57 && r.tellB.F === .87 && r.tellK.l === .45 && r.tellK.F === .75 && r.tellS.l === .6 && r.tellS.F === .9 && r.tellB.H === 1, r);
check('a wolf, a golem, a troll, a boss and the shark have no feint', r.none.every(x => !x), r.none);

// a live Bandit a step off, through the world's own enemy tick at 1/60: the pose, the glow, and a roll timed to the light tell
const live = await page.evaluate(() => {
  const keepF = foeFeintRoll;
  const one = (feint, rollBefore) => {
    const e = keyFoe(buildZoneEnemy(WORLD.scene, [], px + 1, pz, 'Bandit', null), 'feinttest:live:' + (feint ? 1 : 0)); if (!e.mesh.parent) WORLD.scene.add(e.mesh);
    e.locked = false; e.alert = true; e.x = px + 1; e.z = pz; e.telegraphT = 0; e.atkCd = 0; e.spd = 0; e._heavyLast = true;
    foeFeintRoll = () => feint;
    PHP = maxHP; blocking = false; ROLL = null; lastHitT = -99; lastBlockAttemptT = -99; lastBlockAttemptG = -99; PPOST.posture = PPOST.maxPosture = playerMaxPosture(); PPOST.stagUntil = 0;
    const keep = ZE; ZE = [e]; const o = { wind: [], glow: [], tell: 0, lost: 0 }; let started = -1;
    try {
      for (let i = 0; i < 90; i++) {
        e.x = px + 1; e.z = pz;
        const last = e.telegraphT > 0 && e.telegraphT <= 1 / 60 + 1e-9;
        if (last && rollBefore != null) ROLL = { t0: performance.now() / 1000 - rollBefore - (e.telegraphMax - .57), dur: .45, dist: 0, i0: .08, i1: .3, dx: 0, dz: 0, done: 0, fwd: 1 };
        tickZoneEnemies(1 / 60, performance.now(), WORLD.scene); ROLL = null;
        if (started < 0 && e.telegraphT > 0) { started = i; o.tell = +e.telegraphMax.toFixed(2); }
        if (started >= 0 && e.telegraphT > 0) { o.wind.push(+(e._wind || 0).toFixed(3)); const m = enemyBodyMesh(e).material.emissive; o.glow.push(+m.r.toFixed(2)); }
        if (started >= 0 && e.telegraphT <= 0) break;
      }
    } finally { ZE = keep; foeFeintRoll = keepF; }
    o.lost = maxHP - PHP; o.feintLeft = e._feint; PHP = maxHP; WORLD.scene.remove(e.mesh); return o; };
  // the roll pressed 0.15 s before the light blow would land: inside the untouchable 0.08–0.30
  return { light: one(false, null), feint: one(true, null), lightRoll: one(false, .15), feintRoll: one(true, .15) }; });
const F = live.feint, L = live.light, top = F.wind.findIndex(w => w >= .999), glowAt = a => a.findIndex(v => v > 0);
console.log(JSON.stringify({ tells: [L.tell, F.tell], frames: [L.wind.length, F.wind.length], top, glowL: glowAt(L.glow), glowF: glowAt(F.glow), lost: [L.lost, F.lost, live.lightRoll.lost, live.feintRoll.lost] }));
check(`a live feint winds up ${F.tell} s against the light ${L.tell}`, L.tell === .57 && F.tell === .87, { L: L.tell, F: F.tell });
check(`the pose tops out at the light tell (frame ${top} of ${F.wind.length}, the light's ${L.wind.length}) and holds through the pause`,
  Math.abs(top - (L.wind.length - 1)) <= 1 && F.wind.slice(top).every(w => w >= .999) && F.wind.slice(0, top).every((w, i, A) => i === 0 || w >= A[i - 1]), F.wind);
check(`the glow comes only in the feint's own last 0.15 s (frame ${glowAt(F.glow)} of ${F.glow.length}), gold as a light blow's`,
  glowAt(F.glow) >= F.glow.length - 10 && glowAt(F.glow) > top, F.glow);
check(`both land (${L.lost} and ${F.lost}), and the feint is spent with its blow`, L.lost > 0 && F.lost > 0 && !F.feintLeft, live);
check(`a roll pressed 0.15 s before the light blow is due: the light misses (${live.lightRoll.lost}), the feint lands (${live.feintRoll.lost})`, live.lightRoll.lost === 0 && live.feintRoll.lost > 0, live);
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
