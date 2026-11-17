// The travellers (the concept artist, 17 Nov 2026; backlog L2, "Travellers", OG-051, and the quest writer's *Travellers*, 28 Oct,
// unapproved): OG-051's sheet E7 drew five who move, *diverse roots, shared paths*: Zahra al-Mahdi, an Aurennais navigator who charts
// the gates (dark skin, long locs, gold hoops and a coin necklace, a navy-and-cream coat, a brass compass and charts); Tavio Rusen, a
// Markish hunter and guide (scarred, braided, in furs, a horned skull on his pack, a grey wolf at heel); Sister Elidan, a Gatelands
// healer and relic keeper (an older face, cream and crimson, candles and a reliquary); Khemrik Voss, the Old Blood reader (grey-pale,
// gold marks up the face, white hair, a circlet); Marco di Serra, an Aurennais patron (a dark beard, a velvet coat, a goblet). The
// draft keeps the five and the canon renames three: Tidwulf called Tid, Cuimín (one of the awake, §10a), Markos Serra. Unlike the
// underworld's five, these move: each is found in one of a few places by the game-week, so the player looks for them in a crowd.
//
// The question is how far a traveller shows that they travel, three levels:
//   a  as townsfolk: each dressed as anyone of their people is (a clerk's tunic, a hunter's coat, a Gatelandswoman's wrap, the Old
//      Blood's undyed wool, a merchant's sash); you find them by name and place alone;
//   b  the sheet's faces (recommended; the draft's "faces for the bodies builder"): Zahra's navy coat trimmed in cream, the hoops, the
//      coin necklace, the brass astrolabe at her belt and the roll of charts; Tid's fur-collared coat, braid and beard, the Mark's frame
//      pack with the horned skull lashed on, the wolf; Elidan's cream robe under a long crimson scapular, a lit candle lantern and the reliquary at
//      her hip; Cuimín white-haired and cold-marked to the eye under a thin circlet; Markos's wine velvet coat trimmed in gold, a gold cup;
//   c  b on the road: each carries the road as their island carries it (Michael's B on #1504: the pack by island): Zahra's striped
//      saddle-roll, Tid's spear and his pack, Elidan's hooded cloak and the wicker creel, Cuimín's grey cape and carved staff, Markos a
//      fur-collared cape over the velvet. A traveller reads as one across the square, and nobody local looks like that.
// TRAVELLERS[key] is the sheet; travGenome(key, level, P) makes the genome (P carries people.js's rollGenome, heightFor, GARMENTS and
// DRESS_FLAGS). travProps(M, G) adds the two things people.js does not have, the horned skull on the pack and the reliquary, and
// returns their triangles. Colours are linear [r,g,b] as in CAST.
import * as THREE from 'three';

const LEATHER = [.22, .14, .09], GOLD = [.74, .56, .2], BRASS = [.62, .46, .2], CREAM = [.82, .77, .64], CRIMSON = [.46, .06, .07], NAVY = [.06, .08, .2],
  WINE = [.3, .04, .09], GREY = [.42, .41, .4], UNDYED = [.6, .56, .48], FUR = [.46, .4, .32];

