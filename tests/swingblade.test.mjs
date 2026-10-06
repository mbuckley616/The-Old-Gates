// The swinging blade across the passage (Session 582, Michael's A on DECISION #170). A blade hung from the roof in the middle
// of a corridor cell and swung along the corridor, edge-on to you, its lowest point at 1.3; and every trap stood at c+.5, on its
// cell's corner, a blade in the line of a wall ("swinging axes scrape along the same wall"). Now each trap is at its cell's centre,
// and a crescent blade swings from wall to wall, its flat face up the corridor, the bottom of its arc at the waist, into a slot in
// each wall.
import { boot, check } from './lib/game.mjs';
import { enterDungeon } from './lib/dungeonshot.mjs';
import fs from 'fs';
const g = await boot(); const { page } = g;
await g.intoWorld();
fs.mkdirSync('tests/out', { recursive: true });
let found = null;
for (const seed of [11, 3, 7, 21, 42, 5, 13, 29, 777, 778]) {
  await enterDungeon(page, { theme: 'ruins', seed, interior: 'cave', size: 'medium' });
  found = await page.evaluate(() => D_TRAPS.filter(t => t.kind === 'blade').length);
  if (found) { found = seed; break; }
}
check('a dungeon with a swinging blade', !!found, found);
const r = await page.evaluate(() => {
  ENEMIES.forEach(e => { e.dead = true; if (e.mesh) e.mesh.visible = false; }); window._tick = tickDungeonTraps; window.tickDungeonTraps = () => {};
  const traps = D_TRAPS.map(t => ({ kind: t.kind, x: t.x, z: t.z, centre: Number.isInteger(t.x) && Number.isInteger(t.z) && dMap[t.z][t.x] === 1 }));
  const blades = D_TRAPS.filter(t => t.kind === 'blade').map(t => {
    const h = dMap[t.z][t.x - 1] === 1 && dMap[t.z][t.x + 1] === 1, along = h ? [1, 0] : [0, 1], across = h ? [0, 1] : [1, 0];
    const walls = dSolid(t.x + across[0] * .6, t.z + across[1] * .6) && dSolid(t.x - across[0] * .6, t.z - across[1] * .6) && !dSolid(t.x + along[0] * .6, t.z + along[1] * .6);
    const box = new THREE.Box3(), V = new THREE.Vector3();
    const at = a => { t.pivot.rotation.z = a; t.pivot.updateMatrixWorld(true); box.setFromObject(t.blade); box.getCenter(V);
      return { lowY: +box.min.y.toFixed(2), cAcross: +((V.x - t.x) * across[0] + (V.z - t.z) * across[1]).toFixed(2), cAlong: +((V.x - t.x) * along[0] + (V.z - t.z) * along[1]).toFixed(2),
        reachPos: +Math.max((box.max.x - t.x) * across[0] + (box.max.z - t.z) * across[1]).toFixed(2), reachNeg: +Math.min((box.min.x - t.x) * across[0] + (box.min.z - t.z) * across[1]).toFixed(2) }; };
    const mid = at(0), pos = at(.42), neg = at(-.42);
    // the blade's flat face: its local z (the extrusion's depth) in the world, against the corridor's direction
    const n = new THREE.Vector3(0, 0, 1).transformDirection(t.blade.matrixWorld), face = Math.abs(n.x * along[0] + n.z * along[1]);
    const slots = dScene.children.filter(o => o.isMesh && o.geometry.type === 'PlaneGeometry' && o.geometry.parameters.width === .12 && Math.abs(o.position.x - t.x) < .6 && Math.abs(o.position.z - t.z) < .6).length;
    t.pivot.rotation.z = 0; return { x: t.x, z: t.z, h, walls, mid, pos, neg, face: +face.toFixed(2), slots };
  });
  // a picture: from four cells down the corridor, the blade at the side of its swing
  const t = D_TRAPS.find(t => t.kind === 'blade'), b = blades[0], dx = b.h ? 1 : 0, dz = b.h ? 0 : 1; let dist = 4; while (dist > 1.5 && dSolid(t.x + dx * dist, t.z + dz * dist)) dist--;
  t.pivot.rotation.z = .3; px = t.x + dx * dist; pz = t.z + dz * dist; yaw = Math.atan2(dx, dz); pitch = .02;
  return { traps, blades, shotAt: dist };
});
await g.frames(3); await page.screenshot({ path: 'tests/out/swingblade.png' });
console.log(JSON.stringify(r));
const B = r.blades;
check('every trap stands at its cell\'s centre, on corridor floor (was c+.5, the cell\'s corner)', r.traps.length > 0 && r.traps.every(t => t.centre), r.traps);
check('each blade hangs between two walls with the corridor open along it', B.every(b => b.walls), B);
check('it swings across the passage: at the ends of its swing the blade is .5 or more to either side, and never more than .05 along', B.every(b => Math.min(b.pos.cAcross, b.neg.cAcross) < -.5 && Math.max(b.pos.cAcross, b.neg.cAcross) > .5 && Math.abs(b.pos.cAlong) < .05 && Math.abs(b.neg.cAlong) < .05), B);
check('its flat face looks up the corridor (the blade\'s face normal along it within 1°)', B.every(b => b.face > .9998), B);
check('the bottom of its arc is at the waist, .95 above the floor', B.every(b => Math.abs(b.mid.lowY - .95) < .03), B);
check('at the ends of its swing it passes into the walls on both sides', B.every(b => Math.max(b.pos.reachPos, b.neg.reachPos) > .55 && Math.min(b.pos.reachNeg, b.neg.reachNeg) < -.55), B);
check('a slot in each wall where it goes', B.every(b => b.slots === 2), B);
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
