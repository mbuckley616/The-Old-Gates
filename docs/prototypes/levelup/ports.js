// Ports and their trades (the concept artist, 24 Nov 2026; backlog L6, "Ports and their trades", OG-093; the quest writer's *Ports and
// Their Trades*, 4 Nov 2026, unapproved): the draft fills a quay that today holds one person, the harbourmaster. Five stand on one
// Gatelands quay: the harbourmaster (a Markman, since §1.5 has harbourmasters often foreign and the draft rolls one port in two another
// island's people), the chandler (a Gatelander, by the port), the broker (always Aurennais: the trade is the Compact's), the salvager (a
// Gatelander, by the port) and the master of the Navigators' Hall (the port's own people). The wreckers are talk only and never built.
// The draft's sixth thing, the free captains' mark, is drawn the same at every level: the nailed penny, a black coin with an iron nail
// through it on a red cloth, at the masthead of a black sail off the head (ships.js's blackSail over the Gatelands' sloop).
//
// The question is how far a port's trades show on the quay, three levels:
//   a  as townsfolk: each in their people's working dress, found by name and asking (the draft as written; nothing new to build);
//   b  the trade in hand (recommended): the harbourmaster's ledger and a brass spyglass, the chandler's coil of rope and a tarred apron, the
//      broker's penner, seal and purses and the ledger under the arm, the salvager's oilskin and a grapnel on its line, the hall master's
//      chart rolls and the astrolabe at the belt;
//   c  the quay dressed: b, and each trade's place stood with them: the harbourmaster's desk and bell, the chandlery's stall (pitch
//      barrels, coils, a plank stack and its sign), the broker's table under an awning in the Compact's blue and white, the salvager's
//      boat at the steps and a wreck chest hauled up, the Navigators' Hall's door with the compass rose over it.
// PORTS[key] is the sheet; portGenome(key, level, P) the genome (P carries people.js's rollGenome, heightFor, GARMENTS, DRESS_FLAGS);
// portProps(M, G) adds what people.js does not have (the spyglass, the coil, the grapnel) and portScene(key) builds a set piece in its own
// frame; pennyFlag(S) hangs the mark on a ships.js hull. Colours are linear [r,g,b] as in CAST.
import * as THREE from 'three';
import { banner, BANNERS } from './ships.js';

const LEATHER = [.24, .16, .1], GOLD = [.74, .56, .2], BRASS = [.7, .52, .24], IRON = [.42, .43, .45], WHITE = [.86, .85, .8], BLUE = [.1, .2, .46],
  OIL = [.3, .27, .12], TAR = [.07, .06, .05], UNDYED = [.62, .58, .5], FUR = [.46, .36, .26], IRONBLUE = [.08, .16, .38], RED = [.55, .08, .06], MOSS = [.2, .26, .14];

export const PORTS = {
  // the harbourmaster, a Markman at a Gatelands port: keeps the book of every hull in and out
  harbour: { label: 'The harbourmaster (a Markman)', people: 'markman', g: 1, age: .62, muscle: .7, weight: .55, metres: 1.86,
    hairCol: [.72, .66, .52], hair: { style: 'tail', len: .45 }, beard: .8,
    a: { tunic: [.4, .37, .32], trousers: [.24, .22, .19], boots: [.2, .14, .1], belt: LEATHER, cloak: [.26, .25, .24], cape: true, cloakLen: .7, cloakFur: [.56, .5, .42], brooch: IRON },
    b: { tunic: [.4, .37, .32], trousers: [.24, .22, .19], boots: [.2, .14, .1], belt: LEATHER, cloak: [.26, .25, .24], cape: true, cloakLen: .7, cloakFur: [.56, .5, .42], brooch: IRON,
      cuffs: IRONBLUE, book: [.26, .16, .1], props: { spyglass: true } } },
  // the chandler, a Gatelander: rope, pitch and plank, at the misc shop nearest the quay
  chandler: { label: 'The chandler (a Gatelander)', people: 'gatelander', g: 1, age: .5, muscle: .65, weight: .78, metres: 1.74,
    hairCol: [.32, .2, .1], hair: { style: 'short', len: .35 }, beard: .45,
    a: { tunic: [.56, .5, .38], trousers: [.3, .26, .2], boots: [.22, .15, .1], belt: LEATHER, apron: LINEN() },
    b: { tunic: [.56, .5, .38], trousers: [.3, .26, .2], boots: [.22, .15, .1], belt: LEATHER, apron: [.16, .13, .1], apronLeather: true, sleevesRolled: true,
      props: { coil: true } } },
  // the broker, Aurennais always: a hold insured for a tenth, half paid if it is lost
  broker: { label: 'The broker (Aurennais)', people: 'aurennais', g: 0, age: .48, muscle: .4, weight: .45, metres: 1.72,
    hairCol: [.06, .045, .04], hair: { style: 'bun', len: .6 }, skin: [.22, .13, .08],
    a: { tunic: [.74, .66, .52], skirtColor: [.52, .4, .26], skirt: 'long', sandals: [.4, .28, .18], belt: [.4, .28, .18], wrap: [.62, .56, .44] },
    b: { tunic: WHITE, skirtColor: BLUE, skirt: 'long', sandals: [.36, .24, .14], belt: [.3, .2, .12], sash: BLUE, sashBorder: WHITE, sashPrint: false, sashKnot: false,
      wrap: BLUE, wrapBorder: WHITE, earrings: GOLD, penner: [.3, .19, .11], seal: GOLD, purses: [.36, .24, .12], book: [.12, .18, .4], bookGilt: GOLD } },
  // the salvager, a Gatelander: knows every hull in the bay and buys what comes up
  salvager: { label: 'The salvager (a Gatelander)', people: 'gatelander', g: 0, age: .38, muscle: .75, weight: .4, metres: 1.73,
    hairCol: [.5, .16, .05], hair: { style: 'plait', len: .7 },
    a: { skirt: 'short', tunic: [.44, .4, .32], trousers: [.28, .26, .2], boots: [.2, .15, .1], belt: LEATHER, legWraps: [.4, .36, .28] },
    b: { skirt: 'short', tunic: [.44, .4, .32], trousers: [.28, .26, .2], boots: [.14, .11, .08], belt: LEATHER, coat: OIL, coatLen: .7, coatOpen: true,
      wrap: [.24, .3, .32], scarf: true, sleevesRolled: false, props: { grapnel: true } } },
  // the master of the Navigators' Hall, a Gatelander: keeps the explorers' book of first landings
  hall: { label: 'The Navigators’ Hall’s master (a Gatelander)', people: 'gatelander', g: 1, age: .8, muscle: .4, weight: .4, metres: 1.78,
    hairCol: [.82, .81, .78], hair: { style: 'short', len: .5 }, beard: .5,
    a: { tunic: [.34, .3, .26], trousers: [.24, .22, .2], boots: [.2, .14, .1], belt: LEATHER, cloak: [.2, .26, .22], cape: true, cloakLen: .85, brooch: [.6, .6, .62] },
    b: { tunic: [.34, .3, .26], trousers: [.24, .22, .2], boots: [.2, .14, .1], belt: LEATHER, cloak: [.2, .26, .22], cape: true, cloakLen: .85, brooch: [.6, .6, .62],
      satchel: [.32, .22, .13], maps: [.82, .74, .56], astrolabe: BRASS, hat: [.18, .18, .2], hatKind: 'felt', props: { chart: true } } } };
