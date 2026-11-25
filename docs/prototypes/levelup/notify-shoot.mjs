// node docs/prototypes/levelup/notify-shoot.mjs [--scene=lane|hall] (concept artist, 25 Nov 2026): serves docs/prototypes/, opens
// notify.html at 1920×1080 in the test Chromium (software GL), and photographs it at each level with the scene's own moment
// (notify-<scene>-a|b|c.jpg), then, in the lane, the top centre at 1:1 for all five moments at B and C (notify-cards-b|c.jpg).
import { chromium } from 'playwright'; import http from 'http'; import fs from 'fs'; import path from 'path'; import { fileURLToPath } from 'url';
const here = path.dirname(fileURLToPath(import.meta.url)), root = path.dirname(here), arg = k => (process.argv.find(a => a.startsWith('--' + k + '=')) || '').split('=').slice(1).join('=');
const SCENE = arg('scene') || 'lane', KINDS = ['level', 'quest', 'place', 'skill', 'word'];
const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.woff2': 'font/woff2', '.png': 'image/png', '.bin': 'application/octet-stream' };
const srv = http.createServer((q, r) => { const f = path.join(root, decodeURIComponent(q.url.split('?')[0])); if (!f.startsWith(root) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { r.writeHead(404); return r.end(); } r.writeHead(200, { 'content-type': types[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(r); }).listen(0);
const launch = { args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] }; if (!fs.existsSync(chromium.executablePath()) && fs.existsSync('/opt/pw-browsers/chromium')) launch.executablePath = '/opt/pw-browsers/chromium';
const browser = await chromium.launch(launch); const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
const errs = []; page.on('pageerror', e => errs.push(String(e))); page.on('console', m => { if (m.type() === 'error') errs.push(m.text().slice(0, 300)); });
const t0 = Date.now(); await page.goto(`http://localhost:${srv.address().port}/levelup/notify.html?still&w=1920&h=1080&scene=${SCENE}`);
await page.waitForFunction(() => window.__notify || window.__err, null, { timeout: 900000 }).catch(e => errs.push('timeout ' + e.message));
await page.evaluate(() => document.getElementById('note').style.display = 'none');
const shot = async (kind, level, file) => { await page.evaluate(([k, l]) => window.notifyShow(k, l), [kind, level]); await page.waitForTimeout(200); await page.screenshot({ path: path.join(here, file), type: 'jpeg', quality: 90 }); return page.evaluate(() => window.__stats.card); };
const own = SCENE === 'hall' ? 'skill' : 'place';
for (const l of ['a', 'b', 'c']) console.log(l, JSON.stringify(await shot(own, l, `notify-${SCENE}-${l}.jpg`)));
if (SCENE === 'lane') for (const l of ['b', 'c']) {
  const crops = [];
  for (const k of KINDS) { await page.evaluate(([k, l]) => window.notifyShow(k, l), [k, l]); await page.waitForTimeout(150); crops.push((await page.screenshot({ type: 'png', clip: { x: 960 - 400, y: 0, width: 800, height: l === 'c' ? 300 : 200 } })).toString('base64')); }
  const hh = l === 'c' ? 300 : 200, sheet = await browser.newPage({ viewport: { width: 1600, height: hh * 3 } });
  await sheet.setContent(`<body style="margin:0;background:#0d1014;display:grid;grid-template-columns:800px 800px">${crops.map((c, i) => `<div style="position:relative;height:${hh}px"><img src="data:image/png;base64,${c}" style="display:block"><span style="position:absolute;left:12px;bottom:8px;font:600 20px Georgia,serif;color:#f3ead6;text-shadow:0 1px 3px #000,0 0 8px #000">${l.toUpperCase()} · ${KINDS[i]}</span></div>`).join('')}</body>`);
  await sheet.screenshot({ path: path.join(here, `notify-cards-${l}.jpg`), type: 'jpeg', quality: 88, fullPage: true }); await sheet.close();
}
console.log(SCENE, ((Date.now() - t0) / 1000).toFixed(0) + 's', JSON.stringify(await page.evaluate(() => window.__stats)), 'errs', errs.slice(0, 6));
await browser.close(); srv.close();
