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
// S1624 — Uisce touched douses a fire: one 1.5 m ahead goes out; one 2.5 m ahead, or behind you, does not
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

// Session 2012 — water B, session 1 (Michael's B on #1254, `docs/design/water.md`): a waterskin (4 uses, 0.3 empty and 0.25 a use) at
// every goods shop and inn; E fills every vessel at a town's well (clean, foul while the town has the plague), in a river or lake 0.3 m
// deep (raw), never the sea; rain outdoors adds a use each 10 game minutes. A drink leaves you Watered for 2 hours (a flask 4):
// stamina regeneration ×1.1 and Cool 1. Foul water does you no good. Watered is the character's and saved.
// a town with a plaza must be built first: on a slow runner the start's town comes some seconds after the world opens
await page.waitForFunction(() => [...SETTLE.values()].some(S => S.site && KIND_PLAN[S.site.kind] && KIND_PLAN[S.site.kind].rows > 0 && S.site.kind !== 'farm'), null, { timeout: 180000, polling: 500 });
const wt = await page.evaluate(() => {
  const out = {}; BAG.length = 0; worldState.watered = null; CAMPFIRES.splice(0).forEach(dropFire); WX.type = 'clear';
  const sm0 = showMsg; let last = ''; showMsg = (t, c) => { last = t; return sm0(t, c); }; const showMsgLast = () => last;
  const sk = survivalFor({ type: 'misc' }).find(i => i.vessel), inn = survivalFor({ type: 'inn' }).some(i => i.vessel);
  out.shop = { name: sk && sk.name, uses: sk && sk.wUses, w: sk && sk.weight, inn, price: sk && sk.buyPrice };
  bagAdd(sk); const it = BAG.find(b => b.vessel);
  const drink = () => { useItem(BAG.indexOf(it)); if (DRINK) { const d = DRINK; DRINK = null; d.apply(); } };
  const S = [...SETTLE.values()].find(S => S.site && KIND_PLAN[S.site.kind] && KIND_PLAN[S.site.kind].rows > 0 && S.site.kind !== 'farm');
  const st = S.site; px = st.x + 6 + 3; pz = st.z + 4; jumpY = 0;
  out.well = { site: st.id, near: !!wellNear(), prompt: waterPrompt(), far: (() => { px += 3; const n = !!wellNear(); px -= 3; return n; })() };
  fillHere(); out.well.uses = it.wUses; out.well.kind = it.wKind; out.well.w = it.weight; out.full = (fillHere(), showMsgLast());
  const t0 = gameMinNow(); drink(); const W = wateredNow();
  out.drink = { uses: it.wUses, mins: W && Math.round(W.until - t0), mult: waterRegenMult(), cool: coolNow().by.includes('Watered'), pill: /💧/.test(waterPill()) };
  worldState.gameTimeAbsMinutes += 121; out.drink.after = !!wateredNow(); out.drink.multAfter = waterRegenMult();
  const T = worldState.towns || (worldState.towns = {}); const ts = T[st.id] || (T[st.id] = { flags: {} }); const was = ts.flags.plague;
  while (it.wUses) drink(); ts.flags.plague = gameMinNow(); fillHere(); out.plague = { kind: it.wKind, uses: it.wUses }; worldState.watered = null; drink();
  out.plague.watered = !!wateredNow(); out.plague.said = showMsgLast(); if (was == null) delete ts.flags.plague; else ts.flags.plague = was;
  while (it.wUses) drink(); px = st.x + 60; pz = st.z + 60;
  let fresh = null, sea = null; const p0 = [px, pz];
  for (let k = 0; k < 40000 && !(fresh && sea); k++) { const x = p0[0] + (Math.random() - .5) * 3000, z = p0[1] + (Math.random() - .5) * 3000; let y; try { y = worldH(x, z); } catch (e) { continue; } if (!(y < SEA_Y - .3)) continue;
    const f = wildRiverNear(x, z, 0) || wildLakeNear(x, z); if (f && !fresh) fresh = [x, z]; else if (!f && !sea && y < -2) sea = [x, z]; }
  if (fresh) { [px, pz] = fresh; out.river = { src: waterSourceHere(), filled: fillHere() }; out.river.kind = it.wKind; out.river.uses = it.wUses; while (it.wUses) drink(); }
  if (sea) { [px, pz] = sea; out.sea = { prompt: waterPrompt(), took: fillHere(), said: showMsgLast(), uses: it.wUses }; }
  px = p0[0]; pz = p0[1]; tickWater(); WX.type = 'rain'; tickWater(); /* the clock's mark first, dry */ for (let i = 0; i < 3; i++) { worldState.gameTimeAbsMinutes += 10; tickWater(); } out.rain = it.wUses; WX.type = 'clear';
  bagAdd(waterItem('flask', 2)); const fl = BAG.find(b => b.vessel === 'flask'); worldState.watered = null; const t1 = gameMinNow(); useItem(BAG.indexOf(fl)); if (DRINK) { const d = DRINK; DRINK = null; d.apply(); }
  out.flask = wateredNow() && Math.round(wateredNow().until - t1);
  out.save = { char: SS_CHAR_WS.watered === 1, list: _applyLoadData.toString().includes("'watered'") };
  showMsg = sm0; return out; });