function LINEN() { return [.72, .68, .58]; }
export const ORDER = ['harbour', 'chandler', 'broker', 'salvager', 'hall'];

export function portGenome(key, level, P) {
  const S = PORTS[key], G = P.rollGenome('port:' + key, { people: S.people, g: S.g });
  for (const k of ['age', 'muscle', 'weight', 'hairCol', 'beard', 'skin']) if (S[k] != null) G[k] = Array.isArray(S[k]) ? S[k].slice() : S[k];
  const D = JSON.parse(JSON.stringify(level === 'a' ? S.a : S.b)), props = D.props || {}; delete D.props;
  G.hair = { ...S.hair }; G.pose = { ...(G.pose || {}), stoop: key === 'hall' ? .12 : 0 }; G.scar = null; G.marks = null;
  const skirt = D.skirt || (D.robe ? 'long' : (S.g ? 'short' : 'long')); delete D.skirt;
  G.dress = { ...Object.fromEntries(P.GARMENTS.map(k => [k, null])), ...P.DRESS_FLAGS, skirt, ...D };
  G.height = P.heightFor(G, S.metres); G.port = key; G.props = props; return G;
}

// ── what the people kit has not ──
const lin = c => new THREE.Color().setRGB(...c, THREE.SRGBColorSpace);
const M_ = (c, o = {}) => new THREE.MeshStandardMaterial({ color: lin(c), roughness: o.r ?? .7, metalness: o.m ?? 0, side: o.ds ? THREE.DoubleSide : THREE.FrontSide,
  emissive: o.e ? lin(o.e) : 0x000000, emissiveIntensity: o.ei ?? 1, map: o.map || null, bumpMap: o.bump || null, bumpScale: o.bs ?? 1, transparent: !!o.tr, opacity: o.op ?? 1 });
const tris = g => (g.index ? g.index.count : g.attributes.position.count) / 3;
const cyl = (r0, r1, L, n, m) => new THREE.Mesh(new THREE.CylinderGeometry(r1, r0, L, n), m);
const box = (w, h, d, m) => new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m);
const at = (o, x, y, z) => { o.position.set(x, y, z); return o; };
const V = (x, y, z) => new THREE.Vector3(x, y, z);
const along = (o, a, b) => { const d = b.clone().sub(a); o.position.copy(a).addScaledVector(d, .5); o.quaternion.setFromUnitVectors(V(0, 1, 0), d.normalize()); return o; };
const tube = (pts, r, m, seg = 24, rad = 5) => new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), seg, r, rad, false), m);
const bonePos = (M, n) => { M.root.updateMatrixWorld(true); return M.root.worldToLocal(M.byName[n].getWorldPosition(new THREE.Vector3())); };
function meshPts(M, mesh, out, step = 1) {
  const inv = new THREE.Matrix4().copy(M.root.matrixWorld).invert(), pos = mesh.geometry.attributes.position, v = new THREE.Vector3();
  for (let i = 0; i < pos.count; i += step) { if (mesh.isSkinnedMesh) mesh.getVertexPosition(i, v); else v.fromBufferAttribute(pos, i); v.applyMatrix4(mesh.matrixWorld).applyMatrix4(inv); out.push(v.clone()); }
  return out;
}
function heldAt(M, name) { const o = M.root.getObjectByName(name); if (!o) return null; M.root.updateMatrixWorld(true); const pts = []; o.traverse(m => { if (m.isMesh) meshPts(M, m, pts, 4); });
  if (!pts.length) return null; const c = new THREE.Vector3(); for (const p of pts) c.add(p); return c.divideScalar(pts.length); }
// the hand the kit leaves free (the wearer's right is -x): the other one from what it already holds
function freeWrist(M, name) { const wL = bonePos(M, 'wrist.L'), wR = bonePos(M, 'wrist.R'), h = name && heldAt(M, name); if (!h) return { w: wR, s: -1 };
  return h.distanceTo(wL) < h.distanceTo(wR) ? { w: wR, s: -1 } : { w: wL, s: 1 }; }
