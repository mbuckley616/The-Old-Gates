// A punch lands (Session 382, issue #81). The swing timer and the deferred strike (`_pendingStrike`, fired at the
// swing's impact point) were only advanced inside the loop's `if(vmSword)` block, and an empty hand has no view model:
// a punch set swingT to its length and stayed there, the strike never fired, and the dummy took nothing. The third-
// person arm froze mid-swing with it. `unequip` calls `_resolveZoneStrike` directly and so never saw it.
// Since Session 396 (Michael's A on #80) an empty hand has a view model again, the fists (`vmSword.userData.fists`);
// the fix still stands, and the check reads the fists' mark. This drives the real loop (real frames, `attack(false)`), with the starting weapon and then with fists.
import { boot, check } from './lib/game.mjs';
const g = await boot(); const { page } = g;
await g.intoWorld();

const swing = () => page.evaluate(async () => {
  const rnd = Math.random; Math.random = () => .5;
  const e = buildZoneEnemy(WORLD.scene, [], px + fwdX * 1.2, pz + fwdZ * 1.2, 'Bandit', null);
  if (!e.mesh.parent) WORLD.scene.add(e.mesh); e.locked = false; e.spd = 0; e.atkCd = 1e9; e.telegraphT = 0;
  e.hp = e.maxHp = 1e6; e.def = 0; if (!ZE.includes(e)) ZE.push(e);
  atkCd = 0; stamina = maxStamina; swingT = 0; _pendingStrike = null;
  attack(false);
  const out = { start: +swingT.toFixed(3), pending: !!_pendingStrike, vm: !!vmSword, fistsVm: !!(vmSword && vmSword.userData && vmSword.userData.fists), frames: 0, firedAt: -1 };
  const t0 = performance.now();
  await new Promise(r => { const f = () => { out.frames++; if (out.firedAt < 0 && !_pendingStrike) out.firedAt = out.frames; if ((swingT === 0 && !_pendingStrike) || out.frames > 60) r(); else requestAnimationFrame(f); }; requestAnimationFrame(f); });
  out.ms = Math.round(performance.now() - t0);
  out.end = swingT; out.left = !!_pendingStrike; out.dmg = 1e6 - e.hp;
  if (ZE.includes(e)) ZE.splice(ZE.indexOf(e), 1); WORLD.scene.remove(e.mesh); Math.random = rnd;
  return out;
});

const sword = await swing();
console.log('weapon', JSON.stringify(sword));
await page.evaluate(() => { clickEqSlot('weapon'); });
await g.frames(3);
const fist = await swing();
console.log('fists', JSON.stringify(fist));
const fist2 = await swing();
console.log('fists again', JSON.stringify(fist2));

check('the starting weapon swings, strikes and lands', sword.vm && sword.start > 0 && sword.end === 0 && !sword.left && sword.dmg > 0, sword);
check('an empty hand holds the fists\' view model (Session 396, #80), and a punch starts a swing with a strike pending', fist.fistsVm && !sword.fistsVm && fist.start > 0 && fist.pending, fist);
check('the punch runs out to zero and its strike fires', fist.end === 0 && !fist.left && fist.firedAt > 0, fist);
check('the punch lands, for less than the weapon', fist.dmg > 0 && fist.dmg < sword.dmg, { fist: fist.dmg, sword: sword.dmg });
check('a second punch lands too (the swing length is latched afresh)', fist2.end === 0 && !fist2.left && fist2.dmg > 0, fist2);
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
