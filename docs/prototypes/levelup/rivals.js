// The rivals (the concept artist, 18 Nov 2026; backlog L2, "Rival adventurers", OG-083, and the quest writer's *Rivals*, 29 Oct,
// unapproved): OG-083's sheet E9 drew five who work the gates for a living, as the player does: Koran Stonehand, a mountain guide (fur
// and heavy leather in snow, a pick, a mountain banner); Lyn Étrël, an explorer and antiquities broker (dark-skinned, locs, a cream and
// blue explorer's coat, rolled maps and an orrery); a Gatelander scout with a big grey wolf; Sir Alaric Drake, a fallen knight (blond,
// a red cloak and a surcoat with a gold lion, a great helm); Zurik the Seventh, an Old Blood seeker (cracked stone skin, white hair, a
// black robe with gold stars, a brass armillary). The draft keeps the five and the canon renames them: Cynric Stonehand (a Markman,
// pale and ash-blond), Lysandra Per-Akhet (Aurennais), Alard de Drac (Crown-born, the lion unpicked: the Crown unmade him), Ailill (Old
// Blood, grey-pale, black hair going grey, the marks at his wrists and no further) and Tadhg Ó Faoláin (the sheet's Varek, renamed).
// Every body here is the draft's corrected one, at every level; what changes is what they wear.
//
// The question is how a rival shows that they go into the gates, three levels:
//   a  as the draft dresses them, at the door between clearings: the trade's dress and the one thing of it (Cynric's fur coat, pole and
//      pick; Lysandra's coat, charts and orrery case; Alard's surcoat and cloak, the helm carried; Ailill's robe and armillary; Tadhg's
//      hooded cloak, short bow and wolf);
//   b  a, armed as the player is armed (recommended): the three who go in wear the game's own armour under the trade's dress, at the tier
//      they have reached (Cynric Iron mail under the open coat, leather at the forearms; Alard Steel plate under the surcoat, gauntlets and
//      greaves; Tadhg a leather jerkin and bracers). Lysandra pays others to go in and Ailill only reads the door: they stay as a. A rival
//      reads as a gate-clearer across a square, and how far along they are reads from the same tiers as your own kit;
//   c  OG-083 as drawn (the costume only; the bodies stay the canon's): the mountain banner on a crossbar, the lion in gold and the great
//      helm worn, the black robe strewn with gold stars, the orrery out of its case, the scout's hood up.
// RIVALS[key] is the sheet; rivalGenome(key, level, P) makes the genome (P carries people.js's rollGenome, heightFor, GARMENTS and
// DRESS_FLAGS). rivalProps(M, G, scene) adds what people.js does not have (the pick, the pennant or banner, the lion, the great helm in
// hand, the orrery and its case, the armillary on its stand, the short bow and the quiver) and returns their triangles. Colours are
// linear [r,g,b] as in CAST.
import * as THREE from 'three';

const LEATHER = [.22, .14, .09], GOLD = [.74, .56, .2], BRASS = [.62, .46, .2], CREAM = [.82, .77, .64], CRIMSON = [.46, .06, .07], BLUE = [.1, .2, .42],
  IRON = [.42, .43, .45], STEEL = [.62, .64, .68], FUR = [.5, .45, .38], BLACK = [.035, .033, .035], GREEN = [.1, .2, .1], ASH = [.66, .58, .42];

