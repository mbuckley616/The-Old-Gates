// Ruins at the scale of cliffs (Session 1119; backlog L5, OG-104): the Weavers' old works out in the land, drawn so huge that a person is
// a speck beside them. Each site is built from the gate kit's own pieces (gatekit.js), so a ruin and a gate are one stone; out in the
// world nothing holds the stones up, so they are laid with gatePiece's `ruin` (every loose stone fallen, none floating, the script dead).
// A metre a unit, the ground at y 0.
//
// weaverRing (OG-104's first site, "a vast stone circle of broken arches on a coast"): a ring of twelve bays on the level crown of a
// headland, 170 m across, its open side to the sea; the cliff falls 30 m to the water 40 m past the ring's seaward edge.
//   - the arches: gatekit's pointed arch at 3 times its size (Michael's B on #429, Session 1134; it was 2.2 in a ring 124 m across, and
//     o.k and o.R still take those), so each opening is 30 m wide and 54 m to its point and the arch stands 60 m, and its stones
//     are blocks of 4.5 m courses (the gate halls' measures, visual-foundation.md §2, grown to the size of cliffs). Each stands with its
//     face to the ring's heart, its jambs on the circle;
//   - their conditions, by a stream keyed by the ring: four stand (gatekit's 'cracked', leaning 1.5 to 3° with slipped stones and
//     cracks), seven are broken (above a ragged line about half their height their stones have fallen, inward or out, onto the turf), and
//     the bay toward the sea is gone but for its footings and a spill of blocks down to the cliff's edge;
//   - the heart: a round dais of three steps, 30 m across (grown with the ring), in slabs, with the ring sigil cut dead in its middle stone;
//   - a scale mark (o.figure, default on): a plain grey post 1.75 m high inside the foot of a standing arch, standing in for a person until the
//     bodies builder's pack stands there. It is not a person and is not drawn as one.
// What the ring was, and whether anything still burns in it, is the canon's and the quest writer's.
// -> { group, tris, draws, ground(x, z), R, bays: [{ i, a, x, z, cond, top, fallen, floating, lean, seams }], gone, spill: [[x, z]], dais { r, top }, cliff { z, sea },
//   figure { x, y, z, h, bay }, k (the arches' scale), span (an opening's width), rise (its height to the point) }
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { mat, worldUV, fbm, sstep } from './common.js';
import { gatePiece, stream } from './gatekit.js';

