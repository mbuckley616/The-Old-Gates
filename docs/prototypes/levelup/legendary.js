// Legendary weapons by island in the new kit (the concept artist, 31 Oct 2026; backlog L7 "Legendary weapons", OG-075, with OG-123's
// relics owed). Five an island in its style, each with its own silhouette, a rich material and a visible effect of its own, as the
// image asks; the image's names, owners and stat lines are not taken (the catalogue's note), so each piece here has a working
// description, and its name and story are the quest writer's. No firearm (Michael's 7 A). Aurenne's war fan and scimitar follow
// "Weapons by island" (the kris, the chakram and the war fan become a falchion, a flyssa, a nimcha, a takouba): the scimitar is a
// nimcha, the dancer's fan a takouba with silk at its pommel.
// legendary(key, { mode, t }) -> { group, tris, draws, size, tick(t), key, island, kind, len, held }
//   Every piece is built along +y from its pommel or butt (y 0), its edge or head toward +x, flat in the x-y plane; a bow along +y from
//   its lower nock. A pole's shaft is 1.3 cm in radius from 0.6 to 1.3 m (people.js's spear), so the spear grip closes on it.
//   mode: 'still' (A: the shape and the materials alone; the inlays are plain metal), 'always' (B: the effect at full whenever the piece
//   is seen), 'rest' (C at rest: on a rack, slung or sheathed the inlay holds a fifth of its light and a quarter of its motes, no arcs);
//   C in the hand is 'always'. `tick(t)` moves the motes, arcs and silk by the clock (seconds), so a still frame is the same at the same t.
// The Gatelands (Celtic knotwork, iron and bronze, the Weaver's blue-grey and a Crown gold):
//   kingsword  a longsword of the first kings, 1.17 m: a wheel pommel, the guard's arms drooping to knots, a knotwork fuller that burns
//              a pale dawn gold, motes rising off the blade.
//   stormaxe   a bearded war axe, 0.86 m: iron langets on ash, knotwork on the cheek, white-blue arcs running along the edge.
//   wardspear  a forest wardens' spear, 2.2 m: a leaf blade, ivy grown up the shaft in leaf, the leaves lit green, motes drifting.
//   embermace  a flanged mace with a coal in its heart, 0.78 m: seven iron flanges round a live coal, cracks lit, sparks rising.
//   rangerbow  a yew longbow, 1.84 m: tapered limbs, horn nocks, a knot inlay down the back that glows moss green, the string faint.
// The Mark (runes, iron, fur and bone, the aurora's green and violet):
//   bearaxe    a great bearded axe, 1.56 m: a head 0.36 m deep with a rune band burning red-gold, a top spike, langets, a wool grip.
//   glacier    an ice-steel two-hander, 1.66 m: a wide blade of pale blue steel, rime crystals at the guard, frost mist breathing off it.
//   harpoon    a whaling harpoon, 2.4 m: a long iron shank, a toggling barbed head lit sea green, a coil of line at the shaft, drips falling.
//   flail      a chain flail, 0.98 m: an iron-bound haft, five links, a spiked ball whose grooves carry the aurora.
//   ritspear   a ritual spear, 2.0 m: a long rune-cut head, a fur collar, bone pendants and raven feathers, the runes shifting green to violet.
// Aurenne (filigree, gilt and bronze, star metal, pearl and silk; the sun's gold and the sea's blue):
//   rapier     a duellist's rapier, 1.12 m: a swept gilt hilt, a knuckle bow and rings, filigree at the ricasso lit gold, a glint at the point.
//   nimcha     a nimcha of star metal, 0.96 m: a curved blade of near-black metal whose stars burn, down-turned quillons, a knuckle guard.
//   sunbow     a composite recurve bow, 1.26 m: horn on the belly, gilt bands, the ears lit like the sun's rim.
//   tideglaive a tide-blessed glaive, 1.9 m: a crescent head inlaid with pearl, lit sea blue, drops of water circling it.
//   takouba    the dancer's blade, a takouba, 1.0 m: a straight blade with three fullers, a disc pommel, two silk ribbons that move in no wind.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { TEX } from './common.js';

const S = (r, g, b) => new THREE.Color().setRGB(r, g, b, THREE.SRGBColorSpace);
const V = (x, y, z) => new THREE.Vector3(x, y, z);
const T = (x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0, s = 1) => new THREE.Matrix4().compose(V(x, y, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(rx, ry, rz, 'YXZ')), typeof s === 'number' ? V(s, s, s) : V(...s));
export const MODES = { still: 0, rest: .2, always: 1 };
export const ISLANDS = { gatelands: ['kingsword', 'stormaxe', 'wardspear', 'embermace', 'rangerbow'], mark: ['bearaxe', 'glacier', 'harpoon', 'flail', 'ritspear'], aurenne: ['rapier', 'nimcha', 'sunbow', 'tideglaive', 'takouba'] };
export const NAMES = { kingsword: 'the first kings’ longsword', stormaxe: 'the storm axe', wardspear: 'the wardens’ spear', embermace: 'the ember mace', rangerbow: 'the ranger’s longbow',
  bearaxe: 'the great axe', glacier: 'the glacier blade', harpoon: 'the whaler’s harpoon', flail: 'the aurora flail', ritspear: 'the rite spear',
  rapier: 'the duellist’s rapier', nimcha: 'the star-metal nimcha', sunbow: 'the sun bow', tideglaive: 'the tide glaive', takouba: 'the dancer’s blade' };

