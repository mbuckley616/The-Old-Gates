// A lair's Hoard and a camp's Takings keep what you leave in them (Session 700). A site's chest was rolled again each time its
// site was built, so walking out of range and back gave the same full chest on the same day, and a new one the next. Once you
// take from it, its items are kept in `worldState.siteChests[site]` (the world row), and a rebuild, a turned day or a load
// gives back what is left.
import { boot, check } from './lib/game.mjs';
const g = await boot(); const { page } = g;
await g.intoWorld();
const site = await page.evaluate(() => { const [hi, hj] = WORLD.cellOf(px, pz); const ring = []; for (let i = hi - 3; i <= hi + 3; i++) for (let j = hj - 3; j <= hj + 3; j++) { const c = WORLD.getCell(i, j); if (c && c.sites) ring.push(...c.sites.map(t => [t, i, j])); }
  ring.sort((a, b) => Math.hypot(a[0].x - px, a[0].z - pz) - Math.hypot(b[0].x - px, b[0].z - pz));
  const out = {}; for (const kind of ['lair', 'bcamp']) { const f = ring.find(([t]) => t.kind === kind && t.pad > 0 && !t.dragon); if (f) { WORLD.loadCell(f[1], f[2]); out[kind] = (WORLD.SITE[f[0].id] || f[0]).id; } } return out; });
check('a lair and a bandit camp near the start', !!site.lair && !!site.bcamp, site);
const chestOf = (id) => page.evaluate((id) => { let S = WORLD.settlements.get(id); if (!S) S = WORLD.genSettlement(WORLD.SITE[id]); const c = S.chest; return c ? { name: c.displayName, items: c.items.map(i => i.name + (i.qty > 1 ? '×' + i.qty : '')), opened: c.opened } : null; }, id);
const rebuild = (id, days) => page.evaluate(([id, days]) => { disposeSettlement(id); worldState.gameTimeAbsMinutes = (worldState.gameTimeAbsMinutes || 0) + 1440 * (days || 0); }, [id, days]);
const take = (id) => page.evaluate((id) => { const S = WORLD.settlements.get(id); currentLootContainer = S.chest; takeLootItem(0); currentLootContainer = null; return S.chest.items.length; }, id);
for (const kind of ['lair', 'bcamp']) {
  const id = site[kind];
  const a = await chestOf(id);
  await rebuild(id, 0); const a2 = await chestOf(id);
  check(`${kind}: untouched, the same day's chest is the same roll (${a.name}, ${a.items.length})`, a && JSON.stringify(a.items) === JSON.stringify(a2.items), { a, a2 });
  const left = await take(id);
  await rebuild(id, 0); const b = await chestOf(id);
  check(`${kind}: one thing taken, the rebuilt chest holds the rest, not a full one`, b.items.length === left && b.items.length === a.items.length - 1 && JSON.stringify(b.items) === JSON.stringify(a.items.slice(1)), { a: a.items, b: b.items });
  await rebuild(id, 3); const c = await chestOf(id);
  check(`${kind}: three days on, still the rest`, JSON.stringify(c.items) === JSON.stringify(b.items), { b: b.items, c: c.items });
}
// through a real save and load
const id = site.bcamp;
await page.evaluate((id) => { const t = WORLD.SITE[id]; px = t.x + 40; pz = t.z + 40; }, id);
await page.evaluate(async () => { await saveToSlot(0); });
const before = await chestOf(id);
await page.evaluate((id) => { const S = WORLD.settlements.get(id); currentLootContainer = S.chest; while (S.chest.items.length) takeLootItem(0); currentLootContainer = null; }, id);
await page.evaluate(() => reloadActiveSlot()); await page.waitForTimeout(4000);
await page.evaluate((id) => { const t = WORLD.SITE[id]; px = t.x + 40; pz = t.z + 40; }, id);
let d = null; for (let i = 0; i < 30; i++) { await g.spin(null, 20); d = await page.evaluate((id) => { const S = WORLD.settlements.get(id); return S && S.chest ? S.chest.items.map(i => i.name + (i.qty > 1 ? '×' + i.qty : '')) : null; }, id); if (d) break; }
check('emptied after a save, then loaded: the chest holds what it held at the save', before.items.length > 0 && JSON.stringify(d) === JSON.stringify(before.items), { before: before.items, d });
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
