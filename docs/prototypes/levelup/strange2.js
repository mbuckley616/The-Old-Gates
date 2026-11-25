// The strange and the legendary, II (the concept artist, 23 Nov 2026; backlog L2, "The strange and the legendary", OG-071's sheet E4,
// *five unusual souls*; the quest writer's *The Strange and the Legendary, II*, drafted 23 Nov, unapproved): the rest of OG-071 after
// Branwen (the first run's Bláthnat). Michael's C on #1911 (22 Nov: the strange as OG-054 draws them) carries over, so the four are dressed
// as OG-071 draws them, with the draft's fixes where the canon fixes them (no oracle in the fool; Elias olive-brown; Orvin renamed Ordwin):
//   Tomcán, the fool (Gatelander, 1.74 m, wiry, red-haired): a patchwork coat and hood in madder, woad and undyed wool, three bells on the
//     hood, the raven Fiach Dubh (the Dean) on his left shoulder, a painted wooden mask with a smile at his belt, sat on the step at a gate's
//     mouth with his battered hat upturned on the flags for the coins;
//   Nell Dammer (Markman, 1.72 m, broad): ash-blond hair tied back, a fleece jerkin over a linen shirt, her sleeves rolled on forearms scarred
//     by teeth and claws, a satchel of salves;
//   Elias Nikandros, the collector (Aurennais, 1.78 m, lean, olive-brown): close-cut hair going grey, brass goggles pushed up on his brow, a
//     long coat hung with keys, buttons, a child's whistle and a broken compass, a frame pack piled high with bundles, a brass armillary
//     sphere in his hand;
//   Ordwin, called Ord, the ferryman (Markman, 1.88 m, old): a broad felt hat, a short clay pipe, his punt pole; the punt at the bank with a
//     lantern on a pole at its bow, and Stilts, a grey heron, in the shallows by it.
//
// The question is Stump, Nell's beast: a dammer, a river beast of the Mark's black moor that fells alder and dams the becks, tusked for the
// bark, six-legged (canon §14: some ordinary animals have six legs and nobody remarks on it), as big as a cart, gentle. The draft keeps him
// in the river "until the creature kit has one". Three levels:
//   a  in the river, unseen: the rings and the wake where he went under, the dam of gnawed alder and the stumps on the bank; Nell says so;
//   b  at the bank, half out (recommended): his back, his walrus's face and the two downturned tusks above the water, his forefeet on the
//      shallows, the rest under the river; no gait needed, the kit's stand;
//   c  on the bank, whole, as OG-071 draws him beside her: the six legs, the flat tail, the wet brown coat, at Nell's side on the grass.
// WANDER[key] is the sheet; wGenome(key, P) the genome (P as strange.js's: rollGenome, heightFor, GARMENTS, DRESS_FLAGS); wProps(M, G,
// beast) adds what people.js does not have and returns its triangles; dammerPlan() puts the dammer's body plan into creatures.js's PLANS;
// gateMouth(seatY), punt(), heron(), wareWall(), dam(), ripples(), upturnedHat() are the set pieces, each in its own frame, in metres.
import * as THREE from 'three';
import { cageLantern, smilingMask } from './faith.js';
import { stuck, patch, patchTex, skinMatrix, bodyOf, meshNamed, ready, kOf, landmarks, M_, lin, canvasTex, rng, mergeGeos } from './strange.js';
import { PLANS } from './creatures.js';

const MADDER = [.5, .14, .08], WOAD = [.14, .2, .42], UNDYED = [.6, .55, .44], BRASS = [.62, .46, .2], IRON = [.22, .22, .23], LEATHER = [.26, .17, .1];
const tris = g => (g.index ? g.index.count : g.attributes.position.count) / 3;
const cyl = (r0, r1, L, n, m) => new THREE.Mesh(new THREE.CylinderGeometry(r1, r0, L, n), m);
const box = (w, h, d, m) => new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m);
const countTris = g => { let n = 0; g.traverse(o => { if (o.isMesh) n += tris(o.geometry); }); return Math.round(n); };
const shade = g => { g.traverse(o => { if (o.isMesh) o.castShadow = o.receiveShadow = true; }); return g; };

