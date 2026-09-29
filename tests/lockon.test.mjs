// Lock-on (Session 297; combat, Michael's B). The middle mouse button locks the nearest foe you are looking towards,
// within 14 units and 60° of the view, and lets go when pressed again. While locked the view holds the foe (the mouse is
// set aside), so A/D circle it. It lets go by itself when the foe dies, leaves the fight or is more than 20 units off.
import { boot, check } from './lib/game.mjs';
const g = await boot(); const { page } = g;
await g.intoWorld();
const stop = g.keepAlive();

// a real Bandit that stands still and never swings, placed at distance d and angle a (degrees) off the view
await page.evaluate(() => {
  window._mkFoe = (d, a) => {
    const fx = -Math.sin(yaw), fz = -Math.cos(yaw), r = a * Math.PI / 180;
    const dx = fx * Math.cos(r) - fz * Math.sin(r), dz = fx * Math.sin(r) + fz * Math.cos(r);
    const e = buildZoneEnemy(WORLD.scene, [], px + dx * d, pz + dz * d, 'Bandit', null); if (!e.mesh.parent) WORLD.scene.add(e.mesh);
    e.locked = false; e.alert = false; e.spd = 0; e.atkCd = 1e9; e.telegraphT = 0; e.mesh.position.y = activeTerrainH(e.x, e.z); return e; };
  window._ang = (e) => { const want = Math.atan2(-(e.x - px), -(e.z - pz)); let d = want - yaw; d = Math.atan2(Math.sin(d), Math.cos(d)); return +(Math.abs(d) * 180 / Math.PI).toFixed(2); };
});

const pick = await page.evaluate(() => {
  const out = {}; const keep = ZE; lockRelease();
  const near = _mkFoe(6, 30), far = _mkFoe(16, 0), behind = _mkFoe(3, 170), wide = _mkFoe(4, 75);
  ZE = [far, behind, wide, near];
  out.picked = toggleLock() && LOCK.t === near;
  out.again = toggleLock() === false && LOCK.t === null;
  ZE = [far, behind, wide];
  out.none = toggleLock() === false && LOCK.t === null;
  out.msg = document.getElementById('msg') ? document.getElementById('msg').textContent : '';
  ZE = keep; [near, far, behind, wide].forEach(e => WORLD.scene.remove(e.mesh));
  return out;
});
check('it locks the foe at 6 units and 30° off, not one 16 out, behind, or 75° off', pick.picked, pick);
check('pressed again, it lets go', pick.again, pick);
check('with nothing ahead within 14 units and 60°, nothing locks', pick.none, pick);

// the view turns to the foe and holds it
const hold = await page.evaluate(() => {
  const out = {}; const keep = ZE; lockRelease();
  const e = _mkFoe(6, 40); ZE = [e]; toggleLock();
  out.before = _ang(e);
  for (let i = 0; i < 30; i++) tickLock(1 / 60);
  out.after30 = _ang(e);
  yaw += 1.2; for (let i = 0; i < 30; i++) tickLock(1 / 60);
  out.pulledBack = _ang(e);
  out.pitch = +pitch.toFixed(3);
  window._keepZE = keep; window._foe = e;
  return out;
});
check('locked 40° off, the view is on the foe within half a second', hold.before > 35 && hold.after30 < 1, hold);
check('turned away 69°, it comes back to the foe', hold.pulledBack < 1, hold);
check('the view looks at the foe, not the sky or the ground', Math.abs(hold.pitch) < .4, hold);

// the middle button, through the game's own handlers (pointer lock is faked: headless has none)
const mb = await page.evaluate(() => {
  const out = {}; lockRelease();
  const cv = document.getElementById('c') || document.querySelector('canvas');
  Object.defineProperty(document, 'pointerLockElement', { get: () => cv, configurable: true });
  const ev = (type, button, extra) => (type === 'mousemove' ? window : cv).dispatchEvent(new MouseEvent(type, { button, bubbles: true, ...(extra || {}) }));
  swingT = 0; atkCd = 0;
  ev('mousedown', 1); ev('mouseup', 1);
  out.locked = LOCK.t === _foe; out.noSwing = swingT === 0 && !powerCharging;
  const y0 = yaw; ev('mousemove', 0, { movementX: 300, movementY: 100 }); out.mouseAside = yaw === y0;
  ev('mousedown', 1); ev('mouseup', 1);
  out.freed = LOCK.t === null;
  ev('mousemove', 0, { movementX: 100 }); out.mouseBack = yaw !== y0;
  delete document.pointerLockElement;
  return out;
});
check('a middle click locks, and does not swing', mb.locked && mb.noSwing, mb);
check('while locked the mouse does not turn the view', mb.mouseAside, mb);
check('a second middle click lets go, and the mouse turns the view again', mb.freed && mb.mouseBack, mb);

