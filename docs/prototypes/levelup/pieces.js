// Buildings as pieces (Session 816, card F6 of docs/design/visual-foundation.md; backlog K): the new kit's house builders,
// beginning with Aurenne. Lifted from the concept artist's prototype (docs/prototypes/aurenne/proposal.js, on the old shape
// kit) after Michael's B on DECISION #259 (12 Oct): "the mix, two in three flat, one in three Roman". The shapes are the
// proposal's: walls extruded with real arched openings, a dark room behind every one, the glazed tile round the door, the
// roof terrace with its parapet, dome, pergola and outside stair, and the Roman house's low hipped roof and arcade. What
// changes is the surface: lime plaster, pantile, glazed tile, ashlar and cedar are relief textures (normal maps), so a roof
// is four planes and not four hundred tile meshes, and a house is one mesh per material.
// aurenneHouse(o, r) -> { group, roofTop, tris, draws, kind }  (r: a seeded stream; o.kind 'flat' | 'tile', o.w, o.d, …)
// aurenneLot(street, i) -> the options for lot i of a street: the kind by Michael's mix, the rest by the lot's own seed.
// Since Session 831 to 834 it is every island's kit: Aurenne's houses, church (aurenneChurch) and civic buildings
// (aurenneCivic); the Gatelands' lane house (gatelandsHouse) and the concept run's plans (gatelandsBuilding, GL_PLANS);
// the Mark's hall (markHall) and its lots (markLot).
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { texPair, mat, worldUV, TEX, rnd } from './common.js';

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

// the kit every Aurenne builder shares (lifted out of aurenneHouse in Session 832 for the church): put() places a piece (a
// turn about y and a tilt, then a move), takes its UVs from where it lies and drops it in its material's bucket ('wall:2'
// is the third wall colour); wallGeo() is a wall with arched openings cut through; finish() merges each bucket to one mesh.
function aurKit() {
  const Mt = mats(), buckets = new Map();
  // a piece with userData.uvRep = [around, up] keeps its own UVs, repeated that many times (a dome's tiles, which a world projection seams)
  const put = (geo, key, x = 0, y = 0, z = 0, ry = 0, rx = 0, rz = 0, slopeX) => { const rep = geo.userData.uvRep, g = geo.index ? geo.toNonIndexed() : geo;
    if (rep) { const uv = g.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * rep[0], uv.getY(i) * rep[1]); } else g.deleteAttribute('uv');
    g.applyMatrix4(new THREE.Matrix4().compose(new THREE.Vector3(x, y, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(rx, ry, rz, 'YXZ')), new THREE.Vector3(1, 1, 1)));
    const base = key.split(':')[0]; if (!rep) { if (TEXTURED.has(base)) worldUV(g, UVS[base], { slopeX }); else g.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(g.attributes.position.count * 2), 2)); }
    if (!buckets.has(key)) buckets.set(key, []); buckets.get(key).push(g); };
  // an outline with holes; a hole {x,y,w,h,arch} has a half-round (1) or pointed (2) head
  const holePath = h => { const p = new THREE.Path(), x0 = h.x - h.w / 2, x1 = h.x + h.w / 2, y0 = h.y, y1 = h.y + h.h - (h.arch ? h.w / 2 : 0);
    p.moveTo(x0, y0); p.lineTo(x1, y0); p.lineTo(x1, y1);
    if (h.arch === 1) p.absarc(h.x, y1, h.w / 2, 0, Math.PI, false); else if (h.arch === 2) { p.quadraticCurveTo(x1, y1 + h.w * .42, h.x, y1 + h.w * .62); p.quadraticCurveTo(x0, y1 + h.w * .42, x0, y1); } else p.lineTo(x0, y1);
    p.lineTo(x0, y0); return p; };
  const wallGeo = (len, ht, holes, t) => { const s = new THREE.Shape(); s.moveTo(-len / 2, 0); s.lineTo(len / 2, 0); s.lineTo(len / 2, ht); s.lineTo(-len / 2, ht); s.lineTo(-len / 2, 0);
    holes.forEach(h => s.holes.push(holePath(h))); const g = new THREE.ExtrudeGeometry(s, { depth: t - .06, bevelEnabled: true, bevelThickness: .03, bevelSize: .03, bevelSegments: 1, curveSegments: 9 }); g.translate(0, 0, -(t - .06) / 2); return g; };
  const box = (a, b, c) => new THREE.BoxGeometry(a, b, c);
  const finish = () => { const group = new THREE.Group(); let tris = 0;
    for (const [key, geos] of buckets) { const [base, idx] = key.split(':'), m = idx != null ? Mt[base][+idx] : Mt[base], g = mergeGeometries(geos, false); for (const x of geos) x.dispose();
      const mesh = new THREE.Mesh(g, m); mesh.castShadow = base !== 'dark'; mesh.receiveShadow = true; mesh.name = key; group.add(mesh); tris += g.attributes.position.count / 3; }
    return { group, tris: Math.round(tris), draws: group.children.length, roofTop: new THREE.Box3().setFromObject(group).max.y }; };
  return { Mt, put, holePath, wallGeo, box, finish };
}

export function aurenneHouse(o, r) {
  const { Mt, put, wallGeo: wallG, box, finish } = aurKit(), w = o.w, d = o.d;
  const T = .32, pl = .24, fh = 3.0, H = fh + (o.two ? 2.6 : 0), wallK = 'wall:' + (o.wall ?? Math.floor(r() * AUR.walls.length)), doorK = 'door:' + (o.door ?? Math.floor(r() * AUR.doors.length));
  const wallGeo = (len, ht, holes, t = T) => wallG(len, ht, holes, t);
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
  // one mesh per material; the top it reports is the whole house's (pots, bushes and the cypress included), for whatever stands over or labels it
  const { group, tris, draws, roofTop: rt } = finish(); roofTop = rt;
  group.userData = { roofTop, kind: o.kind }; return { group, roofTop, tris, draws, kind: o.kind, front: depthOut };
}

// a street's lots by Michael's mix: in every run of three lots one is Roman (which one, by the street's seed), two are flat.
// Each lot's own options come from a stream keyed by the street and the lot.
export function aurenneLot(street, i) {
  const t = Math.floor(i / 3), roman = hashKey(`${street}:triple:${t}`) % 3 === i % 3, r = stream(`${street}:lot:${i}`);
  const w = +(6.4 + r() * 3.2).toFixed(2), d = +(6.0 + r() * 2.0).toFixed(2), o = { kind: roman ? 'tile' : 'flat', w, d, two: r() < (roman ? .4 : .5) };
  if (roman) { o.arcade = w > 7.6; } else { o.dome = w > 8.2 && r() < .45 ? (r() < .75 ? 'blue' : 'white') : null; o.stair = !o.two && r() < .55; o.pergola = r() < .45; o.lattice = o.two && r() < .65; o.pointed = r() < .2; }
  return { o, r };
}

