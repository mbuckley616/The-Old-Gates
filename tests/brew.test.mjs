// Survival B, session 1: herbs and brewing (Session 1483; `docs/design/survival-build.md`). The pool: every herb has four
// effects, every effect sits on 4 to 10 herbs (was 4 to 7 until the islands' twenty, Michael's A on #1202, Session 1939),
// no two herbs share more than two. A brew: two herbs, every effect both carry, at the Alchemy curve's ×0.64 / ×1.0 / ×1.4;
// no shared effect keeps the herbs and marks the pair; a tincture five days old is at half; a harmful shared effect is a
// poison on the blade for three blows. The page opens from the mortar and grinds.
import { boot, check } from './lib/game.mjs';
const g = await boot(); const { page } = g;
await g.intoWorld();
const r = await page.evaluate(() => {
  const out = {};
  // ── the pool ──
  ensureSeaHerbs();
  const keys = Object.keys(HERB_DEF); out.herbs = keys.length; out.missing = keys.filter(k => !HERB_FX[k]);
  out.four = keys.filter(k => HERB_FX[k] && new Set(HERB_FX[k]).size !== 4);
  const c = {}; Object.keys(ALCH_FX).forEach(f => c[f] = 0); keys.forEach(k => (HERB_FX[k] || []).forEach(f => c[f]++));
  out.counts = c; out.unknownFx = keys.flatMap(k => (HERB_FX[k] || []).filter(f => !ALCH_FX[f]));
  let most = 0; for (let i = 0; i < keys.length; i++) for (let j = i + 1; j < keys.length; j++) most = Math.max(most, HERB_FX[keys[i]].filter(f => HERB_FX[keys[j]].includes(f)).length);
  out.most = most;
  // ── brewing ──
  BAG.length = 0; worldState.herbsKnown = null; for (const k in HERB_CONSUME_COUNTS) delete HERB_CONSUME_COUNTS[k];
  ATTRS.intelligence = 0; const herb = (k, n = 5) => bagAdd({ ...HERB_DEF[k].item, qty: n, _typeKey: k });
  ['firemoss', 'silverleaf', 'thornberry', 'heartroot', 'briarweed', 'wolfsbane'].forEach(k => herb(k));
  out.noMortar = brewHerbs(['firemoss', 'silverleaf']).why;
  bagAdd({ ...MORTAR_ITEM });
  const S = lv => { SKILLS.alchemy = { lv, p: 0 }; };
  S(5); const p0 = SKILLS.alchemy.p;
  const a = brewHerbs(['firemoss', 'silverleaf']);
  out.a = { made: a.made, name: a.item && a.item.name, s: a.item && a.item.brew.s, learnt: a.learnt, firemoss3: herbFxKnown('firemoss', 3), silverleaf1: herbFxKnown('silverleaf', 1), uses: SKILLS.alchemy.p - p0 };
  out.left = { firemoss: BAG.find(b => herbKeyOf(b) === 'firemoss').qty, silverleaf: BAG.find(b => herbKeyOf(b) === 'silverleaf').qty };
  S(50); out.s50 = brewHerbs(['firemoss', 'thornberry']).item.brew.s;
  S(100); const h = brewHerbs(['firemoss', 'thornberry']).item; out.s100 = h.brew.s; out.h = h.name;
  out.stacks = BAG.filter(b => b.brew && b.name === h.name).length; out.qty = h.qty;
  PHP = 10; drinkBrew(h.brew.fx, h.brew.s, h.name); out.healed = PHP - 10;
  const before = BAG.find(b => herbKeyOf(b) === 'heartroot').qty;
  const n = brewHerbs(['firemoss', 'heartroot']);
  out.none = { made: n.made, why: n.why, kept: BAG.find(b => herbKeyOf(b) === 'heartroot').qty === before, marked: !!herbsKnown().none[brewPairKey('firemoss', 'heartroot')] };
  S(74); const t = BAG.find(b => b.brew && b.name === h.name); out.fresh = brewStrength(t); t.brew.day = gameDayNow() - 5; out.turned = brewStrength(t);
  S(75); out.stoppered = brewStrength(t);
  // ── Alchemy's perks (S1499): Tell, Third hand, Double measure (Stoppered above) ──
  out.perks = {};
  S(49); out.perks.three49 = brewHerbs(['firemoss', 'silverleaf', 'thornberry']).why;
  S(50); const th = brewHerbs(['firemoss', 'silverleaf', 'thornberry']); out.perks.three50 = th.made && th.item.brew.fx.slice().sort().join(',');
  S(99); out.perks.n99 = brewHerbs(['firemoss', 'silverleaf']).n;
  herb('firemoss', 1); herb('silverleaf', 1); S(100); const dm = brewHerbs(['firemoss', 'silverleaf']); out.perks.n100 = dm.n; out.perks.q100 = dm.item && dm.item.qty;
  const eat = (k, n) => { for (let i = 0; i < n; i++) { herb(k, 1); useHerb(BAG.findIndex(b => b.type === 'herb' && herbKeyOf(b) === k)); } };
  const flashes = k => (window._logS1499 || []).filter(t => t.includes('hidden effect unlocked')).length;
  const _al = addLog; window._logS1499 = []; addLog = (a, t) => { window._logS1499.push(t); return _al(a, t); };
  try {
    S(24); eat('muirfhear', 5); out.perks.tell24 = herbFxKnown('muirfhear', 1);
    S(25); eat('shadowcap', 4); out.perks.tell4 = herbFxKnown('shadowcap', 1); eat('shadowcap', 1); out.perks.tell5 = herbFxKnown('shadowcap', 1);
    eat('shadowcap', 3); eat('muirfhear', 1); out.perks.tellLate = herbFxKnown('muirfhear', 1); out.perks.flashes = flashes();
    S(5); for (const k in HERB_CONSUME_COUNTS) delete HERB_CONSUME_COUNTS[k]; herbsKnown().told = {}; window._logS1499 = [];
    eat('firemoss', 14); out.perks.base14 = herbFxKnown('firemoss', 1); eat('firemoss', 1); out.perks.base15 = herbFxKnown('firemoss', 1); eat('firemoss', 2); out.perks.baseFlashes = flashes();
  } finally { addLog = _al; }
  // ── a poison ──
  S(50); const ps = brewHerbs(['briarweed', 'wolfsbane']).item;
  out.poison = { name: ps.name, fx: ps.brew.fx, poison: ps.brew.poison };
  EQ.weapon = makeItem(1, WEAPON_TYPES.find(w => w.type === 'Sword'), null, false);
  useTincture(BAG.indexOf(ps)); out.coat = BLADE_POISON && BLADE_POISON.blows;
  const foe = { name: 'Bandit', hp: 100, maxHp: 100, posture: 40, maxPosture: 40 };
  bladePoisonHit(foe); bladePoisonHit(foe); bladePoisonHit(foe);
  out.foe = { hp: foe.hp, slowed: foeSlowMult(foe), spent: BLADE_POISON === null };
  // ── the save ──
  const ser = _serItem(t); out.ser = !!(ser.brew && ser.brew.fx.length && ser.brewKey); out.charKey = !!SS_CHAR_WS.herbsKnown;
  // ── the page ──
  herb('firemoss', 2); herb('silverleaf', 2); brewSel = [];
  openBrewPage(); out.open = brewOpen && document.getElementById('brewui').style.display === 'flex';
  out.rows = document.querySelectorAll('#br-herbs [data-k]').length;
  brewPick('firemoss'); brewPick('silverleaf'); out.right = document.getElementById('br-right').textContent;
  const nb = BAG.filter(b => b.brew).length; brewGo(); out.ground = BAG.filter(b => b.brew).length - nb; out.said = document.getElementById('br-said').textContent;
  window.dispatchEvent(new KeyboardEvent('keydown', { code: 'Escape' })); out.closed = !brewOpen;
  return out;
});
console.log(JSON.stringify(r));
// S1939 — the Mark's nine and Aurenne's eleven (#1202 A): each by its island, eaten as its first effect, not in a Gatelands chest
const isl = await page.evaluate(() => {
  const o = {}; const keys = Object.keys(ISLAND_HERB);
  o.n = keys.length; o.mark = keys.filter(k => HERB_DEF[k].island === 'mark').length; o.aurenne = keys.filter(k => HERB_DEF[k].island === 'aurenne').length;
  o.prices = keys.map(k => HERB_DEF[k].item.buyPrice); o.first = keys.every(k => HERB_FX[k][0] === ISLAND_HERB[k].fx[0]);
  o.mesh = keys.every(k => PLANT_KIND[k] && typeof plantGeo === 'function' && !!plantGeo(k, false));
  const seen = new Set(); for (let i = 0; i < 600; i++) { const h = randomLootHerb(); if (h) seen.add(h.name); } o.loot = keys.filter(k => seen.has(HERB_DEF[k].name));
  BAG.length = 0; ACTIVE_BUFFS.length = 0; const eat = k => { bagAdd({ ...HERB_DEF[k].item, qty: 1, _typeKey: k }); useHerb(BAG.findIndex(b => herbKeyOf(b) === k)); };
  eat('icebloom'); o.cold = _hasBuff('resistCold'); o.warm = typeof warmthNow === 'function' ? warmthNow().by.join(',') : '';
  eat('sandlotus'); o.heat = _hasBuff('resistHeat');
  PHP = 50; eat('drakesage'); o.drake = 50 - PHP;
  const hp = PHP, n = ACTIVE_BUFFS.length; eat('glacierlily'); o.lily = PHP === hp && ACTIVE_BUFFS.length === n; o.lilyKnown = herbFxKnown('glacierlily', 0);
  o.byName = herbKeyOf({ name: 'Desert Truffle', type: 'herb' });
  bagAdd({ ...MORTAR_ITEM }); bagAdd({ ...HERB_DEF.icebloom.item, qty: 2, _typeKey: 'icebloom' }); bagAdd({ ...HERB_DEF.snowthyme.item, qty: 2, _typeKey: 'snowthyme' });
  const b = brewHerbs(['icebloom', 'snowthyme']); o.brew = b.item && b.item.name;
  return o; });
