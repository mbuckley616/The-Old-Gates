// Children at play, by island (the concept artist, 11 Nov 2026; backlog L9, "Children's lives and coming of age", OG-116, with L1's
// children: people.js's child bodies, Session 1081). The toys at their true size in metres and a pose for each game, on the people kit's
// own skeleton (bones turned, nothing rebuilt, so every skinned garment follows), the arms by the musicians' two-bone reach.
//   the Gatelands: hoop and hazel stick, a stitched leather ball (one throws, one catches), a rag doll
//   the Mark: wooden swords and small painted shields (two spar), a carved boat with a birch-bark sail on a pool
//   Aurenne: a painted kite on its line, knucklebones on the paving (two kneel at them), a terracotta horse on wheels pulled on a string
// TOYS[key]() builds a toy in its own frame and returns { g, tris }. play(P, game, o) poses a child made by makePerson (unturned, at the
// origin) and hangs its toys on the child's root, so the two move together when the root is placed; it returns the tris and how far each
// hand fell short of its mark (0 when it reached). GAMES lists each island's games, one entry a child.
import * as THREE from 'three';

const V = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
const C = (r, g, b) => new THREE.Color().setRGB(r, g, b, THREE.SRGBColorSpace);
const X = V(1, 0, 0), Y = V(0, 1, 0);

// ——— materials: one grain for the wood, plain for the rest, canvas for the painted faces
let GRAIN = null;
function grainTex() { if (GRAIN) return GRAIN; const c = document.createElement('canvas'); c.width = c.height = 256; const x = c.getContext('2d');
  x.fillStyle = '#d8d8d8'; x.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 120; i++) { const px = Math.random() * 256; x.strokeStyle = `rgba(40,30,20,${.05 + Math.random() * .12})`; x.lineWidth = .5 + Math.random() * 1.6; x.beginPath();
    for (let y = 0; y <= 256; y += 16) x.lineTo(px + Math.sin(y * .02 + i) * 3, y); x.stroke(); }
  GRAIN = new THREE.CanvasTexture(c); GRAIN.wrapS = GRAIN.wrapT = THREE.RepeatWrapping; GRAIN.colorSpace = THREE.SRGBColorSpace; return GRAIN; }
const MATS = {};
const wood = col => MATS['w' + col] || (MATS['w' + col] = new THREE.MeshStandardMaterial({ map: grainTex(), color: C(...col), roughness: .6 }));
const plain = (col, o = {}) => { const k = 'p' + col + JSON.stringify(o); return MATS[k] || (MATS[k] = new THREE.MeshStandardMaterial({ color: C(...col), roughness: o.rough ?? .7, metalness: o.metal ?? 0, side: o.side ?? THREE.FrontSide })); };
function painted(w, h, draw, o = {}) { const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
  return new THREE.MeshStandardMaterial({ map: t, roughness: o.rough ?? .75, side: o.side ?? THREE.FrontSide }); }
function count(g) { let t = 0; g.traverse(o => { if (o.isMesh) { const gg = o.geometry; t += (gg.index ? gg.index.count : gg.attributes.position.count) / 3; } }); return t; }

// a group with a few shapes: a rod between two points, a box, a mesh placed
class Parts { constructor() { this.g = new THREE.Group(); }
  add(geo, m, p = V(), r = null) { const o = new THREE.Mesh(geo, m); o.position.copy(p); if (r) o.rotation.set(...r); o.castShadow = o.receiveShadow = true; this.g.add(o); return o; }
  rod(a, b, r, m, seg = 6, r2 = r) { const d = b.clone().sub(a), L = d.length(), geo = new THREE.CylinderGeometry(r2, r, L, seg, 1); geo.translate(0, L / 2, 0);
    const o = this.add(geo, m, a); o.quaternion.setFromUnitVectors(Y, d.normalize()); return o; }
  box(w, h, d, m, p = V(), r = null) { return this.add(new THREE.BoxGeometry(w, h, d), m, p, r); } }
// a line through points, thin (a string, a kite's line)
function line(pts, r, m, seg = 24) { const cv = new THREE.CatmullRomCurve3(pts); const o = new THREE.Mesh(new THREE.TubeGeometry(cv, seg, r, 3, false), m); o.castShadow = true; return o; }
const sag = (a, b, s, n = 12) => { const out = []; for (let i = 0; i <= n; i++) { const t = i / n; out.push(a.clone().lerp(b, t).add(V(0, -s * 4 * t * (1 - t), 0))); } return out; };

