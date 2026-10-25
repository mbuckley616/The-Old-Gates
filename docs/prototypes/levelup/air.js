// Each island's air (the concept artist, 25 Oct 2026; backlog L12 "Each island's air", OG-140; card F3's terrain shading, groundColor,
// landSky, landAtmosphere and landPost). OG-140 gives each island one identity: the Gatelands misty, ancient, green all year and
// changeable; the Mark wild, crisp and majestic, long winters, snow peaks over fjords and heather; Aurenne warm and open, olive groves,
// sunbaked plains and island chains on a bright sea. In the game today one sky, one fog and one grade cover all three islands, and only
// groundColor's biome tint and the buildings tell you where you stand.
// As seasons.js, hours.js and weather.js do, an island's air is one row of numbers and no new art:
//   the light   the sun's height and colour at a summer mid-afternoon, its strength, the sky's and the ground's fill;
//   the sky     the dome's zenith, middle, horizon and glow (corruption.js's corruptSky), the clouds' count, colours and height;
//   the haze    the fog's colour and density (FogExp2: √3/density is where the land is 95% gone), so how far each island lets you see;
//   the grade   saturation, contrast and a cast, after the bloom (corruption.js's corruptGrade);
//   the land    the vertex colours by height, slope and a noise (landColour, what groundColor would return): the Gatelands' hedged
//               fields, the Mark's heather, scree and snow line, Aurenne's stubble, ochre earth, maquis and limestone;
//   the water   the sea's and the lakes' colour (and its roughness under the sky's reflection);
//   the cover   the island's trees as instanced kits: the Gatelands' broadleaf woods (common.js's treeKit near, blobs far), the Mark's
//               pines (airPines), Aurenne's olive groves and cypresses (airOlives, airCypress).
// AIR_MODES holds the question, how far apart the three should be:
//   A 'one'    one air for the world (the Gatelands' row's light, sky, haze and grade on every island): the land and the buildings alone
//              say where you are, as the game does now;
//   B 'own'    each island its own row, OG-140 as drawn (recommended), blended across the sea in the game by the island you are on;
//   C 'marked' B, and each island's mark always on: mist lying in the Gatelands' hollows (airMist), the Mark's long hard light with blue
//              shadows and twice the sight, Aurenne's heat shimmer and dust over the plain (airShimmer).
// airRow(island, mode) gives the row a frame reads. A metre a unit; the sea at y 0.
import * as THREE from 'three';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { fbm, n2, sstep, mix, puffTex } from './common.js';
import { stream } from './pieces.js';

const r3 = (a, b, c) => [a, b, c];
// sky: zen/mid/hor/glow; elev: the sun's height (radians); az: its bearing [x, z]; sun/sunK; hemi/gnd/hemiK; fog/fogD; cloud: n, lo, hi,
// y0 (the base, metres), op; sat/con/cast/vig: the grade; land: the palette landColour mixes; water: the sea's colour; mark: C's extra
const GATELANDS = { key: 'gatelands', label: 'The Gatelands', people: 'gatelander',
  zen: r3(.18, .32, .56), mid: r3(.44, .58, .78), hor: r3(.82, .86, .87), glow: r3(1, .86, .66),
  elev: .62, az: [-.45, .75], sun: r3(1, .92, .80), sunK: 2.9, hemi: r3(.66, .74, .86), gnd: r3(.34, .36, .26), hemiK: 1.25,
  fog: r3(.80, .84, .85), fogD: .00070,
  cloud: { n: 26, lo: [.56, .60, .70], hi: [1.28, 1.27, 1.24], y0: 300, op: .92 },
  sat: 1.04, con: .98, cast: r3(.99, 1.01, .98), vig: .30,
  land: { grass: r3(.27, .40, .14), grass2: r3(.36, .46, .17), field: r3(.62, .56, .28), hay: r3(.50, .50, .22), heath: r3(.40, .38, .22), rock: r3(.45, .45, .43), soil: r3(.34, .27, .18), sand: r3(.58, .55, .44), snow: null },
  water: r3(.16, .25, .26), waterR: .12,
  mark: { mist: 1 } };
