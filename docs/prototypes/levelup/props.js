// The Makers' trials' props in the new kit (Session 837, backlog L and v2-scope §4: "the props, in the new kit"). The systems
// builder built the trials on placeholders (Sessions 800 to 802); unique-artifacts.md gives what each one is:
// bladeStone(o, r): An Chloch's trial, the Gate-Blade "in a standing stone outside a ruined gate, plainly visible". A standing
//   stone of 2.6 to 3.2 m, the blade driven into its face at chest height and slanting down, so a person can take the grip;
//   ogham notches up one edge; the fallen jamb and lintel of the ruined gate behind it.
// ringCairn(o, r): An Spéir's trial, the Sundial Ring "on a peak's cairn, readable only at noon on a clear day". A cairn of
//   rounded stones to 1.7 m under a flat capstone; the ring in a hollow cut in the capstone; on the cairn's south side (+z) an
//   upright slab pierced by a round hole, set so that the noon sun through it falls on the hollow and nowhere else.
// waylamp(o, r) (Session 838): An Teallach's Waylamp, "passed from inn to inn", carried lit through five towns' inns. A hand
//   lantern of 0.43 m to its ring: a square iron frame with horn panes, a pierced conical cap with a ring to carry it by, a brass plate
//   on its door with the hearth's mark, a candle's flame inside. o.lit (default true): the horn glows and the flame burns;
//   unlit (a crime put it out) the horn is dull and there is no flame. o.hook: the inn's iron bracket on a stone wall stub.
// tidalWreck(o, r) (Session 839): An Mhuir's trial, the Drowned Bell, "a wreck on a rock that is above water only at low tide".
//   y = 0 is low water and HW (2.4 m, the game's BELL_HIGH_DY) high water. A flat skerry awash at the ebb; on it a small trader's
//   hull of 10 m, sunk a little into a pocket of the rock and heeled 26° onto its starboard side: the low side keeps its planking, the high side is bare ribs broken short; weed
//   to the high-water line. The broken mast is the only thing that stands out of the sea at high water. The last deck beam aft
//   carries the bell (a bronze ship's bell gone green, 0.45 m) on an iron strap, under water at high tide and in reach of a person
//   standing in the hull at low. o.taken: no bell, a bright ring of wood on the beam where its strap was.
// beastDen(o, r) (Session 850): Na Beithígh's trial, the Wolf-Mother's Cloak "worn by a lair's master": the master sleeps on it in the
//   lair's deepest chamber and you take it from under the living beast (Michael's A on #270: it wakes only when struck). A domed cave of
//   about 10 by 9 m and 4.3 m high, its mouth a tunnel to +z, a crack in the roof letting down a shaft of day; a nest against the back wall, a
//   hollow scraped to the bare stone with bracken heaped round its rim, bones about it; the grey cloak spread in the hollow, its mantle's straight edge under where the master lies and its hem
//   curving out past the master toward the mouth, so the hem is what you take hold of. o.master = { len, wid } is the sleeper's
//   footprint (default 2.6 by 1.4, an ogre or a great bear); the master itself is the bodies builder's, drawn here as a ghost (o.ghost).
// shuttleRoom(o, r) (Session 851): An Fíodóir's trial, the Shuttle "in the deepest room of the gate nearest the home island's last
//   unread sigil", lying "on the floor before the sigil, as if put down a moment ago" (the approved draft). A lesser gate's last room in
//   visual-foundation §2's language at a lesser gate's size (OG-119: "one arched room of about ten metres"): a pointed barrel vault of
//   10 m span and 9 m to its crown, 14 m long, on dark slabs of 2.5 m, engaged piers with amber script up their faces, the unread
//   sigil, a ring of 2.4 m, on the end wall, the door an arched slit of 3.2 by 6 m at the other end. The Shuttle: a weaver's shuttle of
//   pale wood, 0.32 m, its pirn in the cavity and a thread end lying from its eye. o.taken: the floor bare under the sigil.
// greatKnot(o, r) (Session 1376): a great gate's ring and its knot (the approved draft, The Great Gates I: "At the hall's end stands a
//   ring of stone, higher than the hall. The script on every wall runs toward it, and in the dark at its heart it is all drawn into
//   one knot"; visual-foundation §2: "a ring 30 to 40 m high, dark at its heart"). y 0 is the top of the ring chamber's dais (10 m
//   square, 0.4 high, the game's); the ring stands free on the chamber's floor behind it, a round ring of 40 dressed stones 30.8 m
//   high, 3.6 m of face, the script cut round its face and its soffit, the dark filling its heart. Threads of the school's light
//   leave the soffit all round and are drawn into the knot. o.place 'low' (default): the knot hangs before the dark 2.1 m over the
//   dais's middle, within a hand's reach; 'high': the knot sits at the ring's heart, 15 m up, and one cord runs down from it to a
//   stone on the dais, where the act is done. o.state 'untied' (default; drawn tight), 'torn' (cut: the two ends hang apart, the
//   light low) or 'sealed' (bound: whole, smaller, tighter, a whipping of pale thread round its middle). o.school dresses the light.
// All -> { group, tris, draws, top, grip | ring | handle } (the grip's or the ring's place in the prop's own frame). One mesh per material.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { mat, worldUV } from './common.js';
import { stream } from './pieces.js';

let PM = null;
function mats() {
  if (PM) return PM;
  PM = { rock: mat('rock', { ns: 1.4, color: 0xb4b2a6, rough: .95 }), moss: mat('rock', { ns: 1.2, color: 0x7a8a5a, rough: 1 }), dressed: mat('ashlar', { ns: 1.0, color: 0xc8c2b2, rough: .9 }),
    steel: new THREE.MeshStandardMaterial({ color: 0xc4c8cc, roughness: .35, metalness: .45 }), iron: new THREE.MeshStandardMaterial({ color: 0x23211f, roughness: .5, metalness: .6 }),
    gold: new THREE.MeshStandardMaterial({ color: 0xc8952e, roughness: .3, metalness: .85 }), leather: new THREE.MeshStandardMaterial({ color: 0x3a2618, roughness: .8 }), horn: new THREE.MeshStandardMaterial({ color: 0xc89a5a, roughness: .55, transparent: true, opacity: .82 }),
    hornLit: new THREE.MeshStandardMaterial({ color: 0xd8a860, emissive: new THREE.Color(1, .62, .28), emissiveIntensity: 1.6, roughness: .5, transparent: true, opacity: .9 }), flame: new THREE.MeshStandardMaterial({ color: 0xffd090, emissive: new THREE.Color(1, .75, .4), emissiveIntensity: 4 }), brass: new THREE.MeshStandardMaterial({ color: 0xb08a3e, roughness: .4, metalness: .7 }), dark: new THREE.MeshStandardMaterial({ color: 0x0d0b09, roughness: 1 }),
    wetRock: mat('rock', { ns: 1.6, color: 0x75726a, rough: .5 }), weed: new THREE.MeshStandardMaterial({ color: 0x3a3a1c, roughness: .6, side: THREE.DoubleSide }), wetWood: mat('wood', { ns: 1.2, color: 0x7a6650, rough: .55 }),
    spar: mat('wood', { ns: 1.0, color: 0xb0a898, rough: .9 }), bronze: new THREE.MeshStandardMaterial({ color: 0x5f8a72, roughness: .55, metalness: .5 }), scar: mat('wood', { ns: .6, color: 0xd8bc8a, rough: .8 }),
    cave: mat('rock', { ns: 1.5, color: 0x7a6e60, rough: .95 }), bracken: mat('rock', { ns: 2, color: 0x86704c, rough: 1 }), bone: new THREE.MeshStandardMaterial({ color: 0xa89c80, roughness: .8 }),
    fur: mat('rock', { ns: .9, color: 0x8c8c88, rough: .85 }), furPale: mat('rock', { ns: 1.4, color: 0xb4b2ac, rough: 1 }), furDark: mat('rock', { ns: .4, color: 0x4a4a48, rough: .9 }),
    slab: mat('rock', { ns: 1.2, color: 0x2e2c2a, rough: .32 }), gateStone: mat('ashlar', { ns: 1.1, color: 0x3a3734, rough: .75 }), pale: mat('wood', { ns: .4, color: 0xf2ecdc, rough: .5 }),
    thread: new THREE.MeshStandardMaterial({ color: 0xd8c8a0, roughness: .9 }), script: null, ring: new THREE.MeshStandardMaterial({ color: 0x1a1410, emissive: new THREE.Color(1, .62, .22), emissiveIntensity: 2.2, roughness: .6 }),
    ghost: new THREE.MeshStandardMaterial({ color: 0x6a7480, roughness: 1, transparent: true, opacity: .14, depthWrite: false }) };
  return PM;
}
// a rough stone: a subdivided box (or ball) pushed about by smooth noise from the prop's stream, so the same key makes the same stone
function rough(geo, r, amp, f = 1.6) { const P = geo.attributes.position, ph = [r() * 9, r() * 9, r() * 9], v = new THREE.Vector3();
  for (let i = 0; i < P.count; i++) { v.fromBufferAttribute(P, i); const n = Math.sin(v.x * f + ph[0]) * Math.sin(v.y * f * 1.3 + ph[1]) * Math.sin(v.z * f + ph[2]) + .5 * Math.sin(v.x * f * 2.7 + ph[1]) * Math.sin(v.z * f * 2.3 + ph[0]);
    const len = v.length() || 1; v.addScaledVector(v.clone().divideScalar(len), n * amp); P.setXYZ(i, v.x, v.y, v.z); }
  geo.computeVertexNormals(); return geo; }
