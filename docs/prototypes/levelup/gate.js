// The old gates at their size (Session 771; the first cut, Session 769, was 17 m high). Michael, 12 Oct: the gates
// "should be shockingly large, like what we see in the concept art. Forget the 'dungeon with cobblestone walls' feel."
// ?view=gate: OG-037's first variation at OG-U2-009's scale. Five stepped pointed arches cut into a mountainside, each
// set 6.5 m deeper than the last, the outer one 100 m high; between them a spine of two pillars burning with script,
// and in it a slit door 24 m high. A camp at the foot, its people 1.6 to 1.9 m tall. &cam=foot stands at the door.
// ?view=hall: inside (OG-045, the Six Gates' interior glimpses). A nave 26 m wide and 250 m long under a pointed vault
// 50 m up, a pier every 14 m with script up its face, a floor of great dark slabs wet enough to hold the light, a
// stair, a ring at the far end and a shaft of cold light. The people are the scale: the same bodies as the lane's.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { Q, W, H, STATS, rnd, fbm, sstep, makeRenderer, makeComposer, buildTextures, TEX, mat, worldUV, skyDome, clouds, treeKit, run, WIND, windVS } from './common.js';
import { loadPack, makePerson, markGenome } from './people.js';

const VIEW = Q.get('view') || 'gate', CAM = Q.get('cam') || 'far';
const R = makeRenderer(VIEW === 'hall' ? 1.05 : .9);
const scene = new THREE.Scene();
const cam = new THREE.PerspectiveCamera(VIEW === 'hall' ? 62 : (CAM === 'foot' ? 70 : 62), W / H, .1, 30000);
buildTextures();

// ── the Weaver script: glyphs drawn on a canvas, one strip across (rings) or one strip down (pillars) ──
function glyphTex(down) {
  const L = 2048, S = 64, c = document.createElement('canvas'); c.width = down ? S : L; c.height = down ? L : S; const x = c.getContext('2d'); x.strokeStyle = '#fff'; x.lineCap = 'round'; x.lineWidth = 4;
  for (let i = 0; i < 40; i++) { const k = Math.floor(rnd() * 7), a = 25 + i * 51; x.save(); if (down) x.translate(32, a); else x.translate(a, 32); x.beginPath();
    if (k === 0) { x.arc(0, 0, 12, 0, 7); x.moveTo(0, -18); x.lineTo(0, 18); } else if (k === 1) { x.moveTo(-12, 18); x.lineTo(0, -18); x.lineTo(12, 18); x.moveTo(-7, 4); x.lineTo(7, 4); }
    else if (k === 2) { x.arc(0, 0, 13, .6, 5.7); x.moveTo(2, 0); x.arc(0, 0, 2, 0, 7); } else if (k === 3) { x.moveTo(-12, -14); x.lineTo(12, -14); x.moveTo(0, -14); x.lineTo(0, 18); x.moveTo(-8, 2); x.lineTo(8, 10); }
    else if (k === 4) { x.moveTo(-12, 0); x.lineTo(0, -16); x.lineTo(12, 0); x.lineTo(0, 16); x.closePath(); } else if (k === 5) { x.moveTo(-10, -16); x.lineTo(-10, 16); x.moveTo(10, -16); x.lineTo(10, 16); x.moveTo(-10, 0); x.lineTo(10, 0); }
    else { x.moveTo(0, -18); x.lineTo(0, 18); x.moveTo(-10, -8); x.lineTo(0, -2); x.lineTo(10, -8); } x.stroke(); x.restore(); }
  const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 8; return t;
}
// the ring sigil of OG-037: two circles, a cross that runs past them, a point at the heart
function sigilTex() {
  const c = document.createElement('canvas'); c.width = c.height = 512; const x = c.getContext('2d'); x.strokeStyle = '#fff'; x.fillStyle = '#fff'; x.lineCap = 'round';
  x.lineWidth = 16; x.beginPath(); x.arc(256, 256, 170, 0, 7); x.stroke(); x.lineWidth = 9; x.beginPath(); x.arc(256, 256, 96, 0, 7); x.stroke();
  x.lineWidth = 10; x.beginPath(); x.moveTo(256, 20); x.lineTo(256, 492); x.moveTo(20, 256); x.lineTo(492, 256); x.stroke(); x.beginPath(); x.arc(256, 256, 18, 0, 7); x.fill();
  const t = new THREE.CanvasTexture(c); t.anisotropy = 8; return t;
}
const GLYPH = glyphTex(false), GLYPHD = glyphTex(true), SIGIL = sigilTex();
const AMBER = new THREE.Color(1.0, .56, .18);
const glowMat = (tex, k) => new THREE.MeshBasicMaterial({ color: AMBER.clone().multiplyScalar(k), map: tex, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, fog: true, toneMapped: true, side: THREE.DoubleSide });
// a strip of glyphs between two world points, facing +z (or along a wall's normal): a long quad with u along its length
function strip(a, b, w, nrm, tex, k, rep) {
  const d = new THREE.Vector3().subVectors(b, a), len = d.length(), side = new THREE.Vector3().crossVectors(d, nrm).normalize().multiplyScalar(w / 2), g = new THREE.BufferGeometry();
  const P = [a.clone().sub(side), a.clone().add(side), b.clone().add(side), b.clone().sub(side)], pos = []; P.forEach(p => pos.push(p.x, p.y, p.z));
  const r = rep ?? Math.max(1, Math.round(len / (w * 1.6 * 32))); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(tex === GLYPHD ? [0, 0, 1, 0, 1, r, 0, r] : [0, 0, 0, 1, r, 1, r, 0], 2)); g.setIndex([0, 1, 2, 0, 2, 3]);
  const m = new THREE.Mesh(g, glowMat(tex, k)); m.renderOrder = 2; scene.add(m); return m;
}
function sigil(x, y, z, r, k, nrm = new THREE.Vector3(0, 0, 1)) { const m = new THREE.Mesh(new THREE.PlaneGeometry(r * 2.8, r * 2.8), glowMat(SIGIL, k)); m.position.set(x, y, z); m.lookAt(x + nrm.x, y + nrm.y, z + nrm.z); m.renderOrder = 2; scene.add(m); return m; }

