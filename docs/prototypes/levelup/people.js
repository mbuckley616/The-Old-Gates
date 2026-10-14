// People from a genome (Session 770): MakeHuman's base body (CC0) morphed by its own targets, skinned to its own
// skeleton and posed, then dressed in garments cut from MakeHuman's fitting shells ("tights", "skirt", "hair"), which
// the same targets reshape, so every garment fits every body. The genome is a handful of numbers; the look is the
// slice's renderer. Pack: mh_pack.py -> mh/pack.json, mh/pack.bin.
import * as THREE from 'three';

let PACK = null;
const beardLine = x => { const t = Math.max(0, Math.min(1, (Math.abs(x) - .032) / .038)); return .675 + .037 * t ** 1.3; };
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
    // the beard under a cheek line (Session 840): from the sideburn by the ear (y .712) down to the corner of the mouth
    // (y .675), 2 to 3 cm under the eye (its lower lid is at y .715); Session 770's flat top at y .705 reached the lid
    beard: sel(G['body'], (x, y, z) => y > .6 && y < beardLine(x) && z > .02 && (Math.hypot(x / 1.1, y - .655) > .022 || y < .64) && !(y > .66 && y < .705 && Math.abs(x) < .018 && z > .15)),
    beardBase: sel(G['body'], (x, y, z) => y > .6 && y < beardLine(x) - .008 && z > .02 && (Math.hypot(x / 1.1, y - .655) > .022 || y < .64) && !(y > .66 && y < .705 && Math.abs(x) < .018 && z > .15)),
    // the moustache over the whole upper lip, up to the nose's base (y .684) in the middle and lower toward the nostril's
    // wing, where a card stood out by the nose
    moust: sel(G['body'], (x, y, z) => y > .662 && y < .684 - .4 * Math.max(0, Math.abs(x) - .01) && z > .1 && Math.abs(x) < .033),
    scalp: sel(G['body'], (x, y, z) => { const hl = .808 - .035 * (x / .075) ** 2; return y > .64 && Math.abs(x) < .115 && !(z > .015 && y < hl) && !(y < .77 && Math.abs(x) > .06 && z > -.035) && !(z > -.01 && y < .72) && !(y < .69 && z > -.06); }),
    // where hair roots: the old scalp plus the sides down to above the ears and the back down to the nape (Session 804),
    // so a style that lifts the hair up and back (a bun, a braid) does not bare the temples
    scalpRoots: sel(G['body'], (x, y, z) => { const hl = .796 - .03 * (x / .075) ** 2; return y > .66 && Math.abs(x) < .11 && (z > .05 ? y > hl : z > .022 ? y > (Math.abs(x) > .05 ? .755 : .7) : y > .695); }),
    // the wardrobe's first pieces (Session 805): a waist apron off the skirt shell, its bib off the tights, a hood over the head with the face open
    apron: sel(G['helper-skirt'], (x, y, z) => z > .015 && Math.abs(x) < .2 && y > -.6),
    apronBib: sel(tri, (x, y, z) => z > .03 && Math.abs(x) < .14 && y > .08 && y < .5),
    hood: sel(G['body'], (x, y, z) => y > .6 && !(z > .03 && (x / .06) ** 2 + ((y - .71) / .085) ** 2 < 1)),
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
    s.fragmentShader = 'uniform sampler2D tW; varying vec3 vB;\n' + TRI + s.fragmentShader.replace('vec4 diffuseColor = vec4( diffuse, opacity );', CUT(o.cut) + (o.hole ? `if (${o.hole}) discard;` : '') + `vec4 diffuseColor = vec4( diffuse * triTex(tW, ${(o.scale ?? (kind === 'leather' ? 9 : 22)).toFixed(1)})${o.inner ? ` * (gl_FrontFacing ? 1. : ${o.inner.toFixed(2)})` : ''}, opacity );`); };
  m.customProgramCacheKey = () => 'cloth' + kind + JSON.stringify(o.cut || 0) + (o.scale || 0) + (o.hole || '') + (o.inner || '');
  return m;
}
// fur and hair: stacked shells, each cut by noise so strands rise from the surface
function shellMat(color, layer, layers, o = {}) {
  const m = new THREE.MeshStandardMaterial({ color, roughness: .85, side: THREE.DoubleSide, alphaTest: .5 });
  m.onBeforeCompile = s => {
    s.vertexShader = 'attribute vec3 aBase; varying vec3 vB; varying vec3 vRP;\n' + s.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\n vRP = position; vB = aBase;');
    s.fragmentShader = 'varying vec3 vB; varying vec3 vRP;\nfloat hh(vec3 p){ p = fract(p * .3183099 + .1); p *= 17.; return fract(p.x * p.y * p.z * (p.x + p.y + p.z)); }\nfloat nz(vec3 x){ vec3 i = floor(x), f = fract(x); f = f * f * (3. - 2. * f); return mix(mix(mix(hh(i), hh(i + vec3(1,0,0)), f.x), mix(hh(i + vec3(0,1,0)), hh(i + vec3(1,1,0)), f.x), f.y), mix(mix(hh(i + vec3(0,0,1)), hh(i + vec3(1,0,1)), f.x), mix(hh(i + vec3(0,1,1)), hh(i + vec3(1,1,1)), f.x), f.y), f.z); }\n'
      + s.fragmentShader.replace('vec4 diffuseColor = vec4( diffuse, opacity );', `float hl = 1.; ${o.hairline ? 'if (vB.z > .05) { float e = vB.y - (.8 - .03 * pow(vB.x / .075, 2.) + (nz(vB * vec3(140., 60., 140.)) - .5) * .009); if (e < 0.) discard; hl = smoothstep(0., .014, e); }' : ''} float L = ${(layer / layers).toFixed(3)};
        vec3 q = vRP * vec3(${o.sx ?? 380}., ${o.sy ?? 90}., ${o.sx ?? 380}.); float strand = nz(q) * .7 + nz(q * 2.3) * .3;
        float keep = ${o.solid ? '1.' : 'step(L * .85 + .1, strand)'};
        vec4 diffuseColor = vec4(diffuse * (.42 + .75 * L) * (.85 + .3 * strand), keep);${o.skin ? '\n        diffuseColor.rgb = mix(skinC, diffuseColor.rgb, hl);' : ''}`);
    // the hairline's fade (Session 875): from the skin's own colour at the edge to the shell's over 1.4 cm, so the roots read as a shadow
    if (o.skin) { s.uniforms.skinC = { value: o.skin }; s.fragmentShader = 'uniform vec3 skinC;\n' + s.fragmentShader; } };
  m.customProgramCacheKey = () => 'shell' + layer + '/' + layers + JSON.stringify({ ...o, skin: !!o.skin });
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

// ── groomed hair (Session 804): strands that lie on the head ──
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
  let edgeN = 0, edgeW = 0, backN = 0, backW = 0; const strands = [], short = style === 'short', free = style === 'loose', L = short ? .05 + .1 * len : free ? .12 + .5 * len : .5, nS = short ? 1400 : free ? 2200 : 1700, step = .009, thick = short ? .006 : .011;
  for (let k = 0; k < nS; k++) {
    let r = rnd() * tot, lo = 0, hi = area.length - 1; while (lo < hi) { const m = (lo + hi) >> 1; if (area[m] < r) lo = m + 1; else hi = m; } const t = lo * 3;
    A.fromArray(P, scalpTris[t] * 3); B.fromArray(P, scalpTris[t + 1] * 3); C.fromArray(P, scalpTris[t + 2] * 3); let u = rnd(), v = rnd(); if (u + v > 1) { u = 1 - u; v = 1 - v; }
    const p = A.clone().multiplyScalar(1 - u - v).addScaledVector(B, u).addScaledVector(C, v), side = Math.abs(p.x - hc.x) < .004 ? (rnd() < .5 ? -1 : 1) : Math.sign(p.x - hc.x);
    const off = .003 + thick * rnd() ** .7, g = gather.length === 2 ? gather[side < 0 ? 0 : 1] : gather[0];
    let q = p.clone(), e = S.near(q), n = e ? e.n.clone() : p.clone().sub(hc).normalize(); q.addScaledVector(n, off);
    // the parting (Session 874): only the strands rooted forward of the crown split to either side; behind it the side pull
    // grows smoothly from nothing at the midline, so no seam of bare scalp runs down the back of the head
    const sx = Math.max(-1, Math.min(1, (p.x - hc.x) / hr.x)), fore = Math.max(0, Math.min(1, (p.z - hc.z + .02) / .06)), sideW = .45 * (fore * side + (1 - fore) * sx);
    // the front hairline (Session 875): a strand rooted within 1.5 cm of it is finer, down to a third of the width at the edge,
    // so the hair thins out onto the brow instead of starting at full width on one line
    const r0 = new THREE.Vector3().fromArray(R0, scalpTris[t] * 3).multiplyScalar(1 - u - v).addScaledVector(new THREE.Vector3().fromArray(R0, scalpTris[t + 1] * 3), u).addScaledVector(new THREE.Vector3().fromArray(R0, scalpTris[t + 2] * 3), v);
    const eF = r0.z > .04 ? Math.max(0, Math.min(1, (r0.y - (.796 - .03 * (r0.x / .075) ** 2)) / .015)) : 1, fine = .35 + .65 * eF * eF * (3 - 2 * eF);
    const pts = [q.clone()], ns = [n.clone()], dir = new THREE.Vector3(), myL = L * (free ? (.7 + .45 * rnd()) * (1 - .22 * sx * sx) : .75 + .4 * rnd()), relY = free ? hc.y - .03 - .035 * rnd() : 0; let fell = -1, under = false, nRel = null;
    for (let l = 0; l < myL + (g ? 1 : 0); l += step) {
      let want;
      if (g) { want = g.p.clone().sub(q).normalize(); const front = Math.max(0, Math.min(1, (q.z - hc.z + .01) / .05)); want.z -= 1.4 * front; }
      else { const back = Math.max(0, Math.min(1, (faceZ + .02 - q.z) / .1)); want = new THREE.Vector3(sideW, -(.25 + .75 * back), -(1 - .55 * back));
        // loose hair leaves the skull where the skull turns under (its surface faces down), so it parts from it on a tangent and
        // with no ledge; then it falls straight down with a little spread to the side, and never back in toward the head's axis,
        // so it hangs as wide as the head and is not pinched in to the nape
        if (free && q.z < hc.z && q.y < hc.y - .02 && (under || n.y < -.08 || q.y < relY - .05)) { under = true; if (fell < 0) { fell = pts.length - 1; nRel = n.clone(); } const ax = new THREE.Vector3(q.x - hc.x, 0, q.z - hc.z).normalize(); want.set(sx * .08, -1, 0);
          const din = dir.x * ax.x + dir.z * ax.z; if (din < 0) { dir.x -= din * ax.x; dir.z -= din * ax.z; } } }
      const stick = g || short || (free ? !under : onHead(q)), hit = heightOver(S, q);
      if (stick && hit) want.addScaledVector(hit.e.n, -want.dot(hit.e.n));
      want.normalize(); dir.lerp(want, l === 0 ? 1 : .5).normalize();
      const q2 = q.clone().addScaledVector(dir, step), h2 = heightOver(S, q2);
      if (h2) { const c = stick || onHead(q2) ? off : clearAt(q2) + off; if (stick || h2.h < c) q2.addScaledVector(h2.e.n, c - h2.h); n.copy(h2.e.n); }
      if (!stick) { n.set(q2.x, 0, q2.z - heads['neck01'].z).normalize(); if (nRel) n.lerp(nRel, Math.max(0, 1 - (pts.length - fell) / 8)).normalize(); }
      if (!onHead(q2) && q2.z > backZ && Math.abs(q2.x) < .12) q2.z = backZ;
      pts.push(q2); ns.push(n.clone()); q = q2;
      if (g && q.distanceTo(g.p) < .012) break;
      // under the fur mantle loose hair is worn inside the collar (Session 874): the fur's eleven shells stand 10 cm off the neck,
      // too thick for the hair to lie over without a tangle where it comes back out, so the strand ends where the collar takes it
      if (free && D.mantle && under && q.y < neckY - .01) break; }
    // what fell is smoothed, so the push-outs over the shoulders and the mantle leave a curve and not a stepped shelf, then cleared once more
    if (fell > 0) { for (let it = 0; it < 8; it++) for (let i = fell + 1; i < pts.length - 1; i++) pts[i].lerp(pts[i - 1].clone().add(pts[i + 1]).multiplyScalar(.5), .5);
      for (const q3 of pts.slice(fell + 1)) { const h3 = heightOver(S, q3), c = (onHead(q3) ? 0 : clearAt(q3)) + off; if (h3 && h3.h < c) q3.addScaledVector(h3.e.n, c - h3.h); } }
    if (r0.z > .04) { if (eF < .5) { edgeN++; edgeW += fine; } else if (eF >= 1) { backN++; backW += fine; } }
    strands.push({ pts, ns, w: (short ? .008 : free ? .008 : .011) * (.8 + .4 * rnd()) * fine, tip: free ? .85 : .5, v0: 0, v1: Math.min(1, pts.length * step / (g ? .35 : myL)) });
  }
  // the checks' numbers: strand points under the skin, and strand points lying on the face (by the rest place of the skin under them)
  let inside = 0, onFace = 0, pts = 0; for (const st of strands) for (const q of st.pts) { pts++; const hit = heightOver(S, q); if (!hit) continue; if (hit.h < -.001) inside++;
    const v = hit.e.v, x = R0[v * 3], y = R0[v * 3 + 1], z = R0[v * 3 + 2]; if (hit.h < .03 && z > .05 && y > .6 && y < .79 - .03 * (x / .075) ** 2 && Math.abs(x) < .07) onFace++; }
  // Session 874's number, the seam: points down the back of the scalp's midline, above the occiput, with no strand over them within 4 mm
  const SG = new Map(), sk = (x, y, z) => Math.floor(x / .01) + ',' + Math.floor(y / .01) + ',' + Math.floor(z / .01);
  for (const st of strands) for (const q of st.pts) { const k = sk(q.x, q.y, q.z); if (!SG.has(k)) SG.set(k, []); SG.get(k).push(q); }
  const nearStrand = (q, n) => { let bd = 1e9; const i = Math.floor(q.x / .01), j = Math.floor(q.y / .01), k = Math.floor(q.z / .01), d = new THREE.Vector3();
    for (let a = -2; a <= 2; a++) for (let b = -2; b <= 2; b++) for (let c = -2; c <= 2; c++) for (const w of SG.get((i + a) + ',' + (j + b) + ',' + (k + c)) || []) { d.copy(w).sub(q); const h = d.dot(n); if (h < -.004 || h > .02) continue; bd = Math.min(bd, d.addScaledVector(n, -h).lengthSq()); } return Math.sqrt(bd); };
  let seamN = 0, seamBare = 0; for (let t = 0; t < scalpTris.length; t += 3) { A.fromArray(P, scalpTris[t] * 3); B.fromArray(P, scalpTris[t + 1] * 3); C.fromArray(P, scalpTris[t + 2] * 3);
    const tn = B.clone().sub(A).cross(C.clone().sub(A)).normalize(); if (tn.dot(A.clone().sub(hc)) < 0) tn.negate();
    for (const q of [A.clone().add(B).add(C).multiplyScalar(1 / 3), A.clone().add(B).multiplyScalar(.5), B.clone().add(C).multiplyScalar(.5), C.clone().add(A).multiplyScalar(.5)]) if (q.z < hc.z - .03 && Math.abs(q.x - hc.x) < .015 && q.y > hc.y - .02) { seamN++; if (nearStrand(q, tn) > .004) seamBare++; } }
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
  return { meshes: out, stats: { style, strands: strands.length, gather: gather.length, points: pts, inside, onFace, drapeMin: +drapeMin.toFixed(4), seam: seamN ? +(seamBare / seamN).toFixed(3) : 0, seamN, hairline: { edge: edgeN, ratio: +((edgeW / Math.max(1, edgeN)) / (backW / Math.max(1, backN))).toFixed(3) } } };
}