function kit() { const M = mats(), B = new Map();
  const put = (geo, key, x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0, uv = .6) => { const g = geo.index ? geo.toNonIndexed() : geo; for (const k of Object.keys(g.attributes)) if (!['position', 'normal', ...(uv === null ? ['uv'] : [])].includes(k)) g.deleteAttribute(k);
    g.applyMatrix4(new THREE.Matrix4().compose(new THREE.Vector3(x, y, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(rx, ry, rz, 'YXZ')), new THREE.Vector3(1, 1, 1))); if (uv !== null) worldUV(g, uv); /* uv null: keep the piece's own (the gate's script) */
    if (!B.has(key)) B.set(key, []); B.get(key).push(g); };
  const finish = extra => { const group = new THREE.Group(); let tris = 0; for (const [k, gs] of B) { const g = mergeGeometries(gs, false); gs.forEach(x => x.dispose()); const m = new THREE.Mesh(g, M[k]); m.name = k; m.castShadow = k !== 'dark'; m.receiveShadow = true; group.add(m); tris += g.attributes.position.count / 3; }
    return { group, tris: Math.round(tris), draws: group.children.length, top: +new THREE.Box3().setFromObject(group).max.y.toFixed(2), ...extra }; };
  return { put, finish }; }

export function bladeStone(o = {}, r = stream('blade')) {
  const { put, finish } = kit(), h = 2.6 + r() * .6, w = .95 + r() * .2, d = .6 + r() * .15;
  // the stone: tapering a little to a rounded head, leaning a few degrees, its foot sunk in the ground
  { const g = new THREE.BoxGeometry(w, h, d, 6, 14, 4), P = g.attributes.position; for (let i = 0; i < P.count; i++) { const y = P.getY(i) / h + .5, k = 1 - .22 * y - .3 * Math.max(0, y - .85) ** 2 * 10; P.setX(i, P.getX(i) * k); P.setZ(i, P.getZ(i) * (1 - .15 * y)); }
    rough(g, r, .05, 2.2); put(g, 'rock', 0, h / 2 - .25, 0, 0, 0, (r() - .5) * .08, .45); }
  // moss low on its north side, ogham notches up its east edge
  { const g = rough(new THREE.SphereGeometry(.42, 12, 8), r, .06); g.scale(1.1, .55, .5); put(g, 'moss', 0, .2, -d * .38); }
  for (let i = 0; i < 9; i++) { const y = .7 + i * .16, len = .07 + (i % 3) * .04; put(new THREE.BoxGeometry(len, .025, .04), 'dark', w * .46 * (1 - .22 * (y / h)) - len / 2 + .02, y, d * .32, 0, 0, i % 2 ? .4 : -.3); }
  // the blade: driven into the face at chest height, slanting down into the stone; a third of it in, the rest and the hilt out
  const gy = 1.15, tilt = .42, L = 1.05, out = .68, dir = new THREE.Vector3(0, -Math.sin(tilt), -Math.cos(tilt)), ent = new THREE.Vector3(0, gy, d / 2 - .05);
  const along = (s, geo, key, roll = 0) => { const p = ent.clone().addScaledVector(dir, -s); geo.rotateX(Math.PI / 2 - tilt); put(geo, key, p.x, p.y, p.z, 0, 0, roll); return p; };
  { const s = new THREE.Shape([[-.028, 0], [.028, 0], [.024, L - .12], [0, L], [-.024, L - .12]].map(([a, b]) => new THREE.Vector2(a, b))); const g = new THREE.ExtrudeGeometry(s, { depth: .008, bevelEnabled: true, bevelThickness: .004, bevelSize: .004, bevelSegments: 1 });
    g.translate(0, 0, -.004); g.rotateX(Math.PI); g.rotateX(Math.PI / 2 - tilt); /* its base at the guard, its point a third of the way into the stone */ const p = ent.clone().addScaledVector(dir, -out); put(g, 'steel', p.x, p.y, p.z); }
  const guard = along(out, new THREE.BoxGeometry(.26, .03, .035), 'iron'); along(out + .1, new THREE.CylinderGeometry(.018, .021, .17, 8), 'leather'); const pom = along(out + .2, new THREE.SphereGeometry(.035, 10, 8), 'gold');
  const grip = ent.clone().addScaledVector(dir, -(out + .1));
  // the ruined gate behind: a fallen jamb of dressed stone and its lintel broken across it, half in the turf
  if (o.ruin !== false) { const jx = -2.4 - r() * .6, jz = -2.8; put(rough(new THREE.BoxGeometry(.7, 3.0, .6, 2, 6, 2), r, .02), 'dressed', jx, 1.2, jz, 0, .2, .32, .5);
    put(rough(new THREE.BoxGeometry(2.6, .55, .6, 6, 2, 2), r, .03), 'dressed', jx + 2.2, .2, jz - .6, 0, -.5, .06, .5); put(rough(new THREE.BoxGeometry(1.4, .55, .6, 4, 2, 2), r, .03), 'dressed', jx + 3.9, .16, jz - 1.5, 0, -.9, -.05, .5);
    for (let i = 0; i < 5; i++) put(rough(new THREE.IcosahedronGeometry(.18 + r() * .2, 1), r, .04), 'rock', jx + r() * 4, .05, jz + (r() - .5) * 2.4); }
  return finish({ grip: grip.toArray().map(v => +v.toFixed(3)), guard: guard.toArray().map(v => +v.toFixed(3)), pommel: pom.toArray().map(v => +v.toFixed(3)), height: +h.toFixed(2) });
}

