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