function canvasTex(w, h, draw) { const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t; }

// a brass spyglass, drawn out: three tubes stepping down from 2.4 to 1.6 cm across, 0.62 m long, a leather grip on the widest; along +y
export function spyglass() {
  const g = new THREE.Group(), br = M_(BRASS, { r: .3, m: .85 }), lea = M_([.24, .15, .09], { r: .8 }), glass = M_([.2, .26, .3], { r: .05, m: .3 });
  const T = [[.012, .26], [.0095, .2], [.008, .16]]; let y = 0;
  for (const [r, L] of T) { const t = cyl(r, r, L, 14, br); t.position.y = y + L / 2; g.add(t); const rim = cyl(r + .0015, r + .0015, .008, 14, br); rim.position.y = y + L - .004; g.add(rim); y += L - .01; }
  const grip = cyl(.0128, .0128, .14, 14, lea); grip.position.y = .1; g.add(grip);
  const lens = cyl(.011, .011, .004, 14, glass); lens.position.y = .001; g.add(lens); g.userData.L = y; return g;
}
// a coil of hemp rope: ten turns of 1.4 cm line round a coil 0.42 m across, bound twice; its top at 0, the coil's plane x-y
export function ropeCoil(D = .42, turns = 10, col = [.6, .52, .36]) {
  const g = new THREE.Group(), m = M_(col, { r: .95 }), bind = M_([.48, .4, .28], { r: .95 }), R = (i => () => (i = (i * 16807) % 2147483647) / 2147483647)(11);
  for (let i = 0; i < turns; i++) { const r = D / 2 - .004 * (i % 3), t = new THREE.Mesh(new THREE.TorusGeometry(r, .007, 5, 36), m);
    t.position.set((R() - .5) * .012, -D / 2 + (R() - .5) * .012, (i - turns / 2) * .011); t.rotation.z = R() * 6; g.add(t); }
  for (const a of [.4, Math.PI + .4]) { const b = new THREE.Mesh(new THREE.TorusGeometry(.022, .004, 4, 10), bind); b.position.set(Math.cos(a) * D / 2, -D / 2 + Math.sin(a) * D / 2, 0); b.rotation.set(Math.PI / 2, 0, a); b.scale.set(1, 1, 3.2); g.add(b); }
  return g;
}
// a grapnel: an iron shank 0.42 m with a ring at its head and four flukes curving up from its crown, 0.3 m across them, and a fathom of
// tarred line from the ring; its ring at 0, the crown down (-y)
export function grapnel() {
  const g = new THREE.Group(), iron = M_([.22, .2, .19], { r: .55, m: .7 }), rust = M_([.36, .2, .1], { r: .85, m: .2 }), line = M_([.2, .17, .12], { r: .95 });
  const ring = new THREE.Mesh(new THREE.TorusGeometry(.03, .006, 6, 16), iron); ring.position.y = -.03; g.add(ring);
  const sh = cyl(.011, .011, .42, 8, iron); sh.position.y = -.06 - .21; g.add(sh);
  const crown = new THREE.Mesh(new THREE.SphereGeometry(.02, 10, 6), rust); crown.position.y = -.48; g.add(crown);
  for (let k = 0; k < 4; k++) { const a = k * Math.PI / 2 + .3, d = V(Math.cos(a), 0, Math.sin(a)), pts = [];
    for (let i = 0; i <= 8; i++) { const t = i / 8, r = .15 * Math.sin(t * Math.PI * .62) / Math.sin(Math.PI * .62); pts.push(V(d.x * r, -.48 + .14 * t * t, d.z * r)); }
    g.add(tube(pts, .008, iron, 10, 5)); const tip = new THREE.Mesh(new THREE.ConeGeometry(.012, .04, 5), rust); tip.position.copy(pts[8]).add(V(0, .02, 0)); g.add(tip); }
  // the line: from the ring up and over the hand, falling in a loop
  const lp = []; for (let i = 0; i <= 20; i++) { const t = i / 20; lp.push(V(.02 + .1 * Math.sin(t * Math.PI), -.03 + .06 * Math.sin(t * Math.PI * .5) - .55 * t * t, .05 * Math.sin(t * 9))); }
  g.add(tube(lp, .006, line, 40, 4)); return g;
}

