// The road's people (Session 2268; Michael's B on #1587, docs/design/the-road-between-towns.md). Each road between two settlements sends
// its day's travellers from its key and the day: 2 + both ends' prosperity ÷ 50, 2 to 6 (halved on a broken route), each with an hour,
// an end and a kind. Where one is comes from the clock and the pace. Within 400 m the nearest four are drawn; the merchant (session 1)
// walks at 1.1 m a game minute with his mule and sells 6 to 10 rows of a goods shop's stock at his home town's prices ×1.1.
// Session 2270: a pilgrim leaves the road for a shrine or lesser gate within 1,500 m and pencils it on your map when asked; mourners say nothing.
// Session 2273: the mourners carry their dead on a bier, one before and one behind it, its poles in their hands.
// Session 2275: a rider at 5.5 m a game minute reins in when you come within 6 m and gives the newest event within two cells to the journal and the map.
// Session 2282: the family's man pushes a handcart, its grips in his palms and its wheels on the road ahead.
// Session 2276: families from a town fallen in the last 20 days walk to the other end; 15 gold owes +1 favour there once it is whole, +2 at most.
// Session 2277: an official on a road a live camp breaks writes you a writ on it, paid 40 + 10 a tier when the camp is cleared.
// Session 2283: a bridge rolls 1 in 30 a game-week and is down two weeks, drawn broken (the look's S2281) with the river's bed in its gap; riders tell of it;
// the nearer lord mends it for 250 gold + 2 a metre (or 20 planks and Joinery 25), up 2 days after.
// Session 2287: striking one of them is an assault at the nearer end of the road.
// Session 2289: the rider rides astride (pwRide), the hips on the horse's back, the legs either side of its barrel.
// Session 2291: his horse saddled, the reins from his fists to the bit, nothing else in his hands.
// Session 2294: the horse bridled, the reins tied at its bit's rings.
// Session 2284: a coach draws up at the bank of a bridge down and goes on when it stands; a route over one earns half (+1 on even days).
// Session 2290: over a bridge the road's walkers, the caravans and the coaches stand on the deck's setts (roadY), not on the causeway.
// Session 2301: his mule's pack (and a family's handcart) robbed as a strongbox: unseen nothing, seen a theft at the nearer end.
// Session 2302: the official's guard draws on a crime he sees and fights to the town's yield.
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
// Session 2287: striking him is an assault booked at the nearer end of his road (the town's +75 fine, 3 points owed, −3 favour); state restored after
const hit = await page.evaluate((id) => { const D = ROADWALK.get(id); const N = D.npc; const snap = JSON.stringify({ c: worldState.crime || null, l: worldState.crimes || null, t: worldState.favor || null });
  px = N.g.position.x + 1.5; pz = N.g.position.z; const a = siteAnywhere(D.rd.def.a), b = siteAnywhere(D.rd.def.b); const near = Math.hypot(a.x - px, a.z - pz) <= Math.hypot(b.x - px, b.z - pz) ? a : b;
  const c0 = ((worldState.crime || {})[near.id] || { bounty: 0, debt: 0 }); const b0 = c0.bounty, d0 = c0.debt, f0 = favor(near);
  const ok = WORLD.strikeNpc(-1, 0); const c = worldState.crime[near.id]; const last = worldState.crimes[worldState.crimes.length - 1];
  const out = { ok, near: near.id, fine: c.bounty - b0, debt: c.debt - d0, fav: favor(near) - f0, last };
  const S = JSON.parse(snap); worldState.crime = S.c || undefined; worldState.crimes = S.l || undefined; worldState.favor = S.t || {}; return out; }, m.id);
console.log(JSON.stringify(hit));
check('striking the road\'s merchant is an assault at the nearer end of his road: +75 fine, 3 owed, −3 favour', hit.ok && hit.fine === 75 && hit.debt === 3 && hit.fav === -3 && hit.last.kind === 'assault' && hit.last.site === hit.near && hit.last.road === m.id, hit);
// Session 2301 (Michael's A on #1638): his mule's pack is a container. From behind the mule, out of his sight and hearing, E takes one row
// and only the record knows; heard at his elbow it is a theft at the nearer end (−2 favour, 50 + the goods' worth), he will not trade for
// 5 days, and the row is gone from his pack. Once a traveller. State restored after.
const rob = await page.evaluate((id) => { const D = ROADWALK.get(id); const N = D.npc, B = D.beast; const snap = JSON.stringify({ c: worldState.crime || null, l: worldState.crimes || null, t: worldState.favor || null, r: worldState.roadfolk || null, f: worldState.refuse || null }); const bag0 = BAG.length;
  const a = N.g.rotation.y, fx = Math.sin(a), fz = Math.cos(a), sx = Math.cos(a), sz = -Math.sin(a);
  const others = [...ROADWALK.values()].filter(o => o !== D); others.forEach(o => { o.npc.g.visible = false; });
  const stand = (x, z) => { px = x; pz = z; yaw = Math.atan2(-(B.position.x - px), -(B.position.z - pz)); };
  const restore = () => { const S = JSON.parse(snap); worldState.crime = S.c || undefined; worldState.crimes = S.l || undefined; worldState.favor = S.t || {}; worldState.roadfolk = S.r || undefined; worldState.refuse = S.f || undefined; BAG.length = bag0; };
  const a0 = siteAnywhere(D.rd.def.a), b0 = siteAnywhere(D.rd.def.b), nearOf = () => Math.hypot(a0.x - px, a0.z - pz) <= Math.hypot(b0.x - px, b0.z - pz) ? a0 : b0;
  const rows0 = merchantPack(D.T).length;
  // behind the mule
  stand(B.position.x - fx * 1.0 + sx * 1.2, B.position.z - fz * 1.0 + sz * 1.2); const near1 = nearOf(); const cA = ((worldState.crime || {})[near1.id] || { bounty: 0 }).bounty;
  const p1 = roadPackPrompt(), w1 = roadWitness(); const ok1 = roadPackTake(); const it1 = BAG[BAG.length - 1];
  const unseen = { prompt: p1, wit: w1 && w1.name, ok: ok1, got: BAG.length - bag0, item: it1 && it1.name, stolen: it1 && it1.stolen, fine: ((worldState.crime || {})[near1.id] || { bounty: 0 }).bounty - cA, last: worldState.crimes[worldState.crimes.length - 1], again: roadPackPrompt(), rows: merchantPack(D.T).length };
  roadPackTake(); unseen.twice = BAG.length - bag0;
  restore();
  // at his elbow, between him and the mule
  stand(N.g.position.x - fx * .8 + sx * 1.0, N.g.position.z - fz * .8 + sz * 1.0); const near2 = nearOf(); const c0 = ((worldState.crime || {})[near2.id] || { bounty: 0, debt: 0 }), bb = c0.bounty, dd = c0.debt, ff = favor(near2);
  const w2 = roadWitness(); const ok2 = roadPackTake(); const it2 = BAG[BAG.length - 1]; const c = worldState.crime[near2.id];
  const seen = { wit: w2 && w2.name, by: N.def.name, ok: ok2, item: it2 && it2.name, worth: it2 && it2.buyPrice, fine: c.bounty - bb, debt: c.debt - dd, fav: favor(near2) - ff, refuse: (worldState.refuse || {})[id] - dayNow(), rows: merchantPack(D.T).length, inPack: merchantPack(D.T).filter(r => r.name === (it2 && it2.name)).length, inPack0: merchantPack(Object.assign({}, D.T, { id: D.T.id })).length };
  currentHouse = merchantHouse(D.T, D.rd, N.def.name); seen.refuses = WORLD.refusesTrade(currentHouse); currentHouse = null;
  restore(); others.forEach(o => { o.npc.g.visible = true; });
  return { rows0, unseen, seen }; }, m.id);
