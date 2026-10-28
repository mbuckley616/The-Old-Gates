// Every herb's look, by island (the concept artist, 28 Oct 2026; backlog L8, OG-039). The game's plant kit (js/30-plants.js's
// PLANT_BUILD, Session 167 on) ported part for part onto three 0.170, plus the Mark's and Aurenne's plants from OG-039 written in
// the same idiom, so a builder can paste a new kind straight into PLANT_BUILD and a line into PLANT_KIND.
// The kinds are written in the kit's old unit (a man 1.233 tall), as the game's are; herb() scales them by HERB_K into metres.
// The game draws its herbs unscaled today, so in the new look's metre world they stand at 0.69 of their size.
// herb(key, mode) -> { group, tris, draws, top, spread, name, island, key }. Modes (HERB_MODES): 'true' the plant alone;
// 'glow' today's rule (a light and a halo on every herb, from HERB_DEF's glowCol, glowInt and glowRad); 'lifted' the plant 1.15
// larger with its colour lifted, and a glint the page shows within 6 m (the field clears the grass about it).
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

export const HERB_K = 1.444;
export const HERB_MODES = ['true', 'glow', 'lifted'];

// ── the shape kit's primitives (js/32-people.js's SK, the parts the plants use) ──
const v2 = (x, y) => new THREE.Vector2(x, y);
const SK = {
  lathe: (pts, seg) => new THREE.LatheGeometry(pts.map(q => v2(Math.max(1e-4, q[0]), q[1])), seg || 12),
  limb(len, r0, r1) { const p = []; for (let i = 0; i <= 5; i++) { const a = i / 5 * Math.PI / 2; p.push(v2(Math.max(1e-4, r1 * Math.sin(a)), -len - r1 * Math.cos(a))); }
    for (let i = 1; i <= 5; i++) { const a = i / 5 * Math.PI / 2; p.push(v2(Math.max(1e-4, r0 * Math.cos(a)), r0 * Math.sin(a))); } return new THREE.LatheGeometry(p, 8); },
  cyl: (r0, r1, h, rs, hs, open) => new THREE.CylinderGeometry(r0, r1, h, rs || 8, hs || 1, open),
  cone: (r, h, rs, hs, open) => new THREE.ConeGeometry(r, h, rs || 8, hs || 1, open),
  ball: (r, w, h, a0, a1, b0, b1) => new THREE.SphereGeometry(r, w || 10, h || 7, a0 || 0, a1 == null ? Math.PI * 2 : a1, b0 || 0, b1 == null ? Math.PI : b1),
  bumpy(geo, amp, freq, k) { const pos = geo.attributes.position, v = new THREE.Vector3(), n = new THREE.Vector3();
    for (let i = 0; i < pos.count; i++) { v.fromBufferAttribute(pos, i); n.copy(v).normalize();
      const b = Math.sin(n.x * freq + k) * Math.sin(n.y * freq * 1.27 + k * .7) * Math.sin(n.z * freq * .91 + k * 1.3);
      v.addScaledVector(n, amp * Math.pow(Math.abs(b), .55)); pos.setXYZ(i, v.x, v.y, v.z); }
    geo.computeVertexNormals(); return geo; },
  box: (x, y, z) => new THREE.BoxGeometry(x, y, z),
};
// a seeded dice, as plantRng
function plantRng(s) { let h = 2166136261; for (const c of String(s)) h = Math.imul(h ^ c.charCodeAt(0), 16777619); return () => { h ^= h << 13; h ^= h >>> 17; h ^= h << 5; return ((h >>> 0) % 100000) / 100000; }; }
// parts as [geometry, matrix, colour, glow]; glow parts bake into a second, emissive mesh
class Plant {
  constructor() { this.parts = []; this.glow = false; }
  add(geo, p, r, s, col) { const q = new THREE.Quaternion().setFromEuler(new THREE.Euler(r ? r[0] : 0, r ? r[1] : 0, r ? r[2] : 0, 'YXZ'));
    const m = new THREE.Matrix4().compose(new THREE.Vector3(p[0], p[1], p[2]), q, new THREE.Vector3(s ? s[0] : 1, s ? s[1] : 1, s ? s[2] : 1));
    this.parts.push([geo, m, new THREE.Color(col), this.glow]); return this; }
}
function plantLeaf(len, wid, thick, droop) { const f = -wid * .18, v = [[0, 0, 0], [-wid * .4, f, len * .3], [0, 0, len * .3], [wid * .4, f, len * .3], [-wid * .34, f, len * .66], [0, 0, len * .66], [wid * .34, f, len * .66], [0, 0, len]];
  const ix = [0, 1, 2, 0, 2, 3, 2, 1, 4, 2, 4, 5, 2, 5, 6, 2, 6, 3, 5, 4, 7, 5, 7, 6], pos = []; for (const i of ix) { const p = v[i]; pos.push(p[0], p[1] - (droop || 0) * (p[2] / len) * (p[2] / len), p[2]); }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); return g; }
// a long strap or ribbon (kelp, lily and aloe leaves): n segments, waving side to side by `wave`, narrowing to the tip
function plantStrap(len, wid, n, wave, droop) { const pos = []; let prev = null;
  for (let k = 0; k <= n; k++) { const t = k / n, w = wid * (1 - t * .85) * .5, x = Math.sin(t * 9) * wave * t, y = -(droop || 0) * t * t, z = len * t, row = [[x - w, y, z], [x + w, y, z]];
    if (prev) pos.push(...prev[0], ...prev[1], ...row[1], ...prev[0], ...row[1], ...row[0]); prev = row; }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); return g; }
const plantStalk = (h, r0, r1, seg) => { const g = SK.cyl(r1, r0, h, seg || 5, 3); g.translate(0, h / 2, 0); return g; };
function plantBlade(h, w, bend) { const g = SK.cone(w, h, 3, 4); g.translate(0, h / 2, 0); const p = g.attributes.position; for (let i = 0; i < p.count; i++) { const y = p.getY(i) / h; p.setZ(i, p.getZ(i) + bend * y * y); } return g; }
const plantShade = (c, k) => new THREE.Color(c).multiplyScalar(k);
const plantMix = (a, b, t) => new THREE.Color(a).lerp(new THREE.Color(b), t);
// new for the new look: leaves laid over a foliage blob's surface, pointing out, so a bush reads as leaves and not as balls
function leafy(P, R, x, y, z, s, col, n = 12) { for (let i = 0; i < n; i++) { const u = R() * 1.6 - .6, ph = R() * 6.283, r = Math.sqrt(1 - u * u), d = [r * Math.cos(ph), u, r * Math.sin(ph)];
  P.add(plantLeaf(s * .75, s * .45, .01, s * .1), [x + d[0] * s * .85, y + d[1] * s * .7, z + d[2] * s * .85], [-u * .9 - .1, Math.atan2(d[0], d[2]) + (R() - .5) * .8, 0], 0, plantShade(col, .8 + R() * .4)); } }

