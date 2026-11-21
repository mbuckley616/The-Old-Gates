// Families and feuds (the concept artist, 21 Nov 2026; backlog L2, "Families and feuds", OG-090; the quest writer's *Families and Feuds*,
// drafted 21 Nov, unapproved): sheet E12 drew five houses, each a head, a family turnaround and a scene: House Velasco (Aurennais
// nobility, a dark-skinned woman in white with gold and teal, ledgers, an astrolabe, a blue banner), the Ironmere Clan (red-bearded Markmen
// in heavy furs, an axe, a blue banner, a feud), the Caelmont House (a Gatelander lord in plate under a blue cloak with a gold lion), the
// Sorrowvale Lines (Old Blood, drawn white-haired) and the Redmarsh Syndicate (smugglers in red sashes and headscarves). The draft's
// corrections hold at every level: Velasco is the house Velleius (the register's Roman root); Caelmont wears the Crown's crimson, not blue
// (§1.5); the Old Blood are black-haired (Muirgel's gone white with age, Ciarnait's black); the Mark has no clans, so the Ironmeres are one
// hall of a free town, and their feud is with the Stannards at its other end; the Redmarsh are a fen family, the Syndicate being the
// Compact's ledger-word for them. The eleven are the draft's: Marcia Velleia and Kallias Velleius; Godgifu Ironmere and Brand, Leofric
// Stannard and Wynn; Lady Clémence de Caelmont and Amaury; Muirgel and Ciarnait of Gleann an Bhróin; Muireann of the Redmarsh.
//
// The question is how a family shows that it is one, three levels:
//   a  by their people and station: each member dressed as their people and work dress them (a Factor's good gown and ledger, a clerk's
//      habit, old Markmen in wool, a lord's chain, an Old Blood elder's grey, a fen woman's working clothes); kin found by name and seat;
//   b  the draft's faces and one sign of the house (recommended): the draft's faces for the bodies builder (Marcia's white stole over blue
//      and her seal, Kallias's Church shuttle at the throat, Gifu's stick, Leofric's leather at the forge, the grandchildren in the yard's
//      leathers, Clémence in crimson with the gold collar of office, Amaury's crimson gone brown and his cloak torn short, the marks on
//      the glen's two, Muireann's oilskin and pole), and one sign every member of a house wears: the Velleii's white stole edged in gold,
//      Ironmere's blue at the hem and cuff, Stannard's ochre, Caelmont's crimson with a gold brooch, the glen's dot-stitching and the
//      marks themselves, the Redmarsh's red sash and headscarf;
//   c  OG-090 as drawn, its corrections kept: b, and each house's banner on its pole beside its people (the Velleii's blue with a gold
//      armillary, Ironmere's blue with a white peak, Stannard's ochre with a black anvil, Caelmont's crimson with the gold lion), the
//      Ironmeres in heavy furs, Amaury in plate under a crimson tabard with the lion in gold and his helm on, the glen's stone of pale
//      lines (touched, not read), and the Redmarsh's fen punt with a red lantern on its pole.
// FAMILIES[key] is the sheet; famGenome(key, level, P) makes the genome (P carries people.js's rollGenome, heightFor, GARMENTS and
// DRESS_FLAGS). famProps(M, G) adds what people.js does not have (the punt pole, the lion from rivals.js) and returns its triangles;
// houseBanner(house), glenStone() and fenPunt() are the set pieces of c, each in its own frame in metres. Colours are linear [r,g,b].
import * as THREE from 'three';
import { lion, lionShape } from './rivals.js';
import { cageLantern } from './faith.js';

const GOLD = [.74, .56, .2], IRON = [.42, .43, .45], WHITE = [.86, .85, .8], CRIMSON = [.46, .07, .06], BLUE = [.1, .2, .46], TEAL = [.06, .36, .36],
  IRONBLUE = [.08, .16, .38], OCHRE = [.6, .4, .08], WOLF = [.52, .5, .47], FUR = [.46, .36, .26], UNDYED = [.62, .58, .5], GREY = [.36, .35, .34],
  LEATHER = [.26, .17, .1], RED = [.56, .07, .05], OIL = [.3, .27, .12], STEEL = [.6, .62, .64], DARK = [.12, .12, .14];

