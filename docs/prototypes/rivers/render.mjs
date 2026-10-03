// node docs/prototypes/rivers/render.mjs [--res=160] [--only=spine]
// -> docs/prototypes/rivers/today.jpg and layout-{a,b,c}.jpg (Session 430): the world map as the game draws it
// (every cell's tile, the terrain of this build), with today's ranges and rivers on the first picture and the
// prototype's proposed ranges and rivers (layout.js) on the others. Nothing in the game changes; the pictures are
// for the decision. The close-ups (*-islands.jpg) show each island at four times the scale.
import { boot } from '../../../tests/lib/game.mjs';
import fs from 'fs'; import path from 'path'; import { fileURLToPath } from 'url';
const here = path.dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2); const arg = (k, d) => { const a = args.find(x => x.startsWith('--' + k + '=')); return a ? a.slice(k.length + 3) : d; };
const RES = +arg('res', 160), ONLY = arg('only', null);
const g = await boot(); const { page } = g;
await page.evaluate(() => { WORLD.devUnlockAll(); });
await page.addScriptTag({ path: path.join(here, 'layout.js') });
const t0 = Date.now();
// the base: every cell's tile at RES px, into one canvas kept on the page
const base = await page.evaluate((RES) => {
  const G = WORLD.GRID, cv = document.createElement('canvas'); cv.width = cv.height = G * RES; const ctx = cv.getContext('2d');
  for (let j = 0; j < G; j++) for (let i = 0; i < G; i++) { const c = WORLD.getCell(i, j); const t = WORLD.startTile(c, RES); while (!t.done) WORLD.tileStep(t, 1e9); ctx.drawImage(t.cv, i * RES, j * RES); }
  window._RV_BASE = cv; return { px: cv.width };
}, RES);
console.log('base', base, Math.round((Date.now() - t0) / 1000) + 's');

const NAMES = { 'the Gatelands': ['An Dubh', 'An Bhán', 'An Fhada', 'An Ghlas', 'An Rua', 'An Chaol'], 'the Mark': ['Blackwater', 'Wulfwater', 'Greywater', 'Stanwater', 'Hagwater', 'Oxwater'], 'Aurenne': ['la Dorée', 'la Blanche', 'la Sauvage', 'la Verte', 'la Lente', 'la Claire'] };

