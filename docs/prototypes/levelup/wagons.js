// Wagons and carts by island (the concept artist, 2 Nov 2026; backlog L3, "Beasts of burden and wagons": "owed: the wagons and carts
// (props: the look builder's)"; OG-046's vehicles: the covered wagon, the merchant wagon, the stagecoach, the royal carriage, the
// supply cart; OG-058's one horse an island and the ox for the Mark; OG-118's ox cart). A metre a unit. Every vehicle is built in
// its own frame: z forward (towards its team), x across, y up, the ground at y 0, the rear axle at z 0; its team stands ahead of it
// on +z, from creatures.js (the Session 867 draught horse and yoked ox's kin), with shafts, a pole, traces, a yoke and reins laid
// between them from the beasts' own measured hides, so a builder can lift a vehicle and its hitch together.
//
// The running gear is shared: a spoked wheel (hub, spokes, felloe, iron tyre), a disc wheel of three planks, an axle, a bed of
// boards with stakes, shafts for one beast, a pole for two, runners for snow. The bodies are each island's:
//   the Gatelands: the carter's cart (two wheels of 1.4 m, a sided bed, one draught horse in shafts), the covered wagon (a canvas
//     tilt on five hoops over a bed of 3.6 m, two horses), the Crown's coach (a crimson body slung on braces, the box seat, the roof
//     rail and its trunks, two horses);
//   the Mark: the ox cart (disc wheels of 1.1 m, a staked bed of logs, a pair of oxen under one yoke), the carved wagon (after the
//     Oseberg cart: a trough body on two cradles whose ends are beasts' heads, a carved band down its sides, two Markish horses),
//     the light cart (after the stolkjerre: a box seat for two over two high wheels, a fjord horse in shafts);
//   Aurenne: the painted cart (after the carretto: high yellow wheels, painted panels, amphorae, a donkey), the merchant wagon (a
//     striped awning on four posts over crates and bales, two mules on a pole), the covered carriage (after the carpentum: an
//     arched blue hood over a white body, two mules), and a pack camel beside them for the caravan roads.
//
// What the question decides is how far the islands differ (VH_MODES):
//   'one'  (A) one kit everywhere: the Gatelands' cart, wagon and coach on every island, painted in the island's colours and drawn
//              by horses in the island's coat;
//   'own'  (B) each island its own three on the shared running gear, with its own beasts (horses; oxen and a fjord horse;
//              a donkey and mules, and the camel);
//   'snow' (C) B, and while snow lies the Mark's ox cart and light cart stand on runners in place of wheels (the carved wagon
//              stays on its wheels, as a feast-day piece); nothing changes on the other two islands.
// vehicle(key, { island, pal, runners, key }) -> { group, tris, draws, beasts [creature], len, width, height, stand { x, z, ry },
//   team, wheels [{ x, y, z, r }], parts }. ROADS[island][mode] -> the three keys. Everything that varies comes from a stream keyed by
//   the vehicle's key ('wagons:<key>'), never Math.random.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { worldUV, TEX } from './common.js';
import { genome, build, pose, PLANS, hashKey, rng } from './creatures.js';

export const VH_MODES = { one: 'A, one kit painted by island', own: 'B, each island its own three', snow: 'C, B and the Mark on runners in snow' };
export const VEH = {
  glCart: { island: 'gatelands', name: "the carter's cart" }, glWagon: { island: 'gatelands', name: 'the covered wagon' }, glCoach: { island: 'gatelands', name: "the Crown's coach" },
  mkCart: { island: 'mark', name: 'the ox cart' }, mkWagon: { island: 'mark', name: 'the carved wagon' }, mkKjerre: { island: 'mark', name: 'the light cart' },
  auCart: { island: 'aurenne', name: 'the painted cart' }, auWagon: { island: 'aurenne', name: 'the merchant wagon' }, auCarriage: { island: 'aurenne', name: 'the covered carriage' }
};
export const ROADS = {
  gatelands: { one: ['glCart', 'glWagon', 'glCoach'], own: ['glCart', 'glWagon', 'glCoach'], snow: ['glCart', 'glWagon', 'glCoach'] },
  mark: { one: ['glCart', 'glWagon', 'glCoach'], own: ['mkCart', 'mkWagon', 'mkKjerre'], snow: ['mkCart', 'mkWagon', 'mkKjerre'] },
  aurenne: { one: ['glCart', 'glWagon', 'glCoach'], own: ['auCart', 'auWagon', 'auCarriage'], snow: ['auCart', 'auWagon', 'auCarriage'] }
};
// the islands' paint: body, wheel, trim, cloth, the beasts' kind (A's horses take the island's coat)
const C3 = (r, g, b) => new THREE.Color().setRGB(r, g, b, THREE.SRGBColorSpace);
export const PAL = {
  gatelands: { body: C3(.27, .39, .47), wheel: C3(.6, .2, .1), trim: C3(.85, .72, .3), cloth: C3(.83, .79, .68), coach: C3(.46, .07, .08), panel: C3(.08, .07, .07) },
  mark: { body: C3(.2, .15, .11), wheel: C3(.48, .16, .09), trim: C3(.55, .2, .1), cloth: C3(.58, .5, .4), coach: C3(.2, .15, .11), panel: C3(.48, .16, .09) },
  aurenne: { body: C3(.86, .84, .78), wheel: C3(.85, .62, .16), trim: C3(.13, .3, .6), cloth: C3(.18, .36, .66), coach: C3(.13, .3, .6), panel: C3(.86, .84, .78) }
};

// ── materials, made once per colour ──
const MATS = new Map();
function canvasTex(key, w, h, draw, rep = [1, 1]) { const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h); const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(...rep); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t; }
// the Mark's carved band: two strands of interlace in a border, cut a finger deep (the map is the relief's shade, the bump its depth)
let KNOT; function knotTex() { if (KNOT) return KNOT; const draw = (x, w, h) => { x.fillStyle = '#6c6c6c'; x.fillRect(0, 0, w, h); x.lineCap = 'round';
    for (const [ph, wd, col] of [[0, 22, '#161616'], [0, 13, '#e8e8e8'], [Math.PI, 22, '#161616'], [Math.PI, 13, '#e8e8e8']]) { x.strokeStyle = col; x.lineWidth = wd; x.beginPath(); for (let i = 0; i <= w; i += 4) { const y = h / 2 + Math.sin(i / w * Math.PI * 4 + ph) * h * .3; i ? x.lineTo(i, y) : x.moveTo(i, y); } x.stroke(); }
    x.fillStyle = '#e8e8e8'; x.fillRect(0, 0, w, 7); x.fillRect(0, h - 7, w, 7); };
  KNOT = { map: canvasTex('knot', 512, 128, draw), bump: canvasTex('knotb', 512, 128, draw) }; KNOT.bump.colorSpace = THREE.NoColorSpace; return KNOT; }
// Aurenne's painted panels: a blue ground, white borders, an ochre lozenge and a red flower in each
let PANEL; function panelTex() { if (PANEL) return PANEL; PANEL = canvasTex('panel', 512, 256, (x, w, h) => { x.fillStyle = '#e9e2cf'; x.fillRect(0, 0, w, h);
    for (let i = 0; i < 2; i++) { const x0 = 14 + i * w / 2, pw = w / 2 - 28; x.fillStyle = '#2b4f8f'; x.fillRect(x0, 18, pw, h - 36); x.strokeStyle = '#d9a43a'; x.lineWidth = 6; x.strokeRect(x0 + 10, 28, pw - 20, h - 56);
      const cx = x0 + pw / 2, cy = h / 2; x.fillStyle = '#d9a43a'; x.beginPath(); x.moveTo(cx, cy - 70); x.lineTo(cx + 70, cy); x.lineTo(cx, cy + 70); x.lineTo(cx - 70, cy); x.fill();
      x.fillStyle = '#b8352a'; for (let k = 0; k < 6; k++) { x.beginPath(); x.arc(cx + Math.cos(k) * 22, cy + Math.sin(k * 1.04) * 22, 14, 0, 7); x.fill(); } x.fillStyle = '#f2e6c4'; x.beginPath(); x.arc(cx, cy, 10, 0, 7); x.fill(); } }); return PANEL; }
