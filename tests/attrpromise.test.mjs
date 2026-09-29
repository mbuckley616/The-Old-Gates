// What the level-up card promises (Session 323). Resolve reads "+1% magic resist" a point and Finesse "-5% sprint
// cost" a point, but no code read either: the Faolchú's fire and the dungeon's bolts landed the same at Resolve 10,
// and the sprint drained 14 a second at any Finesse. Measured through the game's own code at 0 and 10 points.
import { boot, check } from './lib/game.mjs';
import { enterDungeon } from './lib/dungeonshot.mjs';
const g = await boot(); const { page } = g;
await g.intoWorld();

// the sprint: the game's own loop at a fixed 1/60, Shift and W held, for one second (the drain is 14 a second)
await page.evaluate(() => { window._raf = window.requestAnimationFrame; window._rr = REN.render; window.requestAnimationFrame = () => 0; REN.render = () => {};
  window._t = performance.now(); window._step = (n) => { for (let i = 0; i < n; i++) { _t += 1000 / 60; loop(_t); } }; });
const sprint = async (fin) => {
  await page.evaluate((fin) => { window._keepF = ATTRS.finesse; ATTRS.finesse = fin; px = 13100; pz = 25450; jumpY = 0; yaw = 0; ACTIVE_BUFFS.length = 0; staminaCD = 0; stamina = 50; _step(5); window._r0 = stamina; _step(60); window._regen = stamina - _r0; stamina = 60; }, fin);
  await page.keyboard.down('Shift'); await page.keyboard.down('w');
  // what the sprint drains is what it cost net, plus the regeneration measured standing still just before
  const used = await page.evaluate(() => { _step(1); const s0 = stamina; _step(60); return +(s0 - stamina + _regen).toFixed(2); });
  await page.keyboard.up('w'); await page.keyboard.up('Shift');
  await page.evaluate(() => { ATTRS.finesse = _keepF; _step(10); });
  return used; };
const sp = { f0: await sprint(0), f10: await sprint(10) };
await page.evaluate(() => { window.requestAnimationFrame = _raf; REN.render = _rr; _raf(loop); });
console.log(' ', JSON.stringify(sp));
check('Finesse 10: the sprint costs half (−5% a point): 14 → 7 a second', Math.abs(sp.f0 - 14) < .3 && Math.abs(sp.f10 / sp.f0 - .5) < .03, sp);

await enterDungeon(page, { theme: 'ruins', seed: 11, interior: 'cave', size: 'medium' });
const d = await page.evaluate(() => {
  const out = {}; const keep = ATTRS.resolve; const raf = window.requestAnimationFrame, rr = REN.render; window.requestAnimationFrame = () => 0; REN.render = () => {};
  let t = performance.now(); ENEMIES.forEach(e => { e.dead = true; }); const gy = currentFloor === 2 ? FLOOR2_Y : 0; ACTIVE_BUFFS.length = 0;
  const bolt = (block) => { PHP = maxHP; stamina = 100; blocking = block; const orb = new THREE.Group(); orb.position.set(px, gy + .8, pz);
    orb.userData = { vx: 0, vy: 0, vz: 0, life: 4, isEnemyOrb: true, dmg: 60 }; dScene.add(orb); BALLS.push(orb); t += 1000 / 60; loop(t); blocking = false;
    return { hp: maxHP - PHP, st: 100 - stamina }; };
  for (const r of [0, 10]) { ATTRS.resolve = r; out['r' + r] = { bolt: bolt(false), blocked: bolt(true) }; }
  ATTRS.resolve = keep; PHP = maxHP; window.requestAnimationFrame = raf; REN.render = rr; raf(loop); return out; });
console.log(' ', JSON.stringify(d));
const armour = await page.evaluate(() => Math.floor(_armour() * .3));
check('Resolve 10: a Phantom\'s 60-point bolt lands 10% lighter (before armour)', d.r10.bolt.hp === 54 - armour && d.r0.bolt.hp === 60 - armour, { d, armour });
check('Resolve 10: on a raised guard too', d.r10.blocked.hp < d.r0.blocked.hp, d);

check('no page errors', g.errs.length === 0, g.errs);
await g.close();
