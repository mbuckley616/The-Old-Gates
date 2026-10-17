// The Gatelands' falls (Session 1008, card F8): places.js's gatelandsFalls, overgrown arches by a waterfall and the cave behind it.
// ?place=falls&view=arches (default): on the path below the arcade, the fall framed in its first bay; view=falls: from the pool's east bank;
// view=behind: on the shelf behind the curtain, looking out through the water; view=cave: at the cave's mouth, in to the dark;
// view=far: high over the glen. &cam=x,y,z,tx,ty,tz puts the camera anywhere.
import * as THREE from 'three';
import { Q, W, H, STATS, makeRenderer, makeComposer, buildTextures, run, skyDome } from './common.js';
import { gatelandsFalls } from './places.js';
import { stream } from './pieces.js';

const VIEW = Q.get('view') || 'arches';
const R = makeRenderer(.8), scene = new THREE.Scene(); buildTextures();
scene.fog = new THREE.FogExp2(new THREE.Color(.74, .8, .8), .007);
const cam = new THREE.PerspectiveCamera(55, W / H, .05, 30000);
const A = gatelandsFalls({ key: 'falls:essnalarach' }, stream('falls:essnalarach')); scene.add(A.group);
// a soft Gatelands afternoon, the sun high in the south-west, down the glen onto the face
const SUN = new THREE.Vector3(-.35, .7, .62).normalize(), sun = new THREE.DirectionalLight(new THREE.Color(1, .95, .86), 2.4);
sun.position.copy(SUN).multiplyScalar(120); sun.castShadow = true; sun.shadow.mapSize.set(4096, 4096); sun.shadow.bias = -.0003; sun.shadow.normalBias = .05;
Object.assign(sun.shadow.camera, { left: -45, right: 45, top: 45, bottom: -45, near: 1, far: 300 }); sun.target.position.set(2, 4, 8); sun.position.add(sun.target.position); scene.add(sun, sun.target);
scene.add(new THREE.HemisphereLight(new THREE.Color(.6, .7, .78), new THREE.Color(.36, .4, .28), 1.25)); skyDome(scene, SUN);
// the daylight off the pool and through the curtain, thrown in under the overhang and a few metres into the cave
{ const b = new THREE.PointLight(new THREE.Color(.8, .88, .9), 26, 16, 1.4); b.position.set(A.cave.x + .5, A.LY + 1.4, A.cave.z0 + 2.2); scene.add(b); }
const P = A.path, fz = A.faceZ, g = A.floorH, C = A.cave, Ar = A.arcade;
let eye, at;
if (VIEW === 'falls') { eye = [7.6, g(7.6, 9) + 1.62, 9]; at = [-.5, 5.5, 0]; cam.fov = 62; }
else if (VIEW === 'behind') { eye = [1.6, A.LY + 1.62, -1.1]; at = [.4, 2.2, 8]; cam.fov = 70; }
else if (VIEW === 'cave') { eye = [C.x + .3, A.LY + 1.62, C.z0 + 1.4]; at = [C.x, A.LY + 1.2, C.z0 - 9]; cam.fov = 62; }
else if (VIEW === 'far') { eye = [16, 24, 52]; at = [1, 4, 4]; cam.fov = 50; }
else { const b = Ar.bays[0], x = (b.x0 + b.x1) / 2; eye = [x + .3, g(x + .3, Ar.z + 6.5) + 1.62, Ar.z + 6.5]; at = [-1, 6.5, 0]; cam.fov = 60; }
cam.position.set(...eye); cam.lookAt(...at);
if (Q.get('cam')) { const c = Q.get('cam').split(',').map(Number); cam.position.set(c[0], c[1], c[2]); cam.lookAt(c[3], c[4], c[5]); }
cam.updateProjectionMatrix();
STATS.place = { place: 'falls', view: VIEW, tris: A.tris, draws: A.draws, lip: A.fall.lipY, foot: A.fall.foot };
run(makeComposer(R, scene, cam, { bloom: .08, sat: 1.0, vig: .3 }), cam);
