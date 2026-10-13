// Buildings as pieces (Session 816, card F6 of docs/design/visual-foundation.md; backlog K): the new kit's house builders,
// beginning with Aurenne. Lifted from the concept artist's prototype (docs/prototypes/aurenne/proposal.js, on the old shape
// kit) after Michael's B on DECISION #259 (12 Oct): "the mix, two in three flat, one in three Roman". The shapes are the
// proposal's: walls extruded with real arched openings, a dark room behind every one, the glazed tile round the door, the
// roof terrace with its parapet, dome, pergola and outside stair, and the Roman house's low hipped roof and arcade. What
// changes is the surface: lime plaster, pantile, glazed tile, ashlar and cedar are relief textures (normal maps), so a roof
// is four planes and not four hundred tile meshes, and a house is one mesh per material.
// aurenneHouse(o, r) -> { group, roofTop, tris, draws, kind }  (r: a seeded stream; o.kind 'flat' | 'tile', o.w, o.d, …)
// aurenneLot(street, i) -> the options for lot i of a street: the kind by Michael's mix, the rest by the lot's own seed.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { texPair, mat, worldUV, TEX } from './common.js';

// ── seeds: a lot's look comes from its street and index (the co-op rule), never Math.random ──
export function hashKey(s) { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
export function stream(key) { let a = hashKey(String(key)); return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

// ── the surfaces Aurenne adds to the kit's (plaster, ashlar, flag, wood come from common.js) ──
function tn(x, y, f, s = 0) { const X = x * f, Y = y * f, i = Math.floor(X), j = Math.floor(Y), u = X - i, v = Y - j, h = (a, b) => { a = ((a % f) + f) % f; b = ((b % f) + f) % f; let n = a * 374761393 + b * 668265263 + s * 982451653; n = (n ^ (n >>> 13)) * 1274126177; return ((n ^ (n >>> 16)) >>> 0) / 4294967295; };
  const su = u * u * (3 - 2 * u), sv = v * v * (3 - 2 * v); return (h(i, j) * (1 - su) + h(i + 1, j) * su) * (1 - sv) + (h(i, j + 1) * (1 - su) + h(i + 1, j + 1) * su) * sv; }
const tfbm = (x, y, f, o = 4, s = 0) => { let a = 0, m = .5, t = 0; for (let k = 0; k < o; k++) { a += m * tn(x, y, f, s + k); t += m; f *= 2; m *= .5; } return a / t; };
const idr = id => { let n = (id * 2654435761) >>> 0; n ^= n >>> 15; return (n % 1000) / 1000; };
let made = false;
export function aurenneTextures() {
  if (made) return; made = true;
  // pantile: half-round tiles, four across a repeat, three courses down it, alternately laid hollow and round, each course lapping the one below
  TEX.pantile = texPair(256, (x, y) => { const fx = x * 4, col = Math.floor(fx), u = fx - col, fy = y * 3, crs = Math.floor(fy), v = fy - crs, r = idr(col * 7 + crs * 31 + 3), round = col % 2 === 0;
    const s = Math.sin(Math.PI * u), h = (round ? s : 1 - s * .7) * .7 + (1 - v) * .3 + .05 * tn(x, y, 32, 5), gap = !round && (u < .06 || u > .94);
    const k = .78 + .3 * r + .08 * tfbm(x, y, 16, 3, 2) - (round ? 0 : .12) - (v > .9 ? .18 : 0); return [h, ...(gap ? [.18, .08, .05] : [.70 * k, .36 * k, .22 * k])]; }, 3.4);
  // glazed tile: a square frame in blue and white by turns with saffron stars at the crossings (OG-061's "blue glazed tilework")
  TEX.zellige = texPair(256, (x, y) => { const n = 4, fx = x * n, fy = y * n, i = Math.floor(fx), j = Math.floor(fy), u = fx - i, v = fy - j, e = Math.min(u, 1 - u, v, 1 - v), gap = e < .05;
    const cx = Math.abs(u - .5), cy = Math.abs(v - .5), star = cx + cy < .2 || Math.max(cx, cy) < .12, blue = (i + j) % 2 === 0, w = .03 * tn(x, y, 64, 7);
    const c = gap ? [.82, .8, .74] : star ? [.86, .62, .18] : blue ? [.13 + w, .3 + w, .62 + w] : [.92 + w, .93 + w, .9 + w]; return [gap ? 0 : .8 + .2 * Math.min(1, e * 8), ...c]; }, 2.2);
  // a dome's glaze: small blue tiles, each a shade of its own
  TEX.glaze = texPair(256, (x, y) => { const n = 12, i = Math.floor(x * n), j = Math.floor(y * n), u = x * n - i, v = y * n - j, e = Math.min(u, 1 - u, v, 1 - v), r = idr(i * 13 + j * 7 + 1), gap = e < .06;
    return [gap ? 0 : .85, ...(gap ? [.7, .7, .66] : [.1 + .06 * r, .26 + .1 * r, .55 + .12 * r])]; }, 1.6);
  // limestone paving (Session 820): pale slabs in courses of two widths, edges worn round, ochre and grey stains, the joints
  // filled with dust rather than cut black
  TEX.limestone = texPair(512, (x, y) => { const rows = 4, row = Math.floor(y * rows), v = y * rows - row, wide = row % 2 ? 3 : 2, xx = x * wide + idr(row + 7) * .7, col = Math.floor(xx), u = xx - col, r = idr(row * 19 + ((col % wide) + wide) % wide + 5);
    const e = Math.min(u * wide / 2.5, (1 - u) * wide / 2.5, v, 1 - v), n = tfbm(x, y, 10, 5, r * 11), st = tfbm(x, y, 3, 4, 41), gap = e < .012;
    const h = gap ? .1 : Math.min(1, Math.sqrt(e * 18)) * (.85 + .15 * n), k = .8 + .1 * r + .08 * (n - .5), ochre = Math.max(0, st - .55) * 1.2;
    return [h, ...(gap ? [.62, .57, .48] : [k * (1 + ochre * .1), k * (.95 - ochre * .05), k * (.86 - ochre * .2)])]; }, 1.8);
  // the awning's canvas: madder and cream in stripes, a weave in the height
  TEX.awning = texPair(128, (x, y) => { const st = Math.floor(x * 8) % 2, wv = (Math.sin(x * 128 * Math.PI) * Math.sin(y * 128 * Math.PI)) * .5 + .5, n = tfbm(x, y, 8, 3, 4);
    return [wv * .4 + n * .3, ...(st ? [.93 - .05 * n, .88 - .05 * n, .78 - .05 * n] : [.62 - .06 * n, .14, .1])]; }, 1.2);
}

// colours from the proposal (AUR): lime white, warm lime, ochre, rose, chalk; doors in indigo, verdigris, madder, night blue, bare cedar
export const AUR = { walls: [0xf6f1e4, 0xf3e6c8, 0xedd3a8, 0xefcfbb, 0xfaf7ef], doors: [0x2f5f9a, 0x2a7a78, 0x9a3a2a, 0x3a4a7a, 0x8a5a36], leaf: 0x4f6e34, leaf2: 0x34501f, bloom: 0xb0306a };
let M = null;
function mats() {
  if (M) return M; aurenneTextures();
  const std = (c, o = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: o.rough ?? .8, metalness: o.metal ?? 0, side: o.side ?? THREE.FrontSide });
  M = { wall: AUR.walls.map(c => mat('plaster', { ns: .55, color: c, rough: .95 })), stone: mat('ashlar', { ns: .9, color: 0xfff1d6, rough: .85 }), plinth: mat('ashlar', { ns: 1.1, color: 0xd9c9a8, rough: .9 }),
    pantile: mat('pantile', { ns: 1.4, rough: .75 }), ridge: std(0x8a4428, { rough: .7 }), zellige: mat('zellige', { ns: .6, rough: .25 }), glaze: mat('glaze', { ns: .7, rough: .2 }),
    cedar: mat('wood', { ns: 1, color: 0xc89870 }), door: AUR.doors.map(c => { const m = mat('wood', { ns: .9 }); m.color.set(c).multiplyScalar(2.1); return m; }),
    awning: mat('awning', { ns: .6, rough: .95 }), dark: std(0x0d0a08, { rough: 1 }), iron: std(0x1c1a18, { rough: .5, metal: .5 }), terra: std(0xa8582f, { rough: .85 }),
    gold: std(0xc8952e, { rough: .35, metal: .7 }), leaf: std(AUR.leaf, { rough: .9 }), leaf2: std(AUR.leaf2, { rough: .95 }), bloom: std(AUR.bloom, { rough: .8 }) };
  M.pantile.side = THREE.DoubleSide; M.awning.side = THREE.DoubleSide; return M;
}
const TEXTURED = new Set(['wall', 'stone', 'plinth', 'pantile', 'zellige', 'glaze', 'cedar', 'door', 'awning']);
const UVS = { wall: .42, stone: .45, plinth: .5, pantile: .96, zellige: 1.47, glaze: 1.2, cedar: .9, door: .9, awning: .5 };

export function aurenneHouse(o, r) {
  const Mt = mats(), buckets = new Map(), w = o.w, d = o.d;
  // every piece is placed (a turn about y and a tilt, then a move), its UVs taken from where it lies, and dropped in its material's bucket
  const put = (geo, key, x = 0, y = 0, z = 0, ry = 0, rx = 0, rz = 0, slopeX) => { const g = geo.index ? geo.toNonIndexed() : geo; g.deleteAttribute('uv');
    g.applyMatrix4(new THREE.Matrix4().compose(new THREE.Vector3(x, y, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(rx, ry, rz, 'YXZ')), new THREE.Vector3(1, 1, 1)));
    const base = key.split(':')[0]; if (TEXTURED.has(base)) worldUV(g, UVS[base], { slopeX }); else g.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(g.attributes.position.count * 2), 2));
    if (!buckets.has(key)) buckets.set(key, []); buckets.get(key).push(g); };
  const T = .32, pl = .24, fh = 3.0, H = fh + (o.two ? 2.6 : 0), wallK = 'wall:' + (o.wall ?? Math.floor(r() * AUR.walls.length)), doorK = 'door:' + (o.door ?? Math.floor(r() * AUR.doors.length));
  // an outline with holes; a hole {x,y,w,h,arch} has a half-round (1) or pointed (2) head
  const holePath = h => { const p = new THREE.Path(), x0 = h.x - h.w / 2, x1 = h.x + h.w / 2, y0 = h.y, y1 = h.y + h.h - (h.arch ? h.w / 2 : 0);
    p.moveTo(x0, y0); p.lineTo(x1, y0); p.lineTo(x1, y1);
    if (h.arch === 1) p.absarc(h.x, y1, h.w / 2, 0, Math.PI, false); else if (h.arch === 2) { p.quadraticCurveTo(x1, y1 + h.w * .42, h.x, y1 + h.w * .62); p.quadraticCurveTo(x0, y1 + h.w * .42, x0, y1); } else p.lineTo(x0, y1);
    p.lineTo(x0, y0); return p; };
  const wallGeo = (len, ht, holes, t = T) => { const s = new THREE.Shape(); s.moveTo(-len / 2, 0); s.lineTo(len / 2, 0); s.lineTo(len / 2, ht); s.lineTo(-len / 2, ht); s.lineTo(-len / 2, 0);
    holes.forEach(h => s.holes.push(holePath(h))); const g = new THREE.ExtrudeGeometry(s, { depth: t - .06, bevelEnabled: true, bevelThickness: .03, bevelSize: .03, bevelSegments: 1, curveSegments: 9 }); g.translate(0, 0, -(t - .06) / 2); return g; };
  const box = (a, b, c) => new THREE.BoxGeometry(a, b, c);
  // the openings, by storey: an arched door on the front, windows small and deep as in a hot country
  const front = [], back = [], side = [], doorW = 1.05, doorH = 2.0, dx = o.kind === 'tile' ? 0 : (r() < .5 ? -1 : 1) * Math.min(w * .18, 1.1);
  front.push({ x: dx, y: 0, w: doorW, h: doorH, arch: o.pointed ? 2 : 1, door: 1 });
  const nWin = Math.max(1, Math.floor((w - 2) / 2.4));
  for (let i = 0; i < nWin; i++) { const x = -w / 2 + 1.0 + (i + .5) * (w - 2) / nWin; if (Math.abs(x - dx) < 1.3) continue; front.push({ x, y: 1.1, w: .62, h: .95, arch: 1 }); }
  back.push({ x: 0, y: 1.1, w: .62, h: .95, arch: 1 }); side.push({ x: 0, y: 1.1, w: .55, h: .8, arch: 0 });
  if (o.two) { for (let i = 0; i < nWin + 1; i++) { const x = -w / 2 + .9 + (i + .5) * (w - 1.8) / (nWin + 1); front.push({ x, y: fh + .7, w: .66, h: 1.15, arch: 1, up: 1 }); }
    back.push({ x: -w * .2, y: fh + .7, w: .62, h: 1.0, arch: 1, up: 1 }); side.push({ x: 0, y: fh + .8, w: .55, h: .85, arch: 1, up: 1 }); }
  // the plinth, the four walls, the room's gloom behind every opening
  put(box(w + .16, pl, d + .16), 'plinth', 0, pl / 2, 0);
  const yW = pl;
  put(wallGeo(w, H, front), wallK, 0, yW, d / 2 - T / 2); put(wallGeo(w, H, back), wallK, 0, yW, -d / 2 + T / 2, Math.PI);
  put(wallGeo(d - 2 * T + .02, H, side), wallK, w / 2 - T / 2, yW, 0, Math.PI / 2); put(wallGeo(d - 2 * T + .02, H, side), wallK, -w / 2 + T / 2, yW, 0, -Math.PI / 2);
  put(box(w - 2 * T, H - .3, d - 2 * T), 'dark', 0, yW + (H - .3) / 2, 0);
  // the door: five cedar boards in its colour set back in the reveal under a half-round head, iron studs, a stone step, the tile frame round it
  for (const h of front.filter(h => h.door)) { const dz = d / 2 - T * .7, nb = 5, sh = h.h - h.w / 2;
    for (let i = 0; i < nb; i++) put(box(h.w / nb - .012, sh + .02, .06), doorK, h.x - h.w / 2 + (i + .5) * h.w / nb, yW + sh / 2, dz);
    put(new THREE.CylinderGeometry(h.w / 2, h.w / 2, .06, 14, 1, false, -Math.PI / 2, Math.PI), doorK, h.x, yW + sh, dz, 0, -Math.PI / 2);
    for (let i = 0; i < 3; i++) for (let k = 0; k < 3; k++) put(new THREE.SphereGeometry(.025, 6, 4), 'iron', h.x - .3 + k * .3, yW + .45 + i * .55, dz + .04);
    put(box(h.w + .3, .1, .42), 'stone', h.x, yW - .02, d / 2 + .12);
    const tz = d / 2 + .02, ts = .17, top = yW + h.h + .12;
    for (const sx of [-1, 1]) put(box(ts, top - yW - .05, .03), 'zellige', h.x + sx * (h.w / 2 + .17), yW + .05 + (top - yW - .05) / 2, tz);
    put(box(h.w + .34 + ts, ts, .03), 'zellige', h.x, top + ts / 2, tz); }
  // windows: a stone sill, a grille of three iron bars, or (upstairs at the front, if o.lattice) a cedar lattice screen on brackets
  for (const [list, face] of [[front, 0], [back, 1]]) for (const h of list) { if (h.door) continue; const z = face ? -(d / 2) : d / 2, s = face ? -1 : 1, hx = h.x * s;
    put(box(h.w + .22, .08, .2), 'stone', hx, yW + h.y - .04, z + s * .05);
    if (h.up && o.lattice && !face) { const bw = h.w + .34, bh = h.h + .25, by = yW + h.y + bh / 2 - .12;
      put(box(bw, bh, .4), 'dark', hx, by, z + s * .2);
      for (let i = 0; i <= 7; i++) put(box(i % 7 ? .035 : .07, bh, .04), 'cedar', hx - bw / 2 + i * bw / 7, by, z + s * .42);
      for (let i = 1; i < 10; i++) put(box(bw, .035, .035), 'cedar', hx, by - bh / 2 + i * bh / 10, z + s * .43);
      put(box(bw + .12, .08, .56), 'cedar', hx, by + bh / 2 + .04, z + s * .22); put(box(bw + .08, .08, .52), 'cedar', hx, by - bh / 2 - .04, z + s * .22);
      for (const sx of [-1, 1]) put(box(.08, .32, .3), 'cedar', hx + sx * (bw / 2 - .08), by - bh / 2 - .22, z + s * .12);
      continue; }
    for (let i = 0; i < 3; i++) put(new THREE.CylinderGeometry(.018, .018, h.h - h.w / 2, 5), 'iron', hx - h.w / 3 + i * h.w / 3, yW + h.y + (h.h - h.w / 2) / 2, z - s * .1); }
  for (const sx of [-1, 1]) for (const h of side) put(box(h.w + .2, .08, .2), 'stone', sx * (w / 2 + .05), yW + h.y - .04, 0, sx * Math.PI / 2);
  const top = yW + H; let roofTop = top, depthOut = d / 2 + .3;
  if (o.kind === 'tile') {
    // Roman: a stone cornice, a hipped roof at 22° in pantile, ridge tiles on the hips and the ridge, rafter ends under the eaves
    put(box(w + .36, .16, d + .36), 'stone', 0, top + .08, 0);
    const over = .45, rw = (w + 2 * over) / 2, rd = (d + 2 * over) / 2, y0 = top + .16, k = Math.tan(22 * Math.PI / 180), long = rw >= rd, a = Math.min(rw, rd), rise = k * a, rl = Math.abs(rw - rd);
    const R0 = long ? [new THREE.Vector3(-rl, y0 + rise, 0), new THREE.Vector3(rl, y0 + rise, 0)] : [new THREE.Vector3(0, y0 + rise, -rl), new THREE.Vector3(0, y0 + rise, rl)];
    const C = [[-rw, rd], [rw, rd], [rw, -rd], [-rw, -rd]].map(([x, z]) => new THREE.Vector3(x, y0, z));
    const plane = (pts, slopeX) => { const g = new THREE.BufferGeometry(), p = []; for (let i = 1; i < pts.length - 1; i++) p.push(...pts[0].toArray(), ...pts[i].toArray(), ...pts[i + 1].toArray());
      g.setAttribute('position', new THREE.Float32BufferAttribute(p, 3)); g.computeVertexNormals(); put(g, 'pantile', 0, 0, 0, 0, 0, 0, slopeX); };
    // the four slopes: two trapezoids along the ridge, two triangles at its ends (the ridge's near end is R0[1] on +x or +z)
    if (long) { plane([C[0], C[1], R0[1], R0[0]], false); plane([C[2], C[3], R0[0], R0[1]], false); plane([C[1], C[2], R0[1]], true); plane([C[3], C[0], R0[0]], true); }
    else { plane([C[1], C[2], R0[0], R0[1]], true); plane([C[3], C[0], R0[1], R0[0]], true); plane([C[0], C[1], R0[1]], false); plane([C[2], C[3], R0[0]], false); }
    const rod = (A, B, rad) => { const L = A.distanceTo(B), g = new THREE.CylinderGeometry(rad, rad, L, 8, 1); g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), B.clone().sub(A).normalize())); g.translate(...A.clone().add(B).multiplyScalar(.5).toArray()); put(g, 'ridge'); };
    const lift = v => v.clone().add(new THREE.Vector3(0, .05, 0));
    rod(lift(C[0]), lift(R0[long ? 0 : 1]), .085); rod(lift(C[1]), lift(R0[1]), .085); rod(lift(C[2]), lift(R0[long ? 1 : 0]), .085); rod(lift(C[3]), lift(R0[0]), .085); if (rl > .05) rod(lift(R0[0]), lift(R0[1]), .1);
    put(box(w + 2 * over, .06, d + 2 * over), 'ridge', 0, y0 - .03, 0);
    for (const sz of [1, -1]) for (let x = -w / 2; x <= w / 2 + .01; x += .55) put(box(.09, .09, over), 'cedar', x, y0 - .1, sz * (d / 2 + over / 2 + .02));
    roofTop = y0 + rise;
    // the arcade (a loggia before the ground floor): round arches on lathed columns, a pantile lean-to over it
    if (o.arcade) { const n = Math.max(3, Math.round(w / 2.2)), ad = 1.7, az = d / 2 + ad, span = w / n, colH = 2.05;
      put(box(w + .2, .18, ad + .1), 'stone', 0, pl - .09 + .09, d / 2 + ad / 2);
      const hs = []; for (let i = 0; i < n; i++) hs.push({ x: -w / 2 + (i + .5) * span, y: 0, w: span - .36, h: colH + (span - .36) / 2, arch: 1 });
      put(wallGeo(w, colH + span / 2 + .35, hs, .26), wallK, 0, yW, az);
      const lp = [[0, 0], [.16, 0], [.16, .1], [.11, .16], [.1, colH - .25], [.13, colH - .15], [.18, colH - .06], [.18, colH], [0, colH]].map(([a, b]) => new THREE.Vector2(a, b));
      for (let i = 0; i <= n; i++) { const x = Math.max(-w / 2 + .16, Math.min(w / 2 - .16, -w / 2 + i * span)); put(new THREE.LatheGeometry(lp, 12), 'stone', x, yW, az + .24); }
      const lw = w + .3, lt = yW + colH + span / 2 + .35, ll = ad + .6, lpitch = .2; put(box(lw, .12, .3), 'stone', 0, lt + .06, az);
      const g = new THREE.PlaneGeometry(lw, ll); g.rotateX(-Math.PI / 2); put(g, 'pantile', 0, lt + .22, d / 2 + ll / 2, 0, lpitch);
      depthOut = az + .4; }
  } else {
    // flat: a slab, a parapet with a rounded top, rainwater spouts through it, the terrace behind
    put(box(w - .2, .14, d - .2), 'plinth', 0, top - .07, 0);
    const ph = .62, pt = .26, cap = (len) => { const g = new THREE.CylinderGeometry(pt / 2, pt / 2, len, 10, 1, false, 0, Math.PI); g.rotateZ(Math.PI / 2); return g; };
    for (const sz of [1, -1]) { put(box(w + .04, ph - pt / 2, pt), wallK, 0, top + (ph - pt / 2) / 2 - .05, sz * (d / 2 - pt / 2 + .02)); put(cap(w + .04), wallK, 0, top + ph - pt / 2 - .05, sz * (d / 2 - pt / 2 + .02)); }
    for (const sx of [-1, 1]) { put(box(pt, ph - pt / 2, d - .2), wallK, sx * (w / 2 - pt / 2 + .02), top + (ph - pt / 2) / 2 - .05, 0); put(cap(d - .2), wallK, sx * (w / 2 - pt / 2 + .02), top + ph - pt / 2 - .05, 0, Math.PI / 2); }
    for (const sx of [-1, 1]) put(new THREE.CylinderGeometry(.06, .07, .55, 8), 'terra', sx * w * .3, top - .05, d / 2 + .22, 0, Math.PI / 2 + .25);
    roofTop = top + ph;
    // the dome (a rich house's or a temple's): a drum, the dome in blue glaze or limewash, a stone ring, a gilt finial
    if (o.dome) { const R = Math.min(w, d) * .27, x2 = -w * .18, z2 = -d * .1, pts = [];
      put(new THREE.CylinderGeometry(R * 1.02, R * 1.02, 1.0, 24), wallK, x2, top + .5, z2);
      for (let i = 0; i <= 12; i++) { const a = i / 12 * Math.PI / 2; pts.push(new THREE.Vector2(Math.max(.001, R * Math.cos(a) * (1 + .06 * Math.sin(a * 2))), R * 1.08 * Math.sin(a))); }
      put(new THREE.LatheGeometry(pts, 28), o.dome === 'white' ? wallK : 'glaze', x2, top + 1.0, z2);
      put(new THREE.TorusGeometry(R * 1.03, .05, 6, 28), 'stone', x2, top + 1.01, z2, 0, Math.PI / 2);
      put(new THREE.LatheGeometry([[.001, 0], [.07, 0], [.05, .12], [.09, .2], [.001, .42]].map(([a, b]) => new THREE.Vector2(a, b)), 10), 'gold', x2, top + 1.0 + R * 1.08 - .02, z2);
      roofTop = Math.max(roofTop, top + 1.0 + R * 1.08 + .4); }
    // the pergola: four cedar posts, two beams, the striped awning
    if (o.pergola) { const pw = Math.min(2.6, w * .42), pd = Math.min(2.2, d * .45), px0 = w / 2 - pw / 2 - .35, pz0 = d / 2 - pd / 2 - .35, ph2 = 1.95;
      for (const [sx, sz] of [[1, 1], [1, -1], [-1, 1], [-1, -1]]) put(new THREE.CylinderGeometry(.05, .06, ph2, 8), 'cedar', px0 + sx * pw / 2, top + ph2 / 2, pz0 + sz * pd / 2);
      for (const sz of [1, -1]) put(box(pw + .3, .09, .09), 'cedar', px0, top + ph2, pz0 + sz * pd / 2);
      const g = new THREE.PlaneGeometry(pw + .1, pd + .2); g.rotateX(-Math.PI / 2); put(g, 'awning', px0, top + ph2 + .07, pz0, 0, .06);
      roofTop = Math.max(roofTop, top + ph2 + .1); }
    // pots on the parapet, a bush in each
    for (let i = 0; i < 2; i++) { const x = (i ? 1 : -1) * (w / 2 - .5) * (.4 + r() * .5);
      put(new THREE.LatheGeometry([[.001, 0], [.12, 0], [.17, .12], [.15, .26], [.18, .3], [.001, .3]].map(([a, b]) => new THREE.Vector2(a, b)), 12), 'terra', x, top + ph - .05, d / 2 - .13);
      put(new THREE.IcosahedronGeometry(.22, 2), 'leaf', x, top + ph + .37, d / 2 - .13); }
  }
  // the outside stair to the roof (Greek-island): a solid flight up the side wall, stone treads
  if (o.stair && o.kind !== 'tile') { const sx = -(w / 2 + .5), n = Math.round(H / .24), run = Math.min(d - .6, n * .27), step = run / n, rise = H / n;
    for (let i = 0; i < n; i++) { const z = d / 2 - .4 - i * step, hy = (i + 1) * rise; put(box(.9, hy, step + .01), wallK, sx, yW + hy / 2, z - step / 2); put(box(.92, .04, step + .02), 'stone', sx, yW + hy + .02, z - step / 2); } }
  // greenery at the door: a cypress in a pot (a Roman house always), or a bougainvillea up the wall
  if (o.green !== false) { const gx = (dx > 0 ? -1 : 1) * (w / 2 - .55), gz = d / 2 + (o.kind === 'tile' ? (o.arcade ? 2.2 : .45) : .45);
    if (o.kind === 'tile' || r() < .5) { const ht = 3.4 + r() * 1.6, cp = [[.001, 0], [.34, .25], [.42, ht * .35], [.3, ht * .75], [.001, ht]].map(([a, b]) => new THREE.Vector2(a, b));
      const g = new THREE.LatheGeometry(cp, 12), P = g.attributes.position; for (let i = 0; i < P.count; i++) { const k = 1 + .12 * Math.sin(P.getY(i) * 7 + Math.atan2(P.getZ(i), P.getX(i)) * 5 + r() * .5); P.setX(i, P.getX(i) * k); P.setZ(i, P.getZ(i) * k); } g.computeVertexNormals();
      put(g, 'leaf2', gx, yW + .3, gz); put(new THREE.LatheGeometry([[.001, 0], [.2, 0], [.26, .2], [.24, .42], [.001, .42]].map(([a, b]) => new THREE.Vector2(a, b)), 12), 'terra', gx, 0, gz); }
    else { // a bougainvillea: a woody stem up the wall and a spray of small leaves and blooms thinning toward its top, spreading under the parapet
      const ht = Math.min(top - .3, yW + 2.4 + r() * (top - yW - 2.4)), lean = (r() - .5) * .6; put(new THREE.CylinderGeometry(.03, .05, ht - .1, 5), 'cedar', gx + lean / 2, (ht - .1) / 2 + .05, d / 2 + .1, 0, 0, -lean / ht);
      for (let i = 0; i < 120; i++) { const t = Math.pow(r(), .7), y = .3 + t * (ht - .3), spread = .25 + .9 * t * t, x = Math.max(-w / 2 + .1, Math.min(w / 2 - .1, gx + lean * t + (r() - .5) * 2 * spread));
        put(new THREE.IcosahedronGeometry(.045 + r() * .05, 0), r() < .55 ? 'bloom' : 'leaf', x, y, d / 2 + .1 + r() * .14, r() * 6, r() * 6); } } }
  // one mesh per material
  const group = new THREE.Group(); let tris = 0;
  for (const [key, geos] of buckets) { const [base, idx] = key.split(':'), m = idx != null ? Mt[base][+idx] : Mt[base], g = mergeGeometries(geos, false); for (const x of geos) x.dispose();
    const mesh = new THREE.Mesh(g, m); mesh.castShadow = base !== 'dark'; mesh.receiveShadow = true; mesh.name = key; group.add(mesh); tris += g.attributes.position.count / 3; }
  // the top it reports is the whole house's (pots, bushes and the cypress included), for whatever stands over or labels it
  roofTop = new THREE.Box3().setFromObject(group).max.y;
  group.userData = { roofTop, kind: o.kind }; return { group, roofTop, tris: Math.round(tris), draws: group.children.length, kind: o.kind, front: depthOut };
}

