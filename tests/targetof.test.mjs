// Session 468: the co-op rule "a foe picks its target through one function, targetOf(e), not by reading px/pz" (CLAUDE.md,
// Michael's A on #119), for the two foe ticks: the open world's (`tickZoneEnemies`, with its archers' arrows) and the
// dungeon's (the loop's ENEMIES pass). Solo, targetOf returns you, live. To prove the ticks read nothing else, targetOf is
// pointed at a decoy on the far side of the foe from you: the foe must go to the decoy and turn its back on you. Time is the
// loop's own tick at fixed 1/60, the draw held off, as `fistfight` does.
import { boot, check } from './lib/game.mjs';
const g = await boot(); const { page } = g;
await g.intoWorld();
await page.evaluate(() => { window._targetOf = targetOf; window._drive = (step, max) => {
  const raf = window.requestAnimationFrame, rr = REN.render; window.requestAnimationFrame = () => 0; REN.render = () => {};
  let t = performance.now(), n = 0;
  try { for (; n < max; n++) { if (step && step()) break; PHP = maxHP; dead = false; t += 1000 / 60; loop(t); } }
  finally { window.requestAnimationFrame = raf; REN.render = rr; prevT = 0; }
  return n; }; });

const solo = await page.evaluate(() => { const T = targetOf({}); const a = { x: T.x, z: T.z, px, pz, player: T.player }; px += 3; pz -= 2; const b = { x: T.x, z: T.z, px, pz }; px -= 3; pz += 2;
  return { a, b, same: targetOf({}) === targetOf({ other: 1 }) }; });
check('solo, targetOf(e) is you, read live (no copy): moved 3 and −2, it moves with you', solo.a.x === solo.a.px && solo.a.z === solo.a.pz && solo.b.x === solo.b.px && solo.b.z === solo.b.pz && solo.a.player === true && solo.same, solo);

// the open world: a Bandit six units north of you, alert. Once with targetOf as built, once pointed at a decoy six north of him.
const world = (decoy) => page.evaluate((decoy) => { forceTime(12); PHP = maxHP; dead = false;
  const x0 = px, z0 = pz; const e = unlockFoe(buildZoneEnemy(WORLD.scene, [], px, pz - 6, 'Bandit', null)); e.alert = true; ZONES.world.enemies.push(e);
  const D = { x: px, z: pz - 12 }; if (decoy) targetOf = () => D;
  const d0 = { you: Math.hypot(e.x - x0, e.z - z0), decoy: Math.hypot(e.x - D.x, e.z - D.z) };
  try { window._drive(null, 120); } finally { targetOf = window._targetOf; }
  const d1 = { you: Math.hypot(e.x - x0, e.z - z0), decoy: Math.hypot(e.x - D.x, e.z - D.z) };
  const yawTo = (p) => { let a = Math.atan2(p.x - e.x, p.z - e.z) - (e.combatYaw || 0); a = Math.atan2(Math.sin(a), Math.cos(a)); return +Math.abs(a).toFixed(2); };
  const out = { d0: { you: +d0.you.toFixed(2), decoy: +d0.decoy.toFixed(2) }, d1: { you: +d1.you.toFixed(2), decoy: +d1.decoy.toFixed(2) }, faceYou: yawTo({ x: x0, z: z0 }), faceDecoy: yawTo(D), tell: !!(e.telegraphT > 0) };
  e.dead = true; if (e.mesh && e.mesh.parent) e.mesh.parent.remove(e.mesh); ZONES.world.enemies.splice(ZONES.world.enemies.indexOf(e), 1); px = x0; pz = z0; return out; }, decoy);
const w0 = await world(false), w1 = await world(true);
console.log('world', JSON.stringify(w0), JSON.stringify(w1));
check(`open world, as built: the Bandit closes on you (${w0.d0.you} → ${w0.d1.you})`, w0.d1.you < w0.d0.you - 2, w0);
check(`open world, targetOf at a decoy: he goes to it (${w1.d0.decoy} → ${w1.d1.decoy}) and not to you (${w1.d0.you} → ${w1.d1.you})`, w1.d1.decoy < w1.d0.decoy - 2 && w1.d1.you > w1.d0.you + 2, w1);

// an archer's arrow is loosed at targetOf, not at you
const arrow = await page.evaluate(() => { const D = { x: px + 10, z: pz }; const e = { x: px, z: pz - 10, y: 0, mesh: null, name: 'Bandit Archer', dmg: 5 };
  targetOf = () => D; const n0 = ZARROWS.length; try { fireZoneArrow(e, WORLD.scene); } catch (err) { targetOf = window._targetOf; return { err: String(err) }; } targetOf = window._targetOf;
  const a = ZARROWS[ZARROWS.length - 1]; const out = { added: ZARROWS.length - n0, dir: a ? [+(a.vx / Math.hypot(a.vx, a.vz)).toFixed(2), +(a.vz / Math.hypot(a.vx, a.vz)).toFixed(2)] : null };
  if (a) { if (a.m && a.m.parent) a.m.parent.remove(a.m); ZARROWS.pop(); } return out; });
