// The six schools' great gates, outside (card F5; OG-105 = OG-U2-009, OG-037, OG-119, OG-145; the concept artist, 14 Oct 2026).
// One skeleton, the gate slice's (gate.js, Session 771): five stepped pointed orders cut into a mountainside, the outer arch
// 100 m high and 76 m across, each order 6 m of face and 6.5 m deeper than the last, a roll moulding on each inner edge, a spine
// of two pillars burning with script and a slit door 4 m wide and 24 m to its point. SCHOOL dresses it, by OG-105's six panels:
//   tine   in a volcanic range: basalt, columnar spires, magma in the ground and down the cliff, an ember sky;
//   uisce  half-sunk in a fjord behind falls: the lowest 12 m of the orders under water, a causeway on arches to the door;
//   cloch  hewn into snow peaks: snow on all that faces up, a titanic stair 34 m wide rising 16 m, two helmed colossi 51 m high;
//   scath  half-ruined on a black coast under an eclipse: the outer orders broken at the crown, fallen blocks, a black sea;
//   solas  on a sunlit plateau with falls: gold stone, two hooded colossi 51 m high, white-gold script;
//   gaoth  among cliffs and floating spires: the land ends in air on both sides, rock spires with towers hang around the gate.
// Every measure is in metres beside the slice's genome people (1.6 to 1.9 m). ?school=tine|uisce|cloch|scath|solas|gaoth,
// &cam=far (the whole, 112 m out) | foot (at the camp, 40 m out) | scale (beside the door, a person at the steps) | wide (300 m out).
// For the builder: dressGate(S) returns { group, tris, base (the threshold's y), door (z of the slit) }; the dress table SCHOOL
// is every number that differs, and the skeleton is gate.js's own arch(), archPts(), ringBlocks() with a keep() for the ruin.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { Q, W, H, STATS, STILL, rnd, fbm, sstep, makeRenderer, makeComposer, buildTextures, TEX, texPair, mat, worldUV, skyDome, clouds, puffTex, treeKit, run, WIND, windVS } from './common.js';
import { loadPack, makePerson, markGenome } from './people.js';

// ── the dress: what each school changes, and nothing else ──
export const SCHOOL = {
  tine: { name: 'Tine, the gate of fire', sun: [-.5, .2, .6], fog: [.30, .17, .12], fogD: .0016, exp: .95,
    sky: { zen: [.10, .06, .07], mid: [.30, .12, .08], hor: [.72, .32, .14], glow: [1, .42, .12], glowK: .9, k: 1 }, cloud: { lo: [.16, .10, .09], hi: [.55, .30, .20], n: 26, op: .85 },
    key: [1, .55, .32], keyK: 2.2, hemi: [[.40, .26, .22], [.30, .12, .06], .7], glow: [1.0, .34, .10], stone: [.30, .28, .28], cover: [.04, .035, .035], coverK: .5, streak: .9,
    rock: [.17, .16, .16], ground: { a: [.07, .06, .06], b: [.16, .13, .12], rock: [.20, .18, .17], path: [.24, .20, .17] }, lava: 1, grass: 0, trees: 0, spires: 'basalt', smoke: 3 },
  uisce: { name: 'Uisce, the gate of water', sun: [.55, .32, .55], fog: [.52, .62, .68], fogD: .0014, exp: .92, lift: -12, sea: 0,
    sky: { zen: [.12, .24, .42], mid: [.34, .48, .62], hor: [.70, .78, .82], glow: [.9, .9, .85], glowK: .3, k: 1.05 }, cloud: { lo: [.46, .52, .60], hi: [1.1, 1.12, 1.14], n: 34, op: .92 },
    key: [.86, .90, 1], keyK: 2.4, hemi: [[.50, .60, .74], [.16, .22, .24], 1.1], glow: [.30, .72, 1.0], stone: [.58, .64, .66], cover: [.12, .22, .16], coverK: .9, streak: 1,
    rock: [.58, .62, .62], ground: { a: [.14, .22, .10], b: [.26, .34, .14], rock: [.30, .32, .32], path: [.30, .30, .28] }, grass: 0, trees: 260, tint: [.45, .62, .42], falls: [-74, 70], fjord: 1, bridge: 1 },
  cloch: { name: 'Cloch, the gate of stone', sun: [-.62, .34, .62], fog: [.80, .84, .90], fogD: .0012, exp: .86, lift: 16,
    sky: { zen: [.12, .26, .56], mid: [.42, .58, .82], hor: [.86, .88, .92], glow: [1, .9, .76], glowK: .4, k: 1.1 }, cloud: { lo: [.62, .66, .76], hi: [1.4, 1.36, 1.3], n: 26 },
    key: [1, .92, .82], keyK: 3.0, hemi: [[.62, .70, .90], [.40, .40, .44], 1.0], glow: [1.0, .66, .30], stone: [.70, .66, .60], cover: [.94, .96, 1.0], coverK: 1.2, streak: .5,
    rock: [.62, .60, .58], ground: { a: [.74, .76, .80], b: [.84, .85, .88], rock: [.36, .35, .34], path: [.56, .52, .46] }, snow: 1, grass: 0, trees: 0, statues: 'colossus', stair: 1 },
  scath: { name: 'Scáth, the gate of shadow', sun: [.45, .5, .75], fog: [.20, .17, .26], fogD: .0012, exp: 1.25, sea: -6,
    sky: { zen: [.03, .02, .06], mid: [.10, .06, .16], hor: [.30, .20, .34], glow: [.70, .52, 1], glowK: .25, k: 1 }, cloud: { lo: [.06, .05, .09], hi: [.30, .24, .40], n: 22, op: .8 },
    key: [.70, .62, .95], keyK: 1.9, hemi: [[.42, .36, .62], [.12, .10, .16], 1.1], glow: [.70, .34, 1.0], stone: [.40, .38, .44], cover: [.12, .12, .15], coverK: .4, streak: .9,
    rock: [.30, .29, .33], ground: { a: [.05, .05, .06], b: [.12, .11, .13], rock: [.16, .15, .17], path: [.20, .18, .20] }, grass: 30000, blade: [.30, .28, .40], trees: 0, ruin: 1, eclipse: 1 },
  solas: { name: 'Solas, the gate of light', sun: [-.4, .55, .7], fog: [.86, .80, .66], fogD: .0010, exp: .84,
    sky: { zen: [.16, .34, .70], mid: [.46, .64, .90], hor: [.98, .90, .74], glow: [1, .86, .56], glowK: .6, k: 1.15 }, cloud: { lo: [.80, .74, .70], hi: [1.5, 1.4, 1.2], n: 30 },
    key: [1, .88, .66], keyK: 3.8, hemi: [[.66, .72, .92], [.46, .38, .24], 1.1], glow: [1.0, .86, .52], stone: [1.0, .84, .56], cover: [.44, .46, .18], coverK: .5, streak: .4,
    rock: [.96, .80, .58], ground: { a: [.34, .36, .12], b: [.62, .58, .24], rock: [.66, .56, .40], path: [.70, .60, .42] }, grass: 140000, blade: [1.25, 1.1, .7], trees: 300, tint: [.95, .9, .5], falls: [-82, 80], statues: 'hooded' },
  gaoth: { name: 'Gaoth, the gate of wind', sun: [.6, .42, .45], fog: [.78, .84, .92], fogD: .0007, exp: .9,
    sky: { zen: [.18, .36, .70], mid: [.50, .68, .92], hor: [.90, .93, .98], glow: [1, .95, .85], glowK: .35, k: 1.12 }, cloud: { lo: [.70, .76, .88], hi: [1.45, 1.45, 1.45], n: 40 },
    key: [1, .96, .9], keyK: 3.2, hemi: [[.66, .76, .96], [.34, .36, .34], 1.15], glow: [.66, .92, 1.0], stone: [.84, .86, .88], cover: [.40, .48, .30], coverK: .5, streak: .5,
    rock: [.72, .74, .76], ground: { a: [.28, .38, .18], b: [.50, .58, .30], rock: [.56, .58, .58], path: [.58, .56, .50] }, grass: 100000, blade: [.95, 1.05, .9], trees: 60, tint: [.8, .95, .7], spires: 'floating', abyss: 1, under: 1 }
};

