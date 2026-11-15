// The underworld (the concept artist, 15 Nov 2026; backlog L2, "The underworld", OG-006, and the quest writer's *The Underworld*, 26 Oct,
// unapproved): OG-006 drew five sheets, an information broker in red velvet with rings and a goblet, a braided river smuggler with ropes,
// spyglass and charts, a hooded contract killer with a long knife and a mask, a cheerful goggled fence, and a highwayman who was a
// pilgrim with a staff and a holy book under a cross. The draft gives them names, peoples and places (§1.5's mix, one of each people and
// two of the Gatelands'), and the canon gives them reasons: Philo the fence, an Aurennais lens-grinder at Port Blackhand; Uallach the
// broker, Old Blood, who sells what she sees and never what she reads (§3.1); Brógán the black market, a Gatelander off the river at
// night; Eadburh Two-Purses, a Markish duellist for hire who works in the open, because Mark duels are legal (§1.2, §1.5); Siadhal, the
// highwayman-pilgrim on a Crown road. Where the sheet draws a cross, the Church's sign is a shuttle (§4.1).
//
// The question is how much of the trade shows on the body, three levels:
//   a  as townsfolk: each is dressed as anyone of their people and trade is (a grinder's apron, a boatman's coat, a fighter's kit, a
//      walker's cloak); nothing says what they do until you talk to them;
//   b  one tell each (recommended; the draft's faces): Philo's harness of lenses pushed up on his brow (two and a third on a hinge),
//      Uallach very still in dark layers over undyed linen with the marks at both wrists, Brógán in a short oilskin with a shuttered
//      lantern, Eadburh's scarred brow and two purses at her belt, Siadhal's hooded pilgrim's cloak over a highwayman's leather, the staff,
//      a short sword and the tin shuttle on its cord;
//   c  OG-006 as drawn: every one dressed for the trade: the broker in red velvet with gold and a goblet, the fence's lenses down as
//      goggles and a satchel of finds, the smuggler with a coil of rope, a spyglass and charts, the killer hooded and masked in black
//      with a long knife, the pilgrim with the holy book, the shuttle on its cover and on his chest.
// UNDERWORLD[key] is the sheet; underGenome(key, level, P) makes the genome (P carries people.js's rollGenome, heightFor, GARMENTS and
// DRESS_FLAGS, so this file imports only three). underProps(M, G, level) adds what people.js does not have (the lenses, the purses,
// the shuttle, the mask, the long knife, the rope and the spyglass) to the made person's root, placed on the body's own surface, and
// returns their triangles. Colours are linear [r,g,b] as in CAST.
import * as THREE from 'three';

const LEATHER = [.22, .14, .09], DARK = [.07, .07, .08], UNDYED = [.62, .58, .5], CRIMSON = [.42, .05, .06], GOLD = [.74, .56, .2], OIL = [.13, .14, .1],
  BRASS = [.62, .46, .2], TIN = [.62, .62, .6], WOOL = [.34, .3, .24];

