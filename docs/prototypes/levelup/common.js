// Shared kit for the level-up slices (Session 769): renderer and post, seeded noise, painted textures with normal maps
// made from their own height, a sky dome, cumulus, leaf-card trees, a loader for rigged characters.
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { ImprovedNoise } from 'three/addons/math/ImprovedNoise.js';

export const Q = new URLSearchParams(location.search);
export const STILL = Q.has('still');
export const W = +(Q.get('w') || innerWidth), H = +(Q.get('h') || innerHeight);
export const STATS = window.__stats = {};

// ── random and noise ──
let seed = +(Q.get('seed') || 11);
export const rnd = () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;
export const reseed = s => { seed = s; };
const PN = new ImprovedNoise();
export const n2 = (x, z) => PN.noise(x, z, 0.37);
export const fbm = (x, z, o = 5) => { let a = 0, f = 1, m = 1, s = 0; for (let i = 0; i < o; i++) { a += m * n2(x * f, z * f); s += m; f *= 2.03; m *= .5; } return a / s; };
export const sstep = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
export const mix = (a, b, t) => a + (b - a) * t;
export const GLSL_NOISE = `
float h12(vec2 p){ p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
float vn(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f); return mix(mix(h12(i), h12(i + vec2(1,0)), f.x), mix(h12(i + vec2(0,1)), h12(i + vec2(1,1)), f.x), f.y); }
float fb(vec2 p){ float a = 0., m = .5; for (int i = 0; i < 5; i++) { a += m * vn(p); p = p * 2.03 + 17.1; m *= .5; } return a; }
`;

// ── renderer and post ──
export function makeRenderer(exposure = .85) {
  const R = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true, powerPreference: 'high-performance' });
  R.setPixelRatio(STILL ? 1 : Math.min(devicePixelRatio, +(Q.get('dpr') || 1.5))); R.setSize(W, H, !STILL);
  R.toneMapping = THREE.ACESFilmicToneMapping; R.toneMappingExposure = exposure;
  R.shadowMap.enabled = true; R.shadowMap.type = THREE.PCFSoftShadowMap;
  document.body.appendChild(R.domElement); return R;
}
export function makeComposer(R, scene, cam, o = {}) {
  const comp = new EffectComposer(R); comp.setSize(W, H);
  comp.addPass(new RenderPass(scene, cam));
  comp.addPass(new UnrealBloomPass(new THREE.Vector2(W, H), o.bloom ?? .22, o.bloomR ?? .6, o.bloomT ?? .92));
  comp.addPass(new ShaderPass({ uniforms: { tDiffuse: { value: null }, uCool: { value: new THREE.Vector3(...(o.cool || [.94, .98, 1.06])) }, uWarm: { value: new THREE.Vector3(...(o.warm || [1.06, 1.0, .91])) }, uSat: { value: o.sat ?? 1.12 }, uVig: { value: o.vig ?? .32 } },
    vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }',
    fragmentShader: `uniform sampler2D tDiffuse; uniform vec3 uCool, uWarm; uniform float uSat, uVig; varying vec2 vUv;
      void main(){ vec3 c = texture2D(tDiffuse, vUv).rgb; float l = dot(c, vec3(.2126,.7152,.0722));
        c *= mix(uCool, uWarm, smoothstep(.02, .6, l)); c = mix(vec3(l), c, uSat);
        vec2 q = vUv - .5; c *= 1. - uVig * dot(q, q) * 2.; gl_FragColor = vec4(c, 1.); }` }));
  comp.addPass(new OutputPass()); return comp;
}

