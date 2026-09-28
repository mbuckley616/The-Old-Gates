// The weapon kit on the foes (Session 226, Michael's answer A on Session 220: the kit for everyone, every foe armed by what
// it is, looks only). Bandits and highwaymen carry a sword or an axe, deserters a mace or a spear with a kite shield,
// archers a bow, mages a staff, cultists a dagger, pirates a cutlass, the captain a sword; a skeleton's is rusted.
import { boot, check } from './lib/game.mjs';
import { enterDungeon } from './lib/dungeonshot.mjs';
import fs from 'fs';
const g = await boot(); const { page } = g;
await g.intoWorld();
fs.mkdirSync('tests/out', { recursive: true });

const kit = await page.evaluate(() => { const out = {}; const drop = r => { PEOPLE_RIGS.delete(r); r.mesh.geometry.dispose(); };
  // every kind builds with no boxes, at most four meshes, shared geometry
  out.kinds = WPN_KINDS.map(k => { const a = buildWeapon(k), b = buildWeapon(k); let boxes = 0, tris = 0; a.traverse(o => { if (o.isMesh) { if (o.geometry.type === 'BoxGeometry') boxes++; tris += o.geometry.index.count / 3; } });
    const bb = new THREE.Box3().setFromObject(a); return { k, meshes: a.children.length, shared: a.children[0].geometry === b.children[0].geometry, boxes, tris: Math.round(tris), h: +(bb.max.y - bb.min.y).toFixed(2) }; });
  // who carries what, over many seeds
  const tally = {}; for (const n of ['Bandit', 'Highwayman', 'Deserter', 'Bandit Archer', 'Rogue Mage', 'Cultist', 'Pirate', 'Bandit Captain', 'Skeleton', 'Kobold', 'Cave Troll'])
    for (let i = 0; i < 24; i++) { const r = buildFoe(n, i * 31 + 7, i * 17 + 3); const w = r.weapon, t = tally[n] || (tally[n] = { wpn: {}, shield: 0, gear: {}, onBone: 0, bowLeft: 0, rust: 0, fist: 0 });
      const k = w ? w.userData.wpn : '-'; t.wpn[k] = (t.wpn[k] || 0) + 1; t.gear[r.g.gear] = (t.gear[r.g.gear] || 0) + 1; if (r.shieldKit && r.shieldKit.parent === r.B.elL) t.shield++;
      if (w && w.parent === (k === 'bow' ? r.B.wrL : r.B.gear)) t.onBone++; if (k === 'bow' && w.parent === r.B.wrL) t.bowLeft++;
      if (w && w.children.every(m => m.material !== WPN_MAT.metal)) t.rust++; drop(r); }
  out.tally = tally; return out; });
const bad = kit.kinds.filter(k => !(k.meshes >= 1 && k.meshes <= 4 && k.shared && k.boxes === 0));
check('every weapon in the kit is built without boxes, in at most four meshes, its geometry shared', bad.length === 0, { bad, kinds: kit.kinds });
const T = kit.tally, has = (n, ...ks) => ks.every(k => T[n].wpn[k] > 0);
check('bandits carry swords and axes, some with a round shield; highwaymen swords and axes', has('Bandit', 'sword', 'axe') && T.Bandit.shield > 2 && T.Bandit.shield < 20 && has('Highwayman', 'sword', 'axe') && T.Highwayman.shield === 0, { Bandit: T.Bandit, Highwayman: T.Highwayman });
check('deserters carry a mace or a spear, every one with a kite shield', has('Deserter', 'mace') && T.Deserter.wpn['-'] > 0 && T.Deserter.gear.spear === T.Deserter.wpn['-'] && T.Deserter.shield === 24, T.Deserter);
check('archers a bow in the left hand, mages a staff, cultists a dagger, pirates a cutlass, the captain a sword',
  T['Bandit Archer'].bowLeft === 24 && T['Rogue Mage'].wpn.staff === 24 && T.Cultist.wpn.dagger === 24 && T.Pirate.wpn.cutlass === 24 && T['Bandit Captain'].wpn.sword === 24, { a: T['Bandit Archer'], m: T['Rogue Mage'], c: T.Cultist, p: T.Pirate, cap: T['Bandit Captain'] });
check('every kit weapon hangs on the gear bone (the bow on the left wrist)', Object.values(T).every(t => t.onBone === 24 - (t.wpn['-'] || 0)), T);
check('a skeleton carries a rusted sword or its spear; kobolds and trolls keep their own tools', has('Skeleton', 'sword') && T.Skeleton.rust === T.Skeleton.wpn.sword && T.Skeleton.gear.spear > 0 && T.Kobold.wpn['-'] === 24 && T['Cave Troll'].wpn['-'] === 24, { s: T.Skeleton, k: T.Kobold, t: T['Cave Troll'] });

// in play: a zone bandit's weapon follows the fist through the strike
const swing = await page.evaluate(() => { const fx = -Math.sin(yaw), fz = -Math.cos(yaw), x = px + fx * 20, z = pz + fz * 20; const e = buildZoneEnemy(WORLD.scene, [], x, z, 'Highwayman', null); e.mesh.position.set(x, WORLD.worldH(x, z), z); e.locked = false; e.mesh.visible = true; if (!e.mesh.parent) WORLD.scene.add(e.mesh);
  const r = e.limbs.person, w = r.weapon; const at = () => { e.mesh.updateMatrixWorld(true); return new THREE.Vector3().setFromMatrixPosition(w.matrixWorld); }; let t = 6e5;
  for (let i = 0; i < 20; i++) tickPeople(1 / 60, t += 16.7); const a = at(); e._wind = 1; for (let i = 0; i < 20; i++) tickPeople(1 / 60, t += 16.7); attackPose(e, false); const b = at(); e._wind = 0;
  return { moved: +a.distanceTo(b).toFixed(3), wpn: w.userData.wpn }; });
