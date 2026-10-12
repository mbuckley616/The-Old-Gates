// node docs/prototypes/sleeper/shoot.mjs [tag] -> docs/prototypes/sleeper-<tag>.png (Session 752): a home's resident asleep in bed
// at 23h30 in three Dunmore homes, seen over the pillow and from the foot of the bed ('nocover' as a second argument hides the quilt).
import { boot } from '../../../tests/lib/game.mjs';
import fs from 'fs'; import path from 'path'; import { fileURLToPath } from 'url';
const here = path.dirname(fileURLToPath(import.meta.url)), OUT = path.resolve(here, '..'), TAG = process.argv[2] || 'now', NOCOVER = process.argv[3] === 'nocover';
const g = await boot(); const { page } = g; await g.intoWorld(); await g.settle('dunmore');
const tiles = [];
for (const k of [0, 3, 6]) {
  await page.evaluate((k) => { forceTime(23.5); const S = WORLD.settle.get('dunmore');
    const hs = S.houses.filter(x => x.type === 'home' && !x.ownedByPlayer && !x.shuttered); const h = hs[k]; px = h.exitX; pz = h.exitZ; goToInterior(h); }, k);
  await page.waitForTimeout(3000); await g.hide();
  await page.evaluate(() => { for (let i = 0; i < 90; i++) { tickPeople(1 / 60, performance.now() + i * 16.7); } });
  tiles.push(await page.evaluate((process_nocover) => { const b = INT_BEDS.find(b => b.owner === 'home'); const cv = REN.domElement, TW = 420, TH = 360, out = [];
    const cam = new THREE.PerspectiveCamera(50, TW / TH, .05, 60); px = b.x + 3; pz = b.z + 3;
    const cz = b.cz != null ? b.cz : b.z, cv0 = intNPCMesh.userData.cover; if (cv0 && process_nocover) cv0.visible = false;
    for (const [ex, ey, ez, lz] of [[1.5, 1.45, -.6, -.35], [1.7, 1.9, 1.7, 0]]) {
      cam.position.set(b.x + ex, (b.y || 0) + ey, cz + ez); cam.lookAt(b.x, (b.y || 0) + .5, cz + lz); scene.updateMatrixWorld(true);
      REN.render(scene, cam); const o = document.createElement('canvas'); o.width = TW; o.height = TH;
      const s = Math.min(cv.width / TW, cv.height / TH); o.getContext('2d').drawImage(cv, (cv.width - TW * s) / 2, (cv.height - TH * s) / 2, TW * s, TH * s, 0, 0, TW, TH); out.push(o.toDataURL()); }
    return out; }, NOCOVER));
  await page.evaluate(() => exitInterior()); await page.waitForTimeout(1500);
}
const url = await page.evaluate(async (tiles) => { const TW = 420, TH = 360, c = document.createElement('canvas'); c.width = TW * 3 + 16; c.height = TH * 2 + 8;
  const x = c.getContext('2d'); x.fillStyle = '#222'; x.fillRect(0, 0, c.width, c.height);
  for (let i = 0; i < tiles.length; i++) for (let j = 0; j < 2; j++) { const im = new Image(); im.src = tiles[i][j]; await im.decode(); x.drawImage(im, i * (TW + 8), j * (TH + 8)); }
  return c.toDataURL(); }, tiles);
fs.writeFileSync(path.join(OUT, `sleeper-${TAG}.png`), Buffer.from(url.split(',')[1], 'base64'));
console.log('errs', JSON.stringify(g.errs)); await g.close();
