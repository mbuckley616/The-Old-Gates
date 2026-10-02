// Session 407, H: the unarmed body in third person, the two look calls Session 402 left open. Rows: A today (the hand a
// mitten, the arms swinging at rest), B a folded fist on each hand (arms as today), C the fists carried low and ready,
// forearms forward at the belt, D the jab's own guard (the right fist by the chin, the left by the face) carried at rest
// and on the move. C and D drop to B's swinging arms while sprinting (Shift). Columns: standing, mid-stride on the move (the player's own pace is a run), a close look at the right hand, from
// ahead-right. Nothing here changes the game: the fist is patched into personBakeQ's source at runtime and the guard
// laid over tpPose's result. Run from the repo root: node docs/prototypes/unarmed/grid.mjs
import { boot } from '../../../tests/lib/game.mjs';
import fs from 'fs';
const g = await boot(); const { page } = g;
await g.intoWorld();
const r = await page.evaluate(() => {
  forceTime(11); thirdPerson = true; EQ.weapon = null; EQ.offhand = null; buildViewmodel();
  // the fist: a squarer palm, four knuckles across the front, the curled fingers under them, the thumb laid across
  const HAND = "const hand=part(SK.ball(.04,8,6),skin,wr,0,-.035,.004);hand.scale.set(.78,1.15,.6);B['hand'+k]=hand;\n    part(SK.ball(.016,5,4),skin,wr,s*-.028,-.022,.02).scale.set(1,1.4,1);";
  const FIST = "let hand;if(g.fists){hand=part(SK.rbox(.056,.066,.05,.018,2),skin,wr,0,-.04,.004);B['hand'+k]=hand;"
    + "for(let q=0;q<4;q++)part(SK.ball(.0105,6,5),skin,wr,0,-.071,-.015+q*.0105).scale.set(1.15,.9,1);"
    + "part(SK.rbox(.03,.03,.048,.012,2),skin,wr,s*-.016,-.06,.005);"
    + "part(SK.ball(.012,6,5),skin,wr,s*-.024,-.052,.026).scale.set(1,1,1.7);}"
    + "else{hand=part(SK.ball(.04,8,6),skin,wr,0,-.035,.004);hand.scale.set(.78,1.15,.6);B['hand'+k]=hand;\n    part(SK.ball(.016,5,4),skin,wr,s*-.028,-.022,.02).scale.set(1,1.4,1);}";
  const src = personBakeQ.toString(); if (!src.includes(HAND)) return 'hand line not found';
  const pb0 = personBakeQ, bp0 = buildPerson; (0, eval)(src.replace(HAND, FIST));
  const P = { fists: false, guard: 0 };
  buildPerson = function (gn, o) { if (P.fists && gn && gn.eq) gn.fists = true; return bp0(gn, o); };
  const tp0 = tpPose; tpPose = function (...a) { const out = tp0.apply(this, a); const R = TP.rig;
    if (P.guard && R && swingT <= 0 && !blocking && !window._K.ShiftLeft) {
      const sw = Math.sin(t / 1000 * 5) * .04;
      if (P.guard === 1) { R.shR.rotation.set(-.38 + sw, .14, 0); R.elR.rotation.set(-1.25, 0, 0); R.shL.rotation.set(-.38 - sw, -.14, 0); R.elL.rotation.set(-1.25, 0, 0); }
      else { R.shR.rotation.set(-1.1, .3, 0); R.elR.rotation.set(-1.75, 0, 0); R.shL.rotation.set(-1.25, -.32, 0); R.elL.rotation.set(-1.85, 0, 0); }
      R.handR.rotation.set(0, 0, 0); }
    return out; };
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
    for (const [row, f, gd] of [['A', false, 0], ['B', true, 0], ['C', true, 1], ['D', true, 2]]) {
      P.fists = f; P.guard = gd; TP.sig = null; settle();
      tris[row] = TP.rig.rig.mesh.geometry.index ? TP.rig.rig.mesh.geometry.index.count / 3 : TP.rig.rig.mesh.geometry.attributes.position.count / 3;
      snap(row + ': standing', 'front');
      K.KeyW = true; for (let i = 0; i < 50; i++) step(); snap(row + ': on the move', 'side'); K.KeyW = false; settle();
      snap(row + ': the right hand', 'hand');
      K.KeyW = true; for (let i = 0; i < 44; i++) step(); snap(row + ': on the move, ahead-right', 'front'); K.KeyW = false; settle();
    }
  } finally { window.requestAnimationFrame = raf; REN.render = rr; buildPerson = bp0; personBakeQ = pb0; tpPose = tp0; }
  const c = document.createElement('canvas'); c.width = 1200; c.height = 1200; const X = c.getContext('2d'); X.fillStyle = '#222'; X.fillRect(0, 0, 1200, 1200);
  tiles.forEach((T, i) => X.drawImage(T, (i % 4) * 300, Math.floor(i / 4) * 300)); return { png: c.toDataURL(), tris }; });
if (typeof r === 'string') { console.log(r); process.exit(1); }
fs.writeFileSync('docs/prototypes/unarmed-grid.png', Buffer.from(r.png.split(',')[1], 'base64'));
console.log('tris', JSON.stringify(r.tris), 'errors', g.errs);
await g.close();
