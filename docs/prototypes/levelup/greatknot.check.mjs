// node docs/prototypes/levelup/greatknot.check.mjs [--shots] (Session 1376): a great gate's ring and its knot (props.js greatKnot) in the
// test Chromium. Every place and state for the six schools: the page renders with no errors; the same key builds the same prop twice;
// in budget (at most 16,000 tris and 6 draws); the ring 30 to 40 m high (visual-foundation §2) with its foot on the chamber's floor
// and clear of the game's 10 m dais (behind its back edge); low, the knot 1.6 to 2.4 m over the dais and within 1.5 m of its middle (a
// standing reach); high, the knot at the ring's heart and a stone on the dais; untied and sealed a knot and no hanging ends, torn
// eleven ends and no knot (low), the sealed knot smaller than the untied.
// --shots writes greatknot-far, -near, -near-torn, -near-sealed, -far-high and -near-high.
import { chromium } from 'playwright'; import http from 'http'; import fs from 'fs'; import path from 'path'; import { fileURLToPath } from 'url';
import { execFileSync } from 'child_process';
const here = path.dirname(fileURLToPath(import.meta.url));
const types = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json', '.bin': 'application/octet-stream' };
const srv = http.createServer((q, r) => { const f = path.join(here, decodeURIComponent(q.url.split('?')[0])); if (!f.startsWith(here) || !fs.existsSync(f)) { r.writeHead(404); return r.end(); } r.writeHead(200, { 'content-type': types[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(r); }).listen(0);
const port = srv.address().port, launch = { args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] };
if (!fs.existsSync(chromium.executablePath()) && fs.existsSync('/opt/pw-browsers/chromium')) launch.executablePath = '/opt/pw-browsers/chromium';
const browser = await chromium.launch(launch); let fails = 0;
const check = (name, ok, info) => { console.log((ok ? 'PASS ' : 'FAIL ') + name + (info !== undefined ? '  ' + JSON.stringify(info) : '')); if (!ok) fails++; };
for (const q of ['view=far', 'view=near&state=torn', 'view=far&place=high&state=sealed']) { const page = await browser.newPage({ viewport: { width: 480, height: 270 } }), errs = []; page.on('pageerror', e => errs.push(String(e)));
  await page.goto(`http://localhost:${port}/greatknot.html?still&w=480&h=270&${q}`); await Promise.race([page.waitForFunction(() => window.__done, null, { timeout: 300000 }), new Promise(res => page.on('pageerror', res))]);
  check(`the page renders with no page errors (${q})`, errs.length === 0, errs.slice(0, 2)); await page.close(); }
const page = await browser.newPage({ viewport: { width: 320, height: 180 } }); await page.goto(`http://localhost:${port}/greatknot.html?still&w=320&h=180`); await page.waitForFunction(() => window.__done, null, { timeout: 300000 });
const out = await page.evaluate(async () => { const THREE = await import('three'), K = await import('./props.js'), S = await import('./pieces.js'), res = [];
  const hash = g => { let h = 0; g.traverse(m => { if (!m.isMesh) return; const a = m.geometry.attributes.position.array; for (let i = 0; i < a.length; i += 7) h = (h * 31 + Math.round(a[i] * 1e4)) | 0; }); return h; };
  for (const school of ['tine', 'uisce', 'cloch', 'scath', 'solas', 'gaoth']) for (const place of ['low', 'high']) for (const state of ['untied', 'torn', 'sealed']) {
    const a = K.greatKnot({ school, place, state }, S.stream('knot:' + school)), b = K.greatKnot({ school, place, state }, S.stream('knot:' + school)); a.group.updateMatrixWorld(true);
    const stone = a.group.children.find(m => m.name === 'gateStone'), sb = new THREE.Box3().setFromObject(stone), knot = a.group.children.find(m => m.name.startsWith('kknot'));
    const kb = knot ? new THREE.Box3().setFromObject(knot) : null;
    res.push({ school, place, state, same: hash(a.group) === hash(b.group), tris: a.tris, draws: a.draws, top: +(a.ring.top + .4).toFixed(2), foot: +sb.min.y.toFixed(2), back: +(a.ring.centre[2] + a.ring.depth / 2).toFixed(2),
      knot: a.knot, ring: a.ring.centre, hasKnot: !!knot, knotW: kb ? +(kb.max.x - kb.min.x).toFixed(2) : 0, ends: a.ends, stone: a.stone }); }
  return res; });
const all = (f) => out.every(f), bad = (f) => out.filter(x => !f(x)).slice(0, 3);
check('36 props (six schools, two places, three states), each the same twice', out.length === 36 && all(x => x.same), bad(x => x.same));
check('in budget: at most 16,000 tris and 6 draws', all(x => x.tris <= 16000 && x.draws <= 6), out.map(x => x.tris + '/' + x.draws).filter((v, i, s) => s.indexOf(v) === i));
check('the ring 30 to 40 m over the chamber\'s floor', all(x => x.top >= 30 && x.top <= 40), out[0].top);
check('its foot on the floor (stone down to the floor or below it)', all(x => x.foot <= -.4), out[0].foot);
check('the ring clear of the dais: its front face behind the dais\'s back edge (z -5)', all(x => x.back < -5), out[0].back);
const low = out.filter(x => x.place === 'low'), high = out.filter(x => x.place === 'high');
check('low: the knot 1.6 to 2.4 m over the dais, within 1.5 m of its middle', low.every(x => x.knot[1] >= 1.6 && x.knot[1] <= 2.4 && Math.hypot(x.knot[0], x.knot[2]) <= 1.5), low[0].knot);
check('high: the knot at the ring\'s heart, a stone on the dais', high.every(x => Math.abs(x.knot[1] - x.ring[1]) < .1 && x.stone && x.stone[1] > .8), [high[0].knot, high[0].stone]);
check('untied and sealed: a knot, no hanging ends', out.filter(x => x.state !== 'torn').every(x => x.hasKnot && x.ends === 0));
check('torn, low: eleven hanging ends and no knot', low.filter(x => x.state === 'torn').every(x => !x.hasKnot && x.ends === 11));
check('the sealed knot smaller than the untied', low.filter(x => x.state === 'sealed').every(x => x.knotW < low.find(y => y.school === x.school && y.state === 'untied').knotW), low.filter(x => x.school === 'cloch').map(x => x.state + ' ' + x.knotW));
await browser.close(); srv.close();
if (process.argv.includes('--shots')) for (const q of ['view=far', 'view=near', 'view=near&state=torn', 'view=near&state=sealed', 'view=far&place=high', 'view=near&place=high']) { const name = 'greatknot-' + q.replace('view=', '').replace(/&(state|place)=/g, '-'); console.log(execFileSync('node', [path.join(here, 'shoot.mjs'), '--page=greatknot.html', '--name=' + name, '--q=' + q]).toString().split('{')[0]); }
console.log(fails ? `${fails} FAILED` : 'all passed'); process.exit(fails ? 1 : 0);
