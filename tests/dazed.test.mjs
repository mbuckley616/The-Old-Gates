// The lair beast's daze (Session 130; owed to play in backlog G, *Saves first*: "the creatures in real play — the daze").
// A lair's beast charges: every 7 s from 5–16 units it comes at you at four times its speed. If the charge meets a wall it
// *slams into the ground, dazed — now!*: dazed for 2.4 s and taking double damage. The skill is to sidestep it into
// something solid. Played here in the running game (the loop's own tick at fixed 1/60, the draw held off, as `duelrhythm`
// does): a Cave Bear made a lair's beast in Dunmore, you with a house wall at your back, a sidestep as it comes.
// Session 441: the daze held the beast only in `tickBehaviours`; `tickZoneEnemies` went on chasing and biting, so a dazed
// bear walked after you and struck through the daze. It now stands, swaying, until the daze is over.
import { boot, check } from './lib/game.mjs';
const g = await boot(); const { page } = g;
await g.intoWorld();
await g.settle('dunmore');
await page.evaluate(() => { window._drive = (step, max) => {
  const raf = window.requestAnimationFrame, rr = REN.render; window.requestAnimationFrame = () => 0; REN.render = () => {};
  let t = performance.now(), n = 0;
  try { for (; n < max; n++) { if (step()) break; t += 1000 / 60; loop(t); } }
  finally { window.requestAnimationFrame = raf; REN.render = rr; prevT = 0; }
  return n; }; });

const r = await page.evaluate(() => {
  forceTime(12); PHP = maxHP; dead = false; PPOST.stagUntil = 0;
  // a house wall with ten clear units in front of it, near the plaza
  const t = WORLD.siteAnywhere('dunmore'); let W = null, dir = null;
  const clear = (x, z) => !WORLD.solidAt(x, z) && WORLD.worldH(x, z) > 0;
  for (let r = 6; r < 60 && !W; r += 1) for (let a = 0; a < 64 && !W; a++) { const x = t.x + Math.cos(a / 64 * Math.PI * 2) * r, z = t.z + Math.sin(a / 64 * Math.PI * 2) * r; if (!WORLD.solidAt(x, z)) continue;
    for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { let ok = true; for (let k = 1; k <= 12; k++) if (!clear(x + dx * k * .9, z + dz * k * .9) || !clear(x + dx * k * .9 - dz * 4, z + dz * k * .9 + dx * 4)) { ok = false; break; }
      if (ok && !WORLD.solidAt(x + dx * .9, z + dz * .9)) { W = { x, z }; dir = [dx, dz]; break; } } }
  if (!W) return { noWall: true };
  // you stand 1.6 in front of the wall; the bear 8 out, alert
  px = W.x + dir[0] * 1.6; pz = W.z + dir[1] * 1.6;
  const e = unlockFoe(buildZoneEnemy(WORLD.scene, [], W.x + dir[0] * 8, W.z + dir[1] * 8, 'Cave Bear', null)); e.lair = 'test'; e.alert = true; e.spd = 2; e._chT = 0; e.atkCd = 0; ZONES.world.enemies.push(e);
  const log = { msgs: [], strikesInDaze: 0, strikesAfter: 0, dazeAt: null, moveInDaze: 0, sidestep: null, dazeLen: 0 };
  const _m = showMsg; showMsg = function (t) { if (/charges|dazed|bowls/.test(t)) log.msgs.push(t); return _m.apply(this, arguments); };
  const _x = executeStrike; executeStrike = function (who) { if (who === e) { if (e._stun > 0) log.strikesInDaze++; else if (log.dazeAt != null) log.strikesAfter++; } return _x.apply(this, arguments); };
  let n = 0, p0 = null, dazeEnd = null;
  const step = () => { n++; PHP = maxHP; dead = false; stamina = maxStamina;
    if (e._charge != null && !log.sidestep) { px += -dir[1] * 4; pz += dir[0] * 4; log.sidestep = n; }
    if (e._stun > 0) { if (log.dazeAt == null) { log.dazeAt = n; p0 = { x: e.x, z: e.z }; log.wallGap = +Math.hypot(e.x - W.x, e.z - W.z).toFixed(2); log.youFrom = +Math.hypot(e.x - px, e.z - pz).toFixed(2); } log.dazeLen++;
      log.moveInDaze = Math.max(log.moveInDaze, Math.hypot(e.x - p0.x, e.z - p0.z)); }
    else if (log.dazeAt != null && dazeEnd == null) dazeEnd = n;
    if (log.dazeAt != null && e._stun > 0) { const ux = e.x - px, uz = e.z - pz, d = Math.hypot(ux, uz) || 1; if (d > 1.2) { px = e.x - ux / d * 1.0; pz = e.z - uz / d * 1.0; } }
    return dazeEnd != null && n > dazeEnd + 150; };
  try { log.frames = _drive(step, 60 * 15); } finally { showMsg = _m; executeStrike = _x; }
  log.moveInDaze = +log.moveInDaze.toFixed(2); log.dazeS = +(log.dazeLen / 60).toFixed(2);
  e.dead = true; if (e.mesh) WORLD.scene.remove(e.mesh); const L = ZONES.world.enemies, i = L.indexOf(e); if (i >= 0) L.splice(i, 1);
  return log; });
console.log(JSON.stringify(r));
check('the bear charges, and sidestepped it slams into the wall: dazed — now!', !r.noWall && r.msgs.some(m => /charges!/.test(m)) && r.msgs.some(m => /slams into the ground, dazed/.test(m)) && r.sidestep != null, r);
check('the daze lasts its 2.4 s', r.dazeS > 2.3 && r.dazeS < 2.5, r.dazeS);
check('dazed, it stands: it strikes nothing with you beside it, and stays where it fell', r.strikesInDaze === 0 && r.moveInDaze < .05, r);
check('when the daze is over it fights again', r.strikesAfter >= 1, r);
// a bear dazed beside you, alert, its blow ready: 2.4 s of standing next to it
const near = await page.evaluate(() => { PHP = maxHP; dead = false; PPOST.stagUntil = 0;
  const e = unlockFoe(buildZoneEnemy(WORLD.scene, [], px, pz - 1, 'Cave Bear', null)); e.lair = 'test'; e.alert = true; e.atkCd = 0; e._chT = 99; e._stun = 2.4; ZONES.world.enemies.push(e);
  let strikes = 0, tells = 0; const _x = executeStrike, _t = sndTelegraph; executeStrike = function (who) { if (who === e && e._stun > 0) strikes++; return _x.apply(this, arguments); }; sndTelegraph = function () { if (e._stun > 0) tells++; return _t.apply(this, arguments); };
  const x0 = e.x, z0 = e.z; let n = 0;
  try { _drive(() => { PHP = maxHP; px = x0 + .3; pz = z0 + 1; return ++n > 140; }, 200); } finally { executeStrike = _x; sndTelegraph = _t; }
  const out = { strikes, tells, moved: +Math.hypot(e.x - x0, e.z - z0).toFixed(2), stunLeft: +e._stun.toFixed(2) };
  e.dead = true; if (e.mesh) WORLD.scene.remove(e.mesh); const L = ZONES.world.enemies, i = L.indexOf(e); if (i >= 0) L.splice(i, 1); return out; });
console.log('dazed beside you', JSON.stringify(near));
check('dazed with you beside it, it winds up nothing and strikes nothing', near.strikes === 0 && near.tells === 0 && near.moved < .05, near);
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