// striped cloth for an awning: blue and white, or the island's cloth plain
let STRIPE; function stripeTex() { if (STRIPE) return STRIPE; STRIPE = canvasTex('stripe', 256, 64, (x, w, h) => { for (let i = 0; i < 8; i++) { x.fillStyle = i % 2 ? '#ece6d6' : '#2a5296'; x.fillRect(i * w / 8, 0, w / 8, h); } }); return STRIPE; }
function M_(kind, color) { const k = kind + ':' + color.getHexString(); if (MATS.has(k)) return MATS.get(k); let m;
  const ns = v => new THREE.Vector2(v, v);
  if (kind === 'paint') m = new THREE.MeshStandardMaterial({ color, roughness: .55, normalMap: TEX.wood.normalMap, normalScale: ns(.45) });
  else if (kind === 'wood') m = new THREE.MeshStandardMaterial({ color, map: TEX.wood.map, roughness: .85, normalMap: TEX.wood.normalMap, normalScale: ns(.9) });
  else if (kind === 'iron') m = new THREE.MeshStandardMaterial({ color, roughness: .5, metalness: .65 });
  else if (kind === 'brass') m = new THREE.MeshStandardMaterial({ color, roughness: .3, metalness: .85 });
  else if (kind === 'cloth') m = new THREE.MeshStandardMaterial({ color, roughness: .95, normalMap: TEX.plaster.normalMap, normalScale: ns(.6), side: THREE.DoubleSide });
  else if (kind === 'stripe') m = new THREE.MeshStandardMaterial({ color, map: stripeTex(), roughness: .9, side: THREE.DoubleSide });
  else if (kind === 'leather') m = new THREE.MeshStandardMaterial({ color, roughness: .6 });
  else if (kind === 'glass') m = new THREE.MeshStandardMaterial({ color, roughness: .08, metalness: .3 });
  else if (kind === 'carved') { const K = knotTex(); m = new THREE.MeshStandardMaterial({ color, map: K.map, bumpMap: K.bump, bumpScale: 3, roughness: .8 }); }
  else if (kind === 'panel') m = new THREE.MeshStandardMaterial({ color, map: panelTex(), roughness: .55 });
  else if (kind === 'clay') m = new THREE.MeshStandardMaterial({ color, roughness: .8, normalMap: TEX.plaster.normalMap, normalScale: ns(.5) });
  else if (kind === 'bark') m = new THREE.MeshStandardMaterial({ color, map: TEX.beam.map, normalMap: TEX.beam.normalMap, normalScale: ns(1.6), roughness: .95 });
  else if (kind === 'sack') m = new THREE.MeshStandardMaterial({ color, roughness: 1, normalMap: TEX.thatch.normalMap, normalScale: ns(.4) });
  MATS.set(k, m); return m; }
const WHITE = C3(1, 1, 1);

// ── the parts bin: geometry by material, merged at the end ──
const V3 = (x, y, z) => new THREE.Vector3(x, y, z), UP = V3(0, 1, 0);
function Kit() { const B = new Map(), mats = new Map();
  const K = {
    put(m, g, mx) { let x = g.index ? g.toNonIndexed() : g; for (const a of Object.keys(x.attributes)) if (!['position', 'normal', 'uv'].includes(a)) x.deleteAttribute(a); if (!x.attributes.normal) x.computeVertexNormals(); if (!x.attributes.uv) worldUV(x, 1); if (mx) x.applyMatrix4(mx); const k = m.uuid; mats.set(k, m); (B.get(k) || B.set(k, []).get(k)).push(x); return x; },
    box(m, w, h, d, x, y, z, rx = 0, ry = 0, rz = 0, uv = 1) { const g = worldUV(new THREE.BoxGeometry(w, h, d).toNonIndexed(), uv); return K.put(m, g, new THREE.Matrix4().compose(V3(x, y, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(rx, ry, rz)), V3(1, 1, 1))); },
    // a beam of w by h from a to b (its h kept as near up as the run allows)
    beam(m, a, b, w, h = w) { const d = b.clone().sub(a), L = d.length(); if (L < 1e-4) return; const g = worldUV(new THREE.BoxGeometry(w, h, L).toNonIndexed(), 1), f = d.normalize(), side = new THREE.Vector3().crossVectors(UP, f); if (side.lengthSq() < 1e-6) side.set(1, 0, 0); side.normalize(); const up = new THREE.Vector3().crossVectors(f, side);
      const mx = new THREE.Matrix4().makeBasis(side, up, f).setPosition(a.clone().add(b).multiplyScalar(.5)); return K.put(m, g, mx); },
    rod(m, a, b, r, seg = 8) { const d = b.clone().sub(a), L = d.length(); if (L < 1e-4) return; const g = new THREE.CylinderGeometry(r, r, L, seg, 1); return K.put(m, g, new THREE.Matrix4().compose(a.clone().add(b).multiplyScalar(.5), new THREE.Quaternion().setFromUnitVectors(UP, d.normalize()), V3(1, 1, 1))); },
    path(m, pts, w, h) { for (let i = 0; i + 1 < pts.length; i++) K.beam(m, pts[i], pts[i + 1], w, h); },
    bake(group) { let tris = 0, draws = 0; for (const [k, gs] of B) { const g = mergeGeometries(gs, false), me = new THREE.Mesh(g, mats.get(k)); me.castShadow = me.receiveShadow = true; group.add(me); tris += g.attributes.position.count / 3; draws++; } return { tris: Math.round(tris), draws }; }
  }; return K; }

// ── the running gear ──
// a spoked wheel, its axis along x, centred at (x, y, z): an iron tyre, the felloe, n spokes, the hub with its iron bands
function spoked(K, P, { r, x, y = r, z, n = 12, w = .075, hubR = .11, hubL = .3, paint = P.wheel, dish = 0 }) {
  const wood = M_('paint', paint), iron = M_('iron', C3(.12, .12, .13)), rot = new THREE.Matrix4().makeRotationY(Math.PI / 2), at = new THREE.Matrix4().makeTranslation(x, y, z);
  const ring = (R, t, wd, m) => { const g = new THREE.TorusGeometry(R, t, 6, 56); g.scale(1, 1, wd / (2 * t)); g.applyMatrix4(rot); g.applyMatrix4(at); K.put(m, g); };
  ring(r - .016, .018, w + .01, iron); ring(r - .065, .045, w, wood);
  for (let i = 0; i < n; i++) { const a = i / n * Math.PI * 2, L = r - .1 - hubR * .9, g = new THREE.BoxGeometry(.034, L, .052); g.translate(0, hubR * .9 + L / 2, 0); g.rotateX(a); g.translate(Math.sign(x) * dish, 0, 0); g.applyMatrix4(at); K.put(wood, worldUV(g.toNonIndexed(), 1)); }
  const h = new THREE.CylinderGeometry(hubR * .72, hubR, hubL, 14); h.rotateZ(Math.sign(x || 1) * Math.PI / 2); h.applyMatrix4(at); K.put(wood, h);
  for (const s of [-.4, .4]) { const b = new THREE.TorusGeometry(hubR * (.86 - s * .14), .012, 5, 20); b.applyMatrix4(rot); b.translate(x + s * hubL * Math.sign(x || 1), y, z); K.put(iron, b); }
  return { x, y, z, r }; }
