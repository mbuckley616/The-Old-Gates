// The seasons in the land (the concept artist, 21 Oct 2026; backlog L12 "Seasons in the land", OG-139; card F3's tree and grass kit).
// The calendar has four seasons (CAL, 60-shop.js) and the weather already keeps them (seasonWx, 87-world-quests.js); the land does not.
// As corruption.js does for the gates, a season is a row of numbers read by what is already drawn, so the year costs no new art but
// two small instanced layers (the fallen leaves and the flowers) and the bare crowns' twigs:
//   the leaves   (seasonTrees, hooks on common.js's treeKit materials after its wind): a card's share dropped (budding in spring,
//                falling in autumn, bare in winter), a tint, the turn to gold, orange, red and brown (each tree in its own week, each
//                card its own colour), blossom on one tree in two in spring (hawthorn and blackthorn), and an evergreen share that keeps
//                its leaves all year (the Gatelands' holly and yew);
//   the twigs    (seasonTwigs): a crown's limbs, boughs and twigs as one instanced mesh a template, so a bare tree is a tree and not a pole;
//   the ground   (seasonSnow, on every standard material but the people's): lying snow by the surface's slope and a noise, so it lies
//                on the thatch, the sills, the limbs' tops and the grass and not on a wall; frost the same way, thinner and blue;
//                the grass's colour, the lane's mud (dark and wet in spring and winter, pale and dry in summer);
//   the litter   (seasonLitter): patches of fallen leaves under the crowns, along the hedges and the lane, by the season's share;
//   the flowers  (seasonFlowers): primrose, bluebell and blackthorn-white in spring; buttercup, clover and ox-eye in summer;
//   the light    the sun's height (a Gatelands noon: 50° in summer, 13° in winter, so the shadows lengthen), its colour and strength,
//                the sky's colours, the haze and the grade's saturation.
// SEASONS.full is OG-139 as drawn (blossom, full canopy, red and gold, bare); SEASONS.gentle is OG-140's "green all year" (the turn a
// touch, the crowns never bare). Snow is not in a row: it is the weather's cover (WX.cover in the game), 0 to 1, laid on whatever row.
// lerpSeason(rows, t) blends: t 0 spring, 1 summer, 2 autumn, 3 winter, 4 spring again. A metre a unit.
import * as THREE from 'three';
import { GLSL_NOISE } from './common.js';
import { stream } from './pieces.js';

const r3 = (a, b, c) => [a, b, c];
// leaf: × the cards' colour; thin: the share of cards gone; spread: how far one tree runs ahead of another; turn: 0 green to 1 turned;
// brown: what is left turned to dead brown; blossom: the share of a flowering tree's cards in flower; ever: the share of evergreen trees.
// twigs: the bare crowns' limbs shown. grass: × the grass; mud: the lane wet and dark (1) or dry and pale (0). litter/flowers: shares.
// frost: rime on the up-facing; elev: the sun's height (radians); sun/sunK/hemi/gnd/hemiK; fog/fogD; zen/mid/hor/glow: the sky;
// cloud: × the puffs; sat: the grade; cast: × the frame.
const ROW = (o) => ({ ever: .16, twigs: 1, brown: 0, blossom: 0, frost: 0, spread: .4, ...o });
const SPRING = ROW({ leaf: r3(1.18, 1.22, .66), thin: .32, turn: 0, blossom: .55, grass: r3(1.0, 1.1, .78), mud: .75, litter: 0, flowers: 1, fl: 'spring',
  elev: .62, sun: r3(1, .94, .84), sunK: 3.0, hemi: r3(.66, .74, .90), gnd: r3(.36, .34, .26), hemiK: 1.15, fog: r3(.80, .85, .90), fogD: .0021,
  zen: r3(.12, .30, .66), mid: r3(.36, .56, .86), hor: r3(.78, .85, .92), glow: r3(1, .86, .62), cloud: r3(1, 1, 1), sat: 1.06, cast: r3(1, 1, 1) });
