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
import { mergeGeometries, mergeVertices } from 'three/addons/utils/BufferGeometryUtils.js';
import { mat, worldUV, fbm, sstep } from './common.js';
import { gatePiece, stream, cutMat, GK_SCHOOLS } from './gatekit.js';

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
//   - Session 2415: a passage through each tower at the decks (gatekit's pier with `passage`), 5 m wide and 9 m high, its floor the decks'
//     walking face, so the chain is walked from the strand through all six towers to the open sea; and a spit of sand heaped against the
//     first tower's landward face to the decks' height, the way up from the strand (where the decks are under the sand, nothing).
// -> { group, tris, draws, ground(x, z), sea (y of the water), deck (y of the decks' walking face), towers: [{ i, x, z, ry, cond, foot,
//   top, wet (m of the shaft above the water), lean, hd (the chain's heading through it) }], spans: [{ i, x, z, ry, cond, deck }], figure { x, y, z, h }, k,
//   passage { w, h, y }, spit { z0 (its end at the first tower's face), w (half its back's width), side } }
export function drownedSpires(o = {}) {
  const key = o.key || 'ruins:spires', r = stream(key), K = 2.5, N = 6, D = 50, LV = { a: -1, b: 4.5, c: -5.5 };
  const DECK = typeof o.deck === 'number' ? o.deck : LV[o.deck] ?? LV.b, SEA = { low: -2, mid: 0, high: 2 }[o.tide] ?? 0, group = new THREE.Group();
  // the strand: turf above +3 inland (+z), sand below it, the bed falling 1 in 14 seaward (-z) to 16 m deep; rolling a little
  const ground0 = (x, z) => { const roll = fbm(x / 40, z / 40, 3) * 1.2, base = z > 0 ? Math.min(7, 1.2 + z * .06) : Math.max(-16, 1.2 + z / 14); return base + roll; };
  // Session 2415: the spit, sand the sea has heaped against the first tower's landward face (at z -35, the tower 10 m square at -40), 14 m
  // wide on its back, at the decks' height up the strand until the bank meets it: the way onto the chain. Its sides fall 1 in 1.6, and
  // it ends 0.3 m inside the tower's face. Where the decks are under the strand there is no spit.
  const SPIT = { z0: -35.3, w: 7, side: 1.6 }, ground = (x, z) => { const g = ground0(x, z); if (DECK <= g || z < SPIT.z0 - 6) return g;
    const top = DECK + .05 * fbm(x / 6, z / 6, 2), off = Math.max(0, Math.abs(x) - SPIT.w) / SPIT.side, end = Math.max(0, SPIT.z0 - z) / .9; return Math.max(g, top - off - end); };
  const B = new Map(), put = (k, g) => { const x = g.index ? g.toNonIndexed() : g; for (const a of Object.keys(x.attributes)) if (!['position', 'normal', 'uv'].includes(a)) x.deleteAttribute(a); if (!x.attributes.normal) x.computeVertexNormals(); if (!x.attributes.uv) worldUV(x, .25); (B.get(k) || B.set(k, []).get(k)).push(x); return x; };
  { const N2 = 180, g = new THREE.PlaneGeometry(900, 900, N2, N2); g.rotateX(-Math.PI / 2); g.translate(0, 0, -250); const P = g.attributes.position, col = [];
    for (let i = 0; i < P.count; i++) { const x = P.getX(i), z = P.getZ(i), y = ground(x, z); P.setY(i, y); const t = Math.min(1, Math.max(0, (y - 2.6) / 1.2)), w = Math.min(1, Math.max(0, (2.4 - y) / 4.4)) * (y > -2.4 ? 1 : 0);
      const c = [.62 - .1 * w, .56 - .08 * w, .42 - .02 * w].map((v, j) => v * (1 - t) + [.30, .40, .17][j] * t); col.push(...c); }
    g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3)); g.computeVertexNormals(); worldUV(g, .12); B.set('strand', [g]); }
  { const g = new THREE.PlaneGeometry(3000, 2400); g.rotateX(-Math.PI / 2); g.translate(0, SEA, -900); put('sea', g); }
  // the line: from the strand's low-water mark out to sea, bending 14° over its length; tower i at (x_i, z_i), the chain's heading at it
  const z0 = -40, pts = []; { let x = 0, z = z0, h = 0; for (let i = 0; i < N; i++) { pts.push([x, z, h]); const hn = h + (14 / (N - 1)) * Math.PI / 180; x += Math.sin(hn) * D; z -= Math.cos(hn) * D; h = hn; } }
  const conds = ['cracked', 'cracked', 'broken', 'cracked', 'cracked', 'broken'], spanConds = ['cracked', 'cracked', 'cracked', 'broken', 'cracked'];
  const BASE = DECK - 6.45 * K /* the bridge's springing: its deck's walking face 6.45 m over it in the kit */, FOOT = BASE - 12 /* every tower stands on a plinth sunk under the bed */, PASS = { w: 5, h: 9 } /* Session 2415: the passage through each tower at the decks, 5 m wide and 9 m high, its floor the decks' face */;
  // Session 2425: merged by the part's key (stone, dress, floor, cut, …), not by material: each condition has its own copy of the same stone,
  // so by material the cut sigil's draw took the chain to 21; every part here is dead, so a key looks the same in every condition
  const piecesBy = new Map(), take = G => { G.updateMatrixWorld(true); G.traverse(m => { if (!m.isMesh) return; const k = m.userData.key; if (!piecesBy.has(k)) piecesBy.set(k, [m.material, []]); piecesBy.get(k)[1].push(m); }); };
  const towers = [], spans = [], v = new THREE.Vector3();
  // Session 2419: a tower turns to the mean of its two spans' headings (pts[i][2] is the heading the line came in on before tower i; the
  // span from tower i runs on pts[i + 1][2]); it was the mean of the two before, 1.5 steps (4.2°) off the line it stands on
  const hOut = i => pts[Math.min(N - 1, i + 1)][2];
  pts.forEach(([x, z, h], i) => { const hd = i === 0 ? hOut(0) : i === N - 1 ? h : (h + hOut(i)) / 2, ry = -hd, cond = conds[i];
    // the shaft: two of the kit's piers, one on the other; the lower whole (its foot in the bed, its head a string course), the upper in the tower's condition
    const G0 = gatePiece('pier', { cond: 'whole', school: 'cloch', key: `${key}:tower:${i}:lo`, ruin: true, cut: true, passage: { y: (DECK - FOOT) / K, h: PASS.h / K, w: PASS.w / K } /* Session 2415: the way through at the decks */ }), h0 = G0.userData.size.h - .5; G0.scale.setScalar(K); G0.rotation.y = ry; G0.position.set(x, FOOT, z); take(G0);
    // Session 2419: a broken tower's upper pier is turned a quarter, so its stones (gatekit throws them along the piece's z) fall across the
    // chain into the sea; along it, the longest lay on the bed and stood up through the decks beside the tower
    const UP = FOOT + h0 * K, ru = cond === 'broken' ? ry + Math.PI / 2 : ry, G = gatePiece('pier', { cond, school: 'cloch', key: `${key}:tower:${i}`, ruin: true, cut: true, ground: (ground(x, z) - .4 - UP) / K /* what falls lies on the bed */ }), U = G.userData; G.scale.setScalar(K); G.rotation.y = ru; G.position.set(x, UP, z); take(G);
    let top = -Infinity; [G0, G].forEach(Gi => Gi.traverse(m => { if (!m.isMesh) return; const P = m.geometry.attributes.position; for (let j = 0; j < P.count; j += 3) { v.fromBufferAttribute(P, j).applyMatrix4(m.matrixWorld); top = Math.max(top, v.y); } }));
    const lean = (U.lean || 0) * Math.PI / 180, M4 = new THREE.Matrix4().makeTranslation(x, UP, z).multiply(new THREE.Matrix4().makeRotationY(ru)).multiply(new THREE.Matrix4().makeScale(K, K, K)).multiply(new THREE.Matrix4().makeRotationX(lean));
    // the spire (on a standing tower only): a corbel band and a cap of four faces, 16 m to its point, leaning with the shaft
    if (cond === 'cracked') { const h1 = U.size.h; { const g = new THREE.BoxGeometry(5.6, .7, 5.6); g.translate(0, h1 + .35, 0); put('stone', g.applyMatrix4(M4)); }
      const c = new THREE.ConeGeometry(5.6 / Math.SQRT2 * .96, 16 / K, 4, 3); c.rotateY(Math.PI / 4); c.translate(0, h1 + .7 + 8 / K, 0); put('spire', c.applyMatrix4(M4)); top = Math.max(top, UP + (h1 + .7 + 16 / K) * K); }
    // the weed: a collar of wrack between the tides on the shaft (the shaft 10 m square at 2.5), where the tower is in the water at all
    const yb = Math.max(ground(x, z), -2.3), yt = 1.6; if (yt > yb + .2) { const g = new THREE.BoxGeometry(4.06, (yt - yb) / K, 4.06); g.translate(0, ((yt + yb) / 2 - FOOT) / K, 0); put('weed', g.applyMatrix4(G0.matrixWorld)); /* on the lower, upright shaft */ }
    towers.push({ i, x: +x.toFixed(2), z: +z.toFixed(2), ry: +ry.toFixed(4), cond, foot: +FOOT.toFixed(2), bed: +ground(x, z).toFixed(2), top: +top.toFixed(2), wet: +(top - SEA).toFixed(1), lean: U.lean, hd: +hd.toFixed(4) }); });
  for (let i = 0; i < N - 1; i++) { const [xa, za] = pts[i], [xb, zb] = pts[i + 1], x = (xa + xb) / 2, z = (za + zb) / 2, hd = pts[i + 1][2], ry = Math.PI / 2 - hd, cond = spanConds[i];
    const G = gatePiece('bridge', { cond, school: 'cloch', key: `${key}:span:${i}`, ruin: true, cut: true, ground: (ground(x, z) - .4 - BASE) / K }); G.scale.setScalar(K); G.rotation.y = ry; G.position.set(x, BASE, z); take(G);
    spans.push({ i, x: +x.toFixed(2), z: +z.toFixed(2), ry: +ry.toFixed(4), cond, deck: +DECK.toFixed(2), fallen: G.userData.fallen }); }
  // the scale: a plain 1.75 m post on the sand 14 m inshore of the first tower's foot
  const figure = (() => { const x = 6, z = z0 + 14, y = ground(x, z), h = 1.75, g = new THREE.CylinderGeometry(.2, .24, h, 10); g.translate(x, y + h / 2, z); put('mark', g); return { x, y: +y.toFixed(2), z, h }; })();
  const M = { strand: new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 1 }), sea: new THREE.MeshStandardMaterial({ color: new THREE.Color(.10, .2, .22), roughness: .12, metalness: .1, transparent: true, opacity: .86 }),
    stone: mat('ashlar', { ns: .8, color: 0xb2ab9e, rough: .85 }), spire: mat('ashlar', { ns: .8, color: 0xa8a294, rough: .85 }), weed: mat('rock', { ns: 1.4, color: 0x3a3a22, rough: .7 }), mark: new THREE.MeshStandardMaterial({ color: new THREE.Color(.5, .5, .52), roughness: .8 }) };
  let tris = 0, draws = 0;
  for (const [, [m, ms]] of piecesBy) { const gs = ms.map(x => { const g = x.geometry.clone(); g.applyMatrix4(x.matrixWorld); return g; }), g = mergeGeometries(gs, false); gs.forEach(x => x.dispose()); const mesh = new THREE.Mesh(g, m); mesh.receiveShadow = true; mesh.castShadow = !['dead', 'cut', 'cutRing', 'script', 'ring', 'crack'].includes(ms[0].userData.key); /* S2425 */ mesh.name = 'kit:' + (ms[0].userData.key || ''); group.add(mesh); tris += g.attributes.position.count / 3; draws++; }
  for (const [k, gs] of B) { const g = gs.length > 1 ? mergeGeometries(gs, false) : gs[0]; if (gs.length > 1) gs.forEach(x => x.dispose()); const mesh = new THREE.Mesh(g, M[k]); mesh.name = k; mesh.castShadow = !['strand', 'sea'].includes(k); mesh.receiveShadow = k !== 'sea'; if (k === 'sea') mesh.renderOrder = 2; group.add(mesh); tris += (g.index ? g.index.count : g.attributes.position.count) / 3; draws++; }
  return { group, tris: Math.round(tris), draws, ground, sea: SEA, deck: DECK, towers, spans, figure, k: K, gap: 16 * K, passage: { ...PASS, y: DECK }, spit: { ...SPIT } };
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

