// The Mark's outpost under the aurora (Session 1243, card F8): places.js's markAuroraOutpost on its cove at night, auroraCurtains over it.
// ?place=aurora&view=shore (default): from the slope behind the houses, over them and the beach to the cove under the curtains; view=arch: on the path above
// the jawbone arch, down to the cove; view=works: at the try-works; view=slip: at the head of the slip; view=far: high over it all.
// &day: a grey noon and no aurora. &cam=x,y,z,tx,ty,tz.
import * as THREE from 'three';
import { Q, W, H, STATS, makeRenderer, makeComposer, buildTextures, run, skyDome } from './common.js';
import { markAuroraOutpost, auroraCurtains } from './places.js';
import { stream } from './pieces.js';

const VIEW = Q.get('view') || 'shore', NIGHT = !Q.has('day');
const R = makeRenderer(NIGHT ? 1.3 : 1.0), scene = new THREE.Scene(); buildTextures();
scene.fog = new THREE.FogExp2(NIGHT ? new THREE.Color(.03, .05, .08) : new THREE.Color(.74, .78, .84), NIGHT ? .0035 : .003);
const cam = new THREE.PerspectiveCamera(55, W / H, .05, 30000);
const A = markAuroraOutpost({ key: 'aurora:nes' }, stream('aurora:nes')); scene.add(A.group);
const SUN = NIGHT ? new THREE.Vector3(-.2, .35, -.9).normalize() : new THREE.Vector3(.4, .35, -.8).normalize(), sun = new THREE.DirectionalLight(NIGHT ? new THREE.Color(.45, .7, .65) : new THREE.Color(1, .92, .82), NIGHT ? .45 : 2.0);
sun.position.copy(SUN).multiplyScalar(160); sun.castShadow = true; sun.shadow.mapSize.set(4096, 4096); sun.shadow.bias = -.0003; sun.shadow.normalBias = .05;
Object.assign(sun.shadow.camera, { left: -50, right: 50, top: 50, bottom: -50, near: 1, far: 400 }); sun.target.position.set(0, 2, 18); scene.add(sun, sun.target);
scene.add(new THREE.HemisphereLight(NIGHT ? new THREE.Color(.12, .2, .22) : new THREE.Color(.66, .72, .84), NIGHT ? new THREE.Color(.03, .03, .05) : new THREE.Color(.45, .45, .44), NIGHT ? .7 : 1.4));
let AU = null;
if (NIGHT) { scene.background = new THREE.Color(.015, .03, .055); AU = auroraCurtains(stream('aurora:nes:sky')); scene.add(AU.group);
  { const n = 900, p = []; const rs = stream('aurora:stars'); for (let k = 0; k < n; k++) { const a = rs() * Math.PI * 2, e = Math.asin(.08 + rs() * .9), d = 4000; p.push(Math.cos(a) * Math.cos(e) * d, Math.sin(e) * d, Math.sin(a) * Math.cos(e) * d); }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(p, 3)); scene.add(new THREE.Points(g, new THREE.PointsMaterial({ color: 0xcfd8e8, size: 1.6, sizeAttenuation: false, fog: false }))); }
  for (const [x, y, z] of A.works.pots) { const l = new THREE.PointLight(new THREE.Color(1, .55, .25), 6, 9, 1.6); l.position.set(x, y - .7, z - 1.4); scene.add(l); }
  for (const h of A.houses) { const l = new THREE.PointLight(new THREE.Color(1, .75, .45), 3, 7, 1.6); l.position.set(h.door[0], h.y + 2.4, h.door[1] + 1.2); scene.add(l); } }
else skyDome(scene, SUN);
const g = A.ground, E = 1.62, w = A.works, s = A.slip;
let eye, at;
if (VIEW === 'arch') { eye = [.4, g(.4, 29) + E, 29]; at = [-2, 2, -30]; cam.fov = 64; }
else if (VIEW === 'works') { eye = [w.x - 3.2, g(w.x - 3.2, w.z - 3.4) + E, w.z - 3.4]; at = [w.x + .4, w.y + 1, w.z]; cam.fov = 62; }
else if (VIEW === 'slip') { eye = [s.x + 1.2, g(s.x + 1.2, s.z1 + 2) + E, s.z1 + 2]; at = [s.x - 1, -1, s.z0 - 10]; cam.fov = 62; }
else if (VIEW === 'far') { scene.fog.density = .0015; eye = [-14, 55, -75]; at = [2, 2, 16]; cam.fov = 50; }
else { eye = [9, g(9, 58) + 9, 58]; at = [-3, 10, -60]; cam.fov = 62; }
cam.position.set(...eye); cam.lookAt(...at);
if (Q.get('cam')) { const c = Q.get('cam').split(',').map(Number); cam.position.set(c[0], c[1], c[2]); cam.lookAt(c[3], c[4], c[5]); }
cam.updateProjectionMatrix();
STATS.place = { place: 'aurora', view: VIEW, night: NIGHT, tris: A.tris, draws: A.draws + (AU ? AU.draws : 0), houses: A.houses.length };
run(makeComposer(R, scene, cam, { bloom: NIGHT ? .35 : .08, sat: 1.0, vig: .35 }), cam);
