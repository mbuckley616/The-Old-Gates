// What a gate keeps (the concept artist, 3 Nov 2026; backlog L10, "What a gate keeps"; OG-123's first two panels): where a gate's prize
// lies and what lies round it, in the gate kit's own stone (gatekit.js) so a vault and a gate are one stone. A metre a unit, the floor at y 0.
//
// greatVault: a great gate's central vault (OG-123: "two hooded statues either side of a turning armillary ring over the prize, several
//   paths to it"). A round hall: eight of the kit's pointed arches between eight piers on a circle 48 m across, an ambulatory behind them to
//   a wall 62 m across, a dome to 51 m. The floor is a ring 9 m wide round a pit 30 m across and 30 m deep; at its heart an island 14 m
//   across with a dais of three steps, and over the dais an armillary of four rings of the kit's stone (a fixed meridian 12.8 m across and
//   three that turn, 10.8, 8.6 and 6.4 m), the script cut round each face, a shard of the gate's core (1.9 m) burning at their heart.
//   Three of the kit's bridges reach the island, one whole, one cracked and one broken (its stones afloat): the several paths.
//   Two hooded statues of 13 m on plinths flank the far side, each with a sword point-down before it. A script-sealed cache in the
//   ambulatory wall (the kit's panel at 0.6). Cloch's amber by default.
// lesserKeep: a lesser gate's last room (OG-123: "a sealed chest on a dais under a shaft of light"): props.js's shuttleRoom (10 m span,
//   9 m to the crown, 14 m long, the unread sigil on the end wall) with the Shuttle taken; an eye in the crown lets down one shaft of
//   light onto a dais of three steps, and on it the gate's coffer, a chest of the gate's stone 1.5 by 0.8 by 0.9 m, bronze-strapped,
//   sealed by a band of script round its lid and a ring sigil on it. A vein of the gate's crystal breaks out of the corner of the end
//   wall, and a script-sealed cache (the kit's panel at 0.45) stands in the side wall.
//
// The question is how much a gate keeps (V_MODES); the rooms are the same in every mode, a mode changes only what lies in them:
//   'relics' (A)  the gate's own things only: the core shard, the coffer, the sigil, the cache, the crystal; no coin.
//   'hoard'  (B)  OG-123 as drawn: coin heaped under the rings and round the dais, chests open and spilling, gold cups and plate, star-metal
//                 ingots, a crown on the heap.
//   'left'   (C)  A, and what the delvers who came before brought in and never took out: one sits dead against the dais with his pack,
//                 his journal open, his lantern out, his purse split; a camp at the door (a bedroll, a cold fire, a rope). A little coin,
//                 theirs, not the gate's.
// greatVault(o) / lesserKeep(o) with o = { mode, school, t } -> { group, tris, draws, lights: [Light], tick(tSeconds), stand: { x, y, z, ry }
//   (where a person stands for the scale), view: { door, dais, close, high, scale } (cameras [x, y, z, tx, ty, tz]), counts: { coins, … } }.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { mat, worldUV, texPair } from './common.js';
import { gatePiece, stream, GK_SCHOOLS } from './gatekit.js';
import { shuttleRoom } from './props.js';

export const V_MODES = { relics: 'A, the gate’s own: the relic, the coffer, the cache', hoard: 'B, the hoard: OG-123 as drawn', left: 'C, what the delvers left' };
export const V_ROOMS = { great: 'A great gate’s vault', lesser: 'A lesser gate’s keep' };

