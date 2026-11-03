// weaverdoor (Session 1782, backlog L5, OG-096; Michael's B on #1005, "one impossible element each, nothing lit"): on the new look one
// Gatelands cell in three keeps a Weaver door (weaverDoorAt, 82), the gate kit's arch at half its size alone in a pasture within sight of a
// road (PKIT.wonders.weaverDoor). The suite counts the doors, finds them the same when asked again, stands at the nearest, and checks its
// one wrong thing: the jambs a hand (0.14 m) clear of the highest drawn ground under them, short turf under them, the script dead. Its jambs
// are solid and its opening is not; it faces its road; its cost is in the budget. Session 1783: the carving too (roadCarvingAt, 82;
// PKIT.wonders.carving), a stele at a road's edge with its face to the road, its relief baked to a colour and a normal map on one quad.
import { boot, check } from './lib/game.mjs';
const g = await boot({ look: 'new' }); const { page } = g; await g.intoWorld();
await page.evaluate(() => REN.setSize(320, 180, false));
const k = await page.evaluate(() => { const G = [...CELLS.values()].filter(c => c.type !== 'sea' && !c.home && nationKeyOf(c.i, c.j) === 'gatelands'), C = G.map(c => weaverDoorAt(c)).filter(Boolean);
  const again = G.map(c => { const keep = c._wdoor; c._wdoor = undefined; const d = weaverDoorAt(c); c._wdoor = keep; return d; }).filter(Boolean);
  const same = again.length === C.length && again.every((d, i) => d.id === C[i].id && d.x === C[i].x && d.z === C[i].z && d.ry === C[i].ry);
  C.sort((a, b) => Math.hypot(a.x - px, a.z - pz) - Math.hypot(b.x - px, b.z - pz)); const n = C[0]; return { cells: G.length, doors: C.length, same, near: n && { id: n.id, x: n.x, z: n.z, ry: n.ry } }; });
console.log(JSON.stringify(k));
check(`${k.doors} of ${k.cells} Gatelands cells keep a Weaver door, the same when asked again`, k.doors > 0 && k.doors < k.cells && k.same, k);
await page.evaluate(D => { px = D.x + Math.sin(D.ry) * 14; pz = D.z + Math.cos(D.ry) * 14; }, k.near);
for (let n = 0; n < 8; n++) { await g.cells(); const ok = await page.evaluate(id => { const c = [...CELLS.values()].find(c => c._wdoor && c._wdoor.id === id); return !!(c && c._wdoor.group && c._wdoor.group.parent); }, k.near.id); if (ok) break; await page.waitForTimeout(1000); }
const w = await page.evaluate(id => { const c = [...CELLS.values()].find(c => c._wdoor && c._wdoor.id === id), D = c && c._wdoor; if (!D || !D.group || !D.group.parent) return { none: true };
  const co = Math.cos(D.ry), s = Math.sin(D.ry), W = (u, v) => [D.x + u * co + v * s, D.z - u * s + v * co]; let hi = -1e9;
  for (const sx of [-1, 1]) for (let i = 0; i <= 8; i++) for (let j = 0; j <= 4; j++) hi = Math.max(hi, meshH(...W(sx * 3.05 - .55 + 1.1 * i / 8, -.6 + 1.2 * j / 4)));
  const arch = D.group.children[0], b = new THREE.Box3().setFromObject(arch), turf = D.group.getObjectByName('turf'); let under = 0;
  if (turf) { const P = turf.geometry.attributes.position; for (let i = 0; i < P.count; i += 3) if (Math.abs(Math.abs(P.getX(i)) - 3.05) < .55 && Math.abs(P.getZ(i)) < .6) under++; }
  const lit = []; arch.traverse(m => { if (m.isMesh && m.material.emissiveIntensity > 0 && m.material.emissive && m.material.emissive.getHex()) lit.push(m.userData.key); });
  let bd = 1e9, bq = null; for (const sg of RSEG) { const vx = sg.bx - sg.ax, vz = sg.bz - sg.az, t = Math.max(0, Math.min(1, ((D.x - sg.ax) * vx + (D.z - sg.az) * vz) / (vx * vx + vz * vz || 1))), qx = sg.ax + vx * t - D.x, qz = sg.az + vz * t - D.z, d = Math.hypot(qx, qz); if (d < bd) { bd = d; bq = [qx, qz]; } }
  const fwd = bq ? +Math.abs((bq[0] * s + bq[1] * co) / (bd || 1)).toFixed(2) : null;
  return { id, tris: D.tris, draws: D.draws, gap: +(b.min.y - hi).toFixed(3), size: [+(b.max.x - b.min.x).toFixed(2), +(b.max.y - b.min.y).toFixed(2)], under, lit, road: bq ? +bd.toFixed(1) : null, fwd,
    solid: { left: solidAt(...W(-3.05, 0)), right: solidAt(...W(3.05, 0)) }, open: { mid: solidAt(...W(0, 0)), before: solidAt(...W(0, 3)), behind: solidAt(...W(0, -3)) } }; }, k.near.id);
