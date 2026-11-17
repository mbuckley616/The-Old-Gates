// The festivals' contest grounds on a meadow (the look builder, Session 2317; contests.js): Riverfair's butts down a lane 76 m long,
// the butt of the end being shot (&end=0|1|2: 30, 50 or 70 m, as the game moves one butt back; &all stands all three) with its bales,
// a peg at every range, the mark at the lane's head; and to the side the Strait Fair's ring. ?cam=lane|butt|mark|scale|ring|high or x,y,z,tx,ty,tz.
import * as THREE from 'three';
import { Q, W, H, STILL, STATS, makeRenderer, makeComposer, buildTextures, mat, worldUV, skyDome, clouds, treeKit, run, reseed, rnd } from './common.js';
import { shrineTextures } from './shrines.js';
import { BUTT, RING, build, tris } from './contests.js';

const CAM = Q.get('cam') || 'lane', ONE = !Q.has('all'), END = Math.min(2, Math.max(0, +(Q.get('end') || 0)));
const R = makeRenderer(.84), scene = new THREE.Scene(); buildTextures(); shrineTextures(); reseed(17);
const SUN = new THREE.Vector3(-.35, .8, .5).normalize();
scene.fog = new THREE.FogExp2(new THREE.Color(.8, .82, .86), .004);
const cam = new THREE.PerspectiveCamera(46, W / H, .02, 30000);
const sun = new THREE.DirectionalLight(new THREE.Color(1, .92, .78), 3.2); sun.castShadow = true; sun.shadow.mapSize.set(4096, 4096); sun.shadow.bias = -.0002; sun.shadow.normalBias = .01;
scene.add(sun, sun.target, new THREE.HemisphereLight(new THREE.Color(.64, .72, .9), new THREE.Color(.36, .32, .24), 1.1));
skyDome(scene, SUN, {}); clouds(scene, SUN, { n: 12, d0: 1800, dw: 5000, y0: 300 });
const V = (x, y, z) => new THREE.Vector3(x, y, z);
// the shadow box follows the view: the lane is long, so the box sits on what the camera looks at
const shadowAt = (c, r) => { sun.position.copy(SUN).multiplyScalar(90).add(c); sun.target.position.copy(c); Object.assign(sun.shadow.camera, { left: -r, right: r, top: r, bottom: -r, near: .5, far: 240 }); sun.shadow.camera.updateProjectionMatrix(); };

// ——— the meadow; the lane mown along -z from the mark at the origin
const grassM = mat('grass', { ns: 1, rough: 1 }), mownM = mat('grass', { ns: .8, color: 0xd8e0b0, rough: 1 });
const plane = (w, d, m, x, z, y = 0) => { const g = new THREE.PlaneGeometry(w, d); g.rotateX(-Math.PI / 2); worldUV(g, .5); const o = new THREE.Mesh(g, m); o.position.set(x, y, z); o.receiveShadow = true; scene.add(o); return o; };
plane(400, 400, grassM, 0, -40); plane(5, 78, mownM, 0, -36, .003);
// trees at the meadow's edge, beyond the lane's end and down its west side
const trees = []; for (let i = 0; i < 18; i++) trees.push([-30 + i * 4 + rnd() * 2, 0, -98 - rnd() * 8, .8 + (i % 3) * .1, i, new THREE.Color(.95, 1, .7)]);
for (let i = 0; i < 10; i++) trees.push([-16 - rnd() * 4, 0, -10 - i * 8, .75, i + 30, new THREE.Color(.9, 1, .7)]);
treeKit(SUN).plant(scene, trees);

const PROP = []; const put = (key, at, ry = 0, ...a) => { const t = build(key, ...a); t.g.position.copy(at); t.g.rotation.y = ry; scene.add(t.g); t.g.updateMatrixWorld(true); PROP.push({ key, tris: t.tris }); return t; };
// the lane: the butt faces back up the lane (+z); its face's middle is BUTT.y up at (0, -D)
put('mark', V(0, 0, 0));
const faces = [];
BUTT.ends.forEach((D, i) => { put('peg', V(1.6, 0, -D + .3), 0, D); if (ONE && i !== END) return; const t = put('butt', V(0, 0, -D)); put('bales', V(0, 0, -D - 1.6)); const c = new THREE.Vector3(...t.face.c).applyMatrix4(t.g.matrixWorld); faces.push({ D, c: c.toArray().map(v => +v.toFixed(3)) }); });
// the ring 14 m east of the lane's head
const RC = V(14, 0, -6); put('ring', RC, .3);

// ——— the cameras
const CAMS = { lane: [[-.6, 1.62, 2.2], [0, 1.0, -40]], mark: [[2.4, 1.3, 2.6], [0, .7, -.4]], butt: [[1.6, 1.5, -26.5 - BUTT.ends[END] + 30], [0, 1.15, -BUTT.ends[END]]], scale: [[3.2, 1.1, -27 - BUTT.ends[END] + 30], [0, 1.0, -BUTT.ends[END]]],
  ring: [[RC.x + 4, 3.6, RC.z + 10], [RC.x, .6, RC.z]], high: [[24, 30, 20], [4, 0, -28]] };
let c = CAMS[CAM] || CAMS.lane; if (CAM.includes(',')) { const n = CAM.split(',').map(Number); c = [n.slice(0, 3), n.slice(3)]; }
cam.position.set(...c[0]); cam.lookAt(...c[1]); cam.fov = CAM === 'lane' ? 40 : CAM === 'high' ? 44 : 42; cam.updateProjectionMatrix();
shadowAt(CAM === 'ring' ? RC : CAM === 'high' || CAM === 'lane' ? V(2, 0, -32) : V(0, 0, -BUTT.ends[END]), CAM === 'high' || CAM === 'lane' ? 48 : 14);
if (CAM === 'scale') { const post = new THREE.Group(), m = new THREE.MeshStandardMaterial({ color: 0x3a3028 }); post.add(new THREE.Mesh(new THREE.BoxGeometry(.03, 1.8, .03).translate(0, .9, 0), m));
  for (let i = 1; i <= 18; i++) post.add(new THREE.Mesh(new THREE.BoxGeometry(i % 5 ? .08 : .16, .012, .03).translate(.04, i * .1, 0), m)); post.traverse(o => o.castShadow = true);
  post.position.set(1.0, 0, -BUTT.ends[END] + .4); scene.add(post); }

const comp = makeComposer(R, scene, cam, { bloom: .18, bloomT: .9, sat: 1.06, vig: .28 });
R.info.autoReset = !STILL;
STATS.props = PROP; STATS.faces = faces;
R.info.reset(); run(comp, cam); STATS.tris = R.info.render.triangles; STATS.calls = R.info.render.calls;
