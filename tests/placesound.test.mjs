// What a place sounds like (Michael's B on #2071; docs/design/what-a-place-sounds-like-build.md). Session 2727, the build sheet's first
// session: the Ambience bus under the effects, the wind by height and island, the nearest water within 80 m, the weather's damping and
// the music's duck. The tick is called by hand (it runs every 0.25 s of the page's clock in the main loop); AMB holds what it decided.
import { boot, check } from './lib/game.mjs';
const g = await boot(); const { page } = g;
await g.intoWorld();
await page.evaluate(() => { initAudio(); window._amb = () => { AMB.t = 0; tickAmbience(.25); const B = AMB.beds;
  return { open: AMB.open, on: AMB.on, isle: AMB.island, h: +AMB.height.toFixed(1), forest: AMB.forest, wind: +B.wind.toFixed(4), leaves: B.leaves,
    water: +B.water.toFixed(4), kind: B.waterKind, d: isFinite(B.waterD) ? +B.waterD.toFixed(1) : null, gust: AMB.gust, gustMul: +AMB.gustMul.toFixed(2),
    cut: Math.round(AMB.cut), mul: AMB.dampMul, duck: AMB.duck, nodes: AMB.nodes }; };
  window._wx = t => { WX.type = t; WX.next = t; WX.k = 1; WX.heavy = 0; }; _wx('clear'); });

// 1. the bus: under the effects at 0.6, and the slider
const bus = await page.evaluate(() => { const at100 = VOL_SFX[volLevel] * .6 * volKind('ambience'); SETTINGS.ambience = 0; applyVolumes(); const z = volKind('ambience') * VOL_SFX[volLevel] * .6;
  SETTINGS.ambience = 50; applyVolumes(); const half = VOL_SFX[volLevel] * .6 * volKind('ambience'); SETTINGS.ambience = 100; applyVolumes();
  return { ax: !!AX, gain: !!ambGain, at100: +at100.toFixed(4), fx: +(VOL_SFX[volLevel] * volKind('effects')).toFixed(4), z, half: +half.toFixed(4), def: SETTINGS_DEF.ambience }; });
check('the Ambience bus: its own gain at 0.6 of the effects\' level, 100 to start, 0 at 0 and half at 50', bus.ax && bus.gain && bus.def === 100 && Math.abs(bus.at100 - .6 * bus.fx) < 1e-6 && bus.z === 0 && Math.abs(bus.half - bus.at100 / 2) < 1e-6, bus);

// 2. the Gatelands at the start: the wind's bed, steady, by height
const home = await page.evaluate(() => _amb());
check('the home province outdoors: the beds on, the Gatelands\' wind 0.05 + 0.03 a 50 m (at most 0.14), no gust', home.open && home.on && home.isle === 'gatelands' && !home.gust
  && Math.abs(home.wind - Math.min(.14, .05 + .03 * home.h / 50) * (home.forest ? .6 : 1)) < 1e-3, home);
check('at most 40 live nodes on the bus', home.nodes > 0 && home.nodes <= 40, home.nodes);

// 3. the sea: a shore a few metres off, and the water's bed over 0.05; far inland it is silent
const shore = await page.evaluate(() => { const x0 = px, z0 = pz;
  for (let r = 40; r < 3000; r += 20) for (let a = 0; a < 6.28; a += 20 / r) { const x = x0 + Math.cos(a) * r, z = z0 + Math.sin(a) * r; if (worldH(x, z) > -1.5) continue;
    if (ambFresh(x, z, 1)) continue; /* not a lake's or a river's bed */
    for (let s = 0; s < 60; s += 1) { const lx = x - Math.cos(a) * s, lz = z - Math.sin(a) * s; if (worldH(lx, lz) > 1.2) { const bx = lx - Math.cos(a) * 6, bz = lz - Math.sin(a) * 6; if (worldH(bx, bz) > 1) return [bx, bz]; } } }
  return null; });
