// The strange and the legendary, I (the concept artist, 22 Nov 2026; backlog L2, "The strange and the legendary", OG-054 and OG-071's
// Branwen; the quest writer's *The Strange and the Legendary, I*, drafted 22 Nov, unapproved): sheet E11, *the unexplained*, drew five
// strange-but-friendly figures: the Clockwork Pilgrim (a brass-faced construct in a wide straw hat and patched robes, a staff and a pack,
// a chronicler), the Rooted One (an old talking tree by a forgotten shrine, bluebirds on its branches; OG-071 draws her again as Branwen,
// an Old Blood hermit overgrown with moss, bark and ivy, green-grey skin, a bird on her shoulder), the Veiled Merchant (a cream veil over
// a gold mask, a stall of impossible goods), the Gateborn Companion (dropped by the draft: §5 and Michael's 12 A) and the Painted Woman
// (in paintings, murals and crowds, different face, same eyes). The draft's corrections hold at every level: the pilgrim is Fiontán, a
// Gatelander in a brass mask (his face burned at a Tine gate; the canon places no made men); the Rooted One is Bláthnat, Old Blood, grey
// with the Cold from one word read young, the marks to the elbow, the moss and the ivy the tree's and not hers, a wren (the Gatelands'
// own bird) on her shoulder, barefoot, seated; the Merchant tall, gloved, his people never shown; the Painted Woman is never built.
//
// The question is how strange the strange look, three levels:
//   a  strange in the words alone: each as anyone of their road would look: Fiontán a pilgrim in a straw hat, his burned face bare (a
//      scar across the eye), a staff and a creel; Bláthnat an old Old Blood woman in grey sat at the tree's foot, shod, the marks only at
//      the wrists; the Merchant an Aurennais traveller in a long cream coat with the head-wrap's veil drawn across his face, at a plain stall;
//   b  the draft's faces (recommended): Fiontán's smooth brass face, two eye-holes and no mouth, patches on his undyed robe, a madder sash,
//      the ledger strapped to his creel; Bláthnat barefoot, the moss in her hair's ends, ivy over her grey mantle, the marks to the elbow,
//      the wren on her shoulder; the Merchant's gold mask, featureless but the eyes, over the cream veil, gloved, a folding stall of dark
//      wood under a striped awning with a brass lamp lit;
//   c  OG-054 as drawn, its corrections kept where the canon fixes them: Fiontán a true construct (riveted brass, the eye-holes lit amber
//      from inside, brass hands, a wheel turning at his breast); Bláthnat green-grey and half grown into the tree (OG-071's skin, twigs
//      from her shoulders, shelf fungus at her feet, three bluebirds for the wren); the Merchant's stall of impossible goods (orbs that
//      hang in the air, a jar of light, an hourglass running upward); and the Painted Woman as a portrait on an easel, her eyes lit.
// STRANGE[key] is the sheet; strGenome(key, level, P) makes the genome (P carries people.js's rollGenome, heightFor, GARMENTS and
// DRESS_FLAGS). strProps(M, G, level) adds what people.js does not have (the face masks, the patches, the ledger, the ivy, the wren, the
// twigs, the brass hands and the wheel) and returns their triangles; veiledStall(level), rootSeat(h), fungus(), portrait() are the set
// pieces, each in its own frame in metres. Colours are linear [r,g,b].
import * as THREE from 'three';
import { cageLantern } from './faith.js';

const BRASS = [.62, .46, .2], GOLD = [.74, .56, .2], CREAM = [.8, .75, .62], UNDYED = [.6, .56, .46], MADDER = [.5, .14, .08], GREY = [.36, .36, .36],
  LEATHER = [.24, .16, .1], WICKER = [.5, .4, .26], DARKWOOD = [.16, .1, .07];

export const STRANGE = {
  // Fiontán, the pilgrim in the brass face: a Gatelander, tall and stooped, a chronicler a day behind you
  fiontan: { label: 'Fiontán, the pilgrim in the brass face', people: 'gatelander', g: 1, age: .62, muscle: .45, weight: .3, metres: 1.86,
    hairCol: [.32, .3, .28], hair: { style: 'short', len: .4 }, pose: { stoop: .16 },
    a: { robe: [.52, .47, .38], cord: [.4, .32, .22], boots: [.22, .15, .1], hat: [.8, .7, .45], hatKind: 'straw', staff: [.4, .3, .2], staffMake: 'hazel', backpack: WICKER, backpackKind: 'creel', scar: 'L' },
    b: { robe: UNDYED, cord: [.4, .32, .22], sash: MADDER, sashPrint: false, boots: [.22, .15, .1], hat: [.8, .7, .45], hatKind: 'straw', staff: [.4, .3, .2], staffMake: 'hazel',
      backpack: WICKER, backpackKind: 'creel', mask: 'brass', patches: 9, ledger: true },
    c: { robe: UNDYED, cord: [.4, .32, .22], sash: MADDER, sashPrint: false, boots: [.22, .15, .1], hat: [.8, .7, .45], hatKind: 'straw', staff: [.4, .3, .2], staffMake: 'hazel',
      backpack: WICKER, backpackKind: 'creel', mask: 'construct', patches: 12, ledger: true, gloves: BRASS, glovesKind: 'leather', brassHands: true, wheel: true } },
  // Bláthnat, the Rooted One: Old Blood, small and grey-pale, sat at the oldest tree's foot by a Gatelands shrine since the elm was a switch
  blathnat: { label: 'Bláthnat, the Rooted One', people: 'oldblood', g: 0, age: .97, muscle: .3, weight: .2, metres: 1.5, seated: true,
    hair: { style: 'loose', len: .85 },
    a: { hairCol: [.8, .8, .78], marks: .02, skin: null, tunic: [.5, .49, .46], trousers: [.42, .41, .39], boots: [.2, .15, .1], cowl: GREY, lap: GREY },
    b: { hairCol: [.07, .085, .055], marks: .3, skin: null, tunic: [.5, .49, .46], trousers: [.42, .41, .39], lap: GREY, ivy: 45, lapIvy: 40, wren: 1 },
    c: { hairCol: [.1, .14, .06], marks: .3, skin: [.3, .37, .27], tunic: [.3, .33, .26], trousers: [.26, .28, .22], lap: [.24, .3, .2], ivy: 110, lapIvy: 110, birds: 3, twigs: true } },
  // the Veiled Merchant: tall, his people never shown; Aurennais in speech
  veiled: { label: 'The Veiled Merchant', people: 'aurennais', g: 1, age: .5, muscle: .4, weight: .3, metres: 1.9, skin: [.2, .12, .08],
    hairCol: [.05, .04, .035], hair: { style: 'short', len: .3 },
    a: { coat: CREAM, coatLen: 1, tunic: [.7, .66, .56], trousers: [.62, .58, .5], boots: [.3, .22, .14], belt: [.4, .3, .2], wrap: CREAM, veil: CREAM },
    b: { coat: CREAM, coatLen: 1, tunic: [.7, .66, .56], trousers: [.62, .58, .5], boots: [.3, .22, .14], belt: [.4, .3, .2], wrap: CREAM, veil: CREAM, gloves: [.86, .84, .78], glovesKind: 'leather', mask: 'gold' },
    c: { coat: CREAM, coatLen: 1, coatTrim: GOLD, tunic: [.7, .66, .56], trousers: [.62, .58, .5], boots: [.3, .22, .14], belt: [.4, .3, .2], wrap: CREAM, veil: CREAM, gloves: [.86, .84, .78], glovesKind: 'leather', mask: 'gold', necklace: GOLD } } };