// ── the Church of the Weaver (Session 832, card F6: Aurenne's temples). The canon (§1.3): "domes on the churches", the
// Compact's towns under the Church's Priors; OG-061 and OG-043 draw them as a domed hall behind an arcade, a slender tower
// beside. At true size: a cube of lime-washed ashlar on a podium with steps, tall arched windows, a band of glazed tile
// under the cornice; a drum with arched lights and the great dome on it, in blue glaze or limewash, and on its top the
// Weaver's sign, a gilt shuttle; an arcaded porch across the front; a square bell tower with an open belfry and a little dome.
// o.w (the cube, 12 to 22 m), o.dome 'blue' | 'white', o.tower 0 | 1 | 2, o.corners (four small domes at the cube's corners,
// a cathedral's), o.wall (a wall colour index). aurenneChurch(o, r) -> { group, roofTop, tris, draws, kind: 'church', front }.
export function aurenneChurch(o, r) {
  const { put, wallGeo, box, finish } = aurKit(), W = o.w || 14, D = W, T = .8, pl = .9, H = +(W * .72).toFixed(2), pd = 4.4, wallK = 'wall:' + (o.wall ?? 4), domeK = o.dome === 'white' ? wallK : 'glaze';
  const lathe = (pts, n) => new THREE.LatheGeometry(pts.map(([a, b]) => new THREE.Vector2(a, b)), n);
  const domeUV = (g, rad) => { if (domeK === 'glaze') g.userData.uvRep = [Math.max(1, Math.round(2 * Math.PI * rad * UVS.glaze)), Math.max(1, Math.round(rad * 1.7 * UVS.glaze))]; return g; };
  // the podium the church and its porch stand on, and three steps down to the square
  const front = D / 2 + pd + .6; put(box(W + 1.2, pl, D + pd + 1.2), 'plinth', 0, pl / 2, pd / 2);
  for (let i = 0; i < 3; i++) { const h = pl * (3 - i) / 4; put(box(W * .55, h, .46), 'stone', 0, h / 2, front + .23 + i * .46); }
  // the walls: the great door on the front, two tall windows beside it; three tall windows on each side and on the back
  const tall = n => { const hs = [], wi = Math.min(1.5, W * .08); for (let i = 0; i < n; i++) hs.push({ x: -W / 2 + (i + .5) * W / n, y: 3.2, w: wi, h: H * .42, arch: 1 }); return hs; };
  const door = { x: 0, y: 0, w: 2.6, h: 5.2, arch: 1, door: 1 }, fh = [door, { x: -W * .3, y: 3.2, w: Math.min(1.5, W * .08), h: H * .42, arch: 1 }, { x: W * .3, y: 3.2, w: Math.min(1.5, W * .08), h: H * .42, arch: 1 }];
  put(wallGeo(W, H, fh, T), wallK, 0, pl, D / 2 - T / 2); put(wallGeo(W, H, tall(3), T), wallK, 0, pl, -D / 2 + T / 2, Math.PI);
  for (const sx of [-1, 1]) put(wallGeo(D - 2 * T + .02, H, tall(3), T), wallK, sx * (W / 2 - T / 2), pl, 0, sx * Math.PI / 2);
  put(box(W - 2 * T, H - .4, D - 2 * T), 'dark', 0, pl + (H - .4) / 2, 0);
  // stone sills, and an iron grille in each window
  for (let f = 0; f < 4; f++) { const ry = [0, Math.PI, Math.PI / 2, -Math.PI / 2][f], hs = f ? tall(3) : fh.slice(1), cz = f < 2 ? D / 2 : W / 2;
    for (const h of hs) { const c = Math.cos(ry), sn = Math.sin(ry), at = (lx, z) => [lx * c + z * sn, -lx * sn + z * c];
      const [sx2, sz2] = at(h.x, cz + .08); put(box(h.w + .3, .12, .3), 'stone', sx2, pl + h.y - .06, sz2, ry);
      for (let i = 1; i < 4; i++) { const [gx, gz] = at(h.x - h.w / 2 + i * h.w / 4, cz - T * .5); put(new THREE.CylinderGeometry(.025, .025, h.h - h.w / 2, 5), 'iron', gx, pl + h.y + (h.h - h.w / 2) / 2, gz, ry); } } }
  // the great door: two leaves of cedar boards under the half-round head, set in the reveal, a frame of glazed tile round it
  { const dz = D / 2 - T * .6, sh = door.h - door.w / 2, doorK = 'door:' + (o.door ?? 3); for (let i = 0; i < 8; i++) put(box(door.w / 8 - .015, sh + .02, .08), doorK, -door.w / 2 + (i + .5) * door.w / 8, pl + sh / 2, dz);
    put(new THREE.CylinderGeometry(door.w / 2, door.w / 2, .08, 18, 1, false, -Math.PI / 2, Math.PI), doorK, 0, pl + sh, dz, 0, -Math.PI / 2);
    for (let i = 0; i < 4; i++) for (let k = 0; k < 2; k++) put(new THREE.SphereGeometry(.04, 6, 4), 'iron', (k ? 1 : -1) * door.w * .3, pl + .6 + i * .95, dz + .05);
    const ts = .3, top = pl + door.h + .2; for (const sx of [-1, 1]) put(box(ts, top - pl, .04), 'zellige', sx * (door.w / 2 + .3), pl + (top - pl) / 2, D / 2 + .02); put(box(door.w + .6 + ts, ts, .04), 'zellige', 0, top + ts / 2, D / 2 + .02); }
  // the band of glazed tile under the cornice, the cornice, the flat roof behind a parapet
  const top = pl + H; for (const [len, x, z, ry] of [[W, 0, D / 2 + .02, 0], [W, 0, -D / 2 - .02, Math.PI], [D, W / 2 + .02, 0, Math.PI / 2], [D, -W / 2 - .02, 0, -Math.PI / 2]]) put(box(len, .7, .04), 'zellige', x, top - 1.1, z, ry);
  put(box(W + .6, .4, D + .6), 'stone', 0, top + .2, 0); put(box(W - .2, .2, D - .2), 'plinth', 0, top + .1, 0);
  for (const sz of [1, -1]) put(box(W + .3, .8, .35), wallK, 0, top + .8, sz * (D / 2 + .1)); for (const sx of [-1, 1]) put(box(.35, .8, D - .4), wallK, sx * (W / 2 + .1), top + .8, 0);
  // the drum, its arched lights, the dome, the stone rings, and the Weaver's shuttle on a gilt rod
  const R = W * .31, dh = R * .72, y0 = top + .4, nl = 12; put(new THREE.CylinderGeometry(R, R * 1.03, dh, 36, 1, true), wallK, 0, y0 + dh / 2, 0); put(new THREE.CylinderGeometry(R - .5, R - .5, dh, 24), 'dark', 0, y0 + dh / 2, 0);
  { const lw = Math.min(1.1, 2 * Math.PI * R / nl * .38), lh = dh * .6, sh = new THREE.Shape(); sh.moveTo(-lw / 2, 0); sh.lineTo(lw / 2, 0); sh.lineTo(lw / 2, lh - lw / 2); sh.absarc(0, lh - lw / 2, lw / 2, 0, Math.PI, false); sh.lineTo(-lw / 2, 0);
    for (let i = 0; i < nl; i++) { const a = (i + .5) / nl * Math.PI * 2; put(new THREE.ShapeGeometry(sh, 6), 'dark', Math.sin(a) * (R + .03), y0 + dh * .2, Math.cos(a) * (R + .03), a); put(box(lw + .2, .1, .25), 'stone', Math.sin(a) * (R + .06), y0 + dh * .2 - .05, Math.cos(a) * (R + .06), a); } }
  put(new THREE.TorusGeometry(R * 1.03, .14, 6, 36), 'stone', 0, y0 + .05, 0, 0, Math.PI / 2); put(new THREE.TorusGeometry(R * 1.02, .12, 6, 36), 'stone', 0, y0 + dh, 0, 0, Math.PI / 2);
  const dTop = y0 + dh + R * 1.12; { const pts = []; for (let i = 0; i <= 16; i++) { const a = i / 16 * Math.PI / 2; pts.push([Math.max(.001, R * Math.cos(a) * (1 + .05 * Math.sin(a * 2))), R * 1.12 * Math.sin(a)]); } put(domeUV(lathe(pts, 40), R), domeK, 0, y0 + dh, 0); }
  put(lathe([[.001, 0], [.45, 0], [.3, .35], [.18, .5], [.22, .7], [.001, .75]], 14), 'stone', 0, dTop - .05, 0);
  put(new THREE.CylinderGeometry(.06, .06, 2.2, 8), 'gold', 0, dTop + 1.6, 0); put(new THREE.SphereGeometry(.3, 14, 10), 'gold', 0, dTop + 1.1, 0);
  // the shuttle sits on the rod's tip and leans, so that from the square it reads as the Weaver's tool and not as a cross
  { const L = 1.5, g = lathe([[.001, -L], [.08, -L * .8], [.22, -L * .35], [.26, 0], [.22, L * .35], [.08, L * .8], [.001, L]], 12); g.rotateZ(Math.PI / 2); g.scale(1, .55, 1); g.rotateZ(.38); put(g, 'gold', 0, dTop + 2.85, 0); }
  // a cathedral's four small domes at the cube's corners, each on a little drum
  if (o.corners) for (const [sx, sz] of [[1, 1], [1, -1], [-1, 1], [-1, -1]]) { const r2 = W * .085, x = sx * (W / 2 - r2 - .5), z = sz * (D / 2 - r2 - .5), y = top + .4, pts = [];
    put(new THREE.CylinderGeometry(r2, r2, r2 * 1.1, 16), wallK, x, y + r2 * .55, z); for (let i = 0; i <= 8; i++) { const a = i / 8 * Math.PI / 2; pts.push([Math.max(.001, r2 * Math.cos(a)), r2 * 1.1 * Math.sin(a)]); }
    put(domeUV(lathe(pts, 18), r2), domeK, x, y + r2 * 1.1, z); put(new THREE.SphereGeometry(.14, 8, 6), 'gold', x, y + r2 * 2.2 + .1, z); }
  // the porch: an arcade of round arches on columns across the front, an arch at each end, a flat roof behind a parapet
  { const n = W > 16 ? 7 : 5, span = (W + .4) / n, colH = 4.2, ah = colH + span / 2 + .9, az = D / 2 + pd - .3, hs = [];
    for (let i = 0; i < n; i++) hs.push({ x: -(W + .4) / 2 + (i + .5) * span, y: 0, w: span - .55, h: colH + (span - .55) / 2, arch: 1 });
    put(wallGeo(W + .4, ah, hs, .6), wallK, 0, pl, az);
    for (const sx of [-1, 1]) put(wallGeo(pd - .3, ah, [{ x: 0, y: 0, w: Math.min(2.2, pd - 1.6), h: colH + 1, arch: 1 }], .6), wallK, sx * (W / 2 - .1), pl, D / 2 + (pd - .3) / 2, sx * Math.PI / 2);
    const lp = [[0, 0], [.26, 0], [.26, .16], [.19, .26], [.17, colH - .38], [.21, colH - .24], [.3, colH - .1], [.3, colH], [0, colH]];
    for (let i = 0; i <= n; i++) { const x = Math.max(-W / 2 + .1, Math.min(W / 2 - .1, -(W + .4) / 2 + i * span)); put(lathe(lp, 14), 'stone', x, pl, az + .4); }
    put(box(W + .6, .3, pd + .2), 'stone', 0, pl + ah + .15, D / 2 + pd / 2 - .1); put(box(W + .4, .5, .04), 'zellige', 0, pl + ah - .45, az + .32);
    put(box(W + .5, .55, .3), wallK, 0, pl + ah + .57, az + .1); }
  // the bell tower: a square shaft with slit windows, a string course, an open belfry with a bell in it, a cornice and a small dome
  let towerTop = 0; for (let t = 0; t < (o.tower ?? 1); t++) { const sx = t ? -1 : 1, s = 3.6, Ht = +(H * 1.9).toFixed(2), bh = 4.2, x = sx * (W / 2 + s / 2 + .4), z = D / 2 + pd - s / 2 - .2, sh = Ht - bh;
    put(box(s + .4, pl, s + .4), 'plinth', x, pl / 2, z); put(box(s, sh, s), wallK, x, pl + sh / 2, z);
    for (let k = 1; k <= 3; k++) put(box(.28, 1.2, .06), 'dark', x, pl + k * sh / 4, z + s / 2 + .01);
    put(box(s + .3, .3, s + .3), 'stone', x, pl + sh * .55, z); put(box(s + .4, .35, s + .4), 'stone', x, pl + sh + .17, z);
    for (let f = 0; f < 4; f++) { const ry = f * Math.PI / 2; put(wallGeo(s, bh, [{ x: 0, y: .5, w: 1.5, h: 3.0, arch: 1 }], .5), wallK, x + Math.sin(ry) * (s / 2 - .25), pl + sh + .35, z + Math.cos(ry) * (s / 2 - .25), ry); }
    put(lathe([[.001, 0], [.75, 0], [.7, .1], [.45, .6], [.35, 1.25], [.001, 1.3]], 16), 'gold', x, pl + sh + bh - 1.75, z);
    const ty = pl + sh + .35 + bh; put(box(s + .5, .4, s + .5), 'stone', x, ty + .2, z); const rt = s * .44, pts = []; for (let i = 0; i <= 10; i++) { const a = i / 10 * Math.PI / 2; pts.push([Math.max(.001, rt * Math.cos(a)), rt * 1.15 * Math.sin(a)]); }
    put(new THREE.CylinderGeometry(rt, rt, .6, 20), wallK, x, ty + .7, z); put(domeUV(lathe(pts, 22), rt), domeK, x, ty + 1, z); put(new THREE.CylinderGeometry(.04, .04, 1.2, 6), 'gold', x, ty + 1 + rt * 1.15 + .5, z); put(new THREE.SphereGeometry(.16, 10, 8), 'gold', x, ty + 1 + rt * 1.15 + .3, z);
    towerTop = Math.max(towerTop, ty + 1 + rt * 1.15 + 1.1); }
  // a cypress either side of the steps
  for (const sx of [-1, 1]) { const ht = 7 + r() * 2, x = sx * (W * .275 + 1.4), z = front + .5, cp = [[.001, 0], [.6, .4], [.75, ht * .35], [.55, ht * .75], [.001, ht]];
    const g = lathe(cp, 12), P = g.attributes.position; for (let i = 0; i < P.count; i++) { const k = 1 + .12 * Math.sin(P.getY(i) * 5 + Math.atan2(P.getZ(i), P.getX(i)) * 5 + r() * .5); P.setX(i, P.getX(i) * k); P.setZ(i, P.getZ(i) * k); } g.computeVertexNormals();
    put(g, 'leaf2', x, .3, z); put(lathe([[.001, 0], [.4, 0], [.5, .3], [.46, .55], [.001, .55]], 12), 'terra', x, 0, z); }
  const out = finish(); out.group.userData = { roofTop: out.roofTop, kind: 'church', domeTop: dTop, towerTop };
  return { ...out, kind: 'church', front: front + 1.4, domeTop: dTop, towerTop, door };
}

