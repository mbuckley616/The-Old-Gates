// Fog thickens, rain is muffled indoors, snow is a low wind, snow settles and melts, the sky agrees with the clock.
import { boot, check } from './lib/game.mjs';
const g = await boot(); const { page } = g;
await g.intoWorld(); const stop = g.keepAlive();
await page.evaluate(() => forceTime(11));
const dens = async (w) => { await g.spin(w, 240); return page.evaluate(() => WORLD.scene.fog.density); };
const clear = await dens('clear'), fog = await dens('fog');
check('fog closes the view (>8x clear)', fog > clear * 8, { clear, fog });
// S1420 — Michael's C on #679: the land closes to the weather's sight in metres and no nearer (fog 60, a storm 220, rain 500),
// and a foe in the open sees no farther than that
await page.evaluate(() => { WORLD.wx.timer = 900; });
const sightOf = d => Math.round(Math.sqrt(3) / d);
const rain = await dens('rain'), storm = await dens('storm');
const capFog = await (async () => { await g.spin('fog', 10); return page.evaluate(() => wxSightCap()); })();
const want = m => Math.max(clear, Math.sqrt(3) / m);
const near = (a, b) => Math.abs(a - b) / b < .03;
console.log(JSON.stringify({ clearM: sightOf(clear), fogM: sightOf(fog), rainM: sightOf(rain), stormM: sightOf(storm), capFog }));
check('fog closes the land to 60 m', near(fog, want(60)), { fogM: sightOf(fog) });
check('rain leaves 500 m and a storm 220 m (or the place\'s own haze, if thicker)', near(rain, want(500)) && near(storm, want(220)), { rainM: sightOf(rain), stormM: sightOf(storm), clearM: sightOf(clear) });
check('a foe in the open sees no farther than the fog', Math.round(capFog) === 60, capFog);
// S1433 — #723: a blizzard and heavy rain, rolled as snow and rain with WX.heavy, close the land to 70 m and 280 m; set by hand
// to plain snow again, the heavy mark goes with it
const heavyOf = async (k) => { await page.evaluate(k => devWeather(k), k); await g.spin(null, 1800); return page.evaluate(() => ({ d: WORLD.scene.fog.density, type: WORLD.wx.type, heavy: WORLD.wx.heavy, name: devWeather() })); };
const bliz = await heavyOf('blizzard'), heavyRain = await heavyOf('heavyrain');
await g.spin('snow', 240); const plain = await page.evaluate(() => ({ d: WORLD.scene.fog.density, heavy: WORLD.wx.heavy }));
console.log(JSON.stringify({ blizM: sightOf(bliz.d), heavyRainM: sightOf(heavyRain.d), snowM: sightOf(plain.d) }));
check('a blizzard is snow, heavy, and closes the land to 70 m', bliz.type === 'snow' && bliz.heavy === 1 && bliz.name === 'blizzard' && near(bliz.d, want(70)), { bliz, m: sightOf(bliz.d) });
check('heavy rain is rain, heavy, and leaves 280 m', heavyRain.type === 'rain' && heavyRain.heavy === 1 && heavyRain.name === 'heavyrain' && near(heavyRain.d, want(280)), { heavyRain, m: sightOf(heavyRain.d) });
check('snow set by hand after a blizzard is plain snow (400 m)', plain.heavy === 0 && near(plain.d, want(400)), { plain, m: sightOf(plain.d) });
// S2211 — #1511 B: rain and snow cover your steps in the open (walking 3 m → 2 m, a storm, heavy rain or a blizzard 1.5 m),
// sneaking never under the still 0.9 m; indoors the weather covers nothing
const hear = await page.evaluate(() => { const wx = WORLD.wx, keep = { type: wx.type, next: wx.next, k: wx.k, heavy: wx.heavy, step: _pStep, sn: _sneaking, lid };
  const at = (t, h, where) => { wx.type = t; wx.next = t; wx.k = 0; wx.heavy = h; if (where) lid = where; _pStep = true;
    _sneaking = false; const walk = hearingRadius(); _sneaking = true; const sneak = hearingRadius(); lid = keep.lid; return [+walk.toFixed(2), +sneak.toFixed(2)]; };
  const r = { clear: at('clear', 0), fog: at('fog', 0), rain: at('rain', 0), snow: at('snow', 0), storm: at('storm', 0), heavyrain: at('rain', 1), blizzard: at('snow', 1), rainInside: at('rain', 0, 'int_test') };
  wx.type = 'rain'; wx.next = 'clear'; wx.k = .5; wx.heavy = 0; _pStep = true; _sneaking = false; r.halfway = +hearingRadius().toFixed(2);
  _pStep = false; r.still = hearingRadius();
  Object.assign(wx, { type: keep.type, next: keep.next, k: keep.k, heavy: keep.heavy }); _pStep = keep.step; _sneaking = keep.sn; return r; });
