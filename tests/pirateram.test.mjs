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
  const side = WORLD.ship.mesh; const o = spawnOtherShip('merchant', 0, 0, 'test:hooks'); o._hands = true; /* S1935 — your cut alone here; her hands' are checked below */
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
  /* S2155 — the way back is logged in full (a first try failed here once, S2139, with only `back: false` to read): what the cross
     aimed at, the eye's distance to your hull, the lashing's state, what E returned, and where it set you against your deck */
  look(S.x, S.z); out.backPrompt = hookPrompt(); { const ct = crossTarget(); out.backAim = { ct: ct ? (ct.other ? 'hers' : 'mine') : null, eye: +eyeOnHull(SHIP.mesh, SHIP.W, SHIP.L).toFixed(2), lashed: lashed(), phase: HOOKS.phase, cut: !!HOOKS.cut, jumpY: +jumpY.toFixed(2), sailing: !!SHIP.sailing }; }
  out.backRet = hookInteract(); out.back = onDeck();
  { const p = SHIP.plat, [blx, blz] = shipLocal(side, px, pz); out.backAt = { lx: +blx.toFixed(2), lz: +blz.toFixed(2), box: !!p && px > p.x0 && px < p.x1 && pz > p.z0 && pz < p.z1, inside: p && p.inside ? !!p.inside(px, pz) : null, jumpY: +jumpY.toFixed(2) }; }
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