// ——— the toys, each in its own frame
export const TOYS = {
  // an ash hoop 0.6 m across (a cooper's offcut, the hoop of a small cask), in the XY plane, its centre at the origin
  hoop: () => { const p = new Parts(); p.add(new THREE.TorusGeometry(.3, .011, 6, 40), wood([.72, .58, .4])); return p; },
  // the hazel stick, 0.62 m, its grip end at the origin, along +y, the bark left on above the hand
  stick: (L = .62) => { const p = new Parts(); p.rod(V(), V(0, .14, 0), .009, wood([.6, .46, .3]), 6); p.rod(V(0, .14, 0), V(0, L, 0), .009, wood([.42, .32, .22]), 6, .006); return p; },
  // a leather ball stuffed with wool, 0.16 m across, eight panels shown by their seams
  ball: () => { const p = new Parts(); const m = painted(256, 128, (x, w, h) => { x.fillStyle = '#8a5a34'; x.fillRect(0, 0, w, h); for (let i = 0; i < 400; i++) { x.fillStyle = `rgba(40,20,10,${Math.random() * .12})`; x.fillRect(Math.random() * w, Math.random() * h, 3, 3); }
      x.strokeStyle = '#3a2414'; x.lineWidth = 3; x.setLineDash([5, 4]); for (let i = 0; i < 4; i++) { x.beginPath(); x.moveTo(i * w / 4, 0); x.lineTo(i * w / 4, h); x.stroke(); } x.beginPath(); x.moveTo(0, h / 2); x.lineTo(w, h / 2); x.stroke(); }, { rough: .8 });
    p.add(new THREE.SphereGeometry(.08, 14, 10), m); return p; },
  // a rag doll 0.3 m: a linen head with a stitched face, wool hair, a dyed dress, arms and legs of rolled cloth; its middle at the origin
  doll: () => { const p = new Parts(), lin = plain([.88, .82, .7], { rough: .9 }), dress = plain([.62, .2, .16], { rough: .95 }), hair = plain([.55, .34, .16], { rough: 1 });
    const face = painted(64, 64, (x, w, h) => { x.fillStyle = '#e2d6bc'; x.fillRect(0, 0, w, h); x.fillStyle = '#2a2018'; x.fillRect(20, 26, 5, 5); x.fillRect(39, 26, 5, 5); x.strokeStyle = '#8a3a2a'; x.lineWidth = 2; x.beginPath(); x.arc(32, 36, 7, .3, Math.PI - .3); x.stroke(); }, { rough: .9 });
    p.add(new THREE.SphereGeometry(.045, 12, 9), face, V(0, .11, 0), [0, -Math.PI / 2, 0]); p.add(new THREE.SphereGeometry(.048, 10, 6, 0, Math.PI * 2, 0, 1.4), hair, V(0, .113, -.004));
    p.add(new THREE.ConeGeometry(.062, .15, 10, 1, true), dress, V(0, -.015, 0)); p.add(new THREE.CylinderGeometry(.03, .036, .07, 8), dress, V(0, .045, 0));
    for (const s of [-1, 1]) { p.rod(V(s * .03, .065, 0), V(s * .075, .0, .02), .012, lin, 5); p.rod(V(s * .022, -.08, 0), V(s * .028, -.15, .01), .013, lin, 5); }
    return p; },
  // a child's sword of ash, 0.56 m: a flat blade with its edges taken off, a crossbar and a bound grip; the grip's middle at the origin, the blade up +y
  sword: () => { const p = new Parts(), w = wood([.7, .56, .38]), cord = plain([.36, .22, .14], { rough: .9 });
    const s = new THREE.Shape(); s.moveTo(-.022, 0); s.lineTo(.022, 0); s.lineTo(.02, .36); s.lineTo(0, .41); s.lineTo(-.02, .36); s.closePath();
    const blade = new THREE.ExtrudeGeometry(s, { depth: .01, bevelEnabled: true, bevelThickness: .003, bevelSize: .004, bevelSegments: 1 }); blade.translate(0, .07, -.005);
    p.add(blade, w); p.box(.13, .022, .03, w, V(0, .06, 0)); p.add(new THREE.CylinderGeometry(.014, .014, .1, 8), cord, V(0, .0, 0)); p.add(new THREE.SphereGeometry(.02, 8, 6), w, V(0, -.06, 0)); return p; },
  // a round shield 0.36 m of limewood boards, painted as the Mark paints its own (quartered red and cream, a black rim), an iron-black boss;
  // the grip behind the boss at the origin, the face to +z
  shield: (cols = ['#a8382a', '#e6d8b4']) => { const p = new Parts();
    const face = painted(256, 256, (x, w, h) => { for (let i = 0; i < 4; i++) { x.fillStyle = cols[i % 2]; x.beginPath(); x.moveTo(128, 128); x.arc(128, 128, 128, i * Math.PI / 2, (i + 1) * Math.PI / 2); x.fill(); }
      x.strokeStyle = 'rgba(40,24,14,.35)'; x.lineWidth = 2; for (let i = 1; i < 6; i++) { x.beginPath(); x.moveTo(i * 256 / 6, 0); x.lineTo(i * 256 / 6, 256); x.stroke(); }
      x.strokeStyle = '#1e1a16'; x.lineWidth = 14; x.beginPath(); x.arc(128, 128, 121, 0, 7); x.stroke(); }, { rough: .8 });
    const disc = new THREE.CylinderGeometry(.18, .18, .012, 28); disc.rotateX(Math.PI / 2); const o = p.add(disc, face, V(0, 0, .03));
    o.material = [plain([.36, .26, .18], { rough: .9 }), face, plain([.36, .26, .18], { rough: .9 })];
    const uv = disc.attributes.uv, P = disc.attributes.position; for (let i = 0; i < P.count; i++) if (Math.abs(P.getZ(i)) > .005) uv.setXY(i, P.getX(i) / .36 + .5, P.getY(i) / .36 + .5);
    p.add(new THREE.SphereGeometry(.045, 12, 6, 0, Math.PI * 2, 0, Math.PI / 2), plain([.16, .15, .14], { rough: .5, metal: .4 }), V(0, 0, .036), [Math.PI / 2, 0, 0]);
    p.box(.12, .02, .02, wood([.5, .38, .26]), V(0, 0, .012)); return p; },
  // a boat carved from a pine block, 0.34 m, a mast of a twig and a square sail of birch bark, a strip of red wool at the masthead;
  // the waterline at y 0
  boat: () => { const p = new Parts(), w = wood([.74, .6, .42]);
    const hull = new THREE.SphereGeometry(1, 16, 8, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2); hull.scale(.17, .07, .05); hull.rotateY(Math.PI / 2); p.add(hull, w, V(0, .015, 0));
    const deck = new THREE.CircleGeometry(1, 16); deck.rotateX(-Math.PI / 2); deck.scale(.05, 1, .17); p.add(deck, wood([.64, .5, .34]), V(0, .016, 0));
    p.rod(V(0, .015, .02), V(0, .25, .02), .004, wood([.46, .36, .24]), 5);
    const bark = painted(64, 64, (x, ww, hh) => { x.fillStyle = '#ece4d4'; x.fillRect(0, 0, ww, hh); x.fillStyle = '#3a3028'; for (let i = 0; i < 9; i++) x.fillRect(Math.random() * ww, Math.random() * hh, 6 + Math.random() * 10, 1.5); }, { side: THREE.DoubleSide, rough: .9 });
    const sail = new THREE.PlaneGeometry(.13, .12, 4, 2); { const P = sail.attributes.position; for (let i = 0; i < P.count; i++) P.setZ(i, .012 * Math.cos(P.getX(i) / .13 * Math.PI)); } sail.rotateY(Math.PI / 2);
    p.add(sail, bark, V(0, .15, .028)); p.box(.004, .015, .05, plain([.7, .15, .1]), V(0, .245, .04)); return p; },
  // a kite of split cane and dyed linen, 0.66 by 0.95 m, painted with a sun in ochre on indigo; its tail of nine rag bows, 2.2 m;
  // the bridle's knot at the origin, the face to +z
  kite: () => { const p = new Parts(), cane = wood([.78, .68, .46]);
    const s = new THREE.Shape(); s.moveTo(0, .5); s.lineTo(.33, .14); s.lineTo(0, -.45); s.lineTo(-.33, .14); s.closePath();
    const face = painted(256, 256, (x, w, h) => { x.fillStyle = '#26407a'; x.fillRect(0, 0, w, h); x.fillStyle = '#d8a238'; x.beginPath(); x.arc(128, 150, 44, 0, 7); x.fill();
      for (let i = 0; i < 12; i++) { const a = i * Math.PI / 6; x.beginPath(); x.moveTo(128 + Math.cos(a) * 50, 150 + Math.sin(a) * 50); x.lineTo(128 + Math.cos(a + .13) * 74, 150 + Math.sin(a + .13) * 74); x.lineTo(128 + Math.cos(a + .26) * 50, 150 + Math.sin(a + .26) * 50); x.fill(); }
      x.strokeStyle = '#b8402a'; x.lineWidth = 10; x.strokeRect(5, 5, w - 10, h - 10); }, { side: THREE.DoubleSide, rough: .85 });
    const geo = new THREE.ShapeGeometry(s); { const uv = geo.attributes.uv, P = geo.attributes.position; for (let i = 0; i < P.count; i++) uv.setXY(i, P.getX(i) / .66 + .5, (P.getY(i) + .45) / .95); }
    p.add(geo, face, V(0, 0, .0)); p.rod(V(0, -.45, -.006), V(0, .5, -.006), .004, cane, 4); p.rod(V(-.33, .14, -.008), V(.33, .14, -.008), .004, cane, 4);
    const tail = [], bows = plain([.85, .78, .6], { rough: .95 }), red = plain([.72, .2, .14], { rough: .95 }); for (let i = 0; i <= 10; i++) tail.push(V(Math.sin(i * .7) * .08 * i / 10, -.45 - i * .22, -.02 - i * .04));
    p.g.add(line(tail, .002, plain([.8, .74, .6]))); for (let i = 1; i < 10; i++) p.box(.07, .025, .006, i % 2 ? red : bows, tail[i], [0, 0, Math.sin(i) * .4]);
    return p; },
  // five knucklebones, a sheep's astragali, ivory and worn, 2.5 cm; scattered about the origin on the ground
  bones: (seed = 1) => { const p = new Parts(), m = plain([.9, .86, .74], { rough: .55 }); let s = seed; const r = () => ((s = (s * 16807) % 2147483647) / 2147483647);
    for (let i = 0; i < 5; i++) { const g = new THREE.DodecahedronGeometry(1, 0); g.scale(.0125, .008, .009); const a = r() * 6.3, d = .03 + r() * .16; p.add(g, m, V(Math.cos(a) * d, .008, Math.sin(a) * d), [r(), r() * 6, r() * .5]); }
    return p; },
  // a terracotta horse on four wheels, 0.2 m long, the red slip painted with a black mane and bridle; its pull-string's knot at the chest
  horse: () => { const p = new Parts(), clay = painted(64, 64, (x, w, h) => { x.fillStyle = '#b8643a'; x.fillRect(0, 0, w, h); for (let i = 0; i < 90; i++) { x.fillStyle = `rgba(90,40,20,${Math.random() * .2})`; x.fillRect(Math.random() * w, Math.random() * h, 4, 4); } }, { rough: .85 });
    const body = new THREE.CapsuleGeometry(.035, .1, 4, 10); body.rotateX(Math.PI / 2); p.add(body, clay, V(0, .1, 0));
    p.rod(V(0, .11, .06), V(0, .17, .1), .022, clay, 8, .018); const head = new THREE.CapsuleGeometry(.018, .045, 3, 8); head.rotateX(1.1); p.add(head, clay, V(0, .175, .125)); p.box(.012, .05, .07, plain([.16, .1, .07], { rough: .9 }), V(0, .17, .085), [-.75, 0, 0]);
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) { p.rod(V(sx * .022, .1, sz * .05), V(sx * .024, .035, sz * .05), .011, clay, 6); const wh = new THREE.CylinderGeometry(.028, .028, .01, 12); wh.rotateZ(Math.PI / 2); p.add(wh, wood([.5, .38, .26]), V(sx * .04, .028, sz * .05)); }
    p.rod(V(-.045, .028, -.05), V(.045, .028, -.05), .004, wood([.4, .3, .2]), 4).rotation.set(0, 0, Math.PI / 2); p.rod(V(-.045, .028, .05), V(.045, .028, .05), .004, wood([.4, .3, .2]), 4).rotation.set(0, 0, Math.PI / 2);
    return p; },
};
export function build(key, ...a) { const p = TOYS[key](...a); return { g: p.g, tris: count(p.g) }; }
export function measure(key) { const { g, tris } = build(key), b = new THREE.Box3().setFromObject(g), s = b.getSize(V()); return { key, tris, size: s.toArray().map(v => +v.toFixed(3)) }; }

