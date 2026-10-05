// Hair under the helms (Session 547; Michael, the inspector, on the armour kits: "hair and clothing break through many of the
// armour sets"). Your body in each material's full kit with each of the thirteen hair styles, baked in the bind pose and read in
// the head bone's frame: the helm's triangles (its colours set to a pure magenta) and the hair's vertices (pure green). A hair
// vertex breaks through when the line from the head's centre to it crosses the helm and nothing of the helm lies beyond it.
// Before: under the plate helms (Steel to Cosmic) a braid stood out through the back with 191 vertices up to 11.9 cm, two braids
// through the sides with 311 up to 11.4 cm and a tied tail with 9 up to 7.9 cm; every other helm and style was clear. Pulled in
// under the rim they went through the gorget instead, so under a closed plate helm they are cut to the skull, as Session 398 cut
// the full styles under every helm; under the bronze, mail and wooden helms, which are open below, they hang as before.
import { boot, check } from './lib/game.mjs';
import { inspShots } from './lib/inspshot.mjs';
const g = await boot(); const { page } = g;
const r = await page.evaluate(() => {
  const keep = Object.assign({}, EQ), armorOf = (tier, type) => makeItem(tier, ARMOR_TYPES.find(a => a.type === type), null, true);
  const styles = ['crop', 'buzz', 'thin', 'straight', 'braid', 'twin', 'tied', 'bun', 'warrior', 'mohawk', 'curly', 'afro', 'shaggy'];
  const rows = [];
  for (let tier = 1; tier <= 10; tier++) {
    for (const t of ['Cuirass', 'Greaves', 'Helmet', 'Gauntlets', 'Boots']) EQ[ARMOR_TYPES.find(a => a.type === t).slot] = armorOf(tier, t);
    const R = tpBuild(null, 'gatelander'); if (R.rig) PEOPLE_RIGS.delete(R.rig);
    for (const style of styles) {
      const eq = JSON.parse(JSON.stringify(R.rig.g.eq)); eq.armour.head.metal = 0xff00ff; eq.armour.head.guard = 0xff00ff;
      const gg = Object.assign({}, R.rig.g, { style, hair: 0x00ff00, eq }), b = personBake(gg, 1), geo = b.geo, P = geo.attributes.position, Cc = geo.attributes.color, I = geo.index;
      b.bones[0].updateMatrixWorld(true); const inv = new THREE.Matrix4().copy(b.B.head.matrixWorld).invert();
      const pts = []; for (let i = 0; i < P.count; i++) pts.push(new THREE.Vector3().fromBufferAttribute(P, i).applyMatrix4(inv));
      const X = i => Cc.getX(i), Y = i => Cc.getY(i), Z = i => Cc.getZ(i);
      const helm = i => X(i) > Y(i) + .15 && Z(i) > Y(i) + .15 && Math.abs(X(i) - Z(i)) < .15 * Math.max(X(i), Z(i)), hair = i => Y(i) > X(i) + .2 && Y(i) > Z(i) + .2;
      const tri = [], N = I ? I.count : P.count;
      for (let k = 0; k < N; k += 3) { const a = I ? I.getX(k) : k, b2 = I ? I.getX(k + 1) : k + 1, c = I ? I.getX(k + 2) : k + 2; if (helm(a) && helm(b2) && helm(c)) tri.push(pts[a], pts[b2], pts[c]); }
      const hg = new THREE.BufferGeometry().setFromPoints(tri), hm = new THREE.Mesh(hg, new THREE.MeshBasicMaterial({ side: THREE.DoubleSide }));
      const o = new THREE.Vector3(0, .12, 0), rc = new THREE.Raycaster(); let n = 0, out = 0, worst = 0;
      for (let i = 0; i < P.count; i++) { if (!hair(i)) continue; n++; const d = pts[i].clone().sub(o), L = d.length(); if (L < .01) continue; d.normalize();
        rc.set(o, d); rc.far = L; const h = rc.intersectObject(hm); if (!h.length || h[0].distance >= L - .004) continue;
        rc.set(pts[i], d); rc.far = .5; if (rc.intersectObject(hm).length) continue; out++; worst = Math.max(worst, L - h[0].distance); }
      rows.push({ tier, fam: eq.armour.head.fam + (eq.armour.head.sig ? ':' + eq.armour.head.sig : ''), style, n, out, worst: +(worst * 100).toFixed(1), helmTris: tri.length / 3 });
      geo.dispose(); hg.dispose();
    }
  }
  Object.assign(EQ, keep); return rows;
});
const bad = r.filter(x => x.worst > .6), long = r.filter(x => /^(braid|twin|tied)$/.test(x.style)), buzzN = t => r.find(x => x.tier === t && x.style === 'buzz').n;
console.log('rows', r.length, 'worst', Math.max(...r.map(x => x.worst)), 'cm;', long.filter(x => x.tier <= 4).map(x => `${x.tier}:${x.style} ${x.n} (buzz ${buzzN(x.tier)})`).join(', '));
check('every kit has a helm and every style has hair (10 kits × 13 styles)', r.length === 130 && r.every(x => x.helmTris > 50 && x.n > 50), r.filter(x => !(x.helmTris > 50 && x.n > 50)));
check('no hair stands more than 6 mm out through any helm, in any style (before: 11.9 cm under the plate helms)', bad.length === 0, bad);
check('under a closed plate helm (Steel and up) a braid, two braids and a tied tail are cut to the skull, as the buzz', long.filter(x => x.tier >= 4).every(x => x.n === buzzN(x.tier)), long.filter(x => x.tier >= 4));
check('under the wooden, bronze and iron helms, open below, they keep their plaits and tail', long.filter(x => x.tier <= 3).every(x => x.n > buzzN(x.tier) + 15), long.filter(x => x.tier <= 3));
await page.evaluate(() => { worldState.look = Object.assign({}, worldState.look || {}, { style: 'braid' }); });
const cam = th => `INSPECTOR.opts.figure=false;INSPECTOR.orbit.theta=${th};INSPECTOR.orbit.phi=1.45;INSPECTOR.orbit.dist*=.45;INSPECTOR.orbit.target.y=.95;`;
await inspShots(g, [['weapons-and-armour/your-body-in-a-full-kit/steel', 'helmhair-steel-braid-after.png', cam(2.6)]]);
await page.evaluate(() => { worldState.look = Object.assign({}, worldState.look || {}, { style: 'twin' }); });
await inspShots(g, [['weapons-and-armour/your-body-in-a-full-kit/mithril', 'helmhair-mithril-twin-after.png', cam(1.9)]]);
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