// a street's lots by Michael's mix: in every run of three lots one is Roman (which one, by the street's seed), two are flat.
// Each lot's own options come from a stream keyed by the street and the lot.
export function aurenneLot(street, i) {
  const t = Math.floor(i / 3), roman = hashKey(`${street}:triple:${t}`) % 3 === i % 3, r = stream(`${street}:lot:${i}`);
  const w = +(6.4 + r() * 3.2).toFixed(2), d = +(6.0 + r() * 2.0).toFixed(2), o = { kind: roman ? 'tile' : 'flat', w, d, two: r() < (roman ? .4 : .5) };
  if (roman) { o.arcade = w > 7.6; } else { o.dome = w > 8.2 && r() < .45 ? (r() < .75 ? 'blue' : 'white') : null; o.stair = !o.two && r() < .55; o.pergola = r() < .45; o.lattice = o.two && r() < .65; o.pointed = r() < .2; }
  return { o, r };
}

// ── the Gatelands house (Session 818): the lane slice's house (street.js, Session 769; Michael approved the slices, 12 Oct)
// moved here as it was, its draws in the same order from the stream it is handed, then merged to one mesh per material.
// gatelandsHouse(o, r) -> { group, flowers: [[x, y, z, span]] in the house's own frame, tris, draws }; o: w, d, h, rh, thatch,
// timber, wash, paint, shutters, boxes, pots, lantern, chim, doorX. The lane places it (street.js, house()).
let GM = null;
function gatelandsMats() {
  if (GM) return GM;
  const M = {
    plaster: [0xf4efe4, 0xf3ead2, 0xece2c6, 0xf1e6d8, 0xe9d7b0].map(c => mat('plaster', { ns: .5, color: c, rough: .95 })),
    stone: mat('stone', { ns: 1.3 }), beam: mat('beam', { ns: 1 }), thatch: mat('thatch', { ns: 1.4, rough: 1, color: 0xffe8c8 }), slate: mat('slate', { ns: 1.2, rough: .6 }),
    wood: mat('wood', { ns: 1.1 }), glass: new THREE.MeshStandardMaterial({ color: new THREE.Color(.05, .06, .07), roughness: .06, metalness: .1 }),
    lit: new THREE.MeshStandardMaterial({ color: new THREE.Color(.1, .08, .05), emissive: new THREE.Color(1, .66, .32), emissiveIntensity: .55, roughness: .2 }),
    frame: new THREE.MeshStandardMaterial({ color: new THREE.Color(.86, .83, .76), roughness: .7 }), iron: new THREE.MeshStandardMaterial({ color: new THREE.Color(.08, .08, .08), roughness: .5, metalness: .6 }),
    pot: new THREE.MeshStandardMaterial({ color: new THREE.Color(.62, .32, .2), roughness: .8 }),
  };
  const PAINT = [[.16, .30, .48], [.20, .38, .26], [.56, .14, .11], [.72, .58, .20], [.30, .44, .52]].map(c => { const m = mat('wood', { ns: .8 }); m.color.setRGB(c[0] * 2.2, c[1] * 2.2, c[2] * 2.2, THREE.SRGBColorSpace); return m; });
  return GM = { M, PAINT };
}
// every mesh of a house baked into the house's frame and merged by material: one draw per material, the same picture
export function mergeByMaterial(g) {
  g.updateMatrixWorld(true); const inv = g.matrixWorld.clone().invert(), by = new Map(); let tris = 0;
  g.traverse(o => { if (!o.isMesh) return; let geo = o.geometry.index ? o.geometry.toNonIndexed() : o.geometry.clone(); geo.clearGroups();
    geo.applyMatrix4(inv.clone().multiply(o.matrixWorld)); for (const k of Object.keys(geo.attributes)) if (!['position', 'normal', 'uv'].includes(k)) geo.deleteAttribute(k);
    if (!geo.attributes.uv) geo.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(geo.attributes.position.count * 2), 2));
    if (!by.has(o.material)) by.set(o.material, { geos: [], cast: o.castShadow }); by.get(o.material).geos.push(geo); });
  for (const c of [...g.children]) { g.remove(c); c.traverse(o => o.geometry && o.geometry.dispose()); }
  for (const [m, { geos, cast }] of by) { const geo = mergeGeometries(geos, false); geos.forEach(x => x.dispose()); const mesh = new THREE.Mesh(geo, m); mesh.castShadow = cast; mesh.receiveShadow = true; g.add(mesh); tris += geo.attributes.position.count / 3; }
  return Math.round(tris);
}
export function gatelandsHouse(o, r) {
  const { M, PAINT } = gatelandsMats(), flowerBits = [];
  const g = new THREE.Group(), { w, d, h } = o, rh = o.rh ?? w * .42, paint = PAINT[o.paint % PAINT.length];
  const add = (geo, m, x = 0, y = 0, z = 0, ry = 0, cast = true) => { const mm = new THREE.Mesh(geo, m); mm.position.set(x, y, z); mm.rotation.y = ry; mm.castShadow = cast; mm.receiveShadow = true; g.add(mm); return mm; };
  // the walls: a pentagon profile extruded through the depth, with holes for windows and the door
  const sh = new THREE.Shape([[-w / 2, 0], [w / 2, 0], [w / 2, h], [0, h + rh], [-w / 2, h]].map(([x, y]) => new THREE.Vector2(x, y)));
  const holes = [], stories = h > 4.6 ? 2 : 1, nWin = Math.max(1, Math.floor((w - 1.6) / 2.3)), doorX = (o.doorX ?? (r() < .5 ? -1 : 1)) * w * .18;
  holes.push({ x: doorX, y: .68, w: 1.1, h: 2.05, door: true });
  for (let s = 0; s < stories; s++) for (let k = 0; k < nWin + (s ? 1 : 0); k++) { const x = -w / 2 + (k + .5) * w / (nWin + (s ? 1 : 0)); if (!s && Math.abs(x - doorX) < 1.4) continue; holes.push({ x, y: s ? h * .58 : 1.25, w: s ? .78 : .9, h: s ? .95 : 1.12 }); }
  for (const H_ of holes) { const p = new THREE.Path(); p.moveTo(H_.x - H_.w / 2, H_.y); p.lineTo(H_.x + H_.w / 2, H_.y); p.lineTo(H_.x + H_.w / 2, H_.y + H_.h); p.lineTo(H_.x - H_.w / 2, H_.y + H_.h); p.lineTo(H_.x - H_.w / 2, H_.y); sh.holes.push(p); }
  const wg = new THREE.ExtrudeGeometry(sh, { depth: d, bevelEnabled: false }); wg.translate(0, 0, -d / 2); worldUV(wg, .42);
  add(wg, M.plaster[o.wash % M.plaster.length]);
  // the footing
  { const b = new THREE.BoxGeometry(w + .3, .7, d + .3); worldUV(b, .5); add(b, M.stone, 0, .35, 0); }
  // timber framing on the front and back
  if (o.timber) for (const side of [1, -1]) { const z = side * (d / 2 + .04), bm = (bw, bh, x, y, rz = 0) => { const b = new THREE.BoxGeometry(bw, bh, .14); worldUV(b, .8); const m = add(b, M.beam, x, y, z); m.rotation.z = rz; };
    bm(.24, h - .7, -w / 2 + .12, .7 + (h - .7) / 2); bm(.24, h - .7, w / 2 - .12, .7 + (h - .7) / 2); bm(w, .22, 0, .8); bm(w, .22, 0, h - .1); if (stories > 1) bm(w, .2, 0, h * .5);
    for (let k = 1; k < 5; k++) { const x = -w / 2 + k * w / 5; if (holes.some(H_ => Math.abs(H_.x - x) < H_.w / 2 + .2)) continue; bm(.18, h - .9, x, .7 + (h - .9) / 2); }
    const lb = (h * .5 - .9); bm(.16, Math.hypot(1.3, lb), -w / 2 + .85, .9 + lb / 2, Math.atan2(1.3, lb)); bm(.16, Math.hypot(1.3, lb), w / 2 - .85, .9 + lb / 2, -Math.atan2(1.3, lb)); }
  // windows and the door
  for (const H_ of holes) for (const side of [1, -1]) { const zf = side * d / 2;
    if (H_.door) { if (side < 0) { add(new THREE.BoxGeometry(H_.w, H_.h, .08), M.wood, H_.x, H_.y + H_.h / 2, zf - side * .1); continue; }
      const dg = new THREE.BoxGeometry(H_.w, H_.h, .08); worldUV(dg, .9); add(dg, paint, H_.x, H_.y + H_.h / 2, zf - .12);
      add(new THREE.TorusGeometry(.07, .015, 6, 12), M.iron, H_.x + H_.w * .3, H_.y + 1.05, zf - .06);
      const li = new THREE.BoxGeometry(H_.w + .5, .28, .32); worldUV(li, .6); add(li, M.stone, H_.x, H_.y + H_.h + .14, zf + .02);
      const st = new THREE.BoxGeometry(H_.w + .6, .2, .6); worldUV(st, .6); add(st, M.stone, H_.x, .45, zf + .3);
      if (o.lantern) { add(new THREE.BoxGeometry(.05, .05, .4), M.iron, H_.x + H_.w / 2 + .35, H_.y + 2.25, zf + .2); add(new THREE.BoxGeometry(.18, .26, .18), M.lit, H_.x + H_.w / 2 + .35, H_.y + 2.05, zf + .38, 0, false); }
      if (o.pots) for (const px of [-1, 1]) { add(new THREE.CylinderGeometry(.2, .15, .32, 12), M.pot, H_.x + px * (H_.w / 2 + .35), .56, zf + .35); flowerBits.push([null, H_.x + px * (H_.w / 2 + .35), .78, zf + .35, .2]); }
      continue; }
    add(new THREE.BoxGeometry(H_.w, H_.h, .04), r() < .2 ? M.lit : M.glass, H_.x, H_.y + H_.h / 2, zf - side * .14, 0, false);
    const fr = (bw, bh, x, y) => add(new THREE.BoxGeometry(bw, bh, .1), M.frame, x, y, zf - side * .1, 0, false);
    fr(H_.w, .07, H_.x, H_.y + H_.h / 2); fr(.06, H_.h, H_.x, H_.y + H_.h / 2);
    const sl = new THREE.BoxGeometry(H_.w + .3, .1, .3); worldUV(sl, .6); add(sl, M.stone, H_.x, H_.y - .05, zf + side * .1);
    if (o.shutters) for (const sx of [-1, 1]) { const sg = new THREE.BoxGeometry(H_.w * .5, H_.h + .05, .05); worldUV(sg, .9); const m = add(sg, paint, H_.x + sx * (H_.w * .5 + .26), H_.y + H_.h / 2, zf + side * .12); m.rotation.y = sx * side * .5; }
    if (o.boxes && H_.y < 2 && side > 0) { add(new THREE.BoxGeometry(H_.w + .1, .22, .26), M.wood, H_.x, H_.y - .2, zf + .2); flowerBits.push([null, H_.x, H_.y - .02, zf + .2, H_.w * .5]); }
  }
  // the roof: a thick slab, bevelled round at the eaves; thatch or slate
  { const ov = o.thatch ? .55 : .28, t = o.thatch ? .55 : .14, s = rh / (w / 2), ye = h - ov * s, ovz = o.thatch ? .45 : .25;
    const rs = new THREE.Shape([[-(w / 2 + ov), ye], [0, h + rh], [w / 2 + ov, ye], [w / 2 + ov, ye + t], [0, h + rh + t], [-(w / 2 + ov), ye + t]].map(([x, y]) => new THREE.Vector2(x, y)));
    const rg = new THREE.ExtrudeGeometry(rs, { depth: d + ovz * 2, bevelEnabled: true, bevelThickness: o.thatch ? .28 : .03, bevelSize: o.thatch ? .26 : .03, bevelSegments: o.thatch ? 5 : 1 }); rg.translate(0, 0, -(d + ovz * 2) / 2);
    worldUV(rg, o.thatch ? .55 : .5, { slopeX: true }); add(rg, o.thatch ? M.thatch : M.slate);
    const rc = new THREE.CylinderGeometry(o.thatch ? .42 : .14, o.thatch ? .42 : .14, d + ovz * 2 + (o.thatch ? .5 : .1), 12); rc.rotateX(Math.PI / 2); worldUV(rc, .55, { slopeX: true });
    const cap = add(rc, o.thatch ? M.thatch : M.slate, 0, h + rh + t * .6, 0); if (o.thatch) cap.material = M.thatch; }
  // the chimney
  { const cx = (o.chim ?? 1) * (w / 2 - .55), cg = new THREE.BoxGeometry(.85, rh + 2.2, .85); worldUV(cg, .5); add(cg, M.stone, cx, h + (rh + 2.2) / 2 - .9, 0);
    add(new THREE.BoxGeometry(1.05, .14, 1.05), M.stone, cx, h + rh + 1.37, 0); for (const pz of [-.2, .2]) add(new THREE.CylinderGeometry(.12, .14, .45, 10), M.pot, cx, h + rh + 1.65, pz); }
  if (o.noMerge) { let tris = 0; g.traverse(m => { if (m.isMesh) tris += (m.geometry.index ? m.geometry.index.count : m.geometry.attributes.position.count) / 3; }); return { group: g, flowers: flowerBits.map(([, x, y, z, span]) => [x, y, z, span]), tris: Math.round(tris), draws: g.children.length }; }
  const tris = mergeByMaterial(g);
  return { group: g, flowers: flowerBits.map(([, x, y, z, span]) => [x, y, z, span]), tris, draws: g.children.length };
}


