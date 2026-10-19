// The six gods' shrines, dressed by island (the concept artist, 18 Oct 2026; backlog L9, OG-113, the canon's §4). One common niche
// for every god on every island: a carved stele 1.0 m wide and 2.3 m to the top of its arch, a recess 0.62 m wide with its sill at
// 1.03 m, a robed figure 0.95 m tall holding the god's icon (a wolf sitting in place of the figure for Na Beithígh), the god's name
// cut in a panel under the sill, the icon in a roundel over the arch, a candle on the sill and a stone basin before it. The Guest's
// niche is the same stele with everything struck from it. Three dressings put the one niche in its island:
//   gatelands  limewashed, ribboned and tended: a hood moulding of grey limestone, rags on a thorn, a holy well, a ring-headed high
//              cross and a holed ring-stone, primroses at the foot, a limewashed drystone wall behind.
//   mark       each niche of dark granite under its own roofed timber housing, its gable to the road, crossed bargeboards ending in
//              beast heads, an iron lamp always lit under the tie beam; an oath stone with an iron ring before the row.
//   aurenne    plastered and regulated: a flat-topped stele with a blue-glazed cupola, glazed tile in the recess, a gilt icon, a
//              plaster wall with iron railings and a gate, the Church's tithe box and its notice; the Guest's niche bricked up and
//              plastered over, as the Church bricked the Guest's chapel in the capital (§4.2).
// niche(god, island, o) -> { group, tris, draws, sill, basin, lamp, pray [x, z] } in the niche's frame: its front face at z 0, its
//   foot on y 0, the road at +z. god: one of GODS' keys or 'guest'. o.struck: the Guest's hand-sized struck recess low on the plinth
//   (the wayside form of the seventh niche, the backlog's lore objects). o.ribbons (gatelands).
// row(island) -> { group, tris, draws, niches: [{ god, x }], pray } the six and the Guest's in a row, 1.4 m apart (the Mark's housings 1.8 m), dressed.
// wayside(island, god) -> one god's shrine as it stands on a road: the niche, the struck recess, and its island's dressing.
// Everything is in metres and merged by material (one mesh per material per call), as rooms.js and props.js do; the god's name and
// the roundel are one small textured plane each.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { TEX, texPair, mat, worldUV } from './common.js';

export const GODS = [
  { key: 'muir', name: 'An Mhuir', en: 'the Sea', icon: 'hull' }, { key: 'speir', name: 'An Spéir', en: 'the Sky', icon: 'sundial' },
  { key: 'beithigh', name: 'Na Beithígh', en: 'the Beasts', icon: 'wolf' }, { key: 'cloch', name: 'An Chloch', en: 'the Stone', icon: 'gate' },
  { key: 'teallach', name: 'An Teallach', en: 'the Hearth', icon: 'lamp' }, { key: 'fiodoir', name: 'An Fíodóir', en: 'the Weaver', icon: 'shuttle' }];
export const ISLANDS = ['gatelands', 'mark', 'aurenne'];
export const SPACING = { gatelands: 1.4, mark: 1.8, aurenne: 1.4 };

