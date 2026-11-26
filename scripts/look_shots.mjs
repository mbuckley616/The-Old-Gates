// The look's shots (Session 2675): the eight views of docs/art/shotlist.json rendered at the High quality level, each laid beside
// the P10b panel (OG-147) it answers, so a session judges the whole frame against the art and not one object against one image.
//
//   node scripts/look_shots.mjs                          all eight, this checkout, into docs/look/<today>/
//   node scripts/look_shots.mjs --views=storm,town-night  some of them
//   node scripts/look_shots.mjs --before=origin/main     also render that commit: before | after | the art
//   node scripts/look_shots.mjs --out=docs/look/s2661    where the sheets go (one JPEG a view and contact.jpg, all eight in one)
//   node scripts/look_shots.mjs --quality=1              another level (0 low, 1 middle, 2 high, the default)
//
// Not a suite: it asserts nothing, never runs in CI, and a slow machine only makes it slower (a view on software GL takes a minute
// or more). The pictures are the world's frame alone: no hands, no HUD. CLAUDE.md, "Judging the look", says when to run it.
import { boot, ROOT } from '../tests/lib/game.mjs';
import { chromium } from 'playwright';
import { execSync } from 'child_process';
import fs from 'fs'; import path from 'path';

const arg = (k, d) => { const a = process.argv.find(s => s.startsWith('--' + k + '=')); return a ? a.slice(k.length + 3) : d; };
const LIST = JSON.parse(fs.readFileSync(path.join(ROOT, 'docs', 'art', 'shotlist.json'), 'utf8')).views;
const only = arg('views', '') ? arg('views').split(',') : null;
const views = LIST.filter(v => !only || only.includes(v.id));
if (!views.length) { console.log('no such view; the list:', LIST.map(v => v.id).join(', ')); process.exit(1); }
const quality = +arg('quality', 2), before = arg('before', '');
const out = path.resolve(ROOT, arg('out', path.join('docs', 'look', new Date().toISOString().slice(0, 10))));
fs.mkdirSync(out, { recursive: true });

// a commit's game, unpacked beside the tests' scratch (gitignored), as people.test.mjs does
function unpack(ref) {
  const dir = path.join(ROOT, 'tests', 'tmp', 'look-before-' + ref.replace(/[^\w.-]+/g, '_'));
  fs.rmSync(dir, { recursive: true, force: true }); fs.mkdirSync(dir, { recursive: true });
  const tar = path.join(dir, 'src.tar');
  execSync(`git archive --format=tar -o "${tar}" ${ref} index.html js vendor`, { cwd: ROOT });
  execSync('tar -xf src.tar', { cwd: dir }); fs.rmSync(tar);
  return path.join(dir, 'index.html');
}

