// Fists on screen in first person (Session 396, Michael's A on decision #80): with the weapon slot empty both fists are up,
// the right jabs (palm down as it lands) while the left keeps its guard, block brings both to the face, a shield or torch
// takes the left. Each fist is one mesh with its forearm, so the wrist cannot come away from the arm.
import { boot, check } from './lib/game.mjs';
const g = await boot(); const { page } = g;
await g.intoWorld();

const build = await page.evaluate(() => { thirdPerson = false; const keep = { w: EQ.weapon, o: EQ.offhand };
  const st = () => ({ fists: !!(vmSword && vmSword.userData.fists), left: !!(vmSword && vmSword.userData.fistL), armR: !!(vmArmR && vmSword && vmArmR.userData.wristHand === vmSword.userData.elbow),
    armL: !!(vmArmL && vmSword && vmSword.userData.fistL && vmArmL.userData.wristHand === vmSword.userData.fistL.userData.elbow), shield: !!vmShield });
  const out = {}; out.armed = st();
  EQ.weapon = null; EQ.offhand = null; buildViewmodel(); out.empty = st();
  out.tris = vmSword.children[0].geometry.attributes.position.count / 3;
  EQ.offhand = { name: 'Torch', torchType: 'torch', slot: 'offhand' }; buildShieldViewmodel(); out.torch = st();
  EQ.offhand = null; buildShieldViewmodel(); out.back = st();
  EQ.weapon = keep.w; EQ.offhand = keep.o; buildViewmodel(); out.rearmed = st();
  return out; });
check('armed, there are no fists', !build.armed.fists && !build.rearmed.fists, build);
check('the empty hand is both fists, each on its arm from the elbow', build.empty.fists && build.empty.left && build.empty.armR && build.empty.armL, build.empty);
check('a torch in the off hand takes the left fist, and taking it off gives it back', build.torch.fists && !build.torch.left && build.torch.shield && build.back.left && build.back.armL, build);
check('a fist with its forearm is one mesh of 2,000–4,000 triangles', build.tris >= 2000 && build.tris <= 4000, build.tris);

// the poses: the wrist stays on the arm (the elbow anchor is the end of the forearm in the fist's own mesh), the jab reaches
// out to the middle of the view with the palm turned down, the guard raises both to the face
const pose = await page.evaluate(() => { const ip = ANIM_PARAMS.swing.impactPoint, v = new THREE.Vector3(), out = {};
  const keepW = EQ.weapon; EQ.weapon = null; EQ.offhand = null; buildViewmodel(); const u = vmSword.userData;
  const at = (o) => { o.updateMatrixWorld(true); return o.getWorldPosition(v).clone(); };
  const read = () => { const R = at(vmSword), L = at(u.fistL), up = new THREE.Vector3(0, 1, 0).applyQuaternion(vmSword.quaternion);
    _updateArmBridge(vmArmR); const eR = at(u.elbow), bR = vmArmR.position.clone().add(new THREE.Vector3(0, vmArmR.scale.y, 0).applyQuaternion(vmArmR.quaternion));
    return { R: R.toArray().map(x => +x.toFixed(3)), L: L.toArray().map(x => +x.toFixed(3)), backUp: +up.y.toFixed(2), gap: +eR.distanceTo(bR).toFixed(4) }; };
  swingT = 0; u.swingMax = 0; vmFistPose(0, 0, 0, 0); out.rest = read();
  u.swingMax = .4; swingT = .4 * (1 - ip); vmFistPose(0, 0, 0, 0); out.jab = read();
  u.swingIsPower = true; vmFistPose(0, 0, 0, 0); out.power = read(); u.swingIsPower = false;
  swingT = 0; u.swingMax = 0; vmFistPose(1, 0, 0, 0); out.guard = read();
  EQ.weapon = keepW; buildViewmodel(); return out; });
check('the arm bridge meets the forearm at the elbow in every pose', ['rest', 'jab', 'power', 'guard'].every(k => pose[k].gap < 1e-3), pose);
check('the jab reaches further out and nearer the middle than the rest, the left fist staying put', pose.jab.R[2] < pose.rest.R[2] - .15 && Math.abs(pose.jab.R[0]) < Math.abs(pose.rest.R[0]) && JSON.stringify(pose.jab.L) === JSON.stringify(pose.rest.L), pose);
check('it lands palm down (the back of the hand up)', pose.jab.backUp > .95, pose.jab);
check('the power punch reaches further than the jab', pose.power.R[2] < pose.jab.R[2] - .03, pose);
check('the guard raises both fists towards the face', pose.guard.R[1] > pose.rest.R[1] + .08 && pose.guard.L[1] > pose.rest.L[1] + .08 && pose.guard.R[2] > pose.rest.R[2], pose);

// in play (issue #81): with the fists up the swing runs in real frames and the punch lands on a foe in front
// the dummy stands in front only while the strike resolves (a bare ZE entry would trip the foes' own tick)
await page.evaluate(() => { EQ.weapon = null; EQ.offhand = null; buildViewmodel(); attack(false); window._fistSwing = swingT; window._fistHit = null;
  const ps = _pendingStrike, fn = ps && ps.resolveFn; if (!fn) return;
  ps.resolveFn = (pow) => { const rnd = Math.random; Math.random = () => .5; const mesh = new THREE.Group(); scene.add(mesh);
    const e = { name: 'Dummy', x: px + fwdX * 1.1, z: pz + fwdZ * 1.1, y: 0, hp: 1e6, maxHp: 1e6, def: 0, mesh, alert: false, ai: 'melee' };
    ZE.push(e); try { fn(pow); } finally { ZE.splice(ZE.indexOf(e), 1); scene.remove(mesh); Math.random = rnd; } window._fistHit = 1e6 - e.hp; }; });
let landed = null;
for (let i = 0; i < 60 && !landed; i++) { await g.frames(5); landed = await page.evaluate(() => (swingT === 0 && !_pendingStrike) ? { dmg: window._fistHit, swing: window._fistSwing } : null); }
check('a punch in play runs its swing out and lands on the foe in front', landed && landed.dmg > 0 && landed.swing > 0, landed);
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
