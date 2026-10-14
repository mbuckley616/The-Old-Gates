// The Gatelands' buildings as pieces (card F6, the concept run of 13 Oct 2026). The lane slice (street.js) built its
// cottages as one extruded outline; this is the kit the builder lifts into the game: every measure in metres from SCALE,
// a wall is a slab per face with its openings cut through it (so every window and door has a real reveal), and each
// opening, roof, chimney and trim is a piece placed on a face. A building merges by material, about a dozen draw calls.
// The vocabulary is OG-070's (whitewashed thatch, field walls, rounded arches, slate roofs in towns, harp signs) and
// OG-014's (the whitewashed thatch village): five plans from it, a cottage (gabled or hipped thatch), a farmhouse, a
// townhouse, a merchant's house with its shop, and a warehouse.
// ?view=street (&mix=a|b|c, &cam=eye|high|cottage|town): a small Gatelands town's street running out to its cottages.
// ?view=line: the six plans in a row with a person at each door and a plaque of its sizes and triangles.
// ?view=kit: the pieces one by one on a flagged floor, each on a wall stub, beside a 1.8 m person.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { loadPack, makePerson, markGenome } from './people.js';
import { Q, W, H, STATS, rnd, fbm, sstep, makeRenderer, makeComposer, buildTextures, mat, worldUV, skyDome, clouds, treeKit, run } from './common.js';

const VIEW = Q.get('view') || 'street', MIX = Q.get('mix') || 'a', CAMQ = Q.get('cam') || 'eye';

// ── the measures (visual-foundation §1): one unit a metre, people 1.6 to 1.9 m ──
export const SCALE = {
  person: 1.8, eye: 1.65, door: { h: 2.05, w: 1.0 }, step: .16, sill: .9, plinth: .45,
  wall: { cottage: .6, house: .5, town: .45, store: .7 },
  storey: { cottage: 2.7, house: [2.9, 2.7], town: [3.3, 3.1, 2.6], shop: [3.6, 3.0, 2.6], store: [3.4, 2.8, 2.8, 2.6] },
  pitch: { thatch: 50, slate: 36, store: 40 }, thatchDepth: .5, slateDepth: .14, pot: .5,
};
const RAD = Math.PI / 180;

// ── materials, by key ──
const RENDER = { lime: 0xf3efe6, cream: 0xeadfc4, ochre: 0xdcb46e, sage: 0xa9b48e, oxblood: 0xa45a48, blue: 0x8ea2b2, rose: 0xd8a596 };
const PAINTS = { green: [.13, .30, .20], red: [.55, .12, .10], blue: [.14, .26, .44], black: [.06, .06, .07], yellow: [.75, .58, .18], teal: [.12, .36, .38] };
let MAT = null;
function mats() {
  if (MAT) return MAT; MAT = {};
  for (const k in RENDER) MAT['w:' + k] = mat('plaster', { ns: .55, color: RENDER[k], rough: .95 });
  MAT.rubble = mat('stone', { ns: 1.0, color: 0xf4efe6 }); MAT.ashlar = mat('ashlar', { ns: .9, color: 0xece6da }); MAT.dress = mat('ashlar', { ns: .7, color: 0xf2ede2 });
  MAT.thatch = mat('thatch', { ns: 1.5, rough: 1, color: 0xffe6c4 }); MAT.slate = mat('slate', { ns: 1.3, rough: .55, color: 0xe0e4ec });
  MAT.ridge = new THREE.MeshStandardMaterial({ color: new THREE.Color(.36, .14, .09), roughness: .7 }); MAT.pot = new THREE.MeshStandardMaterial({ color: new THREE.Color(.62, .30, .18), roughness: .8 });
  MAT.tar = new THREE.MeshStandardMaterial({ color: new THREE.Color(.035, .035, .04), roughness: .45 }); MAT.iron = new THREE.MeshStandardMaterial({ color: new THREE.Color(.06, .06, .065), roughness: .45, metalness: .6 });
  MAT.frame = new THREE.MeshStandardMaterial({ color: new THREE.Color(.90, .88, .82), roughness: .6 }); MAT.board = mat('wood', { ns: 1.1, color: 0xb8a890 });
  MAT.glass = new THREE.MeshStandardMaterial({ color: new THREE.Color(.04, .05, .06), roughness: .05, metalness: .2 });
  MAT.lit = new THREE.MeshStandardMaterial({ color: new THREE.Color(.1, .08, .05), emissive: new THREE.Color(1, .66, .32), emissiveIntensity: .5, roughness: .2 });
  MAT.dark = new THREE.MeshStandardMaterial({ color: new THREE.Color(.025, .02, .016), roughness: 1, side: THREE.BackSide });
  for (const k in PAINTS) { const m = mat('wood', { ns: .7 }); m.color.setRGB(...PAINTS[k].map(v => Math.min(1, v * 2.7)), THREE.SRGBColorSpace); MAT['p:' + k] = m; }
  return MAT;
}
function signMat(text, bg, fg) {
  const c = document.createElement('canvas'); c.width = 1024; c.height = 128; const x = c.getContext('2d'); x.fillStyle = bg; x.fillRect(0, 0, 1024, 128); x.strokeStyle = fg; x.lineWidth = 6; x.strokeRect(10, 10, 1004, 108);
  x.fillStyle = fg; x.font = '600 64px Georgia, serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(text, 512, 68); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
  return new THREE.MeshStandardMaterial({ map: t, roughness: .6 });
}
function harpMat() {
  const c = document.createElement('canvas'); c.width = 256; c.height = 320; const x = c.getContext('2d'); x.fillStyle = '#1f3a2c'; x.fillRect(0, 0, 256, 320); x.strokeStyle = '#d4ad55'; x.lineWidth = 8; x.strokeRect(12, 12, 232, 296);
  x.lineWidth = 12; x.beginPath(); x.moveTo(78, 262); x.lineTo(84, 70); x.quadraticCurveTo(150, 40, 190, 92); x.quadraticCurveTo(150, 170, 92, 262); x.closePath(); x.stroke();
  x.lineWidth = 3; for (let i = 0; i < 7; i++) { const t = (i + 1) / 8; x.beginPath(); x.moveTo(84 + (88 - 84) * t, 70 + 192 * t); x.lineTo(84 + 100 * t, 92 + 40 * t + 0 * i); x.stroke(); }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return new THREE.MeshStandardMaterial({ map: t, roughness: .6 });
}

// ── the bucket: pieces collected by material key, merged per building ──
function bucket() {
  const g = {}; return { g, extra: [],
    add(key, geo, m) { let x = geo.index ? geo.toNonIndexed() : geo.clone(); x.clearGroups(); for (const k of Object.keys(x.attributes)) if (!['position', 'normal', 'uv'].includes(k)) x.deleteAttribute(k);
      if (!x.attributes.uv) x.setAttribute('uv', new THREE.Float32BufferAttribute(new Float32Array(x.attributes.position.count * 2), 2)); if (m) x.applyMatrix4(m); (g[key] ||= []).push(x); return x; } };
}
function finish(bk, name) {
  const M = mats(), grp = new THREE.Group(); let tris = 0, calls = 0;
  for (const k in bk.g) { const geo = mergeGeometries(bk.g[k]), m = new THREE.Mesh(geo, M[k] || bk.mats?.[k]); m.castShadow = !['glass', 'lit', 'dark'].includes(k); m.receiveShadow = true; grp.add(m); tris += geo.attributes.position.count / 3; calls++; }
  grp.userData = { name, tris: Math.round(tris), calls }; return grp;
}
const box = (w, h, d, s = .5) => worldUV(new THREE.BoxGeometry(w, h, d), s);

