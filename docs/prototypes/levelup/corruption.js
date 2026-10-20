// The world's corruption, 0 to 6 (the concept artist, 20 Oct 2026; backlog L12 "The gates unsettling the world", OG-145; card F12;
// visual-foundation.md §2 "The world's corruption", Michael, 13 Oct). On Varek's path each great gate torn open corrupts the world
// where the player can see it: the sky's colour, the trees' shapes, colour draining toward black and white. One number, the level
// (the gates torn, 0 to 6; it falls again when one is sealed), is read by five things, so each stage is a row of numbers and no new art:
//   the grade     (corruptGrade): saturation, a hue kept (violet through red: the gates' own light, which the drain spares),
//                 contrast about middle grey, a cast and the vignette; a pass after the bloom, before the output (F3's landRender
//                 composite is where the game's copy goes);
//   the sky       (corruptSky): the dome's zenith, middle and horizon, the sun's glow; each torn gate's colour low on the horizon
//                 toward that gate (the lobes), and at 6 the black sun in its ring (OG-145's last stage);
//   the light     sun colour and strength, the hemisphere, the fog's colour and density;
//   the clouds    one multiplier on each puff's colour;
//   the trees     (corruptTrees, on common.js's treeKit): the crowns thin (whole leaf cards dropped by a hash, so the branches show),
//                 droop and twist about the trunk, the leaves turn from green through rust to ash, the bark darkens; the grass with them.
// And OG-145's spreading signs, near a gate (corruptSigns): stones lifting off the ground from 2, a violet rift standing in a ruined
// arch from 3, more of both as the level climbs. LEVELS[n] is the row; lerpLevel(x) blends two rows for a fractional level (a slider,
// or a fade while the world changes). CASTS are the six schools' colours, gatekit.js's GK_SCHOOLS glow. A metre a unit.
import * as THREE from 'three';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { TEX, worldUV } from './common.js';
import { GK_SCHOOLS, stream } from './gatekit.js';

