// node docs/prototypes/levelup/pieces.check.mjs (Session 818, card F6): the Gatelands house moved from the lane slice into
// pieces.js. 200 houses rolled as the lane rolls them: merged, each is the same triangles and the same bounds as the house
// unmerged, in a few meshes, and the same key builds the same house; and the lane renders as it did before the move (its
// picture against one made from HEAD's street.js, which the check writes beside it and compares in the browser).
import { chromium } from 'playwright'; import http from 'http'; import fs from 'fs'; import path from 'path'; import { fileURLToPath } from 'url';
import { execFileSync } from 'child_process';
const here = path.dirname(fileURLToPath(import.meta.url));
const types = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json', '.bin': 'application/octet-stream' };
const srv = http.createServer((q, r) => { const f = path.join(here, decodeURIComponent(q.url.split('?')[0])); if (!f.startsWith(here) || !fs.existsSync(f)) { r.writeHead(404); return r.end(); } r.writeHead(200, { 'content-type': types[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(r); }).listen(0);
const port = srv.address().port, launch = { args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] };
if (!fs.existsSync(chromium.executablePath()) && fs.existsSync('/opt/pw-browsers/chromium')) launch.executablePath = '/opt/pw-browsers/chromium';
const browser = await chromium.launch(launch); let fails = 0;
const check = (name, ok, info) => { console.log((ok ? 'PASS ' : 'FAIL ') + name + (info !== undefined ? '  ' + JSON.stringify(info) : '')); if (!ok) fails++; };
const page = await browser.newPage({ viewport: { width: 640, height: 360 } }); const errs = []; page.on('pageerror', e => errs.push(String(e)));
await page.goto(`http://localhost:${port}/aurenne.html?still&nopeople&view=houses&w=640&h=360`); await page.waitForFunction(() => window.__done || window.__err, null, { timeout: 600000 });
const r = await page.evaluate(async () => { const THREE = await import('three'), K = await import('./pieces.js'), out = [];
  const hash = g => { let h = 0; g.traverse(m => { if (!m.isMesh) return; const a = m.geometry.attributes.position.array; for (let i = 0; i < a.length; i += 3) h = (h * 31 + Math.round(a[i] * 1e4)) | 0; }); return h; };
  for (let i = 0; i < 200; i++) { const r0 = K.stream('lane:' + i), w = 7.2 + r0() * 2.6, d = 5.4 + r0() * .8, h = r0() < .35 ? 5.4 : 3.5 + r0() * .5;
    const o = { w, d, h, thatch: h < 4.6 ? r0() < .8 : r0() < .3, timber: r0() < .45, wash: i, paint: i * 3 + 1, shutters: r0() < .75, boxes: r0() < .7, pots: r0() < .5, lantern: r0() < .5, chim: r0() < .5 ? 1 : -1 };
    const A = K.gatelandsHouse({ ...o, noMerge: true }, K.stream('house:' + i)), B = K.gatelandsHouse(o, K.stream('house:' + i)), C = K.gatelandsHouse(o, K.stream('house:' + i));
    const bA = new THREE.Box3().setFromObject(A.group), bB = new THREE.Box3().setFromObject(B.group), dB = Math.max(...['x', 'y', 'z'].flatMap(k => [Math.abs(bA.min[k] - bB.min[k]), Math.abs(bA.max[k] - bB.max[k])]));
    out.push({ trisA: A.tris, trisB: B.tris, drawsA: A.draws, drawsB: B.draws, dBox: +dB.toFixed(5), same: hash(B.group) === hash(C.group), flowers: A.flowers.length === B.flowers.length, thatch: o.thatch });
    for (const x of [A, B, C]) x.group.traverse(m => m.geometry && m.geometry.dispose()); }
  return out; });
const st = f => [Math.min(...r.map(f)), Math.max(...r.map(f)), Math.round(r.reduce((a, x) => a + f(x), 0) / r.length)];
check('merged, every house of 200 is the same triangles as unmerged', r.every(x => x.trisA === x.trisB), r.filter(x => x.trisA !== x.trisB).slice(0, 2));
check('and the same bounds, within a tenth of a millimetre', r.every(x => x.dBox < 1e-4), Math.max(...r.map(x => x.dBox)));
check(`meshes a house: ${st(x => x.drawsA).join(' to ').replace(/ to (\d+)$/, ' (mean $1)')} unmerged, ${st(x => x.drawsB).join(' to ').replace(/ to (\d+)$/, ' (mean $1)')} merged; triangles ${st(x => x.trisB).map(v => v.toLocaleString()).join(' to ').replace(/ to ([\d,]+)$/, ' (mean $1)')}`, r.every(x => x.drawsB <= 12 && x.drawsB < x.drawsA));
check('the same key builds the same house, and its flowers are the same', r.every(x => x.same && x.flowers));
check('no page errors', errs.length === 0, errs.slice(0, 3)); await page.close();
// the lane before and after the move: HEAD's street.js shot beside the working one
const head = execFileSync('git', ['show', 'HEAD:docs/prototypes/levelup/street.js'], { cwd: here }).toString(), now = fs.readFileSync(path.join(here, 'street.js'), 'utf8');
if (head === now) console.log('SKIP the lane comparison: street.js is HEAD\'s'); else {
  const shot = name => execFileSync('node', [path.join(here, 'shoot.mjs'), '--page=street.html', '--name=' + name]).toString();
  try { fs.writeFileSync(path.join(here, 'street.js'), head); shot('_lane-before'); } finally { fs.writeFileSync(path.join(here, 'street.js'), now); } shot('_lane-after');
  const p = await browser.newPage(), u = f => 'data:image/jpeg;base64,' + fs.readFileSync(path.join(here, f)).toString('base64');
  const d = await p.evaluate(async ([A, B]) => { const px = s => new Promise(r => { const i = new Image(); i.onload = () => { const c = document.createElement('canvas'); c.width = i.width; c.height = i.height; const x = c.getContext('2d'); x.drawImage(i, 0, 0); r(x.getImageData(0, 0, i.width, i.height).data); }; i.src = s; });
    const [a, b] = await Promise.all([px(A), px(B)]); let big = 0, s = 0; for (let i = 0; i < a.length; i += 4) { const e = Math.max(Math.abs(a[i] - b[i]), Math.abs(a[i + 1] - b[i + 1]), Math.abs(a[i + 2] - b[i + 2])); s += e; if (e > 24) big++; } return { over24: big, px: a.length / 4, mean: +(s / (a.length / 4)).toFixed(4) }; }, [u('_lane-before.jpg'), u('_lane-after.jpg')]);
  check(`the lane renders as before the move: ${d.over24} of ${d.px.toLocaleString()} pixels differ by more than 24 (mean difference ${d.mean})`, d.over24 < d.px * 1e-4, d);
  for (const f of ['_lane-before.jpg', '_lane-after.jpg']) fs.rmSync(path.join(here, f)); await p.close(); }
await browser.close(); srv.close(); console.log(fails ? `${fails} FAILED` : 'all passed'); process.exit(fails ? 1 : 0);
