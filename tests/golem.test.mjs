// The golem on the people's bones (Session 209, Michael's answer on Session 201's prototype: "as shown"): dressed stone
// blocks on the bones and none of the flesh, a blue rune-light in the seams (a slit for eyes, an X on the chest).
import { boot, check } from './lib/game.mjs';
import { enterDungeon } from './lib/dungeonshot.mjs';
import fs from 'fs';
const g = await boot(); const { page } = g;
await g.intoWorld();
fs.mkdirSync('tests/out', { recursive: true });

const built = await page.evaluate(() => { const out = {};
  const r = buildFoe('Golem', 3, 4, null, 0x22aaff), b = buildFoe('Bandit', 3, 4); window._GR = r;
  const cols = r.mesh.geometry.attributes.color; let grey = 0, n = cols.count;
  for (let i = 0; i < n; i++) { const R = cols.getX(i), G = cols.getY(i), B = cols.getZ(i); if (Math.max(R, G, B) - Math.min(R, G, B) < .08) grey++; }
  const bb = new THREE.Box3().setFromObject(r.mesh), bb2 = new THREE.Box3().setFromObject(b.mesh);
  out.golem = { person: r.mesh.isSkinnedMesh, golem: !!r.g.golem, gear: r.g.gear, grey: +(grey / n).toFixed(3), tris: r.tris, runes: (r.runes || []).length,
    runesOnBones: (r.runes || []).every(m => m.parent === r.B.head || m.parent === r.B.spine), unlit: (r.runes || []).every(m => m.material.isMeshBasicMaterial),
    wide: +((bb.max.x - bb.min.x) / r.root.scale.x).toFixed(2) };
  out.bandit = { wide: +((bb2.max.x - bb2.min.x) / b.root.scale.x).toFixed(2) };
  PEOPLE_RIGS.delete(b); return out; });
check('a golem is stone blocks on the people\'s skinned body: every vertex a grey, no flesh, no weapon', built.golem.person && built.golem.golem && built.golem.gear === null && built.golem.grey > .99, built.golem);
check('its rune-light is three unlit strokes on the head and spine bones', built.golem.runes === 3 && built.golem.runesOnBones && built.golem.unlit, built.golem);
check('a golem is broader than a bandit (the blocks and the shoulders set out)', built.golem.wide > built.bandit.wide * 1.3, built);

// the photograph: a bandit for scale, two golems standing and one walking, lit from the front
const shot = await page.evaluate(() => { forceTime(12); const cv = REN.domElement, sc = WORLD.scene; const bx = px + 300, bz = pz, y = WORLD.worldH(bx, bz) + 60;
  const cam = new THREE.PerspectiveCamera(30, cv.width / cv.height, .05, 100);
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(16, 10), new THREE.MeshLambertMaterial({ color: 0x5a5a50 })); floor.rotation.x = -Math.PI / 2; floor.position.set(bx, y, bz); sc.add(floor);
  const L = [['Bandit', 1], ['Golem', 1.7], ['Golem', 1.7], ['Golem', 1.7]]; const rigs = [];
  L.forEach(([n, s], i) => { const r = buildFoe(n, i * 7, 3, null, 0x22aaff); PEOPLE_RIGS.delete(r); r.root.scale.multiplyScalar(s); r.root.position.set(bx - 2.6 + i * 1.6, y, bz); r.root.rotation.y = i === 3 ? Math.PI / 2 : .35; sc.add(r.root); rigs.push(r);
    pwApply(r, i === 3 ? pwWalk(.3, { holds: r.holds, gear: r.g.gear }) : pwIdle(i + 1, { holds: r.holds, gear: r.g.gear, elder: r.g.age === 'elder' })); });
  cam.position.set(bx, y + 1.5, bz + 6.8); cam.lookAt(bx, y + .9, bz); sc.updateMatrixWorld(true); REN.render(sc, cam);
  const o = document.createElement('canvas'); o.width = cv.width; o.height = cv.height; o.getContext('2d').drawImage(cv, 0, 0);
  rigs.forEach(r => sc.remove(r.root)); sc.remove(floor); return o.toDataURL(); });
fs.writeFileSync('tests/out/golem.png', Buffer.from(shot.split(',')[1], 'base64'));

// the dungeon's golem: a person, walked by its own enemy, still a brute for the fight
let gm = { none: true };
for (const seed of [5, 12, 17, 23, 31, 44]) { await page.evaluate(() => { level = 6; }); await enterDungeon(page, { theme: 'deep', seed });
  gm = await page.evaluate(() => { const e = ENEMIES.find(x => (x.baseType || x.name) === 'Golem'); if (!e) return { none: true }; const r = e.limbs && e.limbs.person;
    return r ? { person: true, golem: !!r.g.golem, linked: r.e === e, inRigs: PEOPLE_RIGS.has(r), family: enemyPostureFamily(e) } : { person: false }; });
  if (!gm.none) break; }
check('the dungeon\'s golem is stone on the people\'s bones, walked by its own enemy', !gm.none && gm.person && gm.golem && gm.linked && gm.inRigs && gm.family === 'brute', gm);
const walk = await page.evaluate(() => { const e = ENEMIES.find(x => (x.baseType || x.name) === 'Golem'); if (!e) return { none: true }; const r = e.limbs.person; e.mesh.visible = true; let t = 5e5;
  for (let i = 0; i < 120; i++) { e.x += .8 / 60; e.mesh.position.x = e.x; tickPeople(1 / 60, t += 16.7); } return { walk: +r.w.walk.toFixed(2), run: +r.w.run.toFixed(2) }; });
check('a golem walks by the ground it covers', !walk.none && walk.walk + walk.run > .9, walk);
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
