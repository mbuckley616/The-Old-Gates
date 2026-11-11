// wayside (Session 2007, card F8, OG-124; Michael's A on #1292, "by the land, unmarked until found"): on the new look one cell in three
// of an island keeps a place by a road (waysideAt, 82), its kind drawn from the island's list by its own stream, and a kind the kit has
// not built yet keeps the cell empty. The first kind built is the Gatelands' overturned coach (PKIT.places.carriage, places.js's
// gatelandsCarriage). The suite finds the coaches, the same when asked again, stands by the nearest, and checks it: 20 to 24 m off its
// road and facing it, lying on the drawn ground, solid where the coach is and open beside it, its cost; then that the map has nothing of
// it until you come within 40 m, has it then with no travel to it. Session 2025 adds the Mark's hunters' camp (PKIT.places.hunters), Session 2029 the Gatelands'
// charcoal burners' camp (PKIT.places.charcoal), Session 2030 the locked cellar's fallen cottage (PKIT.places.cellar),
// Session 2034 the perched stone on its pavement (PKIT.places.erratic); Session 2038 the first place off the road, the shepherd's hut (offroadAt);
// Session 2044 the peat-cutting camp (PKIT.places.peat), on its own ground. Session 2048 the coach's lamp at night and its paint. Session 2051
// the Mark's hunting cabin (PKIT.places.cabin), and a fort's spur counted as a road. Session 2056 the logging camp, Session 2059 the Mark's unfinished camp (PKIT.places.unfinished),
// Session 2063 the Gatelands' merchants' camp (PKIT.places.merchants), Session 2065 Aurenne's abandoned expedition (PKIT.places.expedition) on its laid ground,
// Session 2071 the Gatelands' falls (PKIT.places.falls), their glen cut into the world's own ground. Session 2079 the peat camp's heather in shoots and its footings as tents. Session 2081 the cabin's lights on all four sides.
// Session 2083 the second chance for cells that drew nothing (#1385 C): the Gatelands' merchants' camps and falls drawn at last.
// Session 2101 Aurenne's first place off the road, the coastal watchtower (PKIT.places.watchtower), on a rise of its coast over the open sea.
// Session 2104 (begun as 2098) the Mark's ice cave mouth (PKIT.places.icemouth), a glacier's tongue on the world's own slope, its tunnel and stream cut into the ground.
import { boot, check } from './lib/game.mjs';
const g = await boot({ look: 'new' }); const { page } = g; await g.intoWorld();
await page.evaluate(() => REN.setSize(320, 180, false));
/* S2065 — one cell in three rolls a place, and with every kind on Aurenne's list built 23 of 60 keep one: the ceiling is half the cells, the odds' spread */
const k = await page.evaluate(() => { const G = [...CELLS.values()].filter(c => c.type !== 'sea' && !c.home), C = G.map(c => waysideAt(c)).filter(Boolean);
  const again = G.map(c => { const keep = c._wayside; c._wayside = undefined; const d = waysideAt(c); c._wayside = keep; return d; }).filter(Boolean);
  const same = again.length === C.length && again.every((d, i) => d.id === C[i].id && d.x === C[i].x && d.z === C[i].z && d.ry === C[i].ry);
  C.sort((a, b) => Math.hypot(a.x - px, a.z - pz) - Math.hypot(b.x - px, b.z - pz)); const n = C[0];
  const ppl = d => nationOf(...d.cell.split(',').map(Number)).people, coaches = C.filter(d => d.kind === 'carriage'), camps = C.filter(d => d.kind === 'hunters'), burns = C.filter(d => d.kind === 'charcoal'), cots = C.filter(d => d.kind === 'cellar'), ers = C.filter(d => d.kind === 'erratic');
  return { cells: G.length, n: C.length, kinds: [...new Set(C.map(d => d.kind))].sort(), same, coaches: coaches.length, camps: camps.length, burns: burns.length, cots: cots.length, ers: ers.length, gl: [...coaches, ...burns, ...cots, ...ers].every(d => ppl(d) === 'gatelander'), mk: camps.every(d => ppl(d) === 'markman'),
    near: coaches[0] && { id: coaches[0].id, x: coaches[0].x, z: coaches[0].z, ry: coaches[0].ry, off: coaches[0].off }, camp: camps[0] && { id: camps[0].id, x: camps[0].x, z: camps[0].z, ry: camps[0].ry, off: camps[0].off }, burn: burns[0] && { id: burns[0].id, x: burns[0].x, z: burns[0].z, ry: burns[0].ry, off: burns[0].off }, cot: cots[0] && { id: cots[0].id, x: cots[0].x, z: cots[0].z, ry: cots[0].ry, off: cots[0].off }, er: ers[0] && { id: ers[0].id, x: ers[0].x, z: ers[0].z, ry: ers[0].ry, off: ers[0].off } }; });
console.log(JSON.stringify(k));
check(`${k.n} of ${k.cells} cells keep a place by a road (${k.coaches} of them the Gatelands' coach, ${k.camps} the Mark's hunters' camp, ${k.burns} the Gatelands' charcoal burners, ${k.cots} the fallen cottage, ${k.ers} the perched stone), the same when asked again`, k.n > 0 && k.n < k.cells / 2 && k.same && k.gl && k.mk && k.coaches > 0 && k.camps > 0 && k.burns > 0 && k.cots > 0 && k.ers > 0 && k.kinds.join() === 'carriage,cellar,charcoal,erratic,expedition,hunters,merchants,unfinished', k);
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
// Session 2048 (the critic, s1401: "a black box at 16 m in woodland, its lamp gave no light at 22h"): the coach's paint is lacquer, the
// grain's relief without its colour; its lamp is dark by day and lit from 19:00, a light on the pool where the glass hangs
const lp = async h => { await page.evaluate(h => forceTime(h), h); await g.spin('clear', 20); return page.evaluate(id => { const D = [...CELLS.values()].find(c => c._wayside && c._wayside.id === id)._wayside;
  if (!D.lamp) return { none: true }; const P = D.lamp.light.position; return { i: D.lamp.light.intensity, e: D.lamp.mat.emissiveIntensity, pool: sc.children.some(o => o.isPointLight && o.intensity > 0 && o.position.distanceTo(P) < .01),
    up: +(P.y - meshH(P.x, P.z)).toFixed(2), map: !!D.group.getObjectByName('paint').material.map }; }, k.near.id); };
const l12 = await lp(12), l22 = await lp(22); await page.evaluate(() => forceTime(12)); console.log(JSON.stringify({ l12, l22 }));
check(`the coach's lamp dark at noon (${l12.i}), lit at 22h (${l22.i}, glass ${l22.e}) on the pool of lights, ${l22.up} m over the ground; its paint without the grain's colour`, !l12.none && l12.i === 0 && !l12.pool && l22.i > 1 && l22.e > 1 && l22.pool && l22.up > .5 && !l22.map, { l12, l22 });
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
// the perched stone (Session 2034, places.js's gatelandsErratic): stood off it, then checked: 24 to 34 m off its road and facing it, the pedestal's
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
// Session 2072 (the critic, 10 Nov: "the perched stone is hidden from the road by its own tree"): from the road's side, 24 m out and 0 or
// 6 m to either side at the eye, rays to a grid over the boulder's face; none may meet the hawthorn's or the hazels' bark and leaves first
const vis = await page.evaluate(id => { const D = [...CELLS.values()].find(c => c._wayside && c._wayside.id === id)._wayside; if (!D.group || !D.group.parent) return { none: true };
  const co = Math.cos(D.ry), s = Math.sin(D.ry), W = (u, v) => [D.x + u * co + v * s, D.z - u * s + v * co], [bx, bz] = W(D.stone.x, D.stone.z), RC = new THREE.Raycaster(), out = [];
  D.group.updateMatrixWorld(true); const ms = D.group.children.filter(m => m.isMesh);
  for (const side of [-6, 0, 6]) { const [ex, ez] = W(side, -24), eye = new THREE.Vector3(ex, meshH(ex, ez) + 1.65, ez), dx = bx - ex, dz = bz - ez, L = Math.hypot(dx, dz), nx = -dz / L, nz = dx / L;
    let n = 0, hid = 0; for (let i = -2; i <= 2; i++) for (let j = 0; j < 5; j++) { const t = new THREE.Vector3(bx + nx * i * .3 * D.stone.brx, D.y + D.stone.top + .3 + j * (D.stone.crown - D.stone.top - .6) / 4, bz + nz * i * .3 * D.stone.brx);
      const dir = t.clone().sub(eye); const far = dir.length(); RC.set(eye, dir.normalize()); RC.far = far + 2; const h = RC.intersectObjects(ms, false)[0]; n++; if (h && ['haw', 'bark', 'leaf', 'berry'].includes(h.object.name)) hid++; }
    out.push([side, hid, n]); }
  return { out, hid: Math.max(...out.map(o => o[1])) }; }, k.er.id);
