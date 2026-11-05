// Magical implements, the sheet's first session (Session 1849; Michael's B on #1111, docs/design/magical-implements.md): the staff,
// the wand and the maul change one form each, never a spell's damage; an emblem's school costs 10% less (20% found), with Thrift at
// most 35%; a Wooden Staff saved before them loads as the Staff of no school.
import { boot, check } from './lib/game.mjs';
import { enterDungeon } from './lib/dungeonshot.mjs';
const g = await boot(); const { page } = g;
const r = await page.evaluate(() => {
  const out = {}; const keep = EQ.weapon;
  const st = makeImplement(1, 'staff', 'tine'), wa = makeImplement(1, 'wand', 'uisce'), ma = makeImplement(1, 'wand', 'cloch');
  out.kinds = [st, wa, ma].map(i => ({ name: i.name, k: i.implement, s: i.school, two: !!i.twoHand, atk: i.atk.join('-'), w: i.weight }));
  out.rows = [st, wa, ma].map(i => { EQ.weapon = i; const a = weaponAttack(i); return a === WEAPON_ATTACKS.GreatClub ? 'GreatClub' : a === WEAPON_ATTACKS.Dagger ? 'Dagger' : a === WEAPON_ATTACKS.Mace ? 'Mace' : '?'; });
  out.block = st.blockReduce;
  const forms = () => ({ held: heldReach(), laid: laidReach(), tell: castTell(), sent: sentReachMult() });
  EQ.weapon = null; out.bare = forms(); EQ.weapon = st; out.staff = forms(); EQ.weapon = wa; out.wand = forms(); EQ.weapon = ma; out.maul = forms();
  // the emblem: Caor sent at the school's 50, no buff, no Thrift
  const c = (o) => wordCost('caor', 'sent', null, Object.assign({ skill: 50, buff: 1, tier: 2, thrift: false }, o));
  EQ.weapon = null; out.c0 = c();
  EQ.weapon = st; out.cTine = c(); EQ.weapon = Object.assign({}, st, { found: true }); out.cFound = c(); out.cFoundThrift = c({ thrift: true });
  EQ.weapon = wa; out.cOther = c(); EQ.weapon = null; out.cThrift = c({ thrift: true });
  // the creator's staff is the implement of no school
  const s0 = STARTER_WEAPONS.staff, mk = makeImplement(1, 'staff', null);
  out.starter = ['atk', 'weight', 'twoHand', 'blockReduce', 'implement', 'weaponShape'].every(k => JSON.stringify(s0[k]) === JSON.stringify(mk[k])) && s0.school === null && !s0.spellPower;
  out.spar = (() => { const y = WORLD.sparStaff ? WORLD.sparStaff() : (typeof sparStaff === 'function' ? sparStaff() : null); return y ? { atk: y.atk.join('-'), two: !!y.twoHand, impl: !!y.implement } : null; })();
  // a staff saved before the implements: in hand, in the bag and in the stash (the save never kept its spellPower)
  const old = () => ({ name: 'Wooden Staff', ico: '🥢', type: 'equip', slot: 'weapon', atk: [4, 7], weight: 2.5, tier: 1, material: 'Wooden', weaponShape: 'staff', wType: 'blunt', sellMult: .3, buyPrice: 14 });
  EQ.weapon = old(); BAG.push(old()); stashBag.push(old()); ssSanitizeLoaded();
  const b = BAG[BAG.length - 1], sb = stashBag[stashBag.length - 1];
  out.mig = [EQ.weapon, b, sb].map(i => ({ k: i.implement, two: !!i.twoHand, s: i.school, name: i.name, price: i.buyPrice }));
  BAG.pop(); stashBag.pop();
  // an implement through the save's item record keeps its kind, school and find
  const back = _restoreEnchant(JSON.parse(JSON.stringify(_serItem(Object.assign({}, wa, { found: true })))));
  out.ser = { k: back.implement, s: back.school, f: back.found };
  EQ.weapon = keep; return out; });
console.log(JSON.stringify(r));
check('a staff (two hands), a wand, and a wand of Cloch made a maul', r.kinds[0].k === 'staff' && r.kinds[0].two && r.kinds[1].k === 'wand' && !r.kinds[1].two && r.kinds[2].k === 'maul' && r.kinds[2].s === 'cloch', r.kinds);
check('rows: the staff the Great Club’s (blocks 40%), the wand the Dagger’s, the maul the Mace’s', r.rows.join() === 'GreatClub,Dagger,Mace' && r.block === .4, r.rows);
check('bare hands: Held 4 m, Laid 12 m, the Cast 0.35 s, a bolt’s flight ×1', r.bare.held === 4 && r.bare.laid === 12 && r.bare.tell === .35 && r.bare.sent === 1, r.bare);
check('the staff: Held 5.5 m, Laid 16 m; the Cast and the bolt unchanged', r.staff.held === 5.5 && r.staff.laid === 16 && r.staff.tell === .35 && r.staff.sent === 1, r.staff);
check('the wand and the maul: the Cast 0.28 s, a bolt ×1.5 (45 m for 30); Held and Laid unchanged', [r.wand, r.maul].every(f => f.tell === .28 && f.sent === 1.5 && f.held === 4 && f.laid === 12), [r.wand, r.maul]);
check(`the emblem: Caor sent ${r.c0} bare, ${r.cTine} with Tine’s (−10%), ${r.cFound} found (−20%), ${r.cOther} with Uisce’s`, r.cTine === Math.round(r.c0 * .9) && r.cFound === Math.round(r.c0 * .8) && r.cOther === r.c0, r);
check(`with Thrift: ${r.cThrift} alone (−15%), ${r.cFoundThrift} with a found emblem (−35%, the cap)`, r.cThrift === Math.round(r.c0 * .85) && r.cFoundThrift === Math.round(r.c0 * .65), r);
check('the creator’s Wooden Staff is the staff of no school, as makeImplement builds it', r.starter, r);
check('the yard’s staff is still the one-handed walking-staff', !r.spar || (r.spar.atk === '4-7' && !r.spar.two && !r.spar.impl), r.spar);
check('a Wooden Staff saved before the implements loads as the staff of no school, in hand, in the bag and in the stash', r.mig.every(m => m.k === 'staff' && m.two && m.s === null && m.name === 'Wooden Staff' && m.price === 14), r.mig);
check('an implement keeps its kind, school and find through the save', r.ser.k === 'wand' && r.ser.s === 'uisce' && r.ser.f === true, r.ser);

