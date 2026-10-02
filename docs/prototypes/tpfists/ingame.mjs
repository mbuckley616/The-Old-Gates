// Session 402, H: the empty hand's punch in third person (after Michael's A on #80). Top row: the build before, where a
// fist played the sword's forehand arc. Bottom row: the jab. Each at the draw (the wind-up's end), as the strike lands, and
// the power punch landing; then block. Seen from the body's right side and from ahead-right.
// Run from the repo root: node docs/prototypes/tpfists/ingame.mjs -> docs/prototypes/tpfists-ingame.png
import { boot } from '../../../tests/lib/game.mjs';
import fs from 'fs';
const g = await boot(); const { page } = g;
await g.intoWorld();
const r = await page.evaluate(() => {
  forceTime(11); thirdPerson = true; EQ.weapon = null; EQ.offhand = null; buildViewmodel();
  const raf = window.requestAnimationFrame, rr = REN.render.bind(REN); window.requestAnimationFrame = () => 0; REN.render = () => {};
  let t = performance.now(); const step = () => { t += 1000 / 60; loop(t); };
  const cv = REN.domElement, tiles = [], cam = new THREE.PerspectiveCamera(32, 1, .05, 60);
  const snap = (label, view) => { const R = TP.rig; R.root.updateMatrixWorld(true); const c = R.root.localToWorld(new THREE.Vector3(0, .75, 0));
    const off = view === 'side' ? new THREE.Vector3(-2.6, .15, .2) : new THREE.Vector3(-1.7, .25, 2.0); const q = R.root.getWorldQuaternion(new THREE.Quaternion());
    cam.aspect = cv.width / cv.height; cam.updateProjectionMatrix(); cam.position.copy(c).add(off.applyQuaternion(q)); cam.lookAt(c); rr(scene, cam);
    const s = Math.min(cv.width, cv.height), T = document.createElement('canvas'); T.width = T.height = 300; T.getContext('2d').drawImage(cv, (cv.width - s) / 2, (cv.height - s) / 2, s, s, 0, 0, 300, 300);
    const x = T.getContext('2d'); x.fillStyle = 'rgba(0,0,0,.55)'; x.fillRect(0, 0, 300, 24); x.fillStyle = '#f0e6c8'; x.font = '15px serif'; x.fillText(label, 6, 17); tiles.push(T); };
  const punchTo = (pow, q, old) => { const mark = vmSword.userData.fists; if (old) vmSword.userData.fists = false;
    swingT = 0; _pendingStrike = null; for (let i = 0; i < 8; i++) step();
    swingT = ANIM_PARAMS.swing.normalDur; _pendingStrike = { resolveFn: () => {}, isPow: pow, fired: false }; ANIM_PARAMS.swing.variantLock = 0;
    let n = 0; while (swingT > 0 && n++ < 90) { step(); if (TP.swMax > 0 && 1 - swingT / TP.swMax >= q) break; }
    return () => { vmSword.userData.fists = mark; ANIM_PARAMS.swing.variantLock = -1; while (swingT > 0) step(); }; };
  const A = ANIM_PARAMS.swing.antEnd, I = ANIM_PARAMS.swing.impactPoint + 1 / 33;
  try {
    for (const old of [true, false]) { const tag = old ? 'before: ' : '';
      let done = punchTo(false, A, old); snap(tag + 'the draw', 'side'); done();
      done = punchTo(false, I, old); snap(tag + 'the jab lands', 'side'); done();
      done = punchTo(false, I, old); snap(tag + 'the jab, ahead-right', 'front'); done();
      done = punchTo(true, I, old); snap(tag + 'power punch lands', 'side'); done(); }
    blocking = true; for (let i = 0; i < 20; i++) step(); snap('block (unchanged)', 'front'); blocking = false;
  } finally { window.requestAnimationFrame = raf; REN.render = rr; }
  const c = document.createElement('canvas'); c.width = 1200; c.height = 900; const X = c.getContext('2d'); X.fillStyle = '#222'; X.fillRect(0, 0, 1200, 900);
  tiles.forEach((T, i) => X.drawImage(T, (i % 4) * 300, Math.floor(i / 4) * 300)); return c.toDataURL(); });
fs.writeFileSync('docs/prototypes/tpfists-ingame.png', Buffer.from(r.split(',')[1], 'base64'));
console.log('errors', g.errs);
await g.close();
