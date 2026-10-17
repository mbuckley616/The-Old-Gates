// The Mark's hunters' camp (Session 1022, card F8): places.js's markHuntersCamp, a party's autumn camp in birch and pine heath by a road.
// ?place=hunters&view=camp (default): from the road, the tent with its smoke, the rack beyond; view=rack: by the rack, the strips in its
// smoke; view=tent: before the tent's door; view=pole: under the game pole between its pines; view=far: high over the road.
// &dusk: the evening, the fires glowing. &cam=x,y,z,tx,ty,tz puts the camera anywhere.
import * as THREE from 'three';
import { Q, W, H, STATS, makeRenderer, makeComposer, buildTextures, run, skyDome } from './common.js';
import { markHuntersCamp } from './places.js';
import { stream } from './pieces.js';

const VIEW = Q.get('view') || 'camp', DUSK = Q.has('dusk');
const R = makeRenderer(.8), scene = new THREE.Scene(); buildTextures();
scene.fog = new THREE.FogExp2(DUSK ? new THREE.Color(.46, .44, .48) : new THREE.Color(.74, .78, .82), .013);
const cam = new THREE.PerspectiveCamera(55, W / H, .05, 30000);
const A = markHuntersCamp({ key: 'hunters:elgmyr' }, stream('hunters:elgmyr')); scene.add(A.group);
// a clear cold autumn afternoon in the Mark, the sun low in the south-west; &dusk, at the horizon
const SUN = DUSK ? new THREE.Vector3(-.85, .1, .35).normalize() : new THREE.Vector3(-.45, .42, .78).normalize(), sun = new THREE.DirectionalLight(DUSK ? new THREE.Color(1, .64, .4) : new THREE.Color(1, .92, .8), DUSK ? 1.2 : 2.2);
sun.position.copy(SUN).multiplyScalar(120); sun.castShadow = true; sun.shadow.mapSize.set(4096, 4096); sun.shadow.bias = -.0003; sun.shadow.normalBias = .05;
Object.assign(sun.shadow.camera, { left: -40, right: 40, top: 40, bottom: -40, near: 1, far: 300 }); sun.target.position.set(0, 0, 2); sun.position.add(sun.target.position); scene.add(sun, sun.target);
scene.add(new THREE.HemisphereLight(DUSK ? new THREE.Color(.4, .4, .52) : new THREE.Color(.6, .68, .8), new THREE.Color(.32, .3, .24), DUSK ? .7 : 1.15)); skyDome(scene, SUN);
{ const T = A.tent, t = new THREE.PointLight(new THREE.Color(1, .55, .25), DUSK ? 10 : 2, 6, 1.6); t.position.set(T.x, T.y + .6, T.z); scene.add(t);
  const k = A.rack, l = new THREE.PointLight(new THREE.Color(1, .5, .22), DUSK ? 9 : 1.5, 6, 1.6); l.position.set(k.x, k.embers + .4, k.z); scene.add(l); }
const g = A.ground, T = A.tent, K = A.rack, P = A.gamePole;
let eye, at;
if (VIEW === 'rack') { eye = [K.x - 1.6, g(K.x - 1.6, K.z + 3.4) + 1.62, K.z + 3.4]; at = [K.x + .3, K.y + 1.3, K.z]; cam.fov = 60; }
else if (VIEW === 'tent') { eye = [T.x + 1.0, g(T.x + 1.0, T.z + 5.4) + 1.62, T.z + 5.4]; at = [T.x, T.y + 1.4, T.z]; cam.fov = 60; }
else if (VIEW === 'pole') { const mx = (P.a[0] + P.b[0]) / 2, mz = (P.a[2] + P.b[2]) / 2; eye = [mx - 1.5, g(mx - 1.5, mz + 4.2) + 1.62, mz + 4.2]; at = [mx, P.a[1] - .8, mz]; cam.fov = 60; }
else if (VIEW === 'far') { scene.fog.density = .006; eye = [14, 15, 32]; at = [-1, 0, 0]; cam.fov = 50; }
else { eye = [3.0, g(3.0, A.road.z + .4) + 1.62, A.road.z + .4]; at = [-1, T.y + 1.6, T.z - 1]; cam.fov = 60; }
cam.position.set(...eye); cam.lookAt(...at);
if (Q.get('cam')) { const c = Q.get('cam').split(',').map(Number); cam.position.set(c[0], c[1], c[2]); cam.lookAt(c[3], c[4], c[5]); }
cam.updateProjectionMatrix();
STATS.place = { place: 'hunters', view: VIEW, dusk: DUSK, tris: A.tris, draws: A.draws, trees: A.trees.length };
run(makeComposer(R, scene, cam, { bloom: DUSK ? .2 : .08, sat: .96, vig: .3 }), cam);