// S1850 — the tome in the off hand: Impression ×0.8 (was ×0.6), wild a third as often (30% → 10%, 5% with Steady voice; two schools'
// 10% → 3%), every wind-up doubled; equipped from the bag beside a one-handed weapon, refused beside the staff; its emblem as a wand's
const T = await page.evaluate(() => {
  const out = {}, keepW = EQ.weapon, keepO = EQ.offhand, sv = PERK_LIVE.has('tine:25');
  const tome = makeTome(1, 'tine'); out.tome = { name: tome.name, slot: tome.slot, k: tome.implement, s: tome.school, block: tome.block, shield: tome.shieldType };
  EQ.weapon = null; EQ.offhand = null;
  const read = () => ({ mag: TIER_MULT.magnitude.join(), wild: wordWildChance('caor'), mixed: mixedWildChance(), tell: +castTell().toFixed(3), touch: +touchTell().toFixed(3), held: tomeHeld() });
  out.bare = read();
  BAG.push(tome); useItem(BAG.length - 1); out.equipped = EQ.offhand === tome; out.with = read();
  PERK_LIVE.add('tine:25'); const lv = skillsReady().tine.lv; skillsReady().tine.lv = 25; out.steady = wordWildChance('caor'); skillsReady().tine.lv = lv; if (!sv) PERK_LIVE.delete('tine:25');
  EQ.weapon = makeImplement(1, 'wand', null); out.wandTome = +castTell().toFixed(3);
  out.dmg = [1, 2].map(t => spellMag(SPELLS.find(s => s.id === 'caor'), t));
  const c = () => wordCost('caor', 'sent', null, { skill: 50, buff: 1, tier: 2, thrift: false });
  EQ.weapon = null; out.cTome = c(); EQ.weapon = makeImplement(1, 'wand', 'tine', { found: true }); out.cBoth = c();
  EQ.offhand = null; out.cOff = c();
  // beside the staff it is refused, and the staff stows it
  EQ.weapon = makeImplement(1, 'staff', null); BAG.push(makeTome(1, null)); const n = BAG.length; useItem(n - 1); out.refused = EQ.offhand === null && BAG.length === n; BAG.pop();
  EQ.weapon = keepW; EQ.offhand = keepO; return out; });
console.log('tome', JSON.stringify(T));
check('a tome is an off-hand book, no shield, no block', T.tome.slot === 'offhand' && T.tome.k === 'tome' && T.tome.s === 'tine' && T.tome.block == null && !T.tome.shield, T.tome);
check('it is equipped from the bag into the off hand', T.equipped && T.with.held, T);
check(`without it: Impression ×0.6, wild 30%, two schools +10%, the Cast 0.35 s, a touch 0.25 s`, T.bare.mag === '0.6,1,1.3' && T.bare.wild === .3 && T.bare.mixed === .1 && T.bare.tell === .35 && T.bare.touch === .25, T.bare);
check(`with it: Impression ×0.8, wild 10%, two schools +3%, the Cast 0.70 s, a touch 0.50 s`, T.with.mag === '0.8,1,1.3' && T.with.wild === .1 && T.with.mixed === .03 && T.with.tell === .7 && T.with.touch === .5, T.with);
check(`with Steady voice 5% (${T.steady}); with a wand too, the Cast 0.56 s (${T.wandTome})`, T.steady === .05 && T.wandTome === .56, T);
check(`Caor's Impression bolt ${T.dmg[0]}, Comprehension unchanged ${T.dmg[1]}`, Math.abs(T.dmg[0] / T.dmg[1] - .8) < 1e-9, T.dmg);
check(`its emblem as a wand's: Caor ${T.cTome} with a Tine tome, ${T.cBoth} with a found Tine wand too (the better, not both), ${T.cOff} with the wand alone`, T.cTome === 27 && T.cBoth === 24 && T.cOff === 24, T);
check('beside the two-handed staff it is refused', T.refused, T);

// the laid thing: 14 m is past the bare reach, inside the staff's; a pillar stands 20 s bare, 25 s with the staff
const L = await page.evaluate(() => {
  const keep = EQ.weapon, x0 = px, z0 = pz; let spot = null;
  for (let r = 0; r < 60 && !spot; r += 3) for (let a = 0; a < 24 && !spot; a++) { const x = x0 + Math.cos(a / 24 * 6.283) * r, z = z0 + Math.sin(a / 24 * 6.283) * r;
    let ok = true; for (let d = -1; d <= 15 && ok; d += .5) for (let w = -1.5; w <= 1.5 && ok; w += .75) ok = !currentZoneSolid(x + d, z + w) && Math.abs(activeTerrainH(x + d, z + w) - activeTerrainH(x, z)) < .3;
    if (ok) spot = { x, z }; }
  if (!spot) return null;
  px = spot.x; pz = spot.z; jumpY = activeTerrainH(px, pz); yaw = -Math.PI / 2; const out = {};
  const lay = (d) => { laidEnd(); const q = layWord('cloch_ghear', null, px + d, pz); return q && q.ok ? +((LAID.until - playClockS)).toFixed(2) : (q && q.why) || 'none'; };
  EQ.weapon = null; out.bare6 = lay(6); out.bare14 = lay(14);
  EQ.weapon = makeImplement(1, 'staff', null); out.staff6 = lay(6); out.staff14 = lay(14);
  laidEnd(); EQ.weapon = keep; return out; });
