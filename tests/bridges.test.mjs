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