// ── materials ──
let VM = null, VMS = null;
function mats(school) {
  if (VM && VMS === school) return VM;
  const S = GK_SCHOOLS[school] || GK_SCHOOLS.cloch, glow = new THREE.Color(...S.glow), st = new THREE.Color(...S.stone).multiplyScalar(.55);
  const coinTex = texPair(256, (x, y) => { const n = 9, X = x * n, Y = y * n, i = Math.floor(X), j = Math.floor(Y); let h = 0, best = 9, tone = .5;
    for (let b = -1; b <= 1; b++) for (let a = -1; a <= 1; a++) { const ci = i + a, cj = j + b, wi = ((ci % n) + n) % n, wj = ((cj % n) + n) % n, s = Math.sin(wi * 12.9898 + wj * 78.233) * 43758.5453, r = s - Math.floor(s);
      const cx = ci + .5 + (r - .5) * .5, cy = cj + .5 + (((r * 7.13) % 1) - .5) * .5, d = Math.hypot(X - cx, Y - cy); if (d < .52 && d < best) { best = d; tone = r; h = d > .44 ? 1 : .75 + .1 * Math.sin(d * 30); } }
    const v = best < .52 ? .78 + .2 * tone : .3; return [h, v, v * .74, v * .3]; }, 3);
  VM = { stone: mat('ashlar', { ns: 1.1, color: st, rough: .75 }), pale: mat('ashlar', { ns: 1.0, color: new THREE.Color(...S.stone).multiplyScalar(.8), rough: .8 }),
    floor: mat('slab', { ns: 1.2, color: 0x9a948c, rough: .48 }), pit: new THREE.MeshStandardMaterial({ color: 0x0b0a09, roughness: 1 }),
    wall: mat('ashlar', { ns: 1.1, color: st.clone().multiplyScalar(.8), rough: .8 }),
    band: new THREE.MeshStandardMaterial({ color: st.clone().multiplyScalar(1.3), emissive: glow, emissiveIntensity: 1.1, emissiveMap: bandTex(), roughness: .6, metalness: .1 }),
    bandDead: new THREE.MeshStandardMaterial({ color: st.clone().multiplyScalar(1.3), roughness: .65 }),
    seal: new THREE.MeshStandardMaterial({ color: 0x14100c, emissive: glow, emissiveIntensity: 2.4, emissiveMap: ringTex(), roughness: .6 }),
    script: new THREE.MeshStandardMaterial({ color: 0x0e0b08, emissive: glow, emissiveIntensity: 1.8, emissiveMap: bandTex(), roughness: .6 }),
    glow: new THREE.MeshStandardMaterial({ color: 0x1a140c, emissive: glow, emissiveIntensity: 2.2, roughness: .6 }),
    crystal: new THREE.MeshStandardMaterial({ color: glow.clone().multiplyScalar(.5), emissive: glow, emissiveIntensity: .9, roughness: .15, metalness: .1, transparent: true, opacity: .92 }),
    core: new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: glow.clone().lerp(new THREE.Color(1, 1, 1), .35), emissiveIntensity: 5, roughness: .1 }),
    void: new THREE.MeshBasicMaterial({ color: 0x000000 }),
    gold: new THREE.MeshStandardMaterial({ color: 0xe0ac48, roughness: .3, metalness: .8, emissive: new THREE.Color(.45, .28, .06), emissiveIntensity: .25 }), coinMass: new THREE.MeshStandardMaterial({ map: coinTex.map, normalMap: coinTex.normalMap, color: 0xf0c060, roughness: .34, metalness: .75, emissive: new THREE.Color(.5, .32, .08), emissiveIntensity: .22, emissiveMap: coinTex.map }),
    silver: new THREE.MeshStandardMaterial({ color: 0xcfd2d6, roughness: .3, metalness: 1 }), star: new THREE.MeshStandardMaterial({ color: 0x3c4458, roughness: .25, metalness: 1, emissive: new THREE.Color(.2, .3, .6), emissiveIntensity: .08 }),
    bronze: new THREE.MeshStandardMaterial({ color: 0x8a6232, roughness: .4, metalness: .9 }), iron: new THREE.MeshStandardMaterial({ color: 0x2a2724, roughness: .55, metalness: .7 }),
    gem: new THREE.MeshStandardMaterial({ color: 0x9a0f1c, roughness: .08, metalness: .2, emissive: new THREE.Color(.25, .02, .04), emissiveIntensity: .6 }),
    wood: mat('wood', { ns: 1.0, color: 0x9a7a58, rough: .75 }), oldWood: mat('wood', { ns: 1.2, color: 0x5e4a38, rough: .9 }),
    leather: new THREE.MeshStandardMaterial({ color: 0x4a3020, roughness: .8 }), cloth: mat('plaster', { ns: .6, color: 0x6a5e48, rough: 1 }), rope: new THREE.MeshStandardMaterial({ color: 0x8a7650, roughness: .95 }),
    bone: new THREE.MeshStandardMaterial({ color: 0xb8ac8e, roughness: .75 }), paper: new THREE.MeshStandardMaterial({ color: 0xd8ccaa, roughness: .9, side: THREE.DoubleSide }),
    horn: new THREE.MeshStandardMaterial({ color: 0x8a6a40, roughness: .5, transparent: true, opacity: .8 }), ash: new THREE.MeshStandardMaterial({ color: 0x2a2724, roughness: 1 }),
    beam: new THREE.MeshBasicMaterial({ color: new THREE.Color(1, .92, .74), transparent: true, opacity: .028, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide }),
    eye: new THREE.MeshBasicMaterial({ color: new THREE.Color(1.8, 1.7, 1.5) }) };
  VM.pitWall = VM.wall.clone(); VM.pitWall.side = THREE.BackSide; VM.dome = VM.wall.clone(); VM.dome.side = THREE.BackSide; VM.dome.color = st.clone().multiplyScalar(.5);
  VMS = school; return VM;
}
// glyphs round a band: the gate slice's seven shapes on a long strip, white on black (wonders.js's bandTex, its own stream)
let _band = null;
function bandTex() { if (_band) return _band; const L = 4096, S = 64, c = document.createElement('canvas'); c.width = L; c.height = S; const x = c.getContext('2d'), r = stream('vaults:band'); x.fillStyle = '#000'; x.fillRect(0, 0, L, S); x.strokeStyle = '#fff'; x.lineCap = 'round'; x.lineWidth = 5;
  for (let i = 0; i < 80; i++) { const k = Math.floor(r() * 7); x.save(); x.translate(26 + i * 51, 32); x.beginPath();
    if (k === 0) { x.arc(0, 0, 12, 0, 7); x.moveTo(0, -18); x.lineTo(0, 18); } else if (k === 1) { x.moveTo(-12, 18); x.lineTo(0, -18); x.lineTo(12, 18); x.moveTo(-7, 4); x.lineTo(7, 4); }
    else if (k === 2) { x.arc(0, 0, 13, .6, 5.7); x.moveTo(2, 0); x.arc(0, 0, 2, 0, 7); } else if (k === 3) { x.moveTo(-12, -14); x.lineTo(12, -14); x.moveTo(0, -14); x.lineTo(0, 18); x.moveTo(-8, 2); x.lineTo(8, 10); }
    else if (k === 4) { x.moveTo(-12, 0); x.lineTo(0, -16); x.lineTo(12, 0); x.lineTo(0, 16); x.closePath(); } else if (k === 5) { x.moveTo(-10, -16); x.lineTo(-10, 16); x.moveTo(10, -16); x.lineTo(10, 16); x.moveTo(-10, 0); x.lineTo(10, 0); }
    else { x.moveTo(0, -18); x.lineTo(0, 18); x.moveTo(-10, -8); x.lineTo(0, -2); x.lineTo(10, -8); } x.stroke(); x.restore(); }
  const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 8; return (_band = t); }
// the ring sigil (gatekit draws it; its copy is private), white on black
let _ring = null;
function ringTex() { if (_ring) return _ring; const c = document.createElement('canvas'); c.width = c.height = 512; const x = c.getContext('2d'); x.fillStyle = '#000'; x.fillRect(0, 0, 512, 512); x.strokeStyle = '#fff'; x.fillStyle = '#fff'; x.lineCap = 'round';
  x.lineWidth = 16; x.beginPath(); x.arc(256, 256, 170, 0, 7); x.stroke(); x.lineWidth = 9; x.beginPath(); x.arc(256, 256, 96, 0, 7); x.stroke();
  x.lineWidth = 10; x.beginPath(); x.moveTo(256, 20); x.lineTo(256, 492); x.moveTo(20, 256); x.lineTo(492, 256); x.stroke(); x.beginPath(); x.arc(256, 256, 18, 0, 7); x.fill();
  const t = new THREE.CanvasTexture(c); t.anisotropy = 8; return (_ring = t); }

// ── the bake: parts by material, merged, one mesh a material ──
const TM = (x = 0, y = 0, z = 0, ry = 0, rx = 0, rz = 0, s = 1) => new THREE.Matrix4().compose(new THREE.Vector3(x, y, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(rx, ry, rz, 'YXZ')), typeof s === 'number' ? new THREE.Vector3(s, s, s) : new THREE.Vector3(...s));
function kit(M) { const B = new Map(); let stack = [new THREE.Matrix4()];
  const put = (geo, key, m, uv = .5) => { const g = geo.index ? geo.toNonIndexed() : geo.clone(); for (const k of Object.keys(g.attributes)) if (!['position', 'normal', 'uv'].includes(k)) g.deleteAttribute(k);
    g.applyMatrix4(stack[stack.length - 1].clone().multiply(m || new THREE.Matrix4())); if (uv !== null || !g.attributes.uv) { if (!g.attributes.normal) g.computeVertexNormals(); worldUV(g, uv ?? .5); } (B.get(key) || B.set(key, []).get(key)).push(g); };
  const push = m => stack.push(stack[stack.length - 1].clone().multiply(m)), pop = () => stack.pop();
  const finish = group => { let tris = 0, draws = 0; for (const [k, gs] of B) { const g = mergeGeometries(gs, false), m = new THREE.Mesh(g, M[k]); m.name = k; m.castShadow = !['beam', 'eye', 'void', 'glow', 'seal', 'script', 'core', 'pit'].includes(k); m.receiveShadow = true; group.add(m); tris += g.attributes.position.count / 3; draws++; } B.clear(); return { tris: Math.round(tris), draws }; };
  return { put, push, pop, finish }; }
