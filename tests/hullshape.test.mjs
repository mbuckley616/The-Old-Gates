// Hulls meet at their own shape (Session 615; Michael's sailing playtest, 6 Oct 2026: "a pirate ship rammed him and the
// ships completely overlapped ... ships and ramming should respect the actual boundaries/perimeter of the ship"). Each
// hull is her own deck's outline; two touch where the outlines overlap and part along the axis of least overlap. Measured: the deck area the two hulls share at the worst
// moment of a ram, bow-on, bow-to-bow, and alongside, by the game's own tick, against the old circle pushed the same way.
import { boot, check } from './lib/game.mjs';
const g = await boot(); const { page } = g;
await g.intoWorld();
const stop = g.keepAlive ? g.keepAlive() : null;

const sea = await page.evaluate(() => { const s = WORLD.allPorts().sort((a, b) => Math.hypot(a.x - px, a.z - pz) - Math.hypot(b.x - px, b.z - pz))[0];
  for (let r = 400; r < 4000; r += 40) for (let a = 0; a < 6.28; a += .25) { const x = s.x + Math.cos(a) * r, z = s.z + Math.sin(a) * r;
    if ([[0, 0], [60, 0], [-60, 0], [0, 60], [0, -60]].every(([dx, dz]) => WORLD.worldH(x + dx, z + dz) < -6)) { window._sea = { x, z }; return { x, z }; } } return null; });
check('open sea found', !!sea, sea);

await page.evaluate(() => {
  window._newHull = tickHullCollisions;
  // the old circle, as it stood before S615, the push only (the ram's wear is not what is measured here)
  window._oldHull = function () { const hulls = []; if (SHIP.mesh) hulls.push({ o: SHIP, L: SHIP.L, W: SHIP.W }); for (const o of OTHER) hulls.push({ o, L: o.L || 13, W: o.W || 4.4 });
    for (let i = 0; i < hulls.length; i++) for (let j = i + 1; j < hulls.length; j++) { const a = hulls[i], b = hulls[j]; const dx = b.o.x - a.o.x, dz = b.o.z - a.o.z; const d = Math.hypot(dx, dz) || .01; const minD = (a.L + b.L) / 2 * .62;
      if (d < minD) { const push = (minD - d) * .5; const ux = dx / d, uz = dz / d; a.o.x -= ux * push; a.o.z -= uz * push; b.o.x += ux * push; b.o.z += uz * push; a.o.speed *= .6; b.o.speed *= .6; } } };
  // the deck both hulls share, m² (a 0.2-unit grid over the two decks' boxes, a point inside both decks' outlines)
  window._shared = (o) => { const S = WORLD.ship; for (const [h, m] of [[S, S.mesh], [o, o.mesh]]) { m.position.x = h.x; m.position.z = h.z; m.rotation.y = h.yaw + Math.PI; m.updateMatrixWorld(true); } shipPlatBox(S.plat, S.mesh, S.x, S.z, S.yaw, S.L, S.W); shipPlatBox(o.plat, o.mesh, o.x, o.z, o.yaw, o.L, o.W); const p = S.plat, q = o.plat; let n = 0;
    const x0 = Math.max(p.x0, q.x0), x1 = Math.min(p.x1, q.x1), z0 = Math.max(p.z0, q.z0), z1 = Math.min(p.z1, q.z1);
    for (let x = x0; x < x1; x += .2) for (let z = z0; z < z1; z += .2) if (p.inside(x, z) && q.inside(x, z)) n++; return +(n * .04).toFixed(2); };
});

