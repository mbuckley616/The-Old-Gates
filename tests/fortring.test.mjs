// The ring and its towers (Session 601; Michael's A on DECISION #177, the last of the three new fort shapes, stairs down only):
// a passage round a sunken yard seen over a balustrade, two corner towers with a straight flight down each (one going north,
// one south), two guardrooms; below, each flight's foot leads to the yard. The plan, then the fort in the game: both flights
// walked down and up, the yard's balustrade holding, the yard reached from below and open to the ring's roof, pictures.
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
  for (const size of ['medium', 'large', 'massive']) for (let seed = 7099; seed < 7107; seed++) { const G = makeFortRing(size, seed), Y = G.yard;
    const reach = (m, sc, sr) => { const seen = new Set([sr * G.W + sc]), q = [[sc, sr]]; while (q.length) { const [c, r] = q.shift(); for (const [dc, dr] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const nc = c + dc, nr = r + dr; if (nr < 0 || nc < 0 || nr >= G.H || nc >= G.W || !m[nr][nc] || seen.has(nr * G.W + nc)) continue; seen.add(nr * G.W + nc); q.push([nc, nr]); } } return seen; };
    const s1 = reach(G.map, G.entC, G.entR), yard2 = reach(G.map2, Y.c0, Y.r0);
    const all1 = G.rooms.every(rm => s1.has(rm.cy * G.W + rm.cx)), all2 = G.rooms2.every(rm => yard2.has(rm.cy * G.W + rm.cx));
    const feet = G.flights.map(F => { const fz = F.dir === 'n' ? F.bot - 1 : F.bot + 1; return G.map2[fz][F.c0 + 1] === 1 && yard2.has(fz * G.W + F.c0 + 1); });
    let open = true; for (let z = Y.r0; z <= Y.r1; z++) for (let x = Y.c0; x <= Y.c1; x++) if (G.map[z][x] !== 3 || G.map2[z][x] !== 1) open = false;
    out.push({ size, seed, all1, all2, feet: feet.every(Boolean), open, flights: G.flights.map(F => F.dir).join(''), kinds: G.rooms.map(r => r.kind).join(',') }); }
  return out; });
console.log(JSON.stringify(plan.filter(p => p.seed === 7100)));
check('every room reachable on floor 1 from the door, and on floor 2 from the yard, 24 plans', plan.every(p => p.all1 && p.all2), plan.filter(p => !p.all1 || !p.all2));
check('two flights, one down northward and one southward, each with its foot joined to the yard below', plan.every(p => p.flights === 'ns' && p.feet), plan.filter(p => !(p.flights === 'ns' && p.feet)));
check('the yard is open on the ring\'s floor and floor on the floor below', plan.every(p => p.open), plan.filter(p => !p.open));
const picks = await page.evaluate(() => { const n = {}; WORLD_DUNGEONS.filter(p => (p.interior || '').startsWith('fort_') && p.size !== 'small').forEach(p => { const k = fortShapeFor(p); n[k] = (n[k] || 0) + 1; }); return n; });
console.log('forts', JSON.stringify(picks));
check('the canonical forts are all new shapes, and every shape turns up', !Object.keys(picks).some(k => !['fort_hall', 'fort_barracks', 'fort_ring'].includes(k)) && Object.keys(picks).length === 3, picks);

// its own id, as a world dungeon's (makePortalDef): PORTALS[0] is whichever door loaded first, and only a dyn_ id is read as a
// dungeon by the loop (S603: on CI it was not, so the flight was walked as open ground)
await page.evaluate(() => { const p = Object.assign({}, PORTALS[0], { id: 'dyn_7104', theme: 'ruins', seed: 7104, size: 'medium', interior: 'fort_ring', kind: 'fort_door', zone: 'world', tutorial: false }); goToDungeon(p); });
for (let k = 0; k < 25 && !(await page.evaluate(() => activeZoneId === 'dungeon' && scene === dScene && FOOTHOLDS.filter(f => f.kind === 'flight').length === 2)); k++) await page.waitForTimeout(300);
await page.waitForTimeout(1200); await g.spin(30);
const built = await page.evaluate(() => { const G = window._lastGen, Y = G.yard, fl = FOOTHOLDS.filter(f => f.kind === 'flight');
  const tag = t => dScene.children.filter(o => o.userData && o.userData.dunShell === t).length;
  const near = (x, z) => fl.some(f => x > f.x0 - 1.2 && x < f.x1 + 1.2 && z > f.z0 - 1.2 && z < f.z1 + 1.2) || (x > Y.c0 - 1.7 && x < Y.c1 + 1.7 && z > Y.r0 - 1.7 && z < Y.r1 + 1.7);
  const ceil = dScene.children.find(o => o.userData && o.userData.dunShell === 'ceiling' && o.geometry.boundingBox == null ? (o.geometry.computeBoundingBox(), true) : true);
  let yardCeil = 0; dScene.children.forEach(o => { if (!o.userData || o.userData.dunShell !== 'ceiling') return; const p = o.geometry.attributes.position; for (let i = 0; i < p.count; i++) { const x = p.getX(i), y = p.getY(i), z = p.getZ(i); if (y < 0 && x > Y.c0 && x < Y.c1 && z > Y.r0 && z < Y.r1) yardCeil++; } });
  return { flights: fl.map(f => ({ x0: f.x0, x1: f.x1, z0: f.z0, z1: f.z1, y0: f.y0, y1: f.y1, dir: f.dir })), meshes: tag('flight'), rail: tag('yardRail'), walls: tag('yardWalls'), yardCeil,
    cols: DUNGEON_COLUMNS.filter(c => near(c.x, c.z)).length, colsAll: DUNGEON_COLUMNS.length, yard: Y }; });
