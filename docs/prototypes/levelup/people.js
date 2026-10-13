// People from a genome (Session 770): MakeHuman's base body (CC0) morphed by its own targets, skinned to its own
// skeleton and posed, then dressed in garments cut from MakeHuman's fitting shells ("tights", "skirt", "hair"), which
// the same targets reshape, so every garment fits every body. The genome is a handful of numbers; the look is the
// slice's renderer. Pack: mh_pack.py -> mh/pack.json, mh/pack.bin.
import * as THREE from 'three';

let PACK = null;
export async function loadPack(base = 'mh/') {
  const [ix, buf] = await Promise.all([fetch(base + 'pack.json').then(r => r.json()), fetch(base + (window.MH_BIN || 'pack.bin')).then(r => r.arrayBuffer())]);
  const N = ix.verts.n, rest = new Float32Array(buf, ix.verts.off, N * 3).slice();
  const T = {}; for (const t of [...ix.targets, ...ix.face]) T[t.name] = { idx: new Uint16Array(buf, t.off, t.n), d: new Int16Array(buf, t.off + t.n * 2, t.n * 3) };
  const G = {}; for (const [k, g] of Object.entries(ix.groups)) G[k] = new Uint32Array(buf, g.off, g.n).slice();
  const skinIndex = new Uint16Array(buf, ix.skinIndex.off, N * 4).slice(), skinWeight = new Float32Array(buf, ix.skinWeight.off, N * 4).slice();
  PACK = { ix, N, rest, T, G, skinIndex, skinWeight };
  // regions of the fitting shells, chosen on the unmorphed body
  const tri = G['helper-tights'], P = rest, cy = i => P[i * 3 + 1], cx = i => P[i * 3];
  const sel = (g, f) => { const out = []; for (let t = 0; t < g.length; t += 3) { const a = g[t], b = g[t + 1], c = g[t + 2], y = (cy(a) + cy(b) + cy(c)) / 3, x = (cx(a) + cx(b) + cx(c)) / 3, z = (P[a * 3 + 2] + P[b * 3 + 2] + P[c * 3 + 2]) / 3; if (f(x, y, z)) out.push(a, b, c); } return new Uint32Array(out); };
  PACK.R = {
    tunic: sel(tri, (x, y) => y > -.08 && y < .63 && Math.abs(x) < .42),
    bare: sel(G['body'], (x, y) => y > .585 || Math.abs(x) > .395),
    bareLegs: sel(G['body'], (x, y) => y > .585 || Math.abs(x) > .395 || y < -.05),
    trousers: sel(tri, (x, y) => y < .12 && y > -.8),
    boots: sel(tri, (x, y) => y < -.38),
    belt: sel(tri, (x, y) => y > .11 && y < .22 && Math.abs(x) < .2),
    mantle: sel(tri, (x, y, z) => y > .4 && y < .61 && Math.abs(x) < .26),
    cuffs: sel(tri, (x, y) => Math.abs(x) > .37 && Math.abs(x) < .405),
    skirtShort: sel(G['helper-skirt'], (x, y) => y > -.24),
    skirtLong: sel(G['helper-skirt'], () => true),
    beard: sel(G['body'], (x, y, z) => y > .6 && y < .705 && z > .02 && (Math.hypot(x / 1.1, y - .655) > .022 || y < .64) && !(y > .66 && y < .705 && Math.abs(x) < .018 && z > .15)),
    moust: sel(G['body'], (x, y, z) => y > .662 && y < .678 && z > .1 && Math.abs(x) < .034),
    scalp: sel(G['body'], (x, y, z) => { const hl = .808 - .035 * (x / .075) ** 2; return y > .64 && Math.abs(x) < .115 && !(z > .015 && y < hl) && !(y < .77 && Math.abs(x) > .06 && z > -.035) && !(z > -.01 && y < .72) && !(y < .69 && z > -.06); }),
    // where hair roots: the old scalp plus the sides down to above the ears and the back down to the nape (Session 776),
    // so a style that lifts the hair up and back (a bun, a braid) does not bare the temples
    scalpRoots: sel(G['body'], (x, y, z) => { const hl = .796 - .03 * (x / .075) ** 2; return y > .66 && Math.abs(x) < .11 && (z > .05 ? y > hl : z > .022 ? y > (Math.abs(x) > .05 ? .755 : .7) : y > .695); }),
    brows: sel(G['body'], (x, y, z) => y > .748 && y < .757 && z > .1 && Math.abs(x) > .012 && Math.abs(x) < .055),
  };
  return PACK;
}

// ── materials ──
const TRI = `
varying vec3 vRP; varying vec3 vRN;
vec3 triTex(sampler2D t, float s){ vec3 w = abs(normalize(vRN)); w = pow(w, vec3(4.)); w /= (w.x + w.y + w.z);
  return texture2D(t, vRP.zy * s).rgb * w.x + texture2D(t, vRP.xz * s).rgb * w.y + texture2D(t, vRP.xy * s).rgb * w.z; }
`;
function weave(N = 128, kind = 'wool') {
  const c = document.createElement('canvas'); c.width = c.height = N; const x = c.getContext('2d'), img = x.createImageData(N, N);
  for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) { let v;
    if (kind === 'wool') { const a = Math.sin(i * .9) * .5 + .5, b = Math.sin(j * .9) * .5 + .5; v = .72 + .2 * (((i >> 2) + (j >> 2)) % 2 ? a : b) + .08 * Math.random(); }
    else if (kind === 'leather') { v = .8 + .15 * Math.sin(i * .21 + Math.sin(j * .17) * 3) * Math.sin(j * .13) + .08 * Math.random(); }
    else { v = .85 + .1 * Math.random(); }
    const k = (j * N + i) * 4; img.data[k] = img.data[k + 1] = img.data[k + 2] = v * 255; img.data[k + 3] = 255; }
  x.putImageData(img, 0, 0); const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; return t;
}
const TEXW = { wool: null, leather: null };
const sRGB = (r, g, b) => new THREE.Color().setRGB(r, g, b, THREE.SRGBColorSpace);
const CUT = (c) => c ? `if (vB.y < ${c[0].toFixed(3)} + (fract(sin(dot(vB.xz, vec2(91.7, 37.3))) * 4375.) - .5) * ${(c[3] ?? .004).toFixed(4)} || vB.y > ${c[1].toFixed(3)} || abs(vB.x) > ${(c[2] ?? 9).toFixed(3)}) discard;` : '';
function clothMat(color, kind = 'wool', o = {}) {
  TEXW[kind] = TEXW[kind] || weave(128, kind);
  const m = new THREE.MeshStandardMaterial({ color, roughness: o.rough ?? (kind === 'leather' ? .62 : .95), metalness: 0, side: o.side ?? THREE.FrontSide });
  m.onBeforeCompile = s => { s.uniforms.tW = { value: TEXW[kind] };
    s.vertexShader = 'attribute vec3 aBase; varying vec3 vB; varying vec3 vRP; varying vec3 vRN;\n' + s.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\n vRP = position; vRN = normal; vB = aBase;');
    s.fragmentShader = 'uniform sampler2D tW; varying vec3 vB;\n' + TRI + s.fragmentShader.replace('vec4 diffuseColor = vec4( diffuse, opacity );', CUT(o.cut) + `vec4 diffuseColor = vec4( diffuse * triTex(tW, ${(o.scale ?? (kind === 'leather' ? 9 : 22)).toFixed(1)}), opacity );`); };
  m.customProgramCacheKey = () => 'cloth' + kind + JSON.stringify(o.cut || 0) + (o.scale || 0);
  return m;
}
// fur and hair: stacked shells, each cut by noise so strands rise from the surface
function shellMat(color, layer, layers, o = {}) {
  const m = new THREE.MeshStandardMaterial({ color, roughness: .85, side: THREE.DoubleSide, alphaTest: .5 });
  m.onBeforeCompile = s => {
    s.vertexShader = 'attribute vec3 aBase; varying vec3 vB; varying vec3 vRP;\n' + s.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\n vRP = position; vB = aBase;');
    s.fragmentShader = 'varying vec3 vB; varying vec3 vRP;\nfloat hh(vec3 p){ p = fract(p * .3183099 + .1); p *= 17.; return fract(p.x * p.y * p.z * (p.x + p.y + p.z)); }\nfloat nz(vec3 x){ vec3 i = floor(x), f = fract(x); f = f * f * (3. - 2. * f); return mix(mix(mix(hh(i), hh(i + vec3(1,0,0)), f.x), mix(hh(i + vec3(0,1,0)), hh(i + vec3(1,1,0)), f.x), f.y), mix(mix(hh(i + vec3(0,0,1)), hh(i + vec3(1,0,1)), f.x), mix(hh(i + vec3(0,1,1)), hh(i + vec3(1,1,1)), f.x), f.y), f.z); }\n'
      + s.fragmentShader.replace('vec4 diffuseColor = vec4( diffuse, opacity );', `${o.hairline ? 'if (vB.z > .05 && vB.y < .8 - .03 * pow(vB.x / .075, 2.) + (fract(sin(vB.x * 517.) * 431.) - .5) * .004) discard;' : ''} float L = ${(layer / layers).toFixed(3)};
        vec3 q = vRP * vec3(${o.sx ?? 380}., ${o.sy ?? 90}., ${o.sx ?? 380}.); float strand = nz(q) * .7 + nz(q * 2.3) * .3;
        float keep = ${o.solid ? '1.' : 'step(L * .85 + .1, strand)'};
        vec4 diffuseColor = vec4(diffuse * (.42 + .75 * L) * (.85 + .3 * strand), keep);`); };
  m.customProgramCacheKey = () => 'shell' + layer + '/' + layers + JSON.stringify(o);
  return m;
}
function skinMat(c) {
  return new THREE.MeshPhysicalMaterial({ color: c, roughness: .6, metalness: 0, sheen: .18, sheenColor: new THREE.Color(1, .45, .35), sheenRoughness: .5, vertexColors: true });
}

