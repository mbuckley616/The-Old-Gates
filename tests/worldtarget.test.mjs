// Session 542: the co-op rule "a foe picks its target through one function, targetOf(e)" (CLAUDE.md, Michael's A on #119),
// carried into the world files, which Session 468 left unaudited. Three hostile choosers read px/pz there: a town guard who
// trails you (favour −2) or runs you down (sent after a fine, `_chase`), and a black sail at sea (her course, her flight
// when sated, and where her volleys come down). Each is driven once as built (it goes to you) and once with targetOf
// pointed at a decoy on the far side from you (it must go to the decoy instead). Time is WORLD.tick at fixed 1/60.
import { boot, check } from './lib/game.mjs';
const g = await boot(); const { page } = g;
await g.intoWorld(); await g.settle('dunmore');
await page.evaluate(() => { window._targetOf = targetOf; });

const solo = await page.evaluate(() => { const T = targetOf({}); jumpY = 1.25; const y = T.y; jumpY = 0; return { y, y0: T.y }; });
check('solo, targetOf(e).y is your height, read live', solo.y === 1.25 && solo.y0 === 0, solo);

// a guard of Dunmore, by day, trailing you (favour −2) or sent after you (_chase); you stand still on the pad
const guard = (mode, decoy) => page.evaluate(([mode, decoy]) => { forceTime(12); const S = WORLD.settle.get('dunmore'); const site = S.site;
  if (worldState.crime) delete worldState.crime[site.id]; (worldState.favor || (worldState.favor = {}))[site.id] = mode === 'follow' ? -2 : 0;
  const tick = n => { for (let i = 0; i < n; i++) WORLD.tick(1 / 60, performance.now()); };
  px = site.x + 6; pz = site.z - 6; jumpY = 0; tick(30);
  const G = WORLD.guardsOf(S).filter(n => n.g.visible && !n._drawn); if (!G.length) return { none: true };
  let n = mode === 'follow' ? S._follower : G[0]; if (!n) return { noFollower: true };
  // stand him 20 units from you, with the decoy 20 units beyond him the other way: on the pad, in the street grid
  const ox = px, oz = pz; const a = Math.atan2(n.g.position.x - px, n.g.position.z - pz);
  const P = { x: px + Math.sin(a) * 20, z: pz + Math.cos(a) * 20 }; n.g.position.set(P.x, WORLD.worldH(P.x, P.z), P.z);
  const D = { x: px + Math.sin(a) * 40, z: pz + Math.cos(a) * 40, y: 0 };
  if (mode === 'chase') { n._chase = true; n._follow = false; }
  const d0 = { you: Math.hypot(n.g.position.x - ox, n.g.position.z - oz), decoy: Math.hypot(n.g.position.x - D.x, n.g.position.z - D.z) };
  if (decoy) targetOf = () => D;
  try { for (let i = 0; i < 60 * 12; i++) { px = ox; pz = oz; WORLD.tick(1 / 60, performance.now()); } } finally { targetOf = window._targetOf; }
  const still = S._follower === n || mode === 'chase'; if (mode === 'follow' && S._follower) n = S._follower;
  const d1 = { you: Math.hypot(n.g.position.x - ox, n.g.position.z - oz), decoy: Math.hypot(n.g.position.x - D.x, n.g.position.z - D.z) };
  n._chase = false; worldState.favor[site.id] = 0; tick(2);
  const r = v => +v.toFixed(1); return { name: n.def && n.def.name, still, d0: { you: r(d0.you), decoy: r(d0.decoy) }, d1: { you: r(d1.you), decoy: r(d1.decoy) } }; }, [mode, decoy]);

const f0 = await guard('follow', false), f1 = await guard('follow', true);
console.log('follow', JSON.stringify(f0), JSON.stringify(f1));
check(`favour −2, as built: the guard trailing you closes to his six to eight units (${f0.d0 && f0.d0.you} → ${f0.d1 && f0.d1.you})`, f0.d1 && f0.d1.you <= 9 && f0.still, f0);
check(`favour −2, targetOf at a decoy: he trails the decoy (${f1.d0 && f1.d0.decoy} → ${f1.d1 && f1.d1.decoy}), not you (${f1.d0 && f1.d0.you} → ${f1.d1 && f1.d1.you})`, f1.d1 && f1.d1.decoy <= 9 && f1.d1.you > f1.d0.you + 8, f1);

const c0 = await guard('chase', false), c1 = await guard('chase', true);
console.log('chase', JSON.stringify(c0), JSON.stringify(c1));
check(`sent after you, as built: he runs you down (${c0.d0 && c0.d0.you} → ${c0.d1 && c0.d1.you})`, c0.d1 && c0.d1.you < 3, c0);
check(`sent after you, targetOf at a decoy: he runs the decoy down (${c1.d0 && c1.d0.decoy} → ${c1.d1 && c1.d1.decoy}), not you (${c1.d1 && c1.d1.you})`, c1.d1 && c1.d1.decoy < 3 && c1.d1.you > 30, c1);