console.log(JSON.stringify(vis));
check(`${k.er.id}: the boulder seen whole from the road's side, 24 m out: ${vis.out && vis.out.map(o => `${o[1]} of ${o[2]} rays met a tree first at ${o[0]} m`).join(', ')}`, !vis.none && vis.hid === 0, vis);
// the places off the road (Session 2038, #1292 A): one cell in three keeps one (offroadAt, 82), its kind drawn by its own stream, the same when
// asked again; the first kind built is the Gatelands' shepherd's hut (PKIT.places.shepherd, places.js's gatelandsShepherdHut) on open pasture,
// 150 m and more off every road and pad. Stood by the nearest: its door down the slope, the floor level, its hearthstone, rowan and spring on the
// drawn ground, solid at the walls and the fold, open at the door and inside, its cost; found at 28 m, on the map with no travel to it
const of = await page.evaluate(() => { const G = [...CELLS.values()].filter(c => c.type !== 'sea' && !c.home), C = G.map(c => offroadAt(c)).filter(Boolean);
  const again = G.map(c => { const keep = c._offroad; c._offroad = undefined; const d = offroadAt(c); c._offroad = keep; return d; }).filter(Boolean);
  const same = again.length === C.length && again.every((d, i) => d.id === C[i].id && d.x === C[i].x && d.z === C[i].z && d.ry === C[i].ry);
  C.sort((a, b) => Math.hypot(a.x - px, a.z - pz) - Math.hypot(b.x - px, b.z - pz)); const h = C.find(d => d.kind === 'shepherd');
  return { cells: G.length, n: C.length, same, huts: C.filter(d => d.kind === 'shepherd').length, cabins: C.filter(d => d.kind === 'cabin').length, gl: C.every(d => nationOf(...d.cell.split(',').map(Number)).people === (d.kind === 'cabin' || d.kind === 'logging' || d.kind === 'icemouth' ? 'markman' : d.kind === 'watchtower' ? 'aurennais' : 'gatelander')), hut: h && { id: h.id, x: h.x, z: h.z, ry: h.ry } }; });
console.log(JSON.stringify(of));
check(`${of.n} of ${of.cells} cells keep a place off the road (${of.huts} the Gatelands' shepherd's hut, ${of.cabins} the Mark's hunting cabin), each on its own island, the same when asked again`, of.n > 0 && of.n < of.cells / 3 && of.same && of.huts > 0 && of.gl, of);
// Session 2083 (Michael's C on #1385): a second chance for cells that drew nothing. A cell whose roll missed by under a sixth (1/3 to 1/2)
// keeps a place only of a kind its nation drew nowhere on the first chance; the first chance's places are as they were without it (each cell's
// first chance asked again on its own), every second place's kind is one no first chance of its nation drew, and every kind the kit has built
// stands somewhere on its island (today the Gatelands' merchants' camps and falls are only second chances)
const sc = await page.evaluate(() => { const G = [...CELLS.values()].filter(c => c.type !== 'sea' && !c.home), out = { first: 0, second: [], moved: [], bad: [], missing: [] };
  for (const [nm, LISTS, at, tr, odds] of [['wayside', WAYSIDE, waysideAt, waysideTry, 1 / 3], ['offroad', OFFROAD, offroadAt, offroadTry, OFFROAD_ODDS]]) {
    const drawn = {}, first = {}; for (const c of G) { const n = nationKeyOf(c.i, c.j), f = tr(c, null), d = at(c); (first[n] = first[n] || new Set()); (drawn[n] = drawn[n] || new Set()); if (f) first[n].add(f.kind); if (d) drawn[n].add(d.kind);
      if (f) { out.first++; if (!d || d.id !== f.id || d.x !== f.x || d.z !== f.z || d.ry !== f.ry || d.kind !== f.kind || d.second) out.moved.push(f.id); } }
    for (const c of G) { const d = at(c); if (!d || !d.second) continue; const n = nationKeyOf(c.i, c.j), v = PKIT.stream(nm + ':' + cellKey(c.i, c.j))(); out.second.push(d.id + ' ' + d.kind);
      if (tr(c, null) || v < odds || v >= .5 || first[n].has(d.kind)) out.bad.push(d.id); }
    for (const c of G) { const n = nationKeyOf(c.i, c.j), list = LISTS[nationOf(c.i, c.j).people] || []; for (const kd of list) if (PKIT.places[kd] && !drawn[n].has(kd) && !out.missing.includes(n + ':' + kd)) out.missing.push(n + ':' + kd); } }
  return out; });
console.log(JSON.stringify(sc));
check(`a second chance for cells that drew nothing (#1385 C): ${sc.second.length} places of kinds their island drew nowhere (${sc.second.join(', ')}), in cells that missed by under a sixth; the ${sc.first} first-chance places unmoved; every kind built stands somewhere on its island`,
  sc.second.length > 0 && sc.moved.length === 0 && sc.bad.length === 0 && sc.missing.length === 0 && sc.second.some(t => / merchants$/.test(t)) && sc.second.some(t => / falls$/.test(t)) && sc.second.some(t => / icemouth$/.test(t)), sc);
await page.evaluate(D => { px = D.x + Math.sin(D.ry) * 60; pz = D.z + Math.cos(D.ry) * 60; }, of.hut);
for (let n = 0; n < 8; n++) { await g.cells(); const ok = await page.evaluate(id => { const c = [...CELLS.values()].find(c => c._offroad && c._offroad.id === id); return !!(c && c._offroad.group && c._offroad.group.parent); }, of.hut.id); if (ok) break; await page.waitForTimeout(1000); }
await g.spin('clear', 40);
const hu = await page.evaluate(id => { const D = [...CELLS.values()].find(c => c._offroad && c._offroad.id === id)._offroad; if (!D.group || !D.group.parent) return { none: true };
  const co = Math.cos(D.ry), s = Math.sin(D.ry), W = (u, v) => [D.x + u * co + v * s, D.z - u * s + v * co], at = (u, v, y = .5) => solidAt(...W(u, v), D.y + y);
  let bd = 1e9; for (const sg of RSEG) { const vx = sg.bx - sg.ax, vz = sg.bz - sg.az, t = Math.max(0, Math.min(1, ((D.x - sg.ax) * vx + (D.z - sg.az) * vz) / (vx * vx + vz * vz || 1))); bd = Math.min(bd, Math.hypot(sg.ax + vx * t - D.x, sg.az + vz * t - D.z)); }
  const st = Math.max(...D.stands.map(l => { const [x, z] = W(l.x, l.z); return Math.abs(D.y + l.y - meshH(x, z)); })), fl = [[-2, -1], [2, -1], [-2, 1], [2, 1]].map(([u, v]) => Math.abs(meshH(...W(u, v)) - D.y));
  const fy = meshH(...W(11, 9.7)) - D.y;
  return { id, tris: D.tris, draws: D.draws, road: +bd.toFixed(1), down: +(meshH(...W(0, 10)) - meshH(...W(0, -10))).toFixed(2), stands: +st.toFixed(3), floor: +Math.max(...fl).toFixed(3),
    back: at(0, -1.8), side: at(-2.7, 0), door: at(1, 1.8), inside: at(0, 0), fold: at(11, 9.7, fy + .5), foldIn: at(11, 5.5, meshH(...W(11, 5.5)) - D.y + .5) }; }, of.hut.id);
console.log(JSON.stringify(hu));
check(`${hu.id}: the shepherd's hut ${hu.road} m off the nearest road, its door down the slope (${hu.down} m over 20), its floor within ${hu.floor} m of level, ${hu.stands} m from its hearthstone, rowan and spring to the ground`, !hu.none && hu.road >= 150 && hu.down < -.5 && hu.floor < .1 && hu.stands < .06, hu);
check(`solid at the hut's walls and the fold, open at the door, inside and in the fold; ${hu.tris} triangles in ${hu.draws} draws`, !hu.none && hu.back && hu.side && !hu.door && !hu.inside && hu.fold && !hu.foldIn && hu.tris < 22000 && hu.draws <= 16, hu);
// Session 2075 (the critic, 10 Nov: "its 91 clumps lie flat on the grass as orange five-pointed stars"): the bracken stands knee-high, each
// clump's highest point 0.4 m or more over the ground under it
const bk = await page.evaluate(id => { const D = [...CELLS.values()].find(c => c._offroad && c._offroad.id === id)._offroad, m = D.group.getObjectByName('bracken'); if (!m) return { none: true };
  m.updateMatrixWorld(true); const P = m.geometry.attributes.position, v = new THREE.Vector3(), cl = new Map();
  for (let i = 0; i < P.count; i++) { v.fromBufferAttribute(P, i).applyMatrix4(m.matrixWorld); const k = Math.round(v.x / 1.5) + ',' + Math.round(v.z / 1.5), h = v.y - meshH(v.x, v.z); cl.set(k, Math.max(cl.get(k) ?? -9, h)); }
  const hs = [...cl.values()].sort((a, b) => a - b), q = f => +hs[Math.floor(f * (hs.length - 1))].toFixed(2); return { n: hs.length, q10: q(.1), q50: q(.5), q90: q(.9) }; }, of.hut.id);
console.log(JSON.stringify(bk));
check(`${of.hut.id}: the bracken stands, its clumps' tops ${bk.q10} / ${bk.q50} / ${bk.q90} m over the ground (10th, 50th, 90th)`, !bk.none && bk.q10 >= .35 && bk.q90 < 1, bk);
// Session 2088 (the critic, 10 Nov: "it reads as a ruin in a forest"): the hut stands in its pasture, the trees thinned to one in twelve and the
// wood stood back, while the grass and the ground are the world's (no stamp to stampAt inside the pasture)
const pa = await page.evaluate(id => { const D = [...CELLS.values()].find(c => c._offroad && c._offroad.id === id)._offroad, n = [0, 0];
  for (const ch of chunks.values()) { const t = ch.treePts || []; for (let i = 0; i < t.length; i += 2) { const d = Math.hypot(t[i] - D.x, t[i + 1] - D.z); if (d < 35) n[0]++; if (d < 45) n[1]++; } }
  const co = Math.cos(D.ry), s = Math.sin(D.ry), W = (u, v) => [D.x + u * co + v * s, D.z - u * s + v * co];
  return { in35: n[0], in45: n[1], graze: STAMPS.filter(t => t.id === id + '_graze').length, open: [[25, 10], [-25, 10], [0, 30]].every(([u, v]) => { const [x, z] = W(u, v); return grazeAt(x, z) && !stampAt(x, z); }) }; }, of.hut.id);
