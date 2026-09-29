// The caravan attacked on the road (Session 179, Michael's answer B on issue #18). A camp near the road sets a threat
// for the day; at its hour, if you are by the caravan, three or four bandits fall on it, the cart goes over and the
// merchant runs. Kill them and the route holds that day; walk off, or be elsewhere at the hour, and it breaks as
// before, leaving the overturned cart on the road until the route is reopened.
import { boot, check } from './lib/game.mjs';
const g = await boot(); const { page } = g;
await g.intoWorld(); await g.settle('dunmore');

const r = await page.evaluate(() => {
  // no real camp threatens any road for this test: the threats are set by hand
  worldState.lairs = new Proxy({}, { get: () => true }); worldState.routes = {};
  const R = WORLD.routes(); const town = s => s && /town|city|port/.test(s.kind);
  const tick = n => { for (let i = 0; i < n; i++) { advanceClock(1 / 60); WORLD.tick(1 / 60, performance.now()); } };
  const setTime = m => { worldState.gameTimeAbsMinutes = m; worldState.gameTimeMinutes = m % 1440; };
  let key = null, C = null, a = null, b = null;
  for (const d of WORLD.ROAD_DEFS) { a = WORLD.siteAnywhere(d.a); b = WORLD.siteAnywhere(d.b); if (!town(a) || !town(b)) continue;
    const k = d.a < d.b ? d.a + '|' + d.b : d.b + '|' + d.a; R[k] = { a: d.a, b: d.b, opened: 0, broken: false };
    px = (a.x + b.x) / 2; pz = (a.z + b.z) / 2; tick(1); C = WORLD.caravans.get(k); if (C) { key = k; break; } delete R[k]; }
  if (!C) return { key: null };
  const pts = C.road.pts; const at = u => { const fi = u * (pts.length - 1), i0 = Math.min(pts.length - 2, Math.floor(fi)), f = fi - i0; return { x: pts[i0].x + (pts[i0 + 1].x - pts[i0].x) * f, z: pts[i0].z + (pts[i0 + 1].z - pts[i0].z) * f }; };
  const day0 = 40, F = .25;
  const alive = () => WORLD.caravans.get(key);
  const fresh = () => { R[key] = { a: R[key].a, b: R[key].b, opened: 0, broken: false }; };
  // 1. defended: stand by the caravan at its hour, kill the bandits
  const p = at(2 * F); px = p.x + 3; pz = p.z;
  setTime(day0 * 1440 + (F - .002) * 1440); tick(1); fresh(); R[key].threat = { day: day0, camp: 'Test Camp', f: F, won: false, started: false }; tick(2);
  const before = { x: alive().npc.g.position.x, z: alive().npc.g.position.z };
  tick(12 * 60); alive().cart.updateMatrixWorld();
  const A = alive() && alive().attack; const E = A ? A.enemies : [];
  const attack = { started: R[key].threat.started, n: E.length, alert: E.every(e => e.alert), cartTilt: +alive().cart.matrixWorld.elements[5].toFixed(2), fled: +Math.hypot(alive().npc.g.position.x - before.x, alive().npc.g.position.z - before.z).toFixed(1), broken: R[key].broken };
  E.forEach(e => { if (!e.dead) killZoneEnemy(e, WORLD.scene); }); tick(3);
  alive().cart.updateMatrixWorld();
  const won = { won: R[key].threat && R[key].threat.won, broken: R[key].broken, cartTilt: +alive().cart.matrixWorld.elements[5].toFixed(2), lag: +(alive().lagF * 1440).toFixed(1) };
  // the caravan makes up its lost minutes
  const mv0 = { x: alive().npc.g.position.x, z: alive().npc.g.position.z }; tick(60 * 10);
  const moving = +Math.hypot(alive().npc.g.position.x - mv0.x, alive().npc.g.position.z - mv0.z).toFixed(1), lagAfter = +(alive().lagF * 1440).toFixed(1);
  // the day tick after a defended day: the route stands and pays
  setTime((day0 + 1) * 1440 + 1); tick(1);
  const nextDay = { broken: R[key].broken, threat: !!R[key].threat };
  // 2. walked away: the attack springs, then you leave with the bandits alive
  px = p.x + 3; pz = p.z; setTime((day0 + 1) * 1440 + (F - .002) * 1440); tick(1);
  fresh(); R[key].threat = { day: day0 + 1, camp: 'Test Camp', f: F, won: false, started: false }; tick(6 * 60);
  const sprang = !!(alive() && alive().attack); px = p.x + 300; pz = p.z; tick(2);
  const left = { sprang, broken: R[key].broken, by: R[key].by, wreck: !!R[key].wreck, wreckMesh: !!WORLD.wrecks.get(key), caravan: !!alive() };
  if (WORLD.wrecks.get(key)) WORLD.wrecks.get(key).updateMatrixWorld(), left.wreckTilt = +WORLD.wrecks.get(key).matrixWorld.elements[5].toFixed(2);
  // 3. reopened: the wreck goes
  fresh(); tick(2); const reopened = { wreckMesh: !!WORLD.wrecks.get(key), caravan: !!alive() };
  // 4. elsewhere at the hour: on the road but 200 units from the caravan
  px = p.x + 200; pz = p.z; setTime((day0 + 2) * 1440 + (F - .002) * 1440); tick(1);
  fresh(); R[key].threat = { day: day0 + 2, camp: 'Test Camp', f: F, won: false, started: false }; tick(6 * 60);
  const away = { broken: R[key].broken, wreck: R[key].wreck && +Math.hypot(R[key].wreck.x - p.x, R[key].wreck.z - p.z).toFixed(1), anyBandits: ZONES.world.enemies.filter(e => e._caravan === key && !e.dead).length };
  // 5. asleep through the hour: the next day tick breaks it
  fresh(); R[key].threat = { day: day0 + 3, camp: 'Test Camp', f: F, won: false, started: false };
  setTime((day0 + 4) * 1440 + 1); tick(1);
  const slept = { broken: R[key].broken, by: R[key].by };
  return { key, len: pts.length, attack, won, moving, lagAfter, nextDay, left, reopened, away, slept };
});
console.log(JSON.stringify(r));
check('a trade route and its caravan were raised', !!r.key, r);
check('at the hour, by the caravan: 3–4 alert bandits fall on it, the cart goes over, the merchant runs', r.attack && r.attack.started && r.attack.n >= 3 && r.attack.n <= 4 && r.attack.alert && Math.abs(r.attack.cartTilt) < .1 && r.attack.fled > 20 && !r.attack.broken, r.attack);
check('killing them keeps the route; the cart is righted and the caravan is late', r.won && r.won.won && !r.won.broken && r.won.cartTilt > .99 && r.won.lag > 0, r.won);
check('the caravan goes on and makes the time up', r.moving > 1 && r.lagAfter < r.won.lag, { moving: r.moving, lagAfter: r.lagAfter });
check('the next day tick: the route stands', r.nextDay && !r.nextDay.broken && !r.nextDay.threat, r.nextDay);
check('walking off with the bandits alive breaks it and leaves the overturned cart', r.left && r.left.sprang && r.left.broken && r.left.by === 'Test Camp' && r.left.wreck && r.left.wreckMesh && !r.left.caravan && Math.abs(r.left.wreckTilt) < .1, r.left);
check('reopening the route clears the wreck', r.reopened && !r.reopened.wreckMesh && r.reopened.caravan, r.reopened);
check('elsewhere at the hour: it breaks unseen, wreck at the ambush point, no bandits', r.away && r.away.broken && r.away.wreck < 1 && r.away.anyBandits === 0, r.away);
check('asleep through the hour: the next day tick breaks it', r.slept && r.slept.broken && r.slept.by === 'Test Camp', r.slept);
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
