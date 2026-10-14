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
    ghost: new THREE.MeshStandardMaterial({ color: 0x6a7480, roughness: 1, transparent: true, opacity: .14, depthWrite: false }) };
  return PM;
}
// a rough stone: a subdivided box (or ball) pushed about by smooth noise from the prop's stream, so the same key makes the same stone
function rough(geo, r, amp, f = 1.6) { const P = geo.attributes.position, ph = [r() * 9, r() * 9, r() * 9], v = new THREE.Vector3();
  for (let i = 0; i < P.count; i++) { v.fromBufferAttribute(P, i); const n = Math.sin(v.x * f + ph[0]) * Math.sin(v.y * f * 1.3 + ph[1]) * Math.sin(v.z * f + ph[2]) + .5 * Math.sin(v.x * f * 2.7 + ph[1]) * Math.sin(v.z * f * 2.3 + ph[0]);
    const len = v.length() || 1; v.addScaledVector(v.clone().divideScalar(len), n * amp); P.setXYZ(i, v.x, v.y, v.z); }
  geo.computeVertexNormals(); return geo; }
function kit() { const M = mats(), B = new Map();
  const put = (geo, key, x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0, uv = .6) => { const g = geo.index ? geo.toNonIndexed() : geo; for (const k of Object.keys(g.attributes)) if (!['position', 'normal'].includes(k)) g.deleteAttribute(k);
    g.applyMatrix4(new THREE.Matrix4().compose(new THREE.Vector3(x, y, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(rx, ry, rz, 'YXZ')), new THREE.Vector3(1, 1, 1))); worldUV(g, uv);
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
