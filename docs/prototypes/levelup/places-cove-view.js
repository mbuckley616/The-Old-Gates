// Aurenne's smuggler's cove (Session 1007, card F8): places.js's aurenneCove, a narrow inlet between white cliffs with its boathouses and stair.
// ?place=cove&view=cove (default): on the sand by the rowing boat, out along the inlet past the sloop to the sea; view=houses: the
// boathouses from the stair's foot; view=stair: on the stair at its third landing, up the flight and over the inlet; view=top: by the
// lookout on the east top, down the inlet to the beach; view=far: from the sea off the mouth, looking in. &night: dusk, the lookout's lamp
// lit. &noship: no sloop at anchor. &cam=x,y,z,tx,ty,tz puts the camera anywhere.
import * as THREE from 'three';
import { Q, W, H, STATS, makeRenderer, makeComposer, buildTextures, run, skyDome } from './common.js';
import { aurenneCove } from './places.js';
import { stream } from './pieces.js';

const VIEW = Q.get('view') || 'cove', NIGHT = Q.has('night');
const R = makeRenderer(.8), scene = new THREE.Scene(); buildTextures();
scene.fog = new THREE.FogExp2(NIGHT ? new THREE.Color(.16, .18, .26) : new THREE.Color(.8, .86, .92), NIGHT ? .01 : .004);
const cam = new THREE.PerspectiveCamera(55, W / H, .05, 30000);
const A = aurenneCove({ key: 'cove:calafigo', lit: NIGHT, ship: !Q.has('noship') }, stream('cove:calafigo')); scene.add(A.group);
// a hot afternoon in Aurenne, the sun high in the south-east over the sea, on the boathouses' cliff; &night, the last of the dusk
const SUN = new THREE.Vector3(.45, NIGHT ? .12 : .75, .5).normalize(), sun = new THREE.DirectionalLight(NIGHT ? new THREE.Color(.5, .45, .6) : new THREE.Color(1, .95, .84), NIGHT ? .4 : 2.8);
sun.position.copy(SUN).multiplyScalar(140); sun.castShadow = true; sun.shadow.mapSize.set(4096, 4096); sun.shadow.bias = -.0003; sun.shadow.normalBias = .05;
Object.assign(sun.shadow.camera, { left: -60, right: 60, top: 60, bottom: -60, near: 1, far: 360 }); sun.target.position.set(0, 4, 20); sun.position.add(sun.target.position); scene.add(sun, sun.target);
scene.add(new THREE.HemisphereLight(NIGHT ? new THREE.Color(.2, .24, .38) : new THREE.Color(.62, .74, .9), NIGHT ? new THREE.Color(.08, .08, .1) : new THREE.Color(.5, .46, .38), NIGHT ? .5 : 1.2)); skyDome(scene, SUN);
if (NIGHT) { const L = A.lookout, l = new THREE.PointLight(new THREE.Color(1, .7, .35), 40, 30, 1.6); l.position.set(L.win.x, L.win.y, L.win.z + .3); scene.add(l); }
const g = A.ground, S = A.steps, Ho = A.houses;
let eye, at;
if (VIEW === 'houses') { eye = [S[2].x, S[2].y + 1.62, S[2].z]; at = [Ho[1].x, Ho[1].gy + 2.2, Ho[1].z]; cam.fov = 62; }
else if (VIEW === 'stair') { const s = S[56]; eye = [s.x, s.y + 1.62, s.z]; at = [s.x - 2.5, s.y + 5, s.z + 14]; cam.fov = 64; }
else if (VIEW === 'top') { const L = A.lookout; eye = [L.x - 3, L.y + 1.7, L.z - 3]; at = [0, 1, -4]; cam.fov = 55; }
else if (VIEW === 'far') { eye = [8, 9, 120]; at = [0, 6, 0]; cam.fov = 50; }
else { eye = [2.4, g(2.4, -6.5) + 1.62, -6.5]; at = [-1, 2, 60]; cam.fov = 60; }
cam.position.set(...eye); cam.lookAt(...at);
if (Q.get('cam')) { const c = Q.get('cam').split(',').map(Number); cam.position.set(c[0], c[1], c[2]); cam.lookAt(c[3], c[4], c[5]); }
cam.updateProjectionMatrix();
STATS.place = { place: 'cove', view: VIEW, tris: A.tris, draws: A.draws, steps: A.steps.length, top: A.stairTop };
run(makeComposer(R, scene, cam, { bloom: NIGHT ? .3 : .08, sat: 1.0, vig: .3 }), cam);
