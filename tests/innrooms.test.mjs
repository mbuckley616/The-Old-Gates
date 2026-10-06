// Inn rooms (Session 141, backlog G: rent a room, sleep in it, try another guest's door). Session 424 measured it in every
// inn of Dunmore and Portclare and a coaching inn, over several nights, and found the keeper's directions mirrored: the
// rooms stand in one row behind the gallery and you come up the stair facing their doors, so from a west stair every door
// is on your right and from an east stair on your left, but the names ran left, right, left from room 0 wherever the stair
// was. And on a night he said *the house is empty*, the empty room still turned you away as *another guest's*.
import { boot, check } from './lib/game.mjs';
const g = await boot(); const { page } = g;
await g.intoWorld();

const ORD = ['first', 'second', 'third', 'fourth', 'fifth', 'sixth'];
// in the page: what the keeper says about a bed for the night on day `day`, renting if `rent`
const ask = (sel, day, rent) => page.evaluate(([sel, day, rent]) => {
  const h = sel.key ? ZONES.world.houses.find(x => x.coachInn === sel.key) : WORLD.settle.get(sel.town).houses.find(x => x.id === sel.id);
  worldState.rented = null; worldState.gameTimeAbsMinutes = day * 1440 + 20 * 60; worldState.gameTimeMinutes = 20 * 60; gold = 500;
  const bed = h.dlg.topics.find(x => /A bed for the night/.test(x.label)); const offer = bed.response;
  let paid = null; if (rent) { const yes = bed.follow[0]; paid = yes.fn(yes); }
  return { name: h.name, offer, paid, rented: worldState.rented, gold }; }, [sel, day, rent]);
// in the page: the gallery's stair head, its doors and its beds by room, inside the house
const layout = () => page.evaluate(() => {
  const st = FOOTHOLDS.find(f => f.axis === 'z' && f.y0 > 1), gy = st.y0, deck = FOOTHOLDS.find(f => f.x0 === 0 && f.y === gy && f.z0 === 0);
  const W = deck.x1, head = { x: (st.x0 + st.x1) / 2, z: st.z0 };
  const doors = WORLD.intDoors.filter(d => Math.abs((d.y || 0) - gy) < .2).map(d => ({ x: d.x, z: d.z }));
  const rooms = [...new Set(INT_BEDS.filter(b => b.room != null).map(b => b.room))].sort();
  return { W, gy, head, doors, rooms, beds: INT_BEDS.filter(b => b.room != null).map(b => ({ x: b.x, z: b.z, y: b.y, room: b.room })) }; });
// from the layout: what a player coming up the stair, facing the doors (−z, so +x is the right hand), calls room k's door
const seen = (L, k) => { const n = L.rooms.length, xa = k * L.W / n, xb = (k + 1) * L.W / n;
  const d = L.doors.find(d => d.x > xa && d.x < xb); if (!d) return null;
  const order = L.doors.slice().sort((a, b) => Math.abs(a.x - L.head.x) - Math.abs(b.x - L.head.x)).indexOf(d);
  return { side: d.x > L.head.x ? 'right' : 'left', ord: order, n }; };
const named = (text) => { const m = /the (first|second|third|fourth|fifth|sixth|last) door on the (left|right)/i.exec(text || ''); return m ? { ord: m[1].toLowerCase(), side: m[2].toLowerCase() } : null; };
const agrees = (nm, sn) => !!nm && !!sn && nm.side === sn.side && (nm.ord === 'last' ? sn.ord === sn.n - 1 : ORD.indexOf(nm.ord) === sn.ord);
const enter = async (sel) => { await page.evaluate((sel) => { const h = sel.key ? ZONES.world.houses.find(x => x.coachInn === sel.key) : WORLD.settle.get(sel.town).houses.find(x => x.id === sel.id);
  window._innIn = h; px = h.exitX; pz = h.exitZ; goToInterior(h); }, sel);
  // the fade's callback is a 440 ms timer that a busy page can run late (CI, 6 Oct: the beds were read with no house), so
  // wait for the room itself, its house current and its beds laid, not for a fixed time
  await page.waitForFunction(() => currentHouse === window._innIn && INT_BEDS.length > 0, null, { timeout: 60000 }); await g.frames(2); await g.hide(); };
const leave = async () => { await page.evaluate(() => exitInterior()); await page.waitForFunction(() => currentHouse == null, null, { timeout: 60000 }); await g.frames(2); await g.hide(); };
// in the page, inside: each gallery bed's prompt and what E does there (sleeps, or the message it turns you away with)
const tryBeds = () => page.evaluate(() => { const out = []; const _m = showMsg; let said = null; showMsg = (t) => { said = t; };
  try { for (const b of INT_BEDS.filter(b => b.room != null)) { px = b.x; pz = b.z; jumpY = b.y || 0; said = null;
    const prompt = WORLD.bedPrompt(b), refused = WORLD.bedInteract(b); out.push({ room: b.room, prompt, sleeps: !refused, said }); } }
  finally { showMsg = _m; } return out; });

const rows = [], refusals = [], counts = [];
const sels = [];
for (const town of ['dunmore', 'portclare']) { await g.settle(town);
  for (const id of await page.evaluate((t) => WORLD.settle.get(t).houses.filter(x => x.type === 'inn' && x.dlg).map(h => h.id), town)) sels.push({ town, id }); }
