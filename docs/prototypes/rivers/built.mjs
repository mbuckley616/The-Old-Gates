// node docs/prototypes/rivers/built.mjs [--res=160] -> docs/prototypes/rivers/built-c.jpg and built-c-islands.jpg (Session 432):
// the world map as the game draws it now that the horseshoe ranges and the routed rivers are in the terrain, with the
// great rivers' names, the lakes' names and a legend of the routing's numbers. The map itself shows the water: the
// tiles sample worldH, and the carve is in rawH.
import { boot } from '../../../tests/lib/game.mjs';
import fs from 'fs'; import path from 'path'; import { fileURLToPath } from 'url';
const here = path.dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2); const arg = (k, d) => { const a = args.find(x => x.startsWith('--' + k + '=')); return a ? a.slice(k.length + 3) : d; };
const RES = +arg('res', 160);
const g = await boot(); const { page } = g;
const t0 = Date.now();
const out = await page.evaluate((RES) => {
  WORLD.rawH(100, 100); const RV = WORLD.routed; const G = WORLD.GRID, SIZE = WORLD.SIZE, W = SIZE * G;
  const cv = document.createElement('canvas'); cv.width = G * RES; cv.height = G * RES + 110; const x = cv.getContext('2d'); x.fillStyle = '#2b241a'; x.fillRect(0, 0, cv.width, cv.height);
  for (let j = 0; j < G; j++) for (let i = 0; i < G; i++) { const c = WORLD.getCell(i, j); const t = WORLD.startTile(c, RES); while (!t.done) WORLD.tileStep(t, 1e9); x.drawImage(t.cv, i * RES, j * RES); }
  const S = cv.width / W; const P = p => [p[0] * S, p[1] * S];
  // the spines, faint, and the peaks
  for (const s of WORLD.rvSpines()) { x.beginPath(); s.pts.forEach((p, i) => { const [a, b] = P(p); i ? x.lineTo(a, b) : x.moveTo(a, b); }); x.lineWidth = 1.2; x.strokeStyle = 'rgba(60,42,28,.55)'; x.setLineDash([3, 3]); x.stroke(); x.setLineDash([]); }
  for (const p of WORLD.spinePeaks()) { const [a, b] = P([p.x, p.z]); x.beginPath(); x.moveTo(a - 5, b + 3); x.lineTo(a, b - 5); x.lineTo(a + 5, b + 3); x.closePath(); x.fillStyle = 'rgba(90,70,52,.8)'; x.fill(); x.strokeStyle = '#2a1c10'; x.lineWidth = .8; x.stroke(); }
  // the great rivers' names at the mouth, the lakes' names
  x.font = 'italic 600 15px Georgia, serif'; x.textAlign = 'left';
  for (const gr of RV.great) { const [a, b] = P(gr.mouth); x.beginPath(); x.arc(a, b, 5, 0, Math.PI * 2); x.fillStyle = '#e8d8a0'; x.fill(); x.strokeStyle = '#1e3a7a'; x.lineWidth = 2; x.stroke(); x.lineWidth = 3; x.strokeStyle = 'rgba(240,228,200,.85)'; x.strokeText(gr.name, a + 8, b - 7); x.fillStyle = '#1a2c48'; x.fillText(gr.name, a + 8, b - 7); }
  x.font = 'italic 500 12px Georgia, serif'; for (const lk of RV.lakes) { if (!lk.name || lk.r < 150) continue; const [a, b] = P([lk.x, lk.z]); x.textAlign = 'center'; x.lineWidth = 3; x.strokeStyle = 'rgba(240,228,200,.85)'; x.strokeText(lk.name, a, b); x.fillStyle = '#1a2c48'; x.fillText(lk.name, a, b); }
  // the nations
  x.font = 'italic 700 26px Georgia, serif'; x.textAlign = 'center'; x.fillStyle = 'rgba(60,40,20,.6)';
  for (const m of WORLD.routed.masses) { x.fillText(m.nat, m.cx * SIZE * S, (m.cz * SIZE - 1400) * S); }
  const st = RV.stats; const km = v => (v / 1000).toFixed(1) + ' km';
  x.fillStyle = '#e8d8a0'; x.textAlign = 'left'; x.font = '600 18px Georgia, serif'; x.fillText('BUILT — C, THE HORSESHOE: the ranges and rivers now in the terrain (Session 432); the map is the game\'s own, the water is the carve', 16, G * RES + 34);
  x.font = '14px Georgia, serif'; x.fillStyle = '#c8b880';
  x.fillText(`${st.mouths} rivers reach the sea (${st.reaches} reaches; ${st.joins} forks, ${st.toLake} end in a lake, ${st.sinks} on dry land) · ${st.great} named, ${st.deltas} deltas · ${st.lakes} lakes · ${st.navMouths} a ship can enter, ${km(st.navLen)} sixteen wide or more · routed in ${st.ms} ms on ${st.nodes} nodes of 80u`, 16, G * RES + 62);
  x.fillText(`${WORLD.spinePeaks().length} peaks along the spines · ${st.sites} settlements kept clear of the channels`, 16, G * RES + 84);
  window._RV_LAST = cv;
  return { png: cv.toDataURL('image/jpeg', .86), stats: st, great: RV.great.map(g => ({ name: g.name, nat: g.nat, area: Math.round(g.area / 1e6 * 10) / 10, len: Math.round(g.len), w: Math.round(g.wMouth), delta: !!(g.delta && g.delta.length) })) };
}, RES);
fs.writeFileSync(path.join(here, 'built-c.jpg'), Buffer.from(out.png.split(',')[1], 'base64'));
console.log(JSON.stringify(out.stats)); for (const gr of out.great) console.log('   ', JSON.stringify(gr));
const isl = await page.evaluate(() => {
  const SIZE = WORLD.SIZE, G = WORLD.GRID, src = window._RV_LAST, S = src.width / (SIZE * G); const panels = [];
  for (const m of WORLD.routed.masses) { let i0 = 99, j0 = 99, i1 = -1, j1 = -1; for (const [i, j] of m.cells) { i0 = Math.min(i0, i); j0 = Math.min(j0, j); i1 = Math.max(i1, i); j1 = Math.max(j1, j); } i0 -= .5; j0 -= .5; i1 += 1.5; j1 += 1.5; panels.push({ nat: m.nat, sx: i0 * SIZE * S, sy: j0 * SIZE * S, w: (i1 - i0) * SIZE * S, h: (j1 - j0) * SIZE * S }); }
  const scale = 1.5; const PW = Math.max(...panels.map(p => p.w)) * scale; const PH = panels.reduce((s, p) => s + p.h * scale + 30, 0);
  const cv = document.createElement('canvas'); cv.width = PW + 20; cv.height = PH + 10; const x = cv.getContext('2d'); x.fillStyle = '#2b241a'; x.fillRect(0, 0, cv.width, cv.height);
  let y = 10; for (const p of panels) { x.drawImage(src, p.sx, p.sy, p.w, p.h, 10, y, p.w * scale, p.h * scale); x.font = 'italic 600 20px Georgia, serif'; x.fillStyle = '#e8d8a0'; x.textAlign = 'left'; x.fillText(p.nat, 14, y + 24); y += p.h * scale + 30; }
  return cv.toDataURL('image/jpeg', .86);
});
fs.writeFileSync(path.join(here, 'built-c-islands.jpg'), Buffer.from(isl.split(',')[1], 'base64'));
console.log('drawn in', Math.round((Date.now() - t0) / 1000) + 's', 'errors', g.errs); await g.close();