// ── stone that has stood in the weather: moss on what faces up, dark streaks running down, and less of both inside ──
function weathered(m, o = {}) {
  const moss = o.moss ?? .8, streak = o.streak ?? .5, ao = o.ao || [0, 0, 0]; m.customProgramCacheKey = () => 'weathered' + moss + '|' + streak + '|' + ao.join(',');
  m.onBeforeCompile = s => { s.vertexShader = 'varying vec3 vW2; varying vec3 vN2;\n' + s.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\n vW2 = (modelMatrix * vec4(position,1.)).xyz; vN2 = normalize(mat3(modelMatrix) * normal);');
    s.fragmentShader = 'varying vec3 vW2; varying vec3 vN2;\nfloat wh(vec2 p){ p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }\nfloat wv(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f); return mix(mix(wh(i), wh(i + vec2(1,0)), f.x), mix(wh(i + vec2(0,1)), wh(i + vec2(1,1)), f.x), f.y); }\nfloat wf(vec2 p){ float a = 0., m = .5; for (int i = 0; i < 5; i++) { a += m * wv(p); p *= 2.07; m *= .5; } return a; }\n'
      + s.fragmentShader.replace('#include <map_fragment>', `#include <map_fragment>
        float n = wf(vW2.xz * .35 + vW2.y * .21), up = smoothstep(.25, .75, vN2.y + (n - .5) * .7);
        float st = smoothstep(.55, .85, wv(vec2(vW2.x * 1.3 + vW2.z * 1.3, vW2.y * .04))) * (.6 + .4 * wf(vW2.xy * .5));
        diffuseColor.rgb *= 1. - ${streak.toFixed(3)} * st * .55;
        diffuseColor.rgb *= 1. - ${(+ao[2]).toFixed(3)} * smoothstep(${(+ao[0]).toFixed(2)}, ${(+ao[1]).toFixed(2)}, vW2.z);
        vec3 mossC = mix(vec3(.16,.22,.07), vec3(.34,.40,.13), wf(vW2.xz * 1.7));
        diffuseColor.rgb = mix(diffuseColor.rgb, mossC, ${moss.toFixed(3)} * up * smoothstep(.35, .6, n + .15));`); };
  return m;
}

// ── a two-centred (pointed) arch: the legs rise straight to the springing, two arcs meet at the apex ──
// arch(S, ys, h): span S between the legs, springing at ys, apex h above it. off(d) gives the same arch offset inwards
// by d (the same centres, a smaller radius), which is how the orders of a recessed portal nest exactly.
function arch(S, ys, h) { const a = Math.max(0, (h * h - S * S / 4) / S), r = S / 2 + a; return { S, ys, a, r, off: d => ({ x: S / 2 - d, rr: r - d }) }; }
// points along the arch offset by d, from the left foot (y0) over the apex to the right foot, n per side on the arcs
function archPts(A, d, y0, n = 64) {
  const { x: hx, rr } = A.off(d), a = A.a, pts = []; const th1 = Math.atan2(Math.sqrt(Math.max(0, rr * rr - a * a)), -a);
  pts.push([-hx, y0]); for (let i = 0; i <= n; i++) { const t = Math.PI + (th1 - Math.PI) * i / n; pts.push([a + Math.cos(t) * rr, A.ys + Math.sin(t) * rr]); }
  for (let i = n; i >= 0; i--) { const t = Math.PI + (th1 - Math.PI) * i / n; pts.push([-(a + Math.cos(t) * rr), A.ys + Math.sin(t) * rr]); } pts.push([hx, y0]); return pts;
}
// resample a polyline at arc-length fractions
function along(pts) { const L = [0]; for (let i = 1; i < pts.length; i++) L.push(L[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1])); const T = L[L.length - 1];
  return { len: T, at: u => { const s = u * T; let i = 1; while (i < L.length - 1 && L[i] < s) i++; const t = (s - L[i - 1]) / (L[i] - L[i - 1] || 1); return [pts[i - 1][0] + (pts[i][0] - pts[i - 1][0]) * t, pts[i - 1][1] + (pts[i][1] - pts[i - 1][1]) * t]; } }; }
// one block: four corners in a plane (x, y), extruded from zf back to zb, shrunk a little for the joint
function block(out, q, zf, zb, gap = .05) {
  let c = q.reduce((s, p) => [s[0] + p[0] / 4, s[1] + p[1] / 4], [0, 0]); const sz = Math.max(...q.map(p => Math.hypot(p[0] - c[0], p[1] - c[1]))) || 1, k = 1 - gap / sz;
  let p = q.map(v => [c[0] + (v[0] - c[0]) * k, c[1] + (v[1] - c[1]) * k]); let ar = 0; for (let i = 0; i < 4; i++) { const j = (i + 1) % 4; ar += p[i][0] * p[j][1] - p[j][0] * p[i][1]; } if (ar < 0) p = p.reverse();
  const F = p.map(v => [v[0], v[1], zf]), B = p.map(v => [v[0], v[1], zb]), tri = (a, b, c2) => out.push(...a, ...b, ...c2);
  tri(F[0], F[1], F[2]); tri(F[0], F[2], F[3]); tri(B[0], B[2], B[1]); tri(B[0], B[3], B[2]);
  for (let i = 0; i < 4; i++) { const j = (i + 1) % 4; tri(F[i], B[i], B[j]); tri(F[i], B[j], F[j]); }
}
// the voussoirs of one order: two courses across its face, the joints staggered, each stone standing a little proud
function ringBlocks(out, A, d0, d1, zf, depth, y0, blockLen) {
  const inner = along(archPts(A, d1, y0)), outer = along(archPts(A, d0, y0)), mid = along(archPts(A, (d0 + d1) / 2, y0)); const n = Math.max(8, Math.round(inner.len / blockLen));
  for (const [lo, hi, sh] of [[inner, mid, 0], [mid, outer, .5]]) for (let i = -1; i < n; i++) { const u0 = Math.max(0, (i + sh) / n), u1 = Math.min(1, (i + 1 + sh) / n); if (u1 <= u0) continue;
    const pr = rnd() * .45, sk = (rnd() - .5) * .25; block(out, [lo.at(u0), lo.at(u1), hi.at(u1), hi.at(u0)], zf + pr, zf - depth + sk, .07); }
}
function geoFrom(arr) { const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(arr, 3)); g.computeVertexNormals(); return g; }

