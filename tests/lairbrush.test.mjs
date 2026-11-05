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
// S1711 (card F8): the cavern itself is living rock on the new look, no dressed courses and no timbers; its walls move further than a
// gate's or a fort's, but never more than 0.55 m into an open cell below 2 m, so you do not walk into rock you cannot see
const S = await page.evaluate(() => { const sh = {}; dScene.children.forEach(q => { const k = q.userData && q.userData.dunShell; if (k) (sh[k] = sh[k] || []).push(q); });
  const W = sh.walls || [], o = { walls: W.length, rock: W.length > 0 && W.every(q => q.userData.rock), beams: (sh.beams || []).length, tris: 0, inset: 0, look: window.OG_LOOK };
  for (const w of W) { const P = w.geometry.attributes.position; o.tris += w.geometry.index.count / 3; w.updateMatrixWorld(); const v = new THREE.Vector3();
    for (let i = 0; i < P.count; i++) { v.fromBufferAttribute(P, i).applyMatrix4(w.matrixWorld); const y = v.y - (Math.abs(v.y - FLOOR2_Y) < Math.abs(v.y) ? FLOOR2_Y : 0); if (y < 0 || y > 2) continue;
      const M = Math.abs(v.y - FLOOR2_Y) < Math.abs(v.y) && dMap2 ? dMap2 : dMap, c = dCellOf(v.x), r = dCellOf(v.z); if (!(M[r] && M[r][c] > 0)) continue;
      const fx = v.x / DCELL - c + .5, fz = v.z / DCELL - r + .5; let d = 9; /* how far into the open cell, from each side that meets rock */
      if (!(M[r][c - 1] > 0)) d = Math.min(d, fx); if (!(M[r][c + 1] > 0)) d = Math.min(d, 1 - fx); if (!(M[r - 1] && M[r - 1][c] > 0)) d = Math.min(d, fz); if (!(M[r + 1] && M[r + 1][c] > 0)) d = Math.min(d, 1 - fz);
      if (d < 9) o.inset = Math.max(o.inset, +(d * DCELL).toFixed(2)); } }
  return o; });
console.log(JSON.stringify(S));
check(`the cavern is living rock (${S.tris} wall triangles), no timbers, its rock at most ${S.inset} m into an open cell below 2 m`, S.look !== 'new' || (S.rock && S.beams === 0 && S.inset > .15 && S.inset <= .55), S);
const R = await page.evaluate(() => { const t = GATE_THINGS.find(q => q.kind === 'brush'); if (!t) return { none: true, things: GATE_THINGS.length };
  currentFloor = 1; let tris = 0, draws = 0; t.group.traverse(q => { if (q.isMesh && q.visible) { draws++; tris += q.geometry.index.count / 3; } });
  const T = window._lastGen.things.find(q => q.id === t.id), m = window._lairBoss;
  const ahead = [t.x - T.dc * 2.2, t.z - T.dr * 2.2];
  const o = { id: t.id, tris, draws, inScene: t.group.parent === dScene, wall: [dBlk(t.x, t.z), dBlk(t.x + T.dr * .9 + T.dc * .9, t.z + T.dc * .9 + T.dr * .9)], before: !dBlk(...ahead),
    found: gateThingNear('brush', ahead[0], ahead[1], 3) === t, master: m ? (m.floor || 1) : null };
  /* S1717: Loscadh's touch fires it (#973 A): from 4 m nothing, from 1.4 m turned away nothing, from 1.4 m facing it the brush catches */
  const T0 = { word: 'loscadh', tier: 1, sp: heldSpell('loscadh') }, at = (d, face) => { px = t.x - T.dc * d; pz = t.z - T.dr * d; yaw = face > 0 ? Math.atan2(-T.dc, -T.dr) : Math.atan2(T.dc, T.dr); };
  const sx = px, sz = pz, sy = yaw, sk = () => { const q = skillsReady().tine; return q ? q.lv * 1e6 + q.p : 0; }, use0 = sk();
  at(4, 1); o.far = touchLand(T0).thing || null; at(1.4, -1); o.away = touchLand(T0).thing || null; at(1.4, 1); o.touch = touchLand(T0); o.tine = sk() > use0;
  px = sx; pz = sz; yaw = sy;
  o.f1 = o.touch.thing === 'brush' && t.burning; o.f2 = fireBrush(t); o.still = dBlk(t.x, t.z); window._B = t; return o; });