let sea = null;
if (shore) sea = await page.evaluate(([x, z]) => { px = x; pz = z; return _amb(); }, shore);
check('within 20 m of the sea: the water\'s bed is the sea\'s, over 0.05', !!sea && sea.kind === 'sea' && sea.d <= 20 && sea.water > .05 && Math.abs(sea.water - .1 * (1 - sea.d / 80) ** 2) < 1e-3, { shore, sea });
const dry = await page.evaluate(() => { for (let r = 0; r < 4000; r += 50) for (let a = 0; a < 6.28; a += .5) { const x = 13100 + Math.cos(a) * r, z = 25450 + Math.sin(a) * r; px = x; pz = z;
    if (worldH(x, z) < 20) continue; const w = ambWater(x, z); if (!w) return { at: [Math.round(x), Math.round(z)], ..._amb() }; } return null; });
check('more than 80 m from any water the water\'s bed is silent', !!dry && dry.water === 0 && dry.kind === null, dry);

// 4. the Mark's high ground: the gust swings the wind (×0.5 to ×1.6; ×0.4 to ×1.9 over 150 m, which seed 1's Mark never reaches: its tops are about 126 m)
const fell = await page.evaluate(() => { let best = null; for (let i = 0; i < GRID; i++) for (let j = 0; j < GRID; j++) { if (!isLandCell(i, j) || nationKeyOf(i, j) !== 'mark') continue;
    for (let u = .05; u < 1; u += .05) for (let v = .05; v < 1; v += .05) { const x = (i + u) * SIZE, z = (j + v) * SIZE, h = worldH(x, z); if (!best || h > best[2]) best = [x, z, h]; } }
  if (!best || nationAt(best[0], best[1]) !== 'mark') return null; px = best[0]; pz = best[1]; const seen = []; for (let k = 0; k < 44; k++) seen.push(_amb().gustMul); const a = _amb();
  const lo = a.h > 150 ? .4 : .5, hi = a.h > 150 ? 1.9 : 1.6;
  return { at: [Math.round(px), Math.round(pz)], ...a, lo: Math.min(...seen), hi: Math.max(...seen), want: [lo, hi] }; });
check('the Mark\'s high ground: the gust is on and swings the wind across its range over one 5–10 s gust', !!fell && fell.isle === 'mark' && fell.gust && fell.h > 100
  && fell.lo >= fell.want[0] - 1e-6 && fell.lo < fell.want[0] + .1 && fell.hi <= fell.want[1] + 1e-6 && fell.hi > fell.want[1] - .1, fell);

// 5. the weather's damping, and its level
await page.evaluate(([x, z]) => { px = x; pz = z; }, [13100, 25450]);
const damp = await page.evaluate(async () => { const out = {}; for (const t of ['clear', 'fog', 'rain', 'snow', 'storm']) { _wx(t); const a = _amb(); out[t] = [a.cut, a.mul]; }
  _wx('rain'); _amb(); const s0 = AX.state; const a0 = AX.currentTime, w0 = performance.now(); /* 3 s of the audio clock, not the page's */
  while (AX.currentTime - a0 < 3 && performance.now() - w0 < 15000) await new Promise(r => setTimeout(r, 100)); out.audioS = +(AX.currentTime - a0).toFixed(2); _amb(); out.state = s0; out.heard = Math.round(AMB.v.damp.frequency.value);
  WX.type = 'clear'; WX.next = 'rain'; WX.k = .5; out.half = _amb().cut; _wx('clear'); _amb(); return out; });
check('the damping by weather: clear 18 kHz, fog 2,000 at ×0.7, rain 1,200 at ×0.6, snow 3,000 at ×0.8, a storm 900 at ×0.5', damp.clear[0] === 18000 && damp.clear[1] === 1
  && damp.fog[0] === 2000 && damp.fog[1] === .7 && damp.rain[0] === 1200 && damp.rain[1] === .6 && damp.snow[0] === 3000 && damp.snow[1] === .8 && damp.storm[0] === 900 && damp.storm[1] === .5, damp);
