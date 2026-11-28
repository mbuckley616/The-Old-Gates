// A lesser gate's surroundings (Session 2751; the gap on the shot list's *gate at dusk*, P10b's *Mystery & the Unknown · Gate Light*; the
// "gate's surroundings" owed in backlog L5's *The gate outside* since S2732 and S2744). The panel is a lit place of dark towers and broken
// walls with amber light between them; the game's gate is gatemouth.js's 26 m ring in a turf hill with a camp at its foot, alone on a lawn.
// This module stands round gateMouth()'s result and draws one of three things (the question):
//   'none'    as built: the ring in its hill and the camp, nothing else;
//   'weave'   the gate's own outworks, the Weavers' work and so the same at every gate (canon: "the same structure in every province …
//             and nothing else"): two pylons of coursed stone on the hill's shoulders either side of the face, each with a band of the
//             script up its front and a ring sigil at its head; wing walls from each pylon stepping down along the court; an avenue of three
//             pairs of stelae out along the way in, each with its strip of script. Failing: one pylon's head broken off and fallen on the
//             apron, a wing wall breached, a stele down and one leaning; catastrophic: the head hung in the air over its pylon, two stelae
//             lifted off their beds, violet in the seams;
//   'watch'   a people's ruin round the court: a curtain of rubble stone on three sides with a gap at the way in, two square towers at the
//             front corners and a stump of a third, ragged tops and dark slits, rubble at their feet (a lost kingdom's watch on the gate,
//             as the canon's forts are "spaces some kingdom built and then lost"). The condition changes the gate, not the ruin.
// gateWards(A, { kind, key }) -> { group, tris, draws, byMat, lights: [{x,y,z,c,k}], parts }
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { mat, worldUV, fbm } from './common.js';
import { stream } from './pieces.js';