// ── patterns cut into a blade, white on clear, read as an alpha map in the shape's own metres (ExtrudeGeometry's uv is x, y) ──
const PAT = {};
function patTex(kind) {
  if (PAT[kind]) return PAT[kind];
  const c = document.createElement('canvas'); c.width = c.height = 256; const x = c.getContext('2d'); x.strokeStyle = x.fillStyle = '#fff'; x.lineCap = 'round'; x.lineJoin = 'round';
  let s = 7; const r = () => ((s = (s * 16807) % 2147483647) - 1) / 2147483646;
  if (kind === 'knot') { x.lineWidth = 14; for (const ph of [0, Math.PI]) { x.beginPath(); for (let i = 0; i <= 64; i++) { const y = i / 64 * 256, xx = 128 + Math.sin(i / 64 * Math.PI * 4 + ph) * 78; i ? x.lineTo(xx, y) : x.moveTo(xx, y); } x.stroke(); }
    x.globalCompositeOperation = 'destination-out'; x.lineWidth = 6; for (let k = 0; k < 4; k++) { const y = (k + .5) * 64; x.beginPath(); x.moveTo(108, y - 10); x.lineTo(148, y + 10); x.stroke(); } x.globalCompositeOperation = 'source-over'; }
  else if (kind === 'runes') { x.lineWidth = 11; for (let k = 0; k < 4; k++) { const y0 = k * 64 + 8, y1 = y0 + 48, cx = 128; x.beginPath(); x.moveTo(cx, y0); x.lineTo(cx, y1); const f = Math.floor(r() * 5);
      if (f === 0) { x.moveTo(cx, y0 + 6); x.lineTo(cx + 30, y0 + 20); x.moveTo(cx, y0 + 22); x.lineTo(cx + 30, y0 + 36); } else if (f === 1) { x.moveTo(cx, y0 + 4); x.lineTo(cx + 28, y0 + 24); x.lineTo(cx, y0 + 44); }
      else if (f === 2) { x.moveTo(cx - 28, y0 + 8); x.lineTo(cx + 28, y0 + 40); x.moveTo(cx + 28, y0 + 8); x.lineTo(cx - 28, y0 + 40); } else if (f === 3) { x.moveTo(cx, y0 + 24); x.lineTo(cx + 28, y0 + 4); x.moveTo(cx, y0 + 24); x.lineTo(cx - 28, y0 + 4); }
      else { x.moveTo(cx, y0 + 4); x.lineTo(cx + 26, y0 + 16); x.lineTo(cx, y0 + 28); } x.stroke(); } }
  else if (kind === 'stars') { x.fillStyle = '#000'; x.fillRect(0, 0, 256, 256); for (let i = 0; i < 90; i++) { const px = r() * 256, py = r() * 256, rr = .8 + r() * r() * 3.6, g = x.createRadialGradient(px, py, 0, px, py, rr * 2.4); g.addColorStop(0, '#fff'); g.addColorStop(.4, 'rgba(255,255,255,.7)'); g.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = g; x.beginPath(); x.arc(px, py, rr * 2.4, 0, 7); x.fill(); } }
  else if (kind === 'filigree') { x.lineWidth = 6; for (let k = 0; k < 2; k++) { const y = k * 128 + 64; for (const sd of [-1, 1]) { x.beginPath(); for (let i = 0; i <= 40; i++) { const a = i / 40 * Math.PI * 3, rr = 8 + i * 1.3; const px = 128 + sd * (20 + Math.cos(a) * rr * .8), py = y + Math.sin(a) * rr * .8; i ? x.lineTo(px, py) : x.moveTo(px, py); } x.stroke(); } x.beginPath(); x.moveTo(128, y - 60); x.lineTo(128, y + 60); x.stroke(); } }
  else if (kind === 'veins') { x.lineWidth = 5; x.beginPath(); x.moveTo(128, 250); x.lineTo(128, 6); for (let k = 1; k < 7; k++) { const y = 250 - k * 34; x.moveTo(128, y); x.quadraticCurveTo(160, y - 14, 200, y - 34); x.moveTo(128, y); x.quadraticCurveTo(96, y - 14, 56, y - 34); } x.stroke(); }
  else if (kind === 'cracks') { x.lineWidth = 7; for (let k = 0; k < 14; k++) { let px = r() * 256, py = r() * 256; x.beginPath(); x.moveTo(px, py); for (let j = 0; j < 5; j++) { px += (r() - .5) * 60; py += (r() - .5) * 60; x.lineTo(px, py); } x.stroke(); } }
  const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 8; return PAT[kind] = t;
}
function texAt(kind, rep, rot = 0) { const t = patTex(kind).clone(); t.repeat.set(rep[0], rep[1]); t.offset.set(.5, 0); t.rotation = rot; t.needsUpdate = true; return t; }

// ── materials ──
const METAL = { iron: [.24, .24, .25, .45], steel: [.6, .62, .65, .36], dark: [.26, .26, .28, .42], bronze: [.62, .42, .2, .32], gold: [.9, .66, .27, .24], silver: [.84, .85, .88, .2],
  ice: [.7, .82, .92, .16], star: [.05, .055, .075, .22], blued: [.2, .23, .34, .28] };
const PLAIN = { ash: [.66, .54, .38, .7], oak: [.36, .25, .15, .7], yew: [.62, .36, .18, .5], yewSap: [.86, .74, .52, .55], olive: [.56, .44, .28, .6], horn: [.16, .13, .1, .35], hornPale: [.82, .76, .62, .4],
  leather: [.28, .17, .1, .75], leatherDark: [.1, .07, .06, .7], wool: [.34, .3, .26, .95], fur: [.36, .3, .24, 1], bone: [.86, .8, .66, .6], cord: [.62, .52, .36, .95], rope: [.6, .5, .34, .95],
  string: [.88, .84, .74, .8], feather: [.04, .04, .05, .55], ivy: [.12, .26, .1, .7], silkRed: [.62, .1, .1, .6], silkBlue: [.12, .32, .62, .6], pearl: [.9, .9, .92, .15], coalDead: [.07, .05, .05, .9] };
// each effect's light: its colour and full emissive strength, and the metal it is inlaid in when it is dark
export const FX = { dawn: [[1, .86, .52], 2.6, 'gold'], storm: [[.62, .82, 1], 3.2, 'silver'], leaf: [[.46, 1, .42], .8, 'ivy'], ember: [[1, .42, .1], 4.5, 'coalDead'], moss: [[.62, 1, .55], 1.6, 'bronze'],
  rune: [[1, .5, .16], 3.4, 'iron'], frost: [[.6, .86, 1], 1.4, 'ice'], sea: [[.3, 1, .78], 2.2, 'iron'], aurora: [[.34, 1, .6], 2.6, 'iron'], aurora2: [[.6, .42, 1], 2.6, 'iron'],
  sun: [[1, .8, .38], 2.8, 'gold'], star: [[.72, .82, 1], 4.0, 'star'], sunrim: [[1, .74, .32], 2.4, 'gold'], tide: [[.36, .72, 1], 2.4, 'pearl'], wind: [[.86, .94, 1], 1.4, 'steel'] };
const MAT = {};
function M(key, k = 1) {
  const id = key + '@' + k; if (MAT[id]) return MAT[id];
  const [kind, pat, rx, ry, rot] = key.split(':'); let m;
  if (METAL[kind]) m = new THREE.MeshStandardMaterial({ color: S(...METAL[kind]), roughness: METAL[kind][3], metalness: kind === 'dark' || kind === 'iron' ? .7 : .92 });
  else if (PLAIN[kind]) m = new THREE.MeshStandardMaterial({ color: S(...PLAIN[kind]), roughness: PLAIN[kind][3], metalness: 0, side: /silk|feather|ivy/.test(kind) ? THREE.DoubleSide : THREE.FrontSide,
    normalMap: /ash|oak|yew|olive/.test(kind) ? TEX.beam.normalMap : null, normalScale: new THREE.Vector2(.5, .5) });
  else if (kind === 'icecore') m = new THREE.MeshStandardMaterial({ color: S(.72, .88, 1), emissive: S(.5, .8, 1), emissiveIntensity: .6 * k + .05, roughness: .05, metalness: .1, transparent: true, opacity: .55, depthWrite: false });
  else if (kind === 'starblade') m = new THREE.MeshStandardMaterial({ color: S(...METAL.star), roughness: .22, metalness: .9, emissive: S(...FX.star[0]), emissiveIntensity: FX.star[1] * k, emissiveMap: texAt('stars', [14, 4]) });
  else if (kind.startsWith('fx-')) { const f = FX[kind.slice(3)], base = METAL[f[2]] || PLAIN[f[2]];
    m = new THREE.MeshStandardMaterial({ color: k ? S(...f[0]).lerp(S(...base), .5) : S(...base), roughness: base[3], metalness: METAL[f[2]] ? .9 : 0, emissive: S(...f[0]), emissiveIntensity: f[1] * k, side: THREE.DoubleSide });
    if (pat) { m.alphaMap = texAt(pat, [+rx, +ry], +(rot || 0)); m.alphaTest = .45; } }
  else throw new Error('no material ' + key);
  m.name = id; return MAT[id] = m;
}