// a tube's inside: its triangles turned and its normals in, so a ring's inner face lights from within
function inward(g) { const n = g.index ? g.toNonIndexed() : g, A = n.attributes; for (const k of Object.keys(A)) { const a = A[k], s = a.itemSize; for (let t = 0; t < a.count; t += 3) for (let c = 0; c < s; c++) { const v = a.array[(t + 1) * s + c]; a.array[(t + 1) * s + c] = a.array[(t + 2) * s + c]; a.array[(t + 2) * s + c] = v; } }
  const N = A.normal; for (let i = 0; i < N.array.length; i++) N.array[i] *= -1; return n; }
// pieces of the gate kit, placed in the group (each keeps its own materials: the kit's stone and script)
function piece(group, kind, o, m) { const p = gatePiece(kind, o); p.applyMatrix4(m); group.add(p); return p.userData; }

// ── the things that lie in a gate ──
// a band of a ring: outer face carries the script (u round, v across), inner face and edges plain; axis y, centred on the origin
function ringBand(K, r, w, t, key = 'band', m) { const n = Math.max(48, Math.round(r * 14));
  const o = new THREE.CylinderGeometry(r, r, w, n, 1, true), i = inward(new THREE.CylinderGeometry(r - t, r - t, w, n, 1, true));
  const ou = o.attributes.uv; for (let k = 0; k < ou.count; k++) ou.setX(k, ou.getX(k) * Math.max(1, Math.round(r / 2.2)));
  K.put(o, key, m, null); K.put(i, 'stone', m); for (const s of [1, -1]) { const e = new THREE.RingGeometry(r - t, r, n, 1); e.rotateX(-s * Math.PI / 2); e.translate(0, s * w / 2, 0); K.put(e, 'stone', m); } }
// one coin, 2.6 cm, lying at p tilted by the stream
const COIN = new THREE.CylinderGeometry(.013, .013, .0025, 10);
function coin(K, r, x, y, z, flat = .4, key = 'gold') { K.put(COIN, key, TM(x, y + .0015, z, r() * 6.28, (r() - .5) * flat * 3, (r() - .5) * flat * 3), .1); }
// a heap of coin: a mound of the coin texture R across and H high, its skirt scattered with loose coins
function coinHeap(K, r, x, y, z, R, H, n) { const prof = []; for (let k = 0; k <= 12; k++) { const t = k / 12; prof.push(new THREE.Vector2(R * (1 - t) + .001, H * Math.pow(Math.sin(t * Math.PI / 2), .9))); }
  const g = new THREE.LatheGeometry(prof.reverse(), 28), P = g.attributes.position; for (let i = 0; i < P.count; i++) { const px = P.getX(i), py = P.getY(i), pz = P.getZ(i), k = Math.sin(px * 3.1 + pz * 1.7) * Math.cos(pz * 2.3 - px) * .07 * R * (py / H) * (1 - py / H) * 4; P.setY(i, Math.max(0, py + k)); }
  g.computeVertexNormals(); K.put(g, 'coinMass', TM(x, y - .01, z), 2.2 / Math.max(1, R));
  for (let i = 0; i < n; i++) { const a = r() * 6.283, d = R * (.85 + r() * r() * .9); coin(K, r, x + Math.sin(a) * d, y, z + Math.cos(a) * d); } return n; }
// a chest of wood and iron (1.0 by 0.55 by 0.62), its lid open or shut; o.full spills coin over its lip
function chest(K, r, m, o = {}) { K.push(m); const Wd = 1.0, Hd = .5, Dd = .62;
  K.put(new THREE.BoxGeometry(Wd, Hd, Dd), 'oldWood', TM(0, Hd / 2, 0), 1.2);
  for (const u of [-.38, .38]) K.put(new THREE.BoxGeometry(.06, Hd + .01, Dd + .02), 'iron', TM(u, Hd / 2, 0));
  const lid = new THREE.CylinderGeometry(Dd / 2, Dd / 2, Wd, 14, 1, false, 0, Math.PI); lid.rotateZ(Math.PI / 2); lid.rotateX(Math.PI / 2);
  const hinge = TM(0, Hd, -Dd / 2, 0, o.open ? -1.9 : 0); K.push(hinge); K.put(lid, 'oldWood', TM(0, 0, Dd / 2), 1.2); for (const u of [-.38, .38]) { const b = new THREE.CylinderGeometry(Dd / 2 + .012, Dd / 2 + .012, .06, 14, 1, false, 0, Math.PI); b.rotateZ(Math.PI / 2); b.rotateX(Math.PI / 2); K.put(b, 'iron', TM(u, 0, Dd / 2)); } K.pop();
  K.put(new THREE.BoxGeometry(.12, .14, .03), 'iron', TM(0, Hd - .05, Dd / 2 + .015));
  let n = 0; if (o.full) { const g = new THREE.SphereGeometry(1, 16, 8, 0, 6.283, 0, Math.PI / 2); g.scale(Wd / 2 - .03, .22, Dd / 2 - .03); K.put(g, 'coinMass', TM(0, Hd - .02, 0), 3);
    for (let i = 0; i < 40; i++) { const a = (r() - .5) * 1.6, d = Dd / 2 + .05 + r() * .7; coin(K, r, (r() - .5) * .9, 0, Math.cos(a) * d, .4); n++; } }
  K.pop(); return n; }
