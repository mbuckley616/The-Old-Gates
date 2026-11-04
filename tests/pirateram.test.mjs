// The pirate's ram (Session 418; and naval combat's hulls, Session 1813; Michael's B on #100, docs/design/sailing.md). Within 30 units, faster than you and with
// her ram ready, the black sail steers at your hull; the first touch costs you the closing speed × 3 (half if your bow is
// on her) and spends it, and she goes back to her circle. She may ram again 30 s later; a run that has not touched in
// 12 s is given up. Her volleys are held off here so that only rams cost hull. Session 1820: and the ballista, the last block.
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
    o.volleyT = 1e9; o.hookWait = 1e9; /* S1815 — the ram alone: her hooks after it are checked below */ S.x = _sea.x; S.z = _sea.z; S.speed = v; S.yaw = 0; if (opts.swim) { px = _sea.x + 20; pz = _sea.z; }
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
  const run = (secs, each) => { const t0 = performance.now(); let n = 0; while (performance.now() - t0 < secs * 1000) { for (const x of [...OTHER]) if (x.id !== 'test:hooks') despawnOtherShip(x); /* no sea-spawned ship in the test */ WORLD.tick(1 / 60, performance.now()); if (each) each(); n++; } return n; };
  const said = []; const sm = showMsg; showMsg = (t, ...r) => { said.push(t); return sm(t, ...r); }; /* the lines said, not the last one shown: a sea-spawned ship's line can land in the same tick */
  const side = WORLD.ship.mesh; const o = spawnOtherShip('merchant', 0, 0, 'test:hooks');
  const at = (lx, lz) => shipToWorld(side, lx, lz);
  const p0 = at(S.W / 2 + o.W / 2 + 6, 1.5); o.x = p0.x; o.z = p0.z; o.yaw = S.yaw; o.speed = 0; o.wp = { x: o.x, z: o.z }; placeOther(o);
  const out = {}; look(o.x, o.z); out.prompt = hookPrompt();
  o.speed = 4; look(o.x, o.z); out.fast = hookPrompt(); o.speed = 0;
  WX.type = 'storm'; WX.next = 'storm'; out.storm = hookPrompt(); out.stormThrow = hookInteract(); WX.type = 'clear'; WX.next = 'clear';
  /* the times are read off the clock as each phase begins, not sampled at fixed moments: one slow tick on a CI runner can overshoot a sample */
  look(o.x, o.z); const tThrow = performance.now(); out.thrown = hookInteract(); out.phase0 = HOOKS.phase; const ph = {};
  run(6, () => { o.wp = { x: o.x, z: o.z }; if (HOOKS.phase && ph[HOOKS.phase] == null) ph[HOOKS.phase] = +((performance.now() - tThrow) / 1000).toFixed(2); });
  out.phases = ph;
  const [lx, lz] = shipLocal(side, o.x, o.z); out.lashed = { phase: HOOKS.phase, on: !!o.lashed, gap: +(Math.abs(lx) - S.W / 2 - o.W / 2).toFixed(2), along: +lz.toFixed(2), her: o.speed, mine: S.speed, lines: HOOKS.lines.length };
  S.speed = 5; run(.5); const [lx2] = shipLocal(side, o.x, o.z); out.held = { mine: S.speed, gap: +(Math.abs(lx2) - S.W / 2 - o.W / 2).toFixed(2) };
  // across: from your rail with her hull under the crosshair
  const r = at(Math.sign(lx) * (S.W / 2 - .9), 1.5); px = r.x; pz = r.z; jumpY = DECK_Y; look(o.x, o.z); out.crossPrompt = hookPrompt(); out.cross = hookInteract();
  out.onHers = inDeck(o.plat, px, pz) && !onDeck(); out.boarded = !!o.boarded;
  look(S.x, S.z); out.backPrompt = hookPrompt(); hookInteract(); out.back = onDeck();
  // the cut: by the first cleat, E, 1.5 s
  const c0 = HOOKS.cleats[0], c1 = HOOKS.cleats[1]; let a = at(c0.lx, c0.lz); px = a.x; pz = a.z; jumpY = DECK_Y; look(a.x, a.z, 0);
  out.cutPrompt = hookPrompt(); const tCut = performance.now(); let tick0 = tCut, worst = 0; hookInteract(); run(2.2, () => { px = a.x; pz = a.z; const n = performance.now(); worst = Math.max(worst, n - tick0); tick0 = n; if (c0.cut && out.cutAt == null) out.cutAt = +((n - tCut) / 1000).toFixed(2); });
  out.cutSlack = +(worst / 1000).toFixed(2); out.still = lashed(o);
  a = at(c1.lx, c1.lz); px = a.x; pz = a.z; hookInteract(); run(.4); px += 5; run(.2); out.walkedOff = { cut: c1.cut, msg: said.filter(t => /uncut/.test(t)).pop() || said[said.length - 1] };
  a = at(c1.lx, c1.lz); px = a.x; pz = a.z; hookInteract(); run(1.7, () => { px = a.x; pz = a.z; }); out.free = { cut: c1.cut, lashed: !!o.lashed, hooks: !!HOOKS.o, msg: said.filter(t => /free/.test(t)).pop() || said[said.length - 1] };
  // a rough sea: a throw misses one time in two, by her id and the throw's number
  const ss = seaState; seaState = () => 2; const got = [], want = [];
  for (let i = 0; i < 4; i++) { const n = (HOOKS.n['test:hooks'] || 0) + 1; want.push(seededRng('hooks', `test:hooks:${n}`)() < .5); px = S.x; pz = S.z; jumpY = DECK_Y; throwHooks(o); got.push(HOOKS.miss); run(1.15); hookDrop(); }
  seaState = ss; out.rough = { got, want };
  despawnOtherShip(o); showMsg = sm; return out; });