// ——— the skeleton's helpers (the musicians' two-bone arm; Session 1106's seat angles' convention, the child facing +z, its right at -x)
const wp = b => new THREE.Vector3().setFromMatrixPosition(b.matrixWorld);
const wq = b => b.getWorldQuaternion(new THREE.Quaternion());
function setWorldQ(b, q) { b.quaternion.copy(wq(b.parent).invert().multiply(q)); b.updateMatrixWorld(true); }
function aim(b, from, to) { setWorldQ(b, new THREE.Quaternion().setFromUnitVectors(from.clone().normalize(), to.clone().normalize()).multiply(wq(b))); }
function frame(o, y, z) { const Yy = y.clone().normalize(), Z = z.clone().addScaledVector(Yy, -z.dot(Yy)).normalize(), Xx = Yy.clone().cross(Z); return new THREE.Matrix4().makeBasis(Xx, Yy, Z).setPosition(o); }
function reach(P, s, T, pole) { const Bn = P.byName, ua = Bn['upperarm01.' + s], la = Bn['lowerarm01.' + s], wr = Bn['wrist.' + s]; P.root.updateMatrixWorld(true);
  const S = wp(ua), E = wp(la), Wr = wp(wr), a = S.distanceTo(E), b = E.distanceTo(Wr), D = T.clone().sub(S); let d = D.length(); const want = d; d = Math.min(a + b - 1e-3, Math.max(Math.abs(a - b) + 1e-3, d)); D.normalize();
  const x = (a * a - b * b + d * d) / (2 * d), h = Math.sqrt(Math.max(0, a * a - x * x)), pl = pole.clone().addScaledVector(D, -pole.dot(D)).normalize(), E2 = S.clone().addScaledVector(D, x).addScaledVector(pl, h);
  aim(ua, E.clone().sub(S), E2.clone().sub(S)); P.root.updateMatrixWorld(true); const E3 = wp(la), W3 = wp(wr); aim(la, W3.sub(E3), S.clone().addScaledVector(D, d).sub(E3)); P.root.updateMatrixWorld(true);
  return +(want - d).toFixed(3); }