export function gateWards(A, o = {}) {
  const kind = ['weave', 'watch'].includes(o.kind) ? o.kind : 'none', group = new THREE.Group(), lights = [], parts = {};
  if (kind === 'none') return { group, tris: 0, draws: 0, byMat: {}, lights, parts, kind };
  const R0 = A.R0, cond = A.cond, g = A.ground, key = (o.key || 'gate:wards') + ':' + kind + ':' + A.size, r = stream(key), HW = A.hill.across / 2;
  const B = new Map(), put = (k, geo) => { const x = geo.index ? geo.toNonIndexed() : geo; for (const a of Object.keys(x.attributes)) if (!['position', 'normal', 'uv'].includes(a)) x.deleteAttribute(a); x.computeVertexNormals(); if (['stone', 'dressed', 'rubble'].includes(k)) { x.deleteAttribute('uv'); worldUV(x, .25); } else if (!x.attributes.uv) worldUV(x, .25); (B.get(k) || B.set(k, []).get(k)).push(x); return x; };
  const gmin = (x, z, s) => Math.min(g(x, z), g(x + s, z + s), g(x - s, z + s), g(x + s, z - s), g(x - s, z - s));
  const box = (w, h, d, x, y, z, ry = 0) => { const b = new THREE.BoxGeometry(w, h, d); b.rotateY(ry); b.translate(x, y + h / 2, z); return b; };
  const glowFor = (lit, alive = 1) => cond === 'steady' ? 'lit' : cond === 'failing' ? (alive ? 'dim' : 'dead') : 'dead';
  const strip = (w, h, x, y, z, ry, k) => { const s = new THREE.PlaneGeometry(w, h); const uv = s.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setY(i, uv.getY(i) * h / w / 6); s.rotateY(ry); s.translate(x, y + h / 2, z); put(k, s); };
  if (kind === 'weave') {
    // ── the pylons: square shafts of coursed stone, battered, on the hill's shoulders; the script up the front, the sigil at the head
    const PH = R0 * 2.0, PB = R0 * .4, PT = R0 * .27, CH = R0 * .13, PX = HW + R0 * .3, PZ = A.face + R0 * .25; parts.pylons = [];
    for (const s of [-1, 1]) { const x = s * PX, z = PZ, y0 = gmin(x, z, PB * .6) - .8, broke = cond !== 'steady' && s > 0, top = broke ? PH * .62 : PH; let y = y0, k = 0, drums = [];
      while (y < y0 + top) { const t = (y - y0) / PH, w = PB + (PT - PB) * t, h = Math.min(CH, y0 + top - y); const b = box(w, h - .04, w, x, y, z, (r() - .5) * .01); drums.push({ b, y, w, h }); y += h; k++; }
      drums.forEach(d => put('stone', d.b));
      // a stepped head: a cornice course, a cap, the ring sigil on its front face
      if (!broke) { const wT = PT * 1.18; put('dressed', box(wT, CH * .5, wT, x, y0 + PH, z)); put('dressed', box(PT * .82, CH * .9, PT * .82, x, y0 + PH + CH * .5, z));
        const c = new THREE.ConeGeometry(PT * .62, CH * 1.6, 4); c.rotateY(Math.PI / 4); c.translate(x, y0 + PH + CH * 1.4 + CH * .8, z); put('dressed', c);
        const sg = new THREE.PlaneGeometry(PT * .7, PT * .7); sg.translate(x, y0 + PH - PT * .55, z + PT / 2 + .06); put(cond === 'steady' ? 'sigil' : cond === 'failing' ? 'sigilDim' : 'sigilDead', sg); }
      else { const head = []; let hy = y0 + top; for (let q = 0; q < 6; q++) { const t = (hy - y0) / PH, w = PB + (PT - PB) * t; head.push(box(w, CH - .04, w, 0, q * CH, 0)); hy += CH; }
        head.push(box(PT * 1.18, CH * .5, PT * 1.18, 0, CH * 6, 0)); const hg = mergeGeometries(head.map(h => h.toNonIndexed()), false); head.forEach(h => h.dispose());
        if (cond === 'failing') { /* fallen: the head lies along the apron in front of its pylon, broken in two */
          const a = hg.clone(), b2 = hg; a.rotateZ(Math.PI / 2 - .12); a.rotateY(.5); a.translate(x - s * R0 * .2, g(x - s * R0 * .2, z + R0 * .9) - .6, z + R0 * .9); put('stone', a);
          for (let q = 0; q < 5; q++) { const bx = x + (r() - .5) * R0 * .5, bz = z + R0 * (.3 + r() * .9), sz = CH * (.5 + r() * .6), d = new THREE.DodecahedronGeometry(sz, 0); d.translate(bx, g(bx, bz) - sz * .3, bz); put('stone', d); }
          b2.dispose(); }
        else { /* catastrophic: the head hangs over its stump, turned, the seam between lit violet */
          const lift = R0 * .35; hg.rotateZ(-.16 * s); hg.rotateX(.1); hg.translate(x + s * R0 * .05, y0 + top + lift, z + R0 * .04); put('stone', hg);
          const seam = new THREE.BoxGeometry(PB + (PT - PB) * (top / PH) - .3, .12, PB + (PT - PB) * (top / PH) - .3); seam.translate(x, y0 + top + .06, z); put('seam', seam);
          lights.push({ x, y: y0 + top + lift * .5, z: z + PT, c: [.6, .3, 1], k: 6 }); } }
      // the script up the front: two bands, lit to the head; dead on the broken one's upper half
      const bandW = PT * .32, bandH = top * .82, bandY = y0 + 1.6;
      { const s2 = new THREE.PlaneGeometry(bandW, bandH), P = s2.attributes.position, uv = s2.attributes.uv; for (let i = 0; i < P.count; i++) { const t = (P.getY(i) + bandH / 2) / PH; P.setZ(i, (PB - (PB - PT) * (t + (bandY - y0) / PH)) / 2 + .04); uv.setY(i, uv.getY(i) * bandH / bandW / 6); }
        s2.translate(x, bandY + bandH / 2, z); put(glowFor('lit', s < 0), s2); }
      lights.push({ x, y: y0 + 2.2, z: z + PB * .6 + 1.2, c: [1, .56, .18], k: cond === 'steady' ? 1 : cond === 'failing' ? (s < 0 ? .45 : 0) : 0 });
      parts.pylons.push({ x, z, foot: +y0.toFixed(1), top: +(y0 + top).toFixed(1), broke });
      // the wing wall: from the pylon's front corner along the court's side, stepping down from 0.5 to 0.1 of the pylon, coursed blocks
      const wx = s * (PX - PB * .2), L = R0 * .9, n = Math.round(L / 3.2); let breached = 0;
      for (let i = 0; i < n; i++) { const t = i / (n - 1), bz = z + PB * .5 + (i + .5) * L / n, bx = wx, h0 = R0 * (.34 - .26 * t);
        if (cond !== 'steady' && s > 0 && i === 1) { breached++; const sz = .7 + r() * .5, d = new THREE.DodecahedronGeometry(sz, 0); d.translate(bx + (r() - .5) * 2, g(bx, bz) - sz * .3, bz + (r() - .5) * 2); put('stone', d); continue; }
        const y0w = gmin(bx, bz, 1) - .4, top2 = Math.max(h0, g(bx, bz) - y0w + 1.2); put('stone', box(1.4, top2, L / n - .06, bx, y0w, bz)); put('dressed', box(1.6, .32, L / n + .04, bx, y0w + top2, bz)); }
      parts['wing' + (s < 0 ? 'L' : 'R')] = breached; }
    // ── the avenue: three pairs of stelae out along the way in, each a strip of script facing the path
    const Z0 = A.rings[0].zf + R0 * 1.15, rows = [[R0 * .58, 0], [R0 * .46, 1], [R0 * .38, 2]], AX = R0 * .55, STEPZ = R0 * .6; parts.stelae = [];
    rows.forEach(([H0, j]) => { for (const s of [-1, 1]) { const x = s * (AX + j * R0 * .1), z = Z0 + j * STEPZ, W = H0 * .2, D = H0 * .1, y0 = gmin(x, z, W) - .4;
      let fate = 'stand'; if (cond === 'failing') fate = (j === 1 && s > 0) ? 'down' : (j === 2 && s < 0) ? 'lean' : 'stand'; if (cond === 'catastrophic') fate = (j === 0 && s > 0) || (j === 2 && s < 0) ? 'hung' : 'stand';
      const st = new THREE.BoxGeometry(W, H0, D, 1, 3, 1), P = st.attributes.position; for (let i = 0; i < P.count; i++) { const t = (P.getY(i) + H0 / 2) / H0; P.setX(i, P.getX(i) * (1 - .3 * t)); P.setZ(i, P.getZ(i) * (1 - .2 * t)); }
      const sc = new THREE.PlaneGeometry(W * .34, H0 * .7); const uv = sc.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setY(i, uv.getY(i) * H0 * .7 / (W * .34) / 6);
      sc.rotateY(-s * Math.PI / 2); sc.translate(-s * (D / 2 * .92 + .03), 0, 0); /* the face toward the path */
      st.rotateY(-s * Math.PI / 2); const M = new THREE.Matrix4();
      if (fate === 'down') M.makeTranslation(x - s * H0 * .45, y0 + D * .45, z).multiply(new THREE.Matrix4().makeRotationZ(-s * Math.PI / 2 * .97));
      else if (fate === 'lean') M.makeTranslation(x, y0 + H0 / 2 * .96, z).multiply(new THREE.Matrix4().makeRotationZ(s * .32)).multiply(new THREE.Matrix4().makeRotationX(.08));
      else if (fate === 'hung') { M.makeTranslation(x, y0 + H0 / 2 + R0 * .18, z).multiply(new THREE.Matrix4().makeRotationZ(s * .12)); const seat = new THREE.BoxGeometry(W * .95, .1, W * .5); seat.translate(x, g(x, z) + .03, z); put('seam', seat); lights.push({ x, y: g(x, z) + 1, z, c: [.6, .3, 1], k: 2.5 }); }
      else M.makeTranslation(x, y0 + H0 / 2, z);
      st.applyMatrix4(M); put('stone', st); sc.applyMatrix4(M); put(fate === 'stand' ? glowFor('lit', !(j === 0 && s > 0)) : 'dead', sc);
      if (cond === 'steady' && j === 0) lights.push({ x: x * .8, y: y0 + 1.2, z, c: [1, .56, .18], k: .35 });
      parts.stelae.push({ x: +x.toFixed(1), z: +z.toFixed(1), h: +H0.toFixed(1), fate }); } });
  } else {
    // ── the watch: a curtain on three sides of the court, a gap at the way in, two towers at the front corners, a stump at the back left
    const XW = HW + R0 * .15, ZB = A.face + R0 * .2, ZF = A.rings[0].zf + R0 * .95, WH = R0 * .38, THK = 1.3, rs = stream(key + ':ragged');
    const ragged = (x0, z0, x1, z1, H, gapAt, breach = []) => { const L = Math.hypot(x1 - x0, z1 - z0), n = Math.max(2, Math.round(L / 1.1)), ry = Math.atan2(x1 - x0, z1 - z0); let made = 0, breaches = 0;
      for (let i = 0; i < n; i++) { const t = (i + .5) / n, x = x0 + (x1 - x0) * t, z = z0 + (z1 - z0) * t; if (gapAt && gapAt(t)) continue;
        const nn = fbm(x / 7 + 11, z / 7, 3), br = breach.some(([a, b]) => t > a && t < b), h = br ? H * (.08 + .1 * rs()) : H * Math.max(.3, Math.min(1, .78 + 1.6 * nn)); if (h < H * .2) breaches++;
        const y0 = gmin(x, z, .8) - .5, top = Math.max(h, g(x, z) - y0 + .5); put('rubble', box(L / n + .02, top, THK, x, y0, z, ry + Math.PI / 2)); made++;
        if (h < H * .45 && rs() < .5) { const sz = .4 + rs() * .5, d = new THREE.DodecahedronGeometry(sz, 0); const ox = (rs() - .5) * 2.6; d.translate(x + ox * Math.cos(ry), g(x, z) - sz * .3, z - ox * Math.sin(ry)); put('rubble', d); } }
      return { made, breaches }; };
    parts.walls = [ragged(-XW, ZB, -XW, ZF, WH, null, [[.42, .6]]), ragged(XW, ZB, XW, ZF, WH), ragged(-XW, ZF, XW, ZF, WH * .55, t => Math.abs(t - .5) < .09, [[.24, .33], [.7, .76]])];
    // a tower: four walls of ragged courses round a hollow, a slit in each face every storey, a lintel line at each floor
    const tower = (x, z, S, H, ry) => { const y0 = gmin(x, z, S * .6) - .6, n = 5, c = Math.cos(ry), s = Math.sin(ry), P = (u, w) => [x + u * c + w * s, z - u * s + w * c];
      for (const [u0, w0, u1, w1, face] of [[-S / 2, S / 2, S / 2, S / 2, [0, 1]], [S / 2, -S / 2, -S / 2, -S / 2, [0, -1]], [S / 2, S / 2, S / 2, -S / 2, [1, 0]], [-S / 2, -S / 2, -S / 2, S / 2, [-1, 0]]])
        for (let i = 0; i < n; i++) { const t = (i + .5) / n, u = u0 + (u1 - u0) * t, w = w0 + (w1 - w0) * t, [px, pz] = P(u - face[0] * THK * .5, w - face[1] * THK * .5), nn = fbm(px / 3 + 5, pz / 3, 2), h = H * (.82 + .5 * nn) * (i === 0 || i === n - 1 ? 1.04 : 1);
          const fr = Math.atan2(face[0] * c + face[1] * s, -face[0] * s + face[1] * c); put('rubble', box(S / n + .02, h, THK, px, y0, pz, fr));
          if (i === 2) for (let fy = 3.2; fy < h - 1.5; fy += 3.4) { const [sx, sz] = P(u + face[0] * .03, w + face[1] * .03), sl = new THREE.PlaneGeometry(.28, 1.3); sl.rotateY(fr); sl.translate(sx, y0 + fy + .65, sz); put('slit', sl); } }
      for (let fy = 3; fy < H * .8; fy += 3.4) { const [a, b] = P(0, 0); const ring = new THREE.BoxGeometry(S + .3, .25, S + .3); ring.rotateY(ry); ring.translate(a, y0 + fy, b); put('dressed', ring); }
      for (let q = 0; q < 6; q++) { const bx = x + (rs() - .5) * S * 2.2, bz = z + (rs() - .5) * S * 2.2, sz = .4 + rs() * .7, d = new THREE.DodecahedronGeometry(sz, 0); d.translate(bx, g(bx, bz) - sz * .3, bz); put('rubble', d); }
      return { x: +x.toFixed(1), z: +z.toFixed(1), S, H: +H.toFixed(1), foot: +y0.toFixed(1) }; };
    parts.towers = [tower(-XW, ZF - 1, R0 * .5, R0 * 1.15, .08), tower(XW, ZF - 1, R0 * .46, R0 * .82, -.05), tower(XW, ZB + R0 * .3, R0 * .44, R0 * .36, 0)];
    // the watch's own fire: a brazier of iron at each side of the gap, cold by day; the gate's light is the script's, as built
    for (const s of [-1, 1]) { const x = s * R0 * .32, z = ZF + 1.6, y = g(x, z); const p = new THREE.CylinderGeometry(.08, .1, 1.2, 6); p.translate(x, y + .6, z); put('iron', p); const b = new THREE.CylinderGeometry(.42, .22, .38, 8); b.translate(x, y + 1.35, z); put('iron', b); const e = new THREE.CylinderGeometry(.36, .36, .06, 8); e.translate(x, y + 1.52, z); put('ember', e); lights.push({ x, y: y + 2, z, c: [1, .55, .2], k: .5 }); }
  }
  // ── the materials, the gate's own: gateMouth's script and sigil materials are reused by name from its group
  const fromGate = {}; A.group.children.forEach(m => { fromGate[m.name] = m.material; });
  const M = { stone: fromGate.stone, dressed: fromGate.dressed, lit: fromGate.litD || fromGate.lit, dim: fromGate.dimD || fromGate.dim, dead: fromGate.deadD || fromGate.dead,
    sigil: fromGate.sigil, sigilDim: fromGate.sigilDim, sigilDead: fromGate.sigilDead, seam: new THREE.MeshBasicMaterial({ color: new THREE.Color(.62, .3, 1).multiplyScalar(.8) }),
    rubble: mat('stone', { ns: .8, color: 0xb2aea2, rough: .95 }), slit: new THREE.MeshBasicMaterial({ color: 0x050506, side: THREE.DoubleSide }), iron: new THREE.MeshStandardMaterial({ color: 0x2a2724, roughness: .7, metalness: .4 }),
    ember: new THREE.MeshBasicMaterial({ color: new THREE.Color(1.6, .55, .15) }) };
  for (const k of ['lit', 'dim', 'dead', 'sigil', 'sigilDim', 'sigilDead']) if (!M[k]) M[k] = new THREE.MeshBasicMaterial({ color: 0xffaa55 });
  let tris = 0, draws = 0; const byMat = {};
  for (const [k, gs] of B) { const geo = gs.length > 1 ? mergeGeometries(gs, false) : gs[0]; if (gs.length > 1) gs.forEach(x => x.dispose()); const mesh = new THREE.Mesh(geo, M[k]); mesh.name = 'ward:' + k;
    mesh.castShadow = ['stone', 'dressed', 'rubble', 'iron'].includes(k); mesh.receiveShadow = !['lit', 'dim', 'sigil', 'sigilDim', 'seam', 'ember', 'slit'].includes(k); group.add(mesh);
    const n = Math.round(geo.attributes.position.count / 3); byMat[k] = n; tris += n; draws++; }
  return { group, tris, draws, byMat, lights, parts, kind };
}
