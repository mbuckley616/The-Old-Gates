// node docs/prototypes/levelup/cloakback-shoot.mjs [--only=name] (Session 2699): a long cloak worn back (D.cloakBack), for the DECISION on
// Michael's 25 Nov note "cloaks as capes over the back?". Each row is one wearer: today's cloak, then worn back over the shoulders (A,
// cloakBack true) and hung behind them (B, 1.69), each from the front and three-quarter with the arms swung as in a walk, and A from behind. Writes cloakback-2699-<name>.jpg and cloakback-2699.jpg (all rows).
// Needs the people's pack: python3 docs/prototypes/levelup/mh_pack.py (generated, not committed).
import { chromium } from 'playwright'; import http from 'http'; import fs from 'fs'; import path from 'path'; import { fileURLToPath } from 'url';
const here = path.dirname(fileURLToPath(import.meta.url));
const types = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json', '.bin': 'application/octet-stream' };
const srv = http.createServer((q, r) => { const f = path.join(here, decodeURIComponent(q.url.split('?')[0])); if (!f.startsWith(here) || !fs.existsSync(f)) { r.writeHead(404); return r.end(); } r.writeHead(200, { 'content-type': types[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(r); });
await new Promise(ok => srv.listen(0, ok)); const port = srv.address().port, launch = { args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] };
if (!fs.existsSync(chromium.executablePath()) && fs.existsSync('/opt/pw-browsers/chromium')) launch.executablePath = '/opt/pw-browsers/chromium';
const browser = await chromium.launch(launch), only = (process.argv.find(a => a.startsWith('--only=')) || '').slice(7), W = 520, H = 760;
const dq = o => encodeURIComponent(JSON.stringify(o));
const ROWS = [
  ['markman', 'people=markman&seed=cb1&sex=m', { cloak: [.32, .3, .26], brooch: [.6, .45, .2], cloakLen: .85, hood: 'down', mantle: null }],
  ['woman', 'people=markman&seed=cb2&sex=f', { cloak: [.36, .2, .16], brooch: [.62, .47, .22], cloakLen: .75, hood: null, mantle: null, apron: [.8, .76, .66], bib: true }],
  ['tartan', 'people=gatelander&seed=cb3&sex=m', { cloak: [.2, .3, .22], tartan: [.1, .14, .12], tartanLine: [.6, .16, .12], brooch: [.62, .47, .22], cloakLen: .7, hood: null, mantle: null }],
  ['fur', 'people=markman&seed=cb4&sex=m', { cloak: [.25, .2, .16], cloakFur: [.5, .42, .32], brooch: [.55, .42, .2], cloakLen: 1, mantle: null }],
];
const shot = async (q, dress, turn, swing) => { const page = await browser.newPage({ viewport: { width: W, height: H } }); const errs = []; page.on('pageerror', e => errs.push(String(e)));
  await page.goto(`http://localhost:${port}/builder.html?w=${W}&h=${H}&still&view=full&turn=${turn}&${q}&dress=${dq(dress)}`); await page.waitForFunction(() => window.__done || window.__err, null, { timeout: 900000 });
  const info = await page.evaluate(async swing => { document.getElementById('note').style.display = 'none'; const B = window.__builder, P = B.person, T = await import('./vendor/three.module.min.js').catch(() => null);
    const out = { cloak: P.cloak ? { through: P.cloak.through, tris: P.cloak.tris } : null, brooches: 0 }; P.root.traverse(o => { if (o.name === 'brooch') out.brooches++; });
    if (swing) { const rot = (b, ax, a) => { const pq = b.parent.getWorldQuaternion(b.quaternion.clone()), r = b.quaternion.clone().setFromAxisAngle(ax, a), q = pq.clone().invert().multiply(r).multiply(pq); b.quaternion.premultiply(q); };
      const X = P.byName['neck01'].up.clone().set(1, 0, 0); P.root.updateMatrixWorld(true);
      for (const [nm, a] of [['upperarm01.L', -swing], ['upperarm01.R', swing * .8], ['lowerarm01.L', -.15]]) { const b = P.byName[nm]; if (b) rot(b, X, a); }
      P.root.updateMatrixWorld(true); }
    window.__render(); return out; }, swing);
  const buf = Buffer.from((await page.evaluate(() => document.querySelector('canvas').toDataURL('image/jpeg', .9))).split(',')[1], 'base64'); await page.close(); if (errs.length) console.log(errs.slice(0, 2)); return { buf, info }; };
const sheets = [];
for (const [name, q, dress] of ROWS) { if (only && !only.split(',').includes(name)) continue; const t0 = Date.now();
  const A = { ...dress, cloakBack: true }, B = { ...dress, cloakBack: 1.69 };
  const cells = [await shot(q, dress, 0, 0), await shot(q, dress, .7, .9), await shot(q, A, 0, 0), await shot(q, A, .7, .9), await shot(q, B, 0, 0), await shot(q, B, .7, .9), await shot(q, A, Math.PI, 0)];
  console.log(name, ((Date.now() - t0) / 1000).toFixed(0) + 's', JSON.stringify(cells.map(c => c.info)));
  sheets.push([name, cells.map(c => c.buf.toString('base64'))]); }
const page = await browser.newPage({ viewport: { width: 800, height: 600 } });
const labels = ['today', 'today, arms swung', 'A over the shoulders', 'A, arms swung', 'B behind the shoulders', 'B, arms swung', 'A or B from behind'];
for (const all of [false, true]) { const rows = all ? sheets : null; const list = all ? [['all', sheets]] : sheets.map(s => [s[0], [s]]);
  for (const [nm, rs] of list) { if (all && rs.length < 2) continue; const url = await page.evaluate(async ({ rs, W, H, labels }) => { const k = .5, w = W * k, h = H * k, c = document.createElement('canvas'); c.width = w * 7; c.height = (h + 22) * rs.length; const x = c.getContext('2d'); x.fillStyle = '#1b1a18'; x.fillRect(0, 0, c.width, c.height);
      for (let r = 0; r < rs.length; r++) for (let i = 0; i < 7; i++) { const im = new Image(); im.src = 'data:image/jpeg;base64,' + rs[r][1][i]; await im.decode(); x.drawImage(im, i * w, r * (h + 22) + 22, w, h); x.fillStyle = '#e8e0d0'; x.font = '13px sans-serif'; x.fillText((i ? '' : rs[r][0] + ' — ') + labels[i], i * w + 8, r * (h + 22) + 16); }
      return c.toDataURL('image/jpeg', .88); }, { rs, W, H, labels });
    fs.writeFileSync(path.join(here, `cloakback-2699${all ? '' : '-' + nm}.jpg`), Buffer.from(url.split(',')[1], 'base64')); } }
await browser.close(); srv.close();
