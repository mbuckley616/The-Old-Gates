// The Ogre on the people's body (Session 221, Michael's answer B on Session 214's prototype: "as shown"): a person grown
// huge and fat, bald and ruddy, sometimes bearded, in a leather kilt, carrying a knotted tree-limb club.
import { boot, check } from './lib/game.mjs';
import fs from 'fs';
const g = await boot(); const { page } = g;
await g.intoWorld();
fs.mkdirSync('tests/out', { recursive: true });

const built = await page.evaluate(() => { const fx = -Math.sin(yaw), fz = -Math.cos(yaw); window._T = {}; const out = {};
  ['Ogre', 'Frost Troll', 'Bandit'].forEach((n, i) => { const x = px + fx * 30 + (i - 1) * 3, z = pz + fz * 30;
    const e = buildZoneEnemy(WORLD.scene, [], x, z, n, null); e.mesh.position.y = WORLD.worldH(x, z); e.locked = false; e.mesh.visible = true; _T[n] = e; const r = e.limbs && e.limbs.person;
    e.mesh.updateMatrixWorld(true); const bb = r ? new THREE.Box3().setFromObject(r.mesh) : null;
    let boxes = 0; e.mesh.traverse(o => { if (o.isMesh && o.geometry && o.geometry.type === 'BoxGeometry') boxes++; });
    out[n] = r ? { person: true, skinned: r.mesh.isSkinnedMesh, ownMat: r.mesh.material !== PEOPLE_MAT, armR: e.limbs.armR === r.B.shR, ogre: !!r.g.ogre, gear: r.g.gear, build: r.g.build, style: r.g.style,
      tall: +(bb.max.y - bb.min.y).toFixed(2), wide: +(bb.max.x - bb.min.x).toFixed(2), deep: +(bb.max.z - bb.min.z).toFixed(2), tris: r.tris, shape: e.shape, hp: e.maxHp, boxes } : { person: false, boxes }; });
  // the club reaches above the fist further than the kobold's hammer
  const reach = t => { const r = buildFoe(t, 5, 5); const gb = r.B.gear; let top = 0; const pos = r.mesh.geometry.attributes.position, sk = r.mesh.geometry.attributes.skinIndex;
    for (let i = 0; i < pos.count; i++) if (sk.getX(i) === gb.userData.i) top = Math.max(top, pos.getY(i)); PEOPLE_RIGS.delete(r); r.mesh.geometry.dispose(); return +top.toFixed(3); };
  out.reachOgre = reach('Ogre'); out.reachKobold = reach('Kobold');
  // each ogre is someone: skin and beard from its own seed; and the same place gives the same ogre
  const seen = new Set(), beards = new Set(); for (let i = 0; i < 12; i++) { const r = buildFoe('Ogre', i * 37, i * 11); seen.add(r.g.skin.getHexString()); beards.add(r.g.beard); PEOPLE_RIGS.delete(r); r.mesh.geometry.dispose(); }
  const a = buildFoe('Ogre', 40, 40), b = buildFoe('Ogre', 40, 40); out.same = a.g.skin.getHex() === b.g.skin.getHex() && a.g.beard === b.g.beard; [a, b].forEach(r => { PEOPLE_RIGS.delete(r); r.mesh.geometry.dispose(); });
  out.skins = seen.size; out.beards = [...beards]; return out; });
check('the ogre is a person on its own material, the right shoulder striking, still a brute with its numbers', built.Ogre.person && built.Ogre.skinned && built.Ogre.ownMat && built.Ogre.armR && built.Ogre.ogre && built.Ogre.shape === 'brute' && built.Ogre.boxes === 0, built.Ogre);
check('an ogre is fat and bald, and carries a club', built.Ogre.gear === 'club' && built.Ogre.build > 1.9 && built.Ogre.style === 'thin', built.Ogre);
check('an ogre stands taller than a frost troll and a bandit, and is wider and deeper than the troll', built.Ogre.tall > built['Frost Troll'].tall && built.Ogre.tall > built.Bandit.tall * 1.4 && built.Ogre.wide > built['Frost Troll'].wide && built.Ogre.deep > built['Frost Troll'].deep, { ogre: built.Ogre, troll: built['Frost Troll'], bandit: built.Bandit });
check('the club\'s head stands above the fist, further than the kobold\'s hammer', built.reachOgre > built.reachKobold, { ogre: built.reachOgre, kobold: built.reachKobold });
check('ogres differ from each other (skin, beard) and the same place gives the same ogre', built.skins >= 6 && built.beards.length === 2 && built.same, { skins: built.skins, beards: built.beards, same: built.same });

const move = await page.evaluate(() => { const e = _T.Ogre, r = e.limbs.person, G = e.mesh; let t = 3e5;
  const drive = (pace, n) => { for (let i = 0; i < n; i++) { e.x += pace / 60; G.position.set(e.x, WORLD.worldH(e.x, e.z), e.z); t += 16.7; tickPeople(1 / 60, t); } return { walk: +r.w.walk.toFixed(2), run: +r.w.run.toFixed(2), idle: +r.w.idle.toFixed(2) }; };
  return { still: drive(0, 60), chase: drive(1.0, 150) }; });
check('an ogre stands idle and walks when it chases', move.still.idle > .9 && move.chase.run + move.chase.walk > .9, move);

// the photograph: a bandit for scale, three ogres (one walking), a frost troll
const shot = await page.evaluate(async () => { forceTime(12); const cv = REN.domElement, sc = WORLD.scene; const bx = px + 300, bz = pz, y = WORLD.worldH(bx, bz) + 60;
  const cam = new THREE.PerspectiveCamera(30, cv.width / cv.height, .05, 100);
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(16, 10), new THREE.MeshLambertMaterial({ color: 0x6a7a48 })); floor.rotation.x = -Math.PI / 2; floor.position.set(bx, y, bz); sc.add(floor);
  const L = [['Bandit', 1, 0], ['Ogre', 1.6, 1], ['Ogre', 1.6, 2], ['Ogre', 1.6, 3], ['Frost Troll', 1.55, 4]]; const rigs = [];
  L.forEach(([n, s, k], i) => { const r = buildFoe(n, k * 53, k * 29); PEOPLE_RIGS.delete(r); r.root.scale.multiplyScalar(s); r.root.position.set(bx - 3.2 + i * 1.6, y, bz); r.root.rotation.y = i === 3 ? Math.PI / 2 : .45; sc.add(r.root); rigs.push(r);
    pwApply(r, i === 3 ? pwWalk(.3, { holds: r.holds, gear: r.g.gear }) : pwIdle(i + 1, { holds: r.holds, gear: r.g.gear, elder: r.g.age === 'elder' })); });
  cam.position.set(bx, y + 1.7, bz + 8); cam.lookAt(bx, y + .95, bz); sc.updateMatrixWorld(true); REN.render(sc, cam);
  const o = document.createElement('canvas'); o.width = cv.width; o.height = cv.height; o.getContext('2d').drawImage(cv, 0, 0);
  rigs.forEach(r => sc.remove(r.root)); sc.remove(floor); return o.toDataURL(); });
fs.writeFileSync('tests/out/ogre.png', Buffer.from(shot.split(',')[1], 'base64'));

check('no page errors', g.errs.length === 0, g.errs);
await g.close();
