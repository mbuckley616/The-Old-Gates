// The captain's guard (Session 130; owed to play in backlog G, *Saves first*: "the creatures in real play — the captain's
// guard"). A Bandit Captain (and every siege captain) holds the Shieldbearer's frontal guard: a hit from the front does 35%
// until a power attack breaks it; it staggers, the guard drops, and it comes back up when the stagger is over. A hit from
// the flank, while it is committed to a blow, goes round the shield. Played here in the running game (the loop's own tick at
// fixed 1/60, the draw held off, as `dazed` does): a Bandit Captain set down in Dunmore's street at noon, real swings.
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
  if (!EQ.weapon) EQ.weapon = { name: 'Steel Sword', slot: 'weapon', weaponShape: 'sword', weight: 3, atk: [8, 12] };
  // open street near the plaza: a spot with three clear units all round
  const t = WORLD.siteAnywhere('dunmore'); let S = null;
  const clear = (x, z) => !WORLD.solidAt(x, z) && WORLD.worldH(x, z) > 0;
  for (let rr = 4; rr < 60 && !S; rr += 1) for (let a = 0; a < 32 && !S; a++) { const x = t.x + Math.cos(a / 32 * Math.PI * 2) * rr, z = t.z + Math.sin(a / 32 * Math.PI * 2) * rr; let ok = true;
    for (let k = 0; k < 16 && ok; k++) for (const d of [1, 2, 3]) if (!clear(x + Math.cos(k / 16 * Math.PI * 2) * d, z + Math.sin(k / 16 * Math.PI * 2) * d)) { ok = false; break; } if (ok) S = { x, z }; }
  if (!S) return { noSpot: true };
  px = S.x; pz = S.z + 1.4;
  const e = unlockFoe(buildZoneEnemy(WORLD.scene, [], S.x, S.z, 'Bandit Captain', null)); e.alert = true; ZONES.world.enemies.push(e);
  const out = { name: e.name, weapon: EQ.weapon.name, built: { shieldUp: e.shieldUp, prop: !!(e.limbs && e.limbs.shieldProp), armX: e.limbs && e.limbs.shieldArm && +e.limbs.shieldArm.rotation.x.toFixed(2) } };
  const raws = { front: [], open: [], flank: [] }; let mode = 'front', lastRaw = null;
  const _a = applyMeleeDamage; applyMeleeDamage = function (who, raw) { if (who === e) { lastRaw = raw; raws[mode] && raws[mode].push(raw); } return _a.apply(this, arguments); };
  const msgs = []; const _m = showMsg; showMsg = function (tx) { if (/guard|Bash|staggered/.test(tx)) msgs.push(tx); return _m.apply(this, arguments); };
  const face = () => { yaw = Math.atan2(-(e.x - px), -(e.z - pz)); };
  const keep = () => { PHP = maxHP; dead = false; PPOST.stagUntil = 0; stamina = maxStamina; if (e.hp < e.maxHp * .5) e.hp = e.maxHp; };
  // one real swing: the attack on the click, resolved when the loop's swing crosses its impact point
  const swing = (pow) => { keep(); face(); atkCd = 0; lastRaw = null; attack(pow); let n = 0;
    _drive(() => { keep(); face(); return ++n > 3 && (!_pendingStrike || _pendingStrike.fired); }, 120); return lastRaw; };
  const wait = (f) => { let n = 0; _drive(() => { keep(); face(); return ++n >= f; }, f + 1); };
  try {
    // 1. from the front, guard up: ten swings
    for (let k = 0; k < 10; k++) { if (!e.shieldUp) break; swing(false); wait(20); }
    out.frontUp = e.shieldUp;
    // 2. a bash from the front glances off
    keep(); face(); atkCd = 0; const bashMsgs = msgs.length; doBash(); out.bash = msgs.slice(bashMsgs); out.bashUp = e.shieldUp; wait(40);
    // 3. a power attack from the front: the guard breaks, it staggers, and the blow does no damage
    out.cycles = [];
    for (let c = 0; c < 4; c++) {
      wait(30); const hp0 = e.hp, m0 = msgs.length; mode = 'none'; swing(true); const tb = playClockS;
      const cy = { broke: !e.shieldUp, staggered: staggered.some(s => s.e === e), hpLost: hp0 - e.hp, msg: msgs.slice(m0), armX: +e.limbs.shieldArm.rotation.x.toFixed(2) };
      // follow-ups while it reels
      mode = 'open'; let f = 0; while (!e.shieldUp && f < 3) { swing(false); f++; } cy.followUps = f;
      // and the guard back up when the stagger is over
      mode = 'none'; let n = 0; _drive(() => { keep(); face(); return ++n > 3 && e.shieldUp; }, 200);
      cy.downFor = +(playClockS - tb).toFixed(2); cy.backUp = e.shieldUp; cy.armXBack = +e.limbs.shieldArm.rotation.x.toFixed(2); cy.reraiseMsg = msgs.some(x => /raises its guard again/.test(x));
      out.cycles.push(cy); }
    // 4. the flank: wait for it to commit to a blow, step round behind it, and swing
    out.flanks = [];
    for (let k = 0; k < 6; k++) { let n = 0; _drive(() => { keep(); if (e.telegraphT > 0 && e.shieldUp) return true; face(); return ++n > 600; }, 601);
      if (!(e.telegraphT > 0)) { out.flanks.push({ noTell: true }); continue; }
      const bx = -Math.sin(e.combatYaw), bz = -Math.cos(e.combatYaw); px = e.x + bx * 1.3; pz = e.z + bz * 1.3;
      mode = 'flank'; const behind = isPlayerBehind(e); const raw = swing(false); mode = 'none';
      out.flanks.push({ behind, raw, upAtHit: e.shieldUp }); wait(90); px = e.x; pz = e.z + 1.4; }
  } finally { applyMeleeDamage = _a; showMsg = _m; }
  const mean = a => a.length ? a.reduce((s, x) => s + x, 0) / a.length : 0;
  out.raws = raws; out.means = { front: +mean(raws.front).toFixed(2), open: +mean(raws.open).toFixed(2), flank: +mean(raws.flank).toFixed(2) };
  out.msgs = msgs.slice(0, 12);
  e.dead = true; if (e.mesh) WORLD.scene.remove(e.mesh); const L = ZONES.world.enemies, i = L.indexOf(e); if (i >= 0) L.splice(i, 1);
  return out; });