export const UNDERWORLD = {
  // Philo, the glass-grinder (Aurennais): lean and quick, olive; the fence at Port Blackhand's tavern, any hour
  philo: { label: 'Philo, the fence', island: 'aurenne', people: 'aurennais', g: 1, age: .5, muscle: .45, weight: .3, metres: 1.74,
    hairCol: [.1, .07, .05], hair: { style: 'short', len: .4 }, beard: .35, skin: [.7, .52, .38],
    a: { tunic: [.66, .58, .44], trousers: [.4, .32, .22], sandals: [.4, .28, .18], belt: [.4, .28, .18], apron: [.44, .34, .22], apronLeather: true, sleevesRolled: true },
    b: { tunic: [.6, .5, .36], trousers: [.34, .26, .18], sandals: [.4, .28, .18], belt: [.4, .28, .18], apron: [.36, .24, .14], apronLeather: true, sleevesRolled: true,
      props: { lenses: 'up' } },
    c: { tunic: [.62, .44, .2], trousers: [.3, .2, .12], sandals: [.4, .28, .18], belt: [.4, .28, .18], waistcoat: [.42, .1, .08], earrings: GOLD, satchel: [.4, .26, .14],
      sleevesRolled: true, props: { lenses: 'down' } } },
  // Uallach (Old Blood): small, grey-pale, black-haired, the marks at both wrists, very still; the broker at Aurenne's capital, from dusk
  uallach: { label: 'Uallach, the broker', island: 'aurenne', people: 'oldblood', fixed: true, g: 0, age: .62, muscle: .3, weight: .32, metres: 1.56,
    hairCol: [.05, .05, .06], hair: { style: 'braid', len: .8 }, marks: .0,
    a: { tunic: [.46, .44, .4], skirtColor: [.3, .28, .26], boots: [.2, .15, .1], belt: [.24, .18, .12], wrap: [.4, .38, .34] },
    b: { tunic: UNDYED, skirtColor: [.12, .11, .13], boots: [.14, .11, .09], belt: [.16, .12, .1], shoulderWrap: [.1, .09, .12], shoulderWrapSide: 'R',
      dots: [.32, .1, .1], dotsStyle: 'powder', amulet: [.46, .46, .44], marks: .3 },
    c: { tunic: CRIMSON, skirtColor: CRIMSON, skirt: 'long', boots: [.14, .11, .09], sash: GOLD, sashPrint: false, necklace: GOLD, earrings: GOLD, cuffs: GOLD,
      cloak: [.3, .03, .05], cape: true, cloakLen: 1, cloakHem: GOLD, brooch: GOLD, tankard: GOLD, marks: .3 } },
  // Brógán (Gatelander): broad and wet to the knee; the black market off carts on the river at night
  brogan: { label: 'Brógán, the black market', island: 'gatelands', people: 'gatelander', g: 1, age: .55, muscle: .7, weight: .72, metres: 1.78,
    hairCol: [.36, .2, .1], hair: { style: 'short', len: .5 }, beard: .8,
    a: { tunic: [.42, .4, .34], trousers: [.28, .26, .22], boots: [.22, .15, .1], belt: LEATHER, legWraps: [.34, .3, .24] },
    b: { tunic: [.38, .36, .3], trousers: [.2, .19, .17], boots: [.12, .1, .08], belt: LEATHER, coat: OIL, coatLen: .45, coatTrim: [.1, .1, .08],
      lantern: [.2, .2, .2] },
    c: { tunic: [.38, .36, .3], trousers: [.2, .19, .17], boots: [.12, .1, .08], belt: LEATHER, coat: OIL, coatLen: .45, coatTrim: [.1, .1, .08], maps: [.8, .72, .55],
      hair: { style: 'plait', len: .7 }, props: { rope: true, spyglass: true } } },
  // Eadburh Two-Purses (Markman): tall, ash-blond, a scar through one eyebrow; the duellist for hire at Caer Slige's yard, by day
  eadburh: { label: 'Eadburh Two-Purses', island: 'mark', people: 'markman', g: 0, age: .45, muscle: .78, weight: .42, metres: 1.84, skirt: 'short',
    hairCol: [.72, .66, .52], hair: { style: 'plait', len: .6 },
    a: { tunic: [.42, .36, .28], trousers: [.24, .22, .2], boots: [.2, .14, .1], belt: LEATHER, sword: [.42, .43, .45], swordMake: 'norse' },
    b: { tunic: [.3, .14, .1], trousers: [.18, .17, .16], boots: [.16, .11, .08], belt: LEATHER, bands: [.5, .12, .1], bandsMotif: [.16, .22, .46],
      vambrace: [.3, .2, .12], vambraceKind: 'leather', sword: [.42, .43, .45], swordMake: 'norse', scar: 'L', props: { purses: true } },
    c: { tunic: DARK, trousers: DARK, boots: [.06, .06, .06], belt: [.08, .07, .07], coat: [.05, .05, .06], coatLen: .8, coatHood: 'up', gloves: [.06, .06, .06],
      scar: 'L', props: { mask: true, knife: true } } },
  // Siadhal (Gatelander): thin, a pilgrim's hooded cloak over a highwayman's leather; on a moor road, once a game-week
  siadhal: { label: 'Siadhal, the highwayman-pilgrim', island: 'gatelands', people: 'gatelander', g: 1, age: .4, muscle: .5, weight: .28, metres: 1.8,
    hairCol: [.22, .14, .08], hair: { style: 'short', len: .55 }, beard: .45,
    a: { tunic: [.46, .42, .34], trousers: [.3, .28, .24], boots: [.24, .16, .1], belt: LEATHER, cloak: [.3, .32, .22], cloakLen: .9, brooch: [.6, .6, .62], staff: [.4, .3, .2], staffMake: 'hazel' },
    b: { tunic: [.3, .26, .2], trousers: [.2, .17, .14], boots: [.18, .12, .08], belt: LEATHER, waistcoat: [.26, .16, .1], waistcoatLeather: true,
      cloak: WOOL, cloakLen: .95, hood: 'up', brooch: TIN, staff: [.4, .3, .2], staffMake: 'hazel', sword: [.42, .43, .45], swordMake: 'falchion', props: { shuttle: true } },
    c: { tunic: [.3, .26, .2], trousers: [.2, .17, .14], boots: [.18, .12, .08], belt: LEATHER, waistcoat: [.26, .16, .1], waistcoatLeather: true,
      cloak: [.36, .33, .27], cloakLen: 1, hood: 'up', brooch: TIN, staff: [.4, .3, .2], staffMake: 'carved', book: [.2, .14, .1], bookGilt: TIN, props: { shuttle: true, bookShuttle: true } } } };
