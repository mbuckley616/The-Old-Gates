// node docs/prototypes/levelup/gatewards-sheet.mjs (Session 2751): the gate's surroundings three ways, on sheets beside P10b's *Gate Light*.
// It runs gatemouth-shoot.mjs's pages (gatemouth.html?view=shot&dusk&wards=…) at 1280x720 into a scratch folder, then lays out:
//   gatewards-abc.jpg    A as built | B the Weavers' outworks | C a people's watch | the panel (the shot list's frame, dusk)
//   gatewards-cond.jpg   B steady | B failing | B catastrophic | C failing (the same frame)
//   gatewards-wide.jpg   A | B | C from off the path by day (view=wide)
// and prints each page's __stats.wards on one line.
import { chromium } from 'playwright'; import { execFileSync } from 'child_process'; import fs from 'fs'; import os from 'os'; import path from 'path'; import { fileURLToPath } from 'url';
const here = path.dirname(fileURLToPath(import.meta.url)), ROOT = path.resolve(here, '../../..'), tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'gw-'));
const jobs = { a: 'view=shot&dusk', b: 'view=shot&dusk&wards=weave', c: 'view=shot&dusk&wards=watch', bf: 'view=shot&dusk&wards=weave&cond=failing', bx: 'view=shot&dusk&wards=weave&cond=catastrophic',
  cf: 'view=shot&dusk&wards=watch&cond=failing', aw: 'view=wide', bw: 'view=wide&wards=weave', cw: 'view=wide&wards=watch' };
const J = path.join(tmp, 'stats.json');
execFileSync('node', [path.join(here, 'gatemouth-shoot.mjs'), ...Object.entries(jobs).map(([k, q]) => `${k}=${q}`)], { env: { ...process.env, OUT: tmp, W: '1280', H: '720', JSON: J }, stdio: 'inherit' });
const st = JSON.parse(fs.readFileSync(J, 'utf8'));
for (const [k, s] of Object.entries(st)) console.log(k, JSON.stringify({ gate: [s.place.gateTris, s.place.gateDraws], wards: [s.place.wards.tris, s.place.wards.draws, s.place.wards.lights], byMat: s.place.wards.byMat }));
const shot = k => 'data:image/jpeg;base64,' + fs.readFileSync(path.join(tmp, k + '.jpg')).toString('base64');
const art = 'data:image/jpeg;base64,' + fs.readFileSync(path.join(ROOT, 'docs', 'art', 'thumbs', 'OG-147.jpg')).toString('base64');
const view = JSON.parse(fs.readFileSync(path.join(ROOT, 'docs', 'art', 'shotlist.json'), 'utf8')).views.find(v => v.id === 'gate-dusk');
const tri = k => `${st[k].place.gateTris + st[k].place.wards.tris} tris, ${st[k].place.gateDraws + st[k].place.wards.draws} draws`;
const sheets = {
  'gatewards-abc': [['a', 'A. As built: the ring in its hill, the camp'], ['b', "B. The Weavers' outworks: pylons, wing walls, stelae"], ['c', "C. A people's watch: curtain, two towers, a stump"], ['panel', 'P10b: ' + view.panel.name]],
  'gatewards-cond': [['b', 'B, steady'], ['bf', 'B, failing: a pylon broken, a wall breached, stelae down'], ['bx', 'B, catastrophic: the head and two stelae hung'], ['cf', 'C, failing (the ruin is the same)']],
  'gatewards-wide': [['aw', 'A. As built, from off the path, 13h'], ['bw', "B. The Weavers' outworks"], ['cw', "C. A people's watch"]] };
const b = await chromium.launch(), p = await b.newPage();
for (const [name, tiles] of Object.entries(sheets)) {
  const data = tiles.map(([k, cap]) => [k === 'panel' ? null : shot(k), k === 'panel' ? cap : `${cap} (${tri(k)})`]);
  const url = await p.evaluate(async ([data, art, box]) => {
    const img = u => new Promise(r => { const i = new Image(); i.onload = () => r(i); i.src = u; }); const W = 640, H = 360, PAD = 8, HEAD = 26, A = await img(art);
    const c = document.createElement('canvas'); c.width = data.length * W + (data.length - 1) * PAD; c.height = H + HEAD; const x = c.getContext('2d'); x.fillStyle = '#1b1712'; x.fillRect(0, 0, c.width, c.height);
    for (let k = 0; k < data.length; k++) { const dx = k * (W + PAD), [u, cap] = data[k];
      if (u) x.drawImage(await img(u), dx, HEAD, W, H); else { const [bx, by, bw, bh] = box, s = Math.max(W / bw, H / bh), dw = bw * s, dh = bh * s; x.save(); x.beginPath(); x.rect(dx, HEAD, W, H); x.clip(); x.drawImage(A, bx, by, bw, bh, dx + (W - dw) / 2, HEAD + (H - dh) / 2, dw, dh); x.restore(); }
      x.fillStyle = '#eee'; x.font = '14px Georgia, serif'; x.fillText(cap, dx + 4, 18); }
    return c.toDataURL('image/jpeg', .86); }, [data, art, view.panel.box]);
  fs.writeFileSync(path.join(here, name + '.jpg'), Buffer.from(url.split(',')[1], 'base64')); console.log('wrote', name + '.jpg'); }
await b.close();