export const TRAVELLERS = {
  // Zahra al-Mahdi (Aurennais): a navigator by the houses' paper; on the quay of one of Aurenne's three largest ports, by the week
  zahra: { label: 'Zahra al-Mahdi, the navigator', island: 'aurenne', people: 'aurennais', g: 0, age: .42, muscle: .5, weight: .35, metres: 1.72,
    hairCol: [.04, .03, .03], hair: { style: 'braids', len: .95 }, skin: [.3, .19, .12],
    a: { tunic: [.7, .62, .48], skirtColor: [.42, .32, .22], sandals: [.4, .28, .18], belt: [.4, .28, .18], sash: [.52, .36, .2], sashPrint: false },
    b: { tunic: CREAM, trousers: [.16, .14, .14], boots: [.2, .14, .1], belt: LEATHER, coat: NAVY, coatLen: .82, coatTrim: CREAM, coatOpen: true,
      earrings: GOLD, necklace: GOLD, astrolabe: BRASS, satchel: [.4, .26, .14], maps: [.82, .74, .56] },
    c: { tunic: CREAM, trousers: [.16, .14, .14], boots: [.2, .14, .1], belt: LEATHER, coat: NAVY, coatLen: .82, coatTrim: CREAM, coatOpen: true, coatHood: 'down',
      earrings: GOLD, necklace: GOLD, astrolabe: BRASS, satchel: [.4, .26, .14], maps: [.82, .74, .56], backpack: [.5, .14, .1], backpackKind: 'roll' } },
  // Tidwulf, called Tid (Markman): broad and scarred, braided; the inn door of the Mark's town nearest a living lair, his wolf at heel
  tid: { label: 'Tidwulf, called Tid', island: 'mark', people: 'markman', g: 1, age: .5, muscle: .85, weight: .55, metres: 1.88, wolf: true,
    hairCol: [.5, .36, .2], hair: { style: 'plait', len: .7 }, beard: .9,
    a: { tunic: [.4, .34, .26], trousers: [.24, .22, .2], boots: [.2, .14, .1], belt: LEATHER, coat: [.3, .26, .2], coatLen: .6 },
    b: { tunic: [.34, .28, .2], trousers: [.2, .18, .16], boots: [.16, .11, .08], belt: LEATHER, coat: [.24, .17, .11], coatLen: .7, coatFur: FUR,
      legWraps: [.36, .32, .26], backpack: [.4, .32, .24], backpackKind: 'frame', scar: 'R', props: { skull: true } },
    c: { tunic: [.34, .28, .2], trousers: [.2, .18, .16], boots: [.16, .11, .08], belt: LEATHER, coat: [.24, .17, .11], coatLen: .7, coatFur: FUR,
      legWraps: [.36, .32, .26], backpack: [.4, .32, .24], backpackKind: 'frame', spear: [.42, .43, .45], spearHead: 'boar', scar: 'R', props: { skull: true } } },
  // Sister Elidan (Gatelander): an older woman of the shrines; the church of one Gatelands town in four, a week in each
  elidan: { label: 'Sister Elidan', island: 'gatelands', people: 'gatelander', g: 0, age: .72, muscle: .35, weight: .5, metres: 1.62,
    hairCol: [.56, .52, .48], hair: { style: 'bun', len: .6 },
    a: { tunic: [.5, .46, .38], skirtColor: [.3, .32, .24], boots: [.2, .15, .1], belt: LEATHER, wrap: [.4, .3, .26], basket: [.56, .44, .28] },
    b: { tunic: CREAM, robe: CREAM, tabard: CRIMSON, tabardLen: .85, cord: CRIMSON, boots: [.2, .15, .1], belt: LEATHER, lantern: [.22, .22, .22], props: { reliquary: true } },
    c: { tunic: CREAM, robe: CREAM, tabard: CRIMSON, tabardLen: .85, cord: CRIMSON, boots: [.2, .15, .1], belt: LEATHER, lantern: [.22, .22, .22],
      cloak: [.36, .32, .26], cloakLen: .9, hood: 'up', brooch: [.6, .6, .62], backpack: [.56, .44, .28], backpackKind: 'creel', props: { reliquary: true } } },
  // Cuimín (Old Blood): slight, grey-pale, the hair gone white with the Cold; at the door of the nearest gate with a warm stone, by day
  cuimin: { label: 'Cuimín, the reader', island: 'gatelands', people: 'oldblood', fixed: true, g: 1, age: .8, muscle: .3, weight: .22, metres: 1.6,
    hairCol: [.86, .86, .84], hair: { style: 'loose', len: .7 }, beard: .2, marks: .35,
    a: { tunic: UNDYED, trousers: [.34, .32, .28], boots: [.2, .15, .1], belt: [.24, .18, .12], wrap: [.46, .44, .4], charms: [.8, .76, .66] },
    b: { tunic: [.3, .3, .32], trousers: [.2, .2, .22], boots: [.14, .11, .09], belt: [.16, .12, .1], shoulderWrap: GREY, circlet: [.74, .74, .72], marks: .95 },
    c: { tunic: [.3, .3, .32], trousers: [.2, .2, .22], boots: [.14, .11, .09], belt: [.16, .12, .1], cloak: GREY, cloakLen: .55, cape: true, brooch: [.6, .6, .62],
      circlet: [.74, .74, .72], staff: [.4, .3, .2], staffMake: 'carved', backpack: [.5, .46, .4], backpackKind: 'roll', marks: .95 } },
  // Markos Serra (Aurennais): the house of Serra's patron of curiosities; the counting-house steps of Aurenne's capital, by day
  markos: { label: 'Markos Serra, the patron', island: 'aurenne', people: 'aurennais', g: 1, age: .55, muscle: .4, weight: .62, metres: 1.76,
    hairCol: [.06, .04, .03], hair: { style: 'short', len: .5 }, beard: .9, skin: [.6, .43, .3],
    a: { tunic: [.72, .66, .54], trousers: [.34, .28, .2], sandals: [.4, .28, .18], belt: [.4, .28, .18], sash: [.5, .2, .14], sashPrint: false },
    b: { tunic: CREAM, trousers: [.1, .08, .08], boots: [.12, .08, .06], belt: [.12, .08, .06], coat: WINE, coatLen: .8, coatTrim: GOLD, coatOpen: true, tankard: GOLD, earrings: GOLD },
    c: { tunic: CREAM, trousers: [.1, .08, .08], boots: [.12, .08, .06], belt: [.12, .08, .06], coat: WINE, coatLen: .8, coatTrim: GOLD, coatOpen: true, tankard: GOLD, earrings: GOLD,
      cloak: [.16, .03, .06], cape: true, cloakLen: .7, cloakFur: [.3, .24, .18], cloakHem: GOLD, brooch: GOLD } } };