console.log('laid', JSON.stringify(L));
check('a spot of open ground to lay on', !!L, L);
if (L) {
  check(`bare: a pillar at 6 m stands ${L.bare6} s; 14 m is too far (${L.bare14})`, L.bare6 === 20 && L.bare14 === 'far', L);
  check(`with the staff: at 6 m it stands ${L.staff6} s (×1.25), and 14 m is in reach (${L.staff14})`, L.staff6 === 25 && L.staff14 === 25, L);
}
// Session 1854 — the orb: guard up, F keeps a Sent or Touched word at its full cost and wind-up; the next F lets it go at once
const O = await page.evaluate(() => {
  const out = {}, keepW = EQ.weapon, keepO = EQ.offhand, now = () => performance.now() / 1000;
  const orb = makeOrb(1, 'tine'); out.orb = { name: orb.name, slot: orb.slot, k: orb.implement, s: orb.school, block: orb.block, shield: orb.shieldType };
  EQ.weapon = makeImplement(1, 'staff', null); EQ.offhand = null; BAG.push(makeOrb(1, null)); let n = BAG.length; useItem(n - 1); out.refused = EQ.offhand === null && BAG.length === n; BAG.pop();
  EQ.weapon = null; BAG.push(orb); useItem(BAG.length - 1); out.equipped = EQ.offhand === orb && orbHeld();
  knownWords = { caor: 2 }; SKILLS.tine = { lv: 50, p: 0 }; spellBook.length = 0; bookSelect(bookAdd('caor'));
  const clear = () => { for (const k2 in K) K[k2] = false; castT = 0; _castFreeAt = 0; _castReleaseAt = 0; spCd = 0; ORB_KEPT = null; TOUCH_PEND = null; };
  const sm = showMsg; window._orbSaid = []; showMsg = t => window._orbSaid.push(t);
  out.cost = wordCost('caor', 'sent', null, { tier: effTier('caor') });
  clear(); mana = 100; blocking = true; const z0 = ZB.length, t0 = now(); castSpell();
  out.keep = { kept: !!ORB_KEPT && ORB_KEPT.word === 'caor' && ORB_KEPT.form === 'sent', paid: 100 - mana, tell: +(_castReleaseAt - t0).toFixed(2), bolts: ZB.length - z0 };
  // without the guard the orb is a plain off hand: F casts as ever
  window._orbFree = () => { clear(); mana = 100; blocking = false; const z = ZB.length, t = now(); castSpell(); return { kept: !!ORB_KEPT, tell: +(_castReleaseAt - t).toFixed(2), paid: 100 - mana }; };
  showMsg = sm; return out; });
// the wind-up and its recovery run on the clock; then the next F lets it go (the hand's animation is the loop's, and cosmetic: cleared as wordforms does)
await page.waitForFunction(() => !castRecovering(), null, { timeout: 15000, polling: 50 });
await page.evaluate(() => { castT = 0; });
const R = await page.evaluate(() => {
  const now = () => performance.now() / 1000, sm = showMsg; showMsg = t => window._orbSaid.push(t);
  const z0 = ZB.length; mana = 100; blocking = false; spCd = 5; const t0 = now(); castSpell();
  const out = { kept: !!ORB_KEPT, paid: 100 - mana, tell: +(_castReleaseAt - t0).toFixed(2), rec: +(_castFreeAt - t0).toFixed(2) };
  showMsg = sm; window._orbZ0 = z0; return out; });
await page.waitForFunction(() => ZB.length > window._orbZ0, null, { timeout: 5000, polling: 20 }).catch(() => {});
const R2 = await page.evaluate(() => ({ bolts: ZB.length - window._orbZ0, spell: ZB.length ? ZB[ZB.length - 1].userData.spell.id : null, free: window._orbFree() }));
// the charge's losses: 60 s of play, a change of place, the orb leaving the hand, and the touched form kept and let go
const X = await page.evaluate(() => {
  const out = {}, sm = showMsg; showMsg = () => {};
  const keepNow = () => { for (const k2 in K) K[k2] = false; castT = 0; _castFreeAt = 0; _castReleaseAt = 0; spCd = 0; ORB_KEPT = null; TOUCH_PEND = null; mana = 100; blocking = true; castSpell(); blocking = false; return !!ORB_KEPT; };
  out.k59 = keepNow(); playClockS += 59.5; orbTick(); out.at59 = !!ORB_KEPT; playClockS += 1; orbTick(); out.at61 = !!ORB_KEPT;
  out.kPlace = keepNow(); ORB_KEPT.key = 'elsewhere'; orbTick(); out.place = !!ORB_KEPT;
  const o = EQ.offhand; out.kHand = keepNow(); EQ.offhand = null; orbTick(); out.hand = !!ORB_KEPT; EQ.offhand = o;
  formsGranted.push('touched'); const mt = bookMake('touched', 'caor'); bookSelect(mt.i);
  out.kTouch = keepNow() && ORB_KEPT.form === 'touched'; out.touchPaid = 100 - mana;
  out.touchPend = !!TOUCH_PEND; castT = 0; _castFreeAt = 0; _castReleaseAt = 0; ORB_KEPT.ready = 0;
  const t0 = performance.now() / 1000; mana = 100; castSpell(); out.touchRel = { kept: !!ORB_KEPT, pend: !!TOUCH_PEND, at: TOUCH_PEND ? +(TOUCH_PEND.at - t0).toFixed(2) : null, paid: 100 - mana };
  TOUCH_PEND = null; out.kSleep = keepNow(); showMsg = sm; return out; });