export const ORDER = ['philo', 'uallach', 'brogan', 'eadburh', 'siadhal'];

// the genome: the name rolled for the face (as castGenome does), the sheet's body, then the level's whole wardrobe
export function underGenome(key, level, P) {
  const S = UNDERWORLD[key], G = P.rollGenome('under:' + key, { people: S.people, g: S.g });
  for (const k of ['age', 'muscle', 'weight', 'hairCol', 'beard', 'skin']) if (S[k] != null) G[k] = Array.isArray(S[k]) ? S[k].slice() : S[k];
  const D = JSON.parse(JSON.stringify(S[level] || S.b)), props = D.props || {}, hair = D.hair || S.hair, scar = D.scar || null, marks = D.marks ?? S.marks;
  delete D.props; delete D.hair; delete D.scar; delete D.marks;
  G.hair = { ...hair }; G.pose = { ...(G.pose || {}), stoop: 0 }; G.scar = scar; G.marks = S.people === 'oldblood' ? (marks ?? 0) : null;
  G.dress = { ...Object.fromEntries(P.GARMENTS.map(k => [k, null])), ...P.DRESS_FLAGS, skirt: S.skirt || (S.g ? 'short' : 'long'), ...D };
  G.height = P.heightFor(G, S.metres); G.under = key; G.props = props; return G;
}

// ── what the people kit has not: placed on the made body's surface (its skinned positions, in the root's frame) ──
const lin = c => new THREE.Color().setRGB(...c, THREE.SRGBColorSpace);
const M_ = (c, o = {}) => new THREE.MeshStandardMaterial({ color: lin(c), roughness: o.r ?? .7, metalness: o.m ?? 0, ...(o.t ? { transparent: true, opacity: o.t } : {}) });
// the body's points: the skinned body's vertices, once, in the root's frame
function bodyPts(M) {
  if (M._pts) return M._pts; const body = M.meshes.find(m => m.isSkinnedMesh) || M.meshes[0]; M.root.updateMatrixWorld(true);
  const inv = new THREE.Matrix4().copy(M.root.matrixWorld).invert(), pos = body.geometry.attributes.position, v = new THREE.Vector3(), out = new Float32Array(pos.count * 3);
  for (let i = 0; i < pos.count; i++) { body.getVertexPosition(i, v); v.applyMatrix4(body.matrixWorld).applyMatrix4(inv); out[i * 3] = v.x; out[i * 3 + 1] = v.y; out[i * 3 + 2] = v.z; }
  return M._pts = out;
}
// the body's section at a height: its extents in x and z, and the front's z at x≈x0
function slice(M, y, dy = .012, o = {}) {
  const P = bodyPts(M); let x0 = 1e9, x1 = -1e9, z0 = 1e9, z1 = -1e9, fz = -1e9, n = 0;
  for (let i = 0; i < P.length; i += 3) { const x = P[i], yy = P[i + 1], z = P[i + 2]; if (Math.abs(yy - y) > dy) continue; if (o.maxX != null && Math.abs(x) > o.maxX) continue;
    n++; x0 = Math.min(x0, x); x1 = Math.max(x1, x); z0 = Math.min(z0, z); z1 = Math.max(z1, z); if (o.at != null && Math.abs(x - o.at) < .02) fz = Math.max(fz, z); }
  return { x0, x1, z0, z1, cx: (x0 + x1) / 2, cz: (z0 + z1) / 2, fz: fz > -1e9 ? fz : z1, n };
}
const bonePos = (M, n) => { const b = M.byName[n]; M.root.updateMatrixWorld(true); const v = b.getWorldPosition(new THREE.Vector3()); return M.root.worldToLocal(v); };
const tris = g => (g.index ? g.index.count : g.attributes.position.count) / 3;

