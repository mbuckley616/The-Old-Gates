// A lesser gate's outside (Session 2616; backlog L5, "The gate outside", OG-037; Michael's answer of 12 Oct: "the gate's outside is
// concentric rings, a broken circle for a failing gate"). Every lesser gate in the game is still S578's turf mound of 4 m with a plank
// door of 1.5 by 2.7 m (`buildOldGateFront`, js/24-forts.js), while the hall behind it is a nave 26 m wide under a 50 m vault (card F5).
// This is OG-037's first variation (V1) at a lesser gate's size, the hill it is cut into drawn with it:
//   - the rings: four concentric courses of voussoirs on one centre CY over the court, so their lower arcs run under the ground ("rings
//     emerging from the hillside and disappearing underground"), each set STEP deeper than the last and a fifth less across; dressed
//     reveals between them (one lathe about the rings' axis, each 0.3 m behind its ring's soffit, as the Hollow Below's);
//   - the spine: the back plate behind the inner ring, the slit door in it between two pillars of script, the ring sigil over the door
//     ("a narrow, dark slit entrance, not a door, a passage");
//   - the script: a band of the Weaver glyphs across every voussoir's face and up both pillars, lit amber ("amber light, not magic");
//   - the face: the hill's cut front, a headwall of rough rock round the outer ring, its top following the hill; the hill behind a dome
//     of turf with rock where it is steep, a notch cut down to the court before the rings; a court of slabs at the door;
//   - a small camp at the foot (OG-037): two ridge tents, a fire ring, crates and a pole with a pennant; and a 1.75 m post for scale.
// The three conditions (canon Part I; gatekit.js's rule for stones): 'steady' whole, the script burning; 'failing' OG-037's V3, the broken
// circle: the outer ring has lost its upper right quarter, its stones fallen on the court and the apron, three of the second ring slipped
// out, the script dead on two stones in five and dim on the rest; 'catastrophic' the outer two rings broken open, their lost stones hung
// in the air off their seats with violet in the seams, the script dead, the slit lit violet from within.
// SIZES (the question): 's' the door as today's (1.5 by 2.8 m) and rings 13 m across; 'm' a door of 2.4 by 5.5 and rings 26 m across;
// 'l' a door of 3.6 by 11 and rings 50 m across. A metre a unit, y 0 the court at the door, the face toward +z.
// gateMouth({ size, cond, key, camp }) -> { group, tris, draws, ground(x, z), R0, CY, rings, door, lost, hung, hill, camp, figure, counts }
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { mat, worldUV, fbm, sstep } from './common.js';
import { stream } from './pieces.js';

export const SIZES = {
  s: { R0: 6.5, door: { w: 1.5, h: 2.8 } },
  m: { R0: 13, door: { w: 2.4, h: 5.5 } },
  l: { R0: 25, door: { w: 3.6, h: 11 } },
};