// draw one picture: the base, then an overlay (today's data or a layout), then a legend
async function picture(name, rule) {
  const out = await page.evaluate(([rule, NAMES, name]) => {
    const G = WORLD.GRID, SIZE = WORLD.SIZE, W = SIZE * G, base = window._RV_BASE, S = base.width / W;
    const L = rule ? RIVERS_PROTO.layout(rule) : null;
    const cv = document.createElement('canvas'); cv.width = base.width; cv.height = base.height + 150; const x = cv.getContext('2d');
    x.fillStyle = '#2b241a'; x.fillRect(0, 0, cv.width, cv.height); x.drawImage(base, 0, 0);
    const P = (p) => [p[0] * S, p[1] * S];
    const line = (pts, w, col, dash) => { x.beginPath(); pts.forEach((p, i) => { const [a, b] = P(p); i ? x.lineTo(a, b) : x.moveTo(a, b); }); x.lineWidth = w; x.strokeStyle = col; x.setLineDash(dash || []); x.lineCap = 'round'; x.lineJoin = 'round'; x.stroke(); x.setLineDash([]); };
    const peak = (p, s) => { const [a, b] = P(p); x.beginPath(); x.moveTo(a - s, b + s * .6); x.lineTo(a, b - s); x.lineTo(a + s, b + s * .6); x.closePath(); x.fillStyle = '#5a4634'; x.fill(); x.strokeStyle = '#2a1c10'; x.lineWidth = 1; x.stroke(); x.fillStyle = '#fff'; x.beginPath(); x.moveTo(a - s * .35, b - s * .3); x.lineTo(a, b - s); x.lineTo(a + s * .35, b - s * .3); x.closePath(); x.fill(); };
    const RIV = '#2f5f8f', RIV2 = '#6f9fcf';
    let legend = [];
    if (!L) {
      // today: the ridge bands (sampled from ridgeAt), the cells' rivers, peaks and lakes
      x.fillStyle = 'rgba(90,70,50,.45)'; const st = 60; for (let z = st / 2; z < W; z += st) for (let xx = st / 2; xx < W; xx += st) { const m = WORLD.ridgeAt(xx, z); if (m > .35) x.fillRect(xx * S - st * S / 2, z * S - st * S / 2, st * S + .5, st * S + .5); }
      let nr = 0, nrEnd = 0, np = 0;
      for (let j = 0; j < G; j++) for (let i = 0; i < G; i++) { const c = WORLD.getCell(i, j); for (const r of c.rivers) { line(r.pts, Math.max(1.2, r.w * S * 2.2), RIV); nr++; const e = r.pts[r.pts.length - 1]; const [ci, cj] = WORLD.cellOf(e[0], e[1]); if (ci >= 0 && cj >= 0 && ci < G && cj < G && !WORLD.seaBare(e[0], e[1], WORLD.getCell(ci, cj).islets) && !c.lakes.some(l => Math.hypot(l.x - e[0], l.z - e[1]) < l.r + 60) && Math.abs(e[0] - c.ox) > 50 && Math.abs(e[0] - c.ox - SIZE) > 50 && Math.abs(e[1] - c.oz) > 50 && Math.abs(e[1] - c.oz - SIZE) > 50) nrEnd++; }
        for (const p of c.peaks) { peak([p.x, p.z], 7); np++; } for (const l of c.lakes) { const [a, b] = P([l.x, l.z]); x.beginPath(); x.ellipse(a, b, l.r * S, l.r * S * .8, 0, 0, Math.PI * 2); x.fillStyle = '#7d9cb0'; x.fill(); } }
      legend = ['TODAY — ranges are bands on cell borders (ridgeAt), one peak a cell; rivers are border crossings, one width (4–5u), carved at random', `${nr} river pieces · ${nrEnd} end on dry land inside a cell · ${np} peaks · no forks, no deltas, nothing a ship can enter`];
    } else {
      // a parchment wash so today's ridge boxes and brooks recede under the proposal
      x.fillStyle = 'rgba(226,210,168,.5)'; x.fillRect(0, 0, base.width, base.height);
      // the home cell keeps its authored rivers (the Dearg, the Westwater): drawn with a width that grows downstream
      { const hc = WORLD.getCell(5, 10); for (const r of hc.rivers) { for (let i = 1; i < r.pts.length; i++) { const t = i / (r.pts.length - 1); line([r.pts[i - 1], r.pts[i]], Math.max(1.1, (r.w + t * 11) * S * 2.2), RIV); if (r.w + t * 11 >= L.NAV) line([r.pts[i - 1], r.pts[i]], Math.max(.7, (r.w + t * 11) * S * .9), RIV2); } } }
      // the lakes
      const { N, STEP } = L; x.fillStyle = '#6f93b0'; for (let n = 0; n < N * N; n++) if (L.lakeMask[n]) x.fillRect((n % N) * STEP * S, ((n / N) | 0) * STEP * S, STEP * S + .4, STEP * S + .4);
      // the ranges: a band, a hachured centreline, peaks along it
      for (const s of L.spines) { line(s.pts, s.hw * 1.7 * S, 'rgba(100,78,56,.38)'); line(s.pts, 1.4, 'rgba(60,42,28,.9)', [3, 3]);
        let acc = 0; for (let i = 1; i < s.pts.length; i++) { const a = s.pts[i - 1], b = s.pts[i]; const d = Math.hypot(b[0] - a[0], b[1] - a[1]); let t = acc === 0 ? 240 : 0; while (acc + d - t >= 0 && t < d) { const q = (acc + t) % 520; if (q < 1e-6 || acc === 0) {} ; const u = (t) / d; peak([a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u], 6 + (s.h / 60)); t += 520; } acc += d; } }
      // the rivers, width by catchment; a lighter core on the navigable ones
      for (const r of L.brooks) line(r.pts, Math.max(.7, 4 * S * 2.2), 'rgba(47,95,143,.45)');
      for (const r of L.rivers) { const w = (r.w0 + r.w1) / 2; line(r.pts, Math.max(1.1, w * S * 2.2), RIV); if (r.w1 >= L.NAV) line(r.pts, Math.max(.7, w * S * .9), RIV2); }
      for (const gr of L.great) { if (gr.delta) for (const arm of gr.delta.arms) { line(arm, Math.max(1, gr.wMouth * .55 * S * 2.2), RIV); } }
      // quays and bends on the existing settlements
      for (const s of L.sites) { if (s.kind === 'village') continue; const [a, b] = P([s.x, s.z]); if (s.bend) { x.beginPath(); x.arc(a, b, 5, 0, Math.PI * 2); x.strokeStyle = '#c8322a'; x.lineWidth = 1.6; x.stroke(); } if (s.quay) { x.beginPath(); x.arc(a, b, 3.2, 0, Math.PI * 2); x.fillStyle = '#f2e6c4'; x.fill(); x.strokeStyle = '#1e3a7a'; x.lineWidth = 1.4; x.stroke(); } }
      // the great rivers: a mark at the mouth, a name
      const used = {}; x.font = 'italic 600 15px Georgia, serif'; x.textAlign = 'left';
      for (const gr of L.great) { const k = used[gr.nat] = (used[gr.nat] || 0); used[gr.nat]++; const nm = (NAMES[gr.nat] || NAMES['the Gatelands'])[k % 6]; gr.name = nm; const [a, b] = P(gr.mouth);
        x.beginPath(); x.arc(a, b, 6, 0, Math.PI * 2); x.fillStyle = '#e8d8a0'; x.fill(); x.strokeStyle = '#1e3a7a'; x.lineWidth = 2; x.stroke();
        const mp = [a + 9, b - 8]; x.lineWidth = 3; x.strokeStyle = 'rgba(240,228,200,.85)'; x.strokeText(nm, mp[0], mp[1]); x.fillStyle = '#1a2c48'; x.fillText(nm, mp[0], mp[1]); }
      const st = L.stats; const km = v => (v / 1000).toFixed(1) + ' km';
      const TITLE = { spine: 'A — THE SPINE: one long range along each island, rivers to both coasts', rim: 'B — THE RIM: the range along one coast, the island drains the other way in a few great rivers', horseshoe: 'C — THE HORSESHOE: ranges round a basin with a lake, one great river out through the gap' }[rule];
      legend = [TITLE, `${L.spines.length} ranges · ${st.mouths} rivers reach the sea (${st.reaches} reaches between forks; ${st.brooks} brooks faint) · ${st.great} great rivers named (catchment over 3 km²), ${L.great.filter(g => g.delta).length} deltas · ${st.lakes} lakes · ${st.navRivers} rivers a ship can enter, ${km(st.navigableLen)} of water ${L.NAV}u wide or more · routed in ${st.ms} ms`,
        `${st.sitesTotal} settlements: ${st.quays} within a short walk of navigable water (would gain a quay; white ring on towns, cities, ports) · ${st.bends} with a channel through the pad (the river bends round them; red ring)`];
    }
    // the nations, the frame, the legend
    x.font = 'italic 700 26px Georgia, serif'; x.textAlign = 'center'; x.fillStyle = 'rgba(60,40,20,.6)';
    for (const m of RIVERS_PROTO.masses()) { x.fillText(m.nat, m.cx * SIZE * S, (m.cz * SIZE - 1000) * S); }
    x.strokeStyle = 'rgba(40,28,14,.8)'; x.lineWidth = 2; x.strokeRect(0, 0, base.width, base.height);
    x.fillStyle = '#e8d8a0'; x.textAlign = 'left'; x.font = '600 18px Georgia, serif'; x.fillText(legend[0], 16, base.height + 34); x.font = '14px Georgia, serif'; x.fillStyle = '#c8b880';
    legend.slice(1).forEach((l, i) => x.fillText(l, 16, base.height + 62 + i * 22));
    x.font = '12px Georgia, serif'; x.fillStyle = '#8a9a70'; x.fillText(`${name} · world ${W}u across, ${base.width}px · blue: rivers (light core = a ship can sail it) · brown band: a range, triangles its peaks · Session 430 prototype, nothing in the game changed`, 16, base.height + 62 + legend.length * 22 + 2);
    window._RV_LAST = cv; window._RV_L = L;
    return { png: cv.toDataURL('image/jpeg', .86), stats: L ? L.stats : null, great: L ? L.great.map(g => ({ name: g.name, nat: g.nat, area: Math.round(g.area / 1e6 * 100) / 100, len: Math.round(g.len), wMouth: Math.round(g.wMouth), reaches: g.reaches, delta: !!g.delta })) : null };
  }, [rule, NAMES, name]);
  fs.writeFileSync(path.join(here, name + '.jpg'), Buffer.from(out.png.split(',')[1], 'base64'));
  console.log(name, JSON.stringify(out.stats)); if (out.great) for (const gr of out.great) console.log('   ', JSON.stringify(gr));
  // island close-ups: each landmass's bounding cells, cut from the picture and scaled up
  const isl = await page.evaluate(() => {
    const SIZE = WORLD.SIZE, S = window._RV_BASE.width / (SIZE * WORLD.GRID), src = window._RV_LAST; const panels = [];
    for (const m of RIVERS_PROTO.masses()) { let i0 = 99, j0 = 99, i1 = -1, j1 = -1; for (const [i, j] of m.cells) { i0 = Math.min(i0, i); j0 = Math.min(j0, j); i1 = Math.max(i1, i); j1 = Math.max(j1, j); } i0 -= .5; j0 -= .5; i1 += 1.5; j1 += 1.5;
      const w = (i1 - i0) * SIZE * S, h = (j1 - j0) * SIZE * S; panels.push({ nat: m.nat, sx: i0 * SIZE * S, sy: j0 * SIZE * S, w, h }); }
    const scale = 1.5; const PW = Math.max(...panels.map(p => p.w)) * scale; const PH = panels.reduce((s, p) => s + p.h * scale + 30, 0);
    const cv = document.createElement('canvas'); cv.width = PW + 20; cv.height = PH + 10; const x = cv.getContext('2d'); x.fillStyle = '#2b241a'; x.fillRect(0, 0, cv.width, cv.height); x.imageSmoothingEnabled = true;
    let y = 10; for (const p of panels) { x.drawImage(src, p.sx, p.sy, p.w, p.h, 10, y, p.w * scale, p.h * scale); x.font = 'italic 600 20px Georgia, serif'; x.fillStyle = '#e8d8a0'; x.textAlign = 'left'; x.fillText(p.nat, 14, y + 24); y += p.h * scale + 30; }
    return cv.toDataURL('image/jpeg', .86);
  });
  fs.writeFileSync(path.join(here, name + '-islands.jpg'), Buffer.from(isl.split(',')[1], 'base64'));
}
const todo = [['today', null], ['layout-a', 'spine'], ['layout-b', 'rim'], ['layout-c', 'horseshoe']].filter(([n, r]) => !ONLY || n === ONLY || r === ONLY);
for (const [n, r] of todo) await picture(n, r);
console.log('errors', g.errs); await g.close();
