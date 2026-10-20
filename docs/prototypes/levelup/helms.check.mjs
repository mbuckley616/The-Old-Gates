// node docs/prototypes/levelup/helms.check.mjs [--tiers=4,9] (Session 1193): the armour's helms by tier (helms.js, OG-052), on Michael's C
// of 18 Oct: "the higher tier helmets should not show the wearer's face at all". For Steel and the six magical tiers shut, from fifteen
// points of view across the front, not one point of the face shows; the sight is a real cut, so some rays reach the dark behind it;
// the shell clears the head; a helm stays under 12,000 triangles and 6 draws. The same helms open (set b) still show the face, so the
// test can fail. One page per helm, each its own person, as helms-sheet.mjs shoots them.
import { chromium } from 'playwright'; import http from 'http'; import fs from 'fs'; import path from 'path'; import { fileURLToPath } from 'url';
const here = path.dirname(fileURLToPath(import.meta.url)), arg = k => (process.argv.find(a => a.startsWith('--' + k + '=')) || '').split('=')[1];
if (!fs.existsSync(path.join(here, 'mh/pack.bin'))) { console.log('no pack: run python3 docs/prototypes/levelup/mh_pack.py first'); process.exit(2); }
const types = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json', '.bin': 'application/octet-stream' };
const srv = http.createServer((q, r) => { const f = path.join(here, decodeURIComponent(q.url.split('?')[0])); if (!f.startsWith(here) || !fs.existsSync(f)) { r.writeHead(404); return r.end(); } r.writeHead(200, { 'content-type': types[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(r); }).listen(0);
const launch = { args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] }; if (!fs.existsSync(chromium.executablePath()) && fs.existsSync('/opt/pw-browsers/chromium')) launch.executablePath = '/opt/pw-browsers/chromium';
const b = await chromium.launch(launch); let fails = 0;
const check = (name, ok, info) => { console.log((ok ? 'PASS ' : 'FAIL ') + name + (info !== undefined && !ok ? '  ' + JSON.stringify(info).slice(0, 1200) : '')); if (!ok) fails++; };
const one = async (tier, set) => { const p = await b.newPage({ viewport: { width: 320, height: 180 } }), errs = []; p.on('pageerror', e => errs.push(String(e)));
  await p.goto(`http://localhost:${srv.address().port}/helms.html?still&w=320&h=180&view=head&check&tier=${tier}&set=${set}`);
  await p.waitForFunction(() => window.__done || window.__err, null, { timeout: 600000 }); const s = await p.evaluate(() => ({ st: window.__stats, err: window.__err })); await p.close();
  return { ...s.st.people[0], errs: [...errs, ...(s.err ? [String(s.err)] : []), ...(s.st.err ? [s.st.err] : [])] }; };
const TIERS = (arg('tiers') || '4,5,6,7,8,9,10').split(',').map(Number);
for (const t of TIERS) { const c = await one(t, 'c'), f = c.face || {};
  check(`${c.tier} shut builds without an error`, !c.errs.length && !!c.face, c.errs);
  check(`${c.tier} shut: no point of the face shows (${f.pts} points × ${f.views} views, ${f.seen} seen)`, f.seen === 0, f);
  check(`${c.tier} shut: the sight is cut through, ${f.through} rays reach the dark behind it`, f.through > 0, f);
  check(`${c.tier} shut: the shell clears the head by ${(c.gap * 100).toFixed(1)} cm`, c.gap > .008, c.gap);
  check(`${c.tier} shut: ${c.tris.toLocaleString()} triangles in ${c.draws} draws`, c.tris < 12000 && c.draws <= 6, [c.tris, c.draws]);
  if (t >= 5) { const o = await one(t, 'b'); check(`${o.tier} open (set b) still shows the face: ${o.face?.seen} of ${o.face?.rays} rays`, !o.errs.length && o.face?.seen > o.face?.rays * .3, o); } }
await b.close(); srv.close();
console.log(fails ? `${fails} failed` : 'all pass'); process.exit(fails ? 1 : 0);
