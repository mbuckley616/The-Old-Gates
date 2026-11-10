// The campfire and the stump (the concept artist, 10 Nov 2026; backlog L8/L11, OG-132's "warm and cold" and OG-133's stations, OG-098's
// kit; the survival sheet's owed props: "the vein, the stump, the fire, the forge, the bench and the mortar, in the kit"). In the game
// both are still stand-ins (`campfireMesh`, three Lambert sticks and a cone; `stumpMesh`, a nine-sided cylinder, js/50-travel.js); the
// vein (S1498), the bench (S1524) and the felled trunk (S1540) are the kit's already. Everything in metres, beside people 1.6 to 1.9 m.
//
//   campfire({ island, mode, stage, seed }) -> { group, tris, draws, light, tick(t), foot: radius, parts }
//     mode  'plain'  A: three split logs crossed on scorched ground, nothing else, gone when it is out.
//           'ring'   B: a ring of fieldstones round a teepee of sticks and split logs, the same on every island.
//           'island' C: laid as the island lays it: the Gatelands lift the turf and stack the sods to put back, a stone ring on the
//                    bare earth; the Mark's long fire, two pine logs side by side burning down their seam (the nying); Aurenne's
//                    keyhole, a round pit and a slot of flat limestone where the coals are raked under a little grill.
//     stage 'lit' (the first quarter of FIRE_HOURS: tall flames), 'burning', 'embers' (the last fifth: low licks, the coals glow),
//           'out' (cold: ash and charred stubs).
//   stump({ kind: 'oak'|'pine'|'birch', r, seed }) -> { group, tris, draws, h, r }: a felled tree's stump as a hatchet leaves it,
//     the notch's face and the back cut a hand higher, the hinge's splinters standing between them; root flare into the ground.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { texPair, TEX, puffTex, STATS } from './common.js';

export const CAMP_MODES = { plain: 'A, the fire alone: three logs on scorched ground', ring: 'B, a ring of stones, the same everywhere', island: 'C, laid as each island lays it' };
export const CAMP_STAGES = { lit: 1, burning: .72, embers: .16, out: 0 };
export const ISLANDS = ['gatelands', 'mark', 'aurenne'];

