// The page of gatekit.js (Session 1097): the gates' pieces in their three conditions, inside a gate (dark, the script and a few
// lamps for light, one cold shaft from above).
// ?view=kit (default): the eight pieces in rows, whole, cracked and broken left to right, a 1.8 m figure at each;
// ?view=piece&piece=slab|wall|arch|pier|stair|bridge|balcony|panel: one piece three ways, from the eye;
// ?view=hall: a nave 26 m wide of six bays, its piers, arcades and floor whole in the first two bays, cracked in the next two,
//   broken in the last two, a stair and a script panel at the far end (visual-foundation.md §2's nave, built from the kit).
// &school=cloch (default) | tine | uisce | scath | solas | gaoth dresses the stone and the light.
import * as THREE from 'three';
import { Q, W, H, STATS, makeRenderer, makeComposer, buildTextures, mat, run } from './common.js';
import { gatePiece, GK_KINDS, GK_CONDS, GK_SCHOOLS } from './gatekit.js';

const VIEW = Q.get('view') || 'kit', SCHOOL = GK_SCHOOLS[Q.get('school')] ? Q.get('school') : 'cloch', PIECE = GK_KINDS.includes(Q.get('piece')) ? Q.get('piece') : 'wall';
const R = makeRenderer(1.0), scene = new THREE.Scene(), cam = new THREE.PerspectiveCamera(VIEW === 'kit' ? 46 : 60, W / H, .1, 4000);
buildTextures(); scene.background = new THREE.Color(.018, .016, .02); scene.fog = new THREE.FogExp2(new THREE.Color(.03, .028, .032), VIEW === 'hall' ? .009 : .006);
scene.add(new THREE.HemisphereLight(new THREE.Color(.36, .38, .46), new THREE.Color(.12, .10, .09), VIEW === 'hall' ? 1.0 : 1.6));
const shaft = new THREE.DirectionalLight(new THREE.Color(.78, .84, 1), 2.2); shaft.position.set(-30, 80, 40); shaft.castShadow = true; shaft.shadow.mapSize.set(4096, 4096);
Object.assign(shaft.shadow.camera, { left: -90, right: 90, top: 90, bottom: -90, near: 1, far: 300 }); shaft.shadow.bias = -.0004; shaft.shadow.normalBias = .05; scene.add(shaft, shaft.target);
const BUILT = {}, figures = [];
function put(g, x, z, ry = 0, y = 0) { g.position.set(x, y, z); g.rotation.y = ry; scene.add(g); const u = g.userData; (BUILT[u.kind] ||= {})[u.cond] = { tris: u.tris, calls: u.calls, floating: u.floating, fallen: u.fallen, seams: u.seams, cracks: u.cracks, lean: u.lean }; return g; }
// the scale figure: a 1.8 m standing person in plain dark cloth (the people's pack is not in the checkout)
const FIG = new THREE.MeshStandardMaterial({ color: new THREE.Color(.16, .14, .13), roughness: .9 });
function figure(x, z, ry = 0) { const g = new THREE.Group(), add = (geo, y) => { const m = new THREE.Mesh(geo, FIG); m.position.y = y; m.castShadow = true; g.add(m); };
  add(new THREE.CylinderGeometry(.17, .14, .82, 10), .41); add(new THREE.CylinderGeometry(.21, .17, .62, 10), 1.12); add(new THREE.SphereGeometry(.12, 12, 10), 1.67); add(new THREE.CylinderGeometry(.06, .06, .1, 8), 1.48);
  g.position.set(x, 0, z); g.rotation.y = ry; scene.add(g); figures.push(g); }
const lamp = (x, y, z, c, k = 6, d = 22) => { const l = new THREE.PointLight(new THREE.Color(...c), k, d, 1.6); l.position.set(x, y, z); scene.add(l); };
const floor = (w, d, x, z) => { const g = new THREE.PlaneGeometry(w, d); g.rotateX(-Math.PI / 2); const uv = g.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * w * .2, uv.getY(i) * d * .2);
  const m = new THREE.Mesh(g, mat('slab', { ns: .8, color: new THREE.Color(...GK_SCHOOLS[SCHOOL].stone).multiplyScalar(.6), rough: .45 })); m.position.set(x, -.62, z); m.receiveShadow = true; scene.add(m); };