console.log('arrow', JSON.stringify(arrow));
// the decoy is 10 east and 10 south of the archer: the arrow flies along (0.71, 0.71); at you it would fly due south (0, 1)
check('an archer\'s arrow flies at targetOf (the decoy south-east), not at you (due south)', arrow.added === 1 && Math.abs(arrow.dir[0] - .71) < .05 && Math.abs(arrow.dir[1] - .71) < .05, arrow);

// the dungeon: a foe that walks, alert, with you on one side and the decoy on the other
await page.evaluate(() => { const p = makePortalDef(WORLD.doorAnywhere(42)); const wp = WORLD.dungeonPos[42]; if (wp) { p.x = wp.x; p.z = wp.z; } p.zone = 'world'; px = p.x; pz = p.z + 3; goToDungeon(p); });
for (let k = 0; k < 60 && !(await page.evaluate(() => activeZoneId === 'dungeon' && scene === dScene && ENEMIES.length > 0)); k++) await page.waitForTimeout(500);
const setup = await page.evaluate(() => { const free = (x, z) => !dSolid(x, z) && !dSolid(x + .3, z) && !dSolid(x - .3, z) && !dSolid(x, z + .3) && !dSolid(x, z - .3);
  const line = (a, b) => { for (let t = 0; t <= 1; t += .05) if (dSolid(a.x + (b.x - a.x) * t, a.z + (b.z - a.z) * t)) return false; return true; };
  for (const e of ENEMIES) { if (e.dead || e.dormant || e.disguised || (e.floor != null && e.floor !== currentFloor)) continue; const fam = enemyPostureFamily(e); if (fam === 'slime' || fam === 'mimic') continue;
    for (let k = 0; k < 8; k++) { const a = k / 8 * Math.PI * 2, dx = Math.sin(a), dz = Math.cos(a);
      const P = { x: e.x + dx * 4, z: e.z + dz * 4 }, D = { x: e.x - dx * 4, z: e.z - dz * 4 };
      if (free(P.x, P.z) && free(D.x, D.z) && line(e, P) && line(e, D)) { window._dfoe = e; window._dP = P; window._dD = D; window._dE = { x: e.x, z: e.z }; return { name: e.name, fam, P, D, at: { x: e.x, z: e.z } }; } } }
  return { none: true, n: ENEMIES.length }; });
const dun = (decoy) => page.evaluate((decoy) => { const e = window._dfoe, P = window._dP, D = window._dD; e.x = window._dE.x; e.z = window._dE.z; e.alert = true; e.atkCd = 5; e.path = null; e.pathT = 0;
  for (const o of ENEMIES) if (o !== e && !o.dead) { o._hold = [o.x, o.z]; }
  px = P.x; pz = P.z; jumpY = 0; if (decoy) targetOf = () => D;
  const d0 = { you: Math.hypot(e.x - P.x, e.z - P.z), decoy: Math.hypot(e.x - D.x, e.z - D.z) };
  try { window._drive(() => { px = P.x; pz = P.z; e.atkCd = Math.max(e.atkCd, 1); return false; }, 90); } finally { targetOf = window._targetOf; }
  return { d0: { you: +d0.you.toFixed(2), decoy: +d0.decoy.toFixed(2) }, d1: { you: +Math.hypot(e.x - P.x, e.z - P.z).toFixed(2), decoy: +Math.hypot(e.x - D.x, e.z - D.z).toFixed(2) }, alert: e.alert, dead: e.dead }; }, decoy);
let d0 = null, d1 = null;
if (!setup.none) { d0 = await dun(false); d1 = await dun(true); }
console.log('dungeon', JSON.stringify(setup), JSON.stringify(d0), JSON.stringify(d1));
check(`dungeon, as built: the ${setup.name} closes on you (${d0 && d0.d0.you} → ${d0 && d0.d1.you})`, !setup.none && d0.d1.you < d0.d0.you - 1, { setup, d0 });
check(`dungeon, targetOf at a decoy: it goes to the decoy (${d1 && d1.d0.decoy} → ${d1 && d1.d1.decoy}), away from you (${d1 && d1.d0.you} → ${d1 && d1.d1.you})`, !setup.none && d1.d1.decoy < d1.d0.decoy - 1 && d1.d1.you > d1.d0.you + 1, { setup, d1 });

check('no page errors', g.errs.length === 0, g.errs);
await g.close();
