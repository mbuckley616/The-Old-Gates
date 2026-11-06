// Climate B (Session 1917; Michael's 5 B, docs/design/climate-build.md, session 1): the Mark's cold and Aurenne's heat wear your
// stamina, never your health. Exposure 0–2 by island, hour, season and weather; warmth and cool take a grade off a point each;
// grade 1 regenerates at ×0.75, grade 2 at ×0.5 (its ceiling is DECISION #1211's open number, 1 until answered); exposureSeen
// rides the character's row.
import { boot, check } from './lib/game.mjs';
const g = await boot(); const { page } = g;
await g.intoWorld();

// the clock: a day of the season, at an hour (calDay reads the absolute minutes, gameHour the day's)
await page.evaluate(() => {
  window._clT = (season, h) => { let n = 0; while (calDay(n * 1440).season !== season) n++; n += 3;
    worldState.gameTimeAbsMinutes = n * 1440 + h * 60; worldState.gameTimeMinutes = h * 60; };
  window._clG = () => { _clim.g = 0; _clim.at = 0; return exposureNow(); };
  window._clBare = () => { EQ.back = null; EQ.chest = null; ACTIVE_BUFFS.length = 0; delete worldState.fed; WX.type = 'clear'; WX.heavy = 0; };
  _clBare();
});
const go = async (pt) => { await page.evaluate(([x, z]) => { px = x; pz = z; }, pt); await g.cells(); await page.evaluate(() => _clBare()); };

// 1. the map: the Gatelands never; the Mark by season and night; Aurenne's noon sand
const gl = await page.evaluate(() => { const o = {}; _clT('summer', 12); o.noon = _clG().g; _clT('winter', 23); o.night = _clG().g; return o; });
check('the Gatelands never expose you, summer noon or winter night', gl.noon === 0 && gl.night === 0, gl);

const sites = await page.evaluate(() => { const nat = t => nationKeyOf(...cellOf(t.x, t.z)); const A = allSites();
  const pick = n => { const t = A.find(t => (t.kind === 'town' || t.kind === 'city' || t.kind === 'port') && nat(t) === n); return t ? [t.x, t.z] : null; };
  return { mark: pick('mark'), au: pick('aurenne') }; });
await go(sites.mark);
const mk = await page.evaluate(() => { const o = { y: worldH(px, pz), line: snowLineAt(px, pz) }; _clT('summer', 12); o.noon = _clG().g; _clT('summer', 23); o.sumNight = _clG().g;
  _clT('winter', 23); o.night = _clG().g; _clT('winter', 12); o.winNoon = _clG().g; WX.type = 'snow'; WX.heavy = 1; o.blizz = _clG(); _clBare(); return o; });
check('the Mark: summer noon below the snow line 0; a summer night 1; a winter noon 1; a winter night 2; a blizzard 2',
  mk.y < mk.line - 2 ? mk.noon === 0 : mk.noon === 1, mk);
check('the Mark: the night, the winter and the blizzard', mk.sumNight === 1 && mk.winNoon === 1 && mk.night === 2 && mk.blizz.g === 2 && mk.blizz.why === 'blizzard', mk);

// 2. shelter: a Mark winter night, then beside a lit fire, then indoors (no place for a fire: an inn's hearth is atFire too)
const sh = await page.evaluate(() => { _clT('winter', 23); const o = { open: _clG().g };
  CAMPFIRES.push({ x: px + 1, z: pz, until: gameMinNow() + 60, mesh: null }); o.fire = _clG().g; CAMPFIRES.length = 0;
  const L = lid; lid = 'int_test'; o.inside = _clG().g; lid = L; o.again = _clG().g; return o; });
check('shelter: Bitter in the open, nothing beside a fire, nothing indoors', sh.open === 2 && sh.fire === 0 && sh.inside === 0 && sh.again === 2, sh);