// A/D circle the foe, through the game's own loop and keys
await page.evaluate(() => { toggleLock(); const e = _foe; window._c0 = { r: Math.hypot(px - e.x, pz - e.z), a: Math.atan2(px - e.x, pz - e.z), x: px, z: pz }; });
await g.frames(3);
const mark = await page.evaluate(() => { const m = document.getElementById('lockmk'); return { shown: m.style.display, left: parseFloat(m.style.left), top: parseFloat(m.style.top) }; });
check('a gold mark sits on the foe near the middle of the screen', mark.shown === 'block' && Math.abs(mark.left - 50) < 12 && mark.top > 25 && mark.top < 75, mark);
await page.keyboard.down('d');
// Session 326: counted in the loop's frames, not the clock. A frame moves at most 0.05 s of game time, so on a slow runner
// 20 s of the clock was a few seconds of walking (1.3 units, 12.7°); 400 frames are 6.7 s or more.
const circ = await page.evaluate(() => new Promise(res => { const t0 = performance.now(); let n = 0; const f = () => { n++;
  const e = _foe, a = Math.atan2(px - e.x, pz - e.z); let da = a - _c0.a; da = Math.atan2(Math.sin(da), Math.cos(da));
  if (Math.abs(da) > .8 || n > 400 || performance.now() - t0 > 180000) { res({ frames: n, r0: +_c0.r.toFixed(2), r: +Math.hypot(px - e.x, pz - e.z).toFixed(2), turned: +(Math.abs(da) * 180 / Math.PI).toFixed(1), moved: +Math.hypot(px - _c0.x, pz - _c0.z).toFixed(2), facing: _ang(e), locked: LOCK.t === e }); } else requestAnimationFrame(f); }; requestAnimationFrame(f); }));
await page.keyboard.up('d');
// the loop runs a few frames a second on software GL, so this walks a part of the circle, not all of it
check('holding D circles the foe: 20°+ round it, the distance kept within .4 of a unit, still facing it', circ.turned > 20 && Math.abs(circ.r - circ.r0) < .4 && circ.facing < 8 && circ.locked, circ);

// letting go by itself
const rel = await page.evaluate(() => {
  const out = {}; const e = _foe;
  if (!LOCK.t) toggleLock();
  e.dead = true; tickLock(1 / 60); out.dies = LOCK.t === null; e.dead = false;
  toggleLock(); const ex = e.x, ez = e.z; e.x = px + (e.x - px) * 30; e.z = pz + (e.z - pz) * 30; tickLock(1 / 60); out.far = LOCK.t === null; e.x = ex; e.z = ez;
  toggleLock(); ZE = window._keepZE; tickLock(1 / 60); out.zone = LOCK.t === null;
  out.markHidden = document.getElementById('lockmk').style.display === 'none';
  WORLD.scene.remove(e.mesh);
  // a dungeon's pool: this floor's live foes only
  const za = activeZoneId, ke = ENEMIES; activeZoneId = 'dungeon';
  const mk = (floor, extra) => ({ x: px, z: pz - 5, floor, hp: 10, mesh: new THREE.Group(), ...(extra || {}) });
  const here = mk(currentFloor), other = mk(currentFloor + 1), hid = mk(currentFloor, { disguised: true }), gone = mk(currentFloor, { dead: true });
  ENEMIES = [other, hid, gone, here]; out.dungeon = lockPool().length === 1 && lockPool()[0] === here;
  ENEMIES = ke; activeZoneId = za;
  return out;
});
check('it lets go when the foe dies', rel.dies, rel);
check('it lets go past 20 units', rel.far, rel);
check('it lets go when the foe leaves the fight (the zone\'s foes change)', rel.zone && rel.markHidden, rel);
check('in a dungeon it locks only this floor\'s living, undisguised foes', rel.dungeon, rel);

// third person: the same lock holds the camera
const tp = await page.evaluate(() => { thirdPerson = true; const keep = ZE; const e = _mkFoe(5, -45); ZE = [e]; lockRelease(); toggleLock(); window._keepZE = keep; window._foe = e; return _ang(e); });
await g.frames(8);
const tp2 = await page.evaluate(() => { const a = _ang(_foe); const m = document.getElementById('lockmk'); const out = { a, mark: m.style.display, left: parseFloat(m.style.left) };
  lockRelease(); ZE = window._keepZE; WORLD.scene.remove(_foe.mesh); thirdPerson = false; return out; });
check('in third person the view turns to the foe and the mark shows', tp > 40 && tp2.a < 3 && tp2.mark === 'block' && Math.abs(tp2.left - 50) < 15, { before: tp, ...tp2 });

stop();
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
