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
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
