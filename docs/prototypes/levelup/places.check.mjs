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
for (const v of ['mine', 'shaft', 'face', 'mine&old']) { const page = await browser.newPage({ viewport: { width: 480, height: 270 } }), errs = []; page.on('pageerror', e => errs.push(String(e)));
  await page.goto(`http://localhost:${port}/places.html?still&w=480&h=270&view=${v}`);
  await Promise.race([page.waitForFunction(() => window.__done, null, { timeout: 300000 }), new Promise(res => page.on('pageerror', res))]);
  check(`the ${v.replace('&old', ', worked out,')} view renders with no page errors`, errs.length === 0, errs.slice(0, 2)); await page.close(); }
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
await page.close();
if (process.argv.includes('--shots')) for (const q of ['view=mine', 'view=gallery', 'view=face', 'view=adit', 'view=face&old', 'view=mine&old']) { const name = 'places-' + q.replace('view=', '').replace('&', '-'); console.log(execFileSync('node', [path.join(here, 'shoot.mjs'), '--page=places.html', '--name=' + name, '--q=' + q]).toString().split('{')[0]); }
await browser.close(); srv.close(); console.log(fails ? `${fails} FAILED` : 'all passed'); process.exit(fails ? 1 : 0);
