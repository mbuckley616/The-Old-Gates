// The Gatelands' tower mill (Session 949, card F8): places.js's gatelandsMill on its knoll under a fresh day, the sails to the south-west.
// ?place=mill&view=mill (default): from the lane, the tower, the cap and the sails; view=sails: under the sails by the front door;
// view=back: from behind, the tail pole down to its wheel; view=far: the mill on its knoll from across the fields. &still: a mill at rest,
// its cloths furled. &cam=x,y,z,tx,ty,tz.
import * as THREE from 'three';
import { Q, W, H, STATS, makeRenderer, makeComposer, buildTextures, run, skyDome } from './common.js';
import { gatelandsMill } from './places.js';
import { stream } from './pieces.js';

const VIEW = Q.get('view') || 'mill';
const R = makeRenderer(.85), scene = new THREE.Scene(); buildTextures();
scene.fog = new THREE.FogExp2(new THREE.Color(.76, .80, .84), .006);
const cam = new THREE.PerspectiveCamera(50, W / H, .05, 30000);
const A = gatelandsMill({ wind: .35, working: !Q.has('rest') }, stream('mill:tacumshane')); scene.add(A.group);
const SUN = new THREE.Vector3(-.45, .55, .7).normalize(), sun = new THREE.DirectionalLight(new THREE.Color(1, .94, .82), 2.9);
sun.position.copy(SUN).multiplyScalar(90); sun.castShadow = true; sun.shadow.mapSize.set(4096, 4096); sun.shadow.bias = -.0003; sun.shadow.normalBias = .04;
Object.assign(sun.shadow.camera, { left: -25, right: 25, top: 25, bottom: -25, near: 1, far: 220 }); scene.add(sun, sun.target);
scene.add(new THREE.HemisphereLight(new THREE.Color(.66, .72, .86), new THREE.Color(.30, .33, .22), 1.1));
skyDome(scene, SUN);
const g = A.ground;
let eye, at;
if (VIEW === 'sails') { eye = [1.6, 1.62, 6.2]; at = [A.hub[0], A.hub[1] - 1, A.hub[2]]; cam.fov = 70; }
else if (VIEW === 'back') { eye = [-9, 1.7, -14]; at = [0, 6, 0]; cam.fov = 55; }
else if (VIEW === 'far') { eye = [30, g(30, 38) + 1.7, 38]; at = [0, 7, 0]; cam.fov = 40; }
else { eye = [8, 1.7, 22]; at = [0, 7.5, 0]; cam.fov = 55; }
cam.position.set(...eye); cam.lookAt(...at);
if (Q.get('cam')) { const c = Q.get('cam').split(',').map(Number); cam.position.set(c[0], c[1], c[2]); cam.lookAt(c[3], c[4], c[5]); }
cam.updateProjectionMatrix();
STATS.place = { place: 'mill', view: VIEW, tris: A.tris, draws: A.draws, tipLow: A.tipLow };
run(makeComposer(R, scene, cam, { bloom: .1, sat: 1.0, vig: .3 }), cam);
