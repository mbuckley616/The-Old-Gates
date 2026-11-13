// The Gatelands' three festivals on the green (the concept artist, 13 Nov 2026; backlog L9, "Festivals on the calendar", OG-107; the quest
// writer's *Festivals on the Calendar, I*, 21 Oct, unapproved). What each festival stands on a village green, in metres, built as the
// slices build (three.js 0.170, no textures but painted canvases), so the look builder can lift a prop straight into a world file:
//   the Greening (Sowing 3): the pole, 6.2 m of peeled ash in a stone collar, a crown of green boughs 1.1 m across at its head, a ribbon
//     from every house streaming from the crown (hanging, or pegged out in a ring 4.6 m round); the knots of the houses' ribbons round
//     the pole at hand height; a hurdle pen of the year's first lambs
//   Riverfair (Haysel 18): a trader's booth under a striped awning, a wool beam on a tripod with a fleece sack against a stone weight,
//     a hitching rail for horses, the blessing at the water's edge (a stone step, a post with a green bough, the four-handled mether)
//   the Night of the Lanterns (Leaffall 26): the sky lantern (a willow hoop 0.36 m, a paper envelope 0.62 m high, a fuel cake of
//     tallow and moss alight under it), held, let go and rising; the lantern-seller's trestle; a sill lantern for every window
//   and for every level: bunting (triangles of dyed linen on a cord), the door garland of green boughs, a trestle table.
// Each builder returns a Parts group in its own frame (+y up, the front to +z); tris(g) counts it. The poses (hold, release, tie, cup,
// lead, look) turn a people.js person's own bones, as kids.js and the musicians do; nothing is rebuilt.
import * as THREE from 'three';

const V = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
const C = (r, g, b) => new THREE.Color().setRGB(r, g, b, THREE.SRGBColorSpace);
const Y = V(0, 1, 0), X = V(1, 0, 0);
export const HOUSE_DYES = { madder: [.66, .14, .1], woad: [.16, .28, .56], weld: [.88, .72, .18], moss: [.3, .46, .2], cream: [.92, .88, .76], heather: [.52, .3, .52], ochre: [.78, .5, .2], saffron: [.9, .52, .12] };
const DYES = Object.values(HOUSE_DYES);

// ——— materials
const MATS = {}; let GRAIN = null;
function grainTex() { if (GRAIN) return GRAIN; const c = document.createElement('canvas'); c.width = c.height = 256; const x = c.getContext('2d'); x.fillStyle = '#d6d6d6'; x.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 110; i++) { const px = Math.random() * 256; x.strokeStyle = `rgba(40,30,20,${.05 + Math.random() * .12})`; x.lineWidth = .5 + Math.random() * 1.6; x.beginPath(); for (let y = 0; y <= 256; y += 16) x.lineTo(px + Math.sin(y * .02 + i) * 3, y); x.stroke(); }
  GRAIN = new THREE.CanvasTexture(c); GRAIN.wrapS = GRAIN.wrapT = THREE.RepeatWrapping; GRAIN.colorSpace = THREE.SRGBColorSpace; return GRAIN; }
const wood = col => MATS['w' + col] || (MATS['w' + col] = new THREE.MeshStandardMaterial({ map: grainTex(), color: C(...col), roughness: .75 }));
export const plain = (col, o = {}) => { const k = 'p' + col + JSON.stringify(o); return MATS[k] || (MATS[k] = new THREE.MeshStandardMaterial({ color: C(...col), roughness: o.rough ?? .8, metalness: o.metal ?? 0, side: o.side ?? THREE.FrontSide, emissive: o.glow ? C(...o.glow) : C(0, 0, 0), emissiveIntensity: o.gk ?? 1 })); };
const cloth = col => plain(col, { rough: .92, side: THREE.DoubleSide });
function painted(w, h, draw, o = {}) { const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return new THREE.MeshStandardMaterial({ map: t, roughness: o.rough ?? .9, side: o.side ?? THREE.FrontSide, transparent: !!o.transparent, alphaTest: o.alphaTest ?? 0 }); }
export function tris(g) { let t = 0; g.traverse(o => { if (o.isMesh) { const gg = o.geometry, n = (gg.index ? gg.index.count : gg.attributes.position.count) / 3; t += n * (o.isInstancedMesh ? o.count : 1); } }); return Math.round(t); }

