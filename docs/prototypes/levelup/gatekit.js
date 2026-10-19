// One piece in three conditions (Session 1097; backlog L10, OG-126, card F5's and card F6's kit): the gates' architecture as pieces
// a generator can lay, each made of its stones, so a condition is a rule over the stones and never a second model. Every piece is
// a list of blocks (a stone or a run of moulding, with the script cut on it); a condition moves the blocks:
//   'whole'   (a steady gate)   every stone in place, the script burning amber;
//   'cracked' (a failing gate)  the piece leans 1.5 to 3° on its foot, a stone in four slips or turns, cracks run dark across the
//                               faces, the script dims and a panel in three gutters out;
//   'broken'  (a catastrophic gate) above a ragged line the stones come loose: most float, lifted and turned, the rest lie fallen at
//                               the foot; a violet seam burns on every seat a stone has left and under every stone that floats, and
//                               the script turns violet (OG-126's third row; the canon's Part I, a gate's condition).
// The pieces (metres, a nave's measures from visual-foundation.md §2; the last four Session 1098): 'slab' (a floor of 2.5 m slabs), 'wall' (an aisle wall 14 m
// long and 12 m high in courses of 1.25 m), 'arch' (a pointed arcade arch of 10 m on two jambs, 18 m to its point, with its roll
// moulding), 'pier' (4 m square and 20 m high, script up its face and a ring sigil), 'stair' (a flight across 8 m, 4.2 m of rise),
// 'bridge' (a span of 16 m on one arch, its deck and parapet), 'balcony' (a gallery on corbels with its rail), 'panel' (a script
// panel 3 by 6 m in a frame), 'vault' (a rib vault over a bay, o.w by o.d), 'shaft' (a round well 6 m across and 12 m deep),
// 'edge' (a chasm's edge, its lip and the face below), 'rail' (a balustrade of 10 m). o.school dresses the stone and the script's light (GK_SCHOOLS, the six from gates.js's table).
// o.ruin (Session 1119, OG-104's ruins at the scale of cliffs): a ruin out in the world, where the loom holds nothing up: under 'broken'
// every loose stone falls and none floats, no seam burns, and the script is dead on every stone; under 'cracked' the script is dead.
// gatePiece(kind, { cond, school, key, ruin }) -> a Group, one mesh a material; userData { kind, cond, school, tris, calls, blocks, moved,
//   floating, fallen, seams, cracks, lean, size: { w, h, d }, key }. Everything that varies comes from a stream keyed by the
//   piece's key and its condition, so a piece is the same twice and the same piece breaks the same way in every world.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { TEX, mat, worldUV } from './common.js';

