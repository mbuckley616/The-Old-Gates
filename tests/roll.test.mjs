// The roll and the arc (Session 275; combat, Michael's B, A's first piece). Q rolls you 2.6 units in 0.45 s the way you
// are moving (back when standing), untouchable from 0.08 to 0.30 s, for 18 stamina; over 70% of your carry weight
// it is 1.8 units in 0.6 s, untouchable to 0.24 s. An enemy's blow lands in an arc of the way it faced at the
// wind-up: 1.6 units and 90°, a troll's sweep 2.4 units and 140°. The roll reads performance.now(), so the game's
// own loop can move the player at whatever frame rate the runner gives and the distance must still come out.
import { boot, check } from './lib/game.mjs';
const g = await boot(); const { page } = g;
await g.intoWorld();

// the roll through the game's own loop: stand, roll, wait out the wall clock, measure
const rollOnce = () => page.evaluate(() => new Promise(res => {
  stamina = maxStamina; staminaCD = 0; onGround = true;
  const x0 = px, z0 = pz, f = { x: fwdX, z: fwdZ }, s0 = stamina;
  const ok = startRoll(performance.now() / 1000, {}); const r = ROLL && { ...ROLL }; const s1 = stamina;
  const t = setInterval(() => { if (ROLL) return; clearInterval(t);
    const dx = px - x0, dz = pz - z0, d = Math.hypot(dx, dz);
    res({ ok, heavy: r && r.heavy, dur: r && r.dur, d: +d.toFixed(3), back: +(-(dx * f.x + dz * f.z) / (d || 1)).toFixed(3), stam: s0 - s1 }); }, 50);
}));
// face open ground: try headings until one has 3 clear units behind the player
await page.evaluate(() => { for (let a = 0; a < 16; a++) { yaw = a * Math.PI / 8; const bx = Math.sin(yaw), bz = Math.cos(yaw);
  let clear = true; for (let s = .3; s <= 3.2; s += .3) if (currentZoneSolid(px + bx * s, pz + bz * s)) { clear = false; break; } if (clear) break; } });
await g.frames(3);
const light = await rollOnce();
check('a roll standing still goes back 2.6 units', light.ok && !light.heavy && Math.abs(light.d - 2.6) < .12 && light.back > .97, light);
check('it costs 18 stamina', light.stam === 18, light);

// heavy: a load over 70% of what you can carry
const heavy = await page.evaluate(() => { const mc = maxCarry(); BAG.push({ name: 'Test Ballast', type: 'misc', weight: mc * .75, qty: 1, _ballast: 1 }); return totalCarryWeight() / mc; });
const hr = await rollOnce();
await page.evaluate(() => { const i = BAG.findIndex(it => it._ballast); if (i >= 0) BAG.splice(i, 1); });
check('over 70% of carry weight it is 1.8 units in 0.6 s', hr.ok && hr.heavy && hr.dur === .6 && Math.abs(hr.d - 1.8) < .12, { load: +heavy.toFixed(2), ...hr });