// the props on a made body, in the root's frame (the slice's people stand still: placed once on the rest body, as the faiths' were)
export function portProps(M, G) {
  const p = G.props || {}, out = new THREE.Group(); out.name = 'portProps'; const stats = {};
  if (p.spyglass) { const { w, s } = freeWrist(M, 'book'), sg = spyglass(); // closed in the fist, along the forearm's line, its eyepiece down
    sg.position.set(w.x + s * .015, w.y - .2, w.z + .03); sg.rotation.set(.12, 0, s * -.08); out.add(sg); stats.spyglass = +sg.userData.L.toFixed(2); }
  if (p.coil) { const { w, s } = freeWrist(M, null), c = ropeCoil(); // hung from the fist at the side, its plane along the body
    c.position.set(w.x + s * .04, w.y + .03, w.z); c.rotation.y = Math.PI / 2; out.add(c); stats.coil = .42; }
  if (p.grapnel) { const { w, s } = freeWrist(M, null), gr = grapnel(); // the ring in the fist, the flukes by the knee
    gr.position.set(w.x + s * .02, w.y + .01, w.z + .02); gr.rotation.y = s * .5; out.add(gr); stats.grapnel = .48; }
  if (p.chart) { const { w, s } = freeWrist(M, null), c = chartRoll(); // gripped at its middle, held upright along the forearm
    c.position.set(w.x + s * .015, w.y - .06, w.z + .045); c.rotation.set(.15, 0, s * .12); out.add(c); stats.chart = .62; }
  let n = 0; out.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; n += tris(o.geometry); } }); M.root.add(out); return { tris: Math.round(n), ...stats };
}
// a rolled chart: vellum 0.62 m long rolled to 4.5 cm, its edge showing a margin of inked coast, tied at its middle with a cord; centred at 0, along y
export function chartRoll() {
  const g = new THREE.Group(), tex = canvasTex(256, 64, (x, w, h) => { x.fillStyle = '#d8ccaa'; x.fillRect(0, 0, w, h); x.strokeStyle = '#6a5030'; x.lineWidth = 2; x.beginPath();
    for (let i = 0; i <= 40; i++) x.lineTo(i * w / 40, h * .5 + 9 * Math.sin(i * 1.3) + 5 * Math.sin(i * .37)); x.stroke(); x.strokeStyle = 'rgba(90,60,30,.4)'; x.lineWidth = 1; for (let k = 0; k < 6; k++) { x.beginPath(); x.moveTo(k * 48, 0); x.lineTo(k * 48 + 30, h); x.stroke(); } });
  const r = new THREE.Mesh(new THREE.CylinderGeometry(.0225, .0225, .62, 18, 1, true), M_([1, 1, 1], { r: .85, map: tex, ds: true })); g.add(r);
  for (const s of [1, -1]) { const e = new THREE.Mesh(new THREE.RingGeometry(.006, .0225, 18), M_([.78, .7, .52], { r: .9, ds: true })); e.rotation.x = Math.PI / 2; e.position.y = s * .31; g.add(e); }
  const cord = new THREE.Mesh(new THREE.TorusGeometry(.024, .003, 4, 18), M_([.5, .12, .08], { r: .8 })); cord.rotation.x = Math.PI / 2; g.add(cord); return g;
}

// ── the nailed penny: a black coin 0.5 the hoist across, its rim struck in a darker black, an iron nail driven through it on the slant from
//   the upper hoist, the nail's head and its point standing out of the coin; painted black on the free captains' red. A refusal, not a death.
export function pennyTex(W = 384, H = 256) {
  return canvasTex(W, H, (x, w, h) => { x.fillStyle = '#7a1e16'; x.fillRect(0, 0, w, h); x.fillStyle = 'rgba(0,0,0,.08)'; for (let i = 0; i < w; i += 48) x.fillRect(i, 0, 2, h);
    const cx = w * .4, cy = h * .5, r = h * .27; x.fillStyle = '#121112'; x.beginPath(); x.arc(cx, cy, r, 0, Math.PI * 2); x.fill();
    x.strokeStyle = '#7a1e16'; x.lineWidth = 3; x.beginPath(); x.arc(cx, cy, r * .82, 0, Math.PI * 2); x.stroke(); /* the coin's rim, in the cloth's red */
    x.lineWidth = 2; for (let a = 0; a < Math.PI * 2; a += Math.PI / 18) { x.beginPath(); x.moveTo(cx + Math.cos(a) * r * .86, cy + Math.sin(a) * r * .86); x.lineTo(cx + Math.cos(a) * r * .95, cy + Math.sin(a) * r * .95); x.stroke(); }
    // the nail: from the upper fly down through the coin to the lower hoist, its shank outlined in red where it crosses the coin
    const a = V(cx + r * 1.25, cy - r * 1.25, 0), b = V(cx - r * 1.0, cy + r * 1.0, 0);
    x.lineCap = 'butt'; x.strokeStyle = '#7a1e16'; x.lineWidth = 20; x.beginPath(); x.moveTo(a.x, a.y); x.lineTo(b.x, b.y); x.stroke();
    x.strokeStyle = '#121112'; x.lineWidth = 12; x.beginPath(); x.moveTo(a.x, a.y); x.lineTo(b.x, b.y); x.stroke();
    x.fillStyle = '#121112'; x.beginPath(); x.moveTo(b.x - 10, b.y - 2); x.lineTo(b.x - 24, b.y + 24); x.lineTo(b.x + 2, b.y + 10); x.fill(); /* its point */
    x.save(); x.translate(a.x, a.y); x.rotate(-Math.PI / 4); x.fillRect(-26, -9, 52, 18); x.restore(); /* its head */
    x.strokeStyle = '#121112'; x.lineWidth = 10; x.strokeRect(5, 5, w - 10, h - 10); });
}
// hang the penny on a hull: ships.js's banner with the free captains' cloth (a red field, no device) and the coin painted over it
export function pennyFlag(S, o = {}) {
  BANNERS.penny = BANNERS.penny || { name: 'the free captains', field: '#7a1e16', trim: '#121112', device: 'none' };
  banner(S, 'penny', { yaw: o.yaw ?? .5, at: o.at }); const fl = S.banner.group.children[1];
  fl.material = new THREE.MeshStandardMaterial({ map: pennyTex(), roughness: .9, side: THREE.DoubleSide }); return S;
}

