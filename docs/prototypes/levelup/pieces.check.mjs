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
// Session 1179: a town's market three ways (the market house, the shelter, the stalls alone), asked of Michael.
// Session 1063: the plans by bays (Michael's C on #396). Every plan on every count of bays it takes is that many bays wide and its ends;
// its openings stand inside the face clear of the corners and of one another; every window above the ground floor stands on a bay's
// line, and every bay has one on every upper floor; the door is in a bay; it builds in budget, the same twice; glBaysFor fits a lot of
// 6 to 10 m with the most whole bays; a lot given bays builds that plan, and a lot without them is as it was.
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
{ const Bq = await page.evaluate(async () => { const K = await import('./pieces.js'), out = [];
    const hash = g => { let h = 0; g.traverse(m => { if (!m.isMesh) return; const a = m.geometry.attributes.position.array; for (let i = 0; i < a.length; i += 7) h = (h * 31 + Math.round(a[i] * 1e4)) | 0; }); return h; };
    for (const kind of ['cottage', 'farmhouse', 'townhouse', 'merchant']) { const B = K.GL_BAYS[kind]; for (let n = B.min; n <= B.max; n++) { const P = K.glBayPlan(kind, n, {}), h = P.floors.reduce((a, f) => a + f, 0), up = [], clash = [], outside = [];
      for (const f of ['front', 'back']) { const L = P.open[f] || []; L.forEach((o, i) => { if (Math.abs(o.x) + o.w / 2 > P.w / 2 - P.t - .12 || o.y + o.h > h - .1) outside.push([f, i]);
        for (let j = 0; j < i; j++) { const q = L[j]; if (Math.abs(o.x - q.x) < (o.w + q.w) / 2 + .15 && o.y < q.y + q.h && q.y < o.y + o.h) clash.push([f, j, i]); }
        if (f === 'front' && o.kind === 'win' && o.y > P.floors[0] - .2) up.push(o); }); }
      const lines = P.floors.slice(1).map((_, k) => { const y0 = P.floors.slice(0, k + 1).reduce((a, f) => a + f, 0), row = up.filter(o => o.y > y0 - .2 && o.y < y0 + P.floors[k + 1]); return { n: row.length, on: row.every(o => P.bayX.some(x => Math.abs(x - o.x) < 1e-6)) }; });
      const door = P.open.front.find(o => o.kind !== 'win' && o.kind !== 'shopwin'), mk = () => Object.assign(K.glBayPlan(kind, n, {}), { r: K.stream(`bays:${kind}:${n}`) }), g = K.gatelandsBuilding(mk()), g2 = K.gatelandsBuilding(mk());
      out.push({ kind, n, w: P.w, want: +(n * B.bay + 2 * B.end).toFixed(3), outside, clash, lines, door: Math.min(...P.bayX.map(x => Math.abs(x - door.x))), tris: g.userData.tris, calls: g.userData.calls, same: hash(g) === hash(g2) });
      for (const x of [g, g2]) x.traverse(m => m.geometry && m.geometry.dispose()); } }
    const fit = []; for (const kind of ['cottage', 'farmhouse', 'townhouse', 'merchant']) for (let L = 6; L <= 10.001; L += .25) { const n = K.glBaysFor(kind, L), B = K.GL_BAYS[kind], w = K.glBayWidth(kind, n); fit.push({ kind, L, n, ok: (w <= L + 1e-6 || n === B.min) && (n === B.max || K.glBayWidth(kind, n + 1) > L + 1e-6) }); }
    const lot = K.gatelandsLot('bays', 3, { kind: 'townhouse', bays: 4, d: 8 }), lot0 = K.gatelandsLot('bays', 3, { kind: 'townhouse' });
    return { out, fit: fit.filter(f => !f.ok), fitN: fit.length, lot: [lot.plan.w, lot.plan.d, lot.plan.bays], lot0: [lot0.plan.w, lot0.plan.d, lot0.plan.bays ?? null] }; });
  const O = Bq.out;
  check(`the plans by bays (#396 C): ${O.length} plans, ${O.map(x => `${x.kind} ${x.n} bays ${x.w} m`).join(', ')}: each its bays and its ends`, O.every(x => Math.abs(x.w - x.want) < 1e-6), O.filter(x => Math.abs(x.w - x.want) >= 1e-6));
  check(`their openings inside their faces, clear of the corners (${O.reduce((a, x) => a + x.outside.length, 0)} not) and of one another by 0.15 m (${O.reduce((a, x) => a + x.clash.length, 0)} clashes)`, O.every(x => !x.outside.length && !x.clash.length), O.filter(x => x.outside.length || x.clash.length).map(x => [x.kind, x.n, x.outside, x.clash]));
  check(`every window above the ground floor on a bay's line, one a bay on every upper floor; the door within ${Math.max(...O.map(x => x.door)).toFixed(2)} m of a bay's line`, O.every(x => x.lines.every((l, k) => l.on && l.n === x.n) && x.door <= .4), O.filter(x => !x.lines.every(l => l.on && l.n === x.n) || x.door > .4).map(x => [x.kind, x.n, x.lines, x.door]));
  check(`in budget and the same twice: ${Math.min(...O.map(x => x.tris)).toLocaleString()} to ${Math.max(...O.map(x => x.tris)).toLocaleString()} triangles, ${Math.max(...O.map(x => x.calls))} draws or fewer`, O.every(x => x.same && x.tris < 9000 && x.calls <= 16), O.map(x => [x.kind, x.n, x.tris, x.calls, x.same]));
  check(`glBaysFor: a lot of 6 to 10 m takes the most whole bays that fit (${Bq.fitN} widths, ${Bq.fit.length} wrong); a townhouse lot given 4 bays and 8 m is ${Bq.lot.join(' by ').replace(/ by 4$/, '')} m, one without them ${Bq.lot0[0]} by ${Bq.lot0[1]} m as drawn`, !Bq.fit.length && Bq.lot[0] === 8.4 && Bq.lot[1] === 8 && Bq.lot[2] === 4 && Bq.lot0[0] === 6.4 && Bq.lot0[2] === null, [Bq.fit.slice(0, 4), Bq.lot, Bq.lot0]); }
