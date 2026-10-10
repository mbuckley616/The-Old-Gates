// Session 634: Michael's A on DECISION #190 in the open world. An alert foe chases at 85–110% of your walk (3.83), placed
// on that scale by its own speed: the trolls at the bottom, the beasts near the top. Before, it came at its speed × 1.25,
// 0.9–2.4 units a second. It sees you at 20 units in its cone (was 15) and hears you walk at 3 units, sneak at 1, in any
// direction (was 0.5 whatever you did). Driven by the game's own loop at fixed 1/60 ticks, outside Dunmore, by day.
import { boot, check } from './lib/game.mjs';
const g = await boot(); const { page } = g;
await g.intoWorld();
await g.settle('dunmore');
await page.evaluate(() => { window._drive = (step, max) => {
  const raf = window.requestAnimationFrame, rr = REN.render; window.requestAnimationFrame = () => 0; REN.render = () => {};
  let t = performance.now(), n = 0;
  try { for (; n < max; n++) { if (step(n)) break; t += 1000 / 60; loop(t); } }
  finally { window.requestAnimationFrame = raf; REN.render = rr; prevT = 0; }
  return n; };
  window._spawn = (kind, x, z) => { const e = unlockFoe(buildZoneEnemy(WORLD.scene, [], x, z, kind, null)); ZONES.world.enemies.push(e); return e; };
  window._drop = (e) => { e.dead = true; WORLD.scene.remove(e.mesh); const L = ZONES.world.enemies; L.splice(L.indexOf(e), 1); };
  window._clear = () => { for (const e of ZONES.world.enemies.slice()) if (!e.dead && !e.isBoss) _drop(e); }; });

// 1. the scale
const KINDS = ['Forest Troll', 'Skeleton', 'Bandit', 'Goblin', 'Wolf', 'Ash Hound', 'Dire Wolf'];
const scale = await page.evaluate((KINDS) => { const t = WORLD.siteAnywhere('dunmore'); return KINDS.map(k => { const e = _spawn(k, t.x + 200, t.z + 200); const spd = e.spd;
  const r = { k, name: e.name, spd, chase: +chaseSpeed(e).toFixed(2), was: +(spd * 1.25).toFixed(2) }; _drop(e); return r; }); }, KINDS);
console.log(' scale', JSON.stringify(scale));
check(`every alert foe chases at 85–110% of your walk: ${scale && scale.map(r => `${r.k} ${r.chase} (was ${r.was})`).join(', ')}`,
  !!scale && scale.every(r => r.chase >= 3.25 && r.chase <= 4.22) && scale[0].chase < scale[1].chase && scale[4].chase > scale[2].chase && scale[6].chase > 4.0, scale);

// 2. in the loop: an alert foe 14 units off, you standing still, covers its chase speed in a second
const run = await page.evaluate((KINDS) => { forceTime(12); _clear(); const t = WORLD.siteAnywhere('dunmore'); px = t.x + 140; pz = t.z + 140; yaw = 0;
  const out = [];
  for (const k of ['Forest Troll', 'Skeleton', 'Wolf', 'Dire Wolf']) {
    let best = null;
    for (let a = 0; a < 8 && !best; a++) { const ang = a * Math.PI / 4, x = px + Math.sin(ang) * 14, z = pz + Math.cos(ang) * 14; let clear = true;
      for (let s = 0; s <= 14; s += .5) if (WORLD.solidAt(px + Math.sin(ang) * s, pz + Math.cos(ang) * s)) { clear = false; break; }
      if (clear) best = { x, z }; }
    if (!best) { out.push({ k, none: true }); continue; }
    const e = _spawn(k, best.x, best.z); e.alert = true; const d0 = Math.hypot(e.x - px, e.z - pz);
    _drive(() => { PHP = maxHP; return false; }, 60);
    const d1 = Math.hypot(e.x - px, e.z - pz); out.push({ k, moved: +(d0 - d1).toFixed(2), chase: +chaseSpeed(e).toFixed(2), alert: e.alert }); _drop(e); }
  return out; }, KINDS);
console.log(' run', JSON.stringify(run));
check(`in the loop, an alert foe closes at its chase speed in a second: ${run.map(r => `${r.k} ${r.moved} of ${r.chase}`).join(', ')}`,
  run.every(r => !r.none && r.alert && Math.abs(r.moved - r.chase) < .35), run);

// 3. sight: a foe that faces you sees you at 18 units, not at 22
const sight = await page.evaluate(() => { _clear(); const res = {};
  for (const D of [18, 22]) { const e = _spawn('Bandit', px, pz - D); const near = [];
    _drive((n) => { PHP = maxHP; e.combatYaw = Math.atan2(px - e.x, pz - e.z); return e.alert; }, 20);
    res[D] = e.alert; _drop(e); }
  return res; });
check(`a foe that faces you sees you at 18 units (${sight[18]}) and not at 22 (${sight[22]}); it saw 15 before`, sight[18] === true && sight[22] === false, sight);

// 4. hearing: behind a foe, walking at 2.5 units is heard; standing still or sneaking at 2.5 is not; sneaking at 0.8 is
const hear = await page.evaluate(() => { _clear(); const e = _spawn('Bandit', px, pz - 5); e.combatYaw = 0; e.alert = false;
  const behind = d => { e.x = px; e.z = pz - d; e.combatYaw = Math.PI; }; const was = { step: _pStep, sn: _sneaking };
  const r = {}; behind(2.5);
  _pStep = true; _sneaking = false; r.walk = canSeePlayer(e, 2.5, 20); _pStep = false; r.still = canSeePlayer(e, 2.5, 20);
  _pStep = true; _sneaking = true; r.sneak25 = canSeePlayer(e, 2.5, 20); r.sneak08 = canSeePlayer(e, .8, 20); r.walk35 = (_sneaking = false, canSeePlayer(e, 3.5, 20));
  _pStep = was.step; _sneaking = was.sn;
  // in the loop: D held, the foe's back to you at 2.5 units, it turns on you
  e.x = px; e.z = pz + 2.5; e.alert = false; e.walkT = 0; e.homeX = e.x; e.homeZ = e.z; yaw = Math.PI / 2;
  K['KeyD'] = true; let n = 0; try { n = _drive(() => { PHP = maxHP; e.combatYaw = Math.atan2(e.x - px, e.z - pz); return e.alert; }, 30); } finally { K['KeyD'] = false; }
  r.loopAlert = e.alert; r.ticks = n; r.loopStep = _pStep;
  // and standing still in the same place it does not
  e.alert = false; e.x = px; e.z = pz + 2.5; _drive(() => { PHP = maxHP; e.combatYaw = Math.atan2(e.x - px, e.z - pz); return e.alert; }, 30); r.stillAlert = e.alert;
  _drop(e); return r; });
console.log(' hear', JSON.stringify(hear));
check(`behind a foe you are heard walking at 2.5 (${hear.walk}), not at 3.5 (${hear.walk35}), not standing still (${hear.still}), not sneaking at 2.5 (${hear.sneak25}); sneaking at 0.8 you are (${hear.sneak08})`,
  hear.walk && !hear.walk35 && !hear.still && !hear.sneak25 && hear.sneak08, hear);
check(`in the loop, walking behind a foe at 2.5 units turns it on you in ${hear.ticks} ticks; standing there it does not (${hear.stillAlert})`, hear.loopAlert && !hear.stillAlert, hear);

check('no page errors', g.errs.length === 0, g.errs);
await g.close();