// ── the set pieces of c, each in its own frame in metres, its foot at 0, its face +z ──
const OAK = [.34, .23, .13], ASH = [.56, .44, .3], STONE = [.52, .5, .46];
// the harbourmaster's desk: a standing desk 1.18 m at its front edge, its top sloped 12°, the harbour's book open on it, an inkhorn, and a
// brass bell 14 cm on an iron bracket from its back post at 1.9 m; a slate of the day's tides hung under it
export function harbourDesk() {
  const g = new THREE.Group(), oak = M_(OAK, { r: .8 }), iron = M_([.18, .18, .19], { r: .5, m: .7 }), brass = M_(BRASS, { r: .3, m: .85 });
  for (const [x, z] of [[-.32, -.2], [.32, -.2], [-.32, .2], [.32, .2]]) g.add(at(box(.06, 1.12, .06, oak), x, .56, z));
  const top = box(.8, .04, .56, oak); top.position.set(0, 1.14, 0); top.rotation.x = .2; g.add(top);
  g.add(at(box(.72, .03, .4, oak), 0, .3, 0)); // the shelf
  const book = new THREE.Group(), cover = M_([.26, .16, .1], { r: .8 }), page = M_([.86, .82, .7], { r: .9 });
  book.add(at(box(.44, .02, .3, cover), 0, 0, 0)); for (const s of [-1, 1]) { const p = box(.21, .018, .28, page); p.position.set(s * .107, .015, 0); p.rotation.z = -s * .04; book.add(p); }
  const lines = canvasTex(256, 160, (x, w, h) => { x.fillStyle = '#d8d0b8'; x.fillRect(0, 0, w, h); x.strokeStyle = '#3a2a1a'; x.lineWidth = 1.5; for (let i = 0; i < 14; i++) for (const c of [0, 1]) { x.beginPath(); x.moveTo(10 + c * 130, 12 + i * 10); x.lineTo(118 + c * 130 - (i * 37 % 40), 12 + i * 10); x.stroke(); } });
  const ink = new THREE.Mesh(new THREE.PlaneGeometry(.42, .27), M_([1, 1, 1], { r: .9, map: lines })); ink.rotation.x = -Math.PI / 2; ink.position.y = .026; book.add(ink);
  book.position.set(0, 1.175, .02); book.rotation.x = .2; g.add(book);
  const horn = cyl(.018, .024, .08, 10, M_([.3, .24, .16], { r: .5 })); horn.position.set(.33, 1.21, .1); g.add(horn);
  const post = box(.06, 1.92, .06, oak); post.position.set(-.32, .96, -.22); g.add(post);
  const arm = box(.32, .025, .025, iron); arm.position.set(-.18, 1.88, -.22); g.add(arm);
  const bell = new THREE.Mesh(new THREE.LatheGeometry([[0, .14], [.03, .135], [.045, .1], [.055, .03], [.07, 0], [.066, 0], [.05, .03]].map(([x, y]) => new THREE.Vector2(x, y)), 20), M_(BRASS, { r: .3, m: .85, ds: true }));
  bell.position.set(-.06, 1.72, -.22); g.add(bell); g.add(at(cyl(.003, .003, .03, 4, iron), -.06, 1.86, -.22));
  const slate = box(.36, .26, .02, M_([.16, .17, .18], { r: .9 })); slate.position.set(0, .7, .23); g.add(slate);
  return g;
}
// the chandlery's stall: two pitch barrels 0.85 m with tarred heads, three coils on a pallet, a stack of oak planks 2.4 m long, a crate of
// oakum and the sign, a board 0.7 by 0.44 m on an iron arm from a post 2.5 m, painted with a coil of rope and the word
export function chandlery() {
  const g = new THREE.Group(), oak = M_(OAK, { r: .8 }), staves = M_([.36, .26, .16], { r: .8 }), hoop = M_([.2, .2, .21], { r: .5, m: .7 }), tar = M_(TAR, { r: .3 }), raw = M_([.66, .52, .34], { r: .85 }), iron = M_([.16, .16, .17], { r: .5, m: .7 });
  const barrel = () => { const b = new THREE.Group(), pts = []; for (let i = 0; i <= 10; i++) { const t = i / 10; pts.push(new THREE.Vector2(.25 + .045 * Math.sin(t * Math.PI), t * .85)); }
    b.add(new THREE.Mesh(new THREE.LatheGeometry(pts, 18), staves)); for (const y of [.1, .3, .55, .75]) { const h = new THREE.Mesh(new THREE.TorusGeometry(.25 + .045 * Math.sin(y / .85 * Math.PI) + .004, .006, 4, 24), hoop); h.rotation.x = Math.PI / 2; h.position.y = y; b.add(h); }
    const head = cyl(.25, .25, .01, 18, tar); head.position.y = .845; b.add(head);
    const drip = []; for (let i = 0; i <= 8; i++) drip.push(V(.25 + .04 * Math.sin(i / 8 * 1.2), .85 - i * .05, 0)); b.add(tube(drip, .012, tar, 8, 4)); return b; };
  const b1 = barrel(); b1.position.set(-.9, 0, -.2); g.add(b1); const b2 = barrel(); b2.position.set(-.35, 0, -.45); b2.rotation.y = 1.3; g.add(b2);
  g.add(at(box(.9, .12, .7, raw), .55, .06, -.2));
  for (let i = 0; i < 3; i++) { const c = ropeCoil(.46, 9); c.rotation.x = -Math.PI / 2; c.position.set(.55 + (i - 1) * .08, .13 + i * .1, -.2 + .23 + (i % 2) * .02); g.add(c); }
  for (let i = 0; i < 6; i++) { const p = box(2.4, .05, .22, i % 2 ? oak : raw); p.position.set(.1 + (i % 2) * .03, .03 + i * .052, -1.0 - (i % 3) * .005); g.add(p); }
  g.add(at(box(.5, .4, .4, oak), 1.45, .2, -.15)); const oak2 = box(.46, .06, .36, M_([.62, .56, .42], { r: 1 })); oak2.position.set(1.45, .41, -.15); g.add(oak2);
  const post = box(.12, 2.5, .12, oak); post.position.set(-1.35, 1.25, -.1); g.add(post);
  const arm = box(.8, .03, .03, iron); arm.position.set(-.97, 2.42, -.1); g.add(arm);
  const tex = canvasTex(512, 320, (x, w, h) => { x.fillStyle = '#d8ccae'; x.fillRect(0, 0, w, h); x.strokeStyle = '#2e2218'; x.lineWidth = 14; x.strokeRect(9, 9, w - 18, h - 18);
    x.strokeStyle = '#9a7a4a'; x.lineWidth = 9; for (let i = 0; i < 5; i++) { x.beginPath(); x.arc(256, 128, 30 + i * 12, 0, Math.PI * 2); x.stroke(); }
    x.strokeStyle = '#5a4428'; x.lineWidth = 3; for (let i = 0; i < 5; i++) { x.beginPath(); x.arc(256, 128, 34 + i * 12, 0, Math.PI * 2); x.stroke(); }
    x.fillStyle = '#2e2218'; x.font = 'bold 50px Georgia, serif'; x.textAlign = 'center'; x.fillText('Chandlery', 256, 278); });
  const board = new THREE.Group(), face = M_([1, 1, 1], { r: .75, map: tex }); board.add(box(.7, .44, .035, M_([.3, .2, .12], { r: .8 })));
  for (const s of [1, -1]) { const f = new THREE.Mesh(new THREE.PlaneGeometry(.68, .42), face); f.position.z = s * .019; if (s < 0) f.rotation.y = Math.PI; board.add(f); }
  board.position.set(-.85, 2.12, -.1); g.add(board); for (const dx of [-.3, .3]) g.add(at(cyl(.004, .004, .08, 4, iron), -.85 + dx, 2.38, -.1));
  return g;
}
// the broker's table: oak, 1.2 by 0.7 m, 0.76 high, under an awning 2.6 by 2.2 m on four ash poles 2.35 m, the Compact's blue and white
// in stripes 0.33 m with a scalloped valance; the register open, a balance with its weights, an inkpot and two stools
export function brokerTable() {
  const g = new THREE.Group(), oak = M_(OAK, { r: .75 }), ash = M_(ASH, { r: .7 }), brass = M_(BRASS, { r: .3, m: .85 }), iron = M_([.18, .18, .19], { r: .5, m: .7 });
  for (const [x, z] of [[-.54, -.29], [.54, -.29], [-.54, .29], [.54, .29]]) g.add(at(box(.06, .72, .06, oak), x, .36, z));
  g.add(at(box(1.2, .04, .7, oak), 0, .74, 0));
  const stool = () => { const s = new THREE.Group(); s.add(at(cyl(.17, .17, .04, 16, oak), 0, .46, 0)); for (let k = 0; k < 3; k++) { const a = k * 2.094; s.add(along(cyl(.018, .018, .48, 6, oak), V(Math.cos(a) * .12, .45, Math.sin(a) * .12), V(Math.cos(a) * .19, 0, Math.sin(a) * .19))); } return s; };
  const s1 = stool(); s1.position.set(-.1, 0, -.62); g.add(s1); const s2 = stool(); s2.position.set(.15, 0, .62); g.add(s2);
  const reg = new THREE.Group(), cover = M_([.12, .18, .4], { r: .7 }), page = M_([.88, .84, .74], { r: .9 });
  reg.add(at(box(.46, .02, .32, cover), 0, 0, 0)); for (const s of [-1, 1]) reg.add(at(box(.22, .02, .3, page), s * .112, .016, 0)); reg.position.set(-.2, .77, .05); reg.rotation.y = .15; g.add(reg);
  // the balance: a post 0.36 m, a beam 0.34 m, two pans on three cords each, one heaped with coin
  const bx = .36, bz = -.1; g.add(at(cyl(.05, .06, .02, 14, brass), bx, .77, bz), at(cyl(.006, .006, .36, 6, brass), bx, .94, bz), at(box(.34, .008, .01, brass), bx, 1.12, bz));
  for (const s of [-1, 1]) { const pan = new THREE.Mesh(new THREE.SphereGeometry(.06, 14, 5, 0, Math.PI * 2, Math.PI * .62, Math.PI * .38), M_(BRASS, { r: .3, m: .85, ds: true })); pan.position.set(bx + s * .16, .86 + .06, bz); g.add(pan);
    for (let k = 0; k < 3; k++) { const a = k * 2.094; g.add(along(cyl(.0015, .0015, .2, 3, iron), V(bx + s * .16, 1.115, bz), V(bx + s * .16 + Math.cos(a) * .05, .875, bz + Math.sin(a) * .05))); } }
  for (let i = 0; i < 7; i++) g.add(at(cyl(.011, .011, .003, 10, M_(GOLD, { r: .35, m: .85 })), bx - .16 + (i % 3 - 1) * .012, .87 + i * .003, bz + (i % 2) * .01));
  g.add(at(cyl(.022, .026, .05, 10, M_([.08, .08, .1], { r: .3 })), .1, .785, .22));
  // the awning
  const H = 2.35, AW = 2.6, AD = 2.2; for (const [x, z] of [[-AW / 2, -AD / 2], [AW / 2, -AD / 2], [-AW / 2, AD / 2], [AW / 2, AD / 2]]) g.add(at(cyl(.03, .03, H + (z < 0 ? .2 : 0), 8, ash), x, (H + (z < 0 ? .2 : 0)) / 2, z));
  const stripes = canvasTex(512, 64, (x, w, h) => { for (let i = 0; i < 8; i++) { x.fillStyle = i % 2 ? '#e8e6de' : '#24407e'; x.fillRect(i * w / 8, 0, w / 8, h); } });
  stripes.wrapS = stripes.wrapT = THREE.RepeatWrapping;
  const cg = new THREE.PlaneGeometry(AW + .1, AD + .1, 16, 8), P = cg.attributes.position; for (let i = 0; i < P.count; i++) { const x = P.getX(i), y = P.getY(i), u = (y + AD / 2) / AD;
    P.setXYZ(i, x, H + .2 * u - .06 * Math.sin(u * Math.PI), -y); } cg.computeVertexNormals();
  const cm = M_([1, 1, 1], { r: .9, map: stripes, ds: true }); g.add(new THREE.Mesh(cg, cm));
  const val = new THREE.PlaneGeometry(AW + .1, .22, 32, 2), VP = val.attributes.position; for (let i = 0; i < VP.count; i++) { const x = VP.getX(i), y = VP.getY(i); const sc = .5 + .5 * Math.cos((x + AW / 2) / (AW / 8) * Math.PI * 2);
    VP.setXYZ(i, x, H - .11 + y + (y < 0 ? .08 * (1 - sc) : 0), AD / 2 + .05); } g.add(new THREE.Mesh(val, cm));
  return g;
}
// the salvager's take, hauled up: a wreck chest 0.8 by 0.5 by 0.5, iron-banded, the oak gone grey and green with weed at its foot, its lid
// sprung; a ship's lantern with no glass; a coil of wet line; a broken carved board from a stern (its paint gone to a ghost)
export function salvage() {
  const g = new THREE.Group(), grey = M_([.36, .35, .3], { r: .9 }), weed = M_([.14, .22, .1], { r: .9 }), band = M_([.32, .18, .1], { r: .8, m: .3 }), wet = M_([.22, .18, .12], { r: .35 });
  g.add(at(box(.8, .42, .5, grey), 0, .21, 0)); for (const x of [-.3, 0, .3]) g.add(at(box(.04, .44, .52, band), x, .21, 0));
  for (let i = 0; i < 14; i++) { const w = box(.06 + (i % 3) * .03, .06 + (i % 4) * .025, .01, weed); w.position.set(-.38 + i * .056, .04 + (i % 3) * .02, .256); g.add(w); }
  const lid = new THREE.Group(); lid.add(at(box(.8, .08, .5, grey), 0, .04, -.25)); for (const x of [-.3, 0, .3]) lid.add(at(box(.04, .09, .52, band), x, .045, -.25));
  lid.position.set(0, .42, .25); lid.rotation.x = -.5; g.add(lid);
  const L = new THREE.Group(), br = M_([.28, .22, .14], { r: .6, m: .5 }); L.add(at(cyl(.07, .08, .02, 8, br), 0, .01, 0), at(cyl(.06, .07, .03, 8, br), 0, .29, 0), at(new THREE.Mesh(new THREE.ConeGeometry(.06, .08, 8), br), 0, .34, 0));
  for (let k = 0; k < 4; k++) { const a = k * Math.PI / 2 + .4; L.add(at(cyl(.005, .005, .27, 4, br), Math.cos(a) * .065, .15, Math.sin(a) * .065)); }
  L.position.set(.62, 0, .12); L.rotation.z = .2; g.add(L);
  const c = ropeCoil(.5, 8, [.24, .2, .14]); c.rotation.x = -Math.PI / 2; c.position.set(-.75, .02, .4); c.traverse(o => { if (o.isMesh) o.material = wet; }); g.add(c);
  const carved = canvasTex(256, 96, (x, w, h) => { x.fillStyle = '#5a5248'; x.fillRect(0, 0, w, h); x.strokeStyle = '#6e5a3a'; x.lineWidth = 7; for (let i = 0; i < 4; i++) { x.beginPath(); x.arc(32 + i * 64, 48, 22, 0, Math.PI * 2); x.stroke(); }
    x.fillStyle = 'rgba(160,140,60,.35)'; x.fillRect(0, 10, w, 6); x.fillRect(0, 80, w, 6); });
  const bd = box(1.1, .3, .05, M_([1, 1, 1], { r: .9, map: carved, bump: carved, bs: 2 })); bd.position.set(-.1, .08, .7); bd.rotation.set(-Math.PI / 2 + .12, 0, .3); g.add(bd);
  return g;
}
// the salvager's boat: a clinker skiff 4.2 m, 1.4 in the beam, tarred, a thwart and the oars shipped, a crate and a weighted line in her;
// y = 0 at the water, +x her bow
export function skiff() {
  const g = new THREE.Group(), tar = M_([.16, .13, .1], { r: .6, ds: true }), oak = M_([.48, .34, .2], { r: .8 }), ash = M_(ASH, { r: .7 });
  const L = 4.2, B = .7, D = .62, NX = 30, NU = 10, pos = [], idx = [];
  for (let i = 0; i <= NX; i++) { const t = i / NX, x = -L / 2 + L * t, hb = B * Math.pow(Math.max(0, 1 - Math.pow(2 * t - 1, 2)), .55) * (t > .5 ? 1 : .92 + .08 * t * 2);
    for (let j = 0; j <= NU; j++) { const u = j / NU, a = u * Math.PI; const sheer = .08 * Math.pow(2 * t - 1, 2); pos.push(x, -.25 + (D + sheer) * (1 - Math.sin(a)), -Math.cos(a) * hb); } }
  for (let i = 0; i < NX; i++) for (let j = 0; j < NU; j++) { const a = i * (NU + 1) + j, b = a + NU + 1; idx.push(a, b, a + 1, a + 1, b, b + 1); }
  const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); geo.setIndex(idx); geo.computeVertexNormals(); g.add(new THREE.Mesh(geo, tar));
  // the strakes' laps as dark lines, the gunwale in oak
  const rim = []; for (let i = 0; i <= NX; i++) { const k = i * (NU + 1); rim.push(V(pos[k * 3], pos[k * 3 + 1], pos[k * 3 + 2])); } g.add(tube(rim, .025, oak, 40, 5));
  const rim2 = []; for (let i = 0; i <= NX; i++) { const k = i * (NU + 1) + NU; rim2.push(V(pos[k * 3], pos[k * 3 + 1], pos[k * 3 + 2])); } g.add(tube(rim2, .025, oak, 40, 5));
  g.add(at(box(.22, .04, 1.28, oak), .2, .18, 0), at(box(.22, .04, 1.0, oak), -1.2, .2, 0));
  for (const s of [1, -1]) { const o = box(2.6, .035, .05, ash); o.position.set(-.2, .3, s * .36); o.rotation.y = s * .05; g.add(o); }
  g.add(at(box(.5, .3, .4, M_([.4, .38, .32], { r: .9 })), 1.0, .05, 0));
  return g;
}
// coursed ashlar for the hall's front, drawn: blocks 0.6 by 0.3 m (the texture is 2.4 by 1.2 m), the joints pale
let _ash = null; function ASHLAR() { if (_ash) return _ash; _ash = canvasTex(512, 256, (x, w, h) => { x.fillStyle = '#b8b0a2'; x.fillRect(0, 0, w, h);
  for (let r = 0; r < 4; r++) for (let c = -1; c < 5; c++) { const bx = c * 128 + (r % 2) * 64, v = 150 + ((r * 7 + c * 13) % 5) * 12; x.fillStyle = `rgb(${v},${v - 6},${v - 16})`; x.fillRect(bx + 3, r * 64 + 3, 122, 58); } });
  _ash.wrapS = _ash.wrapT = THREE.RepeatWrapping; _ash.repeat.set(1.25, 2.8); return _ash; }
