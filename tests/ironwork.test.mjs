// A town's ironwork on the kit (Session 258, H.5, Michael's A on buildings): the lamp posts, the door lanterns and the
// hanging trade signs, each one vertex-coloured mesh where they were boxes, round the old lit glass and painted faces.
import { boot, check } from './lib/game.mjs';
import fs from 'fs';
const g = await boot(); const { page } = g;
await g.intoWorld();
fs.mkdirSync('tests/out', { recursive: true });
const r = await page.evaluate(() => { const out = {}; for (const k of ['lampPostGeo', 'doorLanternGeo', 'tradeSignGeo']) { const geo = WORLD[k](); geo.computeBoundingBox(); const b = geo.boundingBox;
    out[k] = { tris: geo.attributes.position.count / 3, colours: !!geo.attributes.color, box: [b.min.x, b.max.x, b.min.y, b.max.y, b.min.z, b.max.z].map(v => +v.toFixed(3)) }; }
  // the sign's board and frame stay inside its painted faces' planes (x ±.035), so the paint is never hidden
  const geo = WORLD.tradeSignGeo(), p = geo.attributes.position; let worst = 0; for (let i = 0; i < p.count; i++) { const y = p.getY(i), z = p.getZ(i); if (y > 1.62 && y < 2.58 && z > .67 && z < 1.63) worst = Math.max(worst, Math.abs(p.getX(i))); }
  out.boardHalf = +worst.toFixed(3); return out; });
console.log(JSON.stringify(r));
check('each piece is one vertex-coloured mesh under 1.5k triangles', ['lampPostGeo', 'doorLanternGeo', 'tradeSignGeo'].every(k => r[k].colours && r[k].tris > 50 && r[k].tris < 1500), r);
check('the lamp post stands under 3.5 with its lantern out at .42 (the glass is hung at .42, 2.85)', r.lampPostGeo.box[3] < 3.5 && r.lampPostGeo.box[5] > .5 && r.lampPostGeo.box[5] < .6 && r.lampPostGeo.box[2] > -.05, r.lampPostGeo.box);
check('the door lantern keeps to the wall (from 0 to under .4 out)', r.doorLanternGeo.box[4] > -.01 && r.doorLanternGeo.box[5] < .4, r.doorLanternGeo.box);
check('the sign reaches out to about the old arm (1.3) and its board stays inside the painted faces (under .035 from the middle)', r.tradeSignGeo.box[5] > 1.3 && r.tradeSignGeo.box[5] < 1.75 && r.boardHalf < .035, r);
// Hearthwick: its shops' signs and lanterns in the town, and a picture of one
await g.settle('hearthwick');
const t = await page.evaluate(() => { const S = WORLD.settlements.get('hearthwick'); const h = S.houses.find(q => ['weapon', 'armor', 'potion', 'misc', 'inn'].includes(q.type)); if (!h) return { none: true };
  forceTime(12); const ex = h.exitX - h.doorX, ez = h.exitZ - h.doorZ, L = Math.hypot(ex, ez), tx = ex / L, tz = ez / L; const y = WORLD.worldH(h.doorX, h.doorZ);
  const cam = new THREE.PerspectiveCamera(50, REN.domElement.width / REN.domElement.height, .1, 300); const cx = h.doorX + tx * 4.5 + tz * 3.2, cz = h.doorZ + tz * 4.5 - tx * 3.2;
  cam.position.set(cx, y + 2.2, cz); cam.lookAt(h.doorX + tx * .8, y + 2.1, h.doorZ + tz * .8); CAM.position.copy(cam.position); for (let i = 0; i < 3; i++) WORLD.tick(1 / 60, performance.now());
  WORLD.scene.updateMatrixWorld(true); const f = WORLD.scene.fog; WORLD.scene.fog = null; REN.render(WORLD.scene, cam); WORLD.scene.fog = f;
  const o = document.createElement('canvas'); o.width = REN.domElement.width; o.height = REN.domElement.height; o.getContext('2d').drawImage(REN.domElement, 0, 0);
  return { type: h.type, lamps: S.lamps.length, shot: o.toDataURL() }; });
if (t.shot) { fs.writeFileSync('tests/out/ironwork.png', Buffer.from(t.shot.split(',')[1], 'base64')); delete t.shot; }
console.log(JSON.stringify(t));
check('Hearthwick builds with a shop to look at and its lamps listed', !t.none && t.lamps > 0, t);
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
