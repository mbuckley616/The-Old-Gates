// The Mark's ice cave mouth (Session 1006, card F8): places.js's markIceMouth, a glacier's snout with the meltwater's tunnel out under it.
// ?place=icemouth&view=mouth (default): on the sandur 20 m out, the stream's bank, the arch in the face; view=inside: in the tunnel at
// the blue, looking out to the day; view=throat: at the mouth, looking in to the dark; view=moraine: from the moraine's crest by the cairn,
// over the sandur to the face; view=far: high over the sandur, the snout in its valley. &cam=x,y,z,tx,ty,tz puts the camera anywhere.
import * as THREE from 'three';
import { Q, W, H, STATS, makeRenderer, makeComposer, buildTextures, run, skyDome } from './common.js';
import { markIceMouth } from './places.js';
import { stream } from './pieces.js';

const VIEW = Q.get('view') || 'mouth';
const R = makeRenderer(.8), scene = new THREE.Scene(); buildTextures();
scene.fog = new THREE.FogExp2(new THREE.Color(.76, .8, .86), .006);
const cam = new THREE.PerspectiveCamera(55, W / H, .05, 30000);
const A = markIceMouth({ key: 'icemouth:jostedal' }, stream('icemouth:jostedal')); scene.add(A.group);
// a clear cold afternoon in the Mark: the sun low in the south-west, behind the viewer on the sandur, so the face takes the light
const SUN = new THREE.Vector3(.45, .38, .8).normalize(), sun = new THREE.DirectionalLight(new THREE.Color(1, .92, .8), 2.2);
sun.position.copy(SUN).multiplyScalar(120); sun.castShadow = true; sun.shadow.mapSize.set(4096, 4096); sun.shadow.bias = -.0003; sun.shadow.normalBias = .05;
Object.assign(sun.shadow.camera, { left: -50, right: 50, top: 50, bottom: -50, near: 1, far: 320 }); sun.target.position.set(0, 4, 8); sun.position.add(sun.target.position); scene.add(sun, sun.target);
scene.add(new THREE.HemisphereLight(new THREE.Color(.62, .7, .86), new THREE.Color(.42, .43, .46), 1.3)); skyDome(scene, SUN);
// the tunnel's own light: the day coming in through the ice, a cold fill along it
{ const l = new THREE.PointLight(new THREE.Color(.55, .8, 1), 30, 16, 1.4); l.position.set(0, A.mouth.floorAt(-4) + 3.2, -4); scene.add(l); }
const g = A.ground, Mo = A.mouth, S = A.stream;
let eye, at;
if (VIEW === 'inside') { const z = -9; eye = [-1.4, Mo.floorAt(z) + 1.62, z]; at = [.6, Mo.floorAt(6) + 2.2, 8]; cam.fov = 66; }
else if (VIEW === 'throat') { eye = [-1.2, Mo.floorAt(2.5) + 1.62, 2.5]; at = [0, Mo.floorAt(-14) + 1.6, -16]; cam.fov = 60; }
else if (VIEW === 'moraine') { const c = A.cairn; eye = [c.x - 2, g(c.x - 2, c.z + .5) + 1.7, c.z + .5]; at = [0, 7, A.faceZ(0)]; cam.fov = 58; }
else if (VIEW === 'far') { eye = [-26, 34, 78]; at = [0, 6, -4]; cam.fov = 52; }
else { const z = 20, x = S.x(z) - 3.4; eye = [x, g(x, z) + 1.62, z]; at = [0, 5, A.faceZ(0)]; cam.fov = 60; }
cam.position.set(...eye); cam.lookAt(...at);
if (Q.get('cam')) { const c = Q.get('cam').split(',').map(Number); cam.position.set(c[0], c[1], c[2]); cam.lookAt(c[3], c[4], c[5]); }
cam.updateProjectionMatrix();
STATS.place = { place: 'icemouth', view: VIEW, tris: A.tris, draws: A.draws, blocks: A.blocks.length, icicles: A.icicles.length };
run(makeComposer(R, scene, cam, { bloom: .1, sat: .95, vig: .3 }), cam);
