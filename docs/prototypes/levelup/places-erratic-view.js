// The Gatelands' perched stone (Session 1031): places.js's gatelandsErratic, a boulder of strange stone on a limestone pedestal on a bare pavement.
// ?place=erratic&view=stone (default): from the path below, the boulder on its pedestal against the hill; view=under: crouched by it, the
// daylight under its overhang and the pedestal's waist; view=pavement: from the clints above, down over the grykes to the stone and the road;
// view=far: high over the hill. &dusk: the evening. &cam=x,y,z,tx,ty,tz puts the camera anywhere.
import * as THREE from 'three';
import { Q, W, H, STATS, makeRenderer, makeComposer, buildTextures, run, skyDome } from './common.js';
import { gatelandsErratic } from './places.js';
import { stream } from './pieces.js';

const VIEW = Q.get('view') || 'stone', DUSK = Q.has('dusk');
const R = makeRenderer(.8), scene = new THREE.Scene(); buildTextures();
scene.fog = new THREE.FogExp2(DUSK ? new THREE.Color(.5, .46, .48) : new THREE.Color(.74, .77, .8), .011);
const cam = new THREE.PerspectiveCamera(55, W / H, .05, 30000);
const A = gatelandsErratic({ key: 'erratic:burren' }, stream('erratic:burren')); scene.add(A.group);
const SUN = DUSK ? new THREE.Vector3(-.85, .12, .3).normalize() : new THREE.Vector3(-.45, .5, .74).normalize(), sun = new THREE.DirectionalLight(DUSK ? new THREE.Color(1, .64, .42) : new THREE.Color(1, .94, .84), DUSK ? 1.2 : 2.3);
sun.position.copy(SUN).multiplyScalar(120); sun.castShadow = true; sun.shadow.mapSize.set(4096, 4096); sun.shadow.bias = -.0003; sun.shadow.normalBias = .05;
Object.assign(sun.shadow.camera, { left: -28, right: 28, top: 28, bottom: -28, near: 1, far: 300 }); scene.add(sun, sun.target);
scene.add(new THREE.HemisphereLight(DUSK ? new THREE.Color(.42, .4, .5) : new THREE.Color(.6, .68, .78), new THREE.Color(.34, .34, .26), DUSK ? .7 : 1.2)); skyDome(scene, SUN);
const S = A.stone, sf = A.surf;
let eye, at;
if (VIEW === 'under') { eye = [S.x + 1.2, sf(S.x + 1.2, S.z + 3.2) + .55, S.z + 3.2]; at = [S.x, S.top - .2, S.z]; cam.fov = 62; }
else if (VIEW === 'pavement') { eye = [S.x - 6, sf(S.x - 6, S.z - 9) + 1.65, S.z - 9]; at = [S.x + 1, sf(S.x, S.z + 6), S.z + 6]; cam.fov = 62; }
else if (VIEW === 'far') { scene.fog.density = .005; eye = [16, 14, 26]; at = [0, 0, -2]; cam.fov = 50; }
else { eye = [S.x + 3.5, sf(S.x + 3.5, S.z + 8) + 1.62, S.z + 8]; at = [S.x, S.top + .9, S.z]; cam.fov = 60; }
cam.position.set(...eye); cam.lookAt(...at);
if (Q.get('cam')) { const c = Q.get('cam').split(',').map(Number); cam.position.set(c[0], c[1], c[2]); cam.lookAt(c[3], c[4], c[5]); }
cam.updateProjectionMatrix();
STATS.place = { place: 'erratic', view: VIEW, dusk: DUSK, tris: A.tris, draws: A.draws, trees: A.trees.length, clints: A.clints.length };
run(makeComposer(R, scene, cam, { bloom: DUSK ? .2 : .08, sat: .96, vig: .3 }), cam);