console.log(JSON.stringify(isl));
check(`the islands' twenty: ${isl.mark} of the Mark, ${isl.aurenne} of Aurenne, priced ${Math.min(...isl.prices)}–${Math.max(...isl.prices)}, the first effect the atlas's, each with a mesh`, isl.n === 20 && isl.mark === 9 && isl.aurenne === 11 && isl.prices.every(p => p >= 6 && p <= 40) && isl.first && isl.mesh, isl);
check(`none of them in a chest on the Gatelands, where the suite stands (${isl.loot.length} of 600 draws; S1940: each grows on its own island)`, isl.loot.length === 0, isl);
check(`eaten: Icebloom gives Resist Cold, warmth "${isl.warm}"; Sandlotus Resist Heat; Drakesage −${isl.drake} HP; Glacier Lily nothing, Slow known`, isl.cold && /Resist Cold/.test(isl.warm) && isl.heat && isl.drake === 10 && isl.lily && isl.lilyKnown, isl);
check(`a reloaded herb found by its name (${isl.byName}); Icebloom and Snowthyme ground: ${isl.brew}`, isl.byName === 'deserttruffle' && isl.brew === 'Tincture of Resist Cold', isl);
const C = r.counts, over = Object.keys(C).filter(f => C[f] < 4 || C[f] > 10);
check(`the pool: ${r.herbs} herbs, each four effects of the 22`, r.herbs === 50 && /* S1886 — the three plants that mark a gate; S1896 — Caverglow; S1939 — the islands' twenty */ !r.missing.length && !r.four.length && !r.unknownFx.length && Object.keys(C).length === 22);
check(`every effect on 4 to 10 herbs (Restore Health ${C.restoreHealth}, Restore Mana ${C.restoreMana}); no two herbs share more than ${r.most}`, !over.length && r.most <= 2, { over, C });
check(`no mortar, no brew: "${r.noMortar}"`, /mortar/.test(r.noMortar || ''));
check(`Firemoss and Silverleaf: ${r.a.name}, ×${r.a.s} at Alchemy 5; Swiftness learnt on both; ${r.a.uses} Alchemy points`, r.a.made && r.a.name === 'Tincture of Swiftness' && Math.abs(r.a.s - .64) < .01 && r.a.firemoss3 && r.a.silverleaf1 && r.a.uses > 0, r.a);
check(`one of each herb ground (${r.left.firemoss}, ${r.left.silverleaf} left of 5)`, r.left.firemoss === 4 && r.left.silverleaf === 4, r.left);
check(`strength ×${r.s50} at 50, ×${r.s100} at 100; ${r.h} drunk at 100 heals ${r.healed} (20 × 1.4)`, Math.abs(r.s50 - 1) < .01 && Math.abs(r.s100 - 1.4) < .01 && r.healed === 28);
check(`a Restore Health at ×1.0 and one at ×1.4 are two stacks (${r.stacks}), the bag's own entry returned (${r.qty}: Double measure at 100)`, r.stacks === 2 && r.qty === 2);
check(`Firemoss and Heartroot share nothing: not made, herbs kept, the pair marked ("${r.none.why}")`, !r.none.made && r.none.kept && r.none.marked, r.none);
check(`a tincture five days old works at half (×${r.fresh} → ×${r.turned})`, Math.abs(r.turned - r.fresh / 2) < 1e-9);
check(`Stoppered (Alchemy 75): the same tincture at ×${r.stoppered}, not turned`, Math.abs(r.stoppered - r.fresh) < 1e-9);
check(`Third hand: three herbs refused at 49 ("${r.perks.three49}"), ground at 50 into ${r.perks.three50}`, /Two herbs/.test(r.perks.three49 || '') && r.perks.three50 === 'restoreHealth,swiftness', r.perks);
check(`Double measure: ${r.perks.n99} from a grinding at 99, ${r.perks.n100} at 100`, r.perks.n99 === 1 && r.perks.n100 === 2 && r.perks.q100 === 2, r.perks);
check(`Tell: at 24, 5 eats leave the hidden effect unknown; at 25 not at 4 eats, known at 5; told ${r.perks.flashes} times for two herbs`, !r.perks.tell24 && !r.perks.tell4 && r.perks.tell5 && r.perks.tellLate && r.perks.flashes === 2, r.perks);
check(`without Tell, still 15 eats (${r.perks.base14 ? 'known' : 'not'} at 14, ${r.perks.base15 ? 'known' : 'not'} at 15), told once (${r.perks.baseFlashes})`, !r.perks.base14 && r.perks.base15 && r.perks.baseFlashes === 1, r.perks);
check(`Briarweed and Wolf's Bane: ${r.poison.name}, a poison of the harmful only`, r.poison.poison && r.poison.fx.every(f => ['slow', 'damageHealth'].includes(f)) && r.poison.fx.length === 2, r.poison);
check(`the poison coats the blade for ${r.coat} blows: a foe at ${r.foe.hp} of 100, slowed ×${r.foe.slowed}, then spent`, r.coat === 3 && r.foe.hp === 76 && r.foe.slowed === .6 && r.foe.spent, r.foe);
check('a tincture keeps its brew through the save, and herbsKnown is the character\'s', r.ser && r.charKey);
check(`the page: ${r.rows} herbs listed, two chosen, ground (${r.ground} made: "${r.said}"), Esc closes`, r.open && r.rows >= 6 && /Firemoss/.test(r.right) && r.ground === 1 && r.closed);
// ── S2157: the field guide (Michael's B on #1463, session 1): first picks, rarity, the book drawn live, the apothecary's copy ──
const fg = await page.evaluate(() => {
  const o = {}; worldState.herbsKnown = null; for (const k in HERB_CONSUME_COUNTS) delete HERB_CONSUME_COUNTS[k]; BAG.length = 0;
  SKILLS.alchemy = { lv: 60, p: 0 }; SKILL_LAST.clear();
  const pick = k => { const h = { type: k, def: HERB_DEF[k], g: { userData: {}, visible: true }, gl: { intensity: 1 } }; const p0 = SKILLS.alchemy.p; SKILL_LAST.clear(); harvestHerb(h); return Math.round((SKILLS.alchemy.p - p0) * 100) / 100; };
  o.first = pick('firemoss'); o.second = pick('firemoss'); o.seen = plantSeen('firemoss'); o.unseen = plantSeen('silverleaf');
  o.rar = { firemoss: herbRarity('firemoss'), heartroot: herbRarity('heartroot'), pineresin: herbRarity('pineresin'), wolfsbane: herbRarity('wolfsbane'), gateresin: herbRarity('gateresin'), kelp: herbRarity('kelp') };
  o.where = herbWhere('firemoss'); o.whereMark = herbWhere('icebloom');
  const C = fieldGuideCount(); o.count = C;
  const pages = BOOKS.find(b => b.id === 'field_guide').pages; o.pages = pages.length; o.head = pages[0];
  const all = pages.join('\n'); o.frames = (all.match(/an empty frame/g) || []).length; o.hasFire = /Firemoss — Common/.test(all); o.noSilver = !/Silverleaf/.test(all);
  o.fxLine0 = herbFxLine('firemoss'); HERB_CONSUME_COUNTS.firemoss = 1; o.fxLine = herbFxLine('firemoss'); delete HERB_CONSUME_COUNTS.firemoss;
  // an old save: no seen, but eaten and carried herbs count, with no marks
  BAG.length = 0; worldState.herbsKnown = { fx: {}, none: {} }; HERB_CONSUME_COUNTS.thornberry = 2; bagAdd({ ...HERB_DEF.icebloom.item, qty: 1, _typeKey: 'icebloom' });
  o.old = { thorn: plantSeen('thornberry'), ice: plantSeen('icebloom'), fire: plantSeen('firemoss') };
  const sh = { type: 'potion' }; o.stock = fieldGuideFor(sh).map(i => [i.name, i.buyPrice, i.type]); o.smith = fieldGuideFor({ type: 'weapon' }).length;
  BAG.push(fieldGuideFor(sh)[0]); openBookReader(BAG.length - 1); o.title = document.getElementById('book-title').textContent; o.page = document.getElementById('book-page').textContent.slice(0, 40);
  if (typeof closeBookReader === 'function') closeBookReader(); else document.getElementById('book-overlay').style.display = 'none';
  o.charKey = SS_CHAR_WS.herbsKnown === 1; o.specN = Object.keys(SPEC_DEF).length;
  return o; });
