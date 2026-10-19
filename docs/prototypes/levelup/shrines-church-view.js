// The six gods' row at the town church (Session 1172, backlog L9, OG-113; Michael's C on #439 and his note on it: "Would it make sense
// to have the rows in or near churches?"). The Gatelands' town church with its west tower (#410 B, pieces.js's gatelandsChurch, three
// bays) on its plot as the town lays it out (#433 B, S1138): end-on to the square, its tower's face 13.7 m from the town's heart, its
// flank on the main street, a yard of 2 m beside it (away from the street) and 3 m behind the chancel. shrines.js's Gatelands row of
// seven stands at it one of three ways:
// ?place=back (A, default): in the yard behind the chancel, facing the east window, in the plot as it is laid now.
//   place=side (B): along the yard's long side, facing the nave's flank, the yard widened from 2 to 4.5 m; the path from the gate runs past it.
//   place=square (C): on the square beside the tower door, free-standing, with its own wall, well, thorn, cross and ring-stone (the
//   wayside dressing of the concept artist's page); the plot as it is.
//   place=all: the three side by side, 70 m apart, from above.
// &cam=arrive (default; from the square by the town's heart, at the eye) | gate (at the yard's gate) | row (at the row) | high.
// &nopeople leaves the people out. &cam=x,y,z,tx,ty,tz anywhere.
import * as THREE from 'three';
import { Q, W, H, STATS, makeRenderer, makeComposer, buildTextures, mat, worldUV, skyDome, clouds, treeKit, run, reseed } from './common.js';
import { loadPack, makePerson, rollGenome, statureOf } from './people.js';
import { NICHE, row, shrineTextures } from './shrines.js';
import { glMats, gatelandsBuilding as building, GL_PLANS as PLANS, gatelandsChurch } from './pieces.js';

const PLACE = Q.get('place') || 'back', CAM = Q.get('cam') || (PLACE === 'all' ? 'high' : 'arrive'), ALL = PLACE === 'all';
const R = makeRenderer(.82), scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(new THREE.Color(.74, .8, .88), ALL || CAM === 'high' ? .0012 : .0035);
const cam = new THREE.PerspectiveCamera(52, W / H, .05, 30000); buildTextures(); glMats(); shrineTextures(); reseed(23);
const SUN = new THREE.Vector3(-.42, .58, .7).normalize();
const sun = new THREE.DirectionalLight(new THREE.Color(1, .9, .76), 3.4); sun.castShadow = true; sun.shadow.mapSize.set(4096, 4096); sun.shadow.bias = -.0003; sun.shadow.normalBias = .03;
scene.add(sun, sun.target, new THREE.HemisphereLight(new THREE.Color(.62, .72, .9), new THREE.Color(.4, .34, .26), 1.2));
skyDome(scene, SUN); clouds(scene, SUN, { n: 16, d0: 1600, dw: 5000, y0: 280 });
const sunBox = (cx, cz, half) => { sun.position.copy(SUN).multiplyScalar(120).add(new THREE.Vector3(cx, 0, cz)); sun.target.position.set(cx, 0, cz); Object.assign(sun.shadow.camera, { left: -half, right: half, top: half, bottom: -half, near: 1, far: 300 }); sun.shadow.camera.updateProjectionMatrix(); };

