// The Mark's silver mine's head (Session 1204): places.js's markMineHead, the terrace before markMine's adit, its adit house, the shaft
// under its headframe, the horse whim and the sorting house, in early winter.
// ?place=minehead&view=head (default): from the track at the terrace's east end, past the whim to the headframe and the adit house;
// view=whim: under the whim's roof by the axle, the drum over you and the rope going out to the sheave; view=shaft: at the shaft's fence,
// down past the kibble; view=adit: at the adit house's door, up the tramway into the dark; view=tip: on the trestle's end, back along the
// tramway; view=far: high over the valley. &dusk: the evening. &cam=x,y,z,tx,ty,tz puts the camera anywhere.
import * as THREE from 'three';
import { Q, W, H, STATS, makeRenderer, makeComposer, buildTextures, run, skyDome } from './common.js';
import { markMineHead } from './places.js';
import { stream } from './pieces.js';

const VIEW = Q.get('view') || 'head', DUSK = Q.has('dusk');
const R = makeRenderer(.8), scene = new THREE.Scene(); buildTextures();
scene.fog = new THREE.FogExp2(DUSK ? new THREE.Color(.44, .46, .56) : new THREE.Color(.78, .82, .88), .010);
const cam = new THREE.PerspectiveCamera(55, W / H, .05, 30000);
const A = markMineHead({ key: 'minehead:sølvberg' }, stream('minehead:sølvberg')); scene.add(A.group);
const SUN = DUSK ? new THREE.Vector3(-.8, .1, .35).normalize() : new THREE.Vector3(.5, .45, .74).normalize(), sun = new THREE.DirectionalLight(DUSK ? new THREE.Color(1, .66, .48) : new THREE.Color(1, .95, .88), DUSK ? 1.1 : 2.1);
sun.position.copy(SUN).multiplyScalar(120); sun.castShadow = true; sun.shadow.mapSize.set(4096, 4096); sun.shadow.bias = -.0003; sun.shadow.normalBias = .05;
Object.assign(sun.shadow.camera, { left: -34, right: 34, top: 34, bottom: -34, near: 1, far: 300 }); scene.add(sun, sun.target);
scene.add(new THREE.HemisphereLight(DUSK ? new THREE.Color(.42, .44, .56) : new THREE.Color(.62, .7, .82), new THREE.Color(.5, .5, .52), DUSK ? .7 : 1.15)); skyDome(scene, SUN);
const g = A.ground, Wm = A.whim, S = A.shaft, Ad = A.adit, T = A.terrace;
let eye, at;
if (VIEW === 'whim') { const a = 2.4; eye = [Wm.x + Math.sin(a) * 2.2, 1.62, Wm.z + Math.cos(a) * 2.2]; at = [A.sheave.x, 3.6, A.sheave.z]; cam.fov = 68; }
else if (VIEW === 'shaft') { eye = [S.x + .25, 1.75, S.z + S.fence.half - .15]; at = [S.x, -3, S.z - 1]; cam.fov = 70; /* leaning over the rail */ }
else if (VIEW === 'adit') { const z = A.aditHouse.z1 + 3.2; eye = [Ad.x + .6, 1.62, z]; at = [Ad.x, 1.3, Ad.z - 6]; cam.fov = 58; }
else if (VIEW === 'tip') { eye = [A.rails.x + .4, 1.62, A.rails.z1 - .4]; at = [A.rails.x - 1, 1.2, T.z0]; cam.fov = 62; }
else if (VIEW === 'far') { scene.fog.density = .004; eye = [44, 30, 56]; at = [-2, 0, -4]; cam.fov = 48; }
else { eye = [T.x1 + 3, g(T.x1 + 3, 6.5) + 1.62, 6.5]; at = [-4, 2.6, -2]; cam.fov = 62; }
cam.position.set(...eye); cam.lookAt(...at);
if (Q.get('cam')) { const c = Q.get('cam').split(',').map(Number); cam.position.set(c[0], c[1], c[2]); cam.lookAt(c[3], c[4], c[5]); }
cam.updateProjectionMatrix();
STATS.place = { place: 'minehead', view: VIEW, dusk: DUSK, tris: A.tris, draws: A.draws, sets: Ad.sets.length, posts: Wm.posts.length, trees: A.trees.length };
run(makeComposer(R, scene, cam, { bloom: DUSK ? .2 : .08, sat: .96, vig: .3 }), cam);