function stream(s) { let h = 2166136261; for (const c of String(s)) h = Math.imul(h ^ c.charCodeAt(0), 16777619); let a = h >>> 0;
  return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
const tn = (x, y, f, s) => { const X = x * f, Y = y * f, i = Math.floor(X), j = Math.floor(Y), u = X - i, v = Y - j, h = (a, b) => { a = ((a % f) + f) % f; b = ((b % f) + f) % f; let n = a * 374761393 + b * 668265263 + s * 982451653; n = (n ^ (n >>> 13)) * 1274126177; return ((n ^ (n >>> 16)) >>> 0) / 4294967295; };
  const su = u * u * (3 - 2 * u), sv = v * v * (3 - 2 * v); return h(i, j) * (1 - su) * (1 - sv) + h(i + 1, j) * su * (1 - sv) + h(i, j + 1) * (1 - su) * sv + h(i + 1, j + 1) * su * sv; };
export const tf = (x, y, f, o, s) => { let a = 0, m = .5, t = 0; for (let k = 0; k < o; k++) { a += m * tn(x, y, f, s + k); t += m; f *= 2; m *= .5; } return a / t; };

// ── materials, made once ──
const M = {};
function mats() {
  if (M.done) return M; M.done = true;
  const std = (tp, o = {}) => new THREE.MeshStandardMaterial({ map: tp.map, normalMap: tp.normalMap, roughness: o.rough ?? .92, color: o.color ?? 0xffffff, ...(o.extra || {}) });
  // bark: oak furrowed grey-brown, pine in red-brown plates, birch white with black lenticels and dark at the foot
  M.oakBark = std(texPair(256, (x, y) => { const f = Math.pow(Math.abs(Math.sin((x * 9 + tf(x, y, 4, 3, 2) * 1.6) * Math.PI)), .6), n = tf(x, y, 16, 3, 5), h = f * .8 + n * .2; const v = .2 + .14 * f + .05 * n; return [h, v * 1.05, v * .92, v * .78]; }, 3.2));
  M.pineBark = std(texPair(256, (x, y) => { const rows = 7, r = Math.floor(y * rows + tn(x, 0, 6, 9) * .8), ry = y * rows - r, xx = x * 4 + (r % 2) * .5, c = Math.floor(xx), rx = xx - c, e = Math.min(rx, 1 - rx, ry * 1.5, (1 - ry) * 1.5), n = tf(x, y, 20, 3, 4);
    const gap = e < .06, h = gap ? 0 : Math.min(1, e * 6) * (.7 + .3 * n), v = gap ? .12 : .3 + .12 * n + .08 * tn(c / 4, r / rows, 97, 3); return [h, v * 1.25, v * .78, v * .55]; }, 3));
  M.birchBark = std(texPair(256, (x, y) => { const len = tn(x * 3, y * 26, 16, 7), dash = len > .72 ? 1 : 0, n = tf(x, y, 12, 3, 8), v = dash ? .12 : .82 + .08 * n; return [dash ? 0 : .7 + .3 * n, v, v * .98, v * .94]; }, 1.4), { rough: .7 });
  // split wood and the cut face: pale, the rings drawn on a canvas
  M.split = std(texPair(256, (x, y) => { const g = Math.sin((x * 22 + tf(x, y, 4, 3, 3) * 5) * Math.PI) * .5 + .5, n = tf(x, y, 24, 2, 6), v = .55 + .12 * g + .06 * n; return [g * .6 + n * .4, v * 1.05, v * .82, v * .55]; }, 2));
  M.end = new THREE.MeshStandardMaterial({ map: ringsTex(), roughness: .85, side: THREE.DoubleSide });
  // charred wood: black with a crackle of ember light in its emissive (turned up by the stage)
  const ch = texPair(256, (x, y) => { const cx = Math.abs(tf(x, y * 3, 6, 3, 11) - .5), cr = cx < .035 ? 1 : 0, n = tf(x, y, 18, 3, 12), v = .035 + .04 * n; return [cr ? 0 : .6 + .4 * n, v, v * .95, v * .9]; }, 2.6);
  const glow = document.createElement('canvas'); glow.width = glow.height = 256; { const g = glow.getContext('2d'), d = g.createImageData(256, 256);
    for (let j = 0; j < 256; j++) for (let i = 0; i < 256; i++) { const x = i / 256, y = j / 256, cx = Math.abs(tf(x, y * 3, 6, 3, 11) - .5), k = Math.max(0, 1 - cx / .05) ** 1.5, o = (j * 256 + i) * 4; d.data[o] = 255 * k; d.data[o + 1] = 110 * k; d.data[o + 2] = 20 * k; d.data[o + 3] = 255; }
    g.putImageData(d, 0, 0); }
  const gt = new THREE.CanvasTexture(glow); gt.wrapS = gt.wrapT = THREE.RepeatWrapping; gt.colorSpace = THREE.SRGBColorSpace;
  M.char = new THREE.MeshStandardMaterial({ map: ch.map, normalMap: ch.normalMap, roughness: .95, emissive: 0xffffff, emissiveMap: gt, emissiveIntensity: 0 });
  // stones: the Gatelands' and the Mark's grey fieldstone (the slices' rock), Aurenne's pale limestone; soot on the inner faces is a vertex colour
  M.stone = new THREE.MeshStandardMaterial({ map: TEX.rock.map, normalMap: TEX.rock.normalMap, roughness: .95, vertexColors: true });
  M.lime = new THREE.MeshStandardMaterial({ map: TEX.rock.map, normalMap: TEX.rock.normalMap, roughness: .9, vertexColors: true, color: new THREE.Color(1.5, 1.42, 1.22) });
  // the bed of ash and coals, and the scorch round it: one disc each, drawn as a decal over the ground
  M.ash = new THREE.MeshStandardMaterial({ map: ashTex(), roughness: 1, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2, emissive: 0xffffff, emissiveMap: ashGlowTex(), emissiveIntensity: 0 });
  M.scorch = new THREE.MeshStandardMaterial({ map: scorchTex(), roughness: 1, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -1 });
  M.earth = std(texPair(256, (x, y) => { const n = tf(x, y, 10, 4, 21), p = tn(x, y, 48, 3) > .7 ? 1 : 0, v = .16 + .06 * n + .05 * p; return [n * .7 + p * .3, v * 1.15, v * .92, v * .7]; }, 2.4));
  M.sodTop = std(texPair(256, (x, y) => { const b = tn(x * 2, y * 2, 64, 13), n = tf(x, y, 8, 3, 14), v = .26 + .14 * b; return [b, v * .62 + .05 * n, v * 1.05, v * .38]; }, 2));
  M.iron = new THREE.MeshStandardMaterial({ color: 0x2a2624, roughness: .6, metalness: .7 });
  M.smoke = new THREE.SpriteMaterial({ map: puffTex(), color: 0x8a8580, transparent: true, depthWrite: false, opacity: .22, fog: true });
  M.flame = flameMat();
  return M;
}
function canvasTex(N, fn, srgb = true) { const c = document.createElement('canvas'); c.width = c.height = N; const g = c.getContext('2d'); fn(g, N); const t = new THREE.CanvasTexture(c); t.colorSpace = srgb ? THREE.SRGBColorSpace : THREE.NoColorSpace; t.anisotropy = 4; return t; }
function ringsTex() { return canvasTex(256, (x) => { x.fillStyle = '#c9a874'; x.fillRect(0, 0, 256, 256);
  for (let r = 5; r < 124; r += 4 + (r % 3)) { x.strokeStyle = r % 2 ? 'rgba(120,80,40,.38)' : 'rgba(150,105,60,.25)'; x.lineWidth = 1.4; x.beginPath(); x.arc(128 + Math.sin(r) * 2, 128 + Math.cos(r * .7) * 2, r, 0, Math.PI * 2); x.stroke(); }
  x.strokeStyle = 'rgba(70,45,25,.5)'; x.lineWidth = 2; for (const a of [.4, 2.1, 3.9]) { x.beginPath(); x.moveTo(128 + 10 * Math.cos(a), 128 + 10 * Math.sin(a)); x.lineTo(128 + 100 * Math.cos(a + .1), 128 + 100 * Math.sin(a + .1)); x.stroke(); }
  x.fillStyle = '#3e2818'; x.beginPath(); x.arc(128, 128, 127, 0, Math.PI * 2); x.arc(128, 128, 116, 0, Math.PI * 2, true); x.fill(); }); }
function ashTex() { return canvasTex(256, (x, N) => { const d = x.createImageData(N, N); for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) { const u = i / N - .5, v = j / N - .5, r = Math.hypot(u, v) * 2, n = tf(i / N, j / N, 8, 4, 31), m = tn(i / N, j / N, 64, 33);
    const a = Math.max(0, Math.min(1, (1 - r) * 3.2 - .2 + (n - .5) * 1.6)), ash = m > .55 ? .55 + .2 * n : .12 + .1 * n, o = (j * N + i) * 4; d.data[o] = 255 * ash; d.data[o + 1] = 250 * ash; d.data[o + 2] = 240 * ash; d.data[o + 3] = 255 * a; } x.putImageData(d, 0, 0); }); }
