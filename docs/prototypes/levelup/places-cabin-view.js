// The Mark's hunting cabin (Session 998, card F8): places.js's markHuntingCabin, a laft cabin in a clearing of snowed spruce, smoking.
// ?place=cabin&view=cabin (default): from the path in the clearing, the door's gable, the woodpile and the smoke; view=store: by the
// stabbur's steps, the rat stones and the gap; view=corner: close on the laft at the cabin's north-east corner; view=yard: from the
// chopping block across the woodpile; view=far: the clearing from over the trees. &cam=x,y,z,tx,ty,tz puts the camera anywhere.
import * as THREE from 'three';
import { Q, W, H, STATS, makeRenderer, makeComposer, buildTextures, run, skyDome } from './common.js';
import { markHuntingCabin } from './places.js';
import { stream } from './pieces.js';

const VIEW = Q.get('view') || 'cabin';
const R = makeRenderer(.8), scene = new THREE.Scene(); buildTextures();
scene.fog = new THREE.FogExp2(new THREE.Color(.72, .76, .84), .016);
const cam = new THREE.PerspectiveCamera(55, W / H, .05, 30000);
const A = markHuntingCabin({ key: 'cabin:skarvhaug' }, stream('cabin:skarvhaug')); scene.add(A.group);
// a winter afternoon in the Mark: the sun low in the south-west, the light cold, the shadows blue
const SUN = new THREE.Vector3(-.6, .22, .76).normalize(), sun = new THREE.DirectionalLight(new THREE.Color(1, .86, .7), 1.7);
sun.position.copy(SUN).multiplyScalar(80); sun.castShadow = true; sun.shadow.mapSize.set(4096, 4096); sun.shadow.bias = -.0003; sun.shadow.normalBias = .04;
Object.assign(sun.shadow.camera, { left: -30, right: 30, top: 30, bottom: -30, near: 1, far: 240 }); scene.add(sun, sun.target);
scene.add(new THREE.HemisphereLight(new THREE.Color(.62, .7, .86), new THREE.Color(.5, .52, .58), 1.2)); skyDome(scene, SUN);
{ const C = A.cabin, l = new THREE.PointLight(new THREE.Color(1, .6, .3), 4, 6, 1.6); l.position.set(C.win.x - .6, C.win.sill + .3, C.win.z); scene.add(l); const o = l.clone(); o.position.set(C.win.x + .9, C.win.sill + .2, C.win.z); o.intensity = 1.5; scene.add(o); }
const g = A.ground, C = A.cabin, S = A.store;
let eye, at;
if (VIEW === 'store') { eye = [S.x + 2.2, g(S.x + 2.2, S.z + 4.2) + 1.62, S.z + 4.2]; at = [S.x - .2, S.floor * .6, S.z]; cam.fov = 60; }
else if (VIEW === 'corner') { eye = [C.x1 + 2.0, 1.62, C.z0 - 1.6]; at = [C.x1, 1.3, C.z0]; cam.fov = 60; }
else if (VIEW === 'yard') { eye = [-4.6, g(-4.6, 4.6) + 1.62, 4.6]; at = [-2.2, .7, -.5]; cam.fov = 60; }
else if (VIEW === 'far') { eye = [4, 34, 15]; at = [0, 0, -1]; cam.fov = 50; }
else { eye = [2.6, g(2.6, 10.5) + 1.62, 10.5]; at = [-.2, 2.2, 0]; }
cam.position.set(...eye); cam.lookAt(...at);
if (Q.get('cam')) { const c = Q.get('cam').split(',').map(Number); cam.position.set(c[0], c[1], c[2]); cam.lookAt(c[3], c[4], c[5]); }
cam.updateProjectionMatrix();
STATS.place = { place: 'cabin', view: VIEW, tris: A.tris, draws: A.draws, logs: C.logs.length, trees: A.trees.length };
run(makeComposer(R, scene, cam, { bloom: .12, sat: .95, vig: .3 }), cam);