// ── the cloak (Session 805, B2): cloth hung from the shoulders ──
// Built after the pose, on the posed body: a ring of columns round the base of the neck, each started on the shoulder
// line and let fall under gravity, pushed clear of the body and what it wears (the drape the braids use). Neighbouring
// columns are then held to a spacing that widens toward the hem, folds are rippled in, and the grid becomes the sheet.
// It opens at the throat, where a round brooch pins it (OG-048, OG-059; OG-025's iron clasps). Its hood lies rolled on
// the shoulders, or is up over the head as a fitted shell (a skinned garment, so it follows the head).
function posedBody(body) {
  const n = PACK.N, out = new Float32Array(n * 3), v = new THREE.Vector3(); body.updateMatrixWorld(true);
  for (let i = 0; i < n; i++) { body.getVertexPosition(i, v); out[i * 3] = v.x; out[i * 3 + 1] = v.y; out[i * 3 + 2] = v.z; } return out;
}
function buildCloak(G, body, byName, rnd) {
  const D = G.dress, out = [], PP = posedBody(body), S = surfGrid(PP, PACK.G['body'], (x, y) => y > -.75);
  const neck = new THREE.Vector3(); byName['neck01'].getWorldPosition(neck); const neckY = neck.y;
  // a shoulder cape (Session 841; OG-059's short red capes on round brass pins, OG-048): cut to the elbows, wrapped round
  // to a narrow gap at the throat, and flared, so it falls over the arms as a circle of cloth rather than a back panel
  const len = D.cloakLen ?? .8, cape = !!D.cape, L = cape ? .24 + .14 * len : .4 + 1.0 * len, K = 56, open = cape ? .14 : .38, flare = cape ? 1.55 : 1.12 + .4 * len;
  const clearAt = q => { const k = Math.max(0, Math.min(1, (neckY - .02 - q.y) / .03)); return .03 + k * ((D.mantle && q.y > neckY - .32 ? .095 : D.tunic ? .04 : .015) - .01); };
  // the shoulder line: for each angle round the neck, the surface point furthest out and a little down from the neck
  const cols = [], tops = [];
  for (let k = 0; k < K; k++) { const th = -Math.PI + open + (k / (K - 1)) * (2 * Math.PI - 2 * open), dir = new THREE.Vector3(Math.sin(th), 0, -Math.cos(th));
    const e = S.extreme(neck, dir.clone().add(new THREE.Vector3(0, -.42, 0)).normalize(), p => p.y > neckY - .16 && p.y < neckY + .03);
    const start = e.p.clone().addScaledVector(e.n, clearAt(e.p) + .006); tops.push({ start, dir, n: e.n });
    cols.push(drape(S, start, dir.clone().multiplyScalar(.5).add(new THREE.Vector3(0, -1, 0)), L, q => clearAt(q) + .006)); }
  const R = Math.min(...cols.map(c => c.length));
  // hold neighbours to a spacing that widens toward the hem, then clear the body again
  const sp0 = cols.slice(1).map((c, k) => c[0].distanceTo(cols[k][0]));
  for (let it = 0; it < 8; it++) {
    for (let r = 1; r < R; r++) { const t = r / (R - 1), f = 1 + (flare - 1) * t;
      for (let k = 0; k < K - 1; k++) { const a = cols[k][r], b = cols[k + 1][r], d = a.distanceTo(b), want = sp0[k] * f; if (d > want * 1.02 || d < want * .6) { const m = a.clone().sub(b).multiplyScalar((d - want) / d * .5); a.sub(m); b.add(m); } } }
    for (const c of cols) for (let r = 1; r < R; r++) { const q = c[r], seg = q.clone().sub(c[r - 1]), l = seg.length(); if (l > .0105) q.copy(c[r - 1]).addScaledVector(seg, .0105 / l);
      const cl = clearAt(q) + .006, hit = heightOver(S, q); if (hit && hit.h < cl) q.addScaledVector(hit.e.n, cl - hit.h); } }
  // the hang (Session 839, #274's A): each column is moved as one curve, in polar terms round the neck's vertical axis.
  // Below the last row where it lies on the body (the shoulder, the arm, the hand), it comes in toward the legs, halfway
  // to the body's outline below it, along a smooth step; then folds are laid down whole columns, out and in, deepening
  // toward the hem, never in closer than the body allows; the hem rises on a fold's ridge and drops in its trough.
  const worn = wornMask(D), H = buildHang(cols, R, PP, neck, clearAt, len, rnd, worn);
  // the sheet
  const pos = [], uv = [], idx = [];
  for (let k = 0; k < K; k++) for (let r = 0; r < R; r++) { const q = cols[k][r]; pos.push(q.x, q.y, q.z); uv.push(k / (K - 1), r / (R - 1)); }
  for (let k = 0; k < K - 1; k++) for (let r = 0; r < R - 1; r++) { const a = k * R + r, b = a + R; idx.push(a, a + 1, b, b, a + 1, b + 1); }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('aBase', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx); g.computeVertexNormals();
  const cm = clothMat(sRGB(...D.cloak), D.cloakFur ? 'leather' : 'wool', { side: THREE.DoubleSide, scale: 26 }), cloak = new THREE.Mesh(g, cm); cloak.name = 'cloak'; out.push(cloak);
  // an embroidered hem (OG-048, OG-059: red embroidered borders): a band of its own colour over the last 3.5 cm of the
  // sheet, laid 1.5 mm proud of it round the neck's axis so it never sinks into the cloth
  if (D.cloakHem) { const nb = Math.min(R - 2, Math.round(.035 / .0105)), bp = [], bi = [];
    for (let k = 0; k < K; k++) for (let r = R - 1 - nb; r < R; r++) { const q = cols[k][r], dx = q.x - neck.x, dz = q.z - neck.z, l = Math.hypot(dx, dz) || 1; bp.push(q.x + dx / l * .0015, q.y - (r === R - 1 ? .001 : 0), q.z + dz / l * .0015); }
    for (let k = 0; k < K - 1; k++) for (let r = 0; r < nb; r++) { const a = k * (nb + 1) + r, b = a + nb + 1; bi.push(a, a + 1, b, b, a + 1, b + 1); }
    const bg = new THREE.BufferGeometry(); bg.setAttribute('position', new THREE.Float32BufferAttribute(bp, 3)); bg.setAttribute('aBase', new THREE.Float32BufferAttribute(bp, 3)); bg.setIndex(bi); bg.computeVertexNormals();
    const bm = new THREE.Mesh(bg, clothMat(sRGB(...D.cloakHem), 'wool', { side: THREE.DoubleSide, scale: 60 })); bm.name = 'cloakHem'; out.push(bm); }
  // a fur lining turned out at the collar (the Markmen's), or the hood rolled on the shoulders
  const ring = tops.map(t => t.start.clone().addScaledVector(t.n, .012).add(new THREE.Vector3(0, .012, 0)));
  if (D.cloakFur) for (let s = 0; s < 6; s++) { const m = new THREE.Mesh(tubeGeom(ring, ring.map(() => .026 + s * .004), 8), shellMat(sRGB(...D.cloakFur), s, 6, { sx: 260, sy: 70, solid: s === 0 })); m.geometry.setAttribute('aBase', m.geometry.attributes.position); m.name = 'collar' + s; out.push(m); }
  else if (D.hood === 'down') { const back = ring.slice(Math.round(K * .3), Math.round(K * .7)).map(q => q.clone().lerp(new THREE.Vector3(neck.x, q.y + .025, neck.z), .25)), m = new THREE.Mesh(tubeGeom(back, back.map((_, i) => .03 + .018 * Math.sin(Math.PI * i / (back.length - 1))), 10), clothMat(sRGB(...D.cloak).multiplyScalar(.92), 'wool', { scale: 26 })); m.geometry.setAttribute('aBase', m.geometry.attributes.position); m.name = 'hood'; out.push(m); }
  // the brooch at the throat, where the two front columns meet
  const a = tops[0], b = tops[K - 1], at = a.start.clone().add(b.start).multiplyScalar(.5), nrm = a.n.clone().add(b.n).normalize();
  const br = new THREE.Mesh(new THREE.CylinderGeometry(.021, .021, .006, 24), new THREE.MeshStandardMaterial({ color: sRGB(...(D.brooch || [.55, .42, .2])), metalness: .9, roughness: .38 }));
  br.position.copy(at).addScaledVector(nrm, .012); br.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), nrm); br.name = 'brooch'; out.push(br);
  const boss = new THREE.Mesh(new THREE.SphereGeometry(.007, 12, 8), br.material); boss.position.copy(br.position).addScaledVector(nrm, .005); out.push(boss);
  for (const m of out) { m.castShadow = true; m.receiveShadow = true; m.frustumCulled = false; }
  let minClear = 1, under = 0; for (const c of cols) for (const q of c) { const hit = heightOver(S, q); if (hit) { minClear = Math.min(minClear, hit.h); if (hit.h < .005) under++; } }
  return { meshes: out, stats: { columns: K, rows: R, tris: idx.length / 3, minClear: +minClear.toFixed(4), under, brooch: +br.position.distanceTo(neck).toFixed(3), cape, hemDrop: +(neck.y - cols.reduce((a, c) => a + c[R - 1].y, 0) / K).toFixed(3), hem: !!D.cloakHem, ...H.stats, through: armsThrough(cols, R, PP, neck, worn) } };
}