// a gold cup, a plate and a crown
function cup(K, m, key = 'gold') { const p = [[0, 0], [.07, 0], [.07, .012], [.02, .03], [.015, .12], [.06, .15], [.075, .22], [.068, .222], [.054, .16], [0, .155]].map(([a, b]) => new THREE.Vector2(a, b)); K.put(new THREE.LatheGeometry(p, 16), key, m, .2); }
function plate(K, m) { const p = [[0, 0], [.17, 0], [.2, .02], [.19, .022], [.16, .006], [0, .006]].map(([a, b]) => new THREE.Vector2(a, b)); K.put(new THREE.LatheGeometry(p, 24), 'silver', m, .2); }
function crown(K, m) { K.push(m); K.put(new THREE.CylinderGeometry(.11, .1, .07, 24, 1, true), 'gold', TM(0, .035, 0)); for (let k = 0; k < 8; k++) { const a = k / 8 * 6.283; K.put(new THREE.ConeGeometry(.022, .08, 4), 'gold', TM(Math.sin(a) * .105, .1, Math.cos(a) * .105)); K.put(new THREE.OctahedronGeometry(.014), 'gem', TM(Math.sin(a) * .112, .035, Math.cos(a) * .112)); } K.pop(); }
// a star-metal ingot (0.22 by 0.06 by 0.09), a trapezoid
function ingot(K, m) { const g = new THREE.BoxGeometry(.22, .06, .09), P = g.attributes.position; for (let i = 0; i < P.count; i++) if (P.getY(i) > 0) { P.setX(i, P.getX(i) * .82); P.setZ(i, P.getZ(i) * .75); } g.computeVertexNormals(); K.put(g, 'star', m, .2); }
// the hoard's dressing round a point: chests, cups, plate, ingots, a shield of gilt
function hoardRound(K, r, cx, y, cz, R, n, face = 0) { let coins = 0;
  for (let i = 0; i < n; i++) { const a = face + (i / n - .5) * 2.4 + (r() - .5) * .3, d = R + r() * .8, x = cx + Math.sin(a) * d, z = cz + Math.cos(a) * d;
    const k = i % 4; if (k === 0) coins += chest(K, r, TM(x, y, z, a + Math.PI + (r() - .5) * .5), { open: true, full: true });
    else if (k === 1) { coins += coinHeap(K, r, x, y, z, .55 + r() * .4, .3 + r() * .25, 30); cup(K, TM(x + .3, y, z + .2, 0, 0, 0)); plate(K, TM(x - .35, y + .01, z - .1, 0, (r() - .5) * .3)); }
    else if (k === 2) { for (let s = 0; s < 3; s++) for (let q = 0; q < 4 - s; q++) ingot(K, TM(x + (q - (3 - s) / 2) * .1, y + .03 + s * .06, z, a + (s % 2) * 1.57)); coins += 12; for (let c = 0; c < 12; c++) coin(K, r, x + (r() - .5) * 1.2, y, z + (r() - .5) * 1.2); }
    else { cup(K, TM(x, y, z, 0, 1.5, 0)); cup(K, TM(x + .25, y, z - .15)); coins += coinHeap(K, r, x - .2, y, z + .3, .4, .2, 20); } }
  return coins; }
// a delver dead against something: seated, his back to -z, legs to +z, his head dropped; his pack, journal, lantern, sword and split purse
function delver(K, r, m) { K.push(m); let coins = 0;
  const bone = (a, b, rad = .018) => { const A = new THREE.Vector3(...a), Bv = new THREE.Vector3(...b), L = A.distanceTo(Bv), g = new THREE.CylinderGeometry(rad * .8, rad, L, 6); g.translate(0, L / 2, 0); const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), Bv.clone().sub(A).normalize()); K.put(g, 'bone', new THREE.Matrix4().compose(A, q, new THREE.Vector3(1, 1, 1)), .3); };
  // the cloak, rotted, a sheet over the shoulders and down to the floor behind
  { const g = new THREE.PlaneGeometry(.7, .9, 6, 8), P = g.attributes.position; for (let i = 0; i < P.count; i++) { const x = P.getX(i), y = P.getY(i); P.setZ(i, -.1 + .05 * Math.sin(x * 14) - Math.max(0, -y) * .2); } g.computeVertexNormals(); K.put(g, 'cloth', TM(0, .5, -.06, 0, -.15)); }
  bone([0, .12, 0], [0, .62, -.04], .02); for (let k = 0; k < 5; k++) { const t = new THREE.TorusGeometry(.12 - k * .008, .008, 4, 14, Math.PI * 1.3); K.put(t, 'bone', TM(0, .36 + k * .05, .02, 0, Math.PI / 2 + .2, Math.PI * .15 + Math.PI), .3); }
  K.put(new THREE.BoxGeometry(.28, .1, .14), 'bone', TM(0, .1, .02), .3);
  const skull = new THREE.SphereGeometry(.095, 12, 10); skull.scale(.85, 1, 1.1); K.put(skull, 'bone', TM(.04, .66, .1, .3, .7), .3); K.put(new THREE.BoxGeometry(.08, .03, .07), 'bone', TM(.05, .58, .17, .3, .7), .3);
  for (const s of [-1, 1]) { bone([s * .1, .1, .03], [s * .13, .12, .46]); bone([s * .13, .12, .46], [s * .16, .03, .86], .015); K.put(new THREE.BoxGeometry(.07, .03, .17), 'bone', TM(s * .16, .02, .92), .3);
    bone([s * .16, .56, 0], [s * .2, .32, .06]); bone([s * .2, .32, .06], [s * .08, .2, .3], .012); }
  // the pack beside him, its bedroll; the lantern, out; the sword on the floor; the journal open on the step; the purse split
  K.put(new THREE.BoxGeometry(.36, .46, .2), 'leather', TM(.48, .23, -.02, .3, 0, .12), .8); K.put(new THREE.CylinderGeometry(.08, .08, .44, 10).rotateZ(Math.PI / 2), 'cloth', TM(.48, .52, -.02, .3, 0, .12));
  K.put(new THREE.BoxGeometry(.12, .2, .12), 'iron', TM(-.42, .1, .3), .3); K.put(new THREE.BoxGeometry(.1, .14, .1), 'horn', TM(-.42, .1, .3)); K.put(new THREE.TorusGeometry(.04, .006, 4, 10), 'iron', TM(-.42, .23, .3, 0, 0, Math.PI / 2));
  K.put(new THREE.BoxGeometry(.05, .008, .92), 'silver', TM(-.32, .005, .82, .25)); K.put(new THREE.BoxGeometry(.2, .03, .04), 'iron', TM(-.42, .015, .38, .25)); K.put(new THREE.CylinderGeometry(.016, .016, .12, 6).rotateX(Math.PI / 2), 'leather', TM(-.44, .016, .3, .25));
  for (const s of [-1, 1]) { const pg = new THREE.PlaneGeometry(.15, .21, 4, 1), P = pg.attributes.position; for (let i = 0; i < P.count; i++) P.setZ(i, Math.sin((P.getX(i) / .15 + .5) * Math.PI) * .012); pg.rotateX(-Math.PI / 2); K.put(pg, 'paper', TM(.36 + s * .078, .012, .55, -.4, 0, -s * .1)); }
  K.put(new THREE.BoxGeometry(.33, .01, .23), 'leather', TM(.36, .004, .55, -.4));
  { const g = new THREE.SphereGeometry(.06, 10, 8); g.scale(1, .6, 1); K.put(g, 'leather', TM(.2, .035, .62)); for (let i = 0; i < 14; i++) { coin(K, r, .2 + .05 + r() * .35, 0, .62 + (r() - .3) * .3); coins++; } }
  K.pop(); return coins; }