const r3 = (a, b, c) => [a, b, c];
// one row a level. sat: the grade's saturation (P10b's 1.08 at 0); keep: how much of the gates' hue escapes the drain; con: contrast;
// cast: a multiply over the frame; vig: the vignette. zen/mid/hor/glow: the sky. sun/sunK, hemi/hemiK/gnd: the light. fog/fogD.
// cloud: puffs × this. leaf/bark/grass: × the tint. thin: the share of leaf cards dropped; droop: metres down per (metre out)²/10;
// twist: radians about the trunk per 10 m of height. rocks: stones afloat near a gate; rift: the rift's width and light, 0 to 1; ring: the black sun.
export const LEVELS = [
  { sat: 1.08, keep: 0, con: 1.0, cast: r3(1, 1, 1), vig: .28, zen: r3(.09, .25, .62), mid: r3(.30, .52, .86), hor: r3(.74, .83, .93), glow: r3(1, .82, .55),
    sun: r3(1, .9, .76), sunK: 3.3, hemi: r3(.64, .72, .88), gnd: r3(.36, .32, .26), hemiK: 1.15, fog: r3(.78, .82, .88), fogD: .0016, cloud: r3(1, 1, 1),
    leaf: r3(1, 1, 1), bark: r3(1, 1, 1), grass: r3(1, 1, 1), thin: 0, droop: 0, twist: 0, rocks: 0, rift: 0, ring: 0 },
  { sat: 1.0, keep: .1, con: 1.0, cast: r3(1, .99, .97), vig: .29, zen: r3(.12, .26, .56), mid: r3(.34, .50, .78), hor: r3(.78, .82, .86), glow: r3(1, .8, .58),
    sun: r3(1, .88, .78), sunK: 3.1, hemi: r3(.64, .70, .84), gnd: r3(.35, .31, .26), hemiK: 1.1, fog: r3(.78, .80, .84), fogD: .0019, cloud: r3(.98, .97, .97),
    leaf: r3(.98, .94, .80), bark: r3(.96, .94, .94), grass: r3(1, .96, .86), thin: .05, droop: .02, twist: .05, rocks: 0, rift: 0, ring: 0 },
  { sat: .9, keep: .2, con: 1.02, cast: r3(1, .98, .95), vig: .30, zen: r3(.16, .24, .48), mid: r3(.38, .46, .66), hor: r3(.80, .78, .76), glow: r3(1, .78, .6),
    sun: r3(1, .86, .80), sunK: 2.9, hemi: r3(.62, .66, .78), gnd: r3(.34, .30, .26), hemiK: 1.05, fog: r3(.76, .76, .78), fogD: .0023, cloud: r3(.95, .93, .94),
    leaf: r3(.95, .84, .64), bark: r3(.92, .88, .88), grass: r3(.98, .90, .72), thin: .12, droop: .05, twist: .1, rocks: 4, rift: 0, ring: 0 },
  { sat: .75, keep: .35, con: 1.04, cast: r3(.99, .96, .95), vig: .32, zen: r3(.20, .20, .38), mid: r3(.42, .42, .56), hor: r3(.80, .74, .68), glow: r3(1, .74, .62),
    sun: r3(.98, .86, .84), sunK: 2.6, hemi: r3(.60, .60, .70), gnd: r3(.32, .28, .26), hemiK: 1.0, fog: r3(.72, .70, .72), fogD: .0028, cloud: r3(.9, .86, .9),
    leaf: r3(.86, .70, .56), bark: r3(.84, .80, .80), grass: r3(.92, .82, .64), thin: .22, droop: .09, twist: .2, rocks: 10, rift: .35, ring: 0 },
  { sat: .55, keep: .6, con: 1.07, cast: r3(.98, .94, .96), vig: .34, zen: r3(.20, .16, .30), mid: r3(.40, .34, .46), hor: r3(.74, .62, .58), glow: r3(1, .7, .66),
    sun: r3(.95, .84, .90), sunK: 2.3, hemi: r3(.56, .52, .62), gnd: r3(.30, .26, .26), hemiK: .95, fog: r3(.64, .60, .64), fogD: .0034, cloud: r3(.8, .74, .82),
    leaf: r3(.74, .60, .60), bark: r3(.70, .65, .68), grass: r3(.84, .74, .62), thin: .34, droop: .14, twist: .32, rocks: 18, rift: .6, ring: 0 },
  { sat: .3, keep: .8, con: 1.12, cast: r3(.96, .92, .96), vig: .37, zen: r3(.16, .11, .20), mid: r3(.34, .26, .34), hor: r3(.66, .48, .46), glow: r3(1, .62, .6),
    sun: r3(.90, .82, .92), sunK: 1.9, hemi: r3(.50, .44, .52), gnd: r3(.27, .24, .25), hemiK: .88, fog: r3(.54, .50, .54), fogD: .0040, cloud: r3(.66, .58, .66),
    leaf: r3(.60, .50, .56), bark: r3(.55, .50, .54), grass: r3(.72, .65, .58), thin: .48, droop: .2, twist: .45, rocks: 28, rift: .85, ring: .35 },
  { sat: 0, keep: 1, con: 1.2, cast: r3(.95, .92, .94), vig: .42, zen: r3(.08, .06, .08), mid: r3(.24, .18, .20), hor: r3(.62, .36, .30), glow: r3(.9, .5, .45),
    sun: r3(.90, .86, .86), sunK: 1.5, hemi: r3(.44, .40, .44), gnd: r3(.24, .22, .22), hemiK: .8, fog: r3(.44, .40, .42), fogD: .0048, cloud: r3(.5, .42, .46),
    leaf: r3(.46, .42, .46), bark: r3(.40, .38, .40), grass: r3(.60, .57, .55), thin: .62, droop: .2, twist: .6, rocks: 40, rift: 1, ring: 1 },
];
export function lerpLevel(x) {
  x = Math.max(0, Math.min(6, x)); const a = LEVELS[Math.floor(x)], b = LEVELS[Math.min(6, Math.floor(x) + 1)], t = x - Math.floor(x), o = {};
  for (const k in a) o[k] = Array.isArray(a[k]) ? a[k].map((v, i) => v + (b[k][i] - v) * t) : a[k] + (b[k] - a[k]) * t;
  o.rocks = Math.round(o.rocks); o.level = x; return o;
}
// the six schools' colours, and the order the prototype tears them in when only a level is given
export const CASTS = Object.fromEntries(Object.entries(GK_SCHOOLS).map(([k, s]) => [k, s.glow]));
export const TEAR_ORDER = ['tine', 'uisce', 'scath', 'cloch', 'gaoth', 'solas'];