const SUMMER = ROW({ leaf: r3(.86, .96, .70), thin: 0, turn: 0, grass: r3(1.06, 1.0, .66), mud: 0, litter: 0, flowers: .7, fl: 'summer',
  elev: .88, sun: r3(1, .93, .80), sunK: 3.4, hemi: r3(.64, .72, .88), gnd: r3(.38, .34, .24), hemiK: 1.15, fog: r3(.78, .83, .90), fogD: .0013,
  zen: r3(.08, .24, .62), mid: r3(.30, .52, .86), hor: r3(.74, .83, .93), glow: r3(1, .82, .55), cloud: r3(1, 1, 1), sat: 1.1, cast: r3(1, 1, 1) });
const AUTUMN = ROW({ leaf: r3(.92, .94, .70), thin: .34, turn: .82, spread: .55, grass: r3(1.0, .88, .58), mud: .55, litter: 1, flowers: .04, fl: 'summer',
  elev: .40, sun: r3(1, .82, .62), sunK: 2.9, hemi: r3(.66, .68, .78), gnd: r3(.40, .32, .22), hemiK: 1.08, fog: r3(.84, .81, .76), fogD: .0032,
  zen: r3(.14, .28, .58), mid: r3(.42, .54, .76), hor: r3(.88, .82, .74), glow: r3(1, .74, .45), cloud: r3(1.02, .96, .9), sat: 1.08, cast: r3(1.02, 1, .96) });
const WINTER = ROW({ leaf: r3(.9, .9, .8), thin: 1, turn: 1, brown: 1, grass: r3(.92, .86, .60), mud: .95, litter: .55, flowers: 0, fl: 'summer', frost: .25,
  elev: .23, sun: r3(1, .87, .74), sunK: 2.5, hemi: r3(.62, .68, .82), gnd: r3(.32, .31, .30), hemiK: 1.1, fog: r3(.80, .82, .86), fogD: .0028,
  zen: r3(.16, .27, .52), mid: r3(.44, .54, .72), hor: r3(.82, .82, .84), glow: r3(1, .80, .62), cloud: r3(.9, .9, .94), sat: .9, cast: r3(.98, 1, 1.03) });
// OG-140's Gatelands, "green all year": the same light, a touch of the turn, crowns that thin and never bare, no lying litter to speak of
const G_SPRING = { ...SPRING, thin: .1, blossom: .25, leaf: r3(1.06, 1.12, .78), flowers: .8 };
const G_AUTUMN = { ...AUTUMN, thin: .1, turn: .32, spread: .35, litter: .25, grass: r3(1.0, .96, .66) };
const G_WINTER = { ...WINTER, thin: .38, turn: .5, brown: .55, twigs: 1, grass: r3(.92, .94, .68), litter: .15, frost: .2, ever: .3 };
export const SEASONS = { full: [SPRING, SUMMER, AUTUMN, WINTER], gentle: [G_SPRING, SUMMER, G_AUTUMN, G_WINTER] };
export const SEASON_NAMES = ['spring', 'summer', 'autumn', 'winter'];
export function lerpSeason(rows, t) {
  t = ((t % 4) + 4) % 4; const i = Math.floor(t), a = rows[i], b = rows[(i + 1) % 4], f = t - i, o = {};
  for (const k in a) o[k] = Array.isArray(a[k]) ? a[k].map((v, j) => v + (b[k][j] - v) * f) : typeof a[k] === 'number' ? a[k] + (b[k] - a[k]) * f : (f < .5 ? a[k] : b[k]);
  o.t = t; o.name = SEASON_NAMES[Math.round(t) % 4]; return o;
}

// ── the leaves: on common.js's treeKit materials, after its wind ──
const TU = { uThin: { value: 0 }, uSpread: { value: .4 }, uTurn: { value: 0 }, uBrown: { value: 0 }, uBlossom: { value: 0 }, uEver: { value: .16 },
  uLeaf: { value: new THREE.Vector3(1, 1, 1) }, uEverC: { value: new THREE.Vector3(.34, .50, .42) } };
