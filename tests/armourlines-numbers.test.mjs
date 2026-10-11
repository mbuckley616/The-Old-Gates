// The light and robe armour lines (Session 564, Michael's A on DECISION #163): each piece the heavy piece of its slot scaled
// (light 60% defence at 40% weight, Finesse; robes 25% at a quarter, Intelligence, no boots), one small virtue each (a light
// piece 3% harder to notice sneaking, a robe piece 3 max mana a tier), priced 90% and 100%, a quarter of armour drops each,
// the light line at the armourer and robes at a goods shop, kept by the save.
import { boot, check } from './lib/game.mjs';
const g = await boot(); const { page } = g;
await g.intoWorld(); await g.settle('dunmore');
const r = await page.evaluate(() => {
  const H = s => ARMOR_TYPES.find(t => t.slot === s);
  const mk = (tier, line, slot) => makeItem(tier, line ? lineType(line, slot) : H(slot), null, true);
  const body = ['head', 'chest', 'hands', 'legs', 'feet'];
  const set = (tier, line) => body.map(s => (line === 'robe' && s === 'feet') ? null : mk(tier, line, s)).filter(Boolean);
  const sum = (a, k) => a.reduce((n, it) => n + it[k], 0);
  const sets = {}; for (const ln of [null, 'light', 'robe']) for (const t of [3, 5]) { const a = set(t, ln); sets[(ln || 'heavy') + t] = { def: sum(a, 'def'), w: Math.round(sum(a, 'weight') * 100) / 100, price: sum(a, 'buyPrice'), req: [...new Set(a.map(i => i.reqAttr + ' ' + i.reqVal))], names: a.map(i => i.name), n: a.length }; }
  const priceRatio = { light: mk(5, 'light', 'chest').buyPrice / mk(5, null, 'chest').buyPrice, robe: mk(5, 'robe', 'chest').buyPrice / mk(5, null, 'chest').buyPrice };
  const low = { light: mk(2, 'light', 'head').reqAttr, robe1: mk(1, 'robe', 'hands').def };
  // the virtues
  const wasEQ = { ...EQ }; const clear = () => { for (const s of body) EQ[s] = null; EQ.back = null; invalidateArmorCache(); };
  clear(); _sneaking = true; const sn0 = _sneakDetectMult();
  set(3, 'light').forEach(it => EQ[it.slot] = it); invalidateArmorCache(); const sn5 = _sneakDetectMult();
  clear(); EQ.head = mk(3, 'light', 'head'); EQ.chest = mk(3, null, 'chest'); invalidateArmorCache(); const sn1 = _sneakDetectMult(); _sneaking = false; const snOff = _sneakDetectMult();
  clear(); const m0 = effMaxMana(); set(5, 'robe').forEach(it => EQ[it.slot] = it); invalidateArmorCache(); const m5 = effMaxMana();
  clear(); set(5, null).forEach(it => EQ[it.slot] = it); invalidateArmorCache(); const mH = effMaxMana();
  const mage = ARMOR_ENCHANTS.find(e => e.id === 'magic_boost').apply({ tier: 5 }).maxManaBonus;
  clear(); Object.assign(EQ, wasEQ); invalidateArmorCache();
  // equipping: the gate is the line's attribute
  const fin = ATTRS.finesse, intl = ATTRS.intelligence, fort = ATTRS.fortitude; ATTRS.finesse = 10; ATTRS.intelligence = 0; ATTRS.fortitude = 0;
  const gate = { light4: canEquip(mk(4, 'light', 'chest')).ok, robe4: canEquip(mk(4, 'robe', 'chest')), heavy4: canEquip(mk(4, null, 'chest')).ok };
  ATTRS.finesse = fin; ATTRS.intelligence = intl; ATTRS.fortitude = fort;
  // loot: the share of body pieces by line, and no robe boots
  const lv = level; level = 20; const cnt = { heavy: 0, light: 0, robe: 0, robeFeet: 0, other: 0 };
  withLootRng(seededRng('armourlines', 1), () => { for (let i = 0; i < 20000; i++) { const it = rollLoot({ hp: 2 }, null, 'chest');
    if (!it || it.type !== 'equip' || it.atk || it.cloak || !['head', 'chest', 'hands', 'legs', 'feet'].includes(it.slot)) continue;
    cnt[it.line || 'heavy']++; if (it.line === 'robe' && it.slot === 'feet') cnt.robeFeet++; } });
  // a seeded container rolls the same thing twice
  const k1 = JSON.stringify(rollContainerLoot('treasure', { hp: 2 }, null, 1, 'al:1').map(i => i.name)), k2 = JSON.stringify(rollContainerLoot('treasure', { hp: 2 }, null, 1, 'al:1').map(i => i.name));
  level = lv;
  // the counters
  const dun = WORLD.settle.get('dunmore');
  const arm = armorLinesFor(dun.houses.find(h => h.type === 'armor')).map(i => i.name), goods = armorLinesFor(dun.houses.find(h => h.type === 'misc')).map(i => i.name);
  const smith = armorLinesFor(dun.houses.find(h => h.type === 'weapon')).length, guild = armorLinesFor(dun.houses.find(h => h.type === 'guild_m')).length;
  // the save: a light piece and a robe in the bag and worn come back with their line, weight, price and gate
  const pieces = [mk(4, 'light', 'legs'), mk(6, 'robe', 'chest')];
  const back = pieces.map(p => { const s = JSON.parse(JSON.stringify(_serItem(p))); return _restoreEnchant(s); });
  return { sets, priceRatio, low, sn0, sn5, sn1, snOff, m0, m5, mH, mage, gate, cnt, k1, same: k1 === k2, arm, goods, smith, guild, pieces, back };
});
console.log(JSON.stringify(r).slice(0, 3000));
const S = r.sets;
check('light: 60% of the heavy set\'s defence (rounded by piece) at 40% of its weight, a set of five weighs 8',
  S.light3.w === 8 && S.heavy3.w === 20 && Math.abs(S.light5.def / S.heavy5.def - .6) < .15 && S.light5.def < S.heavy5.def, { h3: S.heavy3, l3: S.light3, h5: S.heavy5, l5: S.light5 });
