// Townsfolk with names (the concept artist, 20 Nov 2026; backlog L2, "Townsfolk with names", OG-082): sheet E2 drew five new faces for
// the towns: Mairead, innkeeper and storyteller (stout, laughing, red-cheeked, shawl and apron, a pewter tankard; the Salt and Lantern);
// Darragh, gravekeeper and stonemason (hooded, white-bearded, a carved cross-stone behind him, chisels and a lantern; reads old carvings);
// Iliana, shipwright and salvager (strong, a red headscarf, an adze and a plane, a hull on the stocks behind her); Brother Caelen, a
// sceptic priest (young, dark-haired, a black hooded habit over white, a book and a chalice); Lyra, herbalist and hunter (red-haired, a
// green hooded cloak, a bow, a basket of purple flowers, a deer in her scene). The catalogue's corrections hold at every level: the Salt
// and Lantern is off Ashenmoor (a farming village with no pier) and stands on a quay; Caelen is Aurennais and drawn fair on the sheet, so
// recoloured (decision 4 of 12 Oct); Darragh and Lyra are labelled Markmen with Irish-register names and drawn red- and white-haired, so
// they are Gatelanders here (the Mark's names are Anglo, its hair ash-blond; the names are the quest writer's to keep or change); Iliana
// is Aurennais by her name's register. The sheet's cross-stone is a ringed stone with its arms uncut: the Church's sign is the shuttle.
//
// The question is how much of their trade a named townsperson carries, three levels:
//   a  the trade alone: what anyone of that work wears in their town (an innkeeper's apron, a mason's leather apron and hammer, a
//      shipwright's rolled sleeves and apron, a priest's habit and book, a forager's cloak and basket); found by name and place;
//   b  the sheet's faces and tools (recommended): Mairead's madder shawl, her keys and the tankard; Darragh hooded, white-bearded, the
//      lantern in hand and a roll of chisels at his belt; Iliana's red headscarf and the adze; Caelen's black hooded habit over white,
//      the book and the chalice; Lyra's green hooded cloak, the bow and quiver on her back and the basket full of heather;
//   c  in their place (the sheet's scenes): b, and the set piece of the work stood with them: the Salt and Lantern's sign on its post,
//      the ringed stone Darragh is carving, a hull on the stocks behind Iliana, Caelen's altar with two candles, and a red deer by Lyra.
// TOWNSFOLK[key] is the sheet; townGenome(key, level, P) makes the genome (P carries people.js's rollGenome, heightFor, GARMENTS and
// DRESS_FLAGS). townProps(M, G, level) adds what people.js does not have (the keys, the chisel roll, the adze, the chalice, the heather,
// the bow and quiver from rivals.js) and townScene(key) builds a set piece in its own frame; both return their triangles.
// Colours are linear [r,g,b] as in CAST.
import * as THREE from 'three';
import { cageLantern } from './faith.js';
import { shortBow, quiver } from './rivals.js';

const LEATHER = [.22, .14, .09], PEWTER = [.5, .5, .5], IRON = [.42, .43, .45], CREAM = [.82, .77, .64], WHITE = [.86, .85, .8], BLACK = [.035, .033, .035],
  GREEN = [.1, .2, .1], MADDER = [.42, .1, .07], RED = [.55, .08, .06], LINEN = [.72, .68, .58], GREY = [.36, .35, .33], OAK = [.34, .23, .13];

