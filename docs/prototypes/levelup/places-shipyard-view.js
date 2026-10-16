// The Gatelands' shipyard (Session 981, card F8): places.js's gatelandsShipyard, a sloop in frame on a slip, the finished one at the quay.
// ?place=shipyard&view=yard (default): from the yard's corner over the slip, the hull on the stocks and the harbour; view=stocks: under
// the hull by the keel blocks, up its frames; view=staging: on the staging beside the frames; view=quay: on the quay by the finished
// sloop, back to the slip; view=shed: under the shed by the sawpit; view=sea: from the harbour. &cam=x,y,z,tx,ty,tz.
import * as THREE from 'three';
import { Q, W, H, STATS, makeRenderer, makeComposer, buildTextures, run, skyDome } from './common.js';
import { gatelandsShipyard } from './places.js';
import { stream } from './pieces.js';

const VIEW = Q.get('view') || 'yard';
const R = makeRenderer(.85), scene = new THREE.Scene(); buildTextures();
scene.fog = new THREE.FogExp2(new THREE.Color(.74, .80, .86), .006);
const cam = new THREE.PerspectiveCamera(50, W / H, .05, 30000);
const A = gatelandsShipyard({ key: 'shipyard:arklow' }, stream('shipyard:arklow')); scene.add(A.group);
const SUN = new THREE.Vector3(.5, .6, -.6).normalize(), sun = new THREE.DirectionalLight(new THREE.Color(1, .94, .82), 2.9);
sun.position.copy(SUN).multiplyScalar(90); sun.castShadow = true; sun.shadow.mapSize.set(4096, 4096); sun.shadow.bias = -.0003; sun.shadow.normalBias = .04;
Object.assign(sun.shadow.camera, { left: -38, right: 38, top: 38, bottom: -38, near: 1, far: 240 }); scene.add(sun, sun.target);
scene.add(new THREE.HemisphereLight(new THREE.Color(.66, .72, .86), new THREE.Color(.30, .33, .22), 1.1)); skyDome(scene, SUN);
const g = A.ground;
let eye, at;
if (VIEW === 'stocks') { eye = [-2.6, g(-2.6, 7) + 1.62, 7]; at = [0, 2.2, 14]; cam.fov = 62; }
else if (VIEW === 'staging') { eye = [-A.staging.x, A.staging.y + 1.62 + (9 - A.hull.z) * A.slope, 9]; at = [-.5, A.hull.y + .4, 15]; cam.fov = 62; }
else if (VIEW === 'quay') { eye = [A.quay.x0 + 2, A.quay.top + 1.62, -16]; at = [0, 2, 10]; cam.fov = 58; }
else if (VIEW === 'shed') { eye = [-9.5, g(-9.5, 9.5) + 1.62, 9.5]; at = [-12, 1.4, 17]; cam.fov = 60; }
else if (VIEW === 'sea') { eye = [-8, 2.2, -30]; at = [2, 2, 6]; cam.fov = 50; }
else { eye = [-24, g(-24, 3) + 3, 3]; at = [2, 2, 12]; cam.fov = 55; }
cam.position.set(...eye); cam.lookAt(...at);
if (Q.get('cam')) { const c = Q.get('cam').split(',').map(Number); cam.position.set(c[0], c[1], c[2]); cam.lookAt(c[3], c[4], c[5]); }
cam.updateProjectionMatrix();
STATS.place = { place: 'shipyard', view: VIEW, tris: A.tris, draws: A.draws };
run(makeComposer(R, scene, cam, { bloom: .1, sat: 1.0, vig: .3 }), cam);