// an opening's outline: a rectangle, or round-headed (a half circle on its width)
function outline(o, P) { const l = o.x - o.w / 2, r = o.x + o.w / 2, b = o.y, t = o.y + o.h;
  P.moveTo(l, b); P.lineTo(r, b); if (o.arch) { const sp = t - o.w / 2; P.lineTo(r, sp); P.absarc(o.x, sp, o.w / 2, 0, Math.PI, false); } else { P.lineTo(r, t); P.lineTo(l, t); } P.lineTo(l, b); return P; }

// ── the face: a wall slab with its openings, then the pieces on it. Face space: u along the face (right as seen
// from outside), v up, z out of the wall (0 is the outer face, -t the inner) ──
function face(bk, Mf, o) {
  const add = (k, g) => bk.add(k, g, Mf), sh = new THREE.Shape(o.outline.map(([u, v]) => new THREE.Vector2(u, v)));
  for (const op of o.open) sh.holes.push(outline(op, new THREE.Path()));
  const wg = new THREE.ExtrudeGeometry(sh, { depth: o.t, bevelEnabled: false, curveSegments: 12 }); wg.translate(0, 0, -o.t); worldUV(wg, o.fin.uv ?? .42); add(o.fin.key, wg);
  const half = o.outline.reduce((a, p) => Math.max(a, Math.abs(p[0])), 0);
  // the tarred plinth of a cottage, broken at the doors
  if (o.fin.plinth) { let a = -half - .03; const cuts = o.open.filter(p => p.y < .3).sort((p, q) => p.x - q.x).map(p => [p.x - p.w / 2, p.x + p.w / 2]); cuts.push([half + .03, 0]);
    for (const [c0, c1] of cuts) { if (c0 - a > .02) { const g = box(c0 - a, SCALE.plinth, .06); g.translate((a + c0) / 2, SCALE.plinth / 2, .0); add('tar', g); } a = c1; } }
  // string courses at the floors
  for (const y of o.strings || []) { const g = box(half * 2 + .06, .14, .1); g.translate(0, y, .03); add(o.fin.dressKey || 'dress', g); }
  for (const op of o.open) piece(add, op, o);
}

// ── the openings: what fills each hole ──
function piece(add, op, F) {
  const fin = F.fin, inset = op.inset ?? fin.inset, z0 = -inset, l = op.x - op.w / 2, r = op.x + op.w / 2, top = op.y + op.h, spring = op.arch ? top - op.w / 2 : top;
  const B = (k, w, h, d, x, y, z, rz = 0, s = .5) => { const g = box(w, h, d, s); if (rz) g.rotateZ(rz); g.translate(x, y, z); add(k, g); return g; };
  const glass = (y0, k) => { const s = outline({ ...op, y: y0, h: top - y0 }, new THREE.Shape()); const g = new THREE.ShapeGeometry(s, 12); g.translate(0, 0, z0 - .03); add(k || (rnd() < .14 ? 'lit' : 'glass'), g); };
  // a glazed sash: its frame and bars between y0 and y1, c by r panes
  const sash = (y0, y1, c, rr, z = z0) => { const fw = .055; B('frame', op.w, fw, .07, op.x, y0 + fw / 2, z); B('frame', op.w, fw, .07, op.x, y1 - fw / 2, z); B('frame', fw, y1 - y0, .07, l + fw / 2, (y0 + y1) / 2, z); B('frame', fw, y1 - y0, .07, r - fw / 2, (y0 + y1) / 2, z);
    for (let i = 1; i < c; i++) B('frame', .03, y1 - y0, .05, l + op.w * i / c, (y0 + y1) / 2, z); for (let j = 1; j < rr; j++) B('frame', op.w, .03, .05, op.x, y0 + (y1 - y0) * j / rr, z); };
  const fan = (z = z0) => { const rr = op.w / 2, sp = spring; for (let k = 0; k <= 6; k++) { const a = Math.PI * k / 6, g = box(.03, rr, .04); g.translate(0, rr / 2, 0); g.rotateZ(a - Math.PI / 2); g.translate(op.x, sp, z); add('frame', g); }
    const ring = new THREE.TorusGeometry(rr * .38, .02, 4, 16, Math.PI); ring.translate(op.x, sp, z); add('frame', ring); B('frame', op.w, .07, .08, op.x, sp, z); };
  const leaf = (k, x0, x1, y0, y1, z = z0 - .02) => B(k, x1 - x0, y1 - y0, .06, (x0 + x1) / 2, (y0 + y1) / 2, z, 0, .9);
  const step = () => B('dress', op.w + .5, SCALE.step, .42, op.x, SCALE.step / 2, .21);
  // the dressing round an opening: a cut-stone lintel, or a ring of voussoirs with a keystone over a round head
  if (fin.dress || op.dress) { const dk = fin.dressKey || 'dress';
    if (op.arch) { const rr = op.w / 2, s = new THREE.Shape(); s.absarc(op.x, spring, rr + .32, 0, Math.PI, false); s.lineTo(op.x - rr, spring); s.absarc(op.x, spring, rr, Math.PI, 0, true); s.lineTo(op.x + rr + .32, spring);
      const g = new THREE.ExtrudeGeometry(s, { depth: .05, bevelEnabled: false, curveSegments: 14 }); worldUV(g, .6); add(dk, g); B(dk, .3, .42, .09, op.x, spring + rr + .12, .03); }
    else if (op.kind !== 'shopwin' && op.kind !== 'shopdoor') B(dk, op.w + .36, .28, .06, op.x, top + .14, .02); }
  switch (op.kind) {
    case 'win': { glass(op.y); const s2 = op.sash !== false; const yb = op.arch ? spring : top; if (s2) { sash(op.y, (op.y + yb) / 2 + .02, ...op.bars, z0 + .02); sash((op.y + yb) / 2 - .02, yb, ...op.bars, z0 - .02); } else sash(op.y, yb, ...op.bars);
      if (op.arch) fan(); B(fin.sillKey || 'dress', op.w + .2, .08, inset + .1, op.x, op.y - .04, (-inset + .1) / 2); break; }
    case 'half': { // the Irish half-door: the lower leaf shut, the upper leaf open into the dark room
      const hl = 1.12; leaf(F.paint, l, r, op.y, op.y + hl); B('iron', op.w * .5, .04, .015, l + op.w * .25, op.y + .3, z0 + .02); B('iron', op.w * .5, .04, .015, l + op.w * .25, op.y + hl - .25, z0 + .02);
      const g = box(op.w, top - op.y - hl - .02, .06, .9); g.translate(op.w / 2, 0, 0); g.rotateY(1.25); g.translate(l, op.y + hl + (top - op.y - hl) / 2, z0 - .02); add(F.paint, g);
      B('frame', op.w + .02, .05, .1, op.x, op.y + hl, z0 + .03); step(); break; }
    case 'plank': { leaf(op.paint || F.paint, l, r, op.y, spring); if (op.arch) glass(spring, 'glass'); for (const y of [.35, 1.6]) B('iron', op.w * .7, .05, .015, l + op.w * .35, op.y + y, z0 + .02); if (op.y < .3) step(); break; }
    case 'transom': { const tr = .42; leaf(F.paint, l, r, op.y, top - tr); glass(top - tr); sash(top - tr, top, 3, 1); B('iron', .05, .05, .06, r - .16, op.y + 1.05, z0 + .03); step(); break; }
    case 'fan': { leaf(F.paint, l, r, op.y, spring); for (const y of [.5, 1.35]) B(F.paint, op.w - .2, .5, .03, op.x, op.y + y, z0 + .02); glass(spring, 'glass'); fan();
      const kn = new THREE.TorusGeometry(.07, .015, 6, 14); kn.translate(op.x, op.y + 1.55, z0 + .03); add('iron', kn); step(); break; }
    case 'cart': case 'load': { const mid = op.x; leaf('board', l, mid - .01, op.y, spring); leaf('board', mid + .01, r, op.y, spring); if (op.arch) { const s = outline({ ...op, y: spring - .001, h: top - spring + .001 }, new THREE.Shape()); const g = new THREE.ShapeGeometry(s, 12); g.translate(0, 0, z0 - .02); add('board', g); }
      for (const y of [.25, (spring - op.y) * .5, spring - op.y - .25]) { B('iron', op.w * .44, .07, .015, l + op.w * .22, op.y + y, z0 + .02); B('iron', op.w * .44, .07, .015, r - op.w * .22, op.y + y, z0 + .02); }
      if (op.kind === 'load') B('dress', op.w + .2, .1, inset + .1, op.x, op.y - .05, (-inset + .1) / 2); break; }
    case 'shopwin': { glass(op.y, 'glass'); sash(op.y, top, ...(op.bars || [4, 2])); B(F.paint, op.w + .1, op.y, .1, op.x, op.y / 2, z0 + .1); B('dress', op.w + .1, .08, inset + .12, op.x, op.y - .04, (-inset + .12) / 2); break; }
    case 'shopdoor': { const gl = op.y + 1.0; leaf(F.paint, l, r, op.y, gl); glass(gl); sash(gl, top - .5, 2, 2); sash(top - .5, top, 2, 1); step(); break; }
    case 'vent': { glass(op.y, 'glass'); sash(op.y, top, 1, 3); B('dress', op.w + .2, .08, inset + .1, op.x, op.y - .04, (-inset + .1) / 2); break; }
  }
}