console.log(JSON.stringify(w));
check(`${w.id}: the arch at half size (${w.size}) stands ${w.gap} m clear of the highest ground under its jambs`, !w.none && Math.abs(w.gap - .14) < .015 && Math.abs(w.size[0] - 7.2) < .2 && Math.abs(w.size[1] - 10.1) < .3, w);
check(`the turf grows on under the jambs (${w.under} blades), and nothing on the door is lit`, !w.none && w.under > 300 && w.lit.length === 0, w);
check('its jambs solid, its opening walked through', !w.none && w.solid.left && w.solid.right && !Object.values(w.open).some(Boolean), w);
check(`its opening faces its road (${w.road} m off, ${w.fwd} of its face towards it)`, !w.none && w.road !== null && w.road > 12 && w.road < 120 && w.fwd > .5, w);
check(`${w.tris} triangles in ${w.draws} draws`, !w.none && w.tris < 14000 && w.draws <= 5, w);
const cv = await page.evaluate(() => { const G = [...CELLS.values()].filter(c => c.type !== 'sea' && !c.home && nationKeyOf(c.i, c.j) === 'gatelands'), C = G.map(c => roadCarvingAt(c)).filter(Boolean);
  C.sort((a, b) => Math.hypot(a.x - px, a.z - pz) - Math.hypot(b.x - px, b.z - pz)); const n = C[0]; return { cells: G.length, n: C.length, near: n && { id: n.id, x: n.x, z: n.z, ry: n.ry } }; });
check(`${cv.n} of ${cv.cells} Gatelands cells keep a carving by a road`, cv.n > 0 && cv.n < cv.cells, cv);
await page.evaluate(D => { px = D.x + Math.sin(D.ry) * 6; pz = D.z + Math.cos(D.ry) * 6; }, cv.near);
for (let n = 0; n < 8; n++) { await g.cells(); const ok = await page.evaluate(id => { const c = [...CELLS.values()].find(c => c._carving && c._carving.id === id); return !!(c && c._carving.group && c._carving.group.parent); }, cv.near.id); if (ok) break; await page.waitForTimeout(1000); }
const st = await page.evaluate(id => { const D = [...CELLS.values()].find(c => c._carving && c._carving.id === id)._carving; if (!D.group || !D.group.parent) return { none: true };
  const co = Math.cos(D.ry), s = Math.sin(D.ry), W = (u, v) => [D.x + u * co + v * s, D.z - u * s + v * co];
  let bd = 1e9, bq = null; for (const sg of RSEG) { if (sg.road.def.via === 'quay' || sg.road.def.via === 'spur') continue; const vx = sg.bx - sg.ax, vz = sg.bz - sg.az, t = Math.max(0, Math.min(1, ((D.x - sg.ax) * vx + (D.z - sg.az) * vz) / (vx * vx + vz * vz || 1))), qx = sg.ax + vx * t - D.x, qz = sg.az + vz * t - D.z, d = Math.hypot(qx, qz); if (d < bd) { bd = d; bq = [qx, qz]; } }
  const b = new THREE.Box3().setFromObject(D.group), f = D.group.getObjectByName('relief'), gy = meshH(D.x, D.z);
  return { id, tris: D.tris, draws: D.draws, road: +bd.toFixed(2), fwd: bq ? +((bq[0] * s + bq[1] * co) / (bd || 1)).toFixed(2) : null, top: +(b.max.y - gy).toFixed(2), sunk: +(gy - D.y).toFixed(2),
    maps: !!(f && f.material.map && f.material.normalMap), lit: !!(f && f.material.emissiveIntensity > 0 && f.material.emissive.getHex()), solid: solidAt(D.x, D.z), road1: solidAt(...W(0, 2.2)) }; }, cv.near.id);
console.log(JSON.stringify(st));
check(`${st.id}: ${st.road} m off the road's middle, its face to the road (${st.fwd}), ${st.top} m high over the ground, set ${st.sunk} m in`, !st.none && st.road > 3 && st.road < 5.5 && st.fwd > .9 && Math.abs(st.top - 2.0) < .25 && st.sunk >= .24, st);
check(`its relief a colour and a normal map, nothing lit; solid, the road before it open; ${st.tris} triangles in ${st.draws} draws`, !st.none && st.maps && !st.lit && st.solid && !st.road1 && st.tris < 400 && st.draws <= 2, st);
await g.close();
