// Aurenne's coastal watchtower (Session 971, card F8): places.js's aurenneWatchtower on its point over the sea.
// ?place=watchtower&view=tower (default): from the path inland, the stair, the landing and the door; view=door: on the landing by the
// gangway; view=roof: on the terrace by the beacon, looking along the coast; view=sea: from the water under the point; view=far: the point
// from along the coast. &night: the beacon lit under a night sky. &drawn: the gangway taken in. &cam=x,y,z,tx,ty,tz.
import * as THREE from 'three';
import { Q, W, H, STATS, makeRenderer, makeComposer, buildTextures, run, skyDome } from './common.js';
import { aurenneWatchtower } from './places.js';
import { stream } from './pieces.js';

const VIEW = Q.get('view') || 'tower', NIGHT = Q.has('night');
const R = makeRenderer(NIGHT ? 1.2 : .85), scene = new THREE.Scene(); buildTextures();
scene.fog = new THREE.FogExp2(NIGHT ? new THREE.Color(.05, .07, .1) : new THREE.Color(.80, .84, .88), NIGHT ? .004 : .004);
const cam = new THREE.PerspectiveCamera(50, W / H, .05, 30000);
const A = aurenneWatchtower({ lit: NIGHT, drawn: Q.has('drawn') }, stream('watchtower:capo')); scene.add(A.group);
const SUN = NIGHT ? new THREE.Vector3(.3, .5, -.6).normalize() : new THREE.Vector3(.6, .55, .45).normalize(), sun = new THREE.DirectionalLight(NIGHT ? new THREE.Color(.45, .55, .8) : new THREE.Color(1, .93, .8), NIGHT ? .35 : 3.1);
sun.position.copy(SUN).multiplyScalar(90); sun.castShadow = true; sun.shadow.mapSize.set(4096, 4096); sun.shadow.bias = -.0003; sun.shadow.normalBias = .04;
Object.assign(sun.shadow.camera, { left: -25, right: 25, top: 25, bottom: -25, near: 1, far: 240 }); scene.add(sun, sun.target);
scene.add(new THREE.HemisphereLight(NIGHT ? new THREE.Color(.10, .13, .2) : new THREE.Color(.68, .74, .88), NIGHT ? new THREE.Color(.03, .03, .04) : new THREE.Color(.36, .32, .24), NIGHT ? .6 : 1.0));
if (NIGHT) { scene.background = new THREE.Color(.03, .05, .09); const l = new THREE.PointLight(new THREE.Color(1, .6, .3), 40, 30, 1.4); l.position.set(A.beacon[0], A.beacon[1] + .6, A.beacon[2]); scene.add(l); } else skyDome(scene, SUN);
const g = A.ground, T = A.terrace, S = A.stair, L = S.landing;
let eye, at;
if (VIEW === 'door') { eye = [.1, L.top + 1.62, L.z0 + .5]; at = [A.door.x, A.door.sill + 1.2, A.door.z]; cam.fov = 60; }
else if (VIEW === 'roof') { eye = [-2.6, T.y + 1.62, .8]; at = [A.beacon[0] + 6, T.y + .6, A.beacon[2] + 5]; cam.fov = 62; }
else if (VIEW === 'sea') { eye = [22, A.sea + 1.5, 40]; at = [0, 4, 0]; cam.fov = 50; }
else if (VIEW === 'far') { eye = [-55, 4, 34]; at = [0, 5, 0]; cam.fov = 40; }
else { eye = [3, g(3, -27) + 1.7, -27]; at = [2.5, 6, -3]; cam.fov = 55; }
cam.position.set(...eye); cam.lookAt(...at);
if (Q.get('cam')) { const c = Q.get('cam').split(',').map(Number); cam.position.set(c[0], c[1], c[2]); cam.lookAt(c[3], c[4], c[5]); }
cam.updateProjectionMatrix();
STATS.place = { place: 'watchtower', view: VIEW, night: NIGHT, tris: A.tris, draws: A.draws, terrace: +(T.y - A.sea).toFixed(2), gangway: A.gangway };
run(makeComposer(R, scene, cam, { bloom: NIGHT ? .5 : .1, sat: 1.0, vig: .3 }), cam);
