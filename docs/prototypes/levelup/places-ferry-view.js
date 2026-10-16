// The Mark's rope ferry (Session 980, card F8): places.js's markFerry, a flat hauled across a broad river on a rope, a bell on the far bank.
// ?place=ferry&view=ferry (default): from the near bank upstream, the landing, the flat at its stage and the river beyond; view=deck: on the
// flat, toward the far landing along the rope; view=bell: at the bell on the far bank, back over the water to the ferryman's house;
// view=river: low on the water downstream; view=far: the crossing from high on the far bank. &at=mid or &at=far moves the flat; &cam=x,y,z,tx,ty,tz.
import * as THREE from 'three';
import { Q, W, H, STATS, makeRenderer, makeComposer, buildTextures, run, skyDome } from './common.js';
import { markFerry } from './places.js';
import { stream } from './pieces.js';

const VIEW = Q.get('view') || 'ferry';
const R = makeRenderer(.85), scene = new THREE.Scene(); buildTextures();
scene.fog = new THREE.FogExp2(new THREE.Color(.70, .76, .82), .007);
const cam = new THREE.PerspectiveCamera(50, W / H, .05, 30000);
const A = markFerry({ at: Q.get('at') || 'near', key: 'ferry:elvhaug' }, stream('ferry:elvhaug')); scene.add(A.group);
// a northern sun, low in the south-west and cool, under a high pale sky
const SUN = new THREE.Vector3(-.6, .38, -.7).normalize(), sun = new THREE.DirectionalLight(new THREE.Color(1, .93, .84), 2.6);
sun.position.copy(SUN).multiplyScalar(90); sun.castShadow = true; sun.shadow.mapSize.set(4096, 4096); sun.shadow.bias = -.0003; sun.shadow.normalBias = .04;
Object.assign(sun.shadow.camera, { left: -40, right: 40, top: 40, bottom: -40, near: 1, far: 260 }); scene.add(sun, sun.target);
scene.add(new THREE.HemisphereLight(new THREE.Color(.64, .70, .84), new THREE.Color(.28, .30, .22), 1.15)); skyDome(scene, SUN);
const g = A.ground, F = A.flat;
let eye, at;
if (VIEW === 'deck') { eye = [.3, F.deck + 1.62, F.z + (F.z >= 0 ? 2.5 : -2.5)]; at = [-.6, 1.2, F.z >= 0 ? -24 : 24]; cam.fov = 60; }
else if (VIEW === 'bell') { eye = [A.bell.x + 1.6, g(A.bell.x + 1.6, A.bell.z - 4.5) + 1.62, A.bell.z - 4.5]; at = [-1, 1.2, 14]; cam.fov = 60; }
else if (VIEW === 'river') { eye = [15, 1.4, 1]; at = [0, .9, 8]; cam.fov = 55; }
else if (VIEW === 'far') { eye = [5, g(5, -45) + 6, -45]; at = [0, 0, 8]; cam.fov = 50; }
else { eye = [-17, g(-17, 42) + 2.2, 42]; at = [2, .2, 12]; cam.fov = 55; }
cam.position.set(...eye); cam.lookAt(...at);
if (Q.get('cam')) { const c = Q.get('cam').split(',').map(Number); cam.position.set(c[0], c[1], c[2]); cam.lookAt(c[3], c[4], c[5]); }
cam.updateProjectionMatrix();
STATS.place = { place: 'ferry', view: VIEW, tris: A.tris, draws: A.draws, at: F.at };
run(makeComposer(R, scene, cam, { bloom: .1, sat: 1.0, vig: .3 }), cam);