console.log(JSON.stringify(rob));
check('from behind his mule, unseen: one row of his pack, stolen, no fine, once', !!rob.unseen.prompt && !rob.unseen.wit && rob.unseen.ok && rob.unseen.got === 1 && rob.unseen.stolen && rob.unseen.fine === 0 && rob.unseen.last.kind === 'theft' && rob.unseen.last.road === m.id && rob.unseen.rows === rob.rows0 - 1 && rob.unseen.twice === 1 && /nothing more/.test(rob.unseen.again), rob.unseen);
check('at his elbow he sees it: theft at the nearer end (+50 and its worth, 2 owed, −2 favour), no trade for 5 days', rob.seen.ok && rob.seen.wit === rob.seen.by && rob.seen.fine === 50 + rob.seen.worth && rob.seen.debt === 2 && rob.seen.fav === -2 && rob.seen.refuse === 5 && rob.seen.refuses && rob.seen.rows === rob.rows0 - 1, rob.seen);
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
const BIER_GAP = await page.evaluate(() => BIER.gap);
const mm = await page.evaluate((id) => { const D = ROADWALK.get(id); return D ? { bodies: 1 + D.follow.length, talk: npcs.includes(D.npc) || D.follow.some(f => npcs.includes(f.npc)), sep: +Math.hypot(D.npc.g.position.x - D.follow[0].npc.g.position.x, D.npc.g.position.z - D.follow[0].npc.g.position.z).toFixed(2) } : { keys: [...ROADWALK.keys()], near: roadfolkNow().filter(o => o.T.id === id).map(o => [o.p.x - px, o.p.z - pz]) }; }, pil.mourn.id);
console.log(JSON.stringify({ mo, mm }));
check('mourners walk two together, one before the other along the road, and nobody can speak to them', mo && mm && mm.bodies === 2 && !mm.talk && mm.sep > BIER_GAP - .3 && mm.sep < BIER_GAP + .05, mm);
// S2273 — the bier between them: its poles run through the four palms, and its bearers hold nothing and wear no cloak over their arms
// (the builder's bodies are built one at a time after the load; attach these two at once, as f4people does)
// (S2278: a body the game's own hbTick built first stays at the far level while its shaders warm, `hb.cold`, and the warming waits behind
// every body still in the build queue; warm these two here, as they are attached here, and cancel the game's own build of either, which
// would hang a second, cold body on it when it finished; and stand 4 m beside them, since under load the clock runs on through g.cells and
// walks them past the far level's 42 m; the camera with you, since g.spin's ticks do not move it and hbTick measures from it)
const nearBodies = async (id) => { for (let k = 0; k < 40; k++) {
  const ready = await page.evaluate((id) => { const D = ROADWALK.get(id); if (!D) return true; let ok = true;
    { const q = D.npc.g.position, a = D.npc.g.rotation.y; px = q.x + Math.cos(a) * 4; pz = q.z - Math.sin(a) * 4; CAM.position.set(px, q.y + 1.6, pz); }
    for (const N of [D.npc, D.follow[0].npc]) { const rig = N.g.userData.rig; if (HBODY.job && HBODY.job.rig === rig) HBODY.job = null; if (!rig.hb && rig.hbG) { hbAttach(rig); if (rig.hb) { hbLevel(rig, 0); hbPose(rig); } }
      const H = rig.hb; if (H && Array.isArray(H.cold)) { while (H.cold.length) { const o = H.cold.pop(); try { hbCompile(o, false); hbUpload(o); } catch (e) {} } H.cold = false; }
      if (H && !H.cold && H.L === 2) { hbLevel(rig, 0); hbPose(rig); }
      if (!H || H.cold || H.L === 2) ok = false; } return ok; }, id);
  await g.spin(null, 2); if (ready) break;
}
};
await nearBodies(pil.mourn.id);
const bi = await page.evaluate((id) => { const D = ROADWALK.get(id); if (!D || !D.bier) return { bier: false };
  const G = D.bier; G.updateMatrixWorld(true); const inv = G.matrixWorld.clone().invert(), out = [];
  for (const N of [D.npc, D.follow[0].npc]) { N.g.updateMatrixWorld(true); const rig = N.g.userData.rig;
    for (const s of ['L', 'R']) { const h = kidPalm(rig, s); if (!h) { out.push(null); continue; } const q = h.p.clone().applyMatrix4(inv);
      out.push(+Math.hypot(Math.abs(q.x) - BIER.w / 2, q.y).toFixed(3)); } }
  const dress = [D.npc, D.follow[0].npc].map(N => { const G2 = HB_GENOMES.get(N.g.userData.rig.g.hbKey); const d = (G2 && G2.dress) || {};
    return Object.keys(HB_BEARER_STRIP).filter(k => d[k]); });
  return { bier: true, tris: G.userData.tris, w: +(G.userData.w || 0).toFixed(3), off: out, bear: [D.npc.g.userData.rig.bear, D.follow[0].npc.g.userData.rig.bear], dress, shown: G.visible && !!G.parent,
    hb: [D.npc, D.follow[0].npc].map(N => { const r = N.g.userData.rig, H = r.hb; return H ? [H.L, !!H.cold, H.root.visible, !!H.P, N.g.visible] : [r.hbG ? 'nohb' : 'nogenome', !!r.hbFail]; }) }; }, pil.mourn.id);