export const HOUSES = {
  velleii: { label: 'The house Velleius', people: 'Aurennais', members: ['marcia', 'kallias'] },
  ironmere: { label: 'The Ironmeres', people: 'Markmen', members: ['gifu', 'brand'] },
  stannard: { label: 'The Stannards', people: 'Markmen', members: ['leofric', 'wynn'] },
  caelmont: { label: 'The house of Caelmont', people: 'Gatelander, Crown-born', members: ['clemence', 'amaury'] },
  glen: { label: 'The lines of Gleann an Bhróin', people: 'Old Blood', members: ['muirgel', 'ciarnait'] },
  redmarsh: { label: 'The Redmarsh', people: 'Gatelander', members: ['muireann'] } };

export const FAMILIES = {
  // Marcia Velleia, Factor of the port: tall, deep brown, grey at the temples; a white stole over blue, the house's seal
  marcia: { house: 'velleii', label: 'Marcia Velleia, Factor', people: 'aurennais', g: 0, age: .66, muscle: .4, weight: .42, metres: 1.78,
    hairCol: [.3, .28, .27], hair: { style: 'bun', len: .6 }, skin: [.17, .1, .065],
    a: { tunic: [.7, .62, .48], skirtColor: [.5, .36, .22], skirt: 'long', sandals: [.4, .28, .18], belt: [.4, .28, .18], book: [.32, .18, .1] },
    b: { tunic: BLUE, skirtColor: BLUE, skirt: 'long', sandals: [.36, .24, .14], belt: [.3, .2, .12], sash: WHITE, sashBorder: GOLD, sashPrint: false, sashKnot: false,
      earrings: GOLD, seal: GOLD, book: [.12, .18, .4], bookGilt: GOLD },
    c: { tunic: WHITE, skirtColor: WHITE, skirt: 'long', sandals: [.36, .24, .14], belt: [.3, .2, .12], sash: BLUE, sashBorder: GOLD, sashPrint: false, sashKnot: false, gownBorder: TEAL,
      earrings: GOLD, necklace: GOLD, circlet: GOLD, circletStone: TEAL, seal: GOLD, book: [.12, .18, .4], bookGilt: GOLD } },
  // Kallias Velleius, a Prior's clerk: her younger brother, slighter; the house's son given to the Church
  kallias: { house: 'velleii', label: 'Kallias Velleius, a Prior’s clerk', people: 'aurennais', g: 1, age: .44, muscle: .32, weight: .26, metres: 1.73,
    hairCol: [.05, .04, .035], hair: { style: 'short', len: .35 }, beard: .1, skin: [.2, .12, .08],
    a: { tunic: [.62, .58, .5], robe: [.62, .58, .5], skirtColor: [.62, .58, .5], cord: [.4, .3, .2], sandals: [.4, .28, .18], book: [.3, .2, .12] },
    b: { tunic: WHITE, robe: [.52, .47, .38], skirtColor: [.52, .47, .38], cord: [.4, .3, .2], sandals: [.36, .24, .14], sash: WHITE, sashBorder: GOLD, sashPrint: false, sashKnot: false,
      shuttle: [.62, .62, .6], book: [.12, .18, .4], bookGilt: GOLD },
    c: { tunic: WHITE, robe: WHITE, skirtColor: WHITE, cord: GOLD, sandals: [.36, .24, .14], sash: BLUE, sashBorder: GOLD, sashPrint: false, sashKnot: false,
      shuttle: [.62, .62, .6], book: [.12, .18, .4], bookGilt: GOLD } },
  // Godgifu Ironmere, Old Gifu: old and broad, ash-white; a stick she does not need
  gifu: { house: 'ironmere', label: 'Godgifu Ironmere, Old Gifu', people: 'markman', g: 0, age: .93, muscle: .6, weight: .72, metres: 1.7,
    hairCol: [.84, .83, .8], hair: { style: 'bun', len: .7 }, pose: { stoop: .12 },
    a: { tunic: [.42, .38, .3], skirtColor: [.3, .27, .22], boots: [.22, .15, .1], belt: LEATHER, staff: [.4, .3, .2], staffMake: 'hazel' },
    b: { tunic: [.4, .36, .3], skirtColor: [.26, .24, .2], boots: [.2, .14, .1], belt: LEATHER, cuffs: IRONBLUE,
      cloak: [.24, .24, .25], cape: true, cloakLen: .85, cloakFur: WOLF, cloakHem: IRONBLUE, brooch: IRON, staff: [.4, .3, .2], staffMake: 'hazel' },
    c: { tunic: [.4, .36, .3], skirtColor: [.26, .24, .2], boots: [.2, .14, .1], belt: LEATHER, cuffs: IRONBLUE,
      cloak: FUR, cape: true, cloakLen: 1, cloakFur: [.58, .52, .44], cloakHem: IRONBLUE, brooch: IRON, staff: [.4, .3, .2], staffMake: 'hazel' } },
  // Brand Ironmere, her grandson, nineteen: in the yard's leathers
  brand: { house: 'ironmere', label: 'Brand Ironmere', people: 'markman', g: 1, age: .28, muscle: .8, weight: .4, metres: 1.86,
    hairCol: [.5, .2, .08], hair: { style: 'tail', len: .5 }, beard: .35,
    a: { tunic: [.44, .4, .32], trousers: [.26, .24, .2], boots: [.22, .15, .1], belt: LEATHER },
    b: { tunic: [.4, .36, .3], trousers: [.22, .2, .18], boots: [.2, .14, .1], belt: LEATHER, waistcoat: LEATHER, waistcoatLeather: true, cuffs: IRONBLUE,
      sword: IRON, swordMake: 'norse' },
    c: { tunic: [.4, .36, .3], trousers: [.22, .2, .18], boots: [.2, .14, .1], belt: LEATHER, waistcoat: LEATHER, waistcoatLeather: true, cuffs: IRONBLUE,
      cloak: FUR, cape: true, cloakLen: .75, cloakFur: [.58, .52, .44], cloakHem: IRONBLUE, brooch: IRON, sword: IRON, swordMake: 'norse' } },
  // Leofric Stannard, Half-Ear: old and broad, ash-white, the best hand with a hammer on the strait
  leofric: { house: 'stannard', label: 'Leofric Stannard, Half-Ear', people: 'markman', g: 1, age: .92, muscle: .85, weight: .72, metres: 1.84,
    hairCol: [.84, .83, .8], hair: { style: 'tail', len: .5 }, beard: .9,
    a: { tunic: [.42, .38, .3], trousers: [.26, .24, .2], boots: [.22, .15, .1], belt: LEATHER, apron: [.3, .2, .12], apronLeather: true, hammer: [.4, .3, .2] },
    b: { tunic: [.38, .35, .3], trousers: [.22, .2, .18], boots: [.2, .14, .1], belt: LEATHER, apron: [.3, .2, .12], apronLeather: true, sleevesRolled: true, cuffs: OCHRE,
      cloak: [.26, .25, .24], cape: true, cloakLen: .6, cloakHem: OCHRE, brooch: IRON, hammer: [.4, .3, .2] },
    c: { tunic: [.38, .35, .3], trousers: [.22, .2, .18], boots: [.2, .14, .1], belt: LEATHER, apron: [.3, .2, .12], apronLeather: true, cuffs: OCHRE,
      cloak: FUR, cape: true, cloakLen: .9, cloakFur: [.58, .52, .44], cloakHem: OCHRE, brooch: IRON, hammer: [.4, .3, .2] } },
  // Wynn Stannard, his granddaughter, twenty: in the yard's leathers; "I don't want it"
  wynn: { house: 'stannard', label: 'Wynn Stannard', people: 'markman', g: 0, age: .3, muscle: .7, weight: .35, metres: 1.76,
    hairCol: [.78, .7, .52], hair: { style: 'plait', len: .7 },
    a: { skirt: 'short', tunic: [.44, .4, .32], trousers: [.26, .24, .2], boots: [.22, .15, .1], belt: LEATHER },
    b: { skirt: 'short', tunic: [.4, .36, .3], trousers: [.22, .2, .18], boots: [.2, .14, .1], belt: LEATHER, waistcoat: LEATHER, waistcoatLeather: true, cuffs: OCHRE,
      sword: IRON, swordMake: 'norse' },
    c: { skirt: 'short', tunic: [.4, .36, .3], trousers: [.22, .2, .18], boots: [.2, .14, .1], belt: LEATHER, waistcoat: LEATHER, waistcoatLeather: true, cuffs: OCHRE,
      cloak: FUR, cape: true, cloakLen: .75, cloakFur: [.58, .52, .44], cloakHem: OCHRE, brooch: IRON, sword: IRON, swordMake: 'norse' } },
  // Lady Clémence de Caelmont, lord of the city: the Crown's crimson by right, the gold collar of office
  clemence: { house: 'caelmont', label: 'Lady Clémence de Caelmont', people: 'gatelander', g: 0, age: .7, muscle: .4, weight: .5, metres: 1.7,
    hairCol: [.4, .34, .3], hair: { style: 'bun', len: .7 },
    a: { tunic: [.3, .24, .22], skirtColor: [.24, .2, .18], skirt: 'long', boots: [.2, .13, .09], belt: [.2, .13, .09], necklace: GOLD },
    b: { tunic: CRIMSON, skirtColor: CRIMSON, skirt: 'long', boots: [.16, .1, .07], belt: [.16, .1, .07], necklace: GOLD, gownBorder: GOLD,
      cloak: CRIMSON, cape: true, cloakLen: .95, cloakHem: GOLD, brooch: GOLD },
    c: { tunic: CRIMSON, skirtColor: CRIMSON, skirt: 'long', boots: [.16, .1, .07], belt: [.16, .1, .07], necklace: GOLD, gownBorder: GOLD, circlet: GOLD,
      cloak: CRIMSON, cape: true, cloakLen: 1, cloakFur: [.62, .58, .52], cloakHem: GOLD, brooch: GOLD } },
  // Amaury de Caelmont, her son: four days at a gate's door; the crimson gone brown with mud, the cloak torn
  amaury: { house: 'caelmont', label: 'Amaury de Caelmont', people: 'gatelander', g: 1, age: .34, muscle: .7, weight: .4, metres: 1.82,
    hairCol: [.3, .2, .12], hair: { style: 'loose', len: .4 }, beard: .2,
    a: { tunic: [.4, .3, .22], trousers: [.24, .2, .16], boots: [.2, .14, .1], belt: LEATHER, sword: STEEL, swordMake: 'arming' },
    b: { tunic: [.3, .11, .07], trousers: [.24, .2, .15], boots: [.24, .19, .12], belt: LEATHER, cloak: [.28, .12, .08], cape: true, cloakLen: .5, brooch: GOLD,
      sword: STEEL, swordMake: 'arming' },
    c: { tunic: [.4, .36, .3], trousers: [.2, .17, .14], boots: [.14, .1, .07], belt: [.14, .1, .07], mail: STEEL, plate: 'plate', vambrace: STEEL, vambraceKind: 'sheet',
      gloves: STEEL, glovesKind: 'sheet', greaves: STEEL, greavesKind: 'sheet', cuisses: true, tabard: CRIMSON, tabardTrim: GOLD, tabardLen: .85,
      cloak: CRIMSON, cape: true, cloakLen: 1, cloakHem: GOLD, brooch: GOLD, helm: STEEL, tier: 4, sword: STEEL, swordMake: 'arming', props: { lion: 'gold' } } },
  // Muirgel, the eldest of the glen: small, grey-pale, black hair gone white, the marks at both wrists and the backs of the hands
  muirgel: { house: 'glen', label: 'Muirgel, the eldest', people: 'oldblood', fixed: true, g: 0, age: .95, muscle: .25, weight: .3, metres: 1.52,
    hairCol: [.74, .74, .74], hair: { style: 'loose', len: .8 }, pose: { stoop: .3 }, marks: { a: .06, b: .45, c: .45 },
    a: { tunic: GREY, skirtColor: [.3, .29, .28], skirt: 'long', boots: [.2, .15, .1], belt: [.2, .15, .1] },
    b: { tunic: UNDYED, robe: UNDYED, skirtColor: UNDYED, boots: [.2, .15, .1], cord: [.3, .26, .2], dots: [.16, .16, .18], amulet: [.5, .5, .48],
      cloak: GREY, cape: true, cloakLen: .7 },
    c: { tunic: DARK, robe: DARK, skirtColor: DARK, boots: [.2, .15, .1], cord: [.3, .26, .2], dots: [.7, .68, .6], amulet: [.5, .5, .48], charms: [.78, .74, .64],
      cloak: [.16, .16, .19], cape: true, cloakLen: 1 } },
  // Ciarnait, thirteen: black-haired, the marks new at one wrist, late
  ciarnait: { house: 'glen', label: 'Ciarnait, thirteen', people: 'oldblood', fixed: true, child: true, g: 0, age: .14, metres: 1.5,
    hairCol: [.04, .035, .035], hair: { style: 'plait', len: .7 }, marks: { a: 0, b: .14, c: .14 },
    a: { tunic: [.5, .46, .38], skirtColor: [.34, .3, .26], skirt: 'long', boots: [.2, .15, .1], belt: [.2, .15, .1] },
    b: { tunic: UNDYED, skirtColor: [.44, .42, .38], skirt: 'long', boots: [.2, .15, .1], belt: [.2, .15, .1], dots: [.16, .16, .18] },
    c: { tunic: DARK, skirtColor: DARK, skirt: 'long', boots: [.2, .15, .1], belt: [.2, .15, .1], dots: [.7, .68, .6], cloak: [.16, .16, .19], cape: true, cloakLen: .8 } },
  // Muireann of the Redmarsh, who keeps its boats: red-haired, a fen-man's oilskin, a pole over her shoulder
  muireann: { house: 'redmarsh', label: 'Muireann of the Redmarsh', people: 'gatelander', g: 0, age: .44, muscle: .7, weight: .4, metres: 1.72,
    hairCol: [.55, .17, .05], hair: { style: 'loose', len: .7 },
    a: { skirt: 'short', tunic: [.46, .42, .32], trousers: [.28, .26, .2], boots: [.2, .15, .1], belt: LEATHER, legWraps: [.4, .36, .28] },
    b: { skirt: 'short', tunic: [.46, .42, .32], trousers: [.28, .26, .2], boots: [.16, .12, .08], belt: LEATHER, coat: OIL, coatLen: .75, coatOpen: true, sash: RED, sashPrint: false,
      wrap: RED, scarf: true, props: { pole: true } },
    c: { skirt: 'short', tunic: [.46, .42, .32], trousers: [.28, .26, .2], boots: [.16, .12, .08], belt: LEATHER, coat: OIL, coatLen: .75, coatOpen: true, sash: RED, sashPrint: false,
      wrap: RED, scarf: true, earrings: GOLD, props: { pole: true } } } };
