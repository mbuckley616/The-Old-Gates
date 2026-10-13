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
      put(new THREE.IcosahedronGeometry(.22, 1), 'leaf', x, top + ph + .37, d / 2 - .13); }
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
