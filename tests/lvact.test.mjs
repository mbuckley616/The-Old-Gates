// What counts toward an attribute's growth (Session 324). A level's points multiply by how much you did the thing
// each attribute is tied to (`lvAct`, `getMultiplier`): Fortitude by damage taken, Resolve by stamina run dry. Damage
// taken counted only four paths (an unblocked blow, the Faolchú's fire, a bolt, a drain); an arrow, a blow on a held
// block, a trap, a charge, a heavy blow and a volley did not. Running dry counted only on the sprint, not on a roll or
// a block. Each is driven here through the game's own code and the counters read.
import { boot, check } from './lib/game.mjs';
import { enterDungeon } from './lib/dungeonshot.mjs';
const g = await boot(); const { page } = g;
await g.intoWorld();
const stop = g.keepAlive();

const w = await page.evaluate(() => {
  const out = {}; FINISHER_SAFE_UNTIL = 0; ACTIVE_BUFFS.length = 0; const rnd = Math.random; Math.random = () => 0;
  const took = (f) => { PHP = maxHP; lvAct.damageTaken = 0; f(); return { hp: maxHP - PHP, counted: lvAct.damageTaken }; };
  out.arrow = took(() => { blocking = false; const a = { x: px + fwdX * 4, z: pz + fwdZ * 4, dmg: 30, name: 'Bandit Archer' };
    ZARROWS.length = 0; fireZoneArrow(a, WORLD.scene); for (let i = 0; i < 60 && ZARROWS.length; i++) tickZoneArrows(1 / 60, performance.now()); });
  const e = buildZoneEnemy(WORLD.scene, [], px + fwdX * 1.2, pz + fwdZ * 1.2, 'Bandit', null); if (!e.mesh.parent) WORLD.scene.add(e.mesh);
  e.locked = false; e.spd = 0; e.atkCd = 1e9; e.telegraphT = 0;
  out.held = took(() => { stamina = 100; PPOST.posture = PPOST.maxPosture; PPOST.stagUntil = 0; blocking = true; lastBlockAttemptT = -1e9; lastBlockAttemptG = -1e9;
    executeStrike(e, 40, (performance.now() / 1000 + 100) * 1000); blocking = false; });
  WORLD.scene.remove(e.mesh); Math.random = rnd;
  // a roll on the last of your stamina (a roll needs its whole 18)
  lvAct.staminaDepleted = 0; ROLL = null; staminaCD = 0; stamina = ROLL_STAM; startRoll(performance.now() / 1000, {}); ROLL = null;
  out.rollDry = lvAct.staminaDepleted; staminaCD = 0; stamina = maxStamina; PHP = maxHP;
  return out; });
console.log(' ', JSON.stringify(w));
check('an archer\'s arrow counts toward Fortitude', w.arrow.hp > 0 && w.arrow.counted === w.arrow.hp, w.arrow);
check('a blow on a held block counts toward Fortitude', w.held.hp > 0 && w.held.counted === w.held.hp, w.held);
check('a roll that runs you dry counts toward Resolve', w.rollDry === 1, w);

await enterDungeon(page, { theme: 'ruins', seed: 11, interior: 'cave', size: 'medium' });
const d = await page.evaluate(() => {
  const out = {}; const gy = currentFloor === 2 ? FLOOR2_Y : 0;
  const took = (f) => { PHP = maxHP; lvAct.damageTaken = 0; f(); return { hp: maxHP - PHP, counted: lvAct.damageTaken }; };
  out.spike = took(() => { jumpY = gy; D_TRAPS.length = 0; D_TRAPS.push({ kind: 'spike', floor: currentFloor, x: px, z: pz, armed: true, t: 0, spikes: { position: { y: 0 } } });
    tickDungeonTraps(1 / 60); D_TRAPS.length = 0; });
  const hangBlade = (x, z, gy) => { const p = new THREE.Group(); p.position.set(x, gy + FLOOR_HEIGHT - .1, z); const b = new THREE.Mesh(new THREE.BoxGeometry(.7, .5, .04)); b.position.y = -1.55; p.add(b); return p; }; // S580 — the hit reads the blade's own box
  out.blade = took(() => { blocking = false; jumpY = gy; D_TRAPS.length = 0; D_TRAPS.push({ kind: 'blade', floor: currentFloor, x: px, z: pz, ph: 0, hitT: 0, pivot: hangBlade(px, pz, gy) });
    tickDungeonTraps(1 / 60); D_TRAPS.length = 0; });
  PHP = maxHP; return out; });
console.log(' ', JSON.stringify(d));
check('the spike plate and the swinging blade count toward Fortitude', d.spike.hp > 0 && d.spike.counted === d.spike.hp && d.blade.hp > 0 && d.blade.counted === d.blade.hp, d);

stop();
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