function ashGlowTex() { return canvasTex(256, (x, N) => { const d = x.createImageData(N, N); for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) { const u = i / N - .5, v = j / N - .5, r = Math.hypot(u, v) * 2, m = tn(i / N, j / N, 40, 35), k = Math.max(0, 1 - r * 1.5) * Math.max(0, m - .45) * 3.2, o = (j * N + i) * 4;
    d.data[o] = 255 * Math.min(1, k); d.data[o + 1] = 120 * Math.min(1, k); d.data[o + 2] = 25 * Math.min(1, k); d.data[o + 3] = 255; } x.putImageData(d, 0, 0); }); }
function scorchTex() { return canvasTex(256, (x, N) => { const d = x.createImageData(N, N); for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) { const u = i / N - .5, v = j / N - .5, r = Math.hypot(u, v) * 2, n = tf(i / N, j / N, 6, 4, 41), a = Math.max(0, Math.min(1, (1 - r) * 2.2 + (n - .5) * 1.4)) * .85, o = (j * N + i) * 4;
    d.data[o] = 30; d.data[o + 1] = 24; d.data[o + 2] = 18; d.data[o + 3] = 255 * a; } x.putImageData(d, 0, 0); }); }

// the flame: crossed cards with a shader that draws a licking tongue from fbm rising through a teardrop; additive, so the bloom takes it
function flameMat() {
  return new THREE.ShaderMaterial({ transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, fog: false,
    uniforms: { uT: { value: 0 }, uK: { value: 1 } },
    vertexShader: 'attribute float aSeed; varying vec2 vUv; varying float vS; void main(){ vUv = uv; vS = aSeed; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }',
    fragmentShader: `uniform float uT, uK; varying vec2 vUv; varying float vS;
      float h(vec2 p){ p = fract(p * vec2(127.1, 311.7)); p += dot(p, p + 19.19); return fract(p.x * p.y); }
      float vn(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f); return mix(mix(h(i), h(i + vec2(1,0)), f.x), mix(h(i + vec2(0,1)), h(i + vec2(1,1)), f.x), f.y); }
      float fb(vec2 p){ float a = 0., m = .5; for (int i = 0; i < 4; i++){ a += m * vn(p); p *= 2.1; m *= .5; } return a; }
      void main(){ vec2 p = vUv; float t = uT * 1.6 + vS * 17.;
        float n = fb(vec2(p.x * 3. + vS * 9., p.y * 2.2 - t)), n2 = fb(vec2(p.x * 6. - vS * 5., p.y * 4. - t * 1.7));
        float w = (1. - p.y) * (.42 + .1 * n) * smoothstep(0., .18, p.y + .05);
        float d = abs(p.x - .5 + (n - .5) * .25 * p.y) / max(w, 1e-3);
        float body = smoothstep(1., .35, d) * smoothstep(1., .55 - .25 * n2, p.y + (n2 - .5) * .35);
        float core = smoothstep(.55, 0., d) * smoothstep(.7, .1, p.y);
        vec3 c = mix(vec3(.9, .18, .02), vec3(1., .55, .12), body) + vec3(1., .85, .5) * core * .9;
        float a = body * (1. - p.y * .35); gl_FragColor = vec4(c * a * .95 * uK, 1.); }` });
}
// a flame of height h at (x, y, z): three cards crossed at 60°, one draw for every flame of a fire (merged)
function flameGeo(list) { const gs = []; list.forEach(([x, y, z, h, w, s]) => { for (let k = 0; k < 3; k++) { const g = new THREE.PlaneGeometry(w, h); g.translate(0, h / 2, 0); g.rotateY(k * Math.PI / 3 + s * 3); g.translate(x, y, z);
    g.setAttribute('aSeed', new THREE.Float32BufferAttribute(new Array(4).fill(s + k * .13), 1)); gs.push(g); } }); return mergeGeometries(gs); }

