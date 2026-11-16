// The guild heads (the concept artist, 16 Nov 2026; backlog L2, "Guild heads", OG-064): OG-064 drew five heads with turnarounds, props
// and a scene: Lady Corvina Draeth the merchant prince, Master Haldrin the grand artisan, High Archmage Selene in midnight blue with gold
// stars and a floating ring of light over her hand, Ser Jorren Vale of the Fighters' Guild in plate under a red cape and surcoat with a
// gold sword, and Matriarch Ysara of a healers' circle. The game has two of those guilds, and a head of each in every town with a hall:
// the Fighters' Guild's Guildmaster and the Mages' Guild's Archmage (`GUILD_DEF`, `guildDef` in 83-world-generator.js), rolled from the
// town (the same face every visit, S172) and of the town's people (`peopleOfSite`). The canon keeps both guilds cross-island and
// neutral (§1541: "The Fighters' and Mages' Guilds stay cross-island and neutral"); half the Fighters' Guild is Markish (§1.2); the
// Mages' academy is in Aurenne. The hall signs already have the guilds' colours: the Fighters' oxblood (#4a1818, the guild's 0x7a2020)
// under crossed swords, the Mages' deep blue (#182a4a, 0x203a6a) under a star (`SIGN_STYLE`, the dialogue's ⚔ and ✨).
//
// So the question is not who the five are but how a guild head reads in a town of any people. Eight figures, the two heads as each of
// the four peoples would roll them, at three levels:
//   a  their people's own: the head is a townsperson of good standing in their people's dress, with one thing of the trade (the
//      Guildmaster's sword at the hip in their people's make, the Archmage's book); the guild is the sign over the door;
//   b  the guild's livery over their people (recommended): the hall sign's colours worn: the Guildmaster in mail under an oxblood
//      tabard with a pale border and the crossed swords on the breast, the Archmage in a deep blue robe with pale cuffs and cord and the
//      guild's star at the breast; under and over it, their people's own (the cloak, the fur, the sash, the charms, the hair, the
//      sword's make and the staff's);
//   c  OG-064 as drawn: one look for each guild whatever the people: the Guildmaster in plate under a crimson surcoat and cape with a
//      gold sword on the breast (Jorren), the Archmage in midnight blue strewn with gold, gold cuffs, a gold-edged cape and a ring of light turning
//      over the right hand (Selene). The crimson and gold are the Crown's (§1.5's colours at every gate), which a neutral guild
//      would not wear.
// GUILDS[key] is the sheet; guildGenome(key, level, P) makes the genome (P carries people.js's rollGenome, heightFor, GARMENTS and
// DRESS_FLAGS, as powers.js does). guildProps(M, G) adds what people.js does not have (the crossed swords and the gold sword on the
// tabard, the star, the ring of light), placed on the made body's own surface or the tabard's, and returns their triangles.
import * as THREE from 'three';

const OX = [.42, .1, .1], OXT = [.84, .74, .56], MB = [.12, .2, .4], MBT = [.76, .8, .9], CRIMSON = [.46, .07, .06], GOLD = [.74, .56, .2],
  MID = [.05, .07, .2], IRON = [.42, .43, .45], STEEL = [.56, .58, .62], LEATHER = [.22, .14, .09], UNDYED = [.62, .58, .5], GREY = [.34, .33, .32], WOLF = [.52, .5, .47];