// the lenses (Philo): a leather band round the head at the brow, two brass-rimmed lenses on its front and a third on a hinge over the
// right one; 'up' pushes the pair up on the brow (b), 'down' sets them over the eyes as goggles (c)
function lenses(M, mode) {
  const g = new THREE.Group(), head = bonePos(M, 'head'), eyeL = bonePos(M, 'eye.L'), eyeR = bonePos(M, 'eye.R'), ey = (eyeL.y + eyeR.y) / 2;
  const yB = mode === 'up' ? ey + .045 : ey + .004, s = slice(M, yB, .006, { maxX: .1 }), rx = (s.x1 - s.x0) / 2 + .005, rz = (s.z1 - s.z0) / 2 + .006;
  const band = new THREE.Mesh(new THREE.TorusGeometry(1, .007 / Math.max(rx, rz), 6, 40), M_(LEATHER, { r: .8 })); band.scale.set(rx, rz, Math.max(rx, rz)); band.rotation.x = Math.PI / 2;
  band.geometry.scale(1, 1, 1.6); band.position.set(s.cx, yB, s.cz); g.add(band);
  const rim = M_(BRASS, { r: .35, m: .9 }), glass = M_([.7, .8, .78], { r: .05, m: .1, t: .45 });
  const one = (x, y, z, rot, r = .019) => { const L = new THREE.Group(); const cyl = new THREE.Mesh(new THREE.CylinderGeometry(r + .004, r + .006, .022, 16, 1, true), rim); cyl.rotation.x = Math.PI / 2;
    const gl = new THREE.Mesh(new THREE.CircleGeometry(r, 16), glass); gl.position.z = .011; const lip = new THREE.Mesh(new THREE.TorusGeometry(r + .003, .003, 5, 16), rim); lip.position.z = .011;
    L.add(cyl, gl, lip); L.position.set(x, y, z); L.rotation.x = rot; g.add(L); return L; };
  const fz = s.z1 + .004, tilt = mode === 'up' ? -.35 : 0, lx = [eyeL.x, eyeR.x];
  for (const x of lx) one(x, yB + (mode === 'up' ? .006 : 0), fz + .006, tilt);
  // the third, smaller, on a hinge over the right lens: swung half down (b), or full down before it (c)
  const hinge = new THREE.Mesh(new THREE.BoxGeometry(.006, .006, .03), rim); hinge.position.set(eyeR.x - .024, yB + .02, fz + .012); g.add(hinge);
  one(eyeR.x - .006, yB + (mode === 'up' ? .03 : .0), fz + .03, mode === 'up' ? -1.1 : 0, .012);
  return g;
}
// a purse: a leather bag gathered at the neck by a cord, hung from the belt
function purse(c) {
  const pts = []; for (let i = 0; i <= 12; i++) { const t = i / 12, r = Math.sin(Math.PI * Math.min(1, t * 1.15)) * .036 * (1 - .55 * t ** 3) + .004; pts.push(new THREE.Vector2(r, -.085 * (1 - t))); }
  const g = new THREE.Group(), bag = new THREE.Mesh(new THREE.LatheGeometry(pts, 14), M_(c, { r: .85 })); bag.scale.z = .7;
  const tie = new THREE.Mesh(new THREE.TorusGeometry(.012, .003, 4, 12), M_([.5, .42, .3])); tie.rotation.x = Math.PI / 2; tie.position.y = -.008;
  const loop = new THREE.Mesh(new THREE.TorusGeometry(.012, .0025, 4, 10, Math.PI), M_([.5, .42, .3])); loop.position.y = .002;
  g.add(bag, tie, loop); return g;
}
// the Weaver's shuttle (§4.1): a boat-pointed tin shuttle 6 cm long, its bobbin slot open, on a cord round the neck
function shuttleGeom(len = .06) {
  const sh = new THREE.Shape(), w = len * .17; sh.moveTo(-len / 2, 0); sh.quadraticCurveTo(-len * .2, w, 0, w); sh.quadraticCurveTo(len * .2, w, len / 2, 0);
  sh.quadraticCurveTo(len * .2, -w, 0, -w); sh.quadraticCurveTo(-len * .2, -w, -len / 2, 0);
  const hole = new THREE.Path(); hole.absellipse(0, 0, len * .2, w * .35, 0, Math.PI * 2); sh.holes.push(hole);
  return new THREE.ExtrudeGeometry(sh, { depth: len * .12, bevelEnabled: true, bevelSize: len * .02, bevelThickness: len * .02, bevelSegments: 1, curveSegments: 8 });
}
function shuttle(M) {
  const g = new THREE.Group(), n = bonePos(M, 'neck01'), yC = n.y - .17, s = slice(M, yC, .01, { maxX: .1, at: 0 });
  const t = new THREE.Mesh(shuttleGeom(), M_(TIN, { r: .4, m: .85 })); t.rotation.z = Math.PI / 2; t.position.set(0, yC, s.fz + .018); g.add(t);
  // the cord: from either side of the neck down to the shuttle's eye, over the chest
  const nk = slice(M, n.y - .02, .01, { maxX: .09 }), cm = M_([.3, .24, .16], { r: .9 });
  for (const sx of [-1, 1]) { const a = new THREE.Vector3(sx * ((nk.x1 - nk.x0) / 2 + .004), n.y - .02, nk.cz + .01), mid = new THREE.Vector3(sx * .045, (n.y + yC) / 2 + .02, s.fz + .02), b = new THREE.Vector3(0, yC + .032, s.fz + .02);
    g.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.QuadraticBezierCurve3(a, mid, b), 10, .0018, 4), cm)); }
  return g;
}
// the mask (Eadburh at c): a black cloth over the nose and the lower face, tied behind, from under the eyes to the chin
function mask(M) {
  const eyeL = bonePos(M, 'eye.L'), eyeR = bonePos(M, 'eye.R'), ey = (eyeL.y + eyeR.y) / 2, y0 = ey - .02, y1 = ey - .125, g = new THREE.Group(), m = M_([.05, .05, .06], { r: .95 });
  m.side = THREE.DoubleSide; const rings = 7, seg = 24, P = [], I = [];
  for (let j = 0; j < rings; j++) { const y = y0 + (y1 - y0) * j / (rings - 1), s = slice(M, y, .008, { maxX: .1 }), rx = (s.x1 - s.x0) / 2 + .007, rz = (s.z1 - s.z0) / 2 + .009;
    for (let i = 0; i <= seg; i++) { const a = -Math.PI * .62 + Math.PI * 1.24 * i / seg; P.push(s.cx + Math.sin(a) * rx, y, s.cz + Math.cos(a) * rz + (j === rings - 1 ? .006 : 0)); } }
  for (let j = 0; j < rings - 1; j++) for (let i = 0; i < seg; i++) { const a = j * (seg + 1) + i, b = a + seg + 1; I.push(a, b, a + 1, b, b + 1, a + 1); }
  const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); geo.setIndex(I); geo.computeVertexNormals(); g.add(new THREE.Mesh(geo, m)); return g;
}
// a long knife in its sheath, hung slanting from the belt at the right hip; the rope's coil at the left hip; a spyglass through the belt
function knife() {
  const g = new THREE.Group(), sh = new THREE.Mesh(new THREE.CylinderGeometry(.016, .007, .34, 8), M_([.08, .07, .06], { r: .6 })); sh.scale.z = .45; sh.position.y = -.17;
  const grip = new THREE.Mesh(new THREE.CylinderGeometry(.012, .012, .12, 8), M_([.1, .08, .07], { r: .8 })); grip.position.y = .07;
  const cross = new THREE.Mesh(new THREE.BoxGeometry(.07, .01, .016), M_([.4, .41, .43], { r: .4, m: .9 })); const pom = new THREE.Mesh(new THREE.SphereGeometry(.014, 8, 6), M_([.4, .41, .43], { r: .4, m: .9 })); pom.position.y = .135;
  g.add(sh, grip, cross, pom); return g;
}
function rope() { const g = new THREE.Group(), m = M_([.56, .46, .3], { r: .95 }); for (let i = 0; i < 4; i++) { const t = new THREE.Mesh(new THREE.TorusGeometry(.13 - i * .004, .011, 6, 28), m); t.position.z = i * .012 - .018; t.rotation.z = i * .7; g.add(t); }
  const tie = new THREE.Mesh(new THREE.TorusGeometry(.02, .008, 5, 10), m); tie.position.y = .13; tie.rotation.y = Math.PI / 2; g.add(tie); return g; }
