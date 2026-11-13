// node docs/prototypes/levelup/beasttells-shoot.mjs (Session 2191): beasttells.html's pictures for the DECISION. Each row one view, each
// column one level (A the body, B the jaws, C the eyes), shot at 960x600 and laid into one labelled sheet a row, into this folder:
//   beasttells-wolf.jpg (the Wolf from the third-person camera, gold; then close, gold), beasttells-bear.jpg (the Cave Bear, the same),
//   beasttells-heavy.jpg (both, red, at dusk). __stats on one line a picture.
import { chromium } from 'playwright'; import http from 'http'; import fs from 'fs'; import path from 'path'; import { fileURLToPath } from 'url';
const here = path.dirname(fileURLToPath(import.meta.url)), out = process.env.OUT || here, Wd = 960, Ht = 600;
const types = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json', '.bin': 'application/octet-stream' };
const srv = http.createServer((q, r) => { const f = path.join(here, decodeURIComponent(q.url.split('?')[0])); if (!f.startsWith(here) || !fs.existsSync(f)) { r.writeHead(404); return r.end(); } r.writeHead(200, { 'content-type': types[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(r); }).listen(0);
const port = srv.address().port, launch = { args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] };
if (!fs.existsSync(chromium.executablePath()) && fs.existsSync('/opt/pw-browsers/chromium')) launch.executablePath = '/opt/pw-browsers/chromium';
const browser = await chromium.launch(launch), LV = { a: 'A — the body (today)', b: 'B — the jaws', c: 'C — the eyes' }, all = {};
const SHEETS = {
  'beasttells-wolf': [['Wolf, from the camera, a light blow', 'beast=wolf&cam=back'], ['Wolf, close', 'beast=wolf&cam=close']],
  'beasttells-bear': [['Cave Bear, from the camera, a light blow', 'beast=cavebear&cam=back'], ['Cave Bear, close', 'beast=cavebear&cam=close']],
  'beasttells-heavy': [['Wolf at dusk, a heavy blow', 'beast=wolf&cam=back&kind=heavy&light=dusk'], ['Cave Bear at dusk, a heavy blow', 'beast=cavebear&cam=back&kind=heavy&light=dusk']] };
async function shot(q) { const page = await browser.newPage({ viewport: { width: Wd, height: Ht } }), errs = []; page.on('pageerror', e => errs.push(String(e)));
  await page.goto(`http://localhost:${port}/beasttells.html?still&w=${Wd}&h=${Ht}&${q}`); await page.waitForFunction(() => window.__done || window.__err, null, { timeout: 150000 });
  await page.evaluate(() => document.getElementById('note').style.display = 'none');
  const url = await page.evaluate(() => document.querySelector('canvas').toDataURL('image/jpeg', .92)), st = await page.evaluate(() => window.__stats); await page.close();
  if (errs.length || st.err) console.log('ERR', q, errs, st.err); return { url, st }; }
for (const [name, rows] of Object.entries(SHEETS)) {
  const cells = []; for (const [label, q] of rows) for (const l of 'abc') { const r = await shot(q + '&level=' + l); cells.push({ ...r, label: label + ' — ' + LV[l] }); all[name + ':' + q + ':' + l] = r.st; console.log(name, l, q, JSON.stringify(r.st.fx)); }
  // the sheet: three columns, a strip of label under each picture, drawn in a page's canvas
  const page = await browser.newPage({ viewport: { width: 400, height: 300 } });
  const jpg = await page.evaluate(async ({ cells, Wd, Ht }) => { const s = .5, w = Wd * s, h = Ht * s, lab = 26, cv = document.createElement('canvas'); cv.width = w * 3; cv.height = (h + lab) * Math.ceil(cells.length / 3);
    const x = cv.getContext('2d'); x.fillStyle = '#14171b'; x.fillRect(0, 0, cv.width, cv.height);
    for (let i = 0; i < cells.length; i++) { const im = new Image(); im.src = cells[i].url; await im.decode(); const cx = (i % 3) * w, cy = Math.floor(i / 3) * (h + lab); x.drawImage(im, cx, cy, w, h);
      x.fillStyle = '#f3ead6'; x.font = '13px system-ui, sans-serif'; x.fillText(cells[i].label, cx + 8, cy + h + 18); x.fillStyle = '#14171b'; x.fillRect(cx + w - 1, cy, 2, h + lab); }
    return cv.toDataURL('image/jpeg', .88); }, { cells, Wd, Ht });
  fs.writeFileSync(path.join(out, name + '.jpg'), Buffer.from(jpg.split(',')[1], 'base64')); await page.close(); }
if (process.env.JSON) fs.writeFileSync(process.env.JSON, JSON.stringify(all, null, 1)); await browser.close(); srv.close();
