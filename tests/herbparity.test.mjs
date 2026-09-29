// The herbs' hidden effects, second pass (Session 322): the ones that worked in only one place. Ferrous Guard ("+8
// defense") counted only against a dungeon creature's blow; Mist Fern ("-20% stamina cost") only on the sprint;
// Firemoss ("+10% melee damage") and Caor Dubh ("+40% damage") only on a swing in the open world; Shadowcap ("enemies
// lose track of you") only underground. Each is now measured in the place it was missing, with and without.
import { boot, check } from './lib/game.mjs';
import { enterDungeon } from './lib/dungeonshot.mjs';
const g = await boot(); const { page } = g;
await g.intoWorld();
const stop = g.keepAlive();

const w = await page.evaluate(() => {
  const out = {}; FINISHER_SAFE_UNTIL = 0; blocking = false; const rnd = Math.random;
  const guard = () => _applyBuff({ ...HERB_DEF.ferrousweed.item.hiddenEffect });
  const fern = () => _applyBuff({ ...HERB_DEF.mistfern.item.hiddenEffect });
  const veil = () => _applyBuff({ ...HERB_DEF.shadowcap.item.hiddenEffect });
  // an archer's 30-point arrow
  const arrow = () => { Math.random = () => 0; PHP = maxHP; const a = { x: px + fwdX * 4, z: pz + fwdZ * 4, dmg: 30, name: 'Bandit Archer' };
    ZARROWS.length = 0; fireZoneArrow(a, WORLD.scene); for (let i = 0; i < 60 && ZARROWS.length; i++) tickZoneArrows(1 / 60, performance.now()); Math.random = rnd; return maxHP - PHP; };
  ACTIVE_BUFFS.length = 0; out.arrow = arrow(); guard(); out.arrowGuard = arrow(); out.armour = [_armour() - 8, _armour()];
  // a swing and a roll: what they cost
  const swing = () => { atkCd = 0; stamina = 100; attack(false); atkCd = 0; return 100 - stamina; };
  const roll = () => { ROLL = null; stamina = 100; startRoll(performance.now() / 1000, {}); ROLL = null; return 100 - stamina; };
  ACTIVE_BUFFS.length = 0; out.swing = swing(); out.roll = roll(); fern(); out.swingFern = swing(); out.rollFern = roll();
  // a Bandit who has seen you, eight units off: with the veil he forgets you and does not see you again
  ACTIVE_BUFFS.length = 0;
  const e = buildZoneEnemy(WORLD.scene, [], px + fwdX * 8, pz + fwdZ * 8, 'Bandit', null); if (!e.mesh.parent) WORLD.scene.add(e.mesh); e.locked = false; ZE.push(e);
  const watch = (n) => { e.x = px + fwdX * 8; e.z = pz + fwdZ * 8; e.alert = true; e.combatYaw = Math.atan2(px - e.x, pz - e.z); let alert = 0;
    for (let i = 0; i < n; i++) { tickZoneEnemies(1 / 60, performance.now(), WORLD.scene); if (e.alert) alert++; } return alert; };
  out.alertPlain = watch(30); veil(); out.alertVeil = watch(30);
  ACTIVE_BUFFS.length = 0; out.alertAfter = watch(30);
  ZE.splice(ZE.indexOf(e), 1); WORLD.scene.remove(e.mesh); PHP = maxHP; return out; });
console.log(' ', JSON.stringify(w));
check('Ferrous Guard: +8 armour against an archer\'s arrow in the open world (4 less, at half armour)', w.arrow - w.arrowGuard === 4, w);
check('Mist Fern: a swing costs a fifth less', w.swing > 0 && Math.abs(w.swingFern / w.swing - .8) < .01, w);
check('Mist Fern: a roll costs a fifth less (18 → 14.4)', Math.abs(w.roll - 18) < .01 && Math.abs(w.rollFern - 14.4) < .01, w);
check('Shadowcap in the open world: a Bandit who saw you loses you, and finds you again when it ends', w.alertPlain === 30 && w.alertVeil === 0 && w.alertAfter > 0, w);

await enterDungeon(page, { theme: 'ruins', seed: 11, interior: 'cave', size: 'medium' });
const d = await page.evaluate(() => {
  const out = {}; const rnd = Math.random; Math.random = () => .5; const lvl = level; level = 50; // a big base, so rounding cannot hide a tenth
  const e = ENEMIES.find(x => !x.dead && x.floor === currentFloor && !x.disguised); ENEMIES.forEach(x => { if (x !== e) x.dead = true; });
  e.shieldUp = false; e.resist = {}; e.def = 0;
  const hit = () => { e.x = px + fwdX * 1.2; e.z = pz + fwdZ * 1.2; e.hp = e.maxHp = 1e6; e.posture = 1e6; e.maxPosture = 1e6; e.dead = false; _resolveDungeonStrike(false); return 1e6 - e.hp; };
  ACTIVE_BUFFS.length = 0; out.plain = hit();
  _applyBuff({ ...HERB_DEF.firemoss.item.hiddenEffect }); out.firemoss = hit();
  ACTIVE_BUFFS.length = 0; _applyBuff({ ...HERB_DEF.caordubh.item.hiddenEffect }); out.caordubh = hit(); level = lvl;
  // a Phantom's 30-point bolt, with and without Ferrous Guard
  const gy = currentFloor === 2 ? FLOOR2_Y : 0; window._raf0 = window.requestAnimationFrame; const rr = REN.render; window.requestAnimationFrame = () => 0; REN.render = () => {};
  let t = performance.now(); e.dead = true;
  const bolt = () => { PHP = maxHP; blocking = false; const orb = new THREE.Group(); orb.position.set(px, gy + .8, pz);
    orb.userData = { vx: 0, vy: 0, vz: 0, life: 4, isEnemyOrb: true, dmg: 30 }; dScene.add(orb); BALLS.push(orb); t += 1000 / 60; loop(t); return maxHP - PHP; };
  ACTIVE_BUFFS.length = 0; out.bolt = bolt(); _applyBuff({ ...HERB_DEF.ferrousweed.item.hiddenEffect }); out.boltGuard = bolt(); out.armour = _armour();
  ACTIVE_BUFFS.length = 0; PHP = maxHP; Math.random = rnd; window.requestAnimationFrame = _raf0; REN.render = rr; _raf0(loop); return out; });
console.log(' ', JSON.stringify(d));
check('Firemoss underground: a swing lands a tenth harder', d.plain > 0 && Math.abs(d.firemoss / d.plain - 1.1) < .03, d);
check('Caor Dubh underground: +40%', Math.abs(d.caordubh / d.plain - 1.4) < .03, d);
check('Ferrous Guard against a Phantom\'s bolt (armour at .3: 2 less)', d.bolt - d.boltGuard === Math.floor(d.armour * .3) - Math.floor((d.armour - 8) * .3), d);

stop();
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
