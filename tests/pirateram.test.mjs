// The pirate's ram (Session 418; and naval combat's hulls, Session 1813; Michael's B on #100, docs/design/sailing.md). Within 30 units, faster than you and with
// her ram ready, the black sail steers at your hull; the first touch costs you the closing speed × 3 (half if your bow is
// on her) and spends it, and she goes back to her circle. She may ram again 30 s later; a run that has not touched in
// 12 s is given up. Her volleys are held off here so that only rams cost hull.
import { boot, check } from './lib/game.mjs';
const g = await boot(); const { page } = g;
await g.intoWorld();
const stop = g.keepAlive ? g.keepAlive() : null;

const sea = await page.evaluate(() => { const s = WORLD.allPorts().sort((a, b) => Math.hypot(a.x - px, a.z - pz) - Math.hypot(b.x - px, b.z - pz))[0];
  for (let r = 400; r < 4000; r += 40) for (let a = 0; a < 6.28; a += .25) { const x = s.x + Math.cos(a) * r, z = s.z + Math.sin(a) * r;
    if ([[0, 0], [60, 0], [-60, 0], [0, 60], [0, -60]].every(([dx, dz]) => WORLD.worldH(x + dx, z + dz) < -6)) { window._sea = { x, z }; return { x, z }; } } return null; });
check('open sea found', !!sea, sea);

// one run: your sloop held at x,z with speed v at the wheel; a black sail put 29 units off on her circle; T seconds of WORLD.tick
const run = (T, v, opts = {}) => page.evaluate(([T, v, opts]) => {
  for (const o of [...WORLD.others]) WORLD.despawnOtherShip(o);
  worldState.ship = { cls: 'sloop', name: 'Test Gull', sails: 0, cargo: 0, hold: {} }; WORLD.spawnShip(_sea.x, _sea.z, 0); const S = WORLD.ship; S.sailing = !opts.swim; S.speed = v;
  if (opts.swim) { S.sailing = false; px = _sea.x + 20; pz = _sea.z; jumpY = SWIM_Y; /* S1084 (F2b): the swimmer's line, 1.45 under the sea */ }
  WORLD.tick(1 / 60, performance.now());
  const o = WORLD.spawnOtherShip('pirate', S.x + 29, S.z); o.yaw = 0; o.speed = 6.5; o.volleyT = 1e9;
  const ev = []; let t = 0, hull = WORLD.shipBars().hull, wasRamming = false, minD = 1e9, runs = 0;
  for (let i = 0; i < T * 60; i++) { t = i / 60;
    for (const x of WORLD.others) if (x !== o) WORLD.despawnOtherShip(x);
    o.volleyT = 1e9; S.x = _sea.x; S.z = _sea.z; S.speed = v; S.yaw = 0; if (opts.swim) { px = _sea.x + 20; pz = _sea.z; }
    WORLD.tick(1 / 60, performance.now());
    if (o.ramming && !wasRamming) { runs++; ev.push({ t: +t.toFixed(1), what: 'run' }); }
    const h = WORLD.shipBars().hull; if (h < hull) { ev.push({ t: +t.toFixed(1), what: 'hit', lost: hull - h, msg: document.getElementById('msg').textContent, spent: !o.ramming && o.ramWait > 29 }); hull = h; }
    if (wasRamming && !o.ramming && !ev.some(e => e.what === 'hit' && Math.abs(e.t - t) < .05)) ev.push({ t: +t.toFixed(1), what: 'given up' });
    wasRamming = !!o.ramming; minD = Math.min(minD, Math.hypot(o.x - S.x, o.z - S.z)); }
  const out = { ev, runs, hull, minD: +minD.toFixed(1), errs: 0 }; WORLD.despawnOtherShip(o); return out; }, [T, v, opts]);