const MARK = { key: 'mark', label: 'The Mark', people: 'markman',
  zen: r3(.04, .13, .44), mid: r3(.18, .36, .70), hor: r3(.66, .76, .90), glow: r3(1, .80, .56),
  elev: .36, az: [-.62, .62], sun: r3(1, .86, .68), sunK: 3.6, hemi: r3(.48, .60, .92), gnd: r3(.22, .23, .25), hemiK: 1.0,
  fog: r3(.66, .75, .88), fogD: .00022,
  cloud: { n: 14, lo: [.50, .56, .70], hi: [1.36, 1.36, 1.36], y0: 1700, op: .9 },
  sat: .90, con: 1.10, cast: r3(.94, .99, 1.07), vig: .32,
  land: { grass: r3(.30, .34, .17), grass2: r3(.38, .38, .20), heather: r3(.40, .24, .32), heath: r3(.36, .30, .22), rock: r3(.13, .13, .15), scree: r3(.30, .30, .31), soil: r3(.24, .20, .16), sand: r3(.40, .38, .34), snow: r3(1.0, 1.02, 1.06), snowLine: 640 },
  water: r3(.05, .10, .14), waterR: .06,
  mark: { sight: 2.5, elev: .26, hemi: r3(.38, .54, 1.0), cast: r3(.92, .98, 1.10), con: 1.16 } };
const AURENNE = { key: 'aurenne', label: 'Aurenne', people: 'aurennais',
  zen: r3(.08, .30, .70), mid: r3(.44, .66, .90), hor: r3(.96, .93, .84), glow: r3(1, .94, .78),
  elev: 1.12, az: [-.40, .80], sun: r3(1, .96, .86), sunK: 4.5, hemi: r3(.72, .80, .94), gnd: r3(.66, .52, .34), hemiK: 1.3,
  fog: r3(.92, .88, .78), fogD: .00040,
  cloud: { n: 5, lo: [.70, .72, .78], hi: [1.34, 1.32, 1.28], y0: 700, op: .8 },
  sat: 1.18, con: .97, cast: r3(1.08, 1.01, .90), vig: .26,
  land: { grass: r3(.62, .54, .30), grass2: r3(.70, .60, .36), field: r3(.78, .66, .40), maquis: r3(.30, .34, .18), soil: r3(.66, .46, .28), rock: r3(.80, .76, .66), sand: r3(.86, .80, .64), snow: null },
  water: r3(.06, .32, .44), waterR: .05,
  mark: { shimmer: 1, fog: r3(.94, .82, .64), fogK: 1.8 } };
export const AIRS = { gatelands: GATELANDS, mark: MARK, aurenne: AURENNE };
export const ISLANDS = ['gatelands', 'mark', 'aurenne'];
export const AIR_MODES = {
  one: { label: 'A — one air for the world', letter: 'A' },
  own: { label: 'B — each island its own air (OG-140)', letter: 'B' },
  marked: { label: 'C — its own air, its mark always on', letter: 'C' } };
const SKYK = ['zen', 'mid', 'hor', 'glow', 'elev', 'sun', 'sunK', 'hemi', 'gnd', 'hemiK', 'fog', 'fogD', 'cloud', 'sat', 'con', 'cast', 'vig'];
export function airRow(island, mode) {
  const own = AIRS[island], row = { ...own, mist: 0, shimmer: 0 };
  if (mode === 'one') for (const k of SKYK) row[k] = GATELANDS[k];
  if (mode === 'marked') { const m = own.mark;
    if (m.mist) row.mist = m.mist;
    if (m.sight) { row.fogD = own.fogD / m.sight; row.elev = m.elev; row.hemi = m.hemi; row.cast = m.cast; row.con = m.con; }
    if (m.shimmer) { row.shimmer = m.shimmer; row.fog = m.fog; row.fogD = own.fogD * m.fogK; row.hor = own.hor.map((v, i) => mix(v, m.fog[i], .5)); } }
  row.sight = Math.round(Math.sqrt(3) / row.fogD); row.mode = mode; return row;
}

