// A spent power attack does not break a guard (Session 485, Michael's A on DECISION #131). Since v80 S9 a swing on too
// little stamina goes anyway but weakly (45%, a longer cooldown); the captain's guard (Session 130) broke for it as for a
// fresh one, so mashing the power attack on an empty bar beat Rowe and the careful player lost. Now a spent power attack
// from the front lands as a guarded hit (35% of the 45%) and says *Too spent to break the guard.*; a fresh one still breaks
// it. Played in the running game (the loop's own tick at fixed 1/60, the draw held off, as `captainguard` does): a Bandit
// Captain in Dunmore's street, then a guarded foe in a dungeon (the other strike path).
import { boot, check } from './lib/game.mjs';
import { enterDungeon } from './lib/dungeonshot.mjs';
const g = await boot(); const { page } = g;
await g.intoWorld();
await g.settle('dunmore');
await page.evaluate(() => { window._drive = (step, max) => {
  const raf = window.requestAnimationFrame, rr = REN.render; window.requestAnimationFrame = () => 0; REN.render = () => {};
  let t = performance.now(), n = 0;
  try { for (; n < max; n++) { if (step()) break; t += 1000 / 60; loop(t); } }
  finally { window.requestAnimationFrame = raf; REN.render = rr; prevT = 0; }
  return n; };
  // one guarded foe, one swing at a time: `spent` empties the bar first. Returns what the swing did.
  window._spentRig = (e) => {
    const msgs = []; let lastMult = null, lastRaw = null;
    const _m = showMsg; showMsg = function (tx) { msgs.push(tx); return _m.apply(this, arguments); };
    const _s = shieldFrontMult; shieldFrontMult = function (who) { const v = _s.apply(this, arguments); if (who === e) lastMult = v; return v; };
    const _a = applyMeleeDamage; applyMeleeDamage = function (who, raw) { const r = _a.apply(this, arguments); if (who === e) lastRaw = { raw, dmg: r.dmg }; return r; };
    const face = () => { yaw = Math.atan2(-(e.x - px), -(e.z - pz)); };
    const keep = () => { PHP = maxHP; dead = false; PPOST.stagUntil = 0; if (e.hp < e.maxHp * .5) e.hp = e.maxHp; };
    const swing = (pow, spent) => { keep(); face(); stamina = spent ? 0 : maxStamina; atkCd = 0; lastMult = null; lastRaw = null; const hp0 = e.hp, m0 = msgs.length;
      attack(pow); const exh = _exhaustedStrike; let n = 0;
      _drive(() => { keep(); face(); return ++n > 3 && (!_pendingStrike || _pendingStrike.fired); }, 120);
      return { exh, up: e.shieldUp, stag: staggered.some(s => s.e === e), mult: lastMult, hit: lastRaw, msg: msgs.slice(m0).filter(x => /guard|Hit|staggered/.test(x)) , hpLost2: hp0 - e.hp }; };
    const wait = (f) => { let n = 0; _drive(() => { keep(); face(); return ++n >= f; }, f + 1); };
    const reraise = () => { let n = 0; _drive(() => { keep(); face(); return ++n > 3 && e.shieldUp && !staggered.some(s => s.e === e); }, 400); };
    const done = () => { showMsg = _m; shieldFrontMult = _s; applyMeleeDamage = _a; };
    return { swing, wait, reraise, done, face };
  }; });