// ── the genome ──
// g: 0 woman .. 1 man; age: .5 is 25, 1 is 90; muscle, weight, height, prop: 0..1; race: {caucasian, african, asian};
// face: {target: -1..1}; skin, hair, eyes: colours; dress: {tunic, trousers, boots, belt, mantle, skirt: 'short'|'long'|null,
// hairLen: 0..1, beard: 0..1}
function macroWeights(G) {
  const W = {}, gw = { male: G.g, female: 1 - G.g }, a = Math.min(1, Math.max(.5, G.age)), aw = { young: 1 - (a - .5) / .5, old: (a - .5) / .5 };
  const lvl = v => v < .5 ? { min: 1 - 2 * v, average: 2 * v, max: 0 } : { min: 0, average: 2 - 2 * v, max: 2 * v - 1 };
  const mw = lvl(G.muscle), ww = lvl(G.weight), h = G.height, hw = h < .5 ? { min: 1 - 2 * h, max: 0 } : { min: 0, max: 2 * h - 1 };
  for (const [r, rw] of Object.entries(G.race)) for (const gn in gw) for (const an in aw) W[`macrodetails/${r}-${gn}-${an}`] = rw * gw[gn] * aw[an];
  for (const gn in gw) for (const an in aw) { const k = gw[gn] * aw[an];
    for (const m in mw) for (const w in ww) if (!(m === 'average' && w === 'average')) W[`macrodetails/universal-${gn}-${an}-${m}muscle-${w}weight`] = k * mw[m] * ww[w];
    for (const hh in hw) W[`macrodetails/height/${gn}-${an}-averagemuscle-averageweight-${hh}height`] = k * hw[hh];
    W[`macrodetails/proportions/${gn}-${an}-averagemuscle-averageweight-idealproportions`] = k * (G.prop ?? .6); }
  return W;
}
function morph(G) {
  const { rest, T, ix } = PACK, P = rest.slice(), add = (t, w) => { if (!t || Math.abs(w) < 1e-4) return; const { idx, d } = t; for (let k = 0; k < idx.length; k++) { const i = idx[k] * 3; P[i] += d[k * 3] * 1e-4 * w; P[i + 1] += d[k * 3 + 1] * 1e-4 * w; P[i + 2] += d[k * 3 + 2] * 1e-4 * w; } };
  for (const [n, w] of Object.entries(macroWeights(G))) add(T[n], w);
  for (const [n, v] of Object.entries(G.face || {})) { const pair = ix.face.filter(f => f.name.startsWith(n + '|')); if (pair.length) { add(T[pair[v > 0 ? 1 : 0].name], Math.abs(v)); } else add(T[n], Math.max(0, v)); }
  return P;
}

