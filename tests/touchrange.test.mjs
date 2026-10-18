// F2b, touch (Session 1085; docs/design/scale-numbers-build.md, *Touch and talk*). What E reaches with a hand is one number,
// TOUCH 1.6 m from the body's centre, horizontally: a herb on the ground, a room's door, a bed, the ship's wheel (with the
// crosshair on it, as before). Each is approached along a few clear lines, stepped out by 0.05 with the crosshair held on it,
// and the furthest step that still answers must be within 0.05 of 1.6 and none at or beyond it. A herb at your feet is then
// 2.30 from the standing eye, inside the sheet's 2.4 ray.
import { boot, check } from './lib/game.mjs';
const g = await boot(); const { page } = g;
await g.intoWorld();
const stop = g.keepAlive();

check('TOUCH is 1.6', await page.evaluate(() => TOUCH) === 1.6);

// the furthest of the steps 1.225, 1.275, … 2.375 (off the boundary itself) at which ok(d, a) holds, over the angles given; null if none
await page.evaluate(() => { window._reach = (ok, angles) => { let best = null, beyond = false;
  for (const a of angles) { let last = null; for (let d = 1.225; d <= 2.4; d += .05) { const r = ok(+d.toFixed(3), a); if (r === 'skip') continue; if (r) { last = +d.toFixed(3); if (d > 1.6) beyond = true; } }
    if (last != null && (best == null || last > best)) best = last; }
  return { best, beyond }; }; });

// 1. a herb on the open ground: E harvests it
const herb = await page.evaluate(() => {
  const hs = activeHerbs().filter(h => !h.harvested).sort((a, b) => Math.hypot(a.x - px, a.z - pz) - Math.hypot(b.x - px, b.z - pz));
  const h = hs.find(h => !hs.some(o => o !== h && Math.hypot(o.x - h.x, o.z - h.z) < 3)); if (!h) return null;
  const keep = harvestHerb; let got = null; harvestHerb = (x) => { got = x; };
  const r = _reach((d, a) => { px = h.x + Math.cos(a) * d; pz = h.z + Math.sin(a) * d; jumpY = WORLD.worldH(px, pz); got = null; lookAtPt(h.x, jumpY, h.z); try { interact(); } catch (e) {} return got === h; }, [0, 1.6, 3.2, 4.7]);
  harvestHerb = keep; return { name: h.name || h.kind, ...r, eye: +Math.hypot(1.6, 1.65).toFixed(2) }; });
check('a herb on the ground: E reaches it to 1.6 and no further', herb && herb.best >= 1.55 && !herb.beyond, herb);

// 2 and 3. a room's door and a bed, in a Dunmore inn, with the crosshair on each
await g.settle('dunmore');
await page.evaluate(() => { const h = WORLD.settle.get('dunmore').houses.find(x => x.type === 'inn'); window._inn = h; forceTime(13); px = h.exitX; pz = h.exitZ; goToInterior(h); });
await page.waitForFunction(() => currentHouse === window._inn && INT_BEDS.length > 0 && INT_DOORS.length > 0, null, { timeout: 60000 }); await g.frames(2); await g.hide();
const room = await page.evaluate(() => {
  for (const n of (INT_NPCS || [])) if (n.g) n.g.position.set(-50, n.g.position.y, -50);
  const clear = (x, z, y, tx, tz) => !(typeof intSolidAt === 'function' && intSolidAt(x, z, .3, y)) && intSightLine(x, z, tx, tz);
  const angles = []; for (let a = 0; a < 6.28; a += .2) angles.push(a);
  // a door: approached on its own floor, from either side of the doorway's normal and a little off it
  const doors = INT_DOORS.map(d => { const r = _reach((dd, a) => { const nx = Math.cos(d.ang), nz = -Math.sin(d.ang); const s = a < 3.14 ? 1 : -1, off = (a % 3.14) / 3.14 - .5;
      const x = d.x + nx * s * dd * Math.cos(off) - nz * dd * Math.sin(off), z = d.z + nz * s * dd * Math.cos(off) + nx * dd * Math.sin(off);
      if (typeof intSolidAt === 'function' && intSolidAt(x, z, .3, d.y)) return 'skip'; /* a door's middle is in its wall: no sight line to it */ px = x; pz = z; jumpY = d.y; lookAtPt((d.box.x0 + d.box.x1) / 2, d.y + .75, (d.box.z0 + d.box.z1) / 2); const n = intDoorNear(); return n === d; }, [.4, 1.2, 1.57, 2, 3.54, 4.4, 4.71, 5.2]);
    return r; }).filter(r => r.best != null);
  const beds = INT_BEDS.slice(0, 6).map(b => _reach((d, a) => { const x = b.x + Math.cos(a) * d, z = b.z + Math.sin(a) * d, y = b.y || 0;
      if (!clear(x, z, y, b.x, b.z)) return 'skip'; px = x; pz = z; jumpY = y; lookAtPt(b.x, y + .45, b.z); return intBedTarget() === b; }, angles)).filter(r => r.best != null);
  return { doors, beds }; });
console.log(JSON.stringify(room));
check('a room’s door: reached to 1.6 and no further', room.doors.length > 0 && room.doors.some(r => r.best >= 1.55) && room.doors.every(r => !r.beyond), room.doors);
check('a bed: reached to 1.6 and no further', room.beds.length > 0 && room.beds.some(r => r.best >= 1.55) && room.beds.every(r => !r.beyond), room.beds);
await page.evaluate(() => exitInterior()); await page.waitForTimeout(3000); await g.hide();

// 4. the ship's wheel, on her deck, with the crosshair on it (it answered at 2.4)
const wheel = await page.evaluate(() => {
  let sx = null, sz = null; for (let r = 300; r < 4000 && sx === null; r += 40) for (let a = 0; a < 6.28; a += .3) { const x = px + Math.cos(a) * r, z = pz + Math.sin(a) * r;
    if ([[0, 0], [25, 0], [-25, 0], [0, 25], [0, -25]].every(([dx, dz]) => WORLD.worldH(x + dx, z + dz) < -5)) { sx = x; sz = z; break; } }
  if (sx === null) return null;
  for (const o of [...WORLD.others]) WORLD.despawnOtherShip(o);
  worldState.ship = { cls: 'sloop', name: 'Test Gull', sails: 0, cargo: 0, hold: {} }; WORLD.spawnShip(sx, sz, 0); const S = WORLD.ship; S.sailing = false; S.speed = 0;
  px = sx; pz = sz; jumpY = DECK_Y; WORLD.tick(1 / 60, performance.now());
  const w = S.mesh.userData.wheel; const wp = new THREE.Vector3(); w.updateMatrixWorld(true); w.getWorldPosition(wp);
  const angles = []; for (let a = 0; a < 6.28; a += .26) angles.push(a);
  const r = _reach((d, a) => { px = S.wheel.x + Math.cos(a) * d; pz = S.wheel.z + Math.sin(a) * d; jumpY = DECK_Y; if (!onDeck()) return 'skip'; lookAtPt(wp.x, wp.y, wp.z); return nearWheel(); }, angles);
  return r; });
check('the ship’s wheel: taken to 1.6 and no further (2.4 before)', wheel && wheel.best >= 1.55 && !wheel.beyond, wheel);

check('no page errors', g.errs.length === 0, g.errs);
stop(); await g.close();