// ── the Weaver script and the sigils, in the school's light ──
function glyphTex(down) {
  const L = 2048, S = 64, c = document.createElement('canvas'); c.width = down ? S : L; c.height = down ? L : S; const x = c.getContext('2d'); x.strokeStyle = '#fff'; x.lineCap = 'round'; x.lineWidth = 4;
  for (let i = 0; i < 40; i++) { const k = Math.floor(rnd() * 7), a = 25 + i * 51; x.save(); if (down) x.translate(32, a); else x.translate(a, 32); x.beginPath();
    if (k === 0) { x.arc(0, 0, 12, 0, 7); x.moveTo(0, -18); x.lineTo(0, 18); } else if (k === 1) { x.moveTo(-12, 18); x.lineTo(0, -18); x.lineTo(12, 18); x.moveTo(-7, 4); x.lineTo(7, 4); }
    else if (k === 2) { x.arc(0, 0, 13, .6, 5.7); x.moveTo(2, 0); x.arc(0, 0, 2, 0, 7); } else if (k === 3) { x.moveTo(-12, -14); x.lineTo(12, -14); x.moveTo(0, -14); x.lineTo(0, 18); x.moveTo(-8, 2); x.lineTo(8, 10); }
    else if (k === 4) { x.moveTo(-12, 0); x.lineTo(0, -16); x.lineTo(12, 0); x.lineTo(0, 16); x.closePath(); } else if (k === 5) { x.moveTo(-10, -16); x.lineTo(-10, 16); x.moveTo(10, -16); x.lineTo(10, 16); x.moveTo(-10, 0); x.lineTo(10, 0); }
    else { x.moveTo(0, -18); x.lineTo(0, 18); x.moveTo(-10, -8); x.lineTo(0, -2); x.lineTo(10, -8); } x.stroke(); x.restore(); }
  const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 8; return t;
}
// the ring sigil of OG-037, and inside a second ring each school's own mark from OG-094 (Tine's redone as fire)
function sigilTex(mark) {
  const c = document.createElement('canvas'); c.width = c.height = 512; const x = c.getContext('2d'); x.strokeStyle = '#fff'; x.fillStyle = '#fff'; x.lineCap = 'round'; x.lineJoin = 'round';
  if (!mark) { x.lineWidth = 16; x.beginPath(); x.arc(256, 256, 170, 0, 7); x.stroke(); x.lineWidth = 9; x.beginPath(); x.arc(256, 256, 96, 0, 7); x.stroke();
    x.lineWidth = 10; x.beginPath(); x.moveTo(256, 20); x.lineTo(256, 492); x.moveTo(20, 256); x.lineTo(492, 256); x.stroke(); x.beginPath(); x.arc(256, 256, 18, 0, 7); x.fill(); }
  else { x.lineWidth = 14; x.beginPath(); x.arc(256, 256, 200, 0, 7); x.stroke(); x.lineWidth = 6; x.beginPath(); x.arc(256, 256, 176, 0, 7); x.stroke(); x.lineWidth = 16; x.beginPath();
    if (mark === 'tine') { x.moveTo(256, 92); x.bezierCurveTo(330, 190, 360, 250, 340, 320); x.bezierCurveTo(320, 390, 190, 400, 172, 320); x.bezierCurveTo(160, 260, 210, 230, 220, 170); x.bezierCurveTo(250, 210, 262, 240, 256, 280); x.bezierCurveTo(300, 250, 280, 170, 256, 92); }
    else if (mark === 'uisce') { x.arc(256, 256, 120, Math.PI * .3, Math.PI * 1.7); x.moveTo(256 + 120 * Math.cos(Math.PI * 1.7), 256 + 120 * Math.sin(Math.PI * 1.7)); x.quadraticCurveTo(170, 256, 256 + 120 * Math.cos(Math.PI * .3), 256 + 120 * Math.sin(Math.PI * .3)); }
    else if (mark === 'cloch') { x.moveTo(110, 350); x.lineTo(210, 160); x.lineTo(262, 250); x.lineTo(310, 190); x.lineTo(402, 350); x.closePath(); x.moveTo(180, 215); x.lineTo(210, 236); x.lineTo(236, 206); }
    else if (mark === 'scath') { x.moveTo(110, 256); x.quadraticCurveTo(256, 120, 402, 256); x.quadraticCurveTo(256, 392, 110, 256); x.stroke(); x.beginPath(); x.arc(256, 256, 48, 0, 7); x.stroke(); x.beginPath(); x.arc(256, 256, 16, 0, 7); x.fill(); x.beginPath(); }
    else if (mark === 'solas') { x.arc(256, 256, 64, 0, 7); for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2, r0 = 92, r1 = i % 2 ? 130 : 156; x.moveTo(256 + Math.cos(a) * r0, 256 + Math.sin(a) * r0); x.lineTo(256 + Math.cos(a) * r1, 256 + Math.sin(a) * r1); } }
    else { for (let i = 0; i <= 120; i++) { const t = i / 120, a = t * Math.PI * 4.2, r = 10 + t * 140; const px = 256 + Math.cos(a) * r, py = 256 + Math.sin(a) * r; i ? x.lineTo(px, py) : x.moveTo(px, py); } }
    x.stroke(); }
  const t = new THREE.CanvasTexture(c); t.anisotropy = 8; return t;
}

// ── stone in the weather: the slice's weathered(), its moss made a cover of any colour (snow for Cloch, soot for Tine) ──
function weathered(m, o = {}) {
  const k = o.k ?? .8, streak = o.streak ?? .5, cv = o.cover || [.25, .31, .10]; m.customProgramCacheKey = () => 'wg' + k + '|' + streak + '|' + cv.join(',') + (o.snow ? 's' : '');
  m.onBeforeCompile = s => { s.vertexShader = 'varying vec3 vW2; varying vec3 vN2;\n' + s.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\n vW2 = (modelMatrix * vec4(position,1.)).xyz; vN2 = normalize(mat3(modelMatrix) * normal);');
    s.fragmentShader = 'varying vec3 vW2; varying vec3 vN2;\nfloat wh(vec2 p){ p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }\nfloat wv(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f); return mix(mix(wh(i), wh(i + vec2(1,0)), f.x), mix(wh(i + vec2(0,1)), wh(i + vec2(1,1)), f.x), f.y); }\nfloat wf(vec2 p){ float a = 0., m = .5; for (int i = 0; i < 5; i++) { a += m * wv(p); p *= 2.07; m *= .5; } return a; }\n'
      + s.fragmentShader.replace('#include <map_fragment>', `#include <map_fragment>
        float n = wf(vW2.xz * .35 + vW2.y * .21), up = smoothstep(${o.snow ? '.05, .45' : '.25, .75'}, vN2.y + (n - .5) * .7);
        float st = smoothstep(.55, .85, wv(vec2(vW2.x * 1.3 + vW2.z * 1.3, vW2.y * .04))) * (.6 + .4 * wf(vW2.xy * .5));
        diffuseColor.rgb *= 1. - ${streak.toFixed(3)} * st * .55;
        vec3 cov = vec3(${cv.map(v => v.toFixed(3)).join(',')}) * (.85 + .3 * wf(vW2.xz * 1.7));
        diffuseColor.rgb = mix(diffuseColor.rgb, cov, clamp(${k.toFixed(3)} * up * smoothstep(.35, .6, n + .15), 0., 1.));`); };
  return m;
}

// ── the slice's two-centred arch and its voussoirs (gate.js), with keep(cx, cy, order) deciding which stones still stand ──
function arch(S, ys, h) { const a = Math.max(0, (h * h - S * S / 4) / S), r = S / 2 + a; return { S, ys, a, r, off: d => ({ x: S / 2 - d, rr: r - d }) }; }
function archPts(A, d, y0, n = 64) {
  const { x: hx, rr } = A.off(d), a = A.a, pts = []; const th1 = Math.atan2(Math.sqrt(Math.max(0, rr * rr - a * a)), -a);
  pts.push([-hx, y0]); for (let i = 0; i <= n; i++) { const t = Math.PI + (th1 - Math.PI) * i / n; pts.push([a + Math.cos(t) * rr, A.ys + Math.sin(t) * rr]); }
  for (let i = n; i >= 0; i--) { const t = Math.PI + (th1 - Math.PI) * i / n; pts.push([-(a + Math.cos(t) * rr), A.ys + Math.sin(t) * rr]); } pts.push([hx, y0]); return pts;
}
function along(pts) { const L = [0]; for (let i = 1; i < pts.length; i++) L.push(L[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1])); const T = L[L.length - 1];
  return { len: T, at: u => { const s = u * T; let i = 1; while (i < L.length - 1 && L[i] < s) i++; const t = (s - L[i - 1]) / (L[i] - L[i - 1] || 1); return [pts[i - 1][0] + (pts[i][0] - pts[i - 1][0]) * t, pts[i - 1][1] + (pts[i][1] - pts[i - 1][1]) * t]; } }; }
