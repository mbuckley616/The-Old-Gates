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
      + s.fragmentShader.replace('vec4 diffuseColor = vec4( diffuse, opacity );', `${o.hairline ? 'if (vB.z > .012 && vB.y < .814 - .035 * pow(vB.x / .075, 2.) + (fract(sin(vB.x * 517.) * 431.) - .5) * .004) discard;' : ''} float L = ${(layer / layers).toFixed(3)};
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
let STRANDS = null;
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
    let r = Math.random() * tot, lo = 0, hi = area.length - 1; while (lo < hi) { const m = (lo + hi) >> 1; if (area[m] < r) lo = m + 1; else hi = m; } const t = lo * 3;
    A.fromArray(P, tris[t] * 3); B.fromArray(P, tris[t + 1] * 3); C.fromArray(P, tris[t + 2] * 3); let u = Math.random(), v = Math.random(); if (u + v > 1) { u = 1 - u; v = 1 - v; }
    const p = A.clone().multiplyScalar(1 - u - v).addScaledVector(B, u).addScaledVector(C, v), n = B.clone().sub(A).cross(C.clone().sub(A)).normalize();
    if (o.outward && n.clone().dot(p.clone().sub(o.outward)) < 0) n.negate();
    const front = o.outward && o.sweep ? Math.max(0, Math.min(1, (p.z - o.outward.z) / .05)) : 0; const want = back.clone().multiplyScalar(o.comb).addScaledVector(down, o.fall * (1 - front)).addScaledVector(down, -.9 * front); const tan = want.clone().addScaledVector(n, -want.dot(n)); if (tan.lengthSq() < 1e-6) tan.copy(down);
    let dir = tan.normalize().addScaledVector(n, o.lift).normalize(); const L = o.len * (.7 + .5 * Math.random()), seg = o.seg, w0 = o.width * (.8 + .4 * Math.random());
    const pts = [p.clone().addScaledVector(n, o.rootOff)]; for (let s = 1; s <= seg; s++) { const behind = !o.sweep || pts[s - 1].z < o.outward.z - .01 || pts[s - 1].y < o.hugMinY; dir.addScaledVector(down, behind ? o.grav : 0); if (!behind) dir.addScaledVector(back, .25); dir.normalize(); const q = pts[s - 1].clone().addScaledVector(dir, L / seg);
      for (const S of o.surfs || []) { let bi = 0, bd = 1e9; for (let j = 0; j < S.pts.length; j++) { const d = S.pts[j].distanceToSquared(q); if (d < bd) { bd = d; bi = j; } } const lim = o.rootOff + .0018 * s, h = q.clone().sub(S.pts[bi]).dot(S.ns[bi]); if (bd < .0064 && (h < lim || (o.hug && h < lim + .035 && (o.hugMinY == null || q.y > o.hugMinY)))) q.addScaledVector(S.ns[bi], lim - h); }
      dir.copy(q).sub(pts[s - 1]).normalize();
      if (o.faceZ != null && q.y < p.y - .01 && q.z > o.faceZ) { q.z = o.faceZ - .005; dir.z = Math.min(dir.z, 0); dir.normalize(); }
      if (o.shoulderY && q.y < o.shoulderY && q.z > o.backZ) q.z = o.backZ - Math.random() * .01; pts.push(q); }
    const base = pos.length / 3; for (let s = 0; s <= seg; s++) { const d = s < seg ? pts[s + 1].clone().sub(pts[s]) : pts[s].clone().sub(pts[s - 1]), sraw = d.clone().cross(n), side = (sraw.length() > .3 * d.length() ? sraw : d.clone().cross(new THREE.Vector3(0, 0, 1))).normalize(), w = w0 * (1 - .55 * s / seg);
      pos.push(pts[s].x - side.x * w, pts[s].y - side.y * w, pts[s].z - side.z * w, pts[s].x + side.x * w, pts[s].y + side.y * w, pts[s].z + side.z * w); nor.push(n.x, n.y, n.z, n.x, n.y, n.z); const vv = s / seg; uv.push(0, vv, 1, vv); if (s < seg) { const a = base + s * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); } } }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx); g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
  const nV = pos.length / 3, si = new Uint16Array(nV * 4), sw = new Float32Array(nV * 4); for (let i = 0; i < nV; i++) { si[i * 4] = o.bone; sw[i * 4] = 1; } g.setAttribute('skinIndex', new THREE.BufferAttribute(si, 4)); g.setAttribute('skinWeight', new THREE.BufferAttribute(sw, 4));
  const m = new THREE.MeshStandardMaterial({ map: strandTex(), color: o.color, alphaTest: .42, side: THREE.DoubleSide, roughness: .62 });
  m.onBeforeCompile = sh => { sh.fragmentShader = sh.fragmentShader.replace('#include <normal_fragment_begin>', '#include <normal_fragment_begin>\n normal = normalize(vNormal); if (dot(normal, vViewPosition) < 0.) normal = -normal;'); };
  const mesh = new THREE.SkinnedMesh(g, m); mesh.noCast = true; mesh.customDepthMaterial = new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking, map: strandTex(), alphaTest: .42 }); return mesh;
}

export function makePerson(G, o = {}) {
  const P = morph(G), { ix } = PACK, rest0 = PACK.rest;
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
  if (G.hairCol) { const scalp = PACK.R.scalp;
    push('scalp', scalp, shellMat(sRGB(...G.hairCol).multiplyScalar(.7), 0, 3, { solid: true, hairline: true }), .0025);
    const headB = ix.bones.findIndex(b => b.name === 'head'), bb = new THREE.Box3(); for (const v of scalp) bb.expandByPoint(new THREE.Vector3(P[v * 3], P[v * 3 + 1], P[v * 3 + 2])); const hc = bb.getCenter(new THREE.Vector3()), hr = bb.getSize(new THREE.Vector3()).multiplyScalar(.5).addScalar(.004); hc.y -= .02; hr.y += .02;
    const long = G.hairLen ?? .3, shoulderY = heads['neck01'].y - .02, backZ = heads['neck01'].z - .045;
    const cards = hairCards(P, scalp, { n: 900 + Math.round(1100 * long), len: .08 + .42 * long, seg: 9, width: .018 + .006 * long, lift: 0, comb: .9, fall: .35, grav: .14, rootOff: .005, bone: headB, color: sRGB(...G.hairCol), outward: hc, shoulderY, backZ, faceZ: hc.z - .015, hug: true, sweep: true, surfs: [surfaceOf(P, scalp, hc)], hugMinY: bb.min.y + .02 });
    cards.name = 'hair'; meshes.push(cards);
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
  root.position.y = -minY; return { root, skeleton, byName };
}

// palettes from OG-025: undyed wool, browns, slate blue, madder red; furs; ash-blond to red hair; pale to weathered skin
const SKIN = [[.86, .70, .60], [.82, .64, .53], [.78, .60, .50], [.88, .74, .66]], HAIR = [[.70, .58, .40], [.52, .38, .24], [.62, .34, .18], [.80, .70, .52], [.40, .30, .20], [.86, .84, .80]];
const WOOL = [[.32, .26, .2], [.24, .27, .32], [.30, .32, .26], [.20, .2, .22], [.45, .16, .12], [.18, .24, .3]], LEATHER = [[.3, .2, .13], [.22, .15, .1], [.36, .25, .16]], FUR = [[.42, .34, .26], [.3, .24, .18], [.55, .48, .4], [.25, .2, .17]];
export function markGenome(rnd, g, o = {}) {
  const pick = a => a[Math.floor(rnd() * a.length)];
  const old = o.age ?? .5 + rnd() * .15;
  return { g, age: old, muscle: g > .5 ? .62 + rnd() * .3 : .5 + rnd() * .2, weight: .45 + rnd() * .25, height: g > .5 ? .72 + rnd() * .22 : .62 + rnd() * .2, prop: .7, race: { caucasian: 1 },
    face: { 'head-square': g > .5 ? .3 + rnd() * .5 : rnd() * .3, 'chin-width': (rnd() - .3) * .8, 'chin-prominent': (rnd() - .4) * .8, 'nose-scale-vert': (rnd() - .4) * .7, 'nose-point-width': (rnd() - .5) * .6, 'nose-curve': (rnd() - .5) * .8,
      'l-cheek-bones': .3 + rnd() * .5, 'r-cheek-bones': .3 + rnd() * .5, 'forehead-trans': (rnd() - .5) * .5, 'torso-vshape': g > .5 ? .3 + rnd() * .5 : 0, 'neck-scale-horiz': g > .5 ? .3 : -.2, 'mouth-scale-horiz': (rnd() - .5) * .4 },
    skin: pick(SKIN), eyes: pick([[.45, .55, .62], [.35, .45, .55], [.5, .52, .45], [.38, .3, .2]]), hairCol: o.hair ?? pick(HAIR), hairLen: g > .5 ? .25 + rnd() * .35 : .55 + rnd() * .3, beard: g > .5 ? (o.beard ?? .6 + rnd() * .4) : 0,
    dress: { tunic: pick(WOOL), trousers: g > .5 ? pick(WOOL.slice(0, 4)) : null, boots: pick(LEATHER), belt: pick(LEATHER), mantle: o.mantle === false ? null : pick(FUR), skirt: g > .5 ? 'short' : 'long', skirtColor: g > .5 ? null : pick(WOOL), cuffs: rnd() < .5 ? pick(WOOL) : null },
    pose: { arm: .68 + rnd() * .1, elbow: .5 + rnd() * .3, head: (rnd() - .5) * .4, hip: (rnd() - .5) * .04 } };
}
