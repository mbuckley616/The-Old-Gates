// node docs/prototypes/levelup/halls-shoot.mjs name=query [name=query ...] (concept, 27 Oct 2026): light-shoot.mjs for halls.html: each
// halls.html?<query> at 1920x1080 into <name>.jpg in one browser, with its __stats on one line.
import { chromium } from 'playwright'; import http from 'http'; import fs from 'fs'; import path from 'path'; import { fileURLToPath } from 'url';
const here = path.dirname(fileURLToPath(import.meta.url)), out = process.env.OUT || here, Wd = +(process.env.W || 1920), Ht = +(process.env.H || 1080);
const types = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json', '.bin': 'application/octet-stream' };
const srv = http.createServer((q, r) => { const f = path.join(here, decodeURIComponent(q.url.split('?')[0])); if (!f.startsWith(here) || !fs.existsSync(f)) { r.writeHead(404); return r.end(); } r.writeHead(200, { 'content-type': types[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(r); }).listen(0);
const port = srv.address().port, launch = { args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] };
if (!fs.existsSync(chromium.executablePath()) && fs.existsSync('/opt/pw-browsers/chromium')) launch.executablePath = '/opt/pw-browsers/chromium';
const browser = await chromium.launch(launch), all = {};
for (const job of process.argv.slice(2)) { const [name, q] = [job.split('=')[0], job.split('=').slice(1).join('=')];
  const page = await browser.newPage({ viewport: { width: Wd, height: Ht } }), errs = []; page.on('pageerror', e => errs.push(String(e))); page.on('console', m => { if (m.type() === 'error') errs.push(m.text().slice(0, 300)); });
  const t0 = Date.now(); await page.goto(`http://localhost:${port}/halls.html?still&w=${Wd}&h=${Ht}&${q}`);
  await page.waitForFunction(() => window.__done || window.__err, null, { timeout: 600000 }).catch(e => errs.push('timeout ' + e.message));
  await page.evaluate(() => document.getElementById('note').style.display = 'none');
  const url = await page.evaluate(() => document.querySelector('canvas').toDataURL('image/jpeg', .9)); fs.writeFileSync(path.join(out, name + '.jpg'), Buffer.from(url.split(',')[1], 'base64'));
  const st = await page.evaluate(() => window.__stats); all[name] = st; console.log(name, ((Date.now() - t0) / 1000).toFixed(0) + "s", JSON.stringify({ luma: st.luma, exp: st.exposure, tris: st.tris, calls: st.calls, person: st.person, hall: st.hall, err: st.err }), errs.slice(0, 4)); await page.close(); }
if (process.env.JSON) fs.writeFileSync(process.env.JSON, JSON.stringify(all, null, 1)); await browser.close(); srv.close();
