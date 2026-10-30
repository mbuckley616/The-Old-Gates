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
  // S1525 — E at a lit fire opens its page; a log joins the logs' row (the critic's s995)
  if (cookOpen) closeCookPage(); interact(); out.eFire = cookOpen; closeCookPage();
  bagAdd(survItem('log', 2)); out.logRows = BAG.filter(b => b.log === 'log').length; bagTake(b => b.log === 'log', 2);
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
  // ── Cooking's perks (S1500): Two portions at 25 (Full belly at 75 below, once the fire is out) ──
  bagAdd(survItem('meat', 2)); S(24); out.n24 = cookAt('meat').n; S(25); out.n25 = cookAt('meat').n;
  // ── Seasoned (S1503, Cooking 100): a herb in the pot adds its known effect at a third, to both portions ──
  const hk = Object.keys(HERB_DEF).find(k => HERB_DEF[k].item && HERB_DEF[k].item.effect && HERB_DEF[k].item.effect.type === 'heal' && HERB_DEF[k].item.effect.amount >= 12);
  const herb = () => ({ ...HERB_DEF[hk].item, qty: 2, _typeKey: hk }), full = HERB_DEF[hk].item.effect.amount;
  BAG.filter(b => b.meal).forEach(b => { b.qty = 0; }); for (let i = BAG.length - 1; i >= 0; i--) if (BAG[i].qty <= 0) BAG.splice(i, 1);
  bagAdd(herb()); bagAdd(survItem('meat', 3));
  S(99); out.sea99 = cookAt('meat', hk); out.sea99 = { name: out.sea99.item.name, herbs: bagCount(b => herbKeyOf(b) === hk) };
  S(100); const sc = cookAt('meat', hk);
  out.sea = { name: sc.item.name, n: sc.n, qty: sc.item.qty, herbs: bagCount(b => herbKeyOf(b) === hk), amt: sc.item.meal.season && sc.item.meal.season.eff.amount, full, list: seasonHerbs().map(h => h.key + ':' + h.n) };
  worldState.fed = null; PHP = 20; eatMeal(BAG.indexOf(sc.item)); playClockS += 1; tickDrink();
  out.sea.healed = PHP - 20; out.sea.fed = fedKind(); out.sea.left = sc.item.qty;
  const rg = Object.keys(HERB_DEF).find(k => HERB_DEF[k].item && HERB_DEF[k].item.effect && HERB_DEF[k].item.effect.type === 'hpRegen');
  out.seaRegen = rg ? seasonOf({ ...HERB_DEF[rg].item, _typeKey: rg }).eff : null; out.regenFull = rg ? HERB_DEF[rg].item.effect : null;
  bagTake(b => herbKeyOf(b) === hk, 9); out.seaNone = cookAt('meat', hk).why;
  out.seaSer = !!(_serItem(sc.item).meal.season && _serItem(sc.item).meal.season.eff.amount === out.sea.amt);
  // the page at 100: the herbs to season with, one cooking takes one
  bagAdd(herb()); cookSel = 'meat'; cookSeason = null; openCookPage(); const srows = [...document.querySelectorAll('#ck-right [data-s]')];
  out.seaPage = { rows: srows.length, has: srows.some(d => d.dataset.s === hk) };
  srows.find(d => d.dataset.s === hk).click(); cookGo(); out.seaPage.said = document.getElementById('ck-said').textContent; out.seaPage.herbs = bagCount(b => herbKeyOf(b) === hk);
  closeCookPage(); bagTake(b => herbKeyOf(b) === hk, 9); cookSeason = null;
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
  const sleep = lv => { S(lv); worldState.fed = null; setFed('hearty', 1); const left0 = Math.round(fedNow().until - gameMinNow());
    const _f = doFade, _s = window.saveGame; doFade = cb => cb(); window.saveGame = () => {};
    try { restAtBed(8); } finally { doFade = _f; window.saveGame = _s; }
    const F = fedNow(); return { left0, left: F ? Math.round(F.until - gameMinNow()) : 0 }; };
  out.sleep74 = sleep(74); out.sleep75 = sleep(75);
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
check(`Two portions: a meal cooked makes ${r.n24} at Cooking 24, ${r.n25} at 25`, r.n24 === 1 && r.n25 === 2);
check(`Seasoned: at Cooking 99 the herb is not taken (${r.sea99.name}, ${r.sea99.herbs} herbs kept); at 100 "${r.sea.name}", ${r.sea.qty} portions for 1 herb (${r.sea.herbs} left), +${r.sea.amt} HP of its ${r.sea.full}`,
  !/ with /.test(r.sea99.name) && r.sea99.herbs === 2 && / with /.test(r.sea.name) && r.sea.qty === 2 && r.sea.herbs === 1 && r.sea.amt === Math.max(1, Math.round(r.sea.full / 3)), r.sea);