console.log(JSON.stringify(pa));
check(`${of.hut.id}: the hut on its pasture, ${pa.in35} trees within 35 m and ${pa.in45} within 45 m, the grass and the ground the world's`, pa.graze === 7 && pa.in35 <= 3 && pa.in45 <= 12 && pa.open, pa);
await page.evaluate(D => { px = D.x + Math.sin(D.ry) * 28; pz = D.z + Math.cos(D.ry) * 28; }, of.hut); await g.spin('clear', 60);
const hm = await page.evaluate(id => { const e = mapEntries(getCell(...id.split('_').slice(1).map(Number))).find(e => e.id === id); return { disc: discovered(id), entry: e && { name: e.name, kind: e.kind, noTravel: !!e.noTravel }, travel: !!arrivalFor(id) }; }, of.hut.id);
console.log(JSON.stringify(hm));
check(`found at 28 m, on the map as "${hm.entry && hm.entry.name}", with no travel to it`, hm.disc && hm.entry && hm.entry.kind === 'offroad' && hm.entry.noTravel && !hm.travel, hm);
// Session 2044: the Gatelands' peat-cutting camp (PKIT.places.peat, places.js's gatelandsPeatCamp) on level bog, the first place that brings its
// own ground: the bog's patch over the world (never under it inside the rim), the height you walk at read from the piece (offroadGroundAt),
// the face a wall from the cut and open from the bank, the bothy solid with its door open, its cost
const pc = await page.evaluate(() => { for (const c of CELLS.values()) { const d = c.type !== 'sea' && !c.home ? offroadAt(c) : null; if (d && d.kind === 'peat') return { id: d.id, x: d.x, z: d.z, ry: d.ry, cell: d.cell, ppl: nationOf(c.i, c.j).people }; } return null; });
console.log(JSON.stringify(pc));
check(`a peat-cutting camp is drawn and finds level bog (${pc && pc.id}, ${pc && pc.ppl})`, !!pc && pc.ppl === 'gatelander', pc);
if (pc) {
  await page.evaluate(D => { px = D.x - Math.sin(D.ry) * 60; pz = D.z - Math.cos(D.ry) * 60; }, pc);
  for (let n = 0; n < 12; n++) { await g.cells(); const ok = await page.evaluate(id => { const c = [...CELLS.values()].find(c => c._offroad && c._offroad.id === id); return !!(c && c._offroad.group && c._offroad.group.parent); }, pc.id); if (ok) break; await page.waitForTimeout(1000); }
  await g.spin('clear', 40);
  const pt = await page.evaluate(id => { const D = [...CELLS.values()].find(c => c._offroad && c._offroad.id === id)._offroad; if (!D.group || !D.group.parent) return { none: true };
    const co = Math.cos(D.ry), s = Math.sin(D.ry), W = (u, v) => [D.x + u * co + v * s, D.z - u * s + v * co], at = (u, v, y) => solidAt(...W(u, v), y), Pt = OFFROAD_PATCHES.find(p => p.id === id), gr = (u, v) => D.y + Pt.ground(u, v);
    let over = -1e9, walk = 0; for (let u = D.patch.x0 + 1; u < D.patch.x1; u += 1) for (let v = D.patch.z0 + 1; v < D.patch.z1; v += 1) { if (D.rim(u, v) < .86) over = Math.max(over, meshH(...W(u, v)) - gr(u, v)); if (Math.abs(v) > .02) walk = Math.max(walk, Math.abs(groundY(...W(u, v)) - gr(u, v))); }
    let bd = 1e9; for (const sg of RSEG) { const vx = sg.bx - sg.ax, vz = sg.bz - sg.az, t = Math.max(0, Math.min(1, ((D.x - sg.ax) * vx + (D.z - sg.az) * vz) / (vx * vx + vz * vz || 1))); bd = Math.min(bd, Math.hypot(sg.ax + vx * t - D.x, sg.az + vz * t - D.z)); }
    const H = D.hut; return { id, tris: D.tris, draws: D.draws, road: +bd.toFixed(1), over: +over.toFixed(3), walk: +walk.toFixed(3), deep: +(gr(0, -1) - gr(0, 5)).toFixed(2),
      faceCut: at(0, .2, gr(0, .2)), faceBank: at(0, -.6, gr(0, -.6)), cut: at(0, 5, gr(0, 5)), ramp: at(22, 6, gr(22, 6)), back: at(H.x, H.z - H.d / 2 + .25, D.y + .5), door: at(H.x, H.z + H.d / 2 - .25, D.y + .5), inside: at(H.x, H.z, D.y + .5), rick: at(D.rick.x, D.rick.z, D.y + .5) }; }, pc.id);
  console.log(JSON.stringify(pt));
  check(`${pt.id}: the peat camp ${pt.road} m off the nearest road; inside the rim the world's ground ${pt.over} m under the bog's at most, the walk within ${pt.walk} m of the piece's ground, the cut ${pt.deep} m deep`, !pt.none && pt.road >= 150 && pt.over <= 0 && pt.walk < .1 && pt.deep > 1.2, pt);
  check(`the face a wall from the cut and open from the bank, the cut and the ramp open; the bothy solid at its back, open at its door and inside, the rick solid; ${pt.tris} triangles in ${pt.draws} draws`, !pt.none && pt.faceCut && !pt.faceBank && !pt.cut && !pt.ramp && pt.back && !pt.door && !pt.inside && pt.rick && pt.tris < 42000 && pt.draws <= 20, pt);
  // Session 2079 (the critic, 10 Nov: "the heather is purple stones", "dark upright blocks that read as tree stumps"): the heather is shoots
  // standing, not a lump lying (its faces' mean |n.y| by area under one half), each clump under 0.7 m across and nine in ten 0.15 m high or more; a
  // footing (four or five sods leaned to a point, no lid) is wider at its foot than it is tall
  const ph = await page.evaluate(id => { const D = [...CELLS.values()].find(c => c._offroad && c._offroad.id === id)._offroad, hm = D.group.getObjectByName('heather'), sm = ['sod', 'sodDry'].map(k => D.group.getObjectByName(k)); if (!hm || !sm[0] || !sm[1] || !D.heather) return { none: true };
    const P = hm.geometry.attributes.position, a = new THREE.Vector3(), b = new THREE.Vector3(), c = new THREE.Vector3(); let ny = 0, ar = 0;
    for (let i = 0; i < P.count; i += 3) { a.fromBufferAttribute(P, i); b.fromBufferAttribute(P, i + 1); c.fromBufferAttribute(P, i + 2); const n = b.clone().sub(a).cross(c.clone().sub(a)), s = n.length() / 2; ar += s; ny += s * Math.abs(n.y / (2 * s || 1)); }
    const HC = D.heather.filter(q => !q[4]), cl = HC.map(() => ({ w: 0, h: -9 })), v = new THREE.Vector3(); /* the heather's own clumps; one in three is the ling's, drawn with the bog cotton */
    for (let i = 0; i < P.count; i++) { v.fromBufferAttribute(P, i); let k = -1, kd = 9; HC.forEach(([x, z], j) => { const d = Math.hypot(v.x - x, v.z - z); if (d < kd) { kd = d; k = j; } }); if (kd > .5) continue; cl[k].w = Math.max(cl[k].w, 2 * kd); cl[k].h = Math.max(cl[k].h, v.y - D.ground(HC[k][0], HC[k][1])); }
    const ft = D.footings.map(f => { let span = 0, top = -9; const gy = D.ground(f.x, f.z); for (const S of sm.map(m => m.geometry.attributes.position)) for (let i = 0; i < S.count; i++) { v.fromBufferAttribute(S, i); const d = Math.hypot(v.x - f.x, v.z - f.z); if (d > .5) continue; top = Math.max(top, v.y - gy); if (v.y - gy < .06) span = Math.max(span, 2 * d); } return span / top; }).sort((x, y) => x - y);
    return { ny: +(ny / ar).toFixed(2), clumps: cl.length, wMax: +Math.max(...cl.map(q => q.w)).toFixed(2), hMin: +cl.map(q => q.h).sort((a, b) => a - b)[Math.floor(cl.length / 10)].toFixed(2) /* the 10th percentile: a clump that touches another loses tips to it */, hMax: +Math.max(...cl.map(q => q.h)).toFixed(2), feet: ft.length, ratioMin: +ft[0].toFixed(2), ratioMid: +ft[ft.length >> 1].toFixed(2) }; }, pc.id);
  console.log(JSON.stringify(ph));
  check(`${pc.id}: the heather stands in shoots (mean |n.y| ${ph.ny}), ${ph.clumps} heather clumps ${ph.hMin} (10th percentile) to ${ph.hMax} m high and at most ${ph.wMax} m across; ${ph.feet} footings ${ph.ratioMin} (least) and ${ph.ratioMid} (middle) times as wide at the foot as they are tall`, !ph.none && ph.ny < .5 && ph.wMax < .7 && ph.hMin >= .15 && ph.ratioMin >= 1.2, ph);
}
// Session 2051: the Mark's hunting cabin (PKIT.places.cabin, places.js's markHuntingCabin) in the tundra's snow, on its levelled yard, 150 m
// and more off every road and every fort's spur: the cabin, the store, the block and the frame on the drawn ground, solid at its four log walls
// (the door shut) and the woodpile, open in the yard and under the store, a ring of its own spruce; its cost
const cb = await page.evaluate(() => { for (const c of CELLS.values()) { const d = c.type !== 'sea' && !c.home ? offroadAt(c) : null; if (d && d.kind === 'cabin') return { id: d.id, x: d.x, z: d.z, ry: d.ry, cell: d.cell, ppl: nationOf(c.i, c.j).people }; } return null; });
console.log(JSON.stringify(cb));
check(`a hunting cabin is drawn and finds the Mark's tundra (${cb && cb.id}, ${cb && cb.ppl})`, !!cb && cb.ppl === 'markman', cb);
if (cb) {
  await page.evaluate(D => { px = D.x + Math.sin(D.ry) * 40; pz = D.z + Math.cos(D.ry) * 40; }, cb);
  for (let n = 0; n < 12; n++) { await g.cells(); const ok = await page.evaluate(id => { const c = [...CELLS.values()].find(c => c._offroad && c._offroad.id === id); return !!(c && c._offroad.group && c._offroad.group.parent); }, cb.id); if (ok) break; await page.waitForTimeout(1000); }
  await g.spin('clear', 40);
  const ct = await page.evaluate(id => { const D = [...CELLS.values()].find(c => c._offroad && c._offroad.id === id)._offroad; if (!D.group || !D.group.parent) return { none: true };
    const co = Math.cos(D.ry), s = Math.sin(D.ry), W = (u, v) => [D.x + u * co + v * s, D.z - u * s + v * co], at = (u, v, y = .5) => solidAt(...W(u, v), D.y + y);
    let bd = 1e9; for (const sg of RSEG) { const vx = sg.bx - sg.ax, vz = sg.bz - sg.az, t = Math.max(0, Math.min(1, ((D.x - sg.ax) * vx + (D.z - sg.az) * vz) / (vx * vx + vz * vz || 1))); bd = Math.min(bd, Math.hypot(sg.ax + vx * t - D.x, sg.az + vz * t - D.z)); }
    const st = Math.max(...D.stands.map(l => { const [x, z] = W(l.x, l.z); return Math.abs(D.y + l.y - meshH(x, z)); })), fl = Math.max(...[[-2.3, -2.6], [2.3, -2.6], [-2.3, 2.6], [2.3, 2.6]].map(([u, v]) => Math.abs(meshH(...W(u, v)) - D.y)));
    return { id, tris: D.tris, draws: D.draws, road: +bd.toFixed(1), stands: +st.toFixed(3), floor: +fl.toFixed(3), trees: D.trees.length, near: +Math.min(...D.trees.map(t => Math.hypot(t.x, t.z))).toFixed(1),
      back: at(0, -2.3), side: at(-1.9, 0), door: at(0, 2.3), inside: at(0, 0), pile: at(-2.4, 0), yard: at(0, 5), path: at(.6, 12), under: at(5.6, -3.6) }; }, cb.id);
  console.log(JSON.stringify(ct));
  check(`${ct.id}: the hunting cabin ${ct.road} m off the nearest road or spur, its yard within ${ct.floor} m of level, ${ct.stands} m from its block and frame to the ground, ${ct.trees} spruce of its own from ${ct.near} m`, !ct.none && ct.road >= 150 && ct.floor < .06 && ct.stands < .06 && ct.trees >= 12 && ct.near >= 11, ct);
  check(`solid at the cabin's four walls (the door shut) and the woodpile, open in the yard, on the path and under the store; ${ct.tris} triangles in ${ct.draws} draws`, !ct.none && ct.back && ct.side && ct.door && !ct.inside && ct.pile && !ct.yard && !ct.path && !ct.under && ct.tris < 21000 && ct.draws <= 18, ct);
  // Session 2073 (the critic, 10 Nov: "about half of the frame's trees are leaf-card oaks in full green, standing in snow"): within 90 m of
  // the cabin no leafed tree (broadleaf, oak, birch, willow) stands where the tundra holds .55 of the ground or more, read from the 3×3 cells
  // round it as tundraW reads them; and the bushes there are frosted. Session 2076: nor a spruce (the new look draws it from green cards), and the
  // snowpine is drawn in its own snowed shape, not the land's cone kit
  const sl = await page.evaluate(id => { const D = [...CELLS.values()].find(c => c._offroad && c._offroad.id === id)._offroad, L = new Set(['broadleaf', 'oak', 'birch', 'willow', 'spruce']); let n = 0, snow = 0, leaf = 0, cone = 0, own = 0;
    for (const ch of chunks.values()) for (const t of ch.trees || []) { if (Math.hypot(t.x - D.x, t.z - D.z) > 90) continue; n++; if (tundraW(t.x, t.z) < .55) continue; snow++; if (L.has(t.sp)) leaf++; if (t.sp === 'snowpine') cone++; }
    for (const ch of chunks.values()) ch.group.traverse(m => { if (m.isInstancedMesh && m.userData.scatter === 'snowpine' && m.userData.landTree) own = -1e9; else if (m.isInstancedMesh && m.userData.scatter === 'snowpine') own++; });
    return { n, snow, leaf, cone, own, kit: !!LAND_TREE_KIT.snowpine }; }, cb.id);
  console.log(JSON.stringify(sl));
  check(`${cb.id}: of ${sl.n} trees within 90 m, ${sl.snow} stand in the Mark's snow and ${sl.leaf} of those are leafed or spruce (${sl.cone} snowpine, drawn in ${sl.own} meshes of its own shape)`, sl.snow > 10 && sl.leaf === 0 && sl.cone > sl.snow / 2 && sl.own > 0 && !sl.kit, sl);
  // Session 2081 (the critic, 10 Nov: "from the west, at 25 m, I see no lit window … from three sides of four, a cabin lived in is dark"): a lit
  // window in each wall, the gables and the sides; from 25 m out before each, at eye height and from five points 2 m apart across it, a
  // sight line to the light, over its glazing bar, meets its glow before anything else within 3 m of the cabin (the woodpile, the logs, the
  // roof); the ring of its own spruce, 11 m out and more, is the wood's and not counted
  const lw = await page.evaluate(id => { const D = [...CELLS.values()].find(c => c._offroad && c._offroad.id === id)._offroad, G = D.group, W = D.cabin.wins; if (!W || W.length < 4) return { none: true, n: W && W.length };
    G.updateMatrixWorld(true); const rc = new THREE.Raycaster(), meshes = []; G.traverse(m => { if (m.isMesh) meshes.push(m); });
    const C = D.cabin, sides = W.map(w => { let seen = 0; const hit = []; for (const off of [-4, -2, 0, 2, 4]) { const t = G.localToWorld(new THREE.Vector3(w.x, w.y + .12, w.z)) /* above the glazing bar */, e = G.localToWorld(new THREE.Vector3(w.x + w.n[0] * 25 - w.n[1] * off, 0, w.z + w.n[1] * 25 + w.n[0] * off));
      e.y = meshH(e.x, e.z) + 1.65; const d = t.clone().sub(e), L = d.length(); rc.set(e, d.normalize()); rc.far = L + .3; const h = rc.intersectObjects(meshes, false).find(q => { const l = G.worldToLocal(q.point.clone()); return Math.abs(l.x) < C.x1 + 3 && Math.abs(l.z) < C.z1 + 3; }); if (h && h.object.name === 'glow') seen++; else hit.push(h ? h.object.name : 'none'); } return { n: w.n.join(','), seen, hit: [...new Set(hit)] }; });
    return { n: W.length, sides, faces: [...new Set(W.map(w => w.n.join(',')))].length }; }, cb.id);
  console.log(JSON.stringify(lw));
  check(`${cb.id}: ${lw.n} lit windows facing ${lw.faces} ways, each seen from 25 m out (${(lw.sides || []).map(q => q.n + ' ' + q.seen + ' of 5').join('; ')})`, !lw.none && lw.faces === 4 && lw.sides.every(q => q.seen >= 3), lw);
}
// Session 2101: Aurenne's coastal watchtower (PKIT.places.watchtower, places.js's aurenneWatchtower) off the road on a rise of its coast,
// facing the nearest shore 12 to 26 m out over the open sea, 150 m and more off every road: its scarp's foot under the lowest ground round it,
// its well, cypresses and path on the drawn ground, solid at the drum, its rim, the stair and the landing, the wellhead; open on the path, in
// the yard and on the seaward grass; no tree of the scatter in its clearing; its cost
const wt = await page.evaluate(() => { for (const c of CELLS.values()) { const d = c.type !== 'sea' && !c.home ? offroadAt(c) : null; if (d && d.kind === 'watchtower') return { id: d.id, x: d.x, z: d.z, ry: d.ry, shore: d.shore, ppl: nationOf(c.i, c.j).people }; } return null; });
console.log(JSON.stringify(wt));
check(`a watchtower is drawn on Aurenne's coast (${wt && wt.id}, the shore ${wt && wt.shore} m before it)`, !!wt && wt.ppl === 'aurennais' && wt.shore >= 12 && wt.shore <= 26, wt);
if (wt) {
  await page.evaluate(D => { px = D.x - Math.sin(D.ry) * 40; pz = D.z - Math.cos(D.ry) * 40; }, wt);
  for (let n = 0; n < 12; n++) { await g.cells(); const ok = await page.evaluate(id => { const c = [...CELLS.values()].find(c => c._offroad && c._offroad.id === id); return !!(c && c._offroad.group && c._offroad.group.parent); }, wt.id); if (ok) break; await page.waitForTimeout(1000); }
  await g.spin('clear', 40);
  const wq = await page.evaluate(id => { const D = [...CELLS.values()].find(c => c._offroad && c._offroad.id === id)._offroad; if (!D.group || !D.group.parent) return { none: true };
    const co = Math.cos(D.ry), s = Math.sin(D.ry), W = (u, v) => [D.x + u * co + v * s, D.z - u * s + v * co], at = (u, v, y = .5) => solidAt(...W(u, v), D.y + y);
    let bd = 1e9; for (const sg of RSEG) { const vx = sg.bx - sg.ax, vz = sg.bz - sg.az, t = Math.max(0, Math.min(1, ((D.x - sg.ax) * vx + (D.z - sg.az) * vz) / (vx * vx + vz * vz || 1))); bd = Math.min(bd, Math.hypot(sg.ax + vx * t - D.x, sg.az + vz * t - D.z)); }
    const st = Math.max(...D.stands.map(l => { const [x, z] = W(l.x, l.z); return Math.abs(D.y + l.y - meshH(x, z)); }));
    let lo = 1e9; for (let k = 0; k < 32; k++) { const a = k / 32 * 6.2832; lo = Math.min(lo, meshH(...W(Math.sin(a) * 5.05, Math.cos(a) * 5.05)) - D.y); }
    const [cx, cz] = W(0, -4); let trees = 0; for (const ch of chunks.values()) for (const p of (ch.treePts || [])) if (Math.hypot(p.x - cx, p.z - cz) < 12) trees++;
    const sea = [D.shore + 60, D.shore + 120].every(v => meshH(...W(0, v)) < SEA_Y - 1);
    return { id, tris: D.tris, draws: D.draws, road: +bd.toFixed(1), stands: +st.toFixed(3), foot: +(D.tower.foot - lo).toFixed(2), trees, sea,
      tower: at(0, 0), rim: [0, 1, 2, 3, 4, 5, 6, 7].filter(k => at(Math.sin(k * .785) * 4.8, Math.cos(k * .785) * 4.8)).length, stair: at(4.5, D.stair.foot[1]), landing: at(0, (D.stair.landing.z0 + D.stair.landing.z1) / 2), well: at(6.5, -12),
      open: [at(9.6, -20), at(0, -12), at(-4, -8), at(0, 7)].filter(Boolean).length }; }, wt.id);
  console.log(JSON.stringify(wq));
  check(`${wq.id}: the watchtower ${wq.road} m off the nearest road, the open sea before it, its scarp's foot ${wq.foot} m under the lowest ground round it, its well, cypresses and path within ${wq.stands} m of the ground, ${wq.trees} trees of the scatter in its clearing`, !wq.none && wq.road >= 150 && wq.sea && wq.foot <= -.3 && wq.stands < .06 && wq.trees === 0, wq);
  check(`solid at the drum, ${wq.rim} of 8 points round its foot, the stair, the landing and the wellhead; ${4 - wq.open} of 4 open points blocked; ${wq.tris} triangles in ${wq.draws} draws`, !wq.none && wq.tower && wq.rim === 8 && wq.stair && wq.landing && wq.well && wq.open === 0 && wq.tris < 14000 && wq.draws <= 10, wq);
}
// Session 2056: the Mark's logging camp (PKIT.places.logging, places.js's markLoggingCamp) on a fall line of the world into water, 150 m and
// more off every road: the chute from the deck's foot down to 3 m out over the water, clear of the bank all the way; the fire and the
// sledge on the drawn ground; in the snow, the ice a hand over the water; solid at the deck, the chute on land and the gapahuk's back, open
// at its front; its cost
const lg = await page.evaluate(() => { for (const c of CELLS.values()) { const d = c.type !== 'sea' && !c.home ? offroadAt(c) : null; if (d && d.kind === 'logging') return { id: d.id, x: d.x, z: d.z, ry: d.ry, shore: d.shore, snow: d.snow, fresh: d.fresh, ppl: nationOf(c.i, c.j).people }; } return null; });
console.log(JSON.stringify(lg));
check(`a logging camp is drawn on a fall line into water in the Mark (${lg && lg.id}, the shore ${lg && lg.shore} m down it, ${lg && (lg.fresh ? 'fresh water' : 'the sea')})`, !!lg && lg.ppl === 'markman' && lg.shore >= 22 && lg.shore <= 34, lg);
if (lg) {
  await page.evaluate(D => { px = D.x - Math.sin(D.ry) * 40; pz = D.z - Math.cos(D.ry) * 40; }, lg);
  for (let n = 0; n < 12; n++) { await g.cells(); const ok = await page.evaluate(id => { const c = [...CELLS.values()].find(c => c._offroad && c._offroad.id === id); return !!(c && c._offroad.group && c._offroad.group.parent); }, lg.id); if (ok) break; await page.waitForTimeout(1000); }
  await g.spin('clear', 40);
  const lt = await page.evaluate(id => { const D = [...CELLS.values()].find(c => c._offroad && c._offroad.id === id)._offroad; if (!D.group || !D.group.parent) return { none: true };
    const co = Math.cos(D.ry), s = Math.sin(D.ry), W = (u, v) => [D.x + u * co + v * s, D.z - u * s + v * co], C = D.chute, cy = v => D.y + C.y0 - C.grade * (v - C.z0);
    let bd = 1e9; for (const sg of RSEG) { const vx = sg.bx - sg.ax, vz = sg.bz - sg.az, t = Math.max(0, Math.min(1, ((D.x - sg.ax) * vx + (D.z - sg.az) * vz) / (vx * vx + vz * vz || 1))); bd = Math.min(bd, Math.hypot(sg.ax + vx * t - D.x, sg.az + vz * t - D.z)); }
    let clear = 1e9; for (let v = C.z0 + .5; v < C.z1; v += .5) { if (C.gap && v > C.gap[0] && v < C.gap[1]) continue; clear = Math.min(clear, cy(v) - meshH(...W(C.x, v))); }
    const st = Math.max(...D.stands.map(l => { const [x, z] = W(l.x, l.z); return Math.abs(D.y + l.y - meshH(x, z)); })), Sh = D.shelter, at = (u, v, y) => solidAt(...W(u, v), y);
    return { id, tris: D.tris, draws: D.draws, road: +bd.toFixed(1), end: +meshH(...W(C.x, C.z1)).toFixed(2), clear: +clear.toFixed(3), stands: +st.toFixed(3), stumps: D.stumps.length, trees: D.trees.length, ice: D.ice ? +(D.y + D.ice.y).toFixed(3) : null, snow: !!D.snow,
      deck: at(D.deck.x, D.deck.z, meshH(...W(D.deck.x, D.deck.z)) + .5), chute: at(C.x, C.z0 + 4, meshH(...W(C.x, C.z0 + 4)) + .3), back: at(Sh.x, Sh.z - Sh.d / 2, D.y + Sh.y + .5), front: at(Sh.x, Sh.z + Sh.d / 2 - .3, D.y + Sh.y + .5) }; }, lg.id);
  console.log(JSON.stringify(lt));
  check(`${lt.id}: the logging camp ${lt.road} m off the nearest road; the chute ends over water (ground ${lt.end} m) and clears the bank by ${lt.clear} m at least; its fire and sledge within ${lt.stands} m of the ground; ${lt.stumps} stumps, ${lt.trees} spruce; ice at ${lt.ice}`, !lt.none && lt.road >= 150 && lt.end < 0 && lt.clear > 0 && lt.stands < .06 && lt.stumps >= 40 && lt.trees >= 20 && (!lt.snow || (lt.ice > 0 && lt.ice < .1)), lt);
  check(`solid at the deck, the chute on land and the gapahuk's back, open at its front; ${lt.tris} triangles in ${lt.draws} draws`, !lt.none && lt.deck && lt.chute && lt.back && !lt.front && lt.tris < 17000 && lt.draws <= 13, lt);
}
// Session 2059: the Mark's unfinished camp (PKIT.places.unfinished, places.js's markUnfinishedCamp) by a road in the tundra's snow: 14 to 22 m
// off its road and facing it, what lies about on the drawn ground and its stance level, solid at the pulk and the chopping round, open at the
// laid fire and on the way to the road, a ring of its own spruce from 9 m and none toward the road; its cost
const uf = await page.evaluate(() => { for (const c of CELLS.values()) { const d = c.type !== 'sea' && !c.home ? waysideAt(c) : null; if (d && d.kind === 'unfinished') return { id: d.id, x: d.x, z: d.z, ry: d.ry, off: d.off, ppl: nationOf(c.i, c.j).people, bio: withPlace(c.ox + SIZE / 2, c.oz + SIZE / 2, () => dominantRegion(d.x, d.z).r.biome) }; } return null; });
console.log(JSON.stringify(uf));
check(`an unfinished camp is drawn by a road in the Mark's tundra (${uf && uf.id}, ${uf && uf.ppl}, ${uf && uf.bio})`, !!uf && uf.ppl === 'markman' && uf.bio === 'tundra', uf);
if (uf) {
  await page.evaluate(D => { px = D.x - Math.sin(D.ry) * 50; pz = D.z - Math.cos(D.ry) * 50; }, uf);
  for (let n = 0; n < 12; n++) { await g.cells(); const ok = await page.evaluate(id => { const c = [...CELLS.values()].find(c => c._wayside && c._wayside.id === id); return !!(c && c._wayside.group && c._wayside.group.parent); }, uf.id); if (ok) break; await page.waitForTimeout(1000); }
  await g.spin('clear', 40);
  const ut = await page.evaluate(id => { const D = [...CELLS.values()].find(c => c._wayside && c._wayside.id === id)._wayside; if (!D.group || !D.group.parent) return { none: true };
    const co = Math.cos(D.ry), s = Math.sin(D.ry), W = (u, v) => [D.x + u * co + v * s, D.z - u * s + v * co], at = (u, v) => solidAt(...W(u, v), meshH(...W(u, v)));
    let bd = 1e9, bq = null; for (const sg of RSEG) { if (sg.road.def.via === 'quay' || sg.road.def.via === 'spur') continue; const vx = sg.bx - sg.ax, vz = sg.bz - sg.az, t = Math.max(0, Math.min(1, ((D.x - sg.ax) * vx + (D.z - sg.az) * vz) / (vx * vx + vz * vz || 1))), qx = sg.ax + vx * t - D.x, qz = sg.az + vz * t - D.z, d = Math.hypot(qx, qz); if (d < bd) { bd = d; bq = [qx, qz]; } }
    const st = Math.max(...D.stands.map(l => { const [x, z] = W(l.x, l.z); return Math.abs(D.y + l.y - meshH(x, z)); })), fl = Math.max(...[[-3, -3], [3, -3], [-3, 3], [3, 3]].map(([u, v]) => Math.abs(meshH(...W(u, v)) - D.y)));
    return { id, tris: D.tris, draws: D.draws, road: +bd.toFixed(2), fwd: bq ? +(-(bq[0] * s + bq[1] * co) / (bd || 1)).toFixed(2) : null, stands: +st.toFixed(3), n: D.stands.length, floor: +fl.toFixed(3),
      trees: D.trees.length, near: +Math.min(...D.trees.map(t => Math.hypot(t.x, t.z))).toFixed(1), toRoad: D.trees.filter(t => t.z < -(D.off - 5)).length, lit: D.group.children.some(m => m.material.emissive && m.material.emissive.getHex() > 0),
      pulk: at(D.sledge.x, D.sledge.z), round: at(D.round.x, D.round.z), fire: at(D.fire.x, D.fire.z), way: at(0, -D.off / 2) }; }, uf.id);
  console.log(JSON.stringify(ut));
  check(`${ut.id}: the unfinished camp ${ut.road} m off its road, facing it (${ut.fwd}); ${ut.n} things lying within ${ut.stands} m of the ground, its stance within ${ut.floor} m of level; ${ut.trees} spruce of its own from ${ut.near} m, ${ut.toRoad} toward the road; nothing lit`, !ut.none && ut.road >= 13 && ut.road <= 23 && ut.fwd > .9 && ut.stands < .06 && ut.floor < .08 && ut.trees >= 15 && ut.near >= 9 && ut.toRoad === 0 && !ut.lit, ut);
  check(`solid at the pulk and the chopping round, open at the laid fire and on the way to the road; ${ut.tris} triangles in ${ut.draws} draws`, !ut.none && ut.pulk && ut.round && !ut.fire && !ut.way && ut.tris < 16000 && ut.draws <= 12, ut);
}
// Session 2063: the Gatelands' merchants' camp (PKIT.places.merchants, places.js's gatelandsMerchantCamp). No cell of today's world draws it (the
// eight Gatelands cells that keep a place by a road drew the other four kinds; DECISION in docs/devlog/2063.md), so the kit's piece is built on a
// slope of 1 in 20 and checked alone: every foot and wheel on that ground, its six solids, its lantern, its cost. When a cell draws it, the
// camp in the world is checked too: 14 to 24 m off its road and facing it, what stands on the drawn ground, its stances near level (the drawn
// ground's 4 m grid), solid at both waggons, the stall, the tent and the goods from the ground, open at the fire, before the tent's door and on
// the path; the lantern lit at night. (A boot with the Gatelands' list set to the merchants alone puts it in 8 cells; every check below held.)
const mk = await page.evaluate(() => { const gr = (x, z) => .05 * z + .08 * Math.sin(x * .3), M = PKIT.places.merchants({ key: 'test', road: -18, ground: gr });
  const off = Math.max(...M.stands.map(s => Math.abs(s.y - gr(s.x, s.z)))), out = { tris: M.tris, draws: M.draws, n: M.stands.length, off: +off.toFixed(4), sol: M.sol.length, wagons: M.wagons.length, lamp: !!(M.lamp && M.lamp.mat), tent: M.tent.ridge - M.tent.floor };
  M.group.traverse(o => { if (o.geometry) o.geometry.dispose(); }); return out; });
