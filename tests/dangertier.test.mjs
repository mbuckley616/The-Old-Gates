// Enemies by place (Session 1032; Michael's A on DECISION #373): a foe's health and blow grow with the danger tier of where it
// stands, not with your level. Home's coast, Ashen, Bealach and Royale are tier 1; Deepwood, the Foothills and Greywood 2; the
// Wastes 3; a far island's region by its biome (tundra, swamp and wasteland 3, the rest 2). A dungeon is its door's tier, plus
// one a floor below the first, to 4. A tier is worth the old level curve at levels 1, 6, 11 and 16 (health ×1, 1.75, 2.5, 3; the
// blow as the reference blow there), and the rare variants' chance reads that level too. Since S1034 a wraith's orb and its
// drain, and a ship's volley, read the foe's tier's level too.
import { boot, check } from './lib/game.mjs';
const g = await boot(); const { page } = g;
await g.intoWorld();

const t = await page.evaluate(() => {
  const home = getCell(HOME_I, HOME_J).regions, at = id => home.find(r => r.id === id);
  const homeTiers = {}; for (const r of home) homeTiers[r.id] = worldTierAt(r.x, r.z);
  // far regions at their own centres, one of each biome found
  const far = {};
  for (let j = 0; j < GRID; j++) for (let i = 0; i < GRID; i++) { if (i === HOME_I && j === HOME_J) continue; const c = getCell(i, j);
    for (const r of (c.regions || [])) if (!(r.biome in far)) { const tr = worldTierAt(r.x, r.z); far[r.biome] = { tier: tr, own: regionTier(r) }; } }
  const scales = [1, 2, 3, 4].map(k => ({ tier: k, hp: +enemyHpScale(k).toFixed(3), dmg: +enemyDmgScale(k).toFixed(3), want: +(blowRef([1, 6, 11, 16][k - 1]) / blowRef(1)).toFixed(3) }));
  // a foe at the Wastes' centre, built at level 1 and at level 20: the same numbers
  const W = at('wastes'), D = at('deepwood'), C = at('coastal'), L0 = level;
  const build = (r, lv) => { level = lv; const grp = new THREE.Group(); const e = buildZoneEnemy(grp, [], r.x, r.z, 'Wolf', null); return { tier: e.tier, hp: e.maxHp, dmg: e.dmg }; };
  const wolf = { coast1: build(C, 1), coast20: build(C, 20), wastes1: build(W, 1), wastes20: build(W, 20), deep1: build(D, 1) };
  const base = ZONE_FOE_DEF.Wolf;
  // the variants' chance: a Greater Bandit (minLevel 5) is never rolled in a tier-1 place at any level, and is in a tier-3 one
  let v1 = 0, v3 = 0; for (let i = 0; i < 400; i++) { const id = 'dt:' + i;
    if (pickVariant('Bandit', tierLevel(worldTierAt(C.x, C.z)), 'normal', seededRng('variant', id))) v1++;
    if (pickVariant('Bandit', tierLevel(worldTierAt(W.x, W.z)), 'normal', seededRng('variant', id))) v3++; }
  const dun = { wastes1: dungeonTier({ zone: 'world', x: W.x, z: W.z }, 1), wastes2: dungeonTier({ zone: 'world', x: W.x, z: W.z }, 2), wastes3: dungeonTier({ zone: 'world', x: W.x, z: W.z }, 3),
    deep2: dungeonTier({ zone: 'world', x: D.x, z: D.z }, 2), coast1: dungeonTier({ zone: 'world', x: C.x, z: C.z }, 1), tut: dungeonTier({ tutorial: true, zone: 'world', x: W.x, z: W.z }, 2),
    legacy: dungeonTier({ zone: 'overworld', x: 72, z: 8 }, 1)};
  level = L0;
  return { homeTiers, far, scales, wolf, base: { hp: base.maxHp, dmg: base.dmg }, v1, v3, dun, W: { x: W.x, z: W.z } };
});
console.log(JSON.stringify(t));
const H = t.homeTiers;
check('home\'s regions: the coast, Ashen, Bealach and Royale tier 1; Deepwood, the Foothills and Greywood 2; the Wastes 3',
  H.coastal === 1 && H.ashen === 1 && H.bealach === 1 && H.royale === 1 && H.deepwood === 2 && H.foothills === 2 && H.greywood === 2 && H.wastes === 3, H);
check('a far island\'s region by its biome: tundra, swamp and wasteland 3, the rest 2', Object.entries(t.far).every(([b, r]) => r.own === (['tundra', 'swamp', 'wasteland'].includes(b) ? 3 : 2)) && Object.keys(t.far).length >= 5, t.far);
check('far regions read their own tier at their centre', Object.values(t.far).every(r => r.tier === r.own), t.far);
check('a tier is the old curve at levels 1, 6, 11 and 16: health ×1, 1.75, 2.5, 3, the blow as the reference blow there',
  t.scales.map(s => s.hp).join() === '1,1.75,2.5,3' && t.scales.every(s => s.dmg === s.want) && t.scales[0].dmg === 1 && t.scales[3].dmg > t.scales[2].dmg, t.scales);
