// Survival B, session 1: herbs and brewing (Session 1483; `docs/design/survival-build.md`). The pool: every herb has four
// effects, every effect sits on 4 to 7 herbs (Restore Health and Restore Mana on 8, the herbs that restore them when eaten),
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
const C = r.counts, over = Object.keys(C).filter(f => C[f] < 4 || C[f] > (f === 'restoreHealth' || f === 'restoreMana' ? 8 : 7));
check(`the pool: ${r.herbs} herbs, each four effects of the 22`, r.herbs === 26 && !r.missing.length && !r.four.length && !r.unknownFx.length && Object.keys(C).length === 22);
check(`every effect on 4 to 7 herbs (Restore Health ${C.restoreHealth}, Restore Mana ${C.restoreMana}); no two herbs share more than ${r.most}`, !over.length && r.most <= 2, { over, C });
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
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
