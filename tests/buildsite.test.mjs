// A town's work under way on the kit (Session 255, H.5, Michael's A on buildings): a paid-for build shows a building
// site, a half-raised coursed wall in a lashed scaffold with a deck, a ladder, stone, timber and a hoist, where it was
// four box posts, a slab and a block; within the old footprint, with its collider.
import { boot, check } from './lib/game.mjs';
import fs from 'fs';
const g = await boot(); const { page } = g;
await g.intoWorld();
fs.mkdirSync('tests/out', { recursive: true });
await g.settle('hearthwick');
const r = await page.evaluate(() => {
  const geo = WORLD.buildSiteGeo((() => { let a = 7; return () => ((a = (a * 16807) % 2147483647) / 2147483647); })()); geo.computeBoundingBox(); const bb = geo.boundingBox;
  const site = WORLD.SITE.hearthwick, st = WORLD.TS(site); st.builds.push({ key: 'walls', name: 'wall', p: 5, doneDay: 1e9, done: false }); const k = st.builds.length - 1;
  if (WORLD.settlements.has(site.id)) WORLD.disposeSettlement(site.id); const S = WORLD.genSettlement(site);
  const sx = site.x + 14 + k * 6, sz = site.z - 16; const sol = S.sol.some(q => Math.abs(q.cx - sx) < .01 && Math.abs(q.cz - sz) < .01 && q.rx === 1.8);
  forceTime(12); const cam = new THREE.PerspectiveCamera(50, REN.domElement.width / REN.domElement.height, .1, 400); const x = sx + 5, z = sz + 6; cam.position.set(x, WORLD.worldH(x, z) + 2.6, z); cam.lookAt(sx, WORLD.worldH(sx, sz) + 1.6, sz);
  CAM.position.copy(cam.position); for (let i = 0; i < 3; i++) WORLD.tick(1 / 60, performance.now()); WORLD.scene.updateMatrixWorld(true); const f = WORLD.scene.fog; WORLD.scene.fog = null; REN.render(WORLD.scene, cam); WORLD.scene.fog = f;
  const c = document.createElement('canvas'); c.width = REN.domElement.width; c.height = REN.domElement.height; c.getContext('2d').drawImage(REN.domElement, 0, 0);
  st.builds.pop(); WORLD.disposeSettlement(site.id); WORLD.genSettlement(site);
  return { tris: geo.attributes.position.count / 3, box: [bb.min.x, bb.max.x, bb.min.z, bb.max.z, bb.max.y].map(v => +v.toFixed(2)), colours: !!geo.attributes.color, sol, shot: c.toDataURL() }; });
fs.writeFileSync('tests/out/buildsite.png', Buffer.from(r.shot.split(',')[1], 'base64')); delete r.shot; console.log(JSON.stringify(r));
check('a building site is one vertex-coloured mesh of 1.5–6k triangles', r.colours && r.tris > 1500 && r.tris < 6000, r);
check('it stands within about the old footprint (±2.2 round its middle, under 5 tall)', r.box[0] > -2.2 && r.box[1] < 2.2 && r.box[2] > -2.2 && r.box[3] < 2.2 && r.box[4] < 5, r.box);
check('a paid-for build in Hearthwick shows its site with its collider', r.sol, r);
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