// The Scarred Gate (Session 2398; OG-104's Aurenne panel, "a ruined gate, its surface cracked and incomplete; unlike the others, this one
// shows signs of violent destruction"): a ring of the Weavers' stood on its edge in a red desert among buttes, as the sheet paints it. The
// one site of the sixteen that is a gate in the canon's own terms (Part I: a gate's condition; §5: where the binding tore worst), so it is
// drawn as a gate that failed by catastrophe and then went quiet; whether it still wakes is the DECISION's.
//   - the ring: 80 m across its outer face and 56 m across its opening, 10 m deep, its heart 30 m over the sand, so it stands 70 m and its
//     foot is buried 10 m; two courses of voussoirs (36 on the inner, 6 m; 44 on the outer, 6 m, broken joint), the script cut dead in a
//     band round the soffit; it stands on a plinth of two steps in slabs, the sill 0.6 m over the upper step;
//   - the blow: from under its right foot, in front. The outer course is gone over the crown and down the right (from 20° left of the top to
//     95° right of it), and one stone in three from 95 to 150°; the inner course stands whole, but its stones there are slipped and turned,
//     and at 48° right of the top a cleft runs through it, the stones beyond it dropped and opened 1.2 m at the face; the stone is burned
//     dark toward the blast;
//   - the land: a crater 44 m across and 4 m deep before the right foot, its rim thrown up, the plinth's slabs gone into it or tipped at its
//     edge, and a scar 220 m long (24 m wide at the crater, 4 m deep) running from it to the south-east, black glass in red sand; the outer course's stones lie thrown across
//     the sand out to 150 m, each sunk a third of its depth where it landed;
//   - seven red buttes 25 to 80 m high, 200 to 450 m out, behind the gate and to its sides, none in the wide sector before it;
//   - a 1.75 m post on the upper step at the ring's foot as the scale.
// o.wake (the DECISION's B): the gone stones hang over their seats, lifted and turned, with a violet seam burning on each seat and the
//   script burning violet, as gatekit's 'broken' draws a catastrophic gate inside; nothing is thrown on the sand then.
// -> { group, tris, draws, ground(x, z), R0, R1, CY, D, inner, outer, gone, slipped, thrown: [{ x, z, low, top }], hung: [{ lift }], cleft { a, open, drop },
//   crater { x, z, r, d }, scar { L, a }, buttes: [{ x, z, h, r }], plinth { top, slabs, lost, tipped }, figure, wake }
export function scarredGate(o = {}) {
  const key = o.key || 'ruins:scarred', r = stream(key), WAKE = !!o.wake, group = new THREE.Group();
  const R0 = 28, RM = 34, R1 = 40, CY = 30, D = 10, DEG = Math.PI / 180, CR = { x: 22, z: 24, r: 22, d: 4 }, SC = { L: 220, a: .7 }, CLEFT = { a: 48, open: 1.2, drop: .9 };
  const su = [Math.cos(SC.a), Math.sin(SC.a)];
  const crater = (x, z) => { const t = Math.hypot(x - CR.x, z - CR.z) / CR.r; return (t < 1 ? -CR.d * (1 - t * t) : 0) + 1.4 * Math.exp(-(((t - 1.1) / .16) ** 2)); };
  const scarAt = (x, z) => { const dx = x - CR.x, dz = z - CR.z, s = dx * su[0] + dz * su[1], l = Math.abs(-dx * su[1] + dz * su[0]); if (s < CR.r * .6 || s > SC.L) return { cut: 0, near: 0 };
    const f = 1 - s / SC.L, w = 12 * (1 - .7 * s / SC.L) + 2 * fbm(s / 30, 3.3, 2); return { cut: (l < w ? -4 * f * (1 - (l / w) ** 2) : 0) + 1.1 * f * Math.exp(-(((l - w * 1.15) / (w * .25)) ** 2)), near: (1 - .4 * s / SC.L) * (1 - sstep(w * .9, w * 1.8, l)) }; };
  const g0 = (x, z) => { const d = Math.hypot(x, z), out = sstep(70, 320, d); return .25 * fbm(x / 13, z / 13, 2) * sstep(30, 60, d) + out * (fbm(x / 120 + 4, z / 120, 4) * 12 + 1.6 * Math.sin(x / 23 + 2 * fbm(x / 60, z / 60, 2)));
  };
  const ground = (x, z) => g0(x, z) + crater(x, z) + scarAt(x, z).cut;
  const scorch = (x, z) => Math.max(1 - sstep(CR.r * 1.05, CR.r * 1.7, Math.hypot(x - CR.x, z - CR.z)), scarAt(x, z).near) * (.9 + .1 * fbm(x / 7, z / 7, 2));
  const B = new Map(), put = (k, g) => { const x = g.index ? g.toNonIndexed() : g; for (const a of Object.keys(x.attributes)) if (!['position', 'normal', 'uv', 'color'].includes(a)) x.deleteAttribute(a); x.computeVertexNormals(); if (!x.attributes.uv) worldUV(x, .2); (B.get(k) || B.set(k, []).get(k)).push(x); return x; };
  const bb = g => { g.computeBoundingBox(); return g.boundingBox; };
  // the sand: a square 1,600 m across, its grid drawn in toward the gate (|u|^1.7: 2 m a cell at the crater, 13 m at the edge), red, burned to
  // black glass in the crater and along the scar
  { const N = 200, g = new THREE.PlaneGeometry(2, 2, N, N); g.rotateX(-Math.PI / 2); const P = g.attributes.position, col = [], wp = u => 800 * Math.sign(u) * Math.abs(u) ** 1.7;
    for (let i = 0; i < P.count; i++) { const x = wp(P.getX(i)), z = wp(P.getZ(i)); P.setX(i, x); P.setZ(i, z); P.setY(i, ground(x, z)); const v = fbm(x / 40 + 3, z / 40, 3), s = Math.min(1, scorch(x, z));
      const c = [.80, .53, .35].map((q, j) => q * (1 - .25 * sstep(.45, .7, v)) + [0, -.04, -.03][j] * v); col.push(...c.map((q, j) => q * (1 - s) + [.09, .06, .055][j] * s)); }
    g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3)); worldUV(g, .08); B.set('sand', [g]); }
  // a stone with its own colour: burned toward the blast (a point over the crater) on every vertex
  const BL = new THREE.Vector3(CR.x, 6, CR.z - 4);
  const tint = g => { const P = g.attributes.position, c = []; for (let i = 0; i < P.count; i++) { const s = 1 - sstep(16, 62, Math.hypot(P.getX(i) - BL.x, P.getY(i) - BL.y, P.getZ(i) - BL.z)); c.push(...[1, 1, 1].map((v, j) => v * (1 - .78 * s) + [.02, 0, 0][j] * s)); }
    g.setAttribute('color', new THREE.Float32BufferAttribute(c, 3)); return g; };
  // a voussoir between angles ta and tb (from the top, clockwise seen from the front, +z), radii ra to rb, its faces at z +zf and -zb
  const at = (t, rr) => [rr * Math.sin(t), CY + rr * Math.cos(t)];
  const wedge = (ta, tb, ra, rb, zf, zb, gap = .07) => { const out = [], q = [at(ta, ra), at(tb, ra), at(tb, rb), at(ta, rb)], c = q.reduce((s, p) => [s[0] + p[0] / 4, s[1] + p[1] / 4], [0, 0]);
    const k = 1 - gap / Math.max(...q.map(p => Math.hypot(p[0] - c[0], p[1] - c[1]))); let p = q.map(v => [c[0] + (v[0] - c[0]) * k, c[1] + (v[1] - c[1]) * k]); let ar = 0; for (let i = 0; i < 4; i++) { const j = (i + 1) % 4; ar += p[i][0] * p[j][1] - p[j][0] * p[i][1]; } if (ar < 0) p = p.reverse();
    const F = p.map(v => [v[0], v[1], zf]), Bk = p.map(v => [v[0], v[1], -zb]), tri = (a, b, d) => out.push(...a, ...b, ...d);
    tri(F[0], F[1], F[2]); tri(F[0], F[2], F[3]); tri(Bk[0], Bk[2], Bk[1]); tri(Bk[0], Bk[3], Bk[2]); for (let i = 0; i < 4; i++) { const j = (i + 1) % 4; tri(F[i], Bk[i], Bk[j]); tri(F[i], Bk[j], F[j]); }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(out, 3)); return { g, c }; };
  // the soffit's band of script on an inner stone, 3.2 m wide, v down the arc in 14.4 m repeats
  let arcV = 0; const band = (ta, tb) => { const n = 3, pos = [], uv = [], L = R0 * (tb - ta); for (let i = 0; i <= n; i++) { const t = ta + (tb - ta) * i / n, [x, y] = at(t, R0 - .04); pos.push(x, y, 1.6, x, y, -1.6); uv.push(0, (arcV + L * i / n) / 14.4, 1, (arcV + L * i / n) / 14.4); }
    arcV += L; const idx = []; for (let i = 0; i < n; i++) { const a = i * 2; idx.push(a, a + 2, a + 1, a + 1, a + 2, a + 3); } const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx); return g.toNonIndexed(); };
  const inBlast = t => t > -20 * DEG && t < 95 * DEG, NI = 36, NO = 44, rl = stream(key + ':lost'); let slipped = 0, gone = 0; const thrown = [], hung = [], seats = [];
  // the inner course: whole, but over the blast its stones slipped out and turned, and past the cleft dropped and opened
  for (let i = 0; i < NI; i++) { const ta = (i / NI) * Math.PI * 2 - Math.PI, tb = ((i + 1) / NI) * Math.PI * 2 - Math.PI, tm = (ta + tb) / 2, { g, c } = wedge(ta, tb, R0, RM, D / 2 + r() * .3, D / 2 + (r() - .5) * .25);
    const s = band(ta, tb), M = new THREE.Matrix4();
    if (inBlast(tm)) { const out = .2 + r() * .6, rot = (r() - .5) * 5 * DEG, past = tm > CLEFT.a * DEG; const dx = Math.sin(tm) * out + (past ? CLEFT.open * Math.cos(tm) : 0), dy = Math.cos(tm) * out - (past ? CLEFT.drop : 0);
      M.makeTranslation(c[0] + dx, c[1] + dy, (r() - .5) * .8).multiply(new THREE.Matrix4().makeRotationFromEuler(new THREE.Euler((r() - .5) * 2 * DEG, (r() - .5) * 3 * DEG, rot))).multiply(new THREE.Matrix4().makeTranslation(-c[0], -c[1], 0)); slipped++; }
    put('stone', tint(g.applyMatrix4(M))); put('script', s.applyMatrix4(M)); }
  // the outer course: gone over the blast (thrown on the sand, or hung over its seat when the gate wakes), one in three gone from 95 to 150° right
  for (let i = 0; i < NO; i++) { const sh = .5 / NO, ta = (i / NO + sh) * Math.PI * 2 - Math.PI, tb = ((i + 1) / NO + sh) * Math.PI * 2 - Math.PI, tm = (ta + tb) / 2, { g, c } = wedge(ta, tb, RM, R1, D / 2 + (r() - .5) * .4, D / 2 + r() * .3);
    const lost = inBlast(tm) || (tm >= 95 * DEG && tm < 150 * DEG && rl() < .34);
    if (!lost) { put('stone', tint(g)); continue; } gone++; seats.push(tm);
    if (WAKE) { const lift = 3 + r() * 8, M = new THREE.Matrix4().makeTranslation(c[0] + Math.sin(tm) * lift, c[1] + Math.cos(tm) * lift, (r() - .5) * 4).multiply(new THREE.Matrix4().makeRotationFromEuler(new THREE.Euler((r() - .5) * 30 * DEG, (r() - .5) * 30 * DEG, (r() - .5) * 40 * DEG))).multiply(new THREE.Matrix4().makeTranslation(-c[0], -c[1], 0));
      put('stone', tint(g.applyMatrix4(M))); hung.push({ t: +(tm / DEG).toFixed(1), lift: +lift.toFixed(2) });
      const sm = wedge(ta + .004, tb - .004, RM + .02, RM + .08, D / 2 - .2, D / 2 - .2, 0).g; put('seam', sm); continue; }
    // thrown: outward on its own side and fore or aft, the nearer the more; laid on a random face and sunk a third of its depth where it lands
    const far = tm < 95 * DEG ? 30 + 120 * r() ** 1.6 : 4 + 10 * r(), side = Math.sin(tm) >= 0 ? 1 : -1, x = Math.sin(tm) * (R1 + far * .7) + side * far * .3 * r(), z = (r() - .5) * 2 * (12 + far * .8);
    g.translate(-c[0], -c[1], 0); g.applyMatrix4(new THREE.Matrix4().makeRotationFromEuler(new THREE.Euler(r() * Math.PI * 2, r() * Math.PI * 2, r() * Math.PI * 2))); const b0 = bb(g), dz = Math.min(b0.max.x - b0.min.x, b0.max.y - b0.min.y, b0.max.z - b0.min.z);
    const yc = Math.min(...[[0, 0], [2, 2], [-2, 2], [2, -2], [-2, -2]].map(([u, v]) => ground(x + u, z + v))); g.translate(x, yc - b0.min.y - dz / 3, z); put('stone', tint(g));
    const P = g.attributes.position; let low = Infinity, top = -Infinity; for (let k = 0; k < P.count; k++) { const d = P.getY(k) - ground(P.getX(k), P.getZ(k)); low = Math.min(low, d); top = Math.max(top, d); }
    thrown.push({ t: +(tm / DEG).toFixed(1), x: +x.toFixed(1), z: +z.toFixed(1), low: +low.toFixed(2), top: +top.toFixed(2) }); }
  // the plinth: two steps of 4 m slabs (80 by 26 m, then 64 by 18), each 0.7 and 0.8 m; the crater has taken those over its deep part and tipped the rest at its edge
  const plinth = { top: 1.4, slabs: 0, lost: 0, tipped: 0 };
  for (const [W2, D2, y0, h] of [[80, 26, -.6, 1.2], [64, 18, .6, .8]]) for (let x = -W2 / 2 + 2; x < W2 / 2; x += 4) for (let z = -D2 / 2 + 2; z < D2 / 2; z += 4) { plinth.slabs++; const d = -crater(x, z) - scarAt(x, z).cut;
    if (d > 1.1) { plinth.lost++; continue; } const g = new THREE.BoxGeometry(3.94, h, 3.94); let M = new THREE.Matrix4().makeTranslation(x, y0 + h / 2, z);
    if (d > .15) { const ax = Math.atan2(CR.z - z, CR.x - x), tip = Math.min(14, d * 14) * DEG; M = new THREE.Matrix4().makeTranslation(x, y0 + h / 2 - d * .7, z).multiply(new THREE.Matrix4().makeRotationAxis(new THREE.Vector3(-Math.sin(ax), 0, Math.cos(ax)).normalize(), -tip)); plinth.tipped++; }
    put('step', tint(g.applyMatrix4(M))); }
  // the buttes: red sandstone in ledges, behind the gate and to its sides, never in front (the view's axis)
  const buttes = []; { const rb = stream(key + ':buttes'); let tries = 0; while (buttes.length < 7 && tries++ < 200) { const a = rb() * Math.PI * 2, d = 200 + rb() * 250, x = Math.sin(a) * d, z = -Math.cos(a) * d;
      if (z > 30 && Math.abs(x) < z * 1.8) continue; if (buttes.some(b => Math.hypot(b.x - x, b.z - z) < 110)) continue; const h = 25 + rb() * 55, rr = 18 + rb() * 27; buttes.push({ x: +x.toFixed(1), z: +z.toFixed(1), h: +h.toFixed(1), r: +rr.toFixed(1) });
      const y0 = ground(x, z) - 8, g = new THREE.CylinderGeometry(rr * .82, rr * 1.15, h + 8, 18, 8); g.translate(0, (h + 8) / 2, 0); const P = g.attributes.position;
      for (let k = 0; k < P.count; k++) { const px = P.getX(k), py = P.getY(k), pz = P.getZ(k), rad = Math.hypot(px, pz); if (rad < .01) continue; const ang = Math.atan2(pz, px), ledge = .1 * Math.floor(py / (h + 8) * 4 + .3 * fbm(ang, 2.1, 2)), f = 1 + .22 * (fbm(ang * 1.6 + x, py / 18, 3) - .5) - ledge * .6;
        P.setX(k, px * f); P.setZ(k, pz * f); } g.translate(x, y0, z); put('butte', g); } }
  const figure = (() => { const x = -10, z = 7, y = plinth.top, h = 1.75, g = new THREE.CylinderGeometry(.2, .24, h, 10); g.translate(x, y + h / 2, z); put('mark', g); return { x, y, z, h }; })();
  // the script (cut dead; violet in its grooves when the gate wakes)
  const cut = (w, h, draw, bg, fg) => { const c = document.createElement('canvas'); c.width = w; c.height = h; const x = c.getContext('2d'); x.fillStyle = bg; x.fillRect(0, 0, w, h); x.strokeStyle = fg; x.lineCap = 'round'; draw(x); const t = new THREE.CanvasTexture(c); t.anisotropy = 8; t.wrapT = THREE.RepeatWrapping; return t; };
  const marks = x => { const rs = stream(key + ':script'); for (let k = 0; k < 12; k++) { const cy = 44 + k * 84, kind = Math.floor(rs() * 4); x.lineWidth = 7; x.beginPath();
    if (kind === 0) x.arc(64, cy, 30, 0, 7); else if (kind === 1) { x.arc(64, cy, 30, 0, 7); x.moveTo(64, cy - 38); x.lineTo(64, cy + 38); } else if (kind === 2) { x.arc(64, cy, 30, Math.PI * .1, Math.PI * .9); x.moveTo(94, cy - 6); x.arc(64, cy - 6, 30, 0, -Math.PI, true); }
    else { x.moveTo(64, cy - 36); x.lineTo(64, cy + 36); for (const d of [-20, 0, 20]) { x.moveTo(44, cy + d); x.lineTo(84, cy + d); } } x.stroke(); } };
  const scriptT = cut(128, 1024, marks, '#c4a07c', '#2e2018'), glowT = WAKE ? cut(128, 1024, marks, '#000', '#fff') : null, VIOLET = new THREE.Color(.62, .3, 1);
  const stoneM = mat('rock', { ns: .5, color: 0xe6c6a2, rough: .85 }); stoneM.vertexColors = true; const stepM = mat('slab', { ns: .8, color: 0xd8b48e, rough: .9 }); stepM.vertexColors = true;
  const sandM = mat('plaster', { ns: .35, color: 0xffffff, rough: .95 }); sandM.vertexColors = true;
  const M = { sand: sandM, stone: stoneM, step: stepM, butte: mat('rock', { ns: 1.1, color: 0xb0603e, rough: .95 }),
    script: new THREE.MeshStandardMaterial({ map: scriptT, color: new THREE.Color(.62, .52, .44), roughness: .85, polygonOffset: true, polygonOffsetFactor: -2, side: THREE.DoubleSide, ...(glowT ? { emissive: VIOLET, emissiveMap: glowT, emissiveIntensity: 2.2 } : {}) }),
    seam: new THREE.MeshBasicMaterial({ color: VIOLET.clone().multiplyScalar(2.4) }), mark: new THREE.MeshStandardMaterial({ color: new THREE.Color(.5, .5, .52), roughness: .8 }) };
  let tris = 0, draws = 0;
  for (const [k, gs] of B) { const g = gs.length > 1 ? mergeGeometries(gs, false) : gs[0]; if (gs.length > 1) gs.forEach(x => x.dispose()); const mesh = new THREE.Mesh(g, M[k]); mesh.name = k; mesh.castShadow = !['sand', 'script', 'seam'].includes(k); mesh.receiveShadow = true; group.add(mesh); tris += (g.index ? g.index.count : g.attributes.position.count) / 3; draws++; }
  return { group, tris: Math.round(tris), draws, ground, R0, R1, CY, D, inner: NI, outer: NO, gone, slipped, thrown, hung, seats: seats.map(t => +(t / DEG).toFixed(1)), cleft: CLEFT, crater: CR, scar: SC, buttes, plinth, figure, wake: WAKE };
}