const grassM = mat('grass', { ns: 1, rough: 1 }), flagM = mat('cobble', { ns: .7, color: 0xe2d8c6, rough: .95 }), cobM = mat('cobble', { ns: .8, color: 0xa89a86, rough: .95 }), gravel = mat('rock', { ns: .5, color: 0xc4b8a2, rough: 1 });
const stoneM = mat('stone', { ns: 1.2, color: 0xe6e2d8, rough: .95 }), limeM = new THREE.MeshStandardMaterial({ color: 0xeeebe2, roughness: .95 }), slabM = mat('slab', { ns: 1.4, color: 0x9a968c, rough: 1 }), ashM = mat('ashlar', { ns: 1, color: 0xb8ae9a, rough: .9 });
const ground = (w, d, m, x, z, y = 0, uv = .5) => { const g = new THREE.PlaneGeometry(w, d); g.rotateX(-Math.PI / 2); worldUV(g, uv); const o = new THREE.Mesh(g, m); o.position.set(x, y, z); o.receiveShadow = true; scene.add(o); return o; };
const blk = (m, x0, x1, y0, y1, z0, z1) => { const g = new THREE.BoxGeometry(x1 - x0, y1 - y0, z1 - z0); worldUV(g, .6); const o = new THREE.Mesh(g, m); o.position.set((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2); o.castShadow = o.receiveShadow = true; scene.add(o); return o; };
const put = (g, x, z, ry = 0) => { g.position.set(x, 0, z); g.rotation.y = ry; g.traverse(o => { if (o.isMesh) o.castShadow = o.receiveShadow = true; }); scene.add(g); return g; };
const TK = treeKit(SUN), trees = [], people = [], OUT = STATS.places = [];

// the church's plot, as S1138 lays it (the church's frame: the nave along x about the origin, the tower's west face at x = -13.1, the
// main street along +z, 2.8 m off the nave's flank): x from the tower's face to 3 m past the chancel's gable, z from the street side to
// the yard's edge
const TOWER = -13.1, CHANCEL = 14.3, STREET_Z = 7.0, HEART = [TOWER - Math.sqrt(14 * 14 - 2.8 * 2.8), STREET_Z];
// a limewashed drystone wall of 0.9 m with its lime coping, from (x0, z0) to (x1, z1) along x or z
function wall(x0, z0, x1, z1) { const t = .3; if (z0 === z1) { blk(stoneM, Math.min(x0, x1), Math.max(x0, x1), 0, .9, z0 - t, z0 + t); blk(limeM, Math.min(x0, x1) - .03, Math.max(x0, x1) + .03, .9, 1.0, z0 - t - .03, z0 + t + .03); }
  else { blk(stoneM, x0 - t, x0 + t, 0, .9, Math.min(z0, z1), Math.max(z0, z1)); blk(limeM, x0 - t - .03, x0 + t + .03, .9, 1.0, Math.min(z0, z1) - .03, Math.max(z0, z1) + .03); } }
function pier(x, z) { blk(stoneM, x - .35, x + .35, 0, 1.5, z - .35, z + .35); blk(limeM, x - .4, x + .4, 1.5, 1.62, z - .4, z + .4); }
function highCross(x, z) { blk(ashM, x - .55, x + .55, 0, .4, z - .4, z + .4); blk(ashM, x - .18, x + .18, .4, 3.3, z - .12, z + .12); blk(ashM, x - .65, x + .65, 2.9, 3.2, z - .1, z + .1);
  const t = new THREE.Mesh(new THREE.TorusGeometry(.42, .07, 8, 24), ashM); t.position.set(x, 3.05, z); t.castShadow = true; scene.add(t); blk(ashM, x - .14, x + .14, 3.2, 3.75, z - .1, z + .1); }
// headstones in rows, a little askew, facing the east (the dead face the chancel as the church does)
function stones(x0, x1, z0, z1, seed) { let s = seed; const rr = () => ((s = (s * 16807) % 2147483647) - 1) / 2147483646;
  for (let x = x0; x <= x1; x += 1.6 + rr() * .6) for (let z = z0; z <= z1; z += 1.9) { if (rr() < .25) continue; const h = .6 + rr() * .45, w = .45 + rr() * .2, o = blk(slabM, -w / 2, w / 2, 0, h, -.07, .07);
    o.position.set(x, h / 2 - .05, z + (rr() - .5) * .3); o.rotation.set((rr() - .5) * .12, Math.PI / 2 + (rr() - .5) * .25, (rr() - .5) * .1); } }

function place(kind, ox) {
  const side = kind === 'side', yN = side ? -8.7 : -6.2, X0 = TOWER, X1 = CHANCEL + 3;
  const ch = gatelandsChurch({ tower: 'square', ajar: true }); put(ch, ox, 0);
  // the ground: the square west of the tower, the main street along the flank and through the square, the yard's grass
  ground(28, 34, flagM, ox + X0 - 14, 6, .004, .8); ground(80, 4, cobM, ox + 26, STREET_Z, .006, .55);
  ground(X1 - X0, 4.2 - yN, grassM, ox + (X0 + X1) / 2, (4.2 + yN) / 2, .002, .6);
  // the yard's walls: the street side beside the chancel, the east end, the yard's long side, and the west wall either side of the tower with the gate in it
  const gz = (yN + -2.8) / 2; wall(ox + 8, 4.5, ox + X1 + .3, 4.5); wall(ox + X1 + .3, 4.5, ox + X1 + .3, yN - .3); wall(ox + X0 - .3, yN - .3, ox + X1 + .3, yN - .3);
  wall(ox + X0 - .3, yN - .3, ox + X0 - .3, gz - .9); wall(ox + X0 - .3, gz + .9, ox + X0 - .3, -2.8); wall(ox + X0 - .3, 2.8, ox + X0 - .3, 4.5); wall(ox + X0 - .3, 4.5, ox - 8, 4.5);
  pier(ox + X0 - .3, gz - 1.1); pier(ox + X0 - .3, gz + 1.1);
  // the gravel path from the gate along the yard, and round the chancel to the back
  const pz = side ? -5.6 : (yN + -4.2) / 2; ground(14.3 - X0 + 1, 1.2, gravel, ox + (X0 + 14.3) / 2 + .5, pz, .008, .7); ground(1.2, pz < -4.2 ? -(pz - 3.4) : 1, gravel, ox + 15.4, (pz + 3.4) / 2 - .6, .008, .7);
  // the row
  let R6, rx, rz, ry;
  if (kind === 'back') { R6 = row('gatelands', { yard: true }); rx = X1 - .58; rz = -1.0; ry = -Math.PI / 2; }
  else if (side) { R6 = row('gatelands', { yard: true }); rx = 1.0; rz = yN + .58; ry = 0; }
  else { R6 = row('gatelands'); rx = X0 - 8.2; rz = -4.9; ry = 0; }
  put(R6.group, ox + rx, rz, ry);
  // the high cross and the graves: where the row is not
  if (kind === 'back') { highCross(ox - 2, (yN - 4.2) / 2 - .1); stones(ox - 11.2, ox + 7, yN + .5, yN + .6, 3); }
  else if (side) { highCross(ox + 16, -4.6); stones(ox + 15.4, ox + 16.6, -1.5, 2.6, 5); stones(ox - 11.6, ox - 5.6, yN + .55, yN + .6, 9); stones(ox + 7.6, ox + 12.4, yN + .55, yN + .6, 11); }
  else { highCross(ox - 2, (yN - 4.2) / 2 - .1); stones(ox - 11.2, ox + 7, yN + .5, yN + .6, 3); stones(ox + 15.4, ox + 16.6, -1.5, 2.6, 5); }
  // a yew in the yard's corner, the town's trees beyond
  trees.push([ox + X0 + 1.6, 0, yN + 1.0, .5, 1, new THREE.Color(.62, .78, .5)]);
  // the neighbours: townhouses across the street facing it, and the lots behind the yard with their backs to it
  for (let i = 0; i < 5; i++) { const g = building(PLANS.townhouse({ color: ['ochre', 'white', 'pink', 'blue', 'white'][i], paint: ['red', 'green', 'blue', 'red', 'yellow'][i] })); const s = g.userData.size; put(g, ox - 8 + i * (s.w + .4) + s.w / 2, STREET_Z + 2 + 1.0 + s.d / 2, Math.PI); }
  for (let i = 0; i < 4; i++) { const g = building(PLANS.townhouse({ color: ['white', 'ochre', 'white', 'pink'][i], paint: ['blue', 'red', 'green', 'red'][i] })); const s = g.userData.size; put(g, ox - 10 + i * (s.w + 1.2) + s.w / 2, yN - .6 - 1.4 - s.d / 2, Math.PI); }
  // people: one at the row, praying at An Teallach's basin; one coming through the gate (or across the square); one at the church door
  const tea = R6.niches.find(n => n.god === 'teallach'), loc = (lx, lz) => { const c = Math.cos(ry), s = Math.sin(ry); return [ox + rx + lx * c + lz * s, rz - lx * s + lz * c]; };
  { const [px, pz2] = loc(tea.x + .1, 1.05); people.push([px, pz2, ry + Math.PI, 'gatelander', 'pray:' + kind, 1]); }
  if (kind === 'square') people.push([ox + X0 - 13, 3.5, 2.2, 'gatelander', 'walk:' + kind, 0]); else people.push([ox + X0 + 1.2, gz + .3, Math.PI / 2 + .3, 'gatelander', 'walk:' + kind, 0]);
  people.push([ox + X0 - 1.6, -.8, -Math.PI / 2 + .5, 'gatelander', 'door:' + kind, 1]);
  const plot = { w: +(4.2 - yN).toFixed(2), d: +(X1 - X0).toFixed(2), x0: ox + X0, x1: ox + X1, z0: yN, z1: 4.2 };
  // world boxes for the check: the row (its niches and basins), each part of the church, and where one kneels at An Teallach's basin
  const bx = o => { o.updateMatrixWorld(true); const b = new THREE.Box3().setFromObject(o); return [b.min.x, b.min.z, b.max.x, b.max.z, b.max.y].map(v => +v.toFixed(3)); };
  const parts = ch.children.map(c => ({ name: c.userData.name, box: bx(c) }));
  OUT.push({ kind, plot, yard: +(-4.2 - yN).toFixed(2), behind: +(X1 - CHANCEL).toFixed(2), row: { tris: R6.tris, draws: R6.draws, len: +R6.len.toFixed(2) }, church: { tris: ch.userData.tris, calls: ch.userData.calls, size: ch.userData.size },
    rowBox: bx(R6.group), parts, kneel: loc(tea.x + .1, 1.05).map(v => +v.toFixed(3)), basin: loc(tea.x, .55).map(v => +v.toFixed(3)), gate: [ox + X0 - .3, gz],
    gapToChurch: kind === 'back' ? +(rx - .55 - CHANCEL).toFixed(2) : side ? +(-4.2 - (rz + .55)).toFixed(2) : null });
  return { rx: ox + rx, rz, ry, gz, yN };
}

const KINDS = ALL ? ['back', 'side', 'square'] : [PLACE], DX = 70, P = KINDS.map((k, i) => place(k, ALL ? (i - 1) * DX : 0));
for (let i = 0; i < 26; i++) { const a = i / 26, x = -120 + a * 240 + Math.sin(i * 7.1) * 6, z = -34 - (i % 3) * 8 - Math.cos(i * 3.3) * 4; trees.push([x, 0, z, .75 + (i % 4) * .08, i, null]); }
ground(1200, 1200, grassM, 0, 0, -.01, .5);
TK.plant(scene, trees.map(t => [t[0], t[1], t[2], t[3], t[4], t[5] || new THREE.Color(.95, 1, .7)]));
const p0 = P[0];
if (ALL) { sunBox(0, 0, 120); cam.fov = 40; cam.position.set(0, 150, 46); cam.lookAt(0, 0, -1); }
else {
  sunBox(-6, 0, 36);
  const C = {
    arrive: [[HEART[0] - 2, 1.65, HEART[1] + 4], [TOWER + 6, 3.2, -3]],
    gate: [[TOWER - 4.5, 1.65, p0.gz + 1.2], [TOWER + 8, 1.6, p0.gz - .5]],
    row: PLACE === 'back' ? [[12.4, 1.65, -5.5], [16.9, 1.2, .2]] : PLACE === 'side' ? [[-4.6, 1.65, -4.6], [2, 1.2, -8.2]] : [[TOWER - 6.4, 1.65, 3.4], [TOWER - 8.6, 1.3, -4.9]],
    high: [[-12, 44, 24], [0, 0, -2]] }[CAM] || [[HEART[0] - 2, 1.65, HEART[1] + 4], [TOWER + 6, 3.2, -3]];
  cam.fov = CAM === 'row' ? 58 : CAM === 'high' ? 46 : 54; cam.position.set(...C[0]); cam.lookAt(...C[1]);
}
if (Q.get('cam') && Q.get('cam').includes(',')) { const c = Q.get('cam').split(',').map(Number); cam.position.set(c[0], c[1], c[2]); cam.lookAt(c[3], c[4], c[5]); }
cam.updateProjectionMatrix();
STATS.place = PLACE; STATS.cam = CAM; STATS.niche = NICHE;
const comp = makeComposer(R, scene, cam, { bloom: .24, bloomT: .9, sat: 1.06, vig: .28 });
(Q.has('nopeople') ? Promise.reject('nopeople') : loadPack('mh/')).then(() => { STATS.people = [];
  for (const [x, z, ry, kind, seed, g] of people) { const G = rollGenome(seed, { people: kind, g }); G.dress = { ...G.dress, shield: false, spear: false };
    const p = makePerson(G); p.root.position.set(x, p.root.position.y, z); p.root.rotation.y = ry; scene.add(p.root); p.root.traverse(o => { if (o.isMesh) o.castShadow = o.receiveShadow = true; });
    STATS.people.push({ kind, height: +statureOf(G).toFixed(3) }); }
}).catch(e => { if (e !== 'nopeople') { STATS.err = String(e); console.error(e); } }).finally(() => run(comp, cam));