export const TOWNSFOLK = {
  // Mairead (Gatelander): keeps the Salt and Lantern on a Gatelands quay, and its stories
  mairead: { label: 'Mairead, the Salt and Lantern', island: 'gatelands', people: 'gatelander', g: 0, age: .58, muscle: .45, weight: .85, metres: 1.64,
    hairCol: [.4, .16, .07], hair: { style: 'bun', len: .6 },
    a: { tunic: [.62, .56, .44], skirtColor: [.3, .26, .2], boots: [.2, .14, .1], belt: LEATHER, apron: LINEN, tankard: PEWTER },
    b: { tunic: [.62, .56, .44], skirtColor: [.3, .26, .2], boots: [.2, .14, .1], belt: LEATHER, apron: LINEN, shoulderWrap: MADDER, tankard: PEWTER, props: { keys: true } },
    c: { tunic: [.62, .56, .44], skirtColor: [.3, .26, .2], boots: [.2, .14, .1], belt: LEATHER, apron: LINEN, shoulderWrap: MADDER, tankard: PEWTER, props: { keys: true } } },
  // Darragh (Gatelander): keeps a churchyard and cuts its stones; reads the old carvings
  darragh: { label: 'Darragh, gravekeeper and mason', island: 'gatelands', people: 'gatelander', g: 1, age: .86, muscle: .6, weight: .4, metres: 1.76,
    hairCol: [.86, .85, .82], hair: { style: 'short', len: .4 }, beard: 1,
    a: { tunic: [.4, .38, .34], trousers: [.26, .24, .2], boots: [.18, .13, .09], belt: LEATHER, apron: [.3, .2, .12], apronLeather: true, hammer: [.4, .3, .2] },
    b: { tunic: [.4, .38, .34], trousers: [.26, .24, .2], boots: [.18, .13, .09], belt: LEATHER, apron: [.3, .2, .12], apronLeather: true, cowl: GREY, lantern: [.22, .22, .22],
      props: { chisels: true } },
    c: { tunic: [.4, .38, .34], trousers: [.26, .24, .2], boots: [.18, .13, .09], belt: LEATHER, apron: [.3, .2, .12], apronLeather: true, cowl: GREY, lantern: [.22, .22, .22],
      props: { chisels: true } } },
  // Iliana (Aurennais): builds and raises hulls at a port's slip
  iliana: { label: 'Iliana, shipwright and salvager', island: 'aurenne', people: 'aurennais', g: 0, skirt: 'short', age: .4, muscle: .9, weight: .5, metres: 1.75,
    hairCol: [.06, .04, .03], hair: { style: 'tail', len: .6 }, skin: [.32, .2, .13],
    a: { tunic: [.7, .62, .48], trousers: [.3, .24, .18], boots: [.24, .16, .1], belt: LEATHER, apron: [.32, .22, .14], apronLeather: true, sleevesRolled: true, hammer: [.4, .3, .2] },
    b: { tunic: [.7, .62, .48], trousers: [.3, .24, .18], boots: [.24, .16, .1], belt: LEATHER, apron: [.32, .22, .14], apronLeather: true, sleevesRolled: true,
      wrap: RED, scarf: true, props: { adze: true } },
    c: { tunic: [.7, .62, .48], trousers: [.3, .24, .18], boots: [.24, .16, .1], belt: LEATHER, apron: [.32, .22, .14], apronLeather: true, sleevesRolled: true,
      wrap: RED, scarf: true, props: { adze: true } } },
  // Brother Caelen (Aurennais): a young priest of the Church who doubts aloud ("Faith isn't certainty")
  caelen: { label: 'Brother Caelen, the doubter', island: 'aurenne', people: 'aurennais', g: 1, age: .3, muscle: .45, weight: .3, metres: 1.78,
    hairCol: [.05, .035, .03], hair: { style: 'short', len: .45 }, beard: .1, skin: [.36, .23, .15],
    a: { tunic: WHITE, robe: BLACK, cord: [.3, .26, .2], sandals: [.3, .2, .12], book: [.3, .12, .08] },
    b: { tunic: WHITE, robe: BLACK, cord: WHITE, sandals: [.3, .2, .12], cowl: BLACK, book: [.3, .12, .08], props: { chalice: true } },
    c: { tunic: WHITE, robe: BLACK, cord: WHITE, sandals: [.3, .2, .12], cowl: BLACK, book: [.3, .12, .08], props: { chalice: true } } },
  // Lyra (Gatelander): gathers in the woods and hunts them; sells to the apothecary
  lyra: { label: 'Lyra, herbalist and hunter', island: 'gatelands', people: 'gatelander', g: 0, age: .34, muscle: .6, weight: .3, metres: 1.7,
    hairCol: [.52, .17, .05], hair: { style: 'plait', len: .8 },
    a: { tunic: [.46, .42, .3], skirtColor: [.3, .28, .2], boots: [.22, .15, .1], belt: LEATHER, cloak: GREEN, cloakLen: .8, hood: 'down', brooch: [.6, .6, .62], cape: true,
      basket: [.5, .38, .22] },
    b: { tunic: [.46, .42, .3], skirtColor: [.3, .28, .2], boots: [.22, .15, .1], belt: LEATHER, cloak: GREEN, cloakLen: .8, hood: 'down', brooch: [.6, .6, .62], cape: true,
      basket: [.5, .38, .22], props: { heather: true, bow: true, quiver: true } },
    c: { tunic: [.46, .42, .3], skirtColor: [.3, .28, .2], boots: [.22, .15, .1], belt: LEATHER, cloak: GREEN, cloakLen: .8, hood: 'up', brooch: [.6, .6, .62], cape: true,
      basket: [.5, .38, .22], props: { heather: true, bow: true, quiver: true } } } };
