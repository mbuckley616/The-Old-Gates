// Mountains and rivers on the world map (Session 432, Michael's C on #112: the horseshoe). The ranges are chains laid
// round a basin on each landmass and the Ferrous wall along the home's north, measured from their spine; the rivers
// are routed once per seed on the real height (an 80u lattice, the settlement pads raised, a priority flood, flow
// accumulation), carved from a bucket grid, widening downstream, forking, ending in the sea or a lake. This checks the
// routing's numbers, that no channel runs through a pad, the widths, the carve under a great river, the ranges' shape,
// the cost, and takes two pictures for the devlog.
import { boot, check } from './lib/game.mjs';
import fs from 'fs';
const g = await boot(); const { page } = g;
fs.mkdirSync('tests/out', { recursive: true });
const r = await page.evaluate(() => {
  const out = {}; let t0 = performance.now(); WORLD.rawH(15000, 15000); out.firstMs = Math.round(performance.now() - t0);
  const RV = WORLD.routed; out.stats = RV.stats; out.ready = RV.ready;
  out.ends = {}; for (const r of RV.reaches) out.ends[r.end] = (out.ends[r.end] || 0) + 1;
  out.great = RV.great.map(g => ({ name: g.name, nat: g.nat, area: +(g.area / 1e6).toFixed(1), len: Math.round(g.len), w: +g.wMouth.toFixed(1), reaches: g.reaches, delta: !!(g.delta && g.delta.length), w0: +g.stem[g.stem.length - 1].ws[0].toFixed(1), w1: +g.stem[0].ws[g.stem[0].ws.length - 1].toFixed(1) }));
  // every settlement pad clear of every channel (ports sit at the shore, where a mouth may pass)
  let bends = 0, portBends = 0, tot = 0, quays = 0;
  for (let j = 0; j < WORLD.GRID; j++) for (let i = 0; i < WORLD.GRID; i++) { const c = WORLD.getCell(i, j); if (c.home) continue; for (const t of c.sites) { if (!(t.pad > 0) || t.kind === 'portal' || t.kind === 'bridge') continue; tot++; let dmin = 1e9, dnav = 1e9;
    for (let dj = -1; dj <= 1; dj++) for (let di = -1; di <= 1; di++) { if (i + di < 0 || j + dj < 0 || i + di >= WORLD.GRID || j + dj >= WORLD.GRID) continue; const cc = WORLD.getCell(i + di, j + dj); for (const rv of cc.rivers) { const o = [0, 0]; WORLD.riverSample(rv, 0, rv.pts.length - 2, t.x, t.z, o); if (o[0] - o[1] < dmin) dmin = o[0] - o[1]; if (rv.nav && o[0] < dnav) dnav = o[0]; } }
    if (dmin < t.pad) { if (t.kind === 'port') portBends++; else bends++; } if (dnav < t.pad + 220) quays++; } }
  out.bends = bends; out.portBends = portBends; out.sites = tot; out.quays = quays;
  // the carve under the three largest rivers' last reach: the ship's line is worldH < −1.4
  out.wet = RV.great.slice(0, 3).map(gr => { const st = gr.stem[0]; let wet = 0, n = 0, bank = 0; for (let i = 0; i < st.pts.length - 1; i++) for (let u = 0; u < 1; u += .25) { const x = st.pts[i][0] * (1 - u) + st.pts[i + 1][0] * u, z = st.pts[i][1] * (1 - u) + st.pts[i + 1][1] * u; n++; if (WORLD.worldH(x, z) < -1.4) wet++; const w = st.ws[i]; const dx = st.pts[i + 1][0] - st.pts[i][0], dz = st.pts[i + 1][1] - st.pts[i][1], L = Math.hypot(dx, dz) || 1; if (WORLD.worldH(x - dz / L * (w + 40), z + dx / L * (w + 40)) > 0 || WORLD.worldH(x + dz / L * (w + 40), z - dx / L * (w + 40)) > 0) bank++; } return { name: gr.name, wet, n, bank }; });
  // the ranges: a chain's spine, not a border; the Ferrous wall and its notch at the Border Road
  const sp = WORLD.rvSpines(); const pd = (pts, x, z) => { let b = 1e9; for (let i = 0; i < pts.length - 1; i++) { const a = pts[i], c = pts[i + 1]; const vx = c[0] - a[0], vz = c[1] - a[1], l2 = vx * vx + vz * vz || 1; let t = ((x - a[0]) * vx + (z - a[1]) * vz) / l2; t = Math.max(0, Math.min(1, t)); b = Math.min(b, Math.hypot(x - a[0] - vx * t, z - a[1] - vz * t)); } return b; };
  let stray = 0, high = 0, onSpine = 0, spineN = 0; const W = WORLD.SIZE * WORLD.GRID;
  for (let z = 100; z < W; z += 200) for (let x = 100; x < W; x += 200) { const m = WORLD.ridgeAt(x, z); if (m > .3) { high++; if (Math.min(...sp.map(s => pd(s.pts, x, z))) > 600) stray++; } }
  for (const s of sp) for (const p of s.pts) { spineN++; if (WORLD.ridgeAt(p[0], p[1]) > .5 || WORLD.ridgeAt(p[0] + 90, p[1]) > .5 || WORLD.ridgeAt(p[0], p[1] + 90) > .5) onSpine++; }
  out.ridge = { high, stray, onSpine, spineN, spines: sp.length, basins: sp.filter(s => s.basin).length };
  const hx = WORLD.HOME_I * WORLD.SIZE, hz = WORLD.HOME_J * WORLD.SIZE; const fer = sp.find(s => s.fixed);
  out.ferrous = { mid: +WORLD.ridgeAt(hx + 1200, hz - 60).toFixed(2), midH: Math.round(WORLD.landH(hx + 1200, hz - 60)), notch: +WORLD.ridgeAt(fer.notchX, hz - 20).toFixed(2), notchH: Math.round(WORLD.landH(fer.notchX, hz - 20)) };
  // the peaks stand on the spines, and the cells own them
  const pk = WORLD.spinePeaks(); let far = 0, owned = 0; for (const p of pk) { if (Math.min(...sp.map(s => pd(s.pts, p.x, p.z))) > 150) far++; const c = WORLD.getCell(p.i, p.j); if (c.peaks.some(q => q.x === p.x && q.z === p.z && q.name)) owned++; }
  out.peaks = { n: pk.length, far, owned };
  // the cost of the carve
  t0 = performance.now(); let s = 0; for (let k = 0; k < 100000; k++) s += WORLD.rawH(13000 + (k % 300) * 3, 24000 + (k / 300) * 3); out.rawH100k = Math.round(performance.now() - t0);
  out.lakes = RV.lakes.length; out.basinLakes = RV.lakes.filter(l => l.basin).length; out.lakeNamed = RV.lakes.filter(l => l.name).length;
  return out;
});
console.log(JSON.stringify({ stats: r.stats, ends: r.ends, firstMs: r.firstMs, rawH100k: r.rawH100k, bends: r.bends, portBends: r.portBends, quays: r.quays, sites: r.sites, ridge: r.ridge, ferrous: r.ferrous, peaks: r.peaks, lakes: r.lakes, basinLakes: r.basinLakes }));
for (const gr of r.great) console.log('  ', JSON.stringify(gr)); for (const w of r.wet) console.log('  wet', JSON.stringify(w));
const st = r.stats;
check('the routing ran once at the first call for terrain, under three seconds', r.ready && r.firstMs < 3000, r.firstMs + ' ms');
check('every reach ends in the sea, a lake or a fork; none on dry land', st.sinks === 0 && !r.ends.sink, JSON.stringify(r.ends));
check('rivers reach the sea on every island: 20 or more mouths, 9 or more named, a delta or two', st.mouths >= 20 && st.great >= 9 && st.deltas >= 1, `${st.mouths} mouths, ${st.great} named, ${st.deltas} deltas`);
check('tributaries join: forks and lake inflows', st.joins >= 20 && st.toLake >= 3, `${st.joins} joins, ${st.toLake} to a lake`);
check('a ship can enter six or more rivers from the sea; 30 km or more sixteen wide or more', st.navMouths >= 6 && st.navLen >= 30000, `${st.navMouths}, ${st.navLen}u`);
check('every great river is wider at the mouth than at its source', r.great.every(g => g.w1 > g.w0 && g.w1 >= 8), r.great.map(g => `${g.name} ${g.w0}→${g.w1}`).join(', '));
check('each nation names its rivers in its own tongue', r.great.every(g => (g.nat === 'mark' && /water$/.test(g.name)) || (g.nat === 'aurenne' && /^La /.test(g.name)) || (g.nat === 'gatelands' && /^An /.test(g.name))), r.great.map(g => g.nat + ':' + g.name).join(', '));
check('no channel runs through a settlement pad (a port at the shore aside: two at most)', r.bends === 0 && r.portBends <= 2, `${r.bends} inland, ${r.portBends} ports of ${r.sites}`);
check('towns within a short walk of navigable water, for the quays to come: 15 or more', r.quays >= 15, r.quays);
check('the three largest rivers\u2019 last reach is water a ship floats in (worldH below \u22121.4) along 95% of its line, with dry banks beside where the reach is over a kilometre', r.wet.every(w => w.wet >= w.n * .95 && (w.n < 50 || w.bank >= w.n * .8)), JSON.stringify(r.wet));
check('the lakes: the three basin lakes and the pits a river flows into, every one named by its cell; between 8 and 80', r.basinLakes === 3 && r.lakes >= 8 && r.lakes <= 80 && r.lakeNamed === r.lakes, `${r.lakes} lakes, ${r.basinLakes} basins, ${r.lakeNamed} named`);
check('the ranges are chains: every high point of ridgeAt lies within 600u of a spine, and the spines are high', r.ridge.stray === 0 && r.ridge.high > 100 && r.ridge.onSpine >= r.ridge.spineN * .6, JSON.stringify(r.ridge));
check('three horseshoes with a basin each, and the Ferrous wall', r.ridge.spines === 4 && r.ridge.basins === 3, JSON.stringify(r.ridge));
check('the Ferrous stands over 60u along the home’s north, with a notch under 10u where the Border Road crosses', r.ferrous.mid >= .9 && r.ferrous.midH > 60 && r.ferrous.notch < .2 && r.ferrous.notchH < 10, JSON.stringify(r.ferrous));
check('the peaks stand on the spines (40 to 90 of them), each named by its cell', r.peaks.n >= 40 && r.peaks.n <= 90 && r.peaks.far === 0 && r.peaks.owned === r.peaks.n, JSON.stringify(r.peaks));
check('the carve costs no more than the old loop: 100,000 rawH under 600 ms here', r.rawH100k < 600, r.rawH100k + ' ms');

