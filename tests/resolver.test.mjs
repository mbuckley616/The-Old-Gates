// Combat's resolver (Session 940; combat, Michael's B, its deep-work session). One attack table (WEAPON_ATTACKS, FOE_ATTACKS
// in 74-strikes.js) and one resolver for your swing (resolvePlayerStrike) in the dungeon and the open world; a foe's blow
// from its family's row; commitment (×0.35 and 90° a second in a swing's wind-up and strike, only the recovery cancels
// into a roll or a block); the light chain (the third ×1.3 damage and ×1.5 posture, lost after 0.4 s idle); a potion's
// 0.8 s at walking pace; armour as a share (decision #181 B). Times are on the play clock and set by hand, dice pinned.
import { boot, check } from './lib/game.mjs';
const g = await boot(); const { page } = g;
await g.intoWorld();
// S941 (skills and perks A): the weapon's skill carries the damage and the flat level × 1.5 is gone. Every skill is set to 50
// (×1.0, no perk above 50), so the blows are big enough for the guard, the riposte and the finisher to be told apart.
// Fists roll 3 here, and the Bandit's armour takes a 3 to 1, where the old level term made it 2; Hand-to-hand 100 (×1.4) gives the 4 the suite was written for.
await page.evaluate(() => { for (const k in SKILLS) SKILLS[k] = { lv: 50, p: 0 }; SKILLS.hand = { lv: 100, p: 0 }; });

// ── the table: every weapon's light swing keeps today's times (0.55 s × the weight's factor, impact at 0.55, the last third recovery)
const tbl = await page.evaluate(() => {
  const out = []; const SP = ANIM_PARAMS.swing;
  for (const T of [...WEAPON_TYPES, { type: 'Fists', weight: FISTS.weight, shape: null }]) {
    const r = T.shape ? WEAPON_ATTACKS[WSHAPE_TO_ROW[T.shape]] : WEAPON_ATTACKS.Fists;
    const f = Math.min(SP.weightMax, Math.max(SP.weightMin, SP.weightA + SP.weightB * T.weight)), D = SP.normalDur * f;
    out.push({ t: T.type, total: +(r.tell + r.strike + r.recovery).toFixed(3), today: +D.toFixed(3), impact: +(r.tell / D).toFixed(3), rec: +(r.recovery / D).toFixed(3), post: r.posture, want: 8 * (T.postureMult || 1), cleave: r.cleave, wantC: T.cleaveTargets || 1 });
  }
  const fams = Object.keys(FOE_ATTACKS), cols = ['tell', 'strike', 'recovery', 'reach', 'arc', 'dmg', 'posture', 'blockable', 'parryable', 'heavy', 'third'];
  return { out, fams, allCols: fams.every(k => cols.every(c => c in FOE_ATTACKS[k])) && Object.keys(WEAPON_ATTACKS).every(k => cols.every(c => c in WEAPON_ATTACKS[k])),
    tells: Object.keys(TELEGRAPH_BY_NAME).length, cast: !!(WEAPON_ATTACKS.Cast && WEAPON_ATTACKS.Cast.placeholder),
    fam: { troll: foeFamily({ name: 'Forest Troll' }), wolf: foeFamily({ name: 'Wolf', baseName: 'Wolf', shape: 'wolf' }), skel: foeFamily({ baseType: 'Skeleton' }), wraith: foeFamily({ baseType: 'Wraith', isWraith: true }), boss: foeFamily({ isBoss: true, name: 'Faolchú' }) } };
});
console.log(JSON.stringify(tbl));
check('every weapon row keeps today\'s swing: its length, its impact at 0.55, its last third the recovery', tbl.out.every(r => Math.abs(r.total - r.today) < .002 && Math.abs(r.impact - .55) < .005 && Math.abs(r.rec - 1 / 3) < .005), tbl.out);
check('every row\'s posture and cleave are today\'s (8 × the weapon\'s postureMult; its cleave)', tbl.out.every(r => r.post === r.want && r.cleave === r.wantC), tbl.out);
check('every row has the table\'s columns, the heavy and third left for the move sets; a sent cast is a placeholder row', tbl.allCols && tbl.cast, tbl);
check('the families: a troll sweeps, a wolf is a beast, a skeleton a humanoid, a wraith a wraith, a boss its own; 15 tells by kind', tbl.fam.troll === 'troll' && tbl.fam.wolf === 'beast' && tbl.fam.skel === 'humanoid' && tbl.fam.wraith === 'wraith' && tbl.fam.boss === 'boss' && tbl.tells === 15, tbl);