const LEAF_V = `
  vCard = aCard;
  #ifdef USE_INSTANCING
  { vec4 o = modelMatrix * instanceMatrix * vec4(0., 0., 0., 1.); vTree = fract(sin(dot(floor(o.xz * 10.) / 10., vec2(12.9898, 78.233))) * 43758.5453); }
  #else
  vTree = .5;
  #endif`;
const LEAF_DISCARD = `
  bool sEver = vTree < uEver; float sTh = sEver ? 0. : clamp(uThin + (fract(vTree * 7.13) - .5) * uSpread * (1. - uThin) * 2., 0., 1.);
  if (vCard < sTh) discard;`;
const LEAF_COLOUR = `
  if (!sEver) { float sl = dot(diffuseColor.rgb, vec3(.3, .59, .11)); diffuseColor.rgb *= uLeaf;
    float tt = clamp(uTurn + (fract(vTree * 3.71) - .5) * uSpread + (fract(vCard * 5.3) - .5) * .35, 0., 1.);
    float k = fract(vCard * 17.31 + vTree * 3.1);
    vec3 pal = k < .32 ? vec3(.96, .64, .14) : k < .58 ? vec3(.94, .40, .08) : k < .76 ? vec3(.70, .15, .05) : vec3(.52, .32, .12);
    pal = mix(pal, vec3(.40, .26, .13), uBrown);
    diffuseColor.rgb = mix(diffuseColor.rgb, pal * sl * 2.4, smoothstep(.15, .85, tt));
    if (fract(vCard * 13.7) < uBlossom && fract(vTree * 5.9) > .5) diffuseColor.rgb = mix(vec3(1., .60, .74), vec3(1., .97, .95), step(.5, fract(vTree * 11.))) * (.6 + sl * 1.6);
  } else diffuseColor.rgb *= uEverC;`;
function hookLeaf(m, depth) {
  const prev = m.onBeforeCompile;
  m.onBeforeCompile = (s, r) => { prev && prev.call(m, s, r); Object.assign(s.uniforms, TU);
    s.vertexShader = 'attribute float aCard; varying float vCard; varying float vTree;\n' + s.vertexShader.replace('#include <project_vertex>', LEAF_V + '\n#include <project_vertex>');
    s.fragmentShader = 'uniform float uThin, uSpread, uTurn, uBrown, uBlossom, uEver; uniform vec3 uLeaf, uEverC; varying float vCard; varying float vTree;\n'
      + s.fragmentShader.replace('void main() {', 'void main() {\n' + LEAF_DISCARD)
        .replace('#include <color_fragment>', '#include <color_fragment>\n' + (depth ? '' : LEAF_COLOUR)); };
  m.customProgramCacheKey = () => 'season-leaf' + (depth ? '-d' : ''); m.needsUpdate = true;
}
// call once after treeKit's plant(): every leaf card one hash (aCard) for its four corners; the leaves' depth material too, so the
// shadow drops with the leaves
export function seasonTrees(scene) {
  const seen = new Set(), r = stream('season:cards');
  scene.traverse(o => { if (!o.isInstancedMesh || !o.material.alphaTest || o.userData.season) return; const g = o.geometry;
    if (!g.attributes.aCard) { const n = g.attributes.position.count, a = new Float32Array(n); for (let i = 0; i < n; i += 4) { const v = .02 + .98 * r(); a[i] = a[i + 1] = a[i + 2] = a[i + 3] = v; } g.setAttribute('aCard', new THREE.BufferAttribute(a, 1)); }
    if (!seen.has(o.material)) { seen.add(o.material); hookLeaf(o.material, false); }
    if (o.customDepthMaterial && !seen.has(o.customDepthMaterial)) { seen.add(o.customDepthMaterial); hookLeaf(o.customDepthMaterial, true); } });
}

