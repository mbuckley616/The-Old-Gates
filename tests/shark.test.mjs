// The shark on the kit (Session 260, H.4, Michael's A on Session 230): a lathed, counter-shaded body with extruded fins,
// gills and eyes, in two meshes, the tail on a pivot that sweeps as it swims; about the old shark's length and height.
import { boot, check } from './lib/game.mjs';
import fs from 'fs';
const g = await boot(); const { page } = g;
await g.intoWorld();
fs.mkdirSync('tests/out', { recursive: true });
const r = await page.evaluate(async () => { const sc = WORLD.scene, x = px + 500, z = pz, y = WORLD.worldH(x, z) + 90;
  const e = buildZoneEnemy(sc, [], x, z, 'Shark', null); const m = e.mesh; m.position.set(x, y, z); m.rotation.y = 0; if (!m.parent) sc.add(m); m.visible = true; e.locked = false;
  const meshes = [], other = []; m.traverse(o => { if (o.isMesh) (o.userData.dunShell === 'shark' ? meshes : other).push(o.geometry.type + (o.visible ? '' : ' (hidden)')); }); m.updateMatrixWorld(true); const bb = new THREE.Box3(); m.traverse(o => { if (o.isMesh && o.userData.dunShell === 'shark') bb.expandByObject(o); });
  const sm = []; m.traverse(o => { if (o.isMesh && o.userData.dunShell === 'shark') sm.push(o); }); let tris = 0; for (const o of sm) tris += (o.geometry.index ? o.geometry.index.count : o.geometry.attributes.position.count) / 3;
  // counter-shading: the body's upward faces against its downward ones
  let up = [0, 0], dn = [0, 0]; for (const o of sm) { const n = o.geometry.attributes.normal, c = o.geometry.attributes.color; if (!c) continue; for (let i = 0; i < n.count; i++) { const l = c.getX(i) + c.getY(i) + c.getZ(i); if (n.getY(i) > .6) { up[0] += l; up[1]++; } else if (n.getY(i) < -.6) { dn[0] += l; dn[1]++; } } }
  // the tail: WORLD.tick sweeps it for a shark in the world's list
  ZONES.world.enemies.push(e); const rots = []; for (let k = 0; k < 6; k++) { WORLD.tick(1 / 60, performance.now()); rots.push(m._sharkTail ? +m._sharkTail.rotation.y.toFixed(3) : null); await new Promise(res => setTimeout(res, 120)); }
  ZONES.world.enemies.splice(ZONES.world.enemies.indexOf(e), 1);
  m.position.set(x, y, z); m.rotation.set(0, 0, 0); m.visible = true; if (m._sharkTail) m._sharkTail.rotation.y = .18; if (!m.parent) sc.add(m);
  // a picture: from the side and from above-front, the sea floor under it
  forceTime(12); const floor = new THREE.Mesh(new THREE.PlaneGeometry(30, 30), new THREE.MeshLambertMaterial({ color: 0xc8b27a })); floor.rotation.x = -Math.PI / 2; floor.position.set(x, y - .6, z); sc.add(floor);
  const cv = REN.domElement, cam = new THREE.PerspectiveCamera(40, cv.width / cv.height, .1, 200), shots = [];
  for (const [cx, cy, cz] of [[6.5, .8, .5], [3.5, 3.2, 4.5]]) { cam.position.set(x + cx, y + cy, z + cz); cam.lookAt(x, y + .2, z); sc.updateMatrixWorld(true); const f = sc.fog; sc.fog = null; REN.render(sc, cam); sc.fog = f; const o = document.createElement('canvas'); o.width = cv.width; o.height = cv.height; o.getContext('2d').drawImage(cv, 0, 0); shots.push(o.toDataURL()); }
  sc.remove(floor); sc.remove(m);
  return { meshes: meshes.length, other, tris, size: [bb.max.x - bb.min.x, bb.max.y - bb.min.y, bb.max.z - bb.min.z].map(v => +v.toFixed(2)), top: +(bb.max.y - y).toFixed(2), up: +(up[0] / up[1]).toFixed(3), down: +(dn[0] / dn[1]).toFixed(3), rots, torso: !!(e.limbs && e.limbs.torso), shots }; });
r.shots.forEach((u, i) => fs.writeFileSync(`tests/out/shark-${i}.png`, Buffer.from(u.split(',')[1], 'base64'))); delete r.shots;
console.log(JSON.stringify(r));
check('the shark is two vertex-coloured kit meshes (body, tail) of 1–5k triangles', r.meshes === 2 && r.tris > 1000 && r.tris < 5000, r);
check('it is about the old shark\'s size: 3.2–4.4 long, under 2 across the pectorals, its dorsal .9–1.45 above its origin (the old tip was at 1.44)', r.size[2] > 3.2 && r.size[2] < 4.4 && r.size[0] < 2 && r.top > .9 && r.top < 1.45, r);
check('it is counter-shaded: its underside much paler than its back', r.down > r.up * 1.6, { up: r.up, down: r.down });
check('its tail sweeps as the world ticks (and the wind-up has a body to light)', r.torso && new Set(r.rots).size >= 4 && r.rots.every(v => v !== null && Math.abs(v) < .4), r.rots);
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
