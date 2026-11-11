// The roadside camps on the kit (Session 254, H.5, Michael's A on buildings): the bandit camp's ridge tents (they were
// open cones on poles), its fire ring and logs (seven dodecahedra), a blanket with a rolled head and a pack (two boxes).
// Session 2094: and the camp you make, laid from your bag (the kit's rolls, tent and lean-to).
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
// Session 2094 (camp and rest B's look session): the camp you make is the kit's. Each roll laid from the bag is drawn where you lie, with
// the tent over it if you carry one, on the land and not under it, and packed again when you walk off; the lean-to is the kit's too.
const cg = await page.evaluate(() => { yaw = .6; const out = {}; const box = new THREE.Box3();
  for (const k of ['blanket', 'wool', 'gatelands', 'mark', 'aurenne']) for (const tent of [false, true]) {
    for (let i = BAG.length - 1; i >= 0; i--) if (BAG[i] && (BAG[i].tent || BAG[i].roll)) BAG.splice(i, 1);
    BAG.push(rollItem(k)); if (tent) BAG.push({ ...TENT_ITEM }); useItem(BAG.findIndex(b => b && b.roll === k)); if (typeof closeSleepUI === 'function') closeSleepUI();
    const C = CAMP_LAID, u = C && C.mesh.userData.camp; if (!u) { out[k + (tent ? '+tent' : '')] = null; continue; }
    C.mesh.updateMatrixWorld(true); box.setFromObject(C.mesh); const y = WORLD.worldH(C.x, C.z);
    out[k + (tent ? '+tent' : '')] = { tris: u.tris, draws: u.draws, lo: +(box.min.y - y).toFixed(2), hi: +(box.max.y - y).toFixed(2), ahead: +Math.hypot(C.x - px, C.z - pz).toFixed(2) }; }
  const z0 = pz; pz += 9; tickLeanTos(); const packed = !CAMP_LAID; pz = z0;
  const L = leanToMesh(px, pz - 1.2, 0), lean = L.userData.camp || null; L.traverse(o => { if (o.geometry) o.geometry.dispose(); });
  return { out, packed, lean }; });
console.log('camp gear', JSON.stringify(cg));
const rolls = Object.entries(cg.out);
check('each of the five rolls, with and without the tent, is laid as the kit\'s (under 1,500 tris, 5 draws at most)', rolls.length === 10 && rolls.every(([, v]) => v && v.tris < 1500 && v.draws <= 5), cg.out);
check('a roll lies on the land, its top under 0.3 m; the hammock hangs to 1.3–1.7 m on its shears; a tent stands 1.0–1.3 m', rolls.every(([k, v]) => v && v.lo > -.35 &&
  (k === 'aurenne' || k === 'aurenne+tent' ? v.hi > 1.3 && v.hi < 1.75 : /\+tent/.test(k) ? v.hi > 1 && v.hi < 1.3 : v.hi < .3)), cg.out);
check('walking 9 m off packs it again', cg.packed, cg);
check('the lean-to is the kit\'s (under 2,000 tris)', !!cg.lean && cg.lean.tris < 2000, cg.lean);
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