// ── the grade: after the bloom, in linear light, before the output pass's tone map ──
export function corruptGrade() {
  return new ShaderPass({ uniforms: { tDiffuse: { value: null }, uSat: { value: 1.08 }, uKeep: { value: 0 }, uCon: { value: 1 }, uCast: { value: new THREE.Vector3(1, 1, 1) }, uVig: { value: .28 },
      uCool: { value: new THREE.Vector3(.94, .98, 1.06) }, uWarm: { value: new THREE.Vector3(1.06, 1.0, .91) } },
    vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }',
    fragmentShader: `uniform sampler2D tDiffuse; uniform vec3 uCast, uCool, uWarm; uniform float uSat, uKeep, uCon, uVig; varying vec2 vUv;
      vec3 hsv(vec3 c){ vec4 K = vec4(0., -1./3., 2./3., -1.); vec4 p = mix(vec4(c.bg, K.wz), vec4(c.gb, K.xy), step(c.b, c.g)); vec4 q = mix(vec4(p.xyw, c.r), vec4(c.r, p.yzx), step(p.x, c.r));
        float d = q.x - min(q.w, q.y); return vec3(abs(q.z + (q.w - q.y) / (6. * d + 1e-6)), d / (q.x + 1e-6), q.x); }
      void main(){ vec3 c = texture2D(tDiffuse, vUv).rgb; float l = dot(c, vec3(.2126, .7152, .0722));
        c *= mix(uCool, uWarm, smoothstep(.02, .6, l));
        vec3 h = hsv(c); float gate = max(smoothstep(.70, .78, h.x), 1. - smoothstep(.02, .07, h.x)) * smoothstep(.22, .5, h.y);
        c = mix(vec3(l), c, mix(uSat, max(uSat, 1.), uKeep * gate));
        c = max(c, 0.) / .18; c = pow(c, vec3(uCon)) * .18; c *= uCast;
        vec2 q = vUv - .5; c *= 1. - uVig * dot(q, q) * 2.; gl_FragColor = vec4(c, 1.); }` });
}
export function setGrade(pass, L) { const u = pass.uniforms; u.uSat.value = L.sat; u.uKeep.value = L.keep; u.uCon.value = L.con; u.uCast.value.set(...L.cast); u.uVig.value = L.vig; }

// ── the sky: common.js's dome with its colours as uniforms, six horizon lobes and the ring ──
export function corruptSky(sunDir, ringDir) {
  const V = a => new THREE.Vector3(...a), U = { uSun: { value: sunDir }, uRingDir: { value: ringDir.clone().normalize() }, uRing: { value: 0 },
    uZen: { value: V([.09, .25, .62]) }, uMid: { value: V([.30, .52, .86]) }, uHor: { value: V([.74, .83, .93]) }, uGlow: { value: V([1, .82, .55]) },
    uLobe: { value: Array.from({ length: 6 }, () => new THREE.Vector4()) }, uLobeC: { value: Array.from({ length: 6 }, () => new THREE.Vector3()) } };
  const m = new THREE.Mesh(new THREE.SphereGeometry(26000, 64, 32), new THREE.ShaderMaterial({ side: THREE.BackSide, depthWrite: false, fog: false, uniforms: U,
    vertexShader: 'varying vec3 vD; void main(){ vD = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }',
    fragmentShader: `uniform vec3 uSun, uRingDir, uZen, uMid, uHor, uGlow; uniform float uRing; uniform vec4 uLobe[6]; uniform vec3 uLobeC[6]; varying vec3 vD;
      void main(){ vec3 d = normalize(vD); float y = max(d.y, 0.);
        vec3 c = mix(uHor, uMid, smoothstep(0., .18, y)); c = mix(c, uZen, smoothstep(.15, .75, y));
        vec2 dh = normalize(d.xz + 1e-5);
        for (int i = 0; i < 6; i++) { float a = max(dot(dh, normalize(uLobe[i].xy + 1e-5)), 0.); c += uLobeC[i] * uLobe[i].w * pow(a, 5.) * (1. - smoothstep(-.02, .5, d.y)) * 2.; }
        float sd = max(dot(d, normalize(uSun)), 0.); c += uGlow * (pow(sd, 6.) * .35 + pow(sd, 900.) * 18.) * (1. - .8 * uRing);
        float ang = acos(clamp(dot(d, uRingDir), -1., 1.)), R = .05;
        float corona = exp(-pow((ang - R - .002) / .004, 2.)) * 5. + exp(-max(ang - R, 0.) / .04) * step(R, ang) * .6 + exp(-max(ang - R, 0.) / .25) * step(R, ang) * .35;
        c += vec3(1., .16, .07) * corona * uRing; c = mix(c, vec3(.004), (1. - smoothstep(R - .002, R, ang)) * uRing);
        c = mix(c, uHor * .9, smoothstep(0., -.08, d.y)); gl_FragColor = vec4(c * 1.15, 1.); }` }));
  m.renderOrder = -1;
  return { mesh: m, U };
}
// torn: a list of [school, bearing in radians (0 is -z, the north of the slices), strength]; mode 'none' | 'sky' | 'world'
export function setSky(sky, L, torn = [], mode = 'sky') {
  const U = sky.U, k = L.level >= 6 ? .55 : 1;
  U.uZen.value.set(...L.zen); U.uMid.value.set(...L.mid); U.uHor.value.set(...L.hor); U.uGlow.value.set(...L.glow); U.uRing.value = L.ring;
  for (let i = 0; i < 6; i++) { const t = mode === 'sky' && torn[i]; if (!t) { U.uLobe.value[i].set(0, -1, 0, 0); continue; }
    const [s, b, w] = t; U.uLobe.value[i].set(Math.sin(b), -Math.cos(b), 0, (w ?? 1) * k); U.uLobeC.value[i].set(...CASTS[s]); }
  if (mode === 'world' && torn.length) { const c = CASTS[torn[torn.length - 1][0]]; for (const key of ['uZen', 'uMid', 'uHor']) U[key].value.lerp(new THREE.Vector3(...c).multiplyScalar(U[key].value.length() / 1.2), .28); }
}
// 'world' (option C): the last-torn school's colour laid over the light and the frame too
export function worldCast(L, torn, mode) {
  if (mode !== 'world' || !torn.length) return L; const c = CASTS[torn[torn.length - 1][0]], o = { ...L }, w = .3;
  o.cast = L.cast.map((v, i) => v * (1 - w + w * c[i] * 1.3)); o.fog = L.fog.map((v, i) => v * (1 - w + w * c[i] * 1.2)); o.sun = L.sun.map((v, i) => v * (1 - w * .6 + w * .6 * c[i] * 1.2)); return o;
}