console.log(JSON.stringify(R));
check(`a lair's brush built: ${R.tris} triangles in ${R.draws} draw, in the scene`, !R.none && R.inScene && R.draws === 1 && R.tris > 2000 && R.tris < 4200, R);
check('it is a wall across its passage, open before it; the master is on floor two', R.wall && R.wall[0] && R.wall[1] && R.before && R.found && R.master === 2, R);
check(`Loscadh touched fires it from 1.4 m facing it (${R.touch && R.touch.thing}), not from 4 m (${R.far}) nor turned away (${R.away}); one use of Tine (${R.tine})`, R.f1 && R.far === null && R.away === null && R.tine, R);
// the burn is read off performance.now(): set its start back rather than wait, so a slow runner cannot step past the middle
const mid = await page.evaluate(() => { const t = window._B; t.burnAt = performance.now() - 1700; gtBrushStep(t); return { burning: t.burning, fire: t.group.userData.fire.visible, light: +(t.light ? t.light.intensity : 0).toFixed(2), wall: dBlk(t.x, t.z), sunk: +t.group.userData.body.scale.y.toFixed(2) }; });
const end = await page.evaluate(() => { const t = window._B; t.burnAt = performance.now() - 3600; gtBrushStep(t); let tris = 0, draws = 0;
  t.group.traverse(q => { if (!q.isMesh) return; for (let p = q; p; p = p.parent) if (!p.visible) return; draws++; tris += q.geometry.index.count / 3; });
  return { burnt: t.burnt, open: !dBlk(t.x, t.z), light: !!t.light, tris, draws, gone: gateThingNear('brush', t.x, t.z, 5) == null, again: fireBrush(t) }; });
console.log(JSON.stringify({ mid, end }));
check('fireBrush once: still a wall while it burns, flames and a light midway, the thicket sinking', R.f1 && !R.f2 && R.still && mid.burning && mid.fire && mid.light > .5 && mid.wall && mid.sunk < 1, mid);
check(`after 3.5 s: ash (${end.tris} triangles, ${end.draws} draw), the light out, the way open, nothing left to fire`, end.burnt && end.open && !end.light && end.draws === 1 && end.gone && !end.again, end);
// S1896 — Caverglow (#1164 B): on each floor of every cavern, 4 to 8 patches on the wall along the shortest way from where you come in to
// the deepest place (floor one's well when there is a floor two), on a cell of that way or beside it, never far back from the one before (either side of one cell, two out on a short way) nor within 2 of the start,
// never in a locked door's or the treasure room's cell, laid the same twice. Built: one draw a patch, no light; within touch, E picks it
// (the prompt names it), the herb in the bag, the patch gone and kept gone by its id; eaten, Night Eye
const CG = await page.evaluate(() => { const o = { n: 0, per: [], bad: [], same: true, ids: true };
  for (const size of ['medium', 'large']) for (let k = 0; k < 150; k++) { const seed = 3001 + k * 131, G = makeDungeon(size, seed); lairBrush(G, seed);
    const a = JSON.stringify(lairCaverglow(G, seed).filter(t => t.kind === 'glow')), G2 = makeDungeon(size, seed); lairBrush(G2, seed);
    if (a !== JSON.stringify(lairCaverglow(G2, seed).filter(t => t.kind === 'glow'))) o.same = false; o.n++;
    const all = G.things.filter(t => t.kind === 'glow'); if (new Set(all.map(t => t.id)).size !== all.length) o.ids = false;
    for (const fl of [1, 2]) { const M = fl === 2 ? G.map2 : G.map; if (!M) continue; const L = all.filter(t => t.floor === fl); o.per.push(L.length);
      const W = G.W, H = G.H, s0 = fl === 1 ? [G.entC, G.entR] : [G.stairC, G.stairR], dist = new Map([[s0[0] + s0[1] * W, 0]]), q = [s0];
      const open = (c, y) => y >= 0 && c >= 0 && y < H && c < W && M[y][c] > 0 && ![5, 6, 8, 9].includes(M[y][c]);
      while (q.length) { const [c, y] = q.shift(), d = dist.get(c + y * W); for (const [a2, b2] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const nc = c + a2, ny = y + b2;
        if (open(nc, ny) && !dist.has(nc + ny * W)) { dist.set(nc + ny * W, d + 1); q.push([nc, ny]); } } }
      let last = -1; for (const t of L) { const d = dist.get(t.c + t.r * W), wc = t.c + t.dc, wr = t.r + t.dr;
        const rock = wr < 0 || wc < 0 || wr >= H || wc >= W || M[wr][wc] === 0;
        if (d == null || d < 2 || d < last - 4 || !rock || !open(t.c, t.r)) o.bad.push([size, seed, fl, t.id, d, last, rock]); last = d == null ? last : Math.max(last, d); } } }
  o.min = Math.min(...o.per); o.max = Math.max(...o.per); o.floors = o.per.length; return o; });
