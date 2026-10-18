// node docs/prototypes/levelup/ruins.check.mjs (Session 1119): the Weavers' ring of broken arches on a coast (ruins.js, OG-104). It builds the
// same twice and in budget; eleven arches of the gate kit at 2.2 times their size stand on a circle about the heart, four standing 44 m to their points
// and seven broken, and not one stone floats or burns (gatekit's `ruin`); no stone lies under the turf; the bay to the sea is gone, its spill
// running to the cliff's edge and never over it; the cliff stands over the sea; a 1.75 m post at a standing arch's foot is the scale;
// and the page renders its views.
import { chromium } from 'playwright'; import http from 'http'; import fs from 'fs'; import path from 'path'; import { fileURLToPath } from 'url';
const here = path.dirname(fileURLToPath(import.meta.url));
const types = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json', '.bin': 'application/octet-stream' };
const srv = http.createServer((q, r) => { const f = path.join(here, decodeURIComponent(q.url.split('?')[0])); if (!f.startsWith(here) || !fs.existsSync(f)) { r.writeHead(404); return r.end(); } r.writeHead(200, { 'content-type': types[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(r); }).listen(0);
const port = srv.address().port, launch = { args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] };
if (!fs.existsSync(chromium.executablePath()) && fs.existsSync('/opt/pw-browsers/chromium')) launch.executablePath = '/opt/pw-browsers/chromium';
const browser = await chromium.launch(launch); let fails = 0;
const check = (name, ok, info) => { console.log((ok ? 'PASS ' : 'FAIL ') + name + (info !== undefined && !ok ? '  ' + JSON.stringify(info).slice(0, 1800) : '')); if (!ok) fails++; };
const page = await browser.newPage({ viewport: { width: 320, height: 200 } }), errs = []; page.on('pageerror', e => errs.push(String(e)));
await page.goto(`http://localhost:${port}/places.html?still&w=320&h=200&place=ring&view=far`); await page.waitForFunction(() => window.__done || window.__err, null, { timeout: 300000 });
const R = await page.evaluate(async () => { const THREE = await import('three'), K = await import('./ruins.js');
  const hash = g => { let h = 0; g.traverse(m => { if (!m.isMesh) return; h = (h * 31 + m.geometry.attributes.position.count) | 0; const a = m.geometry.attributes.position.array; for (let i = 0; i < a.length; i += 9) h = (h * 31 + Math.round(a[i] * 1e3)) | 0; }); return h; };
  const a = K.weaverRing(), b = K.weaverRing(); a.group.updateMatrixWorld(true);
  // how deep any stone of the arches (and the spill) lies under the turf: the least of y - ground over their vertices
  let under = Infinity; for (const m of a.group.children) { if (!m.name.startsWith('arch:') && m.name !== 'stone') continue; const P = m.geometry.attributes.position; for (let i = 0; i < P.count; i += 2) under = Math.min(under, P.getY(i) - a.ground(P.getX(i), P.getZ(i))); }
  const edge = [-60, 0, 60].map(x => +(a.ground(x, a.cliff.z) - a.cliff.sea).toFixed(2)), radii = a.bays.map(q => +Math.hypot(q.x, q.z).toFixed(2)), tops = a.bays.map(q => ({ cond: q.cond, h: +(q.top - a.ground(q.x, q.z)).toFixed(1) }));
  return { tris: a.tris, draws: a.draws, same: hash(a.group) === hash(b.group), bays: a.bays, tops, radii, R: a.R, under: +under.toFixed(2), spill: a.spill, gone: a.gone, cliff: a.cliff, edge, figure: a.figure, span: a.span, rise: a.rise, dais: a.dais,
    names: a.group.children.map(m => m.name) }; });
const st = R.tops.filter(t => t.cond === 'cracked'), br = R.tops.filter(t => t.cond === 'broken');
check(`the ring builds the same twice and in budget: ${R.tris.toLocaleString()} triangles in ${R.draws} draws`, R.same && R.tris < 120000 && R.draws <= 20, [R.tris, R.draws, R.same]);
check(`eleven arches on the circle (${Math.min(...R.radii)} to ${Math.max(...R.radii)} m from the heart): ${st.length} standing to ${st.map(t => t.h).join(', ')} m, ${br.length} broken to ${br.map(t => t.h).join(', ')} m`, R.bays.length === 11 && R.radii.every(d => Math.abs(d - R.R) < .01) && st.length === 4 && br.length === 7 && st.every(t => t.h > 42 && t.h < 46) && br.every(t => t.h < 32), R.tops);
check(`a ruin, not a gate: no stone floats (${R.bays.map(q => q.floating).join(', ')}), no seam burns (${R.bays.reduce((s, q) => s + q.seams, 0)}), the broken arches' stones lie fallen (${br.length ? R.bays.filter(q => q.cond === 'broken').map(q => q.fallen).join(', ') : ''})`, R.bays.every(q => q.floating === 0 && q.seams === 0) && R.bays.filter(q => q.cond === 'broken').every(q => q.fallen >= 4) && !R.names.includes('arch:script') && !R.names.includes('arch:seam') && !R.names.includes('arch:ring'), R.names);
check(`no stone lies deeper under the turf than its footing (the least ${R.under} m)`, R.under > -.6, R.under);
check(`the bay to the sea is gone: its footings and ${R.spill.length} stones spilled toward the sea, the nearest ${Math.min(...R.spill.map(p => p[1] - R.cliff.z)).toFixed(1)} m from the cliff's edge, none over it`, R.gone === 20 && R.spill.every(p => p[1] > R.cliff.z + 1) && Math.min(...R.spill.map(p => p[1] - R.cliff.z)) < 12, R.spill);
check(`the cliff: the turf at its edge stands ${R.edge.join(', ')} m over the sea`, R.edge.every(h => h > 25), R.edge);
check(`the scale: an opening ${R.span} m wide and ${R.rise} m to its point, ${(R.rise / R.figure.h).toFixed(1)} times the 1.75 m post at the foot of bay ${R.figure.bay}; the dais ${2 * R.dais.r} m across`, R.span > 20 && R.rise > 38 && R.figure.h === 1.75 && R.rise / R.figure.h > 20 && st.length && R.bays.find(q => q.i === R.figure.bay).cond === 'cracked', R.figure);
check('the page: no page errors', errs.length === 0, errs.slice(0, 2));
for (const v of ['ring', 'arch', 'heart', 'far', 'ring&dusk']) { const pg = await browser.newPage({ viewport: { width: 320, height: 200 } }), e2 = []; pg.on('pageerror', e => e2.push(String(e)));
  await pg.goto(`http://localhost:${port}/places.html?still&w=320&h=200&place=ring&view=${v}`); await pg.waitForFunction(() => window.__done || window.__err, null, { timeout: 300000 });
  const s = await pg.evaluate(() => window.__stats.place); check(`places.html?place=ring&view=${v} renders: ${s.tris.toLocaleString()} triangles, ${s.bays} arches, no page errors`, s.tris > 0 && e2.length === 0, e2.slice(0, 2)); await pg.close(); }
await browser.close(); srv.close(); console.log(fails ? `${fails} FAILED` : 'all passed'); process.exit(fails ? 1 : 0);