// a group with a few shapes: a rod between two points, a box, a mesh placed
class Parts { constructor() { this.g = new THREE.Group(); }
  add(geo, m, p = V(), r = null) { const o = new THREE.Mesh(geo, m); o.position.copy(p); if (r) o.rotation.set(...r); o.castShadow = o.receiveShadow = true; this.g.add(o); return o; }
  rod(a, b, r, m, seg = 7, r2 = r) { const d = b.clone().sub(a), L = d.length(), geo = new THREE.CylinderGeometry(r2, r, L, seg, 1); geo.translate(0, L / 2, 0); const o = this.add(geo, m, a); o.quaternion.setFromUnitVectors(Y, d.normalize()); return o; }
  box(w, h, d, m, p = V(), r = null) { return this.add(new THREE.BoxGeometry(w, h, d), m, p, r); } }
const tube = (pts, r, m, seg = 24, rs = 4) => { const o = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), seg, r, rs, false), m); o.castShadow = true; return o; };
export const sag = (a, b, s, n = 12) => { const out = []; for (let i = 0; i <= n; i++) { const t = i / n; out.push(a.clone().lerp(b, t).add(V(0, -s * 4 * t * (1 - t), 0))); } return out; };
// a flat strip along a line of points (a ribbon): w wide, its face turned to `side` where given, else across the line and level
function strip(pts, w, m, twist = 0) { const pos = [], idx = [], uv = [];
  pts.forEach((p, i) => { const t = (pts[Math.min(i + 1, pts.length - 1)].clone().sub(pts[Math.max(i - 1, 0)])).normalize(); let s = t.clone().cross(Y); if (s.lengthSq() < 1e-4) s = X.clone(); s.normalize();
    if (twist) s.applyAxisAngle(t, Math.sin(i * .9 + twist) * .9); pos.push(...p.clone().addScaledVector(s, -w / 2).toArray(), ...p.clone().addScaledVector(s, w / 2).toArray()); uv.push(0, i / (pts.length - 1), 1, i / (pts.length - 1));
    if (i) { const a = (i - 1) * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); } });
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx); g.computeVertexNormals();
  const o = new THREE.Mesh(g, m); o.castShadow = o.receiveShadow = true; return o; }

// ——— greenery: boughs of leaf cards (birch and hawthorn in leaf for the Greening, the same kit for every garland), with may blossom
let LEAF = null;
function leafMat() { if (LEAF) return LEAF; const c = document.createElement('canvas'); c.width = c.height = 128; const x = c.getContext('2d');
  for (let i = 0; i < 70; i++) { const a = Math.random() * 6.28, r = Math.sqrt(Math.random()) * 52; x.save(); x.translate(64 + Math.cos(a) * r, 64 + Math.sin(a) * r); x.rotate(Math.random() * 6.28);
    x.fillStyle = `hsl(${92 + Math.random() * 20},${45 + Math.random() * 15}%,${30 + Math.random() * 22}%)`; x.beginPath(); x.ellipse(0, 0, 7 + Math.random() * 5, 4, 0, 0, 6.28); x.fill(); x.restore(); }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; LEAF = new THREE.MeshStandardMaterial({ map: t, alphaTest: .4, side: THREE.DoubleSide, roughness: .8 }); return LEAF; }
// leaf clusters along a line of points: n cards of size s, set about the line by r; blossom white specks if bloom
function bough(p, pts, n, s, r, rnd, bloom = 0) { const cv = new THREE.CatmullRomCurve3(pts), geo = new THREE.PlaneGeometry(s, s), im = new THREE.InstancedMesh(geo, leafMat(), n), M = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler();
  for (let i = 0; i < n; i++) { const at = cv.getPoint(i / Math.max(1, n - 1)).add(V((rnd() - .5) * r, (rnd() - .5) * r, (rnd() - .5) * r)); e.set(rnd() * 6.3, rnd() * 6.3, rnd() * 6.3); q.setFromEuler(e); M.compose(at, q, V(1, 1, 1).multiplyScalar(.7 + rnd() * .6)); im.setMatrixAt(i, M); }
  im.castShadow = true; p.g.add(im);
  if (bloom) { const bm = plain([.97, .95, .9], { rough: .7 }), bg = new THREE.IcosahedronGeometry(.018, 0), bi = new THREE.InstancedMesh(bg, bm, bloom);
    for (let i = 0; i < bloom; i++) { M.makeTranslation(cv.getPoint(rnd()).add(V((rnd() - .5) * r * 1.1, (rnd() - .5) * r * 1.1, (rnd() - .5) * r * 1.1))); bi.setMatrixAt(i, M); } p.g.add(bi); } }
const seeded = s => { let a = s >>> 0; return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; };