console.log(JSON.stringify(bi));
check('the mourners carry a bier, its two poles through their four palms (within 4 cm)', bi.bier && bi.shown && bi.off.every(d => d !== null && d < .04) && bi.bear[0] === 1 && bi.bear[1] === -1, bi);
check('its bearers hold nothing and wear no cloak, cape or mantle; the bier under 2,000 triangles', bi.bier && bi.dress.every(l => l.length === 0) && bi.tris < 2000, bi);
// S2275 — the rider: find one mid-road on a loaded road, stand 3 m off him, and he reins in; asked, he gives the news; walk off and he rides on
const rf = await page.evaluate(() => { const now = worldState.gameTimeAbsMinutes || 0, day = Math.floor(now / 1440);
  for (let dd = day + 1; dd < day + 40; dd++) for (const rd of ROADS.filter(roadfolkRoad)) for (const T of roadTravellers(rd, dd)) { if (T.kind !== 'rider') continue;
    const L = roadLenOf(rd); if (L < 400) continue; const t = T.at + (L * .5) / T.pace; const p = travellerAt(T, rd, t); if (!p) continue;
    worldState.gameTimeAbsMinutes = t; worldState.gameTimeMinutes = t % 1440; px = p.x + Math.cos(p.ang) * 3; pz = p.z - Math.sin(p.ang) * 3;
    return { id: T.id, a: rd.def.a, b: rd.def.b }; }
  return null; });
console.log(JSON.stringify(rf));
check('a rider found', !!rf);
await g.cells(); await g.spin(null, 4);
await g.frames(3); /* S2289 — the pose is the people's tick's, run on the game's own frames, not g.spin's */
const h1 = await page.evaluate((id) => { const D = ROADWALK.get(id); if (!D) return { drawn: false, keys: [...ROADWALK.keys()] }; const rig = D.npc.g.userData.rig;
  return { drawn: true, halted: !!D.halt, x: D.npc.g.position.x, z: D.npc.g.position.z, t: worldState.gameTimeAbsMinutes, sit: !!(rig && rig.ride && !rig.sit), horse: D.beast.children.length,
    seat: (() => { if (!rig || !rig.B) return null; D.beast.updateMatrixWorld(true); D.npc.g.updateMatrixWorld(true); const inv = new THREE.Matrix4().copy(D.beast.matrixWorld).invert(), v = new THREE.Vector3();
      const at = b => { rig.B[b].getWorldPosition(v); v.applyMatrix4(inv); return [+v.x.toFixed(3), +v.y.toFixed(3), +v.z.toFixed(3)]; };
      return { hips: at('hips'), knL: at('knL'), knR: at('knR'), anL: at('anL'), anR: at('anR'), w: +rig.w.ride.toFixed(2) }; })(), lift: +(D.npc.g.position.y - worldH(D.npc.g.position.x, D.npc.g.position.z)).toFixed(2), inTalk: npcs.includes(D.npc), post: D.npc.def.post, lag: (worldState.roadfolk[id] || {}).lag || 0 }; }, rf.id);
console.log(JSON.stringify(h1));
check('a rider is drawn seated on his horse, and within 6 m he reins in', h1.drawn && h1.sit && h1.horse === 1 && h1.lift > .5 && h1.halted && h1.inTalk, h1);
// S2289 — astride, not on the bench pose: the hips 5 to 15 cm over the horse's back (1.30 m at the saddle standing, higher in its stride), each knee and ankle out past
// the barrel (0.20 to 0.27 m a side), the left on the left; the old pose hung the shins straight down through the horse's shoulder
{ const S = h1.seat; check('he rides astride: the hips over the horse\'s back, a knee and an ankle down either side of its barrel', !!S && S.w > .9 && S.hips[1] > 1.3 && S.hips[1] < 1.6 && Math.abs(S.hips[0]) < .05
  && S.knL[0] > .3 && S.knR[0] < -.3 && S.anL[0] > .28 && S.anR[0] < -.28 && S.anL[1] < 1.1 && S.anR[1] < 1.1, S); }
