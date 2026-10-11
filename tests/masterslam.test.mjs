// The cavern master's slam (Session 404, Michael's A on #95). A lair's master winds up for 0.9 s every 8–10 s with you
// within six units, a ring of 3 units shows on the floor, and the ground blow lands for a share of your health (S617: 45%, 60% with no chest piece), through
// any block: out of the ring or mid-roll you take nothing. The master's 1.6× damage (Session 130) now reaches its blows.
// The loop is paused (the inventory flag) and the slam driven at fixed 1/60 ticks; one slam is then left to the real loop.
// Session 434: the stage stands you at the master's floor height. The live check failed whenever the lair put its master on
// floor 2, because the loop sets the floor from jumpY and put you back on floor 1; it now runs before the kill check.
import { boot, check } from './lib/game.mjs';
const g = await boot(); const { page } = g;
await g.intoWorld();

await page.evaluate(() => { level = 6; const _lf = lairFinish; window._preMult = null;
  lairFinish = function (p) { window._preMult = new Map(ENEMIES.map(e => [e, e.dmgMult])); return _lf(p); };
  const p = Object.assign({}, PORTALS[0], { theme: 'deep', seed: 4021, size: 'medium', interior: 'cave', zone: 'world', tutorial: false, lair: { place: 'Test', boss: 'Troll King' } }); goToDungeon(p); });
for (let k = 0; k < 40 && !(await page.evaluate(() => activeZoneId === 'dungeon' && scene === dScene && !!window._lairBoss)); k++) await page.waitForTimeout(500);
await page.waitForTimeout(1000);

const setup = await page.evaluate(() => { const e = window._lairBoss; if (!e) return { none: true };
  const pre = window._preMult.get(e); const k = 1.6 * (1 + level * .04);
  return { name: e.name, master: !!e.master, pre, post: e.dmgMult, k: +(e.dmgMult / pre).toFixed(3), want: +k.toFixed(3), others: ENEMIES.filter(x => x !== e && x.master).length, base: e.baseType, maxHP: effMaxHP(), armour: _armour(), diff: currentPortal && currentPortal.diffScale ? currentPortal.diffScale.dmg : null, kinds: [...new Set(ENEMIES.map(x => x.baseType + ':' + x.dmgMult.toFixed(1)))].slice(0, 12) }; });
check('the lair\'s deepest foe is its master, the only one', !setup.none && setup.master && setup.others === 0, setup);
check('the master\'s blows carry 1.6 × (1 + level × .04) of its kind\'s (was a no-op on e.dmg)', Math.abs(setup.k - setup.want) < .01, setup);

// a stage: pause the loop, the player on the master's floor at a distance along +x, the master alert and facing
await page.evaluate(() => { window._stage = (d) => { const e = window._lairBoss; invOpen = true; currentFloor = e.floor || 1;
  ENEMIES.forEach(x => { if (x !== e) { x.dead = true; if (x.mesh) x.mesh.visible = false; } });
  e.disguised = false; e.dormant = false; /* S435: the roster is random, and a Mimic master sits disguised and never slams */
  px = e.x + d; pz = e.z; jumpY = e.floor === 2 ? FLOOR2_Y : 0; /* the loop reads the floor from jumpY: a master on floor 2 with you on 1 is never ticked (S434) */ PHP = 9999; dead = false; ROLL = null; blocking = false; staggered.length = 0;
  e.alert = true; e.dead = false; e.hp = e.maxHp; e.telegraphT = 0; e.atkCd = 0; e._slamT = 0; e._slamCd = 0; e._slamLast = null; return e; };
  // tick until the slam lands (or n ticks); at tick `at` run a hook (to move, roll or stagger mid-tell)
  window._drive = (n, hook) => { const e = window._lairBoss; let t = 0, held = 0, maxWind = 0, ringMax = 0, startedAt = -1; const s0 = e._slams || 0;
    for (; t < n; t++) { const now = performance.now(); if (hook) hook(t, e, now);
      const dist = Math.hypot(px - e.x, pz - e.z); const r = tickMasterSlam(e, 1 / 60, dist, now);
      if (r) { held++; if (startedAt < 0) startedAt = t; } maxWind = Math.max(maxWind, e._wind || 0); if (e._slamRing && e._slamRing.visible) ringMax = Math.max(ringMax, e._slamRing.material.opacity);
      if ((e._slams || 0) > s0 || (startedAt >= 0 && !(e._slamT > 0))) break; }
    return { ticks: t, held, startedAt, maxWind: +maxWind.toFixed(2), ringMax: +ringMax.toFixed(2), landed: (e._slams || 0) > s0, last: e._slamLast, hp: PHP, ringOn: !!(e._slamRing && e._slamRing.visible), ringR: e._slamRing ? e._slamRing.geometry.parameters.outerRadius : 0, cd: +(e._slamCd || 0).toFixed(2), wind: e._wind || 0 }; }; });

