// Town walls and gate towers in detail (Session 249, H.5, Michael's A on buildings): every wall tier (fence, log
// palisade, stone, dressed stone) and both gate towers build a detailed piece near with the old boxes as the distant
// copy, per segment, baked with the houses by place; the wall's collision is what it was.
import { boot, check } from './lib/game.mjs';
import fs from 'fs';
const g = await boot(); const { page } = g;
await g.intoWorld();
fs.mkdirSync('tests/out', { recursive: true });
// the four tiers on a slope's worth of ground (one end .8 above the middle, the other .6 below), old above and new below
const r = await page.evaluate(() => { const C = x => new THREE.Color(x), rng = s => { let a = s; return () => ((a = (a * 16807) % 2147483647) / 2147483647); };
  const tiers = { fence: [1.15, .3, 0x5a4a30, 0x4a3a22], logs: [3.2, .5, 0x5a4222, 0x4a3418], stone: [4.6, 1.3, 0x8a8478, 0x7a7468], dressed: [5.6, 1.5, 0xbfb6a6, 0xd6cfc0] };
  const out = { seg: {}, tower: {} }, geos = {};
  for (const [k, [H, d, w, c]] of Object.entries(tiers)) { const geo = WORLD.wallSegHi(k, 20, H, d, C(w), C(c), .8, -.6, rng(7)); geo.computeBoundingBox(); const bb = geo.boundingBox;
    out.seg[k] = { tris: geo.attributes.position.count / 3, top: +bb.max.y.toFixed(2), bottom: +bb.min.y.toFixed(2), len: +(bb.max.x - bb.min.x).toFixed(2), colours: !!geo.attributes.color }; geos[k] = geo;
    if (k !== 'fence') { const t = WORLD.gateTowerHi(k, H, C(c), C(0x3a3a46), rng(9)); t.computeBoundingBox(); out.tower[k] = { tris: t.attributes.position.count / 3, top: +t.boundingBox.max.y.toFixed(2) }; geos['t' + k] = t; } }
  // a picture: the four tiers in a row, a tower at each walled tier's end
  forceTime(12); const sc = WORLD.scene, cv = REN.domElement, bx = px + 500, bz = pz, y = WORLD.worldH(bx, bz) + 90, tmp = [];
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(260, 120), new THREE.MeshLambertMaterial({ color: 0x6a7a48 })); floor.rotation.x = -Math.PI / 2; floor.position.set(bx, y - .3, bz); tmp.push(floor);
  const mat = new THREE.MeshLambertMaterial({ vertexColors: true }); let x0 = -34;
  for (const k of ['fence', 'logs', 'stone', 'dressed']) { const m = new THREE.Mesh(geos[k], mat); m.position.set(bx + x0, y, bz); tmp.push(m); if (geos['t' + k]) { const t = new THREE.Mesh(geos['t' + k], mat); t.position.set(bx + x0 + 12.5, y, bz + 1); tmp.push(t); } x0 += 23; }
  tmp.forEach(m => sc.add(m)); const cam = new THREE.PerspectiveCamera(40, cv.width / cv.height, .3, 600);
  const snap = () => { sc.updateMatrixWorld(true); REN.render(sc, cam); const o = document.createElement('canvas'); o.width = cv.width; o.height = cv.height; o.getContext('2d').drawImage(cv, 0, 0); return o.toDataURL(); };
  cam.position.set(bx + 4, y + 9, bz - 62); cam.lookAt(bx + 4, y + 2, bz); const lineup = snap();
  cam.position.set(bx + 22, y + 4, bz - 14); cam.lookAt(bx + 12, y + 3, bz); const close = snap();
  tmp.forEach(m => sc.remove(m)); return { out, shots: { lineup, close } }; });