// ——— the props
export const PROPS = {
  // the Greening's pole: 6.2 m of peeled ash, 0.24 m at the foot to 0.13 at the head, set 0.9 m down in a collar of field stones 0.9 m
  // across; the crown, a hoop of green boughs and may blossom 1.1 m across at 5.6 m, hung from the head by four cords; a ribbon from every
  // house, 0.06 m wide, from the crown: 'hang' lets them fall to 1.2 m above the grass, 'ring' pegs them out to a ring 4.6 m round on
  // hazel pegs; the houses' own knots round the pole between 1.35 and 1.85 m, a few cm of each colour, the ends hanging 0.3 m
  pole: (o = {}) => { const p = new Parts(), r = seeded(o.seed ?? 3), H = 6.2, n = o.n ?? 14, ash = wood([.86, .78, .64]);
    p.rod(V(0, -.1, 0), V(0, H, 0), .12, ash, 12, .065); p.add(new THREE.SphereGeometry(.09, 10, 8), ash, V(0, H + .02, 0));
    const st = plain([.55, .54, .5], { rough: .95 }); for (let i = 0; i < 11; i++) { const a = i / 11 * 6.28, s = p.add(new THREE.DodecahedronGeometry(.13 + r() * .06, 0), st, V(Math.cos(a) * .32, .05, Math.sin(a) * .32)); s.scale.y = .55; s.rotation.y = r() * 6; }
    const cy = 5.55, cr = .55, ring = []; for (let i = 0; i <= 24; i++) { const a = i / 24 * 6.28; ring.push(V(Math.cos(a) * cr, cy, Math.sin(a) * cr)); }
    p.g.add(tube(ring, .025, wood([.5, .4, .28]), 48, 5)); bough(p, ring, 90, .2, .14, r, 70);
    const cord = plain([.8, .74, .6], { rough: .95 }); for (let i = 0; i < 4; i++) { const a = i / 4 * 6.28 + .4; p.g.add(tube([V(0, H - .05, 0), V(Math.cos(a) * cr, cy, Math.sin(a) * cr)], .005, cord, 2, 3)); }
    const RIB = []; for (let i = 0; i < n; i++) { const a = i / n * 6.28 + .2, col = DYES[i % DYES.length], top = V(Math.cos(a) * cr, cy - .03, Math.sin(a) * cr), m = cloth(col); let pts;
      if (o.mode === 'ring') { const R = 4.6, end = V(Math.cos(a) * R, .32, Math.sin(a) * R); pts = sag(top, end, .35, 18); p.rod(V(Math.cos(a) * R, -.05, Math.sin(a) * R), V(Math.cos(a) * (R + .03), .38, Math.sin(a) * (R + .03)), .015, wood([.55, .44, .3]), 5); }
      else { const ln = 3.2 + r() * 1.0, out = .62 + r() * .1; pts = []; for (let k = 0; k <= 14; k++) { const t = k / 14; pts.push(V(Math.cos(a) * (cr + (out - cr) * t + Math.sin(t * 7 + i) * .03), cy - .03 - ln * t, Math.sin(a) * (cr + (out - cr) * t) + Math.cos(t * 6 + i) * .03)); } }
      p.g.add(strip(pts, .06, m, o.mode === 'ring' ? 0 : i)); RIB.push(col); }
    // the houses' knots: one a house, its tails hanging
    const K = o.knots ?? 0; for (let i = 0; i < K; i++) { const y = 1.38 + (i % 6) * .085 + r() * .02, a = r() * 6.28, rad = .118 - (y / H) * .05, m = cloth(DYES[(i * 3 + 1) % DYES.length]);
      const band = new THREE.TorusGeometry(rad + .004, .009, 4, 18); band.rotateX(Math.PI / 2); p.add(band, m, V(0, y, 0));
      const k0 = V(Math.cos(a) * (rad + .01), y, Math.sin(a) * (rad + .01)); p.g.add(strip([k0, k0.clone().add(V(Math.cos(a) * .04, -.12, Math.sin(a) * .04)), k0.clone().add(V(Math.cos(a + .3) * .06, -.3, Math.sin(a + .3) * .06))], .04, m, i)); }
    p.g.userData = { height: H, crown: cr * 2, ribbons: RIB.length, knots: K }; return p; },
  // bunting: a hemp cord between a and b sagging s, a triangle of dyed linen every 0.4 m, 0.22 m across and 0.28 deep
  bunting: (a, b, s = .4, o = {}) => { const p = new Parts(), pts = sag(a, b, s, 24), cv = new THREE.CatmullRomCurve3(pts), L = cv.getLength(), n = Math.floor(L / .4), r = seeded(o.seed ?? 7);
    p.g.add(tube(pts, .005, plain([.62, .55, .42], { rough: 1 }), 30, 3));
    const pos = [], col = []; for (let i = 0; i < n; i++) { const t0 = (i + .1) / n, t1 = (i + .65) / n, A = cv.getPointAt(t0), B = cv.getPointAt(t1), Mid = A.clone().lerp(B, .5).add(V((r() - .5) * .03, -.28, (r() - .5) * .05)), c = C(...DYES[(o.dyes || [0, 1, 2, 4, 3])[i % (o.dyes || [0, 1, 2, 4, 3]).length]]);
      pos.push(...A.toArray(), ...B.toArray(), ...Mid.toArray()); for (let k = 0; k < 3; k++) col.push(c.r, c.g, c.b); }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3)); g.computeVertexNormals();
    const fm = new THREE.MeshStandardMaterial({ vertexColors: true, side: THREE.DoubleSide, roughness: .9 }); const m = new THREE.Mesh(g, fm); m.castShadow = true; p.g.add(m); p.g.userData = { length: +L.toFixed(1), flags: n }; return p; },
  // a bunting post: a peeled pole 3.4 m, its foot in the turf
  bpost: (h = 3.4) => { const p = new Parts(); p.rod(V(0, -.1, 0), V(0, h, 0), .06, wood([.7, .6, .46]), 7, .045); return p; },
  // the door garland: a swag of green boughs over a door w wide, its top at the lintel (y 0), the ends hanging 0.5 m; may blossom in
  // spring, rowan berries for the autumn (o.berries)
  garland: (w = 1.1, o = {}) => { const p = new Parts(), r = seeded(o.seed ?? 5), a = V(-w / 2 - .1, 0, 0), b = V(w / 2 + .1, 0, 0), pts = [V(-w / 2 - .14, -.5, 0), ...sag(a, b, .22, 8), V(w / 2 + .14, -.5, 0)];
    p.g.add(tube(pts, .012, plain([.4, .32, .22]), 20, 4)); bough(p, pts, 46, .15, .08, r, o.berries ? 0 : 30);
    if (o.berries) { const bm = plain([.78, .14, .08], { rough: .4 }), bi = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(.012, 1), bm, 40), cv = new THREE.CatmullRomCurve3(pts), M = new THREE.Matrix4();
      for (let i = 0; i < 40; i++) { M.makeTranslation(cv.getPoint(r()).add(V((r() - .5) * .1, (r() - .5) * .1, .03 + r() * .04))); bi.setMatrixAt(i, M); } p.g.add(bi); }
    if (o.ribbon) { const m = cloth(o.ribbon); p.g.add(strip([V(0, -.2, .04), V(.03, -.45, .05), V(-.02, -.7, .05)], .05, m, 1)); }
    return p; },
  // a trestle table: a board 2.2 by 0.8 m at 0.76 m on two trestles, with what o.load says on it (bread, cheese, jugs; lanterns flat)
  trestle: (o = {}) => { const p = new Parts(), w = o.w ?? 2.2, r = seeded(o.seed ?? 9), oak = wood([.66, .52, .36]);
    p.box(w, .05, .8, oak, V(0, .76, 0)); for (const s of [-1, 1]) { const x = s * (w / 2 - .25); for (const z of [-.3, .3]) { p.rod(V(x - .2, 0, z), V(x, .74, z * .3), .025, oak, 5); p.rod(V(x + .2, 0, z), V(x, .74, z * .3), .025, oak, 5); } p.box(.06, .06, .7, oak, V(x, .72, 0)); }
    const load = o.load || 'feast';
    if (load === 'feast') { const crust = plain([.72, .48, .24], { rough: .85 }), cheese = plain([.92, .8, .44], { rough: .7 }), jug = plain([.55, .38, .26], { rough: .5 }), cl = cloth([.9, .87, .78]);
      p.box(w * .9, .006, .84, cl, V(0, .787, 0));
      for (let i = 0; i < 6; i++) { const b = p.add(new THREE.SphereGeometry(.1, 10, 7), crust, V(-w / 2 + .25 + i * .26, .83, -.15 + r() * .1)); b.scale.set(1.3, .6, 1); }
      const ch = p.add(new THREE.CylinderGeometry(.16, .16, .1, 18), cheese, V(.45, .84, .18)); for (const x of [-.55, .1, .8]) { const j = new THREE.LatheGeometry([[.0, 0], [.07, 0], [.09, .08], [.07, .17], [.05, .2], [.055, .23]].map(([a, b]) => new THREE.Vector2(a, b)), 12); p.add(j, jug, V(x, .79, .22)); } }
    if (load === 'lanterns') { const L = PROPS.skyLantern({ lit: false, folded: true }); for (let i = 0; i < 6; i++) { const c = L.g.clone(); c.position.set(-w / 2 + .2 + i * .36, .79, -.1 + (i % 2) * .2); p.g.add(c); }
      const L2 = PROPS.skyLantern({ lit: false }); for (const x of [-.6, .1, .7]) { const c = L2.g.clone(); c.position.set(x, .79, .22); c.scale.setScalar(.95); p.g.add(c); } }
    return p; },
  // a hurdle: hazel woven between seven stakes, 1.8 m long, 0.95 high
  hurdle: (o = {}) => { const p = new Parts(), L = o.L ?? 1.8, h = .95, haz = wood([.55, .42, .28]), haz2 = wood([.48, .36, .24]);
    for (let i = 0; i < 7; i++) { const x = -L / 2 + i * L / 6; p.rod(V(x, -.08, 0), V(x, h + .06, 0), .018, haz, 5); }
    for (let k = 0; k < 9; k++) { const y = .1 + k * (h - .12) / 8, pts = []; for (let i = 0; i <= 12; i++) { const x = -L / 2 + i * L / 12; pts.push(V(x, y, Math.sin(i * Math.PI / 2 + k * Math.PI) * .022)); } p.g.add(tube(pts, .012, k % 2 ? haz : haz2, 18, 3)); }
    return p; },
  // a trader's booth: four posts 2.4 m, a counter at 0.95 m, an awning of striped linen sloped to the front, a valance of scallops
  booth: (o = {}) => { const p = new Parts(), w = o.w ?? 2.6, d = 1.5, oak = wood([.6, .48, .34]), stripes = o.stripes || ['#b8392a', '#efe4cc'];
    for (const x of [-w / 2, w / 2]) for (const z of [-d / 2, d / 2]) p.rod(V(x, 0, z), V(x, z > 0 ? 2.25 : 2.6, z), .045, oak, 6);
    p.box(w, .05, .6, oak, V(0, .95, d / 2 - .25)); p.box(w, .9, .03, oak, V(0, .47, d / 2 - .02));
    const can = painted(256, 64, (x, W, H) => { for (let i = 0; i < 8; i++) { x.fillStyle = stripes[i % 2]; x.fillRect(i * W / 8, 0, W / 8, H); } for (let i = 0; i < 900; i++) { x.fillStyle = `rgba(60,40,20,${Math.random() * .06})`; x.fillRect(Math.random() * W, Math.random() * H, 2, 1); } }, { side: THREE.DoubleSide });
    const aw = new THREE.PlaneGeometry(w + .3, Math.hypot(d + .5, .45), 1, 1); const m = p.add(aw, can, V(0, 2.42, .1)); m.rotation.x = -Math.PI / 2 + Math.atan2(.45, d + .5);
    const val = new THREE.Shape(); val.moveTo(-(w + .3) / 2, 0); for (let i = 0; i <= 10; i++) { const x = -(w + .3) / 2 + i * (w + .3) / 10; val.lineTo(x, 0); if (i < 10) val.quadraticCurveTo(x + (w + .3) / 20, -.26, x + (w + .3) / 10, 0); } val.lineTo((w + .3) / 2, .2); val.lineTo(-(w + .3) / 2, .2);
    const vg = new THREE.ShapeGeometry(val, 4); vg.translate(0, -.2, 0); p.add(vg, can, V(0, 2.2, d / 2 + .35));
    // what is on the counter: fleeces rolled, a bolt of cloth, a horse's head collar on a peg
    const fl = plain([.88, .84, .72], { rough: 1 }); for (let i = 0; i < 4; i++) { const f = p.add(new THREE.CapsuleGeometry(.13, .22, 4, 8), fl, V(-w / 2 + .35 + i * .34, 1.1, d / 2 - .25), [0, 0, Math.PI / 2]); f.scale.z = .8; }
    p.add(new THREE.CylinderGeometry(.11, .11, .55, 12), cloth([.3, .42, .24]), V(w / 2 - .5, 1.09, d / 2 - .25), [0, 0, Math.PI / 2]);
    return p; },
  // the wool beam: a tripod of three poles 2.7 m lashed at the head, a beam 1.6 m hung from it, a fleece sack on one hook and a dressed
  // stone weight on the other
  beam: () => { const p = new Parts(), ash = wood([.66, .56, .42]), top = V(0, 2.62, 0);
    for (let i = 0; i < 3; i++) { const a = i / 3 * 6.28 + .3; p.rod(V(Math.cos(a) * 1.0, 0, Math.sin(a) * 1.0), top.clone().add(V(-Math.cos(a) * .12, .15, -Math.sin(a) * .12)), .04, ash, 6); }
    const rope = plain([.7, .62, .46], { rough: 1 }); p.g.add(tube([top, V(0, 2.25, 0)], .008, rope, 2, 3)); p.rod(V(-.8, 2.22, 0), V(.8, 2.24, 0), .03, ash, 6);
    p.g.add(tube([V(-.75, 2.2, 0), V(-.75, 1.45, 0)], .006, rope, 2, 3)); p.g.add(tube([V(.75, 2.22, 0), V(.75, 1.6, 0)], .006, rope, 2, 3));
    const sack = p.add(new THREE.SphereGeometry(.3, 12, 10), plain([.78, .7, .52], { rough: 1 }), V(-.75, 1.18, 0)); sack.scale.set(1, 1.25, .85);
    p.box(.28, .26, .22, plain([.6, .6, .56], { rough: .95 }), V(.75, 1.47, 0)); p.g.userData = { height: 2.77 }; return p; },
  // the hitching rail: an oak rail at 1.05 m on three posts, 4 m long
  rail: (L = 4) => { const p = new Parts(), oak = wood([.5, .4, .3]); for (let i = 0; i < 3; i++) p.rod(V(-L / 2 + i * L / 2, -.1, 0), V(-L / 2 + i * L / 2, 1.12, 0), .06, oak, 6); p.rod(V(-L / 2 - .1, 1.05, 0), V(L / 2 + .1, 1.05, 0), .05, oak, 6); return p; },
  // the blessing place at the water: three dressed steps down to the river, a post 1.5 m dressed with a green bough and a ribbon of each
  // dye, the mether (a four-handled cup of ash, 0.14 m) set on the top step
  blessing: (o = {}) => { const p = new Parts(), st = plain([.62, .6, .55], { rough: .9 }), r = seeded(4);
    p.box(1.6, 1, .6, st, V(0, -.5, 0)); p.box(1.4, 1, .45, st, V(0, -.8, .5)); p.box(1.2, 1, .45, st, V(0, -1.1, .9));
    p.rod(V(-.95, -.2, -.1), V(-.95, 1.5, -.1), .06, wood([.62, .5, .36]), 7); bough(p, [V(-.95, 1.25, -.1), V(-.95, 1.55, -.05), V(-.85, 1.7, 0)], 26, .18, .14, r, 0);
    for (let i = 0; i < 5; i++) { const a = i * 1.25, m = cloth(DYES[i]); p.g.add(strip([V(-.95 + Math.cos(a) * .065, 1.3, -.1 + Math.sin(a) * .065), V(-.95 + Math.cos(a) * .15, .9, -.1 + Math.sin(a) * .15), V(-.95 + Math.cos(a) * .2, .55, -.1 + Math.sin(a) * .2)], .045, m, i)); }
    if (o.cup) p.g.add(PROPS.mether().g.translateX(.3)); return p; },
  // the mether: a square cup of ash 0.14 m high, round at the foot and square at the lip, four handles
  mether: () => { const p = new Parts(), ash = wood([.82, .7, .5]); const g = new THREE.CylinderGeometry(.06, .045, .14, 4, 1, true); g.rotateY(Math.PI / 4); g.translate(0, .07, 0); const in2 = ash.clone(); in2.side = THREE.DoubleSide; p.add(g, in2);
    p.add(new THREE.CylinderGeometry(.047, .047, .012, 12), ash, V(0, .006, 0)); for (let i = 0; i < 4; i++) { const a = i * Math.PI / 2, h = new THREE.TorusGeometry(.025, .007, 4, 8, Math.PI); h.rotateZ(-Math.PI / 2); h.rotateY(-a); p.add(h, ash, V(Math.cos(a) * .055, .07, -Math.sin(a) * .055)); }
    const ale = p.add(new THREE.PlaneGeometry(.08, .08), plain([.5, .32, .12], { rough: .2 }), V(0, .12, 0), [-Math.PI / 2, 0, Math.PI / 4]); return p; },
  // the sky lantern: a willow hoop 0.36 m across, two crossed wires holding the fuel cake (tallow and moss, 6 cm), an envelope of oiled
  // paper 0.62 m high from the hoop up to a dome 0.5 m across; lit, the paper glows from inside (emissive) and the cake burns; folded,
  // flat on a table
  skyLantern: (o = {}) => { const p = new Parts(), lit = o.lit !== false, H = .62, dye = o.dye || [.96, .9, .74];
    if (o.folded) { p.box(.5, .02, .36, plain(dye, { rough: .9 }), V(0, .01, 0)); return p; }
    const prof = [[.18, 0], [.22, .12], [.25, .3], [.25, .45], [.22, .56], [.13, .61], [0, H]].map(([a, b]) => new THREE.Vector2(a, b));
    const glowC = o.glow || [1, .62, .26];
    const paper = new THREE.MeshStandardMaterial({ color: C(...dye), roughness: .95, side: THREE.DoubleSide, emissive: lit ? C(...glowC) : C(0, 0, 0), emissiveIntensity: lit ? (o.k ?? 1.6) : 0, transparent: false });
    // paper: brighter low (near the flame), the ribs of the envelope as darker seams painted in the vertex colours
    const g = new THREE.LatheGeometry(prof, 12); const col = []; const pa = g.attributes.position; for (let i = 0; i < pa.count; i++) { const y = pa.getY(i), seam = (i % 13 === 0) ? .55 : 1, k = (1.15 - y / H * .6) * seam; col.push(k, k, k); }
    g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3)); paper.vertexColors = true; const env = p.add(g, paper); env.castShadow = false;
    const wil = plain([.42, .32, .2]); const hoop = new THREE.TorusGeometry(.18, .006, 4, 20); hoop.rotateX(Math.PI / 2); p.add(hoop, wil);
    p.g.add(tube([V(-.18, 0, 0), V(0, -.005, 0), V(.18, 0, 0)], .0025, wil, 2, 3)); p.g.add(tube([V(0, 0, -.18), V(0, -.005, 0), V(0, 0, .18)], .0025, wil, 2, 3));
    if (lit) { const flame = new THREE.Mesh(new THREE.SphereGeometry(.03, 8, 6), new THREE.MeshBasicMaterial({ color: C(1, .78, .35) })); flame.scale.y = 1.6; flame.position.y = .03; p.g.add(flame); }
    p.add(new THREE.CylinderGeometry(.03, .03, .02, 8), plain([.35, .3, .2]), V(0, -.01, 0)); return p; },
  // the sill lantern: a horn-paned lantern of tin 0.24 m, a candle in it, for a window sill or a doorstep
  sillLantern: (o = {}) => { const p = new Parts(), tin = plain([.4, .38, .34], { metal: .6, rough: .5 });
    p.box(.13, .015, .13, tin, V(0, .008, 0)); p.box(.13, .015, .13, tin, V(0, .2, 0)); p.add(new THREE.ConeGeometry(.08, .06, 4), tin, V(0, .238, 0), [0, Math.PI / 4, 0]);
    const horn = new THREE.MeshStandardMaterial({ color: C(1, .86, .6), emissive: C(1, .6, .24), emissiveIntensity: o.lit === false ? 0 : 1.4, roughness: .9 }); p.box(.115, .18, .115, horn, V(0, .105, 0));
    const ring = new THREE.TorusGeometry(.025, .004, 4, 10); p.add(ring, tin, V(0, .28, 0)); return p; },
};
export function build(key, ...a) { const p = PROPS[key](...a); return { g: p.g, tris: tris(p.g) }; }

