// node docs/prototypes/levelup/ships-black-sheet.mjs (Session 2122): the black sail's dress (ships.js's blackSail) on the game's three
// pirate classes. Top row: the sloop, the cutter and the galleon in the Mark's hulls; bottom row: the same three in the hulls of the other
// two islands' waters (the Gatelands' sloop, Aurenne's cutter, the Gatelands' galleon), the island's mark struck to a ghost. One 3 × 2 sheet
// at 1920×1080 -> ships-black.jpg, and two closes: ships-black-ghost.jpg (the harp's ghost on the Gatelands sloop's sail, and the clean
// sail beside it) and ships-black-flag.jpg (no colours, and the black flag with its red hem, on the Mark's cutter).
import { chromium } from 'playwright'; import http from 'http'; import fs from 'fs'; import path from 'path'; import { fileURLToPath } from 'url';
const here = path.dirname(fileURLToPath(import.meta.url));
const types = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json', '.bin': 'application/octet-stream' };
const srv = http.createServer((q, r) => { const f = path.join(here, decodeURIComponent(q.url.split('?')[0])); if (!f.startsWith(here) || !fs.existsSync(f)) { r.writeHead(404); return r.end(); } r.writeHead(200, { 'content-type': types[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(r); }).listen(0);
const launch = { args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] }; if (!fs.existsSync(chromium.executablePath()) && fs.existsSync('/opt/pw-browsers/chromium')) launch.executablePath = '/opt/pw-browsers/chromium';
const b = await chromium.launch(launch), errs = [], stats = {};
async function shot(q) { const p = await b.newPage({ viewport: { width: 960, height: 540 } }); p.on('pageerror', e => errs.push(String(e)));
  await p.goto(`http://localhost:${srv.address().port}/ships.html?still&w=960&h=540&${q}`); await p.waitForFunction(() => window.__done || window.__err, null, { timeout: 600000 });
  await p.evaluate(() => { const n = document.getElementById('note'); if (n) n.style.display = 'none'; });
  const u = await p.evaluate(() => document.querySelector('canvas').toDataURL('image/jpeg', .9)), s = await p.evaluate(() => window.__stats.ship); stats[q] = s; await p.close(); process.stdout.write('.'); return u; }
async function sheet(name, cells, cols, rows) { const p = await b.newPage({ viewport: { width: 1920, height: 1080 } }), w = 1920 / cols, h = 1080 / rows;
  await p.setContent(`<style>body{margin:0;background:#0d1014;display:grid;grid-template-columns:repeat(${cols},${w}px);grid-template-rows:repeat(${rows},${h}px)}div{position:relative;overflow:hidden}
img{width:${h * 16 / 9}px;height:${h}px;margin-left:${(w - h * 16 / 9) / 2}px;object-fit:cover}b{position:absolute;left:12px;bottom:10px;color:#f3ead6;font:600 22px system-ui;text-shadow:0 1px 3px #000}</style>${cells.map(([u, t]) => `<div><img src="${u}"><b>${t}</b></div>`).join('')}`);
  await p.screenshot({ path: path.join(here, name), type: 'jpeg', quality: 88 }); await p.close(); }
const main = [['ship=marksloop&black', 'the Mark’s sloop'], ['ship=cutter&black', 'the Mark’s cutter'], ['ship=markgalleon&black', 'the Mark’s galleon'],
  ['ship=sloop&black', 'the Gatelands’ sloop'], ['ship=aurcutter&black', 'Aurenne’s cutter'], ['ship=galleon&black', 'the Gatelands’ galleon']];
const cells = []; for (const [q, t] of main) cells.push([await shot(q), t]); await sheet('ships-black.jpg', cells, 3, 2);
const g = [[await shot('ship=sloop&black&cam=9,4.5,10,0,4.2,0'), 'the harp struck to a ghost'], [await shot('ship=sloop&black=clean&cam=9,4.5,10,0,4.2,0'), 'struck outright']]; await sheet('ships-black-ghost.jpg', g, 2, 1);
const f = [[await shot('ship=cutter&black&cam=22,8,26,0,8,0'), 'no colours'], [await shot('ship=cutter&black&flag=black&cam=22,8,26,0,8,0'), 'a black flag, a red hem']]; await sheet('ships-black-flag.jpg', f, 2, 1);
b.close(); srv.close();
for (const [q, s] of Object.entries(stats)) console.log(q, s.tris, s.draws, JSON.stringify(s.black));
console.log('errs', errs.slice(0, 3));
