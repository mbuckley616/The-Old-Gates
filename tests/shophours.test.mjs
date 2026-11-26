// Shop hours in the open world (Session 151): a shop is closed out of its hours; its door says so. Since S2630 the hours are its trade's.
import { boot, check } from './lib/game.mjs';
const g = await boot(); const { page } = g;
await g.intoWorld(); await g.settle('dunmore');

async function tryDoor(type, hour) {
  await page.evaluate(([type, hour]) => { forceTime(hour);
    const h = WORLD.settle.get('dunmore').houses.find(x => x.type === type); window._h = h;
    px = h.doorX; pz = h.doorZ + .3; jumpY = 0; }, [type, hour]);
  await page.waitForTimeout(1500);
  await g.frames(); // the prompt is written by the main loop, not by the move
  const prompt = await page.evaluate(() => document.getElementById('ipr').textContent);
  await page.keyboard.press('e'); await page.waitForTimeout(3000);
  const out = await page.evaluate(() => ({ zone: activeZoneId, inside: currentHouse === window._h, closed: WORLD.shopClosedNow(window._h), hour: Math.floor(gameHour()), name: window._h.name }));
  out.prompt = prompt;
  if (out.inside) { await page.evaluate(() => exitInterior()); await page.waitForTimeout(3000); await g.hide(); }
  return out;
}
const types = await page.evaluate(() => [...new Set(WORLD.settle.get('dunmore').houses.map(h => h.type))]);
const shop = ['weapon', 'armor', 'potion', 'misc'].find(t => types.includes(t));
const night = await tryDoor(shop, 23);
check('a shop at night is locked, and its door says so', night.closed && !night.inside && /locked/.test(night.prompt), night);
const day = await tryDoor(shop, 12);
check('the same shop at noon lets you in', !day.closed && day.inside && /enter/.test(day.prompt), day);
const inn = await tryDoor('inn', 23);
check('the inn at night still lets you in', inn.inside, inn);
// S2630 (#1971 B, a town's day): each shop keeps its trade's hours: the forge ('weapon') and the shipwright 7–17, the apothecary 9–17,
// the armourer 9–18, the goods shop 9–19, the barber 10–18. Read straight from the rule at each hour, and one door tried at dusk.
const HRS_WANT = { weapon: [7, 17], shipwright: [7, 17], potion: [9, 17], armor: [9, 18], misc: [9, 19], barber: [10, 18] };
const table = await page.evaluate((W) => { const S = WORLD.settle.get('dunmore'); const out = {};
  for (const t in W) { const h = S.houses.find(x => x.type === t); if (!h) continue; const open = [];
    for (let q = 0; q < 48; q++) { forceTime(q / 2 + .01); if (!WORLD.shopClosedNow(h)) open.push(q / 2); }
    forceTime(3); const lk = WORLD.doorLockNow(h); out[t] = { from: open[0], to: open[open.length - 1] + .5, n: open.length, opens: lk && lk.opens }; }
  forceTime(12); return out; }, HRS_WANT);
console.log(JSON.stringify(table));
check('every trade in Dunmore opens and shuts at its own hour, and its locked door names that opening', Object.keys(table).length >= 4 && Object.entries(table).every(([t, r]) => r.from === HRS_WANT[t][0] && r.to === HRS_WANT[t][1] && r.n === (HRS_WANT[t][1] - HRS_WANT[t][0]) * 2 && r.opens === HRS_WANT[t][0]), table);
const sched = await page.evaluate(() => { const S = WORLD.settle.get('dunmore'); const k = t => S.npcs.find(n => n.sched && n.sched.type === 'keeper' && n.sched.shop === t);
  const say = (n, h) => { if (!n) return null; const p = scheduleFor(n, h); return p.hide ? 'hide' : p.go ? 'go' : p.wander ? 'wander' : 'idle'; };
  const f = k('weapon'), m = k('misc'), r = S.npcs.find(n => n.sched && n.sched.type === 'resident' && dayShare(n) >= .6) || (() => { const res = S.residents.find(x => !x.farm && dayShare({ def: x.def, _settle: S }) >= .6); return res && { def: res.def, _settle: S, home: { x: res.def.x, z: res.def.z }, sched: { type: 'resident', door: res.door, plaza: { x: S.site.x, z: S.site.z }, padR: Math.max(10, S.site.pad - 22), inn: S.innDoor || null } }; })(); /* S2632: one who goes in at 17; S2643: residents spawn only within 70 m, two a tick, so on a slow runner none may be up yet: one is made from the town's list as the street spawns it */
  return { forge7: say(f, 7.5), goods7: say(m, 7.5), forge175: say(f, 17.5), goods175: say(m, 17.5), goods195: say(m, 19.5), res165: say(r, 16.5), res175: say(r, 17.5) }; });
