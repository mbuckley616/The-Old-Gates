// Session 524 prototype: how large is a dragon? The bandit beside the dragon at the inspector's old scale (1), the world's
// (2.88, every dragon in the game: the zone's 1.8 × 1.6, and the lair's), and two larger: 4.5 and 6. Built in the open world
// at noon, high above the ground on a plain floor. Writes docs/prototypes/dragon-sizes.png and dragon-sizes-near.png.
// Run: node docs/prototypes/dragon/proto.mjs
import { boot } from '../../../tests/lib/game.mjs';
import fs from 'fs';
const g = await boot(); const { page } = g;
await g.intoWorld(); await page.evaluate(() => forceTime(12)); await g.spin('clear', 60);
const r = await page.evaluate(() => {
  const cv = REN.domElement, sc = WORLD.scene; const bx = px + 300, bz = pz + 100, y = WORLD.worldH(bx, bz) + 60; const added = [];
  const floor = new THREE.Mesh(new THREE.CircleGeometry(120, 48), new THREE.MeshLambertMaterial({ color: 0x6a7a48 })); floor.rotation.x = -Math.PI / 2; floor.position.set(bx, y, bz); sc.add(floor); added.push(floor);
  const man = buildFoe('Bandit', 0, 0); PEOPLE_RIGS.delete(man); man.root.position.set(bx, y, bz); man.root.rotation.y = .6; sc.add(man.root); added.push(man.root);
  const SIZES = [1, 2.88, 4.5, 6], out = {}; let x = 1.2;
  for (const s of SIZES) { const d = buildWolf('Dragon', s); WOLF_RIGS.delete(d); d.root.position.set(bx + x + 1.2 * s, y, bz - .4 * s); d.root.rotation.y = Math.PI / 2 + .45; sc.add(d.root); added.push(d.root);
    const b = new THREE.Box3().setFromObject(d.root); out[s] = { h: +(b.max.y - b.min.y).toFixed(2), len: +Math.max(b.max.x - b.min.x, b.max.z - b.min.z).toFixed(2) }; x += 2.6 * s + 1.4; }
  const cam = new THREE.PerspectiveCamera(30, cv.width / cv.height, .3, 600); cam.layers.enableAll();
  const grab = () => { sc.updateMatrixWorld(true); REN.render(sc, cam); const o = document.createElement('canvas'); o.width = cv.width; o.height = cv.height; o.getContext('2d').drawImage(cv, 0, 0); return o.toDataURL(); };
  cam.position.set(bx + x * .42, y + 6, bz + 52); cam.lookAt(bx + x * .42, y + 2, bz - 1); const a = grab();
  cam.fov = 55; cam.updateProjectionMatrix(); cam.position.set(bx - 1.5, y + 1.6, bz + 6.5); cam.lookAt(bx + 12, y + 2.6, bz - 3); const b = grab();
  added.forEach(o => sc.remove(o)); return { a, b, out };
});
fs.writeFileSync('docs/prototypes/dragon-sizes.png', Buffer.from(r.a.split(',')[1], 'base64'));
fs.writeFileSync('docs/prototypes/dragon-sizes-near.png', Buffer.from(r.b.split(',')[1], 'base64'));
console.log(JSON.stringify(r.out), g.errs); await g.close();
