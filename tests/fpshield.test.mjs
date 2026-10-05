// The shield in first person is the kit's (Session 528, Michael's inspector note: "This looks like the legacy shield still /
// does not match with the 3 shield types we have"). Equipped with a buckler, a round shield, a kite and a tower shield, the
// first-person shield is the same kit piece your body carries in third person, sized by kind, with no box face left.
import { boot, check } from './lib/game.mjs';
import { inspShots } from './lib/inspshot.mjs';
const g = await boot(); const { page } = g;
await g.intoWorld();
const r = await page.evaluate(() => {
  const keep = EQ.offhand, out = {};
  for (const name of ['Buckler', 'Round Shield', 'Kite Shield', 'Tower Shield']) {
    // the item table has one shield type (the Buckler); a kite or tower shield is one by its name, as the third person reads it
    EQ.offhand = makeItem(3, ARMOR_TYPES.find(a => a.type === 'Buckler'), null, true); EQ.offhand.name = 'Iron ' + name;
    buildShieldViewmodel(); const s = vmShield; if (!s) { out[name] = null; continue; }
    let boxes = 0; s.traverse(o => { if (o.isMesh && o.geometry && o.geometry.type === 'BoxGeometry' && o.geometry.parameters && Math.abs(o.geometry.parameters.height - .48) < .01) boxes++; });
    s.updateMatrixWorld(true); const kitObj = s.children.find(o => o.userData && o.userData.kit) || s; const b = new THREE.Box3();
    s.children.forEach(o => { if (o !== s.userData.handMain && !(o.isLight)) b.expandByObject(o); });
    out[name] = { kit: s.userData.kit, item: EQ.offhand.name, boxes, h: +(b.max.y - b.min.y).toFixed(2) };
  }
  EQ.offhand = keep; buildShieldViewmodel();
  return out;
});
console.log(JSON.stringify(r));
check('a buckler and a round shield are the kit\'s round shield, a kite the kite, a tower the tower', r['Buckler'] && r['Buckler'].kit === 'round' && r['Round Shield'].kit === 'round' && r['Kite Shield'].kit === 'kite' && r['Tower Shield'].kit === 'tower', r);
check('no legacy box face is left on any of them', Object.values(r).every(x => x && x.boxes === 0), r);
check('sized by kind: the tower tallest, the buckler smallest', r['Tower Shield'].h > r['Kite Shield'].h && r['Kite Shield'].h > r['Buckler'].h, r);
await inspShots(g, [['weapons-and-armour/first-person-in-hand/shield', 'fpshield-after.png', 'INSPECTOR.orbit.theta=0.25;INSPECTOR.orbit.phi=1.35;']]);
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
