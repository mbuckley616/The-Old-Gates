// node docs/prototypes/wreck-shot.mjs -> docs/prototypes/wreck-ingame.png (Session 259): the sea-floor wreck and its chest,
// the old boxes (rebuilt here from the old parts) on the left and this build's wreckGeo and kit chest on the right, on a
// sand floor at noon with the fog off (a real wreck lies under two to eight units of water): from the side and from above.
import { boot } from '../../tests/lib/game.mjs';
import fs from 'fs'; import path from 'path'; import { fileURLToPath } from 'url';
const here = path.dirname(fileURLToPath(import.meta.url));
const g = await boot(); const { page } = g; await g.intoWorld();
const png = await page.evaluate(() => { forceTime(12); const sc = WORLD.scene, cv = REN.domElement, W = cv.width, H = cv.height, TW = 640, TH = 360, bx = px + 500, bz = pz, y = WORLD.worldH(bx, bz) + 90, tmp = [];
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(120, 120), new THREE.MeshLambertMaterial({ color: 0xb8a878 })); floor.rotation.x = -Math.PI / 2; floor.position.set(bx, y, bz); tmp.push(floor);
  const vc = new THREE.MeshLambertMaterial({ vertexColors: true }), C = x => new THREE.Color(x), ry = .4;
  const old = new THREE.Group(); { const P = [{ geo: new THREE.BoxGeometry(4, 1.6, 7), color: C(0x3a2a18), y: .6, z: -2, rz: .35 }, { geo: new THREE.BoxGeometry(3.6, 1.4, 5), color: C(0x2e2214), y: .5, z: 4.5, rx: .2, rz: -.5 }, { geo: new THREE.CylinderGeometry(.12, .16, 7, 6), color: C(0x2a1c10), y: 1.2, z: 1, rx: 1.2, rz: .3 }, { geo: new THREE.BoxGeometry(.8, .08, 1.8), color: C(0x4a3a24), y: 1.1, x: 1.2, z: -1, rz: .4 }];
    const mg = (parts) => { const out = new THREE.Group(); for (const p of parts) { const m = new THREE.Mesh(p.geo, new THREE.MeshLambertMaterial({ color: p.color })); m.position.set(p.x || 0, p.y || 0, p.z || 0); m.rotation.set(p.rx || 0, 0, p.rz || 0); out.add(m); } return out; };
    const w = mg(P); w.rotation.y = ry; old.add(w); const ch = new THREE.Mesh(new THREE.BoxGeometry(.9, .6, .6), new THREE.MeshLambertMaterial({ color: 0x5a3a1c })); ch.position.set(Math.cos(ry) * 2.2, .3, Math.sin(ry) * 2.2); old.add(ch);
    const lid = new THREE.Mesh(new THREE.BoxGeometry(.92, .12, .62), new THREE.MeshLambertMaterial({ color: 0x8a6a2a })); lid.position.set(ch.position.x, .65, ch.position.z); old.add(lid); }
  const neu = new THREE.Group(); { const m = new THREE.Mesh(WORLD.wreckGeo((() => { let a = 11; return () => ((a = (a * 16807) % 2147483647) / 2147483647); })()), vc); m.rotation.y = ry; neu.add(m);
    const ch = new THREE.Group(); ch.position.set(Math.cos(ry) * 2.2, 0, Math.sin(ry) * 2.2); ch.rotation.set(.08, ry + 2.2, -.06); buildChestShell(ch, 1.8, 0x5a3a1c); neu.add(ch); }
  old.position.set(bx - 12, y, bz); neu.position.set(bx + 12, y, bz); tmp.push(old, neu); tmp.forEach(o => sc.add(o));
  const cam = new THREE.PerspectiveCamera(45, W / H, .3, 300), tiles = [];
  const shoot = (ox, cx, cy, cz) => { cam.position.set(bx + ox + cx, y + cy, bz + cz); cam.lookAt(bx + ox, y + .6, bz); sc.updateMatrixWorld(true); const f = sc.fog; sc.fog = null; REN.render(sc, cam); sc.fog = f;
    const o = document.createElement('canvas'); o.width = TW; o.height = TH; o.getContext('2d').drawImage(cv, 0, 0, W, H, 0, 0, TW, TH); return o; };
  for (const [cx, cy, cz] of [[10, 4, 7], [3, 14, -5]]) tiles.push([shoot(-12, cx, cy, cz), shoot(12, cx, cy, cz)]);
  tmp.forEach(o => sc.remove(o));
  const c = document.createElement('canvas'); c.width = TW * 2 + 8; c.height = TH * 2; const x = c.getContext('2d'); x.fillStyle = '#222'; x.fillRect(0, 0, c.width, c.height);
  tiles.forEach((row, i) => row.forEach((o, k) => x.drawImage(o, k * (TW + 8), i * TH))); return c.toDataURL(); });
fs.writeFileSync(path.join(here, 'wreck-ingame.png'), Buffer.from(png.split(',')[1], 'base64')); await g.close();
