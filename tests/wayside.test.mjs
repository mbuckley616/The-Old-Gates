// wayside (Session 2007, card F8, OG-124; Michael's A on #1292, "by the land, unmarked until found"): on the new look one cell in three
// of an island keeps a place by a road (waysideAt, 82), its kind drawn from the island's list by its own stream, and a kind the kit has
// not built yet keeps the cell empty. The first kind built is the Gatelands' overturned coach (PKIT.places.carriage, places.js's
// gatelandsCarriage). The suite finds the coaches, the same when asked again, stands by the nearest, and checks it: 20 to 24 m off its
// road and facing it, lying on the drawn ground, solid where the coach is and open beside it, its cost; then that the map has nothing of
// it until you come within 40 m, has it then with no travel to it. Session 2025 adds the Mark's hunters' camp (PKIT.places.hunters), Session 2029 the Gatelands'
// charcoal burners' camp (PKIT.places.charcoal), Session 2030 the locked cellar's fallen cottage (PKIT.places.cellar),
// Session 2034 the perched stone on its pavement (PKIT.places.erratic); Session 2038 the first place off the road, the shepherd's hut (offroadAt);
// Session 2044 the peat-cutting camp (PKIT.places.peat), on its own ground. Session 2048 the coach's lamp at night and its paint. Session 2051
// the Mark's hunting cabin (PKIT.places.cabin), and a fort's spur counted as a road. Session 2056 the logging camp, Session 2057 the Mark's unfinished camp (PKIT.places.unfinished).
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
check(`${k.n} of ${k.cells} cells keep a place by a road (${k.coaches} of them the Gatelands' coach, ${k.camps} the Mark's hunters' camp, ${k.burns} the Gatelands' charcoal burners, ${k.cots} the fallen cottage, ${k.ers} the perched stone), the same when asked again`, k.n > 0 && k.n < k.cells / 3 && k.same && k.gl && k.mk && k.coaches > 0 && k.camps > 0 && k.burns > 0 && k.cots > 0 && k.ers > 0 && k.kinds.join() === 'carriage,cellar,charcoal,erratic,hunters,unfinished', k);
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
// the places off the road (Session 2038, #1292 A): one cell in three keeps one (offroadAt, 82), its kind drawn by its own stream, the same when
// asked again; the first kind built is the Gatelands' shepherd's hut (PKIT.places.shepherd, places.js's gatelandsShepherdHut) on open pasture,
// 150 m and more off every road and pad. Stood by the nearest: its door down the slope, the floor level, its hearthstone, rowan and spring on the
// drawn ground, solid at the walls and the fold, open at the door and inside, its cost; found at 28 m, on the map with no travel to it
const of = await page.evaluate(() => { const G = [...CELLS.values()].filter(c => c.type !== 'sea' && !c.home), C = G.map(c => offroadAt(c)).filter(Boolean);
  const again = G.map(c => { const keep = c._offroad; c._offroad = undefined; const d = offroadAt(c); c._offroad = keep; return d; }).filter(Boolean);
  const same = again.length === C.length && again.every((d, i) => d.id === C[i].id && d.x === C[i].x && d.z === C[i].z && d.ry === C[i].ry);
  C.sort((a, b) => Math.hypot(a.x - px, a.z - pz) - Math.hypot(b.x - px, b.z - pz)); const h = C.find(d => d.kind === 'shepherd');
  return { cells: G.length, n: C.length, same, huts: C.filter(d => d.kind === 'shepherd').length, cabins: C.filter(d => d.kind === 'cabin').length, gl: C.every(d => nationOf(...d.cell.split(',').map(Number)).people === (d.kind === 'cabin' || d.kind === 'logging' ? 'markman' : 'gatelander')), hut: h && { id: h.id, x: h.x, z: h.z, ry: h.ry } }; });
console.log(JSON.stringify(of));
check(`${of.n} of ${of.cells} cells keep a place off the road (${of.huts} the Gatelands' shepherd's hut, ${of.cabins} the Mark's hunting cabin), each on its own island, the same when asked again`, of.n > 0 && of.n < of.cells / 3 && of.same && of.huts > 0 && of.gl, of);
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
// Session 2057: the Mark's unfinished camp (PKIT.places.unfinished, places.js's markUnfinishedCamp) by a road in the tundra's snow: 14 to 22 m
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
if (process.env.SHOT) { const S = process.env.SHOT_OF === 'erratic' ? k.er : process.env.SHOT_OF === 'unfinished' ? uf : k.burn; await page.evaluate(D => { REN.setSize(960, 540, false); forceTime(10); px = D.x - Math.sin(D.ry) * 24 + Math.cos(D.ry) * 7; pz = D.z - Math.cos(D.ry) * 24 - Math.sin(D.ry) * 7; }, S); await g.spin('clear', 60); await page.screenshot({ path: process.env.SHOT }); }
check('no page errors', g.errs.length === 0, g.errs.slice(0, 5));
await g.close();