export const ORDER = ['marcia', 'kallias', 'gifu', 'brand', 'leofric', 'wynn', 'clemence', 'amaury', 'muirgel', 'ciarnait', 'muireann'];

// the genome: the name rolled for the face (as castGenome does), the sheet's body, then the level's whole wardrobe
export function famGenome(key, level, P) {
  const S = FAMILIES[key], G = P.rollGenome('family:' + key, { people: S.people, g: S.g, child: !!S.child });
  for (const k of ['age', 'muscle', 'weight', 'hairCol', 'beard', 'skin']) if (S[k] != null) G[k] = Array.isArray(S[k]) ? S[k].slice() : S[k];
  const D = JSON.parse(JSON.stringify(S[level] || S.b)), props = D.props || {}; delete D.props;
  G.hair = { ...S.hair }; G.pose = { ...(G.pose || {}), stoop: 0, ...(S.pose || {}) }; G.scar = null; G.marks = S.marks ? S.marks[level] : null;
  const skirt = D.skirt || (D.robe ? 'long' : (S.g ? 'short' : 'long')); delete D.skirt;
  G.dress = { ...Object.fromEntries(P.GARMENTS.map(k => [k, null])), ...P.DRESS_FLAGS, skirt, ...D };
  G.height = P.heightFor(G, S.metres); G.family = key; G.props = props; return G;
}

