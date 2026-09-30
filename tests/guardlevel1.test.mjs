// The Town Guard at level one (Session 371; G's owed check from Session 157: "whether the Town Guard is too hard at level
// one"). The feel is Michael's; this puts numbers on it. A new character's swings are sampled through the game's own
// damage path (the swing's roll as the world's melee code makes it, then `applyMeleeDamage`), and the foe's blows through
// `executeStrike` unblocked, against a drawn Town Guard (the Bandit body with `guardEnemy`'s numbers) and, for scale, the
// Bandit the world spawns. Standing toe to toe, no blocks, no rolls, no misses: a race of damage against time.
import { boot, check } from './lib/game.mjs';
const g = await boot(); const { page } = g;
await g.intoWorld();
const stop = g.keepAlive();

const r = await page.evaluate(() => {
  const N = 3000;
  const mk = (guard) => { const e = buildZoneEnemy(WORLD.scene, [], px + fwdX * 1.2, pz + fwdZ * 1.2, 'Bandit', null); if (!e.mesh.parent) WORLD.scene.add(e.mesh);
    e.locked = false; e.spd = 0; e.atkCd = 1e9; e.telegraphT = 0; e.combatYaw = Math.atan2(px - e.x, pz - e.z);
    if (guard) { e.name = e.displayName = 'Town Guard'; e.hp = e.maxHp = Math.round(40 + level * 8); e.dmg = Math.round(6 + level * 1.2); e.spd = 0; e.def = 3; }
    if (typeof e.posture !== 'number') initPosture(e); return e; };
  const w = EQ.weapon, lo = w ? w.atk[0] : FISTS.atk[0], hi = w ? w.atk[1] : FISTS.atk[1];
  const swing = .5 * (1 - attrEff('swiftness') * 0.01) * _weaponSwingFactor();
  const measure = (guard) => { const e = mk(guard); const hp = e.maxHp;
    // the player's swings: the roll as the world's melee code makes it (no power, no riposte), then the game's damage path
    let dealt = 0; for (let i = 0; i < N; i++) { e.hp = hp; e.posture = e.maxPosture; staggered = staggered.filter(s => s.e !== e);
      const mightMult = 1 + (attrEff('might') * ATTR_DMG_PER_POINT), meleeBuff = _buffMult('meleeDmg', 1) * _buffMult('dmgBurst', 1), shMult = shieldFrontMult(e);
      const raw = Math.floor((lo + Math.floor(Math.random() * (hi - lo)) + Math.floor(level * 1.5)) * mightMult * meleeBuff * shMult);
      dealt += Math.min(hp, applyMeleeDamage(e, raw).dmg); }
    e.hp = hp; e.dead = false; staggered = staggered.filter(s => s.e !== e);
    // the foe's blows, unblocked, as its tick rolls them
    let taken = 0; const T = performance.now() / 1000 + 1000;
    for (let i = 0; i < N; i++) { PHP = maxHP; PPOST.posture = PPOST.maxPosture; PPOST.stagUntil = 0; ROLL = null; blocking = false; lastBlockAttemptT = -99; lastBlockAttemptG = -99; lastHitT = -99;
      const raw = Math.max(1, e.dmg - Math.floor(_armour() * .5) + Math.floor(Math.random() * 4)); executeStrike(e, raw, (T + i * 10) * 1000); taken += maxHP - PHP; }
    PHP = maxHP; PPOST.posture = PPOST.maxPosture; PPOST.stagUntil = 0;
    const tell = telegraphDuration(e), cycle = e.atkSpd + tell;
    const perSwing = dealt / N, perBlow = taken / N;
    const out = { name: guard ? 'Town Guard' : 'Bandit', hp, dmg: e.dmg, def: e.def, atkSpd: e.atkSpd, tell: +tell.toFixed(2), perSwing: +perSwing.toFixed(2), perBlow: +perBlow.toFixed(2),
      swingsToKill: Math.ceil(hp / perSwing), timeToKill: +(Math.ceil(hp / perSwing) * swing).toFixed(2), blowsToDie: Math.ceil(maxHP / perBlow), timeToDie: +(Math.ceil(maxHP / perBlow) * cycle).toFixed(2) };
    WORLD.scene.remove(e.mesh); return out; };
  return { level, maxHP, armour: _armour(), weapon: w ? w.name : 'fists', lo, hi, swing: +swing.toFixed(3), guard: measure(true), bandit: measure(false) };
});
console.log(JSON.stringify(r, null, 1));
const G = r.guard, B = r.bandit;
console.log(`level ${r.level}, ${r.maxHP} health, armour ${r.armour}, ${r.weapon} ${r.lo}–${r.hi}, a swing every ${r.swing} s`);
for (const x of [G, B]) console.log(`  ${x.name.padEnd(10)} ${x.hp} hp, def ${x.def}: ${x.perSwing} a swing, dead in ${x.swingsToKill} swings (${x.timeToKill} s); hits for ${x.perBlow}, you fall in ${x.blowsToDie} blows (${x.timeToDie} s, a blow every ${(x.atkSpd + x.tell).toFixed(2)} s)`);
check('a level-one character was measured', r.level === 1 && r.maxHP > 0, r);
check('both foes were hit and hit back', G.perSwing > 0 && G.perBlow > 0 && B.perSwing > 0 && B.perBlow > 0, r);
check('the guard carries guardEnemy\'s numbers at level one (48 health, 7 damage, defence 3)', G.hp === 48 && G.dmg === 7 && G.def === 3, G);
stop();
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