console.log(JSON.stringify(sched));
check("at half past seven the smith is at work and the goods shop's keeper at the door; at half past five the smith goes to the inn and the goods keeper is still in", sched.forge7 === 'hide' && sched.goods7 === 'go' && sched.forge175 === 'go' && sched.goods175 === 'hide' && sched.goods195 === 'go', sched);
check('a resident keeps the square until five and goes in to the inn after', sched.res165 === 'wander' && sched.res175 === 'go', sched);
// S2632 (#1971 B, A's second session): the street by the hour, read from the rule for every resident of Dunmore (built or not): 7–9 at a
// work spot (Dunmore's is its market house), the square at 60% of them 9–13, all 13–17 and a fifth 17–21, the rest at the inn, and night from 21 (the page's 23 is asked: the burglary's household is home 21–23).
const street = await page.evaluate(() => { const S = WORLD.settle.get('dunmore');
  const fake = S.residents.map(res => ({ def: res.def, _settle: S, sched: { type: 'resident', door: res.door, plaza: { x: S.site.x, z: S.site.z }, padR: 20, inn: S.innDoor } }));
  const at = h => { const o = { sq: 0, work: 0, inn: 0, hide: 0 }; for (const n of fake) { const p = scheduleFor(n, h); if (p.hide) o.hide++; else if (p.work) o.work++; else if (p.wander) o.sq++; else if (p.go) o.inn++; } return o; };
  return { N: fake.length, spots: workSpots(S).map(w => w.kind), h8: at(8), h10: at(10), h14: at(14), h19: at(19), h205: at(20.5), h215: at(21.5) }; });
console.log(JSON.stringify(street));
const pc = (o, k) => o[k] / street.N;
check('at eight every resident is at a work spot (Dunmore: the market house)', street.N >= 20 && street.spots.includes('market') && street.h8.work === street.N, street);
check('the square holds 60% at ten, all at two in the afternoon, a fifth in the evening; the rest of the evening at the inn', Math.abs(pc(street.h10, 'sq') - .6) < .03 && street.h10.work + street.h10.sq === street.N && street.h14.sq === street.N && Math.abs(pc(street.h19, 'sq') - .2) < .03 && street.h19.sq + street.h19.inn === street.N && street.h205.inn === street.h19.inn, street);
check('the night begins at 21: everyone is in', street.h215.hide === street.N, street.h215);
const dusk = await tryDoor('misc', 18.5), apo = await tryDoor('potion', 18.5);
check('at half past six the goods shop lets you in and the apothecary is locked till 9', dusk.inside && !dusk.closed && apo.closed && !apo.inside && /locked till 9/.test(apo.prompt), { dusk, apo });
// S2632: the watch's handover, seen at the gate. Dunmore (walled, rich) hands from its night watch to the first gate guard; Hearthwick
// (unwalled) from its watch to the constable. Both set out at 5:15 and 17:45, meet at the gate, and the night man goes in 2 minutes past 6:30.
const hand = await page.evaluate(() => { const out = {};
  for (const [t, S] of WORLD.settle) { const G = handoverGate(S), M = guardsOf(S), w = M.find(n => n.sched.type === 'watch'), d = M.find(n => n.sched.type === 'constable') || M.find(n => n.sched.type === 'guard' && n.sched.a === G);
    if (!G || !w || !d) continue; const say = (n, h) => { const p = scheduleFor(n, h); return p.handover && p.go === G ? 'gate' : p.hide ? 'hide' : p.beat || p.patrol && n.sched.type !== 'constable' && !(n.sched.type === 'guard' && h > 6.5 && h < 19) ? 'beat' : p.patrol ? 'patrol' : '?'; }; /* the night man's duty is his beat, or his patrol where a town has no shops to beat past (beatOf) */
    out[t] = { day: d.sched.type, w: [5.1, 5.3, 6.51, 6.6, 17.7, 17.8, 19.01, 19.1].map(h => say(w, h)), d: [5.1, 5.3, 6.51, 6.6, 17.7, 17.8, 19.01, 19.1].map(h => say(d, h)) }; }
  return out; });
