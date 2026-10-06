// The Demonic kit carved in red (Session 538, Michael's inspector note: "more detail and colour, red carved designs across the
// armour, similar to Daedric armor in Oblivion/Skyrim"; purple stays dominant). From the bake of your body in each tier's full
// kit: the Demonic plate carries red carvings on its breastplate, helm, pauldrons, vambraces and greaves; they are a small part of
// the purple; no other tier carries them.
import { boot, check } from './lib/game.mjs';
import { inspShots } from './lib/inspshot.mjs';
const g = await boot(); const { page } = g;
const r = await page.evaluate(() => {
  const keep = Object.assign({}, EQ), armorOf = (tier, type) => makeItem(tier, ARMOR_TYPES.find(a => a.type === type), null, true);
  const red = new THREE.Color(0xc41c1c), out = {};
  for (const tier of [4, 5, 7, 8, 9]) {
    for (const t of ['Cuirass', 'Greaves', 'Helmet', 'Gauntlets', 'Boots']) EQ[ARMOR_TYPES.find(a => a.type === t).slot] = armorOf(tier, t);
    const R = tpBuild(null, 'gatelander'); if (R.rig) PEOPLE_RIGS.delete(R.rig);
    const b = personBake(R.rig.g, 1), geo = b.geo, Cc = geo.attributes.color, SI = geo.attributes.skinIndex, metal = new THREE.Color(R.rig.g.eq.armour.chest.metal).multiplyScalar(.72);
    const near = (i, c) => Math.abs(Cc.getX(i) - c.r) + Math.abs(Cc.getY(i) - c.g) + Math.abs(Cc.getZ(i) - c.b) < .02;
    // by surface: each triangle's area to its first corner's colour (the bind pose, in square centimetres)
    const names = b.bones.map(x => x.name), on = {}, P = geo.attributes.position, ix = geo.index, A = new THREE.Vector3(), B2 = new THREE.Vector3(), C2 = new THREE.Vector3(); let carved = 0, plate = 0;
    const n = ix ? ix.count : P.count; for (let t = 0; t < n; t += 3) { const i0 = ix ? ix.getX(t) : t, i1 = ix ? ix.getX(t + 1) : t + 1, i2 = ix ? ix.getX(t + 2) : t + 2;
      A.fromBufferAttribute(P, i0); B2.fromBufferAttribute(P, i1).sub(A); C2.fromBufferAttribute(P, i2).sub(A); const area = B2.cross(C2).length() / 2 * 1e4;
      if (near(i0, red)) { carved += area; const nm = names[SI.getX(i0)].replace(/[LR]$/, ''); on[nm] = +((on[nm] || 0) + area).toFixed(1); } else if (near(i0, metal)) plate += area; }
    out[MATERIALS[tier - 1].name] = { sig: R.rig.g.eq.armour.chest.sig, carved: +carved.toFixed(1), plate: +plate.toFixed(1), on, tris: b.tris }; geo.dispose(); }
  Object.assign(EQ, keep); return out;
});
console.log(JSON.stringify(r));
const D = r.Demonic, others = Object.entries(r).filter(([k]) => k !== 'Demonic');
check('the Demonic kit is the spiked plate', D.sig === 'spiked', D.sig);
check('red carvings on the breastplate, the helm, the pauldrons, the vambraces and the greaves', ['spine', 'head', 'sh', 'el', 'kn'].every(n => (D.on[n] || 0) > 1), D.on);
check('the purple stays dominant: the carvings are under a tenth of the plate\'s surface', D.carved > 0 && D.carved < D.plate / 10, { carved: D.carved, plate: D.plate });
check('no other tier carries them (Steel to Obsidian)', others.every(([, v]) => v.carved === 0), others.map(([k, v]) => [k, v.carved]));
const cam = (th, d, y) => `INSPECTOR.opts.figure=false;INSPECTOR.orbit.theta=${th};INSPECTOR.orbit.phi=1.45;INSPECTOR.orbit.dist*=${d};INSPECTOR.orbit.target.y=${y};`, K = 'weapons-and-armour/your-body-in-a-full-kit/demonic';
await inspShots(g, [[K, 'demonic-after-front.png', cam(0.35, .75, .75)], [K, 'demonic-after-chest.png', cam(0.2, .4, .85)], [K, 'demonic-after-back.png', cam(2.6, .75, .75)]]);
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