// The Hollow Below (Session 2401; OG-104's Mark panel, "a vast cavern of rings and a shaft of light with a viaduct"): the sheet paints a
// cavern under the fells with great rings in its far wall, a column of daylight falling through a hole in its roof and a viaduct across the
// dark. The panel's "unknown technology" is the generator's framing and is left out (canon §3.1: the Weavers left the gates and nothing else),
// so it is drawn as one gate's mouth whose hillside is a cavern: OG-037's rings out of a hillside (V1), cut into the back wall of a
// limestone hollow instead, each ring set deeper than the last, the slit door in the heart. A ruin as the others (#429 B): the script dead,
// every loose stone down. A metre a unit, y 0 the viaduct's deck and the court, +z toward the way in, the rings at -z.
//   - the cavern: 250 m across and 236 m long, its floor a lake 58 m under the deck (6 m deep) between two shelves of rock: the way in
//     (z > 78) and the back shelf under the rings (z < -38); its roof a vault 120 m over the deck, its back wall a cliff at z -72;
//   - the oculus: a hole 32 m across at the vault's crown, its shaft 60 m up to the fell along the light, so the noon sun falls through it
//     onto the court before the rings; icicles round its rim, the rock frosted near it;
//   - the rings: three, concentric on a centre 12 m over the court: 36 to 44 m (40 voussoirs), 25 to 33 m (30), 14 to 22 m (20), their
//     faces at z -72, -86 and -100, joined by dressed reveals and steps, the back plate at -114 with the slit door (4.4 by 15 m); the
//     script cut dead in a band on every stone's face. The outer ring has lost five stones from its upper left (25 to 70° left of the top)
//     and they lie broken on the shelf below; three of the middle ring's stones there have slipped;
//   - the court: 60 by 36 m of 4 m slabs before the rings, the ring sigil cut dead in its middle where the light lands; the floor into the
//     rings paved at the court's level, step by step;
//   - the viaduct: 116 m from the way in to the court, 7 m wide, five arches of 19.7 m on four piers standing 64 m from the lake's bed,
//     a parapet of blocks broken in three places;
//   - a 1.75 m post on the court in the light as the scale.
// -> { group, tris, draws, ground(x, z), CY, rings: [{ ri, ro, zf, n, gone, slipped }], lost: [{ x, z, low, top }], oculus { x, z, y, r },
//   sun (a unit vector toward the light), lands { x, z } (where the shaft's axis meets the court), court { x0, x1, z0, z1 }, viaduct { z0, z1,
//   spans, S, pier, w, gaps }, water, bed, roof, back, door { w, h, z }, figure }
export function hollowBelow(o = {}) {
  const key = o.key || 'ruins:hollow', r = stream(key), group = new THREE.Group(), DEG = Math.PI / 180;
  const WATER = -58, BED = -64, ZF = 78, ZB = -38, BACK = -72, CY = 12, ROOF = 120, AX = 125, AZ = 118, OC = 16;
  const SUN = new THREE.Vector3(.12, 1, .18).normalize(), COURT = { x0: -30, x1: 30, z0: -72, z1: -36 };
  const lands = { x: 0, z: -52 }, oc = { x: lands.x + SUN.x / SUN.y * ROOF, z: lands.z + SUN.z / SUN.y * ROOF, y: ROOF, r: OC };
  const B = new Map(), put = (k, g) => { const x = g.index ? g.toNonIndexed() : g; for (const a of Object.keys(x.attributes)) if (!['position', 'normal', 'uv', 'color'].includes(a)) x.deleteAttribute(a); x.computeVertexNormals(); if (!x.attributes.uv) worldUV(x, .2); (B.get(k) || B.set(k, []).get(k)).push(x); return x; };
  const bb = g => { g.computeBoundingBox(); return g.boundingBox; };
  // the floor: the two shelves at the deck's level, the lake's bed between, the shelves' edges falling as cliffs 8 m wide
  const inCourt = (x, z) => x > COURT.x0 - 1 && x < COURT.x1 + 1 && z > COURT.z0 - 1 && z < COURT.z1 + 1;
  const ground = (x, z) => { const ef = z - ZF + 5 * fbm(x / 30 + 3, 1.7, 3), eb = ZB - z + 5 * fbm(x / 30 - 5, 4.1, 3), s = Math.max(sstep(-8, 0, ef), sstep(-8, 0, eb));
    const top = inCourt(x, z) ? -.4 : -.4 + .5 * fbm(x / 9, z / 9, 3) - .25, bed = BED + 2 * fbm(x / 40, z / 40, 3); return bed + (top - bed) * s; };
  { const N = 120, g = new THREE.PlaneGeometry(300, 300, N, N); g.rotateX(-Math.PI / 2); g.translate(0, 0, -16); const P = g.attributes.position, col = [];
    for (let i = 0; i < P.count; i++) { const x = P.getX(i), z = P.getZ(i), y = ground(x, z); P.setY(i, y); const wet = 1 - sstep(WATER - 2, WATER + 6, y), cl = sstep(-3, -12, y) * (1 - wet), v = .5 + .5 * fbm(x / 14, z / 14 + y / 9, 3);
      col.push(...[.62, .62, .64].map((c, j) => (c * (.8 + .3 * v)) * (1 - .55 * wet) * (1 - .45 * cl) + [0, .02, .03][j] * wet)); }
    g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3)); worldUV(g, .12); B.set('floor', [g]); }
  { const g = new THREE.PlaneGeometry(2 * AX + 20, 2 * AZ + 20); g.rotateX(-Math.PI / 2); g.translate(0, WATER, 0); put('water', g); }
  // the vault: rings of the hollow from 75 m under the deck to the oculus, its centre drawn back toward the light's hole as it rises, the
  // rock pushed in and out by noise, the back wall cut flat at z -72; a hole left where the rings are cut into it
  const RINGS = [{ ri: 36, ro: 44, zf: BACK, n: 40 }, { ri: 25, ro: 33, zf: BACK - 14, n: 30 }, { ri: 14, ro: 22, zf: BACK - 28, n: 20 }], HOLE = 43, PLATE = BACK - 42;
  { const NR = 52, NC = 112, Y0 = -75, P = [], C = [];
    const q = t => t < .4 ? 1 : Math.cos((t - .4) / .6 * Math.PI / 2) ** .7, rad = (t, a) => { const k = q(t), n = .14 * k * (fbm(Math.cos(a) * 2.2 + 7, t * 6 + Math.sin(a) * 2.2, 4)), rx = OC + (AX - OC) * k, rz = OC + (AZ - OC) * k; return [rx * (1 + n), rz * (1 + n)]; };
    const pt = (i, j) => { const t = i / NR, a = j / NC * Math.PI * 2, [rx, rz] = rad(t, a), cx = oc.x * sstep(.25, 1, t), cz = oc.z * sstep(.25, 1, t); let x = cx + Math.sin(a) * rx, z = cz + Math.cos(a) * rz;
      const y = Y0 + t * (ROOF - Y0); if (z < BACK + 1.2 * fbm(x / 20, y / 20, 2)) z = BACK + 1.2 * fbm(x / 20, y / 20, 2); return [x, y, z]; };
    const G = []; for (let i = 0; i <= NR; i++) { const row = []; for (let j = 0; j <= NC; j++) row.push(pt(i, j % NC)); G.push(row); }
    const tint = (x, y, z) => { const fr = sstep(ROOF - 40, ROOF, y) * .6, wet = 1 - sstep(WATER, WATER + 14, y), v = .5 + .5 * fbm(x / 11 + y / 17, z / 11, 3), b = .55 + .35 * v; return [b * (1 - .6 * wet) + .35 * fr, b * (1 - .55 * wet) + .38 * fr, b * (1 - .5 * wet) + .45 * fr]; };
    for (let i = 0; i < NR; i++) for (let j = 0; j < NC; j++) { const a = G[i][j], b = G[i][j + 1], c = G[i + 1][j], d = G[i + 1][j + 1];
      for (const T of [[a, c, b], [b, c, d]]) { const m = [0, 1, 2].map(k => (T[0][k] + T[1][k] + T[2][k]) / 3); if (m[2] < BACK + 6 && Math.hypot(m[0], m[1] - CY) < HOLE) continue; for (const p of T) { P.push(...p); C.push(...tint(...p)); } } }
    // the shaft: from the oculus up along the light 60 m to the fell, widening, its rock ragged
    const NS = 6, top = G[NR]; for (let i = 0; i < NS; i++) for (let j = 0; j < NC; j++) { const lift = s => { const L = 60 * s / NS, w = 1 + .5 * (s / NS) ** 2; return k => { const p = top[k % NC]; const dx = (p[0] - oc.x) * w, dz = (p[2] - oc.z) * w, n = 1 + .1 * fbm(k / 9, s * .7 + 3, 2); return [oc.x + dx * n + SUN.x / SUN.y * L, ROOF + L, oc.z + dz * n + SUN.z / SUN.y * L]; }; };
      const A = lift(i), Bv = lift(i + 1), a = A(j), b = A(j + 1), c = Bv(j), d = Bv(j + 1); for (const T of [[a, c, b], [b, c, d]]) for (const p of T) { P.push(...p); C.push(...tint(...p)); } }
    // the rock over the funnel behind the back wall, so no daylight reaches the rings but through the oculus (never seen from inside)
    { const lid = [[-70, CY + HOLE + 4, BACK - 70], [70, CY + HOLE + 4, BACK - 70], [70, CY + HOLE + 4, BACK + 2], [-70, CY + HOLE + 4, BACK + 2]], t = (a, b, c) => { for (const p of [a, b, c]) { P.push(...p); C.push(.3, .3, .3); } };
      t(lid[0], lid[2], lid[1]); t(lid[0], lid[3], lid[2]); for (const s of [-1, 1]) { const x = s * 70, y0 = -40, y1 = CY + HOLE + 4; t([x, y0, BACK - 70], [x, y1, BACK - 70], [x, y1, BACK + 2]); t([x, y0, BACK - 70], [x, y1, BACK + 2], [x, y0, BACK + 2]); }
      t([-70, -40, BACK - 70], [70, -40, BACK - 70], [70, CY + HOLE + 4, BACK - 70]); t([-70, -40, BACK - 70], [70, CY + HOLE + 4, BACK - 70], [-70, CY + HOLE + 4, BACK - 70]); }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(C, 3)); g.computeVertexNormals(); worldUV(g, .06); B.set('cave', [g]);
    // icicles round the oculus' rim, hanging into the light
    const ri = stream(key + ':ice'); for (let k = 0; k < 36; k++) { const p = top[Math.floor(k / 36 * NC)], L = 1.5 + ri() * 5, w = .25 + ri() * .35, c = new THREE.ConeGeometry(w, L, 5); c.rotateX(Math.PI); c.translate(p[0] + (oc.x - p[0]) * .02, p[1] - L / 2 - .2, p[2] + (oc.z - p[2]) * .02); put('ice', c); } }
  // the rings: voussoirs on the ring's centre (0, CY), from the top clockwise seen from the court; faces z zf + 2.5 to zf - 2 (the back in the wall)
  const at = (t, rr) => [rr * Math.sin(t), CY + rr * Math.cos(t)];
  const wedge = (ta, tb, ra, rb, z1, z0, gap = .08) => { const out = [], qd = [at(ta, ra), at(tb, ra), at(tb, rb), at(ta, rb)], c = qd.reduce((s, p) => [s[0] + p[0] / 4, s[1] + p[1] / 4], [0, 0]);
    const k = 1 - gap / Math.max(...qd.map(p => Math.hypot(p[0] - c[0], p[1] - c[1]))); let p = qd.map(v => [c[0] + (v[0] - c[0]) * k, c[1] + (v[1] - c[1]) * k]); let ar = 0; for (let i = 0; i < 4; i++) { const j = (i + 1) % 4; ar += p[i][0] * p[j][1] - p[j][0] * p[i][1]; } if (ar < 0) p = p.reverse();
    const F = p.map(v => [v[0], v[1], z1]), Bk = p.map(v => [v[0], v[1], z0]), tri = (a, b, d) => out.push(...a, ...b, ...d);
    tri(F[0], F[1], F[2]); tri(F[0], F[2], F[3]); tri(Bk[0], Bk[2], Bk[1]); tri(Bk[0], Bk[3], Bk[2]); for (let i = 0; i < 4; i++) { const j = (i + 1) % 4; tri(F[i], Bk[i], Bk[j]); tri(F[i], Bk[j], F[j]); }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(out, 3)); return { g, c }; };
  const band = (ta, tb, rm, z, v0) => { const n = 3, pos = [], uv = [], L = rm * (tb - ta); for (let i = 0; i <= n; i++) { const t = ta + (tb - ta) * i / n, [x0, y0] = at(t, rm - 1.2), [x1, y1] = at(t, rm + 1.2); pos.push(x0, y0, z, x1, y1, z); uv.push(0, (v0 + L * i / n) / 14.4, 1, (v0 + L * i / n) / 14.4); }
    const idx = []; for (let i = 0; i < n; i++) { const a = i * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); } const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx); return g.toNonIndexed(); };
  const lostAt = t => t > -70 * DEG && t < -25 * DEG, lost = [], rl = stream(key + ':lost');
  RINGS.forEach((R, ki) => { R.gone = 0; R.slipped = 0; let v = 0;
    for (let i = 0; i < R.n; i++) { const ta = (i / R.n + (ki % 2) * .5 / R.n) * Math.PI * 2 - Math.PI, tb = ta + Math.PI * 2 / R.n, tm = (ta + tb) / 2, zf = R.zf + 2.5 + (r() - .5) * .3;
      if (CY + R.ri * Math.cos(tm) + 1 < -1.5) continue; /* wholly under the court's paving */
      const { g, c } = wedge(ta, tb, R.ri, R.ro, zf, R.zf - 2), s = band(ta, tb, (R.ri + R.ro) / 2, zf + .03, v); v += (R.ri + R.ro) / 2 * (tb - ta);
      if (ki === 0 && lostAt(tm)) { /* fallen: down the face onto the shelf below its seat, turned, bedded an eighth of its least depth in the rubble */
        R.gone++; g.translate(-c[0], -c[1], -(zf + R.zf - 2) / 2); g.applyMatrix4(new THREE.Matrix4().makeRotationFromEuler(new THREE.Euler(rl() * Math.PI * 2, rl() * Math.PI * 2, rl() * Math.PI * 2)));
        const x = c[0] * (.85 + rl() * .2) + (rl() - .5) * 6, z = BACK + 7 + rl() * 20, b0 = bb(g), dz = Math.min(b0.max.x - b0.min.x, b0.max.y - b0.min.y, b0.max.z - b0.min.z);
        const yc = Math.min(...[[0, 0], [2, 2], [-2, 2], [2, -2], [-2, -2]].map(([u, w]) => ground(x + u, z + w))); g.translate(x, yc - b0.min.y - dz / 8, z); put('stone', g);
        const P = g.attributes.position; let low = Infinity, top = -Infinity; for (let k = 0; k < P.count; k++) { const d = P.getY(k) - ground(P.getX(k), P.getZ(k)); low = Math.min(low, d); top = Math.max(top, d); }
        lost.push({ t: +(tm / DEG).toFixed(1), x: +x.toFixed(1), z: +z.toFixed(1), low: +low.toFixed(2), top: +top.toFixed(2) }); continue; }
      let M = null; if (ki === 1 && tm > -75 * DEG && tm < -20 * DEG && R.slipped < 3) { const out = .3 + r() * .5; M = new THREE.Matrix4().makeTranslation(c[0] + Math.sin(tm) * out, c[1] + Math.cos(tm) * out - .2, (r() - .5) * .6)
        .multiply(new THREE.Matrix4().makeRotationFromEuler(new THREE.Euler((r() - .5) * 2 * DEG, (r() - .5) * 2 * DEG, (r() - .5) * 4 * DEG))).multiply(new THREE.Matrix4().makeTranslation(-c[0], -c[1], 0)); R.slipped++; }
      put('stone', M ? g.applyMatrix4(M) : g); put('script', M ? s.applyMatrix4(M) : s); } });
  // the dressed stone between the rings: the steps and reveals of the funnel (a lathe about the rings' axis) and the back plate; each reveal
  // 0.3 m behind its ring's soffit, so the two never share a surface
  { const rv = k => RINGS[k].ri + .3, pr = [[HOLE + 2, BACK], [rv(0), BACK], [rv(0), RINGS[1].zf], [rv(1), RINGS[1].zf], [rv(1), RINGS[2].zf], [rv(2), RINGS[2].zf], [rv(2), PLATE], [.01, PLATE]].map(([a, b]) => new THREE.Vector2(a, b));
    const g = new THREE.LatheGeometry(pr, 72); g.rotateX(Math.PI / 2); g.translate(0, CY, 0); put('dressed', g); }
  // the floor into the rings at the court's level, step by step; the slit door in the back plate, framed
  { const half = rr => Math.sqrt(rr * rr - CY * CY); for (const [z1, z0, rr] of [[BACK, RINGS[1].zf, RINGS[0].ri], [RINGS[1].zf, RINGS[2].zf, RINGS[1].ri], [RINGS[2].zf, PLATE, RINGS[2].ri]]) { const w = 2 * half(rr) + .2, g = new THREE.BoxGeometry(w, 1, z1 - z0); g.translate(0, -.5, (z0 + z1) / 2); put('dressed', g); } }
  const door = { w: 4.4, h: 15, z: PLATE }; { const g = new THREE.PlaneGeometry(door.w, door.h); g.translate(0, door.h / 2, PLATE + .05); put('door', g);
    for (const s of [-1, 1]) { const j = new THREE.BoxGeometry(1.2, door.h + 1.2, 1); j.translate(s * (door.w / 2 + .6), (door.h + 1.2) / 2, PLATE + .5); put('stone', j); } const l = new THREE.BoxGeometry(door.w + 2.4, 1.2, 1); l.translate(0, door.h + .6, PLATE + .5); put('stone', l); }
  // the court: 4 m slabs, a few cracked and sunk; the ring sigil cut dead in its middle, where the light lands
  { const rc = stream(key + ':court'); for (let x = COURT.x0 + 2; x < COURT.x1; x += 4) for (let z = COURT.z0 + 2; z < COURT.z1; z += 4) { const g = new THREE.BoxGeometry(3.94, .5, 3.94), sink = rc() < .08 ? .08 + rc() * .15 : 0;
      g.translate(x, -.25 - sink, z); put('dressed', g); }
    const s = new THREE.PlaneGeometry(14, 14); s.rotateX(-Math.PI / 2); s.translate(lands.x, .012, lands.z); put('sigil', s); }
  // the viaduct: one wall of five arches (an extruded shape), its deck of slabs, the parapet in blocks broken in three places
  const VZ0 = ZB, VZ1 = ZF + 2, SP = 5, PIER = 4.4, VW = 7, S = (VZ1 - VZ0 - (SP - 1) * PIER) / SP, gaps = [];
  { const sh = new THREE.Shape(); sh.moveTo(VZ0 - 4, BED - 2); sh.lineTo(VZ1 + 4, BED - 2); sh.lineTo(VZ1 + 4, -.35); sh.lineTo(VZ0 - 4, -.35); sh.closePath();
    for (let i = 0; i < SP; i++) { const a = VZ0 + i * (S + PIER), b = a + S, rr = S / 2, spring = -2.4 - rr, h = new THREE.Path(); h.moveTo(a, BED - 1); h.lineTo(b, BED - 1); h.lineTo(b, spring); h.absarc(a + rr, spring, rr, 0, Math.PI, false); h.lineTo(a, BED - 1); sh.holes.push(h); }
    const g = new THREE.ExtrudeGeometry(sh, { depth: VW, bevelEnabled: false, curveSegments: 14 }); g.rotateY(-Math.PI / 2); g.translate(VW / 2, 0, 0); put('stone', g);
    const d = new THREE.BoxGeometry(VW + .6, .35, VZ1 - VZ0 + 6); d.translate(0, -.175, (VZ0 + VZ1) / 2); put('dressed', d);
    const rp = stream(key + ':parapet'), broken = [[-1, VZ0 + 30 + rp() * 10], [1, VZ0 + 62 + rp() * 10], [-1, VZ0 + 92 + rp() * 8]].map(([s, z]) => ({ s, z0: +z.toFixed(1), z1: +(z + 3 + rp() * 4).toFixed(1) }));
    gaps.push(...broken); for (const s of [-1, 1]) for (let z = VZ0 + .6; z < VZ1 - .6; z += 1.2) { if (broken.some(q => q.s === s && z > q.z0 && z < q.z1)) continue; const hh = 1.1 - (broken.some(q => q.s === s && (Math.abs(z - q.z0) < 1.3 || Math.abs(z - q.z1) < 1.3)) ? .4 : 0), g2 = new THREE.BoxGeometry(.5, hh, 1.16);
      g2.translate(s * (VW / 2 - .25), hh / 2, z); put('stone', g2); } }
  const figure = (() => { const x = lands.x + 3, z = lands.z + 4, h = 1.75, g = new THREE.CylinderGeometry(.2, .24, h, 10); g.translate(x, h / 2, z); put('mark', g); return { x, y: 0, z, h }; })();
  // the light's column: an open cylinder along the light from the court to the fell, drawn added, brighter at its top
  { const L = (ROOF + 60) / SUN.y, g = new THREE.CylinderGeometry(OC * .82, OC * .78, L, 32, 6, true), P = g.attributes.position, col = [];
    for (let i = 0; i < P.count; i++) { const t = P.getY(i) / L + .5, b = .25 + .75 * t; col.push(b, b * .98, b * .92); } g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
    g.translate(0, L / 2, 0); g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), SUN)); g.translate(lands.x, 0, lands.z); put('beam', g); }
  // the script (cut dead) and the ring sigil
  const cut = (w, h, draw, bg, fg) => { const c = document.createElement('canvas'); c.width = w; c.height = h; const x = c.getContext('2d'); x.fillStyle = bg; x.fillRect(0, 0, w, h); x.strokeStyle = fg; x.lineCap = 'round'; draw(x); const t = new THREE.CanvasTexture(c); t.anisotropy = 8; t.wrapT = THREE.RepeatWrapping; return t; };
  const marks = x => { const rs = stream(key + ':script'); for (let k = 0; k < 12; k++) { const cy = 44 + k * 84, kind = Math.floor(rs() * 4); x.lineWidth = 7; x.beginPath();
    if (kind === 0) x.arc(64, cy, 30, 0, 7); else if (kind === 1) { x.arc(64, cy, 30, 0, 7); x.moveTo(64, cy - 38); x.lineTo(64, cy + 38); } else if (kind === 2) { x.arc(64, cy, 30, Math.PI * .1, Math.PI * .9); x.moveTo(94, cy - 6); x.arc(64, cy - 6, 30, 0, -Math.PI, true); }
    else { x.moveTo(64, cy - 36); x.lineTo(64, cy + 36); for (const d of [-20, 0, 20]) { x.moveTo(44, cy + d); x.lineTo(84, cy + d); } } x.stroke(); } };
  const sigilT = cut(512, 512, x => { x.lineWidth = 16; x.beginPath(); x.arc(256, 256, 170, 0, 7); x.stroke(); x.lineWidth = 9; x.beginPath(); x.arc(256, 256, 96, 0, 7); x.stroke(); x.lineWidth = 10; x.beginPath(); x.moveTo(256, 30); x.lineTo(256, 482); x.moveTo(30, 256); x.lineTo(482, 256); x.stroke(); }, '#8a8680', '#3a3734');
  const rockM = mat('rock', { ns: .9, color: 0xffffff, rough: .9 }); rockM.vertexColors = true; rockM.side = THREE.DoubleSide; rockM.shadowSide = THREE.DoubleSide;
  const floorM = mat('rock', { ns: .8, color: 0xffffff, rough: .92 }); floorM.vertexColors = true;
  const M = { cave: rockM, floor: floorM, water: new THREE.MeshStandardMaterial({ color: new THREE.Color(.03, .06, .07), roughness: .06, metalness: .2 }),
    stone: mat('rock', { ns: .5, color: 0xb9b6ae, rough: .8 }), dressed: mat('slab', { ns: .7, color: 0xa8a49c, rough: .85 }),
    script: new THREE.MeshStandardMaterial({ map: cut(128, 1024, marks, '#9c988f', '#34312c'), roughness: .85, polygonOffset: true, polygonOffsetFactor: -2, side: THREE.DoubleSide }),
    sigil: new THREE.MeshStandardMaterial({ map: sigilT, roughness: .7, polygonOffset: true, polygonOffsetFactor: -2 }), ice: new THREE.MeshStandardMaterial({ color: new THREE.Color(.78, .88, .95), roughness: .15, metalness: .05 }),
    door: new THREE.MeshBasicMaterial({ color: 0x030304 }), beam: new THREE.MeshBasicMaterial({ vertexColors: true, color: new THREE.Color(.16, .15, .13), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, fog: false }),
    mark: new THREE.MeshStandardMaterial({ color: new THREE.Color(.5, .5, .52), roughness: .8 }) };
  M.stone.side = THREE.DoubleSide; M.dressed.side = THREE.DoubleSide;
  let tris = 0, draws = 0;
  for (const [k, gs] of B) { const g = gs.length > 1 ? mergeGeometries(gs, false) : gs[0]; if (gs.length > 1) gs.forEach(x => x.dispose()); const mesh = new THREE.Mesh(g, M[k]); mesh.name = k; mesh.castShadow = !['floor', 'water', 'script', 'sigil', 'beam', 'door'].includes(k); mesh.receiveShadow = k !== 'beam'; group.add(mesh); tris += (g.index ? g.index.count : g.attributes.position.count) / 3; draws++; }
  return { group, tris: Math.round(tris), draws, ground, CY, rings: RINGS.map(q => ({ ...q })), lost, oculus: { ...oc, x: +oc.x.toFixed(2), z: +oc.z.toFixed(2) }, sun: SUN.toArray().map(v => +v.toFixed(4)), lands, court: COURT,
    viaduct: { z0: VZ0, z1: VZ1, spans: SP, S: +S.toFixed(2), pier: PIER, w: VW, gaps }, water: WATER, bed: BED, roof: ROOF, back: BACK, hole: HOLE, door, figure };
}

