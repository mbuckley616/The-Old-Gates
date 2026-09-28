// The wreck and the world's chests on the kit (Session 259, H.5): a sea-floor wreck is a hull broken in two, open ribs
// on a keel with rotted planking, a stem, a snapped mast; the wreck's sea chest and the lairs' and bandit camps' hoards
// are S198's kit chest at the old box's size, their lids opening on the hinge.
import { boot, check } from './lib/game.mjs';
import fs from 'fs';
const g = await boot(); const { page } = g;
await g.intoWorld();
fs.mkdirSync('tests/out', { recursive: true });
const r = await page.evaluate(() => { const geo = WORLD.wreckGeo((() => { let a = 7; return () => ((a = (a * 16807) % 2147483647) / 2147483647); })()); geo.computeBoundingBox(); const b = geo.boundingBox;
  const out = { tris: geo.attributes.position.count / 3, colours: !!geo.attributes.color, box: [b.min.x, b.max.x, b.min.y, b.max.y, b.min.z, b.max.z].map(v => +v.toFixed(2)) };
  // a picture: the wreck on a sand floor, from the side and from above
  forceTime(12); const sc = WORLD.scene, cv = REN.domElement, bx = px + 500, bz = pz, y = WORLD.worldH(bx, bz) + 90, tmp = [];
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(80, 80), new THREE.MeshLambertMaterial({ color: 0xb8a878 })); floor.rotation.x = -Math.PI / 2; floor.position.set(bx, y, bz); tmp.push(floor);
  const m = new THREE.Mesh(geo, new THREE.MeshLambertMaterial({ vertexColors: true })); m.position.set(bx, y, bz); tmp.push(m); tmp.forEach(o => sc.add(o));
  const cam = new THREE.PerspectiveCamera(45, cv.width / cv.height, .3, 300); const shots = [];
  for (const [cx, cy, cz] of [[11, 4, 6], [4, 13, -6]]) { cam.position.set(bx + cx, y + cy, bz + cz); cam.lookAt(bx, y + .6, bz); sc.updateMatrixWorld(true); const f = sc.fog; sc.fog = null; REN.render(sc, cam); sc.fog = f;
    const o = document.createElement('canvas'); o.width = cv.width; o.height = cv.height; o.getContext('2d').drawImage(cv, 0, 0); shots.push(o.toDataURL()); }
  tmp.forEach(o => sc.remove(o)); out.shots = shots; return out; });
r.shots.forEach((u, i) => fs.writeFileSync(`tests/out/wreck-${i}.png`, Buffer.from(u.split(',')[1], 'base64'))); delete r.shots;
console.log(JSON.stringify(r));
check('a wreck is one vertex-coloured mesh of 1.5–6k triangles', r.colours && r.tris > 1500 && r.tris < 6000, r);
check('it lies about where the old one did (within ±4 across with the mast, ±7 along) and low (under 3.2), sunk into the floor (below −.3)', r.box[0] > -4 && r.box[1] < 4 && r.box[4] > -7 && r.box[5] < 7 && r.box[3] < 3.2 && r.box[2] < -.3, r.box);
// a hoard in a lair or a bandit camp near the start: the kit chest survives the site's bake whole and opens on its hinge
const c = await page.evaluate(() => { const near = WORLD.SITES.filter(t => t.kind === 'lair' || t.kind === 'bcamp').sort((a, b) => Math.hypot(a.x - px, a.z - pz) - Math.hypot(b.x - px, b.z - pz));
  for (const t of near.slice(0, 6)) { let S = WORLD.settlements.get(t.id); if (!S) S = WORLD.genSettlement(t); if (!S || !S.chest) continue; const ch = S.chest;
    const inScene = !!ch.g.parent, meshes = []; ch.g.traverse(o => { if (o.isMesh) meshes.push(o); }); const before = ch.lid.rotation.x;
    try { openLoot(ch); } catch (e) { return { id: t.id, err: String(e) }; } const after = ch.lid.rotation.x; try { closeLoot(); } catch (e) { }
    ch.g.updateMatrixWorld(true); const bb = new THREE.Box3().setFromObject(ch.g);
    return { id: t.id, kind: t.kind, inScene, meshes: meshes.length, before, after: +after.toFixed(3), size: [bb.max.x - bb.min.x, bb.max.y - bb.min.y, bb.max.z - bb.min.z].map(v => +v.toFixed(2)) }; }
  return null; });
console.log(JSON.stringify(c));
check('a lair or bandit camp near the start has its hoard', !!c && !c.err, c);
if (c && !c.err) { check('the hoard is the kit chest (body and lid), still in the scene after the site\'s bake', c.inScene && c.meshes === 2, c);
  check('it opens on its hinge', c.before === 0 && c.after < -.9, c); }
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
