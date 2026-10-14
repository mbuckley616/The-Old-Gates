// An Aurenne street in the new kit (Session 816, card F6): pieces.js's houses on a paved lane, laid out by Michael's mix
// (two in three flat, one in three Roman), at eye height under a southern sun, with Aurennais townsfolk for scale when
// the people's pack is there. ?view=street (default) | houses (each kind front-on beside the 1.8 m post); ?street=<seed>.
// Session 832, the Church of the Weaver: ?view=church, a town's church at the head of its square, from the square (&top: its dome and finial close);
// ?view=churches, three side by side (a town's with a blue dome, a town's limewashed, a cathedral); &dome=blue|white.
// Session 833, the civic buildings: ?view=quay, the Compact's tithe house between two warehouses on a quay, from the water;
// ?view=civic, the tithe house and a warehouse front-on beside the 1.8 m post; &crown=plain, the parapet without merlons.
// Session 836: ?view=academy, the Mages' academy and its white towers from its forecourt; &towers=2|3.
import * as THREE from 'three';
import { Q, STILL, W, H, STATS, makeRenderer, makeComposer, buildTextures, mat, worldUV, skyDome, clouds, run } from './common.js';
import { aurenneHouse, aurenneLot, aurenneChurch, aurenneCivic, aurenneAcademy, stream, aurenneTextures } from './pieces.js';
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