// ——— the skeleton's helpers (kids.js's, the musicians' two-bone arm; the person facing +z)
const wp = b => new THREE.Vector3().setFromMatrixPosition(b.matrixWorld);
const wq = b => b.getWorldQuaternion(new THREE.Quaternion());
function setWorldQ(b, q) { b.quaternion.copy(wq(b.parent).invert().multiply(q)); b.updateMatrixWorld(true); }
function aim(b, from, to) { setWorldQ(b, new THREE.Quaternion().setFromUnitVectors(from.clone().normalize(), to.clone().normalize()).multiply(wq(b))); }
export function frame(o, y, z) { const Yy = y.clone().normalize(), Z = z.clone().addScaledVector(Yy, -z.dot(Yy)).normalize(), Xx = Yy.clone().cross(Z); return new THREE.Matrix4().makeBasis(Xx, Yy, Z).setPosition(o); }
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
function hand(P, s, T, F, N, pole, k = .85, kt = .6) { let miss = 0; for (let i = 0; i < 3; i++) { miss = reach(P, s, T, pole); orient(P, s, F, N); } curl(P, s, k, kt); return miss; }
function palm(P, s) { const h = handNow(P, s); return h.w.clone().addScaledVector(h.f, h.len * .58).addScaledVector(h.n, .022); }
function rotW(P, name, axis, a) { const b = P.byName[name]; if (!b) return; P.root.updateMatrixWorld(true); setWorldQ(b, new THREE.Quaternion().setFromAxisAngle(axis, a).multiply(wq(b))); P.root.updateMatrixWorld(true); }
const sideX = P => Math.sign(wp(P.byName['upperarm01.R']).x - wp(P.byName['upperarm01.L']).x);

