// An Aurenne street in the new kit (Session 816, card F6): pieces.js's houses on a paved lane, laid out by Michael's mix
// (two in three flat, one in three Roman), at eye height under a southern sun, with Aurennais townsfolk for scale when
// the people's pack is there. ?view=street (default) | houses (each kind front-on beside the 1.8 m post); ?street=<seed>.
import * as THREE from 'three';
import { Q, STILL, W, H, STATS, makeRenderer, makeComposer, buildTextures, mat, worldUV, skyDome, clouds, run } from './common.js';
import { aurenneHouse, aurenneLot, stream, aurenneTextures } from './pieces.js';
import { loadPack, makePerson, rollGenome } from './people.js';

const R = makeRenderer(.82), scene = new THREE.Scene(), VIEW = Q.get('view') || 'street', STREET = Q.get('street') || 'aurenne-street';
scene.fog = new THREE.FogExp2(new THREE.Color(.80, .84, .90), .0028);
const cam = new THREE.PerspectiveCamera(52, W / H, .1, 30000);
buildTextures();
const SUN = new THREE.Vector3(.55, .62, .38).normalize();
const sun = new THREE.DirectionalLight(new THREE.Color(1, .9, .74), 4.0); sun.castShadow = true; sun.shadow.mapSize.set(4096, 4096); sun.shadow.bias = -.0003; sun.shadow.normalBias = .04;
scene.add(sun, sun.target, new THREE.HemisphereLight(new THREE.Color(.62, .74, .96), new THREE.Color(.55, .45, .32), 1.2));
skyDome(scene, SUN, { hor: [.80, .85, .92], mid: [.36, .58, .88] }); clouds(scene, SUN, { n: 10, d0: 1800, dw: 5000, y0: 300 });
aurenneTextures(); const ground = mat('limestone', { ns: 1.1, rough: .8 }); // Session 820: Aurenne's own pale limestone (it was the kit's dark flag, lifted past 1)
const STAT = STATS.houses = [];
function place(lot, x, z, ry) { const h = aurenneHouse(lot.o, lot.r); h.group.position.set(x, 0, z); h.group.rotation.y = ry; scene.add(h.group); STAT.push({ kind: h.kind, w: lot.o.w, d: lot.o.d, two: !!lot.o.two, dome: lot.o.dome || null, arcade: !!lot.o.arcade, tris: h.tris, draws: h.draws, roofTop: +h.roofTop.toFixed(2) }); return h; }
const people = []; // [x, z, ry, seed]

if (VIEW === 'houses') {
  // each kind, front-on, in a row over a paved floor, the post beside the first
  const KINDS = [{ kind: 'flat', w: 7, d: 6.5, stair: true }, { kind: 'flat', w: 7.6, d: 7, two: true, lattice: true, pergola: true }, { kind: 'flat', w: 8.6, d: 7.4, dome: 'blue', pergola: true },
    { kind: 'flat', w: 8.6, d: 7, two: true, dome: 'white', pointed: true }, { kind: 'tile', w: 7, d: 6.4 }, { kind: 'tile', w: 8.8, d: 7.2, two: true, arcade: true }];
  let x = 0; const xs = [];
  KINDS.forEach((o, i) => { const lot = { o: { wall: i % 5, door: i % 5, ...o }, r: stream('houses:' + i) }; x += o.w / 2 + (i ? 2.6 : 0); xs.push(x); place(lot, x, 0, 0); x += o.w / 2 + (o.stair ? 1 : 0); });
  const span = x, mid = span / 2; { const g = new THREE.PlaneGeometry(span + 400, 400); g.rotateX(-Math.PI / 2); worldUV(g, .3); const m = new THREE.Mesh(g, ground); m.position.set(mid, 0, 0); m.receiveShadow = true; scene.add(m); }
  { const m = new THREE.MeshStandardMaterial({ color: 0x5a4a3a, roughness: .8 }), post = new THREE.Group(); post.add(new THREE.Mesh(new THREE.BoxGeometry(.03, 1.8, .03).translate(0, .9, 0), m));
    for (let i = 1; i <= 18; i++) post.add(new THREE.Mesh(new THREE.BoxGeometry(i % 5 ? .08 : .16, .012, .03).translate(.04, i * .1, 0), m)); post.position.set(-.8, 0, 4.2); scene.add(post); }
  cam.fov = 26; cam.updateProjectionMatrix(); const dist = (span * .5 + 3) / Math.tan(13 * Math.PI / 180) / (W / H);
  cam.position.set(mid, 4.5, dist * 1.02 + 2); cam.lookAt(mid, 3.4, 0);
  sun.position.set(mid + 40, 60, 70); sun.target.position.set(mid, 0, 0); Object.assign(sun.shadow.camera, { left: -span * .7, right: span * .7, top: 30, bottom: -30, near: 1, far: 260 }); sun.shadow.camera.updateProjectionMatrix();
  people.push([xs[0] + 1.6, 4.0, .3, 'houses:a'], [xs[4] - 1.4, 4.4, -.2, 'houses:b']);
} else {
  // the lane: lots down both sides, fronts to the paving, a little stagger in the building line
  { const g = new THREE.PlaneGeometry(400, 400); g.rotateX(-Math.PI / 2); worldUV(g, .3); const m = new THREE.Mesh(g, ground); m.receiveShadow = true; scene.add(m); }
  const lane = 3.4; let i = 0;
  for (const side of [-1, 1]) { let z = side < 0 ? 2 : 0; for (let k = 0; k < 6; k++) { const lot = aurenneLot(STREET, i++), { w, d } = lot.o, extra = lot.o.arcade ? 2.4 : 0, x = side * (lane + d / 2 + extra + (lot.r() - .5) * .3);
      z -= w / 2 + (lot.o.stair ? 1 : 0); place(lot, x, z, -side * Math.PI / 2); z -= w / 2 + .15; } }
  cam.position.set(-.6, 1.65, 6); cam.lookAt(.2, 2.6, -30);
  sun.position.copy(SUN).multiplyScalar(140).add(new THREE.Vector3(0, 0, -20)); sun.target.position.set(0, 0, -20); Object.assign(sun.shadow.camera, { left: -45, right: 45, top: 45, bottom: -45, near: 1, far: 340 }); sun.shadow.camera.updateProjectionMatrix();
  people.push([-1.6, -3, .4, 'st:a'], [1.2, -7.5, 2.8, 'st:b'], [-.6, -14, .1, 'st:c'], [1.9, -19, 3.4, 'st:d']);
}
STATS.lotKinds = STAT.map(s => s.kind).join('');
const comp = makeComposer(R, scene, cam, { bloom: .12, sat: 1.04, vig: .32, warm: [1.06, 1.0, .92], cool: [.96, .99, 1.04] });
// Aurennais for scale, if the pack is there (python3 mh_pack.py); the street stands without them
(Q.has('nopeople') ? Promise.reject('nopeople') : loadPack('mh/')).then(() => {
  for (const [x, z, ry, s] of people) { const p = makePerson(rollGenome(s, { people: 'aurennais' })); p.root.position.set(x, 0, z); p.root.rotation.y = ry; scene.add(p.root); STATS.people = (STATS.people || 0) + 1; }
}).catch(() => { STATS.people = 0; }).finally(() => run(comp, cam));
