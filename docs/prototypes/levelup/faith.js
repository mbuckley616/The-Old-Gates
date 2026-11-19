// Faith (the concept artist, 19 Nov 2026; backlog L2, "Faith", OG-091, and the quest writer's *Faith*, 27 Oct, unapproved): OG-091's
// sheet E8 drew five people of faith: Mother Amani, the Lantern of Ash (a dark-skinned Aurennais priestess, white head-cloth, robes of
// white, blue and gold, a tall staff topped with a caged lantern); Brother Alain, the Iron Sermon (a hooded inquisitor in white with a red
// cross); Shevra the Drowned, a tide oracle (wild braids, salt-crusted robes hung with shells, a staff of driftwood, bones and a lantern);
// Father Calix, the Smiling Lamb (a radiant, open-armed cult leader with a sunburst halo, masks among his props); the Veiled Child (a slight
// figure under a white veil, tending shrines). The draft keeps the five and the canon corrects them: Alain a Gatelander of the Crown's
// country who took the Church's vows, the red cross the Weaver's red shuttle (§4.1); the tide-reader is Sæwynn, a Markwoman and no priest
// (the Mark scorns them, §1.2), *Shevra* only the strait's name for her; Calix one of the awake, kind and smiling (§10a), never the surface
// tone; the child Old Blood, black-haired and grey-pale, the marks hidden at the wrists by long sleeves (the sheet's white hair and glowing
// eyes dropped). Every body here is the draft's corrected one, at every level; what changes is how loudly their faith shows.
//
// The question is how loudly faith shows on them, three levels:
//   a  by their calling only: each in what anyone of their place and work wears (a priest's white robe and head-cloth, a Church brother's
//      habit with the shuttle on the breast, a fishwife's coat, a plain robe, an Old Blood girl's undyed wool and a headscarf), and the
//      one tool of the work in hand (Amani and Calix empty-handed, Sæwynn's lantern, the child's broom);
//   b  the draft's faces (recommended): Amani's white robe bordered in gold under a blue sash, the head-cloth, the tall staff with the
//      caged lantern lit on its head; Alain hooded in white over mail, the red shuttle on the breast; Sæwynn's braids gone pale and stiff
//      with salt, shells strung down her coat, a lantern hung from a crook of driftwood; Calix in cream with the gilt sunburst stitched on
//      the cape behind his shoulders and the smiling mask at his belt; the child under a white veil to the waist, the broom;
//   c  OG-091 as drawn (the costume; the bodies stay the canon's): Amani's blue mantle hemmed in gold and the lantern in gilt; Alain's hood
//      over a long white cloak, his sword and gauntlets; Sæwynn's robe crusted white with salt, bones and shells hung from the staff;
//      Calix's halo stood behind his head as a gilt sun on a rod, three masks at his belt; the child's veil to the ground.
// FAITH[key] is the sheet; faithGenome(key, level, P) makes the genome (P carries people.js's rollGenome, heightFor, GARMENTS and
// DRESS_FLAGS). faithProps(M, G) adds what people.js does not have (the caged lantern on a staff's head, the driftwood crook and its lantern,
// the shells and bones, the sunburst on the cape, the halo, the masks, the veil and the broom's head) and returns their triangles.
// Colours are linear [r,g,b] as in CAST.
import * as THREE from 'three';

const LEATHER = [.22, .14, .09], GOLD = [.74, .56, .2], BRASS = [.62, .46, .2], CREAM = [.82, .77, .64], WHITE = [.86, .85, .8], BLUE = [.08, .16, .42],
  IRON = [.42, .43, .45], STEEL = [.62, .64, .68], UNDYED = [.6, .56, .48], SALT = [.34, .38, .38], DRIFT = [.56, .52, .46], GREY = [.42, .41, .4];

