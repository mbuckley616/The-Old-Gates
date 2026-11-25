// The reefs (Session 2637; the sea that pushes back, session 2, Michael's B on #1925, `docs/design/the-sea-that-pushes-back-build.md`).
// One coastal chunk in six that is a headland keeps 3 to 7 rocks 60 to 400 m off its point, their heads 0.6 to 1.2 m under the surface.
// Found by the chunk's hash; a sloop driven onto a rock at 6 m/s loses 16 hull and is held fast, ahead or turning, until S is held 3 s;
// a swimmer stands on a rock's head; a reef's chunk can hold the wreck, which `seaWrecks` names; the navigator's map draws a rock as shoal.
// Driven by WORLD.tick at fixed 1/60 ticks inside one evaluate, as `g.spin()` does.
import { boot, check } from './lib/game.mjs';
const g = await boot({ look: 'new' }); const { page } = g;
await g.intoWorld();

const found = await page.evaluate(() => { const t = performance.now(), reefs = [];
  for (let j = 0; j < GRID && reefs.length < 40; j++) for (let i = 0; i < GRID && reefs.length < 40; i++) { if (maskAt(i, j) !== 'coast') continue;
    for (let cz = Math.floor(j * SIZE / CHUNK); cz < Math.ceil((j + 1) * SIZE / CHUNK); cz++) for (let cx = Math.floor(i * SIZE / CHUNK); cx < Math.ceil((i + 1) * SIZE / CHUNK); cx++) { const R = reefOfChunk(cx, cz); if (R && !reefs.includes(R)) reefs.push(R); } }
  const ok = reefs.every(R => R.rocks.length >= 1 && R.rocks.length <= 7 && R.rocks.every(k => k.head <= SEA_Y - .6 + 1e-9 && k.head >= SEA_Y - 1.2 - 1e-9 && k.bed < k.head));
  const deep = reefs.find(R => R.rocks.some(k => k.bed < -3.5 && WORLD.worldH(k.x, k.z) < -3.5));
  const wrecked = reefs.filter(R => { const w = wreckSpot(R.cx, R.cz); return w && w.reef === R.key; });
  window._reefs = { deep, wrecked: wrecked[0] };
  return { n: reefs.length, ms: Math.round(performance.now() - t), ok, deep: deep && deep.key, rocks: deep && deep.rocks.length, wrecks: wrecked.length }; });
console.log('  reefs:', JSON.stringify(found));
check(`reefs are found by the chunk's hash off the headlands, every head 0.6 to 1.2 m under (${found.n} reefs in ${found.ms} ms)`, found.n >= 3 && found.ok && found.deep, found);

const strike = await page.evaluate(() => { const R = window._reefs.deep, k = R.rocks.find(k => k.bed < -3.5 && WORLD.worldH(k.x, k.z) < -3.5);
  WORLD.wx.type = 'clear'; WORLD.wx.next = 'clear'; WORLD.wx.k = 1;
  const S = WORLD.ship; let at = null;
  /* a heading whose run in to the rock is all swimming water: her bow probe meets the rock, not the bed */
  for (let a = 0; a < 16 && !at; a++) { const yaw = a * Math.PI / 8, fx = -Math.sin(yaw), fz = -Math.cos(yaw), b = 13 / 2 + 2 + k.r + .3;
    let clear = true; for (let d = 0; d <= 40; d += 2) if (WORLD.worldH(k.x - fx * (b + d), k.z - fz * (b + d)) > -2.2) clear = false;
    if (clear) at = { yaw, x: k.x - fx * b, z: k.z - fz * b }; }
  if (!at) return { none: true };
  WORLD.spawnShip(at.x, at.z, at.yaw); S.x = at.x; S.z = at.z; S.yaw = at.yaw; S.sailing = true; S.reefFast = null; worldState.ship.hull = 100; worldState.ship.cls = 'sloop';
  for (const c in HELD_KEYS) HELD_KEYS[c] = false; HELD_KEYS.KeyW = true; S.speed = 6; px = S.x; pz = S.z;
  const h0 = WORLD.shipBars().hull; WORLD.tick(1 / 60, performance.now()); const h1 = WORLD.shipBars().hull, held = !!S.reefFast, x1 = S.x, z1 = S.z, yaw1 = S.yaw;
  HELD_KEYS.KeyA = true; for (let i = 0; i < 120; i++) WORLD.tick(1 / 60, performance.now()); HELD_KEYS.KeyA = false;
  const moved = Math.hypot(S.x - x1, S.z - z1), turned = Math.abs(S.yaw - yaw1);
  HELD_KEYS.KeyW = false; HELD_KEYS.KeyS = true; let freedAt = null;
  for (let i = 0; i < 240; i++) { WORLD.tick(1 / 60, performance.now()); if (!S.reefFast && freedAt == null) freedAt = (i + 1) / 60; }
  const backed = Math.hypot(S.x - x1, S.z - z1); HELD_KEYS.KeyS = false; S.sailing = false; S.speed = 0;
  return { lost: h0 - h1, held, moved, turned, freedAt, backed, rock: { r: k.r, head: k.head } }; });
