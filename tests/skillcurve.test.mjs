// Skills, the first session (Session 941; skills and perks A, docs/design/skills-and-perks-build.md, on auto/design): 22 skills (23 with Hand-to-hand, Session 950)
// raised by use, the curve 0.9 × L^1.2, the archetype's majors and minors, and the reads. The build sheet's suites `skillcurve`,
// `skilluse`, `skilldamage` and `skillgates` are one boot here, each check named for its suite; `skillsave` holds the save and
// the migration. Real swings through the loop's own tick at fixed 1/60 (the draw held off, as `dmgnums` does) at a Bandit in
// Dunmore's street; the run and the jump are measured by driving the loop.
import { boot, check } from './lib/game.mjs';
const g = await boot(); const { page } = g;
await g.intoWorld();

// skillcurve: the cost of the next level, and a fresh Warrior's start
const curve = await page.evaluate(() => ({ cost: [5, 25, 50, 99].map(skillCost), n: Object.keys(SKILL_DEF).length, arch: playerArchetype,
  lv: Object.fromEntries(Object.keys(SKILL_DEF).map(k => [k, skillLv(k)])), maj: skillMajors.slice(), min: skillMinors.slice() }));
check(`skillcurve: uses to the next level at 5, 25, 50, 99: ${curve.cost.join(', ')} (6, 43, 98, 223 ±1)`, [6, 43, 98, 223].every((v, i) => Math.abs(curve.cost[i] - v) <= 1), curve.cost);
const lvs = Object.values(curve.lv);
check(`skillcurve: 23 skills; a fresh ${curve.arch} has five majors at 25, five minors at 15 and thirteen at 5`, curve.n === 23 && lvs.filter(v => v === 25).length === 5 && lvs.filter(v => v === 15).length === 5
  && lvs.filter(v => v === 5).length === 13 && curve.maj.every(k => curve.lv[k] === 25) && curve.min.every(k => curve.lv[k] === 15), curve);

// skilluse: once a second for each skill and target; ten uses carry Blade 5 to 6 and the next six to 7
const use = await page.evaluate(() => {
  const pn = performance.now; let t = 1e7; performance.now = () => t; const out = {};
  try {
    SKILLS.blade = { lv: 5, p: 0 }; const bandit = {}, deer = {};
    let n = 0; for (let i = 0; i < 30; i++) { if (skillUse('blade', 1, bandit)) n++; t += 1000 / 3; } out.tenS = n;
    out.lv = SKILLS.blade.lv; out.p = SKILLS.blade.p;
    t += 5000; out.two = [skillUse('blade', 1, bandit), skillUse('blade', 1, deer), skillUse('bow', 1, bandit)];
    SKILLS.locks = { lv: 99, p: 222 }; t += 5000; skillUse('locks', 3, 'open'); out.top = { ...SKILLS.locks }; t += 5000; out.more = skillUse('locks', 1, 'open');
  } finally { performance.now = pn; }
  return out; });
check(`skilluse: thirty swings at one foe in ten seconds are ${use.tenS} uses (at most 10), Blade 5 → ${use.lv}`, use.tenS === 10 && use.lv === 6 && use.p === 4, use);
check('skilluse: another foe, or another skill, is its own use the same second', use.two.every(Boolean), use.two);
check(`skilluse: 100 is the top (${use.top.lv}, nothing more to earn)`, use.top.lv === 100 && use.top.p === 0 && use.more === false, use);

await g.settle('dunmore');
await page.evaluate(() => { window._drive = (step, max) => {
  const raf = window.requestAnimationFrame, rr = REN.render; window.requestAnimationFrame = () => 0; REN.render = () => {};
  let t = performance.now(), n = 0;
  try { for (; n < max; n++) { if (step()) break; t += 1000 / 60; loop(t); } }
  finally { window.requestAnimationFrame = raf; REN.render = rr; prevT = 0; }
  return n; };
  window._swing = (e, keep) => { const face = () => { yaw = Math.atan2(-(e.x - px), -(e.z - pz)); pitch = -.05; };
    keep(); face(); atkCd = 0; attack(false); let n = 0; _drive(() => { keep(); face(); return ++n > 3 && (!_pendingStrike || _pendingStrike.fired); }, 120); }; });

