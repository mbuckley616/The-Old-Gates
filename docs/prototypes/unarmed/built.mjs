// Session 407, H: the unarmed body in third person, the two look calls Session 402 left open. Rows: A today (the hand a
// mitten, the arms swinging at rest), B a folded fist on each hand (arms as today), C the fists carried low and ready,
// forearms forward at the belt, D the jab's own guard (the right fist by the chin, the left by the face) carried at rest
// and on the move. C and D drop to B's swinging arms while sprinting (Shift). Columns: standing, mid-stride on the move (the player's own pace is a run), a close look at the right hand, from
// ahead-right. Nothing here changes the game: the fist is patched into personBakeQ's source at runtime and the guard
// laid over tpPose's result. Run from the repo root: node docs/prototypes/unarmed/grid.mjs
// Session 411: built.mjs is this script against the built game (Michael's D), no patches: unarmed, then with a sword.
import { boot } from '../../../tests/lib/game.mjs';
import fs from 'fs';
const g = await boot(); const { page } = g;
await g.intoWorld();
const r = await page.evaluate(() => {
  forceTime(11); thirdPerson = true; EQ.weapon = null; EQ.offhand = null; buildViewmodel();
  const raf = window.requestAnimationFrame, rr = REN.render.bind(REN); window.requestAnimationFrame = () => 0; REN.render = () => {};
  let t = performance.now(); const step = () => { t += 1000 / 60; loop(t); };
  const cv = REN.domElement, tiles = [], cam = new THREE.PerspectiveCamera(32, 1, .02, 60);
  const snap = (label, view) => { const R = TP.rig; R.root.updateMatrixWorld(true);
    const close = view === 'hand'; const c = close ? R.handR.localToWorld(new THREE.Vector3(0, -.04, 0)) : R.root.localToWorld(new THREE.Vector3(0, .75, 0));
    const off = close ? new THREE.Vector3(-.28, .08, .3) : view === 'side' ? new THREE.Vector3(-2.6, .15, .2) : new THREE.Vector3(-1.7, .25, 2.0);
    const q = R.root.getWorldQuaternion(new THREE.Quaternion());
    cam.aspect = cv.width / cv.height; cam.updateProjectionMatrix(); cam.position.copy(c).add(off.applyQuaternion(q)); cam.lookAt(c); rr(scene, cam);
    const s = Math.min(cv.width, cv.height), T = document.createElement('canvas'); T.width = T.height = 300; T.getContext('2d').drawImage(cv, (cv.width - s) / 2, (cv.height - s) / 2, s, s, 0, 0, 300, 300);
    const x = T.getContext('2d'); x.fillStyle = 'rgba(0,0,0,.55)'; x.fillRect(0, 0, 300, 24); x.fillStyle = '#f0e6c8'; x.font = '15px serif'; x.fillText(label, 6, 17); tiles.push(T); };
  // on the move: hold W for a while and stop mid-stride
  const K = window._K;
  const settle = () => { K.KeyW = false; for (let i = 0; i < 40; i++) step(); };
  const tris = {};
  try {
    for (const [row, w] of [['Unarmed', null], ['A sword', { name: 'Steel Sword', slot: 'weapon', weaponShape: 'sword' }]]) {
      EQ.weapon = w; buildViewmodel(); TP.sig = null; settle();
      tris[row] = TP.rig.rig.mesh.geometry.index ? TP.rig.rig.mesh.geometry.index.count / 3 : TP.rig.rig.mesh.geometry.attributes.position.count / 3;
      snap(row + ': standing', 'front');
      K.KeyW = true; for (let i = 0; i < 50; i++) step(); snap(row + ': on the move', 'side'); K.KeyW = false; settle();
      snap(row + ': the right hand', 'hand');
      K.KeyW = true; for (let i = 0; i < 44; i++) step(); snap(row + ': on the move, ahead-right', 'front'); K.KeyW = false; settle();
    }
  } finally { window.requestAnimationFrame = raf; REN.render = rr; prevT = performance.now(); }
  const c = document.createElement('canvas'); c.width = 1200; c.height = 600; const X = c.getContext('2d'); X.fillStyle = '#222'; X.fillRect(0, 0, 1200, 600);
  tiles.forEach((T, i) => X.drawImage(T, (i % 4) * 300, Math.floor(i / 4) * 300)); return { png: c.toDataURL(), tris }; });
if (typeof r === 'string') { console.log(r); process.exit(1); }
fs.writeFileSync('docs/prototypes/unarmed-built.png', Buffer.from(r.png.split(',')[1], 'base64'));
console.log('tris', JSON.stringify(r.tris), 'errors', g.errs);
await g.close();
