// node docs/prototypes/levelup/aurenne.check.mjs [--shots] (Session 816, card F6): Aurenne's houses as pieces, in the test Chromium.
// Michael's mix holds on every street (one Roman house in every three lots, two flat); a lot's house comes from its street
// and index alone (the same key builds the same house, byte for byte); every house of 300 builds as a handful of meshes
// (one per material), within a triangle budget, standing on its lot: nothing below the ground, nothing past the lot's sides
// but its outside stair and a Roman roof's eaves, nothing taller than a three-storey house; the street page renders with no errors. --shots writes aurenne-street.jpg and aurenne-houses.jpg.
// Session 832, the Church of the Weaver (aurenneChurch): 72 churches (six sizes, both domes, no tower to two, with and without
// the corner domes) build in budget, standing on the ground, the same twice from one key, at true size against a person; the
// glazed domes carry their own UVs; the square and the line-up render. --shots adds aurenne-church, -churches, -church-dome.
// Session 833, the civic buildings (aurenneCivic): tithe houses and warehouses over their size ranges build in budget, on the
// ground, within their width, the same twice; the quay and the line-up render. --shots adds aurenne-quay and aurenne-civic.
// Session 836, the Mages' academy (aurenneAcademy): four sizes with two and three towers build in budget, on the ground, the
// same twice, the observatory tower the tallest and every tower well above the hall; the page renders. --shots adds aurenne-academy.
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
  out.page = window.__stats;
  // the churches: every size, dome, tower count and the corner domes
  out.churches = []; out.chSame = 0;
  // by rank (Session 881, #294 C): the dome from the rank alone, and an o.dome still overrides it
  out.ranks = ['village', 'town', 'cathedral'].map(rank => { let g = 0; K.aurenneChurch({ w: 14, rank, corners: rank === 'cathedral' }, K.stream('rank:' + rank)).group.traverse(m => { if (m.isMesh && m.name === 'glaze') g++; }); return g; });
  { let g = 0; K.aurenneChurch({ w: 14, rank: 'village', dome: 'blue' }, K.stream('rank:over')).group.traverse(m => { if (m.isMesh && m.name === 'glaze') g++; }); out.rankOver = g; }
  for (const w of [12, 14, 16, 18, 20, 22]) for (const dome of ['blue', 'white']) for (const tower of [0, 1, 2]) for (const corners of [false, true]) { const o = { w, dome, tower, corners }, a = K.aurenneChurch(o, K.stream('ch:' + w + dome + tower + corners)), b = K.aurenneChurch(o, K.stream('ch:' + w + dome + tower + corners));
    if (hash(a.group) === hash(b.group)) out.chSame++; const bx = new THREE.Box3().setFromObject(a.group); let ownUV = 0, glaze = 0; a.group.traverse(m => { if (m.isMesh && m.name === 'glaze') { glaze++; const u = m.geometry.attributes.uv.array; for (let i = 0; i < u.length; i += 2) ownUV = Math.max(ownUV, u[i]); } });
    out.churches.push({ w, dome, tower, corners, tris: a.tris, draws: a.draws, below: +bx.min.y.toFixed(3), domeTop: +a.domeTop.toFixed(2), towerTop: +a.towerTop.toFixed(2), top: +a.roofTop.toFixed(2), doorW: a.door.w, doorH: a.door.h, glaze, maxU: +ownUV.toFixed(1), front: +(bx.max.z - a.front).toFixed(2) });
    for (const g of [a, b]) g.group.traverse(m => m.geometry && m.geometry.dispose()); }
  out.civic = []; out.cvSame = 0;
  const cases = []; for (const w of [18, 20, 22, 24, 26]) for (const d of [12, 15]) cases.push({ kind: 'tithe', w, d }); for (const w of [18, 22, 26, 30]) for (const d of [10, 12]) cases.push({ kind: 'warehouse', w, d });
  cases.forEach((o, i) => { const a = K.aurenneCivic(o, K.stream('cv:' + i)), b = K.aurenneCivic(o, K.stream('cv:' + i)); if (hash(a.group) === hash(b.group)) out.cvSame++; const bx = new THREE.Box3().setFromObject(a.group);
    out.civic.push({ ...o, tris: a.tris, draws: a.draws, below: +bx.min.y.toFixed(3), side: +(Math.max(-bx.min.x, bx.max.x) - o.w / 2).toFixed(2), back: +(-bx.min.z - o.d / 2).toFixed(2), front: +(bx.max.z - a.front).toFixed(2), top: +a.roofTop.toFixed(2) });
    for (const g of [a, b]) g.group.traverse(m => m.geometry && m.geometry.dispose()); });
  out.academy = []; out.acSame = 0;
  for (const w of [24, 28, 32, 36]) for (const towers of [2, 3]) { const a = K.aurenneAcademy({ w, towers }, K.stream('ac:' + w + towers)), b = K.aurenneAcademy({ w, towers }, K.stream('ac:' + w + towers)); if (hash(a.group) === hash(b.group)) out.acSame++;
    const bx = new THREE.Box3().setFromObject(a.group); out.academy.push({ w, towers, tris: a.tris, draws: a.draws, below: +bx.min.y.toFixed(3), front: +(bx.max.z - a.front).toFixed(2), tops: a.towerTops });
    for (const g of [a, b]) g.group.traverse(m => m.geometry && m.geometry.dispose()); }
  return out; });
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
{ const C = r.churches, mm = f => [Math.min(...C.map(f)), Math.max(...C.map(f))], t = mm(c => c.tris), dr = mm(c => c.draws);
  check(`72 churches build: ${t[0].toLocaleString()} to ${t[1].toLocaleString()} triangles, ${dr[0]} to ${dr[1]} meshes, one per material`, C.length === 72 && t[1] < 30000 && dr[1] <= 16, { tris: t, draws: dr });
  check(`by rank (#294 C): the village's dome limewashed (${r.ranks[0]} glazed meshes), the town's and the cathedral's in blue glaze (${r.ranks[1]}, ${r.ranks[2]}); o.dome overrides the rank (${r.rankOver})`, r.ranks[0] === 0 && r.ranks[1] === 1 && r.ranks[2] === 1 && r.rankOver === 1);
  check(`a church comes from its options and key alone: ${r.chSame} of 72 built twice are the same`, r.chSame === 72);
  check('no church reaches below the ground, and nothing stands in front of its steps', C.every(c => c.below >= -0.001 && c.front <= .01), C.filter(c => c.below < -0.001 || c.front > .01).slice(0, 3));
  const d = mm(c => c.domeTop), tw = C.filter(c => c.tower);
  check(`at true size: the great door ${C[0].doorW} by ${C[0].doorH} m (a 1.8 m person is a third of it); the dome's top ${d[0]} to ${d[1]} m; every tower above its dome (${tw.filter(c => c.towerTop > c.domeTop).length} of ${tw.length})`, C[0].doorH >= 5 && d[0] > 14 && d[1] < 40 && tw.every(c => c.towerTop > c.domeTop));
  const bl = C.filter(c => c.dome === 'blue');
  check(`the glazed domes keep their own UVs, tiled around the dome (${bl.length} blue churches, up to ${Math.max(...bl.map(c => c.maxU))} repeats around); the limewashed ones have no glaze`, bl.every(c => c.glaze === 1 && c.maxU >= 20) && C.filter(c => c.dome === 'white').every(c => c.glaze === 0)); }
{ const C = r.civic, of = k => C.filter(c => c.kind === k), mm = (hs, f) => [Math.min(...hs.map(f)), Math.max(...hs.map(f))];
  for (const k of ['tithe', 'warehouse']) { const hs = of(k), t = mm(hs, c => c.tris), dr = mm(hs, c => c.draws), tp = mm(hs, c => c.top);
    check(`${k === 'tithe' ? 'the tithe house' : 'the warehouse'} (${hs.length} sizes): ${t[0].toLocaleString()} to ${t[1].toLocaleString()} triangles, ${dr[0]} to ${dr[1]} meshes, ${tp[0]} to ${tp[1]} m to its top`, t[1] < 20000 && dr[1] <= 14 && tp[1] < (k === 'tithe' ? 22 : 11), { tris: t, draws: dr, top: tp }); }
  check(`a civic building comes from its options and key alone: ${r.cvSame} of ${C.length} built twice are the same`, r.cvSame === C.length);
  check('every civic building stands on the ground, within its width (a warehouse\'s eaves aside, 0.6 m), its depth behind and its front before', C.every(c => c.below >= -0.001 && c.side <= .61 && c.back <= .61 && c.front <= .01), C.filter(c => c.below < -0.001 || c.side > .61 || c.back > .61 || c.front > .01).slice(0, 3)); }
{ const A = r.academy, t = [Math.min(...A.map(a => a.tris)), Math.max(...A.map(a => a.tris))], tops = A.flatMap(a => a.tops);
  check(`the academy (${A.length} builds, 24 to 36 m, two and three towers): ${t[0].toLocaleString()} to ${t[1].toLocaleString()} triangles, at most ${Math.max(...A.map(a => a.draws))} meshes; ${r.acSame} of ${A.length} the same twice`, t[1] < 30000 && Math.max(...A.map(a => a.draws)) <= 14 && r.acSame === A.length, { tris: t });
  check(`its towers: ${Math.min(...tops)} to ${Math.max(...tops)} m, the observatory's the tallest in every build, every one at least twice the hall's 11 m; on the ground, nothing past its front`, A.every(a => a.tops.length === a.towers && Math.max(...a.tops) === a.tops[a.towers === 3 ? 1 : a.towers - 1] && Math.min(...a.tops) > 22 && a.below >= -0.001 && a.front <= .01), A.map(a => a.tops)); }
