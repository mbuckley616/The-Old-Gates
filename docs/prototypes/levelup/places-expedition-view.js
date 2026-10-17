// Aurenne's abandoned expedition (Session 1023, card F8): places.js's aurenneExpedition, a dig's camp left in haste on a dry hillside.
// ?place=expedition&view=camp (default): from the road, the camp on its terrace, the tents, the cart down; view=tents: by the cold fire,
// the standing tent and the fallen one; view=dig: on the trench's lip, the ladder, the drum lifted out; view=cart: by the handcart and
// its crates; view=far: high over the road. &dusk: the evening. &cam=x,y,z,tx,ty,tz puts the camera anywhere.
import * as THREE from 'three';
import { Q, W, H, STATS, makeRenderer, makeComposer, buildTextures, run, skyDome } from './common.js';
import { aurenneExpedition } from './places.js';
import { stream } from './pieces.js';

const VIEW = Q.get('view') || 'camp', DUSK = Q.has('dusk');
const R = makeRenderer(.8), scene = new THREE.Scene(); buildTextures();
scene.fog = new THREE.FogExp2(DUSK ? new THREE.Color(.56, .46, .42) : new THREE.Color(.8, .82, .82), .011);
const cam = new THREE.PerspectiveCamera(55, W / H, .05, 30000);
const A = aurenneExpedition({ key: 'expedition:serrasecca' }, stream('expedition:serrasecca')); scene.add(A.group);
// a hot still afternoon on Aurenne's hills, the sun high in the south-west; &dusk, low in the west
const SUN = DUSK ? new THREE.Vector3(-.85, .12, .3).normalize() : new THREE.Vector3(-.35, .78, .52).normalize(), sun = new THREE.DirectionalLight(DUSK ? new THREE.Color(1, .64, .42) : new THREE.Color(1, .96, .88), DUSK ? 1.4 : 2.6);
sun.position.copy(SUN).multiplyScalar(120); sun.castShadow = true; sun.shadow.mapSize.set(4096, 4096); sun.shadow.bias = -.0003; sun.shadow.normalBias = .05;
Object.assign(sun.shadow.camera, { left: -40, right: 40, top: 40, bottom: -40, near: 1, far: 300 }); sun.target.position.set(0, 0, -2); sun.position.add(sun.target.position); scene.add(sun, sun.target);
scene.add(new THREE.HemisphereLight(DUSK ? new THREE.Color(.44, .4, .5) : new THREE.Color(.62, .7, .82), new THREE.Color(.4, .36, .26), DUSK ? .7 : 1.1)); skyDome(scene, SUN);
const g = A.ground, Tu = A.tents.up, Tr = A.trench, C = A.cart;
let eye, at;
if (VIEW === 'tents') { eye = [A.fire.x + 1.8, g(A.fire.x + 1.8, A.fire.z + 2.6) + 1.62, A.fire.z + 2.6]; at = [A.fire.x - 1, Tu.floor + .8, Tu.z - 1]; cam.fov = 64; }
else if (VIEW === 'dig') { eye = [Tr.x + Tr.L / 2 + 2.8, g(Tr.x + Tr.L / 2 + 2.8, Tr.z - 1.0) + 1.62, Tr.z - 1.0]; at = [Tr.x - 1, Tr.floor + .6, Tr.z]; cam.fov = 64; }
else if (VIEW === 'cart') { eye = [C.wheel.x - 2.6, g(C.wheel.x - 2.6, C.wheel.z + 2.6) + 1.62, C.wheel.z + 2.6]; at = [C.wheel.x + .2, C.wheel.y - .3, C.wheel.z - 1.2]; cam.fov = 62; }
else if (VIEW === 'far') { scene.fog.density = .005; eye = [16, 18, 34]; at = [-1, -1, -3]; cam.fov = 50; }
else { eye = [2.4, g(2.4, A.road.z + .4) + 1.62, A.road.z + .4]; at = [-.5, Tu.floor + 1.0, -2.5]; cam.fov = 62; }
cam.position.set(...eye); cam.lookAt(...at);
if (Q.get('cam')) { const c = Q.get('cam').split(',').map(Number); cam.position.set(c[0], c[1], c[2]); cam.lookAt(c[3], c[4], c[5]); }
cam.updateProjectionMatrix();
STATS.place = { place: 'expedition', view: VIEW, dusk: DUSK, tris: A.tris, draws: A.draws, trees: A.trees.length };
run(makeComposer(R, scene, cam, { bloom: DUSK ? .2 : .08, sat: .96, vig: .3 }), cam);