// a garment: a fitting shell's region, pushed out along its normals, skinned like the body
function geomFor(P, index, push = 0) {
  const g = new THREE.BufferGeometry(), pos = P.slice(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setIndex(new THREE.BufferAttribute(index, 1)); g.computeVertexNormals();
  if (push) { const n = g.attributes.normal.array, used = new Uint8Array(PACK.N), R0 = PACK.rest; for (const i of index) used[i] = 1; for (let i = 0; i < PACK.N; i++) if (used[i]) { const d = typeof push === 'function' ? push(R0[i * 3], R0[i * 3 + 1], R0[i * 3 + 2]) : push; pos[i * 3] += n[i * 3] * d; pos[i * 3 + 1] += n[i * 3 + 1] * d; pos[i * 3 + 2] += n[i * 3 + 2] * d; } g.computeVertexNormals(); }
  g.setAttribute('aBase', new THREE.BufferAttribute(PACK.rest, 3)); g.setAttribute('skinIndex', new THREE.BufferAttribute(PACK.skinIndex, 4)); g.setAttribute('skinWeight', new THREE.BufferAttribute(PACK.skinWeight, 4)); return g;
}
function clip(index, P, f) { const out = []; for (let t = 0; t < index.length; t += 3) { const a = index[t], b = index[t + 1], c = index[t + 2], y = (P[a * 3 + 1] + P[b * 3 + 1] + P[c * 3 + 1]) / 3; if (f(y)) out.push(a, b, c); } return new Uint32Array(out); }


// hair cards: strips rooted on a surface, combed and falling under gravity, kept outside the head, tapering to the tip
let STRANDS = null, RND = Math.random;
// a seeded stream for everything a genome's look depends on (the co-op rule: one villager looks the same to everyone)
export function seeded(seed) { let h = 2166136261; for (const ch of String(seed)) h = Math.imul(h ^ ch.charCodeAt(0), 16777619); let a = h >>> 0;
  return () => { a = (a + 0x6D2B79F5) >>> 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
function strandTex() {
  if (STRANDS) return STRANDS; const c = document.createElement('canvas'); c.width = 64; c.height = 256; const x = c.getContext('2d'); x.clearRect(0, 0, 64, 256);
  for (let i = 0; i < 70; i++) { const sx = Math.random() * 64, len = 150 + Math.random() * 106, l = 40 + Math.random() * 60, w = .8 + Math.random() * 1.6;
    const g = x.createLinearGradient(0, 0, 0, len); g.addColorStop(0, `rgba(${l * 2.5},${l * 2.5},${l * 2.5},1)`); g.addColorStop(.8, `rgba(${l * 2.5},${l * 2.5},${l * 2.5},.9)`); g.addColorStop(1, `rgba(${l * 2.5},${l * 2.5},${l * 2.5},0)`);
    x.strokeStyle = g; x.lineWidth = w; x.beginPath(); x.moveTo(sx, 0); x.bezierCurveTo(sx + (Math.random() - .5) * 6, len * .3, sx + (Math.random() - .5) * 8, len * .7, sx + (Math.random() - .5) * 10, len); x.stroke(); }
  STRANDS = new THREE.CanvasTexture(c); STRANDS.colorSpace = THREE.SRGBColorSpace; return STRANDS;
}
function surfaceOf(P, tris, centre) {
  const nrm = new Map(), A = new THREE.Vector3(), B = new THREE.Vector3(), C = new THREE.Vector3();
  for (let t = 0; t < tris.length; t += 3) { A.fromArray(P, tris[t] * 3); B.fromArray(P, tris[t + 1] * 3); C.fromArray(P, tris[t + 2] * 3); const n = B.clone().sub(A).cross(C.clone().sub(A));
    for (let k = 0; k < 3; k++) { const v = tris[t + k]; if (!nrm.has(v)) nrm.set(v, new THREE.Vector3()); nrm.get(v).add(n); } }
  const pts = [], ns = []; for (const [v, n] of nrm) { const p = new THREE.Vector3().fromArray(P, v * 3); n.normalize(); if (centre && n.dot(p.clone().sub(centre)) < 0) n.negate(); pts.push(p); ns.push(n); } return { pts, ns };
}
function hairCards(P, tris, o) {
  // roots by area over the triangles
  const area = [], A = new THREE.Vector3(), B = new THREE.Vector3(), C = new THREE.Vector3(); let tot = 0;
  for (let t = 0; t < tris.length; t += 3) { A.fromArray(P, tris[t] * 3); B.fromArray(P, tris[t + 1] * 3); C.fromArray(P, tris[t + 2] * 3); const a = B.clone().sub(A).cross(C.clone().sub(A)).length() / 2; tot += a; area.push(tot); }
  const pos = [], uv = [], idx = [], nor = [], down = new THREE.Vector3(0, -1, 0), back = new THREE.Vector3(0, 0, -1);
  for (let k = 0; k < o.n; k++) {
    let r = RND() * tot, lo = 0, hi = area.length - 1; while (lo < hi) { const m = (lo + hi) >> 1; if (area[m] < r) lo = m + 1; else hi = m; } const t = lo * 3;
    A.fromArray(P, tris[t] * 3); B.fromArray(P, tris[t + 1] * 3); C.fromArray(P, tris[t + 2] * 3); let u = RND(), v = RND(); if (u + v > 1) { u = 1 - u; v = 1 - v; }
    const p = A.clone().multiplyScalar(1 - u - v).addScaledVector(B, u).addScaledVector(C, v), n = B.clone().sub(A).cross(C.clone().sub(A)).normalize();
    if (o.outward && n.clone().dot(p.clone().sub(o.outward)) < 0) n.negate();
    const front = o.outward && o.sweep ? Math.max(0, Math.min(1, (p.z - o.outward.z) / .05)) : 0; const want = back.clone().multiplyScalar(o.comb).addScaledVector(down, o.fall * (1 - front)).addScaledVector(down, -.9 * front); const tan = want.clone().addScaledVector(n, -want.dot(n)); if (tan.lengthSq() < 1e-6) tan.copy(down);
    let dir = tan.normalize().addScaledVector(n, o.lift).normalize(); const L = o.len * (.7 + .5 * RND()), seg = o.seg, w0 = o.width * (.8 + .4 * RND());
    const pts = [p.clone().addScaledVector(n, o.rootOff)]; for (let s = 1; s <= seg; s++) { const behind = !o.sweep || pts[s - 1].z < o.outward.z - .01 || pts[s - 1].y < o.hugMinY; dir.addScaledVector(down, behind ? o.grav : 0); if (!behind) dir.addScaledVector(back, .25); dir.normalize(); const q = pts[s - 1].clone().addScaledVector(dir, L / seg);
      for (const S of o.surfs || []) { let bi = 0, bd = 1e9; for (let j = 0; j < S.pts.length; j++) { const d = S.pts[j].distanceToSquared(q); if (d < bd) { bd = d; bi = j; } } const lim = o.rootOff + .0018 * s, h = q.clone().sub(S.pts[bi]).dot(S.ns[bi]); if (bd < .0064 && (h < lim || (o.hug && h < lim + .035 && (o.hugMinY == null || q.y > o.hugMinY)))) q.addScaledVector(S.ns[bi], lim - h); }
      dir.copy(q).sub(pts[s - 1]).normalize();
      if (o.faceZ != null && q.y < p.y - .01 && q.z > o.faceZ) { q.z = o.faceZ - .005; dir.z = Math.min(dir.z, 0); dir.normalize(); }
      if (o.shoulderY && q.y < o.shoulderY && q.z > o.backZ) q.z = o.backZ - RND() * .01; pts.push(q); }
    const base = pos.length / 3; for (let s = 0; s <= seg; s++) { const d = s < seg ? pts[s + 1].clone().sub(pts[s]) : pts[s].clone().sub(pts[s - 1]), sraw = d.clone().cross(n), side = (sraw.length() > .3 * d.length() ? sraw : d.clone().cross(new THREE.Vector3(0, 0, 1))).normalize(), w = w0 * (1 - .55 * s / seg);
      pos.push(pts[s].x - side.x * w, pts[s].y - side.y * w, pts[s].z - side.z * w, pts[s].x + side.x * w, pts[s].y + side.y * w, pts[s].z + side.z * w); nor.push(n.x, n.y, n.z, n.x, n.y, n.z); const vv = s / seg; uv.push(0, vv, 1, vv); if (s < seg) { const a = base + s * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); } } }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx); g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
  const nV = pos.length / 3, si = new Uint16Array(nV * 4), sw = new Float32Array(nV * 4); for (let i = 0; i < nV; i++) { si[i * 4] = o.bone; sw[i * 4] = 1; } g.setAttribute('skinIndex', new THREE.BufferAttribute(si, 4)); g.setAttribute('skinWeight', new THREE.BufferAttribute(sw, 4));
  const m = new THREE.MeshStandardMaterial({ map: strandTex(), color: o.color, alphaTest: .42, side: THREE.DoubleSide, roughness: .62 });
  m.onBeforeCompile = sh => { sh.fragmentShader = sh.fragmentShader.replace('#include <normal_fragment_begin>', '#include <normal_fragment_begin>\n normal = normalize(vNormal); if (dot(normal, vViewPosition) < 0.) normal = -normal;'); };
  const mesh = new THREE.SkinnedMesh(g, m); mesh.noCast = true; mesh.customDepthMaterial = new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking, map: strandTex(), alphaTest: .42 }); return mesh;
}

