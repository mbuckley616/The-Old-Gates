// Survival B, session 2: fires and meals (Session 1486; `docs/design/survival-build.md`). A tinderbox and one log light a
// campfire that burns one game-hour; an inn's or a home's hearth is a fire too. At a fire a food makes a meal (Cooking 6),
// two logs a charcoal, a pine log three pitch. A meal leaves you fed, one kind at a time, for 2 game-hours × the Cooking
// curve: Hearty (+15% stamina) from meat, Steady (+1 HP every 5 s) from fish, Clear (+10% mana regeneration) from produce.
// A bear, a boar or a wolf gives 1 to 3 meat, seeded by the corpse's key.
import { boot, check } from './lib/game.mjs';
const g = await boot(); const { page } = g;
await g.intoWorld();
const r = await page.evaluate(() => {
  const out = {};
  BAG.length = 0; worldState.fed = null; CAMPFIRES.splice(0).forEach(dropFire);
  const S = lv => { SKILLS.cooking = { lv, p: 0 }; };
  // ── meat off the body ──
  const wolf = { name: 'Wolf', id: 'w:test:0' }, key = 'w:test:0:corpse:3';
  const m1 = bodyMeat(wolf, [], key)[0], m2 = bodyMeat(wolf, [], key)[0];
  out.meat = { q1: m1 && m1.qty, q2: m2 && m2.qty, name: m1 && m1.name, bear: bodyMeat({ name: 'Cave Bear' }, [], 'b:1').length, boar: bodyMeat({ name: 'Boar' }, [], 'b:2').length,
    bandit: bodyMeat({ name: 'Bandit' }, [], 'b:3').length };
  const qs = new Set(); for (let i = 0; i < 40; i++) qs.add(bodyMeat(wolf, [], 'k' + i)[0].qty); out.meatRange = [...qs].sort();
  // ── the fire ──
  out.noBox = !!lightFire();
  bagAdd(survItem('tinderbox')); out.noLog = !!lightFire();
  bagAdd(survItem('log', 3)); bagAdd(survItem('pine', 1));
  const f = lightFire(); out.lit = !!f; out.logsLeft = bagCount(b => b.log === 'log'); out.pineLeft = bagCount(b => b.log === 'pine');
  out.box = hasTinderbox(); out.at = atFire(); out.burns = f && f.until - gameMinNow(); out.mesh = !!(f && f.mesh && f.mesh.parent);
  // ── a meal ──
  m1.qty = 2; bagAdd(m1); S(50); const p0 = SKILLS.cooking.p;
  const c = cookAt('meat'); out.cook = { made: c.made, name: c.item && c.item.name, s: c.item && c.item.meal.s, uses: SKILLS.cooking.p - p0, rawLeft: bagCount(b => b.food === 'meat') };
  S(100); const c100 = cookAt('meat'); out.s100 = c100.item.meal.s; out.mealStacks = BAG.filter(b => b.meal).length;
  const st0 = effMaxStamina();
  eatMeal(BAG.indexOf(BAG.find(b => b.meal && b.meal.s === 1))); playClockS += 1; tickDrink();
  out.fed = { kind: fedKind(), mins: Math.round(fedNow().until - gameMinNow()), stam: effMaxStamina() / st0 };
  // a second meal replaces the first
  bagAdd(survItem('fish')); const fish = cookAt('fish').item; eatMeal(BAG.indexOf(fish)); playClockS += 1; tickDrink();
  out.fed2 = { kind: fedKind(), mins: Math.round(fedNow().until - gameMinNow()), stam: effMaxStamina() / st0 };
  PHP = 10; tickSurvival(5); out.steady = +(PHP - 10).toFixed(3);
  worldState.fed = null; bagAdd(survItem('produce')); const pot = cookAt('produce').item; eatMeal(BAG.indexOf(pot)); playClockS += 1; tickDrink();
  out.clear = { kind: fedKind(), mult: fedManaMult() };
  // ── charcoal and pitch ──
  out.charcoal = cookAt('charcoal').made && bagCount(b => b.name === 'Charcoal'); out.logsAfter = bagCount(b => !!b.log);
  out.pitch = cookAt('pitch').made && bagCount(b => b.name === 'Pitch'); out.pineAfter = bagCount(b => b.log === 'pine');
  out.noPitch = cookAt('pitch').why;
  // ── the page ──
  bagAdd(survItem('meat', 1)); cookSel = null; openCookPage(); out.page = cookOpen && document.getElementById('cookui').style.display === 'flex';
  out.rows = document.querySelectorAll('#ck-list [data-k]').length; cookSel = 'meat'; const nm = BAG.filter(b => b.meal).reduce((a, b) => a + b.qty, 0);
  cookGo(); out.paged = BAG.filter(b => b.meal).reduce((a, b) => a + b.qty, 0) - nm; out.said = document.getElementById('ck-said').textContent;
  window.dispatchEvent(new KeyboardEvent('keydown', { code: 'Escape' })); out.closed = !cookOpen;
  // ── the fire burns out ──
  worldState.gameTimeAbsMinutes += 61; tickSurvival(1 / 60); out.out = { at: atFire(), left: CAMPFIRES.length, mesh: !!(f.mesh && f.mesh.parent) };
  out.cold = cookAt('meat').why;
  // ── the hearth ──
  const lid0 = lid, h0 = currentHouse; lid = 'int_test'; currentHouse = { type: 'inn' }; out.inn = atFire(); currentHouse = { type: 'home' }; out.home = atFire();
  currentHouse = { type: 'weapon' }; out.smithy = atFire(); lid = lid0; currentHouse = h0;
  // ── the shops and the save ──
  const stew = SHOP_STOCK.inn.find(i => i.name === 'Hot Stew'), cider = SHOP_STOCK.inn.find(i => i.name === 'Mulled Cider');
  out.shop = { stew: stew.meal && stew.meal.kind, cider: cider.meal && cider.meal.kind, misc: survivalFor({ type: 'misc' }).map(i => i.name), weapon: survivalFor({ type: 'weapon' }).length };
  out.ser = !!(_serItem(pot).meal && _serItem(survItem('log')).log && _serItem(survItem('fish')).food); out.charKey = !!SS_CHAR_WS.fed;
  return out;
});
console.log(JSON.stringify(r));
check(`a wolf gives ${r.meat.q1} ${r.meat.name}, the same again on its key (${r.meat.q2}); 1 to 3 across keys (${r.meatRange}); a bear and a boar give meat, a bandit none`,
  r.meat.q1 === r.meat.q2 && r.meat.name === 'Raw Meat' && r.meatRange.join() === '1,2,3' && r.meat.bear === 1 && r.meat.boar === 1 && r.meat.bandit === 0, r.meat);
