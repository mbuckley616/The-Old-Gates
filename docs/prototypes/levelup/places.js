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
import { mat, worldUV } from './common.js';
import { stream, markTextures, aurenneTextures } from './pieces.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { gatelandsSloop } from './ships.js';

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
  { const bx0 = TX - JW - 1.2, bz = JZ - 3.8, BL = 4.2, W2 = .75, pts = []; for (let k = 0; k <= 10; k++) { const t = k / 10; pts.push(new THREE.Vector2(Math.sin(Math.PI * t) ** .6 * W2 + .05, (t - .5) * BL)); }
    const g = new THREE.LatheGeometry(pts, 14, Math.PI / 2, Math.PI); g.rotateZ(Math.PI / 2); g.rotateX(Math.PI); g.scale(1, .55, 1); put(g, 'hull', bx0, .25, bz, 0, 0, 0, .5);
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
    chamber: { x0: -RX(.5), x1: RX(.5), z0: Z0, z1: Z1, h: CY + RY(.5) }, passage: { w: PRX * 2, h: PUP + 1.3 }, gallery: { y: GY, z0: GZ0, z1: GZ1 }, fire: { x: FX, z: FZ }, jetty: { x1: TX + JW, z: JZ, z0: TH0, z1: TH1 }, ship: ship && { x: ship.x, z: ship.z, L: ship.L, W: ship.W } };
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