function handNow(P, s) { const Bn = P.byName, w = wp(Bn['wrist.' + s]), f = wp(Bn['finger3-1.' + s]).sub(w).normalize(), k = wp(Bn['finger2-1.' + s]).sub(wp(Bn['finger5-1.' + s])).normalize();
  const n = (s === 'L' ? f.clone().cross(k) : k.clone().cross(f)).normalize(); return { w, f, n, len: wp(Bn['finger3-1.' + s]).distanceTo(w) }; }
function orient(P, s, F, N) { const h = handNow(P, s), cur = frame(V(), h.f, h.n), des = frame(V(), F, N), R = new THREE.Quaternion().setFromRotationMatrix(des.multiply(cur.transpose()));
  setWorldQ(P.byName['wrist.' + s], R.multiply(wq(P.byName['wrist.' + s]))); }
function curl(P, s, k, kt = 0) { const Bn = P.byName; P.root.updateMatrixWorld(true); const hinge = wp(Bn['finger2-1.' + s]).sub(wp(Bn['finger5-1.' + s])).normalize().applyQuaternion(wq(Bn['metacarpal2.' + s]).invert()), sg = s === 'L' ? -1 : 1;
  for (let f = 2; f <= 5; f++) for (let j = 1; j <= 3; j++) { const b = Bn[`finger${f}-${j}.${s}`]; if (b) b.quaternion.setFromAxisAngle(hinge, sg * k * [1.15, 1.35, .95][j - 1] * (1 + (f - 2) * .06)); }
  if (kt) for (let j = 2; j <= 3; j++) { const b = Bn[`finger1-${j}.${s}`]; if (b) b.quaternion.multiply(new THREE.Quaternion().setFromAxisAngle(V(0, 0, 1), -sg * kt * .5)); } P.root.updateMatrixWorld(true); }