export const RIVALS = {
  // Cynric Stonehand (Markman): a guide for hire; the door of a gate in the Mark, or the Gatelands' ranges, by the week
  cynric: { label: 'Cynric Stonehand, the guide', island: 'mark', people: 'markman', g: 1, age: .5, muscle: .9, weight: .62, metres: 1.9,
    hairCol: ASH, hair: { style: 'tail', len: .55 }, beard: 1,
    a: { tunic: [.36, .3, .22], trousers: [.22, .2, .17], boots: [.16, .11, .08], belt: LEATHER, coat: [.26, .17, .1], coatLen: .72, coatFur: FUR, coatOpen: true,
      legWraps: [.36, .32, .26], gloves: [.2, .13, .08], glovesKind: 'leather', spear: [.4, .3, .2], spearHead: 'winged', props: { pick: true, pennant: 'pennant' } },
    // (the kit wears no coat over mail: b's fur and heavy leather is a fur-collared cape of hide over the hauberk)
    b: { tunic: [.36, .3, .22], trousers: [.22, .2, .17], boots: [.16, .11, .08], belt: LEATHER, cloak: [.26, .17, .1], cape: true, cloakLen: .85, cloakFur: FUR, brooch: IRON,
      mail: IRON, legWraps: [.36, .32, .26], vambrace: [.24, .15, .09], vambraceKind: 'leather', gloves: [.2, .13, .08], glovesKind: 'leather',
      spear: [.4, .3, .2], spearHead: 'winged', props: { pick: true, pennant: 'pennant' } },
    c: { tunic: [.36, .3, .22], trousers: [.22, .2, .17], boots: [.16, .11, .08], belt: LEATHER, coat: [.26, .17, .1], coatLen: .8, coatFur: FUR, coatOpen: false,
      cloak: [.4, .36, .3], cape: true, cloakLen: .7, cloakFur: FUR, brooch: IRON, legWraps: [.36, .32, .26], gloves: [.2, .13, .08], glovesKind: 'leather',
      spear: [.4, .3, .2], spearHead: 'winged', props: { pick: true, pennant: 'banner' } } },
  // Lysandra Per-Akhet (Aurennais): funds expeditions; the quay of an Aurennais port by day
  lysandra: { label: 'Lysandra Per-Akhet, the patron', island: 'aurenne', people: 'aurennais', g: 0, age: .4, muscle: .45, weight: .38, metres: 1.74,
    hairCol: [.04, .03, .03], hair: { style: 'braids', len: 1 }, skin: [.24, .15, .1],
    a: { tunic: [.86, .82, .72], trousers: [.3, .24, .18], boots: [.3, .2, .12], belt: [.3, .2, .12], coat: CREAM, coatLen: .85, coatTrim: BLUE, coatOpen: true,
      earrings: GOLD, satchel: [.36, .22, .12], maps: [.84, .76, .58], props: { orrery: 'case' } },
    c: { tunic: [.86, .82, .72], trousers: [.3, .24, .18], boots: [.3, .2, .12], belt: [.3, .2, .12], coat: CREAM, coatLen: .85, coatTrim: BLUE, coatOpen: true,
      earrings: GOLD, necklace: GOLD, sash: BLUE, sashPrint: false, satchel: [.36, .22, .12], maps: [.84, .76, .58], props: { orrery: 'open' } } },
  // Alard de Drac (Crown-born, Gatelander): a Knight of the Gates unmade for leaving a wounded man; the door Lysandra names that week
  alard: { label: 'Alard de Drac, the unmade knight', island: 'gatelands', people: 'gatelander', g: 1, age: .45, muscle: .78, weight: .45, metres: 1.84,
    hairCol: [.72, .58, .32], hair: { style: 'loose', len: .4 }, beard: .3,
    a: { tunic: [.4, .36, .3], trousers: [.2, .17, .14], boots: [.14, .1, .07], belt: [.14, .1, .07], tabard: [.56, .1, .08], tabardLen: .85,
      cloak: CRIMSON, cape: true, cloakLen: 1, brooch: [.6, .6, .62], sword: STEEL, swordMake: 'arming', props: { lion: 'unpicked', helmHeld: true } },
    b: { tunic: [.4, .36, .3], trousers: [.2, .17, .14], boots: [.14, .1, .07], belt: [.14, .1, .07], mail: STEEL, plate: 'plate', vambrace: STEEL, vambraceKind: 'sheet',
      gloves: STEEL, glovesKind: 'sheet', greaves: STEEL, greavesKind: 'sheet', cuisses: true, tabard: [.56, .1, .08], tabardLen: .85,
      cloak: CRIMSON, cape: true, cloakLen: 1, brooch: [.6, .6, .62], sword: STEEL, swordMake: 'arming', props: { lion: 'unpicked', helmHeld: true } },
    c: { tunic: [.4, .36, .3], trousers: [.2, .17, .14], boots: [.14, .1, .07], belt: [.14, .1, .07], mail: STEEL, plate: 'plate', vambrace: STEEL, vambraceKind: 'sheet',
      gloves: STEEL, glovesKind: 'sheet', greaves: STEEL, greavesKind: 'sheet', cuisses: true, tabard: [.56, .1, .08], tabardTrim: GOLD, tabardLen: .85,
      cloak: CRIMSON, cape: true, cloakLen: 1, cloakHem: GOLD, brooch: GOLD, helm: STEEL, tier: 4, sword: STEEL, swordMake: 'arming', props: { lion: 'gold' } } },
  // Ailill (Old Blood): reads a gate's condition at its door; the failing gate nearest the player's last town
  ailill: { label: 'Ailill, the seeker', island: 'gatelands', people: 'oldblood', fixed: true, g: 1, age: .62, muscle: .3, weight: .2, metres: 1.62,
    hairCol: [.2, .19, .19], hair: { style: 'loose', len: .6 }, beard: .15, marks: .3,
    a: { tunic: BLACK, robe: BLACK, skirtColor: BLACK, boots: [.12, .1, .08], cord: [.24, .22, .2], props: { armillary: true } },
    c: { tunic: BLACK, robe: BLACK, skirtColor: BLACK, gownBorder: GOLD, cuffs: GOLD, dots: GOLD, dotsStyle: 'powder', boots: [.12, .1, .08], cord: GOLD,
      hairCol: [.86, .86, .84], props: { armillary: true } } },
  // Tadhg Ó Faoláin (Gatelander): a scout who knows who is below; the inn door of the Gatelands town nearest any of the other four
  tadhg: { label: 'Tadhg Ó Faoláin, the scout', island: 'gatelands', people: 'gatelander', g: 1, age: .32, muscle: .6, weight: .25, metres: 1.72, wolf: true,
    hairCol: [.5, .16, .05], hair: { style: 'short', len: .45 }, beard: .35,
    a: { tunic: [.42, .38, .28], trousers: [.26, .24, .18], boots: [.22, .14, .09], belt: LEATHER, cloak: GREEN, cloakLen: .75, hood: 'down', brooch: [.6, .6, .62],
      props: { bow: true, quiver: true } },
    b: { tunic: [.42, .38, .28], trousers: [.26, .24, .18], boots: [.22, .14, .09], belt: LEATHER, waistcoat: [.28, .18, .1], waistcoatLeather: true,
      vambrace: [.28, .18, .1], vambraceKind: 'leather', cloak: GREEN, cape: true, cloakLen: .75, hood: 'down', brooch: [.6, .6, .62], props: { bow: true, quiver: true } },
    c: { tunic: [.42, .38, .28], trousers: [.26, .24, .18], boots: [.22, .14, .09], belt: LEATHER, waistcoat: [.28, .18, .1], waistcoatLeather: true,
      vambrace: [.28, .18, .1], vambraceKind: 'leather', cloak: GREEN, cloakLen: .9, hood: 'up', brooch: [.6, .6, .62], props: { bow: true, quiver: true } } } };