check('robes: four pieces (no boots) at a quarter of the heavy weight and about a quarter of the defence', S.robe5.n === 4 && S.robe5.w === 4.5 && S.robe5.def < S.light5.def && S.robe5.def >= 4, S.robe5);
check('the gates: Finesse for light, Intelligence for robes, on the heavy line\'s curve', S.light3.req.join() === 'finesse 5' && S.robe5.req.join() === 'intelligence 16' && S.heavy5.req.join() === 'fortitude 16' && r.low.light === null, { l: S.light3.req, r: S.robe5.req, h: S.heavy5.req });
check('prices: light 90% and robes 100% of the heavy piece', Math.abs(r.priceRatio.light - .9) < .01 && Math.abs(r.priceRatio.robe - 1) < .01, r.priceRatio);
check('a light piece worn: 3% harder to notice while sneaking, five 15%; nothing when walking', Math.abs(r.sn5 / r.sn0 - .85) < 1e-9 && Math.abs(r.sn1 / r.sn0 - .97) < 1e-9 && r.snOff === 1, { sn0: r.sn0, sn1: r.sn1, sn5: r.sn5 });
check('robes: 3 max mana a tier a piece (a Mithril set +60, one of the Mage enchant 50); heavy nothing', r.m5 - r.m0 === 60 && r.mH === r.m0 && r.mage === 50, { m0: r.m0, m5: r.m5, mH: r.mH });
check('equipping by the line\'s attribute: Finesse 10 wears a Steel jerkin, not Steel plate or a Steel robe', r.gate.light4 && !r.gate.heavy4 && !r.gate.robe4.ok && /Intelligence 10/.test(r.gate.robe4.msg), r.gate);
const tot = r.cnt.heavy + r.cnt.light + r.cnt.robe;
check('loot: a body piece is heavy about half the time, light and robes a quarter each less the robe boots, never a robe boot',
  tot > 2000 && Math.abs(r.cnt.heavy / tot - .5) < .04 && Math.abs(r.cnt.light / tot - .3) < .04 && Math.abs(r.cnt.robe / tot - .2) < .04 && r.cnt.robeFeet === 0, { ...r.cnt, tot });
