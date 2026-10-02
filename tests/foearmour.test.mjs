// The helmed foes in the armour kit (Session 403, Michael's B on decision #94): the Deserter in Iron mail and a nasal
// helm, the Bandit Captain in looted Wooden lamellar and vambraces under an Iron helm, the Shieldbearer in Steel plate over
// Iron mail sleeves and greaves, the Ash Wight in Iron mail rusted nearly black. The bowl helm is gone; the boots are the
// foe's own; every other foe is as it was.
import { boot, check } from './lib/game.mjs';
const g = await boot(); const { page } = g;
await g.intoWorld();

const r = await page.evaluate(() => {
  const out = {};
  const one = (type, eye) => { const rig = buildFoe(type, 4100, 7300, null, eye); scene.add(rig.root); rig.root.visible = false; const A = rig.g.eq && rig.g.eq.armour;
    const fam = k => A && A[k] ? A[k].fam + A[k].tier : null; const o = { hat: rig.g.hat, head: fam('head'), chest: fam('chest'), hands: fam('hands'), legs: fam('legs'), feet: A ? A.feet : 'none',
      metal: A && A.chest ? A.chest.metal : null, tris: rig.tris, lo: rig.trisLo, bones: rig.mesh.skeleton.bones.length, weapon: !!(rig.weapon || rig.g.gear) };
    scene.remove(rig.root); PEOPLE_RIGS.delete(rig); rig.mesh.geometry.dispose(); if (rig.geoLo) rig.geoLo.dispose(); return o; };
  for (const t of ['Deserter', 'Bandit Captain', 'Shieldbearer', 'Ash Wight', 'Bandit', 'Highwayman', 'Skeleton', 'Ghoul']) out[t] = one(t, t === 'Ash Wight' ? 0xff6020 : null);
  out.ironBlade = MATERIALS[2].blade;
  // the zone's own path: a Deserter on the road, built as the world builds one
  const e = buildZoneEnemy(WORLD.scene, [], px + 40, pz + 40, 'Deserter', null); const pr = e.limbs && e.limbs.person; const A = pr && pr.g.eq && pr.g.eq.armour;
  out.zone = { person: !!pr, chest: A && A.chest ? A.chest.fam : null }; if (e.mesh.parent) e.mesh.parent.remove(e.mesh);
  return out; });
for (const k of Object.keys(r)) console.log(k, JSON.stringify(r[k]));
const D = r['Deserter'], C = r['Bandit Captain'], S = r['Shieldbearer'], W = r['Ash Wight'];
check('the Deserter wears his old army\'s Iron mail and the nasal helm, nothing on the arms or legs', D.head === 'mail3' && D.chest === 'mail3' && !D.hands && !D.legs, D);
check('the Bandit Captain wears looted Wooden lamellar and vambraces under an Iron helm', C.head === 'mail3' && C.chest === 'lamellar1' && C.hands === 'lamellar1' && !C.legs, C);
check('the Shieldbearer wears Steel plate over Iron mail sleeves and greaves', S.head === 'plate4' && S.chest === 'plate4' && S.hands === 'mail3' && S.legs === 'mail3', S);
check('the Ash Wight wears Iron mail rusted nearly black, not the Iron of a living foe', W.chest === 'mail3' && W.legs === 'mail3' && W.metal === 0x4a3e34 && D.metal === r.ironBlade, { wight: W.metal, deserter: D.metal });
check('the kit\'s helm takes the bowl helm\'s place, and each keeps his own boots and his weapon', [D, C, S, W].every(o => o.hat === 'none' && o.feet === null) && D.weapon && C.weapon && S.weapon && W.weapon, [D, C, S, W].map(o => [o.hat, o.feet, o.weapon]));
check('every other foe is as it was: no kit (a Bandit, a Highwayman, a Skeleton, a Ghoul)', ['Bandit', 'Highwayman', 'Skeleton', 'Ghoul'].every(t => !r[t].chest), ['Bandit', 'Highwayman', 'Skeleton', 'Ghoul'].map(t => r[t].chest));
check('each armoured foe is 7,500–12,000 triangles and under 6,000 at a distance, on the people\'s bones (the prototype: 8,822–10,568)', [D, C, S, W].every(o => o.tris >= 7500 && o.tris <= 12000 && o.lo < 6000 && o.bones >= 16), [D, C, S, W].map(o => [o.tris, o.lo]));
check('a Deserter built on the road by the zone wears the kit', r.zone.chest === 'mail', r.zone);
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