console.log('hooks', JSON.stringify(hk));
check('her hull under the crosshair within 10 m: E throws the hooks; at 4 m/s apart, close slower; in a storm, none', hk.prompt === "Press 'E' to throw the hooks" && /more slowly/.test(hk.fast) && /No hook/.test(hk.storm) && !hk.stormThrow, hk);
check('the throw takes 1 s, the haul 4 s, then lashed', hk.thrown && hk.phase0 === 'throw' && hk.phases.haul >= 1 && hk.phases.haul < 1.6 && hk.phases.lashed >= 5 && hk.phases.lashed < 5.6 && hk.lashed.phase === 'lashed' && hk.lashed.on && hk.lashed.lines === 2, hk);
check('lashed: alongside 0.6 m off, both ships at 0 m/s, and held so when you put on way', Math.abs(hk.lashed.gap - .6) < .05 && hk.lashed.her === 0 && hk.lashed.mine === 0 && hk.held.mine === 0 && Math.abs(hk.held.gap - .6) < .05, hk);
check('across to her deck from your rail (boarding her), and back', /cross to her deck/.test(hk.crossPrompt) && hk.cross && hk.onHers && hk.boarded && /cross back/.test(hk.backPrompt) && hk.back, hk);
check('a line cut at its cleat in 1.5 s (not before; after by no more than the slowest tick); one line still holds her', /cut the line/.test(hk.cutPrompt) && hk.cutAt >= 1.5 && hk.cutAt <= 1.5 + Math.max(.2, hk.cutSlack) + .05 && hk.still, hk);
check('walk off a cut and the line stays; both cut and she is free', !hk.walkedOff.cut && /uncut/.test(hk.walkedOff.msg) && hk.free.cut && !hk.free.lashed && !hk.free.hooks && /free/.test(hk.free.msg), hk);
check('in a rough sea the throw misses by the seeded roll (her id, the throw)', JSON.stringify(hk.rough.got) === JSON.stringify(hk.rough.want), hk.rough);