// ── one resolver, two places: the same Bandit, the same swing, the same outcomes in the dungeon and the open world
const par = await page.evaluate(() => {
  const keepZ = ZE, keepE = ENEMIES, keepZone = activeZoneId, rnd = Math.random; Math.random = () => .5;
  const EQk = { ...EQ }; for (const k in EQ) EQ[k] = null;
  _exhaustedStrike = false; FINISHER_SAFE_UNTIL = 0; SWING = null; CHAIN.n = 0;
  const at = (d, deg) => { const a = (deg || 0) * Math.PI / 180; return [px + (fwdX * Math.cos(a) + rgtX * Math.sin(a)) * d, pz + (fwdZ * Math.cos(a) + rgtZ * Math.sin(a)) * d]; };
  const mk = (d, deg) => { const [x, z] = at(d, deg); const e = buildZoneEnemy(WORLD.scene, [], x, z, 'Bandit', null); if (!e.mesh.parent) WORLD.scene.add(e.mesh);
    e.x = x; e.z = z; e.locked = false; e.spd = 0; e.atkCd = 1e9; e.telegraphT = 0; e.rng = null; e.hp = e.maxHp = 1000; e.floor = currentFloor; e.disguised = false;
    e.combatYaw = Math.atan2(px - e.x, pz - e.z); if (typeof e.posture !== 'number') initPosture(e); return e; };
  const clean = e => { WORLD.scene.remove(e.mesh); staggered = staggered.filter(s => s.e !== e); };
  const place = (where, fn) => { if (where === 'dungeon') activeZoneId = 'dungeon'; try { return fn(); } finally { activeZoneId = keepZone; } };
  const swing = (where, e, pow) => place(where, () => { if (where === 'dungeon') ENEMIES = [e]; else ZE = [e]; const h0 = e.hp;
    try { const r = resolvePlayerStrike(!!pow); const o = r[0] || {}; return { hits: r.length, lost: h0 - e.hp, guardBroke: !!o.guardBroke, riposte: !!(o.info && o.info.riposte), finisher: !!(o.info && o.info.finisher), crit: !!(o.info && o.info.crit) }; }
    finally { ZE = keepZ; ENEMIES = keepE; } });
  const cases = {
    hit: e => {}, far: null, wide: null, edge: null,
    shield: e => { e.shieldUp = true; }, shieldPow: e => { e.shieldUp = true; },
    riposte: e => { const t = performance.now() / 1000; e._ripAt = t; e._ripUntil = t + .8; _swingStartS = t + .1; staggered.push({ e, t: 1.2 }); },
    finisher: e => { applyPostureDamage(e, e.maxPosture, performance.now() / 1000); staggered.push({ e, t: POSTURE_BREAK_STUN }); },
  };
  const geo = { far: [2.3, 0], wide: [1.2, 70], edge: [1.2, 60] };
  const out = {};
  for (const where of ['dungeon', 'world']) {
    const o = out[where] = {};
    for (const k of Object.keys(cases)) {
      const [d, deg] = geo[k] || [1.2, 0]; const e = mk(d, deg); if (cases[k]) cases[k](e); _swingStartS = k === 'riposte' ? _swingStartS : -1e9;
      o[k] = swing(where, e, k === 'shieldPow'); clean(e); FINISHER_SAFE_UNTIL = 0;
    }
    // a foe's blow, through each place's own path: unguarded, a held block, a parry (and the riposte it opens)
    const blow = (mode) => { const e = mk(1.0); e.atkCd = 0; PHP = maxHP; PPOST.posture = PPOST.maxPosture; PPOST.stagUntil = 0; ROLL = null; lastHitT = -99;
      blocking = mode !== 'open'; lastBlockAttemptT = performance.now() / 1000 - (mode === 'parry' ? .05 : 5); lastBlockAttemptG = playClockS - (mode === 'parry' ? .05 : 5);
      const r = place(where, () => { if (where === 'dungeon') { executeDungeonStrike(e, performance.now()); }
        else { e.alert = true; e.telegraphMax = .5; e.telegraphT = .001; ZE = [e]; try { tickZoneEnemies(1 / 60, performance.now(), WORLD.scene); } finally { ZE = keepZ; } }
        return { lost: maxHP - PHP, open: typeof e._ripUntil === 'number' && e._ripUntil > performance.now() / 1000 }; });
      blocking = false; clean(e); PHP = maxHP; return r; };
    o.foeOpen = blow('open'); o.foeBlock = blow('block'); o.foeParry = blow('parry');
  }
  Math.random = rnd; Object.assign(EQ, EQk); PPOST.posture = PPOST.maxPosture; return out;
});
console.log(JSON.stringify(par));
const D = par.dungeon, W = par.world;
check('in reach and in the arc a swing lands, the same blow in both places', D.hit.hits === 1 && D.hit.lost > 0 && JSON.stringify(D.hit) === JSON.stringify(W.hit), { D: D.hit, W: W.hit });
check('out of reach (2.3) and out of the arc (70° off) it misses in both; 60° off it lands', D.far.hits === 0 && W.far.hits === 0 && D.wide.hits === 0 && W.wide.hits === 0 && D.edge.hits === 1 && D.edge.lost === W.edge.lost, { D, W });
check('a raised shield guards the blow, the same in both, and a power blow breaks it without a wound', D.shield.lost > 0 && D.shield.lost < D.hit.lost && D.shield.lost === W.shield.lost && D.shieldPow.guardBroke && W.shieldPow.guardBroke && D.shieldPow.lost === 0 && W.shieldPow.lost === 0, { D, W });
check('a riposte lands ×2.5 in both, the same', D.riposte.riposte && W.riposte.riposte && D.riposte.lost === W.riposte.lost && D.riposte.lost > D.hit.lost * 2, { D: D.riposte, W: W.riposte });
check('a finisher lands ×3 in both, the same', D.finisher.finisher && W.finisher.finisher && D.finisher.lost === W.finisher.lost && D.finisher.lost > D.riposte.lost, { D: D.finisher, W: W.finisher });
check('a foe\'s blow from the same row: the same wound in both places, a held block takes its share, a parry all of it and opens a riposte',
  D.foeOpen.lost > 0 && D.foeOpen.lost === W.foeOpen.lost && D.foeBlock.lost < D.foeOpen.lost && D.foeBlock.lost === W.foeBlock.lost && D.foeParry.lost === 0 && W.foeParry.lost === 0 && D.foeParry.open && W.foeParry.open, { D, W });