function block(out, q, zf, zb, gap = .05) {
  let c = q.reduce((s, p) => [s[0] + p[0] / 4, s[1] + p[1] / 4], [0, 0]); const sz = Math.max(...q.map(p => Math.hypot(p[0] - c[0], p[1] - c[1]))) || 1, k = 1 - gap / sz;
  let p = q.map(v => [c[0] + (v[0] - c[0]) * k, c[1] + (v[1] - c[1]) * k]); let ar = 0; for (let i = 0; i < 4; i++) { const j = (i + 1) % 4; ar += p[i][0] * p[j][1] - p[j][0] * p[i][1]; } if (ar < 0) p = p.reverse();
  const F = p.map(v => [v[0], v[1], zf]), B = p.map(v => [v[0], v[1], zb]), tri = (a, b, c2) => out.push(...a, ...b, ...c2);
  tri(F[0], F[1], F[2]); tri(F[0], F[2], F[3]); tri(B[0], B[2], B[1]); tri(B[0], B[3], B[2]);
  for (let i = 0; i < 4; i++) { const j = (i + 1) % 4; tri(F[i], B[i], B[j]); tri(F[i], B[j], F[j]); }
}
function ringBlocks(out, A, d0, d1, zf, depth, y0, blockLen, keep, k) {
  const inner = along(archPts(A, d1, y0)), outer = along(archPts(A, d0, y0)), mid = along(archPts(A, (d0 + d1) / 2, y0)); const n = Math.max(8, Math.round(inner.len / blockLen)); let dropped = 0;
  for (const [lo, hi, sh] of [[inner, mid, 0], [mid, outer, .5]]) for (let i = -1; i < n; i++) { const u0 = Math.max(0, (i + sh) / n), u1 = Math.min(1, (i + 1 + sh) / n); if (u1 <= u0) continue;
    const pr = rnd() * .45, sk = (rnd() - .5) * .25, q = [lo.at(u0), lo.at(u1), hi.at(u1), hi.at(u0)], c = q.reduce((s, p) => [s[0] + p[0] / 4, s[1] + p[1] / 4], [0, 0]);
    if (keep && !keep(c[0], c[1], k)) { dropped++; continue; } block(out, q, zf + pr, zf - depth + sk, .07); }
  return dropped;
}
function geoFrom(arr) { const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(arr, 3)); g.computeVertexNormals(); return g; }
export function trisOf(o) { let t = 0; o.traverse(m => { if (m.isSprite) { t += 2; return; } if (!m.isMesh || !m.geometry) return; const g = m.geometry, n = (g.index ? g.index.count : g.attributes.position.count) / 3; t += n * (m.isInstancedMesh ? m.count : 1); }); return Math.round(t); }