// ── a seeded stream (pieces.js's, so a lot rolls the same here and there) ──
function hashKey(s) { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
export function stream(key) { let a = hashKey(String(key)); return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

// ── the surfaces this kit adds (pieces.js paints the same shingle and tile; in the game they come from there) ──
function tn(x, y, f, s = 0) { const X = x * f, Y = y * f, i = Math.floor(X), j = Math.floor(Y), u = X - i, v = Y - j, h = (a, b) => { a = ((a % f) + f) % f; b = ((b % f) + f) % f; let n = a * 374761393 + b * 668265263 + s * 982451653; n = (n ^ (n >>> 13)) * 1274126177; return ((n ^ (n >>> 16)) >>> 0) / 4294967295; };
  const su = u * u * (3 - 2 * u), sv = v * v * (3 - 2 * v); return (h(i, j) * (1 - su) + h(i + 1, j) * su) * (1 - sv) + (h(i, j + 1) * (1 - su) + h(i + 1, j + 1) * su) * sv; }
const tfbm = (x, y, f, o = 4, s = 0) => { let a = 0, m = .5, t = 0; for (let k = 0; k < o; k++) { a += m * tn(x, y, f, s + k); t += m; f *= 2; m *= .5; } return a / t; };
const idr = id => { let n = (id * 2654435761) >>> 0; n ^= n >>> 15; return (n % 1000) / 1000; };
export function shrineTextures() {
  if (TEX.chisel) return;
  // struck stone: the face cut back with a point chisel, rows of short gouges over a rough ground, paler than the weathered face
  TEX.chisel = texPair(256, (x, y) => { const g = tn(x * 2, y * 2, 64, 3), n = tfbm(x, y, 16, 4, 5), pit = Math.max(0, tn(x, y, 96, 9) - .72) * 2, h = g * .45 + n * .55 - pit; const v = .74 + .08 * n - pit * .12; return [h, v, v * .97, v * .92]; }, 1.6);
  TEX.grass = texPair(256, (x, y) => { const n = tfbm(x, y, 4, 4, 61), t = tn(x, y, 40, 63), b = tn(x, y, 90, 65), h = t * .6 + b * .4, d = Math.max(0, .35 - t * b) * 2.5;
    return [h, (.22 + .1 * n + .06 * t) * (1 - d * .4), (.32 + .12 * n + .08 * t) * (1 - d * .5), (.12 + .05 * n) * (1 - d * .3)]; }, 2.2);
  if (!TEX.shingle) TEX.shingle = texPair(256, (x, y) => { const rows = 8, row = Math.floor(y * rows), v = y * rows - row, cols = 6, xx = x * cols + (row % 2) * .5, col = Math.floor(xx), u = xx - col, r = idr(row * 17 + ((col % cols) + cols) % cols + 9);
    const butt = Math.sqrt(Math.max(0, 1 - Math.pow((u - .5) * 2, 2))) * .25, edge = v < butt * .6 || u < .04 || u > .96, g = tn(x * 2, y * 30, 16, 3);
    const k = .26 + .08 * r + .05 * g; return [edge ? 0 : .5 + .5 * v, ...(edge ? [.07, .06, .05] : [k * 1.02, k * .95, k * .86])]; }, 2.6);
  if (!TEX.zellige) TEX.zellige = texPair(256, (x, y) => { const n = 4, fx = x * n, fy = y * n, i = Math.floor(fx), j = Math.floor(fy), u = fx - i, v = fy - j, e = Math.min(u, 1 - u, v, 1 - v), gap = e < .05;
    const cx = Math.abs(u - .5), cy = Math.abs(v - .5), star = cx + cy < .2 || Math.max(cx, cy) < .12, blue = (i + j) % 2 === 0, w = .03 * tn(x, y, 64, 7);
    const c = gap ? [.82, .8, .74] : star ? [.86, .62, .18] : blue ? [.13 + w, .3 + w, .62 + w] : [.92 + w, .93 + w, .9 + w]; return [gap ? 0 : .8 + .2 * Math.min(1, e * 8), ...c]; }, 2.2);
  if (!TEX.glaze) TEX.glaze = texPair(256, (x, y) => { const n = 12, i = Math.floor(x * n), j = Math.floor(y * n), u = x * n - i, v = y * n - j, e = Math.min(u, 1 - u, v, 1 - v), r = idr(i * 13 + j * 7 + 1), gap = e < .06;
    return [gap ? 0 : .85, ...(gap ? [.7, .7, .66] : [.1 + .06 * r, .26 + .1 * r, .55 + .12 * r])]; }, 1.6);
  TEX.brick = texPair(256, (x, y) => { const rows = 8, row = Math.floor(y * rows), v = y * rows - row, xx = x * 4 + (row % 2) * .5, col = Math.floor(xx), u = xx - col, r = idr(row * 11 + ((col % 4) + 4) % 4), gap = u < .04 || v < .08;
    const n = tfbm(x, y, 16, 3, 2); return [gap ? 0 : .8 + .2 * n, ...(gap ? [.72, .68, .6] : [.62 + .12 * r, .34 + .08 * r, .22 + .05 * r])]; }, 2.4);
}

// ── materials ──
let MT = null;
function mats() {
  if (MT) return MT; shrineTextures();
  const std = (c, o = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: o.rough ?? .8, metalness: o.metal ?? 0, side: o.side ?? THREE.FrontSide, ...(o.em ? { emissive: new THREE.Color(...o.em), emissiveIntensity: o.ei ?? 2 } : {}) });
  const plank = c => { const m = mat('wood', { ns: 1.2 }); m.color.set(c).multiplyScalar(2.6); return m; };
  MT = {
    lime: mat('plaster', { ns: .7, color: 0xf4f1ea, rough: .95 }), limestone: mat('plaster', { ns: .9, color: 0xc2bcb0, rough: .9 }), statG: mat('plaster', { ns: .5, color: 0xd6d0c2, rough: .85 }),
    sandstone: mat('ashlar', { ns: 1.2, color: 0xc4ae92, rough: .9 }), sandmono: mat('rock', { ns: .7, color: 0xd6c4a6, rough: .9 }), rubble: mat('stone', { ns: 1.4, color: 0xd8d2c6, rough: .95 }),
    granite: mat('rock', { ns: 1.3, color: 0x9a9a96, rough: .9 }), statM: mat('rock', { ns: .8, color: 0xa8a6a0, rough: .85 }), boulder: mat('rock', { ns: 1.8, color: 0x8c8a84, rough: 1 }),
    beam: mat('beam', { ns: 1.2, color: 0xa08068 }), carve: mat('beam', { ns: 1.4, color: 0xc09070 }), shingle: mat('shingle', { ns: 1.5, rough: .8 }), post: plank(0x4a3826),
    aurplaster: mat('plaster', { ns: .55, color: 0xf6eedc, rough: .95 }), newplaster: mat('plaster', { ns: .4, color: 0xfbf8f2, rough: .95 }), ochre: mat('ashlar', { ns: .9, color: 0xe8d2a6, rough: .85 }),
    marble: mat('plaster', { ns: .2, color: 0xf4f0e8, rough: .3 }), zellige: mat('zellige', { ns: .6, rough: .25 }), glaze: mat('glaze', { ns: .7, rough: .2 }), paving: mat('flag', { ns: .8, color: 0xf0e2c8, rough: .85 }),
    brick: mat('brick', { ns: 1.2, color: 0x8a7a72, rough: .9 }), terra: std(0xa8582f, { rough: .85 }), cypress: std(0x2a3c1e, { rough: 1 }), oak: mat('wood', { ns: 1, color: 0x7a5434, rough: .7 }),
    chisel: mat('chisel', { ns: 1.6, color: 0xf2eee6, rough: 1 }), chiselM: mat('chisel', { ns: 1.6, color: 0xa4a29c, rough: 1 }), chiselS: mat('chisel', { ns: 1.4, color: 0xc0aa8a, rough: 1 }), grass: mat('grass', { ns: 1, rough: 1 }), earth: mat('rock', { ns: .6, color: 0x6a5a48, rough: 1 }), turf: mat('grass', { ns: 1.2, color: 0xc8b090, rough: 1 }),
    water: std(0x1a2a2c, { rough: .05, metal: .2 }), dark: std(0x0c0a08, { rough: 1 }),
    iron: std(0x1c1a18, { rough: .5, metal: .6 }), gilt: std(0xc8952e, { rough: .3, metal: .8 }), bronze: std(0x8a5a2a, { rough: .4, metal: .7 }),
    wax: std(0xeee2c4, { rough: .6 }), flame: new THREE.MeshStandardMaterial({ color: 0xffb060, emissive: new THREE.Color(1, .6, .22), emissiveIntensity: 5, transparent: true, opacity: .9, depthWrite: false }),
    glow: std(0x302010, { rough: .5, em: [1, .7, .36], ei: 3.2 }),
    bark: std(0x3a2e24, { rough: 1 }), leaf: std(0x3e5a28, { rough: 1 }), straw: mat('thatch', { ns: .8, color: 0xd8b878, rough: 1 }),
    prim: std(0xf0dc6a, { rough: .9 }), bloomW: std(0xf4f0e4, { rough: .9 }), bloomR: std(0xb0306a, { rough: .9 }),
    rag0: std(0xa83a2a, { rough: 1, side: THREE.DoubleSide }), rag1: std(0xe6e0d0, { rough: 1, side: THREE.DoubleSide }), rag2: std(0x3a5a8a, { rough: 1, side: THREE.DoubleSide }), rag3: std(0x4e7a3a, { rough: 1, side: THREE.DoubleSide }), rag4: std(0xd8b040, { rough: 1, side: THREE.DoubleSide }),
  };
  return MT;
}
// the island's stone and finish for the common niche
const DRESS = {
  gatelands: { stele: 'lime', frame: 'limestone', stat: 'statG', recess: 'lime', icon: 'statG', plinth: 'limestone', basin: 'limestone', top: 'arch', ink: '#5a5248', face: '#e8e4da' },
  mark: { stele: 'granite', frame: 'granite', stat: 'statM', recess: 'granite', icon: 'statM', plinth: 'boulder', basin: 'granite', top: 'arch', ink: '#e4dccb', face: '#8e8c88', chisel: 'chiselM' },
  aurenne: { stele: 'aurplaster', frame: 'ochre', stat: 'marble', recess: 'zellige', icon: 'gilt', plinth: 'ochre', basin: 'marble', top: 'flat', ink: '#2a4a8a', face: '#efe6d2' } };

// ── the builder: geometries by material, merged at the end ──
function kit() {
  const M = mats(), B = new Map(), extra = [];
  const put = (geo, key, x = 0, y = 0, z = 0, ry = 0, rx = 0, rz = 0, s = 1, uv = .8) => { const g = geo.index ? geo.toNonIndexed() : geo; for (const k of Object.keys(g.attributes)) if (!['position', 'normal'].includes(k)) g.deleteAttribute(k);
    g.applyMatrix4(new THREE.Matrix4().compose(new THREE.Vector3(x, y, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(rx, ry, rz, 'YXZ')), new THREE.Vector3(s, s, s))); worldUV(g, uv);
    if (!B.has(key)) B.set(key, []); B.get(key).push(g); return g; };
  const bx = (key, x0, x1, y0, y1, z0, z1, uv) => put(new THREE.BoxGeometry(x1 - x0, y1 - y0, z1 - z0), key, (x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2, 0, 0, 0, 1, uv);
  // a limb or a stick from a to b
  const rod = (key, a, b, r0, r1, seg = 8) => { const A = new THREE.Vector3(...a), Bv = new THREE.Vector3(...b), d = Bv.clone().sub(A), g = new THREE.CylinderGeometry(r1, r0, d.length(), seg);
    g.applyMatrix4(new THREE.Matrix4().makeRotationFromQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.clone().normalize()))); g.translate(...A.clone().add(Bv).multiplyScalar(.5).toArray()); return put(g, key); };
  // a sub-builder whose pieces are moved as one (an icon built at the temple's size, then scaled into a figure's hands)
  const sub = (fn, x, y, z, s = 1, ry = 0) => { const n0 = new Map([...B].map(([k, v]) => [k, v.length])); fn(); const m = new THREE.Matrix4().compose(new THREE.Vector3(x, y, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(0, ry, 0)), new THREE.Vector3(s, s, s));
    for (const [k, gs] of B) for (let i = n0.get(k) || 0; i < gs.length; i++) { gs[i].applyMatrix4(m); worldUV(gs[i], .8 / s); } };
  const add = o => extra.push(o);
  const finish = () => { const group = new THREE.Group(); let tris = 0; for (const [k, gs] of B) { if (!gs.length) continue; const g = mergeGeometries(gs, false); gs.forEach(x => x.dispose()); const m = new THREE.Mesh(g, M[k]); m.name = k;
      m.castShadow = !['flame', 'glow', 'water', 'prim', 'bloomW', 'bloomR'].includes(k) && !k.startsWith('rag'); m.receiveShadow = true; group.add(m); tris += g.attributes.position.count / 3; }
    for (const o of extra) { group.add(o); o.traverse(c => { if (c.isMesh) tris += (c.geometry.index ? c.geometry.index.count : c.geometry.attributes.position.count) / 3; }); }
    return { group, tris: Math.round(tris), draws: group.children.length }; };
  return { M, put, bx, rod, sub, add, finish };
}