export const ORDER = ['mairead', 'darragh', 'iliana', 'caelen', 'lyra'];

// the genome: the name rolled for the face (as castGenome does), the sheet's body, then the level's whole wardrobe
export function townGenome(key, level, P) {
  const S = TOWNSFOLK[key], G = P.rollGenome('town:' + key, { people: S.people, g: S.g });
  for (const k of ['age', 'muscle', 'weight', 'hairCol', 'beard', 'skin']) if (S[k] != null) G[k] = Array.isArray(S[k]) ? S[k].slice() : S[k];
  const D = JSON.parse(JSON.stringify(S[level] || S.b)), props = D.props || {}; delete D.props;
  G.hair = { ...S.hair }; G.pose = { ...(G.pose || {}), stoop: key === 'darragh' ? .25 : 0 }; G.scar = null; G.marks = null;
  const skirt = S.skirt || (D.robe ? 'long' : (S.g ? 'short' : 'long'));
  G.dress = { ...Object.fromEntries(P.GARMENTS.map(k => [k, null])), ...P.DRESS_FLAGS, skirt, ...D };
  G.height = P.heightFor(G, S.metres); G.town = key; G.props = props; return G;
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
function meshPts(M, mesh, out, step = 1) {
  const inv = new THREE.Matrix4().copy(M.root.matrixWorld).invert(), pos = mesh.geometry.attributes.position, v = new THREE.Vector3();
  for (let i = 0; i < pos.count; i += step) { if (mesh.isSkinnedMesh) mesh.getVertexPosition(i, v); else v.fromBufferAttribute(pos, i); v.applyMatrix4(mesh.matrixWorld).applyMatrix4(inv); out.push(v.clone()); }
  return out;
}
const bonePos = (M, n) => { M.root.updateMatrixWorld(true); return M.root.worldToLocal(M.byName[n].getWorldPosition(new THREE.Vector3())); };
const HELD = /staff|spear|sword|lantern|tankard|book|basket|hammer/i;
const heldIn = o => { for (let p = o; p; p = p.parent) if (HELD.test(p.name || '')) return true; return false; };
function surfPts(M) {
  if (M._surf) return M._surf; M.root.updateMatrixWorld(true); const out = [];
  M.root.traverse(m => { if (!m.isMesh || heldIn(m) || /townProps/.test(m.parent?.name || '') || /hair|brow|lash|beard/i.test(m.name || '')) return;
    const n = m.geometry.attributes.position.count; meshPts(M, m, out, n > 60000 ? 3 : 1); });
  return M._surf = out;
}
function frontZ(M, x, y, r = .04) { let z = -1e9; for (const p of surfPts(M)) if (Math.abs(p.x - x) < r && Math.abs(p.y - y) < r && p.z > z) z = p.z; return z; }
function backZ(M, x, y, r = .04) { let z = 1e9; for (const p of surfPts(M)) if (Math.abs(p.x - x) < r && Math.abs(p.y - y) < r && p.z < z) z = p.z; return z; }
function sideX(M, y, s, r = .03, lim = .32) { let v = 0; for (const p of surfPts(M)) if (Math.abs(p.y - y) < r && Math.abs(p.x) < lim && s * p.x > v) v = s * p.x; return s * v; }
// the held object's centre (the kit puts each in one hand), so a second thing goes in the other
function heldAt(M, name) { const o = M.root.getObjectByName(name); if (!o) return null; M.root.updateMatrixWorld(true); const pts = []; o.traverse(m => { if (m.isMesh) meshPts(M, m, pts, 4); });
  if (!pts.length) return null; const c = new THREE.Vector3(); for (const p of pts) c.add(p); return c.divideScalar(pts.length); }
function freeWrist(M, name) { const wL = bonePos(M, 'wrist.L'), wR = bonePos(M, 'wrist.R'), h = name && heldAt(M, name); if (!h) return { w: wR, s: -1 };
  return h.distanceTo(wL) < h.distanceTo(wR) ? { w: wR, s: -1 } : { w: wL, s: 1 }; }

// a ring of keys: an iron ring 6 cm across and four keys hung from it, 7 to 10 cm, their bows on the ring; its top at 0, facing +z
export function keyRing() {
  const g = new THREE.Group(), m = M_([.3, .3, .3], { r: .45, m: .75 });
  const ring = new THREE.Mesh(new THREE.TorusGeometry(.03, .003, 5, 18), m); ring.position.y = -.03; g.add(ring);
  for (let i = 0; i < 4; i++) { const a = -Math.PI / 2 + (i - 1.5) * .32, L = .07 + .01 * (i % 3), k = new THREE.Group();
    const bw = new THREE.Mesh(new THREE.TorusGeometry(.009, .0025, 4, 10), m); k.add(bw); const sh = cyl(.0022, .0022, L, 5, m); sh.position.y = -L / 2 - .009; k.add(sh);
    const bit = box(.012, .009, .003, m); bit.position.set(.006, -L - .004, 0); k.add(bit);
    k.position.set(Math.cos(a) * .03, -.03 + Math.sin(a) * .03, .004 * i); k.rotation.z = a + Math.PI / 2; g.add(k); }
  return g;
}
// a roll of chisels: a leather roll 24 cm wide tied at the belt, five chisels and a point standing out of its pockets, 14 to 20 cm; its top at 0
export function chiselRoll() {
  const g = new THREE.Group(), hide = M_([.3, .2, .12], { r: .85 }), ash = M_([.6, .48, .32], { r: .6 }), steel = M_([.5, .52, .55], { r: .4, m: .8 });
  const roll = box(.24, .14, .035, hide); roll.position.y = -.1; g.add(roll); const flap = box(.25, .05, .04, hide); flap.position.y = -.03; g.add(flap);
  for (let i = 0; i < 6; i++) { const x = -.09 + i * .036, L = .14 + .02 * (i % 3), t = new THREE.Group();
    const h = cyl(.009, .011, .09, 7, ash); h.position.y = .045; t.add(h); const s = cyl(.004, .004, L - .09, 5, steel); s.position.y = -(L - .09) / 2; t.add(s);
    t.position.set(x, -.05, .006); g.add(t); }
  return g;
}
// a shipwright's adze: an ash haft 0.68 m with a swelled grip and an iron blade 13 cm, its edge across the haft, curved back to the user
export function adze() {
  const g = new THREE.Group(), ash = M_([.58, .44, .28], { r: .6 }), iron = M_([.34, .34, .35], { r: .45, m: .75 }), edge = M_([.62, .64, .66], { r: .3, m: .85 });
  const h = cyl(.016, .013, .68, 8, ash); h.position.y = .34; g.add(h); const sw = cyl(.019, .016, .1, 8, ash); sw.position.y = .05; g.add(sw);
  const eye = box(.05, .06, .045, iron); eye.position.y = .66; g.add(eye);
  const pts = []; for (let i = 0; i <= 8; i++) { const t = i / 8; pts.push(new THREE.Vector3(0, .66 - .02 * t - .07 * t * t, .02 + .12 * t)); }
  const blade = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 10, .012, 4, false), iron); blade.scale.x = 3.2; g.add(blade);
  const e = box(.075, .006, .02, edge); e.position.set(0, .57, .14); e.rotation.x = .9; g.add(e);
  return g;
}
// a chalice: pewter, 17 cm, a foot 8 cm across, a knop on the stem and a bowl 9 cm across; its foot at 0
export function chalice() {
  const pts = [[0, 0], [.04, 0], [.04, .006], [.012, .02], [.009, .06], [.016, .07], [.009, .08], [.01, .095], [.04, .12], [.046, .17], [.043, .17], [.036, .125], [0, .115]].map(([x, y]) => new THREE.Vector2(x, y));
  const m = new THREE.Mesh(new THREE.LatheGeometry(pts, 22), M_([.72, .72, .7], { r: .3, m: .85, ds: true })); return m;
}
// heather in the basket: forty sprigs of purple bells standing 6 to 12 cm out of its mouth
function heather(M) {
  const b = M.root.getObjectByName('basket'); if (!b) return null; const a = M.root.getObjectByName('basketApples'); if (a) a.visible = false;
  M.root.updateMatrixWorld(true); const pts = []; b.traverse(o => { if (o.isMesh && /basketRim/.test(o.name)) meshPts(M, o, pts, 2); }); if (!pts.length) b.traverse(o => { if (o.isMesh) meshPts(M, o, pts, 6); });
  const c = new THREE.Vector3(); let top = -1e9; for (const p of pts) { c.add(p); top = Math.max(top, p.y); } c.divideScalar(pts.length); let r = 0; for (const p of pts) r = Math.max(r, Math.hypot(p.x - c.x, p.z - c.z));
  const g = new THREE.Group(), stem = M_([.24, .3, .14], { r: .9 }), bells = [M_([.46, .2, .5], { r: .8 }), M_([.56, .28, .58], { r: .8 }), M_([.38, .16, .42], { r: .8 })];
  const R = (i => () => (i = (i * 16807) % 2147483647) / 2147483647)(77);
  for (let i = 0; i < 40; i++) { const a = R() * Math.PI * 2, d = Math.sqrt(R()) * r * .8, L = .06 + R() * .06, x = c.x + Math.cos(a) * d, z = c.z + Math.sin(a) * d, y = top - .03;
    const tilt = new THREE.Vector3(Math.cos(a) * d * 1.6, 1, Math.sin(a) * d * 1.6).normalize(); const s = along(cyl(.0016, .0016, L, 3, stem), new THREE.Vector3(x, y, z), new THREE.Vector3(x, y, z).addScaledVector(tilt, L)); g.add(s);
    const head = new THREE.Mesh(new THREE.CylinderGeometry(.006, .009, L * .55, 5), bells[i % 3]); head.position.set(x, y, z).addScaledVector(tilt, L * .72); head.quaternion.copy(s.quaternion); g.add(head); }
  return g;
}

