// wayside (Session 2007, card F8, OG-124; Michael's A on #1292, "by the land, unmarked until found"): on the new look one cell in three
// of an island keeps a place by a road (waysideAt, 82), its kind drawn from the island's list by its own stream, and a kind the kit has
// not built yet keeps the cell empty. The first kind built is the Gatelands' overturned coach (PKIT.places.carriage, places.js's
// gatelandsCarriage). The suite finds the coaches, the same when asked again, stands by the nearest, and checks it: 20 to 24 m off its
// road and facing it, lying on the drawn ground, solid where the coach is and open beside it, its cost; then that the map has nothing of
// it until you come within 40 m, has it then with no travel to it.
import { boot, check } from './lib/game.mjs';
const g = await boot({ look: 'new' }); const { page } = g; await g.intoWorld();
await page.evaluate(() => REN.setSize(320, 180, false));
const k = await page.evaluate(() => { const G = [...CELLS.values()].filter(c => c.type !== 'sea' && !c.home), C = G.map(c => waysideAt(c)).filter(Boolean);
  const again = G.map(c => { const keep = c._wayside; c._wayside = undefined; const d = waysideAt(c); c._wayside = keep; return d; }).filter(Boolean);
  const same = again.length === C.length && again.every((d, i) => d.id === C[i].id && d.x === C[i].x && d.z === C[i].z && d.ry === C[i].ry);
  C.sort((a, b) => Math.hypot(a.x - px, a.z - pz) - Math.hypot(b.x - px, b.z - pz)); const n = C[0];
  return { cells: G.length, n: C.length, kinds: [...new Set(C.map(d => d.kind))], same, gl: C.every(d => nationOf(...d.cell.split(',').map(Number)).people === 'gatelander'), near: n && { id: n.id, x: n.x, z: n.z, ry: n.ry, off: n.off } }; });
console.log(JSON.stringify(k));
check(`${k.n} of ${k.cells} cells keep a place by a road, all of them the Gatelands' coach, the same when asked again`, k.n > 0 && k.n < k.cells / 3 && k.same && k.gl && k.kinds.join() === 'carriage', k);
await page.evaluate(D => { px = D.x - Math.sin(D.ry) * 60; pz = D.z - Math.cos(D.ry) * 60; }, k.near);
for (let n = 0; n < 8; n++) { await g.cells(); const ok = await page.evaluate(id => { const c = [...CELLS.values()].find(c => c._wayside && c._wayside.id === id); return !!(c && c._wayside.group && c._wayside.group.parent); }, k.near.id); if (ok) break; await page.waitForTimeout(1000); }
await g.spin('clear', 40);
const w = await page.evaluate(id => { const D = [...CELLS.values()].find(c => c._wayside && c._wayside.id === id)._wayside; if (!D.group || !D.group.parent) return { none: true };
  const co = Math.cos(D.ry), s = Math.sin(D.ry), W = (u, v) => [D.x + u * co + v * s, D.z - u * s + v * co];
  let bd = 1e9, bq = null; for (const sg of RSEG) { if (sg.road.def.via === 'quay' || sg.road.def.via === 'spur') continue; const vx = sg.bx - sg.ax, vz = sg.bz - sg.az, t = Math.max(0, Math.min(1, ((D.x - sg.ax) * vx + (D.z - sg.az) * vz) / (vx * vx + vz * vz || 1))), qx = sg.ax + vx * t - D.x, qz = sg.az + vz * t - D.z, d = Math.hypot(qx, qz); if (d < bd) { bd = d; bq = [qx, qz]; } }
  const b = new THREE.Box3().setFromObject(D.group.getObjectByName('paint')), gy = meshH(...W(0, -.3));
  const lie = Math.max(...D.lying.map(l => { const [x, z] = W(l.x, l.z); return Math.abs(D.y + l.y - meshH(x, z)); }));
  return { id, tris: D.tris, draws: D.draws, road: +bd.toFixed(2), fwd: bq ? +(-(bq[0] * s + bq[1] * co) / (bd || 1)).toFixed(2) : null, low: +(b.min.y - gy).toFixed(3), lie: +lie.toFixed(3),
    mid: solidAt(...W(0, -.8), D.y + .5), road1: solidAt(...W(0, -5), D.y + .5), behind: solidAt(...W(0, 4), D.y + .5), disc: discovered(D.id) }; }, k.near.id);
console.log(JSON.stringify(w));
check(`${w.id}: ${w.road} m off its road, facing it (${w.fwd}); the coach's panels ${w.low} m over the ground, what fell off it ${w.lie} m`, !w.none && w.road >= 19 && w.road <= 25 && w.fwd > .9 && w.low > -.05 && w.low < .15 && w.lie < .01, w);
check(`solid where the coach lies, open on the road's side and behind; ${w.tris} triangles in ${w.draws} draws`, !w.none && w.mid && !w.road1 && !w.behind && w.tris < 9000 && w.draws <= 13, w);
await page.evaluate(D => { px = D.x - Math.sin(D.ry) * 60; pz = D.z - Math.cos(D.ry) * 60; }, k.near); await g.spin('clear', 60);
const a = await page.evaluate(id => ({ disc: discovered(id), entry: mapEntries(getCell(...id.split('_').slice(1).map(Number))).some(e => e.id === id) }), k.near.id);
await page.evaluate(D => { px = D.x - Math.sin(D.ry) * 30; pz = D.z - Math.cos(D.ry) * 30; }, k.near); await g.spin('clear', 60);
const b = await page.evaluate(id => { const e = mapEntries(getCell(...id.split('_').slice(1).map(Number))).find(e => e.id === id); return { disc: discovered(id), entry: e && { name: e.name, kind: e.kind, noTravel: !!e.noTravel }, travel: !!arrivalFor(id) }; }, k.near.id);
console.log(JSON.stringify(a), JSON.stringify(b));
check(`unmarked at 60 m; found at 30 m, on the map as "${b.entry && b.entry.name}", with no travel to it`, !a.disc && !a.entry && b.disc && b.entry && b.entry.kind === 'wayside' && b.entry.noTravel && !b.travel, { a, b });
check('no page errors', g.errs.length === 0, g.errs.slice(0, 5));
await g.close();