// ── Aurenne's civic buildings (Session 833, card F6). The canon (§1.3): the Compact's Factors over the houses' ports, "every
// hull that passes is tithed", "warehouses on every quay"; OG-061 and OG-043 draw them arcaded, tiled, flat-roofed.
// aurenneCivic(o, r) -> { group, roofTop, tris, draws, kind, front }; o.kind:
// 'tithe': the Compact's tithe house on the quay. Two storeys, 9.8 m: a loggia of pointed arches before the ground floor
//   (the counting room behind it, the middle arch the carriage way), a band of glazed tile, the Factor's floor above with
//   tall windows and cedar lattice balconies, a parapet of stepped merlons, and a lookout on the roof to watch the hulls come
//   in, with the Compact's striped banner. o.w 18 to 26, o.d 12 to 15; o.crown 'plain' rounds the parapet off as the
//   houses' are, in place of the merlons.
// 'warehouse': a long store on the quay. Plain lime walls, a row of tall arched doors in cedar, small high windows, a low
//   pantile roof, a loading door with a hoist beam, crates and amphorae by the doors. o.w 18 to 30, o.d 10 to 12.
export function aurenneCivic(o, r) {
  const { put, wallGeo, box, finish } = aurKit(), kind = o.kind || 'tithe', W = o.w, D = o.d, T = .6, pl = .5, wallK = 'wall:' + (o.wall ?? (kind === 'tithe' ? 2 : 1)), doorK = 'door:' + (o.door ?? 1);
  const lathe = (pts, n) => new THREE.LatheGeometry(pts.map(([a, b]) => new THREE.Vector2(a, b)), n);
  // merlons along a run: a block with a smaller block stepped on it, every 1.1 m
  const merlons = (len, x, y, z, ry) => { if (o.crown === 'plain') { put(new THREE.CylinderGeometry(.21, .21, len, 10, 1, false, 0, Math.PI).rotateZ(Math.PI / 2), wallK, x, y - .05, z, ry); return; } const n = Math.floor(len / 1.1), c = Math.cos(ry), sn = Math.sin(ry);
    for (let i = 0; i < n; i++) { const l = -len / 2 + (i + .5) * len / n, px = x + l * c, pz = z - l * sn; put(box(.62, .55, .42), wallK, px, y + .27, pz, ry); put(box(.32, .28, .42), wallK, px, y + .69, pz, ry); } };
  // leaves of cedar boards under an opening's head, set in its reveal
  const leaves = (h, z, nb, ry = 0) => { const sh = h.h - (h.arch ? h.w / 2 : 0); for (let i = 0; i < nb; i++) put(box(h.w / nb - .015, sh + .02, .07), doorK, h.x - h.w / 2 + (i + .5) * h.w / nb, pl + h.y + sh / 2, z, ry);
    if (h.arch === 1) put(new THREE.CylinderGeometry(h.w / 2, h.w / 2, .07, 16, 1, false, -Math.PI / 2, Math.PI), doorK, h.x, pl + h.y + sh, z, 0, -Math.PI / 2); };
  put(box(W + .3, pl, D + .3), 'plinth', 0, pl / 2, 0);
  let front = D / 2 + .15;
  if (kind === 'tithe') {
    const g1 = 5.2, g2 = 4.6, H = g1 + g2, n = o.bays || (W > 21 ? 7 : 5), span = W / n, la = 3.6, zi = D / 2 - la;
    // the loggia's arcade (the ground storey of the front wall) and the Factor's floor over it
    const arches = []; for (let i = 0; i < n; i++) { const mid = i === (n - 1) / 2, aw = span - (mid ? .5 : .8); arches.push({ x: -W / 2 + (i + .5) * span, y: 0, w: aw, h: g1 - (mid ? .45 : .9), arch: 2 }); }
    put(wallGeo(W, g1, arches, T), wallK, 0, pl, D / 2 - T / 2);
    const up = []; for (let i = 0; i < n; i++) up.push({ x: -W / 2 + (i + .5) * span, y: .9, w: 1.1, h: 2.9, arch: 1 });
    put(wallGeo(W, g2, up, T), wallK, 0, pl + g1, D / 2 - T / 2);
    for (let i = 0; i <= n; i++) { const x = Math.max(-W / 2 + .2, Math.min(W / 2 - .2, -W / 2 + i * span)), ch = g1 - span * .62 - .3, lp = [[0, 0], [.24, 0], [.24, .14], [.17, .24], [.15, ch - .32], [.2, ch - .2], [.27, ch - .08], [.27, ch], [0, ch]]; put(lathe(lp, 12), 'stone', x, pl, D / 2 + .2); }
    // the counting room's front behind the loggia: a door in each bay, the carriage way's gates in the middle
    const inner = []; for (let i = 0; i < n; i++) { const mid = i === (n - 1) / 2; inner.push(mid ? { x: -W / 2 + (i + .5) * span, y: 0, w: span - 1.1, h: g1 - 1.1, arch: 1, gate: 1 } : { x: -W / 2 + (i + .5) * span, y: 0, w: 1.1, h: 2.5, arch: i % 2 ? 1 : 0 }); }
    put(wallGeo(W - 2 * T, g1, inner, .5), wallK, 0, pl, zi);
    for (const h of inner) leaves(h, zi + .05, h.gate ? 8 : 4);
    put(box(W - 2 * T, .35, la - T + .05), 'cedar', 0, pl + g1 - .18, zi + (la - T) / 2);
    for (let i = 0; i < n * 2; i++) put(box(.16, .2, la - T), 'cedar', -W / 2 + T + (i + .5) * (W - 2 * T) / (n * 2), pl + g1 - .45, zi + (la - T) / 2);
    put(box(W - .3, .3, la - .2), 'stone', 0, pl + .02, zi + la / 2 - .1);
    // the band of tile between the storeys, the balconies on the middle three windows, sills and grilles on the rest
    put(box(W, .6, .04), 'zellige', 0, pl + g1 + .2, D / 2 + .02);
    up.forEach((h, i) => { const z = D / 2, x = h.x, y = pl + g1 + h.y, mid = Math.abs(i - (n - 1) / 2) <= 1;
      if (mid) { const bw = h.w + .5, bh = h.h * .6; put(box(bw + .3, .14, .9), 'stone', x, y - .07, z + .45); for (const sx of [-1, 1]) put(box(.26, .32, .5), 'stone', x + sx * bw / 2, y - .3, z + .25);
        for (let k = 0; k <= 8; k++) put(box(.035, bh, .035), 'cedar', x - bw / 2 + k * bw / 8, y + bh / 2, z + .88); for (const sx of [-1, 1]) for (let k = 0; k <= 4; k++) put(box(.035, bh, .035), 'cedar', x + sx * bw / 2, y + bh / 2, z + .1 + k * .19);
        for (let k = 1; k <= 6; k++) put(box(bw, .03, .03), 'cedar', x, y + k * bh / 7, z + .89); put(box(bw + .1, .07, .9), 'cedar', x, y + bh, z + .45); }
      else { put(box(h.w + .25, .1, .25), 'stone', x, y - .05, z + .08); for (let k = 1; k < 4; k++) put(new THREE.CylinderGeometry(.02, .02, h.h - h.w / 2, 5), 'iron', x - h.w / 2 + k * h.w / 4, y + (h.h - h.w / 2) / 2, z - T / 2); } });
    // the sides and the back, full height, small windows below and tall above
    const sideH = (len) => { const hs = [], k = Math.max(1, Math.round(len / 4.5)); for (let i = 0; i < k; i++) { const x = -len / 2 + (i + .5) * len / k; hs.push({ x, y: 1.6, w: .7, h: 1.2, arch: 1 }, { x, y: g1 + .9, w: 1.0, h: 2.6, arch: 1 }); } return hs; };
    put(wallGeo(W, H, sideH(W), T), wallK, 0, pl, -D / 2 + T / 2, Math.PI); for (const sx of [-1, 1]) put(wallGeo(D - 2 * T + .02, H, sideH(D - 2 * T), T), wallK, sx * (W / 2 - T / 2), pl, 0, sx * Math.PI / 2);
    put(box(W - 2 * T, H - .3, D - la - T), 'dark', 0, pl + (H - .3) / 2, -la / 2); put(box(W - 2 * T, g2 - .3, la - .1), 'dark', 0, pl + g1 + (g2 - .3) / 2 + .05, D / 2 - la / 2 - .2);
    // the cornice, the roof, the merlons, the lookout and its banner
    const top = pl + H; put(box(W + .5, .35, D + .5), 'stone', 0, top + .17, 0); put(box(W - .3, .2, D - .3), 'plinth', 0, top + .1, 0);
    for (const sz of [1, -1]) { put(box(W + .3, .5, .4), wallK, 0, top + .6, sz * (D / 2 + .05)); merlons(W, 0, top + .85, sz * (D / 2 + .05), 0); }
    for (const sx of [-1, 1]) { put(box(.4, .5, D - .5), wallK, sx * (W / 2 + .05), top + .6, 0); merlons(D - .8, sx * (W / 2 + .05), top + .85, 0, Math.PI / 2); }
    { const s = 3.6, lx = -W / 2 + s / 2 + 1.2, lz = -D / 2 + s / 2 + 1.2, lh = 3.4; for (let f = 0; f < 4; f++) { const ry = f * Math.PI / 2; put(wallGeo(s, lh, [{ x: -.75, y: .6, w: 1.0, h: 2.2, arch: 1 }, { x: .75, y: .6, w: 1.0, h: 2.2, arch: 1 }], .35), wallK, lx + Math.sin(ry) * (s / 2 - .17), top + .2, lz + Math.cos(ry) * (s / 2 - .17), ry); }
      const ly = top + .2 + lh; put(box(s + .4, .3, s + .4), 'stone', lx, ly + .15, lz); for (let f = 0; f < 4; f++) { const ry = f * Math.PI / 2; merlons(s, lx + Math.sin(ry) * (s / 2), ly + .3, lz + Math.cos(ry) * (s / 2), ry); }
      put(new THREE.CylinderGeometry(.06, .08, 6, 8), 'cedar', lx, ly + 3.3, lz); put(new THREE.SphereGeometry(.12, 10, 8), 'gold', lx, ly + 6.35, lz);
      const g = new THREE.PlaneGeometry(2.4, 1.3, 8, 1), P = g.attributes.position; for (let i = 0; i < P.count; i++) P.setZ(i, Math.sin(P.getX(i) * 2.2) * .12); g.computeVertexNormals(); put(g, 'awning', lx + 1.26, ly + 5.5, lz, 0); }
    front = D / 2 + .95;
  } else {
    // the warehouse: the walls with a row of tall arched doors on the quay, the loading door over the middle one
    const H = 7.4, n = Math.max(3, Math.round(W / 6.5)), span = W / n, mid = Math.floor(n / 2), fr = [];
    for (let i = 0; i < n; i++) { const x = -W / 2 + (i + .5) * span; fr.push({ x, y: 0, w: 3.0, h: 4.3, arch: 1, door: 1 }); fr.push(i === mid ? { x, y: 5.0, w: 1.5, h: 1.9, arch: 0, load: 1 } : { x, y: 5.4, w: .7, h: .7, arch: 0 }); }
    put(wallGeo(W, H, fr, T), wallK, 0, pl, D / 2 - T / 2);
    const hi = len => { const hs = [], k = Math.max(1, Math.round(len / 4)); for (let i = 0; i < k; i++) hs.push({ x: -len / 2 + (i + .5) * len / k, y: 5.2, w: .6, h: .8, arch: 1 }); return hs; };
    put(wallGeo(W, H, hi(W), T), wallK, 0, pl, -D / 2 + T / 2, Math.PI); for (const sx of [-1, 1]) put(wallGeo(D - 2 * T + .02, H, hi(D - 2 * T), T), wallK, sx * (W / 2 - T / 2), pl, 0, sx * Math.PI / 2);
    put(box(W - 2 * T, H - .3, D - 2 * T), 'dark', 0, pl + (H - .3) / 2, 0);
    for (const h of fr) { if (h.door) { leaves(h, D / 2 - T * .6, 6); put(box(h.w + .4, .12, .4), 'stone', h.x, pl + .06, D / 2 + .15); }
      else if (h.load) { leaves(h, D / 2 - T * .6, 4); put(box(.22, .26, 1.9), 'cedar', h.x, pl + h.y + h.h + .55, D / 2 + .5); put(new THREE.TorusGeometry(.16, .035, 6, 14), 'iron', h.x, pl + h.y + h.h + .3, D / 2 + 1.3);
        put(new THREE.CylinderGeometry(.018, .018, h.y + h.h - .1, 5), 'cedar', h.x + .15, pl + (h.y + h.h) / 2 + .1, D / 2 + 1.3); } }
    // the gabled pantile roof, ridge along the quay, its eaves on rafter ends, the gables closed in wall
    const pitch = 20 * Math.PI / 180, ov = .5, run = D / 2 + ov, rise = Math.tan(pitch) * run, y0 = pl + H, sl = run / Math.cos(pitch), len = W + 2 * ov, yr = y0 + rise - ov * Math.tan(pitch);
    for (const sz of [1, -1]) { const g = new THREE.PlaneGeometry(len, sl); g.rotateX(-Math.PI / 2); g.translate(0, 0, sz * sl / 2); g.rotateX(sz * pitch); put(g, 'pantile', 0, yr + .02, 0, 0, 0, 0, false); }
    put(new THREE.CylinderGeometry(.11, .11, len, 8).rotateZ(Math.PI / 2), 'ridge', 0, yr + .08, 0);
    for (const sx of [-1, 1]) { const s = new THREE.Shape([new THREE.Vector2(-D / 2, 0), new THREE.Vector2(D / 2, 0), new THREE.Vector2(0, rise - ov * Math.tan(pitch))]); put(new THREE.ExtrudeGeometry(s, { depth: T, bevelEnabled: false }), wallK, sx * (W / 2 - (sx > 0 ? T : 0)), y0, 0, Math.PI / 2); }
    for (const sz of [1, -1]) for (let x = -W / 2; x <= W / 2 + .01; x += .7) put(box(.1, .1, ov), 'cedar', x, y0 - .12, sz * (D / 2 + ov / 2));
    // what waits on the quay: crates and amphorae by the doors
    for (let i = 0; i < n; i++) { const x = -W / 2 + (i + .5) * span + (r() < .5 ? -1 : 1) * 2.1, k = Math.floor(r() * 4);
      for (let j = 0; j < k; j++) { if (r() < .55) { const c = .6 + r() * .3; put(box(c, c, c), 'cedar', x + (r() - .5) * .8, c / 2 + (j > 1 ? .7 : 0), D / 2 + .9 + r() * .5, r() * .5); }
        else put(lathe([[.001, 0], [.1, .02], [.28, .3], [.3, .55], [.16, .85], [.1, .95], [.12, 1.0], [.001, 1.0]], 12), 'terra', x + (r() - .5) * 1.2, 0, D / 2 + .8 + r() * .7); } }
    front = D / 2 + 2.05;
  }
  const out = finish(); out.group.userData = { roofTop: out.roofTop, kind }; return { ...out, kind, front };
}

