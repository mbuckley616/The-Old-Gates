// node docs/prototypes/walls-shot.mjs -> docs/prototypes/walls-ingame.png (Session 249): La Porte Grise, the walled town
// nearest the start, rebuilt at the prosperity of each wall tier (palisade 50, stone 72, dressed stone 90); the build
// before (tests/tmp/walls-before.html, from git) on the left and this build on the right, from the same places at noon:
// outside a gate at each tier, and along the stone wall.
import { boot } from '../../tests/lib/game.mjs';
import fs from 'fs'; import path from 'path'; import { fileURLToPath } from 'url';
const here = path.dirname(fileURLToPath(import.meta.url)), ROOT = path.resolve(here, '..', '..');
const cols = [];
for (const src of [path.join(ROOT, 'tests', 'tmp', 'walls-before.html'), path.join(ROOT, 'index.html')]) {
  const g = await boot({ src }); const { page } = g; await g.intoWorld();
  await g.settle('la_porte_grise');
  cols.push(await page.evaluate(() => {
    const t = WORLD.siteAnywhere('la_porte_grise'); forceTime(12); const cv = REN.domElement, W = cv.width, H = cv.height, TW = 640, TH = 360, tiles = [], cam = new THREE.PerspectiveCamera(55, W / H, .3, 600);
    const shoot = (x, z, lx, lz, dy, ly) => { const y = WORLD.worldH(x, z); cam.position.set(x, y + dy, z); cam.lookAt(lx, WORLD.worldH(lx, lz) + ly, lz); CAM.position.copy(cam.position); for (let i = 0; i < 3; i++) WORLD.tick(1 / 60, performance.now()); WORLD.scene.updateMatrixWorld(true);
      const fog = WORLD.scene.fog; WORLD.scene.fog = null; REN.render(WORLD.scene, cam); WORLD.scene.fog = fog; const o = document.createElement('canvas'); o.width = TW; o.height = TH; o.getContext('2d').drawImage(cv, 0, 0, W, H, 0, 0, TW, TH); tiles.push(o); };
    for (const [p, along] of [[50, false], [72, false], [72, true], [90, false]]) {
      WORLD.setProsperity(t, p); if (WORLD.settlements.has(t.id)) WORLD.disposeSettlement(t.id); const S = WORLD.genSettlement(t); const cx = t.x, cz = t.z, gt = S._gates[0];
      const ox = gt.x - cx, oz = gt.z - cz, od = Math.hypot(ox, oz), ux = ox / od, uz = oz / od;
      if (!along) shoot(gt.x + ux * 22 + uz * 7, gt.z + uz * 22 - ux * 7, gt.x, gt.z, 3, 3);
      else { const a = Math.atan2(oz, ox) + .45, wx = cx + Math.cos(a) * od, wz = cz + Math.sin(a) * od; shoot(wx + Math.cos(a) * 10 + Math.sin(a) * 8, wz + Math.sin(a) * 10 - Math.cos(a) * 8, wx, wz, 2.2, 2.5); } }
    const c = document.createElement('canvas'); c.width = TW; c.height = TH * tiles.length; const x = c.getContext('2d'); tiles.forEach((o, i) => x.drawImage(o, 0, i * TH)); return c.toDataURL(); }));
  await g.close();
}
const { chromium } = await import('playwright');
const b = await chromium.launch(fs.existsSync('/opt/pw-browsers/chromium') ? { executablePath: '/opt/pw-browsers/chromium' } : {}); const p = await b.newPage();
const png = await p.evaluate(async cols => { const im = await Promise.all(cols.map(u => new Promise(r => { const i = new Image(); i.onload = () => r(i); i.src = u; })));
  const c = document.createElement('canvas'); c.width = im[0].width * 2 + 8; c.height = im[0].height; const x = c.getContext('2d'); x.fillStyle = '#222'; x.fillRect(0, 0, c.width, c.height); im.forEach((i, k) => x.drawImage(i, k * (i.width + 8), 0)); return c.toDataURL(); }, cols);
fs.writeFileSync(path.join(here, 'walls-ingame.png'), Buffer.from(png.split(',')[1], 'base64')); await b.close();