export function weaverRing(o = {}) {
  const key = o.key || 'ruins:ring', r = stream(key), K = o.k || 3, N = 12, R = o.R || 85, SEA = -30, CLIFF = -(R + 40), group = new THREE.Group();
  // the headland: level within the ring (a crown of turf, ±0.15 m), rolling beyond it, falling at its seaward edge (-z) to the cliff
  const ground = (x, z) => { const d = Math.hypot(x, z), roll = fbm(x / 60, z / 60, 4) * 6 * Math.min(1, Math.max(0, (d - R - 12) / 40)); return .15 * fbm(x / 9, z / 9, 2) + roll + (z < CLIFF + 6 ? -1.2 * (z - CLIFF - 6) ** 2 / 36 : 0); };
  const B = new Map(), put = (k, g) => { const x = g.index ? g.toNonIndexed() : g; for (const a of Object.keys(x.attributes)) if (!['position', 'normal', 'uv'].includes(a)) x.deleteAttribute(a); if (!x.attributes.normal) x.computeVertexNormals(); if (!x.attributes.uv) worldUV(x, .25); (B.get(k) || B.set(k, []).get(k)).push(x); return x; };
  // the turf: a disc 520 m across round the ring, cut off at the cliff's edge; the cliff's face below it; the sea
  { const N2 = 160, g = new THREE.PlaneGeometry(520, 520, N2, N2); g.rotateX(-Math.PI / 2); const P = g.attributes.position; for (let i = 0; i < P.count; i++) { const x = P.getX(i), z = Math.max(CLIFF, P.getZ(i)); P.setXYZ(i, x, ground(x, z), z); } g.computeVertexNormals(); worldUV(g, .12); put('turf', g); }
  { const N2 = 120, M2 = 14, pos = []; const Pt = (i, j) => { const x = -260 + 520 * i / N2, y = SEA - 4 + (ground(x, CLIFF) - SEA + 4) * j / M2; return [x, y, CLIFF - 1.5 + fbm(x / 7, y / 7, 3) * 4 - (M2 - j) * .25]; };
    for (let i = 0; i < N2; i++) for (let j = 0; j < M2; j++) { const a = Pt(i, j), b = Pt(i + 1, j), c = Pt(i + 1, j + 1), d = Pt(i, j + 1); pos.push(...a, ...c, ...b, ...a, ...d, ...c); }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.computeVertexNormals(); worldUV(g, .1); put('cliff', g); }
  { const g = new THREE.PlaneGeometry(2400, 1200); g.rotateX(-Math.PI / 2); g.translate(0, SEA, CLIFF - 600); put('sea', g); }
  // the bays: bay 0 faces the sea (its middle at -z), the others round from it; each the kit's arch at K, its face to the heart
  const conds = ['cracked', 'broken', 'broken', 'cracked', 'broken', 'broken', 'cracked', 'broken', 'broken', 'cracked', 'broken'].sort(() => r() - .5), bays = [], piecesBy = new Map();
  for (let i = 0; i < N; i++) { const a = Math.PI + i * 2 * Math.PI / N, x = R * Math.sin(a), z = R * Math.cos(a);
    if (i === 0) continue; /* the bay to the sea is gone: its footings and its spill are laid below */
    const cond = conds[i - 1], G = gatePiece('arch', { cond, school: 'cloch', key: `${key}:bay:${i}`, ruin: true }), U = G.userData;
    G.scale.setScalar(K); G.rotation.y = a; G.position.set(x, ground(x, z) - .3, z); G.updateMatrixWorld(true);
    let top = -Infinity; const v = new THREE.Vector3(); G.traverse(m => { if (!m.isMesh) return; const P = m.geometry.attributes.position; for (let j = 0; j < P.count; j += 3) { v.fromBufferAttribute(P, j).applyMatrix4(m.matrixWorld); top = Math.max(top, v.y); } (piecesBy.get(m.material) || piecesBy.set(m.material, []).get(m.material)).push(m); });
    bays.push({ i, a: +a.toFixed(3), x: +x.toFixed(2), z: +z.toFixed(2), cond, top: +top.toFixed(2), fallen: U.fallen, floating: U.floating, lean: U.lean, seams: U.seams }); }
  // the seaward bay: its two jambs' lowest courses, and its stones spilled toward the cliff's edge, the furthest at its lip
  const stone = new THREE.MeshStandardMaterial(), spill = []; let gone = 0;
  { const a = Math.PI, cx = R * Math.sin(a), cz = R * Math.cos(a), J = 2.2 * K, S = 10 * K, T = 2.4 * K, ch = 1.5 * K;
    for (const sx of [-1, 1]) for (let y = 0; y < 2; y++) { const g = new THREE.BoxGeometry(J - .1, ch - .1, T - .1); g.translate(cx + sx * (S / 2 + J / 2), ground(cx + sx * (S / 2 + J / 2), cz) - .3 + ch * (y + .5) - (y ? r() * .8 : 0), cz); worldUV(g, .25 / K); put('stone', g); gone++; }
    for (let k = 0; k < 16; k++) { const t = r(), x = cx + (r() - .5) * S * 1.4, z = cz - 4 - t * (cz - CLIFF - 8), w = J * (.6 + r() * .4), h = ch * (.6 + r() * .4), d = T * (.4 + r() * .4), g = new THREE.BoxGeometry(w, h, d);
      g.rotateY(r() * Math.PI); g.rotateX((r() - .5) * .5); g.computeBoundingBox(); g.translate(x, ground(x, z) - g.boundingBox.min.y - .4, z); worldUV(g, .25 / K); put('stone', g); gone++; spill.push([+x.toFixed(2), +z.toFixed(2)]); } }
  // the heart: a dais of three round steps of 0.9 m, 30, 23 and 16 m across (22, 17 and 12 in the ring of 62 m), in slabs; the ring sigil cut in its middle stone, dead
  const dais = (() => { const rr = [11, 8.5, 6].map(v => +(v * R / 62).toFixed(1)), h = .9; let y = ground(0, 0) - .2;
    for (const [k, rad] of rr.entries()) { const g = new THREE.CylinderGeometry(rad, rad + .15, h, 72, 1); g.translate(0, y + h / 2, 0); g.computeVertexNormals(); worldUV(g, .2); put(k ? 'step' : 'step0', g); y += h; }
    const s = new THREE.CircleGeometry(3.2 * R / 62, 64); s.rotateX(-Math.PI / 2); s.translate(0, y + .01, 0); put('sigil', s); return { r: rr[0], top: +y.toFixed(2) }; })();
  const figure = (() => { if (o.figure === false) return null; const st = bays.filter(b => b.cond === 'cracked').sort((p, q) => q.x - p.x)[0], h = 1.75, x = st.x * .9, z = st.z * .9, y = ground(x, z), g = new THREE.CylinderGeometry(.2, .24, h, 10); g.translate(x, y + h / 2, z); put('mark', g); return { x: +x.toFixed(2), y: +y.toFixed(2), z: +z.toFixed(2), h, bay: st.i }; })(); /* inside the foot of the standing arch that takes the sun */
  // the ring sigil (gatekit's ringTex is private: drawn here the same, two circles and a cross past them), in a dark cut, nothing lit
  const ringT = (() => { const c = document.createElement('canvas'); c.width = c.height = 512; const x = c.getContext('2d'); x.fillStyle = '#8a8478'; x.fillRect(0, 0, 512, 512); x.strokeStyle = '#2a2824'; x.fillStyle = '#2a2824'; x.lineCap = 'round';
    x.lineWidth = 16; x.beginPath(); x.arc(256, 256, 170, 0, 7); x.stroke(); x.lineWidth = 9; x.beginPath(); x.arc(256, 256, 96, 0, 7); x.stroke(); x.lineWidth = 10; x.beginPath(); x.moveTo(256, 20); x.lineTo(256, 492); x.moveTo(20, 256); x.lineTo(492, 256); x.stroke(); x.beginPath(); x.arc(256, 256, 18, 0, 7); x.fill();
    const t = new THREE.CanvasTexture(c); t.anisotropy = 8; return t; })();
  { const s = B.get('sigil')[0], uv = s.attributes.uv, P = s.attributes.position; for (let i = 0; i < P.count; i++) uv.setXY(i, P.getX(i) / (6.4 * R / 62) + .5, -P.getZ(i) / (6.4 * R / 62) + .5); }
  const turf = new THREE.MeshStandardMaterial({ color: new THREE.Color(.30, .40, .17), roughness: 1 });
  const M = { turf, cliff: mat('rock', { ns: 1.3, color: 0x8a8478, rough: .95 }), sea: new THREE.MeshStandardMaterial({ color: new THREE.Color(.10, .22, .26), roughness: .15, metalness: .1 }), stone: null,
    step0: mat('ashlar', { ns: .8, color: 0xb2ab9e, rough: .85 }), step: mat('ashlar', { ns: .8, color: 0xbab3a6, rough: .85 }) /* the kit's slab is the gates' dark polished floor: out under the sky the steps are the arches' own stone */, sigil: new THREE.MeshStandardMaterial({ map: ringT, roughness: .9 }), mark: new THREE.MeshStandardMaterial({ color: new THREE.Color(.5, .5, .52), roughness: .8 }) };
  // the arches' meshes merged by their material, in world space: one draw a material for the whole ring
  let tris = 0, draws = 0; group.updateMatrixWorld(true);
  for (const [m, ms] of piecesBy) { const gs = ms.map(x => { const g = x.geometry.clone(); g.applyMatrix4(x.matrixWorld); return g; }), g = mergeGeometries(gs, false); gs.forEach(x => x.dispose()); const mesh = new THREE.Mesh(g, m); mesh.castShadow = mesh.receiveShadow = true; mesh.name = 'arch:' + (ms[0].userData.key || ''); group.add(mesh); tris += g.attributes.position.count / 3; draws++; if (ms[0].userData.key === 'stone') M.stone = m; }
  for (const [k, gs] of B) { const g = mergeGeometries(gs, false); gs.forEach(x => x.dispose()); const mesh = new THREE.Mesh(g, M[k] || stone); mesh.name = k; mesh.castShadow = !['turf', 'sea', 'sigil', 'cliff'].includes(k); mesh.receiveShadow = k !== 'sea'; group.add(mesh); tris += g.attributes.position.count / 3; draws++; }
  return { group, tris: Math.round(tris), draws, ground, R, bays, gone, spill, dais, cliff: { z: CLIFF, sea: SEA }, figure, k: K, span: 10 * K, rise: +((9 + 9) * K).toFixed(1) };
}

