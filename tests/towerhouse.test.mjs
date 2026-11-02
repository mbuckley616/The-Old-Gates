// The Gatelands' ruined tower house (Session 1725, card F8; OG-121; places.js's gatelandsTowerHouse, Michael's A on #401): on the new
// look one generated Gatelands ruin in two (gatelandsRuinKind) is the kit's tower house (PKIT.places.towerhouse) on its level pad, the
// bawn's gate to the first road out. The suite counts the kinds, settles the nearest tower house and checks the walk (the yard, the gate and
// outside it, the tower's door, the hall, the hatch, over the breach), the walls (the tower's four, the bawn's three, the flanker, the table)
// solid, its cost, its far copy away from it, and no house on its pad (Session 1750). Session 1765: the cellar under the hatch, a place of
// its own (#1026 A): in at the hatch, the walk through the cellar and the souterrain to the pit's landing, out at the pit's mouth on the
// slope behind the bawn, and in again there onto the landing.
import { boot, check } from './lib/game.mjs';
const g = await boot({ look: 'new' }); const { page } = g; await g.intoWorld();
await page.evaluate(() => REN.setSize(320, 180, false));
const k = await page.evaluate(() => { anchoredPlaces(); const S = [...CELLS.values()].filter(c => c.type !== 'sea' && nationKeyOf(c.i, c.j) === 'gatelands').flatMap(c => c.sites);
  const R = S.filter(s => s.kind === 'ruin' && /^c\d+_\d+_s\d+$/.test(s.id)), T = R.filter(s => gatelandsRuinKind(s.id) === 'towerhouse');
  return { ruins: R.length, towers: T.length, id: (T.sort((a, b) => Math.hypot(a.x - px, a.z - pz) - Math.hypot(b.x - px, b.z - pz))[0] || {}).id }; });
console.log(JSON.stringify(k));
check(`of ${k.ruins} generated Gatelands ruins ${k.towers} are tower houses, the rest abbeys`, k.towers > 0 && k.towers < k.ruins, k);
const id = k.id;
check(`the nearest (${id}) stands`, !!id && await g.settle(id));
const r = await page.evaluate(id => { const S = WORLD.settle.get(id), A = S && S.towerHouse; if (!A) return { none: true, abbey: !!(S && S.abbey) };
  const t = S.site, c = Math.cos(A.ry), s = Math.sin(A.ry), W = (u, v) => [t.x + u * c + v * s, t.z - u * s + v * c], at = (u, v) => solidAt(...W(u, v)), T = A.tower, H = A.hall, B = A.bawn, hc = A.hatch;
  const open = { yard: at(-6, 4), gate: at(B.gate.x, B.z1 + B.t / 2), outside: at(B.gate.x, B.z1 + 3), door: at(T.door.x, T.z1 - T.t / 2), hall: at(-2.5, (H.z0 + H.z1) / 2 + .8),
    hatch: at((hc.x0 + hc.x1) / 2, (hc.z0 + hc.z1) / 2), breach: at(B.x1 + B.t / 2, (B.breach[0] + B.breach[1]) / 2) };
  const solid = { south: at(T.x0 + .8, T.z1 - T.t / 2), north: at(0, T.z0 + T.t / 2), west: at(T.x0 + T.t / 2, (T.z0 + T.z1) / 2), east: at(T.x1 - T.t / 2, T.z0 + 2),
    bawnN: at(0, B.z0 - B.t / 2), bawnW: at(B.x0 - B.t / 2, 0), bawnS: at(B.x1 - 3, B.z1 + B.t / 2), flanker: at(A.flanker.x, A.flanker.z), table: at(A.table.x, A.table.z) };
  const L = S.towerLod; L.hi.visible = true; L.lo.visible = false; const cp = CAM.position.clone(); CAM.position.set(t.x + 400, CAM.position.y, t.z); houseLod(); const farOn = L.lo.visible && !L.hi.visible; CAM.position.copy(cp); houseLod();
  return { tris: A.tris, draws: A.draws, top: A.top, open, solid, farOn, farTris: L.lo.geometry.attributes.position.count / 3, heaps: !!S.abbey };
}, id);
console.log(JSON.stringify(r));
check(`${id} is the tower house: ${r.tris} triangles in ${r.draws} draws, ${r.top} m to its head`, !r.none && r.tris < 30000 && r.draws <= 20 && r.top > 15, r);
check('open: the yard, the gate and outside it, the tower\'s door, the hall, the hatch, over the breach', !r.none && Object.values(r.open).every(v => !v), r);
check('solid: the tower\'s four walls, the bawn\'s north, west and south, the flanker, the table', !r.none && Object.values(r.solid).every(v => v), r);
check(`from 400 m its far copy (${r.farTris} triangles) stands in for it`, !r.none && r.farOn && r.farTris < 1000, r);
// S1750: a ruin is planned with no houses, but a town's floor of two homes over the shops laid two whole cottages on its pad, against the bawn
const h = await page.evaluate(id => { const S = WORLD.settle.get(id); return { houses: S.houses.length, lots: S.sol.filter(s => s.hid).map(s => s.hid) }; }, id);
check(`no house stands on ${id}'s pad (${h.houses} houses, ${h.lots.length} lots)`, h.houses === 0 && h.lots.length === 0, h);
// S1765: the cellar, its souterrain and its pit, entered at the hatch, walked, and left at the pit's mouth; then in at the mouth, onto the landing
const w = await page.evaluate(id => { const H = WORLD.settle.get(id).towerHouse, c = Math.cos(H.ry), s = Math.sin(H.ry), u = (H.hatch.x0 + H.hatch.x1) / 2, v = (H.hatch.z0 + H.hatch.z1) / 2;
  forceTime(13); px = H.pit.x; pz = H.pit.z; const pit = towerCellarPrompt(); px = H.cx + u * c + v * s; pz = H.cz - u * s + v * c; jumpY = activeTerrainH(px, pz); const hatch = towerCellarPrompt();
  if (hatch) interact(); return { pit, hatch, pitTris: H.pit.tris, pitDraws: H.pit.draws }; }, id);