// ── groomed hair (Session 776): strands that lie on the head ──
// Session 770's cards were combed by a fixed direction and fell free, so at the temples they crossed and stood off the
// head. Here every strand walks over the head's own surface at its own small height (its layer), toward where the style
// sends it: down and back from a centre parting (loose and short), or to a gathering point (a braid, two braids, a tail,
// a bun), where the gathered part is built as a whole: three interleaved locks, a hanging bundle, a coil. Below the head
// a strand or a braid falls under gravity and is pushed off the neck, back and shoulders.
function surfGrid(P, tris, keep, cell = .025) {
  const N = P.length / 3, nx = new Float32Array(N * 3), used = new Uint8Array(N), R = PACK.rest;
  for (let t = 0; t < tris.length; t += 3) { const a = tris[t] * 3, b = tris[t + 1] * 3, c = tris[t + 2] * 3;
    const ux = P[b] - P[a], uy = P[b + 1] - P[a + 1], uz = P[b + 2] - P[a + 2], vx = P[c] - P[a], vy = P[c + 1] - P[a + 1], vz = P[c + 2] - P[a + 2];
    const cx = uy * vz - uz * vy, cy = uz * vx - ux * vz, cz = ux * vy - uy * vx;
    for (const v of [a, b, c]) { nx[v] += cx; nx[v + 1] += cy; nx[v + 2] += cz; used[v / 3] = 1; } }
  const cells = new Map(), K = (i, j, k) => i + ',' + j + ',' + k, pts = [];
  for (let v = 0; v < N; v++) { if (!used[v] || !keep(R[v * 3], R[v * 3 + 1], R[v * 3 + 2])) continue; const p = new THREE.Vector3(P[v * 3], P[v * 3 + 1], P[v * 3 + 2]), n = new THREE.Vector3(nx[v * 3], nx[v * 3 + 1], nx[v * 3 + 2]).normalize();
    const k = K(Math.floor(p.x / cell), Math.floor(p.y / cell), Math.floor(p.z / cell)); if (!cells.has(k)) cells.set(k, []); const e = { p, n, v }; cells.get(k).push(e); pts.push(e); }
  return { pts, near(q) { const i = Math.floor(q.x / cell), j = Math.floor(q.y / cell), k = Math.floor(q.z / cell); let best = null, bd = 1e9;
      for (let a = -1; a <= 1; a++) for (let b = -1; b <= 1; b++) for (let c = -1; c <= 1; c++) { const L = cells.get(K(i + a, j + b, k + c)); if (L) for (const e of L) { const d = e.p.distanceToSquared(q); if (d < bd) { bd = d; best = e; } } }
      return best; },
    // the point of the surface furthest along a direction from a centre: where a gathering point goes
    extreme(c, d, f = () => true) { let best = null, bs = -1e9; for (const e of pts) { if (!f(e.p)) continue; const s = e.p.clone().sub(c).normalize().dot(d); if (s > bs) { bs = s; best = e; } } return best; } };
}
// height of q over the surface (the plane of its nearest point), or null off the surface
const heightOver = (S, q) => { const e = S.near(q); return e ? { e, h: q.clone().sub(e.p).dot(e.n) } : null; };
let LOCK = null;
function lockTex() {
  if (LOCK) return LOCK; const c = document.createElement('canvas'); c.width = 64; c.height = 256; const x = c.getContext('2d'); x.fillStyle = 'rgb(205,205,205)'; x.fillRect(0, 0, 64, 256);
  const r = seeded('lock'); for (let i = 0; i < 90; i++) { const sx = r() * 64, l = 150 + r() * 105; x.strokeStyle = `rgba(${l},${l},${l},.8)`; x.lineWidth = .6 + r() * 1.4; x.beginPath(); x.moveTo(sx, 0); x.bezierCurveTo(sx + (r() - .5) * 6, 90, sx + (r() - .5) * 6, 170, sx, 256); x.stroke(); }
  LOCK = new THREE.CanvasTexture(c); LOCK.colorSpace = THREE.SRGBColorSpace; LOCK.wrapS = LOCK.wrapT = THREE.RepeatWrapping; return LOCK;
}
function skinTo(g, bone) { const n = g.attributes.position.count, si = new Uint16Array(n * 4), sw = new Float32Array(n * 4); for (let i = 0; i < n; i++) { si[i * 4] = bone; sw[i * 4] = 1; } g.setAttribute('skinIndex', new THREE.BufferAttribute(si, 4)); g.setAttribute('skinWeight', new THREE.BufferAttribute(sw, 4)); return g; }
function cardMat(color) {
  const m = new THREE.MeshStandardMaterial({ map: strandTex(), color, alphaTest: .42, side: THREE.DoubleSide, roughness: .78 });
  m.onBeforeCompile = sh => { sh.fragmentShader = sh.fragmentShader.replace('#include <normal_fragment_begin>', '#include <normal_fragment_begin>\n normal = normalize(vNormal); if (dot(normal, vViewPosition) < 0.) normal = -normal;'); }; return m;
}
// cards along strands: each strand is {pts, ns, w}; the card lies flat on the surface under it (its width along strand x normal)
function strandCards(strands, color, bone) {
  const pos = [], nor = [], uv = [], idx = [];
  for (const S of strands) { const n = S.pts.length; if (n < 2) continue; const base = pos.length / 3;
    for (let s = 0; s < n; s++) { const d = (s < n - 1 ? S.pts[s + 1].clone().sub(S.pts[s]) : S.pts[s].clone().sub(S.pts[s - 1])).normalize(), nn = S.ns[s], side = d.clone().cross(nn); if (side.lengthSq() < 1e-6) side.set(1, 0, 0); side.normalize();
      const w = S.w * (1 - (S.tip ?? .5) * (s / (n - 1)) ** 2), p = S.pts[s]; pos.push(p.x - side.x * w, p.y - side.y * w, p.z - side.z * w, p.x + side.x * w, p.y + side.y * w, p.z + side.z * w);
      nor.push(nn.x, nn.y, nn.z, nn.x, nn.y, nn.z); const v = S.v0 + (S.v1 - S.v0) * s / (n - 1); uv.push(0, v, 1, v); if (s < n - 1) { const a = base + s * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); } } }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx);
  const m = new THREE.SkinnedMesh(skinTo(g, bone), cardMat(color)); m.noCast = true; m.customDepthMaterial = new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking, map: strandTex(), alphaTest: .42 }); return m;
}
// a tube along a centre line (radius per point), textured with lengthwise locks
function tubeGeom(line, rad, sides = 8, twist = 0) {
  const pos = [], uv = [], idx = [], n = line.length; let len = 0;
  for (let s = 0; s < n; s++) { if (s) len += line[s].distanceTo(line[s - 1]); const T = (s < n - 1 ? line[s + 1].clone().sub(line[s]) : line[s].clone().sub(line[s - 1])).normalize();
    const X = new THREE.Vector3(0, 0, 1).cross(T); if (X.lengthSq() < 1e-4) X.set(1, 0, 0); X.normalize(); const Y = T.clone().cross(X);
    for (let k = 0; k <= sides; k++) { const a = k / sides * Math.PI * 2 + twist * len, p = line[s].clone().addScaledVector(X, Math.cos(a) * rad[s]).addScaledVector(Y, Math.sin(a) * rad[s]); pos.push(p.x, p.y, p.z); uv.push(k / sides, len * 14); }
    if (s < n - 1) for (let k = 0; k < sides; k++) { const a = s * (sides + 1) + k, b = a + sides + 1; idx.push(a, b, a + 1, a + 1, b, b + 1); } }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx); g.computeVertexNormals(); return g;
}
const lockMat = color => new THREE.MeshStandardMaterial({ map: lockTex(), color, roughness: .78 });
// a line falling from a start under gravity, pushed off the body to a clearance
function drape(S, start, dir0, L, clearAt, o = {}) {
  const line = [start.clone()], dir = dir0.clone().normalize(), step = .01;
  for (let l = 0; l < L; l += step) { dir.y -= o.grav ?? .25; dir.normalize(); const q = line[line.length - 1].clone().addScaledVector(dir, step);
    const clear = clearAt(q); for (let it = 0; it < 3; it++) { const hit = heightOver(S, q); if (hit && hit.h < clear) q.addScaledVector(hit.e.n, clear - hit.h); }
    if (o.keepX != null) q.x = start.x + Math.max(-o.keepX, Math.min(o.keepX, q.x - start.x));
    dir.copy(q).sub(line[line.length - 1]).normalize(); line.push(q); }
  // smoothed, so the push-outs do not leave kinks, then cleared once more
  for (let it = 0; it < 6; it++) for (let i = 1; i < line.length - 1; i++) line[i].lerp(line[i - 1].clone().add(line[i + 1]).multiplyScalar(.5), .5);
  for (const q of line.slice(1)) { const c = clearAt(q), hit = heightOver(S, q); if (hit && hit.h < c) q.addScaledVector(hit.e.n, c - hit.h); }
  return line;
}
const HAIR_STYLES = ['short', 'loose', 'braid', 'braids', 'tail', 'bun'];
export { HAIR_STYLES };
function buildHair(P, G, heads, scalpTris, headB, rnd) {
  const out = [], style = G.hair?.style ?? ((G.hairLen ?? .3) < .45 ? 'short' : 'loose'), len = G.hair?.len ?? G.hairLen ?? .3, col = sRGB(...G.hairCol);
  const R0 = PACK.rest, neckY0 = .6, S = surfGrid(P, PACK.G['body'], (x, y, z) => (y > neckY0 - .02) || (y > .25 && Math.abs(x) < .2));
  const bb = new THREE.Box3(); for (const v of scalpTris) bb.expandByPoint(new THREE.Vector3(P[v * 3], P[v * 3 + 1], P[v * 3 + 2])); const hc = bb.getCenter(new THREE.Vector3()), hr = bb.getSize(new THREE.Vector3()).multiplyScalar(.5); hc.y -= .02;
  // clear of the clothes: the tunic's layers, and the fur mantle's eleven shells over the shoulders
  const D = G.dress || {}, neckY = heads['neck01'].y, clearAt = q => { const k = Math.max(0, Math.min(1, (neckY - .01 - q.y) / .02)); return .02 + k * k * (3 - 2 * k) * ((D.mantle && q.y > neckY - .3 ? .1 : D.tunic ? .045 : .02) - .02); };
  const onHead = q => q.y > heads['neck01'].y + .03, faceZ = hc.z + .02, backZ = heads['neck01'].z - .04;
  // gathering points, on the surface
  const gp = d => { const e = S.extreme(hc, d.normalize(), p => p.y > heads['neck01'].y + .02); return { p: e.p.clone().addScaledVector(e.n, .012), n: e.n.clone() }; };
  const gather = style === 'braid' || style === 'tail' ? [gp(new THREE.Vector3(0, -.55, -1))] : style === 'braids' ? [gp(new THREE.Vector3(-.75, -.75, -.55)), gp(new THREE.Vector3(.75, -.75, -.55))] : style === 'bun' ? [gp(new THREE.Vector3(0, .2, -1))] : [];
  // the strands over the head
  const area = [], A = new THREE.Vector3(), B = new THREE.Vector3(), C = new THREE.Vector3(); let tot = 0;
  for (let t = 0; t < scalpTris.length; t += 3) { A.fromArray(P, scalpTris[t] * 3); B.fromArray(P, scalpTris[t + 1] * 3); C.fromArray(P, scalpTris[t + 2] * 3); tot += B.clone().sub(A).cross(C.clone().sub(A)).length() / 2; area.push(tot); }
  const strands = [], short = style === 'short', free = style === 'loose', L = short ? .05 + .1 * len : free ? .12 + .5 * len : .5, nS = short ? 1400 : free ? 2200 : 1700, step = .009, thick = short ? .006 : .011;
  for (let k = 0; k < nS; k++) {
    let r = rnd() * tot, lo = 0, hi = area.length - 1; while (lo < hi) { const m = (lo + hi) >> 1; if (area[m] < r) lo = m + 1; else hi = m; } const t = lo * 3;
    A.fromArray(P, scalpTris[t] * 3); B.fromArray(P, scalpTris[t + 1] * 3); C.fromArray(P, scalpTris[t + 2] * 3); let u = rnd(), v = rnd(); if (u + v > 1) { u = 1 - u; v = 1 - v; }
    const p = A.clone().multiplyScalar(1 - u - v).addScaledVector(B, u).addScaledVector(C, v), side = Math.abs(p.x - hc.x) < .004 ? (rnd() < .5 ? -1 : 1) : Math.sign(p.x - hc.x);
    const off = .003 + thick * rnd() ** .7, g = gather.length === 2 ? gather[side < 0 ? 0 : 1] : gather[0];
    let q = p.clone(), e = S.near(q), n = e ? e.n.clone() : p.clone().sub(hc).normalize(); q.addScaledVector(n, off);
    const pts = [q.clone()], ns = [n.clone()], dir = new THREE.Vector3(), myL = L * (.75 + .4 * rnd());
    for (let l = 0; l < myL + (g ? 1 : 0); l += step) {
      let want;
      if (g) { want = g.p.clone().sub(q).normalize(); const front = Math.max(0, Math.min(1, (q.z - hc.z + .01) / .05)); want.z -= 1.4 * front; }
      else { const back = Math.max(0, Math.min(1, (faceZ + .02 - q.z) / .1)); want = new THREE.Vector3(side * .45, -(.25 + .75 * back), -(1 - .55 * back)); if (free && q.y < hc.y - .03 && q.z < hc.z) want.set((p.x - hc.x) / hr.x * .25, -1, -.1); }
      const stick = g || short || (free ? q.y > hc.y - .03 || q.z > hc.z : onHead(q)), hit = heightOver(S, q);
      if (stick && hit) want.addScaledVector(hit.e.n, -want.dot(hit.e.n));
      want.normalize(); dir.lerp(want, l === 0 ? 1 : .5).normalize();
      const q2 = q.clone().addScaledVector(dir, step), h2 = heightOver(S, q2);
      if (h2) { const c = stick || onHead(q2) ? off : clearAt(q2) + off; if (stick || h2.h < c) q2.addScaledVector(h2.e.n, c - h2.h); n.copy(h2.e.n); }
      if (!stick) n.set(q2.x, 0, q2.z - heads['neck01'].z).normalize();
      if (!onHead(q2) && q2.z > backZ && Math.abs(q2.x) < .12) q2.z = backZ;
      pts.push(q2); ns.push(n.clone()); q = q2;
      if (g && q.distanceTo(g.p) < .012) break; }
    strands.push({ pts, ns, w: (short ? .008 : free ? .008 : .011) * (.8 + .4 * rnd()), tip: free ? .85 : .5, v0: 0, v1: Math.min(1, pts.length * step / (g ? .35 : myL)) });
  }
  // the checks' numbers: strand points under the skin, and strand points lying on the face (by the rest place of the skin under them)
  let inside = 0, onFace = 0, pts = 0; for (const st of strands) for (const q of st.pts) { pts++; const hit = heightOver(S, q); if (!hit) continue; if (hit.h < -.001) inside++;
    const v = hit.e.v, x = R0[v * 3], y = R0[v * 3 + 1], z = R0[v * 3 + 2]; if (hit.h < .03 && z > .05 && y > .6 && y < .79 - .03 * (x / .075) ** 2 && Math.abs(x) < .07) onFace++; }
  const cards = strandCards(strands, col, headB); cards.name = 'hair'; out.push(cards);
  // what the gathering makes
  const tie = new THREE.MeshStandardMaterial({ color: sRGB(.25, .17, .11), roughness: .7 }), lm = lockMat(col.clone().multiplyScalar(.95));
  let drapeMin = 1;
  const bodyOnly = surfGrid(P, PACK.G['body'], (x, y, z) => y > .25 && Math.abs(x) < .2);
  for (const g of gather) {
    if (style === 'bun') { // a coil of one lock, two and a half turns, domed out from the head
      const X = new THREE.Vector3(1, 0, 0), Y = g.n.clone().cross(X).normalize(), line = [], rad = [];
      for (let i = 0; i <= 90; i++) { const a = i / 90 * Math.PI * 5, rr = .008 + .03 * i / 90, lift = .03 * (1 - (i / 90) ** 2) + .006; line.push(g.p.clone().addScaledVector(X, Math.cos(a) * rr).addScaledVector(Y, Math.sin(a) * rr).addScaledVector(g.n, lift)); rad.push(.011 + .003 * Math.sin(i / 90 * Math.PI)); }
      const m = new THREE.SkinnedMesh(skinTo(tubeGeom(line, rad, 8, 30), headB), lm); m.name = 'bun'; out.push(m); continue; }
    const BL = .16 + .42 * len, start = g.p.clone().addScaledVector(g.n, .006), d0 = new THREE.Vector3((g.p.x - hc.x) * .5, -1.6, -.3);
    const line = drape(bodyOnly, start, d0, BL, q => clearAt(q) + (style === 'tail' ? .006 : 0), { keepX: style === 'braids' ? .03 : .06 });
    for (const q of line.slice(3)) { const hit = heightOver(bodyOnly, q); if (hit) drapeMin = Math.min(drapeMin, hit.h); }
    // the tie, a short band where the gathering starts
    { const band = [line[0], line[1], line[2]], m = new THREE.SkinnedMesh(skinTo(tubeGeom(band, band.map(() => .017), 10), headB), tie); m.name = 'tie'; out.push(m); }
    if (style === 'tail') { const tail = []; for (let k = 0; k < 260; k++) { const a = rnd() * Math.PI * 2, r0 = .012 * Math.sqrt(rnd()), spread = .5 + rnd(), tipLen = .7 + .3 * rnd(), pts = [], ns = [];
        for (let i = 0; i < line.length * tipLen; i++) { const f = i / line.length, T = (line[Math.min(i + 1, line.length - 1)].clone().sub(line[Math.max(0, i - 1)])).normalize(), X = new THREE.Vector3(0, 0, 1).cross(T).normalize(), Y = T.clone().cross(X);
          const rr = r0 * (1 + 1.8 * f * spread); pts.push(line[i].clone().addScaledVector(X, Math.cos(a) * rr).addScaledVector(Y, Math.sin(a) * rr)); ns.push(X.clone().multiplyScalar(Math.cos(a)).addScaledVector(Y, Math.sin(a))); }
        tail.push({ pts, ns, w: .009, v0: 0, v1: 1 }); }
      const m = strandCards(tail, col, headB); m.name = 'tail'; out.push(m); continue; }
    // a braid: three locks crossing over one another, a tie near the end and a short brush below it
    const w = .034 * (.85 + .3 * len), endAt = line.length - 6;
    for (let i = 0; i < 3; i++) { const lk = [], rad = []; for (let s = 0; s <= endAt; s++) { const T = (line[Math.min(s + 1, line.length - 1)].clone().sub(line[Math.max(0, s - 1)])).normalize(), hit = bodyOnly.near(line[s]);
        const Nn = hit ? line[s].clone().sub(hit.p).normalize() : new THREE.Vector3(0, 0, -1), X = T.clone().cross(Nn).normalize(), N2 = X.clone().cross(T), taper = 1 - .45 * s / endAt, ph = s * .01 / .045 * Math.PI * 2 + i * Math.PI * 2 / 3;
        lk.push(line[s].clone().addScaledVector(X, Math.sin(ph) * w * .36 * taper).addScaledVector(N2, Math.sin(2 * ph) * w * .16 * taper)); rad.push(w * .3 * taper * (s < 3 ? s / 3 * .5 + .5 : 1)); }
      const m = new THREE.SkinnedMesh(skinTo(tubeGeom(lk, rad, 7, 25 + i * 3), headB), lm); m.name = 'braid' + i; out.push(m); }
    { const band = line.slice(endAt - 1, endAt + 2), m = new THREE.SkinnedMesh(skinTo(tubeGeom(band, band.map(() => w * .36), 10), headB), tie); m.name = 'tie'; out.push(m);
      const brush = []; for (let k = 0; k < 60; k++) { const a = rnd() * Math.PI * 2, pts = [], ns = []; for (let s = endAt; s < line.length; s++) { const f = (s - endAt) / (line.length - endAt), rr = w * .25 * (1 + f); pts.push(line[s].clone().add(new THREE.Vector3(Math.cos(a) * rr, 0, Math.sin(a) * rr))); ns.push(new THREE.Vector3(Math.cos(a), 0, Math.sin(a))); }
        brush.push({ pts, ns, w: .007, v0: .5, v1: 1 }); }
      const bm = strandCards(brush, col, headB); bm.name = 'brush'; out.push(bm); }
  }
  return { meshes: out, stats: { style, strands: strands.length, gather: gather.length, points: pts, inside, onFace, drapeMin: +drapeMin.toFixed(4) } };
}

