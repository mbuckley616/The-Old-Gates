// The duel on the yard at Caer Slige, played through (backlog G, *Saves first*: "the faction lines in real play — … the
// duel on the yard"). Session 373 built it and `duel` checks its endings by calling the topics and setting Rowe's health;
// `duelrhythm` measures the yield with Rowe held still. Here it is taken as a player takes it: the ninth service asked
// through Reeve Wulfstan's own dialogue, the ring walked to, the yard-sergeant spoken to with E and *Call it.* clicked, and
// the fight fought by the game's own loop at fixed 1/60 ticks (the draw held off, as `duelrhythm` does) with Rowe striking
// back by her own tick. The player's bot stands its ground at arm's length (stepping in when she is out of reach),
// power-attacks a raised guard with three-quarters of its stamina in hand and swings at an open one with a fifth (an
// exhausted swing lands at 45%),
// says *Not yet.* when she offers the yield, and stops when she kneels. Whichever ending the first fight gives, both are
// walked: a new character's fight on its own stamina, then, a week on, the rematch at level 8 with an iron sword and its
// stamina kept full (a stand-in for the blocks and rolls a bot does not make).
import { boot, check } from './lib/game.mjs';
const g = await boot(); const { page } = g;
await g.intoWorld();
await page.evaluate(() => WORLD.devUnlockAll());

await page.evaluate(() => { window._drive = (step, max) => {
  const raf = window.requestAnimationFrame, rr = REN.render; window.requestAnimationFrame = () => 0; REN.render = () => {};
  let t = performance.now(), n = 0;
  try { for (; n < max; n++) { if (step()) break; t += 1000 / 60; loop(t); } }
  finally { window.requestAnimationFrame = raf; REN.render = rr; prevT = 0; }
  return n; }; });

const at = async (x, z) => { await page.evaluate(([x, z]) => { const x0 = px, z0 = pz, L = Math.hypot(x - x0, z - z0), n = Math.max(1, Math.ceil(L / 20));
  for (let k = 1; k <= n; k++) { px = x0 + (x - x0) * k / n; pz = z0 + (z - z0) * k / n; jumpY = 0; for (let i = 0; i < 3; i++) WORLD.tick(1 / 60, performance.now()); } }, [x, z]); };
const tick = (n) => page.evaluate((n) => { for (let i = 0; i < n; i++) WORLD.tick(1 / 60, performance.now()); }, n);
const labelsNow = () => page.evaluate(() => [...document.querySelectorAll('#dlg-choices > *')].map(x => x.textContent.trim().replace(/^\d+\.\s*/, '')));
const click = (re) => page.evaluate((src) => { const b = [...document.querySelectorAll('#dlg-choices > *')].find(x => new RegExp(src).test(x.textContent.trim().replace(/^\d+\.\s*/, ''))); if (b) b.click(); return !!b; }, re.source);
const text = () => page.evaluate(() => (document.getElementById('dlg-text') || {}).textContent || '');
const close = () => page.evaluate(() => { try { if (dlgOpen) closeDialog(); } catch (e) {} });
const say = async (re) => { await close(); await page.evaluate(() => openDialog(window._lord)); await g.frames(2);
  const labels = await labelsNow(); const clicked = await click(re); await g.frames(2); const said = await text(); await close(); return { labels, clicked, said }; };
