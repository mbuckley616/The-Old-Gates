// Throw (Hand-to-hand 50; Session 1078, Michael's A on DECISION #399): a punch on a staggered foe that is not its finisher or a
// riposte knocks it down. It lies 1.5 s, its stagger held that long, and its finisher is open from any side while it is down.
// Without the perk, a foe staggered with its back to you is not open from behind.
import { boot, check } from './lib/game.mjs';
const g = await boot(); const { page } = g;
await g.intoWorld();
const r = await page.evaluate(() => {
  const out = {}; const sk0 = JSON.parse(JSON.stringify(SKILLS)), eq0 = { ...EQ }, keepZ = ZE, rnd = Math.random;
  const SWORD = { name: 'Test Sword', type: 'weapon', atk: [10, 11], wType: 'slash', weaponShape: 'sword', weight: 3 };
  const mk = (back) => { const x = px + fwdX * 1, z = pz + fwdZ * 1;
    const e = buildZoneEnemy(WORLD.scene, [], x, z, 'Bandit', null); if (!e.mesh.parent) WORLD.scene.add(e.mesh);
    e.locked = false; e.alert = true; e.spd = 0; e.atkCd = 1e9; e.rng = null; e.hp = e.maxHp = 1000; e.def = 0; e.resist = {};
    const toMe = Math.atan2(px - e.x, pz - e.z); e.combatYaw = back ? toMe + Math.PI : toMe; if (typeof e.posture !== 'number') initPosture(e); return e; };
  const reset = () => { PHP = maxHP; PPOST.posture = PPOST.maxPosture; PPOST.stagUntil = 0; ROLL = null; stamina = 100; staminaCD = 0; ACTIVE_BUFFS.length = 0; _exhaustedStrike = false; };
  const swing = (e) => { reset(); ZE = [e]; SWING = { t0: playClockS, tell: .3, strike: .06, recovery: .18, total: .55, isPow: false, chain: 1 }; _swingStartS = -1e9;
    try { return resolvePlayerStrike(false); } finally { SWING = null; } };
  const stagger = (e) => { const now = performance.now() / 1000; applyPostureDamage(e, e.maxPosture + 1, now); staggered.push({ e, t: .4 }); };
  Math.random = () => .5;
  const trial = (w, id, lv, back) => { EQ.weapon = w; SKILLS[id] = { lv, p: 0 }; staggered = []; const e = mk(back); stagger(e);
    const now0 = performance.now() / 1000, open0 = finisherOpen(e, now0); const hp0 = e.hp; swing(e); const now = performance.now() / 1000;
    const s = staggered.find(q => q.e === e); const res = { open0, hit: hp0 - e.hp, down: e._downUntil > now ? +(e._downUntil - now).toFixed(2) : 0, stagT: s ? +s.t.toFixed(2) : 0, openAfter: finisherOpen(e, now) };
    // a second blow from behind while it is down is the finisher, ×3
    const hp1 = e.hp; swing(e); res.second = hp1 - e.hp;
    WORLD.scene.remove(e.mesh); ZE = keepZ; staggered = []; return res; };
  out.h49 = trial(null, 'hand', 49, true); out.h50 = trial(null, 'hand', 50, true);
  out.front = trial(null, 'hand', 50, false);
  SKILLS.hand = { lv: 100, p: 0 }; out.sword = trial(SWORD, 'blade', 5, true);
  out.live = PERK_LIVE.has('hand:50');
  Math.random = rnd; Object.assign(SKILLS, sk0); Object.assign(EQ, eq0); return out; });
console.log(JSON.stringify(r));
check('with its back to you, a staggered Bandit is not open to a finisher', !r.h49.open0 && !r.h50.open0, r);
check('at Hand-to-hand 49 a punch from behind does not throw it', r.h49.hit > 0 && r.h49.down === 0 && !r.h49.openAfter, r.h49);
check('at 50 (Throw) the punch knocks it down for 1.5 s, its stagger held as long', r.h50.hit > 0 && r.h50.down >= 1.45 && r.h50.down <= 1.5 && r.h50.stagT >= 1.45, r.h50);
check('down, it is open to a finisher from behind: the next punch lands ×3 against the plain staggered ×1.5', r.h50.openAfter && Math.abs(r.h50.second / r.h49.second - 2) < .35, { h49: r.h49.second, h50: r.h50.second });
check('from the front the punch is the finisher itself, and nothing is thrown', r.front.open0 && r.front.down === 0, r.front);
check('Throw is the fists\': a sword from behind at Hand-to-hand 100 throws nothing', r.sword.hit > 0 && r.sword.down === 0, r.sword);
check('Throw is live on the Skills tab', r.live);
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
