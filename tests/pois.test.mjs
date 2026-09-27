// The POIs' pieces in detail (Session 204, H.5, Michael's A): the wizard's tower and the shrine near in detail with
// their old selves as distant copies; the lair's boulders lumpy rock.
import { boot, check } from './lib/game.mjs';
import fs from 'fs';
const g = await boot(); const { page } = g;
await g.intoWorld();
fs.mkdirSync('tests/out', { recursive: true });
const r = await page.evaluate(() => { const out = {}; const shots = {};
  for (const kind of ['tower', 'shrine', 'lair']) { const t = WORLD.SITES.find(s => s.kind === kind && s.pad > 0); if (!t) { out[kind] = { none: true }; continue; }
    let S = WORLD.settlements.get(t.id); if (!S) S = WORLD.genSettlement(t); const L = S.lodMeshes || []; const hi = L.filter(m => m.userData.lod === 'hi');
    out[kind] = { hi: hi.length, paired: hi.every(m => L.some(o => o.userData.lod === 'lo' && o.userData.ckey === m.userData.ckey)), tris: hi.reduce((a, m) => a + m.geometry.attributes.position.count / 3, 0) };
    // a picture from 30 units at noon, the camera close enough that the detailed piece shows
    forceTime(12); const y = WORLD.worldH(t.x, t.z); const cam = new THREE.PerspectiveCamera(45, REN.domElement.width / REN.domElement.height, .3, 500); const d = kind === 'tower' ? 55 : 22;
    cam.position.set(t.x + d * .6, y + (kind === 'tower' ? 18 : 6), t.z + d * .8); cam.lookAt(t.x, y + (kind === 'tower' ? 20 : 2), t.z); CAM.position.copy(cam.position); WORLD.tick(1 / 60, performance.now());
    out[kind].hiShown = hi.some(m => m.visible); WORLD.scene.updateMatrixWorld(true); const fog = WORLD.scene.fog; WORLD.scene.fog = null; REN.render(WORLD.scene, cam); WORLD.scene.fog = fog;
    const o = document.createElement('canvas'); o.width = REN.domElement.width; o.height = REN.domElement.height; o.getContext('2d').drawImage(REN.domElement, 0, 0); shots[kind] = o.toDataURL(); }
  return { out, shots }; });
for (const [k, u] of Object.entries(r.shots)) fs.writeFileSync(`tests/out/poi-${k}.png`, Buffer.from(u.split(',')[1], 'base64'));
const o = r.out;
check('the tower is built in detail with its old self as the distant copy, detailed from near', !o.tower.none && o.tower.hi > 0 && o.tower.paired && o.tower.hiShown, o.tower);
check('the shrine likewise', !o.shrine.none && o.shrine.hi > 0 && o.shrine.paired && o.shrine.hiShown, o.shrine);
const shot = await page.evaluate(() => { forceTime(12); const cv = REN.domElement, sc = WORLD.scene; const bx = px + 500, bz = pz, y = WORLD.worldH(bx, bz) + 90;
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(200, 120), new THREE.MeshLambertMaterial({ color: 0x6a7a48 })); floor.rotation.x = -Math.PI / 2; floor.position.set(bx, y, bz); sc.add(floor); const mat = new THREE.MeshLambertMaterial({ vertexColors: true }); const ms = [];
  const put = (geo, x, z) => { const m = new THREE.Mesh(geo, mat); m.position.set(bx + x, y, bz + z); sc.add(m); ms.push(m); };
  put(WORLD.poiGeo('tower'), -9, -6); put(WORLD.poiGeo('shrine'), 9, 0);
  const cam = new THREE.PerspectiveCamera(45, cv.width / cv.height, .3, 500); cam.position.set(bx, y + 14, bz + 42); cam.lookAt(bx, y + 12, bz); sc.updateMatrixWorld(true); REN.render(sc, cam);
  const o = document.createElement('canvas'); o.width = cv.width; o.height = cv.height; o.getContext('2d').drawImage(cv, 0, 0); ms.forEach(m => sc.remove(m)); sc.remove(floor); return o.toDataURL(); });
fs.writeFileSync('tests/out/pois.png', Buffer.from(shot.split(',')[1], 'base64'));
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