export const ORDER = ['cynric', 'lysandra', 'alard', 'ailill', 'tadhg'];

// the genome: the name rolled for the face (as castGenome does), the sheet's body, then the level's whole wardrobe (b falls back to a)
export function rivalGenome(key, level, P) {
  const S = RIVALS[key], G = P.rollGenome('rival:' + key, { people: S.people, g: S.g });
  for (const k of ['age', 'muscle', 'weight', 'hairCol', 'beard', 'skin']) if (S[k] != null) G[k] = Array.isArray(S[k]) ? S[k].slice() : S[k];
  const D = JSON.parse(JSON.stringify(S[level] || (level === 'c' ? S.b || S.a : S.a))), props = D.props || {};
  if (D.hairCol) { G.hairCol = D.hairCol; delete D.hairCol; } delete D.props;
  G.hair = { ...S.hair }; G.pose = { ...(G.pose || {}), stoop: 0 }; G.scar = null; G.marks = S.people === 'oldblood' ? S.marks : null;
  const skirt = D.robe ? 'long' : (S.g ? 'short' : 'long');
  G.dress = { ...Object.fromEntries(P.GARMENTS.map(k => [k, null])), ...P.DRESS_FLAGS, skirt, ...D };
  G.height = P.heightFor(G, S.metres); G.rival = key; G.props = props; return G;
}

// ── what the people kit has not ──
const lin = c => new THREE.Color().setRGB(...c, THREE.SRGBColorSpace);
const M_ = (c, o = {}) => new THREE.MeshStandardMaterial({ color: lin(c), roughness: o.r ?? .7, metalness: o.m ?? 0, side: o.ds ? THREE.DoubleSide : THREE.FrontSide });
const tris = g => (g.index ? g.index.count : g.attributes.position.count) / 3;
function meshPts(M, mesh) {
  M.root.updateMatrixWorld(true); const inv = new THREE.Matrix4().copy(M.root.matrixWorld).invert(), pos = mesh.geometry.attributes.position, v = new THREE.Vector3(), out = [];
  for (let i = 0; i < pos.count; i++) { if (mesh.isSkinnedMesh) mesh.getVertexPosition(i, v); else v.fromBufferAttribute(pos, i); v.applyMatrix4(mesh.matrixWorld).applyMatrix4(inv); out.push(v.clone()); }
  return out;
}
const bonePos = (M, n) => { M.root.updateMatrixWorld(true); return M.root.worldToLocal(M.byName[n].getWorldPosition(new THREE.Vector3())); };
// the worn surface (the body and what is worn over it, not the hair or the held things), its points in the root's frame, once
function wornPts(M) {
  if (M._worn) return M._worn; const out = [];
  for (const m of M.meshes) { if (!m.isMesh || /hair|brow|lash|beard|spear|sword|staff/i.test(m.name || '') || m.geometry.attributes.position.count > 60000) continue;
    let p = m.parent, held = false; while (p) { if (/spear|sword|staff|hammer/.test(p.name || '')) held = true; p = p.parent; } if (held) continue;
    out.push(...meshPts(M, m)); }
  return M._worn = out;
}
// the worn surface's back (least z) and front (most z) in a window round (x, y)
function frontZ(M, x, y, r = .04) { let z = -1e9; for (const p of wornPts(M)) if (Math.abs(p.x - x) < r && Math.abs(p.y - y) < r && p.z > z) z = p.z; return z; }
function backZ(M, x, y, r = .04) { let z = 1e9; for (const p of wornPts(M)) if (Math.abs(p.x - x) < r && Math.abs(p.y - y) < r && p.z < z) z = p.z; return z; }
function sideX(M, y, s, r = .03, lim = .3) { let v = 0; for (const p of wornPts(M)) if (Math.abs(p.y - y) < r && Math.abs(p.x) < lim && s * p.x > v) v = s * p.x; return s * v; }
const cyl = (r0, r1, L, n, m) => new THREE.Mesh(new THREE.CylinderGeometry(r1, r0, L, n), m);
// a mesh along a line from a to b
function along(mesh, a, b) { const d = b.clone().sub(a); mesh.position.copy(a).addScaledVector(d, .5); mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize()); return mesh; }

