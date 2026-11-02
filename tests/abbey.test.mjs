// The Gatelands' monastic ruin (Session 1715, card F8; OG-121; places.js's gatelandsAbbey, Michael's A on #345): on the new look a
// generated ruin in the Gatelands is the kit's abbey (PKIT.places.abbey) on its level pad, its gate to the first road out. The suite
// settles the nearest one and checks the walk (the green, the gate, the nave, the west door, the chancel arch and a cell open), the walls
// (the nave's, the gable beside its door, the tower, the cashel, a cell's) solid, its cost (under 30,000 triangles in 10 draws or fewer),
// its far copy away from it, and that a named ruin (Caer Uaigneach, the canon's plague village) keeps its own heaps.
import { boot, check } from './lib/game.mjs';
const g = await boot({ look: 'new' }); const { page } = g; await g.intoWorld();
await page.evaluate(() => REN.setSize(320, 180, false));
const id = await page.evaluate(() => { anchoredPlaces(); const S = [...CELLS.values()].filter(c => c.type !== 'sea' && nationKeyOf(c.i, c.j) === 'gatelands').flatMap(c => c.sites);
  return (S.filter(s => s.kind === 'ruin' && /^c\d+_\d+_s\d+$/.test(s.id)).sort((a, b) => Math.hypot(a.x - px, a.z - pz) - Math.hypot(b.x - px, b.z - pz))[0] || {}).id; });
check(`a generated Gatelands ruin (${id}) stands`, !!id && await g.settle(id));
const r = await page.evaluate(id => { const S = WORLD.settle.get(id), A = S && S.abbey; if (!A) return { none: true };
  const t = S.site, c = Math.cos(A.ry), s = Math.sin(A.ry), W = (u, v) => [t.x + u * c + v * s, t.z - u * s + v * c], at = (u, v) => solidAt(...W(u, v)), ch = A.church;
  const C = A.cells.find(q => q.whole), cc = Math.cos(C.ry), sn = Math.sin(C.ry);
  const open = { green: at(0, 0), gate: at(0, 30), outside: at(0, 36), nave: at(-4, ch.z), door: at(ch.door.x, ch.z), arch: at(ch.arch.x, ch.z), cell: at(C.x, C.z), cellDoor: at(C.x + 2.3 * sn, C.z + 2.3 * cc) };
  const solid = { nave: at(-4, ch.z - ch.nave.w / 2 - .45), gable: at(ch.door.x, ch.z + 2), tower: at(A.tower.x, A.tower.z), cashel: at(0, -30.1), cell: at(C.x - 2.5 * sn, C.z - 2.5 * cc) };
  const L = S.abbeyLod; L.hi.visible = true; L.lo.visible = false; const cp = CAM.position.clone(); CAM.position.set(t.x + 400, CAM.position.y, t.z); houseLod(); const farOn = L.lo.visible && !L.hi.visible; CAM.position.copy(cp); houseLod();
  return { tris: A.tris, draws: A.draws, top: A.top, open, solid, farOn, farTris: L.lo.geometry.attributes.position.count / 3 };
}, id);
console.log(JSON.stringify(r));
check(`${id} is the abbey: ${r.tris} triangles in ${r.draws} draws, the tower ${r.top} m`, !r.none && r.tris < 30000 && r.draws <= 10 && r.top > 30, r);
check('open: the green, the gate, outside it, the nave, the west door, the chancel arch, a cell and its door', !r.none && Object.values(r.open).every(v => !v), r);
check('solid: the nave\'s wall, the west gable beside its door, the round tower, the cashel, a cell\'s wall', !r.none && Object.values(r.solid).every(v => v), r);
check(`from 400 m its far copy (${r.farTris} triangles) stands in for it`, !r.none && r.farOn && r.farTris < 3000, r);
const named = await page.evaluate(() => { const t = SITE.caer_uaigneach; return t ? { kind: t.kind, gl: nationKeyOf(...cellOf(t.x, t.z)) === 'gatelands' } : null; });
if (named && named.kind === 'ruin' && await g.settle('caer_uaigneach')) {
  const k = await page.evaluate(() => !WORLD.settle.get('caer_uaigneach').abbey);
  check('Caer Uaigneach, a named ruin, keeps its own heaps (no abbey)', k, named);
}
await g.close();