check('a weather half turned is between the two, in log frequency (clear to rain: about 4,650 Hz)', Math.abs(damp.half - Math.sqrt(18000 * 1200)) < 5, damp.half);
check('the bus\'s filter is at 1,200 ± 100 Hz 3 s into the rain (where the page\'s audio clock runs)', damp.state !== 'running' || Math.abs(damp.heard - 1200) <= 100, { state: damp.state, heard: damp.heard, audioS: damp.audioS });

// 6. the duck while a piece plays
const duck = await page.evaluate(() => { const was = EXPLORE.playing; EXPLORE.playing = true; const a = _amb().duck; EXPLORE.playing = false; const b = _amb().duck; EXPLORE.playing = was; return { a, b }; });
check('the music ducks the bed to ×0.7 while a piece plays, and lets it up while it rests', duck.a === .7 && duck.b === 1, duck);

// 7. indoors and underground the world's beds fade
const inside = await page.evaluate(() => { const zone = activeZoneId; activeZoneId = 'dungeon'; const a = _amb(); activeZoneId = zone; return a; });
check('out of the open world the beds go to nothing', !inside.open && inside.wind === 0 && inside.water === 0, inside);

// S2730 — the town and the hours, the calls, indoors and the rooms' echo (the build sheet's second session)
await g.settle('dunmore');
const town = await page.evaluate(() => { const S = WORLD.settle.get('dunmore'), s = S.site; _wx('clear'); forceTime(12); px = s.x; pz = s.z;
  for (let f = 0; f < 60 * 3; f++) WORLD.tick(1 / 60, performance.now()); const a = _amb();
  return { folk: AMB.townsfolk, murmur: +AMB.beds.murmur.toFixed(3), isle: a.isle, churches: S.houses.filter(h => h.type === 'church').length, smiths: S.houses.filter(h => h.type === 'weapon' || h.type === 'forge').length }; });
check('Dunmore\'s square at noon: the murmur of its people over 0.04 (0.01 a townsperson within 40 m, at most 0.12)', town.murmur > .04 && town.murmur <= .12 && Math.abs(town.murmur - Math.min(.12, town.folk * .01)) < 1e-3, town);
const bell = await page.evaluate(() => { const S = WORLD.settle.get('dunmore'); const c = S.houses.find(h => h.type === 'church'); if (!c) return null; px = c.exitX + 60; pz = c.exitZ;
  forceTime(11.9); _amb(); AMB.bell.key = null; /* the square's check above crossed noon already: today's bell has rung */ const n0 = AMB.bell.count; forceTime(12.05); _amb(); const n1 = AMB.bell.count; _amb(); const n2 = AMB.bell.count;
  forceTime(14); _amb(); const n3 = AMB.bell.count; forceTime(9); _amb(); forceTime(16); _amb(); const n4 = AMB.bell.count;
  return { n0, n1, n2, n3, n4, strokes: AMB.bell.strokes, at: AMB.bell.at }; });
check('a Gatelands bell at 12, once (nine strokes), and none for a clock jumped past 12 and 14', !!bell && bell.n1 === bell.n0 + 1 && bell.n2 === bell.n1 && bell.n3 === bell.n1 && bell.n4 === bell.n1 && bell.at === 12 && bell.strokes >= 9, bell);
const forge = await page.evaluate(() => { const S = WORLD.settle.get('dunmore'); const H = S.houses.find(h => h.type === 'weapon' || h.type === 'forge'); if (!H) return null; px = H.exitX + 5; pz = H.exitZ;
  forceTime(14); _amb(); const on14 = !!(AMB.forge && AMB.forge.on), k14 = AMB.spots.map(s => s.kind); forceTime(18); _amb(); const on18 = !!(AMB.forge && AMB.forge.on); return { on14, on18, k14 }; });
