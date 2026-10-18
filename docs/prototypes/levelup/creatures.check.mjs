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
  check(`Aurenne's fifteen: each a plan from OG-030 (${au.length})`, au.length === 15 && au.every(c => c.ok && /OG-030/.test(c.src)), au.filter(c => !c.ok || !/OG-030/.test(c.src)));
  // the strange beasts (Session 853): OG-040's fourteen, each a plan from that sheet
  const st = await page.evaluate(async () => { const K = await import('./creatures.js'); return (K.STRANGE || []).map(k => ({ k, ok: !!K.PLANS[k], src: K.PLANS[k]?.src || '' })); });
  check(`the strange beasts: fourteen, each a plan from OG-040 (${st.length})`, st.length === 14 && st.every(c => c.ok && /OG-040/.test(c.src)), st.filter(c => !c.ok || !/OG-040/.test(c.src)));
  // the corrupted (Session 919): OG-088's row, each a plan with its school and its familiar, and each a change of shape: its parts
  // differ from its familiar's, not only its palette, and its triangles by more than a tenth
  const cor = await page.evaluate(async () => { const K = await import('./creatures.js'), out = [];
    for (const k of K.CORRUPTED || []) { const P = K.PLANS[k], F = P && K.PLANS[P.from], tri = n => K.build(K.genome(n, n + ':check')).stats.tris;
      out.push({ k, ok: !!P && !!F, src: P?.src || '', school: P?.school, from: P?.from, parts: !!F && JSON.stringify(P.parts) !== JSON.stringify(F.parts), tris: P && tri(k), base: F && tri(P.from) }); } return out; });
  for (const c of cor) check(`${c.k}: a corrupted ${c.from} of ${c.school}, from OG-088; a change of shape (its parts differ from the ${c.from}'s; ${c.tris} triangles against ${c.base})`,
    c.ok && /OG-088/.test(c.src) && ['Tine', 'Uisce', 'Cloch', 'Scáth', 'Solas', 'Gaoth'].includes(c.school) && c.parts && Math.abs(c.tris - c.base) > .1 * c.base, c);
  check(`the corrupted: four schools' animals so far (${cor.map(c => c.k).join(', ')})`, cor.length === 5 && new Set(cor.map(c => c.school)).size === 4, cor.map(c => c.school));
  // the troll (Session 926): the kit's first upright walker with hands. It stands on one leg pair, a man and a half tall, and
  // through a whole stride of its walk its hands swing between its hips and the ground, never into it
  const tr = await page.evaluate(async () => { const K = await import('./creatures.js'), out = {};
    for (const k of K.TROLLS) { const C = K.build(K.genome(k, k + ':check')), P = new C.rig.position.constructor(), hands = C.bones.filter(b => /^arm0[LR]_/.test(b.name)).filter((b, i, a) => !b.children.some(c => a.includes(c)));
      C.gait = 'walk'; let lo = 1e9, hi = -1e9, top = 0, swing = 0;
      for (let i = 0; i < 48; i++) { K.pose(C, i / 48); C.rig.updateMatrixWorld(true); const z = [];
        for (const h of hands) { h.getWorldPosition(P); C.rig.worldToLocal(P); const y = P.y * C.S; lo = Math.min(lo, y); hi = Math.max(hi, y); z.push(P.z * C.S); }
        swing = Math.max(swing, Math.abs(z[0] - z[1])); }
      C.rig.updateMatrixWorld(true); C.byName.head.getWorldPosition(P); C.rig.worldToLocal(P); top = P.y * C.S;
      out[k] = { legs: C.B.legs.length, arms: C.B.arms.length, hands: hands.length, head: +top.toFixed(2), hip: +(C.legH * C.S).toFixed(2), lo: +lo.toFixed(2), hi: +hi.toFixed(2), swing: +swing.toFixed(2), tris: C.stats.tris }; }
    return out; });
  // OG-018's trolls by school (Session 927): one plan recoloured, so the same bones and the same build, a different hide
  const ts = await page.evaluate(async () => { const K = await import('./creatures.js'); return K.TROLLS.map(k => ({ k, school: K.PLANS[k].school || '', from: K.PLANS[k].from || '', src: K.PLANS[k].src })); });
  check(`the trolls by school: ${ts.map(t => t.k + (t.school ? ' (' + t.school + ')' : '')).join(', ')}; Tine, Uisce and Cloch, as canon §9a puts them`, ts.length === 4 && ['Tine', 'Uisce', 'Cloch'].every(sc => ts.some(t => t.school === sc)) && ts.filter(t => t.school).every(t => t.from === 'troll'), ts);
  // the slimes (Session 928): a clear hide, and everything they have swallowed inside it, through a whole stride of the crawl
  const sl = await page.evaluate(async () => { const K = await import('./creatures.js'), out = {};
    for (const k of K.SLIMES) { const C = K.build(K.genome(k, k + ':check')), hide = C.meshes[0]; hide.geometry.computeBoundingBox(); const box = hide.geometry.boundingBox.clone();
      const bits = []; C.rig.traverse(o => { if (o.isMesh && !o.isSkinnedMesh && o.parent?.isBone) bits.push(o); }); C.gait = 'crawl'; let out_ = 0; const P = new C.rig.position.constructor();
      for (let i = 0; i < 24; i++) { K.pose(C, i / 24); C.rig.updateMatrixWorld(true); for (const b of bits) { b.getWorldPosition(P); C.rig.worldToLocal(P); if (!box.containsPoint(P)) out_++; } }
      out[k] = { clear: hide.material.transparent ? +hide.material.opacity.toFixed(2) : 1, bits: bits.length, out: out_, tris: C.stats.tris, school: C.plan.school || '' }; }
    return out; });
  for (const [k, t] of Object.entries(sl)) check(`${k}: a clear body (opacity ${t.clear}) holding ${t.bits} swallowed things, every one inside it through the crawl (${t.out} out)${t.school ? '; ' + t.school + "'s" : ''}`, t.clear < 1 && t.bits >= 8 && t.out === 0, t);
  // the Winged Thing (Session 955, OG-018's Gaoth row): a Gaoth plan on four legs with two feathered wings, which in flight spread wider than half again its length
  const wt = await page.evaluate(async () => { const K = await import('./creatures.js'), C = K.build(K.genome('wingedthing', 'wingedthing:check')), T = await import('three'), span = () => { C.rig.updateMatrixWorld(true); const b = new T.Box3(); for (const m of C.meshes) if (m.name === 'fins') { m.geometry.computeBoundingBox(); } C.rig.traverse(o => { if (o.isBone && /^wing[LR]3$/.test(o.name)) b.expandByPoint(o.getWorldPosition(new T.Vector3())); }); return b.max.x - b.min.x; };
    C.gait = 'stand'; K.pose(C, 0); const folded = span(); C.gait = 'fly'; let open = 0; for (let i = 0; i < 12; i++) { K.pose(C, i / 12); open = Math.max(open, span()); }
    const body = C.len;
    return { school: C.plan.school, legs: C.B.legs.length, wings: C.B.wings.filter(w => w.feathered).length, folded: +folded.toFixed(2), open: +open.toFixed(2), body: +body.toFixed(2) }; });
  check(`wingedthing: Gaoth's griffin, ${wt.legs} legs and ${wt.wings} feathered wings, the wingtips ${wt.folded} m apart folded and up to ${wt.open} m in flight (its body ${wt.body} m long)`, wt.school === 'Gaoth' && wt.legs === 4 && wt.wings === 2 && wt.open > wt.body * 1.5 && wt.folded < wt.open * .6, wt);
  // a folded bird's wing (Session 974): every flight feather on a quill bone of its own, turned at rest to lie back along the body within
  // 25 degrees of its line (the arm alone carried them out to the side), and left as built when the wing is open
  const qu = await page.evaluate(async () => { const K = await import('./creatures.js'), T = await import('three'), out = {}, q = new T.Quaternion(), qr = new T.Quaternion(), v = new T.Vector3(), back = new T.Vector3(0, 0, -1);
    for (const k of Object.keys(K.PLANS)) { const C0 = K.build(K.genome(k, k + ':check')); if (!C0.B.wings.some(w => w.feathered)) continue;
      const rest = C0.plan.gaits.find(g => !K.GAITS[g].flap), fly = C0.plan.gaits.find(g => K.GAITS[g].flap), ws = C0.B.wings.filter(w => w.feathered);
      const worst = (C, stow) => { C.rig.updateMatrixWorld(true); C.rig.getWorldQuaternion(qr).invert(); let a = 0, n = 0, off = 0, eMax = 0, eSum = 0;
        for (const W of ws) for (const f of W.quills) { const b = C.byName[f.name]; n++; if (!stow) { off = Math.max(off, b.quaternion.angleTo(new T.Quaternion())); b.quaternion.identity(); b.updateMatrixWorld(true); }
          v.copy(f.d).applyQuaternion(b.getWorldQuaternion(q).premultiply(qr)); a = Math.max(a, v.angleTo(back) * 180 / Math.PI);
          v.copy(f.n).applyQuaternion(q); const e = Math.asin(Math.min(1, Math.abs(v.y))) * 180 / Math.PI; eMax = Math.max(eMax, e); eSum += e; }
        return { a: +a.toFixed(1), n, off, face: +eMax.toFixed(1), faceMean: +(eSum / n).toFixed(1) }; };
      const r = {}; if (rest) { C0.gait = rest; K.pose(C0, .2); r.stowed = worst(C0, true); K.pose(C0, .2); r.rigid = worst(C0, false); }
      if (fly) { C0.gait = fly; let off = 0; for (let i = 0; i < 6; i++) { K.pose(C0, i / 6); for (const W of ws) for (const f of W.quills) off = Math.max(off, C0.byName[f.name].quaternion.angleTo(new T.Quaternion())); } r.openOff = +off.toFixed(4); }
      // the primaries' fan at rest (Session 984): the least angle between neighbours' lines, the wing's ragged share
      if (rest) { C0.gait = rest; K.pose(C0, .2); C0.rig.updateMatrixWorld(true); C0.rig.getWorldQuaternion(qr).invert(); let step = 9;
        for (const W of ws) { const ps = W.quills.filter(f => f.kind === 'p').map(f => f.d.clone().applyQuaternion(C0.byName[f.name].getWorldQuaternion(q).premultiply(qr)));
          for (let i = 1; i < ps.length; i++) step = Math.min(step, ps[i].angleTo(ps[i - 1]) * 180 / Math.PI); } r.fan = { step: +step.toFixed(2), ragged: ws[0].ragged };
        // the two folded wings mirror each other: every feather's line and face, the left's against the right's reflected across the body,
        // in the frame of the spine bone they hang from (the body's own roll and sway through the stride are not the wings')
        let mir = 0; const [WL, WR] = ws, qs = C0.byName[WL.arm[0]].parent.getWorldQuaternion(new T.Quaternion()).invert(), rq = f => C0.byName[f.name].getWorldQuaternion(new T.Quaternion()).premultiply(qs);
        if (WR) WL.quills.forEach((f, i) => { const g = WR.quills[i], ql = rq(f), qrr = rq(g);
          for (const key of ['d', 'n']) { const a = f[key].clone().applyQuaternion(ql), b = g[key].clone().applyQuaternion(qrr); b.x = -b.x; mir = Math.max(mir, Math.min(a.angleTo(b), a.angleTo(b.negate())) * 180 / Math.PI); } });
        r.mirror = +mir.toFixed(3); }
      r.quills = ws.reduce((s, W) => s + W.quills.length, 0); r.tris = C0.stats.tris; out[k] = r; }
    return out; });
  for (const [k, r] of Object.entries(qu)) { if (r.stowed) { check(`${k}: its ${r.quills} folded flight feathers lie back along the body, the worst ${r.stowed.a} degrees off its line (${r.rigid.a} on the arm alone)`, r.quills >= 20 && r.stowed.a < 25 && r.stowed.a < r.rigid.a, r);
      // and rolled to lean down over the flank (Session 983): each card's face tipped no more than 62 degrees up from facing straight out,
      // so the folded wing shows its face from the side; flat on the back, as before the roll, the faces were tipped near 90
      check(`${k}: its folded feathers lean down over the flank, faces tipped at most ${r.stowed.face} degrees from facing out (${r.stowed.faceMean} on average)`, r.stowed.face < 62 && r.stowed.faceMean < 50, r.stowed); }
    if (r.mirror !== undefined) check(`${k}: its two folded wings mirror each other, every feather within ${r.mirror} degrees`, r.mirror < .5, r.mirror);
    if (r.fan) check(r.fan.ragged ? `${k}: its few primaries stand apart when folded, at least ${r.fan.step} degrees between neighbours` : `${k}: its folded primaries stack close (${r.fan.step} degrees between neighbours at least)`, r.fan.ragged ? r.fan.step >= 2.4 : r.fan.step < 2.4, r.fan);
    if (r.openOff !== undefined) check(`${k}: its feathers open as built in flight (turned at most ${r.openOff} rad)`, r.openOff < 1e-6, r); }
  // the gargoyles (Session 956, OG-018's Cloch and Gaoth rows): stone wings folded close down the back at rest (`wingRest`), every wing bone
  // behind the shoulder and inside a width less than its body's length, and spread wide when it flies
  const ga = await page.evaluate(async () => { const K = await import('./creatures.js'), T = await import('three'), out = {};
    for (const k of K.GARGOYLES) { const C = K.build(K.genome(k, k + ':check')), pts = () => { C.rig.updateMatrixWorld(true); const b = new T.Box3(); C.rig.traverse(o => { if (o.isBone && /^wing/.test(o.name)) b.expandByPoint(o.getWorldPosition(new T.Vector3())); }); return b; };
      C.gait = 'stand'; K.pose(C, 0); const rest = pts(), sh = C.byName.wingL0.getWorldPosition(new T.Vector3()), crown = C.byName.head.getWorldPosition(new T.Vector3()).y; C.gait = 'fly'; let open = 0; for (let i = 0; i < 12; i++) { K.pose(C, i / 12); const b = pts(); open = Math.max(open, b.max.x - b.min.x); }
      out[k] = { school: C.plan.school, wings: C.B.wings.length, rest: +(rest.max.x - rest.min.x).toFixed(2), top: +rest.max.y.toFixed(2), crown: +crown.toFixed(2), open: +open.toFixed(2), len: +C.len.toFixed(2), behind: +(sh.z - rest.max.z).toFixed(2), tris: C.stats.tris }; }
    return out; });
  for (const [k, t] of Object.entries(ga)) check(`${k}: a gargoyle of ${t.school}, its ${t.wings} stone wings folded ${t.rest} m across at rest (its body ${t.len} m long), behind its shoulders, and ${t.open} m in flight`, t.wings === 2 && t.rest < t.len && t.behind >= -.05 && t.open > t.rest * 2, t);
  // the Frost Thing's two options (Session 958, DECISION): both Uisce plans of clear ice with shards on them
  const fr = await page.evaluate(async () => { const K = await import('./creatures.js'); return K.FROST.map(k => { const C = K.build(K.genome(k, k + ':check')), h = C.meshes[0].material; let shards = 0; C.rig.traverse(o => { if (o.isMesh && !o.isSkinnedMesh && o.geometry.attributes.position.count >= 30 && o.material.flatShading) shards++; });
    return { k, school: C.plan.school, clear: h.transparent ? +h.opacity.toFixed(2) : 1, shards, tris: C.stats.tris }; }); });
  for (const t of fr) check(`${t.k}: a Frost Thing of Uisce in clear ice (opacity ${t.clear}) with ${t.shards} clusters of shards`, t.school === 'Uisce' && t.clear < 1 && t.shards >= 5, t);
  // the mist rises in the body's up, not the head's (Session 975): with the stag's neck nodding hard (1.2 rad), every phase's puffs still
  // leave their tines up and back within 10 degrees of the plan's rise and drift, where the head's own frame would tip them over
  const mu = await page.evaluate(async () => { const K = await import('./creatures.js'), T = await import('three'), C = K.build(K.genome('shadowstag', 'shadowstag:check')), m = C.mist, P = m.geometry.attributes.position, o = m.userData.o;
    C.plan = { ...C.plan, neckNod: 1.2 }; const want = new T.Vector3(0, o.rise, -o.drift).normalize(), qr = new T.Quaternion(), qm = new T.Quaternion(), qh = new T.Quaternion(); let worst = 0, tilt = 0;
    for (let i = 0; i < 12; i++) { K.pose(C, i / 12); C.rig.updateMatrixWorld(true); C.rig.getWorldQuaternion(qr).invert(); m.getWorldQuaternion(qm).premultiply(qr); C.byName.head.getWorldQuaternion(qh).premultiply(qr);
      tilt = Math.max(tilt, new T.Vector3(0, 1, 0).applyQuaternion(qh).angleTo(new T.Vector3(0, 1, 0)));
      const d = new T.Vector3(); m.userData.q.forEach((u, k) => d.add(new T.Vector3(P.getX(k), P.getY(k), P.getZ(k)).sub(u.t).applyQuaternion(qm)));
      worst = Math.max(worst, d.angleTo(want)); }
    return { worst: +(worst * 180 / Math.PI).toFixed(1), tilt: +(tilt * 180 / Math.PI).toFixed(1) }; });
  check(`shadowstag: its mist rises in the body's up, the puffs within ${mu.worst} degrees of up and back with the head tipped up to ${mu.tilt} degrees`, mu.worst < 10 && mu.tilt > 30, mu);
  // the stag of shadows' mist (Session 969, OG-088): puffs from every tine's tip, no shadow, rising through the stride and the same at the same phase
  const sm = await page.evaluate(async () => { const K = await import('./creatures.js'), C = K.build(K.genome('shadowstag', 'shadowstag:check')), m = C.mist, P = m.geometry.attributes.position, A = m.geometry.attributes.aAlpha;
    const snap = ph => { K.pose(C, ph); return Array.from(P.array); }, a = snap(.1), b = snap(.35), a2 = snap(.1); let moved = 0, same = 0, up = 0; for (let i = 0; i < a.length; i++) { moved = Math.max(moved, Math.abs(a[i] - b[i])); same = Math.max(same, Math.abs(a[i] - a2[i])); }
    const tips = m.userData.q.length / (m.userData.o.per); let amax = 0; for (let i = 0; i < A.count; i++) amax = Math.max(amax, A.getX(i));
    return { puffs: P.count, tips, onHead: m.parent === C.byName.head, shadow: m.castShadow, moved: +moved.toFixed(3), same, amax: +amax.toFixed(2), others: Object.keys(K.PLANS).filter(k => k !== 'shadowstag' && K.PLANS[k].parts.some(([, o]) => o.antlers?.mist)).length }; });
  check(`shadowstag: its antlers breathe a mist, ${sm.puffs} puffs from ${sm.tips} tines on the head bone, no shadow, moving ${sm.moved} m through the stride and the same at the same phase`,
    sm.onHead && !sm.shadow && sm.tips >= 10 && sm.moved > .05 && sm.same === 0 && sm.amax > 0 && sm.amax <= .2 && sm.others === 0, sm);
  // the griffin's hooked talons (Session 970): each forefoot claw bows off the line from its root to its tip (an arch), and its tip reaches
  // no lower than a straight claw's would
  const tl = await page.evaluate(async () => { const K = await import('./creatures.js'), T = await import('three'), C = K.build(K.genome('wingedthing', 'wingedthing:check')), out = [];
    for (const L of C.B.legs) { const foot = L.bones[L.bones.length - 1]; for (const m of foot.children) { if (!m.isMesh || m.geometry.type !== 'ConeGeometry') continue; const P = m.geometry.attributes.position, h = m.geometry.parameters.height, r = m.geometry.parameters.radius;
      let tip = null, tipY = 1e9; const v = new T.Vector3(); for (let i = 0; i < P.count; i++) { v.fromBufferAttribute(P, i); if (!tip || v.lengthSq() > tip.lengthSq()) tip = v.clone(); }
      const u = tip.clone().normalize(); let bow = 0; for (let i = 0; i < P.count; i++) { v.fromBufferAttribute(P, i); bow = Math.max(bow, v.clone().sub(u.clone().multiplyScalar(v.dot(u))).length() - r); }
      out.push({ fore: L.at > 0, bow: +(bow / h).toFixed(2), reach: +(tip.length() / h).toFixed(2) }); } }
    return out; });
  const tf = tl.filter(t => t.fore);
  check(`wingedthing: ${tf.length} hooked talons on its forefeet, each bowed ${Math.min(...tf.map(t => t.bow))} to ${Math.max(...tf.map(t => t.bow))} of its length, its tip where a straight claw's is`, tf.length === 8 && tf.every(t => t.bow > .1 && Math.abs(t.reach - 1) < .02), tl);
  // the frozen man's face (Session 968, Michael's B): the skeleton's skull inside his head, the ice thinned over the face's front only, and
  // the skull wholly under the hide (no crown through the top of his head)
  const ff = await page.evaluate(async () => { const K = await import('./creatures.js'), C = K.build(K.genome('frostfolk', 'frostfolk:check')), h = C.meshes[0], a = h.geometry.attributes.aAlpha, P = h.geometry.attributes.position;
    C.rig.updateMatrixWorld(true); let sk = null; const T = await import('three'), box = new T.Box3();
    C.rig.traverse(o => { if (o.name === 'skull') { box.expandByObject(o); sk = true; } }); h.updateMatrixWorld(true);
    let lo = 1, thin = 0, over = -9; const v = new T.Vector3(); for (let i = 0; i < P.count; i++) { if (a) { lo = Math.min(lo, a.getX(i)); if (a.getX(i) < .9) thin++; }
      v.fromBufferAttribute(P, i).applyMatrix4(h.matrixWorld); if (v.x > box.min.x && v.x < box.max.x && v.z > box.min.z && v.z < box.max.z) over = Math.max(over, v.y); }
    return { skull: !!sk, tris: C.B.skull?.tris, face: a ? +(lo * C.plan.clear).toFixed(2) : null, thinShare: a ? +(thin / P.count).toFixed(3) : null, skullTop: +box.max.y.toFixed(3), hideTop: +over.toFixed(3) }; });
  check(`frostfolk: the skeleton's skull under the ice (${ff.tris} triangles), the face's ice at ${ff.face} over ${(ff.thinShare * 100).toFixed(1)}% of the hide, the skull's top ${ff.skullTop} under the hide's ${ff.hideTop}`,
    ff.skull && ff.face !== null && ff.face < .5 && ff.thinShare > .005 && ff.thinShare < .08 && ff.skullTop < ff.hideTop, ff);
  // skin wings let light through (Session 959): every opaque membrane wing gives back a share of its colour, no feathered or clear one does
  const wlt = await page.evaluate(async () => { const K = await import('./creatures.js'), out = { lit: [], plain: [] };
    for (const k of Object.keys(K.PLANS)) { const P = K.PLANS[k]; if (!(P.parts || []).some(([n]) => n === 'wings')) continue; const C = K.build(K.genome(k, k + ':wl'));
      for (const m of C.meshes) if (m.name === 'wing') { const membrane = !C.B.wings[0].feathered && !(P.wingOpacity < 1); (membrane === Object.hasOwn(m.material, 'onBeforeCompile') ? out.lit : out.plain).push(k + (membrane ? '' : ' (feathered or clear)') + (membrane === Object.hasOwn(m.material, 'onBeforeCompile') ? '' : ' WRONG')); } }
    return out; });
  check(`skin wings let light through: ${[...new Set(wlt.lit)].length} winged plans right, none wrong`, wlt.plain.length === 0 && wlt.lit.length > 0, { wrong: [...new Set(wlt.plain)], right: [...new Set(wlt.lit)] });
  // the griffin's talons (Session 960): an eagle's foot on each foreleg, three claws forward and a hind toe, a cat's three on each hind foot
  const tal = await page.evaluate(async () => { const K = await import('./creatures.js'), C = K.build(K.genome('wingedthing', 'wingedthing:check')), n = {};
    for (const L of C.B.legs) { const b = L.bones[L.bones.length - 1]; n[L.bones[0].name] = b.children.filter(o => o.isMesh).length; } return n; });
  const tv = Object.entries(tal), fore = tv.filter(([k]) => /^leg0/.test(k)).map(([, v]) => v), hind = tv.filter(([k]) => !/^leg0/.test(k)).map(([, v]) => v);
  check(`wingedthing: an eagle's talons on its forelegs (${fore.join(', ')} claws) and a cat's on its hind feet (${hind.join(', ')})`, fore.length === 2 && fore.every(v => v === 4) && hind.every(v => v === 3), tal);
  // the slimes' holes (Session 954, OG-041: "with holes through it"): a line down each hole's axis meets no hide, at rest or through a whole
  // crawl stride (each axis carried by its spine bone), while the same line moved two of the hole's radii toward the spine meets the body
  const ho = await page.evaluate(async () => { const K = await import('./creatures.js'), T = await import('three'), out = {};
    for (const k of K.SLIMES) { const C = K.build(K.genome(k, k + ':check')), hide = C.meshes[0], side = hide.material.side; hide.material.side = T.DoubleSide; C.gait = 'crawl'; K.pose(C, 0); C.rig.updateMatrixWorld(true);
      const H = (C.B.holes || []).map(h => { const M = C.byName[h.bone].matrixWorld.clone().invert(), w = p => C.rig.localToWorld(p.clone()); return { r: h.ra, c: w(h.c).applyMatrix4(M), e: w(h.c.clone().add(h.d)).applyMatrix4(M), up: w(h.c.clone().add(new T.Vector3(0, h.ra * 2.2 * (h.up > .4 ? -1 : 1), 0))).applyMatrix4(M), bone: C.byName[h.bone] }; });
      const rc = new T.Raycaster(); let through = 0, lines = 0, body = 0;
      for (let i = 0; i <= 24; i++) { K.pose(C, i / 24); C.rig.updateMatrixWorld(true);
        for (const h of H) { const c = h.c.clone().applyMatrix4(h.bone.matrixWorld), d = h.e.clone().applyMatrix4(h.bone.matrixWorld).sub(c).normalize(), u = h.up.clone().applyMatrix4(h.bone.matrixWorld);
          rc.set(c.clone().addScaledVector(d, -3), d); rc.far = 6; lines++; if (!rc.intersectObject(hide).length) through++;
          rc.set(u.clone().addScaledVector(d, -3), d); if (rc.intersectObject(hide).length) { body++; h.n = (h.n || 0) + 1; } } }
      hide.material.side = side; out[k] = { holes: H.length, lines, through, body, each: H.map(h => h.n || 0), tris: C.stats.tris }; }
    return out; });
  for (const [k, t] of Object.entries(ho)) check(`${k}: ${t.holes} holes clean through it, at rest and through the crawl (${t.through} of ${t.lines} lines clear, ${t.body} of ${t.lines} lines beside them in the body)`, t.holes >= 3 && t.through === t.lines && t.body === t.lines, t);
  for (const [k, t] of Object.entries(tr)) {
    check(`${k}: an upright biped with two arms (${t.legs} legs, ${t.arms} arms), its head ${t.head} m up`, t.legs === 2 && t.arms === 2 && t.hands === 2 && t.head > 2 && t.head < 3.4, t);
    check(`${k}: through its walk the hands swing between the hips and the ground (${t.lo} to ${t.hi} m, the hips at ${t.hip} m; ${t.swing} m apart at most)`, t.lo > .1 && t.hi < t.hip && t.swing > .15, t); }
  // the giant spider (Session 929, OG-041): thorns up every leg segment past the hip, and a clutch of egg sacs under the abdomen's tip
  // that hang clear of the ground and below the abdomen's line through a whole stride of every gait
  const sp = await page.evaluate(async () => { const K = await import('./creatures.js'), C = K.build(K.genome('spider', 'spider:check')), P = new C.rig.position.constructor(), Box = new (await import('three')).Box3();
    const thorns = [], eggs = []; C.rig.traverse(o => { if (o.name === 'thorns') thorns.push(o); if (o.name === 'eggs') eggs.push(o); });
    const segs = C.B.legs.reduce((n, L) => n + L.J.length - 2, 0), tailEnd = C.byName[C.B.tailBone]; let low = 1e9, above = 0, n = 0;
    for (const gait of C.plan.gaits) { C.gait = gait; for (let i = 0; i < 24; i++) { K.pose(C, i / 24); C.rig.updateMatrixWorld(true); tailEnd.getWorldPosition(P); const ty = P.y;
      for (const e of eggs) { Box.setFromObject(e); low = Math.min(low, Box.min.y); n++; if ((Box.min.y + Box.max.y) / 2 > ty) above++; } } }
    const tt = thorns.reduce((t, m) => t + m.geometry.attributes.position.count / 3, 0), et = eggs.reduce((t, m) => t + m.geometry.attributes.position.count / 3, 0);
    return { thorns: C.B.thorns, thornTris: tt, eggTris: et, meshes: thorns.length, segs, sacs: C.B.eggs, eggMeshes: eggs.length, low: +low.toFixed(3), above, n, tris: C.stats.tris }; });
  check(`spider: thorns on every leg segment past the hip (${sp.thorns} thorns on ${sp.meshes} of ${sp.segs} segments)`, sp.meshes === sp.segs && sp.thorns >= 3 * sp.segs, sp);
  check(`spider: ${sp.sacs} egg sacs under its abdomen, clear of the ground (lowest ${sp.low} m) and below the abdomen's tip through every gait (${sp.above} of ${sp.n} above)`, sp.sacs >= 5 && sp.eggMeshes >= 1 && sp.low > .03 && sp.above === 0, sp);
  // the goblin (Session 933, OG-041): the troll's frame at half its height, and the kit's first gear: a spear in the right fist and a
  // hide shield on the left forearm, which swing with the arms and never touch the ground or pass into the body through any gait
  const gb = await page.evaluate(async () => { const T = await import('three'), K = await import('./creatures.js'), out = {};
    for (const k of K.GOBLINS) { const C = K.build(K.genome(k, k + ':check')), P = new T.Vector3(), box = new T.Box3(), items = {}; C.rig.traverse(o => { if (o.name === 'spear' || o.name === 'shield') items[o.name] = o; });
      const hip = C.legH * C.S; let low = 1e9, top = 0, head = 0, sep = 1e9;
      // the harness (Session 944): each strap point against the skin point it was laid on, rest and posed
      const hide = C.meshes.find(m => m.name === 'hide'), fins = C.meshes.find(m => m.name === 'fins'), HL = C.B.harness?.laid || [], hv = new T.Vector3(), fv = new T.Vector3();
      const gap = () => HL.map(q => { hide.getVertexPosition(q.src, hv); fins.getVertexPosition(q.v, fv); return hv.distanceTo(fv); }), rest0 = HL.length && fins ? gap() : []; let rMin = 9, rMax = 0;
      for (const gait of C.plan.gaits) { C.gait = gait; for (let i = 0; i < 24; i++) { K.pose(C, i / 24); C.rig.updateMatrixWorld(true);
        if (rest0.length) gap().forEach((d, j) => { const r = d / rest0[j]; rMin = Math.min(rMin, r); rMax = Math.max(rMax, r); });
        for (const o of Object.values(items)) { box.setFromObject(o); C.rig.localToWorld(P.set(0, 0, 0)); low = Math.min(low, box.min.y - C.root.position.y); }
        box.setFromObject(items.spear); top = Math.max(top, box.max.y - C.root.position.y); C.byName.head.getWorldPosition(P); head = Math.max(head, P.y - C.root.position.y);
        const sh = new T.Vector3(); items.shield.getWorldPosition(sh); const hp = new T.Vector3(); C.byName.spine0.getWorldPosition(hp); sep = Math.min(sep, Math.hypot(sh.x - hp.x, sh.z - hp.z)); } }
      out[k] = { gear: C.B.gear, head: +head.toFixed(2), hip: +hip.toFixed(2), low: +low.toFixed(3), top: +top.toFixed(2), sep: +sep.toFixed(2), legs: C.B.legs.length, arms: C.B.arms.length, tris: C.stats.tris, harness: C.B.harness && { straps: C.B.harness.straps, miss: C.B.harness.miss, pts: HL.length, rMin: +rMin.toFixed(2), rMax: +rMax.toFixed(2) } }; }
    return out; });
  // the cave troll's lashed-on armour (Session 945): straps laid on its skin, as the goblin's harness; the trolls built from it keep bare hides
  const ta = await page.evaluate(async () => { const T = await import('three'), K = await import('./creatures.js'), out = {};
    for (const k of ['troll', 'stonetroll', 'tinetroll', 'uiscetroll']) { const C = K.build(K.genome(k, k + ':check')), hide = C.meshes.find(m => m.name === 'hide'), fins = C.meshes.find(m => m.name === 'fins'), HL = C.B.harness?.laid || [], hv = new T.Vector3(), fv = new T.Vector3();
      const gap = () => HL.map(q => { hide.getVertexPosition(q.src, hv); fins.getVertexPosition(q.v, fv); return hv.distanceTo(fv); }), rest0 = HL.length ? gap() : []; let rMin = 9, rMax = 0;
      for (const gait of C.plan.gaits) { C.gait = gait; for (let i = 0; i < 24; i++) { K.pose(C, i / 24); C.rig.updateMatrixWorld(true); if (rest0.length) gap().forEach((d, j) => { const r = d / rest0[j]; rMin = Math.min(rMin, r); rMax = Math.max(rMax, r); }); } }
      out[k] = C.B.harness ? { straps: C.B.harness.straps, miss: C.B.harness.miss, pts: HL.length, rMin: +rMin.toFixed(2), rMax: +rMax.toFixed(2) } : null; }
    return out; });
  check(`troll: lashed-on armour (OG-041): ${ta.troll?.straps} plates and lashings laid on its grown skin at ${ta.troll?.pts} points (${ta.troll?.miss} missed), each staying with the skin under it through every gait (its gap ${ta.troll?.rMin} to ${ta.troll?.rMax} of its rest)`, ta.troll && ta.troll.straps === 6 && ta.troll.miss === 0 && ta.troll.pts > 80 && ta.troll.rMin > .6 && ta.troll.rMax < 1.6, ta.troll);
  check('the trolls built from it (stone, Tine, Uisce) keep their bare hides', !ta.stonetroll && !ta.tinetroll && !ta.uiscetroll, ta);
  for (const [k, t] of Object.entries(gb)) {
    check(`${k}: a scrap-leather harness (OG-041): ${t.harness?.straps} straps laid on the grown skin at ${t.harness?.pts} points (${t.harness?.miss} missed), each staying with the skin under it through every gait (its gap ${t.harness?.rMin} to ${t.harness?.rMax} of its rest)`, t.harness && t.harness.straps === 3 && t.harness.miss === 0 && t.harness.pts > 60 && t.harness.rMin > .6 && t.harness.rMax < 1.6, t.harness);
    check(`${k}: a crouched biped about a goblin's height (head ${t.head} m up; ${t.legs} legs, ${t.arms} arms)`, t.legs === 2 && t.arms === 2 && t.head > .8 && t.head < 1.4, t);
    check(`${k}: carries ${t.gear.join(' and ')}, clear of the ground through every gait (lowest ${t.low} m), the spear's point above its head (${t.top} m), the shield off its hip (${t.sep} m)`, t.gear.includes('spear') && t.gear.includes('shield') && t.low > .02 && t.top > t.head + .3 && t.sep > .2, t); }
  // the skeleton (Session 934, OG-041): the kit's first bare body, its capsules drawn as bones, with ribs and a pelvis; it stands a man's
  // height, and its sword and shield stay clear of the ground through every gait
  const sk = await page.evaluate(async () => { const T = await import('three'), K = await import('./creatures.js'), out = {};
    for (const k of K.SKELETONS) { const C = K.build(K.genome(k, k + ':check')), P = new T.Vector3(), box = new T.Box3(), items = []; C.rig.traverse(o => { if (o.name === 'sword' || o.name === 'shield') items.push(o); });
      const flesh = K.build(K.genome('troll', 'troll:check')).stats.tris; let low = 1e9, head = 0;
      // the rags (Session 943): on the dry skeleton the sheets are its rags alone; how low they hang and how far any edge stretches as the thighs swing
      const fins = C.meshes.find(m => m.name === 'fins'), rest = fins && !C.plan.school ? fins.geometry.attributes.position : null, ix = rest && fins.geometry.index.array; let ragLow = 1e9, stretch = 0; const va = new T.Vector3(), vb = new T.Vector3();
      for (const gait of C.plan.gaits) { C.gait = gait; for (let i = 0; i < 24; i++) { K.pose(C, i / 24); C.rig.updateMatrixWorld(true);
        if (rest) { for (let v = 0; v < rest.count; v++) { fins.getVertexPosition(v, va); va.applyMatrix4(fins.matrixWorld); ragLow = Math.min(ragLow, va.y - C.root.position.y); }
          for (let t = 0; t < ix.length; t += 3) for (const [a, b] of [[ix[t], ix[t + 1]], [ix[t + 1], ix[t + 2]]]) { fins.getVertexPosition(a, va); fins.getVertexPosition(b, vb); const L0 = Math.hypot(rest.getX(a) - rest.getX(b), rest.getY(a) - rest.getY(b), rest.getZ(a) - rest.getZ(b)); if (L0 > .005) stretch = Math.max(stretch, va.distanceTo(vb) / L0); } }
        for (const o of items) { box.setFromObject(o); low = Math.min(low, box.min.y - C.root.position.y); } C.byName.head.getWorldPosition(P); head = Math.max(head, P.y - C.root.position.y); } }
      out[k] = { school: C.plan.school || '', from: C.plan.from || '', weed: C.meshes.some(m => m.name === 'fins'), bare: !!C.plan.bare, tris: C.stats.tris, troll: flesh, ribs: C.B.ribs, gear: C.B.gear, low: +low.toFixed(3), head: +head.toFixed(2), skull: C.B.skull || null, rags: C.B.rags || null, ragLow: rest ? +ragLow.toFixed(3) : null, stretch: +stretch.toFixed(2), skullMeshes: C.rig.children.length >= 0 && (() => { let n = 0; C.rig.traverse(o => { if (o.name === 'skull') n++; }); return n; })(), lit: (() => { let n = 0; C.rig.traverse(o => { if (o.isMesh && o.material?.clearcoat === 1) n++; }); return n; })() }; }
    return out; });
  for (const [k, t] of Object.entries(sk)) {
    check(`${k}: a bare body, bones and not a hide (${t.tris} triangles against the troll's ${t.troll}), ${t.ribs} ribs, its skull ${t.head} m up`, t.bare && t.tris < t.troll && t.ribs >= 10 && t.head > 1.4 && t.head < 1.85, t);
    check(`${k}: a modelled skull (Session 942): cranium, brow, cheekbones, face and sockets on the head bone and a mandible on the jaw (${t.skullMeshes} pieces, ${t.skull?.tris} triangles), ${t.skull?.teeth} teeth, its crown ${t.skull?.top} m over the neck`, t.skull && t.skullMeshes === 5 && t.skull.teeth === 20 && t.skull.tris > 2000 && t.skull.tris < 12000 && t.skull.top > .11 && t.skull.top < .17, t.skull);
    if (!t.school) check(`${k}: rags at the hips (OG-041): ${t.rags?.strips} torn strips on a cord, clear of the knees through every gait (lowest ${t.ragLow} m), no edge stretched past ${t.stretch} times its length as the thighs swing`, t.rags && t.rags.strips >= 6 && t.ragLow > .35 && t.stretch < 1.4, { rags: t.rags, ragLow: t.ragLow, stretch: t.stretch });
    check(`${k}: ${t.school ? 'its sockets lit (' + t.lit + ' eyes)' : 'its sockets empty and dark'}`, t.school ? t.lit === 2 : t.lit === 0, { lit: t.lit });
    if (t.school) check(`${k}: the ${t.from} of ${t.school}, weed-hung (OG-018)`, t.from === 'skeleton' && t.school === 'Uisce' && t.weed, t);
    check(`${k}: carries ${(t.gear || []).join(' and ')}, clear of the ground through every gait (lowest ${t.low} m)`, (t.gear || []).includes('sword') && t.gear.includes('shield') && t.low > .02, t); }
  // the sea (Session 854): OG-016's coast, open ocean and deep, with OG-084's seals and dolphins and OG-031's Shatterback, each a plan
  const sea = await page.evaluate(async () => { const K = await import('./creatures.js'); return (K.SEA || []).map(k => ({ k, ok: !!K.PLANS[k], src: K.PLANS[k]?.src || '' })); });
  check(`the sea: twenty-four animals, each a plan from OG-016, OG-084 or OG-031 (${sea.length})`, sea.length === 24 && sea.every(c => c.ok && /OG-0(16|84|31)/.test(c.src)), sea.filter(c => !c.ok || !/OG-0(16|84|31)/.test(c.src)));
  // beasts of burden (Session 855): OG-046's roads and OG-077's post hare, each a plan
  const bur = await page.evaluate(async () => { const K = await import('./creatures.js'); return (K.BURDEN || []).map(k => ({ k, ok: !!K.PLANS[k], src: K.PLANS[k]?.src || '' })); });
  check(`the beasts of burden: nine, each a plan from OG-046 or OG-077 (${bur.length})`, bur.length === 9 && bur.every(c => c.ok && /OG-0(46|77)/.test(c.src)), bur.filter(c => !c.ok || !/OG-0(46|77)/.test(c.src)));
  check(`the livestock: four animals, each a plan from the farm sheets (${stock.map(c => c.k).join(', ')})`, stock.length === 4 && stock.every(c => c.ok && /OG-0(23|35)/.test(c.src)), stock);
  // the common set and the livestock by island (Sessions 865, 866): each island's coat differs from the Gatelands' on the same bones, and the
  // island survives the saved genome
  const isl = await page.evaluate(async () => { const K = await import('./creatures.js'), out = {};
    const mean = C => { const col = C.meshes[0].geometry.attributes.color; let r = 0, g = 0, b = 0; for (let v = 0; v < col.count; v++) { r += col.getX(v); g += col.getY(v); b += col.getZ(v); } return [r / col.count, g / col.count, b / col.count]; };
    for (const plan of [...K.COMMON, ...K.LIVESTOCK]) { const base = K.build(K.genome(plan, plan + ':isle')), m0 = mean(base); out[plan] = { bones: base.stats.bones };
      for (const isle of ['mark', 'aurenne']) { const C = K.build(K.genome(plan, plan + ':isle', { island: isle })), m = mean(C);
        out[plan][isle] = { d: +Math.hypot(m[0] - m0[0], m[1] - m0[1], m[2] - m0[2]).toFixed(3), sameBones: C.stats.bones === base.stats.bones, recoloured: !!K.COATS[isle][plan] }; } }
    const g = K.genome('wolf', 'wolf:isle', { island: 'mark' }), back = K.fromSaved(JSON.parse(JSON.stringify(K.toSaved(g))));
    out.saved = { island: back.island, none: K.toSaved(K.genome('wolf', 'w')).island === undefined, bad: K.genome('wolf', 'w', { island: 'atlantis' }).island === undefined };
    return out; });
  for (const plan of await page.evaluate(async () => { const K = await import('./creatures.js'); return [...K.COMMON, ...K.LIVESTOCK]; })) for (const isle of ['mark', 'aurenne']) { const q = isl[plan][isle];
    check(`${plan} on ${isle === 'mark' ? 'the Mark' : 'Aurenne'}: ${q.recoloured ? 'a coat of its own' : 'the same coat'} on the same bones (mean colour moved ${q.d})`, q.sameBones && (q.recoloured ? q.d > .015 : q.d < .002), q); }
  check(`a creature's island survives the saved genome, and a genome with none or an unknown one carries none`, isl.saved.island === 'mark' && isl.saved.none && isl.saved.bad, isl.saved);
  check(`the common set: ten animals, each a plan from OG-084 (${common.map(c => c.k).join(', ')})`, common.length === 10 && common.every(c => c.ok && c.src.includes('OG-084')), common.filter(c => !c.ok || !c.src.includes('OG-084')));
  // the hounds (Session 1107): OG-065's black wolfhound, a plan, standing taller at the withers than the grey wolf and its chest deeper than its loin
  const hounds = await page.evaluate(async () => { const K = await import('./creatures.js'); return (K.HOUNDS || []).map(k => { const C = K.build(K.genome(k, k + ':check')), W = K.build(K.genome('wolf', 'wolf:check'));
    const wither = C => { K.pose(C, 0); C.rig.updateMatrixWorld(true); const p = new C.rig.position.constructor(); let y = 0; for (const L of C.B.legs) { L.bones[0].getWorldPosition(p); y = Math.max(y, p.y); } return y; };
    const sp = K.PLANS[k].parts.find(p => p[0] === 'spine')[1]; return { k, ok: !!K.PLANS[k], src: K.PLANS[k].src, wither: +wither(C).toFixed(3), wolf: +wither(W).toFixed(3), chest: sp.r[2], loin: sp.r[1] }; }); });
  check(`the hounds: ${hounds.map(c => c.k).join(', ')} from OG-065, standing ${hounds.map(c => (c.wither * 100).toFixed(0)).join(', ')} cm at the top of the legs against the grey wolf's ${(hounds[0]?.wolf * 100).toFixed(0)}, the chest deeper than the loin`, hounds.length === 1 && hounds.every(c => c.ok && c.src.includes('OG-065') && c.wither > c.wolf * 1.08 && c.chest > c.loin * 1.4), hounds);
  // sitting (Session 1114): the hound sits by Garrick's chair. The forefeet stay where it stands, the body is pitched nose-up until
  // the haunch is on the ground (the lowest of the spine's, thighs' and shins' flesh 5 mm off it), the hind toes are down ahead of the hips,
  // nothing but the toe pads is under the ground (the same pads as standing), nothing else deeper than it stands (a snowshoe paw sinks a little), and the head is above the withers
  // every plan that sits (Session 1115: the wolves, the fox and the Hollowcat besides the hound), each held to the same
  const sitters = await page.evaluate(async () => { const K = await import('./creatures.js'); return Object.keys(K.PLANS).filter(k => K.PLANS[k].gaits.includes('sit')); });
  for (const sp of sitters.filter(k => !only || only.split(',').includes(k))) { const sit = await page.evaluate(async sp => { const K = await import('./creatures.js'), C = K.build(K.genome(sp, sp + ':check')), out = {};
    for (const gait of ['stand', 'sit', 'lie'].filter(g => C.plan.gaits.includes(g))) { C.gait = gait; const err = K.pose(C, 0); C.rig.updateMatrixWorld(true); const M = C.meshes[0], inv = C.rig.matrixWorld.clone().invert(), p = new C.rig.position.constructor(), si = M.geometry.attributes.skinIndex; M.skeleton.update();
      const body = new Set([...C.B.spineNames, ...C.B.legs.filter(L => L.at === 0).flatMap(L => L.names.slice(0, 2))]); let haunch = 1e9, rest = 1e9, pads = 0;
      for (let v = 0; v < M.geometry.attributes.position.count; v++) { M.getVertexPosition(v, p); p.applyMatrix4(M.matrixWorld).applyMatrix4(inv); const nm = C.bones[si.getX(v)].name; if (body.has(nm)) haunch = Math.min(haunch, p.y); if (/_3$/.test(nm)) { if (p.y < -.01) pads++; } else rest = Math.min(rest, p.y); }
      const at = b => { const q = new C.rig.position.constructor(); b.getWorldPosition(q); return C.rig.worldToLocal(q); }, feet = C.B.legs.map(L => at(L.bones[L.bones.length - 1]));
      out[gait] = { pitch: gait === "stand" ? 0 : +C.sitA.toFixed(3), err: +err.toFixed(4), haunch: +haunch.toFixed(4), rest: +rest.toFixed(4), pads, fore: feet.filter((f, i) => C.B.legs[i].at === 1).map(f => [+f.x.toFixed(3), +f.z.toFixed(3)]), hindZ: Math.min(...feet.filter((f, i) => C.B.legs[i].at === 0).map(f => f.z)), hipZ: Math.max(...C.B.legs.filter(L => L.at === 0).map(L => at(L.bones[0]).z)), head: +at(C.byName.head).y.toFixed(3), wither: +Math.max(...C.B.legs.filter(L => L.at === 1).map(L => at(L.bones[0]).y)).toFixed(3) }; }
    out.pitch = out.sit.pitch; return out; }, sp);
    const S = sit.sit, T = sit.stand; console.log('sit', sp, JSON.stringify(sit));
    check(`${sp} sits: pitched ${(-sit.pitch * 180 / Math.PI).toFixed(0)}° nose-up about the shoulders, the forefeet where it stands, the haunch and shins ${(S.haunch * 1000).toFixed(1)} mm off the ground (${(T.haunch * 100).toFixed(0)} cm standing), the hind toes ${((S.hindZ - S.hipZ) * 100).toFixed(0)} cm ahead of the hips, nothing under the ground but the toe pads (${S.pads}, ${T.pads} standing; the rest's lowest ${(S.rest * 1000).toFixed(1)} mm, ${(T.rest * 1000).toFixed(1)} standing), the head ${(S.head * 100).toFixed(0)} cm up against the withers' ${(S.wither * 100).toFixed(0)}`,
      S.err < .01 && S.haunch > .003 && S.haunch < .008 && T.haunch > 10 * S.haunch && JSON.stringify(S.fore) === JSON.stringify(T.fore) && S.hindZ > S.hipZ && S.pads <= T.pads && S.rest > Math.min(T.rest, 0) - .001 && S.head > S.wither && sit.pitch < -.3 && sit.pitch > -1.3, sit);
    // lying (Session 1117, the wolfhound): lowered level, the forefeet laid forward of where it stands, the underside on the ground
    // (Session 1122: every sitter lies; the forefeet's reach ahead is a twentieth of the standing withers, not the hound's 5 cm)
    const Lr = sit.lie; if (Lr) check(`${sp} lies down: level (pitch ${Lr.pitch}), the withers lowered from ${(T.wither * 100).toFixed(0)} to ${(Lr.wither * 100).toFixed(0)} cm, the forefeet ${((Lr.fore[0][1] - T.fore[0][1]) * 100).toFixed(0)} cm ahead of where it stands, the hind toes ${((Lr.hindZ - Lr.hipZ) * 100).toFixed(0)} cm ahead of the hips, the belly and haunch ${(Lr.haunch * 1000).toFixed(1)} mm off the ground, nothing but the toe pads under it (${Lr.pads}, ${T.pads} standing; the rest's lowest ${(Lr.rest * 1000).toFixed(1)} mm), the head ${(Lr.head * 100).toFixed(0)} cm up`,
      Lr.err < .01 && Lr.pitch === 0 && Lr.wither < .6 * T.wither && Lr.fore.every((f, i) => f[1] > T.fore[i][1] + .05 * T.wither) && Lr.hindZ > Lr.hipZ && Lr.haunch > .003 && Lr.haunch < .05 && Lr.pads <= T.pads && Lr.rest > Math.min(T.rest, 0) - .001 && Lr.head > Lr.wither, Lr); }
  check(`sitting plans: ${sitters.join(', ')}`, sitters.includes('wolfhound') && sitters.length >= 5, sitters);
  check('no page errors', errs.length === 0, errs.slice(0, 3)); await page.close(); }