// S1815 — repel boarders: a black sail whose ram is spent hooks you within 10 m; her crew cross 6 s after the lashing unless both lines are cut
const rb = await page.evaluate(() => {
  for (const o of [...OTHER]) despawnOtherShip(o); hookDrop();
  const ss = seaState; seaState = () => 1; /* the weather moves on over a long real-time run: the sea is held moderate */
  const fresh = () => { for (const o of [...OTHER]) despawnOtherShip(o); hookDrop(); for (const e of WORLD.boarders.splice(0)) { if (e.mesh && e.mesh.parent) e.mesh.parent.remove(e.mesh); const j = ZONES.world.enemies.indexOf(e); if (j >= 0) ZONES.world.enemies.splice(j, 1); }
    worldState.ship = { cls: 'sloop', name: 'Test Gull', sails: 0, cargo: 0, hold: {} }; WORLD.spawnShip(_sea.x, _sea.z, 0); const S = WORLD.ship; S.sailing = false; S.speed = 0;
    px = S.x; pz = S.z; jumpY = DECK_Y; velY = 0; onGround = true; PHP = 9999;
    const p0 = shipToWorld(S.mesh, S.W / 2 + 4.4 / 2 + 5, 0); const o = spawnOtherShip('pirate', p0.x, p0.z, 'test:boarders'); o.yaw = S.yaw; o.speed = 0; o.volleyT = 1e9; o.ramWait = 25; return [S, o]; };
  const run = (secs, o, each) => { const t0 = performance.now(), hold = { x: o.x, z: o.z, yaw: o.yaw }; while (performance.now() - t0 < secs * 1000) { o.volleyT = 1e9; o.ramWait = Math.max(o.ramWait, 5); PHP = 9999;
    for (const x of [...OTHER]) if (x !== o) despawnOtherShip(x); if (!HOOKS.o) { Object.assign(o, hold); o.speed = 0; } if (!each) { const S = WORLD.ship; px = S.x; pz = S.z; jumpY = DECK_Y; } WORLD.tick(1 / 60, performance.now()); if (each) each(); } };
  const out = {};
  let [S, o] = fresh(); run(1.5, o); out.unrammed = { hooks: !!HOOKS.o, boarders: WORLD.boarders.length };
  /* each step's time is read off the clock when it happens (a slow tick on a CI runner overshoots a fixed sample) */
  o._rammed = true; const T = {}; let t0 = 0, last = performance.now(), worst = 0;
  run(13, o, () => { const n = performance.now(); worst = Math.max(worst, n - last); last = n; const S = WORLD.ship; px = S.x; pz = S.z; jumpY = DECK_Y;
    if (HOOKS.by === 'her' && !t0) { t0 = n; out.thrown = { by: HOOKS.by, phase: HOOKS.phase }; }
    if (t0 && HOOKS.phase === 'lashed' && T.lashed == null) { T.lashed = +((n - t0) / 1000).toFixed(2); T.boardersAtLash = WORLD.boarders.length; }
    if (t0 && WORLD.boarders.length && T.crossed == null) { T.crossed = +((n - t0) / 1000).toFixed(2); T.afterLash = +(n / 1000 - HOOKS.tl).toFixed(3); /* S1821 — from the game's own lashing stamp, unrounded: two rounded samples made 6.00 read 5.99 */ } });
  if (!out.thrown) out.thrown = { by: HOOKS.by, phase: HOOKS.phase };
  T.slack = +(worst / 1000).toFixed(2); out.T = T; out.crossed = { boarders: WORLD.boarders.length, msg: document.getElementById('msg').textContent, still: lashed(o) };
  // again, and you cut both lines while she hauls: nobody crosses, and she must ram again
  [S, o] = fresh(); o._rammed = true; run(1.2, o); out.second = HOOKS.phase;
  for (const c of HOOKS.cleats.slice()) { const at = () => { const a = shipToWorld(S.mesh, c.lx, c.lz); px = a.x; pz = a.z; jumpY = DECK_Y; }; at(); hookInteract(); run(1.6, o, at); }
  out.cut = { hooks: !!HOOKS.o, rammed: !!o._rammed, sent: !!o.sentBoarders, boarded: !!o.boarded, msg: document.getElementById('msg').textContent };
  run(7, o); out.after = { boarders: WORLD.boarders.length, hooks: !!HOOKS.o };
  // a storm: nobody grapples
  [S, o] = fresh(); seaState = () => 3; o._rammed = true; run(1.5, o); out.storm = { hooks: !!HOOKS.o }; seaState = () => 1;
  fresh(); for (const x of [...OTHER]) despawnOtherShip(x); seaState = ss; return out; });
