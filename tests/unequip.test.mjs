// Empty slots and fists (Session 174): every equipment slot can be emptied, the starter clothes included, and an
// empty weapon slot is your fists (2–4, a light quick swing). Before, the starter kit could not be taken off and
// taking off a weapon put a Rusty Sword in your hand. Gear taken off goes to the bag as gear that can be worn again.
import { boot, check } from './lib/game.mjs';
const g = await boot(); const { page } = g;
await g.intoWorld();

const r = await page.evaluate(() => {
  const out = { start: Object.fromEntries(['chest', 'legs', 'feet', 'weapon'].map(k => [k, EQ[k] && EQ[k].name])) };
  const armour = () => Object.values(EQ).reduce((a, v) => a + (v && v.def ? v.def : 0), 0);
  out.defBefore = armour();
  const swordSwing = _weaponSwingFactor(), swordName = EQ.weapon && EQ.weapon.name;
  // hit a dummy in front of the player with every roll pinned
  const rnd = Math.random; Math.random = () => .5;
  const hit = () => { const mesh = new THREE.Group(); scene.add(mesh); const e = { name: 'Dummy', x: px + fwdX * 1.2, z: pz + fwdZ * 1.2, y: 0, hp: 1e6, maxHp: 1e6, def: 0, mesh, alert: false, ai: 'melee' };
    ZE.push(e); _resolveZoneStrike(false); ZE.splice(ZE.indexOf(e), 1); scene.remove(mesh); return 1e6 - e.hp; };
  const keepAttr = { ...ATTRS }; for (const k in ATTRS) ATTRS[k] = 0;
  out.swordHit = hit();
  hubOpen && hubOpen();
  for (const k of ['chest', 'legs', 'feet', 'weapon']) clickEqSlot(k);
  out.after = Object.fromEntries(['chest', 'legs', 'feet', 'weapon'].map(k => [k, EQ[k] && EQ[k].name]));
  out.defAfter = armour();
  out.bag = BAG.filter(it => [out.start.chest, out.start.legs, out.start.feet, swordName].includes(it.name)).map(it => ({ name: it.name, type: it.type, slot: it.slot }));
  out.rusty = BAG.some(it => it.name === 'Rusty Sword') || (EQ.weapon && EQ.weapon.name === 'Rusty Sword');
  out.fistHit = hit(); out.fistSwing = _weaponSwingFactor(); out.swordSwing = swordSwing; out.level = level;
  renderInv(); out.sa = document.getElementById('sa').textContent;
  hoverEqSlot('weapon'); out.tip = document.getElementById('eq-tooltip-stat').textContent;
  Math.random = rnd; Object.assign(ATTRS, keepAttr);
  // a saved empty hand stays empty; then put the tunic back on from the bag
  const d = JSON.parse(JSON.stringify(_buildSavePayload())); out.savedWeapon = d.EQ && ('weapon' in d.EQ) ? d.EQ.weapon : 'missing';
  _applyLoadData(d); out.loadedWeapon = EQ.weapon && EQ.weapon.name;
  const i = BAG.findIndex(it => it.name === out.start.chest); useItem(i); out.reworn = EQ.chest && EQ.chest.name; out.defReworn = armour();
  return out;
});
console.log(JSON.stringify(r));
check('the starter clothes and the weapon all come off', r.start.chest && r.start.weapon && Object.values(r.after).every(v => !v) && r.defAfter === 0 && r.defBefore > 0, r);
check('what came off is in the bag as gear with its slot, and no Rusty Sword appears', r.bag.length === 4 && r.bag.every(b => b.type === 'equip' && b.slot) && !r.rusty, r);
check('fists hit for less than the starting weapon', r.fistHit > 0 && r.fistHit < r.swordHit, r);
check('fists swing faster than the starting weapon', r.fistSwing < r.swordSwing, r);
check('the sheet and the slot show the fists’ 2–4', r.sa === `${2 + Math.floor(r.level * 1.5)}–${4 + Math.floor(r.level * 1.5)}` && /Fists/.test(r.tip), r);
check('a save with an empty hand loads with an empty hand', r.savedWeapon === null && !r.loadedWeapon, r);
check('the tunic can be put back on from the bag', r.reworn === r.start.chest && r.defReworn > 0, r);
// Session 2710: an item is heard by what it is (Michael, 25 Nov): a take from a container or a put into the stash is a sweep and the
// thing's touch, Take all is one sound; equipping is the thing put on (a blade drawn, plate's clang, mail's rings, leather's creak, a
// robe's rustle, a ring's tink); drinking, eating and chewing a herb each have their own voice. Each makes sound nodes on the audio clock.
const snd = await page.evaluate(() => { const out = { err: null }; try { initAudio(); } catch (e) { out.err = 'init ' + e.message; }
  let nodes = 0; const cs = AX && AX.createBufferSource.bind(AX), co = AX && AX.createOscillator.bind(AX);
  if (AX) { AX.createBufferSource = () => { nodes++; return cs(); }; AX.createOscillator = () => { nodes++; return co(); }; }
  const hear = fn => { const n0 = ITEM_SND.n, k0 = nodes; try { fn(); } catch (e) { out.err = e.message; } const L = ITEM_SND.last; return { calls: ITEM_SND.n - n0, nodes: nodes - k0, v: L && (L.kind + '/' + (L.dir ? L.dir + '/' : '') + L.voice) }; };
  const eq0 = { ...EQ }, keepAttr = { ...ATTRS }; for (const k in ATTRS) ATTRS[k] = 99;
  const A = (t, tier, line) => makeItem(tier, line ? lineType(line, t) : ARMOR_TYPES.find(x => x.slot === t), null, true);
  const W = sh => makeItem(4, WEAPON_TYPES.find(x => x.shape === sh), null, false);
  const wear = it => { delete it.reqAttr; BAG.push(it); return hear(() => useItem(BAG.length - 1)); };
  out.eq = { sword: wear(W('sword')), mace: wear(W('mace')), plate: wear(A('chest', 4)), mail: wear(A('chest', 3)), leather: wear(A('chest', 3, 'light')),
    robe: wear(A('chest', 3, 'robe')), ring: wear(A('ring', 3)) };
  out.tunic = itemVoice({ name: 'Tattered Tunic', type: 'equip', slot: 'chest', tier: 1 }); out.boots = itemVoice({ name: 'Leather Boots', type: 'equip', slot: 'feet', tier: 1 });
  Object.assign(EQ, eq0); Object.assign(ATTRS, keepAttr);
  const box = { items: [{ type: 'gold', value: 7 }, { name: 'Health Potion', type: 'potion', heal: 20, ico: '🧪', weight: .3 }, A('head', 4), { name: 'Old Letter', type: 'misc', weight: .01 }] };
  const b0 = BAG.length, g0 = gold; openLoot(box);
  out.one = hear(() => takeLootItem(0)); out.all = hear(() => takeAllLoot()); out.left = box.items.length; closeLoot && closeLoot();
  out.put = hear(() => depositToStash(BAG.length - 1)); out.take = hear(() => withdrawFromStash(stashBag.length - 1));
  BAG.splice(b0); gold = g0;
  out.drink = { potion: hear(() => sndConsume('potion')), water: hear(() => sndConsume('drink')), meal: hear(() => sndConsume('food')), herb: hear(() => sndConsume('herb')) };
  out.voices = { letter: itemVoice({ name: 'Old Letter', type: 'misc' }), ingot: itemVoice({ name: 'Iron Ingot', ingot: true }), arrows: itemVoice({ type: 'ammo', name: 'Arrows' }),
    buckler: itemVoice(A('offhand', 1)), shield: itemVoice(A('offhand', 4)), bow: itemVoice(W('bow')) };
  // S2717 — the counter: a buy is coins then the piece's take, a sale the piece's put then coins, each by what changes hands
  { const rs = renderShop, b1 = BAG.length, g1 = gold; renderShop = () => {}; gold = 99999;
    out.shop = { sword: hear(() => buyItem(W('sword'))), potion: hear(() => buyItem({ name: 'Health Potion', type: 'potion', heal: 20, ico: '🧪', weight: .3, price: 20 })) };
    BAG.push({ name: 'Old Letter', type: 'misc', weight: .01, qty: 1 }); out.shop.sell = hear(() => sellItem(BAG.length - 1, 3));
    out.shop.sold = !BAG.some(b => b.name === 'Old Letter'); renderShop = rs; BAG.splice(b1); gold = g1; }
  if (AX) { AX.createBufferSource = cs; AX.createOscillator = co; } return out; });