// ── textures: painted on a canvas from a height field, with a normal map from the same height ──
function finishTex(cv, srgb) { const t = new THREE.CanvasTexture(cv); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 8; t.colorSpace = srgb ? THREE.SRGBColorSpace : THREE.NoColorSpace; return t; }
export function texPair(N, fn, strength = 2.5) {
  const hgt = new Float32Array(N * N), col = new Uint8ClampedArray(N * N * 4);
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) { const r = fn(x / N, y / N); const i = y * N + x; hgt[i] = r[0]; col[i * 4] = r[1] * 255; col[i * 4 + 1] = r[2] * 255; col[i * 4 + 2] = r[3] * 255; col[i * 4 + 3] = 255; }
  const nor = new Uint8ClampedArray(N * N * 4), at = (x, y) => hgt[((y + N) % N) * N + ((x + N) % N)];
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) { const dx = (at(x + 1, y) - at(x - 1, y)) * strength, dy = (at(x, y + 1) - at(x, y - 1)) * strength, l = Math.hypot(dx, dy, 1), i = (y * N + x) * 4;
    nor[i] = (-dx / l * .5 + .5) * 255; nor[i + 1] = (dy / l * .5 + .5) * 255; nor[i + 2] = (1 / l * .5 + .5) * 255; nor[i + 3] = 255; }
  const mk = (data, srgb) => { const c = document.createElement('canvas'); c.width = c.height = N; c.getContext('2d').putImageData(new ImageData(data, N, N), 0, 0); return finishTex(c, srgb); };
  return { map: mk(col, true), normalMap: mk(nor, false) };
}
// tileable value noise for the painters
function tn(x, y, f, s = 0) { const X = x * f, Y = y * f, i = Math.floor(X), j = Math.floor(Y), u = X - i, v = Y - j, h = (a, b) => { a = ((a % f) + f) % f; b = ((b % f) + f) % f; let n = a * 374761393 + b * 668265263 + s * 982451653; n = (n ^ (n >>> 13)) * 1274126177; return ((n ^ (n >>> 16)) >>> 0) / 4294967295; };
  const su = u * u * (3 - 2 * u), sv = v * v * (3 - 2 * v); return mix(mix(h(i, j), h(i + 1, j), su), mix(h(i, j + 1), h(i + 1, j + 1), su), sv); }
const tfbm = (x, y, f, o = 4, s = 0) => { let a = 0, m = .5, t = 0; for (let k = 0; k < o; k++) { a += m * tn(x, y, f, s + k); t += m; f *= 2; m *= .5; } return a / t; };
// a tileable Voronoi: [distance to nearest, to second, cell id]
function vor(x, y, n, s) { let d1 = 9, d2 = 9, id = 0; const X = x * n, Y = y * n, i = Math.floor(X), j = Math.floor(Y);
  for (let b = -1; b <= 1; b++) for (let a = -1; a <= 1; a++) { const ci = i + a, cj = j + b, wi = ((ci % n) + n) % n, wj = ((cj % n) + n) % n, h = tn(wi / n + .001, wj / n + .001, 997, s), h2 = tn(wi / n + .37, wj / n + .11, 991, s + 3);
    const px = ci + .15 + .7 * h, py = cj + .15 + .7 * h2, d = Math.hypot(px - X, py - Y); if (d < d1) { d2 = d1; d1 = d; id = wi * 131 + wj; } else if (d < d2) d2 = d; }
  return [d1, d2, id]; }
const idr = id => { let n = (id * 2654435761) >>> 0; n ^= n >>> 15; return (n % 1000) / 1000; };

