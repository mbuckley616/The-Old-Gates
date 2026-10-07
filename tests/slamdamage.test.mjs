// The cavern master's slam against your health, measured (backlog C, Session 404's owed "the damage, by play").
// Since Session 617 (Michael's C on #181) the slam is 45% of your max health, 60% with no chest piece, whatever the
// master and the armour; the suite now checks that rule where it measured the old one (twice the blow, armour off first). Real lair caverns (makePortalDef, as a world lair door builds them, so the difficulty
// follows your level) are built at six levels and three seeds; each master's slam is rolled through the game's own
// slamBlow at two armours (bare, and a full heavy kit at the best tier a lair can drop at that level) and set against
// your max health at that level for two characters: a Scholar who never takes Fortitude, and a Sentinel who starts
// with 3 and takes the archetype's +1 every level. An ordinary blow of the same master is the dungeon strike's roll.
import { boot, check } from './lib/game.mjs';
const g = await boot(); const { page } = g;
await g.intoWorld();

const LEVELS = [1, 3, 6, 10, 15, 20], SEEDS = [4021, 517003, 288811];
const rows = [];
for (const L of LEVELS) for (const seed of SEEDS) {
  await page.evaluate(({ L, seed }) => { if (!window._home) window._home = { x: px, z: pz }; level = L; window._lairBoss = null;
    const p = makePortalDef({ x: window._home ? window._home.x : px, z: window._home ? window._home.z : pz, seed, theme: 'deep', size: 'medium', zone: 'world', kind: 'cave_door', interior: 'cave', canonicalName: 'Test — the cavern' });
    /* the door is where you stand, so leaving puts you back there */ p.zone = 'world'; p.lair = { place: 'Test', boss: 'Cave Bear', dragon: false }; goToDungeon(p); }, { L, seed });
  for (let k = 0; k < 40 && !(await page.evaluate(() => activeZoneId === 'dungeon' && scene === dScene && !!window._lairBoss)); k++) await page.waitForTimeout(500);
  await page.waitForTimeout(800);
  const r = await page.evaluate(({ L }) => { const e = window._lairBoss; if (!e) return { L, none: true };
    const save = {}; for (const s of Object.keys(EQ)) save[s] = EQ[s];
    const bare = () => { for (const s of Object.keys(EQ)) EQ[s] = null; };
    // the best tier a lair's loot can give at this level (rollLoot's cap, the portal's own difficulty)
    const ds = currentPortal.diffScale, tier = Math.min(10, Math.max(1, Math.floor(1 + L * .4 + ds.hp * 1.2)));
    const kit = () => { bare(); for (const t of ARMOR_TYPES) if (['head', 'chest', 'hands', 'legs', 'feet', 'offhand'].includes(t.slot) && !EQ[t.slot]) EQ[t.slot] = makeItem(tier, t, null, true); };
    const roll = (n) => { let lo = 1e9, hi = 0, sum = 0; for (let i = 0; i < n; i++) { const d = _warded(slamBlow(e), e); lo = Math.min(lo, d); hi = Math.max(hi, d); sum += d; } return { lo, hi, mean: Math.round(sum / n) }; };
    const want = (def) => { const m = e.dmgMult || 1, f = (x) => Math.max(1, Math.round((x - Math.floor(def * .5)) * m)); const sl = _warded(Math.max(1, Math.round(maxHP * (EQ.chest ? .45 : .6))), e); return { blow: [f(10), f(20)], slam: [sl, sl], hp: maxHP }; };
    bare(); const a0 = _armour(), s0 = roll(300), w0 = want(a0);
    kit(); const a1 = _armour(), s1 = roll(300), w1 = want(a1);
    // the same master against a sweep of armour, one piece holding it all (only the sum counts)
    const sweep = {}; for (const A of [0, 10, 20, 30, 40, 60]) { bare(); EQ.chest = { type: 'equip', slot: 'chest', def: A }; const s = roll(200); sweep[A] = [s.lo, s.hi, s.mean]; }
    for (const s of Object.keys(save)) EQ[s] = save[s];
    const hpScholar = 100 + 10 * (L - 1), hpSentinel = 130 + 20 * (L - 1);
    return { L, diff: currentPortal.diff, dsDmg: ds.dmg, kind: e.baseType, floor: e.floor || 1, mult: +e.dmgMult.toFixed(2), tier,
      bare: { armour: a0, ...s0, want: w0 }, kit: { armour: a1, ...s1, want: w1 }, sweep, hpScholar, hpSentinel }; }, { L });
  rows.push(r); console.log(JSON.stringify(r));
  await page.evaluate(() => goToOW()); await page.waitForTimeout(3000); await g.hide();
}

