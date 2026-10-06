// The wraith's hollow hood, claws and hunting stance (Session 555, Michael's B on DECISION #158: "A, plus the hunched, reaching
// stance"). Under the wraith's hood there is no head: the body bakes no skull, face or hair, and an unlit opaque mesh fills the hood with two slits
// of the eye colour in it. Both the wraith and the phantom have arms a quarter longer ending in four long claws and a thumb, and
// they stand hunched with both arms reaching at chest height. The phantom keeps its face. A blow swings the right arm from the
// reaching rest (attackPose); a bandit's blow is as it was.
import { boot, check } from './lib/game.mjs';
import { inspShots } from './lib/inspshot.mjs';
const g = await boot(); const { page } = g;
await g.intoWorld();
const r = await page.evaluate(() => {
  const out = {};
  for (const type of ['Wraith', 'Phantom', 'Bandit']) {
    const rig = buildFoe(type, px + 5, pz + 5, null, type === 'Bandit' ? null : 0xa0e0ff);
    const holder = new THREE.Group(); holder.add(rig.root); holder.position.set(px + 5, 0, pz + 5); WORLD.scene.add(holder);
    const mesh = rig.mesh, bones = mesh.skeleton.bones, bi = n => bones.findIndex(b => b.name === n);
    const geo = mesh.geometry, pa = geo.attributes.position, sI = geo.attributes.skinIndex, sW = geo.attributes.skinWeight;
    const v = new THREE.Vector3();
    // the face: body vertices on the head bone, in the head's bind frame, in front of the skull and between chin and brow
    const hI = bi('head'), hInv = mesh.skeleton.boneInverses[hI]; let face = 0;
    for (let i = 0; i < pa.count; i++) { if (sI.getX(i) !== hI || sW.getX(i) < .5) continue; v.fromBufferAttribute(pa, i).applyMatrix4(hInv);
      if (Math.abs(v.x) < .06 && v.y > .06 && v.y < .19 && v.z > .08) face++; }
    // the hand's reach: the farthest a wrist vertex lies down the hand from the wrist (a claw's tip)
    let tip = 0; for (const k of ['wrL', 'wrR']) { const w = bi(k), inv = mesh.skeleton.boneInverses[w];
      for (let i = 0; i < pa.count; i++) { if (sI.getX(i) !== w || sW.getX(i) < .5) continue; v.fromBufferAttribute(pa, i).applyMatrix4(inv); tip = Math.max(tip, -v.y); } }
    const forearm = -rig.B.wrL.position.y, upper = -rig.B.elL.position.y;
    // stand it a while in the loop's own tick, then where its wrists are, in the figure's frame (z forward, from the ground)
    const t0 = performance.now(); for (let i = 0; i < 90; i++) tickPeople(1 / 60, t0 + i * 1000 / 60);
    holder.updateMatrixWorld(true); const wrist = k => { const p = rig.B[k].getWorldPosition(new THREE.Vector3()); return rig.root.worldToLocal(p); };
    const L = wrist('wrL'), R = wrist('wrR'), headP = rig.root.worldToLocal(rig.B.head.getWorldPosition(new THREE.Vector3()));
    const hol = rig.hollow || [];
    const unlit = hol.length === 3 && hol.every(m => m.material.isMeshBasicMaterial && m.parent === rig.B.head);
    const dark = hol[0] ? hol[0].material.color.getHex() : null, slit = hol[1] ? hol[1].material.color.getHex() : null;
    // a blow from its rest: the wind lifts the claw over the head, the strike rakes it down past the rest; a bandit's is as before
    const e = { limbs: { armR: rig.B.shR, person: rig }, _wind: 1 }; const rest = rig.B.shR.rotation.x;
    attackPose(e, false); const wound = rig.B.shR.rotation.x; e._wind = 0; e._lunge = .15; attackPose(e, false); const struck = rig.B.shR.rotation.x;
    WORLD.scene.remove(holder);
    out[type] = { face, tip: +tip.toFixed(3), upper: +upper.toFixed(3), forearm: +forearm.toFixed(3), wrL: [+L.y.toFixed(2), +L.z.toFixed(2)], wrR: [+R.y.toFixed(2), +R.z.toFixed(2)],
      headZ: +headP.z.toFixed(2), unlit, dark, slit, glowDots: rig.B.head.children.filter(c => c.isMesh && !hol.includes(c)).length,
      rest: +rest.toFixed(2), wound: +wound.toFixed(2), struck: +struck.toFixed(2), arm: rig.wraithArm == null ? null : +rig.wraithArm.toFixed(2),
      tris: (geo.index ? geo.index.count : pa.count) / 3 + hol.reduce((s, m) => s + m.geometry.index.count / 3, 0) };
  }
  return out;
});
console.log(JSON.stringify(r));
const W = r.Wraith, P = r.Phantom, B = r.Bandit;
check('the wraith has no face under its hood: no body vertex in front of the skull', W.face === 0, W);
check('the phantom keeps its face (and a bandit his)', P.face > 100 && B.face > 100, { P: P.face, B: B.face });
check('the darkness and the slits are unlit meshes of their own on the head bone: near-black, and the eye colour', W.unlit && W.dark === 0x06070b && W.slit === 0xa0e0ff, W);
check('no dot eyes under the hood; the phantom keeps its glowing eyes', W.glowDots === 0 && P.glowDots === 1, { W: W.glowDots, P: P.glowDots });
check('the wraith and the phantom have arms a quarter longer than a bandit\'s', Math.abs(W.upper / B.upper - 1.25) < .01 && Math.abs(P.forearm / B.forearm - 1.25) < .01, { W, B });
check('their hands end in claws reaching 15 cm or more from the wrist (a bandit\'s mitten, under 9)', W.tip > .15 && P.tip > .15 && B.tip < .09, { W: W.tip, P: P.tip, B: B.tip });
for (const [n, x] of [['wraith', W], ['phantom', P]])
  check(`the ${n} reaches: both wrists at chest height (.75 to 1.15 up) and 30 cm or more in front of it`, [x.wrL, x.wrR].every(([y, z]) => y > .75 && y < 1.15 && z > .3), x);
check('a bandit at rest has his free hand at his side', B.wrL[1] < .1, B);
check('the wraith hunches: its head thrust 10 cm or more forward', W.headZ > .1, W);
check('a wraith\'s blow: the wind lifts the claw above its rest, the strike rakes it down past it', W.arm != null && W.wound < W.arm - .9 && W.struck > W.arm + 1.2, W);
check('a bandit\'s blow is as it was (1.4 at the wind\'s top, -1.3 at the strike)', B.wound === 1.4 && B.struck === -1.3, B);
check('the wraith costs no more than it did (3,652 triangles with its face)', W.tris <= 3700, W.tris);
await inspShots(g, [['people/foes-on-the-body/wraith', 'wraith-hood-front.png', 'INSPECTOR.orbit.theta=0.3;INSPECTOR.orbit.phi=1.4;'],
  ['people/foes-on-the-body/wraith', 'wraith-hood-side.png', 'INSPECTOR.orbit.theta=1.2;INSPECTOR.orbit.phi=1.4;'],
  ['people/foes-on-the-body/wraith', 'wraith-hood-face.png', 'INSPECTOR.orbit.theta=0.15;INSPECTOR.orbit.phi=1.45;INSPECTOR.orbit.dist*=.45;INSPECTOR.orbit.target.y+=.35;'],
  ['people/foes-on-the-body/phantom', 'phantom-claws.png', 'INSPECTOR.orbit.theta=0.9;INSPECTOR.orbit.phi=1.4;']]);
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
