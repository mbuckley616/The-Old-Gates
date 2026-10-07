// What stands on a deck is solid (Session 616; Michael's sailing playtest, 6 Oct 2026: "barrels and other meshes on the
// pirate ships (and probably on his ship and merchant ships) are for show and can be walked through"). The bake records
// each barrel, crate, mast and the wheel's post in the deck's frame; `solidAt` meets them on any ship within reach, turned
// with her. Checked: every prop of the three classes in three looks at its centre, its edge and a step clear, the deck's
// open middle still open, and a walk into a barrel by the game's own loop.
import { boot, check } from './lib/game.mjs';
const g = await boot(); const { page } = g;
await g.intoWorld();
const stop = g.keepAlive ? g.keepAlive() : null;

const sea = await page.evaluate(() => { const s = WORLD.allPorts().sort((a, b) => Math.hypot(a.x - px, a.z - pz) - Math.hypot(b.x - px, b.z - pz))[0];
  for (let r = 400; r < 4000; r += 40) for (let a = 0; a < 6.28; a += .25) { const x = s.x + Math.cos(a) * r, z = s.z + Math.sin(a) * r;
    if ([[0, 0], [60, 0], [-60, 0], [0, 60], [0, -60]].every(([dx, dz]) => WORLD.worldH(x + dx, z + dz) < -6)) { window._sea = { x, z }; return { x, z }; } } return null; });
check('open sea found', !!sea, sea);

await page.evaluate(() => { WORLD.devUnlockAll(); window._drive = (step, max) => {
  const raf = window.requestAnimationFrame, rr = REN.render; window.requestAnimationFrame = () => 0; REN.render = () => {};
  let t = performance.now(), n = 0;
  try { for (; n < max; n++) { if (step()) break; t += 1000 / 60; loop(t); } }
  finally { window.requestAnimationFrame = raf; REN.render = rr; prevT = 0; }
  return n; }; });

// every prop: its centre and its edge (inside the walker's 0.3) solid, a point 0.25 beyond the walker's reach clear unless
// another prop stands there; the deck's middle line between the masts open. Your sloop, a black sail, a merchantman, and
// your ship as a cog and a galleon, each turned to a different heading.
const props = await page.evaluate(() => { const out = [];
  const toWorld = (m, lx, lz) => { const ry = m.rotation.y, c = Math.cos(ry), s = Math.sin(ry); return [m.position.x + lx * c + lz * s, m.position.z - lx * s + lz * c]; };
  const run = (label, m) => { m.updateMatrixWorld(true); const P = m.userData.props || []; const row = { label, n: P.length, centre: 0, edge: 0, clear: 0, clearTried: 0 };
    for (const p of P) { const rad = p.r != null ? p.r : Math.max(p.hx, p.hz);
      const [cx, cz] = toWorld(m, p.x, p.z); if (WORLD.solidAt(cx, cz)) row.centre++;
      // the edge, along the deck's breadth toward the middle line (or outward for a mast)
      const dir = p.x > .01 ? -1 : 1, ex = p.x + dir * (p.r != null ? p.r + .2 : p.hx * Math.abs(Math.cos(p.ry || 0)) + .2);
      const [ax, az] = toWorld(m, ex, p.z); if (WORLD.solidAt(ax, az)) row.edge++;
      const fx = p.x + dir * (rad * 1.5 + .55), [bx, bz] = toWorld(m, fx, p.z);
      if (!P.some(q => q !== p && Math.hypot(fx - q.x, p.z - q.z) < (q.r != null ? q.r : Math.max(q.hx, q.hz) * 1.42) + .35)) { row.clearTried++; if (!WORLD.solidAt(bx, bz)) row.clear++; } }
    // the open deck: the middle line at points clear of every prop
    let open = 0, openTried = 0; const d = m.userData.deck; for (let z = d.z0 + 1.5; z < d.z1 - 1.5; z += .5) { if (P.some(q => Math.hypot(0 - q.x, z - q.z) < (q.r != null ? q.r : Math.max(q.hx, q.hz) * 1.42) + .35)) continue; openTried++; const [ox, oz] = toWorld(m, 0, z); if (!WORLD.solidAt(ox, oz)) open++; }
    row.open = open; row.openTried = openTried; out.push(row); };
  for (const o of [...WORLD.others]) WORLD.despawnOtherShip(o);
  const S = WORLD.ship;
  for (const [cls, yaw] of [['sloop', .4], ['cog', 2.1], ['galleon', -1.2]]) {
    worldState.ship = { cls, name: 'Test Gull', sails: 0, cargo: 0, hold: {} }; if (S.mesh) { if (S.mesh.parent) S.mesh.parent.remove(S.mesh); S.mesh = null; } WORLD.spawnShip(_sea.x, _sea.z, yaw); S.sailing = false; px = _sea.x + 300; pz = _sea.z; WORLD.tick(1 / 60, performance.now()); run('yours, ' + cls, S.mesh); }
  for (const [kind, yaw] of [['pirate', 1.0], ['merchant', -2.5]]) {
    const o = WORLD.spawnOtherShip(kind, _sea.x + 60, _sea.z + 60); o.yaw = yaw; o.speed = 0; o.volleyT = 1e9; o.ramWait = 1e9; WORLD.tick(1 / 60, performance.now()); o.x = _sea.x + 60; o.z = _sea.z + 60; o.yaw = yaw; o.mesh.position.set(o.x, 0, o.z); o.mesh.rotation.y = yaw + Math.PI; run(kind, o.mesh); WORLD.despawnOtherShip(o); }
  return out; });
