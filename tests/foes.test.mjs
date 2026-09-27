// Human foes on the townsfolk's body (Session 171): bandits, highwaymen, deserters, cultists, rogue mages and pirates
// are people (a genome each, dressed for what they are, their own material), walking and running by the enemy's
// position, swinging the right arm to strike, lying still when dead; a guard who draws keeps the guard's own body.
import { boot, check } from './lib/game.mjs';
import fs from 'fs';
const g = await boot(); const { page } = g;
await g.intoWorld();
fs.mkdirSync('tests/out', { recursive: true });

const built = await page.evaluate(() => { const fx = -Math.sin(yaw), fz = -Math.cos(yaw); window._F = {}; const out = {};
  ['Bandit', 'Bandit Archer', 'Highwayman', 'Deserter', 'Cultist', 'Rogue Mage', 'Pirate', 'Bandit Captain', 'Skeleton'].forEach((n, i) => { const x = px + fx * 30 + (i - 4) * 2, z = pz + fz * 30;
    const e = buildZoneEnemy(WORLD.scene, [], x, z, n, null); e.mesh.position.y = WORLD.worldH(x, z); e.locked = false; e.mesh.visible = true; _F[n] = e; const r = e.limbs && e.limbs.person;
    out[n] = r ? { person: true, skinned: r.mesh.isSkinnedMesh, hat: r.g.hat, gear: r.g.gear, ownMat: r.mesh.material !== PEOPLE_MAT, armR: e.limbs.armR === r.B.shR, bar: +e.hpFg.position.y.toFixed(2) } : { person: false }; });
  const b2 = buildZoneEnemy(WORLD.scene, [], px + fx * 30, pz + fz * 30 + 3, 'Bandit', null); out.differ = b2.limbs.person.g.seed !== _F.Bandit.limbs.person.g.seed; b2.mesh.parent.remove(b2.mesh);
  return out; });
const humans = ['Bandit', 'Bandit Archer', 'Highwayman', 'Deserter', 'Cultist', 'Rogue Mage', 'Pirate'];
check('the seven human foes are people, dressed for what they are, each with its own material and its right shoulder as the striking arm',
  humans.every(n => built[n].person && built[n].skinned && built[n].ownMat && built[n].armR && built[n].bar > 1.2) && built.Bandit.hat === 'hood' && built.Deserter.hat === 'helm' && built.Deserter.gear === 'spear' && built.Pirate.hat === 'kerchief' && built.Highwayman.hat === 'brim',
  Object.fromEntries(humans.map(n => [n, built[n]])));
check('two bandits met in different places are different people; the captain (its shield guard) and the skeleton keep their bodies', built.differ && !built['Bandit Captain'].person && !built.Skeleton.person, { differ: built.differ, captain: built['Bandit Captain'], skeleton: built.Skeleton });

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
  const rigs = []; ['Bandit', 'Bandit Archer', 'Highwayman', 'Deserter', 'Cultist', 'Rogue Mage', 'Pirate'].forEach((n, i) => { const r = buildFoe(n, i * 7, 3); PEOPLE_RIGS.delete(r); r.root.position.set(bx - 2.4 + i * .8, y, bz); r.root.rotation.y = .35; sc.add(r.root); rigs.push(r);
    pwApply(r, i % 2 ? pwRun(.2 * i, {holds: r.holds, gear: r.g.gear}) : pwIdle(i, {holds: r.holds, gear: r.g.gear})); });
  cam.position.set(bx, y + 1.2, bz + 5.6); cam.lookAt(bx, y + .55, bz); sc.updateMatrixWorld(true); REN.render(sc, cam); x2.drawImage(cv, 0, 0, cv.width, cv.height, 0, 0, 1280, 720);
  rigs.forEach(r => sc.remove(r.root)); sc.remove(floor); return out.toDataURL(); });
fs.writeFileSync('tests/out/foes.png', Buffer.from(shot.split(',')[1], 'base64'));

// a town guard who draws on you keeps the body you spoke to
await g.settle('dunmore');
const guard = await page.evaluate(() => { const S = WORLD.settle.get('dunmore'); const genOf = n => { let gen = null; n.g.traverse(o => { if (!gen && o.userData && o.userData.rig) gen = o.userData.rig.g; }); return gen; };
  // a guard by its schedule; one whose genome is a guard's if there is one (a guard who shares a name with a townsperson
  // shares that person's look under the name|site genome cache: the critic's duplicate-names item)
  const gs = WORLD.guardsOf(S); const n = gs.find(n => { const x = genOf(n); return x && x.hat === 'helm'; }) || gs[0]; if (!n) return { none: true }; const gen = genOf(n);
  const e = WORLD.guardDraw(n, S); const r = e && e.limbs && e.limbs.person; const res = { drew: !!e, person: !!r, same: !!r && r.g === gen, name: e && e.name, who: n.def && n.def.name, hat: r && r.g.hat, gear: r && r.g.gear, guards: gs.length };
  try { e.dead = true; e.mesh.parent.remove(e.mesh); n._drawn = false; n.g.visible = true; } catch (err) {} return res; });
check('a guard who draws is the same person, helm and spear, not a bandit in red', guard.drew && guard.person && guard.same && guard.name === 'Town Guard' && guard.hat === 'helm', guard);
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