console.log(JSON.stringify(Object.assign({}, CG, { per: undefined })));
check(`Caverglow in three hundred caverns, laid the same twice: ${CG.min} to ${CG.max} patches on each of ${CG.floors} floors (${CG.per.filter(n => n < 4).length} under 4), each on a wall along the way in`,
  CG.same && CG.ids && CG.n === 300 && CG.min >= 4 && CG.max <= 8 && !CG.bad.length, CG.bad.slice(0, 5));
const PK = await page.evaluate(() => { const L = GATE_THINGS.filter(t => t.kind === 'glow'), o = { built: L.length, floor1: L.filter(t => t.floor === 1).length };
  let draws = 0, lights = 0; for (const t of L) t.group.traverse(q => { if (q.isMesh) draws++; if (q.isLight) lights++; }); o.draws = draws; o.lights = lights;
  o.inScene = L.every(t => t.group.parent === dScene);
  const t = L.find(q => q.floor === 1); currentFloor = 1; const T = window._lastGen.things.find(q => q.id === t.id); px = dAt(T.c); pz = dAt(T.r);
  o.near = caverglowNear() === t; o.reach = +Math.hypot(px - t.x, pz - t.z).toFixed(2);
  loop(performance.now()); o.prompt = document.getElementById('ipr').textContent;
  const had = BAG.filter(i => i.name === 'Caverglow').reduce((a, i) => a + (i.qty || 1), 0); interact();
  o.got = BAG.filter(i => i.name === 'Caverglow').reduce((a, i) => a + (i.qty || 1), 0) - had; o.saved = worldState.picked && worldState.picked[t.id] != null;
  o.gone = !t.group.parent && caverglowNear() !== t;
  gateThingsBuild(window._lastGen, null); o.rebuilt = GATE_THINGS.some(q => q.id === t.id); o.others = GATE_THINGS.filter(q => q.kind === 'glow').length;
  SPELL_FX.nighteye = 0; const i = BAG.findIndex(q => q.name === 'Caverglow'); useHerb(i); o.nightEye = +((SPELL_FX.nighteye - performance.now()) / 1000).toFixed(0);
  return o; });
console.log(JSON.stringify(PK));
check(`the cavern's ${PK.built} patches built (${PK.draws} draws, ${PK.lights} lights); at ${PK.reach} m, "${PK.prompt}"; E picks it (+${PK.got}), gone and not built again (${PK.others} left); eaten, Night Eye ${PK.nightEye} s`,
  PK.built >= 6 && PK.draws === PK.built && PK.lights === 0 && PK.inScene && PK.near && PK.prompt === "Press 'E' to pick the Caverglow" && PK.got === 1 && PK.saved && PK.gone
  && !PK.rebuilt && PK.others === PK.built - 1 && PK.nightEye >= 58 && PK.nightEye <= 60, PK);
await g.close();
