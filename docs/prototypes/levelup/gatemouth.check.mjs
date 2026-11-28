// node docs/prototypes/levelup/gatemouth.check.mjs (Session 2616): gatemouth.js's checks, every size in every condition, in the test Chromium.
import { chromium } from 'playwright'; import http from 'http'; import fs from 'fs'; import path from 'path'; import { fileURLToPath } from 'url';
const here = path.dirname(fileURLToPath(import.meta.url)), types = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json' };
const srv = http.createServer((q, r) => { const f = path.join(here, decodeURIComponent(q.url.split('?')[0])); if (!f.startsWith(here) || !fs.existsSync(f)) { r.writeHead(404); return r.end(); } r.writeHead(200, { 'content-type': types[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(r); }).listen(0);
const launch = { args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] }; if (!fs.existsSync(chromium.executablePath()) && fs.existsSync('/opt/pw-browsers/chromium')) launch.executablePath = '/opt/pw-browsers/chromium';
const browser = await chromium.launch(launch), page = await browser.newPage(), errs = []; page.on('pageerror', e => errs.push(String(e)));
await page.goto(`http://localhost:${srv.address().port}/gatemouth.html?still&w=320&h=180`); await page.waitForFunction(() => window.__done || window.__err, null, { timeout: 120000 });
const rows = await page.evaluate(async () => { const { gateMouth } = await import('./gatemouth.js'), out = [];
  for (const size of ['s', 'm', 'l']) for (const cond of ['steady', 'failing', 'catastrophic']) { const A = gateMouth({ size, cond }), R = A.rings, inner = R[3];
    const hillAtFace = Math.min(...[-.5, 0, .5].map(k => A.ground(k * R[0].ro, A.face - 1.5))), ringTop = A.CY + R[0].ro;
    let nan = 0; A.group.traverse(o => { if (o.isMesh) { const p = o.geometry.attributes.position.array; for (let i = 0; i < p.length; i++) if (!isFinite(p[i])) { nan++; break; } } });
    const fallen = A.lost.map(q => A.ground(q.x, q.z)), seats = R.reduce((s, q) => s + (q.gone || 0), 0);
    out.push({ size, cond, tris: A.gateTris, draws: A.gateDraws, door: A.door, innerTop: +(A.CY + inner.ri).toFixed(2), hillAtFace: +hillAtFace.toFixed(1), ringTop: +ringTop.toFixed(1), counts: A.counts, lost: A.lost.length, hung: A.hung.length, seats, nan, fallen }); }
  return out; });
let pass = 0, fail = 0; const ok = (c, msg) => { if (c) pass++; else { fail++; console.log('FAIL', msg); } };
for (const r of rows) { const tag = `${r.size}/${r.cond}`;
  ok(r.nan === 0, `${tag}: no NaN in any mesh`);
  ok(r.tris < 6000 && r.draws <= 14, `${tag}: the gate (no land) under 6,000 triangles in 14 draws: ${r.tris}, ${r.draws}`);
  ok(r.door.h + .4 < r.innerTop, `${tag}: the slit stands inside the inner ring: ${r.door.h} under ${r.innerTop}`);
  ok(r.hillAtFace > r.ringTop, `${tag}: the hill behind the face stands over the outer ring: ${r.hillAtFace} over ${r.ringTop}`);
  if (r.cond === 'steady') ok(r.counts.lit === r.counts.stones && r.seats === 0, `${tag}: steady keeps every stone, every one burning`);
  if (r.cond === 'failing') ok(r.lost > 3 && r.hung === 0 && r.counts.slipped === 3 && r.counts.dead > 0 && r.counts.dim > 0 && r.counts.lit === 0, `${tag}: failing drops an arc and dims the script: lost ${r.lost}, slipped ${r.counts.slipped}`);
  if (r.cond === 'catastrophic') ok(r.hung > 8 && r.lost === 0 && r.counts.dead === r.counts.stones, `${tag}: catastrophic hangs its lost stones and the script is dead: hung ${r.hung}`); }
console.log(rows.map(r => `${r.size}/${r.cond} ${r.tris} tris ${r.draws} draws, door ${r.door.w}x${r.door.h} under ${r.innerTop}, hill ${r.hillAtFace} over ${r.ringTop}, lost ${r.lost} hung ${r.hung}`).join('\n'));
// Session 2751: gatewards.js, the gate's surroundings, at the medium gate in every condition
const wards = await page.evaluate(async () => { const { gateMouth } = await import('./gatemouth.js'), { gateWards } = await import('./gatewards.js'), out = [];
  for (const kind of ['weave', 'watch']) for (const cond of ['steady', 'failing', 'catastrophic']) { const A = gateMouth({ size: 'm', cond }), W = gateWards(A, { kind }); let nan = 0;
    W.group.traverse(o => { if (o.isMesh) { const p = o.geometry.attributes.position.array; for (let i = 0; i < p.length; i++) if (!isFinite(p[i])) { nan++; break; } } });
    out.push({ kind, cond, tris: W.tris, draws: W.draws, nan, parts: W.parts, hillTop: A.hill.h, ringTop: A.CY + A.R0, halfCourt: A.R0 * .95 }); }
  return out; });
for (const w of wards) { const tag = `wards ${w.kind}/${w.cond}`;
  ok(w.nan === 0 && w.tris > 0 && w.tris < 3000 && w.draws <= 6, `${tag}: under 3,000 triangles in 6 draws, no NaN: ${w.tris}, ${w.draws}`);
  if (w.kind === 'weave') { const P = w.parts.pylons, S = w.parts.stelae;
    ok(P.length === 2 && P.every(q => q.broke || q.top > w.ringTop + 5) && P.every(q => Math.abs(q.x) > w.halfCourt + 4), `${tag}: two pylons off the court, a whole one over the rings: ${P.map(q => q.top).join(', ')}`);
    ok(S.length === 6 && S.every(q => Math.abs(q.x) > 3), `${tag}: six stelae clear of the way in`);
    ok(w.cond === 'steady' ? P.every(q => !q.broke) && S.every(q => q.fate === 'stand') : P.filter(q => q.broke).length === 1 && S.filter(q => q.fate !== 'stand').length === 2, `${tag}: the condition breaks one pylon and two stelae: ${S.map(q => q.fate).join(',')}`); }
  else { ok(w.parts.towers.length === 3 && w.parts.walls.every(q => q.made > 5), `${tag}: three towers and three runs of curtain`); } }
console.log(wards.map(w => `wards ${w.kind}/${w.cond} ${w.tris} tris ${w.draws} draws`).join('\n'));
ok(errs.length === 0, 'no page errors: ' + errs.slice(0, 3).join(' | '));
console.log(`gatemouth.check: ${pass} of ${pass + fail} passed`); await browser.close(); srv.close(); process.exit(fail ? 1 : 0);