// ── canvas: the god's name cut in the panel, and the icon in the roundel ──
const CAN = new Map();
function cut(draw, w, h, key) { if (CAN.has(key)) return CAN.get(key); const c = document.createElement('canvas'); c.width = w; c.height = h; const x = c.getContext('2d'); draw(x, w, h);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; CAN.set(key, t); return t; }
function decal(tex, w, h, ink) { const m = new THREE.MeshStandardMaterial({ map: tex, transparent: true, alphaTest: .25, roughness: .95, color: 0xffffff, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2 }); return new THREE.Mesh(new THREE.PlaneGeometry(w, h), m); }
// letters as a mason cuts them: the stroke dark, a pale lip under each
function nameTex(god, ink) { return cut((x, w, h) => { x.textAlign = 'center'; x.textBaseline = 'middle';
  const line = (s, y, f) => { x.font = f; x.fillStyle = 'rgba(255,255,255,.35)'; x.fillText(s, w / 2, y + 2); x.fillStyle = ink; x.fillText(s, w / 2, y); };
  line(god.name.toUpperCase(), h * .4, `600 ${h * .3}px Georgia, 'Times New Roman', serif`); line(god.en, h * .76, `italic ${h * .2}px Georgia, 'Times New Roman', serif`); }, 512, 192, 'n:' + god.key + ink); }
const ICON2D = {
  hull: x => { x.beginPath(); x.moveTo(30, 132); x.quadraticCurveTo(128, 230, 226, 132); x.lineTo(196, 132); x.quadraticCurveTo(128, 196, 60, 132); x.closePath(); x.fill(); x.fillRect(122, 40, 12, 96); x.beginPath(); x.moveTo(136, 48); x.lineTo(196, 118); x.lineTo(136, 118); x.closePath(); x.fill(); },
  sundial: x => { x.lineWidth = 12; x.beginPath(); x.arc(128, 128, 84, 0, Math.PI * 2); x.stroke(); x.lineWidth = 6; for (let k = 0; k < 12; k++) { const a = k / 12 * Math.PI * 2; x.beginPath(); x.moveTo(128 + Math.cos(a) * 58, 128 + Math.sin(a) * 58); x.lineTo(128 + Math.cos(a) * 76, 128 + Math.sin(a) * 76); x.stroke(); }
    x.beginPath(); x.moveTo(128, 128); x.lineTo(196, 72); x.lineTo(128, 72); x.closePath(); x.fill(); },
  wolf: x => { x.beginPath(); [[60, 200], [76, 120], [64, 52], [100, 92], [128, 84], [150, 60], [160, 96], [214, 128], [208, 146], [160, 146], [150, 200]].forEach(([a, b], i) => i ? x.lineTo(a, b) : x.moveTo(a, b)); x.closePath(); x.fill(); },
  gate: x => { x.fillRect(60, 70, 34, 140); x.fillRect(162, 70, 34, 140); x.fillRect(44, 44, 168, 32); x.lineWidth = 8; x.beginPath(); x.arc(128, 150, 32, Math.PI, 0); x.stroke(); },
  lamp: x => { x.beginPath(); x.ellipse(118, 160, 72, 30, 0, 0, Math.PI * 2); x.fill(); x.beginPath(); x.moveTo(180, 148); x.lineTo(222, 128); x.lineTo(222, 146); x.lineTo(186, 172); x.closePath(); x.fill(); x.fillRect(100, 186, 36, 22);
    x.beginPath(); x.moveTo(214, 122); x.quadraticCurveTo(196, 80, 220, 40); x.quadraticCurveTo(246, 84, 226, 122); x.closePath(); x.fill(); },
  shuttle: x => { x.beginPath(); x.moveTo(20, 128); x.quadraticCurveTo(128, 72, 236, 128); x.quadraticCurveTo(128, 184, 20, 128); x.closePath(); x.fill(); x.save(); x.globalCompositeOperation = 'destination-out'; x.fillRect(96, 116, 64, 24); x.restore(); x.fillRect(104, 122, 48, 12); } };