// ── shapes ──
const lathe = (prof, seg = 14) => new THREE.LatheGeometry(prof.map(([r, y]) => new THREE.Vector2(Math.max(r, 1e-4), y)), seg);
const ball = (r, w = 16, h = 10) => new THREE.SphereGeometry(r, w, h);
function taper(pts, r0, r1, seg = 24, rs = 7) { const c = new THREE.CatmullRomCurve3(pts.map(p => V(...p))), g = new THREE.TubeGeometry(c, seg, 1, rs, false), P = g.attributes.position, v = V();
  for (let i = 0; i <= seg; i++) { const t = i / seg, p = c.getPointAt(t), r = r0 + (r1 - r0) * t; for (let j = 0; j <= rs; j++) { const k = i * (rs + 1) + j; v.fromBufferAttribute(P, k).sub(p).multiplyScalar(r).add(p); P.setXYZ(k, v.x, v.y, v.z); } }
  g.computeVertexNormals(); return g; }
const helix = (R, y0, y1, turns, r = .0022, ph = 0) => taper(Array.from({ length: turns * 10 + 1 }, (_, i) => { const t = i / (turns * 10), a = ph + t * turns * Math.PI * 2; return [Math.cos(a) * R, y0 + (y1 - y0) * t, Math.sin(a) * R]; }), r, r, turns * 14, 5);
const crystal = (r, h, w = .35, sides = 6) => lathe([[0, 0], [r, h * w], [r * .92, h * .75], [0, h]], sides);
// a flat piece from an outline in x-y (metres), `th` thick in z; `edge` bevels it to an edge all round (a blade), else square
function slab(pts, th, edge = 0, holes = []) { const sh = new THREE.Shape(pts.map(p => new THREE.Vector2(...p))); for (const h of holes) sh.holes.push(new THREE.Path(h.map(p => new THREE.Vector2(...p))));
  const d = edge > 0 ? th * .12 : th, g = new THREE.ExtrudeGeometry(sh, { depth: d, bevelEnabled: edge > 0, bevelThickness: th * .44, bevelSize: edge, bevelSegments: 1, curveSegments: 10 }); g.translate(0, 0, -d / 2); return g; }
// a sword's blade: the outline by its half-width up the length (y from y0 to y1), `curve` bends it toward +x; lens-section by `edge`
function bladeOutline(y0, y1, hw, curve = () => 0, n = 28) { const L = [], R = [];
  for (let i = 0; i <= n; i++) { const t = i / n, y = y0 + (y1 - y0) * t, w = hw(t), c = curve(t); L.push([c - w, y]); R.push([c + w, y]); } return [...R, ...L.reverse()]; }
// a blade in diamond section: at each of n + 1 stations up y the edge, the ridge on each face and the other edge; th is its thickness
// at the ridge, thinning with the width toward the point (an ExtrudeGeometry bevel inset to a point gave NaN normals at the tip)
function blade(y0, y1, hw, th, curve = () => 0, n = 28) { const P = [], I = [];
  for (let i = 0; i <= n; i++) { const t = i / n, y = y0 + (y1 - y0) * t, w = Math.max(0, hw(t)), c = curve(t), h = th / 2 * Math.min(1, w / (hw(0) * .5 || 1));
    P.push(c + w, y, 0, c, y, h, c - w, y, 0, c, y, -h); }
  for (let i = 0; i < n; i++) for (let j = 0; j < 4; j++) { const a = i * 4 + j, b = i * 4 + (j + 1) % 4, c2 = a + 4, d = b + 4; I.push(a, b, d, a, d, c2); }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setIndex(I); const ng = g.toNonIndexed(); ng.computeVertexNormals();
  const uv = [], Q = ng.attributes.position; for (let i = 0; i < Q.count; i++) uv.push(Q.getX(i), Q.getY(i)); ng.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); return ng; }
function kit() {
  const B = new Map();
  const put = (geo, key, m = null) => { let g = geo.index ? geo.toNonIndexed() : geo.clone(); geo.dispose?.(); if (m) g.applyMatrix4(m); if (!g.attributes.normal) g.computeVertexNormals(); { const N = g.attributes.normal.array; for (let i = 0; i < N.length; i += 3) if (!(Number.isFinite(N[i]) && Number.isFinite(N[i + 1]) && Number.isFinite(N[i + 2])) || N[i] * N[i] + N[i + 1] * N[i + 1] + N[i + 2] * N[i + 2] < 1e-8) { N[i] = 0; N[i + 1] = 0; N[i + 2] = 1; } }
    if (!g.attributes.uv) g.setAttribute('uv', new THREE.Float32BufferAttribute(new Float32Array(g.attributes.position.count * 2), 2));
    for (const k of Object.keys(g.attributes)) if (!['position', 'normal', 'uv'].includes(k)) g.deleteAttribute(k);
    if (!B.has(key)) B.set(key, []); B.get(key).push(g); };
  return { put, B };
}
function grip(K, key, y0, y1, r, thong, m = null) { K.put(lathe([[r, y0 - .004], [r + .0012, y0], [r + .0012, y1], [r, y1 + .004]], 14), key, m); if (thong) K.put(helix(r + .0016, y0, y1, Math.round((y1 - y0) / .04), .0012), thong, m); }
const band = (K, key, y, r, w = .008) => K.put(lathe([[r, y - w / 2], [r + .0028, y - w / 4], [r + .0028, y + w / 4], [r, y + w / 2]], 16), key);
const POLE = (len, top, r0 = .0125, rt = .014) => lathe([[r0 * .9, 0], [r0, .03], [.013, .6], [.013, 1.3], [rt, top], [rt * .9, len]], 12);

// ── the effects that move: motes, sparks, mist, drops, arcs and silk ──
let _dot = null;
function dotTex() { if (_dot) return _dot; const c = document.createElement('canvas'); c.width = c.height = 64; const x = c.getContext('2d'), g = x.createRadialGradient(32, 32, 0, 32, 32, 30);
  g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(.25, 'rgba(255,255,255,.75)'); g.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = g; x.fillRect(0, 0, 64, 64); return _dot = new THREE.CanvasTexture(c); }
