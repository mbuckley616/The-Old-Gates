// Prototype (Session 380, H): a fist on screen in first person, owed since Session 174 (fists are the empty hand's weapon, and
// buildViewmodel draws nothing without a weapon). Three options, each at rest, mid-jab and in guard, posed straight into the
// view scene. No game code changes. Run from the repo root: node docs/prototypes/fists/shots.mjs
import { boot } from '../../../tests/lib/game.mjs';
import fs from 'fs';
const g = await boot(); const { page } = g;
await g.intoWorld();
const r = await page.evaluate(() => {
  forceTime(11); thirdPerson = false; EQ.weapon = null; EQ.offhand = null; buildViewmodel(); buildShieldViewmodel();
  const cv = REN.domElement, C = h => new THREE.Color(h);
  const skin = C(HAND_SKIN.palm).multiplyScalar(.66).getHex(), linen = 0xd6ccb0, sleeve = 0x6a5a44;
  // One fist on the kit: a rounded back of the hand, the four knuckles, the folded fingers under them, the thumb laid across
  // the fingers, and a wrist. Knuckles towards −z (away from the eye). left mirrors the thumb. wrap = a pugilist's linen.
  const geoMerge = (parts) => { const gs = parts.map(([geo, col, m]) => { const q = geo.index ? geo.toNonIndexed() : geo; q.applyMatrix4(m); const n = q.attributes.position.count, c = new Float32Array(n * 3), cc = C(col); for (let i = 0; i < n; i++) { c[i * 3] = cc.r; c[i * 3 + 1] = cc.g; c[i * 3 + 2] = cc.b; } q.setAttribute('color', new THREE.BufferAttribute(c, 3)); q.deleteAttribute('uv'); return q; });
    let N = 0; gs.forEach(q => N += q.attributes.position.count); const P = new Float32Array(N * 3), Nm = new Float32Array(N * 3), Cl = new Float32Array(N * 3); let o = 0;
    gs.forEach(q => { P.set(q.attributes.position.array, o * 3); Nm.set(q.attributes.normal.array, o * 3); Cl.set(q.attributes.color.array, o * 3); o += q.attributes.position.count; });
    const out = new THREE.BufferGeometry(); out.setAttribute('position', new THREE.BufferAttribute(P, 3)); out.setAttribute('normal', new THREE.BufferAttribute(Nm, 3)); out.setAttribute('color', new THREE.BufferAttribute(Cl, 3)); return out; };
  const M = (x, y, z, rx, ry, rz, s) => { const m = new THREE.Matrix4(); m.compose(new THREE.Vector3(x, y, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(rx || 0, ry || 0, rz || 0)), s ? new THREE.Vector3(...s) : new THREE.Vector3(1, 1, 1)); return m; };
  const fist = (left, wrap) => { const sx = left ? 1 : -1, hand = wrap ? linen : skin, tip = skin, parts = [];
    parts.push([SK.rbox(.086, .07, .092, .024, 3), hand, M(0, .006, 0)]);
    for (let i = 0; i < 4; i++) { const x = (-.03 + i * .02) * sx; parts.push([SK.ball(.0175, 9, 7), hand, M(x, .016, -.046 + Math.abs(i - 1.5) * .003)]); parts.push([SK.rbox(.019, .036, .03, .009, 2), tip, M(x, -.016, -.05)]); }
    parts.push([SK.rbox(.024, .022, .066, .011, 2), skin, M(sx * .012, -.036, -.034, 0, sx * .5, 0)]);
    parts.push([SK.ball(.03, 9, 7), hand, M(sx * .034, -.012, .012, 0, 0, 0, [.8, .9, 1.2])]);
    parts.push([SK.cyl(.03, .034, .09, 12), wrap ? linen : skin, M(0, -.004, .07, Math.PI / 2, 0, 0)]);
    if (wrap) for (let k = 0; k < 3; k++) parts.push([SK.torus(.031 + k * .001, .004, 5, 14), 0xc4b896, M(0, -.004, .04 + k * .022)]);
    const m = new THREE.Mesh(SK.smooth ? geoMerge(parts) : geoMerge(parts), new THREE.MeshLambertMaterial({ vertexColors: true })); const gr = new THREE.Group(); gr.add(m); return gr; };
  const sleeveArm = (shoulder, hand) => { const b = buildArmBridge(); b.userData.shoulder = shoulder; const wr = new THREE.Object3D(); wr.position.set(0, -.004, .11); hand.add(wr); b.userData.wristHand = wr; return b; };
  const place = (o, p, rot) => { o.position.set(...p); o.rotation.set(...rot); return o; };
  // poses: [position, rotation] for the right fist; the left is mirrored in x unless given
  const OPTS = {
    A: { both: true, wrap: false, rest: [[.17, -.2, -.5], [.25, .15, -1.0]], restL: [[-.19, -.22, -.56], [.25, -.15, 1.0]],
      jab: [[.04, -.11, -.64], [.05, .05, -.15]], jabL: [[-.17, -.2, -.5], [.35, -.15, 1.1]],
      guard: [[.09, -.05, -.5], [-.15, .12, -1.35]], guardL: [[-.09, -.06, -.51], [-.15, -.12, 1.35]] },
    B: { both: false, wrap: false, rest: [[.26, -.22, -.52], [.15, -.15, -.3]],
      jab: [[.02, -.28, -.6], [.3, .25, -.9]], guard: [[.12, -.12, -.46], [-.3, .3, -1.2]] },
    C: { both: true, wrap: true }
  };
  OPTS.C = { ...OPTS.A, wrap: true };
  const SR = new THREE.Vector3(.4, -.66, -.52), SL = new THREE.Vector3(-.4, -.66, -.52);
  const tiles = {};
  for (const [k, o] of Object.entries(OPTS)) { tiles[k] = [];
    for (const pose of ['rest', 'jab', 'guard']) {
      const add = []; const fR = fist(false, o.wrap); place(fR, ...o[pose]); add.push(fR, sleeveArm(SR, fR));
      if (o.both) { const fL = fist(true, o.wrap); place(fL, ...o[pose + 'L']); add.push(fL, sleeveArm(SL, fL)); }
      add.forEach(a => VM_SCENE.add(a)); add.forEach(a => a.updateMatrixWorld(true)); add.forEach(a => a.userData.shoulder && _updateArmBridge(a));
      REN.render(scene, CAM); REN.autoClear = false; REN.clearDepth(); REN.render(VM_SCENE, VM_CAM); REN.autoClear = true;
      const t = document.createElement('canvas'); t.width = cv.width * .6; t.height = cv.height * .39; t.getContext('2d').drawImage(cv, 0, cv.height * .35, cv.width, cv.height * .65, 0, 0, t.width, t.height);
      const x = t.getContext('2d'); x.fillStyle = 'rgba(0,0,0,.55)'; x.fillRect(0, 0, 170, 26); x.fillStyle = '#f0e6c8'; x.font = '16px serif'; x.fillText(k + ' — ' + pose, 8, 18);
      tiles[k].push(t); add.forEach(a => VM_SCENE.remove(a)); } }
  const out = {}; let tri = 0; fist(false, false).children[0].geometry.attributes.position.count && (tri = fist(false, false).children[0].geometry.attributes.position.count / 3); out.triA = tri; out.triC = fist(false, true).children[0].geometry.attributes.position.count / 3;
  for (const k in tiles) { const ts = tiles[k], c = document.createElement('canvas'); c.width = ts[0].width * 3; c.height = ts[0].height; ts.forEach((t, i) => c.getContext('2d').drawImage(t, i * t.width, 0)); out[k] = c.toDataURL(); }
  // today: an empty hand draws nothing
  REN.render(scene, CAM); REN.autoClear = false; REN.clearDepth(); REN.render(VM_SCENE, VM_CAM); REN.autoClear = true; const t = document.createElement('canvas'); t.width = cv.width / 2; t.height = cv.height / 2; t.getContext('2d').drawImage(cv, 0, 0, t.width, t.height); out.today = t.toDataURL();
  return out; });
for (const k of ['A', 'B', 'C', 'today']) fs.writeFileSync(`docs/prototypes/fists-${k.toLowerCase()}.png`, Buffer.from(r[k].split(',')[1], 'base64'));
console.log(JSON.stringify({ triA: r.triA, triC: r.triC }), g.errs);
await g.close();