check('a keyed container still rolls the same', r.same, r.k1);
check('the armourer sells the light line, a goods shop and the Mages\' Guild robes; the smith none', r.arm.length === 5 && r.arm.includes('Iron Jerkin') && r.goods.length === 4 && r.goods.includes('Iron Robe') && r.smith === 0 && r.guild === 4, { arm: r.arm, goods: r.goods, guild: r.guild });
check('serialised and restored, a piece keeps its line, weight, defence and price', r.back.every((b, i) => b.line === r.pieces[i].line && b.weight === r.pieces[i].weight && b.def === r.pieces[i].def && b.buyPrice === r.pieces[i].buyPrice), r.back.map(b => [b.name, b.line, b.weight, b.def, b.buyPrice]));
// 2. a real save and load through the slot: the migrations used to read every piece as heavy plate of its slot
const L = await page.evaluate(async () => {
  const H = s => ARMOR_TYPES.find(t => t.slot === s);
  const was = { legs: EQ.legs, chest: EQ.chest, back: EQ.back }, at = { ...ATTRS }; ATTRS.finesse = 12; ATTRS.intelligence = 20;
  EQ.legs = makeItem(4, lineType('light', 'legs'), null, true); EQ.chest = makeItem(5, lineType('robe', 'chest'), null, true);
  EQ.back = makeCloak('fur', 6, ARMOR_ENCHANTS.find(e => e.id === 'cloak_vigor'));
  BAG.push(makeItem(3, lineType('light', 'feet'), null, true));
  const before = [EQ.legs, EQ.chest, EQ.back, BAG[BAG.length - 1]].map(i => [i.name, i.line, i.weight, i.buyPrice, i.reqAttr, i.reqVal]);
  const d = JSON.parse(ssStringify(_buildSavePayload())); _applyLoadData(d);
  const bi = BAG.find(i => i.name === before[3][0]);
  const after = [EQ.legs, EQ.chest, EQ.back, bi].map(i => i && [i.name, i.line, i.weight, i.buyPrice, i.reqAttr, i.reqVal]);
  Object.assign(EQ, was); Object.assign(ATTRS, at); invalidateArmorCache(); return { before, after };
}).catch(e => ({ err: String(e) }));
console.log(JSON.stringify(L));
check('through a save slot: light, robe, an enchanted cloak and a bagged piece keep weight, price and gate', !L.err && JSON.stringify(L.before) === JSON.stringify(L.after), L);
// 3. the Mages' Guild's counter (S566): in the hall, the head's *Browse your wares.* opens a counter of the four robes alone
await page.evaluate(() => { const S = WORLD.settle.get('dunmore'); goToInterior(S.houses.find(h => h.type === 'guild_m')); });
await page.waitForFunction(() => typeof currentHouse !== 'undefined' && currentHouse && currentHouse.type === 'guild_m', null, { timeout: 60000 });
await page.waitForTimeout(1500);
const G = await page.evaluate(async () => {
  openDialog(currentHouse.dlg); const labels = [...document.querySelectorAll('#dlg-choices > *')].map(x => x.textContent.trim().replace(/^\d+\.\s*/, ''));
  const b = [...document.querySelectorAll('#dlg-choices > *')].find(x => /Browse your wares/.test(x.textContent)); if (b) b.click();
  await new Promise(r => setTimeout(r, 400));
  const rows = [...document.querySelectorAll('#sh-stock .sh-name-text')].map(x => x.textContent);
  const open = shopOpen; if (shopOpen) closeShop(); return { labels, open, rows };
});
console.log(JSON.stringify(G));
check('the Mages\' Guild: its head offers Browse your wares., and the counter holds the four robes and nothing of a goods shop\'s', G.labels.includes('Browse your wares.') && G.open && G.rows.length === 4 && G.rows.every(n => / (Cowl|Robe|Wraps|Under-robe)$/.test(n)), G);
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