console.log(JSON.stringify(fg));
check(`the first Firemoss picked is ${fg.first} Alchemy marks, the second ${fg.second}; it is in the guide, Silverleaf not`, Math.abs(fg.first / fg.second - 10) < .01 && fg.seen && !fg.unseen, fg);
check(`rarity by where it grows: Firemoss ${fg.rar.firemoss}, Heartroot ${fg.rar.heartroot}, Pine Resin ${fg.rar.pineresin}, Wolf's Bane ${fg.rar.wolfsbane}, Gate Resin ${fg.rar.gateresin}, Kelp ${fg.rar.kelp}`,
  fg.rar.firemoss === 'Common' && fg.rar.heartroot === 'Uncommon' && fg.rar.pineresin === 'Rare' && fg.rar.wolfsbane === 'Rare' && fg.rar.gateresin === 'Rare' && fg.rar.kelp === 'Common', fg.rar);
check(`the guide: ${fg.count.n} of ${fg.count.of} found over ${fg.pages} pages, ${fg.frames} empty frames (with ${fg.specN} specimens); Firemoss "${fg.where}", picked "${fg.fxLine0}", eaten "${fg.fxLine}"`,
  fg.count.n === 1 && fg.count.of === 50 && fg.frames === 49 + fg.specN && fg.hasFire && fg.noSilver && /1 of 50 found/.test(fg.head) && /^The Gatelands: /.test(fg.where) && /^The Mark: /.test(fg.whereMark) && fg.fxLine0 === '? · ? · ? · ?' && /^Restore Health · \?/.test(fg.fxLine), fg);