// ── the kinds. The first twenty are the game's PLANT_BUILD, unchanged but for `berry` (lowbush's berries were always black). ──
export const PLANT_BUILD = {
  moss(P, R, col, stem, key) { const n = 9 + Math.floor(R() * 4); for (let i = 0; i < n; i++) { const a = i / n * 6.283 + R(), r = i ? .08 + R() * .16 : 0, s = .07 + R() * .06;
      P.add(SK.bumpy(SK.ball(1, 10, 6, 0, 6.283, 0, 1.7), .3, 13, R() * 9), [Math.sin(a) * r, -.012, Math.cos(a) * r], [0, R() * 6, 0], [s, s * .3, s], plantMix(col, stem, R() * .35)); }
    if (key === 'firemoss') { P.glow = true; for (let i = 0; i < 14; i++) { const a = R() * 6.283, r = R() * .3; P.add(SK.ball(.012, 4, 3), [Math.sin(a) * r, .045, Math.cos(a) * r], 0, 0, 0xffaa44); } P.glow = false; }
    if (key === 'snowthyme') for (let i = 0; i < 40; i++) { const a = R() * 6.283, r = R() * .32; P.add(SK.ball(.011, 4, 3), [Math.sin(a) * r, .05 + R() * .015, Math.cos(a) * r], 0, 0, plantShade(0xe8c8e0, .9 + R() * .2)); }
    if (key === 'shardmoss') { P.glow = true; for (let i = 0; i < 16; i++) { const a = R() * 6.283, r = R() * .26, h = .04 + R() * .07; P.add(SK.cone(.012, h, 4), [Math.sin(a) * r, h / 2 + .02, Math.cos(a) * r], [(R() - .5) * .7, a, (R() - .5) * .7], 0, plantShade(0x8fe8f0, .8 + R() * .3)); } P.glow = false; } },
  clay(P, R, col, stem) { for (let i = 0; i < 4; i++) { const a = i * 1.7 + R(), r = i ? .08 + R() * .06 : 0, s = .07 + R() * .05; P.add(SK.bumpy(SK.ball(1, 8, 5), .2, 6, R() * 5), [Math.sin(a) * r, s * .25, Math.cos(a) * r], 0, [s * 1.3, s * .8, s * 1.1], plantMix(col, stem, R() * .4)); }
    for (let i = 0; i < 5; i++) { const a = R() * 6.283; P.add(plantBlade(.1 + R() * .06, .008, .03), [Math.sin(a) * .14, .02, Math.cos(a) * .14], [.2, a, 0], 0, 0x4a5a2a); } },
  rosette(P, R, col) { for (let ring = 0; ring < 2; ring++) { const n = ring ? 6 : 9; for (let i = 0; i < n; i++) { const a = i / n * 6.283 + ring * .35; P.add(plantLeaf(ring ? .09 : .16, ring ? .05 : .07, .012, .01), [0, .01 + ring * .012, 0], [-(.08 + ring * .25), a, 0], 0, plantShade(col, ring ? 1.08 : .95)); } } },
  cliffflower(P, R, col, stem) { for (let i = 0; i < 8; i++) { const a = i / 8 * 6.283; P.add(plantLeaf(.08, .035, .01, .01), [0, .01, 0], [-.3, a, 0], 0, 0x5a7a3a); }
    for (let i = 0; i < 5; i++) { const a = R() * 6.283, t = .08 + R() * .12; const x = Math.sin(a) * .03, z = Math.cos(a) * .03, tip = [x + Math.sin(a) * .05, t, z + Math.cos(a) * .05]; P.add(plantStalk(t, .005, .004, 4), [x, 0, z], [.3 * (R() - .5) + .25, a, 0], 0, stem);
      for (let k = 0; k < 5; k++) P.add(SK.ball(.013, 5, 4), [tip[0] + (R() - .5) * .03, tip[1] + R() * .02, tip[2] + (R() - .5) * .03], 0, 0, col); } },
  herb(P, R, col, stem) { const n = 9 + Math.floor(R() * 4); for (let i = 0; i < n; i++) { const a = i * 2.4 + R() * .4, t = .05 + R() * .18; P.add(plantStalk(t, .007, .005, 4), [0, 0, 0], [.35, a, 0], 0, stem);
      P.add(plantLeaf(.12 + R() * .05, .07, .012, .03), [Math.sin(a) * t * .34, t, Math.cos(a) * t * .34], [-.25 + R() * .3, a, 0], 0, plantShade(col, .9 + R() * .2)); } },
  waterleaf(P, R, col, stem) { for (let i = 0; i < 14; i++) { const a = R() * 6.283, r = R() * .18, t = .03 + R() * .22; P.add(plantStalk(t, .006, .005, 4), [Math.sin(a) * r, 0, Math.cos(a) * r], [.15, a, 0], 0, stem);
      P.add(plantLeaf(.09, .08, .012, .01), [Math.sin(a) * r, t, Math.cos(a) * r], [-.1, a + R(), 0], 0, plantShade(col, .85 + R() * .3)); } },
  broadleaf(P, R, col, stem) { for (let i = 0; i < 8; i++) { const a = i / 8 * 6.283 + R() * .3; P.add(plantLeaf(.26 + R() * .06, .14, .016, .12), [0, .02, 0], [-(.55 + R() * .35), a, 0], 0, plantShade(col, .85 + R() * .3)); }
    P.add(plantStalk(.36, .008, .006, 4), [0, 0, 0], 0, 0, stem); for (let k = 0; k < 6; k++) P.add(SK.ball(.018, 5, 4), [(R() - .5) * .02, .26 + k * .018, (R() - .5) * .02], 0, 0, 0x6a88ee); },
  wisp(P, R, col, stem) { for (let i = 0; i < 6; i++) { const a = R() * 6.283, t = .16 + R() * .12; R(); P.add(plantBlade(t, .005, .04), [0, 0, 0], [0, a, 0], 0, stem);
      P.add(SK.cone(.02, .035, 6, 1, true), [Math.sin(a) * .04, t - .02, Math.cos(a) * .04], [Math.PI, a, 0], 0, col); }
    for (let i = 0; i < 6; i++) { const a = i / 6 * 6.283; P.add(plantLeaf(.07, .025, .008, .02), [0, .01, 0], [-.35, a, 0], 0, plantShade(col, .8)); } },
  root(P, R, col, stem) { P.glow = true; P.add(SK.lathe([[.001, -.02], [.07, 0], [.085, .05], [.06, .09], [.001, .1]], 9), [0, 0, 0], 0, 0, col);
    for (let i = 0; i < 3; i++) { const a = i * 2.1 + R(); P.add(SK.limb(.14, .03, .012), [Math.sin(a) * .06, .02, Math.cos(a) * .06], [1.25, a, 0], 0, plantShade(col, .8)); } P.glow = false;
    for (let i = 0; i < 7; i++) { const a = i / 7 * 6.283, t = .12 + R() * .12; P.add(plantStalk(t, .008, .006, 4), [0, .08, 0], [.3, a, 0], 0, stem); P.add(plantLeaf(.13, .06, .012, .04), [Math.sin(a) * t * .3, .08 + t, Math.cos(a) * t * .3], [-.2, a, 0], 0, 0x4a8a28); } },
  tussock(P, R, col, stem) { P.add(SK.bumpy(SK.ball(1, 8, 5, 0, 6.283, 0, 1.7), .15, 7, R() * 4), [0, -.02, 0], 0, [.14, .1, .14], stem);
    for (let i = 0; i < 40; i++) { const a = R() * 6.283, r = R() * .1; P.add(plantBlade(.3 + R() * .22, .011, .07 + R() * .1), [Math.sin(a) * r, .02, Math.cos(a) * r], [0, a, 0], 0, plantMix(col, 0x6a6a3a, R() * .45)); } },
  goldenrod(P, R, col, stem) { for (let i = 0; i < 6; i++) { const a = R() * 6.283, r = R() * .1, t = .55 + R() * .25, lean = (R() - .5) * .18; const bx = Math.sin(a) * r, bz = Math.cos(a) * r;
      P.add(plantStalk(t, .011, .007, 5), [bx, 0, bz], [lean, a, 0], 0, stem);
      for (let k = 0; k < 6; k++) { const y = .08 + k * t * .1; const la = R() * 6.283; P.add(plantLeaf(.09, .022, .008, .02), [bx + Math.sin(lean) * y * Math.sin(a), y, bz + Math.sin(lean) * y * Math.cos(a)], [-.3, la, 0], 0, 0x5a7a2a); }
      const tx = bx + Math.sin(lean) * t * Math.sin(a), tz = bz + Math.sin(lean) * t * Math.cos(a);
      for (let b = 0; b < 4; b++) { const ba = a + (b - 1.5) * .7, y0 = t - .16 + b * .035; for (let k = 0; k < 9; k++) { const u = k / 8, r = .015 + u * .07, y = y0 + Math.sin(u * 2.4) * .05; P.add(SK.ball(.011 - u * .004, 5, 3), [tx + Math.sin(ba) * r, y, tz + Math.cos(ba) * r], 0, [1, .8, 1], plantShade(col, .9 + R() * .2)); } } } },
  flowerspike(P, R, col, stem) { for (let i = 0; i < 7; i++) { const a = i / 7 * 6.283; P.add(plantLeaf(.13, .07, .012, .04), [0, .03, 0], [-.35, a, 0], 0, 0x3a5a28); }
    for (let s = 0; s < 3; s++) { const a = s * 2.1 + R(), t = .42 + R() * .18, bx = Math.sin(a) * .04, bz = Math.cos(a) * .04; P.add(plantStalk(t, .009, .006, 5), [bx, 0, bz], [.06, a, 0], 0, stem);
      for (let k = 0; k < 9; k++) { const y = t * .5 + k * t * .055, fa = k * 2.3; P.add(SK.ball(.022, 5, 3), [bx + Math.sin(fa) * .022, y, bz + Math.cos(fa) * .022], [0, fa, 0], [1, 1.25, .9], plantShade(col, .92 + R() * .1)); } } },
  thistle(P, R, col, stem) { for (let s = 0; s < 2; s++) { const a = s * 3 + R(), t = .3 + R() * .14, bx = Math.sin(a) * .05, bz = Math.cos(a) * .05; P.add(plantStalk(t, .014, .009, 5), [bx, 0, bz], 0, 0, stem);
      for (let k = 0; k < 5; k++) { const la = k * 2.4 + s, y = .04 + k * t * .15; P.add(plantLeaf(.16 - k * .018, .075, .01, .03), [bx, y, bz], [-.35, la, 0], 0, plantShade(col, .7)); for (let q = 0; q < 3; q++) P.add(SK.cone(.006, .04, 3), [bx + Math.sin(la) * (.04 + q * .035), y + .012, bz + Math.cos(la) * (.04 + q * .035)], [0, la, 1.2], 0, plantShade(col, .6)); }
      P.add(SK.ball(.04, 8, 6), [bx, t, bz], 0, 0, plantShade(col, .55)); P.add(SK.bumpy(SK.lathe([[.02, 0], [.045, .02], [.035, .06], [.001, .07]], 8), .008, 20, s), [bx, t + .01, bz], 0, 0, col); } },
  fern(P, R, col, stem) { const n = 7; for (let f = 0; f < n; f++) { const a = f / n * 6.283 + R() * .3, L = .5 + R() * .12, el = 1.25 + R() * .2;
      let x = 0, y = .02, z = 0, ang = el; const seg = 9, dl = L / seg;
      for (let k = 0; k < seg; k++) { const nx = x + Math.sin(a) * Math.cos(ang) * dl, ny = y + Math.sin(ang) * dl, nz = z + Math.cos(a) * Math.cos(ang) * dl;
        const w = .09 * (1 - k / seg) + .015; { const dx = nx - x, dy = ny - y, dz = nz - z, d = Math.hypot(dx, dy, dz), g = SK.cyl(.003, .004, d, 3, 1, true); g.translate(0, d / 2, 0); P.add(g, [x, y, z], [Math.atan2(Math.hypot(dx, dz), dy), Math.atan2(dx, dz), 0], 0, stem); }
        for (const sd of [-1, 1]) P.add(plantLeaf(w, .03, .006, .01), [nx, ny, nz], [-(ang * .4) + .05, a + sd * 1.35, 0], 0, plantShade(col, .9 + k * .02));
        x = nx; y = ny; z = nz; ang -= .19; }
      P.add(SK.cyl(.004, .006, .05, 4), [0, .02, 0], 0, 0, stem); } },
  bramble(P, R, col, stem) { for (let i = 0; i < 6; i++) { const a = R() * 6.283, r = i ? .08 + R() * .1 : 0, sz = .1 + R() * .05; P.add(SK.bumpy(SK.ball(1, 7, 5), .22, 8, R() * 6), [Math.sin(a) * r, .08, Math.cos(a) * r], 0, [sz, sz * .7, sz], plantMix(0x3a4a22, col, .3 + R() * .3)); }
    for (let c = 0; c < 9; c++) { const a = R() * 6.283, L = .38 + R() * .22, seg = 10; let x = 0, y = 0, z = 0;
      for (let k = 0; k < seg; k++) { const t = (k + 1) / seg, ny = Math.sin(t * Math.PI) * (.26 + R() * .04), nx = Math.sin(a) * L * t, nz = Math.cos(a) * L * t;
        const dx = nx - x, dy = ny - y, dz = nz - z, d = Math.hypot(dx, dy, dz); const g = SK.cyl(.009, .011, d, 4, 1, true); g.translate(0, d / 2, 0);
        P.add(g, [x, y, z], [Math.atan2(Math.hypot(dx, dz), dy), Math.atan2(dx, dz), 0], 0, stem);
        if (k < seg - 1) for (const sd of [1, -1]) P.add(plantLeaf(.11, .08, .008, .03), [nx, ny, nz], [-.25, a + sd * (1 + R() * .5), 0], 0, plantMix(0x3a5a1e, col, .15 + R() * .3));
        if (k > 3 && k < 7 && R() < .5) for (let q = 0; q < 4; q++) P.add(SK.ball(.014, 5, 4), [nx + (R() - .5) * .03, ny - .02 - R() * .02, nz + (R() - .5) * .03], 0, 0, q ? 0x1a0a14 : 0x7a1a1a); x = nx; y = ny; z = nz; } } },
  shrub(P, R, col, stem, key) { for (let i = 0; i < 4; i++) { const a = R() * 6.283; P.add(plantStalk(.2, .012, .008, 4), [0, 0, 0], [.5, a, 0], 0, stem); }
    for (let i = 0; i < 9; i++) { const a = R() * 6.283, r = i ? .08 + R() * .14 : 0, s = .1 + R() * .06; const y = .2 + R() * .12 - r * .4, bc = plantMix(col, 0x9aa888, R() * .4); P.add(SK.bumpy(SK.ball(1, 8, 6), .22, 8, R() * 6), [Math.sin(a) * r, y, Math.cos(a) * r], 0, [s * .85, s * .7, s * .85], plantShade(bc, .75)); leafy(P, R, Math.sin(a) * r, y, Math.cos(a) * r, s * .8, bc, 12); }
    if (key === 'saltthorn') for (let i = 0; i < 30; i++) { const a = R() * 6.283, r = .12 + R() * .14, y = .14 + R() * .2; P.add(SK.cone(.006, .07, 3), [Math.sin(a) * r, y, Math.cos(a) * r], [-.4, a, 0], 0, 0xd8d0c0); } },
  bush(P, R, col, stem, key) { const leaf = key === 'thornberry' ? 0x3a5a22 : key === 'cyprusblossom' ? 0x3a5228 : 0x2a4a1a;
    for (let i = 0; i < 5; i++) { const a = R() * 6.283; P.add(plantStalk(.25, .014, .01, 4), [0, 0, 0], [.55, a, 0], 0, stem); }
    const blobs = []; for (let i = 0; i < 11; i++) { const a = R() * 6.283, r = i ? .14 + R() * .18 : 0, s = .13 + R() * .07, y = .3 + R() * .12 - r * .45; blobs.push([a, r, s, y]); const bc = plantMix(leaf, 0x6a8a3a, R() * .3); P.add(SK.bumpy(SK.ball(1, 8, 5), .2, 8, R() * 6), [Math.sin(a) * r, y, Math.cos(a) * r], 0, [s * .85, s * .72, s * .85], plantShade(bc, .7)); leafy(P, R, Math.sin(a) * r, y, Math.cos(a) * r, s, bc, 14); }
    if (key === 'cyprusblossom') { for (let c = 0; c < 26; c++) { const [a, r, s, y] = blobs[Math.floor(R() * 11)]; const oa = a + (R() - .5) * 1.2, rr = r + s * .8; P.add(SK.bumpy(SK.ball(1, 6, 4), .25, 9, c), [Math.sin(oa) * rr, y + s * .5 * R(), Math.cos(oa) * rr], 0, [.035, .03, .035], plantShade(col, .9 + R() * .2)); } return; }
    for (let c = 0; c < 9; c++) { const [a, r, s, y] = blobs[1 + Math.floor(R() * 10)]; const oa = a + (R() - .5) * .6, rr = r + s * .9;
      for (let k = 0; k < 5; k++) P.add(SK.ball(.024, 5, 3), [Math.sin(oa) * rr + (R() - .5) * .04, y - .02 - R() * .05, Math.cos(oa) * rr + (R() - .5) * .04], 0, 0, plantShade(col, .9 + R() * .2)); } },
  lowbush(P, R, col, stem, key, berry) { const leaf = key === 'rimeberry' ? 0x3a4a3a : 0x2a3a20; for (let i = 0; i < 7; i++) { const a = R() * 6.283, r = i ? .08 + R() * .12 : 0, s = .1 + R() * .05; const y = .2 + R() * .08 - r * .4, bc = plantMix(leaf, 0x4a5a30, R() * .3); P.add(SK.bumpy(SK.ball(1, 8, 6), .2, 8, R() * 6), [Math.sin(a) * r, y, Math.cos(a) * r], 0, [s * .85, s * .7, s * .85], plantShade(bc, .7)); leafy(P, R, Math.sin(a) * r, y, Math.cos(a) * r, s, bc, 10); }
    for (let c = 0; c < 7; c++) { const a = R() * 6.283, r = .16 + R() * .08, y = .12 + R() * .16; for (let k = 0; k < 4; k++) P.add(SK.ball(.022, 5, 3), [Math.sin(a) * r + (R() - .5) * .04, y + (R() - .5) * .04, Math.cos(a) * r + (R() - .5) * .04], 0, 0, berry ?? 0x1a0a20); } },
  sapling(P, R, col, stem) { P.add(plantStalk(.75, .028, .014, 6), [0, 0, 0], [0, 0, .04], 0, 0x6a6258);
    for (let b = 0; b < 4; b++) { const a = b * 1.6 + R(), y = .4 + b * .1; P.add(plantStalk(.24, .012, .006, 4), [0, y, 0], [.9, a, 0], 0, 0x6a6258);
      const tx = Math.sin(a) * .2, tz = Math.cos(a) * .2, ty = y + .12;
      for (let l = 0; l < 5; l++) { const la = a + (l - 2) * .55; P.add(plantLeaf(.16, .05, .01, .04), [tx, ty, tz], [-.1, la, 0], 0, plantShade(0x3a6a2a, .9 + R() * .2)); }
      for (let k = 0; k < 10; k++) P.add(SK.ball(.022, 5, 3), [tx + (R() - .5) * .08, ty - .05 - R() * .06, tz + (R() - .5) * .08], 0, 0, plantShade(col, .9 + R() * .2)); }
    for (let l = 0; l < 5; l++) { const la = l * 1.26; P.add(plantLeaf(.16, .05, .01, .04), [0, .76, 0], [-.3, la, 0], 0, 0x3a6a2a); } },
  bracket(P, R, col, stem) { P.add(SK.bumpy(SK.cyl(.13, .16, .28, 10, 3), .012, 14, 2), [0, .14, 0], 0, 0, stem ?? 0x4a3a2a); P.add(SK.cyl(.12, .12, .01, 10), [0, .285, 0], 0, 0, 0x8a7458);
    for (let i = 0; i < 7; i++) { const a = R() * 6.283, y = .05 + R() * .2, w = .07 + R() * .04; P.add(SK.lathe([[.001, .012], [w, .004], [w * .95, -.008], [.001, -.012]], 10), [Math.sin(a) * .14, y, Math.cos(a) * .14], [0, 0, 0], [1, 1, .7], plantShade(col, .85 + R() * .3)); } },
  mushrooms(P, R, col, stem, key) { for (let i = 0; i < 6; i++) { const a = R() * 6.283, r = i ? .06 + R() * .1 : 0, s = i ? .5 + R() * .4 : 1.1, h = .12 * s, cr = .06 * s;
      P.add(SK.lathe([[.012 * s, 0], [.014 * s, h * .5], [.011 * s, h]], 6), [Math.sin(a) * r, 0, Math.cos(a) * r], [0, 0, (R() - .5) * .3], 0, 0xcfc4d0);
      P.add(SK.lathe([[.001, -.004], [cr * .9, 0], [cr, .012 * s], [cr * .7, .04 * s], [.001, .05 * s]], 9), [Math.sin(a) * r, h, Math.cos(a) * r], 0, 0, plantShade(col, .9 + R() * .3));
      if (key === 'frostcap') for (let k = 0; k < 6; k++) { const fa = R() * 6.283; P.add(SK.ball(.006 * s + .003, 4, 3), [Math.sin(a) * r + Math.sin(fa) * cr * .55, h + .03 * s, Math.cos(a) * r + Math.cos(fa) * cr * .55], 0, 0, 0xf4f8ff); } } },

  // ── new kinds for the Mark and Aurenne (OG-039), in the same unit and idiom ──
  // living ice: a grey rosette, and on short stems cups of six clear pointed petals that hold the light
  icebloom(P, R, col, stem) { for (let i = 0; i < 9; i++) { const a = i / 9 * 6.283; P.add(plantLeaf(.1, .04, .01, .02), [0, .01, 0], [-.25, a, 0], 0, 0x5a6a68); }
    for (let s = 0; s < 3; s++) { const a = s * 2.1 + R(), t = .12 + R() * .08, bx = Math.sin(a) * .05, bz = Math.cos(a) * .05; P.add(plantStalk(t, .006, .005, 4), [0, 0, 0], [.35, a, 0], 0, stem);
      const tx = Math.sin(a) * (.05 + t * .34), tz = Math.cos(a) * (.05 + t * .34); P.glow = true;
      for (let ring = 0; ring < 2; ring++) for (let k = 0; k < 6; k++) { const pa = k / 6 * 6.283 + ring * .52; P.add(plantLeaf(.055 - ring * .012, .028, .006, -.006), [tx, t + .005 + ring * .004, tz], [-.75 - ring * .4, pa, 0], 0, plantShade(col, .88 + ring * .1 + R() * .1)); }
      P.add(SK.ball(.01, 5, 4), [tx, t + .015, tz], 0, 0, 0xffffff); P.glow = false; void bx; void bz; } },
  // a globe thistle: grey-green spiny leaves, stiff branched stems, each topped by a ball of steel-blue spikes
  globe(P, R, col, stem) { for (let i = 0; i < 6; i++) { const a = i / 6 * 6.283 + R() * .3; P.add(plantLeaf(.18, .07, .01, .05), [0, .03, 0], [-.4, a, 0], 0, 0x6a7a68); }
    for (let s = 0; s < 4; s++) { const a = s * 1.6 + R(), t = .38 + R() * .2, lean = .12 + R() * .1; P.add(plantStalk(t, .009, .006, 5), [0, 0, 0], [lean, a, 0], 0, stem);
      const tx = Math.sin(a) * Math.sin(lean) * t, ty = Math.cos(lean) * t, tz = Math.cos(a) * Math.sin(lean) * t, r = .028 + R() * .01;
      P.add(SK.ball(r * .8, 8, 6), [tx, ty, tz], 0, 0, plantShade(col, .7));
      for (let k = 0; k < 26; k++) { const u = R() * 2 - 1, ph = R() * 6.283, d = new THREE.Vector3(Math.sqrt(1 - u * u) * Math.cos(ph), u, Math.sqrt(1 - u * u) * Math.sin(ph));
        const g = SK.cone(.006, .022, 3); g.translate(0, r * .7 + .011, 0); g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), d)); P.add(g, [tx, ty, tz], 0, 0, plantShade(col, .9 + R() * .25)); } } },
  // amber resin bleeding from a cut pine stump: the stump, its rings, and drips that catch the light
  resin(P, R, col, stem) { P.add(SK.bumpy(SK.cyl(.15, .19, .34, 11, 3), .015, 12, 4), [0, .17, 0], 0, 0, 0x4a3828); P.add(SK.cyl(.145, .145, .01, 11), [0, .345, 0], 0, 0, 0xa88a60);
    for (let i = 0; i < 4; i++) { const a = R() * 6.283; P.add(SK.limb(.2, .05, .02), [Math.sin(a) * .15, .04, Math.cos(a) * .15], [1.35, a, 0], 0, 0x3a2c20); }
    P.glow = true; for (let i = 0; i < 9; i++) { const a = R() * 6.283, y = .1 + R() * .22, l = .03 + R() * .05; P.add(SK.limb(l, .012, .007), [Math.sin(a) * .17, y, Math.cos(a) * .17], [0, 0, 0], 0, plantShade(col, .85 + R() * .3)); }
    P.add(SK.ball(.03, 8, 5, 0, 6.283, 0, 1.6), [.03, .35, -.02], 0, [1.3, .5, 1], col); P.glow = false; },
  // lichen bloom on a fallen dressed stone: grey-green plates of lichen and small gold cups rising from them
  lichen(P, R, col, stem) { P.add(SK.box(.6, .28, .4), [0, .13, 0], [0, .2, .05], 0, 0x8a8678);
    for (let i = 0; i < 16; i++) { const a = R() * 6.283, x = (R() - .5) * .5, z = (R() - .5) * .3; P.add(SK.cyl(.03 + R() * .03, .03 + R() * .03, .008, 9), [x, .275 + R() * .006, z], [0, a, 0], [1, 1, .7], plantMix(0x8a9a6a, 0xb8b890, R())); }
    for (let i = 0; i < 12; i++) { const x = (R() - .5) * .44, z = (R() - .5) * .26, h = .03 + R() * .03; P.add(plantStalk(h, .004, .003, 4), [x, .27, z], 0, 0, 0x9a9a70); P.add(SK.lathe([[.001, 0], [.012, .006], [.016, .016]], 7), [x, .27 + h, z], 0, 0, plantShade(col, .9 + R() * .2)); } },
  // a lily: strap leaves, a tall stem, two or three white trumpets turned out and down
  lily(P, R, col, stem) { for (let i = 0; i < 7; i++) { const a = i / 7 * 6.283 + R() * .3; P.add(plantStrap(.28 + R() * .08, .04, 6, .01, .08), [0, .01, 0], [-.9 - R() * .3, a, 0], 0, 0x3a5a40); }
    const t = .5 + R() * .1; P.add(plantStalk(t, .008, .006, 5), [0, 0, 0], 0, 0, stem);
    for (let k = 0; k < 3; k++) { const a = k * 2.1 + R() * .4; const g = SK.lathe([[.004, 0], [.01, .03], [.022, .07], [.045, .1], [.05, .102]], 10);
      P.add(g, [Math.sin(a) * .02, t - .02 - k * .03, Math.cos(a) * .02], [1.9 - k * .1, a, 0], 0, plantShade(col, .95 + R() * .08)); } },
  // a twisted knot of root on a cliff stone: grey bark limbs, and a few leaves where it still lives
  gnarl(P, R, col, stem) { P.add(SK.bumpy(SK.ball(1, 9, 6), .22, 5, 3), [0, .08, 0], 0, [.22, .14, .18], 0x7a7468);
    for (let i = 0; i < 7; i++) { const a = R() * 6.283; P.add(SK.limb(.22 + R() * .14, .035, .012), [Math.sin(a) * .08, .16, Math.cos(a) * .08], [1.1 + R() * .6, a, (R() - .5) * .6], 0, plantShade(col, .8 + R() * .3)); }
    for (let i = 0; i < 6; i++) { const a = R() * 6.283; P.add(plantLeaf(.08, .04, .01, .02), [Math.sin(a) * .12, .2, Math.cos(a) * .12], [-.3, a, 0], 0, 0x4a6a30); } },
  // a lotus of the sand: grey-green leaf pads on the ground and a flat many-pointed flower, pale rose
  lotus(P, R, col, stem) { for (let i = 0; i < 5; i++) { const a = i / 5 * 6.283 + R() * .4, r = .1 + R() * .05; P.add(SK.cyl(.08, .08, .006, 12, 1, false), [Math.sin(a) * r, .01, Math.cos(a) * r], [0, a, 0], [1, 1, .85], plantShade(0x7a8a6a, .9 + R() * .2)); }
    P.add(plantStalk(.08, .008, .007, 4), [0, 0, 0], 0, 0, stem);
    for (let ring = 0; ring < 3; ring++) { const n = 8 - ring, el = -.25 - ring * .45, L = .09 - ring * .015; for (let k = 0; k < n; k++) { const a = k / n * 6.283 + ring * .4; P.add(plantLeaf(L, .045, .008, -.01), [0, .08 + ring * .006, 0], [el, a, 0], 0, plantShade(col, .9 + ring * .07)); } }
    P.add(SK.cyl(.018, .014, .02, 8), [0, .1, 0], 0, 0, 0xd8b040); },
  // a dwarf fan palm: a short hairy trunk, stiff stalks, each a fan of narrow blades
  fanpalm(P, R, col, stem) { P.add(SK.bumpy(SK.cyl(.05, .07, .16, 8, 2), .01, 10, 1), [0, .08, 0], 0, 0, 0x6a5038);
    for (let f = 0; f < 9; f++) { const a = f / 9 * 6.283 + R() * .3, el = .5 + R() * .5, L = .32 + R() * .12; P.add(plantStalk(L, .007, .005, 4), [0, .15, 0], [el, a, 0], 0, stem);
      const tx = Math.sin(a) * Math.sin(el) * L, ty = .15 + Math.cos(el) * L, tz = Math.cos(a) * Math.sin(el) * L;
      for (let b = 0; b < 11; b++) { const fa = a + (b - 5) * .14; P.add(plantLeaf(.2, .025, .006, .03), [tx, ty, tz], [-(.6 - el * .5) + Math.abs(b - 5) * .05, fa, 0], 0, plantShade(col, .85 + R() * .25)); } } },
  // a sunflower of the terraces: rough leaves up a stalk and one or two heads of gold rays round a dark disc, turned to the sun
  sunpetal(P, R, col, stem) { for (let s = 0; s < 2; s++) { const a = s * 3 + R(), t = .5 + R() * .2 - s * .12, bx = Math.sin(a) * .05, bz = Math.cos(a) * .05; P.add(plantStalk(t, .012, .008, 5), [bx, 0, bz], 0, 0, stem);
      for (let k = 0; k < 4; k++) { const la = k * 2.4 + s; P.add(plantLeaf(.12, .08, .01, .04), [bx, .08 + k * t * .2, bz], [-.3, la, 0], 0, 0x4a6a28); }
      const hx = bx, hy = t, hz = bz + .02, face = [-.5, .35 * (s ? -1 : 1), 0];
      P.add(SK.cyl(.045, .045, .02, 14), [hx, hy, hz], [face[0] + Math.PI / 2, face[1], 0], 0, 0x3a2410);
      for (let k = 0; k < 18; k++) { const pa = k / 18 * 6.283; const g = plantLeaf(.085, .032, .006, 0); g.translate(0, 0, .035); g.rotateY(pa); g.rotateX(-Math.PI / 2 + .2); P.add(g, [hx, hy, hz], [face[0] + Math.PI / 2, face[1], 0], 0, plantShade(col, .9 + R() * .15)); } } },
  // sage: grey, felted leaves in pairs up square stems, and whorls of violet flowers at the tops
  sage(P, R, col, stem) { for (let s = 0; s < 6; s++) { const a = s * 1.05 + R() * .3, t = .25 + R() * .12, lean = .25 + R() * .15; P.add(plantStalk(t, .007, .005, 4), [0, 0, 0], [lean, a, 0], 0, stem);
      for (let k = 0; k < 4; k++) { const y = .05 + k * t * .2, ox = Math.sin(a) * Math.sin(lean) * y, oz = Math.cos(a) * Math.sin(lean) * y; for (const sd of [-1, 1]) P.add(plantLeaf(.07, .035, .01, .02), [ox, y, oz], [-.35, a + sd * 1.3 + k * .4, 0], 0, plantShade(0x8a9a80, .9 + R() * .15)); }
      const tx = Math.sin(a) * Math.sin(lean) * t, tz = Math.cos(a) * Math.sin(lean) * t; for (let k = 0; k < 4; k++) for (let q = 0; q < 4; q++) { const qa = q / 4 * 6.283; P.add(SK.ball(.011, 4, 3), [tx + Math.sin(qa) * .013, t + k * .022, tz + Math.cos(qa) * .013], 0, [1, 1.3, 1], plantShade(col, .9 + R() * .2)); } } },
  // a chilli: a small dark-leaved bush hung with long red pods
  chilli(P, R, col, stem) { for (let i = 0; i < 4; i++) { const a = R() * 6.283; P.add(plantStalk(.22, .01, .007, 4), [0, 0, 0], [.4, a, 0], 0, stem); }
    for (let i = 0; i < 16; i++) { const a = R() * 6.283, r = .05 + R() * .12, y = .14 + R() * .14; P.add(plantLeaf(.07, .035, .008, .02), [Math.sin(a) * r, y, Math.cos(a) * r], [-.1, a + R(), 0], 0, plantShade(0x2a4a20, .9 + R() * .2)); }
    for (let i = 0; i < 12; i++) { const a = R() * 6.283, r = .08 + R() * .1, y = .1 + R() * .14; P.add(SK.limb(.055, .009, .003), [Math.sin(a) * r, y + .06, Math.cos(a) * r], [.2 * (R() - .5), a, .2 * (R() - .5)], 0, plantShade(col, .85 + R() * .25)); } },
  // an aloe: a rosette of thick, pointed, upturned leaves, toothed along the edge, and one red flower spike
  aloe(P, R, col, stem) { for (let ring = 0; ring < 3; ring++) { const n = 7 - ring; for (let k = 0; k < n; k++) { const a = k / n * 6.283 + ring * .45, el = .5 + ring * .3, L = .22 - ring * .04;
      const g = SK.cone(.028, L, 4); g.scale(1, 1, .4); g.translate(0, L / 2, 0); P.add(g, [0, .01, 0], [el, a, 0], 0, plantShade(col, .85 + ring * .08 + R() * .1)); } }
    const t = .45; P.add(plantStalk(t, .008, .005, 4), [0, 0, 0], 0, 0, 0x6a7040); for (let k = 0; k < 12; k++) P.add(SK.limb(.025, .006, .004), [0, t - .12 + k * .011, 0], [2.6, k * 2.3, 0], 0, 0xd85030); },
  // a truffle in cracked desert ground: a low mound, broken plates of crust, and the warty dark tuber showing
  truffle(P, R, col, stem) { P.add(SK.bumpy(SK.ball(1, 12, 6, 0, 6.283, 0, 1.6), .2, 7, 2), [0, -.02, 0], 0, [.24, .06, .24], 0xa88a62);
    for (let i = 0; i < 7; i++) { const a = i / 7 * 6.283 + R() * .3, r = .13 + R() * .05; P.add(SK.box(.08 + R() * .04, .015, .06), [Math.sin(a) * r, .035, Math.cos(a) * r], [-.25, a, (R() - .5) * .3], 0, 0xc0a478); }
    P.add(SK.bumpy(SK.ball(1, 10, 7), .25, 13, 5), [.01, .04, 0], 0, [.05, .04, .045], col); },
  // kelp: long olive ribbons from a holdfast, waving
  kelp(P, R, col, stem) { P.add(SK.bumpy(SK.ball(1, 7, 5), .25, 7, 1), [0, .01, 0], 0, [.05, .03, .05], stem);
    for (let i = 0; i < 9; i++) { const a = R() * 6.283, L = .7 + R() * .5; P.add(plantStrap(L, .06, 10, .05, -.1), [0, .02, 0], [-1.2 - R() * .3, a, 0], 0, plantShade(col, .85 + R() * .3)); } },
  // a sea lily: a pale stalk and an open cup of feathered arms
  sealily(P, R, col, stem) { const t = .3 + R() * .08; P.add(plantStalk(t, .01, .007, 6), [0, 0, 0], [.05, 0, 0], 0, stem); P.add(SK.ball(.02, 7, 5), [0, t, 0], 0, 0, col);
    for (let k = 0; k < 10; k++) { const a = k / 10 * 6.283; for (let j = 0; j < 4; j++) P.add(plantLeaf(.04, .02, .005, -.01), [Math.sin(a) * j * .022, t + .01 + j * .02, Math.cos(a) * j * .022], [-.9 + j * .15, a, 0], 0, plantShade(col, .9 + j * .04)); } },
  // pearlweed: fine strands strung with pale beads that shine a little in the dark
  pearl(P, R, col, stem) { for (let i = 0; i < 9; i++) { const a = R() * 6.283, lean = .2 + R() * .4, L = .2 + R() * .14; P.add(plantBlade(L, .004, .03), [0, 0, 0], [lean, a, 0], 0, stem);
      P.glow = true; for (let k = 2; k < 8; k++) { const y = L * k / 8; P.add(SK.ball(.01 + R() * .005, 5, 4), [Math.sin(a) * Math.sin(lean) * y, Math.cos(lean) * y, Math.cos(a) * Math.sin(lean) * y], 0, 0, plantShade(col, .9 + R() * .2)); } P.glow = false; } },
};

