// node docs/prototypes/levelup/backpack.check.mjs [--shots] (Session 2217, L8; Michael's B on #1504): the pack on the back, by island.
// For each kind (the Gatelands' creel, the Mark's frame, Aurenne's saddle-roll) on six bodies (a man and a woman of the island's people,
// each bare, in a cloak, and with long hair): no point of the person or what they wear inside it, none of the arms either, its straps
// over both shoulders with nothing through them, carried by the chest bone. --shots writes backpack-<kind>.jpg (the back and the side).
// Needs the people's pack (mh/pack.bin): python3 docs/prototypes/levelup/mh_pack.py, or unpacked from vendor/mh-pack.js.
import { chromium } from 'playwright'; import http from 'http'; import fs from 'fs'; import path from 'path'; import { fileURLToPath } from 'url';
const here = path.dirname(fileURLToPath(import.meta.url));
const types = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json', '.bin': 'application/octet-stream' };
const srv = http.createServer((q, r) => { const f = path.join(here, decodeURIComponent(q.url.split('?')[0])); if (!f.startsWith(here) || !fs.existsSync(f)) { r.writeHead(404); return r.end(); } r.writeHead(200, { 'content-type': types[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(r); }).listen(0);
const port = srv.address().port, launch = { args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] };
if (!fs.existsSync(chromium.executablePath()) && fs.existsSync('/opt/pw-browsers/chromium')) launch.executablePath = '/opt/pw-browsers/chromium';
if (!fs.existsSync(path.join(here, 'mh/pack.bin'))) { console.log('no pack: run python3 docs/prototypes/levelup/mh_pack.py first'); process.exit(2); }
const browser = await chromium.launch(launch); let fails = 0;
const check = (name, ok, info) => { console.log((ok ? 'PASS ' : 'FAIL ') + name + (info !== undefined ? '  ' + JSON.stringify(info) : '')); if (!ok) fails++; };
const page = await browser.newPage({ viewport: { width: 800, height: 600 } }); const errs = []; page.on('pageerror', e => errs.push(String(e)));
await page.goto(`http://localhost:${port}/builder.html?seed=check&w=800&h=600&still`); await page.waitForFunction(() => window.__done || window.__err, null, { timeout: 300000 });
const KINDS = { creel: ['gatelander', [.92, .74, .48]], frame: ['markman', [.42, .3, .2]], roll: ['aurennais', [.55, .16, .1]] };
const r = await page.evaluate(async KINDS => { const K = await import('./people.js'), out = {};
  for (const [kind, [people, col]] of Object.entries(KINDS)) { out[kind] = [];
    for (const [g, what] of [[1, 'bare'], [0, 'bare'], [1, 'cloak'], [0, 'cloak'], [1, 'hair'], [0, 'hair']]) {
      const G0 = K.rollGenome(`pack:${kind}:${g}:${what}`, { people, g }), D = { ...G0.dress, backpack: col, backpackKind: kind, belt: G0.dress.belt || [.3, .2, .13] };
      if (what === 'cloak') Object.assign(D, { cloak: [.32, .3, .24], cloakLen: .85, hood: 'down' }); else D.cloak = null;
      const G = { ...G0, dress: D, ...(what === 'hair' ? { hair: { style: 'loose', len: .9 } } : {}) }, t0 = performance.now(), P = K.makePerson(G), b = P.root.getObjectByName('backpack');
      let straps = 0, on = []; P.root.traverse(m => { if (m.name === 'packStrap') { straps++; on.push(m.parent && m.parent.name); } });
      out[kind].push({ g, what, ms: Math.round(performance.now() - t0), on: b && b.parent && b.parent.name, straps, strapOn: on, st: P.backpack, saved: JSON.stringify(K.toSaved(G)) }); } }
  // a person with no pack has none
  const P = K.makePerson(K.rollGenome('pack:none')); out.none = !P.root.getObjectByName('backpack') && !P.backpack; return out; }, KINDS);
for (const kind of Object.keys(KINDS)) for (const x of r[kind]) { const s = x.st || {}, S = s.strap || {};
  check(`${kind} on a ${x.g ? 'man' : 'woman'} (${x.what}): carried by the chest, 0 points inside, the arms clear, two straps with nothing through them`,
    /^spine0[34]$/.test(x.on) && x.straps === 2 && x.strapOn.every(n => /^spine0[34]$/.test(n)) && s.inside === 0 && s.armInside === 0 && s.near < .03 && S.worst <= 0 && S.tested > 150 && S.len > 1.4 && s.tris < 12000,
    { ...s, ms: x.ms }); }
check('a person with no pack carries none', r.none);
check('no page errors', !errs.length, errs.slice(0, 3));
if (process.argv.includes('--shots')) {
  const b64 = s => Buffer.from(s).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  for (const kind of Object.keys(KINDS)) { const shots = [];
    for (const [x, view, turn] of [[r[kind][0], 'back', .5], [r[kind][0], 'side', 0], [r[kind][3], 'back', -.45]]) { const p = await browser.newPage({ viewport: { width: 640, height: 900 } });
      await p.goto(`http://localhost:${port}/builder.html?still&w=640&h=900&view=${view}&turn=${turn}&g=${b64(x.saved)}`); await p.waitForFunction(() => window.__done || window.__err, null, { timeout: 300000 });
      shots.push(await p.evaluate(() => document.querySelector('canvas').toDataURL('image/png'))); await p.close(); }
    const p = await browser.newPage({ viewport: { width: 1920, height: 900 } }); await p.setContent(`<body style="margin:0;background:#000;display:flex">${shots.map(u => `<img src="${u}" width=640 height=900>`).join('')}</body>`);
    await p.screenshot({ path: path.join(here, `backpack-${kind}.jpg`), type: 'jpeg', quality: 88 }); await p.close(); console.log('wrote backpack-' + kind + '.jpg'); } }
await browser.close(); srv.close(); console.log(fails ? `${fails} FAILED` : 'all passed'); process.exit(fails ? 1 : 0);
