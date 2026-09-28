// What a picked herb leaves (Session 263, H.5a, Michael's A on Session 237): the seventeen kinds that do not stay as a
// bare plant leave a stub on a patch of turned earth, the picked copy the bushes already have, drawn only while one of the
// chunk's herbs of that kind is picked; it regrows as before.
import { boot, check } from './lib/game.mjs';
import fs from 'fs';
const g = await boot(); const { page } = g;
await g.intoWorld();
fs.mkdirSync('tests/out', { recursive: true });
const found = await page.evaluate(async () => { const want = h => h.inst && h.instP && !h.harvested && !PLANT_STAYS.has(PLANT_KIND[h.type]);
  const x0 = px, z0 = pz; let h = ZONES.world.herbs.find(want);
  for (let r = 1; !h && r < 10; r++) { const a = r * 2.4; px = x0 + Math.cos(a) * r * 60; pz = z0 + Math.sin(a) * r * 60; for (let i = 0; i < 40; i++) WORLD.tick(1 / 60, performance.now()); await new Promise(res => setTimeout(res, 300)); h = ZONES.world.herbs.find(want); }
  if (!h) return null; window._H = h; px = h.x + 1.2; pz = h.z; for (let i = 0; i < 40; i++) WORLD.tick(1 / 60, performance.now());
  return { type: h.type, kind: PLANT_KIND[h.type], stubGeo: h.instP.geometry === plantGeo(h.type, true) && !!h.instP.geometry.userData.stub, pickedShownBefore: h.instP.visible }; });
console.log(JSON.stringify(found));
check('a herb that does not stay is found near the start, with its stub as its picked copy, not drawn while none is picked', !!found && found.stubGeo && found.pickedShownBefore === false, found);
if (found) {
  const st = () => page.evaluate(() => { const h = _H, m = new THREE.Matrix4(), p = new THREE.Vector3(), q = new THREE.Quaternion(), s = new THREE.Vector3(); h.inst.getMatrixAt(h.idx, m); m.decompose(p, q, s); const a = s.x; h.instP.getMatrixAt(h.idx, m); m.decompose(p, q, s); return { whole: +a.toFixed(3), stub: +s.x.toFixed(3), shown: h.instP.visible }; });
  await page.evaluate(() => { harvestHerb(_H); }); const now = await st(); await g.spin(null, 45); const after = await st();
  // a picture of the stub where the plant stood
  const shot = await page.evaluate(() => { const h = _H, y = WORLD.worldH(h.x, h.z); forceTime(12); const cv = REN.domElement, cam = new THREE.PerspectiveCamera(35, cv.width / cv.height, .05, 100);
    cam.position.set(h.x + .9, y + .7, h.z + .9); cam.lookAt(h.x, y + .03, h.z); CAM.position.copy(cam.position); WORLD.scene.updateMatrixWorld(true); const f = WORLD.scene.fog; WORLD.scene.fog = null; REN.render(WORLD.scene, cam); WORLD.scene.fog = f;
    const o = document.createElement('canvas'); o.width = cv.width; o.height = cv.height; o.getContext('2d').drawImage(cv, 0, 0); return o.toDataURL(); });
  fs.writeFileSync('tests/out/herbstub.png', Buffer.from(shot.split(',')[1], 'base64'));
  await page.evaluate(() => { _H.harvested = false; _H.g.visible = true; }); await g.spin(null, 45); const back = await st();
  console.log(JSON.stringify({ now, after, back }));
  check('picking it (at the herbs\' next half-second sync, as the bushes) shows the stub where the plant stood and hides the plant', after.whole < .01 && after.stub === 1 && after.shown, { now, after });
  check('when it grows back the whole plant returns and the stub goes', back.whole === 1 && back.stub < .01, back);
}
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