console.log(JSON.stringify(wt));
check(`a ${wt.shop.name} at the goods shop and the inn (${wt.shop.inn}), ${wt.shop.price} gold, empty, ${wt.shop.w} kg`, wt.shop.name === 'Waterskin' && wt.shop.inn && wt.shop.uses === 0 && wt.shop.w === .3, wt.shop);
check(`at ${wt.well.site}'s well ("${wt.well.prompt}"; not 3 m farther) E fills it: ${wt.well.uses} uses, ${wt.well.kind}, ${wt.well.w} kg; again: "${wt.full}"`,
  wt.well.near && !wt.well.far && /fill the waterskin/.test(wt.well.prompt) && wt.well.uses === 4 && wt.well.kind === 'clean' && wt.well.w === 1.3 && wt.full === 'Your water is full.', wt.well);
check(`a drink: ${wt.drink.uses} left, Watered ${wt.drink.mins} min, stamina regeneration ×${wt.drink.mult}, Cool 1 (${wt.drink.cool}); gone after (×${wt.drink.multAfter})`,
  wt.drink.uses === 3 && wt.drink.mins === 120 && wt.drink.mult === 1.1 && wt.drink.cool && wt.drink.pill && !wt.drink.after && wt.drink.multAfter === 1, wt.drink);
check(`the well of a town with the plague fills it ${wt.plague.kind}; a drink of it leaves you not Watered ("${wt.plague.said}")`, wt.plague.kind === 'foul' && wt.plague.uses === 4 && !wt.plague.watered, wt.plague);
check(`a river or lake 0.3 m deep fills it raw (${wt.river && wt.river.uses}, ${wt.river && wt.river.kind})`, wt.river && wt.river.filled && wt.river.kind === 'raw' && wt.river.uses === 4, wt.river);
check(`the sea fills nothing ("${wt.sea && wt.sea.said}", no prompt)`, wt.sea && wt.sea.took && !wt.sea.prompt && wt.sea.uses === 0 && wt.sea.said === 'It would not slake a gull.', wt.sea);
check(`rain outdoors: three ten-minute marks, ${wt.rain} uses`, wt.rain === 3, wt);
check(`a flask's drink lasts ${wt.flask} min; Watered is the character's and read back on load`, wt.flask === 240 && wt.save.char && wt.save.list, wt);

