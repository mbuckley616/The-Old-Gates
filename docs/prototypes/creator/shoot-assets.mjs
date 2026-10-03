// Assets for the proposed creator and title: the creator's own figure at full length (head to feet) for each people,
// rendered by the game's tpBuild in a 360×600 transparent canvas, and the world at dusk for the title's backdrop.
// node docs/prototypes/creator/shoot-assets.mjs  (writes fig-*.png, backdrop-title.png and assets.json beside this file)
import { boot } from '../../../tests/lib/game.mjs';
import fs from 'fs'; import path from 'path'; import { fileURLToPath } from 'url';
const here = path.dirname(fileURLToPath(import.meta.url));
const g = await boot(); const { page } = g;
await page.click('#sb'); await page.waitForTimeout(1500);
await page.fill('#cc-name', 'Aoife');
// Duelist: sword by default; look as the game deals it for each people
await page.evaluate(() => { const t = [...document.querySelectorAll('.cc-arch-tile')].find(x => x.textContent.includes('Duelist')); t.click(); });
const out = {};
for (const [i, pp] of ['gatelander', 'markman', 'aurennais', 'oldblood'].entries()) {
  const r = await page.evaluate(([i]) => {
    document.querySelectorAll('#cc-people-grid button')[i].click();
    const W = 360, H = 600; CCL.r.setPixelRatio(1); CCL.r.setSize(W, H, false); CCL.c.aspect = W / H; CCL.c.updateProjectionMatrix();
    const R = CCL.rig; R.root.rotation.y = 0; R.root.updateMatrixWorld(true);
    const bb = new THREE.Box3().setFromObject(R.rig.mesh); const top = bb.max.y, bot = bb.min.y, mid = (top + bot) / 2, half = (top - bot) / 2 * 1.06;
    const d = half / Math.tan(THREE.MathUtils.degToRad(CCL.c.fov / 2));
    const shots = {};
    for (const [k, yw] of [['front', 0], ['three', -.55], ['side', -Math.PI / 2]]) {
      CCL.c.position.set(0, mid + .02, d); CCL.c.lookAt(0, mid, 0); R.root.rotation.y = yw; R.root.updateMatrixWorld(true);
      CCL.r.render(CCL.s, CCL.c); shots[k] = CCL.r.domElement.toDataURL('image/png');
    }
    CCL.touch = performance.now() + 1e9;
    return { shots, look: window._ccLook, height: top - bot };
  }, [i]);
  for (const k in r.shots) fs.writeFileSync(path.join(here, `fig-${pp}-${k}.png`), Buffer.from(r.shots[k].split(',')[1], 'base64'));
  out[pp] = { look: r.look, height: r.height };
}
// back to a normal creator, then into the world for the backdrop
await page.evaluate(() => { CCL.r.setSize(200, 250, false); document.querySelectorAll('#cc-people-grid button')[0].click(); });
await page.evaluate(() => ccBegin()); await page.waitForTimeout(9000); await g.hide();
await page.evaluate(() => goToZone('world', 13100, 25450, 0, 'x')); await page.waitForTimeout(9000); await g.hide();
await g.settle('dunmore');
await page.evaluate(() => { forceTime(19.2); const S = WORLD.settle.get('dunmore'); const cx = S.site.x, cz = S.site.z;
  px = cx + 70; pz = cz + 55; const dx = cx - px, dz = cz - pz; yaw = Math.atan2(-dx, -dz); pitch = .06; VM_SCENE.visible = false; });
await g.spin(null, 60); await g.frames(30); await g.hide();
await page.evaluate(() => { for (const e of document.querySelectorAll('#g > *')) if (e.id !== 'c') e.style.visibility = 'hidden'; });
await page.screenshot({ path: path.join(here, 'backdrop-title.png'), clip: { x: 0, y: 0, width: 1280, height: 600 } });
out.save = await page.evaluate(() => ({ name: playerName, arch: playerArchetype, level: typeof plv !== 'undefined' ? plv : null,
  loc: (document.getElementById('loc') || {}).textContent, hour: typeof gameHour !== 'undefined' ? gameHour : null }));
fs.writeFileSync(path.join(here, 'assets.json'), JSON.stringify(out, null, 1));
console.log('errors', g.errs, out.save, Object.keys(out));
await g.close();
