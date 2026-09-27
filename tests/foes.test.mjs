// Human foes on the townsfolk's body (Session 171): bandits, highwaymen, deserters, cultists, rogue mages and pirates
// are people (a genome each, dressed for what they are, their own material), walking and running by the enemy's
// position, swinging the right arm to strike, lying still when dead; a guard who draws keeps the guard's own body.
import { boot, check } from './lib/game.mjs';
import fs from 'fs';
const g = await boot(); const { page } = g;
await g.intoWorld();
fs.mkdirSync('tests/out', { recursive: true });

const built = await page.evaluate(() => { const fx = -Math.sin(yaw), fz = -Math.cos(yaw); window._F = {}; const out = {};
  ['Bandit', 'Bandit Archer', 'Highwayman', 'Deserter', 'Cultist', 'Rogue Mage', 'Pirate', 'Bandit Captain', 'Skeleton', 'Hollowed', 'Ghoul', 'Ash Wight', 'Wraith'].forEach((n, i) => { const x = px + fx * 30 + (i - 4) * 2, z = pz + fz * 30;
    const e = buildZoneEnemy(WORLD.scene, [], x, z, n, null); e.mesh.position.y = WORLD.worldH(x, z); e.locked = false; e.mesh.visible = true; _F[n] = e; const r = e.limbs && e.limbs.person;
    out[n] = r ? { person: true, skinned: r.mesh.isSkinnedMesh, hat: r.g.hat, gear: r.g.gear, skel: !!r.g.skel, dead: !!r.g.dead, age: r.g.age, tris: r.tris, eyes: r.B.head.children.some(c => c.isMesh && c.material.isMeshBasicMaterial), ownMat: r.mesh.material !== PEOPLE_MAT, armR: e.limbs.armR === r.B.shR, bar: +e.hpFg.position.y.toFixed(2) } : { person: false }; });
  const b2 = buildZoneEnemy(WORLD.scene, [], px + fx * 30, pz + fz * 30 + 3, 'Bandit', null); out.differ = b2.limbs.person.g.seed !== _F.Bandit.limbs.person.g.seed; b2.mesh.parent.remove(b2.mesh);
  return out; });
const humans = ['Bandit', 'Bandit Archer', 'Highwayman', 'Deserter', 'Cultist', 'Rogue Mage', 'Pirate'];
check('the seven human foes are people, dressed for what they are, each with its own material and its right shoulder as the striking arm',
  humans.every(n => built[n].person && built[n].skinned && built[n].ownMat && built[n].armR && built[n].bar > 1.2) && built.Bandit.hat === 'hood' && built.Deserter.hat === 'helm' && built.Deserter.gear === 'spear' && built.Pirate.hat === 'kerchief' && built.Highwayman.hat === 'brim',
  Object.fromEntries(humans.map(n => [n, built[n]])));
check('two bandits met in different places are different people', built.differ, { differ: built.differ });
// the captain (Session 175): a person with the shield on its left shoulder; the guard is held while it is up, and the
// arm goes back to the walk when the guard breaks
const cap = await page.evaluate(() => { const e = _F['Bandit Captain'], L = e.limbs, r = L.person; if (!r) return { person: false }; let t = 7e5;
  const onArm = !!L.shieldProp && L.shieldProp.parent === r.B.shL; tickPeople(1 / 60, t += 17); const up = { x: +r.B.shL.rotation.x.toFixed(2), z: +r.B.shL.rotation.z.toFixed(2), el: +r.B.elL.rotation.x.toFixed(2) };
  e.shieldUp = false; dropShieldGuard(e); for (let i = 0; i < 30; i++) tickPeople(1 / 60, t += 17); const down = { x: +r.B.shL.rotation.x.toFixed(2), z: +r.B.shL.rotation.z.toFixed(2) };
  reraiseGuard(e); tickPeople(1 / 60, t += 17); const again = +r.B.shL.rotation.x.toFixed(2); return { person: true, onArm, up, down, again, shieldUp: e.shieldUp }; });
