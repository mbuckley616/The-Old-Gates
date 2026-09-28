// node docs/prototypes/camps-shot.mjs -> docs/prototypes/camps-ingame.png (Session 254): the roadside camp nearest the
// start, the build before (tests/tmp/camps-before.html, from git) above and this build below, from two sides at noon.
import { boot } from '../../tests/lib/game.mjs';
import fs from 'fs'; import path from 'path'; import { fileURLToPath } from 'url';
const here = path.dirname(fileURLToPath(import.meta.url)), ROOT = path.resolve(here, '..', '..');
const rows = [];
for (const src of [path.join(ROOT, 'tests', 'tmp', 'camps-before.html'), path.join(ROOT, 'index.html')]) {
  const g = await boot({ src }); const { page } = g; await g.intoWorld();
  rows.push(await page.evaluate(() => {
    for (let k = 0; k < 600 && (WORLD.jobs.length || [...WORLD.LOADED.values()].some(L => L.pending || !L.staticsBuilt)); k++) { WORLD.tick(1 / 60, performance.now()); while (WORLD.jobs.length) { const j = WORLD.jobs.shift(); let more = false; try { more = j.fn(); } catch (e) {} if (more) WORLD.jobs.push(j); } }
    const s = WORLD.STAMPS.filter(q => /^camp_/.test(q.id)).sort((a, b) => Math.hypot(a.x - px, a.z - pz) - Math.hypot(b.x - px, b.z - pz))[0];
    forceTime(12); const cv = REN.domElement, W = cv.width, H = cv.height, TW = 640, TH = 360, tiles = [], cam = new THREE.PerspectiveCamera(50, W / H, .1, 400);
    const snap = (cx, cz, dy, lx, ly, lz) => { cam.position.set(cx, WORLD.worldH(cx, cz) + dy, cz); cam.lookAt(lx, ly, lz); CAM.position.copy(cam.position); for (let i = 0; i < 3; i++) WORLD.tick(1 / 60, performance.now()); WORLD.scene.updateMatrixWorld(true); const f = WORLD.scene.fog; WORLD.scene.fog = null; REN.render(WORLD.scene, cam); WORLD.scene.fog = f; const c = document.createElement('canvas'); c.width = TW; c.height = TH; c.getContext('2d').drawImage(cv, 0, 0, W, H, 0, 0, TW, TH); tiles.push(c); };
    const y = WORLD.worldH(s.x, s.z); snap(s.x + 7, s.z + 8, 3, s.x, y + .6, s.z + 1); snap(s.x - 5, s.z + 6, 1.8, s.x, y + .3, s.z + 2.4);
    const c = document.createElement('canvas'); c.width = TW * 2 + 8; c.height = TH; const x = c.getContext('2d'); x.fillStyle = '#222'; x.fillRect(0, 0, c.width, c.height); tiles.forEach((o, i) => x.drawImage(o, i * (TW + 8), 0)); return c.toDataURL(); }));
  await g.close();
}
const { chromium } = await import('playwright');
const b = await chromium.launch(fs.existsSync('/opt/pw-browsers/chromium') ? { executablePath: '/opt/pw-browsers/chromium' } : {}); const p = await b.newPage();
const png = await p.evaluate(async rows => { const im = await Promise.all(rows.map(u => new Promise(r => { const i = new Image(); i.onload = () => r(i); i.src = u; })));
  const c = document.createElement('canvas'); c.width = im[0].width; c.height = im[0].height * 2 + 8; const x = c.getContext('2d'); x.fillStyle = '#222'; x.fillRect(0, 0, c.width, c.height); im.forEach((i, k) => x.drawImage(i, 0, k * (i.height + 8))); return c.toDataURL(); }, rows);
fs.writeFileSync(path.join(here, 'camps-ingame.png'), Buffer.from(png.split(',')[1], 'base64')); await b.close();