// a hand sent to T with its fingers along F and its palm to N, then closed by k; three passes, as the musicians' grip
function hand(P, s, T, F, N, pole, k = .85, kt = .6) { let miss = 0; for (let i = 0; i < 3; i++) { miss = reach(P, s, T, pole); orient(P, s, F, N); } curl(P, s, k, kt); return miss; }
// the palm's middle, where a held thing passes through the closed hand
function palm(P, s) { const h = handNow(P, s); return h.w.clone().addScaledVector(h.f, h.len * .58).addScaledVector(h.n, .022); }
// a bone turned about a world axis, carrying its children
function rotW(P, name, axis, a) { const b = P.byName[name]; if (!b) return; P.root.updateMatrixWorld(true); setWorldQ(b, new THREE.Quaternion().setFromAxisAngle(axis, a).multiply(wq(b))); P.root.updateMatrixWorld(true); }
// a leg: the thigh forward by t (back if negative), the knee bent by k, the foot laid back to the ground by f of what the two turned it
function leg(P, s, t, k, f = 1) { rotW(P, 'upperleg01.' + s, X, -t); rotW(P, 'lowerleg01.' + s, X, k); rotW(P, 'foot.' + s, X, f * (t - k)); }
// the back bent forward by a (back if negative) over three vertebrae, and the head by h
function lean(P, a, h = 0, twist = 0) { for (const [n, k] of [['spine04', .35], ['spine03', .35], ['spine02', .3]]) { rotW(P, n, X, a * k); if (twist) rotW(P, n, Y, twist * k); } if (h) rotW(P, 'head', X, h); }
function kneel(P, back = .15) { for (const s of ['L', 'R']) leg(P, s, back, 1.45 + back, 0), rotW(P, 'foot.' + s, X, .6); }
const sideX = P => Math.sign(wp(P.byName['upperarm01.R']).x - wp(P.byName['upperarm01.L']).x);