console.log(JSON.stringify(r));
const ratio = r.means && r.means.open ? r.means.front / r.means.open : 0, flankRatio = r.means && r.means.open ? r.means.flank / r.means.open : 0;
console.log(JSON.stringify({ frontOverOpen: +ratio.toFixed(2), flankOverOpen: +flankRatio.toFixed(2) }));
check('a Bandit Captain stands with the guard up: the shield on its arm, raised across the body', !r.noSpot && r.built.shieldUp && r.built.prop && r.built.armX === -1.15, r.built);
check('from the front the guard holds: ten swings land at about a third of an open blow (35%, floored to whole points), and it stays up', r.frontUp && r.raws.front.length >= 8 && ratio > .2 && ratio < .45, { n: r.raws.front.length, ratio });
check('a bash from the front glances off the raised shield', r.bash.some(m => /glances off/.test(m)) && r.bashUp, r.bash);
check('a power attack breaks the guard every time: it staggers, the shield arm drops, and that blow does no damage', r.cycles.length === 4 && r.cycles.every(c => c.broke && c.staggered && c.hpLost === 0 && c.msg.some(m => /guard breaks/.test(m)) && c.armX !== -1.15), r.cycles);
check('while it reels, follow-up swings land in full', r.raws.open.length >= 4 && r.cycles.every(c => c.followUps >= 1), r.raws.open);
check('the guard comes back up when the stagger is over (1.5 s), the arm raised again, with its message', r.cycles.every(c => c.backUp && c.armXBack === -1.15 && c.reraiseMsg && c.downFor > 1.3 && c.downFor < 1.8), r.cycles.map(c => c.downFor));
const fl = r.flanks.filter(f => !f.noTell);
check('stepping round a captain committed to its blow, a swing from behind goes round the shield in full', fl.length >= 4 && fl.every(f => f.behind && f.upAtHit) && flankRatio > .8, { fl, flankRatio });
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