// The Gate Isles (Session 2430; OG-104's panel for all the islands, "isle shrines aligned across the islands"): a line of five small rings
// of the Weavers', each stood on its edge on the level crown of a rock isle in open sea, the isles strung 1.3 km along one bearing so that
// the five rings' hearts lie on one level line and from the first you look through every ring to the far coast at the line's end. The
// panel's "shrines" are drawn as the one thing the Weavers left (canon §3.1: the gates and nothing else): a ring of their stone, its door
// never cut; what the line is sighted on is the canon's and the quest writer's. A ruin as the others (#429 B): the script cut dead (S2425's
// cut), no stone lifted, every loose stone down. A metre a unit, the mean sea at y 0, the line along -z from the first isle at the origin.
//   - the isles: five skerries of dark rock 36 to 52 m in radius, their crowns all levelled at 14 m over the mean sea (a terrace 24 m
//     across, a thin turf on it), their cliffs ledged and falling to the water, a band of wrack between the tides (the range 4 m, the
//     Gatelands' spring tide), the bed 14 m down between them; at z 0, -270, -580, -930 and -1330, each gap 40 m longer than the last;
//   - the rings: each 28 m across its outer face and 18 m across its opening, 3 m deep: two courses of voussoirs (20 inner, 2.5 m; 24
//     outer, 2.5 m, broken joint), the script cut dead in a band round the soffit; it stands on a plinth of two steps of 0.6 m, its foot
//     sunk in the plinth and its sill 0.6 m over the upper step, so its heart stands 24.8 m over the mean sea on every isle;
//   - their condition, from a stream keyed by the line: four stand (a stone in eight slipped a hand's breadth); the third isle's ring is
//     broken, its outer course gone from 60° left of the top to 40° right and three inner stones from over the crown, the lost stones
//     lying on the crown and its plinth, sunk a third of their depth; nothing is lit and nothing floats;
//   - a landing at each isle on its east face (+x): a flight of steps cut in the rock from 3 m under the mean sea up to the crown, 4 m wide
//     (the boat's way up, the DECISION's A);
//   - the far coast: a ridge of another island 2.1 km out on the line, its shoulder 90 to 140 m high;
//   - a 1.75 m post on the first isle's plinth by the ring's foot as the scale.
// -> { group, tris, draws, ground(x, z), S (the crowns' height), P (the plinths' top), CY (the hearts' height), R0, RM, R1, D, isles: [{ i, z, R,
//   cond, gone, slipped, lost: [{ x, z, low, top }], stacks: [{ x, z, r, h, slope }], stair { x0, x1, y0, y1, w, n } }], coast { z }, figure }
export function gateIsles(o = {}) {
  const key = o.key || 'ruins:isles', r = stream(key), S = 14, P = S + 1.2, R0 = 9, RM = 11.5, R1 = 14, D = 3, CY = P + .6 + R0, DEG = Math.PI / 180, CR = 24, BED = -14, COAST = -2100, group = new THREE.Group();
  const ZS = [0, -270, -580, -930, -1330], RS = [40, 48, 36, 52, 44], SW = 2, SX0 = CR - 1;
  const B = new Map(), put = (k, g) => { const x = g.index ? g.toNonIndexed() : g; for (const a of Object.keys(x.attributes)) if (!['position', 'normal', 'uv', 'color'].includes(a)) x.deleteAttribute(a); if (k === 'turf') { const m = mergeVertices(x, 1e-3); m.computeVertexNormals(); const f = m.toNonIndexed(); (B.get(k) || B.set(k, []).get(k)).push(f); return f; } /* Session 2440: the turf smooth, not faceted */
    if (k !== 'script' && !x.userData.uvSet) { if (x.attributes.uv) x.deleteAttribute('uv'); x.computeVertexNormals(); worldUV(x, k === 'rock' || k === 'stair' ? .0625 : .25); } else x.computeVertexNormals(); (B.get(k) || B.set(k, []).get(k)).push(x); return x; };
  const bb = g => { g.computeBoundingBox(); return g.boundingBox; };
  // an isle's rock: its outline wavers with the bearing; level crown, then the cliff in ledges to the water, then a skirt of tumbled rock to the bed
  const rim = (i, t) => RS[i] * (1 + .32 * (fbm(Math.cos(t) * 1.6 + i * 7.1, Math.sin(t) * 1.6 + i * 3.3, 3) - .5));
  const stairY = (i, x) => { const L = rim(i, 0) + 6 - SX0; return S - (S + 3) * Math.min(1, Math.max(0, (x - SX0) / L)); };
  const isleH = (i, x, z) => { const dx = x, dz = z - ZS[i], d = Math.hypot(dx, dz), t = Math.atan2(dz, dx), Rr = rim(i, t);
    if (d < CR) return S - .3 + .25 * fbm(x / 7, z / 7, 2);
    // Session 2431: the crown's lip falls 1.8 m to the cliff's head 6 m short of the rim, the cliff drops near sheer over 8 m in strata to
    // the wrack, and the skirt of tumbled rock runs on down to the bed (it was a dome: the crown rolled down to the sea over the whole radius)
    let y; const c0 = Rr - 6, c1 = Rr + 2;
    if (d < c0) y = S - .3 - 1.8 * ((d - CR) / (c0 - CR)) ** 1.5 + .5 * (fbm(x / 8, z / 8, 2) - .5) * (d - CR) / (c0 - CR);
    else if (d < c1) { const s1 = (d - c0) / (c1 - c0), st = Math.floor(s1 * 5 + fbm(t * 4 + i * 3, 1.7, 2) * 1.2) / 5; y = S - 2.1 - (S - 1.6) * (sstep(0, 1, s1) * .55 + st * .45) + .9 * (fbm(t * 9 + i, s1 * 3, 2) - .5); }
    else y = -.1 - (d - c1) * 1.4 + 1.5 * (fbm(x / 6, z / 6, 2) - .5);
    if (dx > SX0 - 1 && Math.abs(dz) < SW + 1.2) y = Math.min(y, stairY(i, dx) - .05 - Math.max(0, Math.abs(dz) - SW) * 3);
    return Math.max(BED, Math.min(S - .05, y)); };
  const ground = (x, z) => { let y = BED; for (let i = 0; i < ZS.length; i++) if (Math.abs(z - ZS[i]) < 130 && Math.abs(x) < 130) y = Math.max(y, isleH(i, x, z)); return y; };
  // the isles' rock, each a polar grid (96 bearings by 40 rings out to its rim and 30 m beyond), coloured by height: turf on the crown, lichened rock, the wrack between the tides
  const rockCol = (y, d, x = 0, z = 0) => { const w = sstep(-2.6, -1.6, y) * (1 - sstep(2, 2.6, y)), l = sstep(2.2, 2.8, y) * (1 - sstep(4.5, 6.5, y)), turf = d < CR - .5 ? 1 : 0, c = [.36, .35, .33], tv = turf ? .82 + .3 * fbm(x / 5, z / 5, 3) : 1; return [0, 1, 2].map(j => turf ? [.33, .38, .2][j] * tv * (j === 0 ? 1 + .25 * (fbm(x / 11 + 4, z / 11, 2) - .5) : 1) : (c[j] * (1 - l) + [.52, .5, .38][j] * l) * (1 - w) + [.13, .12, .06][j] * w); }; /* the wrack between the tides, a band of pale lichen over it (Session 2431) */
  const STK = [];
  for (let i = 0; i < ZS.length; i++) { const NA = 96, NR = 34, pos = [], col = [], tpos = [], tcol = [], ctr = [];
    // the rings by the rim on each bearing (Session 2431): 6 over the crown, 6 to the cliff's head, 14 down its face, 8 over the skirt
    const pt = (a, k) => { const t = a * 2 * Math.PI / NA, Rr = rim(i, t), d = k <= 6 ? CR * k / 6 : k <= 12 ? CR + (Rr - 6 - CR) * (k - 6) / 6 : k <= 26 ? Rr - 6 + 8 * (k - 12) / 14 : Rr + 2 + 26 * ((k - 26) / 8) ** 1.3, x = Math.cos(t) * d, z = ZS[i] + Math.sin(t) * d, y = isleH(i, x, z); return [x, y, z, d]; };
    for (let a = 0; a < NA; a++) for (let k = 0; k < NR; k++) { const p = pt(a, k), q = pt(a + 1, k), s = pt(a + 1, k + 1), u = pt(a, k + 1);
      if (k >= 6) ctr.push(0, ZS[i], RS[i], 0, ZS[i], RS[i]); for (const v of k === 0 ? [p, s, u] : [p, s, u, p, q, s]) { const P0 = k < 6 ? tpos : pos, C0 = k < 6 ? tcol : col; P0.push(v[0], v[1], v[2]); C0.push(...rockCol(v[1], v[3], v[0], v[2])); } } /* Session 2440: the crown's turf its own draw, unmapped */
    // two or three stacks off the cliff (Session 2431), away from the landing and 24 m clear of the line, standing from the bed to 10 to 24 m: rock in strata.
    // Session 2435: worn by the sea, not cut: each is notched round the tide's band (a third narrower at the mean sea, a lip overhanging it at 4 m) and its
    // top broken off on a slant falling toward one side, ragged along the break, so none reads as a pillar sawn level
    const stacks = (STK[i] = []); { const rs = stream(`${key}:stacks:${i}`), n = 2 + (rs() < .5 ? 1 : 0); for (let k = 0, tries = 0; k < n && tries < 40; tries++) { const t = rs() * Math.PI * 2;
        if (Math.cos(t) > .8) continue; const d = rim(i, t) + 9 + rs() * 12, sx = Math.cos(t) * d, sz = ZS[i] + Math.sin(t) * d, h = 10 + rs() * 14, rr = 4 + rs() * 4; if (Math.abs(sx) < 24) continue;
        if (stacks.some(q => Math.hypot(q.x - sx, q.z - sz) < (q.r + rr) * 1.25 + 3)) continue; /* Session 2435: apart, each its own column (two had grown into one) */
        const phi = rs() * Math.PI * 2, slope = .35 + rs() * .4, rt = rr * .8, HS = 18, wear = wy => 1 - .32 * Math.exp(-(((wy - .4) / 1.7) ** 2)) + .08 * Math.exp(-(((wy - 4) / 1.5) ** 2));
        const cutY = an => h - slope * rt * (1 + Math.cos(an - phi)) - 1.1 * fbm(an * 2.3 + k * 3 + i, 4.1, 2);
        const c = new THREE.CylinderGeometry(rr * .75, rr * 1.25, h - BED, 12, HS); c.translate(0, (h + BED) / 2, 0); const Q = c.attributes.position;
        for (let v = 0; v < Q.count; v++) { const px = Q.getX(v), py = Q.getY(v), pz = Q.getZ(v), rad = Math.hypot(px, pz); if (rad < .01) { Q.setX(v, sx); Q.setZ(v, sz); if (py > h - .1) Q.setY(v, h - slope * rt - .5); continue; }
          const an = Math.atan2(pz, px), f = (1 + .3 * (fbm(an * 1.3 + k * 5 + i, py / 5, 2) - .5) - .12 * (Math.floor((py - BED) / 2.6) % 2)) * wear(py); Q.setX(v, px * f + sx); Q.setZ(v, pz * f + sz); Q.setY(v, Math.min(py, cutY(an))); }
        stacks.push({ x: +sx.toFixed(2), z: +sz.toFixed(2), r: +rr.toFixed(2), h: +h.toFixed(2), slope: +slope.toFixed(2) });
        const gs = c.toNonIndexed(), P2 = gs.attributes.position, cc = []; for (let v = 0; v < P2.count; v++) cc.push(...rockCol(P2.getY(v), 999)); gs.setAttribute('color', new THREE.Float32BufferAttribute(cc, 3)); gs.deleteAttribute('uv'); gs.deleteAttribute('normal');
        pos.push(...P2.array); col.push(...cc); for (let v = 0; v < P2.count; v += 3) ctr.push(sx, sz, rr); k++; } }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
    // Session 2441: the rock's faces laid round the isle (and each stack round its own axis), u the arc at its rim and v the height, so the beds run
    // on unbroken from facet to facet; worldUV's choice of axis per face stepped them at every edge where two facets turned to different axes.
    // Faces that look up (over 0.75 of their normal) keep the plan view
    g.computeVertexNormals(); { const N = g.attributes.normal, uv = new Float32Array(pos.length / 3 * 2), s = .0625;
      for (let f = 0; f < pos.length / 9; f++) { const cx = ctr[f * 3], cz = ctr[f * 3 + 1], Rr = ctr[f * 3 + 2]; let a0 = null;
        for (let j = 0; j < 3; j++) { const v = f * 3 + j, x = pos[v * 3], y = pos[v * 3 + 1], z = pos[v * 3 + 2];
          if (N.getY(f * 3) > .75) { uv[v * 2] = x * s; uv[v * 2 + 1] = z * s; continue; }
          let a = Math.atan2(z - cz, x - cx); if (a0 === null) a0 = a; else a += Math.round((a0 - a) / (2 * Math.PI)) * 2 * Math.PI; uv[v * 2] = a * Rr * s; uv[v * 2 + 1] = y * s; } }
      g.setAttribute('uv', new THREE.BufferAttribute(uv, 2)); g.userData.uvSet = true; }
    put('rock', g);
    const tg = new THREE.BufferGeometry(); tg.setAttribute('position', new THREE.Float32BufferAttribute(tpos, 3)); tg.setAttribute('color', new THREE.Float32BufferAttribute(tcol, 3)); put('turf', tg); }
  // the sea, and the far coast on the line: a ridge 3 km long, its shoulder 90 to 140 m, falling to the water before the line
  { const g = new THREE.PlaneGeometry(9000, 9000); g.rotateX(-Math.PI / 2); g.translate(0, 0, -1500); B.set('sea', [g]); }
  { const NX = 120, NZ = 16, pos = []; const pt = (i, j) => { const x = -1500 + 3000 * i / NX, z = COAST - 400 * j / NZ, sh = 90 + 50 * fbm(x / 400, 3.3, 3); const y = -8 + (sh + 8) * sstep(0, .8, j / NZ) + 22 * (fbm(x / 70, z / 70, 3) - .5) * (j / NZ); return [x, y, z]; };
    for (let i = 0; i < NX; i++) for (let j = 0; j < NZ; j++) { const a = pt(i, j), b = pt(i + 1, j), c = pt(i + 1, j + 1), d = pt(i, j + 1); pos.push(...a, ...b, ...c, ...a, ...c, ...d); }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); put('coast', g); }
  // a voussoir between bearings ta and tb (from the top, clockwise seen from +z), radii ra to rb, its faces at z +zf and -zb about the ring's plane
  const at = (t, rr) => [rr * Math.sin(t), CY + rr * Math.cos(t)];
  const wedge = (ta, tb, ra, rb, zf, zb, gap = .06) => { const out = [], q = [at(ta, ra), at(tb, ra), at(tb, rb), at(ta, rb)], c = q.reduce((s, p) => [s[0] + p[0] / 4, s[1] + p[1] / 4], [0, 0]);
    const k = 1 - gap / Math.max(...q.map(p => Math.hypot(p[0] - c[0], p[1] - c[1]))); let p = q.map(v => [c[0] + (v[0] - c[0]) * k, c[1] + (v[1] - c[1]) * k]); let ar = 0; for (let i = 0; i < 4; i++) { const j = (i + 1) % 4; ar += p[i][0] * p[j][1] - p[j][0] * p[i][1]; } if (ar < 0) p = p.reverse();
    const F = p.map(v => [v[0], v[1], zf]), Bk = p.map(v => [v[0], v[1], -zb]), tri = (a, b, d) => out.push(...a, ...b, ...d);
    tri(F[0], F[1], F[2]); tri(F[0], F[2], F[3]); tri(Bk[0], Bk[2], Bk[1]); tri(Bk[0], Bk[3], Bk[2]); for (let i = 0; i < 4; i++) { const j = (i + 1) % 4; tri(F[i], Bk[i], Bk[j]); tri(F[i], Bk[j], F[j]); }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(out, 3)); return { g, c, low: Math.min(...q.map(v => v[1])), top: Math.max(...q.map(v => v[1])) }; };
  // the soffit's band of script on an inner stone, 2.2 m wide, v down the arc in 14.4 m repeats
  let arcV = 0; const band = (ta, tb) => { const n = 2, pos = [], uv = [], L = R0 * (tb - ta); for (let i = 0; i <= n; i++) { const t = ta + (tb - ta) * i / n, [x, y] = at(t, R0 - .03); pos.push(x, y, 1.1, x, y, -1.1); uv.push(0, (arcV + L * i / n) / 14.4, 1, (arcV + L * i / n) / 14.4); }
    arcV += L; const idx = []; for (let i = 0; i < n; i++) { const a = i * 2; idx.push(a, a + 2, a + 1, a + 1, a + 2, a + 3); } const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx); return g.toNonIndexed(); };
  const NI = 20, NO = 24, BROKEN = o.broken ?? 2, isles = [];
  for (let i = 0; i < ZS.length; i++) { const zc = ZS[i], ri = stream(`${key}:${i}`), cond = i === BROKEN ? 'broken' : 'stand', lostPos = [], lost = []; let gone = 0, slipped = 0;
    const T = new THREE.Matrix4().makeTranslation(0, 0, zc);
    const goneO = t => cond === 'broken' && t > -60 * DEG && t < 40 * DEG, goneI = t => cond === 'broken' && t > -20 * DEG && t < 30 * DEG;
    // a lost stone: laid on the crown either side of the plinth or on the plinth's lower step, turned, sunk a third of its least depth
    const lay = (g, c) => { g.translate(-c[0], -c[1], 0); g.applyMatrix4(new THREE.Matrix4().makeRotationFromEuler(new THREE.Euler(ri() * Math.PI * 2, ri() * Math.PI * 2, ri() * Math.PI * 2)));
      let x, z, tries = 0; do { const side = ri() < .5 ? -1 : 1, a = (ri() - .5) * 1.6; x = side * (5 + ri() * 15) * Math.cos(a) + (ri() - .5) * 4; z = (ri() < .5 ? -1 : 1) * (7.5 + ri() * 10); } while ((Math.hypot(x, z) > CR - 3 || lostPos.some(p => Math.hypot(p[0] - x, p[1] - z) < 4.2)) && ++tries < 60);
      lostPos.push([x, z]); const b0 = bb(g), dz = Math.min(b0.max.x - b0.min.x, b0.max.y - b0.min.y, b0.max.z - b0.min.z), y0 = S - .3; g.translate(x, y0 - b0.min.y - dz / 3, z + zc);
      const b1 = bb(g); lost.push({ x: +x.toFixed(2), z: +(z + zc).toFixed(2), low: +(b1.min.y - y0).toFixed(2), top: +(b1.max.y - y0).toFixed(2) }); return g; };
    for (let k = 0; k < NI; k++) { const ta = (k / NI) * Math.PI * 2 - Math.PI, tb = ((k + 1) / NI) * Math.PI * 2 - Math.PI, tm = (ta + tb) / 2, w = wedge(ta, tb, R0, RM, D / 2 + ri() * .15, D / 2 + ri() * .15);
      if (w.top < P - .1) continue; /* wholly sunk in the plinth */
      if (goneI(tm)) { put('stone', lay(w.g, w.c)); gone++; continue; }
      const M = new THREE.Matrix4(); if (ri() < .125 && w.low > P) { const out = .06 + ri() * .1; M.makeTranslation(Math.sin(tm) * out, Math.cos(tm) * out, (ri() - .5) * .3); slipped++; }
      put('stone', w.g.applyMatrix4(M).applyMatrix4(T)); put('script', band(ta, tb).applyMatrix4(M).applyMatrix4(T)); }
    for (let k = 0; k < NO; k++) { const sh = .5 / NO, ta = (k / NO + sh) * Math.PI * 2 - Math.PI, tb = ((k + 1) / NO + sh) * Math.PI * 2 - Math.PI, tm = (ta + tb) / 2, w = wedge(ta, tb, RM, R1, D / 2 - .15 + (ri() - .5) * .2, D / 2 - .15 + ri() * .15);
      if (w.top < P - .1) continue;
      if (goneO(tm)) { put('stone', lay(w.g, w.c)); gone++; continue; }
      put('stone', w.g.applyMatrix4(T)); }
    // the plinth: two steps of slabs, 34 by 12 m and 30 by 8 m, 0.6 m each
    for (const [W2, D2, y0] of [[34, 12, S - .3], [30, 8, S + .6]]) { for (let x = -W2 / 2 + 1; x < W2 / 2; x += 2) for (let z = -D2 / 2 + 1; z < D2 / 2; z += 2) { const g = new THREE.BoxGeometry(1.96, .9, 1.96); g.translate(x, y0 + .45 - (y0 > S ? .3 : 0), z + zc); put('step', g); } }
    // the landing: steps cut from 3 m under the mean sea up to the crown's edge, east of the ring, 4 m wide; each a block down into the rock
    const L = rim(i, 0) + 6 - SX0, n = Math.ceil((S + 3) / .24), run = L / n;
    for (let k = 0; k < n; k++) { const x0 = SX0 + k * run, top = stairY(i, x0 + run / 2) + .04, low = Math.min(...[[x0, -SW], [x0 + run, -SW], [x0, SW], [x0 + run, SW]].map(([u, v]) => isleH(i, u, zc + v))) - .6, hh = Math.max(.6, top - low), g = new THREE.BoxGeometry(run + .02, hh, 2 * SW); g.translate(x0 + run / 2, top - hh / 2, zc); put('stair', g); }
    isles.push({ i, z: zc, R: RS[i], cond, gone, slipped, lost, stacks: STK[i], stair: { x0: SX0, x1: +(SX0 + L).toFixed(2), y0: -3, y1: S, w: 2 * SW, n } }); }
  const figure = (() => { const x = -12.5, z = 3.4, y = P, h = 1.75, g = new THREE.CylinderGeometry(.2, .24, h, 10); g.translate(x, y + h / 2, z); put('mark', g); return { x, y, z, h }; })();
  // the script, cut dead: only its strokes, at the stone's colour in shadow (gatekit's cutMat, Session 2425)
  const glyphs = (() => { const c = document.createElement('canvas'); c.width = 128; c.height = 1024; const x = c.getContext('2d'); x.fillStyle = '#000'; x.fillRect(0, 0, 128, 1024); x.strokeStyle = '#fff'; x.lineCap = 'round'; const rs = stream(key + ':script');
    for (let k = 0; k < 12; k++) { const cy = 44 + k * 84, kind = Math.floor(rs() * 4); x.lineWidth = 9; x.beginPath();
      if (kind === 0) x.arc(64, cy, 30, 0, 7); else if (kind === 1) { x.arc(64, cy, 30, 0, 7); x.moveTo(64, cy - 38); x.lineTo(64, cy + 38); } else if (kind === 2) { x.arc(64, cy, 30, Math.PI * .1, Math.PI * .9); x.moveTo(94, cy - 6); x.arc(64, cy - 6, 30, 0, -Math.PI, true); }
      else { x.moveTo(64, cy - 36); x.lineTo(64, cy + 36); for (const d of [-20, 0, 20]) { x.moveTo(44, cy + d); x.lineTo(84, cy + d); } } x.stroke(); }
    const t = new THREE.CanvasTexture(c); t.wrapT = THREE.RepeatWrapping; t.anisotropy = 8; return t; })();
  const STONE = new THREE.Color(0xd6cebe), rockM = mat('searock', { ns: 1.2, color: 0xffffff, rough: .95 }); rockM.vertexColors = true; /* Session 2440: bedded and jointed, not the kit's veined rock (it read as marble at the landing) */
  const turfM = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 1, vertexColors: true });
  const M = { rock: rockM, turf: turfM, sea: new THREE.MeshStandardMaterial({ color: new THREE.Color(.09, .2, .25), roughness: .18, metalness: .1 }), coast: mat('rock', { ns: .8, color: 0x5c6152, rough: .95 }),
    stone: mat('ashlar', { ns: .8, color: STONE.getHex(), rough: .85 }), script: Object.assign(cutMat(STONE, glyphs), { side: THREE.DoubleSide }), step: mat('ashlar', { ns: .7, color: 0xaaa397, rough: .9 }) /* the kit's slab is the gates' dark polished floor: under the sky the steps are the ring's stone */, stair: mat('searock', { ns: .9, color: 0x77746d, rough: .95 }),
    mark: new THREE.MeshStandardMaterial({ color: new THREE.Color(.5, .5, .52), roughness: .8 }) };
  let tris = 0, draws = 0;
  for (const [k, gs] of B) { const g = gs.length > 1 ? mergeGeometries(gs, false) : gs[0]; if (gs.length > 1) gs.forEach(x => x.dispose()); const mesh = new THREE.Mesh(g, M[k]); mesh.name = k; mesh.castShadow = !['sea', 'script', 'coast'].includes(k); mesh.receiveShadow = k !== 'sea'; group.add(mesh); tris += (g.index ? g.index.count : g.attributes.position.count) / 3; draws++; }
  return { group, tris: Math.round(tris), draws, ground, S, P, CY, R0, RM, R1, D, isles, coast: { z: COAST }, figure };
}

