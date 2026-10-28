// Survival B, session 6: the bench (Session 1517; `docs/design/survival-build.md`). A joiner's kit in the bag is a bench. A log
// makes 2 planks and a pine log a spar (Joinery 2); a bow is 2 planks and an ingot and takes its metal, gated by Joinery at the
// metal's SKILL_GATE; a wooden shield is 3 planks (Joinery 15 each, 30 minutes, made, a fifth back). Fletching: a log, 10
// feathers and an iron ingot make 10 Iron Arrows, 15 with Fletcher (Woodcutting 50).
import { boot, check } from './lib/game.mjs';
const g = await boot(); const { page } = g;
await g.intoWorld();
const r = await page.evaluate(() => {
  const out = {};
  BAG.length = 0; gold = 500;
  const J = lv => { SKILLS.joinery = { lv, p: 0 }; };
  // ── no bench without the kit ──
  bagAdd(survItem('log', 1)); out.noKit = benchMake('plank').why;
  bagAdd({ ...JOINER_ITEM }); out.here = benchHere();
  // ── planks and a spar ──
  J(10); const p0 = SKILLS.joinery.p; const pl = benchMake('plank');
  out.plank = { made: pl.made, n: plankCount(), logs: bagCount(b => b.log === 'log'), use: SKILLS.joinery.p - p0, w: pl.item && pl.item.weight };
  out.noLog = benchMake('plank').why;
  bagAdd(survItem('pine', 1)); const sp = benchMake('spar'); out.spar = { made: sp.made, n: bagCount(b => b.spar), pine: bagCount(b => b.log === 'pine') };
  // ── a bow: the gate at the ingot's metal, then made ──
  bagAdd(ingotItem(3, 1)); out.gate = benchMake('bow', 3).why; out.keptOnRefuse = plankCount() === 2 && ingotCount(3) === 1;
  J(15); const t0 = gameMinNow(), p1 = SKILLS.joinery.p; const bw = benchMake('bow', 3), bow = bw.item;
  out.bow = { made: bw.made, name: bow && bow.name, type: bow && bow.weaponType, flag: bow && bow.made, ench: !!(bow && (bow.enchant || bow.enchantId)), planks: plankCount(), ingots: ingotCount(3),
    mins: Math.round(gameMinNow() - t0), use: SKILLS.joinery.p - p1 + (SKILLS.joinery.lv > 15 ? skillCost(15) : 0) };
  const found = makeItem(3, WEAPON_TYPES.find(t => t.type === 'Bow'), null, false);
  out.bowSale = { made: sellPrice(bow), found: sellPrice(found), atkSame: bow.atk.join() === found.atk.join() };
  bagAdd(ingotItem(2, 1)); bagAdd(benchItem('plank', 2)); out.bronze = benchMake('bow', 2).item.name;
  // ── a wooden shield ──
  out.shieldShort = benchMake('shield').why;
  bagAdd(benchItem('plank', 3)); const sh = benchMake('shield'); out.shield = { made: sh.made, name: sh.item && sh.item.name, block: !!(sh.item && sh.item.shieldType === 'shield'), flag: sh.item && sh.item.made, planks: plankCount(), row: BENCH_RECIPES.find(x => x.id === 'shield').name }; /* S1535 — the page's row names what it makes */
  // ── fletching ──
  BAG.length = 0; bagAdd({ ...JOINER_ITEM }); SKILLS.woodcutting = { lv: 49, p: 0 };
  bagAdd(survItem('log', 2)); bagAdd(ingotItem(3, 2)); bagAdd({ ...BENCH_ITEMS.feathers }); bagAdd({ ...BENCH_ITEMS.feathers });
  const w0 = SKILLS.woodcutting.p; const f1 = benchMake('arrows');
  out.fletch = { made: f1.made, n: f1.n, arrows: bagCount(b => b.type === 'ammo' && b.ammoType === 'arrow'), name: f1.item && f1.item.name, feathers: bagCount(b => b.feather), use: SKILLS.woodcutting.p - w0 };
  SKILLS.woodcutting = { lv: 50, p: 0 }; const f2 = benchMake('arrows'); out.fletcher = { n: f2.n, arrows: bagCount(b => b.type === 'ammo' && b.ammoType === 'arrow') };
  out.noFeathers = benchMake('arrows').why;
  // feathers sell by the piece, as arrows do: ten for a gold never sell back for more
  out.featherSale = sellPrice({ ...BENCH_ITEMS.feathers, qty: 1 });
  // ── the shops: the kit at the smith's and the goods shop, feathers at the goods shop ──
  out.shops = { smith: joinerKitFor({ type: 'weapon' }).length, goods: joinerKitFor({ type: 'misc' }).length, inn: joinerKitFor({ type: 'inn' }).length,
    feathers: feathersFor({ type: 'misc' }).length, smithFeathers: feathersFor({ type: 'weapon' }).length };
  // ── the page opens from the kit in the bag ──
  BAG.length = 0; bagAdd({ ...JOINER_ITEM }); bagAdd(survItem('log', 1));
  useItem(BAG.findIndex(b => b.tool === 'joiner')); const ov = document.getElementById('benchui');
  out.page = benchOpen && !!ov && ov.style.display === 'flex'; out.rows = ov && ov.querySelectorAll('#bn-list [data-k]').length;
  benchSel = 'plank'; benchGo(); out.pageSaid = ov && ov.querySelector('#bn-said').textContent; closeBenchPage(); out.closed = !benchOpen;
  // ── the save keeps planks, a spar and a made bow ──
  bagAdd(benchItem('spar', 1)); bagAdd(bow);
  const d = JSON.parse(ssStringify(_buildSavePayload())); BAG.length = 0; _applyLoadData(d);
  out.reload = { planks: plankCount(), spar: bagCount(b => b.spar), bow: !!BAG.find(b => b.made && b.weaponType === 'Bow'), kit: hasJoinerKit() };
  out.perk = PERK_LIVE.has('woodcutting:50') && PERK_DEF.joinery.length === 4;
  return out;
});
console.log(JSON.stringify(r));
check('no bench without a joiner\'s kit; the kit in the bag is one', /bench/.test(r.noKit) && r.here, r);
check('a log makes 2 planks (Joinery +2); none without a log', r.plank.made && r.plank.n === 2 && r.plank.logs === 0 && r.plank.use === 2 && r.plank.w === 2 && /log/.test(r.noLog), r.plank);
check('a pine log makes a spar', r.spar.made && r.spar.n === 1 && r.spar.pine === 0, r.spar);
check('an Iron bow asks Joinery 15 and keeps the planks and ingot when refused', /Joinery 15/.test(r.gate) && r.keptOnRefuse, r.gate);
check('an Iron Bow at 15: made, never enchanted, 2 planks and an ingot, 30 minutes, Joinery +15', r.bow.made && r.bow.name === 'Iron Bow' && r.bow.type === 'Bow' && r.bow.flag && !r.bow.ench && r.bow.planks === 0 && r.bow.ingots === 0 && r.bow.mins === 30 && r.bow.use === 15, r.bow);
check('a made bow sells at a fifth, a found one at 45%, the same attack', r.bowSale.made < r.bowSale.found && r.bowSale.atkSame, r.bowSale);
check('a bronze ingot makes a Bronze Bow', r.bronze === 'Bronze Bow', r.bronze);
check('a wooden shield is 3 planks, a made Wooden Buckler', /3 planks/.test(r.shieldShort) && r.shield.made && r.shield.name === 'Wooden Buckler' && r.shield.block && r.shield.flag && r.shield.planks === 0 && r.shield.row === r.shield.name, r.shield);
check('fletching: a log, 10 feathers and an iron ingot make 10 Iron Arrows (Woodcutting +2)', r.fletch.made && r.fletch.n === 10 && r.fletch.arrows === 10 && r.fletch.name === 'Iron Arrow' && r.fletch.feathers === 10 && r.fletch.use === 2, r.fletch);
check('Fletcher (Woodcutting 50): fifteen', r.fletcher.n === 15 && r.fletcher.arrows === 25 && /feathers/.test(r.noFeathers), r.fletcher);
check('a feather sells for nothing (ten are bought for a gold)', r.featherSale === 0, r.featherSale);
check('the kit at the smith\'s and the goods shop, feathers at the goods shop only', r.shops.smith === 1 && r.shops.goods === 1 && r.shops.inn === 0 && r.shops.feathers === 1 && r.shops.smithFeathers === 0, r.shops);
check('the kit used from the bag opens the bench\'s page, five rows; Work makes planks', r.page && r.rows === 5 && /2 × Plank/.test(r.pageSaid) && r.closed, r);
check('the save keeps planks, a spar, a made bow and the kit', r.reload.planks === 2 && r.reload.spar === 1 && r.reload.bow && r.reload.kit, r.reload);
check('Fletcher is live; Joinery has its four perks on the sheet', r.perk, r.perk);
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