// ── the Mages' academy (Session 836, card F6). The canon (§1.3): "the academy's white towers"; the Mages' academy and the
// Church both sit in Aurenne. aurenneAcademy(o, r): a long hall of two storeys (the library) with an arcade along its front,
// tall arched windows above and a band of glazed tile, flat-roofed behind a rounded parapet; and o.towers (2 or 3) slender
// white round towers rising out of it, each with arched slits up its shaft, a gallery on corbels near the top behind a
// pierced parapet, a lantern of arched openings and a pointed white cap with a gilt finial. The tallest tower carries the
// observatory: a white dome with its shutter slot. o.w 24 to 36. -> { group, roofTop, tris, draws, kind: 'academy', front }
export function aurenneAcademy(o, r) {
  const { put, wallGeo, box, finish } = aurKit(), W = o.w || 30, D = 13, T = .6, pl = .6, H = 10.5, wallK = 'wall:' + (o.wall ?? 4), nt = o.towers ?? 3;
  const lathe = (pts, n) => new THREE.LatheGeometry(pts.map(([a, b]) => new THREE.Vector2(a, b)), n);
  put(box(W + .4, pl, D + 3.6), 'plinth', 0, pl / 2, 1.6);
  // the hall: an arcade of round arches along the ground floor of the front, tall windows over it, small windows round the rest
  const n = Math.round(W / 3.4), span = W / n, fr = [];
  for (let i = 0; i < n; i++) { const x = -W / 2 + (i + .5) * span; fr.push({ x, y: 0, w: span - .9, h: 4.6, arch: 1 }, { x, y: 6.0, w: 1.1, h: 3.2, arch: 1 }); }
  put(wallGeo(W, H, fr, T), wallK, 0, pl, D / 2 - T / 2);
  const rest = len => { const hs = [], k = Math.max(1, Math.round(len / 4)); for (let i = 0; i < k; i++) { const x = -len / 2 + (i + .5) * len / k; hs.push({ x, y: 1.8, w: .8, h: 1.6, arch: 1 }, { x, y: 6.2, w: 1.0, h: 2.8, arch: 1 }); } return hs; };
  put(wallGeo(W, H, rest(W), T), wallK, 0, pl, -D / 2 + T / 2, Math.PI); for (const sx of [-1, 1]) put(wallGeo(D - 2 * T + .02, H, rest(D - 2 * T), T), wallK, sx * (W / 2 - T / 2), pl, 0, sx * Math.PI / 2);
  put(box(W - 2 * T, H - .3, D - 2 * T), 'dark', 0, pl + (H - .3) / 2, 0);
  for (let i = 0; i <= n; i++) { const x = Math.max(-W / 2 + .25, Math.min(W / 2 - .25, -W / 2 + i * span)); put(lathe([[0, 0], [.3, 0], [.3, .15], [.22, .25], [.2, 3.6], [.26, 3.75], [.34, 3.9], [.34, 4.0], [0, 4.0]], 12), 'stone', x, pl, D / 2 + .3); }
  for (const f of fr.filter(h => h.y > 1)) { put(box(f.w + .3, .12, .35), 'stone', f.x, pl + f.y - .06, D / 2 + .1); for (let k = 1; k < 4; k++) put(new THREE.CylinderGeometry(.02, .02, f.h - f.w / 2, 5), 'iron', f.x - f.w / 2 + k * f.w / 4, pl + f.y + (f.h - f.w / 2) / 2, D / 2 - T / 2); }
  put(box(W, .6, .04), 'zellige', 0, pl + 5.4, D / 2 + .02); put(box(W + .5, .35, D + .5), 'stone', 0, pl + H + .17, 0);
  { const cap = len => { const g = new THREE.CylinderGeometry(.16, .16, len, 10, 1, false, 0, Math.PI); g.rotateZ(Math.PI / 2); return g; };
    for (const sz of [1, -1]) { put(box(W + .2, .55, .32), wallK, 0, pl + H + .62, sz * (D / 2 + .05)); put(cap(W + .2), wallK, 0, pl + H + .9, sz * (D / 2 + .05)); }
    for (const sx of [-1, 1]) { put(box(.32, .55, D - .3), wallK, sx * (W / 2 + .05), pl + H + .62, 0); put(cap(D - .3), wallK, sx * (W / 2 + .05), pl + H + .9, 0, Math.PI / 2); } }
  // the towers: round shafts rising out of the hall's back, the middle one (or the end one of two) the tallest, with the observatory
  let top = 0; const tops = [];
  for (let t = 0; t < nt; t++) { const x = nt === 1 ? 0 : -W / 2 + 3 + t * (W - 6) / (nt - 1), mid = nt === 3 ? t === 1 : t === nt - 1, R = mid ? 2.6 : 2.1, Ht = (mid ? 34 : 26) + Math.round(r() * 20) / 10, z = -D / 2 + .4;
    const sh = Ht - 3.2; put(new THREE.CylinderGeometry(R, R * 1.06, sh, 28), wallK, x, pl + sh / 2, z);
    for (let k = 0; k < 5; k++) { const y = pl + H + 2 + k * (Ht - H - 6) / 5, a = k * 1.3; put(box(.3, 1.3, .2), 'dark', x + Math.sin(a) * (R + .01), y, z + Math.cos(a) * (R + .01), a); }
    put(new THREE.TorusGeometry(R + .04, .12, 6, 28), 'stone', x, pl + H + .9, z, 0, Math.PI / 2);
    // the gallery: a ring of corbels, a stone floor, a pierced parapet of little posts and a rail
    const gy = pl + Ht - 3.2, gR = R + .9; for (let i = 0; i < 16; i++) { const a = i / 16 * Math.PI * 2; put(box(.3, .7, .9), 'stone', x + Math.sin(a) * (R + .4), gy - .45, z + Math.cos(a) * (R + .4), a); }
    put(new THREE.CylinderGeometry(gR, gR, .25, 28), 'stone', x, gy, z); for (let i = 0; i < 28; i++) { const a = i / 28 * Math.PI * 2; put(box(.12, .8, .12), wallK, x + Math.sin(a) * (gR - .1), gy + .52, z + Math.cos(a) * (gR - .1)); }
    put(new THREE.TorusGeometry(gR - .1, .08, 5, 28), wallK, x, gy + .95, z, 0, Math.PI / 2);
    // the lantern: a narrower drum of arched openings over the gallery, its cap a pointed white cone, or the observatory's dome
    const lR = R * .78, lh = 3.4, ly = gy + .15; put(new THREE.CylinderGeometry(lR, lR, lh, 24, 1, true), wallK, x, ly + lh / 2, z); put(new THREE.CylinderGeometry(lR - .3, lR - .3, lh, 16), 'dark', x, ly + lh / 2, z);
    for (let i = 0; i < 6; i++) { const a = (i + .5) / 6 * Math.PI * 2, sh = new THREE.Shape(); sh.moveTo(-.4, 0); sh.lineTo(.4, 0); sh.lineTo(.4, 1.6); sh.absarc(0, 1.6, .4, 0, Math.PI, false); sh.lineTo(-.4, 0); put(new THREE.ShapeGeometry(sh, 6), 'dark', x + Math.sin(a) * (lR + .02), ly + .6, z + Math.cos(a) * (lR + .02), a); }
    const cy = ly + lh; put(new THREE.TorusGeometry(lR + .1, .14, 6, 24), 'stone', x, cy, z, 0, Math.PI / 2);
    let tt;
    if (mid) { const pts = []; for (let i = 0; i <= 12; i++) { const a = i / 12 * Math.PI / 2; pts.push([Math.max(.001, (lR + .1) * Math.cos(a)), (lR + .1) * Math.sin(a)]); } put(lathe(pts, 28), wallK, x, cy, z);
      put(box(.5, lR * .9, .08), 'dark', x, cy + lR * .55, z + lR * .62, 0, -.75); tt = cy + lR + .1; put(new THREE.CylinderGeometry(.05, .05, 1.6, 6), 'gold', x, tt + .8, z); put(new THREE.SphereGeometry(.2, 10, 8), 'gold', x, tt + .2, z); tt += 1.6; }
    else { put(lathe([[.001, 0], [lR + .3, 0], [lR + .2, .3], [lR * .45, 3.2], [.001, 4.6]], 24), wallK, x, cy, z); put(new THREE.CylinderGeometry(.04, .04, 1.4, 6), 'gold', x, cy + 5.1, z); put(new THREE.SphereGeometry(.16, 10, 8), 'gold', x, cy + 4.6, z); tt = cy + 5.8; }
    tops.push(+tt.toFixed(2)); top = Math.max(top, tt); }
  // two cypresses at the arcade's ends, and a stone bench under it
  for (const sx of [-1, 1]) { const ht = 6.5 + r() * 2, cx = sx * (W / 2 - 1.2), cz = D / 2 + 2.6, g = lathe([[.001, 0], [.55, .4], [.7, ht * .35], [.5, ht * .75], [.001, ht]], 12), P = g.attributes.position;
    for (let i = 0; i < P.count; i++) { const k = 1 + .12 * Math.sin(P.getY(i) * 5 + Math.atan2(P.getZ(i), P.getX(i)) * 5 + r() * .5); P.setX(i, P.getX(i) * k); P.setZ(i, P.getZ(i) * k); } g.computeVertexNormals(); put(g, 'leaf2', cx, pl, cz); }
  put(box(W * .5, .45, .5), 'stone', 0, pl + .22, D / 2 - T - .5);
  const out = finish(); out.group.userData = { roofTop: out.roofTop, kind: 'academy', towerTops: tops }; return { ...out, kind: 'academy', front: D / 2 + 3.4, towerTops: tops };
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


// ── the Gatelands kit (the concept run of 13 Oct 2026, card F6; folded in here from pieces-gatelands.js in Session 834, the
// concept artist's ask, so the three islands' pieces are one module). Every measure in metres from SCALE; a wall is a slab per
// face with its openings cut through it, each opening, roof, chimney and trim a piece placed on a face, merged by material.
// The vocabulary is OG-070's and OG-014's: a cottage (gabled or hipped thatch), a farmhouse, a townhouse, a merchant's house
// and shop, a warehouse (GL_PLANS); gatelandsBuilding(plan) builds one. Its names are prefixed where they would be ambiguous
// beside the other kits. (gatelandsHouse above is the lane slice's house, Session 818, kept while the lane uses it.)
// ── the measures (visual-foundation §1): one unit a metre, people 1.6 to 1.9 m ──
const SCALE = {
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
function glMats() {
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
  const M = glMats(), grp = new THREE.Group(); let tris = 0, calls = 0;
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
  const glass = (y0, k) => { const s = outline({ ...op, y: y0, h: top - y0 }, new THREE.Shape()); const g = new THREE.ShapeGeometry(s, 12); g.translate(0, 0, z0 - .03); add(k || ((F.r || rnd)() < .14 ? 'lit' : 'glass'), g); };
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
function building(P) {
  const M = glMats(), bk = bucket(), { w, d, t } = P, h = P.floors.reduce((a, b) => a + b, 0), roof = P.roof, p = roof.pitch * RAD, tp = Math.tan(p), thatch = roof.kind === 'thatch';
  const rt = thatch ? SCALE.thatchDepth : SCALE.slateDepth, tv = rt / Math.cos(p), di = d / 2 - t, park = .32;
  const F = { fin: P.fin, paint: 'p:' + (P.paint || 'green'), t, r: P.r || rnd }; // P.r: the lot's stream (Session 835); without one, the page's shared rnd() as before
  const basis = (u, n, x, z) => new THREE.Matrix4().makeBasis(u, new THREE.Vector3(0, 1, 0), n).setPosition(x, 0, z);
  const MF = { front: basis(new THREE.Vector3(1, 0, 0), new THREE.Vector3(0, 0, 1), 0, d / 2), back: basis(new THREE.Vector3(-1, 0, 0), new THREE.Vector3(0, 0, -1), 0, -d / 2),
    right: basis(new THREE.Vector3(0, 0, -1), new THREE.Vector3(1, 0, 0), w / 2, 0), left: basis(new THREE.Vector3(0, 0, 1), new THREE.Vector3(-1, 0, 0), -w / 2, 0) };
  const rect = (hw, hh) => [[-hw, 0], [hw, 0], [hw, hh], [-hw, hh]];
  const gableTop = roof.hip ? rect(di, h) : roof.parapet ? [[-di, 0], [di, 0], [di, h + t * tp + tv + park], [0, h + d / 2 * tp + tv + park], [-di, h + t * tp + tv + park]] : [[-di, 0], [di, 0], [di, h + t * tp], [0, h + d / 2 * tp], [-di, h + t * tp]];
  const floorsAt = P.floors.slice(0, -1).reduce((a, f) => (a.push((a.at(-1) || 0) + f), a), []);
  for (const k of ['front', 'back']) face(bk, MF[k], { ...F, outline: rect(w / 2, h), open: P.open[k] || [], strings: P.strings ? floorsAt : [] });
  for (const k of ['left', 'right']) face(bk, MF[k], { ...F, outline: gableTop, open: P.open[k] || [], strings: [] });
  // the dark room behind every opening (P.interior, Session 852: left out when the rooms are built inside, rooms.js)
  if (!P.interior) { const g = new THREE.BoxGeometry(w - 2 * t + .04, h - .02, d - 2 * t + .04); g.translate(0, h / 2, 0); bk.add('dark', g); }
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
const PLANS = {
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
// the Gatelands' lots (Session 835, Michael's A on #280: coloured towns). A town's lots are rendered in the earth colours,
// with dressed quoins, string courses and a cornice; no two neighbours share a colour, as in Kinsale or Dingle, and the
// door and sashes are painted in a colour that does not drown in the wall's. Cottages stay limewashed under thatch, farmhouses
// white under slate, and the warehouse bare stone (the decision's text). s.kind: 'townhouse' | 'merchant' | 'warehouse' |
// 'farmhouse' | 'cottage'; by default a town lot, one in four a merchant's house with a shop. Everything comes from streams
// keyed by the street and the lot, the windows lit at night among them (plan.r). -> { plan, kind, colour, paint }
export const GL_TOWN = ['ochre', 'rose', 'cream', 'sage', 'blue', 'oxblood'];
const GL_CLASH = { blue: ['blue', 'teal'], oxblood: ['red'], rose: ['red'], sage: ['green', 'teal'], ochre: ['yellow'], cream: ['yellow'] };
export function gatelandsLot(street, i, s = {}) {
  let c = hashKey(`${street}:colour`) % GL_TOWN.length;
  for (let j = 1; j <= i; j++) c = (c + 1 + Math.floor(stream(`${street}:colour:${j}`)() * (GL_TOWN.length - 1))) % GL_TOWN.length;
  const r = stream(`${street}:lot:${i}`), kind = s.kind || (r() < .25 ? 'merchant' : 'townhouse'), colour = GL_TOWN[c];
  const ok = Object.keys(PAINTS).filter(p => !(GL_CLASH[colour] || []).includes(p)), paint = ok[Math.floor(r() * ok.length)];
  let plan;
  if (kind === 'cottage') plan = PLANS.cottage({ hip: r() < .33, paint: Object.keys(PAINTS)[Math.floor(r() * 6)] });
  else if (kind === 'farmhouse') plan = PLANS.farmhouse({ paint });
  else if (kind === 'warehouse') plan = PLANS.warehouse({ fin: FIN.stone() });
  else if (kind === 'merchant') plan = PLANS.merchant({ color: colour, paint, trade: s.trade });
  else plan = PLANS.townhouse({ color: colour, paint, doorX: i % 2 ? 1.95 : -1.95 });
  plan.r = stream(`${street}:windows:${i}`);
  const town = kind === 'townhouse' || kind === 'merchant';
  return { plan, kind, colour: town ? colour : kind === 'warehouse' ? 'stone' : 'lime', paint: town ? paint : plan.paint };
}
export { SCALE, glMats, bucket as glBucket, finish as glFinish, box as glBox, face as glFace, building as gatelandsBuilding, PLANS as GL_PLANS, FIN as GL_FIN, win as glWin, PAINTS as GL_PAINTS };

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
  // turf (Session 825, Michael on #277: "the green is too vibrant for the climate"): the sod as it stands most of a
  // northern year, in tufts. 'dry': tawny dead grass and straw over olive, moss in the hollows, earth between the tufts.
  // 'moss': a wet roof gone to dark moss, with straw tufts and pale lichen. Session 819's lawn green is gone.
  const tuft = (x, y, s) => { const a = tfbm(x, y, 10, 3, s), b = tn(x, y, 22, s + 5), c = tfbm(x, y, 48, 2, s + 9); return { a, b, c, h: a * .55 + b * .3 + c * .15 }; };
  const mix = (p, q, t) => p.map((v, i) => v + (q[i] - v) * Math.max(0, Math.min(1, t)));
  TEX.turfDry = texPair(256, (x, y) => { const n = tfbm(x, y, 3, 4, 41), m = tfbm(x, y, 6, 3, 43), T = tuft(x, y, 47);
    let c = mix([.44, .36, .22], [.53, .45, .3], n * 1.6 - .3); c = mix(c, [.35, .33, .2], (m - .5) * 3); c = mix(c, [.25, .26, .15], (.4 - T.h) * 4);
    c = mix(c, [.2, .15, .1], (.22 - T.b * T.c) * 6); const k = .9 + .2 * T.c; return [T.h, c[0] * k, c[1] * k, c[2] * k]; }, 2.6);
  TEX.turfMoss = texPair(256, (x, y) => { const n = tfbm(x, y, 3, 4, 51), m = tfbm(x, y, 12, 3, 53), T = tuft(x, y, 57);
    let c = mix([.18, .21, .12], [.26, .28, .16], n * 1.5 - .25); c = mix(c, [.46, .4, .26], (T.h - .64) * 5); c = mix(c, [.55, .56, .47], (m - .72) * 7);
    c = mix(c, [.13, .11, .08], (.2 - T.c * T.b) * 6); const k = .9 + .2 * T.c; return [T.h * .8 + m * .2, c[0] * k, c[1] * k, c[2] * k]; }, 2.0);
  // the fringe at the eaves: blades hanging over the edge, cut out by alpha
  { const N = 256, cv = document.createElement('canvas'); cv.width = N; cv.height = 64; const x = cv.getContext('2d'); let sd = 7; const rr = () => (sd = (sd * 16807) % 2147483647) / 2147483647;
    for (let i = 0; i < 1100; i++) { const px = rr() * N, len = 8 + rr() ** 1.6 * 56, lean = (rr() - .5) * 14, t = rr(), col = t < .55 ? [140, 120, 80] : t < .85 ? [112, 98, 62] : [78, 74, 48];
      x.strokeStyle = `rgb(${col.map(v => v * (.85 + .3 * rr()) | 0)})`; x.lineWidth = .6 + rr() * 1.1; for (const dx of [0, -N, N]) { x.beginPath(); x.moveTo(px + dx, 0); x.quadraticCurveTo(px + dx + lean * .3, len * .5, px + dx + lean, len); x.stroke(); } }
    x.fillStyle = 'rgb(84,70,46)'; x.fillRect(0, 0, N, 5); const ft = new THREE.CanvasTexture(cv); ft.wrapS = ft.wrapT = THREE.RepeatWrapping; ft.anisotropy = 8; ft.colorSpace = THREE.SRGBColorSpace; TEX.fringe = { map: ft }; }
}
// the Mark's lots (Session 831, Michael's C on #277: two in three shingle, one turf, by lot). In every run of three lots one
// is turf, which one by the street's seed, as Aurenne's mix; a hall of note (s.note, a list of lot indices: the hall at the
// square, the lane's end) is never turf, and when the pick lands on one the turf moves to the next lot of the three that is
// not one (so a run holding a hall of note can be all shingle; nothing else breaks the two in three). The turf is the poorer
// house: a smaller, lower hall in the darker planks, set further back with more yard, rarely a porch or a chimney, carved
// only when it is one of the larger. Each lot's options come from a stream keyed by the street and the lot alone.
export function markLot(street, i, s = {}) {
  const note = new Set(s.note || []), t = Math.floor(i / 3); let pick = t * 3 + hashKey(`${street}:triple:${t}`) % 3;
  for (let k = 0; k < 3 && note.has(pick); k++) pick = t * 3 + (pick - t * 3 + 1) % 3;
  const big = note.has(i), roof = !big && pick === i ? 'turf' : 'shingle', r = stream(`${street}:lot:${i}`), f = v => +v.toFixed(2);
  let o;
  if (big) o = { roof, note: true, w: f(8.4 + r() * 1.2), d: f(15 + r() * 3), porch: true, chimney: true, carve: true, wall: Math.floor(r() * 4), gap: f(3.5 + r() * 1.5), set: f(r() * .6) };
  else if (roof === 'turf') { const w = f(5.6 + r() * 1.2); o = { roof, w, d: f(8.5 + r() * 2.5), porch: r() < .2, chimney: r() < .3, carve: w > 6.4 && r() < .35, wall: 1 + Math.floor(r() * 2), gap: f(3 + r() * 2.5), set: f(1.2 + r() * 1.8) }; }
  else o = { roof, w: f(6.8 + r() * 1.6), d: f(11 + r() * 3.5), porch: r() < .55, chimney: r() < .65, carve: true, wall: Math.floor(r() * 4), gap: f(2.5 + r() * 1.5), set: f(r() * .8) };
  return { o, r };
}
let MM = null;
function markMats() {
  if (MM) return MM; markTextures();
  const std = (c, o = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: o.rough ?? .85 });
  const plank = c => { const m = mat('wood', { ns: 1.2 }); m.color.set(c).multiplyScalar(2.6); return m; };
  MM = { wall: [0x5a4430, 0x4a3826, 0x3e2e20, 0x66503a].map(plank), beam: mat('beam', { ns: 1.2, color: 0xa08068 }), stone: mat('stone', { ns: 1.4, color: 0xe0dcd2 }), shingle: mat('shingle', { ns: 1.5, rough: .8 }),
    turf: { dry: mat('turfDry', { ns: 1.3, rough: 1 }), moss: mat('turfMoss', { ns: 1.1, rough: .95 }) }, fringe: new THREE.MeshStandardMaterial({ map: TEX.fringe.map, alphaTest: .5, side: THREE.DoubleSide, roughness: 1 }), bark: std(0xd8d0c0, { rough: .9 }), door: plank(0x3a2a1c), dark: std(0x0b0908, { rough: 1 }), iron: new THREE.MeshStandardMaterial({ color: 0x1c1a18, roughness: .5, metalness: .6 }),
    carve: mat('beam', { ns: 1.4, color: 0xc09070 }), glow: new THREE.MeshStandardMaterial({ color: 0x1a1008, emissive: new THREE.Color(1, .6, .28), emissiveIntensity: .5, roughness: .4 }) };
  MM.shingle.side = THREE.DoubleSide; for (const m of Object.values(MM.turf)) m.side = THREE.DoubleSide; return MM;
}
export function markHall(o, r) {
  const Mt = markMats(), g = new THREE.Group(), w = o.w, d = o.d, turf = o.roof === 'turf', Turf = Mt.turf[o.turf || 'dry'], foot = .8, wh = turf ? 2.4 : 2.9, pitch = (turf ? 32 : 52) * Math.PI / 180, rise = Math.tan(pitch) * (w / 2 + .5);
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
  // the threshold at the sill, and stone steps down from it to the ground, rises of foot / 5 (0.16 m; v2-scope §2's stairs are 0.18) and
  // treads of 0.3, each a little wider than the one above (Session 859: the critic's door 0.8 m up with no step)
  // with a porch the steps go down from the porch's stone floor, which is the threshold
  const RISE = foot / 5, TREAD = .3, z1 = o.porch ? d / 2 + 2.15 : d / 2 + .6; if (!o.porch) add(box(door.w + .5, .2, .45), Mt.stone, 0, foot - .1, d / 2 + .15 + .225, 0, 0, 0, .45);
  for (let k = 4; k >= 1; k--) { const n = 5 - k, z0 = z1 + (n - 1) * TREAD; add(box(door.w + .5 + n * .12, k * RISE, TREAD), Mt.stone, 0, k * RISE / 2, z0 + TREAD / 2, 0, 0, 0, .45); }
  // the roof: two slabs at the pitch, overhanging the gables; shingle, or turf over a birch-bark edge with a log holding it at the eaves
  const ov = .5, slope = (w / 2 + ov) / Math.cos(pitch), t = turf ? .32 : .12, ry0 = foot + wh - ov * Math.tan(pitch) + .05, len = d + (turf ? .8 : 1.2);
  for (const sx of [-1, 1]) { const geo = box(slope, t, len); geo.translate(sx * slope / 2, t / 2, 0); add(geo, turf ? Turf : Mt.shingle, sx * -(w / 2 + ov), ry0, 0, 0, 0, sx * pitch, turf ? .6 : .9, true).rotation.z = sx * pitch;
    if (turf) { add(box(.04, .3, len), Mt.bark, sx * (w / 2 + ov + .02), ry0 + .05, 0, 0, 0, 0); add(new THREE.CylinderGeometry(.12, .12, len, 8).rotateX(Math.PI / 2), Mt.beam, sx * (w / 2 + ov - .05), ry0 + .22, 0, 0, 0, 0, .8);
      // the grass hangs over the eaves, a little out from the bark, so the roof's edge is ragged and not a slab's
      const fg = new THREE.PlaneGeometry(len + .1, .38), uv = fg.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setX(i, uv.getX(i) * (len + .1) / 2.2); fg.rotateY(sx * Math.PI / 2); fg.rotateZ(sx * .12);
      const fm = new THREE.Mesh(fg, Mt.fringe); fm.position.set(sx * (w / 2 + ov + .07), ry0 + .12, 0); fm.castShadow = true; fm.receiveShadow = true; g.add(fm); } }
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
    for (const sx of [-1, 1]) { const pl = (pw / 2 + .3) / Math.cos(pitch * .85), geo = box(pl, .1, pd + .4); geo.translate(sx * pl / 2, 0, 0); add(geo, turf ? Turf : Mt.shingle, sx * -(pw / 2 + .3), foot + ph - .2, d / 2 + pd / 2 + .1, 0, 0, sx * pitch * .85, .9, true); }
    add(box(pw + .3, .25, .25), Mt.beam, 0, foot + ph - .1, d / 2 + pd, 0, 0, 0, .8); add(box(pw + .2, .2, pd + .5), Mt.stone, 0, foot - .1, d / 2 + pd / 2 + .1, 0, 0, 0, .45); }
  // a stone chimney through the roof's back slope, or a smoke louver on the ridge
  if (o.chimney) { const cz = -d * .25, ch = ridgeY + .8; add(box(.9, ch, .9), Mt.stone, -(w / 4), ch / 2, cz, 0, 0, 0, .45); add(box(1.05, .15, 1.05), Mt.stone, -(w / 4), ch + .07, cz, 0, 0, 0, .45); }
  else { add(box(.7, .4, 1.2), Mt.beam, 0, ridgeY + .3, -d * .15, 0, 0, 0, .8); add(box(.9, .08, 1.4), turf ? Turf : Mt.shingle, 0, ridgeY + .54, -d * .15, 0, 0, 0, .9); }
  const tris = mergeByMaterial(g); return { group: g, tris, draws: g.children.length, roofTop: new THREE.Box3().setFromObject(g).max.y, sill: foot, front: d / 2, stairOut: z1 + 4 * TREAD };
}
