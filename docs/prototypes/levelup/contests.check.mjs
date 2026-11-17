// node docs/prototypes/levelup/contests.check.mjs [--shots] (the look builder, Session 2317): contests.js's props in the test Chromium.
// The numbers against the game's own (js/87-world-quests.js: BUTT_ENDS, BUTT_RINGS, BUTT_R, BUTT_Y, BUTT_MARK_R, FAIR_R); the butt's face
// middle where the game reads an arrow's crossing, at every range in the view; nothing in the way of an arrow from the mark to any point
// of the face (24 rays to the rings' edges, each must first meet the face); the face's painted rings where the game scores them; the ring's
// stakes on FAIR_R and its ropes closed; each prop the same twice and in budget; every view renders with no page errors.
// --shots writes contests-lane, -butt, -scale, -mark, -ring and -high (1920x1080) beside this file.
import { chromium } from 'playwright'; import http from 'http'; import fs from 'fs'; import path from 'path'; import { fileURLToPath } from 'url';
import { execFileSync } from 'child_process';
const here = path.dirname(fileURLToPath(import.meta.url)), root = path.resolve(here, '../../..');
const types = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json', '.bin': 'application/octet-stream' };
const srv = http.createServer((q, r) => { const f = path.join(here, decodeURIComponent(q.url.split('?')[0])); if (!f.startsWith(here) || !fs.existsSync(f)) { r.writeHead(404); return r.end(); } r.writeHead(200, { 'content-type': types[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(r); }).listen(0);
const port = srv.address().port, launch = { args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] };
if (!fs.existsSync(chromium.executablePath()) && fs.existsSync('/opt/pw-browsers/chromium')) launch.executablePath = '/opt/pw-browsers/chromium';
const browser = await chromium.launch(launch); let fails = 0;
const check = (name, ok, info) => { console.log((ok ? 'PASS ' : 'FAIL ') + name + (info !== undefined ? '  ' + JSON.stringify(info) : '')); if (!ok) fails++; };

// the game's numbers, read from its source
const src = fs.readFileSync(path.join(root, 'js/87-world-quests.js'), 'utf8');
const num = re => { const m = src.match(re); return m ? JSON.parse(m[1]) : null; };
const GAME = { ends: num(/BUTT_ENDS=(\[[^\]]*\])/), rings: JSON.parse((src.match(/BUTT_RINGS=(\[\[.*?\]\])/) || [, 'null'])[1].replace(/(^|[,\[])\./g, '$10.')),
  r: +(src.match(/BUTT_R=([\d.]+)/) || [])[1], y: +(src.match(/BUTT_Y=([\d.]+)/) || [])[1], markR: +(src.match(/BUTT_MARK_R=([\d.]+)/) || [])[1], fairR: +(src.match(/FAIR_R=([\d.]+)/) || [])[1] };

const page = await browser.newPage({ viewport: { width: 320, height: 180 } }); const perr = []; page.on('pageerror', e => perr.push(String(e).slice(0, 300)));
await page.goto(`http://localhost:${port}/contests.html?still&w=320&h=180&all`); await page.waitForFunction(() => window.__done, null, { timeout: 300000 });
const r = await page.evaluate(async () => { const THREE = await import('three'), K = await import('./contests.js');
  const hash = g => { let h = 0; g.traverse(m => { if (!m.isMesh) return; const a = m.geometry.attributes.position.array; for (let i = 0; i < a.length; i += 5) h = (h * 31 + Math.round(a[i] * 1e4)) | 0; }); return h; };
  const same = {}, tris = {}; for (const k of ['butt', 'bales', 'mark', 'peg', 'ring']) { const a = K.build(k), b = K.build(k); same[k] = hash(a.g) === hash(b.g); tris[k] = a.tris; }
  // the butt at 30 m down -z from the mark, as the view lays it; rays from the mark at an archer's eye (1.5 m) to the rings' edges
  const scene = new THREE.Scene(), B = K.build('butt'); B.g.position.set(0, 0, -30); scene.add(B.g); const bal = K.build('bales'); bal.g.position.set(0, 0, -31.6); scene.add(bal.g); scene.updateMatrixWorld(true);
  let face = null; B.g.traverse(m => { if (m.isMesh && m.geometry.type === 'CircleGeometry' && m.material.map && m.material.map.image.width === 512) face = m; });
  const n = new THREE.Vector3(...B.face.n), c = new THREE.Vector3(...B.face.c).add(B.g.position), up = new THREE.Vector3(0, 1, 0).applyAxisAngle(new THREE.Vector3(1, 0, 0), -K.BUTT.lean), side = new THREE.Vector3(1, 0, 0);
  const ray = new THREE.Raycaster(), eye = new THREE.Vector3(0, 1.5, 0), blocked = []; let rays = 0;
  for (const [rr] of K.BUTT.rings) for (let i = 0; i < 8; i++) { const a = i / 8 * 6.2832, t = c.clone().addScaledVector(side, Math.cos(a) * (rr - .01)).addScaledVector(up, Math.sin(a) * (rr - .01));
    ray.set(eye, t.clone().sub(eye).normalize()); const hit = ray.intersectObjects(scene.children, true)[0]; rays++; if (!hit || hit.object !== face) blocked.push([rr, i, hit && hit.object.geometry.type]); }
  // the face's paint where the game scores: sample the canvas at each ring's middle radius and just outside the face's dye
  const img = face.material.map.image, cx = img.getContext('2d'), px = (rr, a) => { const k = img.width / 2 / K.BUTT.r; return Array.from(cx.getImageData(Math.round(img.width / 2 + Math.cos(a) * rr * k), Math.round(img.width / 2 + Math.sin(a) * rr * k), 1, 1).data.slice(0, 3)); };
  const paint = K.BUTT.rings.map(([rr], i) => { const r0 = i ? K.BUTT.rings[i - 1][0] : 0; return px((r0 + rr) / 2, .7); });
  // the ring
  const RG = K.build('ring'), radii = RG.stakes.map(s => Math.hypot(s[0], s[2])); let ropes = 0, ropeLow = 9; RG.g.traverse(m => { if (m.isMesh && m.geometry.type === 'TubeGeometry' && m.geometry.parameters.radius > .01) { ropes++; m.geometry.computeBoundingBox(); ropeLow = Math.min(ropeLow, m.geometry.boundingBox.min.y); } });
  // the mark: the archer stands on the line's middle; the stake stands clear of a body there (0.3 m) and inside BUTT_MARK_R
  const M = K.build('mark'); let stake = null; M.g.traverse(m => { if (m.isMesh && m.geometry.type === 'CylinderGeometry') stake = Math.hypot(m.position.x, m.position.z); });
  const lean = Math.acos(n.dot(new THREE.Vector3(0, 0, 1))) * 180 / Math.PI;
  return { same, tris, faceC: c.toArray(), faceR: B.face.r, lean, rays, blocked, paint, radii, ropes, ropeLow, stakes: RG.stakes.length, ringR: K.RING.r, BUTT: K.BUTT, faces: window.__stats.faces, stake };
});
check('the game\'s numbers were read from js/87-world-quests.js', GAME.ends && GAME.rings && GAME.r && GAME.y && GAME.markR && GAME.fairR, GAME);
check('the kit\'s ranges, rings, face and centre height are the game\'s', JSON.stringify(r.BUTT.ends) === JSON.stringify(GAME.ends) && JSON.stringify(r.BUTT.rings) === JSON.stringify(GAME.rings) && r.BUTT.r === GAME.r && r.BUTT.y === GAME.y && r.BUTT.markR === GAME.markR, { kit: r.BUTT, game: GAME });
check('every butt in the view has its face\'s middle at the game\'s point (0, BUTT_Y, -D)', r.faces.length === 3 && r.faces.every((f, i) => f.D === GAME.ends[i] && Math.abs(f.c[0]) < .001 && Math.abs(f.c[1] - GAME.y) < .001 && Math.abs(f.c[2] + f.D) < .001), r.faces);
check('the face leans back 5 to 12 degrees', r.lean >= 5 && r.lean <= 12, +r.lean.toFixed(2));
check('from the mark, an arrow to any point of every ring meets the face first (nothing of the stand or the bales in front)', r.blocked.length === 0 && r.rays === 24, { rays: r.rays, blocked: r.blocked });
const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
check('the face is painted in three rings, each its own colour where the game scores it', r.paint.length === 3 && dist(r.paint[0], r.paint[1]) > 60 && dist(r.paint[1], r.paint[2]) > 60 && dist(r.paint[0], r.paint[2]) > 60, r.paint);
check('the ring\'s stakes stand on the game\'s FAIR_R, ten of them', r.ringR === GAME.fairR && r.stakes === 10 && r.radii.every(x => Math.abs(x - GAME.fairR) < .01), r.radii.map(x => +x.toFixed(3)));
check('the ring\'s two ropes are closed (a rope between every pair of stakes) and never sag to the grass', r.ropes === 2 * r.stakes && r.ropeLow > .3, { ropes: r.ropes, low: +r.ropeLow.toFixed(3) });
check('each prop is the same twice', Object.values(r.same).every(Boolean), r.same);
check('the mark\'s stake stands clear of the archer on the mark and at its edge (0.5 m to BUTT_MARK_R + 0.1)', r.stake >= .5 && r.stake <= GAME.markR + .1, r.stake);
const BUD = { butt: 800, bales: 300, mark: 200, peg: 100, ring: 3200 };
check('each prop is in budget (butt 800, bales 300, mark 200, peg 100, ring 3,200 triangles)', Object.entries(BUD).every(([k, v]) => r.tris[k] <= v), r.tris);
check('the meadow page has no page errors', perr.length === 0, perr.slice(0, 2)); await page.close();

const SHOTS = { lane: 'cam=lane&end=2', butt: 'cam=butt', scale: 'cam=scale', mark: 'cam=mark', ring: 'cam=ring', high: 'cam=high&all' };
const shots = process.argv.includes('--shots');
for (const [k, q] of Object.entries(SHOTS)) { const p = await browser.newPage({ viewport: shots ? { width: 1920, height: 1080 } : { width: 480, height: 270 } }); const errs = []; p.on('pageerror', e => errs.push(String(e).slice(0, 300)));
  await p.goto(`http://localhost:${port}/contests.html?still&w=${shots ? 1920 : 480}&h=${shots ? 1080 : 270}&${q}`); await p.waitForFunction(() => window.__done, null, { timeout: 300000 });
  const st = await p.evaluate(() => window.__stats);
  if (shots) { await p.evaluate(() => document.getElementById('note').style.display = 'none'); const url = await p.evaluate(() => document.querySelector('canvas').toDataURL('image/jpeg', .88)); fs.writeFileSync(path.join(here, 'contests-' + k + '.jpg'), Buffer.from(url.split(',')[1], 'base64')); }
  check(`the ${k} view renders with no page errors`, errs.length === 0, { errs: errs.slice(0, 2), tris: st.tris, calls: st.calls }); await p.close(); }
await browser.close(); srv.close();
console.log(fails ? `${fails} FAILED` : 'all passed'); process.exit(fails ? 1 : 0);
