// The Frostborn Vault (Session 2461; OG-104, the Mark): ruins.js's frostbornVault, a city of the Weavers' in a gorge under snow peaks, the
// glacier flowing out of its great portal and down under its two viaducts.
// ?place=frostborn&view=gorge (default): on the first viaduct's deck by the scale post, up the gorge over the broken viaduct to the face;
// view=under: on the ice under the first viaduct, up its two tiers; view=gap: on the broken viaduct's west end, across the gap, the stones on
// the ice below; view=portal: on the glacier before the face, the tongue out of the great portal; view=hall: on the first viaduct's deck,
// east into the hall's door; view=far: high from the south down the gorge. &dusk: the sun low in the south-west. &cam=x,y,z,tx,ty,tz.
import * as THREE from 'three';
import { Q, W, H, STATS, makeRenderer, makeComposer, buildTextures, run, skyDome } from './common.js';
import { frostbornVault } from './ruins.js';

const VIEW = Q.get('view') || 'gorge', DUSK = Q.has('dusk');
const R = makeRenderer(DUSK ? .9 : .8), scene = new THREE.Scene(); buildTextures();
scene.fog = new THREE.FogExp2(DUSK ? new THREE.Color(.62, .58, .62) : new THREE.Color(.78, .82, .88), VIEW === 'far' ? .0005 : .0008);
const cam = new THREE.PerspectiveCamera(58, W / H, .1, 30000);
const A = frostbornVault(); scene.add(A.group);
// the sun from the south (the gorge runs north into the peaks), low as the Mark's is; the face takes it full
const SUN = DUSK ? new THREE.Vector3(-.6, .14, .79).normalize() : new THREE.Vector3(.35, .42, .84).normalize(), sun = new THREE.DirectionalLight(DUSK ? new THREE.Color(1, .72, .5) : new THREE.Color(1, .95, .88), DUSK ? 1.9 : 2.2);
sun.position.copy(SUN).multiplyScalar(700); sun.target.position.set(0, -20, -150); sun.castShadow = true; sun.shadow.mapSize.set(4096, 4096); sun.shadow.bias = -.0004; sun.shadow.normalBias = .15;
Object.assign(sun.shadow.camera, { left: -280, right: 280, top: 280, bottom: -280, near: 1, far: 1600 }); scene.add(sun, sun.target);
scene.add(new THREE.HemisphereLight(new THREE.Color(.62, .7, .86), new THREE.Color(.55, .56, .6), .8));
skyDome(scene, SUN, DUSK ? { zen: [.3, .34, .5], mid: [.62, .55, .6], hor: [.92, .7, .58], glowK: .4 } : { zen: [.28, .4, .62], mid: [.52, .62, .78], hor: [.8, .85, .9], glowK: .15 });
const g = A.surf, E = 1.65, V1 = A.viaducts[0], V2 = A.viaducts[1];
let eye, at;
if (VIEW === 'under') { const x = 14, z = V1.z + 46; eye = [x, g(x, z) + E, z]; at = [-6, -12, V1.z]; cam.fov = 70; }
else if (VIEW === 'gap') { const x = V2.gap.a - 6.2, z = V2.z + 2.5; eye = [x, .3 + E, z]; at = [V2.gap.b + 4, -24, V2.z - 34]; cam.fov = 70; }
else if (VIEW === 'portal') { const x = -6, z = A.face.z + 84; eye = [x, g(x, z) + E, z]; at = [0, 36, A.face.z]; cam.fov = 64; }
else if (VIEW === 'hall') { eye = [62, .3 + E, V1.z + 2.6]; at = [100, 9, V1.z - 1]; cam.fov = 64; }
else if (VIEW === 'far') { eye = [170, 260, 520]; at = [0, -10, -160]; cam.fov = 48; }
else { eye = [A.figure.x - 4, .3 + E, V1.z - V1.w / 2 + 1.4]; at = [0, 22, A.face.z]; cam.fov = 62; }
cam.position.set(...eye); cam.lookAt(...at);
if (Q.get('cam')) { const c = Q.get('cam').split(',').map(Number); cam.position.set(c[0], c[1], c[2]); cam.lookAt(c[3], c[4], c[5]); }
cam.updateProjectionMatrix();
STATS.place = { place: 'frostborn', view: VIEW, dusk: DUSK, tris: A.tris, draws: A.draws, viaducts: A.viaducts.length, halls: A.halls.length, towers: A.towers.length, fallen: A.fallen.length };
run(makeComposer(R, scene, cam, { bloom: .06, sat: 1.0, vig: .3 }), cam);
