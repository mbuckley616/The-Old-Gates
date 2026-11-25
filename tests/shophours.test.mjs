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
  const f = k('weapon'), m = k('misc'), r = S.npcs.find(n => n.sched && n.sched.type === 'resident' && dayShare(n) >= .6); /* S2632: one who goes in at 17 */
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
// S2641: market day (#1971 B). The Gatelands' is Stoneday (days 1, 8, 15 …), 7 to 15, in a town, port or city and not a village or a town
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
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
