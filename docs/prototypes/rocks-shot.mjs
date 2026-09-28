// node docs/prototypes/rocks-shot.mjs -> docs/prototypes/rocks-ingame.png (Session 264): the rocks nearest the start, the
// build before (tests/tmp/rocks-before.html, from git) on the left and this build on the right, at noon, with the trees
// and bushes hidden so the rocks show: the three nearest rocks, each from a few units off.
import { boot } from '../../tests/lib/game.mjs';
import fs from 'fs'; import path from 'path'; import { fileURLToPath } from 'url';
const here = path.dirname(fileURLToPath(import.meta.url)), ROOT = path.resolve(here, '..', '..');
const cols = [];
for (const src of [path.join(ROOT, 'tests', 'tmp', 'rocks-before.html'), path.join(ROOT, 'index.html')]) {
  const g = await boot({ src }); const { page } = g; await g.intoWorld(); await g.spin(null, 60);
  cols.push(await page.evaluate(() => { const pts = []; const m = new THREE.Matrix4(), v = new THREE.Vector3();
    for (const ch of WORLD.chunkList()) ch.group.children.forEach(o => { if (!o.isInstancedMesh || !/^rock/.test(o.userData.scatter || '')) return; for (let i = 0; i < o.count; i++) { o.getMatrixAt(i, m); v.setFromMatrixPosition(m); pts.push({ x: v.x, z: v.z, d: Math.hypot(v.x - px, v.z - pz) }); } });
    pts.sort((a, b) => a.d - b.d); forceTime(12); const cv = REN.domElement, W = cv.width, H = cv.height, TW = 640, TH = 360, tiles = [], cam = new THREE.PerspectiveCamera(45, W / H, .1, 300);
    const hid = []; WORLD.scene.traverse(o => { if (o.isInstancedMesh && o.visible && !/^rock/.test(o.userData.scatter || '') && o.userData.scatter) { o.visible = false; hid.push(o); } });
    for (const n of pts.slice(0, 3)) { const y = WORLD.worldH(n.x, n.z); cam.position.set(n.x + 3.5, y + 2.2, n.z + 3.5); cam.lookAt(n.x, y + .4, n.z); CAM.position.copy(cam.position); for (let i = 0; i < 3; i++) WORLD.tick(1 / 60, performance.now()); WORLD.scene.updateMatrixWorld(true);
      const f = WORLD.scene.fog; WORLD.scene.fog = null; REN.render(WORLD.scene, cam); WORLD.scene.fog = f; const o = document.createElement('canvas'); o.width = TW; o.height = TH; o.getContext('2d').drawImage(cv, 0, 0, W, H, 0, 0, TW, TH); tiles.push(o); }
    hid.forEach(o => { o.visible = true; });
    const c = document.createElement('canvas'); c.width = TW; c.height = TH * 3; const x = c.getContext('2d'); tiles.forEach((o, i) => x.drawImage(o, 0, i * TH)); return c.toDataURL(); }));
  await g.close();
}
const { chromium } = await import('playwright');
const b = await chromium.launch(fs.existsSync('/opt/pw-browsers/chromium') ? { executablePath: '/opt/pw-browsers/chromium' } : {}); const p = await b.newPage();
const png = await p.evaluate(async cols => { const im = await Promise.all(cols.map(u => new Promise(r => { const i = new Image(); i.onload = () => r(i); i.src = u; })));
  const c = document.createElement('canvas'); c.width = im[0].width * 2 + 8; c.height = im[0].height; const x = c.getContext('2d'); x.fillStyle = '#222'; x.fillRect(0, 0, c.width, c.height); im.forEach((i, k) => x.drawImage(i, k * (i.width + 8), 0)); return c.toDataURL(); }, cols);
fs.writeFileSync(path.join(here, 'rocks-ingame.png'), Buffer.from(png.split(',')[1], 'base64')); await b.close();