console.log(JSON.stringify(mk));
check(`the kit's merchants' camp on a slope: ${mk.n} feet, wheels and goods within ${mk.off} m of its ground, ${mk.sol} solids, 2 waggons, a lantern; ${mk.tris} triangles in ${mk.draws} draws`, mk.off < .001 && mk.n >= 25 && mk.sol === 6 && mk.wagons === 2 && mk.lamp && Math.abs(mk.tent - 1.95) < .01 && mk.tris < 16000 && mk.draws <= 18, mk);
const mc = await page.evaluate(() => { const C = []; for (const c of CELLS.values()) { const d = c.type !== 'sea' && !c.home ? waysideAt(c) : null; if (d && d.kind === 'merchants') C.push({ id: d.id, x: d.x, z: d.z, ry: d.ry, off: d.off, ppl: nationOf(c.i, c.j).people }); }
  C.sort((a, b) => Math.hypot(a.x - px, a.z - pz) - Math.hypot(b.x - px, b.z - pz)); return C.length ? { ...C[0], n: C.length, gl: C.every(d => d.ppl === 'gatelander') } : null; });
console.log(JSON.stringify(mc));
if (mc) {
  check(`${mc.n} merchants' camps are drawn by the Gatelands' roads (the nearest ${mc.id})`, mc.gl, mc);
  await page.evaluate(D => { px = D.x - Math.sin(D.ry) * 50; pz = D.z - Math.cos(D.ry) * 50; }, mc);
  for (let n = 0; n < 12; n++) { await g.cells(); const ok = await page.evaluate(id => { const c = [...CELLS.values()].find(c => c._wayside && c._wayside.id === id); return !!(c && c._wayside.group && c._wayside.group.parent); }, mc.id); if (ok) break; await page.waitForTimeout(1000); }
  await g.spin('clear', 40);
  const mt = await page.evaluate(id => { const D = [...CELLS.values()].find(c => c._wayside && c._wayside.id === id)._wayside; if (!D.group || !D.group.parent) return { none: true };
    const co = Math.cos(D.ry), s = Math.sin(D.ry), W = (u, v) => [D.x + u * co + v * s, D.z - u * s + v * co], at = (u, v) => solidAt(...W(u, v), meshH(...W(u, v)) + .1);
    let bd = 1e9, bq = null; for (const sg of RSEG) { if (sg.road.def.via === 'quay' || sg.road.def.via === 'spur') continue; const vx = sg.bx - sg.ax, vz = sg.bz - sg.az, t = Math.max(0, Math.min(1, ((D.x - sg.ax) * vx + (D.z - sg.az) * vz) / (vx * vx + vz * vz || 1))), qx = sg.ax + vx * t - D.x, qz = sg.az + vz * t - D.z, d = Math.hypot(qx, qz); if (d < bd) { bd = d; bq = [qx, qz]; } }
    const off = D.stands.map(l => { const [x, z] = W(l.x, l.z); return [l.what, +Math.abs(D.y + l.y - meshH(x, z)).toFixed(3)]; }), st = Math.max(...off.map(o => o[1]));
    const lvls = [[3, -6.6, 3], [0, 1, 1.6], [-6.6, 4.2, 2], [9.5, 1.5, 2.2]].map(([u, v, r]) => +Math.max(...[[r, 0], [-r, 0], [0, r], [0, -r]].map(([a, b]) => Math.abs(meshH(...W(u + a, v + b)) - meshH(...W(u, v))))).toFixed(3)), lvl = Math.max(...lvls);
    const t = D.tent, dx = t.door.x - t.x, dz = t.door.z - t.z, dl = Math.hypot(dx, dz);
    return { id, tris: D.tris, draws: D.draws, road: +bd.toFixed(2), fwd: bq ? +(-(bq[0] * s + bq[1] * co) / (bd || 1)).toFixed(2) : null, stands: st, n: off.length, worst: off.sort((a, b) => b[1] - a[1])[0], level: +lvl.toFixed(3), lvls,
      wagonA: at(D.wagons[0].x, D.wagons[0].z), wagonB: at(D.wagons[1].x, D.wagons[1].z), table: at(D.tables[0].x, D.tables[0].z), tent: at(t.x, t.z), goods: at(6.55, 5.15),
      fire: at(D.fire.x, D.fire.z), door: at(t.door.x + dx / dl * 1, t.door.z + dz / dl * 1), path: at(2.7, -D.off + 3), lamp: !!D.lamp }; }, mc.id);
  console.log(JSON.stringify(mt));
  check(`${mt.id}: the merchants' camp ${mt.road} m off its road, facing it (${mt.fwd}); ${mt.n} things that stand on the ground within ${mt.stands} m of it; its stances within ${mt.level} m of level`, !mt.none && mt.road >= 13 && mt.road <= 25 && mt.fwd > .9 && mt.stands < .06 && mt.level < .25, mt);
  check(`solid at both waggons, the stall, the tent and the goods, open at the fire, before the tent's door and on the path to the road; ${mt.tris} triangles in ${mt.draws} draws`, !mt.none && mt.wagonA && mt.wagonB && mt.table && mt.tent && mt.goods && !mt.fire && !mt.door && !mt.path && mt.tris < 16000 && mt.draws <= 18, mt);
  const ml = async h => { await page.evaluate(h => forceTime(h), h); await g.spin('clear', 20); return page.evaluate(id => { const D = [...CELLS.values()].find(c => c._wayside && c._wayside.id === id)._wayside; if (!D.lamp) return { none: true }; const P = D.lamp.light.position; return { i: D.lamp.light.intensity, up: +(P.y - meshH(P.x, P.z)).toFixed(2) }; }, mc.id); };
  const m12 = await ml(12), m22 = await ml(22); await page.evaluate(() => forceTime(12)); console.log(JSON.stringify({ m12, m22 }));
  check(`the stall's lantern dark at noon (${m12.i}), lit at 22h (${m22.i}), ${m22.up} m over the ground`, !m12.none && m12.i === 0 && m22.i > 1 && m22.up > 1.2 && m22.up < 2.6, { m12, m22 });
}
// Session 2065 — Aurenne's abandoned expedition (PKIT.places.expedition, places.js's aurenneExpedition) on Aurenne's dry ground, 16 to 24 m
// off its road and facing it; its trench cut where the world's ground is sunk and laid back over it (waysideLaidBack): the world's ground
// under the trench's floor everywhere, the laid ground meeting the world's at its edge, the walk height the trench's floor in it and the
// laid ground's out of it; what fell lies on the laid ground; solid at the standing tent, the cart and the wall, open at the fire and in
// the wall's gap; its cost; no ore vein in its clearing
const ex = await page.evaluate(() => { const G = [...CELLS.values()].filter(c => c.type !== 'sea' && !c.home), E = G.map(c => waysideAt(c)).filter(d => d && d.kind === 'expedition');
  E.sort((a, b) => Math.hypot(a.x - px, a.z - pz) - Math.hypot(b.x - px, b.z - pz)); const D = E[0];
  return D && { n: E.length, id: D.id, x: D.x, z: D.z, ry: D.ry, off: D.off, au: E.every(d => nationOf(...d.cell.split(',').map(Number)).people === 'aurennais'),
    dry: E.every(d => withPlace(d.x, d.z, () => ['plains', 'coast', 'wastes', 'wasteland'].includes(dominantRegion(d.x, d.z).r.biome))) }; });