// ── the twigs: a crown's limbs, boughs and twigs, laid to treeKit's two templates (trunk 5 m, crown at 8 m, 5.5 m round; trunk 7 m,
// crown at 10.5 m, 4.2 m round). One geometry a template, instanced at the trees' own matrices ──
function twigGeometry(kind, r) {
  const trunkH = kind === 1 ? 7 : 5, crownY = trunkH + (kind === 1 ? 3.5 : 3), crownR = kind === 1 ? 4.2 : 5.5, parts = [], up = new THREE.Vector3(0, 1, 0);
  const seg = (a, b, r0, r1, n) => { const d = new THREE.Vector3().subVectors(b, a), L = d.length(), g = new THREE.CylinderGeometry(r1, r0, L, n, 1, true);
    g.translate(0, L / 2, 0); g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(up, d.normalize())); g.translate(a.x, a.y, a.z); parts.push(g); };
  const bend = (dir, k) => dir.clone().add(new THREE.Vector3(r() - .5, r() - .2, r() - .5).multiplyScalar(k)).normalize();
  const nL = kind === 1 ? 7 : 6;
  // the leader: the trunk carried on up into the crown, so a bare tree has no stump at its top
  { const b = new THREE.Vector3(0, trunkH + .6, 0), m = new THREE.Vector3((r() - .5) * .6, crownY + .2, (r() - .5) * .6), e = new THREE.Vector3((r() - .5) * 1.2, crownY + crownR * .75, (r() - .5) * 1.2);
    seg(b, m, .27, .14, 6); seg(m, e, .14, .03, 5);
    for (let j = 0; j < 5; j++) { const p = j < 2 ? b.clone().lerp(m, .5 + j * .4) : m.clone().lerp(e, (j - 2) * .3), d = bend(new THREE.Vector3(Math.cos(j * 2.4), .9, Math.sin(j * 2.4)).normalize(), .6), q = p.clone().addScaledVector(d, 1.4 + r());
      seg(p, q, .05, .02, 4); for (let k = 0; k < 3; k++) { const p2 = p.clone().lerp(q, .4 + k * .25); seg(p2, p2.clone().addScaledVector(bend(d, 1.6), .6 + r() * .5), .018, .006, 3); } } }
  for (let i = 0; i < nL; i++) {
    const a = i / nL * Math.PI * 2 + r() * .6, y0 = trunkH - 1.2 + r() * 2.2 + (kind === 1 ? i * .35 : 0), s = new THREE.Vector3(0, y0, 0);
    const dir = new THREE.Vector3(Math.cos(a), (kind === 1 ? .55 : .85) + r() * .4, Math.sin(a)).normalize(), L = crownR * (.75 + r() * .3);
    const mid = s.clone().addScaledVector(dir, L * .55), e = mid.clone().addScaledVector(bend(dir, .5), L * .5);
    seg(s, mid, .17, .11, 5); seg(mid, e, .11, .05, 5);
    for (let j = 0; j < 4; j++) { const t = .35 + j * .2, p = j < 2 ? s.clone().lerp(mid, t * 1.6) : mid.clone().lerp(e, (t - .5) * 2), d2 = bend(new THREE.Vector3().subVectors(e, s).normalize(), 1.3), l2 = 1.6 + r() * 1.4, q = p.clone().addScaledVector(d2, l2);
      seg(p, q, .055, .022, 4);
      for (let k = 0; k < 4; k++) { const p2 = p.clone().lerp(q, .3 + k * .22), d3 = bend(d2, 1.6), q2 = p2.clone().addScaledVector(d3, .7 + r() * .7); seg(p2, q2, .02, .007, 3);
        if (k % 2 === 0) { const d4 = bend(d3, 1.8); seg(q2, q2.clone().addScaledVector(d4, .45 + r() * .3), .007, .004, 3); } } }
  }
  const g = mergeAll(parts); g.userData.crown = [crownY, crownR]; return g;
}
function mergeAll(parts) { let n = 0, m = 0; for (const p of parts) { n += p.attributes.position.count; m += p.index.count; }
  const pos = new Float32Array(n * 3), nor = new Float32Array(n * 3), idx = new Uint32Array(m); let o = 0, oi = 0;
  for (const p of parts) { pos.set(p.attributes.position.array, o * 3); nor.set(p.attributes.normal.array, o * 3); for (let i = 0; i < p.index.count; i++) idx[oi + i] = p.index.array[i] + o; o += p.attributes.position.count; oi += p.index.count; }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.BufferAttribute(nor, 3)); g.setIndex(new THREE.BufferAttribute(idx, 1)); return g; }
