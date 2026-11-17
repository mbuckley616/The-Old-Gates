// node docs/prototypes/levelup/lamps.check.mjs [--shots] (the look builder, Session 2352): lamps.js in the test Chromium. The lamp at the
// draft's size (a board a hand across, a clay lamp on it, the flame at the nozzle), floating; the line on the ebb as the game's hours give it
// (a lamp every 20 s on a 0.12 m/s ebb: 2.4 m apart, the first in the furthest out, none past the mouth); the same twice; in budget; every
// view and every way of lighting renders with no page errors. --shots writes lamps-<how>-<cam>.jpg (1920x1080) beside this file.
import { chromium } from 'playwright'; import http from 'http'; import fs from 'fs'; import path from 'path'; import { fileURLToPath } from 'url';
const here = path.dirname(fileURLToPath(import.meta.url));
const types = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json', '.bin': 'application/octet-stream' };
const srv = http.createServer((q, r) => { const f = path.join(here, decodeURIComponent(q.url.split('?')[0])); if (!f.startsWith(here) || !fs.existsSync(f)) { r.writeHead(404); return r.end(); } r.writeHead(200, { 'content-type': types[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(r); }).listen(0);
const port = srv.address().port, launch = { args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] };
if (!fs.existsSync(chromium.executablePath()) && fs.existsSync('/opt/pw-browsers/chromium')) launch.executablePath = '/opt/pw-browsers/chromium';
const browser = await chromium.launch(launch); let fails = 0;
const check = (name, ok, info) => { console.log((ok ? 'PASS ' : 'FAIL ') + name + (info !== undefined ? '  ' + JSON.stringify(info) : '')); if (!ok) fails++; };

const page = await browser.newPage({ viewport: { width: 320, height: 180 } }); const perr = []; page.on('pageerror', e => perr.push(String(e).slice(0, 300)));
await page.goto(`http://localhost:${port}/lamps.html?still&w=320&h=180`); await page.waitForFunction(() => window.__done, null, { timeout: 300000 });
const r = await page.evaluate(async () => { const THREE = await import('three'), K = await import('./lamps.js');
  const hash = g => { let h = 0; g.traverse(m => { if (!m.isMesh) return; const a = m.geometry.attributes.position.array; for (let i = 0; i < a.length; i += 3) h = (h * 31 + Math.round(a[i] * 1e4)) | 0; }); return h; };
  const out = { same: {}, tris: {}, box: {} };
  for (const how of ['flame', 'pool', 'light']) { const a = K.lamp({ how }), b = K.lamp({ how }); out.same[how] = hash(a.g) === hash(b.g); out.tris[how] = a.tris; let L = 0; a.g.traverse(o => { if (o.isPointLight) L++; }); out['lights_' + how] = L; }
  { const A = K.lamp({ how: 'flame' }), bb = new THREE.Box3().setFromObject(A.g); out.box = { min: bb.min.toArray().map(v => +v.toFixed(3)), max: bb.max.toArray().map(v => +v.toFixed(3)) }; out.flame = A.g.userData.flame.toArray().map(v => +v.toFixed(3)); }
  const from = new THREE.Vector3(2.1, 0, -3.2), to = new THREE.Vector3(0, 0, -72), L1 = K.line(14, from, to, 5, 5), L2 = K.line(14, from, to, 5, 5), L3 = K.line(14, from, to, 30, 5);
  const along = L1.lamps.map(l => l.s), gaps = along.slice(1).map((s, i) => +(along[i] - s).toFixed(3)), dmax = Math.hypot(to.x - from.x, to.z - from.z);
  const off = L1.lamps.map(l => { const t = to.clone().sub(from).normalize(), d = l.p.clone().sub(from); return +Math.abs(d.x * -t.z + d.z * t.x).toFixed(3); });
  return { ...out, gaps, off, dmax, same2: hash(L1.g) === hash(L2.g), late: L3.lamps.map(l => +l.s.toFixed(2)), LAMP: K.LAMP, stats: window.__stats };
});
console.log(JSON.stringify({ tris: r.tris, box: r.box, flame: r.flame, gaps: r.gaps, view: { tris: r.stats.tris, calls: r.stats.calls } }));
check('the board is a hand across (0.24 by 0.17 m), floating just proud of the water, and the lamp sits on it under 0.1 m high', Math.abs(r.box.max[0] - r.box.min[0] - .24) < .04 && r.box.min[1] > -.02 && r.box.max[1] < .12 && r.box.max[1] > .06, r.box);
check('the flame stands at the nozzle\'s tip, over the board\'s edge', r.flame[0] > .05 && r.flame[0] < .13 && r.flame[1] > .05, r.flame);
check('the ebb\'s numbers: a lamp every 20 s on 0.12 m/s is the 2.4 m gap', Math.abs(r.LAMP.every * r.LAMP.ebb - r.LAMP.gap) < 1e-9, r.LAMP);
check('in the line the first lamp in is the furthest out, each the next 2.4 m behind it', r.gaps.every(g => Math.abs(g - 2.4) < .001), r.gaps);
check('the line wanders no more than 0.7 m off the ebb\'s path', r.off.every(o => o <= .7), r.off);
check('after half an hour every lamp has reached the mouth and none has gone past it', r.late.every(s => Math.abs(s - r.dmax) < .01), { late: r.late, mouth: +r.dmax.toFixed(2) });
check('each way of lighting is the same twice, and the line too', Object.values(r.same).every(Boolean) && r.same2, { ...r.same, line: r.same2 });
check('a lamp is in budget (flame 400 triangles, the pool adds 2), and only the light way carries a light', r.tris.flame <= 400 && r.tris.pool <= r.tris.flame + 2 && r.lights_flame === 0 && r.lights_pool === 0 && r.lights_light === 1, r.tris);
check('the quay page has no page errors', perr.length === 0, perr.slice(0, 2)); await page.close();

const SHOTS = { 'flame-quay': 'how=flame&cam=quay', 'pool-quay': 'how=pool&cam=quay', 'light-quay': 'how=light&cam=quay', 'pool-near': 'how=pool&cam=near', 'flame-near': 'how=flame&cam=near', 'pool-high': 'how=pool&cam=high', 'pool-mouth': 'how=pool&cam=mouth&h=night' };
const shots = process.argv.includes('--shots');
for (const [k, q] of Object.entries(SHOTS)) { const p = await browser.newPage({ viewport: shots ? { width: 1920, height: 1080 } : { width: 480, height: 270 } }); const errs = []; p.on('pageerror', e => errs.push(String(e).slice(0, 300)));
  await p.goto(`http://localhost:${port}/lamps.html?still&w=${shots ? 1920 : 480}&h=${shots ? 1080 : 270}&${q}`); await p.waitForFunction(() => window.__done, null, { timeout: 300000 });
  const st = await p.evaluate(() => window.__stats);
  if (shots) { await p.evaluate(() => document.getElementById('note').style.display = 'none'); const url = await p.evaluate(() => document.querySelector('canvas').toDataURL('image/jpeg', .88)); fs.writeFileSync(path.join(here, 'lamps-' + k + '.jpg'), Buffer.from(url.split(',')[1], 'base64')); }
  check(`the ${k} view renders with no page errors`, errs.length === 0, { errs: errs.slice(0, 2), tris: st.tris, calls: st.calls, lights: st.lights }); await p.close(); }
await browser.close(); srv.close();
console.log(fails ? `${fails} FAILED` : 'all passed'); process.exit(fails ? 1 : 0);