// ── commitment: the swing's phases on the play clock, the roll and the guard refused in the wind-up and strike, taken in the recovery
const cm = await page.evaluate(() => {
  const out = {}; const EQk = { ...EQ }; for (const k in EQ) EQ[k] = null;
  const sword = WEAPON_TYPES.find(t => t.type === 'Sword'); EQ.weapon = { name: 'Test Sword', type: 'equip', slot: 'weapon', weaponShape: 'sword', weight: sword.weight, atk: [10, 12] };
  stamina = maxStamina; staminaCD = 0; onGround = true; ROLL = null; blocking = false; CHAIN.n = 0;
  const g0 = playClockS; const S = beginSwing(false, () => {}); _pendingStrike = null;
  out.times = { tell: +S.tell.toFixed(3), strike: +S.strike.toFixed(3), recovery: +S.recovery.toFixed(3), total: +S.total.toFixed(3), swingT: +swingT.toFixed(3) };
  out.phase = [.1, .32, .4, .6].map(t => swingPhase(g0 + t));
  out.moveTell = commitMoveMult();
  out.rollInTell = startRoll(performance.now() / 1000, {}); out.guardInTell = raiseGuard(); out.blockingAfter = blocking;
  playClockS = g0 + .32; out.moveStrike = commitMoveMult(); out.rollInStrike = startRoll(performance.now() / 1000, {});
  playClockS = g0 + .4; out.moveRec = commitMoveMult(); out.guardInRec = raiseGuard(); out.swingAfterGuard = SWING === null; blocking = false;
  const S2 = beginSwing(false, () => {}); _pendingStrike = null; playClockS += .4; out.rollInRec = startRoll(performance.now() / 1000, {}); out.swingAfterRoll = SWING === null; ROLL = null;
  // the turn: 90° a second while committed, free otherwise
  SWING = null; commitTurn(0); beginSwing(false, () => {}); _pendingStrike = null; const y0 = yaw; yaw += 1; commitTurn(.1); out.turnCommitted = +(yaw - y0).toFixed(4);
  SWING = null; const y1 = yaw; yaw += 1; commitTurn(.1); out.turnFree = +(yaw - y1).toFixed(4); yaw = y0;
  swingT = 0; Object.assign(EQ, EQk); return out;
});
console.log(JSON.stringify(cm));
check('a sword\'s swing: 0.303 s wind-up, 0.064 s strike, 0.183 s recovery, 0.55 s in all', cm.times.tell === .303 && cm.times.strike === .064 && cm.times.recovery === .183 && cm.times.total === .55 && cm.times.swingT === .55, cm.times);
check('the phases on the play clock: tell, strike, recovery, done', JSON.stringify(cm.phase) === JSON.stringify(['tell', 'strike', 'recovery', null]), cm.phase);
check('in the wind-up and the strike you move at ×0.35; in the recovery at full pace', cm.moveTell === .35 && cm.moveStrike === .35 && cm.moveRec === 1, cm);
check('in the wind-up and the strike neither a roll nor the guard can start', !cm.rollInTell && !cm.guardInTell && !cm.blockingAfter && !cm.rollInStrike, cm);
check('in the recovery the guard and the roll cut the swing short', cm.guardInRec && cm.swingAfterGuard && cm.rollInRec && cm.swingAfterRoll, cm);
check('committed, a 1-radian flick turns you only 90° a second (0.157 rad in 0.1 s); free, all of it', Math.abs(cm.turnCommitted - Math.PI / 2 * .1) < 1e-3 && Math.abs(cm.turnFree - 1) < 1e-3, cm);

