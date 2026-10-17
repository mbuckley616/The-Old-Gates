// The Mark's unfinished camp (Session 1032): places.js's markUnfinishedCamp, a camp begun in a spruce clearing and never finished, snowed over with no track.
// ?place=unfinished&view=camp (default): from the road, the half-pitched tent, the laid fire and the sledge; view=tent: by the fire, to the
// pole and the rolled canvas; view=fire: knelt by the laid fire, snow on its kindling; view=far: high over the clearing. &dusk: the evening.
// &cam=x,y,z,tx,ty,tz puts the camera anywhere.
import * as THREE from 'three';
import { Q, W, H, STATS, makeRenderer, makeComposer, buildTextures, run, skyDome } from './common.js';
import { markUnfinishedCamp } from './places.js';
import { stream } from './pieces.js';

const VIEW = Q.get('view') || 'camp', DUSK = Q.has('dusk');
const R = makeRenderer(.8), scene = new THREE.Scene(); buildTextures();
scene.fog = new THREE.FogExp2(DUSK ? new THREE.Color(.5, .46, .48) : new THREE.Color(.8, .83, .87), .016);
const cam = new THREE.PerspectiveCamera(55, W / H, .05, 30000);
const A = markUnfinishedCamp({ key: 'unfinished:vidda' }, stream('unfinished:vidda')); scene.add(A.group);
const SUN = DUSK ? new THREE.Vector3(-.85, .12, .3).normalize() : new THREE.Vector3(.4, .35, .8).normalize(), sun = new THREE.DirectionalLight(DUSK ? new THREE.Color(1, .64, .42) : new THREE.Color(1, .94, .84), DUSK ? 1.0 : 1.8);
sun.position.copy(SUN).multiplyScalar(120); sun.castShadow = true; sun.shadow.mapSize.set(4096, 4096); sun.shadow.bias = -.0003; sun.shadow.normalBias = .05;
Object.assign(sun.shadow.camera, { left: -28, right: 28, top: 28, bottom: -28, near: 1, far: 300 }); scene.add(sun, sun.target);
scene.add(new THREE.HemisphereLight(DUSK ? new THREE.Color(.42, .4, .5) : new THREE.Color(.6, .68, .78), new THREE.Color(.34, .34, .26), DUSK ? .7 : 1.2)); skyDome(scene, SUN);
const g = A.ground, T = A.tent, Fi = A.fire;
let eye, at;
if (VIEW === 'tent') { eye = [Fi.x + 1.2, g(Fi.x + 1.2, Fi.z + 2) + 1.62, Fi.z + 2]; at = [T.pole[0], T.pole[1] - .9, T.pole[2]]; cam.fov = 60; }
else if (VIEW === 'fire') { eye = [Fi.x + .4, g(Fi.x + .4, Fi.z + 1.3) + .9, Fi.z + 1.3]; at = [Fi.x, Fi.tip[1] - .2, Fi.z]; cam.fov = 55; }
else if (VIEW === 'far') { scene.fog.density = .006; eye = [12, 13, 20]; at = [0, 0, 0]; cam.fov = 50; }
else { eye = [2.5, g(2.5, A.road.z) + 1.62, A.road.z]; at = [.4, g(0, 0) + .5, -.6]; cam.fov = 38; }
cam.position.set(...eye); cam.lookAt(...at);
if (Q.get('cam')) { const c = Q.get('cam').split(',').map(Number); cam.position.set(c[0], c[1], c[2]); cam.lookAt(c[3], c[4], c[5]); }
cam.updateProjectionMatrix();
STATS.place = { place: 'unfinished', view: VIEW, dusk: DUSK, tris: A.tris, draws: A.draws, trees: A.trees.length };
run(makeComposer(R, scene, cam, { bloom: DUSK ? .2 : .08, sat: .96, vig: .3 }), cam);
