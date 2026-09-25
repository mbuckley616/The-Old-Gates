// Fog thickens, rain is muffled indoors, snow is a low wind, snow settles and melts, the sky agrees with the clock.
import { boot, check } from './lib/game.mjs';
const g = await boot(); const { page } = g;
await g.intoWorld(); const stop = g.keepAlive();
await page.evaluate(() => forceTime(11));
const dens = async (w) => { await g.spin(w, 240); return page.evaluate(() => WORLD.scene.fog.density); };
const clear = await dens('clear'), fog = await dens('fog');
check('fog closes the view (>8x clear)', fog > clear * 8, { clear, fog });
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
