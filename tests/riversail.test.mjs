// A ship up a great river (Session 433; Michael's C on #112: navigable by boat). The routed channels sixteen units wide
// or more are carved to a ship's depth; this spawns the ship at the mouth of the longest navigable river, takes the
// helm, and steers her up the centreline to the first fork, counting every time she strikes the shallows. The ship's
// aground test is the game's own (the bow probe reads worldH), so a clean run is the channel's proof.
import { boot, check } from './lib/game.mjs';
const g = await boot(); const { page } = g;
await g.intoWorld();
const plan = await page.evaluate(() => {
  WORLD.rawH(1, 1); const RV = WORLD.routed;
  // the longest run of navigable reaches from a mouth upstream: follow the stem while the reach is sixteen wide
  const cands = RV.great.map(gr => { const run = []; for (const r of gr.stem) { if (r.ws[r.ws.length - 1] < 16) break; run.push(r); } const len = run.reduce((s, r) => s + r.pts.reduce((q, p, i) => i ? q + Math.hypot(p[0] - r.pts[i - 1][0], p[1] - r.pts[i - 1][1]) : 0, 0), 0); return { gr, run, len }; }).filter(c => c.run.length).sort((a, b) => b.len - a.len);
  const c = cands[0]; const chaikin = (p) => { const o = [p[0]]; for (let i = 0; i < p.length - 1; i++) { const a = p[i], b = p[i + 1]; o.push([a[0] * .75 + b[0] * .25, a[1] * .75 + b[1] * .25]); o.push([a[0] * .25 + b[0] * .75, a[1] * .25 + b[1] * .75]); } o.push(p[p.length - 1]); return o; };
  // from the mouth up the first reach to its fork, along the carve's own centreline (the pieces are the reach smoothed once)
  const first = c.run[0]; const pts = chaikin(first.pts).reverse();
  const way = []; for (const p of pts) if (!way.length || Math.hypot(p[0] - way[way.length - 1][0], p[1] - way[way.length - 1][1]) > 20) way.push(p);
  const top = first; const fork = first.pts[0]; const reachLen = first.pts.reduce((q, p, i) => i ? q + Math.hypot(p[0] - first.pts[i - 1][0], p[1] - first.pts[i - 1][1]) : 0, 0);
  return { name: c.gr.name, reaches: c.run.length, len: Math.round(c.len), reachLen: Math.round(reachLen), forkEnd: first.end, way, fork, wMouth: +c.gr.wMouth.toFixed(1), wTop: +top.ws[0].toFixed(1) };
});
console.log(JSON.stringify({ name: plan.name, reaches: plan.reaches, len: plan.len, reachLen: plan.reachLen, forkEnd: plan.forkEnd, waypoints: plan.way.length, wMouth: plan.wMouth, wTop: plan.wTop }));
check('a great river a ship can enter runs a kilometre or more at sixteen wide, and its first reach from the sea ends at a fork', plan.len >= 1000 && plan.wTop >= 16 && plan.reaches > 1, `${plan.name}: ${plan.len}u over ${plan.reaches} reaches, ${plan.wTop}u at the top; the first reach ${plan.reachLen}u up to the fork`);
const sail = await page.evaluate((plan) => {
  const way = plan.way; const SHIP = WORLD.ship;
  // spawn her two boat-lengths out from the mouth, pointing upstream, and take the helm
  const m = way[0], n1 = way[1]; const dx = n1[0] - m[0], dz = n1[1] - m[1], L = Math.hypot(dx, dz) || 1;
  const sx = m[0] - dx / L * 30, sz = m[1] - dz / L * 30; const yaw0 = Math.atan2(-dx, -dz);
  WORLD.devUnlockAll(); worldState.ship = worldState.ship || {}; WORLD.spawnShip(sx, sz, yaw0); SHIP.sailing = true; SHIP.speed = 0;
  { const wx = WORLD.wx; wx.type = 'clear'; wx.next = 'clear'; wx.k = 1; } // a calm sea: the test is the channel, not the weather's wear
  const others = []; const shoo = () => { for (const o of WORLD.others) { if (Math.hypot(o.x - SHIP.x, o.z - SHIP.z) < 400) { others.push([o.kind || o.look || '?', Math.round(o.x), Math.round(o.z)]); o.x += 2000; o.z += 2000; } } }; // other hulls are moved off: a ram is not the channel's fault
  window.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyW' }));
  const msgs = []; const oldShow = window.showMsg; window.showMsg = (t, c) => { msgs.push(t); return oldShow(t, c); };
  let k = 1, ticks = 0, aground = 0, stops = 0, minH = 1e9, maxH = -1e9; const dt = 1 / 30; const trail = [];
  const t0 = performance.now();
  const budget = Math.round((plan.reachLen / 7.5 + 60) * 30 * 1.5); // the reach at her top speed, a minute to get going, half again for the bends
  for (; ticks < budget; ticks++) {
    // steer at the next waypoint; pass it at 14u
    while (k < way.length - 1 && Math.hypot(way[k][0] - SHIP.x, way[k][1] - SHIP.z) < 14) k++;
    const tx = way[k][0] - SHIP.x, tz = way[k][1] - SHIP.z; SHIP.yaw = Math.atan2(-tx, -tz);
    shoo(); const before = SHIP.speed; WORLD.tick(dt, performance.now()); if (before > 1 && SHIP.speed === 0) stops++;
    const h = WORLD.worldH(SHIP.x, SHIP.z); if (h < minH) minH = h; if (h > maxH) maxH = h;
    if (ticks % 60 === 0) trail.push([Math.round(SHIP.x), Math.round(SHIP.z), +h.toFixed(1)]);
    if (Math.hypot(plan.fork[0] - SHIP.x, plan.fork[1] - SHIP.z) < 30) break;
    if (!SHIP.mesh || WORLD.shipBars().hull < 100) { trail.push(['hurt', Math.round(SHIP.x), Math.round(SHIP.z), WORLD.shipBars().hull, k]); break; }
    if (performance.now() - t0 > 240000) break;
  }
  aground = msgs.filter(t => /Aground/.test(t)).length; window.showMsg = oldShow; window.dispatchEvent(new KeyboardEvent('keyup', { code: 'KeyW' }));
  const left = Math.hypot(plan.fork[0] - SHIP.x, plan.fork[1] - SHIP.z);
  return { ticks, budget, aground, stops, others: others.slice(0, 4), sea: WORLD.seaState(), minH: +minH.toFixed(1), maxH: +maxH.toFixed(1), left: Math.round(left), at: [Math.round(SHIP.x), Math.round(SHIP.z)], speed: +SHIP.speed.toFixed(1), hull: WORLD.shipBars().hull, secs: Math.round((performance.now() - t0) / 1000), trail: trail.slice(-6), k, n: way.length };
}, plan);
console.log(JSON.stringify(sail));
check(`she sails from the sea up ${plan.name} (${plan.reachLen}u) to its first fork without striking the shallows`, sail.left <= 30 && sail.aground === 0 && sail.stops === 0, JSON.stringify(sail));
check('the water under her keel stays a ship’s depth the whole way', sail.maxH < -1.4, `shallowest ${sail.maxH}`);
check('her hull is whole', sail.hull >= 100, sail.hull);
check('no page errors', g.errs.length === 0, g.errs.join(' | '));
await g.close();
