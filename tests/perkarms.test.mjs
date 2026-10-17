// The Arms perks that need no new system (Session 1051; skills and perks A, the build sheet's Blade, Blunt and Hand-to-hand
// rows). Blade: Long riposte (50) the riposte window 0.8 → 1.2 s; Crossing (75) a perfect parry also staggers a second
// attacker within 3 m; Clean edge (100) a finisher ignores def. Blunt: Weight (25) +25% posture; Daze (75) a stagger you cause
// lasts 0.6 s longer; Earthshaker (100) the chain's third hit staggers every foe within 2 m. Hand-to-hand: Hard knuckles (25)
// ×1.5 posture; Stone hand (100) the fists roll 4 to 7. Each is the weapon in hand's: a perk of Blade does nothing with a mace.
import { boot, check } from './lib/game.mjs';
const g = await boot(); const { page } = g;
await g.intoWorld();
const r = await page.evaluate(() => {
  const out = {}; const sk0 = JSON.parse(JSON.stringify(SKILLS)), eq0 = { ...EQ }, keepZ = ZE, rnd = Math.random;
  const set = (id, lv) => { SKILLS[id] = { lv, p: 0 }; };
  const SWORD = { name: 'Test Sword', type: 'weapon', atk: [10, 11], wType: 'slash', weaponShape: 'sword', weight: 3 };
  const MACE = { name: 'Test Mace', type: 'weapon', atk: [10, 11], wType: 'blunt', weaponShape: 'mace', weight: 4 };
  const made = [];
  const mk = (d, side = 0) => { const x = px + fwdX * d + fwdZ * side, z = pz + fwdZ * d - fwdX * side;
    const e = buildZoneEnemy(WORLD.scene, [], x, z, 'Bandit', null); if (!e.mesh.parent) WORLD.scene.add(e.mesh); made.push(e);
    e.locked = false; e.alert = true; e.spd = 0; e.atkCd = 1e9; e.rng = null; e.hp = e.maxHp = 1000; e.def = 0; e.resist = {};
    e.combatYaw = Math.atan2(px - e.x, pz - e.z); if (typeof e.posture !== 'number') initPosture(e); e.posture = e.maxPosture = 1000; return e; };
  const clear = () => { for (const e of made) WORLD.scene.remove(e.mesh); made.length = 0; staggered = []; ZE = keepZ; SWING = null; };
  const reset = () => { PHP = maxHP; PPOST.posture = PPOST.maxPosture; PPOST.stagUntil = 0; ROLL = null; stamina = 100; staminaCD = 0; ACTIVE_BUFFS.length = 0; _lastParryG = -1e9; _exhaustedStrike = false; };
  // one swing of the chain's `chain`th at the foes given, the first of them in front
  const swing = (foes, chain = 1) => { reset(); ZE = foes; SWING = { t0: playClockS, tell: .3, strike: .06, recovery: .18, total: .55, isPow: false, chain }; _swingStartS = -1e9;
    try { return resolvePlayerStrike(false); } finally { SWING = null; } };
  const parry = (e) => { reset(); const now = performance.now(); blocking = true; lastBlockAttemptT = now / 1000 - .05; lastBlockAttemptG = playClockS - .05; executeStrike(e, 20, now); blocking = false; };
  Math.random = () => .5;
  // Weight and Hard knuckles: the posture a light swing drains
  const drain = (w, id, lv) => { EQ.weapon = w; set(id, lv); const e = mk(1); swing([e]); const d = 1000 - e.posture; clear(); return +d.toFixed(2); };
  out.w24 = drain(MACE, 'blunt', 24); out.w25 = drain(MACE, 'blunt', 25); out.wSword = (set('blunt', 100), drain(SWORD, 'blade', 5));
  out.k24 = drain(null, 'hand', 24); out.k25 = drain(null, 'hand', 25);
  // Stone hand: a punch's damage
  const punch = (lv) => { EQ.weapon = null; set('hand', lv); const e = mk(1); swing([e]); const d = 1000 - e.hp; clear(); return d; };
  out.p99 = punch(99); out.p100 = punch(100);
  // Long riposte: the window a parry opens
  const rip = (w, lv) => { EQ.weapon = w; set('blade', lv); const e = mk(1); ZE = [e]; parry(e); const s = +(e._ripUntil - e._ripAt).toFixed(2); clear(); return s; };
  out.r49 = rip(SWORD, 49); out.r50 = rip(SWORD, 50); out.rMace = rip(MACE, 100);
  // Crossing: a parry with a second alert Bandit 2.5 m off to the side, and one 3.6 m
  const cross = (lv, d2) => { EQ.weapon = SWORD; set('blade', lv); const e = mk(1), f = mk(0, d2); ZE = [e, f]; parry(e); const s = isStaggered(f); clear(); return s; };
  out.c74 = cross(74, 2.5); out.c75 = cross(75, 2.5); out.c75far = cross(75, 3.6);
  // Clean edge: a finisher from the front on a Bandit with def 20
  const fin = (lv) => { EQ.weapon = SWORD; set('blade', lv); const e = mk(1); e.def = 20; staggered.push({ e, t: 5 }); e._finUntil = performance.now() / 1000 + 5;
    const o = swing([e]); const d = 1000 - e.hp, f = !!(o[0] && o[0].info && o[0].info.finisher); clear(); return { d, f }; };
  out.f99 = fin(99); out.f100 = fin(100);
  // Daze: the stagger a posture break leaves, with a mace and with a sword
  const daze = (w, lv) => { EQ.weapon = w; set('blunt', lv); const e = mk(1); e.posture = 1; swing([e]); const s = staggered.find(q => q.e === e); clear(); return s ? +s.t.toFixed(2) : null; };
  out.d74 = daze(MACE, 74); out.d75 = daze(MACE, 75); out.dSword = daze(SWORD, 100);
  // Earthshaker: the chain's third with a mace, a second Bandit 1.5 m behind you
  const shake = (lv, chain) => { EQ.weapon = MACE; set('blunt', lv); const e = mk(1), f = mk(-1.5); ZE = [e, f]; swing([e, f], chain); const s = isStaggered(f); clear(); return s; };
  out.e99 = shake(99, 3); out.e100 = shake(100, 3); out.e100first = shake(100, 1);
  out.live = ['blade', 'blunt', 'hand'].map(id => [25, 50, 75, 100].map(rk => PERK_LIVE.has(id + ':' + rk) ? 1 : 0).join(''));
  Math.random = rnd; Object.assign(EQ, eq0); for (const k in sk0) SKILLS[k] = sk0[k]; reset(); return out; });