check(`${ex ? ex.n : 0} abandoned expeditions by Aurenne's roads, on its dry ground (the nearest ${ex && ex.id})`, !!ex && ex.n >= 4 && ex.au && ex.dry, ex);
if (ex) {
  await page.evaluate(D => { px = D.x - Math.sin(D.ry) * 50; pz = D.z - Math.cos(D.ry) * 50; }, ex);
  for (let n = 0; n < 12; n++) { await g.cells(); const ok = await page.evaluate(id => { const c = [...CELLS.values()].find(c => c._wayside && c._wayside.id === id); return !!(c && c._wayside.group && c._wayside.group.parent); }, ex.id); if (ok) break; }
  await g.spin('clear', 40);
  const xt = await page.evaluate(id => { const D = [...CELLS.values()].find(c => c._wayside && c._wayside.id === id)._wayside; if (!D.group || !D.group.parent || !D.laid) return { none: true };
    const co = Math.cos(D.ry), s = Math.sin(D.ry), W = (u, v) => [D.x + u * co + v * s, D.z - u * s + v * co], L = D.laid, T = D.trench, at = (u, v) => solidAt(...W(u, v), L.h(...W(u, v)) + .1);
    let bd = 1e9, bq = null; for (const sg of RSEG) { if (sg.road.def.via === 'quay' || sg.road.def.via === 'spur') continue; const vx = sg.bx - sg.ax, vz = sg.bz - sg.az, t = Math.max(0, Math.min(1, ((D.x - sg.ax) * vx + (D.z - sg.az) * vz) / (vx * vx + vz * vz || 1))), qx = sg.ax + vx * t - D.x, qz = sg.az + vz * t - D.z, d = Math.hypot(qx, qz); if (d < bd) { bd = d; bq = [qx, qz]; } }
    const st = Math.max(...D.stands.map(l => Math.abs(D.y + l.y - L.h(...W(l.x, l.z)))));
    let under = 1e9; for (let u = -T.L / 2; u <= T.L / 2 + 1e-6; u += .25) for (let v = -T.W / 2; v <= T.W / 2 + 1e-6; v += .25) { const [x, z] = W(T.x + u, T.z + v); under = Math.min(under, D.y + T.floor - meshH(x, z)); }
    const keys = new Set(L.keys), g4 = CHUNK / SEGS; let seam = 0, edges = 0; for (const k of L.keys) { const [x0, z0] = k.split(',').map(Number);
      for (const [nx, nz, e] of [[x0 - g4, z0, t => [x0, z0 + t]], [x0 + g4, z0, t => [x0 + g4, z0 + t]], [x0, z0 - g4, t => [x0 + t, z0]], [x0, z0 + g4, t => [x0 + t, z0 + g4]]]) { if (keys.has(nx + ',' + nz)) continue; edges++;
        for (let t = 0; t <= g4; t += .5) { const [x, z] = e(t); seam = Math.max(seam, Math.abs(L.h(x, z) - meshH(x + (nx - x0) * 1e-3, z + (nz - z0) * 1e-3))); } } }
    const veins = VEINS.filter(v => placeClearAt(v.x, v.z) && Math.hypot(v.x - D.x, v.z - D.z) < 30).length, [gx0, gz0] = W(T.x, T.z), [gx1, gz1] = W(0, 0);
    return { id, tris: D.tris, draws: D.draws, laid: L.tris, cells: L.cells, road: +bd.toFixed(2), fwd: bq ? +(-(bq[0] * s + bq[1] * co) / (bd || 1)).toFixed(2) : null, stands: +st.toFixed(3), n: D.stands.length,
      under: +under.toFixed(3), seam: +seam.toFixed(4), edges, inT: +(groundY(gx0, gz0) - D.y - T.floor).toFixed(3), camp: +(groundY(gx1, gz1) - L.h(gx1, gz1)).toFixed(3), sunk: +(L.h(gx0, gz0) - meshH(gx0, gz0)).toFixed(2),
      tent: at(D.tents.up.x, D.tents.up.z), cart: at(D.cart.wheel.x + .1, D.cart.wheel.z + .7), wall: at(4, D.wall.z), gap: at(-.8, D.wall.z), fire: at(D.fire.x, D.fire.z), veins }; }, ex.id);
  console.log(JSON.stringify(xt));
  check(`${xt.id}: the expedition ${xt.road} m off its road, facing it (${xt.fwd}); ${xt.n} things fallen within ${xt.stands} m of its ground`, !xt.none && xt.road >= 15 && xt.road <= 25 && xt.fwd > .9 && xt.stands < .03, xt);
  check(`its trench: the world's ground ${xt.under} m or more under the floor (sunk ${xt.sunk} m at its middle), the ground laid back meeting the world's within ${xt.seam} m on ${xt.edges} edges, the walk on the trench's floor (${xt.inT}) and on the laid ground at the camp (${xt.camp})`,
    !xt.none && xt.under > .3 && xt.sunk > 1 && xt.seam < .01 && xt.edges >= 4 && Math.abs(xt.inT) < .01 && Math.abs(xt.camp) < .01, xt);
  check(`solid at the standing tent, the cart and the wall, open at the fire and in the wall's gap; no ore vein in its clearing; ${xt.tris} triangles in ${xt.draws} draws, the laid ground ${xt.laid} over ${xt.cells} squares`,
    !xt.none && xt.tent && xt.cart && xt.wall && !xt.gap && !xt.fire && xt.veins === 0 && xt.tris < 12000 && xt.draws <= 16 && xt.laid < 3000, xt);
}
// Session 2071: the Gatelands' falls off the road (PKIT.places.falls, places.js's gatelandsFalls). No cell of today's world draws them (#1385),
// so the suite asks the first Gatelands cell that rolls a place off the road for a falls site, puts it there and builds the cell again: the
// head-wall 7 to 12 m as the land falls; the world's ground nowhere over the ground cut into it; the pool waded, the shelf behind the fall and
// the cave's floor at 1.2 m; solid at the face's foot, the cave's sides and the arcade's piers, open in its mouth and its bays; its cost
const fl = await page.evaluate(() => { const L = OFFROAD.gatelander.slice(); let out = null;
  for (let j = 0; j < GRID && !out; j++) for (let i = 0; i < GRID && !out; i++) { const c = getCell(i, j); if (!c || c.type === 'sea' || c.home || !c.sites || nationOf(i, j).people !== 'gatelander') continue;
    const keep = c._offroad; c._offroad = undefined; OFFROAD.gatelander.splice(0, L.length, 'falls', 'falls', 'falls'); let d; try { d = offroadAt(c); } finally { OFFROAD.gatelander.splice(0, 3, ...L); }
    if (!d) { c._offroad = keep; continue; } const k = cellKey(i, j); unloadCell(k); c._offroad = d; px = d.x + Math.sin(d.ry) * 40; pz = d.z + Math.cos(d.ry) * 40; out = { id: d.id, x: d.x, z: d.z, ry: d.ry, y0: d.y0, wall: d.wall }; }
  return out; });
