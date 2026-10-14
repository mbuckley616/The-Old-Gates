// node docs/prototypes/levelup/mark.check.mjs (Session 825, card F6): the Mark's halls in the test Chromium. Every hall builds
// (shingle, and turf in both looks) with its triangles and draw calls in budget and the turf's fringe at the eaves; and the
// turf is no longer a lawn: its texture's mean colour is measured against Session 819's (whose formula is kept here), for
// saturation and for how much greener than red it is (Michael on #277: "the green is too vibrant for the climate").
// Session 831, the lot rules (markLot): one turf in every run of three lots on 40 streets, none on a hall of note, the same key
// building the same hall, the turf halls the smaller and plainer, 300 lots' halls in budget; the lane page lays them out.
// --shots writes mark-lane-mix.jpg, and mark-lots-high.jpg and mark-lots-high-b.jpg (the lane from above, on two streets).
import { execFileSync } from 'child_process'; import { chromium } from 'playwright'; import http from 'http'; import fs from 'fs'; import path from 'path'; import { fileURLToPath } from 'url';
const here = path.dirname(fileURLToPath(import.meta.url));
const types = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json', '.bin': 'application/octet-stream' };
const srv = http.createServer((q, r) => { const f = path.join(here, decodeURIComponent(q.url.split('?')[0])); if (!f.startsWith(here) || !fs.existsSync(f)) { r.writeHead(404); return r.end(); } r.writeHead(200, { 'content-type': types[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(r); }).listen(0);
const port = srv.address().port, launch = { args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] };
if (!fs.existsSync(chromium.executablePath()) && fs.existsSync('/opt/pw-browsers/chromium')) launch.executablePath = '/opt/pw-browsers/chromium';
const browser = await chromium.launch(launch); let fails = 0;
const check = (name, ok, info) => { console.log((ok ? 'PASS ' : 'FAIL ') + name + (info !== undefined ? '  ' + JSON.stringify(info) : '')); if (!ok) fails++; };
const page = await browser.newPage({ viewport: { width: 640, height: 360 } }), errs = []; page.on('pageerror', e => errs.push(String(e)));
await page.goto(`http://localhost:${port}/mark.html?still&w=640&h=360&nopeople`); await page.waitForFunction(() => window.__done || window.__err, null, { timeout: 300000 });
const r = await page.evaluate(async () => { const P = await import('./pieces.js'), C = await import('./common.js'), out = { halls: [], tex: {} };
  // the mean colour of a texture, and its saturation (HSL) and green-over-red
  const stats = img => { const c = document.createElement('canvas'); c.width = img.width; c.height = img.height; const x = c.getContext('2d'); x.drawImage(img, 0, 0); const d = x.getImageData(0, 0, c.width, c.height).data; let R = 0, G = 0, B = 0, S = 0, n = d.length / 4;
    for (let i = 0; i < d.length; i += 4) { const r = d[i] / 255, g = d[i + 1] / 255, b = d[i + 2] / 255, mx = Math.max(r, g, b), mn = Math.min(r, g, b), l = (mx + mn) / 2; S += mx === mn ? 0 : (mx - mn) / (1 - Math.abs(2 * l - 1)); R += r; G += g; B += b; }
    return { rgb: [R / n, G / n, B / n].map(v => +v.toFixed(3)), sat: +(S / n).toFixed(3), greenOverRed: +((G - R) / n).toFixed(3) }; };
  // Session 819's turf, its formula as it was
  const tn = (x, y, f, s = 0) => { const X = x * f, Y = y * f, i = Math.floor(X), j = Math.floor(Y), u = X - i, v = Y - j, h = (a, b) => { a = ((a % f) + f) % f; b = ((b % f) + f) % f; let n = a * 374761393 + b * 668265263 + s * 982451653; n = (n ^ (n >>> 13)) * 1274126177; return ((n ^ (n >>> 16)) >>> 0) / 4294967295; }; const sm = t => t * t * (3 - 2 * t); return (h(i, j) * (1 - sm(u)) + h(i + 1, j) * sm(u)) * (1 - sm(v)) + (h(i, j + 1) * (1 - sm(u)) + h(i + 1, j + 1) * sm(u)) * sm(v); };
  const tfbm = (x, y, f, o = 4, s = 0) => { let a = 0, m = .5, t = 0; for (let k = 0; k < o; k++) { a += m * tn(x, y, f, s + k); t += m; f *= 2; m *= .5; } return a / t; };
  const old = C.texPair(256, (x, y) => { const n = tfbm(x, y, 8, 5, 31), m = tfbm(x, y, 32, 3, 33), bare = n < .38; return [0, ...(bare ? [.33 + .08 * m, .27 + .06 * m, .18] : [.22 + .14 * n * m, .3 + .16 * n, .1 + .05 * m])]; });
  out.tex.old = stats(old.map.image); P.markTextures(); out.tex.dry = stats(C.TEX.turfDry.map.image); out.tex.moss = stats(C.TEX.turfMoss.map.image);
  for (const [roof, turf] of [['shingle', 'dry'], ['turf', 'dry'], ['turf', 'moss']]) for (const porch of [true, false]) { const h = P.markHall({ roof, turf, w: 7, d: 12, porch, chimney: !porch, wall: 1 }, P.stream('check:' + roof + turf + porch));
    let fringe = 0; h.group.traverse(o => { if (o.isMesh && o.material.alphaTest > 0 && o.material.map && o.material.map === C.TEX.fringe?.map) fringe++; }); out.halls.push({ roof, turf, porch, tris: h.tris, draws: h.draws, fringe }); }
  // the lot rules: 40 streets of 30 lots with no hall of note, 40 more with halls of note at random lots
  out.lots = { plain: [], noted: [], same: 0, n: 0, noteTurf: 0, all: [] };
  for (let s = 0; s < 40; s++) { const runs = [], st = 'street' + s; for (let t = 0; t < 10; t++) { let k = 0; for (let j = 0; j < 3; j++) if (P.markLot(st, t * 3 + j).o.roof === 'turf') k++; runs.push(k); } out.lots.plain.push(runs); }
  for (let s = 0; s < 40; s++) { const st = 'noted' + s, rr = P.stream(st), note = [0, 1, 2].map(() => Math.floor(rr() * 30)), runs = [];
    for (let t = 0; t < 10; t++) { let k = 0, notes = 0; for (let j = 0; j < 3; j++) { const i = t * 3 + j, L = P.markLot(st, i, { note }); if (L.o.roof === 'turf') { k++; if (note.includes(i)) out.lots.noteTurf++; } if (note.includes(i)) notes++; } runs.push([k, notes]); } out.lots.noted.push(runs); }
  const hash = g => { let h = 0; g.traverse(m => { if (!m.isMesh) return; const a = m.geometry.attributes.position.array; h = (h * 31 + a.length) | 0; for (let i = 0; i < a.length; i += 3) h = (h * 31 + Math.round(a[i] * 1e4)) | 0; }); return h; };
  for (let i = 0; i < 300; i++) { const st = 'town' + (i % 12), note = i % 25 === 0 ? [i] : [], L = P.markLot(st, i, { note }), h = P.markHall(L.o, L.r), L2 = P.markLot(st, i, { note }), h2 = P.markHall(L2.o, L2.r);
    out.lots.n++; if (hash(h.group) === hash(h2.group) && JSON.stringify(L.o) === JSON.stringify(L2.o)) out.lots.same++;
    out.lots.all.push({ roof: L.o.roof, note: !!L.o.note, w: L.o.w, d: L.o.d, porch: L.o.porch, chimney: L.o.chimney, carve: L.o.carve, set: L.o.set, gap: L.o.gap, tris: h.tris, draws: h.draws, top: +h.roofTop.toFixed(2) });
    h.group.traverse(m => m.geometry && m.geometry.dispose()); h2.group.traverse(m => m.geometry && m.geometry.dispose()); }
  return out; });
check(`no page errors`, errs.length === 0, errs.slice(0, 3));
const T = r.tex; console.log('turf colour, Session 819:', JSON.stringify(T.old), ' dry:', JSON.stringify(T.dry), ' moss:', JSON.stringify(T.moss));
check(`the dry turf is no lawn: less saturated than Session 819's (${T.dry.sat} against ${T.old.sat}) and redder than green (${T.dry.greenOverRed})`, T.dry.sat < T.old.sat * .8 && T.dry.greenOverRed < 0);
check(`the moss turf is darker and duller than Session 819's (saturation ${T.moss.sat} against ${T.old.sat}; green over red ${T.moss.greenOverRed} against ${T.old.greenOverRed})`, T.moss.sat < T.old.sat * .8 && T.moss.greenOverRed < T.old.greenOverRed * .6);
for (const h of r.halls) check(`${h.roof}${h.roof === 'turf' ? ' (' + h.turf + ')' : ''}, ${h.porch ? 'with a porch' : 'with a chimney'}: ${h.tris} triangles in ${h.draws} draws${h.roof === 'turf' ? ', the fringe at the eaves' : ''}`, h.tris < 3000 && h.draws <= 12 && (h.roof !== 'turf' || h.fringe === 1), h);
{ const L = r.lots, plainBad = L.plain.filter(rs => rs.some(k => k !== 1)).length;
  check(`Michael's mix: one turf hall in every run of three lots, on all of 40 streets (${L.plain.flat().reduce((a, k) => a + k, 0)} of 1,200 lots)`, plainBad === 0, { plainBad });
  const notedBad = L.noted.flat().filter(([k, notes]) => notes < 3 ? k !== 1 : k !== 0).length;
  check(`a hall of note is never turf (${L.noteTurf} of 120 are), and a run of three keeps its one turf hall unless all three are halls of note (${notedBad} runs of 400 break it)`, L.noteTurf === 0 && notedBad === 0);
  check(`a lot's hall comes from its street and index alone: ${L.same} of ${L.n} built twice are the same`, L.same === L.n);
  const by = f => L.all.filter(f), mean = (hs, f) => +(hs.reduce((a, h) => a + f(h), 0) / hs.length).toFixed(2), frac = (hs, f) => Math.round(100 * hs.filter(f).length / hs.length);
  const T = by(h => h.roof === 'turf'), S = by(h => h.roof === 'shingle' && !h.note), N = by(h => h.note);
  const row = hs => ({ n: hs.length, area: mean(hs, h => h.w * h.d), porch: frac(hs, h => h.porch), chimney: frac(hs, h => h.chimney), carve: frac(hs, h => h.carve), set: mean(hs, h => h.set), gap: mean(hs, h => h.gap), tris: [Math.min(...hs.map(h => h.tris)), Math.max(...hs.map(h => h.tris))], draws: Math.max(...hs.map(h => h.draws)), top: [Math.min(...hs.map(h => h.top)), Math.max(...hs.map(h => h.top))] });
  const t = row(T), sh = row(S), nt = row(N); console.log('turf:', JSON.stringify(t), '\nshingle:', JSON.stringify(sh), '\nhalls of note:', JSON.stringify(nt));
  check(`the turf hall is the poorer house: ${t.area} m² against shingle's ${sh.area} and a hall of note's ${nt.area}; porches ${t.porch}% against ${sh.porch}%, chimneys ${t.chimney}% against ${sh.chimney}%, carved ${t.carve}% against ${sh.carve}%; set ${t.set} m back against ${sh.set} m`, t.area < sh.area * .75 && sh.area < nt.area && t.porch < sh.porch && t.chimney < sh.chimney && t.carve < 30 && sh.carve === 100 && t.set > sh.set + .8);
  check(`300 lots' halls in budget: turf ${t.tris[0]} to ${t.tris[1]} triangles, shingle ${sh.tris[0]} to ${sh.tris[1]}, halls of note ${nt.tris[0]} to ${nt.tris[1]}; at most ${Math.max(t.draws, sh.draws, nt.draws)} draws; ridges ${t.top[0]} to ${nt.top[1]} m`, Math.max(t.tris[1], sh.tris[1], nt.tris[1]) < 3000 && Math.max(t.draws, sh.draws, nt.draws) <= 12 && nt.top[1] < 14); }
await page.goto(`http://localhost:${port}/mark.html?still&w=640&h=360&nopeople&view=lane`); await page.waitForFunction(() => window.__done || window.__err, null, { timeout: 300000 });
{ const H = await page.evaluate(() => window.__stats.halls); check(`the lane page: ${H.length} halls, roofs ${H.map(h => h.note ? 'N' : h.roof[0].toUpperCase()).join('')}, no page errors`, H.length === 8 && H.filter(h => h.roof === 'turf').length >= 2 && H[3].note && errs.length === 0, errs.slice(0, 3)); }
if (process.argv.includes('--shots')) for (const [name, q] of [['mark-lane-mix', 'view=lane'], ['mark-lots-high', 'view=lane&high'], ['mark-lots-high-b', 'view=lane&high&street=mark-lane-b']]) console.log(execFileSync('node', [path.join(here, 'shoot.mjs'), '--page=mark.html', '--name=' + name, '--q=' + q]).toString().split('{')[0]);
await browser.close(); srv.close(); console.log(fails ? `${fails} FAILED` : 'all passed'); process.exit(fails ? 1 : 0);
