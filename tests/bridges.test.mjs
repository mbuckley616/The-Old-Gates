// The bridges on the kit (Session 248, H.5, Michael's A on buildings): every river crossing is one vertex-coloured
// stone arch bridge (`bridgeGeo`) where it was a deck, two rails and piers as plain boxes, with the same deck height,
// width and rail collision.
import { boot, check } from './lib/game.mjs';
import fs from 'fs';
const g = await boot(); const { page } = g;
await g.intoWorld();
fs.mkdirSync('tests/out', { recursive: true });
// the cells load through a job queue in real time; drain it so every bridge in reach is built before measuring
await page.evaluate(() => { for (let k = 0; k < 600 && (WORLD.jobs.length || [...WORLD.LOADED.values()].some(L => L.pending)); k++) { WORLD.tick(1 / 60, performance.now());
  while (WORLD.jobs.length) { const j = WORLD.jobs.shift(); let more = false; try { more = j.fn(); } catch (e) {} if (more) WORLD.jobs.push(j); } } });
// S2283 — bridges fall by the systems builder's weekly roll (1 in 30, two weeks), so one near the start can be down on the boot clock:
// every loaded bridge is held whole by hand (`down: false`, the record's override) while this suite measures them
await page.evaluate(() => { worldState.bridges = {}; for (const s of WORLD.SITES) if (s.kind === 'bridge') { worldState.bridges[s.id] = { down: false }; WORLD.bridgeRedraw(s.id); } });
const r = await page.evaluate(() => {
  const sites = WORLD.SITES.filter(s => s.kind === 'bridge'); const meshes = WORLD.scene.children.filter(o => o.userData.bridge);
  const each = sites.map(s => { const m = meshes.find(o => Math.hypot(o.position.x - s.x, o.position.z - s.z) < .01); if (!m) return { none: true };
    const geo = m.geometry; geo.computeBoundingBox(); const bb = geo.boundingBox; const rails = WORLD.STATIC_SOL.filter(q => Math.abs(q.rz - s.bridge.len / 2) < .01 && Math.hypot(q.cx - s.x, q.cz - s.z) < 3);
    return { tris: geo.attributes.position.count / 3, colours: !!geo.attributes.color, vc: m.material.vertexColors === true, w: +(bb.max.x - bb.min.x).toFixed(2), topY: +bb.max.y.toFixed(2), bottom: +bb.min.y.toFixed(2), len: +(bb.max.z - bb.min.z).toFixed(2), wantLen: +s.bridge.len.toFixed(2), rails: rails.length, deckY: +(m.position.y - s.bridge.y).toFixed(3), shadow: m.castShadow, children: m.children.length };
  });
  // the deck's walking face: the highest surface under the middle of the deck is the setts at .22–.28
  const ray = new THREE.Raycaster(); const m0 = meshes[0]; let deck = null; if (m0) { m0.updateMatrixWorld(true); ray.set(new THREE.Vector3(m0.position.x, m0.position.y + 5, m0.position.z), new THREE.Vector3(0, -1, 0)); const hit = ray.intersectObject(m0)[0]; deck = hit ? +(hit.point.y - m0.position.y).toFixed(3) : null; }
  // arches: a ray across the bridge, just under the deck at mid-span, passes through the vault's opening
  const shots = {};
  const snap = () => { const cv = REN.domElement, o = document.createElement('canvas'); o.width = cv.width; o.height = cv.height; o.getContext('2d').drawImage(cv, 0, 0); return o.toDataURL(); };
  forceTime(12);
  if (m0) { const s = sites.find(q => Math.hypot(q.x - m0.position.x, q.z - m0.position.z) < .01); const a = s.bridge.ang, d = 20; const cam = new THREE.PerspectiveCamera(50, REN.domElement.width / REN.domElement.height, .3, 600);
    const sx = Math.cos(a), sz = -Math.sin(a); cam.position.set(m0.position.x + sx * d + Math.sin(a) * 8, m0.position.y + 4, m0.position.z + sz * d + Math.cos(a) * 8); cam.lookAt(m0.position.x, m0.position.y - .5, m0.position.z);
    CAM.position.copy(cam.position); WORLD.tick(1 / 60, performance.now()); WORLD.scene.updateMatrixWorld(true); const fog = WORLD.scene.fog; WORLD.scene.fog = null; REN.render(WORLD.scene, cam); WORLD.scene.fog = fog; shots.ingame = snap(); }
  // staged: a bridge on three piers (at −10, 0 and 10 along it) over water on a plain field, and the view along the deck
  const sc = WORLD.scene, bx = px + 500, bz = pz, y = WORLD.worldH(bx, bz) + 90; const mat = new THREE.MeshLambertMaterial({ vertexColors: true }); const tmp = [];
  const water = new THREE.Mesh(new THREE.PlaneGeometry(200, 120), new THREE.MeshLambertMaterial({ color: 0x3a5a6a })); water.rotation.x = -Math.PI / 2; water.position.set(bx, y - 2.5, bz); tmp.push(water);
  for (const e of [-1, 1]) { const bank = new THREE.Mesh(new THREE.BoxGeometry(40, 6, 80), new THREE.MeshLambertMaterial({ color: 0x6a7a48 })); bank.position.set(bx + e * 32, y + .3 - 3, bz); tmp.push(bank); }
  const b = new THREE.Mesh(WORLD.bridgeGeo(30, 4.2, 7), mat); b.position.set(bx, y + .3, bz); b.rotation.y = Math.PI / 2; tmp.push(b);
  tmp.forEach(m => sc.add(m)); const cam = new THREE.PerspectiveCamera(45, REN.domElement.width / REN.domElement.height, .3, 500);
  cam.position.set(bx + 8, y + 3, bz + 30); cam.lookAt(bx, y - .5, bz); sc.updateMatrixWorld(true); REN.render(sc, cam); shots.staged = snap();
  cam.position.set(bx - 17, y + 2.2, bz + .6); cam.lookAt(bx + 10, y + .5, bz); REN.render(sc, cam); shots.deck = snap();
  const cross = new THREE.Raycaster(new THREE.Vector3(bx + 5, y + .3 - 1.2, bz + 20), new THREE.Vector3(0, 0, -1)); b.updateMatrixWorld(true); const through = cross.intersectObject(b).length;
  const solid = new THREE.Raycaster(new THREE.Vector3(bx + 5, y + .3 - .2, bz + 20), new THREE.Vector3(0, 0, -1)).intersectObject(b).length;
  tmp.forEach(m => sc.remove(m));
  // a cell unloaded and loaded again builds its bridges again, with their rails (it kept its sites and skipped the
  // meshes). Roads are renumbered on a reload (a roads matter), so the first reload may move a crossing; the second
  // starts from the same roads as the first, so its bridges must be the first reload's, in the same places.
  let reload = null; if (m0) { const s = sites.find(q => Math.hypot(q.x - m0.position.x, q.z - m0.position.z) < .01); const [ci, cj] = s.cell.split(',').map(Number);
    const here = () => { const bs = WORLD.SITES.filter(q => q.kind === 'bridge' && q.cell === s.cell); const ms = WORLD.scene.children.filter(o => o.userData.bridge);
      return { built: bs.filter(q => ms.some(o => Math.hypot(o.position.x - q.x, o.position.z - q.z) < .01)).map(q => Math.round(q.x) + ',' + Math.round(q.z)).sort().join(' '),
        rails: bs.reduce((n, q) => n + WORLD.STATIC_SOL.filter(r => Math.abs(r.rz - q.bridge.len / 2) < .01 && Math.hypot(r.cx - q.x, r.cz - q.z) < 3).length, 0) }; };
    WORLD.unloadCell(s.cell); WORLD.loadCell(ci, cj); const a1 = here(); WORLD.unloadCell(s.cell); const gone = here().built === ''; WORLD.loadCell(ci, cj); const a2 = here();
    reload = { first: a1, gone, second: a2 }; }
  return { n: sites.length, each, deck, through, solid, reload, shots };
});
// Session 2281 (#1587 B, the broken span): a bridge down. The systems builder's state (`worldState.bridges[id].down`) is set by hand here and
// the look asked to draw it again (`bridgeRedraw`): the pier nearest the middle and its two arches are gone, the rails are four solids
// either side of the gap, the ground under the gap is the river's bed (no causeway), the road's strip no longer crosses it, and mended it
// is the bridge it was, to the triangle. A cell loaded with the bridge down builds it down.
const d = await page.evaluate(() => {
  const m = WORLD.scene.children.find(o => o.userData.bridge && o.userData.bridgeId); if (!m) return null; const id = m.userData.bridgeId, S = m.userData.span, s = WORLD.SITE[id];
  const tris0 = m.geometry.attributes.position.count / 3, sx = Math.sin(S.ang), cz = Math.cos(S.ang); const at = u => [m.position.x + sx * u, m.position.z + cz * u];
  const rails = () => WORLD.STATIC_SOL.filter(q => q.bridge === id).length; const hAt = u => +(WORLD.worldH(...at(u)) - m.position.y).toFixed(2);
  const before = { tris: tris0, rails: rails(), mid: hAt(0), end: hAt(S.len / 2 - 1) };
  worldState.bridges[id] = { down: true }; WORLD.bridgeRedraw(id); const gap = m.geometry.userData.gap;
  const mid = gap ? (gap.z0 + gap.z1) / 2 : 0; const bed = +(WORLD.baseH(...at(mid)) - m.position.y).toFixed(2);
  m.updateMatrixWorld(true); const ray = new THREE.Raycaster(new THREE.Vector3(at(mid)[0], m.position.y + 5, at(mid)[1]), new THREE.Vector3(0, -1, 0)); const hit = ray.intersectObject(m)[0];
  // the road's strips near the gap: the highest strip vertex over the gap's middle metre
  let strip = -1e9; for (const ch of WORLD.chunkList()) for (const o of ch.group.children) { if (!o.userData.ribbon) continue; const p = o.geometry.attributes.position;
    for (let i = 0; i < p.count; i++) { const dx = p.getX(i) - m.position.x, dz = p.getZ(i) - m.position.z, u = dx * sx + dz * cz, v = dx * cz - dz * sx; if (Math.abs(u - mid) < 2 && Math.abs(v) < 3) strip = Math.max(strip, p.getY(i) - m.position.y); } }
  const downR = { gap: gap && +(gap.z1 - gap.z0).toFixed(2), tris: m.geometry.attributes.position.count / 3, rails: rails(), mid: hAt(mid), bed, end: hAt(S.len / 2 - 1), deckHit: hit ? +(hit.point.y - m.position.y).toFixed(2) : null, strip: strip === -1e9 ? null : +strip.toFixed(2), gaps: WORLD.bridgeGaps.size };
  // the picture: the broken bridge from the bank, noon, no fog
  const snap = () => { const cv = REN.domElement, o = document.createElement('canvas'); o.width = cv.width; o.height = cv.height; o.getContext('2d').drawImage(cv, 0, 0); return o.toDataURL(); };
  const cam = new THREE.PerspectiveCamera(50, REN.domElement.width / REN.domElement.height, .3, 600); const a = S.ang, dd = 24;
  cam.position.set(m.position.x + Math.cos(a) * dd + sx * 6, m.position.y + 5, m.position.z - Math.sin(a) * dd + cz * 6); cam.lookAt(m.position.x + sx * mid, m.position.y - 1, m.position.z + cz * mid);
  CAM.position.copy(cam.position); WORLD.tick(1 / 60, performance.now()); WORLD.scene.updateMatrixWorld(true); const fog = WORLD.scene.fog; WORLD.scene.fog = null; REN.render(WORLD.scene, cam); const pic = snap();
  WORLD.scene.fog = fog;
  // a cell loaded again with the bridge still down builds it down
  const [ci, cj] = S.cell.split(',').map(Number); WORLD.unloadCell(S.cell); WORLD.loadCell(ci, cj); const m2 = WORLD.scene.children.find(o => o.userData.bridgeId === id);
  const reload = m2 ? { gap: !!m2.geometry.userData.gap, rails: rails() } : null;
  worldState.bridges[id] = { down: false }; const m3 = WORLD.scene.children.find(o => o.userData.bridgeId === id); WORLD.bridgeRedraw(id);
  const mended = { tris: m3.geometry.attributes.position.count / 3, rails: rails(), mid: hAt(0), gaps: WORLD.bridgeGaps.size };
  delete worldState.bridges; return { id, before, down: downR, reload, mended, pic };
});
if (d) { fs.writeFileSync('tests/out/bridge-down.png', Buffer.from(d.pic.split(',')[1], 'base64')); delete d.pic; }
console.log(JSON.stringify(d));
check('a bridge down (Session 2281): its middle pier and two arches gone, the gap at the deck 8 m and more, and fewer triangles than whole', d && d.down.gap >= 8 && d.down.tris < d.before.tris, d && { gap: d.down.gap, tris: [d.before.tris, d.down.tris] });
check('down, its rails are four solids, two either side of the gap', d && d.before.rails === 2 && d.down.rails === 4, d && [d.before.rails, d.down.rails]);
check('down, the ground in the gap is the river\'s bed (no causeway), and at the deck\'s ends it is the road\'s as before', d && d.down.mid === d.down.bed && d.down.mid < d.before.mid - 1.5 && d.down.end === d.before.end, d && { mid: [d.before.mid, d.down.mid, d.down.bed], end: [d.before.end, d.down.end] });
check('down, nothing of the deck over the gap\'s middle (a line straight down meets the stone below the old deck, or nothing), and the road\'s strip no longer crosses it', d && (d.down.deckHit === null || d.down.deckHit < -.5) && (d.down.strip === null || d.down.strip < -1), d && { deckHit: d.down.deckHit, strip: d.down.strip });
check('a cell loaded again with the bridge down builds it down, four rails', d && d.reload && d.reload.gap && d.reload.rails === 4, d && d.reload);
check('mended, it is the bridge it was: the same triangles, two rails, the causeway back and no gap left', d && d.mended.tris === d.before.tris && d.mended.rails === 2 && d.mended.mid === d.before.mid && d.mended.gaps === 0, d && { before: d.before, mended: d.mended });
// Session 2288: the deck is walked on its setts. A bridge's causeway lies 0.5 to 0.8 m under the setts (12 m at a deep crossing), and you
// walked it with the rails at your chest; and the rails were tested as boxes on the world's axes, so one not laid north to south lay
// across its deck. Each intact bridge is walked end to end by the game's own loop, held whole by hand: you reach the far end, your feet
// stay on the setts over the middle (the ramps are the last 2.5 m of each end), and a swimmer under its middle stays in the water.
const w = await page.evaluate(() => { worldState.bridges = {}; for (const s of WORLD.SITES) if (s.kind === 'bridge') { worldState.bridges[s.id] = { down: false }; WORLD.bridgeRedraw(s.id); }
  const raf = window.requestAnimationFrame, rr = REN.render; window.requestAnimationFrame = () => 0; REN.render = () => {}; const out = [];
  try { for (const m of WORLD.scene.children.filter(o => o.userData.bridge)) { const S = m.userData.span, sx = Math.sin(S.ang), cz = Math.cos(S.ang), deck = m.position.y + .28;
    const W = (u, v = 0) => ({ x: m.position.x + sx * u + cz * v, z: m.position.z + cz * u - sx * v }), f = W(-S.len / 2 - 4), T = W(S.len / 2 + 4);
    for (const k in K) K[k] = false; px = f.x; pz = f.z; jumpY = activeTerrainH(px, pz); velY = 0; onGround = true; stamina = maxStamina; ROLL = null; pitch = 0;
    let t = performance.now(), n = 0, lo = 1e9, hi = -1e9; prevT = t;
    for (; n < 2400; n++) { if (Math.hypot(T.x - px, T.z - pz) < .3) break; yaw = Math.atan2(-(T.x - px), -(T.z - pz)); K['KeyW'] = true; t += 1000 / 60; loop(t);
      const u = (px - m.position.x) * sx + (pz - m.position.z) * cz; if (Math.abs(u) < S.len / 2 - 2.6) { lo = Math.min(lo, jumpY - deck); hi = Math.max(hi, jumpY - deck); } }
    for (const k in K) K[k] = false; const left = +Math.hypot(T.x - px, T.z - pz).toFixed(2);
    const mid = W(0); px = mid.x; pz = mid.z; jumpY = WORLD.SEA_Y - 1.4; const under = +(activeTerrainH(px, pz) - deck).toFixed(2);
    const rail = W(0, 2.45), open = W(0, 1.2); out.push({ id: m.userData.bridgeId, ang: +S.ang.toFixed(2), len: +S.len.toFixed(1), ticks: n, left, lo: +lo.toFixed(2), hi: +hi.toFixed(2), under,
      rail: currentZoneSolid(rail.x, rail.z, deck), open: currentZoneSolid(open.x, open.z, deck) }); } }
  finally { window.requestAnimationFrame = raf; REN.render = rr; prevT = 0; for (const k in K) K[k] = false; }
  const id = out.length ? out[0].id : null; if (id) { worldState.bridges[id] = { down: true }; WORLD.bridgeRedraw(id); }
  const plats = id ? ZONES.world.platforms.filter(p => p.bridge === id).length : 0; if (id) { worldState.bridges[id] = { down: false }; WORLD.bridgeRedraw(id); }
  return { out, plats, whole: id ? ZONES.world.platforms.filter(p => p.bridge === id).length : 0, turned: out.filter(o => Math.abs(Math.sin(2 * o.ang)) > .3).length }; });