export const WANDER = {
  tomcan: { label: 'Tomcán, the fool', people: 'gatelander', g: 1, age: .4, muscle: .38, weight: .08, metres: 1.74, seated: true,
    hairCol: [.46, .15, .05], hair: { style: 'short', len: .55 }, beard: .12,
    dress: { tunic: [.56, .42, .28], trousers: WOAD, boots: [.22, .15, .1], belt: LEATHER, cowl: MADDER },
    own: { patches: 46, bells: 3, raven: true, mask: true } },
  nell: { label: 'Nell Dammer', people: 'markman', g: 0, age: .42, muscle: .72, weight: .5, metres: 1.72,
    hairCol: [.6, .54, .4], hair: { style: 'tail', len: .55 },
    dress: { tunic: [.66, .62, .52], waistcoat: [.76, .7, .58], waistcoatLeather: false, sleevesRolled: true, trousers: [.3, .26, .2], boots: [.2, .14, .1], belt: LEATHER, satchel: [.36, .24, .14], skirt: 'short' },
    own: { scars: 22 } },
  elias: { label: 'Elias Nikandros, the collector', people: 'aurennais', g: 1, age: .6, muscle: .35, weight: .1, metres: 1.78, skin: [.42, .27, .17],
    hairCol: [.2, .19, .18], hair: { style: 'short', len: .25 },
    dress: { coat: [.3, .22, .15], coatLen: 1, coatOpen: true, tunic: [.62, .56, .44], trousers: [.32, .28, .22], boots: [.24, .16, .1], belt: LEATHER,
      backpack: [.36, .26, .16], backpackKind: 'frame', lantern: [.3, .3, .3] },
    own: { goggles: true, trinkets: 30, bundles: true, armillary: true } },
  ord: { label: 'Ordwin, called Ord, the ferryman', people: 'markman', g: 1, age: .86, muscle: .5, weight: .22, metres: 1.88,
    hairCol: [.74, .73, .7], hair: { style: 'short', len: .45 }, beard: .55,
    dress: { coat: [.34, .34, .31], coatLen: .85, tunic: [.5, .47, .4], trousers: [.3, .28, .24], boots: [.18, .13, .1], belt: LEATHER,
      hat: [.27, .23, .18], hatKind: 'felt', pipe: [.86, .82, .74], staff: [.42, .34, .24], staffMake: 'hazel' },
    own: { pole: 3.9, brim: 1.4 } } };
export const ORDER = ['tomcan', 'nell', 'ord', 'elias'];

export function wGenome(key, P) {
  const S = WANDER[key], G = P.rollGenome('strange:' + key, { people: S.people, g: S.g });
  for (const k of ['age', 'muscle', 'weight', 'hairCol', 'skin']) if (S[k] != null) G[k] = Array.isArray(S[k]) ? S[k].slice() : S[k];
  G.hair = { ...S.hair }; G.pose = { ...(G.pose || {}), stoop: key === 'ord' ? .08 : 0 }; G.beard = S.beard || 0; G.scar = null; G.marks = null;
  G.dress = { ...Object.fromEntries(P.GARMENTS.map(k => [k, null])), ...P.DRESS_FLAGS, skirt: S.g ? 'short' : 'long', ...S.dress, ...(S.seated ? { chair: [.3, .22, .14] } : {}) };
  G.height = P.heightFor(G, S.metres); G.wander = key; G.own = { ...S.own }; return G;
}

// a skinned vertex as posed, in the root's frame
const posed = (sm, i, V = new THREE.Vector3()) => V.fromBufferAttribute(sm.geometry.attributes.position, i).applyMatrix4(skinMatrix(sm, i)).applyMatrix4(sm.matrix);
const J = (M, n) => { M.root.updateWorldMatrix(true, true); return M.root.worldToLocal(M.byName[n].getWorldPosition(new THREE.Vector3())); };

// a trinket for Elias's coat: a key, a button, a whistle, a compass (broken: its glass cracked, the needle loose), each 2 to 7 cm, in its
// own frame facing +z, coloured by vertex so the lot is one mesh
function trinket(r) {
  const k = Math.floor(r() * 4), col = [[.78, .6, .28], [.4, .4, .42], [.82, .78, .66], [.5, .34, .18]][k === 0 ? (r() < .5 ? 0 : 1) : k === 1 ? Math.floor(r() * 4) : k === 2 ? 2 : 0];
  const parts = [], C = lin(col), paint = g => { const n = g.attributes.position.count; g.setAttribute('color', new THREE.Float32BufferAttribute(Array.from({ length: n }, () => [C.r, C.g, C.b]).flat(), 3)); return g; };
  if (k === 0) { parts.push(paint(new THREE.TorusGeometry(.011, .0025, 5, 10).translate(0, .028, 0)), paint(new THREE.BoxGeometry(.005, .045, .004)), paint(new THREE.BoxGeometry(.012, .008, .004).translate(.006, -.016, 0))); }
  else if (k === 1) parts.push(paint(new THREE.CylinderGeometry(.011, .011, .005, 10).rotateX(Math.PI / 2)));
  else if (k === 2) parts.push(paint(new THREE.CylinderGeometry(.006, .007, .06, 8).rotateZ(.3)));
  else { parts.push(paint(new THREE.CylinderGeometry(.022, .022, .008, 14).rotateX(Math.PI / 2))); const g = new THREE.CylinderGeometry(.018, .018, .002, 14).rotateX(Math.PI / 2).translate(0, 0, .005); const W = lin([.86, .84, .76]); g.setAttribute('color', new THREE.Float32BufferAttribute(Array.from({ length: g.attributes.position.count }, () => [W.r, W.g, W.b]).flat(), 3)); parts.push(g); }
  // a thong (a short leather loop) from which it hangs
  const T = lin(LEATHER), th = new THREE.CylinderGeometry(.0015, .0015, .03, 4).translate(0, .045, 0); th.setAttribute('color', new THREE.Float32BufferAttribute(Array.from({ length: th.attributes.position.count }, () => [T.r, T.g, T.b]).flat(), 3)); parts.push(th);
  return mergeGeos(parts.map(g => g.index ? g.toNonIndexed() : g));
}
// a healed scar: a pale welt 2 to 7 cm long, 2 to 4 mm wide, sometimes three in a row (claws)
const scarCard = r => { const L = .02 + r() * .05, w = .002 + r() * .002, three = r() < .4, gs = []; for (let k = 0; k < (three ? 3 : 1); k++) gs.push(new THREE.PlaneGeometry(w, L).translate(k * .008, 0, 0));
  const g = mergeGeos(gs), C = lin([.62, .44, .38]); g.setAttribute('color', new THREE.Float32BufferAttribute(Array.from({ length: g.attributes.position.count }, () => [C.r, C.g, C.b]).flat(), 3)); return g; };