export function hashKey(s) { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
export function stream(key) { let a = hashKey(String(key)); return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

// ── the dress: the stone and the script's light by school (gates.js's SCHOOL: stone, glow) ──
export const GK_SCHOOLS = {
  tine: { name: 'Tine', stone: [.30, .28, .28], glow: [1.0, .34, .10] }, uisce: { name: 'Uisce', stone: [.58, .64, .66], glow: [.30, .72, 1.0] },
  cloch: { name: 'Cloch', stone: [.70, .66, .60], glow: [1.0, .66, .30] }, scath: { name: 'Scáth', stone: [.40, .38, .44], glow: [.70, .34, 1.0] },
  solas: { name: 'Solas', stone: [1.0, .84, .56], glow: [1.0, .86, .52] }, gaoth: { name: 'Gaoth', stone: [.84, .86, .88], glow: [.66, .92, 1.0] },
};
export const GK_KINDS = ['slab', 'wall', 'arch', 'pier', 'stair', 'bridge', 'balcony', 'panel', 'vault', 'shaft', 'edge', 'rail'];
export const GK_CONDS = ['whole', 'cracked', 'broken'];
const AMBER = [1.0, .62, .24], VIOLET = [.62, .30, 1.0];

// ── the Weaver script: glyphs on a canvas strip, the gate slice's seven shapes (gate.js), drawn from a stream ──
let _glyph = null;
function glyphTex() {
  if (_glyph) return _glyph; const L = 2048, S = 64, c = document.createElement('canvas'); c.width = S; c.height = L; const x = c.getContext('2d'), r = stream('gatekit:glyphs');
  x.fillStyle = '#000'; x.fillRect(0, 0, S, L); x.strokeStyle = '#fff'; x.lineCap = 'round'; x.lineWidth = 4;
  for (let i = 0; i < 40; i++) { const k = Math.floor(r() * 7); x.save(); x.translate(32, 25 + i * 51); x.beginPath();
    if (k === 0) { x.arc(0, 0, 12, 0, 7); x.moveTo(0, -18); x.lineTo(0, 18); } else if (k === 1) { x.moveTo(-12, 18); x.lineTo(0, -18); x.lineTo(12, 18); x.moveTo(-7, 4); x.lineTo(7, 4); }
    else if (k === 2) { x.arc(0, 0, 13, .6, 5.7); x.moveTo(2, 0); x.arc(0, 0, 2, 0, 7); } else if (k === 3) { x.moveTo(-12, -14); x.lineTo(12, -14); x.moveTo(0, -14); x.lineTo(0, 18); x.moveTo(-8, 2); x.lineTo(8, 10); }
    else if (k === 4) { x.moveTo(-12, 0); x.lineTo(0, -16); x.lineTo(12, 0); x.lineTo(0, 16); x.closePath(); } else if (k === 5) { x.moveTo(-10, -16); x.lineTo(-10, 16); x.moveTo(10, -16); x.lineTo(10, 16); x.moveTo(-10, 0); x.lineTo(10, 0); }
    else { x.moveTo(0, -18); x.lineTo(0, 18); x.moveTo(-10, -8); x.lineTo(0, -2); x.lineTo(10, -8); } x.stroke(); x.restore(); }
  const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 8; return (_glyph = t);
}
// the ring sigil of OG-037: two circles, a cross that runs past them, a point at the heart
let _ring = null;
function ringTex() {
  if (_ring) return _ring; const c = document.createElement('canvas'); c.width = c.height = 512; const x = c.getContext('2d'); x.fillStyle = '#000'; x.fillRect(0, 0, 512, 512); x.strokeStyle = '#fff'; x.fillStyle = '#fff'; x.lineCap = 'round';
  x.lineWidth = 16; x.beginPath(); x.arc(256, 256, 170, 0, 7); x.stroke(); x.lineWidth = 9; x.beginPath(); x.arc(256, 256, 96, 0, 7); x.stroke();
  x.lineWidth = 10; x.beginPath(); x.moveTo(256, 20); x.lineTo(256, 492); x.moveTo(20, 256); x.lineTo(492, 256); x.stroke(); x.beginPath(); x.arc(256, 256, 18, 0, 7); x.fill();
  const t = new THREE.CanvasTexture(c); t.anisotropy = 8; return (_ring = t);
}

// ── the materials, by school and condition ──
const MATS = {};
function gkMats(school, cond) {
  const k = school + '|' + cond; if (MATS[k]) return MATS[k]; const S = GK_SCHOOLS[school] || GK_SCHOOLS.cloch, col = new THREE.Color(...S.stone), M = {};
  M.stone = mat('ashlar', { ns: 1.0, color: col }); M.dress = mat('ashlar', { ns: .7, color: col.clone().multiplyScalar(.82) });
  M.floor = mat('slab', { ns: .8, color: col.clone().multiplyScalar(.75), rough: .5 });
  const glow = cond === 'broken' ? VIOLET : S.glow || AMBER, gk = cond === 'whole' ? 2.2 : cond === 'cracked' ? .9 : 1.1;
  const em = (map, k2) => new THREE.MeshStandardMaterial({ color: new THREE.Color(.05, .045, .04), emissive: new THREE.Color(...glow), emissiveIntensity: k2, emissiveMap: map, roughness: .6, transparent: false });
  M.script = em(glyphTex(), gk); M.ring = em(ringTex(), gk); M.dead = new THREE.MeshStandardMaterial({ color: new THREE.Color(.06, .055, .05), roughness: .9, map: glyphTex() });
  M.crack = new THREE.MeshStandardMaterial({ color: new THREE.Color(.012, .01, .01), roughness: 1 });
  M.seam = new THREE.MeshStandardMaterial({ color: new THREE.Color(.1, .04, .2), emissive: new THREE.Color(...VIOLET), emissiveIntensity: 1.1, roughness: .4 });
  return (MATS[k] = M);
}

// ── geometry ──
// a box of stone (centred at x, y, z) shrunk by a joint, its UVs from position so the ashlar keeps its size
const stoneBox = (w, h, d, x, y, z, s = .25, joint = .03) => { const g = new THREE.BoxGeometry(Math.max(.02, w - joint), Math.max(.02, h - joint), Math.max(.02, d - joint)); g.translate(x, y, z); return worldUV(g, s); };
// a prism on a quad in the xy plane from z0 to z1 (a voussoir), its faces flat
function prism(q, z0, z1, s = .25) {
  const F = q.map(([x, y]) => [x, y, z1]), B = q.map(([x, y]) => [x, y, z0]), out = [], tri = (a, b, c) => out.push(...a, ...b, ...c);
  let ar = 0; for (let i = 0; i < 4; i++) { const j = (i + 1) % 4; ar += q[i][0] * q[j][1] - q[j][0] * q[i][1]; } const P = ar < 0 ? [3, 2, 1, 0] : [0, 1, 2, 3], f = P.map(i => F[i]), b = P.map(i => B[i]);
  tri(f[0], f[1], f[2]); tri(f[0], f[2], f[3]); tri(b[0], b[2], b[1]); tri(b[0], b[3], b[2]); for (let i = 0; i < 4; i++) { const j = (i + 1) % 4; tri(f[i], b[i], b[j]); tri(f[i], b[j], f[j]); }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(out, 3)); g.computeVertexNormals(); return worldUV(g, s);
}
// a stone of eight corners: a quad (p, four points) and the same quad t higher, its faces flat (a vault's tile, a shaft's curved stone)
function hexa(p, t, s = .25) { const q = p.map(([x, y, z]) => [x, y + t, z]), out = [], tri = (a, b, c) => out.push(...a, ...b, ...c), quad = (a, b, c, d) => { tri(a, b, c); tri(a, c, d); };
  quad(q[0], q[3], q[2], q[1]); quad(p[0], p[1], p[2], p[3]); for (let i = 0; i < 4; i++) { const j = (i + 1) % 4; quad(p[i], q[i], q[j], p[j]); }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(out, 3)); g.computeVertexNormals(); return worldUV(g, s); }