check('the captain is a person with a shield on the left arm, held across the body while the guard is up, lowered when it breaks, raised again', cap.person && cap.onArm && cap.up.x === -1.15 && cap.up.z === -.5 && cap.up.el === -1.1 && cap.down.x !== -1.15 && cap.again === -1.15 && cap.shieldUp, cap);
check('the skeleton (Session 172) is bones on the people\'s skeleton: no flesh or clothes, burning eyes, a spear or a club', built.Skeleton.person && built.Skeleton.skel && built.Skeleton.eyes && /spear|stick/.test(built.Skeleton.gear) && built.Skeleton.tris > 1500 && built.Skeleton.tris < 6000 && built.Skeleton.ownMat, built.Skeleton);

check('the risen dead (Session 173) are people gone grey and stooped in rags, eyes lit; the wight in a helm with a spear; the wraith (Session 176) robed and hooded',
  ['Hollowed', 'Ghoul', 'Ash Wight', 'Wraith'].every(n => built[n].person && built[n].dead && built[n].age === 'elder' && built[n].eyes && built[n].ownMat) && built['Ash Wight'].hat === 'helm' && built['Ash Wight'].gear === 'spear' && built.Wraith.hat === 'hood',
  { Hollowed: built.Hollowed, Ghoul: built.Ghoul, 'Ash Wight': built['Ash Wight'], Wraith: built.Wraith });

// the wraith glides: see-through, no shadow, a little off the ground, and however it moves it takes no steps
const wr = await page.evaluate(() => { const e = _F.Wraith, r = e.limbs.person, G = e.mesh; let t = 8e5; const ys = [];
  for (let i = 0; i < 90; i++) { e.x += 1.4 / 60; G.position.set(e.x, WORLD.worldH(e.x, e.z), e.z); tickPeople(1 / 60, t += 16.7); ys.push(r.root.position.y); }
  return { transparent: r.mesh.material.transparent, opacity: r.mesh.material.opacity, shadow: r.mesh.castShadow, walk: +r.w.walk.toFixed(2), run: +r.w.run.toFixed(2), yMin: +Math.min(...ys).toFixed(2), yMax: +Math.max(...ys).toFixed(2), wraith: !!r.g.wraith }; });
check('the wraith is see-through and casts no shadow, glides a little off the ground with a slow bob, and takes no steps', wr.wraith && wr.transparent && wr.opacity < .8 && !wr.shadow && wr.walk < .05 && wr.run < .05 && wr.yMin > .15 && wr.yMax - wr.yMin > .03, wr);

// walking and running by the enemy's position (the group's lurch in a lunge is not a stride); no greeting wave
const move = await page.evaluate(() => { const e = _F.Bandit, r = e.limbs.person, G = e.mesh; const out = {}; let t = 3e5;
  const drive = (pace, n) => { for (let i = 0; i < n; i++) { e.x += pace / 60; G.position.set(e.x, WORLD.worldH(e.x, e.z), e.z); t += 16.7; tickPeople(1 / 60, t); } return { walk: +r.w.walk.toFixed(2), run: +r.w.run.toFixed(2), idle: +r.w.idle.toFixed(2), wave: +r.w.wave.toFixed(2) }; };
  out.still = drive(0, 60); px = e.x + 1.5; pz = e.z; out.nearStill = drive(0, 90); out.wander = drive(.39, 120); out.chase = drive(1.63, 120);
  // the lunge moves the group, not the enemy: no stride
  const ph = r.phase; for (let i = 0; i < 20; i++) { G.position.x += .02; t += 16.7; tickPeople(1 / 60, t); } out.lurchStride = +Math.abs(r.phase - ph).toFixed(3);
  return out; });
check('standing it idles (and never waves at you), wandering it walks, chasing it runs; the lunge\'s lurch takes no stride',
  move.still.idle > .9 && move.nearStill.wave < .01 && move.wander.walk > .9 && move.chase.run > .9 && move.lurchStride === 0, move);

// the strike swings the right arm; the wind-up flashes this foe alone; dead, it is left lying still
const atk = await page.evaluate(() => { const e = _F.Bandit, r = e.limbs.person; const out = {};
  e._wind = .9; attackPose(e, false); out.arm = +r.B.shR.rotation.x.toFixed(2); out.tilt = +e.mesh.rotation.x.toFixed(2); e._wind = 0;
  telegraphPulse(e, 1); out.own = +r.mesh.material.emissive.r.toFixed(2); out.shared = PEOPLE_MAT.emissive.r; out.other = _F.Pirate.limbs.person.mesh.material.emissive.r; telegraphReset(e);
  e.dead = true; const before = r.B.spine.rotation.x; tickPeople(1 / 60, 9e5); tickPeople(1 / 60, 9e5 + 900); out.still = r.B.spine.rotation.x === before; return out; });
