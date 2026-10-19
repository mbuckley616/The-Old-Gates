// node docs/prototypes/levelup/shrines-church.check.mjs (Session 1172): the six gods' row at the town church (shrines-church.html) in
// the test Chromium, each of the three places. Every page renders with no page errors. back (A): the row stands inside the plot as the
// town lays it now (10.4 by 30.4 m), clear of the chancel, with room to kneel between its basins and the chancel's eaves (1.2 m or more: the 3 m
// yard leaves no more).
// side (B): the plot widened by 2.5 m and no more, the row inside it, the nave's flank 2 m or more from the basins (the path runs
// between). square (C): the plot as laid, the row wholly outside it, west of the tower's face, and off the main street. In all three:
// the row is 7 niches long (9.4 m), no part of the church stands on the place where one kneels at An Teallach's basin, and the row is
// in budget (the yard form 25k triangles, the wayside form 35k).
import { chromium } from 'playwright'; import http from 'http'; import fs from 'fs'; import path from 'path'; import { fileURLToPath } from 'url';
const here = path.dirname(fileURLToPath(import.meta.url));
const types = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json', '.bin': 'application/octet-stream' };
const srv = http.createServer((q, r) => { const f = path.join(here, decodeURIComponent(q.url.split('?')[0])); if (!f.startsWith(here) || !fs.existsSync(f)) { r.writeHead(404); return r.end(); } r.writeHead(200, { 'content-type': types[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(r); }).listen(0);
const port = srv.address().port, launch = { args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] };
if (!fs.existsSync(chromium.executablePath()) && fs.existsSync('/opt/pw-browsers/chromium')) launch.executablePath = '/opt/pw-browsers/chromium';
const browser = await chromium.launch(launch); let fails = 0;
const check = (name, ok, info) => { console.log((ok ? 'PASS ' : 'FAIL ') + name + (info !== undefined ? '  ' + JSON.stringify(info) : '')); if (!ok) fails++; };
const inside = (b, P, m = 0) => b[0] >= P.x0 - m && b[2] <= P.x1 + m && b[1] >= P.z0 - m && b[3] <= P.z1 + m;
const hit = (b, x, z) => x > b[0] && x < b[2] && z > b[1] && z < b[3];
const r2 = v => +v.toFixed(2);
for (const place of ['back', 'side', 'square']) {
  const page = await browser.newPage({ viewport: { width: 480, height: 270 } }), errs = []; page.on('pageerror', e => errs.push(String(e)));
  await page.goto(`http://localhost:${port}/shrines-church.html?still&w=480&h=270&nopeople&place=${place}`);
  await Promise.race([page.waitForFunction(() => window.__done, null, { timeout: 300000 }), new Promise(res => page.on('pageerror', res))]);
  check(`${place}: renders with no page errors`, errs.length === 0, errs.slice(0, 2));
  const S = await page.evaluate(() => window.__stats.places && window.__stats.places[0]); await page.close();
  if (!S) { check(`${place}: the page reports its place`, false); continue; }
  const P = S.plot, rb = S.rowBox, parts = S.parts;
  check(`${place}: the row is seven niches, 9.4 m`, Math.abs(S.row.len - 9.4) < .01, S.row.len);
  check(`${place}: the row in budget`, S.row.tris <= (place === 'square' ? 35000 : 25000), { tris: S.row.tris, draws: S.row.draws });
  check(`${place}: nothing of the church where one kneels at An Teallach's basin`, !parts.some(p => hit(p.box, S.kneel[0], S.kneel[1])), S.kneel);
  check(`${place}: the row clear of every part of the church`, parts.every(p => rb[2] <= p.box[0] || rb[0] >= p.box[2] || rb[3] <= p.box[1] || rb[1] >= p.box[3]), parts.map(p => p.name));
  if (place === 'back') {
    check('back: the plot as the town lays it (10.4 by 30.4 m)', P.w === 10.4 && P.d === 30.4, P);
    check('back: the row inside the plot', inside(rb, P, .05), { rb, P });
    const ch = parts.find(p => /Chancel/.test(p.name)); check('back: 1.2 m or more between the basins and the chancel\'s eaves (one kneels; no one passes behind)', S.basin[0] - .25 - ch.box[2] >= 1.2, r2(S.basin[0] - .25 - ch.box[2]));
  } else if (place === 'side') {
    check('side: the plot 2.5 m wider and no more (12.9 by 30.4 m)', P.w === 12.9 && P.d === 30.4, P);
    check('side: the row inside the plot', inside(rb, P, .05), { rb, P });
    const nv = parts.find(p => /Nave/.test(p.name)); check('side: 2 m or more between the basins and the nave\'s flank', nv.box[1] - (S.basin[1] + .25) >= 2, r2(nv.box[1] - (S.basin[1] + .25)));
  } else {
    check('square: the plot as the town lays it (10.4 by 30.4 m)', P.w === 10.4 && P.d === 30.4, P);
    check('square: the row wholly outside the plot, west of the tower\'s face', rb[2] < P.x0, { rowEast: rb[2], towerFace: P.x0 });
    check('square: the row off the main street (its kerb 5 m off the flank\'s line)', rb[3] < 5.0, rb[3]);
  }
}
await browser.close(); srv.close(); console.log(fails ? `${fails} FAILED` : 'all pass'); process.exit(fails ? 1 : 0);
