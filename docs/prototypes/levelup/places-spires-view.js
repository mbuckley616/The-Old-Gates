// The Drowned Spires (Session 2389; OG-104, Gatelands): ruins.js's drownedSpires, six Weaver towers and their spans striding out from a strand.
// ?place=spires&view=shore (default): on the sand at a person's eye 100 m west of the scale post, across the chain; view=span: on the sand (or afloat, when the
// tide is over it) 45 m off the first span; view=deck: on the first span's deck, out along the decks; view=sea: from a boat's thwart beside the fourth tower; view=far: from over the sea, the chain and the strand.
// &level=a|b|c (the decks' height: a walk at the ebb, always clear, always under; default b), &tide=low|mid|high, &dusk, &cam=x,y,z,tx,ty,tz.
import * as THREE from 'three';
import { Q, W, H, STATS, makeRenderer, makeComposer, buildTextures, run, skyDome } from './common.js';
import { drownedSpires } from './ruins.js';

const VIEW = Q.get('view') || 'shore', DUSK = Q.has('dusk');
const R = makeRenderer(.8), scene = new THREE.Scene(); buildTextures();
scene.fog = new THREE.FogExp2(DUSK ? new THREE.Color(.52, .48, .5) : new THREE.Color(.74, .78, .82), VIEW === 'far' ? .0016 : .0028);
const cam = new THREE.PerspectiveCamera(55, W / H, .1, 30000);
const A = drownedSpires({ deck: Q.get('level') || 'b', tide: Q.get('tide') || 'mid' }); scene.add(A.group);
const SUN = DUSK ? new THREE.Vector3(-.85, .14, -.35).normalize() : new THREE.Vector3(-.55, .5, .55).normalize(), sun = new THREE.DirectionalLight(DUSK ? new THREE.Color(1, .64, .42) : new THREE.Color(1, .94, .84), DUSK ? 1.3 : 2.4);
sun.position.copy(SUN).multiplyScalar(500); sun.target.position.set(20, 0, -160); sun.position.add(sun.target.position); sun.castShadow = true; sun.shadow.mapSize.set(4096, 4096); sun.shadow.bias = -.0004; sun.shadow.normalBias = .1;
Object.assign(sun.shadow.camera, { left: -190, right: 190, top: 190, bottom: -190, near: 1, far: 1200 }); scene.add(sun, sun.target);
scene.add(new THREE.HemisphereLight(DUSK ? new THREE.Color(.42, .4, .5) : new THREE.Color(.6, .68, .78), new THREE.Color(.3, .32, .22), DUSK ? .7 : 1.1)); skyDome(scene, SUN);
const T = A.towers, g = A.ground, last = T[T.length - 1];
let eye, at;
if (VIEW === 'deck') { const s = A.spans[0]; eye = [s.x + 2, Math.max(A.deck, A.sea) + 1.65, s.z + 6]; at = [last.x, A.deck + 10, last.z]; cam.fov = 62; }
else if (VIEW === 'sea') { const t = T[3]; eye = [t.x - 34, A.sea + 1.2, t.z + 10]; at = [t.x + 5, A.sea + 18, t.z - 20]; cam.fov = 62; }
else if (VIEW === 'span') { const s = A.spans[0], x = -42, z = -22; eye = [x, Math.max(g(x, z), A.sea) + 1.65, z]; at = [s.x + 6, Math.max(A.deck, A.sea) + 4, s.z - 10]; cam.fov = 60; }
else if (VIEW === 'far') { eye = [-260, 60, -360]; at = [30, 30, -150]; cam.fov = 45; }
else { const x = -95, z = A.figure.z + 50; eye = [x, g(x, z) + 1.65, z]; at = [T[3].x, 24, T[3].z]; cam.fov = 60; }
cam.position.set(...eye); cam.lookAt(...at);
if (Q.get('cam')) { const c = Q.get('cam').split(',').map(Number); cam.position.set(c[0], c[1], c[2]); cam.lookAt(c[3], c[4], c[5]); }
cam.updateProjectionMatrix();
STATS.place = { place: 'spires', view: VIEW, dusk: DUSK, tris: A.tris, draws: A.draws, towers: A.towers.length, spans: A.spans.length, deck: A.deck, sea: A.sea };
run(makeComposer(R, scene, cam, { bloom: DUSK ? .2 : .08, sat: .96, vig: .3 }), cam);
