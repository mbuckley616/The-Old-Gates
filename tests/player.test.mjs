// The player's body (Session 154): the same builder as the townsfolk, tpPose's combat poses on top, the gait when walking.
import { boot, check } from './lib/game.mjs';
const g = await boot(); const { page } = g;
await g.intoWorld();

const creator = await page.evaluate(() => ({ has: !!(CCL.rig && CCL.rig.rig), skinned: !!(CCL.rig && CCL.rig.rig.mesh.isSkinnedMesh), styles: LOOK_STYLES.length, beards: LOOK_BEARDS.length }));
check('the creator preview is the new body, with the full run of styles and beards', creator.has && creator.skinned && creator.styles >= 13 && creator.beards >= 14, creator);

const tp = await page.evaluate(() => { thirdPerson = true; tpUpdate(1 / 60, { moving: false, sprinting: false, camY: 1.6, now: performance.now() }); const R = TP.rig;
  return { skinned: !!(R && R.rig && R.rig.mesh.isSkinnedMesh), bones: R && R.rig.mesh.skeleton.bones.length, inScene: !!(R && R.root.parent === scene), hipsY: +R.hips.position.y.toFixed(2), tris: R && R.rig.tris,
    look: { style: R.rig.g.style, beard: R.rig.g.beard, tattoo: R.rig.g.tattoo }, notTicked: ![...PEOPLE_RIGS].includes(R.rig) }; });
check('third person is one skinned mesh on the same seventeen bones, driven by tpPose alone', tp.skinned && tp.bones === 17 && tp.inScene && tp.notTicked, tp);

// kit: a cuirass, a helm, gauntlets, a sword and a shield rebuild the body with the kit on it
const kit = await page.evaluate(() => { const before = TP.sig;
  EQ.chest = { name: 'Iron Cuirass', slot: 'chest' }; EQ.head = { name: 'Iron Helm', slot: 'head' }; EQ.hands = { name: 'Iron Gauntlets', slot: 'hands' };
  EQ.weapon = { name: 'Steel Sword', slot: 'weapon', weaponShape: 'sword' }; EQ.offhand = { name: 'Round Shield', slot: 'offhand', shieldType: 'shield' }; EQ.amulet = { name: 'Amulet' };
  tpUpdate(1 / 60, { moving: false, sprinting: false, camY: 1.6, now: performance.now() }); const R = TP.rig; const e = R.rig.g.eq;
  return { rebuilt: TP.sig !== before, cuirass: !!(e.chest && !e.chest.cloth), helm: R.rig.g.hat === 'helm', gauntlets: !!e.hands, amulet: e.amulet, sword: !!R.weapon && R.weapon.parent === R.handR, shield: !!R.shield && R.shield.parent === R.elL, tris: R.rig.tris }; });
check('a cuirass, helm, gauntlets, amulet, sword and shield go on the body', kit.rebuilt && kit.cuirass && kit.helm && kit.gauntlets && kit.amulet && kit.sword && kit.shield, kit);

// walking: the stride follows the ground, feet planted; a swing still moves the sword arm
const walk = await page.evaluate(() => { const R = TP.rig; const vL = new THREE.Vector3(), vR = new THREE.Vector3(); let prev = null, still = 0, swing = 0; const ph0 = TP.gph || 0;
  for (let i = 1; i <= 90; i++) { px += Math.sin(yaw) * -.012; pz += Math.cos(yaw) * -.012; tpUpdate(1 / 60, { moving: true, sprinting: false, camY: 1.6, now: 1e5 + i * 16.7 }); R.root.updateMatrixWorld(true);
    R.ankleL.getWorldPosition(vL); R.ankleR.getWorldPosition(vR); const cur = [vL.clone(), vR.clone()];
    if (prev && i > 40) { const dL = cur[0].distanceTo(prev[0]), dR = cur[1].distanceTo(prev[1]); still = Math.max(still, Math.min(dL, dR)); swing = Math.max(swing, Math.max(dL, dR)); } prev = cur; }
  const adv = ((TP.gph - ph0) + 10) % 1, expect = (90 * .012) / (PW.cycle * R.root.scale.x) % 1;
  const before = R.shR.rotation.x; swingT = .3; if (typeof vmSword !== 'undefined' && vmSword) vmSword.userData.swingMax = .5; tpUpdate(1 / 60, { moving: false, sprinting: false, camY: 1.6, now: 2e5 }); tpUpdate(1 / 60, { moving: false, sprinting: false, camY: 1.6, now: 2e5 + 17 }); const after = R.shR.rotation.x; swingT = 0;
  return { adv: +adv.toFixed(3), expect: +expect.toFixed(3), stillMm: +(still * 1000).toFixed(2), swingMm: +(swing * 1000).toFixed(1), armMoved: Math.abs(after - before) > .05 }; });
check('walking, the player\'s feet stay planted; a swing still raises the sword arm', Math.abs(walk.adv - walk.expect) < .01 && walk.stillMm < 4 && walk.swingMm > 8 && walk.armMoved, walk);

// the photograph: third person, from behind, kit on
await page.evaluate(() => { EQ.head = null; EQ.hands = null; TP.want = 2.4; pitch = -.15; }); await page.waitForTimeout(2500);
await page.screenshot({ path: 'tests/out/player-third.png' });
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
