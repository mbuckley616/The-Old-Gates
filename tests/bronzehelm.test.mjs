// The bronze helm a Corinthian (Session 537, Michael's inspector note: "Great other than the helmet. It splits right down the
// middle" at the forehead and brow ridge, "expected more like a classic hoplite helmet. Long hair and clothing cut right through
// it."). From the bind pose of your body in the bronze kit with long straight hair, in the head bone's own frame: the helm is
// closed over the forehead, open across the eyes, closed down the cheeks but for the mouth's slit, and no hair stands outside it
// between the crown and the rim. The other tiers' helms are untouched.
import { boot, check } from './lib/game.mjs';
import { inspShots } from './lib/inspshot.mjs';
const g = await boot(); const { page } = g;
const r = await page.evaluate(() => {
  const keep = Object.assign({}, EQ), armorOf = (tier, type) => makeItem(tier, ARMOR_TYPES.find(a => a.type === type), null, true);
  const measure = (tier, style) => {
    for (const t of ['Cuirass', 'Greaves', 'Helmet', 'Gauntlets', 'Boots']) EQ[ARMOR_TYPES.find(a => a.type === t).slot] = armorOf(tier, t);
    const R = tpBuild(null, 'gatelander'); if (R.rig) PEOPLE_RIGS.delete(R.rig);
    const gg = Object.assign({}, R.rig.g, { style }), b = personBake(gg, 1), geo = b.geo, P = geo.attributes.position, Cc = geo.attributes.color;
    b.bones[0].updateMatrixWorld(true); const inv = new THREE.Matrix4().copy(b.B.head.matrixWorld).invert(), v = new THREE.Vector3();
    const helmC = new THREE.Color(R.rig.g.eq.armour.head.metal).multiplyScalar(.72), hairC = new THREE.Color(gg.hair), near = (i, c) => Math.abs(Cc.getX(i) - c.r) + Math.abs(Cc.getY(i) - c.g) + Math.abs(Cc.getZ(i) - c.b) < .02;
    const hs = gg.head || 1, jaw = gg.jaw || 1, prof = typeof BRONZE_HELM !== 'undefined' ? BRONZE_HELM : null;
    const rAt = y => { const q = prof.map(p => [p[0] * hs, .12 + (p[1] - .12) * hs]); for (let i = 1; i < q.length; i++) { const a = q[i - 1], c = q[i]; if ((y - a[1]) * (y - c[1]) <= 0 && a[1] !== c[1]) return a[0] + (c[0] - a[0]) * (y - a[1]) / (c[1] - a[1]); } return null; };
    let forehead = 0, eyes = 0, cheeks = 0, hairOut = 0, hairN = 0, worst = 0;
    for (let i = 0; i < P.count; i++) { v.fromBufferAttribute(P, i).applyMatrix4(inv); const ang = Math.atan2(v.x / jaw, v.z), y = (v.y - .12) / hs + .12;
      if (near(i, helmC)) { if (Math.abs(ang) < .25 && y > .17 && y < .26) forehead++;
        if (Math.abs(v.x) > .02 && Math.abs(ang) < .35 && y > .12 && y < .145) eyes++;
        if (Math.abs(ang) > .3 && Math.abs(ang) < .9 && y > .02 && y < .1) cheeks++; }
      else if (near(i, hairC) && prof && y > -.015 && y < .27) { hairN++; const rr = rAt(v.y), d = Math.hypot(v.x / jaw, v.z) - (rr || 1); if (rr && d > .004) { hairOut++; worst = Math.max(worst, d); } } }
    geo.dispose(); return { fam: R.rig.g.eq.armour.head.fam, forehead, eyes, cheeks, hairN, hairOut, worst: +worst.toFixed(3), tris: b.tris }; };
  const out = { bronzeStraight: measure(2, 'straight'), bronzeBraid: measure(2, 'braid'), bronzeTwin: measure(2, 'twin'), iron: measure(3, 'straight') };
  Object.assign(EQ, keep); return out;
});
console.log(JSON.stringify(r));
const B = r.bronzeStraight;
check('the bronze kit\'s helm is the crested family it was (muscle)', B.fam === 'muscle', B.fam);
check('closed over the forehead: helm in front between the brow and the crown (the old shell was split there, 0)', B.forehead >= 2, B);
check('open across the eyes: no helm either side of the nasal at the eyes\' height', B.eyes === 0, B);
check('closed down the cheeks', B.cheeks >= 4, B);
check('no long hair stands outside the helm between the crown and the rim: straight, braided and twin', [r.bronzeStraight, r.bronzeBraid, r.bronzeTwin].every(x => x.hairN > 0 && x.hairOut === 0), r);
check('the iron kit keeps its own helm (mail, with its nasal)', r.iron.fam === 'mail', r.iron);
await inspShots(g, [['weapons-and-armour/your-body-in-a-full-kit/bronze', 'bronzehelm-after-front.png', 'INSPECTOR.opts.figure=false;INSPECTOR.orbit.theta=0.25;INSPECTOR.orbit.phi=1.45;INSPECTOR.orbit.dist*=.32;INSPECTOR.orbit.target.y=1.08;'],
  ['weapons-and-armour/your-body-in-a-full-kit/bronze', 'bronzehelm-after-back.png', 'INSPECTOR.opts.figure=false;INSPECTOR.orbit.theta=2.4;INSPECTOR.orbit.phi=1.45;INSPECTOR.orbit.dist*=.32;INSPECTOR.orbit.target.y=1.08;']]);
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
