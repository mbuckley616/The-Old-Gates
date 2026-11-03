// seacove (Session 1773, card F8; Michael's A on #1026, "through a mouth, into a place of its own"): on the new look one coastal Gatelands
// cell in two keeps a smugglers' sea cave (seaCove, 82), its mouth an outcrop of grey rock on the land behind the shore (PKIT.places.cavemouth,
// rock 'sea') and behind it places.js's smugglersLair (PKIT.places.cove, buildKitSeaCave), its arch on the sea. The suite counts the coves,
// stands at the nearest mouth (the outcrop solid, its throat open, the prompt), goes in, walks the prototype's path from the passage over
// the landing and down the deck to the T-head's far end with no wall in the way, climbs the stair onto the gallery, finds the sea a wall,
// and comes out at the mouth again.
import { boot, check } from './lib/game.mjs';
const g = await boot({ look: 'new' }); const { page } = g; await g.intoWorld();
await page.evaluate(() => REN.setSize(320, 180, false));
const k = await page.evaluate(() => { const G = [...CELLS.values()].filter(c => c.type !== 'sea' && !c.home && nationKeyOf(c.i, c.j) === 'gatelands'); const C = G.map(c => seaCove(c)).filter(Boolean);
  const bad = C.filter(C => { const dx = -Math.sin(C.ry), dz = -Math.cos(C.ry); return withPlace(C.x, C.z, () => rawH(C.x + dx * (C.sea + 20), C.z + dz * (C.sea + 20)) > -.5 || rawH(C.x + dx * 20, C.z + dz * 20) < 1.5); }).map(C => C.id);
  C.sort((a, b) => Math.hypot(a.x - px, a.z - pz) - Math.hypot(b.x - px, b.z - pz)); return { cells: G.length, coves: C.length, held: C.filter(c => c.held).length, bad, near: C[0] }; });
console.log(JSON.stringify(k));
check(`${k.coves} of ${k.cells} Gatelands cells keep a sea cave (${k.held} held), each with land over its passage and the sea past its arch`, k.coves > 0 && k.coves < k.cells && !k.bad.length, k);
const hd = await page.evaluate(() => { const T = PKIT.places.cove({ key: 'cove_held', held: true }), U = PKIT.places.cove({ key: 'cove_held', held: false }); return { tris: T.tris, draws: T.draws, ship: !!T.ship && !!T.group.getObjectByName('ship'), lamps: T.lamps.length, gone: !U.ship && !U.lamps.length && !U.group.getObjectByName('ship') }; });
check(`a held lair (${hd.tris} triangles in ${hd.draws} draws): the sloop at the jetty and ${hd.lamps} lanterns lit; abandoned, neither`, hd.ship && hd.lamps === 8 && hd.gone && hd.tris < 120000 && hd.draws <= 30, hd);
await page.evaluate(C => { px = C.x + Math.sin(C.ry) * 8; pz = C.z + Math.cos(C.ry) * 8; }, k.near);
for (let n = 0; n < 8; n++) { await g.cells(); const ok = await page.evaluate(id => { const c = [...CELLS.values()].find(c => c._cove && c._cove.id === id); return !!(c && c._cove.house); }, k.near.id); if (ok) break; await page.waitForTimeout(1000); }
const w = await page.evaluate(id => { const c = [...CELLS.values()].find(c => c._cove && c._cove.id === id), C = c && c._cove; if (!C || !C.house) return { none: true };
  const co = Math.cos(C.ry), s = Math.sin(C.ry), W = (u, v) => [C.x + u * co + v * s, C.z - u * s + v * co], at = (u, v) => solidAt(...W(u, v)), gy = (u, v) => +(worldH(...W(u, v)) - C.y).toFixed(2);
  [px, pz] = W(0, 5); jumpY = activeTerrainH(px, pz); const away = limeCavePrompt(); [px, pz] = W(0, -1); jumpY = activeTerrainH(px, pz); const inn = limeCavePrompt();
  const r = { id, held: C.held, tris: C.tris, draws: C.draws, away, inn, open: { before: at(0, 3), mouth: at(0, 1), throat: at(0, -1.2) }, solid: { left: at(-3.2, -1.5), right: at(3.2, -1.5), back: at(0, -4) },
    floor: { mouth: gy(0, 0), throat: gy(0, -3) } };
  if (inn) interact(); return r; }, k.near.id);
