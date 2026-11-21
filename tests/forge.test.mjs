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
  // ── S2491: rare materials B, session 1 — the Draconic ingot from a dragon's scale, and picks and hatchets in steel and mithril ──
  const R = {}; lid = 'int_test'; currentHouse = { type: 'weapon', name: 'The Forge', keeper: 'Bram', tagline: '"Iron."' }; gold = 500; BAG.length = 0; worldState.masterworks = [];
  const scale = () => ({ name: 'Dragon Scale', ico: '🔥', type: 'misc', buyPrice: 400, sellMult: .6, weight: .8, dragonScale: true, qty: 1 });
  bagAdd(oreItem('obsidian', 6)); S(74); bagAdd(scale()); R.gate74 = forgeSmelt(8).why; R.kept74 = scaleCount() === 1 && oreCount('obsidian') === 6;
  S(100); bagTake(isDragonScale, 1); R.noScale = forgeSmelt(8).why;
  bagAdd({ name: 'Dragon Scale', ico: '🔥', type: 'misc', buyPrice: 400, sellMult: .6, weight: .8, qty: 2 }); /* a scale saved before S2491, known by name */
  const d8 = forgeSmelt(8); R.smelt = { made: d8.made, name: d8.item && d8.item.name, n: ingotCount(8), obs: oreCount('obsidian'), scales: scaleCount(), price: d8.item && d8.item.buyPrice };
  forgeSmelt(8); R.two = { n: ingotCount(8), obs: oreCount('obsidian'), scales: scaleCount() };
  bagAdd(benchItem('plank', 2)); S(74); R.sword74 = forgeMake('Sword', 8).why; S(75); const ds = forgeMake('Sword', 8); R.sword = { made: ds.made, name: ds.item && ds.item.name, left: ingotCount(8) };
  R.forgeMetals = forgeMetals().join(); R.benchMetals = benchMetals().join(); R.temper8 = forgeTemper(ds.item).why;
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
  /* S2491 — flags the save's item list did not carry: hobnails, a vessel's water, a gate's crystal, an arc, a pack's kind */
  const fl = { skin: waterItem('skin', 3, 'raw'), cry: gateCrystalItem('tine'), arc: arcItem('tine', 2), pk: packItem('mark') }; for (const k in fl) bagAdd(fl[k]);
  const feet0 = EQ.feet; EQ.feet = { ...makeItem(3, ARMOR_TYPES.find(t => t.slot === 'feet'), null, true), nails: 1 };
  const d3 = JSON.parse(ssStringify(_buildSavePayload())); BAG.length = 0; _applyLoadData(d3); R.reload = { pick: toolMetal('pick'), hatchet: toolMetal('hatchet'), dr: BAG.some(b => b.weaponType === 'Sword' && b.tier === 8) };
  R.flags = { nails: bootsNailed(), skin: BAG.some(b => b.vessel === 'skin' && b.wUses === 3 && b.wKind === 'raw'), cry: BAG.some(b => b.gateCrystal === 'tine'), arc: BAG.some(b => b.arc && b.arc.n === 2), pack: BAG.some(b => b.pack === fl.pk.pack) };
  EQ.feet = feet0;
  forgeSel = { k: 'o', i: 1 }; openForgePage(); const ovT = document.getElementById('forgeui'); R.page = !!ovT && /Tools/.test(ovT.textContent) && /Mithril Pick/.test(ovT.textContent) && /0\.6 s/.test(ovT.textContent);
  forgeSel = { k: 's', tier: 8 }; forgeDraw(); R.page8 = /Draconic Ingot/.test(ovT.textContent) && /Dragon Scale/.test(ovT.textContent) && /makes 2/.test(ovT.textContent); closeForgePage(); forgeSel = { k: 's', tier: 2 };
  out.rare = R;
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
const RR = r.rare;
check('S2491: Draconic asks Smithing 75 to smelt; refused at 74, the scale and the obsidian kept; no scale, no ingot', /Smithing 75/.test(RR.gate74) && RR.kept74 && /scale/.test(RR.noScale), RR);
check('S2491: a dragon\'s scale and 2 obsidian make 2 Draconic ingots (a scale saved by name counts); Smelter passes it by', RR.smelt.made && RR.smelt.name === 'Draconic Ingot' && RR.smelt.n === 2 && RR.smelt.obs === 4 && RR.smelt.scales === 1 && RR.two.n === 4 && RR.two.obs === 2 && RR.two.scales === 0, RR);
check('S2491: a Draconic sword is made at Smithing 75, refused at 74; the forge\'s metals run to 8, the bench\'s to 7; no ore tempers it', /Smithing 75/.test(RR.sword74) && RR.sword.made && /Draconic Sword/.test(RR.sword.name) && RR.sword.left === 2 && RR.forgeMetals === '2,3,4,5,6,7,8' && RR.benchMetals === '2,3,4,5,6,7' && /no ore/.test(RR.temper8), RR);
check('S2491: an iron pick and hatchet strike every 0.9 s; the iron pick turns on a wastes vein, not on a tier-3 one', RR.iron.pick === 3 && RR.iron.ps === .9 && RR.iron.hs === .9 && /steel pick/.test(RR.ironWaste) && RR.ironLow, RR);
check('S2491: a steel pick: Smithing 30, 2 ingots and a plank, 30 minutes, made (a fifth back); strikes every 0.75 s and reaches the wastes', /Smithing 30/.test(RR.steel29) && RR.steel.made && RR.steel.name === 'Steel Pick' && RR.steel.metal === 4 && RR.steel.ingots === 2 && RR.steel.planks === 0 && RR.steel.mins === 30 && RR.steel.sale === Math.floor(RR.steel.buy * .2) && /plank/.test(RR.noPlank) && RR.steelPick.metal === 4 && RR.steelPick.ps === .75 && RR.steelPick.waste !== 'The rock turns the iron. It wants a steel pick.', RR);
check('S2491: a mithril hatchet at Smithing 45 strikes every 0.6 s; the tools and the Draconic sword come back from a save', /Smithing 45/.test(RR.mith44) && RR.mith.made && RR.mith.name === 'Mithril Hatchet' && RR.mith.hs === .6 && RR.reload.pick === 4 && RR.reload.hatchet === 5 && RR.reload.dr, RR);
check('S2491: the save keeps hobnails, a vessel\'s water, a gate crystal\'s school, an arc\'s number and a pack\'s kind (all lost on a reload before)', Object.values(RR.flags).every(Boolean), RR.flags);
check('S2491: the forge\'s page lists the tools, with their strike, and the Draconic ingot\'s scale', RR.page && RR.page8, RR);
check('the smith\'s shop has a Forge tab; it opens the forge\'s page', r.tab && r.page && r.closed, { tab: r.tab, page: r.page, closed: r.closed });
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
    out.head = ov && ov.querySelector('#fg-skill').textContent; forgeSel = { k: 't', it: mk.item }; forgeDraw(); out.smithBtn = !!ov.querySelector('#fg-smith'); closeForgePage();
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
check('E there opens the forge\'s page, with no fee in its head and no smith\'s button', D && D.page && /Smithing 20/.test(D.head) && !/a use/.test(D.head) && !D.smithBtn, D && { head: D.head, smithBtn: D.smithBtn });
check('away from the smelter there is no forge', D && D.farHere === false && /forge/.test(D.farWhy), D && D.farWhy);
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
