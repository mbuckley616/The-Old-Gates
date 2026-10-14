// node docs/prototypes/levelup/creatures.check.mjs [--shots] [--plans=a,b] [--q=gait=soar --tag=soar] [--sheet=NAME] (Session 772): builds every plan in creatures.js
// in the test Chromium and checks the kit's promises: each plan builds with no code of its own, its skin weights sum to
// one, every foot reaches its target through a whole stride of every gait, a gait's feet are down for its duty, and the
// genome is small. --shots also writes the line-up and one picture per plan (flesh and bones) as creatures-*.jpg.
import { chromium } from 'playwright'; import http from 'http'; import fs from 'fs'; import path from 'path'; import { fileURLToPath } from 'url';
const here = path.dirname(fileURLToPath(import.meta.url)), arg = k => (process.argv.find(a => a.startsWith('--' + k + '=')) || '').split('=').slice(1).join('=');
const types = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json' };
const srv = http.createServer((q, r) => { const f = path.join(here, decodeURIComponent(q.url.split('?')[0])); if (!f.startsWith(here) || !fs.existsSync(f)) { r.writeHead(404); return r.end(); } r.writeHead(200, { 'content-type': types[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(r); }).listen(0);
const port = srv.address().port, launch = { args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] };
if (!fs.existsSync(chromium.executablePath()) && fs.existsSync('/opt/pw-browsers/chromium')) launch.executablePath = '/opt/pw-browsers/chromium';
const browser = await chromium.launch(launch); let fails = 0;
const check = (name, ok, info) => { console.log((ok ? 'PASS ' : 'FAIL ') + name + (info !== undefined ? '  ' + JSON.stringify(info) : '')); if (!ok) fails++; };
{ const page = await browser.newPage({ viewport: { width: 640, height: 360 } }); const errs = []; page.on('pageerror', e => errs.push(String(e)));
  await page.goto(`http://localhost:${port}/creatures.html?view=one&still&w=640&h=360`); await page.waitForFunction(() => window.__done || window.__err, null, { timeout: 300000 });
  const only = arg('plans');
  const r = await page.evaluate(async only => { const K = await import('./creatures.js'), out = {};
    for (const plan of Object.keys(K.PLANS)) { if (only && !only.split(',').includes(plan)) continue;
      const g = K.genome(plan, plan + ':check'), C = K.build(g), sw = C.meshes[0].geometry.attributes.skinWeight; let wErr = 0;
      for (let v = 0; v < sw.count; v++) wErr = Math.max(wErr, Math.abs(sw.getX(v) + sw.getY(v) + sw.getZ(v) + sw.getW(v) - 1));
      const gaits = {}; for (const gait of C.plan.gaits) { C.gait = gait; let worst = 0, down = 0, n = 0; const G = K.GAITS[gait];
        for (let i = 0; i < 48; i++) { worst = Math.max(worst, K.pose(C, i / 48)); C.rig.updateMatrixWorld(true);
          for (const L of C.B.legs) { const p = new C.rig.position.constructor(); L.bones[L.bones.length - 1].getWorldPosition(p); C.rig.worldToLocal(p); n++; if (p.y < .02 * L.hR) down++; } }
        gaits[gait] = { footErr: +worst.toFixed(4), down: n ? +(down / n).toFixed(2) : 1, duty: G.duty, speed: +K.speedOf(C).toFixed(2) }; }
      out[plan] = { bones: C.stats.bones, tris: C.stats.tris, legs: C.B.legs.length, ms: C.stats.ms, wErr: +wErr.toFixed(5), genomeBytes: JSON.stringify(g).length, gaits }; }
    return out; }, only);
  for (const [plan, s] of Object.entries(r)) { console.log(plan, JSON.stringify(s));
    check(`${plan}: builds from its parts (${s.bones} bones, ${s.tris} triangles, ${s.ms} ms)`, s.bones > 5 && s.tris > 500);
    check(`${plan}: every vertex's skin weights sum to one`, s.wErr < 1e-4, s.wErr);
    for (const [gait, q] of Object.entries(s.gaits)) { check(`${plan} ${gait}: every foot reaches its target through the stride (worst ${(q.footErr * 100).toFixed(1)} cm)`, q.footErr < .01, q.footErr);
      if (s.legs && q.duty < 1) check(`${plan} ${gait}: feet are down about the gait's duty (${q.down} of ${q.duty})`, Math.abs(q.down - q.duty) < .2, q); }
    check(`${plan}: the genome is a few hundred bytes (${s.genomeBytes})`, s.genomeBytes < 400); }
  // the common set (Session 843): OG-084's ten animals of all islands, each a plan, each from that sheet
  const common = await page.evaluate(async () => { const K = await import('./creatures.js'); return (K.COMMON || []).map(k => ({ k, ok: !!K.PLANS[k], src: K.PLANS[k]?.src || '' })); });
  const stock = await page.evaluate(async () => { const K = await import('./creatures.js'); return (K.LIVESTOCK || []).map(k => ({ k, ok: !!K.PLANS[k], src: K.PLANS[k]?.src || '' })); });
  // the coats (Session 845): the cow pied, the badger's face white with its stripes, read off the vertex colours
  const coats = await page.evaluate(async () => { const K = await import('./creatures.js'), out = {};
    for (const plan of ['cow', 'badger']) { const C = K.build(K.genome(plan, plan + ':check')), col = C.meshes[0].geometry.attributes.color, n = col.count; let pale = 0, dark = 0;
      for (let v = 0; v < n; v++) { const l = .3 * col.getX(v) + .59 * col.getY(v) + .11 * col.getZ(v); if (l > .62) pale++; if (l < .1) dark++; } out[plan] = { n, pale: +(pale / n).toFixed(4), dark: +(dark / n).toFixed(3) }; }
    { const F = K.PLANS.badger.face; delete K.PLANS.badger.face; const col = K.build(K.genome('badger', 'badger:check')).meshes[0].geometry.attributes.color; K.PLANS.badger.face = F; let pale = 0;
      for (let v = 0; v < col.count; v++) if (.3 * col.getX(v) + .59 * col.getY(v) + .11 * col.getZ(v) > .62) pale++; out.badger.paleBare = +(pale / col.count).toFixed(4); }
    return out; });
  check(`the cow is pied (${(coats.cow.pale * 100).toFixed(0)}% of its hide pale)`, coats.cow.pale > .15 && coats.cow.pale < .6, coats.cow);
  check(`the badger's face is white with its stripes (${(coats.badger.pale * 100).toFixed(2)}% of its hide white with the mask, ${(coats.badger.paleBare * 100).toFixed(2)}% without it)`, coats.badger.pale > 3 * coats.badger.paleBare + .003 && coats.badger.pale < .2, coats.badger);
  const gl = await page.evaluate(async () => { const K = await import('./creatures.js'); return (K.GATELANDS || []).map(k => ({ k, ok: !!K.PLANS[k], src: K.PLANS[k]?.src || '' })); });
  check(`the Gatelands' fifteen: each a plan, from OG-009 or the common set (${gl.length})`, gl.length === 15 && gl.every(c => c.ok && /OG-0(09|84)/.test(c.src)), gl.filter(c => !c.ok || !/OG-0(09|84)/.test(c.src)));
  const mk = await page.evaluate(async () => { const K = await import('./creatures.js'); return (K.MARK || []).map(k => ({ k, ok: !!K.PLANS[k], src: K.PLANS[k]?.src || '' })); });
  check(`the Mark's fifteen: each a plan, from OG-031 (${mk.length})`, mk.length === 15 && mk.every(c => c.ok && /OG-031/.test(c.src)), mk.filter(c => !c.ok || !/OG-031/.test(c.src)));
  const au = await page.evaluate(async () => { const K = await import('./creatures.js'); return (K.AURENNE || []).map(k => ({ k, ok: !!K.PLANS[k], src: K.PLANS[k]?.src || '' })); });
  check(`Aurenne's fifteen: fourteen a plan from OG-030 (the Glasswing Moth owed) (${au.length})`, au.length === 14 && au.every(c => c.ok && /OG-030/.test(c.src)), au.filter(c => !c.ok || !/OG-030/.test(c.src)));
  // the strange beasts (Session 853): OG-040's fourteen, each a plan from that sheet
  const st = await page.evaluate(async () => { const K = await import('./creatures.js'); return (K.STRANGE || []).map(k => ({ k, ok: !!K.PLANS[k], src: K.PLANS[k]?.src || '' })); });
  check(`the strange beasts: fourteen, each a plan from OG-040 (${st.length})`, st.length === 14 && st.every(c => c.ok && /OG-040/.test(c.src)), st.filter(c => !c.ok || !/OG-040/.test(c.src)));
  // the sea (Session 854): OG-016's coast, open ocean and deep, with OG-084's seals and dolphins and OG-031's Shatterback, each a plan
  const sea = await page.evaluate(async () => { const K = await import('./creatures.js'); return (K.SEA || []).map(k => ({ k, ok: !!K.PLANS[k], src: K.PLANS[k]?.src || '' })); });
  check(`the sea: twenty-two animals, each a plan from OG-016, OG-084 or OG-031 (${sea.length})`, sea.length === 22 && sea.every(c => c.ok && /OG-0(16|84|31)/.test(c.src)), sea.filter(c => !c.ok || !/OG-0(16|84|31)/.test(c.src)));
  // beasts of burden (Session 855): OG-046's roads and OG-077's post hare, each a plan
  const bur = await page.evaluate(async () => { const K = await import('./creatures.js'); return (K.BURDEN || []).map(k => ({ k, ok: !!K.PLANS[k], src: K.PLANS[k]?.src || '' })); });
  check(`the beasts of burden: nine, each a plan from OG-046 or OG-077 (${bur.length})`, bur.length === 9 && bur.every(c => c.ok && /OG-0(46|77)/.test(c.src)), bur.filter(c => !c.ok || !/OG-0(46|77)/.test(c.src)));
  check(`the livestock: four animals, each a plan from the farm sheets (${stock.map(c => c.k).join(', ')})`, stock.length === 4 && stock.every(c => c.ok && /OG-0(23|35)/.test(c.src)), stock);
  check(`the common set: ten animals, each a plan from OG-084 (${common.map(c => c.k).join(', ')})`, common.length === 10 && common.every(c => c.ok && c.src.includes('OG-084')), common.filter(c => !c.ok || !c.src.includes('OG-084')));
  check('no page errors', errs.length === 0, errs.slice(0, 3)); await page.close(); }
if (process.argv.includes('--shots')) {
  const shot = async (name, q, w = 1920, h = 1080) => { const page = await browser.newPage({ viewport: { width: w, height: h } }); const errs = []; page.on('pageerror', e => errs.push(String(e)));
    const t0 = Date.now(); await page.goto(`http://localhost:${port}/creatures.html?still&w=${w}&h=${h}&${q}`, { timeout: 900000 }); await page.waitForFunction(() => window.__done || window.__err, null, { timeout: 900000 });
    await page.evaluate(() => document.getElementById('note').style.display = 'none'); const url = await page.evaluate(() => document.querySelector('canvas').toDataURL('image/jpeg', .9));
    fs.writeFileSync(path.join(here, 'creatures-' + name + '.jpg'), Buffer.from(url.split(',')[1], 'base64')); console.log('shot', name, ((Date.now() - t0) / 1000).toFixed(0) + 's', errs.slice(0, 3)); await page.close(); };
  const list = (arg('plans') || '').split(',').filter(Boolean);
  if (!list.length || process.argv.includes('--line')) await shot('line', 'view=line', 2400, 800);
  // --sheet=NAME (Session 853): the listed plans side by side on the ruled floor, as creatures-NAME.jpg
  if (arg('sheet') && list.length) await shot(arg('sheet'), 'view=line&plans=' + list.join(','), 2400, 800);
  const xq = arg('q') ? '&' + arg('q') : '', tag = arg('tag') ? '-' + arg('tag') : '';
  for (const plan of list) { await shot(plan + tag, `view=one&plan=${plan}${xq}`, 1280, 720); if (process.argv.includes('--bones')) await shot(plan + tag + '-bones', `view=one&plan=${plan}&bones${xq}`, 1280, 720); }
}
await browser.close(); srv.close(); console.log(fails ? `${fails} FAILED` : 'all passed'); process.exit(fails ? 1 : 0);
