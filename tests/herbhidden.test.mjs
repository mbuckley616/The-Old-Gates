// The herbs' hidden effects (Session 321). Four herbs reveal a hidden effect after fifteen are eaten, and the tooltip
// and the log name it, but nothing read the buff each one sets: Thornberry (`blockBoost`, "+15% block effectiveness"),
// Wolf's Bane (`beastResist`, "-40% damage from beasts"), Briarweed (`atkSpeed`, "+10% attack speed") and Duilleog
// Ghorm (`spellDuration`, "+25% spell effect duration"). Each herb is eaten through `useHerb` with its hidden effect
// unlocked, and what it promises is measured through the game's own code, with and without.
import { boot, check } from './lib/game.mjs';
const g = await boot(); const { page } = g;
await g.intoWorld();
const stop = g.keepAlive();

const r = await page.evaluate(() => {
  const out = {}; FINISHER_SAFE_UNTIL = 0; blocking = false;
  const eat = (key) => { HERB_CONSUME_COUNTS[key] = 20; BAG.push(Object.assign({}, HERB_DEF[key].item, { _typeKey: key, qty: 1 })); useHerb(BAG.length - 1);
    return ACTIVE_BUFFS.map(b => b.type); };
  const foe = (type) => { const e = buildZoneEnemy(WORLD.scene, [], px + fwdX * 1.2, pz + fwdZ * 1.2, type, null); if (!e.mesh.parent) WORLD.scene.add(e.mesh);
    e.locked = false; e.spd = 0; e.atkCd = 1e9; e.telegraphT = 0; return e; };
  const hit = (e, raw, block) => { PHP = maxHP; stamina = 100; PPOST.posture = PPOST.maxPosture; PPOST.stagUntil = 0; blocking = !!block; lastBlockAttemptT = -1e9; lastBlockAttemptG = -1e9;
    executeStrike(e, raw, (performance.now() / 1000 + 100) * 1000); blocking = false; return maxHP - PHP; };
  const wolf = foe('Wolf'), bear = foe('Cave Bear'), bandit = foe('Bandit');
  out.flags = { wolf: wolf.beast, bear: bear.beast, bandit: bandit.beast };
  // Wolf's Bane
  ACTIVE_BUFFS.length = 0; out.bare = { wolf: hit(wolf, 20), bear: hit(bear, 20), bandit: hit(bandit, 20) };
  out.wolfsbaneBuffs = eat('wolfsbane'); out.bane = { wolf: hit(wolf, 20), bear: hit(bear, 20), bandit: hit(bandit, 20), wolfBlocked: hit(wolf, 40, true) };
  ACTIVE_BUFFS.length = 0; out.bare.wolfBlocked = hit(wolf, 40, true);
  // Thornberry: the same 40-point blow on a held block, bare-handed or with whatever the new character holds
  out.blockBare = hit(bandit, 40, true); out.thornBuffs = eat('thornberry'); out.blockThorn = hit(bandit, 40, true);
  // Briarweed: the recovery after a swing in the open world, and the swing factor itself
  ACTIVE_BUFFS.length = 0; const swing = () => { atkCd = 0; stamina = 100; attack(false); const c = atkCd; atkCd = 0; return c; };
  out.cd = swing(); out.f = _weaponSwingFactor(); out.briarBuffs = eat('briarweed'); out.cdBriar = swing(); out.fBriar = _weaponSwingFactor();
  // Duilleog Ghorm: the Shield spell's time, and the ward it sets, at tier 1
  ACTIVE_BUFFS.length = 0; const sp = SPELLS.find(s => s.id === 'sciath');
  const cast = () => { applySpellBuff(sp, 1); const w = ACTIVE_BUFFS.find(b => b.type === 'warding'); return { fx: +((SPELL_FX.shield - performance.now()) / 1000).toFixed(1), ward: w && w.duration }; };
  out.spell = cast(); ACTIVE_BUFFS.length = 0; out.ghormBuffs = eat('duilleogghorm'); out.spellGhorm = cast();
  ACTIVE_BUFFS.length = 0; [wolf, bear, bandit].forEach(e => WORLD.scene.remove(e.mesh)); PHP = maxHP;
  return out; });
console.log(' ', JSON.stringify(r));
check('beasts are marked (the Wolf, the Cave Bear), people are not (the Bandit)', r.flags.wolf && r.flags.bear && !r.flags.bandit, r.flags);
check('Wolf\'s Bane: a beast\'s 20-point blow lands for 12 (×.6), a Bandit\'s still for 20', r.wolfsbaneBuffs.includes('beastResist') && r.bare.wolf === 20 && r.bane.wolf === 12 && r.bare.bear === 20 && r.bane.bear === 12 && r.bane.bandit === 20, r);
check('Wolf\'s Bane: on a held block too', r.bane.wolfBlocked < r.bare.wolfBlocked && Math.abs(r.bane.wolfBlocked - Math.round(r.bare.wolfBlocked * .6)) <= 1, r);
check('Thornberry: a raised guard stops more of a 40-point blow', r.thornBuffs.includes('blockBoost') && r.blockThorn < r.blockBare, { bare: r.blockBare, thorn: r.blockThorn });
check('Briarweed: the swing and its recovery a tenth quicker (÷1.1)', r.briarBuffs.includes('atkSpeed') && Math.abs(r.cd / r.cdBriar - 1.1) < .01 && Math.abs(r.f / r.fBriar - 1.1) < .01, { cd: r.cd, cdBriar: r.cdBriar, f: r.f, fBriar: r.fBriar });
check('Duilleog Ghorm: the Shield spell and its ward last a quarter longer', r.ghormBuffs.includes('spellDuration') && Math.abs(r.spellGhorm.fx / r.spell.fx - 1.25) < .02 && Math.abs(r.spellGhorm.ward / r.spell.ward - 1.25) < .01, { plain: r.spell, ghorm: r.spellGhorm });

stop();
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