// list: the trees as plant() was given them, [x, y, z, scale, rotY, tint, kind]
export function seasonTwigs(scene, list, barkColor = new THREE.Color(.24, .19, .15)) {
  const mat = new THREE.MeshStandardMaterial({ color: barkColor, roughness: .95 }), r = stream('season:twigs'), G = [twigGeometry(0, r), twigGeometry(1, r)], out = [];
  const M = new THREE.Matrix4(), q = new THREE.Quaternion(), s = new THREE.Vector3(), p = new THREE.Vector3(), up = new THREE.Vector3(0, 1, 0);
  [0, 1].forEach(k => { const L = list.filter(t => (t[6] ?? 0) === k); if (!L.length) return; const m = new THREE.InstancedMesh(G[k], mat, L.length); m.castShadow = m.receiveShadow = true;
    L.forEach(([x, y, z, sc, ry], i) => { p.set(x, y - .3, z); q.setFromAxisAngle(up, ry); s.setScalar(sc); M.compose(p, q, s); m.setMatrixAt(i, M); });
    scene.add(m); out.push(m); });
  return { meshes: out, mat, tris: G.map(g => g.index.count / 3) };
}

// ── snow and frost on every standard material: up-facing surfaces by a noise, so it drifts and lies thin at the edges ──
const SU = { uSnow: { value: 0 }, uFrost: { value: 0 } };
const SNOW_V = `
  { mat4 sm = modelMatrix;
  #ifdef USE_INSTANCING
    sm = modelMatrix * instanceMatrix;
  #endif
    vSnP = (sm * vec4(transformed, 1.)).xyz; vSnN = normalize(mat3(sm) * objectNormal); }`;
const SNOW_F = `
  float sSnow = 0.; { float up = normalize(vSnN).y, n = fb(vSnP.xz * .35) * .65 + fb(vSnP.xz * 2.7 + 3.1) * .35;
    sSnow = smoothstep(.0, .22, uSnow * 1.3 - .5 - (1. - smoothstep(.25, .8, up)) * 1.3 - (n - .5));
    float fr = uFrost * smoothstep(.3, .9, up) * (.45 + .55 * n);
    diffuseColor.rgb = mix(diffuseColor.rgb, vec3(.80, .86, .94) * (.6 + .5 * dot(diffuseColor.rgb, vec3(.33))) + .25, fr * .55);
    diffuseColor.rgb = mix(diffuseColor.rgb, vec3(.90, .93, .98), sSnow); }`;
export function hookSnow(m) {
  if (m.userData.snow || !m.isMeshStandardMaterial) return; m.userData.snow = true; const prev = m.onBeforeCompile, key = m.customProgramCacheKey;
  m.onBeforeCompile = (s, r) => { prev && prev.call(m, s, r); Object.assign(s.uniforms, SU);
    s.vertexShader = 'varying vec3 vSnP; varying vec3 vSnN;\n' + s.vertexShader.replace('#include <project_vertex>', SNOW_V + '\n#include <project_vertex>');
    s.fragmentShader = 'uniform float uSnow, uFrost; varying vec3 vSnP; varying vec3 vSnN;\n' + GLSL_NOISE + s.fragmentShader.replace('#include <alphamap_fragment>', SNOW_F + '\n#include <alphamap_fragment>')
      .replace('#include <roughnessmap_fragment>', '#include <roughnessmap_fragment>\n roughnessFactor = mix(roughnessFactor, .62, sSnow);')
      .replace('#include <normal_fragment_maps>', '#include <normal_fragment_maps>\n normal = normalize(mix(normal, normalize(vNormal), sSnow * .8));'); };
  const k0 = key ? key.call(m) : ''; m.customProgramCacheKey = () => k0 + '-snow'; m.needsUpdate = true;
}
// every material in the scene but the people's (skinned) and the sky's
export function seasonSnow(scene) { const seen = new Set(); scene.traverse(o => { if (!o.isMesh || o.isSkinnedMesh || o.userData.noSnow) return; for (const m of [].concat(o.material)) if (!seen.has(m)) { seen.add(m); hookSnow(m); } }); return seen.size; }