function fire(x, y, z, s = 1, light = true) {
  const c = document.createElement('canvas'); c.width = c.height = 64; const k = c.getContext('2d'), g = k.createRadialGradient(32, 40, 2, 32, 36, 30); g.addColorStop(0, 'rgba(255,240,200,1)'); g.addColorStop(.35, 'rgba(255,150,40,.9)'); g.addColorStop(1, 'rgba(255,60,0,0)'); k.fillStyle = g; k.fillRect(0, 0, 64, 64);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  for (let i = 0; i < 14; i++) { const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: t, color: new THREE.Color(2.4, 1.6, .9), blending: THREE.AdditiveBlending, depthWrite: false, transparent: true }));
    sp.position.set(x + (rnd() - .5) * .35 * s, y + .15 + rnd() * .7 * s, z + (rnd() - .5) * .35 * s); sp.scale.set(.55 * s * (1 - (sp.position.y - y) / (1.2 * s)), .9 * s, 1); scene.add(sp); }
  if (!light) return null; const L = new THREE.PointLight(new THREE.Color(1, .55, .22), 30 * s * s, 26 * s, 2); L.position.set(x, y + .7 * s, z); scene.add(L); return L;
}
function smoke(x, y, z, h) { const c = document.createElement('canvas'); c.width = c.height = 64; const k = c.getContext('2d'), g = k.createRadialGradient(32, 32, 2, 32, 32, 30); g.addColorStop(0, 'rgba(255,255,255,.55)'); g.addColorStop(1, 'rgba(255,255,255,0)'); k.fillStyle = g; k.fillRect(0, 0, 64, 64);
  const t = new THREE.CanvasTexture(c); for (let i = 0; i < 26; i++) { const f = i / 26, sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: t, color: new THREE.Color(.62, .6, .58), transparent: true, depthWrite: false, opacity: .22 * (1 - f) }));
    sp.position.set(x + Math.sin(f * 5) * f * 2.5 + f * 4, y + 1 + f * h, z + (rnd() - .5)); sp.scale.setScalar(1.5 + f * 10); scene.add(sp); } }

// people, for scale: the slice's genome bodies (people.js), the Markfolk palettes
const PEOPLE = [];
function person(x, y, z, ry, g, o) { PEOPLE.push([x, y, z, ry, g, o]); }
function addPeople() { return loadPack('mh/').then(() => { for (const [x, y, z, ry, g, o] of PEOPLE) { const p = makePerson(markGenome(rnd, g, o)); p.root.position.x = x; p.root.position.z = z; p.root.position.y += y; p.root.rotation.y = ry; scene.add(p.root); STATS.people = (STATS.people || 0) + 1; } })
  .catch(e => { window.__err = String(e); console.error(e); }); }

if (VIEW === 'gate') buildGate(); else buildHall();

