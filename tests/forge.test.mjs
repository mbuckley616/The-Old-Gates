// Survival B, session 5: the forge (Session 1494; `docs/design/survival-build.md`, Michael's A on #781). A smith's room is a
// forge, 5 gold a use. 2 ore make an ingot (bronze from a copper and a tin, steel from 2 iron ore and a charcoal); a piece
// takes its type's ingots and 30 game-minutes, gated by Smithing at the metal's SKILL_GATE (Iron 15). A made piece is never
// enchanted, carries `made` and sells back at 20%. A temper is 3 ore of its metal, +8%, three to a piece; the smith does it
// for 20 gold × tier.
import { boot, check } from './lib/game.mjs';
import { enterDungeon } from './lib/dungeonshot.mjs';
const g = await boot(); const { page } = g;
await g.intoWorld();
const r = await page.evaluate(() => {
  const out = {};
  BAG.length = 0; gold = 500;
  const S = lv => { SKILLS.smithing = { lv, p: 0 }; };
  const lid0 = lid, h0 = currentHouse;
  // ── no forge outdoors, nor in an inn ──
  bagAdd(oreItem('iron', 2)); out.outdoors = forgeSmelt(3).why;
  lid = 'int_test'; currentHouse = { type: 'inn', name: 'The Inn', keeper: 'Ma', tagline: '' }; out.inn = forgeHere();
  currentHouse = { type: 'weapon', name: 'The Forge', keeper: 'Bram', tagline: '"Iron."' }; out.smithy = forgeHere();
  // ── smelting ──
  S(14); const p0 = SKILLS.smithing.p, g0 = gold;
  const s1 = forgeSmelt(3); out.smelt = { made: s1.made, name: s1.item && s1.item.name, w: s1.item && s1.item.weight, ore: bagCount(b => b.ore === 'iron'), use: SKILLS.smithing.p - p0, fee: g0 - gold };
  out.noOre = forgeSmelt(3).why;
  bagAdd(oreItem('copper', 1)); bagAdd(oreItem('tin', 1)); const br = forgeSmelt(2); out.bronze = br.made && br.item.name;
  bagAdd(oreItem('iron', 2)); out.steelNoCoal = forgeSmelt(4).why; bagAdd(survItem('charcoal', 1));
  const st = forgeSmelt(4); out.steel = st.made && st.item.name; out.coalLeft = bagCount(b => b.name === 'Charcoal');
  out.silver = !INGOT_DEF.some(d => MATERIALS[d.tier - 1].name === 'Silver');
  // ── the gate: an Iron sword at 14 refused, at 15 made ──
  bagAdd(ingotItem(3, 3)); const ing0 = bagCount(b => b.ingot === 3);
  // S1518 — a weapon takes a plank for its grip: refused without one, then given one
  S(15); out.noPlank = forgeMake('Sword', 3).why; out.noPlankKept = bagCount(b => b.ingot === 3) === ing0; bagAdd(benchItem('plank', 1)); S(14);
  out.gate14 = forgeMake('Sword', 3).why; out.ingotsKept = bagCount(b => b.ingot === 3) === ing0;
  S(15); const t0 = gameMinNow(), g1 = gold;
  const mk = forgeMake('Sword', 3), sw = mk.item; out.plankUsed = plankCount() === 0;
  out.make = { made: mk.made, name: sw && sw.name, flag: sw && sw.made, ench: !!(sw && (sw.enchant || sw.enchantId)), ingots: ing0 - bagCount(b => b.ingot === 3),
    mins: Math.round(gameMinNow() - t0), use: SKILLS.smithing.p + (SKILLS.smithing.lv > 15 ? skillCost(15) : 0), fee: g1 - gold };
  const found = makeItem(3, WEAPON_TYPES.find(t => t.type === 'Sword'), null, false);
  out.sale = { made: sellPrice(sw), buy: sw.buyPrice, found: sellPrice(found), atkSame: sw.atk.join() === found.atk.join() };
  out.need = { dagger: forgeIngots(WEAPON_TYPES.find(t => t.type === 'Dagger')), claymore: forgeIngots(WEAPON_TYPES.find(t => t.type === 'Claymore')),
    buckler: forgeIngots(ARMOR_TYPES.find(t => t.type === 'Buckler')), helm: forgeIngots(ARMOR_TYPES.find(t => t.type === 'Helmet')),
    chest: forgeIngots(ARMOR_TYPES.find(t => t.type === 'Cuirass')), legs: forgeIngots(ARMOR_TYPES.find(t => t.type === 'Greaves')),
    feet: forgeIngots(ARMOR_TYPES.find(t => t.type === 'Boots')), hands: forgeIngots(ARMOR_TYPES.find(t => t.type === 'Gauntlets')) };
  out.noBows = !FORGE_TYPES.some(f => /Bow|Crossbow|GreatClub|Ring|Amulet/.test(f.T.type));
  out.oneIngotShort = forgeMake('Cuirass', 3).why;
  // ── tempering ──
  const a0 = sw.atk.slice(); bagAdd(oreItem('iron', 2)); out.temperShort = forgeTemper(sw).why;
  bagAdd(oreItem('iron', 7)); const t1 = forgeTemper(sw); out.t1 = { done: t1.done, atk: sw.atk.slice(), ore: bagCount(b => b.ore === 'iron') };
  forgeTemper(sw); const g2 = gold; const t3 = forgeTemper(sw, true); out.t3 = { done: t3.done, tempers: sw.tempers, atk: sw.atk.slice(), paid: g2 - gold };
  out.t4 = forgeTemper(sw).why; out.a0 = a0;
  // ── the save keeps a made, tempered piece ──
  const d = JSON.parse(ssStringify(_buildSavePayload()));
  BAG.length = 0; _applyLoadData(d);
  const back = BAG.find(b => b.made); out.reload = back && { name: back.name, tempers: back.tempers, atk: back.atk, sale: sellPrice(back) };
  out.oreBack = BAG.some(b => b.ore === 'iron') && BAG.some(b => b.ingot === 3);
  // ── Smithing's perks (S1495) ──
  lid = 'int_test'; currentHouse = { type: 'weapon', name: 'The Forge', keeper: 'Bram', tagline: '"Iron."' }; gold = 500; BAG.length = 0; worldState.masterworks = [];
  const P = {}; S(24); bagAdd(oreItem('iron', 3)); forgeSmelt(3); P.smelt24 = { ingots: bagCount(b => b.ingot === 3), ore: bagCount(b => b.ore === 'iron') };
  BAG.length = 0; S(25); bagAdd(oreItem('iron', 3)); forgeSmelt(3); P.smelt25 = { ingots: bagCount(b => b.ingot === 3), ore: bagCount(b => b.ore === 'iron') };
  bagAdd(oreItem('iron', 2)); forgeSmelt(3); P.smelt25two = bagCount(b => b.ingot === 3);
  bagAdd(oreItem('copper', 2)); bagAdd(oreItem('tin', 1)); forgeSmelt(2); P.bronze = { ingots: bagCount(b => b.ingot === 2), cu: bagCount(b => b.ore === 'copper'), sn: bagCount(b => b.ore === 'tin') };
  BAG.length = 0; bagAdd(ingotItem(3, 12)); bagAdd(benchItem('plank', 4)); const base = makeItem(3, WEAPON_TYPES.find(t => t.type === 'Sword'), null, false);
  S(49); P.plain = forgeMake('Sword', 3).item.name;
  S(50); const fine = forgeMake('Sword', 3).item; P.fine = { name: fine.name, atk: fine.atk, base: base.atk, q: fine.quality };
  S(74); P.max74 = temperMax(); S(75); P.max75 = temperMax();
  S(100); const dg = makeItem(3, WEAPON_TYPES.find(t => t.type === 'Dagger'), null, false);
  const m1 = forgeMake('Dagger', 3).item, m2 = forgeMake('Dagger', 3).item;
  P.master = { a: m1.name, aAtk: m1.atk, b: m2.name, bAtk: m2.atk, base: dg.atk, kept: (worldState.masterworks || []).slice() };
  const d2 = JSON.parse(ssStringify(_buildSavePayload())); BAG.length = 0; _applyLoadData(d2);
  const fb2 = BAG.find(b => b.quality === 'fine' && b.weaponType === 'Sword'); P.reload = fb2 && { name: fb2.name, atk: fb2.atk, kept: (worldState.masterworks || []).slice() };
  P.charKey = !!SS_CHAR_WS.masterworks;
  out.perks = P;
  // ── S2551: the forge by grade (workstations A, #1883 C): a village's smith to Steel, a town's to Obsidian, 8–10 a city's great forge ──
  const G = {}; lid = 'int_test'; gold = 500; BAG.length = 0; S(100);
  currentHouse = { type: 'weapon', name: 'The Forge', keeper: 'Bram', tagline: '', siteKind: 'village' };
  G.vil = { grade: forgeGrade(), max: forgeMax() };
  bagAdd(oreItem('iron', 2)); bagAdd(survItem('charcoal', 1)); G.vilSteel = forgeSmelt(4).made;
  bagAdd(oreItem('mithril', 2)); const gv0 = gold; G.vilMith = forgeSmelt(5).why; G.vilKept = oreCount('mithril') === 2 && gold === gv0;
  bagAdd(ingotItem(5, 4)); bagAdd(benchItem('plank', 2)); G.vilMake = forgeMake('Sword', 5).why; G.vilTool = forgeTool('hatchet', 5).why; G.vilIngots = ingotCount(5) === 4;
  const mp = makeItem(5, WEAPON_TYPES.find(T => T.type === 'Sword')); bagAdd(oreItem('mithril', 3)); G.vilTemper = forgeTemper(mp).why; G.vilSmith = forgeTemper(mp, true).why; G.vilT = (mp.tempers || 0) === 0 && gold === gv0;
  forgeSel = { k: 's', tier: 5 }; openForgePage(); const ovG = document.getElementById('forgeui'); G.head = ovG.querySelector('#fg-skill').textContent; G.note = ovG.querySelector('#fg-right').textContent;
  forgeSel = { k: 't', it: mp }; bagAdd(mp); forgeDraw(); G.smithBtn = !!ovG.querySelector('#fg-smith'); closeForgePage(); forgeSel = { k: 's', tier: 2 }; bagTake(b => b === mp, 1);
  currentHouse = { type: 'weapon', name: 'The Forge', keeper: 'Bram', tagline: '' }; G.none = forgeMax(); /* a smith's room with no site's kind is a village's */
  for (const k of ['town', 'port', 'garrison', 'city']) { currentHouse = { type: 'weapon', name: 'The Forge', keeper: 'Bram', tagline: '', siteKind: k }; G[k] = forgeMax(); }
  currentHouse = { type: 'weapon', name: 'The Forge', keeper: 'Bram', tagline: '', siteKind: 'town' };
  G.townMith = forgeSmelt(5).made; bagAdd(oreItem('obsidian', 2)); G.townObs = forgeSmelt(7).made; G.townSword = forgeMake('Sword', 5).made; bagAdd(oreItem('mithril', 3)); G.townTemper = forgeTemper(mp).done;
  bagAdd(oreItem('obsidian', 2)); bagAdd({ name: 'Dragon Scale', ico: '🔥', type: 'misc', buyPrice: 400, sellMult: .6, weight: .8, dragonScale: true, qty: 1 }); G.townDrac = forgeSmelt(8).why; G.townScale = scaleCount() === 1;
  out.grade = G;
  // ── S2494: rare materials B, session 1 — the Draconic ingot from a dragon's scale, and picks and hatchets in steel and mithril ──
  const R = {}; lid = 'int_test'; currentHouse = { type: 'weapon', name: 'The Forge', keeper: 'Bram', tagline: '"Iron."', siteKind: 'city' }; const gf0 = greatForgeHere; greatForgeHere = () => true; /* S2551 — tiers 8–10 at the great forge */ gold = 500; BAG.length = 0; worldState.masterworks = [];
  const scale = () => ({ name: 'Dragon Scale', ico: '🔥', type: 'misc', buyPrice: 400, sellMult: .6, weight: .8, dragonScale: true, qty: 1 });
  bagAdd(oreItem('obsidian', 6)); S(74); bagAdd(scale()); R.gate74 = forgeSmelt(8).why; R.kept74 = scaleCount() === 1 && oreCount('obsidian') === 6;
  S(100); bagTake(isDragonScale, 1); R.noScale = forgeSmelt(8).why;
  bagAdd({ name: 'Dragon Scale', ico: '🔥', type: 'misc', buyPrice: 400, sellMult: .6, weight: .8, qty: 2 }); /* a scale saved before S2494, known by name */
  const d8 = forgeSmelt(8); R.smelt = { made: d8.made, name: d8.item && d8.item.name, n: ingotCount(8), obs: oreCount('obsidian'), scales: scaleCount(), price: d8.item && d8.item.buyPrice };
  forgeSmelt(8); R.two = { n: ingotCount(8), obs: oreCount('obsidian'), scales: scaleCount() };
  bagAdd(benchItem('plank', 2)); S(74); R.sword74 = forgeMake('Sword', 8).why; S(75); const ds = forgeMake('Sword', 8); R.sword = { made: ds.made, name: ds.item && ds.item.name, left: ingotCount(8) };
  /* S2492 — tier 9 from a gate's sigil stone: Smithing 90, 2 ingots, gate salvage, and so is the piece */
  bagAdd(oreItem('obsidian', 2)); S(100); R.noSigil = forgeSmelt(9).why; bagAdd(sigilStoneItem('cloch')); S(89); R.gate89 = forgeSmelt(9).why; S(90);
  const s9 = forgeSmelt(9); R.nine = { made: s9.made, n: ingotCount(9), salvage: BAG.filter(b => b.ingot === 9).every(b => b.salvage), stones: bagCount(b => b.sigilStone), price: s9.item && s9.item.buyPrice };
  bagAdd(benchItem('plank', 1)); const p9 = forgeMake('Dagger', 9); R.nineDagger = { made: p9.made, salvage: !!(p9.item && p9.item.salvage), name: p9.item && p9.item.name };
  /* S2493 — Cosmic: a piece of star iron and an adamant ingot make one, at Smithing 100 */
  bagAdd(oreItem('star', 1)); S(99); R.gate99 = forgeSmelt(10).why; S(100); R.noAdamant = forgeSmelt(10).why; bagAdd(ingotItem(6, 1));
  const c10 = forgeSmelt(10); R.ten = { made: c10.made, n: ingotCount(10), star: oreCount('star'), adamant: ingotCount(6), price: c10.item && c10.item.buyPrice, name: c10.item && c10.item.name };
  R.forgeMetals = forgeMetals().join(); R.benchMetals = benchMetals().join(); R.temper8 = forgeTemper(ds.item).why;
  /* S2520 — a deep pearl is the temper of tiers 8–10: one a temper, at the metal's gate */
  { const a8 = ds.item.atk.slice(); bagAdd(pearlItem()); S(74); const g74 = forgeTemper(ds.item).why; S(100); const tp = forgeTemper(ds.item);
    R.pearlTemper = { g74, done: tp.done, tempers: ds.item.tempers, pearls: bagCount(isDeepPearl), up: ds.item.atk[1] === Math.round(ds.item.baseAtk[1] * 1.08), a8 }; }
  // the tools
  BAG.length = 0; gold = 500; bagAdd(ds.item); bagAdd({ ...PICK_ITEM }); bagAdd({ ...HATCHET_ITEM }); R.iron = { pick: toolMetal('pick'), ps: toolStrike('pick'), hs: toolStrike('hatchet') };
  const waste = { id: 'tooltier:w', ore: 'obsidian', tier: 4, g: null }, low = { id: 'tooltier:l', ore: 'iron', tier: 3, g: null };
  worldState.veins = worldState.veins || {}; delete worldState.veins[waste.id]; delete worldState.veins[low.id]; SKILLS.mining = { lv: 100, p: 0 };
  R.ironWaste = strikeVein(waste).why; R.ironLow = !strikeVein(low).why;
  bagAdd(ingotItem(4, 4)); bagAdd(ingotItem(5, 2)); bagAdd(benchItem('plank', 1)); S(29); R.steel29 = forgeTool('pick', 4).why;
  S(30); const tt0 = gameMinNow(); const sp = forgeTool('pick', 4); R.steel = { made: sp.made, name: sp.item && sp.item.name, metal: sp.item && sp.item.toolMetal, ingots: ingotCount(4), planks: plankCount(), mins: Math.round(gameMinNow() - tt0), sale: sp.item && sellPrice(sp.item), buy: sp.item && sp.item.buyPrice };
  R.noPlank = forgeTool('hatchet', 4).why;
  R.steelPick = { metal: toolMetal('pick'), ps: toolStrike('pick'), waste: strikeVein(waste).why || 'struck' };
  bagAdd(benchItem('plank', 2)); S(44); R.mith44 = forgeTool('hatchet', 5).why; S(45); const mh = forgeTool('hatchet', 5); R.mith = { made: mh.made, name: mh.item && mh.item.name, hs: toolStrike('hatchet') };
  /* S2494 — flags the save's item list did not carry: hobnails, a vessel's water, a gate's crystal, an arc, a pack's kind */
  const fl = { skin: waterItem('skin', 3, 'raw'), cry: gateCrystalItem('tine'), arc: arcItem('tine', 2), pk: packItem('mark'), pl: pearlItem() }; for (const k in fl) bagAdd(fl[k]);
  const feet0 = EQ.feet; EQ.feet = { ...makeItem(3, ARMOR_TYPES.find(t => t.slot === 'feet'), null, true), nails: 1 };
  const d3 = JSON.parse(ssStringify(_buildSavePayload())); BAG.length = 0; _applyLoadData(d3); R.reload = { pick: toolMetal('pick'), hatchet: toolMetal('hatchet'), dr: BAG.some(b => b.weaponType === 'Sword' && b.tier === 8) };
  R.flags = { nails: bootsNailed(), skin: BAG.some(b => b.vessel === 'skin' && b.wUses === 3 && b.wKind === 'raw'), cry: BAG.some(b => b.gateCrystal === 'tine'), arc: BAG.some(b => b.arc && b.arc.n === 2), pack: BAG.some(b => b.pack === fl.pk.pack), pearl: BAG.some(b => b.deepPearl && b.name === 'Deep Pearl') };
  EQ.feet = feet0;
  forgeSel = { k: 'o', i: 1 }; openForgePage(); const ovT = document.getElementById('forgeui'); R.page = !!ovT && /Tools/.test(ovT.textContent) && /Mithril Pick/.test(ovT.textContent) && /0\.6 s/.test(ovT.textContent);
  forgeSel = { k: 's', tier: 8 }; forgeDraw(); R.page8 = /Draconic Ingot/.test(ovT.textContent) && /Dragon Scale/.test(ovT.textContent) && /makes 2/.test(ovT.textContent);
  forgeSel = { k: 't', it: ds.item }; forgeDraw(); R.pagePearl = /1 Deep Pearl/.test(ovT.querySelector('#fg-right').textContent) && !/no ore of its metal/.test(ovT.textContent); /* S2520 */ closeForgePage(); forgeSel = { k: 's', tier: 2 };
  out.rare = R; greatForgeHere = gf0;
  // ── the page (the load set where you stand; back into the smith's room) ──
  lid = 'int_test'; currentHouse = { type: 'weapon', name: 'The Forge', keeper: 'Bram', tagline: '"Iron."' };
  bagAdd(found); openShop(); const fb = document.getElementById('sh-forge'); out.tab = !!fb && fb.style.display !== 'none';
  fb.click(); const ov = document.getElementById('forgeui'); out.page = forgeOpen && !!ov && ov.style.display === 'flex' && /The Forge/.test(ov.textContent) && /Smelt/.test(ov.textContent) && /Temper/.test(ov.textContent);
  closeForgePage(); out.closed = !forgeOpen;
  lid = lid0; currentHouse = h0;
  return out;
});
console.log(JSON.stringify(r));
check('no forge outdoors or at an inn; a smith\'s room is one', /forge/.test(r.outdoors) && !r.inn && r.smithy, r);
check('2 iron ore → 1 iron ingot, weight 1, Smithing +2, 5 gold', r.smelt.made && r.smelt.name === 'Iron Ingot' && r.smelt.w === 1 && r.smelt.ore === 0 && r.smelt.use === 2 && r.smelt.fee === 5, r.smelt);
check('no ore, no ingot', /need 2 iron ore/.test(r.noOre), r.noOre);
check('a copper and a tin → bronze', r.bronze === 'Bronze Ingot', r.bronze);
check('steel asks a charcoal and takes it', /charcoal/.test(r.steelNoCoal) && r.steel === 'Steel Ingot' && r.coalLeft === 0, r);
check('silver has no ingot', r.silver);
check('an Iron sword refused at Smithing 14, the ingots kept', /Smithing 15/.test(r.gate14) && r.ingotsKept, r.gate14);
check('a weapon needs a plank for its grip; refused without one, the ingots kept, and the plank taken when made', /plank/.test(r.noPlank) && r.noPlankKept && r.plankUsed, { why: r.noPlank, kept: r.noPlankKept, used: r.plankUsed });
check('an Iron sword made at 15: made, never enchanted, 2 ingots, 30 minutes, Smithing +25', r.make.made && r.make.name === 'Iron Sword' && r.make.flag && !r.make.ench && r.make.ingots === 2 && r.make.mins === 30 && r.make.use === 25 && r.make.fee === 5, r.make);
check('a made sword sells at 20% of its price, a found one at 45%; the same blade', r.sale.made === Math.floor(r.sale.buy * .2) && r.sale.found === Math.floor(r.sale.buy * .45) && r.sale.atkSame, r.sale);
check('ingots by type: dagger 1, two-handed 4, shield 3, helm 2, chest 5, legs 3, feet 2, hands 1',
  r.need.dagger === 1 && r.need.claymore === 4 && r.need.buckler === 3 && r.need.helm === 2 && r.need.chest === 5 && r.need.legs === 3 && r.need.feet === 2 && r.need.hands === 1, r.need);
