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
const GOLD = VIEW === 'harbour', SUN = GOLD ? new THREE.Vector3(-.35, .16, .92).normalize() : new THREE.Vector3(.55, .62, .38).normalize();
const sun = new THREE.DirectionalLight(GOLD ? new THREE.Color(1, .72, .46) : new THREE.Color(1, .9, .74), GOLD ? 3.4 : 4.0); sun.castShadow = true; sun.shadow.mapSize.set(4096, 4096); sun.shadow.bias = -.0003; sun.shadow.normalBias = .04;
scene.add(sun, sun.target, new THREE.HemisphereLight(new THREE.Color(.62, .74, .96), new THREE.Color(.55, .45, .32), 1.2));
if (GOLD) { scene.fog.color.setRGB(.86, .70, .62); scene.fog.density = .0016; skyDome(scene, SUN, { hor: [1.0, .66, .46], mid: [.70, .56, .66], zen: [.22, .26, .52], glow: [1, .7, .4], glowK: .6 }); clouds(scene, SUN, { n: 8, d0: 1600, dw: 4000, y0: 260, a0: -.9, aw: 1.8, lo: [.66, .5, .58], hi: [1.4, 1.0, .78] }); }
else { skyDome(scene, SUN, { hor: [.80, .85, .92], mid: [.36, .58, .88] }); clouds(scene, SUN, { n: 10, d0: 1800, dw: 5000, y0: 300 }); }
aurenneTextures(); const ground = mat('limestone', { ns: 1.1, rough: .8 }); // Session 820: Aurenne's own pale limestone (it was the kit's dark flag, lifted past 1)
const STAT = STATS.houses = [];
function place(lot, x, z, ry) { const h = aurenneHouse(lot.o, lot.r); h.group.position.set(x, 0, z); h.group.rotation.y = ry; scene.add(h.group); STAT.push({ kind: h.kind, w: lot.o.w, d: lot.o.d, two: !!lot.o.two, dome: lot.o.dome || null, arcade: !!lot.o.arcade, tris: h.tris, draws: h.draws, roofTop: +h.roofTop.toFixed(2) }); return h; }
const people = []; // [x, z, ry, seed]