// S2291 — his horse is saddled (the kit's saddle on the riding kind) and he holds the reins: nothing else in his hands, the straps from his two fists
// to the bit's rings, the rings ahead of and below the fists; and he is not the namesake at home (a rider was Hearthwick's guard, spear and all)
{ await page.evaluate((id) => { const H = ROADWALK.get(id).npc.g.userData.rig.ride.beast; if (!H.hc && !H.hcFail) hcAttach(H); }, rf.id); await g.frames(3);
  const T = await page.evaluate((id) => { const D = ROADWALK.get(id), rig = D.npc.g.userData.rig, H = rig.ride.beast, P = H.hc && HC.PLANS[hcPlan(hcKind(H))], dz = (rig.hbG && rig.hbG.dress) || {};
    const A = D.reinsAt, f = v => v.toArray().map(x => +x.toFixed(3));
    return { kind: hcKind(H), saddle: !!P && P.parts.some(([k]) => k === 'saddle'), held: Object.keys(HB_BEARER_STRIP).filter(k => dz[k]), key: rig.g.hbKey, shown: !!(D.reins && D.reins.visible && D.reins.parent === D.beast),
      reins: A && { L: f(A.L), R: f(A.R), hl: f(A.hl), hr: f(A.hr) } }; }, rf.id);
  console.log(JSON.stringify(T)); const R = T.reins;
  check('his horse is saddled, he holds nothing but the reins, from his fists to the bit ahead of and below them', /Riding Horse$/.test(T.kind) && T.saddle && T.held.length === 0 && /#road:/.test(T.key) && T.shown && !!R
    && Math.abs(R.hl[0] - R.hr[0]) < .4 && Math.abs(R.L[0] - R.R[0]) < .25 && R.L[2] > R.hl[2] + .5 && R.R[2] > R.hr[2] + .5 && R.L[1] < R.hl[1] && R.R[1] < R.hr[1], T); }
// S2294 — his horse is bridled (the kit's P.bridle on the riding kind: the headstall on its head bone, the bit's rings and bar) and the
// reins are tied at those rings: each end within a millimetre of its ring's centre in the world, a hand or two apart across the mouth
{ const T = await page.evaluate((id) => { const D = ROADWALK.get(id), H = D.npc.g.userData.rig.ride.beast, C = H.hc && H.hc.C, Bd = C && C.B.bridle; if (!Bd) return { bridle: false };
    const hb = C.byName.head, F = C.B.headFrame; hb.updateWorldMatrix(true, false); D.beast.updateMatrixWorld(true);
    const ring = Bd.rings.map(r => r.clone().sub(F.base).applyMatrix4(hb.matrixWorld)), end = [D.reinsAt.L, D.reinsAt.R].map(v => v.clone().applyMatrix4(D.beast.matrixWorld));
    let mesh = null; hb.traverse(o => { if (o.name === 'bridle') mesh = o; });
    return { bridle: true, mesh: !!mesh, tris: Bd.tris, off: ring.map((r, i) => +(r.distanceTo(end[i]) * 1000).toFixed(2)), apart: +(ring[0].distanceTo(ring[1]) * 100).toFixed(1) }; }, rf.id);
  console.log(JSON.stringify(T));
  check('his horse is bridled and the reins are tied at the bit\'s rings', T.bridle && T.mesh && T.off.every(d => d < 1) && T.apart > 10 && T.apart < 40, T); }
// S2300 — his tunic's skirt sits on the saddle: once he is posed astride, every point of it is on the pelvis alone (the thighs' weights
// carried its back up and out behind him over the cantle, 0.347 m a side), and behind his hips it hangs within 0.3 m a side of his middle
{ for (let i = 0; i < 60; i++) { const ok = await page.evaluate((id) => { const r = ROADWALK.get(id).npc.g.userData.rig; return !!(r.hb && r.hb.rideSkirt) || !!r.hbFail; }, rf.id); if (ok) break; await g.frames(2); }
  const S = await page.evaluate((id) => { const D = ROADWALK.get(id), rig = D.npc.g.userData.rig, H = rig.ride.beast; if (!rig.hb) return { hb: false, fail: !!rig.hbFail };
    const P = rig.hb.P, by = P.byName; let sk = null; P.root.traverse(o => { if (o.isSkinnedMesh && /^(skirt|coatSkirt|mailSkirt)$/.test(o.name) && !sk) sk = o; }); if (!sk) return { hb: true, seated: rig.hb.rideSkirt, skirt: false };
    if (rig.hb.L !== 0) hbLevel(rig, 0); hbPose(rig); H.root.updateWorldMatrix(true, false); rig.hb.root.updateMatrixWorld(true);
    const Gi = H.root.matrixWorld.clone().invert(), k = new THREE.Vector3().setFromMatrixScale(H.root.matrixWorld).y, v = new THREE.Vector3();
    const hip = by['upperleg01.L'].getWorldPosition(new THREE.Vector3()).add(by['upperleg01.R'].getWorldPosition(new THREE.Vector3())).multiplyScalar(.5).applyMatrix4(Gi);
    const ids = [...new Set(sk.geometry.index.array)], si = sk.geometry.attributes.skinIndex, sw = sk.geometry.attributes.skinWeight, bones = new Set(); let wide = 0;
    for (const i of ids) { for (let c = 0; c < 4; c++) if (sw.getComponent(i, c) > 0) bones.add(sk.skeleton.bones[si.getComponent(i, c)].name);
      v.fromBufferAttribute(sk.geometry.attributes.position, i); sk.applyBoneTransform(i, v); v.applyMatrix4(Gi); if (v.z < hip.z - .02) wide = Math.max(wide, Math.abs(v.x - hip.x) * k); }
    const W = new Map(); for (const i of ids) { v.fromBufferAttribute(sk.geometry.attributes.position, i); sk.applyBoneTransform(i, v); W.set(i, v.clone()); }
    const ix = sk.geometry.index.array; let edge = 0; for (let t = 0; t < ix.length; t += 3) for (let e = 0; e < 3; e++) edge = Math.max(edge, W.get(ix[t + e]).distanceTo(W.get(ix[t + (e + 1) % 3])));
    return { hb: true, seated: rig.hb.rideSkirt, skirt: sk.name, n: ids.length, bones: [...bones], wide: +wide.toFixed(3), edge: +edge.toFixed(3), N: rig.hb.rideSkirtN }; }, rf.id);
  console.log(JSON.stringify(S));
  check('his tunic\'s skirt sits on the saddle: on his pelvis alone, within 0.3 m a side behind his hips', S.hb && S.seated && (!S.skirt || (S.bones.length === 1 && S.bones[0] === 'root' && S.wide > .1 && S.wide < .3)), S);
  // S2311 — and its hem is whole where the lap's part meets the hanging part (#1652): no edge of it longer than 0.15 m as he sits (0.30 m before)
  check('his tunic\'s skirt is whole at the hips: no edge longer than 0.15 m', S.hb && (!S.skirt || S.edge < .15), S); }