check('in play the weapon moves with the arm through the wind-up', swing.moved > .05, swing);

// the dungeon's skeletons: armed too
let dun = { none: true };
for (const seed of [7, 12]) { await enterDungeon(page, { theme: 'undead', seed });
  dun = await page.evaluate(() => { const L = ENEMIES.filter(e => (e.baseType || e.name) === 'Skeleton' && e.limbs && e.limbs.person); if (!L.length) return { none: true };
    return { n: L.length, armed: L.filter(e => e.limbs.person.weapon || e.limbs.person.g.gear === 'spear').length }; }); if (!dun.none) break; }
check('the dungeon\'s skeletons carry a rusted sword or a spear', !dun.none && dun.armed === dun.n, dun);

// S231 — the shields carried on the guard arm: the captain's is the kit's round shield, the shieldbearer's a tower shield
const cap = await page.evaluate(() => { const fx = -Math.sin(yaw), fz = -Math.cos(yaw), x = px + fx * 22, z = pz + fz * 22; const e = buildZoneEnemy(WORLD.scene, [], x, z, 'Bandit Captain', null); const sp = e.limbs.shieldProp;
  let cyl = 0; sp.traverse(o => { if (o.isMesh && o.geometry.type === 'CylinderGeometry') cyl++; }); return { kit: sp && sp.userData.kit, onArm: sp && sp.parent === e.limbs.armL, cyl, guard: e.shieldUp }; });
check('the bandit captain\'s shield is the kit\'s round shield on its guard arm, the old disc gone', cap.kit === 'round' && cap.onArm && cap.cyl === 0 && cap.guard, cap);
let sb = { none: true };
for (const seed of [5, 12, 17, 23]) { await page.evaluate(() => { level = 5; }); await enterDungeon(page, { theme: 'goblin', seed });
  sb = await page.evaluate(() => { const e = ENEMIES.find(x => (x.baseType || x.name) === 'Shieldbearer'); if (!e) return { none: true }; const sp = e.limbs.shieldProp; const bb = new THREE.Box3().setFromObject(sp);
    return { kit: sp.userData.kit, onArm: sp.parent === e.limbs.armL, tall: +(bb.max.y - bb.min.y).toFixed(2), wpn: e.limbs.person && e.limbs.person.weapon && e.limbs.person.weapon.userData.wpn }; }); if (!sb.none) break; }
check('the dungeon\'s shieldbearer carries a tower shield on its guard arm and a mace', !sb.none && sb.kit === 'tower' && sb.onArm && sb.wpn === 'mace', sb);

// the photograph
const shot = await page.evaluate(() => { forceTime(12); const cv = REN.domElement, sc = scene; const bx = px + 300, bz = pz, y = 60; const objs = [];
  const cam = new THREE.PerspectiveCamera(30, cv.width / cv.height, .05, 100);
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(16, 10), new THREE.MeshLambertMaterial({ color: 0x5a6040 })); floor.rotation.x = -Math.PI / 2; floor.position.set(bx, y, bz); sc.add(floor); objs.push(floor);
  const L = new THREE.PointLight(0xfff0d8, 1.4, 12); L.position.set(bx + 1, y + 3, bz + 4); sc.add(L); objs.push(L); const A = new THREE.AmbientLight(0xffffff, .5); sc.add(A); objs.push(A);
  const pick = (n, want, shield) => { for (let i = 0; i < 200; i++) { const r = buildFoe(n, i * 13 + 1, i * 7 + 2); const w = r.weapon ? r.weapon.userData.wpn : r.g.gear; if (w === want && (!shield || r.shieldKit)) return r; PEOPLE_RIGS.delete(r); } return buildFoe(n, 1, 1); };
  [['Bandit', 'sword', 1], ['Highwayman', 'axe'], ['Deserter', 'mace'], ['Bandit Archer', 'bow'], ['Rogue Mage', 'staff'], ['Pirate', 'cutlass'], ['Cultist', 'dagger'], ['Skeleton', 'kit']].forEach(([n, w, sh], i) => {
    const r = pick(n, w, sh); PEOPLE_RIGS.delete(r); r.root.position.set(bx - 3.15 + i * .9, y, bz); r.root.rotation.y = .3; sc.add(r.root); objs.push(r.root); pwApply(r, pwIdle(i + 1, { holds: r.holds, gear: r.g.gear })); });
  cam.position.set(bx, y + 1.0, bz + 6.4); cam.lookAt(bx, y + .62, bz); sc.updateMatrixWorld(true); REN.render(sc, cam);
  const o = document.createElement('canvas'); o.width = cv.width; o.height = cv.height; o.getContext('2d').drawImage(cv, 0, 0); objs.forEach(x => sc.remove(x)); return o.toDataURL(); });
fs.writeFileSync('tests/out/weapons.png', Buffer.from(shot.split(',')[1], 'base64'));
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