// skilluse and skilldamage through the resolver: a Bandit in the street, the same sword at Blade 5, 50 and 100
const fight = await page.evaluate(() => {
  forceTime(12); PHP = maxHP; dead = false; PPOST.stagUntil = 0; thirdPerson = false; ACTIVE_BUFFS.length = 0;
  for (const k in ATTRS) ATTRS[k] = 0;
  EQ.weapon = { name: 'Test Sword', slot: 'weapon', weaponShape: 'sword', wType: 'slash', weight: 3, atk: [100, 100] }; buildViewmodel();
  const t = WORLD.siteAnywhere('dunmore'); let S = null;
  const clear = (x, z) => !WORLD.solidAt(x, z) && WORLD.worldH(x, z) > 0;
  for (let rr = 4; rr < 60 && !S; rr += 1) for (let a = 0; a < 32 && !S; a++) { const x = t.x + Math.cos(a / 32 * Math.PI * 2) * rr, z = t.z + Math.sin(a / 32 * Math.PI * 2) * rr; let ok = true;
    for (let k = 0; k < 16 && ok; k++) for (const d of [1, 2, 3, 4]) if (!clear(x + Math.cos(k / 16 * Math.PI * 2) * d, z + Math.sin(k / 16 * Math.PI * 2) * d)) { ok = false; break; } if (ok) S = { x, z }; }
  if (!S) return { noSpot: true };
  px = S.x; pz = S.z + 1.3;
  const e = unlockFoe(buildZoneEnemy(WORLD.scene, [], S.x, S.z, 'Bandit', null)); ZONES.world.enemies.push(e); e.hp = e.maxHp = 1e6; e.def = 0; e.resist = {};
  let alert = false; const keep = () => { PHP = maxHP; dead = false; PPOST.stagUntil = 0; stamina = maxStamina; e.telegraphT = 0; e.alert = alert; e.hp = 1e6; e.posture = 1e6; };
  let raw = []; const _a = applyMeleeDamage; applyMeleeDamage = function (who, r) { if (who === e) raw.push(r); return _a.apply(this, arguments); };
  const uses = []; const _u = skillUse; skillUse = function (id) { const r = _u.apply(this, arguments); if (r) uses.push(id); return r; };
  const out = { S };
  try {
    // an unaware foe teaches nothing; an alert one does
    alert = false; for (let i = 0; i < 3; i++) _swing(e, keep); out.unaware = { swings: raw.length, blade: uses.filter(u => u === 'blade').length };
    raw = []; uses.length = 0; alert = true; SKILL_LAST.clear(); _swing(e, keep); out.aware = { swings: raw.length, blade: uses.filter(u => u === 'blade').length };
    // the damage: the weapon's roll × (0.6 + 0.8 × Blade/100), with no level in it
    out.dmg = {};
    for (const lvl of [1, 20]) for (const b of [5, 50, 100]) { level = lvl; SKILLS.blade = { lv: b, p: 0 }; raw = []; _swing(e, keep); out.dmg[lvl + '/' + b] = raw[0]; }
    level = 1;
    // Hand-to-hand (Session 950, Michael's C on #357): bare fists are the 23rd skill, the fists' roll on its multiplier
    const fa = FISTS.atk.slice(), keepW = EQ.weapon; EQ.weapon = null; FISTS.atk[0] = FISTS.atk[1] = 100; buildViewmodel(); out.hand = {};
    try { for (const h of [5, 50, 100]) { SKILLS.hand = { lv: h, p: 0 }; raw = []; _swing(e, keep); out.hand[h] = raw[0]; }
      SKILLS.hand = { lv: 5, p: 0 }; uses.length = 0; SKILL_LAST.clear(); _swing(e, keep); out.handUse = uses.slice(); out.handP = SKILLS.hand.p;
    } finally { FISTS.atk[0] = fa[0]; FISTS.atk[1] = fa[1]; EQ.weapon = keepW; buildViewmodel(); }
  } finally { applyMeleeDamage = _a; skillUse = _u; e.hp = 0; }
  return out; });
