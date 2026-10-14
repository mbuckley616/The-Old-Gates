// The Gatelands' round cairn (Session 869, card F8): places.js's gatelandsCairn on open ground under a soft grey-blue day.
// ?place=cairn&view=cairn (default): from the approach, off the door's east side; view=door: at the entrance stone, the door and the
// spirals; view=passage: inside the door up the passage to the chamber, by your torch; view=chamber: from the chamber's mouth to the
// back recess, its basin and its spirals; view=vault: looking up into the corbelling. &plain: no carving. &cam=x,y,z,tx,ty,tz.
// Inside there is no lamp: the torch at your right hand and what day comes in at the door are the only light.
import * as THREE from 'three';
import { Q, W, H, STATS, makeRenderer, makeComposer, buildTextures, run, skyDome, mat, worldUV } from './common.js';
import { gatelandsCairn } from './places.js';
import { stream } from './pieces.js';

const VIEW = Q.get('view') || 'cairn', INSIDE = ['passage', 'chamber', 'vault'].includes(VIEW);
const R = makeRenderer(INSIDE ? 1.2 : .85), scene = new THREE.Scene(); buildTextures();
scene.fog = new THREE.FogExp2(new THREE.Color(.70, .76, .82), .008);
const cam = new THREE.PerspectiveCamera(INSIDE ? 64 : 48, W / H, .02, 30000);
const C = gatelandsCairn({ key: 'cairn:cnoc', carved: !Q.has('plain') }, stream('cairn:cnoc')); scene.add(C.group);
// the day: a sun low in the south-east, behind the viewer at the door, a cool sky
const SUN = new THREE.Vector3(.45, .42, .79).normalize(), sun = new THREE.DirectionalLight(new THREE.Color(1, .93, .82), 3.0);
sun.position.copy(SUN).multiplyScalar(60); sun.castShadow = true; sun.shadow.mapSize.set(4096, 4096); sun.shadow.bias = -.0003; sun.shadow.normalBias = .03;
Object.assign(sun.shadow.camera, { left: -24, right: 24, top: 24, bottom: -24, near: 1, far: 140 }); scene.add(sun, sun.target);
scene.add(new THREE.HemisphereLight(new THREE.Color(.62, .7, .85), new THREE.Color(.3, .32, .22), INSIDE ? .02 : 1.0));
skyDome(scene, SUN);
{ const g = new THREE.PlaneGeometry(300, 300); g.rotateX(-Math.PI / 2); worldUV(g, .25); const m = new THREE.Mesh(g, mat('rock', { ns: .6, color: 0x7f9a5c, rough: 1 })); m.receiveShadow = true; m.position.y = -.01; scene.add(m); }
const d = C.door.z;
let eye, at;
if (VIEW === 'door') { eye = [1.6, 1.62, d + 5.2]; at = [0, 1.1, d - 1]; }
else if (VIEW === 'passage') { eye = [.1, 1.62, d - .6]; at = [0, 1.7, -2]; }
else if (VIEW === 'chamber') { eye = [.2, C.chamber.y + 1.62, 1.6]; at = [0, C.chamber.y + 1.0, -3.4]; }
else if (VIEW === 'vault') { eye = [0, C.chamber.y + 1.5, .3]; at = [0, C.chamber.vault, -.6]; cam.fov = 80; }
else { eye = [11, 3.2, d + 13]; at = [0, 2.4, 0]; }
cam.position.set(...eye); cam.lookAt(...at);
if (Q.get('cam')) { const c = Q.get('cam').split(',').map(Number); cam.position.set(c[0], c[1], c[2]); cam.lookAt(c[3], c[4], c[5]); }
cam.updateProjectionMatrix();
// your torch, inside: a warm light at the right hand, a little below the eye
if (INSIDE) { const t = new THREE.PointLight(new THREE.Color(1, .6, .28), 30, 14, 1.6); t.castShadow = true; t.shadow.mapSize.set(1024, 1024); t.shadow.bias = -.002;
  const rgt = new THREE.Vector3(1, 0, 0).applyQuaternion(cam.quaternion), fwd = new THREE.Vector3(0, 0, -1).applyQuaternion(cam.quaternion); t.position.copy(cam.position).addScaledVector(rgt, .35).addScaledVector(fwd, .3).add(new THREE.Vector3(0, -.25, 0)); scene.add(t); }
STATS.place = { place: 'cairn', view: VIEW, tris: C.tris, draws: C.draws, kerb: C.kerb, carved: C.carved };
run(makeComposer(R, scene, cam, { bloom: .15, sat: 1.0, vig: .35 }), cam);