// the pace through the game's own loop: W held, a swing held in its wind-up, against the same walk with no swing
const pace = await page.evaluate(() => new Promise(res => {
  for (let a = 0; a < 16; a++) { yaw = a * Math.PI / 8; let clear = true; for (let s = .3; s <= 4; s += .3) if (currentZoneSolid(px - Math.sin(yaw) * s, pz - Math.cos(yaw) * s)) { clear = false; break; } if (clear) break; }
  const K = window._K; const run = (committed, n, done) => { const x0 = px, z0 = pz, g0 = playClockS; K['KeyW'] = true;
    if (committed) SWING = { t0: playClockS, tell: 1e6, strike: 0, recovery: 0, total: 1e6, isPow: false, chain: 1 }; else SWING = null;
    let k = 0; const f = () => { if (++k < n) { requestAnimationFrame(f); return; } K['KeyW'] = false; const d = Math.hypot(px - x0, pz - z0), t = playClockS - g0; SWING = null; done(d / t); }; requestAnimationFrame(f); };
  run(false, 8, free => run(true, 8, held => res({ free: +free.toFixed(3), held: +held.toFixed(3), ratio: +(held / free).toFixed(3) })));
}));
console.log(JSON.stringify(pace));
check('through the loop, walking in a swing\'s wind-up goes at ×0.35 of the same walk', pace.free > 1 && Math.abs(pace.ratio - .35) < .04, pace);

