// A defeated foe falls as a ragdoll (Session 419, Michael's C on #102): killZoneEnemy and killE hand a people-bodied foe to
// ragdollFoe, which puts a point at each of 21 joints and lets gravity, the blow and the ground take it; the bones follow.
// This kills Bandits in the open world with the real kill path, steps the people's tick at 1/60, and reads where the
// body lies: on the ground, fallen away from you, the bones their own lengths, settled and frozen, each death its own.
// A wolf keeps the old slump. Then a dungeon's people-bodied foe falls on its floor and stays out of its walls.
import { boot, check } from './lib/game.mjs';
const g = await boot(); const { page } = g;
await g.intoWorld(); await g.frames(30);

const world = await page.evaluate(() => {
  forceTime(11); const raf = window.requestAnimationFrame; window.requestAnimationFrame = () => 0;
  const V = () => new THREE.Vector3(), out = {};
  const kill = (dist, side, tag) => {
    const x = px + fwdX * dist - fwdZ * side, z = pz + fwdZ * dist + fwdX * side;
    const e = buildZoneEnemy(WORLD.scene, [], x, z, 'Bandit', null); e.locked = false; e.mesh.visible = true; if (!e.mesh.parent) WORLD.scene.add(e.mesh);
    e.mesh.position.set(x, activeTerrainH(x, z), z); e.mesh.updateMatrixWorld(true);
    const B = e.limbs.person.B, len = (a, b) => a.getWorldPosition(V()).distanceTo(b.getWorldPosition(V()));
    const L0 = [len(B.thL, B.knL), len(B.knR, B.anR), len(B.shL, B.elL), len(B.spine, B.neck)];
    e.hp = 0; killZoneEnemy(e, WORLD.scene, tag);
    const R = [...RAGDOLLS].find(r => r.rig === e.limbs.person);
    let t = 0, settled = -1; const now = performance.now();
    for (let i = 0; i < 300 && settled < 0; i++) { tickPeople(1 / 60, now + i * 16.7); t += 1 / 60; if (R && !RAGDOLLS.has(R)) settled = +t.toFixed(2); }
    e.mesh.updateMatrixWorld(true);
    const L1 = [len(B.thL, B.knL), len(B.knR, B.anR), len(B.shL, B.elL), len(B.spine, B.neck)];
    const at = b => b.getWorldPosition(V()), gy = b => { const p = at(b); return +(p.y - activeTerrainH(p.x, p.z)).toFixed(3); };
    const hips = at(B.hips), push = [x - px, z - pz], pl = Math.hypot(...push);
    const bones = Object.values(B).filter(b => b && b.isBone !== undefined && b.getWorldPosition);
    return { started: !!R, timedOut: R && R.t > 4, settled, rotZ: e.mesh.rotation.z, hipsUp: gy(B.hips), headUp: gy(B.head), neckUp: gy(B.neck),
      away: +(((hips.x - x) * push[0] + (hips.z - z) * push[1]) / pl).toFixed(3), spread: +Math.max(...bones.map(b => Math.hypot(at(b).x - x, at(b).z - z))).toFixed(2),
      lens: L1.map((l, i) => +(l / L0[i]).toFixed(3)), nan: bones.some(b => !isFinite(at(b).y)), hipsAt: [+(hips.x - x).toFixed(2), +(hips.z - z).toFixed(2)],
      dark: e.limbs.person.mesh.material.color.r, cull: e.limbs.person.mesh.frustumCulled };
  };
  out.jab = kill(3, 0, ''); out.power = kill(3, 2.5, ' (POWER)'); out.arrow = kill(5, -2.5, ' (ARROW)');
  // the cost: one fall stepped by itself
  { const x = px + fwdX * 3 + fwdZ * 5, z = pz + fwdZ * 3 - fwdX * 5, e = buildZoneEnemy(WORLD.scene, [], x, z, 'Bandit', null); e.locked = false; if (!e.mesh.parent) WORLD.scene.add(e.mesh);
    e.mesh.position.set(x, activeTerrainH(x, z), z); e.hp = 0; killZoneEnemy(e, WORLD.scene, ''); const R = [...RAGDOLLS].find(r => r.rig === e.limbs.person);
    const c0 = performance.now(); let n = 0; while (RAGDOLLS.has(R) && n < 60) { tickRagdolls(1 / 60); n++; } out.msPerStep = +((performance.now() - c0) / n).toFixed(3); }
  // a wolf has no person's body: the old slump
  { const k = Object.keys(WOLF_KINDS)[0], x = px + fwdX * 6, z = pz + fwdZ * 6, e = buildZoneEnemy(WORLD.scene, [], x, z, k, null); e.locked = false; if (!e.mesh.parent) WORLD.scene.add(e.mesh);
    const n0 = RAGDOLLS.size; e.hp = 0; killZoneEnemy(e, WORLD.scene, ''); out.wolf = { kind: k, rotZ: +e.mesh.rotation.z.toFixed(3), ragdolls: RAGDOLLS.size - n0 }; }
  window.requestAnimationFrame = raf; return out;
});
for (const k of ['jab', 'power', 'arrow']) console.log(k, JSON.stringify(world[k]));
console.log('ms a step', world.msPerStep, 'wolf', JSON.stringify(world.wolf));
for (const k of ['jab', 'power', 'arrow']) {
  const w = world[k];
  check(`${k}: the Bandit falls as a ragdoll, not the old 90° turn`, w.started && w.rotZ === 0, w);
  check(`${k}: it settles and is frozen within 2.5 s`, w.settled > 0 && w.settled <= 2.5 && !w.timedOut, w.settled);
  check(`${k}: it lies on the ground: hips, neck and head within .4 of it`, [w.hipsUp, w.neckUp, w.headUp].every(y => y > -.05 && y < .4), [w.hipsUp, w.neckUp, w.headUp]);
  check(`${k}: it falls away from you`, w.away > .2, w.away);
  check(`${k}: the bones keep their lengths (within 6%) and stay within 2.2 of where it stood`, w.lens.every(r => Math.abs(r - 1) < .06) && w.spread < 2.2 && !w.nan, w);
  check(`${k}: darkened as before; drawn wherever its limbs land`, w.dark < .5 && w.cull === false, w);
}
const d = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);
check('every death is its own: a power blow carries the body further than a jab', d(world.power.hipsAt, [0, 0]) > d(world.jab.hipsAt, [0, 0]), [world.power.hipsAt, world.jab.hipsAt]);
check('a fall costs under 15 ms a step for one body (about 1 ms here alone; a loaded runner is slower)', world.msPerStep < 15, world.msPerStep);
check('a wolf keeps the old slump', world.wolf.ragdolls === 0 && Math.abs(world.wolf.rotZ - Math.PI / 2) < .01, world.wolf);