console.log(JSON.stringify(hand));
const H = Object.values(hand);
check('at the handover the night man and the day man both make for the gate, and part 2 minutes past the hour', H.length >= 2 && H.some(x => x.day === 'guard') && H.some(x => x.day === 'constable') && H.every(x => x.w.join() === 'beat,gate,gate,hide,hide,gate,gate,beat' && x.d.join() === (x.day === 'constable' ? 'hide,gate,gate,patrol,patrol,gate,gate,hide' : 'beat,gate,gate,patrol,patrol,gate,gate,beat')), hand);
// S2642: market day (#1971 B). The Gatelands' is Stoneday (days 1, 8, 15 …), 7 to 15, in a town, port or city and not a village or a town
// under plague; that day a counter in the town sells at ×0.9 and pays +10%, and the road's merchant keeps his own price.
const mkt = await page.evaluate(() => { const set = (d, h) => { worldState.gameTimeAbsMinutes = 1440 * d + h * 60; worldState.gameTimeMinutes = h * 60; }; const o = {};
  o.on = [[1, 6.9], [1, 7], [1, 14.9], [1, 15], [8, 10], [2, 10], [3, 10]].map(([d, h]) => { set(d, h); return marketOn('dunmore'); });
  const vil = SITES.find(t => t.kind === 'village' && isleAt(t.x, t.z) === 'gatelands'); set(1, 10); o.village = !!vil && marketOn(vil.id);
  const t = siteAnywhere('dunmore'); TS(t).flags.plague = 1; o.plague = marketOn('dunmore'); delete TS(t).flags.plague;
  o.days = ['gatelands', 'mark', 'aurenne'].map(n => CAL.days[marketDayOf(n)].name);
  const it = { buyPrice: 100, type: 'misc' }, sell = { buyPrice: 100, type: 'equip', sellMult: .4 }, ch0 = currentHouse, ii = window.isInterior;
  currentHouse = { siteId: 'dunmore' }; window.isInterior = () => true;
  set(2, 10); o.b0 = shopCost(it); o.s0 = counterSellPrice(sell); set(1, 10); o.b1 = shopCost(it); o.s1 = counterSellPrice(sell);
  currentHouse.roadMul = 1.1; o.road1 = shopCost(it); set(2, 10); o.road0 = shopCost(it);
  window.isInterior = ii; currentHouse = ch0; set(1, 16); o.next = nextMarket(); set(1, 8); o.today = nextMarket(); return o; });