// ── a roof as one solid slab: ridge along x, half-length L and half-depth D at the eaves, base ye, thickness t.
// hip: the ends slope too. smooth: normals averaged across the top (thatch reads round over the hips) ──
function roofSolid(L, D, pitch, t, hip, ye, smooth) {
  const tp = Math.tan(pitch), yr = ye + D * tp, tv = t / Math.cos(pitch), RL = hip ? Math.max(.01, L - D) : L, V = (x, y, z) => new THREE.Vector3(x, y, z);
  const b = { A: V(-L, ye, D), B: V(L, ye, D), C: V(L, ye, -D), D: V(-L, ye, -D), R0: V(-RL, yr, 0), R1: V(RL, yr, 0) }, T = {}; for (const k in b) T[k] = b[k].clone().setY(b[k].y + tv);
  const F = [];
  const top = (pts, hint) => F.push({ pts, hint, top: true }), bot = (pts, hint) => F.push({ pts, hint }), up = V(0, 1, 0);
  top([T.A, T.B, T.R1, T.R0], V(0, 1, 1)); top([T.C, T.D, T.R0, T.R1], V(0, 1, -1)); bot([b.A, b.B, b.R1, b.R0], V(0, -1, 0)); bot([b.C, b.D, b.R0, b.R1], V(0, -1, 0));
  bot([b.A, b.B, T.B, T.A], V(0, 0, 1)); bot([b.C, b.D, T.D, T.C], V(0, 0, -1));
  if (hip) { top([T.B, T.C, T.R1], V(1, 1, 0)); top([T.D, T.A, T.R0], V(-1, 1, 0)); bot([b.B, b.C, b.R1], V(0, -1, 0)); bot([b.D, b.A, b.R0], V(0, -1, 0)); bot([b.B, b.C, T.C, T.B], V(1, 0, 0)); bot([b.D, b.A, T.A, T.D], V(-1, 0, 0)); }
  else { bot([b.B, b.R1, T.R1, T.B], V(1, 0, 0)); bot([b.R1, b.C, T.C, T.R1], V(1, 0, 0)); bot([b.D, b.R0, T.R0, T.D], V(-1, 0, 0)); bot([b.R0, b.A, T.A, T.R0], V(-1, 0, 0)); }
  const pos = [], nor = [], uv = [], acc = new Map(), keyOf = v => v.x.toFixed(3) + ',' + v.y.toFixed(3) + ',' + v.z.toFixed(3), tops = [];
  for (const f of F) { let p = f.pts; const n = new THREE.Vector3().subVectors(p[1], p[0]).cross(new THREE.Vector3().subVectors(p[2], p[0])).normalize(); if (n.dot(f.hint) < 0) { p = [...p].reverse(); n.negate(); }
    const e = new THREE.Vector3().crossVectors(up, n); if (e.lengthSq() < 1e-6) e.set(1, 0, 0); e.normalize(); const s = new THREE.Vector3().crossVectors(n, e);
    for (let i = 1; i < p.length - 1; i++) for (const v of [p[0], p[i], p[i + 1]]) { pos.push(v.x, v.y, v.z); nor.push(n.x, n.y, n.z); uv.push(v.dot(e), v.dot(s)); if (f.top && smooth) { tops.push(pos.length / 3 - 1); const k = keyOf(v); acc.set(k, (acc.get(k) || V(0, 0, 0)).add(n)); } } }
  if (smooth) for (const i of tops) { const v = V(pos[i * 3], pos[i * 3 + 1], pos[i * 3 + 2]), n = acc.get(keyOf(v)).clone().normalize(); nor[i * 3] = n.x; nor[i * 3 + 1] = n.y; nor[i * 3 + 2] = n.z; }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); return { g, yr, tv, RL };
}
function scaleUV(g, s) { const u = g.attributes.uv; for (let i = 0; i < u.count; i++) u.setXY(i, u.getX(i) * s, u.getY(i) * s); return g; }

// a chimney stack: its shaft, a drip course and a cap, a pot per flue
function stack(bk, key, x, z, y0, y1, flues, alongZ = true) {
  const a = .72, b = .4 + .36 * flues, sx = alongZ ? a : b, sz = alongZ ? b : a, s = box(sx, y1 - y0, sz, .5); s.translate(x, (y0 + y1) / 2, z); bk.add(key, s);
  const dk = key.startsWith('w:') ? key : 'dress'; const c1 = box(sx + .14, .12, sz + .14); c1.translate(x, y1 - .42, z); bk.add(dk, c1); const c2 = box(sx + .1, .1, sz + .1); c2.translate(x, y1 + .05, z); bk.add(dk, c2);
  for (let i = 0; i < flues; i++) { const o = (i - (flues - 1) / 2) * .36, p = new THREE.CylinderGeometry(.11, .15, SCALE.pot, 10); p.translate(alongZ ? x : x + o, y1 + .1 + SCALE.pot / 2, alongZ ? z + o : z); bk.add('pot', p); }
}

