// The foes' posture floor (Session 663; Michael's A on DECISION #206). A foe's posture is half its health by family,
// and never under 18: a Wolf (18 HP, ×0.8) sat on the old floor of 10, under one greatclub swing's 12, so every second
// swing staggered it. Every zone foe is built by the game's own builder and read; then a Wolf takes real greatclub and
// sword swings through the zone resolver, the dice pinned, and the swings to its first stagger are counted.
import { boot, check } from './lib/game.mjs';
const g = await boot(); const { page } = g;
await g.intoWorld();
const stop = g.keepAlive();

const r = await page.evaluate(() => {
  const out = { floor: ENEMY_POSTURE_FLOOR, foes: {} }; const keep = ZE, keepW = EQ.weapon;
  const mk = (type) => { const e = buildZoneEnemy(WORLD.scene, [], px + fwdX * 1.2, pz + fwdZ * 1.2, type, null);
    if (!e.mesh.parent) WORLD.scene.add(e.mesh); e.locked = false; e.spd = 0; e.atkCd = 1e9; e.telegraphT = 0;
    e.combatYaw = Math.atan2(px - e.x, pz - e.z); if (typeof e.posture !== 'number') initPosture(e); return e; };
  const clean = (e) => { WORLD.scene.remove(e.mesh); staggered = staggered.filter(s => s.e !== e); };
  for (const t of ['Wolf', 'Spider', 'Goblin', 'Kobold', 'Boar', 'Bandit', 'Highwayman', 'Bandit Archer', 'Skeleton', 'Snow Wolf', 'Dire Wolf', 'Forest Troll', 'Cave Bear', 'Ogre']) {
    const e = mk(t); out.foes[t] = { hp: e.maxHp, posture: e.maxPosture }; clean(e);
  }
  // the dungeon's foes go through the same stamp
  out.dungeonSkel = (() => { const e = { name: 'Skeleton', maxHp: 20 }; initPosture(e); return e.maxPosture; })();
  out.bigTroll = (() => { const e = { name: 'Cave Troll', maxHp: 80 }; initPosture(e); return e.maxPosture; })();

  // swings to the first stagger, a Wolf held at full health so that only its posture decides
  const W = (n) => WEAPON_TYPES.find(t => t.type === n);
  const rnd = Math.random; Math.random = () => .5; _exhaustedStrike = false;
  const swings = (wname) => { EQ.weapon = wname ? makeItem(2, W(wname), null, false) : null;
    const e = mk('Wolf'); e.hp = e.maxHp = 1e6; ZE = [e]; let n = 0;
    try { for (; n < 8 && !isStaggered(e); ) { _swingStartS = -1e9; e.lastHitAt = 0; _resolveZoneStrike(false); n++; } }
    finally { ZE = keep; }
    const res = { swings: isStaggered(e) ? n : null, mult: (EQ.weapon && EQ.weapon.postureMult) || 1 }; clean(e); return res; };
  out.greatclub = swings('GreatClub'); out.sword = swings('Sword'); out.claymore = swings('Claymore'); out.hammer = swings('WarHammer');
  Math.random = rnd; EQ.weapon = keepW;
  return out;
});
stop();

const low = Object.entries(r.foes).filter(([, v]) => v.posture < 18);
check('the floor is 18', r.floor === 18, r.floor);
check('no zone foe stands under 18 posture', low.length === 0 && Object.keys(r.foes).length === 14, r.foes);
check('a Wolf and a Bandit sit on the floor, an Ogre (90 HP) above it as before', r.foes.Wolf.posture === 18 && r.foes.Bandit.posture === 18 && r.foes.Ogre.posture > 18, { wolf: r.foes.Wolf, bandit: r.foes.Bandit, ogre: r.foes.Ogre });
check('a dungeon Skeleton (20 HP) is lifted to 18; an 80 HP troll keeps 60', r.dungeonSkel === 18 && r.bigTroll === 60, { skel: r.dungeonSkel, troll: r.bigTroll });
check('a Wolf takes two greatclub swings to stagger (one before)', r.greatclub.swings === 2 && r.greatclub.mult === 1.5, r.greatclub);
check('and three sword swings, two claymore swings', r.sword.swings === 3 && r.claymore.swings === 2, { sword: r.sword, claymore: r.claymore });
console.log('war hammer (×2.25 = 18 a swing):', JSON.stringify(r.hammer));
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