await page.evaluate(() => restAtBed(1));
const slept = await page.waitForFunction(() => ORB_KEPT === null, null, { timeout: 8000, polling: 100 }).then(() => true).catch(() => false);
await page.evaluate(() => { EQ.offhand = null; spellBook.length = 0; });
console.log('orb', JSON.stringify({ O, R, R2, X, slept }));
check('an orb is an off-hand glass, no shield, no block', O.orb.slot === 'offhand' && O.orb.k === 'orb' && O.orb.s === 'tine' && O.orb.block == null && !O.orb.shield, O.orb);
check('beside the two-handed staff it is refused; otherwise it equips from the bag', O.refused && O.equipped, O);
check(`guard up, F keeps Caor sent: paid ${O.keep.paid} (its cost ${O.cost}, Tine’s emblem in it), the full 0.35 s wind-up (${O.keep.tell}), no bolt`, O.keep.kept && O.keep.paid === O.cost && O.keep.tell === .35 && O.keep.bolts === 0, O.keep);
check(`the next F lets it go at once: no mana (${R.paid}), wind-up ${R.tell} s, the 0.30 s recovery (${R.rec}), past a cooldown, a Caor bolt flies`, !R.kept && R.paid === 0 && R.tell === 0 && R.rec === .3 && R2.bolts === 1 && R2.spell === 'caor', { R, R2 });
check(`guard down, the orb keeps nothing: F casts as ever (wind-up ${R2.free.tell} s, paid ${R2.free.paid})`, !R2.free.kept && R2.free.tell === .35 && R2.free.paid === O.cost, R2.free);
check('the charge holds 59.5 s of play and is gone past 60 s', X.k59 && X.at59 && !X.at61, X);
check('a change of place or the orb leaving the hand loses it', X.kPlace && !X.place && X.kHand && !X.hand, X);
check(`a Touched entry is kept at its cost (${X.touchPaid}) and lands at once on release (${JSON.stringify(X.touchRel)})`, X.kTouch && X.touchPaid > 0 && !X.touchPend && !X.touchRel.kept && X.touchRel.pend && X.touchRel.at === 0 && X.touchRel.paid === 0, X);
check('sleep empties the orb', X.kSleep && slept, { kSleep: X.kSleep, slept });
// the sheet's third session (Session 1858): the Mages' Guild's stock and one gate in three's orb
await g.intoWorld();
const GS = await page.evaluate(() => {
  const nov = guildImplements('mark', 0), ad = guildImplements('aurenne', 1), row = i => [i.implement, i.school, i.make, i.buyPrice, i.tier];
  let n = 0; for (let s = 1; s <= 3000; s++) if (gateOrbDue({ seed: s * 7919 })) n++;
  let has = 0, not = 0; for (let s = 4001; s < 4500 && (!has || !not); s++) { if (gateOrbDue({ seed: s })) has = has || s; else not = not || s; }
  return { nov: nov.map(row), ad: ad.map(row), names: ad.slice(0, 3).map(i => i.name), orbs: ad.filter(i => i.implement === 'orb').length,
    hall: implementsFor({ type: 'guild_m', siteId: 'dunmore' }).map(i => i.make), other: implementsFor({ type: 'armor' }).length, share: n / 3000, has, not }; });
await enterDungeon(page, { theme: 'haunted', size: 'medium', seed: GS.has });
const GO = await page.evaluate(() => { const o = CHESTS.filter(c => c.items.some(i => i.gateOrb != null)), c = o[0], it = c && c.items.find(i => i.gateOrb != null);
  const deep = Math.max(...CHESTS.map(c => c.floor || 1)), out = { gate: !!window._lastGen?.gate, n: o.length, deep: c && (c.floor || 1) === deep, treasure: c && c.treasure,
    orb: it && { k: it.implement, s: it.school, want: gateOrbSchool(currentPortal), found: it.found, ench: it.enchantId, name: it.name, price: it.buyPrice, tier: it.tier } };
  const old = makeOrb(1, 'tine'); old.buyPrice = 8; const keepO = EQ.offhand; EQ.offhand = old; BAG.push(Object.assign(makeOrb(1, 'solas'), { buyPrice: 8 }));
  out.ps = !!foundPlaceSchool() && foundPlaceSchool() === gateOrbSchool(currentPortal); ssSanitizeLoaded(); out.mig = [EQ.offhand.buyPrice, BAG[BAG.length - 1].buyPrice, makeOrb(5, 'tine').buyPrice]; BAG.pop(); EQ.offhand = keepO;
  const sm = showMsg; showMsg = () => {}; openLoot(c); const n0 = BAG.length; takeLootItem(c.items.indexOf(it)); closeLoot(); showMsg = sm;
  const got = BAG[BAG.length - 1]; out.took = BAG.length === n0 + 1 && got.implement === 'orb' && got.gateOrb == null; out.ws = !!(worldState.gateOrbs && worldState.gateOrbs[currentPortal.seed]);
  const back = _restoreEnchant(JSON.parse(JSON.stringify(_serItem(got)))); out.back = [back.make, back.school, back.found, back.enchantId || (back.enchant && back.enchant.id)]; BAG.pop(); return out; });