// ── a building from its plan ──
// plan: { name, w, d, t, floors: [m], fin: {key, inset, plinth, quoins, dress, dressKey, sillKey}, paint, roof: {kind, pitch, hip, parapet, ov, ovg},
//   chim: [{x, flues, gable}], open: {front, back, left, right}, strings, cornice, shop, hoist, sign }
export function building(P) {
  const M = mats(), bk = bucket(), { w, d, t } = P, h = P.floors.reduce((a, b) => a + b, 0), roof = P.roof, p = roof.pitch * RAD, tp = Math.tan(p), thatch = roof.kind === 'thatch';
  const rt = thatch ? SCALE.thatchDepth : SCALE.slateDepth, tv = rt / Math.cos(p), di = d / 2 - t, park = .32;
  const F = { fin: P.fin, paint: 'p:' + (P.paint || 'green'), t };
  const basis = (u, n, x, z) => new THREE.Matrix4().makeBasis(u, new THREE.Vector3(0, 1, 0), n).setPosition(x, 0, z);
  const MF = { front: basis(new THREE.Vector3(1, 0, 0), new THREE.Vector3(0, 0, 1), 0, d / 2), back: basis(new THREE.Vector3(-1, 0, 0), new THREE.Vector3(0, 0, -1), 0, -d / 2),
    right: basis(new THREE.Vector3(0, 0, -1), new THREE.Vector3(1, 0, 0), w / 2, 0), left: basis(new THREE.Vector3(0, 0, 1), new THREE.Vector3(-1, 0, 0), -w / 2, 0) };
  const rect = (hw, hh) => [[-hw, 0], [hw, 0], [hw, hh], [-hw, hh]];
  const gableTop = roof.hip ? rect(di, h) : roof.parapet ? [[-di, 0], [di, 0], [di, h + t * tp + tv + park], [0, h + d / 2 * tp + tv + park], [-di, h + t * tp + tv + park]] : [[-di, 0], [di, 0], [di, h + t * tp], [0, h + d / 2 * tp], [-di, h + t * tp]];
  const floorsAt = P.floors.slice(0, -1).reduce((a, f) => (a.push((a.at(-1) || 0) + f), a), []);
  for (const k of ['front', 'back']) face(bk, MF[k], { ...F, outline: rect(w / 2, h), open: P.open[k] || [], strings: P.strings ? floorsAt : [] });
  for (const k of ['left', 'right']) face(bk, MF[k], { ...F, outline: gableTop, open: P.open[k] || [], strings: [] });
  // the dark room behind every opening
  { const g = new THREE.BoxGeometry(w - 2 * t + .04, h - .02, d - 2 * t + .04); g.translate(0, h / 2, 0); bk.add('dark', g); }
  // a footing under the ground line, so a building on a slope has no gap
  { const g = box(w + .1, .8, d + .1); g.translate(0, -.42, 0); bk.add(P.fin.key === 'rubble' ? 'rubble' : 'dress', g); }
  // quoins: dressed blocks wrapping each corner, long and short by turns
  if (P.fin.quoins) for (const sx of [-1, 1]) for (const sz of [-1, 1]) for (let k = 0, y = P.fin.plinth ? SCALE.plinth : .1; y < h - .2; k++, y += .34) {
    const a = k % 2 ? .3 : .55, b2 = k % 2 ? .55 : .3, g = box(a, .3, b2); g.translate(sx * (w / 2 - a / 2 + .03), y + .15, sz * (d / 2 - b2 / 2 + .03)); bk.add(P.fin.dressKey || 'dress', g); }
  // the eaves cornice of a town front
  if (P.cornice) for (const sz of [-1, 1]) { const g = box(w + .06, .26, .26); g.translate(0, h - .13, sz * (d / 2 + .08)); bk.add(P.fin.dressKey || 'dress', g); }
  // the roof
  const ov = roof.ov ?? (thatch ? .45 : .28), D = d / 2 + ov, ye = h - ov * tp, L = roof.hip ? w / 2 + ov : roof.parapet ? w / 2 - t * .5 : w / 2 + (roof.ovg ?? .3);
  const R = roofSolid(L, D, p, rt, roof.hip, ye, thatch); scaleUV(R.g, thatch ? .55 : .5); bk.add(thatch ? 'thatch' : 'slate', R.g);
  const ridgeY = R.yr + R.tv;
  if (thatch) { // the ridge: a roll, and a block-cut band with a scalloped lower edge down each slope, pinned with hazel liggers
    const RLr = roof.hip ? R.RL : L - .05, roll = new THREE.CylinderGeometry(.34, .34, RLr * 2 + (roof.hip ? .6 : .2), 14); roll.rotateZ(Math.PI / 2); scaleUV(roll, 3); roll.translate(0, ridgeY - .08, 0); bk.add('thatch', roll);
    for (const sz of [1, -1]) { const S = new THREE.Vector3(0, -Math.sin(p), sz * Math.cos(p)), N = new THREE.Vector3(0, Math.cos(p), sz * Math.sin(p)), X = new THREE.Vector3(-sz, 0, 0);
      const len = RLr * 2 + (roof.hip ? .4 : 0), n = Math.max(2, Math.round(len / .55)), s = new THREE.Shape(); s.moveTo(-len / 2, 0); s.lineTo(len / 2, 0);
      for (let i = n; i >= 0; i--) { const u = -len / 2 + len * i / n; s.lineTo(u, i % 2 ? .62 : .95); } s.lineTo(-len / 2, 0);
      const g = new THREE.ExtrudeGeometry(s, { depth: .1, bevelEnabled: true, bevelThickness: .04, bevelSize: .04, bevelSegments: 2 }); worldUV(g, .55);
      g.applyMatrix4(new THREE.Matrix4().makeBasis(X, S, N).setPosition(0, ridgeY - .12, 0)); bk.add('thatch', g);
      for (const y of [.12, .5]) { const lg = new THREE.CylinderGeometry(.018, .018, len, 5); lg.rotateZ(Math.PI / 2); lg.translate(0, 0, 0); lg.applyMatrix4(new THREE.Matrix4().makeBasis(new THREE.Vector3(1, 0, 0), S, N).setPosition(0, ridgeY - .12, 0).multiply(new THREE.Matrix4().makeTranslation(0, y, .14))); bk.add('board', lg); } }
  } else { // half-round clay ridge tiles, and on the hips; a cast-iron gutter and a downpipe
    const rl = new THREE.CylinderGeometry(.13, .13, (roof.hip ? R.RL : L) * 2 + .1, 10, 1, false); rl.rotateZ(Math.PI / 2); rl.translate(0, ridgeY + .02, 0); bk.add('ridge', rl);
    if (P.gutter !== false) for (const sz of [-1, 1]) { const gt = new THREE.CylinderGeometry(.075, .075, L * 2, 8); gt.rotateZ(Math.PI / 2); gt.translate(0, ye - .06, sz * (D - .03)); bk.add('iron', gt);
      const dp = new THREE.CylinderGeometry(.045, .045, ye, 8); dp.translate(sz * (w / 2 - .25), ye / 2, sz * (d / 2 + .07)); bk.add('iron', dp); }
  }
  // the gable parapets: coping along the slopes and a kneeler at each foot
  if (roof.parapet) for (const k of ['left', 'right']) { const Mf = MF[k], yTop = h + t * tp + tv + park, slope = (di) / Math.cos(p);
    for (const su of [-1, 1]) { const g = box(slope + .2, .14, t + .12); g.rotateZ(-su * p); g.translate(su * di / 2, yTop + di * tp / 2 + .07, -t / 2); g.applyMatrix4(Mf); bk.add('dress', g);
      const kn = box(t + .2, yTop - h + .3, .2 + t); kn.translate(su * (d / 2 - (t + .2) / 2 + .05), h + (yTop - h + .3) / 2, -t / 2); kn.applyMatrix4(Mf); bk.add('dress', kn); } }
  // chimneys: on a gable (in the wall) or on the ridge
  for (const c of P.chim || []) { const x = c.gable ? c.gable * (w / 2 - .36) : c.x, key = P.fin.key === 'rubble' ? 'rubble' : P.fin.stackKey || P.fin.key; stack(bk, key, x, 0, h - .6, ridgeY + (thatch ? 1.0 : .85), c.flues || 1, true); }
  // the shopfront: pilasters, a fascia with the name, a cornice
  if (P.shop) { const S = P.shop, Mf = MF.front, A = (k, w2, h2, d2, x, y, z) => { const g = box(w2, h2, d2, .5); g.translate(x, y, z); g.applyMatrix4(Mf); bk.add(k, g); };
    for (const sx of [-1, 1]) { A('p:' + S.paint, .38, S.top, .16, sx * (S.w / 2 - .19), S.top / 2, .08); A('dress', .48, .2, .22, sx * (S.w / 2 - .19), .1, .11); A('p:' + S.paint, .44, .22, .2, sx * (S.w / 2 - .19), S.top - .55, .1); }
    A('p:' + S.paint, S.w, .62, .14, 0, S.top + .26, .07); A('p:' + S.paint, S.w + .24, .14, .34, 0, S.top + .64, .17); A('iron', S.w + .2, .03, .3, 0, S.top + .72, .17);
    bk.mats = bk.mats || {}; bk.mats.fascia = signMat(S.name, '#1d3226', '#e3c26a'); const fg = new THREE.PlaneGeometry(S.w - .9, .46); fg.translate(0, S.top + .26, .145); fg.applyMatrix4(Mf); bk.add('fascia', fg); }
  // the hoist: a beam out of the gable over the loading doors, a pulley and a rope
  if (P.hoist) { const Mf = MF[P.hoist.face], y = P.hoist.y, A = (k, g) => { g.applyMatrix4(Mf); bk.add(k, g); };
    { const g = box(.26, .3, 1.9, .8); g.translate(0, y, .5); A('board', g); } { const g = box(1.2, .12, 1.1); g.rotateX(-.25); g.translate(0, y + .55, .7); A('slate', g); }
    { const g = new THREE.TorusGeometry(.16, .04, 6, 16); g.rotateY(Math.PI / 2); g.translate(0, y - .3, 1.2); A('iron', g); } { const g = new THREE.CylinderGeometry(.018, .018, 4.2, 5); g.translate(0, y - .3 - 2.1, 1.36); A('board', g); } }
  // a hanging trade sign on an iron bracket
  if (P.sign) { const S = P.sign, Mf = MF.front, A = (k, g) => { g.applyMatrix4(Mf); bk.add(k, g); };
    { const g = box(.05, .05, 1.15); g.translate(S.x, S.y, .58); A('iron', g); } { const g = box(.04, .5, .04); g.rotateX(.9); g.translate(S.x, S.y - .2, .2); A('iron', g); }
    bk.mats = bk.mats || {}; bk.mats.harp = harpMat(); { const g = box(.06, .82, .66); g.translate(S.x, S.y - .5, .78); A('board', g); }
    for (const sx of [1, -1]) { const g = new THREE.PlaneGeometry(.6, .76); g.rotateY(sx * Math.PI / 2); g.translate(S.x + sx * .032, S.y - .5, .78); A('harp', g); } }
  const grp = finish(bk, P.name); grp.userData.plan = P; grp.userData.size = { w, d, eave: +h.toFixed(2), ridge: +(ridgeY).toFixed(2) };
  // where to stand a person: before the first door of the front (or the face named)
  const dface = P.doorFace || 'front', door = (P.open[dface] || []).find(o => /half|fan|transom|plank|shopdoor|cart/.test(o.kind));
  if (door) { const v = new THREE.Vector3(door.x + .9, 0, .9).applyMatrix4(MF[dface]); grp.userData.door = v; }
  return grp;
}