function iconTex(icon, ink) { return cut((x, w) => { x.fillStyle = 'rgba(255,255,255,.3)'; x.translate(0, 3); ICON2D[icon](x); x.setTransform(1, 0, 0, 1, 0, 0); x.fillStyle = ink; x.strokeStyle = ink; ICON2D[icon](x);
  x.strokeStyle = ink; x.lineWidth = 6; x.beginPath(); x.arc(w / 2, w / 2, w / 2 - 6, 0, Math.PI * 2); x.stroke(); }, 256, 256, 'i:' + icon + ink); }

// ── the figure: a robe turned on a lathe, flattened front to back, a hood over the head, the arms bent to hold the icon at the breast;
// facing +z, its hem on y0. sh: its height. The temple's figure (rooms.js, Session 946) at the niche's size.
const ROBE = [[.001, 0], [.36, 0], [.34, .25], [.28, .7], [.25, 1.05], [.27, 1.3], [.25, 1.5], [.16, 1.62], [.08, 1.66], [.001, 1.67]];
function robed(K, key, x, y0, z, sh) { const k = sh / 2.05;
  const robe = new THREE.LatheGeometry(ROBE.map(([a, b]) => new THREE.Vector2(a * k, b * k)), 16); robe.scale(1, 1, .78); K.put(robe, key, x, y0, z);
  K.put(new THREE.SphereGeometry(.12 * k, 14, 10).scale(1, 1.2, 1), key, x, y0 + sh * .86, z + .02 * k); K.put(new THREE.SphereGeometry(.15 * k, 14, 10, 0, Math.PI * 2, 0, Math.PI * .62).scale(1.05, 1.25, 1).rotateX(.35), key, x, y0 + sh * .865, z - .02 * k);
  for (const s of [-1, 1]) { const S = [x + s * .22 * k, y0 + sh * .74, z + .02 * k], E = [x + s * .23 * k, y0 + sh * .55, z + .1 * k], Hn = [x + s * .08 * k, y0 + sh * .6, z + .36 * k];
    K.rod(key, S, E, .07 * k, .06 * k); K.rod(key, E, Hn, .06 * k, .05 * k); K.put(new THREE.SphereGeometry(.065 * k, 8, 6), key, ...E); K.put(new THREE.SphereGeometry(.055 * k, 8, 6), key, ...Hn); }
  return [x, y0 + sh * .62, z + .44 * k, k]; }
// the icon the figure holds, at the temple's size (front +z), scaled by k into the hands
function icon3d(K, icon, key, at, flameKey = 'flame') { const [x, y, z, k] = at; K.sub(() => {
  if (icon === 'lamp') { K.put(new THREE.CylinderGeometry(.1, .06, .06, 14), key); K.bx(key, -.025, .025, -.01, .03, .08, .17); K.put(new THREE.SphereGeometry(.025, 8, 6).scale(1, 2.4, 1), flameKey, 0, .08, .15); }
  else if (icon === 'hull') { K.put(new THREE.SphereGeometry(.2, 14, 8, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2).scale(1.5, .9, .5), key, 0, .1, 0); K.bx(key, -.27, .27, .085, .1, -.1, .1); K.bx(key, -.005, .005, .06, .34, -.005, .005); }
  else if (icon === 'sundial') { K.put(new THREE.CylinderGeometry(.16, .16, .035, 20).rotateX(Math.PI / 2), key, 0, .1, 0); const s = new THREE.Shape(); s.moveTo(0, 0); s.lineTo(.13, 0); s.lineTo(0, .11); s.lineTo(0, 0);
    K.put(new THREE.ExtrudeGeometry(s, { depth: .015, bevelEnabled: false }), key, -.02, .1, .018); }
  else if (icon === 'gate') { for (const s of [-1, 1]) K.bx(key, s * .1 - .035, s * .1 + .035, -.1, .2, -.04, .04); K.bx(key, -.17, .17, .2, .27, -.05, .05); }
  else if (icon === 'shuttle') { K.put(new THREE.CylinderGeometry(.045, .045, .2, 10).rotateZ(Math.PI / 2), key); for (const s of [-1, 1]) K.put(new THREE.ConeGeometry(.045, .2, 10).rotateZ(-s * Math.PI / 2), key, s * .2, 0, 0);
    K.put(new THREE.CylinderGeometry(.03, .03, .14, 8).rotateZ(Math.PI / 2), 'rag4', 0, 0, .03); } }, x, y, z, k); }
// Na Beithígh's wolf, sitting, 0.8 m to the ears, facing +z
function wolf(K, key, x, y0, z) { K.sub(() => {
  K.put(new THREE.SphereGeometry(.2, 14, 10).scale(1.1, .85, 1.25), key, 0, .19, -.08); K.put(new THREE.SphereGeometry(.16, 14, 10).scale(.9, 1.45, .95), key, 0, .42, .03, 0, -.25);
  K.put(new THREE.SphereGeometry(.105, 14, 10).scale(1, .95, 1.1), key, 0, .66, .1); K.put(new THREE.ConeGeometry(.055, .17, 10).rotateX(Math.PI / 2), key, 0, .63, .23); K.put(new THREE.SphereGeometry(.02, 6, 5), key, 0, .635, .315);
  for (const s of [-1, 1]) { K.put(new THREE.ConeGeometry(.035, .1, 6), key, s * .055, .77, .06, 0, -.15, s * -.25); K.rod(key, [s * .075, .02, .17], [s * .07, .4, .1], .032, .04); K.put(new THREE.SphereGeometry(.04, 8, 6).scale(1, .6, 1.4), key, s * .075, .025, .19);
    K.put(new THREE.SphereGeometry(.07, 10, 8).scale(.8, .6, 1.8), key, s * .14, .08, -.02); }
  K.rod(key, [.12, .05, -.24], [.2, .04, .05], .045, .025); K.rod(key, [.2, .04, .05], [.12, .04, .2], .025, .012); }, x, y0, z); }

