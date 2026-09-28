// node docs/prototypes/buildsite-shot.mjs -> docs/prototypes/buildsite-ingame.png (Session 255): Hearthwick with a wall paid
// for and not yet built, the build before (tests/tmp/buildsite-before.html, from git) on the left and this build on the
// right, from two sides at noon.
import { boot } from '../../tests/lib/game.mjs';
import fs from 'fs'; import path from 'path'; import { fileURLToPath } from 'url';
const here = path.dirname(fileURLToPath(import.meta.url)), ROOT = path.resolve(here, '..', '..');
const cols = [];
for (const src of [path.join(ROOT, 'tests', 'tmp', 'buildsite-before.html'), path.join(ROOT, 'index.html')]) {
  const g = await boot({ src }); const { page } = g; await g.intoWorld(); await g.settle('hearthwick');
  cols.push(await page.evaluate(() => {
    const site = WORLD.SITE.hearthwick, st = WORLD.TS(site); st.builds.push({ key: 'walls', name: 'wall', p: 5, doneDay: 1e9, done: false }); const k = st.builds.length - 1;
    if (WORLD.settlements.has(site.id)) WORLD.disposeSettlement(site.id); WORLD.genSettlement(site); const sx = site.x + 14 + k * 6, sz = site.z - 16;
    forceTime(12); const cv = REN.domElement, W = cv.width, H = cv.height, TW = 640, TH = 360, tiles = [], cam = new THREE.PerspectiveCamera(50, W / H, .1, 400);
    const snap = (x, z) => { cam.position.set(x, WORLD.worldH(x, z) + 2.6, z); cam.lookAt(sx, WORLD.worldH(sx, sz) + 1.6, sz); CAM.position.copy(cam.position); for (let i = 0; i < 3; i++) WORLD.tick(1 / 60, performance.now()); WORLD.scene.updateMatrixWorld(true); const f = WORLD.scene.fog; WORLD.scene.fog = null; REN.render(WORLD.scene, cam); WORLD.scene.fog = f; const c = document.createElement('canvas'); c.width = TW; c.height = TH; c.getContext('2d').drawImage(cv, 0, 0, W, H, 0, 0, TW, TH); tiles.push(c); };
    snap(sx + 5, sz + 6); snap(sx - 6, sz + 4.5);
    const c = document.createElement('canvas'); c.width = TW; c.height = TH * 2; const x = c.getContext('2d'); tiles.forEach((o, i) => x.drawImage(o, 0, i * TH)); return c.toDataURL(); }));
  await g.close();
}
const { chromium } = await import('playwright');
const b = await chromium.launch(fs.existsSync('/opt/pw-browsers/chromium') ? { executablePath: '/opt/pw-browsers/chromium' } : {}); const p = await b.newPage();
const png = await p.evaluate(async cols => { const im = await Promise.all(cols.map(u => new Promise(r => { const i = new Image(); i.onload = () => r(i); i.src = u; })));
  const c = document.createElement('canvas'); c.width = im[0].width * 2 + 8; c.height = im[0].height; const x = c.getContext('2d'); x.fillStyle = '#222'; x.fillRect(0, 0, c.width, c.height); im.forEach((i, k) => x.drawImage(i, k * (i.width + 8), 0)); return c.toDataURL(); }, cols);
fs.writeFileSync(path.join(here, 'buildsite-ingame.png'), Buffer.from(png.split(',')[1], 'base64')); await b.close();
