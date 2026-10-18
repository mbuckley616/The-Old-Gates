// The foes' heavy blow (Session 1136; combat.md's move sets, Michael's A on DECISION #430), humanoids and wolves first; every other
// family but the shark since Session 1137 (a boss keeps its phases, the cavern master its slam).
// One wind-up in four is heavy, a seeded roll on the foe's id and its blow's count, never twice running. Its tell is 1.0 s or the
// kind's + 0.35, the same pose held longer, its last 0.15 s glowing red where a light blow's glows gold. It lands for twice the damage
// and twice the posture; a held block breaks (Guard's Iron wall, 75, holds it); a perfect parry is as good as ever. Hold the line
// (Armour 75) is for a light hit only.
import { boot, check } from './lib/game.mjs';
const g = await boot(); const { page } = g;
await g.intoWorld();
const r = await page.evaluate(() => {
  const out = {};
  // the roll: 4,000 wind-ups of one keyed Bandit, again from the start, a wolf's, and the families without a heavy row
  const rolls = (e, n) => { e._blowN = 0; e._heavyLast = false; let s = ''; for (let i = 0; i < n; i++) s += foeHeavyRoll(e) ? 'H' : 'l'; return s; };
  const B = { id: 'heavytest:bandit:0', baseType: 'Bandit', baseName: 'Bandit', shape: 'humanoid' };
  const a = rolls(B, 4000), b = rolls(B, 4000);
  out.share = (a.match(/H/g) || []).length / 4000; out.twice = a.includes('HH'); out.same = a === b;
  out.other = rolls({ id: 'heavytest:bandit:1', baseType: 'Bandit', baseName: 'Bandit' }, 4000) !== a;
  const W = { id: 'heavytest:wolf:0', shape: 'wolf', name: 'Wolf' }; const w = rolls(W, 4000); out.wolf = (w.match(/H/g) || []).length / 4000;
  // S1137: every other family has the row now (the shark aside); a boss keeps its phases, the master its slam
  const fam = { golem: { id: 'g', baseType: 'Golem', baseName: 'Golem' }, spider: { id: 's', baseType: 'Spider', baseName: 'Spider' }, troll: { id: 't', baseType: 'Cave Troll', name: 'Cave Troll' },
    slime: { id: 'sl', baseType: 'Slime', baseName: 'Slime' }, elemental: { id: 'el', baseType: 'Fire Elemental', baseName: 'Fire Elemental' }, wraith: { id: 'ph', isWraith: true, baseType: 'Phantom', baseName: 'Phantom' }, mimic: { id: 'mi', baseType: 'Mimic', baseName: 'Mimic' } };
  out.fams = Object.fromEntries(Object.entries(fam).map(([k, e]) => { const s = rolls(e, 4000); return [k, { share: +((s.match(/H/g) || []).length / 4000).toFixed(3), twice: s.includes('HH') }]; }));
  out.none = [{ id: 'f', isBoss: true, shape: 'wolf' }, { id: 'sh', baseType: 'Shark', baseName: 'Shark' }].map(e => rolls(e, 400).includes('H'));
  // the tells: light as built, heavy 1.0 (every humanoid's and the wolf's tell + 0.35 is under it)
  const tell = (e, heavy) => { e._heavyLast = false; const u = Math.random; const t = (() => { for (let i = 0; i < 400; i++) { const v = foeWindUp(e); if (e._heavy === heavy && !e._feint) return v; } return -1; })(); return +t.toFixed(3); };
  out.tellsBig = { golem: [tell(fam.golem, false), tell(fam.golem, true)], troll: [tell(fam.troll, false), tell(fam.troll, true)], slime: [tell(fam.slime, false), tell(fam.slime, true)] };
  out.tells = { bandit: [tell(B, false), tell(B, true)], wolf: [tell(W, false), tell(W, true)], kobold: [tell({ id: 'k', baseType: 'Kobold Thief', baseName: 'Kobold Thief' }, false), tell({ id: 'k', baseType: 'Kobold Thief', baseName: 'Kobold Thief' }, true)] };
  // a real Bandit in front of you: the glow, the blow's size and what it does to you
  const sk0 = JSON.parse(JSON.stringify(SKILLS)), eq0 = { ...EQ };
  const set = (id, lv) => { SKILLS[id] = { lv, p: 0 }; };
  const mk = () => { const e = keyFoe(buildZoneEnemy(WORLD.scene, [], px + fwdX, pz + fwdZ, 'Bandit', null), 'heavytest:live:0'); if (!e.mesh.parent) WORLD.scene.add(e.mesh);
    e.alert = true; e.spd = 0; if (typeof e.posture !== 'number') initPosture(e); return e; };
  const drop = e => { WORLD.scene.remove(e.mesh); staggered = staggered.filter(s => s.e !== e); };
  const reset = () => { PHP = maxHP; PPOST.maxPosture = playerMaxPosture(); PPOST.posture = PPOST.maxPosture; PPOST.stagUntil = 0; PPOST.broke = false; ROLL = null; stamina = 100; staminaCD = 0; ACTIVE_BUFFS.length = 0; _lastParryG = -1e9; };
  const e0 = mk(); e0.telegraphMax = 1;
  e0._heavy = true; telegraphPulse(e0, 1); const em = enemyBodyMesh(e0).material.emissive; out.glowH = [em.r, em.g].map(v => +v.toFixed(2));
  e0._heavy = false; telegraphPulse(e0, 1); out.glowL = [em.r, em.g].map(v => +v.toFixed(2)); telegraphPulse(e0, .5); out.glowEarly = +em.r.toFixed(2); telegraphReset(e0);
  e0.rng = () => .5; e0._heavy = false; out.blowL = foeBlow(e0); e0._heavy = true; out.blowH = foeBlow(e0); e0._heavy = false; drop(e0);
  for (const k of Object.keys(EQ)) EQ[k] = null;
  // ago: the block raised that long before the blow (null: no block); a 10-point blow
  const take = (heavy, ago, raw = 10) => { reset(); const e = mk(); e._heavy = heavy; const now = performance.now();
    blocking = ago != null; lastBlockAttemptT = now / 1000 - (ago == null ? 9 : ago); lastBlockAttemptG = playClockS - (ago == null ? 9 : ago);
    const p0 = PPOST.posture; executeStrike(e, raw, now); blocking = false;
    const o = { hp: maxHP - PHP, post: +(p0 - PPOST.posture).toFixed(2), stag: playerStaggered(now / 1000), parry: typeof e._ripUntil === 'number' && e._ripUntil > 0, spent: e._heavy === false };
    drop(e); return o; };
  set('guard', 0); set('armour', 0);
  out.openL = take(false, null); out.openH = take(true, null);
  out.heldL = take(false, 5); out.heldH = take(true, 5);
  out.parryH = take(true, .05);
  set('guard', 75); out.ironL = take(false, 5); out.ironH = take(true, 5); set('guard', 0);
  // Hold the line: posture just above half, a hit that would empty it
  set('armour', 75); const htl = heavy => { reset(); PPOST.posture = PPOST.maxPosture * .55; const e = mk(); e._heavy = heavy; executeStrike(e, PPOST.maxPosture, performance.now()); const s = playerStaggered(performance.now() / 1000); drop(e); return s; };
  out.htlL = htl(false); out.htlH = htl(true); set('armour', 0);
  Object.assign(EQ, eq0); for (const k in sk0) SKILLS[k] = sk0[k]; reset();
  return out; });