// ── the land's shape, one an island, about a viewpoint at the origin looking north (−z); the ground within 40 m is flat at BASE for the houses, and falls away past it; behind the viewpoint a bank rises BANK metres ──
export const BASE = { gatelands: 30, mark: 24, aurenne: 34 }, BANK = { gatelands: 9, mark: 7, aurenne: 16 };
const gauss = (x, z, cx, cz, sx, sz) => Math.exp(-(((x - cx) / sx) ** 2 + ((z - cz) / sz) ** 2) / 2);
const SHAPES = {
  // rolling fields down to a lake 650 m off, a wooded rise on the right, a long range 1.5–3 km out to 300 m
  gatelands(x, z) {
    const roll = 16 * fbm(x * .0035 + 2, z * .0035 - 1, 5), lake = 52 * gauss(x, z, -120, -680, 330, 210), rise = 42 * gauss(x, z, 520, -420, 260, 300);
    const range = sstep(1300, 2700, -z) * (190 + 130 * fbm(x * .0012 + 5, z * .001, 4)) + 70 * sstep(2000, 600, Math.abs(x + 400)) * sstep(800, 1500, -z) * (.5 + fbm(x * .003, z * .003));
    return 30 + roll * sstep(40, 220, Math.hypot(x, z)) - lake + rise + range - 28 * sstep(40, 420, -z);
  },
  // a fjord: a valley floor running north into the sea from 450 m off, walls of 900–1,400 m, a far wall of peaks
  mark(x, z) {
    const c = 160 * Math.sin(z * .0011 + .4), v = Math.abs(x - c), wall = sstep(180, 950, v) ** .8 * (950 + 520 * fbm(x * .0011 + 3, z * .0011, 5));
    const crags = 120 * Math.abs(fbm(x * .004, z * .004, 4)) * sstep(150, 500, v), floor = 24 + 6 * fbm(x * .01, z * .01, 3) - 16 * sstep(40, 300, -z) - 52 * sstep(300, 720, -z);
    const head = sstep(4200, 6000, -z) * (1100 + 400 * fbm(x * .001, 7, 4));
    return floor + wall + crags + head;
  },
  // a hillside 34 m over a bay: the shore 260 m off, a limestone headland on the left, a chain of islands 3–6 km out
  aurenne(x, z) {
    const slope = 34 * (1 - sstep(60, 230, -z)) - 42 * sstep(200, 520, -z) + 30 * sstep(0, 400, z) + 8 * fbm(x * .006, z * .006, 4);
    const head = (140 + 60 * fbm(x * .004, z * .004, 4)) * gauss(x, z, -900, -900, 380, 900) + 60 * gauss(x, z, 700, -300, 380, 260);
    const isles = 170 * gauss(x, z, 900, -3400, 420, 300) + 110 * gauss(x, z, 2100, -4700, 520, 260) + 140 * gauss(x, z, -1600, -5400, 600, 380) + 60 * gauss(x, z, -200, -2600, 160, 120);
    return slope + head + isles * (.8 + .4 * fbm(x * .002, z * .002, 3));
  } };
export function landHeight(island) {
  const f = SHAPES[island], B = BASE[island], K = BANK[island];
  return (x, z) => { const d = Math.hypot(x, z + 12), raw = f(x, z); return mix(B + .4 * fbm(x * .05, z * .05, 2), raw, sstep(36, 80, d)) + K * sstep(14, 42, z) * sstep(120, 60, Math.abs(x)); };
}

