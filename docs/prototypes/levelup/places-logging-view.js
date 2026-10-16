// The Mark's abandoned logging camp (Session 999, card F8): places.js's markLoggingCamp, a winter felling left mid-season over a frozen river.
// ?place=logging&view=camp (default): from the felling's top by the deck, down the chute to the ice; view=chute: beside the chute at the
// fallen length, the gap; view=deck: under the deck's end, its rows on the skids; view=shelter: before the gapahuk by its cold fire; view=far:
// from over the river, up the slope. &cam=x,y,z,tx,ty,tz puts the camera anywhere.
import * as THREE from 'three';
import { Q, W, H, STATS, makeRenderer, makeComposer, buildTextures, run, skyDome } from './common.js';
import { markLoggingCamp } from './places.js';
import { stream } from './pieces.js';

const VIEW = Q.get('view') || 'camp';
const R = makeRenderer(.8), scene = new THREE.Scene(); buildTextures();
scene.fog = new THREE.FogExp2(new THREE.Color(.74, .78, .85), .013);
const cam = new THREE.PerspectiveCamera(55, W / H, .05, 30000);
const A = markLoggingCamp({ key: 'logging:elvdal' }, stream('logging:elvdal')); scene.add(A.group);
// a grey winter noon in the Mark: the sun low in the south through high cloud
const SUN = new THREE.Vector3(-.3, .3, .9).normalize(), sun = new THREE.DirectionalLight(new THREE.Color(1, .9, .78), 1.5);
sun.position.copy(SUN).multiplyScalar(90); sun.castShadow = true; sun.shadow.mapSize.set(4096, 4096); sun.shadow.bias = -.0003; sun.shadow.normalBias = .04;
Object.assign(sun.shadow.camera, { left: -34, right: 34, top: 34, bottom: -34, near: 1, far: 260 }); sun.target.position.set(0, -3, 8); sun.position.add(sun.target.position); scene.add(sun, sun.target);
scene.add(new THREE.HemisphereLight(new THREE.Color(.66, .72, .86), new THREE.Color(.55, .56, .6), 1.35)); skyDome(scene, SUN);
const g = A.ground, Ch = A.chute, D = A.deck, Sh = A.shelter;
let eye, at;
if (VIEW === 'chute') { eye = [Ch.x + 3.4, g(Ch.x + 3.4, Ch.gap[0] - 2.5) + 1.62, Ch.gap[0] - 2.5]; at = [Ch.x, g(Ch.x, Ch.gap[1]) + .4, Ch.gap[1] + 1]; cam.fov = 62; }
else if (VIEW === 'deck') { eye = [D.x + 4.2, g(D.x + 4.2, D.z + 3.6) + 1.62, D.z + 3.6]; at = [D.x, D.skid + .6, D.z]; cam.fov = 60; }
else if (VIEW === 'shelter') { eye = [Sh.x + 1.0, g(Sh.x + 1.0, Sh.z + 6) + 1.62, Sh.z + 6]; at = [Sh.x, Sh.y + 1.0, Sh.z]; cam.fov = 60; }
else if (VIEW === 'far') { eye = [-14, A.river.y + 6, 44]; at = [0, -1, 0]; cam.fov = 55; }
else { eye = [Ch.x - 3.5, g(Ch.x - 3.5, -14) + 1.9, -14]; at = [Ch.x + 2, A.river.y + 1, 26]; cam.fov = 60; }
cam.position.set(...eye); cam.lookAt(...at);
if (Q.get('cam')) { const c = Q.get('cam').split(',').map(Number); cam.position.set(c[0], c[1], c[2]); cam.lookAt(c[3], c[4], c[5]); }
cam.updateProjectionMatrix();
STATS.place = { place: 'logging', view: VIEW, tris: A.tris, draws: A.draws, stumps: A.stumps.length, trees: A.trees.length };
run(makeComposer(R, scene, cam, { bloom: .08, sat: .92, vig: .3 }), cam);
