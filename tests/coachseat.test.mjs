// A seat held on the coach (Session 267, Michael's A on issue #31): the coaching inn's keeper takes your name for the next
// coach to call, for nothing. That coach waits at the inn for you, up to an hour past its call; it goes on when you board
// or when the hour is up. The coach stands still while you are indoors, so a seat is also settled when you come out.
import { boot, check } from './lib/game.mjs';
const g = await boot(); const { page } = g;
await g.intoWorld(); await g.settle('dunmore');
const setup = await page.evaluate(() => {
  worldState.lairs = new Proxy({}, { get: () => true }); worldState.routes = {};
  const C0 = WORLD.coaches(); let key = null, line = null; const town = s => s && /town|city|port/.test(s.kind);
  for (const d of WORLD.ROAD_DEFS) { const a = WORLD.siteAnywhere(d.a), b = WORLD.siteAnywhere(d.b); if (!town(a) || !town(b)) continue;
    const k = d.a < d.b ? d.a + '|' + d.b : d.b + '|' + d.a; C0[k] = { a: d.a, b: d.b }; px = (a.x + b.x) / 2; pz = (a.z + b.z) / 2;
    WORLD.tick(1 / 60, performance.now()); const C = WORLD.coachLines.get(k); if (C) { key = k; line = C; break; } delete C0[k]; }
  const h = ZONES.world.houses.find(x => x.coachInn === key); window._ci = h; window._key = key;
  // stand by the inn's door, off the road
  px = h.exitX; pz = h.exitZ; jumpY = WORLD.worldH(px, pz);
  window._step = (sec, dt = .25) => { const C = WORLD.coachLines.get(_key); for (let t = 0; t < sec; t += dt) { worldState.gameTimeAbsMinutes += dt; worldState.gameTimeMinutes = (worldState.gameTimeMinutes + dt) % 1440; WORLD.tick(dt, performance.now()); } return C; };
  window._topic = re => h.dlg.topics.find(t => re.test(t.label));
  return { key, inn: h.name }; });
check('a coaching road with its inn', !!setup.key, setup);

// 1. no seat: the coach stands a quarter of an hour and goes on
const plain = await page.evaluate(() => { worldState.coachSeat = null; forceTime(5.9); const C = WORLD.coachLines.get(_key); C.u = 0; C.state = 'wait'; C.stopped = false;
  let arrived = null, left = null; for (let k = 0; k < 2400 && left == null; k++) { _step(.5); if (arrived == null && C.state === 'stop') arrived = worldState.gameTimeAbsMinutes; if (arrived != null && C.state === 'run') left = worldState.gameTimeAbsMinutes; }
  return { stood: left - arrived }; });
check('without a seat the coach stands at the inn a quarter of an hour', plain.stood >= 14 && plain.stood <= 16.5, plain);

// 2. take a seat at five in the morning: the six o'clock's call, for the far end
const take = await page.evaluate(() => { forceTime(5); const C = WORLD.coachLines.get(_key); C.u = 0; C.state = 'wait'; C.stopped = false; C.holdTo = 0;
  const t = _topic(/A seat on the next coach/); const line = t && t.fn(); const s = worldState.coachSeat; const now = worldState.gameTimeAbsMinutes;
  const mine = _topic(/My seat on the coach/); return { offered: !!t, line, dir: s && s.dir, inMin: s && Math.round(s.at - now), mine: mine && mine.response }; });
console.log(JSON.stringify(take));
check('the keeper holds a seat for nothing: the next coach to call, the morning one', take.offered && take.dir === 1 && take.inMin > 60 && take.inMin < 60 + 120 && /costs nothing/.test(take.line) && /The 6:\d\d for/.test(take.line) && /Your name/.test(take.mine || ''), take);

// 3. it calls and waits past the quarter hour; you board and it goes on
const held = await page.evaluate(() => { const C = WORLD.coachLines.get(_key); let arrived = null; const g0 = gold;
  for (let k = 0; k < 2400 && arrived == null; k++) { _step(.5); if (C.state === 'stop') arrived = worldState.gameTimeAbsMinutes; }
  _step(40); const still = C.state; px = C.cart.position.x; pz = C.cart.position.z; const boarded = WORLD.coachInteract(); _step(.5); const after = { state: C.state, riding: C.riding, seat: worldState.coachSeat };
  C.riding = false; return { arrived: arrived != null, still, boarded, after, paid: g0 - gold }; });
console.log(JSON.stringify(held));
check('the coach calls, and 40 minutes on it is still at the door', held.arrived && held.still === 'stop', held);
check('you board: the seat is used, the coach goes on, and the ride cost nothing', held.boarded && held.after.riding && held.after.state === 'run' && held.after.seat === null && held.paid === 0, held);

// 4. a seat not taken up: the coach goes after the hour, and the seat with it
const lapse = await page.evaluate(() => { forceTime(5); const C = WORLD.coachLines.get(_key); C.u = 0; C.state = 'wait'; C.stopped = false; C.holdTo = 0; C.riding = false; px = _ci.exitX; pz = _ci.exitZ;
  _topic(/A seat on the next coach/).fn(); const at = worldState.coachSeat.at; let left = null;
  for (let k = 0; k < 4000 && left == null; k++) { const was = C.state; _step(.5); if (was === 'stop' && C.state === 'run') left = worldState.gameTimeAbsMinutes; }
  return { waitedPastCall: left != null ? Math.round(left - at) : null, seat: worldState.coachSeat, msg: document.getElementById('msg') && document.getElementById('msg').textContent }; });
console.log(JSON.stringify(lapse));
check('not taken up, it waits the hour past its call and goes, and the seat is gone', lapse.waitedPastCall >= 55 && lapse.waitedPastCall <= 62 && lapse.seat === null, lapse);

// 5. indoors while it calls: the coach stood still, and on coming out it is at the door, held till the hour is up
const inside = await page.evaluate(() => { forceTime(5); const C = WORLD.coachLines.get(_key); C.u = 0; C.state = 'wait'; C.stopped = false; C.holdTo = 0;
  _topic(/A seat on the next coach/).fn(); const at = worldState.coachSeat.at;
  const skip = at + 20 - worldState.gameTimeAbsMinutes; worldState.gameTimeAbsMinutes += skip; worldState.gameTimeMinutes = (worldState.gameTimeMinutes + skip) % 1440; // an hour and more in the inn, the world not ticking
  _step(.25); const out = { u: C.u, state: C.state }; _step(30); const at50 = C.state; _step(15); const at65 = C.state;
  return { out, at50, at65, seat: worldState.coachSeat }; });
console.log(JSON.stringify(inside));
check('out of the inn twenty minutes past its call: the coach is at the door', inside.out.u === .5 && inside.out.state === 'stop', inside);
check('it waits to the hour and then goes, with the seat', inside.at50 === 'stop' && inside.at65 === 'run' && inside.seat === null, inside);
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