// ── the plans ──
const FIN = {
  lime: () => ({ key: 'w:lime', inset: .3, plinth: true, sillKey: 'w:lime', stackKey: 'w:lime' }),
  render: c => ({ key: 'w:' + c, inset: .16, quoins: true, dress: false, uv: .42 }),
  whiteTown: () => ({ key: 'w:lime', inset: .16, quoins: false, stackKey: 'w:lime' }),
  stone: () => ({ key: 'rubble', inset: .18, quoins: true, dress: true, uv: .8 }),
  ashlar: () => ({ key: 'ashlar', inset: .18, quoins: false, dress: true, uv: .32 }),
};
const win = (x, y, w, h, bars, o = {}) => ({ kind: 'win', x, y, w, h, bars, ...o });
export const PLANS = {
  cottage: (o = {}) => ({ name: 'Cottage', w: 9.6, d: 5.4, t: SCALE.wall.cottage, floors: [SCALE.storey.cottage], fin: FIN.lime(), paint: o.paint || 'red',
    roof: { kind: 'thatch', pitch: SCALE.pitch.thatch, hip: !!o.hip, ov: .45, ovg: .35 }, chim: o.hip ? [{ x: -1.7 }, { x: 2.9 }] : [{ x: -1.7 }, { gable: 1 }],
    open: { front: [{ kind: 'half', x: -.6, y: 0, w: .95, h: 2.0 }, win(-3.2, .95, .78, 1.0, [2, 1]), win(1.5, .95, .78, 1.0, [2, 1]), win(3.4, .95, .78, 1.0, [2, 1])],
      back: [{ kind: 'plank', x: 1.2, y: 0, w: .9, h: 1.95 }, win(-2.4, 1.0, .7, .9, [2, 1])], left: o.hip ? [] : [win(0, 2.9, .5, .6, [1, 1], { sash: false })] } }),
  farmhouse: (o = {}) => ({ name: 'Farmhouse', w: 10.5, d: 6.2, t: SCALE.wall.house, floors: SCALE.storey.house, fin: o.fin || FIN.whiteTown(), paint: o.paint || 'green',
    roof: { kind: 'slate', pitch: SCALE.pitch.slate + 2, parapet: true, ov: .28 }, chim: [{ gable: -1, flues: 2 }, { gable: 1, flues: 2 }],
    open: { front: [{ kind: 'transom', x: 0, y: 0, w: 1.05, h: 2.5 }, win(-3.1, .85, .95, 1.5, [3, 2]), win(3.1, .85, .95, 1.5, [3, 2]), win(-3.1, 3.55, .9, 1.3, [3, 2]), win(0, 3.55, .9, 1.3, [3, 2]), win(3.1, 3.55, .9, 1.3, [3, 2])],
      back: [{ kind: 'plank', x: -1.5, y: 0, w: .95, h: 2.05 }, win(2, 1.0, .8, 1.2, [2, 2]), win(-1.5, 3.6, .8, 1.1, [2, 2])] } }),
  townhouse: (o = {}) => { const g = SCALE.storey.town; return { name: 'Townhouse', w: 6.4, d: 9, t: SCALE.wall.town, floors: g, fin: o.fin || FIN.render(o.color || 'ochre'), paint: o.paint || 'blue', strings: true, cornice: true,
    roof: { kind: 'slate', pitch: SCALE.pitch.slate, parapet: true, ov: .25 }, chim: [{ gable: -1, flues: 4 }, { gable: 1, flues: 4 }],
    open: { front: [{ kind: 'fan', x: o.doorX ?? -1.95, y: 0, w: 1.1, h: 2.95, arch: true, dress: true }, ...[0, 1.95].map(x => win((o.doorX ?? -1.95) < 0 ? x : -x, .75, .95, 1.85, [3, 2])),
      ...[-1.95, 0, 1.95].map(x => win(x, g[0] + .4, 1.0, 2.15, [3, 3])), ...[-1.95, 0, 1.95].map(x => win(x, g[0] + g[1] + .35, .95, 1.4, [3, 1]))],
      back: [{ kind: 'plank', x: 1.6, y: 0, w: .95, h: 2.1 }, win(-1.2, .9, .9, 1.6, [2, 2]), win(0, g[0] + .4, .9, 1.7, [2, 2]), win(0, g[0] + g[1] + .35, .9, 1.4, [2, 2])] } }; },
  merchant: (o = {}) => { const g = SCALE.storey.shop; return { name: 'Merchant’s house and shop', w: 8.4, d: 9, t: SCALE.wall.town, floors: g, fin: o.fin || FIN.render(o.color || 'cream'), paint: o.paint || 'green', strings: true, cornice: true,
    roof: { kind: 'slate', pitch: SCALE.pitch.slate, parapet: true, ov: .25 }, chim: [{ gable: -1, flues: 3 }, { gable: 1, flues: 3 }], shop: { w: 8.0, top: 2.9, paint: o.paint || 'green', name: o.trade || 'WOOL · LINEN · DRAPERY' },
    sign: { x: -4.0, y: g[0] + .55 }, doorFace: 'front',
    open: { front: [{ kind: 'shopwin', x: -1.05, y: .62, w: 4.6, h: 2.05, bars: [4, 2] }, { kind: 'shopdoor', x: 2.55, y: 0, w: 1.1, h: 2.65 }, ...[-2.9, -.95, .95, 2.9].map(x => win(x, g[0] + .4, .95, 1.95, [3, 3])), ...[-2.9, -.95, .95, 2.9].map(x => win(x, g[0] + g[1] + .35, .9, 1.35, [3, 1]))],
      back: [{ kind: 'plank', x: -2.2, y: 0, w: 1.0, h: 2.1 }, win(1.5, .9, .9, 1.6, [2, 2]), win(1.5, g[0] + .4, .9, 1.7, [2, 2])] } }; },
  warehouse: (o = {}) => { const g = SCALE.storey.store, ys = g.reduce((a, f) => (a.push((a.at(-1) ?? 0) + f), a), [0]); return { name: 'Warehouse', w: 12, d: 10, t: SCALE.wall.store, floors: g, fin: o.fin || FIN.stone(), paint: 'black',
    roof: { kind: 'slate', pitch: SCALE.pitch.store, parapet: true, ov: .3 }, chim: [], hoist: { face: 'right', y: ys[4] + .75 }, doorFace: 'right',
    open: { front: [0, 1, 2, 3].flatMap(s => [-4.4, -2.2, 0, 2.2, 4.4].map(x => win(x, ys[s] + (s ? .7 : 1.4), .8, 1.1, [2, 2], { sash: false }))),
      back: [0, 1, 2, 3].flatMap(s => [-3.3, 0, 3.3].map(x => win(x, ys[s] + (s ? .7 : 1.4), .8, 1.1, [2, 2], { sash: false }))),
      right: [{ kind: 'cart', x: 0, y: 0, w: 3.4, h: 4.1, arch: true }, ...[1, 2, 3].map(s => ({ kind: 'load', x: 0, y: ys[s] + .2, w: 1.5, h: 2.2 })), ...[0, 1, 2, 3].flatMap(s => [-2.9, 2.9].map(x => win(x, ys[s] + (s ? .7 : 1.4), .8, 1.1, [2, 2], { sash: false }))),
        { kind: 'vent', x: 0, y: ys[4] + 1.6, w: .8, h: 1.3, arch: true }],
      left: [0, 1, 2, 3].flatMap(s => [-2.9, 2.9].map(x => win(x, ys[s] + (s ? .7 : 1.4), .8, 1.1, [2, 2], { sash: false })))} }; },
};