// 3. protection: Bitter; the fur cloak; then Hearty
const pr = await page.evaluate(() => { _clT('winter', 23); const o = { bare: climateGrade() };
  EQ.back = makeCloak('fur'); _clim.g = 0; o.fur = climateGrade(); setFed('hearty', 1); _clim.g = 0; o.fed = climateGrade(); o.by = _clim.by.slice();
  o.pill = (climatePill().match(/title="([^"]*)"/) || [])[1]; _clBare(); return o; });
check('protection: Bitter 2, the fur cloak 1, and Hearty 0; the chip names both, dimmed', pr.bare === 2 && pr.fur === 1 && pr.fed === 0 && pr.by.join() === 'fur cloak,Hearty' && /warmed: fur cloak, Hearty/.test(pr.pill || ''), pr);

// 4. the fall: a grade falls 3 s after the cause is gone (by the clock), and rises at once
const fa = await page.evaluate(async () => { _clT('winter', 23); _clim.g = 0; const o = { up: climateGrade() };
  EQ.back = makeCloak('fur'); setFed('hearty', 1); o.held = climateGrade(); _clim.at = performance.now() - 3100; o.fell = climateGrade(); _clBare(); return o; });
check('the grade rises at once and falls only after 3 s', fa.up === 2 && fa.held === 2 && fa.fell === 0, fa);

// 5. the cost: the loop's regeneration over 600 ticks from empty, at grade 0 and at Bitter; the ceiling
const cost = await page.evaluate(() => { const run = (season, h) => { _clT(season, h); _clim.g = 0; climateGrade(); stamina = 0; staminaCD = 0;
    const before = stamina; for (let i = 0; i < 600; i++) { const r = climateRegenMult(); stamina = Math.min(effMaxStamina(), stamina + (1 / 60) * (3 + (level - 1) * .4 + ATTRS.resolve * .3) * r); } return { gain: stamina - before, grade: _clim.g, cap: climateStamCap(), max: effMaxStamina() }; };
  const o = { calm: run('summer', 12), bitter: run('winter', 23), cold: run('winter', 12) }; return o; });
check('the cost: Bitter regenerates half of grade 0\'s, Cold three quarters', Math.abs(cost.bitter.gain / cost.calm.gain - .5) < .05 && Math.abs(cost.cold.gain / cost.calm.gain - .75) < .05 && cost.bitter.grade === 2 && cost.cold.grade === 1, cost);
check('the ceiling under Bitter is #1211\'s number (1 until answered), and the stamina never passes it', cost.bitter.cap === (await page.evaluate(() => CLIMATE.cap2)) && cost.bitter.gain <= cost.bitter.max, cost.bitter);
const cap = await page.evaluate(() => { CLIMATE.cap2 = .8; _clT('winter', 23); _clim.g = 0; climateGrade(); const base = Math.round(maxStamina * fedStamMult()); const o = { max: effMaxStamina(), base };
  stamina = 999; tickSurvival(1 / 60); o.st = stamina; CLIMATE.cap2 = 1; _clT('summer', 12); _clim.g = 0; climateGrade(); o.after = effMaxStamina(); return o; });
check('with a ceiling of 0.8 set, Bitter caps the maximum at four fifths and the bar holds it there', Math.abs(cap.max - Math.round(cap.base * .8)) <= 1 && cap.st === cap.max && cap.after > cap.max, cap);

// 6. Aurenne: midday heat, the sand at noon, the evening free, and metal in the sun
await go(sites.au);
const au = await page.evaluate(() => { const o = {}; _clT('summer', 18); o.eve = _clG().g; _clT('winter', 12); o.winter = _clG().g; _clT('spring', 10); o.morn = _clG().g;
  WX.type = 'rain'; o.rain = _clG().g; WX.type = 'clear';
  EQ.chest = makeItem(5, ARMOR_TYPES.find(t => t.slot === 'chest'), null, true); o.chestTier = EQ.chest.tier; o.metal = _clG().g;
  o.tinct = (ACTIVE_BUFFS.push({ type: 'resistHeat', mult: .75, remaining: 60 }), _clim.g = 0, climateGrade()); _clBare();
  EQ.chest = makeItem(5, lineType('robe', 'chest'), null, true); _clim.g = 0; o.robe = climateGrade(); _clBare();
  // the noon sand: a dunes, wasteland or wastes point near the town, if one is loaded
  const near = REGIONS.filter(r => CLIMATE.sand[r.biome] && nationKeyOf(...cellOf(r.x, r.z)) === 'aurenne').sort((a, b) => Math.hypot(a.x - px, a.z - pz) - Math.hypot(b.x - px, b.z - pz))[0];
  o.sand = near ? [near.x, near.z, near.biome] : null; return o; });
check('Aurenne: free at 18h, in winter and in rain; Hot on a spring morning', au.eve === 0 && au.winter === 0 && au.rain === 0 && au.morn === 1, au);
check('Aurenne: a plate chest in the sun adds a grade; Resist Heat takes one off; a robe takes Hot to nothing', au.chestTier >= 3 && au.metal === 2 && au.tinct === 1 && au.robe === 0, au);
if (au.sand) {
  await go(au.sand);
  const sd = await page.evaluate(() => { const b = dominantRegion(px, pz).r.biome; _clT('summer', 13); const e = _clG(); _clT('spring', 13); const sp = _clG().g; return { b, g: e.g, why: e.why, sp }; });
  check('Aurenne\'s noon sand in summer is Scorching; in spring it stays Hot', !CLIMATE_SAND_OK(sd.b) || (sd.g === 2 && sd.sp === 1), sd);
  function CLIMATE_SAND_OK(b) { return b === 'dunes' || b === 'wasteland' || b === 'wastes'; }
} else console.log('no sand loaded near the Aurennais town; the noon-sand check skipped');

// 7. health is never touched: an hour of Scorching-grade ticks, unprotected
const hp = await page.evaluate(() => { _clT('summer', 12); EQ.chest = makeItem(5, ARMOR_TYPES.find(t => t.slot === 'chest'), null, true); const h0 = PHP;
  for (let i = 0; i < 3600; i++) { climateGrade(); tickSurvival(1 / 60); } const o = { h0, h1: PHP, g: _clim.g }; _clBare(); return o; });
check('an hour of heat in plate, unprotected, takes no health', hp.h1 === hp.h0 && hp.g >= 1, hp);

// 8. the save: exposureSeen is the character's, and survives a save and load
const rt = await page.evaluate(() => { worldState.exposureSeen = { bitter: 1, hot: 1 }; const rows = _buildSaveRows();
  const inChar = !!(rows.c && rows.c.wS && rows.c.wS.exposureSeen), inWorld = !!(rows.w && rows.w.wS && rows.w.wS.exposureSeen);
  const d = JSON.parse(ssStringify(_buildSavePayload())); delete worldState.exposureSeen; _applyLoadData(d);
  return { inChar, inWorld, seen: worldState.exposureSeen, keys: Object.keys(rows) }; });
check('exposureSeen rides the character\'s row, not the world\'s, and a save and load keeps it', rt.inChar && !rt.inWorld && rt.seen && rt.seen.bitter === 1 && rt.seen.hot === 1, rt);

check('no page errors', g.errs.length === 0, g.errs.slice(0, 5));
await g.close();