// one build: every view, each a JPEG data URL of the world's frame
async function render(src, label) {
  const g = await boot(src ? { src } : {}); const { page } = g;
  page.on('pageerror', e => console.log(`  ${label}: pageerror ${e.message.slice(0, 200)}`));
  await g.intoWorld();
  await page.evaluate(q => { SETTINGS.quality = q; SETTINGS.qualityProbed = true; try { qualityApply(); } catch (e) {} }, quality);
  const shots = {};
  for (const v of views) {
    const t0 = Date.now();
    // where the camera stands: the anchor found in the world, the camera put there, and the cells round it built
    const at = await page.evaluate(v => {
      const A = v.anchor; let ax, az, face = null;
      if (A.site) { const t = WORLD.siteAnywhere(A.site); if (!t) return { err: 'no site ' + A.site }; ax = t.x; az = t.z; }
      else if (A.peak) { let p = PEAKS.find(p => p.name === A.peak); for (let j = 0; !p && j < GRID; j++) for (let i = 0; !p && i < GRID; i++) { const c = getCell(i, j); p = c && (c.peaks || []).find(q => q.name === A.peak); } if (!p) return { err: 'no peak ' + A.peak }; ax = p.x; az = p.z; }
      else if (A.coast) { const t = WORLD.siteAnywhere(A.coast); const d = { w: [-1, 0], e: [1, 0], n: [0, -1], s: [0, 1] }[A.dir || 'w'];
        ax = t.x; az = t.z; for (let k = 0; k < 2000 && worldH(ax, az) > WORLD.SEA_Y; k++) { ax += d[0] * 5; az += d[1] * 5; } }
      else if (A.gate) { [ax, az] = A.at || [px, pz]; } // Session 2697: from a fixed point, not where the last view left px
      const C = v.cam, L = v.look; return { ax, az, cx: ax + C.dx, cz: az + C.dz, lx: ax + L.dx, lz: az + L.dz }; }, v);
    if (at.err) { console.log(`  ${label}: ${v.id}: ${at.err}`); continue; }
    await page.evaluate(([x, z]) => { px = x; pz = z; }, [at.cx, at.cz]);
    await g.cells();
    if (v.anchor.gate) {
      // Session 2697 (the critic, 26 Nov): the gate is found from its fixed point (A.at) and named (a seed, or 'nearest' to that point), then
      // the camera's own cells are loaded and their jobs run, so the gate's near level is built; it used to be moved to after the cells
      const r = await page.evaluate(([v, at]) => {
        for (let k = 0; k < 900 && (JOBS.length || [...LOADED.values()].some(L => L.pending)); k++) { tickCells(1); const t0 = performance.now(); while (JOBS.length && performance.now() - t0 < 1500) runJobs(); }
        let G = null; const A = v.anchor;
        if (typeof A.gate === 'number') G = RING_GATES.get(A.gate) || null;
        else { let bd = 1e9; for (const Q of RING_GATES.values()) { const d = Math.hypot(Q.ox - at.ax, Q.oz - at.az); if (d < bd) { bd = d; G = Q; } } }
        if (!G) return { err: 'no ring gate ' + A.gate + ' loaded near ' + at.ax + ', ' + at.az };
        const fx = Math.sin(G.ry), fz = Math.cos(G.ry), f = v.cam.front || 30;
        px = G.ox + fx * f; pz = G.oz + fz * f; return { seed: G.seed, ax: G.ox, az: G.oz, cx: px, cz: pz, lx: G.ox, lz: G.oz }; }, [v, at]);
      if (r.err) { console.log(`  ${label}: ${v.id}: ${r.err}`); continue; }
      console.log(`  ${label}: ${v.id}: gate ${r.seed}`); Object.assign(at, r);
      await g.cells();
    }
    const url = await page.evaluate(([v, at]) => {
      // every job the cells queued, so the statics and the near grass stand (as the camps' shot did)
      for (let k = 0; k < 900 && (JOBS.length || [...LOADED.values()].some(L => L.pending)); k++) { tickCells(1); const t0 = performance.now(); while (JOBS.length && performance.now() - t0 < 1500) runJobs(); }
      forceTime(v.hour);
      const w = v.weather || 'clear'; try { devWeather(w); } catch (e) {} const wx = WORLD.wx; wx.type = w; wx.next = w; wx.k = 1; if (w === 'storm' || w === 'blizzard') wx.heavy = 1;
      // over the sea, "up" is over the water and not the sea floor (Session 2689: the harbour's camera stood in the surface)
      const gy = (x, z) => Math.max(worldH(x, z), WORLD.SEA_Y);
      const cy = gy(at.cx, at.cz) + v.cam.up, ly = gy(at.lx, at.lz) + v.look.up;
      for (let i = 0; i < 90; i++) { CAM.position.set(at.cx, cy, at.cz); CAM.lookAt(at.lx, ly, at.lz); CAM.updateMatrixWorld(true); WORLD.tick(1 / 60, performance.now()); }
      CAM.position.set(at.cx, cy, at.cz); CAM.lookAt(at.lx, ly, at.lz); CAM.updateMatrixWorld(true);
      try { applyDayNightLighting(performance.now() / 1000); } catch (e) {}
      WORLD.tick(1 / 60, performance.now()); CAM.position.set(at.cx, cy, at.cz); CAM.lookAt(at.lx, ly, at.lz); CAM.updateMatrixWorld(true);
      REN.render(scene, CAM);
      return { url: REN.domElement.toDataURL('image/jpeg', .9), where: [Math.round(at.cx), Math.round(at.cz), Math.round(cy)], calls: REN.info.render.calls, tris: REN.info.render.triangles };
    }, [v, at]);
    if (url.err) { console.log(`  ${label}: ${v.id}: ${url.err}`); continue; }
    shots[v.id] = url.url;
    console.log(`  ${label}: ${v.id} at ${url.where.join(', ')}: ${url.calls} draws, ${(url.tris / 1e6).toFixed(2)} M triangles, ${Math.round((Date.now() - t0) / 1000)} s`);
  }
  await g.close();
  return shots;
}

