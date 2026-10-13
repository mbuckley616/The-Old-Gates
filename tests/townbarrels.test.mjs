// Session 753 — twice the barrels and crates in a town (Michael's A on #245, his playtest note of 6 Oct): a city 20, a town 14,
// a village 8, a hamlet 4, everyday goods as before, each rolled on its own key <site>:barrel:<n>:<day>. The first half are
// placed on the town's stream exactly as before; the second half draw from their own stream (seededRng(site,'barrels2')), so
// every draw after the barrels (villagers, guards, names) is unchanged. The second half also keeps out of the town's own
// buildings, which the first half's check never saw (SETTLE does not hold a town while it is built): Portclare's crate 0 stands
// in the chapel's corner, as it did before; moving it would move every draw after it. PROBE=1 prints each town's people for a before/after diff.
// Session 817 (the critic's s597): a first-half spot inside the town's own buildings now steps out to the nearest clear spot
// without a draw (Droichead's 2 and 3 stood in the church and the inn, Portclare's 0 in the chapel), so no barrel of either
// half is inside a building, and the people of every town below stand where they stood (their names and roles in order, hashed: a draw that moved would change a name; their places are not hashed, as they walk).
import { boot, check } from './lib/game.mjs';
const g = await boot(); const { page } = g;
await g.intoWorld();
const WANT = { city: 20, town: 14, village: 8, hamlet: 4, port: 4 };
const PEOPLE = { droichead: 2093859367, portclare: -1437886261, dunmore: -478191395, carraig_mor: 564943362, coeur_de_vie: -374348034 }; // HEAD before S817, names and roles
for (const id of ['dunmore', 'carraig_mor', 'coeur_de_vie', 'portclare', 'droichead']) {
  await g.settle(id);
  const r = await page.evaluate((id) => { const S = WORLD.settle.get(id); const L = S.loot || [];
    const close = []; for (let i = 0; i < L.length; i++) for (let j = i + 1; j < L.length; j++) { const d = Math.hypot(L[i].x - L[j].x, L[i].z - L[j].z); if (d < .9) close.push([i, j, +d.toFixed(2)]); }
    const houseIn = L.map((c, i) => [c, i]).filter(([c]) => (S.sol || []).some(b => b !== S.sol[S.sol.length] && b.bt && Math.abs((c.x - b.cx) * (b.c == null ? 1 : b.c) - (c.z - b.cz) * (b.s || 0)) < b.rx && Math.abs((c.x - b.cx) * (b.s || 0) + (c.z - b.cz) * (b.c == null ? 1 : b.c)) < b.rz)).map(([c, i]) => i);
    // the town's drawn people only: a resident steps out of her house when you come within 70, two a tick, so how many
    // have appeared by the time this reads depends on the machine's speed (CI's slower runner saw two more in Dunmore)
    const drawn = S.npcs.filter(n => n.sched?.type !== 'resident');
    return { kind: S.site.kind, n: L.length, ids: L.map(c => c.id), shaped: L.every((c, i) => c.id === id + ':barrel:' + i),
      filled: L.filter(c => c.items.length > 0).length, arms: L.filter(c => c.items.some(it => it.dmg != null || it.def != null || it.slot || it.type === 'weapon' || it.type === 'armor')).length,
      kinds: L.reduce((a, c) => (a[c.kind] = (a[c.kind] || 0) + 1, a), {}), close, houseIn,
      people: drawn.map(n => n.def.name + '|' + (n.def.role || '') + '|' + (n.def.x ?? 0).toFixed(2) + ',' + (n.def.z ?? 0).toFixed(2)),
      ph: drawn.reduce((h, n) => { for (const ch of n.def.name + '|' + (n.def.role || '') + ';') h = (h * 31 + ch.charCodeAt(0)) | 0; return h; }, 0) }; }, id);
  if (process.env.PROBE) { console.log('PROBE', id, r.kind, r.n, JSON.stringify(r.people)); continue; }
  const want = WANT[r.kind];
  check(`${id} (${r.kind}): ${r.n} barrels and crates, twice the old ${want / 2} (${JSON.stringify(r.kinds)})`, r.n === want, r);
  check(`${id}: ids ${id}:barrel:0 to :${r.n - 1}, one each`, r.shaped && new Set(r.ids).size === r.n, r.ids);
  check(`${id}: every one holds something (${r.filled}/${r.n}), none arms or armour (${r.arms})`, r.filled === r.n && r.arms === 0, r);
  const newIn = r.houseIn.filter(i => i >= want / 2), oldIn = r.houseIn.filter(i => i < want / 2);
  check(`${id}: none within .9 of another (${r.close.length}); none inside a building, of the new half (${newIn.length}) or the old (${oldIn.length})`, r.close.length === 0 && newIn.length === 0 && oldIn.length === 0, r);
  check(`${id}: its people are the people drawn before the old half could step out of a wall (names and roles, hash ${r.ph})`, r.ph === PEOPLE[id], r.ph);
}
// the second half's loot is keyed like the first's: the key rolls the same again
const k = await page.evaluate(() => { const S = WORLD.settle.get('dunmore'); const c = S.loot[S.loot.length - 1]; const day = lootDay();
  const again = (rollContainerLoot('barrel', 1, null, .9, c.id + ':' + day) || []).filter(it => it && it.dmg == null && it.def == null && !it.slot && it.type !== 'weapon' && it.type !== 'armor');
  return { id: c.id, same: !again.length || JSON.stringify(again.map(i => i.name)) === JSON.stringify(c.items.map(i => i.name)) }; });
if (!process.env.PROBE) check(`the last barrel (${k.id}) rolls the same goods again on its key`, k.same, k);
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