// ── the light chain: three in a row, the third ×1.3 damage and ×1.5 posture; lost after 0.4 s idle; a power blow breaks it
const ch = await page.evaluate(() => {
  const out = {}; const EQk = { ...EQ }; for (const k in EQ) EQ[k] = null; CHAIN.n = 0; CHAIN.endG = -1e9;
  const hand0 = SKILLS.hand; SKILLS.hand = { lv: 24, p: 0 }; /* S1051 — the chain's fists without Hard knuckles (25) and Stone hand (100), `perkarms` */
  const g0 = playClockS; const seq = []; let t = g0;
  const go = (gap, pow) => { const S = beginSwing(!!pow, () => {}); _pendingStrike = null; seq.push(S.chain); t = S.t0 + S.total + gap; playClockS = t; };
  go(.1); go(.39); go(0); go(0); go(.5); go(.2, true); go(.1);
  out.seq = seq; swingT = 0; SWING = null;
  // the third's blow against the first's, the dice pinned
  const rnd = Math.random; Math.random = () => .5; _exhaustedStrike = false; const keepZ = ZE;
  const blow = (chain) => { const e = buildZoneEnemy(WORLD.scene, [], px + fwdX * 1.2, pz + fwdZ * 1.2, 'Bandit', null); if (!e.mesh.parent) WORLD.scene.add(e.mesh);
    e.locked = false; e.spd = 0; e.atkCd = 1e9; e.rng = null; e.hp = e.maxHp = 1000; e.def = 0; e.resist = {}; e.combatYaw = Math.atan2(px - e.x, pz - e.z); if (typeof e.posture !== 'number') initPosture(e); e.posture = e.maxPosture = 1000;
    SWING = { t0: playClockS, tell: .3, strike: .06, recovery: .18, total: .55, isPow: false, chain }; _swingStartS = -1e9; ZE = [e];
    try { resolvePlayerStrike(false); } finally { ZE = keepZ; } const r = { lost: 1000 - e.hp, post: 1000 - e.posture }; WORLD.scene.remove(e.mesh); SWING = null; return r; };
  const raw = Math.floor((FISTS.atk[0] + Math.floor(.5 * (FISTS.atk[1] - FISTS.atk[0]))) * skillMult(weaponSkill(EQ.weapon)) * (1 + attrEff('might') * ATTR_DMG_PER_POINT) * _buffMult('meleeDmg', 1) * _buffMult('dmgBurst', 1));
  const raw3 = Math.floor((FISTS.atk[0] + Math.floor(.5 * (FISTS.atk[1] - FISTS.atk[0]))) * skillMult(weaponSkill(EQ.weapon)) * (1 + attrEff('might') * ATTR_DMG_PER_POINT) * _buffMult('meleeDmg', 1) * _buffMult('dmgBurst', 1) * 1.3);
  out.first = blow(1); out.third = blow(3); out.want = { first: challengeDealt(Math.max(1, raw)), third: challengeDealt(Math.max(1, raw3)) };
  Math.random = rnd; Object.assign(EQ, EQk); SKILLS.hand = hand0; return out;
});
console.log(JSON.stringify(ch));
check('light swings chain 1, 2, 3 within 0.4 s of each other, then start again; 0.5 s idle loses it; a power blow breaks it', JSON.stringify(ch.seq) === JSON.stringify([1, 2, 3, 1, 2, 0, 1]), ch.seq);
check('the third lands ×1.3 (the chain on the damage before armour) and drains ×1.5 posture (12 of fists\' 8)', ch.first.lost === ch.want.first && ch.third.lost === ch.want.third && ch.third.lost > ch.first.lost && ch.first.post === 8 && ch.third.post === 12, ch);

// ── a potion: 0.8 s at walking pace, out of the bag at once, into you when it is down; no swing while you drink
const pot = await page.evaluate(() => {
  const out = {}; DRINK = null; PHP = maxHP - 50; const g0 = playClockS;
  BAG.push({ name: 'Test Draught', type: 'potion', heal: 30, qty: 1, ico: '🧪' }); const n0 = BAG.length;
  useItem(BAG.length - 1); out.bagGone = BAG.length === n0 - 1; out.at0 = maxHP - PHP; out.drinking = !!DRINK; out.move = commitMoveMult();
  atkCd = 0; SWING = null; attack(false); out.swungWhileDrinking = !!SWING;
  out.again = (BAG.push({ name: 'Test Draught 2', type: 'potion', heal: 30, qty: 1, ico: '🧪' }), useItem(BAG.length - 1), BAG.some(b => b.name === 'Test Draught 2'));
  BAG.splice(BAG.findIndex(b => b.name === 'Test Draught 2'), 1);
  playClockS = g0 + .79; tickDrink(); out.at79 = maxHP - PHP;
  playClockS = g0 + .81; tickDrink(); out.at81 = maxHP - PHP; out.done = !DRINK; out.moveAfter = commitMoveMult();
  PHP = maxHP; swingT = 0; SWING = null; return out;
});
console.log(JSON.stringify(pot));
check('a potion leaves the bag at once and heals nothing for 0.8 s; you walk (×0.5, no sprint) and cannot swing', pot.bagGone && pot.drinking && pot.at0 === 50 && pot.at79 === 50 && pot.move === .5 && !pot.swungWhileDrinking && pot.again, pot);
check('at 0.8 s it heals its 30, and your pace comes back', pot.at81 === 20 && pot.done && pot.moveAfter === 1, pot);

