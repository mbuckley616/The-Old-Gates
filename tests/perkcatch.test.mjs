// Catch the blade (Hand-to-hand 75; Session 1079, Michael's A on DECISION #399): a perfect parry made bare-handed takes a
// one-handed weapon from a person-bodied foe's grip. It fights on with its fists, at half its blow and the fists' reach (0.9),
// and the weapon in its hand is hidden. A spear is two-handed and stays; a sword in your own hand takes nothing.
import { boot, check } from './lib/game.mjs';
const g = await boot(); const { page } = g;
await g.intoWorld();
const r = await page.evaluate(() => {
  const out = {}; const sk0 = JSON.parse(JSON.stringify(SKILLS)), eq0 = { ...EQ }, rnd = Math.random;
  const SWORD = { name: 'Test Sword', type: 'weapon', atk: [10, 11], wType: 'slash', weaponShape: 'sword', weight: 3 };
  const mk = () => { const x = px + fwdX * 1, z = pz + fwdZ * 1;
    const e = buildZoneEnemy(WORLD.scene, [], x, z, 'Bandit', null); if (!e.mesh.parent) WORLD.scene.add(e.mesh);
    e.locked = false; e.alert = true; e.spd = 0; e.atkCd = 1e9; e.rng = null; e.hp = e.maxHp = 1000; e.def = 0;
    e.combatYaw = Math.atan2(px - e.x, pz - e.z); if (typeof e.posture !== 'number') initPosture(e); return e; };
  const reset = () => { PHP = maxHP; PPOST.posture = PPOST.maxPosture; PPOST.stagUntil = 0; ROLL = null; stamina = 100; staminaCD = 0; ACTIVE_BUFFS.length = 0; _lastParryG = -1e9; };
  const parry = (e) => { reset(); const now = performance.now(); blocking = true; lastBlockAttemptT = now / 1000 - .05; lastBlockAttemptG = playClockS - .05; executeStrike(e, 20, now); blocking = false; };
  Math.random = () => .5;
  const trial = (w, id, lv, spear) => { EQ.weapon = w; SKILLS[id] = { lv, p: 0 }; staggered = []; const e = mk();
    const G = e.limbs && e.limbs.person && e.limbs.person.g; const g0 = G && G.gear; if (spear && G) G.gear = 'spear';
    const kind0 = foeWeaponKind(e), reach0 = foeReach(e, false).blow, blow0 = foeBlow(e, 20, 0), vis0 = !!(e.limbs.person && e.limbs.person.weapon && e.limbs.person.weapon.visible);
    parry(e);
    const res = { kind0, reach0: +reach0.toFixed(2), blow0, vis0, family: foeFamily(e), disarmed: !!e._disarmed, kind: foeWeaponKind(e), reach: +foeReach(e, false).blow.toFixed(2), blow: foeBlow(e, 20, 0),
      vis: !!(e.limbs.person && e.limbs.person.weapon && e.limbs.person.weapon.visible), stag: staggered.some(s => s.e === e) };
    if (G) G.gear = g0; WORLD.scene.remove(e.mesh); staggered = []; return res; };
  out.h74 = trial(null, 'hand', 74); out.h75 = trial(null, 'hand', 75);
  out.spear = trial(null, 'hand', 75, true);
  SKILLS.hand = { lv: 100, p: 0 }; out.sword = trial(SWORD, 'blade', 5);
  out.live = PERK_LIVE.has('hand:75');
  Math.random = rnd; Object.assign(SKILLS, sk0); Object.assign(EQ, eq0); return out; });
console.log(JSON.stringify(r));
check(`a Bandit is a person with a one-handed ${r.h75.kind0}, held in sight`, r.h75.family === 'humanoid' && ['dagger', 'sword', 'axe', 'mace', 'cutlass'].includes(r.h75.kind0) && r.h75.vis0, r.h75);
check('at Hand-to-hand 74 a bare-handed perfect parry staggers it and takes nothing', r.h74.stag && !r.h74.disarmed && r.h74.vis && r.h74.blow === r.h74.blow0, r.h74);
check(`at 75 (Catch the blade) the weapon leaves its grip: hidden, its reach ${r.h75.reach0} → ${r.h75.reach} (the fists'), its blow ${r.h75.blow0} → ${r.h75.blow}`, r.h75.stag && r.h75.disarmed && !r.h75.vis && r.h75.kind === 'fists' && r.h75.reach < r.h75.reach0 && Math.abs(r.h75.blow - r.h75.blow0 / 2) <= 1, r.h75);
check('a spear is two-handed and stays in its grip', !r.spear.disarmed && r.spear.kind === 'spear', r.spear);
check('with a sword in your hand, Hand-to-hand 100 takes nothing', !r.sword.disarmed, r.sword);
check('Catch the blade is live on the Skills tab', r.live);
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