function buildGate() {
  // a late, gold afternoon (OG-037): the sun low on the left, the valley's haze
  const SUN = new THREE.Vector3(-.66, .36, .66).normalize();
  scene.fog = new THREE.FogExp2(new THREE.Color(.70, .72, .78), .0011);
  skyDome(scene, SUN, { zen: [.10, .26, .62], mid: [.34, .54, .86], hor: [.92, .84, .72], glow: [1, .78, .5], glowK: .55, k: 1.1 });
  clouds(scene, SUN, { n: 30, d0: 1600, dw: 5000, y0: 420, lo: [.62, .64, .74], hi: [1.45, 1.30, 1.12], a0: -1.6, aw: 3.2 });
  const sun = new THREE.DirectionalLight(new THREE.Color(1, .80, .58), 3.4); sun.position.copy(SUN).multiplyScalar(320); sun.castShadow = true; sun.shadow.mapSize.set(4096, 4096);
  Object.assign(sun.shadow.camera, { left: -160, right: 160, top: 160, bottom: -160, near: 10, far: 900 }); sun.shadow.bias = -.0003; sun.shadow.normalBias = .12;
  scene.add(sun, sun.target, new THREE.HemisphereLight(new THREE.Color(.55, .64, .86), new THREE.Color(.30, .26, .18), 1.0));

  // the portal: one master arch, five orders inside it, each 6 m of face and 6.5 m deeper than the last
  const A = arch(76, 30, 70), FW = 6, D = 6.5, Z0 = 2.5, NO = 5;
  const ash = weathered(mat('ashlar', { ns: 1.0, rough: .9 }), { moss: .85, streak: .6, ao: [2, -34, .62] }); ash.color.setRGB(.88, .86, .81);
  { const out = []; for (let k = 0; k < NO; k++) ringBlocks(out, A, k * FW, (k + 1) * FW, Z0 - k * D, D + .4, -6, 4.2); const g = geoFrom(out); worldUV(g, .11);
    const m = new THREE.Mesh(g, ash); m.castShadow = m.receiveShadow = true; scene.add(m); STATS.portalBlocks = out.length / 108;
    // a roll moulding along each order's inner edge, the rounded ribs that make OG-037's arches read as bands
    for (let k = 0; k < NO; k++) { const P = archPts(A, (k + 1) * FW - .9, -6, 40).map(([x, y]) => new THREE.Vector3(x, y, Z0 - k * D + .2)); const tg = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(P, false, 'centripetal'), 260, 1.25, 10, false); worldUV(tg, .11);
      const t = new THREE.Mesh(tg, ash); t.castShadow = t.receiveShadow = true; scene.add(t); } }
  const ZB = Z0 - NO * D; // the back wall's face
  { const g = new THREE.BoxGeometry(60, 140, 8); g.translate(0, 64, ZB - 4); worldUV(g, .11); const m = new THREE.Mesh(g, ash); m.receiveShadow = true; scene.add(m); }
  // the spine: two pillars, the slit between them 4 m wide and 24 m to its point, one mass above; script up both pillars,
  // two ring sigils over the door
  const SZ = Z0 - 1.6 * D, SW = 4, PW = 6.2, SH = 24;
  { const out = [], q = (x0, x1, y0, y1) => [[x0, y0], [x1, y0], [x1, y1], [x0, y1]];
    for (const s of [-1, 1]) for (let y = -2, i = 0; y < 104; i++) { const hgt = 3.2 + rnd() * 1.6, x0 = s * SW / 2, x1 = s * (SW / 2 + PW); block(out, q(Math.min(x0, x1), Math.max(x0, x1), y, y + hgt), SZ + (rnd() * .3), ZB, .08); y += hgt; }
    // above the slit the pillars close: a pointed head, then courses running across
    const head = [[-SW / 2, SH - 4], [SW / 2, SH - 4], [0, SH]]; for (let y = SH - 4, i = 0; y < 104; i++) { const hgt = 3 + rnd() * 1.4; block(out, q(-SW / 2 - .05, SW / 2 + .05, Math.max(y, SH - 4), y + hgt), SZ + .1, ZB, .06); y += hgt; }
    const g = geoFrom(out); worldUV(g, .11); const sp = new THREE.Mesh(g, weathered(mat('ashlar', { ns: 1.3, rough: .88 }), { moss: .45, streak: .8 })); sp.material.color.setRGB(.82, .8, .76); sp.castShadow = sp.receiveShadow = true; scene.add(sp);
    // the slit cut back out: a dark pointed void, amber far inside
    const sh = new THREE.Shape([new THREE.Vector2(-SW / 2, -1), new THREE.Vector2(SW / 2, -1), new THREE.Vector2(SW / 2, SH - 4), new THREE.Vector2(0, SH), new THREE.Vector2(-SW / 2, SH - 4)]);
    const vg = new THREE.ShapeGeometry(sh); const void_ = new THREE.Mesh(vg, new THREE.MeshBasicMaterial({ color: 0x050403 })); void_.position.z = SZ + .5; scene.add(void_);
    { const c = document.createElement('canvas'); c.width = 8; c.height = 128; const k = c.getContext('2d'), gr = k.createLinearGradient(0, 128, 0, 0); gr.addColorStop(0, 'rgba(255,160,70,.9)'); gr.addColorStop(.35, 'rgba(255,120,40,.25)'); gr.addColorStop(1, 'rgba(255,100,30,0)'); k.fillStyle = gr; k.fillRect(0, 0, 8, 128);
      const deep = new THREE.Mesh(new THREE.PlaneGeometry(SW * .7, SH * .7), new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(c), color: AMBER.clone().multiplyScalar(.5), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false })); deep.position.set(0, SH * .35 - 1, SZ + .52); scene.add(deep); }
    for (const s of [-1, 1]) { strip(new THREE.Vector3(s * (SW / 2 + PW / 2), 3, SZ + .55), new THREE.Vector3(s * (SW / 2 + PW / 2), 96, SZ + .55), 1.3, new THREE.Vector3(0, 0, 1), GLYPHD, 2.4);
      strip(new THREE.Vector3(s * (SW / 2 + 1.0), 30, SZ + .55), new THREE.Vector3(s * (SW / 2 + 1.0), 88, SZ + .55), .7, new THREE.Vector3(0, 0, 1), GLYPHD, 1.2); }
    sigil(0, 33, SZ + .6, 3.6, 2.6); sigil(0, 49, SZ + .6, 2.6, 1.8);
    const L = new THREE.PointLight(AMBER, 900, 60, 2); L.position.set(0, 10, SZ + 6); scene.add(L);
    // three broad steps up to the threshold
    for (let i = 0; i < 3; i++) { const g = new THREE.BoxGeometry(16 - i * 2, .5, 3); g.translate(0, .25 + i * .5 - .2, SZ + 9 - i * 2.4); worldUV(g, .25); const st = new THREE.Mesh(g, ash); st.castShadow = st.receiveShadow = true; scene.add(st); } }
  // script on the legs of the second and fourth orders
  for (const k of [1, 3]) { const { x } = A.off(k * FW + FW / 2); for (const s of [-1, 1]) strip(new THREE.Vector3(s * x, 2, Z0 - k * D + .5), new THREE.Vector3(s * x, A.ys + 6, Z0 - k * D + .5), 1.0, new THREE.Vector3(0, 0, 1), GLYPHD, 1.2); }

  // the mountain's face, a cliff of grey rock leaning back, with the portal's opening cut through it
  const opening = (() => { const P = archPts(A, -.8, -10, 96); return (x, y) => { let c = false; for (let i = 0, j = P.length - 1; i < P.length; j = i++) { const [xi, yi] = P[i], [xj, yj] = P[j]; if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) c = !c; } return c; }; })();
  const topY = x => 150 + 26 * fbm(x / 60, 3.1, 3) - Math.max(0, -x - 60) * .55 - Math.max(0, x - 180) * .5;
  const rockZ = (x, y) => 1.2 + 5 * fbm(x / 22, y / 22, 4) + 1.6 * fbm(x / 6, y / 6, 3) + 1.4 * sstep(.2, .8, ((y + 7 * fbm(x / 40, 1.7, 2)) / 11) % 1) - .28 * Math.max(0, y - 95) - .06 * Math.abs(x) * sstep(40, 120, Math.abs(x)) - 3 * sstep(60, 10, Math.hypot(x, y - 50) - 40);
  { const step = 1.8, nx = Math.ceil(740 / step) + 1, ny = Math.ceil(193 / step) + 1, pos = new Float32Array(nx * ny * 3), idx = [];
    for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) { const x = -360 + i * step, y = -8 + j * step, k = (j * nx + i) * 3; pos[k] = x; pos[k + 1] = y; pos[k + 2] = rockZ(x, y); }
    for (let j = 0; j < ny - 1; j++) for (let i = 0; i < nx - 1; i++) { const cx = -360 + (i + .5) * step, cy = -8 + (j + .5) * step; if (opening(cx, cy) || cy > topY(cx)) continue; const a = j * nx + i, b = a + 1, c = a + nx + 1, d = a + nx; idx.push(a, b, c, a, c, d); }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals(); worldUV(g, .02);
    const rm = weathered(mat('rock', { ns: 1.2, rough: .95 }), { moss: 1.0, streak: .9 }); rm.color.setRGB(1.08, 1.05, .98); const m = new THREE.Mesh(g, rm); m.castShadow = m.receiveShadow = true; scene.add(m); }

  // the ground: a meadow rising gently to the gate; behind the cliff a plateau; inside the portal the floor stays down
  const gy = (x, z) => { const meadow = -.035 * z + 1.4 * fbm(x / 30, z / 30, 4) + 4 * sstep(70, 200, Math.abs(x)) * fbm(x / 50, z / 50, 3) - 26 * sstep(-40, -160, x) * sstep(-20, 120, z);
    const inPortal = (1 - sstep(36, 46, Math.abs(x))) * sstep(-48, -40, z); const plateau = (150 + 30 * fbm(x / 80, z / 80, 3)) * sstep(-4, -40, z) * (1 - inPortal); return Math.max(meadow, plateau); };
  { const g = new THREE.PlaneGeometry(1600, 1600, 400, 400); g.rotateX(-Math.PI / 2); const P = g.attributes.position; for (let i = 0; i < P.count; i++) { const x = P.getX(i), z = P.getZ(i) + 300; P.setXYZ(i, x, gy(x, z), z); } g.computeVertexNormals();
    const m = new THREE.MeshStandardMaterial({ roughness: .95 }); m.customProgramCacheKey = () => 'gateGround';
    m.onBeforeCompile = s => { s.vertexShader = 'varying vec3 vW; varying vec3 vNw;\n' + s.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\n vW = (modelMatrix * vec4(position,1.)).xyz; vNw = normal;');
      s.fragmentShader = 'varying vec3 vW; varying vec3 vNw;\nfloat h1(vec2 p){ p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }\nfloat v1(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f); return mix(mix(h1(i), h1(i + vec2(1,0)), f.x), mix(h1(i + vec2(0,1)), h1(i + vec2(1,1)), f.x), f.y); }\nfloat f1(vec2 p){ float a = 0., m = .5; for (int i = 0; i < 5; i++) { a += m * v1(p); p *= 2.03; m *= .5; } return a; }\n'
        + s.fragmentShader.replace('vec4 diffuseColor = vec4( diffuse, opacity );', `float n1 = f1(vW.xz / 9.), n2 = f1(vW.xz * 1.3); vec3 c = mix(vec3(.20,.31,.09), vec3(.42,.47,.16), n1) * (.82 + .3 * n2);
          float rock = smoothstep(.42, .66, 1. - vNw.y + (n1 - .5) * .3); c = mix(c, mix(vec3(.38,.36,.32), vec3(.52,.5,.45), n2), rock);
          float path = (1. - smoothstep(1.6, 2.6, abs(vW.x - 3. + sin(vW.z * .05) * 3.))) * step(-26., vW.z) * step(vW.z, 140.); c = mix(c, mix(vec3(.42,.36,.27), vec3(.52,.46,.34), n2), path * .92);
          float camp = 1. - smoothstep(16., 26., length(vW.xz - vec2(0., 22.))); c = mix(c, vec3(.36,.33,.22) * (.8 + .3 * n2), camp * .55);
          vec4 diffuseColor = vec4(c, opacity);`); };
    const t = new THREE.Mesh(g, m); t.receiveShadow = true; scene.add(t); }

  // the camp before the door: four tents, the Crown's banners, a fire and its smoke, crates
  const canvasM = new THREE.MeshStandardMaterial({ color: new THREE.Color(.74, .66, .52), roughness: 1, side: THREE.DoubleSide });
  const tent = (x, z, ry, s = 1) => { const sh = new THREE.Shape([new THREE.Vector2(-2.2, 0), new THREE.Vector2(2.2, 0), new THREE.Vector2(.0, 3.0)]); const g = new THREE.ExtrudeGeometry(sh, { depth: 4.5, bevelEnabled: false }); g.translate(0, 0, -2.25);
    const m = new THREE.Mesh(g, canvasM); m.position.set(x, gy(x, z) - .05, z); m.rotation.y = ry; m.scale.setScalar(s); m.castShadow = m.receiveShadow = true; scene.add(m); };
  tent(-14, 20, .3); tent(-8, 30, -.2, .9); tent(15, 24, -.4); tent(21, 15, .5, .85);
  const banner = (x, z) => { const y = gy(x, z); const pole = new THREE.Mesh(new THREE.CylinderGeometry(.07, .09, 8, 8), mat('wood')); pole.position.set(x, y + 4, z); pole.castShadow = true; scene.add(pole);
    const cv = document.createElement('canvas'); cv.width = 64; cv.height = 128; const k = cv.getContext('2d'); k.fillStyle = '#8e1a14'; k.fillRect(0, 0, 64, 128); k.fillStyle = '#d9a63a'; k.beginPath(); k.arc(32, 44, 17, 0, 7); k.fill(); k.fillRect(0, 112, 64, 8); const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace;
    const fg = new THREE.PlaneGeometry(1.4, 2.8, 6, 10); { const a = fg.attributes.position; for (let i = 0; i < a.count; i++) a.setZ(i, Math.sin(a.getY(i) * 3 + a.getX(i) * 4) * .06); fg.computeVertexNormals(); }
    const f = new THREE.Mesh(fg, new THREE.MeshStandardMaterial({ map: t, side: THREE.DoubleSide, roughness: .85 })); f.position.set(x + .72, y + 6.4, z); f.castShadow = true; scene.add(f); };
  banner(-19, 12); banner(11, 9); banner(26, 22);
  const fx = 2.5, fz = 20, fy = gy(fx, fz); fire(fx, fy, fz, 1.3); smoke(fx, fy, fz, 34);
  for (const [x, z] of [[-10, 14], [-9.2, 14.6], [17, 31], [9, 33]]) { const b = new THREE.BoxGeometry(.8, .8, .8); worldUV(b, 1.2); const m = new THREE.Mesh(b, mat('wood')); m.position.set(x, gy(x, z) + .4, z); m.rotation.y = rnd(); m.castShadow = true; scene.add(m); }
  // a dry-stone wall along the path, as OG-037 has it
  { const out = []; for (let z = 140; z > 40; z -= 1.1 + rnd() * .5) { const x = -2.5 + Math.sin(z * .05) * -3 - 2.2, y = gy(x, z); for (let r = 0; r < 2; r++) block(out, [[x - .45, y + r * .45], [x + .45, y + r * .45], [x + .45, y + r * .45 + .42], [x - .45, y + r * .45 + .42]], z + .5 + rnd() * .2, z - .6, .04); }
    const g = geoFrom(out); worldUV(g, .6); const m = new THREE.Mesh(g, weathered(mat('lichen', { ns: 1.4 }), { moss: .9 })); m.castShadow = m.receiveShadow = true; scene.add(m); }
  // people: the camp's, and one walking up the path toward the door
  person(-5, gy(-5, 24), 24, .8, 1); person(-3.6, gy(-3.6, 25.4), 25.4, -2.4, 0); person(5.5, gy(5.5, 18), 18, -1.3, 1, { mantle: false }); person(13, gy(13, 21), 21, -.4, 1);
  person(-1, gy(-1, 12), 12, 3.0, 1, { mantle: false }); person(1, gy(1, 12.3), 12.3, 3.3, 0);
  const pz = CAM === 'foot' ? 30 : 96, wx = CAM === 'foot' ? -.4 : 2.2; person(wx, gy(wx, pz), pz, Math.PI + .1, 1);
  // grass where the eye is, trees on the ledges and the hillsides
  { const seg = 3, posA = [], colA = [], idx = []; for (let k = 0; k <= seg; k++) { const t = k / seg, w = .06 * (1 - t); posA.push(-w, t, 0, w, t, 0); const c = [.07 + .3 * t, .14 + .36 * t, .04 + .1 * t]; colA.push(...c, ...c); } for (let k = 0; k < seg; k++) { const a = k * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
    const bg = new THREE.BufferGeometry(); bg.setAttribute('position', new THREE.Float32BufferAttribute(posA, 3)); bg.setAttribute('color', new THREE.Float32BufferAttribute(colA, 3)); bg.setAttribute('normal', new THREE.Float32BufferAttribute(new Array(posA.length / 3).fill(0).flatMap(() => [0, 1, 0]), 3)); bg.setIndex(idx);
    const gm = new THREE.MeshStandardMaterial({ vertexColors: true, side: THREE.DoubleSide, roughness: .8 }); gm.onBeforeCompile = s => { s.uniforms.uWind = WIND; s.vertexShader = 'uniform float uWind;\n' + s.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>' + windVS(.18, 1.4)); };
    const cz = CAM === 'foot' ? 42 : 114, N = 140000, gr = new THREE.InstancedMesh(bg, gm, N), Mx = new THREE.Matrix4(), q = new THREE.Quaternion(), s = new THREE.Vector3(), p = new THREE.Vector3(), up = new THREE.Vector3(0, 1, 0); let n = 0;
    while (n < N) { const r = 1.5 + Math.pow(rnd(), 1.6) * 80, a = -Math.PI / 2 + (rnd() - .5) * 2.6, x = 4 + Math.cos(a) * r * 1.6, z = cz + Math.sin(a) * r; if (Math.abs(x - 3 + Math.sin(z * .05) * 3) < 2.2 && z > -26) continue; if (Math.hypot(x, z - 22) < 18 || z < 4) continue;
      p.set(x, gy(x, z) - .02, z); q.setFromAxisAngle(up, rnd() * 6.3); s.set(1.2, .22 + rnd() * .4, 1); Mx.compose(p, q, s); gr.setMatrixAt(n++, Mx); }
    gr.receiveShadow = true; scene.add(gr); }
  const trees = treeKit(SUN), tl = []; for (let i = 0; i < 520; i++) { const x = (rnd() - .5) * 700, z = 260 - rnd() * 700; const y = gy(x, z);
    if (Math.abs(x) < 60 && z > -60 && z < 150) continue; if (y > 120 && rnd() < .4) continue; tl.push([x, y, z, 1.1 + rnd() * .8, rnd() * 6.3, new THREE.Color(.72 + .15 * rnd(), .84 + .1 * rnd(), .55)]); }
  for (let i = 0; i < 22; i++) { const x = (rnd() - .5) * 240, y = 40 + rnd() * 100; if (opening(x, y) || y > topY(x) - 4) continue; tl.push([x, y - 1.5, rockZ(x, y) + 1.2, .5 + rnd() * .4, rnd() * 6.3]); }
  tl.push([-40, gy(-40, 60), 60, 1.6, 1], [44, gy(44, 70), 70, 1.5, 2], [-30, gy(-30, 110), 110, 1.4, 0]); trees.plant(scene, tl);

  if (CAM === 'foot') { cam.position.set(-6, gy(-6, 40) + 1.7, 40); cam.lookAt(0, 34, -10); }
  else { cam.position.set(4, gy(4, 112) + 1.7, 112); cam.lookAt(-3, 42, 0); }
  const comp = makeComposer(R, scene, cam, { bloom: .38, bloomR: .45, bloomT: .82, warm: [1.07, .99, .9], cool: [.92, .97, 1.07], sat: 1.06, vig: .34 });
  addPeople().then(() => run(comp, cam));
}

function buildHall() {
  scene.background = new THREE.Color(.006, .008, .012); scene.fog = new THREE.FogExp2(new THREE.Color(.02, .028, .04), .0042);
  const ash = mat('ashlar', { ns: 1.3, rough: .82 }); ash.color.setRGB(.52, .53, .58); weathered(ash, { moss: .12, streak: .9 });
  const NB = 18, BAY = 14, HW = 13, PT = 4, Z0 = 0, ZE = Z0 - NB * BAY, RISE = 4.2, SZ = -84;
  // the floor: great dark slabs, polished where the wet lies; it takes the hall's light from a probe made once
  const fm = mat('slab', { ns: .3, rough: .3 }); fm.color.setRGB(.9, .9, .95); fm.customProgramCacheKey = () => 'wetSlab';
  fm.onBeforeCompile = s => { s.vertexShader = 'varying vec3 vW;\n' + s.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\n vW = (modelMatrix * vec4(position,1.)).xyz;');
    s.fragmentShader = 'varying vec3 vW;\nfloat h1(vec2 p){ p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }\nfloat v1(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f); return mix(mix(h1(i), h1(i + vec2(1,0)), f.x), mix(h1(i + vec2(0,1)), h1(i + vec2(1,1)), f.x), f.y); }\n'
      + s.fragmentShader.replace('#include <roughnessmap_fragment>', '#include <roughnessmap_fragment>\n float wet = smoothstep(.45, .6, v1(vW.xz * .12) * .6 + v1(vW.xz * .7) * .4); roughnessFactor = mix(roughnessFactor, .03, wet);')
        .replace('#include <map_fragment>', '#include <map_fragment>\n diffuseColor.rgb *= mix(1., .55, smoothstep(.45, .6, v1(vW.xz * .12) * .6 + v1(vW.xz * .7) * .4));'); };
  const floors = [];
  for (const [z0, z1, y] of [[Z0 + 14, SZ, 0], [SZ - 11, ZE - 6, RISE]]) { const g = new THREE.PlaneGeometry(2 * HW + 30, z0 - z1, 1, 1); g.rotateX(-Math.PI / 2); g.translate(0, y, (z0 + z1) / 2); worldUV(g, .1); const m = new THREE.Mesh(g, fm); m.receiveShadow = true; scene.add(m); floors.push(m); }
  // the stair: twelve risers across the whole hall
  { const steps = []; for (let i = 0; i < 12; i++) { const y = (i + 1) * RISE / 12, z = SZ - i * .92, g2 = new THREE.BoxGeometry(2 * HW + 30, y, .92); g2.translate(0, y / 2, z - .46); steps.push(g2); }
    const g = mergeGeometries(steps); worldUV(g, .25); const m = new THREE.Mesh(g, ash); m.castShadow = m.receiveShadow = true; scene.add(m); }
  const fY = z => z < SZ - 11 ? RISE : 0;
  // the arcades: each side one wall of piers with a pointed opening in every bay onto a dark aisle
  const AR = arch(BAY - PT, 17, 9); const out = [];
  for (const sx of [-1, 1]) { const sh = new THREE.Shape([new THREE.Vector2(Z0 + 10, -1), new THREE.Vector2(ZE - 6, -1), new THREE.Vector2(ZE - 6, 34), new THREE.Vector2(Z0 + 10, 34)]);
    for (let b = 0; b < NB; b++) { const zc = Z0 - b * BAY - BAY / 2, y0 = fY(zc); const P = archPts(AR, 0, -1 + y0, 24).map(([x, y]) => new THREE.Vector2(zc + x, y + y0)); sh.holes.push(new THREE.Path(P.reverse())); }
    const g = new THREE.ExtrudeGeometry(sh, { depth: PT, bevelEnabled: false, curveSegments: 6 }); g.rotateY(-Math.PI / 2); g.translate(sx > 0 ? HW + PT : -HW, 0, 0); worldUV(g, .1);
    const m = new THREE.Mesh(g, ash); m.castShadow = m.receiveShadow = true; scene.add(m);
    // the aisle beyond: an outer wall and a low dark ceiling
    const ow = new THREE.BoxGeometry(2, 30, Z0 - ZE + 20); ow.translate(sx * (HW + PT + 12), 15, (Z0 + ZE) / 2); worldUV(ow, .1); scene.add(new THREE.Mesh(ow, ash));
    const ce = new THREE.BoxGeometry(14, 1, Z0 - ZE + 20); ce.translate(sx * (HW + PT + 6), 30, (Z0 + ZE) / 2); worldUV(ce, .1); scene.add(new THREE.Mesh(ce, ash)); }
  // shafts on the piers' nave faces, rising to the vault; the transverse arches; the vault itself
  const VA = arch(2 * HW, 34, 18);
  for (let b = 0; b <= NB; b++) { const z = Z0 - b * BAY, y0 = fY(z + 2); for (const sx of [-1, 1]) {
      const g = new THREE.BoxGeometry(2.2, 35 - y0 + 1, 3.2); g.translate(sx * (HW - 1.1), (35 + y0 - 1) / 2, z); out.push(...g.toNonIndexed().attributes.position.array);
      const cp = new THREE.BoxGeometry(3.2, 1.2, 4.2); cp.translate(sx * (HW - 1.4), 34.2, z); out.push(...cp.toNonIndexed().attributes.position.array); }
    const rb = []; ringBlocks(rb, VA, -2.2, 0, 0, 3.2, 34, 3.6); for (let i = 0; i < rb.length; i += 3) { rb[i + 2] += z + 1.6; } out.push(...rb); }
  { const g = geoFrom(out); worldUV(g, .1); const m = new THREE.Mesh(g, ash); m.castShadow = m.receiveShadow = true; scene.add(m); }
  { const P = archPts(VA, -2.2, 34, 48), pos = []; for (let i = 0; i < P.length - 1; i++) { const [x0, y0] = P[i], [x1, y1] = P[i + 1]; for (const [za, zb] of [[Z0 + 10, ZE - 6]]) pos.push(x0, y0, za, x1, y1, za, x1, y1, zb, x0, y0, za, x1, y1, zb, x0, y0, zb); }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.computeVertexNormals(); worldUV(g, .1); const vm = ash.clone(); vm.side = THREE.DoubleSide; const m = new THREE.Mesh(g, vm); m.receiveShadow = true; scene.add(m); }
  // the script up every pier, the ring sigils at two heights; a few gutter (a failing gate flickers), the far ones dim
  const lights = [];
  for (let b = 0; b <= NB; b++) { const z = Z0 - b * BAY, y0 = fY(z + 2), fade = 1 - b / (NB + 4), weak = (b === 5 || b === 11) ? .25 : 1; for (const sx of [-1, 1]) { const x = sx * (HW - 2.21);
      strip(new THREE.Vector3(x, y0 + 2.5, z), new THREE.Vector3(x, 31, z), .9, new THREE.Vector3(-sx, 0, 0), GLYPHD, 2.4 * fade * weak);
      sigil(x, y0 + 9, z, 1.0, 2.2 * fade * weak, new THREE.Vector3(-sx, 0, 0)); if (b % 2 === 0) sigil(x, 24, z, .8, 1.6 * fade * weak, new THREE.Vector3(-sx, 0, 0)); }
    if (b % 2 === 0 && b < NB) { const L = new THREE.PointLight(AMBER, 260 * weak, 34, 2); L.position.set(0, y0 + 9, z - 1); scene.add(L); lights.push(L);
      const U = new THREE.PointLight(AMBER, 420 * weak * fade, 44, 2); U.position.set(0, 40, z - 7); scene.add(U); } }
  // the far end: a wall, and in it a ring of the old stone forty metres high with its script, dark at the heart
  { const g = new THREE.BoxGeometry(2 * HW + 40, 70, 4); g.translate(0, 30, ZE - 8); worldUV(g, .1); scene.add(new THREE.Mesh(g, ash));
    const RA = arch(30, 22, 15), rb = []; ringBlocks(rb, RA, -3.2, 0, ZE - 5.6, 2.4, RISE - 1, 3.4); const rg = geoFrom(rb); worldUV(rg, .1); const rm = new THREE.Mesh(rg, ash); rm.castShadow = rm.receiveShadow = true; scene.add(rm);
    const P = archPts(RA, 0, RISE, 48).map(([x, y]) => new THREE.Vector2(x, y)); const dg = new THREE.ShapeGeometry(new THREE.Shape(P)); const dm = new THREE.Mesh(dg, new THREE.MeshBasicMaterial({ color: 0x020203 })); dm.position.z = ZE - 5.9; scene.add(dm);
    sigil(0, RISE + 20, ZE - 5.5, 6.5, 2.0); const P2 = archPts(RA, -1.6, RISE, 48); for (let i = 0; i < P2.length - 1; i += 4) { const a = P2[i], c = P2[Math.min(P2.length - 1, i + 4)]; strip(new THREE.Vector3(a[0], a[1], ZE - 3.1), new THREE.Vector3(c[0], c[1], ZE - 3.1), .8, new THREE.Vector3(0, 0, 1), GLYPH, 1.4, 1); }
    const L = new THREE.PointLight(AMBER, 500, 60, 2); L.position.set(0, RISE + 14, ZE + 4); scene.add(L); }
  // a shaft of cold light from a cleft in the vault, dust in it
  const LZ = -150, LY = fY(LZ);
  { const sp = new THREE.SpotLight(new THREE.Color(.62, .76, 1), 26000, 90, .16, .5, 1.6); sp.position.set(4, 60, LZ - 6); sp.target.position.set(0, LY, LZ); sp.castShadow = true; sp.shadow.mapSize.set(2048, 2048); sp.shadow.bias = -.0005; scene.add(sp, sp.target);
    const cg = new THREE.CylinderGeometry(2.4, 6.5, 56, 32, 1, true); cg.translate(0, 28, 0); const cm = new THREE.ShaderMaterial({ transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, uniforms: { uC: { value: new THREE.Color(.45, .58, .85) } },
      vertexShader: 'varying vec3 vN; varying vec3 vV; varying float vY; void main(){ vec4 w = modelMatrix * vec4(position,1.); vN = normalize(mat3(modelMatrix) * normal); vV = normalize(cameraPosition - w.xyz); vY = position.y; gl_Position = projectionMatrix * viewMatrix * w; }',
      fragmentShader: 'uniform vec3 uC; varying vec3 vN; varying vec3 vV; varying float vY; void main(){ float f = pow(abs(dot(normalize(vN), normalize(vV))), 2.); float h = smoothstep(0., 8., vY) * smoothstep(56., 30., vY); gl_FragColor = vec4(uC * f * h * .3, 1.); }' });
    const cone = new THREE.Mesh(cg, cm); cone.position.set(1.6, LY, LZ - 2.6); cone.rotation.x = -.1; scene.add(cone);
    const N = 900, g = new THREE.BufferGeometry(), a = []; for (let i = 0; i < N; i++) { const y = rnd() * 40, r = (2.4 + y * .07) * Math.sqrt(rnd()), th = rnd() * 6.3; a.push(Math.cos(th) * r + 1.6, LY + y + .3, LZ - 2.6 + Math.sin(th) * r - y * .1); } g.setAttribute('position', new THREE.Float32BufferAttribute(a, 3));
    scene.add(new THREE.Points(g, new THREE.PointsMaterial({ color: new THREE.Color(.9, 1.0, 1.2), size: .06, transparent: true, opacity: .8, blending: THREE.AdditiveBlending, depthWrite: false }))); }
  // great braziers at the foot of the stair, and the carried torch
  for (const sx of [-1, 1]) { const bx = sx * 8, bz = SZ + 6; const bowl = new THREE.Mesh(new THREE.CylinderGeometry(1.3, .7, 1.0, 20, 1, true), new THREE.MeshStandardMaterial({ color: 0x1a1612, metalness: .6, roughness: .5, side: THREE.DoubleSide })); bowl.position.set(bx, 3.0, bz); scene.add(bowl);
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(.18, .3, 2.6, 8), bowl.material); leg.position.set(bx, 1.3, bz); scene.add(leg); fire(bx, 3.1, bz, 1.6); }
  const tl = new THREE.PointLight(new THREE.Color(1, .6, .3), 30, 18, 2); tl.position.set(-.8, 1.6, 4.4); tl.castShadow = true; tl.shadow.mapSize.set(1024, 1024); tl.shadow.bias = -.003; scene.add(tl);
  scene.add(new THREE.HemisphereLight(new THREE.Color(.16, .2, .3), new THREE.Color(.04, .03, .02), .35));
  // people for scale: two in the nave, one on the stair, one at the far ring
  person(-3, 0, -22, Math.PI + .2, 1); person(-1.6, 0, -23.5, Math.PI - .3, 0, { mantle: false }); person(5, 0, SZ + 2, Math.PI, 1); person(2, RISE, -200, Math.PI, 1, { mantle: false });
  cam.position.set(1.5, 1.7, 9); cam.lookAt(0, 10, -120);
  // the floor's reflections: one probe of the finished hall, from the middle of the nave
  const cube = new THREE.CubeCamera(.5, 600, new THREE.WebGLCubeRenderTarget(256, { type: THREE.HalfFloatType })); cube.position.set(0, -1.7, -40); scene.add(cube);
  const comp = makeComposer(R, scene, cam, { bloom: .85, bloomR: .55, bloomT: .5, cool: [.86, .95, 1.14], warm: [1.08, .97, .86], sat: 1.0, vig: .55 });
  addPeople().then(() => { floors.forEach(f => f.visible = false); cube.update(R, scene); floors.forEach(f => { f.visible = true; f.material.envMap = cube.renderTarget.texture; f.material.envMapIntensity = 1.4; f.material.needsUpdate = true; }); run(comp, cam); });
}