export function makePerson(G, o = {}) {
  const P = morph(G), { ix } = PACK, rest0 = PACK.rest; RND = seeded(G.seed ?? 'person'); let hairStats = null;
  // the feet on the ground
  let minY = 1e9; for (let i = 1; i < P.length; i += 3) if (P[i] < minY) minY = P[i];
  // the skeleton, its joints read off the morphed body
  const jp = name => { const L = ix.joints[name], v = new THREE.Vector3(); for (const i of L) v.add(new THREE.Vector3(P[i * 3], P[i * 3 + 1], P[i * 3 + 2])); return v.divideScalar(L.length); };
  const bones = [], byName = {}, heads = {};
  for (const b of ix.bones) { const bone = new THREE.Bone(); bone.name = b.name; heads[b.name] = jp(b.head); bones.push(bone); byName[b.name] = bone;
    if (b.parent) { byName[b.parent].add(bone); bone.position.copy(heads[b.name]).sub(heads[b.parent]); } else bone.position.copy(heads[b.name]); }
  const skeleton = new THREE.Skeleton(bones), root = new THREE.Group(), meshes = [];
  const D0 = G.dress || {}, body = new THREE.SkinnedMesh(geomFor(P, D0.tunic ? (D0.trousers || D0.skirt === 'long' ? PACK.R.bare : PACK.R.bareLegs) : PACK.G.body), skinMat(sRGB(...G.skin)));
  // skin tones by region: lips and cheeks warmer, the brow a touch darker
  { const col = new Float32Array(PACK.N * 3); for (let i = 0; i < PACK.N; i++) { const x = rest0[i * 3], y = rest0[i * 3 + 1], z = rest0[i * 3 + 2]; let r = 1, g = 1, b = 1;
      const lip = Math.exp(-((x / .022) ** 2) - ((y - .655) / .009) ** 2) * (z > .13 ? 1 : 0), cheek = Math.exp(-(((Math.abs(x) - .05) / .025) ** 2) - ((y - .69) / .02) ** 2) * (z > .07 ? 1 : 0), nose = Math.exp(-((x / .02) ** 2) - ((y - .69) / .015) ** 2) * (z > .14 ? 1 : 0);
      r += .12 * lip + .06 * cheek + .05 * nose; g -= .14 * lip + .05 * cheek + .04 * nose; b -= .1 * lip + .04 * cheek + .03 * nose; col[i * 3] = r; col[i * 3 + 1] = g; col[i * 3 + 2] = b; }
    body.geometry.setAttribute('color', new THREE.BufferAttribute(col, 3)); }
  meshes.push(body);
  const D = G.dress || {}, push = (k, idx, mat, d) => { const m = new THREE.SkinnedMesh(geomFor(P, idx, d), mat); m.name = k; meshes.push(m); return m; };
  if (D.trousers) push('trousers', PACK.R.trousers, clothMat(sRGB(...D.trousers), 'wool', { cut: [-.78, .1] }), .008);
  if (D.boots) push('boots', PACK.R.boots, clothMat(sRGB(...D.boots), 'leather', { cut: [-2, -.43, 9, .002] }), .02);
  if (D.tunic) push('tunic', PACK.R.tunic, clothMat(sRGB(...D.tunic), 'wool', { cut: [D.skirt ? .12 : -.02, .612, .4, .002] }), (x, y) => .013 + (Math.abs(x) < .2 ? .022 * Math.max(0, Math.min(1, (.46 - y) / .2)) * (1 - .8 * Math.exp(-(((y - .16) / .03) ** 2))) : 0));
  if (D.skirt) push('skirt', D.skirt === 'long' ? PACK.R.skirtLong : PACK.R.skirtShort, clothMat(sRGB(...(D.skirtColor || D.tunic)), 'wool', { side: THREE.DoubleSide, cut: [D.skirt === 'long' ? -2 : -.2, .17, 9, .01] }), (x, y) => .012 + .012 * Math.max(0, Math.min(1, (.14 - y) / .3)));
  if (D.belt) push('belt', PACK.R.belt, clothMat(sRGB(...D.belt), 'leather', { cut: [.135, .19, 9, .0005] }), .03);
  if (D.cuffs) push('cuffs', PACK.R.cuffs, clothMat(sRGB(...D.cuffs), 'wool', { cut: [-2, 2, .4] }), .02);
  // a fur mantle over the shoulders: eleven shells
  if (D.mantle) for (let k = 0; k < 11; k++) push('mantle' + k, PACK.R.mantle, shellMat(sRGB(...D.mantle), k, 11, { sx: 260, sy: 70, solid: k === 0 }), .036 + k * .0055);
  // hair: cards rooted on the hair shell (off the face), a layer of shell underneath so no scalp shows; brows; beard and moustache as short cards
  if (G.hairCol) { const scalp = PACK.R.scalpRoots;
    push('scalp', scalp, shellMat(sRGB(...G.hairCol).multiplyScalar(.55), 0, 3, { solid: true, hairline: true }), .0025);
    const headB = ix.bones.findIndex(b => b.name === 'head'), bb = new THREE.Box3(); for (const v of scalp) bb.expandByPoint(new THREE.Vector3(P[v * 3], P[v * 3 + 1], P[v * 3 + 2])); const hc = bb.getCenter(new THREE.Vector3()), hr = bb.getSize(new THREE.Vector3()).multiplyScalar(.5).addScalar(.004); hc.y -= .02; hr.y += .02;
    const H = buildHair(P, G, heads, PACK.R.scalpRoots, headB, RND); meshes.push(...H.meshes); hairStats = H.stats;
    for (let k = 0; k < 3; k++) push('brows' + k, PACK.R.brows, shellMat(sRGB(...G.hairCol).multiplyScalar(.5), k + 2, 5, { sx: 1400, sy: 300, solid: false }), .0015 + k * .0012);
    if (G.beard) { const jawB = ix.bones.findIndex(b => b.name === 'jaw');
      push('beardBase', PACK.R.beard, shellMat(sRGB(...G.hairCol).multiplyScalar(.6), 0, 3, { solid: true }), .0015);
      const bc = hairCards(P, PACK.R.beard, { n: 520, len: .02 + .05 * G.beard, seg: 4, width: .011, lift: .15, comb: -.1, fall: 1, grav: .2, rootOff: .002, bone: jawB, color: sRGB(...G.hairCol).multiplyScalar(.92), outward: hc, hug: true, surfs: [surfaceOf(P, PACK.R.beard, hc)] });
      bc.name = 'beard'; meshes.push(bc);
      const mc = hairCards(P, PACK.R.moust, { n: 110, len: .028, seg: 3, width: .009, lift: .2, comb: -.1, fall: 1, grav: .2, rootOff: .002, bone: headB, color: sRGB(...G.hairCol).multiplyScalar(.92), outward: hc });
      mc.name = 'moust'; meshes.push(mc); } }
  root.add(bones[0]); root.updateMatrixWorld(true);
  for (const m of meshes) { root.add(m); m.updateMatrixWorld(true); m.bind(skeleton); m.castShadow = !m.noCast; m.receiveShadow = true; m.frustumCulled = false; }
  // eyes: a white ball with an iris, set in the helper's sockets, carried by the head
  const eyeTex = (() => { const c = document.createElement('canvas'); c.width = c.height = 128; const x = c.getContext('2d'); x.fillStyle = '#d8d0c4'; x.fillRect(0, 0, 128, 128);
    const gr = x.createRadialGradient(64, 64, 3, 64, 64, 15); gr.addColorStop(0, '#050403'); gr.addColorStop(.32, '#050403'); gr.addColorStop(.36, `rgb(${G.eyes.map(v => v * 255 | 0)})`); gr.addColorStop(.9, `rgb(${G.eyes.map(v => v * 150 | 0)})`); gr.addColorStop(1, '#ece6dc');
    x.fillStyle = gr; x.beginPath(); x.ellipse(64, 64, 15, 22, 0, 0, 7); x.fill(); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; })();
  for (const side of ['l', 'r']) { const L = new Set(PACK.G[`helper-${side}-eye`]), c = new THREE.Vector3(); let r = 0; for (const i of L) c.add(new THREE.Vector3(P[i * 3], P[i * 3 + 1], P[i * 3 + 2])); c.divideScalar(L.size); for (const i of L) r = Math.max(r, c.distanceTo(new THREE.Vector3(P[i * 3], P[i * 3 + 1], P[i * 3 + 2])));
    const eg = new THREE.SphereGeometry(r * .8, 32, 24); eg.rotateY(-Math.PI / 2); const e = new THREE.Mesh(eg, new THREE.MeshPhysicalMaterial({ map: eyeTex, roughness: .08, clearcoat: 1 }));
    const head = byName['head']; head.updateWorldMatrix(true, false); e.position.copy(c).sub(heads['head']); e.position.z -= r * .12; head.add(e); }
  // pose: arms down from the A-pose, a slight bend at the elbow, weight on one leg, the head turned a little
  const q = (ax, ay, az) => new THREE.Quaternion().setFromEuler(new THREE.Euler(ax, ay, az, 'XYZ'));
  const pose = Object.assign({ arm: .73, elbow: .62, head: 0, hip: 0 }, G.pose || {});
  byName['upperarm01.L'].quaternion.copy(q(0, 0, -pose.arm)); byName['upperarm01.R'].quaternion.copy(q(0, 0, pose.arm));
  byName['lowerarm01.L'].quaternion.copy(q(pose.elbow, 0, 0)); byName['lowerarm01.R'].quaternion.copy(q(pose.elbow, 0, 0));
  byName['head'].quaternion.copy(q(.04, pose.head, 0)); if (byName['jaw']) byName['jaw'].quaternion.copy(q(pose.jaw ?? -.12, 0, 0)); byName['spine05'].quaternion.copy(q(0, 0, pose.hip));
  for (const side of ['L', 'R']) { const sg = side === 'L' ? -1 : 1; for (let f = 2; f <= 5; f++) for (let j = 1; j <= 3; j++) { const b = byName[`finger${f}-${j}.${side}`]; if (b) b.quaternion.copy(q(0, 0, sg * (.25 + .12 * j))); } }
  root.position.y = -minY; return { root, skeleton, byName, meshes, hair: hairStats };
}