export const TEX = {};
export function buildTextures() {
  TEX.plaster = texPair(256, (x, y) => { const n = tfbm(x, y, 6, 5), s = tfbm(x, y, 3, 3, 9); const h = n * .5 + tfbm(x, y, 24, 3, 4) * .3; const c = .93 - .08 * s - .05 * tn(x, y, 40, 2); return [h, c, c * .975, c * .93]; }, 1.2);
  TEX.cobble = texPair(512, (x, y) => { const [d1, d2, id] = vor(x, y, 9, 5), e = d2 - d1, r = idr(id), dome = Math.min(1, e * 6) ** .5, n = tfbm(x, y, 32, 3, r * 9);
    const mortar = e < .07; const h = mortar ? .05 * n : dome * (.75 + .25 * n); const g = mortar ? [.22, .2, .16] : [.40 + .16 * r + .1 * n, .38 + .13 * r + .08 * n, .34 + .1 * r + .06 * n]; return [h, ...g]; }, 3.2);
  TEX.stone = texPair(512, (x, y) => { const rows = 7, row = Math.floor(y * rows), ry = y * rows - row, off = tn(row / rows, .3, 997, 7) * .9, cols = 4, xx = x * cols + off * (row % 2 ? 1 : .5), col = Math.floor(xx), rx = xx - col;
    const id = ((row % rows) * 31 + ((col % cols) + cols) % cols * 7), r = idr(id + 3), edge = Math.min(rx, 1 - rx, ry * 1.6, (1 - ry) * 1.6), n = tfbm(x, y, 16, 4, r * 5);
    const gap = edge < .045; const h = gap ? 0 : Math.min(1, edge * 7) * (.7 + .3 * n); const v = .45 + .17 * r + .12 * n; return [h, ...(gap ? [.2, .19, .17] : [v * 1.02, v * .99, v * .93])]; }, 2.6);
  TEX.lichen = texPair(512, (x, y) => { const rows = 5, row = Math.floor(y * rows), ry = y * rows - row, cols = 3, xx = x * cols + (row % 2) * .5, col = Math.floor(xx), rx = xx - col, r = idr(row * 17 + ((col % cols) + cols) % cols);
    const edge = Math.min(rx, 1 - rx, ry, 1 - ry), n = tfbm(x, y, 12, 5, 3), l = tfbm(x, y, 7, 4, 8), gap = edge < .03; const h = gap ? 0 : Math.min(1, edge * 9) * (.6 + .4 * n);
    let c = [.56 + .08 * r, .56 + .07 * r, .53 + .05 * r]; const lich = Math.max(0, l - .52) * 4; c = c.map((v, i) => mix(v, [.52, .58, .38][i], Math.min(1, lich))); if (gap) c = [.22, .22, .2]; return [h, ...c.map(v => v * (.85 + .3 * n))]; }, 2.2);
  TEX.thatch = texPair(256, (x, y) => { const s = tn(x, y * .08, 64, 4), course = (y * 6) % 1, n = tfbm(x, y, 8, 3, 2), h = s * .7 + (1 - course) * .3; const c = .55 + .25 * s; return [h, c * .93 + .05 * n, c * .74 + .04 * n, c * .42]; }, 2.4);
  TEX.slate = texPair(256, (x, y) => { const rows = 10, row = Math.floor(y * rows), ry = y * rows - row, xx = x * 6 + (row % 2) * .5, col = Math.floor(xx), rx = xx - col, r = idr(row * 13 + ((col % 6) + 6) % 6);
    const gap = rx < .04 || rx > .96; const h = gap ? 0 : ry * .8 + .2 * tfbm(x, y, 20, 2, r); const v = .26 + .08 * r; return [h, ...(gap ? [.1, .1, .11] : [v * .92, v * .98, v * 1.1])]; }, 3);
  TEX.wood = texPair(256, (x, y) => { const p = 5, pl = Math.floor(x * p), px = x * p - pl, r = idr(pl + 1), g = Math.sin((y * 14 + tfbm(x, y, 4, 3, pl) * 3 + r * 6) * Math.PI * 2) * .5 + .5, gap = px < .03;
    const h = gap ? 0 : .6 + .25 * g; const v = .33 + .1 * r + .06 * g; return [h, ...(gap ? [.08, .06, .05] : [v * 1.0, v * .74, v * .52])]; }, 2);
  TEX.beam = texPair(256, (x, y) => { const g = Math.sin((x * 3 + tfbm(x, y, 3, 3, 4) * 4) * Math.PI * 2) * .5 + .5, n = tfbm(x, y, 18, 3, 5); const v = .16 + .05 * g + .04 * n; return [g * .5 + n * .5, v * 1.15, v * .82, v * .62]; }, 1.6);
  TEX.flag = texPair(512, (x, y) => { const rows = 4, row = Math.floor(y * rows), ry = y * rows - row, xx = x * 3 + (row % 2) * .5, col = Math.floor(xx), rx = xx - col, r = idr(row * 7 + ((col % 3) + 3) % 3);
    const edge = Math.min(rx, 1 - rx, ry, 1 - ry), n = tfbm(x, y, 14, 4, r * 3), gap = edge < .025; const h = gap ? 0 : Math.min(1, edge * 6) * (.8 + .2 * n); const v = .3 + .1 * r + .1 * n; return [h, ...(gap ? [.06, .06, .06] : [v * .95, v * .97, v])]; }, 2.4);
  for (const k in TEX) { TEX[k].map.repeat.set(1, 1); }
}
export function mat(tex, o = {}) { return new THREE.MeshStandardMaterial({ map: TEX[tex].map, normalMap: TEX[tex].normalMap, normalScale: new THREE.Vector2(o.ns ?? 1, o.ns ?? 1), roughness: o.rough ?? .9, metalness: 0, color: o.color ?? 0xffffff }); }