const r = await page.evaluate(() => {
  const out = {};
  // the distance does not depend on the frames: 60 ticks, 5 ticks, or one
  const dist = steps => { ROLL = { t0: 100, dur: .45, dist: 2.6, i0: .08, i1: .3, dx: 1, dz: 0, done: 0, fwd: 1 }; let s = 0;
    for (let i = 1; i <= steps; i++) { const m = tickRoll(100 + .45 * i / steps); s += m.dx; } return +s.toFixed(4); };
  out.d60 = dist(60); out.d5 = dist(5); out.d1 = dist(1); out.cleared = ROLL === null;
  // winded: no roll
  ROLL = null; stamina = 10; staminaCD = 0; out.winded = startRoll(performance.now() / 1000); stamina = maxStamina;
  // the window
  const mk = () => ({ name: 'Test Bandit', x: px + fwdX, z: pz + fwdZ, mesh: new THREE.Group(), dmg: 10 });
  const hitAt = dt => { blocking = false; PHP = maxHP; const t0 = 1000; ROLL = { t0, dur: .45, dist: 0, i0: .08, i1: .3, dx: 0, dz: 0, done: 0, fwd: 1 };
    executeStrike(mk(), 20, (t0 + dt) * 1000); ROLL = null; const lost = maxHP - PHP; PHP = maxHP; return lost; };
  out.at02 = hitAt(.02); out.at15 = hitAt(.15); out.at29 = hitAt(.29); out.at35 = hitAt(.35);
  // the arc: an enemy facing +z from the player's spot minus 1 along z
  const at = (dx, dz, yawE, name, boss) => { const e = { name: name || 'Bandit', x: px - dx, z: pz - dz, combatYaw: yawE ?? 0 };
    if (boss) { e.isBoss = true; e.bossDef = { biteRange: 2.0 }; } return strikeReaches(e); };
  const deg = a => [Math.sin(a * Math.PI / 180), Math.cos(a * Math.PI / 180)];
  const p = (r, a) => { const [s, c] = deg(a); return [s * r, c * r]; };
  out.front15 = at(...p(1.5, 0)); out.front17 = at(...p(1.7, 0));
  out.side40 = at(...p(1.2, 40)); out.side60 = at(...p(1.2, 60)); out.behind = at(...p(1.0, 180));
  out.troll22_60 = at(...p(2.2, 60), 0, 'Cave Troll'); out.troll22_80 = at(...p(2.2, 80), 0, 'Cave Troll'); out.troll26 = at(...p(2.6, 0), 0, 'Cave Troll');
  out.boss19 = at(...p(1.9, 0), 0, 'Faolchú', true); out.boss21 = at(...p(2.1, 0), 0, 'Faolchú', true);
  return out;
});
console.log(JSON.stringify(r));
check('the distance is the same at 60 ticks, 5 or 1', r.d60 === 2.6 && r.d5 === 2.6 && r.d1 === 2.6 && r.cleared, r);
check('winded (10 stamina), no roll', r.winded === false, r);
check('a blow at 0.15 s and 0.29 s into the roll misses', r.at15 === 0 && r.at29 === 0, r);
check('a blow at 0.02 s or 0.35 s lands', r.at02 > 0 && r.at35 > 0, r);
check('the arc: 1.5 ahead lands, 1.7 does not', r.front15 && !r.front17, r);
check('the arc: 40° off lands, 60° off and behind do not', r.side40 && !r.side60 && !r.behind, r);
check('a troll sweeps 2.4 units and 140°: 60° off lands, 80° off and 2.6 out do not', r.troll22_60 && !r.troll22_80 && !r.troll26, r);
check('the Faolchú keeps its 2.0 reach', r.boss19 && !r.boss21, r);

