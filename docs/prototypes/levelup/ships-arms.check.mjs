// node docs/prototypes/levelup/ships-arms.check.mjs (Session 2243): ships-arms.js in the test Chromium. For each of the five classes in
// each of the three dresses (15 hulls): fitBallista finds her a place at the bow, on her forecastle where she has one; at its traverse's
// ends and in the middle (−30°, 0, +30°) no triangle of the engine passes through any part of the ship (rails, stays, masts, the deck,
// the bowsprit), each way; it stands on the deck it names; the line of fire, a ray from the bolt's head along the stock out to 40 m, is
// clear of her hull, rail and spars at all three (what it crosses of her rigging is listed); the same build twice is the same. For the
// galleon in the three dresses: twelve guns, six a side, each muzzle 0.5 m or more outside her planking and inside 0.7, each open lid
// clear of its barrel, and the barrels clear of every mast and of each other inside; the shut ports unchanged without o.guns. Budgets:
// the ballista under 2,500 triangles in 7 draws or fewer, the guns under 8,000 in 2.
import { chromium } from 'playwright'; import http from 'http'; import fs from 'fs'; import path from 'path'; import { fileURLToPath } from 'url';
const here = path.dirname(fileURLToPath(import.meta.url));
const types = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json', '.bin': 'application/octet-stream' };
const srv = http.createServer((q, r) => { const f = path.join(here, decodeURIComponent(q.url.split('?')[0])); if (!f.startsWith(here) || !fs.existsSync(f)) { r.writeHead(404); return r.end(); } r.writeHead(200, { 'content-type': types[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(r); }).listen(0);
const port = srv.address().port, launch = { args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] };
if (!fs.existsSync(chromium.executablePath()) && fs.existsSync('/opt/pw-browsers/chromium')) launch.executablePath = '/opt/pw-browsers/chromium';
const browser = await chromium.launch(launch); let fails = 0;
const check = (name, ok, info) => { console.log((ok ? 'PASS ' : 'FAIL ') + name + (info !== undefined ? '  ' + JSON.stringify(info) : '')); if (!ok) fails++; };
const page = await browser.newPage({ viewport: { width: 320, height: 180 } }); const errs = []; page.on('pageerror', e => errs.push(String(e)));
await page.goto(`http://localhost:${port}/ships.html?still&w=320&h=180`); await page.waitForFunction(() => window.__done, null, { timeout: 300000 });
const R = await page.evaluate(async () => { const THREE = await import('three'), K = await import('./ships.js'), A = await import('./ships-arms.js'), P = await import('./pieces.js');
  const tris = (meshes, box) => { const out = []; for (const m of meshes) { m.updateMatrixWorld(true); const pa = m.geometry.attributes.position, ix = m.geometry.index; const n = ix ? ix.count : pa.count;
      for (let i = 0; i < n; i += 3) { const v = [0, 1, 2].map(k => new THREE.Vector3().fromBufferAttribute(pa, ix ? ix.getX(i + k) : i + k).applyMatrix4(m.matrixWorld)); if (box && !v.some(p => box.containsPoint(p)) && !new THREE.Box3().setFromPoints(v).intersectsBox(box)) continue; out.push({ v, name: m.name }); } } return out; };
  const meshOf = T => { const a = []; for (const t of T) for (const p of t.v) a.push(p.x, p.y, p.z); const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(a, 3)); const m = new THREE.Mesh(g, new THREE.MeshBasicMaterial({ side: THREE.DoubleSide })); m.userData.T = T; return m; };
  const rc = new THREE.Raycaster();
  // every edge of A's triangles cast against B: the hits, with what was met
  const cross = (TA, MB, skip) => { const hits = []; for (const t of TA) for (let k = 0; k < 3; k++) { const a = t.v[k], b = t.v[(k + 1) % 3], d = b.clone().sub(a), L = d.length(); if (L < 1e-5) continue;
      rc.set(a, d.normalize()); rc.near = 1e-4; rc.far = L - 1e-4; for (const h of rc.intersectObject(MB)) { const o = MB.userData.T[h.faceIndex]; if (skip && skip(h.point, o, t)) continue; hits.push({ p: h.point.toArray().map(v => +v.toFixed(2)), a: t.name, b: o.name }); break; } } return hits; };
  const own = m => { const a = []; m.traverse(x => { if (x.isMesh) a.push(x); }); return a; };
  const hash = g => { let h = 0; g.traverse(m => { if (!m.isMesh) return; const a = m.geometry.attributes.position.array; for (let i = 0; i < a.length; i += 7) h = (h * 31 + Math.round(a[i] * 1e4)) | 0; }); return h; };
  const build = { sloop: [K.gatelandsSloop, K.markSloop, K.aurenneSloop], cutter: [K.gatelandsCutter, K.markCutter, K.aurenneCutter], caravel: [K.gatelandsCaravel, K.markCaravel, K.aurenneCaravel], cog: [K.gatelandsCog, K.markCog, K.aurenneCog], galleon: [K.gatelandsGalleon, K.markGalleon, K.aurenneGalleon] };
  const out = { bal: [], guns: [] };
  for (const [cls, fs] of Object.entries(build)) for (const f of fs) { const S = f({}, P.stream(cls + ':check')), shipMeshes = own(S.group), rec = { cls, dress: S.dress, at: null, clash: [], fire: [], rig: [], same: true };
    const F = A.fitBallista(S, {}); if (!F) { out.bal.push(rec); continue; } rec.at = { x: F.x, z: F.z, y: F.y, R: F.R, tris: F.tris, draws: F.draws, castle: !!(S.castles && S.castles.fore), bowZ: +(S.L / 2).toFixed(2) };
    S.group.remove(F.group); F.group.geometry; rec.same = hash(F.group) === hash(A.fitBallista(S, { z: F.z, x: F.x }).group); S.group.remove(S.group.children[S.group.children.length - 1]);
    for (const deg of [-30, 0, 30]) { const B = A.fitBallista(S, { z: F.z, x: F.x, yaw: deg * Math.PI / 180 }); S.group.updateMatrixWorld(true); const bm = own(B.group), bb = new THREE.Box3().setFromObject(B.group).expandByScalar(.05);
      const TB = tris(bm), TS = tris(shipMeshes, bb), MB = meshOf(TB), MS = meshOf(TS); const h = [...cross(TB, MS), ...cross(TS, MB)]; if (h.length) rec.clash.push({ deg, n: h.length, first: h.slice(0, 3) });
      // its feet on the deck: a ray down from each sole's end meets the deck within 1 cm under it
      for (const [x, z] of [[.5, 0], [-.5, 0], [0, .5], [0, -.5]]) { rc.set(new THREE.Vector3(F.x + x, F.y + .05, F.z + z), new THREE.Vector3(0, -1, 0)); rc.near = 0; rc.far = .3; const g = rc.intersectObjects(shipMeshes)[0]; if (!g || Math.abs(g.point.y - F.y) > .01) rec.clash.push({ deg, foot: [x, z], deck: g ? +g.point.y.toFixed(3) : null }); }
      // the line of fire from the bolt's head
      const yaw = deg * Math.PI / 180, dir = new THREE.Vector3(Math.sin(yaw), 0, Math.cos(yaw)), o = new THREE.Vector3(0, F.bed, 0.9).applyAxisAngle(new THREE.Vector3(0, 1, 0), yaw).add(new THREE.Vector3(F.x, F.y, F.z));
      rc.set(o, dir); rc.near = 0; rc.far = 40; for (const g of rc.intersectObjects(shipMeshes)) { const k = { deg, m: g.object.name, d: +g.distance.toFixed(2) }; if (['rope', 'sail'].includes(g.object.name)) rec.rig.push(k); else rec.fire.push(k); }
      S.group.remove(B.group); }
    out.bal.push(rec); }
  for (const f of build.galleon) { const shut = f({}, P.stream('galleon:check')), S = f({ guns: true }, P.stream('galleon:check')), G = A.runOutGuns(S), rec = { dress: S.dress, n: G.guns.length, tris: G.tris, draws: G.draws, out: [], lid: 0, inner: [] };
    S.group.updateMatrixWorld(true); const ship = own(S.group).filter(m => m !== G.group.children[0] && m !== G.group.children[1]);
    for (const [e, z, y, mx] of G.guns) { const u = (y - S.keelAt(z)) / (S.sheerAt(z) - S.keelAt(z)), p = S.sect(z, u); rec.out.push(+(Math.abs(mx) - p[0]).toFixed(2)); }
    const TG = tris(own(G.group)).filter(t => t.name === 'metal'), MG = meshOf(TG), TS = tris(ship, new THREE.Box3().setFromObject(G.group).expandByScalar(.1)), MS = meshOf(TS);
    // barrels through the ship: only away from the planking at the port (the gun goes through the hull there by design)
    const atPort = pt => G.guns.some(([e, z, y]) => Math.abs(pt.z - z) < .4 && Math.abs(pt.y - y) < .4 && Math.abs(Math.abs(pt.x) - S.sect(z, (y - S.keelAt(z)) / (S.sheerAt(z) - S.keelAt(z)))[0]) < .12);
    const isLid = n => n === 'lid' || n === 'lidIron'; for (const h of [...cross(TG, MS, (pt, o) => atPort(pt) && !isLid(o.name)), ...cross(TS, MG, (pt, o, t) => atPort(pt) && !isLid(t.name))]) { if (isLid(h.a) || isLid(h.b)) rec.lid++; else rec.inner.push(h); }
    rec.innerN = rec.inner.length; rec.inner = rec.inner.slice(0, 3);
    rec.shutSame = hash(shut.group) === hash(K[S.dress === 'mark' ? 'markGalleon' : S.dress === 'aurenne' ? 'aurenneGalleon' : 'gatelandsGalleon']({}, P.stream('galleon:check')).group);
    out.guns.push(rec); }
  return out; });
for (const b of R.bal) { const n = `${b.dress} ${b.cls}`;
  check(`${n}: a place at the bow` + (b.at && b.at.castle ? ', on her forecastle' : ''), !!b.at && b.at.z > b.at.bowZ * .4, b.at);
  if (!b.at) continue;
  check(`${n}: no triangle of the ballista passes through her, at −30°, 0 and +30°, and it stands on her deck`, !b.clash.length, b.clash.slice(0, 2));
  check(`${n}: its line of fire is clear of her hull, rail and spars to 40 m`, !b.fire.length, { fire: b.fire.slice(0, 3), rig: b.rig.slice(0, 4) });
  check(`${n}: the same build twice`, b.same);
  check(`${n}: under 2,500 triangles in 7 draws or fewer`, b.at.tris < 2500 && b.at.draws <= 7, [b.at.tris, b.at.draws]); }
for (const g of R.guns) { check(`the ${g.dress} galleon: twelve guns, each muzzle 0.5 to 0.7 m outside her planking`, g.n === 12 && g.out.every(v => v >= .5 && v <= .7), g.out);
  check(`the ${g.dress} galleon: no barrel meets an open lid, a mast or another barrel`, g.lid === 0 && g.innerN === 0, { lid: g.lid, inner: g.inner });
  check(`the ${g.dress} galleon: her ports shut without o.guns, as before`, g.shutSame);
  check(`the ${g.dress} galleon: the guns under 8,000 triangles in 2 draws`, g.tris < 8000 && g.draws <= 2, [g.tris, g.draws]); }
check('no page errors', !errs.length, errs.slice(0, 3));
await browser.close(); srv.close(); console.log(fails ? `${fails} FAILED` : 'all passed'); process.exit(fails ? 1 : 0);