export function ringCairn(o = {}, r = stream('cairn')) {
  const { put, finish } = kit(), H = 1.55, R0 = 1.5;
  // the cairn: courses of rounded stones, each course a smaller ring, settled into the one below
  let n = 0; for (let c = 0; c < 7; c++) { const y = c * H / 7, rad = R0 * (1 - c / 7.6), k = Math.max(3, Math.round(rad * 6.2));
    for (let i = 0; i < k; i++) { const a = (i + r() * .4 + c * .5) / k * Math.PI * 2, s = .2 + r() * .12 - c * .01, g = rough(new THREE.IcosahedronGeometry(s, 1), r, s * .18, 4); g.scale(1.2, .7, 1);
      put(g, r() < .15 ? 'moss' : 'rock', Math.sin(a) * rad * .85, y + s * .5, Math.cos(a) * rad * .85, 0, r() * 6); n++; }
    put(rough(new THREE.CylinderGeometry(rad * .8, rad * .9, H / 7 + .05, 10, 1), r, .05), 'rock', 0, y + H / 14, 0); }
  // the capstone, the hollow in it, the ring in the hollow
  const cy = H + .1; put(rough(new THREE.CylinderGeometry(.55, .6, .2, 12, 1), r, .006, 3), 'rock', 0, cy, 0); put(new THREE.CylinderGeometry(.13, .1, .02, 20), 'dressed', 0, cy + .101, 0);
  const ring = [0, cy + .115, 0]; put(new THREE.TorusGeometry(.022, .0045, 8, 20), 'gold', ...ring, Math.PI / 2);
  // the slab is thin (10 cm with its arrises) and the hole 20 cm across: at a 40° sun the light drops 8 cm going through it, so a
  // spot of about 12 cm gets through; a thick slab would shut it out
  // the pierced slab on the south side (+z, toward the noon sun): its hole on the line from the hollow to the sun (o.sunAlt, its height at noon)
  const alt = o.sunAlt ?? 40 * Math.PI / 180, sd = 1.15, hy = cy + .12 + Math.tan(alt) * sd, s = new THREE.Shape([[-.5, 0], [.5, 0], [.42, hy + .35], [-.4, hy + .3]].map(([a, b]) => new THREE.Vector2(a, b)));
  const hole = new THREE.Path(); hole.absarc(0, hy, .1, 0, Math.PI * 2, true); s.holes.push(hole); const g = new THREE.ExtrudeGeometry(s, { depth: .07, bevelEnabled: true, bevelThickness: .015, bevelSize: .015, bevelSegments: 1, curveSegments: 20 });
  g.translate(0, 0, -.035); put(g, 'rock', 0, 0, sd, 0, 0, 0, .5);
  return finish({ ring, hole: [0, +hy.toFixed(3), sd], stones: n, sunAlt: +(alt * 180 / Math.PI).toFixed(1) });
}

export function waylamp(o = {}, r = stream('waylamp')) {
  const { put, finish } = kit(), lit = o.lit !== false, s = .15, h = .24, y0 = o.hook ? 1.55 : 0;
  // the base, the four corner posts, the horn panes between them (one of them the door, hinged on a post, with the brass plate)
  put(new THREE.BoxGeometry(s + .03, .025, s + .03), 'iron', 0, y0 + .012, 0); put(new THREE.BoxGeometry(s + .03, .02, s + .03), 'iron', 0, y0 + h, 0);
  for (const [sx, sz] of [[1, 1], [1, -1], [-1, 1], [-1, -1]]) put(new THREE.BoxGeometry(.012, h, .012), 'iron', sx * s / 2, y0 + h / 2, sz * s / 2);
  for (let f = 0; f < 4; f++) { const a = f * Math.PI / 2; put(new THREE.PlaneGeometry(s - .01, h - .03), lit ? 'hornLit' : 'horn', Math.sin(a) * s / 2, y0 + h / 2, Math.cos(a) * s / 2, 0, a); put(new THREE.BoxGeometry(s, .008, .008), 'iron', Math.sin(a) * (s / 2 + .004), y0 + h * .5, Math.cos(a) * (s / 2 + .004), 0, a); }
  // the brass plate on the door: a disc with the hearth's mark (three bars under a flame), raised a little
  put(new THREE.CylinderGeometry(.03, .03, .004, 16).rotateX(Math.PI / 2), 'brass', 0, y0 + h * .72, s / 2 + .006);
  for (let i = 0; i < 3; i++) put(new THREE.BoxGeometry(.03 - i * .006, .003, .003), 'iron', 0, y0 + h * .72 - .012 + i * .007, s / 2 + .009);
  // the cap: a pierced cone (a ring of dark vents), a knob, a ring to carry it by
  put(new THREE.ConeGeometry(s * .74, .09, 4, 1).rotateY(Math.PI / 4), 'iron', 0, y0 + h + .055, 0);
  for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2; put(new THREE.CircleGeometry(.006, 6), 'dark', Math.sin(a) * s * .38, y0 + h + .04, Math.cos(a) * s * .38, -.6, a); }
  put(new THREE.SphereGeometry(.012, 8, 6), 'iron', 0, y0 + h + .105, 0); const handle = [0, +(y0 + h + .15).toFixed(3), 0]; put(new THREE.TorusGeometry(.035, .006, 6, 18), 'iron', 0, y0 + h + .15, 0);
  // the candle and, lit, its flame
  put(new THREE.CylinderGeometry(.018, .02, .09, 10), 'horn', 0, y0 + .07, 0);
  if (lit) put(new THREE.SphereGeometry(.014, 10, 8).scale(1, 2.1, 1), 'flame', 0, y0 + .14, 0);
  // the inn's bracket and a stub of its wall, if it hangs
  if (o.hook) { put(rough(new THREE.BoxGeometry(1.2, 2.4, .5, 4, 8, 2), r, .02, 3), 'rock', 0, 1.2, -.42, 0, 0, 0, .5); put(new THREE.BoxGeometry(.03, .03, .36), 'iron', 0, y0 + h + .215, -.12); put(new THREE.BoxGeometry(.03, .26, .03), 'iron', 0, y0 + h + .1, -.24, -.7);
    put(new THREE.TorusGeometry(.022, .005, 6, 12), 'iron', 0, y0 + h + .19, 0, 0, Math.PI / 2); }
  return finish({ handle, lit, height: +(h + .185).toFixed(3) });
}

