// node docs/prototypes/levelup/helms-sheet.mjs [--set=a|b|c] [--kind=robe] (the concept artist, 17 Oct 2026): each tier's head close,
// shot from helms.html?view=head, laid out as one 5 × 2 sheet at 1920×1080, each panel named -> helms-sheet-<set>.jpg
// (or helms-hoods-<set>.jpg for the robe line's six, Mithril to Cosmic, 3 × 2).
import { chromium } from 'playwright'; import http from 'http'; import fs from 'fs'; import path from 'path'; import { fileURLToPath } from 'url';
const here = path.dirname(fileURLToPath(import.meta.url)), arg = k => (process.argv.find(a => a.startsWith('--' + k + '=')) || '').split('=')[1];
const SET = arg('set') || 'b', KIND = arg('kind') || 'heavy', NAMES = [null, 'Wooden', 'Bronze', 'Iron', 'Steel', 'Mithril', 'Adamant', 'Obsidian', 'Draconic', 'Demonic', 'Cosmic'];
const tiers = KIND === 'robe' ? [5, 6, 7, 8, 9, 10] : [1, 2, 3, 4, 5, 6, 7, 8, 9, 10], cols = KIND === 'robe' ? 3 : 5;
const types = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json', '.bin': 'application/octet-stream' };
const srv = http.createServer((q, r) => { const f = path.join(here, decodeURIComponent(q.url.split('?')[0])); if (!f.startsWith(here) || !fs.existsSync(f)) { r.writeHead(404); return r.end(); } r.writeHead(200, { 'content-type': types[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(r); }).listen(0);
const launch = { args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] }; if (!fs.existsSync(chromium.executablePath()) && fs.existsSync('/opt/pw-browsers/chromium')) launch.executablePath = '/opt/pw-browsers/chromium';
const b = await chromium.launch(launch), shots = [], stats = [];
for (const t of tiers) { const p = await b.newPage({ viewport: { width: 1920, height: 1080 } });
  await p.goto(`http://localhost:${srv.address().port}/helms.html?still&w=1920&h=1080&view=head&tier=${t}&set=${SET}&kind=${KIND}`); await p.waitForFunction(() => window.__done || window.__err, null, { timeout: 600000 });
  shots.push(await p.evaluate(() => document.querySelector('canvas').toDataURL('image/jpeg', .9))); stats.push(await p.evaluate(() => window.__stats.people[0])); await p.close(); }
const w = 1920 / cols, cells = shots.map((u, i) => `<div><img src="${u}"><b>${NAMES[tiers[i]]}</b></div>`).join('');
const p = await b.newPage({ viewport: { width: 1920, height: 1080 } });
await p.setContent(`<style>body{margin:0;background:#0d1014;display:grid;grid-template-columns:repeat(${cols},${w}px);grid-template-rows:repeat(2,540px)}div{position:relative;overflow:hidden}
img{width:960px;height:540px;margin-left:${-(960 - w) / 2}px;object-fit:cover}b{position:absolute;left:12px;bottom:10px;color:#f3ead6;font:600 22px system-ui;text-shadow:0 1px 3px #000}</style>${cells}`);
const name = (KIND === 'robe' ? 'helms-hoods-' : 'helms-sheet-') + SET + '.jpg'; await p.screenshot({ path: path.join(here, name), type: 'jpeg', quality: 88 }); await b.close(); srv.close();
console.log(name, JSON.stringify(stats.map(s => [s.tier, s.tris, s.draws, s.gap, s.above])));
