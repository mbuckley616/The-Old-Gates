// The Gatelands' limestone cave with a lake under falls (Session 872, card F8): places.js's gatelandsCave. Inside there is no lamp: the day
// comes down the shaft with the falls, the flowers glow at the water's edge, and your torch is at your right hand.
// ?place=cave&view=lake (default): from the passage's end across the chamber to the falls; view=shore: along the east shore, the flowers
// and the stalagmites; view=falls: from the far shelf up the falls to the shaft; view=passage: from just inside the mouth up the passage to the chamber (the cave has no hillside round it yet).
// &noflowers: no flowers. &cam=x,y,z,tx,ty,tz.
import * as THREE from 'three';
import { Q, W, H, STATS, makeRenderer, makeComposer, buildTextures, run } from './common.js';
import { gatelandsCave } from './places.js';
import { stream } from './pieces.js';

const VIEW = Q.get('view') || 'lake', R = makeRenderer(1.2), scene = new THREE.Scene(); buildTextures();
scene.background = new THREE.Color(0x020203); scene.fog = new THREE.FogExp2(new THREE.Color(.03, .04, .05), .02);
const cam = new THREE.PerspectiveCamera(64, W / H, .02, 400);
const C = gatelandsCave({ key: 'cave:poll', flowers: !Q.has('noflowers') }, stream('cave:poll')); scene.add(C.group);
scene.add(new THREE.HemisphereLight(new THREE.Color(.3, .36, .42), new THREE.Color(.08, .08, .08), .12));
// the day down the shaft: a cool spot from above the shaft's top onto the falls' pool, casting shadows so it lights only what the hole sees
{ const s = new THREE.SpotLight(new THREE.Color(.85, .92, 1), 900, 40, .13, .5, 1.2); s.position.set(C.shaft.x + .3, C.shaft.top + 6, C.shaft.z + .3); s.target.position.set(C.falls.x, C.lake.y, C.falls.z);
  s.castShadow = true; s.shadow.mapSize.set(2048, 2048); s.shadow.bias = -.0005; scene.add(s, s.target); }
// the pool's glow: the light thrown back up off the white water
{ const p = new THREE.PointLight(new THREE.Color(.6, .85, 1), 30, 16, 1.5); p.position.set(C.falls.x + 1, C.lake.y + 1.2, C.falls.z + 1); scene.add(p); }
// the flowers' glow, one soft light at each cluster
if (C.flowers.length) for (let k = 0; k < C.flowers.length; k += 6) { const f = C.flowers[k], l = new THREE.PointLight(new THREE.Color(.5, .85, 1), 1.6, 3.5, 1.6); l.position.set(f[0], f[1] + .25, f[2]); scene.add(l); }
// the grey day at the mouth
{ const d = new THREE.SpotLight(new THREE.Color(.75, .82, .95), 30, 26, .5, .8, 1.2); d.position.set(0, 1.6, 2); d.target.position.set(0, .4, -8); scene.add(d, d.target); }
const Z0 = C.chamber.z0, Z1 = C.chamber.z1; let eye, at;
if (VIEW === 'shore') { eye = [8.6, 1.62, Z0 - 4.5]; at = [7.0, .6, Z0 - 16]; }
else if (VIEW === 'falls') { eye = [1.0, 1.62, Z1 + 2.4]; at = [C.falls.x, 5.5, C.falls.z]; cam.fov = 72; }
else if (VIEW === 'passage') { eye = [.4, 1.62, -.4]; at = [0, 1.2, -16]; }
else { eye = [.4, 1.62, Z0 - .6]; at = [C.falls.x + 2, 2.2, C.falls.z]; }
cam.position.set(...eye); cam.lookAt(...at);
if (Q.get('cam')) { const c = Q.get('cam').split(',').map(Number); cam.position.set(c[0], c[1], c[2]); cam.lookAt(c[3], c[4], c[5]); }
cam.updateProjectionMatrix();
{ const t = new THREE.PointLight(new THREE.Color(1, .6, .28), 30, 14, 1.6); t.castShadow = true; t.shadow.mapSize.set(1024, 1024); t.shadow.bias = -.002;
  const rgt = new THREE.Vector3(1, 0, 0).applyQuaternion(cam.quaternion), fwd = new THREE.Vector3(0, 0, -1).applyQuaternion(cam.quaternion); t.position.copy(cam.position).addScaledVector(rgt, .35).addScaledVector(fwd, .3).add(new THREE.Vector3(0, -.25, 0)); scene.add(t); }
STATS.place = { place: 'cave', view: VIEW, tris: C.tris, draws: C.draws, flowers: C.flowers.length };
run(makeComposer(R, scene, cam, { bloom: .3, sat: 1.0, vig: .35 }), cam);