console.log('boarders', JSON.stringify(rb));
check('within 10 m, her ram not yet landed: no hooks, nobody on your deck (the old 12-second crossing is gone)', !rb.unrammed.hooks && rb.unrammed.boarders === 0, rb.unrammed);
check('her ram spent: her hooks come over your rail', rb.thrown.by === 'her' && rb.thrown.phase === 'throw', rb.thrown);
check('lashed 5 s after her throw with nobody across yet; across 6 s after the lashing: two of her crew on your deck', rb.T.lashed >= 5 && rb.T.lashed <= 5.05 + Math.max(.2, rb.T.slack) && rb.T.boardersAtLash === 0 && rb.T.afterLash >= 6 && rb.T.afterLash <= 6.05 + Math.max(.2, rb.T.slack) && rb.crossed.boarders === 2 && /Pirates on your deck/.test(rb.crossed.msg) && rb.crossed.still, rb);
check('both lines cut while she hauls: she is free, nobody crosses, and she must ram again before she hooks', rb.second === 'haul' && !rb.cut.hooks && !rb.cut.rammed && !rb.cut.sent && !rb.cut.boarded && rb.after.boarders === 0 && !rb.after.hooks, rb);
check('in a storm nobody grapples', !rb.storm.hooks, rb.storm);

// S1820 — naval combat's ballista (B's fourth systems session): a fitting of 5 hold at her bow, bolts 20 to 1 of the hold; at the helm a
// bolt at a black sail within 30° of her bow and 90 m strikes for 10 hull when it arrives, one every 6 s; abeam, far or a merchantman, no shot
const bl = await page.evaluate(async () => {
  for (const o of [...OTHER]) despawnOtherShip(o);
  worldState.ship = { cls: 'sloop', name: 'Test Gull', sails: 0, cargo: 0, hold: {} }; WORLD.spawnShip(_sea.x, _sea.z, 0); const S = WORLD.ship; S.sailing = true; S.speed = 0; S.yaw = 0;
  const out = {}; const hold = () => { S.x = _sea.x; S.z = _sea.z; S.speed = 0; S.yaw = 0; };
  out.noFit = fireBallista();
  out.cap0 = holdCap(); out.used0 = holdUsed();
  gold = 1000; out.fit = fitShip('ballista'); out.cap1 = holdCap();
  out.noBolts = fireBallista();
  worldState.ship.hold.bolts = 21; out.used21 = holdUsed(); out.cap21 = holdCap();
  // a black sail 60 m ahead (north is -z at yaw 0), still, her volleys and ram held off
  const p = spawnOtherShip('pirate', S.x, S.z - 60); p.speed = 0; p.yaw = Math.PI / 2; p.volleyT = 1e9; p.ramWait = 1e9; p.hookWait = 1e9; p.circleR = 0;
  const pin = () => { p.x = S.x; p.z = S.z - 60; p.speed = 0; p.volleyT = 1e9; p.ramWait = 1e9; p.hookWait = 1e9; p.ramming = 0; };
  let slow = 0; const step = n => { for (let i = 0; i < n; i++) { const t1 = performance.now(); hold(); pin(); for (const o of [...OTHER]) if (o !== p) despawnOtherShip(o); WORLD.tick(1 / 60, performance.now()); slow = Math.max(slow, (performance.now() - t1) / 1000); } };
  step(2);
  out.bears = ballistaBears() === p; out.hud = ballistaHud();
  const h0 = p.hull; const t0 = performance.now();
  out.fire1 = fireBallista(); out.dur = BOLTS.fly[0] && +BOLTS.fly[0].dur.toFixed(3); out.again = fireBallista(); out.bolts1 = boltsAboard();
  while (p.hull === h0 && performance.now() - t0 < 4000) { step(1); }
  out.arrive = +((performance.now() - t0) / 1000).toFixed(2); out.lost = h0 - p.hull; out.msg = document.getElementById('msg').textContent;
  out.hudWind = ballistaHud();
  while (fireBallista() !== true && performance.now() - t0 < 9000) step(1);
  out.reload = +((performance.now() - t0) / 1000).toFixed(2); out.slow = +slow.toFixed(3);
  // S1821 — the fire bolt: a bolt and a pitch, 4 hull, her rig 2 a second for 8 s
  { const tw = performance.now(); while (BOLTS.fly.length && performance.now() - tw < 4000) step(1); } /* the reload check's bolt lands first */
  BOLTS.t = -1e9; ballistaFireMode(true); bagTake(b => b.name === SURV_ITEMS.pitch.name, 999); out.noPitch = fireBallista();
  bagAdd(Object.assign({}, SURV_ITEMS.pitch, { qty: 1 })); p.rig = 100; const hf = p.hull, bf = boltsAboard(); const tf = performance.now();
  out.fireShot = fireBallista(); out.pitchLeft = pitchCount(); out.boltsF = bf - boltsAboard(); out.hudFire = ballistaHud();
  while (p.hull === hf && performance.now() - tf < 4000) step(1);
  out.fireLost = hf - p.hull; out.fireMsg = document.getElementById('msg').textContent; const tb = performance.now(); out.rigAt = p.rig;
  let nb = 0; while (p.burn > 0 && nb < 1200) { step(1); nb++; } /* the fire runs on the tick's time, as the leak does */
  out.burnS = +(nb / 60).toFixed(2); out.rigAfter = p.rig; out.burnLeft = p.burn; ballistaFireMode(false);
  // out of the arc: she lies abeam, 40 m to starboard
  p.x = S.x + 40; p.z = S.z; const pinA = () => { p.x = S.x + 40; p.z = S.z; }; hold(); pinA(); BOLTS.t = -1e9; out.abeam = ballistaBears(); out.abeamWhy = ballistaWhy();
  // out of range: 120 m ahead
  p.x = S.x; p.z = S.z - 120; out.far = ballistaBears();
  // a merchantman ahead is not offered
  despawnOtherShip(p); const m = spawnOtherShip('merchant', S.x, S.z - 50); m.speed = 0; out.merchant = ballistaBears();
  despawnOtherShip(m);
  out.bench = SHIP_BENCH.ballista; out.yard = yardOffers({ x: S.x, z: S.z, name: 'X', id: 'x', quayStart: null }).map(o => o.label).filter(l => /ballista|Bolts/.test(l));
  return out; });