console.log(JSON.stringify(r));
check(`one wind-up in four is heavy: ${(r.share * 100).toFixed(1)}% of 4,000 for a Bandit, ${(r.wolf * 100).toFixed(1)}% for a wolf`, Math.abs(r.share - .25) < .03 && Math.abs(r.wolf - .25) < .03, r);
check('never two heavies running', !r.twice, r);
check('the roll is seeded on the foe and the count: the same foe gives the same 4,000 again, another foe another', r.same && r.other, r);
check('every other family swings heavy one in four, never twice running (S1137): ' + Object.entries(r.fams).map(([k, v]) => k + ' ' + v.share).join(', '), Object.values(r.fams).every(v => Math.abs(v.share - .25) < .03 && !v.twice), r.fams);
check('a boss and the shark never swing heavy (their own blows)', r.none.every(x => !x), r.none);
check(`the slow kinds' heavy is their tell + 0.35: golem ${r.tellsBig.golem}, troll ${r.tellsBig.troll}; a slime's ${r.tellsBig.slime}`, r.tellsBig.golem[0] === .9 && r.tellsBig.golem[1] === 1.25 && r.tellsBig.troll[0] === .83 && r.tellsBig.troll[1] === 1.18 && r.tellsBig.slime[0] === .54 && r.tellsBig.slime[1] === 1, r.tellsBig);
check(`the light tells stay as built (Bandit ${r.tells.bandit[0]}, wolf ${r.tells.wolf[0]}, kobold ${r.tells.kobold[0]}), the heavy is 1.0`,
  r.tells.bandit[0] === .57 && r.tells.wolf[0] === .61 && r.tells.kobold[0] === .45 && r.tells.bandit[1] === 1 && r.tells.wolf[1] === 1 && r.tells.kobold[1] === 1, r.tells);