// a disc wheel of three planks held by two battens, its axis along x
function disc(K, P, { r, x, y = r, z, w = .09, paint = P.body }) { const wood = M_('wood', paint), iron = M_('iron', C3(.12, .12, .13)), s = Math.sign(x || 1);
  const g = new THREE.CylinderGeometry(r, r, w, 30); g.rotateZ(Math.PI / 2); g.translate(x, y, z); K.put(wood, g);
  for (const dz of [-.33, .33]) K.box(wood, .05, 1.75 * r * Math.sqrt(1 - dz * dz), .1, x + s * (w / 2 + .02), y, z + dz * r);
  for (const dy of [-.33, .33]) K.box(M_('wood', C3(.1, .08, .06)), .02, .012, 2 * r * Math.sqrt(1 - dy * dy) * .98, x + s * (w / 2 + .002), y + dy * r, z);
  const h = new THREE.CylinderGeometry(.09, .13, .28, 12); h.rotateZ(s * Math.PI / 2); h.translate(x + s * .1, y, z); K.put(wood, h);
  const t = new THREE.TorusGeometry(r - .012, .016, 6, 48); t.scale(1, 1, (w + .01) / .032); t.rotateY(Math.PI / 2); t.translate(x, y, z); K.put(iron, t); return { x, y, z, r }; }
// runners for snow: a pair of shod beams turned up at the front, `len` long, their tops at y 0.16, under (x ±hw) from z0 to z0 + len
function runners(K, P, { hw, z0, len, h = .16, paint = P.body, posts = [] }) { const wood = M_('wood', paint), iron = M_('iron', C3(.14, .14, .15));
  for (const s of [-1, 1]) { const pts = []; for (let i = 0; i <= 10; i++) { const t = i / 10, z = z0 + len * t, up = t > .78 ? (t - .78) / .22 : 0; pts.push(V3(s * hw, h / 2 + up * up * .55, z - up * up * .12)); }
    K.path(wood, pts, .09, h); K.path(iron, pts.map(p => p.clone().add(V3(0, -h / 2 - .006, 0))), .07, .012);
    for (const [pz, top] of posts) K.box(wood, .07, top - h, .07, s * hw, h + (top - h) / 2, pz); } }
// a bed of boards: the floor at y, l long and w wide, centred at z; sides h high of `boards` boards with stakes between them
function bed(K, P, { w, l, y, z = 0, h = .45, boards = 2, stakes = 3, paint = P.body, stake = P.body, tail = true, front = true, rails = true }) {
  const m = M_('paint', paint), st = M_('paint', stake), wood = M_('wood', C3(.5, .42, .32));
  K.box(wood, w, .055, l, 0, y, z); for (const s of [-1, 1]) K.box(M_('wood', C3(.32, .25, .18)), .12, .14, l + .1, s * (w / 2 - .12), y - .1, z);
  const bh = h / boards * .82;
  for (const s of [-1, 1]) { for (let b = 0; b < boards; b++) K.box(m, .035, bh, l, s * w / 2, y + .03 + bh / 2 + b * h / boards, z); if (rails) K.box(st, .06, .05, l + .04, s * w / 2, y + h + .02, z);
    for (let i = 0; i < stakes; i++) { const sz = z - l / 2 + .06 + (l - .12) * i / Math.max(1, stakes - 1); K.box(st, .06, h + .12, .06, s * (w / 2 + .02), y + h / 2 - .02, sz); } }
  for (const [e, on] of [[-1, tail], [1, front]]) if (on) for (let b = 0; b < boards; b++) K.box(m, w, bh, .035, 0, y + .03 + bh / 2 + b * h / boards, z + e * l / 2); }

// ── the beasts: built, stood, measured; their hides give the hitch its points ──
const TONES = { blanket: [.46, .36, .22], pack: [.5, .42, .3], leather: [.3, .19, .1], roll: [.36, .32, .24], brass: [.72, .56, .26], wood: [.42, .3, .18] };
for (const [k, base, parts] of [['wgMule', 'mule', [['harness', { kind: 'collar', at: .28, fit: 1.4 }]]], ['wgDonkey', 'donkey', [['harness', { kind: 'collar', at: .3, fit: 1.4 }]]], ['wgFjord', 'horse', [['harness', { kind: 'collar', at: .28, fit: 1.4 }]]], ['wgCamel', 'camel', [['packs', { at: .5, len: .75, h: .62 }]]]])
  if (!PLANS[k]) PLANS[k] = { ...PLANS[base], name: PLANS[base].name + ' (in harness)', palette: { ...PLANS[base].palette, ...TONES }, parts: [...PLANS[base].parts, ...parts] };
const HIDE = new Map();
function hideOf(C) { const k = C.g.plan + '|' + C.g.seed; if (HIDE.has(k)) return HIDE.get(k); C.root.updateMatrixWorld(true); const pts = [], v = new THREE.Vector3();
  C.root.traverse(m => { if (!m.isSkinnedMesh || m.material?.transparent) return; const n = m.geometry.attributes.position.count, st = Math.max(1, Math.floor(n / 6000)); for (let i = 0; i < n; i += st) { m.getVertexPosition(i, v); v.applyMatrix4(m.matrixWorld); pts.push(v.x, v.y, v.z); } });
  const H = { top(z, dz = .1) { let y = 0; for (let i = 0; i < pts.length; i += 3) if (Math.abs(pts[i + 2] - z) < dz && Math.abs(pts[i]) < .2) y = Math.max(y, pts[i + 1]); return y; },
    half(z, y, dz = .1) { let x = 0; for (let i = 0; i < pts.length; i += 3) if (Math.abs(pts[i + 2] - z) < dz && Math.abs(pts[i + 1] - y) < .12) x = Math.max(x, Math.abs(pts[i])); return x; },
    rump: 0, nose: 0 };
  for (let i = 2; i < pts.length; i += 3) { H.rump = Math.min(H.rump, pts[i]); H.nose = Math.max(H.nose, pts[i]); } HIDE.set(k, H); return H; }
function beast(plan, key, island) { const C = build(genome(plan, key, { island })); C.gait = 'stand'; pose(C, 0); C.root.updateMatrixWorld(true); C.hide = hideOf(C);
  const col = C.root.getObjectByName('collar'), p = new THREE.Vector3(); C.collar = col ? (col.getWorldPosition(p), p.clone()) : null;
  const hb = C.byName.head; C.head = hb ? hb.getWorldPosition(new THREE.Vector3()) : V3(0, 1.6, C.hide.nose - .4); const nb = C.byName.neck0; C.neck = nb ? nb.getWorldPosition(new THREE.Vector3()) : C.head.clone();
  C.root.traverse(m => { if (m.isMesh) { m.castShadow = true; m.receiveShadow = true; } }); return C; }
const at = (C, v) => v.clone().add(C.root.position);
// one beast in shafts. The shafts run from the bed's front corners (±sw, y0 at zF) forward past the collar; a saddle on the back
// carries them by its tugs; traces from the hames back to the shafts; reins from the bit to the driver's seat
function inShafts(K, P, C, { zF, y0, sw, seat, paint = P.body, gap = .45 }) { const H = C.hide, zr = zF + gap - H.rump; C.root.position.set(0, 0, zr);
  const lea = M_('leather', C3(.13, .08, .05)), wood = M_('paint', paint), brass = M_('brass', C3(.72, .56, .26));
  const zs = .1, back = H.top(zs), flank = H.half(zs, back - .45) + .07, yT = back - .42, col = C.collar ? at(C, C.collar) : V3(0, back + .1, zr + H.nose * .45), zEnd = col.z + .35;
  for (const s of [-1, 1]) { const a = V3(s * sw, y0, zF - .5), b = V3(s * (sw + flank) / 2, (y0 + yT) / 2, zF + .4), c = V3(s * flank, yT, zr + zs), d = V3(s * flank * .95, yT + .06, zEnd);
    K.path(wood, [a, b, c, d], .065, .075);
    K.beam(lea, V3(s * flank * .92, col.y - .12, col.z), V3(s * flank, yT + .02, zr - H.rump * .55 + .2), .05, .012); // the trace
    K.beam(lea, V3(s * .16, back + .03, zr + zs), V3(s * flank, yT + .05, zr + zs), .06, .012); // the tug strap
    K.beam(lea, V3(s * flank * .9, yT - .05, zr + zs + .05), V3(s * .05, yT - .5, zr + zs + .05), .05, .012); // the girth
    K.box(brass, .03, .06, .06, s * flank, yT + .03, zr + zs); }
  K.box(lea, .34, .07, .4, 0, back + .03, zr + zs, 0, 0, 0); K.box(lea, .46, .05, .3, 0, back - .01, zr + zs);
  if (seat) reins(K, C, seat); return { zr, zEnd }; }