export const ORDER = ['fiontan', 'blathnat', 'veiled'];
const OWN = ['lap', 'lapIvy', 'mask', 'patches', 'ledger', 'brassHands', 'wheel', 'ivy', 'wren', 'birds', 'twigs', 'scar', 'marks', 'hairCol', 'skin'];

export function strGenome(key, level, P) {
  const S = STRANGE[key], G = P.rollGenome('strange:' + key, { people: S.people, g: S.g });
  for (const k of ['age', 'muscle', 'weight', 'hairCol', 'skin']) if (S[k] != null) G[k] = Array.isArray(S[k]) ? S[k].slice() : S[k];
  const D = JSON.parse(JSON.stringify(S[level] || S.b)), own = {}; for (const k of OWN) if (k in D) { own[k] = D[k]; delete D[k]; }
  if (own.hairCol) G.hairCol = own.hairCol; if (own.skin) G.skin = own.skin;
  G.hair = { ...S.hair }; G.pose = { ...(G.pose || {}), stoop: 0, ...(S.pose || {}) }; G.scar = own.scar || null; G.marks = own.marks ?? null; G.beard = key === 'fiontan' && !own.mask ? .25 : 0;
  const skirt = D.robe ? 'long' : (S.g ? 'short' : 'long');
  G.dress = { ...Object.fromEntries(P.GARMENTS.map(k => [k, null])), ...P.DRESS_FLAGS, skirt, ...D, ...(S.seated ? { chair: [.3, .22, .14] } : {}) };
  G.height = P.heightFor(G, S.metres); G.strange = key; G.own = own; return G;
}

// ── helpers ──
const lin = c => new THREE.Color().setRGB(...c, THREE.SRGBColorSpace);
const M_ = (c, o = {}) => new THREE.MeshStandardMaterial({ color: lin(c), roughness: o.r ?? .7, metalness: o.m ?? 0, side: o.ds ? THREE.DoubleSide : THREE.FrontSide,
  emissive: o.e ? lin(o.e) : 0x000000, emissiveIntensity: o.ei ?? 1, map: o.map || null, alphaTest: o.at ?? 0, transparent: !!o.tr, opacity: o.op ?? 1, depthWrite: o.dw ?? true });
const tris = g => (g.index ? g.index.count : g.attributes.position.count) / 3;
const cyl = (r0, r1, L, n, m) => new THREE.Mesh(new THREE.CylinderGeometry(r1, r0, L, n), m);
const box = (w, h, d, m) => new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m);
function canvasTex(w, h, draw) { const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t; }
const rng = s => { let a = s >>> 0; return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; };

// the skinning of one vertex of a skinned mesh as a matrix (bind space → the mesh's frame as posed): what applyBoneTransform does, kept
// whole so a prop laid on the rest body (in bind space) follows the pose (the seated knees, the stoop) exactly
function skinMatrix(sm, i) {
  const si = sm.geometry.attributes.skinIndex, sw = sm.geometry.attributes.skinWeight, bm = sm.skeleton.boneMatrices, out = new THREE.Matrix4().set(0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0), t = new THREE.Matrix4();
  for (let k = 0; k < 4; k++) { const w = sw.getComponent(i, k); if (!w) continue; t.fromArray(bm, si.getComponent(i, k) * 16); for (let e = 0; e < 16; e++) out.elements[e] += w * t.elements[e]; }
  return new THREE.Matrix4().multiplyMatrices(sm.bindMatrixInverse, out).multiply(sm.bindMatrix);
}
function boneMatrix(sm, name) { const b = sm.skeleton.bones.findIndex(x => x.name === name), t = new THREE.Matrix4().fromArray(sm.skeleton.boneMatrices, b * 16);
  return new THREE.Matrix4().multiplyMatrices(sm.bindMatrixInverse, t).multiply(sm.bindMatrix); }
const bindPos = (sm, name) => new THREE.Vector3().setFromMatrixPosition(new THREE.Matrix4().copy(sm.skeleton.boneInverses[sm.skeleton.bones.findIndex(b => b.name === name)]).invert());
const kOf = sm => boneMatrix(sm, 'head').getMaxScaleOnAxis();
function ready(M) { M.root.updateMatrixWorld(true); M.root.traverse(o => { if (o.isSkinnedMesh) o.skeleton.update(); }); }
const bodyOf = M => M.meshes.find(m => m.isSkinnedMesh && m.name === 'body') || M.meshes.find(m => m.isSkinnedMesh);
const meshNamed = (M, re) => { const out = []; M.root.traverse(o => { if (o.isMesh && re.test(o.name)) out.push(o); }); return out; };