// ── the gate itself, dressed: portal, back wall, spine, slit, steps, script, sigils, and the cliff it is cut into ──
// Local y 0 is the meadow at the threshold; the group is lifted by S.lift (Cloch up its stair, Uisce down into the water).
export function dressGate(S, key) {
  const G = new THREE.Group(), add = m => { G.add(m); return m; }, glow = new THREE.Color(...S.glow);
  const GLYPHD = glyphTex(true), RING = sigilTex(null), MARK = sigilTex(key);
  const glowMat = (tex, k) => new THREE.MeshBasicMaterial({ color: glow.clone().multiplyScalar(k), map: tex, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, fog: true, toneMapped: true, side: THREE.DoubleSide });
  const strip = (a, b, w, tex, k, rep) => { const d = new THREE.Vector3().subVectors(b, a), side = new THREE.Vector3().crossVectors(d, new THREE.Vector3(0, 0, 1)).normalize().multiplyScalar(w / 2), g = new THREE.BufferGeometry();
    const P = [a.clone().sub(side), a.clone().add(side), b.clone().add(side), b.clone().sub(side)], pos = []; P.forEach(p => pos.push(p.x, p.y, p.z)); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute('uv', new THREE.Float32BufferAttribute([0, 0, 1, 0, 1, rep, 0, rep], 2)); g.setIndex([0, 1, 2, 0, 2, 3]); const m = new THREE.Mesh(g, glowMat(tex, k)); m.renderOrder = 2; return add(m); };
  const sigil = (x, y, z, r, k, tex) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(r * 2.8, r * 2.8), glowMat(tex, k)); m.position.set(x, y, z); m.renderOrder = 2; return add(m); };
  const stoneM = () => { const m = weathered(mat('ashlar', { ns: 1.0, rough: S.snow ? .7 : .9 }), { k: S.coverK, streak: S.streak, cover: S.cover, snow: S.snow }); m.color.setRGB(...S.stone); return m; };
  const ash = stoneM();
  const A = arch(76, 30, 70), FW = 6, D = 6.5, Z0 = 2.5, NO = 5;
  // Scáth's ruin: the crown of the two outer orders is gone on the right, stones missing up the whole face, more of them high
  const ruinKeep = S.ruin ? (x, y, k) => { if (k < 2 && y > 66 && x > -14) return false; if (k === 2 && y > 84 && x > -4) return false; return rnd() > .05 + .32 * sstep(40, 95, y) * (x > 0 ? 1 : .4); } : null;
  let dropped = 0;
  { const out = []; for (let k = 0; k < NO; k++) dropped += ringBlocks(out, A, k * FW, (k + 1) * FW, Z0 - k * D, D + .4, -6, 4.2, ruinKeep, k); const g = geoFrom(out); worldUV(g, .11);
    const m = add(new THREE.Mesh(g, ash)); m.castShadow = m.receiveShadow = true; m.name = 'orders';
    for (let k = 0; k < NO; k++) { const P = archPts(A, (k + 1) * FW - .9, -6, 40).map(([x, y]) => new THREE.Vector3(x, y, Z0 - k * D + .2));
      const runs = [[]]; for (const p of P) { const broken = S.ruin && ((k < 2 && p.y > 64 && p.x > -16) || (k === 2 && p.y > 82 && p.x > -6)); if (broken) { if (runs[runs.length - 1].length) runs.push([]); } else runs[runs.length - 1].push(p); }
      for (const r of runs) { if (r.length < 4) continue; const tg = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(r, false, 'centripetal'), Math.max(8, r.length * 6), 1.25, 10, false); worldUV(tg, .11); const t = add(new THREE.Mesh(tg, ash)); t.castShadow = t.receiveShadow = true; } } }
  const ZB = Z0 - NO * D;
  { const g = new THREE.BoxGeometry(60, 150, 8); g.translate(0, 59, ZB - 4); worldUV(g, .11); add(new THREE.Mesh(g, ash)).receiveShadow = true; }
  const SZ = Z0 - 1.6 * D, SW = 4, PW = 6.2, SH = 24;
  { const out = [], q = (x0, x1, y0, y1) => [[x0, y0], [x1, y0], [x1, y1], [x0, y1]], top = x => S.ruin ? 104 - 26 * sstep(-2, 10, x) : 104;
    for (const s of [-1, 1]) for (let y = -14; y < top(s); ) { const hgt = 3.2 + rnd() * 1.6, x0 = s * SW / 2, x1 = s * (SW / 2 + PW); if (!S.ruin || y < 60 || rnd() > .2) block(out, q(Math.min(x0, x1), Math.max(x0, x1), y, y + hgt), SZ + (rnd() * .3), ZB, .08); y += hgt; }
    for (let y = SH - 4; y < (S.ruin ? 86 : 104); ) { const hgt = 3 + rnd() * 1.4; block(out, q(-SW / 2 - .05, SW / 2 + .05, Math.max(y, SH - 4), y + hgt), SZ + .1, ZB, .06); y += hgt; }
    const sm = weathered(mat('ashlar', { ns: 1.3, rough: .88 }), { k: S.coverK * .6, streak: .8, cover: S.cover, snow: S.snow }); sm.color.setRGB(...S.stone.map(v => v * .93));
    const g = geoFrom(out); worldUV(g, .11); const sp = add(new THREE.Mesh(g, sm)); sp.castShadow = sp.receiveShadow = true; sp.name = 'spine';
    const sh = new THREE.Shape([new THREE.Vector2(-SW / 2, -14), new THREE.Vector2(SW / 2, -14), new THREE.Vector2(SW / 2, SH - 4), new THREE.Vector2(0, SH), new THREE.Vector2(-SW / 2, SH - 4)]);
    const v = add(new THREE.Mesh(new THREE.ShapeGeometry(sh), new THREE.MeshBasicMaterial({ color: 0x050403 }))); v.position.z = SZ + .5;
    { const c = document.createElement('canvas'); c.width = 8; c.height = 128; const k = c.getContext('2d'), gr = k.createLinearGradient(0, 128, 0, 0); gr.addColorStop(0, 'rgba(255,255,255,.9)'); gr.addColorStop(.35, 'rgba(255,255,255,.25)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); k.fillStyle = gr; k.fillRect(0, 0, 8, 128);
      const deep = add(new THREE.Mesh(new THREE.PlaneGeometry(SW * .7, SH * .7), new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(c), color: glow.clone().multiplyScalar(.5), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false }))); deep.position.set(0, SH * .35 - 1, SZ + .52); }
    for (const s of [-1, 1]) { strip(new THREE.Vector3(s * (SW / 2 + PW / 2), 3, SZ + .55), new THREE.Vector3(s * (SW / 2 + PW / 2), S.ruin ? 70 : 96, SZ + .55), 1.3, GLYPHD, 2.4, 3);
      strip(new THREE.Vector3(s * (SW / 2 + 1.0), 30, SZ + .55), new THREE.Vector3(s * (SW / 2 + 1.0), S.ruin ? 62 : 88, SZ + .55), .7, GLYPHD, 1.2, 1); }
    sigil(0, 33, SZ + .6, 3.6, 2.6, RING); sigil(0, 49, SZ + .6, 2.6, 1.8, RING); sigil(0, 66, SZ + .6, 4.4, 2.2, MARK);
    const L = new THREE.PointLight(glow, 900, 60, 2); L.position.set(0, 10, SZ + 6); add(L);
    for (let i = 0; i < 3; i++) { const g = new THREE.BoxGeometry(16 - i * 2, .5, 3); g.translate(0, .25 + i * .5 - .2, SZ + 9 - i * 2.4); worldUV(g, .25); const st = add(new THREE.Mesh(g, ash)); st.castShadow = st.receiveShadow = true; } }
  for (const k of [1, 3]) { const { x } = A.off(k * FW + FW / 2); for (const s of [-1, 1]) strip(new THREE.Vector3(s * x, 2, Z0 - k * D + .5), new THREE.Vector3(s * x, A.ys + 6, Z0 - k * D + .5), 1.0, GLYPHD, 1.2, 1); }
  // the mountain's face, the opening cut through it
  const opening = (() => { const P = archPts(A, -.8, -16, 96); return (x, y) => { let c = false; for (let i = 0, j = P.length - 1; i < P.length; j = i++) { const [xi, yi] = P[i], [xj, yj] = P[j]; if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) c = !c; } return c; }; })();
  const topY = x => 150 + 26 * fbm(x / 60, 3.1, 3) - Math.max(0, -x - 60) * .55 - Math.max(0, x - 180) * .5 + (S.snow ? 30 + 150 * Math.abs(fbm(x / 70, 9.1, 4)) + 50 * sstep(60, 220, Math.abs(x)) : 0);
  const rockZ = (x, y) => 1.2 + 5 * fbm(x / 22, y / 22, 4) + 1.6 * fbm(x / 6, y / 6, 3) + 1.4 * sstep(.2, .8, ((y + 7 * fbm(x / 40, 1.7, 2)) / 11) % 1) - .28 * Math.max(0, y - 95) - .06 * Math.abs(x) * sstep(40, 120, Math.abs(x)) - 3 * sstep(60, 10, Math.hypot(x, y - 50) - 40);
  { const step = 1.8, nx = Math.ceil(740 / step) + 1, ny = Math.ceil((S.snow ? 400 : 240) / step) + 1, pos = new Float32Array(nx * ny * 3), idx = [];
    for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) { const x = -360 + i * step, y = -16 + j * step, k = (j * nx + i) * 3; pos[k] = x; pos[k + 1] = y; pos[k + 2] = rockZ(x, y); }
    for (let j = 0; j < ny - 1; j++) for (let i = 0; i < nx - 1; i++) { const cx = -360 + (i + .5) * step, cy = -16 + (j + .5) * step; if (opening(cx, cy) || cy > topY(cx)) continue; const a = j * nx + i, b = a + 1, c = a + nx + 1, d = a + nx; idx.push(a, b, c, a, c, d); }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals(); worldUV(g, .02);
    const rm = weathered(mat('rock', { ns: 1.2, rough: S.snow ? .75 : .95 }), { k: S.coverK * 1.2, streak: S.streak, cover: S.cover, snow: S.snow }); rm.color.setRGB(...S.rock); const m = add(new THREE.Mesh(g, rm)); m.castShadow = m.receiveShadow = true; m.name = 'cliff'; }
  G.position.y = S.lift || 0;
  return { group: G, A, SZ, ZB, opening, topY, rockZ, dropped, base: (S.lift || 0), stoneMat: ash };
}

// ── a colossus: a robed figure on a plinth, its hands on a sword held point-down (Cloch bare-headed and bearded, Solas hooded) ──
function colossus(kind, stone) {
  const parts = [], limb = (a, b, r0, r1) => { const A = new THREE.Vector3(...a), B = new THREE.Vector3(...b), d = new THREE.Vector3().subVectors(B, A), g = new THREE.CylinderGeometry(r1, r0, d.length(), 12, 1);
    g.translate(0, d.length() / 2, 0); g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.clone().normalize())); g.translate(...a); parts.push(g.toNonIndexed());
    const j = new THREE.SphereGeometry(r1 * 1.05, 12, 8); j.translate(...b); parts.push(j.toNonIndexed()); };
  // the robe to the shoulders: wide at the hem, the shoulders square (OG-105's flanking figures); a hood runs on from them, a helm sits on a neck
  const prof = kind === 'hooded' ? [[0, 0], [7.6, 0], [7.8, 2], [6.6, 10], [5.6, 20], [5.8, 27], [6.9, 30.2], [6.3, 32.6], [5.0, 35], [4.3, 38], [3.9, 40.6], [2.9, 43.2], [1.2, 44.8], [0, 45.1]]
    : [[0, 0], [7.4, 0], [7.6, 2], [6.4, 10], [5.4, 20], [5.6, 27], [7.0, 30.2], [6.6, 32.4], [2.4, 33.4], [0, 33.6]];
  const body = new THREE.LatheGeometry(prof.map(([r, y]) => new THREE.Vector2(r, y)), 40); body.scale(1, 1, .8); parts.push(body.toNonIndexed());
  if (kind === 'hooded') { const brow = new THREE.SphereGeometry(3.7, 24, 16, 0, Math.PI * 2, 0, Math.PI * .62); brow.scale(1, 1.15, 1); brow.rotateX(.35); brow.translate(0, 37.6, 1.1); parts.push(brow.toNonIndexed()); }
  else { const neck = new THREE.CylinderGeometry(2.3, 2.6, 2.4, 16); neck.translate(0, 34.2, .2); parts.push(neck.toNonIndexed());
    const head = new THREE.SphereGeometry(2.8, 20, 14); head.scale(1, 1.18, 1.05); head.translate(0, 37.6, .4); parts.push(head.toNonIndexed());
    const helm = new THREE.SphereGeometry(3.05, 20, 10, 0, Math.PI * 2, 0, Math.PI * .5); helm.scale(1, 1.1, 1.05); helm.translate(0, 38.2, .4); parts.push(helm.toNonIndexed());
    const brim = new THREE.CylinderGeometry(3.25, 3.25, .45, 20); brim.translate(0, 38.2, .4); parts.push(brim.toNonIndexed());
    const nasal = new THREE.BoxGeometry(.6, 2.4, .5); nasal.translate(0, 37.4, 3.4); parts.push(nasal.toNonIndexed());
    const beard = new THREE.ConeGeometry(2.0, 5.2, 12); beard.rotateX(Math.PI - .25); beard.translate(0, 34.0, 2.2); parts.push(beard.toNonIndexed()); }
  // arms hang from the shoulders and bend at the elbow, both hands on the pommel of a sword held point-down before the body
  for (const s of [-1, 1]) { limb([s * 6.0, 30.4, 0], [s * 6.3, 22.6, 2.4], 1.9, 1.6); limb([s * 6.3, 22.6, 2.4], [s * 1.3, 26.4, 6.1], 1.6, 1.25);
    const hand = new THREE.SphereGeometry(1.35, 12, 8); hand.scale(1.1, .9, 1.2); hand.translate(s * .9, 26.6, 6.5); parts.push(hand.toNonIndexed()); }
  const blade = new THREE.BoxGeometry(1.5, 23, .5); blade.translate(0, 13, 6.6); parts.push(blade.toNonIndexed());
  const guard = new THREE.BoxGeometry(7.4, .9, .9); guard.translate(0, 24.9, 6.6); parts.push(guard.toNonIndexed());
  const pommel = new THREE.SphereGeometry(.8, 10, 8); pommel.translate(0, 28.2, 6.6); parts.push(pommel.toNonIndexed());
  const plinth = new THREE.BoxGeometry(18, 7, 18); plinth.translate(0, -3.5, 0); parts.push(plinth.toNonIndexed());
  const g = mergeGeometries(parts.map(p => { p.deleteAttribute('uv'); return p; })); g.computeVertexNormals(); worldUV(g, .11);
  const grp = new THREE.Group(), m = new THREE.Mesh(g, stone); m.castShadow = m.receiveShadow = true; grp.add(m);
  if (kind === 'hooded') { const face = new THREE.Mesh(new THREE.CircleGeometry(2.5, 24), new THREE.MeshBasicMaterial({ color: 0x050403 })); face.scale.set(1, 1.3, 1); face.position.set(0, 36.9, 4.5); grp.add(face); }
  grp.userData.height = 52; return grp;
}

