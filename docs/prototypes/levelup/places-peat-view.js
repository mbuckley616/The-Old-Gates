// The Gatelands' peat-cutting camp (Session 991, card F8): places.js's gatelandsPeatCamp, a turf bank on a raised bog under autumn mist.
// ?place=peat&view=camp (default): from the bog road, the footings, the bank's lip, the rick and the bothy; view=bank: on the cutaway's
// floor at the face, the two spits and the sleán above; view=spread: on the bank among the footings, out over the cut; view=hut: by
// the fire, the bothy's door; view=far: the whole camp from high over the cutaway. &cam=x,y,z,tx,ty,tz puts the camera anywhere.
import * as THREE from 'three';
import { Q, W, H, STATS, makeRenderer, makeComposer, buildTextures, run, skyDome } from './common.js';
import { gatelandsPeatCamp } from './places.js';
import { stream } from './pieces.js';

const VIEW = Q.get('view') || 'camp';
const R = makeRenderer(.85), scene = new THREE.Scene(); buildTextures();
scene.fog = new THREE.FogExp2(new THREE.Color(.74, .75, .74), .015);
const cam = new THREE.PerspectiveCamera(55, W / H, .05, 30000);
const A = gatelandsPeatCamp({ key: 'peat:moneen' }, stream('peat:moneen')); scene.add(A.group);
// an autumn afternoon: the sun low in the south-west through thin cloud, the light soft
const SUN = new THREE.Vector3(-.5, .3, .8).normalize(), sun = new THREE.DirectionalLight(new THREE.Color(1, .9, .76), 1.9);
sun.position.copy(SUN).multiplyScalar(80); sun.castShadow = true; sun.shadow.mapSize.set(4096, 4096); sun.shadow.bias = -.0003; sun.shadow.normalBias = .04;
Object.assign(sun.shadow.camera, { left: -36, right: 36, top: 36, bottom: -36, near: 1, far: 220 }); scene.add(sun, sun.target);
scene.add(new THREE.HemisphereLight(new THREE.Color(.7, .72, .76), new THREE.Color(.3, .27, .2), 1.3)); skyDome(scene, SUN);
{ const l = new THREE.PointLight(new THREE.Color(1, .5, .2), 3, 4, 1.6); l.position.set(A.fire.x, A.fire.embers + .25, A.fire.z); scene.add(l); }
const g = A.ground, Hu = A.hut, Fi = A.fire;
let eye, at;
if (VIEW === 'bank') { eye = [1.2, g(1.2, 2.2) + 1.62, 2.2]; at = [-4, -.6, -.2]; cam.fov = 62; }
else if (VIEW === 'spread') { eye = [9, g(9, -12.4) + 1.62, -12.4]; at = [-2, -.8, 3]; cam.fov = 60; }
else if (VIEW === 'hut') { eye = [Fi.x + 1.6, g(Fi.x + 1.6, Fi.z + 2.6) + 1.62, Fi.z + 2.6]; at = [Hu.x - .4, Hu.y + .9, Hu.z]; cam.fov = 60; }
else if (VIEW === 'far') { eye = [-15, 9, 17]; at = [2, -1, -7]; cam.fov = 50; }
else { eye = [-24, g(-24, -17) + 1.62, -17]; at = [4, -.4, -7]; }
cam.position.set(...eye); cam.lookAt(...at);
if (Q.get('cam')) { const c = Q.get('cam').split(',').map(Number); cam.position.set(c[0], c[1], c[2]); cam.lookAt(c[3], c[4], c[5]); }
cam.updateProjectionMatrix();
STATS.place = { place: 'peat', view: VIEW, tris: A.tris, draws: A.draws, footings: A.footings.length, spread: A.spread.length };
run(makeComposer(R, scene, cam, { bloom: .08, sat: .95, vig: .3 }), cam);