// a strip of script on a face: a quad of w by h centred at (x, y, z) facing n, the glyphs running up it (rep strips' worth of glyphs)
function scriptQuad(w, h, x, y, z, n, rep = 1) {
  const g = new THREE.PlaneGeometry(w, h); const uv = g.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i), uv.getY(i) * rep);
  const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), n.clone().normalize()); g.applyQuaternion(q); g.translate(x, y, z); return g;
}
// the pointed arch's two curves (gate.js's two-centred arch): span S, springing ys, h the point's height over the springing; d inset
function archCurve(S, ys, h, d, n = 24) { const a = Math.max(0, (h * h - S * S / 4) / S), r = S / 2 + a, rr = r - d, th1 = Math.atan2(Math.sqrt(Math.max(0, rr * rr - a * a)), -a), pts = [];
  for (let i = 0; i <= n; i++) { const t = Math.PI + (th1 - Math.PI) * i / n; pts.push([a + Math.cos(t) * rr, ys + Math.sin(t) * rr]); }
  const R = pts.map(([x, y]) => [-x, y]).reverse(); return [...pts, ...R.slice(1)]; }

// ── the pieces: each a list of blocks { parts: [{ key, geo }], c (centre), lo, hi (its y), floor (a horizontal piece's stone) } ──
function B(parts, o = {}) { const box = new THREE.Box3(); for (const p of parts) { p.geo.computeBoundingBox(); box.union(p.geo.boundingBox); }
  return { parts, c: box.getCenter(new THREE.Vector3()), lo: box.min.y, hi: box.max.y, box, ...o }; }
