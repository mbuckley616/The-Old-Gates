// The hall and the undercroft (Session 599; Michael's A on DECISION #177, the first of the three new fort shapes): a pillared
// great hall with a straight flight three cells wide down its middle to the undercroft. The generator's plan, then the fort
// in the game: walked down the flight and back up on the loop's own movement, the balustrade holding at the hole's sides and
// far end, floor 1's furniture not colliding on floor 2, and pictures.
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

// the plan, on every size and a run of seeds: both floors reachable, the flight the same cells on both, its foot opening north
const plan = await page.evaluate(() => { const out = [];
  for (const size of ['tiny', 'medium', 'large', 'massive']) for (let seed = 7099; seed < 7107; seed++) { const G = makeFortHall(size, seed), F = G.flight;
    const reach = (m, sc, sr) => { const seen = new Set([sr * G.W + sc]), q = [[sc, sr]]; while (q.length) { const [c, r] = q.shift(); for (const [dc, dr] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const nc = c + dc, nr = r + dr; if (nr < 0 || nc < 0 || nr >= G.H || nc >= G.W || !m[nr][nc] || seen.has(nr * G.W + nc)) continue; seen.add(nr * G.W + nc); q.push([nc, nr]); } } return seen; };
    const s1 = reach(G.map, G.entC, G.entR), s2 = reach(G.map2, F.c0, F.bot);
    const all1 = G.rooms.every(rm => s1.has(rm.cy * G.W + rm.cx)), all2 = G.rooms2.every(rm => s2.has(rm.cy * G.W + rm.cx));
    let same = true; for (let z = F.bot; z <= F.top; z++) for (let x = F.c0; x <= F.c1; x++) if (G.map[z][x] !== 3 || G.map2[z][x] !== 3) same = false;
    const slot = [F.c0 - 1, F.c1 + 1].every(x => { for (let z = F.bot; z <= F.top; z++) if (G.map2[z][x] !== 0) return false; return true; });
    const hall = G.rooms.find(r => r.kind === 'pillared_hall'), inHall = F.c0 > hall.x && F.c1 < hall.x + hall.w - 1 && F.bot > hall.y && F.top < hall.y + hall.h - 1;
    out.push({ size, seed, all1, all2, same, slot, foot: G.map2[F.bot - 1][F.c0 + 1] === 1, inHall, rooms: G.rooms.map(r => r.kind).join(','), rooms2: G.rooms2.length }); }
  return out; });
console.log(JSON.stringify(plan.filter(p => p.seed === 7100)));
check('every room on both floors is reachable (floor 1 from the door, floor 2 from the flight\'s foot), 32 plans', plan.every(p => p.all1 && p.all2), plan.filter(p => !p.all1 || !p.all2));
check('the flight is the same cells on both floors, in the hall, walled at its sides below, opening north into the undercroft', plan.every(p => p.same && p.inHall && p.slot && p.foot), plan.filter(p => !(p.same && p.inHall && p.slot && p.foot)));
check('the hall has a kitchen, storeroom, armoury and chapel off it', plan.every(p => ['pillared_hall', 'kitchen', 'storeroom', 'armory', 'chapel'].every(k => p.rooms.includes(k))), plan.map(p => p.rooms).slice(0, 2));
// which shape the seed gives the world's forts (S600: a third each of their own, the hall, the barracks, until the ring comes)
const picks = await page.evaluate(() => { const forts = WORLD_DUNGEONS.filter(p => (p.interior || '').startsWith('fort_') && p.size !== 'small'), n = {}; forts.forEach(p => { const k = fortShapeFor(p); n[k] = (n[k] || 0) + 1; }); return { n: forts.length, by: n, hall: n.fort_hall || 0 }; });
console.log('forts', JSON.stringify(picks));
check('some forts are halls and some are not', picks.n === 0 || (picks.hall > 0 && picks.hall < picks.n), picks);

// in the game
// its own id, as a world dungeon's (makePortalDef): PORTALS[0] is whichever door loaded first, and only a dyn_ id is read as a
// dungeon by the loop (S603: on CI it was not, so the flight was walked as open ground)
await page.evaluate(() => { const p = Object.assign({}, PORTALS[0], { id: 'dyn_7100', theme: 'ruins', seed: 7100, size: 'medium', interior: 'fort_hall', kind: 'fort_door', zone: 'world', tutorial: false }); goToDungeon(p); });
for (let k = 0; k < 25 && !(await page.evaluate(() => activeZoneId === 'dungeon' && scene === dScene && FOOTHOLDS.some(f => f.kind === 'flight'))); k++) await page.waitForTimeout(300);
await page.waitForTimeout(1200); await g.spin(30);
const built = await page.evaluate(() => { const f = FOOTHOLDS.find(f => f.kind === 'flight'), fl = dScene.children.find(o => o.userData && o.userData.dunShell === 'flight');
  const inHole = (x, z, m) => x > f.x0 - m && x < f.x1 + m && z > f.z0 - m && z < f.z1 + m;
  return { f, stairwell: DUNGEON_STAIRWELL, mesh: !!fl, tris: fl ? fl.geometry.index.count / 3 : 0, walls: !!dScene.children.find(o => o.userData && o.userData.dunShell === 'flightWalls'),
    cols: DUNGEON_COLUMNS.filter(c => inHole(c.x, c.z, .3)).length, props: DUNGEON_PROPS.filter(p => !p.flightRail && inHole((p.x0 + p.x1) / 2, (p.z0 + p.z1) / 2, .2)).length, colsAll: DUNGEON_COLUMNS.length,
    hiTable: DUNGEON_PROPS.find(p => p.floor === 1 && !p.flightRail && p.z1 < f.z0 - 3 && Math.abs((p.x0 + p.x1) / 2 - (f.x0 + f.x1) / 2) < .5) || null }; });