// ── the herbs, by island. `game` marks the eighteen the game has now; the rest are OG-039's proposals. col and stem are the game's
// HERB_DEF/sea colours where it has them; glow is HERB_DEF's [glowCol, glowInt, glowRad] (the sea's herbs carry none: 0x88aaaa, .3, 1.3).
const G = (name, kind, col, stem, glow, o = {}) => ({ name, kind, col, stem, glow, ...o });
export const HERBS = {
  // the Gatelands: the game's own, as OG-039 draws them (Heartroot stays amber)
  firemoss: G('Firemoss', 'moss', 0xcc4411, 0x6a2808, [0xff6622, .6, 1.8], { island: 'gatelands', game: 1, on: 'stone', where: 'rock, moor and wastes' }),
  deepmoss: G('Deepmoss', 'moss', 0x116622, 0x0a3a12, [0x22aa44, .3, 1.4], { island: 'gatelands', game: 1, where: 'the forest floor' }),
  silverleaf: G('Silverleaf', 'herb', 0xc8ddc8, 0x3a6a3a, [0xaaccaa, .4, 1.6], { island: 'gatelands', game: 1, where: 'meadows' }),
  briarweed: G('Briarweed', 'bramble', 0x7a5522, 0x4a2a10, [0x996633, .3, 1.4], { island: 'gatelands', game: 1, where: 'hedges and woods' }),
  graywort: G('Graywort', 'rosette', 0xaaaaaa, 0x666666, [0xcccccc, .2, 1.2], { island: 'gatelands', game: 1, where: 'road edges' }),
  veilwort: G('Veilwort', 'wisp', 0xeeeebb, 0x9a9a70, [0xffffcc, .3, 1.4], { island: 'gatelands', game: 1, where: 'old walls' }),
  duilleogghorm: G('Duilleog Ghorm', 'broadleaf', 0x2244aa, 0x1a2a5a, [0x4466ff, .5, 1.6], { island: 'gatelands', game: 1, where: 'coast, fen and ruins' }),
  goldenrod: G('Goldenrod', 'goldenrod', 0xddaa22, 0x5a7020, [0xffcc44, .4, 1.5], { island: 'gatelands', game: 1, where: 'roadsides' }),
  thornberry: G('Thornberry', 'bush', 0xcc2222, 0x3a2a1a, [0xff4444, .4, 1.6], { island: 'gatelands', game: 1, where: 'hedgerows' }),
  caorthann: G('Caorthann', 'sapling', 0xdd3322, 0x5a3a20, [0xff5533, .4, 1.6], { island: 'gatelands', game: 1, where: 'autumn woods' }),
  caordubh: G('Caor Dubh', 'lowbush', 0x110011, 0x2a1a2a, [0x440044, .3, 1.3], { island: 'gatelands', game: 1, where: 'dark woods' }),
  heartroot: G('Heartroot', 'root', 0xffaa22, 0x6a4010, [0xff8800, .9, 2.0], { island: 'gatelands', game: 1, where: 'old woods, rare' }),
  fearnog: G('Fearnóg', 'bracket', 0xcc6622, 0x4a3a2a, [0xff8833, .3, 1.4], { island: 'gatelands', game: 1, where: 'stumps in woods' }),
  shadowcap: G('Shadowcap', 'mushrooms', 0x441166, 0x220833, [0x8833cc, .5, 1.5], { island: 'gatelands', game: 1, where: 'where light never reaches' }),
  mistfern: G('Mist Fern', 'fern', 0xccddcc, 0x5a7a5a, [0xddeedd, .3, 1.5], { island: 'gatelands', game: 1, where: 'valley fog' }),
  luibhuisce: G('Luibh Uisce', 'waterleaf', 0x44ccaa, 0x1a6a5a, [0x44ffcc, .6, 1.8], { island: 'gatelands', game: 1, wet: 1, where: 'forest streams' }),
  ashwort: G('Ashwort', 'shrub', 0x7a8a5a, 0x4a5a2a, [0xaabb88, .3, 1.4], { island: 'gatelands', game: 1, where: 'the moor' }),
  muirfhear: G('Muirfhear', 'tussock', 0x2a3a18, 0x1a2a08, [0x446622, .3, 1.3], { island: 'gatelands', game: 1, where: 'the moor' }),
  // the Mark: the game's four that belong there (Wolf's Bane, Coldmoss, Stonecress, Ferrous Weed, Cré Dearg as red clay) and OG-039's new
  wolfsbane: G("Wolf's Bane", 'flowerspike', 0xeeeedd, 0x4a5a3a, [0xffffee, .4, 1.5], { island: 'mark', game: 1, where: 'high forests, rare' }),
  coldmoss: G('Coldmoss', 'moss', 0x7799bb, 0x3a4a5a, [0x88aaff, .4, 1.6], { island: 'mark', game: 1, on: 'stone', where: 'tundra and old stone' }),
  stonecress: G('Stonecress', 'cliffflower', 0xddcc66, 0x5a6a3a, [0xffee88, .3, 1.4], { island: 'mark', game: 1, on: 'stone', where: 'cliff faces' }),
  ferrousweed: G('Ferrous Weed', 'thistle', 0xaa4422, 0x5a2a10, [0xcc5522, .3, 1.4], { island: 'mark', game: 1, where: 'iron ground' }),
  credearg: G('Cré Dearg', 'clay', 0xcc4422, 0x6a2a1a, [0xff5533, .3, 1.4], { island: 'mark', game: 1, wet: 1, where: 'riverbeds' }),
  icebloom: G('Icebloom', 'icebloom', 0xcfe8f8, 0x5a6a68, [0xaaddff, .5, 1.6], { island: 'mark', where: 'snowfields' }),
  frostcap: G('Frostcap', 'mushrooms', 0x7a4aa8, 0x3a2a4a, [0xaa88ff, .4, 1.4], { island: 'mark', where: 'pine woods' }),
  stormthistle: G('Stormthistle', 'globe', 0x5a7ac8, 0x5a6a58, [0x88aaff, .4, 1.6], { island: 'mark', where: 'storm coasts' }),
  rimeberry: G('Rimeberry', 'lowbush', 0x3a4a3a, 0x3a3a2a, [0xcce0ff, .3, 1.4], { island: 'mark', berry: 0xc8d8ea, where: 'heath' }),
  snowthyme: G('Snowthyme', 'moss', 0x5a6a4a, 0x3a4a2a, [0xeeccee, .3, 1.3], { island: 'mark', where: 'high pasture' }),
  pineresin: G('Pine Resin', 'resin', 0xe09020, 0x4a3828, [0xffaa33, .5, 1.5], { island: 'mark', where: 'cut pines' }),
  lichenbloom: G('Lichenbloom', 'lichen', 0xd8c050, 0x9a9a70, [0xeedd77, .4, 1.5], { island: 'mark', where: 'high ruins' }),
  shardmoss: G('Shardmoss', 'moss', 0x3a5a5a, 0x2a3a3a, [0x88eeff, .6, 1.6], { island: 'mark', on: 'stone', where: 'cave walls' }),
  glacierlily: G('Glacier Lily', 'lily', 0xeef4fa, 0x4a6a50, [0xddeeff, .4, 1.5], { island: 'mark', where: 'glacier edges' }),
  gnarlroot: G('Gnarlroot', 'gnarl', 0x6a5a48, 0x4a3a2a, [0xaa8866, .3, 1.4], { island: 'mark', where: 'cliffs' }),
  // Aurenne: OG-039's new plants and the game's three sea herbs
  sandlotus: G('Sandlotus', 'lotus', 0xf0c8c0, 0x6a7a5a, [0xffd8d0, .4, 1.5], { island: 'aurenne', where: 'dunes' }),
  amberbloom: G('Amberbloom', 'flowerspike', 0xe88a20, 0x5a6a30, [0xff9933, .5, 1.6], { island: 'aurenne', where: 'dry hills' }),
  sagepalm: G('Sagepalm', 'fanpalm', 0x7a9a70, 0x6a6a40, [0xaaccaa, .3, 1.5], { island: 'aurenne', where: 'the maquis' }),
  sunpetal: G('Sunpetal', 'sunpetal', 0xf0b820, 0x5a7030, [0xffcc33, .5, 1.6], { island: 'aurenne', where: 'terraces' }),
  saltthorn: G('Saltthorn', 'shrub', 0x7a9070, 0x7a7060, [0xeeeeee, .3, 1.4], { island: 'aurenne', where: 'salt flats' }),
  drakesage: G('Drakesage', 'sage', 0x8a5ac0, 0x6a7058, [0xaa77ee, .4, 1.5], { island: 'aurenne', where: 'limestone' }),
  spicethorn: G('Spicethorn', 'chilli', 0xd02818, 0x3a5a28, [0xff4422, .4, 1.5], { island: 'aurenne', where: 'gardens and walls' }),
  jadealoe: G('Jade Aloe', 'aloe', 0x5a9a78, 0x5a6a48, [0x77ccaa, .4, 1.5], { island: 'aurenne', where: 'rocky coast' }),
  cyprusblossom: G('Cyprus Blossom', 'bush', 0xf0c0d8, 0x4a3a2a, [0xffccee, .4, 1.6], { island: 'aurenne', where: 'hillside groves' }),
  deserttruffle: G('Desert Truffle', 'truffle', 0x3a2a20, 0x8a6a48, [0xaa8866, .3, 1.3], { island: 'aurenne', where: 'under the sand' }),
  sunfungus: G('Sunfungus', 'bracket', 0xe8b030, 0x9a8670, [0xffcc44, .4, 1.5], { island: 'aurenne', where: 'canyon walls' }),
  kelp: G('Kelp', 'kelp', 0x2a6a4a, 0x1e4a34, [0x88aaaa, .3, 1.3], { island: 'aurenne', game: 1, sea: 1, where: 'the sea bed' }),
  sealily: G('Sea Lily', 'sealily', 0xd8d0f0, 0x6a6a8a, [0x88aaaa, .3, 1.3], { island: 'aurenne', game: 1, sea: 1, where: 'the sea bed' }),
  pearlweed: G('Pearlweed', 'pearl', 0xc0e0e8, 0x4a6a6a, [0x88aaaa, .3, 1.3], { island: 'aurenne', game: 1, sea: 1, where: 'the sea bed' }),
};
export const ISLANDS = ['gatelands', 'mark', 'aurenne'];
export const byIsland = isl => Object.keys(HERBS).filter(k => HERBS[k].island === isl);