export function tidalWreck(o = {}, r = stream('wreck')) {
  const { put, finish } = kit(), HW = 2.4, rockTop = .4 + r() * .1, L = 10, heel = .45, pitch = .04 + r() * .03, ry = (r() - .5) * .3;
  // the skerry: a long flat rock awash at the ebb, ledges and boulders round it, dark and wet to well above its top, weed in its hollows
  { const g = new THREE.SphereGeometry(1, 48, 20); g.scale(8, 2.2, 5); rough(g, r, .28, .55); const P = g.attributes.position;
    /* a wave-cut top: above 0.6 the dome is pressed nearly flat, so its crown is 0.84 and the shelf round it shelves off gently */
    for (let i = 0; i < P.count; i++) { const y = P.getY(i); if (y > .6) P.setY(i, .6 + (y - .6) * .15); } g.computeVertexNormals(); put(g, 'wetRock', 0, rockTop - .84, .4, 0, ry * .5, 0, .35); }
  for (let i = 0; i < 9; i++) { const s = .4 + r() * .9, a = r() * 6.28, d = 5.5 + r() * 3; put(rough(new THREE.IcosahedronGeometry(s, 3), r, s * .22, 1.6), 'wetRock', Math.cos(a) * d * 1.3, rockTop - s * .75 + r() * .25, Math.sin(a) * d * .8, r(), r() * 6, 0, .4); }
  for (let i = 0; i < 26; i++) { const g = rough(new THREE.SphereGeometry(.3 + r() * .35, 12, 6), r, .14, 4); g.scale(1.5, .1, 1); const a = r() * 6.28, d = 2 + r() * 5; put(g, 'weed', Math.cos(a) * d * 1.3, rockTop - .06 - (d > 5 ? (d - 5) * .25 : 0), Math.sin(a) * d * .75 + .4, 0, r() * 6); }
  // the hull's frame: x along the keel, y up from it, z across; heeled onto +z (the low side), the bow (+x) a little up
  const HM = new THREE.Matrix4().compose(new THREE.Vector3(0, rockTop - .06, .3), new THREE.Quaternion().setFromEuler(new THREE.Euler(heel, ry, pitch, 'YXZ')), new THREE.Vector3(1, 1, 1));
  const hp = (geo, key) => { geo.applyMatrix4(HM); put(geo, key); }, at = (x, y, z) => new THREE.Vector3(x, y, z).applyMatrix4(HM);
  const half = x => 1.9 * Math.sqrt(Math.max(0, 1 - (x / (L * .56)) ** 2)), depth = x => 1.55 + .25 * (x / (L / 2)) ** 2;
  const sec = (x, th) => new THREE.Vector3(x, depth(x) * (1 - Math.cos(th)) ** .85, half(x) * Math.sin(th));
  // the keel, and the stem and stern posts broken low
  hp(new THREE.BoxGeometry(L, .2, .18).translate(0, .08, 0), 'wetWood');
  for (const e of [1, -1]) { const c = new THREE.CatmullRomCurve3([new THREE.Vector3(e * L / 2, .08, 0), new THREE.Vector3(e * (L / 2 + .45), .5, 0), new THREE.Vector3(e * (L / 2 + .6), .75 + r() * .2, 0)]); hp(new THREE.TubeGeometry(c, 6, .1, 5), 'wetWood'); }
  // the frames: pairs of ribs; the low side's run to the gunwale, the high side's are broken off between a third and five-sixths up
  const NF = 13, fx = i => -L / 2 + .55 + i * (L - 1.1) / (NF - 1), tops = [];
  for (let i = 0; i < NF; i++) { const x = fx(i), lowT = 1, highT = .3 + r() * .45; tops.push(highT);
    for (const [sgn, tm] of [[1, lowT], [-1, highT]]) { if (sgn < 0 && r() < .12) continue; const pts = []; for (let k = 0; k <= 6; k++) pts.push(sec(x, sgn * tm * Math.PI / 2 * k / 6));
      hp(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 8, .07, 5), 'wetWood'); } }
  // the planking: strakes between the frames, the low side's mostly whole (one plank in five gone), the high side's only near the keel
  const strake = (th0, th1, x0, x1) => { const a = sec(x0, th0), b = sec(x1, th0), c = sec(x0, th1), d = sec(x1, th1), mid = a.clone().add(b).add(c).add(d).multiplyScalar(.25);
    const u = b.clone().sub(a), v = c.clone().sub(a), n = u.clone().cross(v).normalize(), len = u.length() + .06, w = v.length() * .92;
    const g = new THREE.BoxGeometry(len, w, .045), m = new THREE.Matrix4().makeBasis(u.clone().normalize(), v.clone().normalize().sub(u.clone().normalize().multiplyScalar(v.clone().normalize().dot(u.clone().normalize()))).normalize(), n);
    g.applyMatrix4(m); g.translate(mid.x, mid.y, mid.z); hp(g, 'wetWood'); };
  const NS = 7; for (let s = 0; s < NS; s++) { const t0 = s / NS * Math.PI / 2, t1 = (s + 1) / NS * Math.PI / 2;
    for (let i = 0; i < NF - 1; i++) { if (r() > .2) strake(t0, t1, fx(i), fx(i + 1)); if (s < 2 && r() > .35) strake(-t1, -t0, fx(i), fx(i + 1)); } }
  // the mast: a stump stepped amidships, broken off at 7 m, the only thing out of the sea at high water; a shroud's rag of rope
  const mx = .6, mastTop = at(mx, 7.1, 0); hp(new THREE.CylinderGeometry(.11, .17, 7, 8).translate(mx, 3.55, 0), 'spar');
  { const g = new THREE.CylinderGeometry(.11, .11, .28, 8, 1, false, 0, Math.PI * 1.2); g.translate(mx, 7.1, 0); hp(g, 'spar'); }
  // the last deck beam aft, from the low side's gunwale to a high-side rib that still reaches it; the bell hangs from its middle
  const bx = fx(2), bth = Math.acos(1 - .64 ** (1 / .85)), beamA = sec(bx, bth), beamB = sec(bx, -bth); /* the beam at 0.64 of the depth: its high end stays under high water */
  { const c = new THREE.CatmullRomCurve3([sec(bx, -Math.PI / 2 * .4), sec(bx, -bth * .85), beamB]); hp(new THREE.TubeGeometry(c, 5, .075, 5), 'wetWood'); }
  const bq = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), beamA.clone().sub(beamB).normalize()), bmid = beamA.clone().add(beamB).multiplyScalar(.5);
  { const g = new THREE.BoxGeometry(.16, .16, beamA.distanceTo(beamB) + .1); g.applyQuaternion(bq); g.translate(bmid.x, bmid.y, bmid.z); hp(g, 'wetWood'); }
  const hp7 = beamA.clone().lerp(beamB, .72), hang = at(hp7.x, hp7.y - .08, hp7.z), /* hung toward the beam's high end, at a standing person's chest */ wq = new THREE.Quaternion().setFromRotationMatrix(HM).multiply(bq);
  // weed hanging off the frames, the beam and the gunwale, everything below high water
  for (let i = 0; i < 70; i++) { const fi = Math.floor(r() * NF), side = r() < .5 ? 1 : -1, t = side > 0 ? r() : r() * tops[fi], p = at(...sec(fx(fi), side * t * Math.PI / 2).toArray());
    if (p.y > HW - .15) continue; const len = .15 + r() * .4; put(new THREE.PlaneGeometry(.05 + r() * .06, len).translate(0, -len / 2, 0), 'weed', p.x, p.y, p.z, (r() - .5) * .3, r() * 6.28); }
  for (let i = 0; i < 6; i++) { const len = .2 + r() * .3; put(new THREE.PlaneGeometry(.06, len).translate(0, -len / 2, 0), 'weed', hang.x + (r() - .5) * .3, hang.y - .02, hang.z + (r() - .5) * 1.2, 0, r() * 6.28); }
  // the bell: a ship's bell of bronze gone green, hung plumb from the beam on an iron strap, a clapper inside; or, taken, the ring
  // of bright wood round the beam where the strap was
  const BH = .45, strap = .1, bell = hang.clone().add(new THREE.Vector3(0, -strap - BH / 2, 0));
  if (!o.taken) { const prof = [[0, .41], [.07, .405], [.095, .34], [.115, .2], [.15, .07], [.18, .015], [.19, 0], [.215, 0], [.222, .03], [.19, .08], [.15, .2], [.128, .33], [.115, .41], [.085, .44], [0, .45]].map(([a, b]) => new THREE.Vector2(a, b));
    const g = new THREE.LatheGeometry(prof, 24); put(g, 'bronze', bell.x, bell.y - BH / 2, bell.z);
    put(new THREE.TorusGeometry(.045, .014, 6, 14), 'bronze', hang.x, hang.y - strap + .02, hang.z); put(new THREE.BoxGeometry(.035, strap + .08, .02), 'iron', hang.x, hang.y - strap / 2 + .02, hang.z);
    put(new THREE.CylinderGeometry(.012, .012, .3, 6), 'iron', bell.x, bell.y - .02, bell.z); put(new THREE.SphereGeometry(.04, 8, 6), 'iron', bell.x, bell.y - .17, bell.z); }
  else { const g = new THREE.CylinderGeometry(.098, .098, .05, 12, 1, true).rotateX(Math.PI / 2); g.applyQuaternion(wq); g.translate(hang.x, hang.y + .08, hang.z); put(g, 'scar'); }
  // where a person stands to reach it: on the low side's planking inside the hull, a metre aft of the beam's line
  const sx = bx + .9, st = Math.asin(Math.min(1, .9 / half(sx))), stand = at(...sec(sx, st).toArray()).add(new THREE.Vector3(0, .05, 0));
  return finish({ HW, rockTop: +rockTop.toFixed(2), bell: bell.toArray().map(v => +v.toFixed(3)), stand: stand.toArray().map(v => +v.toFixed(3)), mastTop: +mastTop.y.toFixed(2), taken: !!o.taken });
}

