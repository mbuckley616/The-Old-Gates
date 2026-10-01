// The Shield spell, the Boon of Stone and the Boon of the Road (Session 316). The spell and the Stone boon set a buff of
// type `warding`, and the Road boon one of type `swiftness`, but nothing read either type, so all three did nothing
// (found by the quest writer, run 2). Now `warding` scales the damage you take like the Warding potion (`dmgReduce`),
// the stronger of the two holding, and `swiftness` scales your speed.
import { boot, check } from './lib/game.mjs';
const g = await boot(); const { page } = g;
await g.intoWorld();
const stop = g.keepAlive();

const r = await page.evaluate(() => {
  const out = {}; ACTIVE_BUFFS.length = 0; FINISHER_SAFE_UNTIL = 0; blocking = false;
  const e = buildZoneEnemy(WORLD.scene, [], px + fwdX * 1.2, pz + fwdZ * 1.2, 'Bandit', null); if (!e.mesh.parent) WORLD.scene.add(e.mesh);
  e.locked = false; e.spd = 0; e.atkCd = 1e9; e.telegraphT = 0;
  const hit = () => { PHP = maxHP; blocking = false; lastBlockAttemptT = -1e9; lastBlockAttemptG = -1e9; executeStrike(e, 20, (performance.now() / 1000 + 100) * 1000); return maxHP - PHP; };
  out.bare = hit();
  const sp = SPELLS.find(s => s.id === 'sciath');
  applySpellBuff(sp, 1); out.shield1 = hit();
  applySpellBuff(sp, 2); out.shield2 = hit();
  applySpellBuff(sp, 3); out.shield3 = hit();
  ACTIVE_BUFFS.length = 0;
  _applyBuff({ type: 'warding', mult: .75, duration: 1800, label: 'the Boon of Stone' }); out.stone = hit();
  // with a Warding potion as well: the stronger holds, they don't multiply
  _applyBuff({ type: 'dmgReduce', mult: .85, duration: 60, label: 'Warding' }); out.stonePlusMild = hit();
  _applyBuff({ type: 'dmgReduce', mult: .6, duration: 60, label: 'Warding' }); out.stonePlusMaster = hit();
  ACTIVE_BUFFS.length = 0;
  _applyBuff({ type: 'dmgReduce', mult: .75, duration: 60, label: 'Warding' }); out.potionAlone = hit();
  ACTIVE_BUFFS.length = 0; WORLD.scene.remove(e.mesh);
  return out; });
check('a Bandit\'s 20-point blow lands for 20 with nothing on', r.bare === 20, r);
check('the Shield spell softens it: ×.7, ×.6, ×.5 by tier (14, 12, 10)', r.shield1 === 14 && r.shield2 === 12 && r.shield3 === 10, r);
check('the Boon of Stone softens it ×.75 (15)', r.stone === 15, r);
check('with a Warding potion too, the stronger holds (Stone .75 with a Mild .85: 15; with a Master .6: 12)', r.stonePlusMild === 15 && r.stonePlusMaster === 12, r);
check('the Warding potion alone works as before (15)', r.potionAlone === 15, r);

// the Road: the same walk through the game's own loop, stepped at a fixed 1/60 with rendering set aside, with and without;
// W is held on the real keyboard between the steps
await page.evaluate(() => { window._raf = window.requestAnimationFrame; window._rr = REN.render; window.requestAnimationFrame = () => 0; REN.render = () => {};
  window._t = performance.now(); window._step = (n) => { for (let i = 0; i < n; i++) { _t += 1000 / 60; loop(_t); } }; });
const walk = async (buff) => {
  await page.evaluate((buff) => { ACTIVE_BUFFS.length = 0; if (buff) _applyBuff({ type: 'swiftness', mult: 1.25, duration: 1800, label: 'the Boon of the Road' });
    PPOST.stagUntil = 0; PPOST.posture = PPOST.maxPosture; px = 13100; pz = 25450; jumpY = 0; yaw = 0; _step(10); window._x0 = px; window._z0 = pz; }, buff);
  await page.keyboard.down('w');
  const d = await page.evaluate(() => { _step(90); return +Math.hypot(px - _x0, pz - _z0).toFixed(3); });
  await page.keyboard.up('w'); await page.evaluate(() => _step(30));
  return d; };
await walk(false); // a first walk settles what the blows above left behind (the recoil, the posture)
const road = { plain: await walk(false), road: await walk(true), plain2: await walk(false) };
await page.evaluate(() => { ACTIVE_BUFFS.length = 0; window.requestAnimationFrame = _raf; REN.render = _rr; _raf(loop); });
road.ratio = +(road.road / road.plain).toFixed(3);
check('the Boon of the Road: a quarter again as far in the same 1.5 s (1.25 ± .03)', road.plain > 1 && Math.abs(road.plain2 / road.plain - 1) < .01 && Math.abs(road.ratio - 1.25) < .03, road);

stop();
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
