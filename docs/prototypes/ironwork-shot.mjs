// node docs/prototypes/ironwork-shot.mjs -> docs/prototypes/ironwork-ingame.png (Session 258): Hearthwick's ironwork, the
// build before (tests/tmp/iron-before.html, from git) on the left and this build on the right, at noon: an inn's hanging
// sign and door lantern, and a lamp post (the first with a light: on the plaza, or at a street's end).
import { boot } from '../../tests/lib/game.mjs';
import fs from 'fs'; import path from 'path'; import { fileURLToPath } from 'url';
const here = path.dirname(fileURLToPath(import.meta.url)), ROOT = path.resolve(here, '..', '..');
const cols = [];
for (const src of [path.join(ROOT, 'tests', 'tmp', 'iron-before.html'), path.join(ROOT, 'index.html')]) {
  const g = await boot({ src }); const { page } = g; await g.intoWorld(); await g.settle('hearthwick');
  cols.push(await page.evaluate(() => { const S = WORLD.settlements.get('hearthwick'); const h = S.houses.find(q => ['weapon', 'armor', 'potion', 'misc', 'inn'].includes(q.type)); forceTime(12);
    const cv = REN.domElement, W = cv.width, H = cv.height, TW = 640, TH = 360, tiles = [], cam = new THREE.PerspectiveCamera(45, W / H, .1, 300);
    const shoot = (x, y, z, lx, ly, lz) => { cam.position.set(x, y, z); cam.lookAt(lx, ly, lz); CAM.position.copy(cam.position); for (let i = 0; i < 3; i++) WORLD.tick(1 / 60, performance.now()); WORLD.scene.updateMatrixWorld(true);
      const fog = WORLD.scene.fog; WORLD.scene.fog = null; REN.render(WORLD.scene, cam); WORLD.scene.fog = fog; const o = document.createElement('canvas'); o.width = TW; o.height = TH; o.getContext('2d').drawImage(cv, 0, 0, W, H, 0, 0, TW, TH); tiles.push(o); };
    const ex = h.exitX - h.doorX, ez = h.exitZ - h.doorZ, L = Math.hypot(ex, ez), tx = ex / L, tz = ez / L, y = WORLD.worldH(h.doorX, h.doorZ);
    shoot(h.doorX + tx * 3.4 + tz * 2.2, y + 2.3, h.doorZ + tz * 3.4 - tx * 2.2, h.doorX + tx * .7, y + 2.2, h.doorZ + tz * .7);
    const lp = S.lamps.find(q => q.light), gp = new THREE.Vector3(); if (lp) { lp.glass.getWorldPosition(gp); shoot(gp.x + 3.4, gp.y - .9, gp.z + 3.0, gp.x, gp.y - 1.3, gp.z); }
    const c = document.createElement('canvas'); c.width = TW; c.height = TH * 2; const x = c.getContext('2d'); tiles.forEach((o, i) => x.drawImage(o, 0, i * TH)); return c.toDataURL(); }));
  await g.close();
}
const { chromium } = await import('playwright');
const b = await chromium.launch(fs.existsSync('/opt/pw-browsers/chromium') ? { executablePath: '/opt/pw-browsers/chromium' } : {}); const p = await b.newPage();
const png = await p.evaluate(async cols => { const im = await Promise.all(cols.map(u => new Promise(r => { const i = new Image(); i.onload = () => r(i); i.src = u; })));
  const c = document.createElement('canvas'); c.width = im[0].width * 2 + 8; c.height = im[0].height; const x = c.getContext('2d'); x.fillStyle = '#222'; x.fillRect(0, 0, c.width, c.height); im.forEach((i, k) => x.drawImage(i, k * (i.width + 8), 0)); return c.toDataURL(); }, cols);
fs.writeFileSync(path.join(here, 'ironwork-ingame.png'), Buffer.from(png.split(',')[1], 'base64')); await b.close();