// ── the common niche ──
const W = 1.0, SPRING = 1.8, PL = .25, SILL = .78, RW = .62, RSPRING = 1.52, DF = .32, DB = .16;
export const NICHE = { w: W, h: PL + SPRING + W / 2, sill: PL + SILL, recess: { w: RW, h: RSPRING - SILL + RW / 2, d: DF }, plinth: PL };
function outline(top) { const s = new THREE.Shape(); s.moveTo(-W / 2, 0); s.lineTo(W / 2, 0); if (top === 'flat') { s.lineTo(W / 2, SPRING + .38); s.lineTo(-W / 2, SPRING + .38); } else { s.lineTo(W / 2, SPRING); s.absarc(0, SPRING, W / 2, 0, Math.PI, false); } s.lineTo(-W / 2, 0); return s; }
function hole() { const p = new THREE.Path(); p.moveTo(-RW / 2, SILL); p.lineTo(RW / 2, SILL); p.lineTo(RW / 2, RSPRING); p.absarc(0, RSPRING, RW / 2, 0, Math.PI, false); p.lineTo(-RW / 2, SILL); return p; }
function holeShape() { const s = new THREE.Shape(); s.moveTo(-RW / 2, SILL); s.lineTo(RW / 2, SILL); s.lineTo(RW / 2, RSPRING); s.absarc(0, RSPRING, RW / 2, 0, Math.PI, false); s.lineTo(-RW / 2, SILL); return s; }
function buildNiche(K, godKey, island, x0 = 0, o = {}) {
  const D = DRESS[island], guest = godKey === 'guest', god = GODS.find(g => g.key === godKey), r = stream(`niche:${island}:${godKey}:${x0}`);
  // the plinth, a step wider than the stele, and the stele on it: a frame with the recess through it, and a back slab
  if (island === 'mark') { const g = new THREE.DodecahedronGeometry(.62, 1); g.scale(1.05, .3, .62); K.put(g, D.plinth, x0, PL * .4, -.22); }
  else K.bx(D.plinth, x0 - .6, x0 + .6, 0, PL, -.58, .14);
  const fr = outline(D.top); fr.holes.push(hole()); const F = new THREE.ExtrudeGeometry(fr, { depth: DF - .02, bevelEnabled: true, bevelThickness: .01, bevelSize: .01, bevelSegments: 1, curveSegments: 14 }); K.put(F, D.stele, x0, PL, -DF + .01);
  K.put(new THREE.ExtrudeGeometry(outline(D.top), { depth: DB, bevelEnabled: false, curveSegments: 14 }), D.stele, x0, PL, -DF - DB);
  // the recess's lining (Aurenne's glazed tile, the island's stone elsewhere): its back face, just proud of the slab
  K.put(new THREE.ShapeGeometry(holeShape(), 14), D.recess, x0, PL, -DF + .004);
  // the hood moulding over the arch and its two stops; Aurenne's flat stele takes a cornice and a cupola instead
  if (D.top === 'arch') { K.put(new THREE.TorusGeometry(RW / 2 + .06, .035, 6, 18, Math.PI), D.frame, x0, PL + RSPRING, .015); for (const s of [-1, 1]) K.bx(D.frame, x0 + s * (RW / 2 + .06) - .05, x0 + s * (RW / 2 + .06) + .05, PL + RSPRING - .1, PL + RSPRING, -.02, .05); }
  else { const T = PL + SPRING + .38; K.bx(D.frame, x0 - W / 2 - .05, x0 + W / 2 + .05, T, T + .08, -DF - DB - .04, .05); K.bx(D.frame, x0 - W / 2 - .02, x0 + W / 2 + .02, T + .08, T + .14, -DF - DB - .01, .02);
    K.put(new THREE.CylinderGeometry(.3, .32, .16, 20), D.frame, x0, T + .22, -DF / 2 - DB / 2 + .02); K.put(new THREE.SphereGeometry(.3, 20, 10, 0, Math.PI * 2, 0, Math.PI / 2), 'glaze', x0, T + .3, -DF / 2 - DB / 2 + .02);
    K.put(new THREE.SphereGeometry(.035, 8, 6), 'gilt', x0, T + .62, -DF / 2 - DB / 2 + .02);
    // a frame of ochre stone round the recess
    for (const s of [-1, 1]) K.bx(D.frame, x0 + s * (RW / 2 + .045) - .045, x0 + s * (RW / 2 + .045) + .045, PL + SILL - .04, PL + RSPRING, -.01, .03); K.put(new THREE.TorusGeometry(RW / 2 + .045, .045, 6, 18, Math.PI), D.frame, x0, PL + RSPRING, .01); }
  K.bx(D.frame, x0 - RW / 2 - .08, x0 + RW / 2 + .08, PL + SILL - .05, PL + SILL, -DF + .01, .07); // the sill, a lip out over the face
  const sillY = PL + SILL, fz = -DF / 2 - .01;
  // the name panel under the sill and the roundel over the arch
  const pY = PL + .63, rY = D.top === 'arch' ? PL + RSPRING + RW / 2 + .2 : PL + RSPRING + RW / 2 + .16;
  if (!guest) { const n = decal(nameTex(god, D.ink), .78, .28); n.position.set(x0, pY, .006); K.add(n);
    const ic = decal(iconTex(god.icon, D.ink), .24, .24); ic.position.set(x0, rY, .006); K.add(ic);
    if (god.icon === 'wolf') wolf(K, D.stat, x0, sillY, fz - .02); else icon3d(K, god.icon, D.icon, robed(K, D.stat, x0, sillY, fz, .95));
    // the candle on the sill; Aurenne's in a red glass, the Mark's lamp hangs from the housing instead
    if (island !== 'mark') { const cx = x0 + .2, cz = -.04, ch = .1 + r() * .06; K.put(new THREE.CylinderGeometry(.03, .032, ch, 10), 'wax', cx, sillY + ch / 2, cz); K.put(new THREE.SphereGeometry(.016, 6, 5).scale(1, 2.3, 1), 'flame', cx, sillY + ch + .035, cz); }
  } else if (island === 'aurenne') {
    // bricked up and plastered over, the plaster newer and whiter than the stele's; a patch has fallen and shows the brick
    K.put(new THREE.ExtrudeGeometry(holeShape(), { depth: DF - .04, bevelEnabled: false, curveSegments: 14 }), 'newplaster', x0, PL, -DF + .004);
    const p = new THREE.Shape(), rr = stream('fallen'); for (let i = 0; i <= 14; i++) { const a = i / 14 * Math.PI * 2, d = .1 + rr() * .06; const q = [.04 + Math.cos(a) * d * 1.1, SILL + .44 + Math.sin(a) * d * .8]; i ? p.lineTo(...q) : p.moveTo(...q); } K.put(new THREE.ShapeGeometry(p), 'brick', x0, PL, -.032);
    K.bx('chisel', x0 - .4, x0 + .4, pY - .14, pY + .14, -.01, .004); K.put(new THREE.CircleGeometry(.12, 18), 'chisel', x0, rY, .004);
  } else {
    // the figure struck away: a stump of the hem on the sill, its outline left as a scar on the back of the recess, the name and the
    // roundel cut back to rough stone
    const k = .95 / 2.05, stump = new THREE.LatheGeometry([[.001, 0], [.36, 0], [.35, .12], [.31, .2], [.001, .26]].map(([a, b]) => new THREE.Vector2(a * k, b * k)), 12); stump.scale(1, 1, .78); K.put(stump, D.chisel || 'chisel', x0, sillY, fz);
    const sil = new THREE.Shape(); ROBE.forEach(([a, b], i) => i ? sil.lineTo(a * k * 1.02, b * k) : sil.moveTo(0, 0)); for (let i = ROBE.length - 1; i >= 0; i--) sil.lineTo(-ROBE[i][0] * k * 1.02, ROBE[i][1] * k);
    K.put(new THREE.ExtrudeGeometry(sil, { depth: .012, bevelEnabled: false }), D.chisel || 'chisel', x0, sillY, -DF + .006);
    K.bx(D.chisel || 'chisel', x0 - .4, x0 + .4, pY - .14, pY + .14, -.012, .002); K.put(new THREE.CylinderGeometry(.13, .13, .012, 18).rotateX(Math.PI / 2), D.chisel || 'chisel', x0, rY, -.002);
  }
  // the basin before the niche: a bowl on a stem, water in it; none before the Guest's
  let basin = null; if (!guest) { const bz = .55; K.put(new THREE.CylinderGeometry(.08, .12, .52, 12), D.basin, x0, .26, bz); K.put(new THREE.CylinderGeometry(.16, .16, .05, 14), D.basin, x0, .025, bz);
    K.put(new THREE.LatheGeometry([[0, 0], [.1, .005], [.19, .05], [.25, .13], [.25, .16], [.22, .16], [.18, .08], [0, .06]].map(([a, b]) => new THREE.Vector2(a * .85, b * .85)), 18), D.basin, x0, .52, bz);
    K.put(new THREE.CircleGeometry(.175, 18).rotateX(-Math.PI / 2), 'water', x0, .52 + .115, bz); basin = [x0, .52 + .136, bz]; }
  // the wayside form of the seventh niche: a struck recess the size of a hand, low on the plinth's face beside the altar
  if (o.struck) { const sx = x0 + .44; if (island === 'mark') { K.bx('chiselM', sx - .07, sx + .07, .06, .24, .2, .23); } else { K.bx('chisel', sx - .07, sx + .07, .04, .2, .12, .145); K.bx(D.frame, sx - .09, sx + .09, .2, .22, .1, .15); } }
  return { god: godKey, x: x0, sill: sillY, basin, pray: [x0, 1.1] };
}