// UVs from position by the face's major axis, so a texture keeps its scale on any box; `along` sends v down the slope
export function worldUV(g, s = 1, o = {}) {
  const P = g.attributes.position, N = g.attributes.normal, uv = new Float32Array(P.count * 2);
  for (let i = 0; i < P.count; i++) { const x = P.getX(i), y = P.getY(i), z = P.getZ(i), ax = Math.abs(N.getX(i)), ay = Math.abs(N.getY(i)), az = Math.abs(N.getZ(i));
    let u, v; if (ay >= ax && ay >= az) { [u, v] = o.slopeX ? [z, x] : [x, z]; } else if (ax >= az) { u = z; v = y; } else { u = x; v = y; }
    uv[i * 2] = u * s; uv[i * 2 + 1] = v * s; }
  g.setAttribute('uv', new THREE.BufferAttribute(uv, 2)); return g;
}

// ── sky and cloud ──
export function skyDome(scene, sunDir, o = {}) {
  const F = a => (Array.isArray(a) ? a : [a]).map(v => Number(v).toFixed(4)).join(', ');
  const zen = o.zen || [.09, .25, .62], mid = o.mid || [.30, .52, .86], hor = o.hor || [.74, .83, .93], glow = o.glow || [1, .82, .55];
  const m = new THREE.Mesh(new THREE.SphereGeometry(26000, 48, 24), new THREE.ShaderMaterial({ side: THREE.BackSide, depthWrite: false, fog: false, uniforms: { uSun: { value: sunDir } },
    vertexShader: 'varying vec3 vD; void main(){ vD = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }',
    fragmentShader: `uniform vec3 uSun; varying vec3 vD; void main(){ float y = max(vD.y, 0.);
      vec3 c = mix(vec3(${F(hor)}), vec3(${F(mid)}), smoothstep(0., .18, y)); c = mix(c, vec3(${F(zen)}), smoothstep(.15, .75, y));
      float sd = max(dot(normalize(vD), normalize(uSun)), 0.); c += vec3(${F(glow)}) * (pow(sd, 6.) * ${F(o.glowK ?? .35)} + pow(sd, 900.) * 18.);
      c = mix(c, vec3(${F(hor)}) * .9, smoothstep(0., -.08, vD.y)); gl_FragColor = vec4(c * ${F(o.k ?? 1.15)}, 1.); }` }));
  scene.add(m); return m;
}
let _puff = null;
export function puffTex() { if (_puff) return _puff; const c = document.createElement('canvas'); c.width = c.height = 128; const x = c.getContext('2d'), g = x.createRadialGradient(64, 64, 4, 64, 64, 62);
  g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(.55, 'rgba(255,255,255,.85)'); g.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = g; x.fillRect(0, 0, 128, 128); _puff = new THREE.CanvasTexture(c); _puff.colorSpace = THREE.SRGBColorSpace; return _puff; }