check('winding up swings the right arm back without tipping the body; the flash is this foe\'s alone; dead, it lies still', atk.arm > 1 && atk.tilt === 0 && atk.own > .5 && atk.shared === 0 && atk.other === 0 && atk.still, atk);

// a despawned foe leaves the rig set
const gone = await page.evaluate(() => { const e = _F.Cultist, r = e.limbs.person; e.mesh.parent.remove(e.mesh); tickPeople(1 / 60, 9.5e5); return { left: !PEOPLE_RIGS.has(r) }; });
check('a despawned foe leaves the rig set', gone.left, gone);

// the photograph: the seven, standing, then running and winding up
const shot = await page.evaluate(() => { forceTime(12); const cv = REN.domElement, sc = WORLD.scene; const bx = px + 300, bz = pz, y = WORLD.worldH(bx, bz) + 60;
  const out = document.createElement('canvas'); out.width = 1280; out.height = 720; const x2 = out.getContext('2d'); const cam = new THREE.PerspectiveCamera(30, cv.width / cv.height, .05, 100);
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(16, 10), new THREE.MeshLambertMaterial({ color: 0x6a7a48 })); floor.rotation.x = -Math.PI / 2; floor.position.set(bx, y, bz); sc.add(floor);
  const rigs = []; ['Bandit', 'Bandit Archer', 'Highwayman', 'Deserter', 'Cultist', 'Rogue Mage', 'Pirate', 'Bandit Captain', 'Skeleton', 'Hollowed', 'Ghoul', 'Ash Wight', 'Wraith'].forEach((n, i) => { const r = buildFoe(n, i * 7, 3, null, 0x60c0ff); PEOPLE_RIGS.delete(r); r.root.position.set(bx - 4.2 + i * .7, r.g.wraith ? y + .24 : y, bz); r.root.rotation.y = .35; sc.add(r.root); rigs.push(r);
    pwApply(r, i % 2 ? pwRun(.2 * i, {holds: r.holds, gear: r.g.gear, elder: r.g.age === 'elder'}) : pwIdle(i, {holds: r.holds, gear: r.g.gear, elder: r.g.age === 'elder'})); });
  cam.position.set(bx, y + 1.3, bz + 8.6); cam.lookAt(bx, y + .55, bz); sc.updateMatrixWorld(true); REN.render(sc, cam); x2.drawImage(cv, 0, 0, cv.width, cv.height, 0, 0, 1280, 720);
  rigs.forEach(r => sc.remove(r.root)); sc.remove(floor); return out.toDataURL(); });
fs.writeFileSync('tests/out/foes.png', Buffer.from(shot.split(',')[1], 'base64'));

// a town guard who draws on you keeps the body you spoke to
await g.settle('dunmore');
const guard = await page.evaluate(() => { const S = WORLD.settle.get('dunmore'); const genOf = n => { let gen = null; n.g.traverse(o => { if (!gen && o.userData && o.userData.rig) gen = o.userData.rig.g; }); return gen; };
  // a guard by its schedule; one whose genome is a guard's if there is one (a guard who shares a name with a townsperson
  // shares that person's look under the name|site genome cache: the critic's duplicate-names item)
  const gs = WORLD.guardsOf(S); const n = gs.find(n => { const x = genOf(n); return x && x.hat === 'helm'; }) || gs[0]; if (!n) return { none: true }; const gen = genOf(n);
  const e = WORLD.guardDraw(n, S); const r = e && e.limbs && e.limbs.person; const res = { drew: !!e, person: !!r, same: !!r && r.g === gen, name: e && e.name, who: n.def && n.def.name, hat: r && r.g.hat, genHat: gen && gen.hat, gear: r && r.g.gear, guards: gs.length };
  try { e.dead = true; e.mesh.parent.remove(e.mesh); n._drawn = false; n.g.visible = true; } catch (err) {} return res; });
check('a guard who draws is the same person (the look the guard wears in the street), not a bandit in red', guard.drew && guard.person && guard.same && guard.name === 'Town Guard' && !!guard.hat && guard.hat === guard.genHat, guard);
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
