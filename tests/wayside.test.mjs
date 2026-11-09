// wayside (Session 2007, card F8, OG-124; Michael's A on #1292, "by the land, unmarked until found"): on the new look one cell in three
// of an island keeps a place by a road (waysideAt, 82), its kind drawn from the island's list by its own stream, and a kind the kit has
// not built yet keeps the cell empty. The first kind built is the Gatelands' overturned coach (PKIT.places.carriage, places.js's
// gatelandsCarriage). The suite finds the coaches, the same when asked again, stands by the nearest, and checks it: 20 to 24 m off its
// road and facing it, lying on the drawn ground, solid where the coach is and open beside it, its cost; then that the map has nothing of
// it until you come within 40 m, has it then with no travel to it. Session 2025 adds the Mark's hunters' camp (PKIT.places.hunters), Session 2029 the Gatelands'
// charcoal burners' camp (PKIT.places.charcoal), Session 2030 the locked cellar's fallen cottage (PKIT.places.cellar),
// Session 2033 the perched stone on its pavement (PKIT.places.erratic).
import { boot, check } from './lib/game.mjs';
const g = await boot({ look: 'new' }); const { page } = g; await g.intoWorld();
await page.evaluate(() => REN.setSize(320, 180, false));
const k = await page.evaluate(() => { const G = [...CELLS.values()].filter(c => c.type !== 'sea' && !c.home), C = G.map(c => waysideAt(c)).filter(Boolean);
  const again = G.map(c => { const keep = c._wayside; c._wayside = undefined; const d = waysideAt(c); c._wayside = keep; return d; }).filter(Boolean);
  const same = again.length === C.length && again.every((d, i) => d.id === C[i].id && d.x === C[i].x && d.z === C[i].z && d.ry === C[i].ry);
  C.sort((a, b) => Math.hypot(a.x - px, a.z - pz) - Math.hypot(b.x - px, b.z - pz)); const n = C[0];
  const ppl = d => nationOf(...d.cell.split(',').map(Number)).people, coaches = C.filter(d => d.kind === 'carriage'), camps = C.filter(d => d.kind === 'hunters'), burns = C.filter(d => d.kind === 'charcoal'), cots = C.filter(d => d.kind === 'cellar'), ers = C.filter(d => d.kind === 'erratic');
  return { cells: G.length, n: C.length, kinds: [...new Set(C.map(d => d.kind))].sort(), same, coaches: coaches.length, camps: camps.length, burns: burns.length, cots: cots.length, ers: ers.length, gl: [...coaches, ...burns, ...cots, ...ers].every(d => ppl(d) === 'gatelander'), mk: camps.every(d => ppl(d) === 'markman'),
    near: coaches[0] && { id: coaches[0].id, x: coaches[0].x, z: coaches[0].z, ry: coaches[0].ry, off: coaches[0].off }, camp: camps[0] && { id: camps[0].id, x: camps[0].x, z: camps[0].z, ry: camps[0].ry, off: camps[0].off }, burn: burns[0] && { id: burns[0].id, x: burns[0].x, z: burns[0].z, ry: burns[0].ry, off: burns[0].off }, cot: cots[0] && { id: cots[0].id, x: cots[0].x, z: cots[0].z, ry: cots[0].ry, off: cots[0].off }, er: ers[0] && { id: ers[0].id, x: ers[0].x, z: ers[0].z, ry: ers[0].ry, off: ers[0].off } }; });