console.log(JSON.stringify(fl));
check(`a Gatelands cell that rolls a place off the road finds a falls site when asked for one (${fl && fl.id}, the head-wall ${fl && fl.wall} m, the pool ${fl && fl.y0} m over the sea)`, !!fl && fl.wall >= 7 && fl.wall <= 12 && fl.y0 >= 2.5, fl);
if (fl) {
  for (let n = 0; n < 15; n++) { await g.cells(); const ok = await page.evaluate(id => { const c = [...CELLS.values()].find(c => c._offroad && c._offroad.id === id); return !!(c && c._offroad.group && c._offroad.group.parent); }, fl.id); if (ok) break; await page.waitForTimeout(1000); }
  await g.spin('clear', 30);
  const ft = await page.evaluate(id => { const D = [...CELLS.values()].find(c => c._offroad && c._offroad.id === id)._offroad; if (!D.group || !D.group.parent) return { none: true };
    const co = Math.cos(D.ry), s = Math.sin(D.ry), W = (u, v) => [D.x + u * co + v * s, D.z - u * s + v * co], S = D.shape, P = S.patch;
    let over = 0, n = 0; for (let v = P.z0 + 1; v < P.z1; v += 1.3) for (let u = P.x0 + 1; u < P.x1; u += 1.3) { if (S.cut(u, v)) continue; const [x, z] = W(u, v); n++; if (meshH(x, z) - D.laid.h(x, z) > .02) over++; }
    const gy = (u, v) => +(groundY(...W(u, v)) - D.y0).toFixed(2), at = (u, v, y) => solidAt(...W(u, v), D.y0 + y), A = D.arcade, mid = q => (q.x0 + q.x1) / 2;
    return { id, tris: D.tris, draws: D.draws, laid: D.laid.tris, cells: D.laid.cells, n, over, lip: +(D.fall.lipY).toFixed(2), face: +S.faceH(0).toFixed(2),
      pool: gy(0, 5), shelf: gy(3, S.faceZ(3) - .9), cave: gy(S.CX, S.CZ0 - 4), roof: +(D.laid.h(...W(S.CX, S.CZ0 - 4)) - D.y0).toFixed(2),
      foot: at(10, S.footZ(10) - .5, 2), mouth: at(S.CX, S.CZ0 - 1, 1.6), side: at(S.CX + S.hwAt(S.CZ0 - 3) + .5, S.CZ0 - 3, 2), pier: at(mid(A.piers[1]), A.z, 1), bay: at(mid(A.bays[1]), A.z, 1) }; }, fl.id);
  console.log(JSON.stringify(ft));
  check(`${ft.id}: the river leaves the lip ${ft.lip} m over the pool, the face ${ft.face} m over its foot; the world's ground over the cut ground at ${ft.over} of ${ft.n} points; the pool waded at ${ft.pool} m, the shelf ${ft.shelf} m, the cave's floor ${ft.cave} m under ${ft.roof} m of hill`,
    !ft.none && ft.lip >= 6.5 && ft.face >= 4.5 && ft.over === 0 && ft.n > 3000 && ft.pool === -1 && Math.abs(ft.shelf - 1.2) < .05 && ft.cave === 1.2 && ft.roof > 5, ft);
  check(`solid at the face's foot, the cave's side and the arcade's pier, open in the cave's mouth and the arcade's bay; ${ft.tris} triangles in ${ft.draws} draws, the laid ground ${ft.laid} over ${ft.cells} squares`,
    !ft.none && ft.foot && ft.side && ft.pier && !ft.mouth && !ft.bay && ft.tris < 34000 && ft.draws <= 17 && ft.laid < 10000, ft);
}
// Session 2104 (begun as 2098): the Mark's ice cave mouth (PKIT.places.icemouth, places.js's markIceMouth), drawn only by the second chance (its first chance
// keeps the Mark's two older kinds, so nothing that stands moves). The nearest is built and checked: the face 15 m or more over the land; the
// world's ground nowhere over the ground cut into it (the tunnel, the apron, the stream); the tunnel's floor walked under its roof, the ice's
// top walked over the tongue; solid at the face's foot, the tunnel's side and the dark at its back, open in the mouth; its cost
const im = await page.evaluate(() => { const G = [...CELLS.values()].filter(c => c.type !== 'sea' && !c.home), C = G.map(c => offroadAt(c)).filter(d => d && d.kind === 'icemouth');
  C.sort((a, b) => Math.hypot(a.x - px, a.z - pz) - Math.hypot(b.x - px, b.z - pz)); const d = C[0]; if (!d) return null; px = d.x + Math.sin(d.ry) * 50; pz = d.z + Math.cos(d.ry) * 50;
  return { n: C.length, first: C.filter(d => !d.second).length, id: d.id, x: d.x, z: d.z, ry: d.ry, y0: d.y0 }; });
