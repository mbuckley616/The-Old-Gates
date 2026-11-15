// The road's people (Session 2268; Michael's B on #1587, docs/design/the-road-between-towns.md). Each road between two settlements sends
// its day's travellers from its key and the day: 2 + both ends' prosperity ÷ 50, 2 to 6 (halved on a broken route), each with an hour,
// an end and a kind. Where one is comes from the clock and the pace. Within 400 m the nearest four are drawn; the merchant (session 1)
// walks at 1.1 m a game minute with his mule and sells 6 to 10 rows of a goods shop's stock at his home town's prices ×1.1.
// Session 2270: a pilgrim leaves the road for a shrine or lesser gate within 1,500 m and pencils it on your map when asked; mourners say nothing.
// Session 2269: by a live camp the road's ambush odds fall on him by his id while you are within 150 m; saved, ×0.8 and +1 favour; left, robbed.
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

// S2269 — the merchant's ambush near a live camp: find one, stand by him as he reaches its point
const findAmb = () => page.evaluate((skip) => {
  const now = worldState.gameTimeAbsMinutes || 0, day = Math.floor(now / 1440);
  for (let dd = day + 1; dd < day + 60; dd++) for (const rd of ROADS.filter(roadfolkRoad)) for (const T of roadTravellers(rd, dd)) {
    if (skip.includes(T.id)) continue; const A = merchantAmbush(T, rd); if (!A) continue; const L = roadLenOf(rd), at = A.f * L;
    const t = T.at + (at + 5) / T.pace; worldState.gameTimeAbsMinutes = t; worldState.gameTimeMinutes = t % 1440;
    const p = travellerAt(T, rd, t); px = p.x + 8; pz = p.z; const home = roadfolkHome(T, rd);
    return { id: T.id, A, odds: roadAmbushOdds(rd), camp: roadCamp(rd).id, favor0: (worldState.favor || {})[home.id] || 0, home: home.id };
  }
  return null; }, skipped);
const skipped = [];
const amb = await findAmb();
console.log(JSON.stringify(amb));
check('a merchant on a road by a live camp draws an ambush by his id', !!amb && amb.A.n >= 3 && amb.A.f >= .35 && amb.A.f <= .65, amb);
skipped.push(amb.id);
await g.cells(); await g.spin(null, 4);
const sp = await page.evaluate((id) => { const D = ROADWALK.get(id); const E = ZONES.world.enemies.filter(e => e._roadfolk === id && !e.dead);
  return { drawn: !!D, attack: !!(D && D.attack), bandits: E.length, kinds: E.map(e => e.name || e.type), rec: worldState.roadfolk && worldState.roadfolk[id] }; }, amb.id);
console.log(JSON.stringify(sp));
check('with you by him as he reaches it, 3 or 4 bandits fall on him', sp.attack && sp.bandits === amb.A.n, sp);
await g.spin(null, 120);
const won = await page.evaluate(({ id, home }) => { ZONES.world.enemies.filter(e => e._roadfolk === id && !e.dead).forEach(e => killZoneEnemy(e, WORLD.scene)); WORLD.tick(1 / 60, performance.now()); WORLD.tick(1 / 60, performance.now());
  const D = ROADWALK.get(id), R = worldState.roadfolk[id]; const t = D.npc.def.topics.find(t => t.trade); t.fn(t); const H = currentHouse; const it = H.pack[0];
  const out = { saved: R.saved, lag: R.lag, attack: !!D.attack, mul: H.roadMul, cost: shopCost(it), want: Math.max(1, Math.round(it.buyPrice * WORLD.priceMulAt(H.siteId) * .8 * (1 - barterPct()))), favor: (worldState.favor || {})[home] || 0 };
  currentHouse = null; return out; }, amb);
console.log(JSON.stringify(won));
check('kill them and he goes on, late by the fight, selling at ×0.8 that day', won.saved && !won.attack && won.lag > 0 && won.mul === .8 && won.cost === won.want, won);
check('his town gives +1 favour', won.favor === amb.favor0 + 1, { won, amb });
// a second one, walked away from: his pack is taken and he is off the road that day
const amb2 = await findAmb(); skipped.push(amb2.id);
await g.cells(); await g.spin(null, 4);
const lost = await page.evaluate((id) => { const D = ROADWALK.get(id); const sprung = !!(D && D.attack); px += 300; WORLD.tick(1 / 60, performance.now());
  const R = worldState.roadfolk[id]; const T = D.T; return { sprung, lost: R.lost, drawn: ROADWALK.has(id), onRoad: !!travellerAt(T, D.rd, worldState.gameTimeAbsMinutes), saveKey: JSON.parse(ssStringify(worldState)).roadfolk[id] }; }, amb2.id);
console.log(JSON.stringify(lost));
check('walk 250 m off with them alive and his pack is taken; he is off the road, and it is in the save', lost.sprung && lost.lost && !lost.drawn && !lost.onRoad && lost.saveKey && lost.saveKey.lost, lost);

