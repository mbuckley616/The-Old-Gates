// node docs/prototypes/levelup/places.check.mjs [--shots] (Session 857): places.js's Markish silver mine in the test Chromium.
// 6 keys, each the same twice and in budget; the adit's sets give a clear way of 2 m or more under a cap of 2.2 m or more, their feet on
// the floor; the walk from the mouth down the adit, across the landing, along the gallery and onto the ledge has a floor under it at
// every quarter metre, 2.1 m of headroom and 0.3 m clear at the hip and the head; along the gallery the rail is on the open side and past
// it the drop is 14 m or more to the sump; at the walk's end the vein is in reach (within 1.4 m, between 0.6 and 1.8 m up) and in sight;
// worked out (o.worked false) the heap is gone and no lamp is lit (Session 861). --shots writes places-mine, -gallery, -face, -adit, -face-old and -mine-old (the shaft view, a hole lit by the kibble's lamp, renders but is not shot).
import { chromium } from 'playwright'; import http from 'http'; import fs from 'fs'; import path from 'path'; import { fileURLToPath } from 'url';
import { execFileSync } from 'child_process';
const here = path.dirname(fileURLToPath(import.meta.url));
const types = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json', '.bin': 'application/octet-stream' };
const srv = http.createServer((q, r) => { const f = path.join(here, decodeURIComponent(q.url.split('?')[0])); if (!f.startsWith(here) || !fs.existsSync(f)) { r.writeHead(404); return r.end(); } r.writeHead(200, { 'content-type': types[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(r); }).listen(0);
const port = srv.address().port, launch = { args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] };
if (!fs.existsSync(chromium.executablePath()) && fs.existsSync('/opt/pw-browsers/chromium')) launch.executablePath = '/opt/pw-browsers/chromium';
const browser = await chromium.launch(launch); let fails = 0;
const check = (name, ok, info) => { console.log((ok ? 'PASS ' : 'FAIL ') + name + (info !== undefined ? '  ' + JSON.stringify(info) : '')); if (!ok) fails++; };
for (const v of ['mine', 'shaft', 'face', 'mine&old', 'cairn&place=cairn', 'chamber&place=cairn']) { const page = await browser.newPage({ viewport: { width: 480, height: 270 } }), errs = []; page.on('pageerror', e => errs.push(String(e)));
  await page.goto(`http://localhost:${port}/places.html?still&w=480&h=270&view=${v}`);
  await Promise.race([page.waitForFunction(() => window.__done, null, { timeout: 300000 }), new Promise(res => page.on('pageerror', res))]);
  check(`the ${v.replace('&old', ', worked out,').replace('&place=cairn', ' (the cairn)')} view renders with no page errors`, errs.length === 0, errs.slice(0, 2)); await page.close(); }
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
// the Gatelands' round cairn (Session 862): 3 keys, each the same twice and in budget; the passage 1.2 m clear or more under lintels of
// 2.15 m or more over its rising floor; the walk from the approach round the entrance stone, in at the door and up to the back recess with
// a floor under every quarter metre (within 8 cm of the floor's line), 2.1 m of headroom and 0.3 m clear; closed: of 1,200 rays from
// inside, none gets out but through the door; three empty basins, one in each recess; carved, the spirals are there, and plain, none.
const c = await page.evaluate(async () => { const THREE = await import('three'), K = await import('./places.js'), S = await import('./pieces.js'), out = [];
  const hash = g => { let h = 0; g.traverse(m => { if (!m.isMesh) return; const a = m.geometry.attributes.position.array; for (let i = 0; i < a.length; i += 7) h = (h * 31 + Math.round(a[i] * 1e4)) | 0; }); return h; };
  for (let i = 0; i < 3; i++) { const key = 'cairn:' + i, a = K.gatelandsCairn({ key }, S.stream(key)), b = K.gatelandsCairn({ key }, S.stream(key)), plain = K.gatelandsCairn({ key, carved: false }, S.stream(key));
    a.group.updateMatrixWorld(true); const all = []; a.group.traverse(m => { if (m.isMesh) all.push(m); });
    const cast = (o, d) => { const h = new THREE.Raycaster(new THREE.Vector3(...o), new THREE.Vector3(...d).normalize(), 0, 80).intersectObjects(all)[0]; return h ? { d: h.distance, y: h.point.y, m: h.object.name, p: h.point } : { d: 99, y: -99, m: null }; };
    const pas = []; for (let z = a.door.z - .5; z > 2.3; z -= .5) { const f = a.floorAt(z); pas.push({ z: +z.toFixed(1), w: +(cast([0, f + 1, z], [1, 0, 0]).d + cast([0, f + 1, z], [-1, 0, 0]).d).toFixed(2), lintel: +(cast([0, f + .3, z], [0, 1, 0]).y - f).toFixed(2) }); }
    const walk = [], bad = []; for (let s = 0; s + 1 < a.path.length; s++) { const [x0, z0] = a.path[s], [x1, z1] = a.path[s + 1], L = Math.hypot(x1 - x0, z1 - z0), n = Math.ceil(L / .25), sx = (z1 - z0) / L, sz = -(x1 - x0) / L;
      for (let k = 0; k <= n; k++) { const x = x0 + (x1 - x0) * k / n, z = z0 + (z1 - z0) * k / n, f0 = a.floorAt(z), fl = cast([x, f0 + 1, z], [0, -1, 0]), up = cast([x, f0 + .3, z], [0, 1, 0]);
        const side = Math.min(...[1, 1.7].flatMap(y => [cast([x, f0 + y, z], [sx, 0, sz]).d, cast([x, f0 + y, z], [-sx, 0, -sz]).d])), w = { x: +x.toFixed(2), z: +z.toFixed(2), off: +(fl.y - f0).toFixed(3), head: fl.m ? +(up.y - fl.y).toFixed(2) : 99, side: +side.toFixed(2), m: fl.m };
        if (fl.m === null && f0 === 0) w.off = 0; walk.push(w); if (Math.abs(w.off) > .08 || w.head < 2.1 || w.side < .3) bad.push(w); } }
    // closed: rays from four points inside; one that gets out must leave by the door
    let rays = 0, out_ = 0, door = 0; const r = S.stream('rays' + i);
    for (const [px, py, pz] of [[0, a.chamber.y + 1.2, 0], [2.6, a.chamber.y + 1, 0], [0, a.chamber.y + 3.5, .2], [0, a.floorAt(7) + 1.2, 7]]) for (let k = 0; k < 300; k++) { const u = r() * 2 - 1, t = r() * Math.PI * 2, d = [Math.sqrt(1 - u * u) * Math.cos(t), u, Math.sqrt(1 - u * u) * Math.sin(t)]; rays++;
      if (cast([px, py, pz], d).m) continue; const tz = (a.door.z - pz) / d[2], x = px + d[0] * tz, y = py + d[1] * tz; if (d[2] > 0 && Math.abs(x) < a.door.x1 + .05 && y < a.door.lintel + .05) door++; else { out_++; if (!window.__esc) window.__esc = []; window.__esc.push([px, py, pz, ...d].map(v => +v.toFixed(2))); } }
    const basinsEmpty = a.basins.map(([x, y, z]) => { const h = cast([x, y + 1, z], [0, -1, 0]); return +(h.y - (y - .26)).toFixed(2); });
    out.push({ same: hash(a.group) === hash(b.group), tris: a.tris, draws: a.draws, kerb: a.kerb, pas, walkN: walk.length, bad: bad.slice(0, 4), minHead: Math.min(...walk.map(w => w.head)), minSide: Math.min(...walk.map(w => w.side)),
      offs: [Math.min(...walk.map(w => w.off)), Math.max(...walk.map(w => w.off))], rays, out: out_, door, basins: a.basins.length, basinsEmpty, grooves: !!a.group.getObjectByName('groove'), plainGrooves: !!plain.group.getObjectByName('groove'), vault: a.chamber.vault, top: a.top, esc: (window.__esc || []).splice(0) }); }
  return out; });
check(`the cairn, 3 keys: ${mm(c, x => x.tris).join(' to ')} triangles in ${Math.max(...c.map(x => x.draws))} meshes, ${c[0].kerb} kerbstones, ${c[0].top} m high; each the same twice`, c.every(x => x.same && x.tris < 60000 && x.draws <= 10));
const P = c.flatMap(x => x.pas);
check(`the passage, ${c[0].pas.length} stations: ${mm(P, p => p.w).join(' to ')} m clear between the slabs at the hip, the lintels ${mm(P, p => p.lintel).join(' to ')} m over the floor`, P.every(p => p.w >= 1.2 && p.lintel >= 2.15), P.filter(p => p.w < 1.2 || p.lintel < 2.15).slice(0, 3));
check(`the cairn's walk, ${c[0].walkN} points from the approach to the back recess: the floor on its line (${mm(c, x => x.offs[0])[0]} to ${mm(c, x => x.offs[1])[1]} m), ${Math.min(...c.map(x => x.minHead))} m of headroom or more, ${Math.min(...c.map(x => x.minSide))} m clear`, c.every(x => !x.bad.length), c.map(x => x.bad).filter(b => b.length).slice(0, 2));
check(`closed: of ${c[0].rays} rays from inside, ${Math.max(...c.map(x => x.out))} get out but by the door (${mm(c, x => x.door).join(' to ')} by the door); the vault's capstone at ${c[0].vault} m`, c.every(x => x.out === 0), c.flatMap(x => x.esc).slice(0, 6));
check(`the basins: ${c[0].basins}, one in each recess, empty (the dish ${mm(c.flatMap(x => x.basinsEmpty), v => v).join(' to ')} m over the floor at the middle)`, c.every(x => x.basins === 3 && x.basinsEmpty.every(v => v > .05 && v < .2)));
check(`the carving: spirals with o.carved, none plain`, c.every(x => x.grooves && !x.plainGrooves));
await page.close();
if (process.argv.includes('--shots')) for (const q of ['view=mine', 'view=gallery', 'view=face', 'view=adit', 'view=face&old', 'view=mine&old', 'place=cairn&view=cairn', 'place=cairn&view=door', 'place=cairn&view=passage', 'place=cairn&view=chamber', 'place=cairn&view=vault']) { const name = 'places-' + q.replace('place=cairn&view=', 'cairn-').replace('view=', '').replace('&', '-'); console.log(execFileSync('node', [path.join(here, 'shoot.mjs'), '--page=places.html', '--name=' + name, '--q=' + q]).toString().split('{')[0]); }
await browser.close(); srv.close(); console.log(fails ? `${fails} FAILED` : 'all passed'); process.exit(fails ? 1 : 0);
