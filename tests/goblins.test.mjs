// Goblins and kobolds on the people's body (Session 184, Michael's decision on Session 178's prototype): the goblin is
// the folklore goblin (green, big-headed, long pointed ears baked into the body), the kobold the old mine-sprite
// (small, bearded, hooded, a mattock). Both are people like the bandits: their own material, walking by the enemy's position.
import { boot, check } from './lib/game.mjs';
import fs from 'fs';
const g = await boot(); const { page } = g;
await g.intoWorld();
fs.mkdirSync('tests/out', { recursive: true });

const built = await page.evaluate(() => { const fx = -Math.sin(yaw), fz = -Math.cos(yaw); window._G = {}; const out = {};
  ['Goblin', 'Goblin Slinger', 'Kobold', 'Bandit'].forEach((n, i) => { const x = px + fx * 30 + (i - 2) * 2, z = pz + fz * 30;
    const e = buildZoneEnemy(WORLD.scene, [], x, z, n, null); e.mesh.position.y = WORLD.worldH(x, z); e.locked = false; e.mesh.visible = true; _G[n] = e; const r = e.limbs && e.limbs.person;
    e.mesh.updateMatrixWorld(true); const bb = r ? new THREE.Box3().setFromObject(r.mesh) : null;
    out[n] = r ? { person: true, skinned: r.mesh.isSkinnedMesh, ownMat: r.mesh.material !== PEOPLE_MAT, armR: e.limbs.armR === r.B.shR, goblin: !!r.g.goblin, head: r.g.head, hat: r.g.hat, beard: r.g.beard, gear: r.g.gear, wpn: r.g.wpn || null,
      green: r.g.skin.g > r.g.skin.r && r.g.skin.g > r.g.skin.b, tris: r.tris, scale: +r.root.scale.y.toFixed(2) } : { person: false }; });
  const b2 = buildZoneEnemy(WORLD.scene, [], px + fx * 30, pz + fz * 30 + 3, 'Goblin', null); out.differ = b2.limbs.person.g.seed !== _G.Goblin.limbs.person.g.seed; b2.mesh.parent.remove(b2.mesh);
  // the ears: a goblin's head carries more geometry out to the side than a person's (the cones reach past the skull)
  const span = t => { const r = buildFoe(t, 5, 5); const h = r.B.head; let far = 0; const pos = r.mesh.geometry.attributes.position, sk = r.mesh.geometry.attributes.skinIndex;
    for (let i = 0; i < pos.count; i++) if (sk.getX(i) === h.userData.i) far = Math.max(far, Math.abs(pos.getX(i))); PEOPLE_RIGS.delete(r); r.mesh.geometry.dispose(); return +far.toFixed(3); };
  out.earGoblin = span('Goblin'); out.earBandit = span('Bandit'); return out; });
check('goblins, slingers and kobolds are people on their own material, the right shoulder striking', ['Goblin', 'Goblin Slinger', 'Kobold'].every(n => built[n].person && built[n].skinned && built[n].ownMat && built[n].armR), built);
// S559 — Session 535 (Michael, the inspector: "probably not be holding a cane") gave the goblin a rusted knife from the kit for its club;
// the club was this check's, and it went red on CI with that change
check('the goblin is green and big-headed, bare-headed, beardless, with a rusted knife from the kit; the slinger empty-handed', built.Goblin.goblin && built.Goblin.green && built.Goblin.head > 1.3 && built.Goblin.hat === 'none' && built.Goblin.beard === 'none' && built.Goblin.gear === 'kit' && built.Goblin.wpn === 'dagger' && built['Goblin Slinger'].goblin && built['Goblin Slinger'].gear === null, built.Goblin);
check('the goblin\'s ears reach out past a person\'s', built.earGoblin > built.earBandit * 1.5, { goblin: built.earGoblin, bandit: built.earBandit });
check('the kobold is a small hooded greybeard with a mattock', !built.Kobold.goblin && built.Kobold.hat === 'hood' && built.Kobold.beard === 'long' && built.Kobold.gear === 'hammer' && built.Kobold.scale < .7 && built.Kobold.scale < built.Bandit.scale * .75, { kobold: built.Kobold, bandit: built.Bandit.scale });
check('two goblins met in different places are different', built.differ, { differ: built.differ });

const move = await page.evaluate(() => { const e = _G.Goblin, r = e.limbs.person, G = e.mesh; let t = 3e5;
  const drive = (pace, n) => { for (let i = 0; i < n; i++) { e.x += pace / 60; G.position.set(e.x, WORLD.worldH(e.x, e.z), e.z); t += 16.7; tickPeople(1 / 60, t); } return { walk: +r.w.walk.toFixed(2), run: +r.w.run.toFixed(2), idle: +r.w.idle.toFixed(2) }; };
  return { still: drive(0, 60), chase: drive(1.5, 150) }; });
check('a goblin stands idle and runs when it chases', move.still.idle > .9 && move.chase.run + move.chase.walk > .9, move);

// the photograph: a bandit for scale, then goblins, a slinger running, kobolds
const shot = await page.evaluate(() => { forceTime(12); const cv = REN.domElement, sc = WORLD.scene; const bx = px + 300, bz = pz, y = WORLD.worldH(bx, bz) + 60;
  const cam = new THREE.PerspectiveCamera(30, cv.width / cv.height, .05, 100);
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(16, 10), new THREE.MeshLambertMaterial({ color: 0x6a7a48 })); floor.rotation.x = -Math.PI / 2; floor.position.set(bx, y, bz); sc.add(floor);
  const L = [['Bandit', 1], ['Goblin', .72], ['Goblin', .72], ['Goblin Slinger', .8], ['Kobold', .75], ['Kobold', .75], ['Kobold', .75]]; const rigs = [];
  L.forEach(([n, s], i) => { const r = buildFoe(n, i * 7, 3); PEOPLE_RIGS.delete(r); r.root.scale.multiplyScalar(s); r.root.position.set(bx - 2.4 + i * .8, y, bz); r.root.rotation.y = i === 3 ? Math.PI / 2 : .4; sc.add(r.root); rigs.push(r);
    pwApply(r, i === 3 || i === 6 ? pwRun(.3, { holds: r.holds, gear: r.g.gear }) : pwIdle(i, { holds: r.holds, gear: r.g.gear, elder: r.g.age === 'elder' })); });
  cam.position.set(bx, y + 1.0, bz + 5.6); cam.lookAt(bx, y + .45, bz); sc.updateMatrixWorld(true); REN.render(sc, cam);
  const o = document.createElement('canvas'); o.width = cv.width; o.height = cv.height; o.getContext('2d').drawImage(cv, 0, 0);
  rigs.forEach(r => sc.remove(r.root)); sc.remove(floor); return o.toDataURL(); });
fs.writeFileSync('tests/out/goblins.png', Buffer.from(shot.split(',')[1], 'base64'));
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