await enterDungeon(page, { theme: 'haunted', size: 'medium', seed: GS.has });
const again = await page.evaluate(() => CHESTS.filter(c => c.items.some(i => i.implement === 'orb')).length);
await enterDungeon(page, { theme: 'ruins', size: 'medium', seed: GS.not });
const none = await page.evaluate(() => CHESTS.filter(c => c.items.some(i => i.implement === 'orb')).length);
console.log('guild', JSON.stringify({ GS: Object.assign({}, GS, { nov: GS.nov.length, ad: GS.ad.length }), GO, again, none }));
const kinds = r => r.map(x => x[0] + ':' + x[1]).join(' ');
check(`the guild sells from Novice a staff (60) and a wand (80; Cloch's the maul) in each of the six emblems, ${GS.nov.length} pieces, Wooden, in the island's make`, GS.nov.length === 12 && GS.nov.every(x => x[2] === 'mark' && x[4] === 1 && x[3] === (x[0] === 'staff' ? 60 : 80)) && GS.nov.filter(x => x[0] === 'maul').length === 1 && GS.nov.find(x => x[0] === 'maul')[1] === 'cloch', kinds(GS.nov));
check(`from Adept the tome too, 120 (${GS.ad.length} pieces: ${GS.names.join(', ')}); never an orb`, GS.ad.length === 18 && GS.ad.filter(x => x[0] === 'tome').every(x => x[3] === 120) && GS.ad.filter(x => x[0] === 'tome').length === 6 && GS.orbs === 0, kinds(GS.ad));
check(`a Mages' Guild counter in Dunmore stocks the Gatelands' make; no other counter stocks them`, GS.hall.length === 12 && GS.hall.every(m => m === 'gatelands') && GS.other === 0, GS);
check(`one gate in three keeps an orb (${GS.share.toFixed(3)} of 3,000 seeds)`, Math.abs(GS.share - 1 / 3) < .03, GS.share);
check(`in such a gate the deepest floor's treasure chest holds a found orb of the gate's school with one enchant (${GO.orb && GO.orb.name})`, GO.gate && GO.n === 1 && GO.deep && GO.treasure && GO.orb.k === 'orb' && GO.orb.s === GO.orb.want && GO.orb.found && ['mp_regen', 'magic_boost', 'fortify_int'].includes(GO.orb.ench), GO);
check('taken, it is the gate\'s for good: the next visit finds none; the save keeps its make, school, find and enchant', GO.took && GO.ws && again === 0 && GO.back[0] && GO.back[1] === GO.orb.s && GO.back[2] === true && GO.back[3] === GO.orb.ench, { GO, again });
check('a gate that keeps none has none', none === 0, none);
// S1884 — the orb's price (Michael's A on #1176): the tome's guild price, 120, or a finer make's material value where that is more; a saved orb is repriced
check(`a found orb is priced as the tome, 120 (this one ${GO.orb && GO.orb.price}, tier ${GO.orb && GO.orb.tier}); a saved one at 8 is 120 after a load (${GO.mig}); a tier 5 orb keeps its material's 413`, GO.orb.price === Math.max(120, Math.round([0, 5, 20, 40, 75, 275][GO.orb.tier] * 1.5)) && GO.mig[0] === 120 && GO.mig[1] === 120 && GO.mig[2] === 413, GO);

// S1885 — found implements (Michael's A on #1169): a lair master keeps one in four (on the lair's seed), a chest's weapon roll of tier 4
// or finer is one in twenty, of the gate's school in a gate, else any; found, with one of the orb's enchants
const FI = await page.evaluate(() => {
  const out = {}; let has = 0, not = 0; for (let s = 5001; s < 5400 && (!has || !not); s++) { if (seededRng('found-master', s)() < .25) has = has || s; else not = not || s; }
  let m = 0; for (let s = 1; s <= 4000; s++) if (seededRng('found-master', s * 104729)() < IMPLEMENT.foundMaster) m++; out.master = m / 4000; out.has = has; out.not = not;
  const roll = (n, tier, kind) => { let imp = 0, wpn = 0, ok = true; withLootRng(seededRng('foundchest', tier + kind), () => withLootTier(4, () => { for (let i = 0; i < n; i++) { const it = rollLoot({ hp: 6 }, null, kind);
    if (!it || it.slot !== 'weapon' && it.slot !== 'offhand') continue; if (it.found && implementOf(it)) { imp++; ok = ok && (it.tier || 0) >= 4 && !!it.school && IMPLEMENT.orbEnchants.includes(it.enchantId); } else if (it.slot === 'weapon' && (it.tier || 0) >= 4) wpn++; } })); return { imp, wpn, ok }; };
  let oe = 0; for (let k = 1; k <= 300; k++) if (gateOrbItem({ seed: k * 31, diffScale: { hp: 1 } }, 'tine', 2, null).enchantId) oe++; out.orbEnch = oe;
  out.chest = roll(30000, 4, 'chest'); out.corpse = roll(6000, 4, 'corpse');
  const lo = { imp: 0 }; withLootRng(seededRng('foundlo', 1), () => withLootTier(1, () => { for (let i = 0; i < 6000; i++) { const it = rollLoot({ hp: .5 }, null, 'chest'); if (it && it.found && implementOf(it) && it.tier < 4) lo.imp++; } })); out.lo = lo.imp;
  const fx = withLootRng(seededRng('fx', 3), () => foundImplement(5, 'tine')); out.fx = { k: implementOf(fx), s: fx.school, found: fx.found, ench: fx.enchantId, name: fx.name, desc: /20% less/.test(fx.desc) };
  const st = withLootRng(seededRng('fx', 9), () => { for (let i = 0; i < 50; i++) { const f = foundImplement(4, null); if (f.slot === 'weapon' && f.enchant) return f; } });
  const keep = EQ.weapon; EQ.weapon = st; _armorBonusDirty = true; let threw = null; try { out.strike = applyWeaponEnchant(10, { hp: 50, maxHp: 50, hpFg: { scale: {}, position: {} } }); } catch (e) { threw = String(e); }
  out.threw = threw; out.bonus = Object.entries(getArmorEnchantBonuses()).filter(([k, v]) => v).map(([k]) => k); EQ.weapon = keep; _armorBonusDirty = true;
  return out; });