// drownedSpires (Session 2389; OG-104's "Drowned Spires", Gatelands: "half-sunk towers and bridges at low tide"): a chain of six Weaver
// towers striding out from a Gatelands strand into the sea on a gentle curve, a span of the gate kit's bridge between each pair. The sea
// came up over them (or they sank), so the further out a tower stands the deeper its foot. Everything is the gate kit's at 2.5 times:
//   - the towers: two of gatekit's piers (4 m square, 20 m high) one on the other at 2.5, so a shaft 10 m square and about 100 m high from
//     its plinth in the bed, capped by a spire of four faces 16 m high on a corbel band; the lower pier whole and upright; four stand (the upper pier 'cracked', leaning 1.5 to 3° from the string course, the spire with it), two are broken
//     (above a ragged line about half the upper pier's height the stones are gone into the sea, no spire); a band of weed and wrack 3.6 m deep
//     round every shaft between the low water and the high (the tide's range here 4 m, a Gatelands spring tide's);
//   - the spans: gatekit's bridge (a segmental arch of 13 m under a deck 16 m long) at 2.5, so 40 m between the towers' faces, its
//     deck 10 m wide between parapets 2.5 m high; four stand 'cracked', the fourth is broken (its middle gone, the stones in the sea);
//   - o.deck: how high the decks' walking face stands over the mean sea (metres; the whole chain is moved with it). The three levels
//     the DECISION asks: 'a' -1 (clear by 1 m at low water, 3 m under at high: a walk out at the ebb), 'b' 4.5 (clear by 2.5 m at high
//     water: always walked), 'c' -5.5 (under at every tide: the spires alone, a boat's place);
//   - o.tide: the water at 'low' (-2), 'mid' (0) or 'high' (+2);
//   - the strand: sand from the low water up to a turf bank, the bed falling 1 in 14 out to 16 m deep; a 1.75 m post on the sand by the
//     first tower's foot (the scale, not a person).
// What the spires were (a gate's outworks, a road to an isle shrine) is the canon's and the quest writer's.
// -> { group, tris, draws, ground(x, z), sea (y of the water), deck (y of the decks' walking face), towers: [{ i, x, z, ry, cond, foot,
//   top, wet (m of the shaft above the water), lean }], spans: [{ i, x, z, ry, cond, deck }], figure { x, y, z, h }, k }
export function drownedSpires(o = {}) {
  const key = o.key || 'ruins:spires', r = stream(key), K = 2.5, N = 6, D = 50, LV = { a: -1, b: 4.5, c: -5.5 };
  const DECK = typeof o.deck === 'number' ? o.deck : LV[o.deck] ?? LV.b, SEA = { low: -2, mid: 0, high: 2 }[o.tide] ?? 0, group = new THREE.Group();
  // the strand: turf above +3 inland (+z), sand below it, the bed falling 1 in 14 seaward (-z) to 16 m deep; rolling a little
  const ground = (x, z) => { const roll = fbm(x / 40, z / 40, 3) * 1.2, base = z > 0 ? Math.min(7, 1.2 + z * .06) : Math.max(-16, 1.2 + z / 14); return base + roll; };
  const B = new Map(), put = (k, g) => { const x = g.index ? g.toNonIndexed() : g; for (const a of Object.keys(x.attributes)) if (!['position', 'normal', 'uv'].includes(a)) x.deleteAttribute(a); if (!x.attributes.normal) x.computeVertexNormals(); if (!x.attributes.uv) worldUV(x, .25); (B.get(k) || B.set(k, []).get(k)).push(x); return x; };
  { const N2 = 180, g = new THREE.PlaneGeometry(900, 900, N2, N2); g.rotateX(-Math.PI / 2); g.translate(0, 0, -250); const P = g.attributes.position, col = [];
    for (let i = 0; i < P.count; i++) { const x = P.getX(i), z = P.getZ(i), y = ground(x, z); P.setY(i, y); const t = Math.min(1, Math.max(0, (y - 2.6) / 1.2)), w = Math.min(1, Math.max(0, (2.4 - y) / 4.4)) * (y > -2.4 ? 1 : 0);
      const c = [.62 - .1 * w, .56 - .08 * w, .42 - .02 * w].map((v, j) => v * (1 - t) + [.30, .40, .17][j] * t); col.push(...c); }
    g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3)); g.computeVertexNormals(); worldUV(g, .12); B.set('strand', [g]); }
  { const g = new THREE.PlaneGeometry(3000, 2400); g.rotateX(-Math.PI / 2); g.translate(0, SEA, -900); put('sea', g); }
  // the line: from the strand's low-water mark out to sea, bending 14° over its length; tower i at (x_i, z_i), the chain's heading at it
  const z0 = -40, pts = []; { let x = 0, z = z0, h = 0; for (let i = 0; i < N; i++) { pts.push([x, z, h]); const hn = h + (14 / (N - 1)) * Math.PI / 180; x += Math.sin(hn) * D; z -= Math.cos(hn) * D; h = hn; } }
  const conds = ['cracked', 'cracked', 'broken', 'cracked', 'cracked', 'broken'], spanConds = ['cracked', 'cracked', 'cracked', 'broken', 'cracked'];
  const BASE = DECK - 6.45 * K /* the bridge's springing: its deck's walking face 6.45 m over it in the kit */, FOOT = BASE - 12 /* every tower stands on a plinth sunk under the bed */;
  const piecesBy = new Map(), take = G => { G.updateMatrixWorld(true); G.traverse(m => { if (m.isMesh) (piecesBy.get(m.material) || piecesBy.set(m.material, []).get(m.material)).push(m); }); };
  const towers = [], spans = [], v = new THREE.Vector3();
  pts.forEach(([x, z, h], i) => { const hd = i === 0 ? h : (h + pts[i - 1][2]) / 2, ry = -hd, cond = conds[i];
    // the shaft: two of the kit's piers, one on the other; the lower whole (its foot in the bed, its head a string course), the upper in the tower's condition
    const G0 = gatePiece('pier', { cond: 'whole', school: 'cloch', key: `${key}:tower:${i}:lo`, ruin: true }), h0 = G0.userData.size.h - .5; G0.scale.setScalar(K); G0.rotation.y = ry; G0.position.set(x, FOOT, z); take(G0);
    const UP = FOOT + h0 * K, G = gatePiece('pier', { cond, school: 'cloch', key: `${key}:tower:${i}`, ruin: true, ground: (ground(x, z) - .4 - UP) / K /* what falls lies on the bed */ }), U = G.userData; G.scale.setScalar(K); G.rotation.y = ry; G.position.set(x, UP, z); take(G);
    let top = -Infinity; [G0, G].forEach(Gi => Gi.traverse(m => { if (!m.isMesh) return; const P = m.geometry.attributes.position; for (let j = 0; j < P.count; j += 3) { v.fromBufferAttribute(P, j).applyMatrix4(m.matrixWorld); top = Math.max(top, v.y); } }));
    const lean = (U.lean || 0) * Math.PI / 180, M4 = new THREE.Matrix4().makeTranslation(x, UP, z).multiply(new THREE.Matrix4().makeRotationY(ry)).multiply(new THREE.Matrix4().makeScale(K, K, K)).multiply(new THREE.Matrix4().makeRotationX(lean));
    // the spire (on a standing tower only): a corbel band and a cap of four faces, 16 m to its point, leaning with the shaft
    if (cond === 'cracked') { const h1 = U.size.h; { const g = new THREE.BoxGeometry(5.6, .7, 5.6); g.translate(0, h1 + .35, 0); put('stone', g.applyMatrix4(M4)); }
      const c = new THREE.ConeGeometry(5.6 / Math.SQRT2 * .96, 16 / K, 4, 3); c.rotateY(Math.PI / 4); c.translate(0, h1 + .7 + 8 / K, 0); put('spire', c.applyMatrix4(M4)); top = Math.max(top, UP + (h1 + .7 + 16 / K) * K); }
    // the weed: a collar of wrack between the tides on the shaft (the shaft 10 m square at 2.5), where the tower is in the water at all
    const yb = Math.max(ground(x, z), -2.3), yt = 1.6; if (yt > yb + .2) { const g = new THREE.BoxGeometry(4.06, (yt - yb) / K, 4.06); g.translate(0, ((yt + yb) / 2 - FOOT) / K, 0); put('weed', g.applyMatrix4(G0.matrixWorld)); /* on the lower, upright shaft */ }
    towers.push({ i, x: +x.toFixed(2), z: +z.toFixed(2), ry: +ry.toFixed(4), cond, foot: +FOOT.toFixed(2), bed: +ground(x, z).toFixed(2), top: +top.toFixed(2), wet: +(top - SEA).toFixed(1), lean: U.lean }); });
  for (let i = 0; i < N - 1; i++) { const [xa, za] = pts[i], [xb, zb] = pts[i + 1], x = (xa + xb) / 2, z = (za + zb) / 2, hd = pts[i + 1][2], ry = Math.PI / 2 - hd, cond = spanConds[i];
    const G = gatePiece('bridge', { cond, school: 'cloch', key: `${key}:span:${i}`, ruin: true, ground: (ground(x, z) - .4 - BASE) / K }); G.scale.setScalar(K); G.rotation.y = ry; G.position.set(x, BASE, z); take(G);
    spans.push({ i, x: +x.toFixed(2), z: +z.toFixed(2), ry: +ry.toFixed(4), cond, deck: +DECK.toFixed(2), fallen: G.userData.fallen }); }
  // the scale: a plain 1.75 m post on the sand 14 m inshore of the first tower's foot
  const figure = (() => { const x = 6, z = z0 + 14, y = ground(x, z), h = 1.75, g = new THREE.CylinderGeometry(.2, .24, h, 10); g.translate(x, y + h / 2, z); put('mark', g); return { x, y: +y.toFixed(2), z, h }; })();
  const M = { strand: new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 1 }), sea: new THREE.MeshStandardMaterial({ color: new THREE.Color(.10, .2, .22), roughness: .12, metalness: .1, transparent: true, opacity: .86 }),
    stone: mat('ashlar', { ns: .8, color: 0xb2ab9e, rough: .85 }), spire: mat('ashlar', { ns: .8, color: 0xa8a294, rough: .85 }), weed: mat('rock', { ns: 1.4, color: 0x3a3a22, rough: .7 }), mark: new THREE.MeshStandardMaterial({ color: new THREE.Color(.5, .5, .52), roughness: .8 }) };
  let tris = 0, draws = 0;
  for (const [m, ms] of piecesBy) { const gs = ms.map(x => { const g = x.geometry.clone(); g.applyMatrix4(x.matrixWorld); return g; }), g = mergeGeometries(gs, false); gs.forEach(x => x.dispose()); const mesh = new THREE.Mesh(g, m); mesh.castShadow = mesh.receiveShadow = true; mesh.name = 'kit:' + (ms[0].userData.key || ''); group.add(mesh); tris += g.attributes.position.count / 3; draws++; }
  for (const [k, gs] of B) { const g = gs.length > 1 ? mergeGeometries(gs, false) : gs[0]; if (gs.length > 1) gs.forEach(x => x.dispose()); const mesh = new THREE.Mesh(g, M[k]); mesh.name = k; mesh.castShadow = !['strand', 'sea'].includes(k); mesh.receiveShadow = k !== 'sea'; if (k === 'sea') mesh.renderOrder = 2; group.add(mesh); tris += (g.index ? g.index.count : g.attributes.position.count) / 3; draws++; }
  return { group, tris: Math.round(tris), draws, ground, sea: SEA, deck: DECK, towers, spans, figure, k: K, gap: 16 * K };
}