export const FAITH = {
  // Mother Amani (Aurennais): the priest of the church of the Compact's port nearest the capital; carries the dead's lamp to the gates
  amani: { label: 'Mother Amani, the Lantern of Ash', island: 'aurenne', people: 'aurennais', g: 0, age: .55, muscle: .4, weight: .45, metres: 1.8,
    hairCol: [.04, .03, .03], hair: { style: 'bun', len: .6 }, skin: [.2, .12, .08],
    a: { tunic: WHITE, robe: WHITE, cord: [.6, .56, .48], sandals: [.4, .28, .18], wrap: WHITE },
    b: { tunic: WHITE, robe: WHITE, gownBorder: GOLD, cord: GOLD, sash: BLUE, sashPrint: false, sandals: [.4, .28, .18], wrap: WHITE, earrings: GOLD,
      staff: [.4, .28, .16], staffMake: 'olive', props: { cage: 'iron' } },
    c: { tunic: WHITE, robe: WHITE, gownBorder: GOLD, cord: GOLD, sash: BLUE, sashPrint: false, sandals: [.4, .28, .18], wrap: WHITE, earrings: GOLD, necklace: GOLD,
      cloak: BLUE, cape: true, cloakLen: 1, cloakHem: GOLD, brooch: GOLD, staff: [.4, .28, .16], staffMake: 'olive', props: { cage: 'gilt' } } },
  // Brother Alain (Gatelander of the Crown's country, of the Church): searches packs for rubbings in the cathedral square of the capital
  alain: { label: 'Brother Alain', island: 'aurenne', people: 'gatelander', g: 1, age: .48, muscle: .55, weight: .2, metres: 1.79,
    hairCol: [.42, .2, .08], hair: { style: 'short', len: .35 }, beard: .15,
    a: { tunic: [.5, .48, .44], robe: [.62, .6, .55], cord: [.3, .24, .16], boots: [.18, .13, .09], tabard: WHITE, tabardLen: .85, tabardSign: 'shuttle' },
    b: { tunic: [.5, .48, .44], trousers: [.3, .28, .26], boots: [.18, .13, .09], belt: LEATHER, mail: IRON, tabard: WHITE, tabardLen: .85, tabardSign: 'shuttle', cowl: WHITE },
    c: { tunic: [.5, .48, .44], trousers: [.3, .28, .26], boots: [.18, .13, .09], belt: LEATHER, mail: IRON, tabard: WHITE, tabardLen: .9, tabardSign: 'shuttle',
      tabardTrim: [.62, .1, .08], cloak: WHITE, cloakLen: .95, hood: 'up', brooch: [.6, .6, .62], gloves: STEEL, glovesKind: 'sheet', sword: STEEL, swordMake: 'arming' } },
  // Sæwynn, called Shevra (Markwoman): reads the weather coming on the quay at Port Blackhand, first light to noon, for a fish
  saewynn: { label: 'Sæwynn, called Shevra', island: 'mark', people: 'markman', g: 0, age: .6, muscle: .7, weight: .6, metres: 1.76,
    hairCol: [.66, .58, .44], hair: { style: 'plait', len: .9 },
    a: { tunic: [.4, .36, .3], skirtColor: [.26, .26, .26], boots: [.18, .13, .09], belt: LEATHER, coat: [.24, .26, .26], coatLen: .7, apron: [.3, .22, .14], apronLeather: true,
      lantern: [.22, .22, .22] },
    b: { tunic: [.4, .36, .3], skirtColor: [.26, .26, .26], boots: [.18, .13, .09], belt: LEATHER, coat: SALT, coatLen: .82, coatOpen: false, hairCol: [.86, .84, .78],
      staff: DRIFT, staffMake: 'carved', props: { crook: true, shells: 'strung' } },
    c: { tunic: [.4, .36, .3], robe: SALT, skirtColor: SALT, dots: [.86, .86, .82], dotsStyle: 'powder', boots: [.18, .13, .09], cord: [.5, .44, .36], shoulderWrap: [.3, .32, .3],
      hairCol: [.84, .82, .76], charms: [.8, .76, .66], staff: DRIFT, staffMake: 'carved', props: { crook: true, shells: 'all', bones: true } } },
  // Father Calix (Aurennais): one of the awake; at the door of the lesser gate nearest Aurenne's capital, at dusk
  calix: { label: 'Father Calix, the Smiling Lamb', island: 'aurenne', people: 'aurennais', g: 1, age: .45, muscle: .45, weight: .62, metres: 1.75,
    hairCol: [.08, .05, .03], hair: { style: 'short', len: .45 }, beard: 0, skin: [.55, .38, .26],
    a: { tunic: CREAM, robe: CREAM, cord: [.5, .4, .28], sandals: [.4, .28, .18] },
    b: { tunic: CREAM, robe: CREAM, cord: GOLD, sandals: [.4, .28, .18], cloak: [.8, .72, .52], cape: true, cloakLen: .8, brooch: GOLD, props: { sunburst: true, masks: 1 } },
    c: { tunic: WHITE, robe: WHITE, gownBorder: GOLD, cord: GOLD, sandals: [.4, .28, .18], cloak: [.8, .72, .52], cape: true, cloakLen: 1, cloakHem: GOLD, brooch: GOLD,
      necklace: GOLD, props: { sunburst: true, halo: true, masks: 3 } } },
  // the Veiled Child (Old Blood): sweeps one shrine of the Gatelands a game-week, dawn to dusk, the Guest's empty niche included
  child: { label: 'The Veiled Child', island: 'gatelands', people: 'oldblood', child: true, g: 0, metres: 1.4,
    hairCol: [.05, .045, .045], hair: { style: 'loose', len: .8 }, marks: .25,
    a: { tunic: UNDYED, skirtColor: [.42, .38, .32], boots: [.24, .18, .12], belt: [.3, .22, .14], wrap: [.5, .48, .44], scarf: true,
      staff: [.6, .5, .34], staffMake: 'hazel', props: { broom: true } },
    b: { tunic: [.62, .62, .6], skirtColor: [.5, .5, .48], boots: [.24, .18, .12], staff: [.6, .5, .34], staffMake: 'hazel', props: { broom: true, veil: .5 } },
    c: { tunic: [.62, .62, .6], skirtColor: [.5, .5, .48], boots: [.24, .18, .12], staff: [.6, .5, .34], staffMake: 'hazel', props: { broom: true, veil: 1 } } } };