for (const r of props) console.log(JSON.stringify(r));
check('every ship records her props: barrels, crates, masts and the wheel\'s post (a sloop 6, a cog 6, a galleon 8)', props.every(r => r.n >= 6) && props.find(r => r.label === 'yours, galleon').n >= 8, props.map(r => [r.label, r.n]));
check('every prop is solid at its centre and at its edge, on every ship', props.every(r => r.centre === r.n && r.edge === r.n), props);
check('a step clear of each prop is open, and the deck\'s middle line between them is open', props.every(r => r.clear === r.clearTried && r.clearTried >= 3 && r.open === r.openTried && r.openTried >= 6), props);

// a walk: on your sloop, aimed at her starboard barrel from 2.5 units, W held two seconds through the game's own loop
const walk = await page.evaluate(() => { const S = WORLD.ship; for (const o of [...WORLD.others]) WORLD.despawnOtherShip(o);
  worldState.ship = { cls: 'sloop', name: 'Test Gull', sails: 0, cargo: 0, hold: {} }; if (S.mesh) { if (S.mesh.parent) S.mesh.parent.remove(S.mesh); S.mesh = null; } WORLD.spawnShip(_sea.x, _sea.z, 0); S.sailing = false; S.speed = 0;
  const m = S.mesh; m.updateMatrixWorld(true); const b = m.userData.props.find(p => p.r === .26); const ry = m.rotation.y, c = Math.cos(ry), s = Math.sin(ry);
  const bx = m.position.x + b.x * c + b.z * s, bz = m.position.z - b.x * s + b.z * c;
  // start 2.5 forward of the barrel along her length, facing it
  const fx = -Math.sin(S.yaw), fz = -Math.cos(S.yaw); px = bx + fx * 2.5; pz = bz + fz * 2.5; jumpY = 1.0; onGround = true; velY = 0;
  const K = window._K; let n = 0, closest = 1e9;
  try { K['KeyW'] = true; _drive(() => { PHP = maxHP; S.x = _sea.x; S.z = _sea.z; S.speed = 0; for (const o of [...WORLD.others]) WORLD.despawnOtherShip(o); yaw = Math.atan2(-(bx - px), -(bz - pz)); closest = Math.min(closest, Math.hypot(px - bx, pz - bz)); return ++n > 120; }, 121); }
  finally { K['KeyW'] = false; }
  return { closest: +closest.toFixed(2), onDeck: Math.abs(jumpY - 1) < .3, end: +Math.hypot(px - bx, pz - bz).toFixed(2) }; });
console.log('walk', JSON.stringify(walk));
check(`walking into her barrel for two seconds stops at its side (closest ${walk.closest}, the barrel 0.26 + the walker 0.3)`, walk.closest >= .5 && walk.closest < 1.2 && walk.onDeck, walk);

// a pirate on your deck with her barrel between you: he comes round it (S616's slide), where he stood behind it before
const roundRun = (slide) => page.evaluate((slide) => { const S = WORLD.ship, m = S.mesh; const FS = foeSlide; if (!slide) foeSlide = () => false; try { m.updateMatrixWorld(true);
  const b = m.userData.props.find(p => p.r === .26); const ry = m.rotation.y, c = Math.cos(ry), s = Math.sin(ry); const W = (lx, lz) => [m.position.x + lx * c + lz * s, m.position.z - lx * s + lz * c];
  const [bx, bz] = W(b.x, b.z), [ex, ez] = W(b.x, b.z + 1.0), [qx, qz] = W(b.x, b.z - 2.2);
  px = qx; pz = qz; jumpY = 1.0; onGround = true;
  const e = buildZoneEnemy(WORLD.scene, WORLD.STATIC_SOL, ex, ez, 'Pirate'); e.alert = true; e.homeX = S.x; e.homeZ = S.z; ZONES.world.enemies.push(e);
  let n = 0, best = 1e9, crossed = false;
  _drive(() => { PHP = maxHP; dead = false; S.x = _sea.x; S.z = _sea.z; S.speed = 0; px = qx; pz = qz; jumpY = 1.0; for (const o of [...WORLD.others]) WORLD.despawnOtherShip(o);
    const d = Math.hypot(e.x - px, e.z - pz); best = Math.min(best, d); if (Math.hypot(e.x - bx, e.z - bz) < .5) crossed = true; return ++n > 300 || d < 1.6; }, 301);
  const out = { secs: +(n / 60).toFixed(2), best: +best.toFixed(2), throughBarrel: crossed };
  if (e.mesh && e.mesh.parent) e.mesh.parent.remove(e.mesh); ZONES.world.enemies.splice(ZONES.world.enemies.indexOf(e), 1); return out; } finally { foeSlide = FS; } }, slide);
const round = await roundRun(true), stuck = await roundRun(false);
console.log('round', JSON.stringify(round), 'without the slide', JSON.stringify(stuck));
check(`a pirate behind her barrel comes round it to you (within 1.6 in ${round.secs} s), never through it; without the slide he stands ${stuck.best} off for 5 s`, round.best <= 1.6 && !round.throughBarrel && stuck.best > 1.6 && !stuck.throughBarrel, { round, stuck });

check('no page errors', g.errs.length === 0, g.errs);
if (stop) stop(); await g.close();