const lairIn = async (seed) => { await page.evaluate((seed) => { window._prevDScene = typeof dScene !== 'undefined' ? dScene : null;
    goToDungeon(Object.assign({}, PORTALS[0], { theme: 'deep', seed, size: 'medium', interior: 'cave', zone: 'world', tutorial: false, lair: { place: 'Test', boss: 'Troll King' } })); }, seed);
  for (let k = 0; k < 60 && !(await page.evaluate(() => activeZoneId === 'dungeon' && scene === dScene && dScene !== window._prevDScene && ENEMIES.length > 0)); k++) await page.waitForTimeout(500);
  await page.waitForTimeout(1000); };
const hoardOf = () => page.evaluate(() => { const h = CHESTS.find(c => /:hoard$/.test(c.id)); const f = h && h.items.find(i => implementOf(i));
  return { ps: foundPlaceSchool(), n: h ? h.items.length : -1, f: f && { k: implementOf(f), s: f.school, found: f.found, ench: f.enchantId, fn: !!(f.enchant && f.enchant.apply), name: f.name, tier: f.tier, stats: f.enchantStats } }; });
await lairIn(FI.has); const LH = await hoardOf();
await page.evaluate((seed) => { worldState.masters = JSON.parse(JSON.stringify(worldState.masters)); }, FI.has);
await page.evaluate(() => goToOW()); for (let k = 0; k < 40 && (await page.evaluate(() => activeZoneId === 'dungeon')); k++) await page.waitForTimeout(500); await page.waitForTimeout(1500);
await lairIn(FI.has); const LH2 = await hoardOf();
await lairIn(FI.not); const LN = await hoardOf();
console.log('found', JSON.stringify({ FI, LH, LH2, LN }));
check(`a lair master keeps a found implement in one hoard in four (${FI.master.toFixed(3)} of 4,000 seeds)`, Math.abs(FI.master - .25) < .025, FI.master);
check(`in such a lair the hoard holds it: ${LH.f && LH.f.name} (${LH.f && LH.f.k}, ${LH.f && LH.f.s}), found, with one of the orb's enchants; a lair whose roll misses holds none`, !!LH.f && LH.f.found && !!LH.f.s && ['mp_regen', 'magic_boost', 'fortify_int'].includes(LH.f.ench) && LH.f.fn && LN.n > 0 && !LN.f, { LH, LN });
check('through the save\'s JSON the hoard\'s piece keeps its enchant (put back by id) and its numbers', !!LH2.f && LH2.f.fn && LH2.f.name === LH.f.name && JSON.stringify(LH2.f.stats) === JSON.stringify(LH.f.stats), { LH, LH2 });
const share = FI.chest.imp / (FI.chest.imp + FI.chest.wpn);
check(`a chest's weapon roll of tier 4 or finer is a found implement one time in twenty (${FI.chest.imp} of ${FI.chest.imp + FI.chest.wpn}, ${share.toFixed(3)}), each found, of a school, enchanted`, Math.abs(share - .05) < .015 && FI.chest.ok, FI.chest);
check(`every gate orb carries its enchant (${FI.orbEnch} of 300 seeds; the draw sat inside find's test and missed some, Session 1889)`, FI.orbEnch === 300, FI.orbEnch);
check(`a corpse never gives one (${FI.corpse.imp}); nor does a chest's piece under tier 4 (${FI.lo})`, FI.corpse.imp === 0 && FI.lo === 0, { c: FI.corpse, lo: FI.lo });
check(`a gate's chest gives the gate's school (the gate's own read in the gate; none in a lair): foundImplement(5, 'tine') is ${FI.fx.name}, Tine's, found, 20% off`, GO.ps && LN.ps === null && FI.fx.s === 'tine' && FI.fx.found && FI.fx.desc && ['staff', 'wand', 'maul', 'tome'].includes(FI.fx.k), { fx: FI.fx, gate: GO.ps, lair: LN.ps });
check(`a found staff or wand's armour enchant counts in hand (${FI.bonus.join(', ')}) and its strike is plain, no throw`, !FI.threw && FI.strike === null && FI.bonus.length >= 1, FI);

// S1862 — the hold in both views (the sheet's second bodies session): the orb carried up before the waist, raised before the chest with the
// guard, drawn back past the hip while it keeps a word, its light brighter as it keeps one; the tome lifted before the chest in a cast. In
// first person the off hand draws the orb or the tome and moves through the same states
const H = await page.evaluate(() => {
  const out = {}, keepT = thirdPerson; EQ.weapon = makeImplement(1, 'wand', 'uisce'); EQ.offhand = makeOrb(1, 'tine'); EQ.offhand.make = 'mark';
  thirdPerson = true; tpEnsure();
  const at = (set) => { blocking = false; ORB_KEPT = null; castT = 0; set();
    for (let i = 0; i < 40; i++) tpUpdate(1 / 60, { moving: false, sprinting: false, camY: CAM.position.y, now: performance.now(), roll: null });
    const R = TP.rig; R.root.updateMatrixWorld(true); const h = R.handL.getWorldPosition(new THREE.Vector3()).sub(R.root.getWorldPosition(new THREE.Vector3()));
    const f = new THREE.Vector3(Math.sin(R.root.rotation.y), 0, Math.cos(R.root.rotation.y)); const gm = R.orbG && R.orbG.userData.glowMats.find(m => !m.transparent);
    return { y: +h.y.toFixed(2), fwd: +h.dot(f).toFixed(2), glow: gm ? +gm.color.r.toFixed(2) : null, shared: gm === WPN_MAT.glow }; };
  out.rest = at(() => {}); out.raised = at(() => { blocking = true; }); out.kept = at(() => { ORB_KEPT = { word: 'caor', form: 'sent', ready: 0, at: playClockS, key: laidKey() }; });
  out.hang = (() => { const e = EQ.offhand; EQ.offhand = null; const r = at(() => {}); EQ.offhand = e; return r; })();
  thirdPerson = false; buildShieldViewmodel(); out.fp = vmShield && vmShield.userData.impl;
  const fp = (set) => { blocking = false; ORB_KEPT = null; castT = 0; set(); for (let i = 0; i < 60; i++) vmImplPose(1 / 60); return vmShield.userData.pose.position.toArray().map(v => +v.toFixed(2)); };
  out.fpRest = fp(() => {}); out.fpRaised = fp(() => { blocking = true; }); out.fpCast = fp(() => { castT = .3; });
  EQ.offhand = makeTome(1, 'solas'); thirdPerson = true; tpEnsure(); out.tomeRest = at(() => {}); out.tomeRead = at(() => { castT = .3; });
  thirdPerson = false; buildShieldViewmodel(); out.fpTome = vmShield && vmShield.userData.impl; out.fpRead = fp(() => { castT = .3; });
  blocking = false; ORB_KEPT = null; castT = 0; EQ.offhand = null; buildShieldViewmodel(); thirdPerson = keepT; return out; });
