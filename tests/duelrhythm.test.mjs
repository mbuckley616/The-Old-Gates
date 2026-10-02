// A blow in the air when Rowe yields (Session 405, the critic's 2026-10-01 note on Sessions 373–374): this measures, in
// the running game, how soon after the blow that makes her yield a player swinging in rhythm has already started the next
// one. A bot faces Rowe and swings whenever the cooldown is down, and stops clicking a set reaction time after the yield
// (game clock). Session 405 found a 0.25 s reaction murdered her. Session 408 (Michael's B on #96): a blow begun within
// 0.4 s of her kneeling is checked (*You check the blow.*) and lands on nothing, an arrow loosed in that time too; a blow
// begun later is murder, as before.
import { boot, check } from './lib/game.mjs';
const g = await boot(); const { page } = g;
await g.intoWorld();
await page.evaluate(() => WORLD.devUnlockAll());

const fresh = () => page.evaluate(() => {
  const F = WORLD.fstate(); const L = F.league; if (L.active) L.active.turnedIn = true;
  Object.assign(L, { done: 8, rank: 2, active: null, closed: false }); delete L.rowe;
  WORLD.tickDuel(0); forceTime(8); WORLD.anchoredPlaces();
  const seat = WORLD.siteAnywhere(WORLD.FACTIONS.league.seat); px = seat.x; pz = seat.z;
  WORLD.factionTopics(seat).find(t => /^Serve /.test(t.label)).fn(); const q = L.active;
  px = q.data.x; pz = q.data.z + 1; PHP = maxHP; dead = false; WORLD.tickDuel(1 / 60);
  const D = WORLD.duel; D.sgt.def.topics.find(x => x.label === 'Call it.').fn(); try { if (dlgOpen) closeDialog(); } catch (e) {}
  const e = D.rowe; e.atkCd = 1e9; e.spd = 0; return { state: D.q.data.state, hp: e.hp, max: e.maxHp }; });

// one fight: the bot swings on every ready frame until `react` game-seconds after the yield, then stops
const fight = (react) => page.evaluate(([react]) => new Promise(res => {
  const D = WORLD.duel, e = D.rowe; e.hp = Math.floor(e.maxHp * .25) + 1; e.atkCd = 1e9; e.telegraphT = 0;
  const log = { swings: [], hits: [], yieldAt: null, react, sf: +_weaponSwingFactor().toFixed(3), weapon: EQ.weapon ? EQ.weapon.name : 'fists', cd: null, checked: 0, hpAfter: [] };
  const _m = window._showMsg0 || (window._showMsg0 = showMsg); showMsg = function (t) { if (/You check the blow/.test(t)) log.checked++; return _m.apply(this, arguments); };
  const _r = window._resolveZoneStrike0 || (window._resolveZoneStrike0 = _resolveZoneStrike);
  _resolveZoneStrike = function (p) { const h0 = e.hp; const r = _r(p); log.hits.push({ t: +playClockS.toFixed(3), h0, h1: e.hp }); return r; };
  const t0 = playClockS; let frames = 0;
  const step = () => { frames++;
    const st = D.q.data.state; if (st === 'yielded' && log.yieldAt == null) log.yieldAt = +playClockS.toFixed(3);
    if (st === 'murder' || st === 'won' || frames > 600 || (log.yieldAt != null && playClockS - log.yieldAt > 3.4)) {
      _resolveZoneStrike = _r; showMsg = _m; res({ ...log, state: st, frames, t0: +t0.toFixed(3), hpEnd: e.hp, hp0: D.hp0 }); return; }
    stamina = maxStamina; px = e.x; pz = e.z + 1.2; yaw = 0;
    const clicking = log.yieldAt == null || playClockS - log.yieldAt < react;
    if (clicking && atkCd <= 0 && !_pendingStrike) { attack(false); log.swings.push(+playClockS.toFixed(3)); if (log.cd == null) log.cd = +atkCd.toFixed(3); }
    requestAnimationFrame(step); };
  requestAnimationFrame(step); }), [react]);