// ── the land's colour (what groundColor would return on that island): h the height, ny the normal's up, x/z for the noise ──
const hash2 = (a, b) => { const s = Math.sin(a * 127.1 + b * 311.7) * 43758.5453; return s - Math.floor(s); };
const lerp3 = (a, b, t) => { t = Math.max(0, Math.min(1, t)); return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t]; };
// the Gatelands' fields, 60–90 m a field: k the field's hash (what it grows), edge how near its hedge (0 on it, .5 at its middle)
export function glField(x, z) {
  const fx = x / 78 + .6 * n2(x * .004, z * .004), fz = z / 58 + .6 * n2(z * .004, x * .004), cx = Math.floor(fx), cz = Math.floor(fz);
  return { k: hash2(cx, cz), edge: Math.min(fx - cx, 1 - fx + cx, fz - cz, 1 - fz + cz) };
}
export function landColour(island, L, h, ny, x, z) {
  const n = fbm(x * .02, z * .02, 3), m = fbm(x * .004 + 9, z * .004, 3), steep = sstep(.86, .66, ny);
  let c;
  if (island === 'gatelands') {
    // the fields: a patchwork 60–90 m a field, by a hash of its cell (grass, hay, a golden field, grazed), the hedges dark between them
    const { k, edge } = glField(x, z);
    c = k < .5 ? lerp3(L.grass, L.grass2, n + .5) : k < .72 ? L.hay : k < .86 ? L.field : lerp3(L.grass2, L.heath, .4);
    c = lerp3(c, L.grass, sstep(800, 2400, Math.hypot(x, z)) * .6);
    c = lerp3(c, [.18, .26, .11], sstep(.03, .008, edge) * sstep(2600, 900, Math.hypot(x, z)) * sstep(120, 170, Math.hypot(x, z)));
    c = lerp3(c, L.heath, sstep(120, 260, h) * (.5 + m));
    c = lerp3(c, L.rock, steep * .8);
    c = lerp3(c, L.soil, sstep(3, 0, h) * .7);
  } else if (island === 'mark') {
    c = lerp3(L.grass, L.grass2, n + .5);
    c = lerp3(c, L.heather, sstep(.05, .25, m + .1 * n) * sstep(20, 90, h) * (1 - sstep(380, 520, h)));
    c = lerp3(c, L.heath, sstep(300, 480, h));
    c = lerp3(c, L.scree, sstep(420, 600, h) * (.5 + .5 * n));
    c = lerp3(c, L.rock, Math.max(steep, sstep(520, 700, h) * .7)); c = lerp3(c, [.12, .12, .13], steep * sstep(.1, .4, fbm(x * .012, z * .03, 3)));
    const line = L.snowLine + 140 * m + 60 * n; c = lerp3(c, L.snow, sstep(line - 60, line + 60, h) * sstep(.42, .62, ny));
    c = lerp3(c, L.sand, sstep(4, 0, h) * .8);
  } else {
    // terraces of stubble and ochre earth by a hash of 40 × 25 m plots, maquis in the folds, limestone on the steep and the headland
    const fx = x / 44 + .37 + .5 * n2(x * .006, z * .005 + 3), fz = z / 26 + .5 * n2(z * .006, x * .005 + 5), k = hash2(Math.floor(fx), Math.floor(fz));
    c = k < .4 ? lerp3(L.grass, L.grass2, n + .5) : k < .65 ? L.field : k < .82 ? L.soil : lerp3(L.grass, L.maquis, .5);
    c = lerp3(c, L.maquis, sstep(.1, .3, m) * .8);
    c = lerp3(c, L.rock, Math.max(steep * .9, sstep(90, 160, h) * .5));
    c = lerp3(c, L.sand, sstep(5, 1, h));
  }
  const k = .9 + .2 * n; return [c[0] * k, c[1] * k, c[2] * k];
}