// stand in front of a person, face them, press E: the dialogue the player would get
const meet = async (getter) => { const ok = await page.evaluate((src) => { const n = (new Function('return ' + src))(); if (!n) return false; window._n = n; n._scared = performance.now() + 1;
    const dx = Math.sin(n.g.rotation.y), dz = Math.cos(n.g.rotation.y); px = n.g.position.x + dx * 1.3; pz = n.g.position.z + dz * 1.3; jumpY = n.g.position.y; yaw = Math.atan2(dx, dz); pitch = 0;
    try { if (dlgOpen) closeDialog(); } catch (e) {} return true; }, getter);
  if (!ok) return null; await g.frames(2);
  // the stand is taken again as the key goes down (a capture listener runs before the game's own), and any townsperson within 3 units
  // of it is set 6 units off: on a slow runner a frame passes between an evaluate and the key, and a passer-by (Osric) took the E (S647, as S483/S501)
  await page.evaluate(() => { const pin = () => { const n = window._n; const dx = Math.sin(n.g.rotation.y), dz = Math.cos(n.g.rotation.y); px = n.g.position.x + dx * 1.3; pz = n.g.position.z + dz * 1.3; yaw = Math.atan2(dx, dz);
      for (const S of WORLD.settle.values()) for (const m of (S.npcs || [])) { if (m === n || !m.g) continue; const ex = m.g.position.x - px, ez = m.g.position.z - pz, d = Math.hypot(ex, ez); if (d < 3) { const k = 6 / Math.max(d, .01); m.g.position.x = px + (d > .01 ? ex : 1) * k; m.g.position.z = pz + (d > .01 ? ez : 0) * k; } } };
    pin(); window.addEventListener('keydown', pin, { capture: true, once: true }); });
  await page.keyboard.press('e'); await g.frames(2);
  return page.evaluate(() => ({ open: !!dlgOpen, name: (document.getElementById('dlg-name') || {}).textContent, role: (document.getElementById('dlg-role') || {}).textContent, greet: (document.getElementById('dlg-text') || {}).textContent, labels: [...document.querySelectorAll('#dlg-choices > *')].map(x => x.textContent.trim().replace(/^\d+\.\s*/, '')) })); };

const seat = await page.evaluate(() => { WORLD.anchoredPlaces(); const s = WORLD.siteAnywhere(WORLD.FACTIONS.league.seat); return { id: s.id, name: s.name, x: s.x, z: s.z }; });
const home = async () => { await page.evaluate(([x, z]) => { px = x; pz = z; }, [seat.x, seat.z]); await g.settle(seat.id);
  return page.evaluate((id) => { const S = WORLD.settle.get(id); const d = S.lordNpc ? S.lordNpc.def : (S.houses.find(h => h.type === 'castle') || {}).dlg; window._lord = d; return d ? d.name : null; }, seat.id); };

// the League at eight services, Reeve, first light
await page.evaluate(() => { const F = WORLD.fstate(); for (const k in F) { if (F[k].active) { F[k].active.done = true; F[k].active.turnedIn = true; } Object.assign(F[k], { done: 0, rank: 0, active: null, closed: false }); delete F[k].rowe; }
  Object.assign(F.league, { done: 8, rank: 2 }); forceTime(7.5); });