// the armillary: a brass sphere 18 cm across of three great rings and the ecliptic's band, a small sun at its heart, on a short stem
export function armillary() {
  const g = new THREE.Group(), br = M_(BRASS, { r: .3, m: .9 }), R = .09;
  for (const [x, y, z] of [[0, 0, 0], [Math.PI / 2, 0, 0], [0, Math.PI / 2, 0]]) { const t = new THREE.Mesh(new THREE.TorusGeometry(R, .0035, 6, 40), br); t.rotation.set(x, y, z); g.add(t); }
  const ec = new THREE.Mesh(new THREE.TorusGeometry(R * .97, .006, 4, 40), br); ec.rotation.set(Math.PI / 2 - .41, 0, 0); ec.scale.z = 2.2; g.add(ec);
  const ax = cyl(.002, .002, R * 2.4, 5, br); ax.rotation.z = .41; g.add(ax);
  const sun = new THREE.Mesh(new THREE.SphereGeometry(.018, 12, 8), M_([.9, .7, .3], { r: .3, m: .7, e: [.3, .2, .05] })); g.add(sun);
  const stem = cyl(.006, .01, .09, 8, br); stem.position.y = -R - .045; g.add(stem); const foot = cyl(.025, .03, .012, 12, br); foot.position.y = -R - .09; g.add(foot);
  return shade(g);
}
// brass goggles: two cups 4.4 cm across with green-grey glass, a bridge and a leather strap round the head (rx, rz its half-widths)
function goggles(rx, rz) {
  const g = new THREE.Group(), br = M_(BRASS, { r: .32, m: .88 }), gl = M_([.3, .4, .36], { r: .05, m: .3 }), lea = M_(LEATHER, { r: .8 });
  for (const s of [-1, 1]) { const cup = cyl(.022, .02, .022, 14, br); cup.rotation.x = Math.PI / 2; cup.position.set(s * .033, 0, .011); g.add(cup);
    const lens = new THREE.Mesh(new THREE.CircleGeometry(.017, 14), gl); lens.position.set(s * .033, 0, .023); g.add(lens);
    const rim = new THREE.Mesh(new THREE.TorusGeometry(.0185, .0025, 5, 16), br); rim.position.set(s * .033, 0, .023); g.add(rim); }
  const bridge = box(.02, .005, .006, br); bridge.position.set(0, 0, .012); g.add(bridge);
  const strap = new THREE.Mesh(new THREE.TorusGeometry(1, .008, 4, 40), lea); strap.rotation.x = Math.PI / 2; strap.scale.set(rx, rz, 1.4); strap.position.z = -rz + .004; g.add(strap);
  return shade(g);
}
// the bells on Tomcán's hood: brass, 2.6 cm, a slot across the bottom
function bell() { const g = new THREE.Group(), br = M_([.72, .56, .22], { r: .28, m: .9 }); const s = new THREE.Mesh(new THREE.SphereGeometry(.013, 12, 9), br); g.add(s);
  const slot = box(.02, .002, .004, M_([.05, .04, .03])); slot.position.y = -.007; g.add(slot); const ring = new THREE.Mesh(new THREE.TorusGeometry(.004, .0012, 4, 8), br); ring.position.y = .015; g.add(ring); return g; }
