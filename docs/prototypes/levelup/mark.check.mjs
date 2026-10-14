// node docs/prototypes/levelup/mark.check.mjs (Session 825, card F6): the Mark's halls in the test Chromium. Every hall builds
// (shingle, and turf in both looks) with its triangles and draw calls in budget and the turf's fringe at the eaves; and the
// turf is no longer a lawn: its texture's mean colour is measured against Session 819's (whose formula is kept here), for
// saturation and for how much greener than red it is (Michael on #277: "the green is too vibrant for the climate").
import { chromium } from 'playwright'; import http from 'http'; import fs from 'fs'; import path from 'path'; import { fileURLToPath } from 'url';
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
  return out; });
check(`no page errors`, errs.length === 0, errs.slice(0, 3));
const T = r.tex; console.log('turf colour, Session 819:', JSON.stringify(T.old), ' dry:', JSON.stringify(T.dry), ' moss:', JSON.stringify(T.moss));
check(`the dry turf is no lawn: less saturated than Session 819's (${T.dry.sat} against ${T.old.sat}) and redder than green (${T.dry.greenOverRed})`, T.dry.sat < T.old.sat * .8 && T.dry.greenOverRed < 0);
check(`the moss turf is darker and duller than Session 819's (saturation ${T.moss.sat} against ${T.old.sat}; green over red ${T.moss.greenOverRed} against ${T.old.greenOverRed})`, T.moss.sat < T.old.sat * .8 && T.moss.greenOverRed < T.old.greenOverRed * .6);
for (const h of r.halls) check(`${h.roof}${h.roof === 'turf' ? ' (' + h.turf + ')' : ''}, ${h.porch ? 'with a porch' : 'with a chimney'}: ${h.tris} triangles in ${h.draws} draws${h.roof === 'turf' ? ', the fringe at the eaves' : ''}`, h.tris < 3000 && h.draws <= 12 && (h.roof !== 'turf' || h.fringe === 1), h);
await browser.close(); srv.close(); console.log(fails ? `${fails} FAILED` : 'all passed'); process.exit(fails ? 1 : 0);
