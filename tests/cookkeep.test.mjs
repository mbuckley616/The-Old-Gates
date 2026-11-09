// Cooking B, session 2 (Session 2033; `docs/design/cooking-build.md`): the clay oven and keeping. Every inn and every Aurennais home has
// an oven; there a grain dish (a main with oats, rye or wheat) may be a bake, the same dish that keeps 15 game days against a stew's or a
// roast's 3. A meal past its days has turned: half its length, its rider kept, *(turned)* in its name. The day and the bake ride the save.
import { boot, check } from './lib/game.mjs';
const g = await boot(); const { page } = g;
await g.intoWorld();
const r = await page.evaluate(() => {
  const out = {};
  BAG.length = 0; worldState.fed = null; worldState.dishesKnown = {}; CAMPFIRES.splice(0).forEach(dropFire); SKILLS.cooking = { lv: 5, p: 0 };
  const eat = it => { eatMeal(BAG.indexOf(it)); playClockS += 1; tickDrink(); return Math.round(fedNow().until - gameMinNow()); };
  const lid0 = lid, h0 = currentHouse; lid = 'int_test';
  // the ovens: an inn on any island, an Aurennais home, not a Gatelands home
  anchoredPlaces(); const town = {}; for (const c of CELLS.values()) { if (c.type === 'sea') continue; const nk = nationKeyOf(c.i, c.j); if (town[nk]) continue; const t = c.sites.find(t => t.kind === 'village'); if (t) town[nk] = t.id; }
  out.towns = town;
  const at = (type, isle) => { currentHouse = { type, siteId: town[isle] }; return ovenHere(); };
  out.oven = { innG: at('inn', 'gatelands'), innM: at('inn', 'mark'), homeA: at('home', 'aurenne'), homeG: at('home', 'gatelands'), homeM: at('home', 'mark') };
  // a Gatelands home: a stew, but no bake
  currentHouse = { type: 'home', siteId: town.gatelands };
  bagAdd(survItem('meat', 3)); bagAdd(survItem('produce', 4)); bagAdd(secondItem('oats', 5)); bagAdd(secondItem('butter', 1));
  out.noOven = cookAt('produce', null, 'oats', true).why;
  // an inn: a stew and a bread of the same pair; a bake of butter is refused
  currentHouse = { type: 'inn', siteId: town.gatelands };
  out.noGrain = cookAt('meat', null, 'butter', true).why;
  const day0 = gameDayNow();
  const stew = cookAt('produce', null, 'oats').item; cookAt('produce', null, 'oats'); const bread = cookAt('produce', null, 'oats', true).item, pie = cookAt('meat', null, 'oats', true).item;
  out.made = { stew: stew.name, bread: bread.name, pie: pie.name, day: stew.meal.made === day0 && bread.meal.made === day0, bake: !!bread.meal.bake && !stew.meal.bake, apart: !sameStack(stew, bread) };
  // the page at the oven: a grain dish offers stew or bake; butter does not
  cookSel = 'produce'; cookSecond = 'oats'; cookBake = false; openCookPage();
  out.page = { rows: [...document.querySelectorAll('#ck-right [data-b]')].length, skill: document.getElementById('ck-skill').textContent };
  document.querySelector('#ck-right [data-b="1"]').click(); out.page.named = /Oat Bread/.test(document.getElementById('ck-right').textContent);
  cookSecond = 'butter'; cookDraw(); out.page.butterRows = [...document.querySelectorAll('#ck-right [data-b]')].length; out.page.reset = cookBake === false;
  closeCookPage(); cookSecond = null; cookBake = false;
  // the save: the day and the bake, and the dishes known
  const d = JSON.parse(ssStringify(_buildSavePayload()));
  const ser = _serItem(bread); out.saved = { made: ser.meal.made === day0, bake: ser.meal.bake === 1, known: !!(d.wS && d.wS.dishesKnown && d.wS.dishesKnown['produce:oats']) };
  // four days on: the stew has turned, the bread has not
  const T0 = worldState.gameTimeAbsMinutes;
  worldState.gameTimeAbsMinutes = T0 + 4 * 1440; tickSurvival(0);
  out.d4 = { stew: stew.name, bread: bread.name, stewT: mealTurned(stew), breadT: mealTurned(bread), keep: mealKeepSay(bread), keepStew: mealKeepSay(stew) };
  const fullOf = it => Math.round(FED_MIN * it.meal.s * it.meal.x); out.d4.full = fullOf(stew); out.d4.breadFull = fullOf(bread);
  worldState.fed = null; out.d4.stewMins = eat(stew);
  worldState.fed = null; out.d4.breadMins = eat(bread);
  // sixteen days on: the pie has turned too, its rider kept
  worldState.gameTimeAbsMinutes = T0 + 16 * 1440; tickSurvival(0);
  out.d16 = { pie: pie.name, pieT: mealTurned(pie), full: Math.round(FED_MIN * pie.meal.s * pie.meal.x) }; worldState.fed = null; out.d16.pieMins = eat(pie); out.d16.r = fedRider();
  // a meal from before this build (no day) never turns
  const old = { name: 'Roast Meat', ico: '🥩', type: 'potion', weight: .4, meal: { kind: 'hearty', s: 1 }, brewKey: 'meal@1' }; out.oldT = mealTurned(old);
  // the reload: a turned name and the bake survive the save and _applyLoadData
  const kept = BAG.find(b => b.meal); out.reload = { before: kept && kept.name };
  const rows = ssSplitPayload(JSON.parse(ssStringify(_buildSavePayload())));
  BAG.length = 0; worldState.dishesKnown = {};
  _applyLoadData(JSON.parse(JSON.stringify(rows.c)), JSON.parse(JSON.stringify(rows.w)));
  const back = BAG.find(b => b.meal); out.reload.after = back && back.name; out.reload.made = back && back.meal.made; out.reload.known = Object.keys(dishesKnown()).sort();
  worldState.gameTimeAbsMinutes = T0; lid = lid0; currentHouse = h0;
  return out;
});
console.log(JSON.stringify(r));
check(`the oven: inns ${r.oven.innG}/${r.oven.innM}, an Aurennais home ${r.oven.homeA}; a Gatelands home ${r.oven.homeG}, a Markish one ${r.oven.homeM}`,
  r.oven.innG && r.oven.innM && r.oven.homeA && !r.oven.homeG && !r.oven.homeM, r.towns);
