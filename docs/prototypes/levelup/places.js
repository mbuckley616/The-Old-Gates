// Places that are not gates in the new kit (card F8, backlog L10, OG-121; Session 857, a prototype).
// markMine(o, r): a Markish silver mine, OG-121's "mines and quarries: timber galleries and walkways over a shaft, ore, a working site"
//   and its Mark panel's "mountain mines". The canon's Mark sells "iron and silver from the ranges". Built to the person, a metre a unit:
//   - the adit: a level driven 18 m into the hill (+z is the mouth, at z 0), 3 m by 3 m in the rock, held by timber sets every 1.5 m (two
//     posts and a cap, lagging boards over the cap), the clear way 2.2 m wide and 2.3 m to the cap; a tramway of 0.6 m gauge on sleepers;
//   - the stope: a worked-out chamber 12 m across, 16 m deep and 24 m high (8 m over the adit's floor, 16 below), the ore taken out of it
//     downward, so the adit comes out on a timber landing over the void;
//   - the landing: a deck across the chamber's near end, the tram's last cart at its stop-block, a windlass over the shaft with its rope and
//     kibble hanging into the dark with a lamp in it, a ladder down the far wall;
//   - the gallery: a walkway 1.4 m wide along the west wall, on beams let into the rock and struts below, a rail on its open side;
//   - the working face: a rock ledge at the far end, the face cut square, the vein of silver-lead ore across it, broken ore at its foot,
//     a pick and a basket, a lamp on a peg. Whoever holds the working is the systems builder's (OG-121's "a working site held by hostiles").
//   o.worked (default true): the vein shows fresh pick marks and a heap, and the miners' lamps are lit; false, the face is old, the heap
//   gone, and no lamp hangs anywhere (Michael's 2 A on DECISION #305, Session 868): the mine is dark but for your own torch.
//   -> { group, tris, draws, top, path (the walk, [x, z] at floor height 0), sets (each { x0, x1, cap, foot }), lamps ([x, y, z]),
//        void { x0, x1, z0, z1, floor, water }, rail (the gallery's open edge x), vein ([x, y, z] its middle), face (z of the face) }
// All rock shares one noise field keyed by the place, so the adit's rock and the chamber's meet at the same points where they join.
import * as THREE from 'three';
import { mergeGeometries, mergeVertices } from 'three/addons/utils/BufferGeometryUtils.js';
import { mat, worldUV, puffTex } from './common.js';
import { stream, markTextures, aurenneTextures, gatelandsBuilding, GL_PLANS, markHall } from './pieces.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { gatelandsSloop, aurenneSloop, markCutter } from './ships.js';

let PM = null;
function mats() {
  if (PM) return PM;
  PM = { rock: mat('rock', { ns: 1.5, color: 0x6e6a64, rough: .95 }), rockWet: mat('rock', { ns: 1.6, color: 0x54524e, rough: .45 }), spoil: mat('rock', { ns: 1.8, color: 0x5a5650, rough: 1 }),
    timber: mat('beam', { ns: 1.0, color: 0x8a6c4c, rough: .9 }), plank: mat('wood', { ns: .9, color: 0x9a8062, rough: .85 }), dark: new THREE.MeshStandardMaterial({ color: 0x0d0b09, roughness: 1 }),
    iron: new THREE.MeshStandardMaterial({ color: 0x2c2a28, roughness: .5, metalness: .6 }), ore: new THREE.MeshStandardMaterial({ color: 0x7a7e86, roughness: .3, metalness: .9 }), oreDark: new THREE.MeshStandardMaterial({ color: 0x4a4c50, roughness: .4, metalness: .7 }),
    rope: new THREE.MeshStandardMaterial({ color: 0x8a7650, roughness: .95 }), basket: mat('thatch', { ns: .8, color: 0x8a7046, rough: 1 }),
    horn: new THREE.MeshStandardMaterial({ color: 0xd8a860, emissive: new THREE.Color(1, .62, .28), emissiveIntensity: 1.6, roughness: .5 }), flame: new THREE.MeshStandardMaterial({ color: 0xffd090, emissive: new THREE.Color(1, .75, .4), emissiveIntensity: 4 }),
    water: new THREE.MeshStandardMaterial({ color: 0x0a1214, roughness: .05, metalness: .3 }) };
  PM.rock.side = PM.rockWet.side = THREE.DoubleSide; PM.ledge = PM.rock;
  return PM;
}
function kit() { const M = mats(), B = new Map();
  const put = (geo, key, x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0, uv = .6) => { const g = geo.index ? geo.toNonIndexed() : geo; for (const k of Object.keys(g.attributes)) if (!['position', 'normal'].includes(k)) g.deleteAttribute(k);
    g.applyMatrix4(new THREE.Matrix4().compose(new THREE.Vector3(x, y, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(rx, ry, rz, 'YXZ')), new THREE.Vector3(1, 1, 1))); worldUV(g, uv);
    if (!B.has(key)) B.set(key, []); B.get(key).push(g); };
  const finish = extra => { const group = new THREE.Group(); let tris = 0; for (const [k, gs] of B) { const g = mergeGeometries(gs, false); gs.forEach(x => x.dispose()); const m = new THREE.Mesh(g, M[k]); m.name = k; m.castShadow = !['flame', 'horn', 'water'].includes(k); m.receiveShadow = true; group.add(m); tris += g.attributes.position.count / 3; }
    return { group, tris: Math.round(tris), draws: group.children.length, top: +new THREE.Box3().setFromObject(group).max.y.toFixed(2), ...extra }; };
  return { put, finish }; }
// one smooth noise field for all the rock of a place: a point is moved by where it is, so two pieces that share an edge stay joined
function field(r, amp) { const ph = Array.from({ length: 9 }, () => r() * 9);
  return (x, y, z) => { const f = .55, a = (p, q, s) => Math.sin(x * f * p + ph[s]) * Math.sin(y * f * q + ph[s + 1]) * Math.sin(z * f * 1.13 + ph[s + 2]) + .45 * Math.sin(x * 1.9 * p + ph[s + 2]) * Math.sin(z * 1.7 * q + ph[s]);
    return [a(1, 1.2, 0) * amp, a(1.3, .9, 3) * amp * .6, a(.8, 1.1, 6) * amp]; }; }
// a box of rock seen from inside (or, inside false, from outside): its faces kept by keep(centroid, outward normal), moved by the field;
// flat(y) says which heights keep their y. Smooth normals across the cells, so the rock is not faceted.
function rockBox(w, h, d, cx, cy, cz, cell, F, keep, flat = () => false, inside = true) { const g = new THREE.BoxGeometry(w, h, d, Math.round(w / cell), Math.round(h / cell), Math.round(d / cell)).toNonIndexed(); g.translate(cx, cy, cz);
  const P = g.attributes.position.array, out = [], c = new THREE.Vector3(), a = new THREE.Vector3(), b = new THREE.Vector3(), e = new THREE.Vector3(), n = new THREE.Vector3();
  for (let i = 0; i < P.length; i += 9) { a.fromArray(P, i); b.fromArray(P, i + 3); e.fromArray(P, i + 6); c.copy(a).add(b).add(e).divideScalar(3); n.subVectors(b, a).cross(e.clone().sub(a)).normalize();
    if (!keep(c, n)) continue; for (const v of inside ? [a, e, b] : [a, b, e]) { const [dx, dy, dz] = F(v.x, v.y, v.z); out.push(v.x + dx, flat(v.y) ? v.y : v.y + dy, v.z + dz); } /* a, e, b: wound to face inward */ }
  const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(out, 3)); const m = mergeVertices(geo, 1e-4); m.computeVertexNormals(); return m; }

export function markMine(o = {}, r = stream('mine')) {
  const { put, finish } = kit(), worked = o.worked !== false, F = field(stream(String(o.key || 'mine') + ':rock'), .26);
  const AL = 18, AW = 3, AH = 3, SET = 1.5, PX = 1.15, POST = .22, CAP = 2.3, CW = 12, CZ0 = -AL, CZ1 = -34, CTOP = 8, CBOT = -16, LZ = -20.6, GX0 = -5.6, GX1 = -4.2, FZ = -30, FACE = -33.6;
  const sets = [], lamps = [], pathPts = [];
  // the adit's rock: its walls and roof, open at both ends and below (the floor is a flat bed of its own)
  put(rockBox(AW, AH, AL, 0, AH / 2, -AL / 2, .5, F, (c, n) => Math.abs(n.z) < .5 && n.y > -.5, y => y < .01), 'rock', 0, 0, 0, 0, 0, 0, .35);
  put(new THREE.BoxGeometry(AW + .2, .3, AL), 'spoil', 0, -.15, -AL / 2, 0, 0, 0, .5);
  // the stope: the chamber's six faces, the near one cut for the adit's mouth (the same half-metre cells, so the edges meet)
  put(rockBox(CW, CTOP - CBOT, CZ0 - CZ1, 0, (CTOP + CBOT) / 2, (CZ0 + CZ1) / 2, .5, F, (c, n) => !(n.z > .5 && Math.abs(c.x) < AW / 2 && c.y > 0 && c.y < AH), y => Math.abs(y) < .01), 'rock', 0, 0, 0, 0, 0, 0, .35);
  // the ledge at the far end: rock left standing to the floor's level, its top flat, its side to the void rough
  put(rockBox(CW, -CBOT, FZ - CZ1 + .5, 0, CBOT / 2, (FZ + CZ1 - .5) / 2, .5, F, (c, n) => n.y > .5 || n.z > .5, y => y > -.01, false), 'ledge', 0, 0, 0, 0, 0, 0, .35);
  // the face: cut square across the ledge's end, wet, rough at a smaller grain than the stope; the vein across it, a band of silver-lead
  // ore dipping east, in shards set into the face's own surface (FF says where that surface is)
  const FF = field(stream(String(o.key || 'mine') + ':face'), .07), fz = (x, y) => FACE + FF(x, y, FACE)[2];
  put(rockBox(7, 3.6, .7, 0, 1.8, FACE - .35, .2, FF, (c, n) => n.z > .5 || n.y > .5 || Math.abs(n.x) > .5, y => y < .01, false), 'rockWet', 0, 0, 0, 0, 0, 0, .5);
  const dip = (r() - .5) * .25, vy = 1.05 + r() * .2, band = x => vy + Math.sin(x * .9 + dip * 4) * .12 + x * dip * .3;
  for (let x = -3; x <= 3.01; x += .25) { const y = band(x), g = new THREE.IcosahedronGeometry(.05, 0); g.scale(1.6, .7, .2); put(g, 'ore', x, y, fz(x, y) + .01, 0, 0, r() * .6 - .3); }
  for (let k = 0; k < 90; k++) { const x = -3.2 + r() * 6.4, y = band(x) + (r() - .5) * .34 * (1 - Math.abs(x) / 5), sz = .025 + r() * .045, g = new THREE.IcosahedronGeometry(sz, 0); g.scale(1.5, .7, .2);
    put(g, k % 5 ? 'ore' : 'oreDark', x, y, fz(x, y) + .01, r() * .4, 0, r() * 3); }
  if (worked) for (let k = 0; k < 26; k++) { const x = -2.8 + r() * 5.6, y = band(x) - .4 + r() * .8; put(new THREE.BoxGeometry(.07 + r() * .06, .02, .02), 'dark', x, y, fz(x, y) + .004, 0, 0, (r() - .5) * 1.4); }
  // broken ore and spoil at the face's foot, a pick against it, a basket and the lamp on its peg
  if (worked) for (let k = 0; k < 34; k++) { const s = .08 + r() * .14, g = new THREE.IcosahedronGeometry(s, 0); g.scale(1, .7, 1); put(g, k % 4 ? 'spoil' : 'oreDark', -1.6 + r() * 3.2 * (1 - k / 60), s * .5, FACE + .2 + r() * .55 * (1 - k / 60), r() * 3, r() * 3, 0); }
  { const px = 2.4, pz = FACE + .25; put(new THREE.CylinderGeometry(.022, .026, .9, 8), 'timber', px, .45, pz, -.25, 0, .05); put(new THREE.BoxGeometry(.05, .05, .52), 'iron', px, .88, pz - .1, -.25, 0, 0); }
  { const g = new THREE.CylinderGeometry(.24, .18, .32, 14, 1, true); put(g, 'basket', -2.3, .16, FACE + .65); put(new THREE.CircleGeometry(.18, 14).rotateX(-Math.PI / 2), 'basket', -2.3, .01, FACE + .65); }
  // a lamp: lit only while the mine is worked (Michael's 2 A on #305); worked out, its peg or bracket stays bare and the mine is dark
  const lamp = (x, y, z, peg) => { if (peg) put(new THREE.CylinderGeometry(.015, .015, .25, 6).rotateX(Math.PI / 2), 'iron', x, y + .12, z + peg * .12); if (!worked) return; put(new THREE.BoxGeometry(.12, .16, .12), 'horn', x, y, z); put(new THREE.ConeGeometry(.09, .08, 4).rotateY(Math.PI / 4), 'iron', x, y + .12, z); put(new THREE.TorusGeometry(.03, .006, 4, 10), 'iron', x, y + .18, z); lamps.push([x, y, z].map(v => +v.toFixed(2))); };
  lamp(-1.4, 1.9, FACE + .19, -1);
  // the adit's timber sets: two posts and a cap, lagging over the cap; every fourth set carries a lamp on its post
  for (let k = 0; k * SET <= AL - .6; k++) { const z = -.6 - k * SET; for (const e of [-1, 1]) put(new THREE.BoxGeometry(POST, CAP, POST), 'timber', e * PX, CAP / 2, z, 0, 0, e * -.025);
    put(new THREE.BoxGeometry(2 * PX + POST + .2, .24, .26), 'timber', 0, CAP + .12, z); sets.push({ x0: +(-PX + POST / 2).toFixed(3), x1: +(PX - POST / 2).toFixed(3), cap: CAP, foot: 0, z: +z.toFixed(2) });
    if (k % 4 === 1) { lamp(PX - POST / 2 - .12, 1.85, z, 0); put(new THREE.CylinderGeometry(.012, .012, .14, 6).rotateZ(Math.PI / 2), 'iron', PX - POST / 2 - .07, 2.03, z); } }
  for (let k = 0; k < Math.floor((AL - .6) / .3); k++) put(new THREE.BoxGeometry(2 * PX + .5, .04, .26), 'plank', 0, CAP + .27, -.6 - k * .3 - .15, 0, 0, (r() - .5) * .02, .25);
  // the tramway: sleepers and two rails of 0.6 m gauge from the mouth to the stop-block on the landing
  for (let z = -.3; z > -19.4; z -= .7) put(new THREE.BoxGeometry(1.0, .08, .16), 'timber', 0, .04, z, 0, (r() - .5) * .06, 0);
  for (const e of [-.3, .3]) put(new THREE.BoxGeometry(.05, .06, 19.2), 'iron', e, .11, -9.75);
  put(new THREE.BoxGeometry(1.0, .3, .3), 'timber', 0, .23, -19.55);
  // the cart: a timber box on four iron wheels, at its stop-block, half full of ore while the mine is worked and empty after
  { const cz = -18.9; put(new THREE.BoxGeometry(.9, .55, 1.1), 'timber', 0, .62, cz); if (worked) put(new THREE.BoxGeometry(.8, .1, 1.0), 'ore', 0, .82, cz); for (const ex of [-.3, .3]) for (const ez of [-.36, .36]) put(new THREE.CylinderGeometry(.17, .17, .06, 14).rotateZ(Math.PI / 2), 'iron', ex + Math.sign(ex) * .03, .3, cz + ez); }
  // the landing: joists into the rock either side, planks across, from the adit's mouth to the shaft's edge
  for (let x = -5.8; x <= 5.81; x += .9) put(new THREE.BoxGeometry(.2, .26, CZ0 - LZ + .5), 'timber', x, -.13 - .04, (CZ0 + LZ) / 2 + .25);
  for (let z = CZ0 - .13; z > LZ; z -= .26) put(new THREE.BoxGeometry(CW + .4, .04, .26), 'plank', 0, -.02, z, 0, 0, (r() - .5) * .01, .25);
  put(new THREE.BoxGeometry(CW + .4, .3, .3), 'timber', 0, -.2, LZ + .15);
  for (const x of [-5.4, -2.0, 3.6]) put(new THREE.BoxGeometry(.24, -CBOT - .35, .24), 'timber', x, (CBOT - .35) / 2, LZ + .15);
  // the landing's rail on the void's side, broken for the windlass
  const railRun = (x0, z0, x1, z1) => { const L = Math.hypot(x1 - x0, z1 - z0), ry = Math.atan2(x1 - x0, z1 - z0), n = Math.max(1, Math.round(L / 1.5));
    for (let k = 0; k <= n; k++) put(new THREE.BoxGeometry(.12, 1.05, .12), 'timber', x0 + (x1 - x0) * k / n, .525, z0 + (z1 - z0) * k / n);
    for (const h of [.5, 1.0]) put(new THREE.BoxGeometry(.08, .1, L), 'timber', (x0 + x1) / 2, h, (z0 + z1) / 2, 0, ry, 0); };
  const WX0 = .4, WX1 = 2.6; railRun(GX1 - .05, LZ + .1, WX0, LZ + .1); railRun(WX1, LZ + .1, 4.9, LZ + .1);
  // the windlass: two trestles at the edge, the drum between them over the shaft, its crank, the rope and the kibble below
  { const wz = LZ - .45; for (const x of [WX0 + .1, WX1 - .1]) put(new THREE.BoxGeometry(.24, .24, 1.9), 'timber', x, -.12, LZ - .15) /* the sills, out over the shaft */;
    for (const x of [WX0 + .1, WX1 - .1]) { for (const s of [-1, 1]) put(new THREE.BoxGeometry(.14, 1.25, .14), 'timber', x, .58, wz + s * .3, s * .42, 0, 0); put(new THREE.BoxGeometry(.18, .12, .9), 'timber', x, .06, wz); }
    put(new THREE.CylinderGeometry(.16, .16, WX1 - WX0 - .1, 16).rotateZ(Math.PI / 2), 'timber', (WX0 + WX1) / 2, 1.08, wz); put(new THREE.CylinderGeometry(.165, .165, .7, 16).rotateZ(Math.PI / 2), 'rope', (WX0 + WX1) / 2 - .2, 1.08, wz);
    put(new THREE.CylinderGeometry(.025, .025, .3, 6).rotateZ(Math.PI / 2), 'iron', WX1 + .1, 1.08, wz); put(new THREE.BoxGeometry(.04, .36, .04), 'iron', WX1 + .24, 1.08 - .16, wz); put(new THREE.CylinderGeometry(.03, .03, .22, 6).rotateZ(Math.PI / 2), 'timber', WX1 + .35, 1.08 - .32, wz);
    const rx = (WX0 + WX1) / 2 - .2, rz = wz - .17, ky = -6.5 - r() * 2; put(new THREE.CylinderGeometry(.018, .018, 1.08 - ky - .55, 6), 'rope', rx, (1.08 + ky + .55) / 2, rz);
    put(new THREE.CylinderGeometry(.32, .26, .6, 14, 1, true), 'iron', rx, ky + .3, rz); put(new THREE.CircleGeometry(.26, 14).rotateX(-Math.PI / 2), 'iron', rx, ky, rz); put(new THREE.TorusGeometry(.32, .015, 4, 16, Math.PI).rotateY(Math.PI / 2), 'iron', rx, ky + .6, rz);
    lamp(rx + .12, ky + .68, rz, 0) /* a lamp let down in the kibble, lighting the shaft from below */; }
  // the ladder down the east wall to the sump from the gap in the rail, its stiles a metre over the deck to take hold of, its feet in the water
  { const lx = 5.45, lz = LZ - .32; for (const s of [-.24, .24]) put(new THREE.BoxGeometry(.08, 1 - CBOT, .1), 'timber', lx, (1 + CBOT) / 2, lz + s);
    for (let y = CBOT + .5; y < -.2; y += .3) put(new THREE.CylinderGeometry(.022, .022, .5, 6).rotateX(Math.PI / 2), 'timber', lx, y, lz); }
  // the gallery: beams let into the west wall every 1.5 m with a strut under each, a deck of planks run half a metre onto the ledge, the rail on its open edge
  for (let z = LZ - .2; z > FZ - .1; z -= 1.5) { put(new THREE.BoxGeometry(GX1 - GX0 + 1.0, .24, .2), 'timber', (GX0 - 1 + GX1) / 2, -.17, z); put(new THREE.BoxGeometry(.18, 2.5, .18), 'timber', -5.2, -1.25, z, 0, 0, -.7); }
  for (const x of [GX0 + .15, GX1 - .15]) put(new THREE.BoxGeometry(.2, .2, LZ - FZ + .4), 'timber', x, -.14, (LZ + FZ) / 2);
  for (let k = 0; k < Math.floor((LZ - FZ + .5) / .26); k++) put(new THREE.BoxGeometry(GX1 - GX0, .04, .26), 'plank', (GX0 + GX1) / 2, -.02, LZ - .13 - k * .26, 0, 0, (r() - .5) * .015, .25);
  railRun(GX1 - .05, LZ + .1, GX1 - .05, FZ + .05);
  lamp(GX0 + .05, 1.7, LZ - 4.5, 0); put(new THREE.CylinderGeometry(.015, .015, .4, 6).rotateZ(Math.PI / 2), 'iron', GX0 - .15, 1.88, LZ - 4.5);
  lamp(-4.98, 1.85, CZ0 - .3, 0); put(new THREE.BoxGeometry(.16, 2.1, .16), 'timber', -5.2, 1.05, CZ0 - .3); put(new THREE.CylinderGeometry(.012, .012, .16, 6).rotateZ(Math.PI / 2), 'iron', -5.06, 2.03, CZ0 - .3);
  lamp(GX0 + .05, 1.7, FZ + .9, 0); put(new THREE.CylinderGeometry(.015, .015, .4, 6).rotateZ(Math.PI / 2), 'iron', GX0 - .15, 1.88, FZ + .9);
  lamp(4.38, 1.85, CZ0 - .3, 0); put(new THREE.BoxGeometry(.16, 2.1, .16), 'timber', 4.6, 1.05, CZ0 - .3); put(new THREE.CylinderGeometry(.012, .012, .16, 6).rotateZ(Math.PI / 2), 'iron', 4.46, 2.03, CZ0 - .3);
  // the sump: water lying in the bottom of the stope
  put(new THREE.PlaneGeometry(CW, CZ0 - FZ).rotateX(-Math.PI / 2), 'water', 0, CBOT + .6, (CZ0 + FZ) / 2, 0, 0, 0, .1);
  // the walk: from the mouth down the adit, out across the landing to the gallery's head, along it, and onto the ledge to the face
  const gw = (GX0 + GX1) / 2; pathPts.push([-.6, -.3], [-.6, -18.6], [gw + .2, -19.7], [gw, LZ - .4], [gw, FZ - .3], [-.5, FACE + 1.05]);
  return finish({ path: pathPts, sets, lamps, worked, void: { x0: GX1, x1: CW / 2, z0: LZ, z1: FZ, floor: CBOT, water: CBOT + .6 }, rail: GX1 - .05, vein: [0, +band(0).toFixed(2), +fz(0, band(0)).toFixed(3)], face: FACE, adit: { w: 2 * PX - POST, cap: CAP, len: AL }, gallery: { x0: GX0, x1: GX1, w: GX1 - GX0 } });
}

// gatelandsCairn(o, r) (Session 869, Michael's 3 A on #305: the next place that is not a gate): the Gatelands' round cairn with its
//   passage, OG-121's "round cairns" (the Gatelands' panel). A mound of stones grassed over, 30 m across inside a kerb of laid boulders
//   and 8.2 m high (26 and 7 until Session 884), the door (+z) in a dry-stone facade on a chord of the kerb, an entrance stone lying before it. Built to the person:
//   - the passage: 11.8 m of upright slabs (orthostats) either side, 2.0 m clear between them (1.25 until Session 884), roofed with lintels 2.6 m over a floor
//     that rises 0.8 m to the chamber, dry-stone packing behind the slabs;
//   - the chamber: cruciform, at 1.35 times its Session 869 plan: a middle under a corbelled vault (eight courses of slabs each stepping in
//     0.27 m, a capstone at 6.5 m) and three recesses (east, west and back), each 2 m wide and 2.2 m deep under its own capstone at 2.8 m, a stone basin in each;
//   - o.carved (default true): spirals pecked into the entrance stone's face and the back recess's end stone, lozenges on one slab of
//     the passage. What lies in the basins, and who, is the quest writer's (§3.1 gives the dead to the gates): here they are empty.
//   -> { group, tris, draws, top, path ([x, z], from the approach to the back recess), floorAt(z) (the floor's height on the walk),
//        door { x0, x1, z, lintel }, passage { w, len, lintel }, chamber { y, vault }, basins ([x, y, z]), kerb (the stones' count) }
// The whole is dark inside: no lamp burns in a cairn, so it is seen by your torch (as the worked-out mine, #305's 2 A).
let CM = null;
function cairnMats() {
  if (CM) return CM; markTextures(); const M = mats();
  CM = { ...M, turf: mat('turfMoss', { ns: .8, color: 0xb4d090, rough: 1 }), stone: mat('cobble', { ns: 1.4, color: 0xb0aca0, rough: .95 }), slab: mat('rock', { ns: 1.4, color: 0x8c897e, rough: .9 }),
    boulder: mat('rock', { ns: 1.5, color: 0x9c9a8e, rough: .95 }), pack: mat('rock', { ns: 1.6, color: 0x4c4943, rough: 1 }), floorC: mat('rock', { ns: .8, color: 0x5e584e, rough: 1 }),
    groove: new THREE.MeshStandardMaterial({ color: 0x3a3832, roughness: 1 }) };
  return CM;
}
function roughen(geo, r, amp, f = 1.6) { const g = geo.index ? geo : geo, P = g.attributes.position, ph = [r() * 9, r() * 9, r() * 9], v = new THREE.Vector3(), c = new THREE.Vector3();
  g.computeBoundingBox(); g.boundingBox.getCenter(c);
  for (let i = 0; i < P.count; i++) { v.fromBufferAttribute(P, i); const n = Math.sin(v.x * f + ph[0]) * Math.sin(v.y * f * 1.3 + ph[1]) * Math.sin(v.z * f + ph[2]) + .5 * Math.sin(v.x * f * 2.7 + ph[1]) * Math.sin(v.z * f * 2.3 + ph[0]);
    const d = v.clone().sub(c), L = d.length() || 1; v.addScaledVector(d.divideScalar(L), n * amp); P.setXYZ(i, v.x, v.y, v.z); }
  g.computeVertexNormals(); return g; }
// a spiral pecked into a face: an Archimedean spiral of `turns` in the local x-y plane, a groove half sunk in the stone
function spiral(rad, turns, cw = 1) { const pts = []; for (let k = 0; k <= turns * 24; k++) { const t = k / (turns * 24), a = cw * t * turns * Math.PI * 2; pts.push(new THREE.Vector3(Math.cos(a) * rad * t, Math.sin(a) * rad * t, 0)); }
  return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), turns * 24, .014, 4, false); }

export function gatelandsCairn(o = {}, r = stream('cairn')) {
  const M = cairnMats(), B = new Map(), carved = o.carved !== false;
  const put = (geo, key, x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0, uv = .6) => { const g = geo.index ? geo.toNonIndexed() : geo; for (const k of Object.keys(g.attributes)) if (!['position', 'normal', ...(uv === null ? ['uv'] : [])].includes(k)) g.deleteAttribute(k);
    g.applyMatrix4(new THREE.Matrix4().compose(new THREE.Vector3(x, y, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(rx, ry, rz, 'YXZ')), new THREE.Vector3(1, 1, 1))); if (uv !== null) worldUV(g, uv); /* null: the piece's own UVs (the mound's, from above) */
    if (!B.has(key)) B.set(key, []); B.get(key).push(g); };
  const S = 1.35, R = 15, HT = 8.2, HK = 1.0, FW = 4.8, ZD = Math.sqrt(R * R - FW * FW), ZM = 1.95 * S, FY = .8, W = 2.0, HW = W / 2, LP = 2.6, LC = 2.8, T = .35; /* S: the chamber's scale (Session 884, Michael's note on #309: "passages look very narrow") */
  const floorAt = z => z >= ZD ? 0 : z <= ZM ? FY : FY * (ZD - z) / (ZD - ZM);
  const facadeTop = x => { const a = Math.abs(x); return a < 2.8 ? 3.9 : a > FW ? HK : HK + (3.9 - HK) * (1 - (a - 2.8) / (FW - 2.8)) ** 1.5; };
  // the mound: a grassed dome on a polar grid, its foot 1 m up on the kerb's line; at the door it is held back by the facade
  { const NR = 34, NS = 112, F = field(stream(String(o.key || 'cairn') + ':mound'), .22), pos = [], idx = [], at = [];
    for (let i = 0; i <= NR; i++) for (let j = 0; j < NS; j++) { const rr = R * (1 - i / NR), a = j / NS * Math.PI * 2; let x = Math.sin(a) * rr, z = Math.cos(a) * rr, h = HK + (HT - HK) * Math.sqrt(Math.max(0, 1 - (rr / R) ** 2));
      const [dx, dy, dz] = i ? F(x, h, z) : [0, 0, 0]; x += dx * .5; z += dz * .5; h += dy * (i ? 1 : 0);
      if (z > ZD - .5 && Math.abs(x) < FW) { z = ZD - .45; h = Math.max(h, facadeTop(x) - .05); }
      pos.push(x, h, z); at.push(i === NR ? 0 : 1); }
    const cut = new Set(); const vi = (i, j) => i * NS + (j % NS);
    for (let i = 0; i < NR; i++) for (let j = 0; j < NS; j++) { const a = vi(i, j), b = vi(i, j + 1), c = vi(i + 1, j), d = vi(i + 1, j + 1);
      for (const t of [[a, b, c], [b, d, c]]) { const flat = t.every(k => pos[k * 3 + 2] >= ZD - .46 && Math.abs(pos[k * 3]) < FW), door = flat && t.every(k => Math.abs(pos[k * 3]) < HW + .6 && pos[k * 3 + 1] < LP + .6); if (!door) idx.push(...t); /* the sheet on the chord lies inside the facade; only the door is cut from it */ } }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(pos.flatMap((v, k) => k % 3 === 1 ? [] : [v * .25]), 2)); g.setIndex(idx); g.computeVertexNormals(); put(g, 'turf', 0, 0, 0, 0, 0, 0, null); }
  // the kerb: laid boulders on edge round the foot, a dry-stone wall behind them up to the mound's foot, both broken for the facade
  let kerb = 0; const A0 = Math.asin(FW / R);
  { const g = new THREE.CylinderGeometry(R - .25, R - .25, HK + .1, 120, 1, true, A0, Math.PI * 2 - 2 * A0); put(g, 'stone', 0, (HK + .1) / 2 - .05, 0, 0, 0, 0, 1.1);
    const n = Math.round(44 * R / 13); for (let k = 0; k < n; k++) { const a = (k + .5) / n * Math.PI * 2; if (Math.abs(Math.atan2(Math.sin(a), Math.cos(a))) < A0 + .03) continue; const L = 1.7 + r() * .25, h = .95 + r() * .3;
      const g2 = roughen(new RoundedBoxGeometry(L, h, .7, 3, .22), r, .08, 2.2); put(g2, 'boulder', Math.sin(a) * (R + .08), h / 2 - .08, Math.cos(a) * (R + .08), 0, a + Math.PI / 2, 0, .45); kerb++; } }
  // the facade: dry stone on the chord, its top falling to the kerb at either end, notched for the door; the lintel over the door
  { const pts = [[-FW, 0], [-HW, 0], [-HW, LP], [HW, LP], [HW, 0], [FW, 0]]; for (let k = 0; k <= 16; k++) { const x = FW - k / 16 * 2 * FW; pts.push([x, facadeTop(x)]); }
    const sh = new THREE.Shape(pts.map(([a, b]) => new THREE.Vector2(a, b))), g = new THREE.ExtrudeGeometry(sh, { depth: .7, bevelEnabled: false }); g.translate(0, 0, -.7); put(g, 'stone', 0, 0, ZD, 0, 0, 0, 1.1);
    put(roughen(new THREE.BoxGeometry(W + 1.5, .5, 1.0, 4, 2, 2), r, .04, 2), 'slab', 0, LP + .25, ZD - .4, 0, 0, 0, .5); }
  // the passage: slabs on edge either side, their feet below the floor and their heads at the lintels; packing behind, run on 0.7 m past
  // each end in the chamber so the runs of two walls close their corner (not into the passage); lintels across
  const slabsAlong = (x0, z0, x1, z1, top, foot, out, lean, e0 = .15, e1 = .15) => { const L = Math.hypot(x1 - x0, z1 - z0), n = Math.max(1, Math.round(L / 1.05)), ux = (x1 - x0) / L, uz = (z1 - z0) / L, nx = uz * out, nz = -ux * out, ry = Math.atan2(ux, uz);
    for (let k = 0; k < n; k++) { const t = (k + .5) / n, x = x0 + (x1 - x0) * t, z = z0 + (z1 - z0) * t, y0 = foot(z), y1 = top(z), len = L / n - .03, th = T * (.9 + r() * .2);
      const g = roughen(new THREE.BoxGeometry(th, y1 - y0, len, 2, 3, 3), r, .025, 2.6); put(g, 'slab', x + nx * (th / 2 + .03), (y0 + y1) / 2, z + nz * (th / 2 + .03), 0, ry, lean * (r() * .03), .5); }
    put(new THREE.BoxGeometry(.45, top((z0 + z1) / 2) - foot((z0 + z1) / 2) + .3, L + e0 + e1), 'pack', (x0 + x1) / 2 + nx * (T + .3) + ux * (e1 - e0) / 2, (top((z0 + z1) / 2) + foot((z0 + z1) / 2)) / 2 + .1, (z0 + z1) / 2 + nz * (T + .3) + uz * (e1 - e0) / 2, 0, ry, 0, .5); };
  for (const e of [-1, 1]) slabsAlong(e * HW, ZD - .7, e * HW, ZM, z => floorAt(Math.max(z - .5, ZM)) + LP + .02, z => floorAt(z) - .25, -e, e);
  for (let z = ZD - .7; z > ZM - .1; z -= .82) { const zc = z - .45, under = floorAt(Math.max(zc - .45, ZM)) + LP; put(roughen(new THREE.BoxGeometry(W + 2 * T + .7, .4, .95, 3, 2, 2), r, .03, 2), 'slab', 0, under + .2 + .02, zc, 0, 0, 0, .5); }
  // the floor: the passage's slope and the chamber's level, beaten earth and flags
  { const L = ZD + .3 - ZM, ang = Math.atan2(FY, ZD - ZM); put(new THREE.BoxGeometry(W + .2, .2, L / Math.cos(ang) + .1), 'floorC', 0, FY / 2 - .1, (ZD + .3 + ZM) / 2 - .15, ang, 0, 0, .5);
    put(new THREE.BoxGeometry(7.4 * S, .2, 6.0 * S), 'floorC', 0, FY - .1, -.75 * S, 0, 0, 0, .5); }
  // the chamber: cruciform, slabs round its outline; the recesses' capstones; the corbelled vault and its capstone
  const ow = [[HW, ZM], ...[[1.45, 1.55], [1.75, .75], [3.4, .75], [3.4, -.75], [1.75, -.75], [.75, -1.75], [.75, -3.4], [-.75, -3.4], [-.75, -1.75], [-1.75, -.75], [-3.4, -.75], [-3.4, .75], [-1.75, .75], [-1.45, 1.55]].map(([x, z]) => [x * S, z * S]), [-HW, ZM]];
  for (let k = 0; k + 1 < ow.length; k++) { const [x0, z0] = ow[k], [x1, z1] = ow[k + 1]; slabsAlong(x0, z0, x1, z1, () => FY + LC + .02, () => FY - .25, -1, 1, k ? .7 : .15, k + 2 < ow.length ? .7 : .15); }
  const recess = [[2.6 * S, 0, Math.PI / 2], [-2.6 * S, 0, Math.PI / 2], [0, -2.6 * S, 0]];
  for (const [x, z, ry] of recess) put(roughen(new THREE.BoxGeometry(2.4 * S, .4, 2.3 * S, 3, 2, 3), r, .03, 2), 'slab', x, FY + LC + .2, z, 0, ry, 0, .5);
  for (let c = 0; c < 8; c++) { const rin = (1.95 - c * .2) * S, y = FY + LC + c * .36, n = 9; for (let k = 0; k < n; k++) { const a = (k + c * .5) / n * Math.PI * 2, len = 2 * (rin + .45) * Math.tan(Math.PI / n) + .12;
    put(roughen(new THREE.BoxGeometry(len, .36, .95, 3, 1, 2), r, .025, 2.4), 'slab', Math.sin(a) * (rin + .47), y + .18, Math.cos(a) * (rin + .47), 0, a, 0, .5); } }
  const VAULT = FY + LC + 8 * .36; put(roughen(new THREE.CylinderGeometry(.95 * S, 1.0 * S, .4, 10, 1), r, .03, 2), 'slab', 0, VAULT + .2, 0, 0, 0, 0, .5);
  // the basins: a shallow oval dish of stone in each recess, empty
  const basins = []; { const prof = [[0, 0], [.5, 0], [.56, .06], [.56, .24], [.5, .26], [.44, .2], [.3, .14], [0, .13]].map(([a, b]) => new THREE.Vector2(a, b));
    for (const [x, z, ry] of recess) { const bx = x * 1.08, bz = z * 1.08, g = roughen(new THREE.LatheGeometry(prof, 16), r, .015, 4); g.scale(1.25, 1, .85); put(g, 'boulder', bx, FY, bz, 0, ry, 0, .6); basins.push([+bx.toFixed(2), +(FY + .26).toFixed(2), +bz.toFixed(2)]); } }
  // the entrance stone: a long boulder lying before the door, its face to the approach
  const ES = ZD + 2.4; put(roughen(new RoundedBoxGeometry(3.0, 1.2, .9, 4, .25), r, .03, 1.8), 'boulder', 0, .55, ES, 0, 0, 0, .45);
  if (carved) { for (const [x, y, rad, cw] of [[-.75, .62, .3, 1], [-.12, .6, .26, -1], [.6, .66, .32, 1]]) put(spiral(rad, 4, cw), 'groove', x, y, ES + .46);
    put(new THREE.BoxGeometry(.03, .85, .03), 'groove', .22, .6, ES + .47);
    for (const [x, y, rad, cw] of [[-.26, 1.35, .22, 1], [.26, 1.35, .22, -1], [0, 1.78, .22, 1]]) put(spiral(rad, 3, cw), 'groove', x, FY + y - .4, -3.4 * S + .02, 0, 0, 0);
    for (let k = 0; k < 4; k++) { const d = new THREE.TorusGeometry(.16, .012, 3, 4); d.scale(1, 1.5, 1); put(d, 'groove', HW + .04, 1.0 + k * .38, ZD - 4.1, 0, Math.PI / 2, 0); } }
  // the walk: round the entrance stone's east end, in at the door, up the passage, across the chamber to the back recess's mouth
  const path = [[3.0, ZD + 5], [3.0, ZD + 1.3], [0, ZD + .5], [0, ZM - .2], [.07, -1.5 * S]] /* off the vault's centre line, where a ray up meets the capstone's and the mound's fan centres edge-on */;
  const group = new THREE.Group(); let tris = 0; for (const [k, gs] of B) { const g = mergeGeometries(gs, false); gs.forEach(x => x.dispose()); const m = new THREE.Mesh(g, M[k]); m.name = k; m.castShadow = k !== 'groove'; m.receiveShadow = true; group.add(m); tris += g.attributes.position.count / 3; }
  return { group, tris: Math.round(tris), draws: group.children.length, top: +new THREE.Box3().setFromObject(group).max.y.toFixed(2), path, floorAt, door: { x0: -HW, x1: HW, z: +ZD.toFixed(2), lintel: LP }, passage: { w: W, len: +(ZD - ZM).toFixed(2), lintel: LP },
    chamber: { y: FY, vault: +VAULT.toFixed(2), s: S, back: -3.4 * S }, basins, kerb, carved, entrance: +ES.toFixed(2) };
}

// gatelandsCave(o, r) (Session 872, rebuilt larger and fuller in Session 882 on Michael's note to #313, "not expansive enough… underwhelming"):
//   a limestone cave with a lake under falls, OG-121's "natural caverns: stalactites, an underground lake under falls, strange flowers" and
//   the Gatelands' "limestone caves", OG-099's cave of blue pools and a bridge under waterfalls. Built to the person, a metre a unit, +z the mouth:
//   - the way in: a passage 22 m long that winds 2.5 m either side, 4.4 m wide and 3.6 m high, its floor at LH (4.5 m over the lake's shore);
//   - the hall: 64 m long, lofted ring by ring, 30 m across at its ends and 46 m in its middle (35 m at the floor), its crown 16 m over the
//     shore at the ends and 26 m in the middle; the rock moved by three sizes of noise (2.4 m, 0.7 m and the place's own 0.35 m), less near
//     the floor so the walls meet it cleanly; the ends close in rounded domes;
//   - the ledge: the passage comes out 4.5 m up on a rock ledge across the hall's near end, a balcony over the lake, and a ramp of rock
//     runs down the east wall to the shore (1 in 4.4);
//   - the shore: an 11 m band down the east side, stepping down to the lake in three rimstone terraces of 0.25 m and 1.4 m with blue pools in their
//     dams (OG-099); the lake fills the west and the middle, its bed 4 m under the surface;
//   - the far shelf: a dry shelf on the west wall near the far end, reached by a natural bridge of rock that arches 0.8 m over the lake;
//   - the falls: a stream comes through a swallow hole in the far dome and falls 18 m or more into the pool beyond the shelf, with mist;
//     the day comes down the shaft with it;
//   - the dressing: lumpy stalactites in clusters, stalagmites under some of them, five columns where the two have met, flowstone
//     curtains on the upper walls, fallen blocks on the shore and in the lake, and pale flowers that glow at the water's edge (o.flowers).
//   -> { group, tris, draws, top, path ([x, z]), walkY(x, z), floor (the shore, 0), ledge (LH), lake { x0, x1, z0, z1, y, deep },
//        falls { x, z, top, foot }, shaft { x, z, r, top, cut }, mouth { x0, x1, y0, h }, flowers, chamber { x0, x1, z0, z1, h },
//        bridge { x0, x1, z, deck, under }, columns ([x, z, r]), hall { width, height } }
let VM = null;
function caveMats() {
  if (VM) return VM; const M = mats();
  VM = { ...M, lime: mat('rock', { ns: 1.5, color: 0xb8b4a8, rough: .9 }), limeWet: mat('rock', { ns: 1.6, color: 0x9a988e, rough: .4 }), bed: mat('rock', { ns: 1.2, color: 0x6a7a74, rough: .8 }),
    drip: mat('rock', { ns: 1.0, color: 0xd8d2c0, rough: .6 }), lake: new THREE.MeshStandardMaterial({ color: 0x1a5a6a, roughness: .16, metalness: .1, transparent: true, opacity: .78, depthWrite: false }),
    pool: new THREE.MeshStandardMaterial({ color: 0x5ac8d0, emissive: new THREE.Color(.05, .22, .26), roughness: .2, metalness: .1, transparent: true, opacity: .82, depthWrite: false }),
    fall: new THREE.MeshStandardMaterial({ color: 0xd8eef4, emissive: new THREE.Color(.35, .5, .58), emissiveIntensity: .6, roughness: .2, transparent: true, opacity: .62, side: THREE.DoubleSide, depthWrite: false }),
    foam: new THREE.MeshStandardMaterial({ color: 0xf0f6f8, roughness: .5, transparent: true, opacity: .8, depthWrite: false }),
    mist: new THREE.MeshStandardMaterial({ color: 0xe8f2f6, emissive: new THREE.Color(.2, .26, .3), roughness: 1, transparent: true, opacity: .1, depthWrite: false }),
    petal: new THREE.MeshStandardMaterial({ color: 0xbfe6f0, emissive: new THREE.Color(.45, .8, 1), emissiveIntensity: 1.4, roughness: .5 }), stalk: new THREE.MeshStandardMaterial({ color: 0x4a6a5a, roughness: .8 }) };
  VM.lime.side = VM.limeWet.side = VM.drip.side = THREE.DoubleSide; VM.skin = VM.lime; return VM;
}
// a tube lofted ring by ring: ring(i, j) gives the point of ring i (0..NS) at step j (0..NA-1, round the ring); inside winds it to face in.
// keep(centroid, i, j) drops faces (a cut); i and j are the quad's ring and step. Smooth normals, so a hall of rock reads as one surface.
function loft(NS, NA, ring, inside = true, keep = () => true) { const pos = [], idx = [];
  for (let i = 0; i <= NS; i++) for (let j = 0; j < NA; j++) pos.push(...ring(i, j));
  const c = new THREE.Vector3(); for (let i = 0; i < NS; i++) for (let j = 0; j < NA; j++) { const a = i * NA + j, b = i * NA + (j + 1) % NA, d = a + NA, e = b + NA;
    for (const t of [[a, b, d], [b, e, d]]) { c.set(0, 0, 0); for (const k of t) c.x += pos[k * 3] / 3, c.y += pos[k * 3 + 1] / 3, c.z += pos[k * 3 + 2] / 3; if (!keep(c, i, j)) continue; idx.push(...(inside ? t : [t[0], t[2], t[1]])); } }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals(); return g; }
// a lumpy lathe: a growth of limestone from radius r0 at its root to a point, bulging where the drip ran thicker
function growth(r, L, r0, segs = 7, rings = 7, blunt = false) { const pts = [], w = r() * 6; for (let k = 0; k <= rings; k++) { const t = k / rings, base = blunt ? Math.sqrt(Math.max(0, 1 - t ** 2.4)) : Math.pow(1 - t, 1.25), rad = k === rings ? 0 : r0 * base * (1 + .3 * Math.sin(t * 11 + w) * (1 - t)); pts.push(new THREE.Vector2(Math.max(rad, .002), t * L)); }
  const g = new THREE.LatheGeometry(pts, segs); return g; }
// caveHall(rk, F, ph, P) (Session 883, lifted out of gatelandsCave): a hall of rock lofted ring by ring along -z from P.Z0 for P.L, its half-width
//   P.RX(s) and its crown P.RY(s) over P.CY, P.RLOW below it, the ends rounded over P.E of its length; the rock moved by noise at three sizes and
//   nine alcoves and buttresses high on the side walls, the noise fading near the floor. -> the helpers its place builds with: ringAt(s, th),
//   hw(z) (the half-width at y 0), roofY(x, z), inHall(x, y, z, margin), taper, amp, big.
function caveHall(rk, F, ph, P) { const { Z0, L, CY, RLOW, RX, RY, E } = P;
  const taper = s => s < E ? Math.sqrt(Math.max(0, 1 - ((E - s) / E) ** 2)) : s > 1 - E ? Math.sqrt(Math.max(0, 1 - ((s - 1 + E) / E) ** 2)) : 1;
  const AL = Array.from({ length: 9 }, (_, k) => ({ s: .1 + .8 * (k + rk() * .8) / 9, th: k % 2 ? .25 + rk() * .7 : Math.PI - .25 - rk() * .7, d: (k % 3 === 2 ? -2.5 : 4 + rk() * 3.5), w: 5 + rk() * 5, a: .32 + rk() * .2 }));
  const bump = (x, y, z) => { const s = (Z0 - z) / L, th = Math.atan2((y - CY) / (y > CY ? RY(Math.min(1, Math.max(0, s))) : RLOW), x / RX(Math.min(1, Math.max(0, s)))); let b = 0; for (const a of AL) { const dth = Math.atan2(Math.sin(th - a.th), Math.cos(th - a.th)); b += a.d * Math.exp(-(((s - a.s) * L / a.w) ** 2) - (dth / a.a) ** 2); } return b; };
  const big = (x, y, z) => 4 * (Math.sin(x * .06 + ph[0]) * Math.sin(z * .075 + ph[1]) + .5 * Math.sin(y * .07 + z * .09 + ph[2])) + 1.2 * Math.sin(x * .2 + ph[3]) * Math.sin(z * .18 + ph[4]) * Math.sin(y * .22 + ph[5]) + .6 * Math.sin(x * .45 + ph[6]) * Math.sin(y * .5 + z * .41 + ph[7]) + bump(x, y, z);
  const amp = y => .1 + .9 * Math.min(1, Math.max(0, (y - 3) / 8)) ** 2;
  const ringBase = (s, th) => { const t = taper(s), sn = Math.sin(th); return [RX(s) * t * Math.cos(th), CY + (sn > 0 ? RY(s) : RLOW) * t * sn, Z0 - s * L]; };
  const ringAt = (s, th) => { const [x, y, z] = ringBase(s, th), n = big(x, y, z) * amp(y) * taper(s), [fx, fy, fz] = F(x, y, z), k = amp(y) * .6 + .4; return [x + Math.cos(th) * n + fx * k, y + Math.sin(th) * n + fy * k, z + fz * k]; };
  // the hall's half-width at the shore's height (no noise): where the ring crosses y 0
  const hw = z => RX((Z0 - z) / L) * Math.sqrt(1 - (CY / RLOW) ** 2);
  // the roof over (x, z): the ring's upper half where it passes over x (two steps of a fixed point)
  const roofY = (x, z) => { const s = Math.min(1 - E, Math.max(E, (Z0 - z) / L)); let th = Math.acos(Math.max(-1, Math.min(1, x / RX(s)))); for (let k = 0; k < 2; k++) { const p = ringBase(s, th), n = big(...p) * amp(p[1]); th = Math.acos(Math.max(-1, Math.min(1, x / (RX(s) + n)))); }
    return ringAt(s, th)[1]; };
  const inHall = (x, y, z, m) => { const s = (Z0 - z) / L; if (s <= 0 || s >= 1) return false; const t = taper(s); if (t < .05) return false; const ry = y > CY ? RY(s) : RLOW, q = Math.hypot(x / (RX(s) * t), (y - CY) / (ry * t)); return q < 1 - m / (RX(s) * t); };
  return { taper, ringBase, ringAt, hw, roofY, inHall, amp, big };
}
// iceMats() (Session 903): the cave's keys in the Mark's ice, so the one hall dresses either way: the rock blue-white glacier ice, glassy
// where it is wet; the drips icicles; the lake a frozen sheet (opaque, walkable to the eye); the falls frozen in place; the foam and the
// pools frozen white; the mist a thin ice fog; and snow, blown in at the mouth.
let VI = null;
function iceMats() {
  if (VI) return VI; const C = caveMats(), ice = (c, rough, o = {}) => { const m = mat('rock', { ns: o.ns ?? .6, color: c, rough }); m.side = THREE.DoubleSide; return m; };
  VI = { ...C, lime: ice(0x9ec4d8, .35), limeWet: ice(0x7aa6c4, .15), bed: ice(0x8aa8b8, .5, { ns: .8 }), drip: ice(0xc8e4f2, .12, { ns: .3 }),
    lake: new THREE.MeshStandardMaterial({ color: 0x9cc6da, roughness: .22, metalness: .05, transparent: true, opacity: .95 }), pool: new THREE.MeshStandardMaterial({ color: 0xd6eaf4, roughness: .3 }),
    fall: new THREE.MeshStandardMaterial({ color: 0xc4e2f0, emissive: new THREE.Color(.12, .22, .3), roughness: .15, transparent: true, opacity: .88, side: THREE.DoubleSide }),
    foam: new THREE.MeshStandardMaterial({ color: 0xeef4f8, roughness: .8 }), mist: new THREE.MeshStandardMaterial({ color: 0xe0eef6, emissive: new THREE.Color(.12, .16, .2), roughness: 1, transparent: true, opacity: .05, depthWrite: false }),
    snow: mat('plaster', { ns: .3, color: 0xf2f6fa, rough: .95 }) };
  VI.skin = VI.snow /* the dry shore under a dusting of snow */; return VI;
}
// markIceCave(o, r) (Session 903, card F8; OG-121's Mark panel, "ice caverns, snowed-in mouths"): gatelandsCave's very hall in the Mark's
//   ice (o.ice): the same lofted hall, passage, ledge, ramp, shore, bridge and shaft, the lake frozen, the falls frozen in their fall, no
//   flowers (nothing grows), snow drifted up the passage from the mouth. -> as gatelandsCave, with ice: true and snow (the drifts).
export function markIceCave(o = {}, r = stream('icecave')) { return gatelandsCave({ ...o, ice: true, flowers: false }, r); }
export function gatelandsCave(o = {}, r = stream('cave')) {
  const M = o.ice ? iceMats() : caveMats(), B = new Map(), flowersOn = !o.ice && o.flowers !== false;
  const put = (geo, key, x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0, uv = .6) => { const g = geo.index ? geo.toNonIndexed() : geo; for (const k of Object.keys(g.attributes)) if (!['position', 'normal'].includes(k)) g.deleteAttribute(k);
    if (!g.attributes.normal) g.computeVertexNormals();
    g.applyMatrix4(new THREE.Matrix4().compose(new THREE.Vector3(x, y, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(rx, ry, rz, 'YXZ')), new THREE.Vector3(1, 1, 1))); worldUV(g, uv);
    if (!B.has(key)) B.set(key, []); B.get(key).push(g); };
  const rk = stream(String(o.key || 'cave') + ':rock'), F = field(rk, .35), ph = Array.from({ length: 8 }, () => rk() * 9);
  const LH = 4.5, PL = 22, Z0 = -PL, L = 64, Z1 = Z0 - L, CY = 7, RLOW = 11, LY = -.9, DEEP = 4, E = 5 / L;
  // the hall (caveHall): half-width RX(s), crown RY(s) over CY, the ends rounded over 5 m
  const RX = s => 15 + 8 * Math.sin(Math.PI * s), RY = s => 9 + 10 * Math.sin(Math.PI * s);
  const NS = 128, NA = 112, { taper, ringAt, hw, roofY, inHall } = caveHall(rk, F, ph, { Z0, L, CY, RLOW, RX, RY, E });
  // the passage: its spine winds 2.5 m either side and runs on 6 m straight into the hall, where its faces inside the hall are dropped
  const SPX = z => z > Z0 ? 2.5 * Math.sin(Math.PI * z / PL) : 0, PRX = 2.4, PCY = LH + 1.6, PUP = 2.0, PLOW = 3.2;
  const inPassage = (x, y, z, m) => z < 2 && z > Z0 - 6 && Math.hypot((x - SPX(z)) / (PRX - m), (y - PCY) / ((y > PCY ? PUP : PLOW) - m)) < 1;
  const shaftS = .84, shaftTh = Math.PI * 100 / 180, SP = ringAt(shaftS, shaftTh), SX = SP[0], SZ = SP[2], SR = 2.2, ROOFS = SP[1];
  const inShaft = (x, z, m) => Math.hypot(x - SX, z - SZ) < SR + .9 - m;
  // the hall: its faces inside the passage's tube and under the shaft dropped
  put(loft(NS, NA, (i, j) => ringAt(i / NS, j / NA * Math.PI * 2), true, c => !inPassage(c.x, c.y, c.z, .4) && !(c.y > CY + 4 && inShaft(c.x, c.z, .5))), 'lime', 0, 0, 0, 0, 0, 0, .25);
  // the passage's tube, open at the mouth (z 0)
  put(loft(56, 36, (i, j) => { const z = 0 - i / 56 * (PL + 6), th = j / 36 * Math.PI * 2, sn = Math.sin(th), x = SPX(z) + PRX * Math.cos(th), y = PCY + (sn > 0 ? PUP : PLOW) * sn, [fx, fy, fz] = F(x, y, z); return [x + fx, y + fy * .6, z + fz * (i ? 1 : 0)]; }, true,
    c => !inHall(c.x, c.y, c.z, .5)), 'lime', 0, 0, 0, 0, 0, 0, .35);
  // the passage's floor: a ribbon along the spine at LH, out to the hall's near end
  { const pos = [], idx = []; for (let i = 0; i <= 44; i++) { const z = -i / 44 * PL; for (const s of [-2.9, -1, 1, 2.9]) pos.push(SPX(z) + s, LH, z); }
    for (let i = 0; i < 44; i++) for (let j = 0; j < 3; j++) { const a = i * 4 + j; idx.push(a, a + 1, a + 4, a + 1, a + 5, a + 4); }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals(); put(g, 'lime', 0, 0, 0, 0, 0, 0, .35); }
  // the floor of the hall: a height over (x, z). sd is how far inside the dry ground a point is (the east shore, the far shelf);
  // three terraces of 0.25 m over 2.4 m from its edge, then the lake's bed; the ledge across the near end at LH; the ramp down the east wall
  const SH0 = Z1 + 17, SH1 = Z1 + 29, wob = z => .6 * Math.sin(z * .45 + ph[0]) + .3 * Math.sin(z * 1.3 + ph[1]), sdOf = (x, z) => Math.max(x - (hw(z) - 11) + wob(z), Math.min(-6 - x + wob(z), z - SH0, SH1 - z));
  const floorY = (x, z) => { const sd = sdOf(x, z); let y;
    if (sd >= 0) y = 0; else if (sd > -4.2) y = -.25 * Math.ceil(-sd / 1.4 - 1e-6); else { const t = Math.min(1, (-sd - 4.2) / 4); y = -1.1 - (DEEP - .2 + LY + 1.1) * t * t * (3 - 2 * t); }
    const zr = Z0 - 7, zf = Z0 - 27; if (x > hw(z) - 7 && z < zr && z > zf - 1) { const ramp = LH * Math.max(0, (z - zf) / (zr - zf)), e = Math.min(1, (x - (hw(z) - 8)) / 1); y = Math.max(y, ramp * Math.min(1, Math.max(0, e))); }
    else if (x > hw(z) - 8 && x <= hw(z) - 7 && z < zr && z > zf) { const ramp = LH * (z - zf) / (zr - zf); y = Math.max(y, ramp * (x - (hw(z) - 8))); }
    if (z > zr) y = LH; else if (z > zr - 1.5) { const t = (z - (zr - 1.5)) / 1.5; y = Math.max(y, y + (LH - y) * t * t * (3 - 2 * t)); }
    return y; };
  { const X0 = -25, X1 = 25, NX = 100, NZ = 132, pos = [], idx = []; for (let j = 0; j <= NZ; j++) for (let i = 0; i <= NX; i++) { const x = X0 + (X1 - X0) * i / NX, z = Z0 - L * j / NZ, y = floorY(x, z); pos.push(x, y + (y > -.05 ? .012 * Math.sin(x * 3.1) * Math.sin(z * 2.7) : 0), z); }
    for (let j = 0; j < NZ; j++) for (let i = 0; i < NX; i++) { const a = j * (NX + 1) + i, b = a + 1, c = a + NX + 1, d = c + 1; idx.push(a, b, c, b, d, c); }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals(); put(g, 'bed', 0, 0, 0, 0, 0, 0, .3);
    const pos2 = []; for (let j = 0; j < NZ; j++) for (let i = 0; i < NX; i++) { const q = [[i, j], [i + 1, j], [i, j + 1], [i + 1, j], [i + 1, j + 1], [i, j + 1]].map(([a, b]) => b * (NX + 1) + a);
      if (q.every(k => pos[k * 3 + 1] > LY + .1)) for (const k of q) pos2.push(pos[k * 3], pos[k * 3 + 1] + .006, pos[k * 3 + 2]); }
    const g2 = new THREE.BufferGeometry(); g2.setAttribute('position', new THREE.Float32BufferAttribute(pos2, 3)); g2.computeVertexNormals(); put(g2, 'skin', 0, 0, 0, 0, 0, 0, .35); }
  put(new THREE.PlaneGeometry(52, L).rotateX(-Math.PI / 2), 'lake', 0, LY, Z0 - L / 2, 0, 0, 0, .1);
  // the shaft up from the swallow hole: a wet funnel, its foot just under the roof and wider than the hole cut in it
  { const H2 = 13, g = new THREE.CylinderGeometry(SR, SR + 1.8, H2, 24, 8, true), P = g.attributes.position; for (let i = 0; i < P.count; i++) { const [dx, , dz] = F(P.getX(i) + SX, P.getY(i) + ROOFS + 6, P.getZ(i) + SZ); P.setX(i, P.getX(i) + dx * .3); P.setZ(i, P.getZ(i) + dz * .3); }
    g.computeVertexNormals(); put(g, 'limeWet', SX, ROOFS - .2 + H2 / 2, SZ, 0, 0, 0, .4); }
  const shaftTop = ROOFS - .2 + 13;
  // the walk: the passage, the ledge, down the ramp, along the shore a third of the way in, over the bridge to the shelf, to the pool
  const ZB = Z1 + 23, path = []; for (let i = 0; i <= 11; i++) { const z = -i * 2; path.push([+SPX(z).toFixed(3), z]); }
  path.push([0, Z0 - 3], [hw(Z0 - 5) - 4.6, Z0 - 5]); for (let z = Z0 - 8; z > ZB - .1; z -= 4) path.push([+(hw(z) - (z > Z0 - 30 ? 4.6 : 5.5)).toFixed(3), z]);
  path.push([hw(ZB) - 5.5, ZB], [-9, ZB], [-9.5, SH0 + 1.5]);
  const nearPath = (x, z) => { let m = 99; for (let s = 0; s + 1 < path.length; s++) { const [x0, z0] = path[s], [x1, z1] = path[s + 1], dx = x1 - x0, dz = z1 - z0, t = Math.max(0, Math.min(1, ((x - x0) * dx + (z - z0) * dz) / (dx * dx + dz * dz || 1))); m = Math.min(m, Math.hypot(x - x0 - dx * t, z - z0 - dz * t)); } return m; };
  // the natural bridge: a lofted beam of rock from the east shore's edge to the shelf, its deck arching 0.8 m, its underside a flat arch over the water
  const BX0 = hw(ZB) - 11 + .6, BX1 = -6.6, deck = x => { const t = (BX0 - x) / (BX0 - BX1); return t < 0 || t > 1 ? -.3 : .03 + .77 * Math.sin(Math.PI * t); }, under = x => { const t = Math.min(1, Math.max(0, (BX0 - x) / (BX0 - BX1))); return LY - .9 + (.15 - LY + .9) * Math.sin(Math.PI * t) ** .6; };
  put(loft(40, 20, (i, j) => { const x = BX0 + 1.6 - i / 40 * (BX0 - BX1 + 3.2), th = j / 20 * Math.PI * 2, c = Math.cos(th), sn = Math.sin(th), tp = deck(Math.min(BX0, Math.max(BX1, x))) - (x > BX0 || x < BX1 ? .5 * Math.min(1.6, Math.abs(x > BX0 ? x - BX0 : BX1 - x)) : 0), bt = under(x), mid = (tp + bt) / 2, hh = (tp - bt) / 2;
    const zz = 1.45 * Math.sign(c) * Math.abs(c) ** .45, yy = mid + hh * Math.sign(sn) * Math.abs(sn) ** .3, [fx, fy, fz] = F(x, yy, ZB + zz), side = 1 - Math.abs(sn) ** 4; return [x + fx * .4, yy + fy * .5 * side, ZB + zz + fz * side]; }, false), 'lime', 0, 0, 0, 0, 0, 0, .35);
  const walkY = (x, z) => { const y = floorY(x, z); return Math.abs(z - ZB) < 1.2 && x < BX0 + .2 && x > BX1 - .2 ? Math.max(y, deck(x)) : y; };
  // the falls: five ribbons from the swallow hole's lip to the pool, a little apart; foam and mist where they land
  const falls = { x: SX + .4, z: SZ, top: ROOFS + 1, foot: LY };
  for (let k = 0; k < 5; k++) { const w = 1.6 + r() * .9, g = new THREE.PlaneGeometry(w, falls.top - LY, 2, 24), P = g.attributes.position; for (let i = 0; i < P.count; i++) { const v = (P.getY(i) + (falls.top - LY) / 2) / (falls.top - LY); P.setZ(i, .25 * Math.sin(P.getY(i) * .7 + k * 2) + .6 * (1 - v) ** 2); P.setX(i, P.getX(i) * (1 + .5 * (1 - v))); }
    g.computeVertexNormals(); put(g, 'fall', falls.x + (k - 2) * .5, (falls.top + LY) / 2, falls.z + (k - 2) * .3, 0, k * .63, 0, .3); }
  for (let k = 0; k < 14; k++) { const a = k / 14 * Math.PI * 2, g = new THREE.SphereGeometry(.45 + r() * .3, 8, 5); g.scale(1.4, .25, 1.4); put(g, 'foam', falls.x + Math.cos(a) * 1.3, LY + .03, falls.z + Math.sin(a) * 1.3); }
  for (let k = 0; k < 9; k++) { const a = r() * Math.PI * 2, d = r() * 2.6, s = 1.6 + r() * 2.2, g = new THREE.SphereGeometry(s, 10, 6); g.scale(1, .55, 1); put(g, 'mist', falls.x + Math.cos(a) * d, LY + .4 + r() * 2.4, falls.z + Math.sin(a) * d, 0, 0, 0, .1); }
  // columns: where a stalactite and a stalagmite have met, floor to roof; two in the lake, two on the shore against the wall, one on the shelf
  const columns = [[-8, Z0 - 22, 1.6], [-11, Z0 - 34, 2.2], [hw(Z0 - 34) - 1.6, Z0 - 34, 1.2], [hw(Z0 - 48) - 1.8, Z0 - 48, 1.4], [-15, SH1 - 3, 1.3]];
  for (const [x, z, rad] of columns) { const fy = floorY(x, z) - .6, ry = roofY(x, z) + .8, h = ry - fy, pts = []; for (let k = 0; k <= 16; k++) { const t = k / 16, waist = .45 + .55 * (Math.abs(t - .55) / .55) ** 1.6; pts.push(new THREE.Vector2(rad * waist * (1 + .14 * Math.sin(t * 23 + x)) * (1 + 1.4 * Math.max(0, .12 - t) + 1.2 * Math.max(0, t - .9)), t * h)); }
    const g = new THREE.LatheGeometry(pts, 24), P = g.attributes.position; for (let i = 0; i < P.count; i++) { const [dx, , dz] = F(P.getX(i) + x, P.getY(i) + fy, P.getZ(i) + z); const a = Math.atan2(P.getZ(i), P.getX(i)), fl = 1 + .1 * Math.sin(a * 7 + P.getY(i) * .4) + .05 * Math.sin(a * 13 - P.getY(i) * .9); P.setX(i, P.getX(i) * fl + dx * .7); P.setZ(i, P.getZ(i) * fl + dz * .7); } g.computeVertexNormals(); put(g, 'drip', x, fy, z, 0, r() * 6, 0, .35); }
  const clearOf = (x, z, m) => nearPath(x, z) > m && columns.every(([cx, cz, cr]) => Math.hypot(x - cx, z - cz) > cr + m) && !(Math.abs(z - ZB) < 1.6 + m && x < BX0 + m && x > BX1 - m);
  // stalactites in clusters, every tip 3 m or more over the floor under it; a stalagmite under one in three over dry ground
  const flowers = [], mites = []; for (let c = 0; c < 34; c++) { const cx = (r() * 2 - 1) * 18, cz = Z0 - 4 - r() * (L - 8); for (let k = 0; k < 9; k++) { const x = cx + (r() - .5) * 6, z = cz + (r() - .5) * 6; if (Math.abs(x) > hw(z) + 3 || inShaft(x, z, -1)) continue;
      const ry = roofY(x, z), Lg = .5 + r() ** 2 * 3.2, fy = walkY(x, z); if (ry - .3 - Lg < fy + 3) continue; const g = growth(r, Lg + .6, .1 + Lg * .09); g.rotateX(Math.PI); put(g, 'drip', x, ry + .6, z); /* its root 0.6 m inside the roof */
      if (fy > LY + .1 && r() < .38 && clearOf(x, z, 1.1)) mites.push([x, z, fy]); } }
  for (let k = 0; k < 70; k++) { const x = (r() * 2 - 1) * 16, z = Z0 - 9 - r() * (L - 12), fy = floorY(x, z); if (fy < LY + .1 || Math.abs(x) > hw(z) - 1 || !clearOf(x, z, 1.1)) continue; mites.push([x, z, fy]); if (mites.length > 60) break; }
  const OB = []; for (const [x, z, fy] of mites) { const Lg = .3 + r() ** 1.5 * 1.8; OB.push([x, z, .5 + Lg * .14]); const g = growth(r, Lg + .1, .16 + Lg * .14, 9, 9, true); put(g, 'drip', x, fy - .1, z); }
  // flowstone curtains: folded sheets hung on the upper walls, their hems scalloped
  for (let k = 0; k < 16; k++) { const s = .12 + r() * .76, side = k % 2 ? 1 : -1, th = side > 0 ? .5 + r() * .45 : Math.PI - .5 - r() * .45, p = ringAt(s, th), Lc = 3 + r() * 5, Wc = 2 + r() * 3;
    const g = new THREE.PlaneGeometry(Wc, Lc, 28, 10), P = g.attributes.position; for (let i = 0; i < P.count; i++) { const u = P.getX(i), v = P.getY(i), q = Math.max(0, 1 - Math.abs(2 * u / Wc)), hem = Lc * (.15 + .85 * q ** 1.4) + .3 * Math.sin(u * 5.1 + k) * q, top = Lc / 2, yy = top - (top - v) / Lc * hem;
      P.setY(i, yy); P.setZ(i, (.3 * Math.sin(u * 4.2 + k) + .1 * Math.sin(u * 11 + k)) * (.4 + (top - yy) / Lc)); }
    g.computeVertexNormals(); const ix = -Math.sign(p[0]) * .25; put(g, 'drip', p[0] + ix, p[1] - Lc / 2 + .3, p[2], 0, Math.PI / 2, 0, .4); }
  // fallen blocks: on the shore under the ledge's cliff, in the lake breaking its surface, on the shelf's edge
  for (let k = 0, n = 0; k < 120 && n < 22; k++) { const k0 = k * 1.7, x = (r() * 2 - 1) * 17, z = Z0 - 8 - r() * (L - 14), s = .8 + r() ** 2 * 2.6; if (Math.abs(x) > hw(z) - s || !clearOf(x, z, s + 1) || inShaft(x, z, -3)) continue; n++;
    const g = mergeVertices(new THREE.IcosahedronGeometry(s * .6, 2).deleteAttribute('normal').deleteAttribute('uv')), P = g.attributes.position, sx = 1 + r() * .7, sy = .55 + r() * .4; for (let i = 0; i < P.count; i++) { const vx = P.getX(i), vy = P.getY(i), vz = P.getZ(i), [dx, dy, dz] = F(vx * 3 + x, vy * 3, vz * 3 + z), q = Math.sin(vx * 4 + vz * 3 + k0), f = 1 + .18 * Math.sign(q) * Math.min(1, Math.abs(q) * 3); P.setXYZ(i, vx * sx * f + dx * .6 * s, vy * sy * f + dy * .4 * s, vz * f + dz * .6 * s); }
    g.computeVertexNormals(); OB.push([x, z, s * 1.4]); put(g, 'lime', x, floorY(x, z) + s * .15, z, r() * .3, r() * 6, r() * .3, .35); }
  // rimstone pools on the terraces: low lumpy dams holding blue water, down the east shore and round the shelf
  const GX = 50 / 100, GZ = L / 132, flat = (x, z, y) => { const i = Math.floor((x + 25) / GX), j = Math.floor((Z0 - z) / GZ); return [[0, 0], [1, 0], [0, 1], [1, 1]].every(([a, b]) => Math.abs(floorY(-25 + (i + a) * GX, Z0 - (j + b) * GZ) - y) < .01); };
  let pools = 0; for (let k = 0; k < 260 && pools < 30; k++) { const z = Z0 - 10 - r() * (L - 16), onShelf = r() < .25, tk = Math.floor(r() * 3) + .5, zz = onShelf ? SH0 + r() * (SH1 - SH0) : z, x = onShelf ? -6 + wob(zz) + 1.4 * tk : hw(z) - 11 - wob(z) - 1.4 * tk, fy = floorY(x, zz), rad = .3 + r() * .3;
    if (fy > -.05 || fy < -.8 || !clearOf(x, zz, rad + .4)) continue; pools++; const g = new THREE.TorusGeometry(rad, .07, 5, 18); g.rotateX(Math.PI / 2); g.scale(1, 1.8, 1); put(g, 'drip', x, fy + .06, zz);
    put(new THREE.CircleGeometry(rad, 18).rotateX(-Math.PI / 2), 'pool', x, fy + .1, zz, 0, 0, 0, .3);
    if (flowersOn && r() < .55) for (let f = 0; f < 7; f++) { const a = r() * Math.PI * 2, fx = x + Math.cos(a) * (rad + .15 + r() * .3), fz = zz + Math.sin(a) * (rad + .15 + r() * .3), h = .15 + r() * .25, gy = floorY(fx, fz); if (!flat(fx, fz, fy) || nearPath(fx, fz) < .5 || OB.some(([ox, oz, or]) => Math.hypot(fx - ox, fz - oz) < or)) continue;
      put(new THREE.CylinderGeometry(.008, .01, h, 4), 'stalk', fx, gy + h / 2, fz); put(new THREE.SphereGeometry(.045, 7, 5).scale(1, .6, 1), 'petal', fx, gy + h + .02, fz); flowers.push([+fx.toFixed(2), +(gy + h + .02).toFixed(2), +fz.toFixed(2), +gy.toFixed(3)]); } }
  // o.ice: snow blown in at the mouth, drifts along the passage's floor thinning inward over its first 9 m, banked against its walls
  const snow = []; if (o.ice) { const rs = stream(String(o.key || 'cave') + ':snow'); for (let k = 0; k < 46; k++) { const z = -Math.pow(rs(), 1.6) * 9, side = rs() < .5 ? -1 : 1, x = SPX(z) + side * (1.2 + rs() * 1.5), d = 1 - (-z / 9), s = .5 + rs() * 1.1 * d;
      const g = new THREE.SphereGeometry(s, 10, 6, 0, Math.PI * 2, 0, Math.PI / 2); g.scale(1.6, .32 * d + .06, 1.2); put(g, 'snow', x, LH - .02, z, 0, rs() * 6, 0, .4); snow.push([+x.toFixed(2), +z.toFixed(2), +s.toFixed(2)]); }
    { const g = new THREE.PlaneGeometry(5.6, 6, 8, 10), P = g.attributes.position; for (let i = 0; i < P.count; i++) P.setZ(i, .05 + .1 * Math.max(0, (P.getY(i) + 3) / 6) * (1 - Math.abs(P.getX(i)) / 3)); g.rotateX(-Math.PI / 2); g.computeVertexNormals(); put(g, 'snow', SPX(-3), LH, -3, 0, 0, 0, .4); } }
  const group = new THREE.Group(); let tris = 0; for (const [k, gs] of B) { const g = mergeGeometries(gs, false); gs.forEach(x => x.dispose()); const m = new THREE.Mesh(g, M[k]); m.name = k; m.castShadow = !['lake', 'pool', 'fall', 'foam', 'mist', 'petal'].includes(k); m.receiveShadow = true; group.add(m); tris += g.attributes.position.count / 3; }
  const zm = Z0 - L / 2;
  return { group, tris: Math.round(tris), draws: group.children.length, top: +new THREE.Box3().setFromObject(group).max.y.toFixed(2), path, walkY, floor: 0, ledge: LH, lake: { x0: -hw(zm), x1: hw(zm) - 11 - 4.2, z0: Z0 - 9, z1: SH1, y: LY, deep: DEEP },
    falls, shaft: { x: SX, z: SZ, r: SR, top: shaftTop, cut: SR + .9 }, mouth: { x0: -PRX, x1: PRX, y0: LH, h: PUP + 1.6 }, flowers, chamber: { x0: -RX(.5), x1: RX(.5), z0: Z0, z1: Z1, h: CY + RY(.5) },
    bridge: { x0: BX0, x1: BX1, z: ZB, deck: .8, under: +(under((BX0 + BX1) / 2)).toFixed(2) }, columns, pools, ice: !!o.ice, snow };
}
// smugglersLair(o, r) (Session 873, Michael's 3 A on #305; rebuilt in Session 883 on his A on #314 and its note, "the size here is pretty
//   underwhelming, as is the lack of detail in general"): OG-121's "smugglers' and bandits' lairs: plank platforms in a cave, storerooms,
//   escape routes", as a sea cave on the Gatelands' coast with its own landing. Built to the person, +z the landward way in, the sea at y 0:
//   - the way in from the land: a passage 18 m long that winds 2 m either side, 3.6 m wide and 2.9 m high, its floor at FY (1.2 m over the sea);
//   - the cave: caveHall's lofted rock, 52 m long, 26 m across at its ends and 38 m in its middle, its crown 13 to 19 m over the sea; the
//     walls dark and wet below the high-water line (1.6 m); open to the sea under an arch 13 m wide and 8 m high in the far dome;
//   - the landing: a shelf of rock at FY across the near end, with a storeroom of planks under a lean-to roof against the west wall (its
//     door facing the way in), a fire ring with a pot on a tripod and logs to sit on;
//   - the deck: planks on posts down the west wall for 32 m at FY, cargo stacked against the rock (crates, kegs, bales, a coil of rope, a
//     rack of oars), and over its near half a gallery 3.4 m up on its own posts, with a stair, a rail, two pallets to sleep on and a chest;
//   - the jetty: out from the deck to a T-head in the middle of the cave; the Gatelands sloop (ships.js) moored along it, bow to the sea, and
//     a rowing boat; a derrick on the T-head with its boom over the sloop's hatch and a net of cargo hanging from it;
//   - the escape: a ladder up the east wall from the landing to a ledge 6.2 m up and a tunnel 1.6 m wide away east;
//   - o.held (default true): the lair is in use, its lanterns lit and the fire burning (as #305's 2 A has a worked mine lit); false, dark,
//     the fire cold, the sloop gone.
//   -> { group, tris, draws, top, path, walkY, deck (FY), lamps, door, ladder { x, z, y0, y1 }, ledge, escape { y, x0, z, w, h, xPlane },
//        arch { w, h, z }, mouth { x, w, y0, h }, room, held, chamber, passage, hall { width, height }, ship { x, z, L, W } | null }
let LZ2 = null;
function lairMats() {
  if (LZ2) return LZ2; const M = mats();
  LZ2 = { ...M, cliff: mat('rock', { ns: 1.5, color: 0x6a6e6c, rough: .9 }), cliffWet: mat('rock', { ns: 1.7, color: 0x363c3a, rough: .55 }), sea: new THREE.MeshStandardMaterial({ color: 0x14404a, roughness: .2 /* at .05 the spot's highlight on it overflows to NaN, which the bloom spreads */, metalness: .1, transparent: true, opacity: .8, depthWrite: false }),
    seabed: mat('rock', { ns: 1.0, color: 0x3a4a44, rough: .9 }), crate: mat('wood', { ns: .9, color: 0x9a7a52, rough: .85 }), keg: mat('wood', { ns: 1.0, color: 0x6a4a2a, rough: .7 }),
    bale: mat('thatch', { ns: .8, color: 0x8a7a5a, rough: 1 }), hull: mat('wood', { ns: .8, color: 0x5a4632, rough: .7 }) };
  LZ2.cliff.side = LZ2.cliffWet.side = LZ2.hull.side = THREE.DoubleSide; return LZ2;
}
export function smugglersLair(o = {}, r = stream('lair')) {
  const M = lairMats(), B = new Map(), held = o.held !== false;
  const put = (geo, key, x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0, uv = .6) => { const g = geo.index ? geo.toNonIndexed() : geo; for (const k of Object.keys(g.attributes)) if (!['position', 'normal'].includes(k)) g.deleteAttribute(k);
    if (!g.attributes.normal) g.computeVertexNormals();
    g.applyMatrix4(new THREE.Matrix4().compose(new THREE.Vector3(x, y, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(rx, ry, rz, 'YXZ')), new THREE.Vector3(1, 1, 1))); worldUV(g, uv);
    if (!B.has(key)) B.set(key, []); B.get(key).push(g); };
  const bx = (key, x0, x1, y0, y1, z0, z1) => put(new THREE.BoxGeometry(x1 - x0, y1 - y0, z1 - z0), key, (x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2);
  const rod = (key, a, b, rad, seg = 6) => { const A = new THREE.Vector3(...a), Bv = new THREE.Vector3(...b), d = Bv.clone().sub(A), g = new THREE.CylinderGeometry(rad, rad, d.length(), seg); g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.clone().normalize())); const m = A.add(Bv).multiplyScalar(.5); put(g, key, m.x, m.y, m.z); };
  const rk = stream(String(o.key || 'lair') + ':rock'), F = field(rk, .32), ph = Array.from({ length: 8 }, () => rk() * 9);
  const FY = 1.2, PL = 18, Z0 = -PL, L = 52, Z1 = Z0 - L, CY = 4, RLOW = 8, E = 3 / L, AW2 = 6.5, AH = 8, HW = 1.6, LY = 6.2;
  const RX = s => 13 + 6 * Math.sin(Math.PI * s), RY = s => 9 + 6 * Math.sin(Math.PI * s);
  const { ringAt, hw, roofY, inHall } = caveHall(rk, F, ph, { Z0, L, CY, RLOW, RX, RY, E });
  // the way in: a winding tube at FY that ends 0.6 m past the near dome's tip, where the dome is cut for it a little smaller than the tube
  const SPX = z => z > Z0 ? 2 * Math.sin(Math.PI * z / PL) : 0, PRX = 1.95, PCY = FY + 1.3, PUP = 1.6, PLOW = 2.4, PEND = Z0 - .6;
  const inPassage = (x, y, z, m) => z < 2 && z > Z0 - 5 && Math.hypot((x - SPX(z)) / (PRX - m), (y - PCY) / ((y > PCY ? PUP : PLOW) - m)) < 1;
  // the escape: a tube east from the ledge, starting 0.4 m inside the east wall where the wall is nearest across the tube's height
  //   (of the places along the landing, the one where the wall's x varies least over the tube's height, so the tube does not stand out of an alcove)
  const TRX = .95, TCY = LY + 1.1, TUP = 1.25, TLOW = 1.8, wallXs = z => [-TRX, 0, TRX].flatMap(dz => Array.from({ length: 61 }, (_, k) => ringAt((Z0 - z - dz) / L, -.9 + k * .03))).filter(p => p[1] > LY - .3 && p[1] < TCY + TUP + .3).map(p => p[0]);
  const ZL = Array.from({ length: 9 }, (_, k) => Z0 - 8 - k * .5).map(z => { const xs = wallXs(z); return [z, Math.max(...xs) - Math.min(...xs)]; }).sort((a, b) => a[1] - b[1])[0][0];
  // the east wall's x at (y, z), by bisection on the ring's angle; the tube's every ring is set off from it, so its mouth lies on the rock
  const wallX = (y, z) => { const s = (Z0 - z) / L; let a = -1.3, b = 1.3; for (let k = 0; k < 24; k++) { const m = (a + b) / 2; if (ringAt(s, m)[1] < y) a = m; else b = m; } return ringAt(s, (a + b) / 2)[0]; }, XW = wallX(LY + .5, ZL), XL = XW - .4;
  const inTunnel = (x, y, z, m) => x > XW - 3 && Math.hypot((z - ZL) / (TRX - m), (y - TCY) / ((y > TCY ? TUP : TLOW) - m)) < 1;
  const inArch = (c, m) => (Z0 - c.z) / L > .86 && (c.x / (AW2 - m)) ** 2 + (c.y / (AH - m)) ** 2 < 1;
  const keepHall = c => !inPassage(c.x, c.y, c.z, .4) && !inTunnel(c.x, c.y, c.z, .3) && !inArch(c, 0);
  const sOf = u => u - .8 * Math.sin(2 * Math.PI * u) / (2 * Math.PI) /* rings five times closer at the ends, where the domes close */;
  for (const wet of [true, false]) put(loft(104, 96, (i, j) => ringAt(sOf(i / 104), j / 96 * Math.PI * 2), true, (c, i, j) => keepHall(c) && (CY + RLOW * Math.sin((j + .5) / 96 * Math.PI * 2) < HW) === wet) /* the high-water line follows a ring step, not the faces' centres */, wet ? 'cliffWet' : 'cliff', 0, 0, 0, 0, 0, 0, .25);
  put(loft(40, 30, (i, j) => { const z = -i / 40 * (PL + .6), th = j / 30 * Math.PI * 2, sn = Math.sin(th), x = SPX(z) + PRX * Math.cos(th), y = PCY + (sn > 0 ? PUP : PLOW) * sn, [fx, fy, fz] = F(x, y, z); return [x + fx, y + fy * .6, z + fz * (i && i < 40 ? 1 : 0)]; }, true), 'cliff', 0, 0, 0, 0, 0, 0, .35);
  put(loft(24, 24, (i, j) => { const th = j / 24 * Math.PI * 2, sn = Math.sin(th), z = ZL + TRX * Math.cos(th), y = TCY + (sn > 0 ? TUP : TLOW) * sn, x = wallX(Math.max(y, LY - .2), z) - .3 + i / 24 * 10.5, [fx, fy, fz] = F(x, y, z); return [x + fx * (i && i < 24 ? 1 : 0), y + fy * .5, z + fz * .6]; }, true), 'cliff', 0, 0, 0, 0, 0, 0, .35);
  for (const [z0, z1, xc, w, y] of [[0, -PL, null, 2.4, FY]]) { const pos = [], idx = []; for (let i = 0; i <= 36; i++) { const z = z0 + (z1 - z0) * i / 36; for (const s of [-w, -.8, .8, w]) pos.push(SPX(z) + s, y, z); } for (let i = 0; i < 36; i++) for (let j = 0; j < 3; j++) { const a = i * 4 + j; idx.push(a, a + 1, a + 4, a + 1, a + 5, a + 4); }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals(); put(g, 'cliff', 0, 0, 0, 0, 0, 0, .35); }
  const LX0 = Math.min(...[ZL - .5, ZL, ZL + .4].flatMap(z => [FY + .2, FY + 2, LY - .5].map(y => wallX(y, z)))) - .3; bx('cliff', LX0, XW + 10.5, LY - .3, LY, ZL - 1.3, ZL + 1.3);
  { const sh = new THREE.Shape(); sh.moveTo(LX0, LY - .3); sh.lineTo(XW + 1.5, LY - .3); sh.lineTo(XW + 1.5, LY - 4.5); sh.lineTo(LX0, LY - .3); const g = mergeVertices(new THREE.ExtrudeGeometry(sh, { depth: 2.4, bevelEnabled: false, steps: 6 }).deleteAttribute('normal').deleteAttribute('uv')), P = g.attributes.position; /* a corbel of rock under the ledge, its foot in the wall */
    for (let i = 0; i < P.count; i++) { const [dx, dy, dz] = F(P.getX(i) * 2, P.getY(i) * 2, P.getZ(i) * 2); P.setXYZ(i, P.getX(i) + dx * .5, P.getY(i) + (P.getY(i) < LY - .35 ? dy * .5 : 0), P.getZ(i) + dz * .4); } g.computeVertexNormals(); put(g, 'cliff', 0, 0, ZL - 1.2, 0, 0, 0, .35); }
  { const g = new THREE.TorusGeometry(1, .42, 10, 36), P = g.attributes.position; for (let i = 0; i < P.count; i++) { const x = P.getX(i), y = P.getY(i), z = P.getZ(i), a = Math.atan2(y, x), sx = PRX + .15, sy = Math.sin(a) > 0 ? PUP + .15 : PLOW, [fx, fy, fz] = F(x * 4, y * 4 + 9, z * 4); P.setXYZ(i, x * sx + fx * .9, y * sy + fy * .9, z * 1.3 + fz * .6); }
    g.computeVertexNormals(); put(g, 'cliff', SPX(PEND), PCY, PEND + .1, 0, 0, 0, .35); }
  // the floor: the landing shelf at FY across the near end, its edge ragged; the sea's bed below, shallower by the walls
  const wob = x => .8 * Math.sin(x * .5 + ph[2]) + .4 * Math.sin(x * 1.3 + ph[3]), SHZ = Z0 - 7;
  // (and a strip of rock 5 m wide along the east wall to Z0 - 14, where the ladder stands)
  const floorY = (x, z) => { const e = Math.max(z - (SHZ + wob(x)), Math.min(z - (Z0 - 14 + .5 * wob(x)), x - (hw(z) - 5 + .4 * wob(z * 1.7)))); if (e > 0) return FY; const t = Math.min(1, -e / 2.5), side = Math.min(1, Math.max(0, (Math.abs(x) - (hw(z) - 6)) / 5)); return FY - (FY + 1.6) * Math.min(1, t * 1.6) - (1.9 - 1.6 * side) * Math.max(0, t * 1.6 - .6) / 1; };
  { const X0 = -22, X1 = 22, NX = 88, NZ = 104, pos = [], idx = []; for (let j = 0; j <= NZ; j++) for (let i = 0; i <= NX; i++) { const x = X0 + (X1 - X0) * i / NX, z = Z0 - L * j / NZ, y = floorY(x, z); pos.push(x, y + (y > FY - .05 ? .01 * Math.sin(x * 3.1) * Math.sin(z * 2.7) : 0), z); }
    for (let j = 0; j < NZ; j++) for (let i = 0; i < NX; i++) { const a = j * (NX + 1) + i, b = a + 1, c = a + NX + 1, d = c + 1; idx.push(a, b, c, b, d, c); }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals(); put(g, 'seabed', 0, 0, 0, 0, 0, 0, .3);
    const pos2 = []; for (let j = 0; j < NZ; j++) for (let i = 0; i < NX; i++) { const q = [[i, j], [i + 1, j], [i, j + 1], [i + 1, j], [i + 1, j + 1], [i, j + 1]].map(([a, b]) => b * (NX + 1) + a); if (q.every(k => pos[k * 3 + 1] > .05)) for (const k of q) pos2.push(pos[k * 3], pos[k * 3 + 1] + .005, pos[k * 3 + 2]); }
    const g2 = new THREE.BufferGeometry(); g2.setAttribute('position', new THREE.Float32BufferAttribute(pos2, 3)); g2.computeVertexNormals(); put(g2, 'cliff', 0, 0, 0, 0, 0, 0, .35); }
  put(new THREE.PlaneGeometry(60, L + 80).rotateX(-Math.PI / 2), 'sea', 0, 0, Z0 - (L + 80) / 2 + 2, 0, 0, 0, .1);
  // the deck down the west wall on posts, run 1 m into the rock; planks laid edge to edge, across it
  const DW = 4.2, DZ0 = SHZ + 1.6, DZ1 = Z0 - 40, JZ = Z0 - 27, JW = 1.2, TX = 0, TH0 = JZ - 6, TH1 = JZ + 5;
  const deckX = z => -hw(z) + DW;
  for (let z = DZ0; z > DZ1 + .01; z -= .26) { const zc = z - .13; bx('plank', -hw(zc) - 1, deckX(zc), FY - .05, FY, Math.max(z - .262, DZ1), z); }
  for (let z = DZ0 - .6; z > DZ1; z -= 2.2) { for (const x of [-hw(z) + .6, deckX(z) - .2]) bx('timber', x - .13, x + .13, -3.5, FY - .05, z - .13, z + .13); bx('timber', -hw(z) - .5, deckX(z), FY - .27, FY - .05, z - .1, z + .1); }
  // the jetty's arm out to the T-head, and the T-head along z; the head's corner posts stand up as bollards
  for (let x = deckX(JZ) - .3; x < TX - JW + .01; x += .26) bx('plank', x, Math.min(x + .262, TX - JW), FY - .05, FY, JZ - JW, JZ + JW);
  for (let z = TH1; z > TH0 + .01; z -= .26) bx('plank', TX - JW, TX + JW, FY - .05, FY, Math.max(z - .262, TH0), z);
  for (let x = deckX(JZ) + 1.5; x < TX - JW; x += 2.4) for (const z of [JZ - JW + .15, JZ + JW - .15]) bx('timber', x - .12, x + .12, -3.5, FY - .05, z - .12, z + .12);
  for (let z = TH1 - .2; z > TH0; z -= 2.2) for (const x of [TX - JW + .15, TX + JW - .15]) { const end = z > TH1 - .5 || z - 2.2 <= TH0; bx('timber', x - .13, x + .13, -3.5, end ? FY + .7 : FY - .05, z - .13, z + .13); }
  // the sloop alongside the T-head, bow to the sea; gone when the lair is abandoned
  let ship = null; if (held) { const S = gatelandsSloop({ harp: false }, stream(String(o.key || 'lair') + ':sloop')), sx = TX + JW + .35 + 2.2; S.group.rotation.y = Math.PI; { const sail = S.group.getObjectByName('sail'), bb = new THREE.Box3().setFromObject(sail), n = sail.geometry.attributes.position.count / 3; S.group.remove(sail); S.tris -= n; /* furled on its yard in harbour */
      const furl = new THREE.Mesh(new THREE.CylinderGeometry(.2, .2, bb.max.x - bb.min.x - .2, 10).rotateZ(Math.PI / 2), sail.material); furl.position.set((bb.min.x + bb.max.x) / 2, bb.max.y - .28, (bb.min.z + bb.max.z) / 2 - .05); furl.name = 'sail'; furl.castShadow = true; S.group.add(furl); S.tris += 40; } S.group.position.set(sx, 0, JZ - .5); ship = { x: sx, z: JZ - .5, L: 13, W: 4.4, group: S.group, tris: S.tris, draws: S.draws };
    rod('rope', [TX + JW - .15, FY + .6, TH1 - .3], [sx - 1.6, 1.4, JZ - .5 + 5.4], .02); rod('rope', [TX + JW - .15, FY + .6, TH0 + .3], [sx - 1.4, 1.3, JZ - .5 - 5.6], .02); }
  // the rowing boat off the T-head's west side: a lathe shell, a gunwale, thwarts and oars
  const boat = { x: TX - JW - 1.2, z: JZ - 3.8, L: 4.2 };
  { const bx0 = boat.x, bz = boat.z, BL = boat.L, W2 = .75, pts = []; for (let k = 0; k <= 10; k++) { const t = k / 10; pts.push(new THREE.Vector2(Math.sin(Math.PI * t) ** .6 * W2 + .05, (t - .5) * BL)); }
    const g = new THREE.LatheGeometry(pts, 14, -Math.PI / 2, Math.PI); g.rotateX(Math.PI / 2); g.scale(1, .55, 1); put(g, 'hull', bx0, .25, bz, 0, 0, 0, .5); /* the lathe's lower half, a bowl along z (Session 920: it was split along its length and turned across the boat) */
    for (const s of [-1, 1]) { const gp = []; for (let k = 0; k <= 10; k++) { const t = k / 10; gp.push(new THREE.Vector3(bx0 + s * (Math.sin(Math.PI * t) ** .6 * W2 + .05), .26, bz + (t - .5) * BL)); } put(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(gp), 16, .035, 5), 'timber'); }
    for (const dz of [-.8, .5]) bx('timber', bx0 - .7, bx0 + .7, .08, .13, bz + dz - .1, bz + dz + .1); rod('timber', [bx0 - .3, .18, bz - 1.4], [bx0 + .1, .2, bz + 1.3], .03); rod('rope', [bx0, .3, bz + 2.1], [TX - JW + .15, FY + .6, TH0 + .3], .015); }
  // the derrick on the T-head: a mast, a boom out over the sloop's hatch, the fall and a net of cargo hanging from it
  { const dx = TX, dz = JZ + 2.6, top = FY + 6, bend = [dx + 4.3, FY + 4.4, dz - 2.0]; rod('timber', [dx, FY, dz], [dx, top, dz], .14, 8); rod('timber', [dx + .1, FY + 1.2, dz], bend, .09); rod('rope', [dx, top, dz], bend, .018); rod('rope', bend, [bend[0], FY + 1.9, bend[2]], .02);
    const n = new THREE.SphereGeometry(.65, 10, 8); n.scale(1, .85, 1); put(n, 'basket', bend[0], FY + 1.35, bend[2]); }
  // the landing: a storeroom of planks with a lean-to roof against the west wall, its door facing the way in; inside, crates, kegs, a bale
  const RZ0 = Z0 - 1.2, RZ1 = SHZ + 2.6, rx0 = -hw((RZ0 + RZ1) / 2) - .8, room = { x0: rx0, x1: rx0 + 5.2, z0: RZ1, z1: RZ0 }, door = { x: room.x1, z: (room.z0 + room.z1) / 2, w: 1.0, h: 2.0 };
  { const wall = (x0, x1, z0, z1, h0, h1, hole) => { const Lw = Math.hypot(x1 - x0, z1 - z0), s = new THREE.Shape(); s.moveTo(0, 0); s.lineTo(Lw, 0); s.lineTo(Lw, h1); s.lineTo(0, h0); s.lineTo(0, 0);
      if (hole) { const p = new THREE.Path(), c = hole; p.moveTo(c - door.w / 2, 0); p.lineTo(c + door.w / 2, 0); p.lineTo(c + door.w / 2, door.h); p.lineTo(c - door.w / 2, door.h); p.lineTo(c - door.w / 2, 0); s.holes.push(p); }
      const g = new THREE.ExtrudeGeometry(s, { depth: .06, bevelEnabled: false }); put(g, 'plank', x0, FY, z0, 0, Math.atan2(x1 - x0, z1 - z0) - Math.PI / 2, 0, .7); };
    const HB = 3.2, HF = 2.45; wall(room.x1, room.x1, room.z1, room.z0, HF, HF, room.z1 - door.z); wall(room.x0, room.x1, room.z0, room.z0, HB, HF); wall(room.x1, room.x0, room.z1 + .06, room.z1 + .06, HF, HB);
    { const Lr = room.x1 + .5 - room.x0, ang = Math.atan2(HB - HF, Lr); for (let z = room.z1 + .3; z > room.z0 - .3; z -= .3) put(new THREE.BoxGeometry(Math.hypot(Lr, HB - HF) + .1, .05, .3), 'plank', (room.x0 + room.x1 + .5) / 2, FY + (HB + HF) / 2 + .06, z - .15, 0, 0, -ang); }
    for (let k = 0; k < 12; k++) { const s = .5 + r() * .25, x = room.x0 + 1.2 + (k % 4) * .78, z = room.z0 + .5 + Math.floor(k / 4) * .8; if (z > room.z1 - 1.1 || x > room.x1 - 1.4) continue; bx('crate', x - s / 2, x + s / 2, FY, FY + s, z - s / 2, z + s / 2); if (k % 2) bx('crate', x - s / 2 + .05, x + s / 2 - .05, FY + s, FY + s + .4, z - s / 2 + .05, z + s / 2 - .05); }
    for (let k = 0; k < 4; k++) put(new THREE.CylinderGeometry(.22, .2, .6, 12), 'keg', room.x0 + 1.4 + k * .5, FY + .3, room.z1 - .45); put(new THREE.BoxGeometry(.9, .5, .6), 'bale', room.x1 - .8, FY + .25, room.z0 + .45); }
  // the fire on the landing: a ring of stones, the embers (or cold ash), a tripod and its pot, logs to sit on
  const FX = 3.2, FZ = Z0 - 3.4; for (let k = 0; k < 10; k++) { const a = k / 10 * Math.PI * 2, g = new THREE.IcosahedronGeometry(.17 + r() * .06, 1); g.scale(1.2, .7, 1); put(g, 'spoil', FX + Math.cos(a) * .62, FY + .08, FZ + Math.sin(a) * .62); }
  for (let k = 0; k < 5; k++) put(new THREE.CylinderGeometry(.05, .06, .9, 6).rotateZ(Math.PI / 2), held ? 'horn' : 'spoil', FX + (r() - .5) * .3, FY + .08, FZ + (r() - .5) * .3, 0, k * 1.2, 0);
  for (const a of [0, 2.1, 4.2]) rod('iron', [FX + Math.cos(a) * .55, FY, FZ + Math.sin(a) * .55], [FX, FY + 1.3, FZ], .018); rod('iron', [FX, FY + 1.3, FZ], [FX, FY + .85, FZ], .008);
  put(new THREE.SphereGeometry(.2, 12, 8, 0, Math.PI * 2, Math.PI / 2.4, Math.PI / 1.7), 'iron', FX, FY + .72, FZ);
  for (const [dx, dz, a] of [[-1.6, .3, .3], [1.5, -.6, 1.9]]) put(new THREE.CylinderGeometry(.18, .2, 1.5, 9).rotateZ(Math.PI / 2), 'timber', FX + dx, FY + .18, FZ + dz, 0, a, 0);
  // cargo against the rock along the deck: crates, kegs, bales, a coil of rope, a rack of oars
  for (let z = DZ0 - 1.5, k = 0; z > DZ1 + 1; z -= 1.1 + r() * 1.4, k++) { const x = -hw(z) + .75, kind = k % 4;
    if (kind === 0 || kind === 2) { const s = .55 + r() * .2; bx('crate', x - s / 2, x + s / 2, FY, FY + s, z - s / 2, z + s / 2); if (r() < .6) bx('crate', x - s / 2 + .04, x + s / 2 - .04, FY + s, FY + s * 1.8, z - s / 2 + .04, z + s / 2 - .04); }
    else if (kind === 1) for (let q = 0; q < 2; q++) put(new THREE.CylinderGeometry(.24, .22, .66, 12), 'keg', x - .1, FY + .33, z + (q - .5) * .5); else put(new THREE.BoxGeometry(.6, .5, .9), 'bale', x - .05, FY + .25, z); }
  put(new THREE.TorusGeometry(.32, .07, 6, 16).rotateX(Math.PI / 2).scale(1, 2.2, 1), 'rope', deckX(JZ - 3) - .7, FY + .16, JZ - 3);
  { const ox = -hw(Z0 - 22) + .35, oz = Z0 - 22; for (let k = 0; k < 6; k++) rod('timber', [ox + .1, FY, oz - .9 + k * .36], [ox - .05, FY + 3.4, oz - .9 + k * .36], .03); bx('timber', ox - .3, ox + .3, FY + 2.6, FY + 2.68, oz - 1.1, oz + 1.1); }
  // the gallery over the deck's near half: planks 3.4 m up on posts from the deck, a rail on the open side, a stair up, pallets and a chest
  const GY = FY + 3.4, GZ0 = DZ0 - 1.5, GZ1 = DZ0 - 11.5, GW = 3.4, gx = z => -hw(z) + GW;
  for (let z = GZ0; z > GZ1 + .01; z -= .26) { const zc = z - .13; bx('plank', -hw(zc) - 1, gx(zc), GY - .05, GY, Math.max(z - .262, GZ1), z); }
  for (let z = GZ0 - .2; z > GZ1 - .1; z -= 2.5) { bx('timber', gx(z) - .3, gx(z) - .06, FY, GY - .05, z - .12, z + .12); bx('timber', -hw(z) - .5, gx(z), GY - .27, GY - .05, z - .1, z + .1); rod('timber', [gx(z) - .18, GY, z], [gx(z) - .18, GY + 1.0, z], .045); }
  { const pts = []; for (let z = GZ0; z >= GZ1 - .01; z -= 1) pts.push(new THREE.Vector3(gx(z) - .18, GY + 1.0, z)); put(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 24, .04, 5), 'timber'); }
  { const sz0 = GZ1 - 4.2, x0 = gx(GZ1) - 1.05; for (let k = 0; k < 17; k++) bx('plank', x0, x0 + .9, FY + (k + 1) * .2 - .05, FY + (k + 1) * .2, sz0 + k * .25, sz0 + k * .25 + .27); for (const s of [x0 - .05, x0 + .9]) rod('timber', [s + .03, FY, sz0], [s + .03, GY, GZ1], .05); }
  for (const dz of [-2, -5.5]) { put(new RoundedBoxGeometry(.8, .18, 1.9, 2, .06), 'bale', -hw(GZ0 + dz) + .9, GY + .09, GZ0 + dz); }
  bx('crate', -hw(GZ0 - 8.5) + .2, -hw(GZ0 - 8.5) + 1.0, GY, GY + .5, GZ0 - 8.9, GZ0 - 8.1);
  // the escape: the ladder up the east wall from the landing to the ledge
  const ladder = { x: Math.min(...[ZL - .5, ZL, ZL + .4].flatMap(z => [FY + .2, FY + 2, LY - .5].map(y => wallX(y, z)))) - .45, z: ZL - .1, y0: FY, y1: LY };
  { for (const s of [-.25, .25]) bx('timber', ladder.x - .05, ladder.x + .05, FY, LY + 1.0, ladder.z + s - .04, ladder.z + s + .04); for (let y = FY + .3; y < LY; y += .3) put(new THREE.CylinderGeometry(.02, .02, .5, 6).rotateX(Math.PI / 2), 'timber', ladder.x, y, ladder.z); }
  // rocks: blocks fallen on the shelf's edge and in the sea, some breaking the surface; a few short stalactites
  const pathPts = [];
  for (let k = 0, n = 0; k < 140 && n < 20; k++) { const x = (r() * 2 - 1) * 15, z = SHZ - 1 - r() * (L - 12), s = .7 + r() ** 2 * 2.4; if (Math.abs(x) > hw(z) - s * .5 || x < deckX(z) + s + .4 || (Math.abs(x - TX) < JW + s + 1 && z < TH1 + s && z > TH0 - s) || (ship && Math.abs(x - ship.x) < 2.2 + s + .3 && Math.abs(z - ship.z) < 7 + s) || (Math.abs(z - JZ) < JW + s && x < TX) || inArch({ x, y: 0, z }, -2)) continue; n++;
    const g = mergeVertices(new THREE.IcosahedronGeometry(s * .6, 2).deleteAttribute('normal').deleteAttribute('uv')), P = g.attributes.position, sx = 1 + r() * .7, sy = .6 + r() * .5; for (let i = 0; i < P.count; i++) { const vx = P.getX(i), vy = P.getY(i), vz = P.getZ(i), [dx, dy, dz] = F(vx * 3 + x, vy * 3, vz * 3 + z); P.setXYZ(i, vx * sx + dx * .6 * s, vy * sy + dy * .4 * s, vz + dz * .6 * s); }
    g.computeVertexNormals(); put(g, 'cliffWet', x, floorY(x, z) + s * .3, z, r() * .3, r() * 6, r() * .3, .35); }
  for (let k = 0; k < 40; k++) { const x = (r() * 2 - 1) * 12, z = Z0 - 3 - r() * (L - 10), ry = roofY(x, z), Lg = .3 + r() ** 2 * 1.4; if (Math.abs(x) > hw(z) || ry - Lg < GY + 3) continue; const g = growth(r, Lg + .5, .08 + Lg * .08); g.rotateX(Math.PI); put(g, 'cliff', x, ry + .5, z); }
  // the lanterns, lit while the lair is held: the passage's end, the storeroom's door, the ladder, the gallery, the deck, the T-head
  const lamps = []; const lamp = (x, y, z) => { put(new THREE.BoxGeometry(.04, .04, .3), 'iron', x, y + .25, z); if (!held) return; put(new THREE.BoxGeometry(.14, .2, .14), 'horn', x, y, z); put(new THREE.ConeGeometry(.1, .1, 4).rotateY(Math.PI / 4), 'iron', x, y + .15, z); lamps.push([x, y, z].map(v => +v.toFixed(2))); };
  lamp(SPX(Z0 + .3) + PRX - .5, FY + 1.9, Z0 + .3); lamp(room.x1 + .2, FY + 2.1, door.z - .8); lamp(ladder.x - .3, FY + 2.0, ladder.z + .9); lamp(-hw(GZ0 - 5) + .4, GY + 1.7, GZ0 - 5);
  lamp(deckX(JZ + 6) - .2, FY + 1.3, JZ + 6); lamp(deckX(DZ1 + 3) - .2, FY + 1.3, DZ1 + 3); lamp(TX - JW + .15, FY + 1.15, TH1 - .2); lamp(TX + JW - .15, FY + 1.15, TH0 + .2);
  // the walk: in from the land, across the landing, down the deck under the gallery, out along the jetty to the T-head's far end
  const path = []; for (let i = 0; i <= 9; i++) { const z = -i * 2; path.push([+SPX(z).toFixed(3), z]); }
  path.push([0, Z0 - 1.5], [deckX(SHZ) - 1.4, SHZ + .8]); for (let z = SHZ - 1; z > JZ + .5; z -= 2) path.push([+(-hw(z) + 2.3).toFixed(3), z]);
  path.push([-hw(JZ) + 2.3, JZ], [TX, JZ], [TX, TH0 + .7]);
  const walkY = () => FY;
  const group = new THREE.Group(); let tris = 0; for (const [k, gs] of B) { const g = mergeGeometries(gs, false); gs.forEach(x => x.dispose()); const m = new THREE.Mesh(g, M[k]); m.name = k; m.castShadow = !['flame', 'horn', 'sea'].includes(k); m.receiveShadow = true; group.add(m); tris += g.attributes.position.count / 3; }
  const draws = group.children.length; if (ship) { ship.group.name = 'ship'; group.add(ship.group); tris += ship.tris; }
  const zm = Z0 - L / 2;
  return { group, tris: Math.round(tris), draws: draws + (ship ? ship.draws : 0), top: +new THREE.Box3().setFromObject(group).max.y.toFixed(2), path, walkY, deck: FY, lamps, door, ladder, ledge: LY,
    escape: { y: LY, x0: XW, z: ZL, w: TRX * 2, h: TUP + 1.1, xPlane: XW + 10.5 }, arch: { w: AW2 * 2, h: AH, z: Z1 }, mouth: { x: SPX(0), w: PRX * 2, y0: FY, h: PUP + 1.3 }, room, held,
    chamber: { x0: -RX(.5), x1: RX(.5), z0: Z0, z1: Z1, h: CY + RY(.5) }, passage: { w: PRX * 2, h: PUP + 1.3 }, gallery: { y: GY, z0: GZ0, z1: GZ1 }, fire: { x: FX, z: FZ }, jetty: { x1: TX + JW, z: JZ, z0: TH0, z1: TH1 }, boat, ship: ship && { x: ship.x, z: ship.z, L: ship.L, W: ship.W } };
}

// aurenneAqueduct(o, r) (Session 907, card F8): a ruined aqueduct across a dry valley, OG-121's Aurenne panel ("aqueduct ruins") and
//   OG-124's "a ruined aqueduct", in Aurenne's own plaster and tile and not the boards' Tuscan stone (the row's note; canon §1.3). Built to
//   the person, a metre a unit; the aqueduct runs along x, the valley along z, its floor 20 m under the channel:
//   - the arcade: piers of 2.2 m on a pitch of 8.2 m, 6 m clear between them under round arches; two tiers where the valley is deep (the
//     lower 3.0 m thick, springing 14.5 m under the channel's bed, the upper 2.4 m thick, springing 6.5 m under it), one where it is not,
//     and a solid wall where the ground comes within 7.5 m of the bed. The faces are lime plaster over a brick core, fallen in patches; the
//     arches are rung in ashlar on impost blocks; a string course caps the lower tier, a cornice carries the channel, and a band of blue
//     glazed tile runs under the cornice on both faces;
//   - the channel: 1.2 m wide inside between walls of 0.55 m that stand 0.9 m over its bed, coped in slabs (some gone), lined in red
//     mortar and crusted pale to 0.3 m with the lime the water left; it is dry, and its covers are gone, so it is the walk;
//   - the ruin (o.broken, default true): the upper tier and the channel fallen over two bays east of the middle, the pier between them a
//     stump on the lower tier, the broken ends ragged, their blocks heaped in the valley under the gap; whole (false), it runs on across;
//   - the land: the valley in dry turf with a dry stream bed down its floor, pale rock, cypresses on its shoulders, a level terrace at
//     either end where the channel comes off the hill.
//   -> { group, tris, draws, top, path ([x, z], the walk at y 0: off the west terrace, in at the channel's open end, east to the break or,
//        whole, to the east end), ground(x, z), piers ([x, foot]), bays ([{ x0, x1, lower, upper }]), arch { pitch, pier, span, r, lowSpring,
//        upSpring, deck }, channel { w, wall, top, x0, x1 }, gap ({ x0, x1 } or null), broken }
let AQ = null;
function aqueductMats() {
  if (AQ) return AQ; aurenneTextures(); markTextures(); const std = (c, ro = .85) => new THREE.MeshStandardMaterial({ color: c, roughness: ro });
  AQ = { plaster: mat('plaster', { ns: .7, color: 0xe4d4b2, rough: .95 }), ashlar: mat('ashlar', { ns: .9, color: 0xfff6e2, rough: .9 }), cope: mat('limestone', { ns: 1.0, color: 0xf6ecd8, rough: .85 }), brick: mat('stone', { ns: 1.2, color: 0xb88a6c, rough: .95 }),
    lining: mat('plaster', { ns: .6, color: 0xb88a76, rough: .9 }), sinter: mat('plaster', { ns: .9, color: 0xf2ead6, rough: .8 }), zellige: mat('zellige', { ns: .6, rough: .3 }),
    ground: mat('turfDry', { ns: .4, color: 0xfff4cc, rough: 1 }), rock: mat('rock', { ns: 1.4, color: 0xcabca2, rough: .95 }), bed: mat('rock', { ns: 1.0, color: 0xb0a48c, rough: 1 }),
    leaf: std(0x2c4424, .9), bark: std(0x5a4632, .95) };
  return AQ;
}
export function aurenneAqueduct(o = {}, r = stream('aqueduct')) {
  const M = aqueductMats(), B = new Map(), broken = o.broken !== false, key = String(o.key || 'aqueduct');
  const put = (geo, k, x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0, uv = .5) => { const g = geo.index ? geo.toNonIndexed() : geo; for (const a of Object.keys(g.attributes)) if (!['position', 'normal', ...(uv === null ? ['uv'] : [])].includes(a)) g.deleteAttribute(a);
    g.applyMatrix4(new THREE.Matrix4().compose(new THREE.Vector3(x, y, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(rx, ry, rz, 'YXZ')), new THREE.Vector3(1, 1, 1))); if (uv !== null) worldUV(g, uv);
    if (!B.has(k)) B.set(k, []); B.get(k).push(g); };
  const PITCH = 8.2, PIER = 2.2, SPAN = PITCH - PIER, RAD = SPAN / 2, DECK = -1, LS = -14.5, US = -6.5, TIER = -10.5, SC = .35, DL = 3.0, DU = 2.4, HV = 54, DEEP = 20, NP = 6;
  const CW = 1.2, WT = .55, WH = .9, CX = 57, G0 = 62;
  // the ground: the valley's section along x, a dry stream bed at its floor; noise off the aqueduct's line, none within 6 m of it
  const F = field(stream(key + ':land'), .5), sec = x => { const a = Math.abs(x); return (a < HV ? -DEEP * (1 - (x / HV) ** 2) : 0) - .7 * Math.max(0, 1 - (x / 2.4) ** 2) + Math.max(0, a - G0) * .22; };
  const ground = (x, z) => { const w = Math.min(1, Math.max(0, (Math.abs(z) - 6) / 10)); return sec(x) + (w ? F(x, 0, z)[1] * w * 1.6 : 0); };
  { const X0 = -85, Z0 = -60, NX = 170, NZ = 120, pos = [], idx = [];
    for (let j = 0; j <= NZ; j++) for (let i = 0; i <= NX; i++) { const x = X0 + i, z = Z0 + j; pos.push(x, ground(x, z), z); }
    for (let j = 0; j < NZ; j++) for (let i = 0; i < NX; i++) { const a = j * (NX + 1) + i, b = a + 1, c = a + NX + 1, d = c + 1; idx.push(a, c, b, b, c, d); }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals(); put(g, 'ground', 0, 0, 0, 0, 0, 0, .55); }
  // the stream bed: gravel down the floor, dry
  put(new THREE.BoxGeometry(2.6, .1, 120), 'bed', 0, sec(0) + .02, 0, 0, 0, 0, .4);
  // the bays: which tiers open in each, by the highest ground under it
  const piers = [], bays = []; for (let k = -NP; k <= NP; k++) piers.push([k * PITCH, +sec(k * PITCH).toFixed(2)]);
  for (let k = 0; k + 1 < piers.length; k++) { const x0 = piers[k][0] + PIER / 2, x1 = piers[k + 1][0] - PIER / 2; let hi = -99; for (let s = 0; s <= 12; s++) hi = Math.max(hi, sec(x0 + (x1 - x0) * s / 12));
    bays.push({ x0: +x0.toFixed(2), x1: +x1.toFixed(2), lower: hi <= LS - 1, upper: hi <= US - 1, hi }); }
  const GAP = broken ? { p: 7, x0: piers[7][0] + PIER / 2, x1: piers[9][0] - PIER / 2 } : null /* the bays either side of the pier at x 16.4 */;
  const inGap = x => GAP && x > GAP.x0 - .01 && x < GAP.x1 + .01;
  const arc = (path, cx, ys, back) => { for (let s = 0; s <= 24; s++) { const a = back ? s / 24 * Math.PI : Math.PI - s / 24 * Math.PI; path.push(new THREE.Vector2(cx + Math.cos(a) * RAD * (back ? 1 : 1), ys + Math.sin(a) * RAD)); } };
  const hole = (x0, x1, ys, foot) => { const h = [new THREE.Vector2(x0, foot(x0)), new THREE.Vector2(x0, ys)]; arc(h, (x0 + x1) / 2, ys, false); h.push(new THREE.Vector2(x1, foot(x1)));
    for (let s = 11; s >= 1; s--) { const x = x0 + (x1 - x0) * s / 12; h.push(new THREE.Vector2(x, foot(x))); } return new THREE.Path(h.reverse()); }; /* counter-clockwise: the outlines are clockwise, and three.js re-winds holes only when it flips the outline */
  const extrude = (outline, holes, depth, k) => { const sh = new THREE.Shape(outline); sh.holes.push(...holes); const g = new THREE.ExtrudeGeometry(sh, { depth, bevelEnabled: false, curveSegments: 24 }); g.translate(0, 0, -depth / 2); put(g, k, 0, 0, 0, 0, 0, 0, .42); };
  const ring = (cx, ys, depth, k = 'ashlar') => { const sh = new THREE.Shape(), T = .55; sh.absarc(0, 0, RAD + T, 0, Math.PI, false); sh.absarc(0, 0, RAD, Math.PI, 0, true); const g = new THREE.ExtrudeGeometry(sh, { depth: depth + .08, bevelEnabled: false, curveSegments: 24 }); g.translate(cx, ys, -(depth + .08) / 2); put(g, k, 0, 0, 0, 0, 0, 0, .5);
    for (const e of [-1, 1]) put(new THREE.BoxGeometry(PIER * .5 + .25, .32, depth + .1), k, cx + e * (RAD + PIER * .25 - .12), ys - .16); };
  // the lower tier: from under the ground to the string course, wherever the ground falls below it
  const lowX = HV * Math.sqrt(1 - (TIER + .6) / -DEEP) - .01, foot = x => sec(x) - .6;
  { const out = [new THREE.Vector2(-lowX, TIER), new THREE.Vector2(lowX, TIER)]; for (let s = 1; s < 60; s++) { const x = lowX - 2 * lowX * s / 60; out.push(new THREE.Vector2(x, Math.min(TIER - .05, foot(x)))); }
    extrude(out, bays.filter(b => b.lower).map(b => hole(b.x0, b.x1, LS, x => sec(x) - .3)), DL, 'plaster');
    for (const b of bays) if (b.lower) ring((b.x0 + b.x1) / 2, LS, DL);
    put(new THREE.BoxGeometry(2 * lowX, SC, DL + .3), 'ashlar', 0, TIER + SC / 2); }
  // the upper tier: from the string course (or the ground) to the channel's bed; broken, it is two walls with ragged ends at the gap
  const upFoot = x => Math.min(DECK - .6, Math.max(TIER, foot(x))), upHole = x => Math.max(TIER + SC, sec(x) - .3), XE = 53.2;
  const upper = (xa, xb, jagW, jagE) => { const out = []; if (jagW) out.push(...jagW); else out.push(new THREE.Vector2(xa, upFoot(xa)), new THREE.Vector2(xa, DECK));
    if (jagE) out.push(...jagE); else out.push(new THREE.Vector2(xb, DECK), new THREE.Vector2(xb, upFoot(xb)));
    const xe = out[out.length - 1].x, xw = out[0].x; for (let s = 1; s < 80; s++) { const x = xe - (xe - xw) * s / 80; out.push(new THREE.Vector2(x, upFoot(x))); } /* along the foot from where the outline's east side comes down */
    const hs = bays.filter(b => b.upper && b.x0 > xa && b.x1 < xb); extrude(out, hs.map(b => hole(b.x0, b.x1, US, upHole)), DU, 'plaster'); for (const b of hs) ring((b.x0 + b.x1) / 2, US, DU);
    put(new THREE.BoxGeometry(xb - xa - (jagE ? 1.6 : 0) - (jagW ? 1.6 : 0), .3, DU + .4), 'ashlar', (xa + xb) / 2 + (jagW ? .8 : 0) - (jagE ? .8 : 0), DECK - .15);
    for (const e of [-1, 1]) put(new THREE.BoxGeometry(xb - xa - (jagE ? 2.2 : 0) - (jagW ? 2.2 : 0), .42, .05), 'zellige', (xa + xb) / 2 + (jagW ? 1.1 : 0) - (jagE ? 1.1 : 0), DECK - .55, e * (DU / 2 + .02)); };
  const V = (x, y) => new THREE.Vector2(x, y);
  if (!GAP) upper(-XE, XE);
  else { const a = GAP.x0, b = GAP.x1, ft = upFoot(a);
    upper(-XE, a + 1.7, null, [V(a + 1.7, DECK), V(a + 1.1, DECK - 1.2), V(a + 1.6, DECK - 2.0), V(a + .6, DECK - 3.0), V(a, DECK - 4.0), V(a, ft)]);
    upper(b - 1.7, XE, [V(b, ft), V(b, DECK - 4.0), V(b - .6, DECK - 3.0), V(b - 1.6, DECK - 2.0), V(b - 1.1, DECK - 1.2), V(b - 1.7, DECK)], null);
    // the stump of the pier between: standing 2.5 m over the string course, its top broken
    const px = piers[GAP.p + 1][0]; put(roughen(new THREE.BoxGeometry(PIER, 2.5, DU, 3, 4, 3), r, .05, 1.6), 'plaster', px, TIER + SC + 1.25);
    for (let k = 0; k < 4; k++) put(roughen(new RoundedBoxGeometry(.7 + r() * .4, .4 + r() * .2, .6 + r() * .3, 2, .08), r, .04, 2), 'cope', px - .6 + r() * 1.2, TIER + SC + 2.6 + r() * .2, -.8 + r() * 1.6, 0, r() * 3, (r() - .5) * .4); }
  // the brick core where the plaster has fallen: patches on the piers' faces, both sides, above head height and below
  for (const [x] of piers) for (const e of [-1, 1]) for (let k = 0; k < 2; k++) { if (inGap(x) && k) continue; const y = (k ? US - 3 : LS + 2) + (r() - .5) * 3, th = x => (y < TIER ? DL : DU) / 2;
    if (y < sec(x) + .5) continue; put(new THREE.BoxGeometry(.6 + r() * 1.0, .5 + r() * 1.3, .03), 'brick', x + (r() - .5) * .8, y, e * (th(x) + .015)); }
  // the channel: its bed on the cornice, two walls with copings (a few gone), the red lining and the pale crust inside; broken, it stops
  // ragged either side of the gap; at the ends it runs on the terraces to its open mouths at x = -57 and 57
  const runs = GAP ? [[-CX, GAP.x0 + 1.5], [GAP.x1 - 1.5, CX]] : [[-CX, CX]], WZ = CW / 2 + WT / 2;
  for (const [x0, x1] of runs) { const L = x1 - x0, mx = (x0 + x1) / 2;
    put(new THREE.BoxGeometry(L, 1.0, CW + 2 * WT), 'plaster', mx, DECK + .5); put(new THREE.BoxGeometry(L, .02, CW), 'lining', mx, .01);
    for (const e of [-1, 1]) { const cut = GAP ? (x0 < 0 ? [0, e < 0 ? .5 : 0] : [e < 0 ? 0 : .4, 0]) : [0, 0], wx0 = x0 + cut[0], wx1 = x1 - cut[1], wl = wx1 - wx0, wm = (wx0 + wx1) / 2;
      put(new THREE.BoxGeometry(wl, WH, WT), 'plaster', wm, WH / 2, e * WZ); put(new THREE.BoxGeometry(wl, WH - .3, .02), 'lining', wm, .3 + (WH - .3) / 2, e * (CW / 2 - .01));
      put(new THREE.BoxGeometry(wl, .3, .025), 'sinter', wm, .15, e * (CW / 2 - .0125));
      for (let x = wx0; x < wx1 - .2; x += 1.2) { if (r() < .14) continue; const l = Math.min(1.18, wx1 - x); put(new THREE.BoxGeometry(l, .15, WT + .12), 'cope', x + l / 2, WH + .075, e * WZ, 0, 0, (r() - .5) * .02); } } }
  // the fallen: the gap's masonry heaped under it on the string course and in the valley, and coping stones about the foot of the piers
  if (GAP) { for (let k = 0; k < 46; k++) { const x = GAP.x0 + r() * (GAP.x1 - GAP.x0), onTier = k < 10, z = onTier ? (r() - .5) * (DL - .8) : (r() > .5 ? 1 : -1) * (DL / 2 + .4 + r() * 6), y = onTier ? TIER + SC : ground(x, z), s = .5 + r() * .7;
      put(roughen(new RoundedBoxGeometry(s * 1.4, s * .7, s, 2, .1), r, .05, 1.8), k % 3 ? 'cope' : 'plaster', x, y + s * .3, z, r() * .4, r() * 3, r() * .4); } }
  for (let k = 0; k < 14; k++) { const [px] = piers[Math.floor(r() * piers.length)], z = (r() > .5 ? 1 : -1) * (2.2 + r() * 3), x = px + (r() - .5) * 4; put(roughen(new THREE.BoxGeometry(1.1, .15, .65, 2, 1, 2), r, .02, 2), 'cope', x, ground(x, z) + .05, z, (r() - .5) * .3, r() * 3, 0); }
  // the land's dress: rock breaking through on the valley's sides, cypresses on its shoulders
  for (let k = 0; k < 40; k++) { const x = (r() - .5) * 150, z = (r() > .5 ? 1 : -1) * (9 + r() * 48), s = .5 + r() * 1.1; if (Math.abs(x) < 4 || Math.abs(x) > HV - 4) continue; /* on the valley's sides, off the stream bed and the terraces */
    const g = roughen(new THREE.IcosahedronGeometry(s, 2), r, s * .16, 1.4); g.scale(1.3, .6, 1); put(g, 'rock', x, ground(x, z) - s * .15, z, 0, r() * 3, 0, .3); }
  const cyp = []; for (let k = 0; k < 60 && cyp.length < 22; k++) { const x = (r() > .5 ? 1 : -1) * (40 + r() * 42), z = (r() - .5) * 110; if (Math.abs(z) < 9 || cyp.some(([a, b]) => Math.hypot(a - x, b - z) < 3)) continue; cyp.push([x, z]);
    const h = 8 + r() * 5, w = .8 + r() * .35, prof = []; for (let s = 0; s <= 10; s++) { const t = s / 10; prof.push(new THREE.Vector2(w * Math.sin(Math.PI * Math.min(1, t * 1.15) ** .7) * (1 - t * .25) + .02, t * h)); }
    const y = ground(x, z); put(new THREE.LatheGeometry(prof, 9), 'leaf', x, y + .6, z, 0, r() * 3, 0); put(new THREE.CylinderGeometry(.12, .16, 1.2, 6), 'bark', x, y + .5, z); }
  // the walk: off the west terrace, in at the channel's open end, east along its bed to the break (or across, whole)
  const path = [[-61, 0], [-CX + .3, 0], [GAP ? GAP.x0 + .9 : CX - .5, 0]];
  const group = new THREE.Group(); let tris = 0; for (const [k, gs] of B) { const g = mergeGeometries(gs, false); gs.forEach(x => x.dispose()); const m = new THREE.Mesh(g, M[k]); m.name = k; m.castShadow = !['ground', 'bed'].includes(k); m.receiveShadow = true; group.add(m); tris += g.attributes.position.count / 3; }
  return { group, tris: Math.round(tris), draws: group.children.length, top: +new THREE.Box3().setFromObject(group).max.y.toFixed(2), path, ground, piers, bays: bays.map(({ hi, ...b }) => b),
    arch: { pitch: PITCH, pier: PIER, span: SPAN, r: RAD, lowSpring: LS, upSpring: US, tier: TIER + SC, deck: DECK }, channel: { w: CW, wall: WT, top: WH, x0: -CX, x1: CX }, gap: GAP ? { x0: +GAP.x0.toFixed(2), x1: +GAP.x1.toFixed(2), stump: piers[GAP.p + 1][0] } : null, broken };
}

// aurenneTunnel(o, r) (Session 908, card F8): a trade tunnel cut through a headland from a town's quay to the road inland, OG-121's Aurenne
//   panel ("trade tunnels"), in Aurenne's plaster and tile at its two portals and bare cut rock between. Built to the person, a metre a unit;
//   the quay's portal at z 0 faces +z, the tunnel runs 56 m to the inland portal at z -56, winding 1.6 m either side:
//   - the bore: 3.6 m wide on a paved floor, its walls upright to 2.4 m under a round vault (4.2 m at the crown), the rock left from the
//     pick, never closer than its line; a gutter down the west side, two cart ruts worn into the paving 1.4 m apart;
//   - the passing place: midway the bore widens to 6 m for 6 m (5.4 m at the crown), so two carts can pass; there the walls are plastered to a
//     dado under a band of glazed tile, a stone bench, the tally-keeper's table with its ledger, amphorae waiting, and a shaft to the sky;
//   - the lamps: clay lamps in arched niches every 7 m, on alternate walls; o.used (default true) they burn, false the tunnel is dark
//     but for the day at its ends and down the shaft, and your torch;
//   - the portals: an arch in a plastered frame let into the cliff, rung in ashlar, its spandrels tiled, a blank tablet over it; the quay's
//     paving before one and the dust road before the other.
//   -> { group, tris, draws, top, path ([x, z]), xc(z) (the bore's line), half(z), lamps ([x, y, z]), mouths ({ z, w, h } x2),
//        shaft { x, z, r, y0, top }, passing { z0, z1, half }, crown, used }
let TU = null;
function tunnelMats() {
  if (TU) return TU; aurenneTextures(); markTextures(); const std = (c, ro = .85, o = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: ro, ...o });
  TU = { rock: mat('rock', { ns: 1.3, color: 0xd2c2a2, rough: .95 }), cliff: mat('rock', { ns: 1.5, color: 0xd8caa8, rough: .95 }), pave: mat('limestone', { ns: 1.0, rough: .8 }),
    rut: std(0x7a6c58, 1), gutter: std(0x4a4034, 1), plaster: mat('plaster', { ns: .6, color: 0xeee0c4, rough: .95 }), ashlar: mat('ashlar', { ns: .9, color: 0xfff6e2, rough: .9 }),
    zellige: mat('zellige', { ns: .6, rough: .3 }), dust: mat('turfDry', { ns: .4, color: 0xfff0c8, rough: 1 }), dark: std(0x0d0a08, 1), clay: std(0xb06a40, .8), cedar: mat('wood', { ns: .9, color: 0xc89870, rough: .7 }),
    book: std(0x5a2a1e, .7), flame: new THREE.MeshStandardMaterial({ color: 0xffd090, emissive: new THREE.Color(1, .75, .4), emissiveIntensity: 4 }) };
  return TU;
}
export function aurenneTunnel(o = {}, r = stream('tunnel')) {
  const M = tunnelMats(), B = new Map(), used = o.used !== false, key = String(o.key || 'tunnel');
  const put = (geo, k, x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0, uv = .5) => { const g = geo.index ? geo.toNonIndexed() : geo; for (const a of Object.keys(g.attributes)) if (!['position', 'normal'].includes(a)) g.deleteAttribute(a);
    g.applyMatrix4(new THREE.Matrix4().compose(new THREE.Vector3(x, y, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(rx, ry, rz, 'YXZ')), new THREE.Vector3(1, 1, 1))); worldUV(g, uv);
    if (!B.has(k)) B.set(k, []); B.get(k).push(g); };
  const L = 56, H0 = 1.8, H1 = 3.0, S = 2.4, PZ = -28, sm = t => t <= 0 ? 0 : t >= 1 ? 1 : t * t * (3 - 2 * t);
  const xc = z => 1.6 * Math.sin(-z * Math.PI / 28) * sm(-z / 9) * sm((z + L) / 9) /* straight for its first and last metres, so each portal looks down the bore */, half = z => H0 + (H1 - H0) * sm((z - (PZ - 6)) / 3) * sm(((PZ + 6) - z) / 3) /* full between -31 and -25 */;
  const F = field(stream(key + ':rock'), .12), SH = { x: xc(PZ), z: PZ, r: 1.2, cut: .8, y0: 5.0, top: 18 };
  // the bore: a loft of the section along the line, the floor flat, the rock pushed out from its line by the pick's unevenness, never in
  { const NS = Math.round((L + .6) / .5), nF = 8, nW = 8, nV = 24, NA = 2 * nF + 0 + 2 * nW + nV, sec = [];
    const ring = (i, j) => { const z = .3 - i * (L + .6) / NS, h = half(z), R = h, c = xc(z); let u, y, nu, ny;
      if (j < nF) { u = -h + 2 * h * j / nF; y = 0; nu = 0; ny = -1; }
      else if (j < nF + nW) { u = h; y = S * (j - nF) / nW; nu = 1; ny = 0; }
      else if (j < nF + nW + nV) { const a = (j - nF - nW) / nV * Math.PI; u = Math.cos(a) * R; y = S + Math.sin(a) * R; nu = Math.cos(a); ny = Math.sin(a); }
      else if (j < nF + 2 * nW + nV) { u = -h; y = S * (1 - (j - nF - nW - nV) / nW); nu = -1; ny = 0; }
      else { u = -h + 2 * h * (j - nF - 2 * nW - nV) / nF; y = 0; nu = 0; ny = -1; }
      const d = y > .05 ? Math.min(.22, Math.abs(F(c + u, y, z)[0]) * 1.4 + .02) : 0; return [c + u + nu * d, y + ny * d, z]; };
    const NAt = nF + 2 * nW + nV; const g = loft(NS, NAt, ring, true, c => !(Math.hypot(c.x - SH.x, c.z - SH.z) < SH.cut && c.y > 4.5)); put(g, 'rock', 0, 0, 0, 0, 0, 0, .35); }
  // the shaft: a round bore up through the rock to the sky over the passing place
  { const g = loft(10, 16, (i, j) => { const y = SH.y0 + (SH.top - SH.y0) * i / 10, a = j / 16 * Math.PI * 2, d = Math.abs(F(SH.x, y, SH.z + j)[0]) * .6; return [SH.x + Math.cos(a) * (SH.r + d), y, SH.z + Math.sin(a) * (SH.r + d)]; }, true); put(g, 'rock', 0, 0, 0, 0, 0, 0, .35); }
  // the floor: paving along the line in 2 m lengths, the ruts and the gutter worn into it
  for (let z = .3; z > -L - .3; z -= 2) { const zm = z - 1, h = half(zm), c = xc(zm), ry = Math.atan2(xc(z - 2) - xc(z), -2) + Math.PI;
    put(new THREE.BoxGeometry(2 * h - .05, .04, 2.05), 'pave', c, .02, zm, 0, ry, 0, .55);
    for (const u of [-.7, .7]) put(new THREE.BoxGeometry(.14, .004, 2.05), 'rut', c + u, .042, zm, 0, ry);
    put(new THREE.BoxGeometry(.2, .004, 2.05), 'gutter', c - h + .25, .042, zm, 0, ry); }
  // the lamp niches: an arched frame of plaster, its back dark, a clay lamp on its sill
  const lamps = [], arched = (w, h0, rr) => { const p = [new THREE.Vector2(-w / 2, 0), new THREE.Vector2(w / 2, 0), new THREE.Vector2(w / 2, h0)]; for (let s = 1; s < 12; s++) { const a = s / 12 * Math.PI; p.push(new THREE.Vector2(Math.cos(a) * rr, h0 + Math.sin(a) * rr)); } p.push(new THREE.Vector2(-w / 2, h0)); return p; };
  for (let k = 0, z = -4; z > -L + 3; z -= 6, k++) { if (Math.abs(z - PZ) < 4) continue; const e = k % 2 ? 1 : -1, h = half(z), c = xc(z), wx = c + e * (h - .02), ry = e > 0 ? -Math.PI / 2 : Math.PI / 2;
    const sh = new THREE.Shape(arched(.7, .55, .35)); sh.holes.push(new THREE.Path(arched(.44, .5, .22).reverse())); const g = new THREE.ExtrudeGeometry(sh, { depth: .05, bevelEnabled: false, curveSegments: 12 }); g.translate(0, 0, -.025); put(g, 'plaster', wx, 1.3, z, 0, ry);
    put(new THREE.BoxGeometry(.02, .72, .44), 'dark', wx + e * .01, 1.3 + .36, z); put(new THREE.BoxGeometry(.16, .04, .5), 'plaster', wx - e * .06, 1.3, z);
    put(new THREE.LatheGeometry([[0, 0], [.07, .01], [.08, .035], [.03, .05], [0, .05]].map(([a, b]) => new THREE.Vector2(a, b)), 8), 'clay', wx - e * .08, 1.32, z);
    if (used) { put(new THREE.SphereGeometry(.025, 6, 4), 'flame', wx - e * .08 - e * .07, 1.4, z); lamps.push([+(wx - e * .3).toFixed(2), 1.45, z]); } }
  // the passing place's own two lamps, over the dado either side of the shaft
  for (const e of [-1, 1]) { const z = PZ + e * 1.5, c = xc(z), wx = c + e * (H1 - .06); put(new THREE.BoxGeometry(.3, .05, .24), 'cedar', wx - e * .12, 1.75, z); put(new THREE.LatheGeometry([[0, 0], [.07, .01], [.08, .035], [.03, .05], [0, .05]].map(([a, b]) => new THREE.Vector2(a, b)), 8), 'clay', wx - e * .14, 1.775, z);
    if (used) { put(new THREE.SphereGeometry(.025, 6, 4), 'flame', wx - e * .2, 1.85, z); lamps.push([+(wx - e * .45).toFixed(2), 1.9, z]); } }
  // the passing place: the dado and its tile band on both walls, the bench, the tally-keeper's table and ledger, amphorae
  for (const e of [-1, 1]) for (let z = PZ + 2.9; z > PZ - 2.9; z -= 1.16) { const c = xc(z - .58), u = c + e * (H1 - .03), ry = Math.atan2(xc(z - 1.16) - xc(z), -1.16) + Math.PI; put(new THREE.BoxGeometry(.06, 1.2, 1.2), 'plaster', u, .6, z - .58, 0, ry); put(new THREE.BoxGeometry(.065, .25, 1.2), 'zellige', u, 1.32, z - .58, 0, ry); }
  { const c = xc(PZ); put(new THREE.BoxGeometry(.5, .45, 3), 'ashlar', c - H1 + .3, .225, PZ + .8);
    const tx = c + 1.2, tz = PZ - 1.6; put(new THREE.BoxGeometry(1.5, .06, .8), 'cedar', tx, .78, tz); for (const [a, b] of [[-.68, -.33], [.68, -.33], [-.68, .33], [.68, .33]]) put(new THREE.BoxGeometry(.06, .75, .06), 'cedar', tx + a, .375, tz + b);
    put(new THREE.BoxGeometry(.42, .06, .3), 'book', tx - .2, .84, tz, 0, .2); put(new THREE.BoxGeometry(.5, .45, .5), 'cedar', tx, .225, tz + .75);
    const prof = [[0, 0], [.05, .02], [.18, .25], [.21, .45], [.16, .7], [.06, .8], [.05, .95], [.08, 1.0], [0, 1.0]].map(([a, b]) => new THREE.Vector2(a, b));
    for (let k = 0; k < 9; k++) { const ax = c + H1 - .35 - (k % 3) * .02 - (k >= 6 ? .4 : 0), az = PZ + 2.2 - (k % 6) * .46, tilt = k >= 6 ? .3 : 0; put(new THREE.LatheGeometry(prof, 10), 'clay', ax, 0.04, az, 0, 0, tilt); } }
  // the portals: a plastered frame round the bore's section, an ashlar ring on its face, tiled spandrels, a blank tablet; the cliff round it
  const W = H0 + .05;
  for (const [pz, ry] of [[0, 0], [-L, Math.PI]]) { const out = [new THREE.Vector2(-3.2, -.2), new THREE.Vector2(-3.2, 6.2), new THREE.Vector2(3.2, 6.2), new THREE.Vector2(3.2, -.2)];
    const hp = [new THREE.Vector2(W, -.1), new THREE.Vector2(W, S)]; for (let s = 1; s < 24; s++) { const a = s / 24 * Math.PI; hp.push(new THREE.Vector2(Math.cos(a) * W, S + Math.sin(a) * W)); } hp.push(new THREE.Vector2(-W, S), new THREE.Vector2(-W, -.1));
    const sh = new THREE.Shape(out); sh.holes.push(new THREE.Path(hp)); const g = new THREE.ExtrudeGeometry(sh, { depth: .7, bevelEnabled: false, curveSegments: 24 }); g.translate(0, 0, -.35); put(g, 'plaster', 0, 0, pz, 0, ry, 0, .45);
    const rg = new THREE.Shape(); rg.absarc(0, 0, W + .5, 0, Math.PI, false); rg.absarc(0, 0, W, Math.PI, 0, true); const rgg = new THREE.ExtrudeGeometry(rg, { depth: .1, bevelEnabled: false, curveSegments: 24 }); rgg.translate(0, S, .33); put(rgg, 'ashlar', 0, 0, pz, 0, ry);
    for (const e of [-1, 1]) { put(new THREE.BoxGeometry(.24, S, .1), 'ashlar', e * (W + .12), S / 2, pz + (ry ? -.38 : .38)); put(new THREE.BoxGeometry(.8, 1.1, .02), 'zellige', e * 2.65, 3.6, pz + (ry ? -.36 : .36)); }
    put(new THREE.BoxGeometry(1.8, .7, .08), 'ashlar', 0, 5.45, pz + (ry ? -.37 : .37)); put(new THREE.BoxGeometry(6.8, .3, .9), 'ashlar', 0, 6.3, pz);
    const cg = new THREE.PlaneGeometry(48, 18, 60, 22).toNonIndexed(), P = cg.attributes.position.array, CF = field(stream(key + ':cliff' + pz), .9), kept = [];
    for (let i = 0; i < P.length; i += 9) { let cx = 0, cy = 0; for (let k = 0; k < 3; k++) { cx += P[i + k * 3] / 3; cy += P[i + k * 3 + 1] / 3; } cy += 8; if (Math.abs(cx) < 3.0 && cy < 6.1) continue; for (let k = 0; k < 9; k++) kept.push(P[i + k]); }
    for (let i = 0; i < kept.length; i += 3) { const x = kept[i], y = kept[i + 1] + 8, d = Math.max(0, Math.max(Math.abs(x) - 3.2, y - 6.4)); kept[i + 1] = y; kept[i + 2] = .25 + Math.min(1, d / 3) * Math.max(.1, .7 + CF(x, y, pz)[2] * 1.2); } /* never behind the face's line */
    const cgeo = new THREE.BufferGeometry(); cgeo.setAttribute('position', new THREE.Float32BufferAttribute(kept, 3)); const mg = mergeVertices(cgeo, 1e-4); mg.computeVertexNormals(); put(mg, 'cliff', 0, 0, pz, 0, ry, 0, .3); }
  // before the portals: the quay's paving, and the dust road inland
  put(new THREE.BoxGeometry(30, .4, 10), 'pave', 0, -.16, 5.35, 0, 0, 0, .55); put(new THREE.BoxGeometry(30, .4, 12), 'dust', 0, -.16, -L - 6.35, 0, 0, 0, .3);
  const path = [[0, 5]]; for (let z = 0; z >= -L; z -= 1) path.push([+xc(z).toFixed(3), z]); path.push([0, -L - 5]);
  const group = new THREE.Group(); let tris = 0; for (const [k, gs] of B) { const g = mergeGeometries(gs, false); gs.forEach(x => x.dispose()); const m = new THREE.Mesh(g, M[k]); m.name = k; m.castShadow = !['flame', 'rut', 'gutter'].includes(k); m.receiveShadow = true; group.add(m); tris += g.attributes.position.count / 3; }
  return { group, tris: Math.round(tris), draws: group.children.length, top: +new THREE.Box3().setFromObject(group).max.y.toFixed(2), path, xc, half, lamps, used, mouths: [{ z: 0, w: 2 * H0, h: S + H0 }, { z: -L, w: 2 * H0, h: S + H0 }],
    shaft: SH, passing: { z0: PZ + 3, z1: PZ - 3, half: H1 }, crown: S + H0, L };
}

// aurenneGrotto(o, r) (Session 914, card F8): a sea grotto on Aurenne's coast, the last of OG-121's Aurenne panel that does not wait on the
//   quest writer ("aqueduct ruins, sea grottoes, trade tunnels, harbour catacombs"). A cave the sea made, its water lit from under the sea:
//   the day comes in through a drowned gate under the waterline and makes the water glow, while the arch above the water is low. Built to
//   the person, a metre a unit; the sea at y 0, the grotto along -z:
//   - the stair: a rock-cut way from a terrace on the cliff top (+z) down 24 steps of 0.2 m on treads of 0.5 m, 2.6 m wide under a round
//     vault (3.7 m to its crown over the line of the steps), level for its last 5 m, coming out through an arched frame of plaster and ashlar
//     with a band of blue glazed tile onto the landing;
//   - the grotto: one lofted hall on the cave's own caveHall, 60 m long, 37 to 40 m across 6 m up and 18 to 27 m from the water to the roof
//     near its middle, its limestone dark and wet below the high-water line; a low sea arch in the far end, 6.4 m wide and 3 m over the
//     water, over a drowned gate 16 m wide and 7 m deep, through which the light comes. The hall is lofted in 208 rings, twice the cave's,
//     because a dome closes to a point at its centre height and the fan of faces round that point would otherwise cover the stair's
//     opening at the near end and the arch's top at the far one;
//   - the landing across the near end at 1.2 m, and the quay: a cut ledge 3.6 m wide down the east wall for 33 m, paved, its sea face in
//     ashlar, bollards and bronze rings along it, water stairs at its end and a skiff tied to them;
//   - the spring: an apse of plaster on the landing's west end against the rock, tiled inside, a bronze spout and a basin of ashlar, fresh
//     water out of the rock in a place of salt; benches either side. What it is to anyone is the quest writer's;
//   - a beach of pale sand under the west wall across the water, reached by swimming; rocks breaking the surface; a few short stalactites.
//   -> { group, tris, draws, top, path ([x, z]), walkY(x, z), quay { y, x(z), z0, z1, w }, stair { z0, z1, n, rise, run, top }, mouth (the
//        stair's top { z, w, h, y }), arch { w, h, z }, gate { w, d }, chamber { x0, x1, z0, z1, h }, spring { x, y, z }, skiff { x, z },
//        glow ([x, y, z], where the view puts its lights under the water), beach { z0, z1 } }
let GR = null;
function grottoMats() {
  if (GR) return GR; aurenneTextures(); const std = (c, ro = .85, o = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: ro, ...o });
  GR = { rock: mat('rock', { ns: 1.5, color: 0xcabca0, rough: .92 }), rockWet: mat('rock', { ns: 1.7, color: 0x5a6462, rough: .4 }), pave: mat('limestone', { ns: 1.0, rough: .8 }),
    plaster: mat('plaster', { ns: .6, color: 0xeee0c4, rough: .95 }), ashlar: mat('ashlar', { ns: .9, color: 0xfff6e2, rough: .9 }), zellige: mat('zellige', { ns: .6, rough: .3 }),
    sand: mat('plaster', { ns: .4, color: 0xe2d6b8, rough: 1 }), seabed: mat('rock', { ns: 1.0, color: 0xa8c0c0, rough: .9 }), bronze: std(0x5a7a5e, .45, { metalness: .6 }),
    hull: mat('wood', { ns: .8, color: 0x3c6a8a, rough: .7 }), timber: mat('beam', { ns: 1.0, color: 0x8a6c4c, rough: .9 }), rope: std(0x8a7650, .95),
    sea: new THREE.MeshStandardMaterial({ color: 0x125c9c, emissive: new THREE.Color(.03, .26, .68), emissiveIntensity: .62, roughness: .2, metalness: .1, transparent: true, opacity: .84, depthWrite: false }),
    spring: new THREE.MeshStandardMaterial({ color: 0x6aa8b0, roughness: .1, transparent: true, opacity: .7, depthWrite: false }),
    fall: new THREE.MeshStandardMaterial({ color: 0xdff0f4, emissive: new THREE.Color(.2, .3, .34), roughness: .2, transparent: true, opacity: .55, side: THREE.DoubleSide, depthWrite: false }) };
  { const N = 256, c = document.createElement('canvas'); c.width = c.height = N; const x = c.getContext('2d'), im = x.createImageData(N, N), T = Math.PI * 2 / N, rr = stream('grotto:sea');
    const W = Array.from({ length: 7 }, () => [1 + Math.floor(rr() * 5), Math.floor(rr() * 7) - 3, rr() * 6]); /* whole waves across the tile, so it repeats without a seam */
    for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) { let v = 0; for (const [a, b, p] of W) v += Math.sin((i * a + j * b) * T + p) + Math.sin((i * b - j * a) * T + p * 1.7); const c2 = 1 - Math.min(1, Math.abs(v) / 2.2), l = .55 + .45 * c2 ** 3, k = (j * N + i) * 4;
      im.data[k] = 255 * l; im.data[k + 1] = 255 * l; im.data[k + 2] = 255 * l; im.data[k + 3] = 255; }
    x.putImageData(im, 0, 0); const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; GR.sea.emissiveMap = t; GR.sea.emissiveIntensity = .78; } /* the light off the sea floor, broken by the swell into a net */
  GR.deep = new THREE.MeshBasicMaterial({ color: new THREE.Color(.12, .5, .95) }) /* the daylit sea outside the drowned gate, seen through it */;
  GR.rock.side = GR.rockWet.side = GR.hull.side = THREE.DoubleSide; return GR;
}
export function aurenneGrotto(o = {}, r = stream('grotto')) {
  const M = grottoMats(), B = new Map(), key = String(o.key || 'grotto');
  const put = (geo, k, x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0, uv = .5) => { const g = geo.index ? geo.toNonIndexed() : geo; for (const a of Object.keys(g.attributes)) if (!['position', 'normal'].includes(a)) g.deleteAttribute(a);
    if (!g.attributes.normal) g.computeVertexNormals();
    g.applyMatrix4(new THREE.Matrix4().compose(new THREE.Vector3(x, y, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(rx, ry, rz, 'YXZ')), new THREE.Vector3(1, 1, 1))); worldUV(g, uv);
    if (!B.has(k)) B.set(k, []); B.get(k).push(g); };
  const bx = (k, x0, x1, y0, y1, z0, z1, uv) => put(new THREE.BoxGeometry(x1 - x0, y1 - y0, z1 - z0), k, (x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2, 0, 0, 0, uv);
  const sm = t => t <= 0 ? 0 : t >= 1 ? 1 : t * t * (3 - 2 * t);
  const rk = stream(key + ':rock'), F = field(rk, .3), ph = Array.from({ length: 8 }, () => rk() * 9);
  // the stair: level from the terrace to z -3, 24 steps down to z -15, level on to the hall
  const QY = 1.2, NST = 24, RISE = .2, RUN = .5, TOPY = QY + NST * RISE, SZ0 = -3, SZ1 = SZ0 - NST * RUN, PH = 1.3, PW2 = 2.4, MZ = 3;
  const line = z => z >= SZ0 ? TOPY : z <= SZ1 ? QY : TOPY - (SZ0 - z) / RUN * RISE /* the steps' noses */;
  const stepY = z => z >= SZ0 ? TOPY : z <= SZ1 ? QY : TOPY - Math.min(NST, Math.ceil((SZ0 - z) / RUN)) * RISE;
  const PL = 20, Z0 = -PL, L = 60, Z1 = Z0 - L, CY = 5.2, RLOW = 11, E = 3 / L, HW = 1.0 /* the dome closes to a point at CY, which must stand above the stair's opening */;
  const RX = s => 13 + 6 * Math.sin(Math.PI * s), RY = s => 10 + 8 * Math.sin(Math.PI * s);
  const { ringAt, hw, roofY } = caveHall(rk, F, ph, { Z0, L, CY, RLOW, RX, RY, E });
  const AW = 3.2, AH = 3.0, GW = 8, GD = 7, PEND = Z0 - .6;
  const inPassage = (x, y, z, m) => z > Z0 - 4 && Math.abs(x) < PH - m && y > QY - 1.5 && y < QY + PW2 + Math.sqrt(Math.max(0, (PH - m) ** 2 - x * x));
  const inArch = (c, m) => (Z0 - c.z) / L > .86 && (c.y >= 0 ? (c.x / (AW - m)) ** 2 + (c.y / (AH - m)) ** 2 : (c.x / (GW - m)) ** 2 + (c.y / (GD - m)) ** 2) < 1;
  const sOf = u => u - .8 * Math.sin(2 * Math.PI * u) / (2 * Math.PI);
  for (const wet of [true, false]) put(loft(208, 96, (i, j) => ringAt(sOf(i / 208), j / 96 * Math.PI * 2), true, (c, i, j) => !inPassage(c.x, c.y, c.z, .4) && !inArch(c, 0) && (CY + RLOW * Math.sin((j + .5) / 96 * Math.PI * 2) < HW) === wet), wet ? 'rockWet' : 'rock', 0, 0, 0, 0, 0, 0, .25);
  // the stair's bore: a loft of its section down the line, the floor 0.25 m under the noses, the rock pushed out by the pick, never in
  { const NS = Math.round((MZ - PEND) / .25), nF = 6, nW = 8, nV = 20, NA = 2 * nF + 2 * nW + nV;
    const ring = (i, j) => { const z = MZ - i * (MZ - PEND) / NS, b = line(z) - .25, h = PH; let u, y, nu, ny;
      if (j < nF) { u = -h + 2 * h * j / nF; y = b; nu = 0; ny = -1; }
      else if (j < nF + nW) { u = h; y = b + (PW2 + .25) * (j - nF) / nW; nu = 1; ny = 0; }
      else if (j < nF + nW + nV) { const a = (j - nF - nW) / nV * Math.PI; u = Math.cos(a) * h; y = b + PW2 + .25 + Math.sin(a) * h; nu = Math.cos(a); ny = Math.sin(a); }
      else if (j < nF + 2 * nW + nV) { u = -h; y = b + (PW2 + .25) * (1 - (j - nF - nW - nV) / nW); nu = -1; ny = 0; }
      else { u = -h + 2 * h * (j - nF - 2 * nW - nV) / nF; y = b; nu = 0; ny = -1; }
      const d = y > b + .05 ? Math.min(.2, Math.abs(F(u, y, z)[0]) * 1.4 + .02) * sm((MZ - z) / 1.2) * sm((z - PEND) / 1.2) : 0 /* none where the frames stand */; return [u + nu * d, y + ny * d, z]; };
    put(loft(NS, NA, ring, true), 'rock', 0, 0, 0, 0, 0, 0, .35); }
  // the steps, and the paving of the level runs at either end
  for (let k = 1; k <= NST; k++) { const z1 = SZ0 - (k - 1) * RUN, z0 = SZ0 - k * RUN, top = TOPY - k * RISE; bx('pave', -PH + .01, PH - .01, line(z0) - .3, top, z0, z1 + (k > 1 ? 0 : 0), .6); }
  for (let z = MZ; z > SZ0 + .01; z -= 1.5) bx('pave', -PH + .01, PH - .01, TOPY - .3, TOPY, Math.max(z - 1.5, SZ0), z, .6);
  for (let z = SZ1; z > PEND - .01; z -= 1.4) bx('pave', -PH + .01, PH - .01, QY - .3, QY, Math.max(z - 1.4, PEND), z, .6);
  // the frames: an arch round the bore's section at either end, plaster in a block let into the rock, an ashlar ring, a band of tile
  const arch = (w, h0, rr, n = 20) => { const p = [new THREE.Vector2(w, -.1), new THREE.Vector2(w, h0)]; for (let s = 1; s < n; s++) { const a = s / n * Math.PI; p.push(new THREE.Vector2(Math.cos(a) * rr, h0 + Math.sin(a) * rr)); } p.push(new THREE.Vector2(-w, h0), new THREE.Vector2(-w, -.1)); return p; };
  for (const [fz, fy, ry, depth] of [[PEND, QY, Math.PI, .75], [MZ, TOPY, 0, .7]]) { const W2 = PH + .05, OW = 2.2, OH = 5.0;
    const sh = new THREE.Shape([new THREE.Vector2(-OW, -.25), new THREE.Vector2(OW, -.25), new THREE.Vector2(OW, OH), new THREE.Vector2(-OW, OH)]); sh.holes.push(new THREE.Path(arch(W2, PW2, W2))); const g = new THREE.ExtrudeGeometry(sh, { depth, bevelEnabled: false, curveSegments: 20 }); g.translate(0, 0, -depth + .02); put(g, 'plaster', 0, fy, fz, 0, ry, 0, .45);
    const rg = new THREE.Shape(); rg.absarc(0, 0, W2 + .42, 0, Math.PI, false); rg.absarc(0, 0, W2, Math.PI, 0, true); const rgg = new THREE.ExtrudeGeometry(rg, { depth: .1, bevelEnabled: false, curveSegments: 20 }); rgg.translate(0, PW2, .02); put(rgg, 'ashlar', 0, fy, fz, 0, ry);
    const fo = ry ? -1 : 1; for (const e of [-1, 1]) { put(new THREE.BoxGeometry(.22, PW2, .1), 'ashlar', e * (W2 + .11), fy + PW2 / 2, fz + fo * .07); put(new THREE.BoxGeometry(.5, .9, .02), 'zellige', e * 1.75, fy + 3.2, fz + fo * .03); }
    put(new THREE.BoxGeometry(4.4, .24, .02), 'zellige', 0, fy + 4.35, fz + fo * .03); put(new THREE.BoxGeometry(4.8, .22, .4), 'ashlar', 0, fy + OH + .11, fz - fo * .15); }
  // the cliff over the terrace, its face never behind the frame's plane, and the terrace before it
  { const cg = new THREE.PlaneGeometry(36, 16, 48, 20).toNonIndexed(), P = cg.attributes.position.array, CF = field(stream(key + ':cliff'), .9), kept = [];
    for (let i = 0; i < P.length; i += 9) { let cx = 0, cy = 0; for (let k = 0; k < 3; k++) { cx += P[i + k * 3] / 3; cy += P[i + k * 3 + 1] / 3; } cy += 7.6; if (Math.abs(cx) < 2.1 && cy < 4.95) continue; for (let k = 0; k < 9; k++) kept.push(P[i + k]); }
    for (let i = 0; i < kept.length; i += 3) { const x = kept[i], y = kept[i + 1] + 7.6, d = Math.max(0, Math.max(Math.abs(x) - 2.2, y - 5.2)); kept[i + 1] = y + TOPY - .2; kept[i + 2] = -.68 + Math.min(1, d / 3) * Math.max(.1, .7 + CF(x, y, 0)[2] * 1.2); }
    const cgeo = new THREE.BufferGeometry(); cgeo.setAttribute('position', new THREE.Float32BufferAttribute(kept, 3)); const mg = mergeVertices(cgeo, 1e-4); mg.computeVertexNormals(); put(mg, 'rock', 0, 0, MZ, 0, 0, 0, .3);
    bx('pave', -9, 9, TOPY - .4, TOPY, MZ, MZ + 8, .6); }
  // the floor: the landing across the near end at QY (its sea edge rock), the quay down the east wall (its edge cut straight), the sea's bed
  const wob = x => .8 * Math.sin(x * .5 + ph[2]) + .4 * Math.sin(x * 1.3 + ph[3]), SHZ = Z0 - 7, QW = 3.6, QZ1 = Z0 - 40, QX = z => hw(z) - QW, BZ0 = Z0 - 24, BZ1 = Z0 - 36;
  const beachT = (x, z) => sm((z - BZ1) / 2) * sm((BZ0 - z) / 2) * sm((x + hw(z) - 8) / -2);
  const land = (x, z) => Math.max(z - SHZ, z > QZ1 ? x - QX(z) : -99) /* both edges cut straight and faced in ashlar */;
  const floorY = (x, z) => { const e = land(x, z); if (e > 0) return QY - .08 /* under the paving */; const s = (Z0 - z) / L;
    let y = -5 + .6 * Math.sin(x * .3 + ph[4]) * Math.sin(z * .21 + ph[5]); y = Math.min(y, -5 - 2 * sm((s - .8) / .12));
    y = y + (-2.2 - y) * (1 - sm((x + hw(z) - 1) / 6)) * (1 - sm((s - .8) / .1)); const b = beachT(x, z); y = y + (.7 - .32 * (x + hw(z)) - y) * b;
    const t = Math.min(1, -e / 1.2); return QY + (y - QY) * Math.min(1, t * 1.4); };
  { const X0 = -24, X1 = 24, NX = 96, NZ = 120, pos = []; for (let j = 0; j <= NZ; j++) for (let i = 0; i <= NX; i++) { const x = X0 + (X1 - X0) * i / NX, z = Z0 - L * j / NZ; pos.push(x, floorY(x, z), z); }
    const tri = { rock: [], sand: [], seabed: [] };
    for (let j = 0; j < NZ; j++) for (let i = 0; i < NX; i++) { const a = j * (NX + 1) + i, b = a + 1, c = a + NX + 1, d = c + 1;
      for (const t of [[a, b, c], [b, d, c]]) { const ys = t.map(k => pos[k * 3 + 1]), cx = t.reduce((s, k) => s + pos[k * 3], 0) / 3, cz = t.reduce((s, k) => s + pos[k * 3 + 2], 0) / 3;
        const k = ys.every(y => y > QY - .09) ? 'rock' : beachT(cx, cz) > .3 && Math.max(...ys) > -1.2 ? 'sand' : 'seabed'; for (const v of t) tri[k].push(pos[v * 3], pos[v * 3 + 1], pos[v * 3 + 2]); } }
    for (const k of Object.keys(tri)) { const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(tri[k], 3)); const m = mergeVertices(g, 1e-4); m.computeVertexNormals(); put(m, k, 0, 0, 0, 0, 0, 0, .3); } }
  put(new THREE.PlaneGeometry(64, L + 90).rotateX(-Math.PI / 2), 'sea', 0, 0, Z0 - (L + 90) / 2 + 1, 0, 0, 0, .07);
  put(new THREE.PlaneGeometry(60, 16), 'deep', 0, -8.05, Z1 - 8); put(new THREE.PlaneGeometry(60, 30).rotateX(-Math.PI / 2), 'deep', 0, -16, Z1 + 6) /* the open sea beyond the gate, and its floor */;
  // the quay: paving in lengths of 1.2 m, its sea face in ashlar down under the water, a coping on the edge; bollards and rings
  for (let z = SHZ + 1.5; z > QZ1 + .01; z -= 1.2) { const z0 = Math.max(z - 1.2, QZ1), zm = (z + z0) / 2, x0 = QX(zm), ry = Math.atan2(QX(z0) - QX(z), z0 - z);
    const xp = Math.max(QX(z), QX(z0)) + .2; bx('pave', xp, QX(zm) + QW + 1.2, QY - .27, QY + .03, z0, z + .005, .6) /* square, behind the face's top, which follows the edge */;
    put(new THREE.BoxGeometry(.5, QY + 3, z - z0 + .01), 'ashlar', x0 + .2, (QY - 3) / 2 + .03, zm, 0, ry, 0, .5); }
  // the landing: paved across the near end, its sea edge faced in ashlar like the quay's
  for (let z = Z0 + .5; z > SHZ + .01; z -= 1.2) { const z0 = Math.max(z - 1.2, SHZ); bx('pave', -18, QX(SHZ) + .01, QY - .3, QY, z0, z, .6); }
  bx('ashlar', -18, QX(SHZ) + .2, QY - 3, QY + .03, SHZ - .5, SHZ + .02, .5);
  const bollards = []; for (let z = SHZ - 1, k = 0; z > QZ1 + 1; z -= 6, k++) { const x = QX(z) + .45; put(new THREE.CylinderGeometry(.16, .2, .55, 10), 'ashlar', x, QY + .3, z); bollards.push([+x.toFixed(2), +z.toFixed(2)]);
    put(new THREE.TorusGeometry(.12, .02, 6, 12).rotateY(Math.PI / 2), 'bronze', QX(z - 3) - .07, QY - .5, z - 3); }
  // the water stairs at the quay's end: six steps down along -z into the sea
  const WS = []; for (let k = 1; k <= 7; k++) { const top = QY - k * .2, z1 = QZ1 - (k - 1) * .4, z0 = z1 - .4, x0 = QX(QZ1); bx('ashlar', x0 + .2, x0 + QW + 1.2, -2.5, top, z0, z1, .5); WS.push(top); }
  // the skiff, tied at the water stairs: a lathe shell, its gunwale, two thwarts and the oars
  const skiff = { x: QX(QZ1) - 1.25, z: QZ1 - 1.4 };
  { const BL = 4.4, W2 = .78, pts = []; for (let k = 0; k <= 10; k++) { const t = k / 10; pts.push(new THREE.Vector2(Math.sin(Math.PI * t) ** .6 * W2 + .05, (t - .5) * BL)); }
    const g = new THREE.LatheGeometry(pts, 14, -Math.PI / 2, Math.PI); g.rotateX(Math.PI / 2); g.scale(1, .55, 1); put(g, 'hull', skiff.x, .28, skiff.z, 0, 0, 0, .5); /* the lathe's lower half, a bowl along z */
    for (const s of [-1, 1]) { const gp = []; for (let k = 0; k <= 10; k++) { const t = k / 10; gp.push(new THREE.Vector3(skiff.x + s * (Math.sin(Math.PI * t) ** .6 * W2 + .05), .29, skiff.z + (t - .5) * BL)); } put(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(gp), 16, .035, 5), 'timber'); }
    for (const dz of [-.8, .6]) bx('timber', skiff.x - .72, skiff.x + .72, .1, .15, skiff.z + dz - .1, skiff.z + dz + .1);
    for (const s of [-1, 1]) { const g2 = new THREE.CylinderGeometry(.03, .03, 2.6, 6); g2.rotateX(Math.PI / 2); g2.rotateY(s * .12); put(g2, 'timber', skiff.x + s * .3, .2, skiff.z + .1); }
    const a = new THREE.Vector3(skiff.x, .32, skiff.z + 2.1), b = new THREE.Vector3(QX(QZ1) + .45, QY - .2, QZ1 - .2), d = b.clone().sub(a), rg = new THREE.CylinderGeometry(.015, .015, d.length(), 5); rg.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.clone().normalize())); const m = a.add(b).multiplyScalar(.5); put(rg, 'rope', m.x, m.y, m.z); }
  // the spring on the landing's west end: the west wall's x over the apse's height, the apse stood in front of the nearest of it
  const wallX = (y, z) => { const s = (Z0 - z) / L; let a = Math.PI - 1.3, b = Math.PI + 1.3; for (let k = 0; k < 24; k++) { const m = (a + b) / 2; if (ringAt(s, m)[1] > y) a = m; else b = m; } return ringAt(s, (a + b) / 2)[0]; };
  const SZ = Z0 - 3.6, SXw = Math.max(...[-1.6, 0, 1.6].flatMap(dz => [QY + .2, QY + 1.5, QY + 3, QY + 3.8].map(y => wallX(y, SZ + dz)))), SX = SXw + .35, AR = 1.15, AHt = 2.4;
  { const sh = new THREE.Shape([new THREE.Vector2(-1.75, -.2), new THREE.Vector2(1.75, -.2), new THREE.Vector2(1.75, AHt + AR + .6), new THREE.Vector2(-1.75, AHt + AR + .6)]); sh.holes.push(new THREE.Path(arch(AR, AHt, AR)));
    const sg = new THREE.ExtrudeGeometry(sh, { depth: 1.56, bevelEnabled: false, curveSegments: 20 }); sg.translate(0, 0, -1.5); put(sg, 'plaster', SX, QY, SZ, 0, Math.PI / 2, 0, .45); /* the back, the niche cut through it, run into the rock */
    const ap = new THREE.CylinderGeometry(AR, AR, AHt, 20, 1, true, Math.PI, Math.PI); ap.scale(1, 1, -1); ap.deleteAttribute('normal'); put(ap, 'zellige', SX + .06, QY + AHt / 2, SZ, 0, 0, 0, .6); /* the niche's hollow, into the wall, seen from inside */
    const dm = new THREE.SphereGeometry(AR, 20, 8, -Math.PI / 2, Math.PI, 0, Math.PI / 2); dm.scale(1, 1, -1); dm.deleteAttribute('normal'); put(dm, 'plaster', SX + .06, QY + AHt, SZ, 0, 0, 0, .45);
    for (const e of [-1, 1]) { put(new THREE.BoxGeometry(.4, AHt + AR + .5, .5), 'plaster', SX + .25, QY + (AHt + AR + .5) / 2 - .1, SZ + e * (AR + .25), 0, 0, 0, .45); put(new THREE.BoxGeometry(.5, .2, .6), 'ashlar', SX + .3, QY + AHt, SZ + e * (AR + .25)); }
    const rg = new THREE.Shape(); rg.absarc(0, 0, AR + .38, 0, Math.PI, false); rg.absarc(0, 0, AR, Math.PI, 0, true); const rgg = new THREE.ExtrudeGeometry(rg, { depth: .12, bevelEnabled: false, curveSegments: 20 }); put(rgg, 'ashlar', SX + .44, QY + AHt, SZ, 0, Math.PI / 2, 0);
    put(new THREE.BoxGeometry(.6, .3, 3.4), 'ashlar', SX + .3, QY + AHt + AR + .55, SZ); }
  const BW = 2.4, BD = 1.3, BH = .55, bx0 = SX + .5; for (const [x0, x1, z0, z1] of [[bx0, bx0 + BD, SZ - BW / 2, SZ - BW / 2 + .2], [bx0, bx0 + BD, SZ + BW / 2 - .2, SZ + BW / 2], [bx0 + BD - .2, bx0 + BD, SZ - BW / 2, SZ + BW / 2]]) bx('ashlar', x0, x1, QY, QY + BH, z0, z1, .5);
  bx('ashlar', bx0, bx0 + BD, QY, QY + .08, SZ - BW / 2, SZ + BW / 2, .5); bx('spring', bx0 - .02, bx0 + BD - .2, QY + .08, QY + BH - .08, SZ - BW / 2 + .2, SZ + BW / 2 - .2);
  { const sp = new THREE.CylinderGeometry(.035, .05, .5, 8); sp.rotateZ(Math.PI / 2 - .2); put(sp, 'bronze', SX - AR + .55 + .2, QY + 1.6, SZ); put(new THREE.PlaneGeometry(.06, 1.08).rotateY(Math.PI / 2), 'fall', SX - AR + .55 + .47, QY + 1.02, SZ); }
  for (const e of [-1, 1]) bx('ashlar', SX + .1, SX + .55, QY, QY + .45, SZ + e * 2.6 - .9, SZ + e * 2.6 + .9, .5);
  // rocks breaking the surface under the west wall, and blocks fallen near the arch; a few short stalactites, none low over the quay
  for (let k = 0, n = 0; k < 120 && n < 14; k++) { const z = Z0 - 9 - r() * (L - 14), x = -hw(z) + 1 + r() * 7, s = .6 + r() ** 2 * 2.2; if (beachT(x, z) > .05 || x > -hw(z) + 8 || x > QX(z) - s - 2) continue; n++;
    const g = mergeVertices(new THREE.IcosahedronGeometry(s * .6, 2).deleteAttribute('normal').deleteAttribute('uv')), P = g.attributes.position, sx = 1 + r() * .7, sy = .6 + r() * .5; for (let i = 0; i < P.count; i++) { const vx = P.getX(i), vy = P.getY(i), vz = P.getZ(i), [dx, dy, dz] = F(vx * 3 + x, vy * 3, vz * 3 + z); P.setXYZ(i, vx * sx + dx * .6 * s, vy * sy + dy * .4 * s, vz + dz * .6 * s); }
    g.computeVertexNormals(); put(g, 'rockWet', x, floorY(x, z) + s * .5 + .3, z, r() * .3, r() * 6, r() * .3, .35); }
  for (let k = 0; k < 40; k++) { const x = (r() * 2 - 1) * 12, z = Z0 - 3 - r() * (L - 10), ry = roofY(x, z), Lg = .3 + r() ** 2 * 1.2; if (Math.abs(x) > hw(z) - 1 || ry - Lg < QY + 6) continue; const g = growth(r, Lg + .5, .08 + Lg * .08); g.rotateX(Math.PI); put(g, 'rock', x, ry + .5, z); }
  // the walk: off the terrace, down the stair, onto the landing; to the spring and back; down the quay to the water stairs' head
  const walkY = (x, z) => z > PEND ? stepY(z) : QY;
  const path = [[0, MZ + 3.1], [0, Z0 - 1.4], [bx0 + BD + .9, SZ], [0, Z0 - 2.4], [QX(SHZ) + 1.8, SHZ]]; for (let z = SHZ - 2; z > QZ1 + .3; z -= 2) path.push([+(QX(z) + 1.8).toFixed(3), z]); path.push([QX(QZ1) + 1.8, QZ1 + .2]);
  const glow = []; for (let k = 0; k < 5; k++) { const z = Z0 - 10 - k * 10; glow.push([+(QX(z) / 2 - 3).toFixed(2), -.4, z]); }
  const group = new THREE.Group(); let tris = 0; for (const [k, gs] of B) { const g = mergeGeometries(gs, false); gs.forEach(x => x.dispose()); const m = new THREE.Mesh(g, M[k]); m.name = k; m.castShadow = !['sea', 'spring', 'fall'].includes(k); m.receiveShadow = true; group.add(m); tris += g.attributes.position.count / 3; }
  return { group, tris: Math.round(tris), draws: group.children.length, top: +new THREE.Box3().setFromObject(group).max.y.toFixed(2), path, walkY, glow, bollards, waterStairs: WS,
    quay: { y: QY, x: QX, z0: SHZ, z1: QZ1, w: QW }, stair: { z0: SZ0, z1: SZ1, n: NST, rise: RISE, run: RUN, top: TOPY }, mouth: { z: MZ, w: 2 * PH, h: PW2 + PH, y: TOPY },
    arch: { w: 2 * AW, h: AH, z: Z1 }, gate: { w: 2 * GW, d: GD }, chamber: { x0: -RX(.5), x1: RX(.5), z0: Z0, z1: Z1, h: CY + RY(.5) }, spring: { x: bx0 + BD / 2, y: QY + BH, z: SZ }, skiff, beach: { z0: BZ0, z1: BZ1 } };
}

// gatelandsAbbey(o, r) (Session 921, card F8): a monastic ruin, OG-121's Gatelands panel ("round cairns, monastic ruins and limestone
//   caves"), after the island's own: a ring of dry stone round a green, a roofless church, a round tower and a ringed high cross, the
//   brothers' beehive cells. What the brothers were, and why they left, is the quest writer's; no grave is built (§3.1). A metre a unit,
//   the green level at y 0, the gate on +z, the church's altar to the east (+x):
//   - the cashel: a dry-stone ring 61.6 m across, 1.4 m thick, battered, 2.0 to 2.2 m high, fallen to 0.6 m in two breaches with its
//     stones spilled either side; the gatehouse: two round arches 2.6 m wide and 3.6 m high, 7 m apart, between side walls, paved;
//   - the church: a nave 12 by 6.4 m inside, walls 0.9 m thick and 5 m high under gables of 9.4 m, a round-headed west door 1.4 by 2.6 m,
//     a chancel arch 3 by 4.2 m into a chancel 5.5 by 4.4 m with an east window over a stone altar; roofless, its wall-heads ragged, the
//     nave's south wall fallen to 1.3 m over 3.5 m and its stones lying in the grass; dressed stone at the doors and the arch;
//   - the round tower: 26 m of shaft, 5.2 m across at its foot and 4.4 at its head, under a stone cone to 30.4 m; its door 3.2 m up,
//     facing the church's west door, slits up the shaft and four windows under the cap;
//   - the high cross: 4.5 m, ringed, on a stepped base, in the green before the church;
//   - the cells: three corbelled stone huts, 6 m across and 4 m high, two whole with a door of 0.9 by 1.9 m under a lintel, one fallen to
//     its lower courses; the footings of a long range (14 by 7 m) where the brothers ate; a yew in the green, ash trees outside.
//   -> { group, tris, draws, top, path ([x, z], the walk at ground height: up to the gate, across the green to the west door, down the
//        nave and through the chancel arch), ground(x, z), cashel { r0, r1, gate, breaches ([a]) }, church { nave, chancel, door, arch, z },
//        tower { x, z, door { x, z, sill, ry }, top }, cross { x, z, h }, cells ([{ x, z, ry, whole }]), gatehouse { z0, z1, w, h } }
let AB = null;
function abbeyMats() {
  if (AB) return AB; markTextures(); const std = (c, ro = .9) => new THREE.MeshStandardMaterial({ color: c, roughness: ro });
  AB = { turf: mat('turfMoss', { ns: .8, color: 0xeeffc4, rough: 1 }), dry: mat('cobble', { ns: 1.4, color: 0xa8a498, rough: .95 }), rubble: mat('lichen', { ns: 1.2, color: 0xc4bfb0, rough: .95 }),
    dress: mat('ashlar', { ns: .9, color: 0xc8c2b2, rough: .9 }), tower: mat('lichen', { ns: 1.1, color: 0xd0cbbd, rough: .95 }), cross: mat('rock', { ns: 1.0, color: 0xb8b4a6, rough: .95 }),
    flag: mat('flag', { ns: 1.0, color: 0x9c998e, rough: .95 }), boulder: mat('rock', { ns: 1.5, color: 0x9c9a8e, rough: .95 }), dark: std(0x0b0a09, 1), leaf: std(0x2e4224), yew: std(0x1c2a18), bark: std(0x4a3c2e, .95) };
  AB.dry.side = THREE.DoubleSide; return AB;
}
export function gatelandsAbbey(o = {}, r = stream('abbey')) {
  const M = abbeyMats(), B = new Map(), key = String(o.key || 'abbey'), V = (x, y) => new THREE.Vector2(x, y);
  const put = (geo, k, x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0, uv = .5) => { const g = geo.index ? geo.toNonIndexed() : geo; for (const a of Object.keys(g.attributes)) if (!['position', 'normal'].includes(a)) g.deleteAttribute(a);
    if (!g.attributes.normal) g.computeVertexNormals();
    g.applyMatrix4(new THREE.Matrix4().compose(new THREE.Vector3(x, y, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(rx, ry, rz, 'YXZ')), new THREE.Vector3(1, 1, 1))); worldUV(g, uv);
    if (!B.has(k)) B.set(k, []); B.get(k).push(g); };
  const ph = Array.from({ length: 12 }, () => r() * 9), rag = (u, s = 1) => s * (.12 * Math.sin(u * 2.3 + ph[0]) + .08 * Math.sin(u * 5.1 + ph[1]) + .05 * Math.sin(u * 11.7 + ph[2]));
  const R0 = 29.4, R1 = 30.8, FLAT = 34;
  // the ground: the green level inside the ring and for 3 m outside it, then falling away and lumpy
  const F = field(stream(key + ':land'), .5), ground = (x, z) => { const d = Math.hypot(x, z); if (d <= FLAT) return 0; const w = Math.min(1, (d - FLAT) / 8); return -(d - FLAT) * .07 + F(x, 0, z)[1] * w * 1.2; };
  { const S = 1.25, N = 120, X0 = -75, pos = [], idx = [];
    for (let j = 0; j <= N; j++) for (let i = 0; i <= N; i++) { const x = X0 + i * S, z = X0 + j * S; pos.push(x, ground(x, z), z); }
    for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) { const a = j * (N + 1) + i, b = a + 1, c = a + N + 1, d = c + 1; idx.push(a, c, b, b, c, d); }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals(); put(g, 'turf', 0, 0, 0, 0, 0, 0, .5); }
  // a ring of dry stone about (cx, cz) from angle a0 to a1 (a 0 is +z, a pi/2 is +x), its faces battered, its head at h(a)
  const ringWall = (cx, cz, ro, ri, a0, a1, h, k, bat = .3, y0 = -.6) => { const N = Math.max(8, Math.ceil((a1 - a0) * ro / .5)), pos = [], P = (rr, a, y) => [cx + Math.sin(a) * rr, y, cz + Math.cos(a) * rr];
    const ring = []; for (let i = 0; i <= N; i++) { const a = a0 + (a1 - a0) * i / N, j = .05 * Math.sin(a * ro * 1.7 + ph[3]) + .04 * Math.sin(a * ro * 4.3 + ph[4]), hh = h(a); ring.push([P(ro + j, a, y0), P(ro - bat + j, a, hh), P(ri + bat * .5 - j, a, hh), P(ri - j, a, y0)]); }
    const tri = (a, b, c) => pos.push(...a, ...b, ...c), quad = (a, b, c, d) => { tri(a, b, c); tri(a, c, d); };
    for (let i = 0; i < N; i++) { const [ob, ot, it, ib] = ring[i], [OB, OT, IT, IB] = ring[i + 1]; quad(ob, OB, OT, ot); quad(ot, OT, IT, it); quad(ib, it, IT, IB); }
    if (a1 - a0 < Math.PI * 2 - 1e-6) for (const e of [ring[0], ring[N]]) quad(...e);
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.computeVertexNormals(); put(g, k, 0, 0, 0, 0, 0, 0, .55); };
  // a wall of rubble: its face in the local (u, y) plane, u from 0 to L, its head top(u), extruded T thick about z, at (x, z) turned ry
  // (ry 0 runs it along +x, ry -pi/2 along +z); holes are paths in (u, y)
  const archHole = (uc, w, sill, spring) => { const h = [V(uc - w / 2, sill), V(uc + w / 2, sill)]; for (let s = 0; s <= 16; s++) { const a = s / 16 * Math.PI; h.push(V(uc + Math.cos(a) * w / 2, spring + Math.sin(a) * w / 2)); } return new THREE.Path(h); };
  const wall = (L, T, top, holes, k, x, z, ry, y0 = -.4) => { const pts = [V(0, y0), V(L, y0)], n = Math.max(2, Math.ceil(L / .3)); for (let s = n; s >= 0; s--) { const u = L * s / n; pts.push(V(u, top(u))); }
    const sh = new THREE.Shape(pts); sh.holes.push(...holes); const g = new THREE.ExtrudeGeometry(sh, { depth: T, bevelEnabled: false, curveSegments: 16 }); g.translate(0, 0, -T / 2); put(g, k, x, 0, z, 0, ry, 0, .8); };
  // dressed stone round an arched opening: the ring and the jambs, a little proud of the wall either side
  const dressArch = (x, z, ry, w, sill, spring, T) => { const sh = new THREE.Shape(), R = w / 2; sh.absarc(0, spring, R + .28, 0, Math.PI, false); sh.absarc(0, spring, R, Math.PI, 0, true);
    const g = new THREE.ExtrudeGeometry(sh, { depth: T + .06, bevelEnabled: false, curveSegments: 16 }); g.translate(0, 0, -(T + .06) / 2); put(g, 'dress', x, 0, z, 0, ry, 0, .5);
    for (const e of [-1, 1]) { const j = new THREE.BoxGeometry(.28, spring - sill, T + .06); j.translate(e * (R + .14), (sill + spring) / 2, 0); put(j, 'dress', x, 0, z, 0, ry, 0, .5); } };
  const stone = (x, y, z, s, k = 'rubble') => put(roughen(new RoundedBoxGeometry(s * (1 + r() * .6), s * (.5 + r() * .3), s * (.7 + r() * .4), 2, s * .12), r, s * .06, 2), k, x, y + s * .2, z, (r() - .5) * .5, r() * 3, (r() - .5) * .5);
  // the cashel and its gate: a gap of the gatehouse's width at a 0; two breaches where it has fallen
  const GW = 2.0, GT = .9, GZ0 = 27, GZ1 = 34, GA = Math.asin((GW + GT) / ((R0 + R1) / 2)), BR = [1.9 + r() * .3, 4.2 + r() * .3];
  const cashelH = a => 2.05 + .1 * Math.sin(a * 23 + ph[5]) + .07 * Math.sin(a * 61 + ph[6]) - BR.reduce((s, b) => s + 1.5 * Math.sqrt(Math.max(0, 1 - Math.abs(a - b) / .075)), 0);
  ringWall(0, 0, R1, R0, GA, Math.PI * 2 - GA, cashelH, 'dry', .35);
  for (const b of BR) for (let k = 0; k < 16; k++) { const a = b + (r() - .5) * .12, d = (r() > .5 ? R1 + .4 + r() * 2.6 : R0 - .4 - r() * 2.6); stone(Math.sin(a) * d, 0, Math.cos(a) * d, .35 + r() * .3, 'dry'); }
  // the gatehouse: side walls along z, an arched wall at either end, paved between
  for (const e of [-1, 1]) wall(GZ1 - GZ0, GT, u => 3.9 + rag(u + e * 3), [], 'rubble', e * (GW + GT / 2), GZ0, -Math.PI / 2);
  const GAW = 2.6, GSP = 2.3; for (const z of [GZ0 + GT / 2, GZ1 - GT / 2]) { wall(2 * GW, GT, u => 4.5 + .5 * (1 - Math.abs(u - GW) / GW) + rag(u + z, .6), [archHole(GW, GAW, 0, GSP)], 'rubble', -GW, z, 0); dressArch(0, z, 0, GAW, 0, GSP, GT); }
  put(new THREE.BoxGeometry(2 * GW, .1, GZ1 - GZ0), 'flag', 0, -.03, (GZ0 + GZ1) / 2, 0, 0, 0, .5);
  // the church: the nave from NX0 to NX1 inside, the chancel from NX1 + T to CX1, about z ZC
  const T = .9, ZC = -10, NX0 = -10, NX1 = 2, NW = 3.2, NH = 5.0, NP = 9.4, CX0 = NX1 + T, CX1 = 8.4, CW = 2.2, CH = 4.0, CP = 6.8, BRK = [6, 9.5];
  const DW = 1.4, DSP = 1.9, AW = 3.0, ASP = 2.7;
  const gable = (w, h, p, s) => u => h + (p - h) * (1 - Math.abs(u - w) / w) + rag(u * 1.3 + s, .7);
  wall(NX1 - NX0 + 2 * T, T, u => NH + rag(u), [archHole(6.5, .45, 2.4, 3.2)], 'rubble', NX0 - T, ZC - NW - T / 2, 0) /* the north wall, one window */;
  wall(NX1 - NX0 + 2 * T, T, u => NH + rag(u + 4) - (u > BRK[0] && u < BRK[1] ? Math.sin(Math.PI * (u - BRK[0]) / (BRK[1] - BRK[0])) ** .4 * (NH - 1.3 + rag(u * 3.1 + 2, 2.2)) : 0), [archHole(3.0, .45, 2.4, 3.2), archHole(11.5, .45, 2.4, 3.2)], 'rubble', NX0 - T, ZC + NW + T / 2, 0) /* the south wall, its breach */;
  wall(2 * NW, T, gable(NW, NH, NP, 1), [archHole(NW, DW, 0, DSP), archHole(NW, .35, 5.8, 6.5)], 'rubble', NX0 - T / 2, ZC - NW, -Math.PI / 2) /* the west gable and its door */;
  dressArch(NX0 - T / 2, ZC, -Math.PI / 2, DW, 0, DSP, T);
  wall(2 * NW, T, gable(NW, NH, NP, 2), [archHole(NW, AW, 0, ASP)], 'rubble', NX1 + T / 2, ZC - NW, -Math.PI / 2) /* the chancel arch */;
  dressArch(NX1 + T / 2, ZC, -Math.PI / 2, AW, 0, ASP, T);
  for (const e of [-1, 1]) wall(CX1 - CX0 + T, T, u => CH + rag(u + e * 7), e > 0 ? [archHole(3.0, .4, 1.8, 2.6)] : [], 'rubble', CX0, ZC + e * (CW + T / 2), 0);
  wall(2 * CW, T, gable(CW, CH, CP, 3), [archHole(CW, .4, 1.7, 3.0)], 'rubble', CX1 + T / 2, ZC - CW, -Math.PI / 2) /* the east gable and its window */;
  put(new RoundedBoxGeometry(1.0, .95, 1.8, 2, .04), 'dress', CX1 - .6, .47, ZC) /* the altar, a block of stone */;
  for (let k = 0; k < 14; k++) { const x = NX0 - T + BRK[0] + r() * (BRK[1] - BRK[0]), z = ZC + NW + T + .4 + r() * 2.6; stone(x, 0, z, .3 + r() * .25); }
  for (let k = 0; k < 6; k++) stone(NX0 + 2 + r() * 9, 0, ZC + NW - .4 - r() * .6, .25 + r() * .2) /* a few inside, by the wall */;
  // the round tower, its door turned to the church's west door
  const TX = -17, TZ = -19, TH = 26, TR0 = 2.6, TR1 = 2.2, tr = y => TR0 + (TR1 - TR0) * Math.max(0, y) / TH, SILL = 3.2, TRY = Math.atan2(-(ZC - TZ), (NX0 - T) - TX);
  { const prof = []; for (let y = -.5; y <= TH + .01; y += 1) prof.push(V(tr(y), y)); put(new THREE.LatheGeometry(prof, 44), 'tower', TX, 0, TZ, 0, 0, 0, .8);
    put(new THREE.CylinderGeometry(TR0 + .22, TR0 + .3, .9, 44), 'tower', TX, .05, TZ);
    const cap = [V(TR1 - .05, TH - .3), V(TR1 + .1, TH - .05), V(TR1 + .1, TH + .2)]; /* closed under its eave, onto the shaft */ for (let s = 1; s <= 10; s++) { const t = s / 10; cap.push(V((TR1 + .02) * (1 - t) ** 1.15, TH + .2 + 4.2 * t)); } put(new THREE.LatheGeometry(cap, 44), 'tower', TX, 0, TZ, 0, 0, 0, .45);
    const at = (ry, d, lz) => [TX + Math.cos(ry) * d + Math.sin(ry) * lz, TZ - Math.sin(ry) * d + Math.cos(ry) * lz];
    const opening = (ry, y, w, h) => { const d = tr(y + h / 2); for (const e of [-1, 1]) { const [x, z] = at(ry, d, e * (w / 2 + .12)); put(new THREE.BoxGeometry(.4, h, .24), 'dress', x, y + h / 2, z, 0, ry); }
      for (const [yy, hh] of [[y - .1, .2], [y + h + .2, .4]]) { const [x, z] = at(ry, d, 0); put(new THREE.BoxGeometry(.4, hh, w + .48), 'dress', x, yy, z, 0, ry); }
      const [x, z] = at(ry, d - .05, 0); put(new THREE.BoxGeometry(.3, h, w), 'dark', x, y + h / 2, z, 0, ry); };
    opening(TRY, SILL, .8, 1.8); opening(TRY + 2.2, 8.5, .22, .7); opening(TRY - 2.0, 13.5, .22, .7); opening(TRY + .9, 18.5, .22, .7);
    for (let q = 0; q < 4; q++) opening(TRY + .4 + q * Math.PI / 2, TH - 2.4, .42, 1.0); }
  // the high cross: a stepped base, the shaft, the arms in their ring, a capstone
  const CRX = -12, CRZ = 4, CRY = .35;
  { const P = (g, y, k = 'cross') => { g.translate(0, y, 0); put(g, k, CRX, 0, CRZ, 0, CRY, 0, .5); };
    P(new THREE.BoxGeometry(1.9, .5, 1.5), .2, 'boulder'); P(new THREE.BoxGeometry(1.35, .5, 1.0), .65, 'boulder'); P(new THREE.BoxGeometry(.85, .3, .55), 1.05);
    P(new THREE.BoxGeometry(.5, 2.7, .3), 2.55); P(new THREE.BoxGeometry(1.9, .42, .3), 3.35); P(new THREE.BoxGeometry(.46, .55, .28), 4.12); P(new THREE.BoxGeometry(.56, .1, .34), 4.44);
    const sh = new THREE.Shape(); sh.absarc(0, 0, .66, 0, Math.PI * 2, false); const hole = new THREE.Path(); hole.absarc(0, 0, .48, 0, Math.PI * 2, true); sh.holes.push(hole);
    const g = new THREE.ExtrudeGeometry(sh, { depth: .22, bevelEnabled: false, curveSegments: 28 }); g.translate(0, 0, -.11); P(g, 3.35);
    for (const s of [-1, 1]) for (const y of [1.6, 2.4]) P(new THREE.BoxGeometry(.36, .62, .03).translate(0, 0, s * .16), y) /* the panels, raised on both faces */; }
  // the cells: two corbelled huts whole, their doors to the green, and one fallen to its lower courses
  const cells = [{ x: 15, z: -13 }, { x: 20, z: -3 }, { x: 15, z: 9, fallen: true }].map(c => ({ ...c, ry: Math.atan2(-c.x, -c.z), whole: !c.fallen }));
  const CO = 3.0, CHo = 4.0, CI = 2.0, CHi = 3.3, CDW = .9, CDH = 1.9;
  for (const c of cells) {
    if (c.whole) { const shell = (R, H, y0, inner) => { const p = []; for (let s = 0; s <= 18; s++) { const y = y0 + (H - y0) * s / 18; p.push(V(s === 18 ? 0 : R * Math.sqrt(Math.max(0, 1 - Math.max(0, y / H) ** 1.8)), y)); } if (inner) p.reverse();
          const g = new THREE.LatheGeometry(p, 64).toNonIndexed(), P = g.attributes.position.array, N = g.attributes.normal.array, kp = [], kn = [];
          for (let i = 0; i < P.length; i += 9) { const cx = (P[i] + P[i + 3] + P[i + 6]) / 3, cy = (P[i + 1] + P[i + 4] + P[i + 7]) / 3, cz = (P[i + 2] + P[i + 5] + P[i + 8]) / 3; if (cz > 0 && Math.abs(cx) < .62 && cy < CDH + .15) continue; kp.push(...P.slice(i, i + 9)); kn.push(...N.slice(i, i + 9)); }
          const o2 = new THREE.BufferGeometry(); o2.setAttribute('position', new THREE.Float32BufferAttribute(kp, 3)); o2.setAttribute('normal', new THREE.Float32BufferAttribute(kn, 3)); return o2; };
        put(shell(CO, CHo, -.4, false), 'dry', c.x, 0, c.z, 0, c.ry, 0, .55); put(shell(CI, CHi, 0, true), 'dry', c.x, 0, c.z, 0, c.ry, 0, .55);
        for (const e of [-1, 1]) put(new THREE.BoxGeometry(.45, CDH + .4, 1.7).translate(e * (CDW / 2 + .225), (CDH - .4) / 2, 2.3), 'dry', c.x, 0, c.z, 0, c.ry, 0, .55);
        put(new THREE.BoxGeometry(2.0, .42, 1.7).translate(0, CDH + .21, 2.3), 'boulder', c.x, 0, c.z, 0, c.ry, 0, .55); }
    else { ringWall(c.x, c.z, CO, CI, c.ry + .2, c.ry + Math.PI * 2 - .2, a => 1.0 + .35 * Math.sin(a * 3 + ph[7]) + .15 * Math.sin(a * 7 + ph[8]), 'dry', .25, -.4);
      for (let k = 0; k < 18; k++) { const a = r() * Math.PI * 2, d = r() * 1.6; stone(c.x + Math.sin(a) * d, .05 + (1.6 - d) * .3, c.z + Math.cos(a) * d, .3 + r() * .25, 'dry'); } } }
  // the long range's footings, where the brothers ate: low walls, a door gap on the north
  { const x0 = -22, x1 = -8, z0 = 12, z1 = 19, t = .75, low = s => u => .55 + .3 * Math.sin(u * 1.7 + s) + rag(u + s, .8);
    wall(x1 - x0, t, low(1), [], 'rubble', x0, z1, 0); wall(5, t, low(2), [], 'rubble', x0, z0, 0); wall(x1 - x0 - 6.4, t, low(3), [], 'rubble', x0 + 6.4, z0, 0);
    for (const x of [x0 + t / 2, x1 - t / 2]) wall(z1 - z0 - t, t, low(x), [], 'rubble', x, z0 + t / 2, -Math.PI / 2); }
  // the trees: a yew in the green, ash outside the ring
  const tree = (x, z, h, w, k) => { const y = ground(x, z); put(new THREE.CylinderGeometry(w * .1, w * .14, h * .5, 7), 'bark', x, y + h * .25, z); for (let q = 0; q < 4; q++) { const s = w * (.55 + r() * .25), g = roughen(new THREE.IcosahedronGeometry(s, 2), r, s * .14, 1.3); g.scale(1, .8, 1); put(g, k, x + (r() - .5) * w * .7, y + h * .55 + r() * h * .3, z + (r() - .5) * w * .7, 0, r() * 3, 0, .4); } };
  tree(7, 15, 7, 3.4, 'yew'); for (const [x, z] of [[-40, 8], [38, -22], [-30, -42], [44, 18]]) tree(x, z, 10 + r() * 3, 3.2, 'leaf');
  // the walk: up to the gate, through it, across the green to the west door, down the nave and through the chancel arch
  const path = [[0, 42], [0, 24], [NX0 - T - 4, ZC], [NX0 + .5, ZC], [CX0 - .45, ZC], [CX1 - 2, ZC]];
  const group = new THREE.Group(); let tris = 0; for (const [k, gs] of B) { const g = mergeGeometries(gs, false); gs.forEach(x => x.dispose()); const m = new THREE.Mesh(g, M[k]); m.name = k; m.castShadow = k !== 'turf'; m.receiveShadow = true; group.add(m); tris += g.attributes.position.count / 3; }
  return { group, tris: Math.round(tris), draws: group.children.length, top: +new THREE.Box3().setFromObject(group).max.y.toFixed(2), path, ground,
    cashel: { r0: R0, r1: R1, gate: GA, breaches: BR }, gatehouse: { z0: GZ0, z1: GZ1, w: GAW, h: GSP + GAW / 2 },
    church: { z: ZC, nave: { x0: NX0, x1: NX1, w: 2 * NW, h: NH }, chancel: { x0: CX0, x1: CX1, w: 2 * CW }, door: { x: NX0 - T / 2, w: DW, h: DSP + DW / 2 }, arch: { x: NX1 + T / 2, w: AW, h: ASP + AW / 2 } },
    tower: { x: TX, z: TZ, r: TR0, top: TH + 4.4, door: { sill: SILL, ry: TRY, x: TX + Math.cos(TRY) * (tr(SILL + .9) + .15), z: TZ - Math.sin(TRY) * (tr(SILL + .9) + .15) } } /* on the sill, at its outer edge */,
    cross: { x: CRX, z: CRZ, h: 4.49, ry: CRY, ring: 3.35 }, cells, cell: { r: CI, h: CHi, door: [CDW, CDH] } };
}

// ── the Gatelands' tower mill (Session 949, card F8; backlog L5's roads and works, OG-046's "farms and windmills"; OG-014's whitewashed
// country). A tower mill of the south-east coast's kind, at true size, its door to +z:
//   - the tower: rubble, limewashed, battered from 6 m across at the foot to 4.6 m at the curb 9.6 m up (so the sails clear a man under them by 2.4 m), a tarred plinth; two doors, front
//     and back (so the miller can come and go whichever way the sails face), round-headed under dressed stone; four floors of small
//     windows turning up the tower; a millstone worn out and leaned by the door, sacks of meal;
//   - the cap: thatched, as the old Irish mills' were, an ogee of straw on a timber curb that turns on the tower's top;
//   - the windshaft: out of the cap's front at 6° up, the hub 4.2 m out from the tower's axis;
//   - the sails: four commons, each a stock 8.6 m from the hub, a lattice of bars on the trailing side 1.9 m wide from 1.6 m out, and
//     its cloth: spread (o.working, the default) or furled along the stock (false: a still day, or a mill at rest);
//   - the tail pole: from the cap's back down to a cart wheel on the ground, by which the miller turns the cap into the wind.
// o.wind (the cap's turn, radians; 0 faces the sails to +z), o.angle (the sails' turn about the shaft). -> { group, tris, draws, top,
//   tower { r0, r1, h }, hub [x, y, z], shaft [dx, dy, dz] (its unit direction), sail { len, from, width }, tipLow (the lowest tip over
//   the ground at this angle), doors [{ x, z, w, h, face }], tail [x, z] (the wheel), ground(x, z) }
let MI = null;
function millMats() {
  if (MI) return MI; markTextures(); const std = (c, ro = .9, o = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: ro, ...o });
  MI = { lime: mat('plaster', { ns: .8, color: 0xf0ece0, rough: .95 }), tar: std(0x161412, .7), dress: mat('ashlar', { ns: .9, color: 0xc8c2b2, rough: .9 }), thatch: mat('thatch', { ns: 1.0, color: 0xe6d098, rough: 1 }),
    timber: mat('beam', { ns: 1.0, color: 0x6a5038, rough: .9 }), sailwood: mat('wood', { ns: .8, color: 0x8a6c4c, rough: .85 }), cloth: std(0xe6dcc4, .95, { side: THREE.DoubleSide }), door: mat('wood', { ns: .8, color: 0x2e5a48, rough: .7 }),
    dark: std(0x0d0b09, 1), iron: std(0x2a2826, .5, { metalness: .6 }), grit: mat('rock', { ns: .8, color: 0xb0a690, rough: 1 }), sack: mat('plaster', { ns: .4, color: 0xc8b48c, rough: 1 }), turf: mat('turfMoss', { ns: .8, color: 0xeeffc4, rough: 1 }),
    path: mat('cobble', { ns: 1.0, color: 0x9a9284, rough: .95 }) };
  return MI;
}
export function gatelandsMill(o = {}, r = stream('mill')) {
  const M = millMats(), B = new Map(), V = (x, y) => new THREE.Vector2(x, y), wind = o.wind ?? 0, ang = o.angle ?? .35, working = o.working !== false;
  const put = (geo, k, x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0, uv = .5) => { const g = geo.index ? geo.toNonIndexed() : geo; for (const a of Object.keys(g.attributes)) if (!['position', 'normal'].includes(a)) g.deleteAttribute(a);
    if (!g.attributes.normal) g.computeVertexNormals(); g.applyMatrix4(new THREE.Matrix4().compose(new THREE.Vector3(x, y, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(rx, ry, rz, 'YXZ')), new THREE.Vector3(1, 1, 1))); worldUV(g, uv);
    if (!B.has(k)) B.set(k, []); B.get(k).push(g); return g; };
  const putM = (geo, k, m4, uv = .5) => { const g = geo.index ? geo.toNonIndexed() : geo; for (const a of Object.keys(g.attributes)) if (!['position', 'normal'].includes(a)) g.deleteAttribute(a); g.applyMatrix4(m4); worldUV(g, uv); if (!B.has(k)) B.set(k, []); B.get(k).push(g); };
  // the ground: a knoll, flat for 7 m round the tower and falling gently away; a path of stone to the front door
  const ground = (x, z) => { const d = Math.hypot(x, z); return d < 7 ? 0 : -(d - 7) * .05 + .15 * Math.sin(x * .21 + z * .13) * Math.min(1, (d - 7) / 6); };
  { const S = 1.5, N = 60, X0 = -45, pos = [], idx = []; for (let j = 0; j <= N; j++) for (let i = 0; i <= N; i++) { const x = X0 + i * S, z = X0 + j * S; pos.push(x, ground(x, z), z); }
    for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) { const a = j * (N + 1) + i, b = a + 1, c = a + N + 1, d = c + 1; idx.push(a, c, b, b, c, d); }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals(); put(g, 'turf'); }
  for (let z = 3.2; z < 30; z += .9) put(new THREE.BoxGeometry(1.4, .06, .86), 'path', (r() - .5) * .1, ground(0, z) + .02, z, 0, (r() - .5) * .08);
  // the tower: a battered round of rubble, limewashed; the tar plinth; the doors and windows cut as dark reveals with dressed heads; 9.6 m to the curb (9.0 until Session 1005: the sails came within 1.76 m of the ground, the critic's s639)
  const r0 = 3.0, r1 = 2.3, h = 9.6, rad = y => r0 + (r1 - r0) * y / h;
  put(new THREE.LatheGeometry([V(.001, -.5), V(r0 + .05, -.5), V(r0, 0), V(r1, h), V(.001, h)], 40), 'lime');
  put(new THREE.CylinderGeometry(rad(.5) + .02, r0 + .02, .5, 40, 1, true), 'tar', 0, .25, 0);
  /* each opening laid on the wall's batter (leaning in by bat) and just proud of it, so its foot does not sink into the stone */
  const bat = Math.atan((r0 - r1) / h), doors = [], hole = (a, y, w, ht, k) => { const ym = y + (ht - w / 2) / 2, rr = rad(ym) + .03, x = Math.sin(a) * rr, z = Math.cos(a) * rr, at = yy => [Math.sin(a) * (rad(yy) + .035), Math.cos(a) * (rad(yy) + .035)];
    put(new THREE.PlaneGeometry(w, ht - w / 2), 'dark', x, ym, z, -bat, a); { const [hx, hz] = at(y + ht - w / 2); put(new THREE.CircleGeometry(w / 2, 10, 0, Math.PI), 'dark', hx, y + ht - w / 2, hz, -bat, a);
      put(new THREE.RingGeometry(w / 2, w / 2 + .2, 10, 1, 0, Math.PI), 'dress', hx + Math.sin(a) * .01, y + ht - w / 2, hz + Math.cos(a) * .01, -bat, a); }
    if (k) { put(new THREE.BoxGeometry(w * .94, ht - w / 2 - .02, .05), 'door', x - Math.sin(a) * .03, y + (ht - w / 2) / 2, z - Math.cos(a) * .03, 0, a); put(new THREE.BoxGeometry(w + .5, .16, .5), 'dress', Math.sin(a) * (rr + .15), .08, Math.cos(a) * (rr + .15), 0, a); doors.push({ x: +x.toFixed(2), z: +z.toFixed(2), w, h: ht, face: a }); } };
  hole(0, 0, 1.05, 2.15, true); hole(Math.PI, 0, 1.05, 2.15, true);
  for (let f = 0; f < 4; f++) { const y = 1.2 + f * 2.1, a0 = f * 1.1 + .6; for (let k = 0; k < 2; k++) hole(a0 + k * Math.PI, y, .55, .8, false); }
  // the curb at the tower's head and the cap of thatch on it, an ogee to a finial
  const capY = h + .25; put(new THREE.CylinderGeometry(r1 + .22, r1 + .22, .25, 40), 'timber', 0, h + .125, 0);
  put(new THREE.LatheGeometry([V(.001, 0), V(r1 + .45, 0), V(r1 + .5, .25), V(r1 + .3, .9), V(1.6, 1.8), V(.7, 2.6), V(.3, 3.1), V(.001, 3.25)], 32), 'thatch', 0, capY, 0, 0, 0, 0, .55);
  put(new THREE.CylinderGeometry(.08, .12, .8, 8), 'timber', 0, capY + 3.5, 0); put(new THREE.SphereGeometry(.16, 10, 8), 'timber', 0, capY + 3.95, 0);
  // the windshaft out of the cap's front at 6° up; the hub; the four sails, each turned by ang + k·90° about the shaft
  const tilt = .105, D = new THREE.Vector3(Math.sin(wind) * Math.cos(tilt), Math.sin(tilt), Math.cos(wind) * Math.cos(tilt)), HUBR = 4.2, hub = new THREE.Vector3(Math.sin(wind) * HUBR, capY + .9 + (HUBR - 1.0) * Math.tan(tilt), Math.cos(wind) * HUBR);
  const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), D), sh = new THREE.CylinderGeometry(.22, .26, HUBR - .6, 12); sh.rotateX(Math.PI / 2);
  putM(sh, 'timber', new THREE.Matrix4().compose(hub.clone().addScaledVector(D, -(HUBR - .6) / 2 - .2), q, new THREE.Vector3(1, 1, 1))); { const c = new THREE.CylinderGeometry(.42, .42, .5, 14); c.rotateX(Math.PI / 2); putM(c, 'iron', new THREE.Matrix4().compose(hub, q, new THREE.Vector3(1, 1, 1))); }
  const SL = 8.6, S0 = 1.6, SW = 1.9; let tipLow = 99;
  const frameAt = th => new THREE.Matrix4().compose(hub, q.clone().multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), th)), new THREE.Vector3(1, 1, 1));
  for (let k = 0; k < 4; k++) { const th = ang + k * Math.PI / 2, rot = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), th), base = new THREE.Matrix4().compose(hub, q.clone().multiply(rot), new THREE.Vector3(1, 1, 1));
    const L = (g, k2) => putM(g, k2, base.clone()); const bxS = (w, h2, d, x, y, z) => { const g = new THREE.BoxGeometry(w, h2, d); g.translate(x, y, z); return g; };
    // in the sail's own frame: the stock up +y from the hub, the lattice on its trailing side (+x), 0.15 in front of the hub's face
    L(bxS(.24, SL, .2, 0, SL / 2, .25), 'sailwood');
    for (let s = S0; s <= SL - .1; s += .55) L(bxS(SW, .06, .06, SW / 2, s, .3), 'sailwood'); L(bxS(.07, SL - S0, .07, SW, (SL + S0) / 2, .3), 'sailwood'); L(bxS(.05, SL - S0, .05, SW * .5, (SL + S0) / 2, .3), 'sailwood');
    if (working) L(bxS(SW - .1, SL - S0 - .1, .01, SW / 2, (SL + S0) / 2, .36), 'cloth'); else { const g = new THREE.CylinderGeometry(.16, .16, SL - S0 - .3, 8); g.translate(.25, (SL + S0) / 2, .36); L(g, 'cloth'); }
    for (const [x, y] of [[0, SL], [SW, SL]]) { const p = new THREE.Vector3(x, y, .3).applyMatrix4(base); tipLow = Math.min(tipLow, p.y - ground(p.x, p.z)); } }
  // the tail pole from the cap's back down to a cart wheel on the ground, and its two braces
  const back = new THREE.Vector3(-Math.sin(wind), 0, -Math.cos(wind)), top = new THREE.Vector3(0, capY + .6, 0).addScaledVector(back, r1 + .2), wheel = new THREE.Vector3(0, 0, 0).addScaledVector(back, 9.5); wheel.y = ground(wheel.x, wheel.z) + .55;
  { const d = wheel.clone().sub(top), g = new THREE.CylinderGeometry(.11, .14, d.length(), 8); putM(g, 'timber', new THREE.Matrix4().compose(top.clone().add(wheel).multiplyScalar(.5), new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize()), new THREE.Vector3(1, 1, 1)));
    for (const s of [-1, 1]) { const side = new THREE.Vector3(Math.cos(wind), 0, -Math.sin(wind)).multiplyScalar(s * 1.2), a = new THREE.Vector3(0, capY + .1, 0).addScaledVector(back, r1).add(side), b = top.clone().lerp(wheel, .45), dd = b.clone().sub(a), gg = new THREE.CylinderGeometry(.06, .06, dd.length(), 6);
      putM(gg, 'timber', new THREE.Matrix4().compose(a.clone().add(b).multiplyScalar(.5), new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dd.normalize()), new THREE.Vector3(1, 1, 1))); }
    const wg = new THREE.TorusGeometry(.5, .05, 6, 18); put(wg, 'timber', wheel.x, wheel.y, wheel.z, 0, wind + Math.PI / 2); for (let s = 0; s < 6; s++) put(new THREE.BoxGeometry(.04, 1.0, .04), 'timber', wheel.x, wheel.y, wheel.z, 0, wind + Math.PI / 2, s * Math.PI / 6); }
  // by the front door: a worn millstone leaned on the wall, sacks of meal, a bench
  { const a = .55, rr = rad(.6), st = new THREE.CylinderGeometry(.62, .62, .2, 22); put(st, 'grit', Math.sin(a) * (rr + .25), .62, Math.cos(a) * (rr + .25), Math.PI / 2 - .2, a, 0, .4);
    for (let k = 0; k < 3; k++) { const b = -.42 - k * .14, d = rad(.3) + .35; put(new THREE.CapsuleGeometry(.24, .35, 3, 8).scale(1, 1, .8), 'sack', Math.sin(b) * d, .42 - (k === 2 ? .1 : 0), Math.cos(b) * d, 0, b, k === 2 ? 1.2 : 0); } }
  const finish = () => { const group = new THREE.Group(); let tris = 0; for (const [k, gs] of B) { const g = mergeGeometries(gs, false); gs.forEach(x => x.dispose()); const m = new THREE.Mesh(g, M[k]); m.name = k; m.castShadow = k !== 'turf'; m.receiveShadow = true; group.add(m); tris += g.attributes.position.count / 3; }
    return { group, tris: Math.round(tris), draws: group.children.length, top: +new THREE.Box3().setFromObject(group).max.y.toFixed(2) }; };
  return { ...finish(), tower: { r0, r1, h, rad }, hub: hub.toArray().map(v => +v.toFixed(3)), shaft: D.toArray(), sail: { len: SL, from: S0, width: SW, front: .3 }, tipLow: +tipLow.toFixed(2), doors, tail: [+wheel.x.toFixed(2), +wheel.z.toFixed(2)], capY, ground, wind, working,
    /* the sails' lattice outline at a turn th (the four of them): points along the stock and the outer bar, for the clearance checks */ sailPts: th => { const out = []; for (let k = 0; k < 4; k++) { const m = frameAt(th + k * Math.PI / 2); for (let s2 = S0; s2 <= SL + .001; s2 += (SL - S0) / 12) for (const x of [0, SW]) out.push(new THREE.Vector3(x, s2, .3).applyMatrix4(m)); } return out; } };
}

// ── the Gatelands' lighthouse (Session 967, card F8; L5's "roads and works", OG-046's lighthouses and beacons, OG-058's waystation
// lighthouse). The Irish precedent is Hook Head: a squat round tower of limewashed rubble with two tarred bands, a corbelled gallery
// and a lantern on its head, a keeper's house in a walled yard beside it. Built at true size on its headland, the sea to +z:
//   - the headland: a promontory, a flat top of turf round the tower running on landward (to -z) as a neck, breaking at a ragged cliff that falls 14 m to the sea (the break 12.5 m out on the mean, 10.5 at the nearest);
//     rocks along the break;
//   - the tower: battered from 7.6 m across at the foot to 6.6 m at the gallery 20 m up, limewashed, on a tarred plinth, with two tarred
//     bands; a round-headed door landward, 1.1 by 2.3 m, on a step; small windows up a spiral stair's turn;
//   - the gallery: a stone deck on 24 corbels round the tower's head, 1 m wider than the tower, an iron railing of 1.05 m;
//   - the lantern: a pedestal of stone, a glazed room of twelve sides (1.4 m round, 2.4 m high, its astragals painted red), the lamp
//     and its lens inside, a copper dome gone green, a ventilator ball and a vane;
//   - the keeper's house: the kit's cottage (GL_PLANS.cottage), landward, in a yard behind a low rubble wall; a path to the door.
// o.lit (night): the lamp burns. -> { group, tris, draws, top, tower { r0, r1, h }, gallery { y, rOut, rail }, lantern { r, y0, y1 },
//   focal [x, y, z] (the lamp, over the sea's face), door { x, z, w, h }, cottage { x, z, w, d, ry }, cliff (the break's distance from
//   the tower in each direction, sampled), ground(x, z), sea }
let LH = null;
function lightMats() {
  if (LH) return LH; const std = (c, ro = .9, o = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: ro, ...o }), MI = millMats();
  LH = { ...MI, rock: mat('rock', { ns: 1.1, color: 0x8c877c, rough: 1 }), rubble: mat('stone', { ns: 1.0, color: 0xc8c2b4, rough: .95 }), red: std(0x8a1e18, .6), copper: std(0x5f9a86, .55, { metalness: .3 }),
    glass: std(0x1a2226, .05, { transparent: true, opacity: .35, depthWrite: false }), lens: std(0xe8f0f0, .05, { transparent: true, opacity: .55 }),
    lamp: std(0x3a3020, .4, { emissive: 0xffd890, emissiveIntensity: 0 }), sea: std(0x274a58, .25, { metalness: .1 }) };
  return LH;
}
export function gatelandsLighthouse(o = {}, r = stream('lighthouse')) {
  const M = lightMats(), B = new Map(), V = (x, y) => new THREE.Vector2(x, y), lit = !!o.lit;
  const put = (geo, k, x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0, uv = .5) => { const g = geo.index ? geo.toNonIndexed() : geo; for (const a of Object.keys(g.attributes)) if (!['position', 'normal'].includes(a)) g.deleteAttribute(a);
    if (!g.attributes.normal) g.computeVertexNormals(); g.applyMatrix4(new THREE.Matrix4().compose(new THREE.Vector3(x, y, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(rx, ry, rz, 'YXZ')), new THREE.Vector3(1, 1, 1))); worldUV(g, uv);
    if (!B.has(k)) B.set(k, []); B.get(k).push(g); return g; };
  // the headland: flat within the break (11 m seaward, stretched landward), the cliff 14 m down to the sea
  // (a promontory: the break is ragged by its bearing, and landward the neck runs on at the break's width)
  const SEA = -14, BRK = 12.5, brk = a => BRK + 2.2 * Math.sin(3 * a + .4) + 1.2 * Math.sin(7 * a + 1.3) + .5 * Math.sin(13 * a), dist = (x, z) => { const zz = Math.max(0, z), a = Math.atan2(x, zz); return Math.hypot(x, zz) * BRK / brk(a); };
  const ground = (x, z) => { const d = dist(x, z), n = .12 * Math.sin(x * .31 + z * .17) + .08 * Math.sin(x * .07 - z * .23);
    return d < BRK ? n * Math.min(1, d / 6) : Math.max(SEA - 1, n - (d - BRK) * 7 - 1.5 * Math.sin(x * .9 + z * 1.3) * Math.min(1, d - BRK)); };
  // the ground in two grids: a metre round the headland, three metres down the neck inland
  for (const [S, X0, Z0, NX, NZ, sink] of [[1, -45, -45, 90, 90, 0], [3, -45, -141, 30, 33, .04] /* 3 m under the fine one, a little lower, so no crack shows at the seam */]) { const pos = [], idx = [], rockI = []; for (let j = 0; j <= NZ; j++) for (let i = 0; i <= NX; i++) { const x = X0 + i * S, z = Z0 + j * S; pos.push(x, ground(x, z) - sink, z); }
    for (let j = 0; j < NZ; j++) for (let i = 0; i < NX; i++) { const a = j * (NX + 1) + i, b = a + 1, c = a + NX + 1, d = c + 1, x = X0 + (i + .5) * S, z = Z0 + (j + .5) * S; (dist(x, z) < BRK + .5 ? idx : rockI).push(a, c, b, b, c, d); }
    for (const [k, I] of [['turf', idx], ['rock', rockI]]) { const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(I); g.computeVertexNormals(); put(g.toNonIndexed(), k, 0, 0, 0, 0, 0, 0, .25); } }
  { const g = new THREE.PlaneGeometry(400, 400); g.rotateX(-Math.PI / 2); put(g, 'sea', 0, SEA, 0); }
  for (let k = 0; k < 40; k++) { const a = k / 40 * Math.PI - Math.PI / 2 + r() * .05, d = brk(a) + .2 + r() * .5, x = Math.sin(a) * d, z = Math.cos(a) * d, s = .5 + r() * .7;
    put(new THREE.DodecahedronGeometry(s, 0), 'rock', x, ground(x, z) + s * .3, z, r() * 3, r() * 3, 0, .4); }
  // the tower: battered, limewashed, on a tarred plinth, two tarred bands
  const r0 = 3.8, r1 = 3.3, h = 20, rad = y => r0 + (r1 - r0) * y / h;
  put(new THREE.LatheGeometry([V(.001, -1.2), V(r0 + .05, -1.2), V(r0, 0), V(r1, h), V(.001, h)], 48), 'lime');
  put(new THREE.CylinderGeometry(rad(.6) + .02, r0 + .02, .6, 48, 1, true), 'tar', 0, .3, 0);
  for (const [y0, y1] of [[7.0, 9.4], [13.2, 15.6]]) put(new THREE.CylinderGeometry(rad(y1) + .012, rad(y0) + .012, y1 - y0, 48, 1, true), 'tar', 0, (y0 + y1) / 2, 0);
  const bat = Math.atan((r0 - r1) / h), hole = (a, y, w, ht, door) => { const ym = y + (ht - w / 2) / 2, rr = rad(ym) + .03, x = Math.sin(a) * rr, z = Math.cos(a) * rr, hy = y + ht - w / 2, hr = rad(hy) + .035;
    put(new THREE.PlaneGeometry(w, ht - w / 2), 'dark', x, ym, z, -bat, a); put(new THREE.CircleGeometry(w / 2, 10, 0, Math.PI), 'dark', Math.sin(a) * hr, hy, Math.cos(a) * hr, -bat, a);
    put(new THREE.RingGeometry(w / 2, w / 2 + .2, 10, 1, 0, Math.PI), 'dress', Math.sin(a) * (hr + .01), hy, Math.cos(a) * (hr + .01), -bat, a);
    if (door) { put(new THREE.BoxGeometry(w * .94, ht - w / 2 - .02, .05), 'red', x - Math.sin(a) * .03, y + (ht - w / 2) / 2, z - Math.cos(a) * .03, 0, a); put(new THREE.BoxGeometry(w + .6, .16, .55), 'dress', Math.sin(a) * (rr + .2), .08, Math.cos(a) * (rr + .2), 0, a); } return { x: +x.toFixed(2), z: +z.toFixed(2), w, h: ht }; };
  const door = hole(Math.PI, 0, 1.1, 2.3, true);
  for (let f = 0; f < 6; f++) hole(Math.PI + .9 + f * 1.05, 3.2 + f * 2.7, .5, .9, false);
  // the gallery: a stone deck on corbels, a railing; the lantern's pedestal, glazing, astragals, lamp and lens, dome, ball and vane
  const GY = h + .3, GR = r1 + 1.0; put(new THREE.CylinderGeometry(GR, GR - .15, .3, 48), 'dress', 0, h + .15, 0);
  for (let k = 0; k < 24; k++) { const a = k / 24 * Math.PI * 2, d = r1 + .35; put(new THREE.BoxGeometry(.3, .55, .8), 'dress', Math.sin(a) * d, h - .27, Math.cos(a) * d, 0, a); }
  const RAIL = 1.05; for (const y of [GY + .5, GY + RAIL]) put(new THREE.TorusGeometry(GR - .08, .03, 5, 48), 'iron', 0, y, 0, Math.PI / 2);
  for (let k = 0; k < 32; k++) { const a = k / 32 * Math.PI * 2; put(new THREE.CylinderGeometry(.022, .022, RAIL, 5), 'iron', Math.sin(a) * (GR - .08), GY + RAIL / 2, Math.cos(a) * (GR - .08)); }
  const LR = 1.4, P0 = GY, P1 = GY + .9, L0 = P1, L1 = P1 + 2.4; put(new THREE.CylinderGeometry(1.65, 1.75, P1 - P0, 24), 'lime', 0, (P0 + P1) / 2, 0); put(new THREE.CylinderGeometry(1.7, 1.7, .1, 24), 'dress', 0, P1 - .05, 0);
  put(new THREE.CylinderGeometry(LR, LR, L1 - L0, 12, 1, true), 'glass', 0, (L0 + L1) / 2, 0);
  for (let k = 0; k < 12; k++) { const a = (k + .5) / 12 * Math.PI * 2, d = LR * Math.cos(Math.PI / 12); put(new THREE.BoxGeometry(.06, L1 - L0, .06), 'red', Math.sin(a) * d, (L0 + L1) / 2, Math.cos(a) * d, 0, a); }
  for (const y of [L0 + .04, L0 + (L1 - L0) / 2, L1 - .04]) put(new THREE.CylinderGeometry(LR + .03, LR + .03, .07, 12, 1, true), 'red', 0, y, 0);
  const FY = L0 + 1.1; put(new THREE.CylinderGeometry(.06, .08, 1.0, 8), 'iron', 0, L0 + .5, 0); put(new THREE.CylinderGeometry(.5, .5, .9, 16, 1, true), 'lens', 0, FY, 0); put(new THREE.SphereGeometry(.18, 12, 8), 'lamp', 0, FY, 0);
  put(new THREE.SphereGeometry(LR + .12, 24, 10, 0, Math.PI * 2, 0, Math.PI / 2).scale(1, .75, 1), 'copper', 0, L1, 0); put(new THREE.CylinderGeometry(LR + .2, LR + .2, .12, 24), 'copper', 0, L1, 0);
  put(new THREE.SphereGeometry(.3, 12, 8), 'copper', 0, L1 + (LR + .12) * .75 + .2, 0); put(new THREE.CylinderGeometry(.03, .03, 1.2, 6), 'iron', 0, L1 + (LR + .12) * .75 + .9, 0); put(new THREE.BoxGeometry(.7, .25, .02), 'iron', .25, L1 + (LR + .12) * .75 + 1.3, 0, 0, .6);
  // the keeper's house: the kit's cottage, landward, its front door to the tower's side; a yard wall of rubble round it and the tower's foot
  const plan = GL_PLANS.cottage({ paint: 'red' }); plan.r = stream('lighthouse-cottage'); const cot = gatelandsBuilding(plan), CX = -2.5, CZ = -15, CRY = 0;
  cot.position.set(CX, ground(CX, CZ) - .05, CZ); cot.rotation.y = CRY;
  { const pts = []; for (let k = 0; k <= 44; k++) { const a = Math.PI * .45 + k / 44 * Math.PI * 1.1; pts.push([Math.sin(a) * 10 - 1, Math.cos(a) * 10 - 9.5]); }
    for (let k = 0; k + 1 < pts.length; k++) { const [x0, z0] = pts[k], [x1, z1] = pts[k + 1], mx = (x0 + x1) / 2, mz = (z0 + z1) / 2, L = Math.hypot(x1 - x0, z1 - z0);
      put(new THREE.BoxGeometry(L + .05, 1.1 + r() * .15, .55), 'rubble', mx, ground(mx, mz) + .5, mz, 0, Math.atan2(x1 - x0, z1 - z0) + Math.PI / 2, 0, .7); } }
  { const cd = cot.userData.door, ex = CX + cd.x, ez = CZ + cd.z - .3, sx = door.x, sz = door.z - .9, n = Math.round(Math.hypot(ex - sx, ez - sz) / .85), ang = Math.atan2(ex - sx, ez - sz);
    for (let k = 0; k <= n; k++) { const x = sx + (ex - sx) * k / n, z = sz + (ez - sz) * k / n; put(new THREE.BoxGeometry(1.2, .06, .8), 'path', x + (r() - .5) * .08, ground(x, z) + .03, z, 0, ang + (r() - .5) * .08); } }
  M.lamp.emissiveIntensity = lit ? 4 : 0;
  const group = new THREE.Group(); let tris = 0; for (const [k, gs] of B) { const g = mergeGeometries(gs, false); gs.forEach(x => x.dispose()); const m = new THREE.Mesh(g, M[k]); m.name = k; m.castShadow = !['turf', 'sea', 'glass', 'lens'].includes(k); m.receiveShadow = k !== 'sea'; group.add(m); tris += g.attributes.position.count / 3; }
  group.add(cot); tris += cot.userData.tris;
  const cliff = []; for (let k = 0; k < 16; k++) { const a = k / 16 * Math.PI * 2; let d = 0; while (d < 60 && ground(Math.sin(a) * d, Math.cos(a) * d) > -1) d += .25; cliff.push(+d.toFixed(2)); }
  return { group, tris: Math.round(tris), draws: group.children.length - 1 + cot.userData.calls, top: +(L1 + (LR + .12) * .75 + 1.5).toFixed(2), tower: { r0, r1, h }, gallery: { y: GY, rOut: GR, rail: RAIL, rIn: r1 }, lantern: { r: LR, y0: L0, y1: L1, pedestal: 1.75 },
    focal: [0, FY, 0], door, cottage: { x: CX, z: CZ, w: plan.w, d: plan.d, ry: CRY, door: cot.userData.door }, cliff, ground, sea: SEA, lit };
}

// ── Aurenne's coastal watchtower (Session 971, card F8; L5's "roads and works", OG-046's watchtowers, OG-124's Aurenne panel: "a coastal
// watchtower"). Piracy is the Mark's undeclared war and the Compact's tithe-ships its favourite prey (canon §1), so the Compact keeps a
// chain of towers along its coast, each in sight of the next. The precedent is the Genoese and Saracen towers of the Tyrrhenian coast
// and the borj of the Maghreb: a round tower on a scarp, its door high up and reached by a stair that stops short of it, a parapet on
// machicolations, a beacon on the roof. In Aurenne's own dress (§1.3): cream lime plaster, limestone dressings, a band of blue tile.
// Built at true size on its point, the sea to +z:
//   - the point: dry turf over a rock edge that falls 11 m to the sea (the break 13 m out on the mean), rocks along it, two cypresses inland;
//   - the tower: a scarp battered from 10 m across at the foot to 8.4 m at a limestone cordon 4 m up, then a near-upright drum to the
//     terrace at 12.3 m; slit windows; under the parapet a band of blue tile;
//   - the parapet: 20 limestone corbels carrying it out 0.65 m, open between (the machicolations, to drop stones on whoever is at the
//     door), 1.05 m high over the terrace, with loopholes;
//   - the door: round-headed, 1.0 by 2.1 m, painted blue, its sill 5.4 m up on the landward side. A masonry stair of 27 risers climbs
//     beside the tower to a landing pier 1.1 m short of the sill, and a gangway of planks crosses the gap; o.drawn, it is drawn in;
//   - the terrace: limestone, the stair's head in a small domed hut, the beacon in an iron basket on a stone plinth; o.lit, it burns.
// -> { group, tris, draws, top, tower { r0, rS, hS, r1, h }, door { x, z, w, h, sill, face }, stair { rise, tread, n, foot [x, z],
//   width, landing { x0, x1, z0, z1, top } }, gap, gangway, terrace { y, rIn, parapet }, hut { x, z, w }, beacon [x, y, z],
//   cliff (the break's distance from the tower, sampled), ground(x, z), sea, lit, drawn }
let WT = null;
function watchMats() {
  if (WT) return WT; const std = (c, ro = .9, o = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: ro, ...o }), AQM = aqueductMats();
  WT = { plaster: mat('plaster', { ns: .8, color: 0xeee0c2, rough: .95 }), cope: AQM.cope, zellige: AQM.zellige, ground: AQM.ground, rock: AQM.rock, leaf: std(0x1e3220, .9), bark: AQM.bark,
    dark: std(0x0d0b09, 1), timber: mat('beam', { ns: 1.0, color: 0x7a5c40, rough: .9 }), door: std(0x3f73a6, .7), iron: std(0x2a2826, .5, { metalness: .6 }),
    faggot: mat('wood', { ns: .6, color: 0x6a5238, rough: 1 }), flame: std(0xffc070, .6, { emissive: 0xff9a40, emissiveIntensity: 0 }), sea: std(0x1e5a6e, .2, { metalness: .1 }) };
  return WT;
}
export function aurenneWatchtower(o = {}, r = stream('watchtower')) {
  const M = watchMats(), B = new Map(), V = (x, y) => new THREE.Vector2(x, y), lit = !!o.lit, drawn = !!o.drawn;
  const put = (geo, k, x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0, uv = .5) => { const g = geo.index ? geo.toNonIndexed() : geo; for (const a of Object.keys(g.attributes)) if (!['position', 'normal'].includes(a)) g.deleteAttribute(a);
    if (!g.attributes.normal) g.computeVertexNormals(); g.applyMatrix4(new THREE.Matrix4().compose(new THREE.Vector3(x, y, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(rx, ry, rz, 'YXZ')), new THREE.Vector3(1, 1, 1))); worldUV(g, uv);
    if (!B.has(k)) B.set(k, []); B.get(k).push(g); return g; };
  // the point: flat within the break, ragged by bearing, a rock edge 11 m down to the sea; landward (-z) the flat runs on
  const SEA = -11, BRK = 13, brk = a => BRK + 1.8 * Math.sin(3 * a + 1.1) + 1.0 * Math.sin(7 * a + .3) + .4 * Math.sin(13 * a + 2), dist = (x, z) => { const zz = Math.max(0, z), a = Math.atan2(x, zz); return Math.hypot(x, zz) * BRK / brk(a); };
  const ground = (x, z) => { const d = dist(x, z), n = .1 * Math.sin(x * .29 + z * .19) + .07 * Math.sin(x * .08 - z * .21);
    return d < BRK ? n * Math.min(1, d / 6) : Math.max(SEA - 1, n - (d - BRK) * 6 - 1.2 * Math.sin(x * .9 + z * 1.3) * Math.min(1, d - BRK)); };
  for (const [S, X0, Z0, NX, NZ, sink] of [[1, -40, -40, 80, 80, 0], [3, -45, -120, 30, 27, .04]]) { const pos = [], idx = [], rockI = []; for (let j = 0; j <= NZ; j++) for (let i = 0; i <= NX; i++) { const x = X0 + i * S, z = Z0 + j * S; pos.push(x, ground(x, z) - sink, z); }
    for (let j = 0; j < NZ; j++) for (let i = 0; i < NX; i++) { const a = j * (NX + 1) + i, b = a + 1, c = a + NX + 1, d = c + 1, x = X0 + (i + .5) * S, z = Z0 + (j + .5) * S; (dist(x, z) < BRK + .5 ? idx : rockI).push(a, c, b, b, c, d); }
    for (const [k, I] of [['ground', idx], ['rock', rockI]]) { const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(I); g.computeVertexNormals(); put(g.toNonIndexed(), k, 0, 0, 0, 0, 0, 0, .25); } }
  { const g = new THREE.PlaneGeometry(400, 400); g.rotateX(-Math.PI / 2); put(g, 'sea', 0, SEA, 0); }
  for (let k = 0; k < 34; k++) { const a = k / 34 * Math.PI - Math.PI / 2 + r() * .05, d = brk(a) + .2 + r() * .5, x = Math.sin(a) * d, z = Math.cos(a) * d, s = .4 + r() * .6;
    put(new THREE.DodecahedronGeometry(s, 0), 'rock', x, ground(x, z) + s * .3, z, r() * 3, r() * 3, 0, .4); }
  // the tower: the scarp to the cordon, the drum to the terrace
  const R0 = 5.0, RS = 4.2, HS = 4.0, R1 = 4.1, H = 12.3, rad = y => y < HS ? R0 + (RS - R0) * y / HS : RS + (R1 - RS) * (y - HS) / (H - HS);
  put(new THREE.LatheGeometry([V(.001, -1.2), V(R0 + .05, -1.2), V(R0, 0), V(RS, HS), V(R1, H), V(.001, H)], 48), 'plaster', 0, 0, 0, 0, 0, 0, .6);
  put(new THREE.TorusGeometry(RS + .04, .14, 6, 48), 'cope', 0, HS, 0, Math.PI / 2);
  put(new THREE.CylinderGeometry(rad(11.3) + .015, rad(10.9) + .015, .4, 48, 1, true), 'zellige', 0, 11.1, 0, 0, 0, 0, .3);
  const bat = Math.atan((RS - R1) / (H - HS)), hole = (a, y, w, ht, k) => { const ym = y + (ht - w / 2) / 2, rr = rad(ym) + .03, x = Math.sin(a) * rr, z = Math.cos(a) * rr, hy = y + ht - w / 2, hr = rad(hy) + .035;
    put(new THREE.PlaneGeometry(w, ht - w / 2), 'dark', x, ym, z, -bat, a); put(new THREE.CircleGeometry(w / 2, 10, 0, Math.PI), 'dark', Math.sin(a) * hr, hy, Math.cos(a) * hr, -bat, a);
    if (k) { put(new THREE.RingGeometry(w / 2, w / 2 + .22, 10, 1, 0, Math.PI), 'cope', Math.sin(a) * (hr + .01), hy, Math.cos(a) * (hr + .01), -bat, a);
      for (const s of [-1, 1]) put(new THREE.BoxGeometry(.22, ht - w / 2, .06), 'cope', x + Math.cos(a) * s * (w / 2 + .11), ym, z - Math.sin(a) * s * (w / 2 + .11), -bat, a);
      put(new THREE.BoxGeometry(w + .5, .14, .3), 'cope', Math.sin(a) * (rr + .12), y - .07, Math.cos(a) * (rr + .12), 0, a);
      /* the door's leaf: open into the tower while the gangway is down; drawn in, the leaf is shut and barred, just inside the reveal */
      if (k === 'door' && drawn) { put(new THREE.BoxGeometry(w * .94, ht - w / 2 - .02, .05), 'door', x + Math.sin(a) * .012, ym, z + Math.cos(a) * .012, -bat, a); put(new THREE.CircleGeometry(w * .47, 10, 0, Math.PI), 'door', Math.sin(a) * (hr + .012), hy, Math.cos(a) * (hr + .012), -bat, a); } }
    return { x: +x.toFixed(2), z: +z.toFixed(2), w, h: ht, sill: y, face: a }; };
  const DY = 5.4, door = hole(Math.PI, DY, 1.0, 2.1, 'door');
  for (const [a, y] of [[.3, 6.6], [1.9, 8.2], [2.5, 2.0], [3.6, 9.4], [4.6, 6.4], [5.6, 8.8]]) hole(a, y, .22, .9, false);
  // the parapet on its corbels, open between them (the machicolations); its cope and loopholes; the terrace
  const PR = R1 + .65, PI = R1 + .35, PY0 = H - .1, TY = H + .05, PT = TY + 1.05;
  for (let k = 0; k < 20; k++) { const a = (k + .5) / 20 * Math.PI * 2; for (const [w, ht, d, y, rr] of [[.36, .32, .7, H - .26, R1 + .3], [.36, .3, .45, H - .57, R1 + .17], [.36, .28, .25, H - .86, R1 + .08]]) put(new THREE.BoxGeometry(w, ht, d), 'cope', Math.sin(a) * rr, y, Math.cos(a) * rr, 0, a); }
  put(new THREE.RingGeometry(R1 - .01, PR, 48, 1), 'dark', 0, PY0 - .001, 0, Math.PI / 2);
  put(new THREE.CylinderGeometry(PR, PR, PT - PY0, 48, 1, true), 'plaster', 0, (PY0 + PT) / 2, 0, 0, 0, 0, .6);
  { const g = new THREE.CylinderGeometry(PI, PI, PT - TY, 48, 1, true); g.scale(-1, 1, 1); put(g, 'plaster', 0, (TY + PT) / 2, 0, 0, 0, 0, .6); }
  put(new THREE.RingGeometry(PI - .02, PR + .05, 48, 1), 'cope', 0, PT, 0, -Math.PI / 2);
  for (let k = 0; k < 10; k++) { const a = k / 10 * Math.PI * 2 + .16; put(new THREE.PlaneGeometry(.12, .5), 'dark', Math.sin(a) * (PR + .01), TY + .55, Math.cos(a) * (PR + .01), 0, a); }
  put(new THREE.CylinderGeometry(PI + .02, PI + .02, .1, 48), 'cope', 0, TY - .05, 0, 0, 0, 0, .7);
  // the stair's head: a small hut on the terrace under a little dome, its door to the beacon
  const HX = -1.6, HZ = -1.6, HW = 1.5, HH = 2.2; put(new THREE.BoxGeometry(HW, HH, HW), 'plaster', HX, TY + HH / 2, HZ, 0, 0, 0, .6); put(new THREE.BoxGeometry(HW + .12, .12, HW + .12), 'cope', HX, TY + HH + .06, HZ);
  put(new THREE.SphereGeometry(HW * .48, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2), 'plaster', HX, TY + HH + .12, HZ, 0, 0, 0, .6);
  put(new THREE.PlaneGeometry(.75, 1.75), 'dark', HX + HW / 2 + .01, TY + .875, HZ, 0, Math.PI / 2) /* its door on the +x face, toward the beacon's side */;
  // the beacon: a stone plinth, an iron basket on three legs, a load of faggots; lit, it burns
  const BX = 1.5, BZ = 1.5, BY = TY + .5; put(new THREE.BoxGeometry(1.0, .5, 1.0), 'cope', BX, TY + .25, BZ);
  put(new THREE.CylinderGeometry(.55, .35, .55, 10, 1, true), 'iron', BX, BY + .62, BZ); put(new THREE.TorusGeometry(.55, .03, 4, 14), 'iron', BX, BY + .9, BZ, Math.PI / 2);
  for (let k = 0; k < 3; k++) { const a = k / 3 * Math.PI * 2; put(new THREE.CylinderGeometry(.03, .03, .45, 5), 'iron', BX + Math.sin(a) * .3, BY + .2, BZ + Math.cos(a) * .3); }
  for (let k = 0; k < 9; k++) put(new THREE.CylinderGeometry(.05, .05, .9, 5), 'faggot', BX + (r() - .5) * .5, BY + .85, BZ + (r() - .5) * .5, (r() - .5) * 1.2, r() * 3, (r() - .5) * 1.2);
  put(new THREE.ConeGeometry(.42, 1.1, 8), 'flame', BX, BY + 1.35, BZ); M.flame.emissiveIntensity = lit ? 4 : 0; M.flame.visible = lit;
  // the stair: a landing pier 1.1 m short of the sill, a solid flight of 27 risers climbing along +x to it; the gangway over the gap
  const RISE = DY / 27, TREAD = .3, SW = 1.2, GAP = 1.1, LZ1 = -(rad(DY) + GAP), LZ0 = LZ1 - 1.6, LX0 = -.8, LX1 = .8, N = 27, floorY = (x, z) => Math.min(...[[x - .4, z - .4], [x + .4, z - .4], [x - .4, z + .4], [x + .4, z + .4]].map(([a, b]) => ground(a, b)));
  { const y0 = floorY(0, (LZ0 + LZ1) / 2) - .3; put(new THREE.BoxGeometry(LX1 - LX0, DY - y0, LZ1 - LZ0), 'plaster', 0, (DY + y0) / 2, (LZ0 + LZ1) / 2, 0, 0, 0, .6); put(new THREE.BoxGeometry(LX1 - LX0 + .1, .1, LZ1 - LZ0 + .1), 'cope', 0, DY - .05, (LZ0 + LZ1) / 2); }
  const SZ = LZ0 + SW / 2, steps = []; for (let k = 1; k < N; k++) { const x0 = LX1 + (N - 1 - k) * TREAD, x1 = x0 + TREAD, y = k * RISE, y0 = floorY((x0 + x1) / 2, SZ) - .3;
    put(new THREE.BoxGeometry(TREAD, y - y0, SW), 'plaster', (x0 + x1) / 2, (y + y0) / 2, SZ, 0, 0, 0, .6); put(new THREE.BoxGeometry(TREAD + .03, .05, SW + .04), 'cope', (x0 + x1) / 2, y - .025, SZ); steps.push([+((x0 + x1) / 2).toFixed(3), +y.toFixed(3)]); }
  const footX = LX1 + (N - 1) * TREAD;
  if (!drawn) { for (let k = 0; k < 4; k++) put(new THREE.BoxGeometry(.22, .07, GAP + .5), 'timber', -.33 + k * .22, DY - .035, LZ1 + GAP / 2 - .05); }
  /* drawn (o.drawn), the gangway is taken in through the door and the gap stands open */
  // inland: a flagged path from the stair's foot, the cistern's wellhead, two cypresses
  for (let z = SZ; z > -40; z -= .9) put(new THREE.BoxGeometry(1.3, .06, .85), 'cope', footX + 1.0 + (r() - .5) * .1, ground(footX + 1, z) + .02, z, 0, (r() - .5) * .08, 0, .6);
  put(new THREE.CylinderGeometry(.55, .6, .8, 16), 'plaster', 6.5, ground(6.5, -12) + .4, -12, 0, 0, 0, .6); put(new THREE.CylinderGeometry(.6, .6, .1, 16), 'cope', 6.5, ground(6.5, -12) + .85, -12);
  for (const [x, z, hgt] of [[-7, -15, 9], [-9.5, -12.5, 7.5]]) { put(new THREE.CylinderGeometry(.12, .18, 1.2, 6), 'bark', x, ground(x, z) + .6, z); const c = new THREE.LatheGeometry([V(.001, 0), V(.55, hgt * .12), V(.75, hgt * .4), V(.5, hgt * .75), V(.001, hgt)], 10); put(c, 'leaf', x, ground(x, z) + .8, z); }
  const group = new THREE.Group(); let tris = 0; for (const [k, gs] of B) { const g = mergeGeometries(gs, false); gs.forEach(x => x.dispose()); const m = new THREE.Mesh(g, M[k]); m.name = k; m.castShadow = !['ground', 'sea', 'rock', 'flame'].includes(k); m.receiveShadow = k !== 'sea'; group.add(m); tris += g.attributes.position.count / 3; }
  const cliff = []; for (let k = 0; k < 16; k++) { const a = k / 16 * Math.PI * 2; let d = 0; while (d < 60 && ground(Math.sin(a) * d, Math.cos(a) * d) > -1) d += .25; cliff.push(+d.toFixed(2)); }
  return { group, tris: Math.round(tris), draws: group.children.length, top: +(TY + HH + .12 + HW * .48).toFixed(2), tower: { r0: R0, rS: RS, hS: HS, r1: R1, h: H, rad }, door: { ...door, sill: DY },
    stair: { rise: +RISE.toFixed(3), tread: TREAD, n: N, steps, foot: [+footX.toFixed(2), +SZ.toFixed(2)], width: SW, landing: { x0: LX0, x1: LX1, z0: +LZ0.toFixed(2), z1: +LZ1.toFixed(2), top: DY } },
    gap: +GAP.toFixed(2), gangway: !drawn, terrace: { y: TY, rIn: PI, parapet: +(PT - TY).toFixed(2), rOut: PR }, hut: { x: HX, z: HZ, w: HW }, beacon: [BX, BY + .9, BZ], cliff, ground, sea: SEA, lit, drawn };
}

// ── the Gatelands' toll bridge (Session 972, card F8; L5's "roads and works", OG-046's toll gates and its stone bridges, OG-014's
// stone bridges). A toll gate where a road crosses a river at a bridge, as the old Irish bridges of Kilkenny and the Boyne were tolled
// at a gate tower on one bank. Built at true size, the road along z, the river along x:
//   - the river: a channel 18 m across between banks, its water 3.4 m down, its bed 4.6 m down;
//   - the bridge: three round arches of 5.6 m on piers of 1.4 m with cutwaters upstream and down, a voussoir ring on each face, the deck
//     humped from the banks to 0.9 m over them at its middle, a cobbled way of 3.4 m between rubble parapets of 0.95 m under a cope;
//   - the gate tower on the north bank: rubble with dressed quoins, 5.8 by 5 m and 9 m high, the road through it under a round arch of
//     3 by 4.7 m, its timber leaves open against the passage, a box machicolation over the arch, slits, and the Irish stepped merlons;
//   - the toll: beyond the tower, a bar across the road on a post, and the toll-keeper's cottage (the kit's GL_PLANS.cottage) beside it,
//     its door to the road, and a board of the tolls by the bar. o.open: the bar is raised.
// -> { group, tris, draws, deck(z), road (half the way's width), parapet, arches [{ z, span, spring, crown }], tower { z0, z1, w, h,
//   passage { w, h } }, bar { z, open }, cottage { x, z, w, d, ry, door }, ground(x, z), water, bed }
export function gatelandsTollBridge(o = {}, r = stream('tollbridge')) {
  const M = { ...lightMats(), water: lightMats().sea }, B = new Map(), open = !!o.open;
  const put = (geo, k, x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0, uv = .5) => { const g = geo.index ? geo.toNonIndexed() : geo; for (const a of Object.keys(g.attributes)) if (!['position', 'normal'].includes(a)) g.deleteAttribute(a);
    if (!g.attributes.normal) g.computeVertexNormals(); g.applyMatrix4(new THREE.Matrix4().compose(new THREE.Vector3(x, y, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(rx, ry, rz, 'YXZ')), new THREE.Vector3(1, 1, 1))); worldUV(g, uv);
    if (!B.has(k)) B.set(k, []); B.get(k).push(g); return g; };
  // the land: the channel and its banks, flat beyond; the road's strip kept level
  const WATER = -3.4, BED = -4.6, HALF = 14, ROAD = 1.7, deck = z => Math.abs(z) < HALF ? .9 * (1 - (z / HALF) ** 2) : 0;
  const ground = (x, z) => { const az = Math.abs(z), t = az < 9 ? 0 : az < HALF ? (az - 9) / (HALF - 9) : 1, base = BED * (1 - t * t * (3 - 2 * t)), n = .12 * Math.sin(x * .23 + z * .17) + .08 * Math.sin(x * .07 - z * .31), m = Math.min(1, Math.max(0, (Math.abs(x) - ROAD - .5) / 3));
    return base + n * m * (az > HALF ? 1 : .5); };
  { const S = 1, X0 = -40, Z0 = -45, NX = 80, NZ = 90, pos = [], idx = [], rk = []; for (let j = 0; j <= NZ; j++) for (let i = 0; i <= NX; i++) { const x = X0 + i * S, z = Z0 + j * S; pos.push(x, ground(x, z), z); }
    for (let j = 0; j < NZ; j++) for (let i = 0; i < NX; i++) { const a = j * (NX + 1) + i, b = a + 1, c = a + NX + 1, d = c + 1; (Math.abs(Z0 + (j + .5) * S) < 11 ? rk : idx).push(a, c, b, b, c, d); }
    for (const [k, I] of [['turf', idx], ['rock', rk]]) { const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(I); g.computeVertexNormals(); put(g.toNonIndexed(), k, 0, 0, 0, 0, 0, 0, .25); } }
  { const g = new THREE.PlaneGeometry(200, 24); g.rotateX(-Math.PI / 2); put(g, 'water', 0, WATER, 0); }
  // a face shape in (z, y) extruded across x: the bridge's body with its arches cut from below, the parapets
  const across = (shape, w, x0, k, uv = .6) => { const g = new THREE.ExtrudeGeometry(shape, { depth: w, bevelEnabled: false, curveSegments: 14 }); g.rotateY(Math.PI / 2); g.translate(x0, 0, 0); return put(g, k, 0, 0, 0, 0, 0, 0, uv); };
  const SPAN = 5.6, PIER = 1.4, SPRING = -2.9, AR = SPAN / 2, BW = 2 * ROAD + .8, arches = [-1, 0, 1].map(k => ({ z: k * (SPAN + PIER), span: SPAN, spring: SPRING, crown: SPRING + AR }));
  { const s = new THREE.Shape(); s.moveTo(-HALF, deck(-HALF)); for (let k = 1; k <= 28; k++) { const z = -HALF + k * HALF / 14; s.lineTo(z, deck(z)); } s.lineTo(HALF, BED - .3);
    for (const a of [...arches].reverse()) { s.lineTo(a.z + AR, BED - .3); s.lineTo(a.z + AR, SPRING); s.absarc(a.z, SPRING, AR, 0, Math.PI, false); s.lineTo(a.z - AR, BED - .3); } s.lineTo(-HALF, BED - .3); s.closePath();
    across(s, BW, -BW / 2, 'rubble'); }
  for (const a of arches) for (const sx of [-1, 1]) put(new THREE.RingGeometry(AR, AR + .5, 16, 1, 0, Math.PI), 'dress', sx * (BW / 2 + .01), SPRING, a.z, 0, sx * Math.PI / 2);
  // the cutwaters: a pointed prism each side of each pier, capped in a stone pyramid at the springing
  for (const zc of [-(SPAN + PIER) / 2, (SPAN + PIER) / 2]) for (const sx of [-1, 1]) { const s = new THREE.Shape(); s.moveTo(-PIER / 2, 0); s.lineTo(0, 1.3); s.lineTo(PIER / 2, 0); s.closePath();
    const g = new THREE.ExtrudeGeometry(s, { depth: SPRING + .4 - (BED - .3), bevelEnabled: false }); g.rotateX(-Math.PI / 2); g.translate(0, BED - .3, 0); g.rotateY(-sx * Math.PI / 2) /* its point out from the face */; put(g, 'rubble', sx * BW / 2, 0, zc, 0, 0, 0, .6);
    const c = new THREE.ConeGeometry(.92, .9, 3); put(c, 'dress', sx * (BW / 2 + .43), SPRING + .85, zc, 0, sx > 0 ? Math.PI / 2 : -Math.PI / 2); }
  // the parapets and their cope; the cobbled way along the deck
  for (const sx of [-1, 1]) { const s = new THREE.Shape(); s.moveTo(-HALF, deck(-HALF) - .05); for (let k = 1; k <= 28; k++) { const z = -HALF + k * HALF / 14; s.lineTo(z, deck(z) - .05); }
    for (let k = 28; k >= 0; k--) { const z = -HALF + k * HALF / 14; s.lineTo(z, deck(z) + .95); } s.closePath(); across(s, .4, sx > 0 ? ROAD : -ROAD - .4, 'rubble');
    for (let k = 0; k < 28; k++) { const z0 = -HALF + k * HALF / 14, z1 = z0 + HALF / 14, sl = (deck(z1) - deck(z0)) / (z1 - z0); put(new THREE.BoxGeometry(.52, .12, (z1 - z0) * Math.hypot(1, sl) + .02), 'dress', sx * (ROAD + .2), (deck(z0) + deck(z1)) / 2 + 1.0, (z0 + z1) / 2, -Math.atan(sl)); } }
  for (let z = -40; z < 40; z += .9) { const z1 = z + .9, sl = (deck(z1) - deck(z)) / .9, y = Math.abs(z + .45) < HALF ? (deck(z) + deck(z1)) / 2 : 0;
    if (Math.abs(z + .45) > 14.5 && Math.abs(z + .45) < 19.6 && z > 0) continue; put(new THREE.BoxGeometry(2 * ROAD, .06, .88), 'path', (r() - .5) * .04, y + .03, z + .45, -Math.atan(sl), (r() - .5) * .02); }
  // the gate tower: a face with its arch, extruded along z; quoins; stepped merlons; the box machicolation over the arch; slits; the leaves
  const TZ0 = 14.5, TZ1 = 19.5, TW = 5.8, TH = 9, PW = 3.0, PS = 3.2, PH = PS + PW / 2;
  { const s = new THREE.Shape(); s.moveTo(-TW / 2, -.6); s.lineTo(TW / 2, -.6); s.lineTo(TW / 2, TH); s.lineTo(-TW / 2, TH); s.closePath();
    const h = new THREE.Path(); h.moveTo(-PW / 2, -.6); h.lineTo(PW / 2, -.6); h.lineTo(PW / 2, PS); h.absarc(0, PS, PW / 2, 0, Math.PI, false); h.lineTo(-PW / 2, -.6); s.holes.push(h);
    const g = new THREE.ExtrudeGeometry(s, { depth: TZ1 - TZ0, bevelEnabled: false, curveSegments: 14 }); g.translate(0, 0, TZ0); put(g, 'rubble', 0, 0, 0, 0, 0, 0, .6);
    put(new THREE.BoxGeometry(PW + .04, .06, TZ1 - TZ0), 'path', 0, .03, (TZ0 + TZ1) / 2); }
  for (const sx of [-1, 1]) for (const sz of [TZ0, TZ1]) for (let y = 0; y < TH - .2; y += .55) { const long = Math.round(y / .55) % 2; put(new THREE.BoxGeometry(long ? .7 : .35, .5, long ? .35 : .7), 'dress', sx * (TW / 2 - (long ? .33 : .16) + .02), y + .25, sz + (sz < 17 ? 1 : -1) * ((long ? .16 : .33) - .02)); }
  for (const sz of [TZ0, TZ1]) put(new THREE.RingGeometry(PW / 2, PW / 2 + .45, 14, 1, 0, Math.PI), 'dress', 0, PS, sz + (sz < 17 ? -.01 : .01), 0, sz < 17 ? Math.PI : 0);
  { const per = [], N = 5; for (let k = 0; k < N; k++) { const t = (k + .5) / N; per.push([-TW / 2 + .25, TZ0 + t * (TZ1 - TZ0), Math.PI / 2], [TW / 2 - .25, TZ0 + t * (TZ1 - TZ0), Math.PI / 2], [-TW / 2 + t * TW, TZ0 + .25, 0], [-TW / 2 + t * TW, TZ1 - .25, 0]); }
    for (const [x, z, ry] of per) { put(new THREE.BoxGeometry(.75, .55, .5), 'rubble', x, TH + .275, z, 0, ry, 0, .6); put(new THREE.BoxGeometry(.4, .35, .5), 'rubble', x, TH + .725, z, 0, ry, 0, .6); put(new THREE.BoxGeometry(.42, .06, .52), 'dress', x, TH + .93, z, 0, ry); } }
  put(new THREE.BoxGeometry(2.0, 1.5, .8), 'rubble', 0, 7.0, TZ0 - .4, 0, 0, 0, .6); for (const x of [-.7, 0, .7]) put(new THREE.BoxGeometry(.3, .5, .8), 'dress', x, 6.0, TZ0 - .4); put(new THREE.PlaneGeometry(.12, .5), 'dark', 0, 7.1, TZ0 - .81, 0, Math.PI);
  for (const [x, y, z, ry] of [[0, 6.6, TZ1 + .01, 0], [-TW / 2 - .01, 3.4, 17, -Math.PI / 2], [TW / 2 + .01, 5.6, 17, Math.PI / 2], [-TW / 2 - .01, 6.8, 17, -Math.PI / 2], [TW / 2 + .01, 2.6, 17, Math.PI / 2]]) put(new THREE.PlaneGeometry(.14, .8), 'dark', x, y, z, 0, ry);
  for (const sx of [-1, 1]) put(new THREE.BoxGeometry(.08, PS + .4, 1.45), 'door', sx * (PW / 2 - .06), (PS + .4) / 2, TZ1 - .85) /* the leaves, open flat against the passage's walls */;
  // the toll: the bar across the road on its post, the board of the tolls, the toll-keeper's cottage beside the road, its door to it
  const BZ = 21.2, BX = ROAD + .5, BY = 1.0; put(new THREE.CylinderGeometry(.12, .14, 1.3, 8), 'timber', BX, .65, BZ); put(new THREE.CylinderGeometry(.1, .1, .9, 6), 'timber', -BX, .45, BZ);
  { const L = 2 * BX + .6, g = new THREE.CylinderGeometry(.07, .07, L, 8); g.rotateZ(Math.PI / 2); g.translate(-L / 2, 0, 0); put(g, 'red', BX, BY, BZ, 0, 0, open ? -1.35 : 0);
    put(new THREE.SphereGeometry(.2, 8, 6), 'iron', BX + .25, BY, BZ); }
  put(new THREE.BoxGeometry(1.3, .9, .06), 'lime', BX + 1.4, 1.75, BZ + .6, 0, -.4); for (let k = 0; k < 5; k++) put(new THREE.BoxGeometry(.9 - (k % 2) * .25, .04, .02), 'dark', BX + 1.4 + Math.sin(-.4) * .04, 2.05 - k * .14, BZ + .6 + Math.cos(-.4) * .04, 0, -.4);
  for (const dx of [-.55, .55]) put(new THREE.BoxGeometry(.08, 1.5, .08), 'timber', BX + 1.4 + Math.cos(.4) * dx, .75, BZ + .6 + Math.sin(.4) * dx);
  const plan = GL_PLANS.cottage({ paint: 'green' }); plan.r = stream('tollbridge-cottage'); const cot = gatelandsBuilding(plan), CX = ROAD + 1.5 + plan.d / 2, CZ = 27, CRY = -Math.PI / 2;
  cot.position.set(CX, ground(CX, CZ) - .05, CZ); cot.rotation.y = CRY;
  const group = new THREE.Group(); let tris = 0; for (const [k, gs] of B) { const g = mergeGeometries(gs, false); gs.forEach(x => x.dispose()); const m = new THREE.Mesh(g, M[k]); m.name = k; m.castShadow = !['turf', 'water', 'rock'].includes(k); m.receiveShadow = k !== 'water'; group.add(m); tris += g.attributes.position.count / 3; }
  group.add(cot); tris += cot.userData.tris;
  return { group, tris: Math.round(tris), draws: group.children.length - 1 + cot.userData.calls, top: TH + .96, deck, road: ROAD, parapet: .95, arches, tower: { z0: TZ0, z1: TZ1, w: TW, h: TH, passage: { w: PW, h: PH } }, bar: { z: BZ, y: BY, open },
    cottage: { x: CX, z: CZ, w: plan.w, d: plan.d, ry: CRY, door: cot.userData.door }, ground, water: WATER, bed: BED };
}

// ── the Mark's rope ferry (Session 980, card F8; L5's "roads and works", OG-046's "river port and ferry"; the Mark's "river valley at
// its heart", OG-102). Where a road meets a river too wide to bridge cheaply, a ferry: the Norse ferjested, a flat hauled across by hand
// along a rope, with a bell on the far bank to call the ferryman over. Built at true size, the river along x (flowing to +x), the road along z,
// the ferryman's bank at +z:
//   - the river: 40 m across at the water, its bed 2.4 m down, banks of turf over a shingle strand rising 1.2 m; the road, gravel, cut
//     down through each bank to its landing at 1 in 8;
//   - the landings: a timber stage on piles at each bank, 2.4 m wide and 8.5 m long, running 6 m out into water 2.4 m deep, its deck
//     0.55 m over the water; a rail on its downstream side, bollards at its end;
//   - the rope: a hawser between two snubbing posts on the banks, 1.75 m over the water at the posts and sagging 0.35 m to the middle,
//     along the flat's upstream side, so it never crosses the way;
//   - the flat: a tarred scow 9 by 3.2 m, its pram ends raked up, its deck 0.5 m over the water and 0.35 m drawn; rails 1 m high down both
//     sides; a hinged apron at each end, the one at a landing lowered onto the stage and the other raised as a gate; two forks on the
//     upstream side carrying the rope on rollers at hand height; a pole stowed along the downstream rail;
//   - the ferryman's house: the kit's Markish hall (markHall), turf-roofed, beside the road on the near bank, its door and steps to the road;
//   - the bell: on the far bank beside the road, a bronze bell in a gallows frame under a little shingle hood, its pull at hand.
// o.at: 'near' (default; the flat at the ferryman's landing), 'mid' (halfway over) or 'far' (at the bell's landing).
// -> { group, tris, draws, top, water, bed, half, stage { x, z0, z1, top } (the near one; the far is its mirror in z), flat { z, L, W, deck,
//   bottom, forks [{ z, top }] , aprons { near, far } ('down' or 'up') }, rope(z), ropeX, bell { x, z, mouth, pull, frame }, house { x, z, ry,
//   w, d, sill, stairOut }, road, grade(az), ground(x, z) }
export function markFerry(o = {}, r = stream('ferry')) {
  const L0 = lightMats(), std = (c, ro = .9, x = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: ro, ...x });
  const M = { ...L0, water: std(0x3c5452, .18, { metalness: .15 }), hull: L0.tar, plank: mat('wood', { ns: .9, color: 0x9a8c78, rough: .9 }), deck: mat('wood', { ns: .9, color: 0x8a7c66, rough: .9 }), pile: mat('beam', { ns: 1.0, color: 0x4a3c30, rough: .95 }),
    rope: std(0x8a7650, .95), bronze: std(0x8a6a34, .4, { metalness: .7 }), shingle: mat('shingle', { ns: 1.5, rough: .8 }), bark: std(0xd8d0c0, .9), leaf: std(0x7c8a40, .95), strand: mat('rock', { ns: .8, color: 0x9a948a, rough: 1 }) };
  M.shingle.side = THREE.DoubleSide;
  const B = new Map(), at = ['mid', 'far'].includes(o.at) ? o.at : 'near';
  const put = (geo, k, x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0, uv = .5) => { const g = geo.index ? geo.toNonIndexed() : geo; for (const a of Object.keys(g.attributes)) if (!['position', 'normal'].includes(a)) g.deleteAttribute(a);
    if (!g.attributes.normal) g.computeVertexNormals(); g.applyMatrix4(new THREE.Matrix4().compose(new THREE.Vector3(x, y, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(rx, ry, rz, 'YXZ')), new THREE.Vector3(1, 1, 1))); worldUV(g, uv);
    if (!B.has(k)) B.set(k, []); B.get(k).push(g); return g; };
  // the land: the river's bed, the strand and the banks, the valley rising beyond; the road's strip cut down to its landing at 1 in 8
  const BED = -2.4, HW = 20, BANK = 1.2, ROAD = 1.6, SD = .55, S0 = HW - 6, S1 = HW + 2.5, sm = t => { t = Math.min(1, Math.max(0, t)); return t * t * (3 - 2 * t); };
  const nat = (x, z) => { const az = Math.abs(z), d = az - HW - 3, y = az < HW ? BED * (1 - sm((az - HW + 6) / 6)) : az < HW + 3 ? BANK * sm((az - HW) / 3) : BANK + .04 * d + .0022 * d * d;
    const n = .14 * Math.sin(x * .21 + z * .13) + .09 * Math.sin(x * .05 - z * .27) + .35 * Math.sin(x * .045 + 1.3) * sm((az - HW - 3) / 10); return y + n * (az > HW ? 1 : .4); };
  const grade = az => SD - .05 + Math.max(0, az - (S1 - .5)) / 8, ground = (x, z) => { const m = sm((Math.abs(x) - ROAD - .3) / 2.5), c = Math.min(nat(0, z), grade(Math.abs(z))); return c + (nat(x, z) - c) * m; };
  { const xs = []; for (let x = -72; x < -30; x += 3) xs.push(x); for (let x = -30; x < -6; x += 1.5) xs.push(x); for (let x = -6; x < 6; x += .5) xs.push(x); for (let x = 6; x < 30; x += 1.5) xs.push(x); for (let x = 30; x <= 72; x += 3) xs.push(x);
    const NZ = 124, Z0 = -62, pos = [], I = { turf: [], strand: [] }, NX = xs.length;
    for (let j = 0; j <= NZ; j++) for (const x of xs) { const z = Z0 + j; pos.push(x, ground(x, z), z); }
    for (let j = 0; j < NZ; j++) for (let i = 0; i < NX - 1; i++) { const a = j * NX + i, b = a + 1, c = a + NX, d = c + 1, y = (pos[a * 3 + 1] + pos[d * 3 + 1]) / 2; (y < .35 ? I.strand : I.turf).push(a, c, b, b, c, d); }
    for (const [k, idx] of Object.entries(I)) { const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals(); put(g.toNonIndexed(), k, 0, 0, 0, 0, 0, 0, .25); } }
  { const g = new THREE.PlaneGeometry(144, 2 * HW + 5); g.rotateX(-Math.PI / 2); put(g, 'water', 0, 0, 0); }
  // the road down each bank: strips of gravel on the cut, from the stage's foot up out of the valley
  for (const s of [1, -1]) for (let az = S1 - .5; az < 61; az += .9) { const a0 = az, a1 = az + .9, y0 = ground(0, s * a0), y1 = ground(0, s * a1), sl = (y1 - y0) / .9;
    put(new THREE.BoxGeometry(2 * ROAD, .06, .9 * Math.hypot(1, sl) + .02), 'grit', (r() - .5) * .04, (y0 + y1) / 2 + .03, s * (a0 + .45), s * -Math.atan(sl), (r() - .5) * .02); }
  // the stages: deck boards across, three stringers, piles in pairs to the bed (the end pair standing on as bollards), a rail downstream
  for (const s of [1, -1]) { for (let az = S0; az < S1 - .01; az += .25) put(new THREE.BoxGeometry(2.4, .06, .23), 'deck', 0, SD - .03, s * (az + .125), 0, (r() - .5) * .01, 0, .6);
    for (const x of [-1, 0, 1]) put(new THREE.BoxGeometry(.16, .22, S1 - S0), 'pile', x, SD - .17, s * (S0 + S1) / 2);
    put(new THREE.BoxGeometry(2.6, .24, .2), 'pile', 0, SD - .15, s * (S0 + .1));
    for (const az of [S0 + .2, S0 + 2.2, S0 + 4.2, S0 + 6.2]) for (const x of [-1.1, 1.1]) { const yb = ground(x, s * az) - .4, yt = az === S0 + .2 ? SD + .55 : SD - .06; put(new THREE.CylinderGeometry(.13, .14, yt - yb, 8), 'pile', x, (yt + yb) / 2, s * az, 0, 0, 0, .6); }
    for (let az = S0 + 1.2; az <= S1 - .2; az += 1.6) put(new THREE.BoxGeometry(.09, 1.0, .09), 'timber', 1.15, SD + .5, s * az); put(new THREE.BoxGeometry(.08, .08, S1 - S0 - 1.2), 'timber', 1.15, SD + 1.0, s * (S0 + S1 + 1) / 2); put(new THREE.BoxGeometry(.06, .06, S1 - S0 - 1.2), 'timber', 1.15, SD + .55, s * (S0 + S1 + 1) / 2); }
  // the rope: a hawser between the snubbing posts, taut but for a sag of 0.35 m, along the upstream side
  const RX = -1.85, ZP = HW + 4.5, RT = 1.75, SAG = .35, rope = z => RT - SAG * (1 - (z / ZP) ** 2);
  { const pts = []; for (let k = 0; k <= 40; k++) { const z = -ZP + k * 2 * ZP / 40; pts.push(new THREE.Vector3(RX, rope(z), z)); } put(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 80, .035, 6), 'rope');
    for (const s of [1, -1]) { const z = s * ZP, yb = ground(RX, z) - .5; put(new THREE.CylinderGeometry(.18, .2, RT + .3 - yb, 10), 'pile', RX, (RT + .3 + yb) / 2, z, 0, 0, 0, .6); put(new THREE.CylinderGeometry(.21, .21, .08, 10), 'timber', RX, RT + .33, z);
      for (let k = 0; k < 3; k++) { const t = new THREE.TorusGeometry(.2, .035, 6, 14); t.rotateX(Math.PI / 2); put(t, 'rope', RX, RT - .06 + k * .07, z); } } }
  // the flat: the hull a raked profile in (z, y) extruded across x; deck planks fore and aft; bulwarks; rails; the aprons; the forks
  const L = 9, FW = 3.2, DK = .5, BOT = -.35, AL = 1.3, zc = at === 'mid' ? 0 : (at === 'near' ? 1 : -1) * (S0 - .1 - L / 2);
  { const s = new THREE.Shape(); s.moveTo(-L / 2, DK - .06); s.lineTo(L / 2, DK - .06); s.lineTo(L / 2, .05); s.lineTo(L / 2 - 1.4, BOT); s.lineTo(-L / 2 + 1.4, BOT); s.lineTo(-L / 2, .05); s.closePath();
    const g = new THREE.ExtrudeGeometry(s, { depth: FW, bevelEnabled: false }); g.rotateY(Math.PI / 2); g.translate(-FW / 2, 0, zc); put(g, 'hull', 0, 0, 0, 0, 0, 0, .6); }
  for (let k = 0; k < 10; k++) put(new THREE.BoxGeometry(.29, .06, L - .06), 'plank', -1.35 + k * .3, DK - .03, zc, 0, 0, 0, .6);
  for (const sx of [-1, 1]) { put(new THREE.BoxGeometry(.08, .26, L), 'hull', sx * (FW / 2 - .04), DK + .07, zc);
    for (let k = 0; k < 6; k++) put(new THREE.BoxGeometry(.08, 1.0, .08), 'timber', sx * 1.5, DK + .5, zc - L / 2 + .6 + k * (L - 1.2) / 5); put(new THREE.BoxGeometry(.1, .08, L - 1.1), 'timber', sx * 1.5, DK + 1.0, zc); put(new THREE.BoxGeometry(.06, .06, L - 1.1), 'timber', sx * 1.5, DK + .55, zc); }
  { const g = new THREE.CylinderGeometry(.035, .035, 5.2, 6); g.rotateX(Math.PI / 2); put(g, 'sailwood', 1.42, DK + .75, zc); }
  const aprons = {}; for (const e of [1, -1]) { const ze = zc + e * L / 2, side = Math.sign(ze) === 1 ? 'near' : 'far', lands = at !== 'mid' && (at === 'near') === (e === 1) && side === at;
    aprons[e === 1 ? 'pz' : 'nz'] = lands ? 'down' : 'up';
    if (lands) { const tip = SD + .06, sl = Math.atan2(tip - DK, AL); put(new THREE.BoxGeometry(2.4, .06, AL), 'plank', 0, (DK + tip) / 2 - .03, ze + e * AL / 2, e * -sl); for (const x of [-1.05, 1.05]) put(new THREE.BoxGeometry(.1, .1, AL), 'pile', x, (DK + tip) / 2 - .09, ze + e * AL / 2, e * -sl); }
    else { put(new THREE.BoxGeometry(2.4, AL, .06), 'plank', 0, DK + AL / 2, ze + e * .03); for (const x of [-1.05, 1.05]) put(new THREE.BoxGeometry(.1, AL, .1), 'pile', x, DK + AL / 2, ze + e * .1); }
    for (const x of [-1.25, 1.25]) { const c = new THREE.CylinderGeometry(.06, .06, .14, 8); c.rotateZ(Math.PI / 2); put(c, 'iron', x, DK, ze); } }
  const forks = []; for (const fz of [zc - L / 2 + 1.6, zc + L / 2 - 1.6]) { const ry = rope(fz), top = ry - .035; forks.push({ z: +fz.toFixed(3), top: +top.toFixed(3) });
    put(new THREE.BoxGeometry(.12, ry + .3 - (DK - .06), .14), 'timber', -1.66, (ry + .3 + DK - .06) / 2, fz); for (const y of [top - .08, ry + .2]) put(new THREE.BoxGeometry(.32, .08, .12), 'timber', -1.82, y - .04 + (y > ry ? 0 : -.04), fz);
    const rl = new THREE.CylinderGeometry(.07, .07, .2, 10); rl.rotateZ(Math.PI / 2); put(rl, 'iron', RX, top - .07, fz); }
  // the bell on the far bank: a gallows frame under a shingle hood, the bell in a yoke, its pull at hand
  const BX = 3.7, BZ = -(HW + 6), gy = ground(BX, BZ), MOUTH = gy + 2.0, PULL = gy + 1.15;
  { for (const dx of [-.65, .65]) put(new THREE.BoxGeometry(.18, 2.9, .18), 'timber', BX + dx, gy + 1.3, BZ); put(new THREE.BoxGeometry(1.7, .2, .22), 'timber', BX, gy + 2.85, BZ);
    for (const sz of [-1, 1]) put(new THREE.BoxGeometry(1.9, .05, .75), 'shingle', BX, gy + 3.1, BZ + sz * .3, sz * .55, 0, 0, .9);
    const V = (a, b) => new THREE.Vector2(a, b); put(new THREE.LatheGeometry([V(.001, .42), V(.09, .41), V(.12, .32), V(.14, .14), V(.2, .03), V(.23, 0), V(.21, 0)], 16), 'bronze', BX, MOUTH, BZ);
    put(new THREE.BoxGeometry(.3, .1, .12), 'timber', BX, MOUTH + .47, BZ); put(new THREE.SphereGeometry(.05, 8, 6), 'iron', BX, MOUTH + .04, BZ);
    put(new THREE.CylinderGeometry(.015, .015, MOUTH - PULL, 5), 'rope', BX + .16, (MOUTH + PULL) / 2, BZ); put(new THREE.SphereGeometry(.05, 6, 4), 'rope', BX + .16, PULL, BZ); }
  // the strand's boulders and the birches of the banks, kept off the road and the landings
  for (let k = 0; k < 26; k++) { const s = k % 2 ? 1 : -1, x = (r() < .5 ? -1 : 1) * (5 + r() * 40), z = s * (HW - .5 + r() * 2.5), q = .3 + r() * .7, g = new THREE.IcosahedronGeometry(q, 0); g.scale(1, .6, 1.2); put(g, 'rock', x, ground(x, z) + q * .2, z, 0, r() * 6, 0, .6); }
  for (let k = 0; k < 14; k++) { const s = k % 2 ? 1 : -1, x = (r() < .5 ? -1 : 1) * (10 + r() * 34), z = s * (HW + 5 + r() * 26), h = 6 + r() * 4, gy2 = ground(x, z), V = (a, b) => new THREE.Vector2(a, b);
    put(new THREE.CylinderGeometry(.09, .15, h * .55, 6), 'bark', x, gy2 + h * .27, z, 0, 0, (r() - .5) * .1); put(new THREE.LatheGeometry([V(.001, 0), V(1.0, h * .12), V(1.35, h * .32), V(.9, h * .5), V(.001, h * .62)], 9), 'leaf', x, gy2 + h * .38, z, 0, r() * 6); }
  const group = new THREE.Group(); let tris = 0; for (const [k, gs] of B) { const g = mergeGeometries(gs, false); gs.forEach(x => x.dispose()); const m = new THREE.Mesh(g, M[k]); m.name = k; m.castShadow = !['turf', 'strand', 'water'].includes(k); m.receiveShadow = k !== 'water'; group.add(m); tris += g.attributes.position.count / 3; }
  // the ferryman's house: the kit's hall, turf-roofed, its gable door and steps to the road
  const H = markHall({ roof: 'turf', turf: 'dry', w: 5.8, d: 8.4, porch: false, chimney: true, carve: false, wall: 1 }, stream('ferry-house:' + (o.key || ''))), HRY = -Math.PI / 2, HX = ROAD + .8 + H.stairOut, HZ = HW + 11;
  const hy = ground(ROAD + .8, HZ); H.group.position.set(HX, hy, HZ); H.group.rotation.y = HRY; group.add(H.group); tris += H.tris;
  return { group, tris: Math.round(tris), draws: group.children.length - 1 + H.draws, own: group.children.length - 1, top: +(gy + 3.2).toFixed(2), water: 0, bed: BED, half: HW, road: ROAD, grade, ground, nat,
    stage: { x: 1.2, z0: S0, z1: S1, top: SD }, flat: { z: zc, L, W: FW, deck: DK, bottom: BOT, forks, aprons: { near: aprons.pz, far: aprons.nz }, at }, rope, ropeX: RX, ropePosts: ZP,
    bell: { x: BX, z: BZ, mouth: +(MOUTH - gy).toFixed(2), pull: +(PULL - gy).toFixed(2), frame: BX - .74 }, house: { x: HX, z: HZ, y: hy, ry: HRY, w: 5.8, d: 8.4, sill: H.sill, stairOut: H.stairOut } };
}

// ── the Gatelands' shipyard (Session 981, card F8; L5's "roads and works", OG-046's "shipyards and dry docks", OG-014's harbours). A
// shipwright's yard on a harbour shore, as the small yards of Arklow and Baltimore built their clinker boats: a hull in frame on a slip,
// the last one finished at the quay. Built at true size, the sea to -z, the slip along z, y 0 the sea's surface:
//   - the slip: two ground ways on sleepers at 1 in 12, from the yard 22 m up the shore down into water 1.2 m deep at their foot;
//   - the hull on the stocks: the game's sloop's own lines (ships.js, its sections), bow up the slip: the keel on keel blocks, the stem
//     and the sternpost, a frame every 1.3 m to the sheer, the garboard and two strakes hung, ribbands along the frames at the bilge and
//     the sheer, shores from the ground to the bilge, staging on trestles down both sides;
//   - the quay: a stone quay out into the harbour beside the slip, 6 m wide and 1.4 m over the water, bollards on it; the finished sloop
//     (ships.js's gatelandsSloop) lying alongside its far face, its sail furled;
//   - the yard: an open shed of posts under thatch over a sawpit with a log on trestles across it; a steam box on trestles by a boiler on
//     a hearth; stacks of planks in stick and a pile of logs.
// -> { group, tris, draws, own, slope, way(z) (the ways' top), ways { x, z0, z1 }, blocks [{ z, top, keel }] (world, under the keel),
//   hull { matrix, keelLow }, staging { x, y, z0, z1 }, quay { x0, x1, z0, z1, top }, sloop { x, z, W, deck }, pit { x, z, w, l, d }, ground }
export function gatelandsShipyard(o = {}, r = stream('shipyard')) {
  const L0 = lightMats(), std = (c, ro = .9, x = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: ro, ...x });
  const M = { ...L0, water: L0.sea, way: mat('beam', { ns: 1.0, color: 0x4a3a2c, rough: .9 }), block: mat('beam', { ns: 1.0, color: 0x6a5440, rough: .95 }), oak: mat('wood', { ns: 1.0, color: 0xc29a6a, rough: .75 }),
    plank: mat('wood', { ns: .9, color: 0xb08a5e, rough: .8 }), deck: mat('wood', { ns: .9, color: 0x9a8a72, rough: .9 }), strand: mat('rock', { ns: .8, color: 0xa49c8a, rough: 1 }),
    bark: mat('beam', { ns: 1.4, color: 0x7a6250, rough: 1 }), boiler: std(0xb06a3c, .4, { metalness: .7 }) };
  M.oak.side = M.plank.side = THREE.DoubleSide;
  const B = new Map(), HB = new Map();
  const put = (geo, k, x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0, uv = .5, into = B) => { const g = geo.index ? geo.toNonIndexed() : geo; for (const a of Object.keys(g.attributes)) if (!['position', 'normal'].includes(a)) g.deleteAttribute(a);
    if (!g.attributes.normal) g.computeVertexNormals(); g.applyMatrix4(new THREE.Matrix4().compose(new THREE.Vector3(x, y, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(rx, ry, rz, 'YXZ')), new THREE.Vector3(1, 1, 1))); if (into === B) worldUV(g, uv);
    if (!into.has(k)) into.set(k, []); into.get(k).push(g); return g; };
  const rod = (k, a, b, rad, into = B, seg = 6) => { const A = new THREE.Vector3(...a), C = new THREE.Vector3(...b), d = C.clone().sub(A), g = new THREE.CylinderGeometry(rad, rad, d.length(), seg); g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.clone().normalize())); g.translate(...A.clone().add(C).multiplyScalar(.5).toArray()); return put(g, k, 0, 0, 0, 0, 0, 0, .5, into); };
  // the shore: the yard level at 1.4, the strand falling to the harbour's bed at 3.5; the slip's bed cut down to the ways
  const LAND = 1.4, SL = 1 / 12, way = z => .5 + (z - 6) * SL, WZ0 = -14, WZ1 = 22, sm = t => { t = Math.min(1, Math.max(0, t)); return t * t * (3 - 2 * t); };
  const nat = (x, z) => { const y = z >= 8 ? LAND + .015 * (z - 8) : z >= 1 ? -.4 + (LAND + .4) * sm((z - 1) / 7) : -.4 - 3.1 * sm((1 - z) / 11); return y + (z > 8 ? .12 * Math.sin(x * .19 + z * .23) : .05 * Math.sin(x * .4)); };
  const ground = (x, z) => { const c = Math.min(nat(x, z), way(z) - .4), m = sm((Math.abs(x) - 2.6) / 2); return z > WZ1 ? nat(x, z) : c + (nat(x, z) - c) * m; };
  { const xs = []; for (let x = -50; x < -6; x += 1.5) xs.push(x); for (let x = -6; x < 6; x += .5) xs.push(x); for (let x = 6; x <= 50; x += 1.5) xs.push(x);
    const Z0 = -40, NZ = 84, pos = [], I = { turf: [], strand: [] }, NX = xs.length; for (let j = 0; j <= NZ; j++) for (const x of xs) { const z = Z0 + j; pos.push(x, ground(x, z), z); }
    for (let j = 0; j < NZ; j++) for (let i = 0; i < NX - 1; i++) { const a = j * NX + i, b = a + 1, c = a + NX, d = c + 1, y = (pos[a * 3 + 1] + pos[d * 3 + 1]) / 2, z = Z0 + j + .5; (y < LAND - .05 || z < 7 ? I.strand : I.turf).push(a, c, b, b, c, d); }
    for (const [k, idx] of Object.entries(I)) { const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals(); put(g.toNonIndexed(), k, 0, 0, 0, 0, 0, 0, .25); } }
  { const g = new THREE.PlaneGeometry(100, 50); g.rotateX(-Math.PI / 2); put(g, 'water', 0, 0, -17); }
  // the slip: two ground ways on sleepers, each sleeper standing on the ground
  const WX = .9, ang = Math.atan(SL), WL = (WZ1 - WZ0) / Math.cos(ang);
  for (const sx of [-1, 1]) put(new THREE.BoxGeometry(.3, .16, WL), 'way', sx * WX, (way(WZ0) + way(WZ1)) / 2 - .08, (WZ0 + WZ1) / 2, -ang);
  for (let z = WZ0 + .5; z < WZ1; z += 1.2) { const yb = Math.min(ground(-1.4, z), ground(1.4, z), ground(0, z)) - .15, yt = way(z) - .16; put(new THREE.BoxGeometry(3.0, yt - yb, .22), 'block', 0, (yt + yb) / 2, z); }
  // the hull on the stocks: the sloop's lines in its own frame (y 0 its waterline, +z the bow), set on the slip bow up at the slip's slope
  const S = gatelandsSloop({}, stream('shipyard-lines')); S.group.traverse(m => m.geometry && m.geometry.dispose());
  const zb = S.L / 2, zr = (z, u) => z * (1 - (z > 0 ? .13 : .09) * (1 - u) ** 1.5 * Math.abs(z / zb) ** 6), HZ = 12.6, KB = .7 /* the keel blocks' height */;
  const keelY = z => S.sect(z, 0)[1] - .12 /* the keel's underside: it stands 0.12 under the moulded line, 0.24 deep */, HY = way(HZ) + KB + .12 + 1.05;
  const HM = new THREE.Matrix4().compose(new THREE.Vector3(0, HY, HZ), new THREE.Quaternion().setFromEuler(new THREE.Euler(-ang, 0, 0)), new THREE.Vector3(1, 1, 1));
  const NS = S.sections.length - 1, P = (i, u, sx = 1) => { const z = S.sections[i].z, [x, y] = S.sect(z, u); return [sx * x, y, zr(z, u)]; };
  // the keel in segments along its rocker, the stem and the sternpost up their rake
  for (let i = 1; i < NS - 1; i++) { const a = [0, keelY(S.sections[i].z) + .06, zr(S.sections[i].z, 0)], b = [0, keelY(S.sections[i + 1].z) + .06, zr(S.sections[i + 1].z, 0)]; put(new THREE.BoxGeometry(.2, .24, Math.hypot(b[1] - a[1], b[2] - a[2]) + .02), 'oak', 0, (a[1] + b[1]) / 2 + .06, (a[2] + b[2]) / 2, -Math.atan2(b[1] - a[1], b[2] - a[2]), 0, 0, .5, HB); }
  for (const i of [0, NS]) for (let k = 0; k < 10; k++) rod('oak', P(i, k / 10), P(i, (k + 1) / 10), .1, HB, 6);
  // the frames, every fourth station, to the sheer; the ribbands at the bilge and under the sheer; the garboard and two strakes hung
  for (let i = 4; i < NS; i += 4) for (const sx of [-1, 1]) for (let k = 0; k < 12; k++) rod('oak', P(i, k / 12, sx), P(i, (k + 1) / 12, sx), .055, HB, 4);
  for (const u of [.55, .93]) for (const sx of [-1, 1]) for (let i = 2; i < NS - 1; i++) rod('timber', P(i, u, sx), P(i + 1, u, sx), .03, HB, 4);
  for (const sx of [-1, 1]) { const pos = []; const NU = 6; for (let i = 1; i < NS; i++) for (let k = 0; k <= NU; k++) pos.push(...P(i, .3 * k / NU, sx));
    const idx = []; for (let i = 0; i < NS - 2; i++) for (let k = 0; k < NU; k++) { const a = i * (NU + 1) + k, b = a + 1, c = a + NU + 1, d = c + 1; idx.push(a, b, c, b, d, c); }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals(); put(g.toNonIndexed(), 'plank', 0, 0, 0, 0, 0, 0, .5, HB); }
  for (const [k, gs] of HB) for (const g of gs) { g.applyMatrix4(HM); worldUV(g, .5); if (!B.has(k)) B.set(k, []); B.get(k).push(g); }
  const W = (v) => new THREE.Vector3(...v).applyMatrix4(HM);
  // the keel blocks: a stack of timbers from the ways' centre line up to the keel's underside at each, every 1.6 m
  const blocks = []; for (let zl = -5; zl <= 5.2; zl += 1.6) { const k = W([0, keelY(zl), zl]), yb = way(k.z) - .16; put(new THREE.BoxGeometry(.5, k.y - yb, .4), 'block', 0, (k.y + yb) / 2, k.z); blocks.push({ z: +k.z.toFixed(3), top: +k.y.toFixed(3) }); }
  // the shores: a prop from the ground just out from the hull to its turn of the bilge, under the staging, at every second frame, both sides; the staging on its trestles
  for (let i = 8; i < NS - 4; i += 8) for (const sx of [-1, 1]) { const b = W(P(i, .3, sx)), gx = b.x + sx * .9 /* inside the staging's line: the shores stand under it */; rod('timber', [b.x + sx * .05, b.y, b.z], [gx, ground(gx, b.z) - .1, b.z], .08); }
  const STX = 3.25, STY = HY - .2, SZ0 = HZ - 5.2, SZ1 = HZ + 5.2;
  for (const sx of [-1, 1]) { for (let z = SZ0; z < SZ1; z += .45) put(new THREE.BoxGeometry(.7, .05, .42), 'deck', sx * STX, STY - .025 + (z + .21 - HZ) * SL, z + .21, -ang, 0, 0, .6);
    for (let z = SZ0 + .4; z < SZ1; z += 2.4) for (const dx of [-.3, .3]) { const y0 = ground(sx * STX + dx, z) - .1, y1 = STY - .05 + (z - HZ) * SL; put(new THREE.BoxGeometry(.1, y1 - y0, .1), 'timber', sx * STX + dx, (y0 + y1) / 2, z); } }
  // the quay: stone, out from the yard to the east of the slip, bollards along its edge; the finished sloop along its far face
  const QX0 = 7, QX1 = 13, QZ0 = -22, QZ1 = 9;
  put(new THREE.BoxGeometry(QX1 - QX0, LAND + 3.9, QZ1 - QZ0), 'rubble', (QX0 + QX1) / 2, (LAND - .1 - 4) / 2, (QZ0 + QZ1) / 2, 0, 0, 0, .6) /* under the dressed cap */; put(new THREE.BoxGeometry(QX1 - QX0 + .1, .12, QZ1 - QZ0 + .1), 'dress', (QX0 + QX1) / 2, LAND - .06, (QZ0 + QZ1) / 2, 0, 0, 0, .6);
  for (let z = QZ0 + 2; z < QZ1 - 4; z += 6) for (const x of [QX0 + .4, QX1 - .4]) { put(new THREE.CylinderGeometry(.16, .2, .6, 10), 'iron', x, LAND + .3, z); put(new THREE.SphereGeometry(.2, 10, 6, 0, Math.PI * 2, 0, Math.PI / 2), 'iron', x, LAND + .6, z); }
  const sl = gatelandsSloop({}, stream(String(o.key || 'shipyard') + ':sloop')), SLX = QX1 + .35 + S.W / 2, SLZ = -8;
  { const sail = sl.group.getObjectByName('sail'), bb = new THREE.Box3().setFromObject(sail), n = sail.geometry.attributes.position.count / 3; sl.group.remove(sail); sl.tris -= n;
    const furl = new THREE.Mesh(new THREE.CylinderGeometry(.2, .2, bb.max.x - bb.min.x - .2, 10).rotateZ(Math.PI / 2), sail.material); furl.position.set((bb.min.x + bb.max.x) / 2, bb.max.y - .28, (bb.min.z + bb.max.z) / 2 - .05); furl.name = 'sail'; furl.castShadow = true; sl.group.add(furl); sl.tris += 40; }
  sl.group.position.set(SLX, 0, SLZ); rod('rope', [QX1 - .4, LAND + .5, SLZ + 4], [SLX - 1.5, 1.6, SLZ + 5.4], .02); rod('rope', [QX1 - .4, LAND + .5, SLZ - 4], [SLX - 1.4, 1.5, SLZ - 5.6], .02);
  // the shed: posts under a thatched roof over the sawpit, its log on trestles across the pit
  const SX0 = -17, SX1 = -7, SHZ0 = 13, SHZ1 = 21, EAV = 3.0, RIDGE = 5.6;
  for (let x = SX0; x <= SX1 + .01; x += 2.5) for (const z of [SHZ0, SHZ1]) { const y0 = ground(x, z) - .2; put(new THREE.BoxGeometry(.22, EAV - y0 + LAND, .22), 'timber', x, (EAV + LAND + y0) / 2, z); }
  for (const z of [SHZ0, SHZ1]) put(new THREE.BoxGeometry(SX1 - SX0 + .4, .2, .22), 'timber', (SX0 + SX1) / 2, LAND + EAV, z);
  { const hw = (SHZ1 - SHZ0) / 2 + .6, rise = RIDGE - EAV, sl2 = Math.hypot(hw, rise); for (const sz of [-1, 1]) put(new THREE.BoxGeometry(SX1 - SX0 + 1.2, .35, sl2), 'thatch', (SX0 + SX1) / 2, LAND + EAV + rise / 2 + .1, (SHZ0 + SHZ1) / 2 + sz * hw / 2, sz * Math.atan2(rise, hw), 0, 0, .7);
    const gs = new THREE.Shape([[-hw + .6, 0], [hw - .6, 0], [0, rise - .3]].map(([a, b]) => new THREE.Vector2(a, b))); for (const x of [SX0, SX1]) { const g = new THREE.ShapeGeometry(gs); g.rotateY(Math.PI / 2); put(g, 'timber', x, LAND + EAV + .1, (SHZ0 + SHZ1) / 2); } }
  const PX = -12, PZ = 17, PW = 1.0, PL = 4.2, PD = 1.8, py = ground(PX, PZ);
  put(new THREE.BoxGeometry(PW, .02, PL), 'dark', PX, py + .03, PZ); for (const sx of [-1, 1]) put(new THREE.BoxGeometry(.22, .18, PL + .5), 'timber', PX + sx * (PW / 2 + .11), py + .09, PZ);
  for (const z of [PZ - 1.4, PZ + 1.4]) { put(new THREE.BoxGeometry(PW + .9, .2, .2), 'timber', PX, py + .28, z); }
  { const g = new THREE.CylinderGeometry(.32, .36, 5.6, 12); g.rotateX(Math.PI / 2); put(g, 'bark', PX, py + .72, PZ); put(new THREE.BoxGeometry(.03, .9, .5), 'iron', PX, py + 1.2, PZ - .6); }
  // the steam box on trestles by its boiler on a hearth; the stacks of planks in stick; the pile of logs
  const BXs = -3.8, BZs = 27, by = ground(BXs, BZs); put(new THREE.BoxGeometry(.6, .6, 5.2), 'sailwood', BXs, by + 1.25, BZs); for (const z of [BZs - 2, BZs + 2]) for (const dx of [-.35, .35]) put(new THREE.BoxGeometry(.1, .95, .1), 'timber', BXs + dx, by + .47, z);
  put(new THREE.BoxGeometry(1.4, .6, 1.4), 'rubble', BXs, by + .3, BZs - 3.6, 0, 0, 0, .6); put(new THREE.CylinderGeometry(.45, .5, .8, 14), 'boiler', BXs, by + 1.0, BZs - 3.6); rod('boiler', [BXs, by + 1.4, BZs - 3.6], [BXs, by + 1.4, BZs - 2.6], .06);
  for (const [sx, sz] of [[4.6, 26], [8.4, 26]]) { const sy = ground(sx, sz); for (let layer = 0; layer < 6; layer++) { const y = sy + .1 + layer * .1; if (layer % 2) for (const dz of [-2, 0, 2]) put(new THREE.BoxGeometry(2.4, .04, .05), 'timber', sx, y - .03, sz + dz); else for (let k = 0; k < 6; k++) put(new THREE.BoxGeometry(.3, .05, 5.6), 'plank', sx - .9 + k * .36, y, sz, 0, 0, 0, .6); } }
  for (let k = 0; k < 9; k++) { const row = k < 4 ? 0 : k < 7 ? 1 : 2, i = row === 0 ? k : row === 1 ? k - 4 : k - 7, g = new THREE.CylinderGeometry(.28, .3, 6, 10); g.rotateX(Math.PI / 2); put(g, 'bark', -9.5 + i * .58 + row * .29, ground(-9, 28) + .3 + row * .5, 28 + (r() - .5) * .4); }
  const group = new THREE.Group(); let tris = 0; for (const [k, gs] of B) { const g = mergeGeometries(gs, false); gs.forEach(x => x.dispose()); const m = new THREE.Mesh(g, M[k]); m.name = k; m.castShadow = !['turf', 'strand', 'water', 'dark'].includes(k); m.receiveShadow = k !== 'water'; group.add(m); tris += g.attributes.position.count / 3; }
  const own = group.children.length; group.add(sl.group);
  return { group, tris: Math.round(tris), own, draws: own + sl.draws, sloopTris: sl.tris, slope: SL, way, ways: { x: WX, z0: WZ0, z1: WZ1 }, blocks, hull: { matrix: HM, y: HY, z: HZ, keelLow: +Math.min(...blocks.map(b => b.top)).toFixed(3) },
    staging: { x: STX, y: STY, z0: SZ0, z1: SZ1 }, quay: { x0: QX0, x1: QX1, z0: QZ0, z1: QZ1, top: LAND }, sloop: { x: SLX, z: SLZ, W: S.W, L: S.L, deck: S.deck }, pit: { x: PX, z: PZ, w: PW, l: PL }, ground };
}

// ── the Gatelands' peat-cutting camp (Session 991, card F8; OG-124's "a peat-cutting camp", off the road on the home island, with
// OG-014's bogland and OG-099's fens). A family's turf bank on a raised bog, as the hand-cut banks of Connemara and the Bog of Allen were
// worked with the sleán: the face cut down in two spits, the sods thrown up onto the bank to dry, spread first and then footed on end,
// the dry turf built into a rick by the bog road for the cart, and a cutters' bothy of sods under thatch with a fire at its door.
// Built at true size, a metre a unit, y 0 the bog's surface, the face along x at z 0 with the cutaway to +z:
//   - the bank: the face cut down about 1.3 m in two spits (a bench 0.8 m down and 0.45 m wide), 36 m along, its west end cut steep and its
//     east end ramped at about 1 in 5 for the barrow; the cutaway's floor wet, black water standing in its hollows but none
//     within 2 m of the face, where the cutter stands, the last
//     generation's bank slumped and heathered 12 to 16 m out;
//   - on the bank: the newest sods spread in rows to skin, older ones footed in sixes (five on end, one across), a turf barrow
//     half loaded, a creel, the sleán stood in the bank by the lip;
//   - by the road: a gravel bog road along z -18, the rick of dry turf beside it, the bothy (3.6 by 2.8 m of sod walls 1.5 m high,
//     a thatched roof held by ropes weighted with stones, a low door to the road), the fire on a ring of stones with a crane and kettle.
//   Heather and bog cotton on the uncut bog. Who cuts here is the quest writer's; nobody is drawn (people are the bodies builder's).
// -> { group, tris, draws, own, ground, bank { x0, x1, lip (z), bench (y), benchZ, floor (y about), water }, spread [[x, z]],
//   footings [{ x, z, feet: [[x, y, z]] }], slean { x, z, tip, top }, rick { x, z, l, w, h }, hut { x, z, w, d, wall, door: { x, w, h } },
//   fire { x, z, kettle (its bottom's y), embers (y) }, road { z, w } }
export function gatelandsPeatCamp(o = {}, r = stream('peat')) {
  const MI = millMats(), std = (c, ro = .9, x = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: ro, ...x });
  const M = { ...MI, bog: mat('turfDry', { ns: 1.2, color: 0xc8b8a0, rough: 1 }), peat: mat('plaster', { ns: 1.4, color: 0x5a4030, rough: 1 }), floor: mat('plaster', { ns: 1.2, color: 0x46362a, rough: .7 }),
    water: std(0x2e2824, .12), sodWet: mat('plaster', { ns: 1.5, color: 0x4e3a2c, rough: .85 }), sod: mat('plaster', { ns: 1.5, color: 0x6e543e, rough: 1 }), sodDry: mat('plaster', { ns: 1.5, color: 0x7a5e46, rough: 1 }),
    grit: mat('rock', { ns: .8, color: 0x84765e, rough: 1 }),
    heather: std(0x4c3a40, 1), ling: std(0x5a5a34, 1), cotton: std(0xf2f0e8, .9), stone: mat('rock', { ns: 1.0, color: 0x8a867c, rough: 1 }), wall: mat('turfDry', { ns: 1.2, color: 0xb0a088, rough: 1 }),
    ember: std(0x2a1408, .6, { emissive: new THREE.Color(1, .4, .12), emissiveIntensity: 2.2 }), rope: std(0x8a7650, .95), basket: mat('thatch', { ns: .8, color: 0x8a7046, rough: 1 }), ash: mat('wood', { ns: .8, color: 0xb89a74, rough: .8 }), thatch: mat('thatch', { ns: 1.2, color: 0x9a8a66, rough: 1 }) };
  const B = new Map(), key = String(o.key || 'peat'), F = stream(key + ':lie'), ph = Array.from({ length: 8 }, () => F() * 6.283);
  const put = (geo, k, x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0, uv = .5) => { const g = geo.index ? geo.toNonIndexed() : geo; for (const a of Object.keys(g.attributes)) if (!['position', 'normal'].includes(a)) g.deleteAttribute(a);
    if (!g.attributes.normal) g.computeVertexNormals(); g.applyMatrix4(new THREE.Matrix4().compose(new THREE.Vector3(x, y, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(rx, ry, rz, 'YXZ')), new THREE.Vector3(1, 1, 1))); worldUV(g, uv);
    if (!B.has(k)) B.set(k, []); B.get(k).push(g); return g; };
  const rod = (k, a, b, rad, seg = 6) => { const A = new THREE.Vector3(...a), C = new THREE.Vector3(...b), d = C.clone().sub(A), g = new THREE.CylinderGeometry(rad, rad, d.length(), seg);
    g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.clone().normalize())); g.translate((A.x + C.x) / 2, (A.y + C.y) / 2, (A.z + C.z) / 2); return put(g, k); };
  const sm = t => { t = Math.min(1, Math.max(0, t)); return t * t * (3 - 2 * t); };
  // the land: the raised bog in low hummocks, kept flatter along the road and under the bothy; the cut stepped down from the lip at z 0
  const CX = 18, RZ = -18, RW = 2.6, HX = 9, HZ = -24, HW = 3.6, HD = 2.8, BENCH = -.8, BZ = .45, WL = -1.45;
  const hum = (x, z) => .07 * Math.sin(x * .9 + ph[0]) * Math.sin(z * .8 + ph[1]) + .05 * Math.sin(x * 2.1 + z * 1.6 + ph[2]) + .04 * Math.sin(x * .17 - z * .23 + ph[3]);
  const calm = (x, z) => Math.max(sm(1 - (Math.abs(z - RZ) - RW / 2) / 1.5), sm(1 - Math.max(Math.abs(x - HX) - HW / 2 - .4, Math.abs(z - HZ) - HD / 2 - .4) / 1.5));
  const bog = (x, z) => hum(x, z) * (1 - .85 * calm(x, z)) * (1 - sm((Math.abs(x) - 31) / 5)) * (1 - sm((-z - 31) / 5)) * (1 - sm((z - 25) / 5)) /* flat at the patch's edge, where the bands meet it */;
  const mx = x => x >= 0 ? 1 - sm((x - CX) / 8) : 1 - sm((-x - CX) / 3), wz = z => z <= 0 ? 0 : z < 12 ? 1 : 1 - sm((z - 12) / 4);
  const cutY = (x, z) => z < BZ ? BENCH : -1.5 + .08 + .05 * Math.sin(x * .55 + ph[4]) * Math.sin(z * .7 + ph[5]) + .05 * Math.sin(x * .23 - z * .41 + ph[6]) + .03 * Math.sin(x * 1.3 + z * .9 + ph[7]) + (1 - sm(z - 2)) * .14 /* the cutter's ground at the face's foot, dry for 2 m out */;
  const ground = (x, z) => { const m = mx(x) * wz(z), b = bog(x, z); return b + (cutY(x, z) - b) * m; };
  { const xs = [], zs = []; for (let x = -36; x < -24; x += 2) xs.push(x); for (let x = -24; x < 24; x += .8) xs.push(+x.toFixed(2)); for (let x = 24; x <= 36; x += 2) xs.push(x);
    for (let z = -36; z < -20; z += 1.5) zs.push(z); for (let z = -20; z < -3; z += .85) zs.push(+z.toFixed(2)); for (let z = -3; z < -.1; z += .3) zs.push(+z.toFixed(2));
    zs.push(-.005, .005, .15, .3, BZ - .006, BZ + .006); for (let z = .7; z < 12; z += .5) zs.push(z); for (let z = 12; z < 18; z += .6) zs.push(+z.toFixed(2)); for (let z = 18; z <= 30; z += 2) zs.push(z);
    const NX = xs.length, pos = [], I = { bog: [], peat: [], floor: [] }; for (const z of zs) for (const x of xs) pos.push(x, ground(x, z), z);
    for (let j = 0; j < zs.length - 1; j++) for (let i = 0; i < NX - 1; i++) { const a = j * NX + i, b = a + 1, c = a + NX, d = c + 1, ys = [a, b, c, d].map(q => pos[q * 3 + 1]), dy = Math.max(...ys) - Math.min(...ys), run = Math.min(xs[i + 1] - xs[i], zs[j + 1] - zs[j]);
      const z = (zs[j] + zs[j + 1]) / 2, x = (xs[i] + xs[i + 1]) / 2, cut = mx(x) * wz(z), y = ys.reduce((s, v) => s + v) / 4;
      (dy / run > 3 || (z > 0 && z < BZ && cut > .9) ? I.peat : cut > .5 && z < 12 && y < -.4 ? I.floor : I.bog).push(a, c, b, b, c, d); }
    for (const [k, idx] of Object.entries(I)) { let g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals(); g = g.toNonIndexed(); if (k === 'peat') g.computeVertexNormals() /* the face flat-shaded: its edges are not smoothed into the bog */; put(g, k, 0, 0, 0, 0, 0, 0, .35); } }
  // the bog beyond, out to the fog: four flat bands round the patch
  for (const [w, d, x, z] of [[1200, 600, 0, -336], [1200, 600, 0, 330], [600, 66, -336, -3], [600, 66, 336, -3]]) { const g = new THREE.PlaneGeometry(w, d); g.rotateX(-Math.PI / 2); put(g, 'bog', x, 0, z, 0, 0, 0, .35); }
  // the water standing in the cutaway's hollows
  { const g = new THREE.PlaneGeometry(2 * CX + 3, 13 - BZ + .005); g.rotateX(-Math.PI / 2); put(g, 'water', .5, WL, (13 + BZ - .005) / 2); }
  // a sod: 0.3 long, 0.11 square, the sleán's cut
  const SL = .3, SW = .11, sod = (k, x, y, z, rx, ry, rz) => put(new THREE.BoxGeometry(SW, SL, SW), k, x, y, z, rx, ry, rz, 2.2);
  // spread: the newest sods in rows on the bank to skin over, lying flat along x, the row's gaps where the barrow went
  const spread = []; for (let row = 0; row < 9; row++) { const z = -1.25 - row * .42; for (let x = -16; x < 3; x += SL + .06) { if (F() < .12) continue; const xx = x + (F() - .5) * .05, zz = z + (F() - .5) * .08;
    sod('sodWet', xx, bog(xx, zz) + SW / 2 + .005, zz, 0, (F() - .5) * .25, Math.PI / 2); spread.push([+xx.toFixed(3), +zz.toFixed(3)]); } }
  // footed: four on end leaning in, their tops touching, one laid across; in rows behind the spread and east of it
  const footings = [], TILT = .3, RB = .12, RC = RB - SL / 2 * Math.sin(TILT); const foot = (cx, cz) => { const a0 = F() * 6.283, feet = [];
    for (let k = 0; k < 5; k++) { const a = a0 + k * Math.PI * 2 / 5 + (F() - .5) * .2, bx = cx - RB * Math.sin(a), bz = cz - RB * Math.cos(a), gy = bog(bx, bz), y = gy + SL / 2 * Math.cos(TILT) + SW / 2 * Math.sin(TILT) - .005;
      sod('sod', cx - RC * Math.sin(a), y, cz - RC * Math.cos(a), TILT, a, 0); feet.push([+bx.toFixed(3), +(y - SL / 2 * Math.cos(TILT) - SW / 2 * Math.sin(TILT)).toFixed(3), +bz.toFixed(3)]); }
    const top = Math.max(...feet.map(f => f[1])) + SL * Math.cos(TILT) - .02; sod('sod', cx, top + SW / 2, cz, 0, a0 + .5, Math.PI / 2) /* laid across the tops, sat down among them */; footings.push({ x: +cx.toFixed(3), z: +cz.toFixed(3), feet, top: +top.toFixed(3) }); };
  for (let z = -6; z > -11.5; z -= 1.15) for (let x = -15.5; x < 15.5; x += 1.25) if (F() > .3) foot(x + (F() - .5) * .3, z + (F() - .5) * .3);
  for (let z = -1.6; z > -4.8; z -= 1.1) for (let x = 5; x < 15.5; x += 1.2) if (F() > .2) foot(x + (F() - .5) * .3, z + (F() - .5) * .3);
  // the sleán: an ash shaft stood in the bank by the lip, its blade and its wing in the peat
  const SX = -3.2 + (F() - .5), SZ = -.42, slTilt = .22, slY = bog(SX, SZ), SH = 1.05, BL = .3, tipY = slY - .2;
  { const dir = new THREE.Vector3(0, Math.cos(slTilt), -Math.sin(slTilt)), tip = new THREE.Vector3(SX, tipY, SZ), bh = tip.clone().addScaledVector(dir, BL), top = bh.clone().addScaledVector(dir, SH);
    put(new THREE.BoxGeometry(.13, BL, .012), 'iron', SX, (tipY + bh.y) / 2, SZ - BL / 2 * Math.sin(slTilt), slTilt); put(new THREE.BoxGeometry(.012, BL * .8, .1), 'iron', SX + .065, (tipY + bh.y) / 2 + .03, SZ - BL / 2 * Math.sin(slTilt) - .05, slTilt);
    rod('ash', bh.toArray(), top.toArray(), .02); put(new THREE.BoxGeometry(.2, .035, .035), 'ash', top.x, top.y, top.z, slTilt); }
  const slean = { x: +SX.toFixed(3), z: SZ, tip: +tipY.toFixed(3), top: +(tipY + (BL + SH) * Math.cos(slTilt)).toFixed(3), ground: +slY.toFixed(3) };
  // the turf barrow: a slatted bed with its front board, one plank wheel, the handles and the legs; half a load of wet sods on it
  { const bx = 5.6, bz = -1.9, ry = .3 + (F() - .5) * .2, gy = bog(bx, bz), c = Math.cos(ry), s = Math.sin(ry), P = (u, v, h) => [bx + u * c + v * s, gy + h, bz - u * s + v * c];
    const bed = .5; for (let k = 0; k < 6; k++) put(new THREE.BoxGeometry(.11, .025, 1.05), 'ash', ...P(-.3 + k * .12, 0, bed), 0, ry);
    put(new THREE.BoxGeometry(.72, .45, .03), 'ash', ...P(0, .6, bed + .2), -.5, ry); for (const u of [-.38, .38]) rod('ash', P(u * .75, .72, .28), P(u, -1.2, .58), .025);
    const w = new THREE.CylinderGeometry(.27, .27, .05, 14); w.rotateZ(Math.PI / 2); put(w, 'ash', ...P(0, .78, .27), 0, ry); for (const u of [-.3, .3]) rod('ash', P(u, -.5, 0), P(u, -.5, bed), .025);
    for (let k = 0; k < 10; k++) sod('sodWet', ...P(-.24 + (k % 5) * .12, -.2 + Math.floor(k / 5) * .32, bed + .07), Math.PI / 2, ry, 0); }
  // a creel by the footings
  { const g = new THREE.CylinderGeometry(.26, .2, .42, 14, 1, true); put(g, 'basket', 3.4, bog(3.4, -6.3) + .21, -6.3); put(new THREE.CircleGeometry(.2, 14).rotateX(-Math.PI / 2), 'basket', 3.4, bog(3.4, -6.3) + .01, -6.3); }
  // the bog road: gravel on the bog, a hand's breadth proud, its edges sunk
  for (let x = -36; x < 22; x += 1) { const y = Math.max(bog(x, RZ - 1), bog(x, RZ + 1), bog(x + 1, RZ)) + .04; put(new THREE.BoxGeometry(1.02, .14, RW), 'grit', x + .5, y - .03, RZ + (F() - .5) * .04, 0, (F() - .5) * .01); }
  // the rick: dry turf built into a long clamp by the road, battered sides and a rounded back, its outside laid in courses
  const RKX = -3, RKZ = RZ - 2.6, RL = 4.2, RWd = 1.5, RH = 1.4;
  { const s = new THREE.Shape(); s.moveTo(-RWd / 2, 0); s.lineTo(RWd / 2, 0); s.lineTo(RWd / 2 - .22, RH * .78); s.quadraticCurveTo(0, RH * 1.06, -RWd / 2 + .22, RH * .78); s.closePath();
    const g = new THREE.ExtrudeGeometry(s, { depth: RL, bevelEnabled: false, curveSegments: 6 }); g.translate(0, 0, -RL / 2); g.rotateY(Math.PI / 2); put(g, 'sodDry', RKX, bog(RKX, RKZ) - .05, RKZ, 0, 0, 0, 2.2);
    const ry0 = bog(RKX, RKZ) - .05; for (let c = 0; c < 7; c++) { const y = ry0 + .06 + c * .11, inset = .22 * (c * .11) / (RH * .78); for (const sz of [-1, 1]) for (let x = -RL / 2 + .17; x < RL / 2 - .1; x += .31)
      sod('sodDry', RKX + x + (F() - .5) * .03, y, RKZ + sz * (RWd / 2 - inset + .02), Math.PI / 2, 0, Math.PI / 2 + (F() - .5) * .08); } }
  // the bothy: sod walls on the road's north side, the door to the road; gables of sod, a thatched roof roped down with hanging stones
  const WT = .5, WH = 1.5, DW = .78, DH = 1.42, hy = Math.min(...[[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([a, b]) => bog(HX + a * HW / 2, HZ + b * HD / 2))) - .04;
  { const wall = (w, h, d, x, y, z) => put(new THREE.BoxGeometry(w, h, d), 'wall', x, y, z, 0, 0, 0, .8);
    wall(HW, WH, WT, HX, hy + WH / 2, HZ - HD / 2 + WT / 2); const side = (HW - DW) / 2; for (const sx of [-1, 1]) wall(side, WH, WT, HX + sx * (DW / 2 + side / 2), hy + WH / 2, HZ + HD / 2 - WT / 2);
    wall(DW, WH - DH, WT, HX, hy + DH + (WH - DH) / 2, HZ + HD / 2 - WT / 2); put(new THREE.BoxGeometry(DW + .5, .1, WT + .04), 'timber', HX, hy + DH + .05, HZ + HD / 2 - WT / 2);
    for (const sx of [-1, 1]) { wall(WT, WH, HD - 2 * WT, HX + sx * (HW / 2 - WT / 2), hy + WH / 2, HZ);
      const s = new THREE.Shape(); s.moveTo(-HD / 2, 0); s.lineTo(HD / 2, 0); s.lineTo(0, 1.25); s.closePath(); const g = new THREE.ExtrudeGeometry(s, { depth: WT, bevelEnabled: false }); g.translate(0, 0, -WT / 2); g.rotateY(Math.PI / 2); put(g, 'wall', HX + sx * (HW / 2 - WT / 2), hy + WH, HZ, 0, 0, 0, .8); }
    put(new THREE.BoxGeometry(HW - 2 * WT, .04, HD - 2 * WT), 'floor', HX, hy + .02, HZ);
    const pitch = Math.atan2(1.25, HD / 2), slope = Math.hypot(1.25, HD / 2) + .45; for (const sz of [-1, 1]) { put(new THREE.BoxGeometry(HW + .5, .32, slope), 'thatch', HX, hy + WH + 1.25 / 2 - .08, HZ + sz * (HD / 4 + .12), sz * pitch, 0, 0, .8); }
    put(new THREE.CylinderGeometry(.14, .14, HW + .5, 8).rotateZ(Math.PI / 2), 'thatch', HX, hy + WH + 1.25 + .08, HZ);
    for (const dx of [-1.2, -.4, .4, 1.2]) { const pts = []; for (let k = 0; k <= 12; k++) { const t = k / 12 * 2 - 1, zz = t * (HD / 2 + .3), yy = hy + WH + 1.25 + .2 - Math.abs(t) * 1.4; pts.push(new THREE.Vector3(HX + dx, yy, HZ + zz)); }
      put(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 24, .018, 5), 'rope'); for (const sz of [-1, 1]) { const st = new THREE.IcosahedronGeometry(.13, 0); st.scale(1, 1.2, .8); rod('rope', [HX + dx, hy + WH + .05, HZ + sz * (HD / 2 + .3)], [HX + dx, hy + WH - .45, HZ + sz * (HD / 2 + .32)], .012); put(st, 'stone', HX + dx, hy + WH - .55, HZ + sz * (HD / 2 + .34)); } } }
  const hut = { x: HX, z: HZ, y: +hy.toFixed(3), w: HW, d: HD, wall: WT, wallH: WH, ridge: +(WH + 1.25).toFixed(2), door: { x: HX, z: HZ + HD / 2, w: DW, h: DH } };
  // the fire before the door: a ring of stones, embers on the ash, a crane of two forked sticks and a bar, the kettle on its hook
  const FX = HX + 2.4, FZ = HZ + HD / 2 + 1.7, fy = bog(FX, FZ);
  for (let k = 0; k < 9; k++) { const a = k / 9 * 6.283 + F() * .3, st = new THREE.IcosahedronGeometry(.11 + F() * .05, 0); st.scale(1.2, .7, 1); put(st, 'stone', FX + .42 * Math.cos(a), fy + .05, FZ + .42 * Math.sin(a), 0, F() * 3); }
  { const e = new THREE.CylinderGeometry(.3, .34, .06, 12); put(e, 'ember', FX, fy + .03, FZ); for (let k = 0; k < 5; k++) { const a = k * 1.25; rod('timber', [FX + .32 * Math.cos(a), fy + .05, FZ + .32 * Math.sin(a)], [FX + .02 * Math.cos(a), fy + .16, FZ + .02 * Math.sin(a)], .035); } }
  const CH = 1.05; for (const sx of [-1, 1]) { rod('timber', [FX + sx * .62, fy - .15, FZ], [FX + sx * .6, fy + CH + .12, FZ], .028); rod('timber', [FX + sx * .6, fy + CH - .05, FZ], [FX + sx * .68, fy + CH + .14, FZ], .02); }
  rod('timber', [FX - .75, fy + CH, FZ], [FX + .75, fy + CH, FZ], .025); rod('iron', [FX, fy + CH, FZ], [FX, fy + .72, FZ], .008);
  const V = (a, b) => new THREE.Vector2(a, b), KB = fy + .38; put(new THREE.LatheGeometry([V(.001, 0), V(.12, .01), V(.16, .08), V(.16, .2), V(.1, .3), V(.06, .32), V(.001, .33)], 14), 'iron', FX, KB, FZ);
  rod('iron', [FX - .12, KB + .26, FZ], [FX, fy + .72, FZ], .006); rod('iron', [FX + .12, KB + .26, FZ], [FX, fy + .72, FZ], .006);
  const fire = { x: +FX.toFixed(3), z: +FZ.toFixed(3), kettle: +KB.toFixed(3), embers: +(fy + .06).toFixed(3) };
  // heather and bog cotton on the uncut bog, off the road, the bank's working strip, the rick and the bothy
  const clear = (x, z) => mx(x) * (z > -12.2 && z < 16.5 ? 1 : 0) > .02 || Math.abs(z - RZ) < RW / 2 + .3 || (Math.abs(x - RKX) < RL / 2 + .5 && Math.abs(z - RKZ) < RWd / 2 + .5) || (Math.abs(x - HX - 1) < 4 && z > HZ - 2 && z < FZ + 1.2) || (z > -1 && z < 17 && mx(x) > 0);
  for (let k = 0, n = 0; k < 1500 && n < 240; k++) { const x = -34 + F() * 68, z = -34 + F() * 62; if (clear(x, z)) continue; n++; const s = .14 + F() * .2, g = new THREE.IcosahedronGeometry(s, 0); g.scale(1.3, .55, 1.3); put(g, n % 3 ? 'heather' : 'ling', x, bog(x, z) + s * .3, z, 0, F() * 6); }
  for (let k = 0, n = 0; k < 900 && n < 110; k++) { const x = -30 + F() * 60, z = -30 + F() * 56; if (clear(x, z)) continue; n++; const h = .25 + F() * .15, gy = bog(x, z);
    put(new THREE.BoxGeometry(.008, h, .008), 'ling', x, gy + h / 2, z); put(new THREE.IcosahedronGeometry(.04, 0).scale(1, 1.3, 1), 'cotton', x, gy + h + .03, z); }
  const group = new THREE.Group(); let tris = 0; for (const [k, gs] of B) { const g = mergeGeometries(gs, false); gs.forEach(x => x.dispose()); const m = new THREE.Mesh(g, M[k]); m.name = k; m.castShadow = !['bog', 'floor', 'water', 'peat', 'ember'].includes(k); m.receiveShadow = k !== 'water'; group.add(m); tris += g.attributes.position.count / 3; }
  return { group, tris: Math.round(tris), draws: group.children.length, own: group.children.length, top: +(hy + WH + 1.4).toFixed(2), ground, bog,
    bank: { x0: -CX, x1: CX, lip: 0, bench: BENCH, benchZ: BZ, floorZ: [BZ, 12], water: WL }, spread, footings, slean, rick: { x: RKX, z: RKZ, l: RL, w: RWd, h: RH, y: +(bog(RKX, RKZ) - .05).toFixed(3) }, hut, fire, road: { z: RZ, w: RW } };
}
// gatelandsShepherdHut(o, r) (Session 997, card F8; OG-124's "abandoned shepherd's hut", with OG-014's dry-stone walls and OG-077's foxglove):
// a summer hut on the hill pasture, after the booley huts on Slievemore and the shielings of the Highlands, left when the flock went. At true size,
// a metre a unit, y 0 the hut's floor, the hill rising to -z at about 1 in 7 and the hut's door to +z, down the hill:
//   - the hut: 6.0 by 4.2 m of dry-stone walls 0.6 m thick to eaves of 1.9 m, cut into the slope on a levelled stance. The west gable stands
//     to its apex with a stub of chimney; the east gable has fallen and lies as a heap of stones in and out. The roof is gone: two rafters
//     have slid down with their heads still on the wall-heads, the ridge pole lies on the floor among the rotted thatch. A door 0.85 by
//     1.8 m under a slab lintel, a window of 0.45 by 0.5, a hearthstone at the west gable with its two hobs. Nettles inside and at the door.
//   - the fold: a round pen of dry stone 8.4 m across, 1.35 m high with its coping on edge, its gate toward the hut between two standing
//     posts, the wattle hurdle that closed it lying against the wall, and a breach on the downhill side tumbled to the knee.
//   - a rowan by the door (the old charm against the fairies, kept when the hut was not), a stone-lined spring above the hut under a slab hood,
//     the worn track from the door to the fold's gate, bracken going rust on the hill, and foxglove gone to seed.
// -> { group, tris, draws, own, ground, hut { x, z, y, w, d, wall, eaves, ridge, door { x, z, w, h }, win { x, sill, w, h }, gableW, gableE, tops },
//      rafters [{ a, b, rad }], ridgePole { a, b, rad }, fold { x, z, r, wall, h, gate { a, w }, breach { a, w } }, spring { x, z, water, lip }, rowan { x, z } }
export function gatelandsShepherdHut(o = {}, r = stream('shepherd')) {
  const MI = millMats(), std = (c, ro = .9, x = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: ro, ...x });
  const M = { turf: MI.turf, track: mat('turfDry', { ns: 1.0, color: 0xa89878, rough: 1 }), earth: mat('plaster', { ns: 1.2, color: 0x5e4c3a, rough: 1 }),
    wall: mat('cobble', { ns: 1.4, color: 0xb4b0a4, rough: .95 }), stone: mat('rock', { ns: 1.0, color: 0x9a968a, rough: 1 }), slab: mat('rock', { ns: .9, color: 0xa8a294, rough: .95 }),
    timber: mat('beam', { ns: 1.0, color: 0x8a7a66, rough: 1 }), rot: mat('thatch', { ns: 1.2, color: 0x6a5a40, rough: 1 }), wattle: mat('thatch', { ns: 1.0, color: 0x8a6c48, rough: 1 }),
    bark: std(0x5a5048, .9), leaf: std(0x5a6a32, .85), berry: std(0xb02a14, .5), nettle: std(0x3e5a28, .9), bracken: std(0x7a4c26, .95, { side: THREE.DoubleSide }), stalk: std(0x5a6a3a, .9),
    glove: std(0x9a4a8a, .7), water: std(0x1c2224, .08, { metalness: .2 }), lining: mat('cobble', { ns: 1.2, color: 0x8a867a, rough: .95 }) };
  M.lining.side = THREE.DoubleSide;
  const B = new Map(), key = String(o.key || 'shepherd'), F = stream(key + ':lie'), ph = Array.from({ length: 8 }, () => F() * 6.283);
  const put = (geo, k, x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0, uv = .5) => { const g = geo.index ? geo.toNonIndexed() : geo; for (const a of Object.keys(g.attributes)) if (!['position', 'normal'].includes(a)) g.deleteAttribute(a);
    if (!g.attributes.normal) g.computeVertexNormals(); g.applyMatrix4(new THREE.Matrix4().compose(new THREE.Vector3(x, y, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(rx, ry, rz, 'YXZ')), new THREE.Vector3(1, 1, 1))); worldUV(g, uv);
    if (!B.has(k)) B.set(k, []); B.get(k).push(g); return g; };
  const rod = (k, a, b, rad, seg = 6) => { const A = new THREE.Vector3(...a), C = new THREE.Vector3(...b), d = C.clone().sub(A), g = new THREE.CylinderGeometry(rad, rad, d.length(), seg);
    g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.clone().normalize())); g.translate((A.x + C.x) / 2, (A.y + C.y) / 2, (A.z + C.z) / 2); return put(g, k); };
  const sm = t => { t = Math.min(1, Math.max(0, t)); return t * t * (3 - 2 * t); };
  // the land: the hill falling to +z, a long swell across it, small hummocks; the hut's stance levelled at y 0, the bank cut behind it
  const HW = 6.0, HD = 4.2, T = .6, EAV = 1.9, APEX = 3.6, S = .15, FC = [11, 5.5], FR = 4.2, FT = .6, FH = 1.35, SP = [-8, -6.5];
  const hum = (x, z) => .06 * Math.sin(x * .9 + ph[0]) * Math.sin(z * .8 + ph[1]) + .04 * Math.sin(x * 2.3 + z * 1.7 + ph[2]);
  const hill = (x, z) => -S * z + .35 * Math.sin(x * .06 + ph[3]) * Math.cos(z * .05 + ph[4]) + hum(x, z);
  const stance = (x, z) => sm(1 - (Math.max(Math.abs(x) - HW / 2 - 1.0, Math.abs(z) - HD / 2 - .9, 0)) / 2.2);
  const ground = (x, z) => { const t = stance(x, z), w = Math.hypot(x - SP[0], z - SP[1]); return (hill(x, z) * (1 - t) - .02 * t) - (w < .62 ? .6 : 0) /* the spring's well: the turf let down inside its lining */; };
  // the track: from the door down to the fold's gate, a polyline the turf is worn along
  const DX = 1.0, aG = Math.atan2(HD / 2 - FC[1], DX - FC[0]), gate = [FC[0] + (FR + .5) * Math.cos(aG), FC[1] + (FR + .5) * Math.sin(aG)];
  const TR = [[DX, HD / 2], [DX + .6, HD / 2 + 2.2], [(DX + gate[0]) / 2 + .5, (HD / 2 + gate[1]) / 2 + 2.2], gate, [FC[0], FC[1]]];
  const segD = (x, z, a, b) => { const dx = b[0] - a[0], dz = b[1] - a[1], t = Math.max(0, Math.min(1, ((x - a[0]) * dx + (z - a[1]) * dz) / (dx * dx + dz * dz))); return Math.hypot(x - a[0] - dx * t, z - a[1] - dz * t); };
  const trackD = (x, z) => Math.min(...TR.slice(0, -1).map((p, i) => segD(x, z, p, TR[i + 1])));
  { const steps = (bands, end) => { const v = []; for (const [a, b, st] of bands) for (let q = a; q < b - 1e-6; q += st) v.push(+q.toFixed(2)); v.push(end); return v; };
    const xs = steps([[-70, -30, 10], [-30, -14, 2], [-14, 20, .5], [20, 30, 2], [30, 70, 10]], 70), zs = steps([[-70, -30, 10], [-30, -12, 2], [-12, 13, .5], [13, 31, 2], [31, 70, 13]], 70);
    const NX = xs.length, pos = [], I = { turf: [], track: [], earth: [] }; for (const z of zs) for (const x of xs) pos.push(x, ground(x, z), z);
    for (let j = 0; j < zs.length - 1; j++) for (let i = 0; i < NX - 1; i++) { const a = j * NX + i, b = a + 1, c = a + NX, d = c + 1, x = (xs[i] + xs[i + 1]) / 2, z = (zs[j] + zs[j + 1]) / 2;
      const inHut = Math.abs(x) < HW / 2 && Math.abs(z) < HD / 2;
      (inHut ? I.earth : I.turf).push(a, c, b, b, c, d); }
    for (const [k, idx] of Object.entries(I)) { let g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals(); put(g.toNonIndexed(), k, 0, 0, 0, 0, 0, 0, .35); } }
  // the track worn in the turf: a ribbon laid 2 cm over the ground along the line, its width wandering, sampled every 0.25 m
  { const pts = []; for (let i = 0; i < TR.length - 2; i++) { const [a, b] = [TR[i], TR[i + 1]], L = Math.hypot(b[0] - a[0], b[1] - a[1]), n = Math.ceil(L / .25); for (let k = i ? 1 : 0; k <= n; k++) pts.push([a[0] + (b[0] - a[0]) * k / n, a[1] + (b[1] - a[1]) * k / n]); }
    const pos = [], idx = []; pts.forEach(([x, z], i) => { const [p, q] = [pts[Math.max(0, i - 1)], pts[Math.min(pts.length - 1, i + 1)]], dx = q[0] - p[0], dz = q[1] - p[1], l = Math.hypot(dx, dz), w = .38 + .1 * Math.sin(i * .7 + ph[5]) + .05 * Math.sin(i * 2.3);
      for (const sd of [-1, -.5, 0, .5, 1]) { const ex = x - dz / l * w * sd, ez = z + dx / l * w * sd; pos.push(ex, ground(ex, ez) + .035, ez); } if (i) { const o = (i - 1) * 5; for (let c = 0; c < 4; c++) idx.push(o + c, o + c + 5, o + c + 1, o + c + 1, o + c + 5, o + c + 6); } });
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals(); if (g.attributes.normal.array[1] < 0) { g.setIndex(idx.map((v, j) => idx[j - j % 3 + [0, 2, 1][j % 3]])); g.computeVertexNormals(); } put(g, 'track', 0, 0, 0, 0, 0, 0, .35); }
  // the hut's walls: dry stone in lengths of about half a metre, each with its own ragged head; every head recorded for what rests on it
  const tops = [], Y0 = -.35;
  const wall = (ax, a0, a1, c, y1, rag, k = 'wall') => { const n = Math.max(1, Math.round((a1 - a0) / .55)), L = (a1 - a0) / n;
    for (let s = 0; s < n; s++) { const top = y1 + (rag ? (F() - .5) * rag : 0), m = a0 + L * (s + .5);
      if (ax === 'x') put(new THREE.BoxGeometry(L + .002, top - Y0, T), k, m, (top + Y0) / 2, c, 0, 0, 0, .9); else put(new THREE.BoxGeometry(T, top - Y0, L + .002), k, c, (top + Y0) / 2, m, 0, 0, 0, .9);
      tops.push({ ax, a0: a0 + L * s, a1: a0 + L * (s + 1), c, y: +top.toFixed(4) }); } };
  const topAt = (ax, c, a) => tops.find(t => t.ax === ax && Math.abs(t.c - c) < 1e-6 && a >= t.a0 && a <= t.a1).y;
  const ZB = -HD / 2 + T / 2, ZF = HD / 2 - T / 2, XW = -HW / 2 + T / 2, XE = HW / 2 - T / 2, DW = .85, DH = 1.8, WX = -1.6, WWd = .45, SILL = .95, WHt = .5;
  wall('x', -HW / 2, HW / 2, ZB, EAV, .2);
  wall('x', -HW / 2, WX - WWd / 2, ZF, EAV, .2); wall('x', WX + WWd / 2, DX - DW / 2, ZF, EAV, .2); wall('x', DX + DW / 2, HW / 2, ZF, EAV, .25);
  wall('x', WX - WWd / 2, WX + WWd / 2, ZF, SILL, 0); put(new THREE.BoxGeometry(WWd + .5, .14, T + .04), 'slab', WX, SILL + WHt + .07, ZF);   { const Hs = EAV - SILL - WHt - .14; put(new THREE.BoxGeometry(WWd, Hs, T), 'wall', WX, SILL + WHt + .14 + Hs / 2, ZF, 0, 0, 0, .9); }
  put(new THREE.BoxGeometry(DW + .6, .16, T + .04), 'slab', DX, DH + .08, ZF); { const Hs = EAV - DH - .16; put(new THREE.BoxGeometry(DW, Hs, T), 'wall', DX, DH + .16 + Hs / 2, ZF, 0, 0, 0, .9); }
  wall('z', -HD / 2 + T, HD / 2 - T, XW, EAV, 0); wall('z', -HD / 2 + T, HD / 2 - T, XE, EAV - .25, .45);
  // the west gable to its apex, and a stub of chimney on it; the hearthstone and its hobs at its foot
  { const s = new THREE.Shape(); s.moveTo(-HD / 2, 0); s.lineTo(HD / 2, 0); s.lineTo(0, APEX - EAV); s.closePath(); const g = new THREE.ExtrudeGeometry(s, { depth: T, bevelEnabled: false }); g.translate(0, 0, -T / 2); g.rotateY(Math.PI / 2); put(g, 'wall', XW, EAV, 0, 0, 0, 0, .9);
    put(new THREE.BoxGeometry(T, .55, .7), 'wall', XW, APEX - .12, 0, 0, 0, 0, .9); put(new THREE.BoxGeometry(T + .1, .08, .8), 'slab', XW, APEX + .19, 0); }
  put(new THREE.BoxGeometry(.7, .06, 1.1), 'slab', XW + T / 2 + .35, .01, 0); for (const sz of [-1, 1]) put(new THREE.BoxGeometry(.28, .32, .22), 'stone', XW + T / 2 + .2, .16, sz * .45);
  // the east gable fallen: a stump of it over the back corner, and its stones in a heap both sides of the end wall
  { let y = EAV - .25, z1 = -HD / 2 + 1.7; for (let k = 0; k < 4; k++) { const h = .2 + F() * .15; z1 -= .2 + F() * .25; put(new THREE.BoxGeometry(T, h, z1 + HD / 2), 'wall', XE, y + h / 2, (z1 - HD / 2) / 2, 0, 0, 0, .9); y += h; } }
  const rubble = []; for (let k = 0; k < 70; k++) { const side = k % 2 ? 1 : -1, d = Math.pow(F(), 1.4) * (side < 0 ? .8 : 1.6) /* inside, the heap keeps to the gable's end */, z = (F() - .5) * (HD - .6), x = XE + side * (T / 2 + .1 + d), gy = side < 0 ? 0 : ground(x, z), s = .13 + F() * .1, h = Math.max(0, .55 - d * .4) * F();
    const st = new THREE.IcosahedronGeometry(s, 0); st.scale(1.3, .7, 1); put(st, 'wall', x, gy + h + s * .45, z, F() * .4, F() * 3, F() * .4, .9); rubble.push([x, z]); }
  // the roof fallen in: two rafters slid down with their heads on the wall-heads, the ridge pole on the floor, the rotted thatch in heaps
  const RAD = .07, rafters = [];
  for (const [fx, fz, hx, hz] of [[-.5, .95, -.9, ZB], [.45, -.75, -.25, ZF]]) { const hy = topAt('x', hz, hx) + RAD, a = [fx, RAD - .02, fz], b = [hx, hy, hz], d = new THREE.Vector3(b[0] - a[0], b[1] - a[1], b[2] - a[2]).normalize();
    rod('timber', a, [b[0] + d.x * .25, b[1] + d.y * .25, b[2] + d.z * .25], RAD, 7); rafters.push({ a, b: b.map(v => +v.toFixed(4)), rad: RAD }); }
  const ridgePole = { a: [-1.5, .04, .4], b: [1.2, .04, -.4], rad: .06 } /* clear of the hearth and the fallen gable's heap */; rod('timber', ridgePole.a, ridgePole.b, .06, 7);
  for (let k = 0; k < 7; k++) { const x = -2 + F() * 4, z = -1.2 + F() * 2.4, g = new THREE.SphereGeometry(.35 + F() * .25, 8, 4, 0, 6.283, 0, Math.PI / 2); g.scale(1.4, .35, 1); put(g, 'rot', x, -.01, z, 0, F() * 3); }
  // nettles in the hut's corners and at the door
  const nettle = (x, z, gy) => { for (let k = 0; k < 5; k++) { const h = .35 + F() * .35, dx = (F() - .5) * .4, dz = (F() - .5) * .4; put(new THREE.BoxGeometry(.012, h, .012), 'nettle', x + dx, gy + h / 2, z + dz);
    for (let j = 1; j <= 3; j++) put(new THREE.IcosahedronGeometry(.06, 0).scale(1.2, .35, 1.2), 'nettle', x + dx, gy + h * j / 3.3, z + dz, 0, F() * 3); } };
  for (const [x, z] of [[XE - .7, ZF - .6], [XE - .6, ZB + .7], [-1.2, ZB + .6], [XW + .8, ZF - .5]]) nettle(x, z, 0);
  for (const [x, z] of [[DX - .9, HD / 2 + .5], [DX + .9, HD / 2 + .45]]) nettle(x, z, ground(x, z));
  // the rowan by the door: a leaning trunk, its limbs, leaf in clusters and the berries in red heads
  const RW = [DX + 2.2, HD / 2 + 1.6]; { const gy = ground(...RW), top = [RW[0] + .3, gy + 2.4, RW[1] + .15]; rod('bark', [RW[0], gy - .1, RW[1]], top, .1, 8);
    for (let k = 0; k < 6; k++) { const a = k * 1.05 + F() * .4, L = 1.0 + F() * .7, e = [top[0] + Math.cos(a) * L, top[1] + .5 + F() * .9, top[2] + Math.sin(a) * L]; rod('bark', [top[0], top[1] - .3 + k * .08, top[2]], e, .045, 6);
      for (let j = 0; j < 4; j++) { const p = [e[0] + (F() - .5) * .9, e[1] + (F() - .3) * .6, e[2] + (F() - .5) * .9]; put(new THREE.IcosahedronGeometry(.32 + F() * .18, 1).scale(1.2, .7, 1.2), 'leaf', ...p, 0, F() * 3);
        if (F() < .7) for (let b = 0; b < 3; b++) put(new THREE.IcosahedronGeometry(.07, 0), 'berry', p[0] + (F() - .5) * .5, p[1] - .2 - F() * .1, p[2] + (F() - .5) * .5); } } }
  // the fold: a round pen of dry stone, coped with stones on edge; the gate toward the hut between two posts, a breach tumbled downhill
  const GW = 1.3, BW = 1.7, aB = aG + Math.PI * .85, half = GW / 2 / (FR - FT / 2), NS = 56, foldSegs = [];
  for (let s = 0; s < NS; s++) { const a0 = aG + half + (Math.PI * 2 - 2 * half) * s / NS, a1 = aG + half + (Math.PI * 2 - 2 * half) * (s + 1) / NS, a = (a0 + a1) / 2, cx = FC[0] + FR * Math.cos(a), cz = FC[1] + FR * Math.sin(a);
    const L = 2 * (FR + FT / 2) * Math.sin((a1 - a0) / 2) + .02, gi = ground(FC[0] + (FR - FT / 2) * Math.cos(a), FC[1] + (FR - FT / 2) * Math.sin(a)), go = ground(FC[0] + (FR + FT / 2) * Math.cos(a), FC[1] + (FR + FT / 2) * Math.sin(a));
    const db = Math.abs(Math.atan2(Math.sin(a - aB), Math.cos(a - aB))) * FR, broke = db < BW / 2 + .25, base = Math.min(gi, go) - .2, top = gi + (broke ? .3 + F() * .2 + Math.max(0, db - BW / 2) * 1.5 : FH - .28 + (F() - .5) * .06) /* the body to 1.07, the coping on edge brings it to 1.35 */;
    put(new THREE.BoxGeometry(L, top - base, FT), 'wall', cx, (top + base) / 2, cz, 0, -a - Math.PI / 2, 0, .9); foldSegs.push({ a: +a.toFixed(4), top: +(top - gi).toFixed(3), broke });
    if (!broke) for (let c = 0, nc = Math.ceil(L / .2); c < nc; c++) if (F() > .08) { const ac = a0 + (a1 - a0) * (c + .5) / nc; put(new THREE.BoxGeometry(.15 + F() * .04, .26 + F() * .08, FT - .08), 'wall', FC[0] + FR * Math.cos(ac), top + .14, FC[1] + FR * Math.sin(ac), 0, -ac - Math.PI / 2, (F() - .5) * .25, .9); }
    else for (let c = 0; c < 6; c++) { const d = .5 + F() * 1.6, ac = a + (F() - .5) * (a1 - a0) * 2, x = FC[0] + (FR + d) * Math.cos(ac), z = FC[1] + (FR + d) * Math.sin(ac), sz = .14 + F() * .08; put(new THREE.IcosahedronGeometry(sz, 0).scale(1.3, .7, 1), 'wall', x, ground(x, z) + sz * .4, z, 0, F() * 3); } }
  for (const sg of [-1, 1]) { const a = aG + sg * (half + .05), x = FC[0] + FR * Math.cos(a), z = FC[1] + FR * Math.sin(a); put(new THREE.BoxGeometry(.3, 1.9, .5), 'stone', x, ground(x, z) + .7, z, 0, -a - Math.PI / 2); }
  // the hurdle that closed the gate, a wattle of rods on six sails, lying against the wall's outside beside it
  { const a = aG + half + .35, x = FC[0] + (FR + FT / 2 + .35) * Math.cos(a), z = FC[1] + (FR + FT / 2 + .35) * Math.sin(a), gy = ground(x, z), ry = -a - Math.PI / 2, tilt = -.32;
    const hg = []; for (let k = 0; k < 6; k++) hg.push(new THREE.CylinderGeometry(.025, .025, 1.15, 5).translate(-.7 + k * .28, .5, 0)); for (let k = 0; k < 7; k++) hg.push(new THREE.BoxGeometry(1.5, .07, .05).translate(0, .2 + k * .12, (k % 2 - .5) * .03));
    put(mergeGeometries(hg.map(g => g.toNonIndexed())), 'wattle', x, gy - .05, z, tilt, ry, 0); }
  // the spring above the hut: a kerb of stones, a lined well, the water 0.35 m down, a slab hood on its uphill side
  const sg = hill(...SP), lip = sg + .12, WAT = sg - .35;
  for (let k = 0; k < 14; k++) { const a = k / 14 * 6.283, st = new THREE.BoxGeometry(.3, .26, .24); const x = SP[0] + .66 * Math.cos(a), z = SP[1] + .66 * Math.sin(a); put(st, 'stone', x, hill(x, z) + .02, z, 0, -a, 0); }
  put(new THREE.CylinderGeometry(.52, .52, .9, 14, 1, true), 'lining', SP[0], sg - .4, SP[1]); put(new THREE.CircleGeometry(.5, 14).rotateX(-Math.PI / 2), 'water', SP[0], WAT, SP[1]);
  for (const sx of [-1, 1]) put(new THREE.BoxGeometry(.14, .7, .7), 'slab', SP[0] + sx * .5, sg + .3, SP[1] - .55); put(new THREE.BoxGeometry(1.25, .12, .85), 'slab', SP[0], sg + .71, SP[1] - .5); put(new THREE.BoxGeometry(1.1, .7, .14), 'slab', SP[0], sg + .3, SP[1] - .9);
  // bracken on the hill gone rust, and foxglove gone to seed, off the track, the stance, the fold and the spring
  const clear = (x, z) => trackD(x, z) < 1 || stance(x, z) > .05 || Math.hypot(x - FC[0], z - FC[1]) < FR + 1.3 || Math.hypot(x - SP[0], z - SP[1]) < 1.6 || Math.hypot(x - RW[0], z - RW[1]) < 1.2 || rubble.some(([a, b]) => Math.abs(a - x) < .5 && Math.abs(b - z) < .5);
  for (let k = 0, n = 0; k < 2000 && n < 90; k++) { const x = -26 + F() * 52, z = -24 + F() * 44; if (clear(x, z)) continue; n++; const gy = ground(x, z), a0 = F() * 6.283;
    for (let j = 0; j < 7; j++) { const a = a0 + j * .9 + (F() - .5) * .4, L = .45 + F() * .3, rise = .7 + F() * .2, pos = []; let px = 0, py = 0, pa = rise;
      const ring = []; for (let s = 0; s <= 3; s++) { ring.push([px, py, .11 * (1 - s / 3.4)]); px += Math.cos(pa) * L / 3; py += Math.sin(pa) * L / 3; pa -= .55; }
      for (let s = 0; s < 3; s++) { const [x0, y0, w0] = ring[s], [x1, y1, w1] = ring[s + 1]; pos.push(x0, y0, -w0, x1, y1, -w1, x0, y0, w0, x0, y0, w0, x1, y1, -w1, x1, y1, w1); }
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.computeVertexNormals(); put(g, 'bracken', x, gy - .02, z, 0, a, 0); } }
  for (let k = 0, n = 0; k < 900 && n < 30; k++) { const x = -18 + F() * 36, z = -14 + F() * 28; if (clear(x, z)) continue; n++; const gy = ground(x, z), h = .7 + F() * .5; put(new THREE.BoxGeometry(.018, h, .018), 'stalk', x, gy + h / 2, z);
    for (let j = 0; j < 5; j++) put(new THREE.ConeGeometry(.035, .07, 5), 'glove', x + (F() - .5) * .05, gy + h * (.62 + j * .07), z + (F() - .5) * .05, Math.PI, 0, 0); }
  const group = new THREE.Group(); let tris = 0; for (const [k, gs] of B) { const g = mergeGeometries(gs, false); gs.forEach(x => x.dispose()); const m = new THREE.Mesh(g, M[k]); m.name = k; m.castShadow = !['turf', 'track', 'earth', 'water'].includes(k); m.receiveShadow = k !== 'water'; group.add(m); tris += g.attributes.position.count / 3; }
  return { group, tris: Math.round(tris), draws: group.children.length, own: group.children.length, ground, hill, rafters, ridgePole,
    hut: { x: 0, z: 0, y: 0, w: HW, d: HD, wall: T, eaves: EAV, ridge: APEX, door: { x: DX, z: HD / 2, w: DW, h: DH }, win: { x: WX, sill: SILL, w: WWd, h: WHt }, gableW: XW, gableE: XE, tops },
    fold: { x: FC[0], z: FC[1], r: FR, wall: FT, h: FH, gate: { a: +aG.toFixed(4), w: GW }, breach: { a: +aB.toFixed(4), w: BW }, segs: foldSegs }, spring: { x: SP[0], z: SP[1], water: +WAT.toFixed(3), lip: +lip.toFixed(3), ground: +sg.toFixed(3) }, rowan: { x: RW[0], z: RW[1] }, track: TR };
}
// markHuntingCabin(o, r) (Session 998, card F8; OG-124's Mark panel, "a smoking hunting cabin in snow pines"; o.interior, Session 1199: no leaf in
// the door and the window glazed, for rooms.js's markCabin to furnish): a hunter's winter cabin in a
// clearing of spruce, after the Norwegian jakthytte and the fäbod's laft: logs notched over each other at the corners and running on past
// them, a sill on corner stones, a low turf roof under snow with the crossed barge boards at the gables, a stone chimney smoking. Lived in:
// the window lit, the door shut. At true size, a metre a unit, y 0 the snow at the cabin, the door's gable to +z:
//   - the cabin: log centres 3.8 m by 4.6 m, eleven courses to the eaves at 2.48 m, the gables in shortening logs to a ridge at 3.6 m;
//     a door 0.85 by 1.85 m under a lintel log, a lit window of 0.6 by 0.45 m in the east wall, antlers on the gable over the door;
//   - the roof: boards, turf and 0.25 m of snow, out 0.75 m over the side walls and 1.0 m over the door, 0.5 m at the back;
//   - the stabbur: a small log store on four posts with flat rat stones on them, its steps stopped short of its door so nothing climbs in;
//   - the yard: split wood stacked under the west eaves, a chopping block with the axe in it, a stretched hide on its frame, snowshoes by the
//     door, the snow trodden down along the paths to the wood, the store and away into the trees;
//   - the forest: spruce from 11 m out, snow on every tier.
// -> { group, tris, draws, own, ground, cabin { x0, x1, z0, z1, eaves, ridge, R, step, logs, door { x, z, w, h }, win { x, z, w, h, sill } },
//      roof { x0, x1, z0, z1, snow }, chimney { x, z, top }, smoke ([x, y, z]), store { x, z, w, d, floor, steps { gap } }, pile [{ x, z, y }], trees [{ x, z, h }], paths }
export function markHuntingCabin(o = {}, r = stream('cabin')) {
  const std = (c, ro = .9, x = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: ro, ...x }); markTextures();
  const M = { snow: mat('plaster', { ns: .3, color: 0xf2f6fa, rough: .95 }), trod: mat('plaster', { ns: .6, color: 0xc4ccd8, rough: .9 }), log: mat('beam', { ns: 1.2, color: 0xa88866, rough: .9 }),
    end: std(0x9c7c5a, .9), board: mat('wood', { ns: .9, color: 0x6a5440, rough: .9 }), door: mat('wood', { ns: 1.0, color: 0x4a3a2a, rough: .8 }), turf: mat('turfDry', { ns: 1.2, color: 0x8a7a5a, rough: 1 }),
    stone: mat('stone', { ns: 1.3, color: 0xb8b4ac, rough: .95 }), rock: mat('rock', { ns: 1.0, color: 0x8a8680, rough: 1 }), glow: std(0x2a1a08, .4, { emissive: new THREE.Color(1, .62, .3), emissiveIntensity: 1.4 }),
    bark: std(0x4a3a30, .95), needle: std(0x2a3a2a, .9), wood: std(0xd2b48a, .85), antler: std(0xd8ccb4, .7), iron: std(0x2a2826, .5, { metalness: .6 }), hide: std(0x6e5038, .95, { side: THREE.DoubleSide }), gut: std(0x6a5038, .9),
    pane: std(0xc8d4dc, .05, { transparent: true, opacity: .14, depthWrite: false }) };
  const B = new Map(), key = String(o.key || 'cabin'), F = stream(key + ':lie'), ph = Array.from({ length: 8 }, () => F() * 6.283);
  const put = (geo, k, x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0, uv = .5) => { const g = geo.index ? geo.toNonIndexed() : geo; for (const a of Object.keys(g.attributes)) if (!['position', 'normal'].includes(a)) g.deleteAttribute(a);
    if (!g.attributes.normal) g.computeVertexNormals(); g.applyMatrix4(new THREE.Matrix4().compose(new THREE.Vector3(x, y, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(rx, ry, rz, 'YXZ')), new THREE.Vector3(1, 1, 1))); worldUV(g, uv);
    if (!B.has(k)) B.set(k, []); B.get(k).push(g); return g; };
  const rod = (k, a, b, rad, seg = 6) => { const A = new THREE.Vector3(...a), C = new THREE.Vector3(...b), d = C.clone().sub(A), g = new THREE.CylinderGeometry(rad, rad, d.length(), seg);
    g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.clone().normalize())); g.translate((A.x + C.x) / 2, (A.y + C.y) / 2, (A.z + C.z) / 2); return put(g, k); };
  const sm = t => { t = Math.min(1, Math.max(0, t)); return t * t * (3 - 2 * t); };
  // the cabin's numbers: side walls along z at x ±XW, gables along x at z ±ZW; the logs R in radius, each wall's courses STEP apart, the two walls half a step out of phase
  const XW = 1.9, ZW = 2.3, R = .13, STEP = .21, OUT = .3, Y0 = .25, NC = 11, EAV = +(Y0 + R + (NC - 1) * STEP).toFixed(3), PITCH = .47, RIDGE = +(EAV + R + XW * Math.tan(PITCH)).toFixed(3);
  const DW = .85, DH = 1.85, WZ = -.6, WW = .6, WH = .45, WS = 1.05, SX = 5.6, SZ = -3.6, SW = 2.0, SD = 1.8, SF = 1.05;
  // the paths, trodden: to the woodpile, to the store's steps, and away into the trees
  const PATHS = [[[0, ZW + .5], [-.8, ZW + 1.6], [-3.1, 2.4], [-3.2, -.2]], [[0, ZW + .5], [2.2, 3.4], [4.6, 1.2], [SX, SZ + SD / 2 + 1.3]], [[0, ZW + .5], [1.4, 6.5], [.6, 12], [-1.5, 20], [-4, 34]]];
  const segD = (x, z, a, b) => { const dx = b[0] - a[0], dz = b[1] - a[1], t = Math.max(0, Math.min(1, ((x - a[0]) * dx + (z - a[1]) * dz) / (dx * dx + dz * dz))); return Math.hypot(x - a[0] - dx * t, z - a[1] - dz * t); };
  const pathD = (x, z) => Math.min(...PATHS.flatMap(P => P.slice(0, -1).map((p, i) => segD(x, z, p, P[i + 1]))));
  const drift = (x, z) => .12 * Math.sin(x * .31 + ph[0]) * Math.sin(z * .27 + ph[1]) + .06 * Math.sin(x * .9 + z * .7 + ph[2]) + .5 * sm((Math.hypot(x, z) - 12) / 20) * (.6 + .4 * Math.sin(Math.atan2(z, x) * 3 + ph[3]));
  const stance = (x, z) => Math.max(sm(1 - Math.max(Math.abs(x) - XW - 1.2, Math.abs(z) - ZW - 1.2, 0) / 2), sm(1 - Math.max(Math.abs(x - SX) - SW / 2 - .8, Math.abs(z - SZ) - SD / 2 - .8, 0) / 1.5));
  const ground = (x, z) => drift(x, z) * (1 - stance(x, z));
  { const steps = (bands, end) => { const v = []; for (const [a, b, st] of bands) for (let q = a; q < b - 1e-6; q += st) v.push(+q.toFixed(2)); v.push(end); return v; };
    const xs = steps([[-80, -30, 10], [-30, -10, 2], [-10, 10, .5], [10, 30, 2], [30, 80, 10]], 80), zs = steps([[-80, -30, 10], [-30, -10, 2], [-10, 10, .5], [10, 36, 2], [36, 80, 11]], 80);
    const NX = xs.length, pos = []; for (const z of zs) for (const x of xs) pos.push(x, ground(x, z), z); const idx = [];
    for (let j = 0; j < zs.length - 1; j++) for (let i = 0; i < NX - 1; i++) { const a = j * NX + i, b = a + 1, c = a + NX, d = c + 1; idx.push(a, c, b, b, c, d); }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals(); put(g.toNonIndexed(), 'snow', 0, 0, 0, 0, 0, 0, .3); }
  // the paths' trodden snow: ribbons five vertices across laid 2 cm over the snow, and the snow thrown up beside them in two banks 0.12 m high
  for (const P of PATHS) { const pts = []; for (let i = 0; i < P.length - 1; i++) { const [a, b] = [P[i], P[i + 1]], L = Math.hypot(b[0] - a[0], b[1] - a[1]), n = Math.ceil(L / .3); for (let k = i ? 1 : 0; k <= n; k++) pts.push([a[0] + (b[0] - a[0]) * k / n, a[1] + (b[1] - a[1]) * k / n]); }
    const pos = [], idx = [], bank = [[], []]; pts.forEach(([x, z], i) => { const [p, q] = [pts[Math.max(0, i - 1)], pts[Math.min(pts.length - 1, i + 1)]], dx = q[0] - p[0], dz = q[1] - p[1], l = Math.hypot(dx, dz), w = .32 + .05 * Math.sin(i * .9 + ph[4]);
      for (const sd of [-1, -.5, 0, .5, 1]) { const ex = x - dz / l * w * sd, ez = z + dx / l * w * sd; pos.push(ex, ground(ex, ez) + .02, ez); } if (i) { const o2 = (i - 1) * 5; for (let c = 0; c < 4; c++) idx.push(o2 + c, o2 + c + 5, o2 + c + 1, o2 + c + 1, o2 + c + 5, o2 + c + 6); }
      for (const sd of [-1, 1]) for (const [off, up] of [[0, .02], [.06, .13], [.18, .13], [.38, -.02]]) { const ex = x - dz / l * (w + off) * sd, ez = z + dx / l * (w + off) * sd; bank[sd < 0 ? 0 : 1].push(ex, ground(ex, ez) + up, ez); } });
    const ribbon = (P2, idx2) => { const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(P2, 3)); g.setIndex(idx2); g.computeVertexNormals(); if (g.attributes.normal.array.reduce((t, v, j) => j % 3 === 1 ? t + v : t, 0) < 0) /* wound to face up, judged on all its normals */ { g.setIndex(idx2.map((v, j) => idx2[j - j % 3 + [0, 2, 1][j % 3]])); g.computeVertexNormals(); } return g; };
    put(ribbon(pos, idx), 'trod', 0, 0, 0, 0, 0, 0, .35);
    const i0 = pts.findIndex(([x, z]) => Math.hypot(x - P[0][0], z - P[0][1]) > 1.1) /* the banks start clear of the door, where the paths meet */;
    for (const bk of bank) { bk.splice(0, i0 * 12); const bi = []; for (let i = 1; i < pts.length - i0; i++) { const o2 = (i - 1) * 4; for (let c = 0; c < 3; c++) bi.push(o2 + c, o2 + c + 4, o2 + c + 1, o2 + c + 1, o2 + c + 4, o2 + c + 5); } const g = ribbon(bk, bi); put(g, 'snow', 0, 0, 0, 0, 0, 0, .3); }
    bank.length = 0; bank.push([], []); }
  // a log: along x or z between a0 and a1 at (c, y); its two ends showing the cut wood
  const logs = []; const log = (ax, a0, a1, c, y, rad = R, rec = true) => { const L = a1 - a0, m = (a0 + a1) / 2, g = new THREE.CylinderGeometry(rad, rad * 1.04, L, 9);
    if (ax === 'x') { g.rotateZ(Math.PI / 2); put(g, 'log', m, y, c, 0, 0, 0, .6); for (const e of [a0, a1]) put(new THREE.CircleGeometry(rad * .96, 9).rotateY(e < m ? -Math.PI / 2 : Math.PI / 2), 'end', e + (e < m ? -.002 : .002), y, c); }
    else { g.rotateX(Math.PI / 2); put(g, 'log', c, y, m, 0, 0, 0, .6); for (const e of [a0, a1]) put(new THREE.CircleGeometry(rad * .96, 9).rotateY(e < m ? Math.PI : 0), 'end', c, y, e + (e < m ? -.002 : .002)); }
    if (rec) logs.push({ ax, a0: +a0.toFixed(3), a1: +a1.toFixed(3), c, y: +y.toFixed(3) }); };
  // the side walls: eleven courses, the window cut out of the east one; the gables: ten courses half a step up, the door cut out of the front
  for (let k = 0; k < NC; k++) { const y = Y0 + R + k * STEP; log('z', -ZW - OUT, ZW + OUT, -XW, y);
    if (y > WS && y < WS + WH + R) { log('z', -ZW - OUT, WZ - WW / 2, XW, y); log('z', WZ + WW / 2, ZW + OUT, XW, y); } else log('z', -ZW - OUT, ZW + OUT, XW, y); }
  for (let k = 0; k < NC - 1; k++) { const y = Y0 + R + STEP / 2 + k * STEP; log('x', -XW - OUT, XW + OUT, -ZW, y);
    if (y < Y0 + DH + R) { log('x', -XW - OUT, -DW / 2, ZW, y); log('x', DW / 2, XW + OUT, ZW, y); } else log('x', -XW - OUT, XW + OUT, ZW, y); }
  // the gables above the eaves: logs shortening to the ridge, under the roof's line
  for (let y = Y0 + R + STEP / 2 + (NC - 1) * STEP; y < RIDGE - .2; y += STEP) { const hl = (RIDGE - R - y) / Math.tan(PITCH); if (hl < .25) break; for (const z of [-ZW, ZW]) log('x', -hl, hl, z, y); }
  // the corner stones and the sill's middle stones; the floor; the door: its frame posts, the leaf of boards, the lintel; the window's frame and its light
  for (const x of [-XW, XW]) for (const z of [-ZW, 0, ZW]) put(new THREE.BoxGeometry(.5, Y0 + .1, .5), 'stone', x, (Y0 + .1) / 2 - .1, z, 0, F() * .3);
  for (const x of [-XW, 0, XW]) if (x) put(new THREE.BoxGeometry(.5, Y0 + .1, .5), 'stone', x, (Y0 + .1) / 2 - .1, -ZW, 0, F() * .3);
  put(new THREE.BoxGeometry(2 * XW - (o.interior ? 0 : .26), .05, 2 * ZW - (o.interior ? 0 : .26)), 'board', 0, Y0 + .05, 0) /* run under the bottom logs when the room is built, so no snow shows at the walls' foot */;
  for (const sx of [-1, 1]) put(new THREE.BoxGeometry(.1, DH + .1, .26), 'board', sx * (DW / 2 + .05), Y0 + (DH + .1) / 2, ZW);
  /* o.interior (Session 1199, rooms.js's markCabin): the room hangs its own leaf, open */ if (!o.interior) { put(new THREE.BoxGeometry(DW, DH, .05), 'door', 0, Y0 + DH / 2, ZW - .06); put(new THREE.BoxGeometry(.04, .04, .1), 'iron', DW / 2 - .12, Y0 + 1.0, ZW + .01); }
  { const wy = WS + WH / 2 + R / 2; for (const s2 of [-1, 1]) { put(new THREE.BoxGeometry(.26, .06, WW + .16), 'board', XW, wy + s2 * (WH / 2 + .03), WZ); put(new THREE.BoxGeometry(.26, WH, .06), 'board', XW, wy, WZ + s2 * (WW / 2 + .03)); }
    put(new THREE.BoxGeometry(.03, WH, WW), o.interior ? 'pane' : 'glow', XW - .02, wy, WZ) /* glazed and clear from inside when the room is built */; put(new THREE.BoxGeometry(.04, .03, WW), 'board', XW - .01, wy, WZ) /* the light, its glazing bar */; }
  // antlers on the front gable, over the door
  { const ay = Y0 + DH + .9, az = ZW + R + .02; put(new THREE.BoxGeometry(.22, .14, .06), 'antler', 0, ay, az); for (const s of [-1, 1]) { const b = [s * .5, ay + .45, az + .15]; rod('antler', [s * .05, ay, az + .02], b, .025, 5);
    for (let t = 0; t < 3; t++) { const f = .3 + t * .25, p = [s * .05 + s * .45 * f, ay + .45 * f, az + .02 + .13 * f]; rod('antler', p, [p[0] + s * .05, p[1] + .22, p[2] + .08], .018, 5); } } }
  // the roof: two slopes of boards, turf and snow; out OS at the sides, OF over the door, OB at the back; the crossed barge boards at each gable
  const OS = .75, OF = 1.0, OB = .5, RL = 2 * ZW + OF + OB, RZ = (OF - OB) / 2, run = XW + OS, slope = run / Math.cos(PITCH), BOARD = .05, TURF = .12, SNOW = .25;
  for (const s of [-1, 1]) { const cx = s * run / 2, cyb = RIDGE - run / 2 * Math.tan(PITCH), n = new THREE.Vector3(s * Math.sin(PITCH), Math.cos(PITCH), 0);
    for (const [k, th, off] of [['board', BOARD, BOARD / 2], ['turf', TURF, BOARD + TURF / 2], ['snow', SNOW, BOARD + TURF + SNOW / 2]]) { const g = k === 'snow' ? new RoundedBoxGeometry(slope + .04, th, RL + .02, 2, .08) : new THREE.BoxGeometry(slope, th, RL);
      put(g, k, cx + n.x * off, cyb + n.y * off, RZ, 0, 0, -s * PITCH, .5); } }
  for (const z of [ZW + OF, -ZW - OB]) for (const s of [-1, 1]) { const L = slope + .5, cx = s * (run / 2 - .25 * Math.cos(PITCH)), cy = RIDGE - (run / 2 - .25 * Math.cos(PITCH)) * Math.tan(PITCH) + .1;
    put(new THREE.BoxGeometry(L, .24, .04), 'board', cx, cy, z + (z > 0 ? .02 : -.02), 0, 0, -s * PITCH); }
  const roof = { x0: -run, x1: run, z0: -ZW - OB, z1: ZW + OF, snow: SNOW, turf: TURF, board: BOARD, pitch: PITCH };
  // the chimney: dry stone from the floor up through the west slope, its cap, and the smoke going up and away downwind
  const CX = -.85, CZ = -1.3, CW = .62, roofAt = x => RIDGE - Math.abs(x) * Math.tan(PITCH) + (BOARD + TURF + SNOW) / Math.cos(PITCH), CTOP = +(roofAt(CX - CW / 2) + 1.0).toFixed(3);
  put(new THREE.BoxGeometry(CW, CTOP - Y0, CW), 'stone', CX, (CTOP + Y0) / 2, CZ, 0, 0, 0, .8); put(new THREE.BoxGeometry(CW + .12, .08, CW + .12), 'rock', CX, CTOP + .04, CZ);
  put(new THREE.BoxGeometry(CW + .1, .3, CW + .1).translate(0, 0, 0), 'snow', CX, roofAt(CX) - .05, CZ) /* the snow banked round the stack */;
  const smoke = []; for (let k = 0; k < 9; k++) { const t = k / 8; smoke.push([+(CX + 1.6 * t * t + (F() - .5) * .15).toFixed(3), +(CTOP + .35 + t * 3.4).toFixed(3), +(CZ - .9 * t * t).toFixed(3), +(.45 + t * 1.3).toFixed(2), +(.55 * (1 - t * .7)).toFixed(2)]); }
  // the stabbur: four posts, a flat rat stone on each, a log box on its own sill, a turf roof under snow; its steps stopped short of the door
  { for (const sx of [-1, 1]) for (const sz of [-1, 1]) { const x = SX + sx * (SW / 2 - .2), z = SZ + sz * (SD / 2 - .2); put(new THREE.CylinderGeometry(.13, .15, SF - .12, 8), 'log', x, (SF - .12) / 2 - .05, z); put(new THREE.CylinderGeometry(.3, .32, .1, 9), 'rock', x, SF - .07, z); }
    const sr = .11, sst = .18; for (let k = 0; k < 9; k++) { const y = SF + sr + k * sst; log('z', SZ - SD / 2 - .2, SZ + SD / 2 + .2, SX - SW / 2 + sr, y, sr, false); log('z', SZ - SD / 2 - .2, SZ + SD / 2 + .2, SX + SW / 2 - sr, y, sr, false);
      if (k < 8) { const yy = y + sst / 2; log('x', SX - SW / 2 - .2, SX + SW / 2 + .2, SZ - SD / 2 + sr, yy, sr, false); if (yy > SF + 1.25) log('x', SX - SW / 2 - .2, SX + SW / 2 + .2, SZ + SD / 2 - sr, yy, sr, false); else { log('x', SX - SW / 2 - .2, SX - .35, SZ + SD / 2 - sr, yy, sr, false); log('x', SX + .35, SX + SW / 2 + .2, SZ + SD / 2 - sr, yy, sr, false); } } }
    put(new THREE.BoxGeometry(.7, 1.2, .05), 'door', SX, SF + .62, SZ + SD / 2 - sr - .02); put(new THREE.BoxGeometry(SW - .1, .06, SD - .1), 'board', SX, SF + .03, SZ);
    const top = SF + sr + 8 * sst + sr, sp = .5, srun = SW / 2 + .45, sl = srun / Math.cos(sp), sridge = top + (SW / 2) * Math.tan(sp);
    for (const s of [-1, 1]) for (const [k, th, off] of [['board', .05, .025], ['turf', .1, .1], ['snow', .22, .26]]) { const n = [s * Math.sin(sp), Math.cos(sp)]; put(k === 'snow' ? new RoundedBoxGeometry(sl + .04, th, SD + 1.0, 2, .07) : new THREE.BoxGeometry(sl, th, SD + .9), k, SX + s * srun / 2 + n[0] * off, sridge - srun / 2 * Math.tan(sp) + n[1] * off, SZ, 0, 0, -s * sp, .5); }
    for (let y = top + .09; y < sridge - .15; y += sst) { const hl = (sridge - y) / Math.tan(sp) - .05; if (hl < .2) break; for (const z of [SZ - SD / 2 + sr, SZ + SD / 2 - sr]) log('x', SX - hl, SX + hl, z, y, sr, false); } }
  const STEPS_Z = SZ + SD / 2 + .2 + .22 /* the gap */; { for (let k = 0; k < 3; k++) { const h = (k + 1) * SF / 3.2, d = .3; put(new THREE.BoxGeometry(.8, h, d), 'stone', SX, h / 2 - .05, STEPS_Z + (2 - k) * d + d / 2); } }
  const store = { x: SX, z: SZ, w: SW, d: SD, floor: SF, steps: { z: +STEPS_Z.toFixed(3), top: +(3 * SF / 3.2 - .05).toFixed(3) } };
  // the woodpile under the west eaves: split rounds in two rows, ends out; a chopping block with the axe in it; a hide on its frame; snowshoes by the door
  const pile = []; for (const row of [0, 1]) for (let y = .1, lay = 0; y < 1.3; y += .17, lay++) for (let z = -ZW + .3 + (lay % 2) * .08; z < ZW - .5; z += .19) { const x = -XW - R - .18 - row * .27, rr = .075 + F() * .025, g = new THREE.CylinderGeometry(rr, rr, .44, 4 + (F() < .5 ? 1 : 0));
    g.rotateZ(Math.PI / 2); g.rotateX(F() * 6.283); g.rotateY((F() - .5) * .08); put(g, 'wood', x, y, z, 0, 0, 0, .4); pile.push({ x: +x.toFixed(3), z: +z.toFixed(3), y: +(y + .09).toFixed(3) }); }
  { const bx = -3.6, bz = 3.0, gy = ground(bx, bz); put(new THREE.CylinderGeometry(.3, .32, .5, 10), 'log', bx, gy + .2, bz); put(new THREE.CircleGeometry(.29, 10).rotateX(-Math.PI / 2), 'end', bx, gy + .451, bz);
    rod('wood', [bx + .05, gy + .48, bz], [bx + .55, gy + .82, bz + .1], .02, 6); put(new THREE.BoxGeometry(.04, .16, .12), 'iron', bx + .02, gy + .48, bz, 0, 0, .55); }
  { const hx = 3.9, hz = 3.1, gy = ground(hx, hz); for (const s of [-1, 1]) rod('log', [hx + s * .8, gy - .2, hz], [hx + s * .8, gy + 2.0, hz], .05, 6); rod('log', [hx - .95, gy + 1.9, hz], [hx + .95, gy + 1.9, hz], .045, 6); rod('log', [hx - .95, gy + .35, hz], [hx + .95, gy + .35, hz], .045, 6);
    const g = new THREE.PlaneGeometry(1.25, 1.35, 6, 6), P = g.attributes.position; for (let i = 0; i < P.count; i++) { const u = P.getX(i), v = P.getY(i); P.setX(i, u * (1 - .18 * Math.abs(v) / .7)); P.setZ(i, .03 * Math.sin(u * 5 + v * 4)); } g.computeVertexNormals(); put(g, 'hide', hx, gy + 1.12, hz);
    for (let k = 0; k < 8; k++) { const t = k / 7, y = gy + .45 + t * 1.35; rod('gut', [hx - .62 * (1 - .18 * Math.abs(t * 2 - 1)), y, hz], [hx - .8, y + .05, hz], .006, 3); rod('gut', [hx + .62 * (1 - .18 * Math.abs(t * 2 - 1)), y, hz], [hx + .8, y + .05, hz], .006, 3); } }
  for (const dx of [-.75, -.95]) { const g = new THREE.TorusGeometry(.2, .018, 5, 14); g.scale(1, 2.2, 1); put(g, 'log', dx, Y0 + .48, ZW + R + .14, -.22, 0, 0); for (let k = -2; k <= 2; k++) put(new THREE.BoxGeometry(.38, .008, .008), 'gut', dx, Y0 + .48 + k * .12, ZW + R + .14 + Math.sin(.22) * k * .12); }
  // the forest: spruce from 11 m out, avoiding the paths; a trunk and five tiers of needle, a cap of snow on each
  const trees = []; for (let k = 0, n = 0; k < 900 && n < 74; k++) { const a = F() * 6.283, d = 11 + Math.pow(F(), .8) * 38, x = Math.cos(a) * d, z = Math.sin(a) * d; if (pathD(x, z) < 2.2 || Math.hypot(x - SX, z - SZ) < 4 || trees.some(t => Math.hypot(t.x - x, t.z - z) < 2.6)) continue; n++;
    const h = 8 + F() * 9, gy = ground(x, z), w = h * (.22 + F() * .05); rod('bark', [x, gy - .3, z], [x, gy + h * .35, z], h * .016, 6);
    for (let t = 0; t < 7; t++) { const f = t / 7, y0 = gy + h * (.16 + f * .76), th = h * (.26 - f * .05), rw = w * (1 - f * .8) * (.9 + F() * .2); put(new THREE.ConeGeometry(rw, th, 8, 1, true), 'needle', x, y0 + th / 2, z, 0, F() * 3);
      if (F() < .8) put(new THREE.ConeGeometry(rw * .62, th * .36, 7, 1, true), 'snow', x + (F() - .5) * rw * .2, y0 + th * .7 + .02, z + (F() - .5) * rw * .2, 0, F() * 3); } trees.push({ x: +x.toFixed(2), z: +z.toFixed(2), h: +h.toFixed(2) }); }
  const group = new THREE.Group(); let tris = 0; for (const [k, gs] of B) { const g = mergeGeometries(gs, false); gs.forEach(x => x.dispose()); const m = new THREE.Mesh(g, M[k]); m.name = k; m.castShadow = !['trod', 'glow', 'pane'].includes(k); m.receiveShadow = true; group.add(m); tris += g.attributes.position.count / 3; }
  const own = group.children.length, pm = new THREE.SpriteMaterial({ map: puffTex(), color: 0xd8dce2, transparent: true, depthWrite: false, fog: true });
  for (const [x, y, z, s, op] of smoke) { const m = pm.clone(); m.opacity = op; const sp = new THREE.Sprite(m); sp.position.set(x, y, z); sp.scale.set(s, s, s); sp.name = 'smoke'; group.add(sp); }
  return { group, tris: Math.round(tris), draws: group.children.length, own, ground, drift, pathD,
    cabin: { x0: -XW, x1: XW, z0: -ZW, z1: ZW, eaves: EAV, ridge: RIDGE, R, step: STEP, y0: Y0, logs, door: { x: 0, z: ZW, w: DW, h: DH }, win: { x: XW, z: WZ, w: WW, h: WH, sill: WS } },
    roof, chimney: { x: CX, z: CZ, w: CW, top: CTOP }, smoke: smoke.map(s => s.slice(0, 3)), store, pile, trees, paths: PATHS };
}
// markLoggingCamp(o, r) (Session 999, card F8; OG-124's Mark panel, "an abandoned logging camp"): a winter felling on a slope above a frozen
// river, after the Norwegian and Swedish forest drives: the trees cut in winter, sledged to a deck, sent down a timber chute to the river's ice
// to go with the thaw. This one was left mid-season. At true size, a metre a unit, the slope falling to +z at about 1 in 4.5 to the river:
//   - the felling: 50 stumps cut flat at the height a man swings, snow on each, an axe left in one; spruce standing round it;
//   - the deck: two skids across the slope and 18 logs of 5 m stacked on them in four rows, each on the two below;
//   - the chute: a trough of two logs side by side on trestles, from the deck's foot 40 m down to the ice, at one grade; one length has
//     fallen from its trestle, which lies over, and lies in the snow beside the gap;
//   - the gapahuk: a lean-to of logs open to the south, its bed of spruce boughs, a cold fire ring before it with the last brands in it;
//   - a log sledge, its runners turned up at the front, a log still chained on its bunks.
// -> { group, tris, draws, own, ground, chute { x, z0, z1, y0, y1, grade, gap [z0, z1], trestles }, deck { logs [{ x0, x1, y, z, row }], R, skid },
//      stumps [{ x, z, h, r }], shelter { x, z, w, d, back, front }, sledge { x, z, runners [[x, z]] }, river { z0, z1, y }, trees }
export function markLoggingCamp(o = {}, r = stream('logging')) {
  const std = (c, ro = .9, x = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: ro, ...x }); markTextures();
  const M = { snow: mat('plaster', { ns: .3, color: 0xf2f6fa, rough: .95 }), ice: std(0xb8cad6, .15, { metalness: .1 }), log: mat('beam', { ns: 1.2, color: 0x9a7c5c, rough: .9 }), end: std(0xa88a66, .9),
    grey: mat('beam', { ns: 1.2, color: 0x8a8278, rough: .95 }), board: mat('wood', { ns: .9, color: 0x6a5a4a, rough: .9 }), stone: mat('rock', { ns: 1.0, color: 0x8a8680, rough: 1 }), char: std(0x1a1614, 1),
    bark: std(0x4a3a30, .95), needle: std(0x2a3a2a, .9), bough: std(0x36482e, .95), iron: std(0x2a2826, .5, { metalness: .6 }), wood: std(0xb89a72, .85) };
  const B = new Map(), key = String(o.key || 'logging'), F = stream(key + ':lie'), ph = Array.from({ length: 8 }, () => F() * 6.283);
  const put = (geo, k, x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0, uv = .5) => { const g = geo.index ? geo.toNonIndexed() : geo; for (const a of Object.keys(g.attributes)) if (!['position', 'normal'].includes(a)) g.deleteAttribute(a);
    if (!g.attributes.normal) g.computeVertexNormals(); g.applyMatrix4(new THREE.Matrix4().compose(new THREE.Vector3(x, y, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(rx, ry, rz, 'YXZ')), new THREE.Vector3(1, 1, 1))); worldUV(g, uv);
    if (!B.has(k)) B.set(k, []); B.get(k).push(g); return g; };
  const rod = (k, a, b, rad, seg = 7) => { const A = new THREE.Vector3(...a), C = new THREE.Vector3(...b), d = C.clone().sub(A), g = new THREE.CylinderGeometry(rad, rad, d.length(), seg);
    g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.clone().normalize())); g.translate((A.x + C.x) / 2, (A.y + C.y) / 2, (A.z + C.z) / 2); return put(g, k); };
  const sm = t => { t = Math.min(1, Math.max(0, t)); return t * t * (3 - 2 * t); };
  // the land: the slope at 1 in 4.5 down to the river's bank at z 26, the ice level from 28 to 40 at y RY, the far bank rising beyond
  const S = .22, RZ0 = 28, RZ1 = 40, RY = -6.3;
  const drift = (x, z) => .14 * Math.sin(x * .29 + ph[0]) * Math.sin(z * .31 + ph[1]) + .07 * Math.sin(x * .8 + z * .6 + ph[2]);
  const ground = (x, z) => { const slope = -S * Math.min(z, 26) - 2.5 * sm((z - 25) / 3); const far = 2.2 * sm((z - RZ1 - 1) / 6) + .5 * sm((z - RZ1 - 6) / 8) * (z - RZ1 - 6) * .3; return (z < RZ0 - .5 ? slope + drift(x, z) * sm((RZ0 - 1 - z) / 2) : z > RZ1 + .5 ? RY + .1 + far + drift(x, z) * sm((z - RZ1 - 1) / 2) : RY - .2); };
  { const steps = (bands, end) => { const v = []; for (const [a, b, st] of bands) for (let q = a; q < b - 1e-6; q += st) v.push(+q.toFixed(2)); v.push(end); return v; };
    const xs = steps([[-80, -30, 10], [-30, -20, 2], [-20, 16, .75], [16, 30, 2], [30, 80, 10]], 80), zs = steps([[-80, -30, 10], [-30, -18, 2], [-18, 29, .75], [29, 50, 2], [50, 80, 10]], 80);
    const NX = xs.length, pos = []; for (const z of zs) for (const x of xs) pos.push(x, ground(x, z), z); const idx = [];
    for (let j = 0; j < zs.length - 1; j++) for (let i = 0; i < NX - 1; i++) { const a = j * NX + i, b = a + 1, c = a + NX, d = c + 1; idx.push(a, c, b, b, c, d); }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals(); put(g.toNonIndexed(), 'snow', 0, 0, 0, 0, 0, 0, .3);
    const ice = new THREE.PlaneGeometry(160, RZ1 - RZ0 + 1); ice.rotateX(-Math.PI / 2); put(ice, 'ice', 0, RY, (RZ0 + RZ1) / 2); }
  // a log along an axis with its cut ends
  const log = (k, a, b, rad) => { rod(k, a, b, rad, 9); const d = new THREE.Vector3(b[0] - a[0], b[1] - a[1], b[2] - a[2]).normalize(), q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), d);
    for (const [p, s] of [[a, -1], [b, 1]]) { const c = new THREE.CircleGeometry(rad * .97, 9); c.applyQuaternion(q); const n = d.clone().multiplyScalar(s * .002); c.translate(p[0] + n.x, p[1] + n.y, p[2] + n.z); put(s < 0 ? flip(c) : c, 'end'); } } /* the far end's disc faces along the log, the near end's is turned back */;
  const flip = g => { g = g.index ? g.toNonIndexed() : g; const P = g.attributes.position.array; for (let i = 0; i < P.length; i += 9) for (let j = 0; j < 3; j++) { const t = P[i + 3 + j]; P[i + 3 + j] = P[i + 6 + j]; P[i + 6 + j] = t; } g.deleteAttribute('normal'); g.computeVertexNormals(); return g; };
  // the chute: its line from the deck's foot to over the ice, at one grade; two logs side by side in lengths of 5 m on trestles every 2.5 m
  const CX = -6, CZ0 = -11, CZ1 = 31, CY0 = ground(CX, CZ0) + .45, CY1 = RY + .9, grade = (CY0 - CY1) / (CZ1 - CZ0), cy = z => CY0 - grade * (z - CZ0), CR = .15, CS = .13;
  const GAP = [14, 19] /* one 5 m length, from a joint to a joint */, trestles = [];
  for (let z = CZ0; z < CZ1 - .01; z += 5) { const z1 = Math.min(z + 5, CZ1); if (z >= GAP[0] && z < GAP[1]) continue; for (const s of [-1, 1]) log('grey', [CX + s * CS, cy(z) + CR, z], [CX + s * CS, cy(z1) + CR, z1], CR); }
  for (let z = CZ0 + 1.25; z < CZ1; z += 2.5) { const gy = Math.min(ground(CX - .7, z), ground(CX + .7, z)), top = cy(z), fallen = z > GAP[0] && z < GAP[1];
    if (fallen) { for (const s of [-1, 1]) rod('grey', [CX + s * .6, ground(CX + s * .6, z) + .1, z], [CX + s * .3 + 1.1, ground(CX + 1.4, z) + .12, z + .5 * s], .08); continue; }
    const legBot = gy - .25; for (const s of [-1, 1]) rod('grey', [CX + s * .7, legBot, z], [CX + s * .32, top - .02, z], .07); rod('grey', [CX - .45, top - .08, z], [CX + .45, top - .08, z], .08);
    if (top - gy > 1.0) rod('grey', [CX - .62, gy + .35, z], [CX + .62, gy + .35, z], .05); trestles.push({ z: +z.toFixed(2), top: +top.toFixed(3) }); }
  // the fallen length: off its trestles and down in the snow beside the gap, askew
  { const a = [CX + 1.7, 0, GAP[0] + .4], b = [CX + 2.6, 0, GAP[1] - .2]; a[1] = ground(a[0], a[2]) + CR - .04; b[1] = ground(b[0], b[2]) + CR - .04; log('grey', a, b, CR); const a2 = [a[0] + .5, ground(a[0] + .5, a[2] + .3) + CR - .04, a[2] + .3], b2 = [b[0] + .2, ground(b[0] + .2, b[2] + .4) + CR - .04, b[2] + .4]; log('grey', a2, b2, CR); }
  // the deck: two skids across the slope, the logs on them in rows of 6, 5, 4, 3, each on the two below
  const DX = 6, DZ = -9, LR = .17, LL = 5, deck = [], sk = [];
  { const gy = Math.max(ground(DX - 2.5, DZ - 1), ground(DX + 2.5, DZ - 1), ground(DX - 2.5, DZ + 1), ground(DX + 2.5, DZ + 1)); const skY = gy + .05;
    const skH = Math.max(...[-1.6, 1.6].flatMap(sx => [ground(DX + sx, DZ - 1.6), ground(DX + sx, DZ + 1.6)])) + .12 /* both skids levelled to the highest ground under them */;
    for (const sx of [-1.6, 1.6]) { log('log', [DX + sx, skH, DZ - 1.6], [DX + sx, skH, DZ + 1.6], .14); sk.push(skH + .14); }
    const base = Math.max(...sk) + LR; for (let row = 0, n = 6; n >= 3; row++, n--) for (let k = 0; k < n; k++) { const z = DZ + (k - (n - 1) / 2) * 2 * LR, y = base + row * LR * Math.sqrt(3);
      log('log', [DX - LL / 2 + (F() - .5) * .3, y, z], [DX + LL / 2 + (F() - .5) * .3, y, z], LR); deck.push({ y: +y.toFixed(4), z: +z.toFixed(4), row }); } }
  // the felling: stumps cut flat, snow on each, an axe left in one
  const clearOf = (x, z) => Math.abs(x - CX) < 1.8 || (Math.abs(x - DX) < 3.4 && Math.abs(z - DZ) < 2.6) || Math.hypot(x - 11, z - 4) < 4 || Math.hypot(x - 2, z + 4) < 2.6;
  const stumps = []; for (let k = 0, n = 0; k < 1200 && n < 50; k++) { const x = -18 + F() * 34, z = -16 + F() * 38; if (clearOf(x, z) || stumps.some(s => Math.hypot(s.x - x, s.z - z) < 1.6)) continue; n++;
    const rr = .18 + F() * .14, h = .45 + F() * .25, gl = Math.min(...[[-1, 0], [1, 0], [0, -1], [0, 1]].map(([a, b]) => ground(x + a * rr, z + b * rr))), gh = Math.max(...[[-1, 0], [1, 0], [0, -1], [0, 1]].map(([a, b]) => ground(x + a * rr, z + b * rr)));
    put(new THREE.CylinderGeometry(rr, rr * 1.15, h + (gh - gl) + .1, 9), 'log', x, (gl - .1 + gh + h) / 2, z); const top = gh + h; put(new THREE.CircleGeometry(rr * .97, 9).rotateX(-Math.PI / 2), 'end', x, top + .002, z);
    const cap = new THREE.SphereGeometry(rr * .92, 9, 3, 0, 6.283, 0, Math.PI / 2); cap.scale(1, .3, 1); put(cap, 'snow', x, top, z); stumps.push({ x: +x.toFixed(2), z: +z.toFixed(2), r: +rr.toFixed(3), top: +top.toFixed(3) }); }
  { const s = stumps[0]; rod('wood', [s.x + .02, s.top + .05, s.z], [s.x + .5, s.top + .35, s.z + .2], .02, 6); put(new THREE.BoxGeometry(.04, .14, .11), 'iron', s.x, s.top + .04, s.z, 0, -.38, .52); }
  // the gapahuk: a back wall of logs 1 m high, the sides rising to 2.1 m at the open front, a roof of poles, boards and snow, a bed of boughs
  const SX = 11, SZ = 4, SW = 3.2, SD = 2.4, BK = 1.0, FR = 2.1, LR2 = .11; const sy = Math.max(...[[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([a, b]) => ground(SX + a * SW / 2, SZ + b * SD / 2))) - .15;
  { for (let y = sy + LR2; y < sy + BK; y += LR2 * 1.8) log('grey', [SX - SW / 2 - .2, y, SZ - SD / 2], [SX + SW / 2 + .2, y, SZ - SD / 2], LR2);
    for (const s of [-1, 1]) for (let y = sy + LR2 + LR2 * .9; y < sy + FR - .25; y += LR2 * 1.8) { const zb = SZ - SD / 2 + Math.max(0, (y + LR2 - sy - BK) / (FR - BK)) * SD /* where the roof's underside clears this course */; if (zb > SZ + SD / 2 - .4) break; log('grey', [SX + s * SW / 2, y, zb - .05], [SX + s * SW / 2, y, SZ + SD / 2 + .15], LR2); }
    const pitch = Math.atan2(FR - BK, SD), rl = Math.hypot(FR - BK, SD) + .7, rcy = sy + (BK + FR) / 2 + .14, rcz = SZ + .1;
    for (const [k, th, off] of [['grey', .1, 0], ['board', .05, .08], ['snow', .22, .2]]) put(k === 'snow' ? new RoundedBoxGeometry(SW + .7, th, rl + .05, 2, .07) : new THREE.BoxGeometry(SW + .6, th, rl), k, SX, rcy + off * Math.cos(pitch), rcz - off * Math.sin(pitch), -pitch, 0, 0, .5);
    for (let k = 0; k < 9; k++) { const g = new THREE.ConeGeometry(.5, 1.3, 5); g.rotateX(Math.PI / 2); g.scale(1, .18, 1); put(g, 'bough', SX - 1.1 + (k % 3) * 1.1, sy + .2 + Math.floor(k / 3) * .02, SZ - .6 + Math.floor(k / 3) * .55, 0, (F() - .5) * .6); }
    const FX = SX, FZ = SZ + SD / 2 + 1.4, fy = ground(FX, FZ); for (let k = 0; k < 9; k++) { const a = k / 9 * 6.283, st = new THREE.IcosahedronGeometry(.13, 0); st.scale(1.2, .7, 1); put(st, 'stone', FX + .45 * Math.cos(a), fy + .04, FZ + .45 * Math.sin(a), 0, F() * 3); }
    put(new THREE.CylinderGeometry(.32, .36, .05, 10), 'char', FX, fy + .02, FZ); for (let k = 0; k < 3; k++) rod('char', [FX + .3 * Math.cos(k * 2.1), fy + .06, FZ + .3 * Math.sin(k * 2.1)], [FX - .1 * Math.cos(k * 2.1), fy + .1, FZ - .1 * Math.sin(k * 2.1)], .045);
    put(new THREE.SphereGeometry(.4, 9, 3, 0, 6.283, 0, Math.PI / 2).scale(1, .15, 1), 'snow', FX + .05, fy + .05, FZ + .05) /* snow fallen in the cold fire */; }
  const shelter = { x: SX, z: SZ, w: SW, d: SD, y: +sy.toFixed(3), back: BK, front: FR };
  // the sledge: two runners turned up at the front, two bunks, a log chained on them
  const GX = 2, GZ = -4, runners = []; { const gy = (x, z) => ground(x, z); for (const s of [-1, 1]) { const x = GX + s * .45, pts = []; for (let k = 0; k <= 10; k++) { const t = k / 10, z = GZ - 1.4 + t * 2.8, up = t > .8 ? Math.pow((t - .8) / .2, 2) * .35 : 0; pts.push(new THREE.Vector3(x, gy(x, z) + .05 + up, z - (t > .8 ? up * .4 : 0))); runners.push([+x.toFixed(2), +z.toFixed(2)]); }
      put(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 20, .05, 6), 'board'); }
    for (const dz of [-.8, .6]) { const y = Math.max(gy(GX - .45, GZ + dz), gy(GX + .45, GZ + dz)) + .3; put(new THREE.BoxGeometry(1.15, .12, .14), 'board', GX, y, GZ + dz); for (const s of [-1, 1]) rod('board', [GX + s * .45, gy(GX + s * .45, GZ + dz) + .08, GZ + dz], [GX + s * .45, y, GZ + dz], .035, 5); }
    const ly = Math.max(gy(GX, GZ - .8), gy(GX, GZ + .6)) + .36 + .2; log('log', [GX, ly, GZ - 2.6], [GX, ly - .1, GZ + 2.2], .2); for (const dz of [-.8, .6]) { const ring = new THREE.TorusGeometry(.24, .015, 4, 14); ring.rotateY(Math.PI / 2); put(ring, 'iron', GX, ly - .02, GZ + dz + .12); } }
  // the forest round the felling: spruce, and a few left standing in it
  const trees = []; for (let k = 0, n = 0; k < 1400 && n < 80; k++) { const x = -45 + F() * 90, z = -45 + F() * 72; if ((x > -21 && x < 19 && z > -19 && z < 25) && F() > .04) continue; if (z > RZ0 - 3 && z < RZ1 + 2) continue; if (clearOf(x, z) || trees.some(t => Math.hypot(t.x - x, t.z - z) < 2.6) || stumps.some(s => Math.hypot(s.x - x, s.z - z) < 1.5)) continue; n++;
    const h = 9 + F() * 9, gy = ground(x, z), w = h * (.21 + F() * .05); rod('bark', [x, gy - .3, z], [x, gy + h * .35, z], h * .016, 6);
    for (let t = 0; t < 7; t++) { const f = t / 7, y0 = gy + h * (.16 + f * .76), th = h * (.26 - f * .05), rw = w * (1 - f * .8) * (.9 + F() * .2); put(new THREE.ConeGeometry(rw, th, 8, 1, true), 'needle', x, y0 + th / 2, z, 0, F() * 3);
      if (F() < .8) put(new THREE.ConeGeometry(rw * .62, th * .36, 7, 1, true), 'snow', x + (F() - .5) * rw * .2, y0 + th * .7 + .02, z + (F() - .5) * rw * .2, 0, F() * 3); } trees.push({ x: +x.toFixed(2), z: +z.toFixed(2), h: +h.toFixed(2) }); }
  const group = new THREE.Group(); let tris = 0; for (const [k, gs] of B) { const g = mergeGeometries(gs, false); gs.forEach(x => x.dispose()); const m = new THREE.Mesh(g, M[k]); m.name = k; m.castShadow = !['ice'].includes(k); m.receiveShadow = true; group.add(m); tris += g.attributes.position.count / 3; }
  return { group, tris: Math.round(tris), draws: group.children.length, own: group.children.length, ground,
    chute: { x: CX, z0: CZ0, z1: CZ1, y0: +CY0.toFixed(3), y1: +CY1.toFixed(3), grade: +grade.toFixed(4), gap: GAP, trestles, R: CR, S: CS }, deck: { x: DX, z: DZ, logs: deck, R: LR, skid: +Math.max(...sk).toFixed(3) },
    stumps, shelter, sledge: { x: GX, z: GZ, runners }, river: { z0: RZ0, z1: RZ1, y: RY }, trees };
}

// ── the Mark's ice cave mouth (Session 1006, card F8; OG-124's Mark panel, "an ice cave mouth"; OG-121's "ice caverns, snowed-in mouths").
// The outside of markIceCave: where its passage comes out of the ice. The precedent is the glacier caves of Breiðamerkurjökull and the
// snouts of the Norwegian outlet glaciers (Nigardsbreen, Briksdalsbreen): a glacier ends in a face of ice 15 to 25 m high, banded grey
// with the grit it carried; its meltwater has cut a tunnel out under it, an arch that glows blue a few metres in and goes dark; the stream
// runs out over a plain of gravel (the sandur) through a gap it has cut in the ridge of boulders the ice left when it stood further out
// (the terminal moraine); blocks calved off the face lie at its foot. Built at true size, the ice to -z, the stream flowing out to +z:
//   - the valley: rock walls rising from 26 m either side of the stream, 34 m high; the sandur falling 1 in 25 away from the face;
//   - the face: from x -44 to 44, wandering ±2.5 m, 17 to 21 m high, leaning out at its head, with grey bands of grit;
//   - the mouth: an arch 8 m wide, upright to 2.4 m and 5.6 m to its crown, narrowing over 18 m to a throat 6 m wide and 4.6 m high,
//     clear ice at the mouth, deep blue past 6 m, dark beyond; icicles hang where they leave a man's head clear;
//   - the stream: out of the dark along the tunnel's east side, over the sandur in a channel 0.45 m deep, through the moraine's gap;
//   - the moraine: a ridge of gravel and boulders 2.6 m high in an arc 26 m out, cut 6 m wide where the stream goes through;
//   - the ice's back: snow over the glacier rising inward, its crevasses across the flow; calved blocks at the foot, clear of the way in.
// -> { group, tris, draws, top, mouth { w, h, spring, depth, throat { w, h }, z0, hwAt(z), roofAt(z, x), floorAt(z) }, faceZ(x), iceTop(x, z),
//   ground(x, z), stream { x(z), y(z) }, moraine { r, gap, crest(a) }, blocks [{ x, z, s, y }], icicles [{ x, z, tip, floor }], crevasses }
export function markIceMouth(o = {}, r = stream('icemouth')) {
  const ice = (c, rough, x = {}) => { const m = mat('rock', { ns: x.ns ?? .5, color: c, rough }); m.side = THREE.DoubleSide; if (x.em) m.emissive = new THREE.Color(x.em); return m; };
  const std = (c, ro = .9, x = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: ro, ...x });
  const M = { ice: ice(0xc6dee8, .3, { ns: .35 }), band: ice(0x6e767a, .8, { ns: .6 }), blue: ice(0x4a92c0, .2, { em: 0x0a2840 }), deep: ice(0x1c4c78, .2, { em: 0x061a2e }),
    dark: new THREE.MeshBasicMaterial({ color: 0x06121e, side: THREE.DoubleSide }), snow: mat('plaster', { ns: .3, color: 0xf2f6fa, rough: .95 }),
    gravel: mat('rock', { ns: .7, color: 0xd2cec6, rough: 1 }), rock: mat('rock', { ns: 1.0, color: 0x7a776f, rough: 1 }), boulder: mat('rock', { ns: 1.1, color: 0x9a968c, rough: 1 }),
    water: std(0x8cb2ba, .12, { metalness: .1 }), crev: std(0x1e4c6c, .3), icicle: ice(0xd4ecf6, .1) };
  const B = new Map(), key = String(o.key || 'icemouth'), F = stream(key + ':lie'), ph = Array.from({ length: 10 }, () => F() * 6.283);
  const put = (geo, k, x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0, uv = .5) => { const g = geo.index ? geo.toNonIndexed() : geo; for (const a of Object.keys(g.attributes)) if (!['position', 'normal'].includes(a)) g.deleteAttribute(a);
    if (!g.attributes.normal) g.computeVertexNormals(); g.applyMatrix4(new THREE.Matrix4().compose(new THREE.Vector3(x, y, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(rx, ry, rz, 'YXZ')), new THREE.Vector3(1, 1, 1))); worldUV(g, uv);
    if (!B.has(k)) B.set(k, []); B.get(k).push(g); return g; };
  const sm = t => { t = Math.min(1, Math.max(0, t)); return t * t * (3 - 2 * t); };
  // a grid of points P[j][i] shaded smooth across all its kept quads, each quad's triangles sent to the material keyOf(i, j) names (null drops it)
  const smoothGrid = (P, keyOf) => { const nj = P.length, ni = P[0].length, N = P.map(row => row.map(() => [0, 0, 0])), keep = [];
    const add = (p, q, w) => { const u = [q[0] - p[0], q[1] - p[1], q[2] - p[2]], v = [w[0] - p[0], w[1] - p[1], w[2] - p[2]]; return [u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0]]; };
    for (let j = 0; j + 1 < nj; j++) for (let i = 0; i + 1 < ni; i++) { const k = keyOf(i, j); if (!k) continue; keep.push([i, j, k]); const n = add(P[j][i], P[j + 1][i], P[j][i + 1]), n2 = add(P[j][i + 1], P[j + 1][i], P[j + 1][i + 1]);
      for (const [jj, ii, nn] of [[j, i, n], [j + 1, i, n], [j, i + 1, n], [j, i + 1, n2], [j + 1, i, n2], [j + 1, i + 1, n2]]) { const t = N[jj][ii]; t[0] += nn[0]; t[1] += nn[1]; t[2] += nn[2]; } }
    const out = {}; for (const [i, j, k] of keep) { const o = out[k] || (out[k] = { p: [], n: [] }); for (const [jj, ii] of [[j, i], [j + 1, i], [j, i + 1], [j, i + 1], [j + 1, i], [j + 1, i + 1]]) { o.p.push(...P[jj][ii]); const t = N[jj][ii], L = Math.hypot(...t) || 1; o.n.push(t[0] / L, t[1] / L, t[2] / L); } }
    for (const k in out) { const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(out[k].p, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(out[k].n, 3)); put(g, k, 0, 0, 0, 0, 0, 0, .3); } };
  const tri = (k, pos) => { const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.computeVertexNormals(); put(g, k, 0, 0, 0, 0, 0, 0, .3); };
  // the face's line: wandering ±2.5 m, through z 0 at the mouth; the ice's top over it, rising inward 1 in 4 for 24 m, then gently, a snowfield
  const fz0 = 2.5 * Math.sin(ph[0]) + 1.2 * Math.sin(ph[1]), faceZ = x => 2.5 * Math.sin(x * .07 + ph[0]) + 1.2 * Math.sin(x * .19 + ph[1]) - fz0, LEAN = 1.5;
  const iceTop = (x, z) => 18.5 + 1.5 * Math.sin(x * .11 + ph[2]) + .25 * Math.min(24, faceZ(x) + LEAN - z) + .02 * Math.max(0, faceZ(x) + LEAN - 24 - z);
  // the mouth: an arch, upright walls to the springing and a half-ellipse over; it narrows over its depth to the throat
  const MW = 8, MH = 5.6, SPR = 2.4, TW = 6, TH = 4.6, TL = 18, Z0 = .6;
  const tAt = z => sm((Z0 - z) / TL), hwAt = z => (MW + (TW - MW) * tAt(z)) / 2, crownAt = z => MH + (TH - MH) * tAt(z);
  // the stream's line and the ground: the sandur falling 1 in 25 out from the ice, the valley's walls, the moraine's ridge cut by the stream
  const SX = z => 1.3 + (z > 0 ? 3.2 * Math.sin(z * .085 + ph[3]) * sm(z / 10) : 0);
  const MR = 26, GAP = 3.0;
  const mor = (x, z) => { if (z < 4) return 0; const d = Math.hypot(x, z), cut = sm((Math.abs(x - SX(z)) - GAP) / 2.5); return 2.6 * Math.exp(-(((d - MR) / 4.2) ** 2)) * cut * (1 + .15 * Math.sin(x * .6 + ph[4])); };
  const base = (x, z) => -.04 * z + 34 * sm((Math.abs(x) - 26) / 24) + .12 * Math.sin(x * .37 + ph[5]) * Math.sin(z * .29 + ph[6]) * sm((Math.abs(x - SX(z)) - 2) / 3) + mor(x, z);
  const carve = (x, z) => .45 * Math.exp(-(((x - SX(z)) / 1.4) ** 2));
  const waterY = z => -.04 * z - .2, ground = (x, z) => base(x, z) - carve(x, z);
  const floorAt = z => ground(0, z);
  // the ground: a grid fine round the mouth and the stream, coarse beyond; rock where it is steep, gravel on the sandur, snow on the walls' shelves
  { const xs = [], zs = []; for (let x = -80; x < -18; x += 2.5) xs.push(x); for (let x = -18; x < 18; x += 1) xs.push(x); for (let x = 18; x <= 80; x += 2.5) xs.push(x);
    for (let z = -120; z < -20; z += 4) zs.push(z); for (let z = -20; z < 36; z += 1) zs.push(z); for (let z = 36; z <= 100; z += 3) zs.push(z);
    const P = zs.map(z => xs.map(x => [x, ground(x, z), z]));
    smoothGrid(P, (i, j) => { const a = P[j][i], b = P[j][i + 1], c = P[j + 1][i], d = P[j + 1][i + 1], cx = (a[0] + d[0]) / 2, cz = (a[2] + d[2]) / 2;
      if (cz < faceZ(cx) - 6 && Math.abs(cx) > hwAt(cz) + 3 && iceTop(cx, cz) > Math.max(a[1], b[1], c[1], d[1]) + 1) return null; /* under the ice, out of sight */
      const sl = Math.hypot(b[1] - a[1], c[1] - a[1]) / Math.min(b[0] - a[0], c[2] - a[2]);
      return sl > .7 ? 'rock' : Math.abs(cx) > 29 ? 'snow' : 'gravel'; }); }
  // the face: columns along x, rows up from the ground to the ice's top, leaning out at its head; quads inside the mouth's arch dropped
  const inArch = (x, y, m = 0) => { const hw = hwAt(Z0) - m; if (Math.abs(x) > hw || y < floorAt(0) - .5) return false; const yy = y - floorAt(0); return yy < SPR - m || ((x / hw) ** 2 + ((yy - SPR) / (MH - SPR - m)) ** 2) < 1; };
  const facePt = (x, v) => { const g0 = ground(x, faceZ(x)) - .6, y = g0 + (iceTop(x, faceZ(x) + LEAN) - g0) * v, j = (.55 * Math.sin(x * .83 + ph[9] + y * .05) + .8 * Math.sin(x * .27 + ph[8]) * Math.sin(y * .21 + ph[7])) * Math.min(1, v * 6) * (1 - .5 * v); return [x, y, faceZ(x) + LEAN * v * v + j]; }; /* runnels down the face, where the melt runs; none at its foot or round the mouth's sill */
  { const NX = 110, NV = 26; const pts = []; for (let i = 0; i <= NX; i++) { const x = -44 + 88 * i / NX, col = []; for (let j = 0; j <= NV; j++) { col.push(facePt(x, j < 10 ? j / 10 * .32 : .32 + (j - 10) / (NV - 10) * .68)); /* rows close round the arch's height, wider above */ } pts.push(col); }
    const P = []; for (let j = 0; j <= NV; j++) P.push(pts.map(col => col[j]).reverse()) /* rows up, x falling, so the quads face out (+z) */;
    smoothGrid(P, (i, j) => { const a = P[j][i], d = P[j + 1][i + 1]; return inArch((a[0] + d[0]) / 2, (a[1] + d[1]) / 2) || Math.max(a[1], d[1]) < ground(a[0], a[2]) - .2 ? null : 'ice'; });
    // the grit: bands laid in the ice as it moved, wavy strips just proud of the face, broken where the arch is cut
    for (let yb = 2.2; yb < 21; yb += 3.1 + .8 * Math.sin(yb * 1.7 + ph[3])) { const th = .25 + .3 * (.5 + .5 * Math.sin(yb * 2.3 + ph[4])), pos = []; let prev = null;
      for (let x = -44; x <= 44.01; x += .8) { const yc = yb + 1.1 * Math.sin(x * .06 + ph[2] + yb * .3), g0 = ground(x, faceZ(x)) - .6, T = iceTop(x, faceZ(x) + LEAN), row = [];
        for (const y of [yc - th / 2, yc + th / 2]) { const v = (y - g0) / (T - g0), p = facePt(x, Math.min(1, Math.max(0, v))); row.push([p[0], p[1], p[2] + .06]); }
        const ok = !inArch(x, yc, -.4) && yc - th > ground(x, faceZ(x)) && yc + th < T - .3;
        if (prev && ok && prev.ok) pos.push(...prev.row[0], ...row[0], ...prev.row[1], ...prev.row[1], ...row[0], ...row[1]); prev = { row, ok }; }
      if (pos.length) tri('band', pos); } }
  // the arch's surround: a lip of clear ice round the opening, so the cut reads as an edge, not a hole in a sheet
  { const out = []; const NA = 30, ring = (m, dz) => { const pts = [], hw = hwAt(Z0) + m, fy = floorAt(0) - .3; pts.push([-hw, fy, Z0 + dz]); for (let k = 0; k <= NA; k++) { const th = Math.PI - Math.PI * k / NA; pts.push([hw * Math.cos(th), floorAt(0) + SPR + (MH - SPR + m) * Math.sin(th), Z0 + dz]); } pts.push([hw, fy, Z0 + dz]); return pts; };
    const A = ring(0, 0), C = ring(.9, -.6); for (let k = 0; k + 1 < A.length; k++) out.push(...A[k], ...C[k], ...A[k + 1], ...A[k + 1], ...C[k], ...C[k + 1]); tri('ice', out); }
  // the tunnel: rings of the arch's section from the mouth to the throat, each pushed about by a little noise; clear, then blue, then deep
  const ROOF = (z, x) => { const hw = hwAt(z), cr = crownAt(z), fl = floorAt(z); const t = Math.min(1, Math.abs(x) / hw); return fl + (Math.abs(x) >= hw ? SPR : SPR + (cr - SPR) * Math.sqrt(1 - t * t)); };
  { const NR = 36, NA = 28, rings = []; for (let i = 0; i <= NR; i++) { const z = Z0 - TL * i / NR, hw = hwAt(z), cr = crownAt(z), fl = floorAt(z), ring = [];
      const w = (x, y) => .18 * Math.sin(x * 1.7 + z * 1.1 + ph[1]) * Math.sin(y * 1.3 + z * .7) * (i ? 1 : 0);
      ring.push([-hw - w(-hw, fl), fl - .35, z]); for (let k = 0; k <= NA; k++) { const s = k / NA, th = Math.PI * (1 - s); const x = hw * Math.cos(th), y = fl + SPR + (cr - SPR) * Math.sin(th); if (k === 0) ring.push([-hw - w(-hw, fl + 1), fl + SPR * .5, z]);
        ring.push([x + w(x, y) * Math.cos(th), y + w(x, y) * Math.sin(th), z]); if (k === NA) ring.push([hw + w(hw, fl + 1), fl + SPR * .5, z]); } ring.push([hw + w(hw, fl), fl - .35, z]); rings.push(ring); }
    const out = { ice: [], blue: [], deep: [] }; for (let i = 0; i < NR; i++) { const zc = Z0 - TL * (i + .5) / NR, k = Z0 - zc < 6 ? 'ice' : Z0 - zc < 12 ? 'blue' : 'deep';
      for (let j = 0; j + 1 < rings[i].length; j++) { const a = rings[i][j], b = rings[i][j + 1], c = rings[i + 1][j], d = rings[i + 1][j + 1]; out[k].push(...a, ...c, ...b, ...b, ...c, ...d); } }
    for (const k in out) tri(k, out[k]);
    // the dark beyond the throat: the tunnel goes on, turning, out of the light
    { const z = Z0 - TL, hw = hwAt(z), cr = crownAt(z), fl = floorAt(z), sh = new THREE.Shape(); sh.moveTo(-hw - .3, fl - .4); sh.lineTo(-hw - .3, fl + SPR); sh.absellipse(0, fl + SPR, hw + .3, cr - SPR + .3, Math.PI, 0, true); sh.lineTo(hw + .3, fl - .4); sh.lineTo(-hw - .3, fl - .4);
      const g = new THREE.ShapeGeometry(sh, 16); g.translate(0, 0, z - .05); put(g, 'dark'); } }
  // the stream: a ribbon on the water's line, out of the dark and over the sandur to the far edge; a few stones in its bed show through
  { const pos = []; let prev = null; for (let z = Z0 - TL + .2; z <= 100; z += z < 36 ? .5 : 2) { const x = SX(z), y = waterY(z), wd = z < Z0 ? .9 : 1.15; const row = [[x - wd, y, z], [x, y, z], [x + wd, y, z]]; if (prev) for (let k = 0; k < 2; k++) pos.push(...prev[k], ...row[k], ...prev[k + 1], ...prev[k + 1], ...row[k], ...row[k + 1]); prev = row; }
    tri('water', pos); for (let k = 0; k < 40; k++) { const z = 1 + r() * 34, x = SX(z) + (r() - .5) * 1.8, s = .12 + r() * .18; put(new THREE.DodecahedronGeometry(s, 0), 'boulder', x, waterY(z) - s * .5, z, r() * 3, r() * 3, 0, .4); } }
  // the moraine: boulders over its crest and flanks (none in the stream's gap), and a cairn on the crest beside the gap
  const boulders = []; for (let k = 0; k < 110; k++) { const a = -1.15 + r() * 2.3, d = MR + (r() - .5) * 9, x = Math.sin(a) * d, z = Math.cos(a) * d; if (Math.abs(x - SX(z)) < GAP + 1.2 || Math.abs(x) > 34) continue;
    const s = .35 + r() * r() * 1.4; boulders.push([x, z, s]); put(roughen(new THREE.DodecahedronGeometry(s, 0), r, s * .08), 'boulder', x, ground(x, z) + s * .25, z, r() * 3, r() * 3, 0, .4); }
  const cairn = (() => { const cz = MR - .5, cx = SX(cz) - GAP - 3.2, gy = ground(cx, cz); let y = gy; for (let k = 0; k < 6; k++) { const s = .42 - k * .05; put(new THREE.DodecahedronGeometry(s, 0).scale(1, .55, 1), 'boulder', cx + (r() - .5) * .06, y + s * .5, cz, 0, r() * 3, 0, .4); y += s * .95; } return { x: cx, z: cz, top: +y.toFixed(2), foot: +gy.toFixed(2) }; })();
  // the ice's back: a snowfield over a grid from the face's head inward; crevasses across the flow
  { const NX = 46, NZ = 38, P = []; for (let j = 0; j <= NZ; j++) { const row = []; for (let i = 0; i <= NX; i++) { const x = -46 + 92 * i / NX, z = faceZ(x) + LEAN - (j < 20 ? j * 1.5 : 30 + (j - 20) * 5); const fp = facePt(x, 1); row.push(j ? [x, iceTop(x, z) + .25 * Math.sin(x * .4 + z * .3), z] : [fp[0], fp[1], fp[2]]); } P.push(row); }
    smoothGrid(P.map(row => row.slice().reverse()), () => 'snow'); }
  const crevasses = []; for (let k = 0; k < 8; k++) { const z = -8 - k * 6.5 - r() * 3, x = (r() - .5) * 40, L = 7 + r() * 9, a = (r() - .5) * .3; crevasses.push([+x.toFixed(1), +z.toFixed(1), +L.toFixed(1)]);
    put(new THREE.BoxGeometry(L, 1.4, .55 + r() * .4), 'crev', x, iceTop(x, z) - .62, z, 0, a); }
  // calved blocks at the foot of the face: clear of the way in and of the stream
  const blocks = []; for (let t = 0; t < 60 && blocks.length < 11; t++) { const x = (r() - .5) * 44, z = faceZ(x) + 2.2 + r() * 6, s = .8 + r() * 1.6;
    if (Math.abs(x) < hwAt(Z0) + 2.5 + s || Math.abs(x - SX(z)) < 2.4 + s || blocks.some(b => Math.hypot(b.x - x, b.z - z) < b.s + s + .5)) continue;
    const y = ground(x, z) + s * .3; blocks.push({ x: +x.toFixed(2), z: +z.toFixed(2), s: +s.toFixed(2), y: +y.toFixed(2), ground: +ground(x, z).toFixed(2) }); put(roughen(new THREE.BoxGeometry(s * 1.6, s, s * 1.2, 2, 2, 2), r, s * .1), 'ice', x, y, z, r() * .4, r() * 3, r() * .4, .4); }
  // icicles from the arch's lip and the first metres of the roof: only where the tip leaves 2.1 m clear over the floor
  const icicles = []; for (let k = 0; k < 90 && icicles.length < 44; k++) { const z = Z0 - r() * 3.5, x = (r() - .5) * 2 * hwAt(z) * .9, top = ROOF(z, x) - .05, L = .3 + r() * r() * 1.4, fl = floorAt(z);
    if (top - L - fl < 2.1) continue; icicles.push({ x: +x.toFixed(2), z: +z.toFixed(2), tip: +(top - L).toFixed(2), floor: +fl.toFixed(2) }); const g = new THREE.ConeGeometry(.04 + L * .06, L, 6); g.rotateX(Math.PI); put(g, 'icicle', x, top - L / 2, z, 0, 0, 0, .2); }
  const group = new THREE.Group(); let tris = 0; for (const [k, gs] of B) { const g = mergeGeometries(gs, false); gs.forEach(x => x.dispose()); const m = new THREE.Mesh(g, M[k]); m.name = k; m.castShadow = !['water', 'dark', 'gravel', 'snow'].includes(k); m.receiveShadow = !['dark'].includes(k); group.add(m); tris += g.attributes.position.count / 3; }
  return { group, tris: Math.round(tris), draws: group.children.length, top: +new THREE.Box3().setFromObject(group).max.y.toFixed(2),
    mouth: { w: MW, h: MH, spring: SPR, depth: TL, throat: { w: TW, h: TH }, z0: Z0, hwAt, roofAt: ROOF, floorAt }, faceZ, iceTop, ground, lean: LEAN,
    stream: { x: SX, y: waterY }, moraine: { r: MR, gap: GAP }, cairn, boulders: boulders.length, blocks, icicles, crevasses };
}

// ── Aurenne's smuggler's cove (Session 1007, card F8; OG-124's Aurenne panel, "a smuggler's cove"; OG-121's "smugglers' lairs"). Piracy and
// the run past the Compact's tithe are the coast's other trade (canon §1). The precedent is the calas of the Balearics and Malta's Wied
// il-Għasri, and the fjord of Furore on the Amalfi coast: a narrow inlet between white limestone cliffs, a shingle beach at its head, the
// fishermen's boathouses cut into the cliff's foot behind plastered fronts, a stair cut half into the cliff and built out half on a wall,
// a lookout's hut on the top with a window to the sea. In Aurenne's own dress: cream plaster, limestone dressings, doors painted blue.
// Built at true size, the sea to +z, y 0 the sea:
//   - the inlet: 14 m across at its head, opening to 38 m at its mouth 75 m out, between cliffs that stand 20 m over the sea within 2.2 m;
//     the plateau runs on either side to the coast, where the cliffs turn away east and west;
//   - the beach: sand 15 m long from 1.35 m over the sea at the inlet's head, under the water 6 m out; the sea floor falling to 6 m;
//   - the boathouses: three in the west cliff's foot, each a plastered front 4.4 m wide and 4.2 m high under a cope, a round-headed door
//     3 m wide and 3 m high painted blue, the middle one open on the dark; a barred window over each; the third's slip runs into the sea;
//   - the stair: up the east cliff from the beach to the top, 0.18 m risers on 0.3 m treads, a landing every 18, a parapet on the open side;
//   - the lookout: a plastered hut on the east top near the mouth, its door landward, its window to the sea; o.lit, a lamp burns in it;
//   - the boats: a rowing boat drawn up on the shingle, another at the third slip; o.ship (the default), Aurenne's sloop at anchor in the inlet;
//   - the cargo: bales, amphorae and casks on the beach before the boathouses.
// -> { group, tris, draws, top, W(z), coast(x), plateau, ground(x, z), sea, steps [{ x, z, y, w }], stairTop, houses [{ x, z, w, h, door { w, h }, open }],
//   slip { z, foot }, boats [{ x, z, y }], cargo [{ x, z, y }], lookout { x, z, y, w, door, win }, ship { x, z, draft }, lit }
export function aurenneCove(o = {}, r = stream('cove')) {
  const A = aqueductMats(), std = (c, ro = .9, x = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: ro, ...x });
  const M = { plaster: A.plaster, cope: A.cope, ashlar: mat('ashlar', { ns: .9, color: 0xe8dcc4, rough: .9 }), ground: A.ground, rock: mat('rock', { ns: 1.3, color: 0xe2d8c2, rough: .95 }), bed: mat('rock', { ns: .8, color: 0xd8ccae, rough: 1 }),
    shingle: mat('plaster', { ns: 1.1, color: 0xeadfc6, rough: 1 }), dark: std(0x0b0907, 1), door: std(0x2f6aa0, .7), iron: std(0x2a2826, .5, { metalness: .6 }), hull: Object.assign(mat('wood', { ns: .8, color: 0x7aa4b8, rough: .85 }), { side: THREE.DoubleSide }),
    wood: mat('wood', { ns: .9, color: 0x8a6c4c, rough: .9 }), bale: mat('plaster', { ns: .9, color: 0xb8a078, rough: 1 }), clay: std(0xb0603c, .85), lamp: std(0x3a3020, .4, { emissive: 0xffc070, emissiveIntensity: 0 }),
    sea: new THREE.MeshStandardMaterial({ color: 0x2aa0a8, roughness: .12, metalness: .1, transparent: true, opacity: .78, depthWrite: false }) };
  const B = new Map(), key = String(o.key || 'cove'), F = stream(key + ':lie'), ph = Array.from({ length: 8 }, () => F() * 6.283), lit = !!o.lit;
  const put = (geo, k, x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0, uv = .5) => { const g = geo.index ? geo.toNonIndexed() : geo; for (const a of Object.keys(g.attributes)) if (!['position', 'normal'].includes(a)) g.deleteAttribute(a);
    if (!g.attributes.normal) g.computeVertexNormals(); g.applyMatrix4(new THREE.Matrix4().compose(new THREE.Vector3(x, y, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(rx, ry, rz, 'YXZ')), new THREE.Vector3(1, 1, 1))); worldUV(g, uv);
    if (!B.has(k)) B.set(k, []); B.get(k).push(g); return g; };
  const sm = t => { t = Math.min(1, Math.max(0, t)); return t * t * (3 - 2 * t); };
  // the land: the inlet's half-width W(z), its head at z -9, the coast at about z 82; D is how far into the land a point is (negative in the sea)
  const PT = 20, CW = 2.2, HEAD = -9, W = z => 7 + 12 * sm((z + 5) / 75), coast = x => 82 + 6 * Math.sin(x * .03 + ph[0]) + 3 * Math.sin(x * .11 + ph[1]);
  const D = (x, z) => Math.min(Math.max(Math.abs(x) - W(z), HEAD - z), coast(x) - z) + .35 * Math.sin(z * .9 + ph[2]) + .2 * Math.sin(z * 2.3 + x * .4 + ph[3]);
  const BZ = 6, bed = (x, z) => { const bz = z < BZ ? .15 + (BZ - z) * .08 : Math.max(-6, .15 - (z - BZ) * .35); return bz - (z > BZ ? .6 * Math.max(0, 1 - (x / W(z)) ** 2) * sm((z - BZ) / 4) : 0); };
  const ground = (x, z) => { const d = D(x, z); if (d <= 0) return bed(x, Math.max(z, HEAD)); const t = sm(d / CW), top = PT + .5 * Math.sin(x * .05 + ph[4]) * Math.sin(z * .04 + ph[5]) + .02 * Math.min(Math.max(0, d - CW), 40);
    return bed(x, Math.max(Math.min(z, coast(x)), HEAD)) * (1 - t) + top * t; };
  { const xs = [], zs = []; for (let x = -90; x < -24; x += 4) xs.push(x); for (let x = -24; x < 24; x += .9) xs.push(x); for (let x = 24; x <= 90; x += 4) xs.push(x);
    for (let z = -40; z < -12; z += 3) zs.push(z); for (let z = -12; z < 92; z += 1) zs.push(z); for (let z = 92; z <= 140; z += 6) zs.push(z);
    const P = zs.map(z => xs.map(x => [x, ground(x, z), z])), out = { ground: [], rock: [], shingle: [], bed: [] };
    for (let j = 0; j + 1 < zs.length; j++) for (let i = 0; i + 1 < xs.length; i++) { const a = P[j][i], b = P[j][i + 1], c = P[j + 1][i], d = P[j + 1][i + 1], cx = (a[0] + d[0]) / 2, cz = (a[2] + d[2]) / 2, dd = D(cx, cz);
      const sl = Math.max(Math.abs(b[1] - a[1]) / (b[0] - a[0]), Math.abs(c[1] - a[1]) / (c[2] - a[2]), Math.abs(d[1] - c[1]) / (d[0] - c[0]));
      const k = sl > .9 ? 'rock' : dd > 0 ? 'ground' : cz < BZ + 1.5 && Math.max(a[1], d[1]) > -.4 ? 'shingle' : 'bed'; out[k].push(...a, ...c, ...b, ...b, ...c, ...d); }
    for (const k in out) { const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(out[k], 3)); g.computeVertexNormals(); put(g, k, 0, 0, 0, 0, 0, 0, k === 'ground' ? 1.2 : .3); } }
  { const g = new THREE.PlaneGeometry(400, 330); g.rotateX(-Math.PI / 2); put(g, 'sea', 0, 0, 155); }
  // the boathouses: plastered fronts in the west cliff's foot, facing +x across the beach
  const houses = []; for (const [i, z] of [[0, -4.4], [1, 0.4], [2, 5.2]]) { const x = -W(z) + .8, gy = Math.max(ground(x + .3, z), .15), HW = 4.4, HH = 4.2, DW = 3, DH = 3, open = i === 1;
    put(new THREE.BoxGeometry(1.7, HH + 1, HW), 'plaster', x - .85, gy + (HH - 1) / 2, z); put(new THREE.BoxGeometry(1.9, .22, HW + .3), 'cope', x - .8, gy + HH + .11, z); /* the front stands 0.8 m out from the cliff's foot and 1.7 m deep, so the rock's wander stays behind it */
    const sh = new THREE.Shape(), hw = DW / 2; sh.moveTo(-hw, 0); sh.lineTo(hw, 0); sh.lineTo(hw, DH - hw); sh.absarc(0, DH - hw, hw, 0, Math.PI, false); sh.lineTo(-hw, 0);
    { const g = new THREE.ShapeGeometry(sh, 12); g.rotateY(Math.PI / 2); put(g, 'dark', x + .02, gy, z); }
    { const g = new THREE.RingGeometry(hw, hw + .28, 12, 1, 0, Math.PI); g.rotateY(Math.PI / 2); put(g, 'cope', x + .03, gy + DH - hw, z); }
    for (const s of [-1, 1]) put(new THREE.BoxGeometry(.3, DH - hw, .28), 'cope', x - .1, gy + (DH - hw) / 2, z + s * (hw + .14));
    if (open) { for (const s of [-1, 1]) put(new THREE.BoxGeometry(.08, DH - hw - .05, hw), 'door', x + .04 + hw / 2 * .9, gy + (DH - hw) / 2, z + s * (hw + .05), 0, s * 1.35); }
    else { put(new THREE.BoxGeometry(.08, DH - hw - .02, DW - .04), 'door', x + .06, gy + (DH - hw) / 2, z); const g = new THREE.CircleGeometry(hw - .02, 12, 0, Math.PI); g.rotateY(Math.PI / 2); put(g, 'door', x + .1, gy + DH - hw, z); }
    put(new THREE.PlaneGeometry(.9, .6).rotateY(Math.PI / 2), 'dark', x + .02, gy + DH + .55, z); for (let b = -1; b <= 1; b++) put(new THREE.BoxGeometry(.03, .6, .03), 'iron', x + .06, gy + DH + .55, z + b * .25);
    houses.push({ x: +x.toFixed(2), z, w: HW, h: HH, gy: +gy.toFixed(2), door: { w: DW, h: DH }, open }); }
  // the third's slip: slabs from its sill down into the sea at 1 in 7
  const slip = { z: 5.2, x0: houses[2].x, foot: 0 }; { const z = slip.z; let y = houses[2].gy, x = houses[2].x + .5; while (y > -1.1) { put(new THREE.BoxGeometry(1.0, .25, 2.8), 'cope', x, y - .12, z, 0, 0, Math.atan(1 / 7)); x += 1; y -= 1 / 7; } slip.foot = +y.toFixed(2); slip.x1 = +x.toFixed(2); }
  // the stair: up the east cliff from the beach, treads 1.4 m clear of the parapet's inner face, cut into the rock behind; a landing every 18
  const steps = []; { let z = -6.2, y = Math.max(ground(W(-6.2) - .85, -6.2), .2); let n = 0; while (y < PT - .05) { const rise = Math.min(.18, PT + .02 - y); y += rise; n++;
      const run = n % 18 === 0 ? 1.2 : .3, wx = W(z + run / 2), x0 = wx - 1.55, x1 = wx + 2.6, zc = z + run / 2;
      put(new THREE.BoxGeometry(x1 - x0, y - bed(wx - 1, zc) + .5, run + .01), 'ashlar', (x0 + x1) / 2, (y + bed(wx - 1, zc) - .5) / 2, zc, 0, 0, 0, .5);
      steps.push({ x: +(wx - .85).toFixed(3), z: +zc.toFixed(3), y: +y.toFixed(3), w: +(x1 - x0).toFixed(2), x0: +(x0 + .25).toFixed(3), run, rise: +rise.toFixed(3) }); z += run; } }
  // the parapet: one sloped wall along each flight and a level one along each landing, 0.95 m over the nosings, coped
  { let f0 = 0; for (let i = 0; i <= steps.length; i++) { const end = i === steps.length || steps[i].run > .5; if (!end) continue; const seg = steps.slice(f0, i);
      if (seg.length) { const a = seg[0], b = seg[seg.length - 1], za = a.z - .15, zb = b.z + .15, ya = a.y - a.rise, yb = b.y, xa = a.x0 - .125 - .15 * (b.x0 - a.x0) / Math.max(.3, b.z - a.z), xb = b.x0 - .125 + .15 * (b.x0 - a.x0) / Math.max(.3, b.z - a.z);
        /* along the flight's own heading: the stair follows the inlet's side as it widens, so a flight drifts outward as it climbs */
        const hz = Math.hypot(zb - za, xb - xa), L = Math.hypot(hz, yb - ya), pitch = Math.atan2(yb - ya, hz), yaw = Math.atan2(xb - xa, zb - za), xm = (xa + xb) / 2, zm = (za + zb) / 2;
        put(new THREE.BoxGeometry(.25, 1.25, L + .1), 'plaster', xm, (ya + yb) / 2 + .45, zm, -pitch, yaw); put(new THREE.BoxGeometry(.33, .07, L + .12), 'cope', xm, (ya + yb) / 2 + 1.1, zm, -pitch, yaw); }
      if (i < steps.length) { const l = steps[i]; put(new THREE.BoxGeometry(.25, 1.0, l.run + .02), 'plaster', l.x0 - .125, l.y + .45, l.z); put(new THREE.BoxGeometry(.33, .07, l.run + .04), 'cope', l.x0 - .125, l.y + .98, l.z); }
      f0 = i + 1; } }
  const st = steps[steps.length - 1], stairTop = { x: st.x, z: st.z, y: st.y };
  // the lookout: a plastered hut on the east top near the mouth, its door landward (+x), its window to the sea (+z) with the lamp in it
  const LZ = 62, LX = W(LZ) + CW + 6, LY = ground(LX, LZ), LW = 3.2, LH = 2.7, look = { x: +LX.toFixed(2), z: LZ, y: +LY.toFixed(2), w: LW };
  { const yb = Math.min(...[[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([u, v]) => ground(LX + u * LW / 2, LZ + v * LW / 2))) - .2; put(new THREE.BoxGeometry(LW, LH + (LY - yb), LW), 'plaster', LX, yb + (LH + LY - yb) / 2, LZ);
    put(new THREE.BoxGeometry(LW + .2, .2, LW + .2), 'cope', LX, LY + LH + .1, LZ); put(new THREE.BoxGeometry(.06, 1.9, .85), 'door', LX + LW / 2 + .02, LY + .95, LZ);
    put(new THREE.PlaneGeometry(.7, .8), 'dark', LX, LY + 1.5, LZ + LW / 2 + .02); put(new THREE.SphereGeometry(.12, 10, 8), 'lamp', LX, LY + 1.35, LZ + LW / 2 - .05);
    look.door = { x: +(LX + LW / 2).toFixed(2), w: .85, h: 1.9 }; look.win = { x: LX, y: +(LY + 1.5).toFixed(2), z: LZ + LW / 2 }; }
  M.lamp.emissiveIntensity = lit ? 5 : 0;
  // the boats: a rowing boat drawn up on the shingle, another lying at the slip's foot; a lathe bowl along z, its gunwale, two thwarts
  const boats = []; const boat = (bx, bz, by, ry) => { const BL = 4.0, W2 = .72, pts = []; for (let k = 0; k <= 10; k++) { const t = k / 10; pts.push(new THREE.Vector2(Math.sin(Math.PI * t) ** .6 * W2 + .05, (t - .5) * BL)); }
    const g = new THREE.LatheGeometry(pts, 14, -Math.PI / 2, Math.PI); g.rotateX(Math.PI / 2); g.scale(1, .55, 1); g.rotateY(ry); put(g, 'hull', bx, by + .45, bz, 0, 0, 0, .5);
    for (const t of [-.6, .5]) { const tg = new THREE.BoxGeometry(1.3, .05, .22); tg.rotateY(ry); put(tg, 'wood', bx + Math.sin(ry) * t, by + .35, bz + Math.cos(ry) * t); } boats.push({ x: +bx.toFixed(2), z: +bz.toFixed(2), y: +by.toFixed(2) }); };
  { const bx = 1.2, bz = -1.5; boat(bx, bz, Math.max(ground(bx, bz - 1.6), ground(bx, bz + 1.6), ground(bx, bz)) - .03, .25); }
  boat(slip.x1 + 1.6, slip.z + .4, -.12, 1.45);
  // the cargo before the boathouses: bales, amphorae and casks, each set on the shingle
  const cargo = []; for (let k = 0; k < 13; k++) { const z = -6.4 + k * .75 + (F() - .5) * .3, x = -W(z) + 2.4 + F() * 1.8, gy = ground(x, z), kind = k % 3;
    if (kind === 0) put(new THREE.BoxGeometry(.8, .55, .55), 'bale', x, gy + .275, z, 0, F() * .6); else if (kind === 1) { const pts = [[.02, 0], [.16, .1], [.22, .35], [.2, .6], [.08, .75], [.07, .85], [.1, .88]].map(([u, v]) => new THREE.Vector2(u, v)); put(new THREE.LatheGeometry(pts, 10), 'clay', x, gy, z); }
    else put(new THREE.CylinderGeometry(.3, .3, .8, 12), 'wood', x, gy + .4, z); cargo.push({ x: +x.toFixed(2), z: +z.toFixed(2), y: +gy.toFixed(3), kind }); }
  const group = new THREE.Group(); let tris = 0; for (const [k, gs] of B) { const g = mergeGeometries(gs, false); gs.forEach(x => x.dispose()); const m = new THREE.Mesh(g, M[k]); m.name = k; m.castShadow = !['sea', 'dark', 'ground', 'bed', 'shingle'].includes(k); m.receiveShadow = !['sea', 'dark'].includes(k); group.add(m); tris += g.attributes.position.count / 3; }
  let draws = group.children.length, ship = null;
  if (o.ship !== false) { const S = aurenneSloop({}, stream(key + ':sloop')); const sail = S.group.getObjectByName('sail'); if (sail) { S.tris -= sail.geometry.attributes.position.count / 3; S.group.remove(sail); S.draws--; } /* at anchor: the sail is down */
    S.group.position.set(-1.5, 0, 40); S.group.rotation.y = .12; group.add(S.group); tris += S.tris; draws += S.draws; ship = { x: -1.5, z: 40, L: 13, W: 4.4, draft: 1.05 }; }
  return { group, tris: Math.round(tris), draws, top: +new THREE.Box3().setFromObject(group).max.y.toFixed(2), W, coast, plateau: PT, cliff: CW, ground, bed, D, sea: 0, steps, stairTop, houses, slip, boats, cargo, lookout: look, ship, lit };
}

// ── the Gatelands' falls: overgrown arches by a waterfall and the cave behind it (Session 1008, card F8; OG-124's Gatelands panel,
// "overgrown arches by a waterfall" and "a cave behind falls"). The precedents: Glencar and Ess-na-Larach (a fall of 12 to 15 m off a
// limestone head-wall into a pool in a wooded glen, shale bands undercutting the face), Seljalandsfoss (the path that goes behind the
// curtain under the overhang), and Glendalough by the Poulanass fall (a ruined arcade in the trees below the water). Whose the arcade was
// is the quest writer's to say; it is drawn as the north arcade of a hall long gone, the rest of it fallen. Built at true size, a metre a
// unit, the fall to -z, the stream flowing out to +z, y 0 the pool's water:
//   - the head-wall: a face of grey limestone 11 to 12 m high in a shallow horseshoe, banded where the beds weather back, undercut 2.4 m
//     round the fall so its lip overhangs the shelf below; dark and wet by the water, moss and ivy on the rest; the glen's sides rise to it;
//   - the fall: the river leaves the lip 5 m wide and falls 11.7 m in a curtain that lands 3 m out from the lip, in a pool 12 m across and
//     2.6 m deep, foam at its foot; the stream runs out of the pool down the glen;
//   - the shelf: a ledge of rock 1.2 m over the pool along the foot of the face, from the east bank behind the curtain to the cave;
//   - the cave: a mouth 3.4 m wide and 3.2 m high in the face behind the curtain, narrowing over 10 m to 2.6 m by 2.5, going on into the dark;
//   - the arcade: three round arches of 2.8 m on piers 1 m square, springing at 3 m, the wall standing to 5 to 6 m with its top ragged, a
//     fourth arch fallen with its voussoirs in the grass and its far pier a stump; ivy over the wall and hanging in the bays; the path from
//     down the glen goes through its first bay, so the fall is first seen framed by the arch;
//   - the glen: oak and ash on its sides and over the lip, ferns by the water and under the face.
// -> { group, tris, draws, top, LIP, LY, faceZ(x), footZ(x), floorH(x, z), topH(x, z), fall { x, w, lipY, at(y) (the curtain's z at a height),
//   foot }, pool { x, z, rx, rz, deep }, stream { x(z), y(z) }, shelf { x0, x1 }, cave { x, hw, spring, crown, depth, z0, throat { hw, crown },
//   hwAt(z), crownAt(z) }, arcade { z, y, t, spring, piers [{ x0, x1 }], bays [{ x0, x1, crown, standing }], fallen }, path [[x, z]], trees [{ x, z, h }] }
export function gatelandsFalls(o = {}, r = stream('falls')) {
  const std = (c, ro = .9, x = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: ro, ...x });
  const MI = millMats(), M = { turf: MI.turf, track: mat('turfDry', { ns: 1.0, color: 0xa89878, rough: 1 }), rock: mat('rock', { ns: 1.2, color: 0x9a978e, rough: .95 }),
    wet: mat('rock', { ns: 1.3, color: 0x6c6c64, rough: .55 }), moss: mat('rock', { ns: 1.2, color: 0x6e7e4a, rough: 1 }), cave: mat('rock', { ns: 1.4, color: 0x5e5c55, rough: .6 }),
    stone: mat('cobble', { ns: 1.3, color: 0xaaa696, rough: .95 }), dress: mat('ashlar', { ns: 1.0, color: 0xbab4a2, rough: .9 }),
    water: std(0x2c3c38, .06, { metalness: .2 }), fall: std(0xdce8e8, .3, { transparent: true, opacity: .55, side: THREE.DoubleSide, emissive: new THREE.Color(0x1c2424) }),
    strand: std(0xf2f8f6, .25, { transparent: true, opacity: .85, side: THREE.DoubleSide, emissive: new THREE.Color(0x2a3030) }), foam: std(0xf0f4f2, .5),
    dark: new THREE.MeshBasicMaterial({ color: 0x050605, side: THREE.DoubleSide }), bark: std(0x5a544a, .9), leaf: std(0x4e6a2c, .85), leaf2: std(0x6a7a34, .85),
    ivy: std(0x2e4a22, .7), fern: std(0x4a7a2c, .9, { side: THREE.DoubleSide }) };
  M.rock.side = M.wet.side = M.moss.side = M.cave.side = THREE.DoubleSide;
  const B = new Map(), key = String(o.key || 'falls'), F = stream(key + ':lie'), ph = Array.from({ length: 12 }, () => F() * 6.283);
  const put = (geo, k, x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0, uv = .5) => { const g = geo.index ? geo.toNonIndexed() : geo; for (const a of Object.keys(g.attributes)) if (!['position', 'normal'].includes(a)) g.deleteAttribute(a);
    if (!g.attributes.normal) g.computeVertexNormals(); g.applyMatrix4(new THREE.Matrix4().compose(new THREE.Vector3(x, y, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(rx, ry, rz, 'YXZ')), new THREE.Vector3(1, 1, 1))); worldUV(g, uv);
    if (!B.has(k)) B.set(k, []); B.get(k).push(g); return g; };
  const rod = (k, a, b, rad, seg = 6) => { const A = new THREE.Vector3(...a), C = new THREE.Vector3(...b), d = C.clone().sub(A), g = new THREE.CylinderGeometry(rad * .7, rad, d.length(), seg);
    g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.clone().normalize())); g.translate((A.x + C.x) / 2, (A.y + C.y) / 2, (A.z + C.z) / 2); return put(g, k); };
  const tri = (k, pos) => { const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.computeVertexNormals(); put(g, k, 0, 0, 0, 0, 0, 0, .3); };
  const sm = t => { t = Math.min(1, Math.max(0, t)); return t * t * (3 - 2 * t); };
  // a grid of points shaded smooth across its kept quads (as markIceMouth's), each quad to the material keyOf(i, j) names, null drops it
  const smoothGrid = (P, keyOf) => { const nj = P.length, ni = P[0].length, N = P.map(row => row.map(() => [0, 0, 0])), keep = [];
    const cr = (p, q, w) => { const u = [q[0] - p[0], q[1] - p[1], q[2] - p[2]], v = [w[0] - p[0], w[1] - p[1], w[2] - p[2]]; return [u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0]]; };
    for (let j = 0; j + 1 < nj; j++) for (let i = 0; i + 1 < ni; i++) { const k = keyOf(i, j); if (!k) continue; keep.push([i, j, k]); const n = cr(P[j][i], P[j + 1][i], P[j][i + 1]), n2 = cr(P[j][i + 1], P[j + 1][i], P[j + 1][i + 1]);
      for (const [jj, ii, nn] of [[j, i, n], [j + 1, i, n], [j, i + 1, n], [j, i + 1, n2], [j + 1, i, n2], [j + 1, i + 1, n2]]) { const t = N[jj][ii]; t[0] += nn[0]; t[1] += nn[1]; t[2] += nn[2]; } }
    const out = {}; for (const [i, j, k] of keep) { const q = out[k] || (out[k] = { p: [], n: [] }); for (const [jj, ii] of [[j, i], [j + 1, i], [j, i + 1], [j, i + 1], [j + 1, i], [j + 1, i + 1]]) { q.p.push(...P[jj][ii]); const t = N[jj][ii], L = Math.hypot(...t) || 1; q.n.push(t[0] / L, t[1] / L, t[2] / L); } }
    for (const k in out) { const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(out[k].p, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(out[k].n, 3)); put(g, k, 0, 0, 0, 0, 0, 0, .3); } };
  // the head-wall's line: a shallow horseshoe through z 0 at the fall, wandering a little; undercut round the fall and the shelf
  const LIP = 12, LY = 1.2, FX = 0, FW = 5, CX = -1.5;
  const fz0 = 1.2 * Math.sin(ph[0]) + .6 * Math.sin(ph[1]), faceZ = x => 1.2 * Math.sin(x * .09 + ph[0]) + .6 * Math.sin(x * .23 + ph[1]) - fz0 + .012 * x * x;
  const U = x => 2.4 * sm((x + 7) / 2.5) * sm((10 - x) / 2.5), footZ = x => faceZ(x) - U(x);
  // the plateau over the lip: rising gently back, the river's channel cut in it to the lip
  const topH = (x, z) => LIP + .35 * Math.sin(x * .13 + ph[2]) * Math.sin(z * .11 + ph[3]) * sm((Math.abs(x - FX) - 3) / 2) + .015 * Math.max(0, faceZ(x) - z) - .7 * sm((3.0 - Math.abs(x - FX)) / .8);
  const riverY = z => LIP - .3 + .01 * Math.max(0, faceZ(FX) - z);
  // the glen: its floor falling 1 in 30 from the pool, its sides rising to the plateau; the pool; the stream out of it; the shelf; the arcade's pad
  const PX = 0, PZ = 5.0, RX = 6.0, RZ = 4.8, PD = 2.6, AZ = 17, OUT = PZ + RZ - 1;
  const SX = z => -.8 + 1.4 * Math.sin(z * .09 + ph[4]) * sm((z - OUT) / 6);
  const waterY = z => z < OUT ? 0 : Math.min(0, .15 - .033 * Math.max(0, z - 6)) /* 0.3 m under the glen's line, as the floor falls */;
  const glen = (x, z) => .45 - .033 * Math.max(0, z - 6) + .08 * Math.sin(x * .7 + ph[5]) * Math.sin(z * .6 + ph[6]);
  const AY = .45 - .033 * (AZ - 6), padW = (x, z) => sm((x - 2.2) / .8) * sm((20.5 - x) / 1.2) * sm((2.6 - Math.abs(z - AZ)) / 1.2);
  const shelfW = x => sm((10 - x) / 3.5) * sm((x + 7) / 1.5);
  const floorH = (x, z) => { let f = glen(x, z); const q = ((x - PX) / RX) ** 2 + ((z - PZ) / RZ) ** 2; f -= PD * sm((1 - q) / .55);
    if (z > OUT - 2) f -= .55 * Math.exp(-(((x - SX(z)) / 1.3) ** 2)) * sm((z - OUT + 2) / 2);
    const pw = padW(x, z); if (pw > 0) f = f * (1 - pw) + AY * pw;
    const w = shelfW(x); if (w > 0) { const d = z - footZ(x), e = d <= U(x) ? 1 : sm(1 - (d - U(x)) / 1.9), sh = f * (1 - e) + LY * e; f = f * (1 - w) + Math.max(f, sh) * w; }
    const sd = sm((Math.abs(x) - 17) / 10); return f * (1 - sd) + topH(x, z) * sd; };
  // the floor: fine round the pool, the arcade and the path, coarse beyond; rock where steep, the shelf and the pool's lip rock, turf elsewhere
  { const steps = (bands, end) => { const v = []; for (const [a, b, st] of bands) for (let q = a; q < b - 1e-6; q += st) v.push(+q.toFixed(2)); v.push(end); return v; };
    const xs = steps([[-44, -12, 2.5], [-12, 21, .8], [21, 44, 2.5]], 44), zs = steps([[-4, 32, .8], [32, 70, 3]], 70);
    const P = zs.map(z => xs.map(x => [x, floorH(x, z), z]));
    smoothGrid(P, (i, j) => { const a = P[j][i], b = P[j][i + 1], c = P[j + 1][i], d = P[j + 1][i + 1], cx = (a[0] + d[0]) / 2, cz = (a[2] + d[2]) / 2;
      if (cz < footZ(cx) - .4) return null; const sl = Math.hypot(b[1] - a[1], c[1] - a[1]) / Math.min(b[0] - a[0], c[2] - a[2]), hi = Math.max(a[1], b[1], c[1], d[1]);
      if (shelfW(cx) > .3 && cz < faceZ(cx) + .5 && hi > .6) return Math.abs(cx - FX) < FW / 2 + 2 ? 'wet' : 'rock';
      return sl > 1.25 ? 'rock' : hi < .15 && ((cx - PX) / RX) ** 2 + ((cz - PZ) / RZ) ** 2 < 1.1 ? 'wet' : 'turf'; }); }
  // the plateau: rows back from the lip, per column, so its edge follows the face's
  { const xs = []; for (let x = -44; x < -8; x += 2.5) xs.push(x); for (let x = -8; x < 8; x += .5) xs.push(x); for (let x = 8; x <= 44; x += 2.5) xs.push(x);
    const P = []; for (let j = 0; j <= 22; j++) P.push(xs.map(x => { const z = faceZ(x) + .05 - (j < 12 ? j * 1.0 : 12 + (j - 12) * 5); return [x, topH(x, z), z]; }).reverse());
    smoothGrid(P, (i, j) => { const a = P[j][i]; return Math.abs(a[0] - FX) < 3.4 && j < 12 ? 'rock' : 'turf'; }); }
  // the face: columns along x, rows up from the shelf or the floor to the lip; beds weathering back in bands; the arch of the cave cut out
  const CHW = 1.7, CSP = 1.9, CCR = 3.2, CTW = 1.3, CTC = 2.5, CL = 10;
  const inArch = (x, y, m = 0) => { const hw = CHW - m, yy = y - LY; if (Math.abs(x - CX) > hw || yy < -.6) return false; return yy < CSP - m || (((x - CX) / hw) ** 2 + ((yy - CSP) / (CCR - CSP - m)) ** 2) < 1; };
  const faceFoot = x => floorH(x, footZ(x) + .05) - .4, faceTop = x => topH(x, faceZ(x) + .05);
  const facePt = (x, v) => { const g0 = faceFoot(x), T = faceTop(x), y = g0 + (T - g0) * v;
    const beds = (.24 * Math.sin(y * 1.9 + ph[7]) + .12 * Math.sin(y * 4.3 + ph[8]) + .22 * Math.sin(x * .8 + ph[9]) * Math.sin(y * .7 + ph[10])) * Math.min(1, (y - g0) / 1.2) * sm((.97 - v) / .1)
      * (y < LY + 4.5 ? sm((Math.abs(x - CX) - CHW - .3) / 1.2) * .7 + .3 : 1);
    return [x, y, faceZ(x) - U(x) * (1 - Math.pow(v, 1.6)) + beds]; };
  const wetX = x => Math.abs(x - FX) < FW / 2 + 2.2;
  { const NX = 116, NV = 30, cols = []; for (let i = 0; i <= NX; i++) { const x = -34 + 68 * i / NX, col = []; for (let j = 0; j <= NV; j++) col.push(facePt(x, j < 12 ? j / 12 * .4 : .4 + (j - 12) / (NV - 12) * .6)); cols.push(col); }
    const P = []; for (let j = 0; j <= NV; j++) P.push(cols.map(c => c[j]).reverse());
    smoothGrid(P, (i, j) => { const a = P[j][i], d = P[j + 1][i + 1], cx = (a[0] + d[0]) / 2, cy = (a[1] + d[1]) / 2; if (inArch(cx, cy) || Math.max(a[1], d[1]) < floorH(cx, faceZ(cx) + .5) - .3 && U(cx) < .1) return null;
      return wetX(cx) ? 'wet' : Math.sin(cx * .7 + ph[11]) * Math.sin(cy * .9 + ph[3]) > .25 || cy > faceTop(cx) - 1.2 ? 'moss' : 'rock'; }); }
  // the cave: rings of its arch from the mouth into the hill, narrowing to the throat, then the dark; a surround behind the face's cut
  const CZ0 = footZ(CX) + .35, tAt = z => sm((CZ0 - z) / CL), hwAt = z => CHW + (CTW - CHW) * tAt(z), crownAt = z => CCR + (CTC - CCR) * tAt(z);
  { const NR = 20, NA = 20, rings = []; for (let i = 0; i <= NR; i++) { const z = CZ0 - CL * i / NR, hw = hwAt(z), cr = crownAt(z), ring = [], w = (x, y) => .12 * Math.sin(x * 2.1 + z * 1.3 + ph[5]) * Math.sin(y * 1.7 + z * .9) * (i ? 1 : 0);
      ring.push([CX - hw, LY - .3, z]); for (let k = 0; k <= NA; k++) { const th = Math.PI * (1 - k / NA), x = hw * Math.cos(th), y = LY + CSP + (cr - CSP) * Math.sin(th); if (k === 0) ring.push([CX - hw - w(-hw, 1), LY + CSP * .5, z]);
        ring.push([CX + x + w(x, y) * Math.cos(th), y + w(x, y) * Math.sin(th), z]); if (k === NA) ring.push([CX + hw + w(hw, 1), LY + CSP * .5, z]); } ring.push([CX + hw, LY - .3, z]); rings.push(ring); }
    const out = { wet: [], cave: [] }; for (let i = 0; i < NR; i++) { const k = i < 6 ? 'wet' : 'cave'; for (let j = 0; j + 1 < rings[i].length; j++) { const a = rings[i][j], b = rings[i][j + 1], c = rings[i + 1][j], d = rings[i + 1][j + 1]; out[k].push(...a, ...c, ...b, ...b, ...c, ...d); } }
    for (const k in out) tri(k, out[k]);
    const fl = []; for (let i = 0; i < NR; i++) { const z0 = CZ0 - CL * i / NR + (i ? 0 : .3), z1 = CZ0 - CL * (i + 1) / NR, h0 = hwAt(z0) + .1, h1 = hwAt(z1) + .1; fl.push(CX - h0, LY, z0, CX + h0, LY, z0, CX - h1, LY, z1, CX - h1, LY, z1, CX + h0, LY, z0, CX + h1, LY, z1); } tri('cave', fl);
    { const z = CZ0 - CL, hw = hwAt(z), cr = crownAt(z), s = new THREE.Shape(); s.moveTo(-hw - .2, -.3); s.lineTo(-hw - .2, CSP); s.absellipse(0, CSP, hw + .2, cr - CSP + .2, Math.PI, 0, true); s.lineTo(hw + .2, -.3); s.lineTo(-hw - .2, -.3);
      const g = new THREE.ShapeGeometry(s, 12); g.translate(CX, LY, z - .05); put(g, 'dark'); }
    const sur = [], NA2 = 24, ring = (m, dz) => { const pts = [[CX - CHW - m, LY - .2, CZ0 + dz]]; for (let k = 0; k <= NA2; k++) { const th = Math.PI * (1 - k / NA2); pts.push([CX + (CHW + m) * Math.cos(th), LY + CSP + (CCR - CSP + m) * Math.sin(th), CZ0 + dz]); } pts.push([CX + CHW + m, LY - .2, CZ0 + dz]); return pts; };
    const A = ring(0, 0), C = ring(.8, -.25); for (let k = 0; k + 1 < A.length; k++) sur.push(...A[k], ...A[k + 1], ...C[k], ...C[k], ...A[k + 1], ...C[k + 1]); tri('wet', sur); }
  // the river on the plateau to the lip, and the stream in the glen from the pool; the pool's water
  { const pos = []; let prev = null; for (let z = faceZ(FX) + .02; z >= -60; z -= z > -12 ? 1 : 4) { const y = riverY(z), row = [[FX - FW / 2 - .3, y, z], [FX, y, z], [FX + FW / 2 + .3, y, z]]; if (prev) for (let k = 0; k < 2; k++) pos.push(...prev[k], ...prev[k + 1], ...row[k], ...prev[k + 1], ...row[k + 1], ...row[k]); prev = row; } tri('water', pos); }
  { const pos = []; let prev = null; for (let z = OUT - 1.5; z <= 70; z += z < 32 ? .5 : 2) { const x = SX(z), y = waterY(z), row = [[x - 1.05, y, z], [x, y, z], [x + 1.05, y, z]]; if (prev) for (let k = 0; k < 2; k++) pos.push(...prev[k], ...row[k], ...prev[k + 1], ...prev[k + 1], ...row[k], ...row[k + 1]); prev = row; } tri('water', pos);
    const g = new THREE.CircleGeometry(1, 40); g.rotateX(-Math.PI / 2); g.scale(RX * .98, 1, RZ * .98); put(g, 'water', PX, 0, PZ); }
  // the fall: the river leaves the lip at 2 m/s and falls freely, a sheet behind and strands over it, widening as it falls; foam at its foot
  const V = 2.0, LIPY = riverY(faceZ(FX)), tEnd = Math.sqrt(LIPY / 4.9), fallAt = y => faceZ(FX) + .05 + V * Math.sqrt(Math.max(0, LIPY - y) / 4.9);
  { const NR = 22, sheet = []; const pt = (u, t, dz = 0) => { const w = FW / 2 * (1 + .14 * t / tEnd), x = FX + u * w; return [x, LIPY - 4.9 * t * t, faceZ(x) + .05 + V * t + dz]; };
    for (let i = 0; i < NR; i++) for (let c = 0; c < 8; c++) { const t0 = tEnd * (i / NR) ** 1.3, t1 = tEnd * ((i + 1) / NR) ** 1.3, u0 = -1 + c / 4, u1 = -1 + (c + 1) / 4, a = pt(u0, t0, -.1), b = pt(u1, t0, -.1), d = pt(u0, t1, -.1), e = pt(u1, t1, -.1); sheet.push(...a, ...d, ...b, ...b, ...d, ...e); }
    tri('fall', sheet); const st = []; for (let s = 0; s < 34; s++) { const u = -1 + 2 * F(), wd = .12 + F() * .32, wob = F() * 6, off = F() * .12;
      for (let i = 0; i < NR; i++) { const t0 = tEnd * (i / NR) ** 1.3, t1 = tEnd * ((i + 1) / NR) ** 1.3, wu = q => u + .03 * Math.sin(q * 5 + wob), a = pt(wu(t0), t0, off), d = pt(wu(t1), t1, off), sw0 = wd * (1 + t0 * .5) / 2, sw1 = wd * (1 + t1 * .5) / 2;
        st.push(a[0] - sw0, a[1], a[2], d[0] - sw1, d[1], d[2], a[0] + sw0, a[1], a[2], a[0] + sw0, a[1], a[2], d[0] - sw1, d[1], d[2], d[0] + sw1, d[1], d[2]); } }
    tri('strand', st);
    for (let k = 0; k < 34; k++) { const x = FX + (F() - .5) * FW * 1.4, z = fallAt(0) + (F() - .5) * 2.4, s = .18 + F() * .3; put(new THREE.IcosahedronGeometry(s, 0).scale(1.4, .22, 1.2), 'foam', x, .03, z, 0, F() * 3); } }
  // the arcade: piers and three arches in one wall, its top ragged and broken at the east end; dressed voussoirs round each arch; the fourth fallen
  const AT = .9, PW = 1.0, SPAN = 2.8, SPR = 3.0, ARX = 3.0, piers = [], bays = []; for (let k = 0; k < 5; k++) piers.push({ x0: ARX + k * (PW + SPAN), x1: ARX + k * (PW + SPAN) + PW });
  for (let k = 0; k < 4; k++) bays.push({ x0: piers[k].x1, x1: piers[k + 1].x0, crown: +(AY + SPR + SPAN / 2).toFixed(3), standing: k < 3 });
  { const base = AY - .35, s = new THREE.Shape(), E = piers[3].x1; s.moveTo(ARX, base);
    const tops = []; for (let x = ARX; x <= E + 1e-6; x += .45) { const t = (x - ARX) / (E - ARX); tops.push([x, AY + 5.5 + .35 * Math.sin(x * 1.7 + ph[6]) + (F() - .5) * .3 - 1.1 * sm((t - .78) / .22) - (t > .4 && t < .52 ? .55 : 0)]); }
    for (const [x, y] of tops) s.lineTo(x, y); s.lineTo(E, base);
    for (let k = 2; k >= 0; k--) { const b = bays[k], cx = (b.x0 + b.x1) / 2; s.lineTo(b.x1, base); s.lineTo(b.x1, AY + SPR); for (let a = 1; a < 16; a++) { const th = Math.PI * a / 16; s.lineTo(cx + SPAN / 2 * Math.cos(th), AY + SPR + SPAN / 2 * Math.sin(th)); } s.lineTo(b.x0, AY + SPR); s.lineTo(b.x0, base); }
    s.lineTo(ARX, base); const g = new THREE.ExtrudeGeometry(s, { depth: AT, bevelEnabled: false }); g.translate(0, 0, AZ - AT / 2); put(g, 'stone', 0, 0, 0, 0, 0, 0, .9);
    for (let k = 0; k < 3; k++) { const b = bays[k], cx = (b.x0 + b.x1) / 2, R = SPAN / 2 + .2; for (let a = 0; a < 11; a++) { const th = Math.PI * (a + .5) / 11; put(new THREE.BoxGeometry(.4, .36, AT + .08), 'dress', cx + R * Math.cos(th), AY + SPR + R * Math.sin(th), AZ, 0, 0, th - Math.PI / 2, .9); } }
    for (const p of piers.slice(0, 4)) put(new THREE.BoxGeometry(PW + .16, .22, AT + .16), 'dress', (p.x0 + p.x1) / 2, AY + SPR - .11, AZ, 0, 0, 0, .9);
    const st = piers[4]; put(new THREE.BoxGeometry(PW, 1.6 + .35, AT), 'stone', (st.x0 + st.x1) / 2, AY + (1.6 - .35) / 2, AZ, 0, 0, 0, .9); }
  const fallen = []; { const b = bays[3]; for (let k = 0; k < 12; k++) { const x = b.x0 + .3 + F() * (SPAN + 1.6), z = AZ + (F() - .5) * 4.2, ry = F() * 3, tilt = (F() - .5) * .5; if (Math.abs(z - AZ) < AT / 2 + .3 && x < b.x1 + .1) continue;
    fallen.push([+x.toFixed(2), +z.toFixed(2)]); put(new THREE.BoxGeometry(.4, .36, AT * .9), F() < .6 ? 'dress' : 'stone', x, floorH(x, z) + .12, z, tilt, ry, (F() - .5) * .4, .9); } }
  // the path: from down the glen through the first bay, by the pool's east bank, onto the shelf at its east end, behind the fall to the cave
  const b0 = bays[0], BX = (b0.x0 + b0.x1) / 2, path = [[BX + .4, 34], [BX + .2, 24], [BX, AZ], [BX + .3, 12.5], [7.4, 8.0], [7.8, faceZ(7.8) + 3.2], [7.6, faceZ(7.6) + .6], [6.6, faceZ(6.6) - .9], [3.0, faceZ(3.0) - .9], [CX, faceZ(CX) - .9], [CX, footZ(CX) - 4]];
  const segD = (x, z, a, b) => { const dx = b[0] - a[0], dz = b[1] - a[1], t = Math.max(0, Math.min(1, ((x - a[0]) * dx + (z - a[1]) * dz) / (dx * dx + dz * dz))); return Math.hypot(x - a[0] - dx * t, z - a[1] - dz * t); };
  const pathD = (x, z) => Math.min(...path.slice(0, -1).map((p, i) => segD(x, z, p, path[i + 1])));
  { const pts = []; const OFF = 5 /* the worn track stops where the shelf's rock begins */; for (let i = 0; i < OFF; i++) { const [a, b] = [path[i], path[i + 1]], L = Math.hypot(b[0] - a[0], b[1] - a[1]), n = Math.ceil(L / .35); for (let k = i ? 1 : 0; k <= n; k++) pts.push([a[0] + (b[0] - a[0]) * k / n, a[1] + (b[1] - a[1]) * k / n]); }
    const pos = [], idx = []; pts.forEach(([x, z], i) => { const [p, q] = [pts[Math.max(0, i - 1)], pts[Math.min(pts.length - 1, i + 1)]], dx = q[0] - p[0], dz = q[1] - p[1], l = Math.hypot(dx, dz), w = .42 + .1 * Math.sin(i * .6 + ph[7]);
      for (const sd of [-1, -.5, 0, .5, 1]) { const ex = x - dz / l * w * sd, ez = z + dx / l * w * sd; pos.push(ex, floorH(ex, ez) + .035, ez); } if (i) { const o2 = (i - 1) * 5; for (let c = 0; c < 4; c++) idx.push(o2 + c, o2 + c + 5, o2 + c + 1, o2 + c + 1, o2 + c + 5, o2 + c + 6); } });
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals(); if (g.attributes.normal.array[1] < 0) { g.setIndex(idx.map((v, j) => idx[j - j % 3 + [0, 2, 1][j % 3]])); g.computeVertexNormals(); } put(g, 'track', 0, 0, 0, 0, 0, 0, .35); }
  // ivy: over the wall's top and down its faces and the piers, and hanging in the bays where it leaves 2.2 m clear; on the face, off the wet
  const ivyAt = (x, y, z, s) => put(new THREE.IcosahedronGeometry(s, 0).scale(1.2, .9, .55), 'ivy', x, y, z, F() * .5, F() * 3, F() * .5);
  { const E = piers[3].x1; for (let k = 0; k < 85; k++) { const x = ARX + F() * (E - ARX), side = F() < .5 ? -1 : 1, top = AY + 5.0 + .35 * Math.sin(x * 1.7 + ph[6]) - 1.1 * sm(((x - ARX) / (E - ARX) - .78) / .22), y = top - F() * F() * 4.2;
      const bay = bays.slice(0, 3).find(b => x > b.x0 - .05 && x < b.x1 + .05), cx = bay ? (bay.x0 + bay.x1) / 2 : 0, intra = bay ? AY + SPR + Math.sqrt(Math.max(0, (SPAN / 2) ** 2 - (x - cx) ** 2)) : -9; if (bay && y < intra + .25) continue;
      ivyAt(x, y, AZ + side * (AT / 2 + .05), .16 + F() * .14); }
    for (let k = 0; k < 30; k++) { const x = ARX + F() * (E - ARX); ivyAt(x, AY + 5.0 + .35 * Math.sin(x * 1.7 + ph[6]) - 1.1 * sm(((x - ARX) / (E - ARX) - .78) / .22) + .12, AZ + (F() - .5) * AT, .24 + F() * .16); }
    for (const b of bays.slice(0, 3)) { const cx = (b.x0 + b.x1) / 2; for (let k = 0; k < 9; k++) { const x = cx + (F() - .5) * SPAN * .8, top = AY + SPR + Math.sqrt((SPAN / 2) ** 2 - (x - cx) ** 2) - .05, L = Math.min(.4 + F() * 1.4, top - AY - 2.25), z = AZ + (F() - .5) * AT * .8;
      if (L < .2) continue; put(new THREE.BoxGeometry(.012, L, .012), 'ivy', x, top - L / 2, z); for (let j = 0; j < Math.ceil(L / .3); j++) put(new THREE.IcosahedronGeometry(.08, 0).scale(1.3, .8, .5), 'ivy', x + (F() - .5) * .05, top - j * .3 - .05, z, 0, F() * 3); } }
    for (const p of piers.slice(0, 4)) for (let k = 0; k < 6; k++) ivyAt(p.x0 + F() * PW, AY + F() * 2.6, AZ + (F() < .5 ? -1 : 1) * (AT / 2 + .05), .14 + F() * .1);
    for (let k = 0, n = 0; k < 400 && n < 55; k++) { const x = -26 + F() * 52, v = .15 + F() * .85; if (wetX(x) || Math.abs(x - CX) < CHW + .8 && v < .45) continue; const p = facePt(x, v); if (p[1] - faceFoot(x) < 1.5) continue; n++;
      put(new THREE.IcosahedronGeometry(.2 + F() * .25, 0).scale(1.4, 1, .45), 'ivy', p[0], p[1], p[2] + .1, 0, F() * .6 - .3, 0); } }
  // trees: oak and ash on the glen's sides and over the lip, off the pool, the stream, the path, the arcade and the face's foot
  const trees = [], clearOf = (x, z, m) => pathD(x, z) < m || ((x - PX) / (RX + m)) ** 2 + ((z - PZ) / (RZ + m)) ** 2 < 1 || (z > OUT - 2 && Math.abs(x - SX(z)) < 1.6 + m) || (Math.abs(z - AZ) < 1.5 + m && x > ARX - m && x < piers[4].x1 + m);
  for (let k = 0, n = 0; k < 900 && n < 20; k++) { const x = -32 + F() * 64, z = -24 + F() * 66, fz = faceZ(x); if (z > fz - 3 && z < fz + 3.5) continue; if (z < fz && Math.abs(x - FX) < 5) continue;
    if (clearOf(x, z, 2.4) || trees.some(t => Math.hypot(t.x - x, t.z - z) < 4.5)) continue; const gy = z < fz ? topH(x, z) : floorH(x, z); if (z > fz && gy > LIP + 1) continue; n++;
    const h = 7 + F() * 5, lean = [(F() - .5) * .8, (F() - .5) * .8], top = [x + lean[0], gy + h * .45, z + lean[1]]; rod('bark', [x, gy - .3, z], top, .16 + h * .012, 7);
    const ash = F() < .4; for (let l = 0; l < 4; l++) { const a = l * 1.6 + F(), L = 1.4 + F() * 1.2, e = [top[0] + Math.cos(a) * L, top[1] + .6 + l * .5 + F() * 1.2, top[2] + Math.sin(a) * L]; rod('bark', [top[0], top[1] - .4 + l * .2, top[2]], e, .07, 5);
      for (let c = 0; c < 4; c++) put(new THREE.IcosahedronGeometry(.85 + F() * .6, 0).scale(1.2, .75, 1.2), ash ? 'leaf2' : 'leaf', e[0] + (F() - .5) * 1.6, e[1] + (F() - .4) * 1.4, e[2] + (F() - .5) * 1.6, F(), F() * 3, 0); }
    put(new THREE.IcosahedronGeometry(1.4, 0).scale(1.2, .8, 1.2), ash ? 'leaf2' : 'leaf', top[0], gy + h * .8, top[2]); trees.push({ x: +x.toFixed(2), z: +z.toFixed(2), h: +h.toFixed(2), gy: +gy.toFixed(2) }); }
  // ferns: by the water, under the face, at the arcade's foot; off the path and out of the cave
  const frond = (x, gy, z, n, len) => { const a0 = F() * 6.283; for (let j = 0; j < n; j++) { const a = a0 + j * 6.283 / n + (F() - .5) * .3, L = len * (.8 + F() * .4), pos = []; let px = 0, py = 0, pa = .9 + F() * .2; const ring = [];
      for (let s = 0; s <= 3; s++) { ring.push([px, py, .1 * (1 - s / 3.4)]); px += Math.cos(pa) * L / 3; py += Math.sin(pa) * L / 3; pa -= .5; }
      for (let s = 0; s < 3; s++) { const [x0, y0, w0] = ring[s], [x1, y1, w1] = ring[s + 1]; pos.push(x0, y0, -w0, x1, y1, -w1, x0, y0, w0, x0, y0, w0, x1, y1, -w1, x1, y1, w1); }
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.computeVertexNormals(); put(g, 'fern', x, gy - .02, z, 0, a, 0); } };
  for (let k = 0, n = 0; k < 2500 && n < 64; k++) { const x = -14 + F() * 32, z = -2.6 + F() * 26; if (pathD(x, z) < .9 || (z < 0 && Math.abs(x - CX) < CHW + .5)) continue;
    const gy = floorH(x, z); if (gy < .12 || z < footZ(x) + .3 || (z > OUT - 2 && Math.abs(x - SX(z)) < 1.4) || (Math.abs(z - AZ) < AT / 2 + .2 && x > ARX - .2 && x < piers[4].x1 + .2)) continue;
    const near = Math.abs(Math.sqrt(((x - PX) / RX) ** 2 + ((z - PZ) / RZ) ** 2) - 1) < .25 || z < faceZ(x) + 1.5 || Math.abs(z - AZ) < 2.2; if (!near && F() > .25) continue; n++; frond(x, gy, z, 6 + Math.floor(F() * 3), .55 + F() * .35); }
  const group = new THREE.Group(); let tris = 0; for (const [k, gs] of B) { const g = mergeGeometries(gs, false); gs.forEach(x => x.dispose()); const m = new THREE.Mesh(g, M[k]); m.name = k;
    m.castShadow = !['turf', 'track', 'water', 'fall', 'strand', 'foam', 'dark'].includes(k); m.receiveShadow = !['dark', 'fall', 'strand'].includes(k); if (k === 'fall' || k === 'strand') m.renderOrder = 2; group.add(m); tris += g.attributes.position.count / 3; }
  return { group, tris: Math.round(tris), draws: group.children.length, top: +new THREE.Box3().setFromObject(group).max.y.toFixed(2), LIP, LY, faceZ, footZ, floorH, topH, undercut: U,
    fall: { x: FX, w: FW, lipY: +LIPY.toFixed(3), at: fallAt, foot: +fallAt(0).toFixed(3), t: +tEnd.toFixed(3) }, pool: { x: PX, z: PZ, rx: RX, rz: RZ, deep: PD }, stream: { x: SX, y: waterY, out: OUT }, riverY,
    shelf: { x0: -5.5, x1: 8.6 }, cave: { x: CX, hw: CHW, spring: CSP, crown: CCR, depth: CL, z0: CZ0, throat: { hw: CTW, crown: CTC }, hwAt, crownAt },
    arcade: { z: AZ, y: AY, t: AT, spring: SPR, span: SPAN, piers, bays, fallen: fallen.length }, path, trees };
}

// ── the Gatelands' charcoal burners' camp (Session 1016, card F8; OG-124's "camps on the roads: … charcoal burners"). The precedents: the
// colliers of the Lake District's and the Weald's coppices, who lived beside the burn for the weeks of a season: a pitstead (a level hearth
// cut into the slope, its earth black from years of burns), the stack of cordwood built round a central flue and sealed under turf and earth
// (the "sammel"), wattle hurdles set against the wind so it burns slow and even, a ladder to tend the top, and the collier's hut of poles under
// sods with a door frame of two posts and a lintel (Furness, Grizedale). Built at true size, a metre a unit, by a road through oak and hazel
// coppice, the slope rising to -z at about 1 in 14 and the road along x at z 13:
//   - the burning stack: a dome 4.8 m across and 1.9 m high on its pitstead (9.2 m across), sods laid over its earth, twelve vents at its
//     foot and the flue at its top smoking, the smoke leaning south-east from a north-west wind; three hurdles on its windward side, propped;
//     a ladder leaning on its east flank, its top on the sammel;
//   - the opened stack: on the second pitstead, a burn drawn and cooling, a low heap of charcoal raked out over the black ground, a shovel in
//     it, a riddle by it, seven sacks filled and tied and a rake against them;
//   - the cordwood: a stack of billets a metre long, 5 m by 1.2 m high between stakes, on its own levelled stance up the slope;
//   - the hut: a beehive of poles under sods, 3 m across and 2.9 m to its apex, the poles' tops crossed over it, a door 0.8 m wide and 1.6 m
//     high between two posts under a lintel, facing the road; a bed of bracken inside; a small fire before it with a tripod and a pot;
//   - the road: a worn track 3.2 m wide, a two-wheeled cart on it loaded with sacks, its shafts down; trodden paths from it to the hearths
//     and the hut; oak standards over hazel stools, some cut this winter for the burn, bracken under them.
// -> { group, tris, draws, own, ground(x, z), pits [{ x, z, r, y }], stack { x, z, y, R, H, rAt(y), vents [[x, y, z]], flue }, ladder { foot, top, dir },
//      hurdles [{ a, b, y, h }], heap { x, z, y, R, H }, sacks [{ x, z, y, h }], cord { x, z, y, L, W, H, logs }, hut { x, z, y, R, H, rAt(y), door { x, z, w, h } },
//      fire { x, z, embers, pot }, cart { x, z, wheels [{ x, y, z, r }] }, road { z, w }, path [[x, z]], trees [{ x, z, h }], stools [{ x, z, cut }] }
export function gatelandsCharcoalCamp(o = {}, r = stream('charcoal')) {
  const std = (c, ro = .9, x = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: ro, ...x });
  const MI = millMats(), M = { turf: MI.turf, track: mat('turfDry', { ns: 1.0, color: 0x9a8a6c, rough: 1 }), burnt: mat('plaster', { ns: 1.4, color: 0x2e2a26, rough: 1 }),
    sammel: mat('plaster', { ns: 1.5, color: 0x4a3c30, rough: 1 }), sod: mat('turfMoss', { ns: 1.0, color: 0x9aa47c, rough: 1 }), char: std(0x141312, .45, { metalness: .25 }), ash: mat('plaster', { ns: .8, color: 0x8e8a84, rough: 1 }),
    wood: mat('wood', { ns: .9, color: 0x9a7e5c, rough: .9 }), bark: std(0x5a5046, .95), billet: mat('beam', { ns: .9, color: 0x8a7458, rough: .95 }), hazel: std(0x6a5a48, .9), wattle: mat('thatch', { ns: .8, color: 0x8a7656, rough: 1 }),
    leaf: std(0x56702e, .85), bracken: std(0x76703a, .95, { side: THREE.DoubleSide }), sack: MI.sack, iron: MI.iron, dark: std(0x080706, 1), ember: std(0x2a1408, .6, { emissive: new THREE.Color(1, .4, .12), emissiveIntensity: 2.2 }),
    smoke: std(0xa8a39a, 1, { map: puffTex(), transparent: true, opacity: .5, depthWrite: false, side: THREE.DoubleSide }) };
  M.sod.side = THREE.DoubleSide;
  const B = new Map(), key = String(o.key || 'charcoal'), F = stream(key + ':lie'), ph = Array.from({ length: 10 }, () => F() * 6.283);
  const put = (geo, k, x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0, uv = .5) => { const g = geo.index ? geo.toNonIndexed() : geo; for (const a of Object.keys(g.attributes)) if (!['position', 'normal'].includes(a)) g.deleteAttribute(a);
    if (!g.attributes.normal) g.computeVertexNormals(); g.applyMatrix4(new THREE.Matrix4().compose(new THREE.Vector3(x, y, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(rx, ry, rz, 'YXZ')), new THREE.Vector3(1, 1, 1))); worldUV(g, uv);
    if (!B.has(k)) B.set(k, []); B.get(k).push(g); return g; };
  const rod = (k, a, b, rad, seg = 6, taper = 1) => { const A = new THREE.Vector3(...a), C = new THREE.Vector3(...b), d = C.clone().sub(A), g = new THREE.CylinderGeometry(rad * taper, rad, d.length(), seg);
    g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.clone().normalize())); g.translate((A.x + C.x) / 2, (A.y + C.y) / 2, (A.z + C.z) / 2); return put(g, k); };
  const tri = (k, pos) => { const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.computeVertexNormals(); put(g, k, 0, 0, 0, 0, 0, 0, .3); };
  // a piece laid on a surface: its local x along t, y along the normal n, z along t x n; at p
  const lay = (geo, k, p, n, t) => { const N = new THREE.Vector3(...n).normalize(), T = new THREE.Vector3(...t), Z = new THREE.Vector3().crossVectors(T, N).normalize(); T.crossVectors(N, Z).normalize();
    geo.applyMatrix4(new THREE.Matrix4().makeBasis(T, N, Z).setPosition(...p)); return put(geo, k); };
  const sm = t => { t = Math.min(1, Math.max(0, t)); return t * t * (3 - 2 * t); };
  // the land: rising to -z at 1 in 14 with a gentle roll; four levelled stances (the two pitsteads, the hut's, the cordwood's) and the road
  const RZ = 13, RW = 3.2, base = (x, z) => -.07 * z + .12 * Math.sin(x * .21 + ph[0]) * Math.sin(z * .17 + ph[1]) + .05 * Math.sin(x * .6 + z * .5 + ph[2]);
  const pads = [{ x: 0, z: 0, r: 4.6 }, { x: -12, z: -1, r: 4.2 }, { x: 9, z: -5, r: 2.4 }, { x: -4, z: -10.5, r: 3.4 }]; for (const p of pads) p.y = +base(p.x, p.z).toFixed(3);
  const roadY = x => base(x, RZ);
  const ground = (x, z) => { let b = base(x, z); for (const p of pads) { const w = sm((p.r + 1.6 - Math.hypot(x - p.x, z - p.z)) / 1.6); if (w > 0) b += (p.y - b) * w; }
    const rw = sm((RW / 2 + 1.4 - Math.abs(z - RZ)) / 1.4); return b + (roadY(x) - .04 * Math.min(1, Math.abs(z - RZ) / (RW / 2)) - b) * rw; };
  const [P1, P2, PH, PC] = pads;
  // the paths: from the road to the burning stack, round it to the opened one, and from it to the hut's door
  const S = P1, HX = PH.x, HZ = PH.z, HR = 1.5, HH = 2.9, DH = 1.6, GAP = .7;
  const path = [[4.2, RZ], [3.6, 9.5], [2.6, 5.4], [-1.6, 4.6], [-4.6, 3.2], [-8.4, 1.8]], path2 = [[2.6, 5.4], [4.6, 3.0], [7.4, -.6], [HX, HZ + HR + .9], [HX, HZ + HR - .2], [HX, HZ - .4]];
  const segD = (x, z, a, b) => { const dx = b[0] - a[0], dz = b[1] - a[1], t = Math.max(0, Math.min(1, ((x - a[0]) * dx + (z - a[1]) * dz) / (dx * dx + dz * dz))); return Math.hypot(x - a[0] - dx * t, z - a[1] - dz * t); };
  const pathD = (x, z) => Math.min(...[path, path2].flatMap(p => p.slice(0, -1).map((q, i) => segD(x, z, q, p[i + 1]))));
  // the ground: fine round the camp, coarse beyond and out to the fog; black on the pitsteads, worn on the road
  { const steps = (bands, end) => { const v = []; for (const [a, b, st] of bands) for (let q = a; q < b - 1e-6; q += st) v.push(+q.toFixed(2)); v.push(end); return v; };
    const xs = steps([[-160, -45, 23], [-45, -20, 2.5], [-20, 20, 1.2], [20, 45, 2.5], [45, 160, 23]], 160), zs = steps([[-160, -40, 24], [-40, -17, 2.5], [-17, 19, 1.2], [19, 45, 2.5], [45, 160, 23]], 160);
    const pos = [], NX = xs.length, I = { turf: [], burnt: [], track: [] }; for (const z of zs) for (const x of xs) pos.push(x, ground(x, z), z);
    for (let j = 0; j + 1 < zs.length; j++) for (let i = 0; i + 1 < NX; i++) { const a = j * NX + i, b = a + 1, c = a + NX, d = c + 1, cx = (xs[i] + xs[i + 1]) / 2, cz = (zs[j] + zs[j + 1]) / 2;
      const k = Math.abs(cz - RZ) < RW / 2 + .1 && Math.abs(cx) < 150 ? 'track' : 'turf'; I[k].push(a, c, b, b, c, d); }
    for (const [k, idx] of Object.entries(I)) { const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals(); put(g, k, 0, 0, 0, 0, 0, 0, .35); } }
  // the hearths: black discs on their level stances, a little past the stance's edge so no turf shows between
  for (const p of [P1, P2]) put(new THREE.CircleGeometry(p.r + .15, 40).rotateX(-Math.PI / 2), 'burnt', p.x, p.y + .012, p.z, 0, 0, 0, .35);
  // the trodden paths: strips a hand over the ground, as the falls' track
  for (const P of [path, path2.slice(0, 4)]) { const pts = []; for (let i = 0; i + 1 < P.length; i++) { const [a, b] = [P[i], P[i + 1]], L = Math.hypot(b[0] - a[0], b[1] - a[1]), n = Math.ceil(L / .4); for (let k = i ? 1 : 0; k <= n; k++) pts.push([a[0] + (b[0] - a[0]) * k / n, a[1] + (b[1] - a[1]) * k / n]); }
    const pos = [], idx = []; pts.forEach(([x, z], i) => { const [p, q] = [pts[Math.max(0, i - 1)], pts[Math.min(pts.length - 1, i + 1)]], dx = q[0] - p[0], dz = q[1] - p[1], l = Math.hypot(dx, dz), w = .38 + .08 * Math.sin(i * .7 + ph[3]);
      for (const sd of [-1, -.5, 0, .5, 1]) { const ex = x - dz / l * w * sd, ez = z + dx / l * w * sd; pos.push(ex, ground(ex, ez) + .03, ez); } if (i) { const o2 = (i - 1) * 5; for (let c = 0; c < 4; c++) idx.push(o2 + c, o2 + c + 5, o2 + c + 1, o2 + c + 1, o2 + c + 5, o2 + c + 6); } });
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals(); if (g.attributes.normal.array[1] < 0) { g.setIndex(idx.map((v, j) => idx[j - j % 3 + [0, 2, 1][j % 3]])); g.computeVertexNormals(); } put(g, 'track', 0, 0, 0, 0, 0, 0, .35); }
  // the burning stack: a dome of sammel, lumpy, its flue open at the top; sods laid over it; twelve vents at its foot
  const SR = 2.4, SH = 1.9, rAt = y => SR * Math.pow(Math.max(0, 1 - Math.pow(Math.max(0, y) / SH, 2.4)), .5), lump = (x, y, z) => 1 + .022 * Math.sin(x * 3.1 + ph[4]) * Math.sin(z * 2.7 + ph[5]) + .014 * Math.sin(y * 5 + x * 1.3 + ph[6]);
  const FLUE = .2, sy = S.y;
  { const pts = []; for (let k = 0; k <= 13; k++) { const y = SH * Math.sin(k / 13 * Math.PI / 2) - .03; const rr = Math.max(FLUE, rAt(y)); pts.push(new THREE.Vector2(rr, y)); if (rr === FLUE) break; } pts.unshift(new THREE.Vector2(SR + .02, -.08)); pts.push(new THREE.Vector2(FLUE * .8, SH - .4));
    const g = new THREE.LatheGeometry(pts, 32); const P = g.attributes.position; for (let i = 0; i < P.count; i++) { const x = P.getX(i), y = P.getY(i), z = P.getZ(i), f = y > .05 && y < SH - .15 ? lump(x, y, z) : 1; P.setXYZ(i, x * f, y, z * f); }
    g.computeVertexNormals(); put(g, 'sammel', S.x, sy, S.z, 0, 0, 0, .6); }
  const onDome = (phi, y, lift = 0) => { const rr = rAt(y), e = .01, dr = (rAt(y + e) - rAt(y - e)) / (2 * e), s = Math.sin(phi), c = Math.cos(phi), n = [s, -dr, c]; const L = Math.hypot(...n);
    return { p: [S.x + rr * s + lift * n[0] / L, sy + y + lift * n[1] / L, S.z + rr * c + lift * n[2] / L], n: n.map(v => v / L), t: [c, 0, -s] }; };
  let sodN = 0; for (let row = 0, y = .45; y < SH - .5; row++, y += .29) { const nn = Math.floor(2 * Math.PI * rAt(y) / .44); for (let i = 0; i < nn; i++) { if (F() < .1) continue; const phi = (i + (row % 2) * .5) / nn * 6.283 + (F() - .5) * .04, d = onDome(phi, y, .03);
    lay(new THREE.BoxGeometry(.5, .05, .38), 'sod', d.p, d.n, [d.t[0], (F() - .5) * .06, d.t[2]]); sodN++; } } /* laid in courses round the stack, each row over the joints of the one below, as the colliers turfed it */
  const vents = []; for (let k = 0; k < 12; k++) { const phi = k / 12 * 6.283 + .13, d = onDome(phi, .2, .03); lay(new THREE.CircleGeometry(.07, 8).rotateX(-Math.PI / 2), 'dark', d.p, d.n, d.t); vents.push(d.p.map(v => +v.toFixed(3))); }
  put(new THREE.CircleGeometry(FLUE * .82, 10).rotateX(-Math.PI / 2), 'dark', S.x, sy + SH - .38, S.z);
  // the smoke: the wind from the north-west, so it leans south-east; a column from the flue and wisps from four vents
  const WD = [.62, .1, .62], SMK = [], puff = (x, y, z, s) => { const a = F() * 3; for (const [rx, ry] of [[0, a], [0, a + Math.PI / 3], [0, a + 2 * Math.PI / 3]]) { const g = new THREE.PlaneGeometry(s * 2.4, s * 2.0); g.rotateX(rx); g.rotateY(ry); g.translate(x, y, z); SMK.push(g); } } /* three upright quads crossed under the soft puff, so it reads from any side */;
  for (let k = 0; k < 16; k++) { const t = k / 15, h = .15 + t * 7; puff(S.x + WD[0] * h * .7 + (F() - .5) * .3, sy + SH + h, S.z + WD[2] * h * .7 + (F() - .5) * .3, .3 + t * 1.2); }
  for (const v of [vents[1], vents[4], vents[7], vents[10]]) for (let k = 0; k < 3; k++) { const h = .15 + k * .45; puff(v[0] + WD[0] * h, v[1] + h, v[2] + WD[2] * h, .14 + k * .14); }
  // the hurdles: three wattle screens on the windward side, 3.7 m out, upright, each propped by a pole to leeward
  const hurdles = [], HL = 1.9, HHt = 1.7; for (const da of [-.5, 0, .5]) { const phi = -3 * Math.PI / 4 + da, cx = S.x + 3.7 * Math.sin(phi), cz = S.z + 3.7 * Math.cos(phi), tx = Math.cos(phi), tz = -Math.sin(phi);
    const a = [cx - tx * HL / 2, cz - tz * HL / 2], b = [cx + tx * HL / 2, cz + tz * HL / 2], y0 = Math.min(ground(...a), ground(...b), ground(cx, cz)) - .12;
    for (let s = 0; s <= 6; s++) { const u = -HL / 2 + s * HL / 6, x = cx + tx * u, z = cz + tz * u; rod('hazel', [x, y0, z], [x, y0 + HHt + (s % 6 ? 0 : .08), z], .025, 5); }
    for (let w = 0; w < 9; w++) { const y = y0 + .2 + w * (HHt - .3) / 8, pts = []; for (let s = 0; s <= 12; s++) { const u = -HL / 2 + s * HL / 12, off = .035 * Math.cos(s / 2 * Math.PI + w * Math.PI); pts.push(new THREE.Vector3(cx + tx * u + Math.sin(phi) * off, y, cz + tz * u + Math.cos(phi) * off)); }
      put(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 10, .024, 3), 'wattle'); }
    const ix = -Math.sin(phi), iz = -Math.cos(phi); rod('hazel', [cx, y0 + HHt - .15, cz], [cx + ix * 1.1, ground(cx + ix * 1.1, cz + iz * 1.1) - .05, cz + iz * 1.1], .03, 5);
    hurdles.push({ a: a.map(v => +v.toFixed(3)), b: b.map(v => +v.toFixed(3)), y: +y0.toFixed(3), h: HHt, phi }); }
  // the ladder: two rails and rungs, its foot on the hearth to the east, its top on the sammel at 1.45 m
  const LPHI = Math.PI / 2 + .25, ltop = onDome(LPHI, 1.45, .06), lfx = S.x + 3.5 * Math.sin(LPHI), lfz = S.z + 3.5 * Math.cos(LPHI), lfoot = [lfx, ground(lfx, lfz), lfz];
  { const T = new THREE.Vector3(...ltop.p), Fo = new THREE.Vector3(...lfoot), d = T.clone().sub(Fo), side = new THREE.Vector3(-d.z, 0, d.x).normalize().multiplyScalar(.21);
    for (const sg of [-1, 1]) rod('wood', Fo.clone().addScaledVector(side, sg).toArray(), T.clone().addScaledVector(side, sg).add(d.clone().normalize().multiplyScalar(.12)).toArray(), .03, 6);
    const n = Math.floor(d.length() / .3); for (let k = 1; k <= n; k++) { const p = Fo.clone().addScaledVector(d, k / (n + .5)); rod('wood', p.clone().addScaledVector(side, -1.05).toArray(), p.clone().addScaledVector(side, 1.05).toArray(), .018, 5); } }
  const ladder = { foot: lfoot.map(v => +v.toFixed(3)), top: ltop.p.map(v => +v.toFixed(3)), dir: ltop.n };
  // the opened stack: a low heap of charcoal raked out on the second hearth, a ring of ash, lumps on it, a shovel in it
  const HR2 = 2.3, HHh = .7, hy = P2.y;
  { const pts = []; for (let k = 0; k <= 8; k++) { const t = k / 8; pts.push(new THREE.Vector2(HR2 * (1 - t) + .001, HHh * Math.sin(Math.acos(1 - t)) * (1 - t * .1) - .02)); } pts[0].y = -.04;
    const g = new THREE.LatheGeometry(pts.reverse().map(v => v), 24); put(g, 'char', P2.x, hy, P2.z); put(new THREE.RingGeometry(HR2 - .05, HR2 + .9, 24, 1).rotateX(-Math.PI / 2), 'ash', P2.x, hy + .03, P2.z);
    for (let k = 0; k < 110; k++) { const a = F() * 6.283, d = Math.sqrt(F()) * (HR2 + .7), x = P2.x + d * Math.sin(a), z = P2.z + d * Math.cos(a), t = Math.min(1, d / HR2), y = d < HR2 ? HHh * Math.sqrt(Math.max(0, 1 - t * t)) * .98 : 0;
      put(new THREE.BoxGeometry(.06 + F() * .06, .04 + F() * .04, .05 + F() * .05), 'char', x, hy + y + .02, z, F(), F() * 3, F()); }
    const sx = P2.x + .9, sz = P2.z - .4, st = hy + HHh * Math.sqrt(1 - (Math.hypot(.9, .4) / HR2) ** 2); put(new THREE.BoxGeometry(.24, .3, .015), 'iron', sx, st - .05, sz, .25, .6); rod('wood', [sx + .02, st + .1, sz - .04], [sx + .2, st + 1.1, sz - .4], .02); }
  const heap = { x: P2.x, z: P2.z, y: hy, R: HR2, H: HHh };
  // the sacks: seven filled and tied, standing on the hearth by its south rim; a rake against them; the riddle on the ground
  const sacks = [], sackGeo = h => { const V2 = (a, b) => new THREE.Vector2(a, b); return new THREE.LatheGeometry([V2(.001, 0), V2(.24, .01), V2(.29, .12), V2(.3, h * .55), V2(.25, h * .85), V2(.08, h * .95), V2(.1, h), V2(.001, h + .02)], 10); };
  for (let k = 0; k < 7; k++) { const x = P2.x + 1.2 + (k % 4) * .62 + (F() - .5) * .08, z = P2.z + 3.0 + Math.floor(k / 4) * .6 + (F() - .5) * .08, h = .82 + F() * .12, y = ground(x, z) - .01; put(sackGeo(h), 'sack', x, y, z, (F() - .5) * .06, F() * 3); sacks.push({ x: +x.toFixed(3), z: +z.toFixed(3), y: +y.toFixed(3), h: +h.toFixed(3) }); }
  { const x = P2.x + 1.2 + 3 * .62 + .5, z = P2.z + 3.0; rod('wood', [x + .1, ground(x + .1, z + .9), z + .9], [x, ground(x, z) + 1.5, z + .05], .02); put(new THREE.BoxGeometry(.5, .04, .04), 'iron', x + .1, ground(x + .1, z + .9) + .06, z + .95);
    for (let k = 0; k < 6; k++) put(new THREE.BoxGeometry(.012, .1, .012), 'iron', x - .12 + k * .05, ground(x + .1, z + .9) + .02, z + .95); }
  { const x = P2.x - .2, z = P2.z + 3.2, y = ground(x, z); put(new THREE.TorusGeometry(.32, .025, 5, 18).rotateX(Math.PI / 2), 'wood', x, y + .12, z, .3, 0, .1); put(new THREE.CylinderGeometry(.32, .32, .08, 18, 1, true), 'wood', x, y + .1, z, .3, 0, .1); }
  // the cordwood: billets of a metre, five metres of them a metre and a fifth high between stakes, on its own stance
  const CL = 5.0, CW = 1.0, CH = 1.2, cy = PC.y, logs = [];
  for (let row = 0, below = null; row < 9; row++) { const now = []; for (let x = PC.x - CL / 2 + .1 + (row % 2) * .09; x < PC.x + CL / 2 - .08; x += .18) { const rr = .07 + F() * .02, xx = x + (F() - .5) * .02;
      let y = cy + rr; if (below) { y = -9; for (const [bx, by, br] of below) { const dx = Math.abs(bx - xx); if (dx < br + rr) y = Math.max(y, by + Math.sqrt((br + rr) ** 2 - dx * dx)); } } /* each billet sits on the ground or on the two under it */
      if (y < cy || y > cy + CH || (row > 5 && F() < .3)) continue; now.push([xx, y, rr]);
      const g = new THREE.CylinderGeometry(rr, rr, CW + (F() - .5) * .08, 5); g.rotateX(Math.PI / 2); put(g, 'billet', xx, y, PC.z + (F() - .5) * .06, 0, 0, F() * 3, 1.2); logs.push([+xx.toFixed(3), +y.toFixed(3)]); }
    if (!now.length) break; below = now; }
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) rod('hazel', [PC.x + sx * (CL / 2 + .05), cy - .3, PC.z + sz * .32], [PC.x + sx * (CL / 2 + .1), cy + CH + .15, PC.z + sz * .34], .04, 5);
  const cord = { x: PC.x, z: PC.z, y: cy, L: CL, W: CW, H: CH, logs };
  // the hut: a beehive of sods on poles; the door a gap in its lower band, between two posts under a lintel; the poles' tops crossed over it
  const hy0 = PH.y, hutR = y => HR * Math.pow(Math.max(0, 1 - Math.pow(Math.max(0, y) / HH, 2.2)), .5);
  { const band = (y0, y1, n, p0, pl) => { const pts = []; for (let k = 0; k <= n; k++) { const y = y0 + (y1 - y0) * k / n; pts.push(new THREE.Vector2(Math.max(.002, hutR(y)), y)); } if (y1 >= HH) pts[pts.length - 1].x = .001; return new THREE.LatheGeometry(pts, 20, p0, pl); };
    put(band(-.05, DH, 6, GAP / 2, 2 * Math.PI - GAP), 'sod', HX, hy0, HZ, 0, 0, 0, .8); put(band(DH, HH, 7, 0, 2 * Math.PI), 'sod', HX, hy0, HZ, 0, 0, 0, .8);
    for (let k = 0; k < 12; k++) { const a = GAP / 2 + .2 + k * (2 * Math.PI - GAP - .4) / 11, y = 2.2, rr = hutR(y) + .03; rod('hazel', [HX + rr * Math.sin(a), hy0 + y, HZ + rr * Math.cos(a)], [HX - .35 * Math.sin(a), hy0 + HH + .45, HZ - .35 * Math.cos(a)], .035, 5); }
    for (const sg of [-1, 1]) { const a = sg * GAP / 2, P = y => [HX + (hutR(y) + .02) * Math.sin(a), hy0 + y, HZ + (hutR(y) + .02) * Math.cos(a)]; rod('wood', P(-.1), P(DH + .12), .06, 6); }
    const ly = DH + .05, lr = hutR(ly) + .05; rod('wood', [HX - lr * Math.sin(GAP / 2) - .15, hy0 + ly, HZ + lr * Math.cos(GAP / 2)], [HX + lr * Math.sin(GAP / 2) + .15, hy0 + ly, HZ + lr * Math.cos(GAP / 2)], .06, 6);
    put(new THREE.BoxGeometry(.9, .22, 1.8), 'bracken', HX - .45, hy0 + .11, HZ - .2, 0, 0, 0, .8); }
  const hut = { x: HX, z: HZ, y: hy0, R: HR, H: HH, rAt: hutR, door: { x: HX, z: +(HZ + HR).toFixed(3), w: +(2 * hutR(DH) * Math.sin(GAP / 2)).toFixed(3), h: DH, lintelZ: +(HZ + (hutR(DH + .05) + .05) * Math.cos(GAP / 2)).toFixed(3) } };
  // the fire east of the door: a ring of stones, embers, a tripod of three sticks and a pot on its chain
  const FX = HX + 2.2, FZ = HZ + 2.4, fy = ground(FX, FZ);
  for (let k = 0; k < 8; k++) { const a = k / 8 * 6.283 + F() * .3, st = new THREE.IcosahedronGeometry(.1 + F() * .05, 0); st.scale(1.2, .7, 1); put(st, 'ash', FX + .38 * Math.cos(a), fy + .04, FZ + .38 * Math.sin(a), 0, F() * 3); }
  put(new THREE.CylinderGeometry(.27, .3, .05, 10), 'ember', FX, fy + .025, FZ); for (let k = 0; k < 3; k++) { const a = k * 2.09 + .4; rod('hazel', [FX + .7 * Math.cos(a), ground(FX + .7 * Math.cos(a), FZ + .7 * Math.sin(a)) - .05, FZ + .7 * Math.sin(a)], [FX, fy + 1.25, FZ], .022, 5); }
  const V2 = (a, b) => new THREE.Vector2(a, b), PB = fy + .3; put(new THREE.LatheGeometry([V2(.001, 0), V2(.11, .01), V2(.15, .08), V2(.15, .2), V2(.13, .24), V2(.001, .24)], 12), 'iron', FX, PB, FZ); rod('iron', [FX, PB + .24, FZ], [FX, fy + 1.22, FZ], .006, 4);
  const fire = { x: FX, z: FZ, embers: +(fy + .05).toFixed(3), pot: +PB.toFixed(3) };
  // the cart on the road: a bed on an axle, two wheels, the shafts down on the road ahead; five sacks on it
  const KX = 9.5, KZ = RZ - .2, WR = .62, wheels = [];
  { const ay = Math.max(roadY(KX), ground(KX, KZ - .8), ground(KX, KZ + .8)) + WR - .02; for (const s of [-1, 1]) { const g = new THREE.CylinderGeometry(WR, WR, .08, 16); g.rotateX(Math.PI / 2); put(g, 'wood', KX, ay, KZ + s * .85); put(new THREE.TorusGeometry(WR - .01, .025, 4, 16), 'iron', KX, ay, KZ + s * .89);
      wheels.push({ x: KX, y: +ay.toFixed(3), z: +(KZ + s * .85).toFixed(3), r: WR }); }
    rod('wood', [KX, ay, KZ - .95], [KX, ay, KZ + .95], .05); const bed = ay + .12;
    put(new THREE.BoxGeometry(2.0, .08, 1.3), 'wood', KX - .2, bed, KZ); for (const s of [-1, 1]) { put(new THREE.BoxGeometry(2.0, .35, .05), 'wood', KX - .2, bed + .2, KZ + s * .63); rod('wood', [KX + .8, bed - .02, KZ + s * .42], [KX + 3.1, roadY(KX + 3.1) + .04, KZ + s * .42], .04); }
    for (let k = 0; k < 5; k++) { const g = sackGeo(.75); g.rotateZ(Math.PI / 2); put(g, 'sack', KX - .9 + (k % 3) * .02 + .38, bed + .3 + Math.floor(k / 3) * .4, KZ - .3 + (k % 3) * .3 - .0, 0, (F() - .5) * .3, 0); } }
  const cart = { x: KX, z: KZ, wheels };
  // the coppice: hazel stools (some cut this winter, stubs only), oak standards over them; off the road, the paths, the stances
  const clearOf = (x, z, m) => Math.abs(z - RZ) < RW / 2 + m || pathD(x, z) < m || pads.some(p => Math.hypot(x - p.x, z - p.z) < p.r + m) || Math.hypot(x - FX, z - FZ) < 1 + m;
  const trees = [], stools = [];
  for (let k = 0, n = 0; k < 1500 && n < 30; k++) { const x = -30 + F() * 60, z = -28 + F() * 56; if (clearOf(x, z, 1.3) || stools.some(t => Math.hypot(t.x - x, t.z - z) < 2.8)) continue; n++; const gy = ground(x, z), cut = Math.hypot(x, z) < 24 && n % 2 === 0 /* every other stool near the hearths cut this winter for the burn */;
    put(new THREE.CylinderGeometry(.32, .38, .22, 7), 'hazel', x, gy + .06, z); const nr = 6 + Math.floor(F() * 4);
    for (let j = 0; j < nr; j++) { const a = F() * 6.283, ox = .22 * Math.cos(a), oz = .22 * Math.sin(a); if (cut) { put(new THREE.CylinderGeometry(.03, .035, .18, 5), 'billet', x + ox, gy + .24, z + oz); continue; }
      const L = 2.6 + F() * 1.6, lean = .14 + F() * .14, tx = x + ox + Math.cos(a) * L * lean, tz = z + oz + Math.sin(a) * L * lean; rod('hazel', [x + ox, gy + .1, z + oz], [tx, gy + L, tz], .035, 4, .5); }
    if (!cut) for (let c = 0; c < 7; c++) { const a = c * .9 + F(), d = .3 + F() * .8, h = 2.3 + F() * 2.0; put(new THREE.IcosahedronGeometry(.8 + F() * .35, 0).scale(1.15, .85, 1.15), 'leaf', x + d * Math.cos(a), gy + h, z + d * Math.sin(a), F(), F() * 3); } /* the stool's leaf: one crown over the sheaf of rods, its lower edge at 2 m and more */
    stools.push({ x: +x.toFixed(2), z: +z.toFixed(2), cut }); }
  for (let k = 0, n = 0; k < 900 && n < 11; k++) { const x = -34 + F() * 68, z = -32 + F() * 62; if (clearOf(x, z, 3.2) || trees.some(t => Math.hypot(t.x - x, t.z - z) < 8) || stools.some(t => Math.hypot(t.x - x, t.z - z) < 1.6)) continue; n++;
    const gy = ground(x, z), h = 9 + F() * 5, top = [x + (F() - .5) * .6, gy + h * .45, z + (F() - .5) * .6]; rod('bark', [x, gy - .3, z], top, .22 + h * .014, 7, .75);
    for (let l = 0; l < 5; l++) { const a = l * 1.3 + F(), L = 1.8 + F() * 1.6, e = [top[0] + Math.cos(a) * L, top[1] + .8 + l * .55 + F() * 1.2, top[2] + Math.sin(a) * L]; rod('bark', [top[0], top[1] - .5 + l * .25, top[2]], e, .09, 5, .6);
      for (let c = 0; c < 4; c++) put(new THREE.IcosahedronGeometry(1.0 + F() * .7, 0).scale(1.2, .75, 1.2), 'leaf', e[0] + (F() - .5) * 1.8, e[1] + (F() - .4) * 1.4, e[2] + (F() - .5) * 1.8, F(), F() * 3, 0); }
    put(new THREE.IcosahedronGeometry(1.6, 0).scale(1.2, .8, 1.2), 'leaf', top[0], gy + h * .82, top[2]); trees.push({ x: +x.toFixed(2), z: +z.toFixed(2), h: +h.toFixed(2) }); }
  // bracken in the coppice, going rust: tufts of fronds, off the road, the paths and the stances
  const frond = (k, x, gy, z, n, len) => { const a0 = F() * 6.283; for (let j = 0; j < n; j++) { const a = a0 + j * 6.283 / n + (F() - .5) * .3, L = len * (.8 + F() * .4), pos = []; let px = 0, py = 0, pa = 1.0 + F() * .2; const ring = [];
      for (let s = 0; s <= 3; s++) { ring.push([px, py, .13 * (1 - s / 3.4)]); px += Math.cos(pa) * L / 3; py += Math.sin(pa) * L / 3; pa -= .45; }
      for (let s = 0; s < 3; s++) { const [x0, y0, w0] = ring[s], [x1, y1, w1] = ring[s + 1]; pos.push(x0, y0, -w0, x1, y1, -w1, x0, y0, w0, x0, y0, w0, x1, y1, -w1, x1, y1, w1); }
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.computeVertexNormals(); put(g, k, x, gy - .02, z, 0, a, 0); } };
  for (let k = 0, n = 0; k < 2000 && n < 46; k++) { const x = -26 + F() * 52, z = -24 + F() * 46; if (clearOf(x, z, .7)) continue; n++; frond('bracken', x, ground(x, z), z, 5 + Math.floor(F() * 3), .7 + F() * .4); }
  const group = new THREE.Group(); let tris = 0; { const g = mergeGeometries(SMK, false); SMK.forEach(x => x.dispose()); const m = new THREE.Mesh(g, M.smoke); m.name = 'smoke'; m.renderOrder = 2; group.add(m); tris += g.index.count / 3; }
  for (const [k, gs] of B) { const g = mergeGeometries(gs, false); gs.forEach(x => x.dispose()); const m = new THREE.Mesh(g, M[k]); m.name = k;
    m.castShadow = !['turf', 'track', 'burnt', 'ember', 'ash', 'dark'].includes(k); m.receiveShadow = true; group.add(m); tris += g.attributes.position.count / 3; }
  return { group, tris: Math.round(tris), draws: group.children.length, own: group.children.length, top: +new THREE.Box3().setFromObject(group).max.y.toFixed(2), ground,
    pits: [P1, P2].map(p => ({ x: p.x, z: p.z, r: p.r, y: p.y })), stack: { x: S.x, z: S.z, y: sy, R: SR, H: SH, rAt, vents, flue: FLUE, sods: sodN }, ladder, hurdles, heap, sacks, cord, hut, fire, cart, road: { z: RZ, w: RW }, path, path2, trees, stools };
}

// ── the Gatelands' merchants' halt (Session 1021, card F8; OG-124's "camps on the roads: merchants"). The precedents: the carriers' tilt
// waggons of the old roads, which stood the night on a green by water rather than pay an inn's yard, and the drovers' stances of the
// Highland roads (a green by a ford, a fire, the beasts on a line); the chapman's trestle under a canvas fly at a fair green. Built at true
// size, a metre a unit, on a green that rises gently to -z (1 in 20) from a road along x at z 13, a stream crossing the road at a ford:
//   - two tilt waggons: a bed 3.6 m by 1.4 m on four spoked wheels (0.72 m behind, 0.52 m before), side boards, five hoops under a canvas
//     tilt 2.8 m to its crown, the shafts down on the grass ahead; the first drawn up along the road with goods in its bed, the second
//     turned in behind the fire;
//   - the stall: a canvas fly laced to the first waggon's tilt and carried out 3 m on two poles, guyed to pegs; two trestle tables under
//     it, one of bolts of cloth in three dyes, one of crocks, jugs and a small chest; a lantern on the right pole;
//   - the fire: a ring of stones, a crane of two forked irons and a bar, a pot on its hook, two seat logs, a thin smoke;
//   - the tent: a ridge tent of canvas 2.6 by 2.2 m, 1.95 m at its ridge, its door to the fire with the flaps tied back, a bedroll inside;
//   - the line: a picket rope between two posts at 1.3 m, hay, two buckets, a bale of fodder (the beasts are the bodies builder's);
//   - the goods stacked by the second waggon: casks, wool bales in rope bands, crates;
//   - the stream: 3 m of water in a gravel bed under low banks, the west bank eased to a watering place where the path comes down, the road through it at a ford a hand deep, stepping stones beside the road;
//   - a thorn hedge along the road's far side with gaps, ash on the green's edge, alder by the water; trodden paths from the road to the
//     stall, the fire and the tent, and down to the water.
// -> { group, tris, draws, own, ground(x, z), wagons [{ x, z, ry, wheels [{ x, y, z, r }], bed, crown }], awning { tie, front, poles [{ x, z, y0, y1 }], pegs [[x, y, z]], area [x0, x1, z0, z1] },
//      tables [{ x, z, top, w, d, feet [[x, y, z]] }], goods [[x, y, z]] (bottoms of things on the tables), fire { x, z, embers, pot }, tent { x, z, ry, L, W, H, door [x, z] },
//      picket { a, b, h, sag }, stack [{ x, y, z }] (bottoms of the stacked goods), stream { xAt(z), water(z), bed(z), ford { z, depth } }, stones [[x, y, z]], road { z, w }, paths [[[x, z]]], trees [{ x, z, h }] }
export function gatelandsMerchantCamp(o = {}, r = stream('merchants')) {
  const std = (c, ro = .9, x = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: ro, ...x });
  const MI = millMats(), M = { turf: MI.turf, track: mat('turfDry', { ns: 1.0, color: 0x9a8a6c, rough: 1 }), gravel: mat('rock', { ns: 1.2, color: 0x8a8274, rough: 1 }),
    water: std(0x4a6462, .14, { metalness: .15, transparent: true, opacity: .86 }), canvas: std(0xe2d6b8, .95, { side: THREE.DoubleSide }), wood: mat('wood', { ns: .9, color: 0x8e7254, rough: .9 }), paint: mat('wood', { ns: .7, color: 0x5a3a2a, rough: .8 }),
    iron: MI.iron, rope: std(0x8a7650, .95), boltR: std(0x8a2a22, .9), boltB: std(0x2c3e66, .9), boltY: std(0xb08a34, .9), crock: std(0xa06a44, .7), hay: std(0xb4a468, 1), sack: MI.sack,
    ash: mat('plaster', { ns: .8, color: 0x8e8a84, rough: 1 }), ember: std(0x2a1408, .6, { emissive: new THREE.Color(1, .4, .12), emissiveIntensity: 2.2 }), bark: std(0x5e564c, .95), leaf: std(0x50682c, .85),
    lamp: std(0xffd8a0, .5, { emissive: new THREE.Color(1, .72, .38), emissiveIntensity: o.lit ? 3 : .4 }), dark: std(0x0c0a08, 1),
    smoke: std(0xb0aca4, 1, { map: puffTex(), transparent: true, opacity: .4, depthWrite: false, side: THREE.DoubleSide }) };
  const B = new Map(), key = String(o.key || 'merchants'), F = stream(key + ':lie'), ph = Array.from({ length: 10 }, () => F() * 6.283), V3 = (x, y, z) => new THREE.Vector3(x, y, z);
  const put = (geo, k, x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0, uv = .5) => { const g = geo.index ? geo.toNonIndexed() : geo; for (const a of Object.keys(g.attributes)) if (!['position', 'normal'].includes(a)) g.deleteAttribute(a);
    if (!g.attributes.normal) g.computeVertexNormals(); g.applyMatrix4(new THREE.Matrix4().compose(V3(x, y, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(rx, ry, rz, 'YXZ')), V3(1, 1, 1))); worldUV(g, uv);
    if (!B.has(k)) B.set(k, []); B.get(k).push(g); return g; };
  const rod = (k, a, b, rad, seg = 6, taper = 1) => { const A = V3(...a), C = V3(...b), d = C.clone().sub(A), g = new THREE.CylinderGeometry(rad * taper, rad, d.length(), seg);
    g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(V3(0, 1, 0), d.clone().normalize())); g.translate((A.x + C.x) / 2, (A.y + C.y) / 2, (A.z + C.z) / 2); return put(g, k); };
  const grid = (k, nu, nv, f, uv = .5) => { const pos = [], idx = []; for (let j = 0; j <= nv; j++) for (let i = 0; i <= nu; i++) pos.push(...f(i / nu, j / nv));
    for (let j = 0; j < nv; j++) for (let i = 0; i < nu; i++) { const a = j * (nu + 1) + i, b = a + 1, c = a + nu + 1, d = c + 1; idx.push(a, c, b, b, c, d); }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals(); return put(g, k, 0, 0, 0, 0, 0, 0, uv); };
  const sm = t => { t = Math.min(1, Math.max(0, t)); return t * t * (3 - 2 * t); };
  // the land: rising to -z at 1 in 20 with a gentle roll; the stream's channel along xs(z), shallower where the road fords it
  const RZ = 13, RW = 3.6, base = (x, z) => -.05 * z + .1 * Math.sin(x * .19 + ph[0]) * Math.sin(z * .15 + ph[1]) + .04 * Math.sin(x * .55 + z * .45 + ph[2]);
  const xs = z => 19 + 1.6 * Math.sin(z * .11 + ph[3]), CH = 2.3, ford = z => sm((3.2 - Math.abs(z - RZ)) / 2.2), depth = z => .8 - .38 * ford(z), wdep = z => .3 - .12 * ford(z);
  const WZ = 4.8, ease = (x, z) => x < xs(z) ? 1.8 * sm((2.2 - Math.abs(z - WZ)) / 1.4) : 0 /* the watering place: the west bank eased to 1 in 4 where the path comes down */;
  const carve = (x, z) => { const e = ease(x, z); return depth(z) * sm((CH + .9 + e - Math.abs(x - xs(z))) / (1.6 + e)); }, land = (x, z) => base(x, z) - carve(x, z);
  const bankY = z => base(xs(z), z), bedY = z => bankY(z) - depth(z), waterY = z => bedY(z) + wdep(z);
  const roadY = x => land(x, RZ);
  const ground = (x, z) => { const b = land(x, z), rw = sm((RW / 2 + 1.2 - Math.abs(z - RZ)) / 1.2); return b + (roadY(x) - .04 * Math.min(1, Math.abs(z - RZ) / (RW / 2)) - b) * rw; };
  // the paths: from the road into the stall; from the road round the first waggon to the fire and the tent; to the line and down to the water
  const AX = -3, AZ = 5, FX = 0, FZ = -1, TX = 6.6, TZ = -4.2, TL = 2.6, TW = 2.2, TH = 1.95, tdir = [FX - TX, FZ - TZ], tl = Math.hypot(...tdir), tc = tdir[0] / tl, ts = -tdir[1] / tl, TRY = Math.atan2(ts, tc);
  const door = [TX + tc * TL / 2, TZ - ts * TL / 2];
  const paths = [[[-2.6, RZ], [-2.8, 10.2], [-3.0, 7.95]], [[-2.2, 11.0], [1.4, 9.6], [2.6, 4.6], [2.8, 1.4], [door[0] + tc * 1.4, door[1] - ts * 1.4], door, [TX, TZ]], [[2.6, 4.6], [8.5, 4.2], [14.0, 4.6], [xs(WZ) - CH - .1, WZ]]];
  const segD = (x, z, a, b) => { const dx = b[0] - a[0], dz = b[1] - a[1], t = Math.max(0, Math.min(1, ((x - a[0]) * dx + (z - a[1]) * dz) / (dx * dx + dz * dz))); return Math.hypot(x - a[0] - dx * t, z - a[1] - dz * t); };
  const pathD = (x, z) => Math.min(...paths.flatMap(p => p.slice(0, -1).map((q, i) => segD(x, z, q, p[i + 1]))));
  // the ground: fine round the camp and the stream, coarse beyond; the road worn, the stream's bed gravel
  { const steps = (bands, end) => { const v = []; for (const [a, b, st] of bands) for (let q = a; q < b - 1e-6; q += st) v.push(+q.toFixed(2)); v.push(end); return v; };
    const gx = steps([[-160, -45, 23], [-45, -22, 2.5], [-22, 14, 1.2], [14, 25, .5], [25, 45, 2.5], [45, 160, 23]], 160), gz = steps([[-160, -40, 24], [-40, -16, 2.5], [-16, 19, 1.2], [19, 45, 2.5], [45, 160, 23]], 160);
    const pos = [], NX = gx.length, I = { turf: [], gravel: [], track: [] }; for (const z of gz) for (const x of gx) pos.push(x, ground(x, z), z);
    for (let j = 0; j + 1 < gz.length; j++) for (let i = 0; i + 1 < NX; i++) { const a = j * NX + i, b = a + 1, c = a + NX, d = c + 1, cx = (gx[i] + gx[i + 1]) / 2, cz = (gz[j] + gz[j + 1]) / 2;
      const k = Math.abs(cx - xs(cz)) < CH - .1 && Math.abs(cz) < 150 ? 'gravel' : Math.abs(cz - RZ) < RW / 2 + .1 && Math.abs(cx) < 150 ? 'track' : 'turf'; I[k].push(a, c, b, b, c, d); }
    for (const [k, idx] of Object.entries(I)) { const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals(); put(g, k, 0, 0, 0, 0, 0, 0, .35); } }
  // the water: a strip down the channel at its own level, falling with the land
  grid('water', 6, 120, (u, v) => { const z = -60 + v * 120, x = xs(z) + (u - .5) * 2 * (CH + .5); return [x, waterY(z), z]; }, .3) /* wider than the channel: its edges run under the banks */;
  // the stepping stones: a row across the stream 2.6 m above the road's ford, flat tops a hand over the water
  const stones = []; { const z0 = RZ - 2.6; for (let k = 0; k < 6; k++) { const z = z0 + (F() - .5) * .14, x = xs(z) - CH + .45 + k * (2 * CH - .9) / 5, wy = waterY(z), by = Math.min(land(x, z), wy - .05), top = wy + .1 + F() * .05;
    const g = new THREE.CylinderGeometry(.24 + F() * .05, .3, top - by + .05, 7); put(g, 'gravel', x, (top + by - .05) / 2, z, (F() - .5) * .04, F() * 3); stones.push([+x.toFixed(3), +top.toFixed(3), +z.toFixed(3)]); } }
  // the trodden paths: strips a hand over the ground
  for (const P of paths) { const pts = []; for (let i = 0; i + 1 < P.length; i++) { const [a, b] = [P[i], P[i + 1]], L = Math.hypot(b[0] - a[0], b[1] - a[1]), n = Math.ceil(L / .4); for (let k = i ? 1 : 0; k <= n; k++) pts.push([a[0] + (b[0] - a[0]) * k / n, a[1] + (b[1] - a[1]) * k / n]); }
    const pos = [], idx = []; pts.forEach(([x, z], i) => { const [p, q] = [pts[Math.max(0, i - 1)], pts[Math.min(pts.length - 1, i + 1)]], dx = q[0] - p[0], dz = q[1] - p[1], l = Math.hypot(dx, dz), w = .4 + .08 * Math.sin(i * .7 + ph[4]);
      for (const sd of [-1, -.5, 0, .5, 1]) { const ex = x - dz / l * w * sd, ez = z + dx / l * w * sd; pos.push(ex, ground(ex, ez) + .03, ez); } if (i) { const o2 = (i - 1) * 5; for (let c = 0; c < 4; c++) idx.push(o2 + c, o2 + c + 5, o2 + c + 1, o2 + c + 1, o2 + c + 5, o2 + c + 6); } });
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals(); if (g.attributes.normal.array[1] < 0) { g.setIndex(idx.map((v, j) => idx[j - j % 3 + [0, 2, 1][j % 3]])); g.computeVertexNormals(); } put(g, 'track', 0, 0, 0, 0, 0, 0, .35); }
  // the waggons: built in their own frame (x along the bed, +x the shafts' end, z across) with world heights, then turned and set down
  const V2 = (a, b) => new THREE.Vector2(a, b), wagons = [];
  const wagon = (cx, cz, ry, load) => { const c = Math.cos(ry), s = Math.sin(ry), wp = (x, y, z) => [cx + x * c + z * s, y, cz - x * s + z * c], gw = (x, z) => ground(cx + x * c + z * s, cz - x * s + z * c), Mx = new THREE.Matrix4().makeRotationY(ry).setPosition(cx, 0, cz);
    const P = (geo, k, x, y, z, rx = 0, ry2 = 0, rz = 0) => { geo.applyMatrix4(new THREE.Matrix4().compose(V3(x, y, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(rx, ry2, rz, 'YXZ')), V3(1, 1, 1))); geo.applyMatrix4(Mx); return put(geo, k); };
    const R = (k, a, b, rad, seg = 6) => rod(k, wp(...a), wp(...b), rad, seg);
    const BL = 3.6, BW = 1.4, wheels = [], ax = { back: [-1.1, .72], front: [1.15, .52] }, ay = {};
    for (const [nm, [x, wr]] of Object.entries(ax)) { const ys = []; for (const sz of [-1, 1]) { const z = sz * .86, y = gw(x, z) + wr; ys.push(y);
        const g = new THREE.CylinderGeometry(.09, .09, .16, 8); g.rotateX(Math.PI / 2); P(g, 'wood', x, y, z); const t = new THREE.TorusGeometry(wr - .03, .035, 4, 18); P(t, 'iron', x, y, z);
        const fe = new THREE.TorusGeometry(wr - .08, .04, 4, 14); P(fe, 'wood', x, y, z); for (let k = 0; k < (wr > .6 ? 12 : 10); k++) { const a = k / (wr > .6 ? 12 : 10) * 6.283 + ph[5]; const sp = new THREE.CylinderGeometry(.022, .026, wr - .14, 4); sp.translate(0, (wr - .14) / 2 + .07, 0); P(sp, 'wood', x, y, z, 0, 0, a); }
        const w = wp(x, y, z); wheels.push({ x: +w[0].toFixed(3), y: +y.toFixed(3), z: +w[2].toFixed(3), r: wr }); } ay[nm] = ys; R('wood', [x, ys[0], -.95], [x, ys[1], .95], .055, 6); }
    const bed = Math.max(...ay.back) + .1, top = bed + .08; P(new THREE.BoxGeometry(BL, .08, BW), 'paint', 0, bed + .04, 0);
    for (const sz of [-1, 1]) { P(new THREE.BoxGeometry(BL, .45, .05), 'paint', 0, top + .225, sz * (BW / 2 - .025)); R('wood', [-BL / 2, bed - .03, sz * .5], [BL / 2, bed - .03, sz * .5], .05, 5); }
    for (const sx of [-1, 1]) P(new THREE.BoxGeometry(.05, .45, BW), 'paint', sx * (BL / 2 - .025), top + .225, 0);
    const fa = Math.max(...ay.front); P(new THREE.BoxGeometry(.2, bed - fa, BW - .2), 'wood', ax.front[0], (bed + fa) / 2, 0); P(new THREE.BoxGeometry(.2, bed - Math.max(...ay.back) + .02, BW - .2), 'wood', ax.back[0], bed - .04, 0);
    // the tilt: five hoops, straight sides rising 0.75 m from the boards, an arc of 0.72 m over; the canvas over them, a little longer than the bed
    const TR = .72, T0 = top + .4, TV = .75, prof = []; for (let k = 0; k <= 4; k++) prof.push([-TR, T0 + TV * k / 4]); for (let k = 1; k <= 12; k++) { const a = Math.PI - k / 12 * Math.PI; prof.push([TR * Math.cos(a), T0 + TV + TR * Math.sin(a)]); } for (let k = 3; k >= 0; k--) prof.push([TR, T0 + TV * k / 4]);
    const tilt = (u, v, sag) => { const q = prof[Math.round(v * (prof.length - 1))], x = -BL / 2 - .12 + u * (BL + .2), dent = sag * Math.pow(Math.sin(u * 5 * Math.PI), 2) * Math.min(1, (q[1] - T0) / TV); const s2 = Math.hypot(q[0], q[1] - T0 - TV) || 1, k2 = q[1] > T0 + TV ? 1 - dent / s2 : 1;
      return wp(x, q[1] > T0 + TV ? T0 + TV + (q[1] - T0 - TV) * k2 : q[1], q[0] * (q[1] > T0 + TV ? k2 : 1 - dent * .5)); };
    grid('canvas', 20, prof.length - 1, (u, v) => tilt(u, v, .035), .6);
    for (let h = 0; h < 5; h++) { const x = -BL / 2 + .1 + h * (BL - .2) / 4; for (let k = 0; k + 1 < prof.length; k++) R('wood', [x, prof[k][1], prof[k][0] * .985], [x, prof[k + 1][1], prof[k + 1][0] * .985], .022, 4); }
    // the shafts: from the front of the bed down to the grass ahead, a bar between them
    for (const sz of [-1, 1]) R('wood', [BL / 2 - .3, bed - .02, sz * .42], [BL / 2 + 2.9, gw(BL / 2 + 2.9, sz * .42) + .045, sz * .42], .045, 6);
    // the load: sacks and crates in the bed, seen under the tilt
    if (load) for (let k = 0; k < 5; k++) { const x = -1.3 + k * .62, h = .4 + F() * .12; if (k % 2) P(new THREE.BoxGeometry(.5, h, .6), 'wood', x, top + h / 2, (F() - .5) * .3, 0, (F() - .5) * .2); else { const g = new THREE.LatheGeometry([V2(.001, 0), V2(.24, .01), V2(.27, .3), V2(.08, .6), V2(.001, .62)], 8); P(g, 'sack', x, top, (F() - .5) * .3); } }
    const W = { x: cx, z: cz, ry, wheels, bed: +bed.toFixed(3), crown: +(T0 + TV + TR).toFixed(3), T0, TV, TR, wp, gw, BL };
    wagons.push(W); return W; };
  const WA = wagon(AX, AZ, 0, true), WB = wagon(-9.5, -1.5, .62, false);
  // the stall: the fly laced along the first waggon's tilt where the arc meets the side at 55 degrees, carried 3 m out on two poles
  const TA = Math.PI * 55 / 180, tieZ = AZ + WA.TR * Math.sin(TA), tieY = WA.T0 + WA.TV + WA.TR * Math.cos(TA), PZ = AZ + 3.6, PX = [AX - 1.85, AX + 1.85], poleY = Math.max(...PX.map(x => ground(x, PZ))) + 2.25;
  grid('canvas', 16, 8, (u, v) => { const x = PX[0] - .25 + u * (PX[1] - PX[0] + .5), z = tieZ + v * (PZ + .25 - tieZ), y = tieY + (poleY - tieY) * Math.min(1, v * (PZ + .25 - tieZ) / (PZ - tieZ)) - .07 * Math.sin(v * Math.PI) * (.6 + .4 * Math.sin(u * Math.PI)); return [x, y, z]; }, .6);
  const pegs = []; for (const [i, x] of PX.entries()) { const y0 = ground(x, PZ); rod('wood', [x, y0 - .3, PZ], [x, poleY + .12, PZ], .04, 6);
    const sx = i ? 1 : -1, pg = [x + sx * 1.4, 0, PZ + 1.3]; pg[1] = ground(pg[0], pg[2]); rod('rope', [x, poleY + .06, PZ], [pg[0], pg[1] + .1, pg[2]], .008, 3); rod('wood', [pg[0], pg[1] - .2, pg[2]], [pg[0] - sx * .05, pg[1] + .14, pg[2] - .05], .025, 4); pegs.push(pg.map(v => +v.toFixed(3))); }
  { const x = PX[1] - .08, y = poleY - .45, z = PZ + .06; rod('iron', [PX[1], poleY - .2, PZ], [x, y + .3, z], .006, 3); put(new THREE.BoxGeometry(.16, .24, .16), 'lamp', x, y + .1, z); put(new THREE.ConeGeometry(.13, .1, 4), 'iron', x, y + .27, z, 0, Math.PI / 4); put(new THREE.BoxGeometry(.18, .03, .18), 'iron', x, y - .03, z); }
  const awning = { tie: [+tieZ.toFixed(3), +tieY.toFixed(3)], front: +PZ.toFixed(3), poles: PX.map(x => ({ x, z: PZ, y0: +ground(x, PZ).toFixed(3), y1: +poleY.toFixed(3) })), pegs, area: [PX[0], PX[1], tieZ + .3, PZ - .05] };
  // the tables: two trestles under the fly, their boards level, their feet on the grass
  const tables = [], goods = [];
  const table = (x, z, w, d) => { const feet = []; for (const sx of [-1, 1]) for (const sz of [-1, 1]) feet.push([x + sx * (w / 2 - .2), z + sz * (d / 2 - .05)]); const top = Math.max(...feet.map(([fx, fz]) => ground(fx, fz))) + .8;
    put(new THREE.BoxGeometry(w, .04, d), 'wood', x, top - .02, z); for (const sx of [-1, 1]) { for (const sz of [-1, 1]) rod('wood', [x + sx * (w / 2 - .2), ground(x + sx * (w / 2 - .2), z + sz * (d / 2 - .05)) - .04, z + sz * (d / 2 - .05)], [x + sx * (w / 2 - .2), top - .04, z + sz * .1], .025, 4); put(new THREE.BoxGeometry(.06, .06, d - .1), 'wood', x + sx * (w / 2 - .2), top - .07, z); }
    const T = { x, z, top: +top.toFixed(3), w, d, feet: feet.map(([fx, fz]) => [fx, +ground(fx, fz).toFixed(3), fz]) }; tables.push(T); return T; };
  const T1 = table(AX - .95, AZ + 2.05, 1.7, .7), T2 = table(AX + .95, AZ + 2.05, 1.7, .7);
  { let i = 0; for (const k of ['boltR', 'boltB', 'boltY', 'boltR', 'boltB', 'boltY', 'boltB', 'boltR']) { const x = T1.x - .7 + i * .2, rr = .085, g = new THREE.CylinderGeometry(rr, rr, .62, 10); g.rotateX(Math.PI / 2); put(g, k, x, T1.top + rr, T1.z + (i % 2) * .05); goods.push([x, T1.top, T1.z]); i++; }
    for (let j = 0; j < 3; j++) { const k = ['boltY', 'boltR', 'boltB'][j], x = T1.x - .5 + j * .3, g = new THREE.CylinderGeometry(.085, .085, .62, 10); g.rotateX(Math.PI / 2); put(g, k, x, T1.top + .085 + .16, T1.z + .02); } } /* a second course in the hollows of the first */
  { const crock = (x, z, h, rr, k = 'crock') => { put(new THREE.LatheGeometry([V2(.001, 0), V2(rr * .8, 0), V2(rr, h * .4), V2(rr * .9, h * .8), V2(rr * .45, h * .92), V2(rr * .5, h), V2(.001, h)], 10), k, x, T2.top, z); goods.push([x, T2.top, z]); };
    crock(T2.x - .65, T2.z - .1, .32, .13); crock(T2.x - .38, T2.z + .12, .26, .11); crock(T2.x - .15, T2.z - .12, .4, .14); crock(T2.x + .1, T2.z + .15, .22, .1); crock(T2.x + .3, T2.z - .1, .3, .12);
    put(new THREE.BoxGeometry(.36, .22, .26), 'paint', T2.x + .62, T2.top + .11, T2.z, 0, .2); put(new THREE.BoxGeometry(.38, .025, .28), 'iron', T2.x + .62, T2.top + .225, T2.z, 0, .2); goods.push([T2.x + .62, T2.top, T2.z]); }
  // the fire: a ring of stones, embers, a crane of two forked irons and a bar, the pot on its hook; two seat logs; a thin smoke
  const fy = ground(FX, FZ);
  for (let k = 0; k < 9; k++) { const a = k / 9 * 6.283 + F() * .3, st = new THREE.IcosahedronGeometry(.11 + F() * .05, 0); st.scale(1.2, .7, 1); put(st, 'gravel', FX + .42 * Math.cos(a), fy + .04, FZ + .42 * Math.sin(a), 0, F() * 3); }
  put(new THREE.CylinderGeometry(.3, .33, .05, 10), 'ember', FX, fy + .025, FZ); for (let k = 0; k < 5; k++) { const a = k * 1.25 + F(); rod('bark', [FX + .3 * Math.cos(a), fy + .05, FZ + .3 * Math.sin(a)], [FX - .05 * Math.cos(a), fy + .14, FZ - .05 * Math.sin(a)], .035, 5); }
  for (const s of [-1, 1]) { rod('iron', [FX + s * .75, ground(FX + s * .75, FZ) - .15, FZ], [FX + s * .75, fy + 1.1, FZ], .014, 4); rod('iron', [FX + s * .75, fy + 1.05, FZ], [FX + s * .68, fy + 1.15, FZ], .01, 3); }
  rod('iron', [FX - .8, fy + 1.08, FZ], [FX + .8, fy + 1.08, FZ], .012, 4); const PB = fy + .32; put(new THREE.LatheGeometry([V2(.001, 0), V2(.12, .01), V2(.17, .1), V2(.16, .24), V2(.14, .27), V2(.001, .27)], 12), 'iron', FX, PB, FZ); rod('iron', [FX, PB + .27, FZ], [FX, fy + 1.07, FZ], .005, 3);
  for (const [lx, lz, la] of [[-1.5, -.6, .4], [.3, -2.4, -1.25]]) { const g = new THREE.CylinderGeometry(.17, .19, 1.5, 8); g.rotateZ(Math.PI / 2); const x = FX + lx, z = FZ + lz; put(g, 'bark', x, ground(x, z) + .14, z, 0, la); }
  const SMK = [], puff = (x, y, z, s) => { const a = F() * 3; for (const ry of [a, a + Math.PI / 3, a + 2 * Math.PI / 3]) { const g = new THREE.PlaneGeometry(s * 2.4, s * 2.0); g.rotateY(ry); g.translate(x, y, z); SMK.push(g); } };
  for (let k = 0; k < 10; k++) { const t = k / 9, h = .5 + t * 4.5; puff(FX + .5 * h * .35 + (F() - .5) * .2, fy + h, FZ + .5 * h * .35 + (F() - .5) * .2, .18 + t * .7); }
  const fire = { x: FX, z: FZ, embers: +(fy + .05).toFixed(3), pot: +PB.toFixed(3) };
  // the tent: a ridge tent, walls of 0.45 m under two pitches to the ridge, the back closed, the door to the fire with its flaps tied back
  const tent = { x: TX, z: TZ, ry: TRY, L: TL, W: TW, H: TH, door };
  { const c = Math.cos(TRY), s = Math.sin(TRY), wp = (x, y, z) => [TX + x * c + z * s, y, TZ - x * s + z * c], gt = (x, z) => ground(TX + x * c + z * s, TZ - x * s + z * c), ty = Math.max(...[[-1.3, -1.1], [1.3, -1.1], [-1.3, 1.1], [1.3, 1.1], [0, 0]].map(([x, z]) => gt(x, z))) - .02, WH = .45;
    const wall = (u, v, sz) => { const x = -TL / 2 + u * TL, z = sz * TW / 2; return wp(x, gt(x, z) - .03 + v * (ty + WH - gt(x, z) + .03), z); };
    for (const sz of [-1, 1]) { grid('canvas', 6, 1, (u, v) => wall(u, v, sz), .6); grid('canvas', 6, 4, (u, v) => { const x = -TL / 2 + u * TL, z = sz * TW / 2 * (1 - v), y = ty + WH + v * (TH - WH) - .03 * Math.sin(v * Math.PI) * Math.sin(u * Math.PI); return wp(x, y, z); }, .6); }
    grid('canvas', 6, 6, (u, v) => { const z = (u - .5) * TW, x = -TL / 2, top = ty + (Math.abs(z) < TW / 2 ? WH + (TH - WH) * (1 - Math.abs(z) / (TW / 2)) : WH); return wp(x, gt(x, z) - .03 + v * (top - gt(x, z) + .03), z); }, .6);
    for (const sz of [-1, 1]) grid('canvas', 3, 4, (u, v) => { const yy = ty + WH + (TH - WH) * (1 - u) * (1 - v * .1); return wp(TL / 2 + .05 + v * .05, gt(TL / 2, sz * TW / 2) + (yy - gt(TL / 2, sz * TW / 2)) * (1 - v * .9) * .98, sz * (TW / 2 * u * .2 + TW / 2 * .8 + .04 * v)); }, .6) /* the flaps tied back to the walls at the door */;
    for (const sx of [-1, 1]) { rod('wood', wp(sx * (TL / 2 - .04), gt(sx * (TL / 2 - .04), 0) - .2, 0), wp(sx * (TL / 2 - .04), ty + TH + .1, 0), .03, 5);
      for (const pz of sx > 0 ? [-1.2, 1.2] : [0]) { const pg = wp(sx * (TL / 2 + (sx > 0 ? .9 : 1.1)), 0, pz); pg[1] = ground(pg[0], pg[2]); rod('rope', wp(sx * (TL / 2 - .04), ty + TH + .05, 0), [pg[0], pg[1] + .08, pg[2]], .007, 3); rod('wood', [pg[0], pg[1] - .2, pg[2]], [pg[0], pg[1] + .12, pg[2]], .022, 4); } } /* the door's guy in a bridle to two pegs, so the way in is clear */
    rod('wood', wp(-TL / 2, ty + TH - .02, 0), wp(TL / 2, ty + TH - .02, 0), .03, 5);
    const b = wp(-.3, 0, -.5); put(new THREE.BoxGeometry(1.8, .14, .8), 'sack', b[0], gt(-.3, -.5) + .07, b[2], 0, TRY); const ch = wp(-.9, 0, .6); put(new THREE.BoxGeometry(.5, .32, .36), 'paint', ch[0], gt(-.9, .6) + .16, ch[2], 0, TRY);
    tent.floor = +ty.toFixed(3); tent.ridge = +(ty + TH).toFixed(3); }
  // the line: a picket rope between two posts, hay under it, two buckets, a bale of fodder
  const pa = [8.4, 1.6], pb = [14.4, 1.6], PH = 1.3; let sag = 0;
  { const ya = ground(...pa), yb = ground(...pb); rod('wood', [pa[0], ya - .4, pa[1]], [pa[0], ya + PH + .15, pa[1]], .07, 7); rod('wood', [pb[0], yb - .4, pb[1]], [pb[0], yb + PH + .15, pb[1]], .07, 7);
    const pts = []; for (let k = 0; k <= 12; k++) { const t = k / 12, x = pa[0] + (pb[0] - pa[0]) * t, y = ya + PH + (yb - ya) * t - .12 * Math.sin(t * Math.PI); pts.push(V3(x, y, pa[1])); } put(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 16, .012, 3), 'rope');
    sag = +(ground((pa[0] + pb[0]) / 2, pa[1]) + PH - .12).toFixed(3); for (let k = 0; k < 3; k++) { const x = 9.6 + k * 1.9, z = pa[1] - .9, y = ground(x, z); put(new THREE.LatheGeometry([V2(.001, 0), V2(.65, .02), V2(.55, .22), V2(.3, .36), V2(.001, .4)], 10), 'hay', x, y - .02, z, 0, F() * 3); }
    for (const [x, z] of [[pa[0] + .5, pa[1] + .5], [pb[0] - .5, pb[1] + .55]]) put(new THREE.LatheGeometry([V2(.001, 0), V2(.14, 0), V2(.17, .3), V2(.17, .3), V2(.001, .3)], 9), 'wood', x, ground(x, z), z);
    const bx = pb[0] + .9, bz = pb[1] + .1, by = ground(bx, bz); put(new THREE.BoxGeometry(1.0, .55, .6), 'hay', bx, by + .26, bz, 0, .3); }
  const picket = { a: pa, b: pb, h: PH, sag };
  // the goods stacked by the second waggon: casks on their ends, wool bales in rope bands, crates, each on the ground or on the one below
  const stack = []; { const sx = -8.6, sz = -5.6, cask = (x, z, y) => { put(new THREE.LatheGeometry([V2(.001, 0), V2(.26, 0), V2(.31, .28), V2(.26, .56), V2(.001, .56)], 12), 'wood', x, y, z); for (const h of [.06, .5]) put(new THREE.TorusGeometry(.275, .012, 3, 14).rotateX(Math.PI / 2), 'iron', x, y + h, z); stack.push({ x, y, z }); };
    for (let k = 0; k < 4; k++) { const x = sx + k * .64, z = sz; cask(x, z, ground(x, z) - .01); }
    for (let k = 0; k < 4; k++) { const x = sx + 3.0 + (k % 2) * 1.0, z = sz + .2 + Math.floor(k / 2) * .7, y0 = ground(x, z); put(new THREE.BoxGeometry(.9, .6, .6), 'sack', x, y0 + .29, z, 0, (F() - .5) * .1); for (const d of [-.25, .25]) put(new THREE.BoxGeometry(.04, .62, .62), 'rope', x + d, y0 + .29, z); stack.push({ x, y: y0 - .01, z }); }
    { const x = sx + 3.5, z = sz + .2, y0 = Math.max(ground(x - .45, z), ground(x + .45, z), ground(x, z)) + .59; put(new THREE.BoxGeometry(.9, .6, .6), 'sack', x, y0 + .29, z, 0, .05); stack.push({ x, y: y0, z }); } /* across the two in the front row */
    for (let k = 0; k < 3; k++) { const x = sx - .9, z = sz + 1.2 + Math.min(k, 1) * .55, y = ground(x, z) + (k === 2 ? .45 : 0), s = .45; put(new THREE.BoxGeometry(.55, s, .5), 'wood', x, y + s / 2, z, 0, k === 2 ? .2 : (F() - .5) * .02); stack.push({ x, y, z }); } }
  // the thorn hedge along the road's far side, with gaps; ash on the green's edge; alder by the water; off the road, the paths and the camp
  const keep = [[AX, AZ + 1.5, 4.2], [WB.x, WB.z, 4.0], [FX, FZ, 2.2], [TX, TZ, 3.2], [11.4, 1.6, 4.0], [-7.2, -5.4, 2.6]];
  const clearOf = (x, z, m) => Math.abs(z - RZ) < RW / 2 + m || pathD(x, z) < m || keep.some(([kx, kz, kr]) => Math.hypot(x - kx, z - kz) < kr + m) || Math.abs(x - xs(z)) < CH + m * .5;
  for (let x = -60; x < 60; x += 1.25) { if (Math.sin(x * .13 + ph[6]) > .82 || Math.abs(x - xs(16.4)) < CH + 1) continue; const z = RZ + RW / 2 + 2.0 + (F() - .5) * .3, y = ground(x, z); for (let k = 0; k < 2; k++) put(new THREE.IcosahedronGeometry(.75 + F() * .3, 0).scale(1, .9, .8), 'leaf', x + (F() - .5) * .4, y + .55 + k * .65, z + (F() - .5) * .3, F(), F() * 3); }
  const trees = []; const tree = (x, z, h, alder) => { const gy = ground(x, z), top = [x + (F() - .5) * .5, gy + h * .5, z + (F() - .5) * .5]; rod('bark', [x, gy - .3, z], top, .16 + h * .012, 7, .7);
    for (let l = 0; l < 5; l++) { const a = l * 1.3 + F(), L = (alder ? 1.0 : 1.6) + F() * 1.4, e = [top[0] + Math.cos(a) * L, top[1] + .8 + l * .55 + F(), top[2] + Math.sin(a) * L]; rod('bark', [top[0], top[1] - .5 + l * .25, top[2]], e, .07, 5, .6);
      for (let c2 = 0; c2 < 3; c2++) put(new THREE.IcosahedronGeometry(.9 + F() * .6, 0).scale(1.15, .8, 1.15), 'leaf', e[0] + (F() - .5) * 1.6, e[1] + (F() - .4) * 1.2, e[2] + (F() - .5) * 1.6, F(), F() * 3); }
    put(new THREE.IcosahedronGeometry(1.4, 0).scale(1.15, .85, 1.15), 'leaf', top[0], gy + h * .85, top[2]); trees.push({ x: +x.toFixed(2), z: +z.toFixed(2), h: +h.toFixed(2) }); };
  for (let k = 0, n = 0; k < 900 && n < 9; k++) { const x = -36 + F() * 52, z = -30 + F() * 26; if (clearOf(x, z, 3) || trees.some(t => Math.hypot(t.x - x, t.z - z) < 8)) continue; n++; tree(x, z, 9 + F() * 4, false); }
  for (let k = 0, n = 0; k < 900 && n < 7; k++) { const z = -34 + F() * 44, x = xs(z) + (F() < .5 ? -1 : 1) * (CH + 1.2 + F() * 1.2); if (Math.abs(z - RZ) < 5 || pathD(x, z) < 1.5 || trees.some(t => Math.hypot(t.x - x, t.z - z) < 5)) continue; n++; tree(x, z, 6 + F() * 3, true); }
  const group = new THREE.Group(); let tris = 0; { const g = mergeGeometries(SMK, false); SMK.forEach(x => x.dispose()); const m = new THREE.Mesh(g, M.smoke); m.name = 'smoke'; m.renderOrder = 2; group.add(m); tris += g.index.count / 3; }
  for (const [k, gs] of B) { const g = mergeGeometries(gs, false); gs.forEach(x => x.dispose()); const m = new THREE.Mesh(g, M[k]); m.name = k; if (k === 'water') m.renderOrder = 1;
    m.castShadow = !['turf', 'track', 'gravel', 'water', 'ember', 'ash', 'dark'].includes(k); m.receiveShadow = k !== 'water'; group.add(m); tris += g.attributes.position.count / 3; }
  return { group, tris: Math.round(tris), draws: group.children.length, own: group.children.length, top: +new THREE.Box3().setFromObject(group).max.y.toFixed(2), ground,
    wagons: wagons.map(w => ({ x: w.x, z: w.z, ry: w.ry, wheels: w.wheels, bed: w.bed, crown: w.crown })), awning, tables, goods: goods.map(g => g.map(v => +v.toFixed(3))), fire, tent, picket, stack: stack.map(s => ({ x: +s.x.toFixed(3), y: +s.y.toFixed(3), z: +s.z.toFixed(3) })),
    stream: { xAt: xs, water: waterY, bed: bedY, bank: bankY, w: 2 * CH, ford: { z: RZ, depth: +(waterY(RZ) - roadY(xs(RZ))).toFixed(3) } }, stones, road: { z: RZ, w: RW }, paths, trees };
}

// ── the Mark's hunters' camp (Session 1022, card F8; OG-124's "camps on the roads: … hunters"). The precedents: the autumn hunting camps of
// the northern fells, where a party lived a few weeks by a road into the hills in a tent of hides on a cone of poles (the shape every
// northern people used, from the Norse fell-booths to the reindeer-folk's), dried and smoked its meat on a pole rack over a slow fire,
// stretched its hides on frames and hung its kill from a pole between two trees. Built at true size, a metre a unit, in birch and pine
// heath on a slope rising to -z at 1 in 16, the road along x at z 12:
//   - the tent: a cone of 12 poles 4.8 m across at the ground, crossing at 3.4 m, under a cover of hides to 2.85 m (the smoke hole above);
//     its door a gap 1.0 m wide at the hip and 1.5 m high, the door hide rolled over it; a fire in its middle in a ring of stones and
//     hides for bedding round it; smoke from the hole, leaning on the wind;
//   - the rack: four posts and two rails at 1.8 m, cross-poles over them hung with strips of meat, a slow fire of green wood under it,
//     its smoke rising through the strips;
//   - the hide frame: a square of poles 1.8 m a side leaning on two props, a hide laced into it;
//   - the game pole: lashed between two pines at 2.6 m, a gambrel on a rope from it, empty (the kill is the bodies builder's), a tub below;
//   - the woodpile against a boulder, a chopping stump with its axe, a rack of three spears;
//   - the land: heather, moss and granite boulders, birch going yellow and pine; trodden paths from the road to the door and in, to the
//     rack, the frame, the game pole and the wood.
// -> { group, tris, draws, own, ground(x, z), tent { x, z, y, R, H, cover, rAt(y), poles [[foot], [top]], door { w, h, phi } }, rack { x, z, posts [[x, y0, y1, z]], strips [[x, y, z]] (bottoms), embers },
//      frame { corners [[x, y, z]], feet [[x, y, z]], hide [[x, y, z]] }, gamePole { a [x, y, z], b [x, y, z], trees [{ x, z, r }] }, wood { logs [[x, y]], z }, smoke [[x, y, z]], road { z, w }, paths, trees [{ x, z, h, kind }] }
export function markHuntersCamp(o = {}, r = stream('hunters')) {
  const std = (c, ro = .9, x = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: ro, ...x }); markTextures();
  const M = { turf: mat('turfMoss', { ns: 1.0, color: 0xf2e8b4, rough: 1 }), track: mat('turfDry', { ns: 1.0, color: 0xc0aa84, rough: 1 }), rock: mat('rock', { ns: 1.2, color: 0x9a948a, rough: .95 }),
    hide: std(0x7a5a3e, .95, { side: THREE.DoubleSide }), pole: mat('wood', { ns: .9, color: 0xa88e6a, rough: .9 }), bark: std(0x5a4a3c, .95), birch: std(0xd8d4ca, .8), needle: std(0x2e3e2a, .9), leaf: std(0xb89a4c, .85),
    heather: std(0x5a4636, 1), meat: std(0x5a1e18, .55), ember: std(0x2a1408, .6, { emissive: new THREE.Color(1, .4, .12), emissiveIntensity: 2.2 }), iron: std(0x2a2826, .5, { metalness: .6 }), billet: mat('beam', { ns: .9, color: 0x9a8262, rough: .95 }),
    smoke: std(0xb0aca4, 1, { map: puffTex(), transparent: true, opacity: .42, depthWrite: false, side: THREE.DoubleSide }) };
  const B = new Map(), key = String(o.key || 'hunters'), F = stream(key + ':lie'), ph = Array.from({ length: 10 }, () => F() * 6.283), V3 = (x, y, z) => new THREE.Vector3(x, y, z), V2 = (a, b) => new THREE.Vector2(a, b);
  const put = (geo, k, x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0, uv = .5) => { const g = geo.index ? geo.toNonIndexed() : geo; for (const a of Object.keys(g.attributes)) if (!['position', 'normal'].includes(a)) g.deleteAttribute(a);
    if (!g.attributes.normal) g.computeVertexNormals(); g.applyMatrix4(new THREE.Matrix4().compose(V3(x, y, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(rx, ry, rz, 'YXZ')), V3(1, 1, 1))); worldUV(g, uv);
    if (!B.has(k)) B.set(k, []); B.get(k).push(g); return g; };
  const rod = (k, a, b, rad, seg = 6, taper = 1) => { const A = V3(...a), C = V3(...b), d = C.clone().sub(A), g = new THREE.CylinderGeometry(rad * taper, rad, d.length(), seg);
    g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(V3(0, 1, 0), d.clone().normalize())); g.translate((A.x + C.x) / 2, (A.y + C.y) / 2, (A.z + C.z) / 2); return put(g, k); };
  const sm = t => { t = Math.min(1, Math.max(0, t)); return t * t * (3 - 2 * t); };
  // the land: rising to -z at 1 in 16, rolling; level stances for the tent and the rack; the road along x
  const RZ = 12, RW = 3.0, base = (x, z) => -z / 16 + .14 * Math.sin(x * .17 + ph[0]) * Math.sin(z * .14 + ph[1]) + .05 * Math.sin(x * .5 + z * .43 + ph[2]);
  const TX = -3, TZ = 0, TR = 2.4, TH = 3.4, TC = 2.85, KX = 4.0, KZ = -1.2;
  const pads = [{ x: TX, z: TZ, r: TR + .8 }, { x: KX, z: KZ, r: 2.2 }]; for (const p of pads) p.y = +base(p.x, p.z).toFixed(3);
  const roadY = x => base(x, RZ);
  const ground = (x, z) => { let b = base(x, z); for (const p of pads) { const w = sm((p.r + 1.4 - Math.hypot(x - p.x, z - p.z)) / 1.4); if (w > 0) b += (p.y - b) * w; }
    const rw = sm((RW / 2 + 1.2 - Math.abs(z - RZ)) / 1.2); return b + (roadY(x) - .04 * Math.min(1, Math.abs(z - RZ) / (RW / 2)) - b) * rw; };
  const ty = pads[0].y, ky = pads[1].y;
  // the paths: from the road to the tent's door and in; from the door to the rack and on to the game pole; from the door to the wood and the frame
  const GP = [[8.0, 3.2], [11.2, 3.0]], FRX = -8.2, FRZ = 4.2, WX = -8.6, WZ = -3.4;
  const paths = [[[-1.6, RZ], [-2.4, 7.0], [TX, TZ + TR + 1.0], [TX, TZ + TR - .2], [TX, TZ + .7]], [[TX + .6, TZ + TR + 1.2], [1.4, 3.0], [KX - .4, KZ + 2.4], [7.0, 1.4], [9.6, 1.6]], [[TX - .6, TZ + TR + 1.2], [-6.0, 2.6], [FRX + 1.4, FRZ - 1.6], [-7.4, -.4], [WX + .6, WZ + 1.3]]];
  const segD = (x, z, a, b) => { const dx = b[0] - a[0], dz = b[1] - a[1], t = Math.max(0, Math.min(1, ((x - a[0]) * dx + (z - a[1]) * dz) / (dx * dx + dz * dz))); return Math.hypot(x - a[0] - dx * t, z - a[1] - dz * t); };
  const pathD = (x, z) => Math.min(...paths.flatMap(p => p.slice(0, -1).map((q, i) => segD(x, z, q, p[i + 1]))));
  { const steps = (bands, end) => { const v = []; for (const [a, b, st] of bands) for (let q = a; q < b - 1e-6; q += st) v.push(+q.toFixed(2)); v.push(end); return v; };
    const gx = steps([[-160, -45, 23], [-45, -20, 2.5], [-20, 20, 1.2], [20, 45, 2.5], [45, 160, 23]], 160), gz = steps([[-160, -40, 24], [-40, -16, 2.5], [-16, 18, 1.2], [18, 45, 2.5], [45, 160, 23]], 160);
    const pos = [], NX = gx.length, I = { turf: [], track: [] }; for (const z of gz) for (const x of gx) pos.push(x, ground(x, z), z);
    for (let j = 0; j + 1 < gz.length; j++) for (let i = 0; i + 1 < NX; i++) { const a = j * NX + i, b = a + 1, c = a + NX, d = c + 1, cz = (gz[j] + gz[j + 1]) / 2, cx = (gx[i] + gx[i + 1]) / 2;
      I[Math.abs(cz - RZ) < RW / 2 + .1 && Math.abs(cx) < 150 ? 'track' : 'turf'].push(a, c, b, b, c, d); }
    for (const [k, idx] of Object.entries(I)) { const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals(); put(g, k, 0, 0, 0, 0, 0, 0, .35); } }
  for (const P of paths) { const pts = []; for (let i = 0; i + 1 < P.length; i++) { const [a, b] = [P[i], P[i + 1]], L = Math.hypot(b[0] - a[0], b[1] - a[1]), n = Math.ceil(L / .4); for (let k = i ? 1 : 0; k <= n; k++) pts.push([a[0] + (b[0] - a[0]) * k / n, a[1] + (b[1] - a[1]) * k / n]); }
    const pos = [], idx = []; pts.forEach(([x, z], i) => { const [p, q] = [pts[Math.max(0, i - 1)], pts[Math.min(pts.length - 1, i + 1)]], dx = q[0] - p[0], dz = q[1] - p[1], l = Math.hypot(dx, dz), w = .36 + .07 * Math.sin(i * .7 + ph[3]);
      for (const sd of [-1, -.5, 0, .5, 1]) { const ex = x - dz / l * w * sd, ez = z + dx / l * w * sd; pos.push(ex, ground(ex, ez) + .03, ez); } if (i) { const o2 = (i - 1) * 5; for (let c = 0; c < 4; c++) idx.push(o2 + c, o2 + c + 5, o2 + c + 1, o2 + c + 1, o2 + c + 5, o2 + c + 6); } });
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals(); if (g.attributes.normal.array[1] < 0) { g.setIndex(idx.map((v, j) => idx[j - j % 3 + [0, 2, 1][j % 3]])); g.computeVertexNormals(); } put(g, 'track', 0, 0, 0, 0, 0, 0, .35); }
  // the tent: twelve poles from the ground to their crossing, the cover of hides on them to 3.0 m, the door a gap facing the road (+z)
  const rAt = y => TR * (1 - y / TH) + .03, GAP = .72, DH = 1.5, poles = [];
  for (let k = 0; k < 12; k++) { const a = GAP / 2 + .02 + k * (2 * Math.PI - GAP - .04) / 11, fx = TX + (TR + .02) * Math.sin(a), fz = TZ + (TR + .02) * Math.cos(a), ta = a + Math.PI + (F() - .5) * .3, top = [TX + .28 * Math.sin(ta), ty + TH + .55 + F() * .2, TZ + .28 * Math.cos(ta)];
    const foot = [fx, ty - .12, fz]; rod('pole', foot, top, .035, 5, .7); poles.push([foot.map(v => +v.toFixed(3)), top.map(v => +v.toFixed(3))]); }
  { const band = (y0, y1, n, p0, pl) => { const pts = []; for (let k = 0; k <= n; k++) { const y = y0 + (y1 - y0) * k / n; pts.push(V2(rAt(y) + .015 * Math.sin(k * 2.1 + ph[4]), y)); } return new THREE.LatheGeometry(pts, 28, p0, pl); };
    put(band(-.04, DH, 5, GAP / 2, 2 * Math.PI - GAP), 'hide', TX, ty, TZ, 0, 0, 0, .8); put(band(DH, TC, 5, 0, 2 * Math.PI), 'hide', TX, ty, TZ, 0, 0, 0, .8);
    for (let k = 0; k < 5; k++) { const y = .3 + k * .65, rr = rAt(y) + .012; put(new THREE.TorusGeometry(rr, .008, 3, 40, 2 * Math.PI - (y < DH ? GAP : 0)).rotateX(Math.PI / 2).rotateY(y < DH ? GAP / 2 - Math.PI / 2 : 0), 'pole', TX, ty + y, TZ); } /* the seams between the courses of hides, sewn */
    const fy = DH + .05, fr = rAt(fy) + .06; { const g = new THREE.CylinderGeometry(.09, .09, 2 * fr * Math.sin(GAP / 2) + .3, 8); g.rotateZ(Math.PI / 2); put(g, 'hide', TX, ty + fy, TZ + fr * Math.cos(GAP / 2)); } /* the door hide, rolled up over the door */
    for (let k = 0; k < 7; k++) { const a = k / 7 * 6.283 + .3, st = new THREE.IcosahedronGeometry(.1 + F() * .04, 0); st.scale(1.2, .7, 1); put(st, 'rock', TX + .45 * Math.sin(a), ty + .04, TZ + .45 * Math.cos(a)); }
    put(new THREE.CylinderGeometry(.28, .3, .05, 10), 'ember', TX, ty + .025, TZ);
    for (const a of [Math.PI * .6, Math.PI, Math.PI * 1.4]) { const g = new THREE.BoxGeometry(1.6, .08, .9); put(g, 'hide', TX + 1.3 * Math.sin(a), ty + .04, TZ + 1.3 * Math.cos(a), 0, a + Math.PI / 2); } } /* bedding round the fire, off the doorway */
  const tent = { x: TX, z: TZ, y: ty, R: TR, H: TH, cover: TC, rAt, poles, door: { w: +(2 * rAt(1.0) * Math.sin(GAP / 2)).toFixed(3), h: DH, phi: 0 } };
  // the smoke: from the smoke hole, and through the rack's strips; the wind from the west, so it leans east
  const SMK = [], smoke = [], puff = (x, y, z, s) => { const a = F() * 3; for (const ry of [a, a + Math.PI / 3, a + 2 * Math.PI / 3]) { const g = new THREE.PlaneGeometry(s * 2.4, s * 2.0); g.rotateY(ry); g.translate(x, y, z); SMK.push(g); } smoke.push([x, y, z]); };
  for (let k = 0; k < 10; k++) { const t = k / 9, h = .2 + t * 5; puff(TX + .55 * h + (F() - .5) * .2, ty + TC + .3 + h, TZ + .1 * h + (F() - .5) * .2, .2 + t * .9); }
  // the rack: four posts and two rails at 1.8 m, five cross-poles over them, strips of meat hung from each; a slow fire under it
  const RL = 3.0, RD = 1.3, RH = 1.8, posts = [], strips = [];
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) { const x = KX + sx * RL / 2, z = KZ + sz * RD / 2; rod('pole', [x, ky - .3, z], [x, ky + RH + .12, z], .05, 6); posts.push([x, +(ky - .3).toFixed(3), +(ky + RH + .12).toFixed(3), z]); }
  for (const sz of [-1, 1]) rod('pole', [KX - RL / 2 - .15, ky + RH, KZ + sz * RD / 2], [KX + RL / 2 + .15, ky + RH, KZ + sz * RD / 2], .04, 6);
  for (let c = 0; c < 5; c++) { const x = KX - RL / 2 + .3 + c * (RL - .6) / 4; rod('pole', [x, ky + RH + .07, KZ - RD / 2 - .15], [x, ky + RH + .07, KZ + RD / 2 + .15], .025, 5);
    for (let s = 0; s < 5; s++) { const z = KZ - RD / 2 + .15 + s * (RD - .3) / 4 + (F() - .5) * .05, L = .4 + F() * .18; put(new THREE.BoxGeometry(.035, L, .09 + F() * .03), 'meat', x + (F() - .5) * .02, ky + RH + .05 - L / 2, z, 0, (F() - .5) * .4, (F() - .5) * .08); strips.push([+x.toFixed(3), +(ky + RH + .05 - L).toFixed(3), +z.toFixed(3)]); } }
  put(new THREE.CylinderGeometry(.42, .46, .06, 10), 'ember', KX, ky + .03, KZ); for (let k = 0; k < 6; k++) { const a = k * 1.05 + F() * .3; rod('billet', [KX + .55 * Math.cos(a), ky + .06, KZ + .55 * Math.sin(a)], [KX - .05 * Math.cos(a), ky + .16, KZ - .05 * Math.sin(a)], .045, 5); } /* green wood, laid to smoulder */
  for (let k = 0; k < 9; k++) { const t = k / 8, h = .3 + t * 3.6; puff(KX + (F() - .5) * 1.4 * (1 - t * .5) + .35 * h, ky + h, KZ + (F() - .5) * .6, .22 + t * .55); }
  const rack = { x: KX, z: KZ, y: ky, posts, strips, embers: +(ky + .06).toFixed(3), L: RL, D: RD };
  // the hide frame: four poles lashed in a square, leaning back on two props, a hide laced into it
  const frame = { corners: [], feet: [], hide: [] }; { const S = 1.8, lean = .32, fy0 = ground(FRX, FRZ), c = [];
    const at = (u, v) => [FRX + (u - .5) * S, fy0 + .25 + v * S * Math.cos(lean), FRZ - v * S * Math.sin(lean)] /* its foot along x, leaning back to -z, to the road */;
    for (const [u, v] of [[0, 0], [1, 0], [1, 1], [0, 1]]) c.push(at(u, v));
    for (let k = 0; k < 4; k++) { const a = c[k], b = c[(k + 1) % 4], d = V3(...b).sub(V3(...a)).normalize().multiplyScalar(.18); rod('pole', V3(...a).sub(d).toArray(), V3(...b).add(d).toArray(), .035, 5); }
    for (const k of [0, 1]) { const f = [c[k][0], ground(c[k][0], c[k][2]) - .1, c[k][2] + .05]; rod('pole', f, [c[k][0], c[k][1] + .02, c[k][2]], .035, 5); frame.feet.push(f.map(v => +v.toFixed(3))); }
    for (const k of [2, 3]) { const p = [c[k][0], ground(c[k][0], c[k][2] - 1.0), c[k][2] - 1.0]; rod('pole', [p[0], p[1] - .12, p[2]], c[k], .03, 5); frame.feet.push([+p[0].toFixed(3), +(p[1] - .12).toFixed(3), +p[2].toFixed(3)]); }
    const hp = []; for (const [u, v] of [[.12, .1], [.88, .1], [.9, .9], [.1, .88]]) hp.push(at(u, v)); const g = new THREE.BufferGeometry(), q = (i, j) => { const a = hp[0].map((v, n) => v + (hp[1][n] - v) * i), b = hp[3].map((v, n) => v + (hp[2][n] - v) * i); return a.map((v, n) => v + (b[n] - v) * j); };
    const pos = []; for (let j = 0; j < 4; j++) for (let i = 0; i < 4; i++) { const a = q(i / 4, j / 4), b = q((i + 1) / 4, j / 4), cc = q(i / 4, (j + 1) / 4), d = q((i + 1) / 4, (j + 1) / 4); pos.push(...a, ...b, ...cc, ...b, ...d, ...cc); }
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.computeVertexNormals(); put(g, 'hide');
    for (let k = 0; k < 4; k++) for (let s = 1; s < 6; s++) { const t = s / 6, a = hp[k].map((v, n) => v + (hp[(k + 1) % 4][n] - v) * t), b = c[k].map((v, n) => v + (c[(k + 1) % 4][n] - v) * t); rod('pole', a, b, .006, 3); } /* the lacing, from the hide's edge to the poles */
    frame.corners = c.map(p => p.map(v => +v.toFixed(3))); frame.hide = hp.map(p => p.map(v => +v.toFixed(3))); }
  // the trees: two pines for the game pole, then birch and pine over the heath, kept off the road, the paths and the camp
  const trees = [], keep = [[TX, TZ, TR + 1.2], [KX, KZ, 2.4], [FRX, FRZ, 1.8], [WX, WZ, 2.2], [-6.2, -2.2, 1.2], [9.6, 2.0, 1.4]];
  const pine = (x, z, h) => { const gy = ground(x, z); rod('bark', [x, gy - .3, z], [x, gy + h, z], .17 + h * .009, 7, .35); for (let t = 0; t < 5; t++) { const f = t / 5, y0 = gy + h * (.45 + f * .48), th = h * .2, rw = (1.9 - f * 1.4) * (.9 + F() * .2); put(new THREE.ConeGeometry(rw, th, 7, 1, true), 'needle', x, y0 + th / 2, z, 0, F() * 3); }
    trees.push({ x: +x.toFixed(2), z: +z.toFixed(2), h: +h.toFixed(2), kind: 'pine', r: .17 + h * .009 }); };
  const birch = (x, z, h) => { const gy = ground(x, z), lean = (F() - .5) * .12; put(new THREE.CylinderGeometry(.07, .13, h * .7, 6), 'birch', x, gy + h * .35 - .1, z, 0, 0, lean);
    for (let c = 0; c < 7; c++) put(new THREE.IcosahedronGeometry(.5 + F() * .3, 0).scale(1, 1.2, 1), 'leaf', x + (F() - .5) * 1.3 - lean * h * .5, gy + h * (.55 + c * .06) + (F() - .5) * .4, z + (F() - .5) * 1.3, F(), F() * 3); trees.push({ x: +x.toFixed(2), z: +z.toFixed(2), h: +h.toFixed(2), kind: 'birch' }); };
  for (const [x, z] of GP) pine(x, z, 11 + F() * 2);
  const clearOf = (x, z, m) => Math.abs(z - RZ) < RW / 2 + m || pathD(x, z) < m || keep.some(([a, b, rr]) => Math.hypot(x - a, z - b) < rr + m);
  for (let k = 0, n = 0; k < 900 && n < 12; k++) { const x = -34 + F() * 68, z = -30 + F() * 60; if (clearOf(x, z, 2.4) || trees.some(t => Math.hypot(t.x - x, t.z - z) < 5)) continue; n++; pine(x, z, 9 + F() * 6); }
  for (let k = 0, n = 0; k < 1200 && n < 22; k++) { const x = -30 + F() * 60, z = -26 + F() * 52; if (clearOf(x, z, 1.4) || trees.some(t => Math.hypot(t.x - x, t.z - z) < 3)) continue; n++; birch(x, z, 6 + F() * 3); }
  // the game pole: lashed between the two pines at 2.6 m, a gambrel on a short rope from its middle, a tub under it
  const gp = GP.map(([x, z]) => trees.find(t => t.x === +x.toFixed(2) && t.z === +z.toFixed(2))), gy = Math.max(ground(...GP[0]), ground(...GP[1])) + 2.6;
  { const [a, b] = gp, dx = b.x - a.x, dz = b.z - a.z, L = Math.hypot(dx, dz), ux = dx / L, uz = dz / L; rod('pole', [a.x - ux * .1, gy, a.z - uz * .1], [b.x + ux * .1, gy, b.z + uz * .1], .06, 6);
    for (const t of gp) put(new THREE.TorusGeometry(t.r + .07, .02, 3, 10).rotateX(Math.PI / 2), 'pole', t.x, gy - .05, t.z); for (const t of gp) put(new THREE.TorusGeometry(t.r + .07, .02, 3, 10).rotateX(Math.PI / 2), 'pole', t.x, gy + .05, t.z);
    const mx = (a.x + b.x) / 2, mz = (a.z + b.z) / 2; rod('pole', [mx, gy - .05, mz], [mx, gy - .7, mz], .008, 3); rod('pole', [mx - .4 * ux, gy - .62, mz - .4 * uz], [mx + .4 * ux, gy - .62, mz + .4 * uz], .025, 5);
    for (const s of [-1, 1]) rod('iron', [mx + s * .38 * ux, gy - .62, mz + s * .38 * uz], [mx + s * .4 * ux, gy - .78, mz + s * .4 * uz], .008, 3);
    const ty2 = ground(mx, mz); put(new THREE.LatheGeometry([V2(.001, 0), V2(.32, 0), V2(.38, .32), V2(.36, .34), V2(.001, .34)], 12), 'billet', mx, ty2 - .01, mz); }
  const gamePole = { a: [gp[0].x, +gy.toFixed(3), gp[0].z], b: [gp[1].x, +gy.toFixed(3), gp[1].z], trees: gp.map(t => ({ x: t.x, z: t.z, r: t.r })) };
  // the boulders: granite, the wood stacked against the largest; the chopping stump and its axe; the spear rack
  for (let k = 0, n = 0; k < 400 && n < 18; k++) { const x = -32 + F() * 64, z = -28 + F() * 50; if (clearOf(x, z, 1.0)) continue; n++; const q = .3 + F() * .8, g = new THREE.IcosahedronGeometry(q, 1); g.scale(1.3, .62, 1); put(g, 'rock', x, ground(x, z) + q * .12, z, 0, F() * 6); }
  { const g = new THREE.IcosahedronGeometry(1.3, 1); g.scale(1.5, .8, 1); put(g, 'rock', WX, ground(WX, WZ - 1.3) + .4, WZ - 1.4, 0, .2); }
  const logs = [], CL = 2.4, wy = Math.max(ground(WX - CL / 2, WZ), ground(WX + CL / 2, WZ), ground(WX, WZ)); put(new THREE.BoxGeometry(CL + .2, .1, .8), 'billet', WX, wy - .02, WZ); const wb = wy + .03;
  for (let row = 0, below = null; row < 7; row++) { const now = []; for (let x = WX - CL / 2 + .1 + (row % 2) * .08; x < WX + CL / 2 - .08; x += .17) { const rr = .065 + F() * .02, xx = x + (F() - .5) * .02;
      let y = wb + rr; if (below) { y = -9; for (const [bx, by, br] of below) { const dx = Math.abs(bx - xx); if (dx < br + rr) y = Math.max(y, by + Math.sqrt((br + rr) ** 2 - dx * dx)); } }
      if (y < wb || y > wb + .95 || (row > 4 && F() < .3)) continue; now.push([xx, y, rr]); const g = new THREE.CylinderGeometry(rr, rr, .7, 5); g.rotateX(Math.PI / 2); put(g, 'billet', xx, y, WZ, 0, 0, F() * 3, 1.2); logs.push([+xx.toFixed(3), +y.toFixed(3)]); }
    if (!now.length) break; below = now; }
  { const sx = -6.2, sz = -2.2, sy = ground(sx, sz); put(new THREE.CylinderGeometry(.3, .34, .5, 9), 'billet', sx, sy + .2, sz); rod('pole', [sx + .05, sy + .5, sz], [sx + .4, sy + 1.05, sz + .25], .018, 4); put(new THREE.BoxGeometry(.04, .14, .18), 'iron', sx + .06, sy + .5, sz - .04, 0, .6, -.7); }
  { const rx = 9.6, rz = 2.0, rl = 1.6; for (const s of [-1, 1]) { const x = rx + s * rl / 2, y0 = ground(x, rz); rod('pole', [x, y0 - .25, rz], [x, y0 + 1.5, rz], .035, 5); rod('pole', [x, y0 + 1.42, rz], [x + .12 * s, y0 + 1.62, rz], .02, 4); }
    const ry = Math.max(ground(rx - rl / 2, rz), ground(rx + rl / 2, rz)) + 1.48; rod('pole', [rx - rl / 2 - .1, ry, rz], [rx + rl / 2 + .1, ry, rz], .03, 5);
    for (let k = 0; k < 3; k++) { const x = rx - .45 + k * .45, z0 = rz + .55; rod('pole', [x, ground(x, z0) + .02, z0], [x + .04, ry + .65, rz - .03], .02, 4); put(new THREE.ConeGeometry(.03, .22, 4), 'iron', x + .045, ry + .76, rz - .06, -.4); } }
  // the heath: heather and moss in tufts, off the paths and the stances
  for (let k = 0, n = 0; k < 4000 && n < 220; k++) { const x = -28 + F() * 56, z = -24 + F() * 46; if (clearOf(x, z, .6)) continue; n++; const g = new THREE.IcosahedronGeometry(.2 + F() * .16, 0); g.scale(1.3, .8, 1.3); put(g, 'heather', x, ground(x, z) + .04, z, 0, F() * 3); }
  const group = new THREE.Group(); let tris = 0; { const g = mergeGeometries(SMK, false); SMK.forEach(x => x.dispose()); const m = new THREE.Mesh(g, M.smoke); m.name = 'smoke'; m.renderOrder = 2; group.add(m); tris += g.index.count / 3; }
  for (const [k, gs] of B) { const g = mergeGeometries(gs, false); gs.forEach(x => x.dispose()); const m = new THREE.Mesh(g, M[k]); m.name = k; m.castShadow = !['turf', 'track', 'ember'].includes(k); m.receiveShadow = true; group.add(m); tris += g.attributes.position.count / 3; }
  return { group, tris: Math.round(tris), draws: group.children.length, own: group.children.length, top: +new THREE.Box3().setFromObject(group).max.y.toFixed(2), ground, tent, rack, frame, gamePole, wood: { logs, z: WZ, y: +wb.toFixed(3) }, smoke, road: { z: RZ, w: RW }, paths, trees };
}

// ── Aurenne's abandoned expedition (Session 1023, card F8; OG-124's "camps on the roads: … an abandoned expedition"). A party came up a hill
// road to dig at an old terrace and left in a hurry, some weeks ago: what they could not carry is where it fell. Built at true size, a metre a
// unit, on a dry hillside of Aurenne (OG-124's "terraced coast of vineyards and cypresses": its own plaster and tile, not Tuscan stone), the
// slope rising to -z at 1 in 10, the road along x at z 12; a level camp terrace cut into it, an old terrace wall of pale stone above:
//   - the tents: a ridge tent still standing, its door flap torn and hanging; a second fallen, its front pole down, the canvas over the
//     ridge pole lying on the ground from its back pole;
//   - the fire: cold, ash in its ring, the pot on its side, a stool knocked over;
//   - the cart: a handcart down on one side, its other wheel off and lying flat by it, its load of crates spilled, one burst;
//   - the dig: a trench 6 m by 1.4 m and 1.6 m deep cut into the old terrace above its wall, its spoil heaped uphill of it, a ladder in it,
//     a pick and a shovel left in the spoil, a column drum lifted out onto the lip; what they found and why they ran is the quest writer's;
//   - the litter: a folding table on its side, a surveyor's tripod fallen, a lantern on its side, papers held down by stones;
//   - the hill: dry grass, pale limestone breaking through, olives, cypresses and maquis; a trodden path from the road to the camp and the dig.
// -> { group, tris, draws, own, ground(x, z), tents { up { x, z, ry, L, W, H, floor, ridge }, down { x, z, ry, L, top } }, fire { x, z, y }, cart { wheel { x, y, z, r }, flat { x, y, z, r } },
//      trench { x, z, L, W, lip, floor, ladder { foot, top } }, lying [{ x, y, z, what }] (the bottoms of things fallen), road { z, w }, paths, trees [{ x, z, h, kind }] }
export function aurenneExpedition(o = {}, r = stream('expedition')) {
  const std = (c, ro = .9, x = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: ro, ...x }); aurenneTextures(); markTextures();
  const M = { turf: mat('turfDry', { ns: .5, color: 0xfff0c4, rough: 1 }), track: mat('turfDry', { ns: .8, color: 0xd8c49c, rough: 1 }), earth: mat('plaster', { ns: 1.2, color: 0xa88a64, rough: 1 }), rock: mat('rock', { ns: 1.3, color: 0xd2c6ac, rough: .95 }),
    wall: mat('stone', { ns: 1.2, color: 0xe2d6bc, rough: .95 }), canvas: std(0xd8ccb0, .95, { side: THREE.DoubleSide }), wood: mat('wood', { ns: .8, color: 0xd8bc94, rough: .9 }), iron: std(0x2c2a28, .5, { metalness: .6 }), ash: mat('plaster', { ns: .8, color: 0x8e8a84, rough: 1 }),
    paper: std(0xece4d0, .9, { side: THREE.DoubleSide }), bark: std(0x6a6058, .95), olive: std(0x7a8a5e, .85), cypress: std(0x2e4028, .9), maquis: std(0x4a5a34, .9), straw: std(0xc8b478, 1), glass: std(0xc8c0a0, .3, { transparent: true, opacity: .6 }) };
  M.earth.side = THREE.DoubleSide;
  const B = new Map(), key = String(o.key || 'expedition'), F = stream(key + ':lie'), ph = Array.from({ length: 10 }, () => F() * 6.283), V3 = (x, y, z) => new THREE.Vector3(x, y, z), V2 = (a, b) => new THREE.Vector2(a, b);
  const put = (geo, k, x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0, uv = .5) => { const g = geo.index ? geo.toNonIndexed() : geo; for (const a of Object.keys(g.attributes)) if (!['position', 'normal'].includes(a)) g.deleteAttribute(a);
    if (!g.attributes.normal) g.computeVertexNormals(); g.applyMatrix4(new THREE.Matrix4().compose(V3(x, y, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(rx, ry, rz, 'YXZ')), V3(1, 1, 1))); worldUV(g, uv);
    if (!B.has(k)) B.set(k, []); B.get(k).push(g); return g; };
  const rod = (k, a, b, rad, seg = 6, taper = 1) => { const A = V3(...a), C = V3(...b), d = C.clone().sub(A), g = new THREE.CylinderGeometry(rad * taper, rad, d.length(), seg);
    g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(V3(0, 1, 0), d.clone().normalize())); g.translate((A.x + C.x) / 2, (A.y + C.y) / 2, (A.z + C.z) / 2); return put(g, k); };
  const grid = (k, nu, nv, f, uv = .5) => { const pos = [], idx = []; for (let j = 0; j <= nv; j++) for (let i = 0; i <= nu; i++) pos.push(...f(i / nu, j / nv));
    for (let j = 0; j < nv; j++) for (let i = 0; i < nu; i++) { const a = j * (nu + 1) + i, b = a + 1, c = a + nu + 1, d = c + 1; idx.push(a, c, b, b, c, d); }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals(); return put(g, k, 0, 0, 0, 0, 0, 0, uv); };
  const sm = t => { t = Math.min(1, Math.max(0, t)); return t * t * (3 - 2 * t); };
  // the land: rising to -z at 1 in 10; the camp's terrace levelled; the old terrace wall's step at z -6; the trench cut under it
  const RZ = 12, RW = 3.0, base0 = (x, z) => -z / 10 + .12 * Math.sin(x * .2 + ph[0]) * Math.sin(z * .16 + ph[1]) + .05 * Math.sin(x * .6 + z * .5 + ph[2]);
  const WZ = -6.2, GAPX = [-.4, 2.0], gapW = x => sm((x - GAPX[0]) / .3) * sm((GAPX[1] - x) / .3), step = (x, z) => .9 * sm((WZ - z) / .25), base = (x, z) => base0(x, z) + step(x, z) * (Math.abs(x) < 18 ? 1 : sm((24 - Math.abs(x)) / 6)) /* the old terrace: the land stands 0.9 m higher behind its wall */;
  const CP = { x: 0, z: 0, r: 5.0 }; CP.y = +base0(0, 0).toFixed(3);
  const TRX = -2.5, TRZ = -8.5, TL = 6, TWd = 1.5, TD = 1.6, /* its edges on the ground grid's lines, so no cell is cut by them */ lip = Math.max(...[-1, 1].flatMap(sx => [-1, 1].map(sz => base(TRX + sx * TL / 2, TRZ + sz * TWd / 2)))), tfloor = +(lip - TD).toFixed(3);
  const inTr = (x, z) => Math.abs(x - TRX) < TL / 2 && Math.abs(z - TRZ) < TWd / 2;
  const roadY = x => base(x, RZ);
  const ground0 = (x, z) => { const b = base(x, z), w = sm((CP.r + 3.0 - Math.hypot(x - CP.x, (z - CP.z) * 1.15)) / 3.0) /* the terrace's cut bank eased over 3 m */; return b + (CP.y - b) * w; };
  const ZA = -3.0, ZB = -7.6 /* the ramp up through the wall's gap, from the camp's terrace to the old one: one grade, about 1 in 2.8 */;
  const ground = (x, z) => { let b = ground0(x, z); const gw = gapW(x) * sm((z - ZB + .6) / .6) * sm((ZA + .6 - z) / .6); if (gw > 0) { const t = Math.min(1, Math.max(0, (ZA - z) / (ZA - ZB))), y0 = ground0(x, ZA), y1 = ground0(x, ZB); b += (y0 + (y1 - y0) * t - b) * gw; }
    const rw = sm((RW / 2 + 1.2 - Math.abs(z - RZ)) / 1.2); b += (roadY(x) - .04 * Math.min(1, Math.abs(z - RZ) / (RW / 2)) - b) * rw; return inTr(x, z) ? tfloor : b; };
  // the paths: from the road up to the camp, through it to the fire and the standing tent, and up past the wall's gap to the trench's lip
  const TUx = -3.4, TUz = -1.6, TUry = .25, TDx = 2.8, TDz = -2.0, TDry = -.3, FX = .4, FZ = 1.6;
  const paths = [[[1.0, RZ], [.6, 8.4], [.2, 4.2], [FX - 1.4, FZ + .2], [TUx + 1.25 * Math.cos(TUry) + .9, TUz - 1.25 * Math.sin(TUry) + .3]], [[.2, 4.2], [1.4, 1.0], [.5, -1.6], [.4, -5.0], [.6, -7.4], [TRX + TL / 2 + .7, TRZ + TWd / 2 + .5]]];
  const segD = (x, z, a, b) => { const dx = b[0] - a[0], dz = b[1] - a[1], t = Math.max(0, Math.min(1, ((x - a[0]) * dx + (z - a[1]) * dz) / (dx * dx + dz * dz))); return Math.hypot(x - a[0] - dx * t, z - a[1] - dz * t); };
  const pathD = (x, z) => Math.min(...paths.flatMap(p => p.slice(0, -1).map((q, i) => segD(x, z, q, p[i + 1]))));
  { const steps = (bands, end) => { const v = []; for (const [a, b, st] of bands) for (let q = a; q < b - 1e-6; q += st) v.push(+q.toFixed(2)); v.push(end); return v; };
    const gx = steps([[-160, -45, 23], [-45, -20, 2.5], [-20, -6, 1.0], [-6, 1, .25], [1, 20, 1.0], [20, 45, 2.5], [45, 160, 23]], 160), gz = steps([[-160, -40, 24], [-40, -18, 2.5], [-18, -10.5, 1.0], [-10.5, -5.5, .25], [-5.5, 18, 1.0], [18, 45, 2.5], [45, 160, 23]], 160);
    const pos = [], NX = gx.length, I = { turf: [], track: [], earth: [] }; for (const z of gz) for (const x of gx) pos.push(x, ground(x, z), z);
    for (let j = 0; j + 1 < gz.length; j++) for (let i = 0; i + 1 < NX; i++) { const a = j * NX + i, b = a + 1, c = a + NX, d = c + 1, cx = (gx[i] + gx[i + 1]) / 2, cz = (gz[j] + gz[j + 1]) / 2;
      if (inTr(cx, cz)) continue; I[Math.abs(cz - RZ) < RW / 2 + .1 && Math.abs(cx) < 150 ? 'track' : Math.abs(cx - TRX) < TL / 2 + .3 && Math.abs(cz - TRZ) < TWd / 2 + .3 ? 'earth' : 'turf'].push(a, c, b, b, c, d); }
    for (const [k, idx] of Object.entries(I)) { const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals(); put(g, k, 0, 0, 0, 0, 0, 0, .35); } }
  put(new THREE.PlaneGeometry(TL, TWd).rotateX(-Math.PI / 2), 'earth', TRX, tfloor, TRZ, 0, 0, 0, .6) /* the trench's floor */;
  // the trench's walls: cut faces of earth, upright, from the lip down to the floor on all four sides
  for (const [ax, az, len, ry] of [[TRX, TRZ - TWd / 2, TL, 0], [TRX, TRZ + TWd / 2, TL, Math.PI], [TRX - TL / 2, TRZ, TWd, Math.PI / 2], [TRX + TL / 2, TRZ, TWd, -Math.PI / 2]]) {
    const c = Math.cos(ry), s = Math.sin(ry); grid('earth', 12, 4, (u, v) => { const t = (u - .5) * len, x = ax + t * c, z = az - t * s, top = base(x, z) + .02; return [x, tfloor + (top - tfloor) * v, z]; }, .6); }
  // the old terrace wall: dry stone 0.9 m high along z -6.2, a gap where the path goes up, part of it fallen
  { const CH2 = [[-22, GAPX[0]], [GAPX[1], 20]]; for (const [x0, x1] of CH2) for (let x = x0; x < x1 - .2; x += .55) { const fallen = x > 7 && x < 10.5, w = .45 + F() * .12, xm = x + w / 2, bot = Math.min(ground(xm, WZ + .35), ground(xm, WZ + .1)) - .05, top = base(xm, WZ - .4) + .06, n = Math.max(1, Math.round((top - bot) / .3)), ch = (top - bot) / n;
      for (let c = 0; c < (fallen ? 1 : n); c++) put(new THREE.BoxGeometry(w - (c % 2) * .04, ch - .02, .5), 'wall', xm + (c % 2) * .05, bot + c * ch + ch / 2, WZ + .05 + (F() - .5) * .04, 0, (F() - .5) * .06); /* courses from the ground in front up to the terrace behind */ if (fallen && F() < .6) put(new THREE.BoxGeometry(.45, .28, .5), 'wall', x + .2, base0(x, WZ + 1.0) + .14, WZ + 1.0 + F() * .6, F() * .4, F() * 3, F() * .3); } }
  { const z0 = ZB, z1 = ZA; grid('track', 6, 6, (u, v) => { const x = GAPX[0] + .05 + u * (GAPX[1] - GAPX[0] - .1), z = z0 + (z1 - z0) * v; return [x, ground(x, z) + .03, z]; }, .4); } /* the gap: trodden earth up the ramp */
  // the spoil: a long heap downhill of the trench; the pick and the shovel left in it; the column drum lifted out on the lip
  const SPZ = TRZ - TWd / 2 - 1.5; { const g = new THREE.SphereGeometry(1, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2); g.scale(TL / 2 + .1, .6, .9); put(g, 'earth', TRX, ground(TRX, SPZ) - .12, SPZ, 0, 0, 0, .6); }
  { const x = TRX - 1.2, z = SPZ, y = ground(x, z) + .55; rod('wood', [x, y - .3, z], [x + .3, y + .55, z + .2], .02, 5); put(new THREE.BoxGeometry(.5, .05, .06), 'iron', x - .02, y - .2, z, 0, 0, .35);
    const x2 = TRX + 1.4, y2 = ground(x2, z) + .6; rod('wood', [x2, y2 - .2, z], [x2 - .2, y2 + .9, z - .15], .02, 5); put(new THREE.BoxGeometry(.24, .3, .02), 'iron', x2 + .01, y2 - .25, z, .15, 0, .05); }
  const lying = [];
  { const x = TRX - TL / 2 - .9, z = TRZ - .4, y = ground(x, z); const g = new THREE.CylinderGeometry(.42, .42, .55, 16); g.rotateZ(Math.PI / 2); put(g, 'wall', x, y + .41, z, 0, .3); lying.push({ x, y: +y.toFixed(3), z, what: 'drum', h: .42 }); }
  // the ladder: from the trench's floor to over its lip at its east end
  const lfoot = [TRX + TL / 2 - .5, tfloor, TRZ], ltop = [TRX + TL / 2 + .15, lip + .6, TRZ]; { const d = V3(...ltop).sub(V3(...lfoot)); for (const s of [-1, 1]) rod('wood', [lfoot[0], lfoot[1], lfoot[2] + s * .22], [ltop[0], ltop[1], ltop[2] + s * .22], .03, 5);
    const n = Math.floor(d.length() / .3); for (let k = 1; k <= n; k++) { const p = V3(...lfoot).addScaledVector(d, k / (n + .4)); rod('wood', [p.x, p.y, p.z - .24], [p.x, p.y, p.z + .24], .018, 4); } }
  // the tents: one standing (its door flap torn and hanging), one fallen from its front pole
  const tents = {}; { const L = 2.6, W = 2.1, H = 1.95, WH = .4, c = Math.cos(TUry), s = Math.sin(TUry), wp = (x, y, z) => [TUx + x * c + z * s, y, TUz - x * s + z * c], gt = (x, z) => ground(TUx + x * c + z * s, TUz - x * s + z * c), ty = CP.y - .02;
    for (const sz of [-1, 1]) { grid('canvas', 6, 1, (u, v) => { const x = -L / 2 + u * L, z = sz * W / 2; return wp(x, gt(x, z) - .03 + v * (ty + WH - gt(x, z) + .03), z); }, .6); grid('canvas', 6, 4, (u, v) => { const x = -L / 2 + u * L, z = sz * W / 2 * (1 - v), y = ty + WH + v * (H - WH) - .04 * Math.sin(v * Math.PI) * Math.sin(u * Math.PI); return wp(x, y, z); }, .6); }
    grid('canvas', 6, 6, (u, v) => { const z = (u - .5) * W, x = -L / 2, top = ty + WH + (H - WH) * (1 - Math.abs(z) / (W / 2)); return wp(x, gt(x, z) - .03 + v * (top - gt(x, z) + .03), z); }, .6);
    grid('canvas', 3, 5, (u, v) => { const z = u * W / 2 * .9, top = ty + WH + (H - WH) * (1 - z / (W / 2)), y = top - v * (top - ty - .5) * (1 - .3 * u); return wp(L / 2 + .02 + .12 * v * u, y, z + .06 * Math.sin(v * 6 + u)); }, .6) /* the torn flap, hanging half across the door */;
    for (const sx of [-1, 1]) rod('wood', wp(sx * (L / 2 - .04), gt(sx * (L / 2 - .04), 0) - .2, 0), wp(sx * (L / 2 - .04), ty + H + .08, 0), .03, 5); rod('wood', wp(-L / 2, ty + H - .02, 0), wp(L / 2, ty + H - .02, 0), .03, 5);
    tents.up = { x: TUx, z: TUz, ry: TUry, L, W, H, floor: +ty.toFixed(3), ridge: +(ty + H).toFixed(3) }; }
  { const L = 2.6, W = 2.1, H = 1.95, c = Math.cos(TDry), s = Math.sin(TDry), wp = (x, y, z) => [TDx + x * c + z * s, y, TDz - x * s + z * c], gt = (x, z) => ground(TDx + x * c + z * s, TDz - x * s + z * c);
    const hAt = (x, z) => { const t = (x + L / 2) / L, ridge = (H - .1) * (1 - t) + .12 * t, r2 = ridge * (1 - Math.min(1, Math.abs(z) / (W / 2 + .25 + t * .4))); return Math.max(.04, r2) + .04 * Math.sin(x * 3 + z * 4 + ph[5]) * t; } /* from the back pole's top down to the ground at the front */;
    grid('canvas', 10, 10, (u, v) => { const x = -L / 2 + u * (L + .3), z = (v - .5) * (W + .5 + u * .8); return wp(x, gt(x, z) + hAt(x, z), z); }, .6);
    rod('wood', wp(-L / 2 + .04, gt(-L / 2 + .04, 0) - .2, 0), wp(-L / 2 + .04, gt(-L / 2, 0) + H - .08, 0), .03, 5); rod('wood', wp(-L / 2 + .1, gt(-L / 2, 0) + H - .14, 0), wp(L / 2 + .2, gt(L / 2 + .2, 0) + .06, 0), .03, 5) /* the ridge pole, fallen from the back pole to the ground */;
    const fp = wp(L / 2 + .9, 0, .5); fp[1] = ground(fp[0], fp[2]); rod('wood', [fp[0] - .9 * c, fp[1] + .03, fp[2] + .9 * s - .3], [fp[0] + .9 * c, fp[1] + .03, fp[2] - .9 * s + .3], .03, 5); lying.push({ x: fp[0], y: +fp[1].toFixed(3), z: fp[2], what: 'pole', h: .03 });
    tents.down = { x: TDx, z: TDz, ry: TDry, L, top: +(gt(-L / 2, 0) + H).toFixed(3) }; }
  // the fire: cold; ash in its ring of stones, the pot on its side, a stool knocked over
  const fy = ground(FX, FZ); for (let k = 0; k < 8; k++) { const a = k / 8 * 6.283 + F() * .3, st = new THREE.IcosahedronGeometry(.11 + F() * .04, 0); st.scale(1.2, .7, 1); put(st, 'rock', FX + .42 * Math.cos(a), fy + .04, FZ + .42 * Math.sin(a), 0, F() * 3); }
  put(new THREE.CylinderGeometry(.3, .33, .04, 10), 'ash', FX, fy + .02, FZ); for (let k = 0; k < 4; k++) { const a = k * 1.5 + F(); rod('wood', [FX + .28 * Math.cos(a), fy + .05, FZ + .28 * Math.sin(a)], [FX - .02 * Math.cos(a), fy + .09, FZ - .02 * Math.sin(a)], .03, 5); }
  { const x = FX + .9, z = FZ - .3, y = ground(x, z), g = new THREE.LatheGeometry([V2(.001, 0), V2(.12, .01), V2(.17, .1), V2(.16, .24), V2(.14, .27), V2(.14, .27)], 12); g.rotateZ(Math.PI / 2); put(g, 'iron', x + .13, y + .165, z, 0, .7); lying.push({ x, y: +y.toFixed(3), z, what: 'pot', h: .17 }); }
  { const x = FX - 1.1, z = FZ - .7, y = ground(x, z); put(new THREE.CylinderGeometry(.18, .18, .05, 10), 'wood', x, y + .18, z, Math.PI / 2, .4); for (let k = 0; k < 3; k++) { const a = k * 2.09; rod('wood', [x + .12 * Math.cos(a) * Math.cos(.4), y + .03 + .1 * Math.sin(a) + .1, z - .12 * Math.cos(a) * Math.sin(.4)], [x + .12 * Math.cos(a) * Math.cos(.4) - .4 * Math.sin(.4), y + .03 + .1 * Math.sin(a) + .1, z - .12 * Math.cos(a) * Math.sin(.4) - .4 * Math.cos(.4)], .018, 4); } lying.push({ x, y: +y.toFixed(3), z, what: 'stool', h: .18 }); }
  const fire = { x: FX, z: FZ, y: +fy.toFixed(3) };
  // the handcart: down on its left side, its right wheel off and lying flat beside it; its crates spilled, one burst with straw
  const cart = {}; { const KX = 4.4, KZ = 2.4, WR = .55, gw = ground(KX, KZ + .7), wy = gw + WR, ay = ground(KX, KZ - .7) + .07, tilt = Math.atan2(wy - ay, 1.4);
    { const g = new THREE.CylinderGeometry(WR, WR, .07, 14); g.rotateX(Math.PI / 2); put(g, 'wood', KX, wy, KZ + .7); put(new THREE.TorusGeometry(WR - .01, .022, 4, 16), 'iron', KX, wy, KZ + .7); cart.wheel = { x: KX, y: +wy.toFixed(3), z: KZ + .7, r: WR }; }
    rod('wood', [KX, wy, KZ + .75], [KX, ay, KZ - .7], .045, 6); const bedG = new THREE.BoxGeometry(1.8, .5, 1.1); bedG.translate(0, .32, 0); bedG.rotateX(tilt); put(bedG, 'wood', KX - .1, (wy + ay) / 2, KZ, 0, 0, 0);
    for (const s of [-1, 1]) rod('wood', [KX + .8, (wy + ay) / 2 + .1 + s * .3 * Math.sin(tilt), KZ + s * .35], [KX + 2.4, ground(KX + 2.4, KZ + s * .35) + .04, KZ + s * .35], .035, 5);
    const fx = KX - .4, fz = KZ - 1.9, fyy = ground(fx, fz); { const g = new THREE.CylinderGeometry(WR, WR, .07, 14); put(g, 'wood', fx, fyy + .035, fz); put(new THREE.TorusGeometry(WR - .01, .022, 4, 16).rotateX(Math.PI / 2), 'iron', fx, fyy + .04, fz); cart.flat = { x: fx, y: +fyy.toFixed(3), z: fz, r: WR }; lying.push({ x: fx, y: +fyy.toFixed(3), z: fz, what: 'wheel', h: .035 }); }
    for (const [dx, dz, a, burst] of [[-1.4, -.4, .4, false], [-1.0, 1.4, 1.2, true], [.4, 1.7, 2.2, false]]) { const x = KX + dx, z = KZ + dz, y = ground(x, z); put(new THREE.BoxGeometry(.6, .4, .45), 'wood', x, y + .2, z, 0, a); lying.push({ x, y: +y.toFixed(3), z, what: 'crate', h: .2 });
      if (burst) { put(new THREE.BoxGeometry(.62, .03, .47), 'wood', x + .5, ground(x + .5, z + .3) + .015, z + .3, 0, a + .5); for (let k = 0; k < 6; k++) { const sx = x + (F() - .2) * .9, sz = z + (F() - .5) * .9; put(new THREE.IcosahedronGeometry(.12 + F() * .08, 0).scale(1.4, .4, 1.2), 'straw', sx, ground(sx, sz) + .03, sz, 0, F() * 3); } } } }
  // the litter: the folding table on its side, the tripod fallen, a lantern on its side, papers under stones
  { const x = -.9, z = -2.9, y = ground(x, z); put(new THREE.BoxGeometry(1.2, .7, .03), 'wood', x, y + .35, z, 0, .5); for (const s of [-1, 1]) rod('wood', [x + s * .5 * Math.cos(.5), y + .62, z - s * .5 * Math.sin(.5)], [x + s * .5 * Math.cos(.5) + .6 * Math.sin(.5), y + .62, z - s * .5 * Math.sin(.5) + .6 * Math.cos(.5)], .02, 4); lying.push({ x, y: +y.toFixed(3), z, what: 'table', h: .35 }); }
  { const x = -1.6, z = -4.3, y = ground(x, z); for (let k = 0; k < 3; k++) { const a = .3 + (k - 1) * .12; rod('wood', [x, y + .03, z], [x + 1.5 * Math.cos(a), ground(x + 1.5 * Math.cos(a), z + 1.5 * Math.sin(a)) + .03, z + 1.5 * Math.sin(a)], .02, 4); } put(new THREE.CylinderGeometry(.05, .05, .25, 8), 'iron', x - .1, y + .05, z - .05, 0, 0, Math.PI / 2); lying.push({ x, y: +y.toFixed(3), z, what: 'tripod', h: .03 }); }
  { const x = TUx + 1.9, z = TUz + 1.2, y = ground(x, z); put(new THREE.BoxGeometry(.16, .16, .24), 'glass', x, y + .08, z, 0, .4); put(new THREE.BoxGeometry(.18, .18, .02), 'iron', x - .12 * Math.sin(.4), y + .09, z - .12 * Math.cos(.4), 0, .4); lying.push({ x, y: +y.toFixed(3), z, what: 'lantern', h: .08 }); }
  for (let k = 0; k < 9; k++) { const a = F() * 6.283, d = 1 + F() * 2.4, x = -1.2 + d * Math.cos(a), z = -3.2 + d * Math.sin(a); if (pathD(x, z) < .5) continue; const y = ground(x, z); put(new THREE.PlaneGeometry(.21, .29).rotateX(-Math.PI / 2), 'paper', x, y + .012, z, 0, F() * 3); if (k % 3 === 0) put(new THREE.IcosahedronGeometry(.06, 0), 'rock', x + .05, y + .04, z); }
  // the hill: limestone breaking through, olives, cypresses, maquis; off the road, the paths, the camp, the dig
  const keep = [[0, 0, 6.5], [TRX, TRZ + .8, 4.6], [4.4, 2.0, 3]], clearOf = (x, z, m) => Math.abs(z - RZ) < RW / 2 + m || pathD(x, z) < m || keep.some(([a, b, rr]) => Math.hypot(x - a, z - b) < rr + m) || Math.abs(z - WZ) < .6 + m * .3;
  for (let k = 0, n = 0; k < 600 && n < 26; k++) { const x = -34 + F() * 68, z = -30 + F() * 56; if (clearOf(x, z, .8)) continue; n++; const q = .3 + F() * .9, g = new THREE.IcosahedronGeometry(q, 1); g.scale(1.4, .5, 1); put(g, 'rock', x, ground(x, z) + q * .05, z, 0, F() * 6); }
  const trees = [];
  for (let k = 0, n = 0; k < 900 && n < 9; k++) { const x = -32 + F() * 64, z = -28 + F() * 52; if (clearOf(x, z, 2.2) || trees.some(t => Math.hypot(t.x - x, t.z - z) < 7)) continue; n++; const gy = ground(x, z), h = 4 + F() * 1.6;
    const top = [x + (F() - .5) * .8, gy + h * .45, z + (F() - .5) * .8]; rod('bark', [x, gy - .2, z], top, .2, 6, .7); for (let l = 0; l < 3; l++) { const a = l * 2.1 + F(), e = [top[0] + Math.cos(a) * 1.1, top[1] + .7 + F() * .5, top[2] + Math.sin(a) * 1.1]; rod('bark', top, e, .08, 5, .6);
      for (let c2 = 0; c2 < 3; c2++) put(new THREE.IcosahedronGeometry(.8 + F() * .4, 0).scale(1.3, .7, 1.3), 'olive', e[0] + (F() - .5) * 1.2, e[1] + .3 + (F() - .5) * .5, e[2] + (F() - .5) * 1.2, F(), F() * 3); }
    trees.push({ x: +x.toFixed(2), z: +z.toFixed(2), h: +h.toFixed(2), kind: 'olive' }); }
  for (let k = 0, n = 0; k < 900 && n < 10; k++) { const x = -34 + F() * 68, z = -30 + F() * 56; if (clearOf(x, z, 1.5) || trees.some(t => Math.hypot(t.x - x, t.z - z) < 4)) continue; n++; const gy = ground(x, z), h = 8 + F() * 4, w = .8 + F() * .3, prof = [];
    for (let s = 0; s <= 8; s++) { const t = s / 8; prof.push(V2(w * Math.sin(Math.PI * Math.min(1, t * 1.15) ** .7) * (1 - t * .25) + .02, t * h)); } put(new THREE.LatheGeometry(prof, 8), 'cypress', x, gy + .3, z); rod('bark', [x, gy - .2, z], [x, gy + .5, z], .14, 5);
    trees.push({ x: +x.toFixed(2), z: +z.toFixed(2), h: +h.toFixed(2), kind: 'cypress' }); }
  for (let k = 0, n = 0; k < 2000 && n < 60; k++) { const x = -28 + F() * 56, z = -26 + F() * 48; if (clearOf(x, z, .7)) continue; n++; const g = new THREE.IcosahedronGeometry(.35 + F() * .3, 0); g.scale(1.3, .75, 1.2); put(g, 'maquis', x, ground(x, z) + .15, z, 0, F() * 3); }
  const group = new THREE.Group(); let tris = 0;
  for (const [k, gs] of B) { const g = mergeGeometries(gs, false); gs.forEach(x => x.dispose()); const m = new THREE.Mesh(g, M[k]); m.name = k; m.castShadow = !['turf', 'track', 'paper', 'ash'].includes(k); m.receiveShadow = true; group.add(m); tris += g.attributes.position.count / 3; }
  return { group, tris: Math.round(tris), draws: group.children.length, own: group.children.length, top: +new THREE.Box3().setFromObject(group).max.y.toFixed(2), ground, tents, fire, cart,
    trench: { x: TRX, z: TRZ, L: TL, W: TWd, lip: +lip.toFixed(3), floor: tfloor, ladder: { foot: lfoot.map(v => +v.toFixed(3)), top: ltop.map(v => +v.toFixed(3)) } }, lying, wall: { z: WZ, gap: GAPX }, road: { z: RZ, w: RW }, paths, trees };
}

// ── the Gatelands' overturned carriage (Session 1025, card F8; OG-124's panel 6, "small mysteries with no marker: an overturned
// carriage"). A road coach left the lane at speed, went over the ditch and fell on its near side in the field beyond; its team is gone,
// the traces cut through at the splinter bar, and nobody is anywhere. What happened, and to whom, is the quest writer's: the place is only the
// state of things, an hour or a day after. The coach is the game's (Session 261: a panelled body on its frame, a door and two quarter windows
// each side, a roof rail with luggage, the driver's box, two lamps, leaf springs, wheels of twelve spokes larger behind, the pole) at true size,
// a metre a unit. Built on a lane through pasture in early autumn, the road along x at z -6 falling gently to -x, the ditch on its north side:
//   - the coach: on its left side in the field, its roof to the wall, its underside to the road; its two right wheels up in the air and flat,
//     the fore-carriage turned 15°; its right door open and standing up into the air past upright, the dark of the body through it; the near
//     rear wheel broken off under it, its rim and spokes by it; the near front wheel off and lying flat; the pole snapped a metre out;
//   - the traces: four, cut short at the splinter bar and hanging; the far lamp still on its bracket and burning, the near one broken on the
//     ground;
//   - the road: two gouges in the turf from the lane's edge, over the ditch, to where it lies; the whip in the road, a hat in the ditch;
//   - the luggage: off the roof, a trunk on its end, another burst with its lid back and clothes out of it, a hatbox, a valise; one case
//     still strapped under the rail;
//   - the land: a dry-stone wall along the field's far side, a thorn hedge across the lane, ash and oak turning.
// -> { group, tris, draws, own, ground(x, z), coach { x, z, y, rest [[x, y, z]] (the lower side's underface), top (the upper side), door { hinge, edge [x, y, z], hole [x, y, z] },
//      wheels [{ x, y, z, r }] (the two up, hub and radius), lamp [x, y, z] }, traces [[x, y, z]] (their cut ends), lying [{ x, y, z, what }], wall { z, h }, road { z, w }, ditch { z, w, d }, paths, trees }
export function gatelandsCarriage(o = {}, r = stream('carriage')) {
  const std = (c, ro = .9, x = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: ro, ...x }); const MI = millMats();
  const M = { turf: MI.turf, track: mat('turfDry', { ns: 1.0, color: 0x9a8a6c, rough: 1 }), earth: mat('plaster', { ns: 1.2, color: 0x6a5440, rough: 1 }), wall: mat('stone', { ns: 1.2, color: 0xb4b0a4, rough: .95 }),
    paint: mat('wood', { ns: .5, color: 0x8a3a26, rough: .55 }), black: mat('wood', { ns: .4, color: 0x2a2220, rough: .6 }), yellow: mat('wood', { ns: .6, color: 0xc8a048, rough: .7 }), iron: MI.iron,
    glass: std(0x2a3238, .12, { metalness: .3 }), dark: std(0x0c0a08, 1, { side: THREE.BackSide }), cloth: std(0x7a2a2a, .95),
    leather: mat('wood', { ns: .3, color: 0x4a3020, rough: .7 }), trunk: mat('wood', { ns: .8, color: 0x7a5a3a, rough: .8 }), linen: std(0xe0d8c4, .95, { side: THREE.DoubleSide }), wool: std(0x3a4a5e, .95),
    lamp: std(0xffd8a0, .5, { emissive: new THREE.Color(1, .72, .38), emissiveIntensity: o.lit ? 3 : .25 }), bark: std(0x5e564c, .95), leaf: std(0x56682a, .85), leafAu: std(0x9a7a2a, .85) };
  const B = new Map(), key = String(o.key || 'carriage'), F = stream(key + ':lie'), ph = Array.from({ length: 10 }, () => F() * 6.283), V3 = (x, y, z) => new THREE.Vector3(x, y, z), V2 = (a, b) => new THREE.Vector2(a, b);
  const put = (geo, k, x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0, uv = .5) => { const g = geo.index ? geo.toNonIndexed() : geo; for (const a of Object.keys(g.attributes)) if (!['position', 'normal'].includes(a)) g.deleteAttribute(a);
    if (!g.attributes.normal) g.computeVertexNormals(); g.applyMatrix4(new THREE.Matrix4().compose(V3(x, y, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(rx, ry, rz, 'YXZ')), V3(1, 1, 1))); worldUV(g, uv);
    if (!B.has(k)) B.set(k, []); B.get(k).push(g); return g; };
  const rod = (k, a, b, rad, seg = 6, taper = 1) => { const A = V3(...a), C = V3(...b), d = C.clone().sub(A), g = new THREE.CylinderGeometry(rad * taper, rad, d.length(), seg);
    g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(V3(0, 1, 0), d.clone().normalize())); g.translate((A.x + C.x) / 2, (A.y + C.y) / 2, (A.z + C.z) / 2); return put(g, k); };
  const grid = (k, nu, nv, f, uv = .5) => { const pos = [], idx = []; for (let j = 0; j <= nv; j++) for (let i = 0; i <= nu; i++) pos.push(...f(i / nu, j / nv));
    for (let j = 0; j < nv; j++) for (let i = 0; i < nu; i++) { const a = j * (nu + 1) + i, b = a + 1, c = a + nu + 1, d = c + 1; idx.push(a, c, b, b, c, d); }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals(); return put(g, k, 0, 0, 0, 0, 0, 0, uv); };
  const sm = t => { t = Math.min(1, Math.max(0, t)); return t * t * (3 - 2 * t); };
  // the land: falling to -x at 1 in 40 with a roll; the lane along x at z -6, the ditch north of it; the field level where the coach lies
  const RZ = -6, RW = 3.6, DZ = -3.0, DW = 2.2, DD = .45, WZ = 4.5, CX = 0, CZ = -.8, CA = .12;
  const base0 = (x, z) => -.025 * x + .08 * Math.sin(x * .17 + ph[0]) * Math.sin(z * .13 + ph[1]) + .03 * Math.sin(x * .5 + z * .4 + ph[2]);
  const CG = +base0(CX, CZ + 1).toFixed(3), flatW = (x, z) => sm((4.2 - Math.hypot((x - CX) * .8, z - CZ - 1)) / 2.2), base = (x, z) => { const b = base0(x, z); return b + (CG - b) * flatW(x, z); };
  const ditch = (x, z) => DD * Math.pow(Math.max(0, Math.cos(Math.PI * Math.min(1, Math.abs(z - DZ) / (DW / 2)) / 2)), 1.4);
  const roadY = x => base(x, RZ);
  const ground = (x, z) => { const b = base(x, z) - ditch(x, z), rw = sm((RW / 2 + 1.0 - Math.abs(z - RZ)) / 1.0); return b + (roadY(x) - .04 * Math.min(1, Math.abs(z - RZ) / (RW / 2)) - b) * rw; };
  // the paths: from the lane over the ditch to the coach's underside; from the lane round its front and along its roof to the wall
  const paths = [[[CX + 6.5, RZ], [CX + 5.6, DZ], [CX + 3.6, CZ - 1.1], [CX - .4, CZ - 1.1]], [[CX - 7.5, RZ], [CX - 7.0, DZ], [CX - 5.0, CZ + .6], [CX - 4.0, CZ + 3.1], [CX + 3.4, CZ + 3.1]]];
  const segD = (x, z, a, b) => { const dx = b[0] - a[0], dz = b[1] - a[1], t = Math.max(0, Math.min(1, ((x - a[0]) * dx + (z - a[1]) * dz) / (dx * dx + dz * dz))); return Math.hypot(x - a[0] - dx * t, z - a[1] - dz * t); };
  const pathD = (x, z) => Math.min(...paths.flatMap(p => p.slice(0, -1).map((q, i) => segD(x, z, q, p[i + 1]))));
  { const steps = (bands, end) => { const v = []; for (const [a, b, st] of bands) for (let q = a; q < b - 1e-6; q += st) v.push(+q.toFixed(2)); v.push(end); return v; };
    const gx = steps([[-160, -45, 23], [-45, -22, 2.5], [-22, 22, 1.0], [22, 45, 2.5], [45, 160, 23]], 160), gz = steps([[-160, -40, 24], [-40, -14, 2.5], [-14, -8, 1.0], [-8, -1.6, .4], [-1.6, 8, 1.0], [8, 40, 2.5], [40, 160, 24]], 160);
    const pos = [], NX = gx.length, I = { turf: [], track: [] }; for (const z of gz) for (const x of gx) pos.push(x, ground(x, z), z);
    for (let j = 0; j + 1 < gz.length; j++) for (let i = 0; i + 1 < NX; i++) { const a = j * NX + i, b = a + 1, c = a + NX, d = c + 1, cz = (gz[j] + gz[j + 1]) / 2; I[Math.abs(cz - RZ) < RW / 2 + .1 ? 'track' : 'turf'].push(a, c, b, b, c, d); }
    for (const [k, idx] of Object.entries(I)) { const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals(); put(g, k, 0, 0, 0, 0, 0, 0, .35); } }
  // a strip of earth over the ground along a polyline, w wide (the gouges)
  const strip = (k, P, w, lift = .025) => { const pts = []; for (let i = 0; i + 1 < P.length; i++) { const [a, b] = [P[i], P[i + 1]], L = Math.hypot(b[0] - a[0], b[1] - a[1]), n = Math.ceil(L / .3); for (let q = i ? 1 : 0; q <= n; q++) pts.push([a[0] + (b[0] - a[0]) * q / n, a[1] + (b[1] - a[1]) * q / n]); }
    const pos = [], idx = []; pts.forEach(([x, z], i) => { const [p, q] = [pts[Math.max(0, i - 1)], pts[Math.min(pts.length - 1, i + 1)]], dx = q[0] - p[0], dz = q[1] - p[1], l = Math.hypot(dx, dz), ww = w * (.8 + .3 * Math.sin(i * .9 + ph[4]));
      for (const sd of [-1, 0, 1]) { const ex = x - dz / l * ww * sd / 2, ez = z + dx / l * ww * sd / 2; pos.push(ex, ground(ex, ez) + lift, ez); } if (i) { const o2 = (i - 1) * 3; for (let c = 0; c < 2; c++) idx.push(o2 + c, o2 + c + 3, o2 + c + 1, o2 + c + 1, o2 + c + 3, o2 + c + 4); } });
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals(); if (g.attributes.normal.array[1] < 0) { g.setIndex(idx.map((v, j) => idx[j - j % 3 + [0, 2, 1][j % 3]])); g.computeVertexNormals(); } put(g, k, 0, 0, 0, 0, 0, 0, .35); };
  // the gouges: the coach's wheels and then its side, from the lane's north edge over the ditch to where it lies
  for (const dz of [0, 1.5]) strip('earth', [[CX + 19, RZ + RW / 2 - .1 + dz * .2], [CX + 12, DZ - .2 + dz * .5], [CX + 6.5, CZ - 1.6 + dz * .7], [CX + 2.2, CZ - .3 + dz * .5]], .32 + dz * .1);
  for (let k = 0; k < 14; k++) { const t = F(), x = CX + 12 - t * 9, z = DZ + .4 + t * 2.4 + (F() - .5) * 2.2; if (pathD(x, z) < .5) continue; const g = new THREE.IcosahedronGeometry(.1 + F() * .08, 0); g.scale(1.3, .6, 1.1); put(g, 'earth', x, ground(x, z) + .04, z, F(), F() * 3); } /* clods thrown up */
  // ── the coach: built upright in its own frame (x along it, +x the front; y up, the wheels' foot at 0; z across, +z its right side), then laid on
  // its left side: local (x, y, z) goes to the world's (-x, z, y) turned by CA about the upright, so the roof faces the wall and the underside the lane
  const CY = CG + .745, CM = new THREE.Matrix4().makeTranslation(CX, CY, CZ).multiply(new THREE.Matrix4().makeRotationY(Math.PI + CA)).multiply(new THREE.Matrix4().makeRotationX(-Math.PI / 2));
  const W = (x, y, z) => { const v = V3(x, y, z).applyMatrix4(CM); return [v.x, v.y, v.z]; };
  const CP = (geo, k, x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0, pre = null) => { geo.applyMatrix4(new THREE.Matrix4().compose(V3(x, y, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(rx, ry, rz, 'YXZ')), V3(1, 1, 1))); if (pre) geo.applyMatrix4(pre); geo.applyMatrix4(CM); return put(geo, k); };
  const CR = (k, a, b, rad, seg = 6, pre = null) => { const t = p => pre ? V3(...p).applyMatrix4(pre).toArray() : p; return rod(k, W(...t(a)), W(...t(b)), rad, seg); };
  const BL = 2.3, BW = 1.45, Y0 = .85, Y1 = 2.2, T = .04, hx = BL / 2, hz = BW / 2, DX = [-.31, .31], DY = [.92, 2.1];
  // the body: panels round a dark lining (drawn from inside only, so it shows through the doorway and nowhere else)
  CP(new THREE.BoxGeometry(BL, T, BW), 'paint', 0, Y0 + T / 2, 0); CP(new THREE.BoxGeometry(BL + .12, .06, BW + .1), 'black', 0, Y1 + .03, 0);
  for (const sx of [-1, 1]) CP(new THREE.BoxGeometry(T, Y1 - Y0, BW), 'paint', sx * (hx - T / 2), (Y0 + Y1) / 2, 0);
  CP(new THREE.BoxGeometry(BL, Y1 - Y0, T), 'paint', 0, (Y0 + Y1) / 2, -hz + T / 2);
  for (const [x0, x1, y0, y1] of [[-hx, DX[0], Y0, Y1], [DX[1], hx, Y0, Y1], [DX[0], DX[1], Y0, DY[0]], [DX[0], DX[1], DY[1], Y1]]) CP(new THREE.BoxGeometry(x1 - x0, y1 - y0, T), 'paint', (x0 + x1) / 2, (y0 + y1) / 2, hz - T / 2);
  CP(new THREE.BoxGeometry(BL - .1, Y1 - Y0 - .1, BW - .1), 'dark', 0, (Y0 + Y1) / 2, 0);
  CP(new THREE.BoxGeometry(.5, .14, BW - .14), 'cloth', -.8, Y0 + .48, 0); CP(new THREE.BoxGeometry(.5, .14, BW - .14), 'cloth', .8, Y0 + .48, 0) /* the two seats, under the windows */;
  for (const sz of [-1, 1]) { for (const sx of [-1, 1]) for (const [x0, x1, y0, y1] of [[.5, .95, 1.5, 2.0]]) CP(new THREE.BoxGeometry(x1 - x0, y1 - y0, .012), sz > 0 && sx > 0 ? 'black' : 'glass', sx * (x0 + x1) / 2, (y0 + y1) / 2, sz * (hz + .006)) /* the quarter windows; the far front one broken out */;
    for (const y of [Y0 + .05, 1.42, Y1 - .04]) CP(new THREE.BoxGeometry(BL + .02, .05, .03), 'black', 0, y, sz * (hz + .01)); }
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) CR('black', [sx * hx, Y0, sz * hz], [sx * hx, Y1, sz * hz], .03, 5) /* the corner pillars */;
  // the door: hinged at its back edge, swung out 100° so it stands up past upright, leaning back over the body; its window, its brass handle
  const DH = new THREE.Matrix4().makeTranslation(DX[0], 0, hz).multiply(new THREE.Matrix4().makeRotationY(-100 * Math.PI / 180)).multiply(new THREE.Matrix4().makeTranslation(-DX[0], 0, -hz));
  { const dw = DX[1] - DX[0], dy = (DY[0] + DY[1]) / 2; CP(new THREE.BoxGeometry(dw - .01, DY[1] - DY[0] - .01, .035), 'paint', 0, dy, hz + .02, 0, 0, 0, DH); CP(new THREE.BoxGeometry(dw - .16, .4, .012), 'glass', 0, 1.78, hz + .042, 0, 0, 0, DH);
    CP(new THREE.BoxGeometry(dw - .16, .3, .01), 'black', 0, 1.25, hz + .042, 0, 0, 0, DH); CP(new THREE.SphereGeometry(.025, 8, 6), 'yellow', DX[1] - .07, 1.45, hz + .06, 0, 0, 0, DH); CP(new THREE.BoxGeometry(dw - .16, .3, .01), 'black', 0, 1.25, hz + .042, 0, Math.PI, 0, DH) /* its inner face */; }
  const doorEdge = W(...V3(DX[1], DY[1], hz + .02).applyMatrix4(DH).toArray()), doorHole = W(0, (DY[0] + DY[1]) / 2, hz);
  // the roof rail and the one case still strapped under it, on the upper half
  for (const [x, z] of [[1.0, .62], [-1.0, .62], [1.0, -.62], [-1.0, -.62]]) CR('iron', [x, Y1 + .06, z], [x, Y1 + .22, z], .015, 4);
  for (const sz of [-1, 1]) CR('iron', [-1.0, Y1 + .22, sz * .62], [1.0, Y1 + .22, sz * .62], .015, 4); for (const sx of [-1, 1]) CR('iron', [sx * 1.0, Y1 + .22, -.62], [sx * 1.0, Y1 + .22, .62], .015, 4);
  CP(new THREE.BoxGeometry(.62, .26, .4), 'leather', -.3, Y1 + .19, .38); CR('black', [-.3, Y1 + .06, .62], [-.3, Y1 + .33, .62], .012, 4);
  // under it: the perch, the axles, the leaf springs; the fore-carriage turned 15° on its pivot
  const FC = new THREE.Matrix4().makeTranslation(1.05, 0, 0).multiply(new THREE.Matrix4().makeRotationY(.26)).multiply(new THREE.Matrix4().makeTranslation(-1.05, 0, 0));
  CR('black', [-1.1, .58, 0], [1.1, .52, 0], .055, 6); CR('iron', [-1.0, .72, -.8], [-1.0, .72, .96], .04, 6); CR('iron', [1.05, .52, -.8], [1.05, .52, .92], .035, 6, FC);
  for (const [x, y, pre] of [[-1.0, .8, null], [1.05, .64, FC]]) for (const sz of [-1, 1]) { const g = new THREE.SphereGeometry(.1, 10, 6); g.scale(4.2, .7, 1.2); CP(g, 'black', x, y, sz * .5, 0, 0, 0, pre); }
  // the wheels: the right pair up in the air on their axles, the iron tyre, the felloe, the spokes, the nave
  const wheels = [], wheel = (x, y, z, rr, n, pre = null, keep = n) => { CP(new THREE.TorusGeometry(rr - .015, .03, 5, 32), 'iron', x, y, z, 0, 0, 0, pre); CP(new THREE.TorusGeometry(rr - .06, .035, 5, 28), 'yellow', x, y, z, 0, 0, 0, pre);
    for (let k = 0; k < keep; k++) { const a = k / n * 6.283 + ph[5]; CR('yellow', [x + .09 * Math.cos(a), y + .09 * Math.sin(a), z], [x + (rr - .08) * Math.cos(a), y + (rr - .08) * Math.sin(a), z], .02, 4, pre); }
    const g = new THREE.CylinderGeometry(.1, .1, .2, 10); g.rotateX(Math.PI / 2); CP(g, 'yellow', x, y, z, 0, 0, 0, pre); const w = W(...(pre ? V3(x, y, z).applyMatrix4(pre).toArray() : [x, y, z])); return { x: +w[0].toFixed(3), y: +w[1].toFixed(3), z: +w[2].toFixed(3), r: rr }; };
  wheels.push(wheel(-1.0, .72, .92, .72, 12), wheel(1.05, .52, .88, .52, 12, FC));
  { const g = new THREE.CylinderGeometry(.1, .1, .14, 10); g.rotateX(Math.PI / 2); CP(g, 'yellow', -1.0, .72, -.76); for (let k = 0; k < 3; k++) { const a = k * 1.9 + ph[6]; CR('yellow', [-1.0 + .09 * Math.cos(a), .72 + .09 * Math.sin(a), -.76], [-1.0 + .3 * Math.cos(a), .72 + .3 * Math.sin(a), -.76], .02, 4); } } /* the near rear nave, its spokes broken short */
  // the driver's box: the seat over the front, its backrest against the body, the footboard sloping down ahead; the lamps at the front corners
  CP(new THREE.BoxGeometry(.5, .32, BW - .1), 'black', hx + .2, 1.75, 0); CP(new THREE.BoxGeometry(.48, .1, BW - .1), 'cloth', hx + .2, 1.96, 0); CP(new THREE.BoxGeometry(.06, .38, BW - .1), 'black', hx + .03, 2.2, 0);
  CP(new THREE.BoxGeometry(.6, .04, BW - .3), 'black', hx + .7, 1.42, 0, 0, 0, -.5); for (const sz of [-1, 1]) CR('iron', [hx + .45, 1.6, sz * .55], [hx + .95, 1.3, sz * .55], .015, 4);
  { const x = hx + .05, y = 1.95, z = .82; CR('iron', [x - .05, y - .1, hz], [x, y - .1, z], .012, 4); CP(new THREE.BoxGeometry(.13, .2, .13), 'lamp', x, y, z); CP(new THREE.ConeGeometry(.1, .1, 4), 'black', x, y + .15, z, 0, Math.PI / 4); CP(new THREE.CylinderGeometry(.06, .07, .05, 8), 'black', x, y - .12, z); }
  const lampW = W(hx + .05, 1.95, .82);
  // the splinter bar ahead of the fore-carriage, the four traces cut short at it and hanging; the pole snapped a metre out from its socket
  const traces = [];
  { CR('black', [1.45, .55, -.62], [1.45, .55, .62], .035, 5, FC); for (const z of [-.6, -.3, .3, .6]) { const a = W(...V3(1.45, .55, z).applyMatrix4(FC).toArray()), L = .55 + F() * .35, hang = [a[0] - .18, Math.max(ground(a[0] - .18, a[2]) + .02, a[1] - L), a[2] + .05];
      const rest = Math.max(0, L - (a[1] - hang[1])), end = [hang[0] - rest * .9, ground(hang[0] - rest * .9, hang[2]) + .02, hang[2]]; rod('leather', a, hang, .018, 4); if (rest > .05) rod('leather', hang, end, .018, 4); traces.push((rest > .05 ? end : hang).map(v => +v.toFixed(3))); }
    CR('black', [1.15, .5, 0], [2.15, .56, 0], .05, 6, FC); for (let k = 0; k < 4; k++) { const a = k * 1.6; CR('yellow', [2.1, .56 + .03 * Math.sin(a), .03 * Math.cos(a)], [2.32 + .08 * k, .56 + .05 * Math.sin(a), .05 * Math.cos(a)], .012, 3, FC); } }
  // ── off it: things lying where they fell (each one's foot on the ground)
  const lying = [], lie = (what, x, z, h, f) => { const y = ground(x, z); f(x, y, z); lying.push({ x: +x.toFixed(3), y: +y.toFixed(3), z: +z.toFixed(3), what, h }); };
  lie('wheel', CX - 3.2, CZ - 2.0, .035, (x, y, z) => { put(new THREE.TorusGeometry(.5, .03, 5, 28).rotateX(Math.PI / 2), 'iron', x, y + .035, z); put(new THREE.TorusGeometry(.46, .035, 5, 24).rotateX(Math.PI / 2), 'yellow', x, y + .035, z);
    for (let k = 0; k < 12; k++) { const a = k / 12 * 6.283; rod('yellow', [x + .09 * Math.cos(a), y + .035, z + .09 * Math.sin(a)], [x + .44 * Math.cos(a), y + .035, z + .44 * Math.sin(a)], .02, 4); } put(new THREE.CylinderGeometry(.1, .1, .2, 10), 'yellow', x, y + .1, z); });
  lie('rim', CX + 1.8, CZ - .3 - 1.1, .035, (x, y, z) => { put(new THREE.TorusGeometry(.7, .03, 5, 20, 2.0).rotateX(Math.PI / 2), 'iron', x, y + .035, z, 0, ph[7]); put(new THREE.TorusGeometry(.66, .035, 5, 18, 1.7).rotateX(Math.PI / 2), 'yellow', x, y + .035, z, 0, ph[7] + .15); });
  for (let k = 0; k < 4; k++) lie('spoke', CX + 2.6 + F() * .8, CZ - 2.1 - F() * .6, .02, (x, y, z) => { const a = F() * 3; rod('yellow', [x - .3 * Math.cos(a), y + .02, z - .3 * Math.sin(a)], [x + .3 * Math.cos(a), ground(x + .3 * Math.cos(a), z + .3 * Math.sin(a)) + .02, z + .3 * Math.sin(a)], .02, 4); });
  lie('pole', CX - 4.6, CZ - 1.7, .05, (x, y, z) => { const a = .5; rod('black', [x - 1.1 * Math.cos(a), ground(x - 1.1 * Math.cos(a), z + 1.1 * Math.sin(a)) + .05, z + 1.1 * Math.sin(a)], [x + 1.1 * Math.cos(a), ground(x + 1.1 * Math.cos(a), z - 1.1 * Math.sin(a)) + .05, z - 1.1 * Math.sin(a)], .05, 6);
    for (let k = 0; k < 3; k++) rod('yellow', [x + 1.05 * Math.cos(a), y + .05, z - 1.05 * Math.sin(a)], [x + (1.25 + .06 * k) * Math.cos(a), y + .05 + .02 * k, z - (1.25 + .06 * k) * Math.sin(a) + .03 * (k - 1)], .012, 3); });
  lie('lamp', CX - 1.9, CZ + 2.5, .065, (x, y, z) => { put(new THREE.BoxGeometry(.13, .13, .2), 'glass', x, y + .065, z, 0, .7); put(new THREE.ConeGeometry(.1, .1, 4).rotateZ(Math.PI / 2), 'black', x + .14, y + .07, z - .1, 0, .7); });
  lie('whip', CX + 9.0, RZ + .6, .015, (x, y, z) => { rod('black', [x - .7, roadY(x - .7) + .015, z - .2], [x + .7, roadY(x + .7) + .015, z + .2], .015, 4); rod('leather', [x + .7, roadY(x + .7) + .006, z + .2], [x + 1.6, roadY(x + 1.6) + .006, z + .6], .006, 3); });
  lie('hat', CX + 4.0, DZ + .2, .0, (x, y, z) => { put(new THREE.CylinderGeometry(.19, .19, .015, 14), 'black', x, y + .008, z, .05, 0, .04); put(new THREE.CylinderGeometry(.11, .12, .16, 12), 'black', x + .02, y + .09, z, .05, 0, .04); });
  // the luggage, thrown off the roof towards the wall: a trunk on its end, another burst with its lid back, a hatbox rolled away, a valise
  lie('trunk', CX + 3.8, CZ + 4.5, .425, (x, y, z) => { put(new THREE.BoxGeometry(.6, .85, .5), 'trunk', x, y + .425, z, 0, .4); for (const d of [-.25, .25]) put(new THREE.BoxGeometry(.62, .04, .52), 'black', x, y + .425 + d, z, 0, .4); }) /* on its end, its two bands round it */;
  lie('trunk', CX - 2.6, CZ + 4.7, .25, (x, y, z) => { const a = -.2, th = 110 * Math.PI / 180, oy = .5 + .25 * Math.sin(th) + .02, oz = .25 - .25 * Math.cos(th); put(new THREE.BoxGeometry(.8, .5, .5), 'trunk', x, y + .25, z, 0, a);
    put(new THREE.BoxGeometry(.8, .04, .5), 'trunk', x + oz * Math.sin(a), y + oy, z + oz * Math.cos(a), th, a) /* its lid back on its hinge, 110° open */;
    for (let k = 0; k < 11; k++) { const sx = x + (F() - .5) * 1.3, sz = z - .4 - F() * .7, kk = ['linen', 'wool', 'cloth', 'linen'][k % 4]; if (pathD(sx, sz) < .45) continue; const g = new THREE.IcosahedronGeometry(.11 + F() * .08, 1); g.scale(1.8 + F(), .28, .9 + F() * .5); put(g, kk, sx, ground(sx, sz) + .04, sz, F() * .2, F() * 3); } });
  lie('hatbox', CX + 5.6, CZ + 2.0, .14, (x, y, z) => { put(new THREE.CylinderGeometry(.2, .2, .28, 14).rotateZ(Math.PI / 2), 'leather', x, y + .2, z, 0, .9); });
  lie('valise', CX - 4.6, CZ + 4.2, .12, (x, y, z) => { put(new THREE.BoxGeometry(.6, .24, .38), 'leather', x, y + .12, z, 0, 1.2); put(new THREE.TorusGeometry(.07, .012, 4, 10, Math.PI), 'yellow', x, y + .25, z, 0, 1.2 + Math.PI / 2); });
  // the wall: dry stone along the field's far side, 1.1 to 1.3 m, its top a row of copes on edge
  const wallH = 1.15; for (let x = -30; x < 30; x += .5) { const w = .44 + F() * .1, xm = x + w / 2, bot = ground(xm, WZ) - .05, n = 4, ch = (wallH - .25) / n;
    for (let c = 0; c < n; c++) put(new THREE.BoxGeometry(w - (c % 2) * .04, ch - .02, .62 - c * .06), 'wall', xm + (c % 2) * .05, bot + c * ch + ch / 2, WZ + (F() - .5) * .04, 0, (F() - .5) * .06);
    for (let k = 0; k < 2; k++) put(new THREE.BoxGeometry(.25, .32, .36), 'wall', x + .125 + k * .25, bot + wallH - .25 + .15, WZ, 0, 0, (F() - .5) * .25); }
  // the hedge across the lane, thorn; ash and oak in it and beyond the wall
  for (let x = -60; x < 60; x += 1.2) { if (Math.sin(x * .11 + ph[8]) > .9) continue; const z = RZ - RW / 2 - 2.2 + (F() - .5) * .3, y = ground(x, z); for (let k = 0; k < 2; k++) put(new THREE.IcosahedronGeometry(.75 + F() * .3, 0).scale(1, .9, .8), 'leaf', x + (F() - .5) * .4, y + .55 + k * .7, z + (F() - .5) * .3, F(), F() * 3); }
  const trees = [], tree = (x, z, h) => { const gy = ground(x, z), top = [x + (F() - .5) * .5, gy + h * .5, z + (F() - .5) * .5], au = F() < .45; rod('bark', [x, gy - .3, z], top, .16 + h * .013, 7, .7);
    for (let l = 0; l < 5; l++) { const a = l * 1.3 + F(), L = 1.6 + F() * 1.4, e = [top[0] + Math.cos(a) * L, top[1] + .8 + l * .55 + F(), top[2] + Math.sin(a) * L]; rod('bark', [top[0], top[1] - .5 + l * .25, top[2]], e, .07, 5, .6);
      for (let c2 = 0; c2 < 3; c2++) put(new THREE.IcosahedronGeometry(.9 + F() * .6, 0).scale(1.15, .8, 1.15), au && c2 ? 'leafAu' : 'leaf', e[0] + (F() - .5) * 1.6, e[1] + (F() - .4) * 1.2, e[2] + (F() - .5) * 1.6, F(), F() * 3); }
    put(new THREE.IcosahedronGeometry(1.4, 0).scale(1.15, .85, 1.15), au ? 'leafAu' : 'leaf', top[0], gy + h * .85, top[2]); trees.push({ x: +x.toFixed(2), z: +z.toFixed(2), h: +h.toFixed(2) }); };
  for (let k = 0, n = 0; k < 900 && n < 6; k++) { const x = -40 + F() * 80, z = RZ - RW / 2 - 2.2 + (F() - .5) * .6; if (x > -10 && x < 18 || trees.some(t => Math.hypot(t.x - x, t.z - z) < 9)) continue; n++; tree(x, z, 8 + F() * 4); }
  for (let k = 0, n = 0; k < 900 && n < 8; k++) { const x = -40 + F() * 80, z = WZ + 3 + F() * 24; if (trees.some(t => Math.hypot(t.x - x, t.z - z) < 8)) continue; n++; tree(x, z, 9 + F() * 4); }
  for (let k = 0, n = 0; k < 900 && n < 5; k++) { const x = -40 + F() * 80, z = RZ - RW / 2 - 8 - F() * 20; if (trees.some(t => Math.hypot(t.x - x, t.z - z) < 8)) continue; n++; tree(x, z, 9 + F() * 4); }
  const group = new THREE.Group(); let tris = 0;
  for (const [k, gs] of B) { const g = mergeGeometries(gs, false); gs.forEach(x => x.dispose()); const m = new THREE.Mesh(g, M[k]); m.name = k; m.castShadow = !['turf', 'track', 'earth', 'dark', 'lamp'].includes(k); m.receiveShadow = true; group.add(m); tris += g.attributes.position.count / 3; }
  const rest = []; for (const x of [-.9, 0, .9]) for (const y of [1.05, 2.0]) rest.push(W(x, y, -hz).map(v => +v.toFixed(3)));
  return { group, tris: Math.round(tris), draws: group.children.length, own: group.children.length, top: +new THREE.Box3().setFromObject(group).max.y.toFixed(2), ground,
    coach: { x: CX, z: CZ, y: CG, ry: CA, rest, top: +W(0, 1.5, hz)[1].toFixed(3), door: { edge: doorEdge.map(v => +v.toFixed(3)), hole: doorHole.map(v => +v.toFixed(3)) }, wheels, lamp: lampW.map(v => +v.toFixed(3)), front: W(hx + .9, 1.4, 0).map(v => +v.toFixed(3)) },
    traces, lying, wall: { z: WZ, h: wallH }, road: { z: RZ, w: RW }, ditch: { z: DZ, w: DW, d: DD }, paths, trees };
}

// ── the Gatelands' locked cellar (Session 1026, card F8; OG-124's panel 6, "small mysteries with no marker: … a locked cellar"). A cottage
// fell long ago and the field took it back: its footings stand to the knee in nettles, its west gable whole with its chimney, a patch of
// limewash still on the inside. In its floor at the east end is a cellar's hatch in a stone kerb, two oak leaves grey with age, and across
// them a chain through the hasp held by a padlock that is new and bright. The grass is trodden from the lane through the doorway to the
// hatch and nowhere else. Who comes, and what is below, is the quest writer's: the place only shows that someone does. Built at true size,
// a metre a unit, in pasture rising gently to -z, the lane along x at z 10:
//   - the cottage: 7.0 by 4.6 m outside, walls 0.55 m thick of rubble stone, standing 0.3 to 0.9 m; its doorway in the south wall; the west
//     gable to its apex at 4.6 m, the stack over it; rubble fallen inside along the walls; the hearth stone at the gable's foot;
//   - the hatch: 1.2 by 1.0 m in a kerb of dressed stone flush with the floor, two leaves on strap hinges, a hasp, a chain and the padlock;
//   - the land: nettles in the footings, an elder grown in the east corner, a thorn by the lane, the path worn to the hatch.
// -> { group, tris, draws, own, ground(x, z), house { x0, x1, z0, z1, t, door [x0, x1], gable { x, apex, stack } }, hatch { x, z, w, d, kerb [[x, y, z]] (its corners' tops),
//      leaves (their top), hasp [x, y, z], lock [x, y, z] }, stubs [{ x, z, h }], lying [{ x, y, z, what }], road { z, w }, paths, trees }
export function gatelandsCellar(o = {}, r = stream('cellar')) {
  const std = (c, ro = .9, x = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: ro, ...x }); const MI = millMats();
  const M = { turf: MI.turf, track: mat('turfDry', { ns: 1.0, color: 0x9a8a6c, rough: 1 }), wall: mat('stone', { ns: 1.3, color: 0xa8a49a, rough: .95 }), dress: MI.dress, lime: MI.lime,
    oak: mat('wood', { ns: 1.1, color: 0x8a8478, rough: .95 }), iron: std(0x4a3426, .8, { metalness: .4 }), bright: std(0xe4e6e8, .3, { metalness: .55 }),
    bark: std(0x5e564c, .95), leaf: std(0x56682a, .85), nettle: std(0x3e5a26, .9), dark: std(0x0c0a08, 1) };
  const B = new Map(), key = String(o.key || 'cellar'), F = stream(key + ':lie'), ph = Array.from({ length: 10 }, () => F() * 6.283), V3 = (x, y, z) => new THREE.Vector3(x, y, z);
  const put = (geo, k, x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0, uv = .5) => { const g = geo.index ? geo.toNonIndexed() : geo; for (const a of Object.keys(g.attributes)) if (!['position', 'normal'].includes(a)) g.deleteAttribute(a);
    if (!g.attributes.normal) g.computeVertexNormals(); g.applyMatrix4(new THREE.Matrix4().compose(V3(x, y, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(rx, ry, rz, 'YXZ')), V3(1, 1, 1))); worldUV(g, uv);
    if (!B.has(k)) B.set(k, []); B.get(k).push(g); return g; };
  const rod = (k, a, b, rad, seg = 6, taper = 1) => { const A = V3(...a), C = V3(...b), d = C.clone().sub(A), g = new THREE.CylinderGeometry(rad * taper, rad, d.length(), seg);
    g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(V3(0, 1, 0), d.clone().normalize())); g.translate((A.x + C.x) / 2, (A.y + C.y) / 2, (A.z + C.z) / 2); return put(g, k); };
  const sm = t => { t = Math.min(1, Math.max(0, t)); return t * t * (3 - 2 * t); };
  // the land: rising to -z at 1 in 30 with a roll; the cottage's floor levelled, the lane along x at z 10
  const RZ = 10, RW = 3.4, X0 = -3.5, X1 = 3.5, Z0 = -2.3, Z1 = 2.3, T = .55, DOOR = [-.5, .5];
  const base0 = (x, z) => -z / 30 + .1 * Math.sin(x * .17 + ph[0]) * Math.sin(z * .14 + ph[1]) + .04 * Math.sin(x * .5 + z * .45 + ph[2]);
  const FY = +base0(0, 0).toFixed(3), inH = (x, z, m) => x > X0 - m && x < X1 + m && z > Z0 - m && z < Z1 + m;
  const base = (x, z) => { const b = base0(x, z), d = Math.max(Math.abs(x) - (X1 + .3), Math.abs(z) - (Z1 + .3), 0), w = 1 - sm(d / 2.5); return b + (FY - b) * w; };
  const roadY = x => base(x, RZ), ground = (x, z) => { const b = base(x, z), rw = sm((RW / 2 + 1.0 - Math.abs(z - RZ)) / 1.0); return b + (roadY(x) - .04 * Math.min(1, Math.abs(z - RZ) / (RW / 2)) - b) * rw; };
  const HX = 2.0, HZ = -.8, HW = 1.2, HD = 1.0;
  const paths = [[[1.2, RZ], [.6, 6.0], [0, Z1 + 1.2], [0, Z1 - .2], [.9, .4], [HX - .3, HZ + HD / 2 + .45]]];
  const segD = (x, z, a, b) => { const dx = b[0] - a[0], dz = b[1] - a[1], t = Math.max(0, Math.min(1, ((x - a[0]) * dx + (z - a[1]) * dz) / (dx * dx + dz * dz))); return Math.hypot(x - a[0] - dx * t, z - a[1] - dz * t); };
  const pathD = (x, z) => Math.min(...paths.flatMap(p => p.slice(0, -1).map((q, i) => segD(x, z, q, p[i + 1]))));
  const worn = (x, z) => pathD(x, z) < .45 || (Math.abs(x - HX) < HW / 2 + .5 && Math.abs(z - HZ) < HD / 2 + .5);
  { const steps = (bands, end) => { const v = []; for (const [a, b, st] of bands) for (let q = a; q < b - 1e-6; q += st) v.push(+q.toFixed(2)); v.push(end); return v; };
    const gx = steps([[-160, -40, 24], [-40, -14, 2.5], [-14, 14, .5], [14, 40, 2.5], [40, 160, 24]], 160), gz = steps([[-160, -40, 24], [-40, -10, 2.5], [-10, 13, .5], [13, 40, 2.5], [40, 160, 24]], 160);
    const pos = [], NX = gx.length, I = { turf: [], track: [] }; for (const z of gz) for (const x of gx) pos.push(x, ground(x, z), z);
    for (let j = 0; j + 1 < gz.length; j++) for (let i = 0; i + 1 < NX; i++) { const a = j * NX + i, b = a + 1, c = a + NX, d = c + 1, cx = (gx[i] + gx[i + 1]) / 2, cz = (gz[j] + gz[j + 1]) / 2;
      I[Math.abs(cz - RZ) < RW / 2 + .1 || worn(cx, cz) ? 'track' : 'turf'].push(a, c, b, b, c, d); }
    for (const [k, idx] of Object.entries(I)) { const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals(); put(g, k, 0, 0, 0, 0, 0, 0, .35); } }
  // the footings: rubble stone in courses along the four walls, each stretch to its own height; the doorway's gap in the south wall
  const stubs = [], lying = [], hAt = (s) => .3 + .6 * (.5 + .5 * Math.sin(s * .9 + ph[3]) * Math.cos(s * .37 + ph[4]));
  const runs = [[X0 + T, Z1 - T / 2, DOOR[0], 0], [DOOR[1], Z1 - T / 2, X1 - T, 0], [X0 + T, Z0 + T / 2, X1 - T, 0], [X1 - T / 2, Z0, Z1, 1]] /* [from, at, to, along z?]: the south wall in two by the door, the north, the east; the west is the gable */;
  for (const [a, at, b, alongZ] of runs) for (let s = a; s < b - .05; s += .5) { const L = Math.min(.5, b - s), m = s + L / 2, x = alongZ ? at : m, z = alongZ ? m : at, h = hAt(m + (alongZ ? 20 : 0) + at), n = Math.max(1, Math.round(h / .22)), ch = h / n;
    for (let c = 0; c < n; c++) put(new THREE.BoxGeometry(alongZ ? T - c * .03 : L - .02, ch - .015, alongZ ? L - .02 : T - c * .03), 'wall', x + (alongZ ? 0 : (c % 2) * .04), FY - .05 + c * ch + ch / 2, z + (alongZ ? (c % 2) * .04 : 0), 0, (F() - .5) * .05);
    stubs.push({ x: +x.toFixed(2), z: +z.toFixed(2), h: +(h - .05).toFixed(2) }); }
  // the west gable, whole: the wall to the eaves at 2.4 m, then the gable's triangle to its apex at 4.6 m, the stack over the apex; limewash on its inner face
  const GX = X0 + T / 2, EAVE = 2.4, APEX = 4.6, STK = 5.5;
  for (let y = 0; y < APEX - .05; y += .25) { const half = y < EAVE ? Z1 : Z1 * (APEX - y) / (APEX - EAVE), h2 = y < EAVE ? Z1 : Z1 * (APEX - y - .25) / (APEX - EAVE), w = Math.max(.3, (half + h2)); put(new THREE.BoxGeometry(T, .24, w), 'wall', GX, FY - .05 + y + .12, 0, 0, 0, 0); }
  put(new THREE.BoxGeometry(.6, STK - APEX + .3, .9), 'wall', GX, FY + APEX + (STK - APEX) / 2 - .2, 0); put(new THREE.BoxGeometry(.7, .1, 1.0), 'dress', GX, FY + STK + .05, 0);
  put(new THREE.BoxGeometry(.02, 1.4, 2.2), 'lime', GX + T / 2 + .01, FY + 1.3, -.6); put(new THREE.BoxGeometry(.02, .7, 1.0), 'lime', GX + T / 2 + .01, FY + 1.85, 1.0);
  put(new THREE.BoxGeometry(.9, 1.1, .7), 'dark', GX + T / 2 - .1, FY + .55, 0) /* the fireplace's mouth */; put(new THREE.BoxGeometry(.25, .06, 1.3), 'dress', GX + T / 2 + .1, FY + 1.12, 0) /* its lintel */;
  put(new THREE.BoxGeometry(1.0, .08, 1.3), 'dress', GX + T / 2 + .5, FY + .02, 0) /* the hearth stone */;
  // the rubble fallen inside along the walls and out of the east end
  for (let k = 0; k < 34; k++) { const side = k % 4, t = F(), x = side < 2 ? X0 + T + .5 + t * (X1 - X0 - 2 * T - 1) : side === 2 ? X1 - T - .4 - F() * .5 : X1 + .4 + F() * .9, z = side === 0 ? Z1 - T - .3 - F() * .4 : side === 1 ? Z0 + T + .3 + F() * .4 : Z0 + .6 + t * (Z1 - Z0 - 1.2);
    if (worn(x, z) || pathD(x, z) < .7) continue; const q = .12 + F() * .1, g = new THREE.BoxGeometry(q * 2.2, q, q * 1.5); put(g, 'wall', x, ground(x, z) + q / 2 - .01, z, (F() - .5) * .3, F() * 3, (F() - .5) * .3); lying.push({ x: +x.toFixed(3), y: +ground(x, z).toFixed(3), z: +z.toFixed(3), what: 'stone' }); }
  // the hatch: a kerb of dressed stone round a 1.2 by 1.0 m mouth, flush with the floor; two oak leaves on strap hinges, a hasp, the chain, the padlock
  const ky = FY, kerb = []; { const KW = .2; for (const [w, d, x, z] of [[HW + 2 * KW, KW, HX, HZ - HD / 2 - KW / 2], [HW + 2 * KW, KW, HX, HZ + HD / 2 + KW / 2], [KW, HD, HX - HW / 2 - KW / 2, HZ], [KW, HD, HX + HW / 2 + KW / 2, HZ]]) put(new THREE.BoxGeometry(w, .3, d), 'dress', x, ky + .03 - .15, z);
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) kerb.push([+(HX + sx * (HW / 2 + KW)).toFixed(3), +(ky + .03).toFixed(3), +(HZ + sz * (HD / 2 + KW)).toFixed(3)]); }
  const LT = ky + .03 + .045; for (const sx of [-1, 1]) { const x = HX + sx * HW / 4; for (let p = 0; p < 4; p++) put(new THREE.BoxGeometry(HW / 8 - .008, .045, HD + .06), 'oak', HX + sx * HW / 8 * (p + .5), LT - .0225, HZ, 0, 0, (F() - .5) * .01);
    for (const sz of [-.3, .3]) put(new THREE.BoxGeometry(HW / 2 - .1, .012, .06), 'iron', HX + sx * (HW / 2 - (HW / 2 - .1) / 2 - .02), LT + .006, HZ + sz) /* the strap hinges, from the kerb's ends over each leaf */; }
  { const x = HX, z = HZ + .05; put(new THREE.BoxGeometry(.22, .014, .06), 'iron', x, LT + .007, z); rod('iron', [x - .02, LT + .03, z], [x + .02, LT + .03, z], .012, 5); }
  const hasp = [HX, +(LT + .03).toFixed(3), +(HZ + .05).toFixed(3)];
  { const pts = []; for (let k = 0; k < 19; k++) { const t = k / 18, x = HX - .55 + 1.1 * t, y = LT + .012 + .02 * Math.sin(t * Math.PI), z = HZ + .05 + .03 * Math.sin(t * 5 + ph[5]); pts.push([x, y, z]); }
    for (let k = 0; k < pts.length; k++) { const tor = new THREE.TorusGeometry(.034, .007, 4, 8); tor.scale(1.25, 1, 1); put(tor, 'bright', pts[k][0], pts[k][1], pts[k][2], k % 2 ? Math.PI / 2 : 0, 0, 0); }
    for (const sx of [-1, 1]) { const e = [HX + sx * .55, LT + .01, HZ + .05]; put(new THREE.TorusGeometry(.03, .008, 4, 8), 'iron', e[0], e[1] + .02, e[2], Math.PI / 2); } } /* the chain across both leaves to staples in the kerb */
  const lock = [HX + .01, +(LT + .06).toFixed(3), +(HZ + .05).toFixed(3)]; put(new THREE.BoxGeometry(.075, .08, .03), 'bright', lock[0], lock[1], lock[2], -1.2); put(new THREE.TorusGeometry(.024, .007, 4, 10, Math.PI), 'bright', lock[0], lock[1] + .045 * Math.cos(1.2), lock[2] + .045 * Math.sin(1.2), -1.2);
  // the green: nettles in the footings, an elder in the east corner, a thorn by the lane; ash beyond
  for (let k = 0, n = 0; k < 2000 && n < 90; k++) { const x = X0 - 1 + F() * (X1 - X0 + 2), z = Z0 - 1 + F() * (Z1 - Z0 + 2); if (worn(x, z) || pathD(x, z) < .6 || (x < X0 + T + 1.2 && Math.abs(z) < .8)) continue; n++;
    const h = .4 + F() * .5; put(new THREE.ConeGeometry(.16 + F() * .1, h, 5), 'nettle', x, ground(x, z) + h / 2 - .02, z, (F() - .5) * .2, F() * 3); }
  const trees = [], bush = (x, z, s, k) => { const gy = ground(x, z); for (let c = 0; c < 3; c++) rod('bark', [x, gy - .1, z], [x + (F() - .5) * s, gy + s * .9, z + (F() - .5) * s], .05, 5, .6); for (let c = 0; c < 6; c++) put(new THREE.IcosahedronGeometry(s * (.35 + F() * .2), 0).scale(1.2, .8, 1.2), k, x + (F() - .5) * s * 1.2, gy + s * (.7 + F() * .6), z + (F() - .5) * s * 1.2, F(), F() * 3); trees.push({ x, z, h: +(s * 1.4).toFixed(2), kind: 'bush' }); };
  bush(X1 + 1.4, Z0 - .8, 2.4, 'leaf') /* the elder, grown against the east end */; bush(-4.6, RZ - RW / 2 - 1.2, 2.0, 'nettle');
  const tree = (x, z, h) => { const gy = ground(x, z), top = [x, gy + h * .5, z]; rod('bark', [x, gy - .3, z], top, .16 + h * .013, 7, .7);
    for (let l = 0; l < 5; l++) { const a = l * 1.3 + F(), L = 1.6 + F() * 1.4, e = [top[0] + Math.cos(a) * L, top[1] + .8 + l * .55 + F(), top[2] + Math.sin(a) * L]; rod('bark', [top[0], top[1] - .5 + l * .25, top[2]], e, .07, 5, .6);
      for (let c2 = 0; c2 < 3; c2++) put(new THREE.IcosahedronGeometry(.9 + F() * .6, 0).scale(1.15, .8, 1.15), 'leaf', e[0] + (F() - .5) * 1.6, e[1] + (F() - .4) * 1.2, e[2] + (F() - .5) * 1.6, F(), F() * 3); }
    trees.push({ x: +x.toFixed(2), z: +z.toFixed(2), h: +h.toFixed(2), kind: 'ash' }); };
  for (let k = 0, n = 0; k < 900 && n < 9; k++) { const x = -40 + F() * 80, z = -40 + F() * 46; if (inH(x, z, 6) || pathD(x, z) < 4 || trees.some(t => Math.hypot(t.x - x, t.z - z) < 9)) continue; n++; tree(x, z, 9 + F() * 4); }
  const group = new THREE.Group(); let tris = 0;
  for (const [k, gs] of B) { const g = mergeGeometries(gs, false); gs.forEach(x => x.dispose()); const m = new THREE.Mesh(g, M[k]); m.name = k; m.castShadow = !['turf', 'track', 'dark'].includes(k); m.receiveShadow = true; group.add(m); tris += g.attributes.position.count / 3; }
  return { group, tris: Math.round(tris), draws: group.children.length, own: group.children.length, top: +new THREE.Box3().setFromObject(group).max.y.toFixed(2), ground, floor: FY,
    house: { x0: X0, x1: X1, z0: Z0, z1: Z1, t: T, door: DOOR, gable: { x: GX, apex: +(FY + APEX).toFixed(2), stack: +(FY + STK + .1).toFixed(2) } },
    hatch: { x: HX, z: HZ, w: HW, d: HD, kerb, leaves: +LT.toFixed(3), hasp, lock }, stubs, lying, road: { z: RZ, w: RW }, paths, trees };
}

// ── the Gatelands' perched stone (Session 1031, card F8; OG-124's panel 6, "small mysteries with no marker: … an odd rock"). On a bare hill
// of limestone pavement, after the Burren and the Norber erratics, a boulder of a dark stone that is not the hill's sits on a pedestal of
// the pale limestone half a metre high: the ice left it, and the rain has since taken the pavement down all round except where the boulder
// kept it dry. It is odd to look at and nothing more is said: whether it is a lead is the quest writer's. Built at true size, a metre a
// unit, the hill rising to -z at 1 in 14, a green road along x at z 16:
//   - the pavement: clints of pale limestone in two sets of joints at 43° to the road, their tops the old surface, cut by grykes 0.12 to
//     0.24 m wide and about 0.9 m deep, with hart's-tongue ferns in them; it runs out into the turf at a ragged edge;
//   - the stone: a boulder about 3.4 by 2.4 by 2.6 m on a pedestal 0.45 to 0.6 m high, waisted, its flat top under the boulder's flat sole;
//     the boulder overhangs it 0.4 m or more all round, so the daylight shows under it; a smaller stranger lies on the clints nearby;
//   - the land: a lace wall of single limestone slabs across the hill above (daylight through it), hazel scrub grown up from the grykes to
//     the east, a hawthorn bent by the west wind on the turf below, ash by the road.
// -> { group, tris, draws, own, ground(x, z) (the turf and the grykes' floor), surf(x, z) (the pavement's old surface), stone { x, z, ry, top (the
//      pedestal's top), rx, rz (its half-widths), h (the boulder's height) }, other { x, z, y, r }, clints [{ x, z, y, u, v, w, d }], ja (the joints' angle),
//      wall { z, h }, road { z, w }, paths, trees, thorn { x, z, lean } }
export function gatelandsErratic(o = {}, r = stream('erratic')) {
  const std = (c, ro = .9, x = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: ro, ...x }); const MI = millMats();
  const M = { turf: MI.turf, track: mat('turfDry', { ns: 1.0, color: 0xa89878, rough: 1 }), gryke: std(0x1e2216, 1), clint: mat('rock', { ns: 1.4, color: 0xd2d0c8, rough: .95 }),
    erratic: mat('rock', { ns: 1.6, color: 0x9a8c7c, rough: .9 }), wall: mat('rock', { ns: 1.2, color: 0xc4c2ba, rough: .95 }), fern: std(0x3e6a2a, .7, { side: THREE.DoubleSide }),
    bark: std(0x5a5248, .95), leaf: std(0x8a8a3a, .85), haw: std(0x3a4624, .9), berry: std(0x9a2018, .6) };
  const B = new Map(), key = String(o.key || 'erratic'), F = stream(key + ':lie'), ph = Array.from({ length: 12 }, () => F() * 6.283), V3 = (x, y, z) => new THREE.Vector3(x, y, z);
  const put = (geo, k, x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0, uv = .5) => { const g = geo.index ? geo.toNonIndexed() : geo; for (const a of Object.keys(g.attributes)) if (!['position', 'normal'].includes(a)) g.deleteAttribute(a);
    if (!g.attributes.normal) g.computeVertexNormals(); g.applyMatrix4(new THREE.Matrix4().compose(V3(x, y, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(rx, ry, rz, 'YXZ')), V3(1, 1, 1))); worldUV(g, uv);
    if (!B.has(k)) B.set(k, []); B.get(k).push(g); return g; };
  const rod = (k, a, b, rad, seg = 6, taper = 1) => { const A = V3(...a), C = V3(...b), d = C.clone().sub(A), g = new THREE.CylinderGeometry(rad * taper, rad, d.length(), seg);
    g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(V3(0, 1, 0), d.clone().normalize())); g.translate((A.x + C.x) / 2, (A.y + C.y) / 2, (A.z + C.z) / 2); return put(g, k); };
  const sm = t => { t = Math.min(1, Math.max(0, t)); return t * t * (3 - 2 * t); };
  // the land: the pavement's old surface rising to -z at 1 in 14 with a roll; the pavement an irregular oval about the stone; the grykes' floor 0.9 m under it
  const RZ = 16, RW = 3.0, PX = 1, PZ = -3, PRX = 21, PRZ = 13.5, JA = .75, CA = Math.cos(JA), SA = Math.sin(JA), DROP = .9;
  const surf = (x, z) => -z / 14 + .18 * Math.sin(x * .09 + ph[0]) * Math.sin(z * .11 + ph[1]) + .05 * Math.sin(x * .31 + z * .27 + ph[2]);
  const mem = (x, z) => { const a = Math.atan2(z - PZ, x - PX); return 1 - Math.hypot((x - PX) / PRX, (z - PZ) / PRZ) + .08 * Math.sin(a * 3 + ph[3]) + .05 * Math.sin(a * 7 + ph[4]); };
  const roadY = x => surf(x, RZ) - .08, ground = (x, z) => { const m = mem(x, z), b = surf(x, z) - .08 - (DROP - .08) * sm((m - .06) / .06), rw = sm((RW / 2 + 1.0 - Math.abs(z - RZ)) / 1.0); return b + (roadY(x) - .04 * Math.min(1, Math.abs(z - RZ) / (RW / 2)) - b) * rw; };
  { const steps = (bands, end) => { const v = []; for (const [a, b, st] of bands) for (let q = a; q < b - 1e-6; q += st) v.push(+q.toFixed(2)); v.push(end); return v; };
    const gx = steps([[-160, -40, 24], [-40, -26, 2], [-26, 26, 1], [26, 40, 2], [40, 160, 24]], 160), gz = steps([[-160, -40, 24], [-40, -22, 2], [-22, 22, 1], [22, 40, 2], [40, 160, 24]], 160);
    const pos = [], NX = gx.length, I = { turf: [], track: [], gryke: [] }; for (const z of gz) for (const x of gx) pos.push(x, ground(x, z), z);
    for (let j = 0; j + 1 < gz.length; j++) for (let i = 0; i + 1 < NX; i++) { const a = j * NX + i, b = a + 1, c = a + NX, d = c + 1, cx = (gx[i] + gx[i + 1]) / 2, cz = (gz[j] + gz[j + 1]) / 2;
      I[Math.abs(cz - RZ) < RW / 2 + .1 ? 'track' : mem(cx, cz) > .085 ? 'gryke' : 'turf'].push(a, c, b, b, c, d); }
    for (const [k, idx] of Object.entries(I)) { const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals(); put(g, k, 0, 0, 0, 0, 0, 0, .35); } }
  // the clints: strips along the main joints (u) cut by cross joints (v) of their own; each a block 1 m deep whose top is the old surface,
  // a little domed (its edges 0.04 m lower), each at its own small offset; a gryke of 0.12 to 0.24 m between every two
  const clints = [], ferns = []; { const toX = (u, v) => u * CA - v * SA, toZ = (u, v) => u * SA + v * CA;
    for (let u = -36; u < 36;) { const uw = 1.0 + F() * 2.0, gu = .06 + F() * .06; for (let v = -36 + F() * 2; v < 36;) { const vw = .7 + F() * 2.2, gv = .06 + F() * .06;
        const cu = u + uw / 2, cv = v + vw / 2, cx = toX(cu, cv), cz = toZ(cu, cv), w = uw - 2 * gu, d = vw - 2 * gv, off = (F() - .5) * .06, tu = (F() - .5) * .05, tv = (F() - .5) * .05, rot = (F() - .5) * .08, ca = Math.cos(JA + rot), sa = Math.sin(JA + rot); v += vw;
        if (mem(cx, cz) < .02 || Math.abs(cz - RZ) < RW / 2 + 1.5) continue;
        const g = new THREE.BoxGeometry(w, 1, d, 2, 1, 2).toNonIndexed(); g.rotateY(-JA - rot); g.deleteAttribute('normal'); const P = g.attributes.position;
        for (let i = 0; i < P.count; i++) { const lx = P.getX(i), ly = P.getY(i), lz = P.getZ(i), x = cx + lx, z = cz + lz, lu = lx * ca + lz * sa, lv = -lx * sa + lz * ca, edge = Math.abs(Math.abs(lu) - w / 2) < .01 || Math.abs(Math.abs(lv) - d / 2) < .01;
          P.setXYZ(i, x, ly > 0 ? surf(x, z) + off + tu * lu / (w / 2) + tv * lv / (d / 2) - (edge ? .07 : 0) : surf(x, z) - 1.0, z); }
        put(g, 'clint'); clints.push({ x: +cx.toFixed(3), z: +cz.toFixed(3), y: +(surf(cx, cz) + off).toFixed(3), u: +cu.toFixed(3), v: +cv.toFixed(3), w: +w.toFixed(3), d: +d.toFixed(3), gu: +(2 * gu).toFixed(3), gv: +(2 * gv).toFixed(3) });
        if (F() < .35) ferns.push([toX(u + uw - gu, cv), toZ(u + uw - gu, cv)]); }
      u += uw; } }
  // the stone: a pedestal of the pavement's limestone, waisted, its flat top 0.45 to 0.6 m over the surface round it; on it the boulder, its sole flat
  const SX = 0, SZ = -2, SRY = .4 + F() * .5, PRX2 = 1.0 + F() * .15, PRZ2 = .78 + F() * .1, PH0 = .46 + F() * .04, RIM = Math.max(...Array.from({ length: 16 }, (_, k) => surf(SX + Math.cos(k * .3927) * 1.5, SZ + Math.sin(k * .3927) * 1.5))), PT = +(RIM + PH0).toFixed(3), PH = PT - surf(SX, SZ);
  { const g = new THREE.CylinderGeometry(1, 1, 1, 18, 6).toNonIndexed(); g.deleteAttribute('normal'); const P = g.attributes.position;
    for (let i = 0; i < P.count; i++) { const lx = P.getX(i), t = P.getY(i) + .5, lz = P.getZ(i), a = Math.atan2(lz, lx), s = Math.max(0, (t - 1 / 6) / (5 / 6)), rr = (1 + .07 * Math.sin(a * 5 + ph[5]) + .04 * Math.sin(a * 11 + ph[6])) * (1 - .17 * Math.sin(s * Math.PI));
      const ex = lx * PRX2 * rr, ez = lz * PRZ2 * rr, x = SX + ex * Math.cos(SRY) + ez * Math.sin(SRY), z = SZ - ex * Math.sin(SRY) + ez * Math.cos(SRY); P.setXYZ(i, x, t < 1 / 6 - 1e-4 ? PT - PH - 1.0 : PT - PH * (1 - s), z); }
    put(g, 'clint'); }
  const BRX = PRX2 + .62 + F() * .25, BRZ = PRZ2 + .6 + F() * .2, BH = 2.2 + F() * .4, SOLE = .62; let boulderTop = 0;
  { const g = new THREE.IcosahedronGeometry(1, 4); g.deleteAttribute('normal'); g.deleteAttribute('uv'); const P = g.attributes.position, D = V3(), ys = [];
    for (let i = 0; i < P.count; i++) { D.set(P.getX(i), P.getY(i), P.getZ(i)).normalize(); const n = 1 + .09 * Math.sin(D.x * 3.1 + ph[7]) * Math.sin(D.z * 2.7 + ph[8]) + .06 * Math.sin(D.y * 4.3 + D.x * 2 + ph[9]) + .025 * Math.sin(D.x * 9 + D.z * 8 + ph[10]);
      let y = D.y * n; y = Math.max(y, -SOLE); ys.push(y); P.setXYZ(i, D.x * n * BRX, y, D.z * n * BRZ); }
    const lo = Math.min(...ys), hi = Math.max(...ys), k = BH / (hi - lo);
    for (let i = 0; i < P.count; i++) { const ex = P.getX(i), ez = P.getZ(i), y = (P.getY(i) - lo) * k; P.setXYZ(i, SX + ex * Math.cos(SRY) + ez * Math.sin(SRY), PT + y, SZ - ex * Math.sin(SRY) + ez * Math.cos(SRY)); }
    boulderTop = PT + BH; const sg = mergeVertices(g); sg.computeVertexNormals(); put(sg, 'erratic', 0, 0, 0, 0, 0, 0, .4); }
  // a smaller stranger on the clints, and a few cobbles of the same dark stone
  const lump = (x, z, rx, ry, rz, k = 'erratic') => { const g = new THREE.IcosahedronGeometry(1, 2); g.deleteAttribute('normal'); g.deleteAttribute('uv'); const P = g.attributes.position, D = V3(), a = F() * 6.283;
    for (let i = 0; i < P.count; i++) { D.set(P.getX(i), P.getY(i), P.getZ(i)).normalize(); const n = 1 + .1 * Math.sin(D.x * 3 + a) * Math.sin(D.z * 3 - a); P.setXYZ(i, D.x * n * rx, Math.max(D.y * n, -.7) * ry, D.z * n * rz); }
    const y0 = surf(x, z) + .7 * ry - .05, sg = mergeVertices(g); sg.computeVertexNormals(); put(sg, k, x, y0, z, 0, a); return { x: +x.toFixed(2), z: +z.toFixed(2), y: +(y0 - .7 * ry).toFixed(3), r: Math.max(rx, rz) }; };
  const other = lump(SX + 6.5, SZ - 5.5, .62, .48, .5), lying = [other]; for (let k = 0; k < 3; k++) { const a = F() * 6.283, d = 4 + F() * 7; lying.push(lump(SX + Math.cos(a) * d, SZ + Math.sin(a) * d * .7, .2 + F() * .12, .16, .18 + F() * .1)); }
  // hart's-tongue in the grykes: tufts of strap leaves rising out of the slot
  for (const [x, z] of ferns.slice(0, 70)) { const y = surf(x, z) - .18, a0 = F() * 6.283; for (let b = 0; b < 5; b++) { const a = a0 + b * 1.256, L = .3 + F() * .15, g = new THREE.BoxGeometry(.045, .004, L); g.translate(0, 0, L / 2); put(g, 'fern', x, y, z, -.5 - F() * .4, a); } }
  // the lace wall: single slabs of limestone, stood edge-on and laid in courses with daylight between, across the hill above the stone
  const WZ = -15, wallH = [], WALL = []; {
    const top = x => 1.25 + .15 * Math.sin(x * .3 + ph[11]); for (let x0 = -32; x0 < 32; x0 += .5) wallH.push({ x: +(x0 + .25).toFixed(2), h: +top(x0 + .25).toFixed(2) });
    const wz = x => WZ + .4 * Math.sin(x * .07 + ph[3]), BIN = .05, bins = new Float32Array(Math.ceil(64 / BIN) + 2);
    for (let c = 0; c < 9; c++) { let x = -32 + (c % 2) * .2; while (x < 32) { const L = .3 + F() * .28, gap = .03 + F() * .1, xm = x + L / 2, i0 = Math.floor((x + 32) / BIN), i1 = Math.min(bins.length - 1, Math.floor((x + L + 32) / BIN));
        let y = 0; for (let k = i0; k <= i1; k++) y = Math.max(y, bins[k]); const h = Math.min(.18 + F() * .12, top(xm) - y);
        if (h > .08) { const b = surf(xm, wz(xm)) - .04; put(new THREE.BoxGeometry(L, h - .01, .16 + F() * .06), 'wall', xm, b + y + h / 2, wz(xm), (F() - .5) * .06, Math.atan(.4 * .07 * Math.cos(xm * .07 + ph[3])) * -1 + (F() - .5) * .08, (F() - .5) * .08); for (let k = i0; k <= i1; k++) bins[k] = y + h; WALL.push(1); }
        x += L + gap; } }
    for (let c = 0; c < 8; c++) for (let k = 0; k < bins.length - 1;) { const xk = -32 + k * BIN; if (xk > 31.9 || bins[k] >= top(xk) - .2) { k++; continue; }
      let e = k; while (e + 1 < bins.length - 1 && -32 + (e + 1) * BIN < 32 && bins[e + 1] < top(-32 + (e + 1) * BIN) - .2 && e - k < 10) e++;
      let y = 0; for (let q = k; q <= e; q++) y = Math.max(y, bins[q]); const L = (e - k + 1) * BIN - .02, xm = xk + (e - k + 1) * BIN / 2, h = Math.min(.14 + F() * .1, top(xm) - y);
      if (L >= .04 && h > .05) { const b = surf(xm, wz(xm)) - .04; put(new THREE.BoxGeometry(L, h - .01, .16 + F() * .06), 'wall', xm, b + y + h / 2, wz(xm), 0, Math.atan(.4 * .07 * Math.cos(xm * .07 + ph[3])) * -1, (F() - .5) * .06); for (let q = k; q <= e; q++) bins[q] = y + h; WALL.push(1); }
      k = e + 1; } }
  // the green: the hawthorn bent by the west wind, hazel up out of the grykes to the east, ash by the road
  const trees = [], bush = (x, z, s) => { const gy = surf(x, z) - .3; for (let c = 0; c < 4; c++) rod('bark', [x, gy, z], [x + (F() - .5) * s * .8, gy + s * .95, z + (F() - .5) * s * .8], .04, 5, .6);
    for (let c = 0; c < 6; c++) put(new THREE.IcosahedronGeometry(s * (.32 + F() * .18), 0).scale(1.2, .8, 1.2), 'leaf', x + (F() - .5) * s * 1.1, gy + s * (.65 + F() * .55), z + (F() - .5) * s * 1.1, F(), F() * 3); trees.push({ x: +x.toFixed(2), z: +z.toFixed(2), h: +(s * 1.3).toFixed(2), kind: 'hazel' }); };
  for (let k = 0, n = 0; k < 400 && n < 9; k++) { const x = 9 + F() * 11, z = -11 + F() * 11; if (mem(x, z) < .1 || trees.some(t => Math.hypot(t.x - x, t.z - z) < 2.2)) continue; n++; bush(x, z, 1.8 + F() * 1.2); }
  const TX = -6.5, TZ = 8.5, ty = ground(TX, TZ), lean = 2.6; { const top = [TX + lean, ty + 2.5, TZ + .2]; rod('bark', [TX, ty - .2, TZ], [TX + .8, ty + 1.3, TZ], .15, 7, .8); rod('bark', [TX + .8, ty + 1.3, TZ], top, .11, 6, .7);
    for (let l = 0; l < 6; l++) { const e = [top[0] + .4 + F() * 1.6, top[1] - .3 + F() * .7, top[2] + (F() - .5) * 2.2]; rod('bark', [top[0] - .6 + l * .15, top[1] - .5 + l * .1, top[2]], e, .045, 5, .6);
      for (let c = 0; c < 3; c++) { const p = [e[0] + (F() - .3) * 1.2, e[1] + (F() - .5) * .5, e[2] + (F() - .5) * 1.2]; put(new THREE.IcosahedronGeometry(.6 + F() * .3, 0).scale(1.5, .55, 1.2), 'haw', ...p, F() * .3, F() * 3);
        for (let q = 0; q < 4; q++) put(new THREE.IcosahedronGeometry(.035, 0), 'berry', p[0] + (F() - .5) * 1.1, p[1] - .15 + F() * .2, p[2] + (F() - .5) * .9); } }
    trees.push({ x: TX, z: TZ, h: +(top[1] + .4 - ty).toFixed(2), kind: 'hawthorn' }); }
  const tree = (x, z, h) => { const gy = ground(x, z), top = [x, gy + h * .5, z]; rod('bark', [x, gy - .3, z], top, .16 + h * .013, 7, .7);
    for (let l = 0; l < 5; l++) { const a = l * 1.3 + F(), L = 1.6 + F() * 1.4, e = [top[0] + Math.cos(a) * L, top[1] + .8 + l * .55 + F(), top[2] + Math.sin(a) * L]; rod('bark', [top[0], top[1] - .5 + l * .25, top[2]], e, .07, 5, .6);
      for (let c2 = 0; c2 < 3; c2++) put(new THREE.IcosahedronGeometry(.9 + F() * .6, 0).scale(1.15, .8, 1.15), 'leaf', e[0] + (F() - .5) * 1.6, e[1] + (F() - .4) * 1.2, e[2] + (F() - .5) * 1.6, F(), F() * 3); }
    trees.push({ x: +x.toFixed(2), z: +z.toFixed(2), h: +h.toFixed(2), kind: 'ash' }); };
  for (let k = 0, n = 0; k < 900 && n < 5; k++) { const x = -45 + F() * 90, z = RZ + 3 + F() * 14; if (Math.abs(x) < 8 || trees.some(t => Math.hypot(t.x - x, t.z - z) < 10)) continue; n++; tree(x, z, 8 + F() * 4); }
  const paths = [[[2.5, RZ], [2.2, 10], [1.8, 5], [1.4, SZ + BRZ + 1.6]], Array.from({ length: 13 }, (_, i) => { const a = Math.PI / 2 + i / 12 * Math.PI * 2; return [+(SX + Math.cos(a) * (BRX + 1.2)).toFixed(2), +(SZ + Math.sin(a) * (BRX + 1.2)).toFixed(2)]; })];
  const group = new THREE.Group(); let tris = 0;
  for (const [k, gs] of B) { const g = mergeGeometries(gs, false); gs.forEach(x => x.dispose()); const m = new THREE.Mesh(g, M[k]); m.name = k; m.castShadow = !['turf', 'track', 'gryke'].includes(k); m.receiveShadow = true; group.add(m); tris += g.attributes.position.count / 3; }
  return { group, tris: Math.round(tris), draws: group.children.length, own: group.children.length, top: +new THREE.Box3().setFromObject(group).max.y.toFixed(2), ground, surf, mem,
    stone: { x: SX, z: SZ, ry: SRY, top: PT, rx: PRX2, rz: PRZ2, brx: BRX, brz: BRZ, h: BH, crown: +boulderTop.toFixed(3) }, other, lying, clints, ja: JA, wall: { z: WZ, h: wallH, n: WALL.length }, road: { z: RZ, w: RW }, paths, trees, thorn: { x: TX, z: TZ, lean } };
}

// ── the Mark's unfinished camp (Session 1032, card F8; OG-124's panel 6, "small mysteries with no marker: … an unfinished camp"). Someone
// stopped in a spruce clearing by the road and began to make camp, and never finished: the tent's back pole is up with the ridge pole
// leaned on it and the canvas still rolled at its foot, the fire is laid and never lit, the sledge half unloaded, the axe left in the
// chopping round. Snow has fallen on all of it since, and there is no track in it, in or out. Who, and why they stopped, is the quest
// writer's: the place only shows that nobody came back. Built at true size, a metre a unit, the ground rising to -z at 1 in 25, the road
// along x at z 12 under the same snow:
//   - the tent: a ridge tent's back pole (1.9 m) stood and guyed; its ridge pole (2.6 m) leaned from the pole's top to the ground; the front
//     pole lying beside; the canvas rolled at the back pole's foot, the pegs and a mallet laid out, a bedroll half unrolled;
//   - the fire: a ring of stones with a cone of kindling laid on birch bark, unlit; a kettle standing by it;
//   - the sledge: a pulk with its load lashed under a cover, its shafts down on the snow, one sack taken off; the chopping round with the
//     axe in it, a few billets split and a heap of brush gathered;
//   - snow over everything, 2 to 6 cm on what lies out, and spruce standing round from 9 m out.
// -> { group, tris, draws, own, ground(x, z), tent { pole [x, y, z] (its top), ridge [[x, y, z], [x, y, z]] (top and foot), bundle { x, z, r } },
//      fire { x, z, tip [x, y, z] }, capped [{ x, z, top, what }], lying [{ x, y, z, what }], road { z, w, d }, paths, trees }
export function markUnfinishedCamp(o = {}, r = stream('unfinished')) {
  const std = (c, ro = .9, x = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: ro, ...x }); millMats();
  const M = { snowfield: mat('plaster', { ns: .3, color: 0xf2f6fa, rough: .95 }), snow: mat('plaster', { ns: .2, color: 0xf6f8fc, rough: .95 }), pole: std(0x9a7a56, .85),
    canvas: mat('plaster', { ns: .5, color: 0xc8b890, rough: .95 }), wood: std(0xb89a72, .9), bark: std(0x4a3a30, .95), birch: std(0xe8e2d4, .8), needle: std(0x2a3a2a, .9), stone: std(0x8e8a84, 1),
    iron: std(0x2a2826, .5, { metalness: .6 }), sled: std(0x7a5634, .8), cover: std(0x8a7656, .95), wool: std(0x7a2a22, .95) };
  const B = new Map(), key = String(o.key || 'unfinished'), F = stream(key + ':lie'), ph = Array.from({ length: 8 }, () => F() * 6.283), V3 = (x, y, z) => new THREE.Vector3(x, y, z);
  const put = (geo, k, x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0, uv = .5) => { const g = geo.index ? geo.toNonIndexed() : geo; for (const a of Object.keys(g.attributes)) if (!['position', 'normal'].includes(a)) g.deleteAttribute(a);
    if (!g.attributes.normal) g.computeVertexNormals(); g.applyMatrix4(new THREE.Matrix4().compose(V3(x, y, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(rx, ry, rz, 'YXZ')), V3(1, 1, 1))); worldUV(g, uv);
    if (!B.has(k)) B.set(k, []); B.get(k).push(g); return g; };
  const rod = (k, a, b, rad, seg = 6, taper = 1) => { const A = V3(...a), C = V3(...b), d = C.clone().sub(A), g = new THREE.CylinderGeometry(rad * taper, rad, d.length(), seg);
    g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(V3(0, 1, 0), d.clone().normalize())); g.translate((A.x + C.x) / 2, (A.y + C.y) / 2, (A.z + C.z) / 2); return put(g, k); };
  const sm = t => { t = Math.min(1, Math.max(0, t)); return t * t * (3 - 2 * t); };
  // the land: snow over a gentle slope with a soft roll; the road a shallow trough under the same snow
  const RZ = 12, RW = 3.2, RD = .1, base = (x, z) => -z / 25 + .12 * Math.sin(x * .19 + ph[0]) * Math.sin(z * .16 + ph[1]) + .03 * Math.sin(x * .7 + z * .6 + ph[2]);
  const ground = (x, z) => base(x, z) - RD * sm((RW / 2 + .6 - Math.abs(z - RZ)) / 1.2);
  { const steps = (bands, end) => { const v = []; for (const [a, b, st] of bands) for (let q = a; q < b - 1e-6; q += st) v.push(+q.toFixed(2)); v.push(end); return v; };
    const gx = steps([[-160, -40, 24], [-40, -12, 2], [-12, 12, .5], [12, 40, 2], [40, 160, 24]], 160), gz = steps([[-160, -40, 24], [-40, -10, 2], [-10, 15, .5], [15, 40, 2], [40, 160, 24]], 160);
    const pos = [], idx = [], NX = gx.length; for (const z of gz) for (const x of gx) pos.push(x, ground(x, z), z);
    for (let j = 0; j + 1 < gz.length; j++) for (let i = 0; i + 1 < NX; i++) { const a = j * NX + i, b = a + 1, c = a + NX, d = c + 1; idx.push(a, c, b, b, c, d); }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals(); put(g, 'snowfield', 0, 0, 0, 0, 0, 0, .35); }
  const capped = [], lying = [], gy = (x, z) => ground(x, z);
  const cap = (x, z, top, w, d, ry = 0, what = '') => { const t = .02 + F() * .04; put(new THREE.BoxGeometry(w, t, d), 'snow', x, top + t / 2 - .005, z, 0, ry); capped.push({ x: +x.toFixed(3), z: +z.toFixed(3), top: +(top + t - .005).toFixed(3), what }); };
  const roundCap = (x, z, top, rr, what = '') => { const t = .02 + F() * .04, g = new THREE.SphereGeometry(rr, 8, 3, 0, Math.PI * 2, 0, Math.PI / 2); g.scale(1, t / rr, 1); put(g, 'snow', x, top - .005, z); capped.push({ x: +x.toFixed(3), z: +z.toFixed(3), top: +(top + t - .005).toFixed(3), what }); };
  // the tent: the back pole stood and guyed behind; the ridge pole leaned from its top to the ground in front; the front pole lying beside
  const TX = -1.8, TZ = -1.6, PH = 1.9, RL = 2.6, pb = [TX, gy(TX, TZ - 1.3), TZ - 1.3], top = [pb[0], pb[1] + PH, pb[2]];
  rod('pole', [pb[0], pb[1] - .25, pb[2]], top, .03, 6); roundCap(top[0], top[2], top[1] + .03, .045, 'pole');
  let fz = pb[2] + Math.sqrt(RL * RL - PH * PH); for (let k = 0; k < 4; k++) { const dy = top[1] - gy(TX, fz) - .025; fz = pb[2] + Math.sqrt(Math.max(.1, RL * RL - dy * dy)); }
  const foot = [TX, gy(TX, fz) + .025, fz]; rod('pole', top, foot, .028, 6); lying.push({ x: TX, y: +gy(TX, fz).toFixed(3), z: +fz.toFixed(3), what: 'ridge foot' });
  const peg = [TX, gy(TX, pb[2] - 1.5), pb[2] - 1.5]; rod('pole', [peg[0], peg[1] - .2, peg[2]], [peg[0], peg[1] + .1, peg[2]], .02, 5); rod('iron', [top[0], top[1] - .05, top[2]], [peg[0], peg[1] + .08, peg[2]], .004, 3) /* the guy */;
  { const x = TX + .7, z0 = TZ - .2, z1 = TZ + 1.7; rod('pole', [x, gy(x, z0) + .025, z0], [x, gy(x, z1) + .025, z1], .028, 6); lying.push({ x, y: +gy(x, (z0 + z1) / 2).toFixed(3), z: (z0 + z1) / 2, what: 'front pole' }); }
  const bundle = { x: TX - .55, z: pb[2] + .25, r: .2 }; { const y = gy(bundle.x, bundle.z) + bundle.r - .02; put(new THREE.CylinderGeometry(bundle.r, bundle.r, 1.1, 10), 'canvas', bundle.x, y, bundle.z, 0, .15, Math.PI / 2);
    for (const s of [-.35, .35]) put(new THREE.TorusGeometry(bundle.r + .005, .008, 3, 10), 'iron', bundle.x + s * Math.cos(.15), y, bundle.z - s * Math.sin(.15), 0, .15 + Math.PI / 2, 0);
    cap(bundle.x, bundle.z, y + bundle.r, 1.0, .18, .15, 'canvas'); lying.push({ x: bundle.x, y: +gy(bundle.x, bundle.z).toFixed(3), z: bundle.z, what: 'canvas' }); }
  for (let k = 0; k < 6; k++) { const x = TX - 1.2 + k * .14, z = TZ + .4; put(new THREE.BoxGeometry(.025, .025, .32), 'wood', x, gy(x, z) + .01, z, 0, (F() - .5) * .2); }
  { const x = TX - .4, z = TZ + .95, y = gy(x, z); rod('wood', [x - .2, y + .05, z], [x + .2, y + .05, z], .05, 8); rod('wood', [x, y + .02, z + .03], [x + .05, y + .03, z + .4], .015, 5); lying.push({ x, y: +y.toFixed(3), z, what: 'mallet' }); }
  { const x = TX + .1, z = TZ + .4, y = gy(x, z); put(new THREE.CylinderGeometry(.13, .13, .75, 10), 'wool', x - .55, y + .12, z, 0, 0, Math.PI / 2); put(new THREE.BoxGeometry(.75, .03, .9), 'wool', x - .55, y + .015, z + .55);
    cap(x - .55, z, y + .25, .7, .14, 0, 'bedroll'); lying.push({ x: x - .55, y: +y.toFixed(3), z: z + .55, what: 'bedroll' }); }
  // the fire: a ring of stones, birch bark under a cone of kindling, laid and never lit; the kettle by it
  const FX = .9, FZ = .9, fy = gy(FX, FZ); for (let k = 0; k < 9; k++) { const a = k / 9 * 6.283, s = .1 + F() * .04, x = FX + Math.cos(a) * .48, z = FZ + Math.sin(a) * .48; put(new THREE.IcosahedronGeometry(s, 0).scale(1.2, .75, 1), 'stone', x, gy(x, z) + s * .5, z, F(), F() * 3); roundCap(x, z, gy(x, z) + s * 1.2, s * .9, 'stone'); }
  for (let k = 0; k < 4; k++) put(new THREE.BoxGeometry(.12, .01, .08), 'birch', FX + (F() - .5) * .12, fy + .01, FZ + (F() - .5) * .12, 0, F() * 3);
  const tip = [FX, fy + .46, FZ]; for (let k = 0; k < 9; k++) { const a = k / 9 * 6.283 + F() * .2, x = FX + Math.cos(a) * .3, z = FZ + Math.sin(a) * .3; rod('wood', [x, fy, z], [tip[0] + Math.cos(a) * .02, tip[1], tip[2] + Math.sin(a) * .02], .018, 5); }
  { const g = new THREE.ConeGeometry(.09, .06, 7); put(g, 'snow', tip[0], tip[1] + .02, tip[2]); capped.push({ x: tip[0], z: tip[2], top: +(tip[1] + .05).toFixed(3), what: 'kindling' }); }
  { const x = FX + .85, z = FZ - .25, y = gy(x, z); put(new THREE.CylinderGeometry(.11, .14, .2, 10), 'iron', x, y + .1, z); rod('iron', [x - .11, y + .26, z], [x + .11, y + .26, z], .006, 4); roundCap(x, z, y + .2, .11, 'kettle'); capped[capped.length - 1].z = +(z + .06).toFixed(3) /* probed clear of the bail */; lying.push({ x, y: +y.toFixed(3), z, what: 'kettle' }); }
  // the sledge: a pulk, its load lashed under a cover, its shafts down on the snow forward; a sack taken off beside it
  const SX = 3.4, SZ = -1.2, SRY = .35; { const y = gy(SX, SZ), c = Math.cos(SRY), s = Math.sin(SRY), at = (u, v) => [SX + u * c + v * s, SZ - u * s + v * c];
    put(new THREE.BoxGeometry(1.7, .26, .58), 'sled', SX, y + .13, SZ, 0, SRY); { const [x, z] = at(.95, 0); put(new THREE.CylinderGeometry(.29, .29, .26, 10, 1, false, 0, Math.PI), 'sled', x, y + .13, z, 0, SRY - Math.PI / 2); }
    put(new THREE.BoxGeometry(1.3, .32, .5), 'cover', SX - .1 * c, y + .26 + .16, SZ + .1 * s, 0, SRY); for (const u of [-.4, 0, .4]) { const [x, z] = at(u - .1, 0); put(new THREE.BoxGeometry(.02, .34, .52), 'iron', x, y + .42, z, 0, SRY); }
    { const [x, z] = at(-.1, 0); cap(x, z, y + .58, 1.25, .46, SRY, 'load'); }
    for (const v of [-.22, .22]) { const a = at(1.15, v), b = at(2.9, v * 1.6); rod('pole', [a[0], y + .15, a[1]], [b[0], gy(b[0], b[1]) + .025, b[1]], .025, 5); }
    lying.push({ x: SX, y: +y.toFixed(3), z: SZ, what: 'pulk' });
    const [kx, kz] = at(-.2, .85), ky = gy(kx, kz); put(new THREE.SphereGeometry(.26, 10, 6).scale(1.3, .75, 1), 'cover', kx, ky + .17, kz, 0, F() * 3); roundCap(kx, kz, ky + .36, .2, 'sack'); lying.push({ x: kx, y: +ky.toFixed(3), z: kz, what: 'sack' }); }
  // the chopping round with the axe in it, billets split, a heap of brush gathered
  const CX = 2.2, CZ = 2.6, cy = gy(CX, CZ); put(new THREE.CylinderGeometry(.27, .29, .45, 12), 'wood', CX, cy + .22, CZ); cap(CX, CZ, cy + .45, .42, .42, 0, 'round'); capped[capped.length - 1].x = +(CX - .15).toFixed(3) /* clear of the axe */;
  rod('wood', [CX + .05, cy + .5, CZ], [CX + .42, cy + .88, CZ + .2], .018, 5); put(new THREE.BoxGeometry(.14, .1, .02), 'iron', CX + .02, cy + .47, CZ - .01, 0, .5, .8);
  for (let k = 0; k < 6; k++) { const x = CX - .7 + (k % 3) * .17, z = CZ + .35 + Math.floor(k / 3) * .14, h = .09; put(new THREE.BoxGeometry(.13, h, .4), 'wood', x, gy(x, z) + h / 2 + Math.floor(k / 3) * 0, z, 0, .1); }
  cap(CX - .53, CZ + .42, gy(CX - .53, CZ + .42) + .09, .5, .4, .1, 'billets');
  for (let k = 0; k < 18; k++) { const a = F() * 6.283, x = CX + 1.1 + (F() - .5) * .8, z = CZ - .6 + (F() - .5) * .6, L = .8 + F() * .6; rod('bark', [x, gy(x, z) + .03 + F() * .15, z], [x + Math.cos(a) * L, gy(x, z) + .05 + F() * .2, z + Math.sin(a) * L], .015, 4); }
  roundCap(CX + 1.1, CZ - .6, gy(CX + 1.1, CZ - .6) + .22, .5, 'brush');
  // the spruce round the clearing from 9 m out, clear of the road
  const trees = []; for (let k = 0, n = 0; k < 900 && n < 46; k++) { const a = F() * 6.283, d = 9 + Math.pow(F(), .8) * 34, x = Math.cos(a) * d, z = Math.sin(a) * d * .8 - 2; if (Math.abs(z - RZ) < RW / 2 + 2 || trees.some(t => Math.hypot(t.x - x, t.z - z) < 2.6)) continue; n++;
    const h = 8 + F() * 9, g0 = ground(x, z), w = h * (.22 + F() * .05); rod('bark', [x, g0 - .3, z], [x, g0 + h * .35, z], h * .016, 6);
    for (let t = 0; t < 6; t++) { const f = t / 6, y0 = g0 + h * (.16 + f * .76), th = h * (.28 - f * .05), rw = w * (1 - f * .8) * (.9 + F() * .2); put(new THREE.ConeGeometry(rw, th, 8, 1, true), 'needle', x, y0 + th / 2, z, 0, F() * 3);
      if (F() < .85) put(new THREE.ConeGeometry(rw * .62, th * .36, 7, 1, true), 'snow', x + (F() - .5) * rw * .2, y0 + th * .7 + .02, z + (F() - .5) * rw * .2, 0, F() * 3); } trees.push({ x: +x.toFixed(2), z: +z.toFixed(2), h: +h.toFixed(2) }); }
  const paths = [[[0, RZ], [.2, 6], [.3, 2.4], [-.3, .2]], [[-.3, .2], [1.0, -.9], [2.4, .4], [1.0, 2.0], [-.3, .2]]];
  const group = new THREE.Group(); let tris = 0;
  for (const [k, gs] of B) { const g = mergeGeometries(gs, false); gs.forEach(x => x.dispose()); const m = new THREE.Mesh(g, M[k]); m.name = k; m.castShadow = k !== 'snowfield'; m.receiveShadow = true; group.add(m); tris += g.attributes.position.count / 3; }
  return { group, tris: Math.round(tris), draws: group.children.length, own: group.children.length, top: +new THREE.Box3().setFromObject(group).max.y.toFixed(2), ground,
    tent: { pole: top.map(v => +v.toFixed(3)), ridge: [top.map(v => +v.toFixed(3)), foot.map(v => +v.toFixed(3))], bundle }, fire: { x: FX, z: FZ, tip: tip.map(v => +v.toFixed(3)) }, capped, lying, road: { z: RZ, w: RW, d: RD }, paths, trees };
}

// ── the Gatelands' ruined tower house (Session 1052, card F8; OG-121's "ruined forts and settlements: collapsed keeps with lower levels,
// some taken by bandits", and its lairs' "escape routes"). A lord's tower of the island's own kind, four storeys of rubble in a walled
// bawn, long abandoned: its south-east corner has fallen to the vault, the floors above are gone to their corbels and the sky shows through
// the windows. The stone vault over the ground floor still holds, and under it a band has made its camp; a stair in the floor goes down to
// the cellar where they keep what they take, and from the cellar a souterrain runs west under the bawn's wall to a pit in the slope behind
// a thorn. Who they are is the systems builder's and the quest writer's: the place shows only that someone holds it. A metre a unit, the
// bawn level at y 0, the gate on +z:
//   - the bawn: a rubble wall 0.9 m thick and 3.2 m high round a yard 30 by 25 m, a gateway of 3 m in its south side, a breach in its east
//     side; a round flanker at its south-west corner, standing to 5 m; inside, a lean-to of poles and hides against the west wall, a cart
//     with a broken wheel, a fighting platform by the gate with its ladder, a hurdle dragged aside from the gateway;
//   - the tower: 11 by 8.5 m outside, walls 1.5 m thick, 16 m to its ragged head on the north and the west, fallen to 6.6 m over the
//     south-east corner, its stones heaped below; a round-headed door of 1.2 by 2.6 m in dressed stone on the south, slits to the ground
//     floor, windows to the three storeys above, the corbels of the lost floors;
//   - the ground floor: 8 by 5.5 m under a barrel vault springing at 3 m to 5.75 m, flagged at 0.1; the camp: three pallets of straw, a fire
//     on the flags with a pot on its tripod, a table of boards on two kegs with a bench, a rack of spears and a bow, plunder in the corner;
//     the stair's well in the floor along the north wall, 4.7 by 1.3 m, a low parapet on its open side;
//   - the stair: 16 rises of 0.194 m on treads of 0.28 m, 1.3 m wide, west from the floor (0.1) down to the cellar (-3.0);
//   - the cellar: the tower's whole floor again under its flags and two beams (2.25 m clear under them); the store: crates, kegs, sacks and
//     a strongbox;
//   - the souterrain: a drystone passage 1.4 m wide and 2.2 m high under lintels, out through the cellar's west wall at z -5 and 16.6 m
//     west, under the bawn's wall, to its own stair up a stone-lined pit in the slope 5 m outside the bawn, a thorn over it and its cover
//     slab dragged aside.
//   o.held (default true): the band is there, the fire burning and the lanterns lit; false, the camp is cold and dark.
//   -> { group, tris, draws, own, top, ground(x, z), path ([x, y, z, kind]: kind 's' a stair or a step, 'g' on the land), held, lamps
//        ([x, y, z]), fire [x, y, z] | null, tower { x0, x1, z0, z1, t, high, fallen, door { x, w, h } }, hall { x0, x1, z0, z1, floor,
//        spring, crown }, well { x0, x1, z0, z1 }, stair { n, rise, run, x0, x1, z, top, bottom }, cellar { floor, ceil, beam },
//        souterrain { z, w, h, x0, x1, floor }, exit { x0, x1, n, rise, run, top }, bawn { x0, x1, z0, z1, t, gate { x, w }, breach } }
export function gatelandsTowerHouse(o = {}, r = stream('towerhouse')) {
  const std = (c, ro = .9) => new THREE.MeshStandardMaterial({ color: c, roughness: ro }), held = o.held !== false, key = String(o.key || 'towerhouse');
  const M = { ...lairMats(), ...abbeyMats(), straw: mat('thatch', { ns: .7, color: 0xc8b07a, rough: 1 }), blanket: std(0x6a4a3a, 1), hide: std(0x6a5038, .95), char: std(0x1a1614, 1), vault: abbeyMats().tower, tower: mat('cobble', { ns: 1.3, color: 0xdcd8cc, rough: .95 }), sack: std(0xa89a7c, 1) };
  const B = new Map(), V = (x, y) => new THREE.Vector2(x, y);
  const put = (geo, k, x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0, uv = .5) => { const g = geo.index ? geo.toNonIndexed() : geo; for (const a of Object.keys(g.attributes)) if (!['position', 'normal'].includes(a)) g.deleteAttribute(a);
    if (!g.attributes.normal) g.computeVertexNormals();
    g.applyMatrix4(new THREE.Matrix4().compose(new THREE.Vector3(x, y, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(rx, ry, rz, 'YXZ')), new THREE.Vector3(1, 1, 1))); worldUV(g, uv);
    if (!B.has(k)) B.set(k, []); B.get(k).push(g); };
  const bx = (k, x0, x1, y0, y1, z0, z1, uv = .5) => put(new THREE.BoxGeometry(x1 - x0, y1 - y0, z1 - z0), k, (x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2, 0, 0, 0, uv);
  const rod = (k, a, b, rad, seg = 6) => { const A = new THREE.Vector3(...a), Bv = new THREE.Vector3(...b), d = Bv.clone().sub(A), g = new THREE.CylinderGeometry(rad, rad, d.length(), seg); g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.clone().normalize())); const m = A.add(Bv).multiplyScalar(.5); put(g, k, m.x, m.y, m.z); };
  const ph = Array.from({ length: 12 }, () => r() * 9), rag = (u, s = 1) => s * (.12 * Math.sin(u * 2.3 + ph[0]) + .08 * Math.sin(u * 5.1 + ph[1]) + .05 * Math.sin(u * 11.7 + ph[2]));
  const sm = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
  // the plan: the tower's outside (X0..X1, Z0..Z1), its walls T thick; the hall's floor FL; the souterrain along z SZ at the cellar's floor CF
  const X0 = -5.5, X1 = 5.5, Z0 = -10.25, Z1 = -1.75, T = 1.5, IX0 = X0 + T, IX1 = X1 - T, IZ0 = Z0 + T, IZ1 = Z1 - T, FL = .1, VS = 3.0, VR = (IZ1 - IZ0) / 2, VZ = (IZ0 + IZ1) / 2, FY1 = 6.3;
  const CF = -3.0, CC = -.5, SZ = -5.0, SW = .7, SH = 2.2, SX1 = -20.6, BX = 15, BZ0 = -13, BZ1 = 12, BT = .9, GX = 1.5, GW = 3.0;
  // the land: level over the bawn and 4.5 m round it, then falling away and lumpy; holes left for the tower's floor and the souterrain's pit
  const F = field(stream(key + ':land'), .5), RX0 = -BX - 4.5, RX1 = BX + 4.5, RZ0 = BZ0 - 4.5, RZ1 = BZ1 + 4.5;
  const ground = (x, z) => { const dx = Math.max(RX0 - x, 0, x - RX1), dz = Math.max(RZ0 - z, 0, z - RZ1), d = Math.hypot(dx, dz); if (d <= 0) return 0; return -d * .12 + F(x, 0, z)[1] * Math.min(1, d / 8) * 1.4; };
  const PX0 = -25, PX1 = -20, PZ0 = SZ - 1, PZ1 = SZ + 1;
  { const S = 1, N = 110, O = -55, pos = [], idx = [];
    for (let j = 0; j <= N; j++) for (let i = 0; i <= N; i++) { const x = O + i * S, z = O + j * S; pos.push(x, ground(x, z), z); }
    const hole = (x0, z0, X0_, X1_, Z0_, Z1_) => x0 >= X0_ - 1e-6 && x0 + S <= X1_ + 1e-6 && z0 >= Z0_ - 1e-6 && z0 + S <= Z1_ + 1e-6;
    for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) { const x0 = O + i * S, z0 = O + j * S; if (hole(x0, z0, X0, X1, Z0, Z1) || hole(x0, z0, PX0, PX1, PZ0, PZ1)) continue; const a = j * (N + 1) + i, b = a + 1, c = a + N + 1, d = c + 1; idx.push(a, c, b, b, c, d); }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals(); put(g, 'turf', 0, 0, 0, 0, 0, 0, .5); }
  // a wall of rubble, as the abbey's: its face in (u, y), u from 0 to L, its head top(u), T thick about z, at (x, z) turned ry (0 along +x,
  // -pi/2 along +z); holes whose head would stand within 0.4 m of the wall's head are left out (the wall has fallen through them)
  const archHole = (uc, w, sill, spring) => { const h = [V(uc - w / 2, sill), V(uc + w / 2, sill)]; for (let s = 0; s <= 12; s++) { const a = s / 12 * Math.PI; h.push(V(uc + Math.cos(a) * w / 2, spring + Math.sin(a) * w / 2)); } return { p: new THREE.Path(h), u: uc, top: spring + w / 2 }; };
  const rectHole = (uc, w, sill, h) => ({ p: new THREE.Path([V(uc - w / 2, sill), V(uc + w / 2, sill), V(uc + w / 2, sill + h), V(uc - w / 2, sill + h)]), u: uc, top: sill + h, w });
  const wall = (L, Tk, top, holes, k, x, z, ry, y0 = -.5) => { const pts = [V(0, y0), V(L, y0)], n = Math.max(2, Math.ceil(L / .3)); for (let s = n; s >= 0; s--) { const u = L * s / n; pts.push(V(u, top(u))); }
    const sh = new THREE.Shape(pts); for (const h of holes) if (Math.min(top(h.u - (h.w || .6) / 2 - .2), top(h.u), top(h.u + (h.w || .6) / 2 + .2)) > h.top + .4) sh.holes.push(h.p);
    const g = new THREE.ExtrudeGeometry(sh, { depth: Tk, bevelEnabled: false, curveSegments: 12 }); g.translate(0, 0, -Tk / 2); put(g, k, x, 0, z, 0, ry, 0, .8); };
  const dressArch = (x, z, ry, w, sill, spring, Tk) => { const sh = new THREE.Shape(), R = w / 2; sh.absarc(0, spring, R + .28, 0, Math.PI, false); sh.absarc(0, spring, R, Math.PI, 0, true);
    const g = new THREE.ExtrudeGeometry(sh, { depth: Tk + .06, bevelEnabled: false, curveSegments: 16 }); g.translate(0, 0, -(Tk + .06) / 2); put(g, 'dress', x, 0, z, 0, ry, 0, .5);
    for (const e of [-1, 1]) { const j = new THREE.BoxGeometry(.28, spring - sill, Tk + .06); j.translate(e * (R + .14), (sill + spring) / 2, 0); put(j, 'dress', x, 0, z, 0, ry, 0, .5); } };
  const stone = (x, y, z, s, k = 'rubble') => put(roughen(new RoundedBoxGeometry(s * (1 + r() * .6), s * (.5 + r() * .3), s * (.7 + r() * .4), 2, s * .12), r, s * .06, 2), k, x, y + s * .2, z, (r() - .5) * .5, r() * 3, (r() - .5) * .5);
  // the tower's walls: north and south the full 11 m, east and west between them; the south-east corner fallen to just over the vault
  const HI = 16.0, FALL = 6.6, fallS = u => sm(5.2, 8.6, u) * (HI - .4 - FALL + rag(u * 2.7 + 5, 1.6)), fallE = u => sm(1.6, 4.4, u) * (HI - .8 - FALL + rag(u * 2.9 + 1, 1.6));
  const winds = (L, us) => us.flatMap(u => [rectHole(u, .7, 7.0, 1.25), rectHole(u, .7, 10.2, 1.25), rectHole(u, .6, 13.3, 1.1)]);
  const DX = 1.5, DW = 1.2, DSP = 2.0;
  wall(X1 - X0, T, u => HI - .4 + rag(u + 3) - fallS(u), [archHole(DX - X0, DW, 0, DSP), archHole(3.0, .22, 1.0, 1.9), ...winds(X1 - X0, [3.0, 7.6])], 'tower', X0, Z1 - T / 2, 0) /* the south wall and its door */;
  dressArch(DX, Z1 - T / 2, 0, DW, 0, DSP, T); bx('dress', DX - DW / 2, DX + DW / 2, -.2, FL, Z1 - T, Z1) /* the threshold */;
  wall(X1 - X0, T, u => HI + rag(u + 9), [archHole(5.5, .22, 1.0, 1.9), ...winds(X1 - X0, [3.4, 7.8])], 'tower', X0, Z0 + T / 2, 0) /* the north wall */;
  wall(IZ1 - IZ0, T, u => HI - .2 + rag(u + 13), [archHole(2.75, .22, 1.0, 1.9), ...winds(IZ1 - IZ0, [2.75])], 'tower', X0 + T / 2, IZ0, -Math.PI / 2) /* the west wall */;
  wall(IZ1 - IZ0, T, u => HI - .8 + rag(u + 17) - fallE(u), winds(IZ1 - IZ0, [1.6]), 'tower', X1 - T / 2, IZ0, -Math.PI / 2) /* the east wall */;
  // the vault over the hall: the spandrels and the first floor's bed as one solid, its soffit a half round across the hall's width
  { const sh = new THREE.Shape(); sh.moveTo(-VR, VS); sh.lineTo(-VR, FY1); sh.lineTo(VR, FY1); sh.lineTo(VR, VS); sh.absarc(0, VS, VR, 0, Math.PI, false);
    const g = new THREE.ExtrudeGeometry(sh, { depth: IX1 - IX0, bevelEnabled: false, curveSegments: 28 }); g.translate(0, 0, -(IX1 - IX0) / 2); put(g, 'vault', 0, 0, VZ, 0, Math.PI / 2, 0, .6);
    bx('turf', IX0, IX1, FY1, FY1 + .12, IZ0, IZ1); for (let k = 0; k < 16; k++) stone(IX0 + .6 + r() * (IX1 - IX0 - 1.2), FY1 + .1, IZ0 + .5 + r() * (IZ1 - IZ0 - 1), .35 + r() * .3, 'tower'); }
  // the corbels of the lost floors, along the north and the south walls inside, where the wall still stands over them
  for (const y of [9.6, 12.7]) for (let x = IX0 + .6; x < IX1 - .3; x += 1.3) for (const [z, f] of [[IZ0, 0], [IZ1, 1]]) { if (f && HI - .4 - fallS(x - X0) < y + .6) continue; bx('tower', x - .17, x + .17, y - .3, y, f ? z - .4 : z, f ? z : z + .4); }
  // the hall's floor: flags on the cellar's ceiling, the stair's well left open along the north wall, a parapet on its open side
  const WX0 = IX0 + .2, WX1 = .9, WZ0 = IZ0, WZ1 = IZ0 + 1.3;
  bx('flag', IX0, IX1, CC, FL, WZ1, IZ1); bx('flag', WX1, IX1, CC, FL, IZ0, WZ1); bx('flag', IX0, WX0, CC, FL, IZ0, WZ1);
  bx('dress', WX0, WX1, FL, FL + .85, WZ1, WZ1 + .25);
  // the stair: 16 rises, the treads solid to the cellar's floor
  const NR = 16, RISE = (FL - CF) / NR, RUN = .28, SZc = (WZ0 + WZ1) / 2;
  for (let k = 1; k < NR; k++) bx('flag', WX1 - k * RUN, WX1 - (k - 1) * RUN, CF, FL - k * RISE, WZ0, WZ1);
  // the cellar: its floor, its walls round the tower's footprint (the west one broken through to the souterrain), two beams under the flags
  bx('flag', IX0, IX1, CF - .3, CF, IZ0, IZ1); bx('dry', X0, X1, CF - .3, CC, Z0, IZ0); bx('dry', X0, X1, CF - .3, CC, IZ1, Z1); bx('dry', IX1, X1, CF - .3, CC, IZ0, IZ1);
  bx('dry', X0, IX0, CF - .3, CC, IZ0, SZ - SW); bx('dry', X0, IX0, CF - .3, CC, SZ + SW, IZ1); bx('dry', X0, IX0, CF + SH, CC, SZ - SW, SZ + SW);
  const BEAM = CC - .25; for (const x of [2.0, 3.4]) bx('timber', x - .13, x + .13, BEAM, CC, IZ0, IZ1);
  // the souterrain: drystone sides, lintels over, a flagged floor, from the cellar's wall to the pit
  bx('flag', SX1, IX0, CF - .3, CF, SZ - SW, SZ + SW);
  for (const e of [-1, 1]) bx('dry', SX1, X0, CF - .3, CF + SH + .2, SZ + e * SW, SZ + e * (SW + .5), .45);
  for (let x = X0; x > SX1 + .01; x -= .6) bx('boulder', Math.max(SX1, x - .62), x, CF + SH, CF + SH + .2, SZ - SW - .5, SZ + SW + .5);
  // the pit: the souterrain's own stair up to a landing at the land's height, lined to 0.25 m over the land, a head wall over the lintels
  const EY = ground(PX0, SZ), ER = EY - CF, EN = Math.ceil(ER / .2), ERISE = ER / EN, EX1 = SX1 - (EN - 1) * RUN, EX0 = PX0;
  for (let k = 1; k < EN; k++) bx('flag', SX1 - k * RUN, SX1 - (k - 1) * RUN, CF - .3, CF + k * ERISE, SZ - SW, SZ + SW);
  bx('flag', EX0, EX1, CF - .3, EY, SZ - SW, SZ + SW);
  for (const e of [-1, 1]) wall(SX1 - EX0, .6, u => ground(EX0 + u, SZ + e * (SW + .6)) + .25, [], 'dry', EX0, SZ + e * (SW + .3), 0, CF - .3);
  bx('dry', SX1, PX1 + .3, CF + SH, Math.max(ground(SX1, SZ), ground(PX1 + .3, SZ)) + .25, SZ - SW - .6, SZ + SW + .6);
  put(new THREE.BoxGeometry(1.5, .14, 1.1), 'boulder', EX1 - .6, ground(EX1 - .6, SZ + 2.0) + .2, SZ + 2.0, .18, .4, .1) /* the cover slab, dragged aside */;
  // the bawn: four walls of rubble, the gateway in the south, a breach in the east; a round flanker at the south-west corner
  const BH = 3.2, BRK = [-1.5, 2.5], brk = u => { const c = (BRK[0] + BRK[1]) / 2 - BZ0, w = (BRK[1] - BRK[0]) / 2; return Math.max(0, 1 - (Math.abs(u - c) / w) ** 2) ** .5 * (BH - .5 + rag(u * 3, 1.5)); };
  wall(2 * (BX + BT), BT, u => BH + rag(u + 21), [], 'rubble', -BX - BT, BZ0 - BT / 2, 0);
  wall(GX - GW / 2 + BX + BT, BT, u => BH + rag(u + 25) + (u > GX - GW / 2 + BX + BT - 1 ? .4 : 0), [], 'rubble', -BX - BT, BZ1 + BT / 2, 0);
  wall(BX + BT - GX - GW / 2, BT, u => BH + rag(u + 29) + (u < 1 ? .4 : 0), [], 'rubble', GX + GW / 2, BZ1 + BT / 2, 0);
  wall(BZ1 - BZ0, BT, u => BH + rag(u + 33), [], 'rubble', -BX - BT / 2, BZ0, -Math.PI / 2);
  wall(BZ1 - BZ0, BT, u => BH + rag(u + 37) - brk(u), [], 'rubble', BX + BT / 2, BZ0, -Math.PI / 2);
  for (let k = 0; k < 22; k++) { const z = BRK[0] + r() * (BRK[1] - BRK[0]), x = BX + BT / 2 + (r() > .5 ? 1 : -1) * (.8 + r() * 2.4); stone(x, ground(x, z), z, .3 + r() * .25); }
  { const cx = -BX - BT / 2, cz = BZ1 + BT / 2, ro = 2.6, ri = 1.6, N = 48, pos = [], P = (rr, a, y) => [cx + Math.sin(a) * rr, y, cz + Math.cos(a) * rr], ring = [];
    for (let i = 0; i <= N; i++) { const a = i / N * Math.PI * 2, h = 5.0 + .35 * Math.sin(a * 3 + ph[7]) + rag(a * 4, 1.2); ring.push([P(ro, a, -.5), P(ro - .1, a, h), P(ri, a, h), P(ri, a, -.5)]); }
    const tri = (a, b, c) => pos.push(...a, ...b, ...c), quad = (a, b, c, d) => { tri(a, b, c); tri(a, c, d); };
    for (let i = 0; i < N; i++) { const [ob, ot, it, ib] = ring[i], [OB, OT, IT, IB] = ring[i + 1]; quad(ob, OB, OT, ot); quad(ot, OT, IT, it); quad(ib, it, IT, IB); }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.computeVertexNormals(); put(g, 'rubble', 0, 0, 0, 0, 0, 0, .55); }
  // the fallen corner's stones, heaped outside it and spilled toward the bawn's east wall
  for (let k = 0; k < 46; k++) { const a = r() * Math.PI * .5, d = Math.sqrt(r()) * 4.2, x = X1 + .2 + Math.cos(a) * d, z = Z1 + .2 + Math.sin(a) * d * .9 - .8, s = .3 + r() * .4; stone(x, Math.max(0, (4.2 - d) * .35 - .2), z, s, 'tower'); }
  // the camp in the hall: three pallets, the fire on the flags with its pot, a table on kegs and a bench, the rack, the plunder
  const pallet = (x, z, ry, y0 = FL) => { put(new THREE.BoxGeometry(.85, .14, 1.9), 'straw', x, y0 + .07, z, 0, ry); put(new THREE.BoxGeometry(.8, .05, 1.1), 'blanket', x + Math.sin(ry) * .35, y0 + .16, z + Math.cos(ry) * .35, 0, ry + .05); };
  pallet(IX0 + .45, SZ - .2, 0); pallet(-2.4, IZ1 - .45, Math.PI / 2); pallet(-.25, IZ1 - .45, Math.PI / 2 + .06);
  const FXp = -1.6, FZp = -5.7; for (let k = 0; k < 9; k++) { const a = k / 9 * Math.PI * 2; stone(FXp + Math.sin(a) * .5, FL - .08, FZp + Math.cos(a) * .5, .18, 'boulder'); }
  bx('char', FXp - .35, FXp + .35, FL, FL + .03, FZp - .35, FZp + .35);
  for (let k = 0; k < 5; k++) put(new THREE.CylinderGeometry(.045, .055, .7, 6).rotateZ(Math.PI / 2), held ? 'horn' : 'char', FXp, FL + .09, FZp, 0, k * 1.25, .12);
  if (held) for (let k = 0; k < 3; k++) put(new THREE.ConeGeometry(.12 - k * .025, .4 - k * .08, 6), 'flame', FXp + (k - 1) * .09, FL + .3, FZp + (k % 2 - .5) * .08, 0, k);
  for (let k = 0; k < 3; k++) { const a = k / 3 * Math.PI * 2; rod('iron', [FXp + Math.sin(a) * .55, FL, FZp + Math.cos(a) * .55], [FXp, FL + 1.0, FZp], .012, 4); }
  put(new THREE.SphereGeometry(.17, 10, 6, 0, Math.PI * 2, Math.PI * .35, Math.PI * .65), 'iron', FXp, FL + .55, FZp); rod('iron', [FXp, FL + .62, FZp], [FXp, FL + 1.0, FZp], .006, 3);
  const TXp = 2.95, TZp = -5.0; for (const dz of [-.6, .6]) put(new THREE.CylinderGeometry(.24, .21, .72, 10), 'keg', TXp, FL + .36, TZp + dz); bx('plank', TXp - .42, TXp + .42, FL + .72, FL + .78, TZp - 1.0, TZp + 1.0);
  bx('plank', TXp - .95, TXp - .65, FL + .4, FL + .45, TZp - .8, TZp + .8); for (const dz of [-.65, .65]) bx('timber', TXp - .88, TXp - .72, FL, FL + .4, TZp + dz - .06, TZp + dz + .06);
  bx('timber', IX1 - .25, IX1 - .1, FL + .9, FL + 1.0, -7.7, -6.1); for (let k = 0; k < 5; k++) { const z = -7.55 + k * .36; rod('timber', [IX1 - .55, FL, z], [IX1 - .08, FL + 2.0, z + .05], .018, 5); if (k < 4) put(new THREE.ConeGeometry(.035, .22, 4), 'iron', IX1 - .07, FL + 2.12, z + .05, 0, 0, -.23); }
  { const bow = new THREE.TorusGeometry(.75, .015, 4, 20, Math.PI * .8); put(bow, 'timber', IX1 - .12, FL + 1.25, -6.25, 0, Math.PI / 2, Math.PI * .1 - .2); }
  for (const [x, z, s] of [[3.4, -8.25, .6], [2.75, -8.3, .5], [3.45, -7.65, .45]]) put(new THREE.BoxGeometry(s, s * .8, s), 'crate', x, FL + s * .4, z, 0, r() * .4);
  put(new THREE.BoxGeometry(.55, .45, .38), 'crate', 3.3, FL + .48 + .23, -8.2, 0, .2); for (let k = 0; k < 3; k++) put(roughen(new THREE.SphereGeometry(.28, 8, 6).scale(.9, 1.4, .8), r, .03), 'sack', 2.45 + k * .32, FL + .36, -7.5 - (k % 2) * .25);
  // the lanterns, lit while the band is there: on a peg by the door inside, and in the cellar on its south wall by the stair's foot
  const lamps = [], lamp = (x, y, z, ry) => { bx('iron', x - .02, x + .02, y + .2, y + .24, z - .02, z + .02); put(new THREE.BoxGeometry(.15, .22, .15), held ? 'horn' : 'iron', x, y, z, 0, ry); put(new THREE.ConeGeometry(.11, .1, 4).rotateY(Math.PI / 4), 'iron', x, y + .16, z, 0, ry); if (held) lamps.push([x, y, z]); };
  lamp(.2, 2.05, IZ1 - .14, 0); lamp(-2.0, CF + 1.85, IZ1 - .14, 0); lamp(-12.5, CF + 1.95, SZ + SW - .14, 0) /* in the souterrain, halfway */;
  // the cellar's store: crates, kegs and sacks against the east wall, the strongbox
  for (const [x, z, s] of [[3.5, -8.3, .7], [3.55, -7.5, .6], [2.8, -8.35, .55], [3.5, -4.0, .65], [3.55, -3.75 - .7, .5]]) put(new THREE.BoxGeometry(s, s * .8, s), 'crate', x, CF + s * .4, z, 0, r() * .3);
  for (const [x, z] of [[3.5, -6.6], [3.5, -6.05], [2.9, -6.35]]) put(new THREE.CylinderGeometry(.26, .23, .75, 10), 'keg', x, CF + .375, z);
  for (let k = 0; k < 5; k++) put(roughen(new THREE.SphereGeometry(.3, 8, 6).scale(.9, 1.4, .8), r, .03), 'sack', 1.6 + (k % 3) * .55, CF + .4, -3.7 - Math.floor(k / 3) * .55);
  { const cx = 2.3, cz = -5.6; bx('keg', cx - .45, cx + .45, CF, CF + .45, cz - .3, cz + .3); put(new THREE.CylinderGeometry(.3, .3, .9, 12, 1, false, 0, Math.PI).rotateZ(Math.PI / 2), 'keg', cx, CF + .45, cz, 0, 0, 0);
    for (const dx of [-.3, .3]) bx('iron', cx + dx - .03, cx + dx + .03, CF, CF + .76, cz - .31, cz + .31); bx('iron', cx - .06, cx + .06, CF + .3, CF + .44, cz + .3, cz + .33); }
  // the bawn's yard: a lean-to of poles and hides against the west wall, a cart with a broken wheel, the fighting platform and its ladder,
  // the hurdle dragged from the gateway
  { const x0 = -BX, x1 = -BX + 2.6, z0 = 1, z1 = 5.6; for (const z of [z0, (z0 + z1) / 2, z1]) { rod('timber', [x1, 0, z], [x1, 1.8, z], .05); rod('timber', [x1 - .1, 1.8, z], [x0 + .05, 2.6, z], .04); }
    put(new THREE.BoxGeometry(Math.hypot(x1 - x0, .8) + .1, .04, z1 - z0 + .4), 'hide', (x0 + x1) / 2, 2.25, (z0 + z1) / 2, 0, 0, -Math.atan2(.8, x1 - x0)); pallet(x0 + 1.0, (z0 + z1) / 2, 0, 0); }
  { const cx = 9.5, cz = 4.5, cry = .5, rot = (u, w) => [cx + Math.cos(cry) * u + Math.sin(cry) * w, cz - Math.sin(cry) * u + Math.cos(cry) * w];
    put(new THREE.BoxGeometry(2.4, .12, 1.3), 'plank', cx, .72, cz, 0, cry, -.12); for (const w of [-.62, .62]) { const [x, z] = rot(0, w); put(new THREE.BoxGeometry(2.4, .35, .05), 'plank', x, .92, z, 0, cry, -.12); }
    { const [x, z] = rot(.2, .78); put(new THREE.CylinderGeometry(.55, .55, .08, 14).rotateX(Math.PI / 2), 'timber', x, .55, z, 0, cry); }
    { const [x, z] = rot(.6, -2.2); put(new THREE.CylinderGeometry(.55, .55, .08, 14), 'timber', x, .05, z, 0, cry); }
    for (const w of [-.45, .45]) { const [a, b] = rot(1.2, w), [c, d] = rot(3.2, w * .8); rod('timber', [a, .72, b], [c, .05, d], .045); } }
  { const px0 = -6.5, px1 = -1.6, pz0 = BZ1 - 1.6, pz1 = BZ1, PY = 1.9; for (const x of [px0 + .2, (px0 + px1) / 2, px1 - .2]) for (const z of [pz0 + .15, pz1 - .1]) rod('timber', [x, 0, z], [x, PY, z], .07);
    bx('plank', px0, px1, PY, PY + .08, pz0, pz1); for (const s of [-1, 1]) rod('timber', [-4.2 + s * .22, 0, pz0 - .95], [-4.2 + s * .22, PY + .9, pz0 + .05], .035);
    for (let k = 1; k < 8; k++) { const t = k / 8; rod('timber', [-4.42, (PY + .9) * t, pz0 - .95 + 1.0 * t], [-3.98, (PY + .9) * t, pz0 - .95 + 1.0 * t], .025, 4); } }
  { const hx = GX + GW / 2 + .4, hz = BZ1 - .35; put(new THREE.BoxGeometry(2.0, 1.2, .08), 'basket', hx + 1.0, .58, hz, -.22, .05); }
  // the trees: the thorn over the souterrain's pit, ash and thorn on the slopes
  const tree = (x, z, h, w, k) => { const y = ground(x, z); put(new THREE.CylinderGeometry(w * .08, w * .12, h * .5, 7), 'bark', x, y + h * .25, z); for (let q = 0; q < 4; q++) { const s = w * (.5 + r() * .25), g = roughen(new THREE.IcosahedronGeometry(s, 2), r, s * .14, 1.3); g.scale(1, .75, 1); put(g, k, x + (r() - .5) * w * .7, y + h * .55 + r() * h * .3, z + (r() - .5) * w * .7, 0, r() * 3, 0, .4); } };
  tree(-22.6, SZ - 2.5, 2.2, 1.7, 'leaf'); tree(-27.5, SZ + 5.5, 2.0, 1.5, 'leaf');
  for (const [x, z] of [[-30, 22], [26, -24], [30, 20], [-8, -24], [12, 28]]) tree(x, z, 9 + r() * 3, 3.0, 'leaf');
  // the walk: up the slope to the gate, across the yard, in at the door, round to the stair's head, down it, along the cellar's west side,
  // out through the souterrain, up its stair and out onto the slope
  const path = [[GX, ground(GX, 24), 24, 'g'], [GX, 0, 16.5, 'g'], [GX, 0, -1.2], [GX, FL, Z1 - .4, 's'], [GX, FL, -5.6], [1.3, FL, SZc], [WX1 + .05, FL, SZc],
    [WX1 - (NR - 1) * RUN - .15, CF, SZc, 's'], [IX0 + .5, CF, SZ], [X0, CF, SZ], [SX1, CF, SZ], [EX1, EY, SZ, 's'], [EX0, EY, SZ], [EX0 - 3, ground(EX0 - 3, SZ), SZ, 'g']];
  const group = new THREE.Group(); let tris = 0; for (const [k, gs] of B) { const g = mergeGeometries(gs, false); gs.forEach(x => x.dispose()); const m = new THREE.Mesh(g, M[k]); m.name = k; m.castShadow = !['turf', 'flame', 'horn'].includes(k); m.receiveShadow = true; group.add(m); tris += g.attributes.position.count / 3; }
  return { group, tris: Math.round(tris), draws: group.children.length, own: group.children.length, top: +new THREE.Box3().setFromObject(group).max.y.toFixed(2), ground, path, held, lamps, fire: held ? [FXp, FL + .3, FZp] : null,
    tower: { x0: X0, x1: X1, z0: Z0, z1: Z1, t: T, high: HI, fallen: FALL, door: { x: DX, w: DW, h: DSP + DW / 2 } }, hall: { x0: IX0, x1: IX1, z0: IZ0, z1: IZ1, floor: FL, spring: VS, crown: VS + VR },
    well: { x0: WX0, x1: WX1, z0: WZ0, z1: WZ1 }, stair: { n: NR, rise: RISE, run: RUN, x0: WX1 - (NR - 1) * RUN, x1: WX1, z: SZc, top: FL, bottom: CF }, cellar: { floor: CF, ceil: CC, beam: BEAM },
    souterrain: { z: SZ, w: 2 * SW, h: SH, x0: SX1, x1: IX0, floor: CF }, exit: { x0: EX0, x1: SX1, n: EN, rise: ERISE, run: RUN, top: EY },
    bawn: { x0: -BX, x1: BX, z0: BZ0, z1: BZ1, t: BT, gate: { x: GX, w: GW }, breach: BRK } };
}

// ── the Mark's cliff fort (Session 1053, card F8; OG-121's Mark panel, "mountain mines, ice caverns, cliff forts and snowed-in entrances").
// A headland over the fjord, 40 m across and 50 m out, its sides falling 32 m to the sea: the cliffs are its walls, and across its
// landward neck the fort is shut by a ditch, a bank and a palisade. It is abandoned in the winter: its gate burst, one leaf down in the
// snow, its hall shut and drifted, its beacon cold. Who held it and who broke the gate is the quest writer's. A metre a unit, the
// headland's top at about y 0, the sea at -31, the point to +z:
//   - the neck: a ditch 5 m wide and 2.6 m deep across it at z -4.5, a bank 1.8 m high behind it at z 1, and on the bank's crest a
//     palisade of split logs 3.4 m high, pointed, from cliff edge to cliff edge, but for its gate;
//   - the gate: a tower of four posts 7 m high either side of a way 4.4 m wide, a fighting deck at 4.4 m with a breastwork, a shingle roof;
//     one leaf hanging open, the other broken off and lying in the snow; a bridge of planks on two logs over the ditch;
//   - inside: the kit's Markish hall (markHall, shingle, carved), its door to the gate; a storehouse up on four posts on stone caps, so
//     the rats cannot climb to it (the island's own stabbur), with its steps; at the point a beacon, a drum of dry stone with an iron
//     basket on it, the fire long out;
//   - the cliffs: rock wherever the land is steeper than 57°, snow on the rest; the sea below.
// -> { group, tris, draws, own, top, ground(x, z), path ([x, y, z, kind]: 'b' on the bridge, else on the land), bridge { z0, z1, y0, y1, at(z) } (its deck's height), hw(z) (the headland's
//      half-width), sea, ditch { z, w, depth }, bank { z, h }, palisade { z, x0, x1, gate, top }, gate { w, deck, posts }, hall { x, z, y, ry,
//      w, d, stairOut }, store { x, z, floor }, beacon { x, z, top } }
export function markCliffFort(o = {}, r = stream('clifffort')) {
  markTextures(); const std = (c, ro = .9, x = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: ro, ...x }), key = String(o.key || 'clifffort');
  const M = { ...mats(), snow: mat('plaster', { ns: .3, color: 0xf2f5f8, rough: .95 }), cliff: mat('rock', { ns: 1.4, color: 0x6c6a66, rough: .95 }), shingle: mat('shingle', { ns: 1.4, rough: .8 }),
    log: mat('beam', { ns: 1.1, color: 0x7a624a, rough: .9 }), drystone: mat('stone', { ns: 1.3, color: 0xb8b4ac, rough: .95 }), sea: std(0x1c3a44, .15, { metalness: .2 }),
    hewn: mat('rock', { ns: .9, color: 0x8c8880, rough: .95 }), hull: mat('wood', { ns: .8, color: 0x4a3c2e, rough: .75 }), rope: std(0x8a7650, .95) };
  M.cliff.side = M.hewn.side = M.hull.side = THREE.DoubleSide /* the cliff is seen from inside at the cave's mouth and the slits */;
  const B = new Map(), V = (x, y) => new THREE.Vector2(x, y);
  const put = (geo, k, x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0, uv = .5) => { const g = geo.index ? geo.toNonIndexed() : geo; for (const a of Object.keys(g.attributes)) if (!['position', 'normal'].includes(a)) g.deleteAttribute(a);
    if (!g.attributes.normal) g.computeVertexNormals();
    g.applyMatrix4(new THREE.Matrix4().compose(new THREE.Vector3(x, y, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(rx, ry, rz, 'YXZ')), new THREE.Vector3(1, 1, 1))); worldUV(g, uv);
    if (!B.has(k)) B.set(k, []); B.get(k).push(g); };
  const bx = (k, x0, x1, y0, y1, z0, z1) => put(new THREE.BoxGeometry(x1 - x0, y1 - y0, z1 - z0), k, (x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2);
  const rod = (k, a, b, rad, seg = 6) => { const A = new THREE.Vector3(...a), Bv = new THREE.Vector3(...b), d = Bv.clone().sub(A), g = new THREE.CylinderGeometry(rad, rad, d.length(), seg); g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.clone().normalize())); const m = A.add(Bv).multiplyScalar(.5); put(g, k, m.x, m.y, m.z); };
  const sm = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
  // the land: the headland's top, its cliffs (32 m over 3 m, rough), the ditch and the bank across the neck, the land rising inland
  const F = field(stream(key + ':land'), .5), SEA = -31, DROP = 32, DZ = -4.5, DW = 5, DD = 2.6, BKZ = 1, BKH = 1.8, GH = 2.2, PZ = BKZ, PEND = 50;
  // the sea-stair's plan (Michael's B on DECISION #402, Session 1062): nine flights of 16 rises in a shaft along the west cliff, z ZS0 to ZS1,
  // turning on landings LD deep; the cut behind the hall (x XD to TX1, z TZ0 to TZ1); the sea cave south of the shaft (z CZ0 to CZ1), its mouth
  // in the west cliff from MZ0 to MZ1 and from MY0 (under the water) to MY1
  const NF = 9, NR = 16, TS = .28, FW = 1.1, SP = .6, LD = 1.3, HD = 2.5, Y0 = -3.2, YB = SEA + 1, RS = (Y0 - YB) / (NF * NR), RUN = (NR - 1) * TS, ZS1 = 30.6, ZS0 = ZS1 - 2 * LD - RUN;
  const CZ1 = ZS0 - 2, CZ0 = CZ1 - 9, MZ0 = CZ0 + 1.6, MZ1 = CZ1 - 1.6, MY0 = SEA - 3.5, MY1 = SEA + 5.2, XD = -11, TX1 = -6, TZ0 = 29, TZ1 = 31, ZP0 = 29.4, ZP1 = 30.6;
  const cph = [r() * 6, r() * 6], hw = z => (z < 0 ? 20 + -z * 1.5 : z <= 28 ? 20 : Math.max(0, 20 - (z - 28) * .55)) + (z > PZ + 2 ? (1.6 * Math.sin(z * .31 + cph[0]) + .9 * Math.sin(z * .83 + cph[1])) * (1 - sm(ZS0 - 4, ZS0 - 1, z) * (1 - sm(ZS1 + 1, ZS1 + 4, z))) : 0) /* the cliff's line, ragged past the palisade but straight along the sea-stair */;
  const out = (x, z) => Math.max(Math.abs(x) - hw(z), z - PEND);
  const ditch = z => DD * Math.max(0, 1 - Math.abs(z - DZ) / (DW / 2)) ** .8, bank = (x, z) => BKH * Math.max(0, 1 - ((z - BKZ) / 2.5) ** 2) * sm(GH, GH + 1.6, Math.abs(x));
  const ground = (x, z) => { const top = F(x, 0, z)[1] * .5 + (z < -9 ? (-9 - z) * .08 : 0) - ditch(z) + bank(x, z), d = out(x, z); if (d <= 0) return top; return top + (SEA - 1.5 - top) * sm(0, 3, d) + F(x * 1.7, 3, z * 1.7)[0] * 2.2 * sm(0, 1, d) * (1 - sm(4, 8, d)) * (x < 0 ? 1 - sm(MZ0 - 2.5, MZ0, z) * (1 - sm(MZ1, MZ1 + 2.5, z)) : 1) /* no rocks at the cave's mouth */; };
  // the shaft stands 1.6 m in from the nearest of the cliff's line along it; a slit at every landing and halfway down every outer flight
  let hwMin = 99, hwMax = 0; for (let z = ZS0 - .5; z <= ZS1 + .5; z += .1) hwMin = Math.min(hwMin, hw(z)); for (let z = CZ0; z <= CZ1; z += .1) hwMax = Math.max(hwMax, hw(z));
  const XW = -hwMin + 1.6, XE = XW + 2 * FW + SP, XO = XW + FW / 2, XI = XE - FW / 2, LY = k => Y0 - k * NR * RS, slits = [], slit = (z, yc) => slits.push({ z, yc, y0: yc - .55, y1: yc + .55, wi: .3, oy0: yc - .375, oy1: yc + .375, wo: .09 });
  for (let k = 0; k <= NF; k++) slit(k % 2 ? ZS0 + LD / 2 : ZS1 - LD / 2, LY(k) + 1.55); for (let f = 1; f <= NF; f += 2) slit(ZS1 - LD - RUN / 2, (LY(f - 1) + LY(f)) / 2 + 1.55);
  // the holes in the face, each a convex outline in (z, y), counter-clockwise: the slits square, the mouth a rough arch
  const MM = (MZ0 + MZ1) / 2, MOUTH = [[MZ0, MY0], [MZ1, MY0], [MZ1 - .15, SEA + 1.9], [MZ1 - .8, SEA + 3.9], [MM + 1.1, SEA + 4.95], [MM - .6, MY1], [MZ0 + .9, SEA + 4.1], [MZ0 + .2, SEA + 2.2]];
  const HOLES = [...slits.map(s => ({ poly: [[s.z - s.wo, s.oy0], [s.z + s.wo, s.oy0], [s.z + s.wo, s.oy1], [s.z - s.wo, s.oy1]], xa: XW - .2, xb: -hwMin - 12 })), { poly: MOUTH, xa: XW, xb: -hwMax - 6 }];
  for (const h of HOLES) { h.z0 = Math.min(...h.poly.map(q => q[0])); h.z1 = Math.max(...h.poly.map(q => q[0])); h.y0 = Math.min(...h.poly.map(q => q[1])); h.y1 = Math.max(...h.poly.map(q => q[1])); }
  let meshH = null;
  { const S = 1, X0 = -70, Z0 = -50, NX = 140, NZ = 125, pos = [], snow = [], rock = [];
    for (let j = 0; j <= NZ; j++) for (let i = 0; i <= NX; i++) { const x = X0 + i * S, z = Z0 + j * S; pos.push(x, ground(x, z), z); }
    const n = new THREE.Vector3(), a = new THREE.Vector3(), b = new THREE.Vector3(), c = new THREE.Vector3(), tri = (L, p, q, s) => { a.fromArray(pos, p * 3); b.fromArray(pos, q * 3); c.fromArray(pos, s * 3);
      const cx = (a.x + b.x + c.x) / 3, cz = (a.z + b.z + c.z) / 3; if (cx > XD && cx < TX1 && cz > TZ0 && cz < TZ1) return /* the cut behind the hall, on the grid's lines */; n.subVectors(b, a).cross(c.clone().sub(a)).normalize(); (n.y < .55 ? rock : snow).push(p, q, s); };
    for (let j = 0; j < NZ; j++) for (let i = 0; i < NX; i++) { const p = j * (NX + 1) + i, q = p + 1, s = p + NX + 1, t = s + 1; tri(null, p, s, q); tri(null, q, s, t); }
    // the mesh's own height between its points, as its triangles are split
    meshH = (x, z) => { const u = (x - X0) / S, w = (z - Z0) / S, i = Math.min(NX - 1, Math.max(0, Math.floor(u))), j = Math.min(NZ - 1, Math.max(0, Math.floor(w))), fx = u - i, fz = w - j, Hh = (ii, jj) => pos[(jj * (NX + 1) + ii) * 3 + 1];
      return fx + fz <= 1 ? Hh(i, j) + (Hh(i + 1, j) - Hh(i, j)) * fx + (Hh(i, j + 1) - Hh(i, j)) * fz : Hh(i + 1, j + 1) + (Hh(i, j + 1) - Hh(i + 1, j + 1)) * (1 - fx) + (Hh(i + 1, j) - Hh(i + 1, j + 1)) * (1 - fz); };
    { const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(snow); g.computeVertexNormals(); put(g, 'snow', 0, 0, 0, 0, 0, 0, .35); }
    // the cliff, with the slits and the cave's mouth cut out of its face: a triangle under a hole is clipped to the parts round it, its normals carried
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(rock); g.computeVertexNormals();
    const NA = g.attributes.normal.array, keepI = [], cut = [], PV = i => ({ p: [pos[i * 3], pos[i * 3 + 1], pos[i * 3 + 2]], n: [NA[i * 3], NA[i * 3 + 1], NA[i * 3 + 2]] });
    // a polygon cut by a line in (z, y), the part where fn >= 0 kept; round(P, h): the parts of P outside the hole, one per edge of it
    const clip = (P, fn) => { if (!P) return null; const O = []; for (let i = 0; i < P.length; i++) { const A = P[i], Q = P[(i + 1) % P.length], da = fn(A.p), db = fn(Q.p);
      if (da >= 0) O.push(A); if ((da >= 0) !== (db >= 0)) { const t = da / (da - db); O.push({ p: A.p.map((v, j) => v + (Q.p[j] - v) * t), n: A.n.map((v, j) => v + (Q.n[j] - v) * t) }); } } return O.length >= 3 ? O : null; };
    const round = (P, h) => { const out = []; let cur = P; for (let i = 0; i < h.poly.length && cur; i++) { const [z1, y1] = h.poly[i], [z2, y2] = h.poly[(i + 1) % h.poly.length], f = p => (z2 - z1) * (p[1] - y1) - (y2 - y1) * (p[2] - z1);
      const o = clip(cur, p => -f(p)); if (o) out.push(o); cur = clip(cur, f); } return out; };
    for (let t = 0; t < rock.length; t += 3) { const T = [rock[t], rock[t + 1], rock[t + 2]].map(PV), cx = (T[0].p[0] + T[1].p[0] + T[2].p[0]) / 3, ys = T.map(v => v.p[1]), zs = T.map(v => v.p[2]);
      const hs = HOLES.filter(h => cx < h.xa && cx > h.xb && Math.max(...ys) > h.y0 && Math.min(...ys) < h.y1 && Math.max(...zs) > h.z0 && Math.min(...zs) < h.z1);
      if (!hs.length) { keepI.push(rock[t], rock[t + 1], rock[t + 2]); continue; } let polys = [T]; for (const h of hs) polys = polys.flatMap(P => round(P, h));
      for (const P of polys) for (let k = 1; k + 1 < P.length; k++) cut.push(P[0], P[k], P[k + 1]); }
    g.setIndex(keepI); put(g, 'cliff', 0, 0, 0, 0, 0, 0, .35);
    { const cg = new THREE.BufferGeometry(); cg.setAttribute('position', new THREE.Float32BufferAttribute(cut.flatMap(v => v.p), 3)); cg.setAttribute('normal', new THREE.Float32BufferAttribute(cut.flatMap(v => { const l = Math.hypot(...v.n) || 1; return v.n.map(x => x / l); }), 3)); put(cg, 'cliff', 0, 0, 0, 0, 0, 0, .35); }
    put(new THREE.PlaneGeometry(260, 260).rotateX(-Math.PI / 2), 'sea', 0, SEA, 20); }
  // the palisade: split logs on the bank's crest, edge to edge, pointed; a rail along them inside; none in the gate's way
  const PT = 3.4, PR = .16, PSP = .29, logs = []; for (let x = -hw(PZ) + .8; x <= hw(PZ) - .8; x += PSP) { if (Math.abs(x) < GH + .1) continue; const y = ground(x, PZ), h = PT + (r() - .5) * .25; logs.push(x);
    put(new THREE.CylinderGeometry(PR, PR * 1.05, h + .6, 7), 'log', x, y + h / 2 - .3, PZ, 0, r() * 3); put(new THREE.ConeGeometry(PR, .45, 7), 'log', x, y + h + .22, PZ, 0, r() * 3); }
  for (const s of [-1, 1]) for (const yy of [.9, 2.4]) { const x0 = s * (GH + .1), x1 = s * (hw(PZ) - .8); bx('timber', Math.min(x0, x1), Math.max(x0, x1), ground(s * 6, PZ) + yy, ground(s * 6, PZ) + yy + .14, PZ + PR, PZ + PR + .1); }
  // the gate tower: four posts, the deck and its breastwork, a gabled roof of shingle; the leaves
  const DECK = 4.4, posts = [[-GH - .1, PZ - 1.1], [GH + .1, PZ - 1.1], [-GH - .1, PZ + 1.1], [GH + .1, PZ + 1.1]];
  for (const [x, z] of posts) put(new THREE.CylinderGeometry(.22, .24, 7.5, 8), 'log', x, 3.25, z);
  bx('plank', -GH - .4, GH + .4, DECK, DECK + .12, PZ - 1.4, PZ + 1.4); for (const x of [-GH, GH]) bx('timber', x - .14, x + .14, DECK - .3, DECK, PZ - 1.4, PZ + 1.4);
  bx('plank', -GH - .4, GH + .4, DECK + .12, DECK + 1.25, PZ - 1.45, PZ - 1.35); for (const s of [-1, 1]) bx('plank', s > 0 ? GH + .3 : -GH - .4, s > 0 ? GH + .4 : -GH - .3, DECK + .12, DECK + 1.25, PZ - 1.4, PZ + 1.4);
  { const RW = GH + .9, RP = 52 * Math.PI / 180, L = RW / Math.cos(RP) + .1; for (const s of [-1, 1]) put(new THREE.BoxGeometry(L, .12, 3.6), 'shingle', s * RW / 2, 7.25 + Math.tan(RP) * RW / 2 - .05, PZ, 0, 0, -s * RP, .6); }
  { const LW = GH - .05, LH = 3.6; const LA = -1.9, hx = -GH + .05, hz = PZ + 1.2; put(new THREE.BoxGeometry(LW, LH, .14), 'plank', hx + Math.cos(LA) * LW / 2, ground(-1, hz) + LH / 2 + .05, hz - Math.sin(LA) * LW / 2, 0, LA, 0) /* the leaf still hung, swung in */;
    put(new THREE.BoxGeometry(LW, .14, LH), 'plank', GH + 1.6, ground(GH + 1.6, PZ + 5) + .12, PZ + 5.0, .06, .5, .04);
    for (const s of [-1, 1]) for (const y of [.6, 3.0]) bx('iron', s * (GH + .05) - .04, s * (GH + .05) + .04, y, y + .12, PZ + .95, PZ + 1.25); }
  // the bridge over the ditch: two logs and their planks, from bank to bank
  const BZ0 = DZ - DW / 2 - .8, BZ1 = DZ + DW / 2 + .8, BYa = ground(0, BZ0) + .12, BYb = ground(0, BZ1) + .12, BYat = z => BYa + (BYb - BYa) * (z - BZ0) / (BZ1 - BZ0);
  for (const x of [-1.0, 1.0]) rod('log', [x, BYat(BZ0 - .4) - .26, BZ0 - .4], [x, BYat(BZ1 + .4) - .26, BZ1 + .4], .2, 8);
  for (let z = BZ0; z < BZ1 - .01; z += .32) bx('plank', -1.5, 1.5, BYat(z + .15) - .06, BYat(z + .15), z, z + .3);
  // the hall, its door to the gate; the storehouse on its posts; the beacon at the point
  const HX = -6, HZ = 21, HRY = Math.PI, H = markHall({ roof: 'shingle', w: 7, d: 14, porch: true, chimney: false, carve: true, wall: 2 }, stream(key + ':hall')), HY = ground(HX, HZ);
  H.group.position.set(HX, HY, HZ); H.group.rotation.y = HRY;
  const SX = 9, SZ = 14, SF = 1.1, SY = ground(SX, SZ); for (const [dx, dz] of [[-1.3, -1.3], [1.3, -1.3], [-1.3, 1.3], [1.3, 1.3]]) { bx('drystone', SX + dx - .3, SX + dx + .3, SY - .3, SY + .35, SZ + dz - .3, SZ + dz + .3); bx('log', SX + dx - .15, SX + dx + .15, SY + .35, SY + SF - .1, SZ + dz - .15, SZ + dz + .15); bx('drystone', SX + dx - .32, SX + dx + .32, SY + SF - .1 - .08, SY + SF - .1, SZ + dz - .32, SZ + dz + .32); }
  bx('plank', SX - 1.7, SX + 1.7, SY + SF - .1, SY + SF + .05, SZ - 1.7, SZ + 1.7); for (const s of [-1, 1]) { bx('log', SX - 1.6, SX + 1.6, SY + SF, SY + SF + 2.1, SZ + s * 1.6 - .1, SZ + s * 1.6 + .1); bx('log', SX + s * 1.6 - .1, SX + s * 1.6 + .1, SY + SF, SY + SF + 2.1, SZ - 1.5, SZ + 1.5); }
  { const RP = 40 * Math.PI / 180, RW = 2.2, L = RW / Math.cos(RP) + .1; for (const s of [-1, 1]) put(new THREE.BoxGeometry(3.9, .12, L), 'shingle', SX, SY + SF + 2.1 + Math.tan(RP) * RW / 2, SZ + s * RW / 2, s * RP, 0, 0, .6);
    for (const s of [-1, 1]) { const tri = new THREE.Shape([V(-RW, 0), V(RW, 0), V(0, Math.tan(RP) * RW)]); const g = new THREE.ExtrudeGeometry(tri, { depth: .1, bevelEnabled: false }); g.translate(0, 0, -.05); put(g, 'log', SX + s * 1.6, SY + SF + 2.1, SZ, 0, Math.PI / 2); } }
  for (let k = 0; k < 5; k++) bx('plank', SX - 2.2 - k * .3, SX - 1.9 - k * .3, SY, SY + SF - .1 - k * .2, SZ - .5, SZ + .5);
  const BCX = 0, BCZ = 44, BCY = ground(BCX, BCZ), BCH = 1.1; put(roughen(new THREE.CylinderGeometry(1.4, 1.6, BCH + .4, 16, 3), r, .06, 2), 'drystone', BCX, BCY + BCH / 2 - .2, BCZ);
  for (let k = 0; k < 6; k++) { const a = k / 6 * Math.PI * 2; rod('iron', [BCX + Math.cos(a) * .25, BCY + BCH, BCZ + Math.sin(a) * .25], [BCX + Math.cos(a) * .55, BCY + BCH + .9, BCZ + Math.sin(a) * .55], .025, 4); }
  put(new THREE.TorusGeometry(.55, .03, 4, 18).rotateX(Math.PI / 2), 'iron', BCX, BCY + BCH + .9, BCZ); put(new THREE.TorusGeometry(.4, .03, 4, 16).rotateX(Math.PI / 2), 'iron', BCX, BCY + BCH + .45, BCZ);
  for (let k = 0; k < 4; k++) put(new THREE.CylinderGeometry(.06, .07, .9, 6).rotateZ(Math.PI / 2), 'dark', BCX, BCY + BCH + .38, BCZ, 0, k * .8);
  // the sea-stair: hewn rock, flat panes. pane(ax, c, outline, holes) lays a polygon in (u, v) on the plane ax = c: on x, (z, y); on z, (x, y); on y, (x, z)
  const flights = [], down = [], gT = ground(TX1, 30), NT = 16, rT = (gT - Y0) / (NT + 1), TT = (TX1 - XD - 1) / NT, faceX = (y, z) => { let lo = XW - 14, hi = XW; for (let k = 0; k < 40; k++) { const m = (lo + hi) / 2; if (meshH(m, z) > y) hi = m; else lo = m; } return (lo + hi) / 2; };
  { const pane = (ax, c, outl, holes = []) => { const sh = new THREE.Shape(outl.map(([u, v]) => V(u, v))); for (const h of holes) sh.holes.push(new THREE.Path(h.map(([u, v]) => V(u, v))));
      const g = new THREE.ShapeGeometry(sh), P = g.attributes.position; for (let i = 0; i < P.count; i++) { const u = P.getX(i), v = P.getY(i); if (ax === 'x') P.setXYZ(i, c, v, u); else if (ax === 'z') P.setXYZ(i, u, v, c); else P.setXYZ(i, u, c, v); }
      g.deleteAttribute('normal'); put(g, 'hewn', 0, 0, 0, 0, 0, 0, .5); };
    const rc = (u0, u1, v0, v1) => [[u0, v0], [u1, v0], [u1, v1], [u0, v1]], wall = (ax, c, u0, u1, v0, v1, holes = []) => { if (u1 - u0 > .005 && v1 - v0 > .005) pane(ax, c, rc(u0, u1, v0, v1), holes); };
    const door = (ax, c, u0, u1, v0, v1, d0, d1, dh) => { wall(ax, c, u0, d0, v0, v1); wall(ax, c, d1, u1, v0, v1); wall(ax, c, d0, d1, v0 + dh, v1); };
    const quad = (A, Q, C, D) => { const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute([...A, ...Q, ...C, ...A, ...C, ...D], 3)); put(g, 'hewn', 0, 0, 0, 0, 0, 0, .5); };
    const hole = s => rc(s.z - s.wi, s.z + s.wi, s.y0, s.y1), col = f => f % 2 ? [XW, XW + FW] : [XE - FW, XE];
    // the cut behind the hall: a landing at the door, 16 steps up eastward to the snow, its walls up to the land's own edge
    bx('hewn', XD, XD + 1, Y0 - .6, Y0, TZ0 + .01, TZ1 - .01); for (let j = 1; j <= NT; j++) bx('hewn', XD + 1 + (j - 1) * TT, XD + 1 + j * TT, Y0 - .6, Y0 + j * rT, TZ0 + .01, TZ1 - .01);
    for (const z of [TZ0, TZ1]) { const o = [[XD, Y0 - .6], [TX1, Y0 - .6]]; for (let x = TX1; x >= XD; x--) o.push([x, meshH(x, z)]); pane('z', z, o); }
    const tops = (z0, z1) => { const zs = [z1]; for (let z = Math.ceil(z1) - 1; z > z0; z--) zs.push(z); zs.push(z0); return zs.map(z => [z, meshH(XD, z)]); };
    pane('x', XD, [[TZ0, Y0 - .6], [ZP0, Y0 - .6], ...tops(TZ0, ZP0)]); pane('x', XD, [[ZP1, Y0 - .6], [TZ1, Y0 - .6], ...tops(ZP1, TZ1)]); pane('x', XD, [[ZP0, Y0 + 2.3], [ZP1, Y0 + 2.3], ...tops(ZP0, ZP1)]);
    // the door: a frame of timber in the rock, its leaf swung back against the passage's wall
    for (const [z0, z1] of [[ZP0, ZP0 + .12], [ZP1 - .12, ZP1]]) bx('timber', XD - .1, XD + .1, Y0, Y0 + 2.3, z0, z1); bx('timber', XD - .1, XD + .1, Y0 + 2.18, Y0 + 2.3, ZP0, ZP1);
    { const th = 1.5, w = ZP1 - ZP0 - .26, hz = ZP0 + .15, hx = XD - .14; put(new THREE.BoxGeometry(.06, 2.12, w), 'plank', hx - Math.sin(th) * w / 2, Y0 + 1.08, hz + Math.cos(th) * w / 2, 0, -th, 0);
      for (const y of [.4, 1.7]) put(new THREE.BoxGeometry(.02, .07, w * .8), 'iron', hx - Math.sin(th) * w * .4 - Math.cos(th) * .04, Y0 + y, hz + Math.cos(th) * w * .4 + .04, 0, -th, 0); }
    // the passage west to the shaft's head, 1.2 m wide and 2.3 m high
    bx('hewn', XE, XD, Y0 - .6, Y0, ZP0, ZP1); pane('y', Y0 + 2.3, rc(XE, XD, ZP0, ZP1)); wall('z', ZP0, XE, XD, Y0, Y0 + 2.3); wall('z', ZP1, XE, XD, Y0, Y0 + 2.3);
    // the landings: the top one at the north end, then south and north by turns; each lit by its slit in the west wall
    for (let k = 0; k <= NF; k++) { const north = k % 2 === 0, z0 = north ? ZS1 - LD : ZS0, z1 = north ? ZS1 : ZS0 + LD, y = LY(k), zf = north ? z0 : z1, ze = north ? z1 : z0;
      bx('hewn', XW, XE, y - .6, y, z0, z1); pane('y', y + HD, rc(XW, XE, z0, z1)); wall('x', XW, z0, z1, y, y + HD, [hole(slits[k])]);
      if (k === 0) door('x', XE, z0, z1, y, y + HD, ZP0, ZP1, 2.3); else wall('x', XE, z0, z1, y, y + HD);
      if (k === NF) door('z', ze, XW, XE, y, y + HD, XE - FW, XE, 2.3); else wall('z', ze, XW, XE, y, y + HD);
      const open = [k >= 1 && col(k), k < NF && col(k + 1)].filter(Boolean).sort((p, q) => p[0] - q[0]); let u = XW; for (const [a0, a1] of open) { wall('z', zf, u, a0, y, y + HD); u = a1; } wall('z', zf, u, XE, y, y + HD); }
    // the flights: the treads as one stepped profile across the flight, its walls and its sloping roof; the outer flights' slits halfway
    for (let f = 1; f <= NF; f++) { const odd = f % 2 === 1, [c0, c1] = col(f), zU = odd ? ZS1 - LD : ZS0 + LD, dir = odd ? -1 : 1, yU = LY(f - 1), yL = LY(f), Z = s => zU + dir * s; flights.push({ c0, c1, zU, dir, yU, yL });
      const pr = [V(0, yL - .25), V(0, yU - RS)]; for (let k = 1; k < NR; k++) { pr.push(V(k * TS, yU - k * RS)); if (k < NR - 1) pr.push(V(k * TS, yU - (k + 1) * RS)); } pr.push(V(RUN, yL), V(RUN, yL - .25));
      const g = new THREE.ExtrudeGeometry(new THREE.Shape(pr), { depth: FW, bevelEnabled: false, steps: 1 }), P = g.attributes.position; for (let i = 0; i < P.count; i++) P.setXYZ(i, c0 + P.getZ(i), P.getY(i), Z(P.getX(i)));
      g.deleteAttribute('normal'); put(g, 'hewn', 0, 0, 0, 0, 0, 0, .5);
      const side = [[zU, yL - .25], [Z(RUN), yL - .25], [Z(RUN), yL + HD], [zU, yU + HD]]; pane('x', c0, side, odd ? [hole(slits[NF + 1 + (f - 1) / 2])] : []); pane('x', c1, side);
      quad([c0, yU + HD, zU], [c1, yU + HD, zU], [c1, yL + HD, Z(RUN)], [c0, yL + HD, Z(RUN)]); }
    // the slits: an embrasure through the rock, 0.6 by 1.1 m at the wall, narrowing to 0.18 by 0.75 m at the face
    for (const s of slits) { const I = (dz, y) => [XW, y, s.z + dz * s.wi], O = (dz, y) => { const yy = y, zz = s.z + dz * s.wo; return [faceX(yy, zz), yy, zz]; }; s.x = XW; s.ox = faceX(s.yc, s.z);
      quad(I(-1, s.y0), I(1, s.y0), O(1, s.oy0), O(-1, s.oy0)); quad(I(-1, s.y1), I(1, s.y1), O(1, s.oy1), O(-1, s.oy1)); quad(I(-1, s.y0), I(-1, s.y1), O(-1, s.oy1), O(-1, s.oy0)); quad(I(1, s.y0), I(1, s.y1), O(1, s.oy1), O(1, s.oy0)); }
    // the foot: a passage south from the last landing, through a dressed face into the sea cave
    bx('hewn', XE - FW, XE, YB - .6, YB, CZ1 - .8, ZS0); pane('y', YB + 2.3, rc(XE - FW, XE, CZ1 - .8, ZS0)); wall('x', XE - FW, CZ1 - .8, ZS0, YB, YB + 2.3); wall('x', XE, CZ1 - .8, ZS0, YB, YB + 2.3);
    door('z', CZ1 - .8, XE - FW - 1, XE + .5, YB - .4, YB + 3.4, XE - FW, XE, 2.3); }
  // the sea cave: the rock seen from inside, kept where the land is over it (so it stops at the cliff's face), open to the passage
  const FC = field(stream(key + ':cave'), .55), cx0 = -hwMax - 4.5, cx1 = XE + .4, cy0 = SEA - 3, cy1 = SEA + 7.2;
  put(rockBox(cx1 - cx0, cy1 - cy0, CZ1 - CZ0, (cx0 + cx1) / 2, (cy0 + cy1) / 2, (CZ0 + CZ1) / 2, .6, FC, (c, nn) => ground(c.x, c.z) > c.y + .02 && !(nn.z > .5 && c.z > CZ1 - .7 && c.x > XE - FW - .6 && c.x < XE + .6 && c.y < YB + 2.9)), 'cliff', 0, 0, 0, 0, 0, 0, .35);
  // the quay along the cave's east wall, its rings; the boat at it, a lathe shell, its gunwale, thwarts and oars, tied by the bow
  const QX = XE - 2.4, boat = { x: XE - 3.3, z: (CZ0 + CZ1) / 2 - .4, L: 4.4 }; bx('hewn', QX, XE + .9, SEA - 3, YB, CZ0 + 1.2, CZ1 - .8);
  for (const dz of [-1.6, 1.6]) { put(new THREE.TorusGeometry(.09, .016, 5, 12), 'iron', QX - .05, YB - .18, boat.z + dz, 0, Math.PI / 2, 0); bx('iron', QX - .04, QX, YB - .1, YB - .04, boat.z + dz - .03, boat.z + dz + .03); }
  { const BL = boat.L, W2 = .78, by = SEA + .28, pts = []; for (let k = 0; k <= 10; k++) { const t = k / 10; pts.push(V(Math.sin(Math.PI * t) ** .6 * W2 + .05, (t - .5) * BL)); }
    const g = new THREE.LatheGeometry(pts, 14, -Math.PI / 2, Math.PI); g.rotateX(Math.PI / 2); g.scale(1, .55, 1); put(g, 'hull', boat.x, by, boat.z, 0, 0, 0, .5);
    for (const s of [-1, 1]) { const gp = []; for (let k = 0; k <= 10; k++) { const t = k / 10; gp.push(new THREE.Vector3(boat.x + s * (Math.sin(Math.PI * t) ** .6 * W2 + .05), by + .01, boat.z + (t - .5) * BL)); } put(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(gp), 16, .035, 5), 'timber'); }
    for (const dz of [-.8, .6]) bx('timber', boat.x - .72, boat.x + .72, by - .18, by - .13, boat.z + dz - .1, boat.z + dz + .1);
    for (const s of [-1, 1]) { const g2 = new THREE.CylinderGeometry(.03, .03, 2.6, 6); g2.rotateX(Math.PI / 2); g2.rotateY(s * .12); put(g2, 'timber', boat.x + s * .3, by - .08, boat.z + .1); }
    rod('rope', [boat.x + .1, by + .04, boat.z + BL / 2 - .3], [QX - .05, YB - .27, boat.z + 1.6], .015, 5); boat.y = by; }
  // the walk down: from the snow into the cut, through the door and the passage, down the nine flights by their landings, out onto the quay
  down.push([TX1 + 1.4, ground(TX1 + 1.4, 30), 30, 'g'], [TX1, meshH(TX1, 30), 30, 'g'], [XD + 1, Y0, 30, 's'], [XD + .5, Y0, 30], [XO, Y0, 30], [XO, Y0, ZS1 - LD]);
  for (const Fl of flights) { const x = (Fl.c0 + Fl.c1) / 2, zl = Fl.zU + Fl.dir * RUN, zm = zl + Fl.dir * LD / 2, last = Fl === flights[NF - 1], nx = last || x === XO ? XI : XO; down.push([x, Fl.yL, zl, 's'], [x, Fl.yL, zm], [nx, Fl.yL, zm]); if (!last) down.push([nx, Fl.yL, zl]); }
  down.push([XI, YB, CZ1 - .8], [XI, YB, CZ1 - 1.6], [XE - 1.2, YB, boat.z]);
  const path = [[0, ground(0, -22), -22], [0, ground(0, BZ0 - 1.2), BZ0 - 1.2], [0, BYat(BZ0 + .1), BZ0 + .1, 'b'], [0, BYat(BZ1 - .1), BZ1 - .1, 'b'], [0, ground(0, PZ + 3), PZ + 3], [HX, ground(HX, HZ - H.stairOut - .6), HZ - H.stairOut - .6], [0, ground(0, HZ - H.stairOut - .6), HZ - H.stairOut - .6], [0, ground(0, BCZ - 3), BCZ - 3]];
  const group = new THREE.Group(); let tris = 0; for (const [k, gs] of B) { const g = mergeGeometries(gs, false); gs.forEach(x => x.dispose()); const m = new THREE.Mesh(g, M[k]); m.name = k; m.castShadow = !['sea', 'snow', 'cliff'].includes(k); m.receiveShadow = true; group.add(m); tris += g.attributes.position.count / 3; }
  const own = group.children.length; group.add(H.group); tris += H.tris;
  return { group, tris: Math.round(tris), draws: own + H.draws, own, top: +new THREE.Box3().setFromObject(group).max.y.toFixed(2), ground, path, hw, sea: SEA, out,
    ditch: { z: DZ, w: DW, depth: DD }, bank: { z: BKZ, h: BKH }, palisade: { z: PZ, x0: -hw(PZ) + .8, x1: hw(PZ) - .8, gate: GH, top: PT, logs: logs.length },
    gate: { w: 2 * GH, deck: DECK, posts }, bridge: { z0: BZ0, z1: BZ1, y0: BYa, y1: BYb, at: BYat }, down, meshH,
    stair: { xw: XW, xe: XE, xo: XO, xi: XI, z0: ZS0, z1: ZS1, n: NF, rises: NR, rise: RS, tread: TS, run: RUN, landing: LD, head: HD, levels: Array.from({ length: NF + 1 }, (_, k) => LY(k)), flights, slits,
      cut: { x0: XD, x1: TX1, z0: TZ0, z1: TZ1, n: NT, rise: rT, tread: TT }, door: { x: XD, z0: ZP0, z1: ZP1 } },
    cave: { x0: cx0, x1: cx1, z0: CZ0, z1: CZ1, top: cy1, mouth: { z0: MZ0, z1: MZ1, y0: MY0, y1: MY1, poly: MOUTH }, quay: { x0: QX, y: YB } }, boat, hall: { x: HX, z: HZ, y: HY, ry: HRY, w: 7, d: 14, stairOut: H.stairOut }, store: { x: SX, z: SZ, floor: SY + SF + .05 }, beacon: { x: BCX, z: BCZ, top: BCY + BCH } };
}

// ── the Gatelands' limestone quarry and its lime kiln (Session 1155, card F8; OG-046's "mines and quarries", the last works on its board
// with the canals). A small country quarry worked back into a hillside of bedded limestone, after the field quarries and draw kilns of the
// Irish midlands: the stone is walling and lime for the townland, not a mine. Built at true size, a metre a unit, the hill rising to -z,
// a lane along x at z 16:
//   - the pit: a floor of 18 by 19 m cut level into the slope and open to the lane at +z; its back face worked in two lifts, a lower face of
//     3 m to a bench 2.5 m deep and an upper face above it to the turf (about 6 m over the floor), its side faces running down to nothing at
//     the mouth. Every face is the rock's own beds, the same beds on all three (0.35 to 0.7 m thick, the one under the bench up to 0.8),
//     each bed broken into blocks along its joints, each standing proud of the face by its own few centimetres, so the face reads as
//     courses the quarrymen follow; the rock stops 0.15 m under the turf, each bed cut off by it, so a band of soil shows over the faces;
//   - a dry-stone wall along the rim, set back 1.6 m from the faces, where the drop is more than 1.2 m;
//   - the work: shear legs of two poles over the floor before the lower face, guyed back to a stake, a crab winch at one foot and a block
//     hanging from the tackle on a chain sling; a block on the floor being split, a row of wedges standing in its holes; rough blocks lying
//     where they fell; squared blocks stacked by the mouth with a two-wheeled stone cart; a spoil heap of rubble along the west face's foot;
//     a mason's lean-to with a banker under it, a block on it and the mallet;
//   - the kiln: a draw kiln of rubble stone built into the bank east of the mouth, 5 m across, 6 deep and 4.4 high, battered; its draw arch
//     on a levelled yard at the floor's level, the eye dark at the back of the arch with burnt lime spilt before it; its pot open on the top,
//     ringed with dressed stone, the bank behind built up to within 0.3 m of the top so the stone is barrowed in from the hill;
//   - the land: turf over the hill, the lane, a worn track from it into the pit, ash and thorn on the hill.
// -> { group, tris, draws, own, ground(x, z), hill(x, z) (the turf before the cut), floor (0), pit { x0, x1, z0 (the upper face), bz (the lower),
//      bench, mouth }, beds ([y0, y1] each), faces (the blocks, { x0, x1, y0, y1, z0, z1, f (its face: 'back', 'upper', 'west', 'east') }), wall { runs, h },
//      crane { feet [[x, y, z]…], apex, stake, load { x, z, y0, y1, w, d } }, wedges { x, z, n, top }, kiln { x, z0 (its back), z1 (its front), w, top,
//      arch { w, h, depth }, pot { r }, bank }, yard { x0, x1, z0, z1 }, road { z, w }, paths, trees }
export function gatelandsQuarry(o = {}, r = stream('quarry')) {
  const std = (c, ro = .9, x = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: ro, ...x }); const MI = millMats();
  const M = { turf: MI.turf, track: mat('turfDry', { ns: 1.0, color: 0x9a8a6c, rough: 1 }), floor: mat('rock', { ns: 1.0, color: 0xb8b2a4, rough: 1 }), face: mat('rock', { ns: 1.4, color: 0xcfccc2, rough: .95 }),
    wall: mat('stone', { ns: 1.3, color: 0xa8a49a, rough: .95 }), dress: MI.dress, spoil: mat('rock', { ns: 1.6, color: 0x9c968a, rough: 1 }), lime: MI.lime, timber: MI.timber, thatch: MI.thatch,
    rope: std(0x8a7650, .95), iron: MI.iron, dark: std(0x0c0a08, 1), bark: std(0x5e564c, .95), leaf: std(0x56682a, .85), haw: std(0x3a4624, .9) };
  const B = new Map(), key = String(o.key || 'quarry'), F = stream(key + ':lie'), ph = Array.from({ length: 10 }, () => F() * 6.283), V3 = (x, y, z) => new THREE.Vector3(x, y, z);
  const put = (geo, k, x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0, uv = .5) => { const g = geo.index ? geo.toNonIndexed() : geo; for (const a of Object.keys(g.attributes)) if (!['position', 'normal'].includes(a)) g.deleteAttribute(a);
    if (!g.attributes.normal) g.computeVertexNormals(); g.applyMatrix4(new THREE.Matrix4().compose(V3(x, y, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(rx, ry, rz, 'YXZ')), V3(1, 1, 1))); worldUV(g, uv);
    if (!B.has(k)) B.set(k, []); B.get(k).push(g); return g; };
  const rod = (k, a, b, rad, seg = 6, taper = 1) => { const A = V3(...a), C = V3(...b), d = C.clone().sub(A), g = new THREE.CylinderGeometry(rad * taper, rad, d.length(), seg);
    g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(V3(0, 1, 0), d.clone().normalize())); g.translate((A.x + C.x) / 2, (A.y + C.y) / 2, (A.z + C.z) / 2); return put(g, k); };
  const sm = t => { t = Math.min(1, Math.max(0, t)); return t * t * (3 - 2 * t); };
  // the land: the hill rises to -z over 22 m from the mouth's line to about 7 m, then on at 1 in 40; below the mouth it falls to the lane at 1 in 30
  const RZ = 16, RW = 3.4, PX0 = -9, PX1 = 9, PZ0 = -14, BZ = -11.5, BENCH = 3.0, MZ = 5, FY = 0, DEP = 1.2;
  const hill = (x, z) => 7 * sm((4 - z) / 22) + Math.max(0, -18 - z) / 40 - (z - 4) / 30 + .14 * Math.sin(x * .13 + ph[0]) * Math.sin(z * .11 + ph[1]) + .05 * Math.sin(x * .41 + z * .37 + ph[2]);
  // the kiln east of the mouth, its yard levelled to the floor before it and the bank behind built up to its top
  const KX = 15, KW = 5, KZ0 = -7, KZ1 = -1, KT = 4.4, YX0 = 11.5, YX1 = 18.5, YZ0 = KZ1, YZ1 = 7;
  const inPit = (x, z) => x > PX0 - 1e-6 && x < PX1 + 1e-6 && z > PZ0 - 1e-6 && z < MZ + 1e-6 /* the boundary's own vertices count as in, so the land's step falls behind the faces */;
  const base = (x, z) => { let b = hill(x, z);
    const dy = Math.max(YX0 - x, x - YX1, YZ0 - z, z - YZ1, 0), wy = 1 - sm(dy / 3); if (z > YZ0 - .01) b += (FY - b) * wy;
    const db = Math.max(Math.abs(x - KX) - KW / 2 - .6, z - KZ0, (KZ0 - 3.5) - z, 0), wb = 1 - sm(db / 3); b += (KT - .3 - b) * wb /* the bank behind made up (or cut) to a terrace 0.3 m under the top */;
    if (Math.abs(x - KX) < KW / 2 + 1e-6 && z > KZ1 - 1.7 && z <= KZ1 + 1e-6) b = FY /* the arch's floor, level with the yard to the kiln's core */;
    return b; };
  const roadY = x => base(x, RZ), outside = (x, z) => { const b = base(x, z), rw = sm((RW / 2 + 1.0 - Math.abs(z - RZ)) / 1.0); return b + (roadY(x) - .04 * Math.min(1, Math.abs(z - RZ) / (RW / 2)) - b) * rw; };
  const ground = (x, z) => inPit(x, z) ? (z > BZ - 1e-6 ? FY : BENCH - .05) : outside(x, z);
  // the paths: from the lane up the track into the pit, round the shear legs on their west, to the lower face; and from the track to the kiln's arch
  const paths = [[[2, RZ], [1, 8], [0, MZ - 1], [-2.6, BZ + 7], [-2.6, BZ + 1.1]], [[1, 8], [10, 8], [KX, KZ1 + 2.2]]];
  const segD = (x, z, a, b) => { const dx = b[0] - a[0], dz = b[1] - a[1], t = Math.max(0, Math.min(1, ((x - a[0]) * dx + (z - a[1]) * dz) / (dx * dx + dz * dz))); return Math.hypot(x - a[0] - dx * t, z - a[1] - dz * t); };
  const pathD = (x, z) => Math.min(...paths.flatMap(p => p.slice(0, -1).map((q, i) => segD(x, z, q, p[i + 1]))));
  { const steps = (bands, end) => { const v = []; for (const [a, b, st] of bands) for (let q = a; q < b - 1e-6; q += st) v.push(+q.toFixed(2)); v.push(end); return v; };
    const gx = steps([[-160, -40, 24], [-40, -16, 2], [-16, 24, .5], [24, 40, 2], [40, 160, 24]], 160), gz = steps([[-160, -40, 24], [-40, -22, 2], [-22, 20, .5], [20, 40, 2], [40, 160, 24]], 160);
    const pos = [], NX = gx.length, I = { turf: [], track: [], floor: [] }; for (const z of gz) for (const x of gx) pos.push(x, ground(x, z), z);
    for (let j = 0; j + 1 < gz.length; j++) for (let i = 0; i + 1 < NX; i++) { const a = j * NX + i, b = a + 1, c = a + NX, d = c + 1, cx = (gx[i] + gx[i + 1]) / 2, cz = (gz[j] + gz[j + 1]) / 2;
      I[inPit(cx, cz) ? 'floor' : Math.abs(cz - RZ) < RW / 2 + .1 || pathD(cx, cz) < .8 || (cx > YX0 && cx < YX1 && cz > YZ0 && cz < YZ1) ? 'track' : 'turf'].push(a, c, b, b, c, d); }
    for (const [k, idx] of Object.entries(I)) { const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals(); put(g, k, 0, 0, 0, 0, 0, 0, .35); } }
  // the beds: one set of strata for the whole hill, from the floor up past the top; each block of a face one bed high and one joint long
  const beds = []; for (let y = FY; y < 9;) { const t = .35 + F() * .35, y1 = Math.abs(y - BENCH) < .9 && y < BENCH ? BENCH : y + t; beds.push([+y.toFixed(3), +y1.toFixed(3)]); y = y1; }
  const faces = [];
  // face(f, along, a0, a1, at, out, lo): blocks along x (or z) from a0 to a1, their face on the line `at`, reaching `out` into the hill (signed), from the bed at lo up to the turf
  const face = (f, alongZ, a0, a1, at, out, lo, hiCap = 99) => { for (let s = a0; s < a1 - .05;) { const L = Math.min(a1 - s, .8 + F() * 1.4); const s1 = a1 - (s + L) < .4 ? a1 : s + L;
      const x0 = alongZ ? Math.min(at, at + out) : s, x1 = alongZ ? Math.max(at, at + out) : s1, z0 = alongZ ? s : Math.min(at, at + out), z1 = alongZ ? s1 : Math.max(at, at + out);
      const topAt = (x, z) => Math.min(hiCap, outside(x, z) - .15) /* the rock stops under a band of soil, the turf's own edge above it */, tMax = Math.max(topAt(x0, z0), topAt(x1, z0), topAt(x0, z1), topAt(x1, z1));
      for (const [b0, b1] of beds) { if (b0 < lo - 1e-6 || b0 > tMax - .05) continue; const sb = F() * .08 + (beds.findIndex(q => q[0] === b0) % 3 === 1 ? .05 : 0) /* each block stands proud of the face line by its own few centimetres, never behind it */;
        const cx = (x0 + x1) / 2 + (alongZ ? -Math.sign(out) * sb : 0), cz = (z0 + z1) / 2 + (alongZ ? 0 : -Math.sign(out) * sb), w = x1 - x0 + (alongZ ? 0 : .012), d = z1 - z0 + (alongZ ? .012 : 0), my = (b0 + b1) / 2 /* each block overlaps the next by 12 mm, so no hairline shows the sky through */;
        const g = new THREE.BoxGeometry(w, b1 - b0, d); g.deleteAttribute('normal'); const Pg = g.attributes.position; let y1 = b0;
        for (let i = 0; i < Pg.count; i++) { const cap = topAt(cx + Pg.getX(i), cz + Pg.getZ(i)), bot = Math.max(lo, Math.min(b0, cap)), yv = Pg.getY(i) > 0 ? Math.max(bot, Math.min(b1, cap)) : bot; Pg.setY(i, yv - my); y1 = Math.max(y1, yv); }
        /* every bed is cut off by the turf over it: where the soil comes down, a bed thins to nothing, and the bed above starts where it stops */
        put(g, 'face', cx, my, cz, 0, 0, 0, .45) /* butted, no gap: the joints show by the blocks' setbacks */;
        faces.push({ f, x0: +(cx - w / 2).toFixed(3), x1: +(cx + w / 2).toFixed(3), y0: b0, y1: +y1.toFixed(3), z0: +(cz - d / 2).toFixed(3), z1: +(cz + d / 2).toFixed(3) }); }
      s = s1; } };
  face('back', false, PX0, PX1, BZ, -(BZ - PZ0), FY, BENCH) /* the lower lift: its blocks run back under the bench, whose floor is their tops */;
  face('upper', false, PX0 - DEP, PX1 + DEP, PZ0, -DEP, BENCH);
  for (const [f, at, sg] of [['west', PX0, -1], ['east', PX1, 1]]) { let zEnd = PZ0; for (let z = PZ0; z < MZ + 6; z += .25) if (outside(at + sg * .1, z) > FY + .25) zEnd = z; face(f, true, BZ, Math.min(zEnd, MZ + 4), at, sg * DEP, FY); face(f, true, PZ0, BZ, at, sg * DEP, BENCH); }
  // the rim's wall: dry stone, 1.1 m over the turf, 1.6 m back from the faces, wherever the drop below it is more than 1.2 m
  const WH = 1.1, WB = 1.6, wallRuns = []; { const course = (x, z, alongZ, L) => { const gy = outside(x, z), n = 5, ch = WH / n; for (let c = 0; c < n; c++) put(new THREE.BoxGeometry(alongZ ? .62 - c * .05 : L - .02, ch - .012, alongZ ? L - .02 : .62 - c * .05), 'wall', x + (alongZ ? 0 : (c % 2) * .05), gy - .08 + c * ch + ch / 2, z + (alongZ ? (c % 2) * .05 : 0), 0, (F() - .5) * .04); };
    const WC = .31, run = [[PX0 - WB - WC, PZ0 - WB, PX1 + WB + WC, false]]; for (let x = PX0 - WB - WC; x < PX1 + WB + WC - .05; x += .5) course(x + Math.min(.25, (PX1 + WB + WC - x) / 2), PZ0 - WB, false, Math.min(.5, PX1 + WB + WC - x)) /* the back's run past both corners */;
    for (const [at, sg] of [[PX0, -1], [PX1, 1]]) { let z1 = PZ0; for (let z = PZ0 - WB; z < MZ; z += .5) if (outside(at + sg * WB, z) - (z > BZ ? FY : BENCH) > 1.2) z1 = z + .5; for (let z = PZ0 - WB + WC; z < z1 - .05; z += .5) course(at + sg * WB, z + .25, true, .5); run.push([at + sg * WB, PZ0 - WB + WC, z1, true]); }
    wallRuns.push(...run.map(q => q.map(v => typeof v === 'number' ? +v.toFixed(2) : v))); }
  // the spoil heap along the west face's foot: a long mound of rubble, its stones on it
  const lying = []; { const HX = PX0 + 1.7, HZ0 = BZ + 4, HZ1 = MZ - 3, hh = 1.3, g = new THREE.CylinderGeometry(.01, 1, 1, 14, 3, true); g.scale(1.9, hh, (HZ1 - HZ0) / 2); const P = g.attributes.position; for (let i = 0; i < P.count; i++) P.setY(i, P.getY(i) + (P.getY(i) < 0 ? -.04 : .06 * Math.sin(i * 1.7)));
    put(g, 'spoil', HX, hh / 2 - .02, (HZ0 + HZ1) / 2, 0, 0, 0, .4);
    for (let k = 0; k < 70; k++) { const t = F(), a = F() * 6.283, rr = Math.sqrt(F()), x = HX + Math.cos(a) * 1.9 * rr, z = (HZ0 + HZ1) / 2 + Math.sin(a) * (HZ1 - HZ0) / 2 * rr, y = hh * (1 - rr) - .02, q = .08 + t * .14; if (x < PX0 + .15) continue; put(new THREE.IcosahedronGeometry(q, 0).scale(1.3, .7, 1), 'spoil', x, y + q * .3, z, F(), F() * 3); } }
  // rough blocks where they fell, and the block being split: a row of wedges (plug and feathers) in holes along its top
  const rough = []; for (let k = 0, n = 0; k < 400 && n < 7; k++) { const x = PX0 + 3.5 + F() * (PX1 - PX0 - 5), z = BZ + 1.5 + F() * (MZ - BZ - 4); if (pathD(x, z) < 1.4 || Math.abs(x) < 3 && z < BZ + 7.5 || x > 3 && z > MZ - 7 || rough.some(q => Math.hypot(q.x - x, q.z - z) < 2.2)) continue; n++;
    const w = .6 + F() * .7, h = .4 + F() * .4, d = .5 + F() * .5, ry = F() * 3; put(new THREE.BoxGeometry(w, h, d), 'face', x, h / 2 - .01, z, 0, ry, (F() - .5) * .06); rough.push({ x: +x.toFixed(2), z: +z.toFixed(2), h: +h.toFixed(2), r: Math.hypot(w, d) / 2 }); }
  const WX = 4.2, WZ = BZ + 2.2, WL = 2.4, WHt = .9, WD = 1.0, NW = 7; put(new THREE.BoxGeometry(WL, WHt, WD), 'face', WX, WHt / 2, WZ);
  for (let k = 0; k < NW; k++) { const x = WX - WL / 2 + .3 + k * (WL - .6) / (NW - 1); put(new THREE.CylinderGeometry(.022, .016, .16, 5), 'iron', x, WHt + .06, WZ); for (const s of [-1, 1]) put(new THREE.BoxGeometry(.012, .1, .03), 'iron', x + s * .022, WHt + .03, WZ); }
  put(new THREE.BoxGeometry(WL, .006, .006), 'dark', WX, WHt + .002, WZ) /* the line of the holes */;
  // the stack of squared blocks by the mouth and the stone cart beside it
  const SX = 6.2, SZ = MZ - 3.2; for (let l = 0; l < 2; l++) for (let k = 0; k < 3 - l; k++) put(new THREE.BoxGeometry(.9, .55, .6), 'dress', SX - .5 + k * .95 + l * .48, .275 + l * .56, SZ, 0, (F() - .5) * .04);
  const cart = { x: SX + .2, z: SZ + 2.2, r: .62 }; { const { x, z, r: R } = cart; for (const s of [-1, 1]) { put(new THREE.CylinderGeometry(R, R, .09, 16).rotateZ(Math.PI / 2), 'timber', x + s * .75, R, z); put(new THREE.TorusGeometry(R, .025, 4, 16).rotateY(Math.PI / 2), 'iron', x + s * .79, R, z); }
    rod('iron', [x - .85, R, z], [x + .85, R, z], .04); put(new THREE.BoxGeometry(1.3, .08, 1.7), 'timber', x, R + .1, z); for (const s of [-1, 1]) rod('timber', [x + s * .45, R + .1, z + .8], [x + s * .4, .05, z + 2.5], .05); put(new THREE.BoxGeometry(.8, .4, .6), 'dress', x, R + .34, z - .2); }
  // the shear legs: two poles leaning over the floor to a lashed head 6.5 m up, guyed back to a stake; the tackle and a block in its chain sling; the crab winch at the east foot
  const CZ = BZ + 3.2, CFZ = BZ + 5.5, apex = [0, 6.5, CZ], feet = [[-1.5, FY, CFZ], [1.5, FY, CFZ]], stake = [0, FY, BZ + 13.5];
  for (const f of feet) { rod('timber', f, apex, .11, 8, .75); put(new THREE.BoxGeometry(.32, .08, .32), 'timber', f[0], .04, f[2]); }
  for (let k = 0; k < 6; k++) put(new THREE.TorusGeometry(.14, .02, 4, 10).rotateX(Math.PI / 2), 'rope', 0, apex[1] - .3 + k * .05, CZ) /* the lashing */;
  rod('rope', [0, apex[1] - .1, CZ], stake, .018, 5); put(new THREE.CylinderGeometry(.05, .05, .5, 6), 'timber', stake[0], .2, stake[2], -.3);
  const LW = 1.2, LD = .8, LH = .7, LY0 = .55; rod('rope', [0, apex[1] - .35, CZ], [0, LY0 + LH + .55, CZ], .02, 5); put(new THREE.BoxGeometry(.14, .26, .1), 'timber', 0, LY0 + LH + .5, CZ) /* the lower block */;
  put(new THREE.BoxGeometry(LW, LH, LD), 'face', 0, LY0 + LH / 2, CZ); for (const s of [-1, 1]) { rod('iron', [0, LY0 + LH + .4, CZ], [s * LW * .38, LY0 + LH, CZ], .012, 4); put(new THREE.BoxGeometry(.02, LH + .02, LD + .02), 'iron', s * LW * .38, LY0 + LH / 2, CZ); }
  { const [fx, , fz] = feet[1], wx = fx + .7, wz = fz + .4; for (const s of [-1, 1]) { rod('timber', [wx + s * .35, 0, wz - .3], [wx + s * .35, .9, wz], .05); rod('timber', [wx + s * .35, 0, wz + .3], [wx + s * .35, .9, wz], .05); }
    put(new THREE.CylinderGeometry(.13, .13, .7, 10).rotateZ(Math.PI / 2), 'timber', wx, .82, wz); for (const s of [-1, 1]) { rod('iron', [wx + s * .42, .82, wz], [wx + s * .42, .82 + .3, wz + .1], .02); rod('iron', [wx + s * .42, 1.12, wz + .1], [wx + s * .6, 1.12, wz + .1], .02); }
    rod('rope', [wx, .95, wz], [feet[1][0] * .2, apex[1] - .4, CZ], .015, 4); }
  // the mason's lean-to on the floor by the west side, and the banker under it with a block on it, mallet and chisels
  const LX = PX0 + 2.4, LZ = MZ - 2.0, LWd = 3.0, LDp = 2.2; { for (const [dx, dz, h] of [[-1, -1, 2.5], [1, -1, 2.5], [-1, 1, 2.0], [1, 1, 2.0]]) put(new THREE.BoxGeometry(.14, h, .14), 'timber', LX + dx * LDp / 2, h / 2, LZ + dz * LWd / 2);
    for (let k = 0; k < 6; k++) put(new THREE.BoxGeometry(.04, 2.3, LWd / 6 - .02), 'timber', LX - LDp / 2 - .06, 1.15, LZ - LWd / 2 + (k + .5) * LWd / 6, 0, 0, 0) /* its back boards, to the west */;
    put(new THREE.BoxGeometry(LDp + .5, .22, LWd + .4), 'thatch', LX, 2.3, LZ, 0, 0, -Math.atan2(.5, LDp)); }
  const banker = { x: LX + .2, z: LZ, top: .85 }; put(new THREE.BoxGeometry(.6, .85, 1.2), 'dress', banker.x, .425, banker.z); put(new THREE.BoxGeometry(.4, .3, .5), 'face', banker.x, .85 + .15, banker.z + .1, 0, .2);
  rod('timber', [banker.x - .1, .87, banker.z - .45], [banker.x + .15, .87, banker.z - .25], .025); put(new THREE.CylinderGeometry(.07, .07, .16, 8).rotateZ(Math.PI / 2), 'timber', banker.x + .17, .9, banker.z - .24, 0, .7);
  for (let k = 0; k < 3; k++) rod('iron', [banker.x + .2, .86, banker.z + .45 + k * .05], [banker.x - .02, .86, banker.z + .4 + k * .05], .007, 4);
  // the kiln: a battered core of rubble with a front wall through which the draw arch is cut; the eye dark at the arch's back; the pot on top
  const AW = 1.6, AH = 2.3, ADP = 1.1, KF = KZ1 - ADP; { const g = new THREE.BoxGeometry(KW, KT, KZ1 - ADP - KZ0, 4, 4, 4); const P = g.attributes.position; for (let i = 0; i < P.count; i++) { const t = (P.getY(i) + KT / 2) / KT; P.setX(i, P.getX(i) * (1 - .1 * t)); } g.computeVertexNormals();
    put(g, 'wall', KX, KT / 2 - .05, (KZ0 + KF) / 2, 0, 0, 0, .5);
    const sh = new THREE.Shape(); sh.moveTo(-KW / 2, -.05); sh.lineTo(-AW / 2, -.05); sh.lineTo(-AW / 2, AH - AW / 2); sh.absarc(0, AH - AW / 2, AW / 2, Math.PI, 0, true); sh.lineTo(AW / 2, -.05);
    sh.lineTo(KW / 2, -.05); sh.lineTo(KW / 2 * .92, KT); sh.lineTo(-KW / 2 * .92, KT); sh.closePath() /* the front's outline runs round the arch, so the arch is open to the ground */;
    const fw = new THREE.ExtrudeGeometry(sh, { depth: ADP, bevelEnabled: false, curveSegments: 10 }); fw.translate(0, 0, -ADP); put(fw, 'wall', KX, 0, KZ1, 0, 0, 0, .5);
    const ring = new THREE.ExtrudeGeometry((() => { const s = new THREE.Shape(); s.absarc(0, 0, AW / 2 + .28, 0, Math.PI, false); s.lineTo(-AW / 2, 0); s.absarc(0, 0, AW / 2, Math.PI, 0, true); s.lineTo(AW / 2 + .28, 0); return s; })(), { depth: .06, bevelEnabled: false, curveSegments: 10 });
    put(ring, 'dress', KX, AH - AW / 2, KZ1 - .02) /* the arch's voussoirs */;
    { const s2 = new THREE.Shape(); s2.moveTo(-AW / 2, 0); s2.lineTo(AW / 2, 0); s2.lineTo(AW / 2, AH - AW / 2); s2.absarc(0, AH - AW / 2, AW / 2, 0, Math.PI, false); s2.closePath(); put(new THREE.ShapeGeometry(s2, 10), 'dark', KX, 0, KF + .015); } /* the arch's back, black with soot over the eye where the burnt lime is drawn */
    for (let k = 0; k < 9; k++) { const q = .1 + F() * .1; put(new THREE.IcosahedronGeometry(q, 0).scale(1.2, .6, 1), 'lime', KX + (F() - .5) * 1.1, q * .25, KF + .3 + F() * 1.4, F(), F() * 3); }
    const PR = 1.15, py = KT - .05; put(new THREE.CircleGeometry(PR, 20).rotateX(-Math.PI / 2), 'dark', KX, py + .012, (KZ0 + KF) / 2); put(new THREE.TorusGeometry(PR + .12, .14, 4, 20).rotateX(Math.PI / 2).scale(1, 1, 1), 'dress', KX, py + .02, (KZ0 + KF) / 2);
    for (let k = 0; k < 7; k++) { const q = .14 + F() * .1; put(new THREE.IcosahedronGeometry(q, 0), 'face', KX - 1.6 + F() * 3.2, base(KX, KZ0 - 1.6) + q * .4, KZ0 - 1.1 - F() * 1.6, F(), F() * 3); } /* broken stone on the bank, to charge her */ }
  // trees on the hill: ash and thorn, clear of the pit, the rim's wall, the kiln and the lane
  const trees = [], tree = (x, z, h, thorn) => { const gy = outside(x, z), top = [x + (thorn ? 1.2 : 0), gy + h * (thorn ? .55 : .5), z]; rod('bark', [x, gy - .3, z], top, thorn ? .12 : .16 + h * .013, 7, .7);
    for (let l = 0; l < (thorn ? 3 : 5); l++) { const a = l * 1.3 + F(), L = (thorn ? .9 : 1.6) + F() * 1.2, e = [top[0] + Math.cos(a) * L + (thorn ? .8 : 0), top[1] + (thorn ? .2 : .8) + l * (thorn ? .2 : .55) + F() * .6, top[2] + Math.sin(a) * L]; rod('bark', [top[0], top[1] - .5 + l * .2, top[2]], e, .06, 5, .6);
      for (let c2 = 0; c2 < 3; c2++) put(new THREE.IcosahedronGeometry((thorn ? .6 : .9) + F() * .5, 0).scale(1.15, .75, 1.15), thorn ? 'haw' : 'leaf', e[0] + (F() - .5) * 1.4, e[1] + (F() - .4), e[2] + (F() - .5) * 1.4, F(), F() * 3); }
    trees.push({ x: +x.toFixed(2), z: +z.toFixed(2), h: +h.toFixed(2), kind: thorn ? 'thorn' : 'ash' }); };
  for (let k = 0, n = 0; k < 1500 && n < 11; k++) { const x = -45 + F() * 90, z = -45 + F() * 50 + (k % 3 === 0 ? 30 : 0), thorn = n % 3 === 2;
    if ((x > PX0 - WB - 4 && x < PX1 + WB + 4 && z > PZ0 - WB - 4 && z < MZ + 6) || (x > YX0 - 5 && x < YX1 + 5 && z > KZ0 - 8 && z < YZ1 + 3) || Math.abs(z - RZ) < RW / 2 + 4 || pathD(x, z) < 4 || trees.some(t => Math.hypot(t.x - x, t.z - z) < 8)) continue; n++; tree(x, z, thorn ? 3.5 + F() : 9 + F() * 4, thorn); }
  const group = new THREE.Group(); let tris = 0;
  for (const [k, gs] of B) { const g = mergeGeometries(gs, false); gs.forEach(x => x.dispose()); const m = new THREE.Mesh(g, M[k]); m.name = k; m.castShadow = !['turf', 'track', 'floor', 'dark'].includes(k); m.receiveShadow = true; group.add(m); tris += g.attributes.position.count / 3; }
  return { group, tris: Math.round(tris), draws: group.children.length, own: group.children.length, top: +new THREE.Box3().setFromObject(group).max.y.toFixed(2), ground, hill: outside, floor: FY,
    pit: { x0: PX0, x1: PX1, z0: PZ0, bz: BZ, bench: BENCH, mouth: MZ }, beds, faces, wall: { runs: wallRuns, h: WH, back: WB },
    crane: { feet, apex, stake, load: { x: 0, z: CZ, y0: LY0, y1: LY0 + LH, w: LW, d: LD } }, wedges: { x: WX, z: WZ, n: NW, top: WHt, l: WL }, rough, lying, cart, banker,
    kiln: { x: KX, z0: KZ0, z1: KZ1, w: KW, top: KT, arch: { w: AW, h: AH, depth: ADP }, pot: { r: 1.15, z: (KZ0 + KF) / 2 }, bank: { z: KZ0 - 1.5 } }, yard: { x0: YX0, x1: YX1, z0: YZ0, z1: YZ1 },
    road: { z: RZ, w: RW }, paths, trees };
}
// markMineHead(o, r) (Session 1204, card F8; OG-034's Mark, "a mining town with lifts and tunnels", and OG-121's mountain mines): the head of
// the Mark's silver mine, the outside that markMine's adit comes out of, after the seventeenth-century mine heads of Kongsberg and Røros: a
// terrace cut into the mountain and built out with the mine's own waste, a log house over the adit's mouth, a shaft under an open headframe,
// the horse whim that winds from it under an eight-sided roof on posts, a sorting house, and a plank tramway out to the end of the tip. Early
// winter. At true size, a metre a unit, y 0 the terrace, the hill rising to -z at about 1 in 2.6:
//   - the terrace: 39 by 18 m, level; cut into the hill behind and at the sides in a bank of rock at 50°, built out in front in grey waste at
//     35°; the tip a level tongue of waste 5 m wide pushed 5 m past the front, the tramway running on to its end on a trestle;
//   - the adit house: logs, 4.4 by 5.2 m, its back gable against the bank over the adit's mouth, a cart door 2.2 m wide in the front gable;
//     behind it the adit, a level of 3 by 2.8 m in the rock held by sets every 1.5 m (2.2 m clear, the cap at 2.3 m), dark at 14 m;
//   - the tramway: plank rails at a gauge of 0.6 m on sleepers, from the adit through the house and across the terrace to the tip's end, a
//     cart on it with its ore, a stop-block at the end;
//   - the shaft: 2 m square, 24 m deep, a collar of squared timber, a fence of two rails round it; over it a headframe of four posts and a cap
//     at 3.4 m, the sheave on the cap, two stays back toward the whim, the rope down the shaft to a kibble;
//   - the horse whim, 13 m from the sheave: an upright axle, a drum of 1 m radius from 2.2 to 3.0 m, a sweep of 5.6 m at 1.8 m for the horse,
//     its ring trodden to earth; over it an eight-sided roof of shingles on eight posts at 7.2 m, eaves 4.4 m, its cone to 9.6 m, the axle's
//     top in the crossing of two tie beams; the rope from the drum to the sheave passes under the eaves and the roof's skirt between two posts;
//   - the sorting house: logs, 5.2 by 6.4 m, its door to the tramway, a window to the valley, ore heaped by the door with a barrow;
//   - the land: the hill under snow, a track down from the terrace's east end in five legs of 1 in 7 to 1 in 14, its cuts
//     and banks at 35° from its edge, steeper between two legs near a turn; spruce round.
// -> { group, tris, draws, own, ground, hill, terrace { x0, x1, z0, z1, tongue }, adit { x, z (its mouth), w, h, len, sets [{ z, clear, cap }] },
//      aditHouse, oreHouse ({ x0, x1, z0, z1, eaves, ridge, y0, door }), rails { x, z0, z1, top, gauge, bents ([z]) }, cart { x, z },
//      shaft { x, z, w, depth, fence { half, rails } }, sheave { x, y, z, r }, drum { x, z, y0, y1, r, rope }, rope [[x, y, z]…],
//      whim { x, z, path, posts ([x, z]), r, eaves, beam, apex, sweep }, paths, track ([x, z, y] its turns), trees }
export function markMineHead(o = {}, r = stream('minehead')) {
  const std = (c, ro = .9, x = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: ro, ...x }); markTextures();
  const M = { snow: mat('plaster', { ns: .3, color: 0xf2f6fa, rough: .95 }), trod: mat('plaster', { ns: .6, color: 0xb4bac4, rough: .9 }), yard: mat('plaster', { ns: .7, color: 0xa29c94, rough: .95 }),
    earth: mat('turfDry', { ns: 1.0, color: 0x6a5a48, rough: 1 }), spoil: mat('rock', { ns: 1.6, color: 0x7a766e, rough: 1 }), bank: mat('rock', { ns: 1.3, color: 0x6a665f, rough: .95 }),
    log: mat('beam', { ns: 1.2, color: 0xa88866, rough: .9 }), end: std(0x9c7c5a, .9), board: mat('wood', { ns: .9, color: 0x6a5440, rough: .9 }), turf: mat('turfDry', { ns: 1.2, color: 0x8a7a5a, rough: 1 }),
    shingle: mat('wood', { ns: 1.4, color: 0x54463a, rough: .9 }), timber: mat('beam', { ns: 1.0, color: 0x8a6c4c, rough: .9 }), tunnel: mat('rock', { ns: 1.5, color: 0x5e5a54, rough: .95 }),
    dark: std(0x0b0a09, 1), iron: std(0x2c2a28, .5, { metalness: .6 }), rope: std(0x8a7650, .95), ore: std(0x6a6e76, .35, { metalness: .8 }), bark: std(0x4a3a30, .95), needle: std(0x2a3a2a, .9) };
  M.tunnel.side = M.shingle.side = THREE.DoubleSide; M.tunnel.vertexColors = true; M.dark.fog = M.tunnel.fog = false /* the adit and the shaft stay dark from the yard */;
  const B = new Map(), key = String(o.key || 'minehead'), F = stream(key + ':lie'), ph = Array.from({ length: 8 }, () => F() * 6.283), V3 = (x, y, z) => new THREE.Vector3(x, y, z);
  const put = (geo, k, x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0, uv = .5) => { const g = geo.index ? geo.toNonIndexed() : geo; for (const a of Object.keys(g.attributes)) if (!['position', 'normal', 'color'].includes(a)) g.deleteAttribute(a);
    if (!g.attributes.normal) g.computeVertexNormals(); g.applyMatrix4(new THREE.Matrix4().compose(V3(x, y, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(rx, ry, rz, 'YXZ')), V3(1, 1, 1))); worldUV(g, uv);
    if (!B.has(k)) B.set(k, []); B.get(k).push(g); return g; };
  const rod = (k, a, b, rad, seg = 6) => { const A = V3(...a), C = V3(...b), d = C.clone().sub(A), g = new THREE.CylinderGeometry(rad, rad, d.length(), seg);
    g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(V3(0, 1, 0), d.clone().normalize())); g.translate((A.x + C.x) / 2, (A.y + C.y) / 2, (A.z + C.z) / 2); return put(g, k); };
  const sm = t => { t = Math.min(1, Math.max(0, t)); return t * t * (3 - 2 * t); };
  // the rock of the adit and the shaft, darkened by how far in or down it is, since the sky's light reaches every face: f(x, y, z) in 0 to 1
  const dim = (geo, f) => { const P = geo.attributes.position, c = new Float32Array(P.count * 3); for (let i = 0; i < P.count; i++) c.fill(f(P.getX(i), P.getY(i), P.getZ(i)), i * 3, i * 3 + 3); geo.setAttribute('color', new THREE.BufferAttribute(c, 3)); return geo; };
  // the numbers: the terrace and the tongue; the adit at x AX; the shaft at (SHX, SHZ), the sheave SHR in radius on the cap; the whim 13 m on, its
  // centre WZ set so the rope leaves the drum's side in the shaft's own line
  const TX0 = -21, TX1 = 18, TZ0 = -10, TZ1 = 8, AX = -8, AW = 3, AH = 2.8, AL = 14, TONGUE = [AX - 2.5, AX + 2.5, TZ1, 13], TEND = 16.2, GAUGE = .6, RTOP = .16;
  const SHX = -4, SHZ = 0, SHW = 2, SHD = 24, CAP = 3.4, SHR = .45, SY = CAP + .6, DR = 1.0, WX = SHX + SHR + 13, WZ = SHZ - DR, PR = 5.6, POSTR = 7.2, EAV = 4.4, APEX = 9.6, DY0 = 2.2, DY1 = 3.0, ROPE_Y = 2.4, SWEEP = 1.8;
  const T50 = Math.tan(50 * Math.PI / 180), T35 = Math.tan(35 * Math.PI / 180);
  const hill = (x, z) => .38 * (2 - z) + .35 * Math.sin(x * .09 + ph[0]) * Math.sin(z * .07 + ph[1]) + .12 * Math.sin(x * .31 + z * .23 + ph[2]);
  const rectD = (x, z, [x0, x1, z0, z1]) => Math.hypot(Math.max(x0 - x, 0, x - x1), Math.max(z0 - z, 0, z - z1)), flatD = (x, z) => Math.min(rectD(x, z, [TX0, TX1, TZ0, TZ1]), rectD(x, z, TONGUE));
  // the track: from the terrace's east end down the hill in five legs east of it, clear of the tip, each point at the hill's height but the first
  const PATH = [[TX1 - .5, 5, 0], [44, 7], [22, 15], [44, 23], [22, 31], [46, 38]].map(([x, z, y]) => [x, z, y ?? hill(x, z)]);
  // the nearest distance to the track, and its height there blended over the legs near by, so the ground between two legs of a turn is a ramp
  const pathAt = (x, z) => { const L = []; for (let i = 0; i + 1 < PATH.length; i++) { const [a, b] = [PATH[i], PATH[i + 1]], dx = b[0] - a[0], dz = b[1] - a[1], t = Math.max(0, Math.min(1, ((x - a[0]) * dx + (z - a[1]) * dz) / (dx * dx + dz * dz)));
    L.push([Math.hypot(x - a[0] - dx * t, z - a[1] - dz * t), a[2] + (b[2] - a[2]) * t]); } const d = Math.min(...L.map(q => q[0])); let sw = 0, sy = 0; for (const [di, yi] of L) { const w = Math.exp(-(di - d) / .4); sw += w; sy += w * yi; } return { d, y: sy / sw }; };
  const shaped = (x, z) => { const d = flatD(x, z); return Math.max(-d * T35, Math.min(d * T50, hill(x, z))); };
  const ground = (x, z) => { const g = shaped(x, z); if (flatD(x, z) <= 0) return g; const p = pathAt(x, z), e = Math.max(0, p.d - 1.4) * T35; return Math.min(p.y + e, Math.max(p.y - e, g)) /* the track's bed, its cuts and fills at 35° */; };
  const inBand = (x, z) => Math.abs(x - AX) < AW / 2 && z < TZ0 && z > TZ0 - 5 && ground(x, z) < AH + 1.0 /* the bank over the adit's mouth, cut away: the adit house covers it */;
  const inShaft = (x, z) => Math.abs(x - SHX) < SHW / 2 && Math.abs(z - SHZ) < SHW / 2;
  { const steps = (bands, end) => { const v = []; for (const [a, b, st] of bands) for (let q = a; q < b - 1e-6; q += st) v.push(+q.toFixed(2)); v.push(end); return v; };
    const gx = steps([[-160, -40, 20], [-40, -26, 2], [-26, -12, 1], [-12, -3, .5], [-3, 36, 1], [36, 50, 2], [50, 160, 20]], 160), gz = steps([[-160, -40, 20], [-40, -16, 2], [-16, -15, 1], [-15, -8, .5], [-8, 22, 1], [22, 44, 2], [44, 160, 20]], 160);
    const pos = [], NX = gx.length, I = {}; for (const z of gz) for (const x of gx) pos.push(x, ground(x, z), z);
    for (let j = 0; j + 1 < gz.length; j++) for (let i = 0; i + 1 < NX; i++) { const a = j * NX + i, b = a + 1, c = a + NX, d = c + 1, cx = (gx[i] + gx[i + 1]) / 2, cz = (gz[j] + gz[j + 1]) / 2;
      if (inBand(cx, cz) || inShaft(cx, cz)) continue; const g = ground(cx, cz), h = hill(cx, cz), fd = flatD(cx, cz);
      const off = pathAt(cx, cz).d > 4.1 /* the track's own cuts and banks lie under the snow */, k = fd < 1e-6 ? (Math.abs(Math.hypot(cx - WX, cz - WZ) - PR) < .8 ? 'earth' : 'yard')
        : off && g > h + .15 && rectD(cx, cz, TONGUE) <= rectD(cx, cz, [TX0, TX1, TZ0, TZ1]) ? 'spoil' /* the tip's fresh waste; the terrace's old fill is under snow */ : off && g < h - .15 ? 'bank' : 'snow';
      (I[k] = I[k] || []).push(a, c, b, b, c, d); }
    for (const [k, idx] of Object.entries(I)) { const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals(); put(g, k, 0, 0, 0, 0, 0, 0, .35); } }
  // the track: a trodden ribbon 2.4 m wide, five vertices across, laid 3 cm over the ground every half metre
  { const pts = []; for (let i = 0; i + 1 < PATH.length; i++) { const [a, b] = [PATH[i], PATH[i + 1]], n = Math.ceil(Math.hypot(b[0] - a[0], b[1] - a[1]) / .5); for (let k = i ? 1 : 0; k <= n; k++) pts.push([a[0] + (b[0] - a[0]) * k / n, a[1] + (b[1] - a[1]) * k / n]); }
    const pos = [], idx = []; pts.forEach(([x, z], i) => { const [p, q] = [pts[Math.max(0, i - 1)], pts[Math.min(pts.length - 1, i + 1)]], dx = q[0] - p[0], dz = q[1] - p[1], l = Math.hypot(dx, dz);
      for (const sd of [-1, -.5, 0, .5, 1]) { const ex = x + dz / l * 1.2 * sd, ez = z - dx / l * 1.2 * sd; pos.push(ex, ground(ex, ez) + .03, ez); } if (i) { const o2 = (i - 1) * 5; for (let c = 0; c < 4; c++) idx.push(o2 + c, o2 + c + 5, o2 + c + 1, o2 + c + 1, o2 + c + 5, o2 + c + 6); } });
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals();
    if (g.attributes.normal.array.reduce((t, v, j) => j % 3 === 1 ? t + v : t, 0) < 0) { g.setIndex(idx.map((v, j) => idx[j - j % 3 + [0, 2, 1][j % 3]])); g.computeVertexNormals(); } put(g, 'trod', 0, 0, 0, 0, 0, 0, .35); }
  // the adit: its floor, walls and roof in the rock, dark at its end; a set every 1.5 m, two posts and a cap, lagging boards over the caps
  const sets = []; { const zc = TZ0 - AL / 2, fa = (x, y, z) => Math.max(.05, 1 - Math.max(0, AL / 2 - z - 1) / 4.5) /* local z: the mouth at AL / 2 */;
    put(dim(new THREE.PlaneGeometry(AW, AL, 1, 14).rotateX(-Math.PI / 2), fa), 'tunnel', AX, 0, zc); put(dim(new THREE.PlaneGeometry(AW, AL, 1, 14).rotateX(Math.PI / 2), fa), 'tunnel', AX, AH, zc);
    for (const s of [-1, 1]) put(dim(new THREE.PlaneGeometry(AL, AH, 14, 1).rotateY(Math.PI / 2), fa), 'tunnel', AX + s * AW / 2, AH / 2, zc); put(new THREE.PlaneGeometry(AW, AH), 'dark', AX, AH / 2, TZ0 - AL + .02);
    for (let z = TZ0 - .6; z > TZ0 - AL + 1; z -= 1.5) { for (const s of [-1, 1]) put(new THREE.BoxGeometry(.2, 2.3, .2), 'timber', AX + s * 1.2, 1.15, z); put(new THREE.BoxGeometry(2.8, .2, .22), 'timber', AX, 2.4, z); sets.push(+z.toFixed(2)); }
    put(new THREE.BoxGeometry(2.8, .04, sets[0] - sets[sets.length - 1] + .3), 'board', AX, 2.52, (sets[0] + sets[sets.length - 1]) / 2); }
  // the rock over the adit's first metres, where its roof stands proud of the bank's 50°: a block from the house's back gable into the bank
  put(new THREE.BoxGeometry(AW + .6, AH + 1.1 - AH + .02, 3.3), 'bank', AX, AH + .55, TZ0 - .1 - 1.65);
  // logs: along x or z between a0 and a1, open cylinders with the cut ends showing; a wall's course cut round its holes
  const R = .13, STEP = .21, OUT = .3;
  const log = (ax, a0, a1, c, y) => { const L = a1 - a0, m = (a0 + a1) / 2, g = new THREE.CylinderGeometry(R, R * 1.04, L, 8, 1, true);
    if (ax === 'x') { g.rotateZ(Math.PI / 2); put(g, 'log', m, y, c, 0, 0, 0, .6); for (const e of [a0, a1]) put(new THREE.CircleGeometry(R * .98, 8).rotateY(e < m ? -Math.PI / 2 : Math.PI / 2), 'end', e, y, c); }
    else { g.rotateX(Math.PI / 2); put(g, 'log', c, y, m, 0, 0, 0, .6); for (const e of [a0, a1]) put(new THREE.CircleGeometry(R * .98, 8).rotateY(e < m ? Math.PI : 0), 'end', c, y, e); } };
  const course = (ax, a0, a1, c, y, holes) => { let segs = [[a0, a1]]; for (const h of holes) if (y > h.y0 - R * .5 && y < h.y1 + R) segs = segs.flatMap(([s, e]) => [[s, Math.min(e, h.c - h.w / 2)], [Math.max(s, h.c + h.w / 2), e]]).filter(([s, e]) => e - s > .12);
    for (const [s, e] of segs) log(ax, s, e, c, y); };
  // a log house: the side walls along z at x = cx ± hw, nc courses; the gables along x at z = cz ± hd, half a course up; the ridge along z; a
  // roof of boards, turf and snow; holes [{ wall: 'x-' | 'x+' | 'z-' | 'z+', c (along the wall), w, y0, y1 }]
  const house = (cx, cz, hw, hd, nc, holes) => { const Y0 = .2, H = w => holes.filter(h => h.wall === w);
    for (let k = 0; k < nc; k++) { const y = Y0 + R + k * STEP; course('z', cz - hd - OUT, cz + hd + OUT, cx - hw, y, H('x-')); course('z', cz - hd - OUT, cz + hd + OUT, cx + hw, y, H('x+')); }
    for (let k = 0; k < nc - 1; k++) { const y = Y0 + R + STEP / 2 + k * STEP; course('x', cx - hw - OUT, cx + hw + OUT, cz - hd, y, H('z-')); course('x', cx - hw - OUT, cx + hw + OUT, cz + hd, y, H('z+')); }
    const eav = Y0 + R + (nc - 1) * STEP, P = .5, ridge = eav + R + hw * Math.tan(P);
    for (let y = Y0 + R + STEP / 2 + (nc - 1) * STEP; y < ridge - .2; y += STEP) { const hl = (ridge - R - y) / Math.tan(P); if (hl < .25) break; for (const z of [cz - hd, cz + hd]) log('x', cx - hl, cx + hl, z, y); }
    for (const x of [cx - hw, cx + hw]) for (const z of [cz - hd, cz + hd]) put(new THREE.BoxGeometry(.45, Y0 + .3, .45), 'bank', x, (Y0 + .3) / 2 - .3, z, 0, F() * .3);
    const run = hw + .6, sl = run / Math.cos(P), RL = 2 * hd + 1.2;
    for (const s of [-1, 1]) { const n = [s * Math.sin(P), Math.cos(P)], cyb = ridge - run / 2 * Math.tan(P); let off = 0;
      for (const [k, th] of [['board', .05], ['turf', .12], ['snow', .2]]) { const g = k === 'snow' ? new RoundedBoxGeometry(sl + .04, th, RL + .02, 2, .07) : new THREE.BoxGeometry(sl, th, RL); put(g, k, cx + s * run / 2 + n[0] * (off + th / 2), cyb + n[1] * (off + th / 2), cz, 0, 0, -s * P, .5); off += th; } }
    put(new RoundedBoxGeometry(.34, .16, RL + .02, 2, .06), 'snow', cx, ridge + .37 / Math.cos(P), cz) /* the snow over the ridge, closing the seam between the slopes */;
    return { x0: cx - hw, x1: cx + hw, z0: cz - hd, z1: cz + hd, eaves: +eav.toFixed(3), ridge: +ridge.toFixed(3), y0: Y0 }; };
  // the adit house over the mouth, its cart doors on the tramway's line; the sorting house, its door to the tramway and its window to the valley
  const AHW = 2.2, AHD = 2.6, aditHouse = house(AX, TZ0 + AHD, AHW, AHD, 13, [{ wall: 'z-', c: AX, w: 2.2, y0: 0, y1: 2.3 }, { wall: 'z+', c: AX, w: 2.2, y0: 0, y1: 2.3 }]);
  for (const z of [TZ0, TZ0 + 2 * AHD]) { for (const s of [-1, 1]) put(new THREE.BoxGeometry(.12, 2.3, .28), 'board', AX + s * 1.16, 1.15, z); put(new THREE.BoxGeometry(2.44, .14, .28), 'board', AX, 2.37, z); }
  { const z = TZ0 + 2 * AHD + .18; put(new THREE.BoxGeometry(1.1, 2.2, .05), 'board', AX - 1.7, 1.12, z + .5, 0, -1.2) /* one leaf swung back against the wall */; }
  const OHX = -17, OHZ = -1, OHW = 2.6, OHD = 3.2, ODZ = OHZ + .8, oreHouse = house(OHX, OHZ, OHW, OHD, 12, [{ wall: 'x+', c: ODZ, w: .9, y0: 0, y1: 2.0 }, { wall: 'z+', c: OHX, w: .8, y0: 1.1, y1: 1.6 }]);
  put(new THREE.BoxGeometry(2 * OHW, .05, 2 * OHD), 'board', OHX, .225, OHZ); for (const s of [-1, 1]) put(new THREE.BoxGeometry(.26, 1.95, .1), 'board', OHX + OHW, 1.15, ODZ + s * .5);
  put(new THREE.BoxGeometry(.05, 1.8, .88), 'board', OHX + OHW - .07, 1.13, ODZ); put(new THREE.BoxGeometry(.04, .04, .1), 'iron', OHX + OHW + .02, 1.1, ODZ - .3);
  put(new THREE.BoxGeometry(.8, .5, .04), 'dark', OHX, 1.35, OHZ + OHD - .02); for (const s of [-1, 1]) { put(new THREE.BoxGeometry(.96, .06, .26), 'board', OHX, 1.35 + s * .28, OHZ + OHD); put(new THREE.BoxGeometry(.06, .5, .26), 'board', OHX + s * .45, 1.35, OHZ + OHD); }
  oreHouse.door = { x: OHX + OHW, z: ODZ, w: .9, h: 1.8 };
  // the tramway: sleepers every 0.8 m, two plank rails; past the tongue's end, on stringers over three bents; a stop-block at the end
  const RZ0 = TZ0 - AL + .8, bents = []; for (let z = RZ0; z < TEND; z += .8) put(new THREE.BoxGeometry(1.0, .06, .16), 'timber', AX, .03, z);
  for (const s of [-1, 1]) put(new THREE.BoxGeometry(.08, .1, TEND - RZ0 + .2), 'timber', AX + s * GAUGE / 2, .11, (RZ0 + TEND) / 2);
  { const Z0 = TONGUE[3] - .6; for (const s of [-1, 1]) put(new THREE.BoxGeometry(.16, .22, TEND - Z0 + .2), 'timber', AX + s * .32, -.11, (Z0 + TEND) / 2);
    for (const z of [13.6, 14.9, TEND - .1]) { bents.push(z); put(new THREE.BoxGeometry(1.2, .16, .18), 'timber', AX, -.3, z); for (const s of [-1, 1]) rod('timber', [AX + s * .5, Math.min(ground(AX + s * .5, z), -.38) - .3, z], [AX + s * .5, -.3, z], .08, 6); }
    put(new THREE.BoxGeometry(1.0, .22, .22), 'timber', AX, .27, TEND + .02); }
  // the cart: a box of boards on four small wheels, its ore heaped in it
  const CZ = 3.2; { const y0 = RTOP + .1; put(new THREE.BoxGeometry(.66, .04, 1.1), 'board', AX, y0 + .02, CZ); for (const s of [-1, 1]) { put(new THREE.BoxGeometry(.04, .5, 1.1), 'board', AX + s * .33, y0 + .25, CZ); put(new THREE.BoxGeometry(.66, .5, .04), 'board', AX, y0 + .25, CZ + s * .55); put(new THREE.BoxGeometry(.7, .04, .04), 'iron', AX, y0 + .45, CZ + s * .45); }
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) { const g = new THREE.CylinderGeometry(.12, .12, .06, 10); g.rotateZ(Math.PI / 2); put(g, 'iron', AX + sx * GAUGE / 2, RTOP + .12, CZ + sz * .35); }
    for (let k = 0; k < 14; k++) put(new THREE.DodecahedronGeometry(.08 + F() * .06), 'ore', AX + (F() - .5) * .45, y0 + .42 + F() * .12, CZ + (F() - .5) * .85, F() * 3, F() * 3); }
  // the shaft: its walls down to the sump; the collar; the fence; the headframe, its cap, the sheave, the stays; the rope and the kibble
  { const fs = (x, y) => Math.max(.03, 1 + y / 3.2), wl = () => dim(new THREE.PlaneGeometry(SHW, SHD, 1, 24).translate(0, -SHD / 2, 0), fs);
    put(wl(), 'tunnel', SHX, 0, SHZ - SHW / 2); put(wl(), 'tunnel', SHX, 0, SHZ + SHW / 2); for (const s of [-1, 1]) put(wl().rotateY(Math.PI / 2), 'tunnel', SHX + s * SHW / 2, 0, SHZ); put(new THREE.PlaneGeometry(SHW, SHW).rotateX(-Math.PI / 2), 'dark', SHX, -SHD, SHZ);
    for (const s of [-1, 1]) { put(new THREE.BoxGeometry(SHW + .6, .3, .3), 'timber', SHX, .15, SHZ + s * (SHW / 2 + .15)); put(new THREE.BoxGeometry(.3, .3, SHW), 'timber', SHX + s * (SHW / 2 + .15), .15, SHZ); } }
  const FH = 1.8; for (const sx of [-1, 1]) for (const sz of [-1, 1]) put(new THREE.BoxGeometry(.12, 1.2, .12), 'timber', SHX + sx * FH, .55, SHZ + sz * FH);
  for (const y of [.55, 1.05]) for (const s of [-1, 1]) { put(new THREE.BoxGeometry(2 * FH + .1, .08, .06), 'timber', SHX, y, SHZ + s * FH); put(new THREE.BoxGeometry(.06, .08, 2 * FH + .1), 'timber', SHX + s * FH, y, SHZ); }
  { const P = SHW / 2 + .15; for (const sx of [-1, 1]) for (const sz of [-1, 1]) put(new THREE.BoxGeometry(.22, CAP - .3, .22), 'timber', SHX + sx * P, .3 + (CAP - .3) / 2, SHZ + sz * P);
    for (const s of [-1, 1]) { put(new THREE.BoxGeometry(2 * P + .4, .24, .24), 'timber', SHX, CAP, SHZ + s * P); put(new THREE.BoxGeometry(.24, .24, 2 * P + .4), 'timber', SHX + s * P, CAP, SHZ);
      put(new THREE.BoxGeometry(.5, .3, .16), 'timber', SHX + SHR, CAP + .27, SHZ + s * .2) /* the sheave's bearing blocks */; rod('timber', [SHX + P, CAP, SHZ + s * P], [SHX + P + 2.9, -.2, SHZ + s * (P + .5)], .1, 6) /* a stay back toward the whim */; }
    const sh = new THREE.CylinderGeometry(SHR, SHR, .1, 18); sh.rotateX(Math.PI / 2); put(sh, 'timber', SHX + SHR, SY, SHZ); rod('iron', [SHX + SHR, SY, SHZ - .3], [SHX + SHR, SY, SHZ + .3], .035, 6); }
  const kib = -2.4; rod('rope', [SHX, SY, SHZ], [SHX, kib + .75, SHZ], .022, 5); put(new THREE.CylinderGeometry(.42, .34, .7, 12, 1, true), 'iron', SHX, kib + .35, SHZ); put(new THREE.CircleGeometry(.34, 12).rotateX(Math.PI / 2), 'iron', SHX, kib, SHZ);
  rod('iron', [SHX - .42, kib + .7, SHZ], [SHX, kib + .95, SHZ], .015, 4); rod('iron', [SHX + .42, kib + .7, SHZ], [SHX, kib + .95, SHZ], .015, 4);
  // the whim: the posts, their ring beam and two tie beams crossing over the axle; the roof's cone of shingles, snow on it; the axle, the drum, the sweep
  const posts = []; for (let k = 0; k < 8; k++) { const a = Math.PI / 8 + k * Math.PI / 4, x = WX + POSTR * Math.sin(a), z = WZ + POSTR * Math.cos(a); posts.push([+x.toFixed(3), +z.toFixed(3)]);
    rod('timber', [x, -.1, z], [x, EAV, z], .15, 8); put(new THREE.BoxGeometry(.6, .3, .6), 'bank', x, 0, z, 0, F()); }
  const BEAM = .26; for (let k = 0; k < 8; k++) { const [a, b] = [posts[k], posts[(k + 1) % 8]], L = Math.hypot(b[0] - a[0], b[1] - a[1]); put(new THREE.BoxGeometry(L + .3, BEAM, .22), 'timber', (a[0] + b[0]) / 2, EAV - BEAM / 2, (a[1] + b[1]) / 2, 0, Math.atan2(-(b[1] - a[1]), b[0] - a[0])); }
  for (const k of [0, 2]) { const [a, b] = [posts[k], posts[k + 4]], L = Math.hypot(b[0] - a[0], b[1] - a[1]); put(new THREE.BoxGeometry(L, .24, .2), 'timber', WX, EAV - .12 - (k ? .24 : 0), WZ, 0, Math.atan2(-(b[1] - a[1]), b[0] - a[0])); }
  { const sl = (APEX - EAV) / POSTR, RR = POSTR / Math.cos(Math.PI / 8) + .9, by = EAV - (RR - POSTR / Math.cos(Math.PI / 8)) * sl, hh = APEX - by;
    put(new THREE.ConeGeometry(RR, hh, 8, 3, true), 'shingle', WX, by + hh / 2, WZ, 0, Math.PI / 8); put(new THREE.ConeGeometry(RR + .02, hh, 8, 3, true).translate(0, .14, 0), 'snow', WX, by + hh / 2, WZ, 0, Math.PI / 8);
    rod('timber', [WX, EAV - .5, WZ], [WX, APEX + .1, WZ], .14, 8) /* the king post */; }
  rod('timber', [WX, -.1, WZ], [WX, EAV - .5, WZ], .2, 10);
  { const g = new THREE.CylinderGeometry(DR, DR, DY1 - DY0, 16, 1, true); put(g, 'timber', WX, (DY0 + DY1) / 2, WZ); for (const y of [DY0, DY1]) put(new THREE.CylinderGeometry(DR + .14, DR + .14, .06, 16), 'timber', WX, y, WZ);
    for (let k = 0; k < 4; k++) { const t = new THREE.TorusGeometry(DR + .02, .022, 4, 20); t.rotateX(Math.PI / 2); put(t, 'rope', WX, ROPE_Y - k * .05, WZ); } }
  const SA = .75 /* the sweep's angle from +z, toward the view from the track */, sx = Math.sin(SA), sz = Math.cos(SA);
  put(new THREE.BoxGeometry(.18, .2, PR + .3), 'timber', WX + sx * (PR + .3) / 2, SWEEP, WZ + sz * (PR + .3) / 2, 0, SA); rod('timber', [WX, DY0 - .15, WZ], [WX + sx * 2.6, SWEEP + .1, WZ + sz * 2.6], .07, 6);
  rod('iron', [WX + sx * PR, SWEEP - .1, WZ + sz * PR], [WX + sx * PR, SWEEP - .55, WZ + sz * PR], .02, 4); rod('timber', [WX + sx * PR - sz * .4, SWEEP - .55, WZ + sz * PR + sx * .4], [WX + sx * PR + sz * .4, SWEEP - .55, WZ + sz * PR - sx * .4], .03, 5) /* the swingletree */;
  // the rope from the drum's side to the top of the sheave, in the shaft's own line
  const rope = [[WX, ROPE_Y, WZ + DR], [SHX + SHR, SY + SHR, SHZ]].map(p => p.map(v => +v.toFixed(3))); rod('rope', rope[0], rope[1], .022, 5);
  // ore by the sorting house's door, a barrow
  for (let k = 0; k < 40; k++) { const a = F() * 6.283, d = Math.sqrt(F()) * 1.1, x = OHX + OHW + 1.2 + Math.cos(a) * d, z = ODZ + 2.2 + Math.sin(a) * d * .8; put(new THREE.DodecahedronGeometry(.07 + F() * .08), F() < .7 ? 'ore' : 'spoil', x, .05 + (1.1 - d) * .32 + F() * .05, z, F() * 3, F() * 3); }
  { const bx = OHX + OHW + 1.4, bz = ODZ - 2.0; put(new THREE.BoxGeometry(.6, .3, .8), 'board', bx, .45, bz); for (const s of [-1, 1]) rod('timber', [bx + s * .25, .38, bz + .35], [bx + s * .3, .55, bz + 1.3], .025, 5);
    const w = new THREE.CylinderGeometry(.2, .2, .06, 12); w.rotateZ(Math.PI / 2); put(w, 'timber', bx, .2, bz - .55); }
  // spruce from outside the terrace and the tip, clear of the track: a trunk and six tiers, a cap of snow on most
  const trees = []; for (let k = 0, n = 0; k < 1500 && n < 52; k++) { const x = -60 + F() * 110, z = -45 + F() * 95, gy = ground(x, z);
    if (flatD(x, z) < 5 || pathAt(x, z).d < 3 || Math.hypot(x - WX, z - WZ) < 11 || trees.some(t => Math.hypot(t.x - x, t.z - z) < 2.8)) continue; n++;
    const h = 8 + F() * 9, w = h * (.22 + F() * .05); rod('bark', [x, gy - .3, z], [x, gy + h * .35, z], h * .016, 6);
    for (let t = 0; t < 6; t++) { const f = t / 6, y0 = gy + h * (.16 + f * .76), th = h * (.28 - f * .05), rw = w * (1 - f * .8) * (.9 + F() * .2); put(new THREE.ConeGeometry(rw, th, 8, 1, true), 'needle', x, y0 + th / 2, z, 0, F() * 3);
      if (F() < .8) put(new THREE.ConeGeometry(rw * .62, th * .36, 7, 1, true), 'snow', x + (F() - .5) * rw * .2, y0 + th * .7 + .02, z + (F() - .5) * rw * .2, 0, F() * 3); } trees.push({ x: +x.toFixed(2), z: +z.toFixed(2), h: +h.toFixed(2) }); }
  const group = new THREE.Group(); let tris = 0; for (const [k, gs] of B) { const g = mergeGeometries(gs, false); gs.forEach(x => x.dispose()); const m = new THREE.Mesh(g, M[k]); m.name = k; m.castShadow = !['trod', 'dark'].includes(k) /* the yard too: it shades the shaft and the adit under it */; m.receiveShadow = true; group.add(m); tris += g.attributes.position.count / 3; }
  return { group, tris: Math.round(tris), draws: group.children.length, own: group.children.length, ground, hill,
    terrace: { x0: TX0, x1: TX1, z0: TZ0, z1: TZ1, tongue: TONGUE }, adit: { x: AX, z: TZ0, w: AW, h: AH, len: AL, sets: sets.map(z => ({ z, clear: 2.2, cap: 2.3 })) }, aditHouse, oreHouse,
    rails: { x: AX, z0: RZ0, z1: TEND, top: RTOP, gauge: GAUGE, bents }, cart: { x: AX, z: CZ }, shaft: { x: SHX, z: SHZ, w: SHW, depth: SHD, fence: { half: FH, rails: [.55, 1.05] } },
    sheave: { x: SHX + SHR, y: SY, z: SHZ, r: SHR }, drum: { x: WX, z: WZ, y0: DY0, y1: DY1, r: DR, rope: ROPE_Y }, rope,
    whim: { x: WX, z: WZ, path: PR, posts, r: POSTR, eaves: EAV, beam: BEAM, apex: APEX, sweep: SWEEP }, paths: [PATH.map(p => [p[0], p[1]])], track: PATH.map(p => p.map(v => +v.toFixed(3))), trees };
}

// ── the Gatelands' canal lock (Session 1229, card F8; L5's "roads and works", OG-046's "canals & waterways", the last work on its board).
// A lock on a summit canal across the midlands, after the Grand Canal's locks of 1780 to 1804: the canal falls 2.6 m through one chamber,
// with a humpback bridge over the lock's tail and the lock-keeper's cottage on the lockside. Built at true size, a metre a unit, the canal
// along z, flowing to +z, the towpath on its west bank:
//   - the pounds: the canal 11 m across at the water and 1.7 m deep, in an earth channel with banks at 1 in 1.5; the upper pound's water at 0
//     and its banks at 0.6, the lower's at -2.6, the land falling from 0.6 to -2.0 over 30 m below the lock; where the earth meets the
//     masonry the banks are pitched with stone;
//   - the lock: a chamber 4.4 m wide and 24 m long between its gates' heels, its walls ashlar under a dressed coping 0.65 m over the upper
//     water; a breast wall under the upper gates from the chamber's floor (the lower bed) up to the upper bed, its cill 1 m into the chamber;
//     splayed wing walls from the canal's width to the chamber's at both ends; the lower gates 5.6 m tall from the lower bed, the upper 3 m
//     from the upper; each a pair of mitred leaves pointing upstream, 18° off square when shut, each lying in a recess of the wall when open,
//     under a balance beam of 6.5 m, black with its end painted white, 0.7 to 1.0 m over the coping; ground paddles on the head;
//   - the bridge: a humpback over the lock's tail carrying the road along x, one round arch of 4.44 m springing 1.6 m over the lower water,
//     the road 3.2 m between parapets of 1 m and humped 1.3 m over 32 m;
//   - the lock-keeper's cottage (the kit's GL_PLANS.cottage) on the east lockside, its door to the lock; the lockside paved in setts;
//   - a turf barge of 18.6 by 3.9 m: a black hull drawing 1.05 m, a cabin aft with its stove pipe, the hold under a tarpaulin, the towing
//     post forward; in the chamber (o.barge 'chamber', the default) or tied up in the lower pound below the bridge ('pound').
// o.fill: 'low' (the default: the chamber at the lower water, the lower gates open, the upper shut) or 'high' (the chamber full, the upper
// gates open, the lower shut).
// -> { group, tris, draws, own, ground(x, z), land(x, z), levels { WU, WL, BU, BL, CT, fall }, lock { hw, zh, zt, zc, z0, z1, recess, face(z),
//      usable [z0, z1] }, gates [{ kind, z, shut, h0, h1, leaves [{ side, heel, toe, d, len, beam { a, b, y0, y1 } }] }], chamberY, bridge { z0, z1,
//      half, span, spring, crown, deck(x), parapet, x0, x1 }, barge { x, z, len, beam, draft, free, water, top, at, z0, z1 }, cottage { x, z, w, d, ry,
//      door }, road { z, w }, tow (the towpath's line), paths, trees, fill }
export function gatelandsCanal(o = {}, r = stream('canal')) {
  const std = (c, ro = .9, x = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: ro, ...x }); const MI = millMats(); aurenneTextures() /* the limestone */;
  const M = { turf: MI.turf, track: mat('turfDry', { ns: 1.0, color: 0xa08e70, rough: 1 }), setts: MI.path, bed: mat('rock', { ns: .8, color: 0x4a4636, rough: 1 }), pitch: mat('stone', { ns: 1.2, color: 0x9c988c, rough: .95 }),
    wall: mat('limestone', { ns: 1.0, color: 0xb4b0a4, rough: .92 }), dress: MI.dress, rubble: mat('stone', { ns: 1.0, color: 0xb8b2a2, rough: .95 }), path: MI.path,
    water: std(0x2a3a30, .1, { metalness: .15 }), gate: mat('wood', { ns: .9, color: 0x3a342c, rough: .8 }), beam: std(0x141210, .7), lime: MI.lime, iron: MI.iron, timber: MI.timber,
    hull: std(0x151311, .75, { side: THREE.DoubleSide }), boat: std(0x2e2620, .8), pipe: MI.iron, pane: std(0x0c0a08, 1), paint: MI.door, tarp: std(0x5e5848, .95, { side: THREE.DoubleSide }), band: std(0x8a2c1e, .7), rope: std(0x8a7650, .95), dark: std(0x0c0a08, 1),
    bark: std(0x5a5246, .95), leaf: std(0x4f6a2c, .85), sally: std(0x7a8a4c, .85), board: mat('wood', { ns: .9, color: 0x9a8e78, rough: .9 }), foam: std(0xc8d4d0, .35, { transparent: true, opacity: .78, side: THREE.DoubleSide, depthWrite: false }) };
  const B = new Map(), key = String(o.key || 'canal'), F = stream(key + ':lie'), ph = Array.from({ length: 6 }, () => F() * 6.283), V3 = (x, y, z) => new THREE.Vector3(x, y, z);
  const fill = o.fill === 'high' ? 'high' : 'low', bargeAt = o.barge === 'pound' ? 'pound' : 'chamber';
  const put = (geo, k, x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0, uv = .5) => { const g = geo.index ? geo.toNonIndexed() : geo; for (const a of Object.keys(g.attributes)) if (!['position', 'normal'].includes(a)) g.deleteAttribute(a);
    if (!g.attributes.normal) g.computeVertexNormals(); g.applyMatrix4(new THREE.Matrix4().compose(V3(x, y, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(rx, ry, rz, 'YXZ')), V3(1, 1, 1))); worldUV(g, uv);
    if (!B.has(k)) B.set(k, []); B.get(k).push(g); return g; };
  const rod = (k, a, b, rad, seg = 6, taper = 1) => { const A = V3(...a), C = V3(...b), d = C.clone().sub(A), g = new THREE.CylinderGeometry(rad * taper, rad, d.length(), seg);
    g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(V3(0, 1, 0), d.clone().normalize())); g.translate((A.x + C.x) / 2, (A.y + C.y) / 2, (A.z + C.z) / 2); return put(g, k); };
  // a six-faced solid from its eight corners (four below, four above, each in order round), its faces outward
  const hexa = (c, k, uv = .5) => { const q = [[0, 1, 2, 3], [4, 7, 6, 5], [0, 4, 5, 1], [1, 5, 6, 2], [2, 6, 7, 3], [3, 7, 4, 0]], pos = [];
    for (const [a, b, cc, d] of q) for (const i of [a, b, cc, a, cc, d]) pos.push(...c[i]); const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.computeVertexNormals();
    const n = g.attributes.normal, ctr = c.reduce((s, p) => s.add(V3(...p)), V3(0, 0, 0)).multiplyScalar(1 / 8), p0 = V3(...c[0]), nn = V3(n.getX(0), n.getY(0), n.getZ(0));
    if (nn.dot(p0.clone().sub(ctr)) < 0) { const P = g.attributes.position; for (let i = 0; i < P.count; i += 3) { const t = [P.getX(i + 1), P.getY(i + 1), P.getZ(i + 1)]; P.setXYZ(i + 1, P.getX(i + 2), P.getY(i + 2), P.getZ(i + 2)); P.setXYZ(i + 2, ...t); } g.computeVertexNormals(); }
    return put(g, k, 0, 0, 0, 0, 0, 0, uv); };
  const sm = t => { t = Math.min(1, Math.max(0, t)); return t * t * (3 - 2 * t); };
  // the levels and the lock's plan
  const WU = 0, WL = -2.6, BU = WU - 1.7, BL = WL - 1.7, CT = .6, ZH = -12, ZT = 12, ZC = -11, HW = 2.2, A = 5.5, REC = 2.6, HEEL = 2.42, LEAF = HEEL / Math.cos(18 * Math.PI / 180), RZ = [[ZH - 2.65, ZH], [ZT - 2.65, ZT]];
  const MZ0 = -20, MZ1 = 28, SPL0 = -15, SPL1 = 23, WT = 1.6;
  const face = z => z < MZ0 || z > MZ1 ? null : z < SPL0 ? A + (HW - A) * (z - MZ0) / (SPL0 - MZ0) : z > SPL1 ? HW + (A - HW) * (z - SPL1) / (MZ1 - SPL1) : RZ.some(([a, b]) => z > a - 1e-6 && z < b + 1e-6) ? REC : HW;
  const floorY = z => z < ZC - .45 ? BU : BL;
  const L = z => CT - 2.6 * sm((z - 27) / 30), kAt = z => z < MZ0 ? .25 + 1.25 * sm((MZ0 - z) / 6) : z > MZ1 ? .25 + 1.25 * sm((z - MZ1) / 6) : 0;
  // the road along x over the lock's tail, humped over the bridge; the bridge 4 m wide in z
  const ZB = 19.5, RW = 3.2, BZ0 = ZB - 2, BZ1 = ZB + 2, BX = 9, deck = x => CT + (Math.abs(x) < 16 ? .65 * (1 + Math.cos(Math.PI * x / 16)) : 0);
  // the bywash (Session 1234): the pound's surplus round the lock on the towpath's side, over a weir in a notch through the upper pound's
  // bank, down a stone channel 1.4 m wide in three reaches to a culvert under the towpath, which takes the rest of the fall (0.9 m) out
  // through the tail's west wall below the lower gates; its inner faces (x, z) and the reaches' water, each fall a sill and a spill
  const QX = [-11.2, -9.8], QZ = [-27.0, 13.3], NZ = [-27.0, -25.8], NX = [-9.8, -4.8], WR = [-6.4, -6.0], QT = .3, QSTEP = [-8, 4], QLV = [-.25, -.55, -.85];
  const qLevel = z => QLV[QSTEP.filter(q => z >= q).length], OZ = [14.6, 15.4], OS = -1.75, OH = -1.1 /* the outlet's sill and head in the tail's wall */;
  const qIn = (x, z) => (x >= QX[0] - 1e-6 && x <= QX[1] + 1e-6 && z >= QZ[0] - 1e-6 && z <= QZ[1] + 1e-6) || (z >= NZ[0] - 1e-6 && z <= NZ[1] + 1e-6 && x >= NX[0] - 1e-6 && x <= NX[1] + 1e-6);
  const dRect = (x, z, x0, x1, z0, z1) => Math.hypot(Math.max(x0 - x, 0, x - x1), Math.max(z0 - z, 0, z - z1));
  const qD = (x, z) => Math.min(dRect(x, z, QX[0] - QT, QX[1] + QT, QZ[0] - QT, QZ[1] + .4), dRect(x, z, NX[0], NX[1], NZ[0] - QT, NZ[1] + QT));
  const quiet = (x, z) => (1 - (1 - sm((Math.abs(x) - 7) / 4)) * (1 - sm(Math.max(MZ0 - z, z - MZ1, 0) / 4))) * sm((qD(x, z) - .3) / 3);
  const land0 = (x, z) => L(z) + (.1 * Math.sin(x * .21 + ph[0]) * Math.sin(z * .17 + ph[1]) + .05 * Math.sin(x * .43 - z * .39 + ph[2])) * quiet(x, z);
  const land = (x, z) => { const b = land0(x, z), dz = Math.abs(z - ZB), w = dz <= RW / 2 + .4 ? 1 : sm((RW / 2 + 4.4 - dz) / 4) * sm((Math.abs(x) - BX) / 2); return b + (deck(x) - b) * w; };
  const channel = (x, z) => { const Wy = z < 0 ? WU : WL, By = Wy - 1.7, k = kAt(z), ax = Math.abs(x), bh = A - k * 1.7, top = land(x, z), th = A + k * Math.max(0, L(z) - Wy);
    return ax <= bh ? By : ax >= th ? top : By + (top - By) * (ax - bh) / (th - bh); };
  const ground0 = (x, z) => { const f = face(z); if (f !== null) return Math.abs(x) <= f + .75 ? floorY(z) : land(x, z); return channel(x, z); };
  const ground = (x, z) => !qIn(x, z) ? ground0(x, z) : x > WR[1] ? Math.min(ground0(x, z), -.4) : -2.0 /* under the bywash's bed */;
  const topHalf = z => A + kAt(z) * Math.max(0, L(z) - (z < 0 ? WU : WL));
  // the towpath: on the west bank 1.5 m behind the channel's lip, clear of the beams' sweep along the lock, round the bridge's west end
  const towX = z => z > 14 && z < 25 ? -11.5 : -Math.max(7.9, topHalf(z) + 1.5);
  const tow = []; for (let z = -60; z <= 62; z += 2) { if (z === 16) tow.push([-7.9, 14.5]); tow.push([+towX(z).toFixed(2), z]); }
  const segD = (x, z, a, b) => { const dx = b[0] - a[0], dz = b[1] - a[1], t = Math.max(0, Math.min(1, ((x - a[0]) * dx + (z - a[1]) * dz) / (dx * dx + dz * dz))); return Math.hypot(x - a[0] - dx * t, z - a[1] - dz * t); };
  const lineD = (x, z, P) => Math.min(...P.slice(0, -1).map((q, i) => segD(x, z, q, P[i + 1])));
  // the land: a grid fine at the lock, its cells by what they are
  { const steps = (bands, end) => { const v = []; for (const [a, b, st] of bands) for (let q = a; q < b - 1e-6; q += st) v.push(+q.toFixed(2)); v.push(end); return v; };
    const add = (v, e) => [...new Set([...v, ...e])].sort((p, q) => p - q);
    const gx = add(steps([[-160, -40, 24], [-40, -14, 2], [-14, -8, 1], [-8, 8, .5], [8, 14, 1], [14, 40, 2], [40, 160, 24]], 160), [QX[0] - QT, QX[0], QX[1], QX[1] + QT]), gz = add(steps([[-160, -50, 22], [-50, -22, 1], [-22, -9, .5], [-9, 9, 1], [9, 30, .5], [30, 63, 1.5], [63, 160, 24.25]], 160), [NZ[0] - QT, NZ[1] + QT, QZ[1], QZ[1] + .4]);
    const pos = [], NX = gx.length, I = { turf: [], track: [], setts: [], bed: [], pitch: [] }; for (const z of gz) for (const x of gx) pos.push(x, ground(x, z), z);
    for (let j = 0; j + 1 < gz.length; j++) for (let i = 0; i + 1 < NX; i++) { const a = j * NX + i, b = a + 1, c = a + NX, d = c + 1, cx = (gx[i] + gx[i + 1]) / 2, cz = (gz[j] + gz[j + 1]) / 2, f = face(cz), ax = Math.abs(cx);
      const wet = f !== null ? ax <= f + .75 : ax < topHalf(cz) - kAt(cz) * .5, k = wet && f !== null ? 'bed' : wet ? (Math.abs(cz) < 34 && kAt(cz) < 1.3 ? 'pitch' : 'bed')
        : lineD(cx, cz, tow) < 1.1 ? 'track' : Math.abs(cz - ZB) < RW / 2 + .2 && ax > BX - .2 ? 'setts' : f !== null && ax < 6.6 && cz > -17 && cz < 16 ? 'setts' : 'turf';
      I[k].push(a, c, b, b, c, d); }
    for (const [k, idx] of Object.entries(I)) { if (!idx.length) continue; const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals();
      { const N = g.attributes.normal, h = .25; for (let v = 0; v < N.count; v++) { const x = pos[3 * v], z = pos[3 * v + 2]; if (qD(x, z) > 1 || qIn(x, z)) continue; /* by the bywash, the uncut land's normal, not the cut's */
        const nx = ground0(x - h, z) - ground0(x + h, z), nz = ground0(x, z - h) - ground0(x, z + h), l = Math.hypot(nx, 2 * h, nz); N.setXYZ(v, nx / l, 2 * h / l, nz / l); } }
      put(g, k, 0, 0, 0, 0, 0, 0, .35); } }
  // the lock's walls: a solid for each run of the face between its corners, from under the floor to the coping's bed, and the coping over it
  const wallRuns = [[MZ0, SPL0], [SPL0, RZ[0][0]], [RZ[0][0], RZ[0][1]], [RZ[0][1], RZ[1][0]], [RZ[1][0], RZ[1][1]], [RZ[1][1], SPL1], [SPL1, MZ1]];
  const fAt = (z, run) => run[0] === MZ0 ? A + (HW - A) * (z - MZ0) / (SPL0 - MZ0) : run[0] === SPL1 ? HW + (A - HW) * (z - SPL1) / (MZ1 - SPL1) : RZ.some(q => q[0] === run[0]) ? REC : HW;
  const runsOf = s => s > 0 ? wallRuns : wallRuns.flatMap(q => q[0] === RZ[1][1] ? [[q[0], OZ[0]], [OZ[0], OZ[1], 'hole'], [OZ[1], q[1]]] : [q]) /* the bywash's outlet in the west wall */;
  for (const s of [-1, 1]) for (const run of runsOf(s)) { const [z0, z1] = run, f0 = fAt(z0, run), f1 = fAt(z1, run), y0 = BL - .3, y1 = CT - .22;
    for (const [ya, yb] of run[2] ? [[y0, OS], [OH, y1]] : [[y0, y1]]) hexa([[s * f0, ya, z0], [s * (f0 + .85), ya, z0], [s * (f1 + .85), ya, z1], [s * f1, ya, z1], [s * f0, yb, z0], [s * (f0 + .85), yb, z0], [s * (f1 + .85), yb, z1], [s * f1, yb, z1]], 'wall', .6);
    if (run[2]) put(new THREE.PlaneGeometry(z1 - z0, OH - OS), 'dark', s * (f0 + .4), (OS + OH) / 2, (z0 + z1) / 2, 0, -s * Math.PI / 2) /* the culvert's dark */;
    hexa([[s * (f0 + .85), y0, z0], [s * (f0 + WT), y0, z0], [s * (f1 + WT), y0, z1], [s * (f1 + .85), y0, z1], [s * (f0 + .85), CT + .004, z0], [s * (f0 + WT), CT + .004, z0], [s * (f1 + WT), CT + .004, z1], [s * (f1 + .85), CT + .004, z1]], 'setts', .35) /* behind the coping, paved, a hair over the land so its cut never shows */;
    const n = Math.max(1, Math.round(Math.hypot(z1 - z0, f1 - f0) / 1.1)); for (let k = 0; k < n; k++) { const za = z0 + (z1 - z0) * k / n, zb = z0 + (z1 - z0) * (k + 1) / n, fa = f0 + (f1 - f0) * k / n - .05, fb = f0 + (f1 - f0) * (k + 1) / n - .05, j = (k % 2) * .004;
      hexa([[s * fa, y1, za], [s * (fa + .9), y1, za], [s * (fb + .9), y1, zb], [s * fb, y1, zb], [s * fa, CT + .05 + j, za], [s * (fa + .9), CT + .05 + j, za], [s * (fb + .9), CT + .05 + j, zb], [s * fb, CT + .05 + j, zb]], 'dress', .6); } }
  // the wing walls' ends: a dressed quoin from the bed to the coping, where the pitched bank takes over
  for (const s of [-1, 1]) for (const z of [MZ0, MZ1]) { const sg = z < 0 ? -1 : 1, y0 = (z < 0 ? BU : BL) - .3; put(new THREE.BoxGeometry(WT + .04, CT + .05 - y0, .6), 'dress', s * (A + WT / 2), (CT + .05 + y0) / 2, z - sg * .28); }
  // the breast wall under the upper gates and its cill
  hexa([[-HW - .9, BL - .3, ZH - .5], [HW + .9, BL - .3, ZH - .5], [HW + .9, BL - .3, ZC], [-HW - .9, BL - .3, ZC], [-HW - .9, BU, ZH - .5], [HW + .9, BU, ZH - .5], [HW + .9, BU, ZC], [-HW - .9, BU, ZC]], 'wall', .6);
  put(new THREE.BoxGeometry(2 * HW, .12, .3), 'dress', 0, BU + .06, ZH - .25);
  // the gates: mitred leaves pointing upstream; a leaf's d points from its heel to its toe
  const PHI = 18 * Math.PI / 180, gates = [];
  for (const [kind, gz, h0] of [['upper', ZH, BU], ['lower', ZT, BL]]) { const shut = kind === 'upper' ? fill === 'low' : fill === 'high', phi = shut ? PHI : Math.PI / 2, h1 = CT + .7, leaves = [];
    for (const s of [-1, 1]) { const heel = [s * HEEL, gz], d = [-s * Math.cos(phi), -Math.sin(phi)], toe = [heel[0] + d[0] * LEAF, heel[1] + d[1] * LEAF], ry = Math.atan2(-d[1], d[0]);
      const c = [heel[0] + d[0] * (LEAF - .2) / 2, heel[1] + d[1] * (LEAF - .2) / 2]; put(new THREE.BoxGeometry(LEAF + .2, h1 - h0, .26), 'gate', c[0], (h0 + h1) / 2, c[1], 0, ry, 0, .6);
      let n = [Math.sin(ry), Math.cos(ry)]; if (n[1] - s * n[0] < 0) n = n.map(v => -v) /* the rails on the leaf's downstream face, or the chamber's side when open */;
      for (const y of [h0 + .5, (h0 + h1) / 2, h1 - .5]) put(new THREE.BoxGeometry(LEAF - .1, .2, .05), 'gate', c[0] + n[0] * .155, y, c[1] + n[1] * .155, 0, ry, 0, .6);
      // the lower gates' walkway (Session 1234): a board 0.4 m wide on the downstream face, its top flush with the coping's, from the coping's
      // edge to the mitre when shut (the two boards meeting on the middle line), the leaf's length when open; a handrail of 1 m on its outer edge, painted white as the beams' ends are
      let walk = null; if (kind === 'lower') { const WB = .4, wy = CT + .05, OFF = [.13, .13 + WB], P = (t, f) => [heel[0] + d[0] * t + n[0] * f, heel[1] + d[1] * t + n[1] * f];
        const tX = (f, xx) => (xx - heel[0] - n[0] * f) / d[0], ends = f => shut ? [tX(f, s * (HW - .05)), tX(f, 0)] : [0, LEAF], E = OFF.map(ends);
        const cn = [P(E[0][0], OFF[0]), P(E[1][0], OFF[1]), P(E[1][1], OFF[1]), P(E[0][1], OFF[0])]; hexa([...cn.map(([x, z]) => [x, wy - .08, z]), ...cn.map(([x, z]) => [x, wy, z])], 'board', .5);
        const fr = OFF[1] - .04, [ta, tb] = ends(fr), np = Math.max(2, Math.ceil((tb - ta) / 1.1) + 1), pa = P(ta, fr), pb = P(tb, fr);
        for (let k = 0; k < np; k++) { if (shut && s > 0 && k === np - 1) continue; const q = P(ta + (tb - ta) * k / (np - 1), fr); rod('lime', [q[0], wy, q[1]], [q[0], wy + 1.0, q[1]], .028, 6); }
        for (const y of [wy + .5, wy + 1.0]) rod('lime', [pa[0], y, pa[1]], [pb[0], y, pb[1]], .025, 6);
        walk = { a: P(ends(.33)[0], .33).map(v => +v.toFixed(3)), b: P(ends(.33)[1], .33).map(v => +v.toFixed(3)), y: wy, w: WB, n, rail: [wy + .5, wy + 1.0] }; }
      const BL0 = 4.0, a = [toe[0], toe[1]], b = [heel[0] - d[0] * BL0, heel[1] - d[1] * BL0], bc = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2], blen = LEAF + BL0, by = h1 + .16;
      put(new THREE.BoxGeometry(blen - .5, .32, .3), 'beam', bc[0] + d[0] * .25, by, bc[1] + d[1] * .25, 0, ry); put(new THREE.BoxGeometry(.5, .33, .31), 'lime', b[0] + d[0] * .25, by, b[1] + d[1] * .25, 0, ry);
      leaves.push({ side: s, heel, toe: toe.map(v => +v.toFixed(4)), d, len: LEAF, beam: { a, b: b.map(v => +v.toFixed(3)), y0: by - .16, y1: by + .16 }, walk }); }
    gates.push({ kind, z: gz, shut, h0, h1, leaves }); }
  // the ground paddles on the head: a rack and its post either side of the upper gates, and their culverts' grates in the wall below the water
  for (const s of [-1, 1]) { put(new THREE.BoxGeometry(.28, .75, .28), 'iron', s * 3.3, CT + .375, ZH - 1.6); put(new THREE.BoxGeometry(.06, .5, .06), 'iron', s * 3.3, CT + 1.0, ZH - 1.6); put(new THREE.CylinderGeometry(.12, .12, .08, 10), 'iron', s * 3.45, CT + .62, ZH - 1.6, 0, 0, Math.PI / 2); }
  for (const s of [-1, 1]) for (const z of [-5, 5]) { put(new THREE.CylinderGeometry(.14, .17, .55, 10), 'iron', s * 2.65, CT + .3, z); put(new THREE.CylinderGeometry(.2, .2, .06, 10), 'iron', s * 2.65, CT + .58, z); }
  // the bywash: its walls ashlar under a dressed cope 8 cm over the land, its bed pitched; the weir in the notch, a sill at each fall and the
  // spill over it, the culvert's head under a lintel with its grate, the slab that carries the towpath over the notch, the spout at the outlet
  const QY0 = -2.4, QTOP = CT + .08, box = (x0, x1, y0, y1, z0, z1, k) => put(new THREE.BoxGeometry(x1 - x0, y1 - y0, z1 - z0), k, (x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2);
  for (const [x0, x1, z0, z1] of [[QX[0] - QT, NX[1] - .1, NZ[0] - QT, NZ[0]], [QX[0] - QT, QX[0], NZ[0], QZ[1] + .4], [QX[1], QX[1] + QT, NZ[1], QZ[1] + .4], [QX[1] + QT, NX[1] - .1, NZ[1], NZ[1] + QT], [QX[0], QX[1], QZ[1], QZ[1] + .4]]) {
    box(x0, x1, QY0, CT, z0, z1, 'wall'); box(x0 - .02, x1 + .02, CT, QTOP, z0 - .02, z1 + .02, 'dress'); }
  // a spill: a sheet falling from its lip along a parabola, `run` out along the axis ax ('x' or 'z') while it drops from y0 to y1, a0 to a1 across
  const qSpill = (ax, a0, a1, y0, y1, lip, run) => { const pos = [], N = 6, p = t => [lip + run * t, y0 - (y0 - y1) * t * t], q = (u, v, w) => ax === 'z' ? [w, v, u] : [u, v, w];
    for (let i = 0; i < N; i++) { const [u0, v0] = p(i / N), [u1, v1] = p((i + 1) / N); pos.push(...q(u0, v0, a0), ...q(u0, v0, a1), ...q(u1, v1, a1), ...q(u0, v0, a0), ...q(u1, v1, a1), ...q(u1, v1, a0)); }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.computeVertexNormals(); put(g, 'foam', 0, 0, 0, 0, 0, 0, .3); };
  const sheet = (x0, x1, z0, z1, y, k = 'water') => { const g = new THREE.PlaneGeometry(x1 - x0, z1 - z0); g.rotateX(-Math.PI / 2); put(g, k, (x0 + x1) / 2, y, (z0 + z1) / 2, 0, 0, 0, .3); };
  const reach = [QZ[0], ...QSTEP, QZ[1]];
  for (let i = 0; i + 1 < reach.length; i++) { const lv = QLV[i], za = reach[i], zb = reach[i + 1]; box(QX[0], QX[1], QY0, lv - .35, za, zb, 'pitch'); sheet(QX[0], QX[1], za, zb, lv);
    if (i + 1 < QLV.length) { box(QX[0], QX[1], QY0, lv - .06, zb - .3, zb, 'dress'); qSpill('z', QX[0], QX[1], lv - .03, QLV[i + 1], zb, .42); sheet(QX[0] + .04, QX[1] - .04, zb + .3, zb + 1.4, QLV[i + 1] + .006, 'foam'); } }
  box(WR[1] - .01, NX[1], QY0, -.5, NZ[0], NZ[1], 'pitch') /* the notch's apron on the pound's side */; box(QX[1], WR[0], QY0, QLV[0] - .35, NZ[0], NZ[1], 'pitch'); sheet(QX[1], WR[0], NZ[0], NZ[1], QLV[0]);
  box(WR[0], WR[1], QY0, -.05, NZ[0], NZ[1], 'dress') /* the weir, its crest 5 cm under the pound's water */; sheet(WR[0], WR[1], NZ[0], NZ[1], -.02);
  { qSpill('x', NZ[0], NZ[1], -.03, QLV[0], WR[0], -.36); sheet(WR[0] - 1.2, WR[0] - .3, NZ[0] + .04, NZ[1] - .04, QLV[0] + .006, 'foam'); }
  { const cz = QZ[1] - .01, c = (QX[0] + QX[1]) / 2, lf = QLV[QLV.length - 1], cw = QX[1] - QX[0] - .3; put(new THREE.PlaneGeometry(cw, .8), 'dark', c, lf - .37 + .4, cz, 0, Math.PI); box(QX[0], QX[1], lf + .43, lf + .65, QZ[1] - .06, QZ[1] + .02, 'dress') /* the culvert's mouth, its lintel and grate */;
    for (let x = c - cw / 2 + .06; x <= c + cw / 2 - .06 + 1e-6; x += cw / 8) rod('iron', [x, lf - .5, QZ[1] - .08], [x, lf + .43, QZ[1] - .08], .018, 5); }
  { const tx = towX(-26.5), z0 = NZ[0] - QT - .05, z1 = NZ[1] + QT + .05, R = .95, x0 = tx - 1.0, x1 = tx + 1.0, y0 = CT - .05, yt = QTOP + .06, ye = CT + .01;
    // the towpath's slab over the notch, flat over the copes and eased down to the path at each end over 0.95 m (1 in 8), its top the path's
    for (const [za, zb, ya, yb] of [[z0 - R, z0, ye, yt], [z0, z1, yt, yt], [z1, z1 + R, yt, ye]]) { hexa([[x0, y0, za], [x1, y0, za], [x1, y0, zb], [x0, y0, zb], [x0, ya - .02, za], [x1, ya - .02, za], [x1, yb - .02, zb], [x0, yb - .02, zb]], 'dress');
      hexa([[x0 + .05, ya - .02, za], [x1 - .05, ya - .02, za], [x1 - .05, yb - .02, zb], [x0 + .05, yb - .02, zb], [x0 + .05, ya, za], [x1 - .05, ya, za], [x1 - .05, yb, zb], [x0 + .05, yb, zb]], 'track', .35); } }
  { qSpill('x', OZ[0] + .05, OZ[1] - .05, OS + .02, WL, -HW, .5); sheet(-HW + .2, -HW + 1.3, OZ[0] - .2, OZ[1] + .2, WL + .006, 'foam'); }
  // the water: a sheet at each level, cut along the shut gate's line between them
  const chamberY = fill === 'high' ? WU : WL, shutG = gates.find(g => g.shut), vee = (gz, s) => [[s * HEEL, gz], [0, gz - HEEL * Math.tan(PHI)], [-s * HEEL, gz]];
  { const up = new THREE.Shape(), lo = new THREE.Shape(), gz = shutG.z, X = -WR[1] /* to the weir's face; the land hides it past the banks' tops */; /* the shapes in (x, -z) */
    up.moveTo(-X, 160); up.lineTo(X, 160); up.lineTo(X, -gz); for (const [x, z] of vee(gz, 1)) up.lineTo(x, -z); up.lineTo(-X, -gz); up.closePath();
    lo.moveTo(-X, -gz); for (const [x, z] of vee(gz, -1)) lo.lineTo(x, -z); lo.lineTo(X, -gz); lo.lineTo(X, -160); lo.lineTo(-X, -160); lo.closePath();
    for (const [s, y] of [[up, WU], [lo, WL]]) { const g = new THREE.ShapeGeometry(s); g.rotateX(-Math.PI / 2); put(g, 'water', 0, y, 0, 0, 0, 0, .3); } }
  // the bridge: its body a face in (x, y) with the arch cut from below, run 4 m along z; the ring stones; the parapets and their copes; the road
  const SP = WL + 1.6, AR = HW + .02, CR = SP + AR;
  { const s = new THREE.Shape(); s.moveTo(-BX, BL - .3); s.lineTo(-AR, BL - .3); s.lineTo(-AR, SP); for (let k = 1; k < 24; k++) { const t = Math.PI - k * Math.PI / 24; s.lineTo(AR * Math.cos(t), SP + AR * Math.sin(t)); } s.lineTo(AR, SP); s.lineTo(AR, BL - .3); s.lineTo(BX, BL - .3);
    for (let k = 0; k <= 36; k++) { const x = BX - k * 2 * BX / 36; s.lineTo(x, deck(x) - .02); } s.closePath();
    const g = new THREE.ExtrudeGeometry(s, { depth: BZ1 - BZ0, bevelEnabled: false, curveSegments: 4 }); g.translate(0, 0, BZ0); put(g, 'rubble', 0, 0, 0, 0, 0, 0, .6);
    for (const [z, ry] of [[BZ0 - .01, Math.PI], [BZ1 + .01, 0]]) { const rg = new THREE.RingGeometry(AR, AR + .48, 18, 1, 0, Math.PI); put(rg, 'dress', 0, SP, z, 0, ry); }
    for (const z of [BZ0, BZ1 - .4]) { const p = new THREE.Shape(); p.moveTo(-BX, deck(-BX) - .05); for (let k = 1; k <= 36; k++) { const x = -BX + k * 2 * BX / 36; p.lineTo(x, deck(x) - .05); } for (let k = 36; k >= 0; k--) { const x = -BX + k * 2 * BX / 36; p.lineTo(x, deck(x) + .92); } p.closePath();
      const pg = new THREE.ExtrudeGeometry(p, { depth: .4, bevelEnabled: false }); pg.translate(0, 0, z); put(pg, 'rubble', 0, 0, 0, 0, 0, 0, .6);
      for (let k = 0; k < 36; k++) { const x0 = -BX + k * 2 * BX / 36, x1 = x0 + 2 * BX / 36, sl = (deck(x1) - deck(x0)) / (x1 - x0); put(new THREE.BoxGeometry((x1 - x0) * Math.hypot(1, sl) + .02, .1, .5), 'dress', (x0 + x1) / 2, (deck(x0) + deck(x1)) / 2 + .97, z + .2, 0, 0, Math.atan(sl)); }
      for (const sx of [-1, 1]) put(new THREE.BoxGeometry(.55, 1.25, .55), 'dress', sx * (BX + .2), deck(BX) + .55, z + .2) /* the parapet's end piers */; }
    for (let x = -40; x < 40; x += .9) { const x1 = x + .9, sl = (deck(x1) - deck(x)) / .9; put(new THREE.BoxGeometry(.93, .06, RW - .04), 'path', x + .45, (deck(x) + deck(x1)) / 2 + .03, ZB + (F() - .5) * .02, 0, 0, Math.atan(sl)); } }
  // the barge: a hull lofted from sections along its length (the bow to +z), a cabin aft, the hold under a tarpaulin, a towing post forward
  const BLN = 18.6, HB = 1.95, DR = 1.05, FB = .5, bargeW = bargeAt === 'chamber' ? chamberY : WL;
  const usable = [ZC + .3, ZT - LEAF - .3], bx = bargeAt === 'chamber' ? 0 : -1.4, bzc = bargeAt === 'chamber' ? (usable[0] + usable[1]) / 2 + .2 : 42, bz0 = bzc - BLN / 2;
  { const N = 44, rings = []; for (let k = 0; k <= N; k++) { const s = k / N * BLN, tb = (s - (BLN - 3.6)) / 3.6, ts = (1.4 - s) / 1.4, b = HB * (tb > 0 ? Math.sqrt(Math.max(.002, 1 - tb * tb)) : 1) * (ts > 0 ? 1 - .32 * ts * ts : 1);
      const bot = -DR + (tb > 0 ? .8 * tb * tb : 0) + (ts > 0 ? .3 * ts * ts : 0), top = FB + (tb > 0 ? .28 * tb * tb : 0) + (ts > 0 ? .12 * ts : 0), c = Math.min(.12, b * .4);
      rings.push([[-b, top], [-b, bot + c], [-b + c, bot], [b - c, bot], [b, bot + c], [b, top]].map(([x, y]) => [bx + x, bargeW + y, bz0 + s])); }
    const pos = []; for (let k = 0; k < N; k++) for (let i = 0; i < 5; i++) { const a = rings[k][i], b = rings[k][i + 1], c = rings[k + 1][i + 1], d = rings[k + 1][i]; pos.push(...a, ...b, ...c, ...a, ...c, ...d); }
    for (const R of [rings[0], rings[N]]) for (let i = 1; i < 5; i++) pos.push(...R[0], ...R[i], ...R[i + 1]);
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.computeVertexNormals(); put(g, 'hull', 0, 0, 0, 0, 0, 0, .5);
    for (let k = 0; k < N; k++) for (const i of [0, 5]) rod('band', rings[k][i], rings[k + 1][i], .07, 5) /* the gunwale, red */;
    put(new THREE.BoxGeometry(2 * HB - .3, .06, BLN - 8.6), 'boat', bx, bargeW - DR + .32, bz0 + 4.2 + (BLN - 8.6) / 2) /* the hold's floor */;
    const cz = bz0 + 2.3; put(new THREE.BoxGeometry(2 * HB - .36, 1.25, 3.4), 'paint', bx, bargeW + FB - .2 + .625, cz); put(new THREE.BoxGeometry(2 * HB - .2, .08, 3.6), 'band', bx, bargeW + FB + 1.09, cz);
    for (const sx of [-1, 1]) put(new THREE.PlaneGeometry(.5, .35), 'pane', bx + sx * (HB - .17), bargeW + FB + .62, cz, 0, sx * Math.PI / 2); put(new THREE.PlaneGeometry(.7, 1.0), 'pane', bx + .5, bargeW + FB + .4, cz + 1.71);
    put(new THREE.CylinderGeometry(.09, .09, .55, 8), 'pipe', bx - .9, bargeW + FB + 1.4, cz - .6);
    put(new THREE.BoxGeometry(.1, 1.3, .9), 'boat', bx, bargeW - .2, bz0 - .45); rod('boat', [bx, bargeW + .4, bz0 - .45], [bx, bargeW + FB + .95, bz0 - .45], .06, 6); rod('boat', [bx, bargeW + FB + .95, bz0 - .45], [bx + .3, bargeW + FB + 1.0, bz0 + .45], .04, 5) /* the rudder, its stock and the tiller, short of the cabin */;
    { const tl = BLN - 9.2, tg = new THREE.CylinderGeometry(1, 1, tl, 14, 1, true, -Math.PI / 2, Math.PI); tg.rotateX(-Math.PI / 2); tg.scale(HB - .1, .55, 1); put(tg, 'tarp', bx, bargeW + FB + .02, bz0 + 4.4 + tl / 2); }
    put(new THREE.CylinderGeometry(.09, .11, 1.5, 8), 'boat', bx, bargeW + FB + .55, bz0 + BLN - 4.4) /* the towing post */;
    if (bargeAt === 'pound') { for (const [sz, tz] of [[bz0 + 1.2, bz0 - 2.5], [bz0 + BLN - 2.4, bz0 + BLN + 1.5]]) { const sx = towX(tz) + 1.4, sy = channel(sx, tz); rod('timber', [sx, sy - .3, tz], [sx, sy + .55, tz], .06, 6); rod('rope', [bx - HB + .1, bargeW + FB + .1, sz], [sx, sy + .45, tz], .02, 4); } }
    else for (const sz of [bz0 + 1.2, bz0 + BLN - 2.4]) { const p = [bx - HB + .25, bargeW + FB + .2, sz]; for (let k = 0; k < 5; k++) put(new THREE.TorusGeometry(.18 - k * .015, .025, 4, 10).rotateX(Math.PI / 2), 'rope', p[0] + .1, p[1] + .03 + k * .04, p[2]); } }
  const bargeTop = bargeW + FB + 1.4 + .275;
  // the lock-keeper's cottage on the east lockside, its door to the lock
  const plan = GL_PLANS.cottage({ paint: 'green' }); plan.r = stream(key + '-cottage'); const cot = gatelandsBuilding(plan), CX = 9.0 + plan.d / 2, CZ = 4, CRY = -Math.PI / 2;
  cot.position.set(CX, land(CX, CZ) - .05, CZ); cot.rotation.y = CRY; cot.updateMatrixWorld(true); const door = cot.userData.door ? cot.userData.door.clone().applyMatrix4(cot.matrixWorld) : V3(9, 0, CZ);
  // the paths: the towpath; onto the lockside and along it between the beams; the road over the bridge; from the road to the cottage's door
  const paths = [tow, [[-7.9, -9.6], [-3.8, -9.6], [-3.8, 8.8], [-7.9, 8.8]], [[-40, ZB], [40, ZB]], [[12.5, ZB - 1.2], [8.0, 12.6], [8.0, door.z], [door.x - .7, door.z]]];
  // trees: alder and sally on the far bank and about, clear of the channel, the lock, the cottage, the road and the paths
  const trees = [], tree = (x, z, h, sally) => { const gy = ground(x, z), top = [x, gy + h * .45, z]; rod('bark', [x, gy - .3, z], top, .14 + h * .012, 7, .7);
    for (let l = 0; l < 5; l++) { const a = l * 1.3 + F(), Ln = 1.3 + F() * 1.1, e = [top[0] + Math.cos(a) * Ln, top[1] + .7 + l * .5 + F() * .5, top[2] + Math.sin(a) * Ln]; rod('bark', [top[0], top[1] - .5 + l * .2, top[2]], e, .055, 5, .6);
      for (let c2 = 0; c2 < 3; c2++) put(new THREE.IcosahedronGeometry(.85 + F() * .5, 0).scale(1.1, sally ? 1.1 : .8, 1.1), sally ? 'sally' : 'leaf', e[0] + (F() - .5) * 1.3, e[1] + (F() - .5) * (sally ? 1.6 : 1), e[2] + (F() - .5) * 1.3, F(), F() * 3); }
    trees.push({ x: +x.toFixed(2), z: +z.toFixed(2), h: +h.toFixed(2), kind: sally ? 'sally' : 'alder' }); };
  for (let k = 0, n = 0; k < 2000 && n < 12; k++) { const x = (k % 4 === 0 ? -1 : 1) * (8 + F() * 34), z = -55 + F() * 115, sally = n % 3 === 1;
    if (Math.abs(x) < topHalf(z) + 2.5 || (face(z) !== null && Math.abs(x) < 9) || (x > 7 && x < 17 && z > -5 && z < 13) || qD(x, z) < 3 || Math.abs(z - ZB) < 6 || paths.some(P => lineD(x, z, P) < 3.5) || trees.some(t => Math.hypot(t.x - x, t.z - z) < 8)) continue;
    n++; tree(x, z, sally ? 6 + F() * 2 : 9 + F() * 4, sally); }
  const group = new THREE.Group(); let tris = 0;
  for (const [k, gs] of B) { const g = mergeGeometries(gs, false); gs.forEach(x => x.dispose()); const m = new THREE.Mesh(g, M[k]); m.name = k; m.castShadow = !['turf', 'track', 'setts', 'bed', 'pitch', 'water'].includes(k); m.receiveShadow = k !== 'water'; group.add(m); tris += g.attributes.position.count / 3; }
  const own = group.children.length; group.add(cot); tris += cot.userData.tris;
  return { group, tris: Math.round(tris), draws: own + cot.userData.calls, own, ground, land, levels: { WU, WL, BU, BL, CT, fall: WU - WL },
    lock: { hw: HW, zh: ZH, zt: ZT, zc: ZC, z0: MZ0, z1: MZ1, recess: RZ, face, usable }, gates, chamberY,
    bridge: { z0: BZ0, z1: BZ1, half: BX, span: 2 * AR, spring: SP, crown: CR, deck, parapet: .92, x0: -BX, x1: BX },
    barge: { x: bx, z: bzc, len: BLN, beam: 2 * HB, draft: DR, free: FB, water: bargeW, top: bargeTop, at: bargeAt, z0: bz0 - .5, z1: bz0 + BLN, cabin: { x: HB - .18, top: bargeW + FB + 1.13 }, pipe: { x: bx - .9, top: bargeTop } },
    cottage: { x: CX, z: CZ, w: plan.w, d: plan.d, ry: CRY, door: [+door.x.toFixed(3), +door.y.toFixed(3), +door.z.toFixed(3)] }, road: { z: ZB, w: RW }, tow, paths, trees, fill,
    bywash: { x: QX, z: QZ, notch: { x: NX, z: NZ }, weir: { x: WR, crest: -.05 }, steps: QSTEP, levels: QLV, level: qLevel, top: QTOP, outlet: { z: OZ, sill: OS, head: OH, x: -HW }, dist: qD } };
}

// ── the Mark's fortress on a pass (Session 1235, card F8; L5's "the Mark's settlements", OG-034's "fortress town on a pass", its Stonewatch
// panel; the canon's "squat stone garrisons", the Captains' League's fort-captains). A pass between two ranges, its floor 18 m across and
// its sides walkable for 6 m each side before they stand up as cliff; across it, where it is narrowest, a captain's garrison shuts it with a
// wall of squat ashlar, a gate tower over the road and a round tower at each end against the cliff's foot; the garrison's few buildings
// behind it, up the pass. Built at true size, a metre a unit, the road along z, the enemy's side to -z, the wall's outer face at z WZ0:
//   - the land: the floor flat across 18 m, the flanks rising 1 in 2 for 6 m, then cliff at 58° and up; the road climbing 1 in 14 to the wall
//     and 1 in 40 beyond it; snow on the floor and the flanks, rock on the cliffs, the road's gravel 4 m wide;
//   - the wall: 2.6 m thick and 5.5 m over the land at its outer face, from cliff to cliff; its walk stepped 0.2 m at a time as the flanks rise,
//     behind a parapet 1.1 m over the walk, an arrow slit every 3 m; a stair of 0.18 m rises up its back to the walk east of the gate;
//   - the gate tower: 10 by 9 m and 11 m to its eaves, 3.2 m proud of the wall, a passage 3.6 m wide and 4.2 m clear under a log lintel, two
//     leaves standing open against the passage's walls; a door from the walk on each side; a low pyramid of dark shingle;
//   - the flank towers: round, 3.2 m across the outside, 8 m to the eaves over the cliff's foot, a shingle cone;
//   - behind: the kit's Markish hall (markHall, shingle, carved) for the captain, a turf-roofed barracks, a storehouse on four posts.
// -> { group, tris, draws, own, ground(x, z), wall { z0, z1, x0, x1, h, walk(x), parapet, slits }, gate { w, h, z0, z1, x0, x1 }, tower { x0, x1,
//      z0, z1, top }, flanks [{ x, z, r, top }], stair { x0, x1, z0, z1, n, rise, run }, road { w }, floor, flank, cliff (the land's half-widths),
//      hall, barracks, store, paths }
export function markPassFort(o = {}, r = stream('passfort')) {
  markTextures(); aurenneTextures() /* the limestone, for the ashlar */; const key = String(o.key || 'passfort');
  const M = { ...mats(), snow: mat('plaster', { ns: .3, color: 0xf2f5f8, rough: .95 }), cliff: mat('rock', { ns: 1.4, color: 0x6c6a66, rough: .95 }), shingle: mat('shingle', { ns: 1.4, rough: .8 }),
    log: mat('beam', { ns: 1.1, color: 0x7a624a, rough: .9 }), ashlar: mat('limestone', { ns: 1.1, color: 0x8e8a84, rough: .95 }), cope: mat('limestone', { ns: .9, color: 0x7a7670, rough: .9 }), gravel: mat('turfDry', { ns: 1.0, color: 0x8a8070, rough: 1 }) };
  M.shingle.side = THREE.DoubleSide;
  const B = new Map(), V = (x, y) => new THREE.Vector2(x, y);
  const put = (geo, k, x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0, uv = .5) => { const g = geo.index ? geo.toNonIndexed() : geo; for (const a of Object.keys(g.attributes)) if (!['position', 'normal'].includes(a)) g.deleteAttribute(a);
    if (!g.attributes.normal) g.computeVertexNormals();
    g.applyMatrix4(new THREE.Matrix4().compose(new THREE.Vector3(x, y, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(rx, ry, rz, 'YXZ')), new THREE.Vector3(1, 1, 1))); worldUV(g, uv);
    if (!B.has(k)) B.set(k, []); B.get(k).push(g); };
  const bx = (k, x0, x1, y0, y1, z0, z1, uv = .5) => put(new THREE.BoxGeometry(x1 - x0, y1 - y0, z1 - z0), k, (x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2, 0, 0, 0, uv);
  const rod = (k, a, b, rad, seg = 6) => { const A = new THREE.Vector3(...a), Bv = new THREE.Vector3(...b), d = Bv.clone().sub(A), g = new THREE.CylinderGeometry(rad, rad, d.length(), seg); g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.clone().normalize())); const m = A.add(Bv).multiplyScalar(.5); put(g, k, m.x, m.y, m.z); };
  const sm = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
  // the land: the floor, the flanks, the cliffs; the road's rise along z; a little roughness off the road and the buildings
  const FLOOR = 9, FLANK = 15, CLIFF = 1.6, FG = .5, WZ0 = -1.3, WT = 2.6, WZ1 = WZ0 + WT, WH = 5.5, RW = 4, F = field(stream(key + ':land'), .5);
  const along = z => z < 0 ? z / 14 : z / 40, across = ax => ax <= FLOOR ? 0 : ax <= FLANK ? (ax - FLOOR) * FG : (FLANK - FLOOR) * FG + (ax - FLANK) * CLIFF;
  const rough = (x, z) => { const ax = Math.abs(x); return F(x, 0, z)[1] * (ax < FLOOR ? .25 : ax < FLANK ? .5 : 1.4) * sm(RW / 2, RW / 2 + 3, ax) * (1 - (1 - sm(1.5, 5, Math.abs(z - (WZ0 + WZ1) / 2) - 4)) * (1 - sm(FLANK + 5, FLANK + 9, ax))); } /* none by the wall's line, so its cells sit true */;
  const ground = (x, z) => along(z) + across(Math.abs(x)) + rough(x, z);
  { const steps = (bands, end) => { const v = []; for (const [a, b, st] of bands) for (let q = a; q < b - 1e-6; q += st) v.push(+q.toFixed(2)); v.push(end); return v; };
    const gx = steps([[-90, -30, 4], [-30, -18, 1], [-18, 18, .5], [18, 30, 1], [30, 90, 4]], 90), gz = steps([[-120, -40, 8], [-40, -10, 1], [-10, 10, .5], [10, 60, 1], [60, 140, 8]], 140), NX = gx.length;
    const pos = []; for (const z of gz) for (const x of gx) pos.push(x, ground(x, z), z); const I = { snow: [], cliff: [], gravel: [] }, P = (i) => [pos[3 * i], pos[3 * i + 1], pos[3 * i + 2]];
    for (let j = 0; j + 1 < gz.length; j++) for (let i = 0; i + 1 < NX; i++) { const a = j * NX + i, b = a + 1, c = a + NX, d = c + 1;
      for (const t of [[a, c, b], [b, c, d]]) { const [p, q, s] = t.map(P), n = new THREE.Vector3(...q).sub(new THREE.Vector3(...p)).cross(new THREE.Vector3(...s).sub(new THREE.Vector3(...p))).normalize(), cx = (p[0] + q[0] + s[0]) / 3;
        I[Math.abs(cx) < RW / 2 ? 'gravel' : (Math.abs(cx) > FLANK + .3 ? Math.abs(n.y) < .86 : Math.abs(n.y) < .62) ? 'cliff' : 'snow'].push(...t); } } /* snow on the floor and the flanks, on the cliffs only where they shelve */
    for (const [k, idx] of Object.entries(I)) { const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals(); put(g, k, 0, 0, 0, 0, 0, 0, .35); } }
  // the wall: cells of 0.4 m along x, each from under the land to the walk, its walk at the highest land under the cell plus WH, rounded to
  // 0.2 m, so the walk steps up the flanks a rise at a time; the parapet on the outer face; the slits; the cope on the parapet
  const GX = 5, GW = 1.8, GHT = 4.2, TOP = WH + 5.5, WX = FLANK + .2 /* to the cliff's foot, under the flank towers */;
  const cellTop = x => { let h = -99; for (const zz of [WZ0, WZ1]) for (const xx of [x - .2, x, x + .2]) h = Math.max(h, ground(xx, zz)); return h; };
  const walk = x => { const c = GX + Math.max(0, Math.floor((Math.abs(x) - GX + 1e-6) / .4)) * .4 + .2 /* the cell's middle, the cells laid from the tower out */; return Math.round((Math.max(cellTop(c), ground(0, WZ0)) + WH) / .2) * .2; }, PH = 1.1, PT = .5, slits = [];
  for (let x0 = GX; x0 < WX - 1e-6; x0 += .4) for (const s of [-1, 1]) { const xa = s * x0, xb = s * (x0 + .4), xl = Math.min(xa, xb), xh = Math.max(xa, xb), y = walk((xa + xb) / 2), y0 = Math.min(cellTop((xa + xb) / 2), y) - 1.5;
    bx('ashlar', xl, xh, y0, y, WZ0, WZ1, .6); bx('ashlar', xl, xh, y, y + PH, WZ0, WZ0 + PT, .6); bx('cope', xl - .01, xh + .01, y + PH, y + PH + .1, WZ0 - .04, WZ0 + PT + .04);
    if (Math.round((x0 - GX) / .4) % 7 === 3) { slits.push([+((xa + xb) / 2).toFixed(2), +(y + .2).toFixed(2)]); put(new THREE.PlaneGeometry(.12, .8), 'dark', (xa + xb) / 2, y + .55, WZ0 - .005, 0, Math.PI); } }
  // the gate tower: its two sides, the passage's roof over a log lintel, the front and back walls over the passage, the leaves open
  const TZ0 = WZ0 - 3.2, TZ1 = WZ1 + 2.0, Y0 = ground(0, TZ0) - 1.5, RY = Math.max(ground(0, TZ0), ground(0, TZ1)), PY = ground(0, (TZ0 + TZ1) / 2);
  for (const s of [-1, 1]) bx('ashlar', s > 0 ? GW : -GX, s > 0 ? GX : -GW, Y0, TOP, TZ0, TZ1, .6);
  bx('ashlar', -GW, GW, PY + GHT + .45, TOP, TZ0, TZ1, .6); for (const z of [TZ0 + .25, TZ1 - .25]) rod('log', [-GW - .3, PY + GHT + .22, z], [GW + .3, PY + GHT + .22, z], .24, 8);
  for (let k = 0; k < 7; k++) rod('log', [-GW - .1, PY + GHT + .2, TZ0 + .9 + k * (TZ1 - TZ0 - 1.8) / 6], [GW + .1, PY + GHT + .2, TZ0 + .9 + k * (TZ1 - TZ0 - 1.8) / 6], .2, 7) /* the passage's ceiling, logs */;
  for (const s of [-1, 1]) { bx('log', s * GW - (s > 0 ? .14 : 0), s * GW + (s > 0 ? 0 : .14), PY, PY + GHT - .05, TZ0 + .9, TZ0 + .9 + GW - .05) /* a leaf, open against the passage's wall */;
    for (const y of [PY + .6, PY + GHT / 2, PY + GHT - .7]) bx('iron', s * GW - (s > 0 ? .17 : -.14), s * GW + (s > 0 ? -.14 : .17), y - .06, y + .06, TZ0 + 1.0, TZ0 + .9 + GW - .15); }
  // the tower's doors from the walk, its slits, its eaves course and the roof's pyramid of shingle on its plate
  for (const s of [-1, 1]) { const y = walk(s * (GX + .2)); put(new THREE.PlaneGeometry(1.0, 2.0), 'dark', s * (GX + .005), y + 1.0, (WZ0 + WZ1) / 2 + .2, 0, s * Math.PI / 2); }
  for (const [x, y] of [[-2.5, WH + 2], [2.5, WH + 2], [0, WH + 2.4]]) put(new THREE.PlaneGeometry(.14, .9), 'dark', x, PY + y, TZ0 - .005, 0, Math.PI);
  bx('cope', -GX - .2, GX + .2, TOP, TOP + .25, TZ0 - .2, TZ1 + .2);
  { const g = new THREE.ConeGeometry((GX + .8) * Math.SQRT2, 3.6, 4, 1, true, Math.PI / 4); g.scale(1, 1, (TZ1 - TZ0 + 1.6) / (2 * GX + 1.6)); put(g, 'shingle', 0, TOP + .25 + 1.8, (TZ0 + TZ1) / 2, 0, 0, 0, .6); }
  // the flank towers: round over the cliff's foot, their floor at the walk, a cone of shingle
  const flanks = []; for (const s of [-1, 1]) { const x = s * (WX + 1.4), z = (WZ0 + WZ1) / 2, R = 3.2, gy = Math.min(ground(x - R, z), ground(x + R, z), ground(x, z - R), ground(x, z + R)) - 1.5, top = walk(s * (WX - .2)) + 2.8;
    put(new THREE.CylinderGeometry(R, R + .15, top - gy, 24), 'ashlar', x, (top + gy) / 2, z, 0, 0, 0, .6); put(new THREE.CylinderGeometry(R + .2, R + .2, .25, 24), 'cope', x, top + .12, z);
    put(new THREE.ConeGeometry(R + .55, 3.4, 24, 1, true), 'shingle', x, top + .25 + 1.7, z, 0, 0, 0, .6); put(new THREE.PlaneGeometry(.14, .9), 'dark', x - s * .6, top - 1.2, z - R - .02, 0, Math.PI);
    put(new THREE.PlaneGeometry(1.0, 2.0), 'dark', x - s * (R + .005) * Math.cos(.3), walk(s * (WX - .2)) + 1.0, z + .5, 0, -s * Math.PI / 2) /* its door from the walk */; flanks.push({ x, z, r: R, top: +top.toFixed(2) }); }
  // the stair to the walk, east of the gate: a flight of 0.3 m treads straight back from the wall's back face up the pass, 1.2 m wide, on
  // its own solid of ashlar; its top tread level with the walk
  const SXa = 6.4, SXb = 7.6, SY = walk((SXa + SXb) / 2), SL = 9.6, SG = ground((SXa + SXb) / 2, WZ1 + SL), NS = Math.ceil((SY - SG) / .18), SR = (SY - SG) / NS, SZ1 = WZ1 + NS * .3;
  for (let k = 1; k <= NS; k++) { const za = WZ1 + (NS - k) * .3, zb = za + .3, y = SG + k * SR; bx('ashlar', SXa, SXb, Math.min(ground(SXa, zb), ground(SXb, zb)) - .6, y, za, zb, .6); }
  // behind: the captain's hall, the barracks, the storehouse on its posts; the paths from the road to their doors
  const H = markHall({ roof: 'shingle', w: 7, d: 14, porch: true, chimney: true, carve: true, wall: 1 }, stream(key + ':hall')), HX = -5.6, HZ = 21, HRY = Math.PI;
  H.group.position.set(HX, ground(HX, HZ) - .05, HZ); H.group.rotation.y = HRY;
  const K = markHall({ roof: 'turf', turf: 'moss', w: 6, d: 11, porch: false, chimney: true, carve: false, wall: 2 }, stream(key + ':barracks')), KX = 5.4, KZ = 32, KRY = Math.PI;
  K.group.position.set(KX, ground(KX, KZ) - .05, KZ); K.group.rotation.y = KRY;
  const SXc = 6.2, SZc = 15, SF = 1.1, SYc = ground(SXc, SZc); for (const [dx, dz] of [[-1.3, -1.3], [1.3, -1.3], [-1.3, 1.3], [1.3, 1.3]]) { bx('ashlar', SXc + dx - .3, SXc + dx + .3, SYc - .3, SYc + .35, SZc + dz - .3, SZc + dz + .3); bx('log', SXc + dx - .15, SXc + dx + .15, SYc + .35, SYc + SF - .1, SZc + dz - .15, SZc + dz + .15); }
  bx('plank', SXc - 1.7, SXc + 1.7, SYc + SF - .1, SYc + SF + .05, SZc - 1.7, SZc + 1.7); for (const s of [-1, 1]) { bx('log', SXc - 1.6, SXc + 1.6, SYc + SF, SYc + SF + 2.1, SZc + s * 1.6 - .1, SZc + s * 1.6 + .1); bx('log', SXc + s * 1.6 - .1, SXc + s * 1.6 + .1, SYc + SF, SYc + SF + 2.1, SZc - 1.5, SZc + 1.5); }
  { const RP = 40 * Math.PI / 180, RWd = 2.2, L = RWd / Math.cos(RP) + .1; for (const s of [-1, 1]) put(new THREE.BoxGeometry(3.9, .12, L), 'shingle', SXc, SYc + SF + 2.1 + Math.tan(RP) * RWd / 2, SZc + s * RWd / 2, s * RP, 0, 0, .6);
    for (const s of [-1, 1]) { const tri = new THREE.Shape([V(-RWd, 0), V(RWd, 0), V(0, Math.tan(RP) * RWd)]); const g = new THREE.ExtrudeGeometry(tri, { depth: .1, bevelEnabled: false }); g.translate(0, 0, -.05); put(g, 'log', SXc + s * 1.6, SYc + SF + 2.1, SZc, 0, Math.PI / 2); } }
  for (let k = 0; k < 5; k++) bx('plank', SXc - 2.2 - k * .3, SXc - 1.9 - k * .3, SYc, SYc + SF - .1 - k * .2, SZc - .5, SZc + .5);
  const hd = H.stairOut + .6, kd = K.stairOut + .6;
  const paths = [[[0, -40], [0, 60]], [[0, HZ - hd], [HX, HZ - hd]], [[0, KZ - kd], [KX, KZ - kd]], [[0, SZc], [SXc - 3.4, SZc]], [[2.6, SZ1 + .8], [(SXa + SXb) / 2, SZ1 + .8]]];
  const group = new THREE.Group(); let tris = 0; for (const [k, gs] of B) { const g = mergeGeometries(gs, false); gs.forEach(x => x.dispose()); const m = new THREE.Mesh(g, M[k]); m.name = k; m.castShadow = !['snow', 'cliff', 'gravel', 'dark'].includes(k); m.receiveShadow = true; group.add(m); tris += g.attributes.position.count / 3; }
  const own = group.children.length; group.add(H.group, K.group); tris += H.tris + K.tris;
  return { group, tris: Math.round(tris), draws: own + H.draws + K.draws, own, ground, floor: FLOOR, flank: FLANK, cliff: CLIFF,
    wall: { z0: WZ0, z1: WZ1, x0: -WX, x1: WX, h: WH, walk, parapet: PH, pt: PT, slits }, gate: { w: 2 * GW, h: GHT, y: PY, z0: TZ0, z1: TZ1, x0: -GW, x1: GW },
    tower: { x0: -GX, x1: GX, z0: TZ0, z1: TZ1, top: TOP }, flanks, stair: { x0: SXa, x1: SXb, z0: WZ1, z1: SZ1, n: NS, rise: +SR.toFixed(3), run: .3, top: SY, foot: SG },
    road: { w: RW }, hall: { x: HX, z: HZ, ry: HRY, w: 7, d: 14, door: [HX, HZ - H.stairOut] }, barracks: { x: KX, z: KZ, ry: KRY, door: [KX, KZ - K.stairOut] }, store: { x: SXc, z: SZc, floor: SYc + SF + .05 }, paths };
}

// ── the Mark's fjord port (Session 1239, card F8; L5's "the Mark's settlements", OG-034's "fjord port" and its harbour strip, OG-025's
// timber town by the water). A trading place at a fjord's head, after the wharves of Bryggen and the boathouses (naust) of the west
// coast: the land is a shelf of made ground under a fjord wall, and everything faces the water. Built at true size, the fjord to -z, the
// shore along x, y 0 the water. The canon's Mark: timber halls, dark shingle, nothing decorative that does not also keep out cold.
//   - the land: the shelf 1.6 m over the water at the wharf, rising 1 in 30 to the wall's foot at z 24; the wall a wooded talus at 1 in
//     1.1 for 10 m, then cliff at 1 in 0.45 and steeper; it comes down to the water past x ±42, the fjord widening to ±160 by z -120; a
//     shingle beach east of the wharf; the far wall where the fjord turns, 200 m out;
//   - the wharf: a timber deck 1.6 m over the water from x -26 to 14, 6 m out from the shore, on stringers over ten log cribs (each 2.6 m
//     square, logs crossed in courses from the bed up), a face log along its edge, fender logs, bollards;
//   - the warehouses: three of the kit's halls (markHall) gable-on to the wharf, shingle-roofed and carved, a hoist beam from each gable;
//   - the boathouses: two nausts on the beach, dry-stone side walls 0.7 m thick and 1.9 m high under a turf roof, the mouth open to the
//     water, a slip log from the back down into the water, a færing (a four-oared double-ender, 6.2 m) on it;
//   - the stockfish racks: two A-framed racks at the west end, the fish hung in pairs over their bars to dry;
//   - the ship: the kit's Markish cutter (ships.js markCutter, striped) alongside the wharf, a gangplank from the deck to her rail.
// -> { group, tris, draws, own, ground, shelf, wharf { x0, x1, z0, z1, deck }, cribs [{ x, z, foot, bed }], ship { x, z, W, L, draft, rail },
//   plank { a, b }, halls [{ x, z, door [x, z] }], nausts [{ x, z0, z1, half, top(z), floor(z), runner(z), boat { z, y, L, B, keel } }],
//   racks [{ x, z0, z1, low }], paths }
function faering(put, k, L, B, D) { /* a double-ended open boat, its keel at y 0, the bow to +z: a hull ribbon round the half-sections, thwarts, two oars */
  const NU = 24, NV = 10, pos = [], idx = [];
  const half = u => B / 2 * Math.pow(Math.sin(Math.PI * u), .7), sheer = u => D + .32 * Math.pow(2 * u - 1, 4), rock = u => .06 * Math.pow(2 * u - 1, 2);
  for (let i = 0; i <= NU; i++) { const u = i / NU, z = (u - .5) * L; for (let j = 0; j <= NV; j++) { const a = (j / NV - .5) * Math.PI, b = half(u), y0 = rock(u), y1 = sheer(u); pos.push(b * Math.sin(a), y1 - (y1 - y0) * Math.cos(a), z); } }
  for (let i = 0; i < NU; i++) for (let j = 0; j < NV; j++) { const a = i * (NV + 1) + j, b = a + 1, c = a + NV + 1, d = c + 1; idx.push(a, b, c, b, d, c); }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals(); put(g, k);
  for (const u of [.3, .5, .7]) { const y = D * .7, b = half(u) * .92; put(new THREE.BoxGeometry(2 * b, .05, .22), 'plank', 0, y, (u - .5) * L); }
  for (const s of [-1, 1]) { const g2 = new THREE.CylinderGeometry(.03, .03, L * .62, 6); g2.rotateX(Math.PI / 2); put(g2, 'log', s * .22, D * .35, .1); }
}
export function markFjordPort(o = {}, r = stream('fjordport')) {
  markTextures(); const key = String(o.key || 'fjordport');
  const std = (c, ro = .9, x = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: ro, ...x });
  const M = { ...mats(), snow: mat('plaster', { ns: .3, color: 0xf2f5f8, rough: .95 }), cliff: mat('rock', { ns: 1.4, color: 0x9a9a94, rough: .95 }), shingle: mat('shingle', { ns: 1.4, rough: .8 }),
    log: mat('beam', { ns: 1.1, color: 0x6a5440, rough: .9 }), plank: mat('wood', { ns: .9, color: 0x8a7a66, rough: .9 }), gravel: mat('turfDry', { ns: 1.0, color: 0x8a8274, rough: 1 }),
    turf: mat('turfMoss', { ns: 1.1, rough: .95 }), strand: mat('rock', { ns: .8, color: 0x8a867e, rough: 1 }), stone: mat('rock', { ns: 1.6, color: 0x7a7670, rough: .95 }), dry: mat('stone', { ns: 1.5, color: 0x6e6a64, rough: .95 }),
    tar: mat('wood', { ns: .8, color: 0x6a5644, rough: .75 }), fish: std(0xa89880, .9), needle: std(0x2c3a2a, .95), bark: std(0x4a3a2c, .95), water: std(0x2c4a50, .12, { metalness: .2 }) };
  M.shingle.side = M.tar.side = M.turf.side = M.needle.side = M.fish.side = THREE.DoubleSide;
  const B = new Map();
  const put = (geo, k, x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0, uv = .5) => { const g = geo.index ? geo.toNonIndexed() : geo; for (const a of Object.keys(g.attributes)) if (!['position', 'normal'].includes(a)) g.deleteAttribute(a);
    if (!g.attributes.normal) g.computeVertexNormals();
    g.applyMatrix4(new THREE.Matrix4().compose(new THREE.Vector3(x, y, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(rx, ry, rz, 'YXZ')), new THREE.Vector3(1, 1, 1))); worldUV(g, uv);
    if (!B.has(k)) B.set(k, []); B.get(k).push(g); return g; };
  const bx = (k, x0, x1, y0, y1, z0, z1, uv = .5) => put(new THREE.BoxGeometry(x1 - x0, y1 - y0, z1 - z0), k, (x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2, 0, 0, 0, uv);
  const rod = (k, a, b, rad, seg = 6) => { const A = new THREE.Vector3(...a), Bv = new THREE.Vector3(...b), d = Bv.clone().sub(A), g = new THREE.CylinderGeometry(rad, rad, d.length(), seg); g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.clone().normalize())); const m = A.add(Bv).multiplyScalar(.5); put(g, k, m.x, m.y, m.z); };
  const quad = (k, P, t) => { /* a slab under four top corners (in order round), t thick, straight down */ const Q = [...P, ...P.map(p => [p[0], p[1] - t, p[2]])], F = [[0, 1, 2], [0, 2, 3], [4, 6, 5], [4, 7, 6], [0, 4, 5], [0, 5, 1], [1, 5, 6], [1, 6, 2], [2, 6, 7], [2, 7, 3], [3, 7, 4], [3, 4, 0]], pos = [];
    for (const f of F) for (const i of f) pos.push(...Q[i]); const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.computeVertexNormals(); put(g, k); };
  const sm = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
  // the land: the shelf, its front (under the wharf a bank of riprap, east of it a beach of 1 in 6), the fjord wall behind and the headlands
  const SH = 1.6, WALLZ = 24, HEAD = 42, F = field(stream(key + ':land'), 1);
  const shelf = z => SH + Math.max(0, z) / 30;
  const frontW = z => z >= 0 ? shelf(z) : z >= -6 ? SH + z * .78 : Math.max(-40, SH - 4.68 + (z + 6) * .35);
  const frontB = z => z >= 10 ? shelf(z) : shelf(10) - (10 - z) / 6 > -3 ? shelf(10) - (10 - z) / 6 : Math.max(-40, -3 + (z - (10 - 6 * (shelf(10) + 3))) * .45);
  const headAt = z => HEAD + 118 * (1 - sm(-120, -10, z)), edge = (x, z) => { const a = z - WALLZ, b = Math.abs(x) - headAt(z), m = Math.max(a, b); return m > -4 ? m + Math.log1p(Math.exp(-Math.abs(a - b) * 1.5)) / 1.5 * sm(-4, 0, m) : m; } /* a soft max, so the corners round */;
  const wallRise = e => { if (e <= 0) return 0; if (e < 10) return .9 * e; const v = 2.2 * (e - 10) + .02 * (e - 10) ** 2; return 9 + 140 * (1 - Math.exp(-v / 140)); } /* a wooded talus for 10 m, then the cliff, rounding over at 150 m */;
  const farRise = z => Math.min(160, -40 + 1.6 * (-200 - z)) /* the far wall, where the fjord turns */;
  const base = (x, z) => { const t = sm(12, 20, x), f = frontW(z) * (1 - t) + frontB(z) * t, e = edge(x, z); return Math.max(f + wallRise(e), farRise(z)); };
  const rough = (x, z) => { const e = edge(x, z), w = sm(-3, 6, e) * 3.2 + (z < -8 ? .3 : 0) * (1 - sm(-3, 6, e)); return F(x, 0, z)[1] * w + (F(x * .12, 0, z * .12 + 7)[1] * 16 + F(x * .35, 0, z * .35 + 3)[1] * 5) * sm(6, 22, e) + F(x * .5, 0, z * .5)[1] * 4 * sm(-205, -225, z); } /* buttresses and gullies on the cliff */;
  const ground = (x, z) => base(x, z) + rough(x, z);
  { const steps = (bands, end) => { const v = []; for (const [a, b, st] of bands) for (let q = a; q < b - 1e-6; q += st) v.push(+q.toFixed(2)); v.push(end); return v; };
    const gx = steps([[-260, -70, 10], [-70, -44, 2], [-44, 44, 1], [44, 70, 2], [70, 260, 10]], 260), gz = steps([[-330, -220, 10], [-220, -40, 10], [-40, -10, 2], [-10, 28, 1], [28, 50, 2], [50, 150, 8]], 150), NX = gx.length;
    const pos = []; for (const z of gz) for (const x of gx) pos.push(x, ground(x, z), z); const I = { snow: [], cliff: [], gravel: [], turf: [], strand: [] }, P = i => [pos[3 * i], pos[3 * i + 1], pos[3 * i + 2]];
    for (let j = 0; j + 1 < gz.length; j++) for (let i = 0; i + 1 < NX; i++) { const a = j * NX + i, b = a + 1, c = a + NX, d = c + 1;
      for (const t of [[a, c, b], [b, c, d]]) { const [p, q, s] = t.map(P), n = new THREE.Vector3(...q).sub(new THREE.Vector3(...p)).cross(new THREE.Vector3(...s).sub(new THREE.Vector3(...p))).normalize(), cx = (p[0] + q[0] + s[0]) / 3, cy = (p[1] + q[1] + s[1]) / 3, cz = (p[2] + q[2] + s[2]) / 3, ny = Math.abs(n.y);
        const bs = Math.hypot(base(cx + .5, cz) - base(cx - .5, cz), base(cx, cz + .5) - base(cx, cz - .5)) /* the land's own slope, so the moss and the rock lie in bands, not by each triangle */;
        const k = cy < .25 ? 'strand' : edge(cx, cz) < -1 && cz > -2 && cz < WALLZ ? (cx > 14 && cy < shelf(10) + .05 ? 'strand' : cz < 4 && cx > -28 && cx < 16 ? 'gravel' : 'turf') : bs > 1.15 || ny < .5 ? 'cliff' : cy > 45 ? 'snow' : 'turf';
        I[k].push(...t); } }
    for (const [k, idx] of Object.entries(I)) { if (!idx.length) continue; const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals(); put(g, k, 0, 0, 0, 0, 0, 0, .35); } }
  { const g = new THREE.PlaneGeometry(560, 360); g.rotateX(-Math.PI / 2); put(g, 'water', 0, 0, -150); }
  // the wharf: cribs of crossed logs from the bed up, stringers over them back onto the bank, deck boards along the face in staggered
  // lengths, the face log, fenders, bollards
  const WX0 = -26, WX1 = 14, WF = -6, WB = 0, DY = SH, LR = .15, cribs = [];
  for (let x = WX0 + 1.5; x <= WX1 - 1.4; x += 4.1) { const cz = WF + 1.4, h = 1.3, bed = Math.min(...[-h, 0, h].flatMap(dx => [-h, 0, h].map(dz => ground(x + dx, cz + dz)))), foot = bed - .25, top = DY - .32;
    let c = 0; for (let y = foot + LR; y < top - .02; y += 2 * LR * .92, c++) for (const s of [-1, 1]) { if (c % 2) rod('log', [x - h - .15, y, cz + s * (h - LR)], [x + h + .15, y, cz + s * (h - LR)], LR, 6); else rod('log', [x + s * (h - LR), y, cz - h - .15], [x + s * (h - LR), y, cz + h + .15], LR, 6); }
    for (let k = 0; k < 7; k++) { const q = .25 + r() * .2, g = new THREE.IcosahedronGeometry(q, 0); put(g, 'stone', x + (r() - .5) * 1.5, top - .1 - r() * .3, cz + (r() - .5) * 1.5, r() * 3, r() * 3, 0, .6); }
    cribs.push({ x: +x.toFixed(2), z: cz, h, foot: +foot.toFixed(3), bed: +bed.toFixed(3) }); }
  for (let x = WX0 + .3; x < WX1; x += 1.0) bx('log', x - .1, x + .1, DY - .32, DY - .07, WF + .05, WB + 1.2);
  { let row = 0; for (let z = WF; z < WB + .5 - 1e-6; z += .26, row++) { const off = (row % 3) * 1.4; let xa = WX0; for (let x = WX0 + off + 1.2; xa < WX1 - 1e-6; x += 4.2) { const xb = Math.min(WX1, x); if (xb - xa > .1) bx('plank', xa, xb, DY - .07, DY - .005 - r() * .012, z + .005, z + .255, .6); xa = xb; } } }
  bx('log', WX0, WX1, DY - .34, DY + .12, WF - .26, WF);
  for (const x of [WX0, WX1]) bx('log', x - .13 * Math.sign(x - (WX0 + WX1) / 2) - .13, x - .13 * Math.sign(x - (WX0 + WX1) / 2) + .13, DY - .34, DY + .02, WF, WB + .5);
  for (let x = WX0 + 1.2; x < WX1 - .5; x += 3) rod('log', [x, -1.2, WF - .4], [x, DY + .05, WF - .4], .14, 7);
  const bollards = []; for (let x = WX0 + 2.5; x < WX1 - 1; x += 6) { put(new THREE.CylinderGeometry(.16, .18, .7, 9), 'log', x, DY + .35, WF + .45); put(new THREE.CylinderGeometry(.2, .2, .08, 9), 'log', x, DY + .72, WF + .45); bollards.push(x); }
  // the warehouses: the kit's halls, gable-on to the wharf, the foot of each one's steps 1.4 m behind the wharf's back; a hoist beam
  // from each front gable over its door, a rope and a hook
  const halls = [], hallG = [], HW = 6.6, HD = 13;
  for (const [i, hx] of [-20, -11.6, -3.2].entries()) { const H = markHall({ roof: 'shingle', w: HW, d: HD, porch: false, chimney: i === 1, carve: true, wall: i % 4 }, stream(key + ':hall' + i)), hz = WB + 1.4 + H.stairOut, gy = Math.min(ground(hx - HW / 2, hz - HD / 2), ground(hx + HW / 2, hz - HD / 2)) - .05;
    H.group.position.set(hx, gy, hz); H.group.rotation.y = Math.PI; hallG.push(H); const fz = hz - HD / 2, by = gy + H.sill + H.wh + Math.tan(H.pitch) * (HW / 2 + .5) * .55;
    bx('log', hx - .12, hx + .12, by - .12, by + .12, fz - 1.9, fz + .6); for (const s of [-1, 1]) rod('log', [hx + s * .1, by - .1, fz - 1.4], [hx + s * .5, by - .9, fz - .03], .06, 5);
    put(new THREE.CylinderGeometry(.12, .12, .1, 10), 'iron', hx, by - .2, fz - 1.65, 0, 0, Math.PI / 2); put(new THREE.CylinderGeometry(.012, .012, by - .2 - (gy + 3.4), 4), 'rope', hx, (by - .2 + gy + 3.4) / 2, fz - 1.65);
    put(new THREE.TorusGeometry(.07, .015, 5, 10, Math.PI * 1.5), 'iron', hx, gy + 3.33, fz - 1.65);
    halls.push({ x: hx, z: +hz.toFixed(2), y: +gy.toFixed(3), door: [hx, +(hz - H.stairOut).toFixed(2)], front: +fz.toFixed(2), hoist: +by.toFixed(2) }); }
  // the boathouses: two nausts on the beach, the mouth to the water; dry-stone walls in cells of 0.5 m under a straight top from the
  // back down to the mouth; a back wall; a turf roof on its two slabs; a timber gable over the mouth on a lintel and planks across the
  // back gable; a slip log from the back out into the water; the færing on it, bow to the water
  const nausts = [], NH = 1.6, NT = .7, NWH = 1.9, NP = 30 * Math.PI / 180, NZ0 = 1.6, NZ1 = 10.4, BL = 6.2, BB = 1.5, BD = .62;
  for (const nx of [23.2, 29.6]) { const fl = z => ground(nx, z), y1 = Math.max(...[-NH - NT, 0, NH + NT].map(dx => ground(nx + dx, NZ1))) + NWH, y0 = Math.max(...[-NH - NT, 0, NH + NT].map(dx => ground(nx + dx, NZ0))) + NWH;
    const top = z => y0 + (y1 - y0) * (z - NZ0) / (NZ1 - NZ0), rise = Math.tan(NP) * (NH + NT + .35);
    for (const s of [-1, 1]) for (let z = NZ0; z < NZ1 - 1e-6; z += .5) { const xa = nx + s * NH, xb = nx + s * (NH + NT), lo = Math.min(ground(xa, z), ground(xb, z), ground(xa, z + .5), ground(xb, z + .5)) - .35;
      bx('dry', Math.min(xa, xb), Math.max(xa, xb), lo, top(z + .25), z, z + .5, .7); }
    bx('dry', nx - NH - NT, nx + NH + NT, Math.min(ground(nx - NH, NZ1), ground(nx + NH, NZ1)) - .35, y1, NZ1, NZ1 + NT, .7);
    for (const s of [-1, 1]) { const za = NZ0 - .5, zb = NZ1 + NT + .3, ea = s * (NH + NT + .35), ya = top(za) - .1, yb = top(zb) - .1;
      quad('turf', [[nx, ya + rise, za], [nx, yb + rise, zb], [nx + ea, yb, zb], [nx + ea, ya, za]].map(p => [p[0], p[1] + .28, p[2]]), .3); }
    rod('log', [nx - NH - NT, y0 + .15, NZ0 + .12], [nx + NH + NT, y0 + .15, NZ0 + .12], .15, 7); for (const s of [-1, 1]) rod('log', [nx + s * (NH + NT / 2), y0 + .15, NZ0 - .2], [nx + s * (NH + NT / 2), y1 + .15, NZ1 + NT], .14, 6) /* the wall plates */;
    { const V2 = (a, b) => new THREE.Vector2(a, b), tri = new THREE.Shape([V2(-NH - NT, 0), V2(NH + NT, 0), V2(0, rise)]); const gg = new THREE.ExtrudeGeometry(tri, { depth: .08, bevelEnabled: false }); put(gg, 'plank', nx, y0 + .14, NZ0 + .02);
      const gb = new THREE.ExtrudeGeometry(tri, { depth: .08, bevelEnabled: false }); put(gb, 'plank', nx, y1, NZ1 + NT - .1); }
    // the slip log: its top 0.12 m over the floor, from 0.6 m inside the back wall down the beach to 0.5 m under the water
    let zEnd = NZ0; while (fl(zEnd) > -.5 && zEnd > NZ0 - 14) zEnd -= .25; const runner = z => fl(z) + .12, zr1 = NZ1 - .6;
    for (let z = zEnd; z < zr1 - 1e-6; z += .5) rod('log', [nx, runner(z) - .09, z], [nx, runner(Math.min(zr1, z + .5)) - .09, Math.min(zr1, z + .5) + .02], .1, 6);
    // the færing, bow to the water, its keel on the slip log: lying along the line between two points of the log 1.2 m in from its ends
    const bz = NZ0 + 1.4 + BL / 2, za = bz - BL / 2 + 1.2, zb = bz + BL / 2 - 1.2, sl = Math.atan2(runner(zb) - runner(za), zb - za), by = (runner(za) + runner(zb)) / 2 + .002;
    { const bB = new Map(); const bput = (g, k, x = 0, y = 0, z = 0) => { const gg = g.index ? g.toNonIndexed() : g; for (const a of Object.keys(gg.attributes)) if (!['position', 'normal'].includes(a)) gg.deleteAttribute(a); if (!gg.attributes.normal) gg.computeVertexNormals(); gg.translate(x, y, z); if (!bB.has(k)) bB.set(k, []); bB.get(k).push(gg); };
      faering(bput, 'tar', BL, BB, BD); const Mx = new THREE.Matrix4().compose(new THREE.Vector3(nx, by, bz), new THREE.Quaternion().setFromEuler(new THREE.Euler(sl, Math.PI, 0, 'YXZ')), new THREE.Vector3(1, 1, 1));
      for (const [k, gs] of bB) for (const g of gs) { g.applyMatrix4(Mx); worldUV(g, .5); if (!B.has(k)) B.set(k, []); B.get(k).push(g); } }
    nausts.push({ x: nx, z0: NZ0, z1: NZ1, half: NH, wall: NT, top, floor: fl, runner, runnerZ: [+zEnd.toFixed(2), zr1], lintel: +y0.toFixed(3), boat: { z: +bz.toFixed(2), y: +by.toFixed(3), L: BL, B: BB, D: BD, pitch: +sl.toFixed(4) } }); }
  // the stockfish racks: A-frames every 2 m along z, a ridge pole and two bars a side; the fish in pairs over the bars by their tails
  const racks = [], RZ0 = 4, RZ1 = 18, RH = 3.2, RS = 1.2;
  for (const rx of [-36.5, -31]) { let low = 99; for (let z = RZ0; z <= RZ1 + 1e-6; z += 2) { const gy = ground(rx, z); for (const s of [-1, 1]) rod('log', [rx + s * RS, gy - .2, z], [rx - s * .15, gy + RH + .1, z], .07, 5); }
    const ry = z => ground(rx, z); rod('log', [rx, ry(RZ0) + RH - .05, RZ0 - .3], [rx, ry(RZ1) + RH - .05, RZ1 + .3], .06, 5);
    for (const s of [-1, 1]) for (const f of [.42, .78]) { const xb = rx + s * (RS - f * (RS + .15)) + s * .08, yb = z => ry(z) - .2 + (RH + .3) * f; rod('log', [xb, yb(RZ0), RZ0 - .3], [xb, yb(RZ1), RZ1 + .3], .045, 5);
      for (let z = RZ0 + .25; z < RZ1 - .1; z += .32) { const y = yb(z), q = .45 + r() * .12; for (const t of [-1, 1]) { const V2 = (a, b) => new THREE.Vector2(a, b), L = q - .03, sh = new THREE.Shape([V2(-.05, 0), V2(.05, 0), V2(.015, -.06), V2(.07, -L * .45), V2(.05, -L * .85), V2(0, -L), V2(-.05, -L * .85), V2(-.07, -L * .45), V2(-.015, -.06)]) /* hung by the tail, split and dried flat */;
        put(new THREE.ShapeGeometry(sh), 'fish', xb + t * .04, y - .03, z, 0, Math.PI / 2 + t * .12); } low = Math.min(low, y - q - ry(z)); } }
    racks.push({ x: rx, z0: RZ0, z1: RZ1, low: +low.toFixed(3) }); }
  // the pines: on the wall's lower slopes, where it is not cliff
  for (let k = 0, n = 0; k < 600 && n < 46; k++) { const x = (r() - .5) * 170, z = WALLZ - 6 + r() * 60, e = edge(x, z); if (e < 1 || e > 16) continue; const gy = ground(x, z), sl = Math.hypot(ground(x + 1, z) - ground(x - 1, z), ground(x, z + 1) - ground(x, z - 1)) / 2; if (sl > 1.4 || gy > 32) continue;
    const h = 7 + r() * 6; rod('bark', [x, gy - .4, z], [x, gy + h * .9, z], .14 + h * .01, 6); for (let t = 0; t < 4; t++) { const f = t / 4, th = h * .26, rw = (2.0 - f * 1.5) * (.85 + r() * .3); put(new THREE.ConeGeometry(rw, th, 7, 1, true), 'needle', x, gy + h * (.35 + f * .5) + th / 2, z, 0, r() * 3); } n++; }
  // the ship: the kit's Markish cutter, striped, alongside the wharf's middle, bow to the east, 0.45 m off the fenders; a gangplank
  // from the wharf's deck to her rail amidships
  const S = markCutter({ stripe: true, furled: true, key: key + ':cutter' }, stream(key + ':cutter')), SX = -8, SZ = WF - .4 - .14 - .45 - S.W / 2; S.group.position.set(SX, 0, SZ); S.group.rotation.y = Math.PI / 2;
  const rail = S.rail.reduce((a, b) => Math.abs(b[0]) < Math.abs(a[0]) ? b : a), inset = Math.min(S.sect(rail[0], 1)[0] - .06, S.deckAt(rail[0]) - .05) /* the cap rail's line, as ships.js lays it */, PX = SX + rail[0] + .9, pa = [PX, DY + .03, WF + .9], pb = [PX, rail[1] + .05, SZ + inset];
  { const d = Math.hypot(pb[1] - pa[1], pb[2] - pa[2]); put(new THREE.BoxGeometry(.55, .06, d + .3), 'plank', PX, (pa[1] + pb[1]) / 2 + .03, (pa[2] + pb[2]) / 2, Math.atan2(pb[1] - pa[1], pa[2] - pb[2]), 0, 0, .6);
    for (let k = 1; k < 5; k++) { const t = k / 5; bx('log', PX - .26, PX + .26, pa[1] + (pb[1] - pa[1]) * t + .055, pa[1] + (pb[1] - pa[1]) * t + .09, pa[2] + (pb[2] - pa[2]) * t - .02, pa[2] + (pb[2] - pa[2]) * t + .02); } }
  const group = new THREE.Group(); let tris = 0; for (const [k, gs] of B) { const g = mergeGeometries(gs, false); gs.forEach(x => x.dispose()); const m = new THREE.Mesh(g, M[k]); m.name = k; m.castShadow = !['snow', 'cliff', 'gravel', 'turf', 'strand', 'water'].includes(k); m.receiveShadow = k !== 'water'; group.add(m); tris += g.attributes.position.count / 3; }
  const own = group.children.length; for (const H of hallG) { group.add(H.group); tris += H.tris; } group.add(S.group); tris += S.tris;
  const paths = [[[WX0 + .6, -3], [WX1 - .6, -3]], ...halls.map(h => [[h.x, -1], [h.x, h.door[1] - .2]]) /* to the foot of each hall's steps */, [[WX1 - .6, -2], [WX1 - .6, .6], [nausts[1].x + 3.4, .6]], ...nausts.map(n => [[n.x, .6], [n.x, n.z0 + .3]]), ...racks.map(k => [[-25.4, -2], [-25.4, 2.4], [k.x, 2.4]])];
  return { group, tris: Math.round(tris), draws: own + hallG.reduce((a, H) => a + H.draws, 0) + S.draws, own, ground, shelf, sh: SH, wallZ: WALLZ, head: HEAD, wharf: { x0: WX0, x1: WX1, z0: WF, z1: WB, deck: DY }, cribs, bollards,
    ship: { x: SX, z: SZ, W: S.W, L: S.L, draft: 1.45, rail: rail[1], railZ: +(SZ + inset).toFixed(3), group: S.group, fender: WF - .4 - .14 }, plank: { a: pa, b: pb }, halls, nausts, racks, paths };
}

// ── the Mark's cliff terraces (Session 1242, card F8; L5's "the Mark's settlements", OG-034's cliff city "on terraces linked by stone
// bridges and rope walkways", its *cliff walkways* detail and its *Skardrun* panel). Three terraces cut into a cliff face, one over the
// other, split by a gorge; nothing crosses the gorge but a stone bridge on the lowest and a rope walkway on each of the two above, and the
// way up zig-zags across it: the lowest terrace's east side climbs to the middle one, crosses on the rope, climbs on the west to the top
// and crosses back. Built at true size: the valley to -z, the mountain to +z, the gorge along z at x 0, y 0 the lowest terrace. The
// board's names and its *Highhold* are not used (its catalogue row: the canon has the Captains' League, no capital); the look is the
// canon's for the Mark: timber halls, dark shingle and turf, dry stone, nothing decorative that does not also keep out cold.
//   - the terraces: 0, 7 and 14 m up, each 14 m deep (z -14 to 0, 0 to 14, 14 to 28) and 32 m long a side, from the gorge's lip at 6 m
//     out to the cliffs at 38; each held by a dry-stone wall 0.9 m thick; snow on them but for the trodden ways; the lowest's front a
//     wall over the drop to the valley, 36 m down; the top one's back the cliff, rounding over 120 m up;
//   - the gorge: 12 m across at the lip, 7 at the bed, 25 to 30 m deep under the terraces, a stream down it to the valley;
//   - the stone bridge: one arch of 9.2 m (rise 4) across the gorge at the lowest terrace, its deck level with both sides, parapets 1 m;
//   - the rope walkways: at the middle and top terraces, 12.6 m of plank deck on two foot ropes sagging 0.45 m, hand ropes at about
//     1.1 m on either side with hangers every metre down to the foot ropes, held at each end by two posts and a sill log;
//   - the stairs: a flight of 39 rises of 0.18 m and treads of 0.3 against each riser wall, the lowest terrace's on the east and the
//     middle's on the west, a hand rail on the open side and a landing at the top onto the wall's head;
//   - the halls: five of the kit's halls (markHall) gable-on to the gorge, the door to it, shingle and turf; a storehouse on posts on
//     the middle terrace's east; timber rails along every open edge (the valley side and the gorge's lip) but where the ways go through;
//   - two clan banners on poles at the bridge's ends (plain, the clans' own marks are the quest writer's).
// -> { group, tris, draws, own, ground, levels, depth, lip, xe, bridge { z, w, x0, x1, deck, span, rise, crown }, ropes [{ y, z, x0, x1,
//   sag, deck(x), hand(x) }], stairs [{ side, x0, x1, z0, z1, y0, y1, n, rise, run, top }], walls [{ z, y0, y1 }], halls [{ x, z, y, side,
//   door [x, z] }], store { x, z, floor }, rails [[x0, z0, x1, z1, y]], gaps, paths }
export function markCliffTerraces(o = {}, r = stream('terraces')) {
  markTextures(); aurenneTextures(); const key = String(o.key || 'terraces');
  const std = (c, ro = .9, x = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: ro, ...x });
  const M = { ...mats(), snow: mat('plaster', { ns: .3, color: 0xf2f5f8, rough: .95 }), cliff: mat('rock', { ns: 1.4, color: 0x8e8c86, rough: .95 }), shingle: mat('shingle', { ns: 1.4, rough: .8 }),
    log: mat('beam', { ns: 1.1, color: 0x6a5440, rough: .9 }), plank: mat('wood', { ns: .9, color: 0x8a7a66, rough: .9 }), gravel: mat('turfDry', { ns: 1.0, color: 0x8a8274, rough: 1 }),
    dry: mat('stone', { ns: 1.5, color: 0x6e6a64, rough: .95 }), ashlar: mat('limestone', { ns: 1.1, color: 0x8e8a84, rough: .95 }), cope: mat('limestone', { ns: .9, color: 0x7a7670, rough: .9 }),
    rope: std(0x8a7650, .95), banner: std(0x7a2a22, .9), band: std(0x2a3e6a, .9), needle: std(0x2c3a2a, .95), bark: std(0x4a3a2c, .95), water: std(0x2c4a50, .12, { metalness: .2 }) };
  M.shingle.side = M.banner.side = M.band.side = M.needle.side = THREE.DoubleSide;
  const B = new Map(), V = (x, y) => new THREE.Vector2(x, y);
  const put = (geo, k, x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0, uv = .5) => { const g = geo.index ? geo.toNonIndexed() : geo; for (const a of Object.keys(g.attributes)) if (!['position', 'normal'].includes(a)) g.deleteAttribute(a);
    if (!g.attributes.normal) g.computeVertexNormals();
    g.applyMatrix4(new THREE.Matrix4().compose(new THREE.Vector3(x, y, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(rx, ry, rz, 'YXZ')), new THREE.Vector3(1, 1, 1))); worldUV(g, uv);
    if (!B.has(k)) B.set(k, []); B.get(k).push(g); return g; };
  const bx = (k, x0, x1, y0, y1, z0, z1, uv = .5) => put(new THREE.BoxGeometry(x1 - x0, y1 - y0, z1 - z0), k, (x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2, 0, 0, 0, uv);
  const rod = (k, a, b, rad, seg = 6) => { const A = new THREE.Vector3(...a), Bv = new THREE.Vector3(...b), d = Bv.clone().sub(A), g = new THREE.CylinderGeometry(rad, rad, d.length(), seg); g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.clone().normalize())); const m = A.add(Bv).multiplyScalar(.5); put(g, k, m.x, m.y, m.z); };
  const sm = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
  // the land: the terraces as steps along z with their risers inside the walls, the drop to the valley, the cliff behind and at the ends,
  // the gorge cut through it all; rough only off the terraces, and none on the gorge's bed
  const LV = [0, 7, 14], D = 14, Z0 = -14, LIP = 6, BED = 3.5, XE = 38, WT = .9, FW = .3 /* the lowest's front wall: its face 0.3 m out from the terrace's edge */, F = field(stream(key + ':land'), 1);
  const ZB = [Z0 + D, Z0 + 2 * D] /* the risers' heads, z 0 and 14 */, BACK = Z0 + 3 * D;
  const terr = z => { if (z < Z0) return z < Z0 - .25 ? Math.max(-36, -2.5 + (z - Z0 + .25) * 2.4) : -2.5 * (Z0 - z) / .25; for (let i = 0; i < 2; i++) { const zb = ZB[i]; if (z < zb - WT + .05) return LV[i]; if (z < zb - .1) return LV[i] + 7 * (z - (zb - WT + .05)) / (WT - .15); }
    if (z <= BACK) return LV[2]; const e = z - BACK; return LV[2] + 120 * (1 - Math.exp(-2.6 * e / 120)); };
  const nat = z => Math.max(terr(z), z >= Z0 ? (z - Z0) * .55 + .5 : -99) /* the mountainside the terraces are cut into: past their ends it runs on at 1 in 1.8 */;
  const bedY = z => Math.max(-36, -30 + (z + 30) * .25);
  const onTerr = (ax, z) => sm(5.2, LIP, ax) * (1 - sm(XE - .5, XE + 1, ax)) * sm(Z0 - .9, Z0 - .3, z) * (1 - sm(BACK + .2, BACK + 2, z));
  const base = (x, z) => { const ax = Math.abs(x), e = sm(XE - .5, XE + 1.5, ax), b = terr(z) * (1 - e) + nat(z) * e; return ax >= LIP ? b : Math.min(b, b + (bedY(z) - b) * sm(LIP, BED, ax)); };
  const rough = (x, z) => { const ax = Math.abs(x); const far = Math.max(sm(XE + 2, XE + 40, ax), sm(BACK + 4, BACK + 40, z), sm(Z0 - 8, Z0 - 30, z)); return (F(x, 0, z)[1] * 1.1 + F(x * .15, 0, z * .15 + 5)[1] * 5 + (F(x * .05, 0, z * .05 + 9)[1] * 14 + F(x * .02, 0, z * .02 + 3)[1] * 30) * far) * (1 - onTerr(ax, z)) * (ax < LIP ? sm(1.5, BED, ax) : 1) * (z < -30 ? .3 : 1); };
  const ground = (x, z) => base(x, z) + rough(x, z);
  // the ways: the walks along each terrace's front and the gorge's lip, up the stairs, over the crossings, to the doors (filled below);
  // the land under them is gravel, the rest of the terraces snow
  const ZC = [Z0 + 2, ZB[0] + 1.4, ZB[1] + 1.4] /* each terrace's front walk, and its crossing */, WALK = 7.6, HZ = [-6.5, 7.5, 21.5];
  const SW = 1.3, SN = 39, SR = 7 / SN, ST = .3, SX0 = 22, SX1 = SX0 + SN * ST, LAND = 1.3 /* a stair's flight: 39 rises against the riser wall's face, rising outward along x, and its landing */;
  const stairZ = i => [ZB[i] - WT - SW, ZB[i] - WT], stairSide = [1, -1];
  const paths = [[[-30, ZC[0]], [30, ZC[0]]]];
  for (const i of [0, 1]) { const s = stairSide[i], zs = stairZ(i), zm = (zs[0] + zs[1]) / 2, xl = s * (SX1 + LAND / 2); paths.push([[s * WALK, ZC[i]], [s * WALK, zm], [xl, zm], [xl, ZB[i] + 1.4], ...(i === 0 ? [[-30, ZC[1]]] : [[30, ZC[2]]])]); }
  const HALLS = [[1, 0, { roof: 'shingle', carve: true, chimney: true, wall: 0 }], [-1, 0, { roof: 'turf', turf: 'moss', carve: false, chimney: true, wall: 2 }], [-1, 1, { roof: 'shingle', carve: true, chimney: false, wall: 1 }], [1, 2, { roof: 'shingle', carve: true, chimney: true, wall: 3 }], [-1, 2, { roof: 'turf', turf: 'dry', carve: false, chimney: true, wall: 2, d: 9 }]];
  for (const [s, i] of HALLS) paths.push([[s * WALK, ZC[i]], [s * WALK, HZ[i]], [s * (WALK + .8), HZ[i]]]);
  const STX = 12.6, STZ = HZ[1] + .5; paths.push([[WALK, ZC[1]], [WALK, STZ], [STX - 3.6, STZ]]);
  const segDist = (x, z, p, q) => { const dx = q[0] - p[0], dz = q[1] - p[1], L2 = dx * dx + dz * dz || 1, t = Math.max(0, Math.min(1, ((x - p[0]) * dx + (z - p[1]) * dz) / L2)); return Math.hypot(x - p[0] - t * dx, z - p[1] - t * dz); };
  const trodden = (x, z) => paths.some(P => P.some((p, k) => k && segDist(x, z, P[k - 1], p) < 1.1));
  { const steps = (bands, end, extra = []) => { const v = []; for (const [a, b, st] of bands) for (let q = a; q < b - 1e-6; q += st) v.push(+q.toFixed(3)); v.push(end); return [...new Set([...v, ...extra])].sort((a, b) => a - b); };
    const gx = steps([[-160, -70, 6], [-70, -44, 2], [-44, -8, 1], [-8, 8, .5], [8, 44, 1], [44, 70, 2], [70, 160, 6]], 160), gz = steps([[-130, -40, 6], [-40, -16, 1], [-16, 30, 1], [30, 60, 2], [60, 160, 6]], 160, [Z0, Z0 - .25, Z0 - .5, ...ZB.flatMap(zb => [zb - WT, zb - WT + .05, zb - .1, zb])]), NX = gx.length;
    const pos = []; for (const z of gz) for (const x of gx) pos.push(x, ground(x, z), z); const I = { snow: [], cliff: [], gravel: [] }, P = i => [pos[3 * i], pos[3 * i + 1], pos[3 * i + 2]];
    for (let j = 0; j + 1 < gz.length; j++) for (let i = 0; i + 1 < NX; i++) { const a = j * NX + i, b = a + 1, c = a + NX, d = c + 1;
      const qa = P(a), qd = P(d), cx = (qa[0] + qd[0]) / 2, cz = (qa[2] + qd[2]) / 2, H = 2 /* one class a quad, from the land's slope over 4 m there, so the snow lies on the shelves in drifts, not in slivers */;
      const bs = Math.hypot(ground(cx + H, cz) - ground(cx - H, cz), ground(cx, cz + H) - ground(cx, cz - H)) / (2 * H), ny = Math.abs(new THREE.Vector3(...P(c)).sub(new THREE.Vector3(...qa)).cross(new THREE.Vector3(...P(b)).sub(new THREE.Vector3(...qa))).normalize().y);
      const k = onTerr(Math.abs(cx), cz) > .99 && ny > .9 ? (trodden(cx, cz) ? 'gravel' : 'snow') : bs > .68 || ny < .55 ? 'cliff' : 'snow'; I[k].push(a, c, b, b, c, d); }
    for (const [k, idx] of Object.entries(I)) { if (!idx.length) continue; const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals(); put(g, k, 0, 0, 0, 0, 0, 0, .35); } }
  // the stream down the gorge's bed, in reaches of a metre, out onto the valley
  for (let z = -40; z < 70; z += 1) { const ya = ground(0, z) + .12, yb = ground(0, z + 1) + .12; const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute([-1.3, ya, z, -1.3, yb, z + 1, 1.3, ya, z, 1.3, ya, z, -1.3, yb, z + 1, 1.3, yb, z + 1], 3)); g.computeVertexNormals(); put(g, 'water', 0, 0, 0, 0, 0, 0, .5); }
  // the walls: each riser's from under the lower terrace to the upper one's level, its head flush with the walk; the lowest's front from
  // well down the drop to 0.9 m over its edge, its cope the parapet the valley side is walked along
  const walls = []; for (const s of [-1, 1]) { for (let i = 0; i < 2; i++) bx('dry', Math.min(s * LIP, s * (XE + 3)), Math.max(s * LIP, s * (XE + 3)), LV[i] - .6, LV[i + 1], ZB[i] - WT, ZB[i], .7);
    bx('dry', Math.min(s * LIP, s * (XE + 3)), Math.max(s * LIP, s * (XE + 3)), -6, .9, Z0 - FW, Z0 + .6, .7); bx('cope', Math.min(s * LIP, s * (XE + 3)), Math.max(s * LIP, s * (XE + 3)), .9, 1.02, Z0 - FW - .05, Z0 + .65); }
  for (let i = 0; i < 2; i++) walls.push({ z: ZB[i] - WT, y0: LV[i], y1: LV[i + 1] }); walls.push({ z: Z0 - FW, y0: -2.5, y1: 1.02, front: true });
  // the stone bridge: one arch across the gorge at the lowest terrace, the deck level with the land; piers down the gorge's walls to
  // under the land; a ring of voussoirs a little proud of each face; parapets with a cope
  // (Session 1307, the critic's walk: the near pier read as stopping in mid-air) each pier goes down plumb to a knee under the arch, then
  // batters out down the gorge's wall to a footing on the bed by the stream, its toe 0.5 m proud of the ground; the foot under the land
  const BZ = ZC[0], BW = 2.8, BX = 6.8, SPR = 4.6, CROWN = -1.0, RISE = 4, AR = (RISE * RISE + SPR * SPR) / (2 * RISE), ACY = CROWN - AR, a0 = Math.asin((CROWN - RISE - ACY) / AR), FT = 3.2, KNEE = -14;
  const gAt = (x0, x1, f) => { let v = f === Math.min ? 1e9 : -1e9; for (const s of [-1, 1]) for (let x = x0; x <= x1 + 1e-6; x += .2) for (let z = BZ - BW / 2; z <= BZ + BW / 2 + 1e-6; z += .2) v = f(v, ground(s * x, z)); return v; };
  const TOE = gAt(FT, FT + .4, Math.max) + .5, PIER = Math.min(bedY(BZ) - 1, gAt(FT, BX, Math.min) - 1);
  { const sh = new THREE.Shape([V(-BX, 0), V(BX, 0), V(BX, PIER), V(FT, PIER), V(FT, TOE), V(SPR, KNEE), V(SPR, CROWN - RISE)]); for (let k = 1; k < 24; k++) { const a = a0 + (Math.PI - 2 * a0) * k / 24; sh.lineTo(AR * Math.cos(a), ACY + AR * Math.sin(a)); }
    sh.lineTo(-SPR, CROWN - RISE); sh.lineTo(-SPR, KNEE); sh.lineTo(-FT, TOE); sh.lineTo(-FT, PIER); sh.lineTo(-BX, PIER); sh.lineTo(-BX, 0); const g = new THREE.ExtrudeGeometry(sh, { depth: BW, bevelEnabled: false, curveSegments: 1 }); put(g, 'ashlar', 0, 0, BZ - BW / 2, 0, 0, 0, .6);
    const ring = new THREE.Shape(); for (let k = 0; k <= 24; k++) { const a = a0 + (Math.PI - 2 * a0) * k / 24; ring[k ? 'lineTo' : 'moveTo'](AR * Math.cos(a), ACY + AR * Math.sin(a)); } for (let k = 24; k >= 0; k--) { const a = a0 + (Math.PI - 2 * a0) * k / 24; ring.lineTo((AR + .55) * Math.cos(a), ACY + (AR + .55) * Math.sin(a)); }
    put(new THREE.ExtrudeGeometry(ring, { depth: BW + .1, bevelEnabled: false, curveSegments: 1 }), 'cope', 0, 0, BZ - BW / 2 - .05, 0, 0, 0, .6);
    for (const s of [-1, 1]) { bx('ashlar', -BX, BX, 0, 1.0, BZ + s * (BW / 2) - (s > 0 ? .35 : 0), BZ + s * (BW / 2) + (s > 0 ? 0 : .35), .6); bx('cope', -BX - .05, BX + .05, 1.0, 1.12, BZ + s * (BW / 2) - (s > 0 ? .4 : .05), BZ + s * (BW / 2) + (s > 0 ? .05 : .4)); } }
  // the rope walkways: two foot ropes sagging 0.45 m from sill to sill, planks across them, hand ropes from the posts' heads, hangers
  const RL = 6.3, SAG = .45, HAND = 1.15, ropes = [];
  for (const i of [1, 2]) { const Y = LV[i], Z = ZC[i], deck = x => Y - SAG * (1 - (x / RL) ** 2), hand = x => Y + HAND - SAG * (1 - (x / (RL + .2)) ** 2);
    for (const s of [-1, 1]) { bx('log', Math.min(s * RL, s * (RL + .45)), Math.max(s * RL, s * (RL + .45)), Y - .3, Y + .08, Z - .75, Z + .75); for (const t of [-1, 1]) rod('log', [s * (RL + .2), Y - 1.2, Z + t * .72], [s * (RL + .2), Y + HAND + .2, Z + t * .72], .11, 7); }
    for (const t of [-1, 1]) { for (let x = -RL; x < RL - 1e-6; x += .5) { const xb = Math.min(RL, x + .5); rod('rope', [x, deck(x) - .07, Z + t * .45], [xb, deck(xb) - .07, Z + t * .45], .028, 5); }
      for (let x = -RL - .2; x < RL + .2 - 1e-6; x += .5) { const xb = Math.min(RL + .2, x + .5); rod('rope', [x, hand(x), Z + t * .62], [xb, hand(xb), Z + t * .62], .022, 5); }
      for (let x = -RL + .5; x < RL - .2; x += 1) rod('rope', [x, hand(x), Z + t * .62], [x, deck(x) - .06, Z + t * .47], .012, 4); }
    for (let x = -RL + .13; x < RL - .1; x += .26) { const sl = 2 * SAG * x / (RL * RL); put(new THREE.BoxGeometry(.26, .05, 1.04), 'plank', x, deck(x) - .025, Z, 0, 0, Math.atan(sl), .6); }
    ropes.push({ y: Y, z: Z, x0: -RL, x1: RL, sag: SAG, deck, hand, handZ: .62 }); }
  // the stairs: treads of 0.3 on their own solid of dry stone against the riser wall's face, the landing at the top level with the wall's
  // head; a hand rail on the open side, on posts from the treads
  const stairs = []; for (const i of [0, 1]) { const s = stairSide[i], [za, zb] = stairZ(i), y0 = LV[i];
    for (let k = 1; k <= SN; k++) { const xa = s * (SX0 + (k - 1) * ST), xb = s * (SX0 + k * ST); bx('dry', Math.min(xa, xb), Math.max(xa, xb), y0 - .4, y0 + k * SR, za, zb, .6); }
    bx('dry', Math.min(s * SX1, s * (SX1 + LAND)), Math.max(s * SX1, s * (SX1 + LAND)), y0 - .4, y0 + 7, za, zb, .6);
    const nose = x => y0 + Math.min(7, Math.max(0, (s * x - SX0) / ST) * SR), zr = za + .06;
    for (let x = SX0 + 1.5; x < SX1 - .2; x += 2.4) rod('log', [s * x, nose(s * x) - .02, zr], [s * x, nose(s * x) + .95, zr], .05, 6);
    rod('log', [s * (SX0 + 1.5), nose(s * (SX0 + 1.5)) + .95, zr], [s * (SX1 - .2), nose(s * (SX1 - .2)) + .95, zr], .04, 6);
    rod('log', [s * (SX1 + LAND), y0 + 7 - .02, zr], [s * (SX1 + LAND), y0 + 7.95, zr], .05, 6); rod('log', [s * (SX1 - .2), y0 + 7.95, zr], [s * (SX1 + LAND), y0 + 7.95, zr], .04, 6);
    stairs.push({ side: s, x0: s * SX0, x1: s * SX1, z0: za, z1: zb, y0, y1: y0 + 7, n: SN, rise: +SR.toFixed(4), run: ST, top: [s * (SX1 + LAND / 2), (za + zb) / 2] }); }
  // the rails: posts every 2 m or less, two rails, along the valley side of each terrace and the gorge's lip, broken where a way goes
  // through (the crossings, the stairs' heads)
  const rails = [], gaps = [];
  const rail = (x0, z0, x1, z1, y, cut = []) => { const L = Math.hypot(x1 - x0, z1 - z0), at = t => [x0 + (x1 - x0) * t / L, z0 + (z1 - z0) * t / L], segs = []; let t0 = 0;
    for (const [a, b] of [...cut].sort((p, q) => p[0] - q[0])) { if (a > t0) segs.push([t0, a]); t0 = Math.max(t0, b); gaps.push([...at(a), ...at(b), y]); } if (t0 < L) segs.push([t0, L]);
    for (const [a, b] of segs) { if (b - a < .3) continue; const n = Math.max(1, Math.ceil((b - a) / 2)); for (let k = 0; k <= n; k++) { const [x, z] = at(a + (b - a) * k / n); bx('log', x - .06, x + .06, y - .02, y + 1.05, z - .06, z + .06); }
      for (const h of [.55, 1.0]) rod('log', [...at(a)].flatMap((v, j) => j ? [y + h, v] : [v]), [...at(b)].flatMap((v, j) => j ? [y + h, v] : [v]), .035, 5); rails.push([...at(a), ...at(b), y]); } };
  for (const s of [-1, 1]) { const xr = s * (LIP + .2);
    rail(xr, Z0 + .45, xr, ZB[0] - WT - .05, LV[0], [[ZC[0] - Z0 - .45 - 1.6, ZC[0] - Z0 - .45 + 1.6]]);
    for (const i of [1, 2]) { const za = ZB[i - 1] - WT + .15, zb = i === 1 ? ZB[1] - WT - .05 : BACK - .3; rail(xr, za, xr, zb, LV[i], [[ZC[i] - za - .95, ZC[i] - za + .95]]); }
    for (const i of [0, 1]) { const zr = ZB[i] - WT + .15, cut = stairSide[i] === s ? [[SX1 - .3 - (LIP + .2), SX1 + LAND + .1 - (LIP + .2)]] : []; rail(s * (LIP + .2), zr, s * XE, zr, LV[i + 1], cut); } }
  // the halls: the kit's, gable-on to the gorge, the foot of each one's steps 1 m out from the lip's walk; the storehouse on its posts
  const halls = [], hallG = [];
  for (const [s, i, opt] of HALLS) { const d = opt.d || 12, H = markHall({ w: 6, d, porch: false, ...opt }, stream(key + ':hall' + s + i)), hx = s * (WALK + 1 + H.stairOut), y = LV[i] - .05;
    H.group.position.set(hx, y, HZ[i]); H.group.rotation.y = -s * Math.PI / 2; hallG.push(H); halls.push({ x: +hx.toFixed(2), z: HZ[i], y, side: s, level: i, d, door: [+(s * (WALK + 1)).toFixed(2), HZ[i]] }); }
  const SF = 1.1, SY = LV[1]; for (const [dx, dz] of [[-1.3, -1.3], [1.3, -1.3], [-1.3, 1.3], [1.3, 1.3]]) { bx('ashlar', STX + dx - .3, STX + dx + .3, SY - .3, SY + .35, STZ + dz - .3, STZ + dz + .3); bx('log', STX + dx - .15, STX + dx + .15, SY + .35, SY + SF - .1, STZ + dz - .15, STZ + dz + .15); }
  bx('plank', STX - 1.7, STX + 1.7, SY + SF - .1, SY + SF + .05, STZ - 1.7, STZ + 1.7); for (const s of [-1, 1]) { bx('log', STX - 1.6, STX + 1.6, SY + SF, SY + SF + 2.1, STZ + s * 1.6 - .1, STZ + s * 1.6 + .1); bx('log', STX + s * 1.6 - .1, STX + s * 1.6 + .1, SY + SF, SY + SF + 2.1, STZ - 1.5, STZ + 1.5); }
  { const RP = 40 * Math.PI / 180, RWd = 2.2; for (const s of [-1, 1]) put(new THREE.BoxGeometry(3.9, .12, RWd / Math.cos(RP) + .1), 'shingle', STX, SY + SF + 2.1 + Math.tan(RP) * RWd / 2, STZ + s * RWd / 2, s * RP, 0, 0, .6);
    for (const s of [-1, 1]) { const g = new THREE.ExtrudeGeometry(new THREE.Shape([V(-RWd, 0), V(RWd, 0), V(0, Math.tan(RP) * RWd)]), { depth: .1, bevelEnabled: false }); g.translate(0, 0, -.05); put(g, 'log', STX + s * 1.6, SY + SF + 2.1, STZ, 0, Math.PI / 2); } }
  for (let k = 0; k < 5; k++) bx('plank', STX - 2.2 - k * .3, STX - 1.9 - k * .3, SY, SY + SF - .1 - k * .2, STZ - .5, STZ + .5);
  // the banners: a pole at each of the bridge's ends, on the valley side of the lip's walk, a cloth on a cross-bar with a band across it
  const banners = []; for (const s of [-1, 1]) { const x = s * 6.75, z = BZ + BW / 2 + .5; rod('log', [x, -.3, z], [x, 5.4, z], .07, 6); rod('log', [x - .5, 5.1, z], [x + .5, 5.1, z], .03, 5);
    put(new THREE.PlaneGeometry(.9, 2.2), 'banner', x, 3.98, z + .03); put(new THREE.PlaneGeometry(.9, .22), 'band', x, 4.3, z + .035); banners.push([x, z]); }
  // pines on the valley floor and the shelves at the ends, for the scale
  for (let k = 0, n = 0; k < 700 && n < 40; k++) { const x = (r() - .5) * 200, z = -36 - r() * 70; if (Math.abs(x) < 6) continue; const gy = ground(x, z), h = 8 + r() * 6; if (gy > -30) continue;
    rod('bark', [x, gy - .4, z], [x, gy + h * .9, z], .14 + h * .01, 6); for (let t = 0; t < 4; t++) { const f = t / 4, th = h * .26, rw = (2.0 - f * 1.5) * (.85 + r() * .3); put(new THREE.ConeGeometry(rw, th, 7, 1, true), 'needle', x, gy + h * (.35 + f * .5) + th / 2, z, 0, r() * 3); } n++; }
  const group = new THREE.Group(); let tris = 0; for (const [k, gs] of B) { const g = mergeGeometries(gs, false); gs.forEach(x => x.dispose()); const m = new THREE.Mesh(g, M[k]); m.name = k; m.castShadow = !['snow', 'cliff', 'gravel', 'water'].includes(k); m.receiveShadow = k !== 'water'; group.add(m); tris += g.attributes.position.count / 3; }
  const own = group.children.length; for (const H of hallG) { group.add(H.group); tris += H.tris; }
  return { group, tris: Math.round(tris), draws: own + hallG.reduce((a, H) => a + H.draws, 0), own, ground, bedY, levels: LV, depth: D, z0: Z0, lip: LIP, xe: XE, back: BACK, walk: WALK, zc: ZC,
    bridge: { z: BZ, w: BW, x0: -BX, x1: BX, deck: 0, span: 2 * SPR, rise: RISE, crown: CROWN, spring: CROWN - RISE, inner: BW - .7, toe: [FT, TOE], foot: PIER }, ropes, stairs, walls, halls, store: { x: STX, z: STZ, floor: SY + SF + .05 }, banners, rails, gaps, paths };
}

// ── the Mark's outpost under the aurora (Session 1243, card F8; L5's "the Mark's settlements", OG-034's "remote settlement under the
// aurora (whaling, fishing)", its *Glassfjord* panel and its coastal outpost). A handful of turf houses on a low shore at the end of the
// world, a cove before them, and the work of the place on the beach: a flensing slip into the water, the try-works where the blubber is
// rendered, a færing hauled up, an arch of a whale's jawbones on the way down from the houses. Built at true size, the cove to -z, y 0 the
// water. The board's names are proposals (its catalogue row) and none is used; the whale is An Mhuir's in the canon, and how the outpost
// stands with the Sea is the quest writer's. The aurora is the sky's, not the place's: auroraCurtains() makes it for a view at night.
//   - the land: a shingle beach 1 in 8 from the water to a shelf at 2 m, rising 1 in 14 behind to the houses and on to a snowy hill;
//     rock outcrops on the cove's two arms;
//   - the houses: three of the kit's halls under turf, small (6 by 8 to 10 m), their doors to the cove, on the shelf;
//   - the slip: a plank ramp 3.2 m wide on log sleepers from the shelf's edge down the beach into the water, 1 in 7.5;
//   - the try-works: a hearth of stone 3.4 by 2 m and 0.9 m high, two iron pots set in it, a fire-hole under each, a stack of driftwood;
//   - the arch: two jawbones of 5 m on the path from the houses down to the beach, leaning in to meet over it;
//   - the færing (the fjord port's), keel up on two trestles above the tide line, and a scatter of ribs half buried in the shingle.
// -> { group, tris, draws, own, ground, shelf, houses [{ x, z, door [x, z] }], slip { x, w, z0, z1, y(z), end }, works { x, z, pots [[x, y, z]], rim },
//   arch { x, z, clear, w }, boat { x, z, y }, paths }
// auroraCurtains(r) -> { group, low, high, draws }: curtains of light, folded, 90 to 260 m up and 300 to 900 m off to the north (-z), green
// at their feet and violet at their heads, drawn additive and unlit.
export function auroraCurtains(r = stream('aurora')) {
  const mat = new THREE.ShaderMaterial({ transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, fog: false,
    uniforms: { t: { value: 0 } },
    vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
    fragmentShader: 'varying vec2 vUv; uniform float t; void main(){ float h = vUv.y, x = vUv.x; float rays = .55 + .45 * sin(x * 260.0 + sin(x * 31.0) * 4.0) * sin(x * 97.0 + 1.3);' +
      ' float foot = smoothstep(0.0, .08, h) * (1.0 - smoothstep(.35, 1.0, h)); float ends = smoothstep(0.0, .12, x) * (1.0 - smoothstep(.88, 1.0, x));' +
      ' vec3 c = mix(vec3(.25, 1.0, .55), vec3(.55, .3, .9), smoothstep(.25, .9, h)); gl_FragColor = vec4(c * foot * ends * (.35 + .65 * rays) * .55, 1.0); }' });
  const group = new THREE.Group();
  for (let k = 0; k < 3; k++) { const N = 160, z0 = -340 - k * 180 - r() * 60, x0 = -700 + r() * 200, L = 1300 + r() * 300, lo = 90 + r() * 30 + k * 10, hi = lo + 120 + r() * 50, a = r() * 9, b = r() * 9, pos = [], uv = [], idx = [];
    for (let i = 0; i <= N; i++) { const u = i / N, x = x0 + u * L, z = z0 + Math.sin(u * 7 + a) * 90 + Math.sin(u * 19 + b) * 25; for (const v of [0, 1]) { pos.push(x, v ? hi : lo, z + (v ? 20 : 0)); uv.push(u, v); } }
    for (let i = 0; i < N; i++) { const p = 2 * i; idx.push(p, p + 2, p + 1, p + 1, p + 2, p + 3); }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx);
    const m = new THREE.Mesh(g, mat); m.name = 'aurora'; m.frustumCulled = false; m.renderOrder = -1; group.add(m); }
  const bb = new THREE.Box3().setFromObject(group); return { group, low: +bb.min.y.toFixed(1), high: +bb.max.y.toFixed(1), near: +(-bb.max.z).toFixed(0), draws: group.children.length, mat };
}
export function markAuroraOutpost(o = {}, r = stream('aurora-outpost')) {
  markTextures(); const key = String(o.key || 'aurora-outpost');
  const std = (c, ro = .9, x = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: ro, ...x });
  const M = { ...mats(), snow: mat('plaster', { ns: .3, color: 0xf2f5f8, rough: .95 }), cliff: mat('rock', { ns: 1.4, color: 0x8e8c86, rough: .95 }), strand: mat('rock', { ns: .8, color: 0x8a867e, rough: 1 }),
    gravel: mat('turfDry', { ns: 1.0, color: 0x8a8274, rough: 1 }), log: mat('beam', { ns: 1.1, color: 0x6a5440, rough: .9 }), plank: mat('wood', { ns: .9, color: 0x8a7a66, rough: .9 }), stone: mat('rock', { ns: 1.6, color: 0x7a7670, rough: .95 }),
    dry: mat('stone', { ns: 1.5, color: 0x6e6a64, rough: .95 }), tar: mat('wood', { ns: .8, color: 0x6a5644, rough: .75 }), bone: std(0xd8d0bc, .8), soot: std(0x1a1816, 1), ember: std(0x3a1408, .9, { emissive: new THREE.Color(1, .38, .1), emissiveIntensity: 1.6 }),
    water: std(0x1c3038, .1, { metalness: .25 }) };
  M.tar.side = THREE.DoubleSide /* the færing lies keel up: her inside is seen */; const B = new Map();
  const put = (geo, k, x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0, uv = .5) => { const g = geo.index ? geo.toNonIndexed() : geo; for (const a of Object.keys(g.attributes)) if (!['position', 'normal'].includes(a)) g.deleteAttribute(a);
    if (!g.attributes.normal) g.computeVertexNormals();
    g.applyMatrix4(new THREE.Matrix4().compose(new THREE.Vector3(x, y, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(rx, ry, rz, 'YXZ')), new THREE.Vector3(1, 1, 1))); worldUV(g, uv);
    if (!B.has(k)) B.set(k, []); B.get(k).push(g); return g; };
  const bx = (k, x0, x1, y0, y1, z0, z1, uv = .5) => put(new THREE.BoxGeometry(x1 - x0, y1 - y0, z1 - z0), k, (x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2, 0, 0, 0, uv);
  const rod = (k, a, b, rad, seg = 6) => { const A = new THREE.Vector3(...a), Bv = new THREE.Vector3(...b), d = Bv.clone().sub(A), g = new THREE.CylinderGeometry(rad, rad, d.length(), seg); g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.clone().normalize())); const m = A.add(Bv).multiplyScalar(.5); put(g, k, m.x, m.y, m.z); };
  const sm = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
  // the land: the beach from the water's edge at z -2 up 1 in 8 to the shelf at 2 m (z 14), then 1 in 14 behind, the hill past z 60; the
  // cove's arms rise past x ±40 and run out to -z; rough off the beach and the shelf
  const SH = 2, BZ = 14, F = field(stream(key + ':land'), 1);
  const along = z => z < -2 ? Math.max(-6, (z + 2) * .5) : z < BZ ? (z + 2) * SH / (BZ + 2) : z < 60 ? SH + (z - BZ) / 14 : SH + 46 / 14 + (z - 60) * .45;
  const arms = (x, z) => { const ax = Math.abs(x), e = ax - (40 + Math.max(0, z) * .4); return e > 0 ? e * .55 + .004 * e * e : 0; };
  const busy = (x, z) => (1 - sm(30, 40, Math.abs(x))) * sm(-6, -2, z) * (1 - sm(40, 56, z)) /* the beach and the shelf, kept smooth */;
  const ground = (x, z) => along(z) + arms(x, z) + (F(x, 0, z)[1] * .6 + F(x * .1, 0, z * .1 + 5)[1] * 4 * sm(4, 30, arms(x, z) + Math.max(0, z - 50))) * (1 - busy(x, z) * .97);
  { const steps = (bands, end) => { const v = []; for (const [a, b, st] of bands) for (let q = a; q < b - 1e-6; q += st) v.push(+q.toFixed(2)); v.push(end); return v; };
    const gx = steps([[-200, -60, 8], [-60, 60, 1], [60, 200, 8]], 200), gz = steps([[-200, -30, 8], [-30, 70, 1], [70, 200, 8]], 200), NX = gx.length;
    const pos = []; for (const z of gz) for (const x of gx) pos.push(x, ground(x, z), z); const I = { snow: [], cliff: [], strand: [], gravel: [] }, P = i => [pos[3 * i], pos[3 * i + 1], pos[3 * i + 2]];
    for (let j = 0; j + 1 < gz.length; j++) for (let i = 0; i + 1 < NX; i++) { const a = j * NX + i, b = a + 1, c = a + NX, d = c + 1, qa = P(a), qd = P(d), cx = (qa[0] + qd[0]) / 2, cz = (qa[2] + qd[2]) / 2, cy = (qa[1] + qd[1]) / 2;
      const bs = Math.hypot(ground(cx + 2, cz) - ground(cx - 2, cz), ground(cx, cz + 2) - ground(cx, cz - 2)) / 4;
      const k = cy < SH - .1 && busy(cx, cz) > .5 ? 'strand' : bs > .7 ? 'cliff' : Math.abs(cx) < 2 && cz > BZ - 1 && cz < 34 ? 'gravel' : 'snow'; I[k].push(a, c, b, b, c, d); }
    for (const [k, idx] of Object.entries(I)) { if (!idx.length) continue; const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals(); put(g, k, 0, 0, 0, 0, 0, 0, .35); } }
  { const g = new THREE.PlaneGeometry(700, 400); g.rotateX(-Math.PI / 2); put(g, 'water', 0, 0, -190); }
  // the houses: three small turf halls on the shelf, the doors to the cove
  const houses = [], hallG = [];
  for (const [i, [hx, d]] of [[-14, 9], [0, 8], [14, 10]].entries()) { const H = markHall({ roof: 'turf', turf: i === 1 ? 'dry' : 'moss', w: 6, d, porch: false, chimney: true, carve: false, wall: (i + 1) % 4 }, stream(key + ':house' + i));
    const hz = 30 + (i === 1 ? 3 : 0) + H.stairOut, gy = Math.min(...[-3.2, 3.2].flatMap(dx => [-d / 2, d / 2].map(dz => ground(hx + dx, hz + dz)))) - .05; H.group.position.set(hx, gy, hz); H.group.rotation.y = Math.PI; hallG.push(H);
    houses.push({ x: hx, z: +hz.toFixed(2), y: +gy.toFixed(3), d, door: [hx, +(hz - H.stairOut).toFixed(2)] }); }
  // the arch: two jawbones, each a tapering tube along a curve from its foot out to the side up to the crown over the path
  const AX = 0, AZ = 24, AW = 2.6, AH = 4.6; { for (const s of [-1, 1]) { const pts = []; for (let k = 0; k <= 12; k++) { const t = k / 12; pts.push(new THREE.Vector3(AX + s * (AW / 2 + .35) * (1 - t * t) + s * .08 * Math.sin(t * Math.PI), ground(AX + s * AW / 2, AZ) - .4 + (AH + .5) * Math.sin(t * Math.PI / 2), AZ + .12 * Math.sin(t * Math.PI))); }
      const g = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 24, .26, 8); const P = g.attributes.position, c = new THREE.Vector3(); for (let i = 0; i < P.count; i++) { const u = Math.floor(i / 9) / 24, sh = 1 - .45 * u; c.fromBufferAttribute(P, i); const ctr = new THREE.CatmullRomCurve3(pts).getPointAt(Math.min(1, u)); c.sub(ctr).multiplyScalar(sh).add(ctr); P.setXYZ(i, c.x, c.y, c.z); } g.computeVertexNormals(); put(g, 'bone'); } }
  // the try-works: a stone hearth, two iron pots let into it, a fire-hole under each with embers, soot, the driftwood stack
  const WX = 11, WZ = 18, WY = Math.max(...[-1.7, 1.7].flatMap(dx => [-1, 1].map(dz => ground(WX + dx, WZ + dz)))), RIM = .9, pots = [];
  bx('dry', WX - 1.7, WX + 1.7, WY - .4, WY + RIM - .1, WZ - 1, WZ + 1, .6); bx('stone', WX - 1.75, WX + 1.75, WY + RIM - .1, WY + RIM - .02, WZ - 1.05, WZ + 1.05, .6);
  for (const s of [-1, 1]) { const px = WX + s * .85; put(new THREE.CylinderGeometry(.62, .5, .7, 18, 1, true), 'iron', px, WY + RIM - .3, WZ); put(new THREE.CircleGeometry(.58, 18), 'soot', px, WY + RIM - .2, WZ, -Math.PI / 2); put(new THREE.TorusGeometry(.62, .04, 5, 18), 'iron', px, WY + RIM + .04, WZ, Math.PI / 2);
    put(new THREE.PlaneGeometry(.5, .45), 'ember', px, WY + .2, WZ - 1.01, 0, Math.PI); pots.push([+px.toFixed(2), +(WY + RIM + .04).toFixed(3), WZ]); }
  for (let k = 0; k < 14; k++) { const l = 1.4 + r() * 1.2, y = WY - .1 + .16 * Math.floor(k / 5), x = WX + 2.6 + (k % 5) * .24 + (r() - .5) * .05; rod('log', [x, y + .08, WZ - l / 2], [x, y + .08, WZ + l / 2], .07 + r() * .03, 6); }
  // the slip: from the shelf's edge west of the path down the beach into the water, planks across sleepers, 3.2 m wide
  const SX = -9, SW = 3.2, SZ1 = BZ - 1, slipY = z => ground(SX, SZ1) + .35 + (z - SZ1) / 7.5; let SZ0 = SZ1; while (slipY(SZ0) > -.8) SZ0 -= .25;
  for (let z = SZ0; z < SZ1 - .1; z += 1.2) bx('log', SX - SW / 2 - .25, SX + SW / 2 + .25, Math.min(...[-1.8, 0, 1.8].map(dx => ground(SX + dx, z))) - .3, slipY(z) - .06, z - .12, z + .12);
  for (let z = SZ0; z < SZ1 - 1e-6; z += .3) { const zb = Math.min(SZ1, z + .3), ya = slipY(z), yb = slipY(zb); put(new THREE.BoxGeometry(SW, .06, Math.hypot(.3, yb - ya)), 'plank', SX, (ya + yb) / 2 - .03, (z + zb) / 2, Math.atan2(-(yb - ya), zb - z), 0, 0, .6); }
  for (const s of [-1, 1]) bx('log', SX + s * (SW / 2 + .05) - .08, SX + s * (SW / 2 + .05) + .08, ground(SX + s * SW / 2, SZ1) - .2, slipY(SZ1) + .1, SZ1 - .1, SZ1 + .1);
  // the færing, keel up on two trestles above the tide line, and ribs in the shingle
  const BXp = 20, BZp = 6, BY = ground(BXp, BZp) + 1.25, bB = new Map(), bput = (g, k, x = 0, y = 0, z = 0) => { const gg = g.index ? g.toNonIndexed() : g; for (const a of Object.keys(gg.attributes)) if (!['position', 'normal'].includes(a)) gg.deleteAttribute(a); if (!gg.attributes.normal) gg.computeVertexNormals(); gg.translate(x, y, z); if (!bB.has(k)) bB.set(k, []); bB.get(k).push(gg); };
  faering(bput, 'tar', 6.2, 1.5, .62); { const Mx = new THREE.Matrix4().compose(new THREE.Vector3(BXp, BY, BZp), new THREE.Quaternion().setFromEuler(new THREE.Euler(0, Math.PI / 2 + .1, Math.PI, 'YXZ')), new THREE.Vector3(1, 1, 1)); for (const [k, gs] of bB) for (const g of gs) { g.applyMatrix4(Mx); worldUV(g, .5); if (!B.has(k)) B.set(k, []); B.get(k).push(g); } }
  for (const dx of [-1.6, 1.6]) { const x = BXp + dx * Math.cos(.1), z = BZp - dx * Math.sin(.1), gy = ground(x, z); for (const s of [-1, 1]) rod('log', [x, gy - .1, z + s * .55], [x, BY - .66, z], .05, 5); rod('log', [x, BY - .7, z - .7], [x, BY - .7, z + .7], .06, 5); }
  for (let k = 0; k < 7; k++) { const x = 24 + k * .55 + r() * .1, z = -0.5 + r() * .6, pts = [0, 1, 2, 3, 4].map(t => new THREE.Vector3(x + t * .05, ground(x, z + t * .45) - .15 + Math.sin(t / 4 * Math.PI) * 1.1, z + t * .45)); put(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 8, .07, 5), 'bone'); }
  const group = new THREE.Group(); let tris = 0; for (const [k, gs] of B) { const g = mergeGeometries(gs, false); gs.forEach(x => x.dispose()); const m = new THREE.Mesh(g, M[k]); m.name = k; m.castShadow = !['snow', 'cliff', 'strand', 'gravel', 'water', 'ember'].includes(k); m.receiveShadow = k !== 'water'; group.add(m); tris += g.attributes.position.count / 3; }
  const own = group.children.length; for (const H of hallG) { group.add(H.group); tris += H.tris; }
  const paths = [[[0, 31], [0, BZ + 1], [SX, BZ + 1], [SX, SZ1 + .4]], ...houses.map(h => [[0, 28], [h.x, 28], [h.x, h.door[1] - .2]].filter((p, k, L) => !k || p[0] !== L[k - 1][0] || p[1] !== L[k - 1][1])), [[0, WZ - 1.6], [WX, WZ - 1.6]], [[0, BZ + 1], [BXp - 3.6, BZp + 1], [BXp - 3.6, BZp - 1]]];
  return { group, tris: Math.round(tris), draws: own + hallG.reduce((a, H) => a + H.draws, 0), own, ground, shelf: SH, houses, slip: { x: SX, w: SW, z0: +SZ0.toFixed(2), z1: SZ1, y: slipY, end: +slipY(SZ0).toFixed(3) },
    works: { x: WX, z: WZ, y: WY, pots, rim: RIM }, arch: { x: AX, z: AZ, w: AW, h: AH }, boat: { x: BXp, z: BZp, y: BY }, paths };
}