// each head: the body, and `own`, the people's good everyday dress (worn at a, and under or over the livery at b)
const HEADS = {
  f_gl: { guild: 'f', label: 'Guildmaster, a Gatelander', people: 'gatelander', g: 1, age: .66, muscle: .72, weight: .55, metres: 1.8,
    hairCol: [.4, .32, .24], hair: { style: 'short', len: .35 }, beard: .55, sword: 'arming',
    own: { tunic: [.4, .36, .26], trousers: [.26, .22, .17], boots: [.24, .15, .1], belt: LEATHER, cloak: [.2, .28, .17], cape: true, cloakLen: .7, brooch: [.62, .6, .58] } },
  f_mk: { guild: 'f', label: 'Guildmaster, a Markwoman', people: 'markman', g: 0, age: .55, muscle: .78, weight: .45, metres: 1.84,
    hairCol: [.6, .44, .24], hair: { style: 'plait', len: .7 }, sword: 'norse',
    own: { tunic: [.38, .34, .28], trousers: [.2, .19, .18], boots: [.16, .11, .08], belt: [.16, .11, .08], cloak: [.24, .23, .22], cape: true, cloakLen: .75, cloakFur: WOLF, brooch: IRON, legWraps: [.36, .32, .26] } },
  f_au: { guild: 'f', label: 'Guildmaster, an Aurennais', people: 'aurennais', g: 1, age: .5, muscle: .7, weight: .4, metres: 1.76,
    hairCol: [.08, .06, .05], hair: { style: 'short', len: .25 }, beard: .4, skin: [.42, .28, .18], sword: 'nimcha',
    own: { tunic: [.8, .74, .62], trousers: [.5, .4, .28], sandals: [.4, .28, .18], belt: [.4, .28, .18], sash: [.62, .26, .1], sashBorder: GOLD } },
  f_ob: { guild: 'f', label: 'Guildmaster, of the Old Blood', people: 'oldblood', fixed: true, g: 0, age: .6, muscle: .6, weight: .35, metres: 1.6,
    hairCol: [.05, .05, .06], hair: { style: 'braid', len: .6 }, marks: .2, sword: 'falchion',
    own: { tunic: UNDYED, trousers: [.26, .25, .24], boots: [.2, .15, .1], belt: [.2, .15, .1], dots: [.3, .32, .36], dotsStyle: 'powder', cloak: GREY, cape: true, cloakLen: .6, amulet: [.5, .5, .48] } },
  m_gl: { guild: 'm', label: 'Archmage, a Gatelander', people: 'gatelander', g: 0, age: .74, muscle: .3, weight: .45, metres: 1.68,
    hairCol: [.74, .72, .7], hair: { style: 'bun', len: .7 }, staff: 'hazel',
    own: { tunic: [.5, .44, .34], skirtColor: [.3, .24, .18], boots: [.3, .2, .13], belt: [.36, .25, .16], cloak: [.32, .14, .1], cape: true, cloakLen: .9, brooch: [.62, .6, .58] } },
  m_mk: { guild: 'm', label: 'Archmage, a Markman', people: 'markman', g: 1, age: .82, muscle: .45, weight: .5, metres: 1.86,
    hairCol: [.86, .85, .83], hair: { style: 'tail', len: .6 }, beard: .9, staff: 'ash',
    own: { tunic: [.36, .33, .28], trousers: [.2, .19, .18], boots: [.18, .12, .09], belt: [.18, .12, .09], cloak: [.18, .18, .19], cape: true, cloakLen: .85, cloakFur: WOLF, brooch: IRON } },
  m_au: { guild: 'm', label: 'Archmage, an Aurennais', people: 'aurennais', g: 0, age: .6, muscle: .3, weight: .4, metres: 1.7,
    hairCol: [.06, .05, .04], hair: { style: 'braid', len: .7 }, skin: [.32, .2, .13], staff: 'olive',
    own: { tunic: [.84, .8, .7], skirtColor: [.84, .8, .7], skirt: 'long', sandals: [.36, .24, .14], sash: [.16, .3, .5], sashBorder: GOLD, earrings: GOLD } },
  m_ob: { guild: 'm', label: 'Archmage, of the Old Blood', people: 'oldblood', fixed: true, g: 1, age: .78, muscle: .3, weight: .3, metres: 1.58,
    hairCol: [.12, .12, .13], hair: { style: 'loose', len: .6 }, beard: .2, marks: .3, staff: 'carved',
    own: { tunic: UNDYED, robe: UNDYED, skirtColor: UNDYED, boots: [.2, .15, .1], cord: [.3, .26, .2], charms: [.78, .74, .64], amulet: [.5, .5, .48], cloak: GREY, cape: true, cloakLen: .7 } } };
export const GUILDS = HEADS;
export const ORDER = ['f_gl', 'f_mk', 'f_au', 'f_ob', 'm_gl', 'm_mk', 'm_au', 'm_ob'];