// one meeting: your sloop heading north at `mv` (or still), a black sail placed at (dx,dz) from her, bow at her, at speed `v`, held on that course (no steering) for T seconds of the world's tick, with the hull test `which`
const meet = (opts) => page.evaluate((opts) => { const { which, mv, dx, dz, v, T } = opts; const yaw = Math.atan2(dx, dz); /* her bow at you */
  tickHullCollisions = which === 'old' ? _oldHull : _newHull;
  try {
    for (const o of [...WORLD.others]) WORLD.despawnOtherShip(o);
    worldState.ship = { cls: 'sloop', name: 'Test Gull', sails: 0, cargo: 0, hold: {}, hull: 1e6 }; WORLD.spawnShip(_sea.x, _sea.z, 0); const S = WORLD.ship; S.sailing = false; S.speed = 0;
    px = _sea.x + 200; pz = _sea.z; jumpY = WORLD.SEA_Y - .35; WORLD.tick(1 / 60, performance.now());
    const o = WORLD.spawnOtherShip('pirate', S.x + dx, S.z + dz); o.yaw = yaw; o.speed = v; o.volleyT = 1e9; o.ramWait = 1e9; o.sated = false;
    let worst = 0, minC = 1e9, deep = 0;
    for (let i = 0; i < T * 60; i++) { o.yaw = yaw; o.speed = Math.max(o.speed, v * .6); o.volleyT = 1e9; o.ramWait = 1e9; worldState.ship.hull = 1e6;
      S.speed = mv; const f = [-Math.sin(S.yaw), -Math.cos(S.yaw)]; S.x += f[0] * mv / 60; S.z += f[1] * mv / 60; S.yaw = 0;
      px = S.x + 200; pz = S.z; WORLD.tick(1 / 60, performance.now());
      const sh = _shared(o); if (sh > worst) worst = sh; const C = hullContact({ o: S, L: S.L, W: S.W }, { o, L: o.L, W: o.W }); if (C.pen > deep) deep = C.pen; minC = Math.min(minC, Math.hypot(o.x - S.x, o.z - S.z)); }
    return { worst, deep: +deep.toFixed(2), minC: +minC.toFixed(2) };
  } finally { tickHullCollisions = _newHull; } }, opts);

const cases = {
  // she drives her bow into your beam at her ramming speed (she is east of you, heading west)
  beam: { dx: 14, dz: 0, v: 6.5, mv: 0, T: 6 },
  // bow to bow: you sail north at 6, she comes south at 6.5
  bows: { dx: 0, dz: -24, v: 6.5, mv: 6, T: 4 },
  // she comes up from astern on your quarter, her bow into your stern
  quarter: { dx: 7, dz: 16, v: 6.5, mv: 2, T: 6 },
};
const out = {};
for (const [k, c] of Object.entries(cases)) { out[k] = { old: await meet({ ...c, which: 'old' }), now: await meet({ ...c, which: 'new' }) }; console.log(k, JSON.stringify(out[k])); }
// both held driving into each other every tick, so what is left is a tick's way at most: the hulls' depth into each other
const ok = (r) => r.now.deep <= .3 && r.now.worst < r.old.worst;
check(`a black sail into your beam at 6.5: ${out.beam.old.deep} units deep (${out.beam.old.worst} m² shared) with the old circle, ${out.beam.now.deep} (${out.beam.now.worst} m²) now`, ok(out.beam), out.beam);
check(`bow to bow at 6 and 6.5: ${out.bows.old.deep} deep (${out.bows.old.worst} m²) before, ${out.bows.now.deep} (${out.bows.now.worst} m²) now`, ok(out.bows), out.bows);
check(`her bow into your quarter: ${out.quarter.old.deep} deep (${out.quarter.old.worst} m²) before, ${out.quarter.now.deep} (${out.quarter.now.worst} m²) now`, ok(out.quarter), out.quarter);

// alongside: two hulls a beam apart do not push (the old circle held them 8 units apart, too far to board from)
const along = await page.evaluate(() => { const S = WORLD.ship; for (const o of [...WORLD.others]) WORLD.despawnOtherShip(o);
  const o = WORLD.spawnOtherShip('pirate', S.x + 4.8, S.z); o.yaw = 0; o.speed = 0; o.volleyT = 1e9; o.ramWait = 1e9; S.yaw = 0; S.speed = 0;
  tickHullCollisions(1 / 60); const now = +Math.hypot(o.x - S.x, o.z - S.z).toFixed(2);
  o.x = S.x + 4.8; o.z = S.z; tickHullCollisions = _oldHull; try { tickHullCollisions(1 / 60); } finally { tickHullCollisions = _newHull; } const old = +Math.hypot(o.x - S.x, o.z - S.z).toFixed(2);
  WORLD.despawnOtherShip(o); return { now, old }; });
check(`two sloops alongside 4.8 apart (their decks 4.26 wide) stay there (${along.now}); the old circle pushed them to ${along.old}`, Math.abs(along.now - 4.8) < .01 && along.old > 7.9, along);

check('no page errors', g.errs.length === 0, g.errs);
if (stop) stop(); await g.close();