check('no tinderbox, no fire; no log, no fire', !r.noBox && !r.noLog);
check(`a tinderbox and a log light a fire (${r.logsLeft} logs and ${r.pineLeft} pine left of 3 and 1, the tinderbox kept); it burns ${r.burns} min; you are at it`,
  r.lit && r.logsLeft === 2 && r.pineLeft === 1 && r.box && r.burns === 60 && r.at && r.mesh);
check(`Raw Meat at the fire: ${r.cook.name} at ×${r.cook.s} (Cooking 50), ${r.cook.uses} Cooking points, ${r.cook.rawLeft} raw left; ×${r.s100} at 100, two stacks`,
  r.cook.made && r.cook.name === 'Roast Meat' && Math.abs(r.cook.s - 1) < .01 && r.cook.uses > 0 && r.cook.rawLeft === 1 && Math.abs(r.s100 - 1.4) < .01 && r.mealStacks === 2, r.cook);
check(`eaten: ${r.fed.kind} for ${r.fed.mins} min, stamina ×${r.fed.stam.toFixed(3)}`, r.fed.kind === 'hearty' && Math.abs(r.fed.mins - 120) <= 1 && Math.abs(r.fed.stam - 1.15) < .01, r.fed);
check(`a fish after it replaces it: ${r.fed2.kind} for ${r.fed2.mins} min (×1.4), stamina back to ×${r.fed2.stam.toFixed(3)}; Steady heals ${r.steady} in 5 s`,
  r.fed2.kind === 'steady' && Math.abs(r.fed2.mins - 168) <= 1 && Math.abs(r.fed2.stam - 1) < .01 && Math.abs(r.steady - 1) < .01, r.fed2);
check(`Pottage: ${r.clear.kind}, mana regeneration ×${r.clear.mult}`, r.clear.kind === 'clear' && r.clear.mult === 1.1);
check(`two logs make ${r.charcoal} Charcoal (${r.logsAfter} log left); a pine log ${r.pitch} Pitch; with none: "${r.noPitch}"`, r.charcoal === 1 && r.logsAfter === 1 && r.pitch === 3 && r.pineAfter === 0 && /pine/i.test(r.noPitch || ''));
check(`the page: ${r.rows} recipes, cooks one ("${r.said}"), Esc closes`, r.page && r.rows === 5 && r.paged === 1 && r.closed);
check(`after an hour the fire is out and gone ("${r.cold}")`, !r.out.at && r.out.left === 0 && !r.out.mesh && /fire/.test(r.cold || ''), r.out);
check('an inn\'s and a home\'s hearth is a fire; a smithy\'s room is not', r.inn && r.home && !r.smithy);
check(`the inn's Hot Stew is ${r.shop.stew} and Mulled Cider ${r.shop.cider}; the goods shop sells ${r.shop.misc.join(', ')}; the weaponsmith none`,
  r.shop.stew === 'hearty' && r.shop.cider === 'clear' && r.shop.misc.includes('Tinderbox') && r.shop.misc.includes('Root Vegetables') && r.shop.weapon === 0, r.shop);
check('a meal, a log and a food keep their kinds through the save; fed is the character\'s', r.ser && r.charKey);
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