// ── the dressings ──
// the Gatelands: rags on a thorn, a holy well, a ring-headed high cross, a holed ring-stone, primroses, a limewashed drystone wall
function thorn(K, x, z, r, n = 12) { // a hawthorn bent by the wind, its rags tied on its low branches
  const pts = [], T = [[x, 0, z], [x + .12, .7, z - .04], [x + .32, 1.35, z - .1]]; K.rod('bark', T[0], T[1], .12, .1, 7); K.rod('bark', T[1], T[2], .1, .08, 7); const top = T[2];
  for (let i = 0; i < 7; i++) { const a = i / 7 * Math.PI * 2 + r(), L = .7 + r() * .6, from = i < 3 ? T[1] : top, e = [from[0] + Math.cos(a) * L, from[1] + .2 + r() * .7, from[2] + Math.sin(a) * L * .8]; K.rod('bark', from, e, .05, .02, 6);
    for (let j = 0; j < 3; j++) { const t = .35 + j * .3, p = from.map((v, k) => v + (e[k] - v) * t); const f = [p[0] + (r() - .5) * .6, p[1] + .05 + r() * .35, p[2] + (r() - .5) * .6]; K.rod('bark', p, f, .02, .008, 5); if (p[1] < 1.9) pts.push(p); }
    for (let c = 0; c < 4; c++) K.put(new THREE.IcosahedronGeometry(.16 + r() * .1, 1).scale(1.3, .75, 1.2), 'leaf', e[0] + (r() - .5) * .5, e[1] + (r() - .3) * .25, e[2] + (r() - .5) * .5, r() * 3); }
  for (let i = 0; i < n; i++) { const p = pts[i % pts.length], len = .2 + r() * .28, q = [p[0] + (r() - .5) * .1, p[1], p[2] + (r() - .5) * .1]; K.put(new THREE.PlaneGeometry(.04 + r() * .03, len), 'rag' + (i % 5), q[0], q[1] - len / 2, q[2], r() * Math.PI, 0, (r() - .5) * .25); } }
function well(K, x, z, r) { for (let c = 0; c < 2; c++) for (let i = 0; i < 20; i++) { const a = (i + c * .5) / 20 * Math.PI * 2, g = new THREE.DodecahedronGeometry(.13 + r() * .04, 1); g.scale(1.4, .55, 1); K.put(g, 'rubble', x + Math.cos(a) * .74, .07 + c * .13, z + Math.sin(a) * .74, -a + r() * .3); }
  K.put(new THREE.TorusGeometry(.74, .09, 5, 28).rotateX(Math.PI / 2).scale(1, .4, 1), 'lime', x, .29, z);
  K.put(new THREE.CylinderGeometry(.62, .62, .5, 20, 1, true), 'dark', x, -.12, z); K.put(new THREE.CircleGeometry(.62, 20).rotateX(-Math.PI / 2), 'water', x, .04, z);
  // the well's lintel stone at its head, a cross cut in it, a tin cup on the ledge
  K.bx('limestone', x - .3, x + .3, 0, .75, z - 1.0, z - .82); K.bx('chisel', x - .015, x + .015, .35, .65, z - .82, z - .815); K.bx('chisel', x - .1, x + .1, .54, .57, z - .82, z - .815);
  K.put(new THREE.CylinderGeometry(.035, .03, .07, 10), 'iron', x + .18, .785, z - .91); }
function highCross(K, x, z) { const k = 'sandmono'; K.bx(k, x - .5, x + .5, 0, .35, z - .4, z + .4); K.bx(k, x - .38, x + .38, .35, .6, z - .3, z + .3);
  K.put(new THREE.BoxGeometry(.34, 2.3, .22).translate(0, 1.15, 0), k, x, .6, z); const cy = .6 + 2.3 + .12; K.bx(k, x - .62, x + .62, cy - .14, cy + .14, z - .1, z + .1); K.bx(k, x - .16, x + .16, cy, cy + .6, z - .1, z + .1);
  K.put(new THREE.TorusGeometry(.4, .07, 8, 28).scale(1, 1, 1.4), k, x, cy, z); K.put(new THREE.ConeGeometry(.2, .2, 4).rotateY(Math.PI / 4), k, x, cy + .7, z);
  // the carved panels down the shaft's face, cut back a finger's depth
  for (let i = 0; i < 3; i++) K.bx('chiselS', x - .12, x + .12, 1.0 + i * .62, 1.5 + i * .62, z + .1, z + .112); }
function ringStone(K, x, z, r) { const s = new THREE.Shape(); s.moveTo(-.42, 0); s.lineTo(.4, 0); s.quadraticCurveTo(.5, .9, .32, 1.55); s.quadraticCurveTo(0, 1.75, -.34, 1.5); s.quadraticCurveTo(-.5, .8, -.42, 0);
  const h = new THREE.Path(); h.absarc(0, 1.05, .13, 0, Math.PI * 2, true); s.holes.push(h); K.put(new THREE.ExtrudeGeometry(s, { depth: .26, bevelEnabled: true, bevelThickness: .04, bevelSize: .04, bevelSegments: 2, curveSegments: 16 }), 'boulder', x, 0, z - .13, r() * .2 - .1); }