if (process.argv.includes('--shots')) {
  const shot = async (name, q, w = 1920, h = 1080) => { const page = await browser.newPage({ viewport: { width: w, height: h } }); const errs = []; page.on('pageerror', e => errs.push(String(e)));
    const t0 = Date.now(); await page.goto(`http://localhost:${port}/creatures.html?still&w=${w}&h=${h}&${q}`, { timeout: 900000 }); await page.waitForFunction(() => window.__done || window.__err, null, { timeout: 900000 });
    await page.evaluate(() => document.getElementById('note').style.display = 'none'); const url = await page.evaluate(() => document.querySelector('canvas').toDataURL('image/jpeg', .9));
    fs.writeFileSync(path.join(here, 'creatures-' + name + '.jpg'), Buffer.from(url.split(',')[1], 'base64')); console.log('shot', name, ((Date.now() - t0) / 1000).toFixed(0) + 's', errs.slice(0, 3)); await page.close(); };
  const list = (arg('plans') || '').split(',').filter(Boolean);
  if (!list.length || process.argv.includes('--line')) await shot('line', 'view=line', 2400, 800);
  // --sheet=NAME (Session 853): the listed plans side by side on the ruled floor, as creatures-NAME.jpg
  const xq = arg('q') ? '&' + arg('q') : '', tag = arg('tag') ? '-' + arg('tag') : '';
  if (arg('sheet') && list.length) await shot(arg('sheet'), 'view=line&plans=' + list.join(',') + xq, 2400, 800);
  if (process.argv.includes('--sheet-only')) list.length = 0;
  for (const plan of list) { await shot(plan + tag, `view=one&plan=${plan}${xq}`, 1280, 720); if (process.argv.includes('--bones')) await shot(plan + tag + '-bones', `view=one&plan=${plan}&bones${xq}`, 1280, 720); }
}
await browser.close(); srv.close(); console.log(fails ? `${fails} FAILED` : 'all passed'); process.exit(fails ? 1 : 0);
