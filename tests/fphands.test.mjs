// The hands on every held weapon (Session 536, Michael's inspector note: "the fist/hand mesh is very dated and ugly. We need to
// update across the board so that it is at least in sync with the 'fists' weapon mesh for the player. Hands need to look like
// hands, especially in first person."). The grip on a sword, an axe, a staff, a bow, a shield and a torch is the fists' own
// hand closed round the haft, with its forearm, and an arm from the shoulder to the forearm's end; the torch and the shield,
// whose hands floated, have an arm too. SHOTS=<name> writes docs/prototypes/<name>.png, the six in first person.
import { boot, check } from './lib/game.mjs';
import fs from 'fs';
const g = await boot(); const { page } = g;
await g.intoWorld();
const r = await page.evaluate(() => { forceTime(11); thirdPerson = false; const cv = REN.domElement, tiles = [], near = [], out = {};
  const sets = [
    ['sword and kite', { name: 'Steel Sword', slot: 'weapon', weaponShape: 'sword', matCol: '#dde8ec', matGuard: '#a0b0b8' }, { name: 'Iron Kite Shield', slot: 'offhand', shieldType: 'shield', matCol: '#a8b0b8', matGuard: '#787880' }],
    ['axe', { name: 'Iron War Axe', slot: 'weapon', weaponShape: 'axe', matCol: '#a8b0b8', matGuard: '#787880' }, null],
    ['staff', { name: 'Oak Staff', slot: 'weapon', weaponShape: 'staff', twoHand: true, matGlow: '#88aaff' }, null],
    ['bow', { name: 'Hunting Bow', slot: 'weapon', weaponShape: 'bow', twoHand: true, matCol: '#6a4a2a' }, null],
    ['dagger and torch', { name: 'Iron Dagger', slot: 'weapon', weaponShape: 'dagger', matCol: '#a8b0b8', matGuard: '#787880' }, { name: 'Torch', slot: 'offhand', torchType: 'torch' }]];
  const snap = () => { vmSword && vmSword.updateMatrixWorld(true); vmShield && vmShield.updateMatrixWorld(true); _updateArmBridge(vmArmR); _updateArmBridge(vmArmL);
    REN.render(scene, CAM); REN.autoClear = false; REN.clearDepth(); REN.render(VM_SCENE, VM_CAM); REN.autoClear = true;
    const o = document.createElement('canvas'); o.width = cv.width / 2; o.height = cv.height / 2; o.getContext('2d').drawImage(cv, 0, 0, cv.width, cv.height, 0, 0, o.width, o.height); return o; };
  // a closer look for the picture: the view model alone from its own camera lowered and drawn back, so the hands are in frame
  const close = () => { const c = VM_CAM.clone(); c.position.y -= .2; c.position.z += .12; c.updateMatrixWorld(true); REN.setClearColor(0x8aa0b8, 1); REN.clear(); REN.render(VM_SCENE, c);
    const o = document.createElement('canvas'); o.width = cv.width / 2; o.height = cv.height / 2; o.getContext('2d').drawImage(cv, 0, 0, cv.width, cv.height, 0, 0, o.width, o.height); return o; };
  const v = new THREE.Vector3(), w = new THREE.Vector3();
  const hand = h => { if (!h) return null; let tris = 0, boxes = 0, vc = false; h.traverse(o => { if (!o.isMesh) return; const gg = o.geometry; tris += (gg.index ? gg.index.count : gg.attributes.position.count) / 3; if (gg.type === 'BoxGeometry' || gg.type === 'BoxBufferGeometry') boxes++; if (o.material.vertexColors) vc = true; });
    // the haft through the hand: the grip's own origin lies inside the hand's bounds, with hand on both sides of it across and along the view
    h.updateMatrixWorld(true); const inv = new THREE.Matrix4().copy(h.matrixWorld).invert(), bb = new THREE.Box3();
    h.traverse(o => { if (!o.isMesh) return; const p = o.geometry.attributes.position; for (let i = 0; i < p.count; i += 3) { bb.expandByPoint(v.fromBufferAttribute(p, i).applyMatrix4(o.matrixWorld).applyMatrix4(inv)); } });
    const el = h.userData.elbow; let back = null; if (el) { el.getWorldPosition(v); h.getWorldPosition(w); back = { dz: +(v.z - w.z).toFixed(3), dy: +(v.y - w.y).toFixed(3) }; }
    return { tris: Math.round(tris), boxes, vc, around: bb.min.x < -.015 && bb.max.x > .015 && bb.min.z < -.015 && bb.max.z > .015, elbow: !!el, back }; };
  const bridge = b => { if (!b) return null; _updateArmBridge(b); const tgt = b.userData.wristHand; tgt.getWorldPosition(v); b.updateMatrixWorld(true); w.set(0, 1, 0).applyMatrix4(b.matrixWorld); return { toElbow: !!(tgt && tgt.parent && !tgt.isGroup), gap: +v.distanceTo(w).toFixed(4) }; };
  for (const [k, wpn, off] of sets) { EQ.weapon = wpn; EQ.offhand = off; buildViewmodel(); buildShieldViewmodel();
    out[k] = { main: hand(vmSword.userData.handMain), low: hand(vmSword.userData.handLow), off: vmShield ? hand(vmShield.userData.handMain) : null, armR: bridge(vmArmR), armL: bridge(vmArmL) };
    tiles.push(snap()); near.push(close()); }
  const fistTris = (() => { const f = buildFistMesh(false); let t = 0; f.traverse(o => { if (o.isMesh) t += o.geometry.attributes.position.count / 3; }); return { tris: t, elbow: f.userData.elbow.position.z }; })();
  // the picture: the five as you see them in play on the top row, and closer below
  const c = document.createElement('canvas'), tw = tiles[0].width * .7, th = tiles[0].height * .7; c.width = tw * 5; c.height = th * 2; const x = c.getContext('2d');
  tiles.forEach((t, i) => x.drawImage(t, i * tw, 0, tw, th)); near.forEach((t, i) => x.drawImage(t, i * tw, th, tw, th));
  EQ.weapon = null; EQ.offhand = null; buildViewmodel(); buildShieldViewmodel(); return { out, fistTris, shot: c.toDataURL() }; });