await page.evaluate((m) => { worldState.gameTimeAbsMinutes += m; worldState.gameTimeMinutes = (worldState.gameTimeMinutes + m) % 1440; }, 5);
await g.spin(null, 4);
const h2 = await page.evaluate((id) => { const D = ROADWALK.get(id); return { halted: !!D.halt, x: D.npc.g.position.x, z: D.npc.g.position.z, t: worldState.gameTimeAbsMinutes, lag: (worldState.roadfolk[id] || {}).lag }; }, rf.id);
console.log(JSON.stringify(h2));
// Session 2280 (QA): his lag counts from the tick he reined in, which can be a tick or two before h1 is read, so h1's lag is read too
check('he stands while you are by him, the minutes his lag', h2.halted && Math.hypot(h2.x - h1.x, h2.z - h1.z) < .05 && Math.abs(h2.lag - h1.lag - (h2.t - h1.t)) < .01 && h2.t - h1.t > 4.9, { h1, h2 });
const nw = await page.evaluate((o) => { const D = ROADWALK.get(o.id); const t = D.npc.def.topics.find(t => t.label === 'What news?');
  const none = t.fn(t); const site = siteAnywhere(o.a); const st = TS(site); st.siegeBy = st.siegeBy || 'mark'; st.flags.besieged = worldState.gameTimeAbsMinutes - 1440;
  const n0 = (worldState.mapNotes || []).length, j0 = GAME_LOG.length; const resp = t.fn(t); const n1 = (worldState.mapNotes || []).length, j1 = GAME_LOG.length; t.fn(t);
  const n2 = (worldState.mapNotes || []).length; const note = worldState.mapNotes[n1 - 1]; delete st.flags.besieged;
  return { none, resp, town: site.name, notes: [n0, n1, n2], logs: j1 - j0, note: note && { text: note.text, d: Math.round(Math.hypot(note.x - site.x, note.z - site.z)) }, log: GAME_LOG[GAME_LOG.length - 1].text }; }, rf);
console.log(JSON.stringify(nw));
check('asked, he gives the newest event near him, to the journal and pinned on the map at the town, once', nw.resp.includes(nw.town + ' is under siege') && nw.resp.includes('yesterday') && nw.notes[1] === nw.notes[0] + 1 && nw.notes[2] === nw.notes[1] && nw.logs === 1 && nw.note && nw.note.d < 1, nw);
await page.evaluate((id) => { const D = ROADWALK.get(id); px = D.npc.def.x + 40; pz = D.npc.def.z; }, rf.id);
await g.spin(null, 30);
const h3 = await page.evaluate((id) => { const D = ROADWALK.get(id); return D ? { halted: !!D.halt, x: D.npc.g.position.x, z: D.npc.g.position.z, t: worldState.gameTimeAbsMinutes } : null; }, rf.id);
await page.evaluate((m) => { worldState.gameTimeAbsMinutes += m; worldState.gameTimeMinutes = (worldState.gameTimeMinutes + m) % 1440; }, 2);
await g.spin(null, 4);
const h4 = await page.evaluate((id) => { const D = ROADWALK.get(id); return D ? { halted: !!D.halt, x: D.npc.g.position.x, z: D.npc.g.position.z, t: worldState.gameTimeAbsMinutes } : null; }, rf.id);
console.log(JSON.stringify({ h3, h4 }));
const rv = h3 && h4 ? Math.hypot(h4.x - h3.x, h4.z - h3.z) / (h4.t - h3.t) : 0;
check('left, he rides on at 5.5 m a game minute and does not stop again', h3 && h4 && !h3.halted && !h4.halted && Math.abs(rv - 5.5) < .4, rv);
// S2276 — families: burn a road's end, find its family on the road, give, and the favour waits for the town to stand again
const fm = await page.evaluate(() => { const now = worldState.gameTimeAbsMinutes || 0, day = Math.floor(now / 1440);
  for (const rd of ROADS.filter(roadfolkRoad)) { if (roadLenOf(rd) < 400) continue; const a = siteAnywhere(rd.def.a); if (!a || storyRuin(a)) continue;
    TS(a).flags.burned = now; _roadDays.clear(); const L = roadTravellers(rd, day + 1).filter(T => T.kind === 'family'); if (!L.length) { delete TS(a).flags.burned; continue; }
    const T = L[0]; const t = T.at + 100 / T.pace; const p = travellerAt(T, rd, t); worldState.gameTimeAbsMinutes = t; worldState.gameTimeMinutes = t % 1440; px = p.x + Math.cos(p.ang) * 4; pz = p.z - Math.sin(p.ang) * 4;
    return { id: T.id, from: T.from, n: L.length, site: a.id, name: a.name, kinds: roadTravellers(rd, day + 1).map(T => T.kind) }; }
  return null; });
