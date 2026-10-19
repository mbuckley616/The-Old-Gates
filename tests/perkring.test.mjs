// Ringing (Blunt 50; Session 1077, Michael's A on DECISION #399): a power hit already breaks a raised shield in one blow, whatever
// the weapon (v65); with a blunt weapon in hand and Ringing held, the shield it breaks stays down for the rest of the fight. The
// bearer's stagger runs out and the guard stays down while it is alert; once it is calm, the guard comes back up as before.
import { boot, check } from './lib/game.mjs';
const g = await boot(); const { page } = g;
await g.intoWorld();
const r = await page.evaluate(() => {
  const out = {}; const sk0 = JSON.parse(JSON.stringify(SKILLS)), eq0 = { ...EQ }, keepZ = ZE, rnd = Math.random;
  const MACE = { name: 'Test Mace', type: 'weapon', atk: [10, 11], wType: 'blunt', weaponShape: 'mace', weight: 4 };
  const SWORD = { name: 'Test Sword', type: 'weapon', atk: [10, 11], wType: 'slash', weaponShape: 'sword', weight: 3 };
  const made = [];
  const mk = () => { const x = px + fwdX * 1, z = pz + fwdZ * 1;
    const e = buildZoneEnemy(WORLD.scene, [], x, z, 'Bandit Captain', null); if (!e.mesh.parent) WORLD.scene.add(e.mesh); made.push(e);
    e.locked = false; e.alert = true; e.spd = 0; e.atkCd = 1e9; e.rng = null; e.hp = e.maxHp = 1000; e.def = 0; e.resist = {};
    e.combatYaw = Math.atan2(px - e.x, pz - e.z); if (typeof e.posture !== 'number') initPosture(e); return e; };
  const reset = () => { PHP = maxHP; PPOST.posture = PPOST.maxPosture; PPOST.stagUntil = 0; ROLL = null; stamina = 100; staminaCD = 0; ACTIVE_BUFFS.length = 0; _exhaustedStrike = false; };
  const power = (e) => { reset(); ZE = [e]; SWING = { t0: playClockS, tell: .3, strike: .06, recovery: .18, total: .55, isPow: true, chain: 1 }; _swingStartS = -1e9;
    try { return resolvePlayerStrike(true); } finally { SWING = null; } };
  Math.random = () => .5;
  const trial = (w, id, lv) => { EQ.weapon = w; SKILLS[id] = { lv, p: 0 }; const e = mk(); const up0 = !!e.shieldUp; const res = power(e);
    const broke = !e.shieldUp && !!(res || []).some(o => o.guardBroke);
    // the stagger runs out on the zone's own tick (it calls reraiseGuard)
    for (let i = 0; i < 240; i++) tickZoneEnemies(1 / 60, performance.now(), WORLD.scene);
    const afterStagger = !!e.shieldUp, stillStag = staggered.some(s => s.e === e);
    e.alert = false; reraiseGuard(e); const calm = !!e.shieldUp;
    WORLD.scene.remove(e.mesh); ZE = keepZ; staggered = []; return { up0, broke, afterStagger, stillStag, calm }; };
  out.m49 = trial(MACE, 'blunt', 49); out.m50 = trial(MACE, 'blunt', 50);
  SKILLS.blunt = { lv: 100, p: 0 }; out.sword = trial(SWORD, 'blade', 5);
  out.live = PERK_LIVE.has('blunt:50');
  Math.random = rnd; Object.assign(SKILLS, sk0); Object.assign(EQ, eq0); return out; });
console.log(JSON.stringify(r));
check('a Bandit Captain raises its shield, and a power hit breaks it at Blunt 49 and 50', r.m49.up0 && r.m50.up0 && r.m49.broke && r.m50.broke, r);
check('at Blunt 49 the guard is back up once the stagger runs out', !r.m49.stillStag && r.m49.afterStagger, r.m49);
check('at Blunt 50 (Ringing) it stays down after the stagger, while the Captain is alert', !r.m50.stillStag && !r.m50.afterStagger, r.m50);
check('calm again, the Captain raises it', r.m50.calm, r.m50);
check('Ringing is the blunt weapon\'s: a sword\'s power hit at Blunt 100 lets the guard back up', r.sword.broke && r.sword.afterStagger, r.sword);
check('Ringing is live on the Skills tab', r.live);
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