check(`an old save's guide holds what it ate and carries (Thornberry ${fg.old.thorn}, Icebloom ${fg.old.ice}), not the rest`, fg.old.thorn && fg.old.ice && !fg.old.fire, fg.old);
check(`the apothecary sells it at ${fg.stock[0] && fg.stock[0][1]}, the smith not; read: "${fg.title}"`, fg.stock.length === 1 && fg.stock[0][1] === 20 && fg.stock[0][2] === 'book' && fg.smith === 0 && fg.title === 'A Field Guide to the Three Islands' && /^A FIELD GUIDE/.test(fg.page) && fg.charKey, fg);
// ── S2158: the rare specimens (#1463 B, session 2): patches by cell, buds, hours and weathers, a pick that regrows in 7 days ──
const sp0 = await page.evaluate(() => { const o = { per: { gatelands: 0, mark: 0, aurenne: 0 }, kinds: {} };
  for (let j = 0; j < GRID; j++) for (let i = 0; i < GRID; i++) { const L = specCell(i, j); if (!L.length) continue; o.per[nationKeyOf(i, j)] += L.length; L.forEach(p => { o.kinds[p.kind] = (o.kinds[p.kind] || 0) + 1; if (SPEC_DEF[p.kind].island !== nationKeyOf(i, j)) o.wrong = p.id; }); }
  const [ci, cj] = cellOf(px, pz); const a = JSON.stringify(specCell(ci, cj)); SPEC_CELLS.clear(); o.same = a === JSON.stringify(specCell(ci, cj));
  const p = specCell(ci, cj).find(q => q.kind === 'whispercap'); window._tp = p; o.p = !!p; if (p) WORLD.enter(p.x + 1.2, p.z, 0, 'test'); return o; });