// the level's dress for a head
function dressOf(S, level) {
  const own = JSON.parse(JSON.stringify(S.own)), props = {};
  if (S.guild === 'f') {
    if (level === 'a') return { D: { ...own, sword: STEEL, swordMake: S.sword }, props };
    if (level === 'b') { const D = { ...own, mail: IRON, tabard: OX, tabardTrim: OXT, tabardLen: .7, sword: STEEL, swordMake: S.sword };
      delete D.sash; delete D.sashBorder; delete D.dots; props.device = 'swords'; return { D, props }; }
    const D = { tunic: [.3, .1, .08], trousers: [.14, .12, .11], boots: [.12, .09, .07], belt: [.16, .1, .07], mail: STEEL, plate: 'plate', vambrace: STEEL, vambraceKind: 'sheet',
      gloves: STEEL, glovesKind: 'sheet', greaves: STEEL, greavesKind: 'sheet', cuisses: true, tabard: CRIMSON, tabardTrim: GOLD, tabardLen: .75,
      cloak: CRIMSON, cape: true, cloakLen: 1, cloakHem: GOLD, brooch: GOLD, sword: STEEL, swordMake: 'arming' };
    props.device = 'sword'; return { D, props };
  }
  if (level === 'a') return { D: { ...own, book: [.3, .18, .1], bookGilt: GOLD }, props };
  if (level === 'b') { const D = { ...own, tunic: MB, robe: MB, skirtColor: MB, gownBorder: MBT, cuffs: MBT, staff: [.36, .27, .18], staffMake: S.staff };
    delete D.trousers; delete D.skirt; delete D.sash; delete D.sashBorder; if (!D.cord) D.cord = MBT; props.star = MBT; return { D, props }; }
  const D = { tunic: MID, robe: MID, skirtColor: MID, gownBorder: GOLD, cuffs: GOLD, dots: GOLD, dotsStyle: 'powder', cord: GOLD, sandals: [.3, .2, .12],
    necklace: GOLD, cloak: MID, cape: true, cloakLen: 1, cloakHem: GOLD, brooch: GOLD };
  props.ring = true; return { D, props };
}

// the genome: the head's key rolled for the face (as castGenome does), the sheet's body, then the level's whole wardrobe
export function guildGenome(key, level, P) {
  const S = HEADS[key], G = P.rollGenome('guild:' + key, { people: S.people, g: S.g });
  for (const k of ['age', 'muscle', 'weight', 'hairCol', 'beard', 'skin']) if (S[k] != null) G[k] = Array.isArray(S[k]) ? S[k].slice() : S[k];
  const { D, props } = dressOf(S, level);
  G.hair = { ...S.hair }; G.pose = { ...(G.pose || {}), stoop: 0 }; G.scar = null; G.marks = S.people === 'oldblood' ? S.marks : null;
  const skirt = D.skirt || (D.robe ? 'long' : D.trousers ? 'short' : 'long'); delete D.skirt;
  G.dress = { ...Object.fromEntries(P.GARMENTS.map(k => [k, null])), ...P.DRESS_FLAGS, skirt, ...D };
  G.height = P.heightFor(G, S.metres); G.guild = key; G.props = props; return G;
}

