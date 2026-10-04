// Session 480: the last of backlog K step 1's hit rolls. Your arrow's damage (the bow's and the arrow's spread), your spell's
// spread and Fortune's lucky blow are rolled at the hit from the struck foe's own stream (keyFoe, Session 477), as your swing
// is. Two machines are stood in for by two Bandits built with one id, one after the other, from the same state: the same
// shot or spell must do the same damage to both; a foe with another id rolls its own. On the old code each was Math.random.
import { boot, check } from './lib/game.mjs';
const g = await boot(); const { page } = g;
await g.intoWorld();
await page.evaluate(() => { window._drive = (step, max) => {
  const raf = window.requestAnimationFrame, rr = REN.render; window.requestAnimationFrame = () => 0; REN.render = () => {};
  let t = performance.now(), n = 0;
  try { for (; n < max; n++) { if (step && step()) break; PHP = maxHP; dead = false; t += 1000 / 60; loop(t); } }
  finally { window.requestAnimationFrame = raf; REN.render = rr; prevT = 0; }
  return n; }; });

// 1. arrows: three shots each at a keyed Bandit four units ahead, by the loop's own tick
const shots = (id) => page.evaluate((id) => { forceTime(12);
  const keep = ZE.splice(0, ZE.length), w0 = EQ.weapon, a0 = EQ.ammo, tp0 = thirdPerson, pi0 = pitch, x0 = px, z0 = pz;
  EQ.weapon = { name: 'Test Bow', ico: '🏹', type: 'equip', slot: 'weapon', atk: [5, 30], weaponShape: 'bow', wType: 'pierce', twoHand: true, weight: 3 };
  EQ.ammo = { name: 'Iron Arrow', ico: '➶', type: 'ammo', qty: 50, arrowDmg: [2, 12] }; thirdPerson = false; pitch = -.05;
  const fx = -Math.sin(yaw), fz = -Math.cos(yaw);
  const e = unlockFoe(buildZoneEnemy(WORLD.scene, [], px + fx * 4, pz + fz * 4, 'Bandit', null)); keyFoe(e, id); e.spd = 0; e.atkCd = 99; ZE.push(e);
  const out = [];
  try { for (let k = 0; k < 3; k++) { e.hp = e.maxHp = 9999; e.x = px + fx * 4; e.z = pz + fz * 4; e.atkCd = 99; fireArrow(1);
      _drive(() => { px = x0; pz = z0; e.atkCd = 99; return e.hp < 9999; }, 120); out.push(9999 - e.hp); _drive(null, 30); } }
  finally { EQ.weapon = w0; EQ.ammo = a0; thirdPerson = tp0; pitch = pi0; ZE.splice(0, ZE.length, ...keep); e.dead = true; if (e.mesh && e.mesh.parent) e.mesh.parent.remove(e.mesh); px = x0; pz = z0; }
  return out; }, id);
const aA = await shots('5,5:0:0'), aB = await shots('5,5:0:0'), aC = await shots('5,5:0:1');
console.log('arrows', JSON.stringify(aA), JSON.stringify(aB), JSON.stringify(aC));
check(`three arrows at one id do the same damage on two machines (${aA.join(' ')} | ${aB.join(' ')}), another id its own (${aC.join(' ')})`,
  aA.length === 3 && aA.every(d => d > 0) && JSON.stringify(aA) === JSON.stringify(aB) && JSON.stringify(aA) !== JSON.stringify(aC), { aA, aB, aC });

// 2. spells and 3. Fortune's lucky blow, through their own functions
const r = await page.evaluate(() => { const sp = SPELLS.find(s => s.school) || SPELLS[0]; const f0 = ATTRS.fortune; const out = {};
  for (const [k, id] of [['A', '7,7:0:0'], ['B', '7,7:0:0'], ['C', '7,7:0:3']]) { const e = keyFoe({ name: 'Bandit', resist: {}, def: 0 }, id);
    const spell = []; for (let i = 0; i < 6; i++) spell.push(applySpellDamage(e, sp, 1).dmg);
    ATTRS.fortune = 999; const luck = []; for (let i = 0; i < 12; i++) luck.push(_fortuneCrit(e) > 1 ? 1 : 0); ATTRS.fortune = f0;
    out[k] = { spell, luck: luck.join('') }; }
  const plain = []; for (let i = 0; i < 6; i++) plain.push(applySpellDamage({ name: 'Bandit', resist: {}, def: 0 }, sp, 1).dmg);
  return { sp: sp.name || sp.id, ...out, plain }; });
console.log('spells', JSON.stringify(r));
check(`a ${r.sp} on one id does the same damage twice (${r.A.spell.join(' ')} | ${r.B.spell.join(' ')}), another id its own (${r.C.spell.join(' ')})`,
  JSON.stringify(r.A.spell) === JSON.stringify(r.B.spell) && JSON.stringify(r.A.spell) !== JSON.stringify(r.C.spell), r);
check(`Fortune's lucky blow at one id falls alike (${r.A.luck} | ${r.B.luck}), another id its own (${r.C.luck}); an unkeyed foe still takes spells (${r.plain.join(' ')})`,
  r.A.luck === r.B.luck && r.A.luck !== r.C.luck && /1/.test(r.A.luck) && /0/.test(r.A.luck) && r.plain.every(d => d > 0), r);

check('no page errors', g.errs.length === 0, g.errs);
await g.close();