for (const [k, u] of Object.entries(r.shots)) fs.writeFileSync(`tests/out/walls-${k}.png`, Buffer.from(u.split(',')[1], 'base64'));
const o = r.out; console.log(JSON.stringify(o));
check('each tier builds a detailed segment, vertex-coloured, its full length (20)', Object.values(o.seg).every(s => s.colours && Math.abs(s.len - 20) < 1.2), o.seg);
check('the segment reaches down past the lower end\'s ground (-.6) so it does not float on a slope', Object.values(o.seg).every(s => s.bottom < -.6), o.seg);
check('each stays within its old height (+1.3 for the merlons and log points; the fence follows the ground, .8 up at one end)', o.seg.fence.top < .8 + 1.4 && o.seg.logs.top < 3.2 + .85 && o.seg.stone.top < 4.6 + 1.3 && o.seg.dressed.top < 5.6 + 1.3, o.seg);
check('a segment is under 4k triangles', Object.values(o.seg).every(s => s.tris < 4000), Object.fromEntries(Object.entries(o.seg).map(([k, s]) => [k, s.tris])));
check('the gate towers build in detail (a timber watchtower, round towers), under 3k triangles', Object.values(o.tower).every(t => t.tris > 300 && t.tris < 3000), o.tower);
// a walled town in the game: its walls near in detail, far plain; the wall's collision as before
const town = await page.evaluate(() => { const walled = []; for (const t of WORLD.SITES) { if (!t.pad || !['town', 'city', 'village', 'port', 'outpost'].includes(t.kind)) continue; let S = WORLD.settlements.get(t.id); if (!S) S = WORLD.genSettlement(t); if (!S) continue;
    const w = S.sol.filter(q => q.bt === 'wall'); if (w.length) walled.push({ id: t.id, S, w: w.length }); if (walled.length >= 2) break; }
  if (!walled.length) return null; const { id, w } = walled[0];
  // stand in the town and let the loader hold it: a town built here from 1,300 units off can be streamed out in the next
  // tick, and a dropped copy is never touched by houseLod (it failed 1 run in 3 that way; Session 350)
  const opx = px, opz = pz; px = walled[0].S.site.x; pz = walled[0].S.site.z + 4;
  for (let k = 0; k < 900 && !(WORLD.settlements.get(id) && (WORLD.settlements.get(id).lodMeshes || []).length); k++) { WORLD.tick(1 / 60, performance.now()); while (WORLD.jobs.length) { const j = WORLD.jobs.shift(); let more = false; try { more = j.fn(); } catch (e) {} if (more) WORLD.jobs.push(j); } }
  const S = WORLD.settlements.get(id) || walled[0].S; const L = S.lodMeshes || []; const hi = L.filter(m => m.userData.lod === 'hi'), lo = L.filter(m => m.userData.lod === 'lo');
  // (the town's current detailed meshes at each look: a town still building rebakes during the ticks, and the meshes it drops
  // keep whatever visibility they had, which once read as a detailed cluster still shown from 600 away)
  const saved = CAM.position.clone(); const look = () => { WORLD.tick(1 / 60, performance.now()); const S2 = WORLD.settlements.get(id) || S; return (S2.lodMeshes || []).filter(m => m.userData.lod === 'hi' && m.visible).length; };
  CAM.position.set(S.site.x, CAM.position.y, S.site.z); const near = look(); CAM.position.set(S.site.x + 600, CAM.position.y, S.site.z); const far = look(); CAM.position.copy(saved); px = opx; pz = opz; look();
  return { id, live: WORLD.settlements.get(id) === S, walls: w, paired: hi.every(m => lo.some(o => o.userData.ckey === m.userData.ckey)), near, far, hi: hi.length }; });
check('a walled town is found near the start', !!town, town);
if (town) { check('its detailed clusters (walls among them) show near and give way to their plain twins far', town.paired && town.near > 0 && town.far === 0, town); }
// a fort compound's ring and towers (Session 251): the same builders, its old ring the distant copy
// the nearest fort door to the start: go there as the harness goes anywhere, and drain the loader so its compound builds
const fd = await page.evaluate(() => { const out = []; const [hi, hj] = WORLD.cellOf(px, pz); for (let dj = -3; dj <= 3; dj++) for (let di = -3; di <= 3; di++) { let c; try { c = WORLD.getCell(hi + di, hj + dj); } catch (e) { continue; } if (c) for (const e of c.doors) if (e.kind === 'fort_door') out.push({ seed: e.seed, x: e.x, z: e.z, d: Math.hypot(e.x - px, e.z - pz) }); } return out.sort((a, b) => a.d - b.d)[0] || null; });
if (fd) { await page.evaluate(f => goToZone('world', f.x, f.z + 45, 0, 'x'), fd); await page.waitForTimeout(9000); await g.hide();
  await page.evaluate(seed => { for (let k = 0; k < 900 && !WORLD.settlements.has('fort_' + seed); k++) { WORLD.tick(1 / 60, performance.now()); while (WORLD.jobs.length) { const j = WORLD.jobs.shift(); let more = false; try { more = j.fn(); } catch (e) {} if (more) WORLD.jobs.push(j); } } }, fd.seed); }