const hash = n => { const s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };
// kind: 'rise' (motes up off a span), 'spark' (fast up and out, short-lived), 'mist' (slow, large, spreading), 'fall' (drops), 'orbit' (round a centre)
function motes(o) { const n = Math.round(o.n * o.k); if (!n) return null; const P = new Float32Array(n * 3), g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(P, 3));
  const m = new THREE.PointsMaterial({ map: dotTex(), color: S(...o.col), size: o.size, transparent: true, opacity: o.op ?? .9, depthWrite: false, blending: THREE.AdditiveBlending, sizeAttenuation: true });
  const pts = new THREE.Points(g, m); pts.frustumCulled = false; pts.name = 'motes';
  pts.userData.tick = t => { for (let i = 0; i < n; i++) { const h1 = hash(i + 1), h2 = hash(i + 7.3), h3 = hash(i + 13.9), life = o.life * (.6 + .8 * h3), ph = ((t + h1 * life) / life) % 1, at = o.at ? o.at(h2, h1) : [0, 0, 0];
      let x = at[0], y = at[1], z = at[2];
      if (o.kind === 'rise') { y += ph * o.up; x += Math.sin(ph * 6 + i) * .015; z += Math.cos(ph * 5 + i) * .015; }
      else if (o.kind === 'spark') { y += ph * o.up; x += (h3 - .5) * ph * .12; z += (h1 - .5) * ph * .12; }
      else if (o.kind === 'mist') { x += (h3 - .5) * ph * .25; y += ph * o.up; z += (h1 - .5) * ph * .25; }
      else if (o.kind === 'fall') { y -= ph * ph * o.up; }
      else if (o.kind === 'orbit') { const a = h1 * 6.283 + t * (.9 + h3 * .8), R = o.R * (.75 + .5 * h2); x = o.c[0] + Math.cos(a) * R; y = o.c[1] + Math.sin(t * 1.3 + i) * .05 + (h3 - .5) * .1; z = o.c[2] + Math.sin(a) * R * .55; }
      P[i * 3] = x; P[i * 3 + 1] = y; P[i * 3 + 2] = z; }
    g.attributes.position.needsUpdate = true; m.opacity = (o.op ?? .9) * (o.kind === 'orbit' ? 1 : .85); };
  return pts; }
// arcs of lightning between points on an edge, re-struck twelve times a second
function arcs(o) { const grp = new THREE.Group(); grp.name = 'arcs'; const m = new THREE.MeshBasicMaterial({ color: S(.8, .9, 1), transparent: true, opacity: .95, blending: THREE.AdditiveBlending, depthWrite: false });
  grp.userData.tick = t => { for (const c of [...grp.children]) { c.geometry.dispose(); grp.remove(c); } const f = Math.floor(t * 12);
    for (let a = 0; a < o.n; a++) { if (hash(f * 3.1 + a) < .25) continue; const i0 = Math.floor(hash(f + a * 9.7) * (o.edge.length - 3)), i1 = Math.min(o.edge.length - 1, i0 + 2 + Math.floor(hash(f * 1.7 + a) * 4)), pts = [];
      for (let i = i0; i <= i1; i++) { const e = o.edge[i], j = i === i0 || i === i1 ? 0 : 1; pts.push([e[0] + o.out * (.3 + hash(f * 5 + i + a) * .8) * j, e[1] + (hash(f * 7 + i) - .5) * .02 * j, (hash(f * 11 + i + a) - .5) * .03 * j]); }
      if (pts.length >= 2) grp.add(new THREE.Mesh(taper(pts, .0018, .0008, pts.length * 3, 3), m)); } };
  return grp; }
// silk ribbons hung from a point, falling along +y of the piece, moving as in a wind of their own
function ribbons(o) { const grp = new THREE.Group(); grp.name = 'silk';
  o.cols.forEach((col, r) => { const g = new THREE.PlaneGeometry(.024, o.len, 1, 24); g.translate(0, -o.len / 2, 0); g.rotateZ(Math.PI); const base = g.attributes.position.array.slice();
    const mesh = new THREE.Mesh(g, M(col)); mesh.position.set(...o.at); mesh.castShadow = true; grp.add(mesh);
    mesh.userData.tick = t => { const P = g.attributes.position; for (let i = 0; i < P.count; i++) { const y = base[i * 3 + 1], s = y / o.len, ph = t * 2.2 + r * 1.7;
        P.setXYZ(i, base[i * 3] + Math.sin(s * 5 - ph) * .05 * s * o.k + r * .012, y, Math.cos(s * 4 - ph * .8) * .07 * s * o.k + (1 - o.k) * s * .01); } P.needsUpdate = true; g.computeVertexNormals(); }; });
  return grp; }

