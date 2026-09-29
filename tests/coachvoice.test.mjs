// The coaching inn in the voice of its keeper's people (Session 315; the quest review's Finding 4, run 2). The keeper,
// the driver and the travellers used to speak Markish on every road; now their lines follow the keeper's people, with
// Markish (today's text) the fallback.
import { boot, check } from './lib/game.mjs';
const g = await boot(); const { page } = g;
await g.intoWorld(); await g.settle('dunmore');
const EXPECT = {
  gatelander: { greet: 'The fire\'s lit, and there\'s a chair by it with nobody\'s name on it.', place: 'A house on a road is only ever half a house', seat: 'it\'ll cost you nothing but being there', held: 'a name given is a name kept', driver: 'The horses first, then me, and then whoever\'s left.', trav: 'Waiting on the coach, same as yourself. A watched road never brings it.' },
  markman: { greet: 'Fire\'s lit. Take a seat.', place: 'The coach stops, we feed whoever gets off, and the horses drink.', seat: 'It\'s yours, and it costs nothing; the driver knows to wait. An hour, no more.', held: 'Your name\'s on it. If you\'re not at the door when it calls, it waits — an hour, no more.', driver: 'Horses first, then me.', trav: 'Waiting on the coach, same as you.' },
  aurennais: { greet: 'Be welcome, Master. The fire is lit, and the seats by it are free.', place: 'under the road\'s contract', seat: 'The seat is entered at no charge', held: 'Your name is entered.', driver: 'The horses are seen to first, Master, and then the passengers.', trav: 'Waiting on the coach, as are you. It is posted for six.' },
  oldblood: { greet: 'The fire is lit. Sit.', place: 'The coach stops. We feed who gets off. The horses drink.', seat: 'Yours, and no charge. It waits an hour, no more.', held: 'Your name is on it. It waits an hour.', driver: 'Horses first.', trav: 'Waiting.' } };
const r = await page.evaluate(() => {
  forceTime(13); worldState.lairs = new Proxy({}, { get: () => true }); worldState.routes = {};
  const C0 = WORLD.coaches(); const town = s => s && /town|city|port/.test(s.kind); const out = [];
  for (const d of WORLD.ROAD_DEFS) { const a = WORLD.siteAnywhere(d.a), b = WORLD.siteAnywhere(d.b); if (!town(a) || !town(b)) continue;
    const k = d.a < d.b ? d.a + '|' + d.b : d.b + '|' + d.a; C0[k] = { a: d.a, b: d.b }; px = (a.x + b.x) / 2; pz = (a.z + b.z) / 2;
    WORLD.tick(1 / 60, performance.now());
    const h = ZONES.world.houses.find(x => x.coachInn === k); if (!h || !h.dlg) continue;
    const T = h.dlg.topics; const place = T.find(t => t.label === 'What is this place?'); const seat = T.find(t => t.label === 'A seat on the next coach?');
    worldState.coachSeat = null; const seatText = seat && seat.fn ? seat.fn() : null; const held = h.dlg.topics.find(t => t.label === 'My seat on the coach?'); worldState.coachSeat = null;
    WORLD.buildInteriorFor(h); const folk = (WORLD.intNpcs || []).map(n => ({ role: n.def.role, greet: n.def.greeting[0] }));
    out.push({ key: k, people: h.dlg.people, greet: h.dlg.greeting[0], place: place && place.response, seat: seatText, held: held && held.response, folk });
    if (out.length >= 12) break; }
  return out; });
console.log(JSON.stringify(r.map(x => [x.key, x.people, x.folk.length])));
const peoples = [...new Set(r.map(x => x.people))];
check('coaching inns were raised (a dozen roads at most)', r.length >= 2, r.length);
for (const p of peoples) { const E = EXPECT[p] || EXPECT.markman; const mine = r.filter(x => x.people === p);
  check(`${p}: the keeper greets in the people's voice`, mine.every(x => x.greet === E.greet), mine.map(x => x.greet));
  check(`${p}: *What is this place?* and the seat are in the same voice`, mine.every(x => x.place.includes(E.place) && x.seat.includes(E.seat) && x.held && x.held.includes(E.held)), mine.map(x => [x.place, x.seat, x.held]));
  const withFolk = mine.filter(x => x.folk.length);
  check(`${p}: the driver and the travellers too`, withFolk.length > 0 && withFolk.every(x => x.folk.some(f => f.role === 'Coach Driver' && f.greet === E.driver) && x.folk.filter(f => f.role === 'Traveller').every(f => f.greet === E.trav)), withFolk.map(x => x.folk)); }
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