function primroses(K, x, z, r, n = 9) { for (let i = 0; i < n; i++) { const px = x + (r() - .5) * .9, pz = z + (r() - .5) * .3; K.put(new THREE.IcosahedronGeometry(.07, 0).scale(1, .45, 1), 'leaf', px, .03, pz); for (let j = 0; j < 4; j++) K.put(new THREE.SphereGeometry(.018, 5, 4).scale(1, .5, 1), j % 3 ? 'prim' : 'bloomW', px + (r() - .5) * .1, .065, pz + (r() - .5) * .1); } }
function drystone(K, x0, x1, z, h = .9) { K.bx('rubble', x0, x1, 0, h, z - .3, z + .3, .5); K.bx('lime', x0 - .03, x1 + .03, h, h + .1, z - .33, z + .33); }
// the Mark: each niche under its housing, its gable to the road; the lamp under the tie beam
function housing(K, x0, r) { const hw = .66, zf = .52, zb = -.62, wp = 2.62, P = 55 * Math.PI / 180, ov = .14, rise = (hw + ov) * Math.tan(P), ridge = wp + rise;
  for (const sx of [-1, 1]) for (const zz of [zf, zb]) K.bx('post', x0 + sx * hw - .065, x0 + sx * hw + .065, 0, wp, zz - .065, zz + .065, .5);
  for (const sx of [-1, 1]) K.bx('beam', x0 + sx * hw - .07, x0 + sx * hw + .07, wp - .02, wp + .14, zb - .2, zf + .2, .5); // the wall plates
  K.bx('beam', x0 - hw - .1, x0 + hw + .1, wp - .2, wp - .04, zf - .07, zf + .07, .5); K.bx('beam', x0 - hw - .1, x0 + hw + .1, wp - .2, wp - .04, zb - .07, zb + .07, .5); // the tie beams
  const L = (hw + ov) / Math.cos(P), zl = zb - .26, zr = zf + .3;
  for (const s of [-1, 1]) { const g = new THREE.BoxGeometry(L + .02, .06, zr - zl); g.rotateZ(s * -P); K.put(g, 'shingle', x0 + s * (hw + ov) / 2, wp + .1 + rise / 2, (zl + zr) / 2, 0, 0, 0, 1, .7); }
  K.bx('beam', x0 - .05, x0 + .05, ridge + .04, ridge + .16, zl, zr, .5);
  // the crossed bargeboards on the front gable, running past the ridge into two beast heads looking out
  for (const s of [-1, 1]) { const len = L + .3, g = new THREE.BoxGeometry(len, .13, .045); g.translate(-s * .12, 0, 0); g.rotateZ(s * -P); K.put(g, 'carve', x0 + s * (hw + ov) / 2, wp + .1 + rise / 2 + .06, zr + .03, 0, 0, 0, 1, .5);
    const tip = [x0 - s * .2, ridge + .26, zr + .03]; K.put(new THREE.BoxGeometry(.09, .1, .18), 'carve', ...tip, 0, 0, s * .4); K.put(new THREE.ConeGeometry(.05, .16, 4).rotateZ(s * Math.PI / 2), 'carve', tip[0] - s * .11, tip[1] + .03, tip[2] + .02);
    K.put(new THREE.ConeGeometry(.025, .08, 4), 'carve', tip[0] + s * .02, tip[1] + .1, tip[2]); }
  // the lamp: an iron cage on a chain from the front tie beam, its flame never let out
  const ly = wp - .62, lz = zf - .02; K.bx('iron', x0 - .006, x0 + .006, ly + .2, wp - .2, lz - .006, lz + .006); K.bx('iron', x0 - .08, x0 + .08, ly + .17, ly + .2, lz - .08, lz + .08); K.bx('iron', x0 - .07, x0 + .07, ly - .02, ly, lz - .07, lz + .07);
  for (const a of [-1, 1]) for (const b of [-1, 1]) K.bx('iron', x0 + a * .065 - .007, x0 + a * .065 + .007, ly, ly + .17, lz + b * .065 - .007, lz + b * .065 + .007);
  K.put(new THREE.SphereGeometry(.045, 10, 8).scale(1, 1.6, 1), 'glow', x0, ly + .08, lz); return [x0, ly + .08, lz]; }
function oathStone(K, x, z) { const g = new THREE.DodecahedronGeometry(.6, 2), P = g.attributes.position; for (let i = 0; i < P.count; i++) { const v = new THREE.Vector3().fromBufferAttribute(P, i), n = 1 + .12 * Math.sin(v.x * 9 + v.y * 5) * Math.cos(v.z * 7); v.multiplyScalar(n); if (v.y > .42) v.y = .42 + (v.y - .42) * .15; P.setXYZ(i, v.x, v.y, v.z); }
  g.scale(1.1, 1.45, .85); g.computeVertexNormals(); K.put(g, 'boulder', x, .5, z, .3);
  K.put(new THREE.TorusGeometry(.11, .018, 8, 18), 'iron', x, .82, z + .48); K.bx('iron', x - .025, x + .025, .9, .96, z + .44, z + .5); }
// Aurenne: the wall and its railings, a gate in the middle; the tithe box and the notice
function railing(K, x0, x1, z, gap) { K.bx('aurplaster', x0, x1, 0, .5, z - .14, z + .14, .6); K.bx('ochre', x0 - .02, x1 + .02, .5, .56, z - .17, z + .17);
  for (let x = x0 + .06; x < x1; x += .13) { if (gap != null && Math.abs(x - gap) < .62) continue; K.bx('iron', x - .011, x + .011, .56, 1.38, z - .011, z + .011); K.put(new THREE.ConeGeometry(.024, .07, 4), 'iron', x, 1.42, z); }
  for (const y of [.62, 1.3]) for (const [a, b] of gap != null ? [[x0, gap - .6], [gap + .6, x1]] : [[x0, x1]]) K.bx('iron', a, b, y - .012, y + .012, z - .014, z + .014);
  if (gap != null) { for (const s of [-1, 1]) { K.bx('ochre', gap + s * .62 - .1, gap + s * .62 + .1, 0, 1.55, z - .17, z + .17); K.put(new THREE.SphereGeometry(.08, 10, 8), 'ochre', gap + s * .62, 1.62, z);
    // the two leaves, hung on the piers and swung open inward
    const a = 1.1, dx = -s * Math.cos(a), dz = -Math.sin(a), hx = gap + s * .52; for (let k = 0; k < 4; k++) { const d = .04 + k * .14; K.bx('iron', hx + dx * d - .011, hx + dx * d + .011, .1, 1.25, z + dz * d - .011, z + dz * d + .011); }
    for (const y of [.18, 1.18]) { const g = new THREE.BoxGeometry(.5, .024, .024); g.translate(-.25, 0, 0); K.put(g, 'iron', hx, y, z, s > 0 ? -a : Math.PI + a); } } } }