console.log(JSON.stringify({ hear }));
check('a foe hears you walk at 3 m and sneak at 1 m in clear weather and fog', hear.clear[0] === 3 && hear.clear[1] === 1 && hear.fog[0] === 3, hear);
check('rain or snow covers your steps to 2 m, a storm, heavy rain or a blizzard to 1.5 m', hear.rain[0] === 2 && hear.snow[0] === 2 && hear.storm[0] === 1.5 && hear.heavyrain[0] === 1.5 && hear.blizzard[0] === 1.5, hear);
check('sneaking in any rain is heard at the still 0.9 m, never under it', [hear.rain, hear.storm, hear.blizzard].every(x => x[1] === 0.9) && hear.still === 0.9, hear);
check('indoors the rain covers nothing; a change eases between (2.5 m halfway)', hear.rainInside[0] === 3 && hear.halfway === 2.5, hear);
// S2212 — #1511 B: the wind carries an arrow across its flight in the open: 0.4 m/s² (a breeze), 0.8 (rain or snow), 2.0 (a storm or a
// blizzard); a full 28 m/s crosswind shot drifts 0.23 / 0.46 / 1.15 m at 30 m. A head wind carries nothing, nor does a room; Long eye halves it;
// a foe's 17 m/s arrow drifts on the same wind
const wind = await page.evaluate(() => { const wx = WORLD.wx, keep = { type: wx.type, next: wx.next, k: wx.k, heavy: wx.heavy, lid };
  const set = (t, h) => { wx.type = t; wx.next = t; wx.k = 0; wx.heavy = h; };
  const fly = (t, h, o = {}) => { set(t, h); if (o.where) lid = o.where; const w = windDir(), ws = [Math.sin(w), Math.cos(w)];
    const d = o.head ? ws : [ws[1], -ws[0]], a = new THREE.Group(), x0 = px + 200, z0 = pz + 200, y0 = activeTerrainH(x0, z0) + 80;
    a.position.set(x0, y0, z0); a.userData = { vx: 28 * d[0], vy: 0, vz: 28 * d[1], life: 9, isArrow: true, longEye: !!o.longEye, x0, z0 };
    let along = 0, st = null; for (let i = 0; i < 300 && along < 30; i++) { st = tickArrowMotion(a, 1 / 60, true); along = (a.position.x - x0) * d[0] + (a.position.z - z0) * d[1]; }
    const side = o.head ? (a.position.x - x0) * d[1] - (a.position.z - z0) * d[0] : (a.position.x - x0) * ws[0] + (a.position.z - z0) * ws[1];
    lid = keep.lid; return +side.toFixed(3); };
  const foe = (t, h) => { set(t, h); const w = windDir(), ws = [Math.sin(w), Math.cos(w)], d = [ws[1], -ws[0]], x0 = px + 200, z0 = pz + 200;
    const a = { m: new THREE.Object3D(), x: x0, z: z0, y: activeTerrainH(x0, z0) + 80, vx: 17 * d[0], vz: 17 * d[1], life: 1.6, dmg: 0, from: {}, sc: { remove() {} } };
    ZARROWS.push(a); let along = 0; for (let i = 0; i < 200 && along < 25 && ZARROWS.includes(a); i++) { tickZoneArrows(1 / 60, 0); along = (a.x - x0) * d[0] + (a.z - z0) * d[1]; }
    const i = ZARROWS.indexOf(a); if (i >= 0) ZARROWS.splice(i, 1); return { along: +along.toFixed(2), side: +((a.x - x0) * ws[0] + (a.z - z0) * ws[1]).toFixed(3) }; };
  const r = { clear: fly('clear', 0), rain: fly('rain', 0), snow: fly('snow', 0), storm: fly('storm', 0), blizzard: fly('snow', 1), heavyrain: fly('rain', 1),
    head: fly('storm', 0, { head: true }), inside: fly('storm', 0, { where: 'int_test' }), longEye: fly('storm', 0, { longEye: true }), foeRain: foe('rain', 0) };
  Object.assign(wx, { type: keep.type, next: keep.next, k: keep.k, heavy: keep.heavy }); return r; });