console.log(JSON.stringify(sp0));
check(`every kind placed on its own island only (${Object.entries(sp0.kinds).map(([k, n]) => k + ' ' + n).join(', ')}); a cell's patches the same when made again`,
  Object.keys(sp0.kinds).length === 7 && Object.values(sp0.kinds).every(n => n >= 20) && !sp0.wrong && sp0.same && sp0.p, sp0);
await page.waitForTimeout(6000);
const sp = await page.evaluate(() => { const o = {}, p = window._tp, s = SPECS.find(q => q.id === p.id); o.found = !!(s && s.g && s.g.parent); if (!s) return o;
  px = p.x + .8; pz = p.z; const setH = h => { worldState.gameTimeMinutes = Math.round(h * 60) + 1440 * 3; worldState.gameTimeAbsMinutes = worldState.gameTimeMinutes; };
  BAG.length = 0; worldState.herbsKnown = null; SKILLS.alchemy = { lv: 60, p: 0 }; SKILL_LAST.clear();
  setH(12); specShow(s); o.noon = s.shown; interact(); o.bud = { bag: BAG.length, cond: specKnown().cond.whispercap, guide: /Whispercap — Rare \(seen shut\)[^]*It opens at dusk/.test(BOOKS.find(b => b.id === 'field_guide').pages.join('\n')) };
  setH(20); specShow(s); o.dusk = s.shown; const p0 = SKILLS.alchemy.p; interact(); o.pick = { bag: BAG.map(b => b.name + ':' + b.spec).join(), marks: SKILLS.alchemy.p - p0, shown: s.shown, again: specNear() === s };
  worldState.gameTimeAbsMinutes += 6 * 1440; o.day6 = specGone(s); worldState.gameTimeAbsMinutes += 1440; o.day7 = specGone(s);
  const t = () => worldState.gameTimeAbsMinutes; worldState.wxSeen = {};
  WORLD.wx.type = 'rain'; noteWeather(); o.reed = [specOpen('bloodreed')]; WORLD.wx.type = 'clear'; worldState.gameTimeAbsMinutes += 100; o.reed.push(specOpen('bloodreed')); worldState.gameTimeAbsMinutes += 30; o.reed.push(specOpen('bloodreed'));
  WORLD.wx.type = 'storm'; noteWeather(); o.glass = [specOpen('sunglass')]; WORLD.wx.type = 'overcast'; worldState.gameTimeAbsMinutes += 300; o.glass.push(specOpen('sunglass')); worldState.gameTimeAbsMinutes += 100; o.glass.push(specOpen('sunglass'));
  WORLD.wx.cover = .6; o.iron = [specOpen('ironleaf')]; WORLD.wx.cover = .2; o.iron.push(specOpen('ironleaf'));
  setH(23); WORLD.wx.type = 'clear'; o.orchid = [specOpen('moonfenorchid')]; WORLD.wx.type = 'overcast'; o.orchid.push(specOpen('moonfenorchid'));
  o.wxWorld = !SS_CHAR_WS.wxSeen; return o; });