const BUILD = {
  slab() { const bl = [], n = 3, s = 2.5; for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) bl.push(B([{ key: 'floor', geo: stoneBox(s, .6, s, (i - 1) * s, -.3, (j - 1) * s, .4, .02) }], { flat: true })); return { bl, axis: 'x', size: { w: 7.5, h: .6, d: 7.5 } }; },
  wall() { const bl = [], L = 14, H = 12, T = 2, ch = 1.25, r = stream('gatekit:wall:courses');
    for (let k = 0, y = 0; y < H - .01; k++, y += ch) { let x = -L / 2 + (k % 2 ? -1.1 : 0); while (x < L / 2 - .01) { const len = 2.2 + r() * .8, x0 = Math.max(-L / 2, x), x1 = Math.min(L / 2, x + len); if (x1 - x0 > .3) bl.push(B([{ key: 'stone', geo: stoneBox(x1 - x0, ch, T, (x0 + x1) / 2, y + ch / 2, 0) }])); x += len; } }
    bl.push(B([{ key: 'dress', geo: stoneBox(L + .3, .45, T + .4, 0, H + .22, 0) }]));
    for (const u of [-3.5, 3.5]) { const blk = bl.find(b => Math.abs(b.c.x - u) < 1.6 && b.lo > 4.9 && b.lo < 5.1) || bl[0]; blk.parts.push({ key: 'script', geo: scriptQuad(.7, 1.0, u, 5.62, T / 2 + .02, new THREE.Vector3(0, 0, 1), .5) }); }
    return { bl, axis: 'y', size: { w: L, h: H + .45, d: T } }; },
  pier() { const bl = [], P = 4, H = 20, ch = 1.6; let k = 0;
    { const g = stoneBox(P + .8, 1.0, P + .8, 0, .5, 0); bl.push(B([{ key: 'dress', geo: g }])); }
    for (let y = 1.0; y < H - 1.2; y += ch, k++) { const parts = [{ key: 'stone', geo: stoneBox(P, ch, P, 0, y + ch / 2, 0) }];
      for (const [n, x, z] of [[[0, 0, 1], 0, P / 2 + .02], [[0, 0, -1], 0, -P / 2 - .02], [[1, 0, 0], P / 2 + .02, 0], [[-1, 0, 0], -P / 2 - .02, 0]]) parts.push({ key: 'script', geo: scriptQuad(.55, ch - .1, x, y + ch / 2, z, new THREE.Vector3(...n), .7) });
      if (k === 6) parts.push({ key: 'ring', geo: scriptQuad(2.6, 2.6, 0, y + ch / 2 + .4, P / 2 + .04, new THREE.Vector3(0, 0, 1)) });
      bl.push(B(parts)); }
    const top = 1.0 + k * ch; bl.push(B([{ key: 'dress', geo: stoneBox(P + .9, .6, P + .9, 0, top + .3, 0) }])); bl.push(B([{ key: 'dress', geo: stoneBox(P + .5, .5, P + .5, 0, top + .85, 0) }]));
    return { bl, axis: 'y', size: { w: P + .9, h: top + 1.1, d: P + .9 } }; },
  arch() { const bl = [], S = 10, J = 2.2, ys = 9, hh = 9, T = 2.4, ch = 1.5;
    for (const sx of [-1, 1]) { const x = sx * (S / 2 + J / 2); for (let y = 0; y < ys - .01; y += ch) bl.push(B([{ key: 'stone', geo: stoneBox(J, ch, T, x, y + ch / 2, 0) }])); }
    const inner = archCurve(S, ys, hh, 0), outer = archCurve(S, ys, hh, -2.0), roll = archCurve(S, ys, hh, .35), n = inner.length - 1, step = 2;
    for (let i = 0; i < n; i += step) { const j = Math.min(n, i + step), q = [inner[i], inner[j], outer[j], outer[i]];
      bl.push(B([{ key: 'stone', geo: prism(q, -T / 2 + .02, T / 2 - .02) }, { key: 'dress', geo: prism([roll[i], roll[j], inner[j], inner[i]], T / 2 - .02, T / 2 + .28) }])); }
    // the keystone's script: a strip down the voussoirs either side of the point
    const kb = bl[bl.length - 1 - Math.floor(n / step / 2)]; kb.parts.push({ key: 'script', geo: scriptQuad(.6, 1.6, kb.c.x, kb.c.y, T / 2 + .3, new THREE.Vector3(0, 0, 1), .6) });
    return { bl, axis: 'y', size: { w: S + 2 * J, h: ys + hh + 2, d: T + .3 } }; },
  stair() { const bl = [], W = 8, n = 12, rise = .35, run = .6; for (let k = 0; k < n; k++) for (const sx of [-1, 1]) bl.push(B([{ key: 'floor', geo: stoneBox(W / 2, rise * (k + 1), run, sx * W / 4, rise * (k + 1) / 2, -k * run, .4, .02) }], { flat: true }));
    for (const sx of [-1, 1]) for (let k = 0; k < n; k += 3) bl.push(B([{ key: 'dress', geo: stoneBox(.8, rise * (k + 3) + .9, run * 3, sx * (W / 2 + .4), (rise * (k + 3) + .9) / 2, -(k + 1) * run) }]));
    return { bl, axis: 'x', size: { w: W + 1.6, h: n * rise + .9, d: n * run } }; },
  bridge() { const bl = [], L = 16, Wd = 4, ys = 0, hh = 5.5, dk = 6.2;
    const inner = archCurve(L - 2, ys, hh, 0), outer = archCurve(L - 2, ys, hh, -1.2), n = inner.length - 1;
    for (let i = 0; i < n; i += 2) { const j = Math.min(n, i + 2); bl.push(B([{ key: 'stone', geo: prism([inner[i], inner[j], outer[j], outer[i]], -Wd / 2, Wd / 2) }])); }
    const nd = 8; for (let k = 0; k < nd; k++) { const x = -L / 2 + (k + .5) * L / nd; bl.push(B([{ key: 'floor', geo: stoneBox(L / nd, .5, Wd, x, dk, 0, .4, .02) }], { flat: true }));
      for (const sz of [-1, 1]) bl.push(B([{ key: 'dress', geo: stoneBox(L / nd, 1.0, .4, x, dk + .75, sz * (Wd / 2 - .2)) }], { flat: true })); }
    // the spandrels: courses between the ring and the deck
    for (let k = 0; k < nd; k++) { const x = -L / 2 + (k + .5) * L / nd, top = dk - .25, base = Math.max(0, Math.min(top - .5, hh + 1.2 - Math.abs(x) * .9)); if (top - base > .4) bl.push(B([{ key: 'stone', geo: stoneBox(L / nd, top - base, Wd - .2, x, (top + base) / 2, 0) }])); }
    return { bl, axis: 'x', size: { w: L, h: dk + 1.25, d: Wd } }; },
  balcony() { const bl = [], L = 9, out = 2.2, y = 6, T = 1.0;
    for (let k = 0; k < 6; k++) { const x = -L / 2 + .8 + k * (L - 1.6) / 5; /* a corbel: deep at the wall, cut back to the gallery's edge */ const g = new THREE.BoxGeometry(.6, 1.4, out), P = g.attributes.position; for (let i = 0; i < P.count; i++) if (P.getY(i) < 0 && P.getZ(i) > 0) P.setY(i, P.getY(i) + 1.1); g.translate(x, y - .7, out / 2); g.computeVertexNormals(); worldUV(g, .25); bl.push(B([{ key: 'dress', geo: g }])); }
    for (let k = 0; k < 4; k++) { const x = -L / 2 + (k + .5) * L / 4; bl.push(B([{ key: 'floor', geo: stoneBox(L / 4, .4, out + .4, x, y + .2, out / 2 - .2, .4, .02) }], { flat: true }));
      const parts = [{ key: 'dress', geo: stoneBox(L / 4, .2, .35, x, y + 1.25, out - .2) }]; for (let b = 0; b < 3; b++) parts.push({ key: 'stone', geo: stoneBox(.22, .85, .22, x - L / 8 + (b + .5) * L / 12, y + .72, out - .2, .25, 0) });
      bl.push(B(parts)); }
    // the wall it stands out from, its script at the sill
    for (let y2 = 0, k = 0; y2 < y + 3; y2 += 1.5, k++) bl.push(B([{ key: 'stone', geo: stoneBox(L + 1, 1.5, T, 0, y2 + .75, -T / 2) }]));
    bl[bl.length - 2].parts.push({ key: 'script', geo: scriptQuad(.6, 1.2, -2, y + 2.25, .02, new THREE.Vector3(0, 0, 1), .5) });
    return { bl, axis: 'y', size: { w: L + 1, h: y + 3, d: out + T } }; },
  panel() { const bl = [], W = 3, H = 6, T = .6, y0 = .8;
    bl.push(B([{ key: 'dress', geo: stoneBox(W + 1.2, y0, T + .4, 0, y0 / 2, 0) }]));
    for (let k = 0; k < 4; k++) { const h = H / 4, y = y0 + k * h; bl.push(B([{ key: 'stone', geo: stoneBox(W, h, T, 0, y + h / 2, 0) }, ...[-.8, 0, .8].map(u => ({ key: 'script', geo: scriptQuad(.5, h - .12, u, y + h / 2, T / 2 + .02, new THREE.Vector3(0, 0, 1), .6) }))]));
      for (const sx of [-1, 1]) bl.push(B([{ key: 'dress', geo: stoneBox(.6, h, T + .2, sx * (W / 2 + .3), y + h / 2, 0) }])); }
    bl.push(B([{ key: 'dress', geo: stoneBox(W + 1.4, .5, T + .5, 0, y0 + H + .25, 0) }]));
    bl[bl.length - 2 - 8].parts.push({ key: 'ring', geo: scriptQuad(1.4, 1.4, 0, y0 + H * .62, T / 2 + .04, new THREE.Vector3(0, 0, 1)) });
    return { bl, axis: 'y', size: { w: W + 1.4, h: y0 + H + .5, d: T + .5 } }; },
  // a rib vault over a bay (o.w by o.d, default 14 by 14, o.rise 9 over its springing at y 0): two pointed barrels crossing, the
  // intrados the higher of the two at every point (a groin along each diagonal), laid in stone tiles 0.6 m deep on an 8 by 8 grid;
  // a rib under each groin and a wall rib on each side. It springs at its corners: fallen stones lie at o.ground below (the floor).
  vault(o = {}) { const bl = [], Wv = o.w || 14, Dv = o.d || 14, rise = o.rise || 9, n = 8, T = .6;
    const f = (u, S) => { const a = Math.max(0, (rise * rise - S * S / 4) / S), r = S / 2 + a; return Math.sqrt(Math.max(0, r * r - (Math.abs(u) + a) ** 2)); };
    const y = (x, z) => Math.max(f(x, Wv), f(z, Dv));
    for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) { const x0 = -Wv / 2 + i * Wv / n, x1 = x0 + Wv / n, z0 = -Dv / 2 + j * Dv / n, z1 = z0 + Dv / n, e = .02;
      const c = [[x0 + e, z0 + e], [x1 - e, z0 + e], [x1 - e, z1 - e], [x0 + e, z1 - e]]; bl.push(B([{ key: 'stone', geo: hexa(c.map(([x, z]) => [x, y(x, z), z]), T) }])); }
    // the ribs: along each diagonal under its groin, and the four wall ribs, in segments of moulded stone
    const rib = (pts, key = 'dress') => { for (let k = 0; k < pts.length - 1; k++) { const [a, b2] = [pts[k], pts[k + 1]], d = new THREE.Vector3(b2[0] - a[0], b2[1] - a[1], b2[2] - a[2]), L = d.length(), g = new THREE.BoxGeometry(.7, .55, L - .04);
      g.lookAt(d); g.translate((a[0] + b2[0]) / 2, (a[1] + b2[1]) / 2 - .3, (a[2] + b2[2]) / 2); worldUV(g, .25); bl.push(B([{ key, geo: g }])); } };
    const m = 10; for (const s2 of [-1, 1]) rib(Array.from({ length: m + 1 }, (_, k) => { const t = -1 + 2 * k / m, x = t * Wv / 2, z = s2 * t * Dv / 2; return [x, y(x, z), z]; }));
    for (const sx of [-1, 1]) rib(Array.from({ length: m + 1 }, (_, k) => { const z = -Dv / 2 + Dv * k / m, x = sx * (Wv / 2 - .35); return [x, y(x, z), z]; }));
    for (const sz of [-1, 1]) rib(Array.from({ length: m + 1 }, (_, k) => { const x = -Wv / 2 + Wv * k / m, z = sz * (Dv / 2 - .35); return [x, y(x, z), z]; }));
    // the boss at the crossing, with the ring sigil under it
    bl.push(B([{ key: 'dress', geo: stoneBox(1.4, .8, 1.4, 0, rise - .45, 0) }, { key: 'ring', geo: (() => { const g = new THREE.CircleGeometry(.62, 24); g.rotateX(Math.PI / 2); g.translate(0, rise - .87, 0); return g; })() }]));
    return { bl, axis: 'y', still: true, ground: o.ground ?? 0, size: { w: Wv, h: rise + T, d: Dv } }; },
  // a shaft: a round well 6 m across going down 12 m from the floor, in courses of 1.5 m of twelve curved stones, a coped rim at
  // the floor with the script round it; what falls goes down the shaft
  shaft() { const bl = [], R = 3, T = 1.2, n = 12, ch = 1.5, depth = 12;
    const ring = (y0, y1, r0, r1, key, off) => { for (let k = 0; k < n; k++) { const a0 = (k + off) / n * Math.PI * 2 + .01, a1 = (k + 1 + off) / n * Math.PI * 2 - .01, P2 = (r, a, yy) => [Math.cos(a) * r, yy, Math.sin(a) * r];
      bl.push(B([{ key, geo: hexa([P2(r0, a0, y0), P2(r1, a0, y0), P2(r1, a1, y0), P2(r0, a1, y0)], y1 - y0) }], { flat: true })); } };
    for (let c = 0, yy = -depth; yy < -.01; c++, yy += ch) ring(yy, yy + ch, R, R + T, 'stone', c % 2 ? .5 : 0);
    ring(0, .5, R - .15, R + T + .3, 'dress', .25);
    for (let k = 0; k < 6; k++) { const a = (k + .5) / 6 * Math.PI * 2, x = Math.cos(a) * (R - .16), z = Math.sin(a) * (R - .16); bl[n * 7 + k * 2].parts.push({ key: 'script', geo: scriptQuad(.5, 1.3, x, -.9, z, new THREE.Vector3(-Math.cos(a), 0, -Math.sin(a)), .6) }); }
    return { bl, axis: 'y', still: true, size: { w: 2 * (R + T + .3), h: depth + .5, d: 2 * (R + T + .3) } }; },
  // a chasm edge: three rows of floor slabs ending at a lip of coping, the face below coursed 10 m down; the chasm lies on +z
  edge() { const bl = [], s = 2.5, nx = 4, face = 10;
    for (let i = 0; i < nx; i++) for (let j = 0; j < 3; j++) bl.push(B([{ key: 'floor', geo: stoneBox(s, .6, s, (i - (nx - 1) / 2) * s, -.3, -j * s - s / 2, .4, .02) }], { flat: true }));
    for (let i = 0; i < nx * 2; i++) bl.push(B([{ key: 'dress', geo: stoneBox(s / 2, .5, .9, (i - (nx * 2 - 1) / 2) * s / 2, .05, .3) }], { flat: true }));
    // the face, its courses clipped to the piece's width; below 3.5 m it is the chasm's own rock and never comes loose
    let top = null; for (let c = 0, yy = -face; yy < -.6; c++, yy += 1.4) { const h = Math.min(1.4, -.6 - yy), W2 = nx * s / 2; for (let i = 0; i <= nx; i++) { const x0 = Math.max(-W2, -W2 + (i - (c % 2 ? .5 : 0)) * s), x1 = Math.min(W2, -W2 + (i + 1 - (c % 2 ? .5 : 0)) * s); if (x1 - x0 < .3) continue;
      bl.push(B([{ key: 'stone', geo: stoneBox(x1 - x0, h, 1.2, (x0 + x1) / 2, yy + h / 2, .1) }], { flat: true, fixed: yy < -3.5 })); if (Math.abs((x0 + x1) / 2 + 1.25) < .1 && h < 1.4) top = bl[bl.length - 1]; } }
    (top || bl[bl.length - 3]).parts.push({ key: 'script', geo: scriptQuad(.5, 1.2, (3 - (nx * 2 - 1) / 2) * s / 2, -1.4, .72, new THREE.Vector3(0, 0, 1), .5) });
    return { bl, axis: 'z', size: { w: nx * s, h: face, d: 3 * s + .8 } }; },
  // a railing: a run of 10 m along a gallery's or a bridge's edge, a plinth, balusters every 0.42 m in bays between posts, a rail
  rail() { const bl = [], L = 10, bays = 5, bw = L / bays;
    for (let k = 0; k <= bays; k++) { const x = -L / 2 + k * bw; bl.push(B([{ key: 'dress', geo: stoneBox(.42, 1.3, .42, x, .65, 0) }, { key: 'dress', geo: stoneBox(.5, .14, .5, x, 1.37, 0) }])); }
    for (let k = 0; k < bays; k++) { const x0 = -L / 2 + k * bw, parts = [{ key: 'stone', geo: stoneBox(bw - .42, .22, .34, x0 + bw / 2, .11, 0) }, { key: 'stone', geo: stoneBox(bw - .42, .16, .3, x0 + bw / 2, 1.06, 0) }];
      for (let b = 1; b < 5; b++) parts.push({ key: 'stone', geo: (() => { const g = new THREE.CylinderGeometry(.07, .1, .76, 8); g.translate(x0 + b * bw / 5, .6, 0); return worldUV(g, .25); })() }); bl.push(B(parts)); }
    return { bl, axis: 'x', size: { w: L + .5, h: 1.44, d: .5 } }; },
};

