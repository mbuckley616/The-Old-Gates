// The Weavers' ring of broken arches on a coast (Session 1119; OG-104): ruins.js's weaverRing, on the level crown of a headland.
// ?place=ring&view=ring (default): from the turf inland, at a person's eye, across the ring to the sea through its broken bay;
// view=arch: at the foot of a standing arch, looking up through it; view=heart: on the dais, the ring round about; view=far: from over the
// sea, the headland and the ring on it. &dusk: the evening. &cam=x,y,z,tx,ty,tz puts the camera anywhere.
import * as THREE from 'three';
import { Q, W, H, STATS, makeRenderer, makeComposer, buildTextures, run, skyDome } from './common.js';
import { weaverRing } from './ruins.js';

const VIEW = Q.get('view') || 'ring', DUSK = Q.has('dusk');
const R = makeRenderer(.8), scene = new THREE.Scene(); buildTextures();
scene.fog = new THREE.FogExp2(DUSK ? new THREE.Color(.52, .48, .5) : new THREE.Color(.74, .78, .82), VIEW === 'far' ? .0018 : .0035);
const cam = new THREE.PerspectiveCamera(55, W / H, .1, 30000);
const A = weaverRing(); scene.add(A.group);
const SUN = DUSK ? new THREE.Vector3(-.85, .14, -.4).normalize() : new THREE.Vector3(-.72, .5, .2).normalize(), sun = new THREE.DirectionalLight(DUSK ? new THREE.Color(1, .64, .42) : new THREE.Color(1, .94, .84), DUSK ? 1.3 : 2.4);
sun.position.copy(SUN).multiplyScalar(380); sun.castShadow = true; sun.shadow.mapSize.set(4096, 4096); sun.shadow.bias = -.0004; sun.shadow.normalBias = .1;
Object.assign(sun.shadow.camera, { left: -135, right: 135, top: 135, bottom: -135, near: 1, far: 800 }); scene.add(sun, sun.target);
scene.add(new THREE.HemisphereLight(DUSK ? new THREE.Color(.42, .4, .5) : new THREE.Color(.6, .68, .78), new THREE.Color(.3, .32, .22), DUSK ? .7 : 1.1)); skyDome(scene, SUN);
const g = A.ground, st = A.bays.filter(b => b.cond === 'cracked').sort((p, q) => q.x - p.x)[0]; /* the standing arch whose inner face takes the sun */
let eye, at;
if (VIEW === 'arch') { const ax = st.x * .42 - st.z * .1, az = st.z * .42 + st.x * .1; eye = [ax, g(ax, az) + 1.65, az]; at = [st.x, A.rise * .42, st.z]; cam.fov = 60; } /* 36 m in from its foot, a little to one side: the scale post at its foot */
else if (VIEW === 'heart') { eye = [-3, A.dais.top + 1.65, 5]; at = [11, 25, -68]; cam.fov = 66; }
else if (VIEW === 'far') { eye = [200, 80, -350]; at = [0, 14, 0]; cam.fov = 45; }
else { eye = [14, g(14, A.R + 55) + 1.65, A.R + 55]; at = [0, 22, -55]; cam.fov = 60; }
cam.position.set(...eye); cam.lookAt(...at);
if (Q.get('cam')) { const c = Q.get('cam').split(',').map(Number); cam.position.set(c[0], c[1], c[2]); cam.lookAt(c[3], c[4], c[5]); }
cam.updateProjectionMatrix();
STATS.place = { place: 'ring', view: VIEW, dusk: DUSK, tris: A.tris, draws: A.draws, bays: A.bays.length };
run(makeComposer(R, scene, cam, { bloom: DUSK ? .2 : .08, sat: .96, vig: .3 }), cam);