console.log(JSON.stringify(sp));
check(`a Whispercap at noon is a bud (${sp.noon}): E writes "opens at dusk" into the guide and picks nothing`, sp.found && sp.noon === 'bud' && sp.bud.bag === 0 && sp.bud.cond === 1 && sp.bud.guide, sp);
check(`at 20h it is open (${sp.dusk}): picked for ${sp.pick.marks} Alchemy marks (the first), gone, back after 7 days (6: ${sp.day6 ? 'gone' : 'back'}, 7: ${sp.day7 ? 'gone' : 'back'})`,
  sp.dusk === 'open' && sp.pick.bag === 'Whispercap:whispercap' && sp.pick.marks === 10 && sp.pick.shown === 'gone' && !sp.pick.again && sp.day6 && !sp.day7, sp);
check(`the weathers: Bloodreed in rain and 2 h after (${sp.reed}), Sunglass 6 h after a storm (${sp.glass}), Ironleaf under snow (${sp.iron}), Moonfen Orchid at night when clear (${sp.orchid}); the history is the world's`,
  sp.reed.join() === 'true,true,false' && sp.glass.join() === 'false,true,false' && sp.iron.join() === 'true,false' && sp.orchid.join() === 'true,false' && sp.wxWorld, sp);
// ── S2159: the specimens in the mortar (#1463 B, session 3): each a catalyst, one a grinding, spent; learnt by observing, study or experiment ──
const ct = await page.evaluate(() => { const o = {};
  BAG.length = 0; worldState.herbsKnown = null; for (const k in HERB_CONSUME_COUNTS) delete HERB_CONSUME_COUNTS[k]; SKILLS.alchemy = { lv: 50, p: 0 }; ACTIVE_BUFFS.length = 0;
  bagAdd({ ...MORTAR_ITEM }); const herb = (k, n = 5) => bagAdd({ ...HERB_DEF[k].item, qty: n, _typeKey: k }); const sp = (k, n = 1) => bagAdd({ ...specItem(k), qty: n });
  ['firemoss', 'silverleaf', 'thornberry', 'briarweed', 'wolfsbane'].forEach(k => herb(k));
  const plain = brewHerbs(['firemoss', 'silverleaf']).item.brew.s;
  sp('whispercap', 2); o.unknown = specCatLine('whispercap');
  const rv = brewHerbs(['firemoss', 'thornberry'], 'whispercap'); o.reveal = { made: rv.made, all: [0, 1, 2, 3].every(i => herbFxKnown('firemoss', i) && herbFxKnown('thornberry', i)), left: BAG.find(b => b.spec === 'whispercap').qty, catNew: rv.catNew, line: specCatLine('whispercap') };
  sp('moonfenorchid'); o.steep = +(brewHerbs(['firemoss', 'silverleaf'], 'moonfenorchid').item.brew.s / plain).toFixed(3); o.orchidGone = !BAG.some(b => b.spec === 'moonfenorchid');
  o.noCat = brewHerbs(['firemoss', 'silverleaf'], 'moonfenorchid').why;
  sp('bloodreed'); const vn = brewHerbs(['briarweed', 'wolfsbane'], 'bloodreed').item; EQ.weapon = makeItem(1, WEAPON_TYPES.find(w => w.type === 'Sword'), null, false); useTincture(BAG.indexOf(vn)); o.venom = BLADE_POISON && BLADE_POISON.blows; BLADE_POISON = null;
  sp('ironleaf'); const ls = brewHerbs(['firemoss', 'silverleaf'], 'ironleaf').item; o.lastKey = ls.brew.last; drinkBrew(ls.brew.fx, ls.brew.s, ls.name, ls.brew.last); const bf = ACTIVE_BUFFS.find(b => b.label === 'Swiftness'); o.lastS = bf && bf.remaining;
  ACTIVE_BUFFS.length = 0; const pl = BAG.find(b => b.brew && !b.brew.last && b.brew.fx.includes('swiftness')); drinkBrew(pl.brew.fx, pl.brew.s, pl.name); const bf2 = ACTIVE_BUFFS.find(b => b.label === 'Swiftness'); o.plainS = bf2 && bf2.remaining;
  // Clean: a pair sharing a harmful effect and another
  const keys = Object.keys(HERB_FX).filter(k => HERB_DEF[k] && HERB_DEF[k].zone !== 'gate'); let pair = null;
  for (let i = 0; i < keys.length && !pair; i++) for (let j = i + 1; j < keys.length && !pair; j++) { const sh = brewShared([keys[i], keys[j]]); if (sh.poison && sh.all.some(f => !ALCH_FX[f].harm)) pair = [keys[i], keys[j]]; }
  o.pair = pair; pair.forEach(k => herb(k, 2)); o.dirty = brewShared(pair).poison; sp('snowshroom'); const cl = brewHerbs(pair, 'snowshroom'); o.clean = { made: cl.made, poison: cl.item && cl.item.brew.poison, harm: cl.item && cl.item.brew.fx.some(f => ALCH_FX[f].harm), name: cl.item && cl.item.name };
  // observe and study
  o.obs = [specObserve('miragebloom'), specObserve('miragebloom'), specObserve('miragebloom')]; o.obsKnown = specCatKnown('miragebloom');
  sp('sunglass'); o.studyOut = studySpecimen('sunglass').why; const _ii = isInterior, _ch = currentHouse; isInterior = () => true; currentHouse = { type: 'potion' };
  const m0 = worldState.gameTimeAbsMinutes || 0; const st = studySpecimen('sunglass'); isInterior = _ii; currentHouse = _ch;
  o.study = { done: st.done, said: st.said, mins: (worldState.gameTimeAbsMinutes || 0) - m0, spent: !BAG.some(b => b.spec === 'sunglass'), known: specCatKnown('sunglass') };
  // the page
  sp('ironleaf'); herb('firemoss', 1); herb('silverleaf', 1); openBrewPage(); brewSel = ['firemoss', 'silverleaf']; brewDraw(); const row = document.querySelector('#brewui [data-c="ironleaf"]'); o.row = row && row.textContent;
  if (row) row.click(); o.sel = brewCat; brewGo(); o.said = document.querySelector('#br-said').textContent; o.spent = !BAG.some(b => b.spec === 'ironleaf'); closeBrewPage();
  return o; });