// ── the fifteen ──
const BUILD = {
  // ── the Gatelands ──
  kingsword(K, A) { // 1.17 m: pommel wheel, a 0.22 m grip, the guard 0.25 m with knot ends, a 0.9 m blade with a fuller of knotwork
    K.put(new THREE.TorusGeometry(.028, .007, 8, 26), 'bronze', T(0, .035, 0)); K.put(new THREE.CylinderGeometry(.021, .021, .01, 20).rotateX(Math.PI / 2), 'fx-dawn', T(0, .035, 0));
    grip(K, 'leatherDark', .07, .25, .0135, 'gold'); K.put(lathe([[.012, .062], [.017, .066], [.017, .072], [.012, .074]], 12), 'bronze');
    K.put(taper([[-.125, .245, 0], [-.07, .262, 0], [0, .266, 0], [.07, .262, 0], [.125, .245, 0]], .008, .008, 20, 6), 'bronze');
    for (const s of [-1, 1]) K.put(new THREE.TorusGeometry(.012, .004, 6, 16), 'bronze', T(s * .133, .238, 0, 0, 0, 0));
    K.put(slab([[-.025, .26], [.025, .26], [.03, .28], [-.03, .28]], .016), 'bronze');
    K.put(blade(.28, 1.17, t => .025 * (1 - t * .45) * (t > .9 ? (1 - t) / .1 : 1) + .0005, .008), 'steel');
    K.put(slab(bladeOutline(.3, .98, t => .0065 * (t > .9 ? (1 - t) / .1 : 1) + .0004, undefined, 12), .0086), 'fx-dawn:knot:120:12');
    A.push(motes({ k: A.k, n: 22, col: FX.dawn[0], size: .012, kind: 'rise', up: .18, life: 3.2, at: (a, b) => [(b - .5) * .03, .3 + a * .68, 0] })); return { len: 1.17, kind: 'sword', hilt: .15 };
  },
  stormaxe(K, A) { // 0.86 m haft, a bearded head 0.19 m deep, knot inlay on the cheek, arcs on the edge
    K.put(lathe([[.012, 0], [.0145, .02], [.014, .5], [.0155, .76], [.016, .86]], 12), 'ash'); grip(K, 'leather', .03, .28, .0145, 'leatherDark'); K.put(lathe([[.009, -.012], [.016, 0], [.016, .02], [.0145, .024]], 12), 'iron');
    const head = [[-.022, .79], [-.022, .86], [.03, .862], [.09, .872], [.15, .895], [.162, .885], [.17, .84], [.168, .79], [.155, .745], [.14, .71], [.128, .715], [.09, .75], [.05, .78], [.022, .79]];
    K.put(slab(head, .026, .005, [[[-.012, .8], [.012, .8], [.012, .85], [-.012, .85]]]), 'iron');
    K.put(slab([[.135, .875], [.146, .84], [.144, .79], [.131, .752], [.12, .758], [.132, .79], [.134, .84], [.124, .872]], .0272), 'fx-storm');
    K.put(slab([[.03, .8], [.085, .81], [.085, .85], [.03, .852]], .0272), 'fx-storm:knot:36:24');
    for (const s of [-1, 1]) K.put(slab([[-.008, .6], [.008, .6], [.006, .72], [-.006, .72]], .002), 'iron', T(0, 0, s * .0155));
    const edge = []; for (let i = 0; i <= 12; i++) { const t = i / 12; edge.push([.155 + Math.sin(t * Math.PI) * .018, .73 + t * .155, 0]); }
    if (A.k >= 1) A.push(arcs({ edge, n: 4, out: .03 })); A.push(motes({ k: A.k, n: 10, col: FX.storm[0], size: .008, kind: 'spark', up: .1, life: .6, at: (a, b) => [.16 + b * .015, .74 + a * .14, 0] }));
    return { len: .88, kind: 'axe', hilt: .15 };
  },
  wardspear(K, A) { // 2.2 m: ash, a leaf blade 0.32 m, ivy in leaf up the top metre
    K.put(POLE(1.84, 1.6), 'ash'); K.put(lathe([[.0125, 1.82], [.016, 1.84], [.016, 1.9], [.009, 1.94]], 12), 'bronze');
    K.put(blade(1.9, 2.2, t => .038 * Math.sin(Math.min(1, t * 1.15) * Math.PI) ** .8 + .002, .01), 'steel'); K.put(lathe([[.0055, 1.92], [.006, 2.18], [0, 2.2]], 6), 'steel');
    const vine = []; for (let i = 0; i <= 60; i++) { const t = i / 60, a = t * Math.PI * 7; vine.push([Math.cos(a) * .0155, 1.0 + t * .84, Math.sin(a) * .0155]); } K.put(taper(vine, .0028, .0016, 120, 4), 'ivy');
    const leaf = () => { const g = new THREE.ShapeGeometry(new THREE.Shape([V(0, 0), V(.016, .012), V(.02, .03), V(0, .05), V(-.02, .03), V(-.016, .012)].map(v => new THREE.Vector2(v.x, v.y)))); const u = g.attributes.position; const uv = new Float32Array(u.count * 2); for (let i = 0; i < u.count; i++) { uv[i * 2] = u.getX(i) / .05 + .5; uv[i * 2 + 1] = u.getY(i) / .05; } g.setAttribute('uv', new THREE.BufferAttribute(uv, 2)); return g; };
    for (let i = 0; i < 40; i++) { const t = (i + .5) / 40, a = t * Math.PI * 7 + .4; K.put(leaf(), 'fx-leaf', T(Math.cos(a) * .022, 1.0 + t * .84, Math.sin(a) * .022, -.5, -a + Math.PI / 2, (i % 2 ? .7 : -.7), .45 + hash(i) * .3)); }
    A.push(motes({ k: A.k, n: 18, col: FX.leaf[0], size: .011, kind: 'mist', up: .2, life: 4, at: (a, b) => [Math.cos(b * 6.28) * .05, 1.05 + a * .85, Math.sin(b * 6.28) * .05] })); return { len: 2.2, kind: 'pole' };
  },
  embermace(K, A) { // 0.78 m: oak haft, iron bands, seven flanges round a coal 5 cm across
    K.put(lathe([[.013, 0], [.0155, .02], [.015, .55], [.017, .64], [.018, .66]], 12), 'oak'); grip(K, 'leather', .02, .24, .0155, 'iron'); for (const y of [.3, .45, .6]) band(K, 'iron', y, .0158, .01);
    K.put(lathe([[.018, .64], [.03, .655], [.03, .67], [.012, .69], [.012, .75], [.026, .755], [.022, .77], [0, .78]], 14), 'iron');
    K.put(ball(.03, 14, 10), 'coalDead', T(0, .715, 0)); K.put(ball(.0315, 14, 10), 'fx-ember:cracks:10:10', T(0, .715, 0));
    for (let i = 0; i < 7; i++) { const a = i / 7 * Math.PI * 2; K.put(slab([[0, .65], [.05, .67], [.058, .71], [.055, .75], [.036, .77], [0, .775]], .005, .0015), 'iron', T(0, 0, 0, 0, a, 0)); }
    A.push(motes({ k: A.k, n: 26, col: FX.ember[0], size: .009, kind: 'spark', up: .28, life: 1.3, at: (a, b) => [Math.cos(a * 6.28) * .03, .72 + b * .04, Math.sin(a * 6.28) * .03] }));
    return { len: .78, kind: 'mace', hilt: .13 };
  },
  rangerbow(K, A) { // 1.84 m nock to nock, braced: the limbs bowed 0.17 m off the string
    const N = 30, ax = [], back = []; for (let i = 0; i <= N; i++) { const t = i / N, y = t * 1.84, d = Math.sin(t * Math.PI) * .17; ax.push([d, y, 0]); }
    const prof = t => .006 + .011 * Math.sin(t * Math.PI) ** .7;
    for (const [a, b] of [[0, .5], [.5, 1]]) { const pts = ax.filter((_, i) => i / N >= a - 1e-6 && i / N <= b + 1e-6); K.put(taper(pts, a ? .017 : .006, a ? .006 : .017, 30, 8), 'yew'); }
    K.put(taper(ax.slice(1, -1).map(([x, y]) => [x + .006, y, 0]), .0085, .0085, 40, 6), 'yewSap', T(0, 0, 0, 0, 0, 0, [1, 1, .9]));
    grip(K, 'leatherDark', .84, 1.0, .019, 'cord', T(.17, 0, 0)); K.put(lathe([[.0058, 0], [.009, .03], [.0065, .07]], 10), 'horn', T(.0, 0, 0)); K.put(lathe([[.0065, -.07], [.009, -.03], [.0058, 0]], 10), 'horn', T(0, 1.84, 0));
    K.put(taper([[0, .015, 0], [0, 1.825, 0]], .0012, .0012, 2, 4), 'string');
    for (let i = 0; i < 9; i++) { const t = .12 + i / 8 * .76; if (t > .44 && t < .56) continue; const y = t * 1.84, d = Math.sin(t * Math.PI) * .17;
      K.put(new THREE.TorusGeometry(.012, .0022, 4, 14), 'fx-moss', T(d + .012, y, 0, 0, Math.PI / 2, 0, [1, 1.6, 1])); }
    A.push(motes({ k: A.k, n: 8, col: FX.moss[0], size: .008, kind: 'mist', up: .1, life: 4, at: (a) => [Math.sin(a * Math.PI) * .17 + .02, a * 1.84, 0] }));
    return { len: 1.84, kind: 'bow' };
  },
  // ── the Mark ──
  bearaxe(K, A) { // 1.56 m: an ash haft, a head 0.36 m deep and 0.4 tall at its beard, a spike
    K.put(lathe([[.0125, 0], [.015, .04], [.0155, 1.2], [.017, 1.48], [.017, 1.56]], 12), 'ash'); K.put(lathe([[.009, -.02], [.017, 0], [.017, .05], [.0155, .055]], 12), 'iron');
    grip(K, 'wool', .06, .5, .0157, 'leather'); grip(K, 'wool', .95, 1.14, .0157, 'leather');
    for (const s of [-1, 1]) K.put(slab([[-.008, 1.15], [.008, 1.15], [.007, 1.36], [-.007, 1.36]], .002), 'iron', T(0, 0, s * .017));
    const head = [[-.03, 1.43], [-.03, 1.53], [.06, 1.535], [.2, 1.58], [.31, 1.64], [.325, 1.625], [.345, 1.55], [.35, 1.45], [.335, 1.35], [.3, 1.26], [.26, 1.2], [.245, 1.21], [.2, 1.3], [.13, 1.38], [.06, 1.42], [.03, 1.43]];
    K.put(slab(head, .03, .007, [[[-.017, 1.44], [.017, 1.44], [.017, 1.52], [-.017, 1.52]]]), 'dark');
    K.put(slab([[.25, 1.58], [.285, 1.5], [.29, 1.42], [.27, 1.33], [.245, 1.33], [.262, 1.42], [.258, 1.5], [.226, 1.57]], .0312), 'fx-rune:runes:14.93:6');
    K.put(slab([[-.05, 1.43], [-.16, 1.455], [-.05, 1.48]], .02, .006), 'dark');
    K.put(lathe([[.016, 1.56], [.012, 1.6], [0, 1.68]], 8), 'dark');
    A.push(motes({ k: A.k, n: 10, col: FX.rune[0], size: .009, kind: 'rise', up: .12, life: 2, at: (a, b) => [.26 + (b - .5) * .03, 1.34 + a * .22, (b - .5) * .04] })); return { len: 1.68, kind: 'pole' };
  },
  glacier(K, A) { // 1.66 m: a wheel-less pommel cut as a crystal, a 0.36 m grip, a guard 0.34 m with rime spikes, a 1.2 m blade 7 cm wide
    K.put(crystal(.026, .07, .4, 6), 'icecore', T(0, -.02, 0)); grip(K, 'leatherDark', .05, .4, .015, 'silver'); K.put(lathe([[.013, .04], [.022, .05], [.02, .06], [.014, .062]], 12), 'blued');
    K.put(slab([[-.17, .4], [-.04, .42], [.04, .42], [.17, .4], [.16, .43], [.05, .45], [-.05, .45], [-.16, .43]], .022, .004), 'blued');
    for (let i = 0; i < 7; i++) { const s = i % 2 ? 1 : -1, x = s * (.03 + (i >> 1) * .035); K.put(crystal(.008 + hash(i) * .006, .05 + hash(i + 3) * .06, .4, 5), 'icecore', T(x, .44, (hash(i + 9) - .5) * .02, (hash(i) - .5) * .5, 0, -s * (.25 + hash(i + 5) * .4))); }
    K.put(blade(.45, 1.66, t => .036 * (1 - t * .3) * (t > .88 ? (1 - t) / .12 : 1) + .0006, .009), 'ice');
    K.put(slab(bladeOutline(.47, 1.4, t => .009 * (1 - t * .3) + .0004, undefined, 14), .0094), 'fx-frost:runes:60:6');
    A.push(motes({ k: A.k, n: 30, col: [.75, .9, 1], size: .07, op: .22, kind: 'mist', up: -.06, life: 5, at: (a, b) => [(b - .5) * .05, .5 + a * 1.1, 0] }));
    A.push(motes({ k: A.k, n: 14, col: FX.frost[0], size: .008, kind: 'fall', up: .2, life: 2.5, at: (a, b) => [(b - .5) * .07, .5 + a * 1.1, 0] })); return { len: 1.66, kind: 'sword', hilt: .3 };
  },
  harpoon(K, A) { // 2.4 m: a pine shaft 1.85 m, a 0.48 m iron shank, a toggling head 0.12 m with two barbs, a coil of line
    K.put(POLE(1.88, 1.7, .0135, .016), 'oak'); for (const y of [1.6, 1.74, 1.86]) band(K, 'iron', y, .0158, .012);
    K.put(lathe([[.016, 1.84], [.011, 1.9], [.0065, 1.95], [.0065, 2.28], [.008, 2.3]], 10), 'iron');
    K.put(slab([[0, 2.29], [.012, 2.3], [.016, 2.34], [.03, 2.31], [.03, 2.33], [.012, 2.4], [0, 2.43], [-.012, 2.4], [-.03, 2.33], [-.03, 2.31], [-.016, 2.34], [-.012, 2.3]], .012, .004), 'iron');
    K.put(slab([[-.007, 2.32], [.007, 2.32], [.004, 2.39], [-.004, 2.39]], .0128), 'fx-sea');
    for (const s of [-1, 1]) K.put(slab([[0, 2.31], [s * .03, 2.31], [s * .03, 2.33]], .0128), 'fx-sea');
    for (let i = 0; i < 6; i++) K.put(new THREE.TorusGeometry(.04 + i * .0035, .0045, 5, 22).rotateX(Math.PI / 2), 'rope', T(.0, 1.3 + i * .011, 0, .25, 0, .1));
    K.put(taper([[.044, 1.36, 0], [.03, 1.5, .01], [.018, 1.7, 0], [.012, 1.9, 0], [.008, 2.1, 0], [.007, 2.29, 0]], .003, .002, 30, 4), 'rope');
    A.push(motes({ k: A.k, n: 14, col: FX.sea[0], size: .009, kind: 'fall', up: .45, life: 1.6, at: (a, b) => [(b - .5) * .05, 2.3 + a * .08, 0] })); return { len: 2.43, kind: 'pole' };
  },
  flail(K, A) { // a 0.62 m haft, five links of 5 cm hanging off its cap, a ball 9 cm across with eight spikes
    K.put(lathe([[.014, 0], [.017, .02], [.0165, .56], [.019, .6], [.019, .62]], 12), 'oak'); grip(K, 'leather', .02, .28, .017, 'iron'); for (const y of [.36, .48]) band(K, 'iron', y, .0168, .012);
    K.put(lathe([[.0195, .59], [.022, .6], [.02, .64], [.008, .65]], 12), 'iron'); K.put(new THREE.TorusGeometry(.012, .0035, 6, 14), 'iron', T(0, .66, 0));
    const P = [[0, .66], [.04, .655], [.075, .62], [.098, .57], [.108, .52], [.11, .47]]; for (let i = 1; i < P.length; i++) { const [x0, y0] = P[i - 1], [x1, y1] = P[i], a = Math.atan2(x1 - x0, y1 - y0);
      K.put(new THREE.TorusGeometry(.022, .0042, 6, 14).scale(.55, 1, 1), 'iron', T((x0 + x1) / 2, (y0 + y1) / 2, 0, 0, i % 2 ? Math.PI / 2 : 0, -a)); }
    const c = [.11, .405, 0]; K.put(ball(.045, 18, 12), 'iron', T(...c)); for (let i = 0; i < 8; i++) { const ph = i * 2.4, th = Math.acos(1 - 2 * (i + .5) / 8), d = V(Math.sin(th) * Math.cos(ph), Math.cos(th), Math.sin(th) * Math.sin(ph));
      K.put(lathe([[.012, 0], [0, .035]], 6), 'iron', new THREE.Matrix4().compose(V(...c).addScaledVector(d, .04), new THREE.Quaternion().setFromUnitVectors(V(0, 1, 0), d), V(1, 1, 1))); }
    for (let i = 0; i < 3; i++) K.put(new THREE.TorusGeometry(.0458, .0026, 4, 36), 'fx-aurora', T(...c, i * Math.PI / 3, 0, Math.PI / 2));
    A.push(motes({ k: A.k, n: 12, col: FX.aurora[0], size: .01, kind: 'orbit', R: .07, c, life: 3 })); return { len: .66, kind: 'flail', hilt: .14 };
  },
  ritspear(K, A) { // 2.0 m: ash cut with rune bands, a long head 0.42 m, a fur collar, bone pendants, three raven feathers
    K.put(POLE(1.58, 1.45), 'ash'); for (const y of [.25, .45, 1.42]) K.put(lathe([[.0142, y - .015], [.0144, y + .015]], 14), 'fx-aurora2:runes:6:2');
    K.put(lathe([[.014, 1.56], [.017, 1.58], [.016, 1.66], [.008, 1.7]], 12), 'iron');
    K.put(blade(1.66, 2.0, t => .022 * (t < .2 ? .6 + t * 2 : 1 - (t - .2) * .9) + .0015, .01), 'dark'); K.put(lathe([[.005, 1.68], [.005, 1.98], [0, 2.0]], 6), 'dark');
    K.put(slab(bladeOutline(1.72, 1.9, t => .005 + .0003, undefined, 10), .0104), 'fx-aurora2:runes:60:8');
    const fur = lathe([[.016, 1.47], [.034, 1.49], [.04, 1.52], [.036, 1.55], [.016, 1.565]], 16); { const p = fur.attributes.position, v = V(); for (let i = 0; i < p.count; i++) { v.fromBufferAttribute(p, i); const r = Math.hypot(v.x, v.z), k = 1 + .14 * Math.sin(Math.atan2(v.z, v.x) * 13) * (r > .03 ? 1 : 0); p.setXYZ(i, v.x * k, v.y, v.z * k); } }
    K.put(fur, 'fur');
    for (let i = 0; i < 4; i++) { const a = i / 4 * 6.28 + .3, x = Math.cos(a) * .03, z = Math.sin(a) * .03, L = .08 + hash(i) * .05; K.put(taper([[x, 1.5, z], [x * 1.2, 1.5 - L * .6, z * 1.2], [x * 1.25, 1.5 - L, z * 1.25]], .001, .001, 6, 3), 'cord');
      K.put(crystal(.006, .03, .5, 5), 'bone', T(x * 1.25, 1.5 - L - .03, z * 1.25)); }
    for (let i = 0; i < 3; i++) { const a = i * 2.1, g = new THREE.PlaneGeometry(.026, .16, 1, 4); g.translate(0, -.08, 0); const p = g.attributes.position; for (let j = 0; j < p.count; j++) p.setX(j, p.getX(j) * (1 - Math.abs(p.getY(j) + .08) / .1)); K.put(g, 'feather', T(Math.cos(a) * .036, 1.5, Math.sin(a) * .036, .1, -a, .08)); }
    A.push(motes({ k: A.k, n: 12, col: FX.aurora2[0], size: .01, kind: 'mist', up: .15, life: 4, at: (a, b) => [(b - .5) * .03, 1.72 + a * .2, 0] })); return { len: 2.0, kind: 'pole' };
  },
  // ── Aurenne ──
  rapier(K, A) { // 1.12 m: a pear pommel, a 0.11 m grip in gold wire, the swept hilt, a 0.94 m blade 2.2 cm at the ricasso
    K.put(lathe([[0, 0], [.014, .008], [.018, .025], [.013, .042], [.007, .048]], 16), 'gold'); grip(K, 'leatherDark', .05, .16, .011, 'gold');
    K.put(taper([[-.12, .17, 0], [-.05, .175, 0], [0, .178, 0], [.05, .175, 0], [.12, .17, 0]], .0045, .0045, 16, 6), 'gold');
    for (const s of [-1, 1]) K.put(ball(.008, 10, 8), 'gold', T(s * .124, .17, 0));
    K.put(taper([[.0, .17, .002], [.04, .14, .01], [.055, .08, .012], [.035, .03, .006], [.01, .05, 0]], .0035, .003, 30, 5), 'gold');
    for (const s of [-1, 1]) K.put(taper([[0, .18, 0], [s * .03, .2, .012], [s * .045, .24, .006], [s * .02, .27, 0], [0, .275, 0]], .003, .0025, 24, 5), 'gold');
    K.put(new THREE.TorusGeometry(.033, .003, 5, 30), 'gold', T(0, .19, 0, Math.PI / 2, 0, 0)); K.put(new THREE.CylinderGeometry(.033, .033, .002, 30), 'gold', T(0, .19, 0));
    K.put(blade(.18, 1.12, t => (t < .1 ? .011 : .011 * (1 - (t - .1) * .8)) * (t > .94 ? (1 - t) / .06 : 1) + .0004, .0075), 'steel');
    K.put(slab(bladeOutline(.2, .3, t => .006, undefined, 6), .0079), 'fx-sun:filigree:60:10');
    A.push(motes({ k: A.k, n: 4, col: FX.sun[0], size: .03, kind: 'rise', up: .01, life: 1.2, at: () => [0, 1.115, 0] }));
    A.push(motes({ k: A.k, n: 8, col: FX.sun[0], size: .008, kind: 'rise', up: .08, life: 2.2, at: (a, b) => [(b - .5) * .02, .2 + a * .1, 0] })); return { len: 1.12, kind: 'sword', hilt: .12 };
  },
  nimcha(K, A) { // 0.96 m: a hooked pommel, a 0.12 m grip, down-turned quillons and a knuckle guard, a curved blade of star metal
    K.put(taper([[0, .0, 0], [-.012, -.012, 0], [-.03, -.008, 0]], .009, .006, 10, 6), 'bronze'); grip(K, 'horn', .01, .13, .012, null); for (const y of [.02, .07, .12]) band(K, 'gold', y, .012, .005);
    for (const s of [-1, 1]) K.put(taper([[0, .14, 0], [s * .05, .135, 0], [s * .075, .11, 0], [s * .08, .09, 0]], .005, .0035, 14, 5), 'bronze');
    K.put(taper([[.075, .1, 0], [.06, .05, 0], [.035, .012, 0], [.006, -.004, 0]], .004, .0035, 16, 5), 'bronze'); K.put(slab([[-.02, .135], [.02, .135], [.024, .155], [-.024, .155]], .018), 'bronze');
    K.put(blade(.15, .96, t => .018 * (1 + t * .35) * (t > .86 ? Math.max(0, (1 - t) / .14) ** .7 : 1) + .0005, .008, t => -.11 * t * t), 'starblade');
    A.push(motes({ k: A.k, n: 14, col: FX.star[0], size: .007, kind: 'rise', up: .05, life: 1.8, at: (a, b) => [-.11 * (.1 + a * .85) ** 2 + (b - .5) * .03, .17 + a * .75, 0] })); return { len: .96, kind: 'sword', hilt: .13 };
  },
  sunbow(K, A) { // 1.26 m braced: a short horn-and-sinew recurve, the ears turned forward, gilt bands, the grip in red leather
    const N = 40, ax = []; for (let i = 0; i <= N; i++) { const t = i / N, u = t * 2 - 1, y = .63 + u * .6, d = .1 * (1 - u * u) + .06 * Math.max(0, (Math.abs(u) - .72) / .28) ** 2; ax.push([d, y, 0]); }
    K.put(taper(ax.slice(0, 21), .006, .015, 30, 8), 'horn'); K.put(taper(ax.slice(20), .015, .006, 30, 8), 'horn');
    K.put(taper(ax.slice(3, -3).map(([x, y]) => [x + .006, y, 0]), .0075, .0075, 40, 6), 'hornPale');
    grip(K, 'silkRed', .57, .69, .017, 'gold', T(.1, 0, 0)); for (const y of [.5, .76, .3, .96]) { const i = Math.round((y - .03) / 1.2 * N), p = ax[Math.min(N, Math.max(0, i))]; K.put(new THREE.TorusGeometry(.012, .0022, 4, 16).rotateX(Math.PI / 2), 'gold', T(p[0], p[1], 0)); }
    for (const e of [ax.slice(0, 7), ax.slice(-7)]) K.put(taper(e.map(([x, y]) => [x + .002, y, 0]), .0064, .0064, 12, 6), 'fx-sunrim', T(0, 0, 0, 0, 0, 0, [1.05, 1, 1.15]));
    K.put(taper([[ax[0][0], ax[0][1] + .01, 0], [ax[N][0], ax[N][1] - .01, 0]], .0011, .0011, 2, 4), 'string');
    A.push(motes({ k: A.k, n: 10, col: FX.sunrim[0], size: .009, kind: 'rise', up: .06, life: 1.6, at: (a, b) => { const p = b < .5 ? ax[Math.floor(a * 6)] : ax[N - Math.floor(a * 6)]; return [p[0], p[1], 0]; } })); return { len: 1.26, kind: 'bow' };
  },
  tideglaive(K, A) { // 1.9 m: olive, a gilt socket, a crescent head 0.3 m tall inlaid with pearl, drops of water circling
    K.put(POLE(1.58, 1.4, .0125, .0135), 'olive'); for (const y of [1.3, 1.36, 1.42, 1.48]) band(K, 'gold', y, .0133, .004); K.put(lathe([[.0135, 1.55], [.019, 1.57], [.017, 1.64], [.01, 1.66]], 14), 'bronze');
    const out = [], inn = []; for (let i = 0; i <= 20; i++) { const a = -1.15 + i / 20 * 2.3; out.push([.015 + Math.cos(a) * .15 - .02, 1.75 + Math.sin(a) * .17]); inn.push([.015 + Math.cos(a) * .1 - .045, 1.75 + Math.sin(a) * .115]); }
    K.put(slab([...out, ...inn.reverse()], .009, .0045), 'steel');
    K.put(slab([[-.012, 1.64], [.012, 1.64], [.016, 1.86], [0, 1.9], [-.016, 1.86]], .008, .003), 'steel');
    const pin = []; for (let i = 0; i <= 14; i++) { const a = -.9 + i / 14 * 1.8; pin.push([.015 + Math.cos(a) * .125 - .032, 1.75 + Math.sin(a) * .142]); } K.put(taper(pin.map(([x, y]) => [x, y, 0]), .006, .006, 28, 6), 'fx-tide', T(0, 0, 0, 0, 0, 0, [1, 1, .9]));
    A.push(motes({ k: A.k, n: 16, col: FX.tide[0], size: .012, kind: 'orbit', R: .16, c: [.04, 1.76, 0], life: 3 })); return { len: 1.9, kind: 'pole' };
  },
  takouba(K, A) { // 1.0 m: a disc pommel 7 cm, a 0.11 m grip, a straight cross 0.14 m, a 0.8 m blade with three fullers, two silk ribbons
    K.put(new THREE.CylinderGeometry(.035, .035, .008, 26).rotateX(Math.PI / 2), 'bronze', T(0, .0, 0)); K.put(lathe([[.006, .0], [.012, .03], [.0115, .04]], 12), 'bronze');
    grip(K, 'leather', .04, .15, .0125, 'bronze'); K.put(slab([[-.07, .155], [.07, .155], [.074, .17], [-.074, .17]], .016, .003), 'bronze'); K.put(slab([[-.02, .17], [.02, .17], [.02, .185], [-.02, .185]], .02), 'bronze');
    K.put(blade(.18, 1.0, t => .021 * (1 - t * .1) * (t > .93 ? (1 - t) / .07 : 1) + .0005, .0065), 'steel');
    for (const x of [-.008, 0, .008]) K.put(slab(bladeOutline(.2, .52, t => .0018, () => x, 6), .0069), 'fx-wind');
    A.push(ribbons({ k: Math.max(A.k, .15), len: .55, at: [0, -.03, .004], cols: ['silkBlue', 'silkRed'] })); return { len: 1.0, kind: 'sword', hilt: .12 };
  },
};
const ISL = {}; for (const [i, ks] of Object.entries(ISLANDS)) for (const k of ks) ISL[k] = i;

