// The dungeon at true size (card F5, Session 1283; Michael's A on #421, docs/design/gate-interiors-build.md). An old gate's cell is
// 3 m under a 6 m ceiling, a fort's insides and a lair's cavern 2.5 m under 3.6, a dragon's lair 5.5; buildDungeon lays a dungeon
// out in cells and scales it whole (dunScaleWhole), so a corridor is one cell wide, a room 3 to 12 cells, and a door 1.2 m wide and
// 2.2 high in the middle of its cell, the wall closing the cell either side of it. Measured with the game's own solids (dSolid,
// dBlk) and the meshes it built, five sizes of gate and three of the other kinds.
import { boot, check } from './lib/game.mjs';
import { enterDungeon } from './lib/dungeonshot.mjs';
const g = await boot(); const { page } = g;
await g.intoWorld();
const KINDS = [
  { what: 'gate tiny', o: { size: 'tiny', seed: 31 }, cell: 3, ceil: 6 },
  { what: 'gate small', o: { size: 'small', seed: 4021 }, cell: 3, ceil: 6 },
  { what: 'gate medium', o: { size: 'medium', seed: 777 }, cell: 3, ceil: 6 },
  { what: 'gate large', o: { size: 'large', seed: 909 }, cell: 3, ceil: 6 },
  { what: 'gate massive', o: { size: 'massive', seed: 1212 }, cell: 3, ceil: 6 },
  { what: 'fort', o: { size: 'medium', seed: 4021, interior: 'fort_tee' }, cell: 2.5, ceil: 3.6 },
  { what: 'lair', o: { size: 'medium', seed: 5003, lair: { place: 'Test', boss: 'Troll King' } }, cell: 2.5, ceil: 3.6 },
  { what: 'dragon lair', o: { size: 'large', seed: 5004, lair: { place: 'Test', boss: 'Wyrm', dragon: true } }, cell: 2.5, ceil: 5.5 },
];
const R = [];
for (const K of KINDS) {
  // enterDungeon clears lair; a lair is entered here through goToDungeon with the same wait
  if (K.o.lair) {
    await page.evaluate(() => { window._prevDScene = typeof dScene !== 'undefined' ? dScene : null; });
    await page.evaluate((o) => { level = 4; if (worldState.masters) delete worldState.masters[o.seed]; const p = Object.assign({}, PORTALS[0], { theme: 'deep', zone: 'world', tutorial: false, interior: 'cave', lairDoor: true }, o); goToDungeon(p); }, K.o);
    for (let k = 0; k < 40 && !(await page.evaluate(() => activeZoneId === 'dungeon' && scene === dScene && dScene !== window._prevDScene)); k++) await page.waitForTimeout(500);
    await page.waitForTimeout(1500);
  } else await enterDungeon(page, Object.assign({ theme: 'ruins' }, K.o));
  R.push(Object.assign({ what: K.what, cellWant: K.cell, ceilWant: K.ceil }, await page.evaluate(() => {
    dScene.updateMatrixWorld(true); const map = dMap, open = (c, r) => r >= 0 && r < dR && c >= 0 && c < dC && map[r][c] > 0;
    // a corridor's width: from a cell with walls both sides across one axis, the free span through its centre for a point
    const span = (x, z, ax) => { let a = 0, b = 0; const st = .02; while (a < 8 && !dSolid(x - (ax ? 0 : a + st), z - (ax ? a + st : 0))) a += st; while (b < 8 && !dSolid(x + (ax ? 0 : b + st), z + (ax ? b + st : 0))) b += st; return a + b; };
    const widths = [];
    for (let r = 1; r < dR - 1 && widths.length < 12; r++) for (let c = 1; c < dC - 1 && widths.length < 12; c++) { if (map[r][c] !== 1 && map[r][c] !== 7) continue; /* 7: a fort's hallway */
      const ew = !open(c, r - 1) && !open(c, r + 1) && open(c - 1, r) && open(c + 1, r), ns = !open(c - 1, r) && !open(c + 1, r) && open(c, r - 1) && open(c, r + 1);
      if ((ew || ns) && !dColumnHit(dAt(c), dAt(r)) && !dPropHit(dAt(c), dAt(r))) widths.push(+span(dAt(c), dAt(r), ew ? 1 : 0).toFixed(2)); }
    const gen = window._lastGen || null, rooms = gen && gen.rooms ? gen.rooms.map(q => [q.w * DCELL, q.h * DCELL]) : [];
    const walls = dScene.children.find(o => o.userData && o.userData.dunShell === 'walls'), ceil = dScene.children.find(o => o.userData && o.userData.dunShell === 'ceiling');
    const wb = new THREE.Box3().setFromObject(walls), cb = ceil ? new THREE.Box3().setFromObject(ceil) : null;
    // the doors: the leaf's size, and the way through an open one for a body 0.3 round (its centre's free span along the door's line)
    const doors = DOORS.filter(d => d.floor === 1 && d.mesh).slice(0, 4).map(d => { const leaf = d.hinge.children.find(m => m.isMesh); const b = new THREE.Box3().setFromObject(leaf);
      // the body's corners stand 0.3 round its centre: the span is read 0.4 off the door's plane, where a corner is in the wall's line
      const P = (t, a) => d.isEW ? [d.x + a, d.z + t] : [d.x + t, d.z + a];
      const was = d.open; d.open = true; let lo = 0, hi = 0;
      while (lo < 3 && !dBlk(...P(-lo - .02, .4))) lo += .02; while (hi < 3 && !dBlk(...P(hi + .02, .4))) hi += .02;
      // and walked straight through the middle, open and shut: from 1 m before the plane to 1 m past it, by dSlide in steps of 5 cm
      const walk = () => { let [x, z] = P(0, -1); for (let i = 0; i < 40; i++) { const st = P(0, .05); [x, z] = dSlide(x, z, st[0] - d.x, st[1] - d.z); } return d.isEW ? x - d.x : z - d.z; };
      const through = walk(); d.open = false; const stopped = walk(); d.open = was;
      const shut = stopped < 0 && stopped > -.7, reach = shut;
      return { w: +Math.max(b.max.x - b.min.x, b.max.z - b.min.z).toFixed(2), h: +(b.max.y - b.min.y).toFixed(2), low: +(b.min.y - (d.floor === 2 ? FLOOR2_Y : 0)).toFixed(2), gap: +(lo + hi).toFixed(2), through: +through.toFixed(2), stopped: +stopped.toFixed(2), shut, reach }; });
    return { cell: DCELL, ceil: FLOOR_HEIGHT, f2: FLOOR2_Y, widths, rooms, wallTop: +(wb.max.y).toFixed(2), ceilY: cb ? +((cb.min.y + cb.max.y) / 2).toFixed(2) : null,
      doors, nDoors: DOORS.length, clear: !dBlk(px, pz), exitAt: +Math.hypot(px - dAt(dEntranceX), pz - dAt(dEntranceZ)).toFixed(2),
      foesIn: ENEMIES.filter(e => e.floor === 1 && !e.dead).every(e => !dSolid(e.x, e.z)), chestsIn: CHESTS.filter(c => (c.floor || 1) === 1).every(c => dCellOf(c.x) >= 0 && map[dCellOf(c.z)] && map[dCellOf(c.z)][dCellOf(c.x)] > 0) }; })));
}
for (const r of R) console.log(JSON.stringify(r));
const gates = R.filter(r => r.what.startsWith('gate'));
check('a gate\'s cell is 3 m, a fort\'s, a lair\'s and a dragon\'s lair\'s 2.5', R.every(r => r.cell === r.cellWant), R.map(r => [r.what, r.cell]));
check('the ceiling: a gate 6 m, a fort and a lair 3.6, a dragon\'s lair 5.5 (FLOOR_HEIGHT, the walls\' top and the ceiling\'s plane)', R.every(r => r.ceil === r.ceilWant && Math.abs(r.wallTop - r.ceilWant) < .1 && (r.ceilY == null || Math.abs(r.ceilY - r.ceilWant) < .15)), R.map(r => [r.what, r.ceil, r.wallTop, r.ceilY]));
check('floor two hangs under floor one by its ceiling and 1.8 of rock', R.every(r => Math.abs(r.f2 + r.ceil + 1.8) < 1e-6), R.map(r => [r.what, r.f2]));
const corr = R.filter(r => r.what !== 'fort'); /* a fort has halls of several cells, not corridors of one */
check('a corridor is one cell wide: 3 m in a gate, 2.5 in a lair (within 0.1; at least 3 measured each)', corr.every(r => r.widths.length >= 3 && r.widths.every(w => Math.abs(w - r.cellWant) < .1)), corr.map(r => [r.what, r.widths]));
check('a gate\'s rooms are 9 to 36 m across (3 to 12 cells)', gates.every(r => r.rooms.length && r.rooms.every(([w, h]) => w >= 9 - 1e-6 && h >= 9 - 1e-6 && w <= 36 + 1e-6 && h <= 36 + 1e-6)), gates.map(r => [r.what, r.rooms.length, r.rooms.slice(0, 4)]));
const doors = R.flatMap(r => r.doors.map(d => Object.assign({ what: r.what }, d)));
check(`a door is 1.2 m wide and 2.2 high, standing on the floor (${doors.length} measured)`, doors.length >= 6 && doors.every(d => Math.abs(d.w - 1.2) < .06 && Math.abs(d.h - 2.2) < .06 && Math.abs(d.low) < .06), doors);
check('open, it lets a body 0.3 round through its 1.2 and no wider (the centre\'s free span 0.6 ± 0.05, walked through it); shut, it stops you', doors.every(d => Math.abs(d.gap - .6) < .05 && d.through > .9 && d.shut), doors.map(d => [d.what, d.gap, d.through, d.stopped]));
check('shut, you come up within 0.7 of its plane to touch it (a touch is 1.6)', doors.every(d => d.reach), doors.map(d => [d.what, d.stopped]));
check('you start clear of every wall, 6 m (two cells) in from the way out', R.every(r => r.clear && Math.abs(r.exitAt - 2 * r.cellWant) < .01), R.map(r => [r.what, r.clear, r.exitAt]));
check('every foe on the first floor stands on open floor, and every chest in an open cell', R.every(r => r.foesIn && r.chestsIn), R.map(r => [r.what, r.foesIn, r.chestsIn]));
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
