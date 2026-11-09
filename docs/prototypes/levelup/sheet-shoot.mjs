// node docs/prototypes/levelup/sheet-shoot.mjs name=query [name=query ...] (concept, 9 Nov 2026): serves docs/prototypes/ (the sheet reads
// the parchment kit from ../hud and ../ui), opens sheet.html?<query> at 1920x1080 in the test Chromium (software GL) and photographs the
// page, sheet and all, into <name>.jpg; its __stats on one line. CLIP=x,y,w,h crops (in the page's pixels).
import { chromium } from 'playwright'; import http from 'http'; import fs from 'fs'; import path from 'path'; import { fileURLToPath } from 'url';
const here = path.dirname(fileURLToPath(import.meta.url)), root = path.dirname(here), out = process.env.OUT || here;
const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.woff2': 'font/woff2', '.png': 'image/png', '.jpg': 'image/jpeg', '.bin': 'application/octet-stream' };
const srv = http.createServer((q, r) => { const f = path.join(root, decodeURIComponent(q.url.split('?')[0])); if (!f.startsWith(root) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { r.writeHead(404); return r.end(); } r.writeHead(200, { 'content-type': types[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(r); }).listen(0);
const launch = { args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] }; if (!fs.existsSync(chromium.executablePath()) && fs.existsSync('/opt/pw-browsers/chromium')) launch.executablePath = '/opt/pw-browsers/chromium';
const browser = await chromium.launch(launch), all = {};
for (const job of process.argv.slice(2)) { const [name, q] = [job.split('=')[0], job.split('=').slice(1).join('=')];
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } }), errs = []; page.on('pageerror', e => errs.push(String(e))); page.on('console', m => { if (m.type() === 'error') errs.push(m.text().slice(0, 300)); });
  const t0 = Date.now(); await page.goto(`http://localhost:${srv.address().port}/levelup/sheet.html?${q}`);
  await page.waitForFunction(() => window.__done, null, { timeout: 300000 }).catch(e => errs.push('timeout ' + e.message));
  await page.evaluate(() => document.getElementById('note').style.display = 'none'); await page.evaluate(() => document.fonts.ready); await page.waitForTimeout(300);
  const clip = process.env.CLIP ? (([x, y, width, height]) => ({ x, y, width, height }))(process.env.CLIP.split(',').map(Number)) : undefined;
  await page.screenshot({ path: path.join(out, name + '.jpg'), type: 'jpeg', quality: 90, clip });
  const st = await page.evaluate(() => window.__stats); all[name] = st; console.log(name, ((Date.now() - t0) / 1000).toFixed(0) + 's', JSON.stringify(st), errs.slice(0, 4)); await page.close(); }
if (process.env.JSON) fs.writeFileSync(process.env.JSON, JSON.stringify(all, null, 1)); await browser.close(); srv.close();
