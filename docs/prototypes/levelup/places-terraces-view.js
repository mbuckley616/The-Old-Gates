// The Mark's cliff terraces (Session 1242, card F8): places.js's markCliffTerraces, three terraces up a cliff split by a gorge, a stone
// bridge and two rope walkways across it, a clear cold afternoon.
// ?place=terraces&view=front (default): from the valley's side, the three terraces and the gorge between them; view=bridge: on the lowest
// terrace's walk at the bridge; view=rope: at the top walkway's west end, across it; view=gorge: on the bridge, up the gorge at the ropes;
// view=stair: at the foot of the lowest terrace's stair; view=store: on the middle terrace's walk at the storehouse; view=far: high over it all.
// &cam=x,y,z,tx,ty,tz puts the camera anywhere.
import * as THREE from 'three';
import { Q, W, H, STATS, makeRenderer, makeComposer, buildTextures, run, skyDome } from './common.js';
import { markCliffTerraces } from './places.js';
import { stream } from './pieces.js';

const VIEW = Q.get('view') || 'front';
const R = makeRenderer(1.05), scene = new THREE.Scene(); buildTextures();
scene.fog = new THREE.FogExp2(new THREE.Color(.76, .81, .87), .0026);
const cam = new THREE.PerspectiveCamera(55, W / H, .05, 30000);
const A = markCliffTerraces({ key: 'terraces:berg' }, stream('terraces:berg')); scene.add(A.group);
const SUN = new THREE.Vector3(.5, .45, -.74).normalize(), sun = new THREE.DirectionalLight(new THREE.Color(1, .9, .78), 2.4);
sun.position.copy(SUN).multiplyScalar(160); sun.castShadow = true; sun.shadow.mapSize.set(4096, 4096); sun.shadow.bias = -.0003; sun.shadow.normalBias = .05;
Object.assign(sun.shadow.camera, { left: -60, right: 60, top: 60, bottom: -60, near: 1, far: 500 }); sun.target.position.set(0, 4, 6); scene.add(sun, sun.target);
scene.add(new THREE.HemisphereLight(new THREE.Color(.66, .74, .86), new THREE.Color(.5, .5, .48), 1.5)); skyDome(scene, SUN);
const [r1, r2] = A.ropes, st = A.stairs[0], E = 1.62;
let eye, at;
if (VIEW === 'bridge') { eye = [16, E, A.zc[0] + .3]; at = [-8, 1.2, A.zc[0] - .4]; cam.fov = 62; }
else if (VIEW === 'rope') { eye = [-A.walk - .4, r2.y + E, r2.z - .2]; at = [6, r2.y + .2, r2.z + .3]; cam.fov = 64; }
else if (VIEW === 'gorge') { eye = [0, E, A.zc[0] - .6]; at = [0, 10, 12]; cam.fov = 66; }
else if (VIEW === 'stair') { eye = [st.x0 - 4.5, E, (st.z0 + st.z1) / 2 + .2]; at = [st.x1 + 1, 6.6, st.z0 - .6]; cam.fov = 62; }
else if (VIEW === 'store') { eye = [A.walk + .2, r1.y + E, r1.z + 1]; at = [A.walk + 6, r1.y + 2, 12]; cam.fov = 62; }
else if (VIEW === 'far') { scene.fog.density = .0012; eye = [70, 55, -95]; at = [0, 4, 6]; cam.fov = 50; }
else { eye = [-34, -12, -84]; at = [0, 5, 6]; cam.fov = 48; }
cam.position.set(...eye); cam.lookAt(...at);
if (Q.get('cam')) { const c = Q.get('cam').split(',').map(Number); cam.position.set(c[0], c[1], c[2]); cam.lookAt(c[3], c[4], c[5]); }
cam.updateProjectionMatrix();
STATS.place = { place: 'terraces', view: VIEW, tris: A.tris, draws: A.draws, halls: A.halls.length };
run(makeComposer(R, scene, cam, { bloom: .08, sat: .95, vig: .3 }), cam);
