// Trees (Session 192, playtest s162: variety, not density): birch, oak, spruce and Scots pine among each biome's main
// tree, each tree its own girth and a wider spread of greens; the cost per tree held near the broadleaf's.
import { boot, check } from './lib/game.mjs';
import fs from 'fs';
const g = await boot(); const { page } = g;
await g.intoWorld(); await g.spin(null, 30);
fs.mkdirSync('tests/out', { recursive: true });
const r = await page.evaluate(() => { const P = WORLD.treeProtos(), out = { tris: {} };
  for (const k of ['conifer', 'broadleaf', 'birch', 'oak', 'spruce', 'pine', 'snowpine', 'willow', 'dead']) { const gg = P[k]; out.tris[k] = gg ? (gg.index ? gg.index.count : gg.attributes.position.count) / 3 : 0; }
  // the birch's bark is pale at the foot of the trunk; the pine's upper trunk is red-brown
  const pale = (gg, y0, y1) => { const p = gg.attributes.position, c = gg.attributes.color; let s = 0, n = 0, rr = 0, bb = 0; for (let i = 0; i < p.count; i++) { const y = p.getY(i); if (y < y0 || y > y1 || Math.hypot(p.getX(i), p.getZ(i)) > .35) continue; s += (c.getX(i) + c.getY(i) + c.getZ(i)) / 3; rr += c.getX(i); bb += c.getZ(i); n++; } return { lum: +(s / n).toFixed(2), redOverBlue: +(rr / bb).toFixed(2) }; };
  out.birchBark = pale(P.birch, -.01, .01); out.pineBark = pale(P.pine, 10.7, 10.9); // a cylinder's vertices are at its ends
  const M = WORLD.treeMix(); out.mixOk = Object.values(M).every(L => L.reduce((a, x) => a + x[1], 0) < .8);
  // in the world: which species stand near the start, and whether each tree has its own girth
  const by = {}, ratios = []; WORLD.scene.traverse(o => { if (!o.isInstancedMesh || !o.userData.scatter) return; by[o.userData.scatter] = (by[o.userData.scatter] || 0) + o.count;
    if (/broadleaf|oak|birch|conifer/.test(o.userData.scatter)) { const m = new THREE.Matrix4(), s = new THREE.Vector3(), q = new THREE.Quaternion(), v = new THREE.Vector3(); for (let i = 0; i < Math.min(o.count, 20); i++) { o.getMatrixAt(i, m); m.decompose(v, q, s); ratios.push(s.x / s.y); } } });
  out.by = by; out.ratioMin = +Math.min(...ratios).toFixed(2); out.ratioMax = +Math.max(...ratios).toFixed(2);
  return out; });
check('four new species are built, each at no more than the broadleaf\'s triangles plus a tenth', ['birch', 'oak', 'spruce', 'pine'].every(k => r.tris[k] > 0 && r.tris[k] <= r.tris.broadleaf * 1.1), r.tris);
check('the birch is pale-barked, the pine\'s upper trunk red-brown', r.birchBark.lum > .7 && r.pineBark.redOverBlue > 1.8, { birch: r.birchBark, pine: r.pineBark });
check('each biome keeps its main tree for most of its trees', r.mixOk, {});
check('near the start the broadleaf country has oaks and birches among its broadleafs', (r.by.oak || 0) > 20 && (r.by.birch || 0) > 10 && (r.by.broadleaf || 0) > (r.by.oak || 0), r.by);
check('each tree has its own girth (width over height varies by a quarter or more)', r.ratioMax / r.ratioMin > 1.25, { min: r.ratioMin, max: r.ratioMax });
// a line-up by day, each species once, a person for scale
const shot = await page.evaluate(() => { forceTime(12); const cv = REN.domElement, sc = WORLD.scene, P = WORLD.treeProtos(); const bx = px + 400, bz = pz, y = WORLD.worldH(bx, bz) + 80;
  const cam = new THREE.PerspectiveCamera(40, cv.width / cv.height, .5, 400); const floor = new THREE.Mesh(new THREE.PlaneGeometry(200, 80), new THREE.MeshLambertMaterial({ color: 0x6a7a48 })); floor.rotation.x = -Math.PI / 2; floor.position.set(bx, y, bz); sc.add(floor);
  const mat = new THREE.MeshLambertMaterial({ vertexColors: true }); const list = ['conifer', 'spruce', 'pine', 'birch', 'broadleaf', 'oak', 'willow', 'snowpine', 'dead']; const ms = [];
  list.forEach((k, i) => { const m = new THREE.Mesh(P[k], mat); m.position.set(bx + (i - (list.length - 1) / 2) * 8.5, y, bz); sc.add(m); ms.push(m); });
  const man = buildFoe('Bandit', 0, 0); PEOPLE_RIGS.delete(man); man.root.position.set(bx - 38, y, bz + 3); sc.add(man.root);
  cam.position.set(bx, y + 7, bz + 62); cam.lookAt(bx, y + 6, bz); sc.updateMatrixWorld(true); REN.render(sc, cam); const o = document.createElement('canvas'); o.width = cv.width; o.height = cv.height; o.getContext('2d').drawImage(cv, 0, 0);
  ms.forEach(m => sc.remove(m)); sc.remove(man.root); sc.remove(floor); return o.toDataURL(); });
fs.writeFileSync('tests/out/trees.png', Buffer.from(shot.split(',')[1], 'base64'));
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