// a camp at the door: a bedroll, a cold ring of hearth stones and its ash, a coil of rope, a dropped torch
function camp(K, r, m) { K.push(m); K.put(new THREE.BoxGeometry(.8, .06, 1.9), 'cloth', TM(0, .03, 0, .1), .6); K.put(new THREE.CylinderGeometry(.13, .13, .8, 10).rotateZ(Math.PI / 2), 'cloth', TM(-.05, .1, -.9, .1));
  for (let k = 0; k < 9; k++) { const a = k / 9 * 6.283, g = new THREE.DodecahedronGeometry(.11 + r() * .04); K.put(g, 'wall', TM(1.4 + Math.sin(a) * .42, .07, .4 + Math.cos(a) * .42, r() * 3)); }
  { const g = new THREE.CylinderGeometry(.32, .36, .04, 14); K.put(g, 'ash', TM(1.4, .02, .4)); for (let k = 0; k < 4; k++) K.put(new THREE.CylinderGeometry(.025, .03, .5, 6).rotateZ(Math.PI / 2), 'oldWood', TM(1.4, .06, .4, k * .8)); }
  for (let k = 0; k < 4; k++) K.put(new THREE.TorusGeometry(.22 - k * .02, .016, 5, 20), 'rope', TM(-.9, .016 + k * .03, -.5, 0, Math.PI / 2));
  K.put(new THREE.CylinderGeometry(.022, .025, .6, 6).rotateZ(Math.PI / 2), 'oldWood', TM(.8, .025, 1.3, .6)); K.put(new THREE.CylinderGeometry(.04, .035, .12, 8).rotateZ(Math.PI / 2), 'ash', TM(.55, .04, 1.45, .6));
  K.pop(); }
// the gate's coffer: a chest of its own stone, 1.5 by 0.8 by 0.9 m, bronze at the corners, sealed by script round the lid and a ring on it
function coffer(K, m) { K.push(m); const Wd = 1.5, Hd = .62, Dd = .9;
  K.put(new THREE.BoxGeometry(Wd, Hd, Dd), 'pale', TM(0, Hd / 2, 0), .7); K.put(new THREE.BoxGeometry(Wd + .12, .08, Dd + .12), 'pale', TM(0, .04, 0), .7);
  K.put(new THREE.BoxGeometry(Wd + .06, .045, Dd + .06), 'script', TM(0, Hd + .02, 0), null);
  { const g = new THREE.BoxGeometry(Wd + .1, .18, Dd + .1); K.put(g, 'pale', TM(0, Hd + .135, 0), .7); const t = new THREE.BoxGeometry(Wd - .1, .06, Dd - .2); K.put(t, 'pale', TM(0, Hd + .25, 0), .7); }
  { const g = new THREE.CircleGeometry(.26, 32); g.rotateX(-Math.PI / 2); K.put(g, 'seal', TM(0, Hd + .282, 0), null); }
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) { K.put(new THREE.BoxGeometry(.16, Hd + .3, .04), 'bronze', TM(sx * (Wd / 2 - .02), (Hd + .3) / 2, sz * (Dd / 2 + .01))); K.put(new THREE.BoxGeometry(.04, Hd + .3, .16), 'bronze', TM(sx * (Wd / 2 + .01), (Hd + .3) / 2, sz * (Dd / 2 - .02))); }
  K.pop(); return { w: Wd, h: Hd + .28, d: Dd }; }
// a vein of the gate's crystal: hexagonal prisms with points, breaking out of a crack round a centre, leaning out along +z
function vein(K, r, m, n = 14, s = 1) { K.push(m); K.put(new THREE.DodecahedronGeometry(.7 * s, 1).scale(1.2, 1, .45), 'wall', TM(0, 0, -.1));
  for (let i = 0; i < n; i++) { const L = (.35 + r() * .9) * s, rad = (.05 + r() * .07) * s, g = new THREE.CylinderGeometry(rad, rad, L, 6); g.translate(0, L / 2, 0); const tip = new THREE.ConeGeometry(rad, rad * 2.2, 6); tip.translate(0, L + rad * 1.1, 0);
    const pos = TM((r() - .5) * .8 * s, (r() - .5) * .9 * s, .05, 0, Math.PI / 2 - .3 + (r() - .5) * 1.4, (r() - .5) * 1.8); K.put(g, 'crystal', pos, .5); K.put(tip, 'crystal', pos, .5); }
  K.pop(); }
// a hooded statue of the gate's stone, 13 m to its hood's point on a plinth of 1.4: a robe in folds, a deep hood with the dark for a face,
// both hands on the pommel of a sword stood point-down before it. Built facing +z.
function statue(K, m) { K.push(m);
  K.put(new THREE.BoxGeometry(5.2, 1.4, 5.2), 'stone', TM(0, .7, 0), .25); K.put(new THREE.BoxGeometry(5.6, .3, 5.6), 'stone', TM(0, 1.4, 0), .25);
  const base = 1.55, prof = [[2.1, 0], [2.2, .25], [2.0, .9], [1.8, 3.5], [1.62, 6.5], [1.66, 8.2], [1.85, 9.4], [1.7, 10.0], [1.2, 10.35], [.75, 10.6], [.001, 10.7]].map(([a, b]) => new THREE.Vector2(a, b));
  const g = new THREE.LatheGeometry(prof, 40), P = g.attributes.position; for (let i = 0; i < P.count; i++) { const x = P.getX(i), y = P.getY(i), z = P.getZ(i), a = Math.atan2(x, z), k = 1 + (y < 9.3 ? .05 * Math.sin(a * 9) * (1 - y / 12) : 0) * (Math.cos(a) > -.2 ? 1 : .5); P.setX(i, x * k); P.setZ(i, z * k * .82); }
  g.computeVertexNormals(); K.put(g, 'pale', TM(0, base, 0), .3);
  const hood = new THREE.SphereGeometry(1.25, 24, 16, 0, 6.283, 0, Math.PI * .7); hood.scale(1, 1.3, 1.15); K.put(hood, 'pale', TM(0, base + 10.7, -.05, 0, -.12), .3);
  const tip = new THREE.ConeGeometry(.75, 1.4, 16); K.put(tip, 'pale', TM(0, base + 12.3, -.45, 0, -.55), .3);
  const face = new THREE.SphereGeometry(1, 20, 14, 0, 6.283, 0, Math.PI / 2); face.rotateX(Math.PI / 2); face.scale(.7, .9, .55); K.put(face, 'void', TM(0, base + 10.6, 1.42, 0, -.1), null);
  // the sleeves from the shoulders down to the hands on the pommel at 7.2 m before the breast
  for (const s of [-1, 1]) { const A = new THREE.Vector3(s * 1.55, base + 9.2, .2), Bv = new THREE.Vector3(s * .35, base + 7.4, 1.95), L = A.distanceTo(Bv), sg = new THREE.CylinderGeometry(.5, .62, L, 14); sg.translate(0, L / 2, 0);
    K.put(sg, 'pale', new THREE.Matrix4().compose(A, new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), Bv.clone().sub(A).normalize()), new THREE.Vector3(1, 1, 1)), .3);
    const hand = new THREE.SphereGeometry(.38, 12, 10); hand.scale(1, .9, 1.2); K.put(hand, 'pale', TM(s * .22, base + 7.55, 2.05), .3); }
  K.put(new THREE.SphereGeometry(.3, 12, 10), 'pale', TM(0, base + 8.2, 2.05), .3); K.put(new THREE.CylinderGeometry(.16, .16, 1.0, 10), 'pale', TM(0, base + 7.6, 2.05), .3);
  K.put(new THREE.BoxGeometry(2.0, .26, .34), 'pale', TM(0, base + 7.05, 2.05), .3);
  { const bl = new THREE.BoxGeometry(.56, 6.0, .14), Pb = bl.attributes.position; for (let i = 0; i < Pb.count; i++) if (Pb.getY(i) < -2.9) Pb.setX(i, 0); bl.computeVertexNormals(); K.put(bl, 'pale', TM(0, base + 3.95, 2.05), .3); }
  // the script at the hem
  { const b = new THREE.CylinderGeometry(2.13, 2.13, .5, 40, 1, true); b.scale(1, 1, .82); const u = b.attributes.uv; for (let k = 0; k < u.count; k++) u.setX(k, u.getX(k) * 3); K.put(b, 'script', TM(0, base + .7, 0), null); }
  K.pop(); }