console.log(JSON.stringify(w));
check(`the mouth of ${w.id} (${w.tris} triangles in ${w.draws} draws) stands on its pad and offers the way in only in its throat`, !w.none && w.tris < 10000 && w.draws <= 6 && !w.away && /into the cave/.test(w.inn) && Math.abs(w.floor.mouth) < .1 && Math.abs(w.floor.throat) < .1, w);
check('its throat open, the outcrop round it solid', !w.none && Object.values(w.open).every(v => !v) && Object.values(w.solid).every(v => v), w);
const inside = () => page.waitForFunction(() => isInterior() && currentHouse && currentHouse.type === 'seacave', null, { timeout: 40000 }).then(() => true, () => false);
check('into the sea cave', await inside());
await page.waitForTimeout(1500);
const c = await page.evaluate(() => { const T = currentHouse._limeCave, Bd = T.bounds, FY = T.low - .25; let x = px, z = pz, y = jumpY, blocked = [], maxStep = 0;
  const step = (nx, nz) => { if (intSolidAt(nx, nz, .3, y)) { blocked.push([+(nx + Bd.x0).toFixed(1), +(nz + Bd.z0).toFixed(1), +(y + FY).toFixed(2)]); return false; } const ny = footholdY(nx, nz, y, 0); maxStep = Math.max(maxStep, ny - y); x = nx; z = nz; y = ny; return true; };
  const walk = pts => { for (const [tx, tz] of pts) { const X = tx - Bd.x0, Z = tz - Bd.z0; let n = 0; while (Math.hypot(X - x, Z - z) > .03 && n++ < 4000) { const d = Math.hypot(X - x, Z - z), s = Math.min(.05, d); if (!step(x + (X - x) / d * s, z + (Z - z) / d * s)) return; } } };
  const clear = !intSolidAt(px, pz, .3, jumpY), y0 = +(jumpY + FY).toFixed(2);
  walk(T.path.slice(1)); const end = [+(x + Bd.x0).toFixed(2), +(z + Bd.z0).toFixed(2), +(y + FY).toFixed(2)], nb = blocked.length, maxWalk = +maxStep.toFixed(2);
  const S = T.stair, sx = (S.x0 + S.x1) / 2; x = sx - Bd.x0; z = S.z0 - .4 - Bd.z0; y = T.deck - FY; walk([[sx, S.z1 + 1.2]]); const top = +(y + FY).toFixed(2);
  return { held: T.held, tris: T.tris, draws: T.draws, clear, y0, blocked: blocked.slice(0, 3), nb, stairBlocked: blocked.length - nb, maxStep: maxWalk, end, goal: T.path[T.path.length - 1], top, gallery: T.gallery.y,
    sea: intSolidAt(8 - Bd.x0, T.jetty.z - 12 - Bd.z0, .3, T.deck - FY), under: footholdY((T.gallery.x0((T.gallery.z0 + T.gallery.z1) / 2) + 1.5) - Bd.x0, (T.gallery.z0 + T.gallery.z1) / 2 - Bd.z0, T.deck - FY, 0) + FY }; });
console.log(JSON.stringify(c));
check(`the cave (${c.tris} triangles in ${c.draws} draws, ${c.held ? 'held' : 'abandoned'}): arrived on the passage's floor at ${c.y0} m, clear`, c.clear && Math.abs(c.y0 - 1.2) < .05 && c.tris < 120000 && c.draws <= 30, c);
check(`walked the passage, the landing and the deck to the T-head's far end with no wall in the way (${c.nb} blocked)`, c.nb === 0 && c.maxStep <= .05 && Math.hypot(c.end[0] - c.goal[0], c.end[1] - c.goal[1]) < .1, c);
check(`up the stair onto the gallery at ${c.top} m, and the deck under it still the deck`, c.stairBlocked === 0 && Math.abs(c.top - c.gallery) < .05 && Math.abs(c.under - 1.2) < .05, c);
check('the sea is a wall off the jetty', c.sea, c);
const back = await page.evaluate(() => { const T = currentHouse._limeCave, Bd = T.bounds; px = T.arrive[0] - Bd.x0; pz = T.arrive[2] - Bd.z0; jumpY = T.deck - (T.low - .25); const p = limeCavePrompt(); if (p) interact(); return p; });
const outside = await page.waitForFunction(() => !isInterior(), null, { timeout: 30000 }).then(() => true, () => false); await page.waitForTimeout(1500);
const o = await page.evaluate(id => { const C = [...CELLS.values()].find(c => c._cove && c._cove.id === id)._cove; return { d: +Math.hypot(px - C.out.x, pz - C.out.z).toFixed(2), dy: +(jumpY - activeTerrainH(px, pz)).toFixed(2), solid: solidAt(px, pz) }; }, k.near.id);
check(`out at the mouth, on the ground (${o.d} m from the spot)`, /out of the cave/.test(back) && outside && o.d < .5 && Math.abs(o.dy) < .3 && !o.solid, o);
await g.close();
