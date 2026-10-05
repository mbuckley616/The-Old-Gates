// Session 478: the co-op rule "a roll that decides an outcome comes from a seeded stream keyed by place and id" (CLAUDE.md,
// Michael's A on #119; backlog K step 1, the dungeon placement). A gate's floor draws where its barrels, crates and chests
// stand, and where its foes stand, from streams keyed by the gate's seed and the floor; each container's loot is keyed by
// its place and index and the day; each foe is <seed>:<floor>:<index> and rolls its variant, its blows and its slam from
// its own stream. Two machines are stood in for by one gate entered twice with Math.random stirred between: the two builds
// must be the same. On the old code each was Math.random, so two builds differed.
import { boot, check } from './lib/game.mjs';
const g = await boot(); const { page } = g;
await g.intoWorld();

const seeds = await page.evaluate(() => { const out = []; for (let j = 0; j < WORLD.GRID; j++) for (let i = 0; i < WORLD.GRID; i++) { const c = WORLD.getCell(i, j); for (const e of (c && c.doors) || []) if (e && e.seed != null && !e.lair) out.push(e.seed); } return out; });
const pick = [seeds[Math.floor(seeds.length * .25)], seeds[Math.floor(seeds.length * .7)]];
const build = (seed, stir) => page.evaluate(async ([seed, stir]) => { const wait = ms => new Promise(r => setTimeout(r, ms));
  for (let k = 0; k < stir; k++) Math.random();
  const e = WORLD.doorAnywhere(seed); if (!e) return null; const p = makePortalDef(e); const wp = (WORLD.dungeonPos || {})[seed]; if (wp) { p.x = wp.x; p.z = wp.z; px = wp.x; pz = wp.z + 3; } p.zone = 'world';
  goToDungeon(p); for (let k = 0; k < 40 && !(activeZoneId === 'dungeon' && ENEMIES.length); k++) await wait(500); await wait(1500);
  const r2 = v => Math.round(v * 1000) / 1000, names = c => (c.items || []).map(it => it && (it.name + (it.qty > 1 ? '×' + it.qty : ''))).join(',');
  return { seed, name: p.name, theme: p.theme, interior: p.interior, zone: activeZoneId,
    barrels: BARRELS.map(b => [b.floor, r2(b.x), r2(b.z), b.displayName, names(b), b.id]),
    chests: CHESTS.map(c => [c.floor, c.x, c.z, !!c.treasure, !!c.locked, names(c), c.id]),
    foes: ENEMIES.map(f => [f.floor, r2(f.homeX), r2(f.homeZ), f.name, f.variant || '', f.id || null, f.patrolType, r2(f.rangedCd), typeof f.rng === 'function']) }; }, [seed, stir]);
const leave = async () => { await page.evaluate(() => goToOW()); await page.waitForTimeout(4000); await g.hide(); };

const runs = [];
for (const s of pick) { const a = await build(s, 0); await leave(); const b = await build(s, 137); await leave(); runs.push([a, b]); }
for (const [a, b] of runs) console.log(`${a.name} (${a.theme}/${a.interior}, seed ${a.seed}): ${a.barrels.length} barrels and crates, ${a.chests.length} chests, ${a.foes.length} foes; foes ${a.foes.slice(0, 4).map(f => f[3] + '@' + f[1] + ',' + f[2]).join(' ')} | ${b.foes.slice(0, 4).map(f => f[3] + '@' + f[1] + ',' + f[2]).join(' ')}`);
const same = (k) => runs.every(([a, b]) => a && b && a.zone === 'dungeon' && b.zone === 'dungeon' && JSON.stringify(a[k]) === JSON.stringify(b[k]));
check(`both gates were entered twice (${runs.map(([a, b]) => a && b && a.zone + '/' + b.zone).join(', ')})`, runs.every(([a, b]) => a && b && a.zone === 'dungeon' && b.zone === 'dungeon' && a.foes.length > 0), runs.map(([a, b]) => [a && a.zone, b && b.zone]));
check(`the barrels and crates stand in the same places with the same goods (${runs.map(([a]) => a.barrels.length).join(', ')})`, same('barrels') && runs.every(([a]) => a.barrels.length > 0), runs.map(([a, b]) => [a.barrels.slice(0, 3), b.barrels.slice(0, 3)]));
check(`the chests stand in the same places, locked alike, with the same loot (${runs.map(([a]) => a.chests.length).join(', ')})`, same('chests') && runs.every(([a]) => a.chests.length > 0), runs.map(([a, b]) => [a.chests.slice(0, 3), b.chests.slice(0, 3)]));
check(`the foes stand in the same places, of the same kinds and variants, patrolling alike (${runs.map(([a]) => a.foes.length).join(', ')})`, same('foes'), runs.map(([a, b]) => [a.foes.slice(0, 3), b.foes.slice(0, 3)]));
const idsOk = runs.every(([a]) => { const ids = a.foes.map(f => f[5]); return ids.every((id, i) => id === `${a.seed}:${a.foes[i][0]}:${id && id.split(':')[2]}` && a.foes[i][8]) && new Set(ids).size === ids.length; });
check(`every dungeon foe is keyed <seed>:<floor>:<index>, one id each, with a stream (${runs[0][0].foes.slice(0, 3).map(f => f[5]).join(' ')})`, idsOk, runs.map(([a]) => a.foes.map(f => f[5])));

