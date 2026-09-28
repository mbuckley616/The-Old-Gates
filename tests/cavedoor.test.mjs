// The cave doors' rock faces on the world's rocks (Session 271, H.5; they waited on the rocks question, Michael's A on
// Session 228): the slabs, the brow and the boulders round a cave mouth are fracture-cut rocks fitted to the old boxes'
// sizes and places, tinted by the dungeon's theme; the door, the maw and the collision as they were.
import { boot, check } from './lib/game.mjs';
import fs from 'fs';
const g = await boot(); const { page } = g;
await g.intoWorld();
fs.mkdirSync('tests/out', { recursive: true });
const r = await page.evaluate(() => { const x = px + 400, z = pz + 30, grp = new THREE.Group(); WORLD.scene.add(grp); const sol = [];
  const P = { x, z, seed: 4242, theme: 'undead', col: 0x88aaff, kind: 'cave_door', name: 'Test Mouth', id: 'dyn_test' };
  spawnPortalMeshes(grp, [P], sol, WORLD.worldH);
  let kit = 0, dodeca = 0, bigBox = 0; grp.traverse(o => { if (!o.isMesh) return; const t = o.geometry.type; if (o.material.vertexColors && t === 'BufferGeometry') kit++; if (t === 'DodecahedronGeometry') dodeca++; if (t === 'BoxGeometry' && o.geometry.parameters.height > 1) bigBox++; });
  forceTime(12); const y = WORLD.worldH(x, z), cv = REN.domElement, cam = new THREE.PerspectiveCamera(45, cv.width / cv.height, .1, 300); cam.position.set(x + 4, y + 3.2, z + 10); cam.lookAt(x, y + 1.5, z);
  CAM.position.copy(cam.position); for (let i = 0; i < 3; i++) WORLD.tick(1 / 60, performance.now()); WORLD.scene.updateMatrixWorld(true); const f = WORLD.scene.fog; WORLD.scene.fog = null; REN.render(WORLD.scene, cam); WORLD.scene.fog = f;
  const o = document.createElement('canvas'); o.width = cv.width; o.height = cv.height; o.getContext('2d').drawImage(cv, 0, 0); WORLD.scene.remove(grp);
  return { kit, dodeca, bigBox, sol: sol.length, shot: o.toDataURL() }; });
fs.writeFileSync('tests/out/cavedoor.png', Buffer.from(r.shot.split(',')[1], 'base64')); delete r.shot;
console.log(JSON.stringify(r));
check('a cave mouth\'s four slabs, brow and seven boulders are the world\'s rocks (12), with no dodecahedron or tall box left', r.kit === 12 && r.dodeca === 0 && r.bigBox <= 1, r);
check('its rocks stay solid as before (four slabs, seven boulders, the door)', r.sol >= 12, r);
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