check('the forge makes no bows, clubs, rings or amulets', r.noBows);
check('a cuirass one ingot short is refused', /need 5 iron ingots/.test(r.oneIngotShort), r.oneIngotShort);
check('a temper asks 3 of its ore', /need 3 iron ore/.test(r.temperShort), r.temperShort);
check('a temper is +8% and takes 3 ore', r.t1.done && r.t1.atk[1] === Math.round(r.a0[1] * 1.08) && r.t1.ore === 6, r.t1);
check('the smith\'s temper costs 20 gold × tier; three is the most', r.t3.done && r.t3.tempers === 3 && r.t3.paid === 60 && r.t3.atk[1] === Math.round(r.a0[1] * 1.24) && /no more/.test(r.t4), r.t3);
check('the save keeps the made flag, the tempers and the 20% sale', r.reload && r.reload.tempers === 3 && r.reload.atk[1] === r.t3.atk[1] && r.reload.sale === r.sale.made, r.reload);
check('ore and an ingot keep their kinds through the save', r.oreBack);
const P = r.perks;
check('below Smithing 25, 3 iron ore smelt one ingot', P.smelt24.ingots === 1 && P.smelt24.ore === 1, P.smelt24);
check('Smelter (25): 3 iron ore make 2 ingots; 2 ore still make 1', P.smelt25.ingots === 2 && P.smelt25.ore === 0 && P.smelt25two === 3, P);
check('Smelter: 2 copper and a tin make 2 bronze ingots', P.bronze.ingots === 2 && P.bronze.cu === 0 && P.bronze.sn === 0, P.bronze);
check('Fine work (50): a made sword is Fine, +10%; at 49 plain', P.plain === 'Iron Sword' && P.fine.name === 'Fine Iron Sword' && P.fine.atk[1] === Math.round(P.fine.base[1] * 1.1) && P.fine.atk[0] === Math.round(P.fine.base[0] * 1.1), P);
check('Temper (75): four tempers', P.max74 === 3 && P.max75 === 4, P);
check('Masterwork (100): the first iron piece is a Masterwork, +20%; the next is Fine', P.master.a === 'Masterwork Iron Dagger' && P.master.aAtk[1] === Math.round(P.master.base[1] * 1.2) && P.master.b === 'Fine Iron Dagger' && P.master.kept.join() === '3', P.master);
check('the save keeps a Fine blade\'s step and the masterworks (the character\'s)', P.reload && P.reload.atk.join() === P.fine.atk.join() && P.reload.kept.join() === '3' && P.charKey, P.reload);
const GG = r.grade;
check('S2551: a village\'s smith works to Steel; one with no site\'s kind is a village\'s; a town, port, garrison or city smith to Obsidian', GG.vil.grade === 'smith' && GG.vil.max === 4 && GG.none === 4 && GG.town === 7 && GG.port === 7 && GG.garrison === 7 && GG.city === 7, GG);
check('S2551: at a village forge steel smelts; mithril is refused and names a town\'s forge, the ore and the fee kept', GG.vilSteel && /works to steel\. Mithril wants a town’s forge/.test(GG.vilMith) && GG.vilKept, GG);
check('S2551: a village forge makes no mithril sword or hatchet and tempers no mithril piece, yours or the smith\'s, nothing taken', /town’s forge/.test(GG.vilMake) && /town’s forge/.test(GG.vilTool) && GG.vilIngots && /town’s forge/.test(GG.vilTemper) && /town’s forge/.test(GG.vilSmith) && GG.vilT, GG);
check('S2551: the page names the grade and says where mithril is worked; no smith\'s temper button above the grade', /^A village forge, to steel/.test(GG.head) && /Mithril wants a town’s forge/.test(GG.note) && !GG.smithBtn, { head: GG.head, note: GG.note, btn: GG.smithBtn });
check('S2551: a town\'s forge smelts mithril and obsidian, makes and tempers mithril; Draconic is refused for the great forge, the scale kept', GG.townMith && GG.townObs && GG.townSword && GG.townTemper && /Draconic wants the great forge in a city’s keep/.test(GG.townDrac) && GG.townScale, GG);
const RR = r.rare;
check('S2494: Draconic asks Smithing 75 to smelt; refused at 74, the scale and the obsidian kept; no scale, no ingot', /Smithing 75/.test(RR.gate74) && RR.kept74 && /scale/.test(RR.noScale), RR);
check('S2494: a dragon\'s scale and 2 obsidian make 2 Draconic ingots (a scale saved by name counts); Smelter passes it by', RR.smelt.made && RR.smelt.name === 'Draconic Ingot' && RR.smelt.n === 2 && RR.smelt.obs === 4 && RR.smelt.scales === 1 && RR.two.n === 4 && RR.two.obs === 2 && RR.two.scales === 0, RR);
check('S2494: a Draconic sword is made at Smithing 75, refused at 74; the forge\'s metals run to 10, and the bench\'s too since S2496 (skywood); no ore tempers it, a deep pearl does (S2520)', /Smithing 75/.test(RR.sword74) && RR.sword.made && /Draconic Sword/.test(RR.sword.name) && RR.sword.left === 2 && RR.forgeMetals === '2,3,4,5,6,7,8,9,10' && RR.benchMetals === '2,3,4,5,6,7,8,9,10' && /deep pearl/.test(RR.temper8), RR);
check('S2492: tier 9 asks a sigil stone and Smithing 90; it makes 2 ingots, gate salvage, and a dagger of them is salvage too', /sigil stone/.test(RR.noSigil) && /Smithing 90/.test(RR.gate89) && RR.nine.made && RR.nine.n === 2 && RR.nine.salvage && RR.nine.stones === 0 && RR.nine.price === 99 && RR.nineDagger.made && RR.nineDagger.salvage, { noSigil: RR.noSigil, gate89: RR.gate89, nine: RR.nine, dagger: RR.nineDagger });
check('S2493: Cosmic asks Smithing 100 and an adamant ingot beside the star iron; they make one ingot, 336', /Smithing 100/.test(RR.gate99) && /adamant ingot/.test(RR.noAdamant) && RR.ten.made && RR.ten.n === 1 && RR.ten.star === 0 && RR.ten.adamant === 0 && RR.ten.price === 336 && RR.ten.name === 'Cosmic Ingot', { gate99: RR.gate99, noAdamant: RR.noAdamant, ten: RR.ten });
check('S2494: an iron pick and hatchet strike every 0.9 s; the iron pick turns on a wastes vein, not on a tier-3 one', RR.iron.pick === 3 && RR.iron.ps === .9 && RR.iron.hs === .9 && /steel pick/.test(RR.ironWaste) && RR.ironLow, RR);
check('S2494: a steel pick: Smithing 30, 2 ingots and a plank, 30 minutes, made (a fifth back); strikes every 0.75 s and reaches the wastes', /Smithing 30/.test(RR.steel29) && RR.steel.made && RR.steel.name === 'Steel Pick' && RR.steel.metal === 4 && RR.steel.ingots === 2 && RR.steel.planks === 0 && RR.steel.mins === 30 && RR.steel.sale === Math.floor(RR.steel.buy * .2) && /plank/.test(RR.noPlank) && RR.steelPick.metal === 4 && RR.steelPick.ps === .75 && RR.steelPick.waste !== 'The rock turns the iron. It wants a steel pick.', RR);
check('S2494: a mithril hatchet at Smithing 45 strikes every 0.6 s; the tools and the Draconic sword come back from a save', /Smithing 45/.test(RR.mith44) && RR.mith.made && RR.mith.name === 'Mithril Hatchet' && RR.mith.hs === .6 && RR.reload.pick === 4 && RR.reload.hatchet === 5 && RR.reload.dr, RR);
check('S2494: the save keeps hobnails, a vessel\'s water, a gate crystal\'s school, an arc\'s number and a pack\'s kind (all lost on a reload before)', Object.values(RR.flags).every(Boolean), RR.flags);
check('S2494: the forge\'s page lists the tools, with their strike, and the Draconic ingot\'s scale', RR.page && RR.page8, RR);
check('S2520: a Draconic sword is tempered with a deep pearl, one a temper, at Smithing 75 (refused at 74); the pearl is spent, +8%; the page names it', /deep pearl/.test(RR.temper8) && RR.pagePearl && /Smithing 75/.test(RR.pearlTemper.g74) && RR.pearlTemper.done && RR.pearlTemper.tempers === 1 && RR.pearlTemper.pearls === 0 && RR.pearlTemper.up, { why: RR.temper8, ...RR.pearlTemper });
check('the smith\'s shop has a Forge tab; it opens the forge\'s page', r.tab && r.page && r.closed, { tab: r.tab, page: r.page, closed: r.closed });
// ── S2520: deep pearls (rare materials B, session 5; Michael's A on #1861): oyster beds off Aurenne 8 m down ──
const PB = await page.evaluate(() => {
  const beds = [], isles = {};
  for (let j = 0; j < GRID; j++) for (let i = 0; i < GRID; i++) {
    if (isLandCell(i, j)) continue; let k = ''; try { k = nationKeyOf(i, j); } catch (e) {}
    const c0 = Math.floor(i * SIZE / CHUNK), c1 = Math.floor((i + 1) * SIZE / CHUNK), d0 = Math.floor(j * SIZE / CHUNK), d1 = Math.floor((j + 1) * SIZE / CHUNK);
    for (let cx = c0; cx < c1; cx++) for (let cz = d0; cz < d1; cz++) { const b = pearlBedSpot(cx, cz); if (b) { beds.push(b); isles[k] = (isles[k] || 0) + 1; } }
  }
  beds.sort((a, b) => Math.hypot(a.x - px, a.z - pz) - Math.hypot(b.x - px, b.z - pz));
  return { n: beds.length, isles, deep: beds.every(b => placeH(b.x, b.z) <= SEA_Y - 7.95), ids: beds.every(b => /^-?\d+,-?\d+:pearl:0$/.test(b.id)), first: beds[0] };
});
let PR = null;
if (PB.first) {
  await page.evaluate(s => WORLD.enter(s.x + 3, s.z, 0, 'test'), PB.first);
  PR = await page.evaluate(s => {
    const cx = Math.floor(s.x / CHUNK), cz = Math.floor(s.z / CHUNK), key = chunkKey(cx, cz); if (chunks.has(key)) dropChunk(key); buildChunk(cx, cz);
    const bed = PEARL_BEDS.find(q => q.id === s.id); if (!bed) return { none: true };
    const out = { oy: bed.oy.length, onBed: bed.oy.every(o => Math.abs(o.y - worldH(o.x, o.z)) < .01 && o.y <= SEA_Y - 7.9), ring: bed.oy.every(o => Math.hypot(o.x - bed.x, o.z - bed.z) <= PEARL.ring + .01) };
    BAG.length = 0; delete (worldState.pearlBeds || {})[bed.id]; const msgs = [];
    const at = (i, up) => { const o = bed.oy[i]; px = o.x + .2; pz = o.z; jumpY = o.y + up; DIVE.depth = jumpY; };
    at(0, 7.5); out.surface = pearlNear();
    let want = 0; for (let i = 0; i < 5; i++) { at(i, 1); const n = pearlNear(); if (!n || n.bed !== bed) { out.miss = i; break; }
      const e = (worldState.pearlBeds && worldState.pearlBeds[bed.id] || {}).e || 0; if (seededRng('pearl', bed.id + ':' + e + ':' + n.i)() < PEARL.p) want++;
      interact(); msgs.push(MSGEL.textContent); }
    const r = worldState.pearlBeds[bed.id]; out.rec = { ...r }; out.pearls = bagCount(isDeepPearl); out.want = want; out.msgs = msgs;
    out.shells = bed.g.userData.shells.filter(m => m.visible).length; at(0, 1); out.after = pearlNear();
    const d0 = Math.floor(gameMinNow() / 1440); r.d = d0 - 13; out.day13 = pearlTaken(bed.id, 0); r.d = d0 - 14; out.day14 = !pearlTaken(bed.id, 0) && worldState.pearlBeds[bed.id].e === 1;
    pearlShow(bed); out.back = bed.g.userData.shells.filter(m => m.visible).length;
    const sp = ssSplitPayload(JSON.parse(ssStringify(_buildSavePayload()))); out.worldRow = !!(sp.w.wS && sp.w.wS.pearlBeds && sp.w.wS.pearlBeds[bed.id]) && !(sp.c.wS && sp.c.wS.pearlBeds);
    return out;
  }, PB.first);
}
console.log(JSON.stringify({ PB, PR }));
check('S2520: oyster beds lie off Aurenne only, every one 8 m down on the open bed, keyed <cx,cz>:pearl:0', PB.n > 100 && Object.keys(PB.isles).join() === 'aurenne' && PB.deep && PB.ids, PB);
check('S2520: a bed is 5 oysters on the sea bed within 2.4 m of its middle; none can be opened from the surface', PR && PR.oy === 5 && PR.onBed && PR.ring && !PR.surface, PR);
check('S2520: E down on the bed opens each oyster; the pearls are the seeded one in six; the shells go, and nothing more opens', PR && PR.miss == null && PR.rec.t === 31 && PR.pearls === PR.want && PR.msgs.length === 5 && PR.msgs.every(m => /deep pearl|oyster is empty/.test(m)) && PR.shells === 0 && !PR.after, PR);
check('S2520: the bed is taken at 13 days and whole again at 14, its shells back; its record is the world row\'s', PR && PR.day13 && PR.day14 && PR.back === 5 && PR.worldRow, PR);
check('S2520: the save keeps a deep pearl', RR.flags.pearl, RR.flags);
// ── S1514: a fort armoury's smelter is a forge with no smith: no fee, no temper for gold, and only beside it ──
let D = null;
for (const [interior, seed] of [['fort_tee', 23], ['fort_linear', 31], ['fort_courtyard', 47], ['fort_tee', 59], ['fort_linear', 73], ['fort_courtyard', 91]]) {
  await enterDungeon(page, { theme: 'ruins', seed, interior, size: 'medium' });
  D = await page.evaluate(() => {
    const arm = dScene.children.filter(o => o.userData && o.userData.fortFurn && o.userData.fortFurn.kind === 'armory').map(o => o.userData.fortFurn);
    if (!arm.length) return null;
    const out = { n: D_FORGES.length, rooms: arm.length, k: DCELL };
    const f = D_FORGES[0], R = arm.find(R => f.x > R.x0 && f.x < R.x0 + R.w && f.z > R.z0 && f.z < R.z0 + R.h);
    out.inRoom = !!R;
    // the smelter's own footprint (1.1 square, padded by the dungeon props' 0.22) still stands on the record after the dungeon was scaled whole
    out.onProp = DUNGEON_PROPS.some(q => !q.doorWall && Math.abs((q.x0 + q.x1) / 2 - f.x) < .05 && Math.abs((q.z0 + q.z1) / 2 - f.z) < .05 && Math.abs(q.x1 - q.x0 - 1.54) < .05);
    // stand on free floor beside it, within touch
    let spot = null; for (let a = 0; a < 16 && !spot; a++) { const x = f.x + Math.cos(a / 16 * 6.283) * 1.1, z = f.z + Math.sin(a / 16 * 6.283) * 1.1; if (!dBlk(x, z)) spot = [x, z]; }
    out.spot = !!spot; if (!spot) return out;
    px = spot[0]; pz = spot[1]; currentFloor = 1;
    out.here = forgeHere(); out.near = !!dunForgeNear();
    BAG.length = 0; gold = 50; SKILLS.smithing = { lv: 20, p: 0 };
    bagAdd(oreItem('iron', 2)); const s1 = forgeSmelt(3); out.smelt = { made: s1.made, name: s1.item && s1.item.name, paid: 50 - gold };
    bagAdd(ingotItem(3, 1)); bagAdd(benchItem('plank', 1)); const mk = forgeMake('Dagger', 3); out.make = { made: mk.made, paid: 50 - gold };
    out.bySmith = forgeTemper(mk.item, true).why;
    bagAdd(oreItem('iron', 3)); const t = forgeTemper(mk.item); out.temper = { done: t.done, paid: 50 - gold };
    interact(); const ov = document.getElementById('forgeui'); out.page = forgeOpen && !!ov && ov.style.display === 'flex';
    out.head = ov && ov.querySelector('#fg-skill').textContent; out.max = forgeMax(); forgeSel = { k: 't', it: mk.item }; forgeDraw(); out.smithBtn = !!ov.querySelector('#fg-smith'); closeForgePage();
    // ten metres off, nothing
    const far = [[f.x - 6, f.z], [f.x, f.z + 6], [f.x + 6, f.z], [f.x, f.z - 6]].find(([x, z]) => !dBlk(x, z) && Math.hypot(x - f.x, z - f.z) > TOUCH);
    if (far) { px = far[0]; pz = far[1]; out.farHere = forgeHere(); out.farWhy = forgeSmelt(3).why; }
    return out;
  });
  if (D) break;
}
console.log(JSON.stringify(D));
check('a fort with an armoury records its smelter, in the room, on its own footprint after the dungeon is scaled', D && D.n >= 1 && D.inRoom && D.onProp && D.k > 1, D);
check('beside the smelter you stand at a forge', D && D.spot && D.here && D.near, D);
check('there a smelt, a piece and your own temper cost no gold; no smith tempers for gold', D && D.smelt.made && D.smelt.name === 'Iron Ingot' && D.make.made && D.temper.done && D.temper.paid === 0 && /No smith/.test(D.bySmith), D);
check('E there opens the forge\'s page, with no fee in its head and no smith\'s button; the smelter is a village\'s grade, to steel (S2551)', D && D.page && D.max === 4 && /village forge, to steel/.test(D.head) && /Smithing 20/.test(D.head) && !/a use/.test(D.head) && !D.smithBtn, D && { head: D.head, smithBtn: D.smithBtn });
check('away from the smelter there is no forge', D && D.farHere === false && /forge/.test(D.farWhy), D && D.farWhy);
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