// a brazier of bronze on three legs, its fire (kept apart to flicker), a light
function brazier(K, m) { K.push(m); for (let k = 0; k < 3; k++) { const a = k / 3 * 6.283; K.put(new THREE.CylinderGeometry(.035, .035, 1.15, 6), 'bronze', TM(Math.sin(a) * .28, .55, Math.cos(a) * .28, 0, Math.cos(a) * .25, -Math.sin(a) * .25)); }
  const p = [[0, 0], [.42, .06], [.5, .26], [.47, .27], [.38, .1], [0, .05]].map(([a, b]) => new THREE.Vector2(a, b)); K.put(new THREE.LatheGeometry(p, 18), 'bronze', TM(0, 1.05, 0)); K.pop(); }
function flameMesh(M) { const g = new THREE.Group(), fm = new THREE.MeshBasicMaterial({ color: new THREE.Color(2.6, 1.3, .4), transparent: true, opacity: .85, depthWrite: false, blending: THREE.AdditiveBlending });
  for (let k = 0; k < 4; k++) { const pts = []; for (let i = 0; i <= 8; i++) { const t = i / 8; pts.push(new THREE.Vector2(.2 * Math.sin(Math.PI * Math.pow(t, .7)) * (1 - t * .35), t * .8)); } const f = new THREE.Mesh(new THREE.LatheGeometry(pts, 8), fm); f.position.set((k % 2 - .5) * .14, 0, (k > 1 ? 1 : -1) * .07); f.scale.setScalar(.7 + k * .12); g.add(f); }
  return g; }

