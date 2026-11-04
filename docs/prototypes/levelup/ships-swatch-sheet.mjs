// node docs/prototypes/levelup/ships-swatch-sheet.mjs [--island=gatelands|mark|aurenne] [--ship=sloop] (Session 1836): the yard's colours,
// ships.js's SWATCHES, on one hull from ships.html's quarter view. Top row: the four paints under the first cloth; bottom row: the three
// cloths on the first paint, and the last paint under the last cloth. One 4 × 2 sheet at 1920×1080, each panel named
// -> ships-swatch-<island>[-<ship>].jpg
import { chromium } from 'playwright'; import http from 'http'; import fs from 'fs'; import path from 'path'; import { fileURLToPath } from 'url';
const here = path.dirname(fileURLToPath(import.meta.url)), arg = k => (process.argv.find(a => a.startsWith('--' + k + '=')) || '').split('=')[1];
const ISL = arg('island') || 'gatelands', HULL = arg('ship') || 'sloop';
const SHIP = { gatelands: { sloop: 'sloop', cutter: 'glcutter', caravel: 'glcaravel', cog: 'cog', galleon: 'galleon' }, mark: { sloop: 'marksloop', cutter: 'cutter', caravel: 'markcaravel', cog: 'markcog', galleon: 'markgalleon' }, aurenne: { sloop: 'aursloop', cutter: 'aurcutter', caravel: 'caravel', cog: 'aurcog', galleon: 'aurgalleon' } }[ISL][HULL];
const types = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json', '.bin': 'application/octet-stream' };
const srv = http.createServer((q, r) => { const f = path.join(here, decodeURIComponent(q.url.split('?')[0])); if (!f.startsWith(here) || !fs.existsSync(f)) { r.writeHead(404); return r.end(); } r.writeHead(200, { 'content-type': types[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(r); }).listen(0);
const launch = { args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] }; if (!fs.existsSync(chromium.executablePath()) && fs.existsSync('/opt/pw-browsers/chromium')) launch.executablePath = '/opt/pw-browsers/chromium';
const panels = [[0, 0], [1, 0], [2, 0], [3, 0], [0, 1], [0, 2], [3, 2], [2, 1]];
const b = await chromium.launch(launch), shots = [], names = [], errs = [];
for (const [pi, ci] of panels) { const p = await b.newPage({ viewport: { width: 960, height: 540 } }); p.on('pageerror', e => errs.push(String(e)));
  await p.goto(`http://localhost:${srv.address().port}/ships.html?still&w=960&h=540&ship=${SHIP}&paint=${pi}&cloth=${ci}`); await p.waitForFunction(() => window.__done || window.__err, null, { timeout: 600000 });
  await p.evaluate(() => { const n = document.getElementById('note'); if (n) n.style.display = 'none'; });
  shots.push(await p.evaluate(() => document.querySelector('canvas').toDataURL('image/jpeg', .9))); const s = await p.evaluate(() => window.__stats.ship.swatch);
  names.push(`${s.paint} · ${s.cloth}`); await p.close(); process.stdout.write('.'); }
const cells = shots.map((u, i) => `<div><img src="${u}"><b>${names[i]}</b></div>`).join('');
const p = await b.newPage({ viewport: { width: 1920, height: 1080 } });
await p.setContent(`<style>body{margin:0;background:#0d1014;display:grid;grid-template-columns:repeat(4,480px);grid-template-rows:repeat(2,540px)}div{position:relative;overflow:hidden}
img{width:960px;height:540px;margin-left:-240px;object-fit:cover}b{position:absolute;left:12px;bottom:10px;color:#f3ead6;font:600 22px system-ui;text-shadow:0 1px 3px #000}</style>${cells}`);
const name = `ships-swatch-${ISL}${HULL === 'sloop' ? '' : '-' + HULL}.jpg`; await p.screenshot({ path: path.join(here, name), type: 'jpeg', quality: 88 }); await b.close(); srv.close();
console.log('\n' + name, names.join(' | '), 'errs', errs.slice(0, 3));