// northlightAltar (Session 2395; OG-104's "Northlight Altar", the Mark: "a ring of glowing monoliths under an aurora"): a ring of single
// stones of the Weavers' on a high fell under snow, 120 m across, an altar on a dais at its heart. Not a gate's piece: each monolith is one
// stone, so it is drawn whole, not of the kit's courses. They do not glow: the script is cut dead in them, as in the ring of arches (#429 B);
// o.lit draws OG-104 as painted, the script burning pale blue in its grooves, for the DECISION.
// What OG-104 draws as glowing is read here as their stone, dark and polished by the wind, catching whatever is in the sky.
//   - the stones: twelve places on the circle, the one to the north empty (the ring's open side, the gap toward the aurora); each 6 to 7 m
//     wide, 2.8 to 3.2 m thick, sunk 3 m, tapering by a sixth to a shouldered cap of 2.6 m; the two flanking the gap 42 m to their caps,
//     whole and upright; six more standing 30 to 38 m, leaning up to 4°; two fallen whole toward the heart, half sunk in the snow; one
//     snapped, its stump 6 to 14 m and its top lying beside it. On each stone's face to the heart, a band of the script 1.8 m wide, cut dead;
//   - snow drifted against every standing stone and stump on its north side (the wind off the north);
//   - the heart: a dais of two square steps (16 and 11 m), its axis on the gap, and on it the altar, a slab of the stones' own stone 9 by 3.4 m
//     on two low blocks, the ring sigil cut dead in its top;
//   - the fell: level within the ring (±0.2 m), rolling beyond it and rising to the east and west, scoured to the rock in places; a frozen
//     tarn 96 m across 180 m to the south-west;
//   - a 1.75 m post at the foot of a standing stone (the scale, not a person).
// What the stones were for and why the north is open are the canon's and the quest writer's.
// -> { group, tris, draws, ground(x, z), R, stones: [{ i, a, x, z, cond, h, lean, low, top }], gap: { a, width }, altar: { y, len, w, top },
//   tarn: { x, z, r, y }, figure { x, y, z, h, stone } }
export function northlightAltar(o = {}) {
  const key = o.key || 'ruins:northlight', r = stream(key), N = 12, R = o.R || 60, SINK = 3, group = new THREE.Group();
  const TARN = { x: -150, z: 95, r: 48 };
  const g0 = (x, z) => { const d = Math.hypot(x, z), out = sstep(R + 14, R + 90, d); return .2 * fbm(x / 11, z / 11, 2) + out * (fbm(x / 90, z / 90, 4) * 14 + Math.abs(x) * .035); };
  TARN.y = +(g0(TARN.x, TARN.z) - .6).toFixed(2);
  const ground = (x, z) => { const t = Math.hypot(x - TARN.x, z - TARN.z), w = 1 - sstep(TARN.r - 4, TARN.r + 26, t); return g0(x, z) * (1 - w) + (TARN.y - 1.2) * w; };
  const B = new Map(), put = (k, g) => { const x = g.index ? g.toNonIndexed() : g; for (const a of Object.keys(x.attributes)) if (!['position', 'normal', 'uv'].includes(a)) x.deleteAttribute(a); if (!['script', 'sigil'].includes(k) && x.attributes.uv) x.deleteAttribute('uv'); x.computeVertexNormals(); if (!x.attributes.uv) worldUV(x, .25); (B.get(k) || B.set(k, []).get(k)).push(x); return x; };
  // the fell: a square 1,400 m across, snow scoured to grey rock where the noise is high and away from the ring
  { const N2 = 220, g = new THREE.PlaneGeometry(1400, 1400, N2, N2); g.rotateX(-Math.PI / 2); const P = g.attributes.position, col = [];
    for (let i = 0; i < P.count; i++) { const x = P.getX(i), z = P.getZ(i), y = ground(x, z); P.setY(i, y); const s = sstep(.12, .3, fbm(x / 26 + 7, z / 26, 3)) * sstep(R + 10, R + 60, Math.hypot(x, z));
      col.push(...[.93, .95, .98].map((v, j) => v * (1 - s) + [.44, .43, .42][j] * s)); }
    g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3)); g.computeVertexNormals(); worldUV(g, .08); B.set('fell', [g]); }
  { const g = new THREE.CircleGeometry(TARN.r + 6, 64); g.rotateX(-Math.PI / 2); g.translate(TARN.x, TARN.y, TARN.z); put('ice', g); }
  // one monolith in its own frame: the foot at y 0 (3 m under the snow), w wide, t thick, L to the cap's foot; the cap 2.6 m; +z the face to the heart
  const mono = (w, t, L) => { const b = new THREE.BoxGeometry(w, L, t, 1, 6, 1); b.translate(0, L / 2, 0); const P = b.attributes.position; for (let i = 0; i < P.count; i++) P.setX(i, P.getX(i) * (1 - P.getY(i) / L / 6));
    const c = new THREE.CylinderGeometry(.5, Math.SQRT1_2, 1, 4, 1); c.rotateY(Math.PI / 4); c.scale(w * 5 / 6, 2.6, t * .92); c.translate(0, L + 1.3, 0);
    const g = mergeGeometries([b.toNonIndexed(), c.toNonIndexed()], false); g.deleteAttribute('uv'); return g; };
  const band = (w, L) => { const h = Math.min(L - 6, 22), g = new THREE.PlaneGeometry(1.8, h); g.translate(0, SINK + 2 + h / 2, 0); const uv = g.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setY(i, uv.getY(i) * h / 14.4); return g; };
  const sock = (g, M) => { g.applyMatrix4(M); return g; }, bb = g => { g.computeBoundingBox(); return g.boundingBox; };
  const stones = [], dirs = [], conds = ['stand', 'stand', 'stand', 'stand', 'stand', 'stand', 'fallen', 'fallen', 'snapped'].sort(() => r() - .5); let ci = 0;
  for (let i = 1; i < N; i++) { const a = Math.PI + i * 2 * Math.PI / N + (r() - .5) * .04, x = R * Math.sin(a), z = R * Math.cos(a), ry = a + Math.PI, y0 = ground(x, z);
    const flank = i === 1 || i === N - 1, cond = flank ? 'stand' : conds[ci++], w = 6 + r(), t = 2.8 + r() * .4, h = flank ? 39.4 : 27.4 + r() * 8, L = h + SINK;
    const lean = cond === 'stand' && !flank ? (r() - .5) * 8 : 0, lax = r() < .5 ? 'x' : 'z', at = new THREE.Matrix4().makeTranslation(x, y0 - SINK, z).multiply(new THREE.Matrix4().makeRotationY(ry));
    const parts = [];
    if (cond === 'stand') { const M = at.clone().multiply(lax === 'x' ? new THREE.Matrix4().makeRotationX(lean * Math.PI / 180) : new THREE.Matrix4().makeRotationZ(lean * Math.PI / 180));
      parts.push(put('mono', sock(mono(w, t, L), M))); const s = band(w, L); s.translate(0, 0, t / 2 + .03); put('script', sock(s, M)); }
    else if (cond === 'fallen') { /* fallen whole toward the heart, on its face (the script under it), its foot by its socket, nearly half its thickness in the snow */
      const g = mono(w, t, L); g.rotateX(Math.PI / 2); g.rotateZ((r() - .5) * .06); const b0 = bb(g); g.translate(0, -b0.min.y - t * .45, -1.5 + (r() - .5));
      const M = new THREE.Matrix4().makeTranslation(x, y0, z).multiply(new THREE.Matrix4().makeRotationY(ry)); parts.push(put('mono', sock(g, M))); }
    else { /* snapped: the stump stands, broken jagged; the top lies beside it toward the heart, turned a little */
      const hs = 6 + r() * 8, Ls = hs + SINK, s = new THREE.BoxGeometry(w, Ls, t, 4, 1, 2); s.translate(0, Ls / 2, 0); const P = s.attributes.position;
      for (let k = 0; k < P.count; k++) if (P.getY(k) > Ls - .01) P.setY(k, Ls - r() * 1.8); parts.push(put('mono', sock(s, at.clone())));
      const g = mono(w * (1 - hs / L / 6), t, L - Ls); g.rotateX(Math.PI / 2); const b0 = bb(g); g.rotateY((r() - .5) * .6); g.translate(w * .2, -b0.min.y - t * .45, -2 - (r() * 3));
      parts.push(put('mono', sock(g, new THREE.Matrix4().makeTranslation(x, y0, z).multiply(new THREE.Matrix4().makeRotationY(ry))))); }
    // the drift against the north side of anything standing
    if (cond !== 'fallen') { const d = new THREE.SphereGeometry(1, 18, 8, 0, Math.PI * 2, 0, Math.PI / 2); d.scale(w * .55 + 1.2, 1.4 + r() * .8, 4.5 + r() * 2); d.translate(x, y0 - .3, z - t / 2 - 1.8); put('drift', d); }
    let low = Infinity, top = -Infinity; for (const p of parts) { const q = bb(p); low = Math.min(low, q.min.y); top = Math.max(top, q.max.y); }
    stones.push({ i, a: +a.toFixed(3), x: +x.toFixed(2), z: +z.toFixed(2), ry: +ry.toFixed(3), cond, flank, w: +w.toFixed(2), t: +t.toFixed(2), h: +(top - y0).toFixed(1), lean: +lean.toFixed(2), low: +(low - y0).toFixed(2), top: +top.toFixed(2) }); }
  // the heart: two square steps of 0.8 m on the axis of the gap (north, -z), the altar on two low blocks, the sigil cut dead in its top
  const altar = (() => { let y = ground(0, 0) - .2; for (const [k, s] of [[0, 16], [1, 11]]) { const g = new THREE.BoxGeometry(s, .8, s); g.translate(0, y + .4, 0); put('step', g); y += .8; }
    for (const z of [-2.8, 2.8]) { const g = new THREE.BoxGeometry(2.6, .6, 1.4); g.translate(0, y + .3, z); put('step', g); }
    const len = 9, w = 3.4, h = 1.3, g = new THREE.BoxGeometry(w, h, len, 1, 1, 3); g.translate(0, y + .6 + h / 2, 0); g.deleteAttribute('uv'); put('mono', g);
    const top = y + .6 + h, s = new THREE.PlaneGeometry(3, 3); s.rotateX(-Math.PI / 2); s.translate(0, top + .01, 0); put('sigil', s); return { y: +y.toFixed(2), len, w, top: +top.toFixed(2) }; })();
  const figure = (() => { const st = stones.filter(s => s.cond === 'stand' && !s.flank).sort((p, q) => q.x - p.x)[0], h = 1.75, x = st.x * .93, z = st.z * .93, y = ground(x, z), g = new THREE.CylinderGeometry(.2, .24, h, 10); g.translate(x, y + h / 2, z); put('mark', g); return { x: +x.toFixed(2), y: +y.toFixed(2), z: +z.toFixed(2), h, stone: st.i }; })();
  // the textures: the script (a column of the Weavers' marks cut in the stone, dark in the grooves, nothing lit) and the ring sigil
  const cut = (w, h, draw, bg = '#2c2f34', fg = '#0d0e10') => { const c = document.createElement('canvas'); c.width = w; c.height = h; const x = c.getContext('2d'); x.fillStyle = bg; x.fillRect(0, 0, w, h); x.strokeStyle = fg; x.lineCap = 'round'; draw(x); const t = new THREE.CanvasTexture(c); t.anisotropy = 8; return t; };
  const marks = x => { const rs = stream(key + ':script'); for (let k = 0; k < 12; k++) { const cy = 44 + k * 84, kind = Math.floor(rs() * 4); x.lineWidth = 7; x.beginPath();
    if (kind === 0) x.arc(64, cy, 30, 0, 7); else if (kind === 1) { x.arc(64, cy, 30, 0, 7); x.moveTo(64, cy - 38); x.lineTo(64, cy + 38); } else if (kind === 2) { x.arc(64, cy, 30, Math.PI * .1, Math.PI * .9); x.moveTo(94, cy - 6); x.arc(64, cy - 6, 30, 0, -Math.PI, true); }
    else { x.moveTo(64, cy - 36); x.lineTo(64, cy + 36); for (const d of [-20, 0, 20]) { x.moveTo(44, cy + d); x.lineTo(84, cy + d); } } x.stroke(); } }, scriptT = cut(128, 1024, marks), glowT = o.lit ? cut(128, 1024, marks, '#000', '#fff') : null;
  const sigilT = cut(512, 512, x => { x.lineWidth = 16; x.beginPath(); x.arc(256, 256, 170, 0, 7); x.stroke(); x.lineWidth = 9; x.beginPath(); x.arc(256, 256, 96, 0, 7); x.stroke(); x.lineWidth = 10; x.beginPath(); x.moveTo(256, 30); x.lineTo(256, 482); x.moveTo(30, 256); x.lineTo(482, 256); x.stroke(); });
  scriptT.wrapT = THREE.RepeatWrapping; if (glowT) glowT.wrapT = THREE.RepeatWrapping;
  const snow = mat('plaster', { ns: .3, color: 0xffffff, rough: .95 }); snow.vertexColors = true;
  const M = { fell: snow, ice: new THREE.MeshStandardMaterial({ color: new THREE.Color(.36, .45, .52), roughness: .2, metalness: .05 }), drift: mat('plaster', { ns: .25, color: 0xf4f7fb, rough: .95 }),
    mono: mat('rock', { ns: .3, color: 0x6a7079, rough: .3 }), script: new THREE.MeshStandardMaterial({ map: scriptT, roughness: .45, polygonOffset: true, polygonOffsetFactor: -2, ...(glowT ? { emissive: new THREE.Color(.45, .9, 1), emissiveMap: glowT, emissiveIntensity: 1.6 } : {}) }),
    step: mat('ashlar', { ns: .8, color: 0x8e8c88, rough: .85 }), sigil: new THREE.MeshStandardMaterial({ map: sigilT, roughness: .5, polygonOffset: true, polygonOffsetFactor: -2 }), mark: new THREE.MeshStandardMaterial({ color: new THREE.Color(.5, .5, .52), roughness: .8 }) };
  let tris = 0, draws = 0;
  for (const [k, gs] of B) { const g = gs.length > 1 ? mergeGeometries(gs, false) : gs[0]; if (gs.length > 1) gs.forEach(x => x.dispose()); const mesh = new THREE.Mesh(g, M[k]); mesh.name = k; mesh.castShadow = !['fell', 'ice', 'sigil', 'script'].includes(k); mesh.receiveShadow = true; group.add(mesh); tris += (g.index ? g.index.count : g.attributes.position.count) / 3; draws++; }
  return { group, tris: Math.round(tris), draws, ground, R, stones, gap: (() => { const p = stones[0], q = stones[stones.length - 1]; return { a: Math.PI, width: +(Math.hypot(p.x - q.x, p.z - q.z) - (p.w + q.w) / 2).toFixed(1) }; })(), altar, tarn: TARN, figure, sink: SINK };
}
