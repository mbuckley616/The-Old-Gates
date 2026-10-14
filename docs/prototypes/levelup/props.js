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
    hornLit: new THREE.MeshStandardMaterial({ color: 0xd8a860, emissive: new THREE.Color(1, .62, .28), emissiveIntensity: 1.6, roughness: .5, transparent: true, opacity: .9 }), flame: new THREE.MeshStandardMaterial({ color: 0xffd090, emissive: new THREE.Color(1, .75, .4), emissiveIntensity: 4 }), brass: new THREE.MeshStandardMaterial({ color: 0xb08a3e, roughness: .4, metalness: .7 }), dark: new THREE.MeshStandardMaterial({ color: 0x0d0b09, roughness: 1 }) };
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