// a bundle on the pack: a roll in a strap (a blanket, a hide, papers in oilcloth) or a tied parcel
function bundles(r) {
  const g = new THREE.Group(), cols = [[.5, .42, .3], [.3, .34, .26], [.6, .5, .38], [.42, .3, .2], [.55, .52, .46], [.36, .2, .14]], strap = M_(LEATHER, { r: .7 });
  let y = 0; for (let i = 0; i < 6; i++) { const roll = r() < .55, c = M_(cols[i % cols.length], { r: .9 });
    if (roll) { const L = .36 + r() * .16, rad = .06 + r() * .035, m = cyl(rad, rad, L, 12, c); m.rotation.z = Math.PI / 2; m.position.set((r() - .5) * .06, y + rad, (r() - .5) * .04); m.rotation.y = (r() - .5) * .3; g.add(m);
      for (const s of [-.3, .3]) { const t = new THREE.Mesh(new THREE.TorusGeometry(rad + .003, .006, 4, 14), strap); t.rotation.y = Math.PI / 2; t.position.set(m.position.x + s * L, y + rad, m.position.z); g.add(t); } y += rad * 1.7; }
    else { const w = .24 + r() * .14, h = .08 + r() * .07, d = .16 + r() * .08, m = box(w, h, d, c); m.position.set((r() - .5) * .08, y + h / 2, (r() - .5) * .05); m.rotation.y = (r() - .5) * .5; g.add(m);
      const cord = box(w + .006, h + .006, .008, M_([.7, .62, .44], { r: .9 })); cord.position.copy(m.position); cord.rotation.y = m.rotation.y; g.add(cord); y += h * .92; } }
  // a kettle and a lantern hung off the side, a rolled map case on top
  const kettle = new THREE.Mesh(new THREE.SphereGeometry(.07, 12, 8), M_([.18, .17, .16], { r: .5, m: .6 })); kettle.scale.y = .8; kettle.position.set(.22, y * .4, 0); g.add(kettle);
  const tube = cyl(.035, .035, .55, 10, M_([.3, .18, .1], { r: .6 })); tube.rotation.z = Math.PI / 2 + .2; tube.position.set(0, y + .04, 0); g.add(tube);
  return shade(g);
}

