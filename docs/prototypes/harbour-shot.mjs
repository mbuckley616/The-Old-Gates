// node docs/prototypes/harbour-shot.mjs -> docs/prototypes/harbour-ingame.png (Session 250): Portclare's harbour, the
// build before (tests/tmp/harbour-before.html, from git) on the left and this build on the right, at noon: the quay from
// the water, the breakwater, and along the quay from its landward end.
import { boot } from '../../tests/lib/game.mjs';
import fs from 'fs'; import path from 'path'; import { fileURLToPath } from 'url';
const here = path.dirname(fileURLToPath(import.meta.url)), ROOT = path.resolve(here, '..', '..');
const cols = [];
for (const src of [path.join(ROOT, 'tests', 'tmp', 'harbour-before.html'), path.join(ROOT, 'index.html')]) {
  const g = await boot({ src }); const { page } = g; await g.intoWorld();
  await g.settle('portclare');
  cols.push(await page.evaluate(() => {
    const site = WORLD.siteAnywhere('portclare'); forceTime(12); const cv = REN.domElement, W = cv.width, H = cv.height, TW = 640, TH = 360, tiles = [], cam = new THREE.PerspectiveCamera(55, W / H, .3, 600);
    const shoot = (x, y, z, lx, ly, lz) => { cam.position.set(x, y, z); cam.lookAt(lx, ly, lz); CAM.position.copy(cam.position); for (let i = 0; i < 3; i++) WORLD.tick(1 / 60, performance.now()); WORLD.scene.updateMatrixWorld(true);
      const fog = WORLD.scene.fog; WORLD.scene.fog = null; REN.render(WORLD.scene, cam); WORLD.scene.fog = fog; const o = document.createElement('canvas'); o.width = TW; o.height = TH; o.getContext('2d').drawImage(cv, 0, 0, W, H, 0, 0, TW, TH); tiles.push(o); };
    const q = site.quayStart, dl = Math.hypot(q.x - site.x, q.z - site.z), ux = (q.x - site.x) / dl, uz = (q.z - site.z) / dl, qx = q.x + ux * 22, qz = q.z + uz * 22;
    shoot(qx - uz * 20 + ux * 6, 5, qz + ux * 20 + uz * 6, qx, 0, qz);
    shoot(qx + uz * 16 + ux * 18, 4, qz - ux * 16 + uz * 18, qx + ux * 4, 0, qz + uz * 4);
    shoot(q.x + ux * 2, 2.8, q.z + uz * 2, qx + ux * 20, 1, qz + uz * 20);
    const c = document.createElement('canvas'); c.width = TW; c.height = TH * tiles.length; const x = c.getContext('2d'); tiles.forEach((o, i) => x.drawImage(o, 0, i * TH)); return c.toDataURL(); }));
  await g.close();
}
const { chromium } = await import('playwright');
const b = await chromium.launch(fs.existsSync('/opt/pw-browsers/chromium') ? { executablePath: '/opt/pw-browsers/chromium' } : {}); const p = await b.newPage();
const png = await p.evaluate(async cols => { const im = await Promise.all(cols.map(u => new Promise(r => { const i = new Image(); i.onload = () => r(i); i.src = u; })));
  const c = document.createElement('canvas'); c.width = im[0].width * 2 + 8; c.height = im[0].height; const x = c.getContext('2d'); x.fillStyle = '#222'; x.fillRect(0, 0, c.width, c.height); im.forEach((i, k) => x.drawImage(i, k * (i.width + 8), 0)); return c.toDataURL(); }, cols);
fs.writeFileSync(path.join(here, 'harbour-ingame.png'), Buffer.from(png.split(',')[1], 'base64')); await b.close();