export function clouds(scene, sunDir, o = {}) {
  const sunH = new THREE.Vector3(sunDir.x, 0, sunDir.z).normalize(), lo = o.lo || [.62, .68, .82], hi = o.hi || [1.35, 1.32, 1.26];
  for (let k = 0; k < (o.n ?? 30); k++) { const a = (o.a0 ?? -1.2) + rnd() * (o.aw ?? 2.4), dist = (o.d0 ?? 2600) + rnd() * (o.dw ?? 6500), cx = (o.cx ?? 0) + Math.sin(a) * dist, cz = (o.cz ?? 0) - Math.cos(a) * dist, cy = (o.y0 ?? 380) + rnd() * 380 + dist * .05, size = 160 + rnd() * 260;
    const N = 40 + Math.floor(rnd() * 34); for (let i = 0; i < N; i++) { const ox = (rnd() - .5) * size * 2.2, oz = (rnd() - .5) * size * 1.2, oy = Math.max(0, 1 - Math.hypot(ox / (size * 1.1), oz / (size * .6))) * size * (.6 + rnd() * .7);
      const t = sstep(0, size * .9, oy), side = (ox * sunH.x + oz * sunH.z) / size * .25;
      const c = new THREE.Color().setRGB(mix(lo[0], hi[0], t) + side * .25, mix(lo[1], hi[1], t) + side * .2, mix(lo[2], hi[2], t) + side * .1);
      const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: puffTex(), color: c, transparent: true, depthWrite: false, fog: false, opacity: o.op ?? .9 }));
      sp.position.set(cx + ox, cy + oy, cz + oz); sp.scale.setScalar(size * (.42 + rnd() * .42)); scene.add(sp); STATS.puffs = (STATS.puffs || 0) + 1; } }
}

// ── trees: leaf cards around clumps, normals turned out from the crown ──
let _leaf = null;
export function leafTex() { if (_leaf) return _leaf; const c = document.createElement('canvas'); c.width = c.height = 256; const x = c.getContext('2d');
  for (let i = 0; i < 260; i++) { const a = rnd() * Math.PI * 2, r = Math.sqrt(rnd()) * 104, cx = 128 + Math.cos(a) * r, cy = 128 + Math.sin(a) * r * .9, s = 11 + rnd() * 9, l = 32 + rnd() * 36;
    x.save(); x.translate(cx, cy); x.rotate(rnd() * Math.PI * 2); x.fillStyle = `hsl(${88 + rnd() * 22},${42 + rnd() * 18}%,${l}%)`; x.beginPath(); x.ellipse(0, 0, s, s * .55, 0, 0, Math.PI * 2); x.fill(); x.restore(); }
  _leaf = new THREE.CanvasTexture(c); _leaf.colorSpace = THREE.SRGBColorSpace; _leaf.anisotropy = 4; return _leaf; }
export const WIND = { value: 2.3 };
export const windVS = (amp, freq) => `
  vec4 wpI = modelMatrix * instanceMatrix * vec4(0., 0., 0., 1.);
  float sway = sin(uWind * ${freq} + wpI.x * .11 + wpI.z * .07) * .6 + sin(uWind * ${freq} * 2.3 + wpI.x * .37) * .25;
  transformed.x += sway * ${amp} * position.y * position.y; transformed.z += sway * ${amp} * .5 * position.y * position.y;`;
