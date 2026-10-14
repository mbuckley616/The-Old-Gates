// node docs/prototypes/levelup/rooms.check.mjs [--shots] (Session 852): rooms.js's Gatelands cottage in the test Chromium.
// 6 keys, each the same twice and in budget; every piece of furniture inside the shell's inner walls, under the roof, and clear of
// the others; the way from the front door round the jamb wall to the hearthstone clear by 0.15 m; a person fits (the box bed 1.85 m
// or more inside, the table 0.72 to 0.78 m, seats 0.40 to 0.47 m, the inner doors 1.9 m or more); the fire in its hearth; and in the
// morning the sun through every kitchen window lands inside the room (at noon the thatch's eave and the deep wall keep it on the sill). --shots writes rooms-kitchen, -table, -dresser, -outside and the
// kitchen at morning, golden and night.
import { chromium } from 'playwright'; import http from 'http'; import fs from 'fs'; import path from 'path'; import { fileURLToPath } from 'url';
import { execFileSync } from 'child_process';
const here = path.dirname(fileURLToPath(import.meta.url));
const types = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json', '.bin': 'application/octet-stream' };
const srv = http.createServer((q, r) => { const f = path.join(here, decodeURIComponent(q.url.split('?')[0])); if (!f.startsWith(here) || !fs.existsSync(f)) { r.writeHead(404); return r.end(); } r.writeHead(200, { 'content-type': types[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(r); }).listen(0);
const port = srv.address().port, launch = { args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] };
if (!fs.existsSync(chromium.executablePath()) && fs.existsSync('/opt/pw-browsers/chromium')) launch.executablePath = '/opt/pw-browsers/chromium';
const browser = await chromium.launch(launch); let fails = 0;
const check = (name, ok, info) => { console.log((ok ? 'PASS ' : 'FAIL ') + name + (info !== undefined ? '  ' + JSON.stringify(info) : '')); if (!ok) fails++; };
for (const v of ['kitchen', 'outside', 'hall&room=longhouse']) { const page = await browser.newPage({ viewport: { width: 480, height: 270 } }), errs = []; page.on('pageerror', e => errs.push(String(e)));
  await page.goto(`http://localhost:${port}/rooms.html?still&w=480&h=270&view=${v}`);
  await Promise.race([page.waitForFunction(() => window.__done, null, { timeout: 300000 }), new Promise(res => page.on('pageerror', res))]);
  check(`the ${v} view renders with no page errors`, errs.length === 0, errs.slice(0, 2)); await page.close(); }
const page = await browser.newPage({ viewport: { width: 320, height: 180 } }); await page.goto(`http://localhost:${port}/rooms.html?still&w=320&h=180`); await page.waitForFunction(() => window.__done, null, { timeout: 300000 });
const r = await page.evaluate(async () => { const THREE = await import('three'), K = await import('./rooms.js'), S = await import('./pieces.js'), out = [];
  const hash = g => { let h = 0; g.traverse(m => { if (!m.isMesh) return; const a = m.geometry.attributes.position.array; for (let i = 0; i < a.length; i += 7) h = (h * 31 + Math.round(a[i] * 1e4)) | 0; }); return h; };
  for (let i = 0; i < 6; i++) { const a = K.gatelandsCottage({}, S.stream('cottage:' + i)), b = K.gatelandsCottage({}, S.stream('cottage:' + i)); a.group.updateMatrixWorld(true);
    const I = a.inner, e = .015, B = a.boxes, outside = B.filter(q => q.x0 < I.x0 - e || q.x1 > I.x1 + e || q.z0 < I.z0 - e || q.z1 > I.z1 + e).map(q => q.tag);
    let above = 0; a.room.traverse(m => { if (!m.isMesh) return; const P = m.geometry.attributes.position; for (let k = 0; k < P.count; k++) { const z = P.getZ(k), y = P.getY(k), x = P.getX(k);
      if (Math.abs(x) > I.x1 + .06 || Math.abs(z) > I.z1 + .06 || y > a.under + .2) { above++; if (!a.bad) a.bad = [m.name, +x.toFixed(2), +y.toFixed(2), +z.toFixed(2)]; } } });
    const solid = B.filter(q => !['hearthstone'].includes(q.tag)), overl = []; for (let p = 0; p < solid.length; p++) for (let q = p + 1; q < solid.length; q++) { const A = solid[p], C = solid[q]; if (A.tag === C.tag) continue;
      if (A.x0 < C.x1 - e && C.x0 < A.x1 - e && A.z0 < C.z1 - e && C.z0 < A.z1 - e && A.y0 < C.y1 - e && C.y0 < A.y1 - e) overl.push(A.tag + '/' + C.tag); }
    let blocked = []; for (let s = 0; s + 1 < a.path.length; s++) for (let k = 0; k <= 20; k++) { const [x0, z0] = a.path[s], [x1, z1] = a.path[s + 1], x = x0 + (x1 - x0) * k / 20, z = z0 + (z1 - z0) * k / 20;
      for (const q of solid) if (q.y1 > .1 && q.y0 < 1.8 && x > q.x0 - .15 && x < q.x1 + .15 && z > q.z0 - .15 && z < q.z1 + .15) blocked.push(q.tag); }
    const tb = B.find(q => q.tag === 'table'), bd = a.bed, sun = new THREE.Vector3(.5, .3, .82).normalize() /* the page's morning sun, 17° up in the south-east */, all = []; a.group.traverse(m => { if (m.isMesh && m.name !== 'pane' && !['flame', 'glow', 'ember'].includes(m.name)) all.push(m); });
    const lit = a.windows.filter(w => w.face === 'front' && w.x > -1.4 && w.x < 2.6).map(w => { let n = 0; for (let k = 1; k <= 9; k++) for (const f of [-.35, -.15, .15, .35]) { const c = new THREE.Vector3(w.x + w.w * f, w.y + w.h * k / 10, w.z) /* a grid over the opening: bars, sashes and the reveal take some */, o = c.clone().addScaledVector(sun, 6), h = new THREE.Raycaster(o, sun.clone().negate()).intersectObjects(all)[0]; if (h && h.point.z < I.z1 - .05) n++; } return n; });
    out.push({ bad: a.bad, same: hash(a.group) === hash(b.group), tris: a.tris, draws: a.draws, shellTris: a.shellTris, shellCalls: a.shellCalls, outside, above, overl: [...new Set(overl)], blocked: [...new Set(blocked)],
      bedIn: +(bd.z1 - bd.z0 - .1).toFixed(2), table: tb.y1, seats: a.seats, doors: a.doors.map(d => [d.w, d.h]), front: [a.door.w, a.door.h], fire: a.fire[0] > a.hearth[0] - .56 && a.fire[0] < a.hearth[0] && Math.abs(a.fire[2] - a.hearth[2]) < .3, lit, Z: I.z1 }); }
  return out; });
const mm = (xs, f) => [Math.min(...xs.map(f)), Math.max(...xs.map(f))];
check(`the cottage, 6 keys: the room ${mm(r, x => x.tris).join(' to ')} triangles in ${Math.max(...r.map(x => x.draws))} meshes, on the shell's ${r[0].shellTris} in ${r[0].shellCalls}; each the same twice`, r.every(x => x.same && x.tris < 30000 && x.draws <= 20));
check(`every piece inside the inner walls and under the roof: ${Math.max(...r.map(x => x.outside.length))} pieces out, ${Math.max(...r.map(x => x.above))} points over the roof's underside or through a wall`, r.every(x => !x.outside.length && x.above === 0), r.some(x => x.above) ? r.map(x => x.bad) : undefined);
check(`no two pieces of furniture in each other: ${Math.max(...r.map(x => x.overl.length))} clashes`, r.every(x => !x.overl.length), r.map(x => x.overl));
check(`the way from the front door round the jamb wall to the hearthstone is clear by 0.15 m: ${Math.max(...r.map(x => x.blocked.length))} pieces in it`, r.every(x => !x.blocked.length), r.map(x => x.blocked));
check(`a person fits: the box bed ${mm(r, x => x.bedIn).join(' to ')} m inside, the table at ${r[0].table} m, seats at ${r[0].seats.join(' and ')} m, the inner doors ${r[0].doors.map(d => d.join(' by ')).join(' and ')} m, the front door ${r[0].front.join(' by ')} m`,
  r.every(x => x.bedIn >= 1.85 && x.table >= .72 && x.table <= .78 && x.seats.every(s => s >= .4 && s <= .47) && x.doors.every(([w, h]) => w >= .75 && h >= 1.9) && x.front[1] >= 1.95));
check('the fire burns in its hearth, in the recess in front of the hearth wall', r.every(x => x.fire));
check(`in the morning the sun comes in through each kitchen window: ${[...new Set(r.flatMap(x => x.lit))].join(', ')} of 36 rays over the opening land inside the room (at noon the eave and the 0.6 m wall keep the high sun on the sill)`, r.every(x => x.lit.length && x.lit.every(n => n >= 6)));
// the Markish longhouse (Session 870): 4 keys, each the same twice and in budget; every piece inside the walls and under the roof's lining;
// no two pieces in each other; the way from the front door down the left of the hearth and through the partition clear by 0.15 m, with
// 2.1 m or more under the tie beams; a person fits (benches 0.40 to 0.48 m high and 0.9 m deep or more, the bed 1.85 m or more, the
// doors 1.9 m or more); the fire on its hearth, under the louver.
const L = await page.evaluate(async () => { const K = await import('./rooms.js'), S = await import('./pieces.js'), out = [];
  const hash = g => { let h = 0; g.traverse(m => { if (!m.isMesh) return; const a = m.geometry.attributes.position.array; for (let i = 0; i < a.length; i += 7) h = (h * 31 + Math.round(a[i] * 1e4)) | 0; }); return h; };
  for (let i = 0; i < 4; i++) { const a = K.markLonghouse({}, S.stream('longhouse:' + i)), b = K.markLonghouse({}, S.stream('longhouse:' + i)), I = a.inner, e = .015, B = a.boxes, WP = a.tieBeam - .25;
    const outside = B.filter(q => q.x0 < I.x0 - e || q.x1 > I.x1 + e || q.z0 < I.z0 - e || q.z1 > I.z1 + e || q.y1 > a.under(Math.max(Math.abs(q.x0), Math.abs(q.x1))) + e).map(q => q.tag);
    let through = 0, bad = null; a.room.traverse(m => { if (!m.isMesh) return; const P = m.geometry.attributes.position; for (let k = 0; k < P.count; k++) { const x = P.getX(k), y = P.getY(k), z = P.getZ(k);
      if ((Math.abs(x) > I.x1 + .06 && y < WP - .05) || Math.abs(x) > I.x1 + .27 || Math.abs(z) > I.z1 + .06 || y > a.under(x) + .05 || y < a.floor - .9) { through++; if (!bad) bad = [m.name, +x.toFixed(2), +y.toFixed(2), +z.toFixed(2)]; } } });
    const overl = []; for (let p = 0; p < B.length; p++) for (let q = p + 1; q < B.length; q++) { const A = B[p], C = B[q]; if (A.tag === C.tag) continue;
      if (A.x0 < C.x1 - e && C.x0 < A.x1 - e && A.z0 < C.z1 - e && C.z0 < A.z1 - e && A.y0 < C.y1 - e && C.y0 < A.y1 - e) overl.push(A.tag + '/' + C.tag); }
    const blocked = []; for (let s = 0; s + 1 < a.path.length; s++) for (let k = 0; k <= 24; k++) { const [x0, z0] = a.path[s], [x1, z1] = a.path[s + 1], x = x0 + (x1 - x0) * k / 24, z = z0 + (z1 - z0) * k / 24;
      for (const q of B) if (q.y1 > a.floor + .1 && q.y0 < a.floor + 1.8 && x > q.x0 - .15 && x < q.x1 + .15 && z > q.z0 - .15 && z < q.z1 + .15) blocked.push(q.tag); }
    const H = a.hearth; out.push({ same: hash(a.group) === hash(b.group), tris: a.tris, draws: a.draws, shellTris: a.shellTris, shellCalls: a.shellCalls, outside, through, bad, overl: [...new Set(overl)], blocked: [...new Set(blocked)],
      head: +(a.tieBeam - a.floor).toFixed(2), bench: a.benches.map(q => [+(q.y - a.floor).toFixed(2), +(q.x1 - q.x0).toFixed(2)]), bed: +(a.bed.x1 - a.bed.x0).toFixed(2), doors: [[a.door.w, a.door.h], ...a.doors.map(d => [d.w, d.h])],
      fire: a.fire[0] > H.x0 && a.fire[0] < H.x1 && a.fire[2] > H.z0 && a.fire[2] < H.z1, louver: +Math.abs(a.fire[2] - a.louver).toFixed(2) }); }
  return out; });
check(`the longhouse, 4 keys: the room ${mm(L, x => x.tris).join(' to ')} triangles in ${Math.max(...L.map(x => x.draws))} meshes, on the hall's ${L[0].shellTris} in ${L[0].shellCalls}; each the same twice`, L.every(x => x.same && x.tris < 30000 && x.draws <= 20));
check(`the longhouse: every piece inside the walls and under the roof: ${Math.max(...L.map(x => x.outside.length))} pieces out, ${Math.max(...L.map(x => x.through))} points through a wall or the roof`, L.every(x => !x.outside.length && !x.through), L.map(x => x.outside.length ? x.outside : x.bad).filter(Boolean).slice(0, 2));
check(`the longhouse: no two pieces in each other: ${Math.max(...L.map(x => x.overl.length))} clashes`, L.every(x => !x.overl.length), L.map(x => x.overl).filter(o => o.length));
check(`the longhouse: the way from the front door past the hearth and through the partition is clear by 0.15 m (${Math.max(...L.map(x => x.blocked.length))} pieces in it), ${L[0].head} m under the tie beams`, L.every(x => !x.blocked.length && x.head >= 2.1), L.map(x => x.blocked).filter(o => o.length));
check(`the longhouse: a person fits: benches ${L[0].bench.map(b => b.join(' m high, ') + ' m deep').join(' and ')}, the bed ${L[0].bed} m, the doors ${L[0].doors.map(d => d.join(' by ')).join(' and ')} m`,
  L.every(x => x.bench.every(([h, d]) => h >= .4 && h <= .48 && d >= .9) && x.bed >= 1.85 && x.doors.every(([w, h]) => w >= .8 && h >= 1.9)));
check(`the longhouse: the fire on its hearth, ${Math.max(...L.map(x => x.louver))} m from under the louver`, L.every(x => x.fire && x.louver <= .6));
await page.close();
if (process.argv.includes('--shots')) for (const q of ['view=kitchen', 'view=table', 'view=dresser', 'view=outside', 'view=kitchen&hour=morning', 'view=kitchen&hour=golden', 'view=kitchen&hour=night', 'view=outside&hour=night', 'room=longhouse&view=hall', 'room=longhouse&view=hearth', 'room=longhouse&view=larder', 'room=longhouse&view=back', 'room=longhouse&view=outside', 'room=longhouse&view=hall&hour=night']) { const name = 'rooms-' + q.replace('room=longhouse&view=', 'longhouse-').replace('view=', '').replace('&hour=', '-'); console.log(execFileSync('node', [path.join(here, 'shoot.mjs'), '--page=rooms.html', '--name=' + name, '--q=' + q]).toString().split('{')[0]); }
await browser.close(); srv.close(); console.log(fails ? `${fails} FAILED` : 'all passed'); process.exit(fails ? 1 : 0);