// the body round the neck's axis: for each height (2 cm) and angle (4°) the furthest point of the posed body, so a
// column can ask how far in it may come at any height (Session 839)
// which points of the pack stand for what the person wears under the cloak: the body, and the skirt's fitting shell
// when a skirt is worn (the short tunic's skirt is cut from it, and stands out of the body by up to 2.5 cm, plus its push)
function wornMask(D) { const m = new Uint8Array(PACK.N); for (const v of PACK.G['body']) m[v] = 1;
  if (D.skirt) { const sk = D.skirt === 'long' ? PACK.R.skirtLong : PACK.R.skirtShort; for (const v of sk) m[v] = 2; } return m; }
function radialMap(PP, ax, az, y0, y1, B) {
  const NA = 90, NY = Math.ceil((y1 - y0) / .02) + 1, M = new Float32Array(NA * NY), n = PP.length / 3;
  for (let i = 0; i < n; i++) { if (!B[i]) continue; const y = PP[i * 3 + 1]; if (y < y0 || y > y1) continue; const dx = PP[i * 3] - ax, dz = PP[i * 3 + 2] - az, r = Math.hypot(dx, dz) + (B[i] === 2 ? .025 : 0);
    const a = ((Math.round((Math.atan2(dx, -dz) + Math.PI) / (2 * Math.PI) * NA) % NA) + NA) % NA, j = Math.round((y - y0) / .02), o = j * NA + a; if (r > M[o]) M[o] = r; }
  const S = new Float32Array(M.length); for (let j = 0; j < NY; j++) for (let a = 0; a < NA; a++) { let m = 0; for (let d = -2; d <= 2; d++) for (let e = -1; e <= 1; e++) { const jj = j + e; if (jj < 0 || jj >= NY) continue; m = Math.max(m, M[jj * NA + (a + d + NA) % NA]); } S[j * NA + a] = m; }
  return (th, y) => { const j = Math.max(0, Math.min(NY - 1, Math.round((y - y0) / .02))), a = ((Math.round((th + Math.PI) / (2 * Math.PI) * NA) % NA) + NA) % NA; return S[j * NA + a]; };
}
function buildHang(cols, R, PP, neck, clearAt, len, rnd, B) {
  const ax = neck.x, az = neck.z, K = cols.length, polar = q => ({ th: Math.atan2(q.x - ax, -(q.z - az)), r: Math.hypot(q.x - ax, q.z - az) });
  let yLo = 1e9; for (const c of cols) yLo = Math.min(yLo, c[R - 1].y); const yTop = neck.y, bodyR = radialMap(PP, ax, az, yLo - .1, yTop + .05, B);
  const setR = (q, th, r) => { q.x = ax + Math.sin(th) * r; q.z = az - Math.cos(th) * r; };
  const floorAt = q => { const p = polar(q); return bodyR(p.th, q.y) + clearAt(q) + .006; };
  // the columns in order round the axis on every row: the shoulder line can cross itself at the spine, which was hidden
  // while every column stood at one radius and shows as the sheet turned inside out once they come in by different amounts
  let untangled = 0;
  for (let r = 0; r < R; r++) { const P0 = cols.map(c => polar(c[r])), g = .3 * (P0[K - 1].th - P0[0].th) / (K - 1), th = P0.map(p => p.th);
    for (let it = 0; it < 4; it++) { for (let k = 1; k < K; k++) if (th[k] < th[k - 1] + g) th[k] = th[k - 1] + g; for (let k = K - 2; k >= 0; k--) if (th[k] > th[k + 1] - g) th[k] = th[k + 1] - g; }
    for (let k = 0; k < K; k++) if (Math.abs(th[k] - P0[k].th) > 1e-6) { setR(cols[k][r], th[k], P0[k].r); untangled++; } }
  // the last row each column lies on the body, smoothed across the columns so neighbours come in together
  const contact = cols.map(c => { let last = 0; for (let r = 1; r < R; r++) { const q = c[r]; if (q.y > yTop - .1) continue; if (polar(q).r - floorAt(q) < .02) last = r; } return last; });
  for (let it = 0; it < 4; it++) { const c0 = contact.slice(); for (let k = 0; k < K; k++) contact[k] = (c0[Math.max(0, k - 1)] + 2 * c0[k] + c0[Math.min(K - 1, k + 1)]) / 4; }
  const ss = (a, b, x) => { const t = Math.max(0, Math.min(1, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
  // how far each point would come in, worked out per column, then smoothed across the columns before any point moves,
  // so a column over the spine's groove does not drop in alone and crease the sheet
  const dr = cols.map(() => new Float32Array(R)), envs = [];
  for (let k = 0; k < K; k++) { const c = cols[k], r0i = Math.max(1, Math.min(R - 2, Math.round(contact[k]))), q0 = c[r0i], p0 = polar(q0);
    // the body's widest from each row down to the hem, at this column's angle: the curve comes in only where nothing
    // below it would push it out again, so it never bulges back
    const env = new Float32Array(R); env[R - 1] = floorAt(c[R - 1]); for (let r = R - 2; r >= 0; r--) env[r] = Math.max(env[r + 1], floorAt(c[r])); envs.push(env);
    const room = Math.max(0, p0.r - env[R - 1] - .012);
    for (let r = r0i + 1; r < R; r++) { const p = polar(c[r]), want = Math.max(env[r] + .012, p0.r - room * .75 * ss(0, .35, q0.y - c[r].y)); dr[k][r] = Math.min(0, want - p.r); } }
  for (let it = 0; it < 8; it++) for (let r = 1; r < R; r++) { const row = dr.map(d => d[r]); for (let k = 0; k < K; k++) dr[k][r] = (row[Math.max(0, k - 1)] + 2 * row[k] + row[Math.min(K - 1, k + 1)]) / 4; }
  let tapered = 0;
  for (let k = 0; k < K; k++) for (let r = 1; r < R; r++) { if (dr[k][r] > -1e-4) continue; const q = cols[k][r], p = polar(q); setR(q, p.th, Math.max(p.r + dr[k][r], envs[k][r] + .012, floorAt(q))); tapered++; }
  // no sharp lobes: what the hand or the hip pushes out, the cloth rises to and falls from gently, never more than a
  // centimetre out for three down, below the shoulders, along each column (it only ever moves out, so stays clear)
  { const rad = cols.map(c => c.map(q => polar(q).r)), cone = .33, step = .0105;
    for (let k = 0; k < K; k++) { const a = rad[k], b = a.slice(); for (let r = 1; r < R; r++) { if (cols[k][r].y > yTop - .25) continue; for (let d = -12; d <= 12; d++) { const j = r + d; if (j < 1 || j >= R) continue; const v = a[j] - cone * step * Math.abs(d); if (v > b[r]) b[r] = v; } } rad[k] = b; }
    for (let k = 0; k < K; k++) for (let r = 1; r < R; r++) { const q = cols[k][r], p = polar(q); if (rad[k][r] > p.r + 1e-5) setR(q, p.th, rad[k][r]); } }
  // how far the hem has come in from the widest the column stands below the shoulders, and how far it still stands
  // off what is under it (the legs, or a long skirt it cannot come in past) at the median column, before the folds
  let hemIn = 0; for (const c of cols) { let w = 0; for (const q of c) if (q.y < yTop - .25) w = Math.max(w, polar(q).r); hemIn += (w - polar(c[R - 1]).r) / K; }
  const hemSlack = cols.map(c => polar(c[R - 1]).r - floorAt(c[R - 1])).sort((a, b) => a - b)[K >> 1];
  // the folds: whole columns, a wave of about six columns with a wander, deepening from the shoulders to the hem
  const ph = rnd() * 6, P = 5.5 + rnd(), Amax = .03 + .025 * len; let deep = 0;
  const fold = cols.map((_, k) => { const e = Math.min(1, k / 2.5, (K - 1 - k) / 2.5), w = Math.sin(2 * Math.PI * k / P + ph + .9 * Math.sin(k * .37 + ph)); return e * Math.sign(w) * Math.abs(w) ** .7; });
  for (let k = 0; k < K; k++) for (let r = 1; r < R; r++) { const q = cols[k][r], s = Math.max(0, Math.min(1, (yTop - .12 - q.y) / (yTop - .12 - yLo))), p = polar(q), A = Amax * s ** 1.1;
    let d = A * fold[k]; if (d < 0) { const space = Math.max(0, p.r - floorAt(q)); d = -space * (1 - Math.exp(d / Math.max(space, 1e-4))); }
    setR(q, p.th, p.r + d); q.y += .45 * d * s ** 4; if (Math.abs(d) > deep) deep = Math.abs(d); }
  let crossed = 0; for (let r = 0; r < R; r++) for (let k = 1; k < K; k++) if (polar(cols[k][r]).th < polar(cols[k - 1][r]).th) crossed++;
  return { stats: { untangled, crossed, tapered, hemIn: +hemIn.toFixed(4), hemSlack: +hemSlack.toFixed(4), foldDepth: +deep.toFixed(4), foldPeriod: +P.toFixed(2) } };
}
// nothing of the body inside the cloak's span comes out through it: each body point under the shoulders and above the
// hem, between the second column and the second-last, lies nearer the axis than the sheet at its angle and height
function armsThrough(cols, R, PP, neck, BM) {
  const ax = neck.x, az = neck.z, K = cols.length, pol = cols.map(c => c.map(q => ({ th: Math.atan2(q.x - ax, -(q.z - az)), r: Math.hypot(q.x - ax, q.z - az), y: q.y })));
  const at = (k, y) => { const c = pol[k]; let lo = 0; while (lo < R - 2 && c[lo + 1].y > y) lo++; const a = c[lo], b = c[lo + 1], t = Math.max(0, Math.min(1, (a.y - y) / Math.max(1e-6, a.y - b.y))); return { th: a.th + (b.th - a.th) * t, r: a.r + (b.r - a.r) * t }; };
  let yHem = -1e9; for (const c of pol) yHem = Math.max(yHem, c[R - 1].y); const yTop = neck.y - .14, n = PP.length / 3, NB = Math.max(1, Math.ceil((yTop - yHem) / .01)), tab = [];
  for (let j = 0; j <= NB; j++) { const y = yTop - j * .01; tab.push(cols.map((_, k) => at(k, y))); }
  let tested = 0, out = 0;
  for (let i = 0; i < n; i++) { if (!BM[i]) continue; const y = PP[i * 3 + 1]; if (y > yTop || y < yHem + .01) continue; const dx = PP[i * 3] - ax, dz = PP[i * 3 + 2] - az, th = Math.atan2(dx, -dz), r = Math.hypot(dx, dz) + (BM[i] === 2 ? .025 : 0), row = tab[Math.round((yTop - y) / .01)];
    if (th < row[1].th || th > row[K - 2].th) continue; let k = 1; while (k < K - 2 && row[k + 1].th < th) k++; const A = row[k], B = row[k + 1];
    const t = Math.max(0, Math.min(1, (th - A.th) / Math.max(1e-6, B.th - A.th))); tested++; if (r > A.r + (B.r - A.r) * t) out++; }
  return { tested, out };
}

// ── the Crown's tabard (Session 842, B2; OG-048, OG-059): crimson with a gold border, the canon's Crown colours ──
// Two panels on the posed body, front and back, joined over the shoulders, open at the sides, with a hole for the neck.
// Each column is the outline of the body and what it wears, in its upright plane: the cloth falls straight below the furthest point above
// it (the chest, the belly) and is taken in at the belt, then falls straight again to the mid-thigh. No emblem: the
// Crown's device is not in the canon (the concept art's are the image generator's, docs/art/catalogue.csv).
function buildTabard(G, body, byName) {
  // what the outline is read from: the body, the tights' shell when a tunic or trousers are worn (the tunic stands up to
  // 3.5 cm off it), the skirt's shell under a skirt; each with how far its garment stands out
  const D = G.dress, PP = posedBody(body), n = PACK.N, B = new Uint8Array(n);
  for (const v of PACK.G['body']) B[v] = 1; if (D.tunic || D.trousers) for (const v of PACK.G['helper-tights']) B[v] = 2; if (D.skirt) for (const v of (D.skirt === 'long' ? PACK.R.skirtLong : PACK.R.skirtShort)) B[v] = 3;
  const neck = new THREE.Vector3(); byName['neck01'].getWorldPosition(neck); const nY = neck.y, cx = neck.x, cz = neck.z;
  // the shoulders' half width at the armpit's height, and the tabard a little over half of it
  let sh = 0; for (let i = 0; i < n; i++) if (B[i] === 1 && Math.abs(PP[i * 3 + 1] - (nY - .16)) < .02) sh = Math.max(sh, Math.abs(PP[i * 3] - cx));
  let yb = 0, nb = 0; for (const v of PACK.R.belt) { yb += PP[v * 3 + 1]; nb++; } const yBelt = yb / nb;
  // the tunic's own push off the tights' shell, by height (makePerson's), read at the rest height of a posed point
  const tunicPush = (x, y) => { const yr = y - yBelt + .162; return .013 + (Math.abs(x) < .2 ? .022 * Math.max(0, Math.min(1, (.46 - yr) / .2)) * (1 - .8 * Math.exp(-(((yr - .16) / .03) ** 2))) : 0) + .002; };
  const OFF = (i, x, y) => B[i] === 2 ? (D.tunic ? tunicPush(x - cx, y) : .01) : B[i] === 3 ? .025 : 0;
  const W = sh * .56, NC = 21, yHem = yBelt - .25 - .2 * (D.tabardLen ?? .5), step = .01, clr = (D.mantle ? .05 : D.tunic ? .022 : .012), hole = .068;
  const NY = Math.ceil((nY + .05 - yHem) / step) + 1, front = [], back = [], top = [], cols = [];
  // the body's outline per column: the furthest forward and back, and the top, of the points within 1.5 cm of its x
  for (let c = 0; c < NC; c++) { const x = cx - W + 2 * W * c / (NC - 1), F = new Float32Array(NY).fill(-9), Bk = new Float32Array(NY).fill(9), F1 = F.slice(), B1 = Bk.slice(), TF = F.slice(), TB = Bk.slice(); let yt = -9;
    for (let i = 0; i < n; i++) { if (!B[i] || Math.abs(PP[i * 3] - x) > .015) continue; const y = PP[i * 3 + 1], z = PP[i * 3 + 2], o = OFF(i, PP[i * 3], y); if (y > nY + .05 || y < yHem - .02) continue;
      if (B[i] === 1 && Math.abs(x - cx) > hole && y > yt && Math.abs(z - cz) < .06) yt = y; const j = Math.max(0, Math.min(NY - 1, Math.round((nY + .05 - y) / step))); if (z + o > F[j]) F[j] = z + o; if (z - o < Bk[j]) Bk[j] = z - o; if (B[i] === 1) { if (z > F1[j]) F1[j] = z; if (z < B1[j]) B1[j] = z; } if (B[i] === 2) { if (z > TF[j]) TF[j] = z; if (z < TB[j]) TB[j] = z; } }
    // the neck hole: the front starts at the collar's dip, the back a little higher
    const t = Math.max(0, 1 - Math.abs(x - cx) / hole), yf = Math.abs(x - cx) > hole ? yt + clr : nY - .045 - .03 * t, yb = Math.abs(x - cx) > hole ? yt + clr : nY - .02 - .012 * t;
    // straight below the furthest point above, taken in under the belt (2.5 cm off the tights' shell: over the tunic,
    // which stands 1.9 cm off it there, and under the belt's 3 cm, so the belt is worn over the tabard), the step in and out smoothed over 4 cm so the cloth does not crumple at it
    const ZF = new Float32Array(NY).fill(-9), ZB = new Float32Array(NY).fill(9), inB = new Uint8Array(NY); let zf = -9, zb = 9, last = NY;
    for (let j = 0; j < NY; j++) { const y = nY + .05 - j * step; if (y < yHem) { last = j; break; } inB[j] = D.belt && Math.abs(y - yBelt) < .028 && TF[j] > -8 ? 1 : 0;
      if (inB[j]) { zf = Math.max(TF[j] + .025, F[j] + .0045, F1[j] + clr); zb = Math.min(TB[j] - .025, Bk[j] - .0045, B1[j] - clr); } else { zf = Math.max(zf, F[j] + clr); zb = Math.min(zb, Bk[j] - clr); } ZF[j] = zf; ZB[j] = zb; }
    for (let it = 0; it < 3; it++) { const a = ZF.slice(), bb = ZB.slice(); for (let j = 2; j < last - 2; j++) { if (a[j] < -8 || a[j - 2] < -8) continue; ZF[j] = (a[j - 2] + a[j - 1] + a[j] + a[j + 1] + a[j + 2]) / 5; ZB[j] = (bb[j - 2] + bb[j - 1] + bb[j] + bb[j + 1] + bb[j + 2]) / 5;
      if (!inB[j]) { ZF[j] = Math.max(ZF[j], F[j] + clr); ZB[j] = Math.min(ZB[j], Bk[j] - clr); } else { ZF[j] = Math.max(ZF[j], TF[j] + .025, F[j] + .0045, F1[j] + clr); ZB[j] = Math.min(ZB[j], TB[j] - .025, Bk[j] - .0045, B1[j] - clr); } } }
    const floF = Float32Array.from(ZF, (_, j) => inB[j] ? Math.max(TF[j] + .025, F[j] + .0045, F1[j] + clr) : F[j] + clr), floB = Float32Array.from(ZB, (_, j) => inB[j] ? Math.min(TB[j] - .025, Bk[j] - .0045, B1[j] - clr) : Bk[j] - clr);
    cols.push({ x, ZF, ZB, floF, floB, last, yf, yb }); }
  // smoothed across the columns too (each column's outline is read off its own few points, and was lumpy), never in
  // past what is under it
  for (let it = 0; it < 4; it++) { const pf = cols.map(c => c.ZF.slice()), pb = cols.map(c => c.ZB.slice());
    for (let c = 0; c < NC; c++) { const l = Math.max(0, c - 1), r = Math.min(NC - 1, c + 1), C = cols[c];
      for (let j = 0; j < NY; j++) { if (pf[l][j] > -8 && pf[c][j] > -8 && pf[r][j] > -8) C.ZF[j] = Math.max((pf[l][j] + 2 * pf[c][j] + pf[r][j]) / 4, C.floF[j]);
        if (pb[l][j] < 8 && pb[c][j] < 8 && pb[r][j] < 8) C.ZB[j] = Math.min((pb[l][j] + 2 * pb[c][j] + pb[r][j]) / 4, C.floB[j]); } } }
  for (const { x, ZF, ZB, last, yf, yb } of cols) { const f = [], b = [];
    for (let j = 0; j < last; j++) { const y = nY + .05 - j * step; if (y <= yf && ZF[j] > -8) f.push(new THREE.Vector3(x, y, ZF[j])); if (y <= yb && ZB[j] < 8) b.push(new THREE.Vector3(x, y, ZB[j])); }
    front.push(f); back.push(b); top.push({ yf, yb }); }
  // three grids: the front panel and the back panel (each column resampled to the same rows, from its own top to the
  // hem), and over each shoulder a short strip joining their tops outside the neck hole
  const pos = [], col = [], idx = [], crim = sRGB(...D.tabard), gold = sRGB(...(D.tabardTrim || [.72, .55, .2])), NR = 60;
  const at = (line, u) => { const t = u * (line.length - 1), i = Math.min(line.length - 2, Math.floor(t)); return line[i].clone().lerp(line[i + 1], t - i); };
  const grid = (cols, trimRows) => { const base = pos.length / 3, R = cols[0].length;
    for (let c = 0; c < cols.length; c++) for (let r = 0; r < R; r++) { const q = cols[c][r], tc = trimRows(c, r, R) ? gold : crim; pos.push(q.x, q.y, q.z); col.push(tc.r, tc.g, tc.b); }
    for (let c = 0; c < cols.length - 1; c++) for (let r = 0; r < R - 1; r++) { const a = base + c * R + r, b = a + R; idx.push(a, a + 1, b, b, a + 1, b + 1); } };
  const edgeTrim = (c, r, R) => c === 0 || c === NC - 1 || r > R - 4;
  grid(front.map(f => Array.from({ length: NR }, (_, r) => at(f, r / (NR - 1)))), (c, r, R) => edgeTrim(c, r, R) || (r < 2 && Math.abs(front[c][0].x - cx) <= hole + .01));
  grid(back.map(f => Array.from({ length: NR }, (_, r) => at(f, r / (NR - 1)))), (c, r, R) => edgeTrim(c, r, R) || (r < 2 && Math.abs(back[c][0].x - cx) <= hole + .01));
  for (const sideOf of [c => front[c][0].x < cx - hole, c => front[c][0].x > cx + hole]) { const cs = []; for (let c = 0; c < NC; c++) if (sideOf(c)) cs.push(c); if (cs.length < 2) continue;
    grid(cs.map(c => { const a = back[c][0], e = front[c][0], lift = .012 + .5 * Math.abs(a.y - e.y); return Array.from({ length: 7 }, (_, k) => { const u = k / 6, q = a.clone().lerp(e, u); q.y += lift * Math.sin(Math.PI * u); return q; }); }), (c, r) => c === 0 || c === cs.length - 1); }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('aBase', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3)); g.setIndex(idx); g.computeVertexNormals();
  const m = clothMat(new THREE.Color(1, 1, 1), 'wool', { side: THREE.DoubleSide, scale: 26 }); m.vertexColors = true; const mesh = new THREE.Mesh(g, m); mesh.name = 'tabard'; mesh.castShadow = mesh.receiveShadow = true; mesh.frustumCulled = false;
  // nothing of the torso, inside the tabard's width and between the shoulders and its hem, in front of the front or behind the back
  let tested = 0, out = 0; for (let i = 0; i < n; i++) { if (!B[i]) continue; const x = PP[i * 3], y = PP[i * 3 + 1], z0 = PP[i * 3 + 2], o = OFF(i, x, y); if (Math.abs(x - cx) > W - .01 || y > nY - .1 || y < yHem + .01) continue;
    const c = Math.round((x - cx + W) / (2 * W) * (NC - 1)), j = Math.round((nY + .05 - y) / step), fr = front[c].find(q => Math.abs(q.y - (nY + .05 - j * step)) < step / 2), bk = back[c].find(q => Math.abs(q.y - (nY + .05 - j * step)) < step / 2); if (!fr || !bk) continue;
    tested++; if (z0 + o > fr.z - .004 || z0 - o < bk.z + .004) out++; }
  return { mesh, stats: { columns: NC, width: +(2 * W).toFixed(3), hemDrop: +(nY - yHem).toFixed(3), tris: idx.length / 3, tested, out, belted: !!D.belt } };
}

// ── the hood up (Session 823, Michael's note on #274: "the hood is semi-transparent") ──
// Session 805 set the head's own points out onto a ball: the face hole ran back to the ears, so the sides of the head
// showed through it, the ear's folds came out as a red lump, and the ball stopped at the skull, the nape bare under it.
// Now the hood is a cowl of its own: a dome round the head, the ears and the tucked hair, which falls to a hem lying on
// the shoulders over the cloak. The face is cut out of it in front only, from the brow to the throat, edged with a
// rolled hem, and its inside is shaded darker, so it reads as cloth with a thickness. It is skinned to the nearest
// points of the body (the head's above, the neck's and shoulders' below), so it turns with the head.
function buildHoodUp(P, G, meshes) {
  const R0 = PACK.rest, body = PACK.G['body'], D = G.dress, pt = i => new THREE.Vector3(P[i * 3], P[i * 3 + 1], P[i * 3 + 2]);
  const box = f => { const b = new THREE.Box3(); for (const i of new Set(body)) if (f(R0[i * 3], R0[i * 3 + 1], R0[i * 3 + 2])) b.expandByPoint(pt(i)); return b; };
  const head = box((x, y) => y > .66), brow = box((x, y, z) => z > .1 && y > .74 && y < .76), chin = box((x, y, z) => z > .08 && y < .66 && y > .6 && Math.abs(x) < .02);
  const neck = box((x, y) => y > .58 && y < .62 && Math.abs(x) < .08), sh = box((x, y) => Math.abs(x) > .14 && Math.abs(x) < .19 && y > .4 && y < .62);
  const c = head.getCenter(new THREE.Vector3()), hs = head.getSize(new THREE.Vector3()).multiplyScalar(.5), cn = neck.getCenter(new THREE.Vector3());
  // the dome's radii: round the ears at the sides, over the hair on top and behind, open in front of the face
  let rx = hs.x + .028, ryT = hs.y + .03, rzB = c.z - head.min.z + .04, rzF = hs.z * .85, ryB = c.y - chin.min.y;
  // and round the hair, wherever it is not in the face's opening
  const hairM = meshes.filter(m => m.name === 'hair' || m.name === 'scalp');
  const yTop = brow.max.y + .022, yChin = chin.min.y - .012, ox = brow.max.x + .02, yM = (yTop + yChin) / 2, hy = (yTop - yChin) / 2;
  // where the face is open: an oval from the brow to under the chin, and a slot below it to the throat
  const openS = q => { const u = Math.abs(q.x - c.x), y = q.y, sO = ((u / ox) ** 2.6 + (Math.abs(y - yM) / hy) ** 2.6) ** (1 / 2.6); return y < yM ? Math.min(sO, u / (ox * .5)) : sO; };
  { let k = 1; const v = new THREE.Vector3(); for (const m of hairM) { const a = m.geometry.attributes.position; for (let i = 0; i < a.count; i++) { v.fromBufferAttribute(a, i); if (v.z > c.z && openS(v) < 1.15) continue; v.sub(c); if (v.y < -ryB * .6) continue; k = Math.max(k, Math.hypot(v.x / rx, v.y / (v.y > 0 ? ryT : ryB), v.z / (v.z > 0 ? rzF : rzB)) + .02); } }
    k = Math.min(k, 1.35); rx *= k; ryT *= k; rzB *= k; }
  // in front, over the brow and round the cheeks, the dome comes forward until the head's points that are not in the opening are inside it, 8 mm clear
  for (const i of new Set(body)) { if (R0[i * 3 + 1] < .6) continue; const q = pt(i), d = q.clone().sub(c); if (d.z <= 0 || d.y < -ryB * .5 || openS(q) < 1) continue;
    const rest = 1 - (d.x / rx) ** 2 - (d.y / (d.y > 0 ? ryT : ryB)) ** 2; rzF = Math.max(rzF, rest > .05 ? (d.z + .008) / Math.sqrt(rest) : rzF); }
  // and what is still outside (a point at the side of the brow, the scalp's edge) widens the dome all round
  { let k = 1; const v = new THREE.Vector3(), fit = q => { if (q.z > c.z && openS(q) < 1) return; const d = q.clone().sub(c); if (d.y < -ryB * .5) return; k = Math.max(k, Math.hypot(d.x / rx, d.y / (d.y > 0 ? ryT : ryB), d.z / (d.z > 0 ? rzF : rzB)) * 1.01); };
    for (const i of new Set(body)) if (R0[i * 3 + 1] > .6) fit(pt(i)); for (const m of hairM) { const a = m.geometry.attributes.position; for (let i = 0; i < a.count; i++) fit(v.fromBufferAttribute(a, i)); }
    rx *= k; ryT *= k; rzF *= k; rzB *= k; }
  // the hem lies on the shoulders and the upper back: at each angle round the neck, the body's height there, and clear of the cloak
  const J = 56, I = 64, th0 = 2.05, pos = [], base = [], uv = [], idx = [];
  const hx = (sh.max.x - cn.x) * .82, hzB = cn.z - sh.min.z + .01, hzF = sh.max.z - cn.z, clr = D.mantle ? .095 : .04;
  const yAt = (x, z) => { let y = -1e9; for (const i of new Set(body)) { const ry = R0[i * 3 + 1]; if (ry < .3 || ry > .62) continue; if ((P[i * 3] - x) ** 2 + (P[i * 3 + 2] - z) ** 2 < .022 ** 2) y = Math.max(y, P[i * 3 + 1]); } return y; };
  const yHem0 = sh.max.y + clr;
  // the grid: J columns round the head (0 = the front), I rows from the crown to the hem
  const dome = (ph, th) => { const sx = Math.sin(th) * Math.sin(ph), sy = Math.cos(th), sz = Math.sin(th) * Math.cos(ph), peak = .025 * Math.max(0, -sz * .7 + sy * .7) ** 3;
    return new THREE.Vector3(c.x + sx * rx, c.y + sy * (sy > 0 ? ryT : ryB) + peak * .6, c.z + sz * (sz > 0 ? rzF : rzB) - peak); };
  const hemXZ = ph => [cn.x + Math.sin(ph) * hx, cn.z + Math.cos(ph) * (Math.cos(ph) > 0 ? hzF : hzB)];
  let hy0 = []; for (let j = 0; j < J; j++) { const [x, z] = hemXZ(j / J * Math.PI * 2), y = yAt(x, z); hy0.push(y > -1e8 ? Math.min(y + clr, yHem0) : yHem0); }
  for (let it = 0; it < 4; it++) hy0 = hy0.map((y, j) => (hy0[(j + J - 1) % J] + 2 * y + hy0[(j + 1) % J]) / 4);
  const hem = (ph, j) => { const [x, z] = hemXZ(ph); return new THREE.Vector3(x, hy0[j % J], z); };
  // behind, the hood leaves the dome sooner and falls down the nape, so it does not sit on the neck as a ball
  const at = (ph, v, j) => { const vd = .62, t0 = th0 - .5 * Math.max(0, -Math.cos(ph)) ** 1.5; if (v <= vd) return dome(ph, t0 * Math.sqrt(v / vd));
    const a = dome(ph, t0), b = hem(ph, j), t = (v - vd) / (1 - vd), L = a.distanceTo(b), Ta = dome(ph, t0 + .01).sub(a).normalize().multiplyScalar(L * .9), Tb = b.clone().sub(a);
    return a.clone().multiplyScalar(2 * t ** 3 - 3 * t * t + 1).addScaledVector(Ta, t ** 3 - 2 * t * t + t).addScaledVector(b, -2 * t ** 3 + 3 * t * t).addScaledVector(Tb, t ** 3 - t * t); };
  const front = (q, ph) => Math.cos(ph) > 0 && q.z > c.z;
  for (let i = 0; i <= I; i++) for (let j = 0; j <= J; j++) { const ph = j / J * Math.PI * 2, q = at(ph, i / I, j); pos.push(q.x, q.y, q.z); base.push(front(q, ph) ? openS(q) : 9, 0, Math.cos(ph)); uv.push(j / J, i / I); }
  for (let i = 0; i < I; i++) for (let j = 0; j < J; j++) { const a = i * (J + 1) + j, b = a + J + 1; idx.push(a, b, a + 1, a + 1, b, b + 1); }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('aBase', new THREE.Float32BufferAttribute(base, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx); g.computeVertexNormals();
  // the rolled hem round the face: where each row crosses the opening's edge, up the left cheek and down the right
  const left = [], right = []; for (let i = 0; i <= I; i++) { const row = []; for (let j = 0; j <= J; j++) { const k = (i * (J + 1) + j) * 3; row.push([base[k], new THREE.Vector3(pos[k], pos[k + 1], pos[k + 2])]); }
    for (let j = 0; j < J; j++) { const [s0, p0] = row[j], [s1, p1] = row[j + 1]; if ((s0 < 1) !== (s1 < 1) && Math.min(s0, s1) < 9 && Math.max(s0, s1) < 9) { const q = p0.clone().lerp(p1, (1 - s0) / (s1 - s0)); (q.x > c.x ? right : left).push(q); } } }
  const rimLine = [...left.reverse(), ...right].map(q => q.clone().add(new THREE.Vector3(c.x - q.x, 0, c.z - q.z).normalize().multiplyScalar(.004)));
  const sm = rimLine.map((q, k) => k && k < rimLine.length - 1 ? q.clone().add(rimLine[k - 1]).add(rimLine[k + 1]).multiplyScalar(1 / 3) : q);
  const rim = tubeGeom(sm, sm.map(() => .0075), 8);
  // skin weights from the nearest point of the body
  const cand = [...new Set(body)].filter(i => R0[i * 3 + 1] > .4);
  const skin = geo => { const n = geo.attributes.position.count, si = new Uint16Array(n * 4), sw = new Float32Array(n * 4), v = new THREE.Vector3();
    for (let i = 0; i < n; i++) { v.fromBufferAttribute(geo.attributes.position, i); let best = -1, bd = 1e9; for (const k of cand) { const d = (P[k * 3] - v.x) ** 2 + (P[k * 3 + 1] - v.y) ** 2 + (P[k * 3 + 2] - v.z) ** 2; if (d < bd) { bd = d; best = k; } }
      for (let q = 0; q < 4; q++) { si[i * 4 + q] = PACK.skinIndex[best * 4 + q]; sw[i * 4 + q] = PACK.skinWeight[best * 4 + q]; } }
    geo.setAttribute('skinIndex', new THREE.BufferAttribute(si, 4)); geo.setAttribute('skinWeight', new THREE.BufferAttribute(sw, 4)); return geo; };
  if (!rim.attributes.aBase) rim.setAttribute('aBase', rim.attributes.position);
  const col = sRGB(...D.cloak), hood = new THREE.SkinnedMesh(skin(g), clothMat(col, 'wool', { side: THREE.DoubleSide, scale: 26, inner: .42, hole: 'vB.z > 0. && vB.x < 1.' })); hood.name = 'hoodUp';
  const hemM = new THREE.SkinnedMesh(skin(rim), clothMat(col.clone().multiplyScalar(.9), 'wool', { scale: 26 })); hemM.name = 'hoodHem';
  // what would show through: any point of the head, the ears or the scalp's hair outside the dome, away from the face's opening
  let tested = 0, poke = 0; { const v = new THREE.Vector3(), test = q => { if (q.y < c.y - ryB * .5) return; tested++; if (q.z > c.z && openS(q) < 1) return;
      const d = q.clone().sub(c); if (Math.hypot(d.x / rx, d.y / (d.y > 0 ? ryT : ryB), d.z / (d.z > 0 ? rzF : rzB)) >= 1) poke++; };
    for (const i of new Set(body)) if (R0[i * 3 + 1] > .6) test(pt(i)); for (const m of hairM) { const a = m.geometry.attributes.position; for (let i = 0; i < a.count; i++) test(v.fromBufferAttribute(a, i)); } }
  return { meshes: [hood, hemM], stats: { tested, poke, tris: idx.length / 3 + rim.index.count / 3, rimPoints: sm.length, k: +(rx / (hs.x + .028)).toFixed(3), yHem: +yHem0.toFixed(3) } };
}

// ── the eyebrows (Session 824, Michael's note on #272: "eyebrows look pretty fugly still") ──
// Session 770's brows were a band of the skin's triangles under three noise shells: square-ended blocks, the same
// thickness end to end, a hand's width too high. Now a brow is drawn on the face as a shape (a head at the nose, an
// arch two-thirds out, a tail that thins to nothing), set from the eye's own centre, and filled with short hairs
// lying on the skin, combed as brows grow: up at the head, out along the body, out and down at the tail. The skin
// under it is a shade darker so the hairs read as a brow and not as a scatter. Placed on the unmorphed face and carried
// to the morphed one by the triangle each root falls in, so it follows every face the sliders make.
const BROW_TRIS = () => PACK.browTris || (PACK.browTris = (() => { const R0 = PACK.rest, g = PACK.G['body'], out = [];
  for (let t = 0; t < g.length; t += 3) { const a = g[t], b = g[t + 1], c = g[t + 2], cy = (R0[a * 3 + 1] + R0[b * 3 + 1] + R0[c * 3 + 1]) / 3, cz = (R0[a * 3 + 2] + R0[b * 3 + 2] + R0[c * 3 + 2]) / 3, cx = (R0[a * 3] + R0[b * 3] + R0[c * 3]) / 3;
    if (cy < .72 || cy > .79 || cz < .06 || Math.abs(cx) > .085) continue;
    const ux = R0[b * 3] - R0[a * 3], uy = R0[b * 3 + 1] - R0[a * 3 + 1], uz = R0[b * 3 + 2] - R0[a * 3 + 2], vx = R0[c * 3] - R0[a * 3], vy = R0[c * 3 + 1] - R0[a * 3 + 1], vz = R0[c * 3 + 2] - R0[a * 3 + 2];
    const nz = ux * vy - uy * vx, nl = Math.hypot(uy * vz - uz * vy, uz * vx - ux * vz, nz); if (Math.abs(nz) / nl > .25) out.push(a, b, c); } return out; })());
export function browShape(G) {
  // in the unmorphed face's x and y: per side, t from the head (0) to the tail (1)
  const R0 = PACK.rest, eye = side => { const L = [...new Set(PACK.G[`helper-${side}-eye`])]; let x = 0, y = 0; for (const i of L) { x += R0[i * 3]; y += R0[i * 3 + 1]; } return [Math.abs(x / L.length), y / L.length]; };
  const [ex, ey] = eye('l'), man = (G.g ?? .5) > .5, b = G.brow || {}, thick = (b.thick ?? (man ? .62 : .42)), arch = (b.arch ?? (man ? .35 : .6));
  const x0 = ex * .32, x1 = ex * 1.62, at = t => { const x = x0 + (x1 - x0) * t;
    // the lower edge follows the orbit's rim: it rises from the head to the arch and drops a little to the tail
    const low = ey + .0125 + .0035 * arch * Math.sin(Math.PI * Math.min(1, t / .7) * .5) - .004 * Math.max(0, (t - .7) / .3) ** 1.5 * (1 + arch);
    const h = (.0035 + .0065 * thick) * (t < .15 ? .75 + 1.7 * t : 1 - .85 * Math.max(0, (t - .3) / .7) ** 1.3);
    return { x, low, h }; };
  return { x0, x1, at, ex, ey, thick, arch };
}
function buildBrows(P, G, headB) {
  const R0 = PACK.rest, tris = BROW_TRIS(), S = browShape(G), out = { tried: 0, roots: 0, lift: 0, headUp: 0, headN: 0, over: 0 };
  // where a point of the unmorphed face (x, y) lies: its triangle and weights, then the same on the morphed face
  const locate = (x, y) => { for (let t = 0; t < tris.length; t += 3) { const a = tris[t], b = tris[t + 1], c = tris[t + 2], ax = R0[a * 3], ay = R0[a * 3 + 1], bx = R0[b * 3], by = R0[b * 3 + 1], cx = R0[c * 3], cy = R0[c * 3 + 1];
      const d = (by - cy) * (ax - cx) + (cx - bx) * (ay - cy); if (Math.abs(d) < 1e-12) continue; const u = ((by - cy) * (x - cx) + (cx - bx) * (y - cy)) / d, v = ((cy - ay) * (x - cx) + (ax - cx) * (y - cy)) / d, w = 1 - u - v;
      if (u < -1e-4 || v < -1e-4 || w < -1e-4) continue; const A = new THREE.Vector3().fromArray(P, a * 3), B = new THREE.Vector3().fromArray(P, b * 3), C = new THREE.Vector3().fromArray(P, c * 3);
      return { p: A.clone().multiplyScalar(u).addScaledVector(B, v).addScaledVector(C, w), n: B.clone().sub(A).cross(C.clone().sub(A)).normalize() }; } return null; };
  const pos = [], uv = [], idx = [], nor = [], cols = [], col = sRGB(...G.hairCol).multiplyScalar(G.hairCol[0] > .6 ? .55 : .62);
  // Session 876: the brows draw from their own stream, and the person's stream is moved on by what Session 824's brows took
  // from it (six numbers a hair), so the cloak, drawn after, folds as it did
  const N0 = Math.round(260 + 220 * S.thick); for (let i = 0; i < N0 * 12; i++) RND();
  const rb = seeded((G.seed ?? 'person') + '|brows'), N = Math.round(N0 * 1.8);
  for (const sg of [-1, 1]) for (let k = 0; k < N; k++) {
    // a root: along the brow by area (more at the head and the body than the tail), across it at random
    const t = Math.min(1, rb() ** 1.15), q = S.at(t), a = rb(), x = q.x + (rb() - .5) * .002, y = q.low + q.h * a;
    // the head starts sparse, so the brow does not begin on a square-cut end at the nose (Session 876)
    if (t < .1 && rb() > .3 + 7 * t) continue;
    const L = locate(sg * x, y); out.tried++; if (!L) continue; out.roots++;
    if (L.n.z < 0) L.n.negate();
    // the comb: up and out at the head (Session 876: about 50 degrees, where Session 824's stood near upright and fanned), out
    // and a little up along the body, out and down at the tail; the upper row lies down over the lower
    const up = t < .18 ? .7 - 1.3 * t : .45 - 1.1 * Math.max(0, t - .45) - .35 * a, dirW = new THREE.Vector3(sg * (t < .18 ? .55 + 2.5 * t : 1), up, 0).normalize();
    dirW.applyAxisAngle(new THREE.Vector3(0, 0, 1), (rb() - .5) * .35);
    // finer and shorter hairs, more of them, and none reaching more than a hair's breadth past the brow's upper edge
    let len = (.0035 + .0045 * rb()) * (t < .15 ? .7 : 1); const room = q.low + q.h + .0008 - y; if (dirW.y > 0 && len * dirW.y > room) len = Math.max(.0015, room / dirW.y);
    if (t < .18) { out.headUp += dirW.y; out.headN++; } out.over = Math.max(out.over, len * dirW.y - (q.low + q.h - y));
    const tan = dirW.clone().addScaledVector(L.n, -dirW.dot(L.n)).normalize(), w0 = .0002 + .00014 * rb(), seg = 3, shade = .93 + .14 * rb();
    const pts = [L.p.clone().addScaledVector(L.n, .0003)]; let lift = .2;
    for (let s = 1; s <= seg; s++) { const d = tan.clone().addScaledVector(L.n, lift).normalize(); pts.push(pts[s - 1].clone().addScaledVector(d, len / seg)); lift -= .17; }
    out.lift = Math.max(out.lift, pts[seg].clone().sub(pts[0]).dot(L.n));
    const base = pos.length / 3; for (let s = 0; s <= seg; s++) { const side = tan.clone().cross(L.n).normalize(), w = w0 * (1 - .8 * s / seg); cols.push(shade, shade, shade, shade, shade, shade);
      pos.push(pts[s].x - side.x * w, pts[s].y - side.y * w, pts[s].z - side.z * w, pts[s].x + side.x * w, pts[s].y + side.y * w, pts[s].z + side.z * w); nor.push(L.n.x, L.n.y, L.n.z, L.n.x, L.n.y, L.n.z); uv.push(0, s / seg * .9, 1, s / seg * .9); if (s < seg) { const b0 = base + s * 2; idx.push(b0, b0 + 1, b0 + 2, b0 + 1, b0 + 3, b0 + 2); } } }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3)); g.setIndex(idx); g.setAttribute('color', new THREE.Float32BufferAttribute(cols, 3));
  const nV = pos.length / 3, si = new Uint16Array(nV * 4), sw = new Float32Array(nV * 4); for (let i = 0; i < nV; i++) { si[i * 4] = headB; sw[i * 4] = 1; } g.setAttribute('skinIndex', new THREE.BufferAttribute(si, 4)); g.setAttribute('skinWeight', new THREE.BufferAttribute(sw, 4));
  const m = new THREE.MeshStandardMaterial({ color: col, roughness: .7, side: THREE.DoubleSide, vertexColors: true }); m.onBeforeCompile = sh => { sh.fragmentShader = sh.fragmentShader.replace('#include <normal_fragment_begin>', '#include <normal_fragment_begin>\n normal = normalize(vNormal); if (dot(normal, vViewPosition) < 0.) normal = -normal;'); };
  const mesh = new THREE.SkinnedMesh(g, m); mesh.name = 'brows'; mesh.noCast = true;
  return { mesh, stats: { hairs: idx.length / 18, tried: out.tried, roots: out.roots, lift: +out.lift.toFixed(4), headUp: +(out.headUp / Math.max(1, out.headN)).toFixed(3), over: +out.over.toFixed(4), tris: idx.length / 3 } };
}
// how much of a brow lies over a point of the unmorphed face (0 to 1), for the skin's shade
function browCover(S, x, y) { const ax = Math.abs(x); if (ax < S.x0 - .003 || ax > S.x1 + .003) return 0; const t = Math.max(0, Math.min(1, (ax - S.x0) / (S.x1 - S.x0))), q = S.at(t);
  const m = Math.min(y - q.low, q.low + q.h - y), e = Math.min(ax - S.x0, S.x1 - ax); return Math.max(0, Math.min(1, (m + .0015) / .003)) * Math.max(0, Math.min(1, (e + .002) / .004)); }

export function makePerson(G, o = {}) {
  const P = morph(G), { ix } = PACK, rest0 = PACK.rest; RND = seeded(G.seed ?? 'person'); let hairStats = null, hoodStats = null, browStats = null;
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
  { const col = new Float32Array(PACK.N * 3), BS = browShape(G); for (let i = 0; i < PACK.N; i++) { const x = rest0[i * 3], y = rest0[i * 3 + 1], z = rest0[i * 3 + 2]; let r = 1, g = 1, b = 1;
      const lip = Math.exp(-((x / .022) ** 2) - ((y - .655) / .009) ** 2) * (z > .13 ? 1 : 0), cheek = Math.exp(-(((Math.abs(x) - .05) / .025) ** 2) - ((y - .69) / .02) ** 2) * (z > .07 ? 1 : 0), nose = Math.exp(-((x / .02) ** 2) - ((y - .69) / .015) ** 2) * (z > .14 ? 1 : 0);
      r += .12 * lip + .06 * cheek + .05 * nose; g -= .14 * lip + .05 * cheek + .04 * nose; b -= .1 * lip + .04 * cheek + .03 * nose;
      if (G.hairCol && z > .08 && y > .72 && y < .79) { const w = browCover(BS, x, y) * .2; r *= 1 - w; g *= 1 - w * 1.1; b *= 1 - w * 1.2; } col[i * 3] = r; col[i * 3 + 1] = g; col[i * 3 + 2] = b; }
    body.geometry.setAttribute('color', new THREE.BufferAttribute(col, 3)); }
  meshes.push(body);
  const D = G.dress || {}, push = (k, idx, mat, d) => { const m = new THREE.SkinnedMesh(geomFor(P, idx, d), mat); m.name = k; meshes.push(m); return m; };
  if (D.trousers) push('trousers', PACK.R.trousers, clothMat(sRGB(...D.trousers), 'wool', { cut: [-.78, .1] }), .008);
  if (D.boots) push('boots', PACK.R.boots, clothMat(sRGB(...D.boots), 'leather', { cut: [-2, -.43, 9, .002] }), .02);
  if (D.tunic) push('tunic', PACK.R.tunic, clothMat(sRGB(...D.tunic), 'wool', { cut: [D.skirt ? .12 : -.02, .612, .4, .002] }), (x, y) => .013 + (Math.abs(x) < .2 ? .022 * Math.max(0, Math.min(1, (.46 - y) / .2)) * (1 - .8 * Math.exp(-(((y - .16) / .03) ** 2))) : 0));
  if (D.skirt) push('skirt', D.skirt === 'long' ? PACK.R.skirtLong : PACK.R.skirtShort, clothMat(sRGB(...(D.skirtColor || D.tunic)), 'wool', { side: THREE.DoubleSide, cut: [D.skirt === 'long' ? -2 : -.2, .17, 9, .01] }), (x, y) => .012 + .012 * Math.max(0, Math.min(1, (.14 - y) / .3)));
  if (D.belt) push('belt', PACK.R.belt, clothMat(sRGB(...D.belt), 'leather', { cut: [.135, .19, 9, .0005] }), .03);
  if (D.cuffs) push('cuffs', PACK.R.cuffs, clothMat(sRGB(...D.cuffs), 'wool', { cut: [-2, 2, .4] }), .02);
  if (D.apron) { const lea = !!D.apronLeather, am = clothMat(sRGB(...D.apron), lea ? 'leather' : 'wool', { side: THREE.DoubleSide, cut: [lea ? -.52 : -.42, .175, .155, .004] });
    push('apron', PACK.R.apron, am, (x, y) => .03 + .012 * Math.max(0, Math.min(1, (.1 - y) / .4))); if (D.bib) push('bib', PACK.R.apronBib, clothMat(sRGB(...D.apron), lea ? 'leather' : 'wool', { side: THREE.DoubleSide, cut: [.1, .46, .105, .003] }), .04); }
  // a fur mantle over the shoulders: eleven shells
  if (D.mantle) for (let k = 0; k < 11; k++) push('mantle' + k, PACK.R.mantle, shellMat(sRGB(...D.mantle), k, 11, { sx: 260, sy: 70, solid: k === 0 }), .036 + k * .0055);
  // hair: cards rooted on the hair shell (off the face), a layer of shell underneath so no scalp shows; brows; beard and moustache as short cards
  if (G.hairCol) { const scalp = PACK.R.scalpRoots;
    push('scalp', scalp, shellMat(sRGB(...G.hairCol).multiplyScalar(.55), 0, 3, { solid: true, hairline: true, skin: sRGB(...G.skin) }), .0025);
    const headB = ix.bones.findIndex(b => b.name === 'head'), bb = new THREE.Box3(); for (const v of scalp) bb.expandByPoint(new THREE.Vector3(P[v * 3], P[v * 3 + 1], P[v * 3 + 2])); const hc = bb.getCenter(new THREE.Vector3()), hr = bb.getSize(new THREE.Vector3()).multiplyScalar(.5).addScalar(.004); hc.y -= .02; hr.y += .02;
    const tuck = D.cloak && D.hood === 'up' ? { ...G, hair: { style: 'short', len: Math.min(G.hair?.len ?? .3, .3) } } : G;
    // under a hood the hair is tucked in: only the scalp's shell, which shows at the hairline
    const H = buildHair(P, tuck, heads, PACK.R.scalpRoots, headB, RND); meshes.push(...H.meshes.filter(m => tuck === G || m.name !== 'hair')); hairStats = H.stats;
    { const B = buildBrows(P, G, headB); meshes.push(B.mesh); browStats = B.stats; }
    if (G.beard) { const jawB = ix.bones.findIndex(b => b.name === 'jaw');
      push('beardBase', PACK.R.beardBase, shellMat(sRGB(...G.hairCol).multiplyScalar(.6), 0, 3, { solid: true }), .0015);
      const bc = hairCards(P, PACK.R.beard, { n: 520, len: .02 + .05 * G.beard, seg: 4, width: .011, lift: .15, comb: -.1, fall: 1, grav: .2, rootOff: .002, bone: jawB, color: sRGB(...G.hairCol).multiplyScalar(.92), outward: hc, hug: true, surfs: [surfaceOf(P, PACK.R.beard, hc)] });
      bc.name = 'beard'; meshes.push(bc);
      const mc = hairCards(P, PACK.R.moust, { n: 110, len: .028, seg: 3, width: .009, lift: .2, comb: -.1, fall: 1, grav: .2, rootOff: .002, bone: headB, color: sRGB(...G.hairCol).multiplyScalar(.92), outward: hc });
      mc.name = 'moust'; meshes.push(mc); } }
  if (D.cloak && D.hood === 'up') { const H = buildHoodUp(P, G, meshes); meshes.push(...H.meshes); hoodStats = H.stats; }
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
  let tabardStats = null; if (D.tabard) { root.updateMatrixWorld(true); const T = buildTabard(G, body, byName); root.add(T.mesh); tabardStats = T.stats; }
  let cloakStats = null; if (D.cloak) { root.updateMatrixWorld(true); const C = buildCloak(G, body, byName, RND); for (const m of C.meshes) root.add(m); cloakStats = C.stats; }
  root.position.y = -minY; return { root, skeleton, byName, meshes, hair: hairStats, cloak: cloakStats, tabard: tabardStats, hood: hoodStats, brows: browStats };
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

// ── the saved genome (Session 804): what the builder page writes and the game will read ──
// { species, v, seed, people, sliders: {body and face, by name}, race, palette: {skin, hair, eyes} as hex, hair: {style, len, beard},
//   dress: {garment: hex, skirt: 'short'|'long'|null}, pose }. Numbers to three places, so a person is a few hundred bytes.
const hex = c => '#' + c.map(v => Math.round(Math.max(0, Math.min(1, v)) * 255).toString(16).padStart(2, '0')).join('');
const unhex = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16) / 255);
const r3 = v => Math.round(v * 1000) / 1000, round = o => Object.fromEntries(Object.entries(o).map(([k, v]) => [k, r3(v)]));
export const BODY_SLIDERS = ['g', 'age', 'muscle', 'weight', 'height', 'prop'], GARMENTS = ['tunic', 'trousers', 'boots', 'belt', 'mantle', 'cuffs', 'skirtColor', 'cloak', 'cloakFur', 'cloakHem', 'brooch', 'apron', 'tabard', 'tabardTrim'], DRESS_FLAGS = { hood: null, cloakLen: .8, bib: false, apronLeather: false, cape: false, tabardLen: .5 };
export function toSaved(G) {
  const D = G.dress || {}, dress = {}; for (const k of GARMENTS) if (D[k]) dress[k] = hex(D[k]); dress.skirt = D.skirt || null; for (const [k, d] of Object.entries(DRESS_FLAGS)) if (D[k] != null && D[k] !== d) dress[k] = typeof D[k] === 'number' ? r3(D[k]) : D[k];
  const style = G.hair?.style ?? ((G.hairLen ?? .3) < .45 ? 'short' : 'loose');
  return { species: 'human', v: 1, seed: String(G.seed ?? 'person'), people: G.people || 'markman', sliders: round({ ...Object.fromEntries(BODY_SLIDERS.map(k => [k, G[k] ?? (k === 'prop' ? .6 : .5)])), ...(G.face || {}) }),
    race: round(G.race || { caucasian: 1 }), palette: { skin: hex(G.skin), hair: hex(G.hairCol || [0, 0, 0]), eyes: hex(G.eyes) }, hair: { style, len: r3(G.hair?.len ?? G.hairLen ?? .3), beard: r3(G.beard || 0), ...(G.brow ? { brow: [r3(G.brow.thick), r3(G.brow.arch)] } : {}) },
    dress, pose: round(G.pose || {}) };
}
export function fromSaved(J) {
  if (!J || J.species !== 'human') throw new Error('not a human genome'); const S = J.sliders || {}, G = { seed: J.seed, people: J.people, race: { ...(J.race || { caucasian: 1 }) }, face: {} };
  for (const [k, v] of Object.entries(S)) if (BODY_SLIDERS.includes(k)) G[k] = v; else G.face[k] = v;
  G.skin = unhex(J.palette.skin); G.hairCol = unhex(J.palette.hair); G.eyes = unhex(J.palette.eyes);
  G.hair = { style: J.hair?.style || 'short', len: J.hair?.len ?? .3 }; G.beard = J.hair?.beard || 0; if (J.hair?.brow) G.brow = { thick: J.hair.brow[0], arch: J.hair.brow[1] };
  G.dress = { skirt: J.dress?.skirt || null }; for (const [k, d] of Object.entries(DRESS_FLAGS)) G.dress[k] = J.dress?.[k] ?? d; for (const k of GARMENTS) if (J.dress?.[k]) G.dress[k] = unhex(J.dress[k]); G.pose = { ...(J.pose || {}) }; return G;
}
// ── the four peoples (Session 806, B3): slider ranges over the one human body, from the canon's peoples table (§2) and the
// kept sheets (OG-048 and OG-059 Gatelanders, OG-025 Markmen, OG-044 Aurennais, OG-066 the Old Blood). A people sets the
// ranges and the palettes; the seed picks inside them. Heights are given in metres (Michael's 1 B: the heroic hybrid, about
// 1.80 m, the Markmen taller and the Old Blood short) and turned into the height slider by measuring the morphed body. The Old Blood's marks under the skin and the Gatelanders' freckles want a skin texture, owed.
const U = (a, b) => [a, b];
export const PEOPLES = {
  gatelander: { name: 'Gatelanders', race: { caucasian: [.9, 1], african: [0, .05], asian: [0, .05] },
    body: { m: { metres: [1.72, 1.84], muscle: [.52, .7], weight: [.36, .52] }, f: { metres: [1.6, 1.72], muscle: [.45, .6], weight: [.38, .54] } },
    skin: [[.9, .74, .64], [.88, .69, .58], [.86, .64, .54], [.92, .77, .69]], hair: [[.62, .3, .14], [.5, .22, .1], [.72, .38, .18], [.25, .17, .12], [.36, .24, .15]], eyes: [[.42, .55, .4], [.4, .52, .62], [.38, .3, .2]],
    styles: { m: { short: 6, tail: 2 }, f: { braid: 3, tail: 2, bun: 2, loose: 2 } },
    wool: [[.45, .16, .12], [.3, .36, .22], [.55, .42, .2], [.2, .3, .4], [.62, .58, .5]], cloak: .65, hood: .5, cape: .5, capes: [[.5, .14, .1], [.45, .16, .12], [.3, .36, .22]], brooch: [.62, .47, .22], apron: [.35, .3], mantle: 0, brow: { m: { thick: [.5, .75], arch: [.3, .5] }, f: { thick: [.35, .55], arch: [.5, .75] } } },
  markman: { name: 'Markmen', race: { caucasian: [1, 1], african: [0, 0], asian: [0, 0] },
    body: { m: { metres: [1.84, 1.98], muscle: [.66, .92], weight: [.48, .7] }, f: { metres: [1.72, 1.84], muscle: [.52, .7], weight: [.46, .64] } },
    skin: [[.92, .8, .74], [.9, .77, .7], [.88, .74, .66]], hair: [[.8, .72, .56], [.72, .64, .5], [.86, .8, .66], [.62, .54, .42]], eyes: [[.55, .6, .62], [.5, .56, .6], [.45, .55, .62]],
    styles: { m: { short: 5, braids: 2, tail: 2 }, f: { braids: 4, braid: 3, bun: 1 } },
    wool: [[.32, .26, .2], [.24, .27, .32], [.3, .32, .26], [.2, .2, .22], [.45, .16, .12]], cloak: .3, fur: true, brooch: [.35, .35, .37], apron: [.15, .1], mantle: .8, brow: { m: { thick: [.7, .95], arch: [.15, .35] }, f: { thick: [.45, .65], arch: [.35, .55] } } },
  aurennais: { name: 'Aurennais', race: { caucasian: [.3, .65], african: [.25, .7], asian: [0, .15] },
    body: { m: { metres: [1.74, 1.86], muscle: [.5, .66], weight: [.32, .46] }, f: { metres: [1.62, 1.74], muscle: [.42, .56], weight: [.34, .48] } },
    skin: [[.74, .56, .42], [.64, .46, .33], [.52, .36, .25], [.4, .27, .19], [.31, .21, .15]], hair: [[.1, .07, .06], [.16, .11, .08], [.22, .15, .1]], eyes: [[.3, .2, .12], [.22, .15, .1], [.35, .28, .16]],
    styles: { m: { short: 7, tail: 1 }, f: { braids: 3, braid: 2, bun: 3, loose: 1 } },
    wool: [[.86, .81, .71], [.9, .86, .78], [.25, .35, .55], [.74, .55, .25], [.8, .78, .74]], cloak: .1, brooch: [.7, .55, .25], apron: [.1, 0], mantle: 0, brow: { m: { thick: [.6, .85], arch: [.4, .6] }, f: { thick: [.45, .65], arch: [.6, .85] } } },
  oldblood: { name: 'the Old Blood', race: { caucasian: [.75, .95], african: [0, .05], asian: [.05, .25] },
    body: { m: { metres: [1.56, 1.66], muscle: [.4, .54], weight: [.28, .4] }, f: { metres: [1.46, 1.56], muscle: [.36, .5], weight: [.3, .42] } },
    skin: [[.82, .78, .76], [.78, .74, .72], [.85, .81, .79]], hair: [[.05, .05, .06], [.08, .07, .08], [.11, .1, .11]], eyes: [[.66, .68, .7], [.58, .6, .63]],
    styles: { m: { short: 5, tail: 3 }, f: { loose: 3, braid: 3, tail: 2 } },
    wool: [[.18, .17, .2], [.3, .12, .12], [.28, .22, .32], [.82, .8, .74], [.36, .34, .33]], cloak: .5, hood: .2, brooch: [.4, .4, .42], apron: [0, 0], mantle: 0, brow: { m: { thick: [.3, .5], arch: [.1, .3] }, f: { thick: [.2, .4], arch: [.2, .4] } } },
};
// standing height in metres of a genome's body (crown to sole, unposed), and the height slider that gives a wanted stature
export function statureOf(G) { const P = morph(G), tri = PACK.G['body']; let lo = 1e9, hi = -1e9; for (let t = 0; t < tri.length; t++) { const y = P[tri[t] * 3 + 1]; if (y < lo) lo = y; if (y > hi) hi = y; } return hi - lo; }
export function heightFor(G, metres) { let a = 0, b = 1; for (let i = 0; i < 9; i++) { const m = (a + b) / 2; if (statureOf({ ...G, height: m }) < metres) a = m; else b = m; } return (a + b) / 2; }
export function peopleGenome(rnd, people, g, o = {}) {
  const P = PEOPLES[people] || PEOPLES.markman, G = markGenome(rnd, g, { ...o, mantle: false }), sx = g > .5 ? 'm' : 'f', pick = a => a[Math.floor(rnd() * a.length)], in_ = ([a, b]) => a + (b - a) * rnd();
  const pickW = W => { let r = rnd() * Object.values(W).reduce((a, b) => a + b, 0); for (const [k, w] of Object.entries(W)) if ((r -= w) < 0) return k; return Object.keys(W)[0]; };
  G.people = people; for (const [k, r] of Object.entries(P.body[sx])) if (k !== 'metres') G[k] = in_(r);
  G.race = Object.fromEntries(Object.entries(P.race).map(([k, r]) => [k, in_(r)])); { const t = Object.values(G.race).reduce((a, b) => a + b, 0); for (const k in G.race) G.race[k] /= t; }
  G.skin = pick(P.skin); G.hairCol = o.hair ?? pick(P.hair); G.eyes = pick(P.eyes); G.hair = { style: o.style ?? pickW(P.styles[sx]), len: G.hair.len };
  const D = G.dress; D.tunic = pick(P.wool); if (D.trousers) D.trousers = pick(P.wool.slice(0, 4)); if (D.skirtColor) D.skirtColor = pick(P.wool);
  if (rnd() < P.mantle) D.mantle = pick([[.42, .34, .26], [.3, .24, .18], [.55, .48, .4], [.25, .2, .17]]);
  if (rnd() < P.cloak) { D.cloak = pick(P.wool.slice(0, 4)); D.cloakLen = .45 + rnd() * .5; D.brooch = P.brooch; if (P.fur && rnd() < .7) D.cloakFur = [.5, .42, .32]; else if (rnd() < (P.hood ?? 0) + .4) D.hood = rnd() < (P.hood ?? 0) ? 'up' : 'down'; }
  G.height = heightFor(G, in_(P.body[sx].metres));
  if (rnd() < P.apron[sx === 'f' ? 0 : 1]) { D.apron = g > .5 ? [.36, .25, .16] : pick([[.8, .76, .66], [.72, .68, .58]]); D.apronLeather = g > .5; D.bib = rnd() < .6; }
  // the brows by people (Session 826), drawn last so every earlier roll of a seed is as it was
  if (P.brow) G.brow = { thick: in_(P.brow[sx].thick), arch: in_(P.brow[sx].arch) };
  // a shoulder cape for those without a cloak (Session 841, the Gatelanders' short capes), drawn after the brows for the same reason
  if (P.cape && !D.cloak && rnd() < P.cape) { D.cloak = pick(P.capes); D.cape = true; D.cloakLen = rnd(); D.brooch = P.brooch; if (rnd() < .6) D.cloakHem = pick([[.62, .47, .22], [.3, .36, .22], [.2, .3, .4]]); }
  return G;
}
// a genome rolled from a seed, inside a people's ranges (Markfolk by default, as Session 804 rolled them)
export function rollGenome(seed, o = {}) { const rnd = seeded(seed), g = o.g ?? (rnd() < .5 ? 0 : 1); if (o.people) return peopleGenome(rnd, o.people, g, { seed: String(seed) }); const G = markGenome(rnd, g, { seed: String(seed) }); G.people = 'markman'; return G; }
