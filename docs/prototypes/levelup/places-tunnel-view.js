// Aurenne's trade tunnel (Session 908, card F8): places.js's aurenneTunnel, its quay under a high sun, inside by its lamps.
// ?place=tunnel&view=quay (default): on the quay before the portal; view=tunnel: inside, past the first lamps toward the bend;
// view=passing: at the passing place under the shaft, the table and the amphorae; view=inland: from inside toward the inland portal's
// day; view=road: on the dust road before the inland portal. &dark: the lamps out (o.used false), your torch. &cam=x,y,z,tx,ty,tz.
import * as THREE from 'three';
import { Q, W, H, STATS, makeRenderer, makeComposer, buildTextures, run, skyDome } from './common.js';
import { aurenneTunnel } from './places.js';
import { stream } from './pieces.js';

const VIEW = Q.get('view') || 'quay', INSIDE = ['tunnel', 'passing', 'inland'].includes(VIEW);
const R = makeRenderer(INSIDE ? 1.15 : .8), scene = new THREE.Scene(); buildTextures();
scene.fog = new THREE.FogExp2(new THREE.Color(.8, .8, .78), INSIDE ? .01 : .004);
const cam = new THREE.PerspectiveCamera(INSIDE ? 64 : 52, W / H, .03, 30000);
const T = aurenneTunnel({ key: 'tunnel:sarrat', used: !Q.has('dark') }, stream('tunnel:sarrat')); scene.add(T.group);
const SUN = new THREE.Vector3(.35, .78, .52).normalize(), sun = new THREE.DirectionalLight(new THREE.Color(1, .92, .78), 3.4);
sun.position.copy(SUN).multiplyScalar(80); sun.castShadow = true; sun.shadow.mapSize.set(4096, 4096); sun.shadow.bias = -.0003; sun.shadow.normalBias = .04;
Object.assign(sun.shadow.camera, { left: -40, right: 40, top: 40, bottom: -40, near: 1, far: 220 }); sun.target.position.set(0, 0, -28); scene.add(sun, sun.target);
scene.add(new THREE.HemisphereLight(new THREE.Color(.7, .76, .88), new THREE.Color(.42, .36, .26), INSIDE ? .06 : 1.0));
skyDome(scene, SUN);
// the lamps: a small warm light in each, the nearest casting shadows; the day down the shaft
T.lamps.forEach((p, i) => { const l = new THREE.PointLight(new THREE.Color(1, .66, .34), 9, 9, 1.6); l.position.set(...p); scene.add(l); });
{ const S = T.shaft, d = new THREE.SpotLight(new THREE.Color(1, .95, .85), 260, 22, .16, .5, 1.2); d.position.set(S.x, S.top - .5, S.z); d.target.position.set(S.x + .4, 0, S.z + .3); d.castShadow = true; d.shadow.mapSize.set(1024, 1024); scene.add(d, d.target); }
{ const S = T.shaft, f = new THREE.PointLight(new THREE.Color(.95, .93, .88), 14, 10, 1.4); f.position.set(S.x, 3.6, S.z); scene.add(f); } /* the day off the floor under the shaft */
for (const m of T.mouths) { const d = new THREE.SpotLight(new THREE.Color(.95, .92, .86), 60, 26, .7, .9, 1.2); d.position.set(0, 2.6, m.z + (m.z ? -1.5 : 1.5)); d.target.position.set(0, 1.2, m.z + (m.z ? 14 : -14)); scene.add(d, d.target); }
const xc = T.xc, P = T.passing;
let eye, at;
if (VIEW === 'tunnel') { eye = [xc(-1.5), 1.62, -1.5]; at = [xc(-16), 1.5, -16]; }
else if (VIEW === 'passing') { eye = [xc(P.z0 + 2.5) - 1.2, 1.62, P.z0 + 2.5]; at = [xc(P.z1) + .8, 1.4, P.z1]; cam.fov = 72; }
else if (VIEW === 'inland') { eye = [xc(-40), 1.62, -40]; at = [0, 1.6, -T.L]; }
else if (VIEW === 'road') { eye = [-4, 1.62, -T.L - 11]; at = [0, 2.6, -T.L]; }
else { eye = [2.6, 1.62, 11]; at = [0, 2.6, -6]; }
cam.position.set(...eye); cam.lookAt(...at);
if (Q.get('cam')) { const c = Q.get('cam').split(',').map(Number); cam.position.set(c[0], c[1], c[2]); cam.lookAt(c[3], c[4], c[5]); }
cam.updateProjectionMatrix();
if (INSIDE && !T.used) { const t = new THREE.PointLight(new THREE.Color(1, .6, .28), 30, 14, 1.6); t.castShadow = true; t.shadow.mapSize.set(1024, 1024); t.shadow.bias = -.002;
  const rgt = new THREE.Vector3(1, 0, 0).applyQuaternion(cam.quaternion), fwd = new THREE.Vector3(0, 0, -1).applyQuaternion(cam.quaternion); t.position.copy(cam.position).addScaledVector(rgt, .35).addScaledVector(fwd, .3).add(new THREE.Vector3(0, -.25, 0)); scene.add(t); }
STATS.place = { place: 'tunnel', view: VIEW, tris: T.tris, draws: T.draws, lamps: T.lamps.length, used: T.used };
run(makeComposer(R, scene, cam, { bloom: .18, sat: 1.0, vig: .35 }), cam);
