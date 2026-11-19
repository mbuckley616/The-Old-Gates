// The Hollow Below (Session 2401; OG-104, the Mark): ruins.js's hollowBelow, a gate's rings cut into the back wall of a cavern under the fells,
// the noon light falling through the vault's oculus onto the court before them, a viaduct across the lake from the way in.
// ?place=hollow&view=mouth (default): on the shelf at the way in, along the viaduct to the rings and the light; view=deck: on the viaduct's
// middle, up the light to the oculus; view=court: beside the scale post in the light, up at the rings and the door; view=lake: low over the
// water under the viaduct's piers; view=far: high in the vault over the way in, the whole hollow. &dusk: the light gone grey and low.
// &nosun, &nopt: without the sun, or without its bounce off the court (to read the lighting). &cam=x,y,z,tx,ty,tz.
import * as THREE from 'three';
import { Q, W, H, STATS, makeRenderer, makeComposer, buildTextures, run } from './common.js';
import { hollowBelow } from './ruins.js';

const VIEW = Q.get('view') || 'mouth', DUSK = Q.has('dusk');
const R = makeRenderer(DUSK ? 1.6 : 1.15), scene = new THREE.Scene(); buildTextures();
const A = hollowBelow(); scene.add(A.group);
scene.background = DUSK ? new THREE.Color(.32, .36, .44) : new THREE.Color(.72, .82, .95);
scene.fog = new THREE.FogExp2(new THREE.Color(.025, .03, .04), VIEW === 'far' ? .0035 : .0045);
const cam = new THREE.PerspectiveCamera(60, W / H, .1, 3000);
// the sun through the oculus (the only direct light) and a little cold light from the rock; at dusk the sun is weak and grey
const SUN = new THREE.Vector3(...A.sun), sun = new THREE.DirectionalLight(DUSK ? new THREE.Color(.6, .65, .8) : new THREE.Color(1, .94, .82), DUSK ? 1.2 : 5.5);
sun.position.set(A.lands.x + SUN.x * 400, SUN.y * 400, A.lands.z + SUN.z * 400); sun.target.position.set(A.lands.x, 0, A.lands.z); sun.castShadow = true; sun.shadow.mapSize.set(4096, 4096); sun.shadow.bias = -.0005; sun.shadow.normalBias = .15;
Object.assign(sun.shadow.camera, { left: -150, right: 150, top: 150, bottom: -150, near: 100, far: 700 }); scene.add(sun, sun.target); if (Q.has('nosun')) sun.visible = false;
scene.add(new THREE.HemisphereLight(new THREE.Color(.32, .36, .42), new THREE.Color(.08, .08, .09), DUSK ? .3 : .55));
// the light's bounce off the court, warm and wide, so the rings' faces take some of it
{ const l = new THREE.PointLight(DUSK ? new THREE.Color(.4, .42, .5) : new THREE.Color(1, .9, .75), DUSK ? 600 : 2600, 160, 1.6); l.position.set(A.lands.x, 6, A.lands.z); scene.add(l); if (Q.has('nopt')) l.visible = false; }
const g = A.ground, E = 1.65; let eye, at;
if (VIEW === 'deck') { eye = [1.5, E, 20]; at = [A.oculus.x * .5, 70, A.oculus.z - 10]; cam.fov = 70; }
else if (VIEW === 'court') { eye = [A.figure.x + 6, E, A.figure.z + 14]; at = [-4, A.CY + 8, A.back - 20]; cam.fov = 72; }
else if (VIEW === 'lake') { eye = [-34, A.water + 4, 30]; at = [0, -20, -10]; cam.fov = 66; }
else if (VIEW === 'far') { eye = [-40, 48, 62]; at = [0, -4, -50]; cam.fov = 66; }
else { eye = [-24, g(-24, 83) + E, 83]; at = [0, 4, -60]; cam.fov = 62; }
cam.position.set(...eye); cam.lookAt(...at);
if (Q.get('cam')) { const c = Q.get('cam').split(',').map(Number); cam.position.set(c[0], c[1], c[2]); cam.lookAt(c[3], c[4], c[5]); }
cam.updateProjectionMatrix();
STATS.place = { place: 'hollow', view: VIEW, dusk: DUSK, tris: A.tris, draws: A.draws, rings: A.rings.length, lost: A.lost.length };
run(makeComposer(R, scene, cam, { bloom: .3, bloomT: .85, sat: 1.0, vig: .4 }), cam);
