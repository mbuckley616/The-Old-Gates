// The Mark's cliff fort (Session 1053, card F8): places.js's markCliffFort on its headland over the fjord, a winter afternoon.
// ?place=clifffort&view=fort (default): from the road inland, the ditch, the palisade and the gate tower, the hall's roof behind;
// view=gate: on the bridge, up into the burst gate; view=inside: inside the gate, the hall, the storehouse and the point; view=beacon: at
// the point by the cold beacon, back over the fort; view=cliff: from the sea's side, the headland's cliffs; view=far: high over it all.
// &cam=x,y,z,tx,ty,tz puts the camera anywhere.
import * as THREE from 'three';
import { Q, W, H, STATS, makeRenderer, makeComposer, buildTextures, run, skyDome } from './common.js';
import { markCliffFort } from './places.js';
import { stream } from './pieces.js';

const VIEW = Q.get('view') || 'fort';
const R = makeRenderer(.8), scene = new THREE.Scene(); buildTextures();
scene.fog = new THREE.FogExp2(new THREE.Color(.78, .82, .88), .006);
const cam = new THREE.PerspectiveCamera(55, W / H, .05, 30000);
const A = markCliffFort({ key: 'clifffort:skarv' }, stream('clifffort:skarv')); scene.add(A.group);
// a winter afternoon: a low sun behind the road, over the land, a pale sky
const SUN = new THREE.Vector3(.62, .36, -.68).normalize(), sun = new THREE.DirectionalLight(new THREE.Color(1, .9, .78), 2.4);
sun.position.copy(SUN).multiplyScalar(140); sun.castShadow = true; sun.shadow.mapSize.set(4096, 4096); sun.shadow.bias = -.0003; sun.shadow.normalBias = .05;
Object.assign(sun.shadow.camera, { left: -55, right: 55, top: 55, bottom: -55, near: 1, far: 400 }); scene.add(sun, sun.target);
scene.add(new THREE.HemisphereLight(new THREE.Color(.66, .72, .84), new THREE.Color(.5, .5, .52), 1.1)); skyDome(scene, SUN);
const g = A.ground, P = A.palisade, Hl = A.hall, Bc = A.beacon;
let eye, at;
if (VIEW === 'gate') { eye = [.4, A.bridge.at(A.bridge.z0 + .6) + 1.62, A.bridge.z0 + .6]; at = [0, 3.4, P.z + 4]; cam.fov = 62; }
else if (VIEW === 'inside') { eye = [1.2, g(1.2, P.z + 3.5) + 1.62, P.z + 3.5]; at = [-1, 2.5, 30]; cam.fov = 64; }
else if (VIEW === 'beacon') { eye = [Bc.x + 2.2, g(Bc.x + 2.2, Bc.z - 3.5) + 1.62, Bc.z - 3.5]; at = [-2, 2.5, 10]; cam.fov = 62; }
else if (VIEW === 'cliff') { scene.fog.density = .003; eye = [62, A.sea + 6, 60]; at = [5, -10, 25]; cam.fov = 55; }
else if (VIEW === 'far') { scene.fog.density = .003; eye = [52, 38, -40]; at = [0, -6, 18]; cam.fov = 50; }
else { eye = [7, g(7, -24) + 1.62, -24]; at = [-1, 3.2, 8]; cam.fov = 58; }
cam.position.set(...eye); cam.lookAt(...at);
if (Q.get('cam')) { const c = Q.get('cam').split(',').map(Number); cam.position.set(c[0], c[1], c[2]); cam.lookAt(c[3], c[4], c[5]); }
cam.updateProjectionMatrix();
STATS.place = { place: 'clifffort', view: VIEW, tris: A.tris, draws: A.draws, logs: P.logs };
run(makeComposer(R, scene, cam, { bloom: .08, sat: .95, vig: .3 }), cam);