export const ORDER = ['amani', 'alain', 'saewynn', 'calix', 'child'];

// the genome: the name rolled for the face (as castGenome does), the sheet's body, then the level's whole wardrobe
export function faithGenome(key, level, P) {
  const S = FAITH[key], G = P.rollGenome('faith:' + key, { people: S.people, g: S.g, child: !!S.child });
  for (const k of ['age', 'muscle', 'weight', 'hairCol', 'beard', 'skin']) if (S[k] != null) G[k] = Array.isArray(S[k]) ? S[k].slice() : S[k];
  const D = JSON.parse(JSON.stringify(S[level] || S.b)), props = D.props || {};
  if (D.hairCol) { G.hairCol = D.hairCol; delete D.hairCol; } delete D.props;
  G.hair = { ...S.hair }; G.pose = { ...(G.pose || {}), stoop: 0 }; G.scar = null; G.marks = S.people === 'oldblood' ? S.marks : null;
  const skirt = D.robe ? 'long' : (S.g ? 'short' : 'long');
  G.dress = { ...Object.fromEntries(P.GARMENTS.map(k => [k, null])), ...P.DRESS_FLAGS, skirt, ...D };
  G.height = P.heightFor(G, S.metres); G.faith = key; G.props = props; return G;
}

// ── what the people kit has not ──
const lin = c => new THREE.Color().setRGB(...c, THREE.SRGBColorSpace);
const M_ = (c, o = {}) => new THREE.MeshStandardMaterial({ color: lin(c), roughness: o.r ?? .7, metalness: o.m ?? 0, side: o.ds ? THREE.DoubleSide : THREE.FrontSide,
  emissive: o.e ? lin(o.e) : 0x000000, emissiveIntensity: o.ei ?? 1 });
