// A lair cavern's hoard stands on open floor (Session 696, the critic's s482). It stood at the master's spot plus (1.2, .6),
// which was often inside a wall: at Carrigowen's Lair, floor 2, no chest showed and its prompt came only looking down at the
// bricks. `lairHoardSpot` now puts it on an open cell beside the master, a cell in a room (all eight neighbours open) first.
import { boot, check } from './lib/game.mjs';
const g = await boot(); const { page } = g;
await g.intoWorld();
const SEEDS = [4021, 4022, 4023, 4024, 4025, 4026, 4027, 4028, 4029, 4030];
const rows = [];
for (const seed of SEEDS) {
  // S714 — the cavern has its own dyn_ id: PORTALS[0] is whichever door loaded first, or none on a slow runner, and a portal with
  // no id leaves `lid` undefined, so the loop held you to the ground outside (jumpY eased from −5 to 0 on floor 2; CI, Sessions 710–713)
  await page.evaluate((seed) => { window._lairBoss = null; const p = Object.assign({}, PORTALS[0], { id: 'dyn_hoardspot_' + seed, theme: 'deep', seed, size: 'medium', interior: 'cave', zone: 'world', tutorial: false, lair: { place: 'Test', boss: 'Troll King' } }); goToDungeon(p); }, seed);
  for (let k = 0; k < 60; k++) { await page.waitForTimeout(400); if (await page.evaluate(() => activeZoneId === 'dungeon' && scene === dScene && !!window._lairBoss && CHESTS.some(c => /:hoard$/.test(c.id)))) break; }
  rows.push(await page.evaluate((seed) => { const e = window._lairBoss, h = CHESTS.find(c => /:hoard$/.test(c.id)); if (!e || !h) return { seed, none: true };
    const map = (e.floor === 2 && dMap2) ? dMap2 : dMap; const cell = (x, z) => { const c = Math.floor(x + .5), r = Math.floor(z + .5); return (r < 0 || r >= dR || c < 0 || c >= dC) ? 0 : map[r][c]; };
    const solid = v => v === 0 || v === 4 || v === 5; let ring = 0; for (let i = -1; i <= 1; i++) for (let j = -1; j <= 1; j++) if ((i || j) && !solid(cell(h.x + i, h.z + j))) ring++;
    return { seed, floor: e.floor || 1, hoardOpen: !solid(cell(h.x, h.z)), ring, d: +Math.hypot(h.x - e.x, h.z - e.z).toFixed(2), oldInWall: solid(cell(e.x + 1.2, e.z + .6)) }; }, seed));
  // stand level on the open cell beside it that faces it, the crosshair level: the chest answers
  const live = await page.evaluate(() => { const h = CHESTS.find(c => /:hoard$/.test(c.id)); if (!h) return null; const fl = h.floor || 1; currentFloor = fl; jumpY = fl === 2 ? FLOOR2_Y : 0;
    const map = (fl === 2 && dMap2) ? dMap2 : dMap; const free = (c, r) => r >= 0 && r < dR && c >= 0 && c < dC && map[r][c] !== 0 && map[r][c] !== 4 && map[r][c] !== 5;
    for (const [i, j] of [[0, 1], [1, 0], [0, -1], [-1, 0], [1, 1], [-1, 1], [1, -1], [-1, -1]]) { const c = Math.round(h.x) + i * 2, r = Math.round(h.z) + j * 2; if (!free(c, r) || !free(Math.round(h.x) + i, Math.round(h.z) + j)) continue;
      px = h.x + i * 1.5; pz = h.z + j * 1.5; yaw = Math.atan2(-(h.x - px), -(h.z - pz)); pitch = -.25; return { at: [i, j] }; }
    return { at: null }; });
  if (live && live.at) { const trail = []; for (let f = 0; f < 3; f++) { await g.frames(1); trail.push(await page.evaluate(() => [+jumpY.toFixed(2), +velY.toFixed(2), onGround, currentFloor, lid])); } rows[rows.length - 1].trail = trail; rows[rows.length - 1].looked = await page.evaluate(() => { const h = CHESTS.find(c => /:hoard$/.test(c.id)); const lk = lookingAt(h); return lk ? true : { cam: +Math.hypot(CAM.position.x - px, CAM.position.z - pz).toFixed(2), camY: +CAM.position.y.toFixed(2), jumpY: +jumpY.toFixed(2), d: +Math.hypot(h.x - px, h.z - pz).toFixed(2), mesh: !!h.mesh, dead, invOpen, lootOpen, luOpen, dlgOpen, tp: typeof TP !== 'undefined' && !!TP.on, floor: currentFloor, hf: h.floor || 1 }; }); }
}
console.log(JSON.stringify(rows));
const ok = rows.filter(r => !r.none);
check('ten lair caverns built, each with a master and a hoard', ok.length === SEEDS.length, rows);
check('every hoard stands on an open cell', ok.every(r => r.hoardOpen), ok);
check('every hoard stands within three cells of its master', ok.every(r => r.d <= 4.3), ok.map(r => r.d));
check('most hoards stand in a room (all eight cells round them open)', ok.filter(r => r.ring === 8).length >= 8, ok.map(r => r.ring));
const looked = ok.filter(r => r.looked !== undefined);
check('stood 1.5 off and looking at it, nearly level, the chest answers', looked.length >= 8 && looked.every(r => r.looked === true), looked.map(r => [r.seed, r.looked, r.looked === true ? null : r.trail]));
console.log('old spot inside a wall on', ok.filter(r => r.oldInWall).length, 'of', ok.length);
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