// ── what the people kit has not: placed on the made body's surface (its skinned positions) or the tabard's, in the root's frame ──
const lin = c => new THREE.Color().setRGB(...c, THREE.SRGBColorSpace);
const M_ = (c, o = {}) => new THREE.MeshStandardMaterial({ color: lin(c), roughness: o.r ?? .5, metalness: o.m ?? 0, ...(o.e ? { emissive: lin(o.e), emissiveIntensity: o.ei ?? 1 } : {}), ...(o.t ? { transparent: true, opacity: o.t, depthWrite: false } : {}) });
const tris = g => (g.index ? g.index.count : g.attributes.position.count) / 3;
function meshPts(M, mesh) {
  M.root.updateMatrixWorld(true); const inv = new THREE.Matrix4().copy(M.root.matrixWorld).invert(), pos = mesh.geometry.attributes.position, v = new THREE.Vector3(), out = [];
  for (let i = 0; i < pos.count; i++) { if (mesh.isSkinnedMesh) mesh.getVertexPosition(i, v); else v.fromBufferAttribute(pos, i); v.applyMatrix4(mesh.matrixWorld).applyMatrix4(inv); out.push(v.clone()); }
  return out;
}
const bonePos = (M, n) => { const b = M.byName[n]; M.root.updateMatrixWorld(true); const v = b.getWorldPosition(new THREE.Vector3()); return M.root.worldToLocal(v); };
// the front's z near (x, y) on a set of points: the most forward point within a small window
function frontZ(pts, x, y, r = .025) { let z = -1e9; for (const p of pts) if (Math.abs(p.x - x) < r && Math.abs(p.y - y) < r && p.z > z) z = p.z; return z; }
// a blade in outline, point up, in a flat shape (x across, y up): blade, cross, grip and pommel
function swordShape(L) {
  const s = new THREE.Shape(), bw = L * .055, cy = L * .2, cw = L * .2, gw = L * .03;
  s.moveTo(-gw, 0); s.lineTo(-gw, cy - L * .03); s.lineTo(-cw, cy - L * .03); s.lineTo(-cw, cy); s.lineTo(-bw, cy); s.lineTo(-bw * .8, L * .88); s.lineTo(0, L);
  s.lineTo(bw * .8, L * .88); s.lineTo(bw, cy); s.lineTo(cw, cy); s.lineTo(cw, cy - L * .03); s.lineTo(gw, cy - L * .03); s.lineTo(gw, 0); s.lineTo(-gw, 0); return s;
}
function flat(shape, depth, mat) { const g = new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: false, curveSegments: 6 }); return new THREE.Mesh(g, mat); }
// the device on the tabard's breast: 'swords' (the hall sign's crossed swords, pale, 20 cm) or 'sword' (Jorren's single gold sword, 26 cm)
function device(M, kind) {
  const tab = M.root.getObjectByName('tabard'); if (!tab) return null; const pts = meshPts(M, tab), n = bonePos(M, 'neck01'), y = n.y - (kind === 'sword' ? .56 : .25), g = new THREE.Group();
  const fz = frontZ(pts, 0, y, .03), m = kind === 'sword' ? M_(GOLD, { r: .35, m: .8 }) : M_(OXT, { r: .8 });
  const one = (L, rot) => { const s = flat(swordShape(L), .003, m); s.geometry.translate(0, -L * .45, 0); s.rotation.z = rot; return s; };
  if (kind === 'sword') g.add(one(.26, 0)); else { g.add(one(.2, .62), one(.2, -.62)); }
  g.position.set(0, y, fz + .004); g.rotation.x = -.12; return g;
}
// the Mages' Guild's star at the breast: eight points, 7 cm, a brooch proud of the robe
function star(M, col) {
  const n = bonePos(M, 'neck01'), y = n.y - .2, body = M.meshes.filter(m => m.isMesh && /robe|tunic|cloak/.test(m.name || '')), pts = [];
  for (const m of (body.length ? body : M.meshes)) pts.push(...meshPts(M, m)); const fz = frontZ(pts, -.06, y, .03);
  const s = new THREE.Shape(); for (let i = 0; i < 16; i++) { const a = Math.PI / 2 + i * Math.PI / 8, r = i % 2 ? .014 : (i % 4 ? .026 : .036); const x = Math.cos(a) * r, yy = Math.sin(a) * r; i ? s.lineTo(x, yy) : s.moveTo(x, yy); }
  const st = flat(s, .004, M_(col, { r: .3, m: .9, e: col, ei: .15 })); st.position.set(-.06, y, (fz > -1e8 ? fz : .12) + .004); return st;
}
// Selene's ring of light: a ring 20 cm across, level, over the right hand at the hip, with twelve sigil strokes standing on it, glowing
function ring(M) {
  const w = bonePos(M, 'wrist.R'), g = new THREE.Group(), glow = M_([1, .85, .5], { e: [1, .78, .4], ei: 3, r: .4 });
  const t = new THREE.Mesh(new THREE.TorusGeometry(.12, .0045, 6, 64), glow); t.rotation.x = Math.PI / 2; g.add(t);
  const t2 = new THREE.Mesh(new THREE.TorusGeometry(.09, .0024, 5, 48), glow); t2.rotation.x = Math.PI / 2; g.add(t2);
  for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2, b = new THREE.Mesh(new THREE.BoxGeometry(.004, .016 + (i % 3) * .006, .012), glow); b.position.set(Math.cos(a) * .105, .006, Math.sin(a) * .105); b.rotation.y = -a; g.add(b); }
  const halo = new THREE.Mesh(new THREE.CircleGeometry(.14, 40), M_([1, .8, .45], { e: [1, .75, .4], ei: 1.2, t: .18 })); halo.rotation.x = -Math.PI / 2; g.add(halo);
  const lt = new THREE.PointLight(lin([1, .78, .45]), .5, 1.6, 2); g.add(lt);
  g.position.set(w.x + (w.x < 0 ? -.03 : .03), w.y - .05, w.z + .15); return g;
}
export function guildProps(M, G) {
  const p = G.props || {}, out = new THREE.Group(); out.name = 'guildProps'; let n = 0;
  if (p.device) { const d = device(M, p.device); if (d) out.add(d); }
  if (p.star) out.add(star(M, p.star));
  if (p.ring) out.add(ring(M));
  out.traverse(o => { if (o.isMesh) { o.castShadow = !o.material.transparent; o.receiveShadow = true; n += tris(o.geometry); } }); M.root.add(out); return Math.round(n);
}