// Session 514 (step 3, ids for what has none): every barrel, crate, shelf, urn, sarcophagus, rack and chest is <seed>:<floor>:<kind>:<n>,
// one id each; the ids are in the arrays above, so the two builds of a gate give the same ids to the same things
const cids = runs.map(([a]) => { const all = a.barrels.map(b => b[5]).concat(a.chests.map(c => c[6]));
  const shaped = all.every(id => typeof id === 'string' && new RegExp(`^${a.seed}:[12]:(barrel|chest|shelf|urn|sarcophagus|rack):\\d+$`).test(id));
  const floorOk = a.barrels.every(b => b[5].split(':')[1] === String(b[0])) && a.chests.every(c => c[6].split(':')[1] === String(c[0]));
  return { n: all.length, unique: new Set(all).size === all.length, shaped, floorOk, kinds: [...new Set(all.map(id => id.split(':')[2]))], sample: all.slice(0, 3) }; });
console.log('container ids', JSON.stringify(cids));
check(`every container in both gates has an id <seed>:<floor>:<kind>:<n>, one each (${cids.map(c => c.n + ' — ' + c.kinds.join('/')).join('; ')})`, cids.every(c => c.n > 0 && c.unique && c.shaped && c.floorOk), cids);

// the lair master's hoard is <seed>:<floor>:hoard and its goods roll on its stream: two masters of one lair, Math.random stirred between, leave the same hoard
const hoard = await page.evaluate(async (seed) => { const wait = ms => new Promise(r => setTimeout(r, ms));
  const e = WORLD.doorAnywhere(seed); const p = makePortalDef(e); const wp = (WORLD.dungeonPos || {})[seed]; if (wp) { p.x = wp.x; p.z = wp.z; px = wp.x; pz = wp.z + 3; } p.zone = 'world';
  goToDungeon(p); for (let k = 0; k < 40 && !(activeZoneId === 'dungeon' && ENEMIES.length); k++) await wait(500); await wait(1500);
  const out = []; if (worldState.masters) delete worldState.masters[p.seed];
  for (const [dragon, stir] of [[false, 0], [false, 91], [true, 0], [true, 53]]) { for (let k = 0; k < stir; k++) Math.random();
    p.lair = { place: 'Test', boss: 'Thing', dragon }; const n0 = CHESTS.length; lairFinish(p); const h = CHESTS[CHESTS.length - 1];
    out.push(CHESTS.length > n0 ? { id: h.id, items: h.items.map(it => it.name + (it.qty > 1 ? '×' + it.qty : '') + (it.value ? ':' + it.value : '')).join(',') } : null); }
  return { seed: p.seed, out }; }, pick[0]);
await leave();
console.log('hoard', JSON.stringify(hoard));
const H = hoard.out;
check(`the master's hoard is keyed <seed>:<floor>:hoard and holds the same goods on two machines (${H[0] && H[0].items} | ${H[1] && H[1].items}; a dragon's ${H[2] && H[2].items})`,
  H.every(Boolean) && /^\d+:[12]:hoard$/.test(H[0].id) && H[0].id.startsWith(hoard.seed + ':') && H[0].items === H[1].items && H[2].items === H[3].items && H[0].items !== H[2].items, hoard);

// a dungeon foe's blow and the master's slam roll from its stream: two foes with one id roll alike, another id its own
const rolls = await page.evaluate(() => { const out = {}; const ex = executeStrike, sr = strikeReaches;
  for (const id of ['77:1:0', '77:1:0', '77:1:1']) { const log = []; executeStrike = (f, raw) => log.push(raw); strikeReaches = () => true;
    const e = keyFoe({ x: px, z: pz - 1, dmgMult: 1, name: 'Skeleton' }, id); const s = [];
    try { for (let k = 0; k < 6; k++) executeDungeonStrike(e, performance.now()); for (let k = 0; k < 4; k++) s.push(slamBlow(e), +slamEvery(e).toFixed(3)); }
    finally { executeStrike = ex; strikeReaches = sr; }
    (out[id] = out[id] || []).push({ blows: log, slam: s }); }
  return out; });
const A = rolls['77:1:0'][0], B = rolls['77:1:0'][1], C = rolls['77:1:1'][0];
console.log('rolls', JSON.stringify(A), JSON.stringify(B), JSON.stringify(C));
check(`a dungeon foe's blows and slam roll alike on two machines (${A.blows.join(' ')} | ${B.blows.join(' ')}), another id its own (${C.blows.join(' ')})`,
  A.blows.length === 6 && JSON.stringify(A) === JSON.stringify(B) && JSON.stringify(A) !== JSON.stringify(C), { A, B, C });

// a keyed foe's corpse rolls its loot on its id and the day: the same Bandit killed on two machines leaves the same goods
const corpses = await page.evaluate(() => { const out = [];
  for (const id of ['300,400:2:0', '300,400:2:0', '300,400:2:1', '300,400:2:2', '300,400:2:3']) {
    const e = keyFoe(unlockFoe(buildZoneEnemy(WORLD.scene, [], px + 3, pz + 3, 'Bandit', null)), id); ZONES.world.enemies.push(e); const n0 = ZONE_CORPSES.length;
    killZoneEnemy(e, WORLD.scene); const c = ZONE_CORPSES.length > n0 ? ZONE_CORPSES[ZONE_CORPSES.length - 1] : null;
    out.push(c ? (c.items || []).map(it => it.name + (it.qty > 1 ? '×' + it.qty : '')).join(',') || '(empty)' : '(no corpse)'); }
  return out; });
console.log('corpses', JSON.stringify(corpses));
check(`a keyed foe's corpse holds the same loot on two machines (${corpses[0]} | ${corpses[1]}); the other ids roll their own (${corpses.slice(2).join(' · ')})`,
  corpses[0] === corpses[1] && !corpses[0].startsWith('(no') && corpses.slice(2).some(c => c !== corpses[0]), corpses);

check('no page errors', g.errs.length === 0, g.errs);
await g.close();