const a = await run(75, 0);
console.log('still', JSON.stringify(a));
const hits = a.ev.filter(e => e.what === 'hit'), runs = a.ev.filter(e => e.what === 'run');
check('lying still within 30 units, she makes a ram run and it lands', runs.length >= 1 && hits.length >= 1 && hits[0].t > runs[0].t, a.ev);
check('the ram costs the plain × 3 of her closing speed (about 20 to a sloop at 6.5), and reads as hers', hits.length && hits[0].lost >= 12 && hits[0].lost <= 21 && /The black sail rams you\. Hull −\d+, hers −\d+\./.test(hits[0].msg), hits[0]);
check('the touch spends the ram: she draws off to her circle, no second hit while the hulls part', hits.length && hits[0].spent && hits.filter(h => h.t - hits[0].t < 29.5).length === 1, a.ev);
check('she comes again after 30 s, and not before', runs.length >= 2 && runs[1].t - hits[0].t >= 29.9 && runs[1].t - hits[0].t < 31, runs.map(r => r.t));
check('at most one hull loss per run', hits.length <= runs.length, a.ev);

const b = await run(25, 7.5);
console.log('faster', JSON.stringify(b));
check('making 7.5 (faster than her 6.5) you are not rammed (any point lost is the sea\u2019s wear, S412)', b.runs === 0 && !b.ev.some(e => /rams you|hulls strike/i.test(e.msg || '') || e.lost > 1), b);

const c = await run(25, 0, { swim: true });
console.log('swimming', JSON.stringify(c));
check('with nobody aboard her she makes no ram run (a plain blunder into the empty hull is S411\u2019s collision, not a ram)', c.runs === 0 && !c.ev.some(e => /rams you/.test(e.msg || '')), c);

// S1813 — naval combat (Michael's B on #1064): every hull has the bars, four states, rams both ways, a leak, a founder
const her = a.ev.find(e => e.what === 'hit'); const herLost = her && +((her.msg.match(/hers −(\d+)/) || [])[1] || 0);
check('her own bow on you costs her × 1.5 of the closing speed (about 10 at 6.5) and you the old × 3', her && herLost >= 6 && herLost <= 11 && herLost < her.lost, { her, herLost });
const nc = await page.evaluate(() => {
  for (const o of [...OTHER]) despawnOtherShip(o);
  worldState.ship = { cls: 'sloop', name: 'Test Gull', sails: 0, cargo: 0, hold: {} }; WORLD.spawnShip(_sea.x, _sea.z, 0); const S = WORLD.ship; S.sailing = true;
  const out = {};
  const p = spawnOtherShip('pirate', S.x, S.z - 30); const m = spawnOtherShip('merchant', S.x + 200, S.z);
  out.bars = [p.hull, p.hullMax, p.rig, m.hull, m.hullMax, shipStateOf(p)];
  // your bow on her side at 6 m/s: she sits across your bow, still; you sail north (yaw 0) into her
  p.yaw = Math.PI / 2; p.speed = 0; p.volleyT = 1e9; p.ramWait = 1e9; S.yaw = 0; S.speed = 6; S.x = _sea.x; S.z = _sea.z; p.x = S.x; p.z = S.z - (S.L / 2 + p.W / 2 + .3);
  const h0 = WORLD.shipBars().hull, ph0 = p.hull; let msg = '';
  for (let i = 0; i < 90 && p.hull === ph0; i++) { S.speed = 6; S.yaw = 0; p.speed = 0; p.yaw = Math.PI / 2; tickHullCollisions(1 / 60); S.z -= 6 / 60; msg = document.getElementById('msg').textContent; }
  out.bow = { herLost: ph0 - p.hull, mine: h0 - WORLD.shipBars().hull, msg, state: shipStateOf(p) };
  // the states and their slowdowns
  const muls = {}; for (const f of [1, .75, .6, .5, .3, .25, .2]) { p.hull = Math.round(p.hullMax * f); muls[f] = [shipStateOf(p), otherSpeedMul(p)]; } out.muls = muls;
  // sinking: 1 hull every 10 s, until gone; she founders over 8 s and is gone with her crew
  p.hull = 3; p.boarded = false; p.x = S.x + 120; p.z = S.z; const crew = p.crew.slice(); let t = 0, founderAt = null;
  for (let i = 0; i < 60 * 45 && OTHER.includes(p); i++) { t = i / 60; tickShipLeaks(1 / 60); if (p.founder != null && founderAt == null) founderAt = t; if (p.founder != null) otherDown(p, 1 / 60); }
  out.leak = { founderAt: founderAt && +founderAt.toFixed(1), goneAt: +t.toFixed(1), gone: !OTHER.includes(p), dead: p.dead, crewLeft: crew.filter(e => ZONES.world.enemies.includes(e)).length };
  // a merchantman slowed: heavy at 4.5 × 0.8
  m.hull = 50; m.volleyT = 1e9; for (let i = 0; i < 600; i++) tickOtherShips(1 / 60, performance.now()); out.merch = { state: shipStateOf(m), speed: +m.speed.toFixed(2) };
  // a ship a quest needs strikes at 25% and lies to, never sinks
  const q = spawnOtherShip('pirate', S.x - 200, S.z, 'story:test'); q.volleyT = 1e9; const d1 = damageShip(q, 500, 0);
  for (let i = 0; i < 60 * 30; i++) { tickShipLeaks(1 / 60); tickOtherShips(1 / 60, performance.now()); }
  out.strike = { hull: q.hull, struck: !!q.struck, speed: q.speed, there: OTHER.includes(q), lost: d1 && d1.hull, msg: document.getElementById('msg').textContent };
  // your own ship under a quarter, aboard: a point every 10 s, never sunk by the leak
  const st = worldState.ship; st.hull = 2; S.sailing = true; S.speed = 0; for (let i = 0; i < 60 * 35; i++) tickShipLeaks(1 / 60);
  out.mine = { hull: WORLD.shipBars().hull, mesh: !!S.mesh, sunk: !!st.sunk };
  for (const o of [...OTHER]) despawnOtherShip(o); return out; });
