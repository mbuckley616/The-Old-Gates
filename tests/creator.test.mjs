// The character creator's preview (Session 188, playtest s162): framed head to knees at any height, facing you to start,
// turned by dragging or the arrow keys, and turning itself only after four seconds untouched.
import { boot, check } from './lib/game.mjs';
import fs from 'fs';
const g = await boot(); const { page } = g;
fs.mkdirSync('tests/out', { recursive: true });
await page.click('#sb'); await page.waitForTimeout(1500);
// what the preview camera sees: the figure's head top and knee height in the canvas's own frame, and which way the face points
const look = () => page.evaluate(() => { const R = CCL.rig, c = CCL.c; R.root.updateMatrixWorld(true); const bb = new THREE.Box3().setFromObject(R.rig.mesh);
  const v = new THREE.Vector3(0, bb.max.y, 0).project(c), k = new THREE.Vector3(0, bb.max.y * .245, 0).project(c);
  const head = new THREE.Vector3(), eye = new THREE.Vector3(); R.rig.B.head.getWorldPosition(head); const e0 = R.rig.eyes[0], e1 = R.rig.eyes[1]; eye.set((e0[0] + e1[0]) / 2, (e0[1] + e1[1]) / 2, (e0[2] + e1[2]) / 2); R.rig.B.head.localToWorld(eye);
  const toCam = new THREE.Vector3().subVectors(c.position, head).setY(0).normalize(), face = new THREE.Vector3().subVectors(eye, head).setY(0).normalize();
  return { topY: +v.y.toFixed(3), kneeY: +k.y.toFixed(3), facing: +face.dot(toCam).toFixed(2), yaw: +CCL.yaw.toFixed(3) }; });
const open0 = await look();
check('the preview starts facing you, the head inside the frame, the knees in view', open0.facing > .85 && open0.topY < .95 && open0.topY > .6 && open0.kneeY > -1 && open0.kneeY < -.6, open0);
// still for the first seconds: it does not turn itself while it was just opened
await page.waitForTimeout(1500); const still = await look();
check('it does not turn by itself at first', Math.abs(still.yaw) < .01, still);
// drag across the canvas: it turns with the mouse
const box = await page.locator('#cc-look-cv').boundingBox();
await page.mouse.move(box.x + 50, box.y + 120); await page.mouse.down(); await page.mouse.move(box.x + 150, box.y + 120, { steps: 5 }); await page.mouse.up();
const dragged = await look();
check('dragging turns the figure', dragged.yaw > 1, dragged);
await page.evaluate(() => document.activeElement && document.activeElement.blur());
await page.keyboard.press('ArrowLeft'); await page.keyboard.press('ArrowLeft'); const keyed = await look();
check('the arrow keys turn it', Math.abs(keyed.yaw - (dragged.yaw - .4)) < .01, { dragged: dragged.yaw, keyed: keyed.yaw });
// left alone, it starts to turn slowly again
await page.evaluate(() => { CCL.touch = performance.now() - 5000; }); await page.waitForTimeout(1500); const idle = await look();
check('left alone past four seconds it turns slowly on its own', idle.yaw > keyed.yaw + .02, { keyed: keyed.yaw, idle: idle.yaw });
// the tallest body the slider allows still fits
const tallest = await page.evaluate(() => { let best = null; for (const k in WORLD.PEOPLES) { const h = WORLD.PEOPLES[k].height || 1; if (!best || h > best.h) best = { k, h }; } window._ccPeople = best.k; CCL.yaw = 0; CCL.touch = performance.now(); ccLookRebuild(); return best; });
const t2 = await look();
check('the tallest people is framed too, facing you', t2.topY < .95 && t2.kneeY > -1 && t2.facing > .85, { tallest, t2 });
fs.writeFileSync('tests/out/creator.png', await page.locator('#cc-look-cv').screenshot());
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
