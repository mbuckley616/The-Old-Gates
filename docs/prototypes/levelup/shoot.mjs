// node docs/prototypes/levelup/shoot.mjs [--name=hero] [--q=extra query] -> docs/prototypes/levelup/<name>.jpg (Session 768)
// Serves this folder over http (ES modules will not load from file://), opens index.html?still at 1920x1080 in the
// test Chromium (software GL) and saves the frame.
import { chromium } from 'playwright'; import http from 'http'; import fs from 'fs'; import path from 'path'; import { fileURLToPath } from 'url';
const here = path.dirname(fileURLToPath(import.meta.url)), arg = k => (process.argv.find(a => a.startsWith('--' + k + '=')) || '').split('=').slice(1).join('=');
const name = arg('name') || 'hero', extra = arg('q'), pg = arg('page') || 'index.html';
const types = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json' };
const srv = http.createServer((q, r) => { const f = path.join(here, decodeURIComponent(q.url.split('?')[0])); if (!f.startsWith(here) || !fs.existsSync(f)) { r.writeHead(404); return r.end(); } r.writeHead(200, { 'content-type': types[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(r); }).listen(0);
const port = srv.address().port;
const launch = { args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] }; if (!fs.existsSync(chromium.executablePath()) && fs.existsSync('/opt/pw-browsers/chromium')) launch.executablePath = '/opt/pw-browsers/chromium';
const browser = await chromium.launch(launch); const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
const errs = []; page.on('pageerror', e => errs.push(String(e))); page.on('console', m => { if (m.type() === 'error' || m.type() === 'warning') errs.push(m.text().slice(0, 300)); });
const t0 = Date.now(); await page.goto(`http://localhost:${port}/${pg}?still&w=1920&h=1080${extra ? '&' + extra : ''}`);
await page.waitForFunction(() => window.__done || window.__err, null, { timeout: 600000 }).catch(e => errs.push('timeout ' + e.message));
await page.evaluate(() => document.getElementById('note').style.display = 'none');
const url = await page.evaluate(() => document.querySelector('canvas').toDataURL('image/jpeg', .9));
fs.writeFileSync(path.join(here, name + '.jpg'), Buffer.from(url.split(',')[1], 'base64'));
console.log(name, ((Date.now() - t0) / 1000).toFixed(0) + 's', JSON.stringify(await page.evaluate(() => window.__stats)), 'errs', errs.filter(e => !/404/.test(e)).slice(0, 6)); await browser.close(); srv.close();
