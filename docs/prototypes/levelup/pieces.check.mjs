// node docs/prototypes/levelup/pieces.check.mjs (Session 818, card F6): the Gatelands house moved from the lane slice into
// pieces.js. 200 houses rolled as the lane rolls them: merged, each is the same triangles and the same bounds as the house
// unmerged, in a few meshes, and the same key builds the same house; and the lane renders as it did before the move (its
// picture against one made from HEAD's street.js, which the check writes beside it and compares in the browser).
// Session 834: the concept run's Gatelands kit folded into pieces.js. Its six plans, built from pieces.js, match the line-up's
// recorded triangles and heights in pieces-gatelands.json, and pieces-gatelands.html renders from the folded kit.
// Session 835, the Gatelands' lots (gatelandsLot, Michael's A on #280): on 40 streets of 30 lots no two neighbours share a
// colour and every colour of the six is used; no door paint drowns in its wall; cottages limewashed under thatch, farmhouses
// white, warehouses bare stone, town lots under slate; a lot builds the same twice, its lit windows included.
// Session 964: the guild hall (Michael's C on #352), its own piece, in two guilds' dress.
import { chromium } from 'playwright'; import http from 'http'; import fs from 'fs'; import path from 'path'; import { fileURLToPath } from 'url';
import { execFileSync } from 'child_process';
const here = path.dirname(fileURLToPath(import.meta.url));
const types = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json', '.bin': 'application/octet-stream' };
const srv = http.createServer((q, r) => { const f = path.join(here, decodeURIComponent(q.url.split('?')[0])); if (!f.startsWith(here) || !fs.existsSync(f)) { r.writeHead(404); return r.end(); } r.writeHead(200, { 'content-type': types[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(r); }).listen(0);
const port = srv.address().port, launch = { args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] };
if (!fs.existsSync(chromium.executablePath()) && fs.existsSync('/opt/pw-browsers/chromium')) launch.executablePath = '/opt/pw-browsers/chromium';
const browser = await chromium.launch(launch); let fails = 0;
const check = (name, ok, info) => { console.log((ok ? 'PASS ' : 'FAIL ') + name + (info !== undefined ? '  ' + JSON.stringify(info) : '')); if (!ok) fails++; };
const page = await browser.newPage({ viewport: { width: 640, height: 360 } }); const errs = []; page.on('pageerror', e => errs.push(String(e)));
await page.goto(`http://localhost:${port}/aurenne.html?still&nopeople&view=houses&w=640&h=360`); await page.waitForFunction(() => window.__done || window.__err, null, { timeout: 600000 });
const r = await page.evaluate(async () => { const THREE = await import('three'), K = await import('./pieces.js'), out = [];
  const hash = g => { let h = 0; g.traverse(m => { if (!m.isMesh) return; const a = m.geometry.attributes.position.array; for (let i = 0; i < a.length; i += 3) h = (h * 31 + Math.round(a[i] * 1e4)) | 0; }); return h; };
  for (let i = 0; i < 200; i++) { const r0 = K.stream('lane:' + i), w = 7.2 + r0() * 2.6, d = 5.4 + r0() * .8, h = r0() < .35 ? 5.4 : 3.5 + r0() * .5;
    const o = { w, d, h, thatch: h < 4.6 ? r0() < .8 : r0() < .3, timber: r0() < .45, wash: i, paint: i * 3 + 1, shutters: r0() < .75, boxes: r0() < .7, pots: r0() < .5, lantern: r0() < .5, chim: r0() < .5 ? 1 : -1 };
    const A = K.gatelandsHouse({ ...o, noMerge: true }, K.stream('house:' + i)), B = K.gatelandsHouse(o, K.stream('house:' + i)), C = K.gatelandsHouse(o, K.stream('house:' + i));
    const bA = new THREE.Box3().setFromObject(A.group), bB = new THREE.Box3().setFromObject(B.group), dB = Math.max(...['x', 'y', 'z'].flatMap(k => [Math.abs(bA.min[k] - bB.min[k]), Math.abs(bA.max[k] - bB.max[k])]));
    out.push({ trisA: A.tris, trisB: B.tris, drawsA: A.draws, drawsB: B.draws, dBox: +dB.toFixed(5), same: hash(B.group) === hash(C.group), flowers: A.flowers.length === B.flowers.length, thatch: o.thatch });
    for (const x of [A, B, C]) x.group.traverse(m => m.geometry && m.geometry.dispose()); }
  return out; });
const st = f => [Math.min(...r.map(f)), Math.max(...r.map(f)), Math.round(r.reduce((a, x) => a + f(x), 0) / r.length)];
check('merged, every house of 200 is the same triangles as unmerged', r.every(x => x.trisA === x.trisB), r.filter(x => x.trisA !== x.trisB).slice(0, 2));
check('and the same bounds, within a tenth of a millimetre', r.every(x => x.dBox < 1e-4), Math.max(...r.map(x => x.dBox)));
check(`meshes a house: ${st(x => x.drawsA).join(' to ').replace(/ to (\d+)$/, ' (mean $1)')} unmerged, ${st(x => x.drawsB).join(' to ').replace(/ to (\d+)$/, ' (mean $1)')} merged; triangles ${st(x => x.trisB).map(v => v.toLocaleString()).join(' to ').replace(/ to ([\d,]+)$/, ' (mean $1)')}`, r.every(x => x.drawsB <= 12 && x.drawsB < x.drawsA));
check('the same key builds the same house, and its flowers are the same', r.every(x => x.same && x.flowers));
check('no page errors', errs.length === 0, errs.slice(0, 3));
{ const rec = JSON.parse(fs.readFileSync(path.join(here, 'pieces-gatelands.json'), 'utf8')).line.plans;
  const got = await page.evaluate(async () => { const K = await import('./pieces.js'), P = K.GL_PLANS, out = {};
    const row = [P.cottage({ paint: 'red' }), { ...P.cottage({ hip: true, paint: 'blue' }), name: 'Cottage, hipped' }, P.farmhouse({}), P.townhouse({ color: 'ochre' }), P.merchant({ color: 'cream' }), P.warehouse({})];
    for (const pl of row) { const g = K.gatelandsBuilding(pl), u = g.userData; out[u.name] = { tris: u.tris, calls: u.calls, ...u.size }; g.traverse(m => m.geometry && m.geometry.dispose()); } return out; });
  // draw calls are left out: a lit window is rolled from common.js's shared rnd(), so whether a plan has the 'lit' mesh depends on the rolls before it
  const strip = v => v && JSON.stringify({ ...v, calls: undefined }), bad = Object.keys(rec).filter(k => strip(rec[k]) !== strip(got[k]));
  check(`the Gatelands kit, folded into pieces.js: all ${Object.keys(rec).length} plans build as the line-up recorded them, triangles and sizes (${Object.entries(got).map(([k, v]) => k.split(' ')[0] + ' ' + v.tris.toLocaleString()).join(', ')})`, bad.length === 0 && Object.keys(got).length === Object.keys(rec).length, bad.map(k => [k, rec[k], got[k]])); }
{ const L = await page.evaluate(async () => { const THREE = await import('three'), K = await import('./pieces.js'), out = { same: 0, n: 0, streets: [], kinds: {} };
    const hash = g => { let h = 0; g.traverse(m => { if (!m.isMesh) return; h = (h * 31 + m.name.length + m.geometry.attributes.position.count) | 0; const a = m.geometry.attributes.position.array; for (let i = 0; i < a.length; i += 5) h = (h * 31 + Math.round(a[i] * 1e4)) | 0; }); return h; };
    for (let s = 0; s < 40; s++) { const row = []; for (let i = 0; i < 30; i++) { const l = K.gatelandsLot('gl' + s, i); row.push([l.colour, l.paint, l.kind]); } out.streets.push(row); }
    for (const kind of ['townhouse', 'merchant', 'warehouse', 'farmhouse', 'cottage']) for (let i = 0; i < 6; i++) { const a = K.gatelandsLot('k' + i, i, { kind }), b = K.gatelandsLot('k' + i, i, { kind }), ga = K.gatelandsBuilding(a.plan), gb = K.gatelandsBuilding(b.plan);
      out.n++; if (hash(ga) === hash(gb) && ga.userData.calls === gb.userData.calls) out.same++;
      const keys = []; ga.traverse(m => m.isMesh && keys.push(m.name || m.material.name || '')); (out.kinds[kind] ||= []).push({ colour: a.colour, fin: a.plan.fin.key, roof: a.plan.roof.kind, tris: ga.userData.tris });
      for (const g of [ga, gb]) g.traverse(m => m.geometry && m.geometry.dispose()); }
    return out; });
  const rep = L.streets.reduce((a, row) => a + row.filter((c, i) => i && c[0] === row[i - 1][0]).length, 0), used = new Set(L.streets.flat().map(c => c[0])), clash = { blue: ['blue', 'teal'], oxblood: ['red'], rose: ['red'], sage: ['green', 'teal'], ochre: ['yellow'], cream: ['yellow'] };
  const bad = L.streets.flat().filter(([c, p]) => (clash[c] || []).includes(p)).length, merch = L.streets.flat().filter(c => c[2] === 'merchant').length;
  check(`coloured towns: on 40 streets of 30 lots no two neighbours share a colour (${rep} do), all six colours used (${[...used].join(', ')}), one lot in ${(1200 / merch).toFixed(1)} a merchant's house`, rep === 0 && used.size === 6 && merch > 200 && merch < 400);
  check(`no door paint drowns in its wall: ${bad} of 1,200 clash`, bad === 0);
  const K2 = L.kinds, all = (k, f) => K2[k].every(f);
  check(`by kind: town lots rendered in colour under slate, cottages limewashed under thatch, farmhouses white under slate, warehouses bare stone`, all('townhouse', h => h.fin !== 'w:lime' && h.roof === 'slate') && all('merchant', h => h.fin !== 'w:lime' && h.roof === 'slate') && all('cottage', h => h.fin === 'w:lime' && h.roof === 'thatch') && all('farmhouse', h => h.fin === 'w:lime' && h.roof === 'slate') && all('warehouse', h => h.fin === 'rubble'), Object.fromEntries(Object.entries(K2).map(([k, v]) => [k, v[0]])));
  check(`a lot builds the same twice, its lit windows included: ${L.same} of ${L.n}`, L.same === L.n); }
// Session 964, the guild hall (Michael's C on #352): a piece of its own, the Fighters' and the Mages' dress; each builds the same twice
// and in budget, at its sizes; on every face the openings stand clear of each other (dressings included), of the corners' quoins and of the
// eaves; the great door is a door of note; and the openings keep to the floors the room will have (the gallery at the first floor at the
// back, the east end's two storeys): no opening of the hall's back crosses the gallery's floor, and the east end's upper sashes sit above it.
{ const G = await page.evaluate(async () => { const K = await import('./pieces.js'), out = [];
    const hash = g => { let h = 0; g.traverse(m => { if (!m.isMesh) return; h = (h * 31 + m.geometry.attributes.position.count) | 0; const a = m.geometry.attributes.position.array; for (let i = 0; i < a.length; i += 7) h = (h * 31 + Math.round(a[i] * 1e4)) | 0; }); return h; };
    for (const guild of ['fighters', 'mages']) { const mk = () => Object.assign(K.GL_PLANS.guildhall({ guild }), { r: K.stream('guildhall:' + guild) }), P = mk(), a = K.gatelandsBuilding(P), b = K.gatelandsBuilding(mk()), u = a.userData, h = P.floors[0] + P.floors[1], F1 = P.floors[0];
      const ring = op => op.arch || op.dress ? .34 : .2, span = op => [op.x - op.w / 2 - ring(op), op.x + op.w / 2 + ring(op), op.y, op.y + op.h + (op.arch ? .34 : .3)], clash = [], out2 = [], gallery = [], upper = [];
      for (const [f, os] of Object.entries(P.open)) { const half = (f === 'front' || f === 'back' ? P.w : P.d) / 2 - .55;
        os.forEach((o, i) => { const [l, r, b, t] = span(o); if (o.x - o.w / 2 < -half || o.x + o.w / 2 > half || o.y + o.h > h - .25) out2.push([f, i]);
          os.forEach((q, j) => { if (j <= i) return; const [l2, r2, b2, t2] = span(q); if (Math.min(r, r2) - Math.max(l, l2) > .02 && Math.min(t, t2) - Math.max(b, b2) > .02) clash.push([f, i, j]); });
          const x = f === 'back' ? -o.x : f === 'front' ? o.x : null; if (f === 'back' && x < P.hallX && o.y < F1 + .3 && o.y + o.h > F1 - .3) gallery.push([f, i]);
          if ((f === 'front' || f === 'back') && x >= P.hallX && o.y > 1 && o.y < F1 + .2) upper.push([f, i]); }); }
      const door = P.open.front.find(o => o.kind === 'plank');
      out.push({ guild, tris: u.tris, calls: u.calls, size: u.size, same: hash(a) === hash(b), clash, out: out2, gallery, upper, door: [door.w, door.h], plaque: P.plaque.y - (door.y + door.h + .34), text: P.plaque.text, banner: P.banner.colour,
        /* seen from the street at any bearing within 55° of square on, the banner (a flat cloth out from the wall) clears the name panel's frame */
        hides: (() => { const B = P.banner, Q = P.plaque, z0 = B.out - .1 - B.w, z1 = B.out - .1, l = Q.x - Q.w / 2 - .2, r = Q.x + Q.w / 2 + .2; let worst = 99;
          for (let a = -55; a <= 55; a += 1) { const t = Math.tan(a * Math.PI / 180), xs = [B.x - z0 * t, B.x - z1 * t], gap = Math.max(l - Math.max(...xs), Math.min(...xs) - r); worst = Math.min(worst, gap); } return +worst.toFixed(2); })() });
      for (const g of [a, b]) g.traverse(m => m.geometry && m.geometry.dispose()); }
    return out; });
  check(`the guild hall, a piece of its own (#352 C): ${G.map(g => `${g.guild} ${g.tris.toLocaleString()} triangles in ${g.calls} draws`).join(', ')}; ${G[0].size.w} by ${G[0].size.d} m, eaves ${G[0].size.eave} m, ridge ${G[0].size.ridge} m; each the same twice`, G.every(g => g.same && g.tris < 15000 && g.calls <= 16 && g.size.w === 14.4 && g.size.d === 9 && g.size.eave === 6.4));
  check(`the guild hall's openings: ${G[0].clash.length} clashes on a face, dressings included; ${G[0].out.length} into the quoins or the eaves`, G.every(g => !g.clash.length && !g.out.length), G.map(g => [g.clash, g.out]));
  check(`the guild hall keeps the room's floors: ${G[0].gallery.length} openings of the hall's back across the gallery's floor, ${G[0].upper.length} east-end sashes between the floors`, G.every(g => !g.gallery.length && !g.upper.length), G.map(g => [g.gallery, g.upper]));
  check(`the guild hall's great door ${G[0].door.join(' by ')} m under its name panel (${G[0].text}, ${G[1].text}), clear of the arch's ring by ${G[0].plaque.toFixed(2)} m; the banners ${G.map(g => g.banner).join(' and ')}, clear of the panel by ${Math.min(...G.map(g => g.hides))} m seen from within 55° of square on (the critic's s639: it hid the D)`, G.every(g => g.door[0] >= 1.5 && g.door[1] >= 3 && g.plaque >= 0 && g.hides > 0) && G[0].banner !== G[1].banner && G[0].text !== G[1].text); }
await page.close();
for (const v of ['street', 'street&mix=lot', 'line', 'kit', 'guild', 'guild&guild=mages']) { const pg = await browser.newPage({ viewport: { width: 480, height: 270 } }), e2 = []; pg.on('pageerror', e => e2.push(String(e)));
  await pg.goto(`http://localhost:${port}/pieces-gatelands.html?still&w=480&h=270&view=${v}`);
  // a page error ends the wait at once (an error in the scene's module never sets __err)
  await Promise.race([pg.waitForFunction(() => window.__done || window.__err, null, { timeout: 600000 }), new Promise(res => pg.on('pageerror', e => { if (!/json|JSON/.test(String(e))) res(); }))]);
  const n = await pg.evaluate(() => Object.keys(window.__stats?.plans || {}).length); check(`pieces-gatelands.html?view=${v} renders from the folded kit: ${n} plans or pieces, no page errors but the people's missing pack`, n > 0 && e2.every(e => /json|JSON/.test(e)), e2.slice(0, 2)); await pg.close(); }
// the lane before and after the move: HEAD's street.js shot beside the working one
const head = execFileSync('git', ['show', 'HEAD:docs/prototypes/levelup/street.js'], { cwd: here }).toString(), now = fs.readFileSync(path.join(here, 'street.js'), 'utf8');
if (head === now) console.log('SKIP the lane comparison: street.js is HEAD\'s'); else {
  const shot = name => execFileSync('node', [path.join(here, 'shoot.mjs'), '--page=street.html', '--name=' + name]).toString();
  try { fs.writeFileSync(path.join(here, 'street.js'), head); shot('_lane-before'); } finally { fs.writeFileSync(path.join(here, 'street.js'), now); } shot('_lane-after');
  const p = await browser.newPage(), u = f => 'data:image/jpeg;base64,' + fs.readFileSync(path.join(here, f)).toString('base64');
  const d = await p.evaluate(async ([A, B]) => { const px = s => new Promise(r => { const i = new Image(); i.onload = () => { const c = document.createElement('canvas'); c.width = i.width; c.height = i.height; const x = c.getContext('2d'); x.drawImage(i, 0, 0); r(x.getImageData(0, 0, i.width, i.height).data); }; i.src = s; });
    const [a, b] = await Promise.all([px(A), px(B)]); let big = 0, s = 0; for (let i = 0; i < a.length; i += 4) { const e = Math.max(Math.abs(a[i] - b[i]), Math.abs(a[i + 1] - b[i + 1]), Math.abs(a[i + 2] - b[i + 2])); s += e; if (e > 24) big++; } return { over24: big, px: a.length / 4, mean: +(s / (a.length / 4)).toFixed(4) }; }, [u('_lane-before.jpg'), u('_lane-after.jpg')]);
  check(`the lane renders as before the move: ${d.over24} of ${d.px.toLocaleString()} pixels differ by more than 24 (mean difference ${d.mean})`, d.over24 < d.px * 1e-4, d);
  for (const f of ['_lane-before.jpg', '_lane-after.jpg']) fs.rmSync(path.join(here, f)); await p.close(); }
await browser.close(); srv.close(); console.log(fails ? `${fails} FAILED` : 'all passed'); process.exit(fails ? 1 : 0);