// ── the litter: patches of fallen leaves, each a 0.7 to 1.6 m quad lying on the ground, painted with forty leaves ──
let _lt = null;
function litterTex() { if (_lt) return _lt; const c = document.createElement('canvas'); c.width = c.height = 256; const x = c.getContext('2d'), r = stream('season:littertex');
  const pal = ['#e0a22a', '#d8661a', '#a8341a', '#7a4a1e', '#c88a2a', '#8a2a14'];
  for (let i = 0; i < 90; i++) { const a = r() * Math.PI * 2, d = Math.sqrt(r()) * 108, cx = 128 + Math.cos(a) * d, cy = 128 + Math.sin(a) * d, s = 7 + r() * 8;
    x.save(); x.translate(cx, cy); x.rotate(r() * 6.3); x.fillStyle = pal[Math.floor(r() * pal.length)]; x.globalAlpha = .75 + r() * .25; x.beginPath(); x.ellipse(0, 0, s, s * .58, 0, 0, Math.PI * 2); x.fill();
    x.strokeStyle = 'rgba(60,30,10,.5)'; x.lineWidth = 1; x.beginPath(); x.moveTo(-s, 0); x.lineTo(s, 0); x.stroke(); x.restore(); }
  _lt = new THREE.CanvasTexture(c); _lt.colorSpace = THREE.SRGBColorSpace; _lt.anisotropy = 4; return _lt; }
// spots: [[x, z, radius, weight]] where leaves gather (under a crown, along a hedge); ground(x, z) -> y
export function seasonLitter(scene, spots, ground, n = 2600) {
  const r = stream('season:litter'), g = new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2), m = new THREE.MeshStandardMaterial({ map: litterTex(), alphaTest: .4, roughness: .9, color: 0xffffff,
    polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 });
  const mesh = new THREE.InstancedMesh(g, m, n), M = new THREE.Matrix4(), q = new THREE.Quaternion(), up = new THREE.Vector3(0, 1, 0), tot = spots.reduce((a, s) => a + s[3], 0);
  for (let i = 0; i < n; i++) { let w = r() * tot, sp = spots[0]; for (const s of spots) { w -= s[3]; if (w <= 0) { sp = s; break; } }
    const a = r() * 6.3, d = sp[2] * Math.sqrt(r()), x = sp[0] + Math.cos(a) * d, z = sp[1] + Math.sin(a) * d, sc = .7 + r() * .9;
    q.setFromAxisAngle(up, r() * 6.3); M.compose(new THREE.Vector3(x, ground(x, z) + .03, z), q, new THREE.Vector3(sc, 1, sc)); mesh.setMatrixAt(i, M); }
  mesh.receiveShadow = true; mesh.userData.max = n; scene.add(mesh); return mesh;
}
// ── the flowers: tufts of two crossed cards, 0.3 m, heads painted white and tinted by the season's palette ──
let _ft = null;
function flowerTex() { if (_ft) return _ft; const c = document.createElement('canvas'); c.width = 128; c.height = 96; const x = c.getContext('2d'), r = stream('season:flowertex');
  for (let i = 0; i < 9; i++) { const sx = 10 + r() * 108, top = 10 + r() * 50; x.strokeStyle = '#5a7a30'; x.lineWidth = 2; x.beginPath(); x.moveTo(sx + (r() - .5) * 10, 96); x.quadraticCurveTo(sx + (r() - .5) * 14, (96 + top) / 2, sx, top); x.stroke();
    x.fillStyle = '#ffffff'; for (let p = 0; p < 5; p++) { const a = p / 5 * 6.28; x.beginPath(); x.arc(sx + Math.cos(a) * 4, top + Math.sin(a) * 4, 3.6, 0, 6.3); x.fill(); } x.fillStyle = '#f2d24a'; x.beginPath(); x.arc(sx, top, 2.2, 0, 6.3); x.fill(); }
  _ft = new THREE.CanvasTexture(c); _ft.colorSpace = THREE.SRGBColorSpace; return _ft; }