export function beastDen(o = {}, r = stream('den')) {
  const { put, finish } = kit(), RX = 5.2, RZ = 4.6, RY = 4.6, ML = o.master?.len ?? 2.6, MW = o.master?.wid ?? 1.4, nz = -RZ + 2.4 + r() * .2, nx = (r() - .5) * .8, rot = (r() - .5) * .3;
  // the chamber: a dome pushed about by noise, its triangles cut away where the mouth (+z, low) and the roof's crack open
  const crack = new THREE.Vector3(nx * .5 + .6, 1, nz * .4).normalize(), mouth = new THREE.Vector3(0, .12, 1).normalize();
  { const g = rough(new THREE.SphereGeometry(1, 64, 32, 0, Math.PI * 2, 0, Math.PI * .56), r, .1, 3.2).toNonIndexed(), P = g.attributes.position, keep = [];
    for (let i = 0; i < P.count; i += 3) { const c = new THREE.Vector3(); for (let k = 0; k < 3; k++) c.add(new THREE.Vector3().fromBufferAttribute(P, i + k)); c.normalize();
      if (c.dot(mouth) > .93 || c.dot(crack) > .995) continue; for (const k of [0, 2, 1]) keep.push(P.getX(i + k) * RX, P.getY(i + k) * RY - .25, P.getZ(i + k) * RZ); } /* wound backwards, so it faces in */
    const d = new THREE.BufferGeometry(); d.setAttribute('position', new THREE.Float32BufferAttribute(keep, 3)); d.computeVertexNormals(); put(d, 'cave', 0, 0, 0, 0, 0, 0, .4); }
  // the mouth's tunnel, 2.2 m wide and 2.4 high, running out toward +z
  { const g = rough(new THREE.CylinderGeometry(1.25, 1.35, 5, 18, 6, true), r, .1, 2); g.rotateX(Math.PI / 2); g.scale(-1, 1.05, 1); g.computeVertexNormals(); /* mirrored, so it faces in */ put(g, 'cave', 0, 1.1, RZ + 1.6, 0, 0, 0, .4); }
  // the floor: a rough disc, levelled where you walk; nestY is the nest's surface over it
  { const g = new THREE.RingGeometry(.001, 1, 48, 14); g.rotateX(-Math.PI / 2); g.scale(RX * 1.02, 1, RZ * 1.02); /* rings, not a fan, so the floor can take its shape */ const P = g.attributes.position;
    for (let i = 0; i < P.count; i++) { const x = P.getX(i), z = P.getZ(i), e = Math.hypot(x / RX, z / RZ); P.setY(i, .05 * Math.sin(x * 1.7 + z) * Math.sin(z * 1.3) + .4 * Math.max(0, e - .82) ** 1.5); }
    g.computeVertexNormals(); put(g, 'cave', 0, 0, 0, 0, 0, 0, .4); }
  const nestR = Math.max(ML, MW) / 2 + .55, nestY = (x, z) => { const d = Math.hypot((x - nx) / 1.0, (z - nz) / .8); return d > nestR + .4 ? 0 : d > nestR ? .32 * (1 - (d - nestR) / .4) : .12 + .2 * (d / nestR) ** 4; };
  // the nest: bracken heaped in a ring against the back wall, the hollow lined; strands of it scattered
  { const g = new THREE.RingGeometry(.001, 1, 40, 16).toNonIndexed(); g.rotateX(-Math.PI / 2); g.scale(nestR + .4, 1, (nestR + .4) * .8); const P = g.attributes.position;
    for (let i = 0; i < P.count; i++) { const x = P.getX(i) + nx, z = P.getZ(i) + nz; P.setY(i, nestY(x, z) + .02 * Math.sin(x * 9) * Math.sin(z * 11)); }
    /* the hollow is bare stone, scraped ("it lays its head down on the bare stone", the draft); the bracken is heaped round its rim */
    const part = inner => { const out = []; for (let i = 0; i < P.count; i += 3) { let d = 0; for (let k = 0; k < 3; k++) d += Math.hypot(P.getX(i + k), P.getZ(i + k) / .8) / 3; if ((d < nestR * .8) === inner) for (let k = 0; k < 3; k++) out.push(P.getX(i + k), P.getY(i + k), P.getZ(i + k)); }
      const h = new THREE.BufferGeometry(); h.setAttribute('position', new THREE.Float32BufferAttribute(out, 3)); h.computeVertexNormals(); return h; };
    put(part(true), 'cave', nx, 0, nz, 0, 0, 0, .4); put(part(false), 'bracken', nx, 0, nz, 0, 0, 0, .3); g.dispose(); }
  for (let i = 0; i < 220; i++) { const a = r() * 6.28, d = nestR * (.8 + r() * .5), x = nx + Math.cos(a) * d, z = nz + Math.sin(a) * d * .8, len = .2 + r() * .35;
    put(new THREE.BoxGeometry(len, .008, .014), 'bracken', x, nestY(x, z) + .02, z, (r() - .5) * .4, a + Math.PI / 2 + (r() - .5) * .8, (r() - .5) * .3); }
  // bones: long bones, a rack of ribs, a skull, a stag's antler, nearer the mouth than the nest
  for (let i = 0; i < 7; i++) { const a = r() * 6.28, d = 1.5 + r() * 2.2, x = nx + Math.cos(a) * d, z = Math.min(RZ - 1, nz + 1.4 + Math.abs(Math.sin(a)) * d * .6), len = .3 + r() * .25; if (Math.abs(x) < .8 && z > nz + 2.2) continue;
    const ay = r() * 6.28; put(new THREE.CylinderGeometry(.022, .026, len, 6).rotateZ(Math.PI / 2), 'bone', x, .04, z, 0, ay); for (const e of [-1, 1]) put(new THREE.SphereGeometry(.03, 6, 5).scale(1, .8, 1.3), 'bone', x + e * Math.cos(ay) * len / 2, .04, z - e * Math.sin(ay) * len / 2); }
  { const x = nx - 1.9, z = nz + 1.6; for (let k = 0; k < 6; k++) put(new THREE.TorusGeometry(.26 - k * .015, .012, 4, 10, Math.PI * .9), 'bone', x + k * .08, .02, z, 0, .3, 0); put(new THREE.CylinderGeometry(.03, .03, .5, 6).rotateZ(Math.PI / 2), 'bone', x + .2, .03, z, 0, .3); }
  { const x = nx + 2.1, z = nz + 1.2, sk = new THREE.SphereGeometry(.12, 10, 8); sk.scale(1, .8, 1.4); put(sk, 'bone', x, .09, z, 0, 1.1); put(new THREE.SphereGeometry(.03, 6, 4), 'dark', x + .05, .12, z - .1); put(new THREE.SphereGeometry(.03, 6, 4), 'dark', x - .05, .12, z - .1); }
  { const c = new THREE.CatmullRomCurve3([[0, 0, 0], [.15, .06, .3], [.12, .12, .62], [.2, .14, .8]].map(v => new THREE.Vector3(...v))); put(new THREE.TubeGeometry(c, 8, .022, 5), 'bone', nx - .6, .03, nz + nestR + .9, 0, -.7);
    put(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([[0, 0, 0], [-.18, .08, .1], [-.26, .12, .05]].map(v => new THREE.Vector3(...v))), 5, .016, 5), 'bone', nx - .6 + .03, .06, nz + nestR + .9 + .25, 0, -.7); }
  // the cloak: a mantle (a half-disc of 1.35 m, its straight edge the neck with a dark fur collar and a bronze clasp) spread in the
  // nest under where the master lies, folds pushed into it, its hem curving out past the master toward the mouth
  const CR = 1.35, cz0 = nz - .15, ph1 = r() * 6, folds = (x, z) => .035 * Math.sin(x * 5.3 + ph1) * Math.cos(z * 3.1) + .02 * Math.sin((x + z) * 8.7);
  let hem = -9;
  { const g = new THREE.CircleGeometry(CR, 40, Math.PI, Math.PI); g.rotateX(-Math.PI / 2); /* face up, the curved hem toward +z */ const ng = g.toNonIndexed(), P = ng.attributes.position;
    for (let i = 0; i < P.count; i++) { const lx = P.getX(i), lz = P.getZ(i), x = nx + lx * Math.cos(rot) + lz * Math.sin(rot), z = cz0 - lx * Math.sin(rot) + lz * Math.cos(rot); hem = Math.max(hem, z);
      P.setXYZ(i, x, nestY(x, z) + .08 + folds(x, z), z); }
    ng.computeVertexNormals(); put(ng, 'fur'); }
  { const g = new THREE.CylinderGeometry(.06, .06, CR * 2, 12, 1).rotateZ(Math.PI / 2); const P = g.attributes.position; for (let i = 0; i < P.count; i++) { const x = nx + P.getX(i) * Math.cos(rot), z = cz0 - P.getX(i) * Math.sin(rot) + P.getZ(i); P.setXYZ(i, x, P.getY(i) * .6 + nestY(x, z) + .1, z); } put(g, 'furDark'); }
  put(new THREE.CylinderGeometry(.045, .045, .015, 14), 'bronze', nx, nestY(nx, cz0) + .15, cz0);
  // the hem: a roll of paler wolf fur round the curve, the part that shows past the sleeper
  { const pts = []; for (let k = 0; k <= 32; k++) { const a = Math.PI + k / 32 * Math.PI, lx = Math.cos(a) * CR, lz = -Math.sin(a) * CR, x = nx + lx * Math.cos(rot) + lz * Math.sin(rot), z = cz0 - lx * Math.sin(rot) + lz * Math.cos(rot); pts.push(new THREE.Vector3(x, nestY(x, z) + .09 + folds(x, z), z)); }
    const g = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 48, .045, 6); g.scale(1, .7, 1); put(g, 'furPale'); }
  // the master's place: an ellipse of ML by MW on the cloak, its long side to the mouth; drawn as a ghost when o.ghost
  const mz = cz0 + MW / 2 - .6; /* most of it on the mantle, the hem 0.6 m out in front of it */ if (o.ghost !== false) { const g = new THREE.SphereGeometry(1, 20, 12); g.scale(ML / 2, .45, MW / 2); put(g, 'ghost', nx, nestY(nx, mz) + .4, mz, 0, -rot); }
  return finish({ nest: [+nx.toFixed(3), +nestY(nx, nz).toFixed(3), +nz.toFixed(3)], master: { x: +nx.toFixed(3), z: +mz.toFixed(3), len: ML, wid: MW, rot: +rot.toFixed(3) }, hem: +hem.toFixed(3), mouthZ: +(RZ + 4.1).toFixed(2), crack: [+(crack.x * RX).toFixed(2), +(crack.y * RY - .25).toFixed(2), +(crack.z * RZ).toFixed(2)], RY });
}

