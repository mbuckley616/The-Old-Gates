// The harbour in detail (Session 250, H.5, Michael's A on buildings): the quay's coursed faces, coping, paving, steps
// and rings over a tide line, the breakwater's heaps of armour stone, iron bollards, rounded crates and heaped nets;
// the old quay and blocks the distant copies; the quay's platform, the breakwater's collision and the town's dice as before.
import { boot, check } from './lib/game.mjs';
import fs from 'fs';
const g = await boot(); const { page } = g;
await g.intoWorld();
fs.mkdirSync('tests/out', { recursive: true });
const b = await page.evaluate(() => { const rng = s => { let a = s; return () => ((a = (a * 16807) % 2147483647) / 2147483647); };
  const q = WORLD.quayGeoHi(40, 8, 1.1, rng(3)); q.computeBoundingBox(); const bb = q.boundingBox; const c = q.attributes.color, p = q.attributes.position;
  let wet = 0, dry = 0, nw = 0, nd = 0; for (let i = 0; i < p.count; i++) { const y = p.getY(i) + 1.1, l = c.getX(i) + c.getY(i) + c.getZ(i); if (y < -.6) { wet += l; nw++; } else if (y > .6 && y < 1.0) { dry += l; nd++; } }
  const h = WORLD.breakwaterHeap(rng(5)); h.computeBoundingBox(); const n = WORLD.netHeapGeo(1);
  return { quay: { tris: p.count / 3, top: +(bb.max.y).toFixed(3), bottom: +bb.min.y.toFixed(2), w: +(bb.max.x - bb.min.x).toFixed(2), len: +(bb.max.z - bb.min.z).toFixed(2), wet: +(wet / nw).toFixed(3), dry: +(dry / nd).toFixed(3) },
    heap: { tris: h.attributes.position.count / 3, top: +h.boundingBox.max.y.toFixed(2), r: +Math.max(h.boundingBox.max.x, -h.boundingBox.min.x, h.boundingBox.max.z, -h.boundingBox.min.z).toFixed(2) }, net: n.attributes.position.count / 3 }; });
console.log(JSON.stringify(b));
check('the quay is its old size (8 wide with the steps beyond, 40 long) with its deck\'s top at the old deck\'s (+.1)', Math.abs(b.quay.len - 40) < .2 && b.quay.w > 8 && b.quay.w < 10 && Math.abs(b.quay.top - .1) < .015 && b.quay.bottom <= -3.19, b.quay);
check('the stone under the tide line is darker than above it', b.quay.wet < b.quay.dry * .8, b.quay);
check('the quay is under 9k triangles, a breakwater heap under 2k, a net under 600', b.quay.tris < 9000 && b.heap.tris < 2000 && b.net < 600, b);
check('a breakwater heap stands about where the old block did (its top 2–3.3, within 5 of its centre)', b.heap.top > 2 && b.heap.top < 3.3 && b.heap.r < 5, b.heap);
// the nearest port in the game
const port = await page.evaluate(() => { const ps = WORLD.allPorts().map(p => ({ id: p.id, d: Math.hypot(p.x - px, p.z - pz) })).sort((a, c) => a.d - c.d); return ps[0] && ps[0].id; });
await g.settle(port);
const t = await page.evaluate(id => { const S = WORLD.settlements.get(id); const site = S.site; const L = S.lodMeshes || []; const hi = L.filter(m => m.userData.lod === 'hi'), lo = L.filter(m => m.userData.lod === 'lo');
  const plat = ZONES.world.platforms.filter(p => p.site === id); const bw = S.sol.filter(q => q.rx === 3 && q.rz === 3 && !q.bt).length;
  let nets = 0, wire = 0; S.group.traverse(o => { if (o.isMesh && o.material && o.material.wireframe) wire++; });
  forceTime(12); const sd = { x: site.quayStart.x - site.x, z: site.quayStart.z - site.z }; const dl = Math.hypot(sd.x, sd.z), ux = sd.x / dl, uz = sd.z / dl;
  const qx = site.quayStart.x + ux * 22, qz = site.quayStart.z + uz * 22; const cam = new THREE.PerspectiveCamera(55, REN.domElement.width / REN.domElement.height, .3, 600);
  const snap = (x, y, z, lx, ly, lz) => { cam.position.set(x, y, z); cam.lookAt(lx, ly, lz); CAM.position.copy(cam.position); for (let i = 0; i < 3; i++) WORLD.tick(1 / 60, performance.now()); WORLD.scene.updateMatrixWorld(true); const f = WORLD.scene.fog; WORLD.scene.fog = null; REN.render(WORLD.scene, cam); WORLD.scene.fog = f;
    const o = document.createElement('canvas'); o.width = REN.domElement.width; o.height = REN.domElement.height; o.getContext('2d').drawImage(REN.domElement, 0, 0); return o.toDataURL(); };
  const side = snap(qx - uz * 20 + ux * 6, 5, qz + ux * 20 + uz * 6, qx, 0, qz); const deck = snap(site.quayStart.x + ux * 2, 2.8, site.quayStart.z + uz * 2, qx + ux * 20, 1, qz + uz * 20);
  const hiNear = hi.filter(m => m.visible).length;
  return { id, plat: plat.length, platY: plat.map(p => p.y), bw, wire, paired: hi.every(m => lo.some(o => o.userData.ckey === m.userData.ckey)), hi: hi.length, hiNear, shots: { side, deck } }; }, port);
for (const [k, u] of Object.entries(t.shots)) fs.writeFileSync(`tests/out/harbour-${k}.png`, Buffer.from(u.split(',')[1], 'base64'));
delete t.shots; console.log(JSON.stringify(t));
check('the nearest port keeps its walkable quay at the old height', t.plat === 1 && t.platY[0] === 1.1, t);
check('its breakwater keeps its seven blocks of collision', t.bw === 7, t);
check('its detailed clusters are paired with plain twins and show from the quay', t.paired && t.hi > 0 && t.hiNear > 0, t);
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