// ── the cover: instanced kits, one draw each, coloured by instance ──
function inst(scene, geo, matl, list, shadow) {
  if (!list.length) return null; const im = new THREE.InstancedMesh(geo, matl, list.length), M = new THREE.Matrix4(), q = new THREE.Quaternion(), s = new THREE.Vector3(), p = new THREE.Vector3(), up = new THREE.Vector3(0, 1, 0), c = new THREE.Color();
  list.forEach(([x, y, z, sc, ry, col], i) => { p.set(x, y, z); q.setFromAxisAngle(up, ry); s.setScalar(sc); M.compose(p, q, s); im.setMatrixAt(i, M); im.setColorAt(i, c.setRGB(...col)); });
  im.castShadow = im.receiveShadow = !!shadow; scene.add(im); return im;
}
const vcol = (g, c) => { const n = g.attributes.position.count, a = new Float32Array(n * 3); for (let i = 0; i < n; i++) a.set(c, i * 3); g.setAttribute('color', new THREE.BufferAttribute(a, 3)); return g; };
const cleanGeo = g => { const o = g.index ? g.toNonIndexed() : g; for (const k of Object.keys(o.attributes)) if (!['position', 'normal', 'color'].includes(k)) o.deleteAttribute(k); return o; };
const COVER_M = () => new THREE.MeshStandardMaterial({ vertexColors: true, roughness: .9, flatShading: false });
// a Markish pine, 14 m: a bare stem and six tiers of cone, darker at the foot; 98 triangles
export function airPineGeo() {
  const parts = [vcol(cleanGeo(new THREE.CylinderGeometry(.16, .3, 4, 5).translate(0, 2, 0)), [.32, .22, .16])];
  for (let t = 0; t < 6; t++) { const f = t / 6, r = 2.6 * (1 - f * .8), h = 3.6 - f * 1.4, y = 2.6 + t * 1.85;
    parts.push(vcol(cleanGeo(new THREE.ConeGeometry(r, h, 7, 1, true).translate(0, y + h / 2, 0)), [.6 + .2 * f, .7 + .2 * f, .6 + .25 * f])); }
  return mergeGeometries(parts);
}
// an olive, 5 m: a twisted trunk and three silvery lumps; 140 triangles
export function airOliveGeo() {
  const parts = [vcol(cleanGeo(new THREE.CylinderGeometry(.18, .32, 2.2, 5).translate(0, 1.1, 0).rotateZ(.12)), [.42, .38, .32])];
  for (const [x, y, z, s] of [[-.8, 2.6, .2, 1.5], [.9, 2.9, -.3, 1.4], [0, 3.6, .5, 1.3]]) parts.push(vcol(cleanGeo(new THREE.IcosahedronGeometry(s, 1).scale(1.25, .8, 1.25).translate(x, y, z)), [1, 1, 1]));
  return mergeGeometries(parts);
}
// a cypress, 13 m: a dark flame on a short stem; 72 triangles
export function airCypressGeo() {
  const prof = []; for (let s = 0; s <= 8; s++) { const t = s / 8; prof.push(new THREE.Vector2(1.15 * Math.sin(Math.PI * Math.min(1, t * 1.1) ** .65) * (1 - t * .3) + .02, 1 + t * 12)); }
  return mergeGeometries([vcol(cleanGeo(new THREE.CylinderGeometry(.12, .18, 1.2, 4).translate(0, .6, 0)), [.35, .28, .2]), vcol(cleanGeo(new THREE.LatheGeometry(prof, 6)), [1, 1, 1])]);
}
// a far broadleaf, 12 m: one lumpy crown on a stem, for the woods past treeKit's near trees; 104 triangles
export function airBlobGeo() {
  return mergeGeometries([vcol(cleanGeo(new THREE.CylinderGeometry(.25, .4, 6, 5).translate(0, 3, 0)), [.3, .22, .16]),
    vcol(cleanGeo(new THREE.IcosahedronGeometry(4.6, 1).scale(1, .82, 1).translate(0, 8.6, 0)), [1, 1, 1])]);
}
// scatter by the island's rules over the land, from r0 to r1 metres out; gy the height, nrm the normal's up, o.keep(x, z) false where
// nothing may stand (the houses, the viewpoint); a stream keyed by island
export function airCover(scene, island, gy, nrm, o = {}) {
  const r = stream('air:cover:' + island), M = COVER_M(), out = { counts: {}, tris: 0 }, lists = { a: [], b: [], h: [] };
  const want = o.n ?? 9000, r0 = o.r0 ?? 60, r1 = o.r1 ?? 3200;
  for (let k = 0, tries = 0; k < want && tries < want * 12; tries++) {
    const a = r() * Math.PI * 2, d = r0 + (r1 - r0) * r() ** 1.6, x = Math.sin(a) * d, z = -Math.abs(Math.cos(a)) * d * (r() < .9 ? 1 : -1), h = gy(x, z), ny = nrm(x, z);
    if (h < 1.5 || (o.keep && !o.keep(x, z))) continue; const w = fbm(x * .006 + 4, z * .006, 3); let kind = null;
    if (island === 'gatelands') { if (w > .08 && ny > .8 && h < 260) kind = 'a'; else if (w > -.06 && r() < .06 && h < 200 && ny > .85) kind = 'a'; }
    else if (island === 'mark') { if (h < 430 + 80 * w && ny > .62 && (w > -.12 || r() < .2)) kind = 'a'; }
    else { if (h < 120 && ny > .85 && w > -.05) kind = r() < .12 ? 'b' : 'a'; else if (h < 60 && r() < .03) kind = 'b'; }
    if (!kind) continue; k++;
    const t = r(), col = island === 'gatelands' ? [.20 + .08 * t, .32 + .08 * t, .12 + .04 * t] : island === 'mark' ? [.08 + .04 * t, .14 + .05 * t, .10 + .03 * t]
      : kind === 'a' ? [.36 + .06 * t, .42 + .05 * t, .30 + .04 * t] : [.14 + .03 * t, .22 + .04 * t, .14 + .02 * t];
    lists[kind].push([x, h - .4, z, kind === 'h' ? .32 + .14 * r() : (island === 'aurenne' && kind === 'a' ? 1 : .8) + .5 * r(), r() * 6.28, kind === 'h' ? col.map(v => v * .85) : col]);
  }
  // the Gatelands' hedgerows: bushes 4–5 m high along the fields' edges out to 900 m, where landColour darkens the hedge line
  if (island === 'gatelands' && o.hedges) for (let t = 0; t < 70000; t++) { const a = (r() - .5) * 2.6, d = 50 + 850 * r() ** 1.3, x = Math.sin(a) * d, z = -Math.cos(a) * d;
    if (glField(x, z).edge > .009 || (o.keep && !o.keep(x, z))) continue; const h = gy(x, z); if (h < 1.5 || nrm(x, z) < .8) continue; const q = r();
    lists.h.push([x, h - .3, z, .3 + .16 * r(), r() * 6.28, [.15 + .05 * q, .25 + .06 * q, .10 + .03 * q]]); }
  const geoA = island === 'gatelands' ? airBlobGeo() : island === 'mark' ? airPineGeo() : airOliveGeo(), geoB = island === 'aurenne' ? airCypressGeo() : null;
  const triOf = g => g.attributes.position.count / 3;
  inst(scene, geoA, M, lists.a, o.shadow); out.counts.a = lists.a.length; out.tris += triOf(geoA) * lists.a.length;
  if (geoB) { inst(scene, geoB, M, lists.b, o.shadow); out.counts.b = lists.b.length; out.tris += triOf(geoB) * lists.b.length; }
  // the hedgerows: the far broadleaf at a third of its size, a bush 4 m high, along the fields' edges
  if (lists.h.length) { inst(scene, geoA, M, lists.h, o.shadow); out.counts.h = lists.h.length; out.tris += triOf(geoA) * lists.h.length; }
  out.triA = triOf(geoA); out.triB = geoB ? triOf(geoB) : 0; return out;
}

