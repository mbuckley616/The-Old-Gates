// The trolls on the people's body (Session 208, Michael's answer on Session 201's prototype: "as shown", with a hammer
// in place of the cane): the Cave, Forest and Frost Troll are people grown heavy and stooped, tusked, with a maul.
import { boot, check } from './lib/game.mjs';
import { enterDungeon } from './lib/dungeonshot.mjs';
import fs from 'fs';
const g = await boot(); const { page } = g;
await g.intoWorld();
fs.mkdirSync('tests/out', { recursive: true });

const built = await page.evaluate(() => { const fx = -Math.sin(yaw), fz = -Math.cos(yaw); window._T = {}; const out = {};
  ['Forest Troll', 'Frost Troll', 'Bandit'].forEach((n, i) => { const x = px + fx * 30 + (i - 1) * 3, z = pz + fz * 30;
    const e = buildZoneEnemy(WORLD.scene, [], x, z, n, null); e.mesh.position.y = WORLD.worldH(x, z); e.locked = false; e.mesh.visible = true; _T[n] = e; const r = e.limbs && e.limbs.person;
    e.mesh.updateMatrixWorld(true); const bb = r ? new THREE.Box3().setFromObject(r.mesh) : null;
    out[n] = r ? { person: true, skinned: r.mesh.isSkinnedMesh, ownMat: r.mesh.material !== PEOPLE_MAT, armR: e.limbs.armR === r.B.shR, troll: !!r.g.troll, gear: r.g.gear, build: r.g.build, head: r.g.head,
      tall: +(bb.max.y - bb.min.y).toFixed(2), wide: +(bb.max.x - bb.min.x).toFixed(2), skin: '#' + r.g.skin.getHexString(), tris: r.tris, shape: e.shape } : { person: false }; });
  // the maul reaches past a club: the gear bone's vertices climb further up the haft than the kobold's hammer
  const reach = t => { const r = buildFoe(t, 5, 5); const gb = r.B.gear; let top = 0; const pos = r.mesh.geometry.attributes.position, sk = r.mesh.geometry.attributes.skinIndex;
    for (let i = 0; i < pos.count; i++) if (sk.getX(i) === gb.userData.i) top = Math.max(top, pos.getY(i)); PEOPLE_RIGS.delete(r); r.mesh.geometry.dispose(); return +top.toFixed(3); };
  out.reachTroll = reach('Cave Troll'); out.reachKobold = reach('Kobold'); return out; });
check('forest and frost trolls are people on their own material, the right shoulder striking, still brutes', ['Forest Troll', 'Frost Troll'].every(n => built[n].person && built[n].skinned && built[n].ownMat && built[n].armR && built[n].troll && built[n].shape === 'brute'), built);
check('a troll is heavy, big-headed and carries a maul', ['Forest Troll', 'Frost Troll'].every(n => built[n].gear === 'maul' && built[n].build > 1.7 && built[n].head > 1.1), built);
check('a frost troll stands taller and wider than a bandit', built['Frost Troll'].tall > built.Bandit.tall * 1.3 && built['Frost Troll'].wide > built.Bandit.wide * 1.3, { frost: built['Frost Troll'], bandit: built.Bandit });
check('the maul\'s head stands above the fist, further than the kobold\'s hammer', built.reachTroll > built.reachKobold, { troll: built.reachTroll, kobold: built.reachKobold });

const move = await page.evaluate(() => { const e = _T['Forest Troll'], r = e.limbs.person, G = e.mesh; let t = 3e5;
  const drive = (pace, n) => { for (let i = 0; i < n; i++) { e.x += pace / 60; G.position.set(e.x, WORLD.worldH(e.x, e.z), e.z); t += 16.7; tickPeople(1 / 60, t); } return { walk: +r.w.walk.toFixed(2), run: +r.w.run.toFixed(2), idle: +r.w.idle.toFixed(2) }; };
  return { still: drive(0, 60), chase: drive(1.0, 150) }; });
check('a troll stands idle and walks when it chases', move.still.idle > .9 && move.chase.run + move.chase.walk > .9, move);

// the photograph: a bandit for scale, then a cave troll, a forest troll walking, a frost troll
const shot = await page.evaluate(async () => { forceTime(12); const cv = REN.domElement, sc = WORLD.scene; const bx = px + 300, bz = pz, y = WORLD.worldH(bx, bz) + 60;
  const cam = new THREE.PerspectiveCamera(30, cv.width / cv.height, .05, 100);
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(16, 10), new THREE.MeshLambertMaterial({ color: 0x6a7a48 })); floor.rotation.x = -Math.PI / 2; floor.position.set(bx, y, bz); sc.add(floor);
  const L = [['Bandit', 1], ['Cave Troll', 1.5], ['Forest Troll', 1.2], ['Frost Troll', 1.55]]; const rigs = [];
  L.forEach(([n, s], i) => { const r = buildFoe(n, i * 7, 3); PEOPLE_RIGS.delete(r); r.root.scale.multiplyScalar(s); r.root.position.set(bx - 2.4 + i * 1.5, y, bz); r.root.rotation.y = i === 2 ? Math.PI / 2 : .45; sc.add(r.root); rigs.push(r);
    pwApply(r, i === 2 ? pwWalk(.3, { holds: r.holds, gear: r.g.gear }) : pwIdle(i + 1, { holds: r.holds, gear: r.g.gear, elder: r.g.age === 'elder' })); });
  cam.position.set(bx, y + 1.4, bz + 6.2); cam.lookAt(bx, y + .8, bz); sc.updateMatrixWorld(true); REN.render(sc, cam);
  const o = document.createElement('canvas'); o.width = cv.width; o.height = cv.height; o.getContext('2d').drawImage(cv, 0, 0);
  rigs.forEach(r => sc.remove(r.root)); sc.remove(floor); return o.toDataURL(); });
fs.writeFileSync('tests/out/trolls.png', Buffer.from(shot.split(',')[1], 'base64'));
// the dungeon's Cave Troll: a person too, walked by its own enemy
let ct = { none: true };
for (const seed of [5, 12, 17, 23, 31, 44]) { await page.evaluate(() => { level = 6; }); await enterDungeon(page, { theme: 'goblin', seed });
  ct = await page.evaluate(() => { const e = ENEMIES.find(x => (x.baseType || x.name) === 'Cave Troll'); if (!e) return { none: true }; const r = e.limbs && e.limbs.person;
    return r ? { person: true, troll: !!r.g.troll, gear: r.g.gear, linked: r.e === e, inRigs: PEOPLE_RIGS.has(r), barAbove: e.hpBg ? e.hpBg.position.y > 1.8 : null } : { person: false }; });
  if (!ct.none) break; }
check('the dungeon\'s Cave Troll is a troll on the people\'s body, walked by its own enemy', !ct.none && ct.person && ct.troll && ct.gear === 'maul' && ct.linked && ct.inRigs, ct);

check('no page errors', g.errs.length === 0, g.errs);
await g.close();