// the props on a made body, in the root's frame; `raven` is the creature kit's raven, built by the view (build('raven')), or null
export function wProps(M, G, o = {}) {
  const own = G.own || {}, st = {}; let n = 0;
  // seated: the chair the pose came with is hidden; he sits on the gate's step (the view lays it at the seat's height)
  if (G.dress.chair) { let seat = null; M.root.traverse(c => { if (c.name === 'chair') { M.root.updateWorldMatrix(true, true); const b = new THREE.Box3(); c.traverse(m => { if (m.isMesh && /Seat/.test(m.name)) b.expandByObject(m); }); seat = b; c.visible = false; } });
    if (seat && !seat.isEmpty()) { const c = seat.getCenter(new THREE.Vector3()); st.seatY = +seat.max.y.toFixed(3); st.seatX = +c.x.toFixed(3); st.seatZ = +c.z.toFixed(3); } }
  const sm = bodyOf(M); ready(M); const L = landmarks(sm), K = L.K;
  // Tomcán's motley: patches of madder, woad and undyed wool over the coat and the hood
  if (own.patches) { const coat = meshNamed(M, /coat|tunic|sleeve/i).filter(m => m.isSkinnedMesh); st.coatMeshes = coat.map(m => m.name);
    const s = stuck(M, coat, own.patches, 41, (V, N, Lm) => V.y < Lm.sh - .03 / Lm.K && V.y > Lm.hip - .12 / Lm.K && Math.abs(N.y) < .7 && Math.abs(V.x) < Lm.shX * .92,
      patch([MADDER, WOAD, UNDYED, [.62, .2, .1], [.2, .28, .5], [.72, .66, .52]]), new THREE.MeshStandardMaterial({ map: patchTex(), vertexColors: true, roughness: .9, side: THREE.DoubleSide }), .005); n += s.tris; st.patches = s.n; }
  const hood = meshNamed(M, /hood|cowl/i).filter(m => m.isSkinnedMesh); st.hoodMeshes = hood.map(m => m.name);
  if (own.hoodPatches && hood.length) { const s = stuck(M, hood, own.hoodPatches, 43, () => true, patch([WOAD, UNDYED, [.2, .28, .5]]), new THREE.MeshStandardMaterial({ map: patchTex(), vertexColors: true, roughness: .9, side: THREE.DoubleSide }), .005); n += s.tris; }
  // three bells: at the hood's peak behind the crown and at its two front corners by the cheeks
  if (own.bells && hood.length) { const h = hood[0], P = []; for (let i = 0; i < h.geometry.attributes.position.count; i += 3) P.push(posed(h, i));
    const peak = P.reduce((a, b) => (b.y - b.z * .6 > a.y - a.z * .6 ? b : a)), lo = P.filter(p => p.z > J(M, 'head').z - .02).sort((a, b) => a.y - b.y).slice(0, 60);
    const left = lo.reduce((a, b) => (b.x > a.x ? b : a)), right = lo.reduce((a, b) => (b.x < a.x ? b : a));
    for (const p of [peak, left, right]) { const b = bell(); b.position.copy(p).add(new THREE.Vector3(0, -.016, 0)); M.root.add(b); n += countTris(b); } st.bells = 3; }
  // the painted mask hung at the belt, on the right hip, its smile out
  if (own.mask) { const m = smilingMask([.92, .84, .7]); const hip = J(M, 'upperleg01.R'), sp = J(M, 'spine05'); m.position.set(hip.x - .16, sp.y + .02, hip.z + .06); m.rotation.y = -.5; m.scale.setScalar(.85); M.root.add(shade(m)); n += countTris(m); st.mask = true; }
  // the raven on the left shoulder
  if (own.raven && o.raven) { const p = sm.geometry.attributes.position; let best = -1, by = -9; const V = new THREE.Vector3();
    for (let i = 0; i < p.count; i++) { V.fromBufferAttribute(p, i); if (V.x > 0 && Math.abs(V.x - L.shX * .75) < .03 / K && V.y > by && V.y < L.neck + .05 / K) { by = V.y; best = i; } }
    const at = best >= 0 ? posed(sm, best) : J(M, 'upperarm01.L'); o.raven.root.position.copy(at).add(new THREE.Vector3(0, .07, 0)); o.raven.root.rotation.y = .5; M.root.add(o.raven.root); st.raven = true; }
  // Nell's scars: on the forearm's skin (rolled sleeves), the vertices whose heaviest bone is a forearm's
  if (own.scars) { const si = sm.geometry.attributes.skinIndex, sw = sm.geometry.attributes.skinWeight, names = sm.skeleton.bones.map(b => b.name), fore = new Set(names.map((nm, i) => /^lowerarm/.test(nm) ? i : -1).filter(i => i >= 0));
    const keep = new Set(); for (let i = 0; i < si.count; i++) { let bi = 0, bw = -1; for (let k = 0; k < 4; k++) if (sw.getComponent(i, k) > bw) { bw = sw.getComponent(i, k); bi = si.getComponent(i, k); } if (fore.has(bi)) keep.add(i); }
    // stuck() picks by place; the forearm is picked by bone, so the cards are laid here as stuck() lays them
    const r = rng(53), cand = [...keep].filter((_, k) => k % 2 === 0), geos = [], N = new THREE.Vector3(), V = new THREE.Vector3(); sm.geometry.attributes.normal || sm.geometry.computeVertexNormals();
    for (let k = 0; k < own.scars && cand.length; k++) { const i = cand[Math.floor(r() * cand.length)]; V.fromBufferAttribute(sm.geometry.attributes.position, i); N.fromBufferAttribute(sm.geometry.attributes.normal, i).normalize();
      const g = scarCard(r).scale(1 / K, 1 / K, 1 / K), q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), N), spin = new THREE.Quaternion().setFromAxisAngle(N, r() * Math.PI);
      g.applyMatrix4(new THREE.Matrix4().compose(V.clone().addScaledVector(N, .0012 / K), spin.multiply(q), new THREE.Vector3(1, 1, 1))); g.applyMatrix4(skinMatrix(sm, i)); g.applyMatrix4(sm.matrix); geos.push(g); }
    if (geos.length) { const mesh = new THREE.Mesh(mergeGeos(geos), new THREE.MeshStandardMaterial({ vertexColors: true, roughness: .5, side: THREE.DoubleSide })); M.root.add(mesh); n += tris(mesh.geometry); } st.scars = geos.length; st.foreVerts = keep.size; }
  // Elias: the goggles up on his brow, the trinkets on his coat, the bundles on his pack, the armillary for the lantern in his hand
  if (own.goggles) { const eL = J(M, 'eye.L'), eR = J(M, 'eye.R'), hd = J(M, 'head'), c = eL.clone().lerp(eR, .5), w = eL.distanceTo(eR);
    const gg = goggles(w * 1.45, Math.max(.07, c.z - hd.z + .005)); gg.position.set(c.x, c.y + .062, c.z - .004); gg.rotation.x = -.5; M.root.add(gg); n += countTris(gg); st.goggles = +(w).toFixed(3); }
  if (own.trinkets) { const coat = meshNamed(M, /^coat/i).filter(m => m.isSkinnedMesh); st.coatMeshes = coat.map(m => m.name);
    const s = stuck(M, coat, own.trinkets, 61, (V, N, Lm) => N.z > .25 && V.y < Lm.sh - .04 / Lm.K && V.y > Lm.hip - .2 / Lm.K, trinket, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: .4, metalness: .55, side: THREE.DoubleSide }), .006); n += s.tris; st.trinkets = s.n; }
  if (own.bundles) { M.root.updateMatrixWorld(true); const pk = meshNamed(M, /pack|frame/i).filter(m => !/strap/i.test(m.name)), b = new THREE.Box3(); for (const m of pk) b.expandByObject(m);
    if (!b.isEmpty()) { const lo = M.root.worldToLocal(b.min.clone()), hi = M.root.worldToLocal(b.max.clone()), bu = bundles(rng(71)); bu.position.set((lo.x + hi.x) / 2, Math.max(lo.y, hi.y) - .02, Math.min(lo.z, hi.z) + Math.abs(hi.z - lo.z) * .45); M.root.add(bu); n += countTris(bu); st.pack = pk.map(m => m.name); st.packTop = +Math.max(lo.y, hi.y).toFixed(2); } }
  if (own.armillary) { M.root.updateMatrixWorld(true); let ln = null; M.root.traverse(c => { if (c.name === 'lantern' && !ln) ln = c; });
    if (ln) { const b = new THREE.Box3().expandByObject(ln), top = M.root.worldToLocal(new THREE.Vector3((b.min.x + b.max.x) / 2, b.max.y, (b.min.z + b.max.z) / 2)); ln.visible = false;
      const a = armillary(); a.position.copy(top).add(new THREE.Vector3(0, .03 + .09 + .09, .02)); M.root.add(a); n += countTris(a); st.armillary = top.toArray().map(v => +v.toFixed(2)); } }
  // Ord's broad felt hat: the builder's felt hat with its brim widened (the crown kept), so it reads as the sheet's
  if (own.brim) { let hat = null; M.root.traverse(c => { if (c.name === 'hat' && !hat) hat = c; });
    if (hat) { const b = new THREE.Box3(); hat.traverse(m => { if (m.isMesh) { m.geometry.computeBoundingBox(); b.union(m.geometry.boundingBox); } }); const c = b.getCenter(new THREE.Vector3()), y0 = b.min.y + (b.max.y - b.min.y) * .25;
      hat.traverse(m => { if (m.isMesh) { const p = m.geometry.attributes.position; for (let i = 0; i < p.count; i++) { const k = p.getY(i) < y0 ? own.brim : 1 + (own.brim - 1) * .25; p.setX(i, c.x + (p.getX(i) - c.x) * k); p.setZ(i, c.z + (p.getZ(i) - c.z) * k); } p.needsUpdate = true; m.geometry.computeVertexNormals(); m.geometry.computeBoundingSphere(); } }); st.brim = own.brim; } }
  // Ord's punt pole for the staff: 3.9 m of ash, its foot on the bank, through his hand, the staff's own line
  if (own.pole) { M.root.updateMatrixWorld(true); let sf = null; M.root.traverse(c => { if (c.name === 'staff') sf = c; });
    if (sf) { const b = new THREE.Box3().expandByObject(sf), q = sf.getWorldQuaternion(new THREE.Quaternion()), d = new THREE.Vector3(0, 1, 0).applyQuaternion(q).normalize(); sf.visible = false;
      const foot = M.root.worldToLocal(new THREE.Vector3((b.min.x + b.max.x) / 2, b.min.y, (b.min.z + b.max.z) / 2)); const pole = cyl(.024, .02, own.pole, 8, M_([.5, .42, .3], { r: .7 }));
      pole.position.copy(foot).addScaledVector(d, own.pole / 2); pole.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), d); M.root.add(shade(pole)); n += tris(pole.geometry); st.pole = d.toArray().map(v => +v.toFixed(2)); } }
  M.root.traverse(m => { if (m.isMesh && !m.isSkinnedMesh) { m.castShadow = true; m.receiveShadow = true; } });
  return { tris: Math.round(n), ...st };
}