// ── the scene ──
const KEY = SCHOOL[Q.get('school')] ? Q.get('school') : 'tine', S = SCHOOL[KEY], CAM = Q.get('cam') || 'far';
const R = makeRenderer(S.exp), scene = new THREE.Scene();
const cam = new THREE.PerspectiveCamera(CAM === 'foot' || CAM === 'scale' ? 70 : 62, W / H, .1, 30000);
buildTextures();
const SUN = new THREE.Vector3(...S.sun).normalize();
scene.fog = new THREE.FogExp2(new THREE.Color(...S.fog), S.fogD);
skyDome(scene, SUN, S.sky);
clouds(scene, SUN, { n: S.cloud.n, d0: 1600, dw: 5000, y0: 420, lo: S.cloud.lo, hi: S.cloud.hi, a0: -1.6, aw: 3.2, op: S.cloud.op });
const sun = new THREE.DirectionalLight(new THREE.Color(...S.key), S.keyK); sun.position.copy(SUN).multiplyScalar(320); sun.castShadow = true; sun.shadow.mapSize.set(4096, 4096);
Object.assign(sun.shadow.camera, { left: -170, right: 170, top: 170, bottom: -170, near: 10, far: 900 }); sun.shadow.bias = -.0003; sun.shadow.normalBias = .12;
scene.add(sun, sun.target, new THREE.HemisphereLight(new THREE.Color(...S.hemi[0]), new THREE.Color(...S.hemi[1]), S.hemi[2]));

const GT = dressGate(S, KEY); scene.add(GT.group); const LIFT = GT.base;
STATS.school = KEY; STATS.gateTris = trisOf(GT.group); if (S.ruin) STATS.ruinDropped = GT.dropped;
STATS.measures = { outerArch: [76, 100], orders: 5, orderFace: 6, orderStep: 6.5, slit: [4, 24], threshold: LIFT };