console.log(JSON.stringify({ wind }));
const about = (a, b) => Math.abs(a - b) <= Math.max(.04, b * .1);
check('a breeze drifts a crosswind arrow 0.23 m at 30 m, rain or snow 0.46, a storm or a blizzard 1.15', about(wind.clear, .23) && about(wind.rain, .46) && about(wind.snow, .46) && about(wind.storm, 1.15) && about(wind.blizzard, 1.15) && about(wind.heavyrain, .46), wind);
check('a head wind carries nothing sideways, and a room has no wind', Math.abs(wind.head) < .02 && Math.abs(wind.inside) < .02, wind);
check('Long eye halves the drift', about(wind.longEye, wind.storm / 2), wind);
check('a foe\'s arrow drifts on the same wind (0.8 m/s² over 25 m at 17 m/s: about 0.86 m)', wind.foeRain.along >= 24.5 && about(wind.foeRain.side, .4 * (wind.foeRain.along / 17) ** 2), wind.foeRain);
await page.evaluate(() => { WORLD.wx.timer = 900; });
const audio = await page.evaluate(() => { try { initAudio(); } catch (e) {}
  const run = (w, where) => { const wx = WORLD.wx; wx.type = w; wx.next = w; wx.k = 1; const save = [activeZoneId, lid];
    if (where === 'inside') lid = 'int_test'; if (where === 'dungeon') activeZoneId = 'dungeon';
    for (let i = 0; i < 200; i++) WORLD.wxAudio(1 / 60); const r = { gain: wx.rainG.gain.value, hz: wx.rainF.frequency.value }; activeZoneId = save[0]; lid = save[1]; return r; };
  return { out: run('rain'), inside: run('rain', 'inside'), dungeon: run('rain', 'dungeon'), snow: run('snow') }; });
check('rain muffled indoors (about a fifth)', audio.inside.gain < audio.out.gain * .3 && audio.inside.gain > 0, audio);
check('rain nearly gone underground', audio.dungeon.gain < audio.out.gain * .1);
check('snow is a low wind, not a hiss', audio.snow.hz < 600, audio.snow);
await page.evaluate(() => { WORLD.wx.cover = 0; });
await g.spin('snow', 9000);
const cover = await page.evaluate(() => WORLD.wx.cover);
check('snow settles after a few minutes', cover > .9, cover);
await g.spin('clear', 9000);
check('and melts off in the home province', (await page.evaluate(() => WORLD.wx.cover)) < .1);
// sky
const sky = async (h) => { await page.evaluate((h) => forceTime(h), h); await g.spin('clear', 40);
  return page.evaluate(() => { const S = WORLD.sky; return { sun: S.sun.material.opacity, moon: S.moon.material.opacity, stars: S.stars.material.opacity }; }); };
const noon = await sky(12), night = await sky(0);
check('sun by day, not by night', noon.sun > .9 && night.sun === 0, { noon, night });
check('moon and stars by night', night.moon > .8 && night.stars > .8 && noon.stars === 0);
await g.spin('storm', 40);
check('a storm hides the sky', (await page.evaluate(() => WORLD.sky.stars.material.opacity)) < .05);
stop();
await g.close();