console.log(JSON.stringify(mkt));
check('market day: the Gatelands\' on Stoneday from 7 to 15 (the Mark\'s Beastday, Aurenne\'s Seaday), in a town and not a village or under plague', mkt.on.join() === 'false,true,true,false,true,false,false' && !mkt.village && !mkt.plague && mkt.days.join() === 'Stoneday,Beastday,Seaday', mkt);
check('that day a Dunmore counter sells at ×0.9 and pays +10%; the road\'s merchant keeps his price; the next market is a week on, or today\'s at 7', Math.abs(mkt.b1 / mkt.b0 - .9) < .02 && Math.abs(mkt.s1 / mkt.s0 - 1.1) < .03 && mkt.road1 === mkt.road0 && mkt.next.at === 8 * 1440 + 420 && mkt.today.at === 1440 + 420, mkt);
// S2643: prices by home (#1971 B). A Gatelands-made sword costs ×0.85 at Dunmore's counter and the Mark's Norse sword ×1.2 there, and the counter
// pays the same; an island herb has its island's home, a sea herb and armour none.
const home = await page.evaluate(() => { const set = (d, h) => { worldState.gameTimeAbsMinutes = 1440 * d + h * 60; worldState.gameTimeMinutes = h * 60; }; set(2, 10);
  const ch0 = currentHouse, ii = window.isInterior; currentHouse = { siteId: 'dunmore' }; window.isInterior = () => true;
  const base = { buyPrice: 100, type: 'equip', sellMult: .4 }, gl = Object.assign({}, base, { make: 'gatelands' }), mk = Object.assign({}, base, { make: 'mark' }), au = Object.assign({}, base, { make: 'aurenne' });
  const ice = HERB_DEF.icebloom.item, sea = Object.values(HERB_DEF).find(d => d.zone === 'sea'), fm = HERB_DEF.firemoss.item;
  const o = { plain: [shopCost(base), counterSellPrice(base)], gl: [shopCost(gl), counterSellPrice(gl)], mk: [shopCost(mk), counterSellPrice(mk)], au: [shopCost(au), counterSellPrice(au)],
    homes: [itemHome(gl), itemHome(mk), itemHome(ice), itemHome(fm), sea ? itemHome(sea.item) : 'none', itemHome({ type: 'equip', slot: 'chest', fam: 'mail' })] };
  set(1, 10); o.glMarket = shopCost(gl);
  window.isInterior = ii; currentHouse = ch0; return o; });
console.log(JSON.stringify(home));
check('by home: at Dunmore a Gatelands-made piece is ×0.85 to buy and to sell, the Mark\'s and Aurenne\'s ×1.2; Icebloom is the Mark\'s, Firemoss the Gatelands\', a sea herb and armour no one\'s; market day stacks', Math.abs(home.gl[0] / home.plain[0] - .85) < .02 && Math.abs(home.gl[1] / home.plain[1] - .85) < .03 && Math.abs(home.mk[0] / home.plain[0] - 1.2) < .02 && Math.abs(home.au[1] / home.plain[1] - 1.2) < .03 && home.homes.join() === 'gatelands,mark,mark,gatelands,,' && Math.abs(home.glMarket / home.plain[0] - .765) < .02, home);
// S2647: market day's stalls (#1971 B). On Stoneday 7–15 Dunmore keeps 4 + prosperity ÷ 25 stalls, each a keeper on the square with a
// counter of 4 to 7 rows of food, remedies or odds and ends, seeded by the town and the week; the market's prices hold at a stall; its
// residents keep the square from 7; the next day the stalls are gone.
const stalls = await page.evaluate(() => { const set = (d, h) => { worldState.gameTimeAbsMinutes = 1440 * d + h * 60; worldState.gameTimeMinutes = h * 60; };
  const S = WORLD.settle.get('dunmore'), t = S.site; px = t.x + 3; pz = t.z + 3; const o = {};
  const tick = () => { _mstallT = 0; tickMarketStalls(); return [...MSTALLS.values()].filter(D => D.site === 'dunmore'); };
  set(1, 10); const L = tick(); o.n = L.length; o.want = 4 + Math.floor(prosperity(t) / 25); o.onSquare = L.every(D => Math.hypot(D.npc.g.position.x - t.x, D.npc.g.position.z - t.z) < 16);
  o.npcs = L.every(D => npcs.includes(D.npc) && D.npc.def.topics.some(c => c.trade));
  // S2696 — each stall's keeper has a name of their own: none twice on the square, none a keeper's, resident's or townsperson's of the town;
  // past the bank's free names (Dunmore leaves 5 of 24 for 6 stalls) only as many as it is short; the same names when drawn again
  { const first = D => String(D.npc.def.name).split(' ')[0], nm = L.map(first), town = marketTownNames(t);
    const [ci, cj] = cellOf(t.x, t.z), bank = NAMES[PEOPLES[nationOf(ci, cj).people].names] || NAMES.irish, free = bank.m.concat(bank.f || []).filter(x => !town.has(x)).length;
    o.names = { nm, distinct: new Set(nm).size === nm.length, clash: nm.filter(x => town.has(x)), town: town.size, free,
      again: L.map((D, i) => marketStallDraw(t, i).nm).join() === nm.join() }; }
  const ch0 = currentHouse; L[0].npc.def.topics.find(c => c.trade).fn(); const H = currentHouse; o.house = { name: H.name, keeper: H.keeper, rows: H.pack.length };
  o.same = JSON.stringify(marketStallPack(t, 0, 5).rows.map(r => r.name)) === JSON.stringify(marketStallPack(t, 0, 5).rows.map(r => r.name));
  o.weeks = new Set([0, 1, 2, 3, 4, 5].map(w => marketStallPack(t, 0, w).trade + marketStallPack(t, 0, w).rows.map(r => r.name).join())).size;
  o.rowsOk = L.every((D, i) => { const P = marketStallPack(t, i, marketWeek()); return P.rows.length >= 4 && P.rows.length <= 7 && MSTALL_TRADES.includes(P.trade); });
  const it = { buyPrice: 100, type: 'misc' }; o.b1 = shopCost(it); set(2, 10); o.b0 = shopCost(it); currentHouse = ch0;
  const res = S.residents[0], fake = { def: res.def, _settle: S, sched: { type: 'resident', door: res.door, plaza: { x: t.x, z: t.z }, padR: 20, inn: S.innDoor } };
  set(1, 8); const a = scheduleFor(fake, 8); set(2, 8); const b = scheduleFor(fake, 8); o.res8 = [a.work || (a.wander ? 'sq' : '?'), b.work || (b.wander ? 'sq' : '?')];
  set(2, 10); o.after = tick().length; set(1, 15.5); o.late = tick().length; return o; });