// palettes from OG-025: undyed wool, browns, slate blue, madder red; furs; ash-blond to red hair; pale to weathered skin
const SKIN = [[.86, .70, .60], [.82, .64, .53], [.78, .60, .50], [.88, .74, .66]], HAIR = [[.70, .58, .40], [.52, .38, .24], [.62, .34, .18], [.80, .70, .52], [.40, .30, .20], [.86, .84, .80]];
const WOOL = [[.32, .26, .2], [.24, .27, .32], [.30, .32, .26], [.20, .2, .22], [.45, .16, .12], [.18, .24, .3]], LEATHER = [[.3, .2, .13], [.22, .15, .1], [.36, .25, .16]], FUR = [[.42, .34, .26], [.3, .24, .18], [.55, .48, .4], [.25, .2, .17]];
export function markGenome(rnd, g, o = {}) {
  const pick = a => a[Math.floor(rnd() * a.length)], pickW = W => { let r = rnd() * Object.values(W).reduce((a, b) => a + b, 0); for (const [k, w] of Object.entries(W)) if ((r -= w) < 0) return k; return Object.keys(W)[0]; };
  const old = o.age ?? .5 + rnd() * .15;
  return { g, age: old, muscle: g > .5 ? .62 + rnd() * .3 : .5 + rnd() * .2, weight: .45 + rnd() * .25, height: g > .5 ? .72 + rnd() * .22 : .62 + rnd() * .2, prop: .7, race: { caucasian: 1 },
    face: { 'head-square': g > .5 ? .3 + rnd() * .5 : rnd() * .3, 'chin-width': (rnd() - .3) * .8, 'chin-prominent': (rnd() - .4) * .8, 'nose-scale-vert': (rnd() - .4) * .7, 'nose-point-width': (rnd() - .5) * .6, 'nose-curve': (rnd() - .5) * .8,
      'l-cheek-bones': .3 + rnd() * .5, 'r-cheek-bones': .3 + rnd() * .5, 'forehead-trans': (rnd() - .5) * .5, 'torso-vshape': g > .5 ? .3 + rnd() * .5 : 0, 'neck-scale-horiz': g > .5 ? .3 : -.2, 'mouth-scale-horiz': (rnd() - .5) * .4 },
    seed: o.seed ?? Math.floor(rnd() * 1e9).toString(36), skin: pick(SKIN), eyes: pick([[.45, .55, .62], [.35, .45, .55], [.5, .52, .45], [.38, .3, .2]]), hairCol: o.hair ?? pick(HAIR), hair: { style: o.style ?? pickW(g > .5 ? { short: 7, tail: 1.5, braids: 1.5 } : { braid: 3.5, braids: 2.5, bun: 2, tail: 1, loose: 1 }), len: g > .5 ? .25 + rnd() * .35 : .55 + rnd() * .3 }, beard: g > .5 ? (o.beard ?? .6 + rnd() * .4) : 0,
    dress: { tunic: pick(WOOL), trousers: g > .5 ? pick(WOOL.slice(0, 4)) : null, boots: pick(LEATHER), belt: pick(LEATHER), mantle: o.mantle === false ? null : pick(FUR), skirt: g > .5 ? 'short' : 'long', skirtColor: g > .5 ? null : pick(WOOL), cuffs: rnd() < .5 ? pick(WOOL) : null },
    pose: { arm: .68 + rnd() * .1, elbow: .5 + rnd() * .3, head: (rnd() - .5) * .4, hip: (rnd() - .5) * .04 } };
}

