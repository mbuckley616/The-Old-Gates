// The Gatelands' locked cellar (Session 1026): places.js's gatelandsCellar, a fallen cottage in a field with a padlocked hatch in its floor.
// ?place=cellar&view=ruin (default): from the lane, the footings in nettles and the gable with its stack; view=hatch: in the doorway,
// down to the hatch and its new lock; view=lock: knelt by the hatch; view=far: high over the field. &dusk: the evening.
// &cam=x,y,z,tx,ty,tz puts the camera anywhere.
import * as THREE from 'three';
import { Q, W, H, STATS, makeRenderer, makeComposer, buildTextures, run, skyDome } from './common.js';
import { gatelandsCellar } from './places.js';
import { stream } from './pieces.js';

const VIEW = Q.get('view') || 'ruin', DUSK = Q.has('dusk');
const R = makeRenderer(.8), scene = new THREE.Scene(); buildTextures();
scene.fog = new THREE.FogExp2(DUSK ? new THREE.Color(.5, .46, .48) : new THREE.Color(.74, .76, .78), .013);
const cam = new THREE.PerspectiveCamera(55, W / H, .05, 30000);
const A = gatelandsCellar({ key: 'cellar:sean' }, stream('cellar:sean')); scene.add(A.group);
const SUN = DUSK ? new THREE.Vector3(-.85, .12, .3).normalize() : new THREE.Vector3(.5, .55, .66).normalize(), sun = new THREE.DirectionalLight(DUSK ? new THREE.Color(1, .64, .42) : new THREE.Color(1, .94, .84), DUSK ? 1.2 : 2.3);
sun.position.copy(SUN).multiplyScalar(120); sun.castShadow = true; sun.shadow.mapSize.set(4096, 4096); sun.shadow.bias = -.0003; sun.shadow.normalBias = .05;
Object.assign(sun.shadow.camera, { left: -25, right: 25, top: 25, bottom: -25, near: 1, far: 300 }); scene.add(sun, sun.target);
scene.add(new THREE.HemisphereLight(DUSK ? new THREE.Color(.42, .4, .5) : new THREE.Color(.6, .68, .78), new THREE.Color(.34, .34, .24), DUSK ? .7 : 1.2)); skyDome(scene, SUN);
const g = A.ground, Hh = A.hatch, Ho = A.house;
let eye, at;
if (VIEW === 'hatch') { eye = [0, A.floor + 1.62, Ho.z1 - .1]; at = [Hh.x, A.floor, Hh.z]; cam.fov = 60; }
else if (VIEW === 'lock') { eye = [Hh.x - .2, A.floor + 1.0, Hh.z + Hh.d / 2 + .9]; at = [Hh.lock[0], Hh.lock[1], Hh.lock[2]]; cam.fov = 50; }
else if (VIEW === 'far') { scene.fog.density = .005; eye = [10, 9, 16]; at = [0, 0, 0]; cam.fov = 50; }
else { eye = [4.5, g(4.5, A.road.z - .4) + 1.62, A.road.z - .4]; at = [-.5, A.floor + 1.2, 0]; cam.fov = 60; }
cam.position.set(...eye); cam.lookAt(...at);
if (Q.get('cam')) { const c = Q.get('cam').split(',').map(Number); cam.position.set(c[0], c[1], c[2]); cam.lookAt(c[3], c[4], c[5]); }
cam.updateProjectionMatrix();
STATS.place = { place: 'cellar', view: VIEW, dusk: DUSK, tris: A.tris, draws: A.draws, trees: A.trees.length };
run(makeComposer(R, scene, cam, { bloom: DUSK ? .2 : .08, sat: .96, vig: .3 }), cam);