if (process.env.SHOTS) { fs.mkdirSync('docs/prototypes', { recursive: true }); fs.writeFileSync('docs/prototypes/' + process.env.SHOTS + '.png', Buffer.from(r.shot.split(',')[1], 'base64')); }
const o = r.out; console.log(JSON.stringify({ o, fist: r.fistTris }));
const hands = Object.values(o).flatMap(s => [s.main, s.low, s.off]).filter(Boolean);
check('nine grip hands are measured: one on each of five weapons, a second on the staff and the bow, one on the shield and one on the torch', hands.length === 9, hands.length);
check('every hand is the fists\' own vertex-coloured hand, with no box in it', hands.every(h => h.vc && h.boxes === 0 && h.tris > 400), hands.map(h => [h.tris, h.boxes, h.vc]));
check('the haft passes through the hand: the grip lies inside it, with hand on both sides', hands.every(h => h.around), hands.map(h => h.around));
check('every hand has its forearm, its end back towards you and lower than the grip', hands.every(h => h.elbow && h.back.dz > .05 && h.back.dy < 0), hands.map(h => h.back));
check('the weapon arm reaches the forearm\'s end on every weapon', Object.values(o).every(s => s.armR && s.armR.toElbow && s.armR.gap < .002), Object.values(o).map(s => s.armR));
check('a left arm reaches the staff\'s and the bow\'s second hand, the shield\'s and the torch\'s', ['sword and kite', 'staff', 'bow', 'dagger and torch'].every(k => o[k].armL && o[k].armL.toElbow && o[k].armL.gap < .002) && !o.axe.armL, Object.fromEntries(Object.entries(o).map(([k, s]) => [k, s.armL])));
check('the fists themselves are unchanged: forearm to the elbow .34', Math.abs(r.fistTris.elbow - .34) < 1e-6, r.fistTris);
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