// two beasts on a pole: the pole from the front axle's bolster to a neck bar between the collars; the traces back to a bar
function onPole(K, P, A, B2, { zF, y0, sx = .52, seat, paint = P.body, gap = .55, yoke = false }) { const H = A.hide, zr = zF + gap - H.rump; A.root.position.set(-sx, 0, zr); B2.root.position.set(sx, 0, zr);
  const lea = M_('leather', C3(.13, .08, .05)), wood = M_('paint', paint), iron = M_('iron', C3(.12, .12, .13));
  if (yoke) { // the oxen's one yoke over both necks, the bows under them; the pole up to its middle
    const nz = zr + A.neck.z + .12, top = A.hide.top(A.neck.z + .12, .14), y = top + .07, hw = sx + .45; K.beam(M_('wood', C3(.42, .3, .18)), V3(-hw, y, nz), V3(hw, y, nz), .14, .16);
    for (const s of [-1, 1]) { const nh = A.hide.half(A.neck.z + .12, top - .3, .14) + .03, g = new THREE.TorusGeometry(1, .03, 6, 20, Math.PI); g.rotateZ(Math.PI); g.scale(nh, .42, 1); g.translate(s * sx, y - .02, nz); K.put(M_('wood', C3(.42, .3, .18)), g); }
    K.path(wood, [V3(0, y0, zF - .6), V3(0, y0 + .1, zF + .6), V3(0, y - .1, nz + .1)], .11, .11); K.box(iron, .06, .3, .06, 0, y - .1, nz);
    if (seat) [A, B2].forEach(C => reins(K, C, seat)); return { zr, zEnd: nz }; }
  const ca = at(A, A.collar), cb = at(B2, B2.collar), tip = V3(0, (ca.y + cb.y) / 2 - .35, ca.z + .45);
  K.path(wood, [V3(0, y0, zF - .5), V3(0, y0 + .08, zF + .5), tip], .085, .095); K.beam(wood, V3(-sx * .8, tip.y + .02, tip.z - .2), V3(sx * .8, tip.y + .02, tip.z - .2), .06, .06);
  for (const [C, c] of [[A, ca], [B2, cb]]) { const cx = C.root.position.x; K.beam(lea, V3(cx * .55, c.y - .2, c.z - .05), V3(0, tip.y + .02, tip.z - .2), .04, .02); // pole strap
    const back = C.hide.top(.1), fl = C.hide.half(.1, back - .45) + .05, yT = back - .42, bz = zr - H.rump - .25;
    K.beam(wood, V3(cx - fl, yT - .1, bz), V3(cx + fl, yT - .1, bz), .06, .06); // the swingle bar
    for (const s of [-1, 1]) { K.beam(lea, V3(cx + s * fl * .92, c.y - .12, c.z), V3(cx + s * fl, yT - .1, bz), .05, .012); K.beam(lea, V3(cx + s * fl, yT + .05, zr + .1), V3(cx + s * .16, back + .02, zr + .1), .06, .012); }
    K.box(lea, .34, .07, .4, cx, back + .03, zr + .1); K.beam(lea, V3(cx, yT - .1, bz + .02), V3(0, y0 + .02, zF + .15), .05, .03); }
  if (seat) [A, B2].forEach(C => reins(K, C, seat)); return { zr, zEnd: tip.z }; }
function reins(K, C, seat) { const lea = M_('leather', C3(.1, .06, .04)), h = at(C, C.head), bit = h.clone().add(V3(0, -.12, .28)); for (const s of [-1, 1]) { const a = bit.clone().add(V3(s * .09, 0, 0)), mid = V3((a.x + seat.x) / 2 + s * .05, Math.max(a.y, seat.y) - .2, (a.z + seat.z) / 2); K.path(lea, [a, mid, seat.clone().add(V3(s * .12, 0, 0))], .022, .006); } }

// ── loads ──
function sacks(K, r, n, w, l, y, z, col) { const m = M_('sack', col); for (let i = 0; i < n; i++) { const g = new THREE.SphereGeometry(.24, 12, 8); g.scale(1, .62 + r() * .1, 1.5); g.rotateY(r() * .6 - .3); g.translate((r() - .5) * (w - .5), y + .14 + (i > n / 2 ? .22 : 0), z + (r() - .5) * (l - .6)); K.put(m, g); } }
function amphora(K, x, y, z, s = 1, lean = 0, col = C3(.66, .38, .22)) { const pts = [[0, 0], [.04, .02], [.07, .12], [.16, .32], [.19, .46], [.16, .6], [.07, .7], [.055, .82], [.07, .86], [0, .87]].map(([a, b]) => new THREE.Vector2(a * s, b * s)); const g = new THREE.LatheGeometry(pts, 14); g.rotateX(lean); g.translate(x, y, z); K.put(M_('clay', col), g); }
function crate(K, x, y, z, w, h, d, r) { const wood = M_('wood', C3(.58 + r() * .1, .46, .32)); K.box(wood, w, h, d, x, y + h / 2, z); for (const s of [-1, 1]) K.box(M_('wood', C3(.38, .28, .18)), w + .01, .05, d + .01, x, y + h / 2 + s * h * .36, z); }
function bale(K, x, y, z, w, h, d, col) { K.box(M_('sack', col), w, h, d, x, y + h / 2, z); for (const s of [-.3, .3]) K.box(M_('leather', C3(.3, .22, .14)), w + .02, h + .02, .03, x, y + h / 2, z + s * d); }

// ── the vehicles ──
const B = {};
// the Gatelands' carter's cart: two wheels of 1.4 m, a sided bed of 2.0 by 1.3 m at 0.98 m, one draught horse in shafts, sacks
B.glCart = (K, P, o, r) => { const R = .7, w = 1.3, l = 2.0, y = .98, out = { wheels: [] };
  K.box(M_('iron', C3(.12, .12, .13)), w + .55, .08, .08, 0, R, 0); for (const s of [-1, 1]) out.wheels.push(spoked(K, P, { r: R, x: s * (w / 2 + .17), z: 0, n: 12 }));
  bed(K, P, { w, l, y, z: .05, h: .42, stakes: 4, stake: P.wheel }); sacks(K, r, 5, w, l, y, .05, C3(.62, .56, .44));
  const C = beast(o.beast || 'draughthorse', o.key + ':horse', o.island), seat = V3(.25, y + .55, l / 2 - .1);
  inShafts(K, P, C, { zF: l / 2 + .05, y0: y - .1, sw: w / 2 - .12, seat }); out.beasts = [C]; out.len = C.root.position.z + C.hide.nose + l / 2; out.width = w + .7; out.height = 2.4;
  out.stand = { x: 1.0, z: C.root.position.z + C.hide.nose - .1, ry: -Math.PI / 2 - .4 }; out.team = '1 draught horse in shafts'; return out; };