for (const v of ['academy']) { const pg = await browser.newPage({ viewport: { width: 640, height: 360 } }), e2 = []; pg.on('pageerror', e => e2.push(String(e)));
  await pg.goto(`http://localhost:${port}/aurenne.html?still&nopeople&w=640&h=360&view=${v}`); await pg.waitForFunction(() => window.__done || window.__err, null, { timeout: 600000 });
  const st = await pg.evaluate(() => window.__stats); check(`the academy page: ${st.academy?.towers?.length} towers, no page errors`, e2.length === 0 && st.academy?.towers?.length === 3, e2.slice(0, 3)); await pg.close(); }
for (const v of ['quay', 'civic']) { const pg = await browser.newPage({ viewport: { width: 640, height: 360 } }), e2 = []; pg.on('pageerror', e => e2.push(String(e)));
  await pg.goto(`http://localhost:${port}/aurenne.html?still&nopeople&w=640&h=360&view=${v}`); await pg.waitForFunction(() => window.__done || window.__err, null, { timeout: 600000 });
  const st = await pg.evaluate(() => window.__stats); check(`the ${v} page: ${st.civic.map(c => c.kind).join(', ')}, no page errors`, e2.length === 0 && st.civic.length === (v === 'quay' ? 3 : 2), e2.slice(0, 3)); await pg.close(); }