console.log(JSON.stringify(built));
check('two flights built, the yard\'s balustrade and walls, and no ceiling over the yard below', built.meshes === 2 && built.rail === 1 && built.walls === 1 && built.yardCeil === 0, built);
check('no column on or beside a flight or the yard\'s rim', built.cols === 0, [built.cols, built.colsAll]);

const walk = await page.evaluate(() => { const fl = FOOTHOLDS.filter(f => f.kind === 'flight'), Y = window._lastGen.yard, K = window._K; ENEMIES.forEach(e => { e.dead = true; if (e.mesh) e.mesh.visible = false; });
  const go = (x, z, y, yw, ticks) => { px = x; pz = z; jumpY = y; velY = 0; onGround = true; currentFloor = y < -2 ? 2 : 1; let n = 0, lo = 9;
    try { K['KeyW'] = true; _drive(() => { PHP = maxHP; yaw = yw; lo = Math.min(lo, jumpY); return ++n > ticks; }, ticks + 1); } finally { K['KeyW'] = false; }
    _drive(() => false, 20); return { px: +px.toFixed(2), pz: +pz.toFixed(2), y: +jumpY.toFixed(2), lo: +lo.toFixed(2), floor: currentFloor }; };
  const out = {};
  fl.forEach((f, i) => { const mx = (f.x0 + f.x1) / 2, n = f.dir === 'n';
    out['down' + i] = go(mx, n ? f.z1 + .7 : f.z0 - .7, 0, n ? 0 : Math.PI, 170);
    out['up' + i] = go(mx, n ? f.z0 - .7 : f.z1 + .7, FLOOR2_Y, n ? Math.PI : 0, 170); });
  const ymx = (Y.c0 + Y.c1) / 2;
  out.rail = go(ymx, Y.r1 + 2.2, 0, 0, 150);
  out.yard = go(ymx, (Y.r0 + Y.r1) / 2, FLOOR2_Y, 0, 60);
  return { out, fl, Y }; });
console.log(JSON.stringify(walk.out));
const O = walk.out, FL = walk.fl, Y = walk.Y;
check('down each flight to floor 2 and back up to floor 1', [0, 1].every(i => O['down' + i].y === -5 && O['down' + i].floor === 2 && O['up' + i].y === 0 && O['up' + i].floor === 1), O);
check('the yard\'s balustrade holds on the ring (you stay at the ring\'s height)', O.rail.lo === 0 && O.rail.pz >= Y.r1 + .5, O.rail);
check('in the yard below, floor 1\'s rails do not stop you', O.yard.y === -5 && O.yard.pz < (Y.r0 + Y.r1) / 2 - 2, O.yard);

for (const name of ['ring', 'yard', 'tower']) {
  await page.evaluate((name) => { ENEMIES.forEach(e => { if (e.mesh) e.mesh.visible = false; }); PHP = 1e6;
    const Y = window._lastGen.yard, f = FOOTHOLDS.filter(f => f.kind === 'flight')[0], ymx = (Y.c0 + Y.c1) / 2;
    const V = { ring: [ymx + 2, Y.r1 + 2.2, .3, -.42, 0], yard: [ymx - 2, Y.r1 - 1, -.3, .45, FLOOR2_Y], tower: [(f.x0 + f.x1) / 2, f.z1 + .6, 0, -.55, 0] }[name];
    px = V[0]; pz = V[1]; yaw = V[2]; pitch = V[3]; jumpY = V[4]; velY = 0; currentFloor = V[4] < -2 ? 2 : 1; }, name);
  await g.spin(3); await page.evaluate(() => { if (typeof vmSword !== 'undefined' && vmSword) vmSword.visible = false; if (typeof vmArmR !== 'undefined' && vmArmR) vmArmR.visible = false; }); await g.frames(3);
  await page.screenshot({ path: `${OUT}/fortring-${name}.png` });
}
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
