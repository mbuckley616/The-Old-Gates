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
//   o.worked (default true): the vein shows fresh pick marks and a heap; false, the face is old and the heap gone.
//   -> { group, tris, draws, top, path (the walk, [x, z] at floor height 0), sets (each { x0, x1, cap, foot }), lamps ([x, y, z]),
//        void { x0, x1, z0, z1, floor, water }, rail (the gallery's open edge x), vein ([x, y, z] its middle), face (z of the face) }
// All rock shares one noise field keyed by the place, so the adit's rock and the chamber's meet at the same points where they join.
import * as THREE from 'three';
import { mergeGeometries, mergeVertices } from 'three/addons/utils/BufferGeometryUtils.js';
import { mat, worldUV } from './common.js';
import { stream } from './pieces.js';

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
  const lamp = (x, y, z, peg) => { if (peg) put(new THREE.CylinderGeometry(.015, .015, .25, 6).rotateX(Math.PI / 2), 'iron', x, y + .12, z + peg * .12); put(new THREE.BoxGeometry(.12, .16, .12), 'horn', x, y, z); put(new THREE.ConeGeometry(.09, .08, 4).rotateY(Math.PI / 4), 'iron', x, y + .12, z); put(new THREE.TorusGeometry(.03, .006, 4, 10), 'iron', x, y + .18, z); lamps.push([x, y, z].map(v => +v.toFixed(2))); };
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
  // the cart: a timber box on four iron wheels, at its stop-block, half full of ore
  { const cz = -18.9; put(new THREE.BoxGeometry(.9, .55, 1.1), 'timber', 0, .62, cz); put(new THREE.BoxGeometry(.8, .1, 1.0), 'ore', 0, .82, cz); for (const ex of [-.3, .3]) for (const ez of [-.36, .36]) put(new THREE.CylinderGeometry(.17, .17, .06, 14).rotateZ(Math.PI / 2), 'iron', ex + Math.sign(ex) * .03, .3, cz + ez); }
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
