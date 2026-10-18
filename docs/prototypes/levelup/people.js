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
    // the leg wraps (Session 1021): past their cut (rest -.715 to -.405) both ways, so neither edge is a triangle's
    legWraps: sel(tri, (x, y) => y < -.37 && y > -.76 && Math.abs(x) > .06),
    // the bare feet and ankles, for sandals (Session 1015): the body's own skin below rest -.6, and the straps' shell off it
    feet: sel(G['body'], (x, y) => y < -.6 && Math.abs(x) > .1),
    belt: sel(tri, (x, y) => y > .11 && y < .22 && Math.abs(x) < .2),
    // the wide sash belt (Session 1010, OG-056): the region runs past its cut (rest .085 to .225) so neither edge is a triangle's
    sashBelt: sel(tri, (x, y) => y > .055 && y < .255 && Math.abs(x) < .2),
    mantle: sel(tri, (x, y, z) => y > .4 && y < .61 && Math.abs(x) < .26),
    // the cuffs: a band 4 cm wide at the sleeve's end, cut in the shader (Session 889); the region is wider, so neither edge is a
    // triangle's, and it runs to .411, past the bare skin's own stepped edge (body triangles from .395), which showed as teeth beyond it
    cuffs: sel(tri, (x, y) => Math.abs(x) > .355 && Math.abs(x) < .425),
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
    // the laced bodice (Session 888): the torso off the tights; its neckline, straps and armholes are cut in its shader, so they are smooth
    bodice: sel(tri, (x, y) => Math.abs(x) < .21 && y > .11 && y < .65),
    // the mail hauberk (Session 897, OG-019's Iron tier): its body and sleeves off the tights, to the elbow (rest |x| .313) and
    // down under the belt; its skirt off the skirt shell, to a hand above the knee (rest y -.369); both edges cut in the shader
    mailTop: sel(tri, (x, y) => y > .03 && y < .64 && Math.abs(x) < .34),
    mailSkirt: sel(G['helper-skirt'], (x, y) => y > -.32),
  };
  // how far each vertex of the hair's root region lies from that region's border, on the rest body (Session 879): the edges
  // that only one of its triangles uses are the border, and a vertex's number is its distance to the nearest of them, so the
  // temples and the sides above the ears can thin out as the forehead does, where the region stops on a mesh edge
  { const R = PACK.R.scalpRoots, cnt = new Map(), key = (a, b) => a < b ? a * 65536 + b : b * 65536 + a, edge = new Float32Array(N).fill(-1), segs = [];
    for (let t = 0; t < R.length; t += 3) for (let k = 0; k < 3; k++) { const e = key(R[t + k], R[t + (k + 1) % 3]); cnt.set(e, (cnt.get(e) || 0) + 1); }
    for (const [e, c] of cnt) if (c === 1) segs.push([Math.floor(e / 65536), e % 65536]);
    const d2 = (i, a, b) => { const ax = P[a * 3], ay = P[a * 3 + 1], az = P[a * 3 + 2], bx = P[b * 3] - ax, by = P[b * 3 + 1] - ay, bz = P[b * 3 + 2] - az, px = P[i * 3] - ax, py = P[i * 3 + 1] - ay, pz = P[i * 3 + 2] - az;
      const s = Math.max(0, Math.min(1, (px * bx + py * by + pz * bz) / (bx * bx + by * by + bz * bz || 1))); return (px - s * bx) ** 2 + (py - s * by) ** 2 + (pz - s * bz) ** 2; };
    for (const i of R) if (edge[i] < 0) { let m = 1e9; for (const [a, b] of segs) m = Math.min(m, d2(i, a, b)); edge[i] = Math.sqrt(m); }
    for (let i = 0; i < N; i++) if (edge[i] < 0) edge[i] = 0;
    PACK.scalpEdge = edge; PACK.scalpBorder = segs.length; }
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
// a woven band through the middle of the cuff (Session 889; OG-025's woven red-and-blue cuff bands): across the cuff's width
// (rest |x| .371 to .411) the band's colour fills the middle, its edges stepped in a chevron round the wrist, as a tablet weave is
const BAND = `{ float t = (abs(vB.x) - .371) / .04, w = abs(fract((vB.z + .7 * vB.y) * 95.) - .5) * 2.; if (abs(t - .5) < .14 + .12 * w) diffuseColor.rgb = bandC * triTex(tW, 60.); }`;
// folds round a wound band (Session 1010, the sash belt): soft ridges and sharp creases running round the body, n of them across
// the band's width (rest y lo to hi), wandering with the angle round the waist so they are not ruled lines. Drawn in the shader:
// the band's colour darkens into each crease and its normal is bent by the ridges' slope, as a bump map bends it
const FOLDN = `vec3 foldNormal(vec3 sp, vec3 sn, vec2 dH, float fd){ vec3 sx = normalize(dFdx(sp)), sy = normalize(dFdy(sp)), r1 = cross(sy, sn), r2 = cross(sn, sx);
  float det = dot(sx, r1) * fd; vec3 g = sign(det) * (dH.x * r1 + dH.y * r2); return normalize(abs(det) * sn - g); }
`;
const FOLD = f => `float foldH(vec3 p){ float a = atan(p.x, p.z), t = (p.y - ${f.lo.toFixed(3)}) / ${(f.hi - f.lo).toFixed(3)};
  float ph = t * ${f.n.toFixed(1)} + a * .15915 + .35 * sin(a * 2. + 1.3 + t * 2.) + .18 * sin(a * 5. + .4 - t * 3.) + .05 * sin(a * 11. + t * 5.), q = fract(ph);
  float amp = .6 + .4 * (.5 + .5 * sin(t * 7.3 + 1.7 + sin(a * 2. - .6) * 1.4)); float h = 1. - amp * (1. - pow(sin(3.14159 * q), .7));
  float e = min(t, 1. - t); return mix(.7, h, smoothstep(.0, .05, e)); }
${FOLDN}`;
// leg wraps wound round the shin (Session 1021): the angle round each shin's own axis (from the knee's joint at rest y -.369 to the
// ankle's at -.745, read off the skeleton), 0 at the front and growing toward the outside on both legs, so the two are wound as mirrors;
// the turns climb the leg one pitch a turn, each one's lower edge lying over the turn below and the cloth sloping in to pass under the
// next, a crease where they meet; the top 1.2 cm, where the thongs tie, lies flat
const LEGA = `vec2 legD(vec3 p){ return vec2(abs(p.x) - .158 - (-.369 - p.y) * .165, p.z - .032 - (p.y + .369) * .085); }
float legA(vec3 p){ vec2 d = legD(p); return atan(d.x, d.y); }`;
// named WRAP_WIND (Session 1095), not WIND: common.js exports a WIND (the leaves' sway), and the bundle shares one scope
const WRAP_WIND = w => `${LEGA}
float foldH(vec3 p){ vec2 d = legD(p); float a = atan(-d.y, d.x), t = (p.y - ${w.lo.toFixed(3)}) / ${w.pitch.toFixed(4)} - a * .15915 + .018 * sin(a * 3. + p.y * 37.) + .01 * sin(a * 7. - p.y * 61.), q = fract(t);
  float h = smoothstep(0., .18, q) * (1. - smoothstep(.45, 1., q)); return mix(.7, h, clamp((${w.hi.toFixed(3)} - p.y) / .012, 0., 1.)); }
${FOLDN}`;
// two leather thongs crossed round the wraps' top, front and back, in the tie's colour
const TIE = w => `{ float a = legA(vB) * .3183, d = vB.y - ${(w.hi - .011).toFixed(4)}; if (abs(d - .006 * a) < .0028 || abs(d + .006 * a) < .0028) diffuseColor.rgb = tieC * triTex(tW, 9.) * .9; }`;
function clothMat(color, kind = 'wool', o = {}) {
  TEXW[kind] = TEXW[kind] || weave(128, kind);
  const m = new THREE.MeshStandardMaterial({ color, roughness: o.rough ?? (kind === 'leather' ? .62 : .95), metalness: 0, side: o.side ?? THREE.FrontSide });
  m.onBeforeCompile = s => { s.uniforms.tW = { value: TEXW[kind] }; if (o.band) s.uniforms.bandC = { value: o.band };
    s.vertexShader = 'attribute vec3 aBase; varying vec3 vB; varying vec3 vRP; varying vec3 vRN;\n' + s.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\n vRP = position; vRN = normal; vB = aBase;');
    s.fragmentShader = 'uniform sampler2D tW; varying vec3 vB;\n' + TRI + s.fragmentShader.replace('vec4 diffuseColor = vec4( diffuse, opacity );', CUT(o.cut) + (o.hole ? `if (${o.hole}) discard;` : '') + `vec4 diffuseColor = vec4( diffuse * triTex(tW, ${(o.scale ?? (kind === 'leather' ? 9 : 22)).toFixed(1)})${o.inner ? ` * (gl_FrontFacing ? 1. : ${o.inner.toFixed(2)})` : ''}, opacity );` + (o.band ? BAND : ''));
    if (o.band) s.fragmentShader = 'uniform vec3 bandC;\n' + s.fragmentShader;
    // a block print (Session 1029, OG-048's patterned headscarf): sprigs in the print's own colour where the vertex's aPrint is 1
    if (o.print) { s.uniforms.printC = { value: o.print }; s.vertexShader = 'attribute float aPrint; varying float vPr;\n' + s.vertexShader.replace('vB = aBase;', 'vB = aBase; vPr = aPrint;');
      s.fragmentShader = 'uniform vec3 printC; varying float vPr;\n' + SPRIGS + s.fragmentShader.replace('#include <color_fragment>', '#include <color_fragment>\n diffuseColor.rgb = mix(diffuseColor.rgb, printC * triTex(tW, ' + (o.scale ?? 22).toFixed(1) + '), printAt(vB, vRN) * vPr);'); }
    // the Old Blood's scattered dot embroidery (Session 1043, OG-066): knots of thread in the dots' own colour, each one shaded as raised
    if (o.dots) { s.uniforms.dotsC = { value: o.dots }; s.uniforms.dotsP = { value: o.dotsPowder ? 1 : 0 }; s.fragmentShader = 'uniform vec3 dotsC;\nuniform float dotsP;\n' + DOTS + s.fragmentShader.replace('#include <color_fragment>', '#include <color_fragment>\n { vec2 dk = dotsAt(vB, vRN); diffuseColor.rgb = mix(diffuseColor.rgb, dotsC * triTex(tW, ' + (o.scale ?? 22).toFixed(1) + ') * (.8 + .45 * dk.y), dk.x); }'); }
    if (o.wind && o.wind.tie) { s.uniforms.tieC = { value: o.wind.tie }; s.fragmentShader = 'uniform vec3 tieC;\n' + s.fragmentShader.replace(/(vec4 diffuseColor = vec4\( diffuse \* [^;]*;)/, '$1 ' + TIE(o.wind)); }
    if (o.fold || o.wind) s.fragmentShader = (o.wind ? WRAP_WIND(o.wind) : FOLD(o.fold)) + s.fragmentShader.replace(/(vec4 diffuseColor = vec4\( diffuse \* [^;]*;)/, 'float fH = foldH(vB); $1 diffuseColor.rgb *= .78 + .22 * fH;')
      .replace('#include <normal_fragment_maps>', '#include <normal_fragment_maps>\n normal = foldNormal(-vViewPosition, normal, vec2(dFdx(fH), dFdy(fH)) * ' + ((o.fold || o.wind).depth ?? 1.1).toFixed(2) + ', faceDirection);'); };
  m.customProgramCacheKey = () => 'cloth' + kind + JSON.stringify(o.cut || 0) + (o.scale || 0) + (o.hole || '') + (o.inner || '') + (o.band ? 'band' : '') + (o.print ? 'print' : '') + (o.dots ? 'dots' : '') + JSON.stringify(o.fold || 0) + JSON.stringify(o.wind ? { ...o.wind, tie: !!o.wind.tie } : 0);
  return m;
}
// the headscarf's print (Session 1029): a sprig of four round petals on a 2.4 cm grid, each row offset by half, read three ways off the
// rest position as the weave is; where a pixel holds more than a sprig or so it gives way to its average, so it does not shimmer far off
const SPRIGS = `float sprigAt(vec2 p){ p *= 42.; p.x += .5 * mod(floor(p.y), 2.); vec2 f = fract(p) - .5; float a = fwidth(p.x) * .8 + .015, m = 0.;
  for (int k = 0; k < 4; k++) { float t = float(k) * 1.5708 + .4; m = max(m, 1. - smoothstep(.1 - a, .1 + a, length(f - .19 * vec2(cos(t), sin(t))))); } return m; }
float printAt(vec3 p, vec3 n){ vec3 w = abs(normalize(n)); w = pow(w, vec3(4.)); w = pow(w, vec3(2.)); w /= (w.x + w.y + w.z);
  float m = sprigAt(p.zy) * w.x + sprigAt(p.xz) * w.y + sprigAt(p.xy) * w.z, k = clamp(length(fwidth(p.xy * 42.)) * 1.2 - .4, 0., 1.); return mix(m, .3, k); }`;
// the dot embroidery (Session 1043, OG-066's "scattered dot embroidery" on undyed linen; OG-067's "small scattered marks"): one cell in
// 1.4 cm of the rest body, a knot of thread in some of them, set anywhere in its cell so they do not read as a grid, 1.1 to 1.9 mm round.
// How many cells hold one rises and falls over 11 cm drifts of the cloth (from 3 in 100 to 45), so they lie scattered, not evenly
// sown. Read off the rest position along whichever axis the cloth faces most (a blend of the three left half-faded ghosts), and given
// way to its average where a pixel holds more than a knot. Or (Session 1125, dress.dotsStyle 'powder', the critic's "oxblood dots on cream
// read as spatter"): powdered as needlework is, one motif in every cell of a half-drop grid 3.5 cm across, each a trefoil of three
// knots 3.2 mm round 3 mm off its middle, turned at random, none left out, so the cloth is sown evenly with a small figure
const DOTS = `float dh3(vec3 p){ p = fract(p * .3183099 + .1); p *= 17.; return fract(p.x * p.y * p.z * (p.x + p.y + p.z)); }
float dn3(vec3 x){ vec3 i = floor(x), f = fract(x); f = f * f * (3. - 2. * f); return mix(mix(mix(dh3(i), dh3(i + vec3(1., 0., 0.)), f.x), mix(dh3(i + vec3(0., 1., 0.)), dh3(i + vec3(1., 1., 0.)), f.x), f.y),
  mix(mix(dh3(i + vec3(0., 0., 1.)), dh3(i + vec3(1., 0., 1.)), f.x), mix(dh3(i + vec3(0., 1., 1.)), dh3(i + vec3(1., 1., 1.)), f.x), f.y), f.z); }
vec2 dotAt(vec2 p, float keep){ p *= 70.; vec2 c = floor(p), f = fract(p); float a = fwidth(p.x) * .8 + .01, m = 0., hi = 0.;
  for (int i = -1; i <= 1; i++) for (int j = -1; j <= 1; j++) { vec2 cc = c + vec2(float(i), float(j)); float h = fract(sin(dot(cc, vec2(127.1, 311.7))) * 43758.5453); if (h > keep) continue;
    vec2 o = vec2(fract(h * 17.31), fract(h * 41.77)) * .7 + .15; float r = .08 + .05 * fract(h * 7.9), d = length(f - vec2(float(i), float(j)) - o), k = 1. - smoothstep(r - a, r + a, d);
    if (k > m) { m = k; hi = clamp(1. - d / r, 0., 1.); } } return vec2(m, hi); }
vec2 powderAt(vec2 p){ p *= 28.; vec2 c = floor(p); p.y += .5 * mod(c.x, 2.); c = floor(p); vec2 f = fract(p) - .5; float h = fract(sin(dot(c, vec2(127.1, 311.7))) * 43758.5453), a = fwidth(p.x) * .8 + .01, m = 0., hi = 0.;
  for (int k = 0; k < 3; k++) { float t = h * 6.2832 + float(k) * 2.0944; float d = length(f - .09 * vec2(cos(t), sin(t))), q = 1. - smoothstep(.045 - a, .045 + a, d); if (q > m) { m = q; hi = clamp(1. - d / .045, 0., 1.); } } return vec2(m, hi); }
vec2 dotsAt(vec3 p, vec3 n){ vec3 w = abs(normalize(n));
  if (dotsP > .5) { float k = clamp(length(fwidth(p.xy * 28.)) * 2.5 - .5, 0., 1.); vec2 m = w.x > w.y && w.x > w.z ? powderAt(p.zy + 3.1) : w.y > w.z ? powderAt(p.xz + 5.7) : powderAt(p.xy); return mix(m, vec2(.02, .5), k); }
  float keep = .03 + .42 * smoothstep(.45, .8, dn3(p * 9. + 2.3)), k = clamp(length(fwidth(p.xy * 70.)) * 1.2 - .5, 0., 1.);
  vec2 m = w.x > w.y && w.x > w.z ? dotAt(p.zy + 3.1, keep) : w.y > w.z ? dotAt(p.xz + 5.7, keep) : dotAt(p.xy, keep); return mix(m, vec2(.02 * keep, .5), k); }`;
// mail (Session 897): rows of riveted rings drawn in the shader on the rest body's coordinates, each row offset by half a
// ring, seen three ways as the cloth's weave is; the gaps between the rings and their holes are dark (the padding under them),
// and where a pixel holds more than a ring or so the pattern gives way to its average, so it does not shimmer at a distance
const RING = '165.', RINGS = `float ringAt(vec2 p){ p *= ${RING}; p.x += .5 * mod(floor(p.y), 2.); vec2 f = fract(p) - .5; float d = length(f * vec2(1., 1.3)), a = fwidth(d) + .02;
  float r = smoothstep(.11 - a, .11 + a, d) * (1. - smoothstep(.52 - a, .52 + a, d)), h = clamp(.55 - f.y - .4 * f.x - d * .6, 0., 1.); return r * (.62 + .45 * h) + (1. - r) * .36; }
float mailAt(vec3 p, vec3 n){ vec3 w = abs(normalize(n)); w = pow(w, vec3(4.)); w /= (w.x + w.y + w.z);
  float m = ringAt(p.zy) * w.x + ringAt(p.xz) * w.y + ringAt(p.xy) * w.z, k = clamp(length(fwidth(p.xy * ${RING})) * 1.2 - .4, 0., 1.); return mix(m, .62, k); }`;
// scales (Session 1058; OG-044's Compact guards in a scale cuirass): bronze plates 2.4 cm wide in rows 3.3 cm apart, each row
// offset by half a plate, each plate hung from the row above and lying over the top of the row below, so a point belongs to the
// highest row whose plate reaches it; a plate is a tongue with a rounded foot, domed across, dark in the gaps at its edges and in
// the shadow under the foot of the plate above, each a little lighter or darker than its neighbours; seen three ways as the rings are
const SCALES = `float scaleAt(vec2 p){ p *= vec2(42., 30.); float a = fwidth(p.y) * .7 + .015, r0 = floor(p.y), r = r0 + 1., e = -1., cx = 0.; vec2 q = vec2(0.);
  for (int i = 0; i < 3; i++) { float o = .5 * mod(r, 2.); cx = floor(p.x - o) + .5 + o; q = vec2(p.x - cx, p.y - r);
    e = q.y > .15 ? (q.y < 1.4 ? .5 - abs(q.x) : -1.) : .5 - length(vec2(q.x, q.y - .15)); if (e > 0.) break; r -= 1.; }
  float o1 = .5 * mod(r + 1., 2.), c1 = floor(p.x - o1) + .5 + o1, d1 = length(vec2(p.x - c1, p.y - r - 1.15)) - .5;
  float edge = smoothstep(.0, .05 + a, e), shade = .5 + .5 * smoothstep(-.02, .32, d1), dome = 1. - 1.6 * q.x * q.x - .25 * clamp(q.y - .15, 0., 1.), t = fract(sin(dot(vec2(cx, r), vec2(12.9898, 78.233))) * 43758.5453);
  return edge * shade * (.82 + .3 * dome) * (.9 + .2 * t) + (1. - edge) * .28; }
float mailAt(vec3 p, vec3 n){ vec3 w = abs(normalize(n)); w = pow(w, vec3(4.)); w /= (w.x + w.y + w.z);
  float m = scaleAt(p.zy) * w.x + scaleAt(p.xz) * w.y + scaleAt(p.xy) * w.z, k = clamp(length(fwidth(p.xy * 36.)) * 1.2 - .4, 0., 1.); return mix(m, .7, k); }`;
// the binding (Session 1068; the cuirass's edges, owed from Session 1058): a band of dark leather 1.6 cm wide round the neck, the
// sleeves and the hem, where the plates are sewn to their lining; its width is laid along the surface, the cut's distance in rest
// height or width divided by how steeply the surface runs across it, so it is as wide over the flat of the shoulder as down the
// hem; it is rolled (lighter down its middle), stitched 3 mm from its inner edge, and takes no metal. o.bind is [neck, sleeve, hem]
const BIND_C = [.05, .026, .012], BIND = (b) => `float bindD(){ vec3 n = normalize(vRN); float sy = sqrt(max(1. - n.y * n.y, .05)), sx = sqrt(max(1. - n.x * n.x, .05));
  return min(min((${b[0].toFixed(3)} - vB.y) / sy, (${b[1].toFixed(3)} - abs(vB.x)) / sx), (vB.y - (${b[2].toFixed(3)})) / sy); }`;
const BIND_MIX = `float bD = bindD(), bA = fwidth(bD) * .7 + .0005, bK = 1. - smoothstep(.016 - bA, .016 + bA, bD), bU = clamp(bD / .016, 0., 1.);
  float bS = (.72 + .4 * (1. - (2. * bU - 1.) * (2. * bU - 1.))) * (1. - .45 * (1. - smoothstep(.0006, .0006 + bA, abs(bD - .013)))) * (.92 + .16 * dn3(vB * 300.));
  diffuseColor.rgb = mix(diffuseColor.rgb, vec3(${BIND_C.map(v => v.toFixed(3)).join(', ')}) * bS, bK);`;
function mailMat(color, o = {}) {
  const m = new THREE.MeshStandardMaterial({ color, roughness: o.scales ? .36 : .45, metalness: o.scales ? .72 : .4, side: o.side ?? THREE.FrontSide });
  m.onBeforeCompile = s => {
    s.vertexShader = 'attribute vec3 aBase; varying vec3 vB; varying vec3 vRN;\n' + s.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\n vRN = normal; vB = aBase;');
    s.fragmentShader = 'varying vec3 vB; varying vec3 vRN;\n' + (o.scales ? SCALES : RINGS) + '\n' + (o.bind ? DOTS.split('\nvec2 dotAt')[0] + '\n' + BIND(o.bind) + '\n' : '') + s.fragmentShader.replace('vec4 diffuseColor = vec4( diffuse, opacity );', CUT(o.cut) + (o.hole ? `if (${o.hole}) discard;` : '') + 'float mR = mailAt(vB, vRN); vec4 diffuseColor = vec4( diffuse * mR, opacity );' + (o.bind ? BIND_MIX : ''))
      .replace('#include <roughnessmap_fragment>', '#include <roughnessmap_fragment>\n roughnessFactor = mix(.85, roughnessFactor, smoothstep(.2, .45, mR));' + (o.bind ? ' roughnessFactor = mix(roughnessFactor, .72, bK);' : ''))
      .replace('#include <metalnessmap_fragment>', '#include <metalnessmap_fragment>' + (o.bind ? '\n metalnessFactor *= 1. - bK;' : '')); };
  m.userData.cut = o.cut; m.userData.bind = o.bind; m.customProgramCacheKey = () => (o.scales ? 'scales' : 'mail') + JSON.stringify(o.cut || 0) + (o.hole || '') + JSON.stringify(o.bind || 0);
  return m;
}
// a shadow cut as the garment is, so the triangles past its cut edge cast none (Session 897: the mail's hem threw teeth onto the thighs)
function cutDepth(o) {
  const m = new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking });
  m.onBeforeCompile = s => { s.vertexShader = 'attribute vec3 aBase; varying vec3 vB;\n' + s.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\n vB = aBase;');
    s.fragmentShader = 'varying vec3 vB;\n' + s.fragmentShader.replace('void main() {', 'void main() {\n' + CUT(o.cut) + (o.hole ? `if (${o.hole}) discard;` : '')); };
  m.customProgramCacheKey = () => 'cutDepth' + JSON.stringify(o.cut || 0) + (o.hole || ''); return m;
}
// fur and hair: stacked shells, each cut by noise so strands rise from the surface
function shellMat(color, layer, layers, o = {}) {
  const m = new THREE.MeshStandardMaterial({ color, roughness: .85, side: THREE.DoubleSide, alphaTest: .5 });
  m.onBeforeCompile = s => {
    s.vertexShader = 'attribute vec3 aBase; varying vec3 vB; varying vec3 vRP;' + (o.edge ? ' attribute float aEdge; varying float vE;' : '') + '\n' + s.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\n vRP = position; vB = aBase;' + (o.edge ? ' vE = aEdge;' : ''));
    if (o.edge) s.fragmentShader = 'varying float vE;\n' + s.fragmentShader;
    s.fragmentShader = 'varying vec3 vB; varying vec3 vRP;\nfloat hh(vec3 p){ p = fract(p * .3183099 + .1); p *= 17.; return fract(p.x * p.y * p.z * (p.x + p.y + p.z)); }\nfloat nz(vec3 x){ vec3 i = floor(x), f = fract(x); f = f * f * (3. - 2. * f); return mix(mix(mix(hh(i), hh(i + vec3(1,0,0)), f.x), mix(hh(i + vec3(0,1,0)), hh(i + vec3(1,1,0)), f.x), f.y), mix(mix(hh(i + vec3(0,0,1)), hh(i + vec3(1,0,1)), f.x), mix(hh(i + vec3(0,1,1)), hh(i + vec3(1,1,1)), f.x), f.y), f.z); }\n'
      + s.fragmentShader.replace('vec4 diffuseColor = vec4( diffuse, opacity );', `float hl = 1.; ${o.hairline ? 'if (vB.z > .05) { float e = vB.y - (.8 - .03 * pow(vB.x / .075, 2.) + (nz(vB * vec3(140., 60., 140.)) - .5) * .009); if (e < 0.) discard; hl = smoothstep(0., .014, e); }' : ''}${o.edge ? ' { float w = smoothstep(-.04, -.01, vB.z) * (1. - smoothstep(.04, .06, vB.z)), e = vE + (nz(vB * vec3(140., 60., 140.)) - .5) * .006; if (w > .5 && e < .0015) discard; hl = min(hl, mix(1., smoothstep(.0015, .014, e), w)); }' : ''} float L = ${(layer / layers).toFixed(3)};
        vec3 q = vRP * vec3(${o.sx ?? 380}., ${o.sy ?? 90}., ${o.sx ?? 380}.); float strand = nz(q) * .7 + nz(q * 2.3) * .3;
        float keep = ${o.solid ? '1.' : 'step(L * .85 + .1, strand)'};
        vec4 diffuseColor = vec4(diffuse * (.42 + .75 * L) * (.85 + .3 * strand), keep);${o.skin ? '\n        diffuseColor.rgb = mix(skinC, diffuseColor.rgb, hl);' : ''}`);
    // the hairline's fade (Session 875): from the skin's own colour at the edge to the shell's over 1.4 cm, so the roots read as a shadow
    if (o.skin) { s.uniforms.skinC = { value: o.skin }; s.fragmentShader = 'uniform vec3 skinC;\n' + s.fragmentShader; } };
  m.customProgramCacheKey = () => 'shell' + layer + '/' + layers + JSON.stringify({ ...o, skin: !!o.skin });
  return m;
}
function skinMat(c, marks = null, scar = null) {
  const m = new THREE.MeshPhysicalMaterial({ color: c, roughness: .6, metalness: 0, sheen: .18, sheenColor: new THREE.Color(1, .45, .35), sheenRoughness: .5, vertexColors: true });
  if (marks != null) markSkin(m, marks); if (scar) scarSkin(m, scar); return m;
}
// the Old Blood's marks (Session 1052; canon §3.1, Michael's 2 B on OG-066): not ink but pale raised lines under the skin, branching
// like veins, at the wrist, the back of the hand and the shoulder blade, on both sides. They spread as the Cold rises (§3.3), up the
// arm and at last to the face: `cold` (0..1) carries their reach along a line from the knuckles through the wrist, the elbow, the
// shoulder and the neck to the cheek, from 5 cm past the wrist at 0 to the cheekbone at 1, and grows the patch on each shoulder
// blade from 5 cm across to 15. All of it is drawn in the shader on the rest body (aBase), with no new triangles: the lines are
// the half-way contours of a warped noise at two scales, cut into open strands that taper by a third, slower noise (whole contours
// closed into rings), lighter than the skin and raised by a bump read off their own slope;
// the reach's edge is broken by noise so the marks end in tendrils, and far off they fade to nothing so they do not shimmer
function restJoint(name) { const b = PACK.ix.bones.find(x => x.name === name), L = PACK.ix.joints[b.head], R0 = PACK.rest, v = new THREE.Vector3(); for (const i of L) v.x += R0[i * 3], v.y += R0[i * 3 + 1], v.z += R0[i * 3 + 2]; return v.divideScalar(L.length); }
function markSkin(m, cold) {
  const line = s => { const hd = restJoint('head'), P = [restJoint(`finger3-1.${s}`), restJoint(`wrist.${s}`), restJoint(`lowerarm01.${s}`), restJoint(`upperarm01.${s}`), restJoint('neck01'), hd.clone().add(new THREE.Vector3((s === 'L' ? 1 : -1) * .055, .035, .05))];
      let L = 0; for (let i = 1; i < P.length; i++) L += P[i].distanceTo(P[i - 1]); return { P, L, L0: P[0].distanceTo(P[1]) + .05 }; },
    A = line('L'), B = line('R'), reach = A.L0 + Math.max(0, Math.min(1, cold)) * (A.L - A.L0);
  const blade = s => restJoint(`shoulder01.${s}`).add(new THREE.Vector3(0, -.07, -.075));
  m.onBeforeCompile = sh => {
    Object.assign(sh.uniforms, { mkA: { value: A.P }, mkB: { value: B.P }, mkL: { value: reach }, mkS: { value: [blade('L'), blade('R')] }, mkR: { value: .05 + .1 * Math.max(0, Math.min(1, cold)) } });
    sh.vertexShader = 'attribute vec3 aBase; varying vec3 vMk;\n' + sh.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\n vMk = aBase;');
    sh.fragmentShader = `varying vec3 vMk; uniform vec3 mkA[6]; uniform vec3 mkB[6]; uniform float mkL; uniform vec3 mkS[2]; uniform float mkR; float mkLine = 0.;
float mkH(vec3 p) { return fract(sin(dot(p, vec3(127.1, 311.7, 74.7))) * 43758.5453); }
float mkN(vec3 p) { vec3 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f);
  return mix(mix(mix(mkH(i), mkH(i + vec3(1, 0, 0)), f.x), mix(mkH(i + vec3(0, 1, 0)), mkH(i + vec3(1, 1, 0)), f.x), f.y), mix(mix(mkH(i + vec3(0, 0, 1)), mkH(i + vec3(1, 0, 1)), f.x), mix(mkH(i + vec3(0, 1, 1)), mkH(i + vec3(1, 1, 1)), f.x), f.y), f.z); }
float mkSeg(vec3 p, vec3 a, vec3 b, float maxT) { vec3 ab = b - a; float l = length(ab); float t = clamp(dot(p - a, ab) / l, 0., min(l, maxT)); return length(p - a - ab / l * t); }
float mkPath(vec3 p, vec3 P[6]) { float d = 9., a = 0.; for (int i = 0; i < 5; i++) { float l = length(P[i + 1] - P[i]); if (mkL > a) d = min(d, mkSeg(p, P[i], P[i + 1], mkL - a)); a += l; } return d; }
float mkMarks(vec3 p) {
  float rag = (mkN(p * 34.) - .5) * .035, d = min(mkPath(p, mkA), mkPath(p, mkB)), m = 1. - smoothstep(.045, .075, d + rag);
  m = max(m, 1. - smoothstep(mkR * .55, mkR, min(length(p - mkS[0]), length(p - mkS[1])) + rag));
  if (m <= 0.) return 0.;
  vec3 q = p * 36. + vec3(mkN(p * 8.), mkN(p * 8. + 5.2), mkN(p * 8. + 9.7)) * 1.8; float n1 = mkN(q), n2 = mkN(q * 2.3 + 3.3), w1 = fwidth(n1), w2 = fwidth(n2);
  float br = mkN(q * .7 + 7.1), tw = smoothstep(.45, .7, br), l1 = 1. - smoothstep(0., (.012 + .022 * tw) + w1, abs(n1 - .5)), l2 = (1. - smoothstep(0., .02 + w2, abs(n2 - .5))) * .55 * smoothstep(.2, .6, n1);
  return max(l1 * smoothstep(.3, .46, br), l2 * smoothstep(.42, .58, br)) * m * (1. - smoothstep(.12, .35, w1)); }
` + sh.fragmentShader.replace('#include <color_fragment>', '#include <color_fragment>\n mkLine = mkMarks(vMk); diffuseColor.rgb = mix(diffuseColor.rgb, diffuseColor.rgb * 1.1 + vec3(.07, .075, .085), mkLine * .85);')
      .replace('#include <normal_fragment_maps>', `#include <normal_fragment_maps>
 { float h = mkLine * .0007; vec3 sx = dFdx(-vViewPosition), sy = dFdy(-vViewPosition), r1 = cross(sy, normal), r2 = cross(normal, sx); float det = dot(sx, r1) * faceDirection;
   vec3 g = sign(det) * (dFdx(h) * r1 + dFdy(h) * r2); if (abs(det) > 0.) normal = normalize(abs(det) * normal - g); }`); };
  m.customProgramCacheKey = () => 'skin-marks';
}
// a scar (Session 1079, L1; OG-001's extras strip, "the disabled (an eyepatch, scars)"; OG-065's Garrick, scarred): an old cut from
// over the brow down across the eye to the cheek, on one side. It lies on the rest face (aBase), so it is the same on every face
// the morphs make: from 3.4 cm over the eye's middle, 2 mm toward the nose, to 3.8 cm under it, 1.3 cm out, widest (4.8 mm) a little
// above its middle and tapering to its ends, its edges wavering by noise. Healed tissue is paler and pinker than the skin, a little
// shiny and raised, with a puckered margin a shade darker, and the stitches' marks cross it every 6 mm. Drawn in the skin's
// shader, with no new triangles; the brows grow none of their hairs on it (buildBrows)
export function scarLine(side) {
  const R0 = PACK.rest, L = [...new Set(PACK.G[`helper-${side === 'R' ? 'r' : 'l'}-eye`])]; let x = 0, y = 0, z = 0; for (const i of L) { x += R0[i * 3]; y += R0[i * 3 + 1]; z += R0[i * 3 + 2]; }
  x /= L.length; y /= L.length; z /= L.length; const s = Math.sign(x) || 1;
  return { A: [x - s * .002, y + .034], B: [x + s * .013, y - .038], z: z - .025, eye: [x, y, z] };
}
function scarDist(S, x, y) { const ax = S.B[0] - S.A[0], ay = S.B[1] - S.A[1], t = Math.max(0, Math.min(1, ((x - S.A[0]) * ax + (y - S.A[1]) * ay) / (ax * ax + ay * ay))); return { d: Math.hypot(x - S.A[0] - ax * t, y - S.A[1] - ay * t), t }; }
function scarSkin(m, side) {
  const S = scarLine(side), prev = m.onBeforeCompile, key = m.customProgramCacheKey;
  m.onBeforeCompile = (sh, r) => { if (prev && prev !== THREE.Material.prototype.onBeforeCompile) prev(sh, r);
    Object.assign(sh.uniforms, { scA: { value: new THREE.Vector2(...S.A) }, scB: { value: new THREE.Vector2(...S.B) }, scZ: { value: S.z } });
    sh.vertexShader = (sh.vertexShader.includes('attribute vec3 aBase;') ? '' : 'attribute vec3 aBase;\n') + 'varying vec3 vSc;\n' + sh.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\n vSc = aBase;');
    sh.fragmentShader = `varying vec3 vSc; uniform vec2 scA; uniform vec2 scB; uniform float scZ; float scK = 0., scM = 0.;
float scH(vec3 p) { return fract(sin(dot(p, vec3(91.3, 217.9, 47.1))) * 24634.6345); }
float scN(vec3 p) { vec3 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f);
  return mix(mix(mix(scH(i), scH(i + vec3(1, 0, 0)), f.x), mix(scH(i + vec3(0, 1, 0)), scH(i + vec3(1, 1, 0)), f.x), f.y), mix(mix(scH(i + vec3(0, 0, 1)), scH(i + vec3(1, 0, 1)), f.x), mix(scH(i + vec3(0, 1, 1)), scH(i + vec3(1, 1, 1)), f.x), f.y), f.z); }
void scScar(vec3 p) { if (p.z < scZ) return; vec2 ab = scB - scA; float l = length(ab), t = clamp(dot(p.xy - scA, ab) / (l * l), 0., 1.);
  vec2 q = p.xy - scA - ab * t; float d = length(q) + (scN(p * 160.) - .5) * .0012 + (scN(p * 40.) - .5) * .0016, w = .0021 * pow(sin(3.1416 * min(1., t * 1.15)), .55) + .0003, aa = fwidth(d) + .0002;
  scK = 1. - smoothstep(w - aa, w + aa, d); scM = (1. - smoothstep(w, w + .0022, d)) * (1. - scK);
  float s = (t * l) / .006, st = abs(fract(s) - .5), across = abs(dot(q, vec2(-ab.y, ab.x) / l));
  scK = max(scK, (1. - smoothstep(.06, .12, st)) * (1. - smoothstep(w + .0012, w + .0024, across)) * step(.08, t) * step(t, .92) * .28); }
` + sh.fragmentShader.replace('#include <color_fragment>', '#include <color_fragment>\n scScar(vSc); diffuseColor.rgb = mix(diffuseColor.rgb * (1. - .06 * scM), diffuseColor.rgb * vec3(1.08, 1., 1.) + vec3(.11, .07, .075), scK * .9);')
      .replace('#include <roughnessmap_fragment>', '#include <roughnessmap_fragment>\n roughnessFactor = mix(roughnessFactor, .36, scK);')
      .replace('#include <normal_fragment_maps>', `#include <normal_fragment_maps>
 { float h = scK * .0005 - scM * .00015; vec3 sx = dFdx(-vViewPosition), sy = dFdy(-vViewPosition), r1 = cross(sy, normal), r2 = cross(normal, sx); float det = dot(sx, r1) * faceDirection;
   vec3 g = sign(det) * (dFdx(h) * r1 + dFdy(h) * r2); if (abs(det) > 0.) normal = normalize(abs(det) * normal - g); }`); };
  m.customProgramCacheKey = () => (key ? key.call(m) : 'skin') + '+scar' + side;
}

// ── the genome ──
// g: 0 woman .. 1 man; age: .1875 is 11, .5 is 25, 1 is 90; muscle, weight, height, prop: 0..1; race: {caucasian, african, asian};
// face: {target: -1..1}; skin, hair, eyes: colours; dress: {tunic, trousers, boots, belt, mantle, skirt: 'short'|'long'|null,
// hairLen: 0..1, beard: 0..1}
function macroWeights(G) {
  // under 25 (Session 1081) the child's targets come in, MakeHuman's age of 11 at .1875, the youngest the genome goes; from 25 to 90
  // the young and the old as before, so every grown body is as it was
  const W = {}, gw = { male: G.g, female: 1 - G.g }, a = Math.min(1, Math.max(.1875, G.age ?? .5)), aw = a < .5 ? { child: (.5 - a) / .3125, young: (a - .1875) / .3125 } : { young: 1 - (a - .5) / .5, old: (a - .5) / .5 };
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
  if (push) { const n = g.attributes.normal.array, used = new Uint8Array(PACK.N), R0 = PACK.rest; for (const i of index) used[i] = 1; for (let i = 0; i < PACK.N; i++) if (used[i]) { const d = typeof push === 'function' ? push(R0[i * 3], R0[i * 3 + 1], R0[i * 3 + 2], i) : push; pos[i * 3] += n[i * 3] * d; pos[i * 3 + 1] += n[i * 3 + 1] * d; pos[i * 3 + 2] += n[i * 3 + 2] * d; } g.computeVertexNormals(); }
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
  let edgeN = 0, edgeW = 0, backN = 0, backW = 0, tN = 0, tW = 0, tbN = 0, tbW = 0; const strands = [], short = style === 'short', free = style === 'loose', L = short ? .05 + .1 * len : free ? .12 + .5 * len : .5, nS = short ? 1400 : free ? 2200 : 1700, step = .009, thick = short ? .009 : free ? .02 : .011;
  for (let k = 0; k < nS; k++) {
    let r = rnd() * tot, lo = 0, hi = area.length - 1; while (lo < hi) { const m = (lo + hi) >> 1; if (area[m] < r) lo = m + 1; else hi = m; } const t = lo * 3;
    A.fromArray(P, scalpTris[t] * 3); B.fromArray(P, scalpTris[t + 1] * 3); C.fromArray(P, scalpTris[t + 2] * 3); let u = rnd(), v = rnd(); if (u + v > 1) { u = 1 - u; v = 1 - v; }
    const p = A.clone().multiplyScalar(1 - u - v).addScaledVector(B, u).addScaledVector(C, v), side = Math.abs(p.x - hc.x) < .004 ? (rnd() < .5 ? -1 : 1) : Math.sign(p.x - hc.x);
    const off = .003 + thick * rnd() ** .7, g = gather.length === 2 ? gather[side < 0 ? 0 : 1] : gather[0];
    let q = p.clone(), e = S.near(q), n = e ? e.n.clone() : p.clone().sub(hc).normalize(); q.addScaledVector(n, .003);
    // the parting (Session 874): only the strands rooted forward of the crown split to either side; behind it the side pull
    // grows smoothly from nothing at the midline, so no seam of bare scalp runs down the back of the head
    const sx = Math.max(-1, Math.min(1, (p.x - hc.x) / hr.x)), fore = Math.max(0, Math.min(1, (p.z - hc.z + .02) / .06)), sideW = .45 * (fore * side + (1 - fore) * sx);
    // the front hairline (Session 875): a strand rooted within 1.5 cm of it is finer, down to a third of the width at the edge,
    // so the hair thins out onto the brow instead of starting at full width on one line
    const r0 = new THREE.Vector3().fromArray(R0, scalpTris[t] * 3).multiplyScalar(1 - u - v).addScaledVector(new THREE.Vector3().fromArray(R0, scalpTris[t + 1] * 3), u).addScaledVector(new THREE.Vector3().fromArray(R0, scalpTris[t + 2] * 3), v);
    // and at the temples and over the ears (Session 879) by the root's distance to the region's border, so the side of the brow
    // is not a step of full-width strands where the region's triangles stop
    const E = PACK.scalpEdge, eD = E[scalpTris[t]] * (1 - u - v) + E[scalpTris[t + 1]] * u + E[scalpTris[t + 2]] * v, wS = Math.max(0, Math.min(1, (r0.z + .04) / .03)) * (1 - Math.max(0, Math.min(1, (r0.z - .04) / .02)));
    const eF = Math.min(r0.z > .04 ? Math.max(0, Math.min(1, (r0.y - (.796 - .03 * (r0.x / .075) ** 2)) / .015)) : 1, 1 - wS * (1 - Math.min(1, eD / .015))), fine = .35 + .65 * eF * eF * (3 - 2 * eF);
    const pts = [q.clone()], ns = [n.clone()], dir = new THREE.Vector3(), myL = L * (free ? (.7 + .45 * rnd()) * (1 - .22 * sx * sx) : .75 + .4 * rnd()), relY = free ? hc.y - .03 - .035 * rnd() : 0; let fell = -1, under = false, nRel = null;
    // the root sits on the skin and the strand rises into its layer over its first 5 cm (Session 877), so the hairline is not
    // a row of strands standing off the forehead and the crown has some lift; loose and short hair stand higher than pulled-back styles
    const offAt = l => { const k = Math.min(1, l / .05); return .003 + (off - .003) * k * k * (3 - 2 * k); };
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
      if (h2) { const o2 = offAt(l + step), c = stick || onHead(q2) ? o2 : clearAt(q2) + o2; if (stick || h2.h < c) q2.addScaledVector(h2.e.n, c - h2.h); n.copy(h2.e.n); }
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
    if (r0.z > -.01 && r0.z < .04 && Math.abs(r0.x) > .05) { if (eD < .0075) { tN++; tW += fine; } else if (eD >= .015) { tbN++; tbW += fine; } }
    strands.push({ pts, ns, w: (short ? .008 : free ? .008 : .011) * (.8 + .4 * rnd()) * fine, tip: free ? .85 : .5, v0: 0, v1: Math.min(1, pts.length * step / (g ? .35 : myL)) });
  }
  // the checks' numbers: strand points under the skin, and strand points lying on the face (by the rest place of the skin under them)
  // and Session 877's: how high the roots sit on the skin, and how high the hair stands over the crown
  let rootH = 0, crownH = 0, crownN = 0; for (const st of strands) { const h0 = heightOver(S, st.pts[0]); if (h0) rootH = Math.max(rootH, h0.h); }
  let inside = 0, onFace = 0, pts = 0; for (const st of strands) for (const q of st.pts) { pts++; const hit = heightOver(S, q); if (!hit) continue; if (hit.h < -.001) inside++; if (q.y > hc.y + .04) { crownH += hit.h; crownN++; }
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
  return { meshes: out, stats: { style, strands: strands.length, gather: gather.length, points: pts, inside, onFace, drapeMin: +drapeMin.toFixed(4), seam: seamN ? +(seamBare / seamN).toFixed(3) : 0, seamN, rootH: +rootH.toFixed(4), crown: +(crownH / Math.max(1, crownN)).toFixed(4), hairline: { edge: edgeN, ratio: +((edgeW / Math.max(1, edgeN)) / (backW / Math.max(1, backN))).toFixed(3) }, temples: { edge: tN, inner: tbN, ratio: +((tW / Math.max(1, tN)) / (tbW / Math.max(1, tbN))).toFixed(3) } } };
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
  // with a spear in the right fist (Session 909) a full cloak is thrown back off the right shoulder, as a Markman frees his
  // weapon arm: it opens from the throat round to just behind the shoulder, so the forearm held forward is out of it
  const thrown = !!(D.spear || D.crossbow || D.staff || D.basket) && !cape, th0 = thrown ? -Math.PI / 2 + .35 : -Math.PI + open, th1 = Math.PI - open, cols = [], tops = [];
  for (let k = 0; k < K; k++) { const th = th0 + (k / (K - 1)) * (th1 - th0), dir = new THREE.Vector3(Math.sin(th), 0, -Math.cos(th));
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
  // wound so its normals point out of the cloak (Session 917): the shadow's lookup is moved along the vertex normal (normalBias), and
  // with them pointing in, the cloak's outside read its own shadow 2 cm behind it and went dark wherever the key light fell on it
  for (let k = 0; k < K - 1; k++) for (let r = 0; r < R - 1; r++) { const a = k * R + r, b = a + R; idx.push(a, b, a + 1, b, b + 1, a + 1); }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('aBase', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx); g.computeVertexNormals();
  const cm = clothMat(sRGB(...D.cloak), D.cloakFur ? 'leather' : 'wool', { side: THREE.DoubleSide, scale: 26 }), cloak = new THREE.Mesh(g, cm); cloak.name = 'cloak'; out.push(cloak);
  // an embroidered hem (OG-048, OG-059: red embroidered borders): a band of its own colour over the last 3.5 cm of the
  // sheet, laid 1.5 mm proud of it round the neck's axis so it never sinks into the cloth
  if (D.cloakHem) { const nb = Math.min(R - 2, Math.round(.035 / .0105)), bp = [], bi = [];
    for (let k = 0; k < K; k++) for (let r = R - 1 - nb; r < R; r++) { const q = cols[k][r], dx = q.x - neck.x, dz = q.z - neck.z, l = Math.hypot(dx, dz) || 1; bp.push(q.x + dx / l * .0015, q.y - (r === R - 1 ? .001 : 0), q.z + dz / l * .0015); }
    for (let k = 0; k < K - 1; k++) for (let r = 0; r < nb; r++) { const a = k * (nb + 1) + r, b = a + nb + 1; bi.push(a, b, a + 1, b, b + 1, a + 1); }
    const bg = new THREE.BufferGeometry(); bg.setAttribute('position', new THREE.Float32BufferAttribute(bp, 3)); bg.setAttribute('aBase', new THREE.Float32BufferAttribute(bp, 3)); bg.setIndex(bi); bg.computeVertexNormals();
    const bm = new THREE.Mesh(bg, clothMat(sRGB(...D.cloakHem), 'wool', { side: THREE.DoubleSide, scale: 60 })); bm.name = 'cloakHem'; out.push(bm); }
  // a fur lining turned out at the collar (the Markmen's), or the hood rolled on the shoulders
  const ring = tops.map(t => t.start.clone().addScaledVector(t.n, .012).add(new THREE.Vector3(0, .012, 0)));
  if (D.cloakFur) for (let s = 0; s < 6; s++) { const m = new THREE.Mesh(tubeGeom(ring, ring.map(() => .026 + s * .004), 8), shellMat(sRGB(...D.cloakFur), s, 6, { sx: 260, sy: 70, solid: s === 0 })); m.geometry.setAttribute('aBase', m.geometry.attributes.position); m.name = 'collar' + s; out.push(m); }
  else if (D.hood === 'down') { const kb = Math.round(-th0 / (th1 - th0) * (K - 1)), back = ring.slice(Math.max(0, kb - Math.round(K * .2)), kb + Math.round(K * .2)).map(q => q.clone().lerp(new THREE.Vector3(neck.x, q.y + .025, neck.z), .25)), m = new THREE.Mesh(tubeGeom(back, back.map((_, i) => .03 + .018 * Math.sin(Math.PI * i / (back.length - 1))), 10), clothMat(sRGB(...D.cloak).multiplyScalar(.92), 'wool', { scale: 26 })); m.geometry.setAttribute('aBase', m.geometry.attributes.position); m.name = 'hood'; out.push(m); }
  // the brooch at the throat, where the two front columns meet
  const a = thrown ? tops[K - 1] : tops[0], b = tops[K - 1], at = a.start.clone().add(b.start).multiplyScalar(.5), nrm = a.n.clone().add(b.n).normalize();
  const br = new THREE.Mesh(new THREE.CylinderGeometry(.021, .021, .006, 24), new THREE.MeshStandardMaterial({ color: sRGB(...(D.brooch || [.55, .42, .2])), metalness: .9, roughness: .38 }));
  br.position.copy(at).addScaledVector(nrm, .012); br.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), nrm); br.name = 'brooch'; out.push(br);
  const boss = new THREE.Mesh(new THREE.SphereGeometry(.007, 12, 8), br.material); boss.position.copy(br.position).addScaledVector(nrm, .005); out.push(boss);
  for (const m of out) { m.castShadow = true; m.receiveShadow = true; m.frustumCulled = false; }
  let minClear = 1, under = 0; for (const c of cols) for (const q of c) { const hit = heightOver(S, q); if (hit) { minClear = Math.min(minClear, hit.h); if (hit.h < .005) under++; } }
  return { meshes: out, stats: { columns: K, rows: R, tris: idx.length / 3, minClear: +minClear.toFixed(4), under, brooch: +br.position.distanceTo(neck).toFixed(3), cape, hemDrop: +(neck.y - cols.reduce((a, c) => a + c[R - 1].y, 0) / K).toFixed(3), hem: !!D.cloakHem, thrown, ...H.stats, through: armsThrough(cols, R, PP, neck, worn) } };
}

// the body round the neck's axis: for each height (2 cm) and angle (4°) the furthest point of the posed body, so a
// column can ask how far in it may come at any height (Session 839)
// which points of the pack stand for what the person wears under the cloak: the body, and the skirt's fitting shell
// when a skirt is worn (the short tunic's skirt is cut from it, and stands out of the body by up to 2.5 cm, plus its push)
// and a robe's sleeves (Session 888): the tights' shell along the arms, standing out by the robe's own push, up to 4.6 cm at the cuff
function wornMask(D) { const m = new Uint8Array(PACK.N), R0 = PACK.rest; m.off = new Float32Array(PACK.N); for (const v of PACK.G['body']) m[v] = 1;
  if (D.skirt) { const sk = D.skirt === 'long' ? PACK.R.skirtLong : PACK.R.skirtShort; for (const v of sk) { m[v] = 2; m.off[v] = .025; } }
  // mail (Session 897): its body off the tights, standing as the tunic does and 9 mm more, and its skirt off the skirt shell, by its own push and 6 to 8 mm more
  if (D.mail && !D.robe) { for (const v of PACK.R.mailTop) { const y = R0[v * 3 + 1], ax = Math.abs(R0[v * 3]); if (ax > .3 || y < .06) continue; m[v] = 3; m.off[v] = .032 + (ax < .2 ? .022 * Math.max(0, Math.min(1, (.46 - y) / .2)) : 0) + .012 * Math.max(0, Math.min(1, (.2 - y) / .1)); }
    for (const v of PACK.R.mailSkirt) { const y = R0[v * 3 + 1]; if (y < -.27) continue; m[v] = 2; m.off[v] = .03 + .012 * Math.max(0, Math.min(1, (.14 - y) / .3)) + .03 * Math.max(0, Math.min(1, (y + .14) / .14)) + (D.skirt === 'long' ? .006 : 0); } }
  if (D.robe) for (const v of PACK.R.tunic) { const ax = Math.abs(R0[v * 3]); if (ax > .22 && ax < .4) { m[v] = 3; m.off[v] = .016 + .03 * Math.max(0, Math.min(1, (ax - .24) / .16)) ** 1.5; } } return m; }
function radialMap(PP, ax, az, y0, y1, B) {
  const NA = 90, NY = Math.ceil((y1 - y0) / .02) + 1, M = new Float32Array(NA * NY), n = PP.length / 3;
  for (let i = 0; i < n; i++) { if (!B[i]) continue; const y = PP[i * 3 + 1]; if (y < y0 || y > y1) continue; const dx = PP[i * 3] - ax, dz = PP[i * 3 + 2] - az, r = Math.hypot(dx, dz) + B.off[i];
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
  // nothing it hangs over comes through (Session 898): the folds' troughs and the hem's rise move points in and up after the
  // body's outline was read, and over a stiff mail skirt a few came in past it; any such point goes back out to 4 mm over it
  let floored = 0; for (const c of cols) for (let r = 1; r < R; r++) { const q = c[r]; if (q.y > yTop - .1) continue; const p = polar(q), f = bodyR(p.th, q.y) + .004; if (p.r < f) { setR(q, p.th, f); floored++; } }
  let crossed = 0; for (let r = 0; r < R; r++) for (let k = 1; k < K; k++) if (polar(cols[k][r]).th < polar(cols[k - 1][r]).th) crossed++;
  return { stats: { untangled, crossed, floored, tapered, hemIn: +hemIn.toFixed(4), hemSlack: +hemSlack.toFixed(4), foldDepth: +deep.toFixed(4), foldPeriod: +P.toFixed(2) } };
}
// nothing of the body inside the cloak's span comes out through it: each body point under the shoulders and above the
// hem, between the second column and the second-last, lies nearer the axis than the sheet at its angle and height
function armsThrough(cols, R, PP, neck, BM) {
  const ax = neck.x, az = neck.z, K = cols.length, pol = cols.map(c => c.map(q => ({ th: Math.atan2(q.x - ax, -(q.z - az)), r: Math.hypot(q.x - ax, q.z - az), y: q.y })));
  const at = (k, y) => { const c = pol[k]; let lo = 0; while (lo < R - 2 && c[lo + 1].y > y) lo++; const a = c[lo], b = c[lo + 1], t = Math.max(0, Math.min(1, (a.y - y) / Math.max(1e-6, a.y - b.y))); return { th: a.th + (b.th - a.th) * t, r: a.r + (b.r - a.r) * t }; };
  let yHem = -1e9; for (const c of pol) yHem = Math.max(yHem, c[R - 1].y); const yTop = neck.y - .14, n = PP.length / 3, NB = Math.max(1, Math.ceil((yTop - yHem) / .01)), tab = [];
  for (let j = 0; j <= NB; j++) { const y = yTop - j * .01; tab.push(cols.map((_, k) => at(k, y))); }
  let tested = 0, out = 0;
  for (let i = 0; i < n; i++) { if (!BM[i]) continue; const y = PP[i * 3 + 1]; if (y > yTop || y < yHem + .01) continue; const dx = PP[i * 3] - ax, dz = PP[i * 3 + 2] - az, th = Math.atan2(dx, -dz), r = Math.hypot(dx, dz) + BM.off[i], row = tab[Math.round((yTop - y) / .01)];
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
  // mail under it (Session 897): the tights stand for its body, 9 mm over the tunic, and the skirt's shell for its skirt
  const mail = D.mail && !D.robe; if (mail) for (const v of PACK.R.mailSkirt) if (PACK.rest[v * 3 + 1] > -.27) B[v] = 4;
  const neck = new THREE.Vector3(); byName['neck01'].getWorldPosition(neck); const nY = neck.y, cx = neck.x, cz = neck.z;
  // the shoulders' half width at the armpit's height, and the tabard a little over half of it
  let sh = 0; for (let i = 0; i < n; i++) if (B[i] === 1 && Math.abs(PP[i * 3 + 1] - (nY - .16)) < .02) sh = Math.max(sh, Math.abs(PP[i * 3] - cx));
  let yb = 0, nb = 0; for (const v of PACK.R.belt) { yb += PP[v * 3 + 1]; nb++; } const yBelt = yb / nb;
  // the tunic's own push off the tights' shell, by height (makePerson's), read at the rest height of a posed point
  const tunicPush = (x, y) => { const yr = y - yBelt + .162; return .013 + (Math.abs(x) < .2 ? .022 * Math.max(0, Math.min(1, (.46 - yr) / .2)) * (1 - .8 * Math.exp(-(((yr - .16) / .03) ** 2))) : 0) + .002; };
  const ramp = (a, b, v) => Math.max(0, Math.min(1, (v - a) / (b - a))), mailOn = (y, yr = y - yBelt + .162) => yr > .06 && yr < .6 ? .009 + .012 * ramp(.2, .1, yr) : 0;
  const OFF = (i, x, y) => B[i] === 2 ? (D.tunic ? tunicPush(x - cx, y) + (mail ? mailOn(y) : 0) : .01) : B[i] === 3 ? .025 : B[i] === 4 ? (yr => .027 + .012 * ramp(.14, -.16, yr) + .03 * ramp(-.14, 0, yr))(y - yBelt + .162) : 0;
  const bz = mail ? .034 : .025, W = sh * .56, NC = 21, yHem = yBelt - .25 - .2 * (D.tabardLen ?? .5), step = .01, clr = (D.mantle ? .05 : D.tunic ? .022 : .012), hole = .068;
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
      if (inB[j]) { zf = Math.max(TF[j] + bz, F[j] + .0045, F1[j] + clr); zb = Math.min(TB[j] - bz, Bk[j] - .0045, B1[j] - clr); } else { zf = Math.max(zf, F[j] + clr); zb = Math.min(zb, Bk[j] - clr); } ZF[j] = zf; ZB[j] = zb; }
    for (let it = 0; it < 3; it++) { const a = ZF.slice(), bb = ZB.slice(); for (let j = 2; j < last - 2; j++) { if (a[j] < -8 || a[j - 2] < -8) continue; ZF[j] = (a[j - 2] + a[j - 1] + a[j] + a[j + 1] + a[j + 2]) / 5; ZB[j] = (bb[j - 2] + bb[j - 1] + bb[j] + bb[j + 1] + bb[j + 2]) / 5;
      if (!inB[j]) { ZF[j] = Math.max(ZF[j], F[j] + clr); ZB[j] = Math.min(ZB[j], Bk[j] - clr); } else { ZF[j] = Math.max(ZF[j], TF[j] + bz, F[j] + .0045, F1[j] + clr); ZB[j] = Math.min(ZB[j], TB[j] - bz, Bk[j] - .0045, B1[j] - clr); } } }
    const floF = Float32Array.from(ZF, (_, j) => inB[j] ? Math.max(TF[j] + bz, F[j] + .0045, F1[j] + clr) : F[j] + clr), floB = Float32Array.from(ZB, (_, j) => inB[j] ? Math.min(TB[j] - bz, Bk[j] - .0045, B1[j] - clr) : Bk[j] - clr);
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

// ── the Aurennais' sash over one shoulder (Session 989, L1; OG-056: "a long patterned sash wrapped over one shoulder", OG-044's
// indigo and madder sashes) ──
// A band 9 cm wide in a loop from the top of one shoulder, across the chest to the other hip and round the back. The loop lies in
// the plane through the shoulder, the hip and the body's front-to-back line; round it, for each of 144 angles and at five places
// across its width, the band stands just clear of the furthest point of the body (or the tunic, skirt or belt over it) on that
// ray, read from a radial map of everything within its width, as the tabard reads its columns. The arms and the head are left
// out of what it reads. Two printed borders run its edges, in vertex colours: one mesh, one draw.
// the Old Blood's shoulder wrap (Session 1048, OG-066's "single shoulder wrap"): the sash's loop over one shoulder and under the
// other arm, built wide, in plain dark wool. It is gathered to 17 cm over the shoulder's top, spreads to 30 cm over the chest and the
// back, and narrows to 13 cm where it turns under the arm at the hip. Its width lies in 13 rows across, each set clear of what is under
// it as the sash's five are, and over them five soft folds run its length, laid outward only, deeper where it is gathered. No print, no knot
function buildSash(G, body, byName, o = {}) {
  const D = G.dress, PP = posedBody(body), n = PACK.N, R0 = PACK.rest, wrap = !!o.wrap, side = (wrap ? D.shoulderWrapSide : D.sashSide) === 'R' ? -1 : 1;
  const neck = new THREE.Vector3(); byName['neck01'].getWorldPosition(neck); const nY = neck.y, cx = neck.x, cz = neck.z;
  let yb = 0, nb = 0; for (const v of PACK.R.belt) { yb += PP[v * 3 + 1]; nb++; } const yBelt = yb / nb;
  // what it lies over, as triangles with how far each stands out: the body, the tights' shell under a tunic or trousers, the
  // skirt's shell, the belt. The arms (rest |x| past 0.25: the A-pose's arm from the deltoid out) and the neck and head above the
  // collar are not under it. Each triangle is read at 15 points across it, since its corners alone left a fifth of the angles bare
  // a tunic stands off the tights as makePerson pushes it, by the point's rest place (up to 3.5 cm over the chest), and 3 mm more
  const tunicOff = (x, y) => .016 + (Math.abs(x) < .2 ? .022 * Math.max(0, Math.min(1, (.46 - y) / .2)) * (1 - .8 * waistIn(D, y)) : 0);
  const lists = [[PACK.G['body'], 0]]; if (D.tunic || D.trousers) lists.push([PACK.G['helper-tights'], D.tunic ? tunicOff : .01]);
  // under a sash belt (Session 1019) the band is tucked: it reads neither belt, so it passes under them, and in the belt's band
  // (and 1.5 cm past either edge) it stands 1 mm clear of what is under it, not 7: over a short tunic skirt (2.5 cm off the tights)
  // that leaves it 1.5 mm under the sash belt (3 cm off)
  const tuck = !wrap && sashBeltOn(D), inBand = y => tuck && y > .07 && y < .24;
  if (D.skirt) lists.push([D.skirt === 'long' ? PACK.R.skirtLong : PACK.R.skirtShort, .025]); if (D.belt && !tuck) lists.push([PACK.R.belt, .032]);
  // the wrap (Session 1048), 17 cm wide over the shoulder, also reads the neck's base, 4 cm over the sash's limit, so its inner edge lies
  // over it, and the cap of the arm on the shoulder's side down to 11 cm under the neck's root, so its outer edge lies over that
  const capOf = v => wrap && Math.abs(R0[v * 3]) > .25 && Math.sign(R0[v * 3]) === side && PP[v * 3 + 1] > nY - .11;
  const ok = v => (Math.abs(R0[v * 3]) <= .25 || capOf(v)) && PP[v * 3 + 1] <= nY + (wrap ? .03 : -.01), SP = [];
  for (const [T, o] of lists) for (let t = 0; t < T.length; t += 3) { const A = T[t], B = T[t + 1], Cc = T[t + 2]; if (!ok(A) || !ok(B) || !ok(Cc)) continue;
    const ux = PP[B * 3] - PP[A * 3], uy = PP[B * 3 + 1] - PP[A * 3 + 1], uz = PP[B * 3 + 2] - PP[A * 3 + 2], vx = PP[Cc * 3] - PP[A * 3], vy = PP[Cc * 3 + 1] - PP[A * 3 + 1], vz = PP[Cc * 3 + 2] - PP[A * 3 + 2];
    let nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx; const nl = Math.hypot(nx, ny, nz) || 1; nx /= nl; ny /= nl; nz /= nl;
    for (let i = 0; i <= 4; i++) for (let j = 0; i + j <= 4; j++) { const wa = i / 4, wb = j / 4, wc = 1 - wa - wb; for (let k = 0; k < 3; k++) SP.push(PP[A * 3 + k] * wa + PP[B * 3 + k] * wb + PP[Cc * 3 + k] * wc);
      const ry = R0[A * 3 + 1] * wa + R0[B * 3 + 1] * wb + R0[Cc * 3 + 1] * wc; SP.push((typeof o === 'function' ? o(R0[A * 3] * wa + R0[B * 3] * wb + R0[Cc * 3] * wc, ry) : o) - (inBand(ry) ? .006 : 0), nx, ny, nz); } }
  const ST = 7, NP = SP.length / ST;
  // tucked, the sash belt is a ceiling the band (and its end) stays 1.5 mm under: its points, each with how far makePerson pushes it out
  const CPb = []; if (tuck) for (const [T, o] of [[PACK.R.sashBeltDrawn || (PACK.R.sashBeltDrawn = clip(PACK.R.sashBelt, PACK.rest, y => y > .085 && y < .225)), (x, y) => sashBeltPush(D, x, y)]])
    for (let t = 0; t < T.length; t += 3) { const A = T[t], B = T[t + 1], Cc = T[t + 2]; for (let i = 0; i <= 4; i++) for (let j = 0; i + j <= 4; j++) { const wa = i / 4, wb = j / 4, wc = 1 - wa - wb, X3 = [0, 1, 2].map(k => PP[A * 3 + k] * wa + PP[B * 3 + k] * wb + PP[Cc * 3 + k] * wc);
      CPb.push(X3, o(R0[A * 3] * wa + R0[B * 3] * wb + R0[Cc * 3] * wc, R0[A * 3 + 1] * wa + R0[B * 3 + 1] * wb + R0[Cc * 3 + 1] * wc)); } }
  // the shoulder's top, 11 cm out from the neck's line, and the other hip, 9 cm under the belt, just outside the body's side
  let hx = 0; for (let q = 0; q < NP; q++) if (SP[q * ST + 3] === 0 && Math.abs(SP[q * ST + 1] - (yBelt - .09)) < .02) hx = Math.max(hx, -side * (SP[q * ST] - cx));
  const S = new THREE.Vector3(cx + side * (wrap ? .155 : .11), nY - .02, cz), H = new THREE.Vector3(cx - side * (hx + .01), yBelt - .09, cz), C = S.clone().add(H).multiplyScalar(.5);
  const a = S.clone().sub(H).normalize(), e = new THREE.Vector3(0, 0, 1).addScaledVector(a, -a.z).normalize(), N = a.clone().cross(e).normalize();
  // the loop turns at the hip: nothing past it along the band's line is read (the thigh below went on down that line, and the band
  // bellied out round it)
  const uH = H.clone().sub(C).dot(a) - .01;
  const W = .09, NT = 144, NS = 5, tol = .006, M = new Float32Array(NT * NS);
  const sOf = k => (k / (NS - 1) - .5) * W, bin = th => ((Math.round(th / (2 * Math.PI) * NT) % NT) + NT) % NT;
  const d = new THREE.Vector3(); let pts = 0;
  for (let q = 0; q < NP; q++) { const b = q * ST; d.set(SP[b] - C.x, SP[b + 1] - C.y, SP[b + 2] - C.z); if (d.x * SP[b + 4] + d.y * SP[b + 5] + d.z * SP[b + 6] < 0) { SP[b + 4] *= -1; SP[b + 5] *= -1; SP[b + 6] *= -1; }
    const sn = d.dot(N); if (Math.abs(sn) > W / 2 + tol) continue;
    const u = d.dot(a), v = d.dot(e), r = Math.hypot(u, v) + SP[b + 3], t = bin(Math.atan2(v, u)); if (u < uH) continue; pts++;
    for (let k = 0; k < NS; k++) if (Math.abs(sn - sOf(k)) < tol + W / (NS - 1) / 2) { const o = t * NS + k; if (r > M[o]) M[o] = r; } }
  // an angle where nothing was read (none should be, round a torso) takes the nearer of its read neighbours
  let empty = 0; for (let k = 0; k < NS; k++) for (let t = 0; t < NT; t++) if (!M[t * NS + k]) { empty++; for (let dt = 1; dt < NT / 2; dt++) { const r = Math.max(M[((t + dt) % NT) * NS + k], M[((t - dt + NT) % NT) * NS + k]); if (r) { M[t * NS + k] = r; break; } } }
  // the floor: the furthest of the neighbouring angles (two bins each way) and rows, so the band never dips between points
  const F = new Float32Array(M.length); for (let t = 0; t < NT; t++) for (let k = 0; k < NS; k++) { let m = 0; for (let dt = -2; dt <= 2; dt++) for (let dk = -1; dk <= 1; dk++) { const kk = k + dk; if (kk < 0 || kk >= NS) continue; m = Math.max(m, M[((t + dt + NT) % NT) * NS + kk]); } F[t * NS + k] = m; }
  // the band's radius: the floor and 7 mm, then smoothed round the loop and across, never in past the floor
  // the wrap stands 9 mm clear, its rows being 1.25 cm apart where it is widest
  const clr = wrap ? .009 : .007, Rr = Float32Array.from(F, f => f + clr);
  for (let it = 0; it < 6; it++) { const p = Rr.slice(); for (let t = 0; t < NT; t++) for (let k = 0; k < NS; k++) { const o = t * NS + k, l = ((t + NT - 1) % NT) * NS + k, r = ((t + 1) % NT) * NS + k;
    const acr = (p[t * NS + Math.max(0, k - 1)] + p[t * NS + Math.min(NS - 1, k + 1)]) / 2; Rr[o] = Math.max(F[o] + clr, (p[l] + 2 * p[o] + p[r]) / 4 * .7 + acr * .3); } }
  // the planar loop gives the centre line only. Its width is laid across the body's surface there (the surface's normal crossed
  // with the line), not across the loop's plane: at the hip's side the plane stands edge-on to the body, and a band laid in it
  // went into the hip on one edge and stood off on the other. Each of five rows across is then set on its own line out along the
  // surface's normal, 7 mm clear of the furthest point within 1.2 cm of that line (a dip of up to 2 cm in to meet a curving body)
  const cell = .02, grid = new Map(), key = (x, y, z) => (Math.floor(x / cell) + 512) * 1048576 + (Math.floor(y / cell) + 512) * 1024 + (Math.floor(z / cell) + 512);
  for (let q = 0; q < NP; q++) { const b = q * ST; d.set(SP[b] - C.x, SP[b + 1] - C.y, SP[b + 2] - C.z); if (d.dot(a) < uH) continue; const k = key(SP[b], SP[b + 1], SP[b + 2]); let L = grid.get(k); if (!L) grid.set(k, L = []); L.push(q); }
  const near = (p, R, f, Gd = grid) => { const r = Math.ceil(R / cell); const ix = Math.floor(p.x / cell), iy = Math.floor(p.y / cell), iz = Math.floor(p.z / cell);
    for (let x = ix - r; x <= ix + r; x++) for (let y = iy - r; y <= iy + r; y++) for (let z = iz - r; z <= iz + r; z++) { const L = Gd.get((x + 512) * 1048576 + (y + 512) * 1024 + (z + 512)); if (L) for (const q of L) f(q); } };
  const P0 = [], NS0 = [], T0 = [], A0 = [];
  for (let t = 0; t < NT; t++) { const th = t / NT * 2 * Math.PI, r = Rr[t * NS + (NS >> 1)]; P0.push(C.clone().addScaledVector(a, Math.cos(th) * r).addScaledVector(e, Math.sin(th) * r)); }
  for (let t = 0; t < NT; t++) { const p = P0[t], n0 = new THREE.Vector3(); near(p, .03, q => { const b = q * ST, w = .03 - Math.hypot(SP[b] - p.x, SP[b + 1] - p.y, SP[b + 2] - p.z); if (w > 0) n0.x += SP[b + 4] * w, n0.y += SP[b + 5] * w, n0.z += SP[b + 6] * w; });
    if (n0.lengthSq() < 1e-12) n0.copy(p).sub(C); NS0.push(n0.normalize()); T0.push(P0[(t + 1) % NT].clone().sub(P0[(t + NT - 1) % NT]).normalize()); }
  // the surface's normal smoothed round the loop (it is read off a few triangles), then the width across it
  for (let it = 0; it < 4; it++) { const pn = NS0.map(v => v.clone()); for (let t = 0; t < NT; t++) NS0[t].copy(pn[(t + NT - 1) % NT]).add(pn[t]).add(pn[t]).add(pn[(t + 1) % NT]).normalize(); }
  for (let t = 0; t < NT; t++) { const A = NS0[t].clone().cross(T0[t]).normalize(); if (A.dot(N) < 0) A.negate(); A0.push(A); NS0[t] = T0[t].clone().cross(A).normalize().multiplyScalar(NS0[t].dot(T0[t].clone().cross(A)) < 0 ? -1 : 1); }
  // the width round the loop: the sash's 9 cm all round; the wrap's by how high the point sits between the hip and the shoulder
  const ss = (a, b, x) => { const f = Math.max(0, Math.min(1, (x - a) / (b - a))); return f * f * (3 - 2 * f); }, NS2 = wrap ? 25 : NS, Wt = new Float32Array(NT).fill(W);
  if (wrap) { for (let t = 0; t < NT; t++) { const hf = (P0[t].y - H.y) / (S.y - H.y); Wt[t] = .13 + .17 * ss(.02, .38, hf) - .13 * ss(.72, .98, hf); }
    for (let it = 0; it < 8; it++) { const p = Wt.slice(); for (let t = 0; t < NT; t++) Wt[t] = (p[(t + NT - 1) % NT] + 2 * p[t] + p[(t + 1) % NT]) / 4; } }
  const sOf2 = (t, k) => (k / (NS2 - 1) - .5) * Wt[t];
  // the wrap looks 11 cm under each row, not 5: over hair down the back its loop's middle line stands well out, and a row at its edge
  // must still find the tunic under it
  const RH = new Float32Array(NT * NS2), need = new Float32Array(NT * NS2).fill(-9), rho = .012, Q = new THREE.Vector3(), look = wrap ? .12 : .06;
  for (let t = 0; t < NT; t++) for (let k = 0; k < NS2; k++) { Q.copy(P0[t]).addScaledVector(A0[t], sOf2(t, k)); const Nn = NS0[t]; let h = -9;
    near(Q, look, q => { const b = q * ST, dx = SP[b] - Q.x, dy = SP[b + 1] - Q.y, dz = SP[b + 2] - Q.z, along = dx * Nn.x + dy * Nn.y + dz * Nn.z; if (along < -look + .01) return;
      const perp = Math.hypot(dx - Nn.x * along, dy - Nn.y * along, dz - Nn.z * along); if (perp < rho) h = Math.max(h, along + SP[b + 3]); });
    need[t * NS2 + k] = h > -8 ? h + clr : -9; RH[t * NS2 + k] = h > -8 ? Math.max(-.02, h + clr) : 0; }
  // smoothed round the loop and across, never in past what it must clear
  for (let it = 0; it < 6; it++) { const p = RH.slice(); for (let t = 0; t < NT; t++) for (let k = 0; k < NS2; k++) { const o = t * NS2 + k, l = ((t + NT - 1) % NT) * NS2 + k, r = ((t + 1) % NT) * NS2 + k, acr = (p[t * NS2 + Math.max(0, k - 1)] + p[t * NS2 + Math.min(NS2 - 1, k + 1)]) / 2;
    RH[o] = Math.max(need[o], (p[l] + 2 * p[o] + p[r]) / 4 * .7 + acr * .3); } }
  // the wrap's folds: five along its length, a rise of up to 9 mm where it is gathered and 5 mm where it spreads, nothing at its edges
  const NF = 5, fold = (tt, s) => { if (!wrap) return 0; const u = s / Wt[tt] + .5; return (.004 + .003 * (1 - ss(.17, .28, Wt[tt]))) * (.5 - .5 * Math.cos(2 * Math.PI * NF * u)); };
  const vert = (t, s) => { const tt = ((t % NT) + NT) % NT, kf = Math.max(0, Math.min(NS2 - 1, (s / Wt[tt] + .5) * (NS2 - 1))), k0 = Math.min(NS2 - 2, Math.floor(kf)), f = kf - k0, h = RH[tt * NS2 + k0] * (1 - f) + RH[tt * NS2 + k0 + 1] * f + fold(tt, s);
    return P0[tt].clone().addScaledVector(A0[tt], s).addScaledVector(NS0[tt], h); };
  // three strips across: a border, the field, a border
  const pos = [], col = [], idx = [], field = sRGB(...(wrap ? D.shoulderWrap : D.sash)), edge = sRGB(...(wrap ? D.shoulderWrap : D.sashBorder || [.86, .78, .6]));
  const strip = (s0, s1, c) => { const base = pos.length / 3; for (let t = 0; t <= NT; t++) for (const s of [s0, s1]) { const q = vert(t, s); pos.push(q.x, q.y, q.z); col.push(c.r, c.g, c.b); }
    for (let t = 0; t < NT; t++) { const i = base + t * 2; idx.push(i, i + 1, i + 2, i + 2, i + 1, i + 3); } };
  // the print (Session 990, OG-056's block-printed sashes): down the middle of the field, a row of blocks in the border's colour,
  // two steps of the loop (2.5 cm) long with two between, each its own quads so its edges stay sharp
  const blocks = (s0, s1) => { for (let t = 0; t < NT; t++) { if (t % 4 > 1) continue; const base = pos.length / 3; for (const tt of [t, t + 1]) for (const s of [s0, s1]) { const q = vert(tt, s).addScaledVector(NS0[tt % NT], .0008); pos.push(q.x, q.y, q.z); col.push(edge.r, edge.g, edge.b); }
    idx.push(base, base + 1, base + 2, base + 2, base + 1, base + 3); } };
  // the wrap: one sheet of 40 columns across, each fold's crease shaded darker and its ridge lighter, and a rolled hem 1 cm in from either edge a shade darker
  const WN = [], sheet = () => { const NC = 40, base = pos.length / 3; for (let t = 0; t <= NT; t++) { const tt = t % NT; for (let c = 0; c <= NC; c++) { const u = c / NC, q = vert(t, (u - .5) * Wt[tt]); pos.push(q.x, q.y, q.z); WN.push(NS0[tt]);
      const ridge = .5 - .5 * Math.cos(2 * Math.PI * NF * u), hem = (u * Wt[tt] < .01 || (1 - u) * Wt[tt] < .01) ? .78 : 1, k = (.74 + .36 * ridge) * hem; col.push(field.r * k, field.g * k, field.b * k); } }
    // wound so its faces look out along the surface's normal (the material's shading reads the face's own normal)
    const i0 = base + (NT >> 1) * (NC + 1) + (NC >> 1), V = k => new THREE.Vector3(pos[k * 3], pos[k * 3 + 1], pos[k * 3 + 2]), fn = V(i0 + 1).sub(V(i0)).cross(V(i0 + NC + 1).sub(V(i0))), out = fn.dot(WN[i0 - base]) > 0;
    for (let t = 0; t < NT; t++) for (let c = 0; c < NC; c++) { const i = base + t * (NC + 1) + c, j = i + NC + 1; if (out) idx.push(i, i + 1, j, j, i + 1, j + 1); else idx.push(i, j, i + 1, i + 1, j, j + 1); } };
  const bw = .014, mw = .011; if (wrap) sheet(); else { strip(-W / 2, -W / 2 + bw, edge); strip(-W / 2 + bw, W / 2 - bw, field); strip(W / 2 - bw, W / 2, edge); if (D.sashPrint !== false) blocks(-mw, mw); }
  const bandTris = idx.length / 3;
  // the knot and its two hanging ends (Session 996, OG-056's sashes knotted at the hip): the knot sits on the band where it turns,
  // a little to the front of the hip's side, and the two ends hang straight down from under it, pushed out only where what they
  // hang over (the thigh, the tunic's skirt, a long skirt) stands further out than the line above. They read everything the
  // band does, the thigh below the hip included, which the loop leaves out
  // under a sash belt (Session 1019) there is no knot: one end comes out from under the belt's lower edge in front of the hip, where
  // the band goes in under it, and hangs 26 cm (Session 1010 had left the knot off and the band over the belt)
  let knot = null; if (!wrap && D.sashKnot !== false) {
    const gridAll = new Map(); for (let q = 0; q < NP; q++) { const b = q * ST, k = key(SP[b], SP[b + 1], SP[b + 2]); let L = gridAll.get(k); if (!L) gridAll.set(k, L = []); L.push(q); }
    // the turn: the loop's lowest point, then 15 cm round it toward the front
    let tl = 0; for (let t = 1; t < NT; t++) if (P0[t].y < P0[tl].y) tl = t; const dir = P0[(tl + 3) % NT].z > P0[(tl + NT - 3) % NT].z ? 1 : -1;
    let tk = tl, run = 0; while (run < .15) { const nx = (tk + dir + NT) % NT; run += P0[tk].distanceTo(P0[nx]); tk = nx; }
    // tucked: from the turn toward the front until the band is 2.5 cm up under the sash belt's lower edge
    let bandLo = 0; if (tuck) { let nb = 0; for (const v of new Set(PACK.R.sashBelt)) if (R0[v * 3 + 1] > .083 && R0[v * 3 + 1] < .09) { bandLo += PP[v * 3 + 1]; nb++; } bandLo /= nb || 1;
      tk = tl; for (let i = 0; i < NT / 4 && P0[tk].y < bandLo + .025; i++) tk = (tk + dir + NT) % NT; }
    const Pk = vert(tk, 0), On = NS0[tk].clone(), O = On.clone().setY(0).normalize(), X = new THREE.Vector3(0, 1, 0).cross(O).normalize(), At = A0[tk], Tt = T0[tk];
    // the band's own points near the knot, which the ends come out from under and hang over
    const BP = []; for (let i = 0; i < pos.length; i += 3) if (Math.hypot(pos[i] - Pk.x, pos[i + 1] - Pk.y, pos[i + 2] - Pk.z) < .14) BP.push(pos[i], pos[i + 1], pos[i + 2]);
    // the knot: a lump 8 cm across the band, 6.8 along it and 4.4 deep, its inner face on the band, bound round its middle in the border's colour
    const kr = tuck ? [.001, .001, .001] : [.04, .034, .022], kc = Pk.clone().addScaledVector(On, kr[2] + .003), KS = 14, KR = tuck ? -1 : 10, kb = pos.length / 3;
    for (let i = 0; i <= KR; i++) { const ph = i / KR * Math.PI; for (let j = 0; j <= KS; j++) { const th = j / KS * 2 * Math.PI, lx = Math.sin(ph) * Math.cos(th), ly = Math.cos(ph), lz = Math.sin(ph) * Math.sin(th);
      const lump = 1 + .14 * Math.sin(3 * th + 1.3) * Math.sin(ph) + .08 * Math.cos(2 * ph), q2 = kc.clone().addScaledVector(At, lx * kr[0] * lump).addScaledVector(Tt, ly * kr[1] * lump).addScaledVector(On, lz * kr[2] * lump);
      pos.push(q2.x, q2.y, q2.z); const c = Math.abs(ly) < .22 ? edge : field; col.push(c.r, c.g, c.b); } }
    for (let i = 0; i < KR; i++) for (let j = 0; j < KS; j++) { const a0 = kb + i * (KS + 1) + j, b0 = a0 + KS + 1; idx.push(a0, b0, a0 + 1, a0 + 1, b0, b0 + 1); }
    // an end: rows 1.5 cm apart down from under the knot (each clear of what is under it there and half a row up), five lines across; each line's offset out along O never comes back in
    const need = (Q, extra) => { let h = -9; near(Q, .05, q => { const b = q * ST, dx = SP[b] - Q.x, dy = SP[b + 1] - Q.y, dz = SP[b + 2] - Q.z, along = dx * O.x + dy * O.y + dz * O.z; if (along < -.06) return;
      if (Math.hypot(dx - O.x * along, dy - O.y * along, dz - O.z * along) < .012) h = Math.max(h, along + SP[b + 3]); }, gridAll);
      for (let i = 0; i < BP.length; i += 3) { const dx = BP[i] - Q.x, dy = BP[i + 1] - Q.y, dz = BP[i + 2] - Q.z, along = dx * O.x + dy * O.y + dz * O.z; if (Math.hypot(dx - O.x * along, dy - O.y * along, dz - O.z * along) < .014) h = Math.max(h, along + .002 - clr); }
      return h > -8 ? h + clr + extra : -9; };
    const ends = [], step = .015, NK = 5;
    const end = (len, s0, splay, w0, w1, h0, under) => { const nr = Math.round(len / step), H2 = [];
      for (let j = 0; j <= nr; j++) { const f = j / nr, w = w0 + (w1 - w0) * Math.min(1, f * 3), cs = s0 + splay * f, row = [];
        for (let k = 0; k < NK; k++) { const s = cs + (k / (NK - 1) - .5) * w, Q = Pk.clone().addScaledVector(X, s).add(new THREE.Vector3(0, -.012 - j * step, 0));
          let h = Math.max(j ? H2[j - 1].h[k] : h0, need(Q, 0), j ? need(Q.clone().add(new THREE.Vector3(0, step / 2, 0)), 0) : -9); if (under) h = Math.max(h, under(j, s) + .006); row.push(h); }
        H2.push({ cs, w, h: row }); }
      // smoothed across each row, never in past the line above or what it hangs over
      const at = (j, s) => { const r = H2[Math.max(0, Math.min(nr, j))], kf = (Math.max(-1, Math.min(1, (s - r.cs) / (r.w / 2))) + 1) / 2 * (NK - 1), k0 = Math.min(NK - 2, Math.floor(kf)), f = kf - k0; return r.h[k0] * (1 - f) + r.h[k0 + 1] * f; };
      const P = (j, u) => { const r = H2[j], s = r.cs + u * r.w / 2; return Pk.clone().addScaledVector(X, s).add(new THREE.Vector3(0, -.012 - j * step, 0)).addScaledVector(O, at(j, s)); };
      const band = (u0, u1, c, j0 = 0, j1 = nr) => { const base = pos.length / 3; for (let j = j0; j <= j1; j++) for (const u of [u0, u1]) { const q2 = P(j, u); pos.push(q2.x, q2.y, q2.z); col.push(c.r, c.g, c.b); }
        for (let j = 0; j < j1 - j0; j++) { const i = base + j * 2; idx.push(i, i + 1, i + 2, i + 2, i + 1, i + 3); } };
      const bu = bw / ((w0 + w1) / 2) * 2; band(-1, -1 + bu, edge); band(-1 + bu, 1 - bu, field, 0, nr - 1); band(-1 + bu, 1 - bu, edge, nr - 1, nr); band(1 - bu, 1, edge);
      const e = { nr, H2, at, P, len }; ends.push(e); return e; };
    // the longer end behind, the shorter over it, 3 cm apart at the knot and parting as they fall
    // (the longer drifts in toward the body's middle and the shorter barely out, so neither swings into the hand hanging at the side)
    const m = Math.sign((cx - Pk.x) * X.x + (cz - Pk.z) * X.z) || 1, e1 = tuck ? end(.26, 0, m * .012, .05, .07, .003) : end(.32, m * .008, m * .022, .05, .072, .004);
    if (!tuck) end(.25, -m * .016, -m * .006, .046, .066, .01, (j, s) => { const r = e1.H2[Math.min(e1.nr, j)]; return Math.abs(s - r.cs) < r.w / 2 + .02 ? e1.at(j, s) : -9; });
    knot = { kc, kr, At, Tt, On, O, ends, tuck };
  }
  // tucked: in a radial map of the sash belt round the waist's middle (its points pushed out level from there, in 72 directions and
  // 1 cm bands, the nearest in each), every point of the sash within the belt's height is drawn in to 1.5 mm inside it, easing off
  // over 4 cm past its top and bottom edges
  let tuckPulled = 0; if (tuck && CPb.length) { let bx = 0, bz = 0, yb0 = 9, yb1 = -9; const nb = CPb.length / 2; for (let i = 0; i < CPb.length; i += 2) { bx += CPb[i][0] / nb; bz += CPb[i][2] / nb; }
    const NAb = 72, BP3 = []; for (let i = 0; i < CPb.length; i += 2) { const [x, y, z] = CPb[i], r = Math.hypot(x - bx, z - bz), f = (r + CPb[i + 1]) / r; BP3.push(bx + (x - bx) * f, y, bz + (z - bz) * f); yb0 = Math.min(yb0, y); yb1 = Math.max(yb1, y); }
    const NYb = Math.ceil((yb1 - yb0) / .01) + 1, BR = new Float32Array(NAb * NYb).fill(9), ab = (x, z) => ((Math.round(Math.atan2(x - bx, z - bz) / (2 * Math.PI) * NAb) % NAb) + NAb) % NAb, ybn = y => Math.max(0, Math.min(NYb - 1, Math.floor((y - yb0) / .01)));
    for (let i = 0; i < BP3.length; i += 3) { const k = ybn(BP3[i + 1]) * NAb + ab(BP3[i], BP3[i + 2]); BR[k] = Math.min(BR[k], Math.hypot(BP3[i] - bx, BP3[i + 2] - bz)); }
    const lim = (x, y, z) => { let m = 9; const a0 = ab(x, z), b0 = ybn(y); for (let da = -2; da <= 2; da++) for (let db = -1; db <= 1; db++) { const bb = b0 + db; if (bb >= 0 && bb < NYb) m = Math.min(m, BR[bb * NAb + (a0 + da + NAb) % NAb]); } return m; };
    for (let i = 0; i < pos.length; i += 3) { const x = pos[i], y = pos[i + 1], z = pos[i + 2], out = y < yb0 ? yb0 - y : y > yb1 ? y - yb1 : 0; if (out >= .04) continue; const L = lim(x, Math.max(yb0, Math.min(yb1, y)), z); if (L > 8) continue;
      const r = Math.hypot(x - bx, z - bz), want = L - .0015; if (r <= want) continue; const e = 1 - out / .04, nr = r + (want - r) * e * e * (3 - 2 * e), f = nr / r; pos[i] = bx + (x - bx) * f; pos[i + 2] = bz + (z - bz) * f; tuckPulled++; } }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('aBase', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3)); g.setIndex(idx); g.computeVertexNormals();
  const m = clothMat(new THREE.Color(1, 1, 1), 'wool', { side: THREE.DoubleSide, scale: 30 }); m.vertexColors = true; const mesh = new THREE.Mesh(g, m); mesh.name = wrap ? 'shoulderWrap' : 'sash'; mesh.castShadow = mesh.receiveShadow = true; mesh.frustumCulled = false;
  // nothing it lies over comes out through it: at four times the band's own points (half steps round and across), every point
  // within 1 cm of the line out from it along the surface's normal, and within 5 cm of it, lies 3 mm or more under the band
  let tested = 0, out = 0, worst = -1; const seen = new Uint8Array(NP);
  for (let t2 = 0; t2 < NT * 2; t2++) for (let k2 = 0; k2 <= 2 * (NS2 - 1); k2++) { const t = t2 / 2, t0 = Math.floor(t), s = (k2 / (2 * (NS2 - 1)) - .5) * Wt[t0 % NT] * .98, V = t === t0 ? vert(t0, s) : vert(t0, s).add(vert(t0 + 1, s)).multiplyScalar(.5), Nn = NS0[t0 % NT];
    near(V, .05, q => { const b = q * ST, dx = SP[b] - V.x, dy = SP[b + 1] - V.y, dz = SP[b + 2] - V.z, along = dx * Nn.x + dy * Nn.y + dz * Nn.z; if (along < -.05) return;
      if (Math.hypot(dx - Nn.x * along, dy - Nn.y * along, dz - Nn.z * along) > .01) return; const gap = along + SP[b + 3]; if (!seen[q]) { seen[q] = 1; tested++; } worst = Math.max(worst, gap); if (gap > -.003 && seen[q] === 1) { seen[q] = 2; out++; } }); }
  // the arms are not under it, but must not pass through it either: a point of an arm within 1.2 cm of the line out from the band
  // and from 4 cm under it to 6 mm over it is through (makePerson lifts the arm at the hip until none is)
  // the wrap (Session 1048) is also tested against the neck above what it reads: a point of it within
  // 1.2 cm of the line and from 4 cm under to 6 mm over is through. The arm on the shoulder's side is counted apart (armUp): lifting
  // the hip's arm cannot clear it. Where the wrap's edge bridges the armpit it stands up to 4 cm off that arm, which is under it, not
  // through it: there only a point within 2.5 cm under it is counted
  const arm = []; for (const v of PACK.G['body']) if ((Math.abs(R0[v * 3]) > .25 && !capOf(v) || (wrap && PP[v * 3 + 1] > nY + .03)) && !arm.includes(v)) arm.push(v); let armIn = 0, armUp = 0, neckIn = 0; const inArm = new Uint8Array(n);
  for (let t2 = 0; t2 < NT * 2; t2++) for (let k2 = 0; k2 <= 2 * (NS2 - 1); k2++) { const t = t2 / 2, t0 = Math.floor(t), s = (k2 / (2 * (NS2 - 1)) - .5) * Wt[t0 % NT], V = t === t0 ? vert(t0, s) : vert(t0, s).add(vert(t0 + 1, s)).multiplyScalar(.5), Nn = NS0[t0 % NT];
    for (const v of arm) { const dx = PP[v * 3] - V.x, dy = PP[v * 3 + 1] - V.y, dz = PP[v * 3 + 2] - V.z; if (Math.abs(dx) > .05 || Math.abs(dy) > .05 || Math.abs(dz) > .05) continue; const along = dx * Nn.x + dy * Nn.y + dz * Nn.z;
      if (along < -.04 || along > .006 || Math.hypot(dx - Nn.x * along, dy - Nn.y * along, dz - Nn.z * along) > .012) continue; if (!inArm[v]) { inArm[v] = 1; if (Math.abs(R0[v * 3]) <= .25) neckIn++; else if (Math.sign(R0[v * 3]) === side) { if (along > -.025) armUp++; else inArm[v] = 0; } else armIn++; } } }
  // the knot and the ends (Session 996): nothing comes out through the knot (a point of what it lies over, pushed out by its own
  // stand-off, inside the lump), nor through an end (as the band is read, along O at every half row and half line across), and no
  // point of an arm is in the knot or within 1.2 cm of an end's line and from 4 cm under it to 6 mm over it
  let kn = null; if (knot) { const { kc, kr, At, Tt, On, O, ends } = knot, inK = (x, y, z, pad) => { const dx = x - kc.x, dy = y - kc.y, dz = z - kc.z;
      return ((dx * At.x + dy * At.y + dz * At.z) / (kr[0] * .88 + pad)) ** 2 + ((dx * Tt.x + dy * Tt.y + dz * Tt.z) / (kr[1] * .88 + pad)) ** 2 + ((dx * On.x + dy * On.y + dz * On.z) / (kr[2] * .88 + pad)) ** 2 < 1; };
    let knotOut = 0, endTested = 0, endOut = 0, endWorst = -1, endArm = 0, lowest = 9, spread = 0; const sn2 = new Uint8Array(NP), an2 = new Uint8Array(n);
    for (let q = 0; q < NP; q++) { const b = q * ST; if (inK(SP[b] + SP[b + 4] * SP[b + 3], SP[b + 1] + SP[b + 5] * SP[b + 3], SP[b + 2] + SP[b + 6] * SP[b + 3], 0)) knotOut++; }
    for (const v of arm) if (inK(PP[v * 3], PP[v * 3 + 1], PP[v * 3 + 2], .004) && !an2[v]) { an2[v] = 1; endArm++; }
    for (const e of ends) for (let j2 = 0; j2 <= 2 * e.nr; j2++) for (let u2 = -4; u2 <= 4; u2++) { const j = j2 >> 1, V = j2 & 1 ? e.P(j, u2 / 4).add(e.P(j + 1, u2 / 4)).multiplyScalar(.5) : e.P(j, u2 / 4); lowest = Math.min(lowest, V.y);
      for (let q = 0; q < NP; q++) { const b = q * ST, dx = SP[b] - V.x, dy = SP[b + 1] - V.y, dz = SP[b + 2] - V.z; if (Math.abs(dx) > .05 || Math.abs(dy) > .05 || Math.abs(dz) > .05) continue; const along = dx * O.x + dy * O.y + dz * O.z; if (along < -.05) continue;
        if (Math.hypot(dx - O.x * along, dy - O.y * along, dz - O.z * along) > .01) continue; const gap = along + SP[b + 3]; if (!sn2[q]) { sn2[q] = 1; endTested++; } endWorst = Math.max(endWorst, gap); if (gap > -.003 && sn2[q] === 1) { sn2[q] = 2; endOut++; } }
      for (const v of arm) { const dx = PP[v * 3] - V.x, dy = PP[v * 3 + 1] - V.y, dz = PP[v * 3 + 2] - V.z; if (Math.abs(dx) > .05 || Math.abs(dy) > .05 || Math.abs(dz) > .05) continue; const along = dx * O.x + dy * O.y + dz * O.z;
        if (along < -.04 || along > .006 || Math.hypot(dx - O.x * along, dy - O.y * along, dz - O.z * along) > .012) continue; if (!an2[v]) { an2[v] = 1; endArm++; } } }
    if (ends[1]) { const a = ends[0].P(ends[0].nr, 0), b = ends[1].P(ends[1].nr, 0); spread = Math.hypot(a.x - b.x, a.z - b.z); }
    kn = { knotOut, endTested, endOut, endWorst: +endWorst.toFixed(4), endArm, ends: ends.map(e => e.len), drop: +(kc.y - lowest).toFixed(3), spread: +spread.toFixed(3), knotY: +kc.y.toFixed(3), beltY: +yBelt.toFixed(3), tucked: knot.tuck }; }
  // the loop's length, and how high the shoulder's crossing sits over the hip's
  let len = 0; for (let t = 0; t < NT; t++) len += vert(t, 0).distanceTo(vert(t + 1, 0));
    // hair under the wrap (Session 1048), which is not read (a braid's rope hanging off the back drove the band in at the hip, and loose
  // hair made it follow every lock): a triangle of the hair's cards, a tail, a braid's locks, its ties and brush, with a corner under the wrap's sheet (within 1.5 cm of a point of it across,
  // and less than 4 mm out from it along its normal) is taken out of the hair, so the hair goes in under the wrap and comes out below
  // it, and a lock standing out over the wrap stays over it. The cards' triangles are read posed, and the cut is made on their index,
  // once, by makePerson, on the wrap it keeps (cutHair)
  const cutHair = () => { let hairUnder = 0; if (wrap && o.meshes) { const wg = new Map(); for (let i = 0; i < pos.length / 3; i++) { const k = key(pos[i * 3], pos[i * 3 + 1], pos[i * 3 + 2]); let L = wg.get(k); if (!L) wg.set(k, L = []); L.push(i); }
    for (const m of o.meshes) if (/^(hair|tail|braid\d|tie|brush)$/.test(m.name)) { const X = posedOf(m), ix = m.geometry.index.array, under = new Uint8Array(X.length / 3), P3 = new THREE.Vector3();
      for (let v = 0; v < under.length; v++) { if (X[v * 3 + 1] > nY) continue; P3.set(X[v * 3], X[v * 3 + 1], X[v * 3 + 2]); let best = 9, bi = -1;
        near(P3, .02, i => { const dd = Math.hypot(pos[i * 3] - P3.x, pos[i * 3 + 1] - P3.y, pos[i * 3 + 2] - P3.z); if (dd < best) { best = dd; bi = i; } }, wg);
        if (bi < 0) continue; const Nw = WN[bi], dx = P3.x - pos[bi * 3], dy = P3.y - pos[bi * 3 + 1], dz = P3.z - pos[bi * 3 + 2], along = dx * Nw.x + dy * Nw.y + dz * Nw.z;
        if (along < .004 && Math.hypot(dx - Nw.x * along, dy - Nw.y * along, dz - Nw.z * along) < .015) under[v] = 1; }
      const keep = []; for (let t = 0; t < ix.length; t += 3) { if (under[ix[t]] || under[ix[t + 1]] || under[ix[t + 2]]) { hairUnder++; continue; } keep.push(ix[t], ix[t + 1], ix[t + 2]); }
      if (hairUnder) m.geometry.setIndex(keep); } } return hairUnder; };
  let wMin = 9, wMax = 0; for (const w of Wt) { wMin = Math.min(wMin, w); wMax = Math.max(wMax, w); }
  return { mesh, cutHair, stats: { width: W, wMin: +wMin.toFixed(3), wMax: +wMax.toFixed(3), wTop: +Wt[P0.reduce((b, p, t) => p.y > P0[b].y ? t : b, 0)].toFixed(3), length: +len.toFixed(3), drop: +(S.y - H.y).toFixed(3), side: side > 0 ? 'L' : 'R', tris: idx.length / 3, bandTris, read: pts, empty, tested, out, worst: +worst.toFixed(4), armIn, armUp, neckIn, knot: kn, tuckPulled } };
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

// ── the Aurennais' head-wrap (Session 994, L1; OG-044 and OG-056: head-wraps in saffron, red and teal, wound round) ──
// Cloth wound round the head over the tucked hair. Its crown is the kettle helm's fitted dome (headDome) with 1.6 cm of cloth in
// place of 1.2 of iron, and its edge runs across the forehead about 2 cm over the brows, over the tops of the ears and down at the nape,
// where it gathers the hair. Round its lower half lie five wound turns, each a roll of the cloth that runs higher at the front or at
// the back than the one under it, so they cross over the brow and at the nape as a wrap's turns do. The lowest turn, along the edge,
// takes the border's colour when there is one. Rigid, carried by the head bone as the helm is.
// The Gatelanders' headscarf (Session 1029, L1; OG-048's woman in a patterned headscarf, OG-059's headscarves on women) is the same
// cloth tied another way (D.scarf): a kerchief folded corner to corner, its fold across the head 3 cm behind the hairline so the front
// hair shows, over the tops of the ears and down to the nape, where its two corners are knotted over the third, which hangs down the
// back (buildWrapTail). One folded edge in place of the five turns, and the cloth block-printed with sprigs when D.scarfPrint is set
function buildWrap(P, G, heads, byName, hairPts = [], browTop = -9) {
  const R0 = PACK.rest, D = G.dress, hv = PACK.headV || (PACK.headV = [...new Set(PACK.G['body'])].filter(i => R0[i * 3 + 1] > .6)), V = i => new THREE.Vector3(P[i * 3], P[i * 3 + 1], P[i * 3 + 2]);
  let by = 0, bn = 0; for (const i of hv) if (Math.abs(R0[i * 3]) < .05 && R0[i * 3 + 2] > .08 && R0[i * 3 + 1] > .785 && R0[i * 3 + 1] < .8) { by += P[i * 3 + 1]; bn++; } by /= bn;
  const bb = new THREE.Box3(); for (const i of hv) if (R0[i * 3 + 1] > .755) bb.expandByPoint(V(i));
  const sc = !!D.scarf, c = bb.getCenter(new THREE.Vector3()), CL = sc ? .012 : .016, rimY = sc ? th => by - .01 - .04 * Math.sin(th) ** 2 - .12 * Math.max(0, -Math.cos(th)) ** 1.5 : th => by - .012 - .025 * Math.sin(th) ** 2 - .11 * Math.max(0, -Math.cos(th)) ** 1.5; c.y = by - .07;
  const { NT, R, at: at0, phRim, thOf, under } = headDome(P, hv, c, rimY, hairPts, CL), TAU = Math.PI * 2;
  // the taller turban (Session 1017, L1; OG-044's and OG-093's men): the same dome, raised and swelled, and five more turns wound up it.
  // Above the brow line the dome is stretched up by 0.8, and from 2 cm over the edge it stands out from the centre, by 15 per cent at 8 cm; both only move the cloth outward, so the head and the hair stay under it, and the edge itself is not moved
  const tb = !!D.turban && !sc, yS = by - .01, at = !tb ? at0 : (th, ph, off = 0) => { const p = at0(th, ph, off), h = Math.max(0, Math.min(1, (p.y - rimY(th) - .02) / .06)), s = 1 + .15 * h * h * (3 - 2 * h);
    p.x = c.x + (p.x - c.x) * s; p.z = c.z + (p.z - c.z) * s; if (p.y > yS) p.y = yS + (p.y - yS) * 1.8; return p; };
  const topY = at(0, 0).y;
  const NP = 14, pos = [], col = [], idx = [], prn = [], RIM = Array.from({ length: NT + 1 }, (_, t) => phRim(t / NT * TAU)), cloth = sRGB(...D.wrap), edge = sRGB(...(D.wrapBorder || D.wrap.map(v => v * (sc ? .97 : .82)))), PH_ = th => RIM[Math.round(((th / TAU) * NT % NT + NT) % NT)];
  // the crown, from the top to the edge (its seam, and the turns', at the back), a shade lighter than the turns so the rolls read against it
  { const b0 = pos.length / 3, cc = cloth.clone().multiplyScalar(sc ? 1 : 1.06); for (let j = 0; j < NP; j++) for (let t = 0; t <= NT; t++) { const th = Math.PI + t / NT * TAU, p = at(th, PH_(th) * Math.max(.002, j / (NP - 1))); pos.push(p.x, p.y, p.z); col.push(cc.r, cc.g, cc.b); prn.push(1); }
    for (let j = 0; j < NP - 1; j++) for (let t = 0; t < NT; t++) { const a = b0 + j * (NT + 1) + t, d = a + NT + 1; idx.push(a, d, a + 1, a + 1, d, d + 1); } }
  // the turns: [over the edge at the front, at the back, the roll's radius]; the polar angle where the dome is at that height, by halving
  // a turban's five more are thicker, and their heights are shares of the way from the edge to the top, so they cross higher at the front
  // a headscarf has one: its folded edge, thinner and lying on the head
  const TURNS = sc ? [[.003, .003, .0045]] : [[.007, .007, .0085], [.03, .016, .0105], [.018, .042, .011], [.05, .036, .0105], [.04, .07, .01], ...(tb ? [[.44, .34, .0135, 1], [.36, .52, .014, 1], [.62, .5, .0135, 1], [.54, .7, .013, 1], [.78, .66, .012, 1]] : [])], SIDES = 10, rolls = [];
  const phAt = (th, y) => { let lo = 0, hi = PH_(th); for (let k = 0; k < 22; k++) { const m = (lo + hi) / 2; if (at(th, m).y > y) lo = m; else hi = m; } return (lo + hi) / 2; };
  TURNS.forEach(([yf, yb, rad, share], k) => { const line = [], rr = [];
    for (let t = 0; t <= NT; t++) { const th = Math.PI + t / NT * TAU, w = (1 + Math.cos(th)) / 2, r = rad * (1 + .14 * Math.sin(3 * th + k * 1.7)), f = yf * w + yb * (1 - w);
      line.push(at(th, phAt(th, rimY(th) + (share ? f * (topY - rimY(th)) : f)), r * .4)); rr.push(r); }
    line[NT] = line[0].clone(); const g2 = tubeGeom(line, rr, SIDES), b0 = pos.length / 3, a2 = g2.attributes.position.array;
    // flattened onto the head: a band of cloth, wide along the dome and thin out from it
    for (let s2 = 0; s2 <= NT; s2++) { const L = line[s2], n = L.clone().sub(c).normalize(); for (let q = 0; q <= SIDES; q++) { const o = (s2 * (SIDES + 1) + q) * 3, ox = a2[o] - L.x, oy = a2[o + 1] - L.y, oz = a2[o + 2] - L.z, dn = ox * n.x + oy * n.y + oz * n.z;
      a2[o] = L.x + (ox - n.x * dn) * 1.5 + n.x * dn * .5; a2[o + 1] = L.y + (oy - n.y * dn) * 1.5 + n.y * dn * .5; a2[o + 2] = L.z + (oz - n.z * dn) * 1.5 + n.z * dn * .5; } }
    const c2 = k === 0 ? edge : cloth.clone().multiplyScalar(1 - .05 * (k % 2));
    for (let i = 0; i < a2.length; i += 3) { pos.push(a2[i], a2[i + 1], a2[i + 2]); col.push(c2.r, c2.g, c2.b); prn.push(sc && !D.wrapBorder ? 1 : 0); } for (const i of g2.index.array) idx.push(b0 + i); rolls.push(line); });
  // a turban's crown (Session 1020; OG-044's are wound to the top): three turns cross over it, each from under the upper turns on one
  // side, over the top and down under them on the other, in planes 0.35, -0.5 and 1.45 rad off the front-to-back line, wider and flatter than the turns
  let cross = 0; if (tb) for (const [al, ff, fb, rad] of [[.35, .6, .66, .017], [-.5, .66, .6, .016], [1.45, .62, .62, .016]]) { const line = [], rr = [], NQ = 40;
    const ends = [[al, ff], [al + Math.PI, fb]].map(([th, f]) => [th, phAt(th, rimY(th) + f * (topY - rimY(th)))]);
    for (let q = 0; q <= NQ; q++) { const u = q / NQ * 2 - 1, [th, pe] = u < 0 ? ends[1] : ends[0], r = rad * (1 + .1 * Math.sin(5 * u + al)); line.push(at(th, Math.abs(u) * pe, r * .4)); rr.push(r); }
    const g2 = tubeGeom(line, rr, SIDES), b0 = pos.length / 3, a2 = g2.attributes.position.array;
    for (let s2 = 0; s2 <= NQ; s2++) { const L = line[s2], n = L.clone().sub(c).normalize(); for (let q = 0; q <= SIDES; q++) { const o = (s2 * (SIDES + 1) + q) * 3, ox = a2[o] - L.x, oy = a2[o + 1] - L.y, oz = a2[o + 2] - L.z, dn = ox * n.x + oy * n.y + oz * n.z;
      a2[o] = L.x + (ox - n.x * dn) * 2.4 + n.x * dn * .45; a2[o + 1] = L.y + (oy - n.y * dn) * 2.4 + n.y * dn * .45; a2[o + 2] = L.z + (oz - n.z * dn) * 2.4 + n.z * dn * .45; } }
    const c2 = cloth.clone().multiplyScalar(.97 - .03 * cross); for (let i = 0; i < a2.length; i += 3) { pos.push(a2[i], a2[i + 1], a2[i + 2]); col.push(c2.r, c2.g, c2.b); prn.push(0); } for (const i of g2.index.array) idx.push(b0 + i); cross++; }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('aBase', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3)); g.setAttribute('aPrint', new THREE.Float32BufferAttribute(prn, 1)); g.setIndex(idx); g.computeVertexNormals();
  // the numbers, before it moves to the head bone: the nearest point of the head and of the tucked hair under it, how far the lowest
  // cloth over the brow stands above the brow line, and how low it comes at the nape
  let gap = 1, hairOut = 0, browLow = 9, nape = 9, overBrow = 0; for (const i of hv) { if (!under(i)) continue; const d = V(i).sub(c), r = d.length(); gap = Math.min(gap, R(Math.atan2(d.x, d.z), Math.acos(d.y / r)) - r); }
  for (const p of hairPts) { const d = p.clone().sub(c), r = d.length(); if (p.y > rimY(thOf(p.x, p.z)) && r > R(Math.atan2(d.x, d.z), Math.acos(d.y / r)) - .002) hairOut++; }
  for (let i = 0; i < pos.length; i += 3) { const th = Math.atan2(pos[i] - c.x, pos[i + 2] - c.z); if (Math.abs(th) < .5) { browLow = Math.min(browLow, pos[i + 1]); if (pos[i + 1] < browTop + .005) overBrow++; } if (Math.abs(th) > 2.8) nape = Math.min(nape, pos[i + 1]); }
  const ext = new THREE.Box3(); for (let i = 0; i < pos.length; i += 3) ext.expandByPoint(new THREE.Vector3(pos[i], pos[i + 1], pos[i + 2]));
  g.translate(-heads['head'].x, -heads['head'].y, -heads['head'].z);
  const m = clothMat(new THREE.Color(1, 1, 1), 'wool', { side: THREE.DoubleSide, scale: 34, print: sc && D.scarfPrint ? sRGB(...D.scarfPrint) : null }); m.vertexColors = true; const mesh = new THREE.Mesh(g, m); mesh.name = 'wrap'; mesh.castShadow = mesh.receiveShadow = true; byName['head'].add(mesh);
  return { mesh, stats: { gap: +gap.toFixed(4), hairOut, hairPts: hairPts.length, brow: +(browLow - browTop).toFixed(4), overBrow, napeDrop: +(by - nape).toFixed(3), turns: rolls.length, tris: idx.length / 3, width: +(ext.max.x - ext.min.x).toFixed(3), height: +(ext.max.y - ext.min.y).toFixed(3), top: +(ext.max.y - by).toFixed(3), depth: +(ext.max.z - ext.min.z).toFixed(3), border: !!D.wrapBorder, turban: tb, cross, scarf: sc, front: +(rimY(0) - browTop).toFixed(4) } };
}
// ── a head-wrap's tail (Session 1018, L1; OG-044's and OG-056's women: a scarf's end hanging from the wrap down the back) ──
// The wrap's loose end comes out from under its lowest turn (it starts 3 cm up, inside the turns) behind one ear and hangs down the back of the neck onto the shoulder
// blade, 34 cm on a woman and 28 on a man. It is gathered to 5 cm where it leaves the wrap and opens to 10 to 11 within its top
// third. It hangs straight down, never back in toward the body, and lies 6 mm clear of the first thing worn there. That is read off
// a radial map round the neck's middle: the furthest out of everything skinned near the upper back (the body, the tunic, the hair,
// a mantle) and of what is carried rigid there (a sash, the wrap's own turns), in 72 directions and 1 cm bands. Folds open down
// its length. Its last 2.5 cm takes the wrap's border colour, when there is one. Rigid, carried by the chest bone as the necklace is.
// A headscarf's point (Session 1029, D.scarf) is laid the same way, down the middle of the back,
// 9 cm wide under the knot narrowing to its corner 22 cm down (18 on a man), its two edges in the border's colour, printed as the scarf is. The other two
// corners are knotted over it at the nape, a lump of cloth with two short ends 5.5 cm long lying on the point
function buildWrapTail(G, body, byName, meshes, root) {
  const D = G.dress, man = (G.g ?? .5) > .5, pt = !!D.scarf, side = pt ? 0 : D.wrapTail === 'R' ? -1 : 1, chest = byName['spine03'] || byName['spine04'], wrap = root.getObjectByName('wrap'); if (!wrap) return null;
  root.updateMatrixWorld(true); const neck = new THREE.Vector3().setFromMatrixPosition(byName['neck01'].matrixWorld), PB = posedBody(body);
  const ax = new THREE.Vector3(); let na = 0; for (const i of new Set(PACK.G['body'])) { const y = PB[i * 3 + 1] - neck.y; if (y > .03 && y < .06 && Math.abs(PB[i * 3] - neck.x) < .09) { ax.x += PB[i * 3]; ax.z += PB[i * 3 + 2]; na++; } } ax.divideScalar(na || 1);
  const thOf = (x, z) => Math.atan2(x - ax.x, z - ax.z), rOf = (x, z) => Math.hypot(x - ax.x, z - ax.z), TAU = Math.PI * 2, dth = (a, b) => { let d = a - b; while (d > Math.PI) d -= TAU; while (d < -Math.PI) d += TAU; return d; };
  // where it leaves the wrap: the wrap's lowest points within 0.12 rad of the tail's line, 0.55 rad off the back toward its side
  const th0 = Math.PI - side * .55, WV = wrap.geometry.attributes.position.array.slice(), v3 = new THREE.Vector3(); for (let i = 0; i < WV.length; i += 3) { v3.fromArray(WV, i).applyMatrix4(wrap.matrixWorld); v3.toArray(WV, i); } let yA = 9, rA = 0; for (let i = 0; i < WV.length; i += 3) if (Math.abs(dth(thOf(WV[i], WV[i + 2]), th0)) < .12) yA = Math.min(yA, WV[i + 1]);
  for (let i = 0; i < WV.length; i += 3) if (Math.abs(dth(thOf(WV[i], WV[i + 2]), th0)) < .12 && WV[i + 1] < yA + .02) rA = Math.max(rA, rOf(WV[i], WV[i + 2]));
  const L = pt ? (man ? .18 : .22) : man ? .28 : .34, top = yA + .03, low = top - L - .03;
  // the map: everything near the upper back but the beard, the brows and a hood
  const NA = 72, NY = Math.ceil((top + .03 - low) / .01), M = new Float32Array(NA * NY), aBin = th => ((Math.round(th / TAU * NA) % NA) + NA) % NA, yBin = y => Math.max(0, Math.min(NY - 1, Math.floor((y - low) / .01)));
  const CPa = [], take = (x, y, z) => { if (y < low || y > top + .03 || rOf(x, z) > .32) return; CPa.push(x, y, z); const k = yBin(y) * NA + aBin(thOf(x, z)); M[k] = Math.max(M[k], rOf(x, z)); };
  for (const m of meshes) { if (!m.isSkinnedMesh || /^(beard|moust|brows|hood)/.test(m.name)) continue; const X = m === body ? posedBody(m) : posedOf(m), I = m === body ? PACK.G['body'] : m.geometry.index ? m.geometry.index.array : null;
    if (!I) { for (let i = 0; i < X.length; i += 3) take(X[i], X[i + 1], X[i + 2]); continue; }
    for (let t = 0; t < I.length; t += 3) { const A = I[t] * 3, B = I[t + 1] * 3, Cc = I[t + 2] * 3; if (X[A + 1] < low - .05 && X[B + 1] < low - .05) continue; if (X[A + 1] > top + .08 && X[B + 1] > top + .08) continue;
      for (let i = 0; i <= 4; i++) for (let j = 0; i + j <= 4; j++) { const wa = i / 4, wb = j / 4, wc = 1 - wa - wb; take(X[A] * wa + X[B] * wb + X[Cc] * wc, X[A + 1] * wa + X[B + 1] * wb + X[Cc + 1] * wc, X[A + 2] * wa + X[B + 2] * wb + X[Cc + 2] * wc); } } }
  root.traverse(m => { if (!m.isMesh || m.isSkinnedMesh || m.userData.shield || m === wrap) return; const a = m.geometry.attributes.position, v = new THREE.Vector3(); for (let i = 0; i < a.count; i++) { v.fromBufferAttribute(a, i).applyMatrix4(m.matrixWorld); take(v.x, v.y, v.z); } });
  // each bin's furthest point spread over its neighbours, so nothing falls between two bins
  const S = new Float32Array(M.length); for (let b = 0; b < NY; b++) for (let a = 0; a < NA; a++) { let m = 0; for (let da = -2; da <= 2; da++) for (let db = -1; db <= 1; db++) { const bb = b + db; if (bb >= 0 && bb < NY) m = Math.max(m, M[bb * NA + (a + da + NA) % NA]); } S[b * NA + a] = m; }
  // read between the bins' middles, so the cloth over them has no steps
  const need = (th, y) => { const u = ((th / TAU * NA) % NA + NA) % NA, v = Math.max(0, Math.min(NY - 1.001, (y - low) / .01 - .5)), a = Math.floor(u), b = Math.floor(v), fu = u - a, fv = v - b, g = (aa, bb) => S[bb * NA + (aa % NA)];
    return (g(a, b) * (1 - fu) + g(a + 1, b) * fu) * (1 - fv) + (g(a, b + 1) * (1 - fu) + g(a + 1, b + 1) * fu) * fv; };
  const NR = 44, NC = 10, CLR = .006, edge = sRGB(...(D.wrapBorder || D.wrap.map(v => v * .82))), cloth = sRGB(...D.wrap), wid = pt ? f => .006 + .085 * (1 - f) ** .8 : f => .05 + (man ? .05 : .06) * Math.min(1, f * 3) ** .7;
  const pos = [], col = [], idx = [], prn = [], R = new Float32Array((NR + 1) * (NC + 1)), TH = new Float32Array((NR + 1) * (NC + 1));
  for (let j = 0; j <= NR; j++) { const f = j / NR, y = top - L * f, w = wid(f);
    for (let k = 0; k <= NC; k++) { const u = k / NC - .5, prev = j ? R[(j - 1) * (NC + 1) + k] : rA - .004; let r = prev, th = th0;
      for (let it = 0; it < 2; it++) { th = th0 + u * w / Math.max(.05, r); r = Math.max(prev, need(th, y) + CLR); }
      R[j * (NC + 1) + k] = r; TH[j * (NC + 1) + k] = th; } }
  // folds, opening down its length: only ever outward
  for (let j = 0; j <= NR; j++) for (let k = 0; k <= NC; k++) { const f = j / NR, u = k / NC, o = j * (NC + 1) + k, r = R[o] + .007 * f * (1 - Math.cos(u * TAU * 1.5 + f * 2)) / 2, y = top - L * f, rim = pt ? D.wrapBorder && (k === 0 || k === NC) : f > 1 - .025 / L, c = rim ? edge : cloth.clone().multiplyScalar(1 - .04 * Math.sin(u * TAU * 1.5));
    pos.push(ax.x + r * Math.sin(TH[o]), y, ax.z + r * Math.cos(TH[o])); col.push(c.r, c.g, c.b); prn.push(pt && !rim ? 1 : 0); }
  for (let j = 0; j < NR; j++) for (let k = 0; k < NC; k++) { const a = j * (NC + 1) + k, d = a + NC + 1; idx.push(a, d, a + 1, a + 1, d, d + 1); }
  // a headscarf's knot, over the point where it leaves the scarf: the point's own radius at an angle and a height, read off its grid
  const Rp = (th, y) => { const f = Math.max(0, Math.min(1, (top - y) / L)), j = Math.round(f * NR), r0 = R[j * (NC + 1) + NC / 2], du = dth(th, th0) * r0 / wid(f); return R[j * (NC + 1) + Math.max(0, Math.min(NC, Math.round((du + .5) * NC)))]; };
  let knot = null; if (pt) { const yK = yA - .002, r0 = Rp(th0, yK), n = new THREE.Vector3(Math.sin(th0), 0, Math.cos(th0)), t = new THREE.Vector3(Math.cos(th0), 0, -Math.sin(th0)), C = new THREE.Vector3(ax.x, yK, ax.z).addScaledVector(n, r0 + .011), kc = cloth.clone().multiplyScalar(.93);
    const b0 = pos.length / 3, NA2 = 8, NB2 = 14; for (let a = 0; a <= NA2; a++) for (let b = 0; b <= NB2; b++) { const A = a / NA2 * Math.PI, B = b / NB2 * TAU, lump = 1 + .1 * Math.sin(3 * B + 1) * Math.sin(2 * A), sb = Math.sin(B);
      const q = C.clone().addScaledVector(t, .023 * lump * Math.sin(A) * Math.cos(B)).add(new THREE.Vector3(0, .015 * lump * Math.cos(A), 0)).addScaledVector(n, (sb < 0 ? .007 : .011) * lump * Math.sin(A) * sb); pos.push(q.x, q.y, q.z); col.push(kc.r, kc.g, kc.b); prn.push(1); }
    for (let a = 0; a < NA2; a++) for (let b = 0; b < NB2; b++) { const i0 = b0 + a * (NB2 + 1) + b, i1 = i0 + NB2 + 1; idx.push(i0, i0 + 1, i1, i0 + 1, i1 + 1, i1); }
    // its two ends, from under the knot down and out over the point, 2.2 cm wide narrowing to 1.3, 6.5 mm over it (clear of its folds) and more near the knot
    let endGap = 9; for (const s2 of [-1, 1]) { const e0 = pos.length / 3, NQ = 10; for (let q = 0; q <= NQ; q++) { const f = q / NQ, y = yK - .004 - .055 * f, th = th0 + s2 * (.012 + .026 * f) / r0, w = .022 - .009 * f, ec = D.wrapBorder && f > .82 ? edge : cloth.clone().multiplyScalar(.86);
        for (let u = 0; u <= 2; u++) { const tu = th + (u / 2 - .5) * w / r0, rr = Rp(tu, y) + .0065 + .004 * (1 - f) + .0015 * (u === 1), base = Rp(tu, y); endGap = Math.min(endGap, rr - base); pos.push(ax.x + rr * Math.sin(tu), y, ax.z + rr * Math.cos(tu)); col.push(ec.r, ec.g, ec.b); prn.push(D.wrapBorder && f > .82 ? 0 : 1); } }
      for (let q = 0; q < NQ; q++) for (let u = 0; u < 2; u++) { const a = e0 + q * 3 + u, d = a + 3; idx.push(a, d, a + 1, a + 1, d, d + 1); } }
    knot = { y: +(yK - neck.y).toFixed(3), out: +(r0 + .011 - rA).toFixed(4), endGap: +endGap.toFixed(4), endLen: .055 }; }
  // the numbers: points of what it lies over that come through it, within its width and length; how much of it lies on the body (6 to
  // 12 mm off what is under it); how far its top is from the wrap's lowest turn; and its width at the hem
  let through = 0, tested = 0; for (let i = 0; i < CPa.length; i += 3) { const x = CPa[i], y = CPa[i + 1], z = CPa[i + 2], f = (top - y) / L; if (f < 0 || f > 1) continue; const j = Math.round(f * NR), r0 = R[j * (NC + 1) + NC / 2], du = dth(thOf(x, z), th0) * r0 / wid(f);
    if (Math.abs(du) > .45) continue; tested++; const k = Math.round((du + .5) * NC), r = R[j * (NC + 1) + k]; if (rOf(x, z) > r - .001) through++; }
  let lying = 0; for (let j = 0; j <= NR; j++) { const o = j * (NC + 1) + NC / 2; if (R[o] - need(TH[o], top - L * j / NR) < .012) lying++; }
  let toWrap = 9; { const p = new THREE.Vector3(pos[(NC / 2) * 3], pos[(NC / 2) * 3 + 1], pos[(NC / 2) * 3 + 2]); for (let i = 0; i < WV.length; i += 3) toWrap = Math.min(toWrap, p.distanceTo(new THREE.Vector3(WV[i], WV[i + 1], WV[i + 2]))); }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('aBase', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3)); g.setAttribute('aPrint', new THREE.Float32BufferAttribute(prn, 1)); g.setIndex(idx); g.computeVertexNormals();
  const m = clothMat(new THREE.Color(1, 1, 1), 'wool', { side: THREE.DoubleSide, scale: 34, print: pt && D.scarfPrint ? sRGB(...D.scarfPrint) : null }); m.vertexColors = true; const mesh = new THREE.Mesh(g, m); mesh.name = 'wrapTail'; mesh.castShadow = mesh.receiveShadow = true;
  root.add(mesh); chest.attach(mesh);
  const hem = NR * (NC + 1), hw = new THREE.Vector3(pos[hem * 3], 0, pos[hem * 3 + 2]).distanceTo(new THREE.Vector3(pos[(hem + NC) * 3], 0, pos[(hem + NC) * 3 + 2]));
  return { mesh, stats: { side: pt ? 'C' : side > 0 ? 'L' : 'R', point: pt, knot, len: L, through, tested, lying: +(lying / (NR + 1)).toFixed(2), toWrap: +toWrap.toFixed(4), hemWidth: +hw.toFixed(3), lowY: +(top - L - neck.y).toFixed(3), tris: idx.length / 3, border: !!D.wrapBorder } };
}

// ── hoop earrings (Session 995, L1; OG-044 and OG-056: the Aurennais' coin and hoop jewellery) ──
// A thin ring of gold or bronze through each earlobe. The lobe is the lowest point of the ear on the unmorphed body (the outer ear
// stands past 7.3 cm from the middle between 68 and 75 cm up the rest mesh), carried to the morphed head by its index. The hoop hangs from it in the plane of the head's side, its top 2 mm into the lobe, carried rigid by the head bone
function buildEarrings(P, G, heads, byName) {
  const R0 = PACK.rest, D = G.dress, hv = PACK.headV || (PACK.headV = [...new Set(PACK.G['body'])].filter(i => R0[i * 3 + 1] > .6)), man = (G.g ?? .5) > .5;
  const r = man ? .009 : .0125, tube = man ? .0011 : .0013, metal = new THREE.MeshStandardMaterial({ color: sRGB(...D.earrings), metalness: .85, roughness: .28 });
  const grp = new THREE.Group(); grp.name = 'earrings'; const out = []; let near = 0, lobes = [];
  for (const sg of [-1, 1]) { const ear = hv.filter(i => R0[i * 3] * sg > .073 && R0[i * 3 + 1] > .68 && R0[i * 3 + 1] < .75 && R0[i * 3 + 2] > .03 && R0[i * 3 + 2] < .065);
    let lobe = ear[0]; for (const i of ear) if (R0[i * 3 + 1] < R0[lobe * 3 + 1]) lobe = i;
    const L = new THREE.Vector3(P[lobe * 3] - sg * .002, P[lobe * 3 + 1] + .002, P[lobe * 3 + 2]), C = L.clone().add(new THREE.Vector3(0, -r, 0)); lobes.push(L);
    const g = new THREE.TorusGeometry(r, tube, 8, 36); g.rotateY(Math.PI / 2); g.translate(C.x, C.y, C.z);
    // nothing of the head or the neck within 1.5 mm of the ring, below its top third (which goes through the lobe)
    const pa = g.attributes.position; for (let k = 0; k < pa.count; k++) { const y = pa.getY(k); if (y > C.y + r * .4) continue; const x = pa.getX(k), z = pa.getZ(k);
      for (const i of hv) { const dx = P[i * 3] - x, dy = P[i * 3 + 1] - y, dz = P[i * 3 + 2] - z; if (dx * dx + dy * dy + dz * dz < .0015 ** 2) { near++; break; } } }
    g.translate(-heads['head'].x, -heads['head'].y, -heads['head'].z); const m = new THREE.Mesh(g, metal); m.castShadow = true; grp.add(m); out.push(m); }
  byName['head'].add(grp);
  return { mesh: grp, stats: { near, r, drop: +(lobes[0].y - 2 * r - heads['head'].y).toFixed(3), lobes: lobes.map(v => [+v.x.toFixed(3), +v.y.toFixed(3), +v.z.toFixed(3)]), apart: +lobes[0].distanceTo(lobes[1]).toFixed(3), tris: out.reduce((a, m) => a + m.geometry.index.count / 3, 0) } };
}

// ── the eyepatch (Session 1079, L1; OG-001's extras strip, "the disabled (an eyepatch, scars)") ──
// An oval of black or brown leather 5 by 3.8 cm (4.6 by 3.5 on a woman) over the lost eye, on a cord round the head. The face under
// it is read by rays straight in onto the morphed face, and the leather spans the socket as a stiff patch does: its middle stands
// 1.5 mm off the face's highest points within 7 mm, smoothed, and it comes down to 1 mm off the skin at its edge, where a rim 2.5 mm
// deep closes it to the face. Its face is drawn in a canvas: grain, a rolled edge, a stitch line 4 mm in. The cord is one loop in a
// plane through the patch's inner top corner and its outer edge and over the far temple, so it rises across the forehead to the far
// side and passes over the near ear: round the plane it lies on the outermost of the skin, the scalp, the hair, the brows and the
// patch, 0.4 mm off. Both are carried rigid by the head bone; the lost eye's ball is not built
const PATCH_TEX = () => PACK.patchTex || (PACK.patchTex = (() => { const c = document.createElement('canvas'); c.width = c.height = 256; const x = c.getContext('2d'), rnd = seeded('patch');
  x.fillStyle = '#c8c8c8'; x.fillRect(0, 0, 256, 256); for (let k = 0; k < 2600; k++) { const v = 170 + rnd() * 70 | 0; x.fillStyle = `rgb(${v},${v},${v})`; x.fillRect(rnd() * 256, rnd() * 256, 1 + rnd() * 3, 1 + rnd() * 2); }
  const g = x.createRadialGradient(128, 128, 96, 128, 128, 128); g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(.75, 'rgba(255,255,255,.35)'); g.addColorStop(.9, 'rgba(60,60,60,.5)'); g.addColorStop(1, 'rgba(40,40,40,.8)'); x.fillStyle = g; x.fillRect(0, 0, 256, 256);
  x.strokeStyle = '#f0f0f0'; x.lineWidth = 3; x.setLineDash([7, 6]); x.beginPath(); x.arc(128, 128, 109, 0, 7); x.stroke();
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; })());
function buildEyepatch(P, G, heads, byName, meshes) {
  const R0 = PACK.rest, D = G.dress, side = D.eyepatchSide === 'R' ? 'r' : 'l', man = (G.g ?? .5) > .5, V = (a, i) => new THREE.Vector3(a[i * 3], a[i * 3 + 1], a[i * 3 + 2]);
  const L = [...new Set(PACK.G[`helper-${side}-eye`])], c = new THREE.Vector3(); for (const i of L) c.add(V(P, i)); c.divideScalar(L.length); const sx = Math.sign(c.x) || 1;
  const A = man ? .025 : .023, B = man ? .019 : .0175, cx = c.x + sx * .002, cy = c.y + .003;
  // the face in front of the eye: every triangle of the body near it, and the frontmost hit of a ray straight in
  const I = PACK.G['body'], tris = []; for (let t = 0; t < I.length; t += 3) { const a = I[t], b = I[t + 1], d = I[t + 2]; if ([a, b, d].every(i => Math.abs(P[i * 3] - cx) < A + .02 && Math.abs(P[i * 3 + 1] - cy) < B + .02 && P[i * 3 + 2] > c.z - .04)) tris.push(a, b, d); }
  const rayZ = (x, y) => { let best = -9; for (let t = 0; t < tris.length; t += 3) { const a = tris[t] * 3, b = tris[t + 1] * 3, d = tris[t + 2] * 3, ax = P[a], ay = P[a + 1], bx = P[b], by = P[b + 1], dx = P[d], dy = P[d + 1];
      const det = (by - dy) * (ax - dx) + (dx - bx) * (ay - dy); if (Math.abs(det) < 1e-12) continue; const u = ((by - dy) * (x - dx) + (dx - bx) * (y - dy)) / det, v = ((dy - ay) * (x - dx) + (ax - dx) * (y - dy)) / det, w = 1 - u - v;
      if (u < -1e-6 || v < -1e-6 || w < -1e-6) continue; best = Math.max(best, u * P[a + 2] + v * P[b + 2] + w * P[d + 2]); } return best; };
  // a 1 mm grid over the patch and 8 mm round it: the face (gaps filled from their neighbours), its highest within 7 mm, smoothed
  const h = .001, M = .008, nx = Math.round(2 * (A + M) / h) + 1, ny = Math.round(2 * (B + M) / h) + 1, x0 = cx - A - M, y0 = cy - B - M, F = new Float32Array(nx * ny);
  for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) F[j * nx + i] = rayZ(x0 + i * h, y0 + j * h);
  for (let pass = 0; pass < 6; pass++) for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) if (F[j * nx + i] < -1) { let s = 0, n = 0; for (const [di, dj] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const ii = i + di, jj = j + dj; if (ii >= 0 && jj >= 0 && ii < nx && jj < ny && F[jj * nx + ii] > -1) { s += F[jj * nx + ii]; n++; } } if (n) F[j * nx + i] = s / n; }
  const Hd = new Float32Array(nx * ny), R = 7; for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) { let m = -9; for (let dj = -R; dj <= R; dj++) for (let di = -R; di <= R; di++) { if (di * di + dj * dj > R * R) continue; const ii = i + di, jj = j + dj; if (ii >= 0 && jj >= 0 && ii < nx && jj < ny) m = Math.max(m, F[jj * nx + ii]); } Hd[j * nx + i] = m; }
  let Hs = Hd; for (let pass = 0; pass < 3; pass++) { const o = new Float32Array(nx * ny); for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) { let s = 0, n = 0; for (let dj = -3; dj <= 3; dj++) for (let di = -3; di <= 3; di++) { const ii = i + di, jj = j + dj; if (ii >= 0 && jj >= 0 && ii < nx && jj < ny) { s += Hs[jj * nx + ii]; n++; } } o[j * nx + i] = s / n; } Hs = o; }
  const samp = (G2, x, y) => { const fi = Math.max(0, Math.min(nx - 1.001, (x - x0) / h)), fj = Math.max(0, Math.min(ny - 1.001, (y - y0) / h)), i = Math.floor(fi), j = Math.floor(fj), u = fi - i, v = fj - j;
    return G2[j * nx + i] * (1 - u) * (1 - v) + G2[j * nx + i + 1] * u * (1 - v) + G2[(j + 1) * nx + i] * (1 - u) * v + G2[(j + 1) * nx + i + 1] * u * v; };
  const NR = 12, NS = 56, pos = [], uv = [], idx = [], at = (r, th) => { const x = cx + A * r * Math.cos(th), y = cy + B * r * Math.sin(th), f = rayZ(x, y) > -1 ? rayZ(x, y) : samp(F, x, y), top = Math.max(samp(Hs, x, y), f) + .0015, k = 1 - r ** 4;
    return new THREE.Vector3(x, y, f + .001 + (top - f - .001) * k); };
  for (let ri = 0; ri <= NR; ri++) for (let s = 0; s <= NS; s++) { const r = ri / NR, th = s / NS * Math.PI * 2, p = at(r, th); pos.push(p.x, p.y, p.z); uv.push(.5 + .5 * r * Math.cos(th) * -sx, .5 + .5 * r * Math.sin(th)); }
  for (let ri = 0; ri < NR; ri++) for (let s = 0; s < NS; s++) { const a = ri * (NS + 1) + s, b = a + NS + 1; idx.push(a, b, a + 1, a + 1, b, b + 1); }
  // the rim: from the edge 2.5 mm straight back into the face
  const e0 = NR * (NS + 1), r0 = pos.length / 3; for (let s = 0; s <= NS; s++) { const k = (e0 + s) * 3; pos.push(pos[k], pos[k + 1], pos[k + 2] - .0025); uv.push(uv[(e0 + s) * 2], uv[(e0 + s) * 2 + 1]); }
  for (let s = 0; s < NS; s++) { const a = e0 + s, b = r0 + s; idx.push(a, b, a + 1, a + 1, b, b + 1); }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx); g.computeVertexNormals();
  const leather = new THREE.MeshStandardMaterial({ color: sRGB(...D.eyepatch), map: PATCH_TEX(), roughness: .72, metalness: 0 });
  // what the patch stands over: the lowest it is off the face inside its edge, and any point of the face in front of it
  let gap = 9, through = 0; for (let ri = 1; ri < NR; ri++) for (let s = 0; s < NS; s++) { const k = (ri * (NS + 1) + s) * 3, f = rayZ(pos[k], pos[k + 1]); if (f > -1) gap = Math.min(gap, pos[k + 2] - f); }
  const hv = PACK.headV || (PACK.headV = [...new Set(PACK.G['body'])].filter(i => R0[i * 3 + 1] > .6));
  for (const i of hv) { const x = P[i * 3], y = P[i * 3 + 1], rr = ((x - cx) / A) ** 2 + ((y - cy) / B) ** 2; if (rr < .9 && P[i * 3 + 2] > at(Math.sqrt(rr), Math.atan2((y - cy) / B, (x - cx) / A)).z) through++; }
  // the cord: a loop in the plane through the inner top corner, the outer edge and a point over the far temple
  const edge = (r, th) => at(r, th), Ain = edge(.9, Math.atan2(.8, -sx * .6) ), Aout = edge(.97, Math.atan2(.3, sx * .954));
  const bb = new THREE.Box3(); for (const i of hv) if (R0[i * 3 + 1] > .74) bb.expandByPoint(V(P, i)); const hc = bb.getCenter(new THREE.Vector3());
  const Q = new THREE.Vector3(hc.x - sx * .08, c.y + .052, hc.z + .004), n = Aout.clone().sub(Ain).cross(Q.clone().sub(Ain)).normalize();
  const O = hc.clone().addScaledVector(n, -hc.clone().sub(Ain).dot(n)), u = Ain.clone().add(Aout).multiplyScalar(.5).sub(O); u.addScaledVector(n, -u.dot(n)).normalize(); const w = n.clone().cross(u);
  const cloud = []; for (const i of hv) cloud.push(V(P, i)); for (let k = 0; k < pos.length; k += 3) cloud.push(new THREE.Vector3(pos[k], pos[k + 1], pos[k + 2]));
  const card = new Uint8Array(1 << 20); for (const m of meshes) if (/^(scalp|hair|brows)/.test(m.name)) { const a = m.geometry.attributes.position.array, ix = m.name === 'scalp' ? [...new Set(PACK.R.scalpRoots)] : null;
    if (ix) for (const i of ix) cloud.push(V(a, i)); else for (let k = 0; k < a.length; k += 3) { if (/^hair/.test(m.name)) card[cloud.length] = 1; cloud.push(new THREE.Vector3(a[k], a[k + 1], a[k + 2])); } }
  // keep only what lies within 6 mm of the plane, as radius and angle round O in it
  const NP = 144, RHO = .0045, CR = man ? .0016 : .0014, rad = new Float32Array(NP).fill(-1), TAU = Math.PI * 2, near = [];
  for (const p of cloud) { const d = p.clone().sub(O), off = d.dot(n); if (Math.abs(off) > .006) continue; const a = d.dot(u), b = d.dot(w); near.push([Math.atan2(b, a), Math.hypot(a, b), off, p]); }
  for (let k = 0; k < NP; k++) { const ph = k / NP * TAU, cs = Math.cos(ph), sn = Math.sin(ph); for (const [ang, r] of near) { let da = Math.abs(ang - ph) % TAU; if (da > Math.PI) da = TAU - da; if (r * Math.sin(Math.min(da, Math.PI / 2)) < RHO && da < Math.PI / 2) rad[k] = Math.max(rad[k], r * Math.cos(da)); } }
  for (let k = 0; k < NP; k++) if (rad[k] < 0) rad[k] = Math.max(rad[(k + NP - 1) % NP], rad[(k + 1) % NP], .06);
  const rs = Array.from(rad, (r, k) => { let s = 0; for (let d = -2; d <= 2; d++) s += rad[(k + d + NP) % NP]; return Math.max(r, s / 5); });
  const line = []; for (let k = 0; k <= NP; k++) { const ph = (k % NP) / NP * TAU; line.push(O.clone().addScaledVector(u, Math.cos(ph) * (rs[k % NP] + CR + .0004)).addScaledVector(w, Math.sin(ph) * (rs[k % NP] + CR + .0004))); }
  const cg = tubeGeom(line, line.map(() => CR), 6), cord = new THREE.MeshStandardMaterial({ color: sRGB(...D.eyepatch).multiplyScalar(1.15), roughness: .7 });
  // what the cord passes through (the skin, the patch, the scalp and the brows; the hair's cards apart), how far over the far
  // eye's middle it runs on the forehead
  const segD = p => { let m = 9; for (let k = 0; k < NP; k++) { const a = line[k], b = line[k + 1], ab = b.clone().sub(a), t = Math.max(0, Math.min(1, p.clone().sub(a).dot(ab) / ab.lengthSq())); m = Math.min(m, p.distanceTo(a.clone().addScaledVector(ab, t))); } return m; };
  let cut = 0, hairCut = 0; cloud.forEach((p, i) => { if (Math.abs(p.clone().sub(O).dot(n)) > .004) return; if (segD(p) < CR) card[i] ? hairCut++ : cut++; });
  const far = [...new Set(PACK.G[`helper-${side === 'l' ? 'r' : 'l'}-eye`])], fc = new THREE.Vector3(); for (const i of far) fc.add(V(P, i)); fc.divideScalar(far.length);
  let overFar = 9; for (const p of line) if (Math.abs(p.x - fc.x) < .012 && p.z > fc.z - .02) overFar = Math.min(overFar, p.y - fc.y);
  const grp = new THREE.Group(); grp.name = 'eyepatch'; for (const [geo, mat, nm] of [[g, leather, 'patch'], [cg, cord, 'patchCord']]) { geo.translate(-heads['head'].x, -heads['head'].y, -heads['head'].z); const m = new THREE.Mesh(geo, mat); m.name = nm; m.castShadow = true; grp.add(m); }
  byName['head'].add(grp);
  return { mesh: grp, stats: { side: side.toUpperCase(), size: [+(2 * A).toFixed(3), +(2 * B).toFixed(3)], gap: +gap.toFixed(4), through, cordCut: cut, cordHair: hairCut, overFarEye: +overFar.toFixed(3), tilt: +(Math.acos(Math.abs(n.y)) * 180 / Math.PI).toFixed(1), tris: idx.length / 3 + cg.index.count / 3 } };
}

// ── the coin necklace (Session 1003, L1; OG-044 and OG-056: the Aurennais' coin and hoop jewellery) ──
// A thin metal chain round the base of the neck, lying on whatever is worn there (the skin, a tunic's collar, a sash, a wrap's
// tail), with coins hung from its front half on small rings. The chain is found by rays from inside the neck: level at the nape,
// down onto the shoulders' tops at the sides, steeply down onto the breastbone in front, each ray's last point of what is worn
// within 8 mm of it (the hair, the beard and a raised hood are not under it). Each coin hangs from its ring down the surface, its
// centre found by rays too, a little lower, so its face lies on the chest and not across it. Carried rigid by the chest bone
const COIN_TEX = () => PACK.coinTex || (PACK.coinTex = (() => { const c = document.createElement('canvas'); c.width = c.height = 128; const x = c.getContext('2d');
  x.fillStyle = '#b0b0b0'; x.fillRect(0, 0, 128, 128); x.strokeStyle = '#ffffff'; x.lineWidth = 9; x.beginPath(); x.arc(64, 64, 57, 0, 7); x.stroke();
  x.fillStyle = '#e8e8e8'; for (let k = 0; k < 28; k++) { const a = k / 28 * Math.PI * 2; x.beginPath(); x.arc(64 + Math.cos(a) * 44, 64 + Math.sin(a) * 44, 2.6, 0, 7); x.fill(); }
  // the stamp: a ring of eight short rays round a boss, struck a little off centre as hand-struck coins are
  x.strokeStyle = '#efefef'; x.lineWidth = 5; for (let k = 0; k < 8; k++) { const a = k / 8 * Math.PI * 2 + .2; x.beginPath(); x.moveTo(66 + Math.cos(a) * 14, 62 + Math.sin(a) * 14); x.lineTo(66 + Math.cos(a) * 30, 62 + Math.sin(a) * 30); x.stroke(); }
  x.fillStyle = '#f4f4f4'; x.beginPath(); x.arc(66, 62, 9, 0, 7); x.fill(); const t = new THREE.CanvasTexture(c); return t; })());
function buildNecklace(G, body, byName, meshes, root) {
  const D = G.dress, man = (G.g ?? .5) > .5, chest = byName['spine03'] || byName['spine04'];
  const neck = new THREE.Vector3().setFromMatrixPosition(byName['neck01'].matrixWorld);
  // what it lies on, read across every triangle near the neck at 15 points (a tunic's points are a few centimetres apart, and
  // between the breast and the collar its cloth is hollow, so its triangles stand out past its points): the body and what is
  // skinned over it, not the hair, the beard or a hood; and the points of what is carried rigid there (a sash, a bodice's lacing)
  const box = (x, y) => y > neck.y - .24 && y < neck.y + .06 && Math.abs(x - neck.x) < .27, CPa = [];
  for (const m of meshes) { if (!m.isSkinnedMesh || /^(beard|moust|brows|scalp|hood|hair)/.test(m.name)) continue; const X = m === body ? posedBody(m) : posedOf(m), I = m === body ? PACK.G['body'] : m.geometry.index.array;
    for (let t = 0; t < I.length; t += 3) { const A = I[t] * 3, B = I[t + 1] * 3, Cc = I[t + 2] * 3; if (!box(X[A], X[A + 1]) && !box(X[B], X[B + 1]) && !box(X[Cc], X[Cc + 1])) continue;
      for (let i = 0; i <= 4; i++) for (let j = 0; i + j <= 4; j++) { const wa = i / 4, wb = j / 4, wc = 1 - wa - wb; CPa.push(X[A] * wa + X[B] * wb + X[Cc] * wc, X[A + 1] * wa + X[B + 1] * wb + X[Cc + 1] * wc, X[A + 2] * wa + X[B + 2] * wb + X[Cc + 2] * wc); } } }
  root.updateMatrixWorld(true); root.traverse(m => { if (!m.isMesh || m.isSkinnedMesh || m.userData.shield) return; const a = m.geometry.attributes.position, v = new THREE.Vector3(); for (let i = 0; i < a.count; i++) { v.fromBufferAttribute(a, i).applyMatrix4(m.matrixWorld); if (box(v.x, v.y)) CPa.push(v.x, v.y, v.z); } });
  const CP = Float32Array.from(CPa), clouds = [{ X: CP, ids: null }];
  const NR = 120, RHO = .012, CR = man ? .0011 : .0009, OFF = CR + .001;
  // the neck's own middle, 3 to 6 cm over the neck bone's head (which sits at its back, under the shoulders' line): the middle of
  // the skin's points in that slab
  const PB = posedBody(body), ax = new THREE.Vector3(); let na = 0; for (const i of new Set(PACK.G['body'])) { const y = PB[i * 3 + 1] - neck.y; if (y > .03 && y < .06 && Math.abs(PB[i * 3] - neck.x) < .09) { ax.x += PB[i * 3]; ax.z += PB[i * 3 + 2]; na++; } } ax.divideScalar(na || 1);
  // a ray from outside, round the neck by phi (0 in front), aimed in at the neck's base: level at the throat (dropping in a U from the sides to
  // 7.5 cm under the neck bone's head in front, 8.5 on a woman, onto the breastbone) and at the nape (1 cm over it), and down from up to 60 degrees above onto the shoulders'
  // tops at the sides, 6.5 cm out from the middle. The chain lies where it meets the first thing worn there; the head and the jaw
  // (more than 5 cm over the neck bone) are not under it
  const radial = ph => new THREE.Vector3(Math.sin(ph), 0, Math.cos(ph));
  const aimAt = (ph, dy = 0) => { const f = (1 + Math.cos(ph)) / 2, s = Math.sin(ph) ** 2; return new THREE.Vector3(ax.x, neck.y + .01 - .04 * f - (man ? .045 : .055) * Math.max(0, Math.cos(ph)) ** 1.5 + dy, ax.z).addScaledVector(radial(ph), .065 * s); };
  const inAt = ph => { const al = 1.05 * Math.sin(ph) ** 2; return radial(ph).multiplyScalar(-Math.cos(al)).add(new THREE.Vector3(0, -Math.sin(al), 0)); };
  // each ray starts out in the air: 25 cm out where it is level (a tunic stands up to 3.5 cm off a woman's breast), 10 cm where it
  // comes down onto the shoulders, so it passes under the ears and any hoops in them
  const back = ph => .25 - .15 * Math.sin(ph) ** 2;
  const hitOf = (T, d, ph) => { const o = T.clone().addScaledVector(d, -back(ph)); let first = 9; eachPoint(clouds, (x, y, z) => { if (y > neck.y + .05) return; const dx = x - o.x, dy = y - o.y, dz = z - o.z, dd = dx * d.x + dy * d.y + dz * d.z; if (dd <= 0 || dd > .25 || dd >= first) return;
    if (Math.hypot(dx - d.x * dd, dy - d.y * dd, dz - d.z * dd) < RHO) first = dd; }); return first < 9 ? o.addScaledVector(d, first) : null; };
  const rays = []; for (let k = 0; k < NR; k++) { const ph = k / NR * Math.PI * 2, d = inAt(ph), T = aimAt(ph), h = hitOf(T, d, ph); rays.push({ ph, d, hit: h || T.clone(), missed: !h }); }
  // A chain hangs taut over hollows: the points are smoothed round the loop, then each is set back out along its ray to its
  // clearance over what it met wherever the smoothing took it in
  const missed = rays.filter(r => r.missed).length, hits = rays.map(r => r.hit), P0 = hits.map((h, k) => h.clone().addScaledVector(rays[k].d, -OFF));
  for (let it = 0; it < 12; it++) { const p = P0.map(v => v.clone()); for (let k = 0; k < NR; k++) { P0[k].copy(p[(k + NR - 1) % NR]).add(p[k]).add(p[k]).add(p[(k + 1) % NR]).multiplyScalar(.25);
    const out = rays[k].d.clone().negate(), t = P0[k].clone().sub(hits[k]).dot(out); if (t < OFF) P0[k].addScaledVector(out, OFF - t); } }
  // the smoothing slides points along the surface as well as off it, so three last passes (smoothed again between them) set each back
  // out against a fresh ray through where it now is, not the one it was found by
  for (let it = 0; it < 3; it++) { if (it) { const p = P0.map(v => v.clone()); for (let k = 0; k < NR; k++) P0[k].copy(p[(k + NR - 1) % NR]).add(p[k]).add(p[k]).add(p[(k + 1) % NR]).multiplyScalar(.25); } for (let k = 0; k < NR; k++) { const d = rays[k].d, o = P0[k].clone().addScaledVector(d, -back(rays[k].ph)), h = hitOf(o.clone().addScaledVector(d, back(rays[k].ph)), d, rays[k].ph); if (!h) continue;
    const t = P0[k].clone().sub(h).dot(d.clone().negate()); if (t < OFF) P0[k].addScaledVector(d, -(OFF - t)); } }
  const pts = P0, metal = new THREE.MeshStandardMaterial({ color: sRGB(...D.necklace), metalness: .85, roughness: .32 });
  const line = [...pts, pts[0], pts[1]], chain = new THREE.Mesh(tubeGeom(line, line.map(() => CR), 6), metal); chain.name = 'necklaceChain'; chain.castShadow = true;
  const grp = new THREE.Group(); grp.name = 'necklace'; grp.add(chain);
  // the coins: along the front half, every 2.2 cm (2.4 on a man) of chain, the middle one larger
  const arc = [0]; for (let k = 1; k <= NR; k++) arc.push(arc[k - 1] + pts[k - 1].distanceTo(pts[k % NR])); const total = arc[NR];
  const front = [], step = man ? .024 : .022, n = man ? 7 : 9, half = (n - 1) / 2; for (let j = -half; j <= half; j++) { let s = (j * step + total) % total, k = 0; while (arc[k + 1] < s) k++; front.push({ k, f: (s - arc[k]) / (arc[k + 1] - arc[k]), mid: j === 0 }); }
  const coinMat = new THREE.MeshStandardMaterial({ color: sRGB(...D.necklace), metalness: .9, roughness: .38, map: COIN_TEX(), bumpMap: COIN_TEX(), bumpScale: 1.2 });
  const coins = []; let tris = chain.geometry.index.count / 3, stacked = 0, hangErr = 0;
  for (const c of front) { const P = pts[c.k].clone().lerp(pts[(c.k + 1) % NR], c.f), ph = rays[c.k].ph + c.f * (2 * Math.PI / NR), r = c.mid ? (man ? .011 : .012) : (man ? .0085 : .009), T = .0012, hang = r + .0035;
    // the coin's centre: the ray a little further down that lands hang below the ring, pushed out by the coin's half-thickness and 0.7 mm
    // (the last one short of it: where the surface steps, as onto the shoulder's top, the one past it can be far off)
    let Q = null, lo = 0, hi = .12; for (let it = 0; it < 14; it++) { const dh = (lo + hi) / 2, d = inAt(ph), q = hitOf(aimAt(ph, -dh), d, ph); if (!q) { hi = dh; continue; } q.addScaledVector(d, -(T / 2 + .0007)); if (q.distanceTo(P) < hang) { lo = dh; Q = q; } else hi = dh; }
    if (!Q) Q = P.clone().add(new THREE.Vector3(0, -hang, 0)); hangErr = Math.max(hangErr, Math.abs(Q.distanceTo(P) - hang));
    const tan = pts[(c.k + 1) % NR].clone().sub(pts[c.k]).normalize(), up = P.clone().sub(Q).normalize(), N = tan.clone().cross(up).normalize(); if (N.dot(radial(ph)) < 0) N.negate();
    // set out along its face until nothing it lies on comes up within its rim to its back and 0.7 mm
    for (let it = 0; it < 3; it++) { let deep = -1; eachPoint(clouds, (x, y, z) => { const dx = x - Q.x, dy = y - Q.y, dz = z - Q.z, hh = dx * N.x + dy * N.y + dz * N.z; if (hh < -.03 || hh > .02) return; if (Math.hypot(dx - N.x * hh, dy - N.y * hh, dz - N.z * hh) > r) return; deep = Math.max(deep, hh + T / 2 + .0007); }); if (deep <= 0) break; Q.addScaledVector(N, deep); }
    // where the chain runs steeply down the coins hang close: one that would cover the coin before it lies over it, as scales do
    let lifted = 0; for (const o2 of coins) if (o2.Q.distanceTo(Q) < o2.r + r + .001) { const dz = Q.clone().sub(o2.Q).dot(N); if (dz < T + .0005) { Q.addScaledVector(N, T + .0005 - dz); lifted = 1; } } stacked += lifted;
    const g = new THREE.CylinderGeometry(r, r, T, 28, 1); g.rotateX(Math.PI / 2); const m = new THREE.Mesh(g, coinMat); m.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(up.clone().cross(N).normalize(), up, N)); m.position.copy(Q); m.castShadow = true; grp.add(m);
    const ring = new THREE.Mesh(new THREE.TorusGeometry(.0026, .0006, 5, 12), metal); ring.position.copy(P).addScaledVector(up, -.0026); ring.lookAt(ring.position.clone().add(tan)); grp.add(ring);
    tris += g.index.count / 3 + ring.geometry.index.count / 3; coins.push({ Q, N, up, r, T }); }
  // the promises: nothing of what it lies on comes up through a coin (within its rim, from 3 cm behind its face to its back)
  // or through the chain (within its radius and a step along it); and how low the lowest coin hangs under the neck's base
  let coinIn = 0, coinTested = 0, chainIn = 0, chainTested = 0, low = 9, gapMin = 1;
  for (const k of coins) { low = Math.min(low, k.Q.y - k.r); let near = 1; eachPoint(clouds, (x, y, z) => { const dx = x - k.Q.x, dy = y - k.Q.y, dz = z - k.Q.z, h = dx * k.N.x + dy * k.N.y + dz * k.N.z; if (h < -.03 || h > .01) return; const pr = Math.hypot(dx - k.N.x * h, dy - k.N.y * h, dz - k.N.z * h); if (pr > k.r) return; coinTested++; if (h > -k.T / 2) coinIn++; else near = Math.min(near, -k.T / 2 - h); }); gapMin = Math.min(gapMin, near); }
  for (let k = 0; k < NR; k++) { const p = pts[k], d = rays[k].d.clone().negate(); eachPoint(clouds, (x, y, z) => { const dx = x - p.x, dy = y - p.y, dz = z - p.z; if (Math.abs(dx) > .01 || Math.abs(dy) > .01 || Math.abs(dz) > .01) return; const h = dx * d.x + dy * d.y + dz * d.z; if (h < -.02 || Math.hypot(dx - d.x * h, dy - d.y * h, dz - d.z * h) > RHO * .5) return; chainTested++; if (h > -CR) chainIn++; }); }
  let overlap = 0; for (let a = 0; a < coins.length; a++) for (let b = a + 1; b < coins.length; b++) if (coins[a].Q.distanceTo(coins[b].Q) < coins[a].r + coins[b].r && Math.abs(coins[b].Q.clone().sub(coins[a].Q).dot(coins[b].N)) < coins[a].T) overlap++;
  root.add(grp); chest.attach(grp);
  return { mesh: grp, stats: { coins: coins.length, length: +total.toFixed(3), drop: +(neck.y - low).toFixed(3), nape: +(neck.y - pts[NR / 2].y).toFixed(3), coinIn, coinTested, gap: +gapMin.toFixed(4), chainIn, chainTested, overlap, stacked, hangErr: +hangErr.toFixed(4), missed, tris, neck: neck.toArray().map(v => +v.toFixed(3)) } };
}

// ── coins hanging from the belt (Session 1004, L1; OG-056's tooled leather belt with hanging coins) ──
// A row of small struck coins, each on a ring from the belt's lower edge across the front of the body, lying on what is worn
// under it (the tunic's skirt, a long skirt, mail). The edge is the belt's own points at the bottom of what is drawn of it (rest
// y .135 to .15), the furthest out in each direction round the body; each coin's centre is found by a level ray from outside, a
// coin's hang under the ring, and is set out along its face until nothing comes up within its rim. Carried rigid by the hips' bone
// sandals (Session 1015; OG-056: leather sandals with ankle straps). The straps are a leather shell 2.5 mm off the bare foot's
// own skin, cut in the shader on the rest body (u across the foot from its middle line at rest |x| .222, outward positive):
// an ankle strap 1.6 cm wide round the narrowest of the ankle, a strap 1.7 cm wide over the ball of the foot behind the toes,
// one down the instep between them, and one up the back of the heel; nothing of it below the sole's top
const SANDAL_KEEP = '(vB.y > -.81 && ((vB.y > -.728 && vB.y < -.712) || (vB.z > .104 && vB.z < .121) || (abs(abs(vB.x) - .222) < .0065 && vB.z > .02 && vB.z < .115 && vB.y > -.8 && vB.y < -.712) || (abs(abs(vB.x) - .222) < .009 && vB.z < -.02 && vB.y < -.712)))';
const SANDAL_HOLE = `!${SANDAL_KEEP}`;
// the soles: for each foot, the posed body's points along its bottom (rest y under -.795), their outline round the foot's
// line from heel to toe (a convex hull in the ground plane) set out 4 mm, made a slab 1.4 cm deep, 1 cm under the foot's
// lowest point and 4 mm up its sides; rigid, carried by the foot's bone. The person then stands on the soles: the ground is
// otherwise read off the boots' shell (the tights' helper), which runs 2.6 cm under the bare foot. Its numbers: the slab, the
// foot's bottom points inside the outline, how far in from its edge the nearest is, the triangles, the ground
function buildSoles(G, body, byName, meshes, root) {
  const R0 = PACK.rest, PP = posedBody(body), out = { tris: 0, feet: [] }, body0 = PACK.body0 || (PACK.body0 = [...new Set(PACK.G['body'])]);
  const mat = new THREE.MeshStandardMaterial({ color: sRGB(...G.dress.sandals).multiplyScalar(.55), roughness: .7 });
  for (const [side, sg] of [['+x', 1], ['-x', -1]]) { const foot = body0.filter(i => R0[i * 3] * sg > .1 && R0[i * 3 + 1] < -.795);
    if (!foot.length) continue; const pts = foot.map(i => [PP[i * 3], PP[i * 3 + 2]]); let y0 = 1e9; for (const i of foot) y0 = Math.min(y0, PP[i * 3 + 1]);
    // the outline: Andrew's monotone chain, then each corner set out along the mean of its two edges' normals
    const s = [...pts].sort((a, b) => a[0] - b[0] || a[1] - b[1]), cr = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]), lo = [], hi = [];
    for (const p of s) { while (lo.length > 1 && cr(lo[lo.length - 2], lo[lo.length - 1], p) <= 0) lo.pop(); lo.push(p); }
    for (const p of [...s].reverse()) { while (hi.length > 1 && cr(hi[hi.length - 2], hi[hi.length - 1], p) <= 0) hi.pop(); hi.push(p); }
    const H = lo.slice(0, -1).concat(hi.slice(0, -1)), n = H.length, OUT = .004, ring = H.map((p, k) => { const a = H[(k + n - 1) % n], b = H[(k + 1) % n];
      const n1 = [p[1] - a[1], a[0] - p[0]], n2 = [b[1] - p[1], p[0] - b[0]], l1 = Math.hypot(...n1) || 1, l2 = Math.hypot(...n2) || 1, m = [n1[0] / l1 + n2[0] / l2, n1[1] / l1 + n2[1] / l2], lm = Math.hypot(...m) || 1;
      // the hull runs counter-clockwise in (x, z), so each edge's normal (dz, -dx) points out
      return [p[0] + m[0] / lm * OUT, p[1] + m[1] / lm * OUT]; });
    const yb = y0 - .01, yt = y0 + .004, pos = [], idx = []; out.ground = Math.min(out.ground ?? 9, yb);
    for (const [x, z] of ring) pos.push(x, yb, z, x, yt, z);
    const cx = ring.reduce((a, p) => a + p[0], 0) / n, cz = ring.reduce((a, p) => a + p[1], 0) / n; pos.push(cx, yb, cz, cx, yt, cz); const cb = n * 2, ct = n * 2 + 1;
    for (let k = 0; k < n; k++) { const a = k * 2, b = ((k + 1) % n) * 2; idx.push(a, b, b + 1, a, b + 1, a + 1, ct, a + 1, b + 1, cb, b, a); }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals();
    // the side walls want their own normals, so they are not smoothed into the caps: split into flat faces
    const gf = g.toNonIndexed(); gf.computeVertexNormals(); const m = new THREE.Mesh(gf, mat); m.name = 'sole'; m.castShadow = m.receiveShadow = true;
    // carried by whichever foot bone stands over it
    const fb = ['foot.L', 'foot.R'].map(k => byName[k]).sort((a, b) => Math.abs(a.getWorldPosition(new THREE.Vector3()).x - cx) - Math.abs(b.getWorldPosition(new THREE.Vector3()).x - cx))[0]; root.add(m); fb.attach(m);
    // the foot's bottom points against the outline: inside it, and their least distance in from its edge
    const inside = (x, z) => { let c = false; for (let k = 0, j = n - 1; k < n; j = k++) { const [xi, zi] = ring[k], [xj, zj] = ring[j]; if ((zi > z) !== (zj > z) && x < (xj - xi) * (z - zi) / (zj - zi) + xi) c = !c; } return c; };
    const edgeD = (x, z) => { let d = 1e9; for (let k = 0; k < n; k++) { const [ax, az] = ring[k], [bx, bz] = ring[(k + 1) % n], dx = bx - ax, dz = bz - az, t = Math.max(0, Math.min(1, ((x - ax) * dx + (z - az) * dz) / (dx * dx + dz * dz || 1))); d = Math.min(d, Math.hypot(x - ax - t * dx, z - az - t * dz)); } return d; };
    let outN = 0, near = 1e9; for (const [x, z] of pts) { if (!inside(x, z)) outN++; else near = Math.min(near, edgeD(x, z)); }
    let len = 0; for (const a of ring) for (const b of ring) len = Math.max(len, Math.hypot(a[0] - b[0], a[1] - b[1]));
    out.feet.push({ side, pts: pts.length, out: outN, near: +near.toFixed(4), len: +len.toFixed(3), corners: n, y: +yb.toFixed(4), depth: .014 }); out.tris += idx.length / 3; }
  return out;
}
// what lies round the belt's lower edge (Session 1004; shared with the Old Blood's charms, Session 1042): the edge's points, its
// middle and height, and the points of everything worn from `below` under the edge to 2 cm over it, the arms apart
function beltReach(body, meshes, root, below) {
  const R0 = PACK.rest, belt = meshes.find(m => m.name === 'belt'); if (!belt) return null;
  const BP = posedOf(belt), edgeIds = [...new Set(belt.geometry.index.array)].filter(i => R0[i * 3 + 1] > .135 && R0[i * 3 + 1] < .15);
  let cx = 0, cz = 0, yE = 0; for (const i of edgeIds) { cx += BP[i * 3]; cz += BP[i * 3 + 2]; yE += BP[i * 3 + 1]; } cx /= edgeIds.length; cz /= edgeIds.length; yE /= edgeIds.length; { let o = 0; for (const i of edgeIds) o += R0[i * 3 + 1] - .135; yE -= o / edgeIds.length; }
  const box = (x, y) => y > yE - below && y < yE + .02, CPa = [], APa = [];
  for (const m of meshes) { if (!m.isSkinnedMesh || /^(beard|moust|brows|scalp|hood|hair)/.test(m.name)) continue; const X = m === body ? posedBody(m) : posedOf(m), I = m === body ? PACK.G['body'] : m.geometry.index.array;
    for (let t = 0; t < I.length; t += 3) { const A = I[t] * 3, B = I[t + 1] * 3, Cc = I[t + 2] * 3; if (!box(X[A], X[A + 1]) && !box(X[B], X[B + 1]) && !box(X[Cc], X[Cc + 1])) continue;
      // the belt's own band, as much of it as is drawn (rest y over .135), so a coin's top is not under it
      if (m === belt && Math.min(R0[I[t] * 3 + 1], R0[I[t + 1] * 3 + 1], R0[I[t + 2] * 3 + 1]) < .135) continue;
      // the arms (rest |x| past .25: the hands hang at the thighs' sides) are only asked whether they hang in front of a coin
      const arm = m === body && Math.abs(R0[I[t] * 3]) > .25;
      for (let i = 0; i <= 4; i++) for (let j = 0; i + j <= 4; j++) { const wa = i / 4, wb = j / 4, wc = 1 - wa - wb; (arm ? APa : CPa).push(X[A] * wa + X[B] * wb + X[Cc] * wc, X[A + 1] * wa + X[B + 1] * wb + X[Cc + 1] * wc, X[A + 2] * wa + X[B + 2] * wb + X[Cc + 2] * wc); } } }
  root.updateMatrixWorld(true); root.traverse(m => { if (!m.isMesh || m.isSkinnedMesh || m.userData.shield) return; const a = m.geometry.attributes.position, v = new THREE.Vector3(); for (let i = 0; i < a.count; i++) { v.fromBufferAttribute(a, i).applyMatrix4(m.matrixWorld); if (box(v.x, v.y)) CPa.push(v.x, v.y, v.z); } });
  const CP = Float32Array.from(CPa), NC = CP.length / 3, AP = Float32Array.from(CPa.concat(APa)), NA = AP.length / 3;
  return { R0, belt, BP, edgeIds, cx, cz, yE, CP, NC, AP, NA };
}
function buildBeltCoins(G, body, byName, meshes, root) {
  const D = G.dress, hipB = byName['spine01'] || byName['spine02'], B = beltReach(body, meshes, root, .09); if (!B) return null;
  const { R0, BP, edgeIds, cx, cz, yE, CP, NC, AP, NA } = B;
  const radial = ph => new THREE.Vector3(Math.sin(ph), 0, Math.cos(ph)), angOf = (x, z) => Math.atan2(x - cx, z - cz);
  // the edge's point round the body at phi: the furthest out of the edge's points within 0.06 rad of it, taken down to the band's
  // lower edge (rest .135; the points run 1.5 cm up it, and a coin hung from one started behind the leather)
  const edgeAt = ph => { let best = null, br = 0; for (const i of edgeIds) { let da = angOf(BP[i * 3], BP[i * 3 + 2]) - ph; da = Math.atan2(Math.sin(da), Math.cos(da)); if (Math.abs(da) > .06) continue; const r = Math.hypot(BP[i * 3] - cx, BP[i * 3 + 2] - cz); if (r > br) { br = r; best = new THREE.Vector3(BP[i * 3], BP[i * 3 + 1] - (R0[i * 3 + 1] - .135), BP[i * 3 + 2]); } } return best; };
  const hitAt = (ph, y) => { const d = radial(ph).negate(), o = new THREE.Vector3(cx, y, cz).addScaledVector(d, -.4); let first = 9; for (let k = 0; k < NC; k++) { const dx = CP[k * 3] - o.x, dy = CP[k * 3 + 1] - o.y, dz = CP[k * 3 + 2] - o.z, dd = dx * d.x + dy * d.y + dz * d.z; if (dd <= 0 || dd >= first) continue; if (Math.hypot(dx - d.x * dd, dy - d.y * dd, dz - d.z * dd) < .008) first = dd; } return first < 9 ? o.addScaledVector(d, first) : null; };
  const metal = new THREE.MeshStandardMaterial({ color: sRGB(...D.beltCoins), metalness: .85, roughness: .32 }), coinMat = new THREE.MeshStandardMaterial({ color: sRGB(...D.beltCoins), metalness: .9, roughness: .38, map: COIN_TEX(), bumpMap: COIN_TEX(), bumpScale: 1.2 });
  const grp = new THREE.Group(); grp.name = 'beltCoins'; const r = .0075, T = .001, hang = r + .0035, coins = []; let tris = 0, gapMin = 1, air = 0, hidden = 0;
  // every 2.6 cm of the edge, across the front from 0.85 rad either side
  const edge0 = []; for (let ph = -.85; ph <= .8501; ph += .02) { const e = edgeAt(ph); if (e) edge0.push({ ph, e, r: Math.hypot(e.x - cx, e.z - cz) }); }
  // not where an arm's sleeve hangs over the belt's side: no point standing out more than 15% past the edge's middle radius
  const rMid = edge0.map(q => q.r).sort((a, b) => a - b)[edge0.length >> 1], edge = edge0.filter(q => q.r < rMid * 1.15);
  let run = 0, last = null; const at = []; for (const q of edge) { if (last) run += q.e.distanceTo(last.e); last = q; at.push(run); } const total = run;
  const n = Math.floor(total / .026) + 1, s0 = (total - (n - 1) * .026) / 2;
  for (let j = 0; j < n; j++) { const s = s0 + j * .026; let k = 0; while (k < at.length - 2 && at[k + 1] < s) k++; const f = Math.max(0, Math.min(1, (s - at[k]) / ((at[k + 1] - at[k]) || 1))), ph = edge[k].ph + f * (edge[k + 1].ph - edge[k].ph), E = edge[k].e.clone().lerp(edge[k + 1].e, f).addScaledVector(radial(ph), .001);
    // the coin hangs straight down from its ring, its face out from the body; where what is under the belt lies further in than the
    // belt's edge it hangs clear of it, as a coin does
    const tan = radial(ph + Math.PI / 2), up = new THREE.Vector3(0, 1, 0), N = radial(ph), Q = E.clone().addScaledVector(up, -hang);
    for (let it = 0; it < 3; it++) { let deep = -1; for (let q = 0; q < NC; q++) { const dx = CP[q * 3] - Q.x, dy = CP[q * 3 + 1] - Q.y, dz = CP[q * 3 + 2] - Q.z, hh = dx * N.x + dy * N.y + dz * N.z; if (hh < -.03 || hh > .02) continue; if (Math.hypot(dx - N.x * hh, dy - N.y * hh, dz - N.z * hh) > r) continue; deep = Math.max(deep, hh + T / 2 + .0007); } if (deep <= 0) break; Q.addScaledVector(N, deep); }
    // a coin something hangs in front of (an arm, a wide sleeve, a skirt standing further out) would only show in part: it is not hung
    let hid = false; for (let q = 0; q < NA && !hid; q++) { const dx = AP[q * 3] - Q.x, dy = AP[q * 3 + 1] - Q.y, dz = AP[q * 3 + 2] - Q.z, hh = dx * N.x + dy * N.y + dz * N.z; if (hh < T / 2 + .0005 || hh > .15) continue; if (Math.hypot(dx - N.x * hh, dy - N.y * hh, dz - N.z * hh) < r) hid = true; } if (hid) { hidden++; continue; }
    const g = new THREE.CylinderGeometry(r, r, T, 24, 1); g.rotateX(Math.PI / 2); const m = new THREE.Mesh(g, coinMat); m.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(up.clone().cross(N).normalize(), up, N)); m.position.copy(Q); m.castShadow = true; grp.add(m);
    const ring = new THREE.Mesh(new THREE.TorusGeometry(.0024, .0006, 5, 12), metal); ring.position.copy(E).addScaledVector(up, -.0022); ring.lookAt(ring.position.clone().add(tan)); grp.add(ring);
    tris += g.index.count / 3 + ring.geometry.index.count / 3; coins.push({ Q, N, r, T, ph }); }
  // the promises: nothing it lies on comes up through a coin, no two coins touch, and every coin's top is under the belt's edge
  let coinIn = 0, tested = 0, touch = 0, top = -9; for (const k of coins) { top = Math.max(top, k.Q.y + k.r - yE); for (let q = 0; q < NC; q++) { const dx = CP[q * 3] - k.Q.x, dy = CP[q * 3 + 1] - k.Q.y, dz = CP[q * 3 + 2] - k.Q.z, hh = dx * k.N.x + dy * k.N.y + dz * k.N.z; if (hh < -.03 || hh > .01) continue; if (Math.hypot(dx - k.N.x * hh, dy - k.N.y * hh, dz - k.N.z * hh) > k.r) continue; tested++; if (hh > -k.T / 2) coinIn++; else gapMin = Math.min(gapMin, -k.T / 2 - hh); } }
  for (const k of coins) { let near = .03; for (let q = 0; q < NC; q++) { const dx = CP[q * 3] - k.Q.x, dy = CP[q * 3 + 1] - k.Q.y, dz = CP[q * 3 + 2] - k.Q.z, hh = dx * k.N.x + dy * k.N.y + dz * k.N.z; if (hh > 0 || hh < -.03 || Math.hypot(dx - k.N.x * hh, dy - k.N.y * hh, dz - k.N.z * hh) > k.r) continue; near = Math.min(near, -hh); } air = Math.max(air, near); }
  for (let a = 0; a < coins.length - 1; a++) if (coins[a].Q.distanceTo(coins[a + 1].Q) < 2 * r) touch++;
  root.add(grp); hipB.attach(grp);
  return { mesh: grp, stats: { coins: coins.length, hidden, edge: +total.toFixed(3), coinIn, tested, gap: +gapMin.toFixed(4), touch, air: +air.toFixed(4), top: +top.toFixed(4), tris } };
}

// ── the Old Blood's amulet and charms on the belt (Session 1042, L1; OG-066: "a round stone-and-iron amulet on the belt, belts with
// small hanging charms") ──
// On the left hip (or the right), a round stone 4.4 cm across bound in iron (a rim round its edge, a strap down its face, a boss at
// its middle, a bail at its top) hangs 4.5 cm under the belt's lower edge on a leather thong. Beside it, each on its own shorter
// thong, a boar's tooth bound at its root (toward the front), a small iron ring and a stone bead (toward the back). Each piece hangs
// from its own point of the edge, face out from the body, pushed out as the belt coins are until nothing it lies on comes through it;
// a piece something hangs in front of (an arm, a sleeve) is left off. The thong runs straight from the edge to the piece's top.
// Carried by the hips, as the coins are. `amulet` is the stone's colour and `charms` the charms' thongs' leather; either can be worn alone.
const STONE_TEX = () => PACK.stoneTex || (PACK.stoneTex = (() => { const c = document.createElement('canvas'); c.width = c.height = 128; const x = c.getContext('2d'), rnd = seeded('amulet');
  x.fillStyle = '#9a9a9a'; x.fillRect(0, 0, 128, 128); for (let k = 0; k < 900; k++) { const v = 110 + Math.floor(rnd() * 70); x.fillStyle = `rgb(${v},${v},${v})`; x.fillRect(rnd() * 128, rnd() * 128, 1 + rnd() * 2, 1 + rnd() * 2); }
  // a groove cut round the face a little inside the iron, as a worked stone has
  x.strokeStyle = '#5a5a5a'; x.lineWidth = 4; x.beginPath(); x.arc(64, 64, 44, 0, 7); x.stroke(); const t = new THREE.CanvasTexture(c); return t; })());
function buildBeltCharms(G, body, byName, meshes, root) {
  const D = G.dress, hipB = byName['spine01'] || byName['spine02'], B = beltReach(body, meshes, root, .13); if (!B) return null;
  // under a shoulder wrap (Session 1048), whose loop turns under the arm on the other hip from its shoulder, they hang on the shoulder's side
  const { R0, BP, edgeIds, cx, cz, yE, CP, NC, AP, NA } = B, side = (shoulderWrapOn(D) ? D.shoulderWrapSide : D.amuletSide) === 'R' ? -1 : 1;
  const radial = ph => new THREE.Vector3(Math.sin(ph), 0, Math.cos(ph)), angOf = (x, z) => Math.atan2(x - cx, z - cz), up = new THREE.Vector3(0, 1, 0);
  const edgeAt = ph => { let best = null, br = 0; for (const i of edgeIds) { let da = angOf(BP[i * 3], BP[i * 3 + 2]) - ph; da = Math.atan2(Math.sin(da), Math.cos(da)); if (Math.abs(da) > .06) continue; const r = Math.hypot(BP[i * 3] - cx, BP[i * 3 + 2] - cz); if (r > br) { br = r; best = new THREE.Vector3(BP[i * 3], BP[i * 3 + 1] - (R0[i * 3 + 1] - .135), BP[i * 3 + 2]); } } return best; };
  // the edge round the front and both hips, as the coins read it, by its length from the front's left end
  const edge0 = []; for (let ph = -1.1; ph <= 1.1001; ph += .02) { const e = edgeAt(ph); if (e) edge0.push({ ph, e, r: Math.hypot(e.x - cx, e.z - cz) }); }
  const rMid = edge0.map(q => q.r).sort((a, b) => a - b)[edge0.length >> 1], edge = edge0.filter(q => q.r < rMid * 1.15);
  let run = 0, last = null; const at = []; for (const q of edge) { if (last) run += q.e.distanceTo(last.e); last = q; at.push(run); }
  const pointAt = s => { if (s < 0 || s > run) return null; let k = 0; while (k < at.length - 2 && at[k + 1] < s) k++; const f = Math.max(0, Math.min(1, (s - at[k]) / ((at[k + 1] - at[k]) || 1))), ph = edge[k].ph + f * (edge[k + 1].ph - edge[k].ph); return { ph, E: edge[k].e.clone().lerp(edge[k + 1].e, f).addScaledVector(radial(ph), .001) }; };
  // the amulet's place: where the edge passes 0.42 rad round from the front (the belt's lower edge has few points, and runs straight between them)
  let sA = 0; { const t = side * .42; for (let k = 0; k < edge.length - 1; k++) if ((edge[k].ph - t) * (edge[k + 1].ph - t) <= 0) { sA = at[k] + (t - edge[k].ph) / ((edge[k + 1].ph - edge[k].ph) || 1) * (at[k + 1] - at[k]); break; } }
  // each piece: its place along the edge from the amulet's, its thong's length, its half height and its depth (for what it lies on),
  // and how far over its middle the thong meets it
  const want = []; if (D.amulet) want.push({ kind: 'amulet', ds: 0, L: .045, r: .0265, T: .011, top: .0295 });
  if (D.charms) want.push({ kind: 'tooth', ds: -.042, L: .03, r: .013, T: .012, top: .014 }, { kind: 'ring', ds: .04, L: .026, r: .0092, T: .0034, top: .0075 }, { kind: 'bead', ds: .063, L: .036, r: .0066, T: .013, top: .0066 });
  // how far a point must move out along N so nothing it lies on comes within T/2 of it, over a disc of radius r
  const clearAt = (Q, N, r, T) => { let deep = 0; for (let q = 0; q < NC; q++) { const dx = CP[q * 3] - Q.x, dy = CP[q * 3 + 1] - Q.y, dz = CP[q * 3 + 2] - Q.z, hh = dx * N.x + dy * N.y + dz * N.z; if (hh < -.03 || hh > .03) continue; if (Math.hypot(dx - N.x * hh, dy - N.y * hh, dz - N.z * hh) > r) continue; deep = Math.max(deep, hh + T / 2 + .0005); } return deep; };
  const pieces = [], hidden = [];
  for (const w of want) { const P0 = pointAt(sA + side * w.ds); if (!P0) { hidden.push(w.kind); continue; } const { ph, E } = P0, N = radial(ph), Q = E.clone().addScaledVector(up, -(w.L + w.top));
    for (let it = 0; it < 4; it++) { let deep = -1; for (let q = 0; q < NC; q++) { const dx = CP[q * 3] - Q.x, dy = CP[q * 3 + 1] - Q.y, dz = CP[q * 3 + 2] - Q.z, hh = dx * N.x + dy * N.y + dz * N.z; if (hh < -.03 || hh > .02 + w.T) continue; if (Math.hypot(dx - N.x * hh, dy - N.y * hh, dz - N.z * hh) > w.r) continue; deep = Math.max(deep, hh + w.T / 2 + .0007); } if (deep <= 0) break; Q.addScaledVector(N, deep); }
    let hid = false; for (let q = 0; q < NA && !hid; q++) { const dx = AP[q * 3] - Q.x, dy = AP[q * 3 + 1] - Q.y, dz = AP[q * 3 + 2] - Q.z, hh = dx * N.x + dy * N.y + dz * N.z; if (hh < w.T / 2 + .0005 || hh > .15) continue; if (Math.hypot(dx - N.x * hh, dy - N.y * hh, dz - N.z * hh) < w.r) hid = true; } if (hid) { hidden.push(w.kind); continue; }
    pieces.push({ ...w, ph, E, N, Q, H: Q.clone().addScaledVector(up, w.top) }); }
  const iron = new THREE.MeshStandardMaterial({ color: sRGB(.3, .3, .32), metalness: .75, roughness: .5 }), leather = new THREE.MeshStandardMaterial({ color: sRGB(...(D.charms || D.belt || [.3, .2, .13])), roughness: .8 });
  const grp = new THREE.Group(); grp.name = 'beltCharms'; let tris = 0; const add = (g, mat, at, q, name) => { const m = new THREE.Mesh(g, mat); m.quaternion.copy(q); m.position.copy(at); m.castShadow = true; if (name) m.name = name; grp.add(m); tris += (g.index ? g.index.count : g.attributes.position.count) / 3; return m; };
  for (const p of pieces) { const q = new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(up.clone().cross(p.N).normalize(), up, p.N)), loc = v => p.Q.clone().add(v.applyQuaternion(q));
    if (p.kind === 'amulet') { const r = .022, T = .009, bev = .0025;
      const disc = new THREE.LatheGeometry([[0, -T / 2], [r - bev, -T / 2], [r, -T / 2 + bev], [r, T / 2 - bev], [r - bev, T / 2], [0, T / 2]].map(([a, b]) => new THREE.Vector2(a, b)), 32); disc.rotateX(Math.PI / 2);
      add(disc, new THREE.MeshStandardMaterial({ color: sRGB(...D.amulet), roughness: .82, map: STONE_TEX(), bumpMap: STONE_TEX(), bumpScale: 1.5 }), p.Q, q, 'amulet');
      add(new THREE.TorusGeometry(r, .0018, 6, 40), iron, p.Q, q);
      for (const z of [1, -1]) add(new THREE.BoxGeometry(.0045, 2 * (r - bev), .0012), iron, loc(new THREE.Vector3(0, 0, z * (T / 2 + .0005))), q);
      { const g = new THREE.SphereGeometry(.0034, 10, 6); g.scale(1, 1, .55); add(g, iron, loc(new THREE.Vector3(0, 0, T / 2 + .0012)), q); }
      { const g = new THREE.TorusGeometry(.0034, .0011, 5, 12); g.rotateY(Math.PI / 2); add(g, iron, loc(new THREE.Vector3(0, r + .0045, 0)), q); } }
    else if (p.kind === 'tooth') { const g = new THREE.ConeGeometry(.0038, .024, 8, 6); g.rotateZ(Math.PI); const a = g.attributes.position; for (let i = 0; i < a.count; i++) { const d = .012 - a.getY(i); a.setZ(i, a.getZ(i) + 6 * d * d - .0017); } g.computeVertexNormals();
      add(g, new THREE.MeshStandardMaterial({ color: sRGB(.86, .82, .7), roughness: .55 }), p.Q, q, 'tooth'); add(new THREE.CylinderGeometry(.0043, .0043, .004, 8), leather, loc(new THREE.Vector3(0, .0115, 0)), q); }
    else if (p.kind === 'ring') add(new THREE.TorusGeometry(.0075, .0017, 6, 18), iron, p.Q, q, 'ring');
    else { const g = new THREE.IcosahedronGeometry(.0066, 1); g.scale(1, .85, 1); add(g, new THREE.MeshStandardMaterial({ color: sRGB(.38, .14, .12), roughness: .35 }), p.Q, q, 'bead'); }
    // the thong, from the edge to the piece's top, lying over what bulges between them (a blousing tunic, the hip) as a thong does
    p.thong = []; for (let k = 0; k <= 12; k++) { const S = p.E.clone().lerp(p.H, k / 12); if (k > 0 && k < 12) S.addScaledVector(p.N, clearAt(S, p.N, .003, .0022)); p.thong.push(S); }
    for (let k = 1; k < 12; k++) { const a = p.thong[k - 1], b = p.thong[k + 1], m = a.clone().lerp(b, .5), o = p.thong[k].clone().sub(m).dot(p.N); if (o < 0) p.thong[k].addScaledVector(p.N, -o); }
    const tg = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(p.thong), 16, .0011, 5, false); add(tg, leather, new THREE.Vector3(), new THREE.Quaternion());
    p.slant = +up.angleTo(p.E.clone().sub(p.H)).toFixed(3); p.lift = Math.max(...p.thong.map((S, k) => S.clone().sub(p.E.clone().lerp(p.H, k / 12)).dot(p.N))); }
  // the promises: nothing it lies on comes up through a piece, the pieces hang near (not floating off), none touches another, every
  // piece's top is under the belt's edge, and no thong runs under what is worn
  let pieceIn = 0, tested = 0, gap = 1, air = 0, touch = 0, top = -9, thongIn = 0, thongTested = 0;
  for (const p of pieces) { top = Math.max(top, p.H.y - yE); let near = .05;
    for (let q = 0; q < NC; q++) { const dx = CP[q * 3] - p.Q.x, dy = CP[q * 3 + 1] - p.Q.y, dz = CP[q * 3 + 2] - p.Q.z, hh = dx * p.N.x + dy * p.N.y + dz * p.N.z; if (hh < -.05 || hh > .01 + p.T) continue; if (Math.hypot(dx - p.N.x * hh, dy - p.N.y * hh, dz - p.N.z * hh) > p.r) continue; tested++; if (hh > -p.T / 2) pieceIn++; else { gap = Math.min(gap, -p.T / 2 - hh); near = Math.min(near, -p.T / 2 - hh); } }
    air = Math.max(air, near);
    for (let k = 2; k <= 10; k++) { const S = p.thong[k]; thongTested++; for (let q = 0; q < NC; q++) { const dx = CP[q * 3] - S.x, dy = CP[q * 3 + 1] - S.y, dz = CP[q * 3 + 2] - S.z, hh = dx * p.N.x + dy * p.N.y + dz * p.N.z; if (hh < .0012 || hh > .03) continue; if (Math.hypot(dx - p.N.x * hh, dy - p.N.y * hh, dz - p.N.z * hh) < .003) { thongIn++; break; } } } }
  for (let a = 0; a < pieces.length; a++) for (let b = a + 1; b < pieces.length; b++) if (pieces[a].Q.distanceTo(pieces[b].Q) < pieces[a].r + pieces[b].r + .002) touch++;
  root.add(grp); hipB.attach(grp);
  return { mesh: grp, stats: { pieces: pieces.map(p => p.kind), hidden, ph: pieces.map(p => +p.ph.toFixed(2)), slant: Math.max(0, ...pieces.map(p => p.slant)), lift: +Math.max(0, ...pieces.map(p => p.lift)).toFixed(4), pieceIn, tested, gap: +gap.toFixed(4), air: +air.toFixed(4), touch, top: +top.toFixed(4), thongIn, thongTested, low: +Math.min(...pieces.map(p => p.Q.y - p.r - yE)).toFixed(3), tris } };
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
  const R0 = PACK.rest, tris = BROW_TRIS(), S = browShape(G), Sc = G.scar ? scarLine(G.scar) : null, out = { tried: 0, roots: 0, lift: 0, headUp: 0, headN: 0, over: 0, scarGap: 0 };
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
    // a scar across the brow (Session 1079) leaves a gap in it: no hair roots within 2.8 mm of its line
    if (Sc && scarDist(Sc, sg * x, y).d < .0028) { out.scarGap++; continue; }
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
  return { mesh, stats: { hairs: idx.length / 18, tried: out.tried, roots: out.roots, lift: +out.lift.toFixed(4), headUp: +(out.headUp / Math.max(1, out.headN)).toFixed(3), over: +out.over.toFixed(4), scarGap: out.scarGap, tris: idx.length / 3 } };
}
// how much of a brow lies over a point of the unmorphed face (0 to 1), for the skin's shade
function browCover(S, x, y) { const ax = Math.abs(x); if (ax < S.x0 - .003 || ax > S.x1 + .003) return 0; const t = Math.max(0, Math.min(1, (ax - S.x0) / (S.x1 - S.x0))), q = S.at(t);
  const m = Math.min(y - q.low, q.low + q.h - y), e = Math.min(ax - S.x0, S.x1 - ax); return Math.max(0, Math.min(1, (m + .0015) / .003)) * Math.max(0, Math.min(1, (e + .002) / .004)); }

// ── the bodice's lacing (Session 888): a cord crossing the front opening between seven pairs of eyelets, from the waist up
// The eyelets are the bodice's own points nearest each rest place (1.3 cm either side of the middle), read on the posed
// shell and lifted 3 mm off it along its normal; each crossing runs straight between them, bowed out a little over the gap.
function buildLacing(G, meshes) {
  const D = G.dress, bod = meshes.find(m => m.name === 'bodice'), R0 = PACK.rest, BP = posedOf(bod), pg = new THREE.BufferGeometry(); pg.setAttribute('position', new THREE.BufferAttribute(BP, 3)); pg.setIndex(bod.geometry.index); pg.computeVertexNormals();
  const N = pg.attributes.normal.array, front = [...new Set(PACK.R.bodice)].filter(i => R0[i * 3 + 2] > .03 && Math.abs(R0[i * 3]) < .04 && R0[i * 3 + 1] > .18 && R0[i * 3 + 1] < .5);
  const near = (x, y) => { let bd = 1e9, b = -1; for (const i of front) { const d = (R0[i * 3] - x) ** 2 + (R0[i * 3 + 1] - y) ** 2; if (d < bd) { bd = d; b = i; } } return b; };
  const lift = (i, h) => new THREE.Vector3(BP[i * 3] + N[i * 3] * h, BP[i * 3 + 1] + N[i * 3 + 1] * h, BP[i * 3 + 2] + N[i * 3 + 2] * h);
  const NE = 7, eye = []; for (let k = 0; k < NE; k++) { const y = .23 + (.45 - .23) * k / (NE - 1); eye.push([lift(near(-.013, y), .003), lift(near(.013, y), .003)]); }
  const pts = [], mat = lockMat(sRGB(...(D.lace || [.25, .18, .12]))), out = [];
  // every point of the lacing at least 4.5 mm in front of the shell under it (its nearest point, along that point's normal), so
  // a crossing never runs behind the cloth where the bust curves away under it
  const all = [...new Set(PACK.R.bodice)], out_ = q => { let bd = 1e9, b = -1; for (const i of all) { const d = (BP[i * 3] - q.x) ** 2 + (BP[i * 3 + 1] - q.y) ** 2 + (BP[i * 3 + 2] - q.z) ** 2; if (d < bd) { bd = d; b = i; } }
    const h = (q.x - BP[b * 3]) * N[b * 3] + (q.y - BP[b * 3 + 1]) * N[b * 3 + 1] + (q.z - BP[b * 3 + 2]) * N[b * 3 + 2]; if (h < .0045) q.add(new THREE.Vector3(N[b * 3], N[b * 3 + 1], N[b * 3 + 2]).multiplyScalar(.0045 - h)); return q; };
  const seg = (a, b) => { const line = []; for (let t = 0; t <= 8; t++) { const q = out_(a.clone().lerp(b, t / 8)); line.push(q); pts.push(q); } return line; };
  for (let k = 0; k < NE - 1; k++) for (const [a, b] of [[eye[k][0], eye[k + 1][1]], [eye[k][1], eye[k + 1][0]]]) { const m = new THREE.Mesh(tubeGeom(seg(a, b), new Array(9).fill(.0022), 6, 30), mat); m.name = 'lacing'; out.push(m); }
  // a bow at the top: two loops and two short tails
  { const top = eye[NE - 1][0].clone().lerp(eye[NE - 1][1], .5); top.z += .003;
    for (const sx of [-1, 1]) { const loop = []; for (let t = 0; t <= 12; t++) { const a = Math.PI * 2 * t / 12; loop.push(top.clone().add(new THREE.Vector3(sx * (.009 + .009 * Math.cos(a + Math.PI)) , .005 * Math.sin(a), .002 + .001 * Math.sin(a)))); }
      const tail = [top.clone(), top.clone().add(new THREE.Vector3(sx * .006, -.025, .004)), top.clone().add(new THREE.Vector3(sx * .009, -.045, .003))];
      for (const L of [loop, tail]) { for (let it = 0; it < 2; it++) for (const q of L) out_(q); const m = new THREE.Mesh(tubeGeom(L, new Array(L.length).fill(.002), 6), mat); m.name = 'lacing'; out.push(m); pts.push(...L); } } }
  for (const m of out) { m.castShadow = m.receiveShadow = true; m.frustumCulled = false; }
  // the checks' number: how far the lacing stands in front of the bodice under it (the nearest of its points, along that point's normal)
  let clear = 1; for (const q of pts) { let bd = 1e9, b = -1; for (const i of all) { const d = (BP[i * 3] - q.x) ** 2 + (BP[i * 3 + 1] - q.y) ** 2 + (BP[i * 3 + 2] - q.z) ** 2; if (d < bd) { bd = d; b = i; } }
    clear = Math.min(clear, (q.x - BP[b * 3]) * N[b * 3] + (q.y - BP[b * 3 + 1]) * N[b * 3 + 1] + (q.z - BP[b * 3 + 2]) * N[b * 3 + 2] - .0022); }
  return { meshes: out, stats: { eyelets: NE * 2, crossings: (NE - 1) * 2, clear: +clear.toFixed(4), span: +(eye[NE - 1][0].y - eye[0][0].y).toFixed(3) } };
}
// ── the robe's cord (Session 887): a rope round the waist, tied at the front to one side, its two ends hanging down the skirt
// Built after the pose from the posed tunic and skirt, like the tabard: a ring over the tunic at the waist, pushed clear of
// the furthest cloth in each direction, and two ends that follow the skirt's front down, with a knot at each tip.
// the kettle helm (Session 897; OG-019's Iron tier: mail and a kettle helm). A rigid iron hat carried by the head bone. Its dome
// is fitted to the skull round a centre at the rim's height: in 72 directions round and 24 down, the furthest point of the head,
// spread to its neighbours and smoothed, then 1.2 cm more (the hair's shell is 2.5 mm, the hair itself tucked as under a hood), so
// it is as close as a hat beaten to the head and never inside it. (An ellipsoid grown until it cleared the occiput came out 31 cm
// deep.) Its rim runs a little over the brows at the front, above the ears at the sides and 4.5 cm lower at the nape; a band
// round the rim, and a brim 4.2 cm wide sloping 30 degrees down with a rolled edge. Its numbers: the head's nearest point to the
// dome, and how many points of the face below the rim rise into the brim
// the dome fitted to the skull round a centre c (Session 897's, for the kettle helm; shared with the head-wrap since Session 994): in 72
// directions round and 24 down, the furthest point of the head above the rim line rimY(θ), and of the tucked hair (4 mm clear, under
// the dome's own clearance CL), spread to its neighbours and smoothed. at(θ, φ, off) is a point on it, phRim(θ) the rim's polar angle
function headDome(P, hv, c, rimY, hairPts, CL) {
  const V = i => new THREE.Vector3(P[i * 3], P[i * 3 + 1], P[i * 3 + 2]);
  const thOf = (x, z) => Math.atan2(x - c.x, z - c.z), under = i => P[i * 3 + 1] > rimY(thOf(P[i * 3], P[i * 3 + 2])) - .004;
  const NT = 72, NB = 24, PH = Math.PI * .75, M = new Float32Array(NT * NB), bin = (th, ph) => [((Math.round((th / (Math.PI * 2)) * NT) % NT) + NT) % NT, Math.max(0, Math.min(NB - 1, Math.round(ph / PH * (NB - 1))))];
  const put = (p, extra) => { const d = p.clone().sub(c), r = d.length(), [a, b] = bin(Math.atan2(d.x, d.z), Math.acos(d.y / r)); M[b * NT + a] = Math.max(M[b * NT + a], r + extra); };
  for (const i of hv) if (under(i)) put(V(i), 0);
  // the hair left under it (tucked short) clears it by 4 mm: its points stand in for the head's, less the 1.2 cm
  for (const p of hairPts) if (p.y > rimY(thOf(p.x, p.z)) - .004) put(p, .004 - CL);
  // spread each bin's furthest point over its neighbours (so no point falls between two bins' surfaces), fill the empty bins from
  // the nearest row above, then smooth four times, never below the spread value
  const pass = (S, f) => { const O = new Float32Array(S.length); for (let b = 0; b < NB; b++) for (let a = 0; a < NT; a++) O[b * NT + a] = f(a, b, (da, db) => S[Math.max(0, Math.min(NB - 1, b + db)) * NT + (a + da + NT) % NT]); return O; };
  let S = pass(M, (a, b, at) => { let m = 0; for (let da = -3; da <= 3; da++) for (let db = -2; db <= 2; db++) m = Math.max(m, at(da, db)); return m; });
  for (let b = 1; b < NB; b++) for (let a = 0; a < NT; a++) if (!S[b * NT + a]) S[b * NT + a] = S[(b - 1) * NT + a];
  for (let b = NB - 2; b >= 0; b--) for (let a = 0; a < NT; a++) if (!S[b * NT + a]) S[b * NT + a] = S[(b + 1) * NT + a];
  const floor = S; for (let k = 0; k < 4; k++) S = pass(S, (a, b, at) => { let t = 0; for (let da = -2; da <= 2; da++) for (let db = -1; db <= 1; db++) t += at(da, db); return Math.max(floor[b * NT + a], t / 15); });
  const R = (th, ph) => { const u = ((th / (Math.PI * 2)) * NT % NT + NT) % NT, v = Math.max(0, Math.min(NB - 1.001, ph / PH * (NB - 1))), a = Math.floor(u), b = Math.floor(v), fu = u - a, fv = v - b, g = (aa, bb) => S[bb * NT + (aa % NT)];
    return (g(a, b) * (1 - fu) + g(a + 1, b) * fu) * (1 - fv) + (g(a, b + 1) * (1 - fu) + g(a + 1, b + 1) * fu) * fv + CL; };
  const at = (th, ph, off = 0) => { const r = R(th, ph) + off; return new THREE.Vector3(c.x + r * Math.sin(ph) * Math.sin(th), c.y + r * Math.cos(ph), c.z + r * Math.sin(ph) * Math.cos(th)); };
  const phRim = th => { let lo = 0, hi = PH; for (let k = 0; k < 24; k++) { const m = (lo + hi) / 2; if (at(th, m).y > rimY(th)) lo = m; else hi = m; } return (lo + hi) / 2; };
  return { NT, NB, PH, R, at, phRim, thOf, under };
}
function buildHelm(P, G, heads, byName, hairPts = []) {
  const R0 = PACK.rest, hv = PACK.headV || (PACK.headV = [...new Set(PACK.G['body'])].filter(i => R0[i * 3 + 1] > .6)), V = i => new THREE.Vector3(P[i * 3], P[i * 3 + 1], P[i * 3 + 2]);
  let by = 0, bn = 0; for (const i of hv) if (Math.abs(R0[i * 3]) < .05 && R0[i * 3 + 2] > .08 && R0[i * 3 + 1] > .785 && R0[i * 3 + 1] < .8) { by += P[i * 3 + 1]; bn++; } by /= bn;
  const bb = new THREE.Box3(); for (const i of hv) if (R0[i * 3 + 1] > .755) bb.expandByPoint(V(i));
  const c = bb.getCenter(new THREE.Vector3()), CL = .012, rimY = th => by - .004 - .012 * Math.sin(th) ** 2 - .045 * Math.max(0, -Math.cos(th)) ** 1.5; c.y = by - .045;
  const { NT, R, at, phRim, thOf, under } = headDome(P, hv, c, rimY, hairPts, CL);
  const NP = 14, W = .042, SL = Math.tan(30 * Math.PI / 180), pos = [], idx = [], RIM = Array.from({ length: NT + 1 }, (_, t) => phRim(t / NT * Math.PI * 2));
  const grid = (rows, f) => { const b0 = pos.length / 3; for (let j = 0; j < rows; j++) for (let t = 0; t <= NT; t++) { const p = f(t / NT * Math.PI * 2, j / (rows - 1), t); pos.push(p.x, p.y, p.z); }
    for (let j = 0; j < rows - 1; j++) for (let t = 0; t < NT; t++) { const a = b0 + j * (NT + 1) + t, d = a + NT + 1; idx.push(a, d, a + 1, a + 1, d, d + 1); } };
  // the dome, from the crown to the rim; the band, 1.5 cm proud by 2.5 mm; the brim, its top and its underside; the rolled edge
  grid(NP, (th, t, k) => at(th, RIM[k] * Math.max(.002, t)));
  grid(2, (th, t, k) => { if (t > .5) return at(th, RIM[k], .0025); let lo = 0, hi = RIM[k]; for (let n = 0; n < 20; n++) { const m = (lo + hi) / 2; if (at(th, m, .0025).y > rimY(th) + .015) lo = m; else hi = m; } return at(th, lo, .0025); });
  const brimAt = (th, s, dy, k) => { const p = at(th, RIM[k], .0025), d = new THREE.Vector3(p.x - c.x, 0, p.z - c.z).normalize(); return p.addScaledVector(d, s * W).add(new THREE.Vector3(0, -s * W * SL + dy, 0)); };
  grid(4, (th, t, k) => brimAt(th, t, 0, k)); grid(4, (th, t, k) => brimAt(th, 1 - t, -.003, k));
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals();
  const edge = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(Array.from({ length: NT }, (_, t) => brimAt(t / NT * Math.PI * 2, 1, -.0015, t)), true), NT * 2, .0035, 8, true);
  const iron = new THREE.MeshStandardMaterial({ color: sRGB(...G.dress.helm), metalness: .5, roughness: .4, side: THREE.DoubleSide }), hm = new THREE.Group(); hm.name = 'helm';
  const ext = new THREE.Box3(); for (let t = 0; t < NT; t++) ext.expandByPoint(at(t / NT * Math.PI * 2, RIM[t]));
  // the numbers, before the pieces move to the head bone: the nearest point of the head under the dome, and the face under the brim
  let hairOut = 0; for (const p of hairPts) { const d = p.clone().sub(c), r = d.length(); if (p.y > rimY(thOf(p.x, p.z)) && r > R(Math.atan2(d.x, d.z), Math.acos(d.y / r)) - .002) hairOut++; }
  let gap = 1, face = 0, nf = 0; for (const i of hv) { const p = V(i), d = p.clone().sub(c), r = d.length(), th = Math.atan2(d.x, d.z);
    if (under(i)) { gap = Math.min(gap, R(th, Math.acos(d.y / r)) - r); continue; } nf++;
    const k = Math.round((th / (Math.PI * 2) * NT % NT + NT) % NT), r0 = at(th, RIM[k], .0025), rr = Math.hypot(r0.x - c.x, r0.z - c.z), rp = Math.hypot(d.x, d.z);
    if (rp > rr && rp < rr + W && p.y > rimY(th) - (rp - rr) * SL - .005) face++; }
  for (const geo of [g, edge]) { geo.translate(-heads['head'].x, -heads['head'].y, -heads['head'].z); const m = new THREE.Mesh(geo, iron); m.castShadow = m.receiveShadow = true; hm.add(m); }
  byName['head'].add(hm);
  return { mesh: hm, stats: { gap: +gap.toFixed(4), face, facePts: nf, hairOut, hairPts: hairPts.length, tris: (idx.length + edge.index.count) / 3, width: +(ext.max.x - ext.min.x).toFixed(3), depth: +(ext.max.z - ext.min.z).toFixed(3) } };
}
function shieldTex(col, paint, wood, metal = false) {
  const c = document.createElement('canvas'); c.width = c.height = 512; const x = c.getContext('2d'), rnd = seeded('shield'), css = (k, v) => `rgb(${k.map(t => Math.round(Math.max(0, Math.min(1, t * v)) * 255)).join(',')})`;
  for (let b = 0; b < 7; b++) { const x0 = b * 512 / 7, v = .9 + rnd() * .16; x.fillStyle = css(wood, v); x.fillRect(x0, 0, 512 / 7 + 1, 512);
    // the grain, and the seam between two boards
    for (let k = 0; k < 14; k++) { x.strokeStyle = css(wood, v * (.8 + rnd() * .1)); x.lineWidth = .6 + rnd(); x.beginPath(); const gx = x0 + rnd() * 512 / 7; x.moveTo(gx, 0); for (let y = 0; y <= 512; y += 32) x.lineTo(gx + Math.sin(y / 60 + k) * 2.5, y); x.stroke(); }
    x.fillStyle = 'rgba(0,0,0,.55)'; x.fillRect(x0 - 1, 0, 2, 512); }
  if (col) { const wood0 = x.getImageData(0, 0, 512, 512), d = wood0.data, ca = col, cb = paint || col, wm = (wood[0] + wood[1] + wood[2]) / 3;
    // a metal face's dints (Session 906): 220 hammer blows at random from the seeded stream, each a soft hollow with a bright lip
    let dint = null; if (metal) { const c2 = document.createElement('canvas'); c2.width = c2.height = 512; const y2 = c2.getContext('2d'); y2.fillStyle = '#c0c0c0'; y2.fillRect(0, 0, 512, 512);
      for (let k = 0; k < 220; k++) { const px = rnd() * 512, py = rnd() * 512, r = 5 + rnd() * 12, gr = y2.createRadialGradient(px, py, 0, px, py, r); gr.addColorStop(0, 'rgba(0,0,0,.28)'); gr.addColorStop(.7, 'rgba(0,0,0,.06)'); gr.addColorStop(.86, 'rgba(255,255,255,.22)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); y2.fillStyle = gr; y2.fillRect(px - r, py - r, 2 * r, 2 * r); }
      dint = y2.getImageData(0, 0, 512, 512).data; }
    for (let y = 0; y < 512; y++) for (let i = 0; i < 512; i++) { const k = (y * 512 + i) * 4, u = i / 256 - 1, v = y / 256 - 1, r = Math.hypot(u, v), q = paint && (u > 0) !== (v > 0) ? cb : ca;
      // the paint over the boards: the seams and the grain show through a little, and it is worn back to the wood at the rim; a metal face shows hammer dints instead
      const g = metal ? dint[k] / 192 : (d[k] + d[k + 1] + d[k + 2]) / (3 * 255 * wm), wear = metal ? 0 : Math.max(0, Math.min(1, (r - .9) / .1)) * (.4 + .6 * Math.abs(Math.sin(i * .37 + y * .11)));
      for (let ch = 0; ch < 3; ch++) d[k + ch] = Math.round(255 * Math.max(0, Math.min(1, (q[ch] * (.75 + .25 * g)) * (1 - wear) + d[k + ch] / 255 * wear))); }
    x.putImageData(wood0, 0, 0); }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t;
}
// what a person and their clothes are, posed, as clouds of points: the body, each garment's shell, and the pieces built after the pose
// (a cloak, a tabard, a cord). A garment's shell holds every point of the body, but only those its triangles use are cloth (less
// what its shader cuts: the mail's sleeves past the elbow, its skirt below the knee); a skinned cloud keeps its points' rest index,
// so an arm is known. The hair is left out unless asked for
function wornClouds(body, meshes, root, hair = false) {
  const R0 = PACK.rest, clouds = []; root.updateMatrixWorld(true);
  for (const m of meshes) if (m.isSkinnedMesh && !/^(beard|moust|brows|scalp)/.test(m.name) && (hair || m.name !== 'hair')) { const X = m === body ? posedBody(m) : posedOf(m);
    const used = m.userData.used || (m.userData.used = m === body ? [...new Set(PACK.G['body'])] : m.name === 'hair' ? null : [...new Set(m.geometry.index.array)].filter(v => m.name === 'mail' ? Math.abs(R0[v * 3]) < (m.material.userData.cut?.[2] ?? .3) : m.name === 'mailSkirt' ? R0[v * 3 + 1] > (m.material.userData.cut?.[0] ?? -.27) : true));
    clouds.push({ X, ids: used }); }
  root.traverse(m => { if (!m.isMesh || m.isSkinnedMesh || m.userData.shield) return; const a = m.geometry.attributes.position, v = new THREE.Vector3(), o = new Float32Array(a.count * 3); for (let i = 0; i < a.count; i++) { v.fromBufferAttribute(a, i).applyMatrix4(m.matrixWorld); o[i * 3] = v.x; o[i * 3 + 1] = v.y; o[i * 3 + 2] = v.z; } clouds.push({ X: o, ids: null }); });
  return clouds;
}
const eachPoint = (clouds, f) => { for (const { X, ids } of clouds) { const cnt = ids ? ids.length : X.length / 3; for (let k = 0; k < cnt; k++) { const i = ids ? ids[k] : k; f(X[i * 3], X[i * 3 + 1], X[i * 3 + 2], ids ? i : -1); } } };
// the round shield (Session 904; OG-019's heavy line carries one at every tier, OG-025's hold guards a painted round and OG-044's
// guards a bronze one). Seven boards under a painted face (quartered in a second colour if it has one), a rawhide rim and an iron
// boss. Built in its own frame: x across, y up, z out of its face, its back at z 0, the face dished 8 mm toward the boss
const SHIELD_R = .36, SHIELD_HOLE = .062, SHIELD_DOME = .0275;
function shieldParts(D, gripZ = -.011) {
  const R = SHIELD_R, NT = 72, NR = 14, HOLE = SHIELD_HOLE, zF = r => .01 + .008 * (1 - (r / R) ** 2), pos = [], uv = [], idx = [], pos2 = [], uv2 = [], idx2 = [];
  for (let j = 0; j < NR; j++) for (let t = 0; t <= NT; t++) { const r = HOLE + (R - HOLE) * j / (NR - 1), a = t / NT * Math.PI * 2, x = r * Math.cos(a), y = r * Math.sin(a);
    pos.push(x, y, zF(r)); uv.push(x / R * .5 + .5, y / R * .5 + .5); pos2.push(x, y, 0); uv2.push(x / R * .5 + .5, y / R * .5 + .5); }
  for (let j = 0; j < NR - 1; j++) for (let t = 0; t < NT; t++) { const a = j * (NT + 1) + t, b = a + NT + 1; idx.push(a, b, a + 1, a + 1, b, b + 1); idx2.push(a, a + 1, b, a + 1, b + 1, b); }
  const geo = (p, u, i) => { const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(p, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(u, 2)); g.setIndex(i); g.computeVertexNormals(); return g; };
  const woodC = [.46, .33, .2], iron = sRGB(...(D.helm || [.42, .43, .45]));
  // a bronze face (OG-044's Compact guards): sheet metal beaten over the boards, so no seam shows and it takes the light as the helm does
  const face = new THREE.Mesh(geo(pos, uv, idx), new THREE.MeshStandardMaterial({ map: shieldTex(D.shield, D.shieldPaint, woodC, !!D.shieldMetal), roughness: D.shieldMetal ? .36 : .78, metalness: D.shieldMetal ? .55 : 0 }));
  const backM = new THREE.Mesh(geo(pos2, uv2, idx2), new THREE.MeshStandardMaterial({ map: shieldTex(null, null, woodC.map(v => v * .8)), roughness: .9 }));
  // the boss: a flange nailed over the hole, and a dome 5.5 cm proud of the face
  const prof = [new THREE.Vector2(.092, zF(.092) + .0005), new THREE.Vector2(.09, zF(.09) + .003), new THREE.Vector2(.064, zF(.064) + .004)];
  for (let k = 0; k <= 12; k++) { const p = k / 12 * Math.PI / 2; prof.push(new THREE.Vector2(.058 * Math.cos(p) + .0001, zF(.06) + .012 + .045 * Math.sin(p))); }
  const bg = new THREE.LatheGeometry(prof, 40); bg.rotateX(Math.PI / 2); bg.computeVertexNormals();
  const metal = new THREE.MeshStandardMaterial({ color: iron, metalness: .55, roughness: .38, side: THREE.DoubleSide }), boss = new THREE.Mesh(bg, metal);
  // the rim: rawhide stitched over the edge, and eight rivets round the boss's flange
  const rim = new THREE.Mesh(new THREE.TorusGeometry(R, .0072, 8, 120), new THREE.MeshStandardMaterial({ color: sRGB(...(D.shieldRim || [.3, .21, .13])), roughness: .7 })); rim.position.z = .0055;
  // the grip: an ash bar across the hole on the back, where the fist closes on it, standing on a cleat either side of the hole (Session 906)
  const ash = new THREE.MeshStandardMaterial({ color: sRGB(...woodC.map(v => v * .85)), roughness: .85 }), GL = HOLE * 2 + .07;
  const grip = new THREE.Mesh(new THREE.CylinderGeometry(.011, .011, GL, 12), ash); grip.rotation.z = Math.PI / 2; grip.position.z = gripZ;
  const sh = new THREE.Group(); sh.name = 'shield'; sh.add(face, backM, boss, rim, grip);
  for (const s of [-1, 1]) { const h = -gripZ + .011, cl = new THREE.Mesh(new THREE.BoxGeometry(.024, .03, h), ash); cl.position.set(s * (GL / 2 - .012), 0, -h / 2); sh.add(cl); }
  for (let k = 0; k < 8; k++) { const a = k / 8 * Math.PI * 2, rv = new THREE.Mesh(new THREE.SphereGeometry(.0055, 10, 6, 0, Math.PI * 2, 0, Math.PI / 2), metal); rv.rotation.x = Math.PI / 2; rv.position.set(.077 * Math.cos(a), .077 * Math.sin(a), zF(.077) + .003); sh.add(rv); }
  sh.traverse(m => { if (m.isMesh) { m.castShadow = m.receiveShadow = true; m.userData.shield = true; } });
  return sh;
}
// the furthest of the clouds' points along N within the shield's rim, round a centre (the arm's points apart, if asked)
// and the furthest of the hand's points that are inside the boss's hole, which do not count against the board (the fist goes into the boss)
function shieldBack(clouds, C, N, armOf = () => false, handOf = () => false) {
  let other = -1, arm = -1, hole = -1, n = 0;
  eachPoint(clouds, (x, y, z, i) => { const dx = x - C.x, dy = y - C.y, dz = z - C.z, dd = dx * N.x + dy * N.y + dz * N.z, rr = Math.hypot(dx - N.x * dd, dy - N.y * dd, dz - N.z * dd);
    if (dd < -.3 || rr > SHIELD_R + .012) return; n++; if (i >= 0 && handOf(i) && rr < SHIELD_HOLE - .008) { hole = Math.max(hole, dd); return; } if (i >= 0 && armOf(i)) arm = Math.max(arm, dd); else other = Math.max(other, dd); });
  return { other, arm, hole, n };
}
// the promise, read back off the shield where its bone carries it: no point of the person or what they wear (or of the strap)
// inside its board, its rim or its boss (in its own frame: within 7.4 cm in front of its back and 3 mm behind it, inside its rim)
function shieldInside(sh, clouds, root) {
  root.updateMatrixWorld(true); const inv = sh.matrixWorld.clone().invert(), v = new THREE.Vector3(); let inside = 0, near = 1;
  // (within the boss's hole only the dome counts: a knuckle may go into its hollow up to its base, 2.75 cm in front of the back)
  eachPoint(clouds, (x, y, z) => { v.set(x, y, z).applyMatrix4(inv); const r = Math.hypot(v.x, v.y); if (r > SHIELD_R + .008 || v.z < -.05 || v.z > .074) return; if (r < SHIELD_HOLE - .004) { if (v.z > SHIELD_DOME - .002) inside++; return; } near = Math.min(near, -v.z); if (v.z > -.003) inside++; });
  return { inside, near: +near.toFixed(4) };
}
// the fingers' hinge (Session 912): the knuckles' line, from the little finger's knuckle to the first finger's, in the metacarpals'
// frame (every finger bone hangs off its metacarpal unturned, so one axis serves all twelve). The bones' own z, about which the
// hand poses curl, is 36° off it in this skeleton: a curl about z is a curl and a sideways twist. A right hand closes turning
// positively about the line, a left hand negatively (the lines are mirrored, the curls are not)
function fistHinge(byName, root, side) {
  root.updateMatrixWorld(true); const at = n => new THREE.Vector3().setFromMatrixPosition(byName[n].matrixWorld);
  return at(`finger2-1.${side}`).sub(at(`finger5-1.${side}`)).normalize().applyQuaternion(byName[`metacarpal2.${side}`].getWorldQuaternion(new THREE.Quaternion()).invert());
}
// a fist closed on a grip (the shields', Session 906): the four fingers' joints bent 1.15, 1.35 and 0.95 rad about their hinge, the thumb as it was
function closeFist(byName, root, side, k = 1) {
  const h = fistHinge(byName, root, side), sg = side === 'R' ? 1 : -1;
  for (let f = 2; f <= 5; f++) for (let j = 1; j <= 3; j++) { const b = byName[`finger${f}-${j}.${side}`]; if (b) b.quaternion.setFromAxisAngle(h, sg * k * [1.15, 1.35, .95][j - 1]); }
  root.updateMatrixWorld(true);
}
// held: a centre grip in the left fist with the arm hanging, so the shield hangs at the side with its face turned 1 rad forward
// from the side (OG-019 draws them nearly face on). A rigid piece carried by the left wrist. Its back is laid 5 mm outside the
// furthest point of whatever lies within its rim (the hand and forearm on the grip, the hip, a skirt, mail, a tabard); where
// something other than the arm is that point, the arm is lifted out from the side 0.03 rad at a time, as for a long skirt.
// Its numbers: what is inside it read back off the wrist, the nearest point behind it, the arm's gap to its back, the lift
function buildShield(G, body, byName, meshes, root) {
  const D = G.dress, R = SHIELD_R, TURN = D.shieldTurn ?? 1, CLEAR = .005, R0 = PACK.rest, q = (ax, ay, az) => new THREE.Quaternion().setFromEuler(new THREE.Euler(ax, ay, az, 'XYZ'));
  const wrist = byName['wrist.L'], elbow = byName['lowerarm01.L'], armOf = i => R0[i * 3] > .3, handOf = i => R0[i * 3] > .415;
  // the left hand closes on the grip (Session 906): the four fingers curled to a fist, the thumb as it was
  closeFist(byName, root, 'L');
  let place = null, lift = 0;
  for (let k = 0; k <= 10; k++) {
    const clouds = wornClouds(body, meshes, root);
    const e = new THREE.Vector3().setFromMatrixPosition(elbow.matrixWorld), w = new THREE.Vector3().setFromMatrixPosition(wrist.matrixWorld), A = w.clone().sub(e).normalize();
    const O = new THREE.Vector3(1, 0, 0).addScaledVector(A, -A.x).normalize(), F = new THREE.Vector3().crossVectors(A, O); if (F.z < 0) F.negate();
    const N = O.clone().multiplyScalar(Math.cos(TURN)).addScaledVector(F, Math.sin(TURN)).normalize(), U = A.clone().negate(), S = new THREE.Vector3().crossVectors(U, N);
    // the grip is in the fist: the boss is centred on the middle of the four fingers' second joints, and the knuckles go into its
    // hollow, up to a centimetre short of the dome's base
    const G0 = new THREE.Vector3(); for (let f = 2; f <= 5; f++) G0.add(new THREE.Vector3().setFromMatrixPosition(byName[`finger${f}-2.L`].matrixWorld)); G0.divideScalar(4);
    const { other, arm, hole, n } = shieldBack(clouds, G0, N, armOf, handOf), back = Math.max(arm + CLEAR, other + CLEAR, hole - SHIELD_DOME + .01);
    place = { G0, N, U, S, back, armGap: Math.max(0, other - arm), inHole: +(hole - back).toFixed(4), tested: n };
    if (other <= arm || k === 10) break;
    lift += .03; byName['upperarm01.L'].quaternion.multiply(q(0, 0, .03));
  }
  // the grip at the fist's own depth: 8 mm behind its furthest knuckle (the forearm, thicker than the fist, holds the board off it), up to 7 cm off the board (Session 912: 4.5 until the fist closed on its true hinge)
  const { G0, N, U, S, back } = place, sh = shieldParts(D, Math.max(-.07, Math.min(-.011, place.inHole - .008)));
  sh.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(S, U, N)); sh.position.copy(G0).addScaledVector(N, back); root.add(sh); root.updateMatrixWorld(true); wrist.attach(sh);
  const { inside, near } = shieldInside(sh, wornClouds(body, meshes, root), root);
  let tris = 0; sh.traverse(m => { if (m.isMesh) tris += m.geometry.index ? m.geometry.index.count / 3 : m.geometry.attributes.position.count / 3; });
  let floor = 1e9; { const PP = posedBody(body); for (const i of new Set(PACK.G['body'])) floor = Math.min(floor, PP[i * 3 + 1]); } const low = G0.y - R * Math.abs(U.y) - .007 - floor;
  return { mesh: sh, low, stats: { on: 'arm', armGap: +place.armGap.toFixed(4), inHole: place.inHole, clear: CLEAR, inside, near, tested: place.tested, lift: +lift.toFixed(2), turn: TURN, across: 2 * R, tris, faceDir: +Math.atan2(N.z, N.x).toFixed(3) } };
}
// the kite (Session 911; OG-028's Gatelands shield, a kite painted with the harp). Taller than it is wide: a rounded top 48 cm
// across, the sides drawn in to a point 86 cm below it. Seven boards under a painted field and a harp, a rawhide rim, no boss:
// it is held by enarmes, a strap the forearm goes through under the top and a grip the fist closes on, so it hangs along the
// forearm, its point down. It is bent round its bearer, its edges 4.5 cm behind its middle. Built in its own frame: x across,
// y up (the fist at 0), z out of its face, the back of its middle at z 0
const KITE = { W: .24, TOP: .30, TIP: -.56, BEND: .045, T: .012 };
const kiteZ = u => -KITE.BEND * (u / KITE.W) ** 2;
// the hoplon (Session 913; OG-028's Aurennais shield, the sun-star on a round): 90 cm across and dished 10 cm deep, a bronze lip
// round it; held as the Aurennais hold it, the forearm through a bronze band (the porpax) at its middle and the fist on a grip (the
// antilabe) near its rim, so its middle is 33 cm up the forearm from the fist, by the elbow, and it rests on the upper arm too
const HOPLON = { R: .45, MID: .33, DISH: .1, T: .014 };
// the outline, round from the top: a half circle over the shoulders of the shield, then each side drawn in to the point
const KITE_LINE = (() => { const { W, TOP, TIP } = KITE, yS = TOP - W, out = [];
  for (let k = 0; k <= 24; k++) { const a = Math.PI * k / 24; out.push([W * Math.cos(a), yS + W * Math.sin(a)]); }
  for (let k = 1; k <= 24; k++) { const t = k / 24; out.push([-W * (1 - t) ** .85 * (1 + .25 * t * (1 - t)), yS + (TIP - yS) * t]); }
  for (let k = 23; k >= 1; k--) { const t = k / 24; out.push([W * (1 - t) ** .85 * (1 + .25 * t * (1 - t)), yS + (TIP - yS) * t]); }
  return out; })();
HOPLON.line = Array.from({ length: 96 }, (_, k) => [HOPLON.R * Math.cos(k / 96 * Math.PI * 2), HOPLON.MID + HOPLON.R * Math.sin(k / 96 * Math.PI * 2)]);
HOPLON.z = (u, v) => -HOPLON.DISH * (u * u + (v - HOPLON.MID) ** 2) / HOPLON.R ** 2; KITE.line = KITE_LINE; KITE.z = u => kiteZ(u); KITE.name = 'kite'; HOPLON.name = 'hoplon'; KITE.armX = .3; HOPLON.armX = .2;
// the outline's distance from the fist along a ray at angle a (the outline is seen whole from there, so one crossing)
function kiteR(a, L = KITE_LINE) { const dx = Math.cos(a), dy = Math.sin(a); let best = 1e9;
  for (let k = 0; k < L.length; k++) { const [x1, y1] = L[k], [x2, y2] = L[(k + 1) % L.length], ex = x2 - x1, ey = y2 - y1, den = dx * ey - dy * ex; if (Math.abs(den) < 1e-9) continue;
    const t = (x1 * ey - y1 * ex) / den, s = (x1 * dy - y1 * dx) / den; if (t > 0 && s >= 0 && s <= 1) best = Math.min(best, t); }
  return best; }
const kiteIn = (u, v, m = 0, H = KITE) => Math.hypot(u, v) < kiteR(Math.atan2(v, u), H.line) + m;
function kiteTex(col, paint, wood) {
  const c = document.createElement('canvas'); c.width = 256; c.height = 512; const x = c.getContext('2d'), rnd = seeded('kite'), css = (k, v, a = 1) => `rgba(${k.map(t => Math.round(Math.max(0, Math.min(1, t * v)) * 255)).join(',')},${a})`;
  const { W, TOP, TIP } = KITE, px = u => (u / W * .5 + .5) * 256, py = v => (TOP - v) / (TOP - TIP) * 512;
  for (let b = 0; b < 7; b++) { const x0 = b * 256 / 7, v = .9 + rnd() * .16; x.fillStyle = css(wood, v); x.fillRect(x0, 0, 256 / 7 + 1, 512);
    for (let k = 0; k < 10; k++) { x.strokeStyle = css(wood, v * (.8 + rnd() * .1)); x.lineWidth = .6 + rnd(); x.beginPath(); const gx = x0 + rnd() * 256 / 7; x.moveTo(gx, 0); for (let y = 0; y <= 512; y += 32) x.lineTo(gx + Math.sin(y / 60 + k) * 2, y); x.stroke(); }
    x.fillStyle = 'rgba(0,0,0,.55)'; x.fillRect(x0 - 1, 0, 2, 512); }
  if (col) { // the field over the boards, the grain showing through a little
    x.fillStyle = css(col, 1, .86); x.fillRect(0, 0, 256, 512);
    // the harp (the Gatelands' sign): a curved forepillar, the neck sweeping up to the soundbox's head, the soundbox, and the strings
    // the harp (the Gatelands' sign), as the old Gaelic harp is drawn: the soundbox on the diagonal from its foot up to the left,
    // the neck curving across the top, the forepillar bowed out on the right down to the foot, and the strings plumb between
    const P = paint || [.8, .64, .26], hx = u => px(u * W), hy = v => py(TOP - (TOP - TIP) * v), foot = [.06, .66], sbTop = [-.32, .15], neckEnd = [.32, .2];
    const neckY = u => { const t = (u - sbTop[0]) / (neckEnd[0] - sbTop[0]); return sbTop[1] * (1 - t) ** 2 + 2 * .05 * t * (1 - t) + neckEnd[1] * t * t; };
    x.strokeStyle = css(P, 1); x.lineCap = x.lineJoin = 'round';
    x.lineWidth = 6; for (let u = -.25; u <= .3; u += .068) { const t = (foot[0] - u) / (foot[0] - sbTop[0]), yb = u <= foot[0] ? foot[1] + (sbTop[1] - foot[1]) * t : null;
      const yp = yb ?? (() => { let best = foot[1]; for (let k = 0; k <= 40; k++) { const s = k / 40, bx = neckEnd[0] * (1 - s) ** 3 + 3 * .44 * s * (1 - s) ** 2 + 3 * .3 * s * s * (1 - s) + foot[0] * s ** 3, by = neckEnd[1] * (1 - s) ** 3 + 3 * .36 * s * (1 - s) ** 2 + 3 * .6 * s * s * (1 - s) + foot[1] * s ** 3; if (Math.abs(bx - u) < .01) { best = by; break; } } return best; })();
      x.lineWidth = 2.4; x.beginPath(); x.moveTo(hx(u), hy(yp)); x.lineTo(hx(u), hy(neckY(u)) + 3); x.stroke(); }
    x.lineWidth = 17; x.beginPath(); x.moveTo(hx(foot[0]), hy(foot[1])); x.lineTo(hx(sbTop[0]), hy(sbTop[1])); x.stroke();
    x.lineWidth = 10; x.beginPath(); x.moveTo(hx(sbTop[0]), hy(sbTop[1])); x.quadraticCurveTo(hx(0), hy(.05), hx(neckEnd[0]), hy(neckEnd[1])); x.stroke();
    x.lineWidth = 11; x.beginPath(); x.moveTo(hx(neckEnd[0]), hy(neckEnd[1])); x.bezierCurveTo(hx(.44), hy(.36), hx(.3), hy(.6), hx(foot[0]), hy(foot[1])); x.stroke();
    // a border in the paint's colour inside the rim, and the paint worn back to the wood at the rim
    x.beginPath(); KITE_LINE.forEach(([u, v], k) => k ? x.lineTo(px(u * .9), py(v * .9 + (TOP * .1))) : x.moveTo(px(u * .9), py(v * .9 + (TOP * .1)))); x.closePath(); x.lineWidth = 6; x.strokeStyle = css(P, .95); x.stroke();
    x.beginPath(); KITE_LINE.forEach(([u, v], k) => k ? x.lineTo(px(u), py(v)) : x.moveTo(px(u), py(v))); x.closePath(); x.lineWidth = 9; x.strokeStyle = css(wood, .9, .55); x.stroke(); }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t;
}
// the hoplon's face: the round shield's (a painted field, or bronze with its hammer dints) and the sun-star over it, the sign of
// Aurenne: a disc and sixteen rays, long and short by turns, in the paint's colour (gold if it has none)
function hoplonTex(col, paint, wood, metal) {
  const t = shieldTex(col, null, wood, metal), c = t.image, x = c.getContext('2d'), P = paint || [.86, .7, .3], css = `rgb(${P.map(v => Math.round(v * 255)).join(',')})`;
  x.fillStyle = css; x.beginPath(); for (let k = 0; k < 32; k++) { const a = k / 32 * Math.PI * 2 - Math.PI / 2, r = k % 2 ? 46 : (k % 4 ? 150 : 205); x.lineTo(256 + r * Math.cos(a), 256 + r * Math.sin(a)); } x.closePath(); x.fill();
  x.beginPath(); x.arc(256, 256, 54, 0, 7); x.fill(); x.strokeStyle = 'rgba(0,0,0,.35)'; x.lineWidth = 3; x.stroke(); t.needsUpdate = true; return t;
}
function kiteParts(D, gripZ = -.03, H = KITE, flat = false) {
  const hop = H === HOPLON, { W, TOP, TIP } = KITE, T = H.T, NT = 64, NR = 10, pos = [], uv = [], idx = [], pos2 = [], idx2 = [], u0 = u => hop ? u / H.R * .5 + .5 : u / W * .5 + .5, v0 = v => hop ? (v - H.MID) / H.R * .5 + .5 : (v - TIP) / (TOP - TIP);
  for (let j = 0; j < NR; j++) for (let t = 0; t <= NT; t++) { const a = t / NT * Math.PI * 2, r = kiteR(a, H.line) * (j === 0 ? .002 : j / (NR - 1)), u = r * Math.cos(a), v = r * Math.sin(a);
    pos.push(u, v, H.z(u, v) + T); uv.push(u0(u), v0(v)); pos2.push(u, v, H.z(u, v)); }
  for (let j = 0; j < NR - 1; j++) for (let t = 0; t < NT; t++) { const a = j * (NT + 1) + t, b = a + NT + 1; idx.push(a, b, a + 1, a + 1, b, b + 1); idx2.push(a, a + 1, b, a + 1, b + 1, b); }
  const geo = (p, i) => { const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(p, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(i); g.computeVertexNormals(); return g; };
  const woodC = [.46, .33, .2], face = new THREE.Mesh(geo(pos, idx), hop ? new THREE.MeshStandardMaterial({ map: hoplonTex(D.shield, D.shieldPaint, woodC, !!D.shieldMetal), roughness: D.shieldMetal ? .36 : .7, metalness: D.shieldMetal ? .55 : 0 }) : new THREE.MeshStandardMaterial({ map: kiteTex(D.shield, D.shieldPaint, woodC), roughness: .78 }));
  const backM = new THREE.Mesh(geo(pos2, idx2), new THREE.MeshStandardMaterial({ map: kiteTex(null, null, woodC.map(v => v * .8)), roughness: .9 }));
  // the rim: rawhide over the edge, following the bend (a hoplon's is its bronze lip, wider and rolled)
  const line = []; for (let k = 0; k <= 96; k++) { const a = k / 96 * Math.PI * 2, r = kiteR(a, H.line), u = r * Math.cos(a), v = r * Math.sin(a); line.push(new THREE.Vector3(u, v, H.z(u, v) + T / 2)); }
  const rim = new THREE.Mesh(tubeGeom(line, line.map(() => hop ? .013 : .0075), hop ? 8 : 6), hop ? new THREE.MeshStandardMaterial({ color: sRGB(...(D.shieldRim || [.62, .45, .22])), metalness: .55, roughness: .38 }) : new THREE.MeshStandardMaterial({ color: sRGB(...(D.shieldRim || [.3, .21, .13])), roughness: .7 }));
  // the enarmes: a leather strap the forearm goes through, 17 cm over the fist, and a grip strap the fist closes on, each
  // riveted to the back at its two ends and standing off it to the arm's own depth (gripZ, behind the back)
  const lea = new THREE.MeshStandardMaterial({ color: sRGB(...woodC.map(v => v * .55)), roughness: .8 }), metal = new THREE.MeshStandardMaterial({ color: sRGB(...(D.helm || [.42, .43, .45])), metalness: .55, roughness: .38 });
  const sh = new THREE.Group(); sh.name = 'shield'; sh.add(face, backM, rim);
  const bronze = new THREE.MeshStandardMaterial({ color: sRGB(...(D.shieldRim || [.62, .45, .22])), metalness: .55, roughness: .38 });
  // slung on the back (Session 916) the straps lie slack and flat on the board's back, 2 mm proud of it, as nothing is through them
  for (const [v, half, depth, wd, mat] of hop ? [[H.MID, .065, gripZ - .045, .04, bronze], [0, .05, gripZ, .025, lea]] : [[.17, .07, gripZ - .03, .035, lea], [0, .055, gripZ, .03, lea]]) { const pts = []; for (let k = 0; k <= 12; k++) { const t = k / 12, u = -half + 2 * half * t; pts.push(new THREE.Vector3(u, v, H.z(u, v) + (flat ? .002 : depth * Math.sin(Math.PI * t) ** .6))); }
    sh.add(new THREE.Mesh(tubeGeom(pts, pts.map(() => flat ? .004 : wd / 2), 4), mat));
    for (const u of [-half, half]) { const rv = new THREE.Mesh(new THREE.SphereGeometry(.006, 10, 6, 0, Math.PI * 2, 0, Math.PI / 2), metal); rv.rotation.x = Math.PI / 2; rv.position.set(u, v, H.z(u, v) + T + .001); sh.add(rv); } }
  sh.traverse(m => { if (m.isMesh) { m.castShadow = m.receiveShadow = true; m.userData.shield = true; } });
  return sh;
}
// held on the forearm, its point down: the fist on the grip at the frame's origin, the forearm along its back (the strap under the
// top round it), its face turned 1 rad forward from the side as the round one's is. Its back is laid 5 mm outside the furthest
// point of whatever lies within its outline, read at each point's own place on the bend; where something other than the arm is
// that point, the arm is lifted out from the side 0.03 rad at a time
function kiteBack(clouds, C, S, U, N, armOf, H = KITE) {
  let other = -1, arm = -1, n = 0, ow = null;
  eachPoint(clouds, (x, y, z, i) => { const dx = x - C.x, dy = y - C.y, dz = z - C.z, d = dx * N.x + dy * N.y + dz * N.z; if (d < -.3) return; const u = dx * S.x + dy * S.y + dz * S.z, v = dx * U.x + dy * U.y + dz * U.z;
    if (!kiteIn(u, v, .012, H)) return; n++; const need = d - H.z(u, v); if (i >= 0 && armOf(i)) arm = Math.max(arm, need); else if (need > other) { other = need; ow = [u, v]; } });
  return { other, arm, n, ow };
}
function kiteInside(sh, clouds, root, H = KITE) {
  root.updateMatrixWorld(true); const inv = sh.matrixWorld.clone().invert(), v = new THREE.Vector3(); let inside = 0, near = 1;
  eachPoint(clouds, (x, y, z) => { v.set(x, y, z).applyMatrix4(inv); if (!kiteIn(v.x, v.y, .008, H)) return; const h = v.z - H.z(v.x, v.y); if (h < -.05 || h > H.T + .012) return; near = Math.min(near, -h); if (h > -.003) inside++; });
  return { inside, near: +near.toFixed(4) };
}
function buildKite(G, body, byName, meshes, root) {
  const D = G.dress, TURN = D.shieldTurn ?? (D.shieldShape === 'hoplon' ? .4 : 1), CLEAR = .005, R0 = PACK.rest, q = (ax, ay, az) => new THREE.Quaternion().setFromEuler(new THREE.Euler(ax, ay, az, 'XYZ'));
  const H = D.shieldShape === 'hoplon' ? HOPLON : KITE, wrist = byName['wrist.L'], elbow = byName['lowerarm01.L'], armOf = i => R0[i * 3] > H.armX;
  closeFist(byName, root, 'L');
  let place = null, lift = 0;
  for (let k = 0; k <= 12; k++) {
    const clouds = wornClouds(body, meshes, root);
    const e = new THREE.Vector3().setFromMatrixPosition(elbow.matrixWorld), w = new THREE.Vector3().setFromMatrixPosition(wrist.matrixWorld), A = w.clone().sub(e).normalize();
    const O = new THREE.Vector3(1, 0, 0).addScaledVector(A, -A.x).normalize(), F = new THREE.Vector3().crossVectors(A, O); if (F.z < 0) F.negate();
    const N = O.clone().multiplyScalar(Math.cos(TURN)).addScaledVector(F, Math.sin(TURN)).normalize(), U = A.clone().negate(), S = new THREE.Vector3().crossVectors(U, N);
    const G0 = new THREE.Vector3(); for (let f = 2; f <= 5; f++) G0.add(new THREE.Vector3().setFromMatrixPosition(byName[`finger${f}-2.L`].matrixWorld)); G0.divideScalar(4);
    const { other, arm, n, ow } = kiteBack(clouds, G0, S, U, N, armOf, H), back = Math.max(arm + CLEAR, other + CLEAR);
    place = { G0, N, U, S, back, arm, armGap: Math.max(0, other - arm), tested: n, ow };
    if (other <= arm || k === 12) break;
    lift += .03; byName['upperarm01.L'].quaternion.multiply(q(0, 0, .03));
  }
  // the straps stand off the back to the arm's own depth: the forearm's furthest point behind it, less a centimetre
  const { G0, N, U, S, back } = place, sh = kiteParts(D, Math.max(-.07, Math.min(-.015, place.arm - back - .01)), H);
  sh.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(S, U, N)); sh.position.copy(G0).addScaledVector(N, back); root.add(sh); root.updateMatrixWorld(true); wrist.attach(sh);
  const { inside, near } = kiteInside(sh, wornClouds(body, meshes, root), root, H);
  let tris = 0; sh.traverse(m => { if (m.isMesh) tris += m.geometry.index ? m.geometry.index.count / 3 : m.geometry.attributes.position.count / 3; });
  let floor = 1e9; { const PP = posedBody(body); for (const i of new Set(PACK.G['body'])) floor = Math.min(floor, PP[i * 3 + 1]); }
  let low = 1e9; for (const [u, v] of H.line) low = Math.min(low, G0.y + S.y * u + U.y * v + N.y * (back + H.z(u, v)));
  return { mesh: sh, low: low - floor, stats: { on: 'arm', shape: H.name, armGap: +place.armGap.toFixed(4), clear: CLEAR, inside, near, tested: place.tested, lift: +lift.toFixed(2), turn: TURN, across: H === HOPLON ? 2 * H.R : 2 * KITE.W, tall: H === HOPLON ? 2 * H.R : +(KITE.TOP - KITE.TIP).toFixed(2), tris, faceDir: +Math.atan2(N.z, N.x).toFixed(3) } };
}
// slung (Session 905): under a cloak, which hangs over the arm that would hold it, or a shoulder cape, which stands out over its top
// edge, the shield is carried on the back by its strap (the guige), as OG-019's heavy line draws the strap crossed over the chest.
// The shield hangs with its top 6 cm under the nape, leaning with the back, its own back laid 5 mm outside whatever lies within
// its rim (the back, the cloak and its hood, the hair). A rigid piece carried by the chest bone. The strap, 3.5 cm of leather,
// leaves from under its top edge on the right, goes over the right shoulder, down across the chest to the left hip and round the
// left side under the arm (over the cloak where the cloak hangs over the arm), and goes back under the board's lower edge. It is
// laid along rays from inside the body: at each step it rides 3.5 mm over the furthest point within 3 cm of its ray, and is pulled
// taut, so it bridges hollows as a strap does. It is not drawn under the board
// A kite or a hoplon (Session 916) is slung the same way, the kite point down, its top and the hoplon's rim 6 cm under the nape, its
// back laid 5 mm outside whatever lies within its outline at each point's own place on its bend or dish (kiteBack), so the kite's
// bend and the hoplon's dish wrap round the back; their enarmes, porpax and antilabe lie slack and flat on the board
function buildShieldBack(G, body, byName, meshes, root, heads) {
  const D = G.dress, R = SHIELD_R, CLEAR = .005, R0 = PACK.rest, chest = byName['spine03'] || byName['spine04'], H = D.shieldShape === 'kite' ? KITE : D.shieldShape === 'hoplon' ? HOPLON : null;
  const clouds = wornClouds(body, meshes, root, true), neck = new THREE.Vector3().setFromMatrixPosition(byName['neck01'].matrixWorld);
  const lean = .12, N = new THREE.Vector3(0, Math.sin(lean), -Math.cos(lean)), U = new THREE.Vector3(0, Math.cos(lean), Math.sin(lean)), S = new THREE.Vector3().crossVectors(U, N);
  const top = H ? (H === HOPLON ? H.MID + H.R : KITE.TOP) : R, C0 = new THREE.Vector3(0, neck.y - .06 - top, neck.z), { other, n } = H ? kiteBack(clouds, C0, S, U, N, () => false, H) : shieldBack(clouds, C0, N), back = other + CLEAR, C = C0.clone().addScaledVector(N, back);
  const sh = H ? kiteParts(D, 0, H, true) : shieldParts(D); sh.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(S, U, N)); sh.position.copy(C); root.add(sh);
  // the strap: rays from inside the body, from the nape over the right shoulder (x -.1), down across the chest to the left hip, round
  // the left side and back. Its points are on every cloud but the arms' skin and sleeves (it passes between an arm and the side);
  // a cloak's points are kept, so over a cloak it goes over the cloak
  // nor the hair, the head or what the head carries (the strap goes under long hair, and stops at the neck)
  const armSkin = i => Math.abs(R0[i * 3]) > .2 && R0[i * 3 + 1] < .6, strapClouds = wornClouds(body, meshes, root).map(c => c.ids ? { X: c.X, ids: c.ids.filter(i => !armSkin(i)) } : { X: c.X.filter((_, k) => c.X[k - k % 3 + 1] < neck.y + .03), ids: null });
  const hip = new THREE.Vector3().setFromMatrixPosition((byName['pelvis.L'] || byName['spine01']).matrixWorld), sY = neck.y - .02, wY = hip.y + .12, zc = neck.z + .02;
  const guide = []; const add = (c, d) => guide.push({ c, d: d.normalize() });
  for (let k = 0; k <= 8; k++) { const t = k / 8, ph = -1.25 + t * 2.5; add(new THREE.Vector3(-.14, sY - .12, zc), new THREE.Vector3(0, Math.cos(ph), Math.sin(ph))); }
  for (let k = 1; k <= 12; k++) { const t = k / 12; add(new THREE.Vector3(-.14 + .23 * t, sY - .12 - (sY - .12 - wY) * t, zc), new THREE.Vector3(.6 * t * t, .45 * (1 - t), 1)); }
  for (let k = 1; k <= 12; k++) { const a = k / 12 * Math.PI; add(new THREE.Vector3(.04, wY, zc), new THREE.Vector3(Math.sin(a) * .9 + .6 * Math.cos(a) * 0, 0, Math.cos(a))); }
  // densify the guide to about a centimetre a step along the body, then find each ray's surface (within 3 cm of it)
  const rays = []; for (let k = 0; k < guide.length - 1; k++) for (let s = 0; s < 6; s++) { const t = s / 6; rays.push({ c: guide[k].c.clone().lerp(guide[k + 1].c, t), d: guide[k].d.clone().lerp(guide[k + 1].d, t).normalize() }); } rays.push(guide[guide.length - 1]);
  const W = .0175, OFF = .0035;
  // a cloak's columns stand up to 8 cm apart toward the hem, so its points count within 8 cm of a ray, the body's within 3 cm
  for (const r of rays) { let far = 0; eachPoint(strapClouds, (x, y, z, i) => { const dx = x - r.c.x, dy = y - r.c.y, dz = z - r.c.z, dd = dx * r.d.x + dy * r.d.y + dz * r.d.z; if (dd <= 0 || dd > .45) return; if (Math.hypot(dx - r.d.x * dd, dy - r.d.y * dd, dz - r.d.z * dd) < (i < 0 ? .08 : .03) && dd > far) far = dd; }); r.far = far + OFF; }
  // and no dip narrower than 16 steps: each point at least the lower of the highest on either side within 8 (a closing)
  { const f0 = rays.map(r => r.far); for (let k = 0; k < rays.length; k++) { let L = 0, Rr = 0; for (let j = 1; j <= 8; j++) { if (k - j >= 0) L = Math.max(L, f0[k - j]); if (k + j < rays.length) Rr = Math.max(Rr, f0[k + j]); } rays[k].far = Math.max(f0[k], Math.min(L, Rr) - .004); } }
  // taut: a strap bridges a hollow, so no point sits below the line between its neighbours (four passes)
  for (let p = 0; p < 4; p++) for (let k = 1; k < rays.length - 1; k++) rays[k].far = Math.max(rays[k].far, (rays[k - 1].far + rays[k + 1].far) / 2 - .002);
  let pts = rays.map(r => r.c.clone().addScaledVector(r.d, r.far)), nrm = rays.map(r => r.d);
  // not under the board: the strap starts and ends at its rim (under it is within its rim and less than 8 cm in front of its back)
  root.updateMatrixWorld(true); const inv = sh.matrixWorld.clone().invert(), under = p => { const v = p.clone().applyMatrix4(inv), z0 = H ? H.z(v.x, v.y) : 0; return (H ? kiteIn(v.x, v.y, -.02, H) : Math.hypot(v.x, v.y) < R - .02) && v.z < z0 + .001 && v.z > z0 - .08; };
  let a = 0, b = pts.length - 1; while (a < b && under(pts[a + 1])) a++; while (b > a && under(pts[b - 1])) b--; pts = pts.slice(a, b + 1); nrm = nrm.slice(a, b + 1);
  const pos = [], idx = []; for (let k = 0; k < pts.length; k++) { const t = pts[Math.min(k + 1, pts.length - 1)].clone().sub(pts[Math.max(k - 1, 0)]).normalize(), side = new THREE.Vector3().crossVectors(t, nrm[k]).normalize();
    for (const s of [-1, 1]) { const p = pts[k].clone().addScaledVector(side, s * W); pos.push(p.x, p.y, p.z); } if (k) { const o = (k - 1) * 2; idx.push(o, o + 2, o + 1, o + 1, o + 2, o + 3); } }
  const sg = new THREE.BufferGeometry(); sg.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); sg.setIndex(idx); sg.computeVertexNormals(); sg.setAttribute('aBase', sg.attributes.position);
  const strap = new THREE.Mesh(sg, clothMat(sRGB(...(D.belt || [.3, .2, .13])), 'leather', { side: THREE.DoubleSide })); strap.name = 'guige'; strap.castShadow = strap.receiveShadow = true; strap.userData.shield = true; sh.userData.strap = strap;
  // the strap's promise: no point of what it lies on comes up through it: within its width and a step along it, none less than 3 cm
  // over its underside, measured along its own normal (a cloak's free panel further out, which it passes under, is not through it)
  let through = 0, tested = 0, worst = 0; for (let k = 0; k < pts.length; k++) { const d = nrm[k], t0 = pts[Math.min(k + 1, pts.length - 1)].clone().sub(pts[Math.max(k - 1, 0)]), t = t0.addScaledVector(d, -t0.dot(d)).normalize(), side = new THREE.Vector3().crossVectors(t, d).normalize(), p0 = pts[k];
    eachPoint(strapClouds, (x, y, z) => { const dx = x - p0.x, dy = y - p0.y, dz = z - p0.z; if (Math.abs(dx * t.x + dy * t.y + dz * t.z) > .006 || Math.abs(dx * side.x + dy * side.y + dz * side.z) > W) return; const h = dx * d.x + dy * d.y + dz * d.z; if (h < -.03 || h > .03) return; tested++; if (h > -.001) { through++; worst = Math.max(worst, h); } }); }
  let len = 0; for (let k = 1; k < pts.length; k++) len += pts[k].distanceTo(pts[k - 1]);
  root.add(strap); chest.attach(sh); chest.attach(strap);
  const { inside, near } = H ? kiteInside(sh, clouds, root, H) : shieldInside(sh, clouds, root);
  let tris = idx.length / 3; sh.traverse(m => { if (m.isMesh) tris += m.geometry.index ? m.geometry.index.count / 3 : m.geometry.attributes.position.count / 3; });
  // a shape's lowest point (the kite's tip, the hoplon's rim) off the ground
  let bottom; if (H) { let floor = 1e9; { const PP = posedBody(body); for (const i of new Set(PACK.G['body'])) floor = Math.min(floor, PP[i * 3 + 1]); } let low = 1e9; for (const [u, v] of H.line) low = Math.min(low, C.y + S.y * u + U.y * v + N.y * H.z(u, v)); bottom = +(low - floor).toFixed(3); }
  return { mesh: sh, stats: { on: 'back', shape: H ? H.name : 'round', inside, near, tested: n, across: H === HOPLON ? 2 * H.R : H ? 2 * KITE.W : 2 * R, ...(H ? { tall: H === HOPLON ? 2 * H.R : +(KITE.TOP - KITE.TIP).toFixed(2), bottom } : {}), tris, strap: { len: +len.toFixed(3), through, worst: +worst.toFixed(4), tested, steps: pts.length } } };
}
// the spear (Sessions 907, 909 and 910; OG-025's hold guards and OG-044's Compact guards carry one, and it is one of the two new kinds
// of weapon, Michael's 6 A). An ash shaft 2.2 to 2.6 cm thick (as the fist's hole allows) and 45 cm taller than its bearer (2.3 m at the least), an iron socket and a
// leaf-shaped head 18 cm long with a midrib, and an iron shoe on the butt. Held upright in the right fist, its butt on the ground:
// the forearm points forward, rolled so the knuckles stand one over another, and the four fingers close round the shaft
// (fistGrip, in makePerson's pose). The shaft runs up the line of the knuckles, through the fist. Carried by the
// right wrist. Its numbers: the nearest point of the person or what they wear to the shaft (the right hand apart), how many of
// the hand's points are inside the shaft, the hole's own radius, how far the head stands over the crown
// The grip (fistGrip): the shaft is laid in the palm's crease at the fingers' roots, running along the knuckles' line, as near
// the palm as the hand's points allow (with the fingers straight, none of them within its radius and a millimetre, from 3 cm under
// the little finger's knuckle to 9 cm over the first finger's, where the ball of the thumb is); then the four fingers close on it,
// as far as they go before any point of the hand would come inside it
const SPEAR_R = .013;
// the heads by island (Session 918): the socket's and the blade's lengths, the socket's sides, the blade's half-width up its length
// (t from 0 at the socket to 1 at the point), and the rings round the socket (where up it, and their metal)
const spearW = (W, peak, neck) => t => W * (t < peak ? Math.sin(Math.PI / 2 * t / peak) ** .8 : ((1 - t) / (1 - peak)) ** .9) + neck * (1 - t);
const SPEAR_HEADS = {
  leaf: { sock: .09, blade: .18, facets: 14, w: t => .0235 * Math.sin(Math.PI * Math.min(1, t * 1.25) ** .8) * (1 - t * .15) + .007 * (1 - t), rings: [.2, .8], ring: [.62, .45, .22] },
  winged: { sock: .1, blade: .24, facets: 8, w: spearW(.019, .3, .006), rings: [.15, .5, .85], ring: [.78, .78, .8], wings: true },
  long: { sock: .13, blade: .28, facets: 12, w: spearW(.0145, .36, .005), rings: [.12, .3, .7, .88], ring: [.86, .68, .3] } };
function fistGrip(body, byName, root, curl, hinge) {
  const R0 = PACK.rest, hand = PACK.handRV || (PACK.handRV = [...new Set(PACK.G['body'])].filter(i => R0[i * 3] < -.39)), at = n => new THREE.Vector3().setFromMatrixPosition(byName[n].matrixWorld);
  // the thumb's points (skinned more than half to its own bones) are left out: it is posed after, round the shaft
  const tb = new Set(PACK.ix.bones.map((b, k) => /^finger1-\d\.R$/.test(b.name) ? k : -1).filter(k => k >= 0)), SW = PACK.skinWeight, SI = PACK.skinIndex;
  const thumb = PACK.thumbRV || (PACK.thumbRV = new Set(hand.filter(i => { let w = 0; for (let c = 0; c < 4; c++) if (tb.has(SI[i * 4 + c])) w += SW[i * 4 + c]; return w > .5; }))), palmHand = hand.filter(i => !thumb.has(i));
  curl(0); root.updateMatrixWorld(true); let PP = posedBody(body);
  const k2 = at('finger2-1.R'), k5 = at('finger5-1.R'), A = k2.clone().sub(k5).normalize(), M = k2.clone().add(k5).multiplyScalar(.5), L = M.clone().sub(at('wrist.R')); L.addScaledVector(A, -L.dot(A)).normalize();
  // which way the palm faces: the way the middle finger's tip goes as it closes
  const tip = () => { root.updateMatrixWorld(true); return at('finger3-3.R'); }, t0 = tip(); curl(.5); const P = A.clone().cross(L).normalize(); if (tip().sub(t0).dot(P) < 0) P.negate(); curl(0); root.updateMatrixWorld(true);
  const lo = k5.dot(A) - .03, hi = k2.dot(A) + .09, pts = [];
  for (const i of palmHand) { const x = PP[i * 3] - M.x, y = PP[i * 3 + 1] - M.y, z = PP[i * 3 + 2] - M.z, t = x * A.x + y * A.y + z * A.z; if (t + M.dot(A) < lo || t + M.dot(A) > hi) continue; pts.push([x * L.x + y * L.y + z * L.z, x * P.x + y * P.y + z * P.z]); }
  let best = null; for (let u = -.025; u <= -.00499; u += .0025) for (let v = 0; v <= .08001; v += .001) { let r = 1; for (const [a, b] of pts) r = Math.min(r, Math.hypot(a - u, b - v)); if (r >= SPEAR_R + .001) { if (!best || v < best.v) best = { u, v }; break; } }
  const C = M.clone().addScaledVector(L, best.u).addScaledVector(P, best.v);
  // close the fingers on it as a hand closes: each finger's three joints bend together (in the shield's fist's proportions) until a
  // point of the finger would come inside the shaft; then the two outer joints go on bending together, then the last alone, each
  // 0.04 rad at a time and stopping a step short of the shaft, so the finger wraps round it rather than butting into it
  const v = new THREE.Vector3(), w = new THREE.Vector3(), radial = i => { body.getVertexPosition(i, v); w.copy(v).sub(C); return w.addScaledVector(A, -w.dot(A)).length() - SPEAR_R; };
  const fv = PACK.fingerRV || (PACK.fingerRV = (() => { const o = {}; for (let f = 2; f <= 5; f++) { const bs = new Set([1, 2, 3].map(k => PACK.ix.bones.findIndex(b => b.name === `finger${f}-${k}.R`)));
      o[f] = hand.filter(i => { let wt = 0; for (let c = 0; c < 4; c++) if (bs.has(SI[i * 4 + c])) wt += SW[i * 4 + c]; return wt > .3; }); } return o; })());
  const RATIO = [1.15, 1.35, .95], MAXJ = [1.6, 1.8, 1.3]; curl(0); root.updateMatrixWorld(true);
  for (let f = 2; f <= 5; f++) { const bs = [1, 2, 3].map(j => byName[`finger${f}-${j}.R`]), ang = [0, 0, 0], set = () => { bs.forEach((b, k) => b.quaternion.setFromAxisAngle(hinge, ang[k])); bs[0].updateMatrixWorld(true); };
    for (const from of [0, 1, 2]) { const step = RATIO.map((r, k) => k >= from ? .04 * r / RATIO[from] : 0);
      for (let n = 0; n < 60; n++) { const prev = ang.slice(); for (let k = 0; k < 3; k++) ang[k] = Math.min(MAXJ[k], ang[k] + step[k]); set(); if (ang.every((a, k) => a === prev[k]) || fv[f].some(i => radial(i) < -.0005)) { ang.splice(0, 3, ...prev); set(); break; } } } }
  const inside = () => { root.updateMatrixWorld(true); PP = posedBody(body); let n = 0, gap = 1;
    for (const i of hand) { if (thumb.has(i)) continue; w.set(PP[i * 3], PP[i * 3 + 1], PP[i * 3 + 2]).sub(C); const r = w.addScaledVector(A, -w.dot(A)).length(); if (r < SPEAR_R - .001) n++; else gap = Math.min(gap, r - SPEAR_R); } return { n, gap }; };
  const got = inside(), bends = [1, 2, 3].map(j => { let t = 0; for (let f = 2; f <= 5; f++) t += 2 * Math.acos(Math.min(1, Math.abs(byName[`finger${f}-${j}.R`].quaternion.w))); return +(t / 4).toFixed(2); });
  // the thumb: turned at its root, of the turns that keep it out of the shaft, the one that brings it nearest round it
  const t1 = byName['finger1-1.R'], q0 = t1.quaternion.clone(), thumbGap = () => { root.updateMatrixWorld(true); PP = posedBody(body); let n = 0, g = 1; const w = new THREE.Vector3();
    for (const i of thumb) { w.set(PP[i * 3], PP[i * 3 + 1], PP[i * 3 + 2]).sub(C); const r = w.addScaledVector(A, -w.dot(A)).length() - SPEAR_R; if (r < -.001) n++; g = Math.min(g, r); } return { n, g }; };
  let tq = null, tg = null; for (const ax of [[1, 0, 0], [0, 1, 0], [0, 0, 1]]) for (let a = -1; a <= 1.001; a += .2) { t1.quaternion.copy(q0).multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(...ax), a)); const c = thumbGap();
    if (c.n === 0 && (!tg || c.g < tg.g)) { tg = c; tq = t1.quaternion.clone(); } }
  if (tq) t1.quaternion.copy(tq); else t1.quaternion.copy(q0); const tf = thumbGap(); got.th = tf.n; got.tgap = tf.g;
  return { A, C, curl: bends, gap: +got.gap.toFixed(4), thumbIn: got.th, thumbGap: +got.tgap.toFixed(4), palm: +best.v.toFixed(4), n: pts.length };
}
function buildSpear(G, body, byName, meshes, root, grip) {
  root.updateMatrixWorld(true); const D = G.dress, RS = SPEAR_R, R0 = PACK.rest, PP = posedBody(body);
  let floor = 1e9, crown = -1e9; for (const i of new Set(PACK.G['body'])) { floor = Math.min(floor, PP[i * 3 + 1]); crown = Math.max(crown, PP[i * 3 + 1]); }
  const LEN = Math.max(2.3, crown - floor + .45), A = grip.A, B = grip.C.clone().addScaledVector(A, (floor - grip.C.y) / A.y);
  const wood = new THREE.MeshStandardMaterial({ color: sRGB(...D.spear), roughness: .7 }), iron = new THREE.MeshStandardMaterial({ color: sRGB(...(D.helm || [.42, .43, .45])), metalness: .6, roughness: .35 });
  const sp = new THREE.Group(); sp.name = 'spear';
  // the head by island (Session 918, OG-028's strip of spearheads): the Gatelands' leaf (Session 909's), its socket bound with two
  // bronze rings; the Mark's winged head, a long lozenge over a faceted socket with a lug either side of it, its socket ringed with
  // silver; Aurenne's long head, a narrow blade 28 cm long on a long socket banded in gold (the filigree's colour). The spear is as
  // long as before: the shaft gives up what a longer head takes
  const HD = SPEAR_HEADS[D.spearHead] ? D.spearHead : ({ markman: 'winged', aurennais: 'long' })[G.people] || 'leaf', K = SPEAR_HEADS[HD], top = LEN - K.blade, s0 = top - K.sock;
  const shaft = new THREE.Mesh(new THREE.CylinderGeometry(RS * .92, RS, s0 - .06, 14), wood); shaft.position.y = .06 + (s0 - .06) / 2; sp.add(shaft);
  // the shoe on the butt, and the socket under the head
  const shoe = new THREE.Mesh(new THREE.CylinderGeometry(RS + .001, RS * .55, .06, 14), iron); shoe.position.y = .03; sp.add(shoe);
  const sock = new THREE.Mesh(new THREE.CylinderGeometry(RS * .62, RS * .95, K.sock, K.facets), iron); sock.position.y = s0 + K.sock / 2; sp.add(sock);
  const band = K.ring && new THREE.MeshStandardMaterial({ color: sRGB(...K.ring), metalness: .8, roughness: .3 });
  for (const f of K.rings) { const r = RS * (.95 - .33 * f) + .0012, ring = new THREE.Mesh(new THREE.TorusGeometry(r, .0016, 6, 20), band); ring.rotation.x = Math.PI / 2; ring.position.y = s0 + K.sock * f; sp.add(ring); }
  // the blade: a lathe of four sides (a diamond in section) flattened to a quarter, so it is a blade with a midrib
  const prof = []; for (let k = 0; k <= 16; k++) { const t = k / 16, w = K.w(t); prof.push(new THREE.Vector2(Math.max(.0004, t < 1 ? w : .0004), t * K.blade)); }
  const hg = new THREE.LatheGeometry(prof, 4); hg.scale(1, 1, .22); hg.computeVertexNormals(); const head = new THREE.Mesh(hg, iron); head.position.y = top; head.rotation.y = Math.PI / 4; sp.add(head);
  // the Mark's lugs: a wing either side of the socket's top, in the blade's plane, 3.4 cm out from the shaft's line
  if (K.wings) for (const sg of [-1, 1]) { const wg = new THREE.Mesh(new THREE.ConeGeometry(.009, .034, 4), iron); wg.scale.set(1, 1, .45); wg.rotation.z = -sg * Math.PI / 2;
    const at = new THREE.Vector3(sg * (RS * .7 + .016), top - .014, 0).applyAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI / 4); wg.position.copy(at); wg.rotation.y = Math.PI / 4; sp.add(wg); }
  sp.traverse(m => { if (m.isMesh) { m.castShadow = m.receiveShadow = true; m.userData.shield = true; } });
  sp.position.copy(B); sp.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), A); root.add(sp); root.updateMatrixWorld(true);
  // what comes near the shaft: every cloud's points but the right hand's, by their distance to its axis over its length
  let clear = 1, fist = 0; const w = new THREE.Vector3(); eachPoint(wornClouds(body, meshes, root), (x, y, z, i) => { w.set(x, y, z).sub(B); const t = w.dot(A); if (t < 0 || t > LEN) return; const r = w.addScaledVector(A, -t).length();
    if (i >= 0 && R0[i * 3] < -.39) { if (r < RS - .001) fist++; return; } clear = Math.min(clear, r - RS); });
  byName['wrist.R'].attach(sp);
  let tris = 0; sp.traverse(m => { if (m.isMesh) tris += m.geometry.index ? m.geometry.index.count / 3 : m.geometry.attributes.position.count / 3; });
  return { mesh: sp, stats: { head: HD, headLen: +(K.sock + K.blade).toFixed(3), headW: +(2 * Math.max(...prof.map(v => v.x))).toFixed(4), clear: +clear.toFixed(4), fist, shaft: +(2 * RS).toFixed(4), gap: grip.gap, thumbIn: grip.thumbIn, thumbGap: grip.thumbGap, palm: grip.palm, gripPts: grip.n, curl: grip.curl, len: +LEN.toFixed(3), lean: +Math.acos(Math.min(1, A.y)).toFixed(3), over: +(B.y + LEN * A.y - crown).toFixed(3), tris } };
}
// the old's walking staff (Session 1085, L1; OG-001's elder's carved staff, OG-042's Old Blood elder's tall carved staff, OG-065's
// Síle and her knotwork staff), carried in the right fist as the spear is: the same grip, its foot on the ground where the fist's line
// meets it. Wood, never quite straight: it bends a centimetre or so between the fist and either end, and is true through the fist. By
// people (its bend turned by the genome's own colours, so it is the same from a saved genome): the Gatelands a hazel staff with the knob of its root left on, its foot bare; the Mark an ash staff shod in iron, an iron
// ring under its knob; Aurenne an olive staff with a turned knob of bronze and a bronze shoe; the Old Blood the tall staff, carved in
// knotwork for 20 cm under its knob, shod in iron. Its top stands under the chin, or over the crown for the Old Blood
const STAFFS = {
  hazel: { top: -.2, knob: 1.75, carve: 0, shoe: null, ring: null, cap: null },
  ash: { top: -.17, knob: 1.55, carve: 0, shoe: [.42, .43, .45], ring: [.42, .43, .45], cap: null },
  olive: { top: -.22, knob: 1.6, carve: 0, shoe: [.62, .45, .22], ring: null, cap: [.62, .45, .22] },
  carved: { top: .1, knob: 1.9, carve: .2, shoe: [.42, .43, .45], ring: null, cap: null } };
// the walking grip (Session 1094): a staff is leant on, not held out as a spear is, so its forearm drops 38° forward and down from
// the elbow (the spear's runs on almost level), the fist by the hip and the staff's foot a hand ahead of the toes; the wrist cocks
// up to keep the knuckles plumb, as before
const STAFF_ARM = new THREE.Vector3(-.1, -.62, .78);
const staffSeed = s => { let h = 2166136261; for (const c of String(s)) h = Math.imul(h ^ c.charCodeAt(0), 16777619); return (h >>> 0) / 4294967296; };
// the staff's centre line (in its frame: y up its axis from the foot, the fist at yF) and its radius at a height and an angle round it.
// The knob is a bulb whose middle is a little over half way up it; a root's knob is lumpy, a turned one round
function staffShape(K, LEN, yF, ph) {
  const RS = SPEAR_R, kn = RS * K.knob, KH = kn * 1.7;
  const bend = y => { const u = y < yF ? (yF - y) / yF : (y - yF) / (LEN - yF), w = Math.max(0, Math.min(1, (Math.abs(y - yF) - .12) / .25)); return w * Math.sin(Math.PI * Math.min(1, u)) * .011; };
  const off = y => { const a = ph + (y > yF ? 0 : 2.1), b = bend(y); return new THREE.Vector3(b * Math.cos(a), 0, b * Math.sin(a)); };
  const r = (y, th) => { const t = LEN - y; let R = RS * (y < yF - .12 ? .9 + .1 * y / (yF - .12) : y > yF + .12 ? 1 + .08 * (y - yF - .12) / (LEN - yF - .12) : 1);
    if (t < KH) { const s = 1 - t / KH, bulb = kn * Math.sqrt(Math.max(0, 1 - ((s - .55) / .45) ** 2)) * (K.cap ? 1 : 1 + .1 * Math.sin(3 * th + 7 * s + ph) + .06 * Math.sin(5 * th - 4 * s)); R = s < .55 ? Math.max(R, bulb) : bulb; }
    // the knotwork: two crossing spirals cut 1.6 mm into the wood, a lattice of strands for the carve's length under the knob
    else if (K.carve && t < KH + K.carve) { const a = 2 * th + y * 70, b = 2 * th - y * 70, g = Math.min(Math.abs(Math.sin(a)), Math.abs(Math.sin(b))), e = Math.min(1, (t - KH) / .012, (KH + K.carve - t) / .012); R -= .0016 * e * Math.max(0, 1 - g / .28); }
    return Math.max(R, .0003); };
  return { off, r, KH, kn };
}
// a tube of rings round the bent centre line, from y0 to y1, closed at the foot when it starts there
function staffTube(S, y0, y1, n, NS) {
  const pos = [], idx = []; for (let k = 0; k <= n; k++) { const y = y0 + (y1 - y0) * k / n, o = S.off(y); for (let j = 0; j < NS; j++) { const th = j / NS * Math.PI * 2, R = S.r(y, th); pos.push(o.x + R * Math.cos(th), y, o.z + R * Math.sin(th)); } }
  for (let k = 0; k < n; k++) for (let j = 0; j < NS; j++) { const a = k * NS + j, b = k * NS + (j + 1) % NS, c = a + NS, d = b + NS; idx.push(a, c, b, b, c, d); }
  if (y0 === 0) { const c0 = pos.length / 3, o = S.off(0); pos.push(o.x, 0, o.z); for (let j = 0; j < NS; j++) idx.push(c0, j, (j + 1) % NS); }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals(); return g;
}
function buildStaff(G, body, byName, meshes, root, grip) {
  root.updateMatrixWorld(true); const D = G.dress, R0 = PACK.rest, PP = posedBody(body);
  let floor = 1e9, crown = -1e9; for (const i of new Set(PACK.G['body'])) { floor = Math.min(floor, PP[i * 3 + 1]); crown = Math.max(crown, PP[i * 3 + 1]); }
  // the walking grip's measures (Session 1094): the fist's height up the body, and how far ahead of the toes the foot comes down
  let toe = -1e9; for (const i of new Set(PACK.G['body'])) if (PP[i * 3 + 1] < floor + .12) toe = Math.max(toe, PP[i * 3 + 2]);
  const make = STAFFS[D.staffMake] ? D.staffMake : ({ markman: 'ash', aurennais: 'olive', oldblood: 'carved' })[G.people] || 'hazel', K = STAFFS[make];
  const A = grip.A, B = grip.C.clone().addScaledVector(A, (floor - grip.C.y) / A.y), yF = grip.C.clone().sub(B).dot(A), LEN = (crown + K.top - floor) / A.y, ph = staffSeed([G.seed ?? 'person', G.people, ...D.staff, ...(G.skin || [])].map(v => typeof v === 'number' ? Math.round(Math.max(0, Math.min(1, v)) * 255) : v).join('|')) * Math.PI * 2;
  const S = staffShape(K, LEN, yF, ph), NS = 32, yK = LEN - S.KH, yC = yK - K.carve - .02;
  const wood = new THREE.MeshStandardMaterial({ color: sRGB(...D.staff), roughness: .62 }), metal = c => new THREE.MeshStandardMaterial({ color: sRGB(...c), metalness: .7, roughness: .35 });
  const st = new THREE.Group(); st.name = 'staff';
  // the wood in two runs of rings: 4 cm apart up the plain shaft, 3 mm apart over the carving and the knob; a turned knob is bronze
  const lo = new THREE.Mesh(staffTube(S, 0, yC, Math.ceil(yC / .04), NS), wood), hi = new THREE.Mesh(staffTube(S, yC, K.cap ? yK : LEN, Math.ceil(((K.cap ? yK : LEN) - yC) / .003), NS), wood); lo.name = hi.name = 'staffWood'; st.add(lo, hi);
  if (K.cap) { const m = new THREE.Mesh(staffTube(S, yK, LEN, 16, NS), metal(K.cap)); m.name = 'staffKnob'; st.add(m); }
  // the shoe on its foot and the ring under the knob, each on the centre line where it sits
  if (K.shoe) { const o = S.off(.03), m = new THREE.Mesh(new THREE.CylinderGeometry(SPEAR_R * .9 + .0012, SPEAR_R * .82, .06, 16), metal(K.shoe)); m.position.set(o.x, .03, o.z); st.add(m); }
  if (K.ring) { const y = yK - .009, o = S.off(y), R = S.r(y, 0) + .0014, m = new THREE.Mesh(new THREE.CylinderGeometry(R, R, .016, 16), metal(K.ring)); m.position.set(o.x, y, o.z); st.add(m); }
  st.traverse(m => { if (m.isMesh) { m.castShadow = m.receiveShadow = true; m.userData.shield = true; } });
  st.position.copy(B); st.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), A); root.add(st); root.updateMatrixWorld(true);
  // what comes near it: every cloud's points but the right hand's, by their distance to its bent centre line against its widest
  // radius at that height; and the fist's points inside it
  let clear = 1, fist = 0; const w = new THREE.Vector3(), rMax = y => { let m = 0; for (let j = 0; j < 16; j++) m = Math.max(m, S.r(y, j / 16 * Math.PI * 2)); return m; };
  eachPoint(wornClouds(body, meshes, root), (x, y, z, i) => { w.set(x, y, z).sub(B); const t = w.dot(A); if (t < 0 || t > LEN) return; const d = w.addScaledVector(A, -t).sub(S.off(t).applyQuaternion(st.quaternion)).length();
    if (d > .08) return; const R = rMax(t); if (i >= 0 && R0[i * 3] < -.39) { if (d < R - .001) fist++; return; } clear = Math.min(clear, d - R); });
  byName['wrist.R'].attach(st);
  let tris = 0; st.traverse(m => { if (m.isMesh) tris += m.geometry.index.count / 3; });
  // its normals point out of it (away from the centre line at their height), so the key light falls on its outside
  let out = 0, nv = 0; for (const m of [lo, hi]) { const P = m.geometry.attributes.position, N = m.geometry.attributes.normal; for (let i = 0; i < P.count; i++) { const y = P.getY(i), o = S.off(y); if (y < .001) continue; nv++; if ((P.getX(i) - o.x) * N.getX(i) + (P.getZ(i) - o.z) * N.getZ(i) > 0) out++; } }
  let bendMax = 0, trueAt = 0; for (let y = 0; y <= LEN; y += .01) { const b = S.off(y).length(); bendMax = Math.max(bendMax, b); if (Math.abs(y - yF) < .1) trueAt = Math.max(trueAt, b); }
  return { mesh: st, stats: { make, len: +LEN.toFixed(3), top: +(B.y + LEN * A.y - crown).toFixed(3), foot: +(B.y - floor).toFixed(4), lean: +Math.acos(Math.min(1, A.y)).toFixed(3), fistAt: +(yF / LEN).toFixed(3), fistH: +((grip.C.y - floor) / (crown - floor)).toFixed(3), ahead: +(B.z - toe).toFixed(3), knob: +(2 * S.kn).toFixed(4),
    bend: +bendMax.toFixed(4), trueAtFist: +trueAt.toFixed(4), carve: K.carve, outward: +(out / nv).toFixed(3), clear: +clear.toFixed(4), fist, gap: grip.gap, thumbIn: grip.thumbIn, thumbGap: grip.thumbGap, palm: grip.palm, gripPts: grip.n, curl: grip.curl, tris } };
}
// the crossbow (Session 941; L7, OG-028, Michael's 6 A: the spear and the crossbow first), carried point down in the right fist by
// the wrist of its tiller, the stock plumb through the fist as the spear's shaft is, the butt up by the forearm and the prod and its
// stirrup down by the shin, the prod spanning fore and aft so neither tip comes near the leg, the bolt's face turned out. Unspanned:
// the string braced straight across the tiller's top, no bolt. The make by island (L7's rule): the Gatelands a yew prod lashed on
// with cord and a bone nut; the Mark a short iron prod in an iron bridle; Aurenne a lacquered prod of horn and sinew with horn
// tips, bound in gold. Built in its own frame: y along the tiller to the butt, the grip's middle at 0, x out of the bolt's face, z along the prod
const CROSSBOWS = {
  wood: { span: .66, bend: .05, prod: [.6, .4, .2], metal: false, bind: [.3, .2, .13], binds: 3, nut: [.86, .82, .72], stirrup: [.42, .43, .45] },
  steel: { span: .6, bend: .035, prod: [.5, .51, .53], metal: true, bind: [.4, .41, .43], binds: 2, bindMetal: true, nut: [.5, .51, .53], stirrup: [.42, .43, .45] },
  horn: { span: .64, bend: .055, prod: [.36, .13, .08], metal: false, tips: [.82, .74, .58], bind: [.86, .68, .3], binds: 2, bindMetal: true, nut: [.62, .45, .22], stirrup: [.62, .45, .22] } };
// the tiller's section along its length: half its depth (a, out of the bolt's face), half its width (c), how square it is (e, 1 round),
// and how far its middle drops toward the belly (o). Round in the fist; a squared fore-stock to the prod; the butt deepening and dropping
const CB_FRONT = -.6, CB_BUTT = .31, CB_PROD = -.54;
function tillerAt(y) { const L = (a, b, t) => a + (b - a) * Math.max(0, Math.min(1, t)), R = SPEAR_R;
  if (y < -.075) { const t = (y - CB_FRONT) / .04; return { a: L(.019, .024, t), c: L(.016, .019, t), e: .45, o: 0 }; }
  if (y < -.06) { const t = (y + .075) / .015; return { a: L(.024, R, t), c: L(.019, R, t), e: L(.45, 1, t), o: 0 }; }
  if (y < .115) return { a: R, c: R, e: 1, o: 0 };
  if (y < .13) { const t = (y - .115) / .015; return { a: L(R, .018, t), c: L(R, .017, t), e: L(1, .5, t), o: 0 }; }
  const t = (y - .13) / (CB_BUTT - .13); return { a: L(.018, .05, t ** .8), c: L(.017, .026, t), e: .5, o: -.026 * t * t };
}
// a tube of superelliptic section swept along a path of frames: p the point, n and b the section's axes, a and c their half sizes
function sweepTube(frames, S = 12) {
  const pos = [], idx = [], n = frames.length;
  for (const f of frames) for (let k = 0; k < S; k++) { const th = k / S * Math.PI * 2, cs = Math.cos(th), sn = Math.sin(th), u = f.a * Math.sign(cs) * Math.abs(cs) ** f.e, w = f.c * Math.sign(sn) * Math.abs(sn) ** f.e;
    pos.push(f.p.x + f.n.x * u + f.b.x * w, f.p.y + f.n.y * u + f.b.y * w, f.p.z + f.n.z * u + f.b.z * w); }
  for (let j = 0; j < n - 1; j++) for (let k = 0; k < S; k++) { const a = j * S + k, b = j * S + (k + 1) % S, c = a + S, d = b + S; idx.push(a, c, b, b, c, d); }
  for (const [j, s] of [[0, -1], [n - 1, 1]]) { const ci = pos.length / 3, f = frames[j]; pos.push(f.p.x, f.p.y, f.p.z); for (let k = 0; k < S; k++) { const a = j * S + k, b = j * S + (k + 1) % S; if (s < 0) idx.push(ci, a, b); else idx.push(ci, b, a); } }
  // wound outward when the path runs along b × n; else every triangle is turned over
  const f0 = frames[0], dir = frames[1].p.clone().sub(f0.p); if (dir.dot(f0.b.clone().cross(f0.n)) < 0) for (let t = 0; t < idx.length; t += 3) { const q = idx[t + 1]; idx[t + 1] = idx[t + 2]; idx[t + 2] = q; }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals(); return g;
}
function crossbowParts(D, make) {
  const K = CROSSBOWS[make], X = new THREE.Vector3(1, 0, 0), Y = new THREE.Vector3(0, 1, 0), Z = new THREE.Vector3(0, 0, 1), parts = [];
  const mat = (c, metal) => new THREE.MeshStandardMaterial({ color: sRGB(...c), metalness: metal ? .65 : 0, roughness: metal ? .35 : .65 });
  const wood = mat(D.crossbow, false), dark = mat([.08, .06, .05], false);
  // the tiller
  const tf = []; for (let k = 0; k <= 90; k++) { const y = CB_FRONT + (CB_BUTT - CB_FRONT) * k / 90, s = tillerAt(y); tf.push({ p: new THREE.Vector3(s.o, y, 0), n: X, b: Z, a: s.a, c: s.c, e: s.e }); }
  parts.push(new THREE.Mesh(sweepTube(tf, 16), wood));
  const top = tillerAt(CB_PROD).a, px = top + .006;
  // the prod: bowed, its tips swept 3.5 to 6 cm back toward the butt, thinning to them; seated across the tiller's top
  const yAt = z => CB_PROD + K.bend * (2 * z / K.span) ** 2, pf = [];
  for (let k = 0; k <= 32; k++) { const z = -K.span / 2 + K.span * k / 32, t = Math.abs(2 * z / K.span), dy = 4 * K.bend * z / K.span ** 2 * 2, tan = new THREE.Vector3(0, dy, 1).normalize(), b = new THREE.Vector3(0, 1, 0).addScaledVector(tan, -tan.y).normalize();
    pf.push({ p: new THREE.Vector3(px, yAt(z), z), n: X, b, a: .016 - .006 * t, c: .014 - .0075 * t, e: .6 }); }
  const prod = new THREE.Mesh(sweepTube(pf), mat(K.prod, K.metal)); parts.push(prod);
  const tipY = yAt(K.span / 2);
  if (K.tips) for (const s of [-1, 1]) { const tp = new THREE.Mesh(new THREE.CylinderGeometry(.0072, .0085, .05, 10), mat(K.tips, false)); tp.rotation.x = Math.PI / 2; tp.position.set(px, tipY - .002, s * (K.span / 2 - .022)); parts.push(tp); }
  // the string, braced straight from nock to nock over the tiller's top, and its two nocks
  const str = new THREE.Mesh(new THREE.CylinderGeometry(.0022, .0022, K.span - .02, 6), mat([.78, .72, .6], false)); str.rotation.x = Math.PI / 2; str.position.set(px, tipY - .004, 0); parts.push(str);
  // the bridle: the prod bound to the tiller fore and aft of it (cord, or iron, or gold)
  const bindM = mat(K.bind, K.bindMetal); for (let k = 0; k < K.binds; k++) for (const s of [-1, 1]) { const y = CB_PROD + s * (.024 + k * .011), sc = tillerAt(y);
    const r = new THREE.Mesh(new THREE.TorusGeometry(1, .1, 6, 20), bindM); r.rotation.x = Math.PI / 2; r.scale.set(sc.a + .0025, sc.c + .0025, .025); r.position.set(sc.o, y, 0); parts.push(r); }
  // the nut, half sunk in the tiller's top; the groove the bolt lies in; the long trigger lever under the belly, ahead of the fingers
  const nut = new THREE.Mesh(new THREE.CylinderGeometry(.012, .012, .03, 14), mat(K.nut, make !== 'wood')); nut.rotation.x = Math.PI / 2; nut.position.set(tillerAt(-.15).a, -.15, 0); parts.push(nut);
  const gr = new THREE.Mesh(new THREE.BoxGeometry(.002, .33, .005), dark); gr.position.set(tillerAt(-.33).a + .0002, -.335, 0); parts.push(gr);
  const lev = new THREE.Mesh(new THREE.BoxGeometry(.007, .075, .008), mat([.42, .43, .45], true)); lev.position.set(-tillerAt(-.12).a - .0045, -.115, 0); lev.rotation.z = .06; parts.push(lev);
  // the stirrup at the front, for the foot when it is spanned
  const st = new THREE.Mesh(new THREE.TorusGeometry(.05, .0055, 6, 24), mat(K.stirrup, true)); st.rotation.y = Math.PI / 2; st.scale.set(1, 1.3, 1); st.position.set(0, CB_FRONT - .052, 0); parts.push(st);
  // a gold ferrule at the butt's heel and the grip's ends, for Aurenne's fine work
  if (make === 'horn') for (const y of [-.07, .123, CB_BUTT - .012]) { const sc = tillerAt(y), r = new THREE.Mesh(new THREE.TorusGeometry(1, .12, 6, 20), bindM); r.rotation.x = Math.PI / 2; r.scale.set(sc.a + .002, sc.c + .002, .02); r.position.set(sc.o, y, 0); parts.push(r); }
  return { parts, K, px, tipY };
}
// whether a point in the crossbow's frame is inside it (the tiller by its section, the prod as a bowed box, the stirrup by its box),
// and how far outside the nearest of them it is
function crossbowDist(K, px, x, y, z) {
  let d = 1;
  if (y >= CB_FRONT && y <= CB_BUTT) { const s = tillerAt(y), u = Math.abs(x - s.o) / s.a, w = Math.abs(z) / s.c, q = u ** (2 / s.e) + w ** (2 / s.e); d = Math.min(d, Math.min(s.a, s.c) * (q ** (s.e / 2) - 1)); }
  if (Math.abs(z) <= K.span / 2) { const t = Math.abs(2 * z / K.span), yc = CB_PROD + K.bend * t * t; d = Math.min(d, Math.max(Math.abs(x - px) - (.016 - .006 * t), Math.abs(y - yc) - (.014 - .0075 * t))); }
  d = Math.min(d, Math.max(Math.abs(x) - .006, Math.abs(y - (CB_FRONT - .052)) - .07, Math.abs(z) - .056));
  return d;
}
function buildCrossbow(G, body, byName, meshes, root, grip) {
  root.updateMatrixWorld(true); const D = G.dress, R0 = PACK.rest, PP = posedBody(body);
  let floor = 1e9; for (const i of new Set(PACK.G['body'])) floor = Math.min(floor, PP[i * 3 + 1]);
  const make = CROSSBOWS[D.crossbowMake] ? D.crossbowMake : ({ markman: 'steel', aurennais: 'horn' })[G.people] || 'wood', P = crossbowParts(D, make);
  const cb = new THREE.Group(); cb.name = 'crossbow'; for (const m of P.parts) { m.castShadow = m.receiveShadow = true; m.userData.shield = true; cb.add(m); }
  // its frame in the world: y the fist's axis, z the body's forward made square to it (and turned), x out of the bolt's face, turned away from the body
  // (turned 16° about the tiller, so the prod's back tip swings out from the thigh behind the fist)
  const A = grip.A.clone().normalize(), F0 = new THREE.Vector3(0, 0, 1).addScaledVector(A, -A.z).normalize(), S0 = A.clone().cross(F0), sw = S0.x * Math.sign(grip.C.x) < 0 ? 1 : -1;
  const F = F0.clone().multiplyScalar(Math.cos(.28)).addScaledVector(S0, sw * Math.sin(.28)), T = A.clone().cross(F);
  if (T.x * grip.C.x < 0) T.negate(); const Zw = T.clone().cross(A);
  cb.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(T, A, Zw)); cb.position.copy(grip.C); root.add(cb); root.updateMatrixWorld(true);
  const inv = cb.matrixWorld.clone().invert(), v = new THREE.Vector3();
  let clear = 1, fist = 0, handN = 0, low = 1e9;
  eachPoint(wornClouds(body, meshes, root), (x, y, z, i) => { v.set(x, y, z).applyMatrix4(inv); if (v.y < CB_FRONT - .14 || v.y > CB_BUTT + .01 || Math.abs(v.z) > P.K.span / 2 + .01) return; const d = crossbowDist(P.K, P.px, v.x, v.y, v.z);
    if (i >= 0 && R0[i * 3] < -.39) { handN++; if (d < -.001) fist++; return; } clear = Math.min(clear, d); });
  cb.traverse(m => { if (!m.isMesh) return; const a = m.geometry.attributes.position; for (let k = 0; k < a.count; k++) { v.fromBufferAttribute(a, k).applyMatrix4(m.matrixWorld); low = Math.min(low, v.y); } });
  byName['wrist.R'].attach(cb);
  let tris = 0; cb.traverse(m => { if (m.isMesh) tris += m.geometry.index ? m.geometry.index.count / 3 : m.geometry.attributes.position.count / 3; });
  const butt = new THREE.Vector3(0, CB_BUTT, 0).applyMatrix4(cb.matrixWorld), out = T.x * Math.sign(grip.C.x);
  return { mesh: cb, stats: { make, span: P.K.span, len: +(CB_BUTT - CB_FRONT + .12).toFixed(3), clear: +clear.toFixed(4), fist, handPts: handN, low: +(low - floor).toFixed(3), butt: +(butt.y - floor).toFixed(3), out: +out.toFixed(3), lean: +Math.acos(Math.min(1, A.y)).toFixed(3), gap: grip.gap, thumbIn: grip.thumbIn, thumbGap: grip.thumbGap, curl: grip.curl, gripPts: grip.n, tris } };
}
// ── the Gatelanders' basket (Session 1033, L1; OG-048's farm woman with a basket, OG-059's "a basket", both sheets' woven baskets) ──
// An oval market basket of willow carried by its bow handle in the right fist, the arm hanging straight with the weight, the
// basket plumb under the fist with its length fore and aft along the leg. Stakes and weavers drawn on a canvas (randed over and
// under, the stakes showing between the rows), a rolled rim, and a bow handle wrapped in a spiral of skeins. In it a linen cloth
// over the load (D.basketCloth) or, with no cloth, a heap of apples. Its numbers, in metres: 38 cm long and 27 wide at the rim, 30
// and 20 at the foot, 17 deep, the handle's crown 15 cm over the rim. Built in its own frame: x along its length, y up, z across,
// the foot's middle at 0. The arm is lifted out from the side, three hundredths of a radian at a time, until nothing of the person
// or what they wear (the right hand apart) is within a centimetre of its sides
const BASKET = { a0: .15, b0: .1, a1: .19, b1: .135, D: .17, h: .15, flat: .065, wall: .007, R: SPEAR_R };
function wickerTex() {
  if (TEXW.wicker) return TEXW.wicker; const N = 256, c = document.createElement('canvas'); c.width = c.height = N; const x = c.getContext('2d'), img = x.createImageData(N, N);
  // eight stakes across the tile and eight rows of weavers up it; a weaver passes in front of a stake on alternate rows and stakes,
  // and is round in section (darker at its top and bottom edges); where it passes behind, the stake shows, round across its width
  const S = N / 8, Rw = N / 8;
  for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) { const si = Math.floor(i / S), rj = Math.floor(j / Rw), fu = (i % S) / S, fv = (j % Rw) / Rw;
    const stake = Math.abs(fu - .5) < .17, front = (si + rj) % 2 === 0, gap = fv < .06 || fv > .94; let v;
    if (gap) v = .22;
    else if (stake && !front) v = .55 + .4 * Math.sin(Math.PI * (fu - .33) / .34);
    else { const e = Math.sin(Math.PI * fv), bow = front ? .1 * Math.cos(Math.PI * (fu - .5)) : -.12 * (stake ? 0 : 1 - Math.abs(fu - .5) * 2); v = (.45 + .5 * e) * (1 + bow); }
    v *= .9 + .1 * Math.sin(i * 1.7 + j * .3) * Math.sin(j * .9); const k = (j * N + i) * 4; img.data[k] = img.data[k + 1] = img.data[k + 2] = Math.max(0, Math.min(255, v * 255)); img.data[k + 3] = 255; }
  x.putImageData(img, 0, 0); const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 4; return (TEXW.wicker = t);
}
function basketParts(D) {
  const K = BASKET, NT = 64, NJ = 10, parts = [], tex = wickerTex(), col = sRGB(...D.basket);
  const willow = new THREE.MeshStandardMaterial({ color: col, map: tex, bumpMap: tex, bumpScale: 1.4, roughness: .8, side: THREE.DoubleSide });
  const ax = s => K.a0 + (K.a1 - K.a0) * s ** .8, bz = s => K.b0 + (K.b1 - K.b0) * s ** .8, pos = [], uv = [], idx = [];
  // the wall, outside and in (the inside a wall's thickness in), and the foot under it; u runs five tiles round (40 stakes), v a tile in 8 cm
  for (const [off, flip] of [[0, false], [K.wall, true]]) { const b0 = pos.length / 3;
    for (let j = 0; j <= NJ; j++) { const s = j / NJ, y = (flip ? K.wall : 0) + s * (K.D - (flip ? K.wall : 0)); for (let t = 0; t <= NT; t++) { const th = t / NT * Math.PI * 2; pos.push((ax(s) - off) * Math.cos(th), y, (bz(s) - off) * Math.sin(th)); uv.push(t / NT * 5, y / .08); } }
    for (let j = 0; j < NJ; j++) for (let t = 0; t < NT; t++) { const a = b0 + j * (NT + 1) + t, b = a + NT + 1; if (flip) idx.push(a, a + 1, b, a + 1, b + 1, b); else idx.push(a, b, a + 1, a + 1, b, b + 1); } }
  for (const [y, off, flip] of [[0, 0, true], [K.wall, K.wall, false]]) { const c0 = pos.length / 3; pos.push(0, y, 0); uv.push(0, 0);
    for (let t = 0; t <= NT; t++) { const th = t / NT * Math.PI * 2; pos.push((K.a0 - off) * Math.cos(th), y, (K.b0 - off) * Math.sin(th)); uv.push(Math.cos(th) * 2, Math.sin(th) * 2); }
    for (let t = 0; t < NT; t++) if (flip) idx.push(c0, c0 + 1 + t, c0 + 2 + t); else idx.push(c0, c0 + 2 + t, c0 + 1 + t); }
  const wg = new THREE.BufferGeometry(); wg.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); wg.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); wg.setIndex(idx); wg.computeVertexNormals();
  const wall = new THREE.Mesh(wg, willow); wall.name = 'basketWall'; parts.push(wall);
  // the rim: a roll 1 cm round over the wall's top, and the bow handle, a tube 2.6 cm thick (the spear's, so the fist closes on it as it
  // does on a shaft) from 3 cm down the wall at one end, over the top, to the other, straight and level for 13 cm over its crown where the fist closes; both wound with skeins (u along their length)
  const rimPts = []; for (let t = 0; t <= NT; t++) { const th = t / NT * Math.PI * 2; rimPts.push(new THREE.Vector3((K.a1 - K.wall / 2) * Math.cos(th), K.D + .004, (K.b1 - K.wall / 2) * Math.sin(th))); }
  const rg = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(rimPts, true), 96, .0105, 8, true); { const u = rg.attributes.uv; for (let k = 0; k < u.count; k++) u.setXY(k, u.getX(k) * 60 + u.getY(k), u.getY(k) * .6); }
  const hp = [], e = K.a1 - K.wall / 2 - .002; for (let k = 0; k <= 40; k++) { const x = -e + 2 * e * k / 40, u = Math.max(0, (Math.abs(x) - K.flat) / (e - K.flat)); hp.push(new THREE.Vector3(x, K.D - .03 + (K.h + .03) * Math.sqrt(Math.max(0, 1 - u * u)), 0)); }
  const hc = new THREE.CatmullRomCurve3(hp), hg = new THREE.TubeGeometry(hc, 64, K.R, 10, false); { const u = hg.attributes.uv; for (let k = 0; k < u.count; k++) u.setXY(k, u.getX(k) * 40 + u.getY(k) * 1.2, u.getY(k) * .8); }
  const rim = new THREE.Mesh(rg, willow); rim.name = 'basketRim'; parts.push(rim); const handle = new THREE.Mesh(hg, willow); handle.name = 'basketHandle'; parts.push(handle);
  // what is in it: a cloth over the load, domed a little and rucked, tucked in under the rim; or apples heaped to just over it
  if (D.basketCloth) { const cp = [], ci = [], NR = 8; for (let r = 0; r <= NR; r++) for (let t = 0; t <= NT; t++) { const s = r / NR, th = t / NT * Math.PI * 2, rr = s * .97;
      cp.push((K.a1 - K.wall) * rr * Math.cos(th), K.D - .006 + .045 * (1 - s * s) + .006 * Math.sin(5 * th + 1.3) * s * s + .004 * Math.sin(3 * th) * s, (K.b1 - K.wall) * rr * Math.sin(th)); }
    for (let r = 0; r < NR; r++) for (let t = 0; t < NT; t++) { const a = r * (NT + 1) + t, b = a + NT + 1; ci.push(a, a + 1, b, a + 1, b + 1, b); }
    const cg = new THREE.BufferGeometry(); cg.setAttribute('position', new THREE.Float32BufferAttribute(cp, 3)); cg.setIndex(ci); cg.computeVertexNormals();
    const cloth = new THREE.Mesh(cg, clothMat(sRGB(...D.basketCloth), 'wool', { side: THREE.DoubleSide, scale: 40 })); cloth.name = 'basketCloth'; parts.push(cloth); }
  else { const ap = [], an = [], ac = [], ai = [], sg = new THREE.SphereGeometry(.036, 12, 9), rnd = seeded('apples'), P = sg.attributes.position, Nn = sg.attributes.normal, I = sg.index.array;
    const spots = []; for (const [n, rr, y] of [[1, 0, K.D - .02], [6, .55, K.D - .03], [5, .3, K.D + .012]]) for (let k = 0; k < n; k++) { const th = (k + (n === 5 ? .5 : 0)) / n * Math.PI * 2; spots.push([(K.a1 - .05) * rr * Math.cos(th) * (n === 5 ? 1.2 : 1), y + (n === 1 ? .03 : 0), (K.b1 - .05) * rr * Math.sin(th)]); }
    for (const [x0, y0, z0] of spots) { const b = ap.length / 3, red = rnd() < .7, c = red ? [.55 + .15 * rnd(), .1 + .08 * rnd(), .06] : [.45, .55 + .1 * rnd(), .15], s = .9 + .2 * rnd();
      for (let k = 0; k < P.count; k++) { const y = P.getY(k); ap.push(x0 + P.getX(k) * s, y0 + y * s * .88 - (Math.abs(y) > .03 ? .004 * Math.sign(y) : 0), z0 + P.getZ(k) * s); an.push(Nn.getX(k), Nn.getY(k), Nn.getZ(k)); const sh = .8 + .2 * (y / .036); ac.push(...c.map(v => v * sh)); }
      for (const i of I) ai.push(b + i); }
    const ag = new THREE.BufferGeometry(); ag.setAttribute('position', new THREE.Float32BufferAttribute(ap, 3)); ag.setAttribute('normal', new THREE.Float32BufferAttribute(an, 3)); ag.setAttribute('color', new THREE.Float32BufferAttribute(ac, 3)); ag.setIndex(ai);
    const apples = new THREE.Mesh(ag, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: .45 })); apples.name = 'basketApples'; parts.push(apples); }
  return { parts, handleCurve: hc, ax, bz };
}
// whether a point in the basket's frame is within its sides (grown by m): under the rim, inside the oval at its height
function basketIn(K, ax, bz, x, y, z, m) { if (y < -m || y > K.D + m) return false; const s = Math.max(0, Math.min(1, y / K.D)); return (x / (ax(s) + m)) ** 2 + (z / (bz(s) + m)) ** 2 < 1; }
function buildBasket(G, body, byName, meshes, root, grip) {
  const D = G.dress, K = BASKET, R0 = PACK.rest, wr = byName['wrist.R'], arm = byName['upperarm01.R'], P = basketParts(D);
  const bk = new THREE.Group(); bk.name = 'basket'; for (const m of P.parts) { m.castShadow = m.receiveShadow = true; m.userData.shield = true; bk.add(m); } root.add(bk);
  // the grip is kept in the wrist's frame, so it goes where the arm goes
  root.updateMatrixWorld(true); const toW = wr.matrixWorld.clone().invert(), Cl = grip.C.clone().applyMatrix4(toW), Al = grip.A.clone().transformDirection(toW);
  let floor = 1e9; { const PP = posedBody(body); for (const i of new Set(PACK.G['body'])) floor = Math.min(floor, PP[i * 3 + 1]); }
  const place = () => { root.updateMatrixWorld(true); const C = Cl.clone().applyMatrix4(wr.matrixWorld), A = Al.clone().transformDirection(wr.matrixWorld); A.y = 0; A.normalize(); if (A.z < 0) A.negate();
    const Y = new THREE.Vector3(0, 1, 0), Z = A.clone().cross(Y); bk.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(A, Y, Z)); bk.position.copy(C).addScaledVector(Y, -(K.D + K.h)); root.updateMatrixWorld(true); return C; };
  const test = () => { const inv = bk.matrixWorld.clone().invert(), v = new THREE.Vector3(); let n = 0, clear = 1, tested = 0;
    eachPoint(wornClouds(body, meshes, root), (x, y, z, i) => { if (i >= 0 && R0[i * 3] < -.39) return; v.set(x, y, z).applyMatrix4(inv); if (v.y < -.02 || v.y > K.D + .02) return; tested++;
      if (basketIn(K, P.ax, P.bz, v.x, v.y, v.z, .01)) n++; const s = Math.max(0, Math.min(1, v.y / K.D)), e = Math.hypot(v.x / P.ax(s), v.z / P.bz(s)); if (e > 1) clear = Math.min(clear, (e - 1) * Math.min(P.ax(s), P.bz(s))); });
    return { n, clear, tested }; };
  let lift = 0, T; place(); for (;;) { T = test(); if (!T.n || lift >= .6) break; lift += .03; arm.quaternion.multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), -.03)); place(); }
  // the fist on the handle: the right hand's points inside the handle's tube, by their distance to its curve near the crown
  const inv = bk.matrixWorld.clone().invert(), v = new THREE.Vector3(), HP = P.handleCurve.getSpacedPoints(200); let fist = 0, handN = 0;
  eachPoint(wornClouds(body, meshes, root), (x, y, z, i) => { if (i < 0 || R0[i * 3] >= -.39) return; v.set(x, y, z).applyMatrix4(inv); let d = 1; for (const p of HP) d = Math.min(d, p.distanceTo(v)); if (d < .05) handN++; if (d < K.R - .001) fist++; });
  const foot = bk.getWorldPosition(new THREE.Vector3()).y - floor; wr.attach(bk);
  let tris = 0; bk.traverse(m => { if (m.isMesh) tris += m.geometry.index ? m.geometry.index.count / 3 : m.geometry.attributes.position.count / 3; });
  return { mesh: bk, stats: { load: D.basketCloth ? 'cloth' : 'apples', inside: T.n, tested: T.tested, clear: +T.clear.toFixed(4), lift: +lift.toFixed(2), fist, handPts: handN, foot: +foot.toFixed(3), gap: grip.gap, thumbIn: grip.thumbIn, thumbGap: grip.thumbGap, curl: grip.curl, gripPts: grip.n, tris } };
}
// the sash belt's promises (Session 1010), read on the posed meshes round the waist's own axis, at 15 points on every triangle: in 72
// angles and 1 cm rows, nothing worn under it (the tunic, a skirt, a bodice, mail, the body) stands out past its inside, no point of
// an arm is within it, and a leather belt worn over it lies outside it
// the wheeled chair (Session 1106; L1, OG-065's Garrick, "a veteran in a wheeled chair"): an oak armchair on two big cart wheels
// beside the seat and two small wheels under its front legs, a footboard hung from its front, a handle off each back post for whoever
// pushes it. The person sits first (makePerson's seated pose) and the chair is built to them, in the root's frame: the seat under the
// lowest point of the seat and thighs, the back behind the furthest point of the back, the arms under the forearms, the footboard
// under the soles; the ground is under the footboard and both pairs of wheels stand on it. Plain wood and iron, no hand rims: it is pushed
// the seated pose (Session 1106): radians at the hip and knee, the thighs' spread, the forearms' aim (out, down, forward)
const SEAT = { hip: 1.5, knee: 1.32, spread: .07, foreOut: .03, foreDown: -.02, curl: [.5, .45, .3] };
const CHAIR = { R: .31, r: .075, tyre: .016, spokes: 10, board: .028, rail: [.05, .032], post: .042, foot: .06, gap: .002 };
function buildChair(G, body, byName, meshes, root) {
  root.updateMatrixWorld(true); const D = G.dress, R0 = PACK.rest, C = CHAIR, clouds = wornClouds(body, meshes, root);
  const at = n => new THREE.Vector3().setFromMatrixPosition(byName[n].matrixWorld);
  // the measures, off everything worn: the seat (rest y -.42 to .08 inside the arms), the back (rest y .1 to .55), the soles, the forearms
  let seatY = 1e9, hipX = 0, backZ = 1e9, kneeZ = -1e9, footY = 1e9, footZ = [1e9, -1e9], footX = 0, shinX = 0, top = -1e9, pitZ = 1e9;
  const fore = ['L', 'R'].map(s => ({ e: at('lowerarm01.' + s), w: at('wrist.' + s), y: 1e9, x: 0, n: 0, z: [1e9, -1e9] })), v = new THREE.Vector3();
  eachPoint(clouds, (x, y, z, i) => { if (i < 0) return; const rx = Math.abs(R0[i * 3]), ry = R0[i * 3 + 1]; top = Math.max(top, y);
    if (ry > -.42 && ry < .08 && rx < .3) { seatY = Math.min(seatY, y); kneeZ = Math.max(kneeZ, z); }
    if (ry > .1 && ry < .55 && rx < .25) backZ = Math.min(backZ, z);
    if (ry < -.55) shinX = Math.max(shinX, Math.abs(x));
    if (ry < -.74) { footY = Math.min(footY, y); footZ[0] = Math.min(footZ[0], z); footZ[1] = Math.max(footZ[1], z); footX = Math.max(footX, Math.abs(x)); }
    if (rx > .28 && ry < .35) for (const F of fore) { const a = F.w.clone().sub(F.e), t = v.set(x, y, z).sub(F.e).dot(a) / a.lengthSq(); if (t < -.1 || t > 1.05) continue; if (v.addScaledVector(a, -t).length() > .07) continue;
      F.y = Math.min(F.y, y); F.x += x; F.n++; F.z[0] = Math.min(F.z[0], z); F.z[1] = Math.max(F.z[1], z); } });
  // a sole built after the pose (a sandal's) is under the foot too
  eachPoint(clouds, (x, y, z, i) => { if (i < 0 && y < seatY - .2) { footY = Math.min(footY, y); footZ[0] = Math.min(footZ[0], z); footZ[1] = Math.max(footZ[1], z); footX = Math.max(footX, Math.abs(x)); } if (i < 0) return; if (R0[i * 3 + 1] > -.42 && R0[i * 3 + 1] < .08 && Math.abs(R0[i * 3]) < .3 && y < seatY + .22) hipX = Math.max(hipX, Math.abs(x));
    // the backs of the knees, which the bend draws down below the seat's line: the seat stops a centimetre short of them
    if (R0[i * 3 + 1] > -.56 && R0[i * 3 + 1] < -.42 && Math.abs(R0[i * 3]) < .3 && y < seatY + .004) pitZ = Math.min(pitZ, z); });
  for (const F of fore) F.x /= F.n || 1;
  // the hair down the back (a braid, a tail, loose hair) lies between the back and the chair's: the back stands behind it too
  const hairPts = []; for (const m of meshes) if (m.name === 'hair') { const X = posedOf(m); for (let k = 0; k < X.length; k += 3) hairPts.push(X[k], X[k + 1], X[k + 2]); }
  let hairZ = 1e9; for (let k = 0; k < hairPts.length; k += 3) if (hairPts[k + 1] > seatY && Math.abs(hairPts[k]) < hipX + .05 && hairPts[k + 2] < backZ + .06) hairZ = Math.min(hairZ, hairPts[k + 2]);
  const bodyBack = backZ; backZ = Math.min(backZ, hairZ);
  const P = C.post, ground = footY - C.gap - C.board - C.foot, sTop = seatY - C.gap, backTop = sTop + Math.max(.42, (top - sTop) * .62), railX = Math.max(Math.abs(fore[0].x), Math.abs(fore[1].x), hipX + P / 2 + .012), W = railX + P / 2;
  // and behind whatever else is worn within its height and width, the arms apart (a head-wrap's or a headscarf's knot at the nape)
  eachPoint(clouds, (x, y, z, i) => { if (y > sTop + .05 && y < backTop + .02 && Math.abs(x) < W && !(i >= 0 && Math.abs(R0[i * 3]) > .3)) backZ = Math.min(backZ, z); });
  const z0 = backZ - C.gap - C.board, zb0 = z0 - P, zF = Math.min(kneeZ - .085, pitZ - .01), railFs = { [-1]: at('finger3-1.R').z - .018, 1: at('finger3-1.L').z - .018 }, railF = Math.min(railFs[-1], railFs[1]);
  // each arm's top just under the lowest thing over it, from the back post to the knuckles (the forearm, the elbow, a sleeve)
  let railY = Math.min(fore[0].y, fore[1].y);
  eachPoint(clouds, (x, y, z) => { if (y < sTop + .08) return; for (const s of [-1, 1]) if (Math.abs(x - s * railX) < C.rail[0] / 2 + .003 && z > zb0 && z < railFs[s]) railY = Math.min(railY, y); });
  railY -= C.gap;
  const wood = new THREE.MeshStandardMaterial({ color: sRGB(...D.chair), roughness: .7 }), dark = new THREE.MeshStandardMaterial({ color: sRGB(...D.chair).multiplyScalar(.7), roughness: .75 }), iron = new THREE.MeshStandardMaterial({ color: sRGB(.16, .15, .14), metalness: .75, roughness: .45 });
  const ch = new THREE.Group(); ch.name = 'chair'; const boxes = [];
  const box = (name, x0, x1, y0, y1, zA, zB, m = wood) => { const g = new THREE.BoxGeometry(x1 - x0, y1 - y0, zB - zA), b = new THREE.Mesh(g, m); b.position.set((x0 + x1) / 2, (y0 + y1) / 2, (zA + zB) / 2); b.name = name; ch.add(b); boxes.push({ name, lo: [x0, y0, zA], hi: [x1, y1, zB] }); return b; };
  // the seat, a board between the arms' posts; its frame under it to the posts
  box('chairSeat', -W, W, sTop - C.board, sTop, z0, zF);
  // the back: two posts behind the back's furthest point, from under the seat to the shoulder blades, and three rails between
  for (const s of [-1, 1]) box('chairPost', s * W - P / 2, s * W + P / 2, ground + C.R * .9, backTop, zb0, z0 + .002);
  for (const f of [.3, .62, .94]) box('chairBack', -W + P / 2, W - P / 2, sTop + (backTop - sTop) * f - .035, sTop + (backTop - sTop) * f + .035, zb0 + .01, z0, dark);
  // the push handles, back from the posts' tops
  for (const s of [-1, 1]) box('chairHandle', s * W - .014, s * W + .014, backTop - .06, backTop - .03, zb0 - .14, zb0, dark);
  // the arms: a rail under each forearm from the back post to the front post, which stands on the seat's front corner and goes down to its small wheel
  for (const s of [-1, 1]) { box('chairArm', s * railX - C.rail[0] / 2, s * railX + C.rail[0] / 2, railY - C.rail[1], railY, zb0, railFs[s]);
    box('chairLeg', s * W - P / 2, s * W + P / 2, ground + 2 * C.r + .01, railY - C.rail[1], railF - P / 2, railF + P / 2); }
  // the side frames under the seat, the axle's brackets and the axle
  for (const s of [-1, 1]) box('chairRail', s * W - P / 2, s * W + P / 2, sTop - C.board - .05, sTop - C.board, zb0, railF + P / 2);
  const wz = z0 + .08, wy = ground + C.R, wx = W + P / 2 + .03;
  for (const s of [-1, 1]) box('chairBracket', s * W - P / 2, s * W + P / 2, wy - .03, sTop - C.board - .05, wz - .025, wz + .025, dark);
  { const a = new THREE.Mesh(new THREE.CylinderGeometry(.016, .016, 2 * wx + .05, 12), iron); a.rotation.z = Math.PI / 2; a.position.set(0, wy, wz); a.name = 'chairAxle'; ch.add(a); }
  // the footboard under the soles, on two hangers from the seat's front rail
  const fx = Math.max(footX, shinX) + .015, fz0 = Math.min(footZ[0] - .02, zF - .02), fz1 = footZ[1] + .03;
  box('chairFoot', -fx - .03, fx + .03, footY - C.gap - C.board, footY - C.gap, fz0, fz1);
  for (const s of [-1, 1]) box('chairHanger', s > 0 ? fx : -fx - .03, s > 0 ? fx + .03 : -fx, footY - C.gap - C.board, sTop - C.board - .05, fz0, fz0 + .03, dark);
  // a wheel: an iron tyre on a wooden felloe, turned spokes, a hub; in the yz plane at x
  const wheel = (name, x, y, z, R, n) => { const g = new THREE.Group(); g.name = name;
    const t = new THREE.Mesh(new THREE.TorusGeometry(R - C.tyre / 2, C.tyre / 2 + .002, 8, 48), iron); t.rotation.y = Math.PI / 2; g.add(t);
    const f = new THREE.Mesh(new THREE.TorusGeometry(R - C.tyre - .016, .02, 8, 48), wood); f.rotation.y = Math.PI / 2; f.scale.set(1, 1, .9); g.add(f);
    const h = new THREE.Mesh(new THREE.CylinderGeometry(R * .14, R * .14, .07, 16), dark); h.rotation.z = Math.PI / 2; g.add(h);
    for (let k = 0; k < n; k++) { const a = k / n * Math.PI * 2, s = new THREE.Mesh(new THREE.CylinderGeometry(.009, .012, R - C.tyre - .03, 8), wood); s.position.set(0, Math.cos(a) * R * .5, Math.sin(a) * R * .5); s.rotation.x = a; g.add(s); }
    g.position.set(x, y, z); ch.add(g); return g; };
  for (const s of [-1, 1]) wheel('chairWheel', s * wx, wy, wz, C.R, C.spokes);
  const casters = [-1, 1].map(s => wheel('chairCaster', s * W, ground + C.r, railF, C.r, 6));
  ch.traverse(m => { if (m.isMesh) { m.castShadow = m.receiveShadow = true; m.userData.shield = true; } }); root.add(ch); root.updateMatrixWorld(true);
  // what is through it: every worn point inside a board by more than 3 mm, and inside a big wheel's disc
  const through = {}; let clear = 1;
  eachPoint(clouds, (x, y, z, i) => { for (const b of boxes) { const d = Math.min(x - b.lo[0], b.hi[0] - x, y - b.lo[1], b.hi[1] - y, z - b.lo[2], b.hi[2] - z); if (d > 0) clear = Math.min(clear, -d); if (d > .003) { through[b.name] = (through[b.name] || 0) + 1; if (i >= 0 && (through.at || []).length < 8) (through.at = through.at || []).push([b.name, +R0[i * 3].toFixed(3), +R0[i * 3 + 1].toFixed(3), +d.toFixed(3)]); } }
    for (const s of [-1, 1]) if (Math.abs(x - s * wx) < .02 && Math.hypot(y - wy, z - wz) < C.R) through.chairWheel = (through.chairWheel || 0) + 1; });
  for (let k = 0; k < hairPts.length; k += 3) for (const b of boxes) { const x = hairPts[k], y = hairPts[k + 1], z = hairPts[k + 2]; if (Math.min(x - b.lo[0], b.hi[0] - x, y - b.lo[1], b.hi[1] - y, z - b.lo[2], b.hi[2] - z) > .003) through.hair = (through.hair || 0) + 1; }
  let tris = 0; ch.traverse(m => { if (m.isMesh) tris += m.geometry.index ? m.geometry.index.count / 3 : m.geometry.attributes.position.count / 3; });
  return { ground, boxes, wheel: { x: wx, y: wy, z: wz, R: C.R }, stats: { seatH: +(sTop - ground).toFixed(3), railH: +(railY - ground).toFixed(3), backH: +(backTop - ground).toFixed(3), width: +(2 * (wx + .02)).toFixed(3), wheelR: C.R,
    wheelsDown: +Math.abs(wy - C.R - ground).toFixed(4), castersDown: +Math.max(...casters.map(c => Math.abs(c.position.y - C.r - ground))).toFixed(4), seatGap: +(seatY - sTop).toFixed(4), footGap: +(footY - (footY - C.gap)).toFixed(4), foreGap: fore.map(F => +(F.y - railY).toFixed(4)),
    behind: +(bodyBack - backZ).toFixed(3), railX: +railX.toFixed(3), hipX: +hipX.toFixed(3), clear: +clear.toFixed(4), through, tris } };
}
// the crossbow across the knees (Session 1116; OG-065's Garrick, whose long gun the catalogue makes a crossbow): laid flat on both
// thighs over the knees, the bolt's face up, the butt to the sitter's right and the prod out past the left wheel. It is let down
// onto what is under it until the nearest point is 2 mm off (the thighs, and only the thighs, bear it), then moved forward a
// centimetre at a time while any of it is in a board of the chair, a wheel, or a hand on the chair's arm
const LAP = { gap: .002, back: .07, prodOut: .025 };
function buildLapCrossbow(G, body, byName, meshes, root, Ch) {
  root.updateMatrixWorld(true); const D = G.dress, R0 = PACK.rest, clouds = wornClouds(body, meshes, root);
  const make = CROSSBOWS[D.crossbowMake] ? D.crossbowMake : ({ markman: 'steel', aurennais: 'horn' })[G.people] || 'wood', P = crossbowParts(D, make), K = P.K;
  const cb = new THREE.Group(); cb.name = 'crossbow'; for (const m of P.parts) { m.castShadow = m.receiveShadow = true; m.userData.shield = true; cb.add(m); }
  // the knees: the furthest forward of the seat and thighs (as the chair measures them)
  let kneeZ = -1e9; eachPoint(clouds, (x, y, z, i) => { if (i >= 0 && R0[i * 3 + 1] > -.42 && R0[i * 3 + 1] < .08 && Math.abs(R0[i * 3]) < .3) kneeZ = Math.max(kneeZ, z); });
  // its frame: the tiller across the lap (its butt toward -x, the right), the prod's span fore and aft, the bolt's face up
  cb.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(new THREE.Vector3(0, 1, 0), new THREE.Vector3(-1, 0, 0), new THREE.Vector3(0, 0, 1)));
  const prodX = Ch.wheel.x + .02 + K.bend + LAP.prodOut, v = new THREE.Vector3(), w = new THREE.Vector3(), inv = new THREE.Matrix4();
  // the nearest worn point under it at a height, and what it is (the thigh's: rest y -.56 to .08, inside the hips)
  const near = () => { root.updateMatrixWorld(true); inv.copy(cb.matrixWorld).invert(); let d0 = 1, on = null;
    eachPoint(clouds, (x, y, z, i) => { v.set(x, y, z).applyMatrix4(inv); if (v.y < CB_FRONT - .14 || v.y > CB_BUTT + .01 || Math.abs(v.z) > K.span / 2 + .01 || v.x > .2) return; const d = crossbowDist(K, P.px, v.x, v.y, v.z);
      if (d < d0) { d0 = d; on = i >= 0 ? (R0[i * 3 + 1] > -.56 && R0[i * 3 + 1] < .08 && Math.abs(R0[i * 3]) < .3 ? 'thigh' : 'body ' + R0[i * 3].toFixed(2) + ',' + R0[i * 3 + 1].toFixed(2)) : 'worn'; } }); return { d: d0, on }; };
  // what of it is in the chair: its points inside a board (by more than a millimetre) or a big wheel's disc
  const inChair = () => { root.updateMatrixWorld(true); const hit = {}; cb.traverse(m => { if (!m.isMesh) return; const a = m.geometry.attributes.position; for (let k = 0; k < a.count; k++) { w.fromBufferAttribute(a, k).applyMatrix4(m.matrixWorld);
      for (const b of Ch.boxes) if (Math.min(w.x - b.lo[0], b.hi[0] - w.x, w.y - b.lo[1], b.hi[1] - w.y, w.z - b.lo[2], b.hi[2] - w.z) > -.001) hit[b.name] = (hit[b.name] || 0) + 1;
      for (const s of [-1, 1]) if (Math.abs(w.x - s * Ch.wheel.x) < .025 && Math.hypot(w.y - Ch.wheel.y, w.z - Ch.wheel.z) < Ch.wheel.R + .005) hit.chairWheel = (hit.chairWheel || 0) + 1; } }); return hit; };
  let st = null, z = kneeZ - LAP.back, hit = {};
  root.add(cb); for (let k = 0; k <= 15; k++, z += .01) {
    // let down: the highest height that is too near and the lowest that is clear, halved twenty times
    let hi = 2, lo = -1; cb.position.set(prodX + CB_PROD, hi, z); for (let j = 0; j < 20; j++) { const y = (hi + lo) / 2; cb.position.y = y; if (near().d >= LAP.gap) hi = y; else lo = y; }
    cb.position.y = hi; st = near(); hit = inChair(); if (!Object.keys(hit).length && st.on === 'thigh') break; }
  (byName.root || byName['spine05'] || root).attach(cb);
  let tris = 0; cb.traverse(m => { if (m.isMesh) tris += m.geometry.index ? m.geometry.index.count / 3 : m.geometry.attributes.position.count / 3; });
  const end = y => new THREE.Vector3(0, y, 0).applyMatrix4(cb.matrixWorld);
  return { mesh: cb, stats: { make, span: K.span, gap: +st.d.toFixed(4), on: st.on, through: hit, overKnee: +(kneeZ - z).toFixed(3), prodX: +end(CB_PROD).x.toFixed(3), buttX: +end(CB_BUTT).x.toFixed(3), wheelX: +Ch.wheel.x.toFixed(3),
    level: +Math.abs(end(CB_BUTT).y - end(CB_PROD).y).toFixed(4), parent: cb.parent.name, tris } };
}
function sashBeltStats(meshes, root) {
  const sb = meshes.find(m => m.name === 'sashBelt'); if (!sb) return null; const R0 = PACK.rest, lo = .085, hi = .225;
  const pts = (m, f) => { const P = posedOf(m), I = m.geometry.index.array, out = []; for (let t = 0; t < I.length; t += 3) { const a = I[t], b = I[t + 1], c = I[t + 2]; if (!f(a, b, c)) continue;
    for (let i = 0; i <= 4; i++) for (let j = 0; i + j <= 4; j++) { const wa = i / 4, wb = j / 4, wc = 1 - wa - wb; out.push([0, 1, 2].map(k => P[a * 3 + k] * wa + P[b * 3 + k] * wb + P[c * 3 + k] * wc)); } } return out; };
  const ry = i => R0[i * 3 + 1], rx = i => Math.abs(R0[i * 3]), within = (y0, y1) => (a, b, c) => Math.min(ry(a), ry(b), ry(c)) >= y0 && Math.max(ry(a), ry(b), ry(c)) <= y1;
  const S = pts(sb, within(lo, hi)); let cx = 0, cz = 0, y0 = 9, y1 = -9; for (const p of S) { cx += p[0]; cz += p[2]; y0 = Math.min(y0, p[1]); y1 = Math.max(y1, p[1]); } cx /= S.length; cz /= S.length;
  const NA = 72, NR = Math.ceil((y1 - y0) / .01), bin = p => { const a = Math.floor(((Math.atan2(p[0] - cx, p[2] - cz) / (2 * Math.PI)) + 1) * NA) % NA, r = Math.floor((p[1] - y0) / .01); return r < 0 || r >= NR ? -1 : r * NA + a; };
  const rad = p => Math.hypot(p[0] - cx, p[2] - cz), sR = new Float32Array(NA * NR).fill(9); for (const p of S) { const b = bin(p); if (b >= 0) sR[b] = Math.min(sR[b], rad(p)); }
  let tested = 0, out = 0, worst = -1, armTested = 0, armIn = 0, beltTested = 0, beltUnder = 0; const under = {};
  const body = meshes[0]; for (const m of meshes) { if (m !== body && !['tunic', 'skirt', 'bodice', 'mail', 'mailSkirt', 'trousers'].includes(m.name)) continue; let o = 0;
    for (const p of pts(m, (a, b, c) => within(lo + .01, hi - .01)(a, b, c) && Math.max(rx(a), rx(b), rx(c)) < .25)) { const b = bin(p); if (b < 0 || sR[b] > 8) continue; tested++; const g = rad(p) - sR[b]; worst = Math.max(worst, g); if (g > -.002) { out++; o++; } }
    under[m === body ? 'body' : m.name] = o; }
  for (const p of pts(body, (a, b, c) => Math.min(rx(a), rx(b), rx(c)) > .25)) { if (p[1] < y0 + .005 || p[1] > y1 - .005) continue; const b = bin(p); if (b < 0 || sR[b] > 8) continue; armTested++; const g = rad(p) - sR[b]; if (g < .003 && g > -.06) armIn++; }
  const belt = meshes.find(m => m.name === 'belt'); if (belt) for (const p of pts(belt, within(.14, .185))) { const b = bin(p); if (b < 0 || sR[b] > 8) continue; beltTested++; if (rad(p) < sR[b] + .001) beltUnder++; }
  let w = 0; { const c = [], P = posedOf(sb); for (const i of new Set(sb.geometry.index.array)) if (ry(i) > lo && ry(i) < hi && R0[i * 3 + 2] > .05 && rx(i) < .03) c.push(P[i * 3 + 1]); w = c.length ? Math.max(...c) - Math.min(...c) : 0; }
  let round = 0; for (let a = 0; a < NA; a++) { const r = Math.floor(NR / 2), v = sR[r * NA + a]; if (v < 8) round += v * 2 * Math.PI / NA; }
  // the sash tucked under it (Session 1019): every point of the sash within the band (5 mm in from its edges) lies inside it
  let sashTested = 0, sashOut = 0; const sh = root && root.getObjectByName('sash'); if (sh) { sh.updateMatrixWorld(true); const a = sh.geometry.attributes.position, v = new THREE.Vector3();
    for (let i = 0; i < a.count; i++) { v.fromBufferAttribute(a, i).applyMatrix4(sh.matrixWorld); const p = [v.x, v.y, v.z]; if (p[1] < y0 + .005 || p[1] > y1 - .005) continue; const b = bin(p); if (b < 0 || sR[b] > 8) continue; sashTested++; if (rad(p) > sR[b] - .001) sashOut++; } }
  return { tested, out, worst: +worst.toFixed(4), under, armTested, armIn, beltTested, beltUnder, sashTested, sashOut, width: +w.toFixed(3), round: +round.toFixed(3), rows: NR, empty: [...sR].filter(v => v > 8).length };
}
// the leg wraps' promises, on the posed body (Session 1021): no point of the trousers (or of the bare leg, without them) out through
// the wraps between their cut edges, how far the wraps stand off what is under them, and none of the wraps' lowest 2 cm out through the boot
function legWrapStats(body, meshes) {
  const R0 = PACK.rest, wr = meshes.find(m => m.name === 'legWraps'), tr = meshes.find(m => m.name === 'trousers'), bt = meshes.find(m => m.name === 'boots'), side = (i, h) => R0[i * 3] * R0[h * 3] > 0;
  const inBand = (lo, hi) => i => { const y = R0[i * 3 + 1]; return y > lo && y < hi && Math.abs(R0[i * 3]) > .06; };
  const under = tr ? [...new Set(tr.geometry.index.array)].filter(inBand(-.69, -.415)) : (PACK.body0 || (PACK.body0 = [...new Set(PACK.G['body'])])).filter(inBand(-.69, -.415));
  const t = shellThrough(tr ? posedOf(tr) : posedBody(body), under, wr, PACK.R.legWraps, 1, side), out = { under: tr ? 'trousers' : 'leg', pts: t.n, through: t.bad, gap: t.gap };
  if (bt) { const low = [...new Set(PACK.R.legWraps)].filter(inBand(-.712, -.695)), b = shellThrough(posedOf(wr), low, bt, PACK.R.boots, 1, side); out.bootPts = b.n; out.bootThrough = b.bad; }
  out.tris = wr.geometry.index.count / 3; out.turns = +((-.405 + .715) / .055).toFixed(1); return out;
}
function posedOf(m) { const n = m.geometry.attributes.position.count, out = new Float32Array(n * 3), v = new THREE.Vector3(); m.updateMatrixWorld(true); for (let i = 0; i < n; i++) { m.getVertexPosition(i, v); out[i * 3] = v.x; out[i * 3 + 1] = v.y; out[i * 3 + 2] = v.z; } return out; }
// the hands against a long skirt, on the posed body (Session 887), radially: in 2 cm bands and 36 directions round the
// skirt's own middle, a hand point (rest x past .415) is inside if it is nearer that middle than the furthest of the skirt's points there
function handsInSkirt(body, skirt, PP = posedBody(body), sv0, thin = 0) {
  const R0 = PACK.rest, SP = posedOf(skirt), sv = sv0 || PACK.skirtV || (PACK.skirtV = [...new Set(PACK.R.skirtLong)]), B = new Map(), C = new Map(), band = y => Math.floor(y / .02), dir = (dx, dz) => Math.round((Math.atan2(dx, dz) / (Math.PI * 2) + 1) * 36) % 36;
  for (const i of sv) { const b = band(SP[i * 3 + 1]); const c = C.get(b) || [0, 0, 0]; c[0] += SP[i * 3]; c[1] += SP[i * 3 + 2]; c[2]++; C.set(b, c); }
  for (const i of sv) { const b = band(SP[i * 3 + 1]), c = C.get(b), dx = SP[i * 3] - c[0] / c[2], dz = SP[i * 3 + 2] - c[1] / c[2], k = b + ':' + dir(dx, dz); B.set(k, Math.max(B.get(k) || 0, Math.hypot(dx, dz))); }
  const hands = PACK.handV || (PACK.handV = [...new Set(PACK.G['body'])].filter(i => Math.abs(R0[i * 3]) > .415));
  // a band cut across by the garment's hem holds a few of its points, whose middle is off the body's (Session 1058: 23 points at a scale cuirass's hem
  // put it 7 cm forward), so a garment cut short can ask that a band thinner than `thin` points is not read, as mailStats does
  let n = 0, bad = 0; for (const h of hands) { const b = band(PP[h * 3 + 1]), c = C.get(b); if (!c || c[2] < thin) continue; const dx = PP[h * 3] - c[0] / c[2], dz = PP[h * 3 + 2] - c[1] / c[2], R = B.get(b + ':' + dir(dx, dz)); if (!R) continue; n++; if (Math.hypot(dx, dz) < R - .003) bad++; }
  return { n, bad };
}
// points of an inner surface (PP, posed) against a garment's posed shell: for each, the nearest of the shell's points (those keep
// allows), and how far out along the shell's own normal there it stands; sign 1 counts those more than 2 mm outside (Session 887)
function shellThrough(PP, verts, m, idx, sign, keep = () => true) { const SP = posedOf(m), pg = new THREE.BufferGeometry(); pg.setAttribute('position', new THREE.BufferAttribute(SP, 3)); pg.setIndex(m.geometry.index); pg.computeVertexNormals();
    const N = pg.attributes.normal.array, sv = [...new Set(idx)]; let bad = 0, gap = 0;
    for (const h of verts) { let bd = 1e9, bs = -1; for (const i of sv) { if (!keep(i, h)) continue; const d = (SP[i * 3] - PP[h * 3]) ** 2 + (SP[i * 3 + 1] - PP[h * 3 + 1]) ** 2 + (SP[i * 3 + 2] - PP[h * 3 + 2]) ** 2; if (d < bd) { bd = d; bs = i; } }
      const o = (PP[h * 3] - SP[bs * 3]) * N[bs * 3] + (PP[h * 3 + 1] - SP[bs * 3 + 1]) * N[bs * 3 + 1] + (PP[h * 3 + 2] - SP[bs * 3 + 2]) * N[bs * 3 + 2]; if (sign * o > .002) bad++; gap += -o; } return { n: verts.length, bad, gap: +(gap / verts.length).toFixed(4) };
}
// the mail's promises, on the posed body (Session 897): no point of the upper arm out through its sleeve, none of the tunic out
// through its body (but in the crease under the arm, where the arm's own skin folds both shells), none of the legs, the tunic's skirt or the trousers out of its skirt (radially, in 2 cm bands round its middle, as the hands are tested)
// what is drawn of it: a hand's breadth above the knee, or a scale cuirass's to the top of the thigh (Session 1058), from its cut
const mailSkirtV = (ms) => { const lo = (ms?.material.userData.cut?.[0] ?? -.27) + .01, k = 'mailSkirtV' + lo.toFixed(3); return PACK[k] || (PACK[k] = [...new Set(PACK.R.mailSkirt)].filter(i => PACK.rest[i * 3 + 1] > lo)); };
function mailStats(body, meshes) {
  const PP = posedBody(body), R0 = PACK.rest, out = {}, mail = meshes.find(m => m.name === 'mail'), ms = meshes.find(m => m.name === 'mailSkirt'), tunic = meshes.find(m => m.name === 'tunic');
  const body0 = PACK.body0 || (PACK.body0 = [...new Set(PACK.G['body'])]), side = (i, h) => R0[i * 3] * R0[h * 3] >= 0;
  const upper = body0.filter(i => { const ax = Math.abs(R0[i * 3]), y = R0[i * 3 + 1]; return ax > .2 && ax < Math.min(.29, mail.material.userData.cut[2] - .01) && y > .3 && y < .58; });
  const a = shellThrough(PP, upper, mail, PACK.R.mailTop, 1, (i, h) => side(i, h) && Math.abs(R0[i * 3]) > .17); out.armOut = a.bad; out.armPts = a.n;

  // read against what is drawn of the shell (Session 1058): a scale cuirass's sleeve is cut at |x| .25, and with the arm bent on a spear
  // the cut-away forearm part of the shell lay nearest a tunic point at the waist; and the tunic past the cut is not under it
  const cx = mail.material.userData.cut[2], tx = Math.min(.28, cx - .02), tk = 'mailTunicV' + tx.toFixed(3);
  const tv = PACK[tk] || (PACK[tk] = [...new Set(PACK.R.tunic)].filter(i => { const ax = Math.abs(R0[i * 3]), y = R0[i * 3 + 1]; return ax < tx && y > .16 && y < .56 && !(ax > .11 && y > .34); }));
  const t = shellThrough(posedOf(tunic), tv, mail, PACK.R.mailTop, 1, (i, h) => side(i, h) && Math.abs(R0[i * 3]) < cx); out.tunicOut = t.bad; out.tunicPts = t.n;
  const SP = posedOf(ms), sv = mailSkirtV(ms), lo = Math.max(-.24, ms.material.userData.cut[0] + .03), C = new Map(), B = new Map(), band = y => Math.floor(y / .02), dir = (dx, dz) => Math.round((Math.atan2(dx, dz) / (Math.PI * 2) + 1) * 36) % 36;
  for (const i of sv) { const b = band(SP[i * 3 + 1]), c = C.get(b) || [0, 0, 0]; c[0] += SP[i * 3]; c[1] += SP[i * 3 + 2]; c[2]++; C.set(b, c); }
  for (const i of sv) { const b = band(SP[i * 3 + 1]), c = C.get(b), k = b + ':' + dir(SP[i * 3] - c[0] / c[2], SP[i * 3 + 2] - c[1] / c[2]); B.set(k, Math.max(B.get(k) || 0, Math.hypot(SP[i * 3] - c[0] / c[2], SP[i * 3 + 2] - c[1] / c[2]))); }
  let n = 0, bad = 0; const test = (X, list) => { for (const h of list) { const b = band(X[h * 3 + 1]), c = C.get(b); if (!c || c[2] < 24) continue; const dx = X[h * 3] - c[0] / c[2], dz = X[h * 3 + 2] - c[1] / c[2], R = B.get(b + ':' + dir(dx, dz)); if (!R) continue; n++; if (Math.hypot(dx, dz) > R + .003) bad++; } };
  test(PP, body0.filter(i => { const y = R0[i * 3 + 1]; return Math.abs(R0[i * 3]) < .2 && y > lo && y < .05; }));
  for (const nm of ['trousers', 'skirt', 'tunic']) { const m = meshes.find(q => q.name === nm); if (!m) continue; const idx = [...new Set(m.geometry.index.array)].filter(i => { const y = R0[i * 3 + 1]; return Math.abs(R0[i * 3]) < .2 && y > lo && y < .05; }); test(posedOf(m), idx); }
  out.legsOut = bad; out.legPts = n; return out;
}
// the robe's promises, on the posed body: no point of the hands inside the skirt, no point of the forearm out through its
// sleeve, and how far the sleeve stands off the wrist at the cuff (the nearest cloth point over each, along its normal)
function robeStats(body, meshes) {
  const PP = posedBody(body), R0 = PACK.rest, out = {};
  const through = (...a) => shellThrough(PP, ...a);
  const body0 = [...new Set(PACK.G['body'])], skirt = meshes.find(m => m.name === 'skirt'), tunic = meshes.find(m => m.name === 'tunic');
  const fore = body0.filter(i => Math.abs(R0[i * 3]) > .3 && Math.abs(R0[i * 3]) < .385 && Math.abs(R0[i * 3 + 2]) < .06);
  { const H = handsInSkirt(body, skirt); out.handsInSkirt = H.bad; out.handPts = H.n; }
  const arm = (i, h) => Math.abs(R0[i * 3]) > .22 && R0[i * 3] * R0[h * 3] > 0, sl = through(fore, tunic, PACK.R.tunic, 1, arm); out.armThrough = sl.bad; out.forePts = sl.n;
  // the sleeve's width: from its cloth at the cuff (rest .385 to .4) and above the elbow (.27 to .28) to the nearest skin of that arm
  const TP = posedOf(tunic), tv = [...new Set(PACK.R.tunic)], armSkin = body0.filter(i => Math.abs(R0[i * 3]) > .22 && Math.abs(R0[i * 3]) < .4);
  const off = (lo, hi) => { let t = 0, n = 0; for (const i of tv) { const x = Math.abs(R0[i * 3]); if (x < lo || x > hi) continue; let bd = 1e9; for (const h of armSkin) if (R0[h * 3] * R0[i * 3] > 0) bd = Math.min(bd, (TP[i * 3] - PP[h * 3]) ** 2 + (TP[i * 3 + 1] - PP[h * 3 + 1]) ** 2 + (TP[i * 3 + 2] - PP[h * 3 + 2]) ** 2); t += Math.sqrt(bd); n++; } return +(t / Math.max(1, n)).toFixed(4); };
  out.cuffGap = off(.385, .4); out.upperGap = off(.27, .28);
  return out;
}
function buildCord(G, body, meshes) {
  const D = G.dress, tunic = meshes.find(m => m.name === 'tunic'), skirt = meshes.find(m => m.name === 'skirt'), R0 = PACK.rest, r = .0065;
  const TP = posedOf(tunic), SP = posedOf(skirt), tv = [...new Set(PACK.R.tunic)], sv = [...new Set(PACK.R.skirtLong)];
  // the waist: the tunic's points at rest height .155 to .18, their middle, and the furthest out in each of 48 directions
  const ring = tv.filter(i => Math.abs(R0[i * 3 + 1] - .167) < .013 && Math.abs(R0[i * 3]) < .25); let cx = 0, cy = 0, cz = 0; for (const i of ring) { cx += TP[i * 3]; cy += TP[i * 3 + 1]; cz += TP[i * 3 + 2]; } cx /= ring.length; cy /= ring.length; cz /= ring.length;
  const NA = 48, rad = new Float32Array(NA), ys = new Float32Array(NA).fill(cy);
  // the skirt's top overlaps the tunic under the cord and stands further out in places, so its points there count too
  // and every point of the tunic within 2 cm of the cord's height, not only the band it was found by, so it rides over the belly's bulge
  const sRing = sv.filter(i => R0[i * 3 + 1] > .145 && Math.abs(SP[i * 3 + 1] - cy) < .02), tRing = tv.filter(i => R0[i * 3 + 1] > .1 && R0[i * 3 + 1] < .3 && Math.abs(R0[i * 3]) < .25 && Math.abs(TP[i * 3 + 1] - cy) < .02), pts = [...tRing.map(i => [TP, i]), ...sRing.map(i => [SP, i])];
  for (const [A, i] of pts) { const dx = A[i * 3] - cx, dz = A[i * 3 + 2] - cz, a = Math.round(((Math.atan2(dx, dz) / (Math.PI * 2)) + 1) * NA) % NA, d = Math.hypot(dx, dz); if (d > rad[a]) { rad[a] = d; if (A === TP) ys[a] = A[i * 3 + 1]; } }
  for (let a = 0; a < NA; a++) if (!rad[a]) rad[a] = Math.max(rad[(a + NA - 1) % NA], rad[(a + 1) % NA]);
  const need = Float32Array.from(rad, v => v + r + .002); let R = need.slice(), Y = ys.slice();
  for (let it = 0; it < 6; it++) { const a0 = R.slice(), y0 = Y.slice(); for (let a = 0; a < NA; a++) { const l = (a + NA - 1) % NA, q = (a + 1) % NA; R[a] = Math.max(need[a], (a0[l] + 2 * a0[a] + a0[q]) / 4); Y[a] = (y0[l] + 2 * y0[a] + y0[q]) / 4; } }
  const at = a => new THREE.Vector3(cx + Math.sin(a / NA * Math.PI * 2) * R[a], Y[a], cz + Math.cos(a / NA * Math.PI * 2) * R[a]);
  const line = []; for (let a = 0; a <= NA; a++) line.push(at(a % NA));
  // the knot, a fifth of the way round from the front toward the left hip, and the two ends down the skirt's front from it
  const kA = NA - Math.round(NA * .1), knot = at(kA), meshesOut = [], mat = lockMat(sRGB(...D.cord));
  const add = (g, name) => { const m = new THREE.Mesh(g, mat); m.name = name; m.castShadow = m.receiveShadow = true; m.frustumCulled = false; meshesOut.push(m); };
  add(tubeGeom(line, line.map(() => r), 8, 40), 'cord');
  { const kg = new THREE.SphereGeometry(r * 1.9, 12, 8); kg.translate(knot.x, knot.y - r * .4, knot.z + r * .6); add(kg, 'cordKnot'); }
  let endClear = 1, tested = 0;
  for (const [dx, L] of [[-.011, .3], [.009, .24]]) { const pts = [], x = knot.x + dx; let z = knot.z + r;
    for (let y = knot.y - r; y > knot.y - L; y -= .01) { let zf = -9; for (const i of sv) { if (Math.abs(SP[i * 3] - x) < .02 && Math.abs(SP[i * 3 + 1] - y) < .015 && SP[i * 3 + 2] > zf) zf = SP[i * 3 + 2]; }
      for (const i of tv) { if (Math.abs(TP[i * 3] - x) < .02 && Math.abs(TP[i * 3 + 1] - y) < .015 && TP[i * 3 + 2] > zf) zf = TP[i * 3 + 2]; }
      if (zf > -8) z = Math.max(zf + r + .003, z - .004); pts.push(new THREE.Vector3(x, y, z)); }
    for (let it = 0; it < 3; it++) for (let k = 1; k < pts.length - 1; k++) pts[k].z = Math.max(pts[k].z, (pts[k - 1].z + pts[k + 1].z) / 2);
    const rr = pts.map((_, k) => k >= pts.length - 3 ? r * 1.45 : r * .85); add(tubeGeom(pts, rr, 8, 40), 'cordEnd');
    // the checks' number: how far each end lies in front of the cloth behind it
    for (const q of pts) { let zf = -9; for (const i of sv) if (Math.abs(SP[i * 3] - q.x) < .008 && Math.abs(SP[i * 3 + 1] - q.y) < .008) zf = Math.max(zf, SP[i * 3 + 2]); if (zf > -8) { tested++; endClear = Math.min(endClear, q.z - zf - r); } } }
  // and how far the ring stands off the tunic under it, and how many of the tunic's waist points it holds inside
  let inside = 0; for (const [A, i] of pts) { const dx = A[i * 3] - cx, dz = A[i * 3 + 2] - cz, a = Math.round(((Math.atan2(dx, dz) / (Math.PI * 2)) + 1) * NA) % NA; if (Math.hypot(A[i * 3] - cx, A[i * 3 + 2] - cz) > R[a] - r) inside++; }
  return { meshes: meshesOut, stats: { ringPts: pts.length, inside, endClear: +endClear.toFixed(4), tested, waist: +(2 * Math.PI * R.reduce((a, b) => a + b, 0) / NA).toFixed(3) } };
}
// how far the tunic is taken in at the waist (0 to 1, by rest y): under a leather belt over 3 cm round its middle (rest .16), under a
// sash belt (Session 1010) over the band's whole width (rest .085 to .225), easing out over 3 cm past either edge
function waistIn(D, y) { return sashBeltOn(D) ? Math.exp(-((Math.max(0, Math.abs(y - .155) - .06) / .03) ** 2)) : Math.exp(-(((y - .16) / .03) ** 2)); }
// the sash belt is worn on a tunic or a skirt, never under a robe (its cord takes the waist), a tabard or an apron (which hang over it),
// nor over mail, whose skirt stands 5 cm out at the waist and is belted in leather
function shoulderWrapOn(D) { return !!(D.shoulderWrap && !D.sash && !D.cloak && !D.bib && !D.tabard && !D.mail); }
function sashBeltOn(D) { return !!(D.sashBelt && !D.robe && !D.tabard && !D.apron && !D.mail); }
// how far the sash belt stands off the tights' shell: 8 mm over the tunic as makePerson pushes it there (or 12 over the bodice, whose lower edge is inside the band),
// and never in past the leather belt's 3 cm, which clears a skirt's top
function sashBeltPush(D, x, y) { const inner = Math.abs(x) < .2 ? .022 * Math.max(0, Math.min(1, (.46 - y) / .2)) * (1 - .8 * waistIn(D, y)) : 0;
  let d = (D.tunic ? .013 + inner : 0) + .008; if (D.bodice) d = Math.max(d, .021 + inner + .012); return Math.max(d, .03); }
export function makePerson(G, o = {}) {
  // the Cold (Session 1053; canon §3.3, "pallor deepens, eyes grey"; OG-066's eye strip, pale grey to silver and ice blue): the
  // eyes go toward an ice grey, nine tenths of the way at a Cold of 1, and the skin toward its own grey, a little cooler and
  // lighter, three fifths of the way; the genome keeps its own colours, so the Cold can rise and fall over them
  // (o.coldColours === false leaves them, for a check of the marks alone)
  const cold = Math.max(0, Math.min(1, G.marks ?? 0)); if (cold > 0 && o.coldColours !== false) { const mix = (a, b, k) => a.map((v, i) => v + (b[i] - v) * k), L = .3 * G.skin[0] + .59 * G.skin[1] + .11 * G.skin[2];
    G = { ...G, eyes: mix(G.eyes, [.76, .8, .85], .9 * cold), skin: mix(G.skin, [L + .02, L + .03, L + .06].map(v => Math.min(1, v)), .6 * cold) }; }
  // the robe (Session 887, B2): one cloth from the shoulders to the ankles, worn as the tunic and the long skirt in the robe's
  // colour, with sleeves that widen to the cuff and a fuller hem; a rope cord takes the belt's place, nothing under it shows
  if (G.dress?.robe) { const R = G.dress; G = { ...G, dress: { ...R, tunic: R.robe, skirt: 'long', skirtColor: R.robe, trousers: null, belt: null, sashBelt: null, cuffs: null, cord: R.cord || [.62, .55, .42] } }; }
  // mail (Session 897) is worn over a padded coat, the tunic, and belted over: a man or woman in mail without either gets them
  // seated in a wheeled chair (Session 1106) nothing is worn or carried that hangs to the ground or is built round a standing body: no
  // cloak, tabard, sash or shoulder wrap, apron, long skirt or mail skirt's hang over the lap, nothing in the fist and no shield; a long skirt gives way to trousers
  // (a crossbow stays: it is laid across the knees, Session 1116)
  if (G.dress?.chair) { const C = G.dress; G = { ...G, dress: { ...C, cloak: null, hood: null, tabard: null, sash: null, shoulderWrap: null, apron: null, bib: null, shield: null, spear: null, staff: null, basket: null, wrapTail: null,
    ...(C.skirt === 'long' || C.robe ? { skirt: null, robe: null, trousers: C.trousers || C.skirtColor || C.robe || [.3, .26, .2] } : {}) } }; }
  if (G.dress?.mail && !G.dress.robe) { const M = G.dress; G = { ...G, dress: { ...M, tunic: M.tunic || [.6, .54, .42], belt: M.belt || [.24, .16, .1] } }; }
  const P = morph(G), { ix } = PACK, rest0 = PACK.rest; RND = seeded(G.seed ?? 'person'); let hairStats = null, hoodStats = null, browStats = null;
  // the feet on the ground
  let minY = 1e9; for (let i = 1; i < P.length; i += 3) if (P[i] < minY) minY = P[i];
  // the skeleton, its joints read off the morphed body
  const jp = name => { const L = ix.joints[name], v = new THREE.Vector3(); for (const i of L) v.add(new THREE.Vector3(P[i * 3], P[i * 3 + 1], P[i * 3 + 2])); return v.divideScalar(L.length); };
  const bones = [], byName = {}, heads = {};
  for (const b of ix.bones) { const bone = new THREE.Bone(); bone.name = b.name; heads[b.name] = jp(b.head); bones.push(bone); byName[b.name] = bone;
    if (b.parent) { byName[b.parent].add(bone); bone.position.copy(heads[b.name]).sub(heads[b.parent]); } else bone.position.copy(heads[b.name]); }
  const skeleton = new THREE.Skeleton(bones), root = new THREE.Group(), meshes = [];
  const D0 = G.dress || {}, bodyIdx = D0.tunic ? (D0.trousers || D0.skirt === 'long' ? (D0.sandals ? PACK.R.bareFeet || (PACK.R.bareFeet = new Uint32Array([...PACK.R.bare, ...PACK.R.feet])) : PACK.R.bare) : PACK.R.bareLegs) : PACK.G.body, body = new THREE.SkinnedMesh(geomFor(P, bodyIdx), skinMat(sRGB(...G.skin), G.marks ?? null, G.scar || null));
  // skin tones by region: lips and cheeks warmer, the brow a touch darker
  { const col = new Float32Array(PACK.N * 3), BS = browShape(G); for (let i = 0; i < PACK.N; i++) { const x = rest0[i * 3], y = rest0[i * 3 + 1], z = rest0[i * 3 + 2]; let r = 1, g = 1, b = 1;
      const lip = Math.exp(-((x / .022) ** 2) - ((y - .655) / .009) ** 2) * (z > .13 ? 1 : 0), cheek = Math.exp(-(((Math.abs(x) - .05) / .025) ** 2) - ((y - .69) / .02) ** 2) * (z > .07 ? 1 : 0), nose = Math.exp(-((x / .02) ** 2) - ((y - .69) / .015) ** 2) * (z > .14 ? 1 : 0);
      r += .12 * lip + .06 * cheek + .05 * nose; g -= .14 * lip + .05 * cheek + .04 * nose; b -= .1 * lip + .04 * cheek + .03 * nose;
      if (G.hairCol && z > .08 && y > .72 && y < .79) { const w = browCover(BS, x, y) * .2; r *= 1 - w; g *= 1 - w * 1.1; b *= 1 - w * 1.2; } col[i * 3] = r; col[i * 3 + 1] = g; col[i * 3 + 2] = b; }
    body.geometry.setAttribute('color', new THREE.BufferAttribute(col, 3)); }
  meshes.push(body);
  const D = G.dress || {}, push = (k, idx, mat, d) => { const m = new THREE.SkinnedMesh(geomFor(P, idx, d), mat); m.name = k; meshes.push(m); return m; };
  // under a skirt (a man's tunic skirt, from rest .17 to -.2) the trousers stop 8 cm up inside its hem (Session 1010): at the seat the
  // skirt's shell lies inside the tights' and the trousers came out through it in patches; the skirt is drawn both sides, so its inside shows above them
  // over sandals (Session 1015) the trousers stop above the ankle, at rest -.665, so the straps round it show
  if (D.trousers) push('trousers', PACK.R.trousers, clothMat(sRGB(...D.trousers), 'wool', { cut: [D.sandals ? -.665 : -.78, D.skirt ? -.12 : .1] }), .008);
  if (D.sandals) { const o = { hole: SANDAL_HOLE }; push('sandals', PACK.R.feet, clothMat(sRGB(...D.sandals), 'leather', o), .0025).customDepthMaterial = cutDepth(o); }
  // leg wraps (Session 1021; OG-048's boot wraps, OG-059's laced boots and leg wraps): a wool band wound from the ankle to under the
  // knee (rest -.715 to -.405) over the trousers, 1.6 cm off the tights where the trousers are 0.8 (0.6 over a bare leg), tied at the top with two thongs
  // in the boots' leather; the boots are cut down to the ankle (rest -.69), so the wraps' lowest 2.5 cm go in under them
  const WRAPS = { lo: -.715, hi: -.405, pitch: .055, depth: 1.1 };
  if (D.legWraps) { const o = { cut: [WRAPS.lo, WRAPS.hi, 9, .001], scale: 26, wind: { ...WRAPS, tie: sRGB(...(D.boots || D.sandals || D.belt || [.3, .2, .12])) } }; push('legWraps', PACK.R.legWraps, clothMat(sRGB(...D.legWraps), 'wool', o), D.trousers ? .016 : .006).customDepthMaterial = cutDepth(o); }
  if (D.boots && !D.sandals) push('boots', PACK.R.boots, clothMat(sRGB(...D.boots), 'leather', { cut: [-2, D.legWraps ? -.69 : -.43, 9, .002] }), .02);
  // a robe's tunic ends under the cord (rest .145), so its hem does not stand out over the skirt; its sleeves widen from above the elbow to 3 cm off the arm at the cuff: a shell skinned as the arm is, so the arm
  // never comes through it, and seen from both sides, since its open cuff shows the inside
  const sleeve = x => D.robe ? .03 * Math.max(0, Math.min(1, (Math.abs(x) - .24) / .16)) ** 1.5 : 0;
  const tunicPush = (x, y) => .013 + sleeve(x) + (Math.abs(x) < .2 ? .022 * Math.max(0, Math.min(1, (.46 - y) / .2)) * (1 - .8 * waistIn(D, y)) : 0);
  if (D.tunic) push('tunic', PACK.R.tunic, clothMat(sRGB(...D.tunic), 'wool', { cut: [D.robe ? .145 : D.skirt ? .12 : -.02, .612, .4, .002], ...(D.robe ? { side: THREE.DoubleSide, inner: .55 } : {}), ...(D.dots ? { dots: sRGB(...D.dots), dotsPowder: D.dotsStyle === 'powder' } : {}) }), tunicPush);
  // a laced bodice over the chemise (Session 888; OG-110's green laced gown, OG-109's Gatelands bodices): 8 mm over the
  // tunic, ending under the belt (rest .14), open down the front between the eyelets, so the chemise shows in the gap; the lacing is built after the pose
  if (D.bodice) push('bodice', PACK.R.bodice, clothMat(sRGB(...D.bodice), 'wool', { cut: [.14, .62, .19, .002], hole: '(vB.z > .03 && abs(vB.x) < .0085 && vB.y > .2 && vB.y < .5) || (vB.y > .485 && (abs(vB.x) < .068 || abs(vB.x) > .148))', side: THREE.DoubleSide, inner: .5 }), (x, y) => .021 + (Math.abs(x) < .2 ? .022 * Math.max(0, Math.min(1, (.46 - y) / .2)) * (1 - .8 * waistIn(D, y)) : 0));
  if (D.skirt) push('skirt', D.skirt === 'long' ? PACK.R.skirtLong : PACK.R.skirtShort, clothMat(sRGB(...(D.skirtColor || D.tunic)), 'wool', { side: THREE.DoubleSide, cut: [D.skirt === 'long' ? -2 : -.2, .17, 9, .01], ...(D.dots && (!D.skirtColor || hex(D.skirtColor) === hex(D.tunic)) ? { dots: sRGB(...D.dots), dotsPowder: D.dotsStyle === 'powder' } : {}) }), (x, y) => .012 + .012 * Math.max(0, Math.min(1, (.14 - y) / .3)) + (D.robe ? .035 * Math.max(0, Math.min(1, (-.35 - y) / .45)) ** 1.2 : 0));
  // the mail hauberk (Session 897; OG-019's Iron tier, mail to the knee under a belt): its body 9 mm over the tunic, its sleeves
  // to the elbow (cut at rest |x| .3), its neck at the tunic's; its skirt off the skirt shell, 1.2 cm over a skirt's, from under the
  // belt to above the knee. Both are shells skinned as the body is, so no arm or leg comes through them; the belt rides 8 mm out on the mail
  const mail = D.mail && !D.robe;
  // a scale cuirass (Session 1058; OG-044's Compact guards) is the same two shells in bronze scales: its sleeves cut short, at
  // the middle of the upper arm (rest |x| .25), its skirt over the hips to the top of the thigh (rest y -.13); plates on their lining
  // stand thicker than rings, so its body is 3 mm further out (under a woman's bust two points of the tunic came 3 mm through at 9)
  // Its edges are bound in leather (Session 1068): the neck, the sleeves and the hem, and the hem is cut straight where the rings'
  // is ragged (o.binding === false leaves the band off and the hem straight, for a check of the band alone)
  if (mail) { const sc = !!D.scales, bd = sc && o.binding !== false, top = { cut: [.06, .6, sc ? .25 : .3, .003], scales: sc, bind: bd ? [.6, .25, -9] : 0 }, skirt = { side: THREE.DoubleSide, cut: [sc ? -.13 : -.27, .17, 9, sc ? .002 : .012], scales: sc, bind: bd ? [9, 9, -.13] : 0 };
    push('mail', PACK.R.mailTop, mailMat(sRGB(...D.mail), top), (x, y) => tunicPush(x, y) + (sc ? .012 : .009) + .012 * Math.max(0, Math.min(1, (.2 - y) / .1))).customDepthMaterial = cutDepth(top);
    push('mailSkirt', PACK.R.mailSkirt, mailMat(sRGB(...D.mail), skirt), (x, y) => .024 + .012 * Math.max(0, Math.min(1, (.14 - y) / .3)) + .03 * Math.max(0, Math.min(1, (y + .14) / .14)) + (D.skirt === 'long' ? .006 : 0)).customDepthMaterial = cutDepth(skirt); }
  // the wide sash belt (Session 1010; OG-056's "wide sash belts in rust red and indigo"): a band of cloth 14 cm wide wound round
  // the waist over the tunic, which is taken in under its whole width, its folds drawn in the shader; a leather belt is worn over it
  if (sashBeltOn(D)) push('sashBelt', PACK.R.sashBelt, clothMat(sRGB(...D.sashBelt), 'wool', { cut: [.085, .225, 9, .0008], scale: 30, fold: { lo: .085, hi: .225, n: 5 } }), (x, y) => sashBeltPush(D, x, y));
  if (D.belt) push('belt', PACK.R.belt, clothMat(sRGB(...D.belt), 'leather', { cut: [.135, .19, 9, .0005] }), sashBeltOn(D) ? (x, y) => sashBeltPush(D, x, y) + .007 : mail ? .038 : .03);
  if (D.cuffs) push('cuffs', PACK.R.cuffs, clothMat(sRGB(...D.cuffs), 'wool', { hole: 'abs(vB.x) < .371 || abs(vB.x) > .411', ...(D.cuffBand ? { band: sRGB(...D.cuffBand) } : {}) }), .02);
  if (D.apron) { const lea = !!D.apronLeather, am = clothMat(sRGB(...D.apron), lea ? 'leather' : 'wool', { side: THREE.DoubleSide, cut: [lea ? -.52 : -.42, .175, .155, .004] });
    push('apron', PACK.R.apron, am, (x, y) => .03 + .012 * Math.max(0, Math.min(1, (.1 - y) / .4))); if (D.bib) push('bib', PACK.R.apronBib, clothMat(sRGB(...D.apron), lea ? 'leather' : 'wool', { side: THREE.DoubleSide, cut: [.1, .46, .105, .003] }), .04); }
  // a fur mantle over the shoulders: eleven shells
  if (D.mantle) for (let k = 0; k < 11; k++) push('mantle' + k, PACK.R.mantle, shellMat(sRGB(...D.mantle), k, 11, { sx: 260, sy: 70, solid: k === 0 }), .036 + k * .0055);
  // hair: cards rooted on the hair shell (off the face), a layer of shell underneath so no scalp shows; brows; beard and moustache as short cards
  if (G.hairCol) { const scalp = PACK.R.scalpRoots;
    const sm = push('scalp', scalp, shellMat(sRGB(...G.hairCol).multiplyScalar(.55), 0, 3, { solid: true, hairline: true, edge: true, skin: sRGB(...G.skin) }), (x, y, z, i) => { const w = Math.max(0, Math.min(1, (z + .04) / .03)) * (1 - Math.max(0, Math.min(1, (z - .03) / .02))), k = 1 - w * (1 - Math.min(1, PACK.scalpEdge[i] / .012)); return .0008 + .0017 * k * k * (3 - 2 * k); });
    // the temples' fade (Session 879): the shell reads its distance to the root region's border, worked out once on the rest body,
    // and at the sides comes down onto the skin toward that border (0.8 mm, from 2.5), so its faded edge is not a ledge seen side-on by the ear
    sm.geometry.setAttribute('aEdge', new THREE.BufferAttribute(PACK.scalpEdge, 1));
    const headB = ix.bones.findIndex(b => b.name === 'head'), bb = new THREE.Box3(); for (const v of scalp) bb.expandByPoint(new THREE.Vector3(P[v * 3], P[v * 3 + 1], P[v * 3 + 2])); const hc = bb.getCenter(new THREE.Vector3()), hr = bb.getSize(new THREE.Vector3()).multiplyScalar(.5).addScalar(.004); hc.y -= .02; hr.y += .02;
    const tuck = D.cloak && D.hood === 'up' || D.helm || D.wrap ? { ...G, hair: { style: 'short', len: Math.min(G.hair?.len ?? .3, .3) } } : G;
    // under a hood the hair is tucked in: only the scalp's shell, which shows at the hairline
    const H = buildHair(P, tuck, heads, PACK.R.scalpRoots, headB, RND); meshes.push(...H.meshes.filter(m => tuck === G || (D.helm || D.wrap) && !(D.cloak && D.hood === 'up') || m.name !== 'hair')); hairStats = H.stats;
    { const B = buildBrows(P, G, headB); meshes.push(B.mesh); browStats = B.stats; }
    if (G.beard) { const jawB = ix.bones.findIndex(b => b.name === 'jaw');
      push('beardBase', PACK.R.beardBase, shellMat(sRGB(...G.hairCol).multiplyScalar(.6), 0, 3, { solid: true }), .0015);
      // under a tunic the throat below its collar (rest y .63) grows no beard: those hairs came out through the cloth (Session 878)
      const beardTris = D0.tunic ? (PACK.R.beardTunic || (PACK.R.beardTunic = (() => { const R = PACK.rest, B = PACK.R.beard, o = []; for (let t = 0; t < B.length; t += 3) if (Math.min(R[B[t] * 3 + 1], R[B[t + 1] * 3 + 1], R[B[t + 2] * 3 + 1]) > .638) o.push(B[t], B[t + 1], B[t + 2]); return o; })())) : PACK.R.beard;
      const bc = hairCards(P, beardTris, { n: 520, len: .02 + .05 * G.beard, seg: 4, width: .011, lift: .15, comb: -.1, fall: 1, grav: .2, rootOff: .002, bone: jawB, color: sRGB(...G.hairCol).multiplyScalar(.92), outward: hc, hug: true, surfs: [surfaceOf(P, PACK.R.beard, hc)] }); bc.userData.roots = beardTris.length / 3;
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
  // under an eyepatch (Session 1079) the eye is lost, and its ball is not built
  for (const side of ['l', 'r']) { if (D.eyepatch && side === (D.eyepatchSide === 'R' ? 'r' : 'l')) continue; const L = new Set(PACK.G[`helper-${side}-eye`]), c = new THREE.Vector3(); let r = 0; for (const i of L) c.add(new THREE.Vector3(P[i * 3], P[i * 3 + 1], P[i * 3 + 2])); c.divideScalar(L.size); for (const i of L) r = Math.max(r, c.distanceTo(new THREE.Vector3(P[i * 3], P[i * 3 + 1], P[i * 3 + 2])));
    const eg = new THREE.SphereGeometry(r * .8, 32, 24); eg.rotateY(-Math.PI / 2); const e = new THREE.Mesh(eg, new THREE.MeshPhysicalMaterial({ map: eyeTex, roughness: .08, clearcoat: 1 }));
    const head = byName['head']; head.updateWorldMatrix(true, false); e.position.copy(c).sub(heads['head']); e.position.z -= r * .12; head.add(e); }
  let helmStats = null; if (D.helm) { const hp = []; for (const m of meshes) if (m.name === 'hair') { const a = m.geometry.attributes.position.array; for (let i = 0; i < a.length; i += 3) hp.push(new THREE.Vector3(a[i], a[i + 1], a[i + 2])); } helmStats = buildHelm(P, G, heads, byName, hp).stats; }
  // the eyepatch (Session 1079), on the face under whatever is on the head; its cord over the hair
  let patchStats = null; if (D.eyepatch) patchStats = buildEyepatch(P, G, heads, byName, meshes).stats;
  // hoop earrings (Session 995), when no raised hood covers the ears
  let earStats = null; if (D.earrings && !(D.cloak && D.hood === 'up')) earStats = buildEarrings(P, G, heads, byName).stats;
  // the head-wrap (Session 994), over the same tucked hair, when no helm or raised hood is on the head
  let wrapStats = null; if (D.wrap && !D.helm && !(D.cloak && D.hood === 'up')) { const hp = []; for (const m of meshes) if (m.name === 'hair') { const a = m.geometry.attributes.position.array; for (let i = 0; i < a.length; i += 3) hp.push(new THREE.Vector3(a[i], a[i + 1], a[i + 2])); } let bt = -9; const bm = meshes.find(m => m.name === 'brows'); if (bm) { const a = bm.geometry.attributes.position.array; for (let i = 1; i < a.length; i += 3) bt = Math.max(bt, a[i]); } wrapStats = buildWrap(P, G, heads, byName, hp, bt).stats; }
  // pose: arms down from the A-pose, a slight bend at the elbow, weight on one leg, the head turned a little
  const q = (ax, ay, az) => new THREE.Quaternion().setFromEuler(new THREE.Euler(ax, ay, az, 'XYZ'));
  const pose = Object.assign({ arm: .73, elbow: .62, head: 0, hip: 0 }, G.pose || {});
  // under a stoop (Session 1082) the arms are swung back by the back's whole bow, so they hang plumb from the shoulders as before
  const plumb = q(-.24 * (pose.stoop || 0), 0, 0);
  byName['upperarm01.L'].quaternion.copy(plumb.clone().multiply(q(0, 0, -pose.arm))); byName['upperarm01.R'].quaternion.copy(plumb.clone().multiply(q(0, 0, pose.arm)));
  byName['lowerarm01.L'].quaternion.copy(q(pose.elbow, 0, 0)); byName['lowerarm01.R'].quaternion.copy(q(pose.elbow, 0, 0));
  byName['head'].quaternion.copy(q(.04, pose.head, 0)); if (byName['jaw']) byName['jaw'].quaternion.copy(q(pose.jaw ?? -.12, 0, 0)); byName['spine05'].quaternion.copy(q(0, 0, pose.hip));
  // the stoop of age (Session 1082, L1; OG-001's Edna, OG-065's Bronwen): the upper back bowed forward through its two highest
  // bones, and the neck lifted back by most of it so the face still looks ahead
  if (pose.stoop) { for (const n of ['spine02', 'spine01']) byName[n].quaternion.multiply(q(.12 * pose.stoop, 0, 0)); byName['neck01'].quaternion.multiply(q(-.18 * pose.stoop, 0, 0)); }
  for (const side of ['L', 'R']) { const sg = side === 'L' ? -1 : 1; for (let f = 2; f <= 5; f++) for (let j = 1; j <= 3; j++) { const b = byName[`finger${f}-${j}.${side}`]; if (b) b.quaternion.copy(q(0, 0, sg * (.25 + .12 * j))); } }
  // seated (Session 1106; OG-065's Garrick): the thighs swung forward to level and spread a little, the shins sloped forward to the
  // footboard, the feet level; the forearms laid forward along the chair's arms, the upper arms lifted out from the side, three
  // hundredths of a radian at a time, until each forearm lies outside the hips by the arm post's width (the chair is built to them after)
  let seatArms = 0; if (D.chair) { const at = n => new THREE.Vector3().setFromMatrixPosition(byName[n].matrixWorld);
    for (const s of ['L', 'R']) { const sg = s === 'L' ? 1 : -1; byName['upperleg01.' + s].quaternion.copy(q(-SEAT.hip, 0, sg * SEAT.spread)); byName['lowerleg01.' + s].quaternion.copy(q(SEAT.knee, 0, 0)); byName['foot.' + s].quaternion.copy(q(SEAT.hip - SEAT.knee, 0, 0)); }
    const fore = () => { for (const s of ['L', 'R']) { const lb = byName['lowerarm01.' + s], sg = s === 'L' ? 1 : -1; root.updateMatrixWorld(true); lb.quaternion.copy(q(pose.elbow, 0, 0)); root.updateMatrixWorld(true);
      const wq = lb.getWorldQuaternion(new THREE.Quaternion()), Q = new THREE.Quaternion().setFromUnitVectors(at('wrist.' + s).sub(at('lowerarm01.' + s)).normalize(), new THREE.Vector3(sg * SEAT.foreOut, SEAT.foreDown, 1).normalize()).multiply(wq);
      lb.quaternion.copy(lb.parent.getWorldQuaternion(new THREE.Quaternion()).invert().multiply(Q)); root.updateMatrixWorld(true);
      // the palm turned down onto the arm's end by the forearm's twist bone: the knuckles' line level, the first finger's toward the body's middle
      const tw = byName['lowerarm02.' + s], ax = at('wrist.' + s).sub(at('lowerarm01.' + s)).normalize(), flat = u => u.addScaledVector(ax, -u.dot(ax)).normalize(), kn = flat(at('finger2-1.' + s).sub(at('finger5-1.' + s))), tg = flat(new THREE.Vector3(-sg, 0, 0));
      const tq = tw.getWorldQuaternion(new THREE.Quaternion()), R = new THREE.Quaternion().setFromAxisAngle(ax, Math.atan2(kn.clone().cross(tg).dot(ax), kn.dot(tg)));
      tw.quaternion.copy(tw.parent.getWorldQuaternion(new THREE.Quaternion()).invert().multiply(R.multiply(tq))); root.updateMatrixWorld(true);
      // the fingers bent over the arm's front end, about the knuckles' line
      const hinge = at('finger2-1.' + s).sub(at('finger5-1.' + s)).normalize().applyQuaternion(byName['metacarpal2.' + s].getWorldQuaternion(new THREE.Quaternion()).invert());
      for (let f = 2; f <= 5; f++) for (let j = 1; j <= 3; j++) { const b = byName[`finger${f}-${j}.${s}`]; if (b) b.quaternion.setFromAxisAngle(hinge, -sg * SEAT.curl[j - 1]); } } root.updateMatrixWorld(true); };
    for (let k = 0; k <= 15; k++) { fore(); const PP = posedBody(body); let hx = 0; for (const i of new Set(PACK.G['body'])) { const rx = Math.abs(PACK.rest[i * 3]), ry = PACK.rest[i * 3 + 1]; if (ry > -.42 && ry < .08 && rx < .3) hx = Math.max(hx, Math.abs(PP[i * 3])); }
      const wx = Math.min(Math.abs(at('wrist.L').x), Math.abs(at('wrist.R').x), Math.abs(at('lowerarm01.L').x), Math.abs(at('lowerarm01.R').x)); if (wx > hx + .045 || k === 15) break; seatArms += .03;
      byName['upperarm01.L'].quaternion.copy(plumb.clone().multiply(q(0, 0, -(pose.arm - seatArms)))); byName['upperarm01.R'].quaternion.copy(plumb.clone().multiply(q(0, 0, pose.arm - seatArms))); } }
  // a long skirt (and so a robe) stands out at the thigh, where the hands hang: the arms are lifted out from the side, three
  // hundredths of a radian at a time, until no point of either hand is inside it (Session 887; the genome's pose is unchanged)
  // Not under a full cloak: it hangs over the hands and is built round the arms where they are, so lifting them only lumps it
  // A mail skirt stands out further still, and is lifted clear of the same way (Session 897)
  // A short skirt too (Session 1011): the hands hang beside its lower half, and fingertips showed through its front at the thigh
  let lift = 0, skirtHands = null; const skM = !D.chair && !(D.cloak && !D.cape) && (meshes.find(m => m.name === 'mailSkirt') || D.skirt && meshes.find(m => m.name === 'skirt'));
  const skV = skM && skM.name === 'mailSkirt' ? mailSkirtV(skM) : skM && D.skirt === 'short' ? PACK.skirtShortV || (PACK.skirtShortV = [...new Set(PACK.R.skirtShort)].filter(i => PACK.rest[i * 3 + 1] > -.2)) : undefined;
  if (skM) for (let k = 0; k <= 10; k++) { root.updateMatrixWorld(true); skirtHands = handsInSkirt(body, skM, undefined, skV, skM.name === 'mailSkirt' && D.scales ? 24 : 0); if (!skirtHands.bad || k === 10) break; lift += .03;
    byName['upperarm01.L'].quaternion.copy(plumb.clone().multiply(q(0, 0, -(pose.arm - lift)))); byName['upperarm01.R'].quaternion.copy(plumb.clone().multiply(q(0, 0, pose.arm - lift))); }
  if (skirtHands) skirtHands.lift = +lift.toFixed(2);
  // a spear in the right fist (Sessions 907, 909 and 910), after the arms are lifted clear of a long skirt: the forearm turned to point forward and a little down, then rolled about
  // itself so the knuckles stand one over another (the first finger's on top) and the shaft can run up and down through the fist;
  // the shaft is laid in the palm and the four fingers close on it (fistGrip). (The elbow's own x is not its hinge: 1.45 rad
  // about it swung the forearm round a cone, backward)
  let spearGrip = null, wristFix = 0; if (D.spear || D.crossbow && !D.chair || D.staff) { const lb = byName['lowerarm01.R'], at = n => new THREE.Vector3().setFromMatrixPosition(byName[n].matrixWorld), wq = () => lb.getWorldQuaternion(new THREE.Quaternion());
    const setWorld = Q => lb.quaternion.copy(lb.parent.getWorldQuaternion(new THREE.Quaternion()).invert().multiply(Q)); root.updateMatrixWorld(true);
    setWorld(new THREE.Quaternion().setFromUnitVectors(at('wrist.R').sub(at('lowerarm01.R')).normalize(), (D.staff && !D.spear && !D.crossbow ? STAFF_ARM : new THREE.Vector3(-.12, -.2, 1)).clone().normalize()).multiply(wq())); root.updateMatrixWorld(true);
    const ax = at('wrist.R').sub(at('lowerarm01.R')).normalize(), flat = v => v.addScaledVector(ax, -v.dot(ax)).normalize(), kn = flat(at('finger2-1.R').sub(at('finger5-1.R'))), up = flat(new THREE.Vector3(0, 1, 0));
    setWorld(new THREE.Quaternion().setFromAxisAngle(ax, Math.atan2(kn.clone().cross(up).dot(ax), kn.dot(up))).multiply(wq())); root.updateMatrixWorld(true);
    // what the roll leaves, the wrist takes: the hand turned so it runs on level from the forearm and its knuckles stand plumb
    const wr = byName['wrist.R'], frame = (L, K) => { K = K.clone().normalize(); L = L.clone().addScaledVector(K, -L.dot(K)).normalize(); return new THREE.Matrix4().makeBasis(L, K, L.clone().cross(K)); };
    const mid = at('finger3-1.R').add(at('finger4-1.R')).multiplyScalar(.5), cur = frame(mid.sub(at('wrist.R')), at('finger2-1.R').sub(at('finger5-1.R'))), tgt = frame(new THREE.Vector3(ax.x, 0, ax.z), new THREE.Vector3(0, 1, 0));
    const fix = new THREE.Quaternion().setFromRotationMatrix(tgt.multiply(cur.transpose())); wristFix = +(2 * Math.acos(Math.min(1, Math.abs(fix.w)))).toFixed(3);
    wr.quaternion.copy(wr.parent.getWorldQuaternion(new THREE.Quaternion()).invert().multiply(fix.multiply(wr.getWorldQuaternion(new THREE.Quaternion()))));
    // the fingers' hinge is the knuckles' line, not the bones' own z (36° off it in this skeleton: about z the curled fingers rose
    // up the shaft instead of closing round it). Every finger bone hangs off its metacarpal unturned, so one axis serves them all
    root.updateMatrixWorld(true); const hinge = at('finger2-1.R').sub(at('finger5-1.R')).normalize().applyQuaternion(byName['metacarpal2.R'].getWorldQuaternion(new THREE.Quaternion()).invert());
    const curl = s => { for (let f = 2; f <= 5; f++) for (let j = 1; j <= 3; j++) { const b = byName[`finger${f}-${j}.R`]; if (b) b.quaternion.setFromAxisAngle(hinge, s * [1.15, 1.35, .95][j - 1]); } };
    spearGrip = fistGrip(body, byName, root, curl, hinge); }
  // a basket in the right fist (Session 1033), when it holds no spear or crossbow: the arm straight with the weight, the hand turned so
  // its fingers point down and its knuckles run level fore and aft, then the four fingers close round the handle's crown (fistGrip)
  let basketGrip = null, basketWrist = 0; if (D.basket && !D.spear && !D.crossbow && !D.staff) { const at = n => new THREE.Vector3().setFromMatrixPosition(byName[n].matrixWorld), wr = byName['wrist.R'];
    byName['lowerarm01.R'].quaternion.copy(q(.12, 0, 0)); root.updateMatrixWorld(true);
    const frame = (L, K) => { K = K.clone().normalize(); L = L.clone().addScaledVector(K, -L.dot(K)).normalize(); return new THREE.Matrix4().makeBasis(L, K, L.clone().cross(K)); };
    const mid = at('finger3-1.R').add(at('finger4-1.R')).multiplyScalar(.5), kn = at('finger2-1.R').sub(at('finger5-1.R')), cur = frame(mid.sub(at('wrist.R')), kn), tgt = frame(new THREE.Vector3(0, -1, 0), new THREE.Vector3(0, 0, Math.sign(kn.z) || 1));
    const fix = new THREE.Quaternion().setFromRotationMatrix(tgt.multiply(cur.transpose())); basketWrist = +(2 * Math.acos(Math.min(1, Math.abs(fix.w)))).toFixed(3);
    wr.quaternion.copy(wr.parent.getWorldQuaternion(new THREE.Quaternion()).invert().multiply(fix.multiply(wr.getWorldQuaternion(new THREE.Quaternion()))));
    root.updateMatrixWorld(true); const hinge = at('finger2-1.R').sub(at('finger5-1.R')).normalize().applyQuaternion(byName['metacarpal2.R'].getWorldQuaternion(new THREE.Quaternion()).invert());
    const curl = s => { for (let f = 2; f <= 5; f++) for (let j = 1; j <= 3; j++) { const b = byName[`finger${f}-${j}.R`]; if (b) b.quaternion.setFromAxisAngle(hinge, s * [1.15, 1.35, .95][j - 1]); } };
    basketGrip = fistGrip(body, byName, root, curl, hinge); }
  let tabardStats = null; if (D.tabard) { root.updateMatrixWorld(true); const T = buildTabard(G, body, byName); root.add(T.mesh); tabardStats = T.stats; }
  // the sash (Session 989): the arm at its hip is lifted out from the side, three hundredths of a radian at a time, until no point of it is through the band.
  // Its knot's hanging ends (Session 996) fall over the front of the thigh, where the relaxed hand lies: then the arm is swung back
  // from the shoulder, as far again at most, until the hand hangs at the thigh's side behind them
  let sashStats = null; if (D.sash) { const hipArm = byName[D.sashSide === 'R' ? 'upperarm01.L' : 'upperarm01.R'], sg = D.sashSide === 'R' ? 1 : -1; let T, lift = 0, swing = 0;
    const back = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0).applyQuaternion(root.getWorldQuaternion(new THREE.Quaternion())), .03);
    for (;;) { root.updateMatrixWorld(true); T = buildSash(G, body, byName); const ends = T.stats.knot ? T.stats.knot.endArm : 0;
      if (T.stats.armIn && lift < .3) { lift += .03; hipArm.quaternion.multiply(q(0, 0, sg * .03)); }
      else if (ends && swing < .3) { swing += .03; const pw = hipArm.parent.getWorldQuaternion(new THREE.Quaternion()); hipArm.quaternion.premultiply(pw).premultiply(back).premultiply(pw.invert()); }
      else break; }
    root.add(T.mesh); sashStats = { ...T.stats, armLift: +lift.toFixed(2), armSwing: +swing.toFixed(2) }; }
  // the Old Blood's shoulder wrap (Session 1048), the sash's loop built wide: never with a sash, a cloak or cape, a bib, a tabard or mail,
  // which it would lie under or through. The arm at its hip is lifted as the sash's is
  let shoulderWrapStats = null; if (shoulderWrapOn(D)) { const hipArm = byName[D.shoulderWrapSide === 'R' ? 'upperarm01.L' : 'upperarm01.R'], sg = D.shoulderWrapSide === 'R' ? 1 : -1; let T, lift = 0;
    for (;;) { root.updateMatrixWorld(true); T = buildSash(G, body, byName, { wrap: true, meshes }); if (T.stats.armIn && lift < .3) { lift += .03; hipArm.quaternion.multiply(q(0, 0, sg * .03)); } else break; }
    root.add(T.mesh); shoulderWrapStats = { ...T.stats, armLift: +lift.toFixed(2), hairUnder: T.cutHair() }; }
  let laceStats = null; if (D.bodice) { root.updateMatrixWorld(true); const L = buildLacing(G, meshes); for (const m of L.meshes) root.add(m); laceStats = L.stats; }
  let cordStats = null; if (D.cord) { root.updateMatrixWorld(true); const C = buildCord(G, body, meshes); for (const m of C.meshes) root.add(m); cordStats = C.stats; if (D.robe && o.robeStats !== false) Object.assign(cordStats, robeStats(body, meshes)); }
  // the head-wrap's tail (Session 1018), on the back over everything there, before the necklace that lies over it; never under a cloak
  // and a headscarf's point and knot (Session 1029), the same way
  let tailStats = null; if ((D.wrapTail || D.scarf) && wrapStats && !D.cloak) tailStats = buildWrapTail(G, body, byName, meshes, root)?.stats ?? null;
  // the coin necklace (Session 1003), over everything at the neck but a cloak, which hangs over it; none under a raised hood
  let neckStats = null; if (D.necklace && !(D.cloak && D.hood === 'up')) { root.updateMatrixWorld(true); neckStats = buildNecklace(G, body, byName, meshes, root).stats; }
  // coins hanging from the belt (Session 1004), when nothing hangs over the belt's front (a tabard, an apron)
  let beltCoinStats = null; if (D.beltCoins && D.belt && !D.tabard && !D.apron) { root.updateMatrixWorld(true); beltCoinStats = buildBeltCoins(G, body, byName, meshes, root)?.stats ?? null; }
  // the Old Blood's amulet and charms on the belt (Session 1042), when nothing hangs over the belt's front, as for the coins
  let charmStats = null; if ((D.amulet || D.charms) && D.belt && !D.tabard && !D.apron) { root.updateMatrixWorld(true); charmStats = buildBeltCharms(G, body, byName, meshes, root)?.stats ?? null; }
  let sandalSt = null; if (D.sandals) { root.updateMatrixWorld(true); sandalSt = buildSoles(G, body, byName, meshes, root); }
  let sashBeltSt = null; if (sashBeltOn(D)) { root.updateMatrixWorld(true); sashBeltSt = sashBeltStats(meshes, root); }
  let mailSt = null; if (mail && o.mailStats !== false) { root.updateMatrixWorld(true); mailSt = mailStats(body, meshes); }
  let cloakStats = null; if (D.cloak) { root.updateMatrixWorld(true); const C = buildCloak(G, body, byName, RND); for (const m of C.meshes) root.add(m); cloakStats = C.stats; }
  // the round shield (Session 904), last: it is laid outside everything else, and lifts the left arm clear where it must. Under a
  // cloak, which hangs over the arm that holds it, or a shoulder cape, which stands 8 cm out over the board's top edge, it is slung on the back (Session 905)
  let shieldStats = null; if (D.shield && !D.cloak) { const S = (D.shieldShape === 'kite' || D.shieldShape === 'hoplon' ? buildKite : buildShield)(G, body, byName, meshes, root); shieldStats = { ...S.stats, bottom: +S.low.toFixed(3) }; }
  // (a kite or a hoplon is slung too since Session 916; Sessions 911 and 913 left it off under a cloak)
  else if (D.shield) shieldStats = buildShieldBack(G, body, byName, meshes, root, heads).stats;
  let spearStats = null; if (D.spear) spearStats = { ...buildSpear(G, body, byName, meshes, root, spearGrip).stats, wrist: wristFix };
  // a crossbow in the same fist (Session 941), when it holds no spear
  let crossbowStats = null; if (D.crossbow && !D.spear && !D.chair) crossbowStats = { ...buildCrossbow(G, body, byName, meshes, root, spearGrip).stats, wrist: wristFix };
  // a walking staff in the same fist (Session 1085), when it holds no spear or crossbow
  let staffStats = null; if (D.staff && !D.spear && !D.crossbow) staffStats = { ...buildStaff(G, body, byName, meshes, root, spearGrip).stats, wrist: wristFix };
  // a basket in the same fist (Session 1033), when it holds no spear, crossbow or staff; last, as it is lifted clear of all the rest
  let basketStats = null; if (basketGrip) basketStats = { ...buildBasket(G, body, byName, meshes, root, basketGrip).stats, wrist: basketWrist };
  // the wheeled chair (Session 1106), last, built to the seated body and everything on it
  let chairSt = null; if (D.chair) { const Ch = buildChair(G, body, byName, meshes, root); chairSt = { ...Ch.stats, armLift: +seatArms.toFixed(2), ground: Ch.ground };
    // and a crossbow across the knees (Session 1116), laid on them after the chair, clear of it
    if (D.crossbow) chairSt.lap = buildLapCrossbow(G, body, byName, meshes, root, Ch).stats; }
  const legWrapSt = D.legWraps ? legWrapStats(body, meshes) : null;
  root.position.y = -(chairSt ? chairSt.ground : sandalSt ? sandalSt.ground : minY); return { root, skeleton, byName, meshes, coldLook: { eyes: G.eyes, skin: G.skin }, hair: hairStats, cloak: cloakStats, tabard: tabardStats, sash: sashStats, shoulderWrap: shoulderWrapStats, wrap: wrapStats, wrapTail: tailStats, earrings: earStats, eyepatch: patchStats, necklace: neckStats, beltCoins: beltCoinStats, beltCharms: charmStats, sandals: sandalSt, sashBelt: sashBeltSt, cord: cordStats, lacing: laceStats, skirtHands, hood: hoodStats, brows: browStats, helm: helmStats, mail: mailSt, shield: shieldStats, spear: spearStats, crossbow: crossbowStats, staff: staffStats, basket: basketStats, legWraps: legWrapSt, chair: chairSt };
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
export const BODY_SLIDERS = ['g', 'age', 'muscle', 'weight', 'height', 'prop'], GARMENTS = ['tunic', 'trousers', 'boots', 'belt', 'mantle', 'cuffs', 'skirtColor', 'cloak', 'cloakFur', 'cloakHem', 'brooch', 'apron', 'tabard', 'tabardTrim', 'sash', 'sashBorder', 'wrap', 'wrapBorder', 'earrings', 'necklace', 'beltCoins', 'sashBelt', 'sandals', 'robe', 'cord', 'bodice', 'lace', 'cuffBand', 'mail', 'helm', 'shield', 'shieldPaint', 'shieldRim', 'spear', 'crossbow', 'legWraps', 'scarfPrint', 'basket', 'basketCloth', 'amulet', 'charms', 'dots', 'shoulderWrap', 'eyepatch', 'staff', 'chair'], DRESS_FLAGS = { hood: null, cloakLen: .8, bib: false, apronLeather: false, cape: false, tabardLen: .5, sashSide: 'L', sashPrint: true, sashKnot: true, turban: false, scarf: false, wrapTail: null, shieldTurn: 1, shieldMetal: false, shieldShape: 'round', scales: false, spearHead: null, crossbowMake: null, amuletSide: 'L', shoulderWrapSide: 'L', eyepatchSide: 'L', staffMake: null, dotsStyle: 'drift' };
export function toSaved(G) {
  const D = G.dress || {}, dress = {}; for (const k of GARMENTS) if (D[k]) dress[k] = hex(D[k]); dress.skirt = D.skirt || null; for (const [k, d] of Object.entries(DRESS_FLAGS)) if (D[k] != null && (typeof D[k] === 'number' ? r3(D[k]) : D[k]) !== d) dress[k] = typeof D[k] === 'number' ? r3(D[k]) : D[k];
  const style = G.hair?.style ?? ((G.hairLen ?? .3) < .45 ? 'short' : 'loose');
  return { species: 'human', v: 1, seed: String(G.seed ?? 'person'), people: G.people || 'markman', sliders: round({ ...Object.fromEntries(BODY_SLIDERS.map(k => [k, G[k] ?? (k === 'prop' ? .6 : .5)])), ...(G.face || {}) }),
    race: round(G.race || { caucasian: 1 }), palette: { skin: hex(G.skin), hair: hex(G.hairCol || [0, 0, 0]), eyes: hex(G.eyes) }, hair: { style, len: r3(G.hair?.len ?? G.hairLen ?? .3), beard: r3(G.beard || 0), ...(G.brow ? { brow: [r3(G.brow.thick), r3(G.brow.arch)] } : {}) },
    dress, pose: round(G.pose || {}), ...(G.marks != null ? { marks: { cold: r3(G.marks) } } : {}), ...(G.scar ? { scar: G.scar } : {}) };
}
export function fromSaved(J) {
  if (!J || J.species !== 'human') throw new Error('not a human genome'); const S = J.sliders || {}, G = { seed: J.seed, people: J.people, race: { ...(J.race || { caucasian: 1 }) }, face: {} };
  for (const [k, v] of Object.entries(S)) if (BODY_SLIDERS.includes(k)) G[k] = v; else G.face[k] = v;
  G.skin = unhex(J.palette.skin); G.hairCol = unhex(J.palette.hair); G.eyes = unhex(J.palette.eyes);
  G.hair = { style: J.hair?.style || 'short', len: J.hair?.len ?? .3 }; G.beard = J.hair?.beard || 0; if (J.hair?.brow) G.brow = { thick: J.hair.brow[0], arch: J.hair.brow[1] };
  G.dress = { skirt: J.dress?.skirt || null }; for (const [k, d] of Object.entries(DRESS_FLAGS)) G.dress[k] = J.dress?.[k] ?? d; for (const k of GARMENTS) if (J.dress?.[k]) G.dress[k] = unhex(J.dress[k]); G.pose = { ...(J.pose || {}) }; if (J.marks) G.marks = J.marks.cold ?? 0; if (J.scar) G.scar = J.scar; return G;
}
// ── the four peoples (Session 806, B3): slider ranges over the one human body, from the canon's peoples table (§2) and the
// kept sheets (OG-048 and OG-059 Gatelanders, OG-025 Markmen, OG-044 Aurennais, OG-066 the Old Blood). A people sets the
// ranges and the palettes; the seed picks inside them. Heights are given in metres (Michael's 1 B: the heroic hybrid, about
// 1.80 m, the Markmen taller and the Old Blood short) and turned into the height slider by measuring the morphed body. The Old Blood's marks under the skin are drawn in the skin's shader (Session 1052, markSkin); the Gatelanders' freckles want a skin texture, owed.
const U = (a, b) => [a, b];
export const PEOPLES = {
  gatelander: { name: 'Gatelanders', race: { caucasian: [.9, 1], african: [0, .05], asian: [0, .05] },
    body: { m: { metres: [1.72, 1.84], muscle: [.52, .7], weight: [.36, .52] }, f: { metres: [1.6, 1.72], muscle: [.45, .6], weight: [.38, .54] } },
    skin: [[.9, .74, .64], [.88, .69, .58], [.86, .64, .54], [.92, .77, .69]], hair: [[.62, .3, .14], [.5, .22, .1], [.72, .38, .18], [.25, .17, .12], [.36, .24, .15]], eyes: [[.42, .55, .4], [.4, .52, .62], [.38, .3, .2]],
    styles: { m: { short: 6, tail: 2 }, f: { braid: 3, tail: 2, bun: 2, loose: 2 } },
    wool: [[.45, .16, .12], [.3, .36, .22], [.55, .42, .2], [.2, .3, .4], [.62, .58, .5]], cloak: .65, hood: .5, cape: .5, capes: [[.5, .14, .1], [.45, .16, .12], [.3, .36, .22]], brooch: [.62, .47, .22], legWraps: [0, .45], scarf: [.85, 0], basket: [.4, .12], apron: [.35, .3], mantle: 0, brow: { m: { thick: [.5, .75], arch: [.3, .5] }, f: { thick: [.35, .55], arch: [.5, .75] } } },
  markman: { name: 'Markmen', race: { caucasian: [1, 1], african: [0, 0], asian: [0, 0] },
    body: { m: { metres: [1.84, 1.98], muscle: [.66, .92], weight: [.48, .7] }, f: { metres: [1.72, 1.84], muscle: [.52, .7], weight: [.46, .64] } },
    skin: [[.92, .8, .74], [.9, .77, .7], [.88, .74, .66]], hair: [[.8, .72, .56], [.72, .64, .5], [.86, .8, .66], [.62, .54, .42]], eyes: [[.55, .6, .62], [.5, .56, .6], [.45, .55, .62]],
    styles: { m: { short: 5, braids: 2, tail: 2 }, f: { braids: 4, braid: 3, bun: 1 } },
    wool: [[.32, .26, .2], [.24, .27, .32], [.3, .32, .26], [.2, .2, .22], [.45, .16, .12]], cloak: .3, fur: true, brooch: [.35, .35, .37], apron: [.15, .1], mantle: .8, cuffBands: .7, brow: { m: { thick: [.7, .95], arch: [.15, .35] }, f: { thick: [.45, .65], arch: [.35, .55] } } },
  aurennais: { name: 'Aurennais', race: { caucasian: [.3, .65], african: [.25, .7], asian: [0, .15] },
    body: { m: { metres: [1.74, 1.86], muscle: [.5, .66], weight: [.32, .46] }, f: { metres: [1.62, 1.74], muscle: [.42, .56], weight: [.34, .48] } },
    skin: [[.74, .56, .42], [.64, .46, .33], [.52, .36, .25], [.4, .27, .19], [.31, .21, .15]], hair: [[.1, .07, .06], [.16, .11, .08], [.22, .15, .1]], eyes: [[.3, .2, .12], [.22, .15, .1], [.35, .28, .16]],
    styles: { m: { short: 7, tail: 1 }, f: { braids: 3, braid: 2, bun: 3, loose: 1 } },
    wool: [[.86, .81, .71], [.9, .86, .78], [.25, .35, .55], [.74, .55, .25], [.8, .78, .74]], cloak: .1, brooch: [.7, .55, .25], apron: [.1, 0], mantle: 0, sash: .45, wrap: [.45, .3], turban: [.2, .85], wrapTail: [.55, .25], earrings: [.6, .25], necklace: [.35, .12], beltCoins: .25, sashBelt: .35, sandals: .7, brow: { m: { thick: [.6, .85], arch: [.4, .6] }, f: { thick: [.45, .65], arch: [.6, .85] } } },
  oldblood: { name: 'the Old Blood', race: { caucasian: [.75, .95], african: [0, .05], asian: [.05, .25] },
    body: { m: { metres: [1.56, 1.66], muscle: [.4, .54], weight: [.28, .4] }, f: { metres: [1.46, 1.56], muscle: [.36, .5], weight: [.3, .42] } },
    skin: [[.82, .78, .76], [.78, .74, .72], [.85, .81, .79]], hair: [[.05, .05, .06], [.08, .07, .08], [.11, .1, .11]], eyes: [[.66, .68, .7], [.58, .6, .63]],
    styles: { m: { short: 5, tail: 3 }, f: { loose: 3, braid: 3, tail: 2 } },
    wool: [[.18, .17, .2], [.3, .12, .12], [.28, .22, .32], [.82, .8, .74], [.36, .34, .33]], cloak: .5, hood: .2, brooch: [.4, .4, .42], apron: [0, 0], mantle: 0, amulet: .5, charms: .45, dots: .6, shoulderWrap: .45, marks: .8, brow: { m: { thick: [.3, .5], arch: [.1, .3] }, f: { thick: [.2, .4], arch: [.2, .4] } } },
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
  // the Markmen's woven cuff bands (Session 889, OG-025: red and blue), drawn last for the same reason
  if (P.cuffBands && rnd() < P.cuffBands) { const [a, b] = pick([[[.5, .14, .12], [.2, .28, .45]], [[.2, .28, .45], [.5, .14, .12]]]); D.cuffs = a; D.cuffBand = b; }
  // the Aurennais' sash over one shoulder (Session 989, OG-056: indigo, madder, saffron and olive, block-printed borders), for those
  // with no cloak and no bib to cover it, drawn last for the same reason
  if (P.sash && !D.cloak && !D.bib && rnd() < P.sash) { D.sash = pick([[.2, .26, .5], [.55, .18, .12], [.74, .52, .16], [.36, .38, .2]]); D.sashBorder = pick([[.86, .7, .35], [.9, .82, .6], [.55, .18, .12]]); D.sashSide = rnd() < .75 ? 'L' : 'R'; }
  // the Aurennais' head-wraps (Session 994, OG-044 and OG-056: saffron, madder, teal, indigo and undyed), more often on the women,
  // never with a raised hood, drawn last for the same reason
  if (P.wrap && !(D.cloak && D.hood === 'up') && rnd() < P.wrap[sx === 'f' ? 0 : 1]) { D.wrap = pick([[.78, .55, .16], [.6, .16, .12], [.12, .42, .42], [.2, .26, .5], [.88, .84, .74]]); if (rnd() < .5) D.wrapBorder = pick([[.86, .7, .35], [.9, .82, .6], [.55, .18, .12]]); }
  // the Aurennais' hoops (Session 995, OG-044 and OG-056: gold and bronze), more often on the women, drawn last for the same reason
  if (P.earrings && rnd() < P.earrings[sx === 'f' ? 0 : 1]) D.earrings = pick([[.85, .66, .3], [.7, .45, .22]]);
  // the coin necklace (Session 1003), drawn after the hoops so every earlier roll of a seed is as it was; in the hoops' metal when there are any
  if (P.necklace && rnd() < P.necklace[sx === 'f' ? 0 : 1]) D.necklace = D.earrings || pick([[.85, .66, .3], [.7, .45, .22]]);
  // coins on the belt (Session 1004, OG-056's tooled belt with hanging coins), drawn last for the same reason, in the metal already worn
  if (P.beltCoins && D.belt && !D.tabard && !D.apron && rnd() < P.beltCoins) D.beltCoins = D.necklace || D.earrings || pick([[.85, .66, .3], [.7, .45, .22]]);
  // the wide sash belt (Session 1010, OG-056: rust red and indigo), on an uncovered waist, drawn last for the same reason; the leather
  // belt stays over it where coins hang from it, and on four in ten of the rest
  if (P.sashBelt && !D.tabard && !D.apron && rnd() < P.sashBelt) { D.sashBelt = pick([[.55, .22, .12], [.17, .2, .4]]); if (!D.beltCoins && rnd() > .4) D.belt = null; }
  // sandals in place of boots (Session 1015, OG-056's leather sandals with ankle straps), in the boots' leather, drawn last for the same reason
  if (P.sandals && D.boots && rnd() < P.sandals) { D.sandals = D.boots; D.boots = null; }
  // the head-wrap wound up into a taller turban (Session 1017, OG-044's and OG-093's men; OG-109's and OG-111's turbans), mostly on the
  // men, drawn last for the same reason
  if (P.turban && D.wrap && rnd() < P.turban[sx === 'f' ? 0 : 1]) D.turban = true;
  // the wrap's tail hanging down the back (Session 1018, OG-044's and OG-056's women), more often on the women, never under a cloak, drawn last for the same reason
  if (P.wrapTail && D.wrap && !D.cloak && rnd() < P.wrapTail[sx === 'f' ? 0 : 1]) D.wrapTail = rnd() < .7 ? 'L' : 'R';
  // the Gatelanders' leg wraps (Session 1021, OG-048 and OG-059), on men in trousers and boots, in undyed, brown, moss or grey wool, drawn last for the same reason
  if (P.legWraps && D.trousers && D.boots && rnd() < P.legWraps[sx === 'f' ? 0 : 1]) D.legWraps = pick([[.62, .58, .5], [.45, .38, .3], [.3, .36, .22], [.42, .42, .4]]);
  // the Gatelanders' headscarves (Session 1029, OG-048 and OG-059: on women), never under a cloak or a helm, in madder, moss, sea blue,
  // ochre or undyed wool; seven in ten block-printed in a colour not the field's, half with a red border; drawn last for the same reason
  if (P.scarf && !D.cloak && !D.helm && rnd() < P.scarf[sx === 'f' ? 0 : 1]) { const F = [[.45, .16, .12], [.3, .36, .22], [.2, .3, .4], [.6, .46, .2], [.8, .76, .66]], k = Math.floor(rnd() * F.length); D.wrap = F[k]; D.scarf = true;
    if (rnd() < .7) D.scarfPrint = k === 4 ? pick([[.5, .14, .1], [.2, .3, .4]]) : pick([[.86, .82, .7], [.8, .62, .3]]); if (rnd() < .5) D.wrapBorder = k === 0 ? [.8, .62, .3] : [.55, .14, .1]; }
  // the Gatelanders' baskets (Session 1033, OG-048's farm woman, OG-059), more often on the women, in buff, brown or peeled willow; six in
  // ten with a linen cloth over the load (undyed, or madder), the rest heaped with apples; drawn last for the same reason
  if (P.basket && !D.spear && !D.crossbow && rnd() < P.basket[sx === 'f' ? 0 : 1]) { D.basket = pick([[.62, .47, .28], [.46, .33, .2], [.74, .64, .46]]); if (rnd() < .6) D.basketCloth = pick([[.84, .8, .7], [.8, .76, .66], [.6, .22, .16]]); }
  // the Old Blood's amulet and charms on the belt (Session 1042, OG-066), on a belt no tabard or apron covers: the stone in slate,
  // ash or a dusk grey-violet, on the left hip on seven in ten; the charms' thongs in the belt's leather; drawn last for the same reason
  if (P.amulet && D.belt && !D.tabard && !D.apron) { if (rnd() < P.amulet) { D.amulet = pick([[.32, .34, .37], [.55, .54, .52], [.36, .32, .4]]); if (rnd() < .3) D.amuletSide = 'R'; } if (rnd() < P.charms) D.charms = D.belt; }
  // the Old Blood's dot embroidery (Session 1043, OG-066): on an undyed tunic in oxblood, slate or dusk violet thread; on a dark one, half
  // as often, in bone; drawn last for the same reason
  if (P.dots && D.tunic) { const undyed = D.tunic[0] > .6; if (rnd() < P.dots * (undyed ? 1 : .5)) D.dots = undyed ? pick([[.42, .14, .12], [.3, .32, .36], [.34, .26, .4]]) : [.84, .8, .7]; }
  // the Old Blood's shoulder wrap (Session 1048, OG-066's dark asymmetric layer over the undyed linen), for those with no cloak, cape,
  // sash or bib: on an undyed tunic at the people's rate, on a dark one at half of it, in umber, slate, ash, oxblood or dusk violet
  // wool not the tunic's own, over the left shoulder on seven in ten; drawn last so every earlier roll of a seed is as it was
  if (P.shoulderWrap && D.tunic && !D.cloak && !D.sash && !D.bib && !D.tabard) { const undyed = D.tunic[0] > .6; if (rnd() < P.shoulderWrap * (undyed ? 1 : .5)) {
    const W = [[.4, .34, .3], [.36, .38, .42], [.48, .46, .44], [.44, .2, .18], [.4, .32, .44]].filter(c => Math.hypot(c[0] - D.tunic[0], c[1] - D.tunic[1], c[2] - D.tunic[2]) > .08);
    D.shoulderWrap = pick(W); if (rnd() < .3) D.shoulderWrapSide = 'R'; } }
  // the Old Blood's marks under the skin (Session 1052; canon §3.1: a child either shows them or does not), on the people's share; one
  // in eight of those marked has read past the Withdrawal's law and carries the Cold, the marks spread a fifth to two thirds of the way
  // up toward the face; the rest barely past the wrist; drawn last for the same reason
  if (P.marks && rnd() < P.marks) G.marks = rnd() < .125 ? .2 + .45 * rnd() : .06 * rnd();
  // the hurt (Session 1079; OG-001's extras strip asks for the disabled, an eyepatch and scars, in every town): an old cut across one
  // eye on one man in fourteen and one woman in forty, of every people; one in four of those lost the eye and wears a patch over it,
  // in black or brown leather; drawn last for the same reason
  if (rnd() < (sx === 'f' ? .025 : .07)) { G.scar = rnd() < .5 ? 'L' : 'R'; if (rnd() < .25) { D.eyepatch = pick([[.11, .095, .085], [.24, .15, .09]]); D.eyepatchSide = G.scar; } }
  // a child (Session 1081, L1; OG-081's children and young people, "each at child scale"; OG-109 to OG-111: children's clothes as small
  // copies of their parents'): the same roll, so a child dresses as the grown folk of its people do, then made 11 to 15 years old
  // from a stream of its own, slighter (muscle .3 to .45, weight .3 to .45), four fifths of the people's middle stature at 11 and 92 per cent at 15, and with nothing a
  // grown body carries: no beard, no scar or patch, no helm, mail, tabard, shield, spear or crossbow, and an Old Blood child's
  // marks barely past the wrist (canon §3.1: a child shows them or does not; the Cold comes of reading)
  // the old (Session 1082, L1; OG-001's Edna, "a white-haired old healer"; OG-065's grey-haired Bronwen): the same roll, then 64 to 90
  // years old from a stream of their own, a little less muscle, the hair (and so the brows and beard) gone most of the way to grey
  // or white (fair hair always to white, so it never darkens), and on six in ten a stoop, more of one the older they are
  if (o.old) { const ro = seeded(String(o.seed ?? 'person') + '|old'), t = ro(); G.age = .8 + .2 * t; G.muscle = Math.max(.2, G.muscle - .1 - .08 * ro());
    const w = ro() < .5 || .3 * G.hairCol[0] + .59 * G.hairCol[1] + .11 * G.hairCol[2] > .55 ? [.86, .85, .83] : [.66, .65, .63], k = .55 + .4 * t + .05 * ro(); G.hairCol = G.hairCol.map((v, i) => v + (w[i] - v) * Math.min(1, k));
    if (ro() < .6) G.pose = { ...(G.pose || {}), stoop: +(.25 + .5 * t + .25 * ro()).toFixed(3) };
    // a walking staff (Session 1085), drawn after the rest so every earlier roll is as it was: on a third of the old, more of the
    // older and the stooped, and on half the Old Blood's (their elders' carved staff), when the right fist holds nothing else
    const sr = ro(), pk = a => a[Math.floor(ro() * a.length)]; if (!D.spear && !D.crossbow && !D.basket && sr < (G.people === 'oldblood' ? .5 : .3) + .15 * t + (G.pose?.stoop ? .1 : 0)) D.staff = G.people === 'oldblood' ? pk([[.2, .16, .13], [.3, .24, .19]]) : G.people === 'aurennais' ? pk([[.5, .4, .28], [.42, .32, .2]]) : pk([[.45, .33, .2], [.36, .26, .16], [.52, .42, .3]]); }
  if (o.child) { const rc = seeded(String(o.seed ?? 'person') + '|child'), ta = rc(); G.age = .1875 + .09 * ta; G.muscle = .3 + .15 * rc(); G.weight = .3 + .15 * rc(); G.beard = 0; G.scar = null;
    for (const k of ['helm', 'mail', 'scales', 'tabard', 'tabardTrim', 'shield', 'shieldPaint', 'shieldRim', 'spear', 'crossbow', 'eyepatch', 'staff', 'staffMake']) D[k] = DRESS_FLAGS[k] ?? null;
    if (G.marks != null) G.marks = Math.min(G.marks, .06 * rc()); const M = P.body[sx].metres, f = .8 + .12 * ta + .03 * (rc() - .5); G.height = heightFor(G, (M[0] + M[1]) / 2 * f);
    // a cloak or cape cut to the child (its length in buildCloak is in metres: .4 + the length, or a cape's .24 + .14 of it), so a long one does not pool on the ground
    if (D.cloak) D.cloakLen = Math.max(0, D.cape ? ((.24 + .14 * (D.cloakLen ?? .8)) * f - .24) / .14 : (.4 + (D.cloakLen ?? .8)) * f - .4); }
  return G;
}
// a genome rolled from a seed, inside a people's ranges (Markfolk by default, as Session 804 rolled them)
export function rollGenome(seed, o = {}) { const rnd = seeded(seed), g = o.g ?? (rnd() < .5 ? 0 : 1); if (o.people) return peopleGenome(rnd, o.people, g, { seed: String(seed), child: !!o.child, old: !!o.old && !o.child }); const G = markGenome(rnd, g, { seed: String(seed) }); G.people = 'markman'; return G; }