// A. standing in the ring, a block raised at the right moment: the whole slam lands
const a = await page.evaluate(() => { const e = window._stage(2); const def2 = _armour(), m = e.dmgMult;
  const r = window._drive(120, (t) => { blocking = true; lastBlockAttemptG = playClockS; lastBlockAttemptT = performance.now() / 1000; });
  blocking = false; /* S617 (#181 C): 45% of max health, 60% with no chest piece, through a ward */ const want = _warded(Math.max(1, Math.round(maxHP * (EQ.chest ? .45 : .6))), e), lo = want, hi = want;
  return { ...r, dmg: 9999 - PHP, lo, hi }; });
check('the slam starts at once with you within six units and its timer spent', a.startedAt === 0, a);
check('the tell is 0.9 s: 54 ticks held still, then it lands', a.landed && a.held >= 53 && a.held <= 56, a);
check('the wind-up pose and the ring show through the tell, the ring 3 units, gone after', a.maxWind > .95 && a.ringMax > .6 && a.ringR === 3 && !a.ringOn && a.wind === 0, a);
check('in the ring, blocking (a perfect parry\'s timing): 45% of your max health (60% with no chest piece), nothing taken off', a.dmg >= a.lo && a.dmg <= a.hi && a.last === a.dmg, a);
check('the next slam waits 8–10 s', a.cd >= 8 && a.cd <= 10, a);

// B. out of the ring when it lands (step back from 2 to 4 units mid-tell)
const b = await page.evaluate(() => { window._stage(2); const e = window._lairBoss; const r = window._drive(120, (t) => { if (t === 30) px = e.x + 4; }); return { ...r, dmg: 9999 - PHP }; });
check('stepped out of the ring before it lands: nothing taken', b.landed && b.dmg === 0 && b.last === 'clear', b);

// C. in the ring, mid-roll in the untouchable window as it lands
const c = await page.evaluate(() => { window._stage(1.5); const r = window._drive(120, (t, e, now) => { if (t === 50) ROLL = { t0: now / 1000 - .15, dur: .45, dist: 0, i0: .08, i1: .30, dx: 0, dz: 0, done: 0, heavy: false, fwd: 1 }; }); ROLL = null; return { ...r, dmg: 9999 - PHP }; });
check('a roll timed through the landing: nothing taken', c.landed && c.dmg === 0 && c.last === 'rolled', c);

// D. a roll too early (its window spent) is no help
const d = await page.evaluate(() => { window._stage(1.5); const r = window._drive(120, (t, e, now) => { if (t === 10) ROLL = { t0: now / 1000 - .4, dur: .45, dist: 0, i0: .08, i1: .30, dx: 0, dz: 0, done: 0, heavy: false, fwd: 1 }; }); ROLL = null; return { ...r, dmg: 9999 - PHP }; });
check('a roll whose window has passed: the slam lands', d.landed && d.dmg > 0, d);

// E. staggered mid-tell: the slam is lost
const e5 = await page.evaluate(() => { window._stage(2); const r = window._drive(120, (t, e) => { if (t === 20) staggered.push({ e, t: 1.2 }); }); staggered.length = 0; return { ...r, dmg: 9999 - PHP }; });
check('a master staggered mid-tell loses its slam, the ring gone', !e5.landed && e5.dmg === 0 && !e5.ringOn && e5.wind === 0 && e5.cd >= 8, e5);

// F. no slam with you seven units off; and an ordinary foe never slams
const f = await page.evaluate(() => { const e = window._stage(7); const r = window._drive(60); const o = ENEMIES.find(x => x !== e); let os = false;
  if (o) { o.dead = false; o.alert = true; for (let k = 0; k < 600; k++) if (tickMasterSlam(o, 1 / 60, 1, performance.now()) || o._slamT > 0) os = true; o.dead = true; }
  return { ...r, other: !!o, os }; });
check('seven units off, the master does not wind up', f.startedAt < 0 && !f.landed && f.held === 0, f);
check('a foe that is not the master never slams (ten seconds beside it)', f.other && !f.os, f);

// H. the real loop: the master slams in play
const s0 = await page.evaluate(() => { const e = window._stage(2); e._slamCd = 0; PHP = 9999; invOpen = false; return e._slams || 0; });
let live = null;
for (let k = 0; k < 40; k++) { await g.frames(5); live = await page.evaluate(() => { const e = window._lairBoss; return { slams: e._slams || 0, slamT: +(e._slamT || 0).toFixed(2), dead }; }); if (live.slams > s0) break; }
check('in the running game the master winds up and lands its slam', live && live.slams > s0, { s0, ...live });
// G. killed mid-tell: the ring goes with it
const gk = await page.evaluate(() => { const e = window._stage(2); window._drive(20); const on = e._slamRing.visible; killE(e); const r = { on, after: e._slamRing.visible }; e.dead = false; return r; });
check('the master killed mid-tell takes its ring with it', gk.on && !gk.after, gk);

check('no page errors', g.errs.length === 0, g.errs);
await g.close();