const CH = STATS.churches = [], DOME = Q.get('dome');
function church(o, key, x, z, ry) { const c = aurenneChurch(o, stream(key)); c.group.position.set(x, 0, z); c.group.rotation.y = ry; scene.add(c.group); CH.push({ w: o.w, dome: o.dome, tower: o.tower ?? 1, corners: !!o.corners, tris: c.tris, draws: c.draws, domeTop: +c.domeTop.toFixed(2), towerTop: +c.towerTop.toFixed(2), top: +c.roofTop.toFixed(2), door: c.door.h }); return c; }
const CV = STATS.civic = [], CROWN = Q.get('crown') || 'merlons';
function civic(o, key, x, z, ry) { const c = aurenneCivic({ crown: CROWN, ...o }, stream(key)); c.group.position.set(x, 0, z); c.group.rotation.y = ry; scene.add(c.group); CV.push({ kind: c.kind, w: o.w, d: o.d, tris: c.tris, draws: c.draws, top: +c.roofTop.toFixed(2) }); return c; }
if (VIEW === 'academy') {
  { const g = new THREE.PlaneGeometry(600, 600); g.rotateX(-Math.PI / 2); worldUV(g, .3); const m = new THREE.Mesh(g, ground); m.receiveShadow = true; scene.add(m); }
  const a = aurenneAcademy({ w: 30, towers: +(Q.get('towers') || 3) }, stream('academy')); scene.add(a.group); STATS.academy = { tris: a.tris, draws: a.draws, top: +a.roofTop.toFixed(2), towers: a.towerTops };
  cam.fov = 55; cam.updateProjectionMatrix(); cam.position.set(-8, 1.65, 36); cam.lookAt(0, 14, -2);
  sun.position.set(60, 80, 70); sun.target.position.set(0, 0, 0); Object.assign(sun.shadow.camera, { left: -50, right: 50, top: 60, bottom: -50, near: 1, far: 400 }); sun.shadow.camera.updateProjectionMatrix();
  people.push([-3, 14, .3, 'ac:a'], [4, 11, 2.6, 'ac:b']);
} else if (VIEW === 'quay' || VIEW === 'civic') {
  { const g = new THREE.PlaneGeometry(600, 300); g.rotateX(-Math.PI / 2); worldUV(g, .3); const m = new THREE.Mesh(g, ground); m.position.z = VIEW === 'quay' ? -142 : 0; m.receiveShadow = true; scene.add(m); }
  if (VIEW === 'quay') {
    // the quay: a wall of dressed stone down to the water, bollards along its edge, the buildings fronting it 6 m back
    { const wm = mat('ashlar', { ns: 1.1, color: 0xd9c9a8, rough: .9 }), g = new THREE.BoxGeometry(600, 3.2, 1.2); worldUV(g, .5); const q = new THREE.Mesh(g, wm); q.position.set(0, -1.6, 7.4); q.receiveShadow = true; scene.add(q);
      const sea = new THREE.Mesh(new THREE.PlaneGeometry(600, 300).rotateX(-Math.PI / 2), new THREE.MeshStandardMaterial({ color: 0x1f4a5a, roughness: .15, metalness: .2 })); sea.position.set(0, -1.4, 158); scene.add(sea);
      const bm = new THREE.MeshStandardMaterial({ color: 0x2a2724, roughness: .5, metalness: .4 }); for (let x = -40; x <= 40; x += 8) { const b = new THREE.Mesh(new THREE.CylinderGeometry(.18, .24, .7, 10), bm); b.position.set(x, .35, 6.4); b.castShadow = true; scene.add(b); } }
    const t = civic({ kind: 'tithe', w: 22, d: 14 }, 'quay:tithe', 0, -7, 0);
    civic({ kind: 'warehouse', w: 24, d: 11 }, 'quay:w0', -25.5, -5.5, 0); civic({ kind: 'warehouse', w: 20, d: 11 }, 'quay:w1', 23.5, -5.5, 0);
    cam.fov = 50; cam.updateProjectionMatrix(); cam.position.set(-9, 2.2, 30); cam.lookAt(2, 6, -6);
    sun.position.set(70, 80, 60); sun.target.position.set(0, 0, -6); Object.assign(sun.shadow.camera, { left: -60, right: 60, top: 60, bottom: -60, near: 1, far: 400 }); sun.shadow.camera.updateProjectionMatrix();
    people.push([-3, 3, .3, 'q:a'], [4, 1.5, 2.6, 'q:b'], [-14, 2.5, .8, 'q:c']);
  } else {
    let x = 0; [{ kind: 'tithe', w: 20, d: 13 }, { kind: 'warehouse', w: 22, d: 11 }].forEach((o, i) => { x += o.w / 2 + (i ? 6 : 0); civic(o, 'civic:' + i, x, 0, 0); x += o.w / 2; });
    const mid = x / 2; { const m = new THREE.MeshStandardMaterial({ color: 0x5a4a3a, roughness: .8 }), post = new THREE.Group(); post.add(new THREE.Mesh(new THREE.BoxGeometry(.06, 1.8, .06).translate(0, .9, 0), m)); post.position.set(-1.5, 0, 9); scene.add(post); }
    cam.fov = 28; cam.updateProjectionMatrix(); const dist = (x * .5 + 4) / Math.tan(14 * Math.PI / 180) / (W / H); cam.position.set(mid, 5, dist + 8); cam.lookAt(mid, 5.5, 0);
    sun.position.set(mid + 50, 70, 80); sun.target.position.set(mid, 0, 0); Object.assign(sun.shadow.camera, { left: -x * .7, right: x * .7, top: 40, bottom: -40, near: 1, far: 400 }); sun.shadow.camera.updateProjectionMatrix();
    people.push([2, 8, .3, 'cv:a'], [x - 6, 8.5, -.3, 'cv:b']);
  }
} else if (VIEW === 'church' || VIEW === 'churches') {
  { const g = new THREE.PlaneGeometry(600, 600); g.rotateX(-Math.PI / 2); worldUV(g, .3); const m = new THREE.Mesh(g, ground); m.receiveShadow = true; scene.add(m); }
  if (VIEW === 'church') {
    // the square: the church at its head, houses down both sides, a fountain's basin in the middle
    const c = church({ w: 16, dome: DOME || 'blue', tower: 1 }, 'square:church', 0, -34, 0);
    let i = 0; for (const side of [-1, 1]) { let z = -18; for (let k = 0; k < 4; k++) { const lot = aurenneLot('square', i++), { w, d } = lot.o; z += w / 2; place(lot, side * (13 + d / 2), z, side * Math.PI / 2 * -1); z += w / 2 + .2; } }
    { const m = new THREE.MeshStandardMaterial({ color: 0xe8dcc4, roughness: .8 }); const b = new THREE.Mesh(new THREE.CylinderGeometry(2.6, 2.8, .7, 32), m); b.position.set(0, .35, -6); b.castShadow = b.receiveShadow = true; scene.add(b);
      const p = new THREE.Mesh(new THREE.CylinderGeometry(.3, .4, 1.8, 12), m); p.position.set(0, 1.2, -6); p.castShadow = true; scene.add(p); }
    if (Q.has('top')) { cam.fov = 20; cam.updateProjectionMatrix(); cam.position.set(-3, 12, 4); cam.lookAt(0, 22, -34); } else { cam.fov = 58; cam.updateProjectionMatrix(); cam.position.set(-3, 1.65, 12); cam.lookAt(0, 9, -34); }
    sun.position.set(60, 80, 70); sun.target.position.set(0, 0, -20); Object.assign(sun.shadow.camera, { left: -60, right: 60, top: 60, bottom: -60, near: 1, far: 400 }); sun.shadow.camera.updateProjectionMatrix();
    people.push([-2.4, -10, .3, 'sq:a'], [3, -16, 2.6, 'sq:b'], [-.8, -22, .1, 'sq:c']);
  } else {
    const L = [{ w: 14, dome: DOME || 'blue', tower: 1 }, { w: 14, dome: DOME || 'white', tower: 1 }, { w: 20, dome: DOME || 'blue', tower: 2, corners: true }];
    let x = 0; L.forEach((o, i) => { const half = o.w / 2 + 4.6 * (o.tower ? 1 : 0); x += half + (i ? 10 : 0); church(o, 'churches:' + i, x - (o.tower === 1 ? 2.3 : 0), 0, 0); x += half; });
    const mid = x / 2; { const m = new THREE.MeshStandardMaterial({ color: 0x5a4a3a, roughness: .8 }), post = new THREE.Group(); post.add(new THREE.Mesh(new THREE.BoxGeometry(.06, 1.8, .06).translate(0, .9, 0), m)); post.position.set(4, 0, 14); scene.add(post); }
    cam.fov = 30; cam.updateProjectionMatrix(); const dist = (x * .5 + 6) / Math.tan(15 * Math.PI / 180) / (W / H); cam.position.set(mid, 8, dist + 10); cam.lookAt(mid, 12, 0);
    sun.position.set(mid + 60, 80, 90); sun.target.position.set(mid, 0, 0); Object.assign(sun.shadow.camera, { left: -x * .7, right: x * .7, top: 60, bottom: -60, near: 1, far: 500 }); sun.shadow.camera.updateProjectionMatrix();
    people.push([4.8, 13, .3, 'ch:a'], [x - 10, 14, -.3, 'ch:b']);
  }
} else if (VIEW === 'houses') {
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
  for (const [x, z, ry, s] of people) { const p = makePerson(rollGenome(s, { people: 'aurennais' })); p.root.position.set(x, p.root.position.y, z); p.root.rotation.y = ry; scene.add(p.root); STATS.people = (STATS.people || 0) + 1; }
}).catch(() => { STATS.people = 0; }).finally(() => run(comp, cam));