// 1. the open world: a Bandit Captain (Rowe fights as one)
const w = await page.evaluate(() => {
  forceTime(12); PHP = maxHP; dead = false; PPOST.stagUntil = 0;
  EQ.weapon = { name: 'Steel Sword', slot: 'weapon', weaponShape: 'sword', weight: 3, atk: [8, 12] };
  const t = WORLD.siteAnywhere('dunmore'); let S = null;
  const clear = (x, z) => !WORLD.solidAt(x, z) && WORLD.worldH(x, z) > 0;
  for (let rr = 4; rr < 60 && !S; rr += 1) for (let a = 0; a < 32 && !S; a++) { const x = t.x + Math.cos(a / 32 * Math.PI * 2) * rr, z = t.z + Math.sin(a / 32 * Math.PI * 2) * rr; let ok = true;
    for (let k = 0; k < 16 && ok; k++) for (const d of [1, 2, 3]) if (!clear(x + Math.cos(k / 16 * Math.PI * 2) * d, z + Math.sin(k / 16 * Math.PI * 2) * d)) { ok = false; break; } if (ok) S = { x, z }; }
  if (!S) return { noSpot: true };
  px = S.x; pz = S.z + 1.4;
  const e = unlockFoe(buildZoneEnemy(WORLD.scene, [], S.x, S.z, 'Bandit Captain', null)); e.alert = true; ZONES.world.enemies.push(e);
  const R = _spentRig(e), out = { built: e.shieldUp, spent: [], fresh: [] };
  try {
    for (let k = 0; k < 6; k++) { R.wait(100); out.spent.push(R.swing(true, true)); }
    R.wait(100); out.fresh.push(R.swing(true, false)); R.reraise();
    out.spent.push(R.swing(true, true));
  } finally { R.done(); }
  e.dead = true; if (e.mesh) WORLD.scene.remove(e.mesh); const L = ZONES.world.enemies, i = L.indexOf(e); if (i >= 0) L.splice(i, 1);
  return out; });
console.log(JSON.stringify(w));
const sp = w.spent || [];
check('a Bandit Captain stands with the guard up', !w.noSpot && w.built, w);
check('a power attack on an empty bar is a spent swing, and the guard holds through all seven', sp.length === 7 && sp.every(s => s.exh && s.up), sp.map(s => [s.exh, s.up]));
check('each spent power attack lands as a guarded hit: the front block (.35) and the spent 45%, at least a point', sp.every(s => s.mult === .35 && s.hit && s.hit.dmg >= 1 && s.hit.dmg <= Math.ceil(s.hit.raw * .45) + 1 && s.hpLost2 >= 1), sp.map(s => [s.mult, s.hit, s.hpLost2]));
check('it says so: *Too spent to break the guard.*, and never *guard breaks*', sp.every(s => s.msg.some(m => /Too spent to break the guard\./.test(m) && /GUARDED/.test(m)) && !s.msg.some(m => /guard breaks/.test(m))), sp.map(s => s.msg));
const fr = (w.fresh || [])[0];
check('a power attack with the stamina for it still breaks the guard: it staggers and that blow does no damage', fr && !fr.exh && !fr.up && fr.stag && fr.hpLost2 === 0 && fr.msg.some(m => /guard breaks/.test(m)), fr);

