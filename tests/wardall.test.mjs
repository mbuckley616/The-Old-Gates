// The ward on every blow (Session 320). Session 316 made the Shield spell and the Boon of Stone (`warding`) soften blows
// where the Warding potion (`dmgReduce`, "-X% damage taken") did, but the potion itself was only ever wired into the
// unblocked melee blow and the Faolchú's fire. A blow taken on a held block, an archer's arrow, a dungeon bolt and the
// traps ignored both. Now every one of them goes through `_warded`. Each path is driven through the game's own code,
// with and without a Shield of tier 3 (×.5), and with the Warding potion alone.
import { boot, check } from './lib/game.mjs';
import { enterDungeon } from './lib/dungeonshot.mjs';
const g = await boot(); const { page } = g;
await g.intoWorld();

const world = await page.evaluate(() => {
  const out = {}; FINISHER_SAFE_UNTIL = 0; const rnd = Math.random; Math.random = () => 0;
  const shield = () => { ACTIVE_BUFFS.length = 0; applySpellBuff(SPELLS.find(s => s.id === 'sciath'), 3); };
  const potion = () => { ACTIVE_BUFFS.length = 0; _applyBuff({ type: 'dmgReduce', mult: .6, duration: 60, label: 'Warding' }); };
  const none = () => { ACTIVE_BUFFS.length = 0; };
  // a blow on a held block, through executeStrike (outside the parry window)
  const e = buildZoneEnemy(WORLD.scene, [], px + fwdX * 1.2, pz + fwdZ * 1.2, 'Bandit', null); if (!e.mesh.parent) WORLD.scene.add(e.mesh);
  e.locked = false; e.spd = 0; e.atkCd = 1e9; e.telegraphT = 0;
  const held = () => { PHP = maxHP; stamina = 100; PPOST.posture = PPOST.maxPosture; PPOST.stagUntil = 0; blocking = true; lastBlockAttemptT = -1e9; lastBlockAttemptG = -1e9;
    executeStrike(e, 40, (performance.now() / 1000 + 100) * 1000); blocking = false; return maxHP - PHP; };
  // an archer's arrow in the open world, fired from four units ahead and ticked until it lands
  const arrow = (block) => { PHP = maxHP; blocking = block; const a = { x: px + fwdX * 4, z: pz + fwdZ * 4, dmg: 30, name: 'Bandit Archer' };
    ZARROWS.length = 0; fireZoneArrow(a, WORLD.scene); for (let i = 0; i < 60 && ZARROWS.length; i++) tickZoneArrows(1 / 60, performance.now());
    blocking = false; return maxHP - PHP; };
  for (const [k, f] of [['none', none], ['shield', shield], ['potion', potion]]) { f();
    out[k] = { held: held(), arrow: arrow(false), arrowBlocked: arrow(true) }; }
  none(); Math.random = rnd; WORLD.scene.remove(e.mesh); PHP = maxHP; return out; });
console.log(' ', JSON.stringify(world));
const half = (a, b) => Math.abs(b - Math.max(1, Math.round(a * .5))) <= 1, sixty = (a, b) => Math.abs(b - Math.max(1, Math.round(a * .6))) <= 1;
check('a blow on a held block: the Shield (×.5) and the potion (×.6) soften it', world.none.held > 4 && half(world.none.held, world.shield.held) && sixty(world.none.held, world.potion.held), world);
check('an archer\'s arrow: softened by both', world.none.arrow > 4 && half(world.none.arrow, world.shield.arrow) && sixty(world.none.arrow, world.potion.arrow), world);
check('an arrow on a raised guard: softened by both', world.none.arrowBlocked > 2 && half(world.none.arrowBlocked, world.shield.arrowBlocked) && sixty(world.none.arrowBlocked, world.potion.arrowBlocked), world);

await enterDungeon(page, { theme: 'ruins', seed: 11, interior: 'cave', size: 'medium' });
const dun = await page.evaluate(() => {
  const out = {}; window._raf0 = window.requestAnimationFrame; const rr = REN.render; window.requestAnimationFrame = () => 0; REN.render = () => {};
  let t = performance.now(); const step = () => { t += 1000 / 60; loop(t); };
  ENEMIES.forEach(e => { e.dead = true; }); const gy = currentFloor === 2 ? FLOOR2_Y : 0;
  const shield = () => { ACTIVE_BUFFS.length = 0; applySpellBuff(SPELLS.find(s => s.id === 'sciath'), 3); };
  const none = () => { ACTIVE_BUFFS.length = 0; };
  // a Phantom's bolt reaching you: an orb at your chest
  const bolt = () => { PHP = maxHP; blocking = false; const orb = new THREE.Group(); orb.position.set(px, gy + .8, pz);
    orb.userData = { vx: 0, vy: 0, vz: 0, life: 4, isEnemyOrb: true, dmg: 30 }; dScene.add(orb); BALLS.push(orb); step(); return maxHP - PHP; };
  // the spike plate and the swinging blade, stepped on
  const spike = () => { PHP = maxHP; jumpY = gy; const rnd = Math.random; Math.random = () => 0;
    D_TRAPS.length = 0; D_TRAPS.push({ kind: 'spike', floor: currentFloor, x: px, z: pz, armed: true, t: 0, spikes: { position: { y: 0 } } });
    tickDungeonTraps(1 / 60); Math.random = rnd; D_TRAPS.length = 0; return maxHP - PHP; };
  const hangBlade = (x, z, gy) => { const p = new THREE.Group(); p.position.set(x, gy + FLOOR_HEIGHT - .1, z); const b = new THREE.Mesh(new THREE.BoxGeometry(.7, .5, .04)); b.position.y = -1.55; p.add(b); return p; }; // S580 — the hit reads the blade's own box
  const blade = () => { PHP = maxHP; blocking = false; jumpY = gy; D_TRAPS.length = 0;
    D_TRAPS.push({ kind: 'blade', floor: currentFloor, x: px, z: pz, ph: 0, hitT: 0, pivot: hangBlade(px, pz, gy) });
    tickDungeonTraps(1 / 60); D_TRAPS.length = 0; return maxHP - PHP; };
  for (const [k, f] of [['none', none], ['shield', shield]]) { f(); out[k] = { bolt: bolt(), spike: spike(), blade: blade() }; }
  none(); PHP = maxHP; window.requestAnimationFrame = _raf0; REN.render = rr; _raf0(loop); return out; });
console.log(' ', JSON.stringify(dun));
check('a Phantom\'s bolt: the Shield halves it', dun.none.bolt > 4 && half(dun.none.bolt, dun.shield.bolt), dun);
check('the spike plate: the Shield halves it', dun.none.spike > 4 && half(dun.none.spike, dun.shield.spike), dun);
check('the swinging blade: the Shield halves it', dun.none.blade > 4 && half(dun.none.blade, dun.shield.blade), dun);

check('no page errors', g.errs.length === 0, g.errs);
await g.close();
