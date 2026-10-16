// node docs/prototypes/levelup/hud-shoot.mjs [--scene=lane|hall] (concept artist, 15 Oct 2026): serves docs/prototypes/ (the HUD
// page reads the parchment kit from ../hud and ../ui), opens hud.html at 1920×1080 in the test Chromium (software GL), and
// photographs the page, HUD and all, once per frame: hud-<scene>-metal|carved|bare.jpg; then a sheet of the three
// bottom-left corners at 1:1, hud-<scene>-close.jpg.
import { chromium } from 'playwright'; import http from 'http'; import fs from 'fs'; import path from 'path'; import { fileURLToPath } from 'url';
const here = path.dirname(fileURLToPath(import.meta.url)), root = path.dirname(here), arg = k => (process.argv.find(a => a.startsWith('--' + k + '=')) || '').split('=').slice(1).join('=');
const SCENE = arg('scene') || 'lane', FRAMES = ['metal', 'carved', 'bare'];
const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.woff2': 'font/woff2', '.png': 'image/png', '.bin': 'application/octet-stream' };
const srv = http.createServer((q, r) => { const f = path.join(root, decodeURIComponent(q.url.split('?')[0])); if (!f.startsWith(root) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { r.writeHead(404); return r.end(); } r.writeHead(200, { 'content-type': types[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(r); }).listen(0);
const launch = { args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] }; if (!fs.existsSync(chromium.executablePath()) && fs.existsSync('/opt/pw-browsers/chromium')) launch.executablePath = '/opt/pw-browsers/chromium';
const browser = await chromium.launch(launch); const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
const errs = []; page.on('pageerror', e => errs.push(String(e))); page.on('console', m => { if (m.type() === 'error') errs.push(m.text().slice(0, 300)); });
const t0 = Date.now(); await page.goto(`http://localhost:${srv.address().port}/levelup/hud.html?still&w=1920&h=1080&scene=${SCENE}`);
await page.waitForFunction(() => window.__hud || window.__err, null, { timeout: 900000 }).catch(e => errs.push('timeout ' + e.message));
await page.evaluate(() => document.getElementById('note').style.display = 'none');
const crops = [];
for (const f of FRAMES) { await page.evaluate(f => window.hudFrame(f), f); await page.waitForTimeout(150);
  await page.screenshot({ path: path.join(here, `hud-${SCENE}-${f}.jpg`), type: 'jpeg', quality: 90 });
  crops.push((await page.screenshot({ type: 'png', clip: { x: 0, y: 1080 - 470, width: 1500, height: 470 } })).toString('base64')); }
console.log(SCENE, ((Date.now() - t0) / 1000).toFixed(0) + 's', JSON.stringify(await page.evaluate(() => window.__stats)), 'errs', errs.slice(0, 6));
// the close sheet: the three frames' lower thirds, one above the other, at 1:1 (the HUD at ×1.5)
const sheet = await browser.newPage({ viewport: { width: 1500, height: 470 * 3 + 4 * 2 } });
await sheet.setContent(`<body style="margin:0;background:#0d1014">${crops.map((c, i) => `<div style="position:relative;height:470px;margin-bottom:${i < 2 ? 4 : 0}px"><img src="data:image/png;base64,${c}" style="display:block"><span style="position:absolute;left:14px;top:10px;font:600 22px Georgia,serif;color:#f3ead6;text-shadow:0 1px 3px #000,0 0 8px #000">${'ABC'[i]} · ${FRAMES[i]}</span></div>`).join('')}</body>`);
await sheet.screenshot({ path: path.join(here, `hud-${SCENE}-close.jpg`), type: 'jpeg', quality: 88, fullPage: true });
await browser.close(); srv.close();