// the Navigators' Hall's door: a stretch of the hall's front 3.0 m wide and 3.4 high in ashlar, a door 1.1 by 2.15 m of oak with iron
// straps under a lintel, a step, and the hall's board over it, 1.3 by 0.52 m: a compass rose and the name
export function hallDoor() {
  const g = new THREE.Group(), st = M_([.78, .74, .68], { r: .92, map: ASHLAR() }), dk = M_([.42, .4, .37], { r: .92 }), oak = M_([.3, .2, .11], { r: .8 }), iron = M_([.14, .14, .15], { r: .5, m: .6 });
  const W = 3.0, H = 3.4, DW = 1.1, DH = 2.15; g.add(at(box((W - DW) / 2 - .12, H, .5, st), -(W / 2 + DW / 2 + .12) / 2, H / 2, 0), at(box((W - DW) / 2 - .12, H, .5, st), (W / 2 + DW / 2 + .12) / 2, H / 2, 0));
  g.add(at(box(DW + .24, H - DH - .1, .5, st), 0, DH + .1 + (H - DH - .1) / 2, 0));
  g.add(at(box(.14, DH + .1, .56, dk), -DW / 2 - .07, (DH + .1) / 2, .01), at(box(.14, DH + .1, .56, dk), DW / 2 + .07, (DH + .1) / 2, .01), at(box(DW + .4, .22, .58, dk), 0, DH + .2, .01));
  g.add(at(box(DW + .5, .14, .5, dk), 0, .07, .45));
  const door = box(DW, DH, .07, oak); door.position.set(0, DH / 2, -.05); g.add(door); for (const y of [.4, 1.1, 1.8]) g.add(at(box(DW * .9, .05, .01, iron), 0, y, -.01));
  const ring = new THREE.Mesh(new THREE.TorusGeometry(.06, .009, 6, 16), iron); ring.position.set(.32, 1.05, 0); g.add(ring);
  const tex = canvasTex(640, 256, (x, w, h) => { x.fillStyle = '#1e3a32'; x.fillRect(0, 0, w, h); x.strokeStyle = '#c8a860'; x.lineWidth = 10; x.strokeRect(8, 8, w - 16, h - 16);
    const cx = 110, cy = 128, R = 80; x.fillStyle = '#c8a860'; x.strokeStyle = '#c8a860'; x.lineWidth = 3; x.beginPath(); x.arc(cx, cy, R * .62, 0, Math.PI * 2); x.stroke();
    for (let k = 0; k < 8; k++) { const a = k * Math.PI / 4 - Math.PI / 2, l = k % 2 ? R * .62 : R, s = k % 2 ? 9 : 14; x.beginPath(); x.moveTo(cx + Math.cos(a) * l, cy + Math.sin(a) * l);
      x.lineTo(cx + Math.cos(a + Math.PI / 2) * s, cy + Math.sin(a + Math.PI / 2) * s); x.lineTo(cx + Math.cos(a - Math.PI / 2) * s, cy + Math.sin(a - Math.PI / 2) * s); x.closePath(); x.fill(); }
    x.font = 'bold 54px Georgia, serif'; x.textAlign = 'left'; x.fillText('The Navigators’', 215, 118); x.fillText('Hall', 215, 182); });
  const bd = box(1.3, .52, .05, M_([1, 1, 1], { r: .7, map: tex })); bd.position.set(0, DH + .62, .28); g.add(bd);
  // a bench beside the door, where the navigators wait to be taken on
  g.add(at(box(1.3, .06, .36, oak), -1.25, .44, .5), at(box(.08, .42, .3, oak), -1.8, .21, .5), at(box(.08, .42, .3, oak), -.7, .21, .5));
  g.add(at(box(W + .2, .22, .62, dk), 0, H + .11, .04));
  return g;
}
export function portScene(key) {
  const g = key === 'harbour' ? harbourDesk() : key === 'chandler' ? chandlery() : key === 'broker' ? brokerTable() : key === 'salvager' ? salvage() : key === 'hall' ? hallDoor() : null;
  if (!g) return null; let n = 0; g.traverse(o => { if (o.isMesh) { o.castShadow = o.receiveShadow = true; n += tris(o.geometry); } }); g.userData.tris = Math.round(n); return g;
}