console.log(JSON.stringify(r));
check(`Weight: a mace's swing drains ${r.w24} posture at Blunt 24 and ${r.w25} at 25 (×1.25); a sword at Blunt 100 ${r.wSword}`, r.w24 > 0 && Math.abs(r.w25 / r.w24 - 1.25) < .01 && r.wSword === r.w24, r);
check(`Hard knuckles: a punch drains ${r.k24} at Hand-to-hand 24 and ${r.k25} at 25 (×1.5)`, r.k24 > 0 && Math.abs(r.k25 / r.k24 - 1.5) < .01, r);
check(`Stone hand: a mid-roll punch lands ${r.p99} at 99 (2–3) and ${r.p100} at 100 (4–7)`, r.p99 > 0 && r.p100 >= r.p99 * 1.8, r);
check(`Long riposte: a parry opens ${r.r49} s at Blade 49 and ${r.r50} s at 50; with a mace ${r.rMace} s`, r.r49 === .8 && r.r50 === 1.2 && r.rMace === .8, r);
check('Crossing: a parry at Blade 75 staggers a second Bandit 2.5 m off, not at 74, not one 3.6 m off', !r.c74 && r.c75 && !r.c75far, r);
check(`Clean edge: a finisher on def 20 lands ${r.f99.d} at Blade 99 and ${r.f100.d} at 100 (the def ignored)`, r.f99.f && r.f100.f && r.f100.d - r.f99.d >= 19, r);
check(`Daze: a mace's posture break staggers ${r.d74} s at Blunt 74 and ${r.d75} s at 75; a sword's ${r.dSword}`, r.d74 === 1.5 && r.d75 === 2.1 && r.dSword === 1.5, r);
check('Earthshaker: the chain\'s third at Blunt 100 staggers a Bandit 1.5 m behind you; not at 99, not on the first swing', !r.e99 && r.e100 && !r.e100first, r);
check(`live: Blade ${r.live[0]}, Blunt ${r.live[1]}, Hand-to-hand ${r.live[2]} (Draw cut, Ringing, Throw and Catch the blade since Sessions 1077–1080)`, r.live.join() === '1111,1111,1111', r);
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