// the props on a made body, in the root's frame (the slice's people stand still: placed once on the rest body, as the faiths' were)
export function townProps(M, G) {
  const p = G.props || {}, out = new THREE.Group(); out.name = 'townProps'; const stats = {}, sp1 = bonePos(M, 'spine01'), neck = bonePos(M, 'neck01');
  let lo = 1e9, hi = -1e9; for (const q of surfPts(M)) { lo = Math.min(lo, q.y); hi = Math.max(hi, q.y); } const belt = lo + .58 * (hi - lo); stats.belt = +(belt - lo).toFixed(2);
  if (p.keys) { const yB = belt - .01, x = sideX(M, yB, 1) - .02, k = keyRing(); k.position.set(x, yB, .03); k.rotation.y = Math.PI / 2 - .3; out.add(k); }
  if (p.chisels) { const yB = belt - .02, x = -.11, z = frontZ(M, x, yB - .08, .05), r = chiselRoll(); r.position.set(x, yB, z + .022); r.rotation.y = -.25; r.scale.setScalar(.85); out.add(r); }
  if (p.adze) { const { w, s } = freeWrist(M, null), a = adze(); // hung from the hand at her side, the head forward and down
    a.position.set(w.x + s * .01, w.y + .02, w.z + .03); a.rotation.set(0, 0, Math.PI + s * .05); out.add(a); stats.adze = .68; }
  if (p.chalice) { const { w, s } = freeWrist(M, 'book'), c = chalice(); // the wearer's other hand brought up a little, the cup in the palm
    c.position.set(w.x + s * .02, w.y - .12, w.z + .06); out.add(c); stats.chalice = +c.position.y.toFixed(2); }
  if (p.heather) { const h = heather(M); if (h) out.add(h); }
  if (p.bow) { const c = new THREE.Vector3(0, (neck.y + sp1.y) / 2 - .02, 0); c.z = backZ(M, 0, c.y, .08) - .07; const b = shortBow(); b.position.copy(c); b.rotation.set(0, Math.PI, -.55); out.add(b); }
  if (p.quiver) { const yB = sp1.y - .1, x = sideX(M, yB, 1); const q = quiver(); q.position.set(x + .05, yB - .38, -.08); q.rotation.set(-.18, 0, -.1); out.add(q); }
  let n = 0; out.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; n += tris(o.geometry); } }); M.root.add(out); return { tris: Math.round(n), ...stats };
}