// the Gatelands' covered wagon: a bed of 3.6 by 1.3 m at 1.02 m, rear wheels of 1.3 m and front of 1.0 m, a canvas tilt on five hoops
B.glWagon = (K, P, o, r) => { const w = 1.3, l = 3.6, y = 1.02, zb = 1.25, out = { wheels: [] }, iron = M_('iron', C3(.12, .12, .13));
  for (const [z, R] of [[0, .65], [2.5, .5]]) { K.box(iron, w + .55, .08, .08, 0, R, z); for (const s of [-1, 1]) out.wheels.push(spoked(K, P, { r: R, x: s * (w / 2 + .17), z, n: R > .6 ? 14 : 12 })); K.box(M_('wood', C3(.32, .25, .18)), w + .2, .14, .16, 0, Math.max(R + .1, y - .2), z); }
  K.beam(M_('wood', C3(.32, .25, .18)), V3(0, .62, -.2), V3(0, .55, 2.6), .1, .1);
  bed(K, P, { w, l, y, z: zb, h: .5, stakes: 5, stake: P.wheel });
  const cloth = M_('cloth', P.cloth), hoop = M_('wood', C3(.5, .4, .3)), top = y + .5, rise = 1.15;
  { const g = new THREE.CylinderGeometry(1, 1, l + .3, 28, 6, true, -Math.PI / 2, Math.PI); g.rotateX(Math.PI / 2); g.rotateZ(Math.PI / 2); g.scale(w / 2 + .06, rise, 1); const p = g.attributes.position;
    for (let i = 0; i < p.count; i++) { const zz = p.getZ(i), t = zz / ((l + .3) / 2), sag = Math.abs(Math.sin((t * 2.5 + .5) * Math.PI)) * .025 * Math.min(1, p.getY(i) / rise + .2); p.setY(i, p.getY(i) * (1 + .08 * t * t) - sag); p.setX(i, p.getX(i) * (1 - sag)); } g.computeVertexNormals(); g.translate(0, top, zb); K.put(cloth, g); }
  for (let i = 0; i < 5; i++) { const z = zb - l / 2 + .15 + (l - .3) * i / 4, g = new THREE.TorusGeometry(1, .025, 5, 24, Math.PI); g.scale(w / 2 + .085, rise * (1 + .08 * ((z - zb) / ((l + .3) / 2)) ** 2) + .02, 1); g.rotateY(0); g.translate(0, top, z); K.put(hoop, g); }
  // the tilt's ends drawn in round a puckered mouth, the back closed to a ring of 0.45 m
  for (const e of [-1, 1]) { const z = zb + e * (l / 2 + .15), g = new THREE.RingGeometry(e < 0 ? .42 : .55, 1, 28, 1, 0, Math.PI); g.scale(w / 2 + .06, rise * 1.08, 1); g.translate(0, top, z); K.put(cloth, g); }
  sacks(K, r, 4, w, 1.2, y, zb - l / 2 + .7, C3(.6, .55, .42));
  const A = beast('draughthorse', o.key + ':near', o.island), Bh = beast('draughthorse', o.key + ':off', o.island), seat = V3(-.2, y + .62, zb + l / 2 - .2);
  K.box(M_('paint', P.body), w - .1, .06, .36, 0, y + .5, zb + l / 2 - .25); // the driver's board
  onPole(K, P, A, Bh, { zF: 2.75, y0: .58, seat, paint: P.wheel }); out.beasts = [A, Bh]; out.len = A.root.position.z + A.hide.nose + (zb - (zb - l / 2)) - zb + l / 2; out.width = w + .7; out.height = top + rise;
  out.stand = { x: 1.45, z: A.root.position.z + A.hide.nose - .2, ry: -Math.PI / 2 - .4 }; out.team = '2 draught horses on a pole'; return out; };
// the Crown's coach: a crimson body of 1.9 by 1.45 m and 1.5 m high slung on leather braces from four C-springs, the box seat at
// 2.25 m, a roof rail with trunks, rear wheels of 1.44 m and front of 1.1 m on a perch of 2.4 m
B.glCoach = (K, P, o, r) => { const w = 1.45, out = { wheels: [] }, iron = M_('iron', C3(.1, .1, .11)), body = M_('paint', P.coach), panel = M_('paint', P.panel), trim = M_('brass', P.trim), dark = M_('glass', C3(.04, .05, .06)), lea = M_('leather', C3(.12, .08, .06));
  for (const [z, R] of [[0, .72], [2.4, .55]]) { K.box(iron, w + .6, .08, .08, 0, R, z); for (const s of [-1, 1]) out.wheels.push(spoked(K, P, { r: R, x: s * (w / 2 + .2), z, n: R > .6 ? 14 : 12, paint: P.coach, hubR: .12 })); }
  K.beam(M_('paint', P.panel), V3(0, .78, -.3), V3(0, .66, 2.55), .12, .12);
  const by = 1.0, bz = 1.05, sh = new THREE.Shape(); sh.moveTo(-.95, .3); sh.quadraticCurveTo(-1.02, -.02, -.6, 0); sh.lineTo(.6, 0); sh.quadraticCurveTo(1.02, -.02, .95, .3); sh.lineTo(.98, 1.5); sh.lineTo(-.98, 1.5); sh.closePath();
  { const g = new THREE.ExtrudeGeometry(sh, { depth: w, bevelEnabled: true, bevelThickness: .03, bevelSize: .03, bevelSegments: 2, curveSegments: 10 }); g.rotateY(-Math.PI / 2); g.translate(w / 2, by, bz); worldUV(g, 1); K.put(body, g); }
  for (const s of [-1, 1]) { K.box(panel, .02, .5, 1.75, s * (w / 2 + .035), by + .3, bz); K.box(dark, .02, .5, .48, s * (w / 2 + .04), by + 1.08, bz - .55); K.box(dark, .02, .5, .48, s * (w / 2 + .04), by + 1.08, bz + .55); K.box(dark, .02, .55, .42, s * (w / 2 + .04), by + 1.06, bz);
    K.box(trim, .012, .02, 1.85, s * (w / 2 + .046), by + .6, bz); K.box(trim, .012, 1.3, .02, s * (w / 2 + .046), by + .75, bz - .27); K.box(trim, .012, 1.3, .02, s * (w / 2 + .046), by + .75, bz + .27); K.box(trim, .03, .03, .06, s * (w / 2 + .06), by + .75, bz + .2);
    for (const e of [-1, 1]) { const g = new THREE.TorusGeometry(.32, .035, 6, 16, Math.PI * 1.25); g.rotateY(Math.PI / 2); g.rotateX(e > 0 ? .2 : -.2); g.translate(s * (w / 2 - .1), .98, bz + e * 1.25); K.put(iron, g); K.beam(lea, V3(s * (w / 2 - .1), 1.28, bz + e * 1.32), V3(s * (w / 2 - .12), by + .1, bz + e * .85), .07, .015); } }
  K.box(panel, w + .12, .07, 2.05, 0, by + 1.55, bz); for (const s of [-1, 1]) K.box(iron, .025, .025, 1.9, s * (w / 2), by + 1.78, bz); for (const e of [-1, 1]) K.box(iron, w, .025, .025, 0, by + 1.78, bz + e * .95);
  crate(K, -.2, by + 1.59, bz - .35, .7, .34, .55, r); bale(K, .35, by + 1.59, bz + .3, .5, .3, .6, C3(.36, .25, .16));
  K.box(body, w - .1, .5, .6, 0, .98 + .25, bz - 1.33); // the boot
  const seatZ = bz + 1.15; K.beam(M_('paint', P.panel), V3(-.55, .8, 2.4), V3(-.55, by + 1.15, seatZ), .06, .06); K.beam(M_('paint', P.panel), V3(.55, .8, 2.4), V3(.55, by + 1.15, seatZ), .06, .06);
  K.box(body, w - .05, .12, .5, 0, by + 1.2, seatZ + .05); K.box(lea, w - .15, .1, .45, 0, by + 1.3, seatZ + .05); K.box(body, w - .1, .04, .5, 0, by + .92, seatZ + .48, -.85, 0, 0); // the box and its footboard
  for (const s of [-1, 1]) { K.box(trim, .1, .18, .1, s * (w / 2 + .05), by + 1.45, seatZ - .1); K.box(M_('glass', C3(.9, .8, .5)), .07, .1, .07, s * (w / 2 + .05), by + 1.45, seatZ - .1); }
  const A = beast('draughthorse', o.key + ':near', o.island), Bh = beast('draughthorse', o.key + ':off', o.island), seat = V3(0, by + 1.45, seatZ + .2);
  onPole(K, P, A, Bh, { zF: 2.65, y0: .6, seat, paint: P.panel }); out.beasts = [A, Bh]; out.len = A.root.position.z + A.hide.nose + 1.6; out.width = w + .8; out.height = by + 1.95;
  out.stand = { x: 1.25, z: bz + .1, ry: -Math.PI / 2 }; out.team = '2 horses on a pole'; return out; };

