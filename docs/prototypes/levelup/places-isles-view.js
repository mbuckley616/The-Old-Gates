// The Gate Isles (Session 2430; OG-104, all the islands): ruins.js's gateIsles, five Weaver rings on the crowns of five rock isles strung along one
// bearing, their hearts on one level line, the far coast at its end.
// ?place=isles&view=line (default): on the first isle's plinth behind its ring, along the line through every ring to the coast; view=boat: from a
// boat's thwart 110 m east of the second isle, its landing, its ring and the line beyond; view=landing: at the foot of the second isle's steps, up
// them to the ring; view=sight: on the first ring's plinth, the line through a glass (10°), the five rings one inside the next; view=broken: on the third isle's crown, the broken ring and its lost stones; view=far: high over the sea from the south-east,
// the whole line. &dusk: the sun low at the line's far end, setting through the rings. &cam=x,y,z,tx,ty,tz.
import * as THREE from 'three';
import { Q, W, H, STATS, makeRenderer, makeComposer, buildTextures, run, skyDome } from './common.js';
import { gateIsles } from './ruins.js';

const VIEW = Q.get('view') || 'line', DUSK = Q.has('dusk');
const R = makeRenderer(.8), scene = new THREE.Scene(); buildTextures();
scene.fog = new THREE.FogExp2(DUSK ? new THREE.Color(.62, .52, .5) : new THREE.Color(.74, .79, .84), VIEW === 'far' ? .00022 : .0005);
const cam = new THREE.PerspectiveCamera(55, W / H, .1, 30000);
const A = gateIsles(); scene.add(A.group);
const I = A.isles, g = A.ground;
let eye, at, focus;
if (VIEW === 'boat') { const s = I[1]; eye = [s.stair.x1 + 95, 1.2, s.z + 70]; at = [0, 9, s.z - 60]; focus = [0, 0, s.z]; cam.fov = 58; }
else if (VIEW === 'landing') { const s = I[1]; eye = [s.stair.x1 - 2, s.stair.y0 + 4 + 1.65, s.z + 1]; at = [6, A.CY - 2, s.z - 2]; focus = [0, 0, s.z]; cam.fov = 64; }
else if (VIEW === 'broken') { const s = I[2]; eye = [19, A.S + 1.35, s.z + 21]; at = [-2, A.CY - 1, s.z - 4]; focus = [0, 0, s.z]; cam.fov = 66; }
else if (VIEW === 'far') { eye = [520, 230, 380]; at = [0, 0, -900]; focus = [0, 0, -700]; cam.fov = 46; }
else if (VIEW === 'sight') { eye = [0, A.P + 1.65, 4]; at = [0, A.P + 1.65 + 27, -1000]; focus = [0, 0, -400]; cam.fov = 10; }
else { eye = [1.5, A.S - .3 + 1.65, 23]; at = [0, A.S + 8.6, -10]; focus = [0, 0, -260]; cam.fov = 74; }
const SUN = DUSK ? new THREE.Vector3(.02, .06, -1).normalize() : new THREE.Vector3(.55, .5, .45).normalize(), sun = new THREE.DirectionalLight(DUSK ? new THREE.Color(1, .6, .38) : new THREE.Color(1, .94, .84), DUSK ? 1.5 : 2.4);
const SR = VIEW === 'far' ? 900 : VIEW === 'line' || VIEW === 'sight' ? 700 : 140;
sun.target.position.set(...focus); sun.position.copy(SUN).multiplyScalar(2400).add(sun.target.position); sun.castShadow = true; sun.shadow.mapSize.set(4096, 4096); sun.shadow.bias = -.0004; sun.shadow.normalBias = .15;
Object.assign(sun.shadow.camera, { left: -SR, right: SR, top: SR, bottom: -SR, near: 10, far: 5000 }); scene.add(sun, sun.target);
scene.add(new THREE.HemisphereLight(DUSK ? new THREE.Color(.5, .44, .52) : new THREE.Color(.6, .68, .78), new THREE.Color(.22, .26, .26), DUSK ? .75 : 1.1)); skyDome(scene, SUN);
cam.position.set(...eye); cam.lookAt(...at);
if (Q.get('cam')) { const c = Q.get('cam').split(',').map(Number); cam.position.set(c[0], c[1], c[2]); cam.lookAt(c[3], c[4], c[5]); }
cam.updateProjectionMatrix();
STATS.place = { place: 'isles', view: VIEW, dusk: DUSK, tris: A.tris, draws: A.draws, isles: I.length, broken: I.filter(s => s.cond === 'broken').length, lost: I.reduce((n, s) => n + s.gone, 0) };
run(makeComposer(R, scene, cam, { bloom: DUSK ? .12 : .08, sat: .96, vig: .3 }), cam);
