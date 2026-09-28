// node docs/prototypes/rocks/shoot.mjs -> docs/prototypes/rocks-*.png
// Session 228: the world's rocks (backlog H.5: "trees and rocks — more silhouette, less cube"). Today every rock in the world
// is one shape: two jittered dodecahedra, 72 triangles, one grey. The prototype builds three kinds from a noise-displaced
// sphere, shaded at the bake: a boulder (rounded, cracked, darker in its hollows), an outcrop (a slab in layers, the
// strata banded), a cluster (a boulder with smaller stones half sunk around it); and dresses each by biome: lichen on the
// moor, moss in the forest and fen, sandstone in the dunes, basalt in the wasteland, snow on the tundra's tops.
// Built in the game with SK and plain meshes (the instancing takes one merged geometry per kind): index.html is unchanged.
import { boot } from '../../../tests/lib/game.mjs';
import fs from 'fs'; import path from 'path'; import { fileURLToPath } from 'url';
const here = path.dirname(fileURLToPath(import.meta.url));
const g = await boot(); const { page } = g;
await g.intoWorld();
const shots = await page.evaluate(() => { const cv = REN.domElement, sc = WORLD.scene; const bx = px + 300, bz = pz, y = WORLD.worldH(bx, bz) + 60;
  const cam = new THREE.PerspectiveCamera(32, cv.width / cv.height, .05, 200);
  const MAT = new THREE.MeshLambertMaterial({ vertexColors: true });
  // value noise in 3D, smooth
  const hsh = (x, y, z, s) => { const v = Math.sin(x * 127.1 + y * 311.7 + z * 74.7 + s * 17.3) * 43758.5453; return v - Math.floor(v); };
  const vn = (x, y, z, s) => { const X = Math.floor(x), Y = Math.floor(y), Z = Math.floor(z), fx = x - X, fy = y - Y, fz = z - Z; const u = t => t * t * (3 - 2 * t); let r = 0;
    for (let i = 0; i < 2; i++) for (let j = 0; j < 2; j++) for (let k = 0; k < 2; k++) r += hsh(X + i, Y + j, Z + k, s) * (i ? u(fx) : 1 - u(fx)) * (j ? u(fy) : 1 - u(fy)) * (k ? u(fz) : 1 - u(fz)); return r; };
  const fbm = (x, y, z, s) => vn(x, y, z, s) * .55 + vn(x * 2.1, y * 2.1, z * 2.1, s + 3) * .3 + vn(x * 4.3, y * 4.3, z * 4.3, s + 7) * .15;
  // a rock: an icosphere pushed out by noise (the big shape) and a sharper noise (cracks and edges), squashed, sunk a little;
  // coloured per vertex: the hollows darker, the tops take the biome's dressing, strata bands if layered
  const rockGeo = (o) => { const g0 = new THREE.IcosahedronGeometry(1, o.detail || 3); const cuts = []; for (let c = 0; c < (o.cuts || 6); c++) { const th = hsh(c, 1, 2, o.seed) * Math.PI * 2, ph = (hsh(c, 3, 4, o.seed) - .35) * 2.2; cuts.push([Math.cos(th) * Math.cos(ph), Math.sin(ph), Math.sin(th) * Math.cos(ph), .55 + hsh(c, 5, 6, o.seed) * .22]); } const g1 = g0.index ? g0.toNonIndexed() : g0; const p = g1.attributes.position; const disp = new Float32Array(p.count);
    // weld by position so shared corners move together
    for (let i = 0; i < p.count; i++) { const x = p.getX(i), yy = p.getY(i), z = p.getZ(i); const big = fbm(x * 1.3 + 5, yy * 1.3, z * 1.3, o.seed) - .5; const crack = Math.abs(vn(x * 5, yy * 5, z * 5, o.seed + 9) - .5) * 2;
      let k = 1 + big * (o.lump || .7) - (1 - crack) * (1 - crack) * .08;
      // fracture planes: the stone split flat where a plane cuts it, so it has faces and edges, not a blob
      for (const [dx, dy, dz, off] of cuts) { const d = (x * dx + yy * dy + z * dz) * k; if (d > off) k *= off / d; }
      // strata: the slab stepped in layers, each ledge a little proud of the one above
      if (o.layers) { const t = (yy + 1) * o.layers / 2, f = t - Math.floor(t); k *= 1 - .13 * Math.max(0, (f - .65) / .35) + .04 * (Math.floor(t) % 2); }
      disp[i] = k; p.setXYZ(i, x * k * (o.sx || 1), yy * k * (o.sy || .7), z * k * (o.sz || 1)); }
    // normals smoothed across the welded corners only between faces within 38° of each other: the stone reads rounded
    // where it is worn and keeps a hard edge where a fracture plane meets it
    { const fn = [], at = new Map(), a = new THREE.Vector3(), b2 = new THREE.Vector3(), c2 = new THREE.Vector3(); const key = i => Math.round(p.getX(i) * 1e4) + ',' + Math.round(p.getY(i) * 1e4) + ',' + Math.round(p.getZ(i) * 1e4);
      for (let i = 0; i < p.count; i += 3) { a.fromBufferAttribute(p, i); b2.fromBufferAttribute(p, i + 1); c2.fromBufferAttribute(p, i + 2); const n0 = new THREE.Vector3().subVectors(c2, b2).cross(a.clone().sub(b2)).normalize(); fn.push(n0);
        for (let j = 0; j < 3; j++) { const kk = key(i + j); (at.get(kk) || at.set(kk, []).get(kk)).push(n0); } }
      const nn = new Float32Array(p.count * 3), v = new THREE.Vector3(); for (let i = 0; i < p.count; i++) { const own = fn[Math.floor(i / 3)]; v.set(0, 0, 0); for (const f of at.get(key(i))) if (f.dot(own) > .79) v.add(f); v.normalize(); nn[i * 3] = v.x; nn[i * 3 + 1] = v.y; nn[i * 3 + 2] = v.z; }
      g1.setAttribute('normal', new THREE.BufferAttribute(nn, 3)); } const n = g1.attributes.normal; const col = new Float32Array(p.count * 3); const c = new THREE.Color();
    for (let i = 0; i < p.count; i++) { const yy = p.getY(i), ny = n.getY(i); c.set(o.base); const sp = fbm(p.getX(i) * 3, yy * 3, p.getZ(i) * 3, o.seed + 1);
      c.multiplyScalar(.82 + sp * .36); if (disp[i] < 1) c.multiplyScalar(.7 + disp[i] * .3); if (yy < -.1) c.multiplyScalar(.85);
      if (o.layers) { const b = Math.floor((yy / (o.sy || .7) + 1) * o.layers / 2) % 2; c.lerp(new THREE.Color(o.band), b * .6); }
      if (o.top && ny > .45) { const m = (ny - .45) / .55 * (fbm(p.getX(i) * 2.5, yy, p.getZ(i) * 2.5, o.seed + 4) > (o.topCover || .45) ? 1 : 0); c.lerp(new THREE.Color(o.top), Math.min(1, m)); }
      if (o.lichen && ny > -.2) { const l = vn(p.getX(i) * 9, yy * 9, p.getZ(i) * 9, o.seed + 5); if (l > .8) c.lerp(new THREE.Color(o.lichen), .55); }
      col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b; }
    g1.setAttribute('color', new THREE.BufferAttribute(col, 3)); g1.translate(0, (o.sy || .7) * .55, 0); return g1; };
  const rock = (o, s) => { const m = new THREE.Mesh(rockGeo(o), MAT); m.scale.setScalar(s || 1); if (o.layers) { const t = new THREE.Group(); m.rotation.z = .22; m.position.y = -.08 * (s || 1); t.add(m); return t; } return m; };
  const cluster = (o, s) => { const G = new THREE.Group(); G.add(rock(o, 1)); [[1.05, .1, .35, .42], [-.8, -.1, .6, .3], [.3, -.15, -.95, .36]].forEach(([x, yy, z, r], i) => { const m = rock(Object.assign({}, o, { seed: o.seed + i * 11 + 1, sy: .75 }), r); m.position.set(x, yy * r, z); G.add(m); }); G.scale.setScalar(s || 1); return G; };
  // today's rock, rebuilt as the world builds it: two dodecahedra, one grey, jittered per vertex
  const today = s => { const G = new THREE.Group(); const m = new THREE.MeshLambertMaterial({ color: 0x77726a, flatShading: true }); const a = new THREE.Mesh(new THREE.DodecahedronGeometry(1, 0), m); const b = new THREE.Mesh(new THREE.DodecahedronGeometry(.7, 0), new THREE.MeshLambertMaterial({ color: 0x6a655c, flatShading: true })); b.position.set(.7, -.2, .3); G.add(a, b); G.scale.setScalar(s); return G; };
  const B = {
    moor: { base: 0x7a766c, lichen: 0xb8b060, top: null, band: 0x5a564c },
    forest: { base: 0x6a6860, top: 0x3e5a24, topCover: .38, lichen: 0x8a9a6a, band: 0x4a4840 },
    fen: { base: 0x5a5a50, top: 0x4a6a2a, topCover: .3, lichen: null, band: 0x3a3a30 },
    dunes: { base: 0xc0a070, band: 0x9a7040, lichen: null, top: null },
    wasteland: { base: 0x3a3634, band: 0x2a2624, lichen: null, top: null },
    tundra: { base: 0x6e7278, top: 0xeef2f6, topCover: .25, lichen: 0x9aa4a0, band: 0x50545a } };
  const out = {};
  const grab = (key, objs, cp, look) => { cam.position.set(bx + cp[0], y + cp[1], bz + cp[2]); cam.lookAt(bx + look[0], y + look[1], bz + look[2]); sc.updateMatrixWorld(true); REN.render(sc, cam);
    const o = document.createElement('canvas'); o.width = cv.width; o.height = cv.height; o.getContext('2d').drawImage(cv, 0, 0); out[key] = o.toDataURL(); objs.forEach(x => sc.remove(x)); };
  const put = (o, x, z, ry) => { o.position.set(bx + x, y + (o.position.y || 0), bz + z); o.rotation.y = ry || 0; sc.add(o); return o; };
  const floor = (col, w, d, x, z) => { const f = new THREE.Mesh(new THREE.PlaneGeometry(w, d), new THREE.MeshLambertMaterial({ color: col })); f.rotation.x = -Math.PI / 2; f.position.set(bx + (x || 0), y + .001, bz + (z || 0)); sc.add(f); return f; };
  const tris = {}; const count = m => { let t = 0; m.traverse(o => { if (o.isMesh) t += o.geometry.attributes.position.count / 3; }); return t; };
  forceTime(11);
  // 1. the three kinds against today's, moor stone
  let objs = [floor(0x6a7048, 30, 20)];
  objs.push(put(today(1), -4.5, 0, .4));
  const bo = rock(Object.assign({ seed: 3 }, B.moor), 1.15); objs.push(put(bo, -1.6, 0, .3)); tris.boulder = count(bo);
  const oc = rock(Object.assign({ seed: 8, sy: .6, sx: 1.5, sz: 1.1, layers: 6, lump: .4 }, B.moor), 1.1); objs.push(put(oc, 1.5, .2, .8)); tris.outcrop = count(oc);
  const cl = cluster(Object.assign({ seed: 12 }, B.moor), .95); objs.push(put(cl, 4.6, 0, 1.1)); tris.cluster = count(cl); tris.today = count(today(1));
  grab('kinds', objs, [0, 2.6, 9.5], [0, .5, 0]);
  // 2. by biome: each a boulder and an outcrop on its ground
  const G2 = [['moor', 0x6a7048], ['forest', 0x3e5a2a], ['fen', 0x4e5a3a], ['dunes', 0xc8b27a], ['wasteland', 0x4a4038], ['tundra', 0xd8dce0]]; objs = [];
  G2.forEach(([b, gc], i) => { const x = -6.25 + i * 2.5; objs.push(floor(gc, 2.5, 14, x, -3)); objs.push(put(rock(Object.assign({ seed: 20 + i }, B[b]), .8), x - .3, .3, i));
    objs.push(put(rock(Object.assign({ seed: 40 + i, sy: .6, sx: 1.4, sz: 1, layers: 6, lump: .4 }, B[b]), .55), x + .5, -.9, i * 2)); });
  grab('biomes', objs, [0, 3.2, 10.5], [0, .3, -.3]);
  // 3. a hillside's scatter: today's (left) and the proposal (right), the same places and sizes
  objs = [floor(0x5e6a40, 40, 24)]; const R = (i, k) => { const v = Math.sin(i * 91.3 + k * 17.1) * 43758.5; return v - Math.floor(v); };
  for (let i = 0; i < 14; i++) { const x = R(i, 1) * 7 + .5, z = R(i, 2) * 10 - 6, s = .35 + R(i, 3) * .8, r = R(i, 4) * 6;
    objs.push(put(today(s), -x - .5, z, r)); const k = R(i, 5); const o = Object.assign({ seed: 60 + i }, i % 3 ? B.moor : B.forest);
    objs.push(put(k < .5 ? rock(o, s * 1.1) : k < .8 ? rock(Object.assign(o, { sy: .6, sx: 1.4, sz: 1, layers: 6, lump: .4 }), s) : cluster(o, s * .85), x + .5, z, r)); }
  grab('scatter', objs, [0, 4.5, 11], [0, 0, -2]);
  out.tris = JSON.stringify(tris); return out; });
console.log('triangles', shots.tris); delete shots.tris;
for (const [k, url] of Object.entries(shots)) fs.writeFileSync(path.join(here, '..', 'rocks-' + k + '.png'), Buffer.from(url.split(',')[1], 'base64'));
console.log('errors', g.errs); await g.close();