// ── the trees: hooks on common.js's treeKit materials, after its own wind ──
const TREE_U = { uThin: { value: 0 }, uDroop: { value: 0 }, uTwist: { value: 0 }, uLeaf: { value: new THREE.Vector3(1, 1, 1) }, uBark: { value: new THREE.Vector3(1, 1, 1) } };
const BEND = `
  { float tw = uTwist * position.y / 10., cs = cos(tw), sn = sin(tw); transformed.xz = mat2(cs, -sn, sn, cs) * transformed.xz;
    transformed.y -= uDroop * dot(position.xz, position.xz) / 10.; }`;
function hook(m, leaf) {
  const prev = m.onBeforeCompile;
  m.onBeforeCompile = (s, r) => { prev && prev.call(m, s, r); Object.assign(s.uniforms, TREE_U);
    s.vertexShader = 'uniform float uThin, uDroop, uTwist;\n' + (leaf ? 'attribute float aCard; varying float vCard;\n' : '') + s.vertexShader.replace('#include <project_vertex>', BEND + (leaf ? '\n vCard = aCard;' : '') + '\n#include <project_vertex>');
    s.fragmentShader = 'uniform float uThin; uniform vec3 uLeaf, uBark;\n' + (leaf ? 'varying float vCard;\n' : '') + s.fragmentShader.replace('void main() {', 'void main() {\n' + (leaf ? ' if (vCard < uThin) discard;\n' : ''))
      .replace('#include <color_fragment>', '#include <color_fragment>\n' + (!m.isMeshDepthMaterial ? (leaf ? ' diffuseColor.rgb *= uLeaf;' : ' diffuseColor.rgb *= uBark;') : '')); };
  m.customProgramCacheKey = () => 'corrupt-' + (leaf ? 'leaf' : 'bark') + (m.isMeshDepthMaterial ? '-d' : '');
  m.needsUpdate = true;
}
// call once after treeKit's plant(): every leaf card gets one hash (aCard) shared by its four corners
export function corruptTrees(scene) {
  const seen = new Set(), r = stream('corrupt:cards');
  scene.traverse(o => { if (!o.isInstancedMesh) return; const leaf = !!o.material.alphaTest, g = o.geometry;
    if (leaf && !g.attributes.aCard) { const n = g.attributes.position.count, a = new Float32Array(n); for (let i = 0; i < n; i += 4) { const v = .02 + .98 * r(); a[i] = a[i + 1] = a[i + 2] = a[i + 3] = v; } g.setAttribute('aCard', new THREE.BufferAttribute(a, 1)); }
    if (!seen.has(o.material)) { seen.add(o.material); hook(o.material, leaf); }
    if (o.customDepthMaterial && !seen.has(o.customDepthMaterial)) { seen.add(o.customDepthMaterial); hook(o.customDepthMaterial, leaf); } });
}
export function setTrees(L) { TREE_U.uThin.value = L.thin; TREE_U.uDroop.value = L.droop; TREE_U.uTwist.value = L.twist; TREE_U.uLeaf.value.set(...L.leaf); TREE_U.uBark.value.set(...L.bark); }