console.log(JSON.stringify(k));
check(`${k.n} of ${k.cells} cells keep a place by a road (${k.coaches} of them the Gatelands' coach, ${k.camps} the Mark's hunters' camp, ${k.burns} the Gatelands' charcoal burners, ${k.cots} the fallen cottage, ${k.ers} the perched stone), the same when asked again`, k.n > 0 && k.n < k.cells / 3 && k.same && k.gl && k.mk && k.coaches > 0 && k.camps > 0 && k.burns > 0 && k.cots > 0 && k.ers > 0 && k.kinds.join() === 'carriage,cellar,charcoal,erratic,hunters', k);
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
// the hunters' camp (Session 2025, places.js's markHuntersCamp): stood off the nearest, then checked: 20 to 34 m off its road and facing it, its
// hearth, rack fire, tub and stump on the drawn ground, solid at the tent and the rack, open at the tent's door and on the path to the road, its cost
await page.evaluate(D => { px = D.x - Math.sin(D.ry) * 60; pz = D.z - Math.cos(D.ry) * 60; }, k.camp);
for (let n = 0; n < 8; n++) { await g.cells(); const ok = await page.evaluate(id => { const c = [...CELLS.values()].find(c => c._wayside && c._wayside.id === id); return !!(c && c._wayside.group && c._wayside.group.parent); }, k.camp.id); if (ok) break; await page.waitForTimeout(1000); }
await g.spin('clear', 40);
const h = await page.evaluate(id => { const D = [...CELLS.values()].find(c => c._wayside && c._wayside.id === id)._wayside; if (!D.group || !D.group.parent) return { none: true };
  const co = Math.cos(D.ry), s = Math.sin(D.ry), W = (u, v) => [D.x + u * co + v * s, D.z - u * s + v * co];
  let bd = 1e9, bq = null; for (const sg of RSEG) { if (sg.road.def.via === 'quay' || sg.road.def.via === 'spur') continue; const vx = sg.bx - sg.ax, vz = sg.bz - sg.az, t = Math.max(0, Math.min(1, ((D.x - sg.ax) * vx + (D.z - sg.az) * vz) / (vx * vx + vz * vz || 1))), qx = sg.ax + vx * t - D.x, qz = sg.az + vz * t - D.z, d = Math.hypot(qx, qz); if (d < bd) { bd = d; bq = [qx, qz]; } }
  const st = Math.max(...D.stands.map(l => { const [x, z] = W(l.x, l.z); return Math.abs(D.y + l.y - meshH(x, z)); }));
  return { id, tris: D.tris, draws: D.draws, road: +bd.toFixed(2), fwd: bq ? +(-(bq[0] * s + bq[1] * co) / (bd || 1)).toFixed(2) : null, stands: +st.toFixed(3), n: D.stands.length,
    tent: solidAt(...W(D.tent.x, D.tent.z), D.y + .5), rack: solidAt(...W(-4, 1.2), D.y + .5), door: solidAt(...W(3, -3.6), D.y + .5), path: solidAt(...W(2, -10), D.y + .5) }; }, k.camp.id);
console.log(JSON.stringify(h));
check(`${h.id}: the hunters' camp ${h.road} m off its road, facing it (${h.fwd}); ${h.n} things that stand on the ground within ${h.stands} m of it`, !h.none && h.road >= 19 && h.road <= 35 && h.fwd > .9 && h.stands < .06, h);
check(`solid at the tent and the rack, open at the tent's door and on the path to the road; ${h.tris} triangles in ${h.draws} draws`, !h.none && h.tent && h.rack && !h.door && !h.path && h.tris < 9000 && h.draws <= 12, h);
// the charcoal burners' camp (Session 2029, places.js's gatelandsCharcoalCamp): stood off it, then checked: 22 to 34 m off its road and facing it,
// its pitsteads, the heap, a sack, the cordwood, the hut and the fire on the drawn ground, solid at the stack, the hut and the cordwood, open
// before the hut's door, on the path to the road and between the stack and the hut; its cost
await page.evaluate(D => { px = D.x - Math.sin(D.ry) * 60; pz = D.z - Math.cos(D.ry) * 60; }, k.burn);
for (let n = 0; n < 8; n++) { await g.cells(); const ok = await page.evaluate(id => { const c = [...CELLS.values()].find(c => c._wayside && c._wayside.id === id); return !!(c && c._wayside.group && c._wayside.group.parent); }, k.burn.id); if (ok) break; await page.waitForTimeout(1000); }
await g.spin('clear', 40);
const cc = await page.evaluate(id => { const D = [...CELLS.values()].find(c => c._wayside && c._wayside.id === id)._wayside; if (!D.group || !D.group.parent) return { none: true };
  const co = Math.cos(D.ry), s = Math.sin(D.ry), W = (u, v) => [D.x + u * co + v * s, D.z - u * s + v * co];
  let bd = 1e9, bq = null; for (const sg of RSEG) { if (sg.road.def.via === 'quay' || sg.road.def.via === 'spur') continue; const vx = sg.bx - sg.ax, vz = sg.bz - sg.az, t = Math.max(0, Math.min(1, ((D.x - sg.ax) * vx + (D.z - sg.az) * vz) / (vx * vx + vz * vz || 1))), qx = sg.ax + vx * t - D.x, qz = sg.az + vz * t - D.z, d = Math.hypot(qx, qz); if (d < bd) { bd = d; bq = [qx, qz]; } }
  const off = D.stands.map(l => { const [x, z] = W(l.x, l.z); return [l.what, +Math.abs(D.y + l.y - meshH(x, z)).toFixed(3)]; }), st = Math.max(...off.map(o => o[1]));
  const at = (u, v) => solidAt(...W(u, v), D.y + .5);
  return { id, tris: D.tris, draws: D.draws, road: +bd.toFixed(2), fwd: bq ? +(-(bq[0] * s + bq[1] * co) / (bd || 1)).toFixed(2) : null, stands: st, off,
    stack: at(D.stack.x, D.stack.z), hut: at(D.hut.x, D.hut.z), cord: at(4, 10.5), door: at(D.hut.door.x, D.hut.door.z - 1.2), path: at(-3.8, -14), between: at(-4.6, 2.2) }; }, k.burn.id);