// The Forgotten Aqueducts (Session 2445; OG-104's Gatelands panel, "a sprawling network of underground waterways, still partially
// flooded"): the sheet paints halls of tall arches under the ground, water standing in them and falling from above, lit blue-green. The
// canon (§3.1) gives the Weavers the gates and nothing else, so the halls are drawn as a gate's: one nave of the gate kit at twice its
// size, buried under the Gatelands' limestone, its vault fallen in where the land has opened over it in a sinkhole, the nave and its aisles
// flooded to 6 m, so from the lip you look down 64 m onto a hall of arches in water that runs on under the land both ways into the dark.
// What drowned it, and where its halls lead, are the canon's and the quest writer's (the DECISION). A ruin as the others (#429 B): the
// script cut dead (S2425's cut), every loose stone down, nothing floats or burns. A metre a unit, the land at y 0, the nave along x.
//   - the sinkhole: 100 m across at its lip (a ragged ring, r 46 to 54), its walls of grey limestone falling sheer to the water at -64 and on
//     under it to a shelf at -66 beside the aisles; where the nave runs through it the walls are open below the vault, so the halls show;
//   - the nave: 34 m between the arcades' faces, nine bays a side of the kit's arcade arch at twice its size (28.8 m a bay, the opening 20 m,
//     the point 36 m over the floor), a spandrel wall behind them with the openings cut, a pointed barrel vault from -30 to its crown at
//     -10 (10 m of rock over it), aisles 11 m wide behind the arcades under a flat stone roof, their outer walls of plain courses; the halls
//     run 130 m each way from the sinkhole's heart and end in a choke of fallen stone. The floor is the kit's slabs at -70, 6 m under water;
//   - its condition: inside the sinkhole the arcades are the kit's 'broken' (their upper stones fallen into the water), and the vault, the
//     spandrels, the aisles' roofs and walls are gone, the vault's edge ragged where it broke; under the land the arches are 'cracked';
//     the vault's fallen stone lies in the water and heaped as a scree under the south wall;
//   - the water: still and clear over the slabs, 6 m deep in the halls; three falls: a stream off the land over the north lip (64 m), and
//     two through cracks in the vault under the land, west and east (40 m each), into the nave;
//   - the way down: a flight cut in the south wall, 3 m wide, from the lip down 38 m round a quarter of the hole to the scree's top, and the
//     scree down to the water (the DECISION's A);
//   - a 1.75 m post on the scree by the water as the scale.
// -> { group, tris, draws, ground(x, z), land, water, floor, R (the lip's mean radius), lip(a), nave { x0, x1, w, aisle, bay, bays, top, crown },
//   arches: [{ i, x, side, cond, fallen }], falls: [{ x, z, top, bottom }], stair { a0, a1, r, w, y0, y1, n }, scree { x, z, top }, stones, figure }
export function forgottenAqueducts(o = {}) {
  const key = o.key || 'ruins:aqueducts', r = stream(key), group = new THREE.Group(), DEG = Math.PI / 180;
  const LAND = 0, WATER = -64, FLOOR = -70, SHELF = -66, K = 2, BAY = 14.4 * K, NB = 9, X1 = NB * BAY / 2, HALF = 17, ARC = 2.7 * K, AISLE = 11, OUT = HALF + ARC + 2 + AISLE;
  const TOP = FLOOR + 20 * K /* the arcade's crown, -30 */, CROWN = -10, R = 50;
  // the lip: the hole's radius on its bearing a (from +z toward +x), ragged by noise, 46 to 54 m
  const lip = a => R + 8 * fbm(Math.cos(a) * 1.3 + 4, Math.sin(a) * 1.3 + 2, 3);
  const inHole = (x, z, m = 0) => Math.hypot(x, z) < lip(Math.atan2(x, z)) - m;
  const B = new Map(), put = (k, g, s = .25) => { const x = g.index ? g.toNonIndexed() : g; for (const a of Object.keys(x.attributes)) if (!['position', 'normal', 'uv', 'color'].includes(a)) x.deleteAttribute(a); x.computeVertexNormals(); if (!x.attributes.uv) worldUV(x, s); (B.get(k) || B.set(k, []).get(k)).push(x); return x; };
  // the scree: the vault's fallen stone and the wall's, heaped under the south wall from the stair's foot (-40) down into the water
  const SCREE = { x: -30, z: 37, top: -40 };
  const ground = (x, z) => { const inNave = Math.abs(z) < OUT, base = inNave ? FLOOR : SHELF + .8 * fbm(x / 12, z / 12, 2);
    const d = Math.hypot(x - SCREE.x, z - SCREE.z), s = SCREE.top - .62 * d + 2.2 * fbm(x / 7 + 9, z / 7, 3); return Math.max(base, s); };
  // the land: turf over limestone, rolling a little, a stream's bed running in from the north to the lip; a polar grid from the lip out
  // to 320 m (its rings closer near the lip), so its inner edge is the wall's top row, point for point
  const hy = (x, z) => LAND + 1.4 * fbm(x / 60 + 2, z / 60, 3) - 1.6 * Math.exp(-((x - 6) ** 2) / 30) * sstep(-40, -60, z);
  const NC = 160; { const NR = 34, pos = [], col = [], ring = i => { const t = i / NR; return t * t * 270; };
    const pt = (i, j) => { const a = j / NC * Math.PI * 2, rr = lip(a) + ring(i), x = Math.sin(a) * rr, z = Math.cos(a) * rr; return [x, hy(x, z), z]; };
    const tint = (x, z, i) => { const rock = Math.min(1, sstep(.55, .9, fbm(x / 18, z / 18 + 5, 3) * .5 + .5) * .6 + (i === 0 ? .7 : i === 1 ? .3 : 0)), t = .5 + .5 * fbm(x / 9, z / 9, 2);
      return [.28, .37, .17].map((c, k) => (c * (.8 + .35 * t)) * (1 - rock) + [.6, .59, .56][k] * rock); };
    for (let i = 0; i < NR; i++) for (let j = 0; j < NC; j++) { const q = [[i, j], [i, j + 1], [i + 1, j], [i + 1, j + 1]].map(([u, v]) => [pt(u, v % NC), u]);
      for (const T of [[q[0], q[2], q[1]], [q[1], q[2], q[3]]]) for (const [p, u] of T) { pos.push(...p); col.push(...tint(p[0], p[2], u)); } }
    const lg = new THREE.BufferGeometry(); lg.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); lg.setAttribute('color', new THREE.Float32BufferAttribute(col, 3)); lg.computeVertexNormals(); B.set('land', [lg]); }
  // the sinkhole's wall: a ragged shell from the lip down to under the shelf, the rock pushed in and out; open below the vault where the halls run through it
  const vaultY = z => { const half = HALF + ARC / 2, h = CROWN - TOP, rr = (half * half + h * h) / (2 * half), d = Math.abs(z) - (half - rr); return TOP + Math.sqrt(Math.max(0, rr * rr - d * d)); };
  // the wall's radius on bearing a at height y (t its depth from the lip, 0 to 1): the lip's own at the top, then pushed in and out by the rock
  const wallR = (a, y, t = (LAND - y) / (LAND - SHELF + 6)) => lip(a) * (1 + sstep(0, .06, t) * (.05 * fbm(Math.cos(a) * 3 + 1, y / 14, 3) + .02 * fbm(a * 9, y / 3, 2) - .03 * Math.sin(t * Math.PI)));
  const section = z => Math.abs(z) < HALF + ARC / 2 ? vaultY(z) : Math.abs(z) < OUT + 2 ? TOP + 1.2 : -Infinity;
  { const NR = 34, Y0 = SHELF - 6, P = [], C = [];
    const pt = (i, j) => { const t = i / NR, a = j / NC * Math.PI * 2, lx = Math.sin(a) * lip(a), lz = Math.cos(a) * lip(a), y0 = hy(lx, lz), y = y0 + t * (Y0 - y0), rr = wallR(a, y, t); return [Math.sin(a) * rr, y, Math.cos(a) * rr]; };
    const G = []; for (let i = 0; i <= NR; i++) { const row = []; for (let j = 0; j <= NC; j++) row.push(pt(i, j % NC)); G.push(row); }
    const tint = (x, y, z) => { const wet = 1 - sstep(WATER - 1, WATER + 5, y), v = .5 + .5 * fbm(x / 8 + y / 13, z / 8, 3), streak = .5 + .5 * fbm(Math.atan2(x, z) * 14, 2, 2), b = .5 + .3 * v - .12 * streak; return [1.1 * b * (1 - .5 * wet), b * (1 - .42 * wet), .86 * b * (1 - .36 * wet)]; };
    for (let i = 0; i < NR; i++) for (let j = 0; j < NC; j++) { const a = G[i][j], b = G[i][j + 1], c = G[i + 1][j], d = G[i + 1][j + 1];
      for (const T of [[a, b, c], [b, d, c]]) { const m = [0, 1, 2].map(k => (T[0][k] + T[1][k] + T[2][k]) / 3); if (m[1] < section(m[2]) - 1.5 + 2 * fbm(m[2] / 8, m[0] / 8, 2)) continue; for (const p of T) { P.push(...p); C.push(...tint(...p)); } } }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(C, 3)); g.computeVertexNormals(); worldUV(g, .0625); B.set('rock', [g]); }
  // the bed: inside the hole, the shelf, the nave's floor and the scree (a heightfield; the halls beyond have the slabs alone)
  { const N = 70, S = 116, g = new THREE.PlaneGeometry(S, S, N, N); g.rotateX(-Math.PI / 2); const P = g.attributes.position, col = [];
    for (let i = 0; i < P.count; i++) { const x = P.getX(i), z = P.getZ(i), y = ground(x, z) - (ground(x, z) <= FLOOR + .01 ? .3 : 0); P.setY(i, y); const v = .5 + .5 * fbm(x / 5, z / 5, 2), wet = 1 - sstep(WATER - 1, WATER + 3, y); col.push(...[.42, .41, .38].map((c, k) => c * (.75 + .3 * v) * (1 - .45 * wet) + [0, .02, .02][k] * wet)); }
    g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3)); g.computeVertexNormals(); worldUV(g, .1); B.set('bed', [g]); }
  // the nave's floor: the kit's slabs at -70 the halls' length and width (under the bed's heightfield inside the hole)
  { const g = new THREE.BoxGeometry(2 * X1 + 4, 1, 2 * OUT); g.translate(0, FLOOR - .5, 0); put('slab', g); }
  { const g = new THREE.PlaneGeometry(2 * X1 + 20, 2 * R + 30); g.rotateX(-Math.PI / 2); g.translate(0, WATER, 0); put('water', g); }
  // the arcades: the kit's arch at twice its size, nine bays a side, faced across the nave; broken inside the hole, cracked under the land
  const piecesBy = new Map(), take = G => { G.updateMatrixWorld(true); G.traverse(m => { if (!m.isMesh) return; const k = m.userData.key; if (!piecesBy.has(k)) piecesBy.set(k, [m.material, []]); piecesBy.get(k)[1].push(m); }); };
  const arches = []; for (const side of [-1, 1]) for (let i = 0; i < NB; i++) { const x = -X1 + (i + .5) * BAY, z = side * (HALF + ARC / 2), open = inHole(x, z, -6), cond = open ? 'broken' : 'cracked';
    const G = gatePiece('arch', { cond, school: 'uisce', key: `${key}:arch:${side}:${i}`, ruin: true, cut: true, ground: 0 }); G.scale.setScalar(K); G.rotation.y = side < 0 ? 0 : Math.PI; G.position.set(x, FLOOR, z); take(G); arches.push({ i, x: +x.toFixed(1), side, cond, fallen: G.userData.fallen }); }
  // what stands over the arcades under the land: the spandrel walls (an extruded wall with the bays' openings), the vault, the aisles'
  // roofs and outer walls; each cut where it stood over the hole, its edge ragged
  const keepOut = (g, m) => { const x = g.index ? g.toNonIndexed() : g, P = x.attributes.position, keep = []; for (let i = 0; i < P.count; i += 3) { const cx = (P.getX(i) + P.getX(i + 1) + P.getX(i + 2)) / 3, cz = (P.getZ(i) + P.getZ(i + 1) + P.getZ(i + 2)) / 3;
      if (inHole(cx, cz, m + 3 * fbm(cx / 6, cz / 6, 2))) continue; for (let k = 0; k < 3; k++) keep.push(P.getX(i + k), P.getY(i + k), P.getZ(i + k)); } const o2 = new THREE.BufferGeometry(); o2.setAttribute('position', new THREE.Float32BufferAttribute(keep, 3)); return o2; };
  const SPRING = FLOOR + 9 * K, RISE = 9 * K, HW = 5 * K, RR = (RISE * RISE + HW * HW) / (2 * HW);
  for (const side of [-1, 1]) for (let i = 0; i < NB; i++) { const c = -X1 + (i + .5) * BAY, z0 = side < 0 ? -(HALF + ARC) - 2 : HALF + ARC, near = c - Math.sign(c) * BAY / 2;
    if (inHole(near, z0 + 1, -2) || inHole(c, z0 + 1, -2)) continue;
    const sh = new THREE.Shape(); sh.moveTo(c - BAY / 2, FLOOR); sh.lineTo(c + BAY / 2, FLOOR); sh.lineTo(c + BAY / 2, TOP); sh.lineTo(c - BAY / 2, TOP); sh.closePath();
    const h = new THREE.Path(); h.moveTo(c - HW, FLOOR + .5); h.lineTo(c + HW, FLOOR + .5); h.lineTo(c + HW, SPRING);
    h.absarc(c + HW - RR, SPRING, RR, 0, Math.asin(RISE / RR), false); h.absarc(c - HW + RR, SPRING, RR, Math.PI - Math.asin(RISE / RR), Math.PI, false); h.lineTo(c - HW, FLOOR + .5); sh.holes.push(h);
    const g = new THREE.ExtrudeGeometry(sh, { depth: 2, bevelEnabled: false, curveSegments: 10 }); g.translate(0, 0, z0); g.deleteAttribute('uv'); put('wall', g); }
  { const N = 24, L = 2 * X1, NX = 90, half = HALF + ARC / 2, h = CROWN - TOP, rr = (half * half + h * h) / (2 * half), fm = Math.asin(h / rr), pos = [];
    const at = t => { const s2 = t < .5 ? -1 : 1, f = t < .5 ? t * 2 * fm : (1 - t) * 2 * fm; return [s2 * (half - rr + rr * Math.cos(f)), TOP + rr * Math.sin(f)]; };
    for (let i = 0; i < NX; i++) for (let j = 0; j < N; j++) { const x0 = -X1 + L * i / NX, x1 = -X1 + L * (i + 1) / NX, [z0, y0] = at(j / N), [z1, y1] = at((j + 1) / N);
      pos.push(x0, y0, z0, x1, y0, z0, x0, y1, z1, x1, y0, z0, x1, y1, z1, x0, y1, z1); }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); put('vault', keepOut(g, 1.5)); }
  for (const side of [-1, 1]) { const roof = new THREE.BoxGeometry(2 * X1, 1.2, OUT - HALF - ARC, 60, 1, 3); roof.translate(0, TOP + .6, side * (HALF + ARC + (OUT - HALF - ARC) / 2)); put('wall', keepOut(roof, 1));
    const wall = new THREE.BoxGeometry(2 * X1, TOP - FLOOR, 2, 60, 8, 1); wall.translate(0, (TOP + FLOOR) / 2, side * (OUT + 1)); put('wall', keepOut(wall, 1)); }
  // the scale: a plain 1.75 m post on the scree, 2 m over the water
  const FIG = (() => { let best = null; for (let d = 0; d < 40; d += .5) { const x = SCREE.x + d * .7, z = SCREE.z - d * .7, y = ground(x, z); if (y < WATER + 2.4) break; best = { x, z, y }; }
    return { x: +best.x.toFixed(2), y: +best.y.toFixed(2), z: +best.z.toFixed(2), h: 1.75 }; })();
  // the rock round the halls under the land (never seen but through a gap): a dark box from the floor to under the turf, its faces cut where the hole is
  { const g = new THREE.BoxGeometry(2 * X1 + 6, LAND - .6 - FLOOR + 2, 2 * OUT + 6, 70, 14, 14); g.translate(0, (LAND - .6 + FLOOR - 2) / 2, 0); put('liner', keepOut(g, -1)); }
  // the chokes at the halls' ends: a face of rock across the nave and heaps of the kit's blocks against it, under the water and over it
  const stones = []; { const rs = stream(key + ':stones');
    for (const s of [-1, 1]) { const g = new THREE.PlaneGeometry(2 * OUT + 4, CROWN - FLOOR + 4, 20, 20), P = g.attributes.position; for (let i = 0; i < P.count; i++) P.setZ(i, 3 * fbm(P.getX(i) / 6, P.getY(i) / 6, 3)); g.rotateY(s < 0 ? Math.PI / 2 : -Math.PI / 2); g.translate(s * (X1 + 1), (CROWN + FLOOR) / 2, 0); put('choke', g);
      for (let k = 0; k < 26; k++) { const w = 2 + rs() * 4, h = 1.5 + rs() * 2.5, d = 2 + rs() * 3, b = new THREE.BoxGeometry(w, h, d); b.rotateY(rs() * Math.PI); b.rotateZ((rs() - .5) * .8); b.translate(s * (X1 - 2 - rs() * 14), FLOOR + h / 2 + rs() * 10 * (1 - k / 26), (rs() - .5) * 2 * (OUT - 3)); put('stone', b, .08); } }
    // the vault's fallen stone in the hole: blocks of 2 to 5 m in the nave's water and on the scree, each resting on what is under it, sunk a third of its height
    for (let k = 0; k < 70; k++) { const a = rs() * Math.PI * 2, d = Math.sqrt(rs()) * 44, x = Math.sin(a) * d, z = Math.cos(a) * d * .8, w = 2 + rs() * 3.5, h = 1.4 + rs() * 2.2, dd = 2 + rs() * 3;
      if (!inHole(x, z, 4) || Math.hypot(x - FIG.x, z - FIG.z) < 6) continue; const b = new THREE.BoxGeometry(w, h, dd); b.rotateX((rs() - .5) * .5); b.rotateY(rs() * Math.PI); b.rotateZ((rs() - .5) * .5);
      const y = Math.min(...[[0, 0], [1.5, 1.5], [-1.5, 1.5], [1.5, -1.5], [-1.5, -1.5]].map(([u, v]) => ground(x + u, z + v))); b.computeBoundingBox(); b.translate(x, y - b.boundingBox.min.y - h / 3, z); put('stone', b, .08);
      stones.push({ x: +x.toFixed(1), z: +z.toFixed(1), y: +y.toFixed(2), top: +(y + h * 2 / 3).toFixed(2) }); } }
  // the way down: a flight cut in the south wall from the lip round to the scree's top; each step a block of the wall's rock, 3 m deep from the wall
  const ST = { a0: 50 * DEG, a1: -37 * DEG, w: 3, y0: LAND - .2, y1: SCREE.top + .6, n: 96 };
  for (let k = 0; k < ST.n; k++) { const t = (k + .5) / ST.n, a = ST.a0 + (ST.a1 - ST.a0) * t, y = ST.y0 + (ST.y1 - ST.y0) * k / ST.n, rw = Math.min(wallR(a, y), wallR(a, y - 1.2)), len = Math.abs(ST.a1 - ST.a0) / ST.n * rw + .06, back = 2;
    const st = new THREE.BoxGeometry(ST.w + back, 1.2, len); st.translate(rw - ST.w + (ST.w + back) / 2, y - .6, 0); st.rotateY(a - Math.PI / 2); st.deleteAttribute('uv'); put('stair', st, .0625); }
  // the falls: thin ribbons, brighter at their heads, drawn added; one off the north lip, two through the vault under the land
  const falls = [{ x: 6, z: -lip(Math.PI) + 2.5, top: LAND - 1.2, bottom: WATER, w: 4 }, { x: -78, z: -6, top: CROWN - 3, bottom: WATER, w: 1.6 }, { x: 92, z: 8, top: CROWN - 4, bottom: WATER, w: 2.2 }];
  const streaks = (() => { const c = document.createElement('canvas'); c.width = 64; c.height = 256; const x = c.getContext('2d'), rs = stream(key + ':streaks'); x.fillStyle = '#000'; x.fillRect(0, 0, 64, 256);
    for (let k = 0; k < 70; k++) { const u = rs() * 64, w = .6 + rs() * 2.4, b = 90 + rs() * 165; x.fillStyle = `rgb(${b},${b},${b})`; x.fillRect(u, rs() * 80 - 40, w, 200 + rs() * 120); }
    const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; return t; })();
  for (const f of falls) { const L = f.top - f.bottom, g = new THREE.PlaneGeometry(f.w, L, 4, 20), P = g.attributes.position, col = []; for (let i = 0; i < P.count; i++) { const t = P.getY(i) / L + .5; P.setX(i, P.getX(i) * (1 + (1 - t) * 1.4) + .4 * fbm(P.getY(i) / 4, f.x, 2)); const b = .35 + .65 * t; col.push(b, b, b); }
    g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3)); const U = g.attributes.uv; for (let i = 0; i < U.count; i++) U.setXY(i, U.getX(i) * f.w / 6, U.getY(i) * L / 24); g.translate(f.x, (f.top + f.bottom) / 2, f.z); put('fall', g);
    const foam = new THREE.CircleGeometry(f.w * 1.8, 16); foam.rotateX(-Math.PI / 2); foam.translate(f.x, WATER + .05, f.z); put('foam', foam); }

  const figure = FIG; { const g = new THREE.CylinderGeometry(.2, .24, FIG.h, 10); g.translate(FIG.x, FIG.y + FIG.h / 2, FIG.z); put('mark', g); }
  const rockM = mat('searock', { ns: .9, color: 0xffffff, rough: .9 }); rockM.vertexColors = true; rockM.side = THREE.DoubleSide; rockM.shadowSide = THREE.DoubleSide;
  const landM = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: .95 }); landM.side = THREE.DoubleSide; landM.shadowSide = THREE.DoubleSide;
  const bedM = mat('rock', { ns: .7, color: 0xffffff, rough: .92 }); bedM.vertexColors = true;
  const col = new THREE.Color(...GK_SCHOOLS.uisce.stone);
  const M = { liner: new THREE.MeshStandardMaterial({ color: new THREE.Color(.05, .055, .055), roughness: 1, side: THREE.DoubleSide }), land: landM, rock: rockM, bed: bedM, slab: mat('slab', { ns: .7, color: col.clone().multiplyScalar(.75), rough: .5 }), wall: mat('ashlar', { ns: 1, color: col.clone().multiplyScalar(.92) }), vault: mat('ashlar', { ns: 1, color: col.clone().multiplyScalar(.85) }),
    choke: rockM, stone: mat('ashlar', { ns: 1, color: col.clone().multiplyScalar(.9) }), stair: mat('searock', { ns: .8, color: 0x9c9a95, rough: .9 }),
    water: new THREE.MeshStandardMaterial({ color: new THREE.Color(.04, .11, .11), roughness: .2, metalness: .15, transparent: true, opacity: .84 }),
    fall: new THREE.MeshBasicMaterial({ map: streaks, vertexColors: true, color: new THREE.Color(.8, .86, .86), transparent: true, opacity: .9, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }),
    foam: new THREE.MeshBasicMaterial({ color: new THREE.Color(.5, .55, .55), transparent: true, opacity: .45, depthWrite: false }), mark: new THREE.MeshStandardMaterial({ color: new THREE.Color(.5, .5, .52), roughness: .8 }) };
  for (const k of ['wall', 'vault', 'stone', 'stair']) { M[k].side = THREE.DoubleSide; }
  let tris = 0, draws = 0;
  for (const [, [m, ms]] of piecesBy) { const gs = ms.map(x => { const g = x.geometry.clone(); g.applyMatrix4(x.matrixWorld); return g; }), g = mergeGeometries(gs, false); gs.forEach(x => x.dispose()); const mesh = new THREE.Mesh(g, m); mesh.receiveShadow = true; mesh.castShadow = !['dead', 'cut', 'cutRing', 'script', 'ring', 'crack'].includes(ms[0].userData.key); mesh.name = 'kit:' + ms[0].userData.key; group.add(mesh); tris += g.attributes.position.count / 3; draws++; }
  for (const [k, gs] of B) { const g = gs.length > 1 ? mergeGeometries(gs, false) : gs[0]; if (gs.length > 1) gs.forEach(x => x.dispose()); if (!g.attributes.normal) g.computeVertexNormals(); if (!g.attributes.uv) worldUV(g, .25); const mesh = new THREE.Mesh(g, M[k]); mesh.name = k; mesh.castShadow = !['bed', 'water', 'fall', 'foam'].includes(k); mesh.receiveShadow = !['fall', 'foam'].includes(k); if (k === 'water') mesh.renderOrder = 2; if (k === 'fall' || k === 'foam') mesh.renderOrder = 3; group.add(mesh); tris += (g.index ? g.index.count : g.attributes.position.count) / 3; draws++; }
  return { group, tris: Math.round(tris), draws, ground, land: LAND, landAt: hy, water: WATER, floor: FLOOR, R, lip, inHole, nave: { x0: -X1, x1: X1, w: 2 * HALF, aisle: AISLE, out: OUT, bay: BAY, bays: NB, top: TOP, crown: CROWN }, arches, falls, stair: ST, scree: SCREE, stones: stones.length, figure };
}
