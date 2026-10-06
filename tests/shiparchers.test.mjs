// A ship's arrows come from her crew (Session 612; Michael's sailing playtest, 6 Oct 2026: "arrows should only come from
// NPCs themselves", and she "kept firing arrows at him after everyone on board had been killed"). Each arrow of a black
// sail's volley is loosed by a living hand of her crew standing on her deck, from where he stands; a hand within 8 units
// of whom she hunts does not shoot; with no such hand there is no volley at all.
import { boot, check } from './lib/game.mjs';
const g = await boot(); const { page } = g;
await g.intoWorld();
const stop = g.keepAlive ? g.keepAlive() : null;

const sea = await page.evaluate(() => { const s = WORLD.allPorts().sort((a, b) => Math.hypot(a.x - px, a.z - pz) - Math.hypot(b.x - px, b.z - pz))[0];
  for (let r = 400; r < 4000; r += 40) for (let a = 0; a < 6.28; a += .25) { const x = s.x + Math.cos(a) * r, z = s.z + Math.sin(a) * r;
    if ([[0, 0], [60, 0], [-60, 0], [0, 60], [0, -60]].every(([dx, dz]) => WORLD.worldH(x + dx, z + dz) < -6)) { window._sea = { x, z }; return { x, z }; } } return null; });
check('open sea found', !!sea, sea);

// your sloop at the wheel; a black sail 40 units off, held still; one volley loosed by hand
const setup = () => page.evaluate(() => {
  for (const o of [...WORLD.others]) WORLD.despawnOtherShip(o);
  for (const a of [...WORLD.arrows]) { if (a.m.parent) a.m.parent.remove(a.m); } WORLD.arrows.length = 0;
  worldState.ship = { cls: 'sloop', name: 'Test Gull', sails: 0, cargo: 0, hold: {} }; WORLD.spawnShip(_sea.x, _sea.z, 0); const S = WORLD.ship; S.sailing = true; S.speed = 0;
  WORLD.tick(1 / 60, performance.now());
  const o = WORLD.spawnOtherShip('pirate', S.x + 40, S.z); o.yaw = 0; o.speed = 0; o.volleyT = 1e9; o.ramWait = 1e9; window._o = o;
  WORLD.tick(1 / 60, performance.now()); return o.crew.length; });
const loose = () => page.evaluate(() => { const o = _o, n0 = WORLD.arrows.length; const r = WORLD.volley(o); const added = WORLD.arrows.slice(n0);
  const out = { ret: r, n: added.length, fromCrew: added.every(a => o.crew.includes(a.from) && !a.from.dead), atHand: added.every(a => a.sx === a.from.x && a.sz === a.from.z),
    distinct: new Set(added.map(a => a.from)).size, live: o.crew.filter(e => !e.dead).length };
  for (const a of added) { if (a.m.parent) a.m.parent.remove(a.m); WORLD.arrows.splice(WORLD.arrows.indexOf(a), 1); } return out; });

const crew = await setup();
check('a black sail comes up with three hands', crew === 3, crew);
const full = await loose();
console.log('full', JSON.stringify(full));
check('three hands: a volley of 2–3 arrows, each loosed from where a living hand stands, one a hand', full.n >= 2 && full.n <= 3 && full.ret === full.n && full.fromCrew && full.atHand && full.distinct === full.n, full);

const one = await page.evaluate(() => { const o = _o; killZoneEnemy(o.crew[0], WORLD.scene); killZoneEnemy(o.crew[1], WORLD.scene); return o.crew.filter(e => !e.dead).length; });
const single = await loose();
console.log('one left', one, JSON.stringify(single));
check('two of three killed: one arrow, from the last hand', one === 1 && single.n === 1 && single.fromCrew && single.atHand, single);

await page.evaluate(() => killZoneEnemy(_o.crew[2], WORLD.scene));
const none = await loose();
check('every hand killed: no volley', none.ret === 0 && none.n === 0, none);