const CH = STATS.churches = [], DOME = Q.get('dome');
function church(o, key, x, z, ry) { const c = aurenneChurch(o, stream(key)); c.group.position.set(x, 0, z); c.group.rotation.y = ry; scene.add(c.group); CH.push({ w: o.w, dome: o.dome, tower: o.tower ?? 1, corners: !!o.corners, tris: c.tris, draws: c.draws, domeTop: +c.domeTop.toFixed(2), towerTop: +c.towerTop.toFixed(2), top: +c.roofTop.toFixed(2), door: c.door.h }); return c; }
const CV = STATS.civic = [], CROWN = Q.get('crown') || 'merlons';
function civic(o, key, x, z, ry) { const c = aurenneCivic({ crown: CROWN, ...o }, stream(key)); c.group.position.set(x, 0, z); c.group.rotation.y = ry; scene.add(c.group); CV.push({ kind: c.kind, w: o.w, d: o.d, tris: c.tris, draws: c.draws, top: +c.roofTop.toFixed(2) }); return c; }
if (VIEW === 'harbour') {
  // Session 2725: an Aurenne harbour town from the water at 17h30, about 150 m out and 8 m up, as the look's shot list frames it
  // (docs/art/shotlist.json, aurenne-harbour, against P10b's Golden Hour). &opt=a: as the game builds a port today, houses of one and
  // two storeys by Michael's mix on flat ground; b: the same lots, the storeys rising toward the town's middle (three in the core),
  // a belvedere on one flat roof in four; c: b on a hill, each row back 4.2 m above the one before it on a terrace wall.
  const OPT = Q.get('opt') || 'b', rise = OPT === 'c' ? 4.2 : 0, H_ = STATS.harbour = { opt: OPT, lots: 0, storeys: [0, 0, 0, 0], belvederes: 0, tris: 0, top: 0 };
  const wm = mat('ashlar', { ns: 1.1, color: 0xd9c9a8, rough: .9 });
  { const g = new THREE.BoxGeometry(260, 3.2, 1.2); worldUV(g, .5); const q = new THREE.Mesh(g, wm); q.position.set(0, -1.6, 7.4); q.receiveShadow = true; scene.add(q); }
  { const sea = new THREE.Mesh(new THREE.PlaneGeometry(4000, 2000).rotateX(-Math.PI / 2), new THREE.MeshStandardMaterial({ color: 0x2c7a86, emissive: 0x0c2a34, roughness: .32, metalness: .05 })); sea.position.set(0, -1.4, 1008); scene.add(sea); }
  // the ground: one flat apron, or (c) a terrace a row, its retaining wall in the quay's stone
  const ROWS = 5, rowZ = k => -6 - k * 14, rowY = k => k * rise;
  const rowW = k => 2 * (62 - Math.max(1, k) * 7) + 24;
  for (let k = -1; k < ROWS + 1; k++) { const z0 = k < 0 ? 7.4 : rowZ(k) + 7, z1 = rowZ(k + 1) + 7, y = Math.max(0, rowY(k)), g = new THREE.PlaneGeometry(k < 1 ? 260 : rowW(k), z0 - z1); g.rotateX(-Math.PI / 2); worldUV(g, .3); const m = new THREE.Mesh(g, ground); m.position.set(0, y, (z0 + z1) / 2); m.receiveShadow = true; scene.add(m);
    if (rise && k >= 1) { const b = new THREE.BoxGeometry(rowW(k), y, 1); worldUV(b, .5); const wl = new THREE.Mesh(b, wm); wl.position.set(0, y / 2, z0 - .5); wl.receiveShadow = wl.castShadow = true; scene.add(wl); } }
  { const g = new THREE.PlaneGeometry(1400, 1400, 70, 70); g.rotateX(-Math.PI / 2); const P = g.attributes.position, zt = rowZ(ROWS) + 7;
    // the land round the town: flat scrub at the apron's height (a, b), or (c) a hillside whose slope carries on above the top row and falls to the shore on either side
    for (let i = 0; i < P.count; i++) { const x = P.getX(i), z = P.getZ(i) - 400 + 7; let y = -.08; if (rise) { const up = Math.max(0, -z + 6) / 14 * rise, side = Math.max(0, Math.abs(x) - (62 - Math.min(ROWS, Math.max(1, (-z - 6) / 14)) * 7) - 14); y = Math.max(-.08, up - side * .22 - (z > zt ? 1 : 0) * 2); } if (z > 7.6) y = -6; P.setY(i, y); }
    g.computeVertexNormals(); const m = new THREE.Mesh(g, new THREE.MeshStandardMaterial({ color: 0x6f7a4a, roughness: 1 })); m.position.set(0, -.02, -400 + 7); m.receiveShadow = true; scene.add(m); }
  // the quay's front: the tithe house between two warehouses, as the game's port lays its quay
  civic({ kind: 'tithe', w: 20, d: 13 }, 'hb:tithe', 0, -6.5, 0); civic({ kind: 'warehouse', w: 22, d: 11 }, 'hb:w0', -27, -5.5, 0); civic({ kind: 'warehouse', w: 18, d: 11 }, 'hb:w1', 25, -5.5, 0);
  // the church on the second row, a little east of the middle
  const chX = 14, chRow = 2; { const c = church({ w: 16, rank: 'town', tower: 1 }, 'hb:church', chX, 0, 0); c.group.position.set(chX, rowY(chRow), rowZ(chRow) - 4); }
  // the rows of houses, fronts to the sea, narrowing up the town; each lot's storeys by the option
  let n = 0;
  for (let k = 1; k <= ROWS; k++) { const half = 62 - k * 7; let x = -half;
    while (x < half) { const lot = aurenneLot('harbour', n++), o = lot.o, w = o.w; if (x + w > half) break;
      const cx = x + w / 2; x += w + .3 + (lot.r() < .2 ? 3.2 : 0);
      if (k === chRow && Math.abs(cx - chX) < 15) continue;
      const core = Math.hypot(cx / 1.6, (k - 1.5) * 14), rr = lot.r();
      if (OPT !== 'a') { o.storeys = core < 26 ? (rr < .7 ? 3 : 2) : core < 48 ? (rr < .75 ? 2 : 1) : (rr < .4 ? 2 : 1); o.two = o.storeys > 1; if (o.storeys > 1) o.stair = false;
        o.belvedere = o.kind === 'flat' && !o.dome && lot.r() < (core < 40 ? .35 : .15); if (o.belvedere) o.pergola = false; }
      place(lot, cx, rowZ(k) - o.d / 2 + (o.arcade ? -1.8 : 0), 0); const h = scene.children[scene.children.length - 1]; h.position.y = rowY(k);
      H_.lots++; H_.storeys[o.storeys ?? (o.two ? 2 : 1)]++; if (o.belvedere) H_.belvederes++; } }
  H_.tris = STAT.reduce((a, s) => a + s.tris, 0); H_.top = +Math.max(...STAT.map(s => s.roofTop + 0)).toFixed(1);
  cam.fov = 50; cam.updateProjectionMatrix(); if (Q.has('near')) { cam.position.set(-24, 4, 70); cam.lookAt(0, 9 + rise * 2, -30); } else { cam.position.set(-40, 8, 150); cam.lookAt(0, 9 + rise * 1.5, -30); }
  sun.position.copy(SUN).multiplyScalar(220).add(new THREE.Vector3(0, 0, -30)); sun.target.position.set(0, 0, -30); Object.assign(sun.shadow.camera, { left: -110, right: 110, top: 110, bottom: -110, near: 1, far: 600 }); sun.shadow.camera.updateProjectionMatrix();
} else if (VIEW === 'academy') {
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
    const c = church({ w: 16, rank: 'town', dome: DOME || undefined, tower: 1 }, 'square:church', 0, -34, 0);
    let i = 0; for (const side of [-1, 1]) { let z = -18; for (let k = 0; k < 4; k++) { const lot = aurenneLot('square', i++), { w, d } = lot.o; z += w / 2; place(lot, side * (13 + d / 2), z, side * Math.PI / 2 * -1); z += w / 2 + .2; } }
    { const m = new THREE.MeshStandardMaterial({ color: 0xe8dcc4, roughness: .8 }); const b = new THREE.Mesh(new THREE.CylinderGeometry(2.6, 2.8, .7, 32), m); b.position.set(0, .35, -6); b.castShadow = b.receiveShadow = true; scene.add(b);
      const p = new THREE.Mesh(new THREE.CylinderGeometry(.3, .4, 1.8, 12), m); p.position.set(0, 1.2, -6); p.castShadow = true; scene.add(p); }
    if (Q.has('top')) { cam.fov = 20; cam.updateProjectionMatrix(); cam.position.set(-3, 12, 4); cam.lookAt(0, 22, -34); } else { cam.fov = 58; cam.updateProjectionMatrix(); cam.position.set(-3, 1.65, 12); cam.lookAt(0, 9, -34); }
    sun.position.set(60, 80, 70); sun.target.position.set(0, 0, -20); Object.assign(sun.shadow.camera, { left: -60, right: 60, top: 60, bottom: -60, near: 1, far: 400 }); sun.shadow.camera.updateProjectionMatrix();
    people.push([-2.4, -10, .3, 'sq:a'], [3, -16, 2.6, 'sq:b'], [-.8, -22, .1, 'sq:c']);
  } else {
    const L = [{ w: 12, rank: 'village', dome: DOME || undefined, tower: 1 }, { w: 14, rank: 'town', dome: DOME || undefined, tower: 1 }, { w: 20, rank: 'cathedral', dome: DOME || undefined, tower: 2, corners: true }] /* by rank (#294 C): a village's, a town's, the cathedral */;
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
