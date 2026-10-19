// Gold piles follow the place (Session 1135; Michael's A on DECISION #431): `rollGold`'s level term reads the danger tier's level
// where the pile is rolled (1, 6, 11, 16), as the metal does since Session 1073, never yours. A chest holds 4–12 + the tier's level,
// a treasure chest 8–18 + 1.5×, a body 2–8 + 0.7×, a barrel 1–6 + half. Fortune's 1% a point and the gold-find buff stay.
import { boot, check } from './lib/game.mjs';
const g = await boot(); const { page } = g;
await g.intoWorld();
const r = await page.evaluate(() => {
  const L0 = level, F0 = ATTRS.fortune; ATTRS.fortune = 0;
  const span = (kind, t, lv) => { level = lv; let lo = 1e9, hi = -1;
    for (let i = 0; i < 600; i++) { const v = withLootTier(t, () => withLootRng(seededRng('goldtier', kind + ':' + i), () => rollGold(kind))); lo = Math.min(lo, v); hi = Math.max(hi, v); }
    return [lo, hi]; };
  const out = {};
  for (const kind of ['chest', 'treasure', 'corpse', 'barrel']) out[kind] = [1, 2, 3, 4].map(t => [span(kind, t, 1), span(kind, t, 30)]);
  // the same seeded pile at level 1 and level 30 through a whole container roll
  const pile = lv => { level = lv; const v = []; for (let i = 0; i < 400; i++) for (const it of rollContainerLoot('chest', 1, null, 1, 'goldtier:c' + i, 3)) if (it.type === 'gold') v.push(it.value); return v.join(','); };
  out.same = [pile(1), pile(30)];
  // no tier given: where you stand (home's coast, tier 1) at level 25
  level = 25; LOOT_TIER = null; out.here = span('chest', null, 25);
  // Fortune still counts
  ATTRS.fortune = 10; out.fort = span('chest', 1, 1); ATTRS.fortune = F0; level = L0;
  return out; });
console.log(JSON.stringify(r.chest), JSON.stringify(r.here));
const LV = [1, 6, 11, 16], K = { chest: [4, 12, 1], treasure: [8, 18, 1.5], corpse: [2, 8, 0.7], barrel: [1, 6, 0.5] };
for (const kind of Object.keys(K)) {
  const [mn, mx, b] = K[kind];
  const want = LV.map(l => [mn + Math.floor(l * b), mx + Math.floor(l * b)]);
  check(`a ${kind}'s pile at tiers 1–4 spans ${want.map(w => w.join('–')).join(', ')}, the same at level 1 and level 30`,
    r[kind].every(([a, c], i) => a[0] === want[i][0] && a[1] === want[i][1] && c[0] === a[0] && c[1] === a[1]), r[kind]);
}
check('a tier-3 chest\'s piles from one seed are the same at level 1 and level 30', r.same[0].length > 0 && r.same[0] === r.same[1], r.same.map(s => s.slice(0, 80)));
check('with no tier set, a chest at home (tier 1) holds 5 to 13 at level 25 (was 29 to 37)', r.here[0] === 5 && r.here[1] === 13, r.here);
check('ten points of Fortune still add a tenth: 6 to 14 at a tier-1 chest', r.fort[0] === Math.round(5 * 1.1) && r.fort[1] === Math.round(13 * 1.1), r.fort);
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