// end to end through the world's own enemy tick: a real bandit whose wind-up ends this tick
const e2e = await page.evaluate(() => {
  const out = {};
  const one = (place, roll) => {
    const e = buildZoneEnemy(WORLD.scene, [], px + 3, pz, 'Bandit', null); if (!e.mesh.parent) WORLD.scene.add(e.mesh);
    e.locked = false; e.alert = true; place(e); e.combatYaw = Math.atan2(px - e.x, pz - e.z); e._yaw0 = e.combatYaw;
    e.telegraphMax = .5; e.telegraphT = .001; e.atkCd = 0; e.spd = 0;
    const keep = ZE; ZE = [e]; PHP = maxHP; blocking = false;
    if (roll) ROLL = { t0: performance.now() / 1000 - .15, dur: .45, dist: 0, i0: .08, i1: .3, dx: 0, dz: 0, done: 0, fwd: 1 };
    try { tickZoneEnemies(1 / 60, performance.now(), WORLD.scene); } finally { ZE = keep; ROLL = null; }
    const lost = maxHP - PHP; PHP = maxHP; WORLD.scene.remove(e.mesh); return lost; };
  // 1.5 straight ahead of where it faced: it lands (before, 1.4 was the limit and this whiffed)
  out.ahead = one(e => { e.x = px + 1.5; e.z = pz; });
  return out;
});
// the second case: the facing is frozen towards where you were, so move the player round it after placing
const e2 = await page.evaluate(() => {
  const e = buildZoneEnemy(WORLD.scene, [], px + 1, pz, 'Bandit', null); if (!e.mesh.parent) WORLD.scene.add(e.mesh);
  e.locked = false; e.alert = true; e.x = px + 1; e.z = pz; e.combatYaw = Math.atan2(px - e.x, pz - e.z);
  const a = 70 * Math.PI / 180, fx = Math.sin(e.combatYaw), fz = Math.cos(e.combatYaw);
  const x0 = px, z0 = pz; px = e.x + (fx * Math.cos(a) - fz * Math.sin(a)); pz = e.z + (fz * Math.cos(a) + fx * Math.sin(a));
  e.telegraphMax = .5; e.telegraphT = .001; e.atkCd = 0; e.spd = 0;
  const keep = ZE; ZE = [e]; PHP = maxHP; blocking = false;
  try { tickZoneEnemies(1 / 60, performance.now(), WORLD.scene); } finally { ZE = keep; }
  const lost = maxHP - PHP; PHP = maxHP; WORLD.scene.remove(e.mesh); px = x0; pz = z0;
  const e3 = buildZoneEnemy(WORLD.scene, [], px + 1, pz, 'Bandit', null); if (!e3.mesh.parent) WORLD.scene.add(e3.mesh);
  e3.locked = false; e3.alert = true; e3.x = px + 1; e3.z = pz; e3.combatYaw = Math.atan2(px - e3.x, pz - e3.z);
  e3.telegraphMax = .5; e3.telegraphT = .001; e3.atkCd = 0; e3.spd = 0; ZE = [e3]; PHP = maxHP;
  ROLL = { t0: performance.now() / 1000 - .15, dur: .45, dist: 0, i0: .08, i1: .3, dx: 0, dz: 0, done: 0, fwd: 1 };
  try { tickZoneEnemies(1 / 60, performance.now(), WORLD.scene); } finally { ZE = keep; ROLL = null; }
  const lostRoll = maxHP - PHP; PHP = maxHP; WORLD.scene.remove(e3.mesh);
  return { round70: lost, rolling: lostRoll };
});
console.log(JSON.stringify({ ...e2e, ...e2 }));
check('a bandit\'s blow lands 1.5 ahead (it whiffed past 1.4)', e2e.ahead > 0, e2e);
check('stepped 70° round its frozen facing at 1.0, it whiffs', e2.round70 === 0, e2);
check('mid-roll, a bandit\'s blow at 1.0 misses', e2.rolling === 0, e2);
// Session 283: the rest of an enemy's damage goes by a roll too. A troll's heavy blow (the world's behaviours: at half
// health it winds up a second and hits everything within 3.2) lands standing and misses 0.15 s into a roll.
const heavy2 = await page.evaluate(() => {
  const one = rolling => {
    const e = buildZoneEnemy(WORLD.scene, [], px + 2, pz, 'Cave Troll', null); if (!e.mesh.parent) WORLD.scene.add(e.mesh);
    e.locked = false; e.alert = true; e.x = px + 2; e.z = pz; e.hp = e.maxHp * .4; e._phase2 = true; e._heavyT = 99; e._windup = .001; e.atkCd = 99; e.spd = 0;
    ZE.push(e); PHP = maxHP; blocking = false;
    ROLL = rolling ? { t0: performance.now() / 1000 - .15, dur: .45, dist: 0, i0: .08, i1: .3, dx: 0, dz: 0, done: 0, fwd: 1 } : null;
    try { WORLD.tickBehaviours(1 / 60); } finally { ROLL = null; ZE.splice(ZE.indexOf(e), 1); WORLD.scene.remove(e.mesh); }
    const lost = maxHP - PHP; PHP = maxHP; return lost; };
  return { standing: one(false), rolling: one(true) };
});
console.log(JSON.stringify(heavy2));
check('a troll\'s heavy blow lands standing and misses mid-roll', heavy2.standing > 0 && heavy2.rolling === 0, heavy2);
const src = await page.evaluate(() => [executeStrike, tickZoneArrows].map(f => /rollUntouchable/.test(String(f))));
check('melee blows and arrows read the roll', src.every(Boolean), src);
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