// 3. the masher's fight, as DECISION #131 measured it: a Bandit Captain that fights back, and you stand and mash the power
// attack whatever the bar says, until one of you is down or two minutes pass. Reported; checked only that no spent swing broke the guard.
const m = await page.evaluate(() => {
  forceTime(12); PHP = maxHP; dead = false; PPOST.stagUntil = 0; level = 1;
  EQ.weapon = { name: 'Club', slot: 'weapon', weaponShape: 'club', weight: 3, atk: [3, 7] };
  const t = WORLD.siteAnywhere('dunmore'); let S = null;
  const clear = (x, z) => !WORLD.solidAt(x, z) && WORLD.worldH(x, z) > 0;
  for (let rr = 4; rr < 60 && !S; rr += 1) for (let a = 0; a < 32 && !S; a++) { const x = t.x + Math.cos(a / 32 * Math.PI * 2) * rr, z = t.z + Math.sin(a / 32 * Math.PI * 2) * rr; let ok = true;
    for (let k = 0; k < 16 && ok; k++) for (const d of [1, 2, 3]) if (!clear(x + Math.cos(k / 16 * Math.PI * 2) * d, z + Math.sin(k / 16 * Math.PI * 2) * d)) { ok = false; break; } if (ok) S = { x, z }; }
  px = S.x; pz = S.z + 1.4; stamina = maxStamina;
  const e = unlockFoe(buildZoneEnemy(WORLD.scene, [], S.x, S.z, 'Bandit Captain', null)); e.alert = true; ZONES.world.enemies.push(e);
  const out = { foeHp: e.maxHp, youHp: maxHP, swings: 0, spent: 0, brokeSpent: 0, brokeFresh: 0 };
  const _m = showMsg; let cur = null; showMsg = function (tx) { if (/guard breaks/.test(tx)) { if (cur) out.brokeSpent++; else out.brokeFresh++; } return _m.apply(this, arguments); };
  const t0 = playClockS;
  try { _drive(() => { if (e.hp <= 0 || e.dead || PHP <= 0) return true; yaw = Math.atan2(-(e.x - px), -(e.z - pz));
      if (atkCd <= 0 && !_pendingStrike && swingT <= 0) { attack(true); out.swings++; if (_exhaustedStrike) out.spent++; cur = _exhaustedStrike; }
      return false; }, 60 * 120); }
  finally { showMsg = _m; }
  out.secs = +(playClockS - t0).toFixed(1); out.won = e.hp <= 0 || !!e.dead; out.youLost = Math.round(maxHP - Math.max(0, PHP)); out.foeLeft = Math.max(0, Math.round(e.hp));
  PHP = maxHP; dead = false; e.dead = true; if (e.mesh) WORLD.scene.remove(e.mesh); const L = ZONES.world.enemies, i = L.indexOf(e); if (i >= 0) L.splice(i, 1);
  return out; });
console.log('masher', JSON.stringify(m));
check('mashing the power attack on an empty bar no longer breaks the guard (a fresh one still may)', m.swings > 5 && m.spent > 0 && m.brokeSpent === 0, m);

// 2. the dungeon's strike path: a foe there with its guard raised
await enterDungeon(page, { theme: 'ruins', seed: 11 });
const d = await page.evaluate(() => {
  const e = ENEMIES.find(x => !x.dead && x.floor === currentFloor && typeof x.posture === 'number' && (x.baseType || x.name) === 'Shieldbearer')
    || ENEMIES.find(x => !x.dead && x.floor === currentFloor && typeof x.posture === 'number');
  if (!e) return { none: true };
  if (!e.shieldUp) { e.shieldUp = true; e._testRaised = true; }
  e.maxHp = e.hp = 400; // a long fight: no swing of the test may kill it
  ENEMIES.forEach(x => { if (x !== e) x.floor = -99; });
  PHP = maxHP; dead = false; px = e.x; pz = e.z + 1.4; e.alert = true;
  // stand it still, facing you, so every swing is from the front
  const R = _spentRig(e), out = { name: e.baseType || e.name, raised: !!e._testRaised, spent: [], fresh: [] };
  const hold = () => { e.x = px; e.z = pz - 1.4; e.combatYaw = 0; e.telegraphT = 0; };
  try {
    for (let k = 0; k < 3; k++) { hold(); R.wait(60); hold(); out.spent.push(R.swing(true, true)); }
    hold(); R.wait(60); hold(); out.fresh.push(R.swing(true, false));
  } finally { R.done(); }
  return out; });
console.log(JSON.stringify(d));
const ds = d.spent || [], df = (d.fresh || [])[0];
check('in a dungeon a spent power attack leaves the guard up and lands guarded, saying so', !d.none && ds.length === 3 && ds.every(s => s.exh && s.up && s.hit && s.hit.dmg >= 1 && s.msg.some(m => /Too spent to break the guard\./.test(m))), ds);
check('in a dungeon a fresh power attack still breaks it, for no damage', df && !df.up && df.hpLost2 === 0 && df.msg.some(m => /guard breaks/.test(m)), df);
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
