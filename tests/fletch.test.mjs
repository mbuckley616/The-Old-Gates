// Survival B, session 6: the bench (Session 1517; `docs/design/survival-build.md`). A joiner's kit in the bag is a bench. A log
// makes 2 planks and a pine log a spar (Joinery 2); a bow is 2 planks and an ingot and takes its metal, gated by Joinery at the
// metal's SKILL_GATE; a wooden shield is 3 planks (Joinery 15 each, 30 minutes, made, a fifth back). Fletching: a log, 10
// feathers and an iron ingot make 10 Iron Arrows, 15 with Fletcher (Woodcutting 50); since S1541 any ingot fletches its own metal's (#829 A).
// S1549 — Bowyer (Joinery 75, #851 A): the longbow and the war bow, 3 planks and an ingot, each with its own draw, shot, speed and stamina.
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
  // ── S1541: an arrow of each metal (#829 A), on the weapons' curve ──
  out.curve = benchMetals().map(t => { const a = arrowOf(t, 1); return a.name + ' ' + a.arrowDmg.join('-'); });
  BAG.length = 0; bagAdd({ ...JOINER_ITEM }); SKILLS.woodcutting = { lv: 10, p: 0 };
  bagAdd(survItem('log', 2)); bagAdd(ingotItem(4, 1)); bagAdd(ingotItem(3, 1)); bagAdd({ ...BENCH_ITEMS.feathers }); bagAdd({ ...BENCH_ITEMS.feathers });
  const st = benchMake('arrows', 4);
  out.steel = { made: st.made, n: st.n, name: st.item && st.item.name, dmg: st.item && st.item.arrowDmg.join('-'), steel: ingotCount(4), iron: ingotCount(3), ammo: st.item && st.item.ammoType, col: st.item && st.item.matCol === MATERIALS[3].blade };
  out.noSteel = benchMake('arrows', 4).why;
  out.steelSale = sellPrice({ ...arrowOf(4, 1) }) * 10 < sellPrice(ingotItem(4, 1));
  useItem(BAG.findIndex(b => b.name === 'Steel Arrow')); out.quiver = EQ.ammo && EQ.ammo.name + ' ' + EQ.ammo.qty;
  // feathers sell by the piece, as arrows do: ten for a gold never sell back for more
  out.featherSale = sellPrice({ ...BENCH_ITEMS.feathers, qty: 1 });
  // ── the shops: the kit at the smith's and the goods shop, feathers at the goods shop ──
  out.shops = { smith: joinerKitFor({ type: 'weapon' }).length, goods: joinerKitFor({ type: 'misc' }).length, inn: joinerKitFor({ type: 'inn' }).length,
    feathers: feathersFor({ type: 'misc' }).length, smithFeathers: feathersFor({ type: 'weapon' }).length };
  // ── the page opens from the kit in the bag ──
  BAG.length = 0; bagAdd({ ...JOINER_ITEM }); bagAdd(survItem('log', 1));
  useItem(BAG.findIndex(b => b.tool === 'joiner')); const ov = document.getElementById('benchui');
  out.page = benchOpen && !!ov && ov.style.display === 'flex'; out.rows = ov && ov.querySelectorAll('#bn-list [data-k]').length;
  benchSel = 'plank'; benchGo(); out.pageSaid = ov && ov.querySelector('#bn-said').textContent;
  bagAdd(ingotItem(5, 1)); benchSel = 'arrows'; benchTier = 5; benchDraw(); out.arrowPage = ov.querySelector('#bn-right').textContent; closeBenchPage(); out.closed = !benchOpen;
  // ── the save keeps planks, a spar and a made bow ──
  bagAdd(benchItem('spar', 1)); bagAdd(bow);
  const d = JSON.parse(ssStringify(_buildSavePayload())); BAG.length = 0; _applyLoadData(d);
  out.reload = { planks: plankCount(), spar: bagCount(b => b.spar), bow: !!BAG.find(b => b.made && b.weaponType === 'Bow'), kit: hasJoinerKit() };
  // ── S1549: Bowyer's longbow and war bow ──
  BAG.length = 0; bagAdd({ ...JOINER_ITEM }); bagAdd(benchItem('plank', 6)); bagAdd(ingotItem(3, 2)); J(74);
  out.noBowyer = { why: benchMake('longbow', 3).why, kept: plankCount() === 6 && ingotCount(3) === 2, row: BENCH_RECIPES.find(r => r.id === 'longbow').has() };
  J(75); const lb = benchMake('longbow', 3), wb = benchMake('warbow', 3);
  out.bows = { lb: lb.made && lb.item.name, wb: wb.made && wb.item.name, lbW: lb.item && lb.item.weight, wbW: wb.item && wb.item.weight, planks: plankCount(), ingots: ingotCount(3),
    made: !!(lb.item && lb.item.made && wb.item && wb.item.made), type: wb.item && wb.item.weaponType, atk: wb.item && wb.item.atk.join() === bow.atk.join() };
  out.live = PERK_LIVE.has('joinery:75');
  const longbow = lb.item, warbow = wb.item;
  const play = w => { EQ.weapon = w; _bowDrawing = true; const o = { rate: +(bowDrawRate()).toFixed(3), mult: bowNow().mult, speed: bowNow().speed, stam: bowNow().stam, walk: warBowDrawn(), move: commitMoveMult() }; _bowDrawing = false; return o; };
  out.play = { bow: play(bow), long: play(longbow), war: play(warbow) };
  // the arrow leaves at the bow's speed: a full-draw shot's velocity
  const shot = w => { EQ.weapon = w; EQ.ammo = { ...ARROW_IRON, qty: 5 }; stamina = 100; const L = ZB.length; fireArrow(1); const a = ZB[ZB.length - 1], u = a && ZB.length > L ? a.userData : null;
    return u ? { v: +Math.hypot(u.vx, u.vy, u.vz).toFixed(2), m: +(u.roll.m / skillMult('bow') / (1 + attrEff('finesse') * BOW_FINESSE_DMG)).toFixed(2) } : null; };
  out.shot = { bow: shot(bow), war: shot(warbow) }; EQ.weapon = null; EQ.ammo = null;
  // the page's rows
  benchSel = 'warbow'; benchTier = 3; benchDraw(); out.warPage = document.getElementById('bn-right').textContent;
  const d2 = JSON.parse(ssStringify(_buildSavePayload())); BAG.length = 0; _applyLoadData(d2); out.warSaved = (BAG.find(b => b.bowKind === 'warbow') || {}).name;
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
check('an arrow of each metal on the weapons\' curve: Bronze 2–5, Iron 3–6, Steel 4–8, Mithril 5–10, Adamant 6–13, Obsidian 8–17', r.curve.join() === 'Bronze Arrow 2-5,Iron Arrow 3-6,Steel Arrow 4-8,Mithril Arrow 5-10,Adamant Arrow 6-13,Obsidian Arrow 8-17', r.curve);
check('a steel ingot fletches 10 Steel Arrows (4–8), spends the steel and keeps the iron; none without one', r.steel.made && r.steel.n === 10 && r.steel.name === 'Steel Arrow' && r.steel.dmg === '4-8' && r.steel.steel === 0 && r.steel.iron === 1 && r.steel.ammo === 'arrow' && r.steel.col && /steel ingot/.test(r.noSteel), r);
check('ten steel arrows sell for less than the ingot; they go in the quiver', r.steelSale && r.quiver === 'Steel Arrow 10', r);
check('a feather sells for nothing (ten are bought for a gold)', r.featherSale === 0, r.featherSale);
check('the kit at the smith\'s and the goods shop, feathers at the goods shop only', r.shops.smith === 1 && r.shops.goods === 1 && r.shops.inn === 0 && r.shops.feathers === 1 && r.shops.smithFeathers === 0, r.shops);
check('the kit used from the bag opens the bench\'s page, seven rows; Work makes planks', r.page && r.rows === 7 && /2 × Plank/.test(r.pageSaid) && r.closed, r);
check('the page\'s Arrows row picks the metal: Mithril Arrows, +5–10', /Mithril Arrows, \+5–10 on the bow/.test(r.arrowPage) && /Obsidian 0/.test(r.arrowPage), r.arrowPage);
check('the save keeps planks, a spar, a made bow and the kit', r.reload.planks === 2 && r.reload.spar === 1 && r.reload.bow && r.reload.kit, r.reload);
check('Bowyer: no longbow at Joinery 74, nothing spent; the row shut', /Bowyer/.test(r.noBowyer.why) && r.noBowyer.kept && !r.noBowyer.row, r.noBowyer);
check('Bowyer at 75: an Iron Longbow (3.5) and an Iron War Bow (4.5), 3 planks and an ingot each, made, the bow\'s roll', r.bows.lb === 'Iron Longbow' && r.bows.wb === 'Iron War Bow' && r.bows.lbW === 3.5 && r.bows.wbW === 4.5 && r.bows.planks === 0 && r.bows.ingots === 0 && r.bows.made && r.bows.type === 'Bow' && r.bows.atk && r.live, r.bows);
check('the draw: a bow full in 1.10 s, a longbow 1.40, a war bow 1.80', r.play.bow.rate === 1 && r.play.long.rate === +(1.1 / 1.4).toFixed(3) && r.play.war.rate === +(1.1 / 1.8).toFixed(3), r.play);
check('the full draw ×1.40, ×1.70, ×2.00; 28, 33, 36 m/s; 8, 10, 14 stamina a second', [r.play.bow, r.play.long, r.play.war].map(p => p.mult + '/' + p.speed + '/' + p.stam).join() === '1.4/28/8,1.7/33/10,2/36/14', r.play);
check('a war bow drawn walks at a potion\'s pace; a longbow does not', r.play.war.walk && r.play.war.move < 1 && !r.play.long.walk && r.play.long.move === 1, r.play);
check('a war bow\'s full-draw arrow leaves at 36 m/s, ×2.00; a bow\'s at 28, ×1.40', r.shot.bow && r.shot.war && r.shot.bow.v === 28 && r.shot.war.v === 36 && r.shot.bow.m === 1.4 && r.shot.war.m === 2, r.shot);
check('the page\'s War Bow row: 3 planks, full draw in 1.80 s, drawn at a walk', /Iron War Bow/.test(r.warPage) && /3 Planks/.test(r.warPage) && /1\.80 s, ×2\.00, 36 m\/s; 14 stamina/.test(r.warPage) && /at a walk/.test(r.warPage), r.warPage);
check('the save keeps a war bow', r.warSaved === 'Iron War Bow', r.warSaved);
check('Fletcher is live; Joinery has its four perks on the sheet', r.perk, r.perk);
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
