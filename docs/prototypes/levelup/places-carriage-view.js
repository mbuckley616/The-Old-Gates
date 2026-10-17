// The Gatelands' overturned carriage (Session 1025): places.js's gatelandsCarriage, a road coach on its side in a field by a lane.
// ?place=carriage&view=coach (default): from the lane, the coach over the ditch on its side, its wheels up; view=door: from its roof's side, the door
// standing open against the sky; view=inside: stood on its upper side, down into the doorway; view=traces: at its front, the box, the pole snapped and the traces cut; view=luggage:
// along its roof, the trunks and the clothes by the wall; view=far: high over the lane. &dusk: the evening, the far lamp still burning.
// &cam=x,y,z,tx,ty,tz puts the camera anywhere.
import * as THREE from 'three';
import { Q, W, H, STATS, makeRenderer, makeComposer, buildTextures, run, skyDome } from './common.js';
import { gatelandsCarriage } from './places.js';
import { stream } from './pieces.js';

const VIEW = Q.get('view') || 'coach', DUSK = Q.has('dusk');
const R = makeRenderer(.8), scene = new THREE.Scene(); buildTextures();
scene.fog = new THREE.FogExp2(DUSK ? new THREE.Color(.5, .46, .48) : new THREE.Color(.74, .76, .78), .013);
const cam = new THREE.PerspectiveCamera(55, W / H, .05, 30000);
const A = gatelandsCarriage({ key: 'carriage:bothar', lit: DUSK }, stream('carriage:bothar')); scene.add(A.group);
// an early autumn afternoon, the sun in the south-west behind the lane; &dusk, low in the west
const SUN = DUSK ? new THREE.Vector3(-.85, .12, -.3).normalize() : new THREE.Vector3(.55, .5, -.62).normalize(), sun = new THREE.DirectionalLight(DUSK ? new THREE.Color(1, .64, .42) : new THREE.Color(1, .94, .84), DUSK ? 1.2 : 2.3);
sun.position.copy(SUN).multiplyScalar(120); sun.castShadow = true; sun.shadow.mapSize.set(4096, 4096); sun.shadow.bias = -.0003; sun.shadow.normalBias = .05;
Object.assign(sun.shadow.camera, { left: -30, right: 30, top: 30, bottom: -30, near: 1, far: 300 }); sun.target.position.set(0, 0, -1); sun.position.add(sun.target.position); scene.add(sun, sun.target);
scene.add(new THREE.HemisphereLight(DUSK ? new THREE.Color(.42, .4, .5) : new THREE.Color(.6, .68, .78), new THREE.Color(.34, .34, .24), DUSK ? .7 : 1.2)); skyDome(scene, SUN);
{ const l = new THREE.PointLight(new THREE.Color(1, .72, .4), DUSK ? 6 : 0, 6, 1.6), p = A.coach.lamp; l.position.set(p[0], p[1] + .15, p[2]); scene.add(l); }
const g = A.ground, C = A.coach;
let eye, at;
if (VIEW === 'door') { eye = [C.x + 2.2, g(C.x + 2.2, C.z + 3.4) + 1.62, C.z + 3.4]; at = [C.door.edge[0], C.top + .2, C.door.edge[2]]; cam.fov = 58; } /* from the roof's side, the door standing up against the sky */
else if (VIEW === 'inside') { eye = [C.door.hole[0] + 1.25, C.top + 1.62, C.door.hole[2] + .1]; at = [C.door.hole[0] - .3, C.top - .3, C.door.hole[2]]; cam.fov = 64; } /* stood on its upper side at the back, down into the doorway */
else if (VIEW === 'traces') { eye = [C.x - 4.6, g(C.x - 4.6, C.z - .6) + 1.5, C.z - .6]; at = [C.front[0] + .7, C.y - .1, C.front[2] - .7]; cam.fov = 62; }
else if (VIEW === 'luggage') { eye = [C.x + 4.8, g(C.x + 4.8, C.z + 3.0) + 1.62, C.z + 3.0]; at = [C.x - 2.6, C.y + .4, C.z + 3.6]; cam.fov = 62; }
else if (VIEW === 'far') { scene.fog.density = .005; eye = [11, 7.5, -13]; at = [0, 0, -1]; cam.fov = 50; }
else { eye = [C.x + 3.4, g(C.x + 3.4, A.road.z + 1.2) + 1.62, A.road.z + 1.2]; at = [C.x - .9, C.y + .7, C.z + .4]; cam.fov = 60; }
cam.position.set(...eye); cam.lookAt(...at);
if (Q.get('cam')) { const c = Q.get('cam').split(',').map(Number); cam.position.set(c[0], c[1], c[2]); cam.lookAt(c[3], c[4], c[5]); }
cam.updateProjectionMatrix();
STATS.place = { place: 'carriage', view: VIEW, dusk: DUSK, tris: A.tris, draws: A.draws, trees: A.trees.length };
run(makeComposer(R, scene, cam, { bloom: DUSK ? .2 : .08, sat: .96, vig: .3 }), cam);