export function treeKit(sunDir) {
  const barkMat = new THREE.MeshStandardMaterial({ color: new THREE.Color(.20, .14, .10), roughness: .95 });
  const leafMat = new THREE.MeshStandardMaterial({ map: leafTex(), alphaTest: .42, side: THREE.DoubleSide, vertexColors: true, roughness: .78 });
  leafMat.onBeforeCompile = s => { s.uniforms.uWind = WIND; s.vertexShader = 'uniform float uWind;\n' + s.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>' + windVS(.004, .9)); s.fragmentShader = s.fragmentShader.replace('#include <normal_fragment_begin>', '#include <normal_fragment_begin>\n normal = normalize(vNormal);'); };
  const leafDepth = new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking, map: leafTex(), alphaTest: .42 });
  function template(kind) {
    const parts = [], cards = { pos: [], nor: [], uv: [], col: [], idx: [] };
    const trunkH = kind === 1 ? 7 : 5, crownY = trunkH + (kind === 1 ? 3.5 : 3), crownR = kind === 1 ? 4.2 : 5.5;
    const trunk = new THREE.CylinderGeometry(.28, .5, trunkH + 1.5, 7, 3); trunk.translate(0, (trunkH + 1.5) / 2 - .4, 0); parts.push(trunk.toNonIndexed());
    for (let b = 0; b < 4; b++) { const br = new THREE.CylinderGeometry(.09, .2, 3.4, 5); br.translate(0, 1.7, 0); br.rotateZ(.75 + rnd() * .3); br.rotateY(b * Math.PI / 2 + rnd()); br.translate(0, trunkH - .6 + rnd() * .8, 0); parts.push(br.toNonIndexed()); }
    const clumps = [], nC = kind === 1 ? 5 : 7;
    for (let c = 0; c < nC; c++) { const a = c / nC * Math.PI * 2 + rnd(), r = crownR * (.35 + .25 * rnd()); clumps.push([Math.cos(a) * r, crownY + (rnd() - .3) * crownR * (kind === 1 ? 1.3 : .7), Math.sin(a) * r, crownR * (.55 + .2 * rnd())]); }
    clumps.push([0, crownY + crownR * .45, 0, crownR * .7]);
    const ctr = new THREE.Vector3(0, crownY, 0), v = new THREE.Vector3(), nrm = new THREE.Vector3(), q = new THREE.Quaternion(), e = new THREE.Euler();
    for (const [cx, cy, cz, cr] of clumps) for (let i = 0; i < 22; i++) {
      const d = new THREE.Vector3(rnd() - .5, rnd() - .5, rnd() - .5).normalize(), p = new THREE.Vector3(cx, cy, cz).addScaledVector(d, cr * (.55 + .45 * Math.sqrt(rnd())));
      e.set(rnd() * 6.3, rnd() * 6.3, rnd() * 6.3); q.setFromEuler(e); const s = 2.3 + rnd() * 1.1, base = cards.pos.length / 3;
      for (const [a, b, uu, vv] of [[-1, -1, 0, 0], [1, -1, 1, 0], [1, 1, 1, 1], [-1, 1, 0, 1]]) { v.set(a * s * .5, b * s * .5, 0).applyQuaternion(q).add(p); cards.pos.push(v.x, v.y, v.z);
        nrm.subVectors(v, ctr).normalize().multiplyScalar(.7).add(new THREE.Vector3().subVectors(v, new THREE.Vector3(cx, cy, cz)).normalize().multiplyScalar(.3)).normalize(); cards.nor.push(nrm.x, nrm.y, nrm.z); cards.uv.push(uu, vv);
        const ao = .45 + .55 * sstep(-crownR, crownR * .9, v.y - crownY + (v.x * sunDir.x + v.z * sunDir.z) * .4); cards.col.push(ao, ao, ao); }
      cards.idx.push(base, base + 1, base + 2, base, base + 2, base + 3); }
    const lg = new THREE.BufferGeometry(); lg.setAttribute('position', new THREE.Float32BufferAttribute(cards.pos, 3)); lg.setAttribute('normal', new THREE.Float32BufferAttribute(cards.nor, 3)); lg.setAttribute('uv', new THREE.Float32BufferAttribute(cards.uv, 2)); lg.setAttribute('color', new THREE.Float32BufferAttribute(cards.col, 3)); lg.setIndex(cards.idx);
    return { trunk: mergeGeometries(parts), leaves: lg };
  }
  const T = [template(0), template(1)];
  // plant: list of [x, y, z, scale, rotY, tint THREE.Color]
  function plant(scene, list) {
    const by = [[], []]; list.forEach(t => by[t[6] ?? (rnd() < .65 ? 0 : 1)].push(t));
    const M = new THREE.Matrix4(), q = new THREE.Quaternion(), s = new THREE.Vector3(), p = new THREE.Vector3(), up = new THREE.Vector3(0, 1, 0);
    by.forEach((L, k) => { if (!L.length) return; const tr = new THREE.InstancedMesh(T[k].trunk, barkMat, L.length), lv = new THREE.InstancedMesh(T[k].leaves, leafMat, L.length);
      lv.customDepthMaterial = leafDepth; tr.castShadow = lv.castShadow = tr.receiveShadow = lv.receiveShadow = true;
      L.forEach(([x, y, z, sc, ry, tint], i) => { p.set(x, y - .3, z); q.setFromAxisAngle(up, ry); s.setScalar(sc); M.compose(p, q, s); tr.setMatrixAt(i, M); lv.setMatrixAt(i, M); lv.setColorAt(i, tint || new THREE.Color(.95, 1, .7)); });
      scene.add(tr, lv); STATS.trees = (STATS.trees || 0) + L.length; });
  }
  return { plant, leafMat };
}