const glow = c => c === 'broken' ? [.62, .30, 1.0] : GK_SCHOOLS[SCHOOL].glow;

if (VIEW === 'kit') { // rows of pieces, the conditions left to right
  const dx = 26, rows = GK_KINDS; let z = 0; floor(120, rows.length * 24 + 40, 0, -rows.length * 12 + 10);
  rows.forEach((k, i) => { const zz = -i * 24; GK_CONDS.forEach((c, j) => { const x = (j - 1) * dx; put(gatePiece(k, { cond: c, school: SCHOOL }), x, zz); figure(x + 6.5, zz + 4, -.4); lamp(x, 7, zz + 8, glow(c), 5, 26); }); });
  cam.position.set(0, 70, 64); cam.lookAt(0, 0, -64);
} else if (VIEW === 'piece') {
  const dx = PIECE === 'bridge' ? 24 : PIECE === 'arch' ? 22 : 18; floor(120, 80, 0, -10);
  GK_CONDS.forEach((c, j) => { const x = (j - 1) * dx; put(gatePiece(PIECE, { cond: c, school: SCHOOL }), x, 0); figure(x + (PIECE === 'pier' ? 3.6 : 4.2), 3.2, -.3); lamp(x - 3, 5, 7, glow(c), 7, 30); });
  const hgt = { slab: 4, wall: 7, arch: 9, pier: 10, stair: 4, bridge: 5, balcony: 5, panel: 4 }[PIECE], far = { slab: 34, wall: 46, arch: 54, pier: 50, stair: 34, bridge: 56, balcony: 40, panel: 30 }[PIECE];
  cam.position.set(4, 1.65 + (PIECE === 'slab' ? 6 : 0), far); cam.lookAt(0, hgt, 0);
} else { // the nave: piers every 14 m either side of a floor 26 m wide, an arcade between them, six bays
  const bays = 6, pitch = 14, half = 13 + 2.45, cond = i => GK_CONDS[Math.floor(i / 2)]; floor(80, bays * pitch + 60, 0, -bays * pitch / 2);
  for (let i = 0; i <= bays; i++) { const z = -i * pitch, c = cond(Math.min(bays - 1, i)); for (const sx of [-1, 1]) put(gatePiece('pier', { cond: c, school: SCHOOL, key: `hall:pier:${sx}:${i}` }), sx * half, z); }
  for (let i = 0; i < bays; i++) { const z = -(i + .5) * pitch, c = cond(i);
    for (const sx of [-1, 1]) put(gatePiece('arch', { cond: c, school: SCHOOL, key: `hall:arch:${sx}:${i}` }), sx * half, z, Math.PI / 2);
    for (let a = 0; a < 3; a++) for (let b = 0; b < 2; b++) put(gatePiece('slab', { cond: c, school: SCHOOL, key: `hall:slab:${i}:${a}:${b}` }), (a - 1) * 7.5, z + (b - .5) * 7, 0, -.02);
    lamp(0, 6, z, glow(c), 9, 34); }
  put(gatePiece('stair', { cond: 'broken', school: SCHOOL, key: 'hall:stair' }), 0, -bays * pitch - 4); put(gatePiece('panel', { cond: 'broken', school: SCHOOL, key: 'hall:panel' }), -6, -bays * pitch - 10);
  figure(1.2, -2, Math.PI); figure(-2.4, -30, Math.PI * .9); figure(2, -58, Math.PI * 1.1);
  cam.position.set(2.5, 1.65, 12); cam.lookAt(0, 6, -60);
}
STATS.view = VIEW; STATS.school = SCHOOL; STATS.plans = BUILT; STATS.figures = figures.length;
let tris = 0; scene.traverse(m => { if (m.isMesh) tris += (m.geometry.index ? m.geometry.index.count : m.geometry.attributes.position.count) / 3; }); STATS.tris = Math.round(tris);
const comp = makeComposer(R, scene, cam, { bloom: .5, bloomR: .5, bloomT: .6, sat: 1.04 }); run(comp, cam);
