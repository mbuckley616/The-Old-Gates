// Barracks and the gaol (Session 600; Michael's A on DECISION #177, the second of the three new fort shapes): one long hall
// with bunk rooms off both sides and a straight flight at its north end down to a gaol of cells. The plan, then the fort in
// the game: the flight walked down and up, the balustrade, the hall's colonnade clear of the hole, the cells' grilles, pictures.
import { boot, check } from './lib/game.mjs';
const OUT = process.env.SHOT_DIR || 'docs/prototypes';
const g = await boot(); const { page } = g;
await g.intoWorld();
await page.evaluate(() => { window._drive = (step, max) => {
  const raf = window.requestAnimationFrame, rr = REN.render; window.requestAnimationFrame = () => 0; REN.render = () => {};
  let t = performance.now(), n = 0;
  try { for (; n < max; n++) { if (step()) break; t += 1000 / 60; loop(t); } }
  finally { window.requestAnimationFrame = raf; REN.render = rr; prevT = 0; }
  return n; }; });

const plan = await page.evaluate(() => { const out = [];
  for (const size of ['medium', 'large', 'massive']) for (let seed = 7099; seed < 7107; seed++) { const G = makeFortBarracks(size, seed), F = G.flight;
    const reach = (m, sc, sr) => { const seen = new Set([sr * G.W + sc]), q = [[sc, sr]]; while (q.length) { const [c, r] = q.shift(); for (const [dc, dr] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const nc = c + dc, nr = r + dr; if (nr < 0 || nc < 0 || nr >= G.H || nc >= G.W || !m[nr][nc] || seen.has(nr * G.W + nc)) continue; seen.add(nr * G.W + nc); q.push([nc, nr]); } } return seen; };
    const s1 = reach(G.map, G.entC, G.entR), s2 = reach(G.map2, F.c0, F.bot);
    const all1 = G.rooms.every(rm => s1.has(rm.cy * G.W + rm.cx)), all2 = G.rooms2.every(rm => s2.has(rm.cy * G.W + rm.cx));
    let same = true; for (let z = F.bot; z <= F.top; z++) for (let x = F.c0; x <= F.c1; x++) if (G.map[z][x] !== 3 || G.map2[z][x] !== 3) same = false;
    const slot = [F.c0 - 1, F.c1 + 1].every(x => { for (let z = F.bot; z <= F.top; z++) if (G.map2[z][x] !== 0) return false; return true; });
    const kinds = G.rooms.map(r => r.kind);
    out.push({ size, seed, all1, all2, same, slot, foot: G.map2[F.bot - 1][F.c0 + 1] === 1, bunks: kinds.filter(k => k === 'barracks').length, sides: kinds.length - 1, cells: G.rooms2.filter(r => r.kind === 'gaol_cell').length, grilles: G.gaolCells.length,
      walkways: [F.c0 - 1, F.c1 + 1].every(x => G.map[F.bot - 1][x] === 7 && G.map[F.top][x] === 7), small: makeFortBarracks('small', seed).rooms[0].kind }); }
  return out; });
console.log(JSON.stringify(plan.filter(p => p.seed === 7100)));
check('every room on both floors is reachable (floor 1 from the door, floor 2 from the flight\'s foot), 24 plans', plan.every(p => p.all1 && p.all2), plan.filter(p => !p.all1 || !p.all2));
check('the flight is the same cells on both floors, walled below, opening north into the gaol, with a walkway past it either side above', plan.every(p => p.same && p.slot && p.foot && p.walkways), plan.filter(p => !(p.same && p.slot && p.foot && p.walkways)));
check('six side rooms, at least three of them bunk rooms, and the captain\'s room', plan.every(p => p.sides === 6 && p.bunks >= 3), plan.map(p => [p.sides, p.bunks]));
check('four cells in the gaol, each with its grille', plan.every(p => p.cells === 4 && p.grilles === 4), plan.map(p => [p.cells, p.grilles]));
check('a small fort is a hall and undercroft instead', plan.every(p => p.small === 'pillared_hall'), plan.map(p => p.small));

