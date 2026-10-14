// The Mark's halls in the new kit (Session 819, a prototype for a DECISION): pieces.js's markHall on a cold ground under a
// low northern sun. ?view=halls (default): the shingle hall (OG-034) and the turf hall (OG-033 and today's game), each with
// and without a porch, beside the 1.8 m post. ?view=lane&mix=shingle|turf|mix: a short lane, all one roof or two in three shingle.
// ?turf=dry|moss (Session 825): the sod's look, the late-season dry turf by default. ?view=roof: a turf hall close, from the lane.
import * as THREE from 'three';
import { Q, W, H, STATS, makeRenderer, makeComposer, buildTextures, mat, worldUV, skyDome, clouds, run } from './common.js';
import { markHall, stream, hashKey } from './pieces.js';
import { loadPack, makePerson, rollGenome } from './people.js';

const R = makeRenderer(.85), scene = new THREE.Scene(), VIEW = Q.get('view') || 'halls', MIX = Q.get('mix') || 'mix', TURF = Q.get('turf') || 'dry';
scene.fog = new THREE.FogExp2(new THREE.Color(.72, .78, .86), .004);
const cam = new THREE.PerspectiveCamera(50, W / H, .1, 30000); buildTextures();
const SUN = new THREE.Vector3(.7, .32, .45).normalize();
const sun = new THREE.DirectionalLight(new THREE.Color(1, .88, .74), 3.4); sun.castShadow = true; sun.shadow.mapSize.set(4096, 4096); sun.shadow.bias = -.0003; sun.shadow.normalBias = .04;
scene.add(sun, sun.target, new THREE.HemisphereLight(new THREE.Color(.62, .7, .86), new THREE.Color(.3, .28, .24), 1.25));
skyDome(scene, SUN, { hor: [.76, .82, .9], mid: [.42, .56, .78], zen: [.16, .28, .55] }); clouds(scene, SUN, { n: 14, d0: 1800, dw: 5000, y0: 260 });
{ const g = new THREE.PlaneGeometry(600, 600); g.rotateX(-Math.PI / 2); worldUV(g, .25); const m = new THREE.Mesh(g, mat('rock', { ns: .8, color: 0xb8bca6, rough: 1 })); m.receiveShadow = true; scene.add(m); }
const STAT = STATS.halls = [], people = [];
const place = (o, key, x, z, ry) => { const h = markHall({ turf: TURF, ...o }, stream(key)); h.group.position.set(x, 0, z); h.group.rotation.y = ry; scene.add(h.group); STAT.push({ roof: o.roof, w: o.w, d: o.d, tris: h.tris, draws: h.draws, top: +h.roofTop.toFixed(2) }); return h; };
if (VIEW === 'halls') {
  const L = [{ roof: 'shingle', w: 6.5, d: 11, porch: true, chimney: false, wall: 0 }, { roof: 'shingle', w: 7.5, d: 13, porch: false, chimney: true, wall: 2 }, { roof: 'turf', w: 6.5, d: 11, porch: true, chimney: false, wall: 1, carve: true }, { roof: 'turf', w: 7.5, d: 13, porch: false, chimney: true, wall: 3 }];
  let x = 0; L.forEach((o, i) => { x += o.w / 2 + (i ? 6.5 : 0); place(o, 'halls:' + i, x, 0, -.35); x += o.w / 2; });
  const mid = x / 2; { const m = new THREE.MeshStandardMaterial({ color: 0x3a3028 }), post = new THREE.Group(); post.add(new THREE.Mesh(new THREE.BoxGeometry(.03, 1.8, .03).translate(0, .9, 0), m)); for (let i = 1; i <= 18; i++) post.add(new THREE.Mesh(new THREE.BoxGeometry(i % 5 ? .08 : .16, .012, .03).translate(.04, i * .1, 0), m)); post.position.set(-2, 0, 7); scene.add(post); }
  cam.fov = 30; cam.updateProjectionMatrix(); cam.position.set(mid + 3, 6, 60); cam.lookAt(mid, 3.8, 0);
  sun.position.set(mid + 60, 40, 50); sun.target.position.set(mid, 0, 0); Object.assign(sun.shadow.camera, { left: -40, right: 40, top: 30, bottom: -30, near: 1, far: 260 }); sun.shadow.camera.updateProjectionMatrix();
  people.push([L[0].w / 2 + 1.2, 7.5, .2, 'mark:a'], [x - L[3].w / 2 - 1, 8, -.3, 'mark:b']);
} else if (VIEW === 'roof') {
  place({ roof: 'turf', w: 7, d: 12, porch: true, chimney: true, wall: 1 }, 'roof:0', 0, 0, -.6); place({ roof: 'shingle', w: 6.5, d: 11, porch: false, chimney: false, wall: 2 }, 'roof:1', 12, -9, -.6);
  cam.fov = 40; cam.updateProjectionMatrix(); cam.position.set(9, 2.2, 13); cam.lookAt(0, 3.6, 0);
  sun.position.set(60, 30, 50); sun.target.position.set(0, 0, 0); Object.assign(sun.shadow.camera, { left: -25, right: 25, top: 20, bottom: -20, near: 1, far: 200 }); sun.shadow.camera.updateProjectionMatrix();
  people.push([5, 6, -.5, 'mark:a']);
} else {
  let i = 0; for (const side of [-1, 1]) { let z = side < 0 ? 0 : -3; for (let k = 0; k < 4; k++, i++) { const r = stream('lane:' + i), roof = MIX === 'mix' ? (hashKey('lane:triple:' + Math.floor(i / 3)) % 3 === i % 3 ? 'turf' : 'shingle') : MIX;
      const o = { roof, w: 6 + r() * 2, d: 10 + r() * 4, porch: r() < .5, chimney: r() < .5 }; z -= o.w / 2; place(o, 'lane:h' + i, side * (4.2 + o.d / 2), z, -side * Math.PI / 2); z -= o.w / 2 + 2.5 + r() * 2; } }
  cam.position.set(-.5, 1.65, 6); cam.lookAt(.5, 3.2, -30);
  sun.position.copy(SUN).multiplyScalar(140).add(new THREE.Vector3(0, 0, -20)); sun.target.position.set(0, 0, -20); Object.assign(sun.shadow.camera, { left: -45, right: 45, top: 45, bottom: -45, near: 1, far: 340 }); sun.shadow.camera.updateProjectionMatrix();
  people.push([-1.4, -4, .3, 'lane:a'], [1.5, -11, 2.9, 'lane:b']);
}
const comp = makeComposer(R, scene, cam, { bloom: .12, sat: .96, vig: .32, warm: [1.02, 1, .96], cool: [.94, .98, 1.06] });
(Q.has('nopeople') ? Promise.reject('nopeople') : loadPack('mh/')).then(() => {
  for (const [x, z, ry, s] of people) { const p = makePerson(rollGenome(s, { people: 'markman' })); p.root.position.set(x, p.root.position.y, z); p.root.rotation.y = ry; scene.add(p.root); }
}).catch(() => {}).finally(() => run(comp, cam));