// ── the conditions: one rule over the blocks ──
// a crack: a dark zigzag of thin quads across a block's widest face
function crack(r, b) { const bb = b.box, w = bb.max.x - bb.min.x, d = bb.max.z - bb.min.z, front = w >= d, out = [], n = 4;
  let u = (r() - .5) * (front ? w : d) * .5, v = bb.min.y + .1; const hgt = bb.max.y - bb.min.y - .2, seg = hgt / n;
  for (let i = 0; i < n; i++) { const u1 = u + (r() - .5) * .7, v1 = v + seg, len = Math.hypot(u1 - u, seg), g = new THREE.PlaneGeometry(.045, len); g.rotateZ(Math.atan2(-(u1 - u), seg));
    if (front) { g.translate(bb.min.x + w / 2 + (u + u1) / 2, (v + v1) / 2, bb.max.z + .012); } else { g.rotateY(Math.PI / 2); g.translate(bb.max.x + .012, (v + v1) / 2, bb.min.z + d / 2 + (u + u1) / 2); }
    out.push(g); u = u1; v = v1; } return out; }
function condition(P, cond, key) {
  const r = stream(`${key}:${cond}`), { bl, axis, size } = P, out = [], st = { moved: 0, floating: 0, fallen: 0, seams: 0, cracks: 0, lean: 0 };
  const at = b => axis === 'z' ? b.c.z : b.c.x, lo = Math.min(...bl.map(b => axis === 'y' ? b.lo : at(b))), hi = Math.max(...bl.map(b => axis === 'y' ? b.hi : at(b))), M = new THREE.Matrix4();
  // the lean of a failing or fallen piece: about its foot along x, toward +z or -z (a floor does not lean)
  const lean = cond === 'whole' || axis !== 'y' || P.still ? 0 : (1.5 + r() * 1.5) * (r() < .5 ? -1 : 1) * Math.PI / 180, L = new THREE.Matrix4().makeRotationX(lean); st.lean = +(lean * 180 / Math.PI).toFixed(2);
  // the break line of a broken piece: a ragged height (or, for a floor or a span, a ragged distance along it) past which stones come loose
  const cut = cond === 'broken' ? (axis === 'y' ? .42 + r() * .12 : .5 + r() * .1) : 2, rag = b => Math.sin((axis === 'x' ? b.c.z : b.c.x) * 1.7 + 3 * r()) * .08;
  for (const b of bl) { M.identity(); let seat = null, kind = 'in';
    const f = axis === 'y' ? (b.lo - lo) / Math.max(.01, hi - lo) : (at(b) - lo) / Math.max(.01, hi - lo);
    if (cond === 'cracked' && r() < .25) { const t = new THREE.Matrix4().makeTranslation(b.c.x, b.c.y, b.c.z).multiply(new THREE.Matrix4().makeRotationFromEuler(new THREE.Euler((r() - .5) * .03, (r() - .5) * .03, (r() - .5) * .03))).multiply(new THREE.Matrix4().makeTranslation(-b.c.x, -b.c.y, -b.c.z));
      M.premultiply(t).premultiply(new THREE.Matrix4().makeTranslation((r() - .5) * .06, -r() * .08, (r() - .5) * .06)); kind = 'slipped'; st.moved++; }
    if (cond === 'broken' && !b.fixed && f + rag(b) > cut) { const t = (f - cut) / Math.max(.05, 1 - cut), h = b.hi - b.lo;
      if (!P.ruin && r() < .72) { // float: lifted and turned about its own centre, drifted out; its seat burns
        const lift = .5 + t * 2.6 + r() * .6, rot = new THREE.Euler((r() - .5) * .5 * (.4 + t), (r() - .5) * .4, (r() - .5) * .5 * (.4 + t));
        M.premultiply(new THREE.Matrix4().makeTranslation(-b.c.x, -b.c.y, -b.c.z)).premultiply(new THREE.Matrix4().makeRotationFromEuler(rot)).premultiply(new THREE.Matrix4().makeTranslation(b.c.x + (r() - .5) * .8, b.c.y + lift, b.c.z + (r() - .5) * 1.2));
        kind = 'floating'; st.floating++; seat = true; }
      else { // fall: laid at the foot, on its side, a few metres out
        const ang = (r() < .5 ? 1 : -1) * Math.PI / 2 * (.6 + r() * .4), out2 = 2 + r() * 3, sz = r() < .5 ? 1 : -1, rot = new THREE.Euler(b.flat ? 0 : ang, r() * Math.PI, 0);
        const dy = b.flat ? -(b.hi + 3 + r() * 4) : 0; /* a floor's or a span's loose stone drops away into the dark below it */
        M.premultiply(new THREE.Matrix4().makeTranslation(-b.c.x, -b.c.y, -b.c.z)).premultiply(new THREE.Matrix4().makeRotationFromEuler(rot));
        const tmp = b.box.clone().applyMatrix4(M); M.premultiply(new THREE.Matrix4().makeTranslation(b.c.x + (r() - .5) * 2, b.flat ? dy : -tmp.min.y + (P.ground || 0) + .02, b.flat ? b.c.z : b.c.z + sz * (size.d / 2 + out2 * (.5 + .5 * t))));
        kind = 'fallen'; st.fallen++; seat = true; }
      st.moved++; }
    // the lean applies to all that still stands on the piece (and to the seats of what has left it)
    const ML = kind === 'fallen' ? M : M.clone().premultiply(L);
    for (const p of b.parts) { const g = p.geo.clone().applyMatrix4(ML); out.push({ key: (p.key === 'script' || p.key === 'ring') && (kind === 'fallen' || P.ruin) ? 'dead' : p.key === 'script' && cond === 'cracked' && r() < .33 ? 'dead' : p.key, geo: g }); }
    if (cond === 'cracked' && b.parts[0].key !== 'dress' && r() < .3) for (const g of crack(r, b)) { out.push({ key: 'crack', geo: g.applyMatrix4(ML) }); st.cracks++; }
    if (seat && !P.ruin) { // the seat it left: a thin violet plate on what it stood on, and one under the stone if it floats
      const bb = b.box, w = bb.max.x - bb.min.x - .08, d = bb.max.z - bb.min.z - .08, g = new THREE.BoxGeometry(Math.max(.05, w), .05, Math.max(.05, d)); g.translate(b.c.x, b.flat ? bb.min.y + .03 : bb.min.y + .03, b.c.z); out.push({ key: 'seam', geo: g.applyMatrix4(L) }); st.seams++;
      if (kind === 'floating') { const u = new THREE.BoxGeometry(Math.max(.05, w), .05, Math.max(.05, d)); u.translate(b.c.x, bb.min.y - .03, b.c.z); out.push({ key: 'seam', geo: u.applyMatrix4(M) }); st.seams++; } } }
  return { parts: out, st };
}