// Session 2013 — water B, session 2: raw water leaves you Queasy one drink in eight (×0.8 stamina regeneration, 20 min), seeded by the
// fill's chunk and day and the drink's index; foul water always (60 min, not Watered). A fill at a source pours out worse water. Boiling
// at a fire cleans raw water and heats a canteen (a hot drink is Warmth 1, not Cool 1); a Charcoal filters raw water. The canteen at
// the Mark's goods shops, the flask at Aurenne's.
const w2 = await page.evaluate(() => {
  const out = {}; BAG.length = 0; worldState.watered = null; worldState.queasy = null; CAMPFIRES.splice(0).forEach(dropFire); WX.type = 'clear';
  const sm0 = showMsg; let last = ''; showMsg = (t, c) => { last = t; return sm0(t, c); };
  const sip = it => { useItem(BAG.indexOf(it)); if (DRINK) { const d = DRINK; DRINK = null; d.apply(); } };
  bagAdd(waterItem('skin')); const it = BAG.find(b => b.vessel); const x0 = px, z0 = pz;
  const run = () => { let q = 0, n = 0, seq = ''; for (let k = 0; k < 200; k++) { px = x0 + k * CHUNK; vesselEmpty(it); fillVessel(it, 'raw');
    for (let u = 0; u < 4; u++) { worldState.queasy = null; sip(it); const y = !!queasyNow(); q += y; n++; seq += y ? 1 : 0; } } return { q, n, seq }; };
  const A = run(), B = run(); px = x0; pz = z0;
  out.raw = { q: A.q, n: A.n, same: A.seq === B.seq };
  let qd = null; for (let k = 0; k < 60 && !qd; k++) { px = x0 + (300 + k) * CHUNK; vesselEmpty(it); fillVessel(it, 'raw'); for (let u = 0; u < 4 && !qd; u++) { worldState.queasy = null; const t = gameMinNow(); sip(it); if (queasyNow()) qd = { mins: Math.round(queasyNow().until - t), mult: +waterRegenMult().toFixed(3), watered: !!wateredNow() }; } }
  px = x0; out.rawQ = qd; vesselEmpty(it);
  worldState.queasy = null; worldState.watered = null; fillVessel(it, 'foul'); const t1 = gameMinNow(); sip(it);
  out.foul = { mins: queasyNow() && Math.round(queasyNow().until - t1), watered: !!wateredNow(), mult: +waterRegenMult().toFixed(3), pill: /🤢/.test(waterPill()) };
  worldState.queasy = null;
  const S = [...SETTLE.values()].find(S => S.site && KIND_PLAN[S.site.kind] && KIND_PLAN[S.site.kind].rows > 0 && S.site.kind !== 'farm'); px = S.site.x + 9; pz = S.site.z + 4;
  out.pour = { before: it.wKind, uses: it.wUses, prompt: waterPrompt() }; fillHere(); Object.assign(out.pour, { after: it.wKind, n: it.wUses, said: last });
  px = x0; pz = z0; vesselEmpty(it); fillVessel(it, 'raw'); bagAdd(waterItem('canteen', 3)); const cn = BAG.find(b => b.vessel === 'canteen');
  bagAdd(survItem('tinderbox')); bagAdd(survItem('log')); const f = lightFire(); px = f.x + .5; pz = f.z;
  openCookPage(); out.boilRow = !!document.querySelector('#ck-list [data-k="boil"]'); closeCookPage();
  const bo = cookAt('boil'); out.boil = { made: bo.made, skin: it.wKind, hot: waterSay(cn) };
  worldState.watered = null; sip(cn); out.hot = { hot: !!(wateredNow() && wateredNow().hot), warm: warmthNow().by.includes('a hot drink'), cool: coolNow().by.includes('Watered') };
  worldState.gameTimeAbsMinutes += 181; out.cold = waterSay(cn);
  CAMPFIRES.splice(0).forEach(dropFire); fillVessel(it, 'raw', null, true); vesselEmpty(it); fillVessel(it, 'raw'); bagAdd(survItem('charcoal', 2));
  useItem(BAG.findIndex(b => b.name === 'Charcoal')); out.filter = { kind: it.wKind, left: bagCount(b => b.name === 'Charcoal'), said: last };
  anchoredPlaces(); const isle = {}; for (const c of CELLS.values()) { if (c.type === 'sea') continue; const nk = nationKeyOf(c.i, c.j); if (isle[nk]) continue; const t = c.sites.find(t => t.kind === 'village'); if (t) isle[nk] = survivalFor({ type: 'misc', siteId: t.id }).filter(i => i.vessel).map(i => i.name); }
  out.isle = isle; out.save = SS_CHAR_WS.queasy === 1 && _applyLoadData.toString().includes("'queasy'");
  showMsg = sm0; worldState.watered = null; worldState.queasy = null; return out; });
console.log(JSON.stringify(w2));
check(`raw water: ${w2.raw.q} of ${w2.raw.n} drinks leave you Queasy (one in eight, 70 to 130), the same again on the same fills`, w2.raw.q >= 70 && w2.raw.q <= 130 && w2.raw.same, w2.raw);
check(`Queasy from raw water: ${w2.rawQ && w2.rawQ.mins} min, stamina regeneration ×${w2.rawQ && w2.rawQ.mult}, still Watered`, w2.rawQ && w2.rawQ.mins === 20 && w2.rawQ.mult === 0.88 && w2.rawQ.watered, w2.rawQ);
check(`foul water: Queasy ${w2.foul.mins} min (×${w2.foul.mult}), not Watered`, w2.foul.mins === 60 && w2.foul.mult === 0.8 && !w2.foul.watered && w2.foul.pill, w2.foul);
check(`a waterskin of foul water at a clean well: the prompt shows and E pours it out and fills it clean ("${w2.pour.said}")`, w2.pour.before === 'foul' && w2.pour.prompt && w2.pour.after === 'clean' && w2.pour.n === 4, w2.pour);
check(`at a fire Boil Water (listed: ${w2.boilRow}) cleans raw water and heats the canteen ("${w2.boil.hot}"); its drink is Warmth 1, not Cool 1; cold 3 hours on ("${w2.cold}")`,
  w2.boilRow && w2.boil.made && w2.boil.skin === 'clean' && /hot/.test(w2.boil.hot) && w2.hot.hot && w2.hot.warm && !w2.hot.cool && !/hot/.test(w2.cold), w2);