// ═══════════════════════════════ the scenes ═══════════════════════════════
const R = makeRenderer(.82);
const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(new THREE.Color(.72, .80, .90), VIEW === 'street' ? .0024 : .0012);
const cam = new THREE.PerspectiveCamera(VIEW === 'line' ? 34 : 52, W / H, .1, 30000);
buildTextures(); const MM = mats();
const SUN = VIEW === 'street' ? new THREE.Vector3(.62, .48, .30).normalize() : new THREE.Vector3(-.45, .55, .70).normalize();
const sun = new THREE.DirectionalLight(new THREE.Color(1, .9, .76), 3.5), focus = VIEW === 'street' ? new THREE.Vector3(0, 0, -22) : new THREE.Vector3(0, 0, 0);
sun.position.copy(SUN).multiplyScalar(140).add(focus); sun.target.position.copy(focus); sun.castShadow = true; sun.shadow.mapSize.set(4096, 4096);
Object.assign(sun.shadow.camera, { left: -46, right: 46, top: 46, bottom: -46, near: 1, far: 360 }); sun.shadow.bias = -.0003; sun.shadow.normalBias = .04;
scene.add(sun, sun.target, new THREE.HemisphereLight(new THREE.Color(.62, .74, .96), new THREE.Color(.42, .36, .26), 1.2));
skyDome(scene, SUN); clouds(scene, SUN, { n: 20, d0: 1600, dw: 5000, y0: 260 });

const gy = VIEW === 'street' ? (x, z) => 26 * sstep(28, 160, Math.abs(x)) * (fbm(x / 140, z / 140, 3) + .5) + 40 * Math.exp(-((x - 40) ** 2 + (z + 330) ** 2) / (2 * 110 ** 2)) * sstep(130, 220, -z) : (x, z) => 30 * sstep(60, 260, Math.hypot(x, z)) * (fbm(x / 150, z / 150, 3) + .5);
// the ground: grass, worn to earth where it is walked
{ const g = new THREE.PlaneGeometry(1600, 1600, 320, 320); g.rotateX(-Math.PI / 2); const P = g.attributes.position;
  for (let i = 0; i < P.count; i++) { const x = P.getX(i), z = P.getZ(i) - 200; P.setXYZ(i, x, gy(x, z) - .03, z); } g.computeVertexNormals();
  const m = new THREE.MeshStandardMaterial({ roughness: .95 });
  m.onBeforeCompile = s => { s.vertexShader = 'varying vec3 vW;\n' + s.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\n vW = (modelMatrix * vec4(position,1.)).xyz;');
    s.fragmentShader = 'varying vec3 vW;\n' + `float h1(vec2 p){ p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
      float v1(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f); return mix(mix(h1(i), h1(i + vec2(1,0)), f.x), mix(h1(i + vec2(0,1)), h1(i + vec2(1,1)), f.x), f.y); }
      float f1(vec2 p){ float a = 0., m = .5; for (int i = 0; i < 5; i++) { a += m * v1(p); p = p * 2.03 + 17.1; m *= .5; } return a; }\n` + s.fragmentShader.replace('vec4 diffuseColor = vec4( diffuse, opacity );', `
      float n1 = f1(vW.xz / 6.), n2 = f1(vW.xz * 1.7);
      vec3 grass = mix(vec3(.20,.36,.09), vec3(.40,.52,.15), n1) * (.85 + .3 * n2);
      vec3 earth = mix(vec3(.36,.30,.21), vec3(.46,.39,.28), n2);
      vec4 diffuseColor = vec4(mix(grass, earth, .25 * n1), opacity );`); };
  const mesh = new THREE.Mesh(g, m); mesh.receiveShadow = true; scene.add(mesh); }
const flat = (key, w, d, x, z, y = 0, s = .4) => { const g = new THREE.PlaneGeometry(w, d); g.rotateX(-Math.PI / 2); const uv = g.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * w * s, uv.getY(i) * d * s); const m = new THREE.Mesh(g, typeof key === 'string' ? mat(key, { ns: 1.4, rough: .85 }) : key); m.position.set(x, y, z); m.receiveShadow = true; scene.add(m); return m; };
const people = [], plaques = [];
const BUILT = {};
function put(g, x, z, ry, y = 0) { g.position.set(x, y, z); g.rotation.y = ry; scene.add(g); g.updateMatrixWorld(true); const u = g.userData; BUILT[u.name] ||= { tris: u.tris, calls: u.calls, ...u.size }; return g; }
function personAt(g, dx = 0, dz = 0, ry) { if (!g.userData.door) return; const v = g.userData.door.clone().applyMatrix4(g.matrixWorld); people.push([v.x + dx, v.z + dz, ry ?? g.rotation.y + Math.PI * .85]); }
// the Gatelanders (OG-048): shorter and wiry, red hair common, moss green and madder red wool; the lane's genome, dressed for them
const GL_HAIR = [[.62, .30, .14], [.50, .26, .14], [.40, .28, .18], [.72, .44, .22], [.30, .22, .15]], GL_WOOL = [[.24, .34, .18], [.52, .16, .12], [.36, .30, .22], [.22, .26, .30], [.46, .40, .30]];
function gateGenome(r, g) { const G = markGenome(r, g, { mantle: false, hair: GL_HAIR[Math.floor(r() * GL_HAIR.length)] }); G.height = g > .5 ? .4 + r() * .22 : .3 + r() * .22; G.muscle = .45 + r() * .2; G.weight = .4 + r() * .2;
  G.dress.tunic = GL_WOOL[Math.floor(r() * GL_WOOL.length)]; if (G.dress.skirtColor) G.dress.skirtColor = GL_WOOL[Math.floor(r() * GL_WOOL.length)]; return G; }

