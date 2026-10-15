// Aurenne's ruined aqueduct (Session 907, card F8): places.js's aurenneAqueduct across its dry valley under a high southern sun.
// ?place=aqueduct&view=aqueduct (default): from the valley's south side, the two tiers and the gap; view=channel: in the channel's bed
// from the west terrace toward the break; view=break: at the broken end, the gap and the fall to the lower tier; view=under: on the stream
// bed under the lower arches; view=end: off the west terrace where the channel comes off the hill. &whole: unbroken. &cam=x,y,z,tx,ty,tz.
import * as THREE from 'three';
import { Q, W, H, STATS, makeRenderer, makeComposer, buildTextures, run, skyDome } from './common.js';
import { aurenneAqueduct } from './places.js';
import { stream } from './pieces.js';

const VIEW = Q.get('view') || 'aqueduct';
const R = makeRenderer(.8), scene = new THREE.Scene(); buildTextures();
scene.fog = new THREE.FogExp2(new THREE.Color(.80, .80, .78), .0045);
const cam = new THREE.PerspectiveCamera(50, W / H, .05, 30000);
const A = aurenneAqueduct({ key: 'aqueduct:sarrat', broken: !Q.has('whole') }, stream('aqueduct:sarrat')); scene.add(A.group);
// the day: Aurenne's sun high in the south-west, warm and hard; a pale sky
const SUN = new THREE.Vector3(-.42, .72, .55).normalize(), sun = new THREE.DirectionalLight(new THREE.Color(1, .92, .78), 3.4);
sun.position.copy(SUN).multiplyScalar(120); sun.castShadow = true; sun.shadow.mapSize.set(4096, 4096); sun.shadow.bias = -.0003; sun.shadow.normalBias = .04;
Object.assign(sun.shadow.camera, { left: -70, right: 70, top: 50, bottom: -50, near: 1, far: 300 }); scene.add(sun, sun.target);
scene.add(new THREE.HemisphereLight(new THREE.Color(.70, .76, .88), new THREE.Color(.42, .36, .26), 1.0));
skyDome(scene, SUN);
const g = A.ground, x0 = A.gap ? A.gap.x0 : 9.3;
let eye, at;
if (VIEW === 'channel') { eye = [-30, 1.62, 0]; at = [x0, 1.0, 0]; cam.fov = 58; }
else if (VIEW === 'break') { eye = [x0 + .85, 1.62, .25]; at = [x0 + 12, -4, -.4]; cam.fov = 62; }
else if (VIEW === 'under') { eye = [-.6, g(-.6, 22) + 1.62, 22]; at = [3, -9, 0]; cam.fov = 62; }
else if (VIEW === 'end') { eye = [-70, 2.4, 9]; at = [-40, -2, -1]; }
else { eye = [-30, g(-30, 52) + 1.7, 52]; at = [6, -9, 0]; }
cam.position.set(...eye); cam.lookAt(...at);
if (Q.get('cam')) { const c = Q.get('cam').split(',').map(Number); cam.position.set(c[0], c[1], c[2]); cam.lookAt(c[3], c[4], c[5]); }
cam.updateProjectionMatrix();
STATS.place = { place: 'aqueduct', view: VIEW, tris: A.tris, draws: A.draws, broken: A.broken, bays: A.bays.length, lower: A.bays.filter(b => b.lower).length, upper: A.bays.filter(b => b.upper).length };
run(makeComposer(R, scene, cam, { bloom: .1, sat: 1.0, vig: .3 }), cam);