// S2270 — pilgrims and mourners
const pil = await page.evaluate(() => {
  const now = worldState.gameTimeAbsMinutes || 0, day = Math.floor(now / 1440); let one = null, mourn = null, n = 0, nm = 0, bad = [];
  for (let dd = day + 1; dd < day + 40; dd++) for (const rd of ROADS.filter(roadfolkRoad)) for (const T of roadTravellers(rd, dd)) {
    if (T.kind !== 'pilgrim') continue; n++; const Q = pilgrimPlan(T, rd); if (Q.none) { bad.push(T.id); continue; }
    const dRoad = Math.min(...rd.pts.map(q => Math.hypot(q.x - Q.goal.x, q.z - Q.goal.z)));
    if (dRoad > 1500) bad.push([T.id, dRoad]);
    if (Q.mourners) { nm++; const dm = Math.hypot(rd.pts[0].x - 13100, rd.pts[0].z - 25450); if (!mourn || dm < mourn.dm) mourn = { T, rd, dm }; } else if (!one && Q.off > 40) one = { T, rd };
  }
  const put = (o, frac) => { const Q = pilgrimPlan(o.T, o.rd), d = frac * Q.along; const t = o.T.at + d / o.T.pace; worldState.gameTimeAbsMinutes = t; worldState.gameTimeMinutes = t % 1440; const p = travellerAt(o.T, o.rd, t); px = p.x + 5; pz = p.z; return { id: o.T.id, goal: Q.goal, along: Q.along, off: Q.off, t }; };
  return { n, nm, bad, one: one && put(one, .5), mourn: mourn && { id: mourn.T.id } , _m: mourn && [mourn.rd.def.a, mourn.rd.def.b, mourn.T.id] };
});
console.log(JSON.stringify(pil).slice(0, 900));
check('every pilgrim is bound for a shrine or lesser gate within 1,500 m of his road', pil.n > 0 && pil.bad.length === 0, pil.bad.slice(0, 5));
check('about one in six bound for a gate are mourners (some over 40 days)', pil.nm > 0, pil.nm);
await g.cells(); await g.spin(null, 4);
const talk = await page.evaluate((o) => { const D = ROADWALK.get(o.id); if (!D) return { drawn: false, keys: [...ROADWALK.keys()] }; const t = D.npc.def.topics.find(t => t.label === 'Where are you bound?');
  const before = !!(worldState.sighted && worldState.sighted[o.goal.id]); const resp = t.fn(t); return { drawn: true, inTalk: npcs.includes(D.npc), before, after: !!(worldState.sighted && worldState.sighted[o.goal.id]), resp }; }, pil.one);
console.log(JSON.stringify(talk));
check('a pilgrim on the road is drawn; asked, he names his goal and it is pencilled on your map', talk.drawn && talk.inTalk && !talk.before && talk.after && talk.resp.includes(pil.one.goal.name), talk);
const off = await page.evaluate((o) => { const D = ROADWALK.get(o.id); const T = D.T, rd = D.rd; const Q = pilgrimPlan(T, rd);
  const mid = travellerAt(T, rd, T.at + (Q.along + Q.off / 2) / T.pace), done = travellerAt(T, rd, T.at + (Q.along + Q.off + 5) / T.pace);
  return { midOff: mid && mid.off, midToGoal: mid && Math.round(Math.hypot(mid.x - Q.goal.x, mid.z - Q.goal.z)), half: Math.round(Q.off / 2), done }; }, pil.one);
console.log(JSON.stringify(off));
check('past the road\'s nearest point he walks off it to his goal, and is gone on arriving', off.midOff && Math.abs(off.midToGoal - off.half) <= 2 && off.done === null, off);
const mo = await page.evaluate((id) => { const now = worldState.gameTimeAbsMinutes || 0, day = Math.floor(now / 1440);
  for (let dd = day - 2; dd < day + 40; dd++) for (const rd of ROADS.filter(roadfolkRoad)) for (const T of roadTravellers(rd, dd)) { if (T.id !== id) continue;
    const Q = pilgrimPlan(T, rd); const t = T.at + Q.along * .5 / T.pace; worldState.gameTimeAbsMinutes = t; worldState.gameTimeMinutes = t % 1440; const p = travellerAt(T, rd, t); px = p.x + 5; pz = p.z; return true; }
  return false; }, pil.mourn.id);
await g.cells(); await g.spin(null, 4);
const mm = await page.evaluate((id) => { const D = ROADWALK.get(id); return D ? { bodies: 1 + D.follow.length, talk: npcs.includes(D.npc) || D.follow.some(f => npcs.includes(f.npc)), sep: +Math.hypot(D.npc.g.position.x - D.follow[0].npc.g.position.x, D.npc.g.position.z - D.follow[0].npc.g.position.z).toFixed(2) } : { keys: [...ROADWALK.keys()], near: roadfolkNow().filter(o => o.T.id === id).map(o => [o.p.x - px, o.p.z - pz]) }; }, pil.mourn.id);
console.log(JSON.stringify({ mo, mm }));
check('mourners walk two together and nobody can speak to them', mo && mm && mm.bodies === 2 && !mm.talk && Math.abs(mm.sep - 1) < .01, mm);
stop(); await g.close();