// ——— the games: each poses one child and hangs its toys; o.mirror turns a pair's second child's work to its left hand where it matters
export const GAMES = { gatelands: ['hoop', 'throw', 'catch', 'doll'], mark: ['spar', 'spar2', 'boat'], aurenne: ['kite', 'bones', 'bones2', 'horse'] };
export function play(P, game, o = {}) { const root = P.root; root.position.x = root.position.z = 0; root.rotation.set(0, 0, 0); root.updateMatrixWorld(true);
  const Bn = P.byName, r = sideX(P), y0 = root.position.y, ank = Math.min(wp(Bn['foot.L']).y, wp(Bn['foot.R']).y), out = { toys: [], tris: 0, miss: {} };
  const shR = () => wp(Bn['upperarm01.R']), shL = () => wp(Bn['upperarm01.L']);
  const toGround = kneeling => { root.updateMatrixWorld(true); let lo;
    if (kneeling) { const kn = Math.min(wp(Bn['lowerleg01.L']).y, wp(Bn['lowerleg01.R']).y); lo = kn - .045; }
    else lo = Math.min(wp(Bn['foot.L']).y, wp(Bn['foot.R']).y) - ank; root.position.y -= lo; root.updateMatrixWorld(true); };
  const toys = []; const hang = (key, M, ...a) => toys.push([key, M, a]);
  const fwd = V(0, 0, 1), down = V(0, -1, 0), out_ = s => V(s === 'R' ? r : -r, 0, 0);
  if (game === 'hoop') {
    // at a run behind the hoop, driving it with the stick at its back above the middle
    leg(P, 'R', .55, .5); leg(P, 'L', -.35, .75, .6); lean(P, .16, -.05); toGround();
    const R0 = .3, c = V(r * .3, R0, .9), phi = .7, rim = c.clone().add(V(0, Math.cos(phi) * R0, -Math.sin(phi) * R0));
    out.miss.R = hand(P, 'R', shR().add(V(r * .1, -.46, .3)), V(-r * .2, -.3, 1).normalize(), V(-r, 0, 0), V(r, -.4, -.6));
    out.miss.L = hand(P, 'L', shL().add(V(-r * .06, -.4, -.14)), V(0, -1, -.2).normalize(), V(r, 0, 0), V(-r, 0, 1), .5, .2);
    const g = palm(P, 'R'), d = rim.clone().sub(g), L = d.length(); hang('stick', frame(g.clone().addScaledVector(d, -.12 / L), d, V(0, 0, 1)), L + .12);
    hang('hoop', new THREE.Matrix4().makeRotationY(Math.PI / 2).setPosition(c)); out.reach = +L.toFixed(2);
  } else if (game === 'throw') {
    // the ball drawn back over the right shoulder, the left arm out toward the catcher
    leg(P, 'L', .32, .1); leg(P, 'R', -.25, .2, .6); lean(P, -.08, -.1, .25 * r); toGround();
    out.miss.R = hand(P, 'R', shR().add(V(r * .12, .22, -.16)), V(0, 1, .3).normalize(), V(0, 0, 1), V(r, -.3, -.5), .5, .3);
    out.miss.L = hand(P, 'L', shL().add(V(-r * .05, -.05, .4)), V(0, -.2, 1).normalize(), V(0, -1, 0), V(-r, -1, 0), .25, .1);
    const h = handNow(P, 'R'); hang('ball', new THREE.Matrix4().setPosition(palm(P, 'R').addScaledVector(h.n, .07)));
  } else if (game === 'catch') {
    // both hands up and out, palms to the ball, the fingers spread
    leg(P, 'R', .12, .25); leg(P, 'L', .05, .3); lean(P, .1, -.12); toGround();
    for (const s of ['R', 'L']) out.miss[s] = hand(P, s, (s === 'R' ? shR() : shL()).add(V((s === 'R' ? r : -r) * -.08, .02, .36)), V(0, 1, .25).normalize(), V(0, 0, 1), V(s === 'R' ? r : -r, -1, 0), .2, 0);
  } else if (game === 'doll') {
    // the doll held in the crook of both arms against the chest, the head bent to it
    lean(P, .06, .32); toGround(); const ch = shR().lerp(shL(), .5).add(V(0, -.2, .12));
    out.miss.R = hand(P, 'R', ch.clone().add(V(-r * .07, -.06, .03)), V(-r, .2, .2).normalize(), V(0, .3, -1).normalize(), V(r, -1, -.3), .5, .2);
    out.miss.L = hand(P, 'L', ch.clone().add(V(r * .06, .05, .04)), V(r, .4, .1).normalize(), V(0, 0, -1), V(-r, -1, -.3), .4, .2);
    const M = frame(ch.clone().add(V(0, .03, .07)), V(-r * .25, 1, -.15), V(0, 0, 1)); hang('doll', M);
  } else if (game === 'spar' || game === 'spar2') {
    // the guard of a play fight: the left foot forward, the shield up before the chest, the sword raised over the right shoulder
    leg(P, 'L', .35, .35); leg(P, 'R', -.25, .4, .6); lean(P, .1, -.04, .18 * r); toGround();
    out.miss.R = hand(P, 'R', shR().add(V(r * .12, .12, .1)), V(-r * .2, .2, 1).normalize(), V(-r, 0, 0), V(r, -1, -.3), .95, .8);
    out.miss.L = hand(P, 'L', shL().add(V(r * .08, -.16, .3)), V(-r * .1, 1, .1).normalize(), V(-r, 0, 0), V(-r, -1, 0), .9, .6);
    const pR = palm(P, 'R'); hang('sword', frame(pR, V(-r * .2, .78, .55), V(-r, 0, 0)));
    const pL = palm(P, 'L'); hang('shield', frame(pL.clone().add(V(0, 0, .02)), V(0, 1, 0), V(-r * .15, 0, 1)), game === 'spar2' ? ['#2a5a8a', '#e6d8b4'] : undefined);
  } else if (game === 'boat') {
    // kneeling on the bank, reaching the boat out onto the pool
    kneel(P, .2); lean(P, .95, .1); toGround(true); const wy = o.water ?? .006, b = V(r * .1, wy, .62);
    out.miss.R = hand(P, 'R', b.clone().add(V(0, .05, -.1)), V(0, -.4, 1).normalize(), V(0, -1, 0), V(r, 0, -1), .35, .2);
    out.miss.L = hand(P, 'L', wp(Bn['lowerleg01.L']).add(V(-r * .02, .14, .08)), V(0, -1, .2).normalize(), V(0, 0, -1), V(-r, 0, -1), .3, .1);
    const pb = palm(P, 'R'); b.set(pb.x, wy, pb.z + .1); hang('boat', new THREE.Matrix4().makeRotationY(.4).setPosition(b)); out.water = wy;
  } else if (game === 'kite') {
    // leaning back on the line, both hands up before the face, the head up to the kite 11 m high and 13 m off
    leg(P, 'L', .25, .15); leg(P, 'R', -.12, .15, .6); lean(P, -.14, -.42); toGround();
    out.miss.R = hand(P, 'R', shR().add(V(r * .02, .24, .3)), V(0, .5, 1).normalize(), V(r * .2, -1, 0).normalize(), V(r, -1, 0), .95, .8);
    out.miss.L = hand(P, 'L', shL().add(V(r * .06, .1, .34)), V(0, .3, 1).normalize(), V(-r * .2, -1, 0).normalize(), V(-r, -1, 0), .95, .8);
    const k = V(-r * 3, 7.5, 18), a = palm(P, 'R'), bL = palm(P, 'L'); hang('kite', frame(k, V(0, .9, -.4), V(0, -.35, -1)));
    out.line = [a, bL, k];
  } else if (game === 'bones' || game === 'bones2') {
    // kneeling at the bones on the paving: one tosses a bone up from the back of the hand, the other sweeps the rest up from the ground
    kneel(P, game === 'bones' ? .05 : .25); lean(P, game === 'bones' ? .38 : .7, .35); toGround(true);
    if (game === 'bones') { out.miss.R = hand(P, 'R', shR().add(V(r * .02, -.18, .3)), V(0, .1, 1).normalize(), V(0, 1, 0), V(r, -1, 0), .15, 0);
      out.miss.L = hand(P, 'L', wp(Bn['lowerleg01.L']).add(V(0, .12, .06)), V(0, -1, .3).normalize(), V(0, 0, -1), V(-r, 0, -1), .4, .2);
      const top = palm(P, 'R').add(V(0, .3, .02)); hang('bones1', new THREE.Matrix4().setPosition(top)); hang('bones', new THREE.Matrix4().setPosition(V(0, 0, .46)), 3); }
    else { out.miss.R = hand(P, 'R', V(r * .06, .07, .4), V(0, -.5, 1).normalize(), V(0, -1, 0), V(r, 0, -1), .55, .3);
      out.miss.L = hand(P, 'L', wp(Bn['lowerleg01.L']).add(V(0, .12, .06)), V(0, -1, .3).normalize(), V(0, 0, -1), V(-r, 0, -1), .4, .2); }
  } else if (game === 'horse') {
    // walking with the horse on its string behind, the right arm back and down, the head turned to it
    leg(P, 'L', .3, .15); leg(P, 'R', -.25, .35, .6); lean(P, .04, 0, -.35 * r); rotW(P, 'neck01', Y, -.5 * r); toGround();
    out.miss.R = hand(P, 'R', shR().add(V(r * .12, -.42, -.12)), V(0, -1, -.3).normalize(), V(-r, 0, 0), V(r, 0, 1), .9, .6);
    out.miss.L = hand(P, 'L', shL().add(V(-r * .04, -.42, .12)), V(0, -1, .2).normalize(), V(r, 0, 0), V(-r, 0, -1), .4, .1);
    const hp = V(r * .3, 0, -.85); hang('horse', new THREE.Matrix4().makeRotationY(Math.atan2(-hp.x, -hp.z) + Math.PI).setPosition(hp)); out.string = [palm(P, 'R'), hp.clone().add(V(0, .12, .09))];
  }
  // hang them on the root, so they move with the child
  root.updateMatrixWorld(true); const inv = root.matrixWorld.clone().invert();
  const put = (g, M) => { g.matrixAutoUpdate = false; g.matrix.copy(inv.clone().multiply(M)); root.add(g); };
  for (const [key, M, a] of toys) { const t = key === 'bones1' ? (() => { const p = new Parts(); const g = new THREE.DodecahedronGeometry(1, 0); g.scale(.0125, .008, .009); p.add(g, plain([.9, .86, .74], { rough: .55 }), V(), [.6, .3, .2]); return { g: p.g, tris: count(p.g) }; })() : build(key, ...a);
    put(t.g, M); out.tris += t.tris; out.toys.push(key); }
  const str = plain([.8, .74, .6], { rough: .9 });
  if (out.line) { const [a, b, k] = out.line, g = new THREE.Group(); g.add(line(sag(a, k, 1.1, 24), .0015, str, 48)); g.add(line([a, b], .0015, str, 2)); put(g, new THREE.Matrix4()); out.tris += count(g); out.line = +a.distanceTo(k).toFixed(1); }
  if (out.string) { const [a, b] = out.string, g = new THREE.Group(); g.add(line(sag(a, b, .12, 10), .0015, str, 16)); put(g, new THREE.Matrix4()); out.tris += count(g); delete out.string; }
  out.tris = Math.round(out.tris); out.lift = +(root.position.y - y0).toFixed(3); return out; }