export const FLOWERS = { spring: [[1, .88, .42], [.48, .52, 1], [1, 1, 1], [1, .9, .5], [.6, .55, 1]], summer: [[1, .86, .1], [1, .5, .62], [1, 1, 1], [1, .82, .1], [.9, .25, .2]] };
export function seasonFlowers(scene, ok, ground, area, n = 5000) {
  const r = stream('season:flowers'), a = new THREE.PlaneGeometry(.36, .27).translate(0, .135, 0), b = a.clone().rotateY(Math.PI / 2), g = mergeAll([a, b]);
  g.setAttribute('uv', new THREE.BufferAttribute(new Float32Array([...a.attributes.uv.array, ...b.attributes.uv.array]), 2));
  const m = new THREE.MeshStandardMaterial({ map: flowerTex(), alphaTest: .5, side: THREE.DoubleSide, roughness: .8 }), mesh = new THREE.InstancedMesh(g, m, n);
  const M = new THREE.Matrix4(), q = new THREE.Quaternion(), up = new THREE.Vector3(0, 1, 0); let i = 0, tries = 0;
  while (i < n && tries++ < n * 20) { const x = area[0] + r() * (area[2] - area[0]), z = area[1] + r() * (area[3] - area[1]); if (!ok(x, z)) continue;
    q.setFromAxisAngle(up, r() * 6.3); const s = .8 + r() * .6; M.compose(new THREE.Vector3(x, ground(x, z) - .02, z), q, new THREE.Vector3(s, s, s)); mesh.setMatrixAt(i, M); mesh.setColorAt(i, new THREE.Color(1, 1, 1)); i++; }
  mesh.count = i; mesh.userData.max = i; mesh.userData.pick = Array.from({ length: i }, () => r()); mesh.receiveShadow = true; mesh.userData.noSnow = false; scene.add(mesh); return mesh;
}

// ── apply a row: the leaves' uniforms, the snow's, the litter's and the flowers' counts; the view sets its own light from the row ──
export function setSeason(L, o = {}) {
  TU.uThin.value = L.thin; TU.uSpread.value = L.spread; TU.uTurn.value = L.turn; TU.uBrown.value = L.brown; TU.uBlossom.value = L.blossom; TU.uEver.value = L.ever; TU.uLeaf.value.set(...L.leaf);
  SU.uSnow.value = o.snow ?? 0; SU.uFrost.value = Math.max(0, L.frost * (1 - (o.snow ?? 0)));
  if (o.twigs) o.twigs.meshes.forEach(m => m.visible = L.thin > .12);
  if (o.litter) { o.litter.count = Math.round(o.litter.userData.max * L.litter); o.litter.material.color.setRGB(...(L.brown > .5 ? [.62, .5, .42] : [1, 1, 1])); }
  if (o.flowers) { const f = o.flowers, P = FLOWERS[L.fl]; f.count = Math.round(f.userData.max * L.flowers); const c = new THREE.Color();
    for (let i = 0; i < f.count; i++) f.setColorAt(i, c.setRGB(...P[Math.floor(f.userData.pick[i] * P.length)])); if (f.instanceColor) f.instanceColor.needsUpdate = true; }
}