// ── the face masks (Fiontán's brass, the Merchant's gold): laid on a radial map of the face round the head's middle (64 × 40 directions),
// each bin the furthest of the face's points in it, spread to its neighbours and smoothed twice so the mask bridges the nose and the lips
// as a beaten sheet does, then stood 5 mm off. Two almond eye-holes cut by an alpha map at the eyes' own places; no mouth. From the brow
// (under the hat's band) to under the chin for the brass (o.bottom 'chin'), to the lower lid for the gold (the veil takes the rest).
function faceMask(M, kind) {
  ready(M); const sm = bodyOf(M), p = sm.geometry.attributes.position, V = new THREE.Vector3();
  const bi = sm.skeleton.bones.findIndex(b => b.name === 'head'), inv = sm.skeleton.boneInverses[bi], headBind = new THREE.Matrix4().copy(inv).invert();
  const hp = new THREE.Vector3().setFromMatrixPosition(headBind), eyes = ['eye.L', 'eye.R'].map(n => new THREE.Vector3().setFromMatrixPosition(new THREE.Matrix4().copy(sm.skeleton.boneInverses[sm.skeleton.bones.findIndex(b => b.name === n)]).invert()));
  const K = kOf(sm), pts = []; for (let i = 0; i < p.count; i++) { V.fromBufferAttribute(p, i); if (V.y > hp.y - .06 / K && V.z > hp.z - .01 / K && Math.abs(V.x - hp.x) < .1 / K) pts.push(V.clone()); }
  const eyeY = (eyes[0].y + eyes[1].y) / 2, c = new THREE.Vector3(hp.x, eyeY - .01 / K, hp.z - .035 / K);
  let chin = 9, front = -9; for (const q of pts) { if (Math.abs(q.x - c.x) < .02 / K) chin = Math.min(chin, q.y); front = Math.max(front, q.z); }
  const gold = kind === 'gold', TOP = eyeY + .045 / K, BOT = gold ? eyeY - .04 / K : chin - .03 / K, NA = 56, NB = 36, A0 = -1.45, A1 = 1.45;
  const B0 = Math.atan2(BOT - c.y, front - c.z) - .05, B1 = Math.atan2(TOP - c.y, front - c.z) + .04;
  const R = Array.from({ length: NB + 1 }, () => new Float32Array(NA + 1));
  for (const q of pts) { const d = q.clone().sub(c), az = Math.atan2(d.x, d.z), el = Math.atan2(d.y, Math.hypot(d.x, d.z)); const ia = Math.round((az - A0) / (A1 - A0) * NA), ib = Math.round((el - B0) / (B1 - B0) * NB);
    for (let da = -1; da <= 1; da++) for (let db = -1; db <= 1; db++) { const a = ia + da, b = ib + db; if (a < 0 || a > NA || b < 0 || b > NB) continue; R[b][a] = Math.max(R[b][a], d.length()); } }
  // fill empty bins from their row, spread (max of 5 × 3) and smooth (two box passes): a sheet, not a cast of the face
  for (const row of R) { let last = 0; for (let a = 0; a <= NA; a++) if (row[a]) last = row[a]; else row[a] = last; }
  const pass = (src, f, ra, rb) => src.map((row, b) => Float32Array.from(row, (_, a) => { const v = []; for (let db = -rb; db <= rb; db++) for (let da = -ra; da <= ra; da++) { const r = src[Math.min(NB, Math.max(0, b + db))][Math.min(NA, Math.max(0, a + da))]; v.push(r); } return f(v); }));
  let S = pass(R, v => Math.max(...v), 3, 3); for (let k = 0; k < 4; k++) S = pass(S, v => v.reduce((x, y) => x + y) / v.length, 3, 3);
  const pos = [], uv = [], idx = [], dir = (az, el) => new THREE.Vector3(Math.sin(az) * Math.cos(el), Math.sin(el), Math.cos(az) * Math.cos(el));
  for (let b = 0; b <= NB; b++) for (let a = 0; a <= NA; a++) { const az = A0 + (A1 - A0) * a / NA, el = B0 + (B1 - B0) * b / NB, q = c.clone().addScaledVector(dir(az, el), S[b][a] + (gold ? .004 : .005) / K); pos.push(q.x, q.y, q.z); uv.push(a / NA, b / NB); }
  for (let b = 0; b < NB; b++) for (let a = 0; a < NA; a++) { const i = b * (NA + 1) + a; idx.push(i, i + 1, i + NA + 2, i, i + NA + 2, i + NA + 1); }
  const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); geo.setIndex(idx); geo.computeVertexNormals();
  // the alpha map: the mask's outline (an oval, its sides cut back at the ears) and the two eye-holes where the eyes are
  const toUV = e => { const d = e.clone().sub(c); return [(Math.atan2(d.x, d.z) - A0) / (A1 - A0), (Math.atan2(d.y, Math.hypot(d.x, d.z)) - B0) / (B1 - B0)]; };
  const eu = eyes.map(toUV), construct = kind === 'construct';
  const alpha = canvasTex(512, 384, (x, w, h) => { x.fillStyle = '#000'; x.fillRect(0, 0, w, h); x.fillStyle = '#fff'; x.beginPath(); x.ellipse(w / 2, h / 2, w * (gold ? .36 : .3), h * .52, 0, 0, Math.PI * 2); x.fill();
    if (gold) x.fillRect(w * .14, 0, w * .72, h * .5);
    x.fillStyle = '#000'; for (const [u, v] of eu) { x.beginPath(); x.ellipse(u * w, (1 - v) * h, w * .034, h * .03, 0, 0, Math.PI * 2); x.fill(); } });
  const tex = canvasTex(512, 384, (x, w, h) => { const g = x.createLinearGradient(0, 0, w, h); g.addColorStop(0, '#c9a050'); g.addColorStop(.5, '#e2c37a'); g.addColorStop(1, '#a07a34'); const b = x.createLinearGradient(0, 0, w, h); b.addColorStop(0, '#a87a34'); b.addColorStop(.45, '#d4a456'); b.addColorStop(1, '#8a6024'); x.fillStyle = gold ? g : b; x.fillRect(0, 0, w, h);
    const r = rng(kind.length * 31); x.globalAlpha = .06; for (let i = 0; i < 900; i++) { x.fillStyle = r() < .5 ? '#5a3a10' : '#fff0c0'; x.beginPath(); x.ellipse(r() * w, r() * h, 3 + r() * 4, 2 + r() * 3, r() * 3, 0, Math.PI * 2); x.fill(); } x.globalAlpha = 1;
    if (construct) { x.strokeStyle = '#5a4018'; x.lineWidth = 3; x.beginPath(); x.moveTo(w / 2, h * .02); x.lineTo(w / 2, h * .98); x.stroke(); x.beginPath(); x.ellipse(w / 2, h / 2, w * .27, h * .47, 0, 0, Math.PI * 2); x.stroke();
      x.fillStyle = '#e6c77e'; x.strokeStyle = '#5a4018'; x.lineWidth = 1.5; for (let i = 0; i < 22; i++) { const t = i / 22 * Math.PI * 2; x.beginPath(); x.arc(w / 2 + Math.cos(t) * w * .255, h / 2 + Math.sin(t) * h * .445, 4.5, 0, Math.PI * 2); x.fill(); x.stroke(); }
      for (let i = 0; i < 8; i++) { x.beginPath(); x.arc(w / 2 + (i % 2 ? 9 : -9), h * (.1 + i * .11), 3.5, 0, Math.PI * 2); x.fill(); x.stroke(); } }
    x.strokeStyle = gold ? '#7a5a1e' : '#5a4018'; x.lineWidth = 3; for (const [u, v] of eu) { x.beginPath(); x.ellipse(u * w, (1 - v) * h, w * .038, h * .034, 0, 0, Math.PI * 2); x.stroke(); } });
  const m = new THREE.MeshStandardMaterial({ map: tex, alphaMap: alpha, alphaTest: .5, color: 0xffffff, metalness: gold ? .5 : .45, roughness: gold ? .3 : .4, emissive: new THREE.Color(gold ? .16 : .1, gold ? .11 : .06, .02), side: THREE.DoubleSide });
  const mesh = new THREE.Mesh(geo, m); mesh.name = 'mask-' + kind; mesh.applyMatrix4(boneMatrix(sm, 'head')); mesh.castShadow = true; sm.add(mesh);
  let n = tris(geo);
  if (construct) for (const e of eyes) { const glow = new THREE.Mesh(new THREE.SphereGeometry(.013, 12, 8), M_([1, .6, .2], { e: [1, .55, .15], ei: 3 })); glow.scale.setScalar(1 / K); glow.position.copy(e).add(new THREE.Vector3(0, 0, .002 / K)); glow.applyMatrix4(boneMatrix(sm, 'head')); sm.add(glow); n += tris(glow.geometry); }
  return { tris: n, chin: +(chin).toFixed(3), w: NA, h: NB };
}