// ── the great gate's vault ──
export function greatVault(o = {}) {
  const mode = V_MODES[o.mode] ? o.mode : 'left', school = GK_SCHOOLS[o.school] ? o.school : 'cloch', M = mats(school), r = stream('vaults:great:' + school), dr = stream('vaults:great:' + mode);
  const group = new THREE.Group(), K = kit(M), S = GK_SCHOOLS[school], glow = new THREE.Color(...S.glow), lights = [], flames = [];
  const RP = 15, RI = 7, RA = 24, RW = 31, DEEP = 30, DOME = 20, RISE = 1.05; let tris = 0, draws = 0;
  // the floor: a ring of slabs from the pit's lip to the outer wall; the pit's wall and its dark floor; the island and its dais
  { const g = new THREE.RingGeometry(RP, RW + .5, 96, 6); g.rotateX(-Math.PI / 2); K.put(g, 'floor', null, .2); }
  { const g = new THREE.CylinderGeometry(RP, RP, DEEP, 96, 4, true); K.put(g, 'pitWall', TM(0, -DEEP / 2, 0), .25); const f = new THREE.CircleGeometry(RP, 48); f.rotateX(-Math.PI / 2); K.put(f, 'pit', TM(0, -DEEP, 0)); }
  { const g = new THREE.CylinderGeometry(RI, RI * .8, DEEP, 64, 4); K.put(g, 'wall', TM(0, -DEEP / 2, 0), .25); const t = new THREE.CircleGeometry(RI, 64); t.rotateX(-Math.PI / 2); K.put(t, 'floor', TM(0, 0, 0), .2); }
  const STEPS = [4.3, 3.6, 2.9]; STEPS.forEach((rad, k) => K.put(new THREE.CylinderGeometry(rad, rad, .35, 64), 'stone', TM(0, .175 + k * .35, 0), .4));
  { const g = new THREE.CircleGeometry(1.9, 48); g.rotateX(-Math.PI / 2); K.put(g, 'seal', TM(0, RISE + .005, 0), null); }
  // the lip of the pit: a kerb of dressed stone, and the island's
  K.put(new THREE.TorusGeometry(RP + .3, .3, 4, 96).rotateX(Math.PI / 2), 'stone', TM(0, .15, 0), .4); K.put(new THREE.TorusGeometry(RI - .25, .25, 4, 64).rotateX(Math.PI / 2), 'stone', TM(0, .12, 0), .4);
  // the outer wall, the dome and the script band round its foot
  { const g = new THREE.CylinderGeometry(RW, RW, DOME, 96, 4, true); K.put(g, 'pitWall', TM(0, DOME / 2, 0), .12); const d = new THREE.SphereGeometry(RW, 64, 24, 0, 6.283, 0, Math.PI / 2); K.put(d, 'dome', TM(0, DOME, 0), .08);
    const b = inward(new THREE.CylinderGeometry(RW - .05, RW - .05, .9, 96, 1, true)); const u = b.attributes.uv; for (let k = 0; k < u.count; k++) u.setX(k, u.getX(k) * 10); K.put(b, 'script', TM(0, DOME + .2, 0), null); }
  // eight bays: a pier at each joint and one of the kit's arches between, facing the heart; the door bay at +z
  const pieces = [];
  for (let i = 0; i < 8; i++) { const a = i / 8 * 6.283, aj = a + Math.PI / 8;
    pieces.push(piece(group, 'pier', { school, key: `vaults:pier:${i}` }, TM(Math.sin(aj) * RA, 0, Math.cos(aj) * RA, aj)));
    pieces.push(piece(group, 'arch', { school, key: `vaults:arch:${i}` }, TM(Math.sin(a) * (RA - .8), 0, Math.cos(a) * (RA - .8), a + Math.PI)));
 }
  // three bridges to the island: whole at the door, cracked to the west, broken (its stones afloat) to the east
  // the door's is a causeway of its own, flat to walk (the kit's bridge's ring stands up through its deck at the crown): a deck of 4.4 m
  // between low parapets on one round arch of 7 m over the gap; the other two are the kit's bridge, cracked and broken
  const BR = (RP + RI) / 2 + .5, bridges = [[-2 * Math.PI / 3, 'cracked'], [2 * Math.PI / 3, 'broken']];
  for (const [a, cond] of bridges) pieces.push(piece(group, 'bridge', { school, cond, key: `vaults:bridge:${cond}` }, TM(Math.sin(a) * BR, -6.45, Math.cos(a) * BR, a + Math.PI / 2)));
  { const L = RP - RI + 1.6, z0 = (RP + RI) / 2, sh = new THREE.Shape([[-L / 2, -6.5], [L / 2, -6.5], [L / 2, 0], [-L / 2, 0]].map(([x, y]) => new THREE.Vector2(x, y))), hole = new THREE.Path();
    hole.moveTo(-3.5, -6.5); hole.lineTo(-3.5, -4.2); hole.absarc(0, -4.2, 3.5, Math.PI, 0, true); hole.lineTo(3.5, -6.5); hole.lineTo(-3.5, -6.5); sh.holes.push(hole);
    const g = new THREE.ExtrudeGeometry(sh, { depth: 4.0, bevelEnabled: false, curveSegments: 12 }); g.translate(0, 0, -2.0); K.put(g, 'wall', TM(0, -.4, z0, Math.PI / 2), .25);
    for (let k = 0; k < 4; k++) K.put(new THREE.BoxGeometry(4.4, .4, L / 4 - .03), 'floor', TM(0, -.2, z0 - L / 2 + (k + .5) * L / 4), .2);
    for (const sx of [-1, 1]) { K.put(new THREE.BoxGeometry(.45, .85, L), 'stone', TM(sx * 2.0, .42, z0), .4); K.put(new THREE.BoxGeometry(.6, .18, L + .1), 'stone', TM(sx * 2.0, .93, z0), .4); } }
  // the statues, flanking the far bay, facing the heart
  for (const s of [-1, 1]) { const a = Math.PI + s * .66, x = Math.sin(a) * 19.5, z = Math.cos(a) * 19.5; statue(K, TM(x, 0, z, Math.atan2(-x, -z))); }
  // the cache: the kit's panel at 0.6 in the ambulatory wall of the west bay, behind its arch
  { const a = -Math.PI / 2; pieces.push(piece(group, 'panel', { school, key: 'vaults:cache' }, TM(Math.sin(a) * (RW - 1.2), 0, Math.cos(a) * (RW - 1.2), a + Math.PI, 0, 0, .6))); }
  // a crystal vein out of the pit's wall below the east lip
  vein(K, r, TM(RP - .3, -2.4, 3.5, -Math.PI / 2 - .25), 22, 1.6);
  // braziers on the floor ring, four, at the quarters off the bridges
  const BZ = []; for (let i = 0; i < 4; i++) { const a = Math.PI / 4 + i * Math.PI / 2, x = Math.sin(a) * 18.5, z = Math.cos(a) * 18.5; brazier(K, TM(x, 0, z)); BZ.push([x, 1.3, z]); }
  // the armillary: a fixed meridian on its cradle, three rings that turn, the core shard at the heart
  const HUB = new THREE.Vector3(0, 8.2, 0), RING = [6.4, 5.4, 4.3, 3.2];
  K.put(new THREE.BoxGeometry(1.6, .9, 1.4), 'stone', TM(0, RISE + .45, 0), .4); K.put(new THREE.BoxGeometry(1.0, .5, 1.0), 'stone', TM(0, RISE + 1.1, 0), .4);
  ringBand(K, RING[0], .9, .55, 'band', TM(HUB.x, HUB.y, HUB.z, 0, Math.PI / 2));
  for (const s of [-1, 1]) K.put(new THREE.CylinderGeometry(.22, .22, 1.2, 10).rotateZ(Math.PI / 2), 'bronze', TM(s * (RING[1] + .55), HUB.y, 0));
  const R0 = finishInto(K, group); tris += R0.tris; draws += R0.draws;
  const rings = []; for (let k = 1; k < 4; k++) { const g = new THREE.Group(), K2 = kit(M); ringBand(K2, RING[k], .7 - k * .08, .4, 'band', TM(0, 0, 0, 0, Math.PI / 2)); if (k < 3) for (const s of [-1, 1]) K2.put(new THREE.CylinderGeometry(.14, .14, 1.15, 8).rotateZ(Math.PI / 2), 'bronze', TM(s * (RING[k + 1] + .5), 0, 0));
    const st = K2.finish(g); tris += st.tris; draws += st.draws; g.position.copy(HUB); group.add(g); rings.push(g); }
  const core = new THREE.Group(); { const K3 = kit(M), g = new THREE.OctahedronGeometry(.6, 0); g.scale(.75, 1.6, .75); K3.put(g, 'core', TM(0, 0, 0, .4)); const f = new THREE.OctahedronGeometry(.25, 0); f.scale(.7, 1.4, .7); K3.put(f, 'crystal', TM(.75, -.4, .2, 1, .4, .5)); K3.put(f, 'crystal', TM(-.6, .55, -.3, 2, -.3, -.4));
    const st = K3.finish(core); tris += st.tris; draws += st.draws; core.position.copy(HUB); group.add(core); }
  // what lies on the dais, by the mode
  const counts = { coins: 0 }, D = kit(M);
  if (mode === 'hoard') { counts.coins += coinHeap(D, dr, 0, RISE, 0, 2.7, 1.25, 260); crown(D, TM(.15, RISE + 1.22, .3, .5, -.2, .15, 3));
    counts.coins += hoardRound(D, dr, 0, RISE - .35, 0, 3.3, 7, 0); counts.coins += hoardRound(D, dr, 0, 0, 0, 4.9, 7, Math.PI); counts.coins += hoardRound(D, dr, 0, 0, 0, 4.9, 4, .05);
    for (const a of [-.4, .4]) counts.coins += hoardRound(D, dr, Math.sin(a) * 18, 0, Math.cos(a) * 18, 1.2, 3, a + Math.PI); }
  else { /* the relic: a broken arc of a stone ring, a third of it, on a low altar before the dais's heart, glyphs burning */
    D.put(new THREE.BoxGeometry(1.4, .9, .8), 'stone', TM(0, RISE + .45, 2.0), .4); ringBand(D, .6, .14, .1, 'band', TM(0, RISE + 1.15, 2.0, 0, Math.PI / 2 - .2, 0));
    if (mode === 'left') { counts.coins += delver(D, dr, TM(Math.sin(-.8) * 4.45, 0, Math.cos(-.8) * 4.45, -.8)); camp(D, dr, TM(-3.6, 0, 18.5, .3)); counts.coins += 30; for (let i = 0; i < 30; i++) coin(D, dr, -4.6 + dr() * 2.2, 0, 3.6 + dr() * 1.6); } }
  { const st = D.finish(group); tris += st.tris; draws += st.draws; }
  for (const p of pieces) { tris += p.tris; draws += p.calls; }
  // the lights: the core, the braziers' fires, the script's glow low on the piers, one cold fill from the dome
  const coreL = new THREE.PointLight(glow, 260, 60, 1.6); coreL.position.copy(HUB); coreL.castShadow = true; coreL.shadow.mapSize.set(2048, 2048); coreL.shadow.bias = -.003; group.add(coreL); lights.push(coreL);
  for (const p of BZ) { const f = flameMesh(M); f.position.set(p[0], 1.33, p[2]); group.add(f); flames.push(f); const L = new THREE.PointLight(new THREE.Color(1, .55, .22), 28, 20, 1.5); L.position.set(p[0], 2.4, p[2]); group.add(L); lights.push(L); }
  for (let i = 0; i < 8; i++) { const aj = i / 8 * 6.283 + Math.PI / 8, L = new THREE.PointLight(glow, 14, 14, 1.6); L.position.set(Math.sin(aj) * (RA - 3.6), 6, Math.cos(aj) * (RA - 3.6)); group.add(L); lights.push(L); }
  const tick = t => { rings.forEach((g, k) => { g.rotation.set(k === 1 ? .41 : 0, t * (.05 + k * .035) * (k % 2 ? -1 : 1), k === 2 ? t * .06 : 0); });
    core.rotation.y = t * .3; core.position.y = HUB.y + Math.sin(t * .8) * .12; flames.forEach((f, k) => f.children.forEach((c, j) => c.scale.y = .8 + .25 * Math.sin(t * 9 + k * 3 + j * 1.7) * Math.sin(t * 5.3 + j))); coreL.intensity = 260 * (.92 + .08 * Math.sin(t * 2.1)); };
  tick(o.t ?? 0);
  return { group, tris: Math.round(tris), draws, lights, tick, counts, mode, school, size: { pit: RP * 2, hall: RW * 2, dome: DOME + RW, rings: RING.map(x => +(x * 2).toFixed(1)), statue: 13.4 },
    stand: { x: .2, y: 0, z: 9.6, ry: Math.PI + .12 },
    view: { door: [0, 2.2, 27.5, 0, 6.5, 0], dais: [2.4, 3.1, 16.4, -.4, 2.2, 0], close: [-4.9, 1.45, 6.9, -2.9, .35, 3.1], high: [17, 15, 21, 0, 2, -2], scale: [3.4, 2.3, 17.2, 0, 4.2, 2] } };
}
function finishInto(K, group) { return K.finish(group); }

