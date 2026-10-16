// The Gatelands' toll bridge (Session 972, card F8): places.js's gatelandsTollBridge, a bridge of three arches tolled at a gate tower.
// ?place=tollbridge&view=bridge (default): from the south bank downstream, the arches, the cutwaters and the tower; view=deck: on the
// bridge's crown, the way to the tower's arch; view=toll: past the tower at the bar, the board and the toll-keeper's cottage;
// view=river: low on the water under the arches; view=far: the crossing from upstream. &open: the bar raised. &cam=x,y,z,tx,ty,tz.
import * as THREE from 'three';
import { Q, W, H, STATS, makeRenderer, makeComposer, buildTextures, run, skyDome } from './common.js';
import { gatelandsTollBridge } from './places.js';
import { stream } from './pieces.js';

const VIEW = Q.get('view') || 'bridge';
const R = makeRenderer(.85), scene = new THREE.Scene(); buildTextures();
scene.fog = new THREE.FogExp2(new THREE.Color(.74, .80, .86), .006);
const cam = new THREE.PerspectiveCamera(50, W / H, .05, 30000);
const A = gatelandsTollBridge({ open: Q.has('open') }, stream('tollbridge:thomastown')); scene.add(A.group);
const SUN = new THREE.Vector3(-.55, .55, -.6).normalize(), sun = new THREE.DirectionalLight(new THREE.Color(1, .94, .82), 2.9);
sun.position.copy(SUN).multiplyScalar(90); sun.castShadow = true; sun.shadow.mapSize.set(4096, 4096); sun.shadow.bias = -.0003; sun.shadow.normalBias = .04;
Object.assign(sun.shadow.camera, { left: -35, right: 35, top: 35, bottom: -35, near: 1, far: 240 }); scene.add(sun, sun.target);
scene.add(new THREE.HemisphereLight(new THREE.Color(.66, .72, .86), new THREE.Color(.30, .33, .22), 1.1)); skyDome(scene, SUN);
const g = A.ground, d = A.deck;
let eye, at;
if (VIEW === 'deck') { eye = [-.6, d(-2) + 1.62, -2]; at = [0, 2.6, 17]; cam.fov = 60; }
else if (VIEW === 'toll') { eye = [-1.2, 1.62, 32]; at = [2, 1.4, 21]; cam.fov = 60; }
else if (VIEW === 'river') { eye = [-16, A.water + 1.2, -3]; at = [0, -1.6, 2]; cam.fov = 55; }
else if (VIEW === 'far') { eye = [34, 3, 10]; at = [0, 1, 6]; cam.fov = 45; }
else { eye = [-22, g(-22, -19) + 1.7, -19]; at = [0, 0, 4]; cam.fov = 55; }
cam.position.set(...eye); cam.lookAt(...at);
if (Q.get('cam')) { const c = Q.get('cam').split(',').map(Number); cam.position.set(c[0], c[1], c[2]); cam.lookAt(c[3], c[4], c[5]); }
cam.updateProjectionMatrix();
STATS.place = { place: 'tollbridge', view: VIEW, tris: A.tris, draws: A.draws, open: A.bar.open };
run(makeComposer(R, scene, cam, { bloom: .1, sat: 1.0, vig: .3 }), cam);