console.log(JSON.stringify(stalls));
check('market day: Dunmore keeps 4 + prosperity ÷ 25 stalls on its square, each a keeper with a counter of 4 to 7 rows by town and week, at the market\'s price; gone after', stalls.n === stalls.want && stalls.n >= 4 && stalls.onSquare && stalls.npcs && stalls.house.rows >= 4 && stalls.same && stalls.weeks >= 3 && stalls.rowsOk && Math.abs(stalls.b1 / stalls.b0 - .9) < .02 && stalls.after === 0 && stalls.late === 0, stalls);
check(`market day's keepers each have a name of their own (${stalls.names.nm.join(', ')}): none twice, none of the ${stalls.names.town} names over the town's doors and posts while the bank has ${stalls.names.free} free, the same when drawn again (S2696)`,
  stalls.names.distinct && stalls.names.clash.length === Math.max(0, stalls.names.nm.length - stalls.names.free) && stalls.names.town >= 10 && stalls.names.again, stalls.names);
check('market day fills the square from 7: a resident who works at eight on another day is on the square at eight on Stoneday', stalls.res8[0] === 'sq' && stalls.res8[1] !== 'sq', stalls.res8);
// S2650: the knock (Michael's A on #2009). E at a shut shop knocks first: from 21 until the trade opens the keeper is home, and with the
// town's favour at 2 or more comes down and sells at the door at ×1.25; below 2, *Come back at <its hour>*; between its close and 21 nobody
// answers (the keeper is at the inn). For a few seconds after, E picks the lock.
const knock = await page.evaluate(() => { const set = (d, h) => { worldState.gameTimeAbsMinutes = 1440 * d + h * 60; worldState.gameTimeMinutes = h * 60; };
  const S = WORLD.settle.get('dunmore'), h = S.houses.find(x => ['misc', 'potion', 'weapon', 'armor'].includes(x.type) && x.keeper); const o = { type: h.type };
  const msgs = [], m0 = showMsg; showMsg = (t) => msgs.push(t); const F = worldState.favor || (worldState.favor = {}), f0 = F.dunmore; px = h.doorX; pz = h.doorZ + .3;
  const it = { buyPrice: 100, type: 'misc' };
  try {
    set(2, 23); F.dunmore = 0; KNOCK.id = null; o.lk = WORLD.doorLockNow(h); o.p0 = knockPrompt(h, o.lk);
    o.k1 = knockDoor(h); o.say1 = msgs.at(-1); o.p1 = knockPrompt(h, o.lk); o.k2 = knockDoor(h); o.shop1 = shopOpen;
    KNOCK.id = null; set(2, 19.5); o.k3 = knockDoor(h); o.say3 = msgs.at(-1); o.shop3 = shopOpen;
    KNOCK.id = null; set(2, 23); F.dunmore = 2; o.k4 = knockDoor(h); o.say4 = msgs.at(-1); o.shop4 = shopOpen && currentHouse === h;
    o.at = shopCost(it); closeShop(); o.after = shopCost(Object.assign({}, it)); o.p5 = knockPrompt(h, WORLD.doorLockNow(h)); o.k5 = knockDoor(h);
    set(2, 12); o.dayLock = WORLD.doorLockNow(h); o.dayKnock = knockDoor(h);
    o.refuse = keeperVoice(h, 'refuse', h.keeper); o.voices = ['gatelander', 'markman', 'aurennais', 'oldblood', 'nobody'].map(p => [keeperVoice({ people: p }, 'shut', 'K', 'nine'), keeperVoice({ people: p }, 'refuse', 'K')]);
  } finally { showMsg = m0; F.dunmore = f0; KNOCK.id = null; if (shopOpen) closeShop(); }
  return o; });
