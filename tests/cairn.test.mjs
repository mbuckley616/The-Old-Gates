// The Gatelands' passage cairn (Session 1735, card F8; OG-121's "round cairns"; places.js's gatelandsCairn, Michael's 3 A on #305): on the
// new look a generated Gatelands stone ring (kind poi) keeps the kit's cairn (PKIT.places.cairn) at its middle, its door to the first road
// out. The suite settles the nearest and checks the walk (before the door, the door, the passage, the chamber, the back recess), the mound
// solid (its kerb all round, the facade either side of the door, the passage's walls, the entrance stone), its cost, and its far copy.
import { boot, check } from './lib/game.mjs';
const g = await boot({ look: 'new' }); const { page } = g; await g.intoWorld();
await page.evaluate(() => REN.setSize(320, 180, false));
const k = await page.evaluate(() => { anchoredPlaces(); const S = [...CELLS.values()].filter(c => c.type !== 'sea' && nationKeyOf(c.i, c.j) === 'gatelands').flatMap(c => c.sites);
  const P = S.filter(s => s.kind === 'poi' && /^c\d+_\d+_s\d+$/.test(s.id));
  return { rings: P.length, id: (P.sort((a, b) => Math.hypot(a.x - px, a.z - pz) - Math.hypot(b.x - px, b.z - pz))[0] || {}).id }; });
console.log(JSON.stringify(k));
check(`${k.rings} generated stone rings in the Gatelands`, k.rings > 0, k);
const id = k.id;
check(`the nearest (${id}) stands`, !!id && await g.settle(id));
const r = await page.evaluate(id => { const S = WORLD.settle.get(id), A = S && S.cairn; if (!A) return { none: true };
  const t = S.site, c = Math.cos(A.ry), s = Math.sin(A.ry), W = (u, v) => [t.x + u * c + v * s, t.z - u * s + v * c], at = (u, v) => solidAt(...W(u, v)), D = A.door, P = A.passage, C = A.chamber;
  const open = { before: at(3, A.entrance + 2.5), beside: at(2.6, A.entrance), door: at(0, D.z - .2), passage: at(0, (D.z + P.z0) / 2), chamber: at(0, 0), recess: at(0, C.back * .75), east: at(-C.back * .7, 0) };
  const solid = { back: at(0, -A.r + .3), west: at(-A.r + .3, 0), east: at(A.r - .3, 0), facadeE: at(3.5, D.z - .35), facadeW: at(-3.5, D.z - .35), wallE: at(P.w / 2 + .4, (D.z + P.z0) / 2), wallW: at(-P.w / 2 - .4, (D.z + P.z0) / 2), stone: at(0, A.entrance) };
  /* the drawn ground (meshH) under the passage and the chamber stays under the flags */
  const y0 = A.y0, pts = []; for (let v = D.z; v > C.back; v -= .5) for (const u of [-.8, 0, .8]) pts.push([u, v]); for (let u = -4.5; u <= 4.5; u += .5) for (const v of [-.8, 0, .8]) pts.push([u, v]);
  const over = Math.max(...pts.map(([u, v]) => meshH(...W(u, v)) - (y0 + C.y))), unders = +(-over).toFixed(2);
  const L = S.cairnLod; L.hi.visible = true; L.lo.visible = false; const cp = CAM.position.clone(); CAM.position.set(t.x + 400, CAM.position.y, t.z); houseLod(); const farOn = L.lo.visible && !L.hi.visible; CAM.position.copy(cp); houseLod();
  return { unders, tris: A.tris, draws: A.draws, top: A.top, kerb: A.kerb, open, solid, farOn, farTris: L.lo.geometry.attributes.position.count / 3 };
}, id);
console.log(JSON.stringify(r));
check(`${id} keeps the cairn: ${r.tris} triangles in ${r.draws} draws, ${r.top} m high, ${r.kerb} kerb stones`, !r.none && r.tris < 40000 && r.draws <= 8 && r.top > 7.5, r);
check('open: before the door and round the entrance stone, the door, the passage, the chamber, the back and side recesses', !r.none && Object.values(r.open).every(v => !v), r);
check('solid: the kerb at the back and both sides, the facade either side of the door, the passage\'s walls, the entrance stone', !r.none && Object.values(r.solid).every(v => v), r);
check(`the drawn ground lies under the flags of the passage and the chamber (by ${r.unders} m at the least)`, !r.none && r.unders > 0, r);
check(`from 400 m its far copy (${r.farTris} triangles) stands in for it`, !r.none && r.farOn && r.farTris < 1500, r);
// S1755: a chunk built before a cell stamped its pads placed herbs on them (a Shadowcap on the chamber's floor); none stands inside any loaded site's pad less 6 m
const hp = await page.evaluate(() => { const bad = []; for (const h of ZONES.world.herbs) { if (h.bed || !/^-?\d+,-?\d+:(herb|verge|hot):\d+$/.test(h.id)) continue; const st = stampAt(h.x, h.z);
  if (st && st.kind === 'site' && Math.hypot(h.x - st.x, h.z - st.z) < st.r - 6) bad.push(h.id + '@' + st.id); } return { n: ZONES.world.herbs.length, bad }; });
check(`no scatter herb grows inside a site's pad (${hp.n} herbs loaded)`, hp.n > 50 && hp.bad.length === 0, hp);
await g.close();