// the gate's script: amber strokes on black, drawn on a canvas from the prop's stream (the gate slice's glyph columns, simplified)
function scriptTex(r, col = '#ffb048') { const c = document.createElement('canvas'); c.width = 64; c.height = 512; const x = c.getContext('2d'); x.fillStyle = '#000'; x.fillRect(0, 0, 64, 512);
  x.strokeStyle = col; x.lineWidth = 4.5; x.lineCap = 'round'; for (let y = 10; y < 500; y += 22 + r() * 8) { x.beginPath(); const n = 2 + Math.floor(r() * 3);
    for (let k = 0; k < n; k++) { const a = 14 + r() * 36, b = y + r() * 16; k ? x.lineTo(a, b) : x.moveTo(a, b); } x.stroke(); if (r() < .4) { x.beginPath(); x.arc(32, y + 8, 4 + r() * 4, 0, 6.3); x.stroke(); } }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapT = THREE.RepeatWrapping; return t; }
export function shuttleRoom(o = {}, r = stream('shuttle')) {
  const { put, finish } = kit(), M = mats(), SP = 10, RISE = 9, SPRING = 4.2, L = 14, T = .9, DW = 3.2, DH = 6;
  if (!M.script) M.script = new THREE.MeshStandardMaterial({ color: 0x000000, emissive: new THREE.Color(1, .66, .3), emissiveMap: scriptTex(stream('gate-script')), /* its own stream: the texture is made once, and must not move the prop's */ emissiveIntensity: 1.8, roughness: .7 });
  // the pointed arch: two arcs from the springing, struck from centres inside the span, so the crown is RISE up
  const arcR = h => { const half = SP / 2, a = h - SPRING; return (a * a + half * half) / SP; }, R = arcR(RISE), cx = SP / 2 - R;
  const archShape = (half, spring, rr, ccx, open) => { const pts = [[-half, 0], [-half, spring]], top = spring + Math.sqrt(rr * rr - ccx * ccx);
    for (let k = 1; k <= 16; k++) { const y = spring + (top - spring) * k / 16, x = ccx + Math.sqrt(Math.max(0, rr * rr - (y - spring) ** 2)); pts.push([-x, y]); }
    for (let k = 15; k >= 0; k--) { const y = spring + (top - spring) * k / 16, x = ccx + Math.sqrt(Math.max(0, rr * rr - (y - spring) ** 2)); pts.push([x, y]); } pts.push([half, 0]); return pts.map(([a, b]) => new THREE.Vector2(a, b)); };
  // the vault and its walls: the arch's ring T thick, extruded the room's length, so its inner face is the room
  { const outer = archShape(SP / 2 + T, SPRING, R + T, cx, 0), inner = archShape(SP / 2, SPRING, R, cx, 0), s = new THREE.Shape(outer); s.holes.push(new THREE.Path(inner.slice().reverse()));
    const g = new THREE.ExtrudeGeometry(s, { depth: L, bevelEnabled: false, curveSegments: 4 }); g.translate(0, 0, -L / 2); put(g, 'gateStone', 0, 0, 0, 0, 0, 0, .2); }
  // the end walls: the far one whole, the near one with the door, an arched slit
  const wallShape = () => new THREE.Shape(archShape(SP / 2 + .01, SPRING, R + .01, cx, 0));
  { const g = new THREE.ExtrudeGeometry(wallShape(), { depth: T, bevelEnabled: false }); put(g, 'gateStone', 0, 0, -L / 2 - T, 0, 0, 0, .2); }
  { const s = wallShape(), dR = (DW * DW / 4 + (DH - DH * .7) ** 2) / DW, dcx = DW / 2 - dR; s.holes.push(new THREE.Path(archShape(DW / 2, DH * .7, dR, dcx, 0).reverse()));
    const g = new THREE.ExtrudeGeometry(s, { depth: T, bevelEnabled: false, curveSegments: 4 }); put(g, 'gateStone', 0, 0, L / 2, 0, 0, 0, .2); }
  // the floor: dark slabs of 2.5 m, laid four across, with joints; wet patches are the material's low roughness
  const SL = 2.5, nX = 4, nZ = Math.ceil(L / SL), off = (SP - nX * SL) / 2; for (let i = 0; i < nX; i++) for (let k = 0; k < nZ; k++) { const w = SL - .03, d = Math.min(SL, L - k * SL) - .03;
    put(new THREE.BoxGeometry(w, .25, d), 'slab', -SP / 2 + off + i * SL + SL / 2, -.125 + (r() - .5) * .012, -L / 2 + k * SL + d / 2 + .015, (r() - .5) * .004, 0, (r() - .5) * .004, .5); }
  { const g = new THREE.BoxGeometry(SP, .2, L); put(g, 'gateStone', 0, -.2, 0); }
  // the piers: three pairs engaged in the walls, script up their faces to the springing
  for (let k = 0; k < 3; k++) { const z = -L / 2 + 2.5 + k * 4.5; for (const e of [-1, 1]) { put(new THREE.BoxGeometry(.8, SPRING + .6, 1.1), 'gateStone', e * (SP / 2 - .4), (SPRING + .6) / 2, z, 0, 0, 0, .2);
    put(new THREE.PlaneGeometry(.34, SPRING - .6).translate(0, (SPRING - .6) / 2 + .4, 0), 'script', e * (SP / 2 - .81), 0, z, 0, -e * Math.PI / 2, 0, null); } }
  // the unread sigil on the far wall: a ring of 2.4 m, its glyph disc, two columns of script beside it
  const sy = 3.4, sz = -L / 2 + .02; put(new THREE.TorusGeometry(1.2, .07, 8, 48), 'ring', 0, sy, sz + .05); put(new THREE.TorusGeometry(.82, .035, 6, 40), 'ring', 0, sy, sz + .04);
  for (let k = 0; k < 12; k++) { const a = k / 12 * Math.PI * 2; put(new THREE.BoxGeometry(.05, .26, .02), 'ring', Math.sin(a) * 1.0, sy + Math.cos(a) * 1.0, sz + .04, 0, 0, -a); }
  for (const e of [-1, 1]) put(new THREE.PlaneGeometry(.4, 4.6).translate(0, 2.7, 0), 'script', e * 2.0, 0, sz + .01, 0, 0, 0, null);
  // the Shuttle: on the floor under the sigil, a little askew; a lathe of pale wood pointed at both ends, flattened, its cavity, the pirn
  // in it and a thread end from its eye lying on the slab
  const shz = sz + 1.1 + r() * .2, shx = (r() - .5) * .3, sa = (r() - .5) * .9, SHL = .32; let thread = null;
  if (!o.taken) { const prof = []; for (let k = 0; k <= 16; k++) { const t = k / 16; prof.push(new THREE.Vector2(.028 * Math.sin(Math.PI * t) ** .55 + .001, (t - .5) * SHL)); }
    const g = new THREE.LatheGeometry(prof, 14); g.rotateZ(Math.PI / 2); g.scale(1, .72, 1); put(g, 'pale', shx, .028 * .72 + .002, shz, 0, sa);
    const cav = new THREE.CircleGeometry(1, 16); cav.scale(.07, .016, 1); cav.rotateX(-Math.PI / 2); put(cav, 'dark', shx, .028 * .72 * 2 - .004, shz, 0, sa);
    put(new THREE.CylinderGeometry(.008, .008, .12, 8).rotateZ(Math.PI / 2), 'thread', shx, .028 * .72 * 2 - .008, shz, 0, sa);
    const ex = shx + Math.cos(sa) * .02, ez = shz - Math.sin(sa) * .02, pts = [[0, .03, 0], [.04, .012, .05], [.02, .004, .14], [.09, .003, .22], [.06, .003, .3]].map(([a, b, c]) => new THREE.Vector3(ex + a, b, ez + c));
    put(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 16, .0016, 4), 'thread'); thread = pts[pts.length - 1].toArray().map(v => +v.toFixed(3)); }
  return finish({ sigil: [0, sy, +sz.toFixed(3)], shuttle: [+shx.toFixed(3), +(.028 * .72 * 2).toFixed(3), +shz.toFixed(3)], door: [0, 0, L / 2 + T], span: SP, crown: +(SPRING + Math.sqrt(R * R - cx * cx)).toFixed(2), len: L, doorW: DW, doorH: DH, slab: SL, thread, taken: !!o.taken });
}

