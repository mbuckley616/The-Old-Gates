// Switching foes while locked (Session 312). A sideways flick of the mouse (90 px within 0.2 s) moves the lock to the
// next foe on that side of the one held, the nearest by angle; nothing on that side, the lock stays. A slow drift of
// the mouse never switches, and one flick switches once.
import { boot, check } from './lib/game.mjs';
const g = await boot(); const { page } = g;
await g.intoWorld();
const stop = g.keepAlive();

await page.evaluate(() => {
  window._mkFoe = (d, a) => {
    const fx = -Math.sin(yaw), fz = -Math.cos(yaw), r = a * Math.PI / 180;
    const dx = fx * Math.cos(r) - fz * Math.sin(r), dz = fx * Math.sin(r) + fz * Math.cos(r);
    const e = buildZoneEnemy(WORLD.scene, [], px + dx * d, pz + dz * d, 'Bandit', null); if (!e.mesh.parent) WORLD.scene.add(e.mesh);
    e.locked = false; e.alert = false; e.spd = 0; e.atkCd = 1e9; e.telegraphT = 0; e.mesh.position.y = activeTerrainH(e.x, e.z); return e; };
  // where a foe sits on screen, -1 (left edge) to 1 (right edge)
  window._sx = (e) => { const v = new THREE.Vector3(e.x, e.mesh.position.y + 1, e.z); CAM.updateMatrixWorld(true); v.project(CAM); return +v.x.toFixed(3); };
});

// a row of four foes across the view, 7 units off: -40°, -15° (locked first), +10°, +35°. Positive angles turn
// the view's forward towards +x at yaw 0, which is screen right.
const r = await page.evaluate(() => {
  const out = {}; const keep = ZE; lockRelease();
  yaw = 0; pitch = 0;
  const A = _mkFoe(7, -40), B = _mkFoe(7, -15), C = _mkFoe(7, 10), D = _mkFoe(7, 35);
  const name = (e) => e === A ? 'A' : e === B ? 'B' : e === C ? 'C' : e === D ? 'D' : String(e && e.type);
  ZE = [A, B, C, D];
  lockOn(B); for (let i = 0; i < 60; i++) tickLock(1 / 60);
  CAM.rotation.order = 'YXZ'; CAM.rotation.set(pitch, yaw, 0); CAM.position.set(px, CAM.position.y, pz);
  out.screen = { A: _sx(A), B: _sx(B), C: _sx(C), D: _sx(D) };
  const cv = document.getElementById('c') || document.querySelector('canvas');
  Object.defineProperty(document, 'pointerLockElement', { get: () => cv, configurable: true });
  const mv = (x) => window.dispatchEvent(new MouseEvent('mousemove', { movementX: x, bubbles: true }));
  const rest = () => { LFL.rest = 0; LFL.sum = 0; LFL.t0 = 0; };
  // a flick right: three quick moves of 40 px
  rest(); mv(40); mv(40); mv(40); out.right1 = name(LOCK.t);
  // the same flick continued straight on is ignored for a moment (one flick, one switch)
  mv(40); mv(40); mv(40); out.sameFlick = name(LOCK.t);
  rest(); mv(40); mv(40); mv(40); out.right2 = name(LOCK.t);
  rest(); mv(40); mv(40); mv(40); out.rightEnd = name(LOCK.t);
  rest(); mv(-50); mv(-50); out.left1 = name(LOCK.t);
  // a slow drift: 20 px moves, each more than 0.2 s apart, never add up to a flick
  rest(); const realNow = performance.now.bind(performance); let fake = realNow();
  performance.now = () => fake;
  for (let i = 0; i < 10; i++) { fake += 300; mv(-20); }
  performance.now = realNow; out.drift = name(LOCK.t);
  delete document.pointerLockElement;
  // behind a wall: a solid between you and the next foe to the left is passed over (a stand-in solid on the line)
  const keepSol = WORLD.camSolid; lockOn(B);
  const midx = px + (A.x - px) * .5, midz = pz + (A.z - pz) * .5;
  const origSolid = lockSolidFn; window.lockSolidFn = () => (x, z) => Math.hypot(x - midx, z - midz) < .8;
  out.blocked = lockSwitch(-1) === false && name(LOCK.t);
  window.lockSolidFn = origSolid;
  out.unblocked = lockSwitch(-1) === true && name(LOCK.t);
  // a foe beyond reach (20 units) is not switched to
  lockOn(D); const far = _mkFoe(20, 60); ZE.push(far); out.farSkipped = lockSwitch(1) === false && name(LOCK.t);
  // the view follows the new target
  lockOn(B); lockSwitch(1); for (let i = 0; i < 40; i++) tickLock(1 / 60);
  const want = Math.atan2(-(C.x - px), -(C.z - pz)); let dy = want - yaw; dy = Math.atan2(Math.sin(dy), Math.cos(dy));
  out.viewOnC = +(Math.abs(dy) * 180 / Math.PI).toFixed(2);
  lockRelease(); ZE = keep; [A, B, C, D, far].forEach(e => WORLD.scene.remove(e.mesh));
  return out;
});
check('the four foes sit left to right on screen, A B C D', r.screen.A < r.screen.B && r.screen.B < r.screen.C && r.screen.C < r.screen.D, r);
check('a flick right moves the lock from B to C', r.right1 === 'C', r);
check('one flick switches once, however long the hand keeps moving', r.sameFlick === 'C', r);
check('a second flick right moves it to D; a third finds nothing and keeps D', r.right2 === 'D' && r.rightEnd === 'D', r);
check('a flick left moves it back to C', r.left1 === 'C', r);
check('a slow drift of the mouse never switches', r.drift === 'C', r);
check('a foe with a solid between is passed over; with the line clear it is taken', r.blocked === 'B' && r.unblocked === 'A', r);
check('a foe out of reach is not switched to', r.farSkipped === 'D', r);
check('the view turns to the new foe', r.viewOnC < 1, r);

stop();
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
