// The Makers' trials' props (Session 837): props.js's bladeStone and ringCairn on open ground under a clear sky, with the
// 1.8 m post. ?view=blade (default): the Gate-Blade in its stone, from the path; ?view=blade&close: the hilt at arm's length;
// ?view=cairn: the Noon Ring's cairn at noon, the sun through the slab's hole falling on the hollow; &sun=morning moves the sun off it.
import * as THREE from 'three';
import { Q, W, H, STATS, makeRenderer, makeComposer, buildTextures, mat, worldUV, skyDome, clouds, run } from './common.js';
import { bladeStone, ringCairn } from './props.js';
import { stream } from './pieces.js';

const R = makeRenderer(.85), scene = new THREE.Scene(), VIEW = Q.get('view') || 'blade';
scene.fog = new THREE.FogExp2(new THREE.Color(.74, .80, .88), .006);
const cam = new THREE.PerspectiveCamera(45, W / H, .02, 30000); buildTextures();
const noon = Q.get('sun') !== 'morning', alt = 40 * Math.PI / 180, SUN = noon ? new THREE.Vector3(0, Math.sin(alt), Math.cos(alt)) : new THREE.Vector3(.8, .35, .3).normalize();
const sun = new THREE.DirectionalLight(new THREE.Color(1, .92, .8), 3.6); sun.castShadow = true; sun.shadow.mapSize.set(4096, 4096); sun.shadow.bias = -.0002; sun.shadow.normalBias = .02;
scene.add(sun, sun.target, new THREE.HemisphereLight(new THREE.Color(.62, .72, .9), new THREE.Color(.34, .32, .24), 1.1));
skyDome(scene, SUN); clouds(scene, SUN, { n: 8, d0: 1800, dw: 5000, y0: 300 });
{ const g = new THREE.PlaneGeometry(400, 400); g.rotateX(-Math.PI / 2); worldUV(g, .3); const m = new THREE.Mesh(g, mat('rock', { ns: .7, color: 0x8a9a6a, rough: 1 })); m.receiveShadow = true; scene.add(m); }
{ const m = new THREE.MeshStandardMaterial({ color: 0x3a3028 }), post = new THREE.Group(); post.add(new THREE.Mesh(new THREE.BoxGeometry(.03, 1.8, .03).translate(0, .9, 0), m)); for (let i = 1; i <= 18; i++) post.add(new THREE.Mesh(new THREE.BoxGeometry(i % 5 ? .08 : .16, .012, .03).translate(.04, i * .1, 0), m)); post.position.set(1.4, 0, 1.2); scene.add(post); }
let P;
if (VIEW === 'cairn') { P = ringCairn({ sunAlt: alt }, stream('cairn:sliabh')); scene.add(P.group);
  if (Q.has('close')) { cam.position.set(-1.1, 2.4, -.9); cam.lookAt(0, P.ring[1], 0); cam.fov = 35; } else { cam.position.set(-4.5, 2.4, 4.8); cam.lookAt(0, 1.2, 0); }
} else { P = bladeStone({}, stream('blade:dunmore')); scene.add(P.group);
  if (Q.has('close')) { cam.position.set(.9, 1.6, 1.7); cam.lookAt(...P.grip); cam.fov = 40; } else { cam.position.set(2.6, 1.65, 6.2); cam.lookAt(-.4, 1.4, 0); } }
cam.updateProjectionMatrix();
sun.position.copy(SUN).multiplyScalar(40); sun.target.position.set(0, 0, 0); Object.assign(sun.shadow.camera, { left: -8, right: 8, top: 8, bottom: -8, near: .5, far: 100 }); sun.shadow.camera.updateProjectionMatrix();
STATS.prop = { view: VIEW, tris: P.tris, draws: P.draws, top: P.top, grip: P.grip, ring: P.ring, hole: P.hole };
run(makeComposer(R, scene, cam, { bloom: .12, sat: 1.0, vig: .3 }), cam);
