// The Mark's fortress on a pass (Session 1235, card F8): places.js's markPassFort, a garrison's wall across a pass, a winter afternoon.
// ?place=passfort&view=wall (default): from the road below, up to the wall and the gate tower; view=gate: in the road at the passage's
// mouth; view=behind: up the pass from the hall, back to the wall's back and the stair; view=walk: on the walk east of the tower, along it
// up the flank to the round tower; view=flank: from the floor under the west flank, the wall stepping up to its tower and the cliff;
// view=far: high over it all. &cam=x,y,z,tx,ty,tz puts the camera anywhere.
import * as THREE from 'three';
import { Q, W, H, STATS, makeRenderer, makeComposer, buildTextures, run, skyDome } from './common.js';
import { markPassFort } from './places.js';
import { stream } from './pieces.js';

const VIEW = Q.get('view') || 'wall';
const R = makeRenderer(.8), scene = new THREE.Scene(); buildTextures();
scene.fog = new THREE.FogExp2(new THREE.Color(.78, .82, .88), .005);
const cam = new THREE.PerspectiveCamera(55, W / H, .05, 30000);
const A = markPassFort({ key: 'passfort:skarð' }, stream('passfort:skarð')); scene.add(A.group);
const SUN = new THREE.Vector3(-.55, .42, -.7).normalize(), sun = new THREE.DirectionalLight(new THREE.Color(1, .9, .78), 2.3);
sun.position.copy(SUN).multiplyScalar(140); sun.castShadow = true; sun.shadow.mapSize.set(4096, 4096); sun.shadow.bias = -.0003; sun.shadow.normalBias = .05;
Object.assign(sun.shadow.camera, { left: -50, right: 50, top: 50, bottom: -50, near: 1, far: 400 }); scene.add(sun, sun.target);
scene.add(new THREE.HemisphereLight(new THREE.Color(.66, .72, .84), new THREE.Color(.5, .5, .52), 1.1)); skyDome(scene, SUN);
const g = A.ground, Wl = A.wall, St = A.stair;
let eye, at;
if (VIEW === 'gate') { eye = [-.6, g(-.6, A.gate.z0 - 6) + 1.62, A.gate.z0 - 6]; at = [0, A.gate.y + 2.2, A.gate.z1 + 6]; cam.fov = 60; }
else if (VIEW === 'behind') { eye = [-1.2, g(-1.2, 17) + 1.62, 17]; at = [3, 3.2, Wl.z1]; cam.fov = 62; }
else if (VIEW === 'walk') { const x = 6.6; eye = [x, Wl.walk(x) + 1.62, (Wl.z0 + Wl.z1) / 2 + .4]; at = [15, Wl.walk(14) + 1.4, Wl.z0]; cam.fov = 62; }
else if (VIEW === 'flank') { eye = [-3, g(-3, Wl.z0 - 14) + 1.62, Wl.z0 - 14]; at = [-15, 7.5, Wl.z0]; cam.fov = 60; }
else if (VIEW === 'far') { scene.fog.density = .002; eye = [32, 34, -46]; at = [0, 3, 6]; cam.fov = 52; }
else { eye = [2.4, g(2.4, -30) + 1.62, -30]; at = [0, 5, 0]; cam.fov = 58; }
cam.position.set(...eye); cam.lookAt(...at);
if (Q.get('cam')) { const c = Q.get('cam').split(',').map(Number); cam.position.set(c[0], c[1], c[2]); cam.lookAt(c[3], c[4], c[5]); }
cam.updateProjectionMatrix();
STATS.place = { place: 'passfort', view: VIEW, tris: A.tris, draws: A.draws, slits: Wl.slits.length };
run(makeComposer(R, scene, cam, { bloom: .08, sat: .95, vig: .3 }), cam);