console.log('ballista', JSON.stringify(bl));
check('no ballista, no shot', bl.noFit === 'She has no ballista.', bl.noFit);
check('fitted for 350, 5 of the hold', bl.fit === true && bl.cap0 - bl.cap1 === 5, bl);
check('no bolts', bl.noBolts === 'No bolts in her hold.', bl.noBolts);
check('21 bolts take 2 of the hold', bl.used21 - bl.used0 === 2, bl);
check('she bears 60 m ahead', bl.bears && /she bears · 21 bolts/.test(bl.hud), bl.hud);
check('a bolt loosed, the next refused while winding', bl.fire1 === true && bl.again === 'The ballista is still winding.' && bl.bolts1 === 20, bl);
check('it strikes for 10 hull once it has flown (bow to her, about 54 m at 60 m/s)', bl.lost === 10 && bl.dur > .8 && bl.dur < 1 && bl.arrive >= bl.dur - .01 && bl.arrive < 4 && /Your bolt strikes the black sail\. Hull −10\./.test(bl.msg), bl);
check('6 s to wind again, read off the clock (late by no more than the slowest tick)', bl.reload >= 6 && bl.reload <= 6 + bl.slow + .05, bl);
check('fire bolts: refused with no pitch; a bolt and a pitch spent; (fire) on the panel', /needs a pitch/.test(bl.noPitch) && bl.fireShot === true && bl.pitchLeft === 0 && bl.boltsF === 1 && /^Ballista \(fire\)/.test(bl.hudFire), bl);
check('a fire bolt takes 4 hull and sets her rig alight: 16 rig over 8 s, then out', bl.fireLost === 4 && /her rig is alight/.test(bl.fireMsg) && bl.rigAt >= 98 && bl.rigAfter === 84 && bl.burnLeft === 0 && bl.burnS >= 7.9, bl);
check('abeam and far do not bear; a merchantman is not offered', !bl.abeam && !bl.far && !bl.merchant && /Nothing bears/.test(bl.abeamWhy), bl);
// S1822 — the galleon's broadside: six guns a side, ±25° of abeam, 150 m, a 0.6 s ripple, 20 s a side to reload; round 6 hull a ball,
// chain 6 rig, grape 20 to each of her hands within 60 m, shell 8 hull and the burn; shot 20 to 1 of the hold; no guns but a galleon's
const gn = await page.evaluate(() => {
  for (const o of [...OTHER]) despawnOtherShip(o);
  worldState.ship = { cls: 'sloop', name: 'Test Gull', sails: 0, cargo: 0, hold: { round: 12 } }; WORLD.spawnShip(_sea.x, _sea.z, 0); let S = WORLD.ship; S.sailing = true;
  const out = {}; out.sloop = fireBroadside();
  worldState.ship = { cls: 'galleon', name: 'Test Gull', sails: 0, cargo: 0, hold: { round: 12, chain: 20, grape: 20, shell: 20 } }; WORLD.spawnShip(_sea.x, _sea.z, 0); S = WORLD.ship; S.sailing = true;
  out.used = holdUsed(); GUNS.t = { port: -1e9, stbd: -1e9 }; gunsShot('round');
  const p = spawnOtherShip('pirate', S.x + 60, S.z); p.speed = 0; p.yaw = 0;
  const at = (dx, dz) => { p.x = S.x + dx; p.z = S.z + dz; };
  let pos = [60, 0]; const hold = () => { S.x = _sea.x; S.z = _sea.z; S.speed = 0; S.yaw = 0; at(...pos); p.speed = 0; p.volleyT = 1e9; p.ramWait = 1e9; p.hookWait = 1e9; p.ramming = 0; p.burn = 0; };
  const step = n => { for (let i = 0; i < n; i++) { hold(); for (const o of [...OTHER]) if (o !== p) despawnOtherShip(o); WORLD.tick(1 / 60, performance.now()); } };
  const wait = () => { const t = performance.now(); while (GUNS.fly.length && performance.now() - t < 6000) step(1); };
  step(2); out.bear = gunsBear(); out.bear = { stbd: out.bear.stbd === p, port: out.bear.port === p }; out.hud = gunsHud();
  const h0 = p.hull; out.fire = fireBroadside(); out.round = shotAboard('round'); out.again = fireBroadside(); wait();
  out.roundLost = h0 - p.hull; out.roundMsg = document.getElementById('msg').textContent; out.wait = Math.round(gunsWait('stbd'));
  // chain from the port side, 50 m off
  pos = [-50, 0]; hold(); gunsShot('chain'); const r0 = p.rig; out.chain = fireBroadside(); wait(); out.chainRig = r0 - p.rig;
  // grape at her crew, 40 m to starboard: 20 to each; then 90 m off, short
  pos = [40, 0]; step(1); crewUp(p, false); const hp0 = p.crew.map(e => e.hp); GUNS.t = { port: -1e9, stbd: -1e9 }; gunsShot('grape'); out.grape = fireBroadside(); wait();
  out.grapeHit = p.crew.map((e, i) => hp0[i] - e.hp); out.grapeMsg = document.getElementById('msg').textContent;
  pos = [90, 0]; GUNS.t = { port: -1e9, stbd: -1e9 }; out.grapeFar = fireBroadside(); wait(); out.grapeFarMsg = document.getElementById('msg').textContent;
  // shell: 8 a ball and her rig alight
  pos = [60, 0]; p.hull = p.hullMax; GUNS.t = { port: -1e9, stbd: -1e9 }; gunsShot('shell'); const hs = p.hull; out.shell = fireBroadside();
  { const t = performance.now(); while (GUNS.fly.length && performance.now() - t < 6000) { S.x = _sea.x; S.z = _sea.z; S.speed = 0; S.yaw = 0; at(...pos); p.volleyT = 1e9; p.ramWait = 1e9; p.hookWait = 1e9; WORLD.tick(1 / 60, performance.now()); } }
  out.shellLost = hs - p.hull; out.burn = p.burn > 0;
  // dead ahead, 60 m: no side bears
  pos = [0, -60]; hold(); GUNS.t = { port: -1e9, stbd: -1e9 }; gunsShot('round'); out.ahead = broadsideWhy();
  // 30° off the beam: no; 20°: yes
  pos = [60 * Math.cos(30 * Math.PI / 180), -60 * Math.sin(30 * Math.PI / 180)]; hold(); out.at30 = !!gunsBear().stbd;
  pos = [60 * Math.cos(20 * Math.PI / 180), -60 * Math.sin(20 * Math.PI / 180)]; hold(); out.at20 = !!gunsBear().stbd;
  const nAt = nationAt; const rows = nat => { window.nationAt = () => nat; try { return yardOffers({ x: S.x, z: S.z, name: 'X', id: 'x', quayStart: null }).map(o => o.label).filter(l => /for the guns/.test(l)); } finally { window.nationAt = nAt; } };
  out.rowsMark = rows('mark'); out.rowsGl = rows('gatelands');
  despawnOtherShip(p); return out; });