const rows = [];
if (before) rows.push({ label: before, shots: await render(unpack(before), 'before ' + before) });
rows.push({ label: before ? 'this build' : 'the game', shots: await render(null, 'after') });

// the sheets: [before |] the game | the panel, one a view, and all of them in contact.jpg
const art = 'data:image/jpeg;base64,' + fs.readFileSync(path.join(ROOT, 'docs', 'art', 'thumbs', 'OG-147.jpg')).toString('base64');
const b = await chromium.launch(); const p = await b.newPage();
const sheets = await p.evaluate(async ([views, rows, art, quality]) => {
  const img = u => new Promise(r => { const i = new Image(); i.onload = () => r(i); i.onerror = () => r(null); i.src = u; });
  const A = await img(art), W = 640, H = 360, PAD = 8, HEAD = 26, out = {};
  const tile = (x, i, dx, dy, cap) => { if (i) x.drawImage(i, dx, dy + HEAD, W, H); else { x.fillStyle = '#333'; x.fillRect(dx, dy + HEAD, W, H); }
    x.fillStyle = '#eee'; x.font = '15px Georgia, serif'; x.fillText(cap, dx + 4, dy + 18); };
  for (const v of views) {
    const n = rows.length + 1, c = document.createElement('canvas'); c.width = n * W + (n - 1) * PAD; c.height = H + HEAD; const x = c.getContext('2d');
    x.fillStyle = '#1b1712'; x.fillRect(0, 0, c.width, c.height);
    for (let k = 0; k < rows.length; k++) tile(x, rows[k].shots[v.id] ? await img(rows[k].shots[v.id]) : null, k * (W + PAD), 0, `${v.title} — ${rows[k].label}${k === rows.length - 1 ? ' (quality ' + quality + ')' : ''}`);
    // the panel, scaled to fill the tile's height (it is a crop of a 480 px thumbnail: its colour and composition, not its detail)
    const [bx, by, bw, bh] = v.panel.box, s = Math.max(W / bw, H / bh), dw = bw * s, dh = bh * s, dx = rows.length * (W + PAD);
    x.save(); x.beginPath(); x.rect(dx, HEAD, W, H); x.clip(); x.drawImage(A, bx, by, bw, bh, dx + (W - dw) / 2, HEAD + (H - dh) / 2, dw, dh); x.restore();
    x.fillStyle = '#eee'; x.font = '15px Georgia, serif'; x.fillText('P10b: ' + v.panel.name, dx + 4, 18);
    out[v.id] = c.toDataURL('image/jpeg', .85);
  }
  // the contact sheet: every view's sheet stacked, at half size
  const ims = []; for (const v of views) ims.push(await img(out[v.id]));
  const cw = ims[0].width / 2, ch = ims[0].height / 2, c = document.createElement('canvas'); c.width = cw; c.height = ims.length * ch; const x = c.getContext('2d');
  ims.forEach((i, k) => x.drawImage(i, 0, k * ch, cw, ch)); out.contact = c.toDataURL('image/jpeg', .85);
  return out; }, [views, rows, art, quality]);
await b.close();
for (const [k, u] of Object.entries(sheets)) fs.writeFileSync(path.join(out, k + '.jpg'), Buffer.from(u.split(',')[1], 'base64'));
console.log(`sheets in ${path.relative(ROOT, out)}: ${Object.keys(sheets).join(', ')}`);
process.exit(0);