const runs = [];
for (const react of [0, 0.15, 0.3, 0.4, 1]) {
  const f0 = await fresh(); const r = await fight(react);
  const y = r.yieldAt; const after = r.swings.filter(t => t >= y); const pre = r.swings.filter(t => t < y);
  const next = after.length ? +(after[0] - y).toFixed(3) : null; const land = r.hits.find(h => h.t > y);
  runs.push({ react, state: r.state, weapon: r.weapon, sf: r.sf, cd: r.cd, yieldAt: y, nextSwingAfter: next, nextLandsAfter: land ? +(land.t - y).toFixed(3) : null, swings: r.swings.length, hits: r.hits.length, frames: r.frames, checked: r.checked, hpEnd: r.hpEnd, hp0: r.hp0,
    lateSwing: after.length ? +(after[after.length - 1] - y).toFixed(3) : null, hitsAfter: r.hits.filter(h => h.t > y).length });
  console.log('react', react, JSON.stringify(runs[runs.length - 1]));
}
const [r0, r15, r30, r40, r100] = runs;
check('the bot\'s blows make her yield in every run', runs.every(r => r.yieldAt != null), runs);
check('a player who stops clicking the instant she yields spares her', r0.state === 'won' && r0.nextSwingAfter == null, r0);
check('the next swing is begun about 0.2 s (game clock) after the yielding blow when swinging in rhythm', r30.nextSwingAfter != null && r30.nextSwingAfter < .3, r30);
check('a 0.15 s reaction stops in time and she is spared, as before', r15.state === 'won', r15);
check('a 0.3 s reaction (a fast human): the blow begun after she knelt lands, is checked, and she is spared (was murder)',
  r30.state === 'won' && r30.hitsAfter >= 1 && r30.checked >= 1 && r30.hpEnd === r30.hp0, r30);
check('a 0.4 s reaction: every blow after the yield begun inside 0.4 s, checked, spared (was murder)',
  r40.state === 'won' && r40.lateSwing < .4 && r40.checked >= 1 && r40.hpEnd === r40.hp0, r40);
check('a 1 s reaction: the third swing, begun about 0.8 s after she knelt, lands and is murder', r100.state === 'murder' && r100.lateSwing > .4, r100);

// arrows: the melee bot makes her yield, then from 3 units off one arrow is loosed `delay` s after she kneels
const arrow = (delay) => page.evaluate(([delay]) => new Promise(res => {
  const D = WORLD.duel, e = D.rowe; e.hp = Math.floor(e.maxHp * .25) + 1; e.atkCd = 1e9; e.telegraphT = 0;
  const w0 = EQ.weapon, a0 = EQ.ammo, tp0 = thirdPerson, pi0 = pitch; let yAt = null, shotAt = null, frames = 0, checked = 0, minHp = 1e9;
  const _m = showMsg; showMsg = function (t) { if (/You check the blow/.test(t)) checked++; return _m.apply(this, arguments); };
  const done = (st) => { EQ.weapon = w0; EQ.ammo = a0; thirdPerson = tp0; pitch = pi0; showMsg = _m;
    res({ delay, state: st, yieldAt: yAt, shotAfter: shotAt == null ? null : +(shotAt - yAt).toFixed(3), checked, minHp, hp0: D.hp0, hpEnd: e.hp, frames }); };
  const step = () => { frames++; const st = D.q.data.state;
    if (st === 'yielded' && yAt == null) { yAt = playClockS; EQ.weapon = { name: 'Test Bow', ico: '🏹', type: 'equip', slot: 'weapon', atk: [5, 7], weaponShape: 'bow', wType: 'pierce', twoHand: true, weight: 3 };
      EQ.ammo = { name: 'Iron Arrow', ico: '➶', type: 'ammo', qty: 50, arrowDmg: [2, 4] }; thirdPerson = false; pitch = -.12; }
    if (st === 'murder' || st === 'won' || frames > 900 || (yAt != null && playClockS - yAt > 3.4)) { done(st); return; }
    stamina = maxStamina; yaw = 0;
    if (yAt == null) { px = e.x; pz = e.z + 1.2; if (atkCd <= 0 && !_pendingStrike) attack(false); }
    else { px = e.x; pz = e.z + 3; if (st === 'yielded') minHp = Math.min(minHp, e.hp);
      if (shotAt == null && playClockS - yAt >= delay) { fireArrow(1); shotAt = playClockS; } }
    requestAnimationFrame(step); };
  requestAnimationFrame(step); }), [delay]);
const arrows = [];
for (const delay of [0.1, 0.6]) { await fresh(); const r = await arrow(delay); arrows.push(r); console.log('arrow', delay, JSON.stringify(r)); }
const [a1, a6] = arrows;
check('an arrow loosed 0.1 s after she kneels is checked: spared', a1.state === 'won' && a1.checked >= 1 && a1.hpEnd === a1.hp0, a1);
check('an arrow loosed 0.6 s after she kneels is murder', a6.state === 'murder' && a6.shotAfter > .4, a6);
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