// ── bake: one geometry with vertex colours shaded darker toward the ground (as Plant.bake), one for the glowing parts ──
function bake(parts, lift) {
  const out = [[], []]; let top = .001;
  for (const [g, m, c, glow] of parts) { let gg = g.index ? g.toNonIndexed() : g.clone(); g.dispose(); gg.deleteAttribute('uv'); gg.deleteAttribute('normal'); gg.applyMatrix4(m); gg.computeVertexNormals();
    const p = gg.attributes.position; for (let i = 0; i < p.count; i++) top = Math.max(top, p.getY(i)); out[glow ? 1 : 0].push([gg, c]); }
  const hsl = {}, res = out.map(L => { if (!L.length) return null;
    for (const [gg, c0] of L) { const c = c0.clone(); if (lift) { c.getHSL(hsl); c.setHSL(hsl.h, Math.min(1, hsl.s * 1.18), Math.min(.92, hsl.l * 1.1 + .02)); }
      const p = gg.attributes.position, col = new Float32Array(p.count * 3); for (let i = 0; i < p.count; i++) { const k = .55 + .45 * Math.min(1, Math.max(0, p.getY(i) / top)); col[i * 3] = c.r * k; col[i * 3 + 1] = c.g * k; col[i * 3 + 2] = c.b * k; }
      gg.setAttribute('color', new THREE.BufferAttribute(col, 3)); }
    return mergeGeometries(L.map(x => x[0])); });
  return { body: res[0], glow: res[1], top };
}
const MAT = new THREE.MeshStandardMaterial({ vertexColors: true, side: THREE.DoubleSide, roughness: .82, metalness: 0 });
const GLOW_MAT = new THREE.MeshStandardMaterial({ vertexColors: true, side: THREE.DoubleSide, roughness: .4, metalness: 0, emissive: 0xffffff, emissiveIntensity: .55 });
GLOW_MAT.onBeforeCompile = s => { s.fragmentShader = s.fragmentShader.replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\n totalEmissiveRadiance *= diffuseColor.rgb;'); };
let _halo = null;
export function haloTex() { if (_halo) return _halo; const c = document.createElement('canvas'); c.width = c.height = 64; const x = c.getContext('2d'), g = x.createRadialGradient(32, 32, 0, 32, 32, 32);
  g.addColorStop(0, 'rgba(255,255,255,.9)'); g.addColorStop(.3, 'rgba(255,255,255,.35)'); g.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = g; x.fillRect(0, 0, 64, 64); _halo = new THREE.CanvasTexture(c); return _halo; }
let _glint = null;
export function glintTex() { if (_glint) return _glint; const c = document.createElement('canvas'); c.width = c.height = 64; const x = c.getContext('2d');
  const g = x.createRadialGradient(32, 32, 0, 32, 32, 10); g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = g; x.fillRect(0, 0, 64, 64);
  x.globalCompositeOperation = 'lighter'; for (const [w, h] of [[30, 1.6], [1.6, 30]]) { const l = x.createLinearGradient(32 - w, 32 - h, 32 + w, 32 + h); l.addColorStop(0, 'rgba(255,255,255,0)'); l.addColorStop(.5, 'rgba(255,255,255,.95)'); l.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = l; x.fillRect(32 - w, 32 - h, w * 2, h * 2); }
  _glint = new THREE.CanvasTexture(c); return _glint; }

const tris = g => g ? (g.index ? g.index.count : g.attributes.position.count) / 3 : 0;
export function herb(key, mode = 'true', seed = 0) {
  const d = HERBS[key]; if (!d) throw new Error('no herb ' + key);
  const P = new Plant(), R = plantRng(key + (seed ? ':' + seed : ''));
  PLANT_BUILD[d.kind](P, R, d.col, d.stem, key, d.berry);
  const lift = mode === 'lifted', B = bake(P.parts, lift), k = HERB_K * (lift ? 1.15 : 1), group = new THREE.Group(); group.name = 'herb:' + key;
  const inner = new THREE.Group(); inner.scale.setScalar(k); group.add(inner); let draws = 0;
  const m = new THREE.Mesh(B.body, MAT); m.castShadow = m.receiveShadow = true; inner.add(m); draws++;
  if (B.glow) { const gm = new THREE.Mesh(B.glow, GLOW_MAT); gm.castShadow = true; inner.add(gm); draws++; }
  const top = B.top * k; B.body.computeBoundingBox(); const bb = B.body.boundingBox, spread = Math.max(bb.max.x - bb.min.x, bb.max.z - bb.min.z) * k;
  if (mode === 'glow') { const [gc, gi, gr] = d.glow, L = new THREE.PointLight(gc, gi * 2.2, gr * HERB_K, 1.5); L.position.y = Math.max(.2, top * .6); group.add(L);
    const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: haloTex(), color: gc, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: .55 })); s.scale.setScalar(Math.max(.6, spread * 1.6)); s.position.y = Math.max(.15, top * .55); group.add(s); draws++; group.userData.light = L; }
  if (lift) { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: glintTex(), color: new THREE.Color(d.glow[0]).lerp(new THREE.Color(1, 1, 1), .6), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: .9 }));
    s.scale.setScalar(.32); s.position.set(spread * .15, top * .85 + .03, 0); s.name = 'glint'; group.add(s); group.userData.glint = s; }
  return { key, name: d.name, island: d.island, game: !!d.game, group, tris: tris(B.body) + tris(B.glow), draws, top: +top.toFixed(3), spread: +spread.toFixed(3) };
}