// ── the saved genome (Session 776): what the builder page writes and the game will read ──
// { species, v, seed, people, sliders: {body and face, by name}, race, palette: {skin, hair, eyes} as hex, hair: {style, len, beard},
//   dress: {garment: hex, skirt: 'short'|'long'|null}, pose }. Numbers to three places, so a person is a few hundred bytes.
const hex = c => '#' + c.map(v => Math.round(Math.max(0, Math.min(1, v)) * 255).toString(16).padStart(2, '0')).join('');
const unhex = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16) / 255);
const r3 = v => Math.round(v * 1000) / 1000, round = o => Object.fromEntries(Object.entries(o).map(([k, v]) => [k, r3(v)]));
export const BODY_SLIDERS = ['g', 'age', 'muscle', 'weight', 'height', 'prop'], GARMENTS = ['tunic', 'trousers', 'boots', 'belt', 'mantle', 'cuffs', 'skirtColor'];
export function toSaved(G) {
  const D = G.dress || {}, dress = {}; for (const k of GARMENTS) if (D[k]) dress[k] = hex(D[k]); dress.skirt = D.skirt || null;
  const style = G.hair?.style ?? ((G.hairLen ?? .3) < .45 ? 'short' : 'loose');
  return { species: 'human', v: 1, seed: String(G.seed ?? 'person'), people: G.people || 'markman', sliders: round({ ...Object.fromEntries(BODY_SLIDERS.map(k => [k, G[k] ?? (k === 'prop' ? .6 : .5)])), ...(G.face || {}) }),
    race: round(G.race || { caucasian: 1 }), palette: { skin: hex(G.skin), hair: hex(G.hairCol || [0, 0, 0]), eyes: hex(G.eyes) }, hair: { style, len: r3(G.hair?.len ?? G.hairLen ?? .3), beard: r3(G.beard || 0) },
    dress, pose: round(G.pose || {}) };
}
export function fromSaved(J) {
  if (!J || J.species !== 'human') throw new Error('not a human genome'); const S = J.sliders || {}, G = { seed: J.seed, people: J.people, race: { ...(J.race || { caucasian: 1 }) }, face: {} };
  for (const [k, v] of Object.entries(S)) if (BODY_SLIDERS.includes(k)) G[k] = v; else G.face[k] = v;
  G.skin = unhex(J.palette.skin); G.hairCol = unhex(J.palette.hair); G.eyes = unhex(J.palette.eyes);
  G.hair = { style: J.hair?.style || 'short', len: J.hair?.len ?? .3 }; G.beard = J.hair?.beard || 0;
  G.dress = { skirt: J.dress?.skirt || null }; for (const k of GARMENTS) if (J.dress?.[k]) G.dress[k] = unhex(J.dress[k]); G.pose = { ...(J.pose || {}) }; return G;
}
// a genome rolled from a seed, inside a people's ranges (Markfolk only until B3 writes the four peoples)
export function rollGenome(seed, o = {}) { const rnd = seeded(seed), g = o.g ?? (rnd() < .5 ? 0 : 1); const G = markGenome(rnd, g, { seed: String(seed) }); G.people = 'markman'; return G; }
