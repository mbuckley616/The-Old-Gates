// node docs/prototypes/levelup/rare.check.mjs [--shots] (Session 2500): rare materials B's props (props.js) in the test Chromium.
// The crater: 12 keys, the same twice, in budget (8,000 triangles, 6 draws); 6 m across its rim (5.6 to 6.8 along and across), 0.6 to
// 1 m deep, the rim 0.25 to 0.45 m up; with all three lobes the lump stands proud of the bowl's floor and inside the rim, and with
// fewer it has as many; at night the glint is lit and by day it is not. The pine: 12 keys, the same twice, in budget (12,000, 4 draws: one tree on each of 17 peaks, so the budget is a lone tree's),
// 8 to 10 m, leaning lee and never windward; most of its needle pads on the lee side; felled, no pads and a stump of 0.6 m. The script
// stone: each of the six schools, the same twice, in budget (4,000, 7 draws), the game's slab (0.7 by 1.15 by 0.2), standing clear of
// the wall it leans to, its script lit in two panels split by the crack; cut, no script and a socket.
// --shots writes rare-crater, -crater-close, -crater-night, -crater-left1, -pine, -pine-far, -pine-felled, -stone, -stone-tine,
// -stone-uisce and -stone-cut.
import { chromium } from 'playwright'; import http from 'http'; import fs from 'fs'; import path from 'path'; import { fileURLToPath } from 'url';
import { execFileSync } from 'child_process';
const here = path.dirname(fileURLToPath(import.meta.url));
const types = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json', '.bin': 'application/octet-stream' };
const srv = http.createServer((q, r) => { const f = path.join(here, decodeURIComponent(q.url.split('?')[0])); if (!f.startsWith(here) || !fs.existsSync(f)) { r.writeHead(404); return r.end(); } r.writeHead(200, { 'content-type': types[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(r); }).listen(0);
const port = srv.address().port, launch = { args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] };
if (!fs.existsSync(chromium.executablePath()) && fs.existsSync('/opt/pw-browsers/chromium')) launch.executablePath = '/opt/pw-browsers/chromium';
const browser = await chromium.launch(launch); let fails = 0;
const check = (name, ok, info) => { console.log((ok ? 'PASS ' : 'FAIL ') + name + (info !== undefined ? '  ' + JSON.stringify(info) : '')); if (!ok) fails++; };
for (const v of ['crater', 'pine', 'stone']) { const page = await browser.newPage({ viewport: { width: 320, height: 180 } }), errs = []; page.on('pageerror', e => errs.push(String(e)));
  await page.goto(`http://localhost:${port}/rare.html?still&w=320&h=180&view=${v}`);
  await Promise.race([page.waitForFunction(() => window.__done, null, { timeout: 300000 }), new Promise(res => page.on('pageerror', res))]);
  check(`the ${v} page renders with no page errors`, errs.length === 0, errs.slice(0, 2)); await page.close(); }
const page = await browser.newPage({ viewport: { width: 320, height: 180 } }); await page.goto(`http://localhost:${port}/rare.html?still&w=320&h=180&view=stone`); await page.waitForFunction(() => window.__done, null, { timeout: 300000 });
const r = await page.evaluate(async () => { const THREE = await import('three'), K = await import('./props.js'), S = await import('./pieces.js'), out = { craters: [], pines: [], stones: [] };
  const hash = g => { let h = 0; g.traverse(m => { if (!m.isMesh) return; const a = m.geometry.attributes.position.array; for (let i = 0; i < a.length; i += 7) h = (h * 31 + Math.round(a[i] * 1e4)) | 0; }); return h; };
  for (let i = 0; i < 12; i++) { const a = K.starCrater({}, S.stream('star:' + i)), b = K.starCrater({}, S.stream('star:' + i)), fx = Math.sin(a.from), fz = Math.cos(a.from);
    let along = 0, across = 0; for (let d = 2; d < 5; d += .02) { if (a.hAt(-fx * d, -fz * d) > a.hAt(-fx * (d - .02), -fz * (d - .02))) along = d; } let al2 = 0; for (let d = 2; d < 5; d += .02) { if (a.hAt(fx * d, fz * d) > a.hAt(fx * (d - .02), fz * (d - .02))) al2 = d; }
    for (let d = 2; d < 5; d += .02) { if (a.hAt(fz * d, -fx * d) > a.hAt(fz * (d - .02), -fx * (d - .02))) across = d; }
    const crust = a.group.children.find(m => m.name === 'crust'), cb = new THREE.Box3().setFromObject(crust), floor = a.hAt(a.lump[0], a.lump[2]);
    const lefts = [0, 1, 2].map(n => K.starCrater({ left: n }, S.stream('star:' + i)).lobes.length), nt = K.starCrater({ night: true }, S.stream('star:' + i)), gl = m => m.group.children.find(x => x.name === 'glint');
    out.craters.push({ same: hash(a.group) === hash(b.group), tris: a.tris, draws: a.draws, rimAlong: +(along + al2).toFixed(2), rimAcross: +(2 * across).toFixed(2), depth: a.depth, rim: a.rim, proud: +(cb.max.y - floor).toFixed(2), inRim: Math.hypot(a.lump[0], a.lump[2]) + .6 < a.R * .92, lobes: a.lobes.length, lefts,
      glintDay: gl(a).material.emissiveIntensity, glintNight: gl(nt).material.emissiveIntensity, none: !K.starCrater({ left: 0 }, S.stream('star:' + i)).group.children.some(m => m.name === 'glint') }); }
  for (let i = 0; i < 12; i++) { const a = K.skywoodPine({}, S.stream('sky:' + i)), b = K.skywoodPine({}, S.stream('sky:' + i)), f = K.skywoodPine({ felled: true }, S.stream('sky:' + i)), wx = Math.sin(a.wind), wz = Math.cos(a.wind);
    const nd = a.group.children.find(m => m.name === 'skyNeedle'), P = nd.geometry.attributes.position; let lee = 0, n = 0; for (let k = 0; k < P.count; k += 3) { n++; if (P.getX(k) * wx + P.getZ(k) * wz > 0) lee++; }
    const bark = a.group.children.find(m => m.name === 'skyBark'), bb = new THREE.Box3().setFromObject(bark); let tip = null; { const Q = bark.geometry.attributes.position; for (let k = 0; k < Q.count; k++) if (!tip || Q.getY(k) > tip[1]) tip = [Q.getX(k), Q.getY(k), Q.getZ(k)]; }
    out.pines.push({ same: hash(a.group) === hash(b.group), tris: a.tris, draws: a.draws, H: a.H, top: +bb.max.y.toFixed(2), leanLee: +(tip[0] * wx + tip[2] * wz).toFixed(2), leeShare: +(lee / n).toFixed(2), pads: a.pads,
      felledPads: f.group.children.some(m => m.name === 'skyNeedle'), cut: f.cut, felledTop: +new THREE.Box3().setFromObject(f.group.children.find(m => m.name === 'skyBark')).max.y.toFixed(2), ftris: f.tris }); }
  for (const s of ['tine', 'uisce', 'cloch', 'scath', 'solas', 'gaoth']) { const a = K.scriptStone({ school: s }, S.stream('st:' + s)), b = K.scriptStone({ school: s }, S.stream('st:' + s)), c = K.scriptStone({ school: s, cut: true }, S.stream('st:' + s));
    a.group.updateMatrixWorld(true); const stone = a.group.children.find(m => m.name === 'sigilRock'); let back = 9; { const Q = stone.geometry.attributes.position; for (let k = 0; k < Q.count; k++) if (Q.getX(k) > -.36 && Q.getX(k) < .36 && Q.getY(k) > .02 && Q.getY(k) < 1.2 && Q.getZ(k) > 0.01) back = Math.min(back, Q.getZ(k)); }
    const sc = a.group.children.find(m => m.name.startsWith('sscript:'));
    out.stones.push({ school: s, same: hash(a.group) === hash(b.group), tris: a.tris, draws: a.draws, size: a.size, back: +back.toFixed(3), lit: a.lit, glow: sc ? sc.material.color.getHexString() : null, cutLit: c.lit, cutScript: c.group.children.some(m => m.name.startsWith('sscript:')), socket: c.group.children.some(m => m.name === 'dark') && c.tris > 0 }); }
  return out; });
for (const c of r.craters) { check('the crater is the same twice from one key', c.same); check('the crater is in budget (8,000 triangles, 6 draws)', c.tris <= 8000 && c.draws <= 6, [c.tris, c.draws]);
  check('the crater is 6 m across its rim, along and across (5.6 to 6.8)', c.rimAlong >= 5.6 && c.rimAlong <= 6.8 && c.rimAcross >= 5.6 && c.rimAcross <= 6.8, [c.rimAlong, c.rimAcross]);
  check('the bowl is 0.6 to 1 m deep and its rim 0.25 to 0.45 m up', c.depth >= .6 && c.depth <= 1 && c.rim >= .25 && c.rim <= .45, [c.depth, c.rim]);
  check('the lump stands proud of the bowl floor (0.3 to 0.9 m) inside the rim', c.proud >= .3 && c.proud <= .9 && c.inRim, [c.proud, c.inRim]);
  check('a crater with N lobes left has N, and none leaves no glint', c.lobes === 3 && c.lefts.join() === '0,1,2' && c.none, [c.lobes, c.lefts, c.none]);
  check('the glint is dark by day and lit at night', c.glintDay < .2 && c.glintNight > 1.5, [c.glintDay, c.glintNight]); }
for (const p of r.pines) { check('the pine is the same twice from one key', p.same); check('the pine is in budget (12,000 triangles, 4 draws)', p.tris <= 12000 && p.draws <= 4, [p.tris, p.draws]);
  check('the pine stands 8 to 10.5 m', p.top >= 8 && p.top <= 10.5, p.top); check('it leans lee (its leader 1 to 3 m downwind of its foot)', p.leanLee >= 1 && p.leanLee <= 3, p.leanLee);
  check('its needles are flagged lee (3 in 4 or more on the lee side)', p.leeShare >= .75, p.leeShare); check('felled, it is a stump of 0.6 m with no needles', !p.felledPads && p.cut === .6 && p.felledTop < 1.2, [p.felledPads, p.cut, p.felledTop]); }
for (const s of r.stones) { check(`the ${s.school} stone is the same twice`, s.same); check(`the ${s.school} stone is in budget (4,000 triangles, 7 draws)`, s.tris <= 4000 && s.draws <= 7, [s.tris, s.draws]);
  check(`the ${s.school} stone is the game's slab and stands clear of the wall`, s.size.join() === '0.7,1.15,0.2' && s.back > 0, [s.size, s.back]);
  check(`the ${s.school} stone's script is lit in two panels; cut, it has none and a socket`, s.lit === 2 && !!s.glow && s.cutLit === 0 && !s.cutScript && s.socket, [s.lit, s.glow, s.cutLit, s.cutScript]); }
const glows = new Set(r.stones.map(s => s.glow)); check('each school lights its script in its own colour', glows.size === 6, [...glows]);
await page.close();
if (process.argv.includes('--shots')) for (const q of ['view=crater', 'view=crater&close', 'view=crater&night', 'view=crater&close&left=1', 'view=pine', 'view=pine&far', 'view=pine&felled', 'view=stone', 'view=stone&school=tine', 'view=stone&school=uisce&close', 'view=stone&cut']) {
  const name = 'rare-' + q.replace('view=', '').replace(/&school=/, '-').replace(/&left=/, '-left').replace(/&/g, '-'); console.log(execFileSync('node', [path.join(here, 'shoot.mjs'), '--page=rare.html', '--name=' + name, '--q=' + q]).toString().split('{')[0]); }
await browser.close(); srv.close(); console.log(fails ? `${fails} FAILED` : 'all passed'); process.exit(fails ? 1 : 0);