// things stuck to a skinned mesh's surface (patches, ivy leaves): n of them at its vertices chosen by `pick(p, n)` (bind space), each a
// card built by make(rnd) in its own frame (z out of the surface), carried by its vertex's skinning
// bind-space landmarks (the pack's rest body is not in metres: a person's bones carry their stature)
function landmarks(sm) { const K = kOf(sm); return { K, neck: bindPos(sm, 'neck01').y, sh: bindPos(sm, 'upperarm01.L').y, hip: bindPos(sm, 'upperleg01.L').y, knee: bindPos(sm, 'lowerleg01.L').y, shX: Math.abs(bindPos(sm, 'upperarm01.L').x) }; }
function stuck(M, meshes, n, seed, pick, make, mat, lift = .004) {
  ready(M); const K = kOf(bodyOf(M)), L = landmarks(bodyOf(M)); lift /= K; const r = rng(seed), geos = [], V = new THREE.Vector3(), N = new THREE.Vector3(), cand = [];
  for (const sm of meshes) { const p = sm.geometry.attributes.position; if (!sm.geometry.attributes.normal) sm.geometry.computeVertexNormals(); const nn = sm.geometry.attributes.normal;
    for (let i = 0; i < p.count; i += 3) { V.fromBufferAttribute(p, i); N.fromBufferAttribute(nn, i); if (pick(V, N, L)) cand.push([sm, i]); } }
  if (!cand.length) return { tris: 0, n: 0 };
  for (let k = 0; k < n; k++) { const [sm, i] = cand[Math.floor(r() * cand.length)]; V.fromBufferAttribute(sm.geometry.attributes.position, i); N.fromBufferAttribute(sm.geometry.attributes.normal, i).normalize();
    const kk = sm.isSkinnedMesh ? 1 / K : 1, g = make(r).scale(kk, kk, kk), q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), N), spin = new THREE.Quaternion().setFromAxisAngle(N, r() * Math.PI * 2);
    g.applyMatrix4(new THREE.Matrix4().compose(V.clone().addScaledVector(N, lift * (sm.isSkinnedMesh ? 1 : K)), spin.multiply(q), new THREE.Vector3(1, 1, 1))); if (sm.isSkinnedMesh) g.applyMatrix4(skinMatrix(sm, i));
    // into the root's frame: the mesh's own transform (identity under root for people.js's meshes)
    g.applyMatrix4(sm.matrix); geos.push(g); }
  const merged = mergeGeos(geos), mesh = new THREE.Mesh(merged, mat); mesh.castShadow = mesh.receiveShadow = true; M.root.add(mesh); return { tris: Math.round(tris(merged)), n };
}
function mergeGeos(gs) { // position, normal, uv, color (optional) only
  const g = new THREE.BufferGeometry(), A = { position: [], normal: [], uv: [], color: [] }; let hasC = gs.some(x => x.attributes.color);
  for (const x of gs) { const y = x.index ? x.toNonIndexed() : x; for (const k of ['position', 'normal', 'uv']) A[k].push(...y.attributes[k].array); if (hasC) { const c = y.attributes.color; if (c) A.color.push(...c.array); else for (let i = 0; i < y.attributes.position.count; i++) A.color.push(1, 1, 1); } }
  g.setAttribute('position', new THREE.Float32BufferAttribute(A.position, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(A.normal, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(A.uv, 2)); if (hasC) g.setAttribute('color', new THREE.Float32BufferAttribute(A.color, 3)); return g;
}
// an ivy leaf: three-lobed, 4 to 7 cm, its own colour a little darker or lighter, bent along its midrib
function ivyTex() { return canvasTex(128, 128, (x, w, h) => { x.clearRect(0, 0, w, h); x.fillStyle = '#fff'; x.beginPath(); x.moveTo(64, 120); x.quadraticCurveTo(20, 100, 8, 64); x.quadraticCurveTo(30, 60, 36, 46);
  x.quadraticCurveTo(40, 14, 64, 6); x.quadraticCurveTo(88, 14, 92, 46); x.quadraticCurveTo(98, 60, 120, 64); x.quadraticCurveTo(108, 100, 64, 120); x.fill();
  x.strokeStyle = 'rgba(200,220,170,1)'; x.lineWidth = 2; x.globalCompositeOperation = 'source-atop'; for (const [a, b] of [[64, 10], [16, 62], [112, 62]]) { x.beginPath(); x.moveTo(64, 112); x.lineTo(a, b); x.stroke(); } }); }
const ivyLeaf = (dark, light) => r => { const s = .04 + r() * .03, g = new THREE.PlaneGeometry(s, s, 2, 1), p = g.attributes.position; for (let i = 0; i < p.count; i++) p.setZ(i, -Math.abs(p.getX(i)) * .35);
  g.computeVertexNormals(); const c = new THREE.Color().lerpColors(lin(dark), lin(light), r()); g.setAttribute('color', new THREE.Float32BufferAttribute(Array.from({ length: p.count }, () => [c.r, c.g, c.b]).flat(), 3)); return g; };
// a patch: a square of darker or lighter wool 9 to 15 cm, its stitches round it drawn in
function patchTex() { return canvasTex(64, 64, (x, w, h) => { x.fillStyle = '#fff'; x.fillRect(3, 3, w - 6, h - 6); x.strokeStyle = 'rgba(60,40,25,.9)'; x.setLineDash([4, 3]); x.lineWidth = 2; x.strokeRect(6, 6, w - 12, h - 12); }); }
const patch = cols => r => { const s = .09 + r() * .06, g = new THREE.PlaneGeometry(s, s * (.8 + r() * .4)); const c = lin(cols[Math.floor(r() * cols.length)]); g.setAttribute('color', new THREE.Float32BufferAttribute(Array.from({ length: 4 }, () => [c.r, c.g, c.b]).flat(), 3)); return g; };

// a small bird: the wren (10 cm, round, brown barred, its tail cocked straight up) or OG-054's bluebird (blue back, a rust breast)
export function bird(kind = 'wren') {
  const g = new THREE.Group(), wren = kind === 'wren', back = M_(wren ? [.36, .22, .12] : [.12, .26, .62], { r: .8 }), breast = M_(wren ? [.56, .42, .28] : [.62, .32, .14], { r: .8 }), beak = M_([.12, .1, .08], { r: .5 });
  const s = wren ? 1 : 1.35, body = new THREE.Mesh(new THREE.SphereGeometry(.03 * s, 12, 9), back); body.scale.set(.9, .85, 1.15); body.position.y = .032 * s; g.add(body);
  const bel = new THREE.Mesh(new THREE.SphereGeometry(.027 * s, 10, 8), breast); bel.scale.set(.85, .8, 1); bel.position.set(0, .026 * s, .008 * s); g.add(bel);
  const head = new THREE.Mesh(new THREE.SphereGeometry(.018 * s, 10, 8), back); head.position.set(0, .06 * s, .026 * s); g.add(head);
  const bk = new THREE.Mesh(new THREE.ConeGeometry(.004 * s, .016 * s, 6), beak); bk.rotation.x = Math.PI / 2; bk.position.set(0, .058 * s, .048 * s); g.add(bk);
  const eye = M_([.02, .02, .02], { r: .2 }); for (const sx of [1, -1]) { const e = new THREE.Mesh(new THREE.SphereGeometry(.0035 * s, 6, 4), eye); e.position.set(sx * .012 * s, .064 * s, .036 * s); g.add(e); }
  const tail = box(.022 * s, .045 * s, .005 * s, back); tail.position.set(0, .05 * s, -.035 * s); tail.rotation.x = wren ? -.25 : .9; g.add(tail);
  for (const sx of [1, -1]) { const l = cyl(.0015, .0015, .02, 4, beak); l.position.set(sx * .008, .004, 0); g.add(l); }
  return g;
}
// the root she sits on: a buttress root of the elm, 0.9 m long, its top at the seat's height, running back into the trunk
export function rootSeat(h, len = 1.6) {
  const g = new THREE.Group(), bark = M_([.42, .33, .24], { r: .95 }), geo = new THREE.CylinderGeometry(.2, .3, len, 12, 6, false); geo.rotateX(Math.PI / 2);
  const p = geo.attributes.position; for (let i = 0; i < p.count; i++) { const z = p.getZ(i), t = (z + len / 2) / len; p.setY(i, p.getY(i) * (1 + .4 * (1 - t)) + .1 * (1 - t) * (1 - t) + .02 * Math.sin(z * 9 + p.getX(i) * 20)); p.setX(i, p.getX(i) * (1.25 - .3 * t)); }
  geo.computeVertexNormals(); const m = new THREE.Mesh(geo, bark); m.position.set(0, h - .17, -len / 2 + .2); m.rotation.x = -.08; g.add(m); return g;
}
// shelf fungus and a few toadstools at the root's foot (c)
export function fungus(seed = 3) {
  const g = new THREE.Group(), r = rng(seed), shelf = M_([.74, .6, .42], { r: .7 }), cap = M_([.62, .2, .1], { r: .6 }), stem = M_([.86, .82, .72], { r: .8 });
  for (let i = 0; i < 6; i++) { const s = new THREE.Mesh(new THREE.SphereGeometry(.07 + r() * .05, 12, 6, 0, Math.PI * 2, 0, Math.PI / 2), shelf); s.scale.set(1, .25, .7); s.position.set((r() - .5) * .6, .1 + i * .06, -r() * .15); g.add(s); }
  for (let i = 0; i < 5; i++) { const x = (r() - .5) * .9, z = .1 + r() * .3, hh = .04 + r() * .05; const st = cyl(.008, .01, hh, 6, stem); st.position.set(x, hh / 2, z); g.add(st);
    const c = new THREE.Mesh(new THREE.SphereGeometry(.025 + r() * .015, 10, 6, 0, Math.PI * 2, 0, Math.PI / 2), cap); c.position.set(x, hh, z); g.add(c); }
  return g;
}

// the props on a made body, in the root's frame
export function strProps(M, G, level) {
  const o = G.own || {}, stats = {}; let n = 0;
  // seated: the wheeled chair the pose came with is taken away; she sits on the elm's root (the view sets it at the seat's height)
  if (G.dress.chair) { let seat = null; M.root.traverse(o2 => { if (o2.name === 'chair') { M.root.updateWorldMatrix(true, true); const b = new THREE.Box3(); o2.traverse(m => { if (m.isMesh && /Seat/.test(m.name)) b.expandByObject(m); }); seat = b; o2.visible = false; } });
    if (seat && !seat.isEmpty()) { const c = seat.getCenter(new THREE.Vector3()); stats.seatY = +seat.max.y.toFixed(3); stats.seatX = +c.x.toFixed(3); stats.seatZ = +c.z.toFixed(3); } }
  stats.rootScale = +M.root.scale.y.toFixed(3);
  // the lap: a grey wool blanket over her thighs and knees, falling to her ankles (the chair's pose takes skirts away; she keeps her knees warm)
  if (o.lap) { M.root.updateWorldMatrix(true, true); const J = n2 => M.root.worldToLocal(M.byName[n2].getWorldPosition(new THREE.Vector3()));
    const hL = J('upperleg01.L'), hR = J('upperleg01.R'), kL = J('lowerleg01.L'), kR = J('lowerleg01.R'), fL = J('foot.L'), fR = J('foot.R'), half = Math.abs(hL.x - hR.x) / 2 + .13, cx = (hL.x + hR.x) / 2;
    const prof = [[hL.y + .07, (hL.z + hR.z) / 2 - .02], [(hL.y + kL.y) / 2 + .085, (hL.z + kL.z) / 2 + .02], [kL.y + .075, kL.z + .06], [kL.y - .05, kL.z + .1], [(kL.y + fL.y) / 2, (kL.z + fL.z) / 2 + .1], [fL.y + .02, fL.z + .14]];
    const NX = 16, NY = 30, pos = [], uv = [], idx = [], at = t => { const f = t * (prof.length - 1), i = Math.min(prof.length - 2, Math.floor(f)), u = f - i; return [prof[i][0] + (prof[i + 1][0] - prof[i][0]) * u, prof[i][1] + (prof[i + 1][1] - prof[i][1]) * u]; };
    for (let j = 0; j <= NY; j++) for (let i = 0; i <= NX; i++) { const t = j / NY, u = i / NX * 2 - 1, [y, z] = at(t), sag = t > .3 ? .05 * (1 - Math.abs(u)) * Math.min(1, (t - .3) * 3) * (Math.cos(u * Math.PI * 3) * .5 + .5) : 0, fold = .012 * Math.sin(u * 11 + t * 5);
      pos.push(cx + u * (half + .04 * t), y - sag * .3, z - Math.abs(u) ** 3 * .1 * (t < .45 ? 1 : .3) + fold); uv.push(u * .5 + .5, t); }
    for (let j = 0; j < NY; j++) for (let i = 0; i < NX; i++) { const a = j * (NX + 1) + i; idx.push(a, a + NX + 1, a + 1, a + 1, a + NX + 1, a + NX + 2); }
    const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); geo.setIndex(idx); geo.computeVertexNormals();
    const lap = new THREE.Mesh(geo, M_(o.lap, { r: .95, ds: true })); lap.name = 'lap'; M.root.add(lap); n += tris(geo); stats.lap = true;
    if (o.lapIvy) { const mat = new THREE.MeshStandardMaterial({ map: ivyTex(), alphaTest: .5, vertexColors: true, roughness: .6, side: THREE.DoubleSide });
      const s = stuck(M, [lap], o.lapIvy, 29, (V, N) => true, ivyLeaf(level === 'c' ? [.08, .22, .05] : [.08, .2, .06], level === 'c' ? [.26, .5, .12] : [.22, .42, .12]), mat, .006); n += s.tris; } }
  if (o.mask) { const s = faceMask(M, o.mask); n += s.tris; stats.mask = s; }
  if (o.patches) { const robes = meshNamed(M, /^(robe|tunic|skirt|robeSkirt|sleeve)/); const s = stuck(M, robes.filter(m => m.isSkinnedMesh), o.patches, 11, (V, N, L) => V.y < L.sh - .06 / L.K && V.y > L.knee - .25 / L.K && Math.abs(N.y) < .6 && Math.abs(V.x) < L.shX * .95,
    patch([[.42, .36, .28], [.7, .64, .52], [.36, .3, .22], [.5, .3, .2]]), new THREE.MeshStandardMaterial({ map: patchTex(), vertexColors: true, roughness: .9, side: THREE.DoubleSide })); n += s.tris; stats.patches = s.n; stats.robeMeshes = robes.map(m => m.name); }
  if (o.ivy) { const cover = meshNamed(M, /^(mantle|cowl|hair|tunic|trousers)/).filter(m => m.isSkinnedMesh || m.geometry.attributes.skinIndex);
    const mat = new THREE.MeshStandardMaterial({ map: ivyTex(), alphaTest: .5, vertexColors: true, roughness: .6, side: THREE.DoubleSide });
    const dark = level === 'c' ? [.08, .22, .05] : [.08, .2, .06], light = level === 'c' ? [.26, .5, .12] : [.22, .42, .12];
    const s = stuck(M, cover.filter(m => m.isSkinnedMesh), o.ivy, 23, (V, N, L) => V.y > L.sh - .3 / L.K && V.y < L.neck + .04 / L.K && Math.abs(V.x) < L.shX * 1.1, ivyLeaf(dark, light), mat, .006); n += s.tris; stats.ivy = s.n; stats.ivyOn = cover.map(m => m.name); }
  // birds: the wren on the left shoulder, facing forward; c's three bluebirds on the shoulders and the lap
  if (o.wren || o.birds) { ready(M); const sm = bodyOf(M), p = sm.geometry.attributes.position, V = new THREE.Vector3(); let best = -1, by = -9; const spots = [];
    const Lm = landmarks(sm); for (const side of [1, -1]) { best = -1; by = -9; for (let i = 0; i < p.count; i++) { V.fromBufferAttribute(p, i); if (Math.abs(Math.abs(V.x) - Lm.shX * .8) < .03 / Lm.K && Math.sign(V.x) === side && Math.abs(V.z - bindPos(sm, 'upperarm01.L').z) < .05 / Lm.K && V.y > by) { by = V.y; best = i; } }
      if (best >= 0) { const W = new THREE.Vector3().fromBufferAttribute(p, best).applyMatrix4(skinMatrix(sm, best)).applyMatrix4(sm.matrix); spots.push(W); } }
    const list = o.birds ? [[0, 'blue', .4], [1, 'blue', -.5]] : [[0, 'wren', .3]];
    for (const [si, k, ry] of list) { if (!spots[si]) continue; const b = bird(k === 'wren' ? 'wren' : 'blue'); b.position.copy(spots[si]).add(new THREE.Vector3(0, .02, 0)); b.rotation.y = ry; M.root.add(b); }
    stats.birds = list.length; }
  if (o.twigs) { ready(M); const bark = M_([.28, .22, .16], { r: .95 }), sm = bodyOf(M), r = rng(7), g = new THREE.Group();
    const spine = new THREE.Vector3().setFromMatrixPosition(new THREE.Matrix4().copy(sm.skeleton.boneInverses[sm.skeleton.bones.findIndex(b => b.name === 'spine01')]).invert()).applyMatrix4(boneMatrix(sm, 'spine01'));
    const twig = (from, d, L, rad, depth) => { const to = from.clone().addScaledVector(d, L), c = cyl(rad, rad * .6, L, 5, bark); c.position.copy(from).lerp(to, .5); c.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), d); g.add(c);
      if (depth > 0) for (let k = 0; k < 2; k++) twig(to, d.clone().add(new THREE.Vector3((r() - .5) * .9, .3, (r() - .5) * .6)).normalize(), L * .65, rad * .6, depth - 1); };
    for (const s of [1, -1]) for (const [dx, dy, a] of [[.13, .3, .35], [.08, .34, .1], [.17, .24, .7]]) twig(spine.clone().add(new THREE.Vector3(s * dx, dy, -.11)), new THREE.Vector3(s * a, 1, -.5 - r() * .3).normalize(), .13 + r() * .05, .011, 3);
    g.traverse(m => { if (m.isMesh) n += tris(m.geometry); }); M.root.add(g); }
  if (o.brassHands) for (const m of meshNamed(M, /glove/i)) m.material = M_(BRASS, { r: .38, m: .85 });
  // the wheel at Fiontán's breast (c): a brass gear 9 cm across seen through a round opening in the robe, a smaller one beside it
  if (o.wheel) { ready(M); const sm = bodyOf(M), p = sm.geometry.attributes.position, V = new THREE.Vector3(); let best = -1, bz = -9;
    const Lw = landmarks(sm); for (let i = 0; i < p.count; i++) { V.fromBufferAttribute(p, i); if (Math.abs(V.x) < .03 / Lw.K && V.y > Lw.sh - .16 / Lw.K && V.y < Lw.sh - .1 / Lw.K && V.z > bz) { bz = V.z; best = i; } }
    if (best >= 0) { const W = new THREE.Vector3().fromBufferAttribute(p, best).applyMatrix4(skinMatrix(sm, best)).applyMatrix4(sm.matrix), gear = new THREE.Group(), br = M_(BRASS, { r: .35, m: .85 });
      const ring = new THREE.Mesh(new THREE.TorusGeometry(.065, .012, 8, 28), br); gear.add(ring);
      const shape = (R, teeth) => { const s = new THREE.Shape(); for (let i = 0; i <= teeth * 2; i++) { const t = i / (teeth * 2) * Math.PI * 2, rr = i % 2 ? R : R * .82; i ? s.lineTo(Math.cos(t) * rr, Math.sin(t) * rr) : s.moveTo(rr, 0); } const h = new THREE.Path(); h.absarc(0, 0, R * .25, 0, Math.PI * 2, true); s.holes.push(h); return s; };
      const g1 = new THREE.Mesh(new THREE.ExtrudeGeometry(shape(.045, 14), { depth: .006, bevelEnabled: false }), br); g1.rotation.z = .2; gear.add(g1);
      const g2 = new THREE.Mesh(new THREE.ExtrudeGeometry(shape(.022, 8), { depth: .006, bevelEnabled: false }), M_([.5, .36, .16], { r: .4, m: .85 })); g2.position.set(.042, .028, .004); gear.add(g2);
      const back = new THREE.Mesh(new THREE.CircleGeometry(.062, 24), M_([.05, .04, .03])); back.position.z = -.004; gear.add(back);
      gear.position.copy(W).add(new THREE.Vector3(0, 0, .012)); gear.rotation.x = -.12; M.root.add(gear); gear.traverse(m => { if (m.isMesh) n += tris(m.geometry); }); } }
  // the ledger strapped to the creel's side: 24 × 17 × 5 cm, a dark leather binding, two straps
  if (o.ledger) { M.root.updateMatrixWorld(true); const pk = meshNamed(M, /pack|creel|backpack/i); const b = new THREE.Box3(); for (const m of pk) b.expandByObject(m);
    if (!b.isEmpty()) { const lo = M.root.worldToLocal(b.min.clone()), hi = M.root.worldToLocal(b.max.clone()), L = new THREE.Group(), lea = M_([.26, .12, .07], { r: .6 }), pg = M_([.82, .76, .6], { r: .9 });
      const cover = box(.05, .24, .17, lea); L.add(cover); const pages = box(.04, .23, .16, pg); pages.position.x = .004; L.add(pages);
      for (const y of [-.06, .06]) { const st = box(.056, .018, .176, M_(LEATHER, { r: .7 })); st.position.y = y; L.add(st); }
      L.position.set(Math.min(lo.x, hi.x) - .02, (lo.y + hi.y) / 2 - .04, (lo.z + hi.z) / 2); L.rotation.z = .05; M.root.add(L); L.traverse(m => { if (m.isMesh) n += tris(m.geometry); }); stats.pack = pk.map(m => m.name); } }
  M.root.traverse(m => { if (m.isMesh && !m.isSkinnedMesh) { m.castShadow = true; m.receiveShadow = true; } });
  return { tris: Math.round(n), ...stats };
}