check(`no bake without an oven ("${r.noOven}") or a grain ("${r.noGrain}")`, /oven/.test(r.noOven || '') && /grain/.test(r.noGrain || ''));
check(`at an inn: "${r.made.stew}", "${r.made.bread}", "${r.made.pie}"; each carries its day, the bake its mark, and they stack apart`,
  r.made.bread === 'Oat Bread' && r.made.pie === 'Meat Pie with Oats' && /Stew/.test(r.made.stew) && r.made.day && r.made.bake && r.made.apart, r.made);
check(`the page at the oven: ${r.page.rows} rows (stew, bake) for oats, ${r.page.butterRows} for butter; "${r.page.skill}"; the bake named`,
  r.page.rows === 2 && r.page.butterRows === 0 && r.page.reset && r.page.named && /oven/.test(r.page.skill), r.page);
check('the meal\'s day, its bake and the dish learnt are saved', r.saved.made && r.saved.bake && r.saved.known, r.saved);
check(`four days on: "${r.d4.stew}" turned (${r.d4.keepStew}), "${r.d4.bread}" not (${r.d4.keep}); the stew feeds ${r.d4.stewMins} min of ${r.d4.full}, the bread ${r.d4.breadMins} of ${r.d4.breadFull}`,
  r.d4.stewT && !r.d4.breadT && /\(turned\)$/.test(r.d4.stew) && !/turned/.test(r.d4.bread) && Math.abs(r.d4.stewMins - r.d4.full / 2) <= 1 && Math.abs(r.d4.breadMins - r.d4.breadFull) <= 1, r.d4);
check(`sixteen days on: "${r.d16.pie}" turned, feeds ${r.d16.pieMins} min, its rider ${r.d16.r} kept; a meal with no day never turns`,
  r.d16.pieT && /\(turned\)$/.test(r.d16.pie) && Math.abs(r.d16.pieMins - r.d16.full / 2) <= 1 && r.d16.r === 'filling' && !r.oldT, r.d16);
check(`a reload keeps "${r.reload.before}" as "${r.reload.after}" (day ${r.reload.made}) and the dishes known (${r.reload.known.join(', ')})`,
  r.reload.before && r.reload.after === r.reload.before && r.reload.made != null && r.reload.known.join() === 'meat:oats,produce:oats', r.reload);
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