// S1935 (Michael's A on #1225) — a merchantman's two hands: bodies on her deck, unarmed, never hostile. Lashed, the first walks to her end of
// a line and cuts it in 6 s; a hit on him starts his 6 s again; both cut and she runs. On her deck you stop them. Striking one is piracy
const mh = await page.evaluate(() => {
  for (const x of [...OTHER]) despawnOtherShip(x);
  worldState.ship = { cls: 'sloop', name: 'Test Gull', sails: 0, cargo: 0, hold: {} }; WORLD.spawnShip(_sea.x, _sea.z, 0); const S = WORLD.ship; S.sailing = false; S.speed = 0;
  px = S.x; pz = S.z; jumpY = DECK_Y;
  const run = (secs, each) => { const t0 = performance.now(); while (performance.now() - t0 < secs * 1000) { for (const x of [...OTHER]) if (x.id !== 'test:hands') despawnOtherShip(x); WORLD.tick(1 / 60, performance.now()); if (each) each(); } };
  const said = []; const sm = showMsg; showMsg = (t, ...r) => { said.push(t); return sm(t, ...r); }; const ss = seaState; seaState = () => 0; /* a calm sea: no throw misses */
  const side = WORLD.ship.mesh, o = spawnOtherShip('merchant', 0, 0, 'test:hands'), at = (lx, lz) => shipToWorld(side, lx, lz);
  const p0 = at(S.W / 2 + o.W / 2 + 6, 1.5); o.x = p0.x; o.z = p0.z; o.yaw = S.yaw; o.speed = 0; o.wp = { x: o.x, z: o.z }; placeOther(o);
  run(.1); const hands = o.crew.filter(e => e.hand), out = {};
  out.made = { n: hands.length, ids: hands.map(e => e.id), alive: hands.every(e => !e.dead && e.mesh && e.mesh.parent), armed: hands.some(e => e.limbs.person && e.limbs.person.weapon), names: hands.map(e => e.name) };
  /* S1941 — on the new look each hand wears the builder's body, keyed by his id, in the deck's dress: shirt, slops, barefoot, nothing of the town's */
  out.dress = hands.map(e => { const rig = e.limbs.person, D = rig.hbG && rig.hbG.dress; return { hb: HB_RIGS.has(rig), key: rig.g.hbKey, D: D && { shirt: !!D.tunic, slops: !!D.trousers, bare: !D.boots && !D.sandals, rolled: !!D.sleevesRolled, extra: Object.keys(D).filter(k => D[k] && !/^(tunic|trousers|sleevesRolled|belt|sashBelt|wrap|scarf)$/.test(k)) } }; });
  // never hostile: stood next to them for 3 s, no blow, no alert
  const hp0 = PHP; const h0 = hands[0]; px = h0.x + .8; pz = h0.z; jumpY = DECK_Y; run(3, () => { px = h0.x + .8; pz = h0.z; }); out.calm = { hp: PHP === hp0, alert: hands.some(e => e.alert), pir: !!o.pirated };
  px = S.x; pz = S.z; jumpY = DECK_Y;
  // hooked and lashed: her hand to her end of a line, 6 s
  // (Session 1945: the clock starts when he reaches the line, read off the game's own start, o._cut.t0, not at the end of the 5.3 s
  // run: the lashing lands at about 5.02 s and he can reach his end before the run ends, so the old clock started late and read 5.90)
  let reachT = null; const reach = () => { if (reachT == null && o._cut && o._cut.t0 != null) reachT = o._cut.t0; };
  throwHooks(o); run(5.3, () => { o.wp = { x: o.x, z: o.z }; px = S.x; pz = S.z; reach(); }); out.lashed = lashed(o);
  const tL = performance.now() / 1000; let first = null, both = null;
  run(16, () => { reach(); px = S.x; pz = S.z; o.wp = o.fleeing ? o.wp : { x: o.x, z: o.z }; const n = performance.now() / 1000 - (reachT == null ? tL : reachT); if (first == null && HOOKS.cleats.some(c => c.cut)) first = n; if (both == null && !HOOKS.o) both = n; });
  out.cut = { reachedAfterLash: reachT == null ? null : +(reachT - tL).toFixed(2), first: first && +first.toFixed(2), both: both && +both.toFixed(2), free: !HOOKS.o && !o.lashed, runs: !!o.fleeing, msg: said.filter(t => /Her hand cuts/.test(t)), pir: !!o.pirated };
  // again, with a hit on him at 4 s into his cut: his 6 s start again, and the hit is piracy
  o.fleeing = false; o.pirated = false; o.speed = 0; const p1 = at(S.W / 2 + o.W / 2 + 6, 1.5); o.x = p1.x; o.z = p1.z; o.yaw = S.yaw; placeOther(o);
  for (const e of hands) { e.x = o.x; e.z = o.z; }
  const crimes0 = (worldState.crimes || []).length;
  throwHooks(o); run(5.3, () => { o.wp = { x: o.x, z: o.z }; px = S.x; pz = S.z; });
  let started = null, hitAt = null, cutAt = null; const t1 = performance.now();
  run(14, () => { px = S.x; pz = S.z; if (!o.fleeing) o.wp = { x: o.x, z: o.z }; const n = (performance.now() - t1) / 1000, C = o._cut;
    if (started == null && C && C.t0 != null) started = n;
    if (started != null && hitAt == null && n - started >= 4) { hitAt = n; const e = C.e; e.hp -= 3; }
    if (cutAt == null && HOOKS.cleats.some(c => c.cut)) cutAt = n; });
  out.hit = { started: started && +started.toFixed(2), hitAt: hitAt && +hitAt.toFixed(2), cutAt: cutAt && +cutAt.toFixed(2), pir: !!o.pirated, booked: (worldState.crimes || []).length - crimes0 };
  hookDrop();
  // on her deck: they keep their heads down and cut nothing
  o.fleeing = false; o.speed = 0; const p2 = at(S.W / 2 + o.W / 2 + 6, 1.5); o.x = p2.x; o.z = p2.z; o.yaw = S.yaw; placeOther(o);
  throwHooks(o); run(5.3, () => { o.wp = { x: o.x, z: o.z }; px = S.x; pz = S.z; });
  run(8, () => { o.wp = { x: o.x, z: o.z }; px = o.x; pz = o.z; jumpY = DECK_Y; }); out.aboard = { cut: HOOKS.cleats.filter(c => c.cut).length, lashed: lashed(o) };
  hookDrop(); px = S.x; pz = S.z;
  // her rig: a living hand douses it at 3 s, as a black sail's
  o.rig = 100; lightRig(o, BALLISTA.burn, BALLISTA.burnS); let doused = null, nt = 0; for (let i = 0; i < 300 && doused == null; i++) { WORLD.tick(1 / 60, performance.now()); nt++; if (!(o.burn > 0)) doused = nt / 60; } /* by the ticks, as the douse counts them */
  out.douse = doused && +doused.toFixed(2);
  // killed: the same piracy, once; no murder
  const c0 = (worldState.crimes || []).length; o.pirated = false; for (const e of hands) { if (!e.dead) { e.hp = 0; killZoneEnemy(e, WORLD.scene); } } run(.2);
  out.kill = { crimes: (worldState.crimes || []).slice(c0).map(c => c.kind), dead: hands.every(e => e.dead) };
  despawnOtherShip(o); showMsg = sm; seaState = ss; return out; });
