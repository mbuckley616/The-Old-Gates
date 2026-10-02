// Session 419: the ragdoll as built (Michael's C on #102): Bandits killed through killZoneEnemy, a jab, a power blow and an
// arrow, each frame stepped by tickPeople; four tiles, 0, .25, .5 s and settled, from the side, and the three where they lie.
// Run from the repo root: node docs/prototypes/ragdoll/ingame.mjs
import { boot } from '../../../tests/lib/game.mjs';
import fs from 'fs';
const g = await boot(); const { page } = g;
await g.intoWorld(); await g.frames(30);
const r = await page.evaluate(() => {
  forceTime(11); const raf = window.requestAnimationFrame; window.requestAnimationFrame = () => 0;
  const V = (x, y, z) => new THREE.Vector3(x || 0, y || 0, z || 0), cv = REN.domElement, cam = new THREE.PerspectiveCamera(34, 1, .05, 80), tiles = [];
  const snap = (label, at, from) => { cam.aspect = cv.width / cv.height; cam.updateProjectionMatrix(); cam.position.copy(at).add(from); cam.lookAt(at); REN.render(scene, cam);
    const s = Math.min(cv.width, cv.height), T = document.createElement('canvas'); T.width = T.height = 300; T.getContext('2d').drawImage(cv, (cv.width - s) / 2, (cv.height - s) / 2, s, s, 0, 0, 300, 300);
    const x = T.getContext('2d'); x.fillStyle = 'rgba(0,0,0,.55)'; x.fillRect(0, 0, 300, 22); x.fillStyle = '#f0e6c8'; x.font = '14px serif'; x.fillText(label, 6, 16); tiles.push(T); };
  const side = V(-fwdZ, 0, fwdX);
  for (const [label, tag] of [['a jab', ''], ['a power blow', ' (POWER)'], ['an arrow', ' (ARROW)']]) {
    const x = px + fwdX * 3, z = pz + fwdZ * 3, e = buildZoneEnemy(WORLD.scene, [], x, z, 'Bandit', null); e.locked = false; e.mesh.visible = true; if (!e.mesh.parent) WORLD.scene.add(e.mesh);
    e.mesh.position.set(x, activeTerrainH(x, z), z); e.mesh.rotation.y = Math.atan2(-fwdX, -fwdZ);
    const at = V(x, activeTerrainH(x, z) + .5, z).addScaledVector(V(fwdX, 0, fwdZ), .45), from = V().copy(side).multiplyScalar(3.4).add(V(0, 1.2, 0));
    snap(label + ' — standing', at, from); e.hp = 0; killZoneEnemy(e, WORLD.scene, tag);
    let t = 0; for (const T of [.25, .5, 2.5]) { while (t < T - 1e-6) { tickPeople(1 / 60, performance.now()); t += 1 / 60; } snap(label + ' — ' + (T > 2 ? 'settled' : T.toFixed(2) + ' s'), at, from); }
    WORLD.scene.remove(e.mesh);
  }
  window.requestAnimationFrame = raf;
  const c = document.createElement('canvas'); c.width = 1200; c.height = 900; const X = c.getContext('2d'); tiles.forEach((T, i) => X.drawImage(T, (i % 4) * 300, Math.floor(i / 4) * 300));
  return c.toDataURL();
});
fs.writeFileSync('docs/prototypes/ragdoll-ingame.png', Buffer.from(r.split(',')[1], 'base64'));
console.log('errors', g.errs); await g.close();
