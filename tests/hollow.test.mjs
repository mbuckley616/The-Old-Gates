// hollow (Sessions 2473–2474; Michael's A on #1761, "a Mark gate's way in"): on the new look one of the Mark's lesser gates in each seed has
// the Hollow Below (PKIT.places.hollow, ruins.js's hollowBelow) for its outside: a mouth on a hillside under the fell (hollowSite, placeHollow),
// the cavern behind it a room of its own (buildKitHollow), and the slit door in its back plate the gate's only door. The suite finds the site,
// stands at the mouth (the outcrop solid, the throat open, no rocks of the gate's own anywhere), goes in, walks the passage, the viaduct, the
// court and the rings to the plate with no wall in the way, goes through the slit door into the gate, and comes up again before the mouth.
import { boot, check } from './lib/game.mjs';
const g = await boot({ look: 'new' }); const { page } = g; await g.intoWorld();
await page.evaluate(() => REN.setSize(320, 180, false));
const H = await page.evaluate(() => { const t0 = performance.now(), H = hollowSite(), ms = Math.round(performance.now() - t0), again = (HOLLOW_SITE = undefined, hollowSite());
  if (!H) return { none: true }; const [ci, cj] = H.cell.split(',').map(Number), e = doorAnywhere(H.seed), others = [...CELLS.values()].filter(c => c.doors.some(d => d.hollow)).length;
  return { ...H, ms, same: JSON.stringify(again) === JSON.stringify(H), mark: nationKeyOf(ci, cj), kind: e && e.kind, sigil: e && e.sigil, atMouth: e && Math.hypot(e.x - H.x, e.z - H.z) < .01, others, h: +rawH(H.x, H.z).toFixed(1) }; });
console.log(JSON.stringify(H));
check(`the Hollow's mouth in the Mark (${H.cell}), ${H.h} m up, on the gate ${H.gate} (${H.ms} ms), the same when asked again`, !H.none && H.mark === 'mark' && H.kind === 'cave_door' && !H.sigil && H.atMouth && H.others === 1 && H.h >= 12 && H.same, H);
await page.evaluate(H => WORLD.enter(H.x + Math.sin(H.ry) * 9, H.z + Math.cos(H.ry) * 9, 0, 'test'), H);
for (let n = 0; n < 8; n++) { await g.cells(); if (await page.evaluate(() => !!(hollowSite().house))) break; await page.waitForTimeout(1000); }
const w = await page.evaluate(() => { const C = hollowSite(); if (!C.house) return { none: true };
  const co = Math.cos(C.ry), s = Math.sin(C.ry), W = (u, v) => [C.x + u * co + v * s, C.z - u * s + v * co], at = (u, v) => solidAt(...W(u, v));
  const rocks = PORTALS.filter(p => p.seed === C.seed).length, door = dungeonWorldPos[C.seed], doorD = door ? +Math.hypot(door.x - C.out.x, door.z - 2.5 - C.out.z).toFixed(2) : null;
  [px, pz] = W(0, 5); jumpY = activeTerrainH(px, pz); const away = limeCavePrompt(); [px, pz] = W(0, -1); jumpY = activeTerrainH(px, pz); const inn = limeCavePrompt();
  const r = { tris: C.tris, draws: C.draws, away, inn, rocks, doorD, open: { before: at(0, 3), mouth: at(0, 1), throat: at(0, -1.2) }, solid: { left: at(-3.2, -1.5), right: at(3.2, -1.5), back: at(0, -4) } };
  if (inn) interact(); return r; });
