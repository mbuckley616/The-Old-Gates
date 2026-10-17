// The Gatelands' ruined tower house (Session 1052, card F8): places.js's gatelandsTowerHouse in its bawn under a grey autumn day.
// ?place=towerhouse&view=tower (default): from the slope south-east, the bawn, the tower and its fallen corner; view=gate: in the gateway,
// the yard and the tower's door; view=hall: inside the door, the camp under the vault; view=stair: at the stair's head, down the well to
// the cellar; view=cellar: at the stair's foot, the store and the souterrain's door; view=souterrain: in the passage, west to the day at its
// pit; view=out: on the slope by the thorn, down the pit's stair to the souterrain's mouth; view=far: high over the place. &empty: the band gone (o.held
// false), the camp cold and dark, only your torch inside. &cam=x,y,z,tx,ty,tz puts the camera anywhere.
import * as THREE from 'three';
import { Q, W, H, STATS, makeRenderer, makeComposer, buildTextures, run, skyDome } from './common.js';
import { gatelandsTowerHouse } from './places.js';
import { stream } from './pieces.js';

const VIEW = Q.get('view') || 'tower', EMPTY = Q.has('empty'), IN = ['hall', 'stair', 'cellar', 'souterrain'].includes(VIEW);
const R = makeRenderer(IN ? .85 : .8), scene = new THREE.Scene(); buildTextures();
scene.fog = new THREE.FogExp2(new THREE.Color(.72, .75, .78), IN ? .02 : .009);
const cam = new THREE.PerspectiveCamera(55, W / H, .05, 30000);
const A = gatelandsTowerHouse({ key: 'towerhouse:dun', held: !EMPTY }, stream('towerhouse:dun')); scene.add(A.group);
// the day: a grey autumn afternoon, the sun low in the south-west through cloud
const SUN = new THREE.Vector3(-.5, .42, .76).normalize(), sun = new THREE.DirectionalLight(new THREE.Color(1, .92, .8), 2.2);
sun.position.copy(SUN).multiplyScalar(120); sun.castShadow = true; sun.shadow.mapSize.set(4096, 4096); sun.shadow.bias = -.0003; sun.shadow.normalBias = .05;
Object.assign(sun.shadow.camera, { left: -40, right: 40, top: 40, bottom: -40, near: 1, far: 300 }); scene.add(sun, sun.target);
scene.add(new THREE.HemisphereLight(new THREE.Color(.62, .68, .78), new THREE.Color(.32, .33, .24), IN ? .35 : 1.1)); skyDome(scene, SUN);
// the band's lights: the lanterns and the fire, the fire's casting shadows; with the band gone, a torch at your right hand
for (const p of A.lamps) { const l = new THREE.PointLight(new THREE.Color(1, .68, .36), 14, 9, 1.6); l.position.set(p[0], p[1] - .05, p[2] - .25) /* out from the wall it hangs on (each hangs on a wall facing -z) */; scene.add(l); }
if (A.fire) { const l = new THREE.PointLight(new THREE.Color(1, .6, .3), 26, 12, 1.5); l.position.set(A.fire[0], A.fire[1] + .4, A.fire[2]); l.castShadow = true; l.shadow.mapSize.set(1024, 1024); l.shadow.bias = -.002; scene.add(l); }
let torch = null; if (EMPTY && IN) { torch = new THREE.PointLight(new THREE.Color(1, .6, .28), 30, 13, 1.6); torch.castShadow = true; torch.shadow.mapSize.set(1024, 1024); torch.shadow.bias = -.002; scene.add(torch); }
const g = A.ground, Tw = A.tower, S = A.stair, So = A.souterrain, E = A.exit;
let eye, at;
if (VIEW === 'gate') { eye = [A.bawn.gate.x - .6, 1.62, A.bawn.z1 + .5]; at = [Tw.door.x, 4.5, Tw.z1]; cam.fov = 62; }
else if (VIEW === 'hall') { eye = [Tw.door.x + .2, A.hall.floor + 1.62, A.hall.z1 - .3]; at = [-2.2, 1.0, -6.6]; cam.fov = 70; }
else if (VIEW === 'stair') { eye = [S.x1 + .9, A.hall.floor + 1.62, S.z]; at = [S.x0 - .5, S.bottom + .6, S.z + .6]; cam.fov = 66; }
else if (VIEW === 'cellar') { eye = [S.x0 + .1, S.bottom + 1.62, S.z + .3]; at = [3.2, S.bottom + .6, -4.6]; cam.fov = 70; }
else if (VIEW === 'souterrain') { eye = [-7.5, So.floor + 1.62, So.z]; at = [-22, So.floor + 1.9, So.z]; cam.fov = 60; }
else if (VIEW === 'out') { eye = [E.x0 - 2.6, g(E.x0 - 2.6, So.z + 1.1) + 1.62, So.z + 1.1]; at = [E.x1 + .5, So.floor + 1.2, So.z]; cam.fov = 62; }
else if (VIEW === 'far') { scene.fog.density = .004; eye = [34, 30, 40]; at = [-2, 2, -3]; cam.fov = 50; }
else { eye = [28, g(28, 30) + 3.5, 30]; at = [-1, 6, -5]; }
cam.position.set(...eye); cam.lookAt(...at);
if (Q.get('cam')) { const c = Q.get('cam').split(',').map(Number); cam.position.set(c[0], c[1], c[2]); cam.lookAt(c[3], c[4], c[5]); }
cam.updateProjectionMatrix();
if (torch) { const rgt = new THREE.Vector3(1, 0, 0).applyQuaternion(cam.quaternion), fwd = new THREE.Vector3(0, 0, -1).applyQuaternion(cam.quaternion); torch.position.copy(cam.position).addScaledVector(rgt, .35).addScaledVector(fwd, .3).add(new THREE.Vector3(0, -.25, 0)); }
STATS.place = { place: 'towerhouse', view: VIEW, held: A.held, tris: A.tris, draws: A.draws, lamps: A.lamps.length };
run(makeComposer(R, scene, cam, { bloom: .12, sat: .96, vig: .3 }), cam);