console.log('itemsnd', JSON.stringify(snd));
const E = snd.eq || {};
check(`equipping is heard by what it is: sword ${E.sword && E.sword.v}, mace ${E.mace && E.mace.v}, steel ${E.plate && E.plate.v}, iron ${E.mail && E.mail.v}, a jerkin ${E.leather && E.leather.v}, a robe ${E.robe && E.robe.v}, a ring ${E.ring && E.ring.v}; the starter tunic ${snd.tunic}, boots ${snd.boots}`,
  !snd.err && E.sword.v === 'equip/blade' && E.mace.v === 'equip/haft' && E.plate.v === 'equip/plate' && E.mail.v === 'equip/mail' && E.leather.v === 'equip/leather'
  && E.robe.v === 'equip/cloth' && E.ring.v === 'equip/trinket' && snd.tunic === 'cloth' && snd.boots === 'leather' && Object.values(E).every(o => o.calls === 1 && o.nodes >= 2), snd);
check(`a take from a container is one sound (gold ${snd.one.v}); Take all is one sound for the rest (${snd.all.v}, ${snd.left} left); the stash's put and take (${snd.put.v}, ${snd.take.v})`,
  snd.one.calls === 1 && snd.one.v === 'move/take/coin' && snd.one.nodes >= 3 && snd.all.calls === 1 && snd.all.v === 'move/take/plate' && snd.left === 0
  && snd.put.calls === 1 && /^move\/put\//.test(snd.put.v) && snd.take.calls === 1 && /^move\/take\//.test(snd.take.v), snd);
check(`drinking, eating and a herb each sound (${Object.entries(snd.drink).map(([k, o]) => k + ' ' + o.nodes).join(', ')} nodes); a letter is paper, an ingot stone, arrows, a wooden buckler and a steel shield, a bow`,
  Object.values(snd.drink).every(o => o.calls === 1 && o.nodes >= 3) && snd.voices.letter === 'paper' && snd.voices.ingot === 'stone' && snd.voices.arrows === 'arrows'
  && snd.voices.buckler === 'shieldwood' && snd.voices.shield === 'shieldmetal' && snd.voices.bow === 'bow', snd);
const S = snd.shop || {};
check(`the counter is heard by what changes hands: buying a sword ${S.sword && S.sword.v}, a potion ${S.potion && S.potion.v}; selling a letter ${S.sell && S.sell.v}`,
  !snd.err && S.sword.calls === 1 && S.sword.v === 'buy/blade' && S.potion.calls === 1 && S.potion.v === 'buy/potion' && S.sell.calls === 1 && S.sell.v === 'sell/paper' && S.sold
  && [S.sword, S.potion, S.sell].every(o => o.nodes >= 5), snd);
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