// indoors (a guard killed in a room) the room's own solids stop the body, not the world's: a wall .5 behind the foe
const room = await page.evaluate(() => {
  const raf = window.requestAnimationFrame; window.requestAnimationFrame = () => 0; const isInt = window.isInterior, sol = INT_SOL;
  const x = px + fwdX * 2, z = pz + fwdZ * 2, wx = x + fwdX * .5, wz = z + fwdZ * .5, ax = Math.abs(fwdX) > Math.abs(fwdZ);
  // a slab across the push, from .5 behind the foe to 1.5 behind it
  const wall = { x0: x - 3, x1: x + 3, z0: z - 3, z1: z + 3 };
  if (ax) { const a = wx, b = wx + Math.sign(fwdX); wall.x0 = Math.min(a, b); wall.x1 = Math.max(a, b); } else { const a = wz, b = wz + Math.sign(fwdZ); wall.z0 = Math.min(a, b); wall.z1 = Math.max(a, b); }
  window.isInterior = () => true; INT_SOL = [wall];
  const e = buildZoneEnemy(WORLD.scene, [], x, z, 'Bandit', null); e.locked = false; if (!e.mesh.parent) WORLD.scene.add(e.mesh);
  e.hp = 0; killZoneEnemy(e, WORLD.scene, ' (POWER)'); const R = [...RAGDOLLS].find(r => r.rig === e.limbs.person);
  for (let i = 0; i < 300 && R && RAGDOLLS.has(R); i++) tickPeople(1 / 60, performance.now());
  const pts = R ? R.P.map(o => [o.p.x + R.O.x, o.p.y + R.O.y, o.p.z + R.O.z]) : [];
  const inWall = pts.filter(([X, , Z]) => X > wall.x0 && X < wall.x1 && Z > wall.z0 && Z < wall.z1).length;
  window.isInterior = isInt; INT_SOL = sol; WORLD.scene.remove(e.mesh); window.requestAnimationFrame = raf;
  return { started: !!R, inWall, lowest: +Math.min(...pts.map(p => p[1])).toFixed(3), reach: +Math.max(...pts.map(([X, , Z]) => ax ? (X - x) * Math.sign(fwdX) : (Z - z) * Math.sign(fwdZ))).toFixed(2) };
});
console.log('room', JSON.stringify(room));
check('indoors a power blow throws the body against the room\'s wall and no joint goes through it', room.started && room.inWall === 0 && room.reach < .5 && room.reach > .2, room);
check('indoors it lies on the room\'s floor (y 0)', room.lowest >= -.01 && room.lowest < .2, room);