// Session 1087: the town church (gatelandsChurch), three ways of hanging its bell (o.tower round | square | bellcote, asked of Michael):
// each the same twice and in budget; the chancel lower than the nave, the door a door of note (1.4 m or more by 3.1), and in the
// round tower the door 3 m or more up and the tower over 24 m with its cap; in the west tower the door moved into its foot.
{ const C = await page.evaluate(async () => { const THREE = await import('three'), K = await import('./pieces.js'), out = [];
    const hash = g => { let h = 0; g.traverse(m => { if (!m.isMesh) return; h = (h * 31 + m.geometry.attributes.position.count) | 0; const a = m.geometry.attributes.position.array; for (let i = 0; i < a.length; i += 7) h = (h * 31 + Math.round(a[i] * 1e4)) | 0; }); return h; };
    for (const tower of ['round', 'square', 'bellcote']) { const a = K.gatelandsChurch({ tower }), b = K.gatelandsChurch({ tower }), u = a.userData, nave = a.children[0].userData.plan, T = a.children[2];
      const door = tower === 'square' ? T.userData.plan.open.left[0] : nave.open.left[0], tb = T ? new THREE.Box3().setFromObject(T) : null;
      out.push({ tower, tris: u.tris, calls: u.calls, size: u.size, same: hash(a) === hash(b), door: [door.w, door.h, door.kind], doorAt: u.door ? [+u.door.x.toFixed(2), +u.door.z.toFixed(2)] : null, top: tb ? +tb.max.y.toFixed(2) : null, parts: u.parts.map(p => p.name) }); }
    return out; });
  const by = Object.fromEntries(C.map(c => [c.tower, c]));
  check(`the town church three ways, each the same twice and in budget: ${C.map(c => `${c.tower} ${c.tris.toLocaleString()} triangles in ${c.calls} draws`).join(', ')}`, C.length === 3 && C.every(c => c.same && c.tris < 20000 && c.calls <= 28), C);
  check(`the chancel (${by.round.size.chancel.w} by ${by.round.size.chancel.d} m, ridge ${by.round.size.chancel.ridge} m) is lower than the nave (${by.round.size.nave.w} by ${by.round.size.nave.d} m, ridge ${by.round.size.nave.ridge} m)`, C.every(c => c.size.chancel.ridge < c.size.nave.ridge - 1.5 && c.size.chancel.d < c.size.nave.d), C.map(c => c.size));
  check(`the west door is a door of note: ${C.map(c => `${c.tower} ${c.door[0]} by ${c.door[1]} m`).join(', ')}`, C.every(c => c.door[2] === 'plank' && c.door[0] >= 1.4 && c.door[1] >= 3.1 && c.doorAt && c.doorAt[0] < -8), C.map(c => [c.door, c.doorAt]));
  check(`the round tower stands ${by.round.top} m to its cap, the west tower ${by.square.top} m to its merlons, the bellcote ${by.bellcote.top} m`, by.round.top > 29 && by.square.top > 18 && by.square.top < by.round.top && by.bellcote.top < 14.5, C.map(c => [c.tower, c.top, c.parts]));
}
// Session 1088: a town's coaching inn (gatelandsCoachInn), three ways (o.kind three | two | house, asked of Michael): each the same twice and
// in budget; the front door a door of note; and where there is a yard, a coach goes through: rays along the gateway's middle and 0.8 m
// either side of it, at 1.5 and 3.0 m, meet nothing from the street until the stables' front across the yard.
{ const I = await page.evaluate(async () => { const THREE = await import('three'), K = await import('./pieces.js'), out = [];
    const hash = g => { let h = 0; g.traverse(m => { if (!m.isMesh) return; h = (h * 31 + m.geometry.attributes.position.count) | 0; const a = m.geometry.attributes.position.array; for (let i = 0; i < a.length; i += 7) h = (h * 31 + Math.round(a[i] * 1e4)) | 0; }); return h; };
    for (const kind of ['three', 'two', 'house']) { const a = K.gatelandsCoachInn({ kind }), b = K.gatelandsCoachInn({ kind }), u = a.userData; a.updateMatrixWorld(true);
      const plan = a.children[0].userData.plan, door = plan.open.front.find(o => /fan|shopdoor|plank/.test(o.kind)), rays = [];
      if (u.size.gate) { const meshes = []; a.traverse(m => { if (m.isMesh) meshes.push(m); }); const rc = new THREE.Raycaster(), z0 = u.size.inn.d / 2 + 2;
        for (const dx of [-.8, 0, .8]) for (const y of [1.5, 3.0]) { rc.set(new THREE.Vector3(u.size.gate.x + dx, y, z0), new THREE.Vector3(0, 0, -1)); rc.far = 40; const hit = rc.intersectObjects(meshes, false)[0];
          rays.push({ dx, y, z: hit ? +(z0 - hit.distance).toFixed(2) : null, part: hit ? hit.object.parent.userData.name : null }); } }
      out.push({ kind, tris: u.tris, calls: u.calls, same: hash(a) === hash(b), size: u.size, door: [door.kind, door.w, door.h], rays, parts: u.parts.map(p => p.name) }); }
    return out; });
  const by = Object.fromEntries(I.map(c => [c.kind, c]));
  check(`the coaching inn three ways, each the same twice and in budget: ${I.map(c => `${c.kind} ${c.tris.toLocaleString()} triangles in ${c.calls} draws`).join(', ')}`, I.length === 3 && I.every(c => c.same && c.tris < 14000 && c.calls <= 30), I.map(c => [c.kind, c.tris, c.calls, c.same]));
  check(`its front door is a door of note: ${I.map(c => `${c.kind} ${c.door[0]} ${c.door[1]} by ${c.door[2]} m`).join(', ')}`, I.every(c => c.door[1] >= 1.1 && c.door[2] >= 2.6), I.map(c => c.door));
  const yards = I.filter(c => c.rays.length), clear = yards.every(c => c.rays.every(r => r.part === 'Stable range' && Math.abs(r.z - c.size.yard.z1) < .7));
  check(`a coach goes through the gateway (${by.three.size.gate.w} by ${by.three.size.gate.h} m) to the stables' front across the yard: ${yards.map(c => `${c.kind}: 6 rays meet ${[...new Set(c.rays.map(r => r.part))].join(', ')} at z ${Math.min(...c.rays.map(r => r.z))} to ${Math.max(...c.rays.map(r => r.z))}`).join('; ')}`, yards.length === 2 && clear, yards.map(c => c.rays));
  check(`sizes: three storeys ${by.three.size.inn.w} by ${by.three.size.inn.d} m to a ridge of ${by.three.size.inn.ridge} m, two storeys ${by.two.size.inn.w} by ${by.two.size.inn.d} m (${by.two.size.inn.ridge} m), the merchant's house ${by.house.size.w} by ${by.house.size.d} m`, by.three.size.inn.ridge > by.two.size.inn.ridge && by.two.size.inn.w > by.three.size.inn.w && !by.house.size.yard, I.map(c => c.size));
}
// Session 1093: a town's keep (gatelandsKeep), three ways (o.kind tower | bawn | hall, asked of Michael): each the same twice and in budget;
// the tower's door a door of note with the machicolation over it; the roof inside the walk, under the parapet's merlons and the gables'
// apexes; which of the three fits the game's keep lot (14 by 11 m) as it is; and in the bawn, rays through the gateway reach the yard.
{ const K = await page.evaluate(async () => { const THREE = await import('three'), K = await import('./pieces.js'), out = [];
    const hash = g => { let h = 0; g.traverse(m => { if (!m.isMesh) return; h = (h * 31 + m.geometry.attributes.position.count) | 0; const a = m.geometry.attributes.position.array; for (let i = 0; i < a.length; i += 7) h = (h * 31 + Math.round(a[i] * 1e4)) | 0; }); return h; };
    for (const kind of ['tower', 'bawn', 'hall']) { const a = K.gatelandsKeep({ kind }), b = K.gatelandsKeep({ kind }), u = a.userData; a.updateMatrixWorld(true);
      const T = a.children[0], box = new THREE.Box3().setFromObject(a), tb = new THREE.Box3().setFromObject(T), slate = T.children.find(m => m.material === K.glMats().slate), rb = new THREE.Box3().setFromObject(slate);
      const dress = T.children.filter(m => m.material === K.glMats().dress).map(m => new THREE.Box3().setFromObject(m)), dmax = Math.max(...dress.map(x => x.max.y));
      const rays = []; if (u.size.gate) { const meshes = []; a.traverse(m => { if (m.isMesh) meshes.push(m); }); const rc = new THREE.Raycaster(), z0 = u.size.gate.z + 2;
        for (const dx of [-.6, 0, .6]) for (const y of [1.5, 3.0]) { rc.set(new THREE.Vector3(u.size.gate.x + dx, y, z0), new THREE.Vector3(0, 0, -1)); rc.far = 60; const hit = rc.intersectObjects(meshes, false)[0]; rays.push({ dx, y, z: hit ? +(z0 - hit.distance).toFixed(2) : null, part: hit ? hit.object.parent.userData.name : null }); } }
      out.push({ kind, tris: u.tris, calls: u.calls, same: hash(a) === hash(b), size: u.size, door: [u.towerDoor.kind, u.towerDoor.w, u.towerDoor.h], doorAt: [+u.door.x.toFixed(2), +u.door.z.toFixed(2)],
        foot: [+(box.max.x - box.min.x).toFixed(2), +(box.max.z - box.min.z).toFixed(2)], top: +tb.max.y.toFixed(2), roof: [+rb.min.y.toFixed(2), +rb.max.y.toFixed(2), +rb.min.z.toFixed(2), +rb.max.z.toFixed(2)], merlons: +dmax.toFixed(2), rays, parts: u.parts.map(p => p.name) }); }
    return out; });
  const by = Object.fromEntries(K.map(c => [c.kind, c])), w = by.tower.size.walk;
  check(`the keep three ways, each the same twice and in budget: ${K.map(c => `${c.kind} ${c.tris.toLocaleString()} triangles in ${c.calls} draws`).join(', ')}`, K.length === 3 && K.every(c => c.same && c.tris < 24000 && c.calls <= 34), K.map(c => [c.kind, c.tris, c.calls, c.same, c.parts]));
  check(`the tower's door is a door of note: ${by.tower.door[0]} ${by.tower.door[1]} by ${by.tower.door[2]} m, on the front`, K.every(c => c.door[0] === 'plank' && c.door[1] >= 1.2 && c.door[2] >= 2.6) && by.tower.doorAt[1] > 4.25, K.map(c => [c.door, c.doorAt]));
  check(`the roof lies inside the walk (${by.tower.roof[2]} to ${by.tower.roof[3]} m across, ${by.tower.roof[0]} to ${by.tower.roof[1]} m up; walk ${w} m), under the gables' coping and the stacks (${by.tower.merlons} m), the tower ${by.tower.top} m to its pots`,
    K.every(c => c.roof[0] > w && c.roof[3] < c.size.tower.d / 2 - .5 && c.roof[1] < c.merlons - .5 && c.top > 19 && c.top < 22), K.map(c => [c.roof, c.merlons, c.top]));
  const fits = K.map(c => [c.kind, c.foot[0] <= 14 && c.foot[1] <= 11]);
  check(`on the game's keep lot of 14 by 11 m: the tower ${by.tower.foot[0]} by ${by.tower.foot[1]} m fits as it is; the bawn ${by.bawn.foot[0]} by ${by.bawn.foot[1]} m and the hall ${by.hall.foot[0]} by ${by.hall.foot[1]} m need it widened`, fits[0][1] && !fits[1][1] && !fits[2][1], K.map(c => [c.kind, c.foot]));
  const yard = by.bawn.rays, inner = by.bawn.size.gate.z - by.bawn.size.bawn.t - 1;
  check(`through the bawn's gateway (${by.bawn.size.gate.w} by ${by.bawn.size.gate.h} m) six rays reach the yard: they meet ${[...new Set(yard.map(r => r.part))].join(', ')} at z ${Math.min(...yard.map(r => r.z))} to ${Math.max(...yard.map(r => r.z))}`, yard.length === 6 && yard.every(r => r.z !== null && r.z < inner), yard);
}
// Session 1179: a town's market (gatelandsMarket), three ways (o.kind house | shelter | stalls, asked of Michael): each the same twice
// and in budget; the arches stand clear of the quoins with their voussoirs, and one walks under them (2.05 m or more 0.3 m in from each
// jamb); rays through every arch of the front at the eye pass the front wall into the arcade; under the house's beams 2.6 m or more; its
// stair 18 even risers of 0.2 m or less to a landing at the upper door's sill, the door on the landing; the scales' pans at a hand's height.
{ const M = await page.evaluate(async () => { const THREE = await import('three'), K = await import('./pieces.js'), out = [];
    const hash = g => { let h = 0; g.traverse(m => { if (!m.isMesh) return; h = (h * 31 + m.geometry.attributes.position.count) | 0; const a = m.geometry.attributes.position.array; for (let i = 0; i < a.length; i += 7) h = (h * 31 + Math.round(a[i] * 1e4)) | 0; }); return h; };
    for (const kind of ['house', 'shelter', 'stalls']) { const a = K.gatelandsMarket({ kind }), b = K.gatelandsMarket({ kind }), u = a.userData; a.updateMatrixWorld(true);
      const meshes = []; a.traverse(m => { if (m.isMesh) meshes.push(m); }); const rc = new THREE.Raycaster(), rays = [];
      if (kind !== 'stalls') for (const q of u.arcade.front) for (const dx of [-.4, 0, .4]) { const z0 = u.size.d / 2 + 2; rc.set(new THREE.Vector3(q.x + dx, 1.65, z0), new THREE.Vector3(0, 0, -1)); rc.far = 40; const hit = rc.intersectObjects(meshes, false)[0]; rays.push({ x: q.x + dx, z: hit ? +(z0 - hit.distance).toFixed(2) : null }); }
      const P = u.arcade.plan, half = { front: P.w / 2, left: P.d / 2 - P.t }, quoin = .55, ring = .32;
      const edges = kind === 'stalls' ? [] : [...u.arcade.front.map(q => ({ f: 'front', out: Math.abs(q.x) + q.w / 2 + ring, lim: half.front - quoin })), ...u.arcade.end.map(q => ({ f: 'end', out: Math.abs(q.x) + q.w / 2 + ring, lim: half.left + P.t - quoin }))];
      const walk = kind === 'stalls' ? [] : [...u.arcade.front, ...u.arcade.end].map(q => { const r = q.w / 2, sp = q.h - r; return +(sp + Math.sqrt(r * r - (r - .3) ** 2)).toFixed(2); });
      out.push({ kind, tris: u.tris, calls: u.calls, same: hash(a) === hash(b), size: u.size, rays, edges, walk, stair: u.stair, beam: u.beam, doorOpen: kind === 'house' ? P.open.right.find(o => o.kind === 'plank') : null, floors: P.floors, parts: u.parts.map(p => p.name) }); }
    return out; });
  const by = Object.fromEntries(M.map(c => [c.kind, c])), H = by.house, S = H.stair;
  check(`the market three ways, each the same twice and in budget: ${M.map(c => `${c.kind} ${c.tris.toLocaleString()} triangles in ${c.calls} draws`).join(', ')}`, M.length === 3 && M.every(c => c.same && c.tris < 16000 && c.calls <= 24), M.map(c => [c.kind, c.tris, c.calls, c.same, c.parts]));
  const E = M.flatMap(c => c.edges.map(e => ({ k: c.kind, ...e })));
  check(`every arch's voussoirs clear of the quoins: the nearest ${Math.min(...E.map(e => +(e.lim - e.out).toFixed(2)))} m off`, E.length === 14 && E.every(e => e.out <= e.lim), E);
  const Wk = M.flatMap(c => c.walk);
  check(`one walks under every arch: ${Math.min(...Wk)} m or more 0.3 m in from its jambs`, Wk.length === 14 && Wk.every(v => v >= 2.05), M.map(c => [c.kind, c.walk]));
  const R = M.flatMap(c => c.rays.map(r => ({ k: c.kind, ...r })));
  check(`${R.length} rays at the eye through the front's arches pass the front wall: the nearest meets something ${Math.min(...R.filter(r => r.z !== null).map(r => +(by[r.k].size.d / 2 - r.z).toFixed(2)))} m inside its face`, R.length === 27 && R.every(r => r.z === null || r.z < by[r.k].size.d / 2 - .7), R);
  check(`under the house's beams ${H.size.clear} m; the room above ${H.floors[1]} m floor to floor`, H.size.clear >= 2.6 && H.floors[1] >= 2.6, H.size);
  check(`the house's stair: ${S.risers} risers of ${S.rise} m on treads of ${S.tread} m, ${S.width} m wide, to a landing at ${S.landing.y} m, the upper door's sill at ${H.doorOpen.y} m, the door on the landing`,
    S.risers === 18 && S.rise <= .2 && Math.abs(S.risers * S.rise - H.floors[0]) < 1e-6 && S.landing.y === H.doorOpen.y && S.door.z - H.doorOpen.w / 2 >= S.landing.z0 && S.door.z + H.doorOpen.w / 2 <= S.landing.z1 && S.width >= 1.0, { S, door: H.doorOpen });
  check(`the scales' pans at ${H.beam.pans} m, the beam at ${H.beam.y} m, in all three`, M.every(c => c.beam.pans >= .9 && c.beam.pans <= 1.3 && c.beam.y < c.beam.top), M.map(c => c.beam));
}
await page.close();
for (const v of ['street', 'street&mix=lot', 'line', 'kit', 'guild', 'guild&guild=mages', 'bays', 'church', 'church&tower=all', 'coachinn', 'coachinn&inn=all', 'keep', 'keep&keep=all', 'market', 'market&market=all']) { const pg = await browser.newPage({ viewport: { width: 480, height: 270 } }), e2 = []; pg.on('pageerror', e => e2.push(String(e)));
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