console.log(JSON.stringify(fm));
check('a town burned today sends two families down its roads, from its end', fm && fm.n === 2 && fm.from === 'a', fm);
await g.cells(); await g.spin(null, 4);
const fg = await page.evaluate((o) => { const D = ROADWALK.get(o.id); if (!D) return { drawn: false };
  const t = D.npc.def._extra.find(t => /Take this/.test(t.label)); gold = 40; const fav0 = WORLD.favor ? 0 : 0; const f0 = (worldState.favor || {})[o.site] || 0;
  const resp = t.fn(t); const g1 = gold, again = t.avail(), f1 = (worldState.favor || {})[o.site] || 0, owed = (worldState.roadAlms[o.site] || {}).owed;
  return { drawn: true, two: 1 + D.follow.length, inTalk: npcs.includes(D.npc), second: npcs.includes(D.follow[0].npc), resp, g1, again, f0, f1, owed, charKey: !!SS_CHAR_WS.roadAlms }; }, fm);
console.log(JSON.stringify(fg));
check('the family walk two together; given 15 gold, the gift is once and the favour owed while the town lies burned', fg.drawn && fg.two === 2 && fg.inTalk && !fg.second && fg.g1 === 25 && fg.again === false && fg.f1 === fg.f0 && fg.owed === 1 && fg.charKey, fg);
// S2282 — the family's handcart: the man pushes it, its grips through his palms, its wheels on the road ahead; he holds nothing and wears no cloak
await nearBodies(fm.id); await g.spin(null, 6); await nearBodies(fm.id);
const ct = await page.evaluate((id) => { const D = ROADWALK.get(id); if (!D || !D.cart) return { cart: false }; const G = D.cart; G.updateMatrixWorld(true);
  const rig = D.npc.g.userData.rig; D.npc.g.updateMatrixWorld(true); const inv = G.matrixWorld.clone().invert(), off = [];
  for (const s of ['L', 'R']) { const h = kidPalm(rig, s); if (!h) { off.push(null); continue; } const q = h.p.clone().applyMatrix4(inv); off.push(+Math.hypot(Math.abs(q.x) - CART.hw, q.y, q.z).toFixed(3)); }
  const W = G.userData.wheels, gap = [-1, 1].map(sx => { const c = new THREE.Vector3(sx * CART.track, 0, 0).applyMatrix4(W.matrixWorld); return +(c.y - CART.r - worldH(c.x, c.z)).toFixed(3); });
  const r0 = G.userData.roll; const G2 = HB_GENOMES.get(rig.g.hbKey), d = (G2 && G2.dress) || {};
  return { cart: true, shown: G.visible && !!G.parent, tris: G.userData.tris, off, gap, r0, push: rig.push, follow: D.follow[0].npc.g.userData.rig.push || 0, dress: Object.keys(HB_BEARER_STRIP).filter(k => d[k]),
    hb: rig.hb ? [rig.hb.L, !!rig.hb.cold, rig.hb.root.visible, +Math.hypot(CAM.position.x - D.npc.g.position.x, CAM.position.z - D.npc.g.position.z).toFixed(1)] : 'nohb' }; }, fm.id);
await page.evaluate((m) => { worldState.gameTimeAbsMinutes += m; worldState.gameTimeMinutes = (worldState.gameTimeMinutes + m) % 1440; }, 1);
await g.spin(null, 4);
ct.r1 = await page.evaluate((id) => { const D = ROADWALK.get(id); return D && D.cart ? D.cart.userData.roll : null; }, fm.id);
console.log(JSON.stringify(ct));
check('the man pushes a handcart: its grips in his palms (within 3 cm), both wheels on the road (within 3 cm), and they turn as it goes (a game minute: about a metre)', ct.cart && ct.shown && ct.push === 1 && !ct.follow && ct.off.every(d => d !== null && d < .03) && ct.gap.every(d => Math.abs(d) < .03) && ct.r1 - ct.r0 > .5, ct);
check('he holds nothing and wears no cloak, cape or mantle; the cart under 2,500 triangles', ct.cart && ct.dress.length === 0 && ct.tris < 2500, ct);
const fp = await page.evaluate((o) => { const f0 = (worldState.favor || {})[o.site] || 0; delete TS(siteAnywhere(o.site)).flags.burned; familyPay();
  const f1 = (worldState.favor || {})[o.site] || 0; const E = worldState.roadAlms[o.site]; E.owed = 0; E.n = 2; TS(siteAnywhere(o.site)); const before = E.n;
  // a third gift (another family) counts for nothing more
  const T = { id: o.id + 'x', from: 'a' }; const rd = ROADWALK.get(o.id).rd; gold = 40; familyGive(T, rd); familyPay(); const f2 = (worldState.favor || {})[o.site] || 0;
  return { f0, f1, f2, E: worldState.roadAlms[o.site], gold }; }, fm);
