// Stormwatch (Session 2454; OG-104, the Gatelands): ruins.js's stormwatch, the older people's fort of three dry-stone walls on a sea cliff.
// ?place=stormwatch&view=fort (default): on the way in outside the outer wall, toward the cashel and the sea; view=stones: among the set stones
// before the middle wall; view=gate: at the passage's outer mouth, through it to the sea; view=inside: in the cashel by the passage, its
// terraces and the platform at the edge; view=edge: at the edge where the cashel's wall ends, down the cliff; view=sea: from a boat 380 m
// out, the cliff and the walls' ends on its top; view=far: high over the land from the north-east. &dusk: the sun low over the sea.
// &cam=x,y,z,tx,ty,tz.
import * as THREE from 'three';
import { Q, W, H, STATS, makeRenderer, makeComposer, buildTextures, run, skyDome } from './common.js';
import { stormwatch } from './ruins.js';

const VIEW = Q.get('view') || 'fort', DUSK = Q.has('dusk');
const R = makeRenderer(.8), scene = new THREE.Scene(); buildTextures();
scene.fog = new THREE.FogExp2(DUSK ? new THREE.Color(.62, .52, .5) : new THREE.Color(.74, .79, .84), VIEW === 'far' || VIEW === 'sea' ? .00028 : .0006);
const cam = new THREE.PerspectiveCamera(60, W / H, .1, 30000);
const A = stormwatch(); scene.add(A.group);
const g = A.ground, e = A.ell, at3 = (p, h) => [p[0], g(p[0], p[1]) + h, p[1]], AE = A.passage.a;
let eye, at, focus;
if (VIEW === 'stones') { const p = e(58, 52, 2.2, 15); eye = at3(p, 1.65); at = at3(e(58, 52, 2.0, 0), 1.2); focus = e(58, 52, 2.1, 6); cam.fov = 64; }
else if (VIEW === 'gate') { const p = e(26, 22, AE, 5.5); eye = at3(p, 1.65); at = at3(e(26, 22, AE, -14), 1.5); focus = A.C; cam.fov = 62; }
else if (VIEW === 'inside') { const p = e(26, 22, AE, -6); eye = at3(p, 1.65); at = [A.C[0] - 16, A.TOP - 3, A.C[1] - 6]; focus = A.C; cam.fov = 72; }
else if (VIEW === 'edge') { const q = A.walls.inner.ends[0] || [26, 0], x = q[0] - 16, z = A.edge(x) + 3.5; eye = [x, g(x, z) + 1.65, z]; at = [q[0] + 120, A.TOP - 85, A.edge(q[0] + 120) - 18]; focus = q; cam.fov = 66; }
else if (VIEW === 'sea') { eye = [-90, 3, -250]; at = [0, 60, 0]; focus = [0, 0, -40]; cam.fov = 50; }
else if (VIEW === 'far') { eye = [190, 170, 250]; at = [0, 70, 0]; focus = [0, 0, 20]; cam.fov = 46; }
else { const p = e(118, 100, AE, 9); eye = at3(p, 1.65); at = at3(e(26, 22, AE + .2, -10), 2); focus = e(58, 52, AE, 0); cam.fov = 48; }
const SUN = DUSK ? new THREE.Vector3(-.25, .07, -1).normalize() : VIEW === 'sea' ? new THREE.Vector3(-.9, .42, -.3).normalize() : new THREE.Vector3(.5, .6, .35).normalize(), sun = new THREE.DirectionalLight(DUSK ? new THREE.Color(1, .6, .38) : new THREE.Color(1, .94, .84), DUSK ? 1.6 : 2.4);
const SR = VIEW === 'far' || VIEW === 'sea' ? 420 : 170;
sun.target.position.set(focus[0], A.TOP, focus[1]); sun.position.copy(SUN).multiplyScalar(2400).add(sun.target.position); sun.castShadow = true; sun.shadow.mapSize.set(4096, 4096); sun.shadow.bias = -.0004; sun.shadow.normalBias = .15;
Object.assign(sun.shadow.camera, { left: -SR, right: SR, top: SR, bottom: -SR, near: 10, far: 5000 }); scene.add(sun, sun.target);
scene.add(new THREE.HemisphereLight(DUSK ? new THREE.Color(.5, .44, .52) : new THREE.Color(.6, .68, .78), new THREE.Color(.22, .26, .22), DUSK ? .75 : 1.1)); skyDome(scene, SUN);
cam.position.set(...eye); cam.lookAt(...at);
if (Q.get('cam')) { const c = Q.get('cam').split(',').map(Number); cam.position.set(c[0], c[1], c[2]); cam.lookAt(c[3], c[4], c[5]); }
cam.updateProjectionMatrix();
const W3 = A.walls; STATS.place = { place: 'stormwatch', view: VIEW, dusk: DUSK, tris: A.tris, draws: A.draws, walls: 3, segs: [W3.inner.segs.length, W3.middle.segs.length, W3.outer.segs.length], chev: A.chev.length, tumbles: A.tumbles };
run(makeComposer(R, scene, cam, { bloom: DUSK ? .12 : .06, sat: .96, vig: .3 }), cam);
