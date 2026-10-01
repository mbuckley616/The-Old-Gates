// A blow in the air when Rowe yields (Session 405, the critic's 2026-10-01 note on Sessions 373–374): the spare check is
// `e.hp < DUEL.hp0`, so any blow that lands after the yield is murder. This measures, in the running game, how soon after
// the blow that makes her yield a player swinging in rhythm has already started the next one. A bot faces Rowe and swings
// whenever the cooldown is down, and stops clicking a set reaction time after the yield (game clock). Nothing in the game
// changes; the numbers go to Michael with a question (docs/decisions.md).
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
  const log = { swings: [], hits: [], yieldAt: null, react, sf: +_weaponSwingFactor().toFixed(3), weapon: EQ.weapon ? EQ.weapon.name : 'fists', cd: null };
  const _r = window._resolveZoneStrike0 || (window._resolveZoneStrike0 = _resolveZoneStrike);
  _resolveZoneStrike = function (p) { const h0 = e.hp; const r = _r(p); log.hits.push({ t: +playClockS.toFixed(3), h0, h1: e.hp }); return r; };
  const t0 = playClockS; let frames = 0;
  const step = () => { frames++;
    const st = D.q.data.state; if (st === 'yielded' && log.yieldAt == null) log.yieldAt = +playClockS.toFixed(3);
    if (st === 'murder' || st === 'won' || frames > 600 || (log.yieldAt != null && playClockS - log.yieldAt > 3.4)) {
      _resolveZoneStrike = _r; res({ ...log, state: st, frames, t0: +t0.toFixed(3) }); return; }
    stamina = maxStamina; px = e.x; pz = e.z + 1.2; yaw = 0;
    const clicking = log.yieldAt == null || playClockS - log.yieldAt < react;
    if (clicking && atkCd <= 0 && !_pendingStrike) { attack(false); log.swings.push(+playClockS.toFixed(3)); if (log.cd == null) log.cd = +atkCd.toFixed(3); }
    requestAnimationFrame(step); };
  requestAnimationFrame(step); }), [react]);

const runs = [];
for (const react of [0, 0.15, 0.25, 0.4]) {
  const f0 = await fresh(); const r = await fight(react);
  const y = r.yieldAt; const after = r.swings.filter(t => t >= y); const pre = r.swings.filter(t => t < y);
  const next = after.length ? +(after[0] - y).toFixed(3) : null; const land = r.hits.find(h => h.t > y);
  runs.push({ react, state: r.state, weapon: r.weapon, sf: r.sf, cd: r.cd, yieldAt: y, nextSwingAfter: next, nextLandsAfter: land ? +(land.t - y).toFixed(3) : null, swings: r.swings.length, hits: r.hits.length, frames: r.frames });
  console.log('react', react, JSON.stringify(runs[runs.length - 1]));
}
const [r0, r15, r25, r40] = runs;
check('the bot\'s blows make her yield in every run', runs.every(r => r.yieldAt != null), runs);
check('a player who stops clicking the instant she yields spares her', r0.state === 'won' && r0.nextSwingAfter == null, r0);
check('the next swing is begun about 0.2 s (game clock) after the yielding blow when swinging in rhythm', r25.nextSwingAfter != null && r25.nextSwingAfter < .3, r25);
check('with a quarter-second reaction (a fast human), the blow already begun lands: murder', r25.state === 'murder', r25);
check('a 0.15 s reaction stops in time and she is spared; a 0.4 s one does not', r15.state === 'won' && r40.state === 'murder', { r15: r15.state, r40: r40.state, r15n: r15.nextSwingAfter, r40n: r40.nextSwingAfter });
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