console.log(JSON.stringify(built));
check('the flight is built: one stair mesh, its walls, a ramp foothold, the stairwell on', built.mesh && built.walls && built.stairwell && built.f.y0 === -5 && built.f.y1 === 0, built);
check('no column and no furniture stands in the hole', built.cols === 0 && built.props === 0 && built.colsAll > 0, [built.cols, built.props, built.colsAll]);

const walk = await page.evaluate(() => { const f = FOOTHOLDS.find(f => f.kind === 'flight'), mx = (f.x0 + f.x1) / 2, K = window._K; ENEMIES.forEach(e => { e.dead = true; if (e.mesh) e.mesh.visible = false; });
  const go = (x, z, y, yw, ticks) => { px = x; pz = z; jumpY = y; velY = 0; onGround = true; currentFloor = y < -2 ? 2 : 1; let n = 0, lo = 9;
    try { K['KeyW'] = true; _drive(() => { PHP = maxHP; yaw = yw; lo = Math.min(lo, jumpY); return ++n > ticks; }, ticks + 1); } finally { K['KeyW'] = false; }
    _drive(() => false, 20); return { px: +px.toFixed(2), pz: +pz.toFixed(2), y: +jumpY.toFixed(2), lo: +lo.toFixed(2), floor: currentFloor }; };
  return { down: go(mx, f.z1 + 1.5, 0, 0, 260), up: go(mx, f.z0 - 1.5, FLOOR2_Y, Math.PI, 300),
    west: go(f.x0 - 1.2, (f.z0 + f.z1) / 2, 0, -Math.PI / 2, 150), east: go(f.x1 + 1.2, (f.z0 + f.z1) / 2, 0, Math.PI / 2, 150), north: go(mx, f.z0 - 1.5, 0, Math.PI, 150), f }; });
console.log(JSON.stringify(walk));
const F = walk.f;
check('walking down the flight from the hall lands in the undercroft, on floor 2', walk.down.y === -5 && walk.down.floor === 2 && walk.down.pz < F.z0, walk.down);
check('walking back up from the undercroft comes out on the hall\'s floor, floor 1', walk.up.y === 0 && walk.up.floor === 1 && walk.up.pz > F.z1, walk.up);
check('the balustrade holds at the hole\'s west and east sides and its far end (you stay on the hall\'s floor)', walk.west.lo === 0 && walk.west.px <= F.x0 - .15 && walk.east.lo === 0 && walk.east.px >= F.x1 + .15 && walk.north.lo === 0 && walk.north.pz <= F.z0 - .15, [walk.west, walk.east, walk.north]);
check('floor 1\'s high table does not collide on floor 2 below it', !!built.hiTable && await page.evaluate((p) => { const cf = currentFloor; currentFloor = 2; const hit = dPropHit((p.x0 + p.x1) / 2, (p.z0 + p.z1) / 2); currentFloor = 1; const hit1 = dPropHit((p.x0 + p.x1) / 2, (p.z0 + p.z1) / 2); currentFloor = cf; return !hit && hit1; }, built.hiTable), built.hiTable);

// pictures: the hall from near the door, the flight from its head, and the flight from the undercroft
for (const name of ['hall', 'down', 'below']) {
  await page.evaluate((name) => { ENEMIES.forEach(e => { if (e.mesh) e.mesh.visible = false; }); PHP = 1e6; if (typeof vmSword !== 'undefined' && vmSword) vmSword.visible = false; if (typeof vmArmR !== 'undefined' && vmArmR) vmArmR.visible = false;
    const f = FOOTHOLDS.find(f => f.kind === 'flight'), mx = (f.x0 + f.x1) / 2;
    const V = { hall: [mx + 1.2, f.z1 + 5.5, .12, -.2, 0], down: [mx, f.z1 + 1.0, 0, -.62, 0], below: [mx + 1.2, f.z0 - 5, Math.PI + .15, .2, FLOOR2_Y] }[name];
    px = V[0]; pz = V[1]; yaw = V[2]; pitch = V[3]; jumpY = V[4]; velY = 0; currentFloor = V[4] < -2 ? 2 : 1; }, name);
  await g.spin(3); await page.evaluate(() => { if (typeof vmSword !== 'undefined' && vmSword) vmSword.visible = false; if (typeof vmArmR !== 'undefined' && vmArmR) vmArmR.visible = false; }); await g.frames(3);
  await page.screenshot({ path: `${OUT}/forthall-${name}.png` });
}
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