// ── the Markish hall (Session 819, a prototype for DECISION: the Mark's houses in the new kit) ──
// OG-034 (kept): timber halls on stone footings, steep snow-shedding roofs of dark shingle, carved gables with crossed
// bargeboards ending in beast heads, a porch on the gable end, few small windows. OG-033 (not kept) and today's game add the
// turf roof: a lower pitch, a roof of sod over birch bark. markHall(o, r): o.roof 'shingle' | 'turf', o.w (the gable's width),
// o.d (its length), o.porch, o.chimney, o.wall (a stain). One mesh per material, as Aurenne's.
export function markTextures() {
  if (TEX.shingle) return;
  // shingle: rounded-butt wooden shingles in staggered courses, weathered grey-brown, each one a shade of its own
  TEX.shingle = texPair(256, (x, y) => { const rows = 8, row = Math.floor(y * rows), v = y * rows - row, cols = 6, xx = x * cols + (row % 2) * .5, col = Math.floor(xx), u = xx - col, r = idr(row * 17 + ((col % cols) + cols) % cols + 9);
    const butt = Math.sqrt(Math.max(0, 1 - Math.pow((u - .5) * 2, 2))) * .25, edge = v < butt * .6 || u < .04 || u > .96, g = tn(x * 2, y * 30, 16, 3);
    const k = .26 + .08 * r + .05 * g; return [edge ? 0 : .5 + .5 * v, ...(edge ? [.07, .06, .05] : [k * 1.02, k * .95, k * .86])]; }, 2.6);
  // turf: a sod roof, grass over earth, worn thin in patches
  TEX.turf = texPair(256, (x, y) => { const n = tfbm(x, y, 8, 5, 31), m = tfbm(x, y, 32, 3, 33), bare = n < .38;
    return [n * .6 + m * .4, ...(bare ? [.33 + .08 * m, .27 + .06 * m, .18] : [.22 + .14 * n * m, .3 + .16 * n, .1 + .05 * m])]; }, 2.0);
}
let MM = null;
function markMats() {
  if (MM) return MM; markTextures();
  const std = (c, o = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: o.rough ?? .85 });
  const plank = c => { const m = mat('wood', { ns: 1.2 }); m.color.set(c).multiplyScalar(2.6); return m; };
  MM = { wall: [0x5a4430, 0x4a3826, 0x3e2e20, 0x66503a].map(plank), beam: mat('beam', { ns: 1.2, color: 0xa08068 }), stone: mat('stone', { ns: 1.4, color: 0xe0dcd2 }), shingle: mat('shingle', { ns: 1.5, rough: .8 }),
    turf: mat('turf', { ns: 1.2, rough: 1 }), bark: std(0xd8d0c0, { rough: .9 }), door: plank(0x3a2a1c), dark: std(0x0b0908, { rough: 1 }), iron: new THREE.MeshStandardMaterial({ color: 0x1c1a18, roughness: .5, metalness: .6 }),
    carve: mat('beam', { ns: 1.4, color: 0xc09070 }), glow: new THREE.MeshStandardMaterial({ color: 0x1a1008, emissive: new THREE.Color(1, .6, .28), emissiveIntensity: .5, roughness: .4 }) };
  MM.shingle.side = THREE.DoubleSide; MM.turf.side = THREE.DoubleSide; return MM;
}
export function markHall(o, r) {
  const Mt = markMats(), g = new THREE.Group(), w = o.w, d = o.d, turf = o.roof === 'turf', foot = .8, wh = turf ? 2.4 : 2.9, pitch = (turf ? 32 : 52) * Math.PI / 180, rise = Math.tan(pitch) * (w / 2 + .5);
  const wallM = Mt.wall[o.wall ?? Math.floor(r() * Mt.wall.length)];
  const add = (geo, m, x = 0, y = 0, z = 0, ry = 0, rx = 0, rz = 0, uv = .5, slopeX) => { if (m.map) worldUV(geo, uv, { slopeX }); const mesh = new THREE.Mesh(geo, m); mesh.position.set(x, y, z); mesh.rotation.set(rx, ry, rz, 'YXZ'); mesh.castShadow = m !== Mt.dark && m !== Mt.glow; mesh.receiveShadow = true; g.add(mesh); return mesh; };
  const box = (a, b, c) => new THREE.BoxGeometry(a, b, c);
  // the footing: a course of rough stone, a little proud of the walls
  add(box(w + .3, foot, d + .3), Mt.stone, 0, foot / 2, 0, 0, 0, 0, .45);
  // the walls: vertical planks (the wood texture's boards run up the wall), the gable ends rising to the roof's pitch, a door on the front gable
  const gable = (len) => { const s = new THREE.Shape([[-len / 2, 0], [len / 2, 0], [len / 2, wh], [0, wh + rise - .5 * Math.tan(pitch)], [-len / 2, wh]].map(([a, b]) => new THREE.Vector2(a, b))); return s; };
  const door = { w: 1.2, h: 2.1 };
  { const s = gable(w); const h = new THREE.Path(); h.moveTo(-door.w / 2, 0); h.lineTo(door.w / 2, 0); h.lineTo(door.w / 2, door.h - .25); h.quadraticCurveTo(0, door.h + .12, -door.w / 2, door.h - .25); h.lineTo(-door.w / 2, 0); s.holes.push(h);
    const wnd = new THREE.Path(), wy = wh + .5; wnd.moveTo(-.3, wy); wnd.lineTo(.3, wy); wnd.lineTo(.3, wy + .45); wnd.lineTo(-.3, wy + .45); wnd.lineTo(-.3, wy); s.holes.push(wnd);
    const geo = new THREE.ExtrudeGeometry(s, { depth: .22, bevelEnabled: false }); add(geo, wallM, 0, foot, d / 2 - .22, 0, 0, 0, .9);
    add(box(w - .5, wh - .1, .05), Mt.dark, 0, foot + (wh - .1) / 2, d / 2 - .3);
    add(box(.5, .4, .04), Mt.glow, 0, foot + wy + .22, d / 2 - .26); }
  add(new THREE.ExtrudeGeometry(gable(w), { depth: .22, bevelEnabled: false }), wallM, 0, foot, -d / 2, 0, 0, 0, .9);
  for (const sx of [-1, 1]) { const s = new THREE.Shape([[-d / 2, 0], [d / 2, 0], [d / 2, wh], [-d / 2, wh]].map(([a, b]) => new THREE.Vector2(a, b)));
    const n = Math.max(1, Math.floor(d / 4)); for (let i = 0; i < n; i++) { const z = -d / 2 + (i + .5) * d / n, p = new THREE.Path(); p.moveTo(z - .3, 1.3); p.lineTo(z + .3, 1.3); p.lineTo(z + .3, 1.8); p.lineTo(z - .3, 1.8); p.lineTo(z - .3, 1.3); s.holes.push(p);
      add(box(.04, .5, .6), r() < .4 ? Mt.glow : Mt.dark, sx * (w / 2 - .2), foot + 1.55, z); for (const k of [-1, 1]) add(box(.05, .58, .34), Mt.door, sx * (w / 2 + .06), foot + 1.55, z + k * .48, k * sx * .5); }
    add(new THREE.ExtrudeGeometry(s, { depth: .22, bevelEnabled: false }), wallM, sx * (w / 2 - .11), foot, 0, sx * Math.PI / 2 - Math.PI / 2 * sx + sx * Math.PI / 2, 0, 0, .9); }
  // the frame: corner posts, a sill and a wall plate, in dark beams
  for (const [sx, sz] of [[1, 1], [1, -1], [-1, 1], [-1, -1]]) add(box(.3, wh + .1, .3), Mt.beam, sx * (w / 2 - .05), foot + wh / 2, sz * (d / 2 - .05), 0, 0, 0, .8);
  for (const sx of [-1, 1]) { add(box(.26, .26, d + .1), Mt.beam, sx * (w / 2 - .02), foot + wh - .05, 0, 0, 0, 0, .8); add(box(.26, .2, d + .1), Mt.beam, sx * (w / 2 - .02), foot + .1, 0, 0, 0, 0, .8); }
  // the door: planks under a rounded head, iron strap hinges, a threshold of stone
  for (let i = 0; i < 5; i++) add(box(door.w / 5 - .01, door.h - .1, .06), Mt.door, -door.w / 2 + (i + .5) * door.w / 5, foot + (door.h - .1) / 2, d / 2 - .1, 0, 0, 0, .9);
  for (const y of [.5, 1.5]) add(box(door.w * .8, .06, .02), Mt.iron, -door.w * .1, foot + y, d / 2 - .06);
  add(box(door.w + .5, .2, .7), Mt.stone, 0, .1 + foot - .2, d / 2 + .3, 0, 0, 0, .45);
  // the roof: two slabs at the pitch, overhanging the gables; shingle, or turf over a birch-bark edge with a log holding it at the eaves
  const ov = .5, slope = (w / 2 + ov) / Math.cos(pitch), t = turf ? .32 : .12, ry0 = foot + wh - ov * Math.tan(pitch) + .05, len = d + (turf ? .8 : 1.2);
  for (const sx of [-1, 1]) { const geo = box(slope, t, len); geo.translate(sx * slope / 2, t / 2, 0); add(geo, turf ? Mt.turf : Mt.shingle, sx * -(w / 2 + ov), ry0, 0, 0, 0, sx * pitch, turf ? .6 : .9, true).rotation.z = sx * pitch;
    if (turf) { add(box(.04, .3, len), Mt.bark, sx * (w / 2 + ov + .02), ry0 + .05, 0, 0, 0, 0); add(new THREE.CylinderGeometry(.12, .12, len, 8).rotateX(Math.PI / 2), Mt.beam, sx * (w / 2 + ov - .05), ry0 + .22, 0, 0, 0, 0, .8); } }
  const ridgeY = ry0 + (w / 2 + ov) * Math.tan(pitch);
  if (!turf) add(box(.22, .16, len + .05), Mt.beam, 0, ridgeY + .12, 0, 0, 0, 0, .8);
  // the gables' carving: crossed bargeboards along each verge, running past the ridge into beast heads (OG-034's carved gables)
  if (!turf || o.carve) for (const sz of [1, -1]) { const z = sz * (len / 2 + .03);
    for (const sx of [-1, 1]) { const E = new THREE.Vector2(sx * (w / 2 + ov), ry0 + t), Rg = new THREE.Vector2(0, ridgeY + t), dir = Rg.clone().sub(E).normalize(), P = Rg.clone().addScaledVector(dir, .75), L = P.distanceTo(E);
      const bb = box(L, .3, .08); add(bb, Mt.carve, (E.x + P.x) / 2, (E.y + P.y) / 2 + .08, z, 0, 0, Math.atan2(P.y - E.y, P.x - E.x), .8);
      // the head: a curl at the board's top end, the beast's snout turned out over the gable
      const hs = new THREE.Shape(); hs.moveTo(0, 0); hs.quadraticCurveTo(.2, .35, .05, .6); hs.quadraticCurveTo(-.1, .75, -.35, .68); hs.quadraticCurveTo(-.18, .6, -.14, .5); hs.quadraticCurveTo(-.02, .38, -.15, 0); hs.lineTo(0, 0);
      const hg = new THREE.ExtrudeGeometry(hs, { depth: .08, bevelEnabled: true, bevelThickness: .02, bevelSize: .02, bevelSegments: 1, curveSegments: 6 }); hg.translate(0, 0, -.04);
      add(hg, Mt.carve, P.x, P.y + .05, z, sx > 0 ? 0 : Math.PI, 0, 0, .8); } }
  // the porch on the front gable: two carved posts and a little roof
  if (o.porch) { const pd = 1.8, pw = door.w + 1.4, ph = 2.5; for (const sx of [-1, 1]) add(new THREE.CylinderGeometry(.12, .14, ph, 8), Mt.beam, sx * pw / 2, foot + ph / 2 - .2, d / 2 + pd, 0, 0, 0, .8);
    for (const sx of [-1, 1]) { const pl = (pw / 2 + .3) / Math.cos(pitch * .85), geo = box(pl, .1, pd + .4); geo.translate(sx * pl / 2, 0, 0); add(geo, turf ? Mt.turf : Mt.shingle, sx * -(pw / 2 + .3), foot + ph - .2, d / 2 + pd / 2 + .1, 0, 0, sx * pitch * .85, .9, true); }
    add(box(pw + .3, .25, .25), Mt.beam, 0, foot + ph - .1, d / 2 + pd, 0, 0, 0, .8); add(box(pw + .2, .2, pd + .5), Mt.stone, 0, foot - .1, d / 2 + pd / 2 + .1, 0, 0, 0, .45); }
  // a stone chimney through the roof's back slope, or a smoke louver on the ridge
  if (o.chimney) { const cz = -d * .25, ch = ridgeY + .8; add(box(.9, ch, .9), Mt.stone, -(w / 4), ch / 2, cz, 0, 0, 0, .45); add(box(1.05, .15, 1.05), Mt.stone, -(w / 4), ch + .07, cz, 0, 0, 0, .45); }
  else { add(box(.7, .4, 1.2), Mt.beam, 0, ridgeY + .3, -d * .15, 0, 0, 0, .8); add(box(.9, .08, 1.4), turf ? Mt.turf : Mt.shingle, 0, ridgeY + .54, -d * .15, 0, 0, 0, .9); }
  const tris = mergeByMaterial(g); return { group: g, tris, draws: g.children.length, roofTop: new THREE.Box3().setFromObject(g).max.y };
}