console.log(JSON.stringify(w));
check(`the mouth (${w.tris} triangles in ${w.draws} draws) offers the way in only in its throat, and the gate has no door of its own`, !w.none && /into the cave/.test(w.inn) && !w.away && w.rocks === 0 && w.doorD < .05, w);
check('its throat open, the outcrop round it solid', !w.none && Object.values(w.open).every(v => !v) && Object.values(w.solid).every(v => v), w);
const inside = await page.waitForFunction(() => isInterior() && currentHouse && currentHouse.type === 'hollow', null, { timeout: 60000 }).then(() => true, () => false);
check('into the Hollow', inside);
await page.waitForTimeout(1500);
const c = await page.evaluate(() => { const T = currentHouse._hollow, Bd = T.bounds, FY = currentHouse._caveFY; let x = px, z = pz, y = jumpY, blocked = [], maxStep = 0;
  const step = (nx, nz) => { if (intSolidAt(nx, nz, .3, y)) { blocked.push([+(nx + Bd.x0).toFixed(1), +(nz + Bd.z0).toFixed(1), +(y + FY).toFixed(2)]); return false; } const ny = footholdY(nx, nz, y, 0); maxStep = Math.max(maxStep, ny - y); x = nx; z = nz; y = ny; return true; };
  const clear = !intSolidAt(px, pz, .3, jumpY), y0 = +(jumpY + FY).toFixed(2), before = limeCavePrompt();
  for (const [tx, tz] of T.path.slice(1)) { const X = tx - Bd.x0, Z = tz - Bd.z0; let n = 0; while (Math.hypot(X - x, Z - z) > .03 && n++ < 8000) { const d = Math.hypot(X - x, Z - z), s = Math.min(.05, d); if (!step(x + (X - x) / d * s, z + (Z - z) / d * s)) break; } }
  px = x; pz = z; jumpY = y; const door = limeCavePrompt();
  return { tris: T.tris, draws: T.draws, clear, y0, before, door, nb: blocked.length, blocked: blocked.slice(0, 3), maxStep: +maxStep.toFixed(2), end: [+(x + Bd.x0).toFixed(2), +(z + Bd.z0).toFixed(2)], goal: T.path.at(-1),
    deckSide: intSolidAt(5 - Bd.x0, 20 - Bd.z0, .3, -FY), lake: intSolidAt(40 - Bd.x0, 20 - Bd.z0, .3, -FY) }; });
console.log(JSON.stringify(c));
check(`the Hollow (${c.tris} triangles in ${c.draws} draws): arrived on the passage's floor, clear, the way out offered there`, c.clear && Math.abs(c.y0 + .68) < .1 && /go out of the cave/.test(c.before) && c.tris < 80000 && c.draws <= 14, c);
check(`walked the passage, the shelf, the viaduct, the court and the rings to the plate with no wall in the way (${c.nb} blocked)`, c.nb === 0 && c.maxStep <= .4 && Math.hypot(c.end[0] - c.goal[0], c.end[1] - c.goal[1]) < .1, c);
check('off the deck and over the lake are walls', c.deckSide && c.lake, c);
check(`the slit door offers the gate (${c.door})`, /go through the door/.test(c.door || ''), c);
await page.evaluate(() => interact());
const down = await page.waitForFunction(seed => activeZoneId === 'dungeon' && typeof currentPortal !== 'undefined' && currentPortal && currentPortal.seed === seed, H.seed, { timeout: 60000 }).then(() => true, () => false);
const t = await page.evaluate(() => ({ th: SS_THRESHOLD && { x: SS_THRESHOLD.x, z: SS_THRESHOLD.z }, out: hollowSite().out }));
check('through the slit door into its gate, the threshold saved before the mouth', down && t.th && Math.hypot(t.th.x - t.out.x, t.th.z - t.out.z) < .5, t);
await page.waitForTimeout(1500);
await page.evaluate(() => goToOW());
const up = await page.waitForFunction(() => activeZoneId === 'world' && lid === 'overworld', null, { timeout: 60000 }).then(() => true, () => false); await page.waitForTimeout(1500);
const o = await page.evaluate(() => { const C = hollowSite(); return { d: +Math.hypot(px - C.out.x, pz - C.out.z).toFixed(2), solid: solidAt(px, pz) }; });
check(`up again before the mouth (${o.d} m from it)`, up && o.d < .5 && !o.solid, o);
await g.close();
