// node docs/prototypes/levelup/ships-fx.check.mjs (Session 2244): ships-fx.js in the test Chromium. The broadside's smoke: the same
// moment twice is the same cloud; at 2 s six guns' 240 puffs in one draw and no flash; at 0.05 s the first gun's flash alone; at 1 s the
// cloud stands 4 m or more out from her side; at 40 s it is gone. Her rig alight: flames at 4 s, the char growing from 0 at the catch
// through 2, 4, 6 and 8 s; doused at 6 s, no flames after and the char held. The founder: nothing at 0, at 1 the game's 3 m and 0.35 rad
// (SHIP_FOUNDER_S's) and 0.12 rad by the head. The shot at true size: the round ball 9 cm across, the chain 0.5 m end to end, nine grape. A
// splash only from 0 to 1.6 s, no higher than 4.5 m. No point of any cloud is NaN.
import { chromium } from 'playwright'; import http from 'http'; import fs from 'fs'; import path from 'path'; import { fileURLToPath } from 'url';
const here = path.dirname(fileURLToPath(import.meta.url));
const types = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json', '.bin': 'application/octet-stream' };
const srv = http.createServer((q, r) => { const f = path.join(here, decodeURIComponent(q.url.split('?')[0])); if (!f.startsWith(here) || !fs.existsSync(f)) { r.writeHead(404); return r.end(); } r.writeHead(200, { 'content-type': types[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(r); }).listen(0);
const launch = { args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] }; if (!fs.existsSync(chromium.executablePath()) && fs.existsSync('/opt/pw-browsers/chromium')) launch.executablePath = '/opt/pw-browsers/chromium';
const browser = await chromium.launch(launch); let fails = 0;
const check = (name, ok, info) => { console.log((ok ? 'PASS ' : 'FAIL ') + name + (info !== undefined ? '  ' + JSON.stringify(info) : '')); if (!ok) fails++; };
const page = await browser.newPage({ viewport: { width: 320, height: 180 } }); const errs = []; page.on('pageerror', e => errs.push(String(e)));
await page.goto(`http://localhost:${port()}/ships.html?still&w=320&h=180`); await page.waitForFunction(() => window.__done, null, { timeout: 300000 });
function port() { return srv.address().port; }
const R = await page.evaluate(async () => { const THREE = await import('three'), K = await import('./ships.js'), F = await import('./ships-fx.js'), P = await import('./pieces.js'), out = {};
  const pts = G => { const a = []; G.traverse(o => { if (o.isPoints) a.push(o); }); return a; };
  const arr = G => pts(G).flatMap(p => Array.from(p.geometry.attributes.position.array));
  const nan = G => arr(G).some(v => !Number.isFinite(v));
  const gal = () => K.gatelandsGalleon({ guns: true }, P.stream('galleon:fx'));
  { const S = gal(), a = F.smoke(S, -1, 2), b = F.smoke(gal(), -1, 2), f0 = F.smoke(gal(), -1, .05), late = F.smoke(gal(), -1, 40), one = F.smoke(gal(), -1, 1);
    const xs = []; const P1 = pts(one).find(p => !p.material.blending || p.material.blending === THREE.NormalBlending).geometry.attributes.position; for (let i = 0; i < P1.count; i++) xs.push(P1.getX(i));
    const half = S.W / 2; out.smoke = { same: JSON.stringify(arr(a)) === JSON.stringify(arr(b)), at2: a.userData, draws2: pts(a).length, at05: f0.userData, at40: late.userData, meanOut: +(-xs.reduce((s, v) => s + v, 0) / xs.length - half).toFixed(2), nan: nan(a) || nan(f0) }; }
  { const char = t => { const S = gal(); const G = F.rigFire(S, t); return G.userData; }; const d = F.rigFire(gal(), 9, { out: 6 }).userData, d6 = F.rigFire(gal(), 6).userData;
    out.fire = { t: [0, 2, 4, 6, 8].map(t => char(t)), doused: d, at6: d6 }; }
  { const S = K.gatelandsSloop({}, P.stream('sloop:fx')); const a = F.founder(S, 0), b = F.founder(K.gatelandsSloop({}, P.stream('sloop:fx')), 1); out.founder = { a: { sink: a.sink, list: a.list, head: a.head, foam: a.cloud.userData.n }, b: { sink: b.sink, list: b.list, head: b.head }, game: F.FOUNDER }; }
  { const size = k => { const g = F.shot(k); const bb = new THREE.Box3().setFromObject(g.children[0]); const s = bb.getSize(new THREE.Vector3()); return [s.x, s.y, s.z].map(v => +v.toFixed(3)); };
    const grape = F.shot('grape'); let n = 0; out.shot = { round: size('round'), chain: size('chain'), grapeTris: grape.children[0].geometry.attributes.position.count / 3, shellFuse: pts(F.shot('shell')).length }; }
  { const h = t => { const c = F.splash(0, 0, t); const a = c.geometry.attributes.position; let y = 0; for (let i = 0; i < a.count; i++) y = Math.max(y, a.getY(i)); return [c.userData.n, +y.toFixed(2)]; };
    out.splash = { before: h(-.1), peak: [.2, .4, .6, .8, 1.0].map(h), after: h(1.7) }; }
  { const c = F.splinters([0, 1, 0], 30, .3, [-1, 0, 0]); out.splinters = { n: c.userData.n, nan: !Number.isFinite(c.geometry.attributes.position.array[0]) }; }
  return out; });
const s = R.smoke; check('the smoke: the same moment twice is the same cloud', s.same);
check('at 2 s, six guns\' 240 puffs in one draw, and no flash', s.at2.puffs === 240 && s.at2.flash === 0 && s.draws2 === 1, s.at2);
check('at 0.05 s, the first gun\'s flash and only its puffs', s.at05.flash === 6 && s.at05.puffs <= 40, s.at05);
check('at 1 s the cloud stands 3 m or more out from her side, against a 1.5 m/s wind blowing it back', s.meanOut >= 3, s.meanOut);
check('at 40 s it is gone', s.at40.puffs === 0 && s.at40.flash === 0, s.at40);
check('no point of the smoke is NaN', !s.nan);
const c = R.fire.t.map(u => u.charred); check('her rig: flames at 4 s', R.fire.t[2].flames > 0, R.fire.t[2]);
check('the char grows from nothing at the catch through 2, 4, 6 and 8 s', c[0] === 0 && c.every((v, i) => !i || v > c[i - 1]), c);
check('doused at 6 s: no flames at 9 s and the char held at 6 s\'s', R.fire.doused.flames === 0 && R.fire.doused.smoke === 0 && R.fire.doused.charred === R.fire.at6.charred, [R.fire.doused, R.fire.at6.charred]);
const f = R.founder; check('the founder: nothing at 0', f.a.sink === 0 && f.a.list === 0 && f.a.head === 0 && f.a.foam === 0, f.a);
check('at 1, the game\'s 3 m and 0.35 rad, and 0.12 rad by the head', f.b.sink === -3 && f.b.list === .35 && f.b.head === .12, f.b);
check('the round ball 9 cm across', R.shot.round.every(v => Math.abs(v - .09) < .003), R.shot.round);
check('the chain 0.5 to 0.6 m end to end', R.shot.chain[0] >= .5 && R.shot.chain[0] <= .6, R.shot.chain);
check('nine grape, and the shell\'s fuse alight', R.shot.grapeTris > 0 && R.shot.shellFuse === 1, R.shot);
check('a splash only from 0 to 1.6 s, no higher than 4.5 m', R.splash.before[0] === 0 && R.splash.after[0] === 0 && R.splash.peak.every(([n, y]) => n > 0 && y <= 4.5), R.splash);
check('splinters thrown, none NaN', R.splinters.n === 38 && !R.splinters.nan, R.splinters);
check('no page errors', !errs.length, errs.slice(0, 3));
await browser.close(); srv.close(); console.log(fails ? `${fails} FAILED` : 'all passed'); process.exit(fails ? 1 : 0);
