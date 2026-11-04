// node docs/prototypes/levelup/ships-banner-sheet.mjs [--set=ship:banner[:view],...] [--out=name] (Session 1847): the ship's banner,
// ships.js's banner(), on hulls from ships.html. Each panel is one still (the quarter view unless a view is named), its label the ship,
// the nation and the flag's size. Default: the five classes across the three dresses, each flying its island's banner. A cam is x/y/z/tx/ty/tz.
// -> ships-banner[-<out>].jpg, 1920×1080, four panels a row
import { chromium } from 'playwright'; import http from 'http'; import fs from 'fs'; import path from 'path'; import { fileURLToPath } from 'url';
const here = path.dirname(fileURLToPath(import.meta.url)), arg = k => (process.argv.find(a => a.startsWith('--' + k + '=')) || '').split('=')[1];
const SET = (arg('set') || 'sloop:gatelands,marksloop:mark:quarter:17/8/19/0/7.6/.5,aursloop:aurenne,cog:gatelands,markcog:mark,caravel:aurenne,galleon:gatelands,aurgalleon:aurenne').split(',').map(s => s.split(':'));
const OUT = arg('out');
const types = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json', '.bin': 'application/octet-stream' };
const srv = http.createServer((q, r) => { const f = path.join(here, decodeURIComponent(q.url.split('?')[0])); if (!f.startsWith(here) || !fs.existsSync(f)) { r.writeHead(404); return r.end(); } r.writeHead(200, { 'content-type': types[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(r); }).listen(0);
const launch = { args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] }; if (!fs.existsSync(chromium.executablePath()) && fs.existsSync('/opt/pw-browsers/chromium')) launch.executablePath = '/opt/pw-browsers/chromium';
const b = await chromium.launch(launch), shots = [], names = [], stats = [], errs = [];
for (const [ship, ban, view, cam0] of SET) { const cam = cam0 && cam0.replace(/\//g, ','); const p = await b.newPage({ viewport: { width: 960, height: 540 } }); p.on('pageerror', e => errs.push(String(e)));
  await p.goto(`http://localhost:${srv.address().port}/ships.html?still&w=960&h=540&ship=${ship}&banner=${ban}${view ? '&view=' + view : ''}${cam ? '&cam=' + cam : ''}`); await p.waitForFunction(() => window.__done || window.__err, null, { timeout: 600000 });
  await p.evaluate(() => { const n = document.getElementById('note'); if (n) n.style.display = 'none'; });
  shots.push(await p.evaluate(() => document.querySelector('canvas').toDataURL('image/jpeg', .9))); const s = await p.evaluate(() => window.__stats.ship);
  stats.push(s); names.push(`${ship} · ${s.banner ? s.banner.nation + (s.banner.hoist ? ` · ${s.banner.hoist}×${s.banner.fly} m` : '') : '—'}`); await p.close(); process.stdout.write('.'); }
const cells = shots.map((u, i) => `<div><img src="${u}"><b>${names[i]}</b></div>`).join(''), rows = Math.ceil(shots.length / 4);
const p = await b.newPage({ viewport: { width: 1920, height: 540 * rows } });
await p.setContent(`<style>body{margin:0;background:#0d1014;display:grid;grid-template-columns:repeat(4,480px);grid-template-rows:repeat(${rows},540px)}div{position:relative;overflow:hidden}
img{width:960px;height:540px;margin-left:-240px;object-fit:cover}b{position:absolute;left:12px;bottom:10px;color:#f3ead6;font:600 22px system-ui;text-shadow:0 1px 3px #000}</style>${cells}`);
const name = `ships-banner${OUT ? '-' + OUT : ''}.jpg`; await p.screenshot({ path: path.join(here, name), type: 'jpeg', quality: 88 }); await b.close(); srv.close();
console.log('\n' + name); for (const s of stats) console.log(JSON.stringify({ ship: s.ship, view: s.view, banner: s.banner })); console.log('errs', errs.slice(0, 3));
