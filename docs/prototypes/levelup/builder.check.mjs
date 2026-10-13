// node docs/prototypes/levelup/builder.check.mjs [--shots] (Session 804): the human builder's promises, in the test Chromium.
// A rolled genome saves and loads back to the same genome and the same body; the same genome builds the same hair; every
// hair style builds, with no strand under the skin and none lying on the face, and its braids and tails clear of the
// clothes; the page's controls change the person and save what they show. --shots writes builder-*.jpg.
// Needs the people's pack: python3 docs/prototypes/levelup/mh_pack.py (generated, not committed).
import { chromium } from 'playwright'; import http from 'http'; import fs from 'fs'; import path from 'path'; import { fileURLToPath } from 'url';
const here = path.dirname(fileURLToPath(import.meta.url));
const types = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json', '.bin': 'application/octet-stream' };
const srv = http.createServer((q, r) => { const f = path.join(here, decodeURIComponent(q.url.split('?')[0])); if (!f.startsWith(here) || !fs.existsSync(f)) { r.writeHead(404); return r.end(); } r.writeHead(200, { 'content-type': types[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(r); }).listen(0);
const port = srv.address().port, launch = { args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] };
if (!fs.existsSync(chromium.executablePath()) && fs.existsSync('/opt/pw-browsers/chromium')) launch.executablePath = '/opt/pw-browsers/chromium';
if (!fs.existsSync(path.join(here, 'mh/pack.bin'))) { console.log('no pack: run python3 docs/prototypes/levelup/mh_pack.py first'); process.exit(2); }
const browser = await chromium.launch(launch); let fails = 0;
const check = (name, ok, info) => { console.log((ok ? 'PASS ' : 'FAIL ') + name + (info !== undefined ? '  ' + JSON.stringify(info) : '')); if (!ok) fails++; };
{ const page = await browser.newPage({ viewport: { width: 1280, height: 720 } }); const errs = []; page.on('pageerror', e => errs.push(String(e)));
  await page.goto(`http://localhost:${port}/builder.html?seed=check&w=1280&h=720`); await page.waitForFunction(() => window.__done || window.__err, null, { timeout: 300000 });
  const r = await page.evaluate(async () => { const K = await import('./people.js'), out = { roll: [], styles: {} };
    const hash = m => { let h = 0; const a = m.geometry.attributes.position.array; for (let i = 0; i < a.length; i += 7) h = (h * 31 + Math.round(a[i] * 1e5)) | 0; return h; };
    const meshHash = p => p.meshes.map(m => m.name + ':' + hash(m)).join(' ');
    for (const seed of ['a1', 'b2', 'c3', 'mill:4', 'quay:9']) { const G = K.rollGenome(seed), s1 = JSON.stringify(K.toSaved(G)), G2 = K.fromSaved(JSON.parse(s1)), s2 = JSON.stringify(K.toSaved(G2));
      const p1 = K.makePerson(G), p2 = K.makePerson(G2), p3 = K.makePerson(K.fromSaved(JSON.parse(s1)));
      out.roll.push({ seed, bytes: s1.length, same: s1 === s2, again: JSON.stringify(K.toSaved(K.rollGenome(seed))) === s1, body: meshHash(p2) === meshHash(p3), close: hash(p1.meshes[0]) === hash(p2.meshes[0]), style: G.hair.style }); }
    const G = K.rollGenome('styles', { g: 0 });
    for (const style of K.HAIR_STYLES) for (const mantle of [true, false]) { const g = { ...G, hair: { style, len: .8 }, dress: { ...G.dress, mantle: mantle ? G.dress.mantle || [.4, .3, .2] : null } }, t0 = performance.now(), p = K.makePerson(g);
      let tris = 0; for (const m of p.meshes) tris += m.geometry.index ? m.geometry.index.count / 3 : 0; out.styles[style + (mantle ? '+mantle' : '')] = { ...p.hair, tris, ms: Math.round(performance.now() - t0) }; }
    out.cloaks = {}; for (const [name, sex, dress] of [['woman, cloak and hood down, apron with bib', 0, { cloak: [.32, .38, .24], hood: 'down', apron: [.8, .76, .66], bib: true, mantle: null }], ['man, short cloak, hood up', 1, { cloak: [.45, .16, .12], hood: 'up', cloakLen: .3 }],
        ['man, fur-collared long cloak over the mantle', 1, { cloak: [.25, .2, .16], cloakFur: [.5, .42, .32], cloakLen: 1 }], ['woman, leather apron', 0, { apron: [.36, .25, .16], apronLeather: true, bib: true }]]) {
      const G0 = K.rollGenome('cloak:' + sex, { g: sex }), g = { ...G0, dress: { ...G0.dress, ...dress } }, p = K.makePerson(g), s1 = JSON.stringify(K.toSaved(g)), back = JSON.stringify(K.toSaved(K.fromSaved(JSON.parse(s1))));
      out.cloaks[name] = { ...(p.cloak || {}), meshes: p.root.children.length, saved: s1 === back, bytes: s1.length, hasApron: !!p.meshes.find(m => m.name === 'apron'), hasHood: !!p.meshes.find(m => m.name === 'hoodUp') || !!p.root.getObjectByName('hood'), wantsHood: !!dress.hood }; }
    // the four peoples: twelve of each, measured standing (crown to sole)
    out.peoples = {}; for (const k of Object.keys(K.PEOPLES)) { const hs = { m: [], f: [] }; let rangeOK = true, bytes = 0;
      for (let i = 0; i < 12; i++) { const g = K.rollGenome(`${k}:${i}`, { people: k, g: i % 2 }), sx = g.g > .5 ? 'm' : 'f', st = K.statureOf(g), [a, b] = K.PEOPLES[k].body[sx].metres; hs[sx].push(st); if (st < a - .02 || st > b + .02) rangeOK = false;
        bytes = Math.max(bytes, JSON.stringify(K.toSaved(g)).length); if (JSON.stringify(K.toSaved(K.fromSaved(K.toSaved(g)))) !== JSON.stringify(K.toSaved(g))) rangeOK = false; }
      const mean = a => +(a.reduce((x, y) => x + y, 0) / a.length).toFixed(3); out.peoples[k] = { men: mean(hs.m), women: mean(hs.f), rangeOK, bytes }; }
    return out; });
  for (const x of r.roll) { check(`genome ${x.seed} (${x.style}) saves and loads back to itself (${x.bytes} bytes)`, x.same && x.bytes < 1000, x);
    check(`genome ${x.seed}: the same seed rolls the same genome`, x.again); check(`genome ${x.seed}: a loaded genome builds the same body and hair, twice`, x.body); }
  for (const [k, s] of Object.entries(r.styles)) { console.log(k, JSON.stringify(s));
    check(`${k}: builds (${s.strands} strands, ${s.tris} triangles, ${s.ms} ms)`, s.strands > 500 && s.tris > 10000);
    check(`${k}: no strand under the skin (${s.inside} of ${s.points} points)`, s.inside <= s.points * .002, s.inside);
    check(`${k}: no strand on the face (${s.onFace} points)`, s.onFace <= s.points * .002, s.onFace);
    if (s.gather && k.split('+')[0] !== 'bun') check(`${k}: the braid or tail clears the body by its clothes (${(s.drapeMin * 100).toFixed(1)} cm)`, s.drapeMin > .015, s.drapeMin); }
  for (const [k, c] of Object.entries(r.cloaks)) { console.log(k, JSON.stringify(c));
    check(`${k}: saves and loads back with its dress (${c.bytes} bytes)`, c.saved && c.bytes < 1100);
    if (c.columns) { check(`${k}: the cloak hangs clear of the body (closest ${(c.minClear * 100).toFixed(1)} cm, ${c.rows} rows of ${c.columns})`, c.minClear > .005 && c.under === 0, c);
      check(`${k}: the brooch pins it at the throat (${(c.brooch * 100).toFixed(0)} cm from the neck)`, c.brooch < .2, c.brooch); }
    if (c.wantsHood) check(`${k}: the hood is there`, c.hasHood); if (k.includes('apron')) check(`${k}: the apron is there`, c.hasApron); }
  { const P = r.peoples; for (const [k, p] of Object.entries(P)) check(`${k}: twelve rolled stand inside the people's heights (men ${p.men} m, women ${p.women} m) and save back (${p.bytes} bytes)`, p.rangeOK && p.bytes < 1100, p);
    check(`the peoples stand in the canon's order: the Old Blood shortest, the Markmen tallest`, P.oldblood.men < P.gatelander.men && P.gatelander.men < P.markman.men && P.aurennais.men < P.markman.men && P.oldblood.women < P.gatelander.women && P.gatelander.women < P.markman.women);
    const all = Object.values(P).flatMap(p => [p.men, p.women]); check(`the heroic hybrid: the four peoples average about 1.75 m (${(all.reduce((a, b) => a + b) / all.length).toFixed(2)} m)`, Math.abs(all.reduce((a, b) => a + b) / all.length - 1.75) < .06); }
  // the page: a slider changes the person, the genome text follows, and loading a saved genome brings it back
  const ui = await page.evaluate(async () => { const B = window.__builder, before = JSON.stringify(B.genome), sliders = document.querySelectorAll('#panel input[type=range]');
    const h = sliders[4]; h.value = '0.95'; h.dispatchEvent(new Event('input')); await new Promise(r => setTimeout(r, 400)); await new Promise(r => { const t = setInterval(() => { if (JSON.stringify(B.genome) !== before) { clearInterval(t); r(); } }, 100); setTimeout(() => { clearInterval(t); r(); }, 20000); });
    const after = B.genome, shown = JSON.parse(B.text.value); B.load(before); await new Promise(r => setTimeout(r, 100));
    return { sliders: sliders.length, height: after.sliders.height, textMatches: JSON.stringify(shown) === JSON.stringify(after), back: JSON.stringify(B.genome) === before, bytes: before.length }; });
  check(`the page: ${ui.sliders} sliders; moving height sets it (${ui.height}) and the genome text follows`, ui.sliders > 20 && ui.height === .95 && ui.textMatches, ui);
  check('the page: loading the saved genome brings the person back', ui.back);
  check('no page errors', errs.length === 0, errs.slice(0, 3)); await page.close(); }
if (process.argv.includes('--shots')) {
  const shot = async (name, q, w = 1920, h = 1080, panel = false) => { const page = await browser.newPage({ viewport: { width: w, height: h } }); const errs = []; page.on('pageerror', e => errs.push(String(e)));
    const t0 = Date.now(); await page.goto(`http://localhost:${port}/builder.html?w=${w}&h=${h}&${panel ? '' : 'still&'}${q}`); await page.waitForFunction(() => window.__done || window.__err, null, { timeout: 900000 });
    await page.evaluate(() => document.getElementById('note').style.display = 'none'); if (panel) await page.waitForTimeout(1500);
    const buf = panel ? await page.screenshot({ type: 'jpeg', quality: 88 }) : Buffer.from((await page.evaluate(() => document.querySelector('canvas').toDataURL('image/jpeg', .9))).split(',')[1], 'base64');
    fs.writeFileSync(path.join(here, 'builder-' + name + '.jpg'), buf); console.log('shot', name, ((Date.now() - t0) / 1000).toFixed(0) + 's', errs.slice(0, 3)); await page.close(); };
  await shot('page', 'seed=a1&sex=f&view=full', 1600, 900, true);
  await shot('peoples', 'peoples', 2400, 900);
  await shot('styles-back', 'seed=styles&sex=f&sheet&ang=2.4&dist=1.5&y=-.2&nomantle');
  await shot('styles-front', 'seed=styles&sex=f&sheet&ang=.35&dist=1.5&y=-.1');
  await shot('styles-mantle', 'seed=styles&sex=f&sheet&ang=2.4&dist=1.5&y=-.2');
  const dq = d => encodeURIComponent(JSON.stringify(d));
  await shot('cloak-front', 'seed=styles&sex=f&view=full&turn=.35&dress=' + dq({ cloak: [.32, .38, .24], brooch: [.6, .45, .2], hood: 'down', cloakLen: .75, mantle: null, apron: [.8, .76, .66], bib: true }));
  await shot('cloak-back', 'seed=styles&sex=f&view=full&turn=2.6&dress=' + dq({ cloak: [.32, .38, .24], brooch: [.6, .45, .2], hood: 'down', cloakLen: .75, mantle: null, apron: [.8, .76, .66], bib: true }));
  await shot('cloak-hood', 'seed=b7&sex=m&view=head&turn=.5&dress=' + dq({ cloak: [.45, .16, .12], hood: 'up', cloakLen: .5, mantle: null }));
  await shot('cloak-markman', 'seed=b7&sex=m&view=full&turn=2.3&dress=' + dq({ cloak: [.25, .2, .16], cloakFur: [.5, .42, .32], brooch: [.35, .35, .36], cloakLen: 1 }));
  await shot('apron-leather', 'seed=b7&sex=m&view=full&turn=.3&dress=' + dq({ apron: [.36, .25, .16], apronLeather: true, bib: true, mantle: null }));
  for (const [n, q] of [['woman-braid', 'seed=styles&sex=f&style=braid&view=head&turn=-2.3'], ['woman-braids', 'seed=styles&sex=f&style=braids&view=head&turn=2.6'], ['woman-face', 'seed=styles&sex=f&style=bun&view=face'], ['man-face', 'seed=b7&sex=m&view=face']]) await shot(n, q);
}
await browser.close(); srv.close(); console.log(fails ? `${fails} FAILED` : 'all passed'); process.exit(fails ? 1 : 0);
