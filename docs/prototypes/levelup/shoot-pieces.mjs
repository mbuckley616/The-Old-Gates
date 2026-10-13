// node docs/prototypes/levelup/shoot-pieces.mjs [--only=name] [--w=1920] (concept run, 13 Oct 2026): the pictures of
// pieces-gatelands.html, each shot a query, into pieces-gatelands-<name>.jpg, with the page's stats in pieces-gatelands.json.
import { chromium } from 'playwright'; import http from 'http'; import fs from 'fs'; import path from 'path'; import { fileURLToPath } from 'url';
const here = path.dirname(fileURLToPath(import.meta.url)), arg = k => (process.argv.find(a => a.startsWith('--' + k + '=')) || '').split('=').slice(1).join('=');
const W = +(arg('w') || 1920), H = Math.round(W * 9 / 16), only = arg('only');
const SHOTS = { 'street-a': 'view=street&mix=a', 'street-b': 'view=street&mix=b', 'street-c': 'view=street&mix=c', 'high-a': 'view=street&mix=a&cam=high', 'cottage': 'view=street&mix=a&cam=cottage', 'town': 'view=street&mix=a&cam=town', 'line': 'view=line', 'kit': 'view=kit' };
const types = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json', '.bin': 'application/octet-stream' };
const srv = http.createServer((q, r) => { const f = path.join(here, decodeURIComponent(q.url.split('?')[0])); if (!f.startsWith(here) || !fs.existsSync(f)) { r.writeHead(404); return r.end(); } r.writeHead(200, { 'content-type': types[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(r); }).listen(0);
const port = srv.address().port, launch = { args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] }; if (!fs.existsSync(chromium.executablePath()) && fs.existsSync('/opt/pw-browsers/chromium')) launch.executablePath = '/opt/pw-browsers/chromium';
const browser = await chromium.launch(launch), out = {}, jf = path.join(here, 'pieces-gatelands.json'), prev = fs.existsSync(jf) ? JSON.parse(fs.readFileSync(jf, 'utf8')) : {};
for (const [name, q] of Object.entries(SHOTS)) { if (only && !only.split(',').includes(name)) continue;
  const page = await browser.newPage({ viewport: { width: W, height: H } }), errs = []; page.on('pageerror', e => errs.push(String(e))); page.on('console', m => { if (m.type() === 'error') errs.push(m.text().slice(0, 300)); });
  const t0 = Date.now(); await page.goto(`http://localhost:${port}/pieces-gatelands.html?still&w=${W}&h=${H}&${q}`);
  await page.waitForFunction(() => window.__done || window.__err, null, { timeout: 900000 }).catch(e => errs.push('timeout ' + e.message));
  await page.evaluate(() => document.getElementById('note').style.display = 'none');
  const url = await page.evaluate(() => document.querySelector('canvas').toDataURL('image/jpeg', .9)); fs.writeFileSync(path.join(here, `pieces-gatelands-${name}.jpg`), Buffer.from(url.split(',')[1], 'base64'));
  const st = await page.evaluate(() => window.__stats); out[name] = { secs: Math.round((Date.now() - t0) / 1000), ...st, errs: errs.filter(e => !/404/.test(e)) }; console.log(name, JSON.stringify(out[name]).slice(0, 900)); await page.close(); }
fs.writeFileSync(jf, JSON.stringify({ ...prev, ...out }, null, 1)); await browser.close(); srv.close();