// ——— the poses: each turns one person (unturned, at the origin, facing +z) and hangs what it holds on the root; returns the tris
// of what it holds and how far each hand fell short of its mark (0 when it reached)
//   stand: as built; look: the head up to the sky (the lanterns rising); hold: a sky lantern held lit before the chest, both hands
//   under its hoop; release: both arms up, the lantern 0.25 m above the open hands; tie: the right hand to the pole's knots at 1.6 m,
//   0.32 m before the chest (the pole stands there); cup: the mether held out over the water in both hands; lead: a horse's lead rope in
//   the right hand, the arm down and forward
export function pose(P, kind, o = {}) { const root = P.root; root.position.x = root.position.z = 0; root.rotation.set(0, 0, 0); root.updateMatrixWorld(true);
  const Bn = P.byName, r = sideX(P), out = { holds: [], tris: 0, miss: {} }, shR = () => wp(Bn['upperarm01.R']), shL = () => wp(Bn['upperarm01.L']), hang = [];
  const chest = () => shR().lerp(shL(), .5);
  if (kind === 'look' || kind === 'release') { rotW(P, 'neck01', X, -.35); rotW(P, 'head', X, -.3); }
  if (kind === 'hold') { rotW(P, 'head', X, .18); const c = chest().add(V(0, -.12, .34));
    for (const s of ['R', 'L']) out.miss[s] = hand(P, s, c.clone().add(V((s === 'R' ? r : -r) * .12, 0, 0)), V(0, .2, 1).normalize(), V(0, 1, 0), V(s === 'R' ? r : -r, -1, -.2), .35, .2);
    const m = palm(P, 'R').lerp(palm(P, 'L'), .5).add(V(0, .03, 0)); hang.push(['skyLantern', new THREE.Matrix4().setPosition(m), [{ lit: true, k: o.k ?? 1.6, dye: o.dye }]]); }
  if (kind === 'release') { const c = chest().add(V(0, .48, .2));
    for (const s of ['R', 'L']) out.miss[s] = hand(P, s, c.clone().add(V((s === 'R' ? r : -r) * .16, 0, 0)), V(0, 1, .2).normalize(), V(0, 1, 0).applyAxisAngle(X, .3), V(s === 'R' ? r : -r, 0, -1), .1, 0);
    const m = palm(P, 'R').lerp(palm(P, 'L'), .5).add(V(0, .25 + (o.lift ?? 0), .05)); hang.push(['skyLantern', new THREE.Matrix4().setPosition(m), [{ lit: true, k: o.k ?? 1.6, dye: o.dye }]]); }
  if (kind === 'tie') { rotW(P, 'head', X, .1); const k = V(0, 1.6 * (o.h ?? 1), .32);
    out.miss.R = hand(P, 'R', k.clone().add(V(r * .05, 0, -.06)), V(-r, 0, .3).normalize(), V(0, 0, 1), V(r, -1, -.2), .6, .4);
    out.miss.L = hand(P, 'L', k.clone().add(V(-r * .06, -.05, -.04)), V(r, 0, .3).normalize(), V(0, 0, 1), V(-r, -1, -.2), .6, .4); }
  if (kind === 'cup') { rotW(P, 'spine03', X, .12); rotW(P, 'head', X, .3); const c = chest().add(V(0, -.18, .42));
    for (const s of ['R', 'L']) out.miss[s] = hand(P, s, c.clone().add(V((s === 'R' ? r : -r) * .07, 0, 0)), V(0, .3, 1).normalize(), V(-(s === 'R' ? r : -r), 0, 0), V(s === 'R' ? r : -r, -1, 0), .7, .4);
    hang.push(['mether', new THREE.Matrix4().setPosition(palm(P, 'R').lerp(palm(P, 'L'), .5).add(V(0, -.02, 0))), []]); }
  if (kind === 'lead') { out.miss.R = hand(P, 'R', shR().add(V(r * .06, -.42, .26)), V(0, -.3, 1).normalize(), V(-r, 0, 0), V(r, 0, -1), .9, .7); out.lead = palm(P, 'R'); }
  root.updateMatrixWorld(true); const inv = root.matrixWorld.clone().invert();
  for (const [key, M, a] of hang) { const t = build(key, ...a); t.g.matrixAutoUpdate = false; t.g.matrix.copy(inv.clone().multiply(M)); root.add(t.g); out.tris += t.tris; out.holds.push(key); }
  return out; }
