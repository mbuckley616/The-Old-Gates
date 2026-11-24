// A lesser gate's outside (Session 2616; L5, OG-037 V1/V3): gatemouth.js's gateMouth on its hill under a soft Gatelands day.
// ?size=s|m|l (the door as today's, 2.4 by 5.5 m, 3.6 by 11 m), &cond=steady|failing|catastrophic, &view=far (default, the face from the
// path, the camp in front) | foot (at the camp, up at the rings) | door (on the court before the slit) | wide (the hill from off the path),
// &dusk (the script against a late sky), &nocamp, &cam=x,y,z,tx,ty,tz.
import * as THREE from 'three';
import { Q, W, H, STATS, makeRenderer, makeComposer, buildTextures, run, skyDome } from './common.js';
import { gateMouth } from './gatemouth.js';

const VIEW = Q.get('view') || 'far', DUSK = Q.has('dusk');
const R = makeRenderer(DUSK ? 1.25 : .9), scene = new THREE.Scene(); buildTextures();
const A = gateMouth({ size: Q.get('size') || 'm', cond: Q.get('cond') || 'steady', camp: !Q.has('nocamp') }); scene.add(A.group);
const R0 = A.R0;
scene.fog = new THREE.FogExp2(DUSK ? new THREE.Color(.42, .4, .46) : new THREE.Color(.72, .78, .84), (DUSK ? .006 : .0045) * 13 / Math.max(13, R0));
const cam = new THREE.PerspectiveCamera(55, W / H, .05, 30000);
// the day: the sun low in the south-west over the viewer's left shoulder; at dusk lower and warmer, the sky gone violet-grey
const SUN = DUSK ? new THREE.Vector3(-.75, .14, .55).normalize() : new THREE.Vector3(-.55, .5, .67).normalize();
const sun = new THREE.DirectionalLight(DUSK ? new THREE.Color(1, .62, .4) : new THREE.Color(1, .94, .84), DUSK ? 1.1 : 3.0);
sun.position.copy(SUN).multiplyScalar(R0 * 12); sun.castShadow = true; sun.shadow.mapSize.set(4096, 4096); sun.shadow.bias = -.0004; sun.shadow.normalBias = .05 * R0 / 6.5;
Object.assign(sun.shadow.camera, { left: -R0 * 3.4, right: R0 * 3.4, top: R0 * 3.4, bottom: -R0 * 3.4, near: 1, far: R0 * 26 }); scene.add(sun, sun.target);
scene.add(new THREE.HemisphereLight(DUSK ? new THREE.Color(.36, .36, .5) : new THREE.Color(.62, .7, .85), new THREE.Color(.28, .3, .2), DUSK ? .45 : .95));
skyDome(scene, SUN, DUSK ? { zen: [.12, .12, .3], mid: [.36, .3, .46], hor: [.8, .55, .45], glow: [1, .55, .3], k: .9 } : {});
// the fire's glow at the camp, and the slit's breath when the gate is torn
if (A.camp) { const l = new THREE.PointLight(new THREE.Color(1, .55, .2), DUSK ? 14 : 3, 9, 1.6); l.position.set(A.camp.x + .7, A.ground(A.camp.x + .7, A.camp.z + 2.6) + .6, A.camp.z + 2.6); scene.add(l); }
if (A.cond === 'catastrophic') { const l = new THREE.PointLight(new THREE.Color(.6, .3, 1), 18 * (R0 / 6.5) ** 2, R0 * 1.6, 1.6); l.position.set(0, A.door.h * .5, A.plate + R0 * .4); scene.add(l); }
const g = A.ground, E = 1.65, f = A.figure; let eye, at;
if (VIEW === 'foot') { eye = [f.x + 1.2, g(f.x + 1.2, f.z + 2.5) + E, f.z + 2.5]; at = [0, A.CY + R0 * .35, A.plate]; cam.fov = 62; }
else if (VIEW === 'door') { const z = A.rings[0].zf + 2.2; eye = [A.door.w * .9, E, z]; at = [0, A.door.h * .6, A.plate]; cam.fov = 66; }
else if (VIEW === 'wide') { eye = [R0 * 2.6, g(R0 * 2.6, R0 * 4.2) + R0 * .5 + 2, R0 * 4.2]; at = [0, A.CY + R0 * .15, -R0 * .3]; cam.fov = 50; }
else { const z = R0 * 2.2 + 12; eye = [-R0 * .5, g(-R0 * .5, z) + E, z]; at = [0, A.CY + R0 * .1, A.plate]; cam.fov = 55; }
cam.position.set(...eye); cam.lookAt(...at);
if (Q.get('cam')) { const c = Q.get('cam').split(',').map(Number); cam.position.set(c[0], c[1], c[2]); cam.lookAt(c[3], c[4], c[5]); }
cam.updateProjectionMatrix();
STATS.place = { place: 'gatemouth', view: VIEW, size: A.size, cond: A.cond, R0, across: A.across, door: A.door, hill: A.hill, tris: A.tris, draws: A.draws, gateTris: A.gateTris, gateDraws: A.gateDraws,
  byMat: A.byMat, counts: A.counts, lost: A.lost.length, hung: A.hung.length, rings: A.rings.map(q => [q.ri, q.ro, q.zf, q.n, q.gone]), plate: A.plate, figure: A.figure, eye };
run(makeComposer(R, scene, cam, { bloom: DUSK ? .45 : .25, bloomT: .8, sat: 1.0, vig: .35 }), cam);
