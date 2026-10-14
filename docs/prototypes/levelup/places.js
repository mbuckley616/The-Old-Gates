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
import { stream, markTextures } from './pieces.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

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
//   passage, OG-121's "round cairns" (the Gatelands' panel). A mound of stones grassed over, 26 m across inside a kerb of laid boulders
//   and 7 m high, the door (+z) in a dry-stone facade on a chord of the kerb, an entrance stone lying before it. Built to the person:
//   - the passage: 10.3 m of upright slabs (orthostats) either side, 1.25 m clear between them, roofed with lintels 2.2 m over a floor
//     that rises 0.8 m to the chamber, dry-stone packing behind the slabs;
//   - the chamber: cruciform, a middle under a corbelled vault (eight courses of slabs each stepping in 0.2 m, a capstone at 6 m) and
//     three recesses (east, west and back), each 1.5 m wide and 1.6 m deep under its own capstone at 2.3 m, a stone basin in each;
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
  const R = 13, HT = 7, HK = 1.0, FW = 4.2, ZD = Math.sqrt(R * R - FW * FW), ZM = 1.95, FY = .8, W = 1.25, HW = W / 2, LP = 2.2, LC = 2.3, T = .35;
  const floorAt = z => z >= ZD ? 0 : z <= ZM ? FY : FY * (ZD - z) / (ZD - ZM);
  const facadeTop = x => { const a = Math.abs(x); return a < 2.6 ? 3.4 : a > FW ? HK : HK + (3.4 - HK) * (1 - (a - 2.6) / (FW - 2.6)) ** 1.5; };
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
    const n = 44; for (let k = 0; k < n; k++) { const a = (k + .5) / n * Math.PI * 2; if (Math.abs(Math.atan2(Math.sin(a), Math.cos(a))) < A0 + .03) continue; const L = 1.7 + r() * .25, h = .95 + r() * .3;
      const g2 = roughen(new RoundedBoxGeometry(L, h, .7, 3, .22), r, .08, 2.2); put(g2, 'boulder', Math.sin(a) * (R + .08), h / 2 - .08, Math.cos(a) * (R + .08), 0, a + Math.PI / 2, 0, .45); kerb++; } }
  // the facade: dry stone on the chord, its top falling to the kerb at either end, notched for the door; the lintel over the door
  { const pts = [[-FW, 0], [-HW, 0], [-HW, LP], [HW, LP], [HW, 0], [FW, 0]]; for (let k = 0; k <= 16; k++) { const x = FW - k / 16 * 2 * FW; pts.push([x, facadeTop(x)]); }
    const sh = new THREE.Shape(pts.map(([a, b]) => new THREE.Vector2(a, b))), g = new THREE.ExtrudeGeometry(sh, { depth: .7, bevelEnabled: false }); g.translate(0, 0, -.7); put(g, 'stone', 0, 0, ZD, 0, 0, 0, 1.1);
    put(roughen(new THREE.BoxGeometry(2.7, .5, 1.0, 4, 2, 2), r, .04, 2), 'slab', 0, LP + .25, ZD - .4, 0, 0, 0, .5); }
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
    put(new THREE.BoxGeometry(7.4, .2, 6.0), 'floorC', 0, FY - .1, -.75, 0, 0, 0, .5); }
  // the chamber: cruciform, slabs round its outline; the recesses' capstones; the corbelled vault and its capstone
  const ow = [[HW, ZM], [1.45, 1.55], [1.75, .75], [3.4, .75], [3.4, -.75], [1.75, -.75], [.75, -1.75], [.75, -3.4], [-.75, -3.4], [-.75, -1.75], [-1.75, -.75], [-3.4, -.75], [-3.4, .75], [-1.75, .75], [-1.45, 1.55], [-HW, ZM]];
  for (let k = 0; k + 1 < ow.length; k++) { const [x0, z0] = ow[k], [x1, z1] = ow[k + 1]; slabsAlong(x0, z0, x1, z1, () => FY + LC + .02, () => FY - .25, -1, 1, k ? .7 : .15, k + 2 < ow.length ? .7 : .15); }
  const recess = [[2.6, 0, Math.PI / 2], [-2.6, 0, Math.PI / 2], [0, -2.6, 0]];
  for (const [x, z, ry] of recess) put(roughen(new THREE.BoxGeometry(2.4, .4, 2.3, 3, 2, 3), r, .03, 2), 'slab', x, FY + LC + .2, z, 0, ry, 0, .5);
  for (let c = 0; c < 8; c++) { const rin = 1.95 - c * .2, y = FY + LC + c * .36, n = 9; for (let k = 0; k < n; k++) { const a = (k + c * .5) / n * Math.PI * 2, len = 2 * (rin + .45) * Math.tan(Math.PI / n) + .12;
    put(roughen(new THREE.BoxGeometry(len, .36, .95, 3, 1, 2), r, .025, 2.4), 'slab', Math.sin(a) * (rin + .47), y + .18, Math.cos(a) * (rin + .47), 0, a, 0, .5); } }
  const VAULT = FY + LC + 8 * .36; put(roughen(new THREE.CylinderGeometry(.95, 1.0, .4, 10, 1), r, .03, 2), 'slab', 0, VAULT + .2, 0, 0, 0, 0, .5);
  // the basins: a shallow oval dish of stone in each recess, empty
  const basins = []; { const prof = [[0, 0], [.5, 0], [.56, .06], [.56, .24], [.5, .26], [.44, .2], [.3, .14], [0, .13]].map(([a, b]) => new THREE.Vector2(a, b));
    for (const [x, z, ry] of recess) { const bx = x * 1.08, bz = z * 1.08, g = roughen(new THREE.LatheGeometry(prof, 16), r, .015, 4); g.scale(1.25, 1, .85); put(g, 'boulder', bx, FY, bz, 0, ry, 0, .6); basins.push([+bx.toFixed(2), +(FY + .26).toFixed(2), +bz.toFixed(2)]); } }
  // the entrance stone: a long boulder lying before the door, its face to the approach
  const ES = ZD + 2.4; put(roughen(new RoundedBoxGeometry(3.0, 1.2, .9, 4, .25), r, .03, 1.8), 'boulder', 0, .55, ES, 0, 0, 0, .45);
  if (carved) { for (const [x, y, rad, cw] of [[-.75, .62, .3, 1], [-.12, .6, .26, -1], [.6, .66, .32, 1]]) put(spiral(rad, 4, cw), 'groove', x, y, ES + .46);
    put(new THREE.BoxGeometry(.03, .85, .03), 'groove', .22, .6, ES + .47);
    for (const [x, y, rad, cw] of [[-.26, 1.35, .22, 1], [.26, 1.35, .22, -1], [0, 1.78, .22, 1]]) put(spiral(rad, 3, cw), 'groove', x, FY + y - .4, -3.4 + .02, 0, 0, 0);
    for (let k = 0; k < 4; k++) { const d = new THREE.TorusGeometry(.16, .012, 3, 4); d.scale(1, 1.5, 1); put(d, 'groove', HW + .04, 1.0 + k * .38, ZD - 4.1, 0, Math.PI / 2, 0); } }
  // the walk: round the entrance stone's east end, in at the door, up the passage, across the chamber to the back recess's mouth
  const path = [[3.0, ZD + 5], [3.0, ZD + 1.3], [0, ZD + .5], [0, ZM - .2], [0, -1.5]];
  const group = new THREE.Group(); let tris = 0; for (const [k, gs] of B) { const g = mergeGeometries(gs, false); gs.forEach(x => x.dispose()); const m = new THREE.Mesh(g, M[k]); m.name = k; m.castShadow = k !== 'groove'; m.receiveShadow = true; group.add(m); tris += g.attributes.position.count / 3; }
  return { group, tris: Math.round(tris), draws: group.children.length, top: +new THREE.Box3().setFromObject(group).max.y.toFixed(2), path, floorAt, door: { x0: -HW, x1: HW, z: +ZD.toFixed(2), lintel: LP }, passage: { w: W, len: +(ZD - ZM).toFixed(2), lintel: LP },
    chamber: { y: FY, vault: +VAULT.toFixed(2) }, basins, kerb, carved, entrance: +ES.toFixed(2) };
}