console.log('hands', JSON.stringify(mh));
check('a merchantman near you carries two hands, keyed by her id, on bodies with nothing in their hands', mh.made.n === 2 && mh.made.ids.join() === 'test:hands:hand:0,test:hands:hand:1' && mh.made.alive && !mh.made.armed, mh.made);
check('on the new look each hand wears the builder\'s body keyed <her id>:hand:<k>:Deckhand, in a shirt with its sleeves rolled and slops, barefoot, with nothing of the town\'s (S1941)', mh.dress.every((d, k) => d.hb && d.key === `test:hands:hand:${k}:Deckhand` && d.D && d.D.shirt && d.D.slops && d.D.bare && d.D.rolled && !d.D.extra.length), mh.dress);
check('they never turn on you: three seconds beside one, no blow, no alert, no piracy', mh.calm.hp && !mh.calm.alert && !mh.calm.pir, mh.calm);
check('lashed, her hand cuts a line about 6 s after he reaches it and the other after, and she runs free; no piracy without a blow', mh.cut.first >= 6 && mh.cut.first < 11 && mh.cut.both > mh.cut.first + 5.9 && mh.cut.free && mh.cut.runs && mh.cut.msg.length >= 2 && !mh.cut.pir, mh.cut);
check('a hit on him 4 s into his cut starts his 6 s again (cut 10 s after he began), and the hit is piracy, booked once', mh.hit.cutAt - mh.hit.started >= 9.9 && mh.hit.pir && mh.hit.booked === 1, mh.hit);
check('with you on her deck they cut nothing', mh.aboard.cut === 0 && mh.aboard.lashed, mh.aboard);
check('a living hand douses her rig at 3 s', mh.douse >= 2.9 && mh.douse < 3.5, mh.douse);
check('killing her hands is the one piracy, not a murder', mh.kill.dead && mh.kill.crimes.join() === 'piracy', mh.kill);

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
    if (HOOKS.by === 'her' && !t0) { t0 = HOOKS.phase === 'throw' ? HOOKS.t0 * 1000 : n; out.thrown = { by: HOOKS.by, phase: HOOKS.phase }; /* S1851 — the throw from the game's own stamp, made inside the tick: n, read after it, was up to one tick late, and lashed read 4.99 when the throw's tick ran longer than the lashing's */ }
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
  out.hands = p.crew.filter(e => !e.dead && e._ship === p).length;
  let nb = 0; while (p.burn > 0 && nb < 1200) { step(1); nb++; } /* the fire runs on the tick's time, as the leak does */
  out.burnS = +(nb / 60).toFixed(2); out.rigAfter = p.rig; out.burnLeft = p.burn; out.douseMsg = document.getElementById('msg').textContent;
  // S1848 — her hands douse it after 3 s (#1143 A); a hand hit in that time starts the 3 s again; with her hands down it runs full
  const relight = () => { p.rig = 100; lightRig(p, BALLISTA.burn, BALLISTA.burnS); };
  relight(); nb = 0; while (p.burn > 0 && nb < 1200) { step(1); nb++; if (nb === 120) p.crew.find(e => !e.dead).hp -= 1; }
  out.hitS = +(nb / 60).toFixed(2); out.hitRig = p.rig;
  for (const e of p.crew) { e.hp = 0; e.dead = true; }
  relight(); nb = 0; while (p.burn > 0 && nb < 1200) { step(1); nb++; } out.downS = +(nb / 60).toFixed(2); out.downRig = p.rig;
  ballistaFireMode(false);
  // out of the arc: she lies abeam, 40 m to starboard
  p.x = S.x + 40; p.z = S.z; const pinA = () => { p.x = S.x + 40; p.z = S.z; }; hold(); pinA(); BOLTS.t = -1e9; out.abeam = ballistaBears(); out.abeamWhy = ballistaWhy();
  // out of range: 120 m ahead
  p.x = S.x; p.z = S.z - 120; out.far = ballistaBears();
  // S1827 — a merchantman ahead bears only when no black sail does: with both ahead, the merchantman nearer, the black sail is chosen
  p.x = S.x; p.z = S.z - 60; const m = spawnOtherShip('merchant', S.x + 3, S.z - 45); m.speed = 0; out.both = ballistaBears() === p;
  despawnOtherShip(p); out.merchant = ballistaBears() === m;
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
check('a fire bolt takes 4 hull and sets her rig alight; her hands douse it after 3 s: 6 rig', bl.hands >= 1 && bl.fireLost === 4 && /her rig is alight/.test(bl.fireMsg) && bl.rigAt >= 98 && bl.rigAfter === 94 && bl.burnLeft === 0 && Math.abs(bl.burnS - 3) < .05 && /The black sail's hands put out the fire in her rig\./.test(bl.douseMsg), bl);
check('a hand hit at 2 s starts the 3 s again (5 s, 10 rig); with her hands down it burns its full 8 s (16 rig)', Math.abs(bl.hitS - 5) < .05 && bl.hitRig === 90 && Math.abs(bl.downS - 8) < .05 && bl.downRig === 84, bl);
check('abeam and far do not bear; a merchantman bears only when no black sail does', !bl.abeam && !bl.far && bl.both && bl.merchant && /Nothing bears/.test(bl.abeamWhy), bl);
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


// S1827 — piracy (the page: "A hit on a merchantman is piracy"): the first hit on a merchantman is booked once, as a seen theft of
// nothing (favour −2, debt 2, a fine of 50) at the nearest town of her nation; she runs at once; a second hit books nothing more
const pr = await page.evaluate(() => {
  for (const o of [...OTHER]) despawnOtherShip(o);
  worldState.ship = { cls: 'sloop', name: 'Test Gull', sails: 0, cargo: 0, hold: { bolts: 20 } }; WORLD.spawnShip(_sea.x, _sea.z, 0); const S = WORLD.ship; S.sailing = true; S.speed = 0; S.yaw = 0;
  gold = 1000; if (!shipFitted('ballista')) fitShip('ballista'); worldState.ship.hold.bolts = 20; BOLTS.t = -1e9; ballistaFireMode(false);
  const m = spawnOtherShip('merchant', S.x, S.z - 50, 'test:piracy'); m.speed = 0; m.yaw = Math.PI / 2;
  const out = {}; const town = piracyTown(m); out.town = town && town.id; out.townNation = town && nationAt(town.x, town.z); out.herNation = nationAt(m.x, m.z);
  const C0 = JSON.parse(JSON.stringify((worldState.crime || {})[out.town] || { bounty: 0, debt: 0 })), f0 = (worldState.favor || {})[out.town] || 0, n0 = (worldState.crimes || []).length;
  const step = n => { for (let i = 0; i < n; i++) { S.x = _sea.x; S.z = _sea.z; S.speed = 0; S.yaw = 0; if (!m.pirated) { m.x = S.x; m.z = S.z - 50; m.speed = 0; } for (const o of [...OTHER]) if (o !== m) despawnOtherShip(o); WORLD.tick(1 / 60, performance.now()); } };
  out.fire = fireBallista(); const h0 = m.hull, t0 = performance.now(); while (m.hull === h0 && performance.now() - t0 < 4000) step(1); /* the bolt flies on the clock */
  out.lost = h0 - m.hull; out.msg = document.getElementById('msg').textContent; out.fleeing = !!m.fleeing; out.pirated = !!m.pirated;
  const C1 = (worldState.crime || {})[out.town] || { bounty: 0, debt: 0 }; out.bounty = C1.bounty - C0.bounty; out.debt = C1.debt - (C0.debt || 0); out.favor = ((worldState.favor || {})[out.town] || 0) - f0;
  out.logged = (worldState.crimes || []).slice(n0).map(c => c.kind);
  out.again = piracy(m); out.bounty2 = ((worldState.crime || {})[out.town] || { bounty: 0 }).bounty - C0.bounty;
  // a black sail struck is no crime
  const p = spawnOtherShip('pirate', S.x + 200, S.z, 'test:nopiracy'); out.pirate = piracy(p);
  despawnOtherShip(m); despawnOtherShip(p); return out; });
console.log('piracy', JSON.stringify(pr));
check('a bolt on a merchantman is piracy: booked at a town of her nation, a fine of 50, favour −2, debt 2', pr.fire === true && pr.lost === 10 && !!pr.town && pr.townNation === pr.herNation && pr.bounty === 50 && pr.favor === -2 && pr.debt === 2 && pr.logged.join() === 'piracy', pr);
check('her crew saw it, and she runs at once though barely holed', /Her crew saw you fire on her\./.test(pr.msg) && /crowds on sail and runs/.test(pr.msg) && pr.fleeing && pr.pirated, pr);
check('once a ship: a second hit books nothing; a black sail is no crime', pr.again === null && pr.bounty2 === 50 && pr.pirate === null, pr);

// S1837 — the fire pot (the page's table; Michael's A on #1108): a clay pot, 3 gold, at an apothecary and the goods shop; sealed with a pitch at
// the mortar from Alchemy 25; thrown where you look at a ship within 20 m, her rig 3 a second for 6 s, 12 fire to a hand within 2 m of it
const fp = await page.evaluate(() => {
  for (const o of [...OTHER]) despawnOtherShip(o);
  worldState.ship = { cls: 'sloop', name: 'Test Gull', sails: 0, cargo: 0, hold: {} }; WORLD.spawnShip(_sea.x, _sea.z, 0); const S = WORLD.ship; S.sailing = true; S.speed = 0; S.yaw = 0;
  const out = {};
  out.shops = ['potion', 'apothecary', 'misc', 'smith', 'inn'].map(t => clayPotFor({ type: t }).map(i => i.name + ':' + i.buyPrice + ':' + i.weight).join());
  bagTake(b => b.name === 'Clay Pot' || b.firePot, 999); bagTake(b => b.name === SURV_ITEMS.pitch.name, 999);
  const sk = skillsReady().alchemy, lv0 = sk.lv; sk.lv = 20; out.low = sealFirePot();
  sk.lv = 25; out.noPot = sealFirePot(); bagAdd({ ...CLAY_POT_ITEM }); bagAdd({ ...CLAY_POT_ITEM }); out.noPitch = sealFirePot();
  bagAdd(Object.assign({}, SURV_ITEMS.pitch, { qty: 1 })); out.seal = sealFirePot(); out.pots = firePotCount(); out.clay = clayPotCount(); out.pitch = pitchCount(); sk.lv = lv0;
  // a black sail 15 m ahead (yaw 0 looks along -z), her ram, hooks and volleys held off
  const p = spawnOtherShip('pirate', S.x, S.z - 15, 'test:pot'); p.speed = 0; p.yaw = Math.PI / 2; p.rig = 100;
  const pin = () => { S.x = _sea.x; S.z = _sea.z; S.speed = 0; S.yaw = 0; p.x = S.x; p.z = S.z - 15; p.speed = 0; p.volleyT = 1e9; p.ramWait = 1e9; p.hookWait = 1e9; p.ramming = 0; };
  const step = n => { for (let i = 0; i < n; i++) { pin(); for (const o of [...OTHER]) if (o !== p) despawnOtherShip(o); WORLD.tick(1 / 60, performance.now()); } };
  step(2); yaw = Math.PI; out.away = throwPotWhy(); yaw = 0; out.target = potTarget() === p; out.dist = +Math.hypot(p.x - px, p.z - pz).toFixed(1);
  const hand = p.crew.filter(e => !e.dead && Math.hypot(e.x - p.x, e.z - p.z) <= 2), hp0 = hand.map(e => e.hp), far = p.crew.filter(e => !hand.includes(e)).map(e => e.hp);
  out.hands = hand.length; out.res = hand.map(e => e.resist && e.resist.tine);
  const h0 = p.hull, t0 = performance.now(); out.thrown = throwPot(); out.potsLeft = firePotCount();
  while (!(p.burn > 0) && performance.now() - t0 < 4000) step(1);
  out.arrive = +((performance.now() - t0) / 1000).toFixed(2); out.msg = document.getElementById('msg').textContent; out.hullLost = h0 - p.hull;
  out.handLost = hand.map((e, i) => hp0[i] - Math.max(0, e.hp)); out.farLost = p.crew.filter(e => !hand.includes(e)).map((e, i) => far[i] - e.hp);
  let nb = 0; while (p.burn > 0 && nb < 1200) { step(1); nb++; } out.burnS = +(nb / 60).toFixed(2); out.rig = p.rig;
  out.none = (bagTake(b => b.firePot, 999), throwPotWhy()); bagAdd({ ...FIRE_POT_ITEM }); p.x = S.x; p.z = S.z - 40; out.tooFar = throwPotWhy();
  despawnOtherShip(p); bagTake(b => b.firePot, 999); return out; });
console.log('firepot', JSON.stringify(fp));
check('a clay pot, 3 gold and half a weight, at an apothecary and the goods shop, not the smith or the inn', fp.shops[0] === 'Clay Pot:3:0.5' && fp.shops[1] === fp.shops[0] && fp.shops[2] === fp.shops[0] && !fp.shops[3] && !fp.shops[4], fp.shops);
check('sealed from Alchemy 25 out of a clay pot and a pitch, and refused without them', /Alchemy 25/.test(fp.low) && fp.noPot === 'It needs a clay pot.' && fp.noPitch === 'It needs a pitch.' && fp.seal === true && fp.pots === 1 && fp.clay === 1 && fp.pitch === 0, fp);
check('thrown only where you look: a black sail 15 m ahead is the mark, none behind you', fp.target && /No ship within a throw/.test(fp.away || ''), fp);
check('it lands: her rig alight at 3 a second, her hands douse it after 3 s (9 rig), no hull', fp.thrown === true && fp.potsLeft === 0 && fp.hullLost === 0 && Math.abs(fp.burnS - 3) < .05 && fp.rig === 91 && /Your fire pot breaks on the black sail's deck, and her rig is alight\./.test(fp.msg), fp);
check('12 fire to each hand within 2 m (as his resistance), none to the hands beyond', fp.hands >= 1 && fp.handLost.every((l, i) => l === Math.max(1, Math.round(12 * (fp.res[i] != null ? fp.res[i] : 1)))) && fp.farLost.every(l => l === 0), fp);
check('no pot, no throw; beyond 20 m, no throw', fp.none === 'You have no fire pot.' && /20 m/.test(fp.tooFar || ''), fp);

// S1838 — the heavy arrow at a hand (Michael's A on #1120; S1844, by the water's tier, #1136 B): with the crosshair on one of her hands, the bolt flies at him: 20–30 × tier × Bow's
// multiplier (×0.6 at Bow 0, ×1.4 at 100) on his own stream, none to her hull; with the crosshair off them, the bolt strikes her hull as before
const ha = await page.evaluate(() => {
  for (const o of [...OTHER]) despawnOtherShip(o);
  worldState.ship = { cls: 'sloop', name: 'Test Gull', sails: 0, cargo: 0, hold: {} }; WORLD.spawnShip(_sea.x, _sea.z, 0); const S = WORLD.ship; S.sailing = true; S.speed = 0; S.yaw = 0;
  gold = 1000; if (!shipFitted('ballista')) fitShip('ballista'); worldState.ship.hold.bolts = 40; ballistaFireMode(false);
  const out = { shots: [] }; const sk = skillsReady().bow, lv0 = sk.lv;
  let p = null; const pin = () => { S.x = _sea.x; S.z = _sea.z; S.speed = 0; S.yaw = 0; if (p) { p.x = S.x; p.z = S.z - 50; p.speed = 0; p.volleyT = 1e9; p.ramWait = 1e9; p.hookWait = 1e9; p.ramming = 0; } };
  const step = n => { for (let i = 0; i < n; i++) { pin(); for (const o of [...OTHER]) if (o !== p) despawnOtherShip(o); WORLD.tick(1 / 60, performance.now()); } };
  const aim = (x, y, z) => { CAM.position.set(S.x, DECK_Y + 2.5, S.z); CAM.lookAt(x, y, z); CAM.updateMatrixWorld(true); };
  const shot = (lv, at) => { if (p) despawnOtherShip(p); p = spawnOtherShip('pirate', S.x, S.z - 50, 'test:hand:' + out.shots.length); p.yaw = Math.PI / 2; step(2); sk.lv = lv;
    const e = p.crew.find(c => !c.dead); const ey = e.mesh ? e.mesh.position.y : DECK_Y;
    if (at === 'hand') aim(e.x, ey + 1.1, e.z); else aim(p.x, DECK_Y + 40, p.z);
    const r = { lv, at, m: +skillMult('bow').toFixed(2), hand: ballistaHand(p) === e, hp0: e.hp, hull0: p.hull }; BOLTS.t = -1e9; r.hud = ballistaHud(); r.tier = worldTierAt(p.x, p.z); r.etier = e.tier; r.k = ballistaHandTierK(e); r.fire = fireBallista();
    const t0 = performance.now(); while (BOLTS.fly.length && performance.now() - t0 < 4000) step(1);
    r.lost = r.hp0 - Math.max(0, e.hp); r.dead = !!e.dead || e.hp <= 0; r.hull = r.hull0 - p.hull; r.msg = document.getElementById('msg').textContent; out.shots.push(r); };
  shot(0, 'hand'); shot(0, 'hand'); shot(100, 'hand'); shot(100, 'hand'); shot(50, 'sky');
  out.ks = [1, 2, 3].map(t => ballistaHandTierK({ tier: t }));
  sk.lv = lv0; despawnOtherShip(p); return out; });
console.log('hand', JSON.stringify(ha));
{ const H = ha.shots.filter(s => s.at === 'hand'), sky = ha.shots.find(s => s.at === 'sky');
  check('with the crosshair on a hand, the bolt flies at him and her hull is untouched', H.every(s => s.hand && s.fire === true && s.hull === 0 && s.lost > 0) && /on a hand/.test(H[0].hud), ha);
  check('the arrow scales by the water\'s tier as his health does (#1136 B): ×1, 1.75, 2.5 at tiers 1–3, his own tier read here', ha.ks.join() === '1,1.75,2.5' && H.every(s => s.k === ha.ks[(s.etier || 1) - 1]), { ks: ha.ks, h: H.map(s => [s.etier, s.k]) });
  check('20–30 × tier × Bow: in this tier-2 water 21–32 at Bow 0, 49–74 at Bow 100 (a kill is all he had)', H.every(s => { const lo = Math.round(20 * s.k * s.m), hi = Math.round(30 * s.k * s.m); return s.dead ? s.lost >= Math.min(lo, s.hp0) : s.lost >= lo && s.lost <= hi; }) && H[0].m === .6 && H[2].m === 1.4, H);
  check('the line names the hand', H.every(s => /Your bolt (strikes|takes) one of the black sail's hands/.test(s.msg)), H.map(s => s.msg));
  check('with the crosshair off her hands, the bolt strikes her hull for 10', sky && !sky.hand && sky.hull === 10 && sky.lost === 0, sky); }

// S1839 — black sails by the water's tier (Michael's A on #1115): tier 1 the sloop, 2 and 3 the cutter (12 m/s, 80 hull) with a bow
// ballista that looses at your ship every 6 s for 10 hull while it lies in her bow arc, worked by a living hand
const cu = await page.evaluate(() => {
  for (const o of [...OTHER]) despawnOtherShip(o);
  worldState.ship = { cls: 'sloop', name: 'Test Gull', sails: 0, cargo: 0, hold: {} }; WORLD.spawnShip(_sea.x, _sea.z, 0); const S = WORLD.ship; S.sailing = true; S.speed = 0; S.yaw = 0;
  const out = {}; const wt = window.worldTierAt; out.byTier = [1, 2, 3, 4].map(t => { window.worldTierAt = () => t; return blackSailCls(0, 0, () => .1) + '/' + blackSailCls(0, 0, () => .5); }); window.worldTierAt = wt;
  out.here = worldTierAt(_sea.x, _sea.z); out.plain = spawnOtherShip('pirate', S.x + 300, S.z, 'test:plain').cls;
  const c = spawnOtherShip('pirate', S.x, S.z - 60, 'test:cutter', 'cutter'); out.cls = c.cls; out.hull = c.hull; out.hullMax = c.hullMax; out.top = c.top; out.crew = c.crew.length;
  let pinYaw = Math.PI, pinD = 60, hold = true;
  const pin = () => { S.x = _sea.x; S.z = _sea.z; S.speed = 0; S.yaw = 0; if (hold) { c.x = S.x + (pinYaw === Math.PI ? 0 : pinD); c.z = S.z - (pinYaw === Math.PI ? pinD : 0); c.yaw = pinYaw; c.speed = 0; } c.volleyT = 1e9; c.ramWait = 1e9; c.hookWait = 1e9; c.ramming = 0; };
  const step = n => { for (let i = 0; i < n; i++) { pin(); for (const o of [...OTHER]) if (o !== c) despawnOtherShip(o); WORLD.tick(1 / 60, performance.now()); } };
  const watch = secs => { const ev = [], t0 = performance.now(); let h = shipBars().hull; while (performance.now() - t0 < secs * 1000) { step(1); const h2 = shipBars().hull; if (h2 < h) { ev.push({ t: +((performance.now() - t0) / 1000).toFixed(2), lost: h - h2, msg: document.getElementById('msg').textContent }); h = h2; } } return ev; };
  step(1); out.bow = watch(14);
  pinYaw = 0; pinD = 40; c.balT = -1e9; out.abeam = watch(3); /* at 40 m to starboard, her bow north */
  pinYaw = Math.PI; pinD = 60; for (const e of c.crew) e.dead = true; c.balT = -1e9; out.noCrew = watch(3);
  // she hunts at her own top: let her go from 200 m off
  hold = false; c.x = S.x; c.z = S.z - 200; c.yaw = Math.PI; c.speed = 0; step(600); out.speed = +c.speed.toFixed(2);
  despawnOtherShip(c); return out; });
console.log('cutter', JSON.stringify(cu));
check('the hull by the water: tier 1 a sloop, tier 2 a cutter, tier 3 and up a cutter or one in five a galleon; a plain spawn keeps the sloop', cu.byTier.join() === 'sloop/sloop,cutter/cutter,galleon/cutter,galleon/cutter' && cu.plain === 'sloop', cu);
check('the cutter: 80 hull, a top of 12 m/s, three hands', cu.cls === 'cutter' && cu.hull === 80 && cu.hullMax === 80 && cu.top === 12 && cu.crew === 3, cu);
check('bow on at 60 m her ballista strikes your ship for 10 every 6 s', cu.bow.length === 2 && cu.bow.every(e => e.lost === 10 && /The black sail's bolt strikes the Test Gull\. Hull −10\./.test(e.msg)) && cu.bow[1].t - cu.bow[0].t > 5.8 && cu.bow[1].t - cu.bow[0].t < 6.4 && cu.bow[0].t > 5.8, cu.bow);
check('abeam she cannot bring it to bear; with no living hand nothing looses', cu.abeam.length === 0 && cu.noCrew.length === 0, cu);
check('hunting, she makes her own 12 m/s', cu.speed > 11 && cu.speed <= 12.01, cu.speed);

// S1840 — the black galleon: 200 hull, 9.5 m/s; with your ship within 25° of her beam and 150 m, a side's six guns strike for 6 each (36),
// that side then reloading 20 s; bow-on, nothing
const bg = await page.evaluate(() => {
  for (const o of [...OTHER]) despawnOtherShip(o);
  worldState.ship = { cls: 'sloop', name: 'Test Gull', sails: 0, cargo: 0, hold: {} }; WORLD.spawnShip(_sea.x, _sea.z, 0); const S = WORLD.ship; S.sailing = true; S.speed = 0; S.yaw = 0;
  const out = {}; const G = spawnOtherShip('pirate', S.x - 80, S.z, 'test:galleon', 'galleon'); out.cls = G.cls; out.hull = G.hullMax; out.top = G.top; out.L = G.L;
  let gx = -80, gz = 0, gyaw = 0;
  const step = n => { for (let i = 0; i < n; i++) { S.x = _sea.x; S.z = _sea.z; S.speed = 0; S.yaw = 0; G.x = S.x + gx; G.z = S.z + gz; G.yaw = gyaw; G.speed = 0; G.volleyT = 1e9; G.ramWait = 1e9; G.hookWait = 1e9; G.ramming = 0;
    for (const o of [...OTHER]) if (o !== G) despawnOtherShip(o); WORLD.tick(1 / 60, performance.now()); } };
  const watch = secs => { const ev = [], t0 = performance.now(); let h = shipBars().hull; while (performance.now() - t0 < secs * 1000) { step(1); const h2 = shipBars().hull; if (h2 < h) { ev.push({ t: +((performance.now() - t0) / 1000).toFixed(2), lost: h - h2 }); h = h2; } } return { ev, msg: document.getElementById('msg').textContent, lost: ev.reduce((a, e) => a + e.lost, 0) }; };
  step(1); out.side = herGunsSide(G); G.gunT = { port: -1e9, stbd: -1e9 }; out.fire = watch(3); out.reload = watch(5);
  gx = 0; gz = -80; gyaw = Math.PI; step(1); G.gunT = { port: -1e9, stbd: -1e9 }; out.bowSide = herGunsSide(G); out.bow = watch(2);
  despawnOtherShip(G); return out; });
console.log('galleon', JSON.stringify(bg));
check('the black galleon: 200 hull, 9.5 m/s, a galleon\'s 22 m', bg.cls === 'galleon' && bg.hull === 200 && bg.top === 9.5 && bg.L === 22, bg);
check('your ship 80 m off her starboard beam: six balls of 6 in a ripple, 36 in all, and the line says so', bg.side === 'stbd' && bg.fire.lost === 36 && bg.fire.ev.length >= 2 && /The black galleon's broadside strikes the Test Gull\. Hull −36\./.test(bg.fire.msg), bg.fire);
check('that side reloads 20 s; bow-on no side bears', bg.reload.lost === 0 && bg.bowSide === null && bg.bow.lost === 0, bg);

check('no page errors', g.errs.length === 0, g.errs);
if (stop) stop();
await g.close();