console.log(JSON.stringify(fp));
check('once the town is whole the favour is paid (+1), and past +2 a town a gift adds none', fp.f1 === fp.f0 + 1 && fp.f2 === fp.f1 && fp.E.n === 2 && fp.E.owed === 0 && fp.gold === 25, fp);
// S2277 — the official's writ: an official on a road with a live camp, asked, writes it; clearing the camp pays it
const of = await page.evaluate(() => { const now = worldState.gameTimeAbsMinutes || 0, day = Math.floor(now / 1440);
  for (let dd = day + 1; dd < day + 80; dd++) for (const rd of ROADS.filter(roadfolkRoad)) { if (!roadCamp(rd)) continue; for (const T of roadTravellers(rd, dd)) { if (T.kind !== 'official') continue;
    const t = T.at + Math.min(200, roadLenOf(rd) * .3) / T.pace; const p = travellerAt(T, rd, t); if (!p) continue; worldState.gameTimeAbsMinutes = t; worldState.gameTimeMinutes = t % 1440; px = p.x + Math.cos(p.ang) * 4; pz = p.z - Math.sin(p.ang) * 4;
    const c = roadCamp(rd); return { id: T.id, camp: c.id, name: c.name, tier: worldTierAt(c.x, c.z) }; } }
  return null; });
console.log(JSON.stringify(of));
check('an official found on a road a live camp breaks', !!of);
await g.cells(); await g.spin(null, 4);
const ow = await page.evaluate((o) => { const D = ROADWALK.get(o.id); if (!D) return { drawn: false };
  const t = D.npc.def._extra.find(t => t.label === 'Any trouble on the road?'); const resp = t.fn(t); const q = qFind('writ:' + o.camp); const again = t.fn(t);
  const g0 = gold; markLairDead(o.camp); const g1 = gold; delete worldState.lairs[o.camp];
  return { drawn: true, two: 1 + D.follow.length, guardTalk: npcs.includes(D.follow[0].npc), post: D.npc.def.post, resp, again, reward: q && q.reward, kind: q && q.kind, paid: g1 - g0, turned: q && q.turnedIn, want: questGold(40 + 10 * o.tier) }; }, of);
console.log(JSON.stringify(ow));
check('he walks with a guard and writes a writ on the camp, 40 + 10 a tier, once', ow.drawn && ow.two === 2 && !ow.guardTalk && ow.kind === 'writ' && ow.reward === 40 + 10 * of.tier && ow.resp.includes(of.name) && /You have my writ/.test(ow.again), ow);
check('clearing the camp pays the writ', ow.turned && ow.paid === ow.want, ow);
// S2302 (#1638 A): his guard is the road's law. Struck, he draws (keyed by the nearer end); under 30% of your health the town's yield is
// offered; the fine paid, he stands down and walks with his officer again. State restored after.
const law = await page.evaluate((o) => { const D = ROADWALK.get(o.id); const G = D.follow[0].npc, O = D.npc; const snap = JSON.stringify({ c: worldState.crime || null, l: worldState.crimes || null, t: worldState.favor || null }); const hp0 = PHP;
  const vx = G.g.position.x - O.g.position.x, vz = G.g.position.z - O.g.position.z, vl = Math.hypot(vx, vz) || 1;
  px = G.g.position.x + vx / vl * 1.2; pz = G.g.position.z + vz / vl * 1.2; const fx = -vx / vl, fz = -vz / vl; yaw = Math.atan2(-fx, -fz);
  const a = siteAnywhere(D.rd.def.a), b = siteAnywhere(D.rd.def.b); const near = Math.hypot(a.x - px, a.z - pz) <= Math.hypot(b.x - px, b.z - pz) ? a : b;
  const ok = WORLD.strikeNpc(fx, fz); const E = ZONES.world.enemies.filter(e => e._roadGuard === o.id && !e.dead);
  const out = { ok, drawn: E.length, site: E[0] && E[0]._guard.site, near: near.id, hidden: !G.g.visible, name: E[0] && E[0].name };
  PHP = Math.floor(maxHP * .2); roadGuardTick(); out.yielded = CR.yielded; out.dlg = typeof dlgOpen !== 'undefined' && dlgOpen; out.title = (document.getElementById('dlg-name') || {}).textContent || null;
  try { closeDialog(); } catch (e) {}
  const f = fineRecAt(near.id); out.fine = f && f.bounty; if (f) f.bounty = 0; roadGuardTick(); roadGuardTick();
  out.after = ZONES.world.enemies.filter(e => e._roadGuard === o.id && !e.dead).length; out.back = G.g.visible && !G._drawn; out.reset = !CR.yielded;
  const S = JSON.parse(snap); worldState.crime = S.c || undefined; worldState.crimes = S.l || undefined; worldState.favor = S.t || {}; PHP = hp0; return out; }, of);
console.log(JSON.stringify(law));
check('struck, the official\'s guard draws for the nearer end; under 30% the yield is offered; the fine paid, he stands down', law.ok && law.drawn === 1 && law.site === law.near && law.hidden && law.yielded && law.dlg && law.fine >= 75 && law.after === 0 && law.back && law.reset, law);
// S2283 — a bridge down
const bd = await page.evaluate(() => { const bs = SITES.filter(b => b.kind === 'bridge' && b.bridge); let n = 0, N = 0; for (const b of bs) for (let w = 0; w < 300; w++) { N++; if (bridgeFell(b.id, w)) n++; }
  const b = bs[0]; if (!b) return null; let w = 1; while (!(bridgeFell(b.id, w) && !bridgeFell(b.id, w - 1))) w++;
  const t = w * 7 * 1440 + 600; worldState.gameTimeAbsMinutes = t; worldState.gameTimeMinutes = t % 1440; px = b.x; pz = b.z; return { id: b.id, len: Math.round(b.bridge.len), rate: n / N, bs: bs.length }; });
