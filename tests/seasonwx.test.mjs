// The seasons in the weather (Session 499, Michael's C on DECISION #132, part B): the climate's odds are moved by the
// calendar's season (seasonWx, read by weatherWeights before the biome's). The Gatelands: autumn rain ×1.5, snow on the
// low ground in winter. The Mark: colder in each. Aurenne: a drier summer. Out of season, the odds are as before.
import { boot, check } from './lib/game.mjs';
const g = await boot(); const { page } = g;
await g.intoWorld();
const r = await page.evaluate(() => {
  const base = { temperate: { clear: .5, overcast: .2, fog: .08, rain: .15, storm: .05, snow: 0 }, cold: { clear: .35, overcast: .22, fog: .08, rain: .05, storm: .02, snow: .28 }, warm: { clear: .6, overcast: .14, fog: .03, rain: .1, storm: .1, snow: 0 } };
  const dayOf = se => { for (let n = 0; n < 336; n++) if (calDay(n * 1440).season === se) return n * 1440 + 600; };
  const out = {}; for (const cl in base) { out[cl] = {}; for (const se of ['spring', 'summer', 'autumn', 'winter']) out[cl][se] = seasonWx(Object.assign({}, base[cl]), cl, dayOf(se)); }
  // at the start (in the Gatelands, by Hearthwick's road) and in its winter, by the real roll
  const here = nationOf(...cellOf(px, pz)).climate;
  const roll = (at) => { worldState.gameTimeAbsMinutes = at; const w = weatherWeights(); let snow = 0; for (let i = 0; i < 400; i++) if (pickWeather() === 'snow') snow++; return { w, snow }; };
  const autumn = roll(dayOf('autumn')), winter = roll(dayOf('winter')), spring = roll(dayOf('spring'));
  // S1433 — #723's A: a fifth of a cold winter's snow is a blizzard, a fifth of autumn's rain heavy rain (shares of the whole roll)
  const share = (cl, se, biome) => { const at = dayOf(se), w = seasonWx(Object.assign({}, base[cl]), cl, at);
    if (biome === 'tundra') { w.snow += .15; w.clear *= .7; } if (biome === 'fen') { w.fog += .2; w.rain += .1; w.clear *= .5; }
    heavyWx(w, cl, at); let s = 0; for (const k in w) s += w[k]; return { blizzard: (w.blizzard || 0) / s, heavyrain: (w.heavyrain || 0) / s, snow: w.snow / s, rain: w.rain / s }; };
  const heavy = { markWinter: share('cold', 'winter'), tundraWinter: share('cold', 'winter', 'tundra'), gateAutumn: share('temperate', 'autumn'), fenAutumn: share('temperate', 'autumn', 'fen'),
    gateWinter: share('temperate', 'winter'), markAutumn: share('cold', 'autumn'), warmAutumn: share('warm', 'autumn'), markSpring: share('cold', 'spring') };
  const autumnHeavy = (() => { worldState.gameTimeAbsMinutes = dayOf('autumn'); let n = 0; for (let i = 0; i < 2000; i++) if (pickWeather() === 'heavyrain') n++; return n; })();
  return { out, base, here, autumn, winter, spring, startSeason: calDay(0).season, heavy, autumnHeavy };
});
console.log(JSON.stringify(r).slice(0, 1800));
const o = r.out, b = r.base, near = (a, x) => Math.abs(a - x) < 1e-9;
check('the Gatelands: autumn rain by half again, winter snow on the low ground; spring and summer as before', near(o.temperate.autumn.rain, .225) && o.temperate.autumn.snow === 0 && o.temperate.winter.snow > 0 && JSON.stringify(o.temperate.spring) === JSON.stringify(b.temperate) && JSON.stringify(o.temperate.summer) === JSON.stringify(b.temperate), o.temperate);
check('the Mark is colder: more snow in winter and autumn, less in summer', o.cold.winter.snow > b.cold.snow && o.cold.autumn.snow > b.cold.snow && o.cold.summer.snow < b.cold.snow, o.cold);
check('Aurenne\'s summer is drier, and it never snows', o.warm.summer.rain < b.warm.rain && o.warm.summer.storm < b.warm.storm && ['spring', 'summer', 'autumn', 'winter'].every(s => o.warm[s].snow === 0), o.warm);
check('the tale starts in autumn, and in the Gatelands autumn no snow is rolled (0 in 400), as before', r.startSeason === 'autumn' && r.here === 'temperate' && r.autumn.snow === 0 && r.spring.snow === 0, { here: r.here, autumn: r.autumn.snow, spring: r.spring.snow });
check('in the Gatelands winter snow is rolled on the road (about 1 in 10)', r.winter.w.snow > 0 && r.winter.snow >= 15 && r.winter.snow <= 90, { w: r.winter.w, snow: r.winter.snow });
const h = r.heavy, pc = (a, x) => Math.abs(a * 100 - x) < .6;
check('a blizzard is 7.5% of the Mark\'s winter roll and 10% of a tundra\'s, out of snow\'s share', pc(h.markWinter.blizzard, 7.5) && pc(h.tundraWinter.blizzard, 10) && pc(h.markWinter.blizzard + h.markWinter.snow, 37.7), h);
check('heavy rain is 4% of the Gatelands\' autumn roll and 6% of a fen\'s, out of rain\'s share', pc(h.gateAutumn.heavyrain, 4.3) && pc(h.fenAutumn.heavyrain, 5.9) && pc(h.gateAutumn.heavyrain + h.gateAutumn.rain, 21.3), h);
check('no blizzard in the Gatelands, in Aurenne or out of winter; no heavy rain out of autumn', h.gateWinter.blizzard === 0 && h.warmAutumn.blizzard === 0 && h.markAutumn.blizzard === 0 && h.markSpring.blizzard === 0 && h.markWinter.heavyrain === 0 && h.markSpring.heavyrain === 0, h);
check('the real roll at the start brings heavy rain in autumn (about 1 in 25)', r.autumnHeavy >= 40 && r.autumnHeavy <= 140, r.autumnHeavy);
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
