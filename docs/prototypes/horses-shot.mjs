// node docs/prototypes/horses-shot.mjs -> docs/prototypes/horses-ingame.png (Session 262): the coach's two horses on the
// wolf's bones and a horse's legs, a bay standing and a grey trotting (moved along the ground and walked by tickCreatures),
// side on at noon on a plain floor.
import { boot } from '../../tests/lib/game.mjs';
import fs from 'fs';
const g = await boot(); const { page } = g; await g.intoWorld();
const r = await page.evaluate(() => { forceTime(12); const sc = WORLD.scene, x = px + 400, z = pz, y = WORLD.worldH(x, z) + 60; const tmp = [];
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(40, 40), new THREE.MeshLambertMaterial({ color: 0x6a7a48 })); floor.rotation.x = -Math.PI / 2; floor.position.set(x, y, z); sc.add(floor); tmp.push(floor);
  const mk = (kind, dx, walk) => { const hg = new THREE.Group(), rg = buildWolf(kind, 1.6); hg.add(rg.root); sc.add(hg); hg.position.set(x + dx, y, z); tmp.push(hg); return { hg, rg, walk }; };
  const H = [mk('Horse', -2.2, false), mk('Grey Horse', 2.2, true)];
  for (let k = 0; k < 90; k++) { for (const q of H) if (q.walk) q.hg.position.z += .06; tickCreatures(1 / 60, 1000 + k * 16.7); }
  const cv = REN.domElement, cam = new THREE.PerspectiveCamera(40, cv.width / cv.height, .1, 100); const zc = z + 2.7;
  cam.position.set(x, y + 1.4, zc + 9); cam.lookAt(x, y + 1.0, zc); cam.position.set(x + 7.5, y + 1.3, zc - .5); cam.lookAt(x, y + 1.0, zc);
  sc.updateMatrixWorld(true); const f = sc.fog; sc.fog = null; REN.render(sc, cam); sc.fog = f; const o = document.createElement('canvas'); o.width = cv.width; o.height = cv.height; o.getContext('2d').drawImage(cv, 0, 0);
  const w = H.map(q => JSON.stringify(q.rg.w)); tmp.forEach(t => sc.remove(t)); return { w, shot: o.toDataURL() }; });
fs.writeFileSync('docs/prototypes/horses-ingame.png', Buffer.from(r.shot.split(',')[1], 'base64')); console.log(r.w); await g.close();