check(`a Charcoal used filters raw water clean (${w2.filter.kind}, ${w2.filter.left} left): "${w2.filter.said}"`, w2.filter.kind === 'clean' && w2.filter.left === 1, w2.filter);
check(`the vessels by island: ${JSON.stringify(w2.isle)}; Queasy is the character's and saved`, w2.isle.gatelands + '' === 'Waterskin' && w2.isle.mark + '' === 'Waterskin,Canteen' && w2.isle.aurenne + '' === 'Waterskin,Flask' && w2.save, w2.isle);
// S2028 — Cooking B, session 1 (`docs/design/cooking-build.md`): a main and an island's second make a dish, ×1.5 its length
// (Filling ×2.25), with the second's rider; a caught fish cooks; a dish wants a pot; cooking a pair teaches it.
const ck = await page.evaluate(() => {
  const out = {}, S = lv => { SKILLS.cooking = { lv, p: 0 }; };
  BAG.length = 0; worldState.fed = null; worldState.dishesKnown = {}; CAMPFIRES.splice(0).forEach(dropFire);
  const eat = it => { eatMeal(BAG.indexOf(it)); playClockS += 1; tickDrink(); };
  const lid0 = lid, h0 = currentHouse; lid = 'int_test'; currentHouse = { type: 'inn' };
  // a trout at a hearth
  bagAdd(troutItem()); const tf = cookAt('fish'); out.trout = { made: tf.made, name: tf.item && tf.item.name, left: bagCount(b => b.name === 'Trout') };
  out.troutSaved = _serItem(troutItem()).food === 'fish';
  // lengths at Cooking 5
  S(5); const mult = skillMult('cooking'); out.mult = mult;
  bagAdd(survItem('meat', 6)); bagAdd(secondItem('butter', 2)); bagAdd(secondItem('oats', 1));
  SKILL_LAST.delete('cooking'); const p0 = SKILLS.cooking.p; const rich = cookAt('meat', null, 'butter'); out.uses = SKILLS.cooking.p - p0;
  out.rich = { name: rich.item.name, r: rich.item.meal.r, learnt: rich.learnt, butterLeft: bagCount(b => b.second === 'butter') };
  const st0 = effMaxStamina(); eat(rich.item); out.richMins = Math.round(fedNow().until - gameMinNow()); out.richStam = effMaxStamina() / st0;
  const fill = cookAt('meat', null, 'oats'); worldState.fed = null; eat(fill.item); out.fillMins = Math.round(fedNow().until - gameMinNow());
  out.noOats = cookAt('meat', null, 'oats').why;
  // Restoring once
  bagAdd(secondItem('apples', 2)); const ap1 = cookAt('meat', null, 'apples').item; cookAt('meat', null, 'apples');
  worldState.fed = null; PHP = 10; eat(ap1); out.rest1 = PHP - 10; PHP = 10; eat(BAG.find(b => b.meal && b.meal.r === 'restoring')); out.rest2 = PHP - 10;
  // Warmth and Cool beside the kind's
  bagAdd(secondItem('curd')); bagAdd(secondItem('olives')); bagAdd(survItem('produce'));
  worldState.fed = null; eat(cookAt('meat', null, 'curd').item); out.warm = warmthNow();
  worldState.fed = null; eat(cookAt('produce', null, 'olives').item); out.cool = coolNow();
  // the page: the seconds in the bag, the rider *?* until known
  bagAdd(secondItem('rye')); bagAdd(secondItem('butter')); cookSel = 'meat'; cookSecond = null; openCookPage();
  const rows = [...document.querySelectorAll('#ck-right [data-d]')].map(d => d.textContent.trim()); out.rows = rows;
  document.querySelector('#ck-right [data-d="rye"]').click(); cookGo(); out.said = document.getElementById('ck-said').textContent; closeCookPage(); cookSecond = null;
  // fires: a campfire roasts; a dish there needs a mess kit
  out.known = Object.keys(dishesKnown()).sort();
  lid = lid0; currentHouse = h0; bagAdd(survItem('meat', 3)); bagAdd(survItem('tinderbox')); bagAdd(survItem('log', 1)); bagAdd(secondItem('wheat', 2)); lightFire();
  out.camp = { roast: cookAt('meat').made, noKit: cookAt('meat', null, 'wheat').why };
  bagAdd({ ...SURV_ITEMS.messkit }); out.camp.kit = cookAt('meat', null, 'wheat').made;
  CAMPFIRES.splice(0).forEach(dropFire);
  // the shops by island, and the save
  anchoredPlaces(); const isle = {}; for (const c of CELLS.values()) { if (c.type === 'sea') continue; const nk = nationKeyOf(c.i, c.j); if (isle[nk]) continue; const t = c.sites.find(t => t.kind === 'village'); if (t) isle[nk] = survivalFor({ type: 'misc', siteId: t.id }).filter(i => i.second).map(i => i.second + ':' + i.buyPrice); }
  out.isle = isle; out.kit = survivalFor({ type: 'misc' }).some(i => i.tool === 'messkit') && !survivalFor({ type: 'inn' }).some(i => i.tool === 'messkit');
  out.save = SS_CHAR_WS.dishesKnown === 1 && _applyLoadData.toString().includes("'dishesKnown'") && _serItem(secondItem('curd')).second === 'curd' && _serItem(ap1).meal.r === 'restoring';
  return out;
});
console.log(JSON.stringify(ck));
check(`a trout cooks at a hearth (${ck.trout.name}, ${ck.trout.left} left); a trout's kind keeps through the save`, ck.trout.made && ck.trout.name === 'Baked Fish' && ck.trout.left === 0 && ck.troutSaved, ck.trout);
check(`meat and butter at Cooking 5: "${ck.rich.name}", ${ck.rich.r}, learnt ${ck.rich.learnt}, ${ck.uses} Cooking points; fed ${ck.richMins} min (1.5 × 120 × ${ck.mult.toFixed(2)}), stamina ×${ck.richStam.toFixed(4)}`,
  ck.uses === 9 && ck.rich.r === 'rich' && ck.rich.learnt && ck.rich.butterLeft === 1 && Math.abs(ck.richMins - 180 * ck.mult) <= 1 && Math.abs(ck.richStam - 1.1875) < .01, ck.rich);
