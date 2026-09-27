// Shots from the hands (Session 175): in third person an arrow leaves the bow hand and a spell the right hand, and
// both fly at the point the crosshair covers (30 units along the camera's line). They used to leave from where the
// first-person eye would be, inside the body's head, whatever the camera. First person is unchanged.
import { boot, check } from './lib/game.mjs';
const g = await boot(); const { page } = g;
await g.intoWorld();

// a bow and arrows, third person on, a few real frames so the body stands where the camera sees it
await page.evaluate(() => { EQ.offhand = null; EQ.weapon = { name: 'Test Bow', ico: '🏹', type: 'equip', slot: 'weapon', atk: [5, 7], weaponShape: 'bow', wType: 'pierce', twoHand: true, weight: 3 };
  EQ.ammo = { name: 'Iron Arrow', ico: '➶', type: 'ammo', qty: 50, arrowDmg: [2, 4] }; pitch = .08; thirdPerson = true; TP.want = 2.4; });
await g.frames(12);

const shot = () => page.evaluate(() => {
  let cap = null; const push = ZB.push;
  // catch the projectile the moment it is made, with the hands and the crosshair's point at that moment
  ZB.push = function (o) { const R = TP.rig; if (R) R.root.updateMatrixWorld(true);
    const hand = k => R && R[k] ? R[k].getWorldPosition(new THREE.Vector3()) : null; const d = CAM.getWorldDirection(new THREE.Vector3());
    const aim = CAM.position.clone().addScaledVector(d, 30); const p = o.position.clone(), u = o.userData;
    const v = new THREE.Vector3(u.vx, u.vy, u.vz).normalize(); const t = aim.clone().sub(p).dot(v); const miss = aim.clone().sub(p.clone().addScaledVector(v, t)).length();
    const eyeY = (typeof activeTerrainH === 'function' ? activeTerrainH(px, pz) : 0) + (_eyeHeightCur || .92);
    cap = { spell: !!u.spell, fromL: hand('handL') ? p.distanceTo(hand('handL')) : null, fromR: hand('handR') ? p.distanceTo(hand('handR')) : null,
      fromEye: Math.hypot(p.x - (px + fwdX * .5 + rgtX * .15), p.y - eyeY, p.z - (pz + fwdZ * .5 + rgtZ * .15)), miss: +miss.toFixed(3), tp: thirdPerson, vis: !!(R && R.root.visible) };
    return push.apply(this, arguments); };
  window._restore = () => { ZB.push = push; }; window._cap = () => cap;
  return true; });

await shot(); const arrowTP = await page.evaluate(() => { fireArrow(1); const c = _cap(); _restore(); return c; });
console.log('arrow, third person', JSON.stringify(arrowTP));
check('third person: the arrow leaves the bow hand, not the eye', arrowTP && arrowTP.tp && arrowTP.vis && arrowTP.fromL < .01 && arrowTP.fromEye > .3, arrowTP);
check('third person: the arrow flies at the crosshair’s point', arrowTP && arrowTP.miss < .01, arrowTP);

// a projectile spell: known, mana to spare, no wild roll; the release comes after the cast's windup
await shot(); await page.evaluate(() => { const sp = SPELLS.find(s => s.speed > 0 && s.role !== 'buff' && s.role !== 'heal'); knownSpells[sp.id] = 2; activeSpellId = sp.id;
  mana = 999; spCd = 0; window._rnd = Math.random; Math.random = () => .99; castSpell(); });
await page.waitForFunction(() => _cap(), null, { timeout: 30000 }).catch(() => {});
const spellTP = await page.evaluate(() => { const c = _cap(); _restore(); Math.random = window._rnd; return c; });
console.log('spell, third person', JSON.stringify(spellTP));
check('third person: the spell leaves the right hand and flies at the crosshair’s point', spellTP && spellTP.spell && spellTP.fromR < .01 && spellTP.miss < .05, spellTP);

// first person: as it was
await page.evaluate(() => { thirdPerson = false; }); await g.frames(3);
await shot(); const arrowFP = await page.evaluate(() => { fireArrow(1); const c = _cap(); _restore(); return c; });
console.log('arrow, first person', JSON.stringify(arrowFP));
check('first person: the arrow leaves from beside the eye, as before', arrowFP && !arrowFP.tp && arrowFP.fromEye < .01, arrowFP);
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