// ── pieces ──
// a log or a stick from a to b (each [x, y, z]), radius r: bark round it, the ends capped
function logGeo(a, b, r, o = {}) { const A = new THREE.Vector3(...a), B = new THREE.Vector3(...b), L = A.distanceTo(B), seg = o.seg ?? 8;
  const g = new THREE.CylinderGeometry(r * (o.taper ?? .92), r, L, seg, Math.max(1, Math.round(L / .25)));
  const P = g.attributes.position, rr = stream('log' + a.join() + b.join()); for (let i = 0; i < P.count; i++) { const y = P.getY(i); P.setX(i, P.getX(i) * (1 + .06 * Math.sin(y * 9 + rr() * 6))); }
  g.computeVertexNormals(); const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), B.clone().sub(A).normalize());
  g.applyQuaternion(q); g.translate((A.x + B.x) / 2, (A.y + B.y) / 2, (A.z + B.z) / 2); return g; }
// a fieldstone: an icosahedron pushed about by noise, flattened, its inner side sooted (vertex colour by the distance to the fire)
function stoneGeo(x, z, s, rr, o = {}) { const g = new THREE.IcosahedronGeometry(1, 1), P = g.attributes.position, ph = rr() * 9;
  for (let i = 0; i < P.count; i++) { const v = new THREE.Vector3().fromBufferAttribute(P, i), k = 1 + .22 * Math.sin(v.x * 3 + ph) * Math.cos(v.z * 2.6 - ph) + .1 * Math.sin(v.y * 5 + ph * 2); v.multiplyScalar(k); P.setXYZ(i, v.x, v.y, v.z); }
  g.scale(s * (o.sx ?? (1 + rr() * .3)), s * (o.sy ?? (.55 + rr() * .2)), s * (o.sz ?? (.85 + rr() * .2))); g.rotateY(rr() * 6.3); g.translate(x, s * (o.sink ?? .25), z);
  g.computeVertexNormals(); const C = [], P2 = g.attributes.position, fire = o.fire || [0, 0];
  for (let i = 0; i < P2.count; i++) { const d = Math.hypot(P2.getX(i) - fire[0], P2.getZ(i) - fire[1]), k = Math.max(.18, Math.min(1, (d - (o.r0 ?? .35)) / .22)); const y = P2.getY(i), top = Math.min(1, Math.max(0, y / (s * .5)));
    const kk = Math.min(k + .4 * (1 - top) * 0, 1); C.push(kk, kk * .97, kk * .94); }
  g.setAttribute('color', new THREE.Float32BufferAttribute(C, 3)); return g; }
function disc(r, y = .004) { const g = new THREE.CircleGeometry(r, 32); g.rotateX(-Math.PI / 2); g.translate(0, y, 0); return g; }
// a sod: a block of turf, grass up (or grass down where it is stacked), its sides earth
function sodGeos(x, z, w, d, t, ry, y0, up = true) { const top = new THREE.BoxGeometry(w, .02, d), body = new THREE.BoxGeometry(w, t - .02, d);
  top.translate(0, up ? t - .01 : .01, 0); body.translate(0, up ? (t - .02) / 2 : .02 + (t - .02) / 2, 0);
  for (const g of [top, body]) { g.rotateY(ry); g.translate(x, y0, z); } return { top, body }; }