check(`a seasoned meal eaten: fed ${r.sea.fed} and healed ${r.sea.healed}, ${r.sea.left} portion left; a regeneration herb seasons at rate ${r.seaRegen && r.seaRegen.rate} of ${r.regenFull && r.regenFull.rate} for the same ${r.seaRegen && r.seaRegen.duration} s`,
  r.sea.fed === 'hearty' && r.sea.healed === r.sea.amt && r.sea.left === 1 && r.seaRegen && Math.abs(r.seaRegen.rate - r.regenFull.rate / 3) < .01 && r.seaRegen.duration === r.regenFull.duration, { sea: r.sea, rg: r.seaRegen });
check(`no herb left: "${r.seaNone}"; the seasoning keeps through the save`, /none/.test(r.seaNone || '') && r.seaSer);
check(`the page at 100 offers ${r.seaPage.rows} seasonings (nothing and the herb); a cooking with it says "${r.seaPage.said}" and takes one (${r.seaPage.herbs} left)`,
  r.seaPage.rows === 2 && r.seaPage.has && / with /.test(r.seaPage.said) && r.seaPage.herbs === 1, r.seaPage);
check(`Full belly: fed with ${r.sleep74.left0} min left, 8 hours' sleep leaves ${r.sleep74.left} at 74 and ${r.sleep75.left} at 75`, r.sleep74.left === 0 && r.sleep75.left === r.sleep74.left0 && r.sleep75.left0 > 0, { s74: r.sleep74, s75: r.sleep75 });
check(`the page: ${r.rows} recipes, cooks two at 100 ("${r.said}"), Esc closes`, r.page && r.rows === 5 && r.paged === 2 && /^Two: /.test(r.said) && r.closed);
check(`after an hour the fire is out and gone ("${r.cold}")`, !r.out.at && r.out.left === 0 && !r.out.mesh && /fire/.test(r.cold || ''), r.out);
check('an inn\'s and a home\'s hearth is a fire; a smithy\'s room is not', r.inn && r.home && !r.smithy);
check(`the inn's Hot Stew is ${r.shop.stew} and Mulled Cider ${r.shop.cider}; the goods shop sells ${r.shop.misc.join(', ')}; the weaponsmith none`,
  r.shop.stew === 'hearty' && r.shop.cider === 'clear' && r.shop.misc.includes('Tinderbox') && r.shop.misc.includes('Root Vegetables') && r.shop.weapon === 0, r.shop);
check('a meal, a log and a food keep their kinds through the save; fed is the character\'s', r.ser && r.charKey);
check(`E at a lit fire opens its page; logs keep one row (${r.logRows})`, r.eFire && r.logRows === 1, { eFire: r.eFire, logRows: r.logRows });
// S1620 — Uisce touched douses a fire: one 1.5 m ahead goes out; one 2.5 m ahead, or behind you, does not
const ds = await page.evaluate(() => {
  for (const f of CAMPFIRES.slice()) { dropFire(f); } CAMPFIRES.length = 0;
  bagAdd(survItem('tinderbox')); bagAdd(survItem('log', 3));
  const put = d => { const f = lightFire(); if (!f) return null; f.x = px - Math.sin(yaw) * d; f.z = pz - Math.cos(yaw) * d; return f; };
  const said = []; const sm = showMsg; showMsg = m => said.push(m);
  const out = {};
  try {
    const far = put(2.5); out.far = touchLand({ word: 'siul_uisce', tier: 2, sp: null }).doused || false; out.farLeft = CAMPFIRES.includes(far);
    yaw += Math.PI; out.behind = touchLand({ word: 'siul_uisce', tier: 2, sp: null }).doused || false; yaw -= Math.PI;
    far.x = px - Math.sin(yaw) * 1.5; far.z = pz - Math.cos(yaw) * 1.5;
    const p0 = skillsReady().uisce.p; SKILL_LAST.delete('uisce');
    out.near = touchLand({ word: 'siul_uisce', tier: 2, sp: null }).doused || false; out.gone = !CAMPFIRES.includes(far) && !(far.mesh && far.mesh.parent);
    out.use = skillsReady().uisce.p > p0; out.said = said.filter(m => /fire/.test(m)).pop();
  } finally { showMsg = sm; }
  return out;
});
console.log(JSON.stringify(ds));
check(`Uisce touched douses the fire 1.5 m ahead (${ds.near}, gone ${ds.gone}: "${ds.said}"), not one 2.5 m ahead (${ds.far}) or behind you (${ds.behind}); a use of Uisce (${ds.use})`,
  ds.near && ds.gone && !ds.far && ds.farLeft && !ds.behind && ds.use && ds.said === 'The fire hisses out.', ds);
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
