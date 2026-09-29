// Lock-on needs a clear line (Session 311). A foe behind a wall can't be locked; a locked foe that stays behind a
// wall for 1.5 s is let go, and one that comes back into view within that keeps the lock. Walls are the foes' own
// sight solids: the dungeon's walls, and in the open world the camera's solids (houses, walls, rocks; not trunks).
import { boot, check } from './lib/game.mjs';
import { enterDungeon } from './lib/dungeonshot.mjs';
const g = await boot(); const { page } = g;
await g.intoWorld();
const stop = g.keepAlive();

// ── the open world: a house in Dunmore between you and a real Bandit ──
await g.settle('dunmore');
const world = await page.evaluate(() => {
  const out = {}; const keep = ZE; lockRelease();
  const sol = WORLD.camSolid, t = WORLD.siteAnywhere('dunmore');
  // a standing place and a direction where a solid lies between you and a clear spot 8 units off, and a direction
  // where the whole 8 units are clear
  let spot = null, open = null;
  for (let k = 0; k < 4000 && !(spot && open); k++) {
    const x = t.x + (Math.random() - .5) * 90, z = t.z + (Math.random() - .5) * 90, a = Math.random() * Math.PI * 2;
    const fx = -Math.sin(a), fz = -Math.cos(a), ex = x + fx * 8, ez = z + fz * 8;
    if (sol(x, z) || sol(ex, ez) || WORLD.solidAt(x, z) || WORLD.solidAt(ex, ez)) continue;
    let hits = 0; for (let i = 1; i < 40; i++) if (sol(x + fx * 8 * i / 40, z + fz * 8 * i / 40)) hits++;
    if (hits >= 6 && !spot) spot = { x, z, a };
    if (hits === 0 && !open) open = { x, z, a };
  }
  out.found = !!(spot && open);
  if (!out.found) { ZE = keep; return out; }
  const foeAt = (p) => { px = p.x; pz = p.z; yaw = p.a;
    const e = buildZoneEnemy(WORLD.scene, [], p.x - Math.sin(p.a) * 8, p.z - Math.cos(p.a) * 8, 'Bandit', null); if (!e.mesh.parent) WORLD.scene.add(e.mesh);
    e.locked = false; e.alert = false; e.spd = 0; e.atkCd = 1e9; e.telegraphT = 0; return e; };
  const hidden = foeAt(spot); ZE = [hidden];
  out.behindHouse = toggleLock() === false && LOCK.t === null;
  const seen = foeAt(open); ZE = [seen];
  out.inTheOpen = toggleLock() === true && LOCK.t === seen;
  lockRelease(); ZE = keep; [hidden, seen].forEach(e => WORLD.scene.remove(e.mesh));
  return out;
});
check('in Dunmore a house and a clear street were found for the test', world.found, world);
check('a Bandit 8 units off behind a house cannot be locked', world.behindHouse, world);
check('a Bandit 8 units off down a clear street can', world.inTheOpen, world);

// ── indoors (Session 314): a shop's back-room partition, with its door shut ──
const shopId = await page.evaluate(() => { forceTime(13); const S = WORLD.settle.get('dunmore');
  for (const h of S.houses) { if (!/weapon|armor|potion|misc/.test(h.type) || !h.keeper) continue; WORLD.buildInteriorFor(h); if (h._backRoom) return h.id; } return null; });
await page.evaluate((id) => { const h = WORLD.settle.get('dunmore').houses.find(x => x.id === id); px = h.exitX; pz = h.exitZ; goToInterior(h); }, shopId);
await page.waitForTimeout(4000); await g.hide();
const room = await page.evaluate(() => {
  const out = { inside: isInterior() }; const keep = ZE; lockRelease();
  const h = currentHouse, W = h.intW, D = h.intD;
  out.doorsShut = (WORLD.intDoors || []).every(d => !d.open);
  // you stand in the shop facing the back wall; one foe is in the back room behind the partition, one in the shop
  px = W * .75; pz = D - 5; jumpY = 0; yaw = Math.PI; // facing +z, towards the back
  const mk = (x, z) => { const e = buildZoneEnemy(interiorScene, [], x, z, 'Bandit', null); if (!e.mesh.parent) interiorScene.add(e.mesh); e.locked = false; e.alert = false; e.spd = 0; e.atkCd = 1e9; e.telegraphT = 0; return e; };
  const back = mk(W * .75, D - 1.8), front = mk(W * .75, D - 3.9);
  out.lineBack = WORLD.intSightLine(px, pz, back.x, back.z); out.lineFront = WORLD.intSightLine(px, pz, front.x, front.z);
  ZE = [back]; out.backLocked = toggleLock() === true; lockRelease();
  ZE = [front]; out.frontLocked = toggleLock() === true && LOCK.t === front; lockRelease();
  ZE = keep; [back, front].forEach(e => interiorScene.remove(e.mesh));
  return out;
});
await page.evaluate(() => { exitInterior(); }); await page.waitForTimeout(3000); await g.hide();
check('indoors: a foe behind the shut back-room partition cannot be locked', room.inside && room.doorsShut && room.lineBack === false && room.backLocked === false, room);
check('indoors: a foe in the shop with you can', room.lineFront === true && room.frontLocked, room);

