// The tidal races (Session 2636; the sea that pushes back, session 1, Michael's B on #1925, `docs/design/the-sea-that-pushes-back-build.md`).
// Found once from the seed in the straits between the landmasses: at least three on the default seed, each throat under the width it was
// found at. In a race's middle the set is the peak by the throat's width at 03:00 and 09:00, one way and then the other, and slack at 06:00;
// the race adds one to the sea's state over 1.5 m/s; a still ship drifts with it and keeps her speed over the water at nought; a swimmer
// with no key held is carried the set's distance in a second. Driven by WORLD.tick at fixed 1/60 ticks inside one evaluate, as `g.spin()` does.
import { boot, check } from './lib/game.mjs';
const g = await boot({ look: 'new' }); const { page } = g;
await g.intoWorld();

const found = await page.evaluate(() => { const t = performance.now(); const L = WORLD.races; const ms = Math.round(performance.now() - t);
  return { ms, thr: RACE.thr, races: L.map(r => ({ x: Math.round(r.x), z: Math.round(r.z), w: r.w, peak: +r.peak.toFixed(2), masses: r.masses.join('–') })) }; });
console.log('  races:', JSON.stringify(found));
/* the sheet asks three; the default seed's three landmasses hold one strait under 1,400 m (Aurenne–Gatelands, 300 m), so the finder steps
   through every width and stops at 1,400 with one. How many a world should have is DECISION in S2636's entry; the step rule is checked here */
check(`the seed finds its races, each throat under the width it stepped to (${found.races.length} under ${found.thr} m, in ${found.ms} ms)`,
  found.races.length >= 1 && found.races.every(r => r.w <= found.thr) && (found.races.length >= 3 || found.thr === 1400), found);

const hours = await page.evaluate(() => { const r = WORLD.races[0], at = h => { forceTime(h); const s = WORLD.raceSet(r.x, r.z); return s ? { x: s.x, z: s.z, m: s.m, along: s.x * r.ax + s.z * r.az } : { m: 0, along: 0 }; };
  return { peak: r.peak, h3: at(3), h9: at(9), h6: at(6), h15: at(15) }; });
check(`in a race's middle the set is its peak (${hours.peak.toFixed(2)} m/s) at 03:00 and 09:00, within 5%, and the other way at 09:00`,
  Math.abs(hours.h3.m - hours.peak) <= hours.peak * .05 && Math.abs(hours.h9.m - hours.peak) <= hours.peak * .05 && Math.sign(hours.h3.along) === -Math.sign(hours.h9.along) && hours.h3.along !== 0, hours);
check('slack water at 06:00: under 0.05 m/s', hours.h6.m < .05, hours.h6);

const state = await page.evaluate(() => { const r = WORLD.races.find(r => r.peak > 1.5) || null; if (!r) return null; forceTime(3); WORLD.wx.type = 'clear'; WORLD.wx.next = 'clear'; WORLD.wx.k = 1;
  const off = WORLD.openWater(r.x, r.z) ? 1 : 0; return { peak: r.peak, sea: WORLD.seaState(r.x, r.z), off, slack: (forceTime(6), WORLD.seaState(r.x, r.z)) }; });
check('a race over 1.5 m/s adds one to the sea on a clear day, and nothing at slack', state && state.sea === state.off + 1 && state.slack === state.off, state);

const ship = await page.evaluate(() => { const r = WORLD.races[0]; forceTime(3); const S = WORLD.ship;
  WORLD.spawnShip(r.x, r.z, Math.atan2(-r.ux, -r.uz)); S.sailing = true; S.speed = 0; px = S.x; pz = S.z; window._r = r;
  S.x = r.x; S.z = r.z; const o = { x: S.x, z: S.z, set: WORLD.raceSet(S.x, S.z) };
  /* the ticks run inside one evaluate: between two, the page's own loop draws a frame and drifts her with it */
  for (let i = 0; i < 60; i++) WORLD.tick(1 / 60, performance.now()); o.after = { x: S.x, z: S.z, speed: S.speed }; S.sailing = false; return o; });
