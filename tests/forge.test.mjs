// Survival B, session 5: the forge (Session 1494; `docs/design/survival-build.md`, Michael's A on #781). A smith's room is a
// forge, 5 gold a use. 2 ore make an ingot (bronze from a copper and a tin, steel from 2 iron ore and a charcoal); a piece
// takes its type's ingots and 30 game-minutes, gated by Smithing at the metal's SKILL_GATE (Iron 15). A made piece is never
// enchanted, carries `made` and sells back at 20%. A temper is 3 ore of its metal, +8%, three to a piece; the smith does it
// for 20 gold × tier.
import { boot, check } from './lib/game.mjs';
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
  out.gate14 = forgeMake('Sword', 3).why; out.ingotsKept = bagCount(b => b.ingot === 3) === ing0;
  S(15); const t0 = gameMinNow(), g1 = gold;
  const mk = forgeMake('Sword', 3), sw = mk.item;
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
check('the smith\'s shop has a Forge tab; it opens the forge\'s page', r.tab && r.page && r.closed, { tab: r.tab, page: r.page, closed: r.closed });
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