if (VIEW === 'street') {
  // a street of a small town (9.6 m between the fronts: a 6.4 m cobbled way, flagged footpaths), running out past the last houses to cottages
  const mixA = MIX === 'a', mixB = MIX === 'b', mixC = MIX === 'c';
  const town = (c, i) => mixB ? FIN.whiteTown() : mixC ? (i % 3 === 1 ? FIN.ashlar() : FIN.stone()) : FIN.render(c);
  flat('cobble', 6.4, 120, 0, -48, .0, .6); for (const sx of [-1, 1]) flat('flag', 1.6, 120, sx * 4.0, -48, .06, .45);
  for (const sx of [-1, 1]) { const g = box(.18, .14, 120); g.translate(sx * 3.2, .02, -48); const m = new THREE.Mesh(g, MM.dress); m.receiveShadow = true; scene.add(m); }
  const L = [['townhouse', 'ochre', 'blue'], ['townhouse', 'rose', 'black'], ['merchant', 'cream', 'green'], ['townhouse', 'sage', 'red'], ['gap', 5], ['farmhouse'], ['gap', 4], ['cottage', 0, 'red'], ['gap', 3], ['cottage', 1, 'blue']];
  const Rr = [['warehouse'], ['townhouse', 'blue', 'red'], ['townhouse', 'oxblood', 'green'], ['townhouse', 'cream', 'black'], ['gap', 7], ['cottage', 0, 'green'], ['gap', 3], ['cottage', 1, 'red'], ['gap', 4], ['cottage', 0, 'yellow']];
  for (const [side, list] of [[-1, L], [1, Rr]]) { let z = side < 0 ? 6 : 3, i = 0;
    for (const [k, a, b] of list) { if (k === 'gap') { z -= a; continue; } let P;
      if (k === 'townhouse') P = PLANS.townhouse({ color: a, paint: b, fin: town(a, i), doorX: i % 2 ? 1.95 : -1.95 }); else if (k === 'merchant') P = PLANS.merchant({ color: a, paint: b, fin: town(a, i) });
      else if (k === 'warehouse') P = PLANS.warehouse({ fin: mixB ? FIN.whiteTown() : FIN.stone() }); else if (k === 'farmhouse') P = PLANS.farmhouse({ fin: mixC ? FIN.stone() : FIN.whiteTown() }); else P = PLANS.cottage({ hip: !!a, paint: b });
      const g = building(P), set = k === 'farmhouse' ? 3.5 : k === 'cottage' ? 1.5 : 0, along = k === 'warehouse' ? P.d : P.w, across = k === 'warehouse' ? P.w : P.d;
      const ry = k === 'warehouse' ? (side < 0 ? 0 : Math.PI) : side < 0 ? Math.PI / 2 : -Math.PI / 2, x = side * (4.8 + set + across / 2), zc = z - along / 2;
      put(g, x, zc, ry, k === 'cottage' || k === 'farmhouse' ? gy(x, zc) : 0); z -= along + (k === 'cottage' ? 0 : .0); i++;
      if (k !== 'warehouse' && i % 2 === 1 && people.length < 7) personAt(g, 0, 0, side < 0 ? Math.PI / 2 + .4 : -Math.PI / 2 - .3); }
  }
  // field walls along the cottages' plots, a high cross on the green at the end, trees behind
  { const stones = []; for (const sx of [-1, 1]) for (let z = -70; z > -96; z -= .7) { const g = box(.75, .5 + rnd() * .35, .55 + rnd() * .2, .9); g.rotateY((rnd() - .5) * .3); g.translate(sx * (4.9 + rnd() * .1), .3, z); stones.push(g); }
    const m = new THREE.Mesh(mergeGeometries(stones), MM.rubble); m.castShadow = m.receiveShadow = true; scene.add(m); }
  { const parts = [], add = (g, y) => { worldUV(g, .6); g.translate(0, y, 0); parts.push(g.index ? g.toNonIndexed() : g); };
    add(new THREE.BoxGeometry(1.4, .9, 1.0), .45); add(new THREE.BoxGeometry(.5, 3.2, .3), 2.5); add(new THREE.BoxGeometry(1.7, .42, .3), 3.25);
    { const s = new THREE.Shape(); s.absarc(0, 0, .62, 0, Math.PI * 2, false); const hole = new THREE.Path(); hole.absarc(0, 0, .44, 0, Math.PI * 2, true); s.holes.push(hole); const g = new THREE.ExtrudeGeometry(s, { depth: .22, bevelEnabled: false, curveSegments: 24 }); g.translate(0, 0, -.11); add(g, 3.25); }
    const m = new THREE.Mesh(mergeGeometries(parts.map(p => { for (const k of Object.keys(p.attributes)) if (!['position', 'normal', 'uv'].includes(k)) p.deleteAttribute(k); return p; })), mat('lichen', { ns: 1.2 })); m.position.set(1.0, gy(1, -104), -104); m.rotation.y = .3; m.castShadow = true; scene.add(m); }
  const trees = treeKit(SUN), tl = []; for (let i = 0; i < 240; i++) { const x = (rnd() - .5) * 400, z = 10 - rnd() * 420; if (Math.abs(x) < 26 && z > -95) continue; if (Math.abs(x) < 8) continue; tl.push([x, gy(x, z), z, .7 + rnd() * .6, rnd() * 6.3, new THREE.Color(.86 + .2 * rnd(), .95 + .1 * rnd(), .62 + .1 * rnd())]); }
  tl.push([15, gy(15, -84), -84, 1.1, 1.2], [-9, gy(-9, -112), -112, 1.3, 2]); trees.plant(scene, tl);
  people.push([.6, -3.5, Math.PI * .1], [-1.4, -11, -Math.PI * .7]);
  const C = { eye: [[.6, 1.65, 9], [0, 1.9, -30]], high: [[14, 17, -80], [-3, 2, -24]], cottage: [[-.6, 1.65, -40.2], [-6.6, 1.5, -46.8]], town: [[1.4, 1.65, 2.0], [-6.5, 2.6, -4.4]] }[CAMQ] || [[.6, 1.65, 9], [0, 1.9, -30]];
  cam.position.set(...C[0]); cam.lookAt(...C[1]); if (CAMQ === 'town' || CAMQ === 'cottage') cam.fov = 58; cam.updateProjectionMatrix();
}

if (VIEW === 'line') {
  // the plans in a row on a flagged yard, a person at each door, a plaque before each with its sizes and its triangles
  flat(mat('plaster', { ns: 1.2, color: 0xb9b1a2, rough: .95 }), 92, 34, -10, 2, .01, .6);
  const row = [PLANS.cottage({ paint: 'red' }), { ...PLANS.cottage({ hip: true, paint: 'blue' }), name: 'Cottage, hipped' }, PLANS.farmhouse({}), PLANS.townhouse({ color: 'ochre' }), PLANS.merchant({ color: 'cream' }), PLANS.warehouse({})];
  let x = -44;
  for (const P of row) { const wh = P.name === 'Warehouse', along = wh ? P.d : P.w, g = building(P); x += along / 2; put(g, x, wh ? -P.w / 2 + 4 : -P.d / 2 + 4, wh ? -Math.PI / 2 : 0);
    personAt(g, -.3, .4, Math.PI * .08 + (rnd() - .5) * .4); plaques.push([x, 7.4, g.userData]); x += along / 2 + 2.6; }
  cam.fov = 44; cam.updateProjectionMatrix(); cam.position.set(-10.25, 3.4, 54); cam.lookAt(-10.25, 6.6, 0);
}

