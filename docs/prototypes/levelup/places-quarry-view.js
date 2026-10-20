// The Gatelands' limestone quarry (Session 1155): places.js's gatelandsQuarry, a small quarry cut back into a hill of bedded limestone,
// with its shear legs, its stacked blocks and a draw kiln in the bank by the mouth.
// ?place=quarry&view=quarry (default): from the track at the mouth, into the pit to the faces, the bench and the shear legs; view=face: on the
// floor under the lower face, the beds at arm's length and the wedges; view=kiln: from the yard, the draw arch and the eye; view=top: on the
// bank behind the kiln, over its pot to the yard below; view=far: high over the hill. &dusk: the evening. &cam=x,y,z,tx,ty,tz puts the camera anywhere.
import * as THREE from 'three';
import { Q, W, H, STATS, makeRenderer, makeComposer, buildTextures, run, skyDome } from './common.js';
import { gatelandsQuarry } from './places.js';
import { stream } from './pieces.js';

const VIEW = Q.get('view') || 'quarry', DUSK = Q.has('dusk');
const R = makeRenderer(.8), scene = new THREE.Scene(); buildTextures();
scene.fog = new THREE.FogExp2(DUSK ? new THREE.Color(.5, .46, .48) : new THREE.Color(.74, .76, .78), .011);
const cam = new THREE.PerspectiveCamera(55, W / H, .05, 30000);
const A = gatelandsQuarry({ key: 'quarry:seán' }, stream('quarry:seán')); scene.add(A.group);
const SUN = DUSK ? new THREE.Vector3(-.85, .12, .3).normalize() : new THREE.Vector3(.45, .6, .66).normalize(), sun = new THREE.DirectionalLight(DUSK ? new THREE.Color(1, .64, .42) : new THREE.Color(1, .94, .84), DUSK ? 1.2 : 2.3);
sun.position.copy(SUN).multiplyScalar(120); sun.castShadow = true; sun.shadow.mapSize.set(4096, 4096); sun.shadow.bias = -.0003; sun.shadow.normalBias = .05;
Object.assign(sun.shadow.camera, { left: -30, right: 30, top: 30, bottom: -30, near: 1, far: 300 }); scene.add(sun, sun.target);
scene.add(new THREE.HemisphereLight(DUSK ? new THREE.Color(.42, .4, .5) : new THREE.Color(.6, .68, .78), new THREE.Color(.34, .34, .24), DUSK ? .7 : 1.2)); skyDome(scene, SUN);
const g = A.ground, P = A.pit, K = A.kiln;
let eye, at;
if (VIEW === 'face') { eye = [-2.6, 1.62, P.bz + 3.2]; at = [2.5, 1.2, P.bz]; cam.fov = 62; }
else if (VIEW === 'kiln') { eye = [K.x - 3.5, g(K.x - 3.5, K.z1 + 6.5) + 1.62, K.z1 + 6.5]; at = [K.x, 1.6, K.z1]; cam.fov = 55; }
else if (VIEW === 'top') { const z = K.bank.z - .8; eye = [K.x + 1.2, g(K.x + 1.2, z) + 1.62, z]; at = [K.x - 2.2, K.top - 1.2, K.pot.z + 3.5]; cam.fov = 62; }
else if (VIEW === 'far') { scene.fog.density = .004; eye = [30, 26, 34]; at = [3, 1, -4]; cam.fov = 50; }
else { eye = [3.5, g(3.5, P.mouth + 6) + 1.62, P.mouth + 6]; at = [-1, 2.6, P.z0]; cam.fov = 62; }
cam.position.set(...eye); cam.lookAt(...at);
if (Q.get('cam')) { const c = Q.get('cam').split(',').map(Number); cam.position.set(c[0], c[1], c[2]); cam.lookAt(c[3], c[4], c[5]); }
cam.updateProjectionMatrix();
STATS.place = { place: 'quarry', view: VIEW, dusk: DUSK, tris: A.tris, draws: A.draws, faces: A.faces.length, beds: A.beds.length, trees: A.trees.length };
run(makeComposer(R, scene, cam, { bloom: DUSK ? .2 : .08, sat: .96, vig: .3 }), cam);