// its own id, as a world dungeon's (makePortalDef): PORTALS[0] is whichever door loaded first, and only a dyn_ id is read as a
// dungeon by the loop (S603: on CI it was not, so the flight was walked as open ground)
await page.evaluate(() => { const p = Object.assign({}, PORTALS[0], { id: 'dyn_7101', theme: 'ruins', seed: 7101, size: 'medium', interior: 'fort_barracks', kind: 'fort_door', zone: 'world', tutorial: false }); goToDungeon(p); });
for (let k = 0; k < 25 && !(await page.evaluate(() => activeZoneId === 'dungeon' && scene === dScene && FOOTHOLDS.some(f => f.kind === 'flight'))); k++) await page.waitForTimeout(300);
await page.waitForTimeout(1200); await g.spin(30);
const built = await page.evaluate(() => { const f = FOOTHOLDS.find(f => f.kind === 'flight'), fl = dScene.children.find(o => o.userData && o.userData.dunShell === 'flight'), gr = dScene.children.find(o => o.userData && o.userData.dunShell === 'gaolGrilles');
  const inHole = (x, z, m) => x > f.x0 - m && x < f.x1 + m && z > f.z0 - m && z < f.z1 + m;
  return { f, mesh: !!fl, grilles: gr ? gr.geometry.index.count / 3 : 0, cols: DUNGEON_COLUMNS.filter(c => inHole(c.x, c.z, 1.2)).length, colsAll: DUNGEON_COLUMNS.length,
    props: DUNGEON_PROPS.filter(p => !p.flightRail && inHole((p.x0 + p.x1) / 2, (p.z0 + p.z1) / 2, .2)).length, bunkRooms: (window._lastGen ? window._lastGen.rooms : []).filter(r => r.kind === 'barracks').length }; });
console.log(JSON.stringify(built));
check('the flight and the gaol\'s grilles are built', built.mesh && built.grilles > 0, built);
check('the hall\'s colonnade keeps clear of the hole (no column within 1.2 of it), and no furniture stands in it', built.cols === 0 && built.colsAll > 0 && built.props === 0, [built.cols, built.colsAll, built.props]);

const walk = await page.evaluate(() => { const f = FOOTHOLDS.find(f => f.kind === 'flight'), mx = (f.x0 + f.x1) / 2, K = window._K; ENEMIES.forEach(e => { e.dead = true; if (e.mesh) e.mesh.visible = false; });
  const go = (x, z, y, yw, ticks) => { px = x; pz = z; jumpY = y; velY = 0; onGround = true; currentFloor = y < -2 ? 2 : 1; let n = 0, lo = 9;
    try { K['KeyW'] = true; _drive(() => { PHP = maxHP; yaw = yw; lo = Math.min(lo, jumpY); return ++n > ticks; }, ticks + 1); } finally { K['KeyW'] = false; }
    _drive(() => false, 20); return { px: +px.toFixed(2), pz: +pz.toFixed(2), y: +jumpY.toFixed(2), lo: +lo.toFixed(2), floor: currentFloor }; };
  return { down: go(mx, f.z1 + 1.5, 0, 0, 200), up: go(mx, f.z0 - 1.5, FLOOR2_Y, Math.PI, 300), west: go(f.x0 - 1.2, (f.z0 + f.z1) / 2, 0, -Math.PI / 2, 150),
    past: go(f.x0 - 1.0, f.z1 + 1.5, 0, 0, 200), f }; });
console.log(JSON.stringify(walk));
const F = walk.f;
check('down the flight from the hall into the gaol on floor 2, and back up onto the hall\'s floor', walk.down.y === -5 && walk.down.floor === 2 && walk.down.pz < F.z0 && walk.up.y === 0 && walk.up.floor === 1 && walk.up.pz > F.z1, [walk.down, walk.up]);
check('the balustrade holds at the hole\'s side, and the walkway beside it leads past on the hall\'s floor', walk.west.lo === 0 && walk.west.px <= F.x0 - .15 && walk.past.lo === 0 && walk.past.pz < F.z0 - .3, [walk.west, walk.past]);

for (const name of ['hall', 'down', 'gaol']) {
  await page.evaluate((name) => { ENEMIES.forEach(e => { if (e.mesh) e.mesh.visible = false; }); PHP = 1e6;
    const f = FOOTHOLDS.find(f => f.kind === 'flight'), mx = (f.x0 + f.x1) / 2;
    const V = { hall: [mx + .8, f.z1 + 5, .05, -.25, 0], down: [mx, f.z1 + 1.0, 0, -.62, 0], gaol: [mx + .6, f.z0 - 1.2, 0, -.05, FLOOR2_Y] }[name];
    px = V[0]; pz = V[1]; yaw = V[2]; pitch = V[3]; jumpY = V[4]; velY = 0; currentFloor = V[4] < -2 ? 2 : 1; }, name);
  await g.spin(3); await page.evaluate(() => { if (typeof vmSword !== 'undefined' && vmSword) vmSword.visible = false; if (typeof vmArmR !== 'undefined' && vmArmR) vmArmR.visible = false; }); await g.frames(3);
  await page.screenshot({ path: `${OUT}/fortbarracks-${name}.png` });
}
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
