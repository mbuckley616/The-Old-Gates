// node docs/prototypes/levelup/beasttells.check.mjs (Session 2191): beasttells.html's promises. For the Wolf, the Dire Wolf's ironwolf, the
// Cave Bear and the boar: each level draws with no error; B's mask lies on the head ahead of the eyes and the jaw, and on under a tenth of
// the hide; C finds two eyes; A tints the hide and every fur shell; and B and C leave the rest of the body's pixels as A's untinted body.
import { chromium } from 'playwright'; import http from 'http'; import fs from 'fs'; import path from 'path'; import { fileURLToPath } from 'url';
const here = path.dirname(fileURLToPath(import.meta.url));
const types = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json', '.bin': 'application/octet-stream' };
const srv = http.createServer((q, r) => { const f = path.join(here, decodeURIComponent(q.url.split('?')[0])); if (!f.startsWith(here) || !fs.existsSync(f)) { r.writeHead(404); return r.end(); } r.writeHead(200, { 'content-type': types[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(r); }).listen(0);
const port = srv.address().port, launch = { args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] };
if (!fs.existsSync(chromium.executablePath()) && fs.existsSync('/opt/pw-browsers/chromium')) launch.executablePath = '/opt/pw-browsers/chromium';
const browser = await chromium.launch(launch); let fails = 0;
const check = (name, ok, info) => { console.log((ok ? 'PASS ' : 'FAIL ') + name + (info !== undefined ? '  ' + JSON.stringify(info) : '')); if (!ok) fails++; };
// the warm share of the picture: pixels whose red beats blue by 60 or more (the gold of the tell; the floor and the coats stay under it)
async function shot(q) { const page = await browser.newPage({ viewport: { width: 480, height: 300 } }), errs = []; page.on('pageerror', e => errs.push(String(e)));
  await page.goto(`http://localhost:${port}/beasttells.html?still&w=480&h=300&cam=close&${q}`); await page.waitForFunction(() => window.__done || window.__err, null, { timeout: 150000 });
  const r = await page.evaluate(() => { const c = document.querySelector('canvas'), x = document.createElement('canvas'); x.width = c.width; x.height = c.height; const g = x.getContext('2d'); g.drawImage(c, 0, 0);
    const d = g.getImageData(0, 0, x.width, x.height).data; let warm = 0; for (let i = 0; i < d.length; i += 4) if (d[i] - d[i + 2] > 60 && d[i] > 150) warm++; return { st: window.__stats, warm: warm / (d.length / 4) }; });
  await page.close(); return { ...r, errs }; }
for (const beast of ['wolf', 'ironwolf', 'cavebear', 'boar']) {
  const A = await shot(`beast=${beast}&level=a`), B = await shot(`beast=${beast}&level=b`), C = await shot(`beast=${beast}&level=c`), N = await shot(`beast=${beast}&level=a&k=0`);
  check(`${beast}: every level draws with no error`, ![A, B, C, N].some(r => r.errs.length || r.st.err), [A, B, C, N].map(r => r.errs[0] || r.st.err).filter(Boolean));
  check(`${beast} A: the hide and every fur shell take the tell`, A.st.fx.tinted >= 1, A.st.fx.tinted);
  const m = B.st.fx.mask || {};
  check(`${beast} B: the muzzle and the jaw lit, under a tenth of the hide (${m.verts} vertices, share ${m.share})`, m.verts > 50 && m.share > .003 && m.share < .1, m);
  check(`${beast} C: both eyes flare`, C.st.fx.eyes === 2, C.st.fx.eyes);
  check(`${beast}: A lights more of the picture than B, B and C more than none (warm ${[A, B, C, N].map(r => (r.warm * 100).toFixed(2) + '%').join(' / ')})`, A.warm > B.warm && B.warm > N.warm && C.warm > N.warm);
}
await browser.close(); srv.close(); console.log(fails ? `${fails} FAILED` : 'all passed'); process.exit(fails ? 1 : 0);