// ── what the people kit has not ──
const lin = c => new THREE.Color().setRGB(...c, THREE.SRGBColorSpace);
const M_ = (c, o = {}) => new THREE.MeshStandardMaterial({ color: lin(c), roughness: o.r ?? .7, metalness: o.m ?? 0, side: o.ds ? THREE.DoubleSide : THREE.FrontSide,
  emissive: o.e ? lin(o.e) : 0x000000, emissiveIntensity: o.ei ?? 1, map: o.map || null, bumpMap: o.bump || null, bumpScale: o.bs ?? 1 });
const tris = g => (g.index ? g.index.count : g.attributes.position.count) / 3;
const cyl = (r0, r1, L, n, m) => new THREE.Mesh(new THREE.CylinderGeometry(r1, r0, L, n), m);
const box = (w, h, d, m) => new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m);
const at = (o, x, y, z) => { o.position.set(x, y, z); return o; };
const along = (o, a, b) => { const d = b.clone().sub(a); o.position.copy(a).addScaledVector(d, .5); o.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize()); return o; };
const bonePos = (M, n) => { M.root.updateMatrixWorld(true); return M.root.worldToLocal(M.byName[n].getWorldPosition(new THREE.Vector3())); };
function canvasTex(w, h, draw) { const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t; }