console.log('hold', JSON.stringify(H));
check(`third person, the orb: carried before the waist (hand ${H.rest.y} m up, ${H.rest.fwd} ahead), raised before the chest (${H.raised.y}, ${H.raised.fwd}), kept behind the hip (${H.kept.fwd})`, H.rest.fwd > H.hang.fwd + .05 && H.raised.y > H.rest.y + .1 && H.raised.fwd > H.rest.fwd && H.kept.fwd < H.hang.fwd - .05, H);
check(`the orb's light is its own: ${H.rest.glow} at rest, ${H.raised.glow} raised, ${H.kept.glow} keeping a word`, H.rest.glow === 1 && H.raised.glow > 1.1 && H.kept.glow > 1.3 && !H.rest.shared, H);
check(`the tome is lifted before the chest in a cast (hand ${H.tomeRest.y} → ${H.tomeRead.y} m)`, H.tomeRead.y > H.tomeRest.y + .2 && H.tomeRead.fwd > H.tomeRest.fwd, H);
check('first person draws the orb and the tome in the off hand, raised, pushed out in a cast and lifted to read', H.fp === 'orb' && H.fpTome === 'tome' && H.fpRest.every(v => v === 0) && H.fpRaised[1] > .1 && H.fpCast[2] < -.15 && H.fpRead[1] > .1, H);
// S1864 — the kept word leaves the orb in the left hand: in third person from the left hand's bone, in first person 0.3 m to the
// left of your centre, where a cast of your own leaves the right
await page.evaluate(() => { const push = Array.prototype.push; for (const A of [ZB, BALLS]) A.push = function (fb) { window._spawns = (window._spawns || []).concat([fb.position.clone()]); return push.apply(this, arguments); };
  window._where = { ow: isOverworldZone(), floor: currentFloor }; });
const SH = [];
for (const tp of [true, false]) {
  await page.evaluate((tp) => {
    for (const k2 in K) K[k2] = false; EQ.offhand = makeOrb(1, 'tine'); thirdPerson = tp; if (tp) { tpEnsure(); for (let i = 0; i < 20; i++) tpUpdate(1 / 60, { moving: false, sprinting: false, camY: CAM.position.y, now: performance.now(), roll: null }); }
    castT = 0; _castFreeAt = 0; _castReleaseAt = 0; spCd = 0; TOUCH_PEND = null; HELD = null; mana = 100; window._spawns = [];
    bookSelect(bookAdd('caor'));
    ORB_KEPT = { word: 'caor', form: 'sent', rider: null, ready: 0, at: playClockS, key: laidKey() }; window._rel = orbRelease(); }, tp);
  await page.waitForFunction(() => window._spawns.length > 0, null, { timeout: 5000, polling: 20 }).catch(() => {});
  SH.push(await page.evaluate((tp) => {
    const p = window._spawns[0], out = { tp, rel: window._rel, n: window._spawns.length };
    if (!p) return out;
    out.lat = +((p.x - px) * rgtX + (p.z - pz) * rgtZ).toFixed(2);
    if (tp && TP.rig) { TP.rig.root.updateMatrixWorld(true); const L = TP.rig.handL.getWorldPosition(new THREE.Vector3()), R = TP.rig.handR.getWorldPosition(new THREE.Vector3());
      out.dL = +p.distanceTo(L).toFixed(2); out.dR = +p.distanceTo(R).toFixed(2); }
    castT = 0; return out; }, tp));
  await page.waitForFunction(() => !castRecovering(), null, { timeout: 15000, polling: 50 }).catch(() => {});
}
const WH = await page.evaluate(() => { delete ZB.push; delete BALLS.push; thirdPerson = false; EQ.offhand = null; return window._where; });
console.log('orb hand', JSON.stringify(WH), JSON.stringify(SH));
check(`the orb's word leaves the left hand: third person ${SH[0].dL} m from the left hand (${SH[0].dR} from the right), first person ${-SH[1].lat} m to your left`,
  SH[0].rel && SH[0].n === 1 && SH[0].dL < .05 && SH[0].dR > .2 && SH[1].rel && SH[1].n === 1 && Math.abs(SH[1].lat + .3) < .02, SH);