export function legendary(key, o = {}) {
  const mode = o.mode || 'rest', k = MODES[mode] ?? 1, K = kit(), A = []; A.k = k;
  const info = BUILD[key](K, A), group = new THREE.Group(); group.name = key; let tris = 0;
  for (const [mk, gs] of K.B) { const g = mergeGeometries(gs, false); const mat = mk.startsWith('fx-') || mk === 'starblade' || mk === 'icecore' ? M(mk, k) : M(mk); const m = new THREE.Mesh(g, mat); m.name = mk; m.castShadow = !/icecore/.test(mk); m.receiveShadow = true; group.add(m); tris += g.attributes.position.count / 3; }
  const moving = A.filter(Boolean); for (const a of moving) group.add(a);
  const tick = t => { for (const a of moving) { if (a.userData.tick) a.userData.tick(t); a.traverse?.(c => c !== a && c.userData.tick && c.userData.tick(t)); } };
  tick(o.t ?? 0);
  const bb = new THREE.Box3(); for (const c of group.children) if (c.isMesh) bb.expandByObject(c); const sz = bb.getSize(V());
  return { group, tick, key, island: ISL[key], name: NAMES[key], mode, tris: Math.round(tris), draws: group.children.length, motes: moving.reduce((a, p) => a + (p.isPoints ? p.geometry.attributes.position.count : 0), 0),
    size: [+sz.x.toFixed(3), +sz.y.toFixed(3), +sz.z.toFixed(3)], ...info };
}