export function gatePiece(kind, o = {}) {
  const cond = GK_CONDS.includes(o.cond) ? o.cond : 'whole', school = GK_SCHOOLS[o.school] ? o.school : 'cloch', key = o.key || `gatekit:${kind}`;
  const P = BUILD[kind](o); P.ruin = !!o.ruin; const { parts, st } = condition(P, cond, key), M = gkMats(school, cond), by = {};
  for (const p of parts) { const g = p.geo.index ? p.geo.toNonIndexed() : p.geo; for (const a of Object.keys(g.attributes)) if (!['position', 'normal', 'uv'].includes(a)) g.deleteAttribute(a);
    if (!g.attributes.uv) g.setAttribute('uv', new THREE.Float32BufferAttribute(new Float32Array(g.attributes.position.count * 2), 2)); (by[p.key] ||= []).push(g); }
  const G = new THREE.Group(); let tris = 0, calls = 0;
  for (const k in by) { const geo = mergeGeometries(by[k]), m = new THREE.Mesh(geo, M[k]); m.castShadow = o.shadow !== false && !['script', 'ring', 'seam', 'crack', 'dead'].includes(k); m.receiveShadow = true; m.userData.key = k; G.add(m); tris += geo.attributes.position.count / 3; calls++; }
  G.userData = { kind, cond, school, key, tris: Math.round(tris), calls, blocks: P.bl.length, ...st, size: P.size };
  return G;
}