// gatelandsCave(o, r) (Session 872, Michael's 3 A on #305, the second of the next places): a limestone cave with a lake under falls, OG-121's
//   "natural caverns: stalactites, an underground lake under falls, strange flowers" and the Gatelands' "limestone caves", OG-099's cave of
//   blue pools under falls. Built to the person, a metre a unit, +z the mouth:
//   - the way in: a passage 14 m long, 3 m wide and 3 m high in pale limestone, from the mouth (z 0) to the chamber;
//   - the chamber: 22 m across, 26 m long and 11 m high, its floor a shore along the east side and across the near end, the rest a lake
//     whose bed falls to 3.4 m under its surface (0.45 m under the shore);
//   - the falls: a stream comes in through a swallow hole in the roof at the far west corner, 2 m across under a shaft open to the sky, and
//     falls 11 m into the lake; the day comes down the shaft with it;
//   - stalactites from the roof, stalagmites and flowstone on the shore off the walk, and pale flowers that glow in the dark at the water's
//     edge (o.flowers, default true);
//   - the shelf: the shore's far end, a ledge beside the falls' pool, where the walk ends.
//   -> { group, tris, draws, top, path, floor (the shore's height, 0), lake { x0, x1, z0, z1, y, deep }, falls { x, z, top, foot },
//        shaft { x, z, r, top }, mouth { x0, x1, h }, flowers ([x, y, z]...) }
let VM = null;
function caveMats() {
  if (VM) return VM; const M = mats();
  VM = { ...M, lime: mat('rock', { ns: 1.5, color: 0xb8b4a8, rough: .9 }), limeWet: mat('rock', { ns: 1.6, color: 0x9a988e, rough: .4 }), bed: mat('rock', { ns: 1.2, color: 0x6a7a74, rough: .8 }),
    drip: mat('rock', { ns: 1.0, color: 0xd8d2c0, rough: .6 }), lake: new THREE.MeshStandardMaterial({ color: 0x1a5a6a, roughness: .04, metalness: .1, transparent: true, opacity: .78, depthWrite: false }),
    fall: new THREE.MeshStandardMaterial({ color: 0xd8eef4, emissive: new THREE.Color(.35, .5, .58), emissiveIntensity: .6, roughness: .2, transparent: true, opacity: .62, side: THREE.DoubleSide, depthWrite: false }),
    foam: new THREE.MeshStandardMaterial({ color: 0xf0f6f8, roughness: .5, transparent: true, opacity: .8, depthWrite: false }),
    petal: new THREE.MeshStandardMaterial({ color: 0xbfe6f0, emissive: new THREE.Color(.45, .8, 1), emissiveIntensity: 1.4, roughness: .5 }), stalk: new THREE.MeshStandardMaterial({ color: 0x4a6a5a, roughness: .8 }) };
  VM.lime.side = VM.limeWet.side = THREE.DoubleSide; return VM;
}
export function gatelandsCave(o = {}, r = stream('cave')) {
  const M = caveMats(), B = new Map(), flowersOn = o.flowers !== false;
  const put = (geo, key, x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0, uv = .6) => { const g = geo.index ? geo.toNonIndexed() : geo; for (const k of Object.keys(g.attributes)) if (!['position', 'normal'].includes(k)) g.deleteAttribute(k);
    g.applyMatrix4(new THREE.Matrix4().compose(new THREE.Vector3(x, y, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(rx, ry, rz, 'YXZ')), new THREE.Vector3(1, 1, 1))); worldUV(g, uv);
    if (!B.has(key)) B.set(key, []); B.get(key).push(g); };
  const F = field(stream(String(o.key || 'cave') + ':rock'), .4), PL = 14, PW = 3, PH = 3, CW = 22, CL = 26, CH = 11, Z0 = -PL, Z1 = -PL - CL, LY = -.45, DEEP = 3.4;
  const shore = { x0: CW / 2 - 4.2, nearZ: Z0 - 3.4, farZ: Z1 + 4.0 }, SX = -CW / 2 + 3.6, SZ = Z1 + 3.4, SR = 2.0;
  // the passage: walls and roof, open at both ends and below; its floor a flat bed
  put(rockBox(PW, PH, PL, 0, PH / 2, -PL / 2, .5, F, (c, n) => Math.abs(n.z) < .5 && n.y > -.5, y => y < .01), 'lime', 0, 0, 0, 0, 0, 0, .35);
  put(new THREE.BoxGeometry(PW + .4, .3, PL), 'lime', 0, -.15, -PL / 2, 0, 0, 0, .4);
  // the chamber: walls and roof; the near wall cut for the passage, the roof cut for the swallow hole; no floor (the shore and the bed are their own)
  put(rockBox(CW, CH + 4, CL, 0, (CH - 4) / 2, (Z0 + Z1) / 2, .5, F, (c, n) => n.y > -.5 && !(n.z > .5 && Math.abs(c.x) < PW / 2 && c.y > 0 && c.y < PH) && !(n.y > .5 && Math.hypot(c.x - SX, c.z - SZ) < SR + .8), y => Math.abs(y + 4) < .01), 'lime', 0, 0, 0, 0, 0, 0, .3);
  // the shaft up from the swallow hole to the sky, wet: a funnel from 3.2 m across at its foot, just under the roof and wider than the hole
  // cut in it, to 2 m at the top, so nothing gets out between the roof and the shaft
  { const H2 = 12.2, g = new THREE.CylinderGeometry(SR, SR + 1.2, H2, 20, 8, true), P = g.attributes.position; for (let i = 0; i < P.count; i++) { const [dx, , dz] = F(P.getX(i) + SX, P.getY(i) + CH + 6, P.getZ(i) + SZ); P.setX(i, P.getX(i) + dx * .15); P.setZ(i, P.getZ(i) + dz * .15); }
    g.computeVertexNormals(); put(g, 'limeWet', SX, CH - .3 + H2 / 2, SZ, 0, 0, 0, .4); }
  // the floor: one grid over the chamber, the shore flat at 0 along the east side and the near end, falling under the lake to its bed
  const inShore = (x, z) => x > shore.x0 || z > shore.nearZ || (z < shore.farZ && x > -1.2);
  const lakeD = (x, z) => { const d = Math.min(shore.x0 - x, z < shore.farZ ? 9 : shore.nearZ - z, z < shore.farZ ? -1.2 - x : 9, x + CW / 2, z - Z1); return Math.max(0, Math.min(1, d / 3.2)); };
  { const NX = 44, NZ = 52, pos = [], idx = []; for (let j = 0; j <= NZ; j++) for (let i = 0; i <= NX; i++) { const x = -CW / 2 - .8 + (CW + 1.6) * i / NX, z = Z0 + .8 - (CL + 1.6) * j / NZ; /* run under the walls, whose noise moves them 0.6 m */
      let y = 0; if (!inShore(x, z)) { const t = lakeD(x, z); y = -.6 - (DEEP - .15) * t * t * (3 - 2 * t); } else y = -.02 + .04 * Math.sin(x * 3.1) * Math.sin(z * 2.7) * .3; pos.push(x, y, z); }
    for (let j = 0; j < NZ; j++) for (let i = 0; i < NX; i++) { const a = j * (NX + 1) + i, b = a + 1, c = a + NX + 1, d = c + 1; idx.push(a, b, c, b, d, c); }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals(); put(g, 'bed', 0, 0, 0, 0, 0, 0, .3);
    // the shore's own skin over the grid where it is dry, paler: the same grid's dry cells
    const pos2 = []; for (let j = 0; j < NZ; j++) for (let i = 0; i < NX; i++) { const q = [[i, j], [i + 1, j], [i, j + 1], [i + 1, j], [i + 1, j + 1], [i, j + 1]].map(([a, b]) => b * (NX + 1) + a);
      if (q.every(k => pos[k * 3 + 1] > -.05)) for (const k of q) pos2.push(pos[k * 3], pos[k * 3 + 1] + .005, pos[k * 3 + 2]); }
    const g2 = new THREE.BufferGeometry(); g2.setAttribute('position', new THREE.Float32BufferAttribute(pos2, 3)); g2.computeVertexNormals(); put(g2, 'lime', 0, 0, 0, 0, 0, 0, .35); }
  // the lake's surface
  put(new THREE.PlaneGeometry(CW, CL).rotateX(-Math.PI / 2), 'lake', 0, LY, (Z0 + Z1) / 2, 0, 0, 0, .1);
  // the falls: a sheet of water from the swallow hole's lip down to the lake, three ribbons a little apart, foam where it lands
  const falls = { x: SX + .4, z: SZ, top: CH + 2, foot: LY };
  for (let k = 0; k < 3; k++) { const g = new THREE.PlaneGeometry(1.1 - k * .2, falls.top - LY, 1, 12), P = g.attributes.position; for (let i = 0; i < P.count; i++) P.setZ(i, .18 * Math.sin(P.getY(i) * .9 + k * 2));
    g.computeVertexNormals(); put(g, 'fall', falls.x + (k - 1) * .35, (falls.top + LY) / 2, falls.z + (k - 1) * .2, 0, .5 + k * .5, 0, .3); }
  for (let k = 0; k < 9; k++) { const a = k / 9 * Math.PI * 2, g = new THREE.SphereGeometry(.35 + r() * .2, 8, 5); g.scale(1.3, .25, 1.3); put(g, 'foam', falls.x + Math.cos(a) * .7, LY + .03, falls.z + Math.sin(a) * .7); }
  // stalactites from the roof (over the lake and the shore alike, all above 6 m), stalagmites and flowstone on the shore away from the walk
  // and back from the water's edge, where the flowers are
  for (let k = 0; k < 46; k++) { const x = -CW / 2 + 1 + r() * (CW - 2), z = Z0 - 1 - r() * (CL - 2); if (Math.hypot(x - SX, z - SZ) < SR + 1) continue; const L = .4 + r() ** 2 * 2.2, g = new THREE.ConeGeometry(.08 + L * .07, L, 7); g.rotateX(Math.PI);
    put(g, 'drip', x, CH - .2 - L / 2 + F(x, CH, z)[1] * .3, z); }
  const path = [[0, -.4], [0, Z0 - 1.2], [CW / 2 - 2.0, Z0 - 3.0], [CW / 2 - 2.0, shore.farZ - .8], [1.4, Z1 + 2.2], [-.4, Z1 + 2.2]];
  const nearPath = (x, z) => { let m = 9; for (let s = 0; s + 1 < path.length; s++) { const [x0, z0] = path[s], [x1, z1] = path[s + 1], dx = x1 - x0, dz = z1 - z0, t = Math.max(0, Math.min(1, ((x - x0) * dx + (z - z0) * dz) / (dx * dx + dz * dz))); m = Math.min(m, Math.hypot(x - x0 - dx * t, z - z0 - dz * t)); } return m; };
  for (let k = 0, n = 0; k < 80 && n < 16; k++) { const x = shore.x0 + 1.4 + r() * 2.6, z = Z0 - 2 - r() * (CL - 4); if (!inShore(x, z) || nearPath(x, z) < 1.1 || x > CW / 2 - .5) continue; n++;
    const L = .3 + r() * 1.1, g = new THREE.ConeGeometry(.14 + L * .12, L, 8); put(g, 'drip', x, L / 2 - .02, z); }
  // flowstone: pale rounded lobes down the east wall by the shore
  for (let k = 0; k < 7; k++) { const z = Z0 - 3 - k * 3.2 - r(), g = new THREE.SphereGeometry(.9, 10, 8); g.scale(.5, 1.6, 1.2); put(g, 'drip', CW / 2 - .25, .9, z); }
  // the strange flowers: pale blue, glowing, in clusters at the water's edge
  const flowers = []; if (flowersOn) for (let c = 0; c < 6; c++) { const cz = Z0 - 3.5 - c * 3.8, cx = shore.x0 + .3; for (let k = 0; k < 7; k++) { const x = cx + r() * .6, z = cz + (r() - .5) * 1.2, h = .15 + r() * .25;
      if (nearPath(x, z) < .5) continue; put(new THREE.CylinderGeometry(.008, .01, h, 4), 'stalk', x, h / 2, z); put(new THREE.SphereGeometry(.045, 7, 5).scale(1, .6, 1), 'petal', x, h + .02, z); flowers.push([+x.toFixed(2), +(h + .02).toFixed(2), +z.toFixed(2)]); } }
  const group = new THREE.Group(); let tris = 0; for (const [k, gs] of B) { const g = mergeGeometries(gs, false); gs.forEach(x => x.dispose()); const m = new THREE.Mesh(g, M[k]); m.name = k; m.castShadow = !['lake', 'fall', 'foam', 'petal'].includes(k); m.receiveShadow = true; group.add(m); tris += g.attributes.position.count / 3; }
  return { group, tris: Math.round(tris), draws: group.children.length, top: +new THREE.Box3().setFromObject(group).max.y.toFixed(2), path, floor: 0, lake: { x0: -CW / 2, x1: shore.x0, z0: shore.nearZ, z1: Z1, y: LY, deep: DEEP },
    falls, shaft: { x: SX, z: SZ, r: SR, top: CH + 11.9, cut: SR + .8 }, mouth: { x0: -PW / 2, x1: PW / 2, h: PH }, flowers, chamber: { x0: -CW / 2, x1: CW / 2, z0: Z0, z1: Z1, h: CH } };
}