// the guide's pick: an ash haft 0.85 m, an iron head 0.46 m across (a point one way, a narrow adze the other); built with the haft
// along +y from its butt at 0, the head across x at the top; ~300 tris
export function pick() {
  const g = new THREE.Group(), ash = M_([.5, .38, .24]), iron = M_(IRON, { r: .45, m: .6 });
  const haft = cyl(.018, .016, .85, 10, ash); haft.position.y = .425; g.add(haft);
  const eye = new THREE.Mesh(new THREE.BoxGeometry(.06, .07, .05), iron); eye.position.y = .83; g.add(eye);
  const pt = new THREE.Mesh(new THREE.ConeGeometry(.02, .24, 6), iron); pt.rotation.z = Math.PI / 2 + .12; pt.position.set(.14, .815, 0); pt.scale.z = .8; g.add(pt);
  const adze = new THREE.Mesh(new THREE.BoxGeometry(.2, .03, .045), iron); adze.position.set(-.12, .82, 0); adze.rotation.z = -.1; g.add(adze);
  const bit = new THREE.Mesh(new THREE.BoxGeometry(.02, .012, .07), iron); bit.position.set(-.225, .805, 0); g.add(bit);
  return g;
}
// a cloth flown from a pole: 'pennant' a swallow-tailed streamer 0.9 m long (the Mark's mountain, a pale peak on slate blue), or
// 'banner' a hung banner 0.55 by 0.8 m on a crossbar (the sheet's mountain banner); built from the pole's line at x=0, hanging from y=0
function pennantTex() {
  const c = document.createElement('canvas'); c.width = 256; c.height = 128; const x = c.getContext('2d');
  x.fillStyle = '#2c3a52'; x.fillRect(0, 0, 256, 128); x.fillStyle = '#d8d4c6';
  x.beginPath(); x.moveTo(18, 104); x.lineTo(70, 22); x.lineTo(96, 60); x.lineTo(116, 38); x.lineTo(160, 104); x.closePath(); x.fill();
  x.fillStyle = '#2c3a52'; x.beginPath(); x.moveTo(52, 50); x.lineTo(70, 22); x.lineTo(88, 50); x.lineTo(78, 44); x.lineTo(70, 54); x.lineTo(62, 44); x.closePath(); x.fill();
  x.fillStyle = '#d8d4c6'; x.fillRect(0, 112, 256, 6);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}