// her own tick, the crew dead: 30 s at 40 units with her volley clock running (the bug as Michael saw it) — no arrow, no harm
const quiet = await page.evaluate(() => { const o = _o, S = WORLD.ship; let added = 0, hp0 = PHP = maxHP;
  for (let i = 0; i < 60 * 30; i++) { for (const x of WORLD.others) if (x !== o) WORLD.despawnOtherShip(x); o.ramWait = 1e9; o.x = S.x + 40; o.z = S.z; o.speed = 0; S.speed = 0;
    if (o.volleyT > 3) o.volleyT = 3; const n0 = WORLD.arrows.length; WORLD.tick(1 / 60, performance.now()); added += Math.max(0, WORLD.arrows.length - n0); }
  return { added, hurt: hp0 - PHP }; });
check('her crew dead, 30 s within bowshot with her volley clock running: no arrow, no hurt', quiet.added === 0 && quiet.hurt === 0, quiet);

// the same with her crew alive: she looses, and every arrow is a living hand's
const live = await page.evaluate(async () => { for (const o of [...WORLD.others]) WORLD.despawnOtherShip(o);
  const S = WORLD.ship; const o = WORLD.spawnOtherShip('pirate', S.x + 40, S.z); o.yaw = 0; o.speed = 0; o.ramWait = 1e9; o.volleyT = .5; window._o = o;
  let n = 0, ok = true;
  for (let i = 0; i < 60 * 12; i++) { for (const x of WORLD.others) if (x !== o) WORLD.despawnOtherShip(x); o.ramWait = 1e9; o.x = S.x + 40; o.z = S.z; o.speed = 0; S.speed = 0; o.sentBoarders = true; PHP = maxHP;
    const n0 = WORLD.arrows.length; WORLD.tick(1 / 60, performance.now()); for (const a of WORLD.arrows.slice(n0)) { n++; if (!a.from || a.from.dead || !o.crew.includes(a.from)) ok = false; } }
  return { n, ok }; });
check(`her crew alive, 12 s within bowshot: she looses (${live.n} arrows), every one a living hand's`, live.n >= 4 && live.ok, live);

// close quarters (whom she hunts 5 units off her endmost hand): a hand within 8 units of whom she hunts has his blade out; the others still shoot
const close = await page.evaluate(() => { const o = _o; const e = o.crew.filter(c => !c.dead).sort((a, b) => Math.hypot(b.x - o.x, b.z - o.z) - Math.hypot(a.x - o.x, a.z - o.z))[0];
  const u = Math.hypot(e.x - o.x, e.z - o.z) || 1, D = { x: e.x + (e.x - o.x) / u * 5, z: e.z + (e.z - o.z) / u * 5, y: 0 };
  const n0 = WORLD.arrows.length; targetOf = () => D; let r; try { r = WORLD.volley(o); } finally { targetOf = window._targetOf; }
  const added = WORLD.arrows.slice(n0); const out = { r, near: added.some(a => a.from === e), n: added.length,
    others: o.crew.filter(c => !c.dead && c !== e && Math.hypot(c.x - D.x, c.z - D.z) >= 8).length };
  for (const a of added) { if (a.m.parent) a.m.parent.remove(a.m); WORLD.arrows.splice(WORLD.arrows.indexOf(a), 1); }
  // and every hand at close quarters: nothing
  const all = { x: o.x, z: o.z, y: 0 }; for (const c of o.crew) { c.x = o.x + (c.x - o.x) * .2; c.z = o.z + (c.z - o.z) * .2; }
  targetOf = () => all; let r2; try { r2 = WORLD.volley(o); } finally { targetOf = window._targetOf; } out.allClose = r2; return out; });
console.log('close', JSON.stringify(close));
check('a hand 5 units from whom she hunts (off her end) does not shoot; the others do', !close.near && close.n === Math.min(close.others, 3) && close.n >= 1, close);
check('every hand at close quarters: no volley', close.allClose === 0, close);

check('no page errors', g.errs.length === 0, g.errs);
if (stop) stop(); await g.close();