console.log(JSON.stringify(bd));
check('bridges on the roads, falling about 1 in 30 a week', bd && bd.bs > 0 && bd.rate > .02 && bd.rate < .05, bd);
await g.spin(null, 3);
const bg = await page.evaluate((id) => { const b = SITE[id];
  const drawn = BRIDGE_GAPS.has(id), mid = worldH(b.x, b.z), deckY = b.bridge.y;
  const L = siteAnywhere(bridgeLordSite(b)), T = bridgeMendTopics(L); const news = riderNews(b.x, b.z); gold = 1000; const said = T[1].fn(); const left = gold, again = T[1].avail();
  const still = BRIDGE_GAPS.has(id);
  worldState.gameTimeAbsMinutes += 2 * 1440; worldState.gameTimeMinutes = worldState.gameTimeAbsMinutes % 1440; return { drawn, drop: +(deckY - mid).toFixed(2), still, news: news && news.line, said, left, again, up: bridgeDown(b) === null, cost: bridgeCost(b) }; }, bd.id);
await g.spin(null, 3);
bg.whole = await page.evaluate((id) => !BRIDGE_GAPS.has(id), bd.id);
console.log(JSON.stringify(bg));
check('down by the roll: drawn broken, the ground in its gap the river\'s bed, drawn whole again once mended', bg.drawn && bg.drop > 1 && bg.still && bg.whole, bg);
check('a rider tells of it', /is down/.test(bg.news || ''), bg.news);
check('the lord mends it for 250 + 2 a metre, up two days after', bg.cost === 250 + 2 * bd.len && bg.left === 1000 - bg.cost && !bg.again && bg.up, bg);
// S2284 — the coach at the bank, the route at half
const cr = await page.evaluate(() => { const K = { village: 1, town: 1, city: 1, port: 1 };
  const rd = ROADS.find(rd => rd.def && siteAnywhere(rd.def.a) && siteAnywhere(rd.def.b) && siteAnywhere(rd.def.a).kind in K && siteAnywhere(rd.def.b).kind in K && roadBridges(rd).length); if (!rd) return null;
  const o = roadBridges(rd)[0], b = SITE[o.id] || siteAnywhere(o.id); let w = 1; while (!(bridgeFell(b.id, w) && !bridgeFell(b.id, w - 1))) w++;
  const key = routeKey(rd.def.a, rd.def.b), cs = coaches(); for (const k in cs) delete cs[k]; cs[key] = { a: rd.def.a, b: rd.def.b };
  const R = routes(); for (const k in R) delete R[k]; R[key] = { a: rd.def.a, b: rd.def.b, opened: 0, broken: false }; const A = siteAnywhere(rd.def.a); setProsperity(A, 40); delete (worldState.bridges || {})[b.id];
  const dps = []; for (let d = 0; d < 4; d++) { worldState.gameTimeAbsMinutes = (w * 7 + d) * 1440 + 600; const q0 = prosperity(A); tickRoutesDay(); dps.push(prosperity(A) - q0); }
  worldState.gameTimeMinutes = worldState.gameTimeAbsMinutes % 1440; const m = roadPoint(rd, o.u); px = m.x + 30; pz = m.z;
  return { key, id: b.id, u: o.u, k: o.k, dps }; });
console.log(JSON.stringify(cr));
check('a route over a bridge down earns half (with its coach, +1 a day)', cr && cr.dps.reduce((a, b) => a + b, 0) === 6, cr);
await g.cells(); await g.spin(null, 5);
await page.evaluate((r) => { const C = COACHES.get(r.key); C.u = r.u - r.k - .01; C.state = 'run'; C.dir = 1; C.stopped = true; }, cr);
await g.spin(null, 200);
const cb = await page.evaluate((r) => { const C = COACHES.get(r.key); return { u: C.u, state: C.state, halted: C.halted }; }, cr);
await page.evaluate((r) => { worldState.bridges = { [r.id]: { paid: dayNow(), up: dayNow() } }; }, cr);
await g.spin(null, 120);
const cg = await page.evaluate((r) => COACHES.get(r.key).u, cr);
console.log(JSON.stringify({ cb, cg }));
check('the coach draws up at the bank and goes on when the bridge stands', cb.state === 'wait' && cb.halted && Math.abs(cb.u - (cr.u - cr.k)) < 1e-6 && cg > cr.u, { cb, cg });
// S2290 — over a bridge the road's walkers and the coach stand on the setts (S2288's deck), not on the causeway under it
await page.evaluate((r) => { worldState.gameTimeAbsMinutes = Math.floor(worldState.gameTimeAbsMinutes) + 1; worldState.gameTimeMinutes = worldState.gameTimeAbsMinutes % 1440; const C = COACHES.get(r.key); C.u = r.u; C.state = 'wait'; C.dir = 0; C.halted = false; }, cr); /* the next minute: tickBridges draws it whole */
await g.spin(null, 1);
const ck = await page.evaluate((r) => { const C = COACHES.get(r.key), c = C.cart.position, P = ZONES.world.platforms.filter(p => p.bridge === r.id && p.top);
  let deck = null; for (const p of P) { const t = p.top(c.x, c.z); if (t != null) deck = t; }
  const h = C.horses[0].position; let hd = null; for (const p of P) { const t = p.top(h.x, h.z); if (t != null) hd = t; }
  return { gaps: BRIDGE_GAPS.has(r.id), runs: P.length, cart: +c.y.toFixed(3), deck: deck == null ? null : +deck.toFixed(3), ground: +worldH(c.x, c.z).toFixed(3), horse: +h.y.toFixed(3), hdeck: hd == null ? null : +hd.toFixed(3), roadY: +roadY(c.x, c.z).toFixed(3) }; }, cr);
console.log(JSON.stringify(ck));
check('over a bridge the coach and its horses stand on the setts, not on the causeway under them', !ck.gaps && ck.runs === 1 && ck.deck !== null && Math.abs(ck.cart - ck.deck) < .01 && ck.deck - ck.ground > .2 && ck.hdeck !== null && Math.abs(ck.horse - ck.hdeck) < .01, ck);
stop(); await g.close();