const fort = !fd ? null : await page.evaluate(seed => { const S = WORLD.settlements.get('fort_' + seed); if (!S || !S.lodMeshes) return { none: seed };
  const L = S.lodMeshes, hi = L.filter(m => m.userData.lod === 'hi'), lo = L.filter(m => m.userData.lod === 'lo'); const R = 27, segs = Math.round(2 * Math.PI * R / 3.2); let want = 0;
  for (let i = 0; i < segs; i++) { const am = (i + .5) / segs * Math.PI * 2; let d = am - Math.PI / 2; d = Math.atan2(Math.sin(d), Math.cos(d)); if (Math.abs(d) >= .16) want++; }
  const cx = S.site.x, cz = S.site.z, saved = CAM.position.clone(); const look = () => { WORLD.tick(1 / 60, performance.now()); const S2 = WORLD.settlements.get('fort_' + seed) || S; return (S2.lodMeshes || []).filter(m => m.userData.lod === 'hi' && m.visible).length; };
  CAM.position.set(cx, CAM.position.y, cz + 40); const near = look(); CAM.position.set(cx + 700, CAM.position.y, cz); const far = look();
  forceTime(12); const cam = new THREE.PerspectiveCamera(55, REN.domElement.width / REN.domElement.height, .3, 600); const y = WORLD.worldH(cx, cz + 50);
  cam.position.set(cx + 14, y + 6, cz + 52); cam.lookAt(cx, y + 3, cz + 20); CAM.position.copy(cam.position); for (let i = 0; i < 3; i++) WORLD.tick(1 / 60, performance.now()); WORLD.scene.updateMatrixWorld(true); const f = WORLD.scene.fog; WORLD.scene.fog = null; REN.render(WORLD.scene, cam); WORLD.scene.fog = f;
  const o = document.createElement('canvas'); o.width = REN.domElement.width; o.height = REN.domElement.height; o.getContext('2d').drawImage(REN.domElement, 0, 0); CAM.position.copy(saved); look();
  let inside = 0, cols = 0; { const m = new THREE.Matrix4(), v = new THREE.Vector3(); WORLD.scene.traverse(o => { if (!o.isInstancedMesh || !o.userData.scatter) return; for (let i = 0; i < o.count; i++) { o.getMatrixAt(i, m); v.setFromMatrixPosition(m); if (Math.hypot(v.x - cx, v.z - cz) < 26) inside++; } });
    for (const ch of WORLD.chunkList()) for (const q of ch.sol) if (Math.hypot(q.cx - cx, q.cz - cz) < 26 && q.rx < 1.5) cols++; }
  return { id: S.site.id, inside, cols, walls: S.sol.filter(q => q.bt === 'wall').length, want, towers: S.sol.filter(q => q.rx === 2 && q.rz === 2).length, paired: hi.every(m => lo.some(o => o.userData.ckey === m.userData.ckey)), hi: hi.length, near, far, shot: o.toDataURL() }; }, fd.seed);
if (fort && fort.shot) { fs.writeFileSync('tests/out/walls-fort.png', Buffer.from(fort.shot.split(',')[1], 'base64')); delete fort.shot; }
check('the fort compound nearest the start builds its ring and towers in detail, each paired with its old self, near shown and far not (Session 251)', fort && fort.paired && fort.near > 0 && fort.far === 0, fort);
check('the fort\'s ring keeps its collision: one wall a segment outside the gate gap, six towers', fort && fort.walls === fort.want && fort.towers === 6, fort);
check('no tree, bush or rock stands inside the fort\'s ring, and no tree collider (Session 252: the chunks were built before the fort\'s stamp)', fort && fort.inside === 0 && fort.cols === 0, fort && { inside: fort.inside, cols: fort.cols });
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
