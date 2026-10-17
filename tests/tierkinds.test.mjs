// Enemies by place, the kinds and the packs (Session 1059; the designer's sheet on Michael's A on #373). No foe is latent any more:
// a kind's least tier comes from its old minLevel (1–3 tier 1, 4–6 tier 2, 7 and up tier 3), and a spawn table is filtered by it
// before the pick. A pack's +1 and its Bandit Captain come at tier 2 and up, not past your levels 6 and 5. The same chunks spawned
// at level 1 and level 30 give the same foes.
import { boot, check } from './lib/game.mjs';
const g = await boot(); const { page } = g;
await g.intoWorld();
const r = await page.evaluate(() => {
  const home = getCell(HOME_I, HOME_J).regions, L0 = level, out = {};
  const sample = (reg, lv) => { level = lv; const rows = [];
    const c0 = Math.floor((reg.x - reg.r * .6) / CHUNK), c1 = Math.floor((reg.x + reg.r * .6) / CHUNK), d0 = Math.floor((reg.z - reg.r * .6) / CHUNK), d1 = Math.floor((reg.z + reg.r * .6) / CHUNK);
    for (let cx = c0; cx <= c1; cx++) for (let cz = d0; cz <= d1; cz++) { const ch = { cx, cz, enemies: [] }; spawnChunkEncounters(ch);
      for (const e of ch.enemies) rows.push({ k: chunkKey(cx, cz), n: e.baseName || e.name, t: e.tier, locked: !!e.locked, shown: !!(e.mesh && e.mesh.visible), hp: e.maxHp, v: e.variant || null });
      despawnChunkEncounters(ch); }
    return rows; };
  const night = () => { forceTime(23); }; night();
  for (const id of ['coastal', 'ashen', 'deepwood', 'foothills', 'wastes']) { const reg = home.find(q => q.id === id); if (!reg) continue;
    const a = sample(reg, 1), b = sample(reg, 30);
    out[id] = { n: a.length, tiers: [...new Set(a.map(x => x.t))], kinds: [...new Set(a.map(x => x.n))], kinds3: [...new Set(a.filter(x => x.t === 3).map(x => x.n))], same: JSON.stringify(a) === JSON.stringify(b),
      latent: a.concat(b).filter(x => x.locked || !x.shown).length, captains: a.filter(x => x.n === 'Bandit Captain').length,
      over: a.filter(x => !kindAllowed(x.n, x.t) && x.n !== 'Bandit Captain').map(x => x.n) }; }
  level = L0;
  const mt = {}; for (const k in ZONE_FOE_DEF) mt[k] = minTierOf(ZONE_FOE_DEF[k].minLevel);
  return { out, mt }; });
console.log(JSON.stringify(r.out));
const O = r.out;
check('a kind\'s least tier is its old minLevel\'s: Wolf and Skeleton 1, Cultist, Dire Wolf and Ogre 2, Ash Wight 3, Dragon 3',
  r.mt.Wolf === 1 && r.mt.Skeleton === 1 && r.mt.Cultist === 2 && r.mt['Dire Wolf'] === 2 && r.mt.Ogre === 2 && r.mt['Ash Wight'] === 3 && r.mt.Dragon === 3, r.mt);
check('chunks were spawned in five of home\'s regions, at night', Object.keys(O).length === 5 && Object.values(O).every(o => o.n > 0), Object.fromEntries(Object.entries(O).map(([k, o]) => [k, o.n])));
check('no foe is latent or hidden, at level 1 or 30', Object.values(O).every(o => o.latent === 0), Object.fromEntries(Object.entries(O).map(([k, o]) => [k, o.latent])));
check('no kind stands where its least tier is above the place\'s', Object.values(O).every(o => o.over.length === 0), Object.fromEntries(Object.entries(O).map(([k, o]) => [k, o.over])));
check('a Bandit Captain leads no pack on tier 1 (the coast and Ashen)', O.coastal.captains === 0 && O.ashen.captains === 0, { coast: O.coastal.captains, ashen: O.ashen.captains });
check('the Wastes\' tier-3 chunks hold their own at level 1: Ash Wights, Hollowed or Ash Hounds (their least tiers 3 and 2)', O.wastes.kinds3.some(k => k === 'Ash Wight' || k === 'Hollowed' || k === 'Ash Hound'), O.wastes);
check('every region spawns the same foes at level 30 as at level 1: kinds, counts, Captains, variants and health', Object.values(O).every(o => o.same), Object.fromEntries(Object.entries(O).map(([k, o]) => [k, o.same])));
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