check(`meat and oats is Filling: ${ck.fillMins} min (2.25 × 120 × ${ck.mult.toFixed(2)}); none left: "${ck.noOats}"`, Math.abs(ck.fillMins - 270 * ck.mult) <= 1 && /oats/.test(ck.noOats || ''));
check(`Restoring: the first apple dish gives ${ck.rest1} health, the second, eaten while the first feeds you, ${ck.rest2}`, ck.rest1 === 30 && ck.rest2 === 0);
check(`a curd stew warms by ${ck.warm.n} (${ck.warm.by}); a root stew with olives cools by ${ck.cool.n} (${ck.cool.by})`, ck.warm.n === 2 && ck.cool.n === 2, { w: ck.warm, c: ck.cool });
check(`the page offers ${ck.rows.length} rows (${ck.rows.join(' | ')}): butter's rider named, rye's "?"; rye cooked says "${ck.said}"`,
  ck.rows.length === 3 && /Butter.*Rich/.test(ck.rows.join('|')) && /Rye \(1\) \?/.test(ck.rows.join('|')) && /new to you/.test(ck.said), ck.rows);
check(`dishes learnt: ${ck.known.join(', ')}`, ck.known.join() === 'meat:apples,meat:butter,meat:curd,meat:oats,meat:rye,produce:olives');
check(`a campfire roasts (${ck.camp.roast}); a dish there without a pot: "${ck.camp.noKit}"; with a mess kit: ${ck.camp.kit}`, ck.camp.roast && /pot/.test(ck.camp.noKit || '') && ck.camp.kit, ck.camp);
check(`the seconds by island: ${JSON.stringify(ck.isle)}; the mess kit at the goods shop only; the dishes, the seconds and the riders saved`,
  ck.isle.gatelands + '' === 'oats:2,apples:3,butter:4' && ck.isle.mark + '' === 'rye:2,berries:3,curd:4' && ck.isle.aurenne + '' === 'wheat:2,dates:3,olives:4' && ck.kit && ck.save, ck.isle);
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