// ── the fire ──
export function campfire(o = {}) {
  mats(); const island = o.island || 'gatelands', mode = o.mode || 'island', stage = o.stage || 'lit', K = CAMP_STAGES[stage] ?? 1, rr = stream('fire:' + island + ':' + mode + ':' + (o.seed || 1));
  const B = new Map(), add = (k, g) => { g = g.index ? g.toNonIndexed() : g; for (const a of Object.keys(g.attributes)) if (!['position', 'normal', 'uv', 'color'].includes(a)) g.deleteAttribute(a);
    if (!g.attributes.uv) g.setAttribute('uv', new THREE.Float32BufferAttribute(new Float32Array(g.attributes.position.count * 2), 2)); if (!B.has(k)) B.set(k, []); B.get(k).push(g); };
  const flames = [], smoke = [], parts = [];
  // how burnt the wood is: a log near the heart is charred (and glows by the stage); the outer ends keep their bark until it burns down
  const burnt = stage === 'lit' ? .35 : stage === 'burning' ? .65 : 1, wood = island === 'mark' ? 'pineBark' : 'oakBark';
  const logAt = (a, b, r, kind = wood, split = false) => { const L = Math.hypot(b[0] - a[0], b[2] - a[2]);
    // the half nearer the heart is charred; in embers and out, the whole log is charred and shorter
    const cut = stage === 'embers' || stage === 'out' ? .55 : burnt; const m = [a[0] + (b[0] - a[0]) * cut, a[1] + (b[1] - a[1]) * cut, a[2] + (b[2] - a[2]) * cut];
    add('char', logGeo(a, m, r * (stage === 'out' ? .7 : stage === 'embers' ? .8 : 1), { split }));
    if (stage !== 'embers' && stage !== 'out') add(kind, logGeo(m, b, r, { split })); };
  let pitR = .5, heart = [0, 0];
  if (mode === 'plain') {
    // A: three split logs, their inner ends crossed at the heart, on a scorched patch
    for (let i = 0; i < 3; i++) { const a = i / 3 * Math.PI * 2 + .3 + rr() * .3, L = .62 + rr() * .1; logAt([Math.cos(a) * .06, .07 + i * .03, Math.sin(a) * .06], [Math.cos(a) * L, .06, Math.sin(a) * L], .055 + rr() * .015); }
    add('scorch', disc(.85, .003)); add('ash', disc(.36, .006)); pitR = .45;
    parts.push('3 split logs', 'scorch 1.7 m', 'ash bed');
  } else if (mode === 'ring' || island === 'gatelands') {
    // B, and the Gatelands' C: a ring of fieldstones (C: on the bare earth where the turf was lifted), a teepee of sticks over split logs
    const R = .5, n = 11; for (let i = 0; i < n; i++) { const a = i / n * Math.PI * 2 + rr() * .2; add('stone', stoneGeo(Math.cos(a) * R, Math.sin(a) * R, .11 + rr() * .05, rr, { r0: .35 })); }
    if (mode === 'island') { // the turf lifted in a square of 1.5 m, the earth bare inside, four sods stacked grass-down beside it to put back
      const e = new THREE.PlaneGeometry(1.5, 1.5); e.rotateX(-Math.PI / 2); e.translate(0, .002, 0); add('earth', e);
      // the cut's edge: the turf round it stands 0.05 m proud of the bare earth, its cut face earth and its top the grass
      for (let k = 0; k < 4; k++) { const w = new THREE.BoxGeometry(1.6, .05, .05); w.translate(0, .025, .775); w.rotateY(k * Math.PI / 2); add('earth', w); const t = new THREE.PlaneGeometry(1.6, .05); t.rotateX(-Math.PI / 2); t.translate(0, .051, .775); t.rotateY(k * Math.PI / 2); add('sodTop', t); }
      for (let k = 0; k < 4; k++) { const s = sodGeos(1.3 + (k % 2) * .02, .05 - k * .012, .48, .34, .06, .1 + k * .06, k * .06, k === 3); add('sodTop', s.top); add('earth', s.body); }
      parts.push('turf lifted, 1.5 m square', '4 sods stacked to put back');
    }
    for (let i = 0; i < 2; i++) { const a = i * Math.PI / 2 + .4; logAt([Math.cos(a) * -.3, .05, Math.sin(a) * -.3], [Math.cos(a) * .3, .05, Math.sin(a) * .3], .05, wood, true); }
    if (stage === 'lit' || stage === 'burning') for (let i = 0; i < 7; i++) { const a = i / 7 * Math.PI * 2 + rr() * .3, L = .34 + rr() * .06; logAt([Math.cos(a) * L, .02, Math.sin(a) * L], [Math.cos(a) * .03, .42 - (stage === 'burning' ? .12 : 0) + rr() * .04, Math.sin(a) * .03], .022 + rr() * .01); }
    else for (let i = 0; i < 4; i++) { const a = i / 4 * Math.PI * 2 + rr(); add('char', logGeo([Math.cos(a) * .25, .02, Math.sin(a) * .25], [Math.cos(a) * .05, .05, Math.sin(a) * .05], .02)); }
    add('ash', disc(.38, .006)); if (mode !== 'island') add('scorch', disc(.75, .003)); pitR = .4;
    parts.push('11 fieldstones, ring 1.0 m', 'teepee of 7 sticks over 2 split logs');
  } else if (island === 'mark') {
    // the Mark's long fire: two pine logs 1.5 m side by side, a third laid on their seam, on three flat stones; it burns along the seam
    const L = 1.5, r = .12; heart = [0, 0];
    add('stone', stoneGeo(-.55, 0, .16, rr, { sy: .3, sink: .05, r0: .2 })); add('stone', stoneGeo(.55, 0, .16, rr, { sy: .3, sink: .05, r0: .2 })); add('stone', stoneGeo(0, -.05, .14, rr, { sy: .28, sink: .05, r0: .2 }));
    const charB = stage === 'lit' ? .25 : stage === 'burning' ? .5 : 1;
    for (const [z, y, rad] of [[-.12, .14, r], [.12, .14, r], [0, .36, r * .85]]) { const dz = Math.sign(z) * (stage === 'embers' || stage === 'out' ? .03 : 0);
      // the logs char along the seam: a log is drawn as bark with a charred strip toward the seam (a second, thinner charred log inside)
      if (charB < 1) add(wood, logGeo([-L / 2, y, z], [L / 2, y, z], rad * (stage === 'burning' && y > .3 ? .85 : 1)));
      add('char', logGeo([-L / 2 + .06, y + (z ? .01 : -.03), z * .7 - dz], [L / 2 - .06, y + (z ? .01 : -.03), z * .7 - dz], rad * (charB < 1 ? .9 + .1 * charB : stage === 'out' ? .7 : .85)));
      // cut ends: the rings
      if (charB < 1) for (const x of [-L / 2, L / 2]) { const c = new THREE.CircleGeometry(rad * .98, 10); c.rotateY(x > 0 ? Math.PI / 2 : -Math.PI / 2); c.translate(x, y, z); add('end', c); } }
    if (stage === 'out') { /* the top log burnt through: only the two below remain */ }
    const ash = disc(.5, .006); ash.scale(1.8, 1, .7); add('ash', ash); const sc = disc(.8, .003); sc.scale(1.5, 1, .8); add('scorch', sc); pitR = .7;
    parts.push('long fire: 2 pine logs 1.5 m, a third on the seam', '3 flat stones under');
  } else {
    // Aurenne's keyhole: a round pit of 0.8 m and a slot 0.5 m long, edged with flat limestone, the coals raked into the slot under a grill
    const R = .42; let n = 12; for (let i = 0; i < n; i++) { const a = i / n * Math.PI * 2; if (Math.abs(((a - Math.PI / 2 + Math.PI * 3) % (Math.PI * 2)) - Math.PI) < .45) continue;
      add('lime', stoneGeo(Math.cos(a) * R, Math.sin(a) * R, .12 + rr() * .03, rr, { sy: .45, sx: 1.3, sink: .18, r0: .3 })); }
    for (const s of [-1, 1]) for (let j = 0; j < 3; j++) add('lime', stoneGeo(s * .17, .48 + j * .17, .1 + rr() * .02, rr, { sy: .5, sx: 1.2, sink: .18, r0: .1 }));
    const pit = disc(.4, .005), slot = new THREE.PlaneGeometry(.26, .55); slot.rotateX(-Math.PI / 2); slot.translate(0, .006, .62); add('ash', pit); add('ash', slot);
    // the grill: an iron frame of four legs and seven bars over the slot, 0.16 m up
    { const gy = .16, x0 = -.15, x1 = .15, z0 = .44, z1 = .8; add('iron', logGeo([x0, gy, z0], [x0, gy, z1], .008)); add('iron', logGeo([x1, gy, z0], [x1, gy, z1], .008));
      for (let k = 0; k < 7; k++) { const z = z0 + .02 + (z1 - z0 - .04) * k / 6; add('iron', logGeo([x0, gy, z], [x1, gy, z], .005)); }
      for (const [x, z] of [[x0, z0], [x1, z0], [x0, z1], [x1, z1]]) add('iron', logGeo([x, 0, z], [x, gy, z], .008)); }
    // olive and brush: thin, crooked, laid crisscross
    if (stage === 'lit' || stage === 'burning') for (let i = 0; i < 9; i++) { const a = rr() * Math.PI, L = .26 + rr() * .1, y = .03 + i * .018; logAt([Math.cos(a) * L, y, Math.sin(a) * L - .02], [-Math.cos(a) * L, y + .02, -Math.sin(a) * L - .02], .018 + rr() * .012); }
    else for (let i = 0; i < 5; i++) { const a = rr() * Math.PI; add('char', logGeo([Math.cos(a) * .2, .02, Math.sin(a) * .2], [-Math.cos(a) * .15, .03, -Math.sin(a) * .15], .016)); }
    const sc = disc(.75, .003); add('scorch', sc); pitR = .36;
    parts.push('keyhole: pit 0.8 m, slot 0.55 m, 22 flat limestones', 'iron grill 0.3 × 0.36 m, 0.16 m up', 'olive brush');
  }
  // flames by the stage: tall in the heart when lit, lower burning, licks over the coals in embers; along the seam for the long fire
  if (K > 0) { const L = []; const n = island === 'mark' && mode === 'island' ? 9 : 6;
    for (let i = 0; i < n; i++) { const t = (i + .5) / n, mk = island === 'mark' && mode === 'island';
      const x = mk ? (t - .5) * 1.25 : (rr() - .5) * pitR * .7, z = mk ? (rr() - .5) * .08 : (rr() - .5) * pitR * .7, cen = mk ? 1 - Math.abs(t - .5) * .9 : 1 - Math.hypot(x, z) / pitR;
      const hgt = (mk ? .55 : island === 'aurenne' && mode === 'island' ? .5 : .75) * K * (.55 + .5 * cen) * (mk ? .45 + .9 * rr() : .8 + .4 * rr()), w = Math.max(.12, (mk ? .28 : .3) * (.6 + .5 * K));
      L.push([x, mk ? .3 : .05, z, Math.max(.08, hgt), w, rr()]); }
    if (mode === 'island' && island === 'aurenne') L.push([0, .08, .6, .1 * K + .03, .18, rr()]);
    const g = flameGeo(L); const fm = new THREE.Mesh(g, M.flame); fm.renderOrder = 5; fm.name = 'fire:flames'; flames.push(fm); }
  M.char.emissiveIntensity = { lit: .9, burning: 1.4, embers: 2.2, out: 0 }[stage];
  M.ash.emissiveIntensity = { lit: .8, burning: 1.3, embers: 2.4, out: 0 }[stage];
  // the light: a warm point at the heart, as bright as the flames are tall; in embers a dull red
  const light = new THREE.PointLight(stage === 'embers' ? 0xff5a1a : 0xff9a40, { lit: 9, burning: 7, embers: 2.2, out: 0 }[stage], 9, 1.6);
  light.position.set(heart[0], island === 'mark' && mode === 'island' ? .6 : .5, heart[1]);
  const group = new THREE.Group(); group.name = 'campfire'; let tris = 0;
  for (const [k, gs] of B) { const g = mergeGeometries(gs); const m = new THREE.Mesh(g, M[k]); m.name = 'fire:' + k; m.castShadow = !['ash', 'scorch', 'earth'].includes(k); m.receiveShadow = true;
    if (k === 'ash' || k === 'scorch') m.renderOrder = 1; group.add(m); tris += g.attributes.position.count / 3; }
  flames.forEach(f => { group.add(f); tris += f.geometry.attributes.position.count / 3; });
  if (K > 0 || stage === 'out') { const n = stage === 'out' ? 3 : 7; for (let i = 0; i < n; i++) { const s = new THREE.Sprite(M.smoke.clone()); const h = .9 + i * .45 + rr() * .2;
      s.position.set(heart[0] + Math.sin(i * 1.3) * .08 * i, h, heart[1] + i * .07); s.scale.setScalar(.35 + i * .22); s.material.opacity = (stage === 'out' ? .1 : .2) * (1 - i / n); smoke.push(s); group.add(s); } }
  if (K > 0) group.add(light);
  const tick = t => { M.flame.uniforms.uT.value = t; light.intensity = ({ lit: 9, burning: 7, embers: 2.2, out: 0 }[stage]) * (1 + .12 * Math.sin(t * 13) + .07 * Math.sin(t * 29 + 1)); smoke.forEach((s, i) => { s.position.y = (.9 + ((i * .45 + t * .35) % (smoke.length * .45))); }); };
  return { group, tris: Math.round(tris), draws: B.size + flames.length + smoke.length, light, tick, foot: island === 'mark' && mode === 'island' ? .9 : island === 'aurenne' && mode === 'island' ? .9 : .75, parts };
}