// ── characters: any rigged glTF by URL (the cast itself is a pipeline of its own: realistic, modelled, rigged) ──
const loader = new GLTFLoader();
export const MIXERS = [];
export async function character(scene, url, o = {}) {
  const g = await loader.loadAsync(url); const root = g.scene;
  root.traverse(m => { if (m.isMesh) { m.castShadow = true; m.receiveShadow = true; } if (o.hide && o.hide.includes(m.name)) m.visible = false; });
  root.position.set(...o.at); root.rotation.y = o.ry || 0; root.scale.setScalar(o.scale || 1); scene.add(root);
  const mixer = new THREE.AnimationMixer(root), clip = g.animations.find(a => a.name === (o.anim || 'Idle')) || g.animations[0];
  if (clip) { mixer.clipAction(clip).play(); mixer.setTime(o.t ?? 0); } MIXERS.push(mixer);
  STATS.people = (STATS.people || 0) + 1; return { root, mixer };
}

// ── the frame loop, with a frame counter for the live pages ──
export function run(comp, cam, opts = {}) {
  let yaw = 0, pitch = 0, drag = null; const base = cam.quaternion.clone(); let last = performance.now(), frames = 0, fpsEl = null;
  if (!STILL) { fpsEl = document.createElement('div'); fpsEl.style.cssText = 'position:fixed;right:10px;top:10px;color:#f3ead6;font:13px system-ui;background:rgba(0,0,0,.45);padding:4px 8px;border-radius:4px'; document.body.appendChild(fpsEl); }
  addEventListener('pointerdown', e => drag = [e.clientX, e.clientY, yaw, pitch]); addEventListener('pointerup', () => drag = null);
  addEventListener('pointermove', e => { if (!drag) return; yaw = drag[2] - (e.clientX - drag[0]) * .003; pitch = Math.max(-.6, Math.min(.5, drag[3] - (e.clientY - drag[1]) * .003)); });
  const clock = new THREE.Clock();
  function frame(t) { const dt = Math.min(.05, clock.getDelta()); WIND.value = 2.3 + (STILL ? 0 : t * .001); if (!STILL) MIXERS.forEach(m => m.update(dt)); opts.tick && opts.tick(t, dt);
    cam.quaternion.copy(base).multiply(new THREE.Quaternion().setFromEuler(new THREE.Euler(pitch, yaw, 0, 'YXZ'))); comp.render();
    if (fpsEl) { frames++; const now = performance.now(); if (now - last > 1000) { fpsEl.textContent = Math.round(frames * 1000 / (now - last)) + ' fps'; frames = 0; last = now; } } }
  if (STILL) { frame(0); window.__done = true; } else { comp.renderer.setAnimationLoop(frame); window.__done = true; }
}