console.log(JSON.stringify(w));
check('every bridge is walked end to end by the loop, across bridges laid at a slant too (Session 2288)', w.out.length > 0 && w.out.every(o => o.left < .5), w.out.map(o => o.id + ' ' + o.ang + ' left ' + o.left + ' in ' + o.ticks));
check('over the middle your feet are on the setts, within 0.25 (they were 0.5 to 12 m under)', w.out.every(o => o.lo > -.25 && o.hi < .25), w.out.map(o => [o.id, o.lo, o.hi]));
check('a swimmer under a bridge\'s middle stays in the water: the deck is not their ground', w.out.every(o => o.under < -.5), w.out.map(o => [o.id, o.under]));
check('a rail blocks in its own frame and the deck between does not', w.out.every(o => o.rail && !o.open), w.out.map(o => [o.id, o.rail, o.open]));
check('the deck is one walk whole and two either side of a gap', w.whole === 1 && w.plats === 2, { whole: w.whole, down: w.plats });
for (const [k, u] of Object.entries(r.shots)) fs.writeFileSync(`tests/out/bridge-${k}.png`, Buffer.from(u.split(',')[1], 'base64'));
delete r.shots; console.log(JSON.stringify(r));
check('there are bridges in the loaded world', r.n > 0, r.n);
check('every bridge is one vertex-coloured mesh on the kit, casting shadows', r.each.every(e => !e.none && e.colours && e.vc && e.children === 0 && e.shadow), r.each);
check('each is the old deck\'s length and width (5.2 across, the cutwaters beyond; a tenth over a routed river\'s 30–60u span, Session 432)', r.each.every(e => Math.abs(e.len - e.wantLen) < .1 && e.w >= 5.2), r.each);
check('the deck stands where it stood and the rails and their end posts stand about the old rail height (1.1) and no more than 1.95', r.each.every(e => e.deckY === 0 && e.topY > 1.05 && e.topY < 1.95), r.each);
check('the two rails still collide as before', r.each.every(e => e.rails === 2), r.each);
check('the deck\'s walking face is the setts, within .05 of the old deck top (.25)', r.deck !== null && Math.abs(r.deck - .25) < .05, r.deck);
check('a line across just under the deck at mid-span passes through the arch (the vault is open), one at the deck does not', r.through === 0 && r.solid > 0, { through: r.through, solid: r.solid });
check('a bridge is 2k triangles and up, by its span: a pier every 9u (Session 432: the routed rivers are 20–60u across, so 6–11k)', r.each.every(e => e.tris > 2000 && e.tris < 2500 + e.len * 160), r.each.map(e => e.tris + '/' + Math.round(e.len)));
check('a bridge\'s cell unloaded and loaded again builds its bridges again, the same ones in the same places, two rails each (they vanished before)', r.reload && r.reload.gone && r.reload.second.built !== '' && r.reload.second.built === r.reload.first.built && r.reload.second.rails === 2 * r.reload.second.built.split(' ').length, r.reload);
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
