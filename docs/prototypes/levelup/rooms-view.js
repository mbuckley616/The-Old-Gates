// Rooms in the new kit (Session 852): rooms.js's gatelandsCottage in its lane, under the sky at four hours (OG-141's natural light).
// ?view=kitchen (default): from the door lobby past the jamb wall to the hearth; ?view=table: from the hearth to the table under the
// window and the box bed; ?view=dresser: the dresser and the back door; ?view=outside: the cottage from the lane, its windows by the hour.
// &hour=morning | noon (default) | golden | night. &cam=x,y,z,tx,ty,tz puts the camera anywhere.
import * as THREE from 'three';
import { Q, W, H, STATS, makeRenderer, makeComposer, buildTextures, mat, worldUV, skyDome, clouds, run } from './common.js';
import { gatelandsCottage } from './rooms.js';
import { stream } from './pieces.js';

const R = makeRenderer(.9), scene = new THREE.Scene(), VIEW = Q.get('view') || 'kitchen', HOUR = Q.get('hour') || 'noon'; buildTextures();
const cam = new THREE.PerspectiveCamera(62, W / H, .02, 30000);
// the hours: the sun's direction (the cottage's front faces +z, south), its colour and strength, the sky's light, the fog
const HOURS = { morning: { dir: [.5, .3, .82], c: [1, .82, .62], i: 3.2, sky: .5, fog: [.78, .8, .84] }, noon: { dir: [.15, .78, .6], c: [1, .96, .9], i: 3.6, sky: .7, fog: [.74, .8, .88] },
  golden: { dir: [-.8, .2, .55], c: [1, .62, .34], i: 2.8, sky: .4, fog: [.85, .7, .55] }, night: { dir: [.3, .45, .84], c: [.55, .66, 1], i: .35, sky: .06, fog: [.06, .08, .14] } };
const Hh = HOURS[HOUR] || HOURS.noon, SUN = new THREE.Vector3(...Hh.dir).normalize();
scene.fog = new THREE.FogExp2(new THREE.Color(...Hh.fog), .004);
const sun = new THREE.DirectionalLight(new THREE.Color(...Hh.c), Hh.i); sun.castShadow = true; sun.shadow.mapSize.set(4096, 4096); sun.shadow.bias = -.0003; sun.shadow.normalBias = .03;
sun.position.copy(SUN).multiplyScalar(40); Object.assign(sun.shadow.camera, { left: -9, right: 9, top: 9, bottom: -9, near: 1, far: 90 }); scene.add(sun, sun.target);
const sky = new THREE.HemisphereLight(new THREE.Color(.62, .72, .9), new THREE.Color(.34, .32, .24), Hh.sky * (VIEW === 'outside' ? 1.6 : .8)); scene.add(sky);
skyDome(scene, SUN); if (HOUR !== 'night') clouds(scene, SUN, { n: 8, d0: 1800, dw: 5000, y0: 300 });
{ const g = new THREE.PlaneGeometry(300, 300); g.rotateX(-Math.PI / 2); worldUV(g, .3); const m = new THREE.Mesh(g, mat('rock', { ns: .7, color: 0x7a8a5a, rough: 1 })); m.position.y = -.01; m.receiveShadow = true; scene.add(m); }
const C = gatelandsCottage({}, stream('cottage:kilbride')); scene.add(C.group);
// the fire's light, low and warm in the hearth; the lantern's at the golden hour and night; the candle's at night
{ const f = new THREE.PointLight(new THREE.Color(1, .55, .24), 7, 9, 1.6); f.position.set(C.fire[0] + .35, C.fire[1] + .2, C.fire[2]); f.castShadow = true; f.shadow.mapSize.set(1024, 1024); scene.add(f); }
if (HOUR === 'night' || HOUR === 'golden') { const l = new THREE.PointLight(new THREE.Color(1, .7, .4), HOUR === 'night' ? 4 : 2, 7, 1.6); l.position.set(C.lantern[0], C.lantern[1] - .1, C.lantern[2]); scene.add(l); }
const inside = VIEW !== 'outside'; let eye, at;
if (VIEW === 'table') { eye = [C.fire[0] + 1.1, 1.62, C.fire[2] - .4]; at = [1.9, .9, .6]; }
else if (VIEW === 'dresser') { eye = [.6, 1.6, 1.0]; at = [-.6, 1.3, -2.1]; }
else if (VIEW === 'outside') { eye = [6.5, 1.65, 11]; at = [0, 2.2, 0]; cam.fov = 45; }
else { eye = [2.2, 1.62, 1.75]; at = [C.hearth[0], .9, C.hearth[2]]; }
cam.position.set(...eye); cam.lookAt(...at);
if (Q.get('cam')) { const c = Q.get('cam').split(',').map(Number); cam.position.set(c[0], c[1], c[2]); cam.lookAt(c[3], c[4], c[5]); }
cam.updateProjectionMatrix();
STATS.room = { view: VIEW, hour: HOUR, tris: C.tris, draws: C.draws, shellTris: C.shellTris, shellCalls: C.shellCalls };
run(makeComposer(R, scene, cam, { bloom: .14, sat: 1.0, vig: .3 }), cam);