function tithe(K, x, z) { K.bx('oak', x - .05, x + .05, 0, .9, z - .05, z + .05, 1); K.bx('oak', x - .2, x + .2, .9, 1.28, z - .15, z + .15, 1); for (const y of [.94, 1.24]) K.bx('iron', x - .205, x + .205, y - .018, y + .018, z - .155, z + .155);
  K.bx('dark', x - .07, x + .07, 1.281, 1.284, z - .012, z + .012); K.bx('iron', x - .04, x + .04, 1.08, 1.16, z + .15, z + .16); }
function noticeTex() { return cut((x, w, h) => { x.fillStyle = '#efe4c8'; x.fillRect(0, 0, w, h); x.strokeStyle = '#2a4a8a'; x.lineWidth = 10; x.strokeRect(14, 14, w - 28, h - 28);
  x.fillStyle = '#2a4a8a'; x.textAlign = 'center'; x.font = `600 34px Georgia, serif`; x.fillText('THE CHURCH OF THE WEAVER', w / 2, 82);
  x.fillStyle = '#3a2a1c'; x.font = 'italic 27px Georgia, serif'; ['This shrine is kept by order', 'of the Prior of the parish.', '', 'Offerings at the box.', 'A candle is one copper.', 'No rubbings to be taken.', 'The gate is shut', 'at the evening bell.'].forEach((s, i) => x.fillText(s, w / 2, 150 + i * 40));
  x.beginPath(); x.moveTo(w / 2 - 70, h - 64); x.quadraticCurveTo(w / 2, h - 96, w / 2 + 70, h - 64); x.quadraticCurveTo(w / 2, h - 32, w / 2 - 70, h - 64); x.fillStyle = '#2a4a8a'; x.fill(); }, 512, 640, 'notice'); }
function notice(K, x, z) { K.bx('oak', x - .34, x + .34, 1.0, 1.84, z - .03, z, 1); const n = new THREE.Mesh(new THREE.PlaneGeometry(.6, .76), new THREE.MeshStandardMaterial({ map: noticeTex(), roughness: .9 })); n.position.set(x, 1.42, z + .002); n.receiveShadow = true; K.add(n); }
function pot(K, x, z, r) { K.put(new THREE.LatheGeometry([[0, 0], [.14, 0], [.2, .2], [.18, .36], [.2, .4], [0, .4]].map(([a, b]) => new THREE.Vector2(a, b)), 14), 'terra', x, 0, z);
  K.put(new THREE.ConeGeometry(.2 + r() * .06, 1.3 + r() * .5, 9).translate(0, .65, 0), 'cypress', x, .38, z); }

// ── the forms ──
const ORDER = [...GODS.map(g => g.key), 'guest'];
export function row(island, o = {}) {
  const K = kit(), r = stream('row:' + island), niches = [], lamps = []; const X = i => (i - 3) * SPACING[island];
  ORDER.forEach((g, i) => { const n = buildNiche(K, g, island, X(i)); niches.push(n); if (island === 'mark') lamps.push(housing(K, X(i), r)); });
  if (island === 'gatelands') {
    drystone(K, X(0) - 1.1, X(6) + 1.1, -1.35); for (let i = 0; i < 6; i++) primroses(K, X(i), .22, r, 5);
    // a rag or two tied on every hood moulding's stop, and the rag thorn at the row's west end
    ORDER.forEach((g, i) => { if (g === 'guest') return; for (let k = 0; k < 1; k++) { const len = .22 + r() * .16; K.put(new THREE.PlaneGeometry(.04, len), 'rag' + ((i + k * 2) % 5), X(i) + (i % 2 ? 1 : -1) * (RW / 2 + .06), PL + RSPRING - .1 - len / 2, .06, (r() - .5) * .5, 0, (r() - .5) * .2); } });
    thorn(K, X(0) - 1.9, -.2, r, 22); well(K, -3.3, 2.9, r); highCross(K, X(6) + 2.0, -.4); ringStone(K, X(0) - 2.0, 1.6, r);
  } else if (island === 'mark') oathStone(K, 0, 2.6);
  else { railing(K, X(0) - .9, X(6) + .9, 1.45, 0); tithe(K, .98, 1.15); notice(K, X(6) + .95, -.52); for (const x of [X(0) - .85, X(6) + .85]) pot(K, x, .5, r);
    K.bx('ochre', X(0) - .95, X(6) + .95, 0, .03, -.9, 1.3, .5); K.bx('aurplaster', X(6) + .6, X(6) + 1.3, 0, 2.2, -.7, -.55, .6); K.bx('aurplaster', X(0) - 1.3, X(0) - .6, 0, 2.2, -.7, -.55, .6);
    for (let i = 0; i < 6; i++) for (let k = 0; k < 3; k++) { const cx = X(i) - .2 + k * .06, ch = .05 + r() * .05; K.put(new THREE.CylinderGeometry(.018, .02, ch, 8), 'wax', cx, PL + SILL + ch / 2, -.06); K.put(new THREE.SphereGeometry(.01, 5, 4).scale(1, 2.3, 1), 'flame', cx, PL + SILL + ch + .02, -.06); } }
  const f = K.finish(); return { ...f, niches, lamps, island, pray: [0, 1.4] };
}
export function wayside(island, god = 'teallach') {
  const K = kit(), r = stream(`wayside:${island}:${god}`), lamps = []; const n = buildNiche(K, god, island, 0, { struck: true });
  if (island === 'gatelands') { thorn(K, -1.7, -.5, r, 14); well(K, 1.8, 1.1, r); primroses(K, 0, .25, r, 7); for (let k = 0; k < 3; k++) { const len = .3 + r() * .2; K.put(new THREE.PlaneGeometry(.04, len), 'rag' + k, (k - 1) * .07 + (RW / 2 + .06), PL + RSPRING - .1 - len / 2, .06, r(), 0, 0); } }
  else if (island === 'mark') { lamps.push(housing(K, 0, r)); oathStone(K, 1.7, .9); }
  else { railing(K, -1.15, 1.15, 1.2, 0); tithe(K, .95, .3); pot(K, -.85, .3, r); K.bx('ochre', -1.2, 1.2, 0, .03, -.8, 1.3, .5); }
  const f = K.finish(); return { ...f, niches: [n], lamps, island, pray: n.pray };
}
export function niche(god, island, o = {}) { const K = kit(); const n = buildNiche(K, god, island, 0, o); const f = K.finish(); return { ...f, ...n }; }