// ── C's marks ──
// the Gatelands' mist lying in the hollows: soft sprites a few metres over the low ground and the lake, under 25 m of the land
export function airMist(scene, gy, o = {}) {
  const r = stream('air:mist'), g = new THREE.Group(), list = [];
  for (let k = 0, t = 0; k < (o.n ?? 280) && t < 9000; t++) {
    const x = -1400 + r() * 2800, z = -120 - r() * 1500 * r(), h = gy(x, z); if (h > (o.under ?? 26)) continue; k++;
    const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: puffTex(), color: new THREE.Color(...(o.colour || [1.02, 1.03, 1.04])), transparent: true, depthWrite: false, opacity: .5 + .35 * r(), fog: false }));
    const w = 160 + 260 * r(); sp.position.set(x, Math.max(h, 0) + 6 + 10 * r(), z); sp.scale.set(w, w * (.12 + .06 * r()), 1); g.add(sp); list.push(sp);
  }
  scene.add(g); g.userData.noShadow = true; return { group: g, n: list.length };
}
// Aurenne's heat shimmer: a pass that wavers the frame in a band about the horizon (uH, the horizon's height on the screen, 0–1)
export function airShimmer() {
  return new ShaderPass({ uniforms: { tDiffuse: { value: null }, uK: { value: 0 }, uH: { value: .5 }, uT: { value: 0 } },
    vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }',
    fragmentShader: `uniform sampler2D tDiffuse; uniform float uK, uH, uT; varying vec2 vUv;
      void main(){ float b = exp(-pow((vUv.y - uH) / .05, 2.)) * uK; vec2 u = vUv;
        u.x += b * .0016 * sin(vUv.y * 900. + uT * 6. + sin(vUv.x * 40.) * 2.);
        u.y += b * .0012 * sin(vUv.x * 300. + uT * 4.);
        vec3 c = texture2D(tDiffuse, u).rgb; c = mix(c, c * vec3(1.04, 1.0, .94) + vec3(.03, .02, 0.), b * .6); gl_FragColor = vec4(c, 1.); }` });
}
