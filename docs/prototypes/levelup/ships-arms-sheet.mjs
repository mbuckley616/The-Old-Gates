// node docs/prototypes/levelup/ships-arms-sheet.mjs [q ...] (Session 2243): the ship's arms (ships-arms.js). With no arguments, the
// pictures: ships-arms.jpg (the ballista at the bow of the five classes and the Mark's cutter, 3 × 2), ships-arms-close.jpg (the ballista
// close, its traverse to 30° either side, the fire bolt; and Aurenne's bronze), ships-arms-guns.jpg (the galleon's guns run out in her
// three dresses, and her ports shut beside them). With arguments, one 960×540 shot each to the scratch path given by OUT (default .).
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
const args = process.argv.slice(2);
if (args.length) { for (const q of args) { const u = await shot(q); fs.writeFileSync(path.join(process.env.OUT || '.', q.replace(/[^a-z0-9]+/gi, '_').slice(0, 80) + '.jpg'), Buffer.from(u.split(',')[1], 'base64')); } }
else {
  const main = [['ship=sloop&ballista&view=bow&front', 'the sloop, 0.8 m to starboard'], ['ship=cutter&ballista&view=bow&cam=-3.4,3.0,4.6,-0.7,1.9,2.8', 'the Mark’s cutter, by her mast'], ['ship=caravel&ballista&view=bow', 'Aurenne’s caravel'],
    ['ship=cog&ballista&view=bow', 'the cog, on her forecastle'], ['ship=galleon&ballista&view=bow', 'the galleon, on her forecastle'], ['ship=glcutter&ballista&black&view=bow&cam=2.4,3.6,5.2,-0.8,1.9,2.9', 'a black-sail cutter’s']];
  const cells = []; for (const [q, t] of main) cells.push([await shot(q), t]); await sheet('ships-arms.jpg', cells, 3, 2);
  const close = [['ship=sloop&ballista=-30&view=bow&front', 'traversed 30° to starboard'], ['ship=sloop&ballista=30&view=bow&front', '30° to port'], ['ship=sloop&ballista&fire&view=bow&cam=0.2,3.5,2.6,-0.8,2.3,3.5', 'a fire bolt laid'], ['ship=aursloop&ballista&view=bow&front', 'Aurenne’s, bronze-bound']];
  const cc = []; for (const [q, t] of close) cc.push([await shot(q), t]); await sheet('ships-arms-close.jpg', cc, 2, 2);
  const guns = [['ship=galleon&guns&view=ports', 'the Gatelands galleon, run out'], ['ship=markgalleon&guns&view=ports', 'the Mark’s'], ['ship=aurgalleon&guns&view=ports', 'Aurenne’s, bronze'], ['ship=galleon&view=ports', 'her ports shut, as today']];
  const gc = []; for (const [q, t] of guns) gc.push([await shot(q), t]); await sheet('ships-arms-guns.jpg', gc, 2, 2);
}
b.close(); srv.close();
for (const [q, s] of Object.entries(stats)) console.log(q, s.tris, s.draws, JSON.stringify(s.ballista && { z: s.ballista.z, y: s.ballista.y, R: s.ballista.R, tris: s.ballista.tris, draws: s.ballista.draws }), JSON.stringify(s.guns));
console.log('errs', errs.slice(0, 3));