// the Mark's ox cart: disc wheels of 1.1 m (or runners), a staked bed of 2.6 by 1.5 m, seven logs of 3.4 m, a pair of oxen under one yoke
B.mkCart = (K, P, o, r) => { const R = .55, w = 1.5, l = 2.6, on = o.runners, y = on ? .62 : .88, out = { wheels: [] };
  if (on) runners(K, P, { hw: w / 2 - .12, z0: -l / 2 - .05, len: l + .6, posts: [[-l / 2 + .2, y - .1], [0, y - .1], [l / 2 - .2, y - .1]] });
  else { K.box(M_('wood', C3(.3, .22, .15)), w + .45, .12, .12, 0, R, 0); for (const s of [-1, 1]) out.wheels.push(disc(K, P, { r: R, x: s * (w / 2 + .14), z: 0, paint: C3(.4, .32, .24) })); }
  const wood = M_('wood', C3(.34, .26, .18)), ochre = M_('paint', P.trim);
  K.box(wood, w, .07, l, 0, y, 0); for (const s of [-1, 1]) { K.box(wood, .13, .13, l + .2, s * (w / 2 - .06), y - .09, 0); for (let i = 0; i < 4; i++) { const z = -l / 2 + .15 + (l - .3) * i / 3; K.box(wood, .08, .9, .08, s * (w / 2 - .02), y + .42, z); K.box(ochre, .085, .1, .085, s * (w / 2 - .02), y + .9, z); } }
  const bark = M_('bark', C3(.62, .52, .42)), cut = M_('wood', C3(.78, .64, .44)); let i = 0;
  for (const [n, yy] of [[4, .16], [3, .44]]) for (let k = 0; k < n; k++) { const rr = .13 + r() * .03, x = (k - (n - 1) / 2) * .33, g = new THREE.CylinderGeometry(rr, rr * 1.05, 3.4, 12, 1, true); g.rotateX(Math.PI / 2); g.translate(x, y + yy + rr * .5, -.1 + (r() - .5) * .2); K.put(bark, g);
    for (const e of [-1, 1]) { const c = new THREE.CircleGeometry(rr, 12); c.rotateY(e > 0 ? 0 : Math.PI); c.translate(x, y + yy + rr * .5, -.1 + e * 1.7); K.put(cut, c); } i++; }
  K.beam(M_('leather', C3(.25, .2, .14)), V3(-w / 2, y + .95, .4), V3(w / 2, y + .95, .4), .04, .03);
  const A = beast('ox', o.key + ':near', o.island), Bx = beast('ox', o.key + ':off', o.island);
  onPole(K, P, A, Bx, { zF: l / 2, y0: y - .1, sx: .5, yoke: true, gap: .5, paint: C3(.34, .26, .18) }); out.beasts = [A, Bx]; out.len = A.root.position.z + A.hide.nose + l / 2; out.width = w + .5; out.height = y + 1.0;
  out.stand = { x: 1.5, z: A.root.position.z + A.hide.nose - .1, ry: -Math.PI / 2 - .5 }; out.team = '2 oxen under one yoke'; return out; };
// the Mark's carved wagon, after the Oseberg cart: four wheels of 1.0 m, a trough body of 2.4 by 1.2 m on two cradles whose four
// ends rise as beasts' heads, a carved band of interlace down each side, two horses in the Markish coat
function beastHead(K, m, x, y, z, s, flip) { const sh = new THREE.Shape(), p = [[0, 0], [.05, .3], [.02, .5], [.1, .62], [.28, .66], [.42, .6], [.36, .54], [.2, .55], [.3, .46], [.38, .38], [.22, .4], [.14, .36], [.13, .2], [.12, 0]];
  p.forEach(([a, b], i) => i ? sh.lineTo(a * s, b * s) : sh.moveTo(a * s, b * s)); const g = new THREE.ExtrudeGeometry(sh, { depth: .07, bevelEnabled: true, bevelThickness: .015, bevelSize: .012, bevelSegments: 1 }); g.translate(-.06 * s, 0, -.035); g.rotateY(flip ? Math.PI / 2 : -Math.PI / 2); g.translate(x, y, z); worldUV(g, 2); K.put(m, g);
  const e = new THREE.SphereGeometry(.022 * s / .6, 8, 6); e.translate(x + .045, y + .58 * s, z + (flip ? -.3 : .3) * s); K.put(M_('brass', C3(.75, .6, .3)), e); const e2 = e.clone(); e2.translate(-.09, 0, 0); K.put(M_('brass', C3(.75, .6, .3)), e2); }
B.mkWagon = (K, P, o, r) => { const w = 1.2, l = 2.4, out = { wheels: [] }, oak = M_('wood', C3(.36, .26, .17)), carved = M_('carved', C3(.62, .46, .3)), ochre = M_('paint', P.trim), zb = 1.05;
  for (const z of [0, 2.1]) { K.box(oak, w + .5, .1, .1, 0, .5, z); for (const s of [-1, 1]) out.wheels.push(spoked(K, P, { r: .5, x: s * (w / 2 + .16), z, n: 10, paint: C3(.3, .22, .15), w: .07, hubR: .1 })); }
  K.beam(oak, V3(0, .52, -.25), V3(0, .52, 2.3), .14, .12);
  for (const z of [0, 2.1]) { K.box(oak, w + .1, .12, .18, 0, .66, z); for (const s of [-1, 1]) { K.beam(oak, V3(s * .45, .7, z), V3(s * .66, 1.42, z), .1, .14); beastHead(K, oak, s * .67, 1.38, z, .78, z > 1); } }
  const fy = .95; K.box(oak, w - .3, .06, l, 0, fy, zb);
  for (const s of [-1, 1]) { const g = new THREE.BoxGeometry(.05, .55, l + .2).toNonIndexed(); worldUV(g, 1); const uv = g.attributes.uv, p = g.attributes.position; for (let i = 0; i < p.count; i++) { uv.setXY(i, (p.getZ(i) / (l + .2) + .5) * 2, p.getY(i) / .55 + .5); }
    g.rotateZ(s * -.32); g.translate(s * (w / 2 - .06), fy + .28, zb); K.put(carved, g); K.box(ochre, .07, .06, l + .26, s * (w / 2 + .03), fy + .55, zb); }
  for (const e of [-1, 1]) { const sh = new THREE.Shape(); sh.moveTo(-(w - .3) / 2, 0); sh.lineTo((w - .3) / 2, 0); sh.lineTo(w / 2 + .03, .55); sh.lineTo(-w / 2 - .03, .55); sh.closePath(); const g = new THREE.ExtrudeGeometry(sh, { depth: .05, bevelEnabled: false }); g.translate(0, fy, zb + e * (l / 2 + .1) - .025); worldUV(g, 1); K.put(oak, g); }
  for (let k = 0; k < 2; k++) bale(K, (k - .5) * .45, fy + .03, zb - .4 + k * .25, .4, .32, .55, C3(.4, .3, .2)); { const g = new THREE.SphereGeometry(.4, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2); g.scale(1.1, .5, 1.3); g.translate(0, fy + .03, zb + .55); K.put(M_('sack', C3(.5, .4, .3)), g); }
  const A = beast('draughthorse', o.key + ':near', 'mark'), Bh = beast('draughthorse', o.key + ':off', 'mark'), seat = V3(0, fy + .55, zb + .9);
  onPole(K, P, A, Bh, { zF: 2.35, y0: .55, seat, paint: C3(.36, .26, .17) }); out.beasts = [A, Bh]; out.len = A.root.position.z + A.hide.nose + .3; out.width = w + .6; out.height = 1.9;
  out.stand = { x: 1.55, z: zb + .3, ry: -Math.PI / 2 }; out.team = '2 horses on a pole'; return out; };
