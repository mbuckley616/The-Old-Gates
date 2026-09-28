// The gargoyle on the people's body (Session 210, Michael's answer on Session 201's prototype: gargoyle A, "with better
// wings"): a stone figure with horns, a tail and bat wings on bones of their own; it sleeps crouched as a statue, wings
// folded, until you come near, then stands, spreads them and beats them slowly.
import { boot, check } from './lib/game.mjs';
import { enterDungeon } from './lib/dungeonshot.mjs';
import fs from 'fs';
const g = await boot(); const { page } = g;
await g.intoWorld();
fs.mkdirSync('tests/out', { recursive: true });

const built = await page.evaluate(() => { const r = buildFoe('Gargoyle', 3, 4, null, 0x880000); PEOPLE_RIGS.delete(r); const B = r.B;
  const pos = r.mesh.geometry.attributes.position, sk = r.mesh.geometry.attributes.skinIndex; const on = {}, far = {};
  for (let i = 0; i < pos.count; i++) { const b = r.mesh.skeleton.bones[sk.getX(i)].name; on[b] = (on[b] || 0) + 1; far[b] = Math.max(far[b] || 0, Math.abs(pos.getX(i))); }
  const glow = r.B.head.children.some(c => c.isMesh && c.material.isMeshBasicMaterial);
  return { gargoyle: !!r.g.gargoyle, bones: ['wingL', 'wingR', 'tail'].every(n => !!B[n]), wingVerts: (on.wingL || 0) + (on.wingR || 0), tailVerts: on.tail || 0, span: +(far.wingL || 0).toFixed(2), glow, tris: r.tris, crouch: r.w.crouch, gear: r.g.gear }; });
check('a gargoyle is a person with wings and a tail on bones of their own, eyes lit, empty-handed', built.gargoyle && built.bones && built.wingVerts > 200 && built.tailVerts > 50 && built.glow && built.gear === null, built);
check('its wings reach well out past its shoulders (span in figure units)', built.span > .6, built);

// the photograph: a bandit for scale, a sleeping gargoyle, two awake (one from behind), the wings spread and beating
const shot = await page.evaluate(() => { forceTime(12); const cv = REN.domElement, sc = WORLD.scene; const bx = px + 300, bz = pz, y = WORLD.worldH(bx, bz) + 60;
  const cam = new THREE.PerspectiveCamera(30, cv.width / cv.height, .05, 100);
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(16, 10), new THREE.MeshLambertMaterial({ color: 0x5a5a50 })); floor.rotation.x = -Math.PI / 2; floor.position.set(bx, y, bz); sc.add(floor);
  const L = [['Bandit', 1, 0], ['Gargoyle', 1.35, 1], ['Gargoyle', 1.35, 0], ['Gargoyle', 1.35, 0]]; const rigs = [];
  L.forEach(([n, s, dor], i) => { const r = buildFoe(n, i * 7, 3, null, 0x880000); r.root.scale.multiplyScalar(s); const G = new THREE.Group(); G.add(r.root); G.position.set(bx - 2.6 + i * 1.7, y, bz); G.rotation.y = i === 3 ? Math.PI + .5 : i === 2 ? .9 : .35; sc.add(G); rigs.push(G);
    r.e = { x: G.position.x, z: G.position.z, dormant: !!dor, dead: false }; });
  let t = 9e5; for (let k = 0; k < 90; k++) tickPeople(1 / 60, t += 16.7);
  cam.position.set(bx, y + 1.5, bz + 7.2); cam.lookAt(bx, y + .75, bz); sc.updateMatrixWorld(true); REN.render(sc, cam);
  const o = document.createElement('canvas'); o.width = cv.width; o.height = cv.height; o.getContext('2d').drawImage(cv, 0, 0);
  rigs.forEach(G => sc.remove(G)); sc.remove(floor); return o.toDataURL(); });
fs.writeFileSync('tests/out/gargoyle.png', Buffer.from(shot.split(',')[1], 'base64'));

// the dungeon's gargoyle: a statue until you come close, then it stands and spreads its wings
let gg = { none: true };
for (const seed of [5, 12, 17, 23, 31, 44]) { await page.evaluate(() => { level = 6; }); await enterDungeon(page, { theme: 'haunted', seed });
  gg = await page.evaluate(() => { const e = ENEMIES.find(x => (x.baseType || x.name) === 'Gargoyle'); if (!e) return { none: true }; const r = e.limbs && e.limbs.person; if (!r) return { person: false };
    e.mesh.visible = true; let t = 6e5; for (let k = 0; k < 60; k++) tickPeople(1 / 60, t += 16.7);
    const asleep = { dormant: e.dormant, hips: +r.B.hips.position.y.toFixed(3), fold: +r.fold.toFixed(2), wingY: +r.B.wingL.rotation.y.toFixed(2) };
    e.dormant = false; e.alert = true; for (let k = 0; k < 90; k++) tickPeople(1 / 60, t += 16.7);
    const awake = { hips: +r.B.hips.position.y.toFixed(3), fold: +r.fold.toFixed(2), wingY: +r.B.wingL.rotation.y.toFixed(2) };
    return { person: true, gargoyle: !!r.g.gargoyle, linked: r.e === e, family: enemyPostureFamily(e), asleep, awake }; });
  if (!gg.none) break; }
check('the dungeon\'s gargoyle is a winged stone person, walked by its own enemy, still a brute', !gg.none && gg.person && gg.gargoyle && gg.linked && gg.family === 'brute', gg);
check('asleep it crouches as a statue with its wings folded; woken it stands and spreads them', !gg.none && gg.asleep.dormant && gg.asleep.fold > .95 && gg.awake.fold < .1 && gg.awake.hips > gg.asleep.hips + .15 && gg.asleep.wingY > gg.awake.wingY + .7, gg);
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
