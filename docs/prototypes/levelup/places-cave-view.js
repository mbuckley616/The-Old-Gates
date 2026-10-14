// The Gatelands' limestone cave with a lake under falls (Session 872, card F8; the hall rebuilt in Session 882): places.js's gatelandsCave.
// Inside there is no lamp: the day comes down the shaft with the falls, the flowers and the rimstone pools glow at the water's edge, and your
// torch is at your right hand (Michael's A on #313).
// ?place=cave&view=lake (default): from the ledge where the passage comes out, over the hall to the falls; view=shore: from the ramp's foot
// down the east shore, the terraces and the pools; view=falls: from the far shelf up the falls to the shaft; view=bridge: from the east shore
// over the natural bridge to the shelf; view=passage: from just inside the mouth up the winding passage (the cave has no hillside round it yet).
// &noflowers: no flowers. &cam=x,y,z,tx,ty,tz.
import * as THREE from 'three';
import { Q, W, H, STATS, makeRenderer, makeComposer, buildTextures, run } from './common.js';
import { gatelandsCave } from './places.js';
import { stream } from './pieces.js';

const VIEW = Q.get('view') || 'lake', R = makeRenderer(1.35), scene = new THREE.Scene(); buildTextures();
scene.background = new THREE.Color(0x020203); scene.fog = new THREE.FogExp2(new THREE.Color(.05, .065, .075), .012);
const cam = new THREE.PerspectiveCamera(64, W / H, .02, 500);
const C = gatelandsCave({ key: 'cave:poll', flowers: !Q.has('noflowers') }, stream('cave:poll')); scene.add(C.group);
scene.add(new THREE.HemisphereLight(new THREE.Color(.34, .4, .46), new THREE.Color(.08, .08, .08), .1));
// the day down the shaft: a cool spot from above the shaft's top onto the falls' pool, casting shadows so it lights only what the hole sees
{ const s = new THREE.SpotLight(new THREE.Color(.85, .92, 1), 1500, 70, .16, .5, 1.1); s.position.set(C.shaft.x + .3, C.shaft.top + 6, C.shaft.z + .3); s.target.position.set(C.falls.x, C.lake.y, C.falls.z);
  s.castShadow = true; s.shadow.mapSize.set(2048, 2048); s.shadow.bias = -.0005; scene.add(s, s.target); }
// the light thrown back off the white water and the mist: a wide cool glow over the far end of the hall
{ const p = new THREE.PointLight(new THREE.Color(.6, .85, 1), 110, 46, 1.3); p.position.set(C.falls.x + 2, C.lake.y + 3, C.falls.z + 3); scene.add(p); }
{ const p = new THREE.PointLight(new THREE.Color(.5, .7, .9), 45, 40, 1.3); p.position.set(C.falls.x + 4, C.lake.y + 14, C.falls.z + 8); scene.add(p); }
// the flowers' glow, one soft light at each cluster
if (C.flowers.length) for (let k = 0; k < C.flowers.length; k += 6) { const f = C.flowers[k], l = new THREE.PointLight(new THREE.Color(.5, .85, 1), 2.4, 4.5, 1.6); l.position.set(f[0], f[1] + .25, f[2]); scene.add(l); }
// the grey day at the mouth
{ const d = new THREE.SpotLight(new THREE.Color(.75, .82, .95), 40, 30, .5, .8, 1.2); d.position.set(0, C.ledge + 1.6, 2); d.target.position.set(0, C.ledge + .4, -8); scene.add(d, d.target); }
const Z0 = C.chamber.z0, Z1 = C.chamber.z1, LH = C.ledge, y = (x, z) => C.walkY(x, z) + 1.62; let eye, at;
const P = C.path, foot = P.find(p => p[1] < Z0 - 27);
if (VIEW === 'shore') { eye = [foot[0], y(foot[0], foot[1]), foot[1]]; at = [foot[0] - 7, .2, foot[1] - 22]; }
else if (VIEW === 'falls') { eye = [-9.5, y(-9.5, C.bridge.z - 3), C.bridge.z - 3]; at = [C.falls.x, 7, C.falls.z]; cam.fov = 74; }
else if (VIEW === 'bridge') { eye = [C.bridge.x0 + 2.5, y(C.bridge.x0 + 2.5, C.bridge.z + 2), C.bridge.z + 2]; at = [C.bridge.x1 - 4, 1.5, C.bridge.z - 2]; }
else if (VIEW === 'passage') { eye = [.4, LH + 1.62, -.4]; at = [0, LH + 1.2, -16]; }
else { eye = [-2, LH + 1.62, Z0 - 6]; at = [C.falls.x + 3, 1.5, C.falls.z + 10]; cam.fov = 70; }
cam.position.set(...eye); cam.lookAt(...at);
if (Q.get('cam')) { const c = Q.get('cam').split(',').map(Number); cam.position.set(c[0], c[1], c[2]); cam.lookAt(c[3], c[4], c[5]); }
cam.updateProjectionMatrix();
{ const t = new THREE.PointLight(new THREE.Color(1, .6, .28), 40, 18, 1.5); t.castShadow = true; t.shadow.mapSize.set(1024, 1024); t.shadow.bias = -.002;
  const rgt = new THREE.Vector3(1, 0, 0).applyQuaternion(cam.quaternion), fwd = new THREE.Vector3(0, 0, -1).applyQuaternion(cam.quaternion); t.position.copy(cam.position).addScaledVector(rgt, .35).addScaledVector(fwd, .3).add(new THREE.Vector3(0, -.25, 0)); scene.add(t); }
STATS.place = { place: 'cave', view: VIEW, tris: C.tris, draws: C.draws, flowers: C.flowers.length, pools: C.pools };
run(makeComposer(R, scene, cam, { bloom: .3, sat: 1.0, vig: .35 }), cam);