for (const v of ['church', 'churches']) { const pg = await browser.newPage({ viewport: { width: 640, height: 360 } }), e2 = []; pg.on('pageerror', e => e2.push(String(e)));
  await pg.goto(`http://localhost:${port}/aurenne.html?still&nopeople&w=640&h=360&view=${v}`); await pg.waitForFunction(() => window.__done || window.__err, null, { timeout: 600000 });
  const st = await pg.evaluate(() => window.__stats); check(`the ${v} page: ${st.churches.length} church${st.churches.length > 1 ? 'es' : ''} and ${st.houses.length} houses, no page errors`, e2.length === 0 && st.churches.length === (v === 'church' ? 1 : 3) && st.houses.length === (v === 'church' ? 8 : 0), e2.slice(0, 3)); await pg.close(); }
await page.close();
if (process.argv.includes('--shots')) for (const [name, q] of [['aurenne-street', ''], ['aurenne-houses', 'view=houses'], ['aurenne-church', 'view=church'], ['aurenne-churches', 'view=churches'], ['aurenne-church-dome', 'view=church&top'], ['aurenne-quay', 'view=quay'], ['aurenne-civic', 'view=civic'], ['aurenne-academy', 'view=academy']]) console.log(execFileSync('node', [path.join(here, 'shoot.mjs'), '--page=aurenne.html', '--name=' + name, ...(q ? ['--q=' + q] : [])]).toString().split('{')[0]);
await browser.close(); srv.close(); console.log(fails ? `${fails} FAILED` : 'all passed'); process.exit(fails ? 1 : 0);