// ── OG-145's signs near a gate: stones afloat over the ground, a rift standing in an arch ──
// corruptSigns({ ground: (x, z) => y, at: [x, z], r, rift: { x, y, z, ry, h } }) -> { group, set(L, t), tris }
export function corruptSigns(o) {
  const G = new THREE.Group(), r = stream('corrupt:signs'), rockM = new THREE.MeshStandardMaterial({ map: TEX.rock.map, normalMap: TEX.rock.normalMap, color: 0x9a948a, roughness: .95 });
  const seamM = new THREE.MeshBasicMaterial({ color: new THREE.Color(.62, .30, 1.0).multiplyScalar(2.4), transparent: true, opacity: .85, depthWrite: false, blending: THREE.AdditiveBlending, fog: false });
  const rocks = []; let tris = 0;
  for (let i = 0; i < 40; i++) { const a = r() * Math.PI * 2, d = (o.r ?? 30) * Math.sqrt(r()), x = o.at[0] + Math.cos(a) * d, z = o.at[1] + Math.sin(a) * d, s = .4 + Math.pow(r(), 2) * 2.4;
    const g = new THREE.DodecahedronGeometry(1, 1), P = g.attributes.position; for (let j = 0; j < P.count; j++) { const v = new THREE.Vector3().fromBufferAttribute(P, j), k = .75 + .35 * Math.sin(v.x * 3.1 + i) * Math.cos(v.z * 2.7 - i) + .1 * Math.sin(v.y * 5 + i * 2); v.multiplyScalar(k); v.y *= .7; P.setXYZ(j, v.x, v.y, v.z); }
    g.computeVertexNormals(); worldUV(g, .4); const m = new THREE.Mesh(g, rockM); m.scale.setScalar(s); m.castShadow = true; m.receiveShadow = true;
    const base = o.ground(x, z), lift = 1.5 + Math.pow(r(), 1.6) * 26 + s; m.position.set(x, base + lift, z); m.rotation.set(r() * 6, r() * 6, r() * 6);
    const seam = new THREE.Mesh(new THREE.CircleGeometry(s * .9, 12).rotateX(-Math.PI / 2), seamM); seam.position.set(x, base + .06, z);
    m.userData = { y: m.position.y, ph: r() * 6.28, sp: .3 + r() * .4 }; G.add(m, seam); rocks.push([m, seam]); tris += g.index ? g.index.count / 3 : P.count / 3; }
  // the rift: a tall seam of violet light standing in the arch, its edge torn by noise; additive, so it reads as light and not a sheet
  let rift = null, riftL = null;
  if (o.rift) { const R = o.rift, m = new THREE.ShaderMaterial({ transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, fog: false, uniforms: { uW: { value: 0 }, uT: { value: 0 } },
      vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }',
      fragmentShader: `uniform float uW, uT; varying vec2 vUv; float h(float p){ return fract(sin(p * 127.1) * 43758.5); } float n(float p){ float i = floor(p), f = fract(p); return mix(h(i), h(i + 1.), f * f * (3. - 2. * f)); }
        void main(){ float y = vUv.y, taper = sin(3.14159 * clamp(y, 0., 1.)), x = vUv.x - .5 + (n(y * 9. + uT * .3) - .5) * .16 + (n(y * 31.) - .5) * .05;
          float w = uW * taper * .14, core = 1. - smoothstep(w * .25, w * .45, abs(x)), halo = exp(-abs(x) / max(w, .001) * 2.2) * taper;
          vec3 c = vec3(.62, .30, 1.) * halo * 1.6 + vec3(1., .86, 1.) * core * 3.; gl_FragColor = vec4(c * step(.001, uW), 1.); }` });
    rift = new THREE.Mesh(new THREE.PlaneGeometry(R.w ?? 6, R.h), m); rift.position.set(R.x, R.y + R.h / 2, R.z); rift.rotation.y = R.ry || 0; G.add(rift);
    riftL = new THREE.PointLight(new THREE.Color(.62, .3, 1), 0, 40, 1.6); riftL.position.set(R.x, R.y + R.h * .45, R.z); G.add(riftL); }
  function set(L, t = 0) { rocks.forEach(([m, s], i) => { const on = i < L.rocks; m.visible = s.visible = on; if (on) m.position.y = m.userData.y + Math.sin(t * .001 * m.userData.sp + m.userData.ph) * .25; s.material.opacity = .85 * Math.min(1, L.rift + .3); });
    if (rift) { rift.material.uniforms.uW.value = L.rift; rift.material.uniforms.uT.value = t * .001; riftL.intensity = L.rift * 900; } }
  return { group: G, set, tris: Math.round(tris), rocks: rocks.length };
}
