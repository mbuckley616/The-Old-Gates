// The Gatelands' canal lock (Session 1229): places.js's gatelandsCanal, a lock of 2.6 m on a summit canal, a humpback bridge over its
// tail, the lock-keeper's cottage and a turf barge.
// ?place=canal&view=lock (default): from the towpath below the bridge, up through the arch to the lower gates; view=gates: on the lockside
// by the lower gates' beams; view=chamber: from the shut upper gates' top down the chamber to the barge; view=bridge: from the road's crown over the
// lock to the upper gates; view=upper: from the upper towpath, the head and the paddles; view=barge: from the lower towpath to the barge
// tied up below the bridge (&barge=pound); view=far: high over it all. Session 1234: view=bywash, from over the upper pound's bank
// to the weir, the towpath's slab and the channel; view=falls, down its last falls to the culvert; view=outlet, from the east lockside to the
// spout in the tail's west wall; view=walk, from the west lockside below the beams to the lower gates' walkway (with &fill=high, the lower gates shut). &fill=high: the chamber full, the upper gates open. &barge=pound:
// the barge tied up in the lower pound. &dusk: the evening. &cam=x,y,z,tx,ty,tz puts the camera anywhere.
import * as THREE from 'three';
import { Q, W, H, STATS, makeRenderer, makeComposer, buildTextures, run, skyDome } from './common.js';
import { gatelandsCanal } from './places.js';
import { stream } from './pieces.js';

const VIEW = Q.get('view') || 'lock', DUSK = Q.has('dusk');
const R = makeRenderer(.82), scene = new THREE.Scene(); buildTextures();
scene.fog = new THREE.FogExp2(DUSK ? new THREE.Color(.5, .46, .48) : new THREE.Color(.74, .78, .82), .008);
const cam = new THREE.PerspectiveCamera(55, W / H, .05, 30000);
const A = gatelandsCanal({ key: 'canal:tóchar', fill: Q.get('fill'), barge: Q.get('barge') || (VIEW === 'barge' ? 'pound' : 'chamber') }, stream('canal:tóchar')); scene.add(A.group);
const SUN = DUSK ? new THREE.Vector3(-.85, .12, .3).normalize() : new THREE.Vector3(-.5, .62, .6).normalize(), sun = new THREE.DirectionalLight(DUSK ? new THREE.Color(1, .64, .42) : new THREE.Color(1, .94, .84), DUSK ? 1.2 : 2.4);
sun.position.copy(SUN).multiplyScalar(120); sun.castShadow = true; sun.shadow.mapSize.set(4096, 4096); sun.shadow.bias = -.0003; sun.shadow.normalBias = .05;
Object.assign(sun.shadow.camera, { left: -40, right: 40, top: 40, bottom: -40, near: 1, far: 300 }); scene.add(sun, sun.target);
scene.add(new THREE.HemisphereLight(DUSK ? new THREE.Color(.42, .4, .5) : new THREE.Color(.6, .68, .8), new THREE.Color(.32, .34, .24), DUSK ? .7 : 1.15)); skyDome(scene, SUN);
const g = A.ground, Bd = A.bridge, Lk = A.lock, Bg = A.barge;
let eye, at;
if (VIEW === 'gates') { eye = [-4.6, A.levels.CT + 1.62, 6.5]; at = [0, -1.2, 12.5]; cam.fov = 62; }
else if (VIEW === 'chamber') { eye = [.15, A.levels.CT + .7 + 1.62, -12.62]; at = [0, A.chamberY - .4, 2]; cam.fov = 62; }
else if (VIEW === 'bridge') { eye = [-.6, Bd.deck(0) + 1.62, Bd.z0 + .9]; at = [0, -.6, -8]; cam.fov = 60; }
else if (VIEW === 'upper') { eye = [-7.9, g(-7.9, -28) + 1.62, -28]; at = [0, -.4, -9]; cam.fov = 58; }
else if (VIEW === 'barge') { eye = [-9.6, g(-9.6, 30) + 1.62, 30]; at = [Bg.x, Bg.water + .6, Bg.z + 2]; cam.fov = 58; }
else if (VIEW === 'bywash') { eye = [-4.0, A.levels.CT + 2.9, -31.2]; at = [-8.6, -.5, -24.2]; cam.fov = 60; }
else if (VIEW === 'falls') { eye = [-12.4, A.levels.CT + 2.3, -2.4]; at = [-10.5, -.9, 7.5]; cam.fov = 58; }
else if (VIEW === 'outlet') { eye = [3.0, A.levels.CT + 1.62, 16.9]; at = [-2.2, -2.0, 15.0]; cam.fov = 60; }
else if (VIEW === 'walk') { eye = [-3.3, A.levels.CT + 1.75, 14.6]; at = [.4, A.levels.CT - .2, 11.9]; cam.fov = 64; }
else if (VIEW === 'far') { scene.fog.density = .003; eye = [34, 30, 52]; at = [0, -1, 2]; cam.fov = 50; }
else { eye = [-11.2, g(-11.2, 36) + 1.62, 36]; at = [0, -1.6, 14]; cam.fov = 58; }
cam.position.set(...eye); cam.lookAt(...at);
if (Q.get('cam')) { const c = Q.get('cam').split(',').map(Number); cam.position.set(c[0], c[1], c[2]); cam.lookAt(c[3], c[4], c[5]); }
cam.updateProjectionMatrix();
STATS.place = { place: 'canal', view: VIEW, dusk: DUSK, tris: A.tris, draws: A.draws, fill: A.fill, barge: Bg.at, trees: A.trees.length };
run(makeComposer(R, scene, cam, { bloom: DUSK ? .2 : .08, sat: .98, vig: .3 }), cam);