// a fen pole: ash, 3.4 m, an iron shoe and a forked foot for the mud; laid over the right shoulder, the foot forward and low
export function fenPole() {
  const g = new THREE.Group(), ash = M_([.56, .44, .3], { r: .7 }), iron = M_([.3, .3, .31], { r: .5, m: .7 });
  const p = cyl(.02, .02, 3.4, 8, ash); p.position.y = 1.7; g.add(p);
  const sh = cyl(.022, .016, .12, 8, iron); sh.position.y = .06; g.add(sh);
  for (const s of [1, -1]) { const f = cyl(.008, .012, .16, 5, iron); f.position.set(s * .03, -.05, 0); f.rotation.z = s * .4; g.add(f); }
  return g;
}

// the props on a made body, in the root's frame (the slice's people stand still: placed once on the rest body)
export function famProps(M, G) {
  const p = G.props || {}, out = new THREE.Group(); out.name = 'famProps'; const stats = {};
  if (p.lion) { const l = lion(M, p.lion); if (l) out.add(l); }
  if (p.pole) { // from behind the right shoulder (the wearer's right is -x), over it, down to the right hand's height ahead
    const sh = bonePos(M, 'upperarm01.R'), w = bonePos(M, 'wrist.R'), a = new THREE.Vector3(sh.x - .02, sh.y + .07, sh.z), dir = new THREE.Vector3(0, -.52, 1).normalize();
    const pole = fenPole(), base = a.clone().addScaledVector(dir, 1.1), top = a.clone().addScaledVector(dir, -2.3);
    pole.position.copy(base); pole.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), top.clone().sub(base).normalize()); out.add(pole); stats.pole = 3.4; stats.wristY = +w.y.toFixed(2); }
  let n = 0; out.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; n += tris(o.geometry); } }); M.root.add(out); return { tris: Math.round(n), ...stats };
}