check(`the heavy's last moment glows red ${r.glowH}, a light one's gold ${r.glowL}; neither glows halfway through`, r.glowH[0] > .5 && r.glowH[1] < .15 && r.glowL[0] > .5 && r.glowL[1] > .4 && r.glowEarly === 0, r);
check(`a heavy blow is twice the light (${r.blowL} → ${r.blowH})`, Math.abs(r.blowH - 2 * r.blowL) <= 1, r);
check(`unguarded, a heavy drains twice the posture (${r.openL.post} → ${r.openH.post}) and the damage is what it is given`, Math.abs(r.openH.post - 2 * r.openL.post) < .01 && r.openH.hp === r.openL.hp && r.openH.spent, r);
check(`a held block takes a light blow (posture ${r.heldL.post}) and breaks under a heavy (staggered: ${r.heldH.stag}), its damage still blocked (${r.heldH.hp} of 10)`, !r.heldL.stag && r.heldH.stag && r.heldH.hp === r.heldL.hp && r.heldH.hp < 10, r);
check('a perfect parry still parries a heavy', r.parryH.parry && r.parryH.hp === 0 && !r.parryH.stag, r);
check(`Iron wall (Guard 75): the held block stands under a heavy, at twice the posture (${r.ironL.post} → ${r.ironH.post})`, !r.ironH.stag && Math.abs(r.ironH.post - 2 * r.ironL.post) < .01, r);
check('Hold the line (Armour 75) keeps you up under a light hit above half posture, not under a heavy', !r.htlL && r.htlH, r);

// in the running game: a keyed Bandit, alert, a metre off, for 60 s of the loop's own ticks; every wind-up's tell and every blow
await page.evaluate(() => { window._drive = (step, max) => {
  const raf = window.requestAnimationFrame, rr = REN.render; window.requestAnimationFrame = () => 0; REN.render = () => {};
  let t = performance.now(), n = 0;
  try { for (; n < max; n++) { if (step()) break; t += 1000 / 60; loop(t); } }
  finally { window.requestAnimationFrame = raf; REN.render = rr; prevT = 0; }
  return n; }; });
const live = await page.evaluate(() => {
  forceTime(12); PHP = maxHP; dead = false;
  const e = keyFoe(unlockFoe(buildZoneEnemy(WORLD.scene, [], px, pz - 1.2, 'Bandit', null)), 'heavytest:run:0'); e.alert = true; ZONES.world.enemies.push(e);
  const log = { winds: [], blows: [] }; const _t = sndTelegraph, _x = executeStrike;
  sndTelegraph = function () { log.winds.push([+e.telegraphMax.toFixed(2), !!e._heavy, !!e._feint]); return _t.apply(this, arguments); };
  executeStrike = function (f, raw) { if (f === e) log.blows.push([!!f._heavy, raw]); return _x.apply(this, arguments); };
  const step = () => { PHP = maxHP; stamina = maxStamina; PPOST.stagUntil = 0; PPOST.posture = PPOST.maxPosture; yaw = Math.atan2(-(e.x - px), -(e.z - pz)); };
  try { _drive(step, 3600); } finally { sndTelegraph = _t; executeStrike = _x; }
  e.dead = true; WORLD.scene.remove(e.mesh); const L = ZONES.world.enemies, i = L.indexOf(e); if (i >= 0) L.splice(i, 1);
  return log; });
const H = live.winds.filter(w => w[1]), Lt = live.winds.filter(w => !w[1] && !w[2]), Ft = live.winds.filter(w => w[2]); /* S1140 — a feint is a light blow held 0.3 s (tests/feint) */
const hb = live.blows.filter(b => b[0]).map(b => b[1]), lb = live.blows.filter(b => !b[0]).map(b => b[1]);
console.log(JSON.stringify({ winds: live.winds.length, heavy: H.length, blows: live.blows.length, hb: hb.slice(0, 6), lb: lb.slice(0, 6) }));
check(`in 60 s of the loop the Bandit wound up ${live.winds.length} times, ${H.length} heavy, ${Ft.length} feints, tells 0.57, 0.87 and 1.0 only`, live.winds.length >= 15 && H.length >= 2 && H.every(w => w[0] === 1) && Lt.every(w => w[0] === .57) && Ft.every(w => w[0] === .87), live.winds);
check('its heavy blows land at about twice its light ones', hb.length >= 2 && lb.length >= 2 && Math.min(...hb) > Math.max(...lb), { hb, lb });
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