console.log('  strike:', JSON.stringify(strike));
check(`a sloop driven onto a rock at 6 m/s loses 16 hull (${strike.lost}) and is held fast`, !strike.none && strike.lost >= 15 && strike.lost <= 17 && strike.held, strike);
check(`held, W and A neither move nor turn her (${(strike.moved || 0).toFixed(3)} m, ${(strike.turned || 0).toFixed(3)} rad)`, strike.held && strike.moved < .01 && strike.turned < .001, strike);
check(`S held 3 s backs her off (freed at ${strike.freedAt} s, ${(strike.backed || 0).toFixed(2)} m astern after 4 s)`, strike.freedAt >= 3 && strike.freedAt <= 3.1 && strike.backed > .3, strike);

const stand = await page.evaluate(() => { const R = window._reefs.deep, k = R.rocks.find(k => k.bed < -3.5 && WORLD.worldH(k.x, k.z) < -3.5);
  if (SHIP.mesh) { SHIP.x += 300; SHIP.z += 300; } SHIP.sailing = false; px = k.x; pz = k.z; jumpY = SEA_Y - 1.45; velY = 0;
  for (const c in HELD_KEYS) HELD_KEYS[c] = false; window._K && Object.keys(window._K).forEach(c => window._K[c] = false);
  for (let i = 0; i < 90; i++) { WORLD.tick(1 / 60, performance.now()); }
  return { head: k.head, ground: groundY(px, pz), swimming: WORLD.isSwimming(), bed: WORLD.worldH(px, pz) }; });
check(`a swimmer stands on a rock's head (${stand.head.toFixed(2)} m, the bed ${stand.bed.toFixed(1)}), not swimming`, Math.abs(stand.ground - stand.head) < 1e-6 && !stand.swimming, stand);

const wreck = await page.evaluate(() => { const R = window._reefs.wrecked; if (!R) return null; const w = wreckSpot(R.cx, R.cz);
  SEA_WRECKS = null; const named = seaWrecks().some(s => s.key === chunkKey(R.cx, R.cz) && Math.abs(s.x - w.x) < 1e-6);
  return { key: R.key, d: Math.hypot(w.x - R.x, w.z - R.z), bed: w.bed, named }; });
check(`a reef's chunk can hold the wreck, beside its rocks, and seaWrecks names it (${wreck && wreck.d.toFixed(0)} m off, bed ${wreck && wreck.bed.toFixed(1)})`, wreck && wreck.d <= 36 && wreck.named, wreck);

const map = await page.evaluate(() => { const R = window._reefs.deep, k = R.rocks.find(k => k.bed < -3.5 && WORLD.worldH(k.x, k.z) < -3.5);
  const keep = navAboard; navAboard = () => true; px = k.x + 30; pz = k.z; const cv = document.createElement('canvas'); cv.width = cv.height = 200;
  const ctx = cv.getContext('2d'); let col = null, without = null;
  try { WORLD.drawLocalMap(ctx, 200, 100, true); const d = ctx.getImageData(70, 100, 1, 1).data; col = [d[0], d[1], d[2]];
    navAboard = () => false; WORLD.drawLocalMap(ctx, 200, 100, true); const e = ctx.getImageData(70, 100, 1, 1).data; without = [e[0], e[1], e[2]]; } finally { navAboard = keep; }
  return { col, without, shoal: SHOAL_COL }; });
const hex = c => '#' + c.map(v => v.toString(16).padStart(2, '0')).join('');
check(`the navigator's map draws a rock as shoal (${map.col && hex(map.col)}, ${map.shoal}; without her ${map.without && hex(map.without)})`, map.col && hex(map.col) === map.shoal && hex(map.without) !== map.shoal, map);
await g.close(); process.exit(process.exitCode || 0);