check(`skilluse: three swings at an unaware Bandit land (${fight.unaware && fight.unaware.swings}) and teach Blade nothing (${fight.unaware && fight.unaware.blade})`, !fight.noSpot && fight.unaware.swings === 3 && fight.unaware.blade === 0, fight);
check(`skilluse: a swing at an alert one is a Blade use (${fight.aware && fight.aware.blade})`, !fight.noSpot && fight.aware.swings === 1 && fight.aware.blade === 1, fight.aware);
const D = fight.dmg || {};
check(`skilldamage: a roll of 100 hits ${D['1/5']}, ${D['1/50']}, ${D['1/100']} at Blade 5, 50, 100 (×0.64, ×1.0, ×1.4)`, D['1/5'] === 64 && D['1/50'] === 100 && D['1/100'] === 140, D);
check(`skilldamage: no level in it: at level 20 the same, ${D['20/5']}, ${D['20/50']}, ${D['20/100']}`, D['20/5'] === 64 && D['20/50'] === 100 && D['20/100'] === 140, D);

const H = fight.hand || {};
check(`skilldamage: a punch rolled at 100 hits ${H[5]}, ${H[50]}, ${H[100]} at Hand-to-hand 5, 50, 100 (×0.64, ×1.0, ×1.4)`, H[5] === 64 && H[50] === 100 && H[100] === 140, H);
check(`skilluse: a punch at an alert foe is a Hand-to-hand use (${fight.handUse})`, Array.isArray(fight.handUse) && fight.handUse.join() === 'hand' && fight.handP === 1, fight);
// the other reads: a school's power and cost, the pick, the run and the jump
const reads = await page.evaluate(() => {
  const out = {}; for (const k in ATTRS) ATTRS[k] = 0;
  const sp = SPELLS.find(s => s.school === 'tine' && s.dmgBase > 0); const e = { rng: null, resist: {}, def: 0, alert: false };
  const spell = (lv) => { SKILLS.tine = { lv, p: 0 }; level = 20; const pr = foeRand; foeRand = () => 0; try { return applySpellDamage(e, sp, 1).dmg; } finally { foeRand = pr; } };
  out.spell = [5, 50, 100].map(spell); out.mag = spellMag(sp, 1); level = 1;
  out.pick = [5, 50, 100].map(l => { SKILLS.locks = { lv: l, p: 0 }; return +pickChance().toFixed(3); });
  return out; });
check(`skilldamage: a Tine word hits ${reads.spell.join(', ')} at Tine 5, 50, 100 from a power of ${reads.mag}, no level in it`, reads.spell[0] === Math.max(1, Math.round(reads.mag * .64)) && reads.spell[1] === Math.max(1, Math.round(reads.mag)) && reads.spell[2] === Math.max(1, Math.round(reads.mag * 1.4)), reads);
check(`the pick's chance with no Finesse at Locks 5, 50, 100: ${reads.pick.join(', ')} (.375, .6, .85)`, reads.pick[0] === .375 && reads.pick[1] === .6 && reads.pick[2] === .85, reads.pick);