check(`the hatch and the pit's mouth (${w.pitTris} triangles in ${w.pitDraws} draws) offer the way down`, /hatch/.test(w.hatch) && /pit/.test(w.pit) && w.pitTris < 3000, w);
const inside = () => page.waitForFunction(() => isInterior() && currentHouse && currentHouse.type === 'towercellar', null, { timeout: 30000 }).then(() => true, () => false);
check('down the hatch into the cellar', await inside());
await page.waitForTimeout(1200);
const c = await page.evaluate(() => { const T = currentHouse._towerCellar, Bd = T.bounds, sz = -5 - Bd.z0, ex = T.pit.x0 + .5 - Bd.x0; let x = px, z = pz, y = jumpY, blocked = 0, maxStep = 0;
  const step = (nx, nz) => { if (intSolidAt(nx, nz, .3, y)) { blocked++; return; } const ny = footholdY(nx, nz, y, 0); maxStep = Math.max(maxStep, ny - y); x = nx; z = nz; y = ny; };
  const clear = !intSolidAt(px, pz, .3, jumpY); while (z < sz - .02) step(x, Math.min(sz, z + .05)); while (x > ex + .02) step(Math.max(ex, x - .05), z);
  const r = { tris: T.tris, draws: T.draws, clear, blocked, maxStep: +maxStep.toFixed(2), y: +y.toFixed(2), sout: +headCeil(-10 - Bd.x0, sz, 0).toFixed(2), rock: intSolidAt(-10 - Bd.x0, -6.3 - Bd.z0, .3, 0) };
  px = x; pz = z; jumpY = y; r.prompt = hatchPrompt(); if (r.prompt) interact(); return r; });
check(`the cellar (${c.tris} triangles in ${c.draws} draws): arrived clear, walked to the pit's landing ${c.y} m up with no wall in the way and no step over 0.4 m, the souterrain's lintels at ${c.sout} m, its rock solid`,
  c.clear && c.blocked === 0 && c.maxStep <= .4 && c.y > 3 && c.sout > 2 && c.sout < 2.4 && c.rock && c.tris < 8000 && c.draws <= 16 && /pit/.test(c.prompt), c);
const outside = await page.waitForFunction(() => !isInterior(), null, { timeout: 30000 }).then(() => true, () => false); await page.waitForTimeout(1200);
const o = await page.evaluate(id => { const P = WORLD.settle.get(id).towerHouse.pit; return { d: +Math.hypot(px - P.out.x, pz - P.out.z).toFixed(2), dy: +(jumpY - activeTerrainH(px, pz)).toFixed(2), solid: solidAt(px, pz) }; }, id);
check(`out at the pit's mouth, on the ground (${o.d} m from the spot)`, outside && o.d < .5 && Math.abs(o.dy) < .3 && !o.solid, o);
await page.evaluate(id => { const P = WORLD.settle.get(id).towerHouse.pit; px = P.x; pz = P.z; interact(); }, id);
const back = await inside(); await page.waitForTimeout(1200);
const q = await page.evaluate(() => { const T = currentHouse._towerCellar; return { y: +jumpY.toFixed(2), want: +(T.pit.y - T.floor).toFixed(2), solid: intSolidAt(px, pz, .3, jumpY) }; });
check(`in at the pit, onto its landing (${q.y} m)`, back && Math.abs(q.y - q.want) < .1 && !q.solid, q);
await g.close();
