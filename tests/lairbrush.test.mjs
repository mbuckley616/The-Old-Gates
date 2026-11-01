// A lair cavern's dry brush (Session 1708; Loscadh's touch "fires dry brush", magic-build.md; Michael's A on DECISION #973: lairs and
// dens). lairBrush lays it from the cavern's seed: one cavern in three, a thicket across one bare corridor cell on floor one of a cavern
// with a floor two, closing off only a side part (9 cells or more, a third of the floor at most, no part of the well, no key). Three
// hundred caverns through the generator alone, then one built: the thicket is a wall across its passage until fireBrush, which burns it
// through in 3.5 s by the clock and leaves ash, and the way open.
import { boot, check } from './lib/game.mjs';
const g = await boot(); const { page } = g;
await g.intoWorld();
const gen = await page.evaluate(() => { const o = { n: 0, brush: 0, bad: [], same: true, seeds: [], noFloor2: 0 };
  for (const size of ['medium', 'large']) for (let k = 0; k < 150; k++) { const seed = 3001 + k * 131, G = makeDungeon(size, seed);
    const a = JSON.stringify(lairBrush(G, seed)), b = JSON.stringify(lairBrush(makeDungeon(size, seed), seed)); if (a !== b) o.same = false; o.n++;
    const t = G.things.find(q => q.kind === 'brush'); if (!t) continue; o.brush++; if (!G.map2) o.noFloor2++;
    if (o.seeds.length < 3 && size === 'medium') o.seeds.push(seed);
    const M = G.map, W = G.W, H = G.H, open = (c, y) => y >= 0 && c >= 0 && y < H && c < W && M[y][c] > 0;
    // walk from the entrance with the brush's cell shut: what is not reached is exactly what it says it closes
    const got = new Set([G.entC + G.entR * W]), q = [[G.entC, G.entR]];
    while (q.length) { const [c, y] = q.pop(); for (const [a2, b2] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const nc = c + a2, ny = y + b2, k2 = nc + ny * W;
      if (!open(nc, ny) || (nc === t.c && ny === t.r) || got.has(k2)) continue; got.add(k2); q.push([nc, ny]); } }
    let cut = 0, total = 0; for (let y = 0; y < H; y++) for (let c = 0; c < W; c++) if (open(c, y)) { total++; if (!got.has(c + y * W) && !(c === t.c && y === t.r)) cut++; }
    const keys = (G.keyLocations || []).some(k2 => t.behind.includes(k2.x + k2.y * W)), well = t.behind.some(k2 => M[(k2 - k2 % W) / W][k2 % W] === 3);
    if (M[t.r][t.c] !== 1 || t.floor !== 1 || cut !== t.behind.length || cut < 9 || cut > total / 3 || keys || well || !t.behind.includes(t.c + t.dc + (t.r + t.dr) * W)) o.bad.push([size, seed, cut, t.behind.length, total]); }
  return o; });
console.log(JSON.stringify(gen));
check(`three hundred caverns laid the same twice: brush in ${gen.brush} (about one in three)`, gen.same && gen.n === 300 && gen.brush > 60 && gen.brush < 140 && gen.noFloor2 === 0, gen);
check('every brush stands in a bare corridor cell on floor one, closing off a side part (9 cells to a third of the floor) with no part of the well and no key', gen.bad.length === 0, gen.bad.slice(0, 5));
const seed = gen.seeds[0];
await page.evaluate((seed) => { window._lairBoss = null; delete (worldState.masters || {})[seed];
  goToDungeon(Object.assign({}, PORTALS[0], { theme: 'deep', seed, size: 'medium', interior: 'cave', zone: 'world', tutorial: false, diff: 'hard', diffScale: DIFF_SCALE.hard, lair: { place: 'Testmoor', boss: 'Cave Bear' } })); }, seed);
for (let i = 0; i < 90; i++) { await page.waitForTimeout(400); if (await page.evaluate(() => activeZoneId === 'dungeon' && typeof dScene !== 'undefined' && scene === dScene && GATE_THINGS.some(q => q.kind === 'brush'))) break; }
await g.spin(null, 10);
const R = await page.evaluate(() => { const t = GATE_THINGS.find(q => q.kind === 'brush'); if (!t) return { none: true, things: GATE_THINGS.length };
  currentFloor = 1; let tris = 0, draws = 0; t.group.traverse(q => { if (q.isMesh && q.visible) { draws++; tris += q.geometry.index.count / 3; } });
  const T = window._lastGen.things.find(q => q.id === t.id), m = window._lairBoss;
  const ahead = [t.x - T.dc * 2.2, t.z - T.dr * 2.2];
  const o = { id: t.id, tris, draws, inScene: t.group.parent === dScene, wall: [dBlk(t.x, t.z), dBlk(t.x + T.dr * .9 + T.dc * .9, t.z + T.dc * .9 + T.dr * .9)], before: !dBlk(...ahead),
    found: gateThingNear('brush', ahead[0], ahead[1], 3) === t, master: m ? (m.floor || 1) : null };
  o.f1 = fireBrush(t); o.f2 = fireBrush(t); o.still = dBlk(t.x, t.z); window._B = t; return o; });
console.log(JSON.stringify(R));
check(`a lair's brush built: ${R.tris} triangles in ${R.draws} draw, in the scene`, !R.none && R.inScene && R.draws === 1 && R.tris > 2000 && R.tris < 4200, R);
check('it is a wall across its passage, open before it; the master is on floor two', R.wall && R.wall[0] && R.wall[1] && R.before && R.found && R.master === 2, R);
// the burn is read off performance.now(): set its start back rather than wait, so a slow runner cannot step past the middle
const mid = await page.evaluate(() => { const t = window._B; t.burnAt = performance.now() - 1700; gtBrushStep(t); return { burning: t.burning, fire: t.group.userData.fire.visible, light: +(t.light ? t.light.intensity : 0).toFixed(2), wall: dBlk(t.x, t.z), sunk: +t.group.userData.body.scale.y.toFixed(2) }; });
const end = await page.evaluate(() => { const t = window._B; t.burnAt = performance.now() - 3600; gtBrushStep(t); let tris = 0, draws = 0;
  t.group.traverse(q => { if (!q.isMesh) return; for (let p = q; p; p = p.parent) if (!p.visible) return; draws++; tris += q.geometry.index.count / 3; });
  return { burnt: t.burnt, open: !dBlk(t.x, t.z), light: !!t.light, tris, draws, gone: gateThingNear('brush', t.x, t.z, 5) == null, again: fireBrush(t) }; });
console.log(JSON.stringify({ mid, end }));
check('fireBrush once: still a wall while it burns, flames and a light midway, the thicket sinking', R.f1 && !R.f2 && R.still && mid.burning && mid.fire && mid.light > .5 && mid.wall && mid.sunk < 1, mid);
check(`after 3.5 s: ash (${end.tris} triangles, ${end.draws} draw), the light out, the way open, nothing left to fire`, end.burnt && end.open && !end.light && end.draws === 1 && end.gone && !end.again, end);
await g.close();