// ── the Merchant's stall: a folding counter of dark wood 1.7 × 0.62 m, its top at 0.92 m, four posts (2.25 m behind, 2.05 in front)
// carrying an awning of striped canvas (cream and madder, 0.2 m stripes) with a scalloped valance, a brass lamp lit hanging from the
// front beam. On the counter what the player has sold (a sword, a ring on a cushion, three bottles, a folded cloth, a small chest); at c
// the impossible goods besides (three orbs that hang in the air over the counter, a jar of light, an hourglass running upward).
export function veiledStall(level = 'b') {
  const g = new THREE.Group(), wood = M_(level === 'a' ? [.34, .25, .16] : DARKWOOD, { r: .6 }), brass = M_(BRASS, { r: .35, m: .85 }), W = 1.7, D = .62, H = .92;
  { const top = box(W, .05, D, wood); top.position.set(0, H - .025, 0); g.add(top); }
  const front = box(W, .7, .03, wood); front.position.set(0, H - .4, D / 2 - .015); g.add(front);
  for (const s of [-1, 1]) { const side = box(.03, .7, D, wood); side.position.set(s * (W / 2 - .015), H - .4, 0); g.add(side); }
  const posts = [[-1, 1, 2.05], [1, 1, 2.05], [-1, -1, 2.25], [1, -1, 2.25]];
  for (const [sx, sz, h] of posts) { const p = box(.05, h, .05, wood); p.position.set(sx * (W / 2 + .02), h / 2, sz * (D / 2 + .1)); g.add(p); }
  const beam = box(W + .1, .06, .06, wood); beam.position.set(0, 2.05, D / 2 + .1); g.add(beam);
  const plain = level === 'a', stripes = canvasTex(512, 128, (x, w, h) => { for (let i = 0; i < 9; i++) { x.fillStyle = plain ? (i % 2 ? '#c8bea6' : '#b8ad94') : (i % 2 ? '#e8dcc0' : '#8a2a1a'); x.fillRect(i * w / 9, 0, w / 9 + 1, h); } });
  stripes.wrapS = THREE.RepeatWrapping; const canvas = M_([1, 1, 1], { map: stripes, r: .85, ds: true });
  const aw = new THREE.PlaneGeometry(W + .3, D + .5, 1, 4), ap = aw.attributes.position; for (let i = 0; i < ap.count; i++) { const y = ap.getY(i); ap.setZ(i, -.03 * Math.cos(y * 4)); } aw.computeVertexNormals();
  const awn = new THREE.Mesh(aw, canvas); awn.rotation.x = -Math.PI / 2 + Math.atan2(.2, D + .2); awn.position.set(0, 2.17, .02); g.add(awn);
  if (!plain) { const val = new THREE.PlaneGeometry(W + .3, .2, 24, 2), vp = val.attributes.position; for (let i = 0; i < vp.count; i++) { const x = vp.getX(i), y = vp.getY(i); if (y < 0) vp.setY(i, y + .08 * Math.abs(Math.sin(x / (W + .3) * Math.PI * 9))); }
    const v = new THREE.Mesh(val, canvas); v.position.set(0, 1.98, D / 2 + .41); g.add(v); }
  // the lamp: plain iron at a, brass from b
  const lan = cageLantern({ metal: plain ? 'iron' : 'brass', hang: true, h: .28, r: .08, li: 1.4 }); lan.position.set(.45, 2.02, D / 2 + .1); g.add(lan);
  // the goods
  const blade = M_([.7, .72, .75], { r: .25, m: .9 }), sword = new THREE.Group(), put = (o, x, rz = 0) => { o.position.x = x; o.rotation.z = rz; sword.add(o); };
  put(box(.75, .006, .045, blade), .2); put(box(.03, .02, .17, brass), -.19); put(cyl(.014, .014, .14, 8, M_(LEATHER)), -.28, Math.PI / 2);
  sword.position.set(-.35, H + .012, .1); sword.rotation.y = .12; g.add(sword);
  const cush = box(.14, .04, .14, M_([.4, .08, .1], { r: .9 })); cush.position.set(.25, H + .02, .14); g.add(cush);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(.016, .004, 8, 20), M_(GOLD, { r: .25, m: .95 })); ring.position.set(.25, H + .056, .14); g.add(ring);
  for (let i = 0; i < 3; i++) { const b = cyl(.035, .03, .16 + i * .03, 10, M_([[.1, .3, .18], [.35, .12, .08], [.2, .18, .3]][i], { r: .15, m: .1 })); b.position.set(.48 + i * .09, H + .08 + i * .015, -.12); g.add(b); }
  const chest = box(.24, .14, .16, M_([.3, .18, .1], { r: .7 })); chest.position.set(-.55, H + .07, -.15); g.add(chest);
  const cloth = box(.3, .05, .22, M_([.2, .3, .5], { r: .95 })); cloth.position.set(.0, H + .025, -.15); g.add(cloth);
  if (level === 'c') { // the impossible goods
    for (const [x, y, z, c] of [[-.2, 1.35, 0, [.4, .7, 1]], [.15, 1.5, -.05, [1, .6, .3]], [.5, 1.3, .05, [.7, .4, 1]]]) { const o = new THREE.Mesh(new THREE.SphereGeometry(.05, 16, 12), M_(c, { e: c, ei: 2.2, r: .2 })); o.position.set(x, y, z); g.add(o);
      const l = new THREE.PointLight(lin(c), .25, 2.5, 2); l.position.copy(o.position); g.add(l); }
    const jar = cyl(.06, .06, .18, 16, M_([.9, .95, 1], { r: .05, tr: true, op: .35, dw: false })); jar.position.set(-.75, H + .09, .1); g.add(jar);
    const lightIn = new THREE.Mesh(new THREE.SphereGeometry(.035, 12, 8), M_([1, .95, .7], { e: [1, .9, .55], ei: 4 })); lightIn.position.set(-.75, H + .09, .1); g.add(lightIn);
    const hg = new THREE.Group(); for (const s of [1, -1]) { const c = new THREE.Mesh(new THREE.ConeGeometry(.04, .08, 12, 1, true), M_([.9, .95, 1], { r: .05, tr: true, op: .3, dw: false, ds: true })); c.rotation.x = s > 0 ? Math.PI : 0; c.position.y = s * .04; hg.add(c);
      const plate = cyl(.05, .05, .01, 12, wood); plate.position.y = s * .085; hg.add(plate); }
    const sand = new THREE.Mesh(new THREE.ConeGeometry(.032, .045, 12), M_([.86, .7, .4], { r: .9 })); sand.position.y = .055; hg.add(sand); // the sand is in the upper glass
    hg.position.set(.7, H + .09, .14); g.add(hg); }
  let n = 0; g.traverse(o => { if (o.isMesh) { o.castShadow = o.receiveShadow = true; n += tris(o.geometry); } }); g.userData.tris = Math.round(n); return g;
}

