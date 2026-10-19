// The loot follows the place (Session 1073; Michael's A on DECISION #394, the enemies-by-place sheet's `tierloot`): a roll's
// material cap reads the danger tier's level where it is rolled (1, 6, 11, 16), never yours. 2,000 seeded chest rolls at each tier,
// at level 1 and at level 30, give the same goods (and since Session 1135 the same gold piles, `goldtier`), topped by Bronze, Steel, Adamant and Draconic; a corpse rolls on its foe's tier;
// a roll with no tier reads where you stand; a dungeon's floor-2 chest is a tier above its first.
import { boot, check } from './lib/game.mjs';
const g = await boot(); const { page } = g;
await g.intoWorld();
const r = await page.evaluate(() => {
  const L0 = level, out = {};
  const mat = it => it && it.type === 'equip' && it.tier ? it.tier : 0;
  const roll = (t, lv) => { level = lv; let top = 0, n = 0; const sig = [];
    for (let i = 0; i < 2000; i++) { const items = rollContainerLoot('chest', 1, null, 1, 'tierloot:' + i, t);
      for (const it of items) { const m = mat(it); if (m) { n++; top = Math.max(top, m); } sig.push(it.name + '|' + (it.type === 'gold' ? 'g' : (it.enchant && it.enchant.id) || '')); } }
    return { top, n, sig: sig.join(';').length + ':' + sig.slice(0, 40).join(';') }; };
  out.tiers = [1, 2, 3, 4].map(t => [roll(t, 1), roll(t, 30)]);
  // a corpse: the foe's own tier rides on rollContainerLoot's last argument
  const corpse = (t, lv) => { level = lv; let top = 0; for (let i = 0; i < 2000; i++) for (const it of rollContainerLoot('corpse', null, null, 1, 'tlc:' + i, t)) top = Math.max(top, mat(it)); return top; };
  out.corpse = [corpse(1, 30), corpse(3, 1)];
  // no tier given: where you stand. Home's coast is tier 1 at level 30
  level = 30; LOOT_TIER = null; out.here = { tier: tierHere(), lv: lootLevel() };
  let top = 0; for (let i = 0; i < 2000; i++) top = Math.max(top, mat(withLootRng(seededRng('loot', 'tlh:' + i), () => rollLoot({ hp: 1 }, null, 'chest'))));
  out.here.top = top;
  // the world's foes carry their tier for their corpse
  const home = getCell(HOME_I, HOME_J).regions, W = home.find(q => q.id === 'wastes');
  if (W) { const c0 = Math.floor(W.x / CHUNK), d0 = Math.floor(W.z / CHUNK); const tiers = [];
    for (let cx = c0 - 1; cx <= c0 + 1; cx++) for (let cz = d0 - 1; cz <= d0 + 1; cz++) { const ch = { cx, cz, enemies: [] }; spawnChunkEncounters(ch); for (const e of ch.enemies) tiers.push(e.tier); despawnChunkEncounters(ch); }
    out.wastesFoes = tiers; }
  level = L0; return out; });
const names = ['Bronze', 'Steel', 'Adamant', 'Draconic'];
console.log(JSON.stringify({ tiers: r.tiers.map(([a, b]) => [a.top, a.n, b.top, b.n]), corpse: r.corpse, here: r.here, wastesFoes: r.wastesFoes && r.wastesFoes.slice(0, 8) }));
[2, 4, 6, 8].forEach((cap, i) => {
  const [a, b] = r.tiers[i];
  check(`tier ${i + 1}: 2,000 chests at level 1 and at level 30 hold the same goods (the gold's count follows the place too since S1135, goldtier)`, a.sig === b.sig && a.n === b.n && a.n > 300, { a: a.sig.slice(0, 200), b: b.sig.slice(0, 200) });
  check(`tier ${i + 1}: the best metal is ${names[i]} (${cap})`, a.top === cap, a.top);
});
check('a tier-1 corpse at level 30 tops out at Bronze; a tier-3 corpse at level 1 reaches Adamant', r.corpse[0] === 2 && r.corpse[1] === 6, r.corpse);
check(`a roll with no tier reads where you stand: home is tier 1, level 1's cap, at level 30 (best ${r.here.top})`, r.here.tier === 1 && r.here.lv === 1 && r.here.top === 2, r.here);
check('the Wastes\' foes carry their tier 3 for their corpses', !!r.wastesFoes && r.wastesFoes.length > 0 && r.wastesFoes.every(t => t === 3), r.wastesFoes);
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
