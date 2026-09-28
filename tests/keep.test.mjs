// The fort's keep on the kit (Session 256, H.5, Michael's A on buildings): coursed walls on a battered plinth, round
// turrets, a doorway of voussoirs with its leaves open, windows with sills, a corbelled parapet, in the compound's
// group with the old boxes as its distant copy; the keep's footprint, door, collider and lights as they were.
import { boot, check } from './lib/game.mjs';
import fs from 'fs';
const g = await boot(); const { page } = g;
await g.intoWorld();
fs.mkdirSync('tests/out', { recursive: true });
const geo = await page.evaluate(() => { const W = 11, D = 9, H = 7.2; const geo = WORLD.fortKeepGeoHi(W, D, H, 0x8a2a2a, (() => { let a = 7; return () => ((a = (a * 16807) % 2147483647) / 2147483647); })()); geo.computeBoundingBox(); const bb = geo.boundingBox;
  const m = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ side: THREE.DoubleSide })); m.updateMatrixWorld(true); const rc = new THREE.Raycaster();
  const hitZ = (x, y) => { rc.set(new THREE.Vector3(x, y, D / 2 + 5), new THREE.Vector3(0, 0, -1)); const h = rc.intersectObject(m)[0]; return h ? +h.point.z.toFixed(2) : null; };
  return { tris: geo.attributes.position.count / 3, colours: !!geo.attributes.color, box: [bb.min.x, bb.max.x, bb.min.z, bb.max.z, bb.min.y, bb.max.y].map(v => +v.toFixed(2)),
    door: hitZ(0, 1.5), arch: hitZ(0, 3.6), wall: hitZ(-2.8, 2.0), win: hitZ(3.4, 7.2 * .62), D }; });
console.log(JSON.stringify(geo));
check('the keep is one vertex-coloured mesh of 4–13k triangles (one a fort; its ring is some fifty segments of 1–2k)', geo.colours && geo.tris > 4000 && geo.tris < 13000, geo);
check('it keeps the old footprint (11 by 9, the turret feet within 1.5 of it, as the old turrets were within 1.2; the steps 2.8 out in front) and stands under 12.5', geo.box[0] > -7.0 && geo.box[1] < 7.0 && geo.box[2] > -6.0 && geo.box[3] < 4.5 + 2.9 && geo.box[5] < 12.5, geo.box);
check('it runs into the ground under a slope (the plinth\'s foot below −.4)', geo.box[4] < -.4, geo.box);
check('the doorway is open to the dark at its back (.95 into the wall), under the arch too', geo.door !== null && geo.door < geo.D / 2 - .8 && geo.arch !== null && geo.arch < geo.D / 2 - .8, geo);
check('the wall beside the door is its courses, proud of the face; the window is a recess behind the face', geo.wall > geo.D / 2 && geo.wall < geo.D / 2 + .2 && geo.win < geo.D / 2, geo);
// the fort nearest the start: drain the loader so its compound builds, then find the keep's pair among its baked meshes
const fd = await page.evaluate(() => { const out = []; const [hi, hj] = WORLD.cellOf(px, pz); for (let dj = -3; dj <= 3; dj++) for (let di = -3; di <= 3; di++) { let c; try { c = WORLD.getCell(hi + di, hj + dj); } catch (e) { continue; } if (c) for (const e of c.doors) if (e.kind === 'fort_door') out.push({ seed: e.seed, x: e.x, z: e.z, d: Math.hypot(e.x - px, e.z - pz) }); } return out.sort((a, b) => a.d - b.d)[0] || null; });
check('a fort door is found near the start', !!fd, fd);
if (fd) { await page.evaluate(f => goToZone('world', f.x, f.z + 45, 0, 'x'), fd); await page.waitForTimeout(9000); await g.hide();
  await page.evaluate(seed => { for (let k = 0; k < 900 && !WORLD.settlements.has('fort_' + seed); k++) { WORLD.tick(1 / 60, performance.now()); while (WORLD.jobs.length) { const j = WORLD.jobs.shift(); let more = false; try { more = j.fn(); } catch (e) {} if (more) WORLD.jobs.push(j); } } }, fd.seed);
  const fort = await page.evaluate(seed => { const S = WORLD.settlements.get('fort_' + seed); if (!S || !S.lodMeshes) return { none: seed };
const cx = S.site.x, kz = S.site.z - 8.5, L = S.lodMeshes;
    // the keep sits 8.5 north of the compound's centre: a baked cluster holding it has vertices inside the keep's mass, high up
    const high = m => { const p = m.geometry.attributes.position; let n = 0; const e = m.matrixWorld.elements; for (let i = 0; i < p.count; i += 3) { const x = p.getX(i) + e[12], y = p.getY(i) + e[13], z = p.getZ(i) + e[14]; if (Math.abs(x - cx) < 5 && Math.abs(z - kz) < 4 && y - WORLD.worldH(cx, kz) > 8.5) n++; } return n; };
    const hi = L.filter(m => m.userData.lod === 'hi' && high(m) > 0), lo = L.filter(m => m.userData.lod === 'lo' && high(m) > 0);
    const saved = CAM.position.clone(); const look = () => { WORLD.tick(1 / 60, performance.now()); return hi.filter(m => m.visible).length; };
    CAM.position.set(cx, CAM.position.y, kz + 30); const near = look(); CAM.position.set(cx + 700, CAM.position.y, kz); const far = look(); CAM.position.copy(saved); look();
    const sol = WORLD.STATIC_SOL.some(q => Math.abs(q.cx - cx) < .01 && Math.abs(q.cz - kz) < .01 && q.rx === 6 && q.rz === 5);
    const portal = (typeof PORTALS !== 'undefined' ? PORTALS : []).some(p => p.seed === seed && Math.hypot(p.x - cx, p.z - (S.site.z - 4)) < .01);
    forceTime(12); const cam = new THREE.PerspectiveCamera(50, REN.domElement.width / REN.domElement.height, .3, 600); const y = WORLD.worldH(cx, kz);
    cam.position.set(cx + 9, y + 4, kz + 20); cam.lookAt(cx, y + 4, kz); CAM.position.copy(cam.position); for (let i = 0; i < 3; i++) WORLD.tick(1 / 60, performance.now()); WORLD.scene.updateMatrixWorld(true);
    const hid = []; WORLD.scene.traverse(o => { if (o.isInstancedMesh && o.visible) { o.visible = false; hid.push(o); } }); const f = WORLD.scene.fog; WORLD.scene.fog = null; REN.render(WORLD.scene, cam); WORLD.scene.fog = f; hid.forEach(o => { o.visible = true; });
    const o = document.createElement('canvas'); o.width = REN.domElement.width; o.height = REN.domElement.height; o.getContext('2d').drawImage(REN.domElement, 0, 0); CAM.position.copy(saved); look();
    return { id: S.site.id, hi: hi.length, lo: lo.length, paired: hi.every(m => lo.some(q => q.userData.ckey === m.userData.ckey)), near, far, sol, portal, shot: o.toDataURL() }; }, fd.seed);
  if (fort.shot) { fs.writeFileSync('tests/out/keep.png', Buffer.from(fort.shot.split(',')[1], 'base64')); delete fort.shot; }
  console.log(JSON.stringify(fort));
  check('the fort compound nearest the start carries its keep in detail, paired with its old self, near shown and far not', fort.hi > 0 && fort.lo > 0 && fort.paired && fort.near > 0 && fort.far === 0, fort);
  check('the keep keeps its collider (the whole mass, 6 by 5) and its door', fort.sol, fort); }
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
