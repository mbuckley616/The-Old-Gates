// The wooden kit reads as wood (Session 540, Michael's inspector note: "the wooden kit is the best of them but reads as leather,
// not wood"). From the bake of your body in the Wooden full kit, by surface: the cuirass is boards in three tones of a lighter wood
// with a dark backing showing between them, almost none of it the old hide brown; the helm, vambraces and greaves take the wood's tone
// too; the Bronze kit is untouched.
import { boot, check } from './lib/game.mjs';
import { inspShots } from './lib/inspshot.mjs';
const g = await boot(); const { page } = g;
const r = await page.evaluate(() => {
  const keep = Object.assign({}, EQ), armorOf = (tier, type) => makeItem(tier, ARMOR_TYPES.find(a => a.type === type), null, true), out = {};
  for (const tier of [1, 2]) {
    for (const t of ['Cuirass', 'Greaves', 'Helmet', 'Gauntlets', 'Boots']) EQ[ARMOR_TYPES.find(a => a.type === t).slot] = armorOf(tier, t);
    const R = tpBuild(null, 'gatelander'); if (R.rig) PEOPLE_RIGS.delete(R.rig);
    const b = personBake(R.rig.g, 1), geo = b.geo, P = geo.attributes.position, Cc = geo.attributes.color, SI = geo.attributes.skinIndex, ix = geo.index, names = b.bones.map(x => x.name);
    const metal = R.rig.g.eq.armour.chest.metal, old = new THREE.Color(metal).multiplyScalar(.72), back = new THREE.Color(0x2a1a10);
    const tones = [.98, .86, 1.1].map((k, i) => new THREE.Color(metal).lerp(new THREE.Color(0xc89a62), .28 + .1 * i).multiplyScalar(k));
    const near = (i, c) => Math.abs(Cc.getX(i) - c.r) + Math.abs(Cc.getY(i) - c.g) + Math.abs(Cc.getZ(i) - c.b) < .02;
    const A = new THREE.Vector3(), B2 = new THREE.Vector3(), C2 = new THREE.Vector3(), area = { tone: [0, 0, 0], back: 0, old: 0, woodOn: {} };
    for (let t = 0; t < ix.count; t += 3) { const i0 = ix.getX(t); A.fromBufferAttribute(P, i0); B2.fromBufferAttribute(P, ix.getX(t + 1)).sub(A); C2.fromBufferAttribute(P, ix.getX(t + 2)).sub(A); const a = B2.cross(C2).length() / 2 * 1e4;
      const bn = names[SI.getX(i0)].replace(/[LR]$/, ''); let wood = false;
      tones.forEach((c, k) => { if (near(i0, c) && (bn === 'spine' || bn === 'hips' || bn === 'sh')) { area.tone[k] += a; wood = true; } });
      // the helm's bowl (the wood a third of the way to a pale oak) and the vambraces' and greaves' slats (.28, .38, .48 of the way)
      if (['head', 'el', 'kn'].includes(bn) && [.33, .28, .38, .48].some(k => near(i0, new THREE.Color(metal).lerp(new THREE.Color(0xc89a62), k)))) area.woodOn[bn] = +((area.woodOn[bn] || 0) + a).toFixed(1);
      if (near(i0, back) && (bn === 'spine' || bn === 'hips')) area.back += a;
      if (near(i0, old) && (bn === 'spine' || bn === 'hips')) area.old += a; }
    const L = c => { const h = {}; c.getHSL(h); return +h.l.toFixed(3); };
    out[MATERIALS[tier - 1].name] = { fam: R.rig.g.eq.armour.chest.fam, tone: area.tone.map(x => +x.toFixed(1)), back: +area.back.toFixed(1), old: +area.old.toFixed(1), woodOn: area.woodOn, lightOld: L(old), lightNew: L(tones[0]), tris: b.tris };
    geo.dispose(); }
  Object.assign(EQ, keep); return out;
});
console.log(JSON.stringify(r));
const W = r.Wooden;
check('the wooden kit is the lamellar', W.fam === 'lamellar', W.fam);
check('the cuirass is boards in three tones of wood, each a real part of it', W.tone.every(a => a > 40), W.tone);
check('a dark backing shows between the boards', W.back > 20, W.back);
check('almost none of the trunk is the old hide brown: under 100 cm² (the old cuirass, 3,625)', W.old < 100, W.old);
check('the wood is lighter than the old brown', W.lightNew > W.lightOld + .08, { old: W.lightOld, now: W.lightNew });
check('the helm, the vambraces and the greaves are in the wood\'s tone too', ['head', 'el', 'kn'].every(n => (W.woodOn[n] || 0) > 2), W.woodOn);
check('the Bronze kit has no boards', r.Bronze.tone.every(a => a === 0), r.Bronze.tone);
const cam = (th, d, y) => `INSPECTOR.opts.figure=false;INSPECTOR.orbit.theta=${th};INSPECTOR.orbit.phi=1.45;INSPECTOR.orbit.dist*=${d};INSPECTOR.orbit.target.y=${y};`, K = 'weapons-and-armour/your-body-in-a-full-kit/wooden';
await inspShots(g, [[K, 'wooden-after-front.png', 'INSPECTOR.orbit.theta=0.35;INSPECTOR.orbit.phi=1.45;INSPECTOR.orbit.dist*=.75;INSPECTOR.orbit.target.y=.75;'], [K, 'wooden-after-chest.png', cam(0.2, .4, .85)], [K, 'wooden-after-back.png', cam(2.6, .75, .75)]]);
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