// ── the lesser gate's keep ──
export function lesserKeep(o = {}) {
  const mode = V_MODES[o.mode] ? o.mode : 'left', school = GK_SCHOOLS[o.school] ? o.school : 'cloch', M = mats(school), r = stream('vaults:lesser:' + school), dr = stream('vaults:lesser:' + mode);
  const group = new THREE.Group(), K = kit(M), lights = [], pieces = []; let tris = 0, draws = 0;
  const room = shuttleRoom({ taken: true }); group.add(room.group); tris += room.tris; draws += room.draws;
  const CROWN = room.crown, DZ = -2.0, STEPS = [[3.8, 3.4], [3.0, 2.6], [2.2, 1.9]], SH = .3, TOP = SH * 3;
  STEPS.forEach(([w, d], k) => K.put(new THREE.BoxGeometry(w, SH, d), 'stone', TM(0, SH / 2 + k * SH, DZ), .4));
  const cf = coffer(K, TM(0, TOP, DZ));
  // the eye in the crown and its shaft down to the dais
  { const e = new THREE.CircleGeometry(.75, 32); e.rotateX(Math.PI / 2); K.put(e, 'eye', TM(0, CROWN - .03, DZ), null);
    const b = new THREE.CylinderGeometry(.75, 1.25, CROWN - .03, 32, 1, true); K.put(b, 'beam', TM(0, (CROWN - .03) / 2, DZ), null);
    const b2 = new THREE.CylinderGeometry(.55, .95, CROWN - .03, 32, 1, true); K.put(b2, 'beam', TM(0, (CROWN - .03) / 2, DZ), null); }
  // the crystal vein out of the end wall's corner; the cache in the west wall between two piers
  vein(K, r, TM(3.9, 1.3, -6.85, -.5), 16, .9); K.put(new THREE.BoxGeometry(.01, .01, .01), 'stone');
  pieces.push(piece(group, 'panel', { school, key: 'vaults:lesser:cache' }, TM(-4.74, 0, -2.25, Math.PI / 2, 0, 0, .45)));
  const counts = { coins: 0 };
  if (mode === 'hoard') { counts.coins += coinHeap(K, dr, -2.1, 0, DZ + .4, .9, .45, 60); counts.coins += coinHeap(K, dr, 2.2, 0, DZ - .3, .75, .38, 50);
    counts.coins += chest(K, dr, TM(1.9, 0, DZ + 2.0, -.5), { open: true, full: true }); counts.coins += chest(K, dr, TM(-2.0, 0, DZ + 2.2, .6), { open: true, full: true });
    cup(K, TM(.5, TOP, DZ + .8)); cup(K, TM(-.55, TOP, DZ + .75, 0, 1.5)); plate(K, TM(-.2, TOP + .01, DZ + .85, 0, -.1)); crown(K, TM(0, TOP + cf.h, DZ + .05, .4));
    for (let q = 0; q < 6; q++) ingot(K, TM(-2.6 + q * .12, .03, DZ - 1.2, .2)); for (let i = 0; i < 80; i++) { coin(K, dr, (dr() - .5) * 5.5, 0, DZ + 1 + dr() * 2.6); counts.coins++; } }
  else if (mode === 'left') { counts.coins += delver(K, dr, TM(-1.25, 0, DZ + 1.75, -.35)); camp(K, dr, TM(2.6, 0, 4.4, -.4)); }
  { const st = K.finish(group); tris += st.tris; draws += st.draws; } for (const p of pieces) { tris += p.tris; draws += p.calls; }
  // the shaft's light on the dais (the one shadow), the sigil's and the script's glow, the crystal's
  const sp = new THREE.SpotLight(new THREE.Color(1, .93, .8), 420, CROWN + 4, .2, .55, 1.3); sp.position.set(0, CROWN + .5, DZ); sp.target.position.set(0, 0, DZ); sp.castShadow = true; sp.shadow.mapSize.set(2048, 2048); sp.shadow.bias = -.0005; group.add(sp, sp.target); lights.push(sp);
  const S = GK_SCHOOLS[school], glow = new THREE.Color(...S.glow);
  for (const [p, k, d] of [[[0, 3.4, -5.8], 30, 9], [[3.6, 1.6, -6], 7, 5], [[-3.6, 1.8, -2.25], 10, 5], [[0, 1.2, DZ + .1], 6, 3]]) { const L = new THREE.PointLight(glow, k, d, 1.6); L.position.set(...p); group.add(L); lights.push(L); }
  const tick = () => {};
  return { group, tris: Math.round(tris), draws, lights, tick, counts, mode, school, size: { span: room.span, crown: CROWN, len: room.len, coffer: [cf.w, +cf.h.toFixed(2), cf.d] },
    stand: { x: .9, y: 0, z: 2.6, ry: Math.PI + .25 },
    view: { door: [0, 1.7, 7.4, 0, 1.6, -3], dais: [2.6, 1.7, 2.8, -.2, .9, DZ], close: [.7, 1.15, 1.7, -1.1, .35, -.1], high: [3.6, 6.5, 6, 0, .5, -2.5], scale: [3.2, 1.6, 5.8, 0, 1.3, -1.5] } };
}