const tris = g => (g.index ? g.index.count : g.attributes.position.count) / 3;
const cyl = (r0, r1, L, n, m) => new THREE.Mesh(new THREE.CylinderGeometry(r1, r0, L, n), m);
function meshPts(M, mesh, out, step = 1) {
  const inv = new THREE.Matrix4().copy(M.root.matrixWorld).invert(), pos = mesh.geometry.attributes.position, v = new THREE.Vector3();
  for (let i = 0; i < pos.count; i += step) { if (mesh.isSkinnedMesh) mesh.getVertexPosition(i, v); else v.fromBufferAttribute(pos, i); v.applyMatrix4(mesh.matrixWorld).applyMatrix4(inv); out.push(v.clone()); }
  return out;
}
const bonePos = (M, n) => { M.root.updateMatrixWorld(true); return M.root.worldToLocal(M.byName[n].getWorldPosition(new THREE.Vector3())); };
const heldIn = o => { for (let p = o; p; p = p.parent) if (/staff|spear|sword|lantern/i.test(p.name || '')) return true; return false; };
// the worn surface (the body and what is worn over it; hair too when asked), its points in the root's frame
function surfPts(M, hair) {
  const key = hair ? '_surfH' : '_surf'; if (M[key]) return M[key]; M.root.updateMatrixWorld(true); const out = [];
  M.root.traverse(m => { if (!m.isMesh || heldIn(m) || /faithProps/.test(m.parent?.name || '')) return; if (!hair && /hair|brow|lash|beard/i.test(m.name || '')) return;
    const n = m.geometry.attributes.position.count; meshPts(M, m, out, n > 60000 ? 3 : 1); });
  return M[key] = out;
}
function frontZ(M, x, y, r = .04) { let z = -1e9; for (const p of surfPts(M)) if (Math.abs(p.x - x) < r && Math.abs(p.y - y) < r && p.z > z) z = p.z; return z; }
function backZ(M, x, y, r = .04) { let z = 1e9; for (const p of surfPts(M)) if (Math.abs(p.x - x) < r && Math.abs(p.y - y) < r && p.z < z) z = p.z; return z; }
function sideX(M, y, s, r = .03, lim = .3) { let v = 0; for (const p of surfPts(M)) if (Math.abs(p.y - y) < r && Math.abs(p.x) < lim && s * p.x > v) v = s * p.x; return s * v; }
// the top of a held staff, in the root's frame, and its line (unit, butt to head)
function staffLine(M) {
  const st = M.root.getObjectByName('staff'); if (!st) return null; M.root.updateMatrixWorld(true); const pts = []; st.traverse(o => { if (o.isMesh) meshPts(M, o, pts, 2); });
  if (!pts.length) return null; let lo = pts[0], hi = pts[0]; for (const p of pts) { if (p.y < lo.y) lo = p; if (p.y > hi.y) hi = p; }
  return { foot: lo, head: hi, dir: hi.clone().sub(lo).normalize(), len: hi.distanceTo(lo) };
}

