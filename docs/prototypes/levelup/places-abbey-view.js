// The Gatelands' monastic ruin (Session 921, card F8): places.js's gatelandsAbbey on its green under a soft autumn day, a mist off the land.
// ?place=abbey&view=abbey (default): from the slope south-east of the ring, the gate, the church and the tower; view=gate: on the path up to
// the gatehouse; view=nave: inside the west door down the roofless nave to the chancel arch; view=tower: from the green up the round tower
// to its door; view=cross: the high cross with the church behind; view=cells: across the green to the beehive cells. &cam=x,y,z,tx,ty,tz.
import * as THREE from 'three';
import { Q, W, H, STATS, makeRenderer, makeComposer, buildTextures, run, skyDome } from './common.js';
import { gatelandsAbbey } from './places.js';
import { stream } from './pieces.js';

const VIEW = Q.get('view') || 'abbey';
const R = makeRenderer(.85), scene = new THREE.Scene(); buildTextures();
scene.fog = new THREE.FogExp2(new THREE.Color(.74, .78, .80), .0065);
const cam = new THREE.PerspectiveCamera(50, W / H, .05, 30000);
const A = gatelandsAbbey({ key: 'abbey:cill' }, stream('abbey:cill')); scene.add(A.group);
// the day: an autumn sun low in the south-west through thin cloud, a cool sky
const SUN = new THREE.Vector3(-.55, .38, .74).normalize(), sun = new THREE.DirectionalLight(new THREE.Color(1, .9, .76), 2.6);
sun.position.copy(SUN).multiplyScalar(90); sun.castShadow = true; sun.shadow.mapSize.set(4096, 4096); sun.shadow.bias = -.0003; sun.shadow.normalBias = .04;
Object.assign(sun.shadow.camera, { left: -45, right: 45, top: 45, bottom: -45, near: 1, far: 220 }); scene.add(sun, sun.target);
scene.add(new THREE.HemisphereLight(new THREE.Color(.66, .72, .84), new THREE.Color(.30, .33, .22), 1.1));
skyDome(scene, SUN);
const g = A.ground, C = A.church, T = A.tower;
let eye, at;
if (VIEW === 'gate') { eye = [3, g(3, 50) + 1.62, 50]; at = [0, 2.6, 20]; }
else if (VIEW === 'nave') { eye = [C.nave.x0 + .8, 1.62, C.z + .6]; at = [C.chancel.x1, 2.2, C.z]; cam.fov = 62; }
else if (VIEW === 'tower') { eye = [-22, 1.62, -6]; at = [T.x, 12, T.z]; cam.fov = 62; }
else if (VIEW === 'cross') { eye = [A.cross.x + 4.2, 1.62, A.cross.z + 7.5]; at = [A.cross.x - 1.5, 3.0, A.cross.z - 6]; }
else if (VIEW === 'cells') { eye = [3, 1.62, 2]; at = [17, 1.8, -7]; cam.fov = 58; }
else { eye = [36, g(36, 46) + 7.5, 46]; at = [-5, 3, -6]; }
cam.position.set(...eye); cam.lookAt(...at);
if (Q.get('cam')) { const c = Q.get('cam').split(',').map(Number); cam.position.set(c[0], c[1], c[2]); cam.lookAt(c[3], c[4], c[5]); }
cam.updateProjectionMatrix();
STATS.place = { place: 'abbey', view: VIEW, tris: A.tris, draws: A.draws, cells: A.cells.length };
run(makeComposer(R, scene, cam, { bloom: .1, sat: 1.0, vig: .3 }), cam);