export const ORDER = ['zahra', 'tid', 'elidan', 'cuimin', 'markos'];

// the genome: the name rolled for the face (as castGenome does), the sheet's body, then the level's whole wardrobe
export function travGenome(key, level, P) {
  const S = TRAVELLERS[key], G = P.rollGenome('trav:' + key, { people: S.people, g: S.g });
  for (const k of ['age', 'muscle', 'weight', 'hairCol', 'beard', 'skin']) if (S[k] != null) G[k] = Array.isArray(S[k]) ? S[k].slice() : S[k];
  const D = JSON.parse(JSON.stringify(S[level] || S.b)), props = D.props || {}, hair = D.hair || S.hair, scar = D.scar || null, marks = D.marks ?? S.marks;
  delete D.props; delete D.hair; delete D.scar; delete D.marks;
  G.hair = { ...hair }; G.pose = { ...(G.pose || {}), stoop: 0 }; G.scar = scar; G.marks = S.people === 'oldblood' ? (marks ?? 0) : null;
  G.dress = { ...Object.fromEntries(P.GARMENTS.map(k => [k, null])), ...P.DRESS_FLAGS, skirt: S.skirt || (S.g ? 'short' : 'long'), ...D };
  G.height = P.heightFor(G, S.metres); G.trav = key; G.props = props; return G;
}

// ── what the people kit has not ──
const lin = c => new THREE.Color().setRGB(...c, THREE.SRGBColorSpace);
const M_ = (c, o = {}) => new THREE.MeshStandardMaterial({ color: lin(c), roughness: o.r ?? .7, metalness: o.m ?? 0 });
const tris = g => (g.index ? g.index.count : g.attributes.position.count) / 3;
function bodyPts(M) {
  if (M._pts) return M._pts; const body = M.meshes.find(m => m.isSkinnedMesh) || M.meshes[0]; M.root.updateMatrixWorld(true);
  const inv = new THREE.Matrix4().copy(M.root.matrixWorld).invert(), pos = body.geometry.attributes.position, v = new THREE.Vector3(), out = new Float32Array(pos.count * 3);
  for (let i = 0; i < pos.count; i++) { body.getVertexPosition(i, v); v.applyMatrix4(body.matrixWorld).applyMatrix4(inv); out[i * 3] = v.x; out[i * 3 + 1] = v.y; out[i * 3 + 2] = v.z; }
  return M._pts = out;
}
function slice(M, y, dy = .012, o = {}) {
  const P = bodyPts(M); let x0 = 1e9, x1 = -1e9, z0 = 1e9, z1 = -1e9;
  for (let i = 0; i < P.length; i += 3) { const x = P[i], yy = P[i + 1], z = P[i + 2]; if (Math.abs(yy - y) > dy) continue; if (o.maxX != null && Math.abs(x) > o.maxX) continue;
    x0 = Math.min(x0, x); x1 = Math.max(x1, x); z0 = Math.min(z0, z); z1 = Math.max(z1, z); }
  return { x0, x1, z0, z1, cx: (x0 + x1) / 2, cz: (z0 + z1) / 2 };
}