const w = t.wolf;
check('a wolf on the coast is the same at level 1 and level 20, the kind\'s own numbers (tier 1)', w.coast1.tier === 1 && w.coast1.hp === t.base.hp && w.coast1.dmg === t.base.dmg && JSON.stringify(w.coast1) === JSON.stringify(w.coast20), w);
check('a wolf in the Wastes is tier 3 at any level: health ×2.5', w.wastes1.tier === 3 && w.wastes1.hp === Math.round(t.base.hp * 2.5) && JSON.stringify(w.wastes1) === JSON.stringify(w.wastes20), w);
check('a wolf in the Deepwood is tier 2: health ×1.75', w.deep1.tier === 2 && w.deep1.hp === Math.round(t.base.hp * 1.75), w);
check('the rare variants\' chance reads the place: none on the coast, some in the Wastes', t.v1 === 0 && t.v3 > 20, { coast: t.v1, wastes: t.v3 });
const d = t.dun;
check('a dungeon is its door\'s tier, one more a floor below, to 4; the tutorial\'s crypt is 1; a legacy zone\'s door its zone\'s',
  d.wastes1 === 3 && d.wastes2 === 4 && d.wastes3 === 4 && d.deep2 === 3 && d.coast1 === 1 && d.tut === 1 && d.legacy === 1, d);

// end to end: a gate at the Wastes' centre, entered at level 10 and at level 20 (past every kind's minLevel, so the roster is the same)
async function enter(lv) {
  await page.evaluate(([lv, W]) => { level = lv;
    const p = Object.assign({}, PORTALS.find(q => q.zone === 'world' && !q.lair) || PORTALS[0], { x: W.x, z: W.z, seed: 7311, size: 'medium', theme: 'undead', zone: 'world', tutorial: false, diff: 'normal', diffScale: DIFF_SCALE.normal, lair: null });
    goToDungeon(p); }, [lv, t.W]);
  for (let i = 0; i < 60; i++) { await page.waitForTimeout(400); if (await page.evaluate(() => activeZoneId === 'dungeon' && ENEMIES.length > 0)) break; }
  await g.frames(4);
  const r = await page.evaluate(() => ENEMIES.map(e => ({ n: e.name, f: e.floor || 1, t: e.tier, hp: e.maxHp, m: +(e.dmgMult || 0).toFixed(3) })));
  // S1034 — a phantom's or wraith's orb on the first floor: 8–14 plus its tier's level × 1.5, not yours
  const orb = await page.evaluate(() => { const e = ENEMIES.find(q => q.ranged && (q.floor || 1) === 1 && !q.dead); if (!e) return null;
    currentFloor = 1; px = e.x + 4; pz = e.z; e.alert = true; e.rangedCd = 0; BALLS.filter(b => b.userData.isEnemyOrb).forEach(b => b.userData._old = true); return { name: e.name, tier: e.tier }; });
  if (orb) { for (let k = 0; k < 40 && !(await page.evaluate(() => BALLS.some(b => b.userData.isEnemyOrb && !b.userData._old))); k++) await g.frames(1); /* the dungeon's foes tick in the game's own loop (g.spin ticks the open world only) */
    orb.dmg = await page.evaluate(() => { const b = BALLS.find(b => b.userData.isEnemyOrb && !b.userData._old); return b ? b.userData.dmg : null; }); }
  r.orb = orb;
  await page.evaluate(() => { goToOW(); });
  for (let i = 0; i < 40; i++) { await page.waitForTimeout(400); if (await page.evaluate(() => activeZoneId !== 'dungeon')) break; }
  await g.frames(4);
  return r;
}
const a = await enter(10), b = await enter(20);
const oa = a.orb, ob = b.orb; delete a.orb; delete b.orb;
console.log(JSON.stringify({ a, b, oa, ob }));
check('a ranged foe\'s orb in the Wastes\' gate is 8–14 plus its tier\'s level (11) × 1.5, at level 10 and at level 20 (S1034)',
  !!oa && !!ob && oa.tier === 3 && [oa.dmg, ob.dmg].every(d => d >= 24 && d <= 30), { oa, ob });
check('the Wastes\' gate: its foes are tier 3 on the first floor and 4 below', a.length > 0 && a.every(e => e.t === (e.f > 1 ? 4 : 3)), a);
check('the same gate at level 20 holds the same foes with the same health and blows as at level 10', a.length === b.length && JSON.stringify(a) === JSON.stringify(b), { a, b });
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