export function pennant(kind) {
  const g = new THREE.Group(), tex = pennantTex(), m = new THREE.MeshStandardMaterial({ map: tex, roughness: .9, side: THREE.DoubleSide });
  if (kind === 'banner') {
    const bar = cyl(.012, .012, .66, 8, M_([.4, .3, .2])); bar.rotation.z = Math.PI / 2; bar.position.set(0, 0, 0); g.add(bar);
    const geo = new THREE.PlaneGeometry(.55, .8, 8, 12), p = geo.attributes.position;
    for (let i = 0; i < p.count; i++) { const x = p.getX(i), y = p.getY(i); p.setZ(i, .025 * Math.sin(x * 11 + y * 3)); }
    // the foot cut in two tails, as the sheet's
    const uv = geo.attributes.uv; for (let i = 0; i < p.count; i++) { const y = p.getY(i), x = p.getX(i); if (y < -.32) p.setY(i, y + .1 * (1 - Math.abs(x) / .275)); uv.setXY(i, x / .55 + .5, (p.getY(i) + .4) / .8); }
    geo.computeVertexNormals(); const b = new THREE.Mesh(geo, m); b.position.y = -.42; g.add(b); return g;
  }
  // a streamer 0.9 m off the pole, its hoist 0.32 m tapering to the fly, the fly cut in a swallow-tail (the middle row drawn back 0.18 m
  // at the end); a little wind in it
  const N = 16, pos = [], uv = [], idx = [];
  for (let i = 0; i <= N; i++) { const t = i / N, h = .32 * (1 - .45 * t), sag = -.06 * t * t, z = .04 * Math.sin(t * 7);
    for (const s of [0, .5, 1]) { const x = s === .5 ? Math.min(t * .9, .72 + .0 * t) : t * .9; pos.push(x, sag - s * h, z); uv.push(t, 1 - s); } }
  for (let i = 0; i < N; i++) for (const r of [0, 1]) { const a = i * 3 + r; idx.push(a, a + 1, a + 3, a + 1, a + 4, a + 3); }
  const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); geo.setIndex(idx);
  geo.computeVertexNormals(); g.add(new THREE.Mesh(geo, m));
  return g;
}
// the lion rampant in outline, 1 unit tall, facing the wearer's right (the viewer's left), as the Crown's heralds cut it
export function lionShape() {
  const P = [[.30, 0], [.40, .18], [.36, .30], [.44, .42], [.40, .55], [.30, .62], [.22, .72], [.12, .80], [.05, .92], [-.05, 1], [-.16, .97], [-.2, .9], [-.3, .92], [-.36, .84],
    [-.28, .8], [-.3, .72], [-.2, .7], [-.14, .76], [-.08, .7], [-.1, .6], [-.25, .66], [-.36, .6], [-.3, .54], [-.16, .52], [-.05, .45], [-.08, .3], [-.22, .2],
    [-.3, .06], [-.2, 0], [-.12, .1], [0, .2], [.08, .12], [.06, 0], [.18, .02], [.2, .14], [.24, .06]];
  const s = new THREE.Shape(); P.forEach(([x, y], i) => i ? s.lineTo(x, y) : s.moveTo(x, y)); s.closePath();
  // the tail, curling up behind: a second piece
  const t = new THREE.Shape(); [[.36, .3], [.5, .4], [.56, .58], [.5, .72], [.56, .76], [.62, .6], [.58, .4], [.44, .3]].forEach(([x, y], i) => i ? t.lineTo(x, y) : t.moveTo(x, y)); t.closePath();
  return [s, t];
}
// the lion on the surcoat's breast: 'unpicked' (the gold thread taken out, the cloth under it less faded than the rest: a paler red shape
// with the needle-holes' darker line round it) or 'gold' (the sheet's: gold thread, raised); 0.3 m tall, under the cape's edge, laid flat over the tabard's most forward point
export function lion(M, kind) {
  const tab = M.root.getObjectByName('tabard'); if (!tab) return null; const pts = meshPts(M, tab), n = bonePos(M, 'neck01'), H = .3, y = n.y - .43 - H;
  let fz = -1e9; for (const p of pts) if (Math.abs(p.x) < H * .5 && p.y > y && p.y < y + H && p.z > fz) fz = p.z;
  const g = new THREE.Group(), [body, tail] = lionShape(), gold = kind === 'gold';
  const fill = gold ? M_(GOLD, { r: .35, m: .8 }) : M_([.86, .46, .4], { r: .95 }), edge = M_(gold ? [.5, .36, .12] : [.3, .04, .04], { r: 1 });
  for (const sh of [body, tail]) {
    const geo = new THREE.ShapeGeometry(sh, 4); geo.scale(H, H, 1); g.add(new THREE.Mesh(geo, fill));
    const ring = new THREE.BufferGeometry().setFromPoints(sh.getPoints(4).map(p => new THREE.Vector3(p.x * H, p.y * H, .0008)));
    g.add(new THREE.LineLoop(ring, new THREE.LineBasicMaterial({ color: gold ? 0x6e5018 : 0x3a0606 })));
    if (gold) { const e = new THREE.Mesh(new THREE.ExtrudeGeometry(sh, { depth: .002, bevelEnabled: false }), edge); e.geometry.scale(H, H, 1); e.position.z = -.002; g.add(e); }
  }
  g.position.set(.02, y, fz + .004); return g;
}
// the great helm (carried, not worn): a flat-topped barrel of steel 0.3 m tall, 0.23 across, the sights a slit either side of a
// cross-brace and the breaths pierced low on the right; built upright, its face +z, centre at 0
export function greatHelm() {
  const g = new THREE.Group(), st = M_(STEEL, { r: .32, m: .85 }), dark = M_([.02, .02, .02], { r: 1 }), brass = M_(BRASS, { r: .35, m: .8 });
  const shell = new THREE.Mesh(new THREE.CylinderGeometry(.112, .118, .3, 24, 1, false), st); shell.scale.z = 1.08; g.add(shell);
  const top = new THREE.Mesh(new THREE.CylinderGeometry(.1, .112, .03, 24), st); top.position.y = .165; top.scale.z = 1.08; g.add(top);
  for (const s of [-1, 1]) { const slit = new THREE.Mesh(new THREE.BoxGeometry(.075, .012, .02), dark); slit.position.set(s * .05, .06, .118); slit.rotation.y = s * -.42; g.add(slit); }
  // the face's ridge and the band over the sights in the helm's own steel (a brass cross-brace would draw the cross the canon's Church
  // has no use for: its sign is the shuttle)
  const ridge = new THREE.Mesh(new THREE.BoxGeometry(.014, .26, .012), st); ridge.position.set(0, -.02, .123); g.add(ridge);
  const bar = new THREE.Mesh(new THREE.BoxGeometry(.2, .016, .01), st); bar.position.set(0, .082, .12); g.add(bar);
  const rim = new THREE.Mesh(new THREE.TorusGeometry(.116, .004, 4, 28), brass); rim.rotation.x = Math.PI / 2; rim.position.y = -.148; rim.scale.y = 1.08; g.add(rim);
  for (let i = 0; i < 6; i++) { const h = new THREE.Mesh(new THREE.CylinderGeometry(.005, .005, .01, 6), dark); h.rotation.x = Math.PI / 2; h.position.set(.035 + (i % 2) * .022, -.05 - Math.floor(i / 2) * .025, .121); g.add(h); }
  return g;
}
// the orrery's case (oak bound in brass, 16 by 14 by 14 cm, on a strap at the hip) and, opened, the orrery: a brass sun 3 cm on a
// pillar with four arms and their worlds, under the ring of the year, standing 12 cm out of the open case
export function orrery(open) {
  const g = new THREE.Group(), oak = M_([.32, .2, .1]), br = M_(BRASS, { r: .3, m: .85 });
  const box = new THREE.Mesh(new THREE.BoxGeometry(.16, .12, .14), oak); g.add(box);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) { const c = new THREE.Mesh(new THREE.BoxGeometry(.012, .124, .012), br); c.position.set(sx * .078, 0, sz * .068); g.add(c); }
  const lid = new THREE.Mesh(new THREE.BoxGeometry(.164, .02, .144), oak);
  if (open) { lid.position.set(0, .13, -.08); lid.rotation.x = -1.9; } else lid.position.y = .07; g.add(lid);
  const lock = new THREE.Mesh(new THREE.BoxGeometry(.02, .025, .006), br); lock.position.set(0, .045, .072); if (!open) g.add(lock);
  if (open) { const o = new THREE.Group(); o.position.y = .06;
    const pil = cyl(.004, .004, .1, 8, br); pil.position.y = .05; o.add(pil);
    const sun = new THREE.Mesh(new THREE.SphereGeometry(.016, 14, 10), M_([.9, .66, .2], { r: .25, m: .9 })); sun.position.y = .105; o.add(sun);
    const ring = new THREE.Mesh(new THREE.TorusGeometry(.075, .0022, 6, 36), br); ring.rotation.x = Math.PI / 2; ring.position.y = .09; o.add(ring);
    [[.03, .2, [.6, .6, .62]], [.045, 2.1, [.5, .6, .8]], [.06, 3.7, [.7, .3, .2]], [.074, 5, [.8, .7, .5]]].forEach(([r, a, c], i) => {
      const arm = cyl(.0015, .0015, r, 4, br); arm.rotation.z = Math.PI / 2; arm.position.set(Math.cos(a) * r / 2, .09 + i * .004, Math.sin(a) * r / 2); arm.rotation.y = -a; o.add(arm);
      const w = new THREE.Mesh(new THREE.SphereGeometry(.006 + i * .0015, 8, 6), M_(c, { r: .4, m: .3 })); w.position.set(Math.cos(a) * r, .095 + i * .004, Math.sin(a) * r); o.add(w); });
    g.add(o); }
  const loop = new THREE.Mesh(new THREE.TorusGeometry(.02, .004, 4, 10, Math.PI), M_(LEATHER)); loop.position.set(0, .07, 0); loop.rotation.y = Math.PI / 2; if (!open) g.add(loop);
  return g;
}
// the armillary on its stand (Ailill's: the seeker reads the door by the sky as the old schools set it): a turned oak stand 0.95 m on
// three feet, the sphere's horizon ring 0.3 m across on it, the meridian, the equator, the ecliptic band and the two tropics inside, a
// small earth at the heart; ~2k tris
export function armillary() {
  const g = new THREE.Group(), oak = M_([.24, .15, .08]), br = M_(BRASS, { r: .3, m: .85 });
  for (let i = 0; i < 3; i++) { const a = i / 3 * Math.PI * 2, foot = along(cyl(.014, .012, .42, 8, oak), new THREE.Vector3(Math.cos(a) * .26, 0, Math.sin(a) * .26), new THREE.Vector3(0, .38, 0)); g.add(foot); }
  const col = cyl(.025, .018, .5, 12, oak); col.position.y = .6; g.add(col);
  const knop = new THREE.Mesh(new THREE.SphereGeometry(.03, 12, 8), oak); knop.position.y = .4; g.add(knop);
  const S = new THREE.Group(); S.position.y = 1.0; g.add(S);
  const hor = new THREE.Mesh(new THREE.TorusGeometry(.17, .007, 6, 48), br); hor.rotation.x = Math.PI / 2; hor.position.y = -.0; S.add(hor);
  const mer = new THREE.Mesh(new THREE.TorusGeometry(.155, .005, 6, 48), br); S.add(mer);
  const inner = new THREE.Group(); inner.rotation.z = .42; S.add(inner);
  const eq = new THREE.Mesh(new THREE.TorusGeometry(.14, .004, 6, 48), br); eq.rotation.x = Math.PI / 2; inner.add(eq);
  const ecl = new THREE.Mesh(new THREE.CylinderGeometry(.142, .142, .02, 48, 1, true), M_([.7, .54, .24], { r: .35, m: .8, ds: true })); ecl.rotation.x = .41; inner.add(ecl);
  for (const s of [-1, 1]) { const tr = new THREE.Mesh(new THREE.TorusGeometry(.128, .003, 6, 40), br); tr.rotation.x = Math.PI / 2; tr.position.y = s * .058; inner.add(tr); }
  const axis = cyl(.003, .003, .34, 6, br); inner.add(axis);
  const earth = new THREE.Mesh(new THREE.SphereGeometry(.022, 12, 8), M_([.3, .4, .5], { r: .5 })); inner.add(earth);
  const yoke = cyl(.006, .006, .16, 6, br); yoke.position.y = -.25; S.add(yoke);
  return g;
}
// a short bow of yew, strung: 1.2 m along the string, the belly 9 cm deep at the grip, horn nocks; built along +y, the back to -z
export function shortBow() {
  const g = new THREE.Group(), yew = M_([.56, .34, .18], { r: .55 }), grip = M_(LEATHER), str = new THREE.LineBasicMaterial({ color: 0xd8d0b8 });
  const pts = []; for (let i = 0; i <= 20; i++) { const t = i / 20 * 2 - 1; pts.push(new THREE.Vector3(0, t * .6, -.09 * (1 - t * t) + .01 * t * t)); }
  const curve = new THREE.CatmullRomCurve3(pts), tube = new THREE.TubeGeometry(curve, 30, .011, 6, false); const p = tube.attributes.position;
  // the limbs taper to the nocks: radius by the point's height
  for (let i = 0; i < p.count; i++) { const y = p.getY(i), k = 1 - .55 * Math.abs(y) / .6; const c = curve.getPoint(Math.min(1, Math.max(0, (y / .6 + 1) / 2))); p.setX(i, c.x + (p.getX(i) - c.x) * k); p.setZ(i, c.z + (p.getZ(i) - c.z) * k); }
  tube.computeVertexNormals(); g.add(new THREE.Mesh(tube, yew));
  const gr = cyl(.014, .014, .11, 8, grip); gr.position.z = -.09; g.add(gr);
  g.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints([pts[0], pts[20]]), str));
  return g;
}
// a hip quiver of hide, 0.5 m, a dozen arrows' fletching out of its mouth; built along +y from its foot
export function quiver() {
  const g = new THREE.Group(), hide = M_([.36, .24, .14], { r: .85 }), shaft = M_([.6, .5, .36]), fl = M_([.82, .78, .7], { r: .9, ds: true }), fl2 = M_([.3, .26, .22], { r: .9, ds: true });
  const q = cyl(.035, .045, .5, 12, hide); q.position.y = .25; g.add(q);
  const rim = new THREE.Mesh(new THREE.TorusGeometry(.046, .005, 5, 14), M_(LEATHER)); rim.rotation.x = Math.PI / 2; rim.position.y = .5; g.add(rim);
  for (let i = 0; i < 12; i++) { const a = i * 2.4, r = .012 + .022 * ((i * 7) % 5) / 4, x = Math.cos(a) * r, z = Math.sin(a) * r;
    const s = cyl(.004, .004, .14, 4, shaft); s.position.set(x, .54, z); g.add(s);
    for (let k = 0; k < 3; k++) { const f = new THREE.Mesh(new THREE.PlaneGeometry(.018, .09), i % 4 ? fl : fl2); f.position.set(x + Math.cos(k * 2.1) * .009, .57, z + Math.sin(k * 2.1) * .009); f.rotation.y = k * 2.1; g.add(f); } }
  return g;
}

