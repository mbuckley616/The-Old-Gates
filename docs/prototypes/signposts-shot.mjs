// node docs/prototypes/signposts-shot.mjs -> docs/prototypes/signposts-ingame.png (Session 253): Hearthwick's signpost and
// name board by the road in, the build before (tests/tmp/signposts-before.html, from git) above and this build below.
import { boot } from '../../tests/lib/game.mjs';
import fs from 'fs'; import path from 'path'; import { fileURLToPath } from 'url';
const here = path.dirname(fileURLToPath(import.meta.url)), ROOT = path.resolve(here, '..', '..');
const rows = [];
for (const src of [path.join(ROOT, 'tests', 'tmp', 'signposts-before.html'), path.join(ROOT, 'index.html')]) {
  const g = await boot({ src }); const { page } = g; await g.intoWorld();
  rows.push(await page.evaluate(() => {
    for (let k = 0; k < 600 && (WORLD.jobs.length || [...WORLD.LOADED.values()].some(L => L.pending || !L.staticsBuilt)); k++) { WORLD.tick(1 / 60, performance.now()); while (WORLD.jobs.length) { const j = WORLD.jobs.shift(); let more = false; try { more = j.fn(); } catch (e) {} if (more) WORLD.jobs.push(j); } }
    const s = WORLD.SITE.hearthwick, outs = WORLD.ROAD_DEFS.filter(d => d.a === s.id || d.b === s.id).map(d => WORLD.SITE[d.a === s.id ? d.b : d.a]).filter(Boolean), o = outs[0];
    const dx = o.x - s.x, dz = o.z - s.z, L = Math.hypot(dx, dz), ux = dx / L, uz = dz / L, sx = s.x + ux * (s.pad + 4) - uz * 4, sz = s.z + uz * (s.pad + 4) + ux * 4, bx = s.x + ux * (s.pad + 3) - uz * 3.4, bz = s.z + uz * (s.pad + 3) + ux * 3.4;
    forceTime(12); const cv = REN.domElement, W = cv.width, H = cv.height, TW = 640, TH = 360, tiles = [], cam = new THREE.PerspectiveCamera(50, W / H, .1, 400);
    const snap = (cx, cz, lx, ly, lz) => { cam.position.set(cx, WORLD.worldH(cx, cz) + 2.4, cz); cam.lookAt(lx, ly, lz); CAM.position.copy(cam.position); for (let i = 0; i < 3; i++) WORLD.tick(1 / 60, performance.now()); WORLD.scene.updateMatrixWorld(true); const f = WORLD.scene.fog; WORLD.scene.fog = null; REN.render(WORLD.scene, cam); WORLD.scene.fog = f; const c = document.createElement('canvas'); c.width = TW; c.height = TH; c.getContext('2d').drawImage(cv, 0, 0, W, H, 0, 0, TW, TH); tiles.push(c); };
    snap(sx + ux * 4.5 + uz * 1.5, sz + uz * 4.5 - ux * 1.5, sx, WORLD.worldH(sx, sz) + 2.2, sz); snap(bx + ux * 5 - uz * 1, bz + uz * 5 + ux * 1, bx, WORLD.worldH(bx, bz) + 1.7, bz);
    const c = document.createElement('canvas'); c.width = TW * 2 + 8; c.height = TH; const x = c.getContext('2d'); x.fillStyle = '#222'; x.fillRect(0, 0, c.width, c.height); tiles.forEach((o, i) => x.drawImage(o, i * (TW + 8), 0)); return c.toDataURL(); }));
  await g.close();
}
const { chromium } = await import('playwright');
const b = await chromium.launch(fs.existsSync('/opt/pw-browsers/chromium') ? { executablePath: '/opt/pw-browsers/chromium' } : {}); const p = await b.newPage();
const png = await p.evaluate(async rows => { const im = await Promise.all(rows.map(u => new Promise(r => { const i = new Image(); i.onload = () => r(i); i.src = u; })));
  const c = document.createElement('canvas'); c.width = im[0].width; c.height = im[0].height * 2 + 8; const x = c.getContext('2d'); x.fillStyle = '#222'; x.fillRect(0, 0, c.width, c.height); im.forEach((i, k) => x.drawImage(i, 0, k * (i.height + 8))); return c.toDataURL(); }, rows);
fs.writeFileSync(path.join(here, 'signposts-ingame.png'), Buffer.from(png.split(',')[1], 'base64')); await b.close();