const ship2 = ship.after;
const moved = Math.hypot(ship2.x - ship.x, ship2.z - ship.z), dirOk = ((ship2.x - ship.x) * ship.set.x + (ship2.z - ship.z) * ship.set.z) > 0;
console.log('  ship:', JSON.stringify({ ship, ship2, moved }));
check(`a still ship drifts with the set, ${ship.set.m.toFixed(2)} m in a second (${moved.toFixed(2)} m), her speed over the water still nought`,
  Math.abs(moved - ship.set.m) <= ship.set.m * .02 && dirOk && Math.abs(ship2.speed) < .01, { moved, set: ship.set.m, speed: ship2.speed });

const swim = await page.evaluate(() => { const r = window._r; forceTime(3); WORLD.ship && WORLD.despawnShip && WORLD.despawnShip();
  SHIP.sailing = false; if (SHIP.mesh) { SHIP.x += 400; SHIP.z += 400; } px = r.x; pz = r.z; jumpY = SEA_Y - 1.45; velY = 0;
  for (const k in HELD_KEYS) HELD_KEYS[k] = false; const o = { x: px, z: pz, swimming: WORLD.isSwimming(), set: WORLD.raceSet(px, pz) };
  for (let i = 0; i < 60; i++) WORLD.tick(1 / 60, performance.now()); o.after = { x: px, z: pz, swimming: WORLD.isSwimming() }; return o; });
const swim2 = swim.after;
const carried = Math.hypot(swim2.x - swim.x, swim2.z - swim.z);
check(`a swimmer with no key held is carried ${swim.set ? swim.set.m.toFixed(2) : '?'} m in a second (${carried.toFixed(2)} m)`,
  swim.swimming && swim.set && Math.abs(carried - swim.set.m) <= swim.set.m * .02, { swim, swim2, carried });
// S2663 — the navigator's set arrows on the minimap: with him at his station at sea, arrows where the set runs, the way the water goes; none at slack or without him
const arrows = await page.evaluate(() => { const r = window._r || WORLD.races[0], o = {}; const st = worldState.ship;
  if (!st) return null; st.fit = Array.from(new Set([...(st.fit || []), 'bunks', 'chart'])); st.crew = ['navigator']; st.sunk = false;
  WORLD.spawnShip(r.x, r.z, 0); SHIP.x = r.x; SHIP.z = r.z; SHIP.sailing = true; px = r.x; pz = r.z;
  const at = h => { forceTime(h); RACE_ARROW.t = -1e9; const n = raceArrows(null, 104); const mid = RACE_ARROW.list.reduce((b, a) => (!b || Math.hypot(a.x - 52, a.y - 52) < Math.hypot(b.x - 52, b.y - 52)) ? a : b, null); return { n, mid }; };
  o.nav = navAboard(); const a3 = at(3), set = WORLD.raceSet(r.x, r.z); o.n3 = a3.n; o.dot = a3.mid && set ? +(a3.mid.dx * set.x / set.m + a3.mid.dy * set.z / set.m).toFixed(3) : null;
  const a9 = at(9); o.n9 = a9.n; o.dot9 = a9.mid && set ? +(a9.mid.dx * set.x / set.m + a9.mid.dy * set.z / set.m).toFixed(3) : null;
  o.n6 = at(6).n; forceTime(3); st.crew = []; o.navOff = navAboard(); o.nNone = at(3).n;
  const cv = document.createElement('canvas'); cv.width = cv.height = 104; st.crew = ['navigator']; forceTime(3); RACE_ARROW.t = -1e9; o.drawn = raceArrows(cv.getContext('2d'), 104);
  return o; });
console.log('  arrows:', JSON.stringify(arrows));
check(`with the navigator at his station the minimap draws the set (${arrows && arrows.n3} arrows at 03:00), the middle one the way the water runs, and the other way at 09:00`,
  arrows && arrows.nav && arrows.n3 > 0 && arrows.dot > .99 && arrows.n9 > 0 && arrows.dot9 < -.99 && arrows.drawn === arrows.n3, arrows);
check('no arrows at slack (06:00), nor without the navigator', arrows && arrows.n6 === 0 && !arrows.navOff && arrows.nNone === 0, arrows);
await g.close(); process.exit(process.exitCode || 0);