// the props on a made body, in the root's frame (the slice's people stand still: placed once on the rest body, as the travellers' were)
export function rivalProps(M, G, scene) {
  const p = G.props || {}, out = new THREE.Group(); out.name = 'rivalProps'; let n = 0; const stats = {};
  const shR = bonePos(M, 'upperarm01.R'), shL = bonePos(M, 'upperarm01.L'), neck = bonePos(M, 'neck01'), sp1 = bonePos(M, 'spine01');
  if (p.pick) { // slung on the back: the head behind the left shoulder, the haft down across the back to the right hip, 4 cm off the coat
    const a = new THREE.Vector3(shR.x * .7, sp1.y - .12, 0), b = new THREE.Vector3(shL.x * .55, neck.y - .02, 0);
    const za = backZ(M, a.x, a.y + .15, .06), zb = backZ(M, b.x, b.y - .08, .06); a.z = za - .05; b.z = zb - .06;
    const k = pick(), d = b.clone().sub(a); k.position.copy(a); k.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.clone().normalize());
    out.add(k); stats.pick = +d.length().toFixed(2);
    const strap = along(cyl(.012, .012, 1, 4, M_(LEATHER)), a.clone().add(new THREE.Vector3(0, .1, .02)), b.clone()); strap.scale.set(1, d.length(), .3); out.add(strap); }
  if (p.pennant) { const sp = M.root.getObjectByName('spear'); if (sp) { sp.updateMatrixWorld(true);
      // the top of the shaft, under the head, in the spear's own frame
      const bx = new THREE.Box3(); sp.traverse(o => { if (o.isMesh) { o.geometry.computeBoundingBox(); const b = o.geometry.boundingBox.clone(); b.min.add(o.position); b.max.add(o.position); bx.union(b); } });
      const f = pennant(p.pennant); f.name = 'pennant'; f.position.y = bx.max.y - (p.pennant === 'banner' ? .34 : .36); if (p.pennant === 'banner') f.position.z = .0; f.rotation.y = p.pennant === 'banner' ? Math.PI / 2 - .3 : Math.PI - .5; sp.add(f);
      f.traverse(o => { if (o.isMesh) { o.castShadow = true; n += tris(o.geometry); } }); stats.pole = +bx.max.y.toFixed(2); } }
  if (p.lion) { const l = lion(M, p.lion); if (l) out.add(l); }
  if (p.helmHeld) { // under the left hand at the hip, its crown in the palm, the face turned forward
    const w = bonePos(M, 'wrist.L'), x = sideX(M, w.y - .16, 1); const h = greatHelm(); h.position.set(Math.max(w.x + .02, x + .13), w.y - .2, w.z + .03); h.rotation.set(.05, -.25, -.12); out.add(h); }
  if (p.orrery) { // the case on its strap at the front of the right hip, over the coat
    const yB = sp1.y - .2, x = -.12, z = frontZ(M, x, yB, .05); const o = orrery(p.orrery === 'open'); o.position.set(x, yB, z + .075); o.rotation.y = -.25; out.add(o); stats.caseY = +yB.toFixed(2); }
  if (p.armillary) { const a = armillary(); a.position.set(.62, 0, .2); a.rotation.y = .4; a.name = 'armillary'; a.scale.setScalar(1); out.add(a); }
  if (p.bow) { // across the back over the cloak, the upper nock over the right shoulder
    const c = new THREE.Vector3(0, (neck.y + sp1.y) / 2 - .02, 0); c.z = backZ(M, 0, c.y, .08) - .07; const b = shortBow();
    b.position.copy(c); b.rotation.set(0, Math.PI, .55); out.add(b); stats.bowZ = +c.z.toFixed(3); }
  if (p.quiver) { const yB = sp1.y - .1, x = sideX(M, yB, -1); const q = quiver(); q.position.set(x - .05, yB - .38, -.06); q.rotation.set(-.18, 0, .1); out.add(q); }
  out.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; n += tris(o.geometry); } }); M.root.add(out); return { tris: Math.round(n), ...stats };
}
