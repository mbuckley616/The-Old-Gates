// node docs/prototypes/fort-shot.mjs -> docs/prototypes/fort-ingame.png (Session 251): the fort compound nearest the
// start, the build before (tests/tmp/fort-before.html, from git) on the left and this build on the right, at noon, from
// above, with the instanced trees and plants hidden (they grow inside the ring): the whole ring from the gate side, and the back wall and a corner tower.
import { boot } from '../../tests/lib/game.mjs';
import fs from 'fs'; import path from 'path'; import { fileURLToPath } from 'url';
const here = path.dirname(fileURLToPath(import.meta.url)), ROOT = path.resolve(here, '..', '..');
const cols = [];
for (const src of [path.join(ROOT, 'tests', 'tmp', 'fort-before.html'), path.join(ROOT, 'index.html')]) {
  const g = await boot({ src }); const { page } = g; await g.intoWorld();
  const fd = await page.evaluate(() => { const out = []; const [hi, hj] = WORLD.cellOf(px, pz); for (let dj = -3; dj <= 3; dj++) for (let di = -3; di <= 3; di++) { let c; try { c = WORLD.getCell(hi + di, hj + dj); } catch (e) { continue; } if (c) for (const e of c.doors) if (e.kind === 'fort_door') out.push({ seed: e.seed, x: e.x, z: e.z, d: Math.hypot(e.x - px, e.z - pz) }); } return out.sort((a, b) => a.d - b.d)[0]; });
  await page.evaluate(f => goToZone('world', f.x, f.z + 45, 0, 'x'), fd); await page.waitForTimeout(9000); await g.hide();
  cols.push(await page.evaluate(seed => {
    for (let k = 0; k < 900 && !WORLD.settlements.has('fort_' + seed); k++) { WORLD.tick(1 / 60, performance.now()); while (WORLD.jobs.length) { const j = WORLD.jobs.shift(); let more = false; try { more = j.fn(); } catch (e) {} if (more) WORLD.jobs.push(j); } }
    const S = WORLD.settlements.get('fort_' + seed), cx = S.site.x, cz = S.site.z, y = WORLD.worldH(cx, cz); forceTime(12);
    const cv = REN.domElement, W = cv.width, H = cv.height, TW = 640, TH = 360, tiles = [], cam = new THREE.PerspectiveCamera(50, W / H, .3, 600);
    const shoot = (x, cy, z, lx, ly, lz) => { cam.position.set(x, cy, z); cam.lookAt(lx, ly, lz); CAM.position.copy(cam.position); for (let i = 0; i < 3; i++) WORLD.tick(1 / 60, performance.now()); WORLD.scene.updateMatrixWorld(true);
      const fog = WORLD.scene.fog; WORLD.scene.fog = null; REN.render(WORLD.scene, cam); WORLD.scene.fog = fog; const o = document.createElement('canvas'); o.width = TW; o.height = TH; o.getContext('2d').drawImage(cv, 0, 0, W, H, 0, 0, TW, TH); tiles.push(o); };
    const hid = []; WORLD.scene.traverse(o => { if (o.isInstancedMesh && o.visible) { o.visible = false; hid.push(o); } }); // the trees stand in the courtyard (Session 251's note): hidden for the picture
    shoot(cx + 14, y + 42, cz + 58, cx, y, cz + 12); shoot(cx - 30, y + 30, cz - 26, cx - 12, y + 2, cz - 12); hid.forEach(o => { o.visible = true; });
    const c = document.createElement('canvas'); c.width = TW; c.height = TH * 2; const x = c.getContext('2d'); tiles.forEach((o, i) => x.drawImage(o, 0, i * TH)); return c.toDataURL(); }, fd.seed));
  await g.close();
}
const { chromium } = await import('playwright');
const b = await chromium.launch(fs.existsSync('/opt/pw-browsers/chromium') ? { executablePath: '/opt/pw-browsers/chromium' } : {}); const p = await b.newPage();
const png = await p.evaluate(async cols => { const im = await Promise.all(cols.map(u => new Promise(r => { const i = new Image(); i.onload = () => r(i); i.src = u; })));
  const c = document.createElement('canvas'); c.width = im[0].width * 2 + 8; c.height = im[0].height; const x = c.getContext('2d'); x.fillStyle = '#222'; x.fillRect(0, 0, c.width, c.height); im.forEach((i, k) => x.drawImage(i, k * (i.width + 8), 0)); return c.toDataURL(); }, cols);
fs.writeFileSync(path.join(here, 'fort-ingame.png'), Buffer.from(png.split(',')[1], 'base64')); await b.close();
