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

// S1814 — the hooks: thrown within 10 m under 3 m/s, 1 s and 4 s, lashed 0.6 m off and still; across and back; two lines cut in 1.5 s
const hk = await page.evaluate(() => {
  for (const o of [...OTHER]) despawnOtherShip(o);
  WX.type = 'clear'; WX.next = 'clear';
  worldState.ship = { cls: 'sloop', name: 'Test Gull', sails: 0, cargo: 0, hold: {} }; WORLD.spawnShip(_sea.x, _sea.z, 0); const S = WORLD.ship; S.sailing = false; S.speed = 0;
  px = S.x; pz = S.z; jumpY = DECK_Y; velY = 0; onGround = true;
  const look = (x, z, y) => { CAM.position.set(px, jumpY + 1.55, pz); CAM.lookAt(x, y == null ? DECK_Y + .5 : y, z); CAM.updateMatrixWorld(); };
  const run = (secs, each) => { const t0 = performance.now(); let n = 0; while (performance.now() - t0 < secs * 1000) { S.x = S.x; WORLD.tick(1 / 60, performance.now()); if (each) each(); n++; } return n; };
  const side = WORLD.ship.mesh; const o = spawnOtherShip('merchant', 0, 0, 'test:hooks');
  const at = (lx, lz) => shipToWorld(side, lx, lz);
  const p0 = at(S.W / 2 + o.W / 2 + 6, 1.5); o.x = p0.x; o.z = p0.z; o.yaw = S.yaw; o.speed = 0; o.wp = { x: o.x, z: o.z }; placeOther(o);
  const out = {}; look(o.x, o.z); out.prompt = hookPrompt();
  o.speed = 4; look(o.x, o.z); out.fast = hookPrompt(); o.speed = 0;
  WX.type = 'storm'; WX.next = 'storm'; out.storm = hookPrompt(); out.stormThrow = hookInteract(); WX.type = 'clear'; WX.next = 'clear';
  look(o.x, o.z); out.thrown = hookInteract(); out.phase0 = HOOKS.phase;
  run(.9, () => { o.wp = { x: o.x, z: o.z }; }); out.at09 = HOOKS.phase; run(.25); out.at115 = HOOKS.phase; run(3.5); out.at465 = HOOKS.phase; run(.8);
  const [lx, lz] = shipLocal(side, o.x, o.z); out.lashed = { phase: HOOKS.phase, on: !!o.lashed, gap: +(Math.abs(lx) - S.W / 2 - o.W / 2).toFixed(2), along: +lz.toFixed(2), her: o.speed, mine: S.speed, lines: HOOKS.lines.length };
  S.speed = 5; run(.5); const [lx2] = shipLocal(side, o.x, o.z); out.held = { mine: S.speed, gap: +(Math.abs(lx2) - S.W / 2 - o.W / 2).toFixed(2) };
  // across: from your rail with her hull under the crosshair
  const r = at(Math.sign(lx) * (S.W / 2 - .9), 1.5); px = r.x; pz = r.z; jumpY = DECK_Y; look(o.x, o.z); out.crossPrompt = hookPrompt(); out.cross = hookInteract();
  out.onHers = inDeck(o.plat, px, pz) && !onDeck(); out.boarded = !!o.boarded;
  look(S.x, S.z); out.backPrompt = hookPrompt(); hookInteract(); out.back = onDeck();
  // the cut: by the first cleat, E, 1.5 s
  const c0 = HOOKS.cleats[0], c1 = HOOKS.cleats[1]; let a = at(c0.lx, c0.lz); px = a.x; pz = a.z; jumpY = DECK_Y; look(a.x, a.z, 0);
  out.cutPrompt = hookPrompt(); hookInteract(); run(1.2, () => { px = a.x; pz = a.z; }); out.cutAt12 = c0.cut; run(.5, () => { px = a.x; pz = a.z; }); out.cutAt17 = c0.cut; out.still = lashed(o);
  a = at(c1.lx, c1.lz); px = a.x; pz = a.z; hookInteract(); run(.4); px += 5; run(.2); out.walkedOff = { cut: c1.cut, msg: document.getElementById('msg').textContent };
  a = at(c1.lx, c1.lz); px = a.x; pz = a.z; hookInteract(); run(1.7, () => { px = a.x; pz = a.z; }); out.free = { cut: c1.cut, lashed: !!o.lashed, hooks: !!HOOKS.o, msg: document.getElementById('msg').textContent };
  // a rough sea: a throw misses one time in two, by her id and the throw's number
  const ss = seaState; seaState = () => 2; const got = [], want = [];
  for (let i = 0; i < 4; i++) { const n = (HOOKS.n['test:hooks'] || 0) + 1; want.push(seededRng('hooks', `test:hooks:${n}`)() < .5); px = S.x; pz = S.z; jumpY = DECK_Y; throwHooks(o); got.push(HOOKS.miss); run(1.15); hookDrop(); }
  seaState = ss; out.rough = { got, want };
  despawnOtherShip(o); return out; });
console.log('hooks', JSON.stringify(hk));
check('her hull under the crosshair within 10 m: E throws the hooks; at 4 m/s apart, close slower; in a storm, none', hk.prompt === "Press 'E' to throw the hooks" && /more slowly/.test(hk.fast) && /No hook/.test(hk.storm) && !hk.stormThrow, hk);
check('the throw takes 1 s, the haul 4 s, then lashed', hk.thrown && hk.phase0 === 'throw' && hk.at09 === 'throw' && hk.at115 === 'haul' && hk.at465 === 'haul' && hk.lashed.phase === 'lashed' && hk.lashed.on && hk.lashed.lines === 2, hk);
check('lashed: alongside 0.6 m off, both ships at 0 m/s, and held so when you put on way', Math.abs(hk.lashed.gap - .6) < .05 && hk.lashed.her === 0 && hk.lashed.mine === 0 && hk.held.mine === 0 && Math.abs(hk.held.gap - .6) < .05, hk);
check('across to her deck from your rail (boarding her), and back', /cross to her deck/.test(hk.crossPrompt) && hk.cross && hk.onHers && hk.boarded && /cross back/.test(hk.backPrompt) && hk.back, hk);
check('a line cut at its cleat in 1.5 s; one line still holds her', /cut the line/.test(hk.cutPrompt) && !hk.cutAt12 && hk.cutAt17 && hk.still, hk);
check('walk off a cut and the line stays; both cut and she is free', !hk.walkedOff.cut && /uncut/.test(hk.walkedOff.msg) && hk.free.cut && !hk.free.lashed && !hk.free.hooks && /free/.test(hk.free.msg), hk);
check('in a rough sea the throw misses by the seeded roll (her id, the throw)', JSON.stringify(hk.rough.got) === JSON.stringify(hk.rough.want), hk.rough);

check('no page errors', g.errs.length === 0, g.errs);
if (stop) stop();
await g.close();
