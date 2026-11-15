// node docs/prototypes/levelup/ships-fx-sheet.mjs (Session 2244): ships-fx.js's effects on the ships page, one 3 × 2 sheet, ships-fx.jpg:
// the broadside's flash at 0.1 s, its smoke at 2 s with a ball fallen short, the four shot at true size, a rig alight 6 s after catching,
// the same rig 4 s after her hands put it out (the char), and a sloop halfway down. ships-fx-founder.jpg: the sloop foundering at 0, 0.3,
// 0.6 and 0.9 of the way.
import { chromium } from 'playwright'; import http from 'http'; import fs from 'fs'; import path from 'path'; import { fileURLToPath } from 'url';
const here = path.dirname(fileURLToPath(import.meta.url));
const types = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json', '.bin': 'application/octet-stream' };
const srv = http.createServer((q, r) => { const f = path.join(here, decodeURIComponent(q.url.split('?')[0])); if (!f.startsWith(here) || !fs.existsSync(f)) { r.writeHead(404); return r.end(); } r.writeHead(200, { 'content-type': types[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(r); }).listen(0);
const launch = { args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] }; if (!fs.existsSync(chromium.executablePath()) && fs.existsSync('/opt/pw-browsers/chromium')) launch.executablePath = '/opt/pw-browsers/chromium';
const b = await chromium.launch(launch), errs = [], stats = {};
async function shot(q) { const p = await b.newPage({ viewport: { width: 960, height: 540 } }); p.on('pageerror', e => errs.push(String(e)));
  await p.goto(`http://localhost:${srv.address().port}/ships.html?still&w=960&h=540&${q}`); await p.waitForFunction(() => window.__done || window.__err, null, { timeout: 600000 });
  await p.evaluate(() => { const n = document.getElementById('note'); if (n) n.style.display = 'none'; });
  const u = await p.evaluate(() => document.querySelector('canvas').toDataURL('image/jpeg', .9)), s = await p.evaluate(() => window.__stats.ship); stats[q] = s.fx; await p.close(); process.stdout.write('.'); return u; }
async function sheet(name, cells, cols, rows) { const p = await b.newPage({ viewport: { width: 1920, height: 1080 } }), w = 1920 / cols, h = 1080 / rows;
  await p.setContent(`<style>body{margin:0;background:#0d1014;display:grid;grid-template-columns:repeat(${cols},${w}px);grid-template-rows:repeat(${rows},${h}px)}div{position:relative;overflow:hidden}
img{width:${h * 16 / 9}px;height:${h}px;margin-left:${(w - h * 16 / 9) / 2}px;object-fit:cover}b{position:absolute;left:12px;bottom:10px;color:#f3ead6;font:600 22px system-ui;text-shadow:0 1px 3px #000}</style>${cells.map(([u, t]) => `<div><img src="${u}"><b>${t}</b></div>`).join('')}`);
  await p.screenshot({ path: path.join(here, name), type: 'jpeg', quality: 88 }); await p.close(); }
const main = [['ship=galleon&guns&smoke=0.1&side=1&view=ports', 'the broadside, 0.1 s: the first guns’ flash'], ['ship=galleon&guns&smoke=2&splash=0.45&view=fight', '2 s: her smoke, a ball fallen short'],
  ['ship=galleon&shot&view=shot', 'shell, round, chain, grape: true size'], ['ship=galleon&burn=6&view=quarter&cam=-15,9,14,0,7,-1', 'her rig alight, 6 s'],
  ['ship=galleon&burn=12&out=8&view=quarter&cam=-15,9,14,0,7,-1', 'doused at 8 s: the char'], ['ship=sloop&founder=0.5&view=quarter', 'a sloop halfway down']];
const cells = []; for (const [q, t] of main) cells.push([await shot(q), t]); await sheet('ships-fx.jpg', cells, 3, 2);
const f = []; for (const u of [0, .3, .6, .9]) f.push([await shot(`ship=sloop&founder=${u}&view=quarter`), `foundering, ${u}`]); await sheet('ships-fx-founder.jpg', f, 2, 2);
b.close(); srv.close(); for (const [q, s] of Object.entries(stats)) console.log(q, JSON.stringify(s)); console.log('errs', errs.slice(0, 3));