console.log(JSON.stringify(ct));
check(`Revealing (the Whispercap, unknown until used: "${ct.unknown}"): Firemoss and Thornberry learn all four each; the specimen spent (${ct.reveal.left} of 2 left), learnt by the grinding: "${ct.reveal.line}"`,
  ct.unknown === '— unknown —' && ct.reveal.made && ct.reveal.all && ct.reveal.left === 1 && ct.reveal.catNew && /^Revealing/.test(ct.reveal.line), ct.reveal);
check(`Steeping (the Moonfen Orchid): strength ×${ct.steep}; none left, none used: "${ct.noCat}"`, ct.steep === 1.25 && ct.orchidGone && /specimen/.test(ct.noCat || ''), ct);
check(`Venom (Bloodreed): the poison coats for ${ct.venom} blows; Lasting (Ironleaf): Swiftness for ${ct.lastS} s against ${ct.plainS}`, ct.venom === 6 && ct.lastKey === 2 && ct.lastS === 2 * ct.plainS && ct.plainS === 60, ct);
check(`Clean (Snowshroom): ${ct.pair.join(' and ')} make a poison bare, with it "${ct.clean.name}", nothing harmful`, ct.dirty && ct.clean.made && !ct.clean.poison && !ct.clean.harm, ct.clean);
check(`observed: the third open Miragebloom picked teaches it (${ct.obs}); study: refused with no table, an hour at the apothecary's (${ct.study.mins} min), one spent: "${ct.study.said}"`,
  ct.obs.join() === 'false,false,true' && ct.obsKnown && /table/.test(ct.studyOut || '') && ct.study.done && ct.study.mins === 60 && ct.study.spent && ct.study.known, ct);
check(`the page offers the Ironleaf under the herbs, chosen and ground: "${ct.said}"`, /Ironleaf/.test(ct.row || '') && ct.sel === 'ironleaf' && /Swiftness/.test(ct.said) && ct.spent, ct);
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