// S1863 — the rule, not a percentage: the shop's row, the loot list, the bag's tooltip and the worn slot each say what the implement
// changes, in metres and seconds, with its emblem's cut; a sword's row says none of it
const RU = await page.evaluate(() => {
  const keep = { w: EQ.weapon, o: EQ.offhand }, pieces = { staff: makeImplement(1, 'staff', 'tine'), wand: makeImplement(1, 'wand', 'uisce'),
    maul: makeImplement(1, 'wand', 'cloch'), tome: makeTome(1, 'solas'), orb: makeOrb(1, 'gaoth', { found: true }), sword: makeItem(1, WEAPON_TYPES.find(t => t.type === 'Sword'), null, false) };
  const out = {};
  for (const [k, it] of Object.entries(pieces)) {
    const row = shopRowHTML(it, 'buy', 50, true, false, []), sell = shopRowHTML(it, 'sell', 20, true, false, []);
    BAG.push(it); showBagTooltip(BAG.length - 1, { clientX: 10, clientY: 10 }); const tip = document.getElementById('bag-tooltip').textContent; BAG.pop();
    const slot = it.slot; EQ[slot] = it; hoverEqSlot(slot); const worn = document.getElementById('eq-tooltip-stat').textContent;
    out[k] = { rule: implementRule(it), row: row.includes('sh-impl') && row.includes(implementRule(it) || '§'), sell: sell.includes('sh-impl'), loot: lootItemDesc(it), tip, worn };
  }
  EQ.weapon = keep.w; EQ.offhand = keep.o; return out; });
console.log('rule', JSON.stringify(RU));
check(`each implement's rule in a line: staff "${RU.staff.rule}", wand "${RU.wand.rule}", tome "${RU.tome.rule}", found orb "${RU.orb.rule}"`,
  RU.staff.rule === 'Held 5.5 m · Laid 16 m, lasts ×1.25 · Tine −10% mana' && RU.wand.rule === 'Sent 45 m · wind-up 0.28 s · Uisce −10% mana'
  && RU.maul.rule === 'Sent 45 m · wind-up 0.28 s · Cloch −10% mana' && RU.tome.rule === 'Impression ×0.8, wild 10% · wind-up ×2 · Solas −10% mana'
  && RU.orb.rule === 'Keeps a cast 60 s · Gaoth −20% mana' && RU.sword.rule === '', RU);
check('the shop\'s row says it on both sides; the loot list, the bag\'s tooltip and the worn slot say it too; a sword says none of it; the tooltip\'s weight reads Light, Medium or Heavy, never undefined',
  ['staff', 'wand', 'maul', 'tome', 'orb'].every(k => RU[k].row && RU[k].sell && RU[k].loot.includes(RU[k].rule) && RU[k].tip.includes(k === 'orb' ? 'keeps the cast a minute' : k === 'tome' ? 'Read aloud' : k === 'staff' ? 'Held reaches 5.5 m' : 'A sent spell flies') && RU[k].worn.includes(RU[k].rule))
  && !/undefined/.test(RU.staff.tip + RU.wand.tip + RU.sword.tip) && RU.staff.tip.includes('Heavy · 28 stamina') && RU.wand.tip.includes('Light · 11 stamina') && RU.sword.tip.includes('Medium · 21 stamina')
  && !RU.sword.row && !RU.sword.sell && !/Held|Sent|Keeps/.test(RU.sword.loot + RU.sword.tip + RU.sword.worn) && RU.staff.loot.startsWith('ATK '), RU);

// S1871 — the counter (critic 5 Nov): an implement's badge draws its own glyph (staff 🥢, wand 🪄, maul 🔨, tome 📖, orb 🔮; a
// sword still ⚔), and a staff's row at 1280 px shows its whole name: the 2H badge stays, the second "Two-handed" note is gone
const CT = await page.evaluate(() => {
  const keep = EQ.offhand; EQ.offhand = null;
  const glyph = it => { const d = document.createElement('div'); d.innerHTML = iconHTML(it); return d.textContent; };
  const p = { staff: makeImplement(1, 'staff', 'cloch'), wand: makeImplement(1, 'wand', 'uisce'), maul: makeImplement(1, 'wand', 'cloch'),
    tome: makeTome(1, 'solas'), orb: makeOrb(1, 'gaoth'), sword: makeItem(1, WEAPON_TYPES.find(t => t.type === 'Sword'), null, false) };
  const out = { g: {} }; for (const [k, it] of Object.entries(p)) out.g[k] = glyph(it);
  p.staff.name += ' of Cloch';
  const list = document.createElement('div'); list.style.cssText = 'position:fixed;left:14px;top:100px;width:620px';
  const row = document.createElement('div'); row.className = 'sh-row'; row.innerHTML = shopRowHTML(p.staff, 'buy', 57, true, false, []);
  list.appendChild(row); document.getElementById('shop-panel')?.appendChild(list) || document.body.appendChild(list);
  const nm = row.querySelector('.sh-name-text');
  out.row = { text: row.textContent.replace(/\s+/g, ' ').trim(), cut: nm.scrollWidth > nm.clientWidth + 1, w: nm.clientWidth, sw: nm.scrollWidth, badge: !!row.querySelector('.sh-2h') };
  list.remove(); EQ.offhand = keep; return out; });
console.log('counter', JSON.stringify(CT));
check(`an implement's badge draws its own glyph: staff ${CT.g.staff}, wand ${CT.g.wand}, maul ${CT.g.maul}, tome ${CT.g.tome}, orb ${CT.g.orb}, sword ${CT.g.sword}`,
  CT.g.staff === '🥢' && CT.g.wand === '🪄' && CT.g.maul === '🔨' && CT.g.tome === '📖' && CT.g.orb === '🔮' && CT.g.sword === '⚔', CT.g);
check(`a staff's row shows its whole name (${CT.row.sw} px of ${CT.row.w}), the 2H badge and no second "Two-handed" note`,
  !CT.row.cut && CT.row.text.includes('Wooden Staff of Cloch') && CT.row.badge && !/Two-handed/.test(CT.row.text), CT.row);
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
