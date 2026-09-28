// The world's rocks (Session 264, H.5, Michael's A on Session 228): boulders, outcrops and clusters from a noise-shaped,
// fracture-cut sphere, dressed by biome, one instanced mesh per kind a chunk, in place of two dodecahedra.
import { boot, check } from './lib/game.mjs';
import fs from 'fs';
const g = await boot(); const { page } = g;
await g.intoWorld();
fs.mkdirSync('tests/out', { recursive: true });
await g.spin(null, 60);
const r = await page.evaluate(() => { const kinds = {}; let old = 0, n = 0, tris = 0, near = null;
  for (const ch of WORLD.chunkList()) ch.group.children.forEach(o => { if (!o.isInstancedMesh || !o.userData.scatter) return; const k = o.userData.scatter; if (k === 'rock') old++;
    if (!/^rock_/.test(k)) return; const t = o.geometry.attributes.position.count / 3; kinds[k] = kinds[k] || { tris: t, count: 0, colours: !!o.geometry.attributes.color }; kinds[k].count += o.count; n += o.count; tris += t * o.count;
    const m = new THREE.Matrix4(), v = new THREE.Vector3(); for (let i = 0; i < o.count; i++) { o.getMatrixAt(i, m); v.setFromMatrixPosition(m); const d = Math.hypot(v.x - px, v.z - pz); if (!near || d < near.d) near = { d, x: v.x, z: v.z, k }; } });
  return { kinds, old, n, tris, near }; });
console.log(JSON.stringify(r));
const K = Object.entries(r.kinds);
check('the old dodecahedron rock is gone from the loaded chunks', r.old === 0, r.old);
check('rocks are loaded near the start, of more than one kind', r.n > 5 && new Set(K.map(([k]) => k.split('_')[2])).size >= 2, Object.fromEntries(K.map(([k, v]) => [k, v.count])));
check('each kind is vertex-coloured: a boulder or an outcrop about 320 triangles, a cluster about 1,280', K.every(([k, v]) => v.colours && (k.endsWith('cluster') ? v.tris === 1280 : v.tris === 320)), Object.fromEntries(K.map(([k, v]) => [k, v.tris])));
// every dressing and kind builds, and the dressings differ
const all = await page.evaluate(() => { const out = {}; for (const d of ['moor', 'forest', 'fen', 'dunes', 'wastes', 'tundra']) { const k = WORLD.rockProto(d, 'boulder'); const g = WORLD.treeProtos()[k]; const c = g.attributes.color; let r = 0, gg = 0, b = 0; for (let i = 0; i < c.count; i++) { r += c.getX(i); gg += c.getY(i); b += c.getZ(i); }
    out[d] = [r, gg, b].map(v => +(v / c.count).toFixed(3)); WORLD.rockProto(d, 'outcrop'); WORLD.rockProto(d, 'cluster'); } return out; });
console.log(JSON.stringify(all));
check('the six dressings bake, each its own colour (the dunes warm, the wastes dark, the tundra pale-topped)', all.dunes[0] > all.dunes[2] + .08 && all.wastes[0] < all.moor[0] - .1 && all.tundra[2] > all.moor[2], all);
// a picture of the nearest rocks
if (r.near) { const shot = await page.evaluate(n => { const y = WORLD.worldH(n.x, n.z); forceTime(12); const cv = REN.domElement, cam = new THREE.PerspectiveCamera(45, cv.width / cv.height, .1, 300);
    cam.position.set(n.x + 4, y + 2.4, n.z + 4); cam.lookAt(n.x, y + .4, n.z); CAM.position.copy(cam.position); for (let i = 0; i < 3; i++) WORLD.tick(1 / 60, performance.now()); WORLD.scene.updateMatrixWorld(true); const f = WORLD.scene.fog; WORLD.scene.fog = null; REN.render(WORLD.scene, cam); WORLD.scene.fog = f;
    const o = document.createElement('canvas'); o.width = cv.width; o.height = cv.height; o.getContext('2d').drawImage(cv, 0, 0); return o.toDataURL(); }, r.near);
  fs.writeFileSync('tests/out/rocks.png', Buffer.from(shot.split(',')[1], 'base64')); }
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