// pictures: on the bank of the largest named river, looking downstream; and the ring from across its basin
await g.intoWorld();
const spot = await page.evaluate(() => {
  const RV = WORLD.routed; const gr = RV.great.slice().sort((a, b) => b.len - a.len)[0]; const st = gr.stem[Math.min(1, gr.stem.length - 1)]; const k = Math.floor(st.pts.length / 2);
  const a = st.pts[k], b = st.pts[Math.min(st.pts.length - 1, k + 3)]; const dx = b[0] - a[0], dz = b[1] - a[1], L = Math.hypot(dx, dz) || 1; const w = st.ws[k];
  // the nearest dry ground beside the channel, in any direction, then eight more
  let best = null; for (let ang = 0; ang < Math.PI * 2; ang += Math.PI / 8) for (let off = w / 2; off < 160; off += 4) { const x = a[0] + Math.cos(ang) * off, z = a[1] + Math.sin(ang) * off; if (WORLD.worldH(x, z) > .5) { if (!best || off < best.off) best = { off, ang }; break; } }
  const off = best ? best.off + 8 : 60, ang0 = best ? best.ang : 0; const sx = a[0] + Math.cos(ang0) * off, sz = a[1] + Math.sin(ang0) * off;
  px = sx; pz = sz; yaw = Math.atan2(-dx, -dz);
  return { name: gr.name, x: Math.round(sx), z: Math.round(sz), w: Math.round(w), off: Math.round(off), h: +WORLD.worldH(sx, sz).toFixed(1), bed: +WORLD.worldH(a[0], a[1]).toFixed(1), look: [a[0] + dx / L * 120, WORLD.worldH(a[0], a[1]) - 1, a[1] + dz / L * 120] };
});
for (let k = 0; k < 6; k++) { await page.waitForTimeout(2000); await g.frames(2); }
const shots = await page.evaluate((spot) => {
  for (let q = 0; q < 400 && (WORLD.jobs.length || [...WORLD.LOADED.values()].some(L => L.pending)); q++) { WORLD.tick(1 / 60, performance.now()); while (WORLD.jobs.length) { const j = WORLD.jobs.shift(); let more = false; try { more = j.fn(); } catch (e) {} if (more) WORLD.jobs.push(j); } }
  forceTime(11); WORLD.tick(1 / 60, performance.now());
  const snap = () => { const cv = REN.domElement, o = document.createElement('canvas'); o.width = cv.width; o.height = cv.height; o.getContext('2d').drawImage(cv, 0, 0); return o.toDataURL(); };
  const cam = new THREE.PerspectiveCamera(60, REN.domElement.width / REN.domElement.height, .3, 900); const out = {};
  cam.position.set(spot.x, WORLD.worldH(spot.x, spot.z) + 6, spot.z); cam.lookAt(spot.look[0], spot.look[1], spot.look[2]); WORLD.scene.updateMatrixWorld(true); REN.render(WORLD.scene, cam); out.river = snap();
  out.chunks = WORLD.chunks.size; out.where = spot;
  return out;
}, spot);
fs.writeFileSync('tests/out/rivers-bank.png', Buffer.from(shots.river.split(',')[1], 'base64'));
console.log('bank', JSON.stringify(shots.where));
check('no page errors', g.errs.length === 0, g.errs.join(' | '));
await g.close();