// ── the dammer, a body plan for creatures.js: a beaver's body the size of a cart (2.7 m nose to rump, 1.25 m at the back), six short
// legs (the middle pair under the barrel, a fore's make), a walrus's face (a broad bristled muzzle, small eyes, round ears) and two tusks
// 40 cm long turned down, a flat tail 0.9 m like a paddle, wet brown fur
// Session 2627 (#1950 B): the dammer's plan now lives in the creature kit (creatures.js PLANS.dammer); this page reads it there
export function dammerPlan() { return PLANS.dammer; }

// ── set pieces ──
// a gate's mouth in a hillside (OG-037's V1, small): a turf mound, two rings of dressed stone round a dark slit door 1.2 × 2.3 m, amber
// sigils cut in the jambs, and a stone step 2.2 m wide before it at the seat's height, where the fool sits
export function gateMouth(seatY = .45, stone, turf) {
  const g = new THREE.Group(), st = stone || M_([.5, .48, .44], { r: .95 }), tf = turf || M_([.3, .36, .18], { r: 1 }), amber = M_([1, .6, .2], { e: [1, .55, .15], ei: 2.4 }), dark = M_([.02, .02, .025], { r: 1 });
  const mound = new THREE.Mesh(new THREE.SphereGeometry(1, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2), tf); mound.scale.set(5.5, 3.6, 3.4); mound.position.set(0, -.2, -3.25); g.add(mound);
  const face = box(4.6, 3.6, .9, st); face.position.set(0, 1.6, -.15); g.add(face);
  for (const [R, t] of [[1.55, .2], [2.05, .16]]) { const ring = new THREE.Mesh(new THREE.TorusGeometry(R, t, 8, 40, Math.PI), st); ring.position.set(0, 1.05, .32); g.add(ring); }
  const door = box(1.2, 2.3, .1, dark); door.position.set(0, 1.15, .32); g.add(door);
  for (const s of [-1, 1]) { const jamb = box(.36, 2.5, .3, st); jamb.position.set(s * .78, 1.25, .38); g.add(jamb);
    for (let i = 0; i < 5; i++) { const gl = box(.012, .1 + (i % 2) * .06, .01, amber); gl.position.set(s * .78 + (i % 2 ? .05 : -.05), .55 + i * .38, .535); gl.rotation.z = (i % 3 - 1) * .5; g.add(gl); } }
  const lintel = box(2.0, .34, .34, st); lintel.position.set(0, 2.5, .4); g.add(lintel);
  const step = box(2.2, seatY, .62, st); step.position.set(0, seatY / 2, .9); g.add(step);
  const lamp = new THREE.PointLight(0xffa050, .5, 3, 2); lamp.position.set(0, 1.4, .7); g.add(lamp);
  return shade(g);
}
// the fool's hat upturned on the flags, a few coins in it
export function upturnedHat() {
  const g = new THREE.Group(), felt = M_([.3, .24, .18], { r: 1, ds: true }), coin = M_([.78, .62, .3], { r: .3, m: .9 }), cu = M_([.55, .32, .18], { r: .35, m: .85 });
  const crown = new THREE.Mesh(new THREE.CylinderGeometry(.085, .075, .11, 18, 1, true), felt); crown.position.y = .055; g.add(crown);
  const top = new THREE.Mesh(new THREE.CircleGeometry(.075, 18), felt); top.rotation.x = -Math.PI / 2; top.position.y = .002; g.add(top);
  const brim = new THREE.Mesh(new THREE.RingGeometry(.085, .16, 24), felt); brim.rotation.x = -Math.PI / 2; brim.position.y = .11; brim.rotation.y = .3; g.add(brim);
  const r = rng(5); for (let i = 0; i < 6; i++) { const c = cyl(.011, .011, .003, 10, i % 3 ? cu : coin); c.position.set((r() - .5) * .08, .006 + i * .002, (r() - .5) * .08); c.rotation.set((r() - .5) * .4, 0, (r() - .5) * .4); g.add(c); }
  g.rotation.z = .08; return shade(g);
}
// Ord's punt: 4.2 × 0.95 m, flat-bottomed, its sides 0.3 m, both ends raked up; a thwart, a coil of rope, and at the bow a lantern on a
// pole 1.7 m, hung from a short arm, lit
export function punt(o = {}) {
  const g = new THREE.Group(), wood = M_([.34, .26, .18], { r: .85 }), dark = M_([.2, .15, .1], { r: .9 }), L = 4.2, W = .95, Hs = .3;
  const bottom = box(L - .6, .04, W, dark); bottom.position.y = .02; g.add(bottom);
  for (const s of [-1, 1]) { const end = box(.5, .04, W, dark); end.position.set(s * (L / 2 - .23), .1, 0); end.rotation.z = -s * .35; g.add(end);
    const side = box(L, Hs, .04, wood); side.position.set(0, Hs / 2 + .02, s * (W / 2 - .02)); g.add(side); const rail = box(L, .04, .07, wood); rail.position.set(0, Hs + .04, s * (W / 2 - .02)); g.add(rail);
    const tr = box(.05, Hs * .9, W - .04, wood); tr.position.set(s * (L / 2 - .02), Hs * .55 + .1, 0); g.add(tr); }
  const thwart = box(.26, .04, W - .06, wood); thwart.position.set(-.3, .22, 0); g.add(thwart);
  const rope = new THREE.Mesh(new THREE.TorusGeometry(.12, .02, 6, 18), M_([.58, .5, .34], { r: .95 })); rope.rotation.x = Math.PI / 2; rope.position.set(.9, .07, 0); g.add(rope);
  const pole = cyl(.025, .022, 1.7, 8, wood); pole.position.set(L / 2 - .12, .9, 0); g.add(pole); const arm = box(.4, .035, .035, wood); arm.position.set(L / 2 + .05, 1.72, 0); g.add(arm);
  const lan = cageLantern({ metal: 'iron', hang: true, h: .26, r: .07, li: 1.6 }); lan.position.set(L / 2 + .2, 1.7, 0); g.add(lan);
  return shade(g);
}
// Stilts, a grey heron, 0.95 m standing: a long body, an S neck drawn back, a dagger bill, the black crest, yellow-brown legs
export function heron() {
  const g = new THREE.Group(), grey = M_([.5, .52, .54], { r: .8 }), pale = M_([.82, .82, .8], { r: .8 }), black = M_([.06, .06, .07], { r: .7 }), bill = M_([.7, .56, .2], { r: .5 }), leg = M_([.48, .4, .22], { r: .6 });
  const body = new THREE.Mesh(new THREE.SphereGeometry(.1, 16, 10), grey); body.scale.set(.9, 1, 2.1); body.position.set(0, .56, 0); body.rotation.x = .45; g.add(body);
  const neckPts = [[0, .62, .14], [0, .72, .2], [0, .8, .15], [0, .86, .18], [0, .9, .24]].map(p => new THREE.Vector3(...p));
  const neck = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(neckPts), 16, .028, 8), pale); g.add(neck);
  const head = new THREE.Mesh(new THREE.SphereGeometry(.035, 12, 9), pale); head.scale.z = 1.3; head.position.set(0, .905, .25); g.add(head);
  const b = new THREE.Mesh(new THREE.ConeGeometry(.012, .13, 8), bill); b.rotation.x = Math.PI / 2; b.position.set(0, .9, .34); g.add(b);
  const crest = new THREE.Mesh(new THREE.ConeGeometry(.006, .12, 5), black); crest.rotation.x = -Math.PI / 2 - .3; crest.position.set(0, .92, .14); g.add(crest);
  for (const s of [-1, 1]) { const st = box(.004, .015, .02, black); st.position.set(s * .025, .915, .26); g.add(st);
    const l = cyl(.007, .006, .5, 6, leg); l.position.set(s * .05, .25, -.01); g.add(l); const toe = box(.01, .006, .1, leg); toe.position.set(s * .05, .003, .02); g.add(toe); }
  const wing = new THREE.Mesh(new THREE.SphereGeometry(.105, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2), M_([.38, .4, .42], { r: .8 })); wing.scale.set(.95, .6, 2.1); wing.position.set(0, .58, -.02); wing.rotation.x = .45; g.add(wing);
  return shade(g);
}
// the warehouse door on the quay: a timber store's wall, planked, a pair of doors 1.6 × 2.4 m, one ajar on the dark inside
export function wareWall(wood) {
  const g = new THREE.Group(), w = wood || M_([.36, .28, .2], { r: .9 }), dark = M_([.03, .025, .02], { r: 1 }), iron = M_(IRON, { r: .5, m: .7 });
  const wall = box(5.2, 3.4, .25, w); wall.position.set(0, 1.7, 0); g.add(wall);
  const hole = box(1.6, 2.4, .05, dark); hole.position.set(-.4, 1.2, .13); g.add(hole);
  const leaf = box(.8, 2.4, .06, w); leaf.position.set(-.4 - .8 + .4 - .2, 1.2, .5); leaf.rotation.y = -1.1; g.add(leaf); const leaf2 = box(.8, 2.4, .06, w); leaf2.position.set(0, 1.2, .16); g.add(leaf2);
  for (const y of [.5, 1.9]) { const h = box(.6, .04, .02, iron); h.position.set(0, y, .2); g.add(h); }
  const lintel = box(2.0, .2, .3, M_([.24, .18, .12], { r: .9 })); lintel.position.set(-.4, 2.5, .15); g.add(lintel);
  const eave = box(5.6, .14, 1.0, M_([.2, .16, .12], { r: .9 })); eave.position.set(0, 3.45, .3); g.add(eave);
  for (let i = 0; i < 3; i++) { const cask = cyl(.26, .26, .7, 14, M_([.38, .26, .16], { r: .8 })); cask.position.set(1.4 + i * .56, .35, .5 + (i % 2) * .2); g.add(cask);
    for (const y of [-.24, .24]) { const hp = new THREE.Mesh(new THREE.TorusGeometry(.265, .012, 4, 18), iron); hp.rotation.x = Math.PI / 2; hp.position.set(cask.position.x, .35 + y, cask.position.z); g.add(hp); } }
  return shade(g);
}
// the dam: alder logs gnawed to points and laid across, mud packed between, two stumps on the bank cut to the beast's cone
export function dam() {
  const g = new THREE.Group(), bark = M_([.3, .24, .18], { r: .95 }), wood = M_([.78, .6, .38], { r: .9 }), mud = M_([.2, .15, .1], { r: 1 }), r = rng(13);
  for (let i = 0; i < 9; i++) { const L = 1.6 + r() * 1.4, rad = .07 + r() * .06, log = new THREE.Group(), c = cyl(rad, rad, L, 9, bark); c.rotation.z = Math.PI / 2; log.add(c);
    const tip = new THREE.Mesh(new THREE.ConeGeometry(rad, rad * 2.6, 9), wood); tip.rotation.z = -Math.PI / 2; tip.position.x = L / 2 + rad * 1.3; log.add(tip);
    log.position.set((r() - .5) * .8, .08 + (i % 4) * .1, (r() - .5) * .9); log.rotation.y = (r() - .5) * .9; log.rotation.z = (r() - .5) * .2; g.add(log); }
  const bank = new THREE.Mesh(new THREE.SphereGeometry(1, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2), mud); bank.scale.set(1.8, .35, 1.0); g.add(bank);
  for (const [x, z, rad] of [[2.3, .7, .16], [-2.0, -.6, .12], [1.6, -1.1, .1]]) { const s = cyl(rad, rad * 1.1, .4, 10, bark); s.position.set(x, .2, z); g.add(s);
    const cone = new THREE.Mesh(new THREE.ConeGeometry(rad, rad * 2.2, 10), wood); cone.position.set(x, .4 + rad * 1.1, z); g.add(cone);
    const chips = new THREE.Mesh(new THREE.CircleGeometry(rad * 3, 12), M_([.7, .56, .36], { r: 1 })); chips.rotation.x = -Math.PI / 2; chips.position.set(x, .005, z); g.add(chips); }
  return shade(g);
}
// rings and a wake on the water where something big went under (a): three rings and a V of ripples, pale lines on the water
export function ripples() {
  const g = new THREE.Group(), m = M_([.8, .84, .86], { r: .2, tr: true, op: .45, dw: false });
  for (const [R, w] of [[.5, .03], [1.0, .025], [1.6, .02]]) { const r = new THREE.Mesh(new THREE.RingGeometry(R - w, R, 48), m); r.rotation.x = -Math.PI / 2; g.add(r); }
  for (const s of [-1, 1]) for (let i = 0; i < 4; i++) { const l = new THREE.Mesh(new THREE.PlaneGeometry(.03, .9), m); l.rotation.x = -Math.PI / 2; l.rotation.z = s * .45; l.position.set(s * (.3 + i * .35), .001, -1.4 - i * .5); g.add(l); }
  return g;
}