// the Mark's light cart, after the stolkjerre: two high wheels of 1.4 m (or runners), a box seat for two with its back, a fjord horse in shafts
B.mkKjerre = (K, P, o, r) => { const R = .7, w = 1.05, on = o.runners, y = on ? .55 : 1.0, out = { wheels: [] }, red = M_('paint', P.wheel), dark = M_('paint', C3(.08, .07, .06)), lea = M_('leather', C3(.14, .09, .06));
  if (on) runners(K, P, { hw: w / 2 - .05, z0: -.75, len: 2.0, paint: C3(.3, .22, .15), posts: [[-.5, y - .05], [.5, y - .05]] });
  else { K.box(M_('iron', C3(.12, .12, .13)), w + .5, .06, .06, 0, R, 0); for (const s of [-1, 1]) out.wheels.push(spoked(K, P, { r: R, x: s * (w / 2 + .18), z: 0, n: 12, w: .06, hubR: .09, paint: P.wheel })); for (const s of [-1, 1]) K.beam(M_('iron', C3(.12, .12, .13)), V3(s * (w / 2 - .05), R, 0), V3(s * (w / 2 - .05), y - .06, -.4), .05, .03); }
  K.box(red, w, .05, 1.25, 0, y, 0); for (const s of [-1, 1]) { K.box(red, .035, .32, 1.25, s * w / 2, y + .17, 0); K.box(dark, .05, .04, 1.27, s * w / 2, y + .34, 0); } K.box(red, w, .32, .035, 0, y + .17, -.62); K.box(red, w, .32, .035, 0, y + .17, .62);
  K.box(dark, w - .05, .08, .42, 0, y + .55, -.25); K.box(M_('cloth', C3(.42, .2, .12)), w - .12, .06, .4, 0, y + .61, -.25); K.box(dark, w - .05, .45, .05, 0, y + .82, -.47, -.18, 0, 0); for (const s of [-1, 1]) K.box(dark, .05, .32, .05, s * (w / 2 - .05), y + .4, -.25);
  K.box(red, w - .1, .04, .5, 0, y + .1, .55, -.35, 0, 0);
  const C = beast('wgFjord', o.key + ':horse', 'mark'), seat = V3(0, y + .9, -.1);
  inShafts(K, P, C, { zF: .62, y0: y - .02, sw: w / 2 - .05, seat, paint: C3(.08, .07, .06), gap: .4 }); out.beasts = [C]; out.len = C.root.position.z + C.hide.nose + .8; out.width = w + .5; out.height = y + 1.3;
  out.stand = { x: 1.0, z: C.root.position.z + C.hide.nose - .1, ry: -Math.PI / 2 - .4 }; out.team = '1 fjord horse in shafts'; return out; };

// Aurenne's painted cart, after the carretto: high wheels of 1.5 m in yellow and red, a box of 1.75 by 1.1 m with painted panels, amphorae, a donkey
B.auCart = (K, P, o, r) => { const R = .75, w = 1.1, l = 1.75, y = 1.0, out = { wheels: [] }, yel = M_('paint', P.wheel), red = M_('paint', C3(.66, .18, .12)), pan = M_('panel', WHITE);
  K.box(M_('iron', C3(.12, .12, .13)), w + .5, .07, .07, 0, R, 0); for (const s of [-1, 1]) out.wheels.push(spoked(K, P, { r: R, x: s * (w / 2 + .17), z: 0, n: 12, w: .065, paint: P.wheel, hubR: .12 }));
  { const g = new THREE.BoxGeometry(w + .3, .3, .25).toNonIndexed(); g.translate(0, R + .15, 0); K.put(red, worldUV(g, 1)); }
  K.box(yel, w, .05, l, 0, y, 0);
  for (const s of [-1, 1]) { const g = new THREE.PlaneGeometry(l, .45); g.rotateY(s * Math.PI / 2); g.translate(s * (w / 2 + .02), y + .25, 0); K.put(pan, g); K.box(yel, .04, .45, l, s * w / 2, y + .25, 0); K.box(red, .06, .05, l + .05, s * (w / 2 + .01), y + .5, 0); for (let i = 0; i < 5; i++) K.box(red, .03, .42, .03, s * (w / 2 + .03), y + .25, -l / 2 + .05 + i * (l - .1) / 4); }
  { const g = new THREE.PlaneGeometry(w, .45); g.translate(0, y + .25, -l / 2 - .02); g.rotateY(0); const g2 = g.clone(); g2.rotateY(Math.PI); g2.translate(0, 0, -l - .04 + l); K.put(pan, g); K.box(yel, w, .45, .04, 0, y + .25, -l / 2); K.box(yel, w, .45, .04, 0, y + .25, l / 2); }
  for (let i = 0; i < 4; i++) amphora(K, (i % 2 - .5) * .45, y + .03, -.45 + Math.floor(i / 2) * .55, .95, (r() - .5) * .15);
  const C = beast('wgDonkey', o.key + ':donkey', 'aurenne'), seat = V3(.2, y + .5, l / 2 - .1);
  inShafts(K, P, C, { zF: l / 2, y0: y - .05, sw: w / 2 - .1, seat, paint: P.wheel, gap: .35 });
  // the donkey's plume: a red tassel on its headstall
  { const h = at(C, C.head); const g = new THREE.ConeGeometry(.06, .25, 8); g.translate(h.x, h.y + .28, h.z - .05); K.put(red, g); }
  out.beasts = [C]; out.len = C.root.position.z + C.hide.nose + l / 2; out.width = w + .6; out.height = 1.8; out.stand = { x: .9, z: C.root.position.z + C.hide.nose - .05, ry: -Math.PI / 2 - .4 }; out.team = '1 donkey in shafts'; return out; };