// ── greatKnot (Session 1376) ──
const KNOT_GLOW = { tine: [1.0, .34, .10], uisce: [.30, .72, 1.0], cloch: [1.0, .66, .30], scath: [.70, .34, 1.0], solas: [1.0, .86, .52], gaoth: [.66, .92, 1.0] };
export function greatKnot(o = {}, r = stream('knot')) {
  const { put, finish } = kit(), M = mats(), school = KNOT_GLOW[o.school] ? o.school : 'cloch', state = o.state || 'untied', high = o.place === 'high', G = KNOT_GLOW[school];
  const kGlow = state === 'torn' ? .7 : state === 'sealed' ? 1.4 : 2.2, sk = 'kscript:' + school + ':' + state, tk = 'kthread:' + school + ':' + state;
  if (!M.kscriptTex) M.kscriptTex = scriptTex(stream('knot-script'), '#ffffff'); /* white, so the school's light colours it */
  if (!M[sk]) M[sk] = new THREE.MeshStandardMaterial({ color: 0x000000, emissive: new THREE.Color(...G), emissiveMap: M.kscriptTex, emissiveIntensity: kGlow * .8, roughness: .7 });
  if (!M[tk]) M[tk] = new THREE.MeshStandardMaterial({ color: new THREE.Color(...G).multiplyScalar(.2), emissive: new THREE.Color(...G), emissiveIntensity: kGlow, roughness: .5 });
  const kk = 'kknot:' + school + ':' + state; if (!M[kk]) M[kk] = new THREE.MeshStandardMaterial({ color: new THREE.Color(...G).multiplyScalar(.35), emissive: new THREE.Color(...G), emissiveIntensity: state === 'sealed' ? .35 : .55, roughness: .55 });
  if (!M.kvoid) M.kvoid = new THREE.MeshBasicMaterial({ color: 0x020203 });
  if (!M.kbound) M.kbound = new THREE.MeshStandardMaterial({ color: 0xe8e0cc, emissive: new THREE.Color(1, .94, .82), emissiveIntensity: 1.6, roughness: .6 });
  // the ring: 40 voussoirs on the chamber's floor (y -0.4), its centre RO - 1.2 up so the foot sits 1.2 m in a socket of the floor
  const RO = 16, RI = 12.4, D = 3, Zr = -7.6, FL = -.4, Cy = FL + RO - 1.2, N = 40, gap = .006;
  for (let i = 0; i < N; i++) { const a0 = i / N * Math.PI * 2 + gap, a1 = (i + 1) / N * Math.PI * 2 - gap, am = (a0 + a1) / 2;
    if (Cy + Math.cos(am) * (RO + RI) / 2 < FL - .6) continue;
    const j = (r() - .5) * .08, pt = (rr, a) => new THREE.Vector2(Math.sin(a) * rr, Math.cos(a) * rr), sh = new THREE.Shape([pt(RI + j, a0), pt(RI + j, a1), pt(RO + j, a1), pt(RO + j, a0)]);
    const g = new THREE.ExtrudeGeometry(sh, { depth: D + (r() - .5) * .12, bevelEnabled: false }); g.translate(0, 0, -D / 2); put(g, 'gateStone', 0, Cy, Zr, 0, 0, 0, .25);
    // the script round the face, read along the ring, and up the soffit
    const mid = (RO + RI) / 2, arc = (a1 - a0) * mid; put(new THREE.PlaneGeometry(.9, arc * .96).rotateZ(Math.PI / 2), sk, Math.sin(am) * mid, Cy + Math.cos(am) * mid, Zr + D / 2 + .03, 0, 0, -am, null);
    const so = new THREE.PlaneGeometry(1.6, (a1 - a0) * RI * .96); so.rotateZ(Math.PI / 2); so.rotateX(Math.PI / 2); put(so, sk, Math.sin(am) * (RI - .02), Cy + Math.cos(am) * (RI - .02), Zr, 0, 0, -am, null); }
  // the socket: dressed stones about the ring's foot on the chamber's floor
  for (const e of [-1, 1]) put(new THREE.BoxGeometry(5.5, 1.6, D + 1.6), 'gateStone', e * 4.2, FL + .8 - .2, Zr, 0, 0, 0, .3);
  // the dark at its heart
  put(new THREE.CircleGeometry(RI + .05, 64), 'kvoid', 0, Cy, Zr);
  // the knot: over the dais's middle within reach (low), or at the ring's heart (high)
  const K = high ? new THREE.Vector3(0, Cy, Zr + .4) : new THREE.Vector3(0, 2.1, -1.2), threads = [], NT = 11;
  const tube = (pts, rad, key, seg = 48, rs = 5) => { const c = new THREE.CatmullRomCurve3(pts), g = new THREE.TubeGeometry(c, seg, rad, rs), uv = g.attributes.uv, L = c.getLength();
    for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getY(i), uv.getX(i) * L * 1.5); put(g, key, 0, 0, 0, 0, 0, 0, null); return L; };
  const knotR = state === 'sealed' ? .24 : .3, ends = [];
  for (let i = 0; i < NT; i++) { const th = (i + .5) / NT * Math.PI * 2 + (r() - .5) * .2, S = new THREE.Vector3(Math.sin(th) * (RI - .1), Cy + Math.cos(th) * (RI - .1), Zr + (r() - .5) * 1.4);
    const side = Math.sin(th) >= 0 ? 1 : -1, toward = K.clone().add(new THREE.Vector3(Math.sin(th) * knotR, Math.cos(th) * knotR * .8, 0));
    let pts;
    if (high) pts = [S, S.clone().lerp(K, .35).add(new THREE.Vector3(0, -.6, .3)), S.clone().lerp(K, .75).add(new THREE.Vector3(0, -.3, .4)), toward];
    else { const mid = new THREE.Vector3(S.x * .35, Math.max(K.y + 3, S.y * .55 + K.y * .45), (Zr + K.z) / 2 + .6);
      pts = [S, S.clone().lerp(mid, .5).add(new THREE.Vector3(0, -1.2, .4)), mid, mid.clone().lerp(toward, .6).add(new THREE.Vector3(0, .4, 0)), toward]; }
    if (state === 'torn' && !high) { // cut: each thread comes down short of the knot and its end hangs, the two sides apart
      const last = pts.pop(), endAt = K.clone().add(new THREE.Vector3(side * (.35 + r() * .25), -.55 - r() * .6, (r() - .5) * .3));
      pts.push(last.clone().lerp(pts[pts.length - 1], .3).add(new THREE.Vector3(side * .25, .1, 0)), endAt); ends.push(endAt); }
    threads.push(+tube(pts, .035, tk).toFixed(2)); }
  // the knot itself
  const knotAt = (k, rad, tubeR, p, q) => { const g = new THREE.TorusKnotGeometry(rad, tubeR, 160, 8, p, q); g.rotateY(r() * .6); put(g, kk, k.x, k.y, k.z); };
  if (state !== 'torn') { knotAt(K, knotR, .06, 2, 3); knotAt(K, knotR * .72, .045, 3, 4);
    if (state === 'sealed') { const hp = []; for (let k = 0; k <= 160; k++) { const t = k / 160, a = t * Math.PI * 2 * 9; hp.push(new THREE.Vector3(K.x + Math.cos(a) * (knotR + .08), K.y + (t - .5) * .2, K.z + Math.sin(a) * (knotR + .08))); }
      tube(hp, .014, 'kbound', 320, 4); } }
  else if (high) { // cut at the heart: the knot's two halves pulled apart in the dark
    for (const e of [-1, 1]) { const g = new THREE.TorusGeometry(knotR * .8, .05, 6, 40, Math.PI * 1.3); g.rotateZ(e > 0 ? .3 : Math.PI + .3); put(g, tk, K.x + e * .9, K.y - .3, K.z); } }
  else for (const e of ends) for (let f = 0; f < 3; f++) tube([e, e.clone().add(new THREE.Vector3((r() - .5) * .12, -.08 - r() * .1, (r() - .5) * .12))], .01, tk, 3, 3);
  // high: one cord down to a stone on the dais, where you stand to act
  let stone = null;
  if (high) { const st = new THREE.Vector3(0, 0, -1.2); put(rough(new THREE.BoxGeometry(.9, 1.1, .9, 3, 3, 3), r, .05), 'gateStone', st.x, .55, st.z, 0, r(), 0, .4); stone = [0, 1.1, -1.2];
    const top = new THREE.Vector3(0, 1.12, -1.2);
    if (state === 'torn') { tube([K.clone().add(new THREE.Vector3(0, -.3, 0)), K.clone().add(new THREE.Vector3(.2, -3, .3)), K.clone().add(new THREE.Vector3(.1, -5.5, .2))], .04, tk, 24); tube([top, top.clone().add(new THREE.Vector3(.1, .9, 0)), top.clone().add(new THREE.Vector3(.4, .5, .3))], .04, tk, 12); }
    else tube([K.clone().add(new THREE.Vector3(0, -.3, 0)), K.clone().lerp(top, .5).add(new THREE.Vector3(0, 0, .8)), top], .04, tk, 64); }
  return finish({ knot: K.toArray().map(v => +v.toFixed(2)), ring: { top: +(Cy + RO).toFixed(2), centre: [0, +Cy.toFixed(2), Zr], RO, RI, depth: D }, threads, ends: ends.length, stone, state, place: high ? 'high' : 'low', school });
}