// a caged lantern: a brass (or iron, or gilt) frame 0.26 m tall round a glass with a flame, a domed cap and a ring; 'staff' sets it on a
// staff's head (its foot at 0), else it hangs from its ring (the ring's top at 0). Lit: an amber glass and a small light
export function cageLantern(o = {}) {
  const g = new THREE.Group(), metal = o.metal === 'gilt' ? M_(GOLD, { r: .28, m: .9 }) : o.metal === 'brass' ? M_(BRASS, { r: .35, m: .85 }) : M_([.2, .2, .21], { r: .5, m: .7 }),
    glass = M_([1, .78, .42], { r: .2, e: [1, .62, .26], ei: 2.2 }), H = o.h || .26, R = o.r || .075, y0 = o.hang ? -H - .05 : 0;
  const base = cyl(R * 1.05, R * 1.1, .025, 16, metal); base.position.y = y0 + .0125; g.add(base);
  const gl = cyl(R * .72, R * .72, H * .62, 14, glass); gl.position.y = y0 + .025 + H * .31; g.add(gl);
  const N = o.metal === 'gilt' ? 8 : 6; for (let i = 0; i < N; i++) { const a = i / N * Math.PI * 2, b = cyl(.005, .005, H * .7, 4, metal); b.position.set(Math.cos(a) * R * .9, y0 + .025 + H * .35, Math.sin(a) * R * .9); g.add(b); }
  for (const t of [.25, .72]) { const r = new THREE.Mesh(new THREE.TorusGeometry(R * .92, .005, 4, 20), metal); r.rotation.x = Math.PI / 2; r.position.y = y0 + .025 + H * .7 * t; g.add(r); }
  const cap = new THREE.Mesh(new THREE.SphereGeometry(R * 1.05, 16, 6, 0, Math.PI * 2, 0, Math.PI / 2), metal); cap.position.y = y0 + .025 + H * .7; g.add(cap);
  const fin = new THREE.Mesh(new THREE.ConeGeometry(R * .3, H * .18, 8), metal); fin.position.y = y0 + .025 + H * .7 + R + H * .06; g.add(fin);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(.022, .004, 5, 12), metal); ring.position.y = y0 + .025 + H * .7 + R + H * .2; g.add(ring);
  if (o.metal === 'gilt') for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2, s = new THREE.Mesh(new THREE.ConeGeometry(.008, .06, 4), metal);
    s.position.set(Math.cos(a) * R * 1.15, y0 + .025 + H * .7 + .01, Math.sin(a) * R * 1.15); s.rotation.set(Math.sin(a) * .9, 0, -Math.cos(a) * .9); g.add(s); }
  if (o.light !== false) { const L = new THREE.PointLight(0xffb060, o.li ?? 1.6, 4, 2); L.position.y = y0 + .025 + H * .31; g.add(L); }
  return g;
}
// shells: a scallop (a ribbed fan 4 to 6 cm) or a cowrie (an egg 2.5 cm, split beneath); in their own frame facing +z
const SHELL_M = () => M_([.86, .8, .7], { r: .6 });
export function scallop(s = .05, m = SHELL_M()) {
  const sh = new THREE.Shape(); sh.moveTo(0, 0); for (let i = 0; i <= 14; i++) { const a = Math.PI * (.12 + .76 * i / 14), r = s * (1 + .06 * (i % 2)); sh.lineTo(Math.cos(a) * r, Math.sin(a) * r); } sh.lineTo(0, 0);
  const geo = new THREE.ShapeGeometry(sh, 2), p = geo.attributes.position; for (let i = 0; i < p.count; i++) { const x = p.getX(i), y = p.getY(i); p.setZ(i, .012 * Math.sqrt(Math.max(0, 1 - (x * x + y * y) / (s * s))) * s / .05); }
  geo.computeVertexNormals(); geo.translate(0, -s * .9, 0); const g = new THREE.Mesh(geo, m); return g;
}
export function cowrie(s = .025, m = SHELL_M()) { const g = new THREE.Mesh(new THREE.SphereGeometry(s / 2, 8, 6), m); g.scale.set(.7, 1, .55); return g; }
// a bone: a shaft with two knuckles, its length L, along +y from 0
export function bone(L = .12) {
  const g = new THREE.Group(), m = M_([.82, .78, .66], { r: .7 }); const s = cyl(.006, .006, L, 6, m); s.position.y = L / 2; g.add(s);
  for (const y of [0, L]) for (const sx of [-1, 1]) { const k = new THREE.Mesh(new THREE.SphereGeometry(.009, 6, 5), m); k.position.set(sx * .006, y, 0); g.add(k); }
  return g;
}
// a cord from a to b with what hangs from it
function cord(a, b, m) { const d = b.clone().sub(a), c = cyl(.0018, .0018, d.length(), 3, m); c.position.copy(a).addScaledVector(d, .5); c.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize()); return c; }
// the smiling mask: a face of gessoed linen 18 cm tall, gilt at the brows, two almond eyes cut through and the mouth a wide closed smile
// painted in red lake (the sheet's: "I had them made to look as they would after"); in its own frame, its face +z, its top at 0
export function smilingMask(tint = [.9, .86, .78]) {
  const g = new THREE.Group(), face = M_(tint, { r: .55 }), dark = M_([.02, .02, .02], { r: 1 }), red = M_([.5, .08, .08], { r: .6 }), gilt = M_(GOLD, { r: .3, m: .85 });
  const shell = new THREE.Mesh(new THREE.SphereGeometry(.09, 18, 14, -Math.PI * .42, Math.PI * .84, Math.PI * .08, Math.PI * .8), face); shell.scale.set(.55, 1.05, .82); shell.rotation.y = Math.PI / 2; shell.position.y = -.095; g.add(shell);
  for (const sx of [-1, 1]) { const e = new THREE.Mesh(new THREE.CircleGeometry(.011, 10), dark); e.scale.set(1.7, .7, 1); e.rotation.z = sx * -.25; e.position.set(sx * .028, -.075, .048); g.add(e);
    const b = new THREE.Mesh(new THREE.TorusGeometry(.022, .0028, 4, 10, Math.PI * .8), gilt); b.position.set(sx * .028, -.072, .046); b.rotation.z = Math.PI * .1; g.add(b); }
  const sm = new THREE.Mesh(new THREE.TorusGeometry(.03, .0042, 5, 16, Math.PI * .9), red); sm.rotation.z = Math.PI + Math.PI * .05; sm.position.set(0, -.12, .046); g.add(sm);
  const ribbon = cyl(.002, .002, .06, 3, M_([.5, .08, .08])); ribbon.position.set(0, .02, 0); g.add(ribbon);
  return g;
}
// the sunburst: a gilt disc and its rays, R across (the rays reach R, the disc .42 R), as a flat shape in xy
function sunShape(R, n = 16) {
  const s = new THREE.Shape(); for (let i = 0; i <= n * 2; i++) { const a = i / (n * 2) * Math.PI * 2 + Math.PI / 2, r = i % 2 ? R * .5 : (i % 4 ? R * .82 : R); const x = Math.cos(a) * r, y = Math.sin(a) * r; i ? s.lineTo(x, y) : s.moveTo(x, y); }
  return s;
}
// the veil: white linen from the crown down to yEnd, laid round the head's upright axis over what it covers (the body, the hair and
// what is worn), 1.6 cm clear, falling from the widest point above it (cloth hangs: below the shoulders it never draws in), with a few
// soft folds; a hand or a broom that reaches more than 0.3 m from the axis comes out through it
function veil(M, yEnd, open) {
  const pts = surfPts(M, true), hd = bonePos(M, 'head'), ax = hd.x, az = hd.z; let top = -1e9; for (const p of pts) if (Math.hypot(p.x - ax, p.z - az) < .12 && p.y > top) top = p.y;
  const NA = 48, dy = .02, NY = Math.ceil((top + .012 - yEnd) / dy) + 1, cell = Array.from({ length: NY }, () => new Float32Array(NA));
  for (const p of pts) { const dx = p.x - ax, dz = p.z - az, r = Math.hypot(dx, dz); if (r > .3) continue; const j = Math.floor((top + .012 - p.y) / dy); if (j < 0 || j >= NY) continue;
    const a = ((Math.atan2(dz, dx) / (Math.PI * 2) + 1) % 1) * NA; for (const k of [Math.floor(a), Math.floor(a) + 1, Math.floor(a) - 1]) { const kk = (k + NA) % NA; if (r > cell[j][kk]) cell[j][kk] = r; } }
  // open: the face left out in an oval between the brow and the chin, 47° either side of straight ahead at its widest, so the veil frames it as a head-cloth does
  const chin = bonePos(M, 'neck01').y + .02, brow = hd.y + .1, mid = (brow + chin) / 2, half = (brow - chin) / 2, opening = (y, a) => open && y < brow && y > chin && Math.abs(((a - Math.PI / 2 + Math.PI * 3) % (Math.PI * 2)) - Math.PI) < .82 * Math.sqrt(Math.max(0, 1 - ((y - mid) / half) ** 2));
  const pos = [], idx = [], R = [];
  for (let j = 0; j < NY; j++) { const row = []; for (let k = 0; k < NA; k++) { let r = j === 0 ? .01 : cell[j][k] + .016; if (j > 0) r = Math.max(r, R[j - 1][k] + (j * dy > .25 ? .0025 : 0)); row.push(r); } R.push(row); }
  // smooth round each row, so the cloth spans hollows rather than following them
  for (let j = 1; j < NY; j++) for (let pass = 0; pass < 3; pass++) { const r = R[j], c = r.slice(); for (let k = 0; k < NA; k++) r[k] = Math.max(c[k], (c[(k + NA - 1) % NA] + 2 * c[k] + c[(k + 1) % NA]) / 4); }
  for (let j = 0; j < NY; j++) { const y = top + .012 - j * dy, fold = Math.min(1, j * dy / .4);
    for (let k = 0; k <= NA; k++) { const a = k / NA * Math.PI * 2, r = R[j][k % NA] * (1 + .045 * fold * Math.sin(a * 9 + j * .05)); pos.push(ax + Math.cos(a) * r, y - (j === NY - 1 ? .015 * Math.sin(a * 9) : 0), az + Math.sin(a) * r); } }
  for (let j = 0; j < NY - 1; j++) for (let k = 0; k < NA; k++) { const y = top + .012 - (j + .5) * dy, an = (k + .5) / NA * Math.PI * 2; if (opening(y, an)) continue; const a = j * (NA + 1) + k, b = a + NA + 1; idx.push(a, a + 1, b, a + 1, b + 1, b); }
  const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); geo.setIndex(idx); geo.computeVertexNormals();
  const m = new THREE.MeshStandardMaterial({ color: lin([.86, .86, .84]), roughness: .95, side: THREE.DoubleSide }); const v = new THREE.Mesh(geo, m); v.name = 'faithVeil'; return v;
}
// a broom's head of heather tied on a staff's foot: 0.3 m of bristles, splayed to 0.12 m, bound twice with cord
function broomHead() {
  const g = new THREE.Group(), m = M_([.42, .32, .18], { r: .95 }), tie = M_([.3, .22, .14]);
  const b = new THREE.Mesh(new THREE.CylinderGeometry(.035, .07, .3, 14, 4, true), m); b.position.y = -.15; const p = b.geometry.attributes.position;
  for (let i = 0; i < p.count; i++) if (p.getY(i) < -.1) p.setX(i, p.getX(i) * (1 + .15 * Math.sin(i * 1.7))); b.geometry.computeVertexNormals(); b.material.side = THREE.DoubleSide; g.add(b);
  const core = cyl(.03, .05, .26, 10, m); core.position.y = -.13; g.add(core);
  for (const y of [-.02, -.08]) { const t = new THREE.Mesh(new THREE.TorusGeometry(.038 + (-y) * .1, .005, 4, 14), tie); t.rotation.x = Math.PI / 2; t.position.y = y; g.add(t); }
  return g;
}

