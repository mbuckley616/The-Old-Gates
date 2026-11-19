// The Scarred Gate (Session 2398; OG-104, Aurenne): ruins.js's scarredGate, a ring of the Weavers' stood on its edge in a red desert, broken by
// a blow from under its right foot, in the gold of a late afternoon (the sheet's light).
// ?place=scarred&view=front (default): on the sand 130 m out on the gate's axis; view=cleft: on the sand 44 m out, up at the cleft;
// view=foot: beside the scale post at the ring's foot, up through the opening; view=scar: on a rise beside the scar 150 m out (14 m up), back along it to the gate;
// view=far: high over the desert from the south-west, the gate, the crater, the scar, the thrown stones and the buttes.
// &wake: the gone stones hung over their seats with violet seams and the script burning violet (the DECISION's B). &dusk. &cam=x,y,z,tx,ty,tz.
import * as THREE from 'three';
import { Q, W, H, STATS, makeRenderer, makeComposer, buildTextures, run, skyDome } from './common.js';
import { scarredGate } from './ruins.js';

const VIEW = Q.get('view') || 'front', DUSK = Q.has('dusk'), WAKE = Q.has('wake');
const R = makeRenderer(DUSK ? 1.25 : 1.0), scene = new THREE.Scene(); buildTextures();
scene.fog = new THREE.FogExp2(DUSK ? new THREE.Color(.36, .22, .24) : new THREE.Color(.9, .62, .42), VIEW === 'far' ? .0008 : .0013);
const cam = new THREE.PerspectiveCamera(58, W / H, .1, 30000);
const A = scarredGate({ wake: WAKE }); scene.add(A.group);
// the sun low in the west-south-west, behind the viewer's left on the axis view, so the ring's face takes it and its opening frames the sky
const SUN = DUSK ? new THREE.Vector3(-.75, .1, .55).normalize() : new THREE.Vector3(-.62, .32, .7).normalize(), sun = new THREE.DirectionalLight(DUSK ? new THREE.Color(1, .55, .35) : new THREE.Color(1, .82, .6), DUSK ? 1.6 : 2.6);
sun.position.copy(SUN).multiplyScalar(400); sun.castShadow = true; sun.shadow.mapSize.set(4096, 4096); sun.shadow.bias = -.0004; sun.shadow.normalBias = .12;
Object.assign(sun.shadow.camera, { left: -170, right: 170, top: 170, bottom: -170, near: 1, far: 1000 }); scene.add(sun, sun.target);
scene.add(new THREE.HemisphereLight(DUSK ? new THREE.Color(.5, .36, .5) : new THREE.Color(.62, .66, .8), new THREE.Color(.42, .24, .16), DUSK ? .7 : 1.0));
skyDome(scene, SUN, DUSK ? { zen: [.14, .1, .24], mid: [.46, .24, .32], hor: [.95, .5, .3], glow: [1, .5, .25], glowK: .8 } : { zen: [.22, .34, .58], mid: [.62, .58, .6], hor: [1, .72, .48], glow: [1, .7, .42], glowK: .6 });
const g = A.ground, E = 1.65; let eye, at;
if (VIEW === 'cleft') { const t = A.cleft.a * Math.PI / 180; eye = [-4, g(-4, 44) + E, 44]; at = [Math.sin(t) * (A.R0 + 3), A.CY + Math.cos(t) * (A.R0 + 3) - 4, 0]; cam.fov = 62; }
else if (VIEW === 'foot') { eye = [A.figure.x - 3, A.figure.y + E, A.figure.z + 5]; at = [6, A.CY + 6, -40]; cam.fov = 74; }
else if (VIEW === 'scar') { const s = 150, x = A.crater.x + Math.cos(A.scar.a) * s - Math.sin(A.scar.a) * 14, z = A.crater.z + Math.sin(A.scar.a) * s + Math.cos(A.scar.a) * 14; eye = [x, g(x, z) + 14, z]; at = [0, 16, 0]; cam.fov = 60; }
else if (VIEW === 'far') { eye = [-260, 150, 300]; at = [30, 0, 20]; cam.fov = 50; }
else { const x = -6, z = 130; eye = [x, g(x, z) + E, z]; at = [2, 30, 0]; cam.fov = 60; }
cam.position.set(...eye); cam.lookAt(...at);
if (Q.get('cam')) { const c = Q.get('cam').split(',').map(Number); cam.position.set(c[0], c[1], c[2]); cam.lookAt(c[3], c[4], c[5]); }
cam.updateProjectionMatrix();
STATS.place = { place: 'scarred', view: VIEW, dusk: DUSK, wake: WAKE, tris: A.tris, draws: A.draws, gone: A.gone, thrown: A.thrown.length, hung: A.hung.length, buttes: A.buttes.length };
run(makeComposer(R, scene, cam, { bloom: WAKE ? .4 : .12, sat: 1.05, vig: .35 }), cam);