// a horned skull (Tid's trophy; a wild ram's, the Mark's hill sheep): a cranium 13 cm across, the long face 17 cm, two horns curling
// back and down, about 38 cm along the curl, ringed; built facing +z, its top +y
export function hornedSkull() {
  const g = new THREE.Group(), bone = M_([.8, .74, .6], { r: .75 }), horn = M_([.46, .4, .3], { r: .6 }), dark = M_([.08, .06, .05], { r: 1 });
  const cran = new THREE.Mesh(new THREE.SphereGeometry(.065, 14, 10), bone); cran.scale.set(1, .85, 1.05); g.add(cran);
  const face = new THREE.Mesh(new THREE.CylinderGeometry(.024, .05, .13, 10), bone); face.rotation.x = Math.PI / 2 + 1.0; face.position.set(0, -.07, .045); face.scale.z = .7; g.add(face);
  for (const sx of [-1, 1]) { const eye = new THREE.Mesh(new THREE.SphereGeometry(.012, 8, 6), dark); eye.position.set(sx * .038, -.014, .047); eye.scale.set(1, .8, .45); g.add(eye);
    // the horn: from the crown it sweeps out to the side and round in a spiral in the side's own plane, back, down and forward past the cheek
    const pts = []; for (let i = 0; i <= 36; i++) { const t = i / 36, th = Math.PI / 2 + t * Math.PI * 1.6, r = .085 * (1 - .4 * t);
      pts.push(new THREE.Vector3(sx * (.05 + .11 * Math.min(1, t * 1.4)), .0 + Math.sin(th) * r, .01 + Math.cos(th) * r * .7)); }
    // the horn as a chain of tapering, ringed frusta from point to point (2.2 cm at the root to 0.6 at the tip)
    for (let i = 0; i < pts.length - 1; i++) { const p0 = pts[i], p1 = pts[i + 1], d = p1.clone().sub(p0), L = d.length(), t = i / (pts.length - 1), r0 = (.022 - .016 * t) * (i % 3 ? 1 : 1.1), r1 = .022 - .016 * (i + 1) / (pts.length - 1);
      const seg = new THREE.Mesh(new THREE.CylinderGeometry(r1, r0, L * 1.08, 8, 1, true), horn); seg.position.copy(p0).addScaledVector(d, .5);
      seg.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize()); g.add(seg); }
    const tip = new THREE.Mesh(new THREE.SphereGeometry(.006, 6, 4), horn); tip.position.copy(pts.at(-1)); g.add(tip); }
  return g;
}
// the reliquary (Elidan's box of what the gates give back): oak, 13 by 8 by 9 cm, a gabled lid, gilt bands at the corners and the ridge,
// a strap's loop to the belt; ~400 tris
export function reliquary() {
  const g = new THREE.Group(), oak = M_([.3, .19, .1], { r: .7 }), gilt = M_(GOLD, { r: .3, m: .9 });
  const box = new THREE.Mesh(new THREE.BoxGeometry(.13, .07, .08), oak); g.add(box);
  for (const s of [-1, 1]) { const roof = new THREE.Mesh(new THREE.BoxGeometry(.136, .006, .052), oak); roof.position.set(0, .047, s * .02); roof.rotation.x = s * .62; g.add(roof); }
  const ridge = new THREE.Mesh(new THREE.CylinderGeometry(.004, .004, .14, 6), gilt); ridge.rotation.z = Math.PI / 2; ridge.position.y = .064; g.add(ridge);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) { const b = new THREE.Mesh(new THREE.BoxGeometry(.008, .074, .008), gilt); b.position.set(sx * .063, 0, sz * .038); g.add(b); }
  const band = new THREE.Mesh(new THREE.BoxGeometry(.134, .008, .084), gilt); band.position.y = -.03; g.add(band);
  const stone = new THREE.Mesh(new THREE.SphereGeometry(.007, 8, 6), M_([.5, .05, .06], { r: .2, m: .2 })); stone.position.set(0, .005, .042); g.add(stone);
  const loop = new THREE.Mesh(new THREE.TorusGeometry(.016, .003, 4, 10, Math.PI), M_(LEATHER)); loop.position.y = .07; loop.rotation.y = Math.PI / 2; g.add(loop);
  return g;
}

export function travProps(M, G) {
  const p = G.props || {}, out = new THREE.Group(); out.name = 'travProps'; let n = 0;
  if (p.skull) { const bp = M.root.getObjectByName('backpack'); if (bp) { const s = hornedSkull(); s.name = 'skull';
    // on the bundle's back, high on the frame, its face out from the pack (the pack's own frame: +z out of the back, +y up its back)
    s.position.set(0, -.2, .27); s.rotation.x = .1; bp.add(s); s.traverse(o => { if (o.isMesh) { o.castShadow = true; n += tris(o.geometry); } }); } }
  if (p.reliquary) { const PP = bodyPts(M); let top = -1e9, bot = 1e9; for (let i = 1; i < PP.length; i += 3) { top = Math.max(top, PP[i]); bot = Math.min(bot, PP[i]); }
    const yB = bot + (top - bot) * .565, s = slice(M, yB, .012, { maxX: .26 }), r = reliquary();
    r.position.set(s.x1 + .03, yB - .07, s.cz + .03); r.rotation.y = Math.PI / 2 - .35; r.rotation.z = .05; out.add(r); }
  out.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; n += tris(o.geometry); } }); M.root.add(out); return Math.round(n);
}
