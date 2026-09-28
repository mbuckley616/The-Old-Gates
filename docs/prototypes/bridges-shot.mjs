// node docs/prototypes/bridges-shot.mjs -> docs/prototypes/bridges-ingame.png (Session 248): the nearest bridge to the
// home province's start, the build before (tests/tmp/bridges-before.html, from git) on the left and this build on the
// right, from the same place at noon: from the bank, and along the deck.
import { boot } from '../../tests/lib/game.mjs';
import fs from 'fs'; import path from 'path'; import { fileURLToPath } from 'url';
const here = path.dirname(fileURLToPath(import.meta.url)), ROOT = path.resolve(here, '..', '..');
const cols = [];
for (const src of [path.join(ROOT, 'tests', 'tmp', 'bridges-before.html'), path.join(ROOT, 'index.html')]) {
  const g = await boot({ src }); const { page } = g; await g.intoWorld();
// the cells load through a job queue in real time; drain it so every bridge in reach is built before measuring
  await page.evaluate(() => { for (let k = 0; k < 600 && (WORLD.jobs.length || [...WORLD.LOADED.values()].some(L => L.pending)); k++) { WORLD.tick(1 / 60, performance.now());
    while (WORLD.jobs.length) { const j = WORLD.jobs.shift(); let more = false; try { more = j.fn(); } catch (e) {} if (more) WORLD.jobs.push(j); } } });
  cols.push(await page.evaluate(() => {
    forceTime(12); const cv = REN.domElement, W = cv.width, H = cv.height, TW = 640, TH = 360, tiles = [];
    const s = WORLD.SITES.filter(q => q.kind === 'bridge').sort((a, b) => Math.hypot(a.x - px, a.z - pz) - Math.hypot(b.x - px, b.z - pz))[0];
    const a = s.bridge.ang, y = s.bridge.y, cam = new THREE.PerspectiveCamera(50, W / H, .3, 600);
    const shoot = (x, cy, z, lx, ly, lz) => { cam.position.set(x, cy, z); cam.lookAt(lx, ly, lz); CAM.position.copy(cam.position); WORLD.tick(1 / 60, performance.now()); WORLD.scene.updateMatrixWorld(true);
      const fog = WORLD.scene.fog; WORLD.scene.fog = null; REN.render(WORLD.scene, cam); WORLD.scene.fog = fog; const o = document.createElement('canvas'); o.width = TW; o.height = TH; o.getContext('2d').drawImage(cv, 0, 0, W, H, 0, 0, TW, TH); tiles.push(o); };
    const ax = Math.sin(a), az = Math.cos(a), sx = Math.cos(a), sz = -Math.sin(a);
    shoot(s.x + sx * 20 + ax * 8, y + 4, s.z + sz * 20 + az * 8, s.x, y - .5, s.z);
    shoot(s.x - ax * (s.bridge.len / 2 + 2) + sx * .6, y + 2, s.z - az * (s.bridge.len / 2 + 2) + sz * .6, s.x + ax * 10, y + .6, s.z + az * 10);
    const c = document.createElement('canvas'); c.width = TW; c.height = TH * 2; const x = c.getContext('2d'); tiles.forEach((o, i) => x.drawImage(o, 0, i * TH)); return c.toDataURL(); }));
  await g.close();
}
const { chromium } = await import('playwright');
const b = await chromium.launch(fs.existsSync('/opt/pw-browsers/chromium') ? { executablePath: '/opt/pw-browsers/chromium' } : {}); const p = await b.newPage();
const png = await p.evaluate(async cols => { const im = await Promise.all(cols.map(u => new Promise(r => { const i = new Image(); i.onload = () => r(i); i.src = u; })));
  const c = document.createElement('canvas'); c.width = im[0].width * 2 + 8; c.height = im[0].height; const x = c.getContext('2d'); x.fillStyle = '#222'; x.fillRect(0, 0, c.width, c.height); im.forEach((i, k) => x.drawImage(i, k * (i.width + 8), 0)); return c.toDataURL(); }, cols);
fs.writeFileSync(path.join(here, 'bridges-ingame.png'), Buffer.from(png.split(',')[1], 'base64')); await b.close();
