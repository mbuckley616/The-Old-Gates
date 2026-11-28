// node docs/prototypes/levelup/stalls-sheet.mjs (Session 2754): the market stalls by island. Serves this folder, opens stalls.html at
// 1280x720 in the test Chromium (software GL) for each view, and lays the shots out:
//   stalls-row.jpg       today's stall | the Mark's booth | Aurenne's awning, from the square, and the three close
//   stalls-goods.jpg     the Mark's three (furs, stockfish, wool) | Aurenne's three (spice, pots, cloth)
// and prints each page's __stats.stalls. Exits 1 on a page error.
import { chromium } from 'playwright'; import http from 'http'; import fs from 'fs'; import path from 'path'; import { fileURLToPath } from 'url';
const here = path.dirname(fileURLToPath(import.meta.url)), Wd = 1280, Ht = 720;
const types = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json', '.bin': 'application/octet-stream' };
const srv = http.createServer((q, r) => { const f = path.join(here, decodeURIComponent(q.url.split('?')[0])); if (!f.startsWith(here) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { r.writeHead(404); return r.end(); } r.writeHead(200, { 'content-type': types[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(r); }).listen(0);
await new Promise(r => srv.on('listening', r));
const launch = { args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] }; if (!fs.existsSync(chromium.executablePath()) && fs.existsSync('/opt/pw-browsers/chromium')) launch.executablePath = '/opt/pw-browsers/chromium';
const browser = await chromium.launch(launch), shots = {}, stats = {}; let bad = 0;
const jobs = { row: 'view=row', rowc: 'view=row&close', mark: 'view=mark', markc: 'view=mark&close', aur: 'view=aurenne', aurc: 'view=aurenne&close' };
for (const [k, q] of Object.entries(jobs)) { const page = await browser.newPage({ viewport: { width: Wd, height: Ht } }), errs = []; page.on('pageerror', e => errs.push(String(e)));
  const t0 = Date.now(); await page.goto(`http://localhost:${srv.address().port}/stalls.html?still&nopeople&w=${Wd}&h=${Ht}&${q}`);
  await page.waitForFunction(() => window.__done, null, { timeout: 300000 }).catch(e => errs.push('timeout'));
  await page.evaluate(() => document.getElementById('note').style.display = 'none');
  shots[k] = 'data:image/jpeg;base64,' + (await page.screenshot({ type: 'jpeg', quality: 90 })).toString('base64'); stats[k] = await page.evaluate(() => window.__stats.stalls);
  console.log(k, ((Date.now() - t0) / 1000).toFixed(0) + 's', JSON.stringify(stats[k]), errs.slice(0, 3)); if (errs.length) bad++; await page.close(); }
const cap = (k, i) => { const s = stats[k][i]; return `${s.label}: ${s.tris} tris, ${s.draws} draws`; };
const sheets = { 'stalls-row': [[['row', 'From the square: ' + [0, 1, 2].map(i => cap('row', i)).join(' · ')]], [['rowc', 'Close, at eye height: the middle stall (the Mark’s)']]],
  'stalls-goods': [[['mark', 'The Mark: ' + [0, 1, 2].map(i => cap('mark', i)).join(' · ')], ['markc', 'Close: stockfish under the eave']], [['aur', 'Aurenne: ' + [0, 1, 2].map(i => cap('aur', i)).join(' · ')], ['aurc', 'Close: pots and an amphora']]] };
const p = await browser.newPage();
for (const [name, rows] of Object.entries(sheets)) {
  const url = await p.evaluate(async ([rows, shots]) => { const img = u => new Promise(r => { const i = new Image(); i.onload = () => r(i); i.src = u; }); const W = 960, H = 540, PAD = 8, HEAD = 26, cols = Math.max(...rows.map(r => r.length));
    const c = document.createElement('canvas'); c.width = cols * W + (cols - 1) * PAD; c.height = rows.length * (H + HEAD + PAD) - PAD; const x = c.getContext('2d'); x.fillStyle = '#1b1712'; x.fillRect(0, 0, c.width, c.height);
    for (let j = 0; j < rows.length; j++) for (let i = 0; i < rows[j].length; i++) { const [k, t] = rows[j][i], dx = i * (W + PAD), dy = j * (H + HEAD + PAD); x.drawImage(await img(shots[k]), dx, dy + HEAD, W, H); x.fillStyle = '#eee'; x.font = '14px Georgia, serif'; x.fillText(t, dx + 4, dy + 18); }
    return c.toDataURL('image/jpeg', .86); }, [rows, shots]);
  fs.writeFileSync(path.join(here, name + '.jpg'), Buffer.from(url.split(',')[1], 'base64')); console.log('wrote', name + '.jpg'); }
await browser.close(); srv.close(); process.exit(bad ? 1 : 0);