const ok = rows.filter(r => !r.none);
check('every cavern built its master (18 = 6 levels × 3 seeds)', ok.length === LEVELS.length * SEEDS.length, rows.filter(r => r.none));
check('the slam rolled through slamBlow is 60% of your max health bare and 45% in the kit, at every level, every master', ok.every(r => r.bare.lo >= r.bare.want.slam[0] && r.bare.hi <= r.bare.want.slam[1] && r.kit.lo >= r.kit.want.slam[0] && r.kit.hi <= r.kit.want.slam[1]), ok.map(r => [r.L, r.bare.lo, r.bare.hi, r.bare.want.slam, r.kit.lo, r.kit.hi, r.kit.want.slam]));
check('a lair\'s difficulty follows your level (very easy at 1, very hard at 15 and 20)', ok.filter(r => r.L === 1).every(r => r.diff === 'veryeasy') && ok.filter(r => r.L >= 15).every(r => r.diff === 'veryhard'), ok.map(r => [r.L, r.diff]));
// the table: by level, the worst and the mean of the three masters, as a share of each character's health
const T = LEVELS.map(L => { const rs = ok.filter(r => r.L === L);
  const pct = (v, hp) => Math.round(100 * v / hp);
  return { L, diff: rs[0] && rs[0].diff, masters: rs.map(r => `${r.kind}@${r.floor}×${r.mult}`), tier: rs[0] && rs[0].tier,
    bareSlam: [Math.min(...rs.map(r => r.bare.lo)), Math.max(...rs.map(r => r.bare.hi))], kitSlam: [Math.min(...rs.map(r => r.kit.lo)), Math.max(...rs.map(r => r.kit.hi))],
    bareMeanPctScholar: pct(rs.reduce((a, r) => a + r.bare.mean, 0) / rs.length, rs[0].hpScholar), kitMeanPctScholar: pct(rs.reduce((a, r) => a + r.kit.mean, 0) / rs.length, rs[0].hpScholar),
    bareMeanPctSentinel: pct(rs.reduce((a, r) => a + r.bare.mean, 0) / rs.length, rs[0].hpSentinel), kitMeanPctSentinel: pct(rs.reduce((a, r) => a + r.kit.mean, 0) / rs.length, rs[0].hpSentinel),
    oneShotScholarBare: rs.filter(r => r.bare.hi >= r.hpScholar).length, oneShotScholarKit: rs.filter(r => r.kit.hi >= r.hpScholar).length,
    oneShotSentinelBare: rs.filter(r => r.bare.hi >= r.hpSentinel).length, oneShotSentinelKit: rs.filter(r => r.kit.hi >= r.hpSentinel).length,
    hpScholar: rs[0].hpScholar, hpSentinel: rs[0].hpSentinel }; });
for (const t of T) console.log('TABLE ' + JSON.stringify(t));
check('armour does not move it: a chest piece of 0, 10, 20, 30, 40 or 60 armour, every slam the same 45% (was 2 from 40 armour)', ok.every(r => { const v = r.sweep[0][0]; return [0, 10, 20, 30, 40, 60].every(A => r.sweep[A][0] === v && r.sweep[A][1] === v) && Math.abs(v - Math.round(r.kit.want.hp * .45)) <= 1; }), ok.map(r => [r.L, r.kind, r.kit.want.hp, r.sweep[0], r.sweep[40]]));
for (const r of ok) console.log('SWEEP ' + JSON.stringify([r.L, r.kind, r.mult, r.sweep]));
check('the table has every level', T.length === LEVELS.length && T.every(t => t.masters.length === SEEDS.length), T);
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
