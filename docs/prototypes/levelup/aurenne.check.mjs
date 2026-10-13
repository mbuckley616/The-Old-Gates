// node docs/prototypes/levelup/aurenne.check.mjs [--shots] (Session 816, card F6): Aurenne's houses as pieces, in the test Chromium.
// Michael's mix holds on every street (one Roman house in every three lots, two flat); a lot's house comes from its street
// and index alone (the same key builds the same house, byte for byte); every house of 300 builds as a handful of meshes
// (one per material), within a triangle budget, standing on its lot: nothing below the ground, nothing past the lot's sides
// but its outside stair and a Roman roof's eaves, nothing taller than a three-storey house; the street page renders with no errors. --shots writes aurenne-street.jpg and aurenne-houses.jpg.
import { chromium } from 'playwright'; import http from 'http'; import fs from 'fs'; import path from 'path'; import { fileURLToPath } from 'url';
import { execFileSync } from 'child_process';
const here = path.dirname(fileURLToPath(import.meta.url));
const types = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json', '.bin': 'application/octet-stream' };
const srv = http.createServer((q, r) => { const f = path.join(here, decodeURIComponent(q.url.split('?')[0])); if (!f.startsWith(here) || !fs.existsSync(f)) { r.writeHead(404); return r.end(); } r.writeHead(200, { 'content-type': types[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(r); }).listen(0);
const port = srv.address().port, launch = { args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] };
if (!fs.existsSync(chromium.executablePath()) && fs.existsSync('/opt/pw-browsers/chromium')) launch.executablePath = '/opt/pw-browsers/chromium';
const browser = await chromium.launch(launch); let fails = 0;
const check = (name, ok, info) => { console.log((ok ? 'PASS ' : 'FAIL ') + name + (info !== undefined ? '  ' + JSON.stringify(info) : '')); if (!ok) fails++; };
const page = await browser.newPage({ viewport: { width: 960, height: 540 } }); const errs = []; page.on('pageerror', e => errs.push(String(e)));
await page.goto(`http://localhost:${port}/aurenne.html?still&nopeople&w=960&h=540`); await page.waitForFunction(() => window.__done || window.__err, null, { timeout: 600000 });
const r = await page.evaluate(async () => { const THREE = await import('three'), K = await import('./pieces.js'), out = { streets: [], houses: [], same: 0, n: 0 };
  const hash = g => { let h = 0; g.traverse(m => { if (!m.isMesh) return; const a = m.geometry.attributes.position.array; h = (h * 31 + a.length) | 0; for (let i = 0; i < a.length; i += 3) h = (h * 31 + Math.round(a[i] * 1e4)) | 0; }); return h; };
  // the mix, over many streets: every run of three lots has exactly one Roman house
  for (let s = 0; s < 40; s++) { let bad = 0, roman = 0; for (let t = 0; t < 10; t++) { let k = 0; for (let j = 0; j < 3; j++) if (K.aurenneLot('street' + s, t * 3 + j).o.kind === 'tile') k++; if (k !== 1) bad++; roman += k; } out.streets.push({ bad, roman }); }
  // 300 houses: meshes, triangles, footprint, and the same key building the same house
  for (let i = 0; i < 300; i++) { const st = 'town' + (i % 12), L = K.aurenneLot(st, i), h = K.aurenneHouse(L.o, L.r), L2 = K.aurenneLot(st, i), h2 = K.aurenneHouse(L2.o, L2.r);
    out.n++; if (hash(h.group) === hash(h2.group) && JSON.stringify(L.o) === JSON.stringify(L2.o)) out.same++;
    const b = new THREE.Box3().setFromObject(h.group), { w, d } = L.o, eave = L.o.kind === 'tile' ? .55 : .35, side = L.o.stair ? w / 2 + 1.0 : w / 2 + eave, frontMax = d / 2 + (L.o.arcade ? 2.9 : 1.0);
    out.houses.push({ kind: L.o.kind, two: L.o.two, dome: !!L.o.dome, arcade: !!L.o.arcade, stair: !!L.o.stair, tris: h.tris, draws: h.draws, below: +b.min.y.toFixed(3), sides: +Math.max(-b.min.x - side, b.max.x - (w / 2 + eave)).toFixed(3), front: +(b.max.z - frontMax).toFixed(3), back: +(-b.min.z - (d / 2 + eave + .15)).toFixed(3), roofTop: h.roofTop, top: +b.max.y.toFixed(2) });
    h.group.traverse(m => m.geometry && m.geometry.dispose()); h2.group.traverse(m => m.geometry && m.geometry.dispose()); }
  out.page = window.__stats; return out; });
const badStreets = r.streets.filter(s => s.bad).length, roman = r.houses.filter(h => h.kind === 'tile').length;
check(`Michael's mix: one Roman house in every run of three lots, on all of 40 streets (${r.streets.reduce((a, s) => a + s.roman, 0)} of 1,200 lots)`, badStreets === 0 && r.streets.every(s => s.roman === 10), { badStreets });
check(`a lot's house comes from its street and index alone: ${r.same} of ${r.n} built twice are the same`, r.same === r.n);
const by = k => r.houses.filter(k), stat = (hs, f) => [Math.min(...hs.map(f)), Math.max(...hs.map(f)), Math.round(hs.reduce((a, h) => a + f(h), 0) / hs.length)];
for (const [name, f] of [['flat, one storey', h => h.kind === 'flat' && !h.two], ['flat, two storeys', h => h.kind === 'flat' && h.two], ['flat with a dome', h => h.dome], ['Roman', h => h.kind === 'tile' && !h.arcade], ['Roman with an arcade', h => h.arcade]]) {
  const hs = by(f); if (!hs.length) { check(`${name}: some among the 300`, false); continue; } const t = stat(hs, h => h.tris), dr = stat(hs, h => h.draws);
  check(`${name} (${hs.length}): ${t[0].toLocaleString()} to ${t[1].toLocaleString()} triangles (mean ${t[2].toLocaleString()}), ${dr[0]} to ${dr[1]} meshes, one per material`, t[1] < 12000 && dr[1] <= 16, { tris: t, draws: dr }); }
check('no house reaches below the ground', r.houses.every(h => h.below >= -0.001), r.houses.filter(h => h.below < -0.001).slice(0, 3));
check('every house keeps to its lot\'s width and depth (its outside stair, its arcade and a Roman roof\'s eaves aside)', r.houses.every(h => h.sides <= .01 && h.front <= .01 && h.back <= .01), r.houses.filter(h => h.sides > .01 || h.front > .01 || h.back > .01).slice(0, 3));
{ const one = by(h => !h.two).map(h => h.top), two = by(h => h.two).map(h => h.top);
  check(`heights: one storey ${Math.min(...one).toFixed(1)} to ${Math.max(...one).toFixed(1)} m, two storeys ${Math.min(...two).toFixed(1)} to ${Math.max(...two).toFixed(1)} m to the top of anything on it; the top it reports is that top`, Math.max(...one) < 8 && Math.max(...two) < 11 && r.houses.every(h => Math.abs(h.top - h.roofTop) < .01)); }
check(`the street page: ${r.page.houses.length} houses, kinds ${r.page.lotKinds.replace(/flat/g, 'F').replace(/tile/g, 'R')}, no page errors`, errs.length === 0 && r.page.houses.length === 12, errs.slice(0, 3));
await page.close();
if (process.argv.includes('--shots')) for (const [name, q] of [['aurenne-street', ''], ['aurenne-houses', 'view=houses']]) console.log(execFileSync('node', [path.join(here, 'shoot.mjs'), '--page=aurenne.html', '--name=' + name, ...(q ? ['--q=' + q] : [])]).toString().split('{')[0]);
await browser.close(); srv.close(); console.log(fails ? `${fails} FAILED` : 'all passed'); process.exit(fails ? 1 : 0);