console.log(JSON.stringify(im));
check(`the Mark keeps ${im && im.n} ice cave mouths, every one a second chance`, !!im && im.n > 0 && im.first === 0, im);
if (im) {
  for (let n = 0; n < 15; n++) { await g.cells(); const ok = await page.evaluate(id => { const c = [...CELLS.values()].find(c => c._offroad && c._offroad.id === id); return !!(c && c._offroad.group && c._offroad.group.parent); }, im.id); if (ok) break; await page.waitForTimeout(1000); }
  await g.spin('clear', 30);
  const it = await page.evaluate(id => { const D = [...CELLS.values()].find(c => c._offroad && c._offroad.id === id)._offroad; if (!D.group || !D.group.parent) return { none: true };
    const co = Math.cos(D.ry), s = Math.sin(D.ry), W = (u, v) => [D.x + u * co + v * s, D.z - u * s + v * co], S = D.shape;
    let over = 0, n = 0; for (let v = S.Z0 - S.TL; v < 60; v += 1) for (let u = -12; u < 12; u += 1) { if (!S.inTunnel(u, v) && v <= S.Z0) continue; const [x, z] = W(u, v); n++; if (meshH(x, z) - D.laid.h(x, z) > .02) over++; }
    const gy = (u, v, y = 0) => { const k = jumpY; jumpY = D.y0 + y; const r = +(groundY(...W(u, v)) - D.y0).toFixed(2); jumpY = k; return r; }, at = (u, v, y) => solidAt(...W(u, v), D.y0 + y);
    return { id, tris: D.tris, draws: D.draws, laid: D.laid.tris, cells: D.laid.cells, n, over, face: +(S.faceTop(10) - S.land(10, S.faceZ(10))).toFixed(2),
      tun: gy(-1, -10), tunF: +S.tFloor(-1, -10).toFixed(2), ice: gy(10, -20, 30), iceT: +S.top(10, -20).toFixed(2),
      foot: at(10, S.faceZ(10) - .5, 2), mouth: at(0, -1, 1.6), side: at(S.hwAt(-6) + .5, -6, 2), back: at(0, S.Z0 - S.TL - .55, 1.5) }; }, im.id);
  console.log(JSON.stringify(it));
  check(`${it.id}: the face ${it.face} m over the land; the world's ground over the cut ground at ${it.over} of ${it.n} points; the tunnel's floor walked at ${it.tun} m, the ice's top at ${it.ice} m`,
    !it.none && it.face >= 15 && it.over === 0 && it.n > 1000 && it.tun === it.tunF && Math.abs(it.ice - it.iceT) < .02 && it.ice > 12, it);
  check(`solid at the face's foot, the tunnel's side and the dark at its back, open in the mouth; ${it.tris} triangles in ${it.draws} draws, the laid ground ${it.laid} over ${it.cells} squares`,
    !it.none && it.foot && it.side && it.back && !it.mouth && it.tris < 24000 && it.draws <= 11 && it.laid < 8000, it);
}
// Session 2063 (QA's S2060: two shepherd's huts 2.5 km out drawn whole in Dunmore's view): the places by a road and off it are hidden past
// 450 m of you and shown within it; nothing else of them changes
await g.spin('clear', 5);
const far = await page.evaluate(() => { const all = []; for (const L of LOADED.values()) { const c = L.cell; if (!c) continue; for (const D of [c._wayside, c._offroad]) if (D && D.group && D.group.parent) all.push({ id: D.id, d: Math.round(Math.hypot(D.x - px, D.z - pz)), vis: D.group.visible }); } return all; });
console.log(JSON.stringify(far));
check(`the places by a road and off it drawn within 450 m only: ${far.filter(f => f.vis).length} shown (${far.filter(f => f.vis).map(f => f.d).join(', ')} m), ${far.filter(f => !f.vis).length} hidden (${far.filter(f => !f.vis).map(f => f.d).join(', ')} m)`, far.length > 1 && far.some(f => !f.vis) && far.every(f => f.vis === (f.d < 450)), far);
if (process.env.SHOT) { const S = process.env.SHOT_OF === 'erratic' ? k.er : process.env.SHOT_OF === 'unfinished' ? uf : process.env.SHOT_OF === 'merchants' ? mc : k.burn; await page.evaluate(D => { REN.setSize(960, 540, false); forceTime(10); px = D.x - Math.sin(D.ry) * 24 + Math.cos(D.ry) * 7; pz = D.z - Math.cos(D.ry) * 24 - Math.sin(D.ry) * 7; }, S); await g.spin('clear', 60); await page.screenshot({ path: process.env.SHOT }); }
check('no page errors', g.errs.length === 0, g.errs.slice(0, 5));
await g.close();