// ── the stump ──
// The tree is felled the way a hatchet fells it: a notch on the side it falls to (the face cut down at 45° to a flat), then the back cut
// from the far side a hand higher; the last wood between them tears, and leaves a step with splinters standing. Root flare into the turf.
export function stump(o = {}) {
  mats(); const kind = o.kind || 'oak', R = o.r ?? (kind === 'oak' ? .34 : kind === 'pine' ? .26 : .16), rr = stream('stump:' + kind + ':' + (o.seed || 1));
  const H = kind === 'birch' ? .38 : kind === 'pine' ? .5 : .46, notchY = H - .02, backY = H + R * .22, NR = kind === 'birch' ? 12 : 16, NS = 6;
  const bark = kind === 'oak' ? 'oakBark' : kind === 'pine' ? 'pineBark' : 'birchBark';
  const B = new Map(), add = (k, g) => { g = g.index ? g.toNonIndexed() : g; if (!g.attributes.uv) g.setAttribute('uv', new THREE.Float32BufferAttribute(new Float32Array(g.attributes.position.count * 2), 2)); if (!B.has(k)) B.set(k, []); B.get(k).push(g); };
  // the radius at height y and angle a: the root flare (oak most, birch least) and buttresses toward four or five roots
  const nRoot = kind === 'birch' ? 3 : 5, ph = rr() * 6, flare = kind === 'oak' ? 1.0 : kind === 'pine' ? .7 : .35;
  const rad = (y, a) => R * (1 + flare * Math.exp(-y / .12) * (.55 + .45 * Math.max(0, Math.cos(a * nRoot + ph)) ** 2) + .03 * Math.sin(a * 7 + ph));
  // the top of the stump at angle a: the face (x > 0) is the notch's flat at notchY, the back (x < 0) the back cut at backY, the hinge
  // between them a step; the face side's front edge chamfered down where the notch's 45° face ran out
  const topAt = a => { const x = Math.sin(a); return x > .12 ? notchY : x < -.12 ? backY : notchY + (backY - notchY) * (.12 - x) / .24; };
  const P = [], U = [];
  for (let i = 0; i < NS; i++) for (let k = 0; k < NR; k++) { const quad = [[i, k], [i + 1, k], [i + 1, k + 1], [i, k + 1]].map(([ii, kk]) => { const a = kk / NR * Math.PI * 2, t = ii / NS, y = -.12 + (topAt(a) + .12) * t, r = rad(Math.max(0, y), a);
      return [[r * Math.sin(a), y, r * Math.cos(a)], [kk / NR * Math.max(2, Math.round(R * 14)), y * 3.2]]; });
    for (const j of [0, 1, 2, 0, 2, 3]) { P.push(...quad[j][0]); U.push(...quad[j][1]); } }
  { const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(U, 2)); g.computeVertexNormals(); add(bark, g); }
  // the roots: four or five tapering cylinders running out and down into the ground
  for (let k = 0; k < nRoot; k++) { const a = k / nRoot * Math.PI * 2 - ph / nRoot + (rr() - .5) * .3, L = R * (.7 + rr() * .5) * flare + .08;
    add(bark, logGeo([Math.sin(a) * R * .45, .2, Math.cos(a) * R * .45], [Math.sin(a) * (R + L), -.06, Math.cos(a) * (R + L)], R * .32 * (.6 + flare * .4), { taper: .35 })); }
  // the two cut faces: discs with the rings, each clipped to its half; the hinge's splinters between them
  const face = (side, y) => { const E = [], EU = []; for (let k = 0; k < NR; k++) { const a0 = k / NR * Math.PI * 2, a1 = (k + 1) / NR * Math.PI * 2, x0 = Math.sin(a0), x1 = Math.sin(a1);
      if (side > 0 ? (x0 < .12 && x1 < .12) : (x0 > -.12 && x1 > -.12)) continue;
      const c = [side * R * .06, y, 0], p0 = [rad(y, a0) * .97 * x0, topAt(a0), rad(y, a0) * .97 * Math.cos(a0)], p1 = [rad(y, a1) * .97 * x1, topAt(a1), rad(y, a1) * .97 * Math.cos(a1)];
      for (const p of [c, p1, p0]) { E.push(...p); EU.push(.5 + p[0] / (R * 2.1), .5 + p[2] / (R * 2.1)); } }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(E, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(EU, 2)); g.computeVertexNormals(); add('end', g); };
  face(1, notchY); face(-1, backY);
  // the hinge: a band of torn fibres standing across the stump, from the notch's flat up past the back cut
  for (let k = 0; k < 7; k++) { const z = (k / 6 - .5) * R * 1.5, h = (backY - notchY) + R * (.02 + rr() * .1), w = .01 + rr() * .015;
    const g = new THREE.BoxGeometry(w, h, .02 + rr() * .02); g.translate(0, h / 2, 0); g.rotateZ((rr() - .3) * .25); g.translate((rr() - .5) * .03, notchY, z); add('split', g); }
  // a few chips on the turf on the notch side, where they flew
  for (let k = 0; k < (kind === 'birch' ? 5 : 9); k++) { const a = (rr() - .5) * 1.6 + Math.PI / 2, d = R + .2 + rr() * .7, g = new THREE.BoxGeometry(.05 + rr() * .04, .012, .03 + rr() * .02);
    g.rotateY(rr() * 6); g.rotateZ((rr() - .5) * .4); g.translate(Math.sin(a) * d, .008, Math.cos(a) * d); add('split', g); }
  const group = new THREE.Group(); group.name = 'stump:' + kind; let tris = 0;
  for (const [k, gs] of B) { const g = mergeGeometries(gs); const m = new THREE.Mesh(g, M[k]); m.name = 'stump:' + k; m.castShadow = m.receiveShadow = true; group.add(m); tris += g.attributes.position.count / 3; }
  return { group, tris: Math.round(tris), draws: B.size, h: backY, r: R };
}
