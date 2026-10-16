// The Gatelands' abandoned shepherd's hut (Session 997, card F8): places.js's gatelandsShepherdHut, a summer hut and its fold on the hill.
// ?place=shepherd&view=hut (default): from the track below, the hut's front, the door and the rowan; view=inside: in the hut by the hearth,
// the fallen rafters and the door, the sky over the walls; view=fold: from the breach across the pen to the gate and the hut; view=spring:
// below the spring, its kerb, the water and the slab hood; view=far: the whole place from high over the hill. &cam=x,y,z,tx,ty,tz.
import * as THREE from 'three';
import { Q, W, H, STATS, makeRenderer, makeComposer, buildTextures, run, skyDome } from './common.js';
import { gatelandsShepherdHut } from './places.js';
import { stream } from './pieces.js';

const VIEW = Q.get('view') || 'hut';
const R = makeRenderer(.85), scene = new THREE.Scene(); buildTextures();
scene.fog = new THREE.FogExp2(new THREE.Color(.74, .76, .76), .014);
const cam = new THREE.PerspectiveCamera(55, W / H, .05, 30000);
const A = gatelandsShepherdHut({ key: 'shepherd:slievemore' }, stream('shepherd:slievemore')); scene.add(A.group);
// an autumn afternoon: the sun low in the south-west through thin cloud
const SUN = new THREE.Vector3(-.55, .35, .75).normalize(), sun = new THREE.DirectionalLight(new THREE.Color(1, .9, .76), 2.0);
sun.position.copy(SUN).multiplyScalar(80); sun.castShadow = true; sun.shadow.mapSize.set(4096, 4096); sun.shadow.bias = -.0003; sun.shadow.normalBias = .04;
Object.assign(sun.shadow.camera, { left: -26, right: 26, top: 26, bottom: -26, near: 1, far: 220 }); sun.target.position.set(3, 0, 2); sun.position.add(sun.target.position); scene.add(sun, sun.target);
scene.add(new THREE.HemisphereLight(new THREE.Color(.7, .72, .76), new THREE.Color(.3, .28, .2), 1.3)); skyDome(scene, SUN);
const g = A.ground, Hu = A.hut, Fo = A.fold, Sp = A.spring;
let eye, at;
if (VIEW === 'inside') { eye = [Hu.gableW + .5, 1.62, -.95]; at = [Hu.door.x, 1.0, Hu.d / 2]; cam.fov = 70; }
else if (VIEW === 'fold') { const a = Fo.breach.a + .35, x = Fo.x + (Fo.r + 4.5) * Math.cos(a), z = Fo.z + (Fo.r + 4.5) * Math.sin(a); eye = [x, g(x, z) + 1.62, z]; at = [Fo.x - 2, g(Fo.x, Fo.z) + .3, Fo.z - 1]; cam.fov = 62; }
else if (VIEW === 'spring') { eye = [Sp.x + 1.1, g(Sp.x + 1.1, Sp.z + 1.5) + 1.62, Sp.z + 1.5]; at = [Sp.x - .1, Sp.water, Sp.z - .4]; cam.fov = 60; }
else if (VIEW === 'far') { eye = [-14, 13, 20]; at = [4, -1, 1]; cam.fov = 50; }
else { eye = [3.4, g(3.4, 9.5) + 1.62, 9.5]; at = [-.3, 1.2, 0]; }
cam.position.set(...eye); cam.lookAt(...at);
if (Q.get('cam')) { const c = Q.get('cam').split(',').map(Number); cam.position.set(c[0], c[1], c[2]); cam.lookAt(c[3], c[4], c[5]); }
cam.updateProjectionMatrix();
STATS.place = { place: 'shepherd', view: VIEW, tris: A.tris, draws: A.draws };
run(makeComposer(R, scene, cam, { bloom: .08, sat: .95, vig: .3 }), cam);