console.log(JSON.stringify(cc));
check(`${cc.id}: the charcoal burners' camp ${cc.road} m off its road, facing it (${cc.fwd}); ${cc.off && cc.off.length} things that stand on the ground within ${cc.stands} m of it`, !cc.none && cc.road >= 21 && cc.road <= 35 && cc.fwd > .9 && cc.stands < .06, cc);
check(`solid at the stack, the hut and the cordwood, open before the hut's door, on the path and between; ${cc.tris} triangles in ${cc.draws} draws`, !cc.none && cc.stack && cc.hut && cc.cord && !cc.door && !cc.path && !cc.between && cc.tris < 20000 && cc.draws <= 13, cc);
// the fallen cottage (Session 2030, places.js's gatelandsCellar): stood off it, then checked: 20 to 28 m off its road and facing it, its hearth
// stone, the hatch's ground and a fallen stone on the drawn ground, the padlock on the leaves; solid at the gable and the footings, open in the
// doorway, over the hatch and on the path to the road; its cost
await page.evaluate(D => { px = D.x - Math.sin(D.ry) * 60; pz = D.z - Math.cos(D.ry) * 60; }, k.cot);
for (let n = 0; n < 8; n++) { await g.cells(); const ok = await page.evaluate(id => { const c = [...CELLS.values()].find(c => c._wayside && c._wayside.id === id); return !!(c && c._wayside.group && c._wayside.group.parent); }, k.cot.id); if (ok) break; await page.waitForTimeout(1000); }
await g.spin('clear', 40);
const ct = await page.evaluate(id => { const D = [...CELLS.values()].find(c => c._wayside && c._wayside.id === id)._wayside; if (!D.group || !D.group.parent) return { none: true };
  const co = Math.cos(D.ry), s = Math.sin(D.ry), W = (u, v) => [D.x + u * co + v * s, D.z - u * s + v * co];
  let bd = 1e9, bq = null; for (const sg of RSEG) { if (sg.road.def.via === 'quay' || sg.road.def.via === 'spur') continue; const vx = sg.bx - sg.ax, vz = sg.bz - sg.az, t = Math.max(0, Math.min(1, ((D.x - sg.ax) * vx + (D.z - sg.az) * vz) / (vx * vx + vz * vz || 1))), qx = sg.ax + vx * t - D.x, qz = sg.az + vz * t - D.z, d = Math.hypot(qx, qz); if (d < bd) { bd = d; bq = [qx, qz]; } }
  const off = D.stands.map(l => { const [x, z] = W(l.x, l.z); return [l.what, +Math.abs(D.y + l.y - meshH(x, z)).toFixed(3)]; }), st = Math.max(...off.map(o => o[1]));
  const at = (u, v) => solidAt(...W(u, v), D.y + .5), [lx, lz] = W(D.hatch.lock[0], D.hatch.lock[2]);
  return { id, tris: D.tris, draws: D.draws, road: +bd.toFixed(2), fwd: bq ? +(-(bq[0] * s + bq[1] * co) / (bd || 1)).toFixed(2) : null, stands: st, off, lock: +(D.y + D.hatch.lock[1] - meshH(lx, lz)).toFixed(3),
    gable: at(3.2, 0), footing: solidAt(...W(-2, -2.02), D.y + .05) /* a footing is 0.9 m at most: it stops you at its foot, as a step of 0.4 m cannot climb it */, door: at(0, -2.02), hatch: at(D.hatch.x, D.hatch.z), path: at(-.9, -12) }; }, k.cot.id);