console.log(JSON.stringify(knock));
const opensWord = ['midnight','one','two','three','four','five','six','seven','eight','nine','ten'][knock.lk && knock.lk.opens];
check('the knock: E at a shut shop knocks; at favour 0 the Gatelander keeper says the door opens at its hour, and E again picks', knock.lk && knock.lk.kind === 'shop' && /E to knock/.test(knock.p0) && knock.k1 === true && knock.say1.includes(`through the door: “The door opens at ${opensWord}, and it opens no sooner for the knocking.”`) && /E again to pick the lock/.test(knock.p1) && knock.k2 === false && !knock.shop1, knock);
check('the knock: in the evening nobody answers; at favour 2 the keeper comes down and sells at ×1.25 at the door, and the price is the plain one after', knock.k3 && /Nobody answers/.test(knock.say3) && !knock.shop3 && knock.k4 && /comes down/.test(knock.say4) && knock.shop4 && Math.abs(knock.at / knock.after - 1.25) < .02 && /E again/.test(knock.p5) && knock.k5 === false && !knock.dayLock && knock.dayKnock === false, knock);
// S2688: Finding 57 (quest review run 58): the shut door's answer and a known thief's refusal in the keeper's people's voice, word for word
const V = knock.voices || [];
check('Finding 57: the knock\'s answer and the refusal follow the keeper\'s people (four voices; anything else a Gatelander\'s; Dunmore\'s keeper a Gatelander)',
  V.length === 5 && V[1][0] === 'K, through the door: “Shut. Come back at nine.”' && V[2][0] === 'K, through the door: “The house opens at nine, Master. Until then it is, regrettably, closed.”' && V[3][0] === 'K, through the door: “At nine. Not before.”'
  && V[0][1] === 'K: “A hand that’s been in my till won’t be shaken at my counter. Go on with you.”' && V[1][1] === 'K: “I know what you did. Get out.”'
  && V[2][1] === 'K: “This house no longer extends you terms, Master. You will find the reason in your own account.”' && V[3][1] === 'K: “You took. You do not come in.”'
  && V[4][0] === V[0][0] && V[4][1] === V[0][1] && knock.refuse && knock.refuse.endsWith('Go on with you.”'), V);
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
