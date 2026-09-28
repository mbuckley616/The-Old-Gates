// The roadside camps on the kit (Session 254, H.5, Michael's A on buildings): the bandit camp's ridge tents (they were
// open cones on poles), its fire ring and logs (seven dodecahedra), a blanket with a rolled head and a pack (two boxes).
import { boot, check } from './lib/game.mjs';
import fs from 'fs';
const g = await boot(); const { page } = g;
await g.intoWorld();
fs.mkdirSync('tests/out', { recursive: true });
await page.evaluate(() => { for (let k = 0; k < 600 && (WORLD.jobs.length || [...WORLD.LOADED.values()].some(L => L.pending || !L.staticsBuilt)); k++) { WORLD.tick(1 / 60, performance.now());
  while (WORLD.jobs.length) { const j = WORLD.jobs.shift(); let more = false; try { more = j.fn(); } catch (e) {} if (more) WORLD.jobs.push(j); } } });
const r = await page.evaluate(() => {
  const camps = WORLD.STAMPS.filter(s => /^camp_/.test(s.id)).map(s => ({ s, d: Math.hypot(s.x - px, s.z - pz) })).sort((a, b) => a.d - b.d);
  WORLD.scene.updateMatrixWorld(true); const ray = new THREE.Raycaster(); const objs = WORLD.scene.children.filter(o => o.isMesh || o.isGroup);
  const topAt = (x, z) => { ray.set(new THREE.Vector3(x, WORLD.worldH(x, z) + 10, z), new THREE.Vector3(0, -1, 0)); ray.far = 20; const h = ray.intersectObjects(objs, true).filter(q => q.object.visible && !q.object.isInstancedMesh && q.object.material && !q.object.material.isMeshBasicMaterial)[0]; return h ? +(h.point.y - WORLD.worldH(x, z)).toFixed(2) : null; };
  const out = camps.slice(0, 3).map(({ s, d }) => ({ d: Math.round(d), tentA: topAt(s.x - 2.6, s.z - 1.2), tentB: topAt(s.x + 2.4, s.z - 1.6), ring: topAt(s.x + .85, s.z + 1.2), roll: topAt(s.x - .2 + Math.sin(.3) * -.72, s.z + 3.6 + Math.cos(.3) * -.72), tents: WORLD.STATIC_SOL.filter(q => q.rx === 1.4 && Math.hypot(q.cx - s.x, q.cz - s.z) < 4).length }));
  let shot = null; if (camps[0]) { const s = camps[0].s; forceTime(12); const cam = new THREE.PerspectiveCamera(50, REN.domElement.width / REN.domElement.height, .1, 400); const x = s.x + 7, z = s.z + 8; cam.position.set(x, WORLD.worldH(x, z) + 3, z); cam.lookAt(s.x, WORLD.worldH(s.x, s.z) + .6, s.z + 1);
    CAM.position.copy(cam.position); for (let i = 0; i < 3; i++) WORLD.tick(1 / 60, performance.now()); WORLD.scene.updateMatrixWorld(true); const f = WORLD.scene.fog; WORLD.scene.fog = null; REN.render(WORLD.scene, cam); WORLD.scene.fog = f;
    const c = document.createElement('canvas'); c.width = REN.domElement.width; c.height = REN.domElement.height; c.getContext('2d').drawImage(REN.domElement, 0, 0); shot = c.toDataURL(); }
  return { n: camps.length, out, shot }; });
if (r.shot) fs.writeFileSync('tests/out/camp.png', Buffer.from(r.shot.split(',')[1], 'base64')); delete r.shot; console.log(JSON.stringify(r));
check('there are roadside camps in reach', r.n > 0 && r.out.length > 0, r.n);
check('their tents are ridge tents: the ridge over the tent\'s middle at 1.8–2.1 (the old cone\'s apex was 2.4)', r.out.every(c => c.tentA > 1.8 && c.tentA < 2.1 && c.tentB > 1.8 && c.tentB < 2.1), r.out);
check('the fire ring\'s stones and the rolled blanket stand on the ground (.1–.45 up)', r.out.every(c => c.ring > .1 && c.ring < .45 && c.roll > .1 && c.roll < .45), r.out);
check('each camp keeps its two tent colliders', r.out.every(c => c.tents === 2), r.out);
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