// a coaching inn, raised on the first town-to-town road with one (as `coachinn` does)
const key = await page.evaluate(() => { worldState.lairs = new Proxy({}, { get: () => true }); worldState.routes = {};
  const C0 = WORLD.coaches(); const town = s => s && /town|city|port/.test(s.kind);
  for (const d of WORLD.ROAD_DEFS) { const a = WORLD.siteAnywhere(d.a), b = WORLD.siteAnywhere(d.b); if (!town(a) || !town(b)) continue;
    const k = d.a < d.b ? d.a + '|' + d.b : d.b + '|' + d.a; C0[k] = { a: d.a, b: d.b }; px = (a.x + b.x) / 2; pz = (a.z + b.z) / 2;
    WORLD.tick(1 / 60, performance.now()); if (WORLD.coachLines.get(k) && ZONES.world.houses.find(x => x.coachInn === k)) return k; delete C0[k]; }
  return null; });
if (key) sels.push({ key });

for (const sel of sels) {
  if (sel.town) await g.settle(sel.town); else await page.evaluate((k) => { const h = ZONES.world.houses.find(x => x.coachInn === k); px = h.exitX; pz = h.exitZ + 3; }, sel.key);
  await enter(sel); const L = await layout(); await leave();
  const n = L.rooms.length; const inn = await page.evaluate((sel) => { const h = sel.key ? ZONES.world.houses.find(x => x.coachInn === sel.key) : WORLD.settle.get(sel.town).houses.find(x => x.id === sel.id); return h.name; }, sel);
  counts.push({ inn, n, doors: L.doors.length, stair: L.head.x < L.W / 2 ? 'west' : 'east' });
  // six nights: the offer and its name, against the door the player would reach
  for (let day = 1; day <= 6; day++) {
    const r = await ask(sel, day, true); const k = r.rented && r.rented.room;
    const sn = seen(L, k), nmOffer = named(r.offer), nmPaid = named(r.paid);
    const guests = /empty tonight/.test(r.offer) ? 0 : /one other guest|one other tonight/i.test(r.offer) ? 1 : +((/(\d+) (?:guests (?:in|are entered)|others) tonight/.exec(r.offer) || [])[1] || -1);
    rows.push({ inn, day, n, room: k, guests, seen: sn, offer: nmOffer, paid: nmPaid, ok: agrees(nmOffer, sn) && agrees(nmPaid, sn), cost: 500 - r.gold, coach: !!sel.key });
  }
  // the last night's rent: inside, every bed of the gallery, then a night's sleep in your own
  const last = rows[rows.length - 1]; await ask(sel, 6, true); await enter(sel);
  const beds = await tryBeds(); refusals.push({ inn, room: last.room, guests: last.guests, n, beds });
  if (refusals.length === 1) {
    const sl = await page.evaluate(async () => { const b = INT_BEDS.find(b => b.room === worldState.rented.room); px = b.x; pz = b.z; jumpY = b.y || 0;
      const t0 = worldState.gameTimeAbsMinutes; interact(); const opened = sleepOpen; document.getElementById('sleep-go').click();
      await new Promise(r => setTimeout(r, 3500)); return { opened, slept: Math.round(worldState.gameTimeAbsMinutes - t0), indoors: isInterior(), stillMine: WORLD.bedPrompt(b) }; });
    refusals[0].sleep = sl;
    const after = await page.evaluate(() => { worldState.gameTimeAbsMinutes = worldState.rented.until + 1; const b = INT_BEDS.find(b => b.room === worldState.rented.room); return WORLD.bedPrompt(b); });
    refusals[0].expired = after;
  }
  await leave();
}
for (const r of rows) console.log(JSON.stringify(r));
for (const r of refusals) console.log(JSON.stringify(r));
console.log(JSON.stringify(counts));

check('every inn in Dunmore and Portclare, and a coaching inn, has its rooms and a door to each', counts.length >= 3 && !!key && counts.every(c => c.n >= 1 && c.doors === c.n), counts);
check('both stair sides are among them', counts.some(c => c.stair === 'west') && counts.some(c => c.stair === 'east'), counts);
check('every night, the room the keeper names (offer and receipt) is the door you reach from the stair head: its side and its count from the stair',
  rows.every(r => r.ok), rows.filter(r => !r.ok));
check('the coaching inn lets its one room, the far end of the row (travellers hold the rest)', rows.filter(r => r.coach).every(r => r.room === r.n - 1 && r.guests === r.n - 1), rows.filter(r => r.coach));
const bad = [];
for (const f of refusals) for (const b of f.beds) {
  const mine = b.room === f.room, guest = b.room < f.guests;
  const right = mine ? (b.sleeps && /Your room/.test(b.prompt)) : guest ? (!b.sleeps && b.prompt === "Another guest's room" && /^Another guest's room\. Yours is the /.test(b.said))
    : (!b.sleeps && b.prompt === 'Not your room' && /^An empty room, not the one you took\. Yours is the /.test(b.said));
  if (!right) bad.push({ inn: f.inn, room: f.room, guests: f.guests, b }); }
check('inside, your own beds sleep you; another guest\'s turn you away as theirs; a room nobody has taken is not called another guest\'s', bad.length === 0, bad);
check('the nights include an empty house with a room standing empty, and a guest\'s room', refusals.some(f => f.beds.some(b => b.room !== f.room && b.room >= f.guests)) && refusals.some(f => f.beds.some(b => b.room < f.guests)), refusals.map(f => ({ inn: f.inn, room: f.room, guests: f.guests })));
const s0 = refusals[0].sleep;
check('E at your own bed opens the sleep, eight hours pass (and the minute or so the fade runs), you wake in the room and it is still yours', s0 && s0.opened && s0.slept >= 480 && s0.slept < 490 && s0.indoors && /Your room/.test(s0.stillMine), s0);
check('when the night you paid for has run out, the bed is the innkeeper\'s to let again', /Ask the innkeeper for a room/.test(refusals[0].expired || ''), refusals[0].expired);
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