console.log(JSON.stringify(ct));
check(`${ct.id}: the fallen cottage ${ct.road} m off its road, facing it (${ct.fwd}); ${ct.off && ct.off.length} things on the ground within ${ct.stands} m of it, the padlock ${ct.lock} m over it`, !ct.none && ct.road >= 19 && ct.road <= 29 && ct.fwd > .9 && ct.stands < .06 && ct.lock > .05 && ct.lock < .2, ct);
check(`solid at the gable and the footings, open in the doorway, over the hatch and on the path; ${ct.tris} triangles in ${ct.draws} draws`, !ct.none && ct.gable && ct.footing && !ct.door && !ct.hatch && !ct.path && ct.tris < 12000 && ct.draws <= 12, ct);
// the perched stone (Session 2033, places.js's gatelandsErratic): stood off it, then checked: 24 to 34 m off its road and facing it, the pedestal's
// and the other stone's ground the drawn ground, the clints a hand proud of it (the world's ground is the gryke's floor and the ground you
// walk on); solid at the boulder and the lace wall, open on the pavement before the stone and on the path to the road; its cost
await page.evaluate(D => { px = D.x - Math.sin(D.ry) * 60; pz = D.z - Math.cos(D.ry) * 60; }, k.er);
for (let n = 0; n < 8; n++) { await g.cells(); const ok = await page.evaluate(id => { const c = [...CELLS.values()].find(c => c._wayside && c._wayside.id === id); return !!(c && c._wayside.group && c._wayside.group.parent); }, k.er.id); if (ok) break; await page.waitForTimeout(1000); }
await g.spin('clear', 40);
const er = await page.evaluate(id => { const D = [...CELLS.values()].find(c => c._wayside && c._wayside.id === id)._wayside; if (!D.group || !D.group.parent) return { none: true };
  const co = Math.cos(D.ry), s = Math.sin(D.ry), W = (u, v) => [D.x + u * co + v * s, D.z - u * s + v * co];
  let bd = 1e9, bq = null; for (const sg of RSEG) { if (sg.road.def.via === 'quay' || sg.road.def.via === 'spur') continue; const vx = sg.bx - sg.ax, vz = sg.bz - sg.az, t = Math.max(0, Math.min(1, ((D.x - sg.ax) * vx + (D.z - sg.az) * vz) / (vx * vx + vz * vz || 1))), qx = sg.ax + vx * t - D.x, qz = sg.az + vz * t - D.z, d = Math.hypot(qx, qz); if (d < bd) { bd = d; bq = [qx, qz]; } }
  const off = D.stands.map(l => { const [x, z] = W(l.x, l.z); return [l.what, +Math.abs(D.y + l.y - meshH(x, z)).toFixed(3)]; }), st = Math.max(...off.map(o => o[1]));
  const pr = D.clints.map(c => { const [x, z] = W(c.x, c.z); return D.y + c.y - meshH(x, z); }).sort((a, b) => a - b), q = f => +pr[Math.floor(f * (pr.length - 1))].toFixed(3);
  const at = (u, v) => solidAt(...W(u, v), D.y + .5);
  return { id, tris: D.tris, draws: D.draws, road: +bd.toFixed(2), fwd: bq ? +(-(bq[0] * s + bq[1] * co) / (bd || 1)).toFixed(2) : null, stands: st, off, clints: pr.length, proud: [q(.05), q(.5), q(.95)],
    crown: +(D.stone.crown).toFixed(2), boulder: at(D.stone.x, D.stone.z), wall: at(0, D.wall.z), wallN: D.wall.n, before: at(0, -4), path: at(-2.4, -D.off + 4) }; }, k.er.id);
console.log(JSON.stringify(er));
check(`${er.id}: the perched stone ${er.road} m off its road, facing it (${er.fwd}); ${er.off && er.off.length} things on the ground within ${er.stands} m of it; ${er.clints} clints proud of it by ${er.proud && er.proud.join(' / ')} m (5th, 50th, 95th)`, !er.none && er.road >= 23 && er.road <= 35 && er.fwd > .9 && er.stands < .06 && er.clints > 30 && er.proud[0] > .01 && er.proud[2] < .16, er);
check(`solid at the boulder (its crown ${er.crown} m) and the lace wall (${er.wallN} slabs), open before the stone and on the path; ${er.tris} triangles in ${er.draws} draws`, !er.none && er.boulder && er.wall && !er.before && !er.path && er.crown > 2.6 && er.tris < 20000 && er.draws <= 11, er);
if (process.env.SHOT) { const S = process.env.SHOT_OF === 'erratic' ? k.er : k.burn; await page.evaluate(D => { REN.setSize(960, 540, false); forceTime(10); px = D.x - Math.sin(D.ry) * 24 + Math.cos(D.ry) * 7; pz = D.z - Math.cos(D.ry) * 24 - Math.sin(D.ry) * 7; }, S); await g.spin('clear', 60); await page.screenshot({ path: process.env.SHOT }); }
check('no page errors', g.errs.length === 0, g.errs.slice(0, 5));
await g.close();