// a dungeon: the floor is flat, the walls are cells
const stop = g.keepAlive();
await page.evaluate(() => { const e = WORLD.doorAnywhere(845); const p = makePortalDef(e); const wp = WORLD.dungeonPos[845]; if (wp) { p.x = wp.x; p.z = wp.z; } p.zone = 'world'; goToDungeon(p); });
await page.waitForTimeout(6000); await g.hide();
const dun = await page.evaluate(() => {
  const raf = window.requestAnimationFrame; window.requestAnimationFrame = () => 0;
  const kinds = [...new Set(ENEMIES.map(e => e.name + (e.limbs && e.limbs.person ? '*' : '')))];
  const e = ENEMIES.find(x => !x.dead && x.limbs && x.limbs.person && !x.limbs.person.g.wraith && x.floor !== 2);
  if (!e) { window.requestAnimationFrame = raf; return { found: false, kinds }; }
  // set it half a cell from a wall, you on the open side: a power blow throws it at the wall
  let spot = null; for (let r = 1; r < dR - 1 && !spot; r++) for (let c = 2; c < dC - 1 && !spot; c++) if (dSolid(c + 1, r) && !dSolid(c, r) && !dSolid(c - 1, r) && !dSolid(c - 2, r) && !dSolid(c, r - 1) && !dSolid(c, r + 1)) spot = [c, r];
  if (!spot) { window.requestAnimationFrame = raf; return { found: false, kinds, why: 'no spot by a wall' }; }
  e.x = spot[0]; e.z = spot[1]; px = e.x - 1.2; pz = e.z;
  e.hp = 0; killE(e, ' (POWER)'); const R = [...RAGDOLLS].find(r => r.rig === e.limbs.person);
  for (let i = 0; i < 300 && R && RAGDOLLS.has(R); i++) tickPeople(1 / 60, performance.now());
  const V = () => new THREE.Vector3(), B = e.limbs.person.B, pts = R ? R.P.map(o => [o.p.x + R.O.x, o.p.y + R.O.y, o.p.z + R.O.z]) : [];
  window.requestAnimationFrame = raf;
  return { found: true, name: e.name, spot, started: !!R, settled: R && !RAGDOLLS.has(R) && R.t <= 2.5, rotZ: e.mesh.rotation.z,
    hipsUp: +(B.hips.getWorldPosition(V()).y).toFixed(3), lowest: +Math.min(...pts.map(p => p[1])).toFixed(3),
    inWall: pts.filter(p => dSolid(p[0], p[2])).length, kinds };
});
stop();
console.log('dungeon', JSON.stringify(dun));
check('the dungeon has a people-bodied foe on its first floor', dun.found, dun.kinds);
if (dun.found) {
  check('killed, it falls as a ragdoll and settles within 2.5 s', dun.started && dun.settled && dun.rotZ === 0, dun);
  check('it lies on the floor (y 0), not under it', dun.lowest >= -.01 && dun.hipsUp < .4, dun);
  check('thrown at a wall half a cell away, no joint ends inside it', dun.inWall === 0, dun.inWall);
}
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
