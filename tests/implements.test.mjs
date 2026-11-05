// Magical implements, the sheet's first session (Session 1849; Michael's B on #1111, docs/design/magical-implements.md): the staff,
// the wand and the maul change one form each, never a spell's damage; an emblem's school costs 10% less (20% found), with Thrift at
// most 35%; a Wooden Staff saved before them loads as the Staff of no school.
import { boot, check } from './lib/game.mjs';
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
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
