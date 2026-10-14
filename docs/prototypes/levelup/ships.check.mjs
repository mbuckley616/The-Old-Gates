// node docs/prototypes/levelup/ships.check.mjs [--shots] (Session 858): ships.js's Gatelands sloop in the test Chromium.
// 6 keys, each the same twice and in budget; the game's size (13 by 4.4 m, the deck 1.0 over the sea, DECK_Y); the hull closed below
// the deck (rays from inside her, every way but up, all meet planking or the deck); clinker laps (at the boundary of every two
// strakes, at 9 stations, the upper strake's lower edge stands 1 to 4 cm outside the strake below); a walk down either side of the deck
// from the tiller to the bow with the deck under it, 2 m of headroom under the sail's foot and 0.3 m clear; the rail at 1.0 m or more
// over the deck all along; harp or plain, the same hull. --shots writes ships-quarter, -side, -deck, -lap and -quarter-noharp.
import { chromium } from 'playwright'; import http from 'http'; import fs from 'fs'; import path from 'path'; import { fileURLToPath } from 'url';
import { execFileSync } from 'child_process';
const here = path.dirname(fileURLToPath(import.meta.url));
const types = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json', '.bin': 'application/octet-stream' };
const srv = http.createServer((q, r) => { const f = path.join(here, decodeURIComponent(q.url.split('?')[0])); if (!f.startsWith(here) || !fs.existsSync(f)) { r.writeHead(404); return r.end(); } r.writeHead(200, { 'content-type': types[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(r); }).listen(0);
const port = srv.address().port, launch = { args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] };
if (!fs.existsSync(chromium.executablePath()) && fs.existsSync('/opt/pw-browsers/chromium')) launch.executablePath = '/opt/pw-browsers/chromium';
const browser = await chromium.launch(launch); let fails = 0;
const check = (name, ok, info) => { console.log((ok ? 'PASS ' : 'FAIL ') + name + (info !== undefined ? '  ' + JSON.stringify(info) : '')); if (!ok) fails++; };
for (const v of ['quarter', 'deck']) { const page = await browser.newPage({ viewport: { width: 480, height: 270 } }), errs = []; page.on('pageerror', e => errs.push(String(e)));
  await page.goto(`http://localhost:${port}/ships.html?still&w=480&h=270&view=${v}`);
  await Promise.race([page.waitForFunction(() => window.__done, null, { timeout: 300000 }), new Promise(res => page.on('pageerror', res))]);
  check(`the ${v} view renders with no page errors`, errs.length === 0, errs.slice(0, 2)); await page.close(); }
const page = await browser.newPage({ viewport: { width: 320, height: 180 } }); await page.goto(`http://localhost:${port}/ships.html?still&w=320&h=180`); await page.waitForFunction(() => window.__done, null, { timeout: 300000 });
const r = await page.evaluate(async () => { const THREE = await import('three'), K = await import('./ships.js'), S = await import('./pieces.js'), out = [];
  const hash = (g, skip) => { let h = 0; g.traverse(m => { if (!m.isMesh || m.name === skip) return; const a = m.geometry.attributes.position.array; for (let i = 0; i < a.length; i += 7) h = (h * 31 + Math.round(a[i] * 1e4)) | 0; }); return h; };
  for (let i = 0; i < 6; i++) { const key = 'sloop:' + i, a = K.gatelandsSloop({}, S.stream(key)), b = K.gatelandsSloop({}, S.stream(key)), p = K.gatelandsSloop({ harp: false }, S.stream(key)); a.group.updateMatrixWorld(true);
    const all = []; a.group.traverse(m => { if (m.isMesh) { m.material = m.material.clone(); m.material.side = THREE.DoubleSide; all.push(m); } });
    const hull = all.filter(m => ['tar', 'oak', 'green', 'deck'].includes(m.name));
    const cast = (o, d, list = all) => { const h = new THREE.Raycaster(new THREE.Vector3(...o), new THREE.Vector3(...d).normalize(), 0, 40).intersectObjects(list)[0]; return h ? { d: h.distance, y: h.point.y, m: h.object.name, p: h.point } : null; };
    const box = new THREE.Box3().setFromObject(hull[0].parent ? a.group.getObjectByName('tar') : a.group); let Lh = 0, Wh = 0; { const bb = new THREE.Box3(); for (const m of all.filter(m => ['tar', 'oak', 'green'].includes(m.name))) bb.union(new THREE.Box3().setFromObject(m)); }
    // the hull's size from the moulded lines
    const zs = -a.L / 2, zb = a.L / 2; let beam = 0; for (const s of a.sections) for (const [x] of s.pts) beam = Math.max(beam, x);
    // closed: from points inside her below the deck, 60 rays every way but up; each meets planking (or the deck)
    let leaks = 0, rays = 0; const leakAt = []; for (const z of [-4.5, -2, 0, 2, 4.5]) for (const y of [-.3, .3, .8]) { if (a.sect(z, 0)[1] > y - .1) continue; for (let k = 0; k < 60; k++) { const th = k * 2.39996, ph = -Math.PI / 2 + Math.PI * .5 * ((k % 10) / 10) * 1.1, d = [Math.cos(th) * Math.cos(ph), Math.sin(ph) * (k % 3 ? 1 : .2), Math.sin(th) * Math.cos(ph)];
      rays++; const h = cast([0, y, z], d, hull); if (!h || h.d > 14) { leaks++; if (leakAt.length < 3) leakAt.push([z, y, d.map(v => +v.toFixed(2))]); } } }
    // the laps: at 9 stations, at every strake boundary, rays in along the section's normal just above and just below the lap
    const lands = []; for (const z of [-4, -3, -2, -1, 0, 1, 2, 3, 4]) for (let s = 1; s < a.nstr; s++) { const u = s / a.nstr, p0 = a.sect(z, u - .006), p1 = a.sect(z, u + .006), t = [p1[0] - p0[0], p1[1] - p0[1]], l = Math.hypot(...t), n = [t[1] / l, -t[0] / l];
      const hit = uu => { const q = a.sect(z, uu); const h = cast([q[0] + n[0] * .5, q[1] + n[1] * .5, z], [-n[0], -n[1], 0], hull); return h ? h.d : 9; }; lands.push(+(hit(u - .012) - hit(u + .004)).toFixed(3)); }
    // the walk down either side, from the tiller's end to where the deck narrows
    const bad = [], walk = []; for (const x of [-1, 1]) for (let z = zs + 2.2; z < zb - 2.4; z += .25) { const fl = cast([x, 1.8, z], [0, -1, 0]), up = cast([x, a.deck + .1, z], [0, 1, 0]);
      const side = Math.min(...[1.1, 1.7].flatMap(y => [cast([x, a.deck + y, z], [1, 0, 0]), cast([x, a.deck + y, z], [-1, 0, 0]), cast([x, a.deck + y, z], [0, 0, 1]), cast([x, a.deck + y, z], [0, 0, -1])].map(h => h ? h.d : 9)));
      const w = { x, z: +z.toFixed(2), floor: fl ? +fl.y.toFixed(3) : -9, head: up ? +(up.y - a.deck).toFixed(2) : 99, side: +side.toFixed(2), m: fl && fl.m }; walk.push(w); if (Math.abs(w.floor - a.deck) > .03 || w.head < 2.0 || w.side < .3) bad.push(w); }
    out.push({ same: hash(a.group) === hash(b.group), hullSame: hash(a.group, 'sail') === hash(p.group, 'sail'), tris: a.tris, draws: a.draws, L: a.L, W: +(beam * 2).toFixed(2), deck: a.deck, leaks, rays, leakAt,
      lands: [Math.min(...lands), Math.max(...lands)], walkN: walk.length, bad: bad.slice(0, 4), minHead: Math.min(...walk.map(w => w.head)), minSide: Math.min(...walk.map(w => w.side)), rail: +Math.min(...a.rail.map(([, y]) => y - a.deck)).toFixed(2), railN: a.rail.length }); }
  return out; });
const mm = (xs, f) => [Math.min(...xs.map(f)), Math.max(...xs.map(f))];
check(`the sloop, 6 keys: ${mm(r, x => x.tris).join(' to ')} triangles in ${Math.max(...r.map(x => x.draws))} meshes; each the same twice`, r.every(x => x.same && x.tris < 60000 && x.draws <= 12));
check(`the game's sloop: ${r[0].L} m by ${r[0].W} m moulded, the deck ${r[0].deck} m over the sea`, r.every(x => x.L === 13 && Math.abs(x.W - 4.4) < .05 && x.deck === 1));
check(`closed below the deck: ${Math.max(...r.map(x => x.leaks))} of ${r[0].rays} rays from inside her get out`, r.every(x => x.leaks === 0), r.map(x => x.leakAt).filter(l => l.length).slice(0, 2));
check(`clinker: at every strake's lower edge, at 9 stations, it stands ${mm(r, x => x.lands[0])[0]} to ${mm(r, x => x.lands[1])[1]} m outside the strake below`, r.every(x => x.lands[0] >= .01 && x.lands[1] <= .04));
check(`the walk down either side of the deck, ${r[0].walkN} points: the deck under every one, ${Math.min(...r.map(x => x.minHead))} m of headroom, ${Math.min(...r.map(x => x.minSide))} m clear`, r.every(x => !x.bad.length), r.map(x => x.bad).filter(b => b.length).slice(0, 2));
check(`the rail at ${Math.min(...r.map(x => x.rail))} m or more over the deck at all ${r[0].railN} stanchions`, r.every(x => x.rail >= 1.0));
check('the harp or the plain sail: the same hull', r.every(x => x.hullSame));
await page.close();
if (process.argv.includes('--shots')) for (const q of ['view=quarter', 'view=side', 'view=deck', 'view=lap', 'view=quarter&noharp']) { const name = 'ships-' + q.replace('view=', '').replace('&', '-'); console.log(execFileSync('node', [path.join(here, 'shoot.mjs'), '--page=ships.html', '--name=' + name, '--q=' + q]).toString().split('{')[0]); }
await browser.close(); srv.close(); console.log(fails ? `${fails} FAILED` : 'all passed'); process.exit(fails ? 1 : 0);