// ── a dungeon: a wall between two open cells ──
await enterDungeon(page, { theme: 'goblin', seed: 5 });
const dun = await page.evaluate(() => {
  const out = {}; const keep = ENEMIES; lockRelease();
  const open = (c, r) => r >= 0 && r < dR && c >= 0 && c < dC && dMap[r][c] > 0 && dMap[r][c] !== 2 && !dSolid(c, r);
  const wall = (c, r) => r >= 0 && r < dR && c >= 0 && c < dC && dMap[r][c] === 0;
  let wallSpot = null, clearSpot = null;
  for (let r = 1; r < dR - 1 && !(wallSpot && clearSpot); r++) for (let c = 1; c < dC - 1; c++) for (const [dc, dr] of [[1, 0], [0, 1], [-1, 0], [0, -1]]) {
    if (!open(c, r) || !open(c + dc * 5, r + dr * 5)) continue;
    let walls = 0, opens = 0; for (let k = 1; k < 5; k++) { if (wall(c + dc * k, r + dr * k)) walls++; else if (open(c + dc * k, r + dr * k)) opens++; }
    if (!wallSpot && walls >= 1) wallSpot = { c, r, dc, dr };
    if (!clearSpot && opens === 4) clearSpot = { c, r, dc, dr };
  }
  out.found = !!(wallSpot && clearSpot);
  if (!out.found) return out;
  const mk = (p) => { px = p.c; pz = p.r; yaw = Math.atan2(-p.dc, -p.dr); return { x: p.c + p.dc * 5, z: p.r + p.dr * 5, floor: currentFloor, hp: 10, mesh: new THREE.Group() }; };
  const hid = mk(wallSpot); ENEMIES = [hid]; out.throughWall = toggleLock() === false && LOCK.t === null;
  const seen = mk(clearSpot); ENEMIES = [seen]; out.downCorridor = toggleLock() === true && LOCK.t === seen;
  // locked, then the foe steps behind the wall (it is moved to the walled cell's far side)
  ENEMIES = [seen, hid];
  const back = { x: seen.x, z: seen.z }; seen.x = hid.x; seen.z = hid.z; px = wallSpot.c; pz = wallSpot.r;
  let t = 0; while (LOCK.t && t < 3) { tickLock(1 / 60); t += 1 / 60; }
  out.letGoAfter = +t.toFixed(2);
  // locked again, hidden for one second, then back in view: the lock holds
  seen.x = back.x; seen.z = back.z; px = clearSpot.c; pz = clearSpot.r; yaw = Math.atan2(-clearSpot.dc, -clearSpot.dr); toggleLock();
  seen.x = hid.x; seen.z = hid.z; px = wallSpot.c; pz = wallSpot.r; for (let i = 0; i < 60; i++) tickLock(1 / 60);
  out.heldAt1s = LOCK.t === seen;
  seen.x = back.x; seen.z = back.z; px = clearSpot.c; pz = clearSpot.r; for (let i = 0; i < 60; i++) tickLock(1 / 60);
  out.heldAfterReturn = LOCK.t === seen;
  seen.x = hid.x; seen.z = hid.z; px = wallSpot.c; pz = wallSpot.r; for (let i = 0; i < 60; i++) tickLock(1 / 60);
  out.hiddenAgainClockRestarted = LOCK.t === seen;
  lockRelease(); ENEMIES = keep;
  return out;
});
check('in a dungeon a foe on the far side of a wall cannot be locked', dun.found && dun.throughWall, dun);
check('one five cells down a clear corridor can', dun.found && dun.downCorridor, dun);
check('a locked foe that stays behind a wall is let go after 1.5 s', dun.letGoAfter >= 1.45 && dun.letGoAfter <= 1.7, dun);
check('hidden for 1 s the lock holds, and back in view it holds on', dun.heldAt1s && dun.heldAfterReturn, dun);
check('the hidden clock starts again each time the foe is out of sight', dun.hiddenAgainClockRestarted, dun);

stop();
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
