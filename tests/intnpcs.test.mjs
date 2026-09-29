// Townsfolk indoors keep to the floor they stand on (Session 232). Guild members wander their hall, and each step was
// tested against the furniture and walls at the *player's* height: stand on a crate or climb upstairs and every low
// solid below you stopped counting for them, so they walked through tables, racks and walls.
import { boot, check } from './lib/game.mjs';
const g = await boot(); const { page } = g;
await g.intoWorld(); await g.settle('dunmore');

const id = await page.evaluate(() => { forceTime(13); const S = WORLD.settle.get('dunmore'); const h = S.houses.find(x => /guild/.test(x.type)); if (!h) return null;
  window._h = h; px = h.exitX; pz = h.exitZ; goToInterior(h); return h.id; });
check('Dunmore has a guild hall', !!id, id);
await page.waitForTimeout(4500); await g.hide();
const r = await page.evaluate(() => {
  // the test's own check, at floor height, independent of the game's intSolidAt
  const solidAtFloor = (x, z, R) => INT_SOL.some(s => !(s.y1 != null && s.y1 <= .62) && !(s.y0 != null && s.y0 >= 1.0) && x > s.x0 - R && x < s.x1 + R && z > s.z0 - R && z < s.z1 + R);
  const N = WORLD.intNpcs; const start = N.map(n => ({ x: n.g.position.x, z: n.g.position.z }));
  const run = (y) => { N.forEach((n, i) => { n.g.position.x = start[i].x; n.g.position.z = start[i].z; n.wt = 0; });
    jumpY = y; let inside = 0, frames = 0, moved = 0; const R0 = Math.random; let seed = 7; Math.random = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    try { for (let f = 0; f < 60 * 120; f++) { const before = N.map(n => n.g.position.x + n.g.position.z); WORLD.tickInterior(1 / 60, performance.now());
        N.forEach((n, i) => { frames++; if (n.g.position.x + n.g.position.z !== before[i]) moved++; if (solidAtFloor(n.g.position.x, n.g.position.z, .15)) inside++; }); } }
    finally { Math.random = R0; jumpY = 0; }
    return { inside, frames, moved }; };
  const top = Math.max(0, ...FOOTHOLDS.map(f => f.y || 0)); const ground = run(0), crate = run(1.0), upstairs = run(top);
  exitInterior();
  return { members: N.length, solids: INT_SOL.length, low: INT_SOL.filter(s => s.y1 != null && s.y1 < 3).length, holdTop: Math.max(0, ...FOOTHOLDS.map(f => f.y || 0)), ground, crate, upstairs };
});
console.log(JSON.stringify(r));
check('the hall has members to wander', r.members >= 2, r);
check('with you on the floor, no member is ever inside a solid', r.ground.inside === 0 && r.ground.moved > 1000, r.ground);
check('with you on a crate (1.0 up), still none', r.crate.inside === 0 && r.crate.moved > 1000, r.crate);
check('with you on the hall\'s highest foothold, still none', r.holdTop >= 1.5 && r.upstairs.inside === 0 && r.upstairs.moved > 1000, r.upstairs);
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
