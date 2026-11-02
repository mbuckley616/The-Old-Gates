// The Gatelands' ruined tower house (Session 1725, card F8; OG-121; places.js's gatelandsTowerHouse, Michael's A on #401): on the new
// look one generated Gatelands ruin in two (gatelandsRuinKind) is the kit's tower house (PKIT.places.towerhouse) on its level pad, the
// bawn's gate to the first road out. The suite counts the kinds, settles the nearest tower house and checks the walk (the yard, the gate and
// outside it, the tower's door, the hall, the hatch, over the breach), the walls (the tower's four, the bawn's three, the flanker, the table)
// solid, its cost, its far copy away from it, and no house on its pad (Session 1750).
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
await g.close();