// ── the set pieces of c, each in its own frame in metres, its foot at 0, its face +z ──
function canvasTex(w, h, draw) { const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t; }
// the Salt and Lantern's sign: an oak post 3.1 m on a stone footing, an iron arm 1.0 m with a scrolled brace, a board 0.8 by 0.56 m on
// two chains painted with a lantern over a heap of salt and the name, and a lit lantern hung from the arm's end
export function innSign() {
  const g = new THREE.Group(), oak = M_(OAK, { r: .8 }), iron = M_([.16, .16, .17], { r: .5, m: .7 }), stone = M_([.5, .48, .44], { r: .95 });
  g.add(at(box(.42, .3, .42, stone), 0, .15, 0));
  const post = box(.16, 3.1, .16, oak); post.position.y = 1.55 + .3; g.add(post);
  const arm = box(1.05, .035, .035, iron); arm.position.set(.52, 3.05, 0); g.add(arm);
  const br = []; for (let i = 0; i <= 16; i++) { const t = i / 16; br.push(new THREE.Vector3(.08 + .62 * t, 2.55 + .48 * Math.sqrt(t), 0)); } g.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(br), 18, .012, 5), iron));
  const sc = new THREE.Mesh(new THREE.TorusGeometry(.07, .01, 5, 14, Math.PI * 1.5), iron); sc.position.set(.32, 2.78, 0); g.add(sc);
  const tex = canvasTex(512, 360, (x, w, h) => { x.fillStyle = '#e8dcc0'; x.fillRect(0, 0, w, h); x.strokeStyle = '#3a2a1a'; x.lineWidth = 14; x.strokeRect(10, 10, w - 20, h - 20);
    x.fillStyle = '#f4f1ea'; x.beginPath(); x.moveTo(170, 250); x.quadraticCurveTo(256, 170, 342, 250); x.closePath(); x.fill(); x.strokeStyle = '#8a8478'; x.lineWidth = 3; x.stroke();
    x.fillStyle = '#2a2420'; x.fillRect(226, 70, 60, 10); x.fillRect(232, 80, 48, 90); x.fillStyle = '#f2b048'; x.fillRect(240, 92, 32, 64); x.fillStyle = '#2a2420'; x.fillRect(222, 168, 68, 10);
    x.beginPath(); x.arc(256, 62, 10, 0, Math.PI * 2); x.lineWidth = 4; x.strokeStyle = '#2a2420'; x.stroke();
    x.fillStyle = '#5a1a10'; x.font = 'bold 44px Georgia, serif'; x.textAlign = 'center'; x.fillText('The Salt & Lantern', 256, 318); });
  const board = new THREE.Group(), face = M_([1, 1, 1], { r: .75, map: tex }), wood = M_([.3, .2, .12], { r: .8 });
  const b = box(.8, .56, .04, wood); board.add(b); for (const s of [1, -1]) { const f = new THREE.Mesh(new THREE.PlaneGeometry(.78, .54), face); f.position.z = s * .021; if (s < 0) f.rotation.y = Math.PI; board.add(f); }
  board.position.set(.55, 2.62, 0); board.rotation.y = Math.PI / 2; g.add(board);
  for (const dz of [-.33, .33]) { const ch = cyl(.004, .004, .1, 4, iron); ch.position.set(.55, 2.95, dz * .9); g.add(ch); }
  const L = cageLantern({ metal: 'iron', hang: true, h: .3, r: .085, li: 1.2 }); L.position.set(1.02, 3.03, 0); g.add(L);
  return g;
}
// the ringed stone Darragh is cutting: a granite shaft 1.75 m on a stepped base, its head a ring 0.62 m across round a boss, the shaft's
// face carved in interlace and spirals (a bump map), half the knotwork still marked out and not yet cut; the sheet's cross with its arms uncut
export function ringStone() {
  const g = new THREE.Group(), bump = canvasTex(256, 512, (x, w, h) => { x.fillStyle = '#808080'; x.fillRect(0, 0, w, h); x.strokeStyle = '#ffffff'; x.lineWidth = 10;
    for (let r = 0; r < 6; r++) for (let c = 0; c < 2; c++) { const cx = 70 + c * 116, cy = 50 + r * 80; x.beginPath(); for (let t = 0; t < 14; t += .2) { const rr = 4 + t * 2.6; x.lineTo(cx + Math.cos(t) * rr, cy + Math.sin(t) * rr); } x.stroke(); }
    x.strokeStyle = '#202020'; x.lineWidth = 6; for (let i = 0; i < 9; i++) { x.beginPath(); x.moveTo(20, 30 + i * 55); x.bezierCurveTo(120, 0 + i * 55, 140, 80 + i * 55, 236, 30 + i * 55); x.stroke(); } });
  const gran = M_([.56, .55, .52], { r: .92, bump, bs: 3 }), base = M_([.5, .49, .46], { r: .95 });
  g.add(at(box(.9, .22, .62, base), 0, .11, 0), at(box(.66, .2, .44, base), 0, .32, 0));
  const shaft = new THREE.Mesh(new THREE.BoxGeometry(.4, 1.3, .24, 1, 4, 1), gran); const p = shaft.geometry.attributes.position; for (let i = 0; i < p.count; i++) { const t = (p.getY(i) + .65) / 1.3; p.setX(i, p.getX(i) * (1 - .18 * t)); } shaft.geometry.computeVertexNormals();
  shaft.position.y = .42 + .65; g.add(shaft);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(.26, .055, 10, 28), gran); ring.scale.z = 2.0; ring.position.y = 1.82; g.add(ring);
  const boss = new THREE.Mesh(new THREE.CylinderGeometry(.1, .11, .2, 20), gran); boss.rotation.x = Math.PI / 2; boss.position.y = 1.82; g.add(boss);
  const cap = box(.22, .14, .2, gran); cap.position.y = 2.14; g.add(cap);
  // his work: a mallet and two chisels on the base, a chalk line across the unfinished face
  const ash = M_([.6, .48, .32]), steel = M_([.5, .52, .55], { r: .4, m: .8 }); const mal = cyl(.045, .045, .12, 10, ash); mal.rotation.z = Math.PI / 2; mal.position.set(.32, .48, .1); g.add(mal);
  const mh = cyl(.012, .012, .24, 6, ash); mh.rotation.x = Math.PI / 2; mh.position.set(.32, .46, .22); g.add(mh);
  for (const dx of [-.22, -.28]) { const c = cyl(.004, .004, .2, 5, steel); c.rotation.z = Math.PI / 2 - .1; c.position.set(dx, .43, .16); g.add(c); }
  return g;
}
// a hull on the stocks: a keel 7.2 m on four oak blocks, the stem and sternpost raked, nine frames of a round-bilged boat 2.1 m in the
// beam, the four lowest strakes planked and the rest open; built along x, the bow at +x
export function hullStocks() {
  const g = new THREE.Group(), oak = M_([.46, .32, .18], { r: .8 }), raw = M_([.62, .48, .3], { r: .85 }), block = M_([.3, .24, .18], { r: .95 });
  const L = 7.2, K = .5; for (const x of [-2.8, -1, .9, 2.7]) g.add(at(box(.4, K, .5, block), x, K / 2, 0));
  g.add(at(box(L, .2, .16, oak), 0, K + .1, 0));
  const half = x => { const t = x / (L / 2); return 1.05 * Math.max(0, 1 - t ** 4) ** .6; }, depth = 1.35;
  const stem = (s) => { const pts = []; for (let i = 0; i <= 10; i++) { const t = i / 10; pts.push(new THREE.Vector3(s * (L / 2 + .55 * t ** 1.6), K + .2 + depth * t * 1.1, 0)); } return new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 12, .07, 6), oak); };
  g.add(stem(1), stem(-1));
  const sec = (x, u) => { const b = half(x) + .02, a = u * Math.PI / 2; return new THREE.Vector3(x, K + .2 + depth * (1 - Math.cos(a)) * .92 + .1 * u, Math.sin(a) * b); };
  for (let i = 0; i < 9; i++) { const x = -L / 2 + .6 + i * (L - 1.2) / 8; for (const s of [1, -1]) { const pts = []; for (let k = 0; k <= 10; k++) { const v = sec(x, k / 10); v.z *= s; pts.push(v); } g.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 10, .045, 4), raw)); } }
  // four planked strakes a side, the lowest from stem to stern
  for (const s of [1, -1]) for (let k = 0; k < 4; k++) { const NX = 40, pos = [], idx = []; for (let i = 0; i <= NX; i++) { const x = -L / 2 + L * i / NX; for (const u of [k * .1, k * .1 + .095]) { const v = sec(x * .98, Math.min(1, u + .05)); v.z *= s; pos.push(v.x, v.y, v.z); } }
    for (let i = 0; i < NX; i++) { const a = i * 2; idx.push(a, a + 2, a + 1, a + 1, a + 2, a + 3); } const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); geo.setIndex(idx); geo.computeVertexNormals();
    g.add(new THREE.Mesh(geo, M_([.5, .36, .2], { r: .8, ds: true }))); }
  // shores: four raked props under the bilge
  for (const x of [-1.9, 0, 1.9]) for (const s of [1, -1]) { const a = sec(x, .5); a.z *= s; g.add(along(cyl(.05, .05, 1, 5, block), a.clone(), new THREE.Vector3(x, 0, s * (a.z * s + .9)))); }
  return g;
}
// a small altar: a stone table 1.1 by 0.6 m, 0.95 m high, under a white cloth hanging 25 cm at the front, two candles in pewter sticks
// lit, and the Church's shuttle stitched in red on the cloth's fall
export function altar() {
  const g = new THREE.Group(), stone = M_([.6, .57, .52], { r: .9 }), cloth = M_(WHITE, { r: .95 }), red = M_([.5, .08, .06], { r: .8 }), pew = M_([.6, .6, .6], { r: .35, m: .8 });
  g.add(at(box(1.0, .85, .5, stone), 0, .425, 0), at(box(1.1, .08, .6, stone), 0, .89, 0));
  g.add(at(box(1.14, .012, .64, cloth), 0, .936, 0), at(box(1.14, .25, .012, cloth), 0, .81, .32));
  const sh = new THREE.Shape(); sh.moveTo(-.09, 0); sh.quadraticCurveTo(0, .035, .09, 0); sh.quadraticCurveTo(0, -.035, -.09, 0); const s = new THREE.Mesh(new THREE.ShapeGeometry(sh, 6), red); s.position.set(0, .82, .327); g.add(s);
  for (const x of [-.38, .38]) { const st = cyl(.04, .015, .1, 12, pew); st.position.set(x, .99, -.05); g.add(st); const c = cyl(.012, .012, .2, 10, M_([.9, .87, .78], { r: .6 })); c.position.set(x, 1.14, -.05); g.add(c);
    const f = new THREE.Mesh(new THREE.SphereGeometry(.009, 8, 6), M_([1, .8, .4], { e: [1, .6, .2], ei: 3 })); f.scale.y = 2; f.position.set(x, 1.26, -.05); g.add(f);
    const l = new THREE.PointLight(0xffb060, .5, 3, 2); l.position.set(x, 1.3, -.05); g.add(l); }
  return g;
}
export function townScene(key) {
  const g = key === 'mairead' ? innSign() : key === 'darragh' ? ringStone() : key === 'iliana' ? hullStocks() : key === 'caelen' ? altar() : null;
  if (!g) return null; let n = 0; g.traverse(o => { if (o.isMesh) { o.castShadow = o.receiveShadow = true; n += tris(o.geometry); } }); g.userData.tris = Math.round(n); return g;
}