// Aurenne's merchant wagon: a blue bed of 3.2 by 1.5 m, a striped awning on four posts at 2.6 m over crates, bales and amphorae, two mules on a pole
B.auWagon = (K, P, o, r) => { const w = 1.5, l = 3.2, y = .95, zb = 1.1, out = { wheels: [] }, iron = M_('iron', C3(.12, .12, .13));
  for (const [z, R] of [[0, .6], [2.25, .48]]) { K.box(iron, w + .5, .08, .08, 0, R, z); for (const s of [-1, 1]) out.wheels.push(spoked(K, P, { r: R, x: s * (w / 2 + .15), z, n: 12, paint: P.wheel })); K.box(M_('wood', C3(.32, .25, .18)), w + .2, .14, .16, 0, Math.max(R + .1, y - .2), z); }
  K.beam(M_('wood', C3(.32, .25, .18)), V3(0, .55, -.2), V3(0, .52, 2.35), .1, .1);
  bed(K, P, { w, l, y, z: zb, h: .5, stakes: 5, paint: P.trim, stake: P.body });
  const post = M_('paint', P.body), tH = 2.6; for (const s of [-1, 1]) for (const e of [-1, 1]) K.box(post, .06, tH - y, .06, s * (w / 2 + .03), y + (tH - y) / 2, zb + e * (l / 2 - .05));
  { const g = new THREE.PlaneGeometry(w + .5, l + .5, 8, 8); g.rotateX(-Math.PI / 2); const p = g.attributes.position, uv = g.attributes.uv; for (let i = 0; i < p.count; i++) { const x = p.getX(i), z = p.getZ(i); p.setY(i, .22 * (1 - Math.abs(x) / ((w + .5) / 2)) - .03 * Math.sin((z / (l + .5) + .5) * Math.PI * 4) ** 2); uv.setXY(i, (x / (w + .5) + .5) * 2, z / (l + .5) + .5); }
    g.computeVertexNormals(); g.translate(0, tH, zb); K.put(M_('stripe', WHITE), g); }
  for (const s of [-1, 1]) { const g = new THREE.PlaneGeometry(l + .5, .2, 12, 1); const p = g.attributes.position; for (let i = 0; i < p.count; i++) if (p.getY(i) < 0) p.setY(i, p.getY(i) - .05 * Math.abs(Math.sin(p.getX(i) * 9))); g.rotateY(s * Math.PI / 2); g.translate(s * ((w + .5) / 2), tH - .1, zb); K.put(M_('stripe', WHITE), g); }
  crate(K, -.35, y + .03, zb - .9, .6, .45, .55, r); crate(K, .35, y + .03, zb - .9, .55, .4, .5, r); crate(K, -.3, y + .48, zb - .9, .45, .3, .4, r);
  bale(K, .3, y + .03, zb + .05, .55, .5, .65, C3(.7, .55, .35)); bale(K, -.32, y + .03, zb + .1, .55, .45, .7, C3(.55, .2, .14));
  for (let i = 0; i < 3; i++) amphora(K, (i - 1) * .4, y + .03, zb + 1.05, .85, (r() - .5) * .2);
  const A = beast('wgMule', o.key + ':near', 'aurenne'), Bm = beast('wgMule', o.key + ':off', 'aurenne'), seat = V3(-.2, y + .62, zb + l / 2 - .2);
  K.box(M_('paint', P.body), w - .1, .06, .36, 0, y + .5, zb + l / 2 - .25);
  onPole(K, P, A, Bm, { zF: 2.6, y0: .52, sx: .46, seat, paint: P.trim }); out.beasts = [A, Bm]; out.len = A.root.position.z + A.hide.nose + .5; out.width = w + .6; out.height = tH + .25;
  out.stand = { x: 1.45, z: A.root.position.z + A.hide.nose - .2, ry: -Math.PI / 2 - .4 }; out.team = '2 mules on a pole'; return out; };
// Aurenne's covered carriage, after the carpentum: two wheels of 1.4 m, a white body of 2.0 by 1.3 m with blue panels, an arched blue
// hood with a gilt fringe, its back open, two mules on a pole
B.auCarriage = (K, P, o, r) => { const R = .7, w = 1.3, l = 2.0, y = 1.0, out = { wheels: [] }, white = M_('paint', P.body), blue = M_('paint', P.trim), gilt = M_('brass', C3(.8, .62, .28));
  K.box(M_('iron', C3(.12, .12, .13)), w + .55, .08, .08, 0, R, 0); for (const s of [-1, 1]) out.wheels.push(spoked(K, P, { r: R, x: s * (w / 2 + .18), z: 0, n: 12, paint: P.trim, hubR: .12 }));
  K.box(white, w, .06, l, 0, y, 0); for (const s of [-1, 1]) { K.box(white, .05, .62, l, s * w / 2, y + .31, 0); K.box(blue, .02, .4, l - .3, s * (w / 2 + .03), y + .31, 0); K.box(gilt, .015, .025, l - .25, s * (w / 2 + .04), y + .53, 0); K.box(gilt, .015, .025, l - .25, s * (w / 2 + .04), y + .09, 0); }
  K.box(white, w, .62, .05, 0, y + .31, l / 2); K.box(white, w * .35, .3, .05, -w * .32, y + .15, -l / 2); K.box(white, w * .35, .3, .05, w * .32, y + .15, -l / 2);
  const hy = y + .62, rise = .85; { const g = new THREE.CylinderGeometry(1, 1, l + .1, 24, 1, true, -Math.PI / 2, Math.PI); g.rotateX(Math.PI / 2); g.rotateZ(Math.PI / 2); g.scale(w / 2 + .04, rise, 1); g.translate(0, hy, 0); K.put(M_('cloth', P.cloth), g); }
  { const g = new THREE.RingGeometry(.001, 1, 24, 1, 0, Math.PI); g.scale(w / 2 + .04, rise, 1); g.translate(0, hy, l / 2 + .05); K.put(M_('cloth', P.cloth), g); }
  for (const e of [-1, 1]) { const g = new THREE.TorusGeometry(1, .025, 5, 24, Math.PI); g.scale(w / 2 + .06, rise + .02, 1); g.translate(0, hy, e * (l / 2 + .05)); K.put(gilt, g); }
  for (const s of [-1, 1]) for (let i = 0; i < 14; i++) { const z = -l / 2 + i * l / 13; K.box(gilt, .02, .1, .03, s * (w / 2 + .05), hy - .03, z); }
  K.box(blue, w - .1, .08, .4, 0, y + .45, l / 2 - .3); K.box(white, w - .1, .04, .45, 0, y + .15, l / 2 + .25, -.4, 0, 0);
  const A = beast('wgMule', o.key + ':near', 'aurenne'), Bm = beast('wgMule', o.key + ':off', 'aurenne'), seat = V3(0, y + .7, l / 2 - .25);
  onPole(K, P, A, Bm, { zF: l / 2 + .05, y0: y - .2, sx: .46, seat, paint: P.trim }); out.beasts = [A, Bm]; out.len = A.root.position.z + A.hide.nose + l / 2; out.width = w + .6; out.height = hy + rise;
  out.stand = { x: 1.2, z: -.2, ry: -Math.PI / 2 }; out.team = '2 mules on a pole'; return out; };

export function vehicle(key, o = {}) { const island = o.island || VEH[key].island, P = o.pal || PAL[island], K = Kit(), group = new THREE.Group(), r = rng(hashKey('wagons:' + (o.key || key)));
  const out = B[key](K, P, { ...o, island, key: o.key || ('wagons:' + key) }, r); const st = K.bake(group); out.beasts.forEach(C => group.add(C.root));
  const beastTris = out.beasts.reduce((s, C) => s + Math.round(C.stats.tris), 0); group.name = key;
  // the whole rig's extent in its own frame, from the hard parts and the beasts' hides (z: rear to the lead beast's nose)
  const bx = new THREE.Box3(); group.children.forEach(m => { if (m.isMesh) { m.geometry.computeBoundingBox(); bx.union(m.geometry.boundingBox); } }); out.beasts.forEach(C => { bx.expandByPoint(V3(0, 0, C.root.position.z + C.hide.nose)); });
  out.rear = bx.min.z; out.len = bx.max.z - bx.min.z; out.width = bx.max.x - bx.min.x; out.height = Math.max(bx.max.y, ...out.beasts.map(C => C.head.y + .35));
  return { group, key, name: VEH[key].name, island, tris: st.tris, draws: st.draws, beastTris, ...out }; }
// the page's own merging (its wall), so a bundle imports BufferGeometryUtils once
export function merged(gs) { return mergeGeometries(gs, false); }
// a pack camel for the caravan roads (B and C on Aurenne): the kit's camel with its packs and a lead rope
export function packCamel(key) { const C = beast('wgCamel', key, 'aurenne'); return C; }