if (VIEW === 'kit') {
  // each piece on a wall stub 3.2 m wide, in the finish it belongs to; and the three roofs and two stacks on small houses
  flat(mat('plaster', { ns: 1.2, color: 0xb9b1a2, rough: .95 }), 70, 40, 4, -2, .01, .6);
  const stubs = [
    ['Cottage window, 2 over 2', FIN.lime(), 'red', [win(0, .95, .78, 1.0, [2, 1])], .6, 2.7],
    ['The half-door', FIN.lime(), 'red', [{ kind: 'half', x: 0, y: 0, w: .95, h: 2.0 }], .6, 2.7],
    ['Farm door with a transom', FIN.whiteTown(), 'green', [{ kind: 'transom', x: 0, y: 0, w: 1.05, h: 2.5 }], .5, 3.1],
    ['Town door, round-headed, fanlight', FIN.render('ochre'), 'blue', [{ kind: 'fan', x: 0, y: 0, w: 1.1, h: 2.95, arch: true, dress: true }], .45, 3.6],
    ['Town sash, 6 over 6, quoins', FIN.render('sage'), 'blue', [win(0, .75, .95, 1.85, [3, 2])], .45, 3.3],
    ['Shop window and door', FIN.render('cream'), 'green', [{ kind: 'shopwin', x: -.55, y: .62, w: 2.2, h: 2.05, bars: [2, 2] }, { kind: 'shopdoor', x: 1.35, y: 0, w: 1.05, h: 2.65 }], .45, 3.6],
    ['Cart arch, voussoirs', FIN.stone(), 'black', [{ kind: 'cart', x: 0, y: 0, w: 3.0, h: 3.9, arch: true }], .7, 4.6],
    ['Loading door', FIN.stone(), 'black', [{ kind: 'load', x: 0, y: .3, w: 1.5, h: 2.2 }], .7, 3.0],
  ];
  stubs.forEach(([name, fin, paint, open, t, hh], i) => { const bk = bucket(), wd = name.startsWith('Cart') ? 4.6 : name.startsWith('Shop') ? 4.2 : 3.2;
    face(bk, new THREE.Matrix4(), { fin, paint: 'p:' + paint, t, outline: [[-wd / 2, 0], [wd / 2, 0], [wd / 2, hh], [-wd / 2, hh]], open, strings: [] });
    { const g = new THREE.BoxGeometry(wd - .04, hh, 1.2); g.translate(0, hh / 2, -t - .6); bk.add('dark', g); } if (fin.quoins) for (let k = 0, y = .1; y < hh - .2; k++, y += .34) { const a = k % 2 ? .3 : .55, g = box(a, .3, t + .06); g.translate(wd / 2 - a / 2 + .03, y + .15, -t / 2 + .03); bk.add('dress', g); }
    { const g = box(wd + .1, .12, t + .1); g.translate(0, hh + .06, -t / 2); bk.add(fin.key === 'rubble' ? 'dress' : fin.key, g); }
    const grp = finish(bk, name), col = i % 4, rowi = Math.floor(i / 4); put(grp, -10.5 + col * 6.5 + (rowi ? 1.6 : -1.6), rowi ? 6 : -4, 0); plaques.push([grp.position.x, grp.position.z + 2.3, { name, tris: grp.userData.tris, calls: grp.userData.calls, size: null }]);
    if (i === 1 || i === 3 || i === 6) people.push([grp.position.x + 1.1, grp.position.z + .9, -.3]); });
  // three roofs on small houses: gabled thatch with its scalloped ridge, hipped thatch, slate between parapets
  const small = [PLANS.cottage({ paint: 'green' }), PLANS.cottage({ hip: true, paint: 'yellow' }), { ...PLANS.farmhouse({}), name: 'Slate, parapets, kneelers' }];
  small[0].w = small[1].w = 6.6; small[0].name = 'Thatch, gabled: scalloped ridge'; small[1].name = 'Thatch, hipped'; for (const s of small.slice(0, 2)) { s.open.front = [{ kind: 'half', x: -.6, y: 0, w: .95, h: 2.0 }, win(1.6, .95, .78, 1.0, [2, 1])]; s.chim = s.roof.hip ? [{ x: 1.4 }] : [{ gable: 1 }]; }
  small[2].w = 7.5; small[2].open.front = [{ kind: 'transom', x: -1.6, y: 0, w: 1.05, h: 2.5 }, win(1.6, .85, .95, 1.5, [3, 2]), win(-1.6, 3.55, .9, 1.3, [3, 2]), win(1.6, 3.55, .9, 1.3, [3, 2])];
  small.forEach((P, i) => { const g = building(P), x = -10.5 + i * 10.5; put(g, x, -18, 0); plaques.push([x, -13.4, { name: P.name, tris: g.userData.tris, calls: g.userData.calls, size: g.userData.size }]); if (i === 0) personAt(g, .3, 0, Math.PI); });
  cam.position.set(0, 12.5, 23); cam.lookAt(0, 0.6, -5); cam.fov = 58; cam.updateProjectionMatrix();
}
STATS.plans = BUILT; STATS.view = VIEW; STATS.mix = MIX;

// the plaques: a slate on a little easel, with the name, the sizes and the triangles
function plaque(x, z, u, ry = 0) {
  const c = document.createElement('canvas'); c.width = 1024; c.height = 300; const k = c.getContext('2d'); k.fillStyle = '#26282b'; k.fillRect(0, 0, 1024, 300); k.strokeStyle = '#d9c896'; k.lineWidth = 6; k.strokeRect(12, 12, 1000, 276);
  k.fillStyle = '#f0e6cc'; k.font = '600 66px Georgia, serif'; k.textAlign = 'center'; k.fillText(u.name, 512, 100); k.font = '44px Georgia, serif'; k.fillStyle = '#d9cfb4';
  const s = u.size; if (s) k.fillText(`${s.w} × ${s.d} m · eaves ${s.eave} m · ridge ${s.ridge} m`, 512, 175); k.fillText(`${u.tris.toLocaleString('en-GB')} triangles · ${u.calls} draw calls`, 512, s ? 245 : 190);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; const m = new THREE.Mesh(new THREE.PlaneGeometry(3.4, 1.0), new THREE.MeshStandardMaterial({ map: t, roughness: .8 }));
  m.position.set(x, .72, z); m.rotation.set(-.45, ry, 0, 'YXZ'); scene.add(m); const leg = new THREE.Mesh(new THREE.BoxGeometry(.06, .6, .06), MM.iron); leg.position.set(x, .3, z - .1); scene.add(leg);
}
for (const [x, z, u] of plaques) plaque(x, z, u, 0);

const comp = makeComposer(R, scene, cam, { bloom: .16, sat: 1.06 });
loadPack('mh/').then(() => { let k = 0;
  for (const [x, z, ry] of people) { const pr = (() => { let s = 1013 + k * 7919; return () => ((s = (s * 16807) % 2147483647) - 1) / 2147483646; })(), p = makePerson(gateGenome(pr, k % 2 ? 0 : 1)); k++;
    p.root.position.x = x; p.root.position.z = z; p.root.position.y += gy(x, z) + (VIEW === 'street' && Math.abs(x) > 3.2 && Math.abs(x) < 4.8 ? .06 : 0); p.root.rotation.y = ry; scene.add(p.root);
    p.root.updateMatrixWorld(true); const bb = new THREE.Box3().setFromObject(p.root); (STATS.heights ||= []).push(+(bb.max.y - bb.min.y).toFixed(2)); }
  STATS.people = people.length; run(comp, cam); }).catch(e => { window.__err = String(e); console.error(e); run(comp, cam); });