// ── the Painted Woman at c: a portrait 0.62 × 0.82 m in a gilt frame on a painter's easel 1.75 m tall; a woman half-length against a
// dark ground, painted loosely, whose face is left soft and whose eyes are painted with care and lit (an emissive map, faint)
export function portrait() {
  const g = new THREE.Group(), wood = M_([.36, .26, .16], { r: .8 }), gilt = M_(GOLD, { r: .3, m: .85 });
  for (const s of [-1, 1]) { const leg = box(.04, 1.8, .03, wood); leg.position.set(s * .32, .88, 0); leg.rotation.z = s * .1; g.add(leg); }
  const bl = box(.04, 1.75, .03, wood); bl.position.set(0, .85, -.4); bl.rotation.x = .25; g.add(bl);
  const ledge = box(.74, .04, .08, wood); ledge.position.set(0, .82, .04); g.add(ledge);
  const paint = canvasTex(372, 492, (x, w, h) => { const bg = x.createRadialGradient(w * .5, h * .35, 20, w * .5, h * .45, h * .7); bg.addColorStop(0, '#4a3a28'); bg.addColorStop(1, '#14100c'); x.fillStyle = bg; x.fillRect(0, 0, w, h);
    x.fillStyle = '#2a3442'; x.beginPath(); x.moveTo(w * .12, h); x.quadraticCurveTo(w * .2, h * .58, w * .5, h * .55); x.quadraticCurveTo(w * .8, h * .58, w * .88, h); x.fill();
    x.fillStyle = '#3a2a1e'; x.beginPath(); x.ellipse(w * .5, h * .34, w * .2, h * .2, 0, 0, Math.PI * 2); x.fill();
    x.fillStyle = '#c8a488'; x.beginPath(); x.ellipse(w * .5, h * .37, w * .13, h * .15, 0, 0, Math.PI * 2); x.fill();
    x.fillStyle = 'rgba(120,80,60,.35)'; x.fillRect(w * .47, h * .37, w * .06, h * .07);
    for (const s of [-1, 1]) { x.fillStyle = '#e8e2d8'; x.beginPath(); x.ellipse(w * (.5 + s * .055), h * .345, w * .03, h * .012, 0, 0, Math.PI * 2); x.fill(); x.fillStyle = '#5a7a8a'; x.beginPath(); x.arc(w * (.5 + s * .055), h * .345, w * .012, 0, Math.PI * 2); x.fill(); }
    const r = rng(9); x.globalAlpha = .08; for (let i = 0; i < 500; i++) { x.fillStyle = r() < .5 ? '#000' : '#fff'; x.fillRect(r() * w, r() * h, 6 + r() * 10, 2); } x.globalAlpha = 1; });
  const eyes = canvasTex(372, 492, (x, w, h) => { x.fillStyle = '#000'; x.fillRect(0, 0, w, h); for (const s of [-1, 1]) { x.fillStyle = '#8ab0c0'; x.beginPath(); x.arc(w * (.5 + s * .055), h * .345, w * .014, 0, Math.PI * 2); x.fill(); } });
  const cv = new THREE.Mesh(new THREE.PlaneGeometry(.62, .82), new THREE.MeshStandardMaterial({ map: paint, emissive: 0xffffff, emissiveMap: eyes, emissiveIntensity: .8, roughness: .7 })); cv.position.set(0, 1.27, .065); cv.rotation.x = -.08; g.add(cv);
  for (const [w, h, x, y] of [[.72, .05, 0, .43], [.72, .05, 0, -.43], [.05, .9, .335, 0], [.05, .9, -.335, 0]]) { const f = box(w, h, .035, gilt); f.position.set(x, 1.27 + y * Math.cos(.08), .065 - y * Math.sin(.08)); f.rotation.x = -.08; g.add(f); }
  let n = 0; g.traverse(o => { if (o.isMesh) { o.castShadow = o.receiveShadow = true; n += tris(o.geometry); } }); g.userData.tris = Math.round(n); return g;
}

// the helpers, for the second run's kit (strange2.js, 23 Nov 2026)
export { stuck, patch, patchTex, skinMatrix, boneMatrix, bodyOf, meshNamed, ready, kOf, bindPos, landmarks, M_, lin, canvasTex, rng, mergeGeos, ivyTex, ivyLeaf };