check('the forge\'s hammer in the smith\'s hours: on at 14, off at 18', !!forge && forge.on14 && !forge.on18 && forge.k14.includes('forge'), forge);
const inn = await page.evaluate(() => { const S = WORLD.settle.get('dunmore'); const H = S.houses.find(h => h.type === 'inn'); if (!H) return null; px = H.exitX + 4; pz = H.exitZ;
  forceTime(19); _amb(); const T = AMB.tavern; const on = !!(T && T.on), lead = T && T.lead; forceTime(23); _amb(); return { on, lead, off: !AMB.tavern }; });
check('the tavern door 17–21: the Gatelands\' fiddle plays a reel at 19, and not at 23', !!inn && inn.on && inn.lead === 'fiddle' && inn.off, inn);
const calls = await page.evaluate(() => { const C = AMB.calls; forceTime(10); _wx('storm'); const c0 = C.count; for (let i = 0; i < 40; i++) { C.next = 1e-3; _amb(); } const storm = C.count - c0;
  _wx('clear'); const c1 = C.count, kinds = new Set(); for (let i = 0; i < 40; i++) { C.next = 1e-3; _amb(); kinds.add(C.last); } const clear = C.count - c1;
  forceTime(23); const kn = new Set(); for (let i = 0; i < 40; i++) { C.next = 1e-3; _amb(); kn.add(C.last); }
  return { storm, clear, day: [...kinds], night: [...kn] }; });
check('the calls: none in a storm; in the Gatelands by day a skylark, a blackbird or the rooks, by night the crickets or an owl', calls.storm === 0 && calls.clear >= 30
  && calls.day.every(k => ['skylark', 'blackbird', 'rook'].includes(k)) && calls.night.every(k => ['crickets', 'owl'].includes(k)), calls);
const echo = await page.evaluate(() => { const was = { lid, h: currentHouse, z: activeZoneId }; const out = {};
  for (const t of ['home', 'inn', 'church', 'weapon']) { lid = 'int_test'; currentHouse = { type: t }; _amb(); out[t] = [AMB.room.kind, AMB.room.decay, AMB.room.wet, AMB.open]; }
  lid = was.lid; currentHouse = was.h; activeZoneId = 'dungeon'; _amb(); out.dungeon = [AMB.room.kind, AMB.room.decay, AMB.room.wet];
  activeZoneId = was.z; _amb(); out.out = [AMB.room.kind, AMB.room.wet]; return out; });
check('the rooms\' echo: a cottage or a shop 0.4 s, an inn 0.8, a church 1.2, at 0.22 wet; underground (no vault) 0.7; none outdoors', echo.home[1] === .4 && echo.weapon[1] === .4 && echo.inn[1] === .8 && echo.church[1] === 1.2
  && echo.home[2] === .22 && !echo.home[3] && echo.dungeon[0] === 'side' && echo.dungeon[1] === .7 && echo.out[0] === null && echo.out[1] === 0, echo);
const busy = await page.evaluate(async () => { const S = WORLD.settle.get('dunmore'); const H = S.houses.find(h => h.type === 'weapon' || h.type === 'forge') || S.houses[0]; px = H.exitX + 6; pz = H.exitZ;
  _wx('rain'); forceTime(12); let most = 0; for (let i = 0; i < 40; i++) { AMB.calls.next = 1e-3; _amb(); most = Math.max(most, AMB.live); await new Promise(r => setTimeout(r, 30)); }
  _wx('clear'); return { most, nodes: AMB.nodes, spots: AMB.spots }; });
check('Dunmore at noon in the rain by the forge, a call every tick: at most 40 live nodes on the bus', busy.most > busy.nodes && busy.most <= 40, busy);
check('an hour is crossed within a quarter hour of it (12 from 11.9, 19 from 18.95, midnight from 23.9), never by a clock set past it (12 to 14)', await page.evaluate(() => ambCrossed(12, 12.05, 11.9) && !ambCrossed(12, 14, 11.9) && ambCrossed(6, 6.1, 5.9) && ambCrossed(19, 19.1, 18.95) && ambCrossed(0, .1, 23.9) && !ambCrossed(12, 11.95, 11.9)));
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