function spyglass() { const g = new THREE.Group(), b = M_(BRASS, { r: .3, m: .9 }), l = M_(LEATHER, { r: .8 });
  [[.024, .02, .2, 0, l], [.019, .019, .1, .14, b], [.016, .016, .08, .22, b], [.026, .026, .02, -.1, b]].forEach(([r0, r1, h, y, mm]) => { const c = new THREE.Mesh(new THREE.CylinderGeometry(r1, r0, h, 12), mm); c.position.y = y; g.add(c); }); return g; }

export function underProps(M, G, level) {
  const p = G.props || {}, out = new THREE.Group(); out.name = 'underProps'; let n = 0;
  const PP = bodyPts(M); let top = -1e9, bot = 1e9; for (let i = 1; i < PP.length; i += 3) { top = Math.max(top, PP[i]); bot = Math.min(bot, PP[i]); }
  const yB = bot + (top - bot) * .575, s = slice(M, yB, .012, { maxX: .24 });
  if (p.lenses) out.add(lenses(M, p.lenses));
  if (p.shuttle) out.add(shuttle(M));
  if (p.mask) out.add(mask(M));
  if (p.purses) { [[-1, LEATHER], [1, [.32, .1, .08]]].forEach(([sx, c], i) => { const q = purse(c); const x = sx * ((s.x1 - s.x0) / 2 - .06); q.position.set(s.cx + x, yB - .015, s.z1 + .012); q.rotation.z = sx * .12; out.add(q); }); }
  if (p.knife) { const k = knife(); k.position.set(s.cx - ((s.x1 - s.x0) / 2 + .015), yB - .02, s.cz + .03); k.rotation.z = -.32; k.rotation.x = .15; out.add(k); }
  if (p.rope) { const r = rope(); r.position.set(s.cx + (s.x1 - s.x0) / 2 + .06, yB - .16, s.cz + .04); r.rotation.y = .85; out.add(r); }
  if (p.spyglass) { const sg = spyglass(); sg.position.set(s.cx - .07, yB - .01, s.z1 + .03); sg.rotation.z = 1.25; out.add(sg); }
  if (p.bookShuttle) { const bk = M.root.getObjectByName('book'); if (bk) { for (const sz of [1, -1]) { const t = new THREE.Mesh(shuttleGeom(.05), M_(TIN, { r: .4, m: .85 })); t.name = 'bookShuttle'; t.position.set(0, .07, sz * .017); if (sz < 0) t.rotation.y = Math.PI; bk.add(t); } } }
  out.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; n += tris(o.geometry); } }); M.root.add(out); return Math.round(n);
}
