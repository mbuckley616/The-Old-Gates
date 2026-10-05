// Wraiths and phantoms have no legs or feet and float (Session 527, Michael's inspector note: "Too clearly just a rip of the
// regular human mesh ... No legs or feet: they hover and float"). Their see-through robe showed a person's legs and boots inside
// it. Now no vertex hangs on a leg bone (the bones stay for poses), the robe's hem is torn into tongues of different lengths,
// and in play, gliding, the lowest point of the robe is clear of the ground.
import { boot, check } from './lib/game.mjs';
import { inspShots } from './lib/inspshot.mjs';
const g = await boot(); const { page } = g;
await g.intoWorld();
const r = await page.evaluate(() => {
  const out = {};
  for (const type of ['Wraith', 'Phantom', 'Bandit']) {
    const rig = buildFoe(type, px + 5, pz + 5); WORLD.scene.add(rig.root); rig.root.visible = false;
    const mesh = rig.mesh, bones = mesh.skeleton.bones, legs = new Set(['thL', 'knL', 'anL', 'thR', 'knR', 'anR'].map(n => bones.findIndex(b => b.name === n)));
    const sI = mesh.geometry.attributes.skinIndex, sW = mesh.geometry.attributes.skinWeight, pa = mesh.geometry.attributes.position; let onLeg = 0;
    for (let i = 0; i < pa.count; i++) if (legs.has(sI.getX(i)) && sW.getX(i) > .5) onLeg++;
    // the hem's tongues: the lowest vertices round the robe, by bearing (24), and how much their depths differ
    let lowY = 1e9; const bins = new Array(24).fill(1e9); for (let i = 0; i < pa.count; i++) { const y = pa.getY(i); lowY = Math.min(lowY, y); const b = Math.floor((Math.atan2(pa.getX(i), pa.getZ(i)) + Math.PI) / (Math.PI / 12)) % 24; if (Math.hypot(pa.getX(i), pa.getZ(i)) > .12) bins[b] = Math.min(bins[b], y); }
    const fin = bins.filter(v => v < lowY + .3), spread = Math.max(...fin) - Math.min(...fin);
    // in play a wraith glides at .24 ± .05 above the ground (tickPeople); its lowest bind point, scaled, at the bob's lowest
    const hover = rig.g.wraith ? .24 - .05 : 0, minClear = lowY * rig.root.scale.y + hover;
    WORLD.scene.remove(rig.root);
    out[type] = { onLeg, spread: +spread.toFixed(3), clear: +minClear.toFixed(3), tris: (mesh.geometry.index ? mesh.geometry.index.count : pa.count) / 3 };
  }
  return out;
});
console.log(JSON.stringify(r));
for (const t of ['Wraith', 'Phantom']) {
  check(`${t}: no vertex hangs on a leg bone (no legs, no feet)`, r[t].onLeg === 0, r[t]);
  check(`${t}: the hem is torn, its tongues hanging 6 cm or more apart in depth`, r[t].spread > .06, r[t]);
  check(`${t}: at the bottom of its glide's bob, the lowest point of the robe stays clear of the ground (over 5 cm)`, r[t].clear > .05, r[t]);
}
check('a bandit keeps his legs (the rule is the wraiths\' alone)', r.Bandit.onLeg > 300, r.Bandit);
await inspShots(g, [['people/foes-on-the-body/wraith', 'wraith-after.png', 'INSPECTOR.orbit.theta=1.1;INSPECTOR.orbit.phi=1.45;'], ['people/foes-on-the-body/phantom', 'phantom-after.png', 'INSPECTOR.orbit.theta=1.1;INSPECTOR.orbit.phi=1.45;']]);
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
