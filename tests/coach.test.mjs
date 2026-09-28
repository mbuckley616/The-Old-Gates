// The road coach on the kit (Session 261, H.5, Michael's A on Session 230): a panelled body on springs, framed windows
// and doors, a railed roof with luggage, the driver's bench, lamps, spoked wheels, the pole; one mesh whose roof is at the
// height the rider already stands on (the platform at 1.9 over the road).
import { boot, check } from './lib/game.mjs';
import fs from 'fs';
const g = await boot(); const { page } = g;
await g.intoWorld();
fs.mkdirSync('tests/out', { recursive: true });
const r = await page.evaluate(() => { const geo = WORLD.coachGeo(); geo.computeBoundingBox(); const b = geo.boundingBox; const p = geo.attributes.position;
  // the roof's top: a ray down beside the luggage, inside the rail
  const m = new THREE.Mesh(geo, new THREE.MeshBasicMaterial()); m.updateMatrixWorld(true); const rc = new THREE.Raycaster(new THREE.Vector3(.5, 5, .85), new THREE.Vector3(0, -1, 0)); const h = rc.intersectObject(m)[0]; const roof = h ? h.point.y : 0;
  return { tris: p.count / 3, colours: !!geo.attributes.color, box: [b.min.x, b.max.x, b.min.y, b.max.y, b.min.z, b.max.z].map(v => +v.toFixed(2)), roof: +roof.toFixed(3) }; });
console.log(JSON.stringify(r));
check('the coach is one vertex-coloured mesh of 3–12k triangles', r.colours && r.tris > 3000 && r.tris < 12000, r);
check('its roof is at the rider\'s height (1.85–1.95; the platform is at 1.9) and it stands on its wheels (from 0)', r.roof > 1.85 && r.roof < 1.95 && r.box[2] > -.02 && r.box[2] < .05, r);
check('it keeps about the old coach\'s size: within ±1.1 across, its pole out to about the old one\'s (2.6–3.0 ahead), under 2.4 tall', r.box[0] > -1.1 && r.box[1] < 1.1 && r.box[5] > 2.6 && r.box[5] < 3.0 && r.box[3] < 2.4, r.box);
// a coach line in the game: its cart is the kit coach, and a picture of it with its horses
// a coaching road is one the player pays for: open one from Hearthwick along its first road to a town, and stand halfway
const opened = await page.evaluate(() => { const T = ['town', 'city', 'port'];
  const defs = WORLD.ROAD_DEFS.map(d => ({ d, a: WORLD.siteAnywhere(d.a), b: WORLD.siteAnywhere(d.b) })).filter(q => q.a && q.b && T.includes(q.a.kind) && T.includes(q.b.kind)).sort((p, q) => Math.hypot((p.a.x + p.b.x) / 2 - px, (p.a.z + p.b.z) / 2 - pz) - Math.hypot((q.a.x + q.b.x) / 2 - px, (q.a.z + q.b.z) / 2 - pz));
  for (const { d, a, b } of defs) { const key = d.a < d.b ? d.a + '|' + d.b : d.b + '|' + d.a; worldState.coaches = worldState.coaches || {}; worldState.coaches[key] = { a: d.a, b: d.b, opened: 0 }; px = (a.x + b.x) / 2; pz = (a.z + b.z) / 2; return key; }
  return null; });
await page.waitForTimeout(6000);
await page.evaluate(() => { for (let i = 0; i < 5; i++) WORLD.tick(1 / 60, performance.now()); });
await page.waitForTimeout(4000);
const c = await page.evaluate(() => { for (let i = 0; i < 3; i++) WORLD.tick(1 / 60, performance.now()); const C = [...WORLD.coachLines.values()][0]; if (!C) return null; const cart = C.cart; const n = cart.geometry.attributes.position.count / 3;
  forceTime(12); const cv = REN.domElement, cam = new THREE.PerspectiveCamera(45, cv.width / cv.height, .1, 300); const a = cart.rotation.y, x = cart.position.x, y = cart.position.y, z = cart.position.z;
  cam.position.set(x + Math.cos(a) * 6 + Math.sin(a) * 3, y + 2.6, z - Math.sin(a) * 6 + Math.cos(a) * 3); cam.lookAt(x + Math.sin(a) * 1.4, y + 1.2, z + Math.cos(a) * 1.4); CAM.position.copy(cam.position);
  for (let i = 0; i < 3; i++) WORLD.tick(1 / 60, performance.now()); WORLD.scene.updateMatrixWorld(true); const f = WORLD.scene.fog; WORLD.scene.fog = null; REN.render(WORLD.scene, cam); WORLD.scene.fog = f;
  const o = document.createElement('canvas'); o.width = cv.width; o.height = cv.height; o.getContext('2d').drawImage(cv, 0, 0);
  return { tris: n, platY: +(C.plat.y - cart.position.y).toFixed(2), shot: o.toDataURL() }; });
if (c && c.shot) { fs.writeFileSync('tests/out/coach.png', Buffer.from(c.shot.split(',')[1], 'base64')); delete c.shot; }
console.log(JSON.stringify({ opened, ...c }));
check('a coach line near the start runs the kit coach, its ride platform 1.9 over the road', !!c && c.tris === r.tris && c.platY === 1.9, c);
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
