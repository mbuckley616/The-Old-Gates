// The Gatelands' charcoal burners' camp (Session 1016, card F8): places.js's gatelandsCharcoalCamp, a collier's camp by a road through coppice.
// ?place=charcoal&view=camp (default): from the road where the path leaves it, the smoking stack beyond the cordwood and the hut;
// view=stack: on the hearth by the ladder, the stack's flank, its vents and the hurdles behind; view=heap: by the opened stack, the
// charcoal raked out and the sacks; view=hut: before the hut's door with its fire; view=far: high over the road, the camp in the trees.
// &dusk: the evening, the vents and the fire glowing, the smoke against the low sun. &cam=x,y,z,tx,ty,tz puts the camera anywhere.
import * as THREE from 'three';
import { Q, W, H, STATS, makeRenderer, makeComposer, buildTextures, run, skyDome } from './common.js';
import { gatelandsCharcoalCamp } from './places.js';
import { stream } from './pieces.js';

const VIEW = Q.get('view') || 'camp', DUSK = Q.has('dusk');
const R = makeRenderer(.8), scene = new THREE.Scene(); buildTextures();
scene.fog = new THREE.FogExp2(DUSK ? new THREE.Color(.5, .44, .42) : new THREE.Color(.72, .76, .74), .014);
const cam = new THREE.PerspectiveCamera(55, W / H, .05, 30000);
const A = gatelandsCharcoalCamp({ key: 'charcoal:coillmor' }, stream('charcoal:coillmor')); scene.add(A.group);
// a still autumn afternoon in the Gatelands, the sun in the south-west through the oaks; &dusk, low in the west
const SUN = DUSK ? new THREE.Vector3(-.85, .12, .3).normalize() : new THREE.Vector3(-.4, .62, .68).normalize(), sun = new THREE.DirectionalLight(DUSK ? new THREE.Color(1, .66, .42) : new THREE.Color(1, .94, .84), DUSK ? 1.4 : 2.3);
sun.position.copy(SUN).multiplyScalar(120); sun.castShadow = true; sun.shadow.mapSize.set(4096, 4096); sun.shadow.bias = -.0003; sun.shadow.normalBias = .05;
Object.assign(sun.shadow.camera, { left: -40, right: 40, top: 40, bottom: -40, near: 1, far: 300 }); sun.target.position.set(0, 0, 2); sun.position.add(sun.target.position); scene.add(sun, sun.target);
scene.add(new THREE.HemisphereLight(DUSK ? new THREE.Color(.42, .4, .5) : new THREE.Color(.6, .68, .76), new THREE.Color(.34, .34, .24), DUSK ? .7 : 1.2)); skyDome(scene, SUN);
// the glow: a warm light low on the stack's lee and one at the fire, both weak by day
{ const s = A.stack, l = new THREE.PointLight(new THREE.Color(1, .5, .22), DUSK ? 9 : 0, 6, 1.6); l.position.set(s.x + 1.6, s.y + .4, s.z + 1.6); scene.add(l);
  const f = new THREE.PointLight(new THREE.Color(1, .55, .25), DUSK ? 14 : 3, 9, 1.6); f.position.set(A.fire.x, A.fire.embers + .4, A.fire.z); scene.add(f); }
const g = A.ground, S = A.stack, Hu = A.hut, He = A.heap;
let eye, at;
if (VIEW === 'stack') { eye = [S.x + 4.2, g(S.x + 4.2, S.z + 2.2) + 1.62, S.z + 2.2]; at = [S.x - 1, S.y + 1.0, S.z - 1.2]; cam.fov = 62; }
else if (VIEW === 'heap') { eye = [He.x + 4.6, g(He.x + 4.6, He.z - 2.4) + 1.62, He.z - 2.4]; at = [He.x - .6, He.y + .1, He.z + 1.2]; cam.fov = 60; }
else if (VIEW === 'hut') { eye = [Hu.x - 1.2, g(Hu.x - 1.2, Hu.z + 5.4) + 1.62, Hu.z + 5.4]; at = [Hu.x + .4, Hu.y + 1.1, Hu.z]; cam.fov = 60; }
else if (VIEW === 'far') { scene.fog.density = .006; eye = [16, 15, 32]; at = [-2, 0, 0]; cam.fov = 50; }
else { eye = [5.0, g(5.0, A.road.z - .4) + 1.62, A.road.z - .4]; at = [-1.5, S.y + 1.6, S.z - 2]; cam.fov = 60; }
cam.position.set(...eye); cam.lookAt(...at);
if (Q.get('cam')) { const c = Q.get('cam').split(',').map(Number); cam.position.set(c[0], c[1], c[2]); cam.lookAt(c[3], c[4], c[5]); }
cam.updateProjectionMatrix();
STATS.place = { place: 'charcoal', view: VIEW, dusk: DUSK, tris: A.tris, draws: A.draws, trees: A.trees.length, stools: A.stools.length };
run(makeComposer(R, scene, cam, { bloom: DUSK ? .2 : .08, sat: .96, vig: .3 }), cam);
