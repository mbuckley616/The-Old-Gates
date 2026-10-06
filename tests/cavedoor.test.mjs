// The old gates in the overworld (Session 578, Michael's A on DECISION #169; this suite tested Session 271's rock mouths
// before): every cave-type gate is one form, a dressed-stone doorway cut into a turf mound, the binding marks in the theme's
// colour. Michael's one note on the prototype was that the mound burst through the doorway: here rays cast into the doorway
// from in front must meet the door's oak, set back in the reveal, and nothing before it.
import { boot, check } from './lib/game.mjs';
import fs from 'fs';
const g = await boot(); const { page } = g;
await g.intoWorld();
fs.mkdirSync('tests/out', { recursive: true });
const r = await page.evaluate(() => { const x = px + 400, z = pz + 30, grp = new THREE.Group(); WORLD.scene.add(grp); const sol = [];
  const P = { x, z, seed: 4242, theme: 'undead', col: 0x88aaff, kind: 'cave_door', name: 'Test Mouth', id: 'dyn_test' };
  spawnPortalMeshes(grp, [P], sol, WORLD.worldH);
  const G = grp.children.find(o => o.name === 'oldGate'); let meshes = 0, kit = 0, dodeca = 0; grp.traverse(o => { if (!o.isMesh) return; meshes++; if (o.geometry.type === 'DodecahedronGeometry') dodeca++; });
  G.updateMatrixWorld(true); const ty = G.position.y;
  // the doorway: a grid of rays from 3 out, level, into the opening; each must first meet wood within .15 of the door's plane
  const rc = new THREE.Raycaster(), hits = []; let bad = 0, n = 0;
  for (let ix = -2; ix <= 2; ix++) for (let iy = 0; iy < 6; iy++) { const hx = x + ix * .28, hy = ty + .3 + iy * .44; rc.set(new THREE.Vector3(hx, hy, z - 3), new THREE.Vector3(0, 0, 1)); rc.far = 6;
    const h = rc.intersectObjects(G.children, true)[0]; n++; if (!h) { bad++; hits.push({ ix, iy, none: true }); continue; }
    const ca = h.object.geometry.attributes.color, c = ca ? [ca.getX(h.face.a), ca.getY(h.face.a), ca.getZ(h.face.a)] : [0, 0, 0];
    const wood = c[0] > c[1] && c[1] > c[2] && c[0] < .3, dz = h.point.z - z; if (!wood || dz < -.15 || dz > .1) { bad++; hits.push({ ix, iy, dz: +dz.toFixed(2), c: c.map(v => +v.toFixed(2)) }); } }
  // the mound's turf: no turf-coloured vertex in front of the headwall's back face (z .25) inside the doorway's width
  const ms = G.children.find(o => o.isMesh && !o.material.isMeshBasicMaterial), pa = ms.geometry.attributes.position, ca = ms.geometry.attributes.color; let turfFront = 0;
  for (let i = 0; i < pa.count; i++) { const cr = ca.getX(i), cg = ca.getY(i), cb = ca.getZ(i); if (!(cg > cr && cg > cb && cg > .3)) continue; if (Math.abs(pa.getX(i)) < .75 && pa.getZ(i) < .2 && pa.getY(i) > -.1 && pa.getY(i) < 2.7) turfFront++; }
  const inSol = (qx, qz) => sol.some(s => Math.abs(qx - s.cx) < s.rx + .3 && Math.abs(qz - s.cz) < s.rz + .3);
  const reach = !inSol(x, z - .7) && Math.hypot(0, .7) < 2.0, mound = inSol(x, z + 2.5) && inSol(x + 3, z + 1);
  forceTime(12); const y = WORLD.worldH(x, z), cv = REN.domElement, cam = new THREE.PerspectiveCamera(45, cv.width / cv.height, .1, 300); cam.position.set(x + 3, y + 2.2, z - 11); cam.lookAt(x, y + 1.6, z);
  CAM.position.copy(cam.position); for (let i = 0; i < 3; i++) WORLD.tick(1 / 60, performance.now()); WORLD.scene.updateMatrixWorld(true); const f = WORLD.scene.fog; WORLD.scene.fog = null; REN.render(WORLD.scene, cam); WORLD.scene.fog = f;
  const o = document.createElement('canvas'); o.width = cv.width; o.height = cv.height; o.getContext('2d').drawImage(cv, 0, 0); WORLD.scene.remove(grp);
  return { gate: !!G, meshes, dodeca, n, bad, hits: hits.slice(0, 6), turfFront, reach, mound, sol: sol.length, tris: ms.geometry.attributes.position.count / 3, shot: o.toDataURL() }; });
fs.writeFileSync('tests/out/cavedoor.png', Buffer.from(r.shot.split(',')[1], 'base64')); delete r.shot;
console.log(JSON.stringify(r));
check('a cave-type gate is the one form, an old gate in its mound, and none of the old rock mouth is left', r.gate && r.dodeca === 0, r);
check('it is baked: the stone, wood and turf one draw, the marks another (two meshes with the sigil-less gate\'s light)', r.meshes <= 3, r);
check('every ray into the doorway meets the door\'s oak at the door\'s plane first: nothing of the mound stands in the doorway (Michael\'s note on #169)', r.n === 30 && r.bad === 0, r);
check('no turf vertex stands in front of the headwall within the doorway\'s width', r.turfFront === 0, r);
check('you can stand on the threshold, within reach of the door, and the mound behind is solid', r.reach && r.mound, r);
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