console.log('naval', JSON.stringify(nc));
check('a black sail is a sloop of 100 hull, a merchantman a cog of 140, rig 100, intact', JSON.stringify(nc.bars) === JSON.stringify([100, 100, 100, 140, 140, 'intact']), nc.bars);
check('your bow into her side at 6 costs her × 4 (24) and you × 1.5 (9), and says hers', nc.bow.herLost >= 20 && nc.bow.herLost <= 26 && nc.bow.mine >= 7 && nc.bow.mine <= 10 && /You ram her\. Hull −\d+, hers −\d+\./.test(nc.bow.msg), nc.bow);
check('four states: intact ≥75%, light 50–75 (no penalty), heavy 25–50 (×0.8), sinking under 25 (×0.6)', nc.muls[1][0] === 'intact' && nc.muls[0.75][0] === 'intact' && nc.muls[0.6][0] === 'light' && nc.muls[0.6][1] === 1 && nc.muls[0.5][0] === 'light' && nc.muls[0.3][0] === 'heavy' && nc.muls[0.3][1] === .8 && nc.muls[0.25][0] === 'heavy' && nc.muls[0.2][0] === 'sinking' && nc.muls[0.2][1] === .6, nc.muls);
check('sinking at 3 hull: a point every 10 s, so she founders at 30 s and is gone 8 s later with her crew', nc.leak.founderAt >= 29.9 && nc.leak.founderAt <= 30.1 && nc.leak.gone && nc.leak.dead && nc.leak.goneAt >= 37.9 && nc.leak.goneAt <= 38.2 && nc.leak.crewLeft === 0, nc.leak);
check('a heavy merchantman makes 4.5 × 0.8 = 3.6', nc.merch.state === 'heavy' && Math.abs(nc.merch.speed - 3.6) < .15, nc.merch);
check('a ship a quest needs strikes at 25 and lies to: no leak, no way on her, never founders', nc.strike.hull === 25 && nc.strike.struck && nc.strike.speed === 0 && nc.strike.there && nc.strike.lost === 75 && /lies to/.test(nc.strike.msg), nc.strike);
check('your own ship under a quarter leaks a point every 10 s while you are aboard, to waterlogged and no further', nc.mine.hull === 0 && nc.mine.mesh && !nc.mine.sunk, nc.mine);

check('no page errors', g.errs.length === 0, g.errs);
if (stop) stop();
await g.close();