// the props on a made body, in the root's frame (the slice's people stand still: placed once on the rest body, as the rivals' were)
export function faithProps(M, G) {
  const p = G.props || {}, out = new THREE.Group(); out.name = 'faithProps'; const stats = {};
  const neck = bonePos(M, 'neck01'), sp1 = bonePos(M, 'spine01'), S = staffLine(M);
  if (p.cage && S) { // the caged lantern on the staff's head, upright whatever the staff's lean
    const L = cageLantern({ metal: p.cage, h: p.cage === 'gilt' ? .3 : .26 }); L.position.copy(S.head).addScaledVector(S.dir, -.01); out.add(L); stats.lamp = +L.position.y.toFixed(2); }
  if (p.crook && S) { // a crook of driftwood off the staff's head, 0.22 m out to the front, the lantern hung from it on a short chain
    const drift = M_(DRIFT, { r: .95 }), a = S.head.clone(), out2 = new THREE.Vector3(S.dir.x * .2, 0, .2).normalize(), b = a.clone().addScaledVector(out2, .22).add(new THREE.Vector3(0, .05, 0));
    const arm = cyl(.016, .011, a.distanceTo(b), 6, drift); arm.position.copy(a).lerp(b, .5); arm.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), b.clone().sub(a).normalize()); out.add(arm);
    const tip = b.clone().add(new THREE.Vector3(0, -.03, 0)), ch = cyl(.002, .002, .08, 3, M_(IRON, { m: .6 })); ch.position.copy(tip).add(new THREE.Vector3(0, -.04, 0)); out.add(ch);
    const L = cageLantern({ metal: 'iron', hang: true, h: .2, r: .06 }); L.position.copy(tip).add(new THREE.Vector3(0, -.06, 0)); out.add(L);
    if (p.bones) for (let i = 0; i < 4; i++) { const t = .35 + i * .12, at = a.clone().lerp(b, t), d = .08 + .05 * (i % 2);
      out.add(cord(at, at.clone().add(new THREE.Vector3(0, -d, 0)), M_([.4, .34, .26])));
      const k = i % 2 ? bone(.1) : scallop(.035); k.position.copy(at).add(new THREE.Vector3(0, -d - (i % 2 ? .1 : 0), 0)); if (!(i % 2)) k.position.y += .002; out.add(k); }
    stats.crook = +b.y.toFixed(2); }
  if (p.shells) { // strung down the coat's two fronts (and, 'all', round the hem), 9 cm apart, each on its own cord 3 cm long
    const sm = SHELL_M(), cm = M_([.4, .34, .26]); let n = 0; const yTop = neck.y - .08, yBot = p.shells === 'all' ? sp1.y - .65 : sp1.y - .05;
    for (const sx of [-1, 1]) for (const x0 of [.05, .11, .17]) for (let y = yTop - x0 * .4; y > yBot; y -= .075) { const x = sx * (x0 + (yTop - y) * .05), z = frontZ(M, x, y, .03); if (z < -1) continue;
      const s = n % 3 ? cowrie(.032, sm) : scallop(.05, sm); s.position.set(x, y - .03, z + .012); s.rotation.y = sx * -.25; out.add(s); out.add(cord(new THREE.Vector3(x, y, z + .004), new THREE.Vector3(x, y - .03, z + .012), cm)); n++; }
    stats.shells = n; }
  if (p.sunburst) { // stitched in gilt on the cape between the shoulders, 0.36 m across, every point laid on the cape where it falls, 3 mm out
    const R = .18, cy = neck.y - .2, geo = new THREE.ShapeGeometry(sunShape(R), 3); geo.scale(-1, 1, 1); const ps = geo.attributes.position;
    for (let i = 0; i < ps.count; i++) { const x = ps.getX(i), y = ps.getY(i) + cy; ps.setXYZ(i, x, y, backZ(M, x, y, .045) - .008); }
    geo.computeVertexNormals(); const m = new THREE.Mesh(geo, M_([.8, .6, .22], { r: .5, m: .25, ds: true, e: [.3, .2, .05], ei: .5 })); out.add(m); stats.sun = R * 2; }
  if (p.halo) { // the sheet's halo: the gilt sun 0.62 m across stood 0.12 m behind the head on an iron rod from the cape's collar
    const hd = bonePos(M, 'head'), z = backZ(M, 0, hd.y, .05), g = new THREE.Mesh(new THREE.ShapeGeometry(sunShape(.31, 20), 2), M_(GOLD, { r: .3, m: .9, ds: true, e: [.5, .34, .08], ei: .4 }));
    g.position.set(hd.x, hd.y + .08, z - .1); out.add(g); const rod = cyl(.006, .006, .3, 6, M_(IRON, { m: .6 })); rod.position.set(hd.x, hd.y - .12, z - .07); out.add(rod); }
  if (p.masks) { // at the cord's right (the wearer's), at 0.6 of the stature, hung by their ribbons, faces out; three in a row for the sheet
    let lo = 1e9, hi = -1e9; for (const q of surfPts(M)) { lo = Math.min(lo, q.y); hi = Math.max(hi, q.y); } const yB = lo + .6 * (hi - lo);
    for (let i = 0; i < p.masks; i++) { const x = -.1 - i * .07, z = frontZ(M, x, yB - .09, .04), m = smilingMask(i === 1 ? [.82, .74, .56] : [.9, .86, .78]);
      m.position.set(x, yB, z + .02 + i * .006); m.rotation.y = -.15 - i * .12; m.scale.setScalar(.82); out.add(m); } }
  if (p.broom && S) { const b = broomHead(); b.position.copy(S.foot).addScaledVector(S.dir, .2); b.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), S.dir); out.add(b); stats.broom = +S.len.toFixed(2); }
  if (p.veil) { let lo = 1e9, hi = -1e9; for (const q of surfPts(M, true)) { lo = Math.min(lo, q.y); hi = Math.max(hi, q.y); } const yEnd = p.veil >= 1 ? lo + .04 : lo + .5 * (hi - lo), v = veil(M, yEnd, p.veil < 1); out.add(v); stats.veil = +(v.geometry.boundingBox || (v.geometry.computeBoundingBox(), v.geometry.boundingBox)).min.y.toFixed(2); }
  let n = 0; out.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; n += tris(o.geometry); } }); M.root.add(out); return { tris: Math.round(n), ...stats };
}