// the guard sent after a fine (CR.sent) measures his chase from targetOf: the distance he keeps, and whether you are still on the pad
const sent = await page.evaluate(() => { const S = WORLD.settle.get('dunmore'); const site = S.site; const n = WORLD.guardsOf(S).find(n => n.g.visible && !n._drawn);
  px = site.x + 6; pz = site.z - 6; n.g.position.set(px + 10, WORLD.worldH(px + 10, pz), pz);
  (worldState.crime || (worldState.crime = {}))[site.id] = { bounty: 25, shut: false };
  CR.sent = { site: site.id, house: 'none', npc: n, t: 0, ct: 0, phase: 'chase', from: { x: n.g.position.x, z: n.g.position.z }, door: { x: px, z: pz }, out: { x: 0, z: 1 }, walk: 0, mesh: null }; n._chase = true;
  const D = { x: site.x + 2000, z: site.z, y: 0 }; targetOf = () => D;
  let ended = false; try { tickSent(1 / 60, false); ended = !CR.sent; } finally { targetOf = window._targetOf; }
  const last = !ended && CR.sent.last; if (CR.sent) endSent(); n._chase = false; delete worldState.crime[site.id];
  return { ended, last, msg: document.getElementById('msg').textContent }; });
console.log('sent', JSON.stringify(sent));
check('a sent guard gives up the chase when his target (a decoy 2,000 units off) is off the pad, though you stand on it', sent.ended && /gives up the chase/.test(sent.msg), sent);

// a black sail at sea: your sloop held still, she 150 units east; the decoy 150 units beyond her
const sea = await page.evaluate(() => { const s = WORLD.allPorts().sort((a, b) => Math.hypot(a.x - px, a.z - pz) - Math.hypot(b.x - px, b.z - pz))[0];
  for (let r = 400; r < 4000; r += 40) for (let a = 0; a < 6.28; a += .25) { const x = s.x + Math.cos(a) * r, z = s.z + Math.sin(a) * r;
    if ([[0, 0], [200, 0], [400, 0], [0, 60], [0, -60], [200, 60], [200, -60]].every(([dx, dz]) => WORLD.worldH(x + dx, z + dz) < -6)) { window._sea = { x, z }; return { x, z }; } } return null; });
check('open sea found', !!sea, sea);
const pirate = (decoy) => page.evaluate((decoy) => {
  for (const o of [...WORLD.others]) WORLD.despawnOtherShip(o);
  worldState.ship = { cls: 'sloop', name: 'Test Gull', sails: 0, cargo: 0, hold: {} }; WORLD.spawnShip(_sea.x, _sea.z, 0); const S = WORLD.ship; S.sailing = true; S.speed = 0;
  WORLD.tick(1 / 60, performance.now());
  const o = WORLD.spawnOtherShip('pirate', _sea.x + 150, _sea.z); o.yaw = Math.PI / 2; o.speed = 0; o.volleyT = 1e9; o.ramWait = 1e9;
  const D = { x: _sea.x + 300, z: _sea.z, y: 0 }; if (decoy) targetOf = () => D;
  const you = () => Math.hypot(o.x - S.x, o.z - S.z), dec = () => Math.hypot(o.x - D.x, o.z - D.z);
  const d0 = { you: you(), decoy: dec() };
  try { for (let i = 0; i < 60 * 20; i++) { for (const x of WORLD.others) if (x !== o) WORLD.despawnOtherShip(x); o.volleyT = 1e9; o.ramWait = 1e9; S.x = _sea.x; S.z = _sea.z; S.speed = 0; WORLD.tick(1 / 60, performance.now()); } }
  finally { targetOf = window._targetOf; }
  const r = v => +v.toFixed(1); const out = { d0: { you: r(d0.you), decoy: r(d0.decoy) }, d1: { you: r(you()), decoy: r(dec()) } }; WORLD.despawnOtherShip(o); return out; }, decoy);
const p0 = await pirate(false), p1 = await pirate(true);
console.log('pirate', JSON.stringify(p0), JSON.stringify(p1));
check(`a black sail, as built: she closes on you (${p0.d0.you} → ${p0.d1.you})`, p0.d1.you < p0.d0.you - 40, p0);
check(`a black sail, targetOf at a decoy: she closes on it (${p1.d0.decoy} → ${p1.d1.decoy}) and opens from you (${p1.d0.you} → ${p1.d1.you})`, p1.d1.decoy < p1.d0.decoy - 40 && p1.d1.you > p1.d0.you + 20, p1);

// her volley comes down round targetOf, at its height
const vol = await page.evaluate(() => { const o = WORLD.spawnOtherShip('pirate', _sea.x + 40, _sea.z); const D = { x: _sea.x + 80, z: _sea.z + 30, y: 2 };
  const n0 = ARROWS.length; targetOf = () => D; try { volley(o); } finally { targetOf = window._targetOf; }
  const added = ARROWS.slice(n0); const out = { n: added.length, off: added.map(a => +Math.hypot(a.tx - D.x, a.tz - D.z).toFixed(2)), ty: added.map(a => +a.ty.toFixed(2)) };
  for (const a of added) { if (a.m.parent) a.m.parent.remove(a.m); ARROWS.splice(ARROWS.indexOf(a), 1); } WORLD.despawnOtherShip(o); return out; });
console.log('volley', JSON.stringify(vol));
check('her volley comes down within 3 units of targetOf (a decoy 80 units from you), at its height + 0.6', vol.n >= 2 && vol.off.every(d => d <= 2.9) && vol.ty.every(y => y === 2.6), vol);

check('no page errors', g.errs.length === 0, g.errs);
await g.close();