const lord = await home();
const t1 = await say(/^Serve the Captains' League\.$/);
const q1 = await page.evaluate(() => { const q = WORLD.fstate().league.active; return q && { kind: q.kind, title: q.title, objective: q.objective, x: q.data.x, z: q.data.z, state: q.data.state }; });
console.log('lord', lord, JSON.stringify(t1.said), JSON.stringify(q1));
check(`at ${seat.name}, ${lord} gives the ninth service through his own dialogue: *The Duel at Caer Slige*, the ring east of the walls from first light`, t1.clicked && q1 && q1.kind === 'duel' && /The Duel at Caer Slige/.test(q1.title) && /ring's laid east of the walls from first light/.test(t1.said), { t1, q1 });

// walk out to the ring at eight: the rope, the sergeant, the watchers and Rowe
await page.evaluate(() => forceTime(8));
await at(q1.x - 9, q1.z); await tick(30);
const yard = await page.evaluate(() => { const D = WORLD.duel; return { parts: D.parts.length, watchers: D.watchers.length, sgt: D.sgt && D.sgt.def.name, rowe: !!D.npc, open: D.open }; });
console.log('yard', JSON.stringify(yard));
check('walked out at eight, the ring is up: 24 stakes and rope lengths, a yard-sergeant, the watchers and Rowe', yard.parts === 24 && yard.watchers >= 6 && yard.sgt && yard.rowe && yard.open, yard);
const r0 = await meet('WORLD.duel.npc'); await close();
console.log('rowe', JSON.stringify(r0));
check('E in front of Rowe: her greeting by your people, and *Why do you want it?*', r0 && r0.open && r0.name === 'Hesket Rowe' && r0.labels.includes('Why do you want it?'), r0);
const s0 = await meet('WORLD.duel.sgt');
console.log('sergeant', JSON.stringify(s0));
check('E in front of the yard-sergeant: *Rowe\'s been in there since first light*, the rules, and *Call it.*', s0 && s0.open && s0.role === 'Yard-sergeant' && /since first light/.test(s0.greet) && s0.labels.includes('The rules?') && s0.labels.includes('Call it.'), s0);
await click(/^Call it\.$/); await g.frames(2); const called = await text(); await close();
const st0 = await page.evaluate(() => { const D = WORLD.duel, e = D.rowe; return { state: D.q.data.state, rowe: e && e.name, hp: e && e.hp, max: e && e.maxHp, guard: e && !!e.shieldUp, def: e && e.def, dmg: e && e.dmg }; });
console.log('called', JSON.stringify(called), JSON.stringify(st0));
check('*Call it.*: *Rope\'s up.* and the fight is on, Rowe a Bandit Captain under her own name with her guard up', /^Rope's up\./.test(called) && st0.state === 'fight' && st0.rowe === 'Hesket Rowe' && st0.guard, st0);

// the fight, fought by the loop
const fight = (full) => page.evaluate((full) => {
  const D = WORLD.duel, e = D.rowe, q = D.q, cx = q.data.x, cz = q.data.z;
  const log = { swings: 0, power: 0, hitsOnHer: 0, hitsOnYou: 0, offered: 0, said: [], yieldAt: null, end: null, hp0: PHP, max: maxHP, level, weapon: EQ.weapon ? EQ.weapon.name : 'fists', minHP: PHP };
  const _m = showMsg; showMsg = function (t) { if (/yield|Rowe|acclaim|rope|check/i.test(t)) log.said.push(t); return _m.apply(this, arguments); };
  let lastHer = e.hp, lastYou = PHP; const t0 = playClockS;
  const step = () => {
    const s = q.data.state; if (s === 'yielded' && log.yieldAt == null) log.yieldAt = +(playClockS - t0).toFixed(2);
    if (e.hp < lastHer) log.hitsOnHer++; lastHer = e.hp; if (PHP < lastYou) log.hitsOnYou++; lastYou = PHP; log.minHP = Math.min(log.minHP, PHP);
    if (s === 'won' || s === 'murder' || s === 'lost') { log.end = s; return true; }
    if (dlgOpen) { const b = [...document.querySelectorAll('#dlg-choices > *')].find(x => /Not yet/.test(x.textContent)); if (b) { log.offered++; b.click(); } try { closeDialog(); } catch (err) {} return false; }
    if (s === 'yielded') return false;
    // stand your ground facing her; step in to arm's length only when she is out of reach, on the ring's side of her
    // (the camera looks along -sin yaw, -cos yaw)
    if (Math.hypot(px - e.x, pz - e.z) > 1.6 || Math.hypot(px - cx, pz - cz) > 4.2) { let dx = cx - e.x, dz = cz - e.z, L = Math.hypot(dx, dz); if (L < .1) { dx = 0; dz = 1; L = 1; } px = e.x + dx / L * 1.2; pz = e.z + dz / L * 1.2; }
    yaw = Math.atan2(-(e.x - px), -(e.z - pz)); pitch = 0;
    const open = !e.shieldUp || (typeof isStaggered === 'function' && isStaggered(e));
    if (full) stamina = maxStamina;
    if (atkCd <= 0 && !_pendingStrike && stamina >= maxStamina * (open ? .2 : .75)) { attack(!open); if (atkCd > 0 || _pendingStrike) { log.swings++; if (!open) log.power++; } }
  };
  let frames; try { frames = _drive(step, 60 * 240); } finally { showMsg = _m; }
  return { ...log, full, frames, secs: +(playClockS - t0).toFixed(1), herHp: e.hp, herMax: e.maxHp, youHp: PHP }; }, full);
const f1 = await fight(false);
console.log('fight 1', JSON.stringify(f1));
check('the first fight ends by the yard\'s own rules (acclaimed after the yield, or down and Rowe acclaimed), never a death or a murder', f1.end === 'won' || f1.end === 'lost', f1);

const won = async () => {
  const after = await page.evaluate(() => { const D = WORLD.duel; return { state: D.q.data.state, rowe: WORLD.fstate().league.rowe, npc: !!D.npc }; });
  const r = await meet('WORLD.duel.npc'); await close();
  console.log('after the yield', JSON.stringify(after), JSON.stringify(r));
  check('spared, she stands: *Good fight. I was a step slow on the left…*, and the League marks her alive', after.state === 'won' && after.rowe === 'alive' && r && /^Good fight\./.test(r.greet), { after, r });
  await home(); const g0 = await page.evaluate(() => gold);
  const t = await say(/^Serve the Captains' League\.$/);
  const s = await page.evaluate((g0) => { const L = WORLD.fstate().league; return { done: L.done, rank: L.rank, closed: L.closed, paid: gold - g0 }; }, g0);
  console.log('captain', JSON.stringify(t.said), JSON.stringify(s));
  check('turned in through the lord: *names you Captain*, the after-line (*Acclaimed. Rowe says you fought well…*), nine services, rank 3, paid', /names you Captain\./.test(t.said) && /Acclaimed\. Rowe says you fought well/.test(t.said) && s.done === 9 && s.rank === 3 && !s.closed && s.paid > 0, { t, s });
  await tick(120); const r2 = await meet('WORLD.rival.npc'); await close();
  console.log('rowe at the seat', JSON.stringify(r2));
  check('Rowe is at the seat with the Captain\'s line and *What now, Rowe?*', r2 && r2.open && /^Captain\. Took me a week to stop favouring the left\./.test(r2.greet) && r2.labels.includes('What now, Rowe?'), r2);
};

let ended = f1.end;
if (ended === 'lost') {
  const lost = await page.evaluate(() => ({ state: WORLD.duel.q.data.state, rowe: WORLD.fstate().league.rowe, hp: PHP, dead: !!dead }));
  check('down in the ring is not death: you stand at 1 health or more, and Rowe is Captain', !lost.dead && lost.hp >= 1 && lost.rowe === 'captain', lost);
  await home();
  const t = await say(/^Serve the Captains' League\.$/), t2 = await say(/^Serve the Captains' League\.$/);
  console.log('lost', JSON.stringify(t.said), JSON.stringify(t2.said));
  check('at the seat: *Rowe\'s Captain. … The ring goes up again in seven days.*, then *Not yet. A week, I said.*', /^Rowe's Captain\./.test(t.said) && /seven days/.test(t.said) && /^Not yet\. A week/.test(t2.said), { t, t2 });
  await tick(120); const r3 = await meet('WORLD.rival.npc'); await close();
  check('Rowe holds the chair at the seat for the week: *Captain Rowe, for a week at least.*', r3 && /^Captain Rowe, for a week at least\./.test(r3.greet), r3);
  // a week on, stronger: the rematch
  await page.evaluate(() => { worldState.gameTimeAbsMinutes = (worldState.gameTimeAbsMinutes || 0) + 7 * 1440; forceTime(8); level = Math.max(level, 8); maxHP = Math.max(maxHP, 260); PHP = maxHP; dead = false;
    const wt = WEAPON_TYPES.find(w => /sword/i.test(w.name || w.type || '')) || WEAPON_TYPES[0]; EQ.weapon = makeItem(3, wt, null, false); });
  await at(q1.x - 9, q1.z); await tick(30);
  const s1 = await meet('WORLD.duel.sgt');
  check('a week on, the ring is laid again and the sergeant will call it', s1 && s1.labels.includes('Call it.'), s1);
  await click(/^Call it\.$/); await g.frames(2); await close();
  const f2 = await fight(true);
  console.log('fight 2', JSON.stringify(f2));
  check('the rematch is fought to the yield and the yard acclaims you', f2.end === 'won' && f2.yieldAt != null, f2);
  ended = f2.end;
}
if (ended === 'won') await won();
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