const move = await page.evaluate(([S]) => {
  const out = {}; const keepAll = () => { PHP = maxHP; dead = false; stamina = maxStamina; };
  const run = (lv) => { SKILLS.athletics = { lv, p: 0 }; px = S.x - 2; pz = S.z; yaw = -Math.PI / 2; for (const k in K) K[k] = false; let n = 0;
    _drive(() => { keepAll(); return ++n > 10; }, 20); K.KeyW = true; n = 0; _drive(() => { keepAll(); yaw = -Math.PI / 2; return ++n > 20; }, 40); const x0 = px; n = 0;
    _drive(() => { keepAll(); yaw = -Math.PI / 2; return ++n > 30; }, 40); K.KeyW = false; return (px - x0) / (30 / 60); };
  const jump = (lv) => { SKILLS.acrobatics = { lv, p: 0 }; px = S.x; pz = S.z; for (const k in K) K[k] = false; let n = 0; _drive(() => { keepAll(); return ++n > 20 && onGround; }, 120);
    const y0 = jumpY; let top = y0; K.Space = true; n = 0; _drive(() => { keepAll(); if (n === 1) K.Space = false; top = Math.max(top, jumpY); return ++n > 5 && onGround; }, 200); K.Space = false; return top - y0; };
  out.run = [5, 100].map(run).map(v => +v.toFixed(3)); out.jump = [5, 100].map(jump).map(v => +v.toFixed(3));
  return out; }, [fight.S]);
// the loop's own modifiers (Swiftness, the load) and its fixed step sit on both, so the measure is the ratio the sheet sets
check(`the run at Athletics 5 and 100: ${move.run.join(' and ')} a second, ×${(move.run[1] / move.run[0]).toFixed(3)} (the sheet's 3.83 → 4.2, ×1.097, ±2%)`, Math.abs(move.run[1] / move.run[0] / (4.2 / 3.83) - 1) < .02, move);
check(`the jump's apex at Acrobatics 5 and 100: ${move.jump.join(' and ')} m, ×${(move.jump[1] / move.jump[0]).toFixed(3)} (5.5 → 6.6 is ×1.44 the height, ±4%; 0.84 → 1.21 m)`, Math.abs(move.jump[1] / move.jump[0] / 1.44 - 1) < .04 && move.jump[0] > .7, move);

// skillgates: a Steel sword at Blade 29, then 30; Iron armour (heavy) reads Armour 15
const gates = await page.evaluate(() => {
  const out = {}; const sword = makeItem(4, WEAPON_TYPES.find(w => w.type === 'Sword'), null, false); out.req = [sword.reqAttr, sword.reqVal];
  SKILLS.blade = { lv: 29, p: 0 }; out.at29 = canEquip(sword); SKILLS.blade = { lv: 30, p: 0 }; out.at30 = canEquip(sword);
  const mace = makeItem(4, WEAPON_TYPES.find(w => w.type === 'Mace'), null, false); SKILLS.blunt = { lv: 5, p: 0 }; out.mace = canEquip(mace);
  const cuir = makeItem(3, ARMOR_TYPES.find(a => a.slot === 'chest'), null, true); out.cuir = [cuir.reqAttr, cuir.reqVal];
  SKILLS.armour = { lv: 14, p: 0 }; out.c14 = canEquip(cuir).ok; SKILLS.armour = { lv: 15, p: 0 }; out.c15 = canEquip(cuir).ok;
  out.mats = MATERIALS.map(m => m.reqVal); return out; });
check(`skillgates: a Steel sword asks Blade 30: refused at 29 (*${gates.at29.msg}*), held at 30`, gates.req[0] === 'skill' && gates.req[1] === 30 && !gates.at29.ok && /Requires Blade 30 \(you have 29\)/.test(gates.at29.msg) && gates.at30.ok, gates);
check(`skillgates: a Steel mace asks Blunt (*${gates.mace.msg}*); the gates by tier are ${gates.mats.join(', ')}`, !gates.mace.ok && /Blunt 30/.test(gates.mace.msg) && gates.mats.join() === '0,0,15,30,45,55,65,75,90,100', gates);
check('skillgates: an Iron cuirass asks Armour 15', gates.cuir[0] === 'armour' && gates.cuir[1] === 15 && !gates.c14 && gates.c15, gates);
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