// ── the set pieces of c, each in its own frame in metres, its foot at 0, its face +z ──
const DEVICE = {
  // the Velleii: a gold armillary (the sheet's astrolabe) on blue, a teal border
  velleii: { field: '#1c3270', edge: '#1f6a68', draw: (x, w, h) => { x.strokeStyle = '#d8b04a'; x.lineWidth = 9; const cx = w / 2, cy = h * .42, r = w * .26;
    x.beginPath(); x.arc(cx, cy, r, 0, Math.PI * 2); x.stroke(); for (const k of [.35, .75]) { x.beginPath(); x.ellipse(cx, cy, r, r * k, 0, 0, Math.PI * 2); x.stroke(); }
    x.beginPath(); x.ellipse(cx, cy, r * .4, r, 0, 0, Math.PI * 2); x.stroke(); x.lineWidth = 6; x.beginPath(); x.moveTo(cx - r * 1.2, cy + r * .5); x.lineTo(cx + r * 1.2, cy - r * .5); x.stroke(); } },
  // Ironmere: a white peak over blue water lines, on Markish blue
  ironmere: { field: '#16244e', edge: '#c9ccd2', draw: (x, w, h) => { x.fillStyle = '#e4e4e0'; x.beginPath(); x.moveTo(w * .18, h * .58); x.lineTo(w * .42, h * .2); x.lineTo(w * .52, h * .34);
    x.lineTo(w * .62, h * .26); x.lineTo(w * .84, h * .58); x.closePath(); x.fill(); x.strokeStyle = '#e4e4e0'; x.lineWidth = 7; for (const y of [.66, .72]) { x.beginPath(); for (let i = 0; i <= 20; i++) x.lineTo(w * (.2 + .6 * i / 20), h * y + 6 * Math.sin(i * 1.5)); x.stroke(); } } },
  // Stannard: a black anvil on ochre
  stannard: { field: '#a06c18', edge: '#2a2018', draw: (x, w, h) => { x.fillStyle = '#1e1a16'; x.beginPath(); x.moveTo(w * .16, h * .3); x.lineTo(w * .8, h * .3); x.quadraticCurveTo(w * .7, h * .38, w * .62, h * .4);
    x.lineTo(w * .58, h * .5); x.lineTo(w * .7, h * .6); x.lineTo(w * .3, h * .6); x.lineTo(w * .42, h * .5); x.lineTo(w * .38, h * .4); x.quadraticCurveTo(w * .22, h * .38, w * .16, h * .3); x.fill(); } },
  // Caelmont: the gold lion rampant on the Crown's crimson
  caelmont: { field: '#7a1410', edge: '#d8b04a', draw: (x, w, h) => { const s = w * .62, ox = w * .52, oy = h * .66; x.fillStyle = '#d8b04a'; x.strokeStyle = '#5a3a10'; x.lineWidth = 3;
    for (const sh of lionShape()) { x.beginPath(); sh.getPoints(4).forEach((p, i) => { const X = ox - p.x * s, Y = oy - p.y * s; i ? x.lineTo(X, Y) : x.moveTo(X, Y); }); x.closePath(); x.fill(); x.stroke(); } } } };
