// node docs/prototypes/levelup/trials.check.mjs [--shots] (Session 837): the Makers' trials' props (props.js) in the test Chromium.
// The Gate-Blade's stone: 20 stones from 20 keys, each the same twice, in budget, 2.6 to 3.2 m; the grip within a standing
// person's reach (1.2 to 1.6 m), the pommel clear of the stone's face and the point inside it. The Noon Ring's cairn: in budget,
// the same twice, the capstone within reach (at most 1.8 m), and the noon sun through the slab's hole: the line from the hollow
// to the sun is clear, its spot lands on the hollow, and an hour either side (15° round) it lands off it.
// Session 838, the Waylamp: lit and put out, in budget, the same twice, a hand lantern's size (0.3 to 0.45 m), its carrying
// ring at the top; lit it has a flame and glowing horn, put out neither.
// --shots writes trials-blade, -blade-close, -cairn, -cairn-close, -cairn-close-morning, -lamp and -lamp-unlit.
import { chromium } from 'playwright'; import http from 'http'; import fs from 'fs'; import path from 'path'; import { fileURLToPath } from 'url';
import { execFileSync } from 'child_process';
const here = path.dirname(fileURLToPath(import.meta.url));
const types = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json', '.bin': 'application/octet-stream' };
const srv = http.createServer((q, r) => { const f = path.join(here, decodeURIComponent(q.url.split('?')[0])); if (!f.startsWith(here) || !fs.existsSync(f)) { r.writeHead(404); return r.end(); } r.writeHead(200, { 'content-type': types[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(r); }).listen(0);
const port = srv.address().port, launch = { args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] };
if (!fs.existsSync(chromium.executablePath()) && fs.existsSync('/opt/pw-browsers/chromium')) launch.executablePath = '/opt/pw-browsers/chromium';
const browser = await chromium.launch(launch); let fails = 0;
const check = (name, ok, info) => { console.log((ok ? 'PASS ' : 'FAIL ') + name + (info !== undefined ? '  ' + JSON.stringify(info) : '')); if (!ok) fails++; };
for (const v of ['blade', 'cairn', 'lamp']) { const page = await browser.newPage({ viewport: { width: 480, height: 270 } }), errs = []; page.on('pageerror', e => errs.push(String(e)));
  await page.goto(`http://localhost:${port}/trials.html?still&w=480&h=270&view=${v}`);
  await Promise.race([page.waitForFunction(() => window.__done, null, { timeout: 300000 }), new Promise(res => page.on('pageerror', res))]);
  check(`the ${v} page renders with no page errors`, errs.length === 0, errs.slice(0, 2)); await page.close(); }
const page = await browser.newPage({ viewport: { width: 320, height: 180 } }); await page.goto(`http://localhost:${port}/trials.html?still&w=320&h=180`); await page.waitForFunction(() => window.__done, null, { timeout: 300000 });
const r = await page.evaluate(async () => { const THREE = await import('three'), K = await import('./props.js'), S = await import('./pieces.js'), out = { blades: [], cairns: [] };
  const hash = g => { let h = 0; g.traverse(m => { if (!m.isMesh) return; const a = m.geometry.attributes.position.array; for (let i = 0; i < a.length; i += 7) h = (h * 31 + Math.round(a[i] * 1e4)) | 0; }); return h; };
  for (let i = 0; i < 20; i++) { const a = K.bladeStone({}, S.stream('blade:' + i)), b = K.bladeStone({}, S.stream('blade:' + i)), stone = a.group.children.find(m => m.name === 'rock');
    a.group.updateMatrixWorld(true); const box = new THREE.Box3().setFromObject(stone), tipIn = new THREE.Raycaster(new THREE.Vector3(...a.pommel), new THREE.Vector3(...a.grip).sub(new THREE.Vector3(...a.pommel)).normalize()).intersectObject(stone)[0];
    out.blades.push({ same: hash(a.group) === hash(b.group), tris: a.tris, draws: a.draws, h: a.height, grip: a.grip[1], pommelOut: +(a.pommel[2] - box.max.z * .5).toFixed(2), clear: !!(tipIn === undefined), toFace: tipIn ? +tipIn.distance.toFixed(2) : -1 }); }
  const alt = 40 * Math.PI / 180;
  for (let i = 0; i < 8; i++) { const a = K.ringCairn({ sunAlt: alt }, S.stream('cairn:' + i)), b = K.ringCairn({ sunAlt: alt }, S.stream('cairn:' + i)); a.group.updateMatrixWorld(true);
    const land = az => { const d = new THREE.Vector3(Math.sin(az) * Math.cos(alt), Math.sin(alt), Math.cos(az) * Math.cos(alt)), h = new THREE.Vector3(...a.hole), t = (h.y - (a.ring[1] - .01)) / d.y; return h.addScaledVector(d, -t); };
    const noon = land(0), off = [land(15 * Math.PI / 180), land(-15 * Math.PI / 180)], dir = new THREE.Vector3(0, Math.sin(alt), Math.cos(alt));
    const blocked = new THREE.Raycaster(new THREE.Vector3(a.ring[0], a.ring[1] + .015, a.ring[2]), dir).intersectObject(a.group, true).filter(x => x.object.name !== 'gold')[0];
    out.cairns.push({ same: hash(a.group) === hash(b.group), tris: a.tris, draws: a.draws, cap: +(a.ring[1]).toFixed(2), noon: +Math.hypot(noon.x, noon.z).toFixed(3), off: off.map(p => +Math.hypot(p.x, p.z).toFixed(2)), clear: !blocked, stones: a.stones }); }
  out.lamps = []; for (const lit of [true, false]) for (const hook of [false, true]) { const a = K.waylamp({ lit, hook }, S.stream('lamp')), b = K.waylamp({ lit, hook }, S.stream('lamp')), names = a.group.children.map(m => m.name);
    const box = new THREE.Box3().setFromObject(a.group.children.find(m => m.name === 'iron')); out.lamps.push({ lit, hook, same: hash(a.group) === hash(b.group), tris: a.tris, draws: a.draws, h: a.height, handle: a.handle[1], flame: names.includes('flame'), glow: names.includes('hornLit'), ironTop: +box.max.y.toFixed(3) }); }
  return out; });
const B = r.blades, C = r.cairns, mm = (xs, f) => [Math.min(...xs.map(f)), Math.max(...xs.map(f))];
check(`the Gate-Blade's stone, 20 keys: ${mm(B, b => b.tris).join(' to ')} triangles, at most ${Math.max(...B.map(b => b.draws))} meshes, ${mm(B, b => b.h).join(' to ')} m tall; each the same twice`, B.every(b => b.same && b.tris < 8000 && b.draws <= 9 && b.h >= 2.6 && b.h <= 3.2));
check(`the grip is within a standing person's reach: ${mm(B, b => b.grip).join(' to ')} m up`, B.every(b => b.grip >= 1.2 && b.grip <= 1.6));
check(`the blade goes into the stone: from the pommel down the blade, the stone's face is ${mm(B, b => b.toFace).join(' to ')} m on (the hilt and 0.68 m of blade out)`, B.every(b => b.toFace > .7 && b.toFace < 1.2), B.map(b => b.toFace));
check(`the Noon Ring's cairn, 8 keys: ${mm(C, c => c.tris).join(' to ')} triangles in at most ${Math.max(...C.map(c => c.draws))} meshes, ${mm(C, c => c.stones).join(' to ')} stones; each the same twice; the ring at ${mm(C, c => c.cap).join(' to ')} m, within reach`, C.every(c => c.same && c.tris < 12000 && c.draws <= 9 && c.cap <= 1.8));
check(`at noon the sun comes through the slab's hole onto the hollow: the line from the ring to the sun is clear in ${C.filter(c => c.clear).length} of 8, the spot lands ${mm(C, c => c.noon).join(' to ')} m from the ring (the hollow is 0.13 m)`, C.every(c => c.clear && c.noon < .1));
check(`an hour either side it lands off the hollow: ${mm(C, c => Math.min(...c.off)).join(' to ')} m away`, C.every(c => Math.min(...c.off) > .25));
{ const L = r.lamps; check(`the Waylamp: ${L.map(l => l.tris).join(', ')} triangles (lit, lit on its bracket, out, out on its bracket) in at most ${Math.max(...L.map(l => l.draws))} meshes, each the same twice; ${L[0].h} m to its ring, the ring its top`, L.every(l => l.same && l.tris < 3000 && l.draws <= 8 && l.h >= .3 && l.h <= .45) && L.filter(l => !l.hook).every(l => Math.abs(l.ironTop - l.h - .006) < .01));
  check('lit, the horn glows and a flame burns; put out, neither', L.every(l => l.flame === l.lit && l.glow === l.lit)); }
await page.close();
if (process.argv.includes('--shots')) for (const q of ['view=blade', 'view=blade&close', 'view=cairn', 'view=cairn&close', 'view=cairn&close&sun=morning', 'view=lamp', 'view=lamp&unlit']) { const name = 'trials-' + q.replace('view=', '').replace(/&sun=/, '-').replace(/&/g, '-'); console.log(execFileSync('node', [path.join(here, 'shoot.mjs'), '--page=trials.html', '--name=' + name, '--q=' + q]).toString().split('{')[0]); }
await browser.close(); srv.close(); console.log(fails ? `${fails} FAILED` : 'all passed'); process.exit(fails ? 1 : 0);
