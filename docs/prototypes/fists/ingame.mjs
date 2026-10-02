// Session 396, H: the fists as built (Michael's A on #80): rest, the jab as it lands, guard; and a close look at one fist.
// Run from the repo root: node docs/prototypes/fists/ingame.mjs -> docs/prototypes/fists-ingame.png
import { boot } from '../../../tests/lib/game.mjs';
import fs from 'fs';
const g = await boot(); const { page } = g;
await g.intoWorld();
const r = await page.evaluate(() => {
  forceTime(11); thirdPerson = false; EQ.weapon = null; EQ.offhand = null; buildViewmodel();
  const cv = REN.domElement, tiles = [], ip = ANIM_PARAMS.swing.impactPoint;
  const shot = (label, setup) => { swingT = 0; vmSword.userData.swingMax = 0; setup(); vmSword.updateMatrixWorld(true);
    _updateArmBridge(vmArmR); _updateArmBridge(vmArmL);
    REN.render(scene, CAM); REN.autoClear = false; REN.clearDepth(); REN.render(VM_SCENE, VM_CAM); REN.autoClear = true;
    const t = document.createElement('canvas'); t.width = cv.width * .6; t.height = cv.height * .45; t.getContext('2d').drawImage(cv, 0, cv.height * .3, cv.width, cv.height * .7, 0, 0, t.width, t.height);
    const x = t.getContext('2d'); x.fillStyle = 'rgba(0,0,0,.55)'; x.fillRect(0, 0, 200, 26); x.fillStyle = '#f0e6c8'; x.font = '16px serif'; x.fillText(label, 8, 18); tiles.push(t); };
  shot('rest', () => vmFistPose(0, 0, 0, 0));
  shot('jab, as it lands', () => { vmSword.userData.swingMax = .4; swingT = .4 * (1 - ip); vmFistPose(0, 0, 0, 0); });
  shot('guard', () => vmFistPose(1, 0, 0, 0));
  shot('power punch drawn', () => vmFistPose(0, 1, 0, 0));
  // close: the right fist alone before a plain ground, from the front-left and from above
  const close = []; const sc = new THREE.Scene(); sc.background = new THREE.Color(0x6a7480); sc.add(new THREE.AmbientLight(0xffffff, .8)); const sun = new THREE.DirectionalLight(0xffd080, 1.2); sun.position.set(1, 2, 1); sc.add(sun);
  const f = buildFistMesh(false); f.rotation.set(0, 0, 0); f.position.set(0, 0, 0); sc.add(f); const cam = new THREE.PerspectiveCamera(30, cv.width / cv.height, .01, 10);
  for (const [lab, p] of [['the fist from the front', [-.12, .1, -.3]], ['from the thumb side', [-.3, .05, .02]], ['from above', [0, .32, .12]]]) {
    cam.position.set(...p); cam.lookAt(0, 0, .04); REN.render(sc, cam); const t = document.createElement('canvas'); t.width = cv.width * .3; t.height = cv.height * .45; t.getContext('2d').drawImage(cv, cv.width * .25, 0, cv.width * .5, cv.height, 0, 0, t.width, t.height);
    const x = t.getContext('2d'); x.fillStyle = 'rgba(0,0,0,.55)'; x.fillRect(0, 0, 200, 26); x.fillStyle = '#f0e6c8'; x.font = '16px serif'; x.fillText(lab, 8, 18); close.push(t); }
  const tw = tiles[0].width, th = tiles[0].height, c = document.createElement('canvas'); c.width = tw * 2; c.height = th * 3; const X = c.getContext('2d');
  tiles.forEach((t, i) => X.drawImage(t, (i % 2) * tw, Math.floor(i / 2) * th)); close.forEach((t, i) => X.drawImage(t, i * close[0].width * 1.333, th * 2, close[0].width * 1.333, th));
  return { png: c.toDataURL(), tris: f.children[0].geometry.attributes.position.count / 3 }; });
fs.writeFileSync('docs/prototypes/fists-ingame.png', Buffer.from(r.png.split(',')[1], 'base64'));
console.log('tris', r.tris, g.errs);
await g.close();
