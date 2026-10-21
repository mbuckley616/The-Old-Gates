// The Mark's fjord port (Session 1239, card F8): places.js's markFjordPort, a wharf and its warehouses at a fjord's head, a clear cold noon.
// ?place=fjordport&view=fjord (default): from the water 40 m out, the wharf, the halls and the wall over them; view=wharf: on the wharf's
// west end, along it to the cutter and the beach; view=ship: at the gangplank's foot, up to her rail; view=halls: on the wharf under
// the hoists; view=naust: on the beach before the boathouses' mouths; view=racks: by the stockfish racks; view=far: high over it all.
// &cam=x,y,z,tx,ty,tz puts the camera anywhere.
import * as THREE from 'three';
import { Q, W, H, STATS, makeRenderer, makeComposer, buildTextures, run, skyDome } from './common.js';
import { markFjordPort } from './places.js';
import { stream } from './pieces.js';

const VIEW = Q.get('view') || 'fjord';
const R = makeRenderer(1.05), scene = new THREE.Scene(); buildTextures();
scene.fog = new THREE.FogExp2(new THREE.Color(.76, .81, .87), .0028);
const cam = new THREE.PerspectiveCamera(55, W / H, .05, 30000);
const A = markFjordPort({ key: 'fjordport:vik' }, stream('fjordport:vik')); scene.add(A.group);
const SUN = new THREE.Vector3(.45, .5, -.74).normalize(), sun = new THREE.DirectionalLight(new THREE.Color(1, .92, .8), 2.4);
sun.position.copy(SUN).multiplyScalar(160); sun.castShadow = true; sun.shadow.mapSize.set(4096, 4096); sun.shadow.bias = -.0003; sun.shadow.normalBias = .05;
Object.assign(sun.shadow.camera, { left: -60, right: 60, top: 60, bottom: -60, near: 1, far: 500 }); sun.target.position.set(-6, 0, 4); scene.add(sun, sun.target);
scene.add(new THREE.HemisphereLight(new THREE.Color(.66, .74, .86), new THREE.Color(.5, .5, .48), 1.5)); skyDome(scene, SUN);
const g = A.ground, Wf = A.wharf, D = Wf.deck + 1.62, h = A.halls[1], n = A.nausts[0], k = A.racks[1];
let eye, at;
if (VIEW === 'wharf') { eye = [Wf.x0 + 1.2, D, -2.4]; at = [Wf.x1, 1.8, -5]; cam.fov = 62; }
else if (VIEW === 'ship') { eye = [A.plank.a[0] + 2.6, D, -2.2]; at = [A.plank.b[0] - .6, 2.4, A.ship.z]; cam.fov = 62; }
else if (VIEW === 'halls') { eye = [h.x + 4.2, D, -5.2]; at = [h.x - 2, 5, h.front]; cam.fov = 64; }
else if (VIEW === 'naust') { eye = [n.x + 1.2, Math.max(0, g(n.x + 1.2, -5)) + 1.62, -5]; at = [n.x + .2, 1.0, n.z0 + 4]; cam.fov = 58; }
else if (VIEW === 'racks') { eye = [k.x + 5.5, g(k.x + 5.5, 1.5) + 1.62, 1.5]; at = [k.x - 2, 2.2, 12]; cam.fov = 62; }
else if (VIEW === 'far') { scene.fog.density = .0012; eye = [70, 60, -110]; at = [-4, 6, 6]; cam.fov = 52; }
else { eye = [-14, 1.4, -44]; at = [-2, 9, 14]; cam.fov = 60; }
cam.position.set(...eye); cam.lookAt(...at);
if (Q.get('cam')) { const c = Q.get('cam').split(',').map(Number); cam.position.set(c[0], c[1], c[2]); cam.lookAt(c[3], c[4], c[5]); }
cam.updateProjectionMatrix();
STATS.place = { place: 'fjordport', view: VIEW, tris: A.tris, draws: A.draws, cribs: A.cribs.length };
run(makeComposer(R, scene, cam, { bloom: .08, sat: .95, vig: .3 }), cam);