// a house's banner: an ash pole 3.6 m in an iron-banded oak foot, a crossbar 0.9 m, the cloth 0.82 by 1.4 m hanging from it with a little
// wind in it, its foot cut in three tongues, the device painted on both faces
export function houseBanner(house) {
  const D = DEVICE[house], g = new THREE.Group(), ash = M_([.5, .38, .24], { r: .7 }), iron = M_([.24, .24, .25], { r: .5, m: .7 }), oak = M_([.3, .22, .14], { r: .85 });
  g.add(at(box(.36, .14, .36, oak), 0, .07, 0)); g.add(at(box(.38, .03, .38, iron), 0, .13, 0));
  const pole = cyl(.025, .022, 3.6, 10, ash); pole.position.y = 1.8; g.add(pole);
  const fin = new THREE.Mesh(new THREE.ConeGeometry(.04, .16, 8), M_(GOLD, { r: .35, m: .8 })); fin.position.y = 3.68; g.add(fin);
  const bar = cyl(.014, .014, .92, 8, ash); bar.rotation.z = Math.PI / 2; bar.position.set(0, 3.4, .03); g.add(bar);
  const W = .82, H = 1.4, tex = canvasTex(256, 440, (x, w, h) => { x.fillStyle = D.field; x.fillRect(0, 0, w, h); x.strokeStyle = D.edge; x.lineWidth = 16; x.strokeRect(8, 8, w - 16, h - 16); D.draw(x, w, h); });
  const geo = new THREE.PlaneGeometry(W, H, 10, 16), p = geo.attributes.position, uv = geo.attributes.uv;
  for (let i = 0; i < p.count; i++) { const x = p.getX(i), y = p.getY(i), t = (H / 2 - y) / H; p.setZ(i, .05 * t * Math.sin(x * 8 + y * 4));
    if (y < -H / 2 + .15) { const k = Math.abs(Math.sin((x / W + .5) * Math.PI * 3)); p.setY(i, y + .15 * (1 - k)); } uv.setXY(i, x / W + .5, (p.getY(i) + H / 2) / H); }
  geo.computeVertexNormals(); const cloth = new THREE.Mesh(geo, M_([1, 1, 1], { r: .9, map: tex, ds: true })); cloth.position.set(0, 3.4 - H / 2 - .01, .03); g.add(cloth);
  return g;
}
// the glen's stone: a grey-pale slab 1.45 m, rough-sided, the marks' pale lines running through its face (an emissive map, faint), worn
// smooth at hand height where it is touched; set in turf
export function glenStone() {
  const g = new THREE.Group(), lines = canvasTex(256, 512, (x, w, h) => { x.fillStyle = '#000'; x.fillRect(0, 0, w, h); x.strokeStyle = '#9fb4c4'; x.lineWidth = 3;
    const R = (i => () => (i = (i * 16807) % 2147483647) / 2147483647)(5); for (let k = 0; k < 9; k++) { let px = 30 + R() * 196, py = 20 + R() * 60; x.beginPath(); x.moveTo(px, py);
      for (let s = 0; s < 24; s++) { px += (R() - .5) * 26; py += 14 + R() * 8; x.lineTo(px, py); } x.stroke(); } });
  const m = new THREE.MeshStandardMaterial({ color: lin([.5, .5, .5]), roughness: .95, emissive: new THREE.Color(1, 1, 1), emissiveMap: lines, emissiveIntensity: .35 });
  const geo = new THREE.BoxGeometry(.62, 1.45, .3, 4, 8, 2), p = geo.attributes.position;
  for (let i = 0; i < p.count; i++) { const y = p.getY(i), x = p.getX(i), t = (y + .725) / 1.45; p.setX(i, x * (1 - .25 * t * t) + .02 * Math.sin(y * 9)); p.setZ(i, p.getZ(i) * (1 - .2 * t) + .015 * Math.sin(x * 13 + y * 5)); if (t > .9) p.setY(i, y - .12 * Math.abs(x) * 2); }
  geo.computeVertexNormals(); const s = new THREE.Mesh(geo, m); s.position.y = .725 - .08; s.rotation.y = .12; g.add(s);
  return g;
}
// the Redmarsh's punt, drawn up on the bank: a flat-bottomed boat 4.2 m by 1.0 m, its sides 0.32 m, both ends raked up, three thwarts, a
// stern post 2.6 m carrying a red-glassed lantern lit (the fen's own signal), two eel traps of withy in the bottom
export function fenPunt() {
  const g = new THREE.Group(), tar = M_([.27, .22, .17], { r: .85, ds: true }), oak = M_([.42, .32, .2], { r: .8 }), withy = M_([.5, .4, .24], { r: .9, ds: true });
  const L = 4.2, B = 1.0, Hs = .32, rake = .55, bed = box(L - 2 * rake, .05, B, tar); bed.position.y = .1; g.add(bed);
  for (const s of [1, -1]) { const rk = box(rake * 1.15, .05, B, tar); rk.position.set(s * (L / 2 - rake / 2), .22, 0); rk.rotation.z = s * .45; g.add(rk);
    const side = new THREE.Shape(); side.moveTo(-L / 2, Hs + .2); side.lineTo(-L / 2 + rake, .08); side.lineTo(L / 2 - rake, .08); side.lineTo(L / 2, Hs + .2); side.lineTo(L / 2 - .05, Hs + .27); side.lineTo(-L / 2 + .05, Hs + .27); side.closePath();
    const sg = new THREE.Mesh(new THREE.ExtrudeGeometry(side, { depth: .035, bevelEnabled: false }), tar); sg.position.z = s * B / 2 - (s > 0 ? .035 : 0); g.add(sg);
    const end = box(.05, .3, B, tar); end.position.set(s * L / 2, Hs + .07, 0); g.add(end); }
  for (const x of [-1.1, 0, 1.1]) g.add(at(box(.18, .035, B - .04, oak), x, .3, 0));
  for (const [x, z] of [[.55, .2], [-.6, -.15]]) { const t = new THREE.Mesh(new THREE.CylinderGeometry(.13, .1, .55, 10, 1, true), withy); t.rotation.z = Math.PI / 2; t.position.set(x, .24, z); g.add(t);
    const c = new THREE.Mesh(new THREE.ConeGeometry(.13, .22, 10, 1, true), withy); c.rotation.z = -Math.PI / 2; c.position.set(x + .38, .24, z); g.add(c); }
  const post = cyl(.03, .028, 2.6, 8, oak); post.position.set(-L / 2 + .35, 1.3, 0); g.add(post);
  const arm = cyl(.012, .012, .4, 6, M_([.2, .2, .2], { m: .7, r: .5 })); arm.rotation.z = Math.PI / 2; arm.position.set(-L / 2 + .35 + .2, 2.55, 0); g.add(arm);
  const lan = cageLantern({ metal: 'iron', hang: true, h: .3, r: .085, li: 1.2 }); lan.position.set(-L / 2 + .55, 2.53, 0);
  lan.traverse(o => { if (o.isPointLight) o.color.setRGB(1, .25, .12); if (o.isMesh && o.material.emissive && o.material.emissiveIntensity > .5) { o.material = o.material.clone(); o.material.color.setRGB(.9, .15, .08); o.material.emissive.setRGB(1, .18, .08); } });
  g.add(lan); return g;
}
export function famScene(kind) {
  const g = kind === 'stone' ? glenStone() : kind === 'punt' ? fenPunt() : DEVICE[kind] ? houseBanner(kind) : null;
  if (!g) return null; let n = 0; g.traverse(o => { if (o.isMesh) { o.castShadow = o.receiveShadow = true; n += tris(o.geometry); } }); g.userData.tris = Math.round(n); return g;
}