// the ground, by school; y is world height
const STAIR = S.stair ? { z0: 70, z1: 14, w: 34, rise: LIFT } : null;
function gy(x, z) {
  let meadow = -.035 * z + 1.4 * fbm(x / 30, z / 30, 4) + 4 * sstep(70, 200, Math.abs(x)) * fbm(x / 50, z / 50, 3) - (S.sea !== undefined && !S.fjord ? 40 : 26) * sstep(-40, -160, x) * sstep(-20, 120, z);
  if (S.lava) meadow += 2.2 * fbm(x / 14, z / 14, 3) * sstep(14, 40, Math.hypot(x, z));
  if (S.snow) { const t = Math.min(1, Math.max(0, (STAIR.z0 - z) / (STAIR.z0 - STAIR.z1))); meadow += STAIR.rise * t + (Math.abs(x) > STAIR.w / 2 + 6 ? 6 * sstep(30, 140, Math.abs(x)) * (1 + fbm(x / 40, z / 40, 3)) + 3 * fbm(x / 18, z / 18, 3) * sstep(20, 40, Math.abs(x)) : 0); }
  if (S.fjord) { meadow = -22 + 2 * fbm(x / 30, z / 30, 3) + 170 * sstep(130, 210, Math.abs(x)) * (.8 + .3 * fbm(x / 60, z / 60, 3)) + 26 * sstep(230, 300, z); }
  if (S.abyss) meadow -= 600 * Math.max(sstep(110, 210, Math.abs(x)) * sstep(-60, 0, z), sstep(330, 430, z));
  // behind the cliff a plateau, blended in only where it is (gate.js's max() with a zero plateau floored every sea and drop at 0)
  const inPortal = (1 - sstep(36, 46, Math.abs(x))) * sstep(-48, -40, z), t = sstep(-4, -40, z) * (1 - inPortal); if (t <= 0) return meadow;
  return Math.max(meadow, meadow + (LIFT + 150 + 30 * fbm(x / 80, z / 80, 3) - meadow) * t);
}
const groundY = (x, z) => { if (S.bridge && Math.abs(x) < 3.2 && z < 214 && z > GT.SZ + .6) return 1.5; return S.sea !== undefined ? Math.max(gy(x, z), S.sea) : gy(x, z); };
{ const g = new THREE.PlaneGeometry(1600, 1600, 400, 400); g.rotateX(-Math.PI / 2); const P = g.attributes.position; for (let i = 0; i < P.count; i++) { const x = P.getX(i), z = P.getZ(i) + 300; P.setXYZ(i, x, gy(x, z), z); } g.computeVertexNormals();
  const C = S.ground, f3 = a => `vec3(${a.map(v => v.toFixed(3)).join(',')})`, m = new THREE.MeshStandardMaterial({ roughness: S.snow ? .8 : .95 }); m.customProgramCacheKey = () => 'gatesGround' + KEY;
  m.onBeforeCompile = s => { s.vertexShader = 'varying vec3 vW; varying vec3 vNw;\n' + s.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\n vW = (modelMatrix * vec4(position,1.)).xyz; vNw = normal;');
    s.fragmentShader = 'varying vec3 vW; varying vec3 vNw; float lavaK;\nfloat h1(vec2 p){ p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }\nfloat v1(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f); return mix(mix(h1(i), h1(i + vec2(1,0)), f.x), mix(h1(i + vec2(0,1)), h1(i + vec2(1,1)), f.x), f.y); }\nfloat f1(vec2 p){ float a = 0., m = .5; for (int i = 0; i < 5; i++) { a += m * v1(p); p *= 2.03; m *= .5; } return a; }\n'
      + s.fragmentShader.replace('vec4 diffuseColor = vec4( diffuse, opacity );', `float n1 = f1(vW.xz / 9.), n2 = f1(vW.xz * 1.3); vec3 c = mix(${f3(C.a)}, ${f3(C.b)}, n1) * (.82 + .3 * n2);
          float rock = smoothstep(${S.snow ? '.62, .86' : '.42, .66'}, 1. - vNw.y + (n1 - .5) * .3); c = mix(c, ${f3(C.rock)} * (.85 + .3 * n2), rock);
          float path = (1. - smoothstep(1.6, 2.6, abs(vW.x - 3. + sin(vW.z * .05) * 3.))) * step(-26., vW.z) * step(vW.z, 140.) * ${S.stair || S.bridge ? '0.' : '1.'}; c = mix(c, ${f3(C.path)} * (.85 + .3 * n2), path * .92);
          lavaK = 0.; ${S.lava ? `{ float r1 = abs(f1(vW.xz / 46. + vec2(3.1, 7.7)) - .5), r2 = abs(f1(vW.xz / 23. + vec2(9.3, 1.2)) - .5); float ch = max(1. - smoothstep(.006, .03, r1), .7 * (1. - smoothstep(.004, .016, r2)) * step(.45, f1(vW.xz / 60.)));
            ch *= step(vW.z, 200.) * (1. - step(abs(vW.x - 3. + sin(vW.z * .05) * 3.), 4.)); lavaK = ch; c = mix(c, vec3(.05,.03,.02), ch); }` : ''}
          vec4 diffuseColor = vec4(c, opacity);`).replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>
          totalEmissiveRadiance += vec3(2.6, .75, .12) * lavaK * (.75 + .5 * f1(vW.xz * .4));`); };
  const t = new THREE.Mesh(g, m); t.receiveShadow = true; scene.add(t); }
if (S.sea !== undefined) { const g = new THREE.PlaneGeometry(3000, 3000, 1, 1); g.rotateX(-Math.PI / 2); const wm = new THREE.MeshStandardMaterial({ color: S.fjord ? new THREE.Color(.03, .08, .10) : new THREE.Color(.015, .012, .025), roughness: .16, metalness: .1, normalScale: new THREE.Vector2(.35, .35) });
  const TAU = Math.PI * 2, wave = texPair(256, (x, y) => { const h = .5 + .2 * Math.sin(TAU * (3 * x + 2 * y)) + .15 * Math.sin(TAU * (5 * x - 4 * y) + 1.3) + .1 * Math.sin(TAU * (9 * x + 7 * y) + .4) + .05 * Math.sin(TAU * (17 * x - 13 * y)); return [h, 0, 0, 0]; }, 1.2);
  wm.normalMap = wave.normalMap; wm.normalMap.repeat.set(140, 140);
  { const sk = new THREE.Scene(), dome = skyDome(sk, SUN, S.sky); dome.scale.setScalar(1 / 400); const pm = new THREE.PMREMGenerator(R); wm.envMap = pm.fromScene(sk, 0, .1, 200).texture; wm.envMapIntensity = .9; wm.metalness = .6; }
  const w = new THREE.Mesh(g, wm); w.position.set(0, S.sea, 300); w.receiveShadow = true; scene.add(w); }

// the school's own pieces
const stone = GT.stoneMat, FALLS = [];
if (S.statues) { for (const s of [-1, 1]) { const c = colossus(S.statues, stone), x = s * 56, z = 16; c.position.set(x, (S.stair ? LIFT : gy(x, z)) + 7, z); c.rotation.y = -s * .18; scene.add(c); STATS.colossusTris = trisOf(c); } STATS.colossus = 52; }
if (S.stair) { // one flight of 42 steps (0.38 m rise, 1.33 m tread), 34 m wide, 56 m long, between cheek walls 3 m thick
  const out = [], { z0, z1, w, rise } = STAIR, nSteps = 42, dz = (z0 - z1) / nSteps, dy = rise / nSteps; for (let i = 0; i < nSteps; i++) { const zf = z0 - i * dz, top = (i + 1) * dy, g = new THREE.BoxGeometry(w, top + 4, dz); g.translate(0, (top - 4) / 2, zf - dz / 2); out.push(g.toNonIndexed()); }
  for (const s of [-1, 1]) { const sh = new THREE.Shape([new THREE.Vector2(z0 + 2, -4), new THREE.Vector2(z0 + 2, 1.6), new THREE.Vector2(z1, rise + 1.6), new THREE.Vector2(z1 - 4, rise + 1.6), new THREE.Vector2(z1 - 4, -4)]);
    const eg = new THREE.ExtrudeGeometry(sh, { depth: 3, bevelEnabled: false }); eg.rotateY(-Math.PI / 2); eg.translate(s * (w / 2 + (s > 0 ? 3 : 0)), 0, 0); out.push(eg.toNonIndexed()); }
  const g = mergeGeometries(out.map(p => { p.deleteAttribute('uv'); return p; })); g.computeVertexNormals(); worldUV(g, .2); const m = new THREE.Mesh(g, stone); m.castShadow = m.receiveShadow = true; scene.add(m); STATS.stair = { steps: nSteps, rise: +dy.toFixed(3), tread: +dz.toFixed(3), width: w, total: rise }; }
if (S.bridge) { // a causeway from the shore to the door, 6 m wide, on piers every 12 m with pointed arches between, the deck 1.5 m over the water
  const out = [], z0 = 214, z1 = GT.SZ + .6; for (let z = z1; z < z0; z += 12) { const p = new THREE.BoxGeometry(5, 26, 3); p.translate(0, -12.5, z + 1.5); out.push(p.toNonIndexed()); }
  const deck = new THREE.BoxGeometry(6.4, 1.2, z0 - z1); deck.translate(0, .9, (z0 + z1) / 2); out.push(deck.toNonIndexed());
  for (const s of [-1, 1]) { const par = new THREE.BoxGeometry(.5, 1.0, z0 - z1); par.translate(s * 2.95, 2.0, (z0 + z1) / 2); out.push(par.toNonIndexed()); }
  const g = mergeGeometries(out.map(p => { p.deleteAttribute('uv'); return p; })); g.computeVertexNormals(); worldUV(g, .25); const m = new THREE.Mesh(g, stone); m.castShadow = m.receiveShadow = true; scene.add(m);
  STATS.bridge = { length: z0 - z1, width: 6.4, deck: 1.5 }; }
if (S.falls) { // two falls off the mountain, either side of the portal: streaked sheets and mist where they land
  const c = document.createElement('canvas'); c.width = 128; c.height = 512; const k = c.getContext('2d'); k.fillStyle = 'rgba(0,0,0,0)'; k.fillRect(0, 0, 128, 512);
  for (let i = 0; i < 260; i++) { const x = rnd() * 128, y = rnd() * 512, l = 40 + rnd() * 160, a = .15 + rnd() * .5; const g = k.createLinearGradient(0, y, 0, y + l); g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(.5, `rgba(255,255,255,${a})`); g.addColorStop(1, 'rgba(255,255,255,0)'); k.fillStyle = g; k.fillRect(x, y, 1.5 + rnd() * 3, l); }
  const tex = new THREE.CanvasTexture(c); tex.wrapS = tex.wrapT = THREE.RepeatWrapping; tex.repeat.set(2, 3); FALLS.push(tex);
  for (const fx of S.falls) { const top = GT.topY(fx) - 6, bot = S.sea !== undefined ? S.sea : gy(fx, 6), h = top - bot, wd = 16, z = GT.rockZ(fx, (top + bot) / 2 - LIFT) + 4;
    const mm = new THREE.MeshBasicMaterial({ map: tex, color: new THREE.Color(1.1, 1.15, 1.2), transparent: true, depthWrite: false, side: THREE.DoubleSide });
    for (let l = 0; l < 2; l++) { const f = new THREE.Mesh(new THREE.PlaneGeometry(wd - l * 5, h), mm); f.position.set(fx + l * 1.5, bot + h / 2 + LIFT * 0, z + l * 1.4); scene.add(f); }
    for (let i = 0; i < 30; i++) { const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: puffTex(), color: new THREE.Color(.95, .97, 1), transparent: true, depthWrite: false, opacity: .28 })); sp.position.set(fx + (rnd() - .5) * 26, bot + rnd() * 14, z + 4 + rnd() * 16); sp.scale.setScalar(10 + rnd() * 16); scene.add(sp); } }
  STATS.falls = S.falls.length; }
if (S.spires === 'basalt') { // columnar basalt: clusters of six-sided columns, 0.8 to 2.4 m across, 6 to 70 m tall, in front of the range
  const out = []; let n = 0; for (let c = 0; c < 26; c++) { const s = c % 2 ? 1 : -1, cx = s * (52 + rnd() * 170), cz = -10 + rnd() * 120, big = 20 + rnd() * 50 * sstep(40, 120, Math.abs(cx));
    for (let i = 0; i < 22; i++) { const r = .8 + rnd() * 1.6, x = cx + (rnd() - .5) * 18, z = cz + (rnd() - .5) * 14, h = big * (.3 + .7 * rnd()) * (1 - Math.hypot(x - cx, z - cz) / 24); if (h < 2) continue;
      const g = new THREE.CylinderGeometry(r, r * 1.04, h, 6, 1); g.rotateY(rnd()); g.translate(x, gy(x, z) + h / 2 - 1, z); out.push(g.toNonIndexed()); n++; } }
  const g = mergeGeometries(out.map(p => { p.deleteAttribute('uv'); return p; })); g.computeVertexNormals(); worldUV(g, .12); const bm = mat('rock', { ns: 1.4 }); bm.color.setRGB(.24, .22, .22);
  const m = new THREE.Mesh(g, bm); m.castShadow = m.receiveShadow = true; scene.add(m); STATS.basalt = n;
  // magma down the cliff: three falls of molten rock out of cracks in the face
  for (const fx of [-118, 96, 168]) { const top = GT.topY(fx) - 30 - rnd() * 30, bot = gy(fx, 8); const pts = []; for (let y = top; y > bot; y -= 4) pts.push(new THREE.Vector3(fx + 3 * Math.sin(y * .07), y, GT.rockZ(fx, y - LIFT) + 1.2));
    const tg = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 60, 1.6, 6, false); const lm = new THREE.MeshBasicMaterial({ color: new THREE.Color(3.2, .9, .16) }); scene.add(new THREE.Mesh(tg, lm));
    const L = new THREE.PointLight(new THREE.Color(1, .4, .1), 1600, 90, 2); L.position.set(fx, bot + 12, 14); scene.add(L); }
  for (const [x, z] of [[-30, 60], [40, 40], [-70, 110], [80, 90]]) { const L = new THREE.PointLight(new THREE.Color(1, .38, .1), 500, 50, 2); L.position.set(x, gy(x, z) + 3, z); scene.add(L); } }
if (S.spires === 'floating') { // rock spires hanging in the air, a tower on most: an inverted cone of rock 10 to 34 m across, displaced
  const out = [], tw = [], up = []; let n = 0; for (let i = 0; i < 26; i++) { const s = i % 2 ? 1 : -1, x = s * (150 + rnd() * 220), z = -220 + rnd() * 300, y = 40 + rnd() * 220, r = 5 + rnd() * 12, h = r * (2.2 + rnd() * 1.4);
    const g = new THREE.ConeGeometry(r, h, 10, 5); g.rotateX(Math.PI); const P = g.attributes.position; for (let j = 0; j < P.count; j++) { const px = P.getX(j), py = P.getY(j), pz = P.getZ(j), k = 1 + .35 * fbm(px / 4 + i, pz / 4 + py / 6, 3); P.setXYZ(j, px * k, py, pz * k); }
    g.translate(x, y - h / 2, z); out.push(g.toNonIndexed()); n++; const cap = new THREE.CylinderGeometry(r * 1.02, r, 1.4, 10); cap.translate(x, y + .5, z); up.push(cap.toNonIndexed());
    if (rnd() < .7) { const th = 12 + rnd() * 28, tr = 1.6 + rnd() * 1.6, tx = x + (rnd() - .5) * r * .6, t = new THREE.CylinderGeometry(tr, tr * 1.15, th, 10); t.translate(tx, y + th / 2, z); tw.push(t.toNonIndexed());
      const roof = new THREE.ConeGeometry(tr * 1.4, tr * 3.4, 10); roof.translate(tx, y + th + tr * 1.7, z); tw.push(roof.toNonIndexed()); } }
  const rk = mergeGeometries(out.map(p => { p.deleteAttribute('uv'); return p; })); rk.computeVertexNormals(); worldUV(rk, .05); const rm = mat('rock', { ns: 1.2 }); rm.color.setRGB(...S.rock); const m1 = new THREE.Mesh(rk, rm); m1.castShadow = m1.receiveShadow = true; scene.add(m1);
  const gr = mergeGeometries(up.map(p => { p.deleteAttribute('uv'); return p; })); gr.computeVertexNormals(); const m2 = new THREE.Mesh(gr, new THREE.MeshStandardMaterial({ color: new THREE.Color(.30, .40, .18), roughness: 1 })); m2.receiveShadow = true; scene.add(m2);
  const tg = mergeGeometries(tw.map(p => { p.deleteAttribute('uv'); return p; })); tg.computeVertexNormals(); worldUV(tg, .2); const m3 = new THREE.Mesh(tg, stone); m3.castShadow = true; scene.add(m3); STATS.floating = n;
  // the cloud sea below the edge
  for (let i = 0; i < 160; i++) { const a = rnd() * Math.PI * 2, d = 240 + rnd() * 900, sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: puffTex(), color: new THREE.Color(1.15, 1.15, 1.2), transparent: true, depthWrite: false, opacity: .85 }));
    sp.position.set(Math.cos(a) * d, -60 - rnd() * 40, 120 + Math.sin(a) * d); if (Math.abs(sp.position.x) < 120 && sp.position.z < 200) continue; sp.scale.setScalar(80 + rnd() * 120); scene.add(sp); } }
if (S.ruin) { // fallen stones from the broken crown, 2.5 to 6 m, half sunk in the black sand before the gate
  const out = []; for (let i = 0, n = 0; n < 46 && i < 400; i++) { const x = -8 + rnd() * 64, z = 6 + rnd() * 54; if (x < 20 && z < 34) continue; n++; const a = 2.5 + rnd() * 3.5, g = new THREE.BoxGeometry(a, a * (.5 + rnd() * .5), a * (.6 + rnd() * .6)); g.rotateX(rnd() * .8); g.rotateY(rnd() * 3); g.rotateZ(rnd() * .8); g.translate(x, gy(x, z) + a * .15, z); out.push(g.toNonIndexed()); }
  const g = mergeGeometries(out.map(p => { p.deleteAttribute('uv'); return p; })); g.computeVertexNormals(); worldUV(g, .11); const m = new THREE.Mesh(g, stone); m.castShadow = m.receiveShadow = true; scene.add(m); STATS.fallen = 46; }
if (S.eclipse) { // the black sun in a ring of white fire, over the gate (OG-105's Scáth panel)
  const c = document.createElement('canvas'); c.width = c.height = 512; const k = c.getContext('2d'), g = k.createRadialGradient(256, 256, 90, 256, 256, 250); g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(.08, 'rgba(220,200,255,.9)'); g.addColorStop(.3, 'rgba(160,110,255,.35)'); g.addColorStop(1, 'rgba(80,40,160,0)');
  k.fillStyle = g; k.fillRect(0, 0, 512, 512); k.fillStyle = '#000'; k.beginPath(); k.arc(256, 256, 92, 0, 7); k.fill(); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: t, color: new THREE.Color(1.6, 1.5, 1.8), transparent: true, depthWrite: false, fog: false })); sp.position.set(-500, 1900, -3000); sp.scale.setScalar(1100); scene.add(sp); }
if (S.smoke) for (let i = 0; i < S.smoke; i++) { const x = [-160, 140, 30][i], z = -60 - i * 20, y = GT.topY(x) + LIFT; const tt = puffTex();
  for (let j = 0; j < 30; j++) { const f = j / 30, sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: tt, color: new THREE.Color(.16 + .2 * (1 - f), .1 + .06 * (1 - f), .08), transparent: true, depthWrite: false, opacity: .7 * (1 - f * .6) })); sp.position.set(x + f * 140 + (rnd() - .5) * 30, y + f * 360, z - f * 60); sp.scale.setScalar(40 + f * 160); scene.add(sp); } }

// a small camp before the door, a fire, the people for scale
const canvasM = new THREE.MeshStandardMaterial({ color: new THREE.Color(.74, .66, .52), roughness: 1, side: THREE.DoubleSide });
const PEOPLE = [], person = (x, z, ry, g, o, y) => PEOPLE.push([x, y ?? groundY(x, z), z, ry, g, o]);
function fire(x, y, z, s = 1) {
  const c = document.createElement('canvas'); c.width = c.height = 64; const k = c.getContext('2d'), g = k.createRadialGradient(32, 40, 2, 32, 36, 30); g.addColorStop(0, 'rgba(255,240,200,1)'); g.addColorStop(.35, 'rgba(255,150,40,.9)'); g.addColorStop(1, 'rgba(255,60,0,0)'); k.fillStyle = g; k.fillRect(0, 0, 64, 64);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  for (let i = 0; i < 14; i++) { const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: t, color: new THREE.Color(2.4, 1.6, .9), blending: THREE.AdditiveBlending, depthWrite: false, transparent: true }));
    sp.position.set(x + (rnd() - .5) * .35 * s, y + .15 + rnd() * .7 * s, z + (rnd() - .5) * .35 * s); sp.scale.set(.55 * s * (1 - (sp.position.y - y) / (1.2 * s)), .9 * s, 1); scene.add(sp); }
  const L = new THREE.PointLight(new THREE.Color(1, .55, .22), 30 * s * s, 26 * s, 2); L.position.set(x, y + .7 * s, z); scene.add(L);
}
const tent = (x, z, ry, s = 1) => { const sh = new THREE.Shape([new THREE.Vector2(-2.2, 0), new THREE.Vector2(2.2, 0), new THREE.Vector2(0, 3.0)]); const g = new THREE.ExtrudeGeometry(sh, { depth: 4.5, bevelEnabled: false }); g.translate(0, 0, -2.25);
  const m = new THREE.Mesh(g, canvasM); m.position.set(x, groundY(x, z) - .05, z); m.rotation.y = ry; m.scale.setScalar(s); m.castShadow = m.receiveShadow = true; scene.add(m); };
const DOOR = { x: 0, z: GT.SZ + 14, y: S.bridge ? 1.5 : groundY(0, GT.SZ + 14) };
if (S.bridge) { person(-1, 30, 3.0, 1); person(1.2, 31, 3.3, 0, { mantle: false }); person(-.6, 70, 3.1, 1); person(.8, 92, 3.2, 1, { mantle: false }); }
else {
  const cz = S.stair ? 92 : 40; tent(-14, cz - 2, .3); tent(-8, cz + 8, -.2, .9); tent(15, cz + 2, -.4); fire(2.5, groundY(2.5, cz), cz, 1.3);
  person(-5, cz + 2, .8, 1); person(-3.6, cz + 3.4, -2.4, 0); person(5.5, cz - 4, -1.3, 1, { mantle: false }); person(13, cz - 1, -.4, 1);
  if (S.stair) { person(-2, 41, 3.0, 1, {}, LIFT * (70 - 41) / 56 + .1); person(3, 24, 3.2, 0, {}, LIFT * Math.min(1, (70 - 24) / 56) + .1); }
  const pz = CAM === 'foot' ? 30 : 96, wx = CAM === 'foot' ? -.4 : 2.2; person(wx, pz, Math.PI + .1, 1);
}
// the scale figure at the door: a person at the foot of the three steps, and a second beside the right pillar's script
if (S.bridge) person(-1.4, GT.SZ + 4, Math.PI - .4, 1, {}, 1.5); else person(-3.5, GT.SZ + 13.5, Math.PI - .4, 1);
function addPeople() { return loadPack('mh/').then(() => { for (const [x, y, z, ry, g, o] of PEOPLE) { const p = makePerson(markGenome(rnd, g, o)); p.root.position.x = x; p.root.position.z = z; p.root.position.y += y; p.root.rotation.y = ry; p.root.traverse(m => { if (m.isMesh) m.frustumCulled = false; }); scene.add(p.root); STATS.people = (STATS.people || 0) + 1; } })
  .catch(e => { window.__err = String(e); console.error(e); }); }

// grass and trees, where the school has them
if (S.grass) { const seg = 3, posA = [], colA = [], idx = [], bl = S.blade || [1, 1, 1]; for (let k = 0; k <= seg; k++) { const t = k / seg, w = .06 * (1 - t); posA.push(-w, t, 0, w, t, 0); const c = [(.07 + .3 * t) * bl[0], (.14 + .36 * t) * bl[1], (.04 + .1 * t) * bl[2]]; colA.push(...c, ...c); } for (let k = 0; k < seg; k++) { const a = k * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
  const bg = new THREE.BufferGeometry(); bg.setAttribute('position', new THREE.Float32BufferAttribute(posA, 3)); bg.setAttribute('color', new THREE.Float32BufferAttribute(colA, 3)); bg.setAttribute('normal', new THREE.Float32BufferAttribute(new Array(posA.length / 3).fill(0).flatMap(() => [0, 1, 0]), 3)); bg.setIndex(idx);
  const gm = new THREE.MeshStandardMaterial({ vertexColors: true, side: THREE.DoubleSide, roughness: .8 }); gm.onBeforeCompile = s => { s.uniforms.uWind = WIND; s.vertexShader = 'uniform float uWind;\n' + s.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>' + windVS(.18, 1.4)); };
  const cz = CAM === 'foot' ? 42 : 114, N = S.grass, gr = new THREE.InstancedMesh(bg, gm, N), Mx = new THREE.Matrix4(), q = new THREE.Quaternion(), s = new THREE.Vector3(), p = new THREE.Vector3(), up = new THREE.Vector3(0, 1, 0); let n = 0, tries = 0;
  while (n < N && tries++ < N * 4) { const r = 1.5 + Math.pow(rnd(), 1.6) * 80, a = -Math.PI / 2 + (rnd() - .5) * 2.6, x = 4 + Math.cos(a) * r * 1.6, z = cz + Math.sin(a) * r; if (Math.abs(x - 3 + Math.sin(z * .05) * 3) < 2.2 && z > -26) continue; if (Math.hypot(x, z - 40) < 16 || z < 4) continue;
    const y = gy(x, z); if (y < -20) continue; p.set(x, y - .02, z); q.setFromAxisAngle(up, rnd() * 6.3); s.set(1.2, (.22 + rnd() * .4) * (S.ruin ? .6 : 1), 1); Mx.compose(p, q, s); gr.setMatrixAt(n++, Mx); }
  gr.count = n; gr.receiveShadow = true; scene.add(gr); }
if (S.trees) { const trees = treeKit(SUN), tl = []; for (let i = 0; i < S.trees * 2 && tl.length < S.trees; i++) { const x = (rnd() - .5) * 700, z = 260 - rnd() * 700; const y = gy(x, z);
    if (Math.abs(x) < 60 + Math.max(0, z) * .5 && z > -60 && z < 340) continue; if (y > 120 && rnd() < .4) continue; if (S.fjord && y < 2) continue; if (y < -20) continue; const t = S.tint; tl.push([x, y, z, 1.1 + rnd() * .8, rnd() * 6.3, new THREE.Color(t[0] * (.85 + .15 * rnd()), t[1] * (.9 + .1 * rnd()), t[2])]); }
  trees.plant(scene, tl); }

// the cameras: far (the whole), foot (at the camp), scale (a person at the door, the slit over them), wide (the mountainside)
const base = LIFT; let eye, at;
if (CAM === 'foot') { const z = S.stair ? 60 : 40; eye = [-6, groundY(-6, z) + 1.7, z]; at = [0, base + 34, -10]; }
else if (CAM === 'scale') { eye = [7.5, DOOR.y + 1.0, GT.SZ + 27]; at = [-1.5, DOOR.y + 9.5, GT.SZ]; }
else if (CAM === 'wide') { eye = [30, groundY(30, 300) + 30, 300]; at = [0, base + 60, 0]; }
else { const ex = S.bridge ? .6 : 4; eye = [ex, groundY(ex, 112) + 1.7, 112]; at = [-3, base + 42, 0]; }
if (Q.get('eye')) { const c = Q.get('eye').split(',').map(Number); eye = c.slice(0, 3); at = c.slice(3, 6); }
cam.position.set(...eye); cam.lookAt(...at);
const comp = makeComposer(R, scene, cam, { bloom: S.eclipse ? .55 : .38, bloomR: .45, bloomT: S.lava ? .7 : .82, warm: [1.07, .99, .9], cool: [.92, .97, 1.07], sat: KEY === 'scath' ? .85 : 1.06, vig: .34 });
addPeople().then(() => { STATS.sceneTris = trisOf(scene); run(comp, cam, { tick: (t, dt) => { for (const f of FALLS) f.offset.y += dt * .9; } }); });