console.log('broadside', JSON.stringify(gn));
check('no guns but a galleon’s', gn.sloop === 'Only a galleon carries guns.', gn.sloop);
check('her shot: 12 round, 20 chain, 20 grape, 20 shell take 4 of the hold', gn.used === 4, gn.used);
check('a black sail 60 m to starboard: the starboard side bears, not the port', gn.bear.stbd && !gn.bear.port && /starboard bears/.test(gn.hud), gn);
check('round: six balls fired, 36 hull, that side 20 s to reload', gn.fire === true && gn.round === 6 && /still loading/.test(gn.again) && gn.roundLost === 36 && /Hull −36/.test(gn.roundMsg) && gn.wait >= 19, gn);
check('chain from the port side while starboard reloads: 36 rig', gn.chain === true && gn.chainRig === 36, gn);
check('grape at 40 m: 20 to each of her hands; at 90 m it falls short', gn.grape === true && gn.grapeHit.length === 3 && gn.grapeHit.every(x => x === 20) && /Grape sweeps her deck: 3/.test(gn.grapeMsg) && gn.grapeFar === true && /falls short/.test(gn.grapeFarMsg), gn);
check('shell: 48 hull and her rig alight', gn.shell === true && gn.shellLost === 48 && gn.burn, gn);
check('dead ahead no side bears; 20° off the beam bears, 30° does not', /Nothing bears/.test(gn.ahead) && gn.at20 && !gn.at30, gn);
check('the yard sells round, chain and grape to a galleon; shell only in the Mark', gn.rowsGl.length === 3 && gn.rowsMark.length === 4 && gn.rowsMark.some(l => /^Shell for the guns, 20 \(300 gold/.test(l)), gn);

// S1823 — the wreck: a ship gone down leaves her wreck where she sank, keyed by her id, her chest without its crates; laid within 250 m;
// what is taken from it stays taken, through a save
const wk = await page.evaluate(() => {
  for (const o of [...OTHER]) despawnOtherShip(o); worldState.sunkShips = [];
  worldState.ship = { cls: 'sloop', name: 'Test Gull', sails: 0, cargo: 0, hold: {} }; WORLD.spawnShip(_sea.x, _sea.z, 0); const S = WORLD.ship; S.sailing = true;
  const out = {}; const p = spawnOtherShip('pirate', S.x + 40, S.z, 'test:wreck'); p.speed = 0;
  const step = n => { for (let i = 0; i < n; i++) { S.x = _sea.x; S.z = _sea.z; S.speed = 0; p.volleyT = 1e9; p.ramWait = 1e9; p.hookWait = 1e9; WORLD.tick(1 / 60, performance.now()); } };
  damageShip(p, 1000, 0); out.founder = p.founder; step(8.2 * 60 + 70);
  const L = worldState.sunkShips; out.n = L.length; const w = L[0] || {}; out.key = w.key; out.items = (w.items || []).length; out.cargo = (w.items || []).some(it => it.type === 'cargo');
  out.at = w.x != null && Math.hypot(w.x - (_sea.x + 40), w.z - _sea.z) < 12; out.gone = !OTHER.includes(p);
  sunkWrecksTick(0, true); const Ld = SUNK_LAID.get(w.key); out.laid = !!Ld && ZONE_CORPSES.includes(Ld.c) && Ld.c.items === w.items; out.chestY = Ld && +(Ld.c.y).toFixed(1); out.seaY = WORLD.SEA_Y;
  // take one, save, load: the wreck comes back one short
  const took = w.items.shift(); out.left = w.items.length;
  const d = JSON.parse(ssStringify(_buildSavePayload())); worldState.sunkShips = []; _applyLoadData(d);
  out.loaded = (worldState.sunkShips || []).map(x => [x.key, x.items.length]); sunkWrecksTick(0, true); const L2 = SUNK_LAID.get(w.key); out.relaid = !!L2 && L2.c.items === worldState.sunkShips[0].items;
  // a quest's ship leaves none; sailed 300 m off, the wreck is lifted
  const q = spawnOtherShip('pirate', S.x - 40, S.z, 'story:test'); sinkWreck(q); out.storyNone = worldState.sunkShips.length === 1; despawnOtherShip(q);
  px += 300; sunkWrecksTick(0, true); out.lifted = !SUNK_LAID.has(w.key) && !ZONE_CORPSES.some(c => c.sunk === w.key); px -= 300;
  worldState.sunkShips = []; sunkWrecksTick(0, true); return out; });
console.log('wreck', JSON.stringify(wk));
check('she founders at 0 and is gone; her wreck is recorded where she sank, keyed by her id', wk.founder > 0 && wk.gone && wk.n === 1 && wk.key === 'sunk:test:wreck' && wk.at, wk);
check('her chest goes down with her, its crates lost', wk.items >= 1 && !wk.cargo, wk);
check('within 250 m it is laid on the bed, its chest the record’s own items', wk.laid && wk.chestY < wk.seaY - 1, wk);
check('what is taken stays taken, through a save; a quest’s ship leaves none; far off it is lifted', wk.loaded.length === 1 && wk.loaded[0][1] === wk.left && wk.relaid && wk.storyNone && wk.lifted, wk);

// S1824 — a merchantman holed to heavy (under half) runs from you at the best her holes allow, and keeps running
const mf = await page.evaluate(() => {
  for (const o of [...OTHER]) despawnOtherShip(o);
  worldState.ship = { cls: 'sloop', name: 'Test Gull', sails: 0, cargo: 0, hold: {} }; WORLD.spawnShip(_sea.x, _sea.z, 0); const S = WORLD.ship; S.sailing = true;
  const out = {}; const m = spawnOtherShip('merchant', S.x + 40, S.z, 'test:merchant'); m.yaw = Math.PI; m.wp = { x: S.x + 40, z: S.z - 400 };
  const step = n => { for (let i = 0; i < n; i++) { S.x = _sea.x; S.z = _sea.z; S.speed = 0; for (const o of [...OTHER]) if (o !== m) despawnOtherShip(o); WORLD.tick(1 / 60, performance.now()); } };
  step(120); out.intact = !!m.fleeing;
  damageShip(m, 75, 0); out.state = shipStateOf(m); step(1); out.msg = document.getElementById('msg').textContent; out.fleeing = !!m.fleeing;
  const d0 = Math.hypot(m.x - S.x, m.z - S.z); step(20 * 60); const d1 = Math.hypot(m.x - S.x, m.z - S.z);
  out.d0 = +d0.toFixed(1); out.d1 = +d1.toFixed(1); out.speed = +m.speed.toFixed(2); out.top = +(4.5 * otherSpeedMul(m)).toFixed(2);
  m.hull = m.hullMax; step(60); out.stillRuns = !!m.fleeing; despawnOtherShip(m); return out; });
console.log('merchant', JSON.stringify(mf));
check('an intact merchantman does not run', !mf.intact, mf);
check('holed to heavy she crowds on sail and runs from you at her holed best (4.5 × 0.8), and keeps running though mended', mf.state === 'heavy' && mf.fleeing && /crowds on sail and runs/.test(mf.msg) && mf.d1 - mf.d0 > 40 && Math.abs(mf.speed - mf.top) < .2 && mf.stillRuns, mf);

check('no page errors', g.errs.length === 0, g.errs);
if (stop) stop();
await g.close();
