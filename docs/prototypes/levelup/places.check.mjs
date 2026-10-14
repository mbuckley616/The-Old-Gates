// node docs/prototypes/levelup/places.check.mjs [--shots] (Session 857): places.js's Markish silver mine in the test Chromium.
// 6 keys, each the same twice and in budget; the adit's sets give a clear way of 2 m or more under a cap of 2.2 m or more, their feet on
// the floor; the walk from the mouth down the adit, across the landing, along the gallery and onto the ledge has a floor under it at
// every quarter metre, 2.1 m of headroom and 0.3 m clear at the hip and the head; along the gallery the rail is on the open side and past
// it the drop is 14 m or more to the sump; at the walk's end the vein is in reach (within 1.4 m, between 0.6 and 1.8 m up) and in sight;
// worked out (o.worked false) the heap is gone and no lamp is lit (Session 868). --shots writes places-mine, -gallery, -face, -adit, -face-old and -mine-old (the shaft view, a hole lit by the kibble's lamp, renders but is not shot).
import { chromium } from 'playwright'; import http from 'http'; import fs from 'fs'; import path from 'path'; import { fileURLToPath } from 'url';
import { execFileSync } from 'child_process';
const here = path.dirname(fileURLToPath(import.meta.url));
const types = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json', '.bin': 'application/octet-stream' };
const srv = http.createServer((q, r) => { const f = path.join(here, decodeURIComponent(q.url.split('?')[0])); if (!f.startsWith(here) || !fs.existsSync(f)) { r.writeHead(404); return r.end(); } r.writeHead(200, { 'content-type': types[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(r); }).listen(0);
const port = srv.address().port, launch = { args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] };
if (!fs.existsSync(chromium.executablePath()) && fs.existsSync('/opt/pw-browsers/chromium')) launch.executablePath = '/opt/pw-browsers/chromium';
const browser = await chromium.launch(launch); let fails = 0;
const check = (name, ok, info) => { console.log((ok ? 'PASS ' : 'FAIL ') + name + (info !== undefined ? '  ' + JSON.stringify(info) : '')); if (!ok) fails++; };
for (const v of ['mine', 'shaft', 'face', 'mine&old', 'cairn&place=cairn', 'chamber&place=cairn', 'lake&place=cave', 'lair&place=lair']) { const page = await browser.newPage({ viewport: { width: 480, height: 270 } }), errs = []; page.on('pageerror', e => errs.push(String(e)));
  await page.goto(`http://localhost:${port}/places.html?still&w=480&h=270&view=${v}`);
  await Promise.race([page.waitForFunction(() => window.__done, null, { timeout: 300000 }), new Promise(res => page.on('pageerror', res))]);
  check(`the ${v.replace('&old', ', worked out,').replace('&place=cairn', ' (the cairn)').replace('&place=cave', ' (the cave)').replace('&place=lair', ' (the lair)')} view renders with no page errors`, errs.length === 0, errs.slice(0, 2)); await page.close(); }
const page = await browser.newPage({ viewport: { width: 320, height: 180 } }); await page.goto(`http://localhost:${port}/places.html?still&w=320&h=180`); await page.waitForFunction(() => window.__done, null, { timeout: 300000 });
const r = await page.evaluate(async () => { const THREE = await import('three'), K = await import('./places.js'), S = await import('./pieces.js'), out = [];
  const hash = g => { let h = 0; g.traverse(m => { if (!m.isMesh) return; const a = m.geometry.attributes.position.array; for (let i = 0; i < a.length; i += 7) h = (h * 31 + Math.round(a[i] * 1e4)) | 0; }); return h; };
  for (let i = 0; i < 6; i++) { const key = 'mine:' + i, a = K.markMine({ key }, S.stream(key)), b = K.markMine({ key }, S.stream(key)), old = K.markMine({ key, worked: false }, S.stream(key));
    for (const x of [a, old]) x.group.updateMatrixWorld(true);
    const solids = x => { const L = []; x.group.traverse(m => { if (m.isMesh && !['horn', 'flame'].includes(m.name)) L.push(m); }); return L; }, all = solids(a), oldAll = solids(old);
    const cast = (o, d, list = all) => { const h = new THREE.Raycaster(new THREE.Vector3(...o), new THREE.Vector3(...d).normalize(), 0, 60).intersectObjects(list)[0]; return h ? { d: h.distance, y: h.point.y, m: h.object.name } : { d: 99, y: -99, m: null }; };
    // the sets: the clear way between the posts and under the cap, rays from the middle of each set at the hip
    const sets = a.sets.map(s => ({ w: +(cast([.0, 1, s.z], [1, 0, 0]).d + cast([0, 1, s.z], [-1, 0, 0]).d).toFixed(2), cap: +cast([0, .5, s.z], [0, 1, 0]).y.toFixed(2), foot: s.foot }));
    // the walk at every quarter metre: a floor under it, headroom, room at the hip and the head on either hand
    const walk = [], bad = []; for (let s = 0; s + 1 < a.path.length; s++) { const [x0, z0] = a.path[s], [x1, z1] = a.path[s + 1], L = Math.hypot(x1 - x0, z1 - z0), n = Math.ceil(L / .25), sx = (z1 - z0) / L, sz = -(x1 - x0) / L;
      for (let k = 0; k <= n; k++) { const x = x0 + (x1 - x0) * k / n, z = z0 + (z1 - z0) * k / n, fl = cast([x, 1, z], [0, -1, 0]), up = cast([x, .3, z], [0, 1, 0]);
        const side = Math.min(...[1, 1.7].flatMap(y => [cast([x, y, z], [sx, 0, sz]).d, cast([x, y, z], [-sx, 0, -sz]).d])), w = { x: +x.toFixed(2), z: +z.toFixed(2), floor: +fl.y.toFixed(3), head: +(up.y - fl.y).toFixed(2), side: +side.toFixed(2), m: fl.m };
        walk.push(w); if (w.floor < -.06 || w.floor > .16 || w.head < 2.1 || w.side < .3) bad.push(w); } }
    // the gallery's open side: the rail within reach at the hip and the knee, and past it the drop
    const g = a.gallery, gw = (g.x0 + g.x1) / 2, rail = [], drop = []; for (let z = a.void.z0 - .4; z > a.void.z1 + .2; z -= .5) { rail.push(Math.max(cast([gw, .95, z], [1, 0, 0]).d, cast([gw, .5, z], [1, 0, 0]).d)); drop.push(cast([a.rail + .4, -.3, z], [0, -1, 0]).d + .3); }
    // the face: the vein from the walk's end
    const [ex, ez] = a.path[a.path.length - 1], v = a.vein, reach = Math.hypot(v[0] - ex, v[2] - ez), seen = cast([ex, 1.62, ez], [v[0] - ex, v[1] - 1.62, v[2] - ez]);
    const heap = l => { let n = 0; for (let k = 0; k < 40; k++) { const x = -1.5 + (k % 8) * .42, z = a.face + .25 + Math.floor(k / 8) * .12; if (cast([x, 1, z], [0, -1, 0], l).y > .05) n++; } return n; };
    out.push({ same: hash(a.group) === hash(b.group), tris: a.tris, draws: a.draws, lamps: a.lamps.length, sets, walkN: walk.length, bad: bad.slice(0, 4), minHead: Math.min(...walk.map(w => w.head)), minSide: Math.min(...walk.map(w => w.side)),
      floors: [Math.min(...walk.map(w => w.floor)), Math.max(...walk.map(w => w.floor))], rail: +Math.max(...rail).toFixed(2), drop: +Math.min(...drop).toFixed(1), reach: +reach.toFixed(2), veinY: v[1], seen: seen.m, heap: heap(all), heapOld: heap(oldAll), oldTris: old.tris, oldLamps: old.lamps.length, horn: !!a.group.getObjectByName('horn'), oldHorn: !!old.group.getObjectByName('horn') }); }
  return out; });
const mm = (xs, f) => [Math.min(...xs.map(f)), Math.max(...xs.map(f))];
check(`the mine, 6 keys: ${mm(r, x => x.tris).join(' to ')} triangles in ${Math.max(...r.map(x => x.draws))} meshes, ${r[0].lamps} lamps; each the same twice`, r.every(x => x.same && x.tris < 40000 && x.draws <= 16));
const S = r.flatMap(x => x.sets);
check(`the adit's ${r[0].sets.length} sets: the way ${mm(S, s => s.w).join(' to ')} m wide between the posts at the hip, the cap ${mm(S, s => s.cap).join(' to ')} m up, the feet on the floor`, S.every(s => s.w >= 2.0 && s.cap >= 2.2 && s.foot === 0), S.filter(s => s.w < 2 || s.cap < 2.2).slice(0, 3));
check(`the walk, ${r[0].walkN} points from the mouth to the face: a floor under every one (${mm(r, x => x.floors[0])[0]} to ${mm(r, x => x.floors[1])[1]} m), ${Math.min(...r.map(x => x.minHead))} m of headroom or more, ${Math.min(...r.map(x => x.minSide))} m clear at the hip and the head`, r.every(x => !x.bad.length), r.map(x => x.bad).filter(b => b.length).slice(0, 2));
check(`the gallery: the rail within ${Math.max(...r.map(x => x.rail))} m of the walk on the open side, at the hip and the knee; past it a drop of ${Math.min(...r.map(x => x.drop))} m or more to the sump`, r.every(x => x.rail <= .8 && x.drop >= 14));
check(`the working face: the vein ${mm(r, x => x.reach).join(' to ')} m from the walk's end, ${mm(r, x => x.veinY).join(' to ')} m up, the first thing the eye meets toward it`, r.every(x => x.reach <= 1.4 && x.veinY >= .6 && x.veinY <= 1.8 && x.seen === 'ore'), r.map(x => x.seen));
check(`worked, the heap lies at the face's foot (${mm(r, x => x.heap).join(' to ')} of 40 points); worked out, it is gone (${Math.max(...r.map(x => x.heapOld))})`, r.every(x => x.heap >= 8 && x.heapOld === 0));
check(`the light (#305, 2 A): worked, ${Math.min(...r.map(x => x.lamps))} lamps lit; worked out, ${Math.max(...r.map(x => x.oldLamps))} lamps and no lit horn anywhere`, r.every(x => x.lamps >= 6 && x.horn && x.oldLamps === 0 && !x.oldHorn));
// the Gatelands' round cairn (Session 869; widened in Session 884): 3 keys, each the same twice and in budget; the passage 1.9 m clear or
// more under lintels of 2.5 m or more over its rising floor; the walk from the approach round the entrance stone, in at the door and up to the back recess with
// a floor under every quarter metre (within 8 cm of the floor's line), 2.1 m of headroom and 0.3 m clear; closed: of 1,200 rays from
// inside, none gets out but through the door; three empty basins, one in each recess; carved, the spirals are there, and plain, none.
const c = await page.evaluate(async () => { const THREE = await import('three'), K = await import('./places.js'), S = await import('./pieces.js'), out = [];
  const hash = g => { let h = 0; g.traverse(m => { if (!m.isMesh) return; const a = m.geometry.attributes.position.array; for (let i = 0; i < a.length; i += 7) h = (h * 31 + Math.round(a[i] * 1e4)) | 0; }); return h; };
  for (let i = 0; i < 3; i++) { const key = 'cairn:' + i, a = K.gatelandsCairn({ key }, S.stream(key)), b = K.gatelandsCairn({ key }, S.stream(key)), plain = K.gatelandsCairn({ key, carved: false }, S.stream(key));
    a.group.updateMatrixWorld(true); const all = []; a.group.traverse(m => { if (m.isMesh) all.push(m); });
    const cast = (o, d) => { const h = new THREE.Raycaster(new THREE.Vector3(...o), new THREE.Vector3(...d).normalize(), 0, 80).intersectObjects(all)[0]; return h ? { d: h.distance, y: h.point.y, m: h.object.name, p: h.point } : { d: 99, y: -99, m: null }; };
    const pas = []; for (let z = a.door.z - .5; z > a.door.z - a.passage.len + .35; z -= .5) { const f = a.floorAt(z); pas.push({ z: +z.toFixed(1), w: +(cast([0, f + 1, z], [1, 0, 0]).d + cast([0, f + 1, z], [-1, 0, 0]).d).toFixed(2), lintel: +(cast([0, f + .3, z], [0, 1, 0]).y - f).toFixed(2) }); }
    const walk = [], bad = []; for (let s = 0; s + 1 < a.path.length; s++) { const [x0, z0] = a.path[s], [x1, z1] = a.path[s + 1], L = Math.hypot(x1 - x0, z1 - z0), n = Math.ceil(L / .25), sx = (z1 - z0) / L, sz = -(x1 - x0) / L;
      for (let k = 0; k <= n; k++) { const x = x0 + (x1 - x0) * k / n, z = z0 + (z1 - z0) * k / n, f0 = a.floorAt(z), fl = cast([x, f0 + 1, z], [0, -1, 0]), up = cast([x, f0 + .3, z], [0, 1, 0]);
        const side = Math.min(...[1, 1.7].flatMap(y => [cast([x, f0 + y, z], [sx, 0, sz]).d, cast([x, f0 + y, z], [-sx, 0, -sz]).d])), w = { x: +x.toFixed(2), z: +z.toFixed(2), off: +(fl.y - f0).toFixed(3), head: fl.m ? +(up.y - fl.y).toFixed(2) : 99, side: +side.toFixed(2), m: fl.m };
        if (fl.m === null && f0 === 0) w.off = 0; walk.push(w); if (Math.abs(w.off) > .08 || w.head < 2.1 || w.side < .3) bad.push(w); } }
    // closed: rays from four points inside; one that gets out must leave by the door
    let rays = 0, out_ = 0, door = 0; const r = S.stream('rays' + i);
    for (const [px, py, pz] of [[0, a.chamber.y + 1.2, 0], [2.6 * a.chamber.s, a.chamber.y + 1, 0], [0, a.chamber.y + 3.5, .2], [0, a.floorAt(7) + 1.2, 7]]) for (let k = 0; k < 300; k++) { const u = r() * 2 - 1, t = r() * Math.PI * 2, d = [Math.sqrt(1 - u * u) * Math.cos(t), u, Math.sqrt(1 - u * u) * Math.sin(t)]; rays++;
      if (cast([px, py, pz], d).m) continue; const tz = (a.door.z - pz) / d[2], x = px + d[0] * tz, y = py + d[1] * tz; if (d[2] > 0 && Math.abs(x) < a.door.x1 + .05 && y < a.door.lintel + .05) door++; else { out_++; if (!window.__esc) window.__esc = []; window.__esc.push([px, py, pz, ...d].map(v => +v.toFixed(2))); } }
    const basinsEmpty = a.basins.map(([x, y, z]) => { const h = cast([x, y + 1, z], [0, -1, 0]); return +(h.y - (y - .26)).toFixed(2); });
    out.push({ same: hash(a.group) === hash(b.group), tris: a.tris, draws: a.draws, kerb: a.kerb, pas, walkN: walk.length, bad: bad.slice(0, 4), minHead: Math.min(...walk.map(w => w.head)), minSide: Math.min(...walk.map(w => w.side)),
      offs: [Math.min(...walk.map(w => w.off)), Math.max(...walk.map(w => w.off))], rays, out: out_, door, basins: a.basins.length, basinsEmpty, grooves: !!a.group.getObjectByName('groove'), plainGrooves: !!plain.group.getObjectByName('groove'), vault: a.chamber.vault, top: a.top, esc: (window.__esc || []).splice(0) }); }
  return out; });
check(`the cairn, 3 keys: ${mm(c, x => x.tris).join(' to ')} triangles in ${Math.max(...c.map(x => x.draws))} meshes, ${c[0].kerb} kerbstones, ${c[0].top} m high; each the same twice`, c.every(x => x.same && x.tris < 60000 && x.draws <= 10));
const P = c.flatMap(x => x.pas);
check(`the passage, ${c[0].pas.length} stations: ${mm(P, p => p.w).join(' to ')} m clear between the slabs at the hip, the lintels ${mm(P, p => p.lintel).join(' to ')} m over the floor`, P.every(p => p.w >= 1.9 && p.lintel >= 2.5), P.filter(p => p.w < 1.9 || p.lintel < 2.5).slice(0, 3));
check(`the cairn's walk, ${c[0].walkN} points from the approach to the back recess: the floor on its line (${mm(c, x => x.offs[0])[0]} to ${mm(c, x => x.offs[1])[1]} m), ${Math.min(...c.map(x => x.minHead))} m of headroom or more, ${Math.min(...c.map(x => x.minSide))} m clear`, c.every(x => !x.bad.length), c.map(x => x.bad).filter(b => b.length).slice(0, 2));
check(`closed: of ${c[0].rays} rays from inside, ${Math.max(...c.map(x => x.out))} get out but by the door (${mm(c, x => x.door).join(' to ')} by the door); the vault's capstone at ${c[0].vault} m`, c.every(x => x.out === 0), c.flatMap(x => x.esc).slice(0, 6));
check(`the basins: ${c[0].basins}, one in each recess, empty (the dish ${mm(c.flatMap(x => x.basinsEmpty), v => v).join(' to ')} m over the floor at the middle)`, c.every(x => x.basins === 3 && x.basinsEmpty.every(v => v > .05 && v < .2)));
check(`the carving: spirals with o.carved, none plain`, c.every(x => x.grooves && !x.plainGrooves));
// the limestone cave (Session 872; the hall rebuilt in Session 882): 3 keys, each the same twice and in budget; the hall's measure (a ray
// each way from its middle); the walk from the mouth down the passage, over the ledge, down the ramp, along the shore and over the bridge
// to the shelf, with the floor where walkY says under every quarter metre, 0.3 m or more over the water, 2.1 m of headroom and 0.3 m
// clear at the hip and the head; closed: of 1,440 rays from inside, none gets out but by the mouth or up the shaft; the lake 2.5 m deep or
// more in its middle and the falls landing in it; the day comes down the shaft onto the pool; the bridge clear of the water; the columns
// floor to roof; the flowers on the ground by the pools.
const V = await page.evaluate(async () => { const THREE = await import('three'), K = await import('./places.js'), S = await import('./pieces.js'), out = [];
  const hash = g => { let h = 0; g.traverse(m => { if (!m.isMesh) return; const a = m.geometry.attributes.position.array; for (let i = 0; i < a.length; i += 7) h = (h * 31 + Math.round(a[i] * 1e4)) | 0; }); return h; };
  for (let i = 0; i < 3; i++) { const key = 'cave:' + i, a = K.gatelandsCave({ key }, S.stream(key)), b = K.gatelandsCave({ key }, S.stream(key)); a.group.updateMatrixWorld(true);
    const solid = []; a.group.traverse(m => { if (m.isMesh && !['lake', 'pool', 'fall', 'foam', 'mist', 'petal', 'stalk'].includes(m.name)) solid.push(m); });
    const cast = (o, d, only) => { const h = new THREE.Raycaster(new THREE.Vector3(...o), new THREE.Vector3(...d).normalize(), 0, 120).intersectObjects(only ? solid.filter(m => only.includes(m.name)) : solid)[0]; return h ? { d: h.distance, y: h.point.y, m: h.object.name } : null; };
    const C = a.chamber, zm = (C.z0 + C.z1) / 2, hx = [cast([0, 8, zm], [1, 0, 0]), cast([0, 8, zm], [-1, 0, 0])], hy = cast([0, 2, zm], [0, 1, 0]);
    const hall = { width: +(hx[0].d + hx[1].d).toFixed(1), height: +(hy.y - a.walkY(0, zm)).toFixed(1), length: +(C.z0 - C.z1).toFixed(0) };
    const walk = [], bad = []; for (let s = 0; s + 1 < a.path.length; s++) { const [x0, z0] = a.path[s], [x1, z1] = a.path[s + 1], L = Math.hypot(x1 - x0, z1 - z0), n = Math.ceil(L / .25), sx = (z1 - z0) / L, sz = -(x1 - x0) / L;
      for (let k = 0; k <= n; k++) { const x = x0 + (x1 - x0) * k / n, z = z0 + (z1 - z0) * k / n, wy = a.walkY(x, z), fl = cast([x, wy + 1.2, z], [0, -1, 0]), up = cast([x, wy + .3, z], [0, 1, 0]);
        const side = Math.min(...[1, 1.7].flatMap(y => [cast([x, wy + y, z], [sx, 0, sz]), cast([x, wy + y, z], [-sx, 0, -sz])].map(h => h ? h.d : 99)));
        const w = { x: +x.toFixed(2), z: +z.toFixed(2), want: +wy.toFixed(2), off: fl ? +(fl.y - wy).toFixed(3) : -9, head: up ? +(up.y - wy).toFixed(2) : 99, side: +side.toFixed(2) }; walk.push(w);
        if (Math.abs(w.off) > .08 || wy - a.lake.y < .3 || w.head < 2.1 || w.side < .3) bad.push(w); } }
    let rays = 0, leak = 0, mouth = 0, shaft = 0; const leakAt = [], rr = S.stream('caverays' + i), M = a.mouth;
    for (const [px, py, pz] of [[0, M.y0 + 2, -7], [0, M.y0 + 2, C.z0 - 4], [8, 3, C.z0 - 20], [-8, 6, zm], [6, 4, C.z1 + 14], [a.falls.x + 3, 5, a.falls.z + 3]]) for (let k = 0; k < 240; k++) { const u = rr() * 2 - 1, t = rr() * Math.PI * 2, d = [Math.sqrt(1 - u * u) * Math.cos(t), u, Math.sqrt(1 - u * u) * Math.sin(t)]; rays++;
      if (cast([px, py, pz], d)) continue; const ty = (a.shaft.top - .5 - py) / d[1], tz = (0 - pz) / d[2];
      if (d[1] > 0 && Math.hypot(px + d[0] * ty - a.shaft.x, pz + d[2] * ty - a.shaft.z) < a.shaft.r + .6) shaft++; else if (d[2] > 0 && Math.abs(px + d[0] * tz) < M.x1 + .6 && py + d[1] * tz > M.y0 - 1.5 && py + d[1] * tz < M.y0 + M.h + .6) mouth++; else { leak++; if (leakAt.length < 3) leakAt.push([px, py, pz, ...d.map(v => +v.toFixed(2))]); } }
    const mid = cast([(a.lake.x0 + a.lake.x1) / 2, 2, (a.lake.z0 + a.lake.z1) / 2], [0, -1, 0], ['bed']), deep = mid ? +(a.lake.y - mid.y).toFixed(2) : 0;
    const foot = cast([a.falls.x, 2, a.falls.z], [0, -1, 0]), fallsIn = foot ? +(a.lake.y - foot.y).toFixed(2) : 0;
    const sky = !cast([a.falls.x + .3, a.lake.y + .2, a.falls.z + .3], [0, 1, 0]);
    const Bm = (a.bridge.x0 + a.bridge.x1) / 2, bridgeGap = +(a.bridge.under - a.lake.y).toFixed(2), bridgeDeck = cast([Bm, 3, a.bridge.z], [0, -1, 0]);
    const cols = a.columns.map(([x, z, r]) => { const up = cast([x + r * 3, 1.5, z], [-1, 0, 0]); return up && up.d < r * 3 ? 1 : 0; });
    const fl = a.flowers.map(([x, , z, gy]) => { const g = cast([x + .01, gy + .6, z + .01], [0, -1, 0], ['bed', 'skin']); return { off: g ? +(g.y - gy).toFixed(3) : -9 }; });
    out.push({ same: hash(a.group) === hash(b.group), tris: a.tris, draws: a.draws, hall, walkN: walk.length, bad: bad.slice(0, 4), minHead: Math.min(...walk.map(w => w.head)), minSide: Math.min(...walk.map(w => w.side)), offs: [Math.min(...walk.map(w => w.off)), Math.max(...walk.map(w => w.off))],
      rise: +(Math.max(...walk.map(w => w.want)) - Math.min(...walk.map(w => w.want))).toFixed(2), rays, leak, mouth, shaft, leakAt, deep, fallsIn, sky, bridgeGap, bridgeDeck: bridgeDeck ? +bridgeDeck.y.toFixed(2) : -9, cols: cols.reduce((p, q) => p + q, 0), colsN: cols.length,
      flowers: fl.length, flowerOff: [Math.min(...fl.map(f => f.off)), Math.max(...fl.map(f => f.off))], pools: a.pools }); }
  return out; });
check(`the cave, 3 keys: ${mm(V, x => x.tris).join(' to ')} triangles in ${Math.max(...V.map(x => x.draws))} meshes; each the same twice`, V.every(x => x.same && x.tris < 160000 && x.draws <= 14));
check(`the cave's hall: ${mm(V, x => x.hall.length)[0]} m long, ${mm(V, x => x.hall.width).join(' to ')} m across 8 m up and ${mm(V, x => x.hall.height).join(' to ')} m from floor to roof at its middle`, V.every(x => x.hall.width >= 30 && x.hall.height >= 18 && x.hall.length >= 60));
check(`the cave's walk, ${V[0].walkN} points from the mouth over the ledge, down the ramp, along the shore and over the bridge: the floor ${mm(V, x => x.offs[0])[0]} to ${mm(V, x => x.offs[1])[1]} m off its line (it falls ${V[0].rise} m), ${Math.min(...V.map(x => x.minHead))} m of headroom, ${Math.min(...V.map(x => x.minSide))} m clear`, V.every(x => !x.bad.length), V.map(x => x.bad).filter(b => b.length).slice(0, 2));
check(`the cave closed: of ${V[0].rays} rays from inside, ${Math.max(...V.map(x => x.leak))} get out but by the mouth (${mm(V, x => x.mouth).join(' to ')}) or up the shaft (${mm(V, x => x.shaft).join(' to ')})`, V.every(x => x.leak === 0), V.map(x => x.leakAt).filter(l => l.length).slice(0, 2));
check(`the lake ${mm(V, x => x.deep).join(' to ')} m deep in its middle; the falls land in ${mm(V, x => x.fallsIn).join(' to ')} m of water; the day comes down the shaft onto the pool`, V.every(x => x.deep >= 2.5 && x.fallsIn >= .5 && x.sky));
check(`the bridge: its deck ${mm(V, x => x.bridgeDeck).join(' to ')} m up at its middle, ${mm(V, x => x.bridgeGap).join(' to ')} m of air under it over the water; the columns, ${V[0].colsN}, stand on the floor`, V.every(x => x.bridgeDeck > .6 && x.bridgeGap >= .6 && x.cols === x.colsN));
check(`the flowers: ${mm(V, x => x.flowers).join(' to ')} by ${mm(V, x => x.pools).join(' to ')} rimstone pools, on the ground (${mm(V, x => x.flowerOff[0])[0]} to ${mm(V, x => x.flowerOff[1])[1]} m off it)`, V.every(x => x.flowers > 10 && x.flowerOff[0] > -.03 && x.flowerOff[1] < .03));
// the smugglers' lair (Session 873; rebuilt in Session 883): 3 keys, each the same twice and in budget; the cave's measure; the walk from
// the land over the landing, down the deck under the gallery and out along the jetty to the T-head with the deck under every quarter metre,
// 2.1 m of headroom and 0.3 m clear; closed: of 1,440 rays from inside none gets out but by the passage, the sea arch or the escape
// tunnel; the ladder from the rock to the ledge and 2.0 m or more of headroom in the tunnel; the storeroom's door 0.9 by 1.9 m or more and
// clear; held, its lanterns lit and the sloop alongside the T-head; empty, no lantern and no sloop.
const Lr = await page.evaluate(async () => { const THREE = await import('three'), K = await import('./places.js'), S = await import('./pieces.js'), out = [];
  const hash = g => { let h = 0; g.traverse(m => { if (!m.isMesh) return; const a = m.geometry.attributes.position.array; for (let i = 0; i < a.length; i += 7) h = (h * 31 + Math.round(a[i] * 1e4)) | 0; }); return h; };
  for (let i = 0; i < 3; i++) { const key = 'lair:' + i, a = K.smugglersLair({ key }, S.stream(key)), b = K.smugglersLair({ key }, S.stream(key)), e = K.smugglersLair({ key, held: false }, S.stream(key)); a.group.updateMatrixWorld(true);
    const solid = []; a.group.traverse(m => { if (m.isMesh && !['sea', 'horn'].includes(m.name)) solid.push(m); });
    const cast = (o, d) => { const h = new THREE.Raycaster(new THREE.Vector3(...o), new THREE.Vector3(...d).normalize(), 0, 120).intersectObjects(solid)[0]; return h ? { d: h.distance, x: h.point.x, y: h.point.y, m: h.object.name } : null; };
    const C = a.chamber, zm = (C.z0 + C.z1) / 2, hx = [cast([0, 6, zm], [1, 0, 0]), cast([0, 6, zm], [-1, 0, 0])], hy = cast([-5, .2, zm + 8], [0, 1, 0]) /* open water, clear of the jetty and the sloop */;
    const hall = { width: hx[0] && hx[1] ? +(hx[0].d + hx[1].d).toFixed(1) : 0, height: hy ? +hy.y.toFixed(1) : 0, length: +(C.z0 - C.z1).toFixed(0) };
    const D = a.deck, walk = [], bad = []; for (let s = 0; s + 1 < a.path.length; s++) { const [x0, z0] = a.path[s], [x1, z1] = a.path[s + 1], L = Math.hypot(x1 - x0, z1 - z0), n = Math.ceil(L / .25), sx = (z1 - z0) / L, sz = -(x1 - x0) / L;
      for (let k = 0; k <= n; k++) { const x = x0 + (x1 - x0) * k / n, z = z0 + (z1 - z0) * k / n, fl = cast([x, D + 1, z], [0, -1, 0]), up = cast([x, D + .3, z], [0, 1, 0]);
        const side = Math.min(...[1, 1.7].flatMap(y => [cast([x, D + y, z], [sx, 0, sz]), cast([x, D + y, z], [-sx, 0, -sz])].map(h => h ? h.d : 99)));
        const w = { x: +x.toFixed(2), z: +z.toFixed(2), floor: fl ? +(fl.y - D).toFixed(3) : -9, head: up ? +(up.y - D).toFixed(2) : 99, side: +side.toFixed(2) }; walk.push(w); if (Math.abs(w.floor) > .08 || w.head < 2.1 || w.side < .3) bad.push(w); } }
    let rays = 0, leak = 0, ways = [0, 0, 0]; const leakAt = [], rr = S.stream('lairrays' + i), M = a.mouth, X = a.escape;
    for (const [px, py, pz] of [[0, 3, C.z0 - 2], [-8, 3, C.z0 - 14], [3, 5, zm], [-4, 2.5, a.jetty.z - 8], [6, 3, C.z1 + 8], [0, 9, zm + 6]]) for (let k = 0; k < 240; k++) { const u = rr() * 2 - 1, t = rr() * Math.PI * 2, d = [Math.sqrt(1 - u * u) * Math.cos(t), u, Math.sqrt(1 - u * u) * Math.sin(t)]; rays++;
      if (cast([px, py, pz], d)) continue; const at = (ax, v) => { const tt = (v - [px, py, pz][ax]) / d[ax]; return tt > 0 ? [px + d[0] * tt, py + d[1] * tt, pz + d[2] * tt] : null; };
      const p1 = d[2] > 0 && at(2, 0), p2 = d[2] < 0 && at(2, C.z1 + .3) /* judged at the arch's own wall, before the ray spreads */, p3 = d[0] > 0 && at(0, X.xPlane);
      if (p1 && Math.abs(p1[0] - M.x) < M.w / 2 + .6 && p1[1] < M.y0 + M.h + .6) ways[0]++; else if (p2 && Math.abs(p2[0]) < a.arch.w / 2 + 1 && p2[1] < a.arch.h + 1) ways[1]++;
      else if (p3 && Math.abs(p3[2] - X.z) < X.w / 2 + .5 && p3[1] > X.y - .4 && p3[1] < X.y + X.h + .5) ways[2]++; else { leak++; if (leakAt.length < 3) leakAt.push([px, py, pz, ...d.map(v => +v.toFixed(2))]); } }
    const L = a.ladder, foot = cast([L.x - .4, L.y0 + 1, L.z], [0, -1, 0]), ledge = cast([L.x + .35, L.y1 + 1, L.z], [0, -1, 0]), tun = cast([X.x0 + 3, X.y + .2, X.z], [0, 1, 0]), tunF = cast([X.x0 + 3, X.y + 1, X.z], [0, -1, 0]);
    const dr = a.door, thru = cast([dr.x + 1.0, a.deck + 1.0, dr.z], [-1, 0, 0]);
    const J = a.jetty, gap = a.ship ? cast([J.x1 + .02, .6, a.ship.z], [1, 0, 0]) : null;
    out.push({ same: hash(a.group) === hash(b.group), tris: a.tris, draws: a.draws, hall, walkN: walk.length, bad: bad.slice(0, 4), minHead: Math.min(...walk.map(w => w.head)), minSide: Math.min(...walk.map(w => w.side)), floors: [Math.min(...walk.map(w => w.floor)), Math.max(...walk.map(w => w.floor))],
      rays, leak, ways, leakAt, foot: foot ? +(foot.y - L.y0).toFixed(2) : -9, ledge: ledge ? +(ledge.y - L.y1).toFixed(2) : -9, rise: +(L.y1 - L.y0).toFixed(2), tunnel: tun && tunF ? +(tun.y - tunF.y).toFixed(2) : 0, door: [dr.w, dr.h], thru: thru ? +(thru.d - 1.0).toFixed(2) : 99,
      lamps: a.lamps.length, empty: e.lamps.length, gap: gap ? +gap.d.toFixed(2) : 99, gapM: gap ? gap.m : '', emptyShip: !!e.ship }); }
  return out; });
check(`the lair, 3 keys: ${mm(Lr, x => x.tris).join(' to ')} triangles in ${Math.max(...Lr.map(x => x.draws))} draws (the sloop's among them); each the same twice`, Lr.every(x => x.same && x.tris < 160000 && x.draws <= 30));
check(`the lair's cave: ${Lr[0].hall.length} m long, ${mm(Lr, x => x.hall.width).join(' to ')} m across 6 m up, ${mm(Lr, x => x.hall.height).join(' to ')} m from the sea to the roof near its middle`, Lr.every(x => x.hall.length >= 50 && x.hall.width >= 28 && x.hall.height >= 13));
check(`the lair's walk, ${Lr[0].walkN} points from the land over the landing, down the deck under the gallery and out to the T-head: the deck under every one (${mm(Lr, x => x.floors[0])[0]} to ${mm(Lr, x => x.floors[1])[1]} m), ${Math.min(...Lr.map(x => x.minHead))} m of headroom, ${Math.min(...Lr.map(x => x.minSide))} m clear`, Lr.every(x => !x.bad.length), Lr.map(x => x.bad).filter(b => b.length).slice(0, 2));
check(`the lair closed: of ${Lr[0].rays} rays from inside, ${Math.max(...Lr.map(x => x.leak))} get out but by the passage, the sea arch or the escape tunnel (${Lr[0].ways.join(', ')})`, Lr.every(x => x.leak === 0), Lr.map(x => x.leakAt).filter(l => l.length).slice(0, 2));
check(`the escape: the ladder rises ${Lr[0].rise} m from the rock (${mm(Lr, x => x.foot).join(' to ')} m) to the ledge (${mm(Lr, x => x.ledge).join(' to ')} m), ${Math.min(...Lr.map(x => x.tunnel))} m of headroom in the tunnel`, Lr.every(x => Math.abs(x.foot) < .08 && Math.abs(x.ledge) < .08 && x.tunnel >= 2.0));
check(`the storeroom's door ${Lr[0].door.join(' by ')} m, clear ${Math.min(...Lr.map(x => x.thru))} m in; held, ${Lr[0].lamps} lanterns lit and the sloop ${mm(Lr, x => x.gap).join(' to ')} m off the T-head; empty, ${Math.max(...Lr.map(x => x.empty))} lanterns and no sloop`, Lr.every(x => x.door[0] >= .9 && x.door[1] >= 1.9 && x.thru >= .5 && x.lamps >= 6 && x.empty === 0 && x.gap > .05 && x.gap < 1.2 && !x.emptyShip), Lr.map(x => [x.gap, x.gapM]));
await page.close();
if (process.argv.includes('--shots')) for (const q of ['view=mine', 'view=gallery', 'view=face', 'view=adit', 'view=face&old', 'view=mine&old', 'place=cairn&view=cairn', 'place=cairn&view=door', 'place=cairn&view=passage', 'place=cairn&view=chamber', 'place=cairn&view=vault', 'place=cave&view=lake', 'place=cave&view=shore', 'place=cave&view=falls', 'place=cave&view=bridge', 'place=cave&view=passage', 'place=lair&view=lair', 'place=lair&view=jetty', 'place=lair&view=store', 'place=lair&view=escape', 'place=lair&view=deck']) { const name = 'places-' + q.replace('place=cairn&view=', 'cairn-').replace('place=cave&view=', 'cave-').replace('place=lair&view=', 'lair-').replace('view=', '').replace('&', '-'); console.log(execFileSync('node', [path.join(here, 'shoot.mjs'), '--page=places.html', '--name=' + name, '--q=' + q]).toString().split('{')[0]); }
await browser.close(); srv.close(); console.log(fails ? `${fails} FAILED` : 'all passed'); process.exit(fails ? 1 : 0);