// ── armour as a share: × 50 / (50 + armour), at 0, 40 and 100 armour, and through a dungeon foe's own blow
const arm = await page.evaluate(() => {
  const out = {}; const rnd = Math.random; Math.random = () => .5; const keepZone = activeZoneId; const EQk = { ...EQ };
  const sk = { baseType: 'Skeleton', dmgMult: 2, name: 'Skeleton' }, K = foePlaceK(sk), raw = (10 + Math.floor(.5 * 11)) * 2;
  out.share = [0, 40, 100].map(a => ({ a, got: foeBlow(sk, raw, a), want: Math.max(1, Math.round(raw * K * 50 / (50 + a))) }));
  out.k = +K.toFixed(4);
  for (const k in EQ) EQ[k] = null; EQ.chest = { name: 'Test Plate', type: 'equip', slot: 'chest', def: 40 }; out.armour = _armour();
  const e = buildZoneEnemy(WORLD.scene, [], px + fwdX * 1.0, pz + fwdZ * 1.0, 'Bandit', null); if (!e.mesh.parent) WORLD.scene.add(e.mesh);
  delete e.dmg; e.dmgMult = 2; e.baseType = 'Skeleton'; e.rng = null; e.x = px + fwdX; e.z = pz + fwdZ; e.combatYaw = Math.atan2(px - e.x, pz - e.z); e.floor = currentFloor;
  PHP = maxHP; blocking = false; ROLL = null; lastBlockAttemptG = -99; lastBlockAttemptT = -99; FINISHER_SAFE_UNTIL = 0; PPOST.stagUntil = 0;
  activeZoneId = 'dungeon'; try { executeDungeonStrike(e, performance.now()); } finally { activeZoneId = keepZone; }
  out.e2e = { lost: maxHP - PHP, want: _warded(Math.max(1, Math.round(raw * K * 50 / 90)), e) };
  WORLD.scene.remove(e.mesh); PHP = maxHP; Object.assign(EQ, EQk); for (const k in EQ) if (!(k in EQk)) EQ[k] = null; Math.random = rnd;
  return out;
});
console.log(JSON.stringify(arm));
check('a blow is × 50/(50 + armour): all of it at 0, 56% at 40, a third at 100 (never 1 by armour alone)', arm.share.every(s => s.got === s.want) && arm.share[2].got > 1, arm.share);
check('a dungeon foe\'s own blow at 40 armour lands as the share says', arm.armour === 40 && arm.e2e.lost === arm.e2e.want && arm.e2e.lost > 1, arm);

// ── the retune: an ordinary blow at your level's kit is near a sixth of the reference health (Michael's B on #355), both places.
// Since S1034 (enemies by place, #373 A) a foe's blow reads its place's tier, worth the levels 1, 6, 11 and 16: measured at each
// tier against the kit and health of the tier's level (it was every level from 1 to 20, when the blow read yours).
const tune = await page.evaluate(() => {
  const L0 = level, rows = [];
  for (let T = 1; T <= 4; T++) { const L = tierLevel(T); const s = enemyDmgScale(T), kit = kitRef(L), hp = hpRef(L);
    const dun = Math.round(armourShare(30 * s * foePlaceK({}), kit)), wld = Math.round(armourShare(7 * s * foePlaceK({ dmg: 7 }), kit));
    rows.push({ T, L, kit, hp, scale: +s.toFixed(2), dun, wld, dShare: +(dun / hp).toFixed(3), wShare: +(wld / hp).toFixed(3), hitsToFall: Math.ceil(hp / dun) }); }
  level = L0; return rows;
});
console.log(JSON.stringify(tune));
check('an ordinary blow at each tier\'s level\'s kit lands at 15–18% of that level\'s health, tiers 1 to 4, in the dungeon and the open world: six blows to fall', tune.every(r => Math.abs(r.dShare - 1 / 6) <= 1 / 60 && Math.abs(r.wShare - 1 / 6) <= 1 / 60 && r.hitsToFall === 6), tune);

check('no page errors', g.errs.length === 0, g.errs);
await g.close();