export function gateMouth(o = {}) {
  const SZ = SIZES[o.size] ? o.size : 'm', { R0, door: D0 } = SIZES[SZ], cond = ['steady', 'failing', 'catastrophic'].includes(o.cond) ? o.cond : 'steady';
  const key = (o.key || 'gate:mouth') + ':' + SZ, r = stream(key), DEG = Math.PI / 180, group = new THREE.Group();
  const CY = R0 * .34, STEP = R0 * .3, W0 = R0 * .19, ZF0 = R0 * .12, PROUD = STEP * .45;
  const RINGS = [0, 1, 2, 3].map(k => { const ro = R0 * (1 - k * .18), ri = ro - W0 * (1 - k * .14); return { k, ro: +ro.toFixed(2), ri: +ri.toFixed(2), zf: +(ZF0 - k * STEP).toFixed(2), n: [36, 30, 24, 18][k] }; });
  const PLATE = RINGS[3].zf - STEP, HW = R0 * 1.28;
  const B = new Map(), put = (k, g) => { const x = g.index ? g.toNonIndexed() : g; for (const a of Object.keys(x.attributes)) if (!['position', 'normal', 'uv', 'color'].includes(a)) x.deleteAttribute(a); if (!x.attributes.normal) x.computeVertexNormals(); if (!x.attributes.uv) worldUV(x, .25); (B.get(k) || B.set(k, []).get(k)).push(x); return x; };
  const bb = g => { g.computeBoundingBox(); return g.boundingBox; };
  // ── the hill: a dome of turf centred behind the face, a notch cut down to the court before the rings, the apron falling away in front
  const HH = CY + R0 * 1.75, HA = R0 * 3.0, HC = R0 * 2.6, HZ = -R0 * 1.1;
  const dome = (x, z) => { const d = Math.hypot(x / HA, (z - HZ) / HC); return HH * (1 - sstep(0, 1, d) ** 1.3) + R0 * .1 * fbm(x / (R0 * 1.1) + 3, z / (R0 * 1.1), 3); };
  const FZ = ZF0 - STEP * .55, holeR = R0 * .99 - .15; /* the face: the headwall's front, and its hole for the outer ring */
  const notch = (x, z) => { const ax = Math.abs(x), side = sstep(HW + R0 * .35, HW - R0 * .05, ax), front = ax < HW ? (z > FZ - .8 ? 1 : 0) : sstep(FZ - R0 * .3, FZ + R0 * .1, z); return side * front; };
  const apron = (x, z) => -Math.max(0, z - R0 * .9) * .06 + .25 * fbm(x / 6, z / 6, 2) * sstep(R0 * .6, R0 * 1.2, z);
  const ground = (x, z) => { const h = dome(x, z), cut = notch(x, z), base = apron(x, z); const b = base - .12 * sstep(HW, HW - R0 * .2, Math.abs(x)) * cut; return Math.max(b, h * (1 - cut) + b * cut); };
  { const S = HA * 2.3, N = SZ === 'l' ? 150 : 120, g = new THREE.PlaneGeometry(S, S, N, N); g.rotateX(-Math.PI / 2); g.translate(0, 0, HZ + S * .18); const P = g.attributes.position;
    for (let i = 0; i < P.count; i++) P.setY(i, ground(P.getX(i), P.getZ(i))); g.computeVertexNormals(); const Nn = g.attributes.normal, col = [];
    for (let i = 0; i < P.count; i++) { const x = P.getX(i), z = P.getZ(i), y = P.getY(i), steep = sstep(.62, .38, Nn.getY(i)), v = .5 + .5 * fbm(x / 9, z / 9, 3), court = notch(x, z) * sstep(R0 * 1.1, R0 * .7, Math.abs(x)) * sstep(R0 * 1.3, R0 * .8, z);
      const grass = [.32 + .1 * v, .42 + .1 * v, .2 + .05 * v], rock = [.36 + .08 * v, .34 + .08 * v, .3 + .06 * v], worn = [.42 + .06 * v, .4 + .06 * v, .3 + .04 * v];
      const t = Math.max(steep, sstep(HH * .82, HH, y) * .35); col.push(...grass.map((c, j) => { const a = c + (rock[j] - c) * t; return a + (worn[j] - a) * court * .7; })); }
    g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3)); worldUV(g, .2);
    // the land cannot overhang: the step from the hill to the court is made inside the headwall's thickness, and the triangles that cross it
    // in front of the outer ring's opening are dropped, so nothing of the hill stands in the rings
    const X = g.toNonIndexed(), XP = X.attributes.position, keep = []; for (let t = 0; t < XP.count; t += 3) { const zs = [0, 1, 2].map(j => XP.getZ(t + j)), cx = (XP.getX(t) + XP.getX(t + 1) + XP.getX(t + 2)) / 3;
      if (Math.abs(cx) < holeR + 1.5 && Math.min(...zs) <= FZ - .8 && Math.max(...zs) > FZ - .8) continue; keep.push(t); }
    const out = new THREE.BufferGeometry(); for (const a of ['position', 'normal', 'uv', 'color']) { const src = X.attributes[a], n = src.itemSize, arr = new Float32Array(keep.length * 3 * n); keep.forEach((t, i) => { for (let j = 0; j < 3 * n; j++) arr[i * 3 * n + j] = src.array[t * n + j]; }); out.setAttribute(a, new THREE.BufferAttribute(arr, n)); }
    B.set('land', [out]); }
  // ── the headwall: the hill's cut front in rough rock, a hole for the outer ring, its top the hill's line at the face
  { const topAt = x => dome(x, FZ + .5) + .3, sh = new THREE.Shape(), N = 40; sh.moveTo(-HW, -1);
    for (let k = 0; k <= N; k++) { const x = -HW + 2 * HW * k / N; sh.lineTo(x, topAt(x)); } sh.lineTo(HW, -1); sh.lineTo(-HW, -1);
    const hole = new THREE.Path(); hole.absarc(0, CY, holeR, 0, Math.PI * 2, true); sh.holes.push(hole);
    const g = new THREE.ExtrudeGeometry(sh, { depth: R0 * .5, bevelEnabled: false, curveSegments: 48 }); g.translate(0, 0, FZ - R0 * .5);
    const P = g.attributes.position; for (let i = 0; i < P.count; i++) { const x = P.getX(i), y = P.getY(i), z = P.getZ(i); if (z > FZ - .01 && Math.hypot(x, y - CY) > holeR + .4) P.setZ(i, z + R0 * .05 * fbm(x / 3, y / 3, 3)); }
    g.computeVertexNormals(); worldUV(g, .12); put('rock', g); }
  // ── the rings: voussoirs about (0, CY), from the top clockwise seen from the front; each from its face back to the next ring's face
  const at = (t, rr) => [rr * Math.sin(t), CY + rr * Math.cos(t)];
  const wedge = (ta, tb, ra, rb, z1, z0, gap = .05) => { const out = [], qd = [at(ta, ra), at(tb, ra), at(tb, rb), at(ta, rb)], c = qd.reduce((s, p) => [s[0] + p[0] / 4, s[1] + p[1] / 4], [0, 0]);
    const k = 1 - gap / Math.max(...qd.map(p => Math.hypot(p[0] - c[0], p[1] - c[1]))); let p = qd.map(v => [c[0] + (v[0] - c[0]) * k, c[1] + (v[1] - c[1]) * k]); let ar = 0; for (let i = 0; i < 4; i++) { const j = (i + 1) % 4; ar += p[i][0] * p[j][1] - p[j][0] * p[i][1]; } if (ar < 0) p = p.reverse();
    const F = p.map(v => [v[0], v[1], z1]), Bk = p.map(v => [v[0], v[1], z0]), tri = (a, b, d) => out.push(...a, ...b, ...d);
    tri(F[0], F[1], F[2]); tri(F[0], F[2], F[3]); tri(Bk[0], Bk[2], Bk[1]); tri(Bk[0], Bk[3], Bk[2]); for (let i = 0; i < 4; i++) { const j = (i + 1) % 4; tri(F[i], Bk[i], Bk[j]); tri(F[i], Bk[j], F[j]); }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(out, 3)); g.computeVertexNormals(); return { g, c }; };
  const BW = W0 * .3, band = (ta, tb, rm, z, v0) => { const n = 3, pos = [], uv = [], L = rm * (tb - ta); for (let i = 0; i <= n; i++) { const t = ta + (tb - ta) * i / n, [x0, y0] = at(t, rm - BW), [x1, y1] = at(t, rm + BW); pos.push(x0, y0, z, x1, y1, z); uv.push(0, (v0 + L * i / n) / (BW * 12), 1, (v0 + L * i / n) / (BW * 12)); }
    const idx = []; for (let i = 0; i < n; i++) { const a = i * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); } const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx); const x = g.toNonIndexed(); x.computeVertexNormals(); return x; };
  // what each condition takes: the arcs lost (degrees from the top, clockwise seen from the front) and what becomes of the stones
  const LOSS = cond === 'failing' ? { 0: [18, 88] } : cond === 'catastrophic' ? { 0: [-35, 100], 1: [-5, 70] } : {};
  const lostAt = (k, t) => { const a = LOSS[k]; return a && t / DEG > a[0] && t / DEG < a[1]; };
  const lost = [], hung = [], rl = stream(key + ':lost'), rs = stream(key + ':script'), counts = { stones: 0, lit: 0, dim: 0, dead: 0, slipped: 0 };
  RINGS.forEach(R => { R.gone = 0; let v = 0; const z0 = R.k < 3 ? RINGS[R.k + 1].zf + .02 : PLATE + .02;
    for (let i = 0; i < R.n; i++) { const ta = (i / R.n + (R.k % 2) * .5 / R.n) * Math.PI * 2 - Math.PI, tb = ta + Math.PI * 2 / R.n, tm = (ta + tb) / 2, zf = R.zf + (r() - .5) * .04 * R0 / 6.5;
      if (CY + R.ro * Math.cos(tm) < -.6 && CY + R.ri * Math.cos(tm) < -.6) continue; /* wholly under the court */
      counts.stones++; const { g, c } = wedge(ta, tb, R.ri, R.ro, zf + PROUD, z0), s = band(ta, tb, (R.ri + R.ro) / 2, zf + PROUD + .03, v); v += (R.ri + R.ro) / 2 * (tb - ta);
      if (lostAt(R.k, tm)) { R.gone++; const dz = (zf + PROUD + z0) / 2;
        if (cond === 'catastrophic') { /* hung off its seat: out along its radius and toward the front, turned, violet in its seams */
          const lift = R0 * (.03 + rl() * .1), fw = R0 * (.02 + rl() * .1), M = new THREE.Matrix4().makeTranslation(c[0] + Math.sin(tm) * lift, c[1] + Math.cos(tm) * lift, dz + PROUD / 2 + fw)
            .multiply(new THREE.Matrix4().makeRotationFromEuler(new THREE.Euler((rl() - .5) * .45, (rl() - .5) * .45, (rl() - .5) * .6))).multiply(new THREE.Matrix4().makeTranslation(-c[0], -c[1], -dz));
          put('stone', g.applyMatrix4(M)); put('dead', s.applyMatrix4(M)); counts.dead++;
          put('seam', wedge(ta + .01, tb - .01, R.ri - .02, R.ri + .06, zf + PROUD - .1, z0 + .1, 0).g); /* the empty seat: violet light along the soffit below where it hung */
          hung.push({ ring: R.k, t: +(tm / DEG).toFixed(1), lift: +lift.toFixed(2) }); continue; }
        /* fallen: down the face onto the court and the apron below its seat, turned, bedded a sixth of its least depth */
        g.translate(-c[0], -c[1], -dz); g.applyMatrix4(new THREE.Matrix4().makeRotationFromEuler(new THREE.Euler(rl() * Math.PI * 2, rl() * Math.PI * 2, rl() * Math.PI * 2)));
        const x = c[0] * (.75 + rl() * .35) + (rl() - .5) * R0 * .3, z = ZF0 + R0 * (.25 + rl() * .7), b0 = bb(g), dd = Math.min(b0.max.x - b0.min.x, b0.max.y - b0.min.y, b0.max.z - b0.min.z);
        const yc = Math.min(...[[0, 0], [1, 1], [-1, 1], [1, -1], [-1, -1]].map(([u, w]) => ground(x + u * dd, z + w * dd))); g.translate(x, yc - b0.min.y - dd / 6, z); put('stone', g);
        lost.push({ ring: R.k, t: +(tm / DEG).toFixed(1), x: +x.toFixed(1), z: +z.toFixed(1) }); continue; }
      let M = null; if (cond !== 'steady' && R.k === 1 && R.slipped !== 3 && tm / DEG > 95 && tm / DEG < 150) { R.slipped = (R.slipped || 0) + 1; counts.slipped++; const out = R0 * (.03 + r() * .05);
        M = new THREE.Matrix4().makeTranslation(c[0] + Math.sin(tm) * out, c[1] + Math.cos(tm) * out - .05 * R0 / 6.5, (r() - .5) * .1 * R0 / 6.5).multiply(new THREE.Matrix4().makeRotationFromEuler(new THREE.Euler(0, 0, (r() - .5) * 5 * DEG))).multiply(new THREE.Matrix4().makeTranslation(-c[0], -c[1], 0)); }
      put('stone', M ? g.applyMatrix4(M) : g);
      // the script on this stone: burning, dim or dead by the condition
      const u = rs(), k = cond === 'steady' ? 'lit' : cond === 'failing' ? (u < .4 ? 'dead' : 'dim') : 'dead'; counts[k]++; put(k, M ? s.applyMatrix4(M) : s); } });
  // ── the reveals between the rings and the back plate (a lathe about the rings' axis), the floor through them at the court's level
  { const rv = k => RINGS[k].ri + .3, pr = [[holeR + .05, FZ], [rv(0), FZ], [rv(0), RINGS[1].zf], [rv(1), RINGS[1].zf], [rv(1), RINGS[2].zf], [rv(2), RINGS[2].zf], [rv(2), RINGS[3].zf], [rv(3), RINGS[3].zf], [rv(3), PLATE], [.01, PLATE]].map(([a, b]) => new THREE.Vector2(a, b));
    const g = new THREE.LatheGeometry(pr, 72); g.rotateX(Math.PI / 2); g.translate(0, CY, 0); g.computeVertexNormals(); put('dressed', g); }
  { const half = rr => Math.sqrt(Math.max(0, rr * rr - CY * CY)), zs = [ZF0 + .4, RINGS[1].zf, RINGS[2].zf, RINGS[3].zf, PLATE]; for (let k = 0; k < 4; k++) { const w = 2 * half(RINGS[k].ri + .3) + .2, g = new THREE.BoxGeometry(w, .6, zs[k] - zs[k + 1]); g.translate(0, -.3, (zs[k] + zs[k + 1]) / 2); put('dressed', g); } }
  // ── the spine: the slit door in the back plate between two pillars of script, a lintel, the ring sigil over it
  const door = { w: D0.w, h: D0.h, z: +PLATE.toFixed(2) }, PW = Math.max(.7, door.w * .42), PH = Math.min(door.h * 1.3, CY + RINGS[3].ri - .4);
  { const g = new THREE.PlaneGeometry(door.w, door.h); g.translate(0, door.h / 2, PLATE + .03); put(cond === 'catastrophic' ? 'rift' : 'door', g);
    for (const s of [-1, 1]) { const x = s * (door.w / 2 + PW / 2), j = new THREE.BoxGeometry(PW, PH, PW * .7); j.translate(x, PH / 2, PLATE + PW * .35); put('stone', j);
      const st = new THREE.PlaneGeometry(PW * .5, PH * .92); st.translate(x, PH / 2, PLATE + PW * .7 + .02); const uv = st.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setY(i, uv.getY(i) * PH / (PW * .5) / 6); put(cond === 'steady' ? 'litD' : cond === 'failing' ? (s < 0 ? 'dimD' : 'deadD') : 'deadD', st); }
    const LH = Math.min(PW * .8, R0 * .1), l = new THREE.BoxGeometry(door.w + 2 * PW + .2, LH, PW * .8); l.translate(0, Math.min(door.h, PH - LH) + LH / 2, PLATE + PW * .4); put('stone', l);
    const sr = Math.min(RINGS[3].ri * .55, (CY + RINGS[3].ri - door.h - LH) * .48), sg = new THREE.PlaneGeometry(2 * sr, 2 * sr); sg.translate(0, door.h + LH + (CY + RINGS[3].ri - door.h - LH) * .5, PLATE + .05); door.sigil = +sr.toFixed(2);
    if (sr > .3) put(cond === 'steady' ? 'sigil' : cond === 'failing' ? 'sigilDim' : 'sigilDead', sg); }
  // ── the court: slabs before the rings, a few sunk; the steps of the apron's edge
  { const rc = stream(key + ':court'), SL = Math.max(1.2, R0 * .16), X0 = -R0 * .95, X1 = R0 * .95, Z0 = ZF0 + .4, Z1 = ZF0 + R0 * .85;
    for (let x = X0 + SL / 2; x < X1; x += SL) for (let z = Z0 + SL / 2; z < Z1; z += SL) { if (rc() < .12 && z > Z0 + SL * 2) continue; const sink = rc() < .1 ? .04 + rc() * .08 : 0, g = new THREE.BoxGeometry(SL - .04, .3, SL - .04);
      g.translate(x, Math.max(ground(x, z), 0) - .14 - sink, z); put('dressed', g); } }
  // ── the camp at the foot (OG-037): two ridge tents, a fire ring, crates, a pole and pennant; off the court to the left of the way in
  const camp = { x: -R0 * .95 - 4, z: ZF0 + R0 * .9 + 5 }; let figure = null;
  if (o.camp !== false) { const cx = camp.x, cz = camp.z, G = (x, z) => ground(x, z);
    const tent = (x, z, ry, L, Wd, Ht) => { const sh = new THREE.Shape(); sh.moveTo(-Wd / 2, 0); sh.lineTo(0, Ht); sh.lineTo(Wd / 2, 0); sh.lineTo(-Wd / 2, 0); const g = new THREE.ExtrudeGeometry(sh, { depth: L, bevelEnabled: false }); g.translate(0, 0, -L / 2); g.rotateY(ry); g.translate(x, G(x, z) - .05, z); worldUV(g, .5); put('canvas', g);
      for (const e of [-1, 1]) { const p = new THREE.CylinderGeometry(.04, .04, Ht + .25, 5); p.translate(0, (Ht + .25) / 2, e * L / 2); p.rotateY(ry); p.translate(x, G(x, z) - .05, z); put('wood', p); } };
    tent(cx - 1.5, cz, .5, 2.6, 2.0, 1.45); tent(cx + 2.4, cz - 1.2, -.35, 2.2, 1.8, 1.3);
    const fx = cx + .7, fz = cz + 2.6; for (let k = 0; k < 9; k++) { const a = k / 9 * Math.PI * 2, s = new THREE.DodecahedronGeometry(.16, 0); s.translate(fx + Math.cos(a) * .45, G(fx, fz) + .06, fz + Math.sin(a) * .45); put('rock', s); }
    { const e = new THREE.CylinderGeometry(.3, .34, .08, 9); e.translate(fx, G(fx, fz) + .04, fz); put('ember', e); for (let k = 0; k < 3; k++) { const l = new THREE.CylinderGeometry(.05, .05, .7, 5); l.rotateZ(Math.PI / 2); l.rotateY(k * 1.1); l.translate(fx, G(fx, fz) + .12, fz); put('wood', l); } }
    for (const [x, z, s] of [[cx + 3.6, cz + 1.2, .55], [cx + 4.1, cz + 1.9, .45], [cx + 3.7, cz + 1.6, .4]]) { const b = new THREE.BoxGeometry(s, s * .8, s * .7); b.rotateY(x); b.translate(x, G(x, z) + s * .4 + (s === .4 ? .44 : 0), z); worldUV(b, 2); put('wood', b); }
    { const px = cx - 3.4, pz = cz + 1.6, p = new THREE.CylinderGeometry(.05, .06, 3.4, 6); p.translate(px, G(px, pz) + 1.7, pz); put('wood', p); const f = new THREE.PlaneGeometry(.9, .45); f.translate(px + .47, G(px, pz) + 3.1, pz); put('pennant', f); }
    figure = (() => { const x = fx + 1.6, z = fz + .9, h = 1.75, g = new THREE.CylinderGeometry(.2, .24, h, 10); g.translate(x, G(x, z) + h / 2, z); put('mark', g); return { x, y: +G(x, z).toFixed(2), z, h }; })(); }
  else figure = (() => { const x = 2.2, z = ZF0 + 3, h = 1.75, g = new THREE.CylinderGeometry(.2, .24, h, 10); g.translate(x, h / 2, z); put('mark', g); return { x, y: 0, z, h }; })();
  // ── the materials: the script a canvas of glyphs, cut into the stone; amber where it burns, dimmer where it fails, violet in a catastrophic seam
  const cut = (w, h, draw, bg, fg) => { const c = document.createElement('canvas'); c.width = w; c.height = h; const x = c.getContext('2d'); x.fillStyle = bg; x.fillRect(0, 0, w, h); x.strokeStyle = fg; x.fillStyle = fg; x.lineCap = 'round'; draw(x); const t = new THREE.CanvasTexture(c); t.anisotropy = 8; t.wrapS = t.wrapT = THREE.RepeatWrapping; return t; };
  const marks = x => { const rg = stream(key + ':glyphs'); for (let k = 0; k < 12; k++) { const cy = 44 + k * 84, kind = Math.floor(rg() * 5); x.lineWidth = 8; x.beginPath();
    if (kind === 0) x.arc(64, cy, 28, 0, 7); else if (kind === 1) { x.arc(64, cy, 28, 0, 7); x.moveTo(64, cy - 38); x.lineTo(64, cy + 38); } else if (kind === 2) { x.arc(64, cy, 28, Math.PI * .1, Math.PI * .9); x.moveTo(92, cy - 6); x.arc(64, cy - 6, 28, 0, -Math.PI, true); }
    else if (kind === 3) { x.moveTo(40, cy); x.lineTo(64, cy - 30); x.lineTo(88, cy); x.lineTo(64, cy + 30); x.closePath(); } else { x.moveTo(64, cy - 36); x.lineTo(64, cy + 36); for (const d of [-20, 0, 20]) { x.moveTo(44, cy + d); x.lineTo(84, cy + d); } } x.stroke(); } };
  const ringSigil = x => { x.lineWidth = 18; x.beginPath(); x.arc(256, 256, 170, 0, 7); x.stroke(); x.lineWidth = 10; x.beginPath(); x.arc(256, 256, 96, 0, 7); x.stroke(); x.lineWidth = 11; x.beginPath(); x.moveTo(256, 24); x.lineTo(256, 488); x.moveTo(24, 256); x.lineTo(488, 256); x.stroke(); x.beginPath(); x.arc(256, 256, 20, 0, 7); x.fill(); };
  const glyphA = cut(128, 1024, marks, '#000', '#fff'), glyphCut = cut(128, 1024, marks, '#4e4b45', '#1a1816'), sigA = cut(512, 512, ringSigil, '#000', '#fff'), sigCut = cut(512, 512, ringSigil, '#8c8880', '#2c2a26');
  const AMBER = new THREE.Color(1.0, .56, .18), VIOLET = new THREE.Color(.62, .3, 1);
  const glow = (t, c, k) => new THREE.MeshBasicMaterial({ map: t, color: c.clone().multiplyScalar(k), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2, side: THREE.DoubleSide });
  const deadM = new THREE.MeshStandardMaterial({ map: glyphCut, roughness: .9, transparent: true, opacity: .5, polygonOffset: true, polygonOffsetFactor: -2, side: THREE.DoubleSide, depthWrite: false });
  const stoneM = mat('rock', { ns: .6, color: 0xb4b0a6, rough: .85 }), dressedM = mat('slab', { ns: .7, color: 0xa29e95, rough: .88 }); stoneM.side = THREE.DoubleSide; dressedM.side = THREE.DoubleSide;
  const landM = mat('plaster', { ns: .5, color: 0xffffff, rough: .97 }); landM.vertexColors = true; landM.side = THREE.DoubleSide;
  const M = { land: landM, rock: mat('rock', { ns: 1, color: 0x8f8d84, rough: .95 }), stone: stoneM, dressed: dressedM,
    lit: glow(glyphA, AMBER, 2.2), dim: glow(glyphA, AMBER, .9), dead: deadM, litD: glow(glyphA, AMBER, 2.4), dimD: glow(glyphA, AMBER, .9), deadD: deadM,
    sigil: glow(sigA, AMBER, 2.4), sigilDim: glow(sigA, AMBER, .8), sigilDead: new THREE.MeshStandardMaterial({ map: sigCut, roughness: .9, transparent: true, opacity: .6, polygonOffset: true, polygonOffsetFactor: -2, depthWrite: false }),
    seam: new THREE.MeshStandardMaterial({ color: new THREE.Color(.09, .08, .11), roughness: .7, emissive: VIOLET.clone(), emissiveIntensity: .5 }) /* the empty seat: violet light in dark stone at the slit's own level, not a flat colour 2.2 times over white (s1963, the critic) */, door: new THREE.MeshBasicMaterial({ color: 0x030304 }), rift: new THREE.MeshBasicMaterial({ color: VIOLET.clone().multiplyScalar(.55) }),
    canvas: mat('plaster', { ns: .4, color: 0xc9b99a, rough: .95 }), wood: mat('wood', { ns: .6, color: 0x8a7a66, rough: .9 }), ember: new THREE.MeshBasicMaterial({ color: new THREE.Color(1.6, .55, .15) }),
    pennant: new THREE.MeshStandardMaterial({ color: 0x8a2a22, roughness: .9, side: THREE.DoubleSide }), mark: new THREE.MeshStandardMaterial({ color: new THREE.Color(.5, .5, .52), roughness: .8 }) };
  M.canvas.side = THREE.DoubleSide;
  let tris = 0, draws = 0; const byMat = {};
  for (const [k, gs] of B) { const g = gs.length > 1 ? mergeGeometries(gs, false) : gs[0]; if (gs.length > 1) gs.forEach(x => x.dispose()); const mesh = new THREE.Mesh(g, M[k]); mesh.name = k;
    mesh.castShadow = !['land', 'lit', 'dim', 'dead', 'litD', 'dimD', 'deadD', 'sigil', 'sigilDim', 'sigilDead', 'seam', 'door', 'rift', 'ember'].includes(k); mesh.receiveShadow = !['lit', 'dim', 'litD', 'dimD', 'sigil', 'sigilDim', 'seam', 'ember'].includes(k);
    group.add(mesh); const n = Math.round((g.index ? g.index.count : g.attributes.position.count) / 3); byMat[k] = n; tris += n; draws++; }
  const gate = Object.entries(byMat).filter(([k]) => k !== 'land').reduce((s, [, n]) => s + n, 0);
  return { group, tris, draws, gateTris: gate, gateDraws: draws - 1, byMat, ground, size: SZ, cond, R0, CY, STEP, rings: RINGS.map(q => ({ ...q })), plate: +PLATE.toFixed(2), face: +FZ.toFixed(2), door, lost, hung, counts,
    hill: { h: +HH.toFixed(1), a: +HA.toFixed(1), c: +HC.toFixed(1), z: +HZ.toFixed(1), across: +(2 * HW).toFixed(1) }, camp: o.camp !== false ? camp : null, figure, across: +(2 * RINGS[0].ro).toFixed(1) };
}
