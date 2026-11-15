// The road's people (Session 2268; Michael's B on #1587, docs/design/the-road-between-towns.md). Each road between two settlements sends
// its day's travellers from its key and the day: 2 + both ends' prosperity ÷ 50, 2 to 6 (halved on a broken route), each with an hour,
// an end and a kind. Where one is comes from the clock and the pace. Within 400 m the nearest four are drawn; the merchant (session 1)
// walks at 1.1 m a game minute with his mule and sells 6 to 10 rows of a goods shop's stock at his home town's prices ×1.1.
import { boot, check } from './lib/game.mjs';
const g = await boot(); const { page } = g;
await g.intoWorld();
const stop = g.keepAlive();
const r = await page.evaluate(() => {
  const rds = ROADS.filter(roadfolkRoad); const day = Math.floor((worldState.gameTimeAbsMinutes||0)/1440);
  const rolls = rds.map(rd => ({ key: routeKey(rd.def.a, rd.def.b), len: Math.round(roadLenOf(rd)), list: roadTravellers(rd, day + 3) }));
  _roadDays.clear(); const again = rds.map(rd => JSON.stringify(roadTravellers(rd, day + 3)));
  const kinds = {}; rolls.forEach(o => o.list.forEach(T => kinds[T.kind] = (kinds[T.kind] || 0) + 1));
  return { n: rds.length, counts: rolls.map(o => o.list.length), same: rolls.every((o, i) => JSON.stringify(o.list) === again[i]), kinds, lens: rolls.map(o => o.len), ex: rolls[0] };
});
console.log(JSON.stringify(r).slice(0, 1500));
check('roads with travellers', r.n > 0, r.n);
check('2 to 6 departures a road (the families aside)', r.counts.every(c => c >= 1 && c <= 6), r.counts);
check('the roll is the same read twice', r.same);
// put you beside a merchant
const m = await page.evaluate(() => {
  const now = worldState.gameTimeAbsMinutes||0, day = Math.floor(now/1440);
  for (let dd = day; dd < day + 30; dd++) for (const rd of ROADS.filter(roadfolkRoad)) for (const T of roadTravellers(rd, dd)) {
    if (T.kind !== 'merchant') continue; const t = T.at + 600; const p0 = travellerAt(T, rd, t); if (!p0) continue;
    worldState.gameTimeAbsMinutes = t; worldState.gameTimeMinutes = t % 1440;
    px = p0.x + 6; pz = p0.z; return { id: T.id, x: p0.x, z: p0.z, d: p0.d, len: roadLenOf(rd) };
  }
  return null; });
console.log(JSON.stringify(m));
check('a merchant found', !!m);
await g.cells();
await g.spin(null, 10);
const s1 = await page.evaluate((id) => { const D = ROADWALK.get(id); if (!D) return { drawn: [...ROADWALK.keys()] }; return { name: D.npc.def.name, x: D.npc.g.position.x, z: D.npc.g.position.z, t: worldState.gameTimeAbsMinutes, beast: D.beast.children.length, topics: D.npc.def.topics.map(t => t.label) }; }, m.id);
console.log(JSON.stringify(s1));
check('he is drawn', !!s1.name);
await g.spin(null, 600);
const s2 = await page.evaluate((id) => { const D = ROADWALK.get(id); return D ? { x: D.npc.g.position.x, z: D.npc.g.position.z, t: worldState.gameTimeAbsMinutes } : null; }, m.id);
const moved = Math.hypot(s2.x - s1.x, s2.z - s1.z), dt = s2.t - s1.t;
console.log('moved', moved.toFixed(2), 'in', dt.toFixed(2), 'min', (moved / dt).toFixed(3));
check('he walks 1.1 m a game minute', Math.abs(moved / dt - 1.1) < 0.1, moved / dt);
const shop = await page.evaluate((id) => { const D = ROADWALK.get(id); const t = D.npc.def.topics.find(t => t.trade); if (!t) return { labels: D.npc.def.topics.map(t => t.label) }; t.fn(t); const H = currentHouse; openShop(); const rows = document.querySelectorAll('#sh-stock .sh-row').length;
  const it = H.pack[0]; const cost = shopCost(it); const home = WORLD.priceMulAt(H.siteId); const out = { rows, title: document.getElementById('sh-title').textContent, cost, base: it.buyPrice, home, want: Math.max(1, Math.round(it.buyPrice * home * 1.1 * (1 - barterPct()))) };
  closeShop(); out.after = currentHouse; return out; }, m.id);
console.log(JSON.stringify(shop));
check('6 to 10 rows', shop.rows >= 6 && shop.rows <= 10, shop.rows);
check('home prices ×1.1', shop.cost === shop.want, shop);
// far away: gone
await page.evaluate(() => { px += 900; });
await g.spin(null, 5);
const gone = await page.evaluate((id) => ({ has: ROADWALK.has(id), d: [...ROADWALK.values()].map(D => Math.round(Math.hypot(D.npc.g.position.x - px, D.npc.g.position.z - pz))), npcs: npcs.length }), m.id);
console.log(JSON.stringify(gone));
check('dropped past 400 m', !gone.has && gone.d.every(d => d < 400), gone);
stop(); await g.close();
