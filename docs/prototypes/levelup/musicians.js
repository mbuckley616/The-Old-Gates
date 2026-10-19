// Music and players by island (the concept artist, 19 Oct 2026; backlog L9, OG-112): the fifteen instruments of OG-112 at their true
// size, five an island, and each one held by a person of people.js in a pose of its own. One unit is one metre.
//   the Gatelands: fiddle, tin whistle, bodhrán, harp (the wire-strung clàirseach) and lute
//   the Mark: tagelharpa, war horn, frame drum, bowed lyre and bone flute
//   Aurenne: oud, qanun, ney, riq and santur
// INSTR[key].build() returns the instrument in its own frame; play(person, key) poses a person made by makePerson (seats them first if
// the instrument is played sitting, then reaches each hand to its grip with a two-bone arm, turns the hand and curls the fingers) and
// hangs the instrument, its bow or beater and the seat on the person's root, so the three move with the person when the root is placed.
// The pose is the people kit's own skeleton: nothing is rebuilt, only bones turned, so every garment that is skinned follows.
import * as THREE from 'three';

const V = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
const C = (r, g, b) => new THREE.Color().setRGB(r, g, b, THREE.SRGBColorSpace);
let TRI = 0;

// one grain texture for all the wood (long fine lines, a few darker flecks), tinted by each material's colour
let GRAIN = null, HIDE = null;
function grainTex() { if (GRAIN) return GRAIN; const c = document.createElement('canvas'); c.width = c.height = 256; const x = c.getContext('2d');
  x.fillStyle = '#d8d8d8'; x.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 140; i++) { const px = Math.random() * 256, w = .5 + Math.random() * 1.6, a = .05 + Math.random() * .12; x.strokeStyle = `rgba(40,30,20,${a})`; x.lineWidth = w; x.beginPath();
    for (let y = 0; y <= 256; y += 16) x.lineTo(px + Math.sin(y * .02 + i) * 3, y); x.stroke(); }
  GRAIN = new THREE.CanvasTexture(c); GRAIN.wrapS = GRAIN.wrapT = THREE.RepeatWrapping; GRAIN.colorSpace = THREE.SRGBColorSpace; return GRAIN; }
// a drum's skin: mottled cream, darker where the hand strikes and at the rim
function hideTex() { if (HIDE) return HIDE; const c = document.createElement('canvas'); c.width = c.height = 256; const x = c.getContext('2d');
  const g = x.createRadialGradient(128, 128, 20, 128, 128, 128); g.addColorStop(0, '#efe2c4'); g.addColorStop(.8, '#e2cfa6'); g.addColorStop(1, '#a88a5c'); x.fillStyle = g; x.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 400; i++) { x.fillStyle = `rgba(120,90,50,${Math.random() * .06})`; x.beginPath(); x.arc(Math.random() * 256, Math.random() * 256, 2 + Math.random() * 14, 0, 7); x.fill(); }
  HIDE = new THREE.CanvasTexture(c); HIDE.colorSpace = THREE.SRGBColorSpace; return HIDE; }
// the Mark's frame drum is painted, as the north's drums were: a sun, a tree, men and beasts in alder red on the skin
function paintedHide() { const c = document.createElement('canvas'); c.width = c.height = 256; const x = c.getContext('2d'); x.drawImage(hideTex().image, 0, 0);
  x.strokeStyle = x.fillStyle = 'rgba(140,40,20,.9)'; x.lineWidth = 4; x.lineCap = 'round';
  x.beginPath(); x.moveTo(20, 128); x.lineTo(236, 128); x.stroke(); x.beginPath(); x.arc(128, 128, 18, 0, 7); x.stroke();
  for (let k = 0; k < 8; k++) { const a = k * Math.PI / 4; x.beginPath(); x.moveTo(128 + Math.cos(a) * 22, 128 + Math.sin(a) * 22); x.lineTo(128 + Math.cos(a) * 34, 128 + Math.sin(a) * 34); x.stroke(); }
  const man = (cx, cy, s) => { x.beginPath(); x.arc(cx, cy - 16 * s, 4 * s, 0, 7); x.fill(); x.beginPath(); x.moveTo(cx, cy - 12 * s); x.lineTo(cx, cy + 4 * s); x.moveTo(cx - 9 * s, cy - 8 * s); x.lineTo(cx + 9 * s, cy - 8 * s); x.moveTo(cx, cy + 4 * s); x.lineTo(cx - 6 * s, cy + 16 * s); x.moveTo(cx, cy + 4 * s); x.lineTo(cx + 6 * s, cy + 16 * s); x.stroke(); };
  const deer = (cx, cy) => { x.beginPath(); x.moveTo(cx - 18, cy); x.lineTo(cx + 14, cy); x.moveTo(cx - 14, cy); x.lineTo(cx - 16, cy + 16); x.moveTo(cx + 10, cy); x.lineTo(cx + 12, cy + 16); x.moveTo(cx + 14, cy); x.lineTo(cx + 20, cy - 10); x.moveTo(cx + 20, cy - 10); x.lineTo(cx + 14, cy - 24); x.moveTo(cx + 20, cy - 10); x.lineTo(cx + 28, cy - 22); x.stroke(); };
  man(70, 92, 1); man(186, 92, 1); deer(86, 178); deer(170, 178); man(128, 196, .8);
  x.beginPath(); x.moveTo(128, 30); x.lineTo(128, 80); x.moveTo(128, 46); x.lineTo(110, 34); x.moveTo(128, 46); x.lineTo(146, 34); x.moveTo(128, 60); x.lineTo(108, 50); x.moveTo(128, 60); x.lineTo(148, 50); x.stroke();
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; }

const MATS = {};
function wood(col, rough = .45, key) { const k = key || 'w' + col.join(); return MATS[k] || (MATS[k] = new THREE.MeshStandardMaterial({ map: grainTex(), color: C(...col), roughness: rough })); }
function plain(col, o = {}) { const k = 'p' + col.join() + JSON.stringify(o); return MATS[k] || (MATS[k] = new THREE.MeshStandardMaterial({ color: C(...col), roughness: o.rough ?? .6, metalness: o.metal ?? 0, side: o.side ?? THREE.FrontSide, vertexColors: !!o.vc })); }
const BRASS = () => plain([.78, .6, .3], { metal: .85, rough: .32 }), IRON = () => plain([.2, .19, .18], { metal: .7, rough: .45 }), GUT = () => plain([.86, .8, .66], { rough: .5 }), WIRE = () => plain([.85, .7, .42], { metal: .9, rough: .25 });
const EBONY = () => plain([.05, .04, .035], { rough: .35 }), BLACK = () => plain([.02, .015, .01], { rough: .9 }), PEARL = () => plain([.92, .9, .86], { rough: .25, metal: .1 });

// a part: geometry, material and where it sits, merged later into one mesh a material
class Parts { constructor() { this.g = new THREE.Group(); }
  add(geo, m, pos, rot, scl) { const o = new THREE.Mesh(geo, m); if (pos) o.position.copy(pos); if (rot) o.rotation.set(...rot); if (scl) o.scale.set(...scl); o.castShadow = true; o.receiveShadow = true; this.g.add(o); return o; }
  // a thin rod from a to b
  rod(a, b, r, m, seg = 6, r2) { const d = b.clone().sub(a), L = d.length(), g = new THREE.CylinderGeometry(r2 ?? r, r, L, seg, 1); const o = this.add(g, m, a.clone().add(b).multiplyScalar(.5)); o.quaternion.setFromUnitVectors(V(0, 1, 0), d.normalize()); return o; }
  box(w, h, d, m, pos, rot) { return this.add(new THREE.BoxGeometry(w, h, d), m, pos, rot); } }
function count(g) { let t = 0; g.traverse(o => { if (o.isMesh) { const gg = o.geometry; t += (gg.index ? gg.index.count : gg.attributes.position.count) / 3; } }); return t; }

// an outline, symmetric about x = 0, from half-widths along its length (t from 0 at the foot to 1 at the head)
function outline(L, pts, n = 48, holes = []) { const R = new THREE.SplineCurve(pts.map(([t, w]) => new THREE.Vector2(w, t * L))).getPoints(n), s = new THREE.Shape();
  s.moveTo(0, R[0].y); for (const p of R) s.lineTo(p.x, p.y); s.lineTo(0, R[R.length - 1].y); for (let i = R.length - 1; i >= 0; i--) s.lineTo(-R[i].x, R[i].y); s.closePath(); s.holes.push(...holes); return s; }
function slab(shape, depth, bevel = 0, seg = 3) { const g = new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: bevel > 0, bevelThickness: bevel, bevelSize: bevel, bevelSegments: seg, curveSegments: 24 }); g.computeVertexNormals(); return g; }
function roundRect(w, h, r, cx = 0, cy = 0) { const p = new THREE.Path(), x = cx - w / 2, y = cy - h / 2; p.moveTo(x + r, y); p.lineTo(x + w - r, y); p.quadraticCurveTo(x + w, y, x + w, y + r); p.lineTo(x + w, y + h - r); p.quadraticCurveTo(x + w, y + h, x + w - r, y + h); p.lineTo(x + r, y + h); p.quadraticCurveTo(x, y + h, x, y + h - r); p.lineTo(x, y + r); p.quadraticCurveTo(x, y, x + r, y); return p; }
// a bowl back (lute, oud): half-width w(t) along the length, the depth k × w, the staves coloured in turn
function bowl(L, w, k, staves, cols, nt = 32, ns = 4) { const np = staves * ns, P = [], Cc = [], I = [];
  for (let i = 0; i <= nt; i++) { const t = i / nt, y = t * L, r = w(t); for (let j = 0; j <= np; j++) { const a = Math.PI * j / np, st = Math.min(staves - 1, Math.floor(j / ns)); P.push(-Math.cos(a) * r, y, -Math.sin(a) * r * k); const c = cols[st % cols.length], e = (j % ns === 0) ? .55 : 1; Cc.push(c[0] * e, c[1] * e, c[2] * e); } }
  for (let i = 0; i < nt; i++) for (let j = 0; j < np; j++) { const a = i * (np + 1) + j, b = a + np + 1; I.push(a, a + 1, b, a + 1, b + 1, b); }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(Cc.map(v => Math.pow(v, 2.2)), 3)); g.setIndex(I); g.computeVertexNormals(); return g; }
// a tube along points, its radius from r(t), its colour from c(t) (a horn, the harp's pillar and neck)
function tube(pts, r, c, seg = 40, rad = 12) { const cv = new THREE.CatmullRomCurve3(pts), F = cv.computeFrenetFrames(seg, false), P = [], Cc = [], I = [];
  for (let i = 0; i <= seg; i++) { const t = i / seg, p = cv.getPointAt(t), N = F.normals[i], B = F.binormals[i], rr = r(t), cc = c ? c(t) : [1, 1, 1];
    for (let j = 0; j <= rad; j++) { const a = j / rad * Math.PI * 2; P.push(p.x + rr * (Math.cos(a) * N.x + Math.sin(a) * B.x), p.y + rr * (Math.cos(a) * N.y + Math.sin(a) * B.y), p.z + rr * (Math.cos(a) * N.z + Math.sin(a) * B.z)); Cc.push(...cc.map(v => Math.pow(v, 2.2))); } }
  for (let i = 0; i < seg; i++) for (let j = 0; j < rad; j++) { const a = i * (rad + 1) + j, b = a + rad + 1; I.push(a, b, a + 1, a + 1, b, b + 1); }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(Cc, 3)); g.setIndex(I); g.computeVertexNormals(); return { g, curve: cv }; }
// strings: n of them from a(i) to b(i)
function strings(p, n, a, b, r, m) { for (let i = 0; i < n; i++) p.rod(a(i), b(i), r, m, 4); }
// a ring of a drum: an open cylinder with its wall's thickness
function hoop(R, depth, thick, m, seg = 40) { const s = new THREE.Shape(); s.absarc(0, 0, R, 0, Math.PI * 2, false); const h = new THREE.Path(); h.absarc(0, 0, R - thick, 0, Math.PI * 2, true); s.holes.push(h); return slab(s, depth, .002, 2).translate(0, 0, -depth / 2); }

// ——— the instruments. Frames: a necked instrument stands on its foot at y = 0 with its length up +y and its face to +z; a pipe has its mouth
// at y = 0 and runs down +y with its holes to +z; a drum faces +z, centred; the harp stands on its foot in the x-y plane; the qanun and the
// santur lie in x-z with their face up, the player at +z.
const B = {};
// the fiddle (Gatelands): the violin's body, 35.6 cm, ribs 3.2 cm, scroll to foot 59 cm; a bow of 75 cm
B.fiddle = () => { const p = new Parts(), L = .356, varn = wood([.62, .3, .1], .32);
  const sh = outline(L, [[0, .02], [.03, .07], [.1, .098], [.2, .103], [.32, .094], [.42, .068], [.5, .056], [.58, .062], [.68, .078], [.78, .084], [.88, .072], [.96, .044], [1, .015]]);
  p.add(slab(sh, .032, .005), varn);
  for (const s of [-1, 1]) { p.box(.003, .06, .002, BLACK(), V(s * .038, .175, .038), [0, 0, s * .12]); }
  p.box(.026, .14, .02, wood([.6, .34, .14], .4), V(0, .42, .025)); p.box(.034, .27, .006, EBONY(), V(0, .44, .049), [.04, 0, 0]);
  p.box(.022, .07, .026, wood([.55, .28, .1], .35), V(0, .525, .03)); p.add(new THREE.TorusGeometry(.014, .008, 8, 16), wood([.55, .28, .1], .35), V(0, .57, .034), [0, Math.PI / 2, 0]);
  for (let i = 0; i < 4; i++) p.rod(V(-.035, .5 + i * .014, .03), V(.035, .5 + i * .014, .03), .003, EBONY(), 6, .0045);
  p.box(.042, .003, .03, wood([.85, .74, .55], .6), V(0, .175, .052)); p.box(.03, .1, .006, EBONY(), V(0, .07, .043), [-.1, 0, 0]);
  strings(p, 4, i => V((i - 1.5) * .006, .12, .046), i => V((i - 1.5) * .004, .575, .057), .0005, GUT());
  return p; };
B.fiddleBow = () => { const p = new Parts(), st = wood([.42, .16, .07], .35); p.rod(V(0, 0, 0), V(0, .75, .004), .0042, st, 8, .003);
  p.box(.012, .035, .022, EBONY(), V(0, .015, -.008)); p.box(.01, .02, .016, plain([.9, .88, .8]), V(0, .74, -.006)); p.box(.009, .71, .0008, plain([.94, .92, .86], { rough: .8 }), V(0, .375, -.016)); return p; };
// the tin whistle (Gatelands): 30 cm, a brass tube 1.3 cm with a wooden fipple head and six holes
B.whistle = () => { const p = new Parts(); p.rod(V(0, 0, 0), V(0, .085, 0), .0085, wood([.2, .14, .1], .4), 12, .0075); p.rod(V(0, .085, 0), V(0, .3, 0), .0068, BRASS(), 12);
  p.box(.007, .008, .004, BLACK(), V(0, .03, .0075)); for (let i = 0; i < 6; i++) p.add(new THREE.CircleGeometry(.0028, 10), BLACK(), V(0, .135 + i * .022 + (i > 2 ? .012 : 0), .0069)); return p; };
// the bodhrán (Gatelands): a goatskin frame drum, 46 cm across and 10 cm deep, a cross-bar inside, and its tipper of 20 cm
B.bodhran = () => { const p = new Parts(), R = .23; p.add(hoop(R, .1, .008, wood([.48, .3, .14], .5)), wood([.48, .3, .14], .5));
  p.add(new THREE.CircleGeometry(R - .001, 40), plain([1, 1, 1], { rough: .85 }), V(0, 0, .05)).material = new THREE.MeshStandardMaterial({ map: hideTex(), roughness: .85 });
  p.add(new THREE.TorusGeometry(R, .004, 6, 48), BRASS(), V(0, 0, .046)); p.rod(V(-R + .01, 0, -.02), V(R - .01, 0, -.02), .008, wood([.4, .25, .12], .5)); return p; };
B.tipper = () => { const p = new Parts(), m = wood([.3, .18, .1], .4); p.rod(V(0, 0, 0), V(0, .2, 0), .007, m, 8, .009); p.add(new THREE.SphereGeometry(.011, 8, 6), m, V(0, 0, 0)); p.add(new THREE.SphereGeometry(.011, 8, 6), m, V(0, .2, 0)); return p; };
// the harp (Gatelands): the old wire-strung clàirseach, 95 cm, its soundbox hollowed from one willow log, a curved forepillar, the
// neck's brass shoes, 30 brass strings; played on the left shoulder with the long nails
B.harp = () => { const p = new Parts(), willow = wood([.56, .36, .18], .45);
  // the soundbox leans back from the foot (0,0) to the neck's joint (-.22,.8)
  const foot = V(0, 0, 0), top = V(-.2, .78, 0), ax = top.clone().sub(foot), L = ax.length(), sb = new THREE.CylinderGeometry(.065, .12, L, 4, 1); sb.rotateY(Math.PI / 4); sb.scale(1, 1, .7);
  const box = p.add(sb, willow, foot.clone().add(top).multiplyScalar(.5)); box.quaternion.setFromUnitVectors(V(0, 1, 0), ax.clone().normalize());
  // the neck: from the soundbox's head, out and up over the front; the forepillar: from its end down to the foot, bowed forward
  const neck = [V(-.2, .8, 0), V(-.02, .86, 0), V(.2, .8, 0), V(.36, .9, 0), V(.44, .96, 0)], nk = tube(neck, () => .022, null, 30, 10);
  p.add(nk.g, wood([.45, .27, .12], .4)); const pil = [V(.44, .96, 0), V(.52, .7, 0), V(.48, .4, 0), V(.3, .12, 0), V(.06, .0, 0)], pl = tube(pil, t => .024 + .006 * Math.sin(t * Math.PI), null, 30, 10);
  p.add(pl.g, wood([.45, .27, .12], .4)); p.add(new THREE.SphereGeometry(.035, 10, 8), BRASS(), V(.44, .97, 0));
  for (let i = 0; i < 30; i++) { const t = .06 + i / 29 * .86, a = nk.curve.getPointAt(t).add(V(0, -.018, 0)), s = (a.x + .2) / .66, b = foot.clone().lerp(top, Math.max(.06, Math.min(.98, 1 - s * .95))); b.x += .07; p.rod(b, a, .0007, WIRE(), 4); }
  return p; };
// the lute (Gatelands): a bowl of nine staves, 48 cm long and 33 wide, a rose, a neck of 30 cm and a pegbox bent back at 80°
B.lute = () => { const p = new Parts(), L = .48, w = t => .165 * Math.pow(Math.sin(Math.PI * Math.min(1, t * 1.08)) , .8) * (1 - .45 * t);
  p.add(bowl(L, w, 1.0, 9, [[.62, .4, .2], [.5, .3, .14]]), plain([1, 1, 1], { vc: true, rough: .4 }));
  const s = outline(L, Array.from({ length: 13 }, (_, i) => [i / 12, Math.max(.004, w(i / 12))])); p.add(new THREE.ShapeGeometry(s, 24), wood([.84, .68, .42], .5), V(0, 0, .0005));
  p.add(new THREE.RingGeometry(.035, .045, 32), wood([.4, .25, .12], .5), V(0, .3, .001)); p.add(new THREE.CircleGeometry(.035, 24), BLACK(), V(0, .3, .0008));
  p.box(.05, .3, .022, wood([.42, .24, .1], .4), V(0, L + .14, .0)); p.box(.054, .3, .004, EBONY(), V(0, L + .14, .013));
  const pb = p.box(.04, .17, .025, wood([.42, .24, .1], .4), V(0, L + .3 + .03, -.07), [-1.2, 0, 0]);
  for (let i = 0; i < 6; i++) p.rod(V(-.035, L + .33 + i * .006, -.03 - i * .018), V(.035, L + .33 + i * .006, -.03 - i * .018), .003, EBONY(), 6);
  p.box(.09, .012, .008, wood([.3, .18, .08], .5), V(0, .1, .004)); strings(p, 11, i => V((i - 5) * .0055, .1, .009), i => V((i - 5) * .0035, L + .29, .016), .0004, GUT()); return p; };
// the tagelharpa (Mark): a bowed lyre of the north, 65 cm, a narrow body of pine with a hand-hole at its head, three horsehair strings
B.tagelharpa = () => { const p = new Parts(), L = .65, hole = roundRect(.06, .13, .025, -.0, L - .12);
  const s = outline(L, [[0, .06], [.2, .085], [.45, .08], [.7, .075], [.9, .07], [1, .05]], 40, [hole]); p.add(slab(s, .045, .004), wood([.66, .48, .28], .55));
  p.add(slab(outline(.04, [[0, .02], [1, .03]]), .03, .002), wood([.42, .28, .14], .5), V(0, L - .01, .01));
  p.box(.05, .02, .012, wood([.85, .78, .6], .6), V(0, .22, .055)); for (let i = 0; i < 3; i++) p.rod(V(-.02 + i * .02, L - .03, .03), V(-.02 + i * .02, L + .01, .03), .006, wood([.3, .2, .1], .5), 6);
  strings(p, 3, i => V((i - 1) * .016, .02, .05), i => V((i - 1) * .02, L - .05, .05), .0012, plain([.2, .17, .14], { rough: .9 })); return p; };
B.lyreBow = () => { const p = new Parts(), m = wood([.36, .24, .12], .5); const arc = [V(0, 0, 0), V(0, .2, .05), V(0, .42, .06), V(0, .6, 0)], t = tube(arc, () => .006, null, 20, 6); p.add(t.g, m);
  p.rod(V(0, .01, .006), V(0, .59, .006), .0025, plain([.86, .84, .78], { rough: .9 }), 4); return p; };
// the war horn (Mark): an ox horn, 70 cm round the curve, its mouth cut to a bone mouthpiece, banded in bronze, on a leather baldric
B.warhorn = () => { const p = new Parts(); const pts = [V(0, 0, 0), V(0, .18, .02), V(.04, .36, .08), V(.14, .5, .18), V(.28, .56, .3)];
  const h = tube(pts, t => .007 + .05 * Math.pow(t, 1.6), t => t < .25 ? [.12, .1, .08] : t < .5 ? [.4, .32, .22] : [.88, .82, .68], 40, 14); p.add(h.g, plain([1, 1, 1], { vc: true, rough: .35 }));
  for (const t of [.05, .55, .97]) { const c = h.curve.getPointAt(t), d = h.curve.getTangentAt(t), r = .007 + .05 * Math.pow(t, 1.6) + .003, ring = p.add(new THREE.TorusGeometry(r, .004, 6, 20), BRASS(), c); ring.quaternion.setFromUnitVectors(V(0, 0, 1), d); }
  return p; };
// the frame drum (Mark): an oval drum of bent birch, 48 by 38 cm, reindeer hide painted, beaten with an antler hammer
B.framedrum = () => { const p = new Parts(); const r = p.add(hoop(.24, .07, .007, wood([.6, .46, .3], .55)), wood([.6, .46, .3], .55)); r.scale.set(1, .8, 1);
  const sk = p.add(new THREE.CircleGeometry(.236, 40), new THREE.MeshStandardMaterial({ map: paintedHide(), roughness: .85 }), V(0, 0, .036)); sk.scale.set(1, .8, 1);
  p.rod(V(0, -.18, -.02), V(0, .18, -.02), .009, wood([.45, .32, .18], .5)); for (const y of [-.06, .06]) p.add(new THREE.TorusGeometry(.012, .003, 5, 10), BRASS(), V(.2, y, 0)); return p; };
B.hammer = () => { const p = new Parts(), m = plain([.82, .76, .64], { rough: .6 }); p.rod(V(0, 0, 0), V(0, .2, 0), .007, m, 6); p.add(new THREE.SphereGeometry(.016, 8, 6), m, V(0, .2, 0), null, [1, .7, 1.6]); p.rod(V(0, .2, -.025), V(0, .2, .025), .01, m, 6); return p; };
// the bowed lyre (Mark): the crwth's cousin, 56 cm, a broad body with two arms and a yoke, a window above the strings, a beast's head carved
// on the yoke; held up against the chest on a strap and bowed
B.lyre = () => { const p = new Parts(), L = .56, win = roundRect(.13, .15, .02, 0, L - .12);
  p.add(slab(outline(L, [[0, .1], [.15, .12], [.5, .12], [.8, .12], [.95, .11], [1, .09]], 40, [win]), .05, .004), wood([.5, .32, .16], .5));
  p.add(new THREE.ConeGeometry(.02, .07, 6), wood([.4, .25, .12], .5), V(0, L + .03, .02), [0, 0, 0]); p.add(new THREE.SphereGeometry(.03, 8, 6), wood([.4, .25, .12], .5), V(0, L + .005, .02), null, [1.3, .8, .9]);
  p.box(.07, .012, .02, wood([.85, .78, .6], .6), V(0, .16, .062)); for (let i = 0; i < 6; i++) p.rod(V(-.05 + i * .02, L - .03, .03), V(-.05 + i * .02, L - .03, .065), .004, IRON(), 6);
  strings(p, 6, i => V((i - 2.5) * .011, .04, .055), i => V((i - 2.5) * .018, L - .05, .056), .0008, GUT()); return p; };
// the bone flute (Mark): a swan's wing bone, 20 cm, three holes
B.boneflute = () => { const p = new Parts(), m = plain([.9, .86, .74], { rough: .55 }); p.rod(V(0, 0, 0), V(0, .2, 0), .0072, m, 10, .0062); p.add(new THREE.SphereGeometry(.0085, 8, 6), m, V(0, .2, 0), null, [1, .6, 1]);
  p.box(.006, .006, .003, BLACK(), V(0, .025, .007)); for (let i = 0; i < 3; i++) p.add(new THREE.CircleGeometry(.0024, 10), BLACK(), V(0, .1 + i * .025, .0068)); return p; };
// the oud (Aurenne): a bowl of seventeen staves in walnut and maple, 50 cm long, 36 wide, 18 deep; a short fretless neck of 20 cm, the
// pegbox bent back at 45°, three roses, eleven strings in pairs, and the risha (an eagle's quill) in the right hand
B.oud = () => { const p = new Parts(), L = .5, w = t => .18 * Math.pow(Math.sin(Math.PI * Math.min(1, t * 1.02)), .7) * (1 - .55 * Math.pow(t, 1.4));
  p.add(bowl(L, w, 1.0, 17, [[.36, .2, .1], [.78, .62, .4]]), plain([1, 1, 1], { vc: true, rough: .35 }));
  const s = outline(L, Array.from({ length: 13 }, (_, i) => [i / 12, Math.max(.004, w(i / 12))])); p.add(new THREE.ShapeGeometry(s, 24), wood([.8, .64, .4], .5), V(0, 0, .0005));
  for (const [x, y, r] of [[0, .28, .04], [-.07, .2, .017], [.07, .2, .017]]) { p.add(new THREE.RingGeometry(r, r + .006, 24), PEARL(), V(x, y, .001)); p.add(new THREE.CircleGeometry(r, 20), BLACK(), V(x, y, .0008)); }
  p.box(.11, .015, .01, wood([.3, .18, .08], .5), V(0, .08, .005)); p.add(new THREE.PlaneGeometry(.1, .06), wood([.2, .1, .05], .4), V(0, .05, .0012));
  p.box(.045, .2, .022, wood([.3, .16, .08], .4), V(0, L + .09, 0)); p.box(.05, .21, .004, EBONY(), V(0, L + .09, .013));
  p.box(.04, .2, .025, wood([.3, .16, .08], .4), V(0, L + .19 + .07, -.07), [-.78, 0, 0]);
  for (let i = 0; i < 6; i++) p.rod(V(-.035, L + .21 + i * .022, -.02 - i * .022), V(.035, L + .21 + i * .022, -.02 - i * .022), .003, EBONY(), 6);
  strings(p, 11, i => V((i - 5) * .006, .08, .011), i => V((i - 5) * .0035, L + .19, .016), .0004, GUT()); return p; };
B.risha = () => { const p = new Parts(); p.box(.006, .09, .002, plain([.85, .8, .7], { rough: .4 }), V(0, .045, 0)); return p; };
// the qanun (Aurenne): a trapezoid zither, 95 cm across, 38 deep at the bridge end, 5 cm high; its right end a bridge on five skin
// windows, its slanting left end the pegs and the small brass levers; 26 courses; plucked with rings on the first fingers
B.qanun = () => { const p = new Parts(), W = .95, D0 = .38, D1 = .14, H = .05, walnut = wood([.36, .2, .1], .4);
  const s = new THREE.Shape(); s.moveTo(W / 2, 0); s.lineTo(-W / 2, 0); s.lineTo(-W / 2, D1 * .2); s.lineTo(W / 2, D0); s.closePath();
  const g = slab(s, H, .003); g.rotateX(-Math.PI / 2); p.add(g, walnut, V(0, 0, 0)); const top = new THREE.ShapeGeometry(s); top.rotateX(-Math.PI / 2); p.add(top, wood([.8, .64, .42], .5), V(0, H + .004, 0));
  for (let i = 0; i < 5; i++) p.add(new THREE.PlaneGeometry(.08, .06), new THREE.MeshStandardMaterial({ map: hideTex(), roughness: .8 }), V(W / 2 - .06, H + .0045, -.04 - i * .068), [-Math.PI / 2, 0, 0]);
  p.box(.012, .012, D0 - .02, wood([.85, .78, .6], .6), V(W / 2 - .1, H + .01, -D0 / 2));
  for (let i = 0; i < 9; i++) { const z = -.02 - i * .042; p.add(new THREE.CircleGeometry(.008, 10), PEARL(), V(0, H + .0046, z * .9), [-Math.PI / 2, 0, 0]); }
  strings(p, 26, i => { const z = -.012 - i * (D0 - .03) / 25; return V(W / 2 - .03, H + .016, z); }, i => { const z = -.012 - i * (D0 - .03) / 25, f = -z / D0; return V(-W / 2 + .05 + (1 - f) * 0 + f * (W * .55), H + .012, z); }, .0005, GUT());
  for (let i = 0; i < 26; i++) { const z = -.012 - i * (D0 - .03) / 25, f = -z / D0; p.rod(V(-W / 2 + .03 + f * W * .55, H + .006, z), V(-W / 2 + .03 + f * W * .55, H + .03, z), .003, EBONY(), 5); }
  return p; };
// the ney (Aurenne): a reed of nine nodes, 65 cm, 2 cm across, six holes in front, one behind, a horn mouth-rim
B.ney = () => { const p = new Parts(), m = plain([.82, .7, .44], { rough: .5 }); p.rod(V(0, 0, 0), V(0, .65, 0), .0095, m, 12, .0105);
  p.rod(V(0, -.01, 0), V(0, .012, 0), .0105, plain([.12, .1, .08], { rough: .3 }), 12); for (let i = 1; i < 9; i++) p.add(new THREE.TorusGeometry(.0102, .0012, 5, 14), plain([.62, .5, .3], { rough: .5 }), V(0, i * .072, 0), [Math.PI / 2, 0, 0]);
  for (let i = 0; i < 6; i++) p.add(new THREE.CircleGeometry(.003, 10), BLACK(), V(0, .38 + i * .03 + (i > 2 ? .02 : 0), .0102)); return p; };
// the riq (Aurenne): a tambourine 22 cm across and 6 deep, its frame inlaid with pearl, ten pairs of brass cymbals in five slots, a fish-skin head
B.riq = () => { const p = new Parts(), R = .11; p.add(hoop(R, .06, .012, wood([.32, .18, .09], .4)), wood([.32, .18, .09], .4));
  p.add(new THREE.CircleGeometry(R - .001, 32), plain([.92, .88, .78], { rough: .5 }), V(0, 0, .03)); for (let i = 0; i < 24; i++) { const a = i / 24 * Math.PI * 2; p.add(new THREE.CircleGeometry(.003, 6), PEARL(), V(Math.cos(a) * (R + .0005), Math.sin(a) * (R + .0005), 0), [0, Math.PI / 2 - a, 0]).rotation.set(0, 0, 0); }
  for (let k = 0; k < 5; k++) { const a = (k + .5) / 5 * Math.PI * 2; for (const d of [-.012, .012]) { const c = p.add(new THREE.CylinderGeometry(.022, .022, .002, 14), BRASS(), V(Math.cos(a) * (R - .006), Math.sin(a) * (R - .006), d)); c.rotation.set(Math.PI / 2, 0, 0); c.quaternion.setFromUnitVectors(V(0, 1, 0), V(Math.cos(a), Math.sin(a), 0)); } }
  return p; };
// the santur (Aurenne): a hammered dulcimer, 90 cm on its long side, 35 on the short, 27 deep, 72 strings in 18 courses over walnut
// bridges in two rows, on a low stand; two light hammers (mezrab) of 20 cm
B.santur = () => { const p = new Parts(), W0 = .9, W1 = .36, D = .27, H = .07, walnut = wood([.4, .22, .1], .4);
  const s = new THREE.Shape(); s.moveTo(-W0 / 2, 0); s.lineTo(-W1 / 2, D); s.lineTo(W1 / 2, D); s.lineTo(W0 / 2, 0); s.closePath();
  const g = slab(s, H, .003); g.rotateX(-Math.PI / 2); p.add(g, walnut); const top = new THREE.ShapeGeometry(s); top.rotateX(-Math.PI / 2); p.add(top, wood([.78, .6, .36], .5), V(0, H + .004, 0));
  for (const x of [-.12, .12]) { p.add(new THREE.RingGeometry(.022, .03, 20), PEARL(), V(x, H + .0046, -.13), [-Math.PI / 2, 0, 0]); p.add(new THREE.CircleGeometry(.022, 16), BLACK(), V(x, H + .0045, -.13), [-Math.PI / 2, 0, 0]); }
  for (let i = 0; i < 18; i++) { const z = -.015 - i * (D - .03) / 17, f = -z / D, hw = (W0 + (W1 - W0) * f) / 2 - .03; p.rod(V(-hw, H + .012, z), V(hw, H + .012, z), .0005, WIRE(), 4);
    p.box(.008, .012, .008, wood([.3, .18, .08], .5), V(i % 2 ? -hw * .45 : hw * .55, H + .01, z)); }
  return p; };
B.mezrab = () => { const p = new Parts(), m = wood([.5, .32, .16], .45); p.rod(V(0, 0, 0), V(0, .2, 0), .0025, m, 6); p.add(new THREE.TorusGeometry(.008, .0025, 5, 10), m, V(0, -.006, 0)); p.add(new THREE.SphereGeometry(.007, 8, 6), m, V(0, .2, 0), null, [1, 1, 1.6]); return p; };
// seats, built to the sitter's height: a three-legged creepie (Gatelands), a block stool of birch with a fleece (Mark), a low stool with a cushion (Aurenne)
B.seat = (island, h) => { const p = new Parts(); if (island === 'mark') { p.box(.42, h - .03, .32, wood([.5, .4, .28], .7), V(0, (h - .03) / 2, 0)); p.box(.44, .035, .34, plain([.78, .72, .6], { rough: 1 }), V(0, h - .017, 0)); }
  else if (island === 'aurenne') { const m = wood([.42, .24, .12], .5); p.box(.42, .03, .36, m, V(0, h - .09, 0)); for (const [x, z] of [[-.18, -.15], [.18, -.15], [-.18, .15], [.18, .15]]) p.rod(V(x, 0, z), V(x, h - .1, z), .016, m, 6);
    p.add(new THREE.CylinderGeometry(.2, .21, .07, 16), plain([.6, .16, .12], { rough: .9 }), V(0, h - .04, 0), null, [1.05, 1, .9]); }
  else { const m = wood([.5, .36, .2], .65); p.add(new THREE.CylinderGeometry(.16, .16, .04, 18), m, V(0, h - .02, 0)); for (let k = 0; k < 3; k++) { const a = k / 3 * Math.PI * 2; p.rod(V(Math.cos(a) * .17, 0, Math.sin(a) * .17), V(Math.cos(a) * .1, h - .03, Math.sin(a) * .1), .016, m, 6); } }
  return p; };
// a low table for the qanun and the stand for the santur
B.stand = (h, w = .7, d = .32) => { const p = new Parts(), m = wood([.36, .2, .1], .5); p.box(w, .025, d, m, V(0, h - .0125, 0)); for (const sx of [-1, 1]) for (const sz of [-1, 1]) p.rod(V(sx * (w / 2 - .04), 0, sz * (d / 2 - .04)), V(sx * (w / 2 - .05), h - .025, sz * (d / 2 - .05)), .014, m, 6); return p; };

// ——— the skeleton's helpers
const wp = b => new THREE.Vector3().setFromMatrixPosition(b.matrixWorld);
const wq = b => b.getWorldQuaternion(new THREE.Quaternion());
function setWorldQ(b, q) { b.quaternion.copy(wq(b.parent).invert().multiply(q)); b.updateMatrixWorld(true); }
function aim(b, from, to) { setWorldQ(b, new THREE.Quaternion().setFromUnitVectors(from.clone().normalize(), to.clone().normalize()).multiply(wq(b))); }
// a frame: its origin, its y axis and (made square to it) its z axis
export function frame(o, y, z) { const Y = y.clone().normalize(), Z = z.clone().addScaledVector(Y, -z.dot(Y)).normalize(), X = Y.clone().cross(Z); return new THREE.Matrix4().makeBasis(X, Y, Z).setPosition(o); }
// a two-bone arm: the shoulder (upperarm01) and the elbow (lowerarm01) turned so the wrist meets T, the elbow bent toward the pole
function reach(P, s, T, pole) { const Bn = P.byName, ua = Bn['upperarm01.' + s], la = Bn['lowerarm01.' + s], wr = Bn['wrist.' + s]; P.root.updateMatrixWorld(true);
  const S = wp(ua), E = wp(la), Wr = wp(wr), a = S.distanceTo(E), b = E.distanceTo(Wr), D = T.clone().sub(S); let d = D.length(); const want = d; d = Math.min(a + b - 1e-3, Math.max(Math.abs(a - b) + 1e-3, d)); D.normalize();
  const x = (a * a - b * b + d * d) / (2 * d), h = Math.sqrt(Math.max(0, a * a - x * x)), pl = pole.clone().addScaledVector(D, -pole.dot(D)).normalize(), E2 = S.clone().addScaledVector(D, x).addScaledVector(pl, h);
  aim(ua, E.clone().sub(S), E2.clone().sub(S)); P.root.updateMatrixWorld(true); const E3 = wp(la), W3 = wp(wr); aim(la, W3.sub(E3), S.clone().addScaledVector(D, d).sub(E3)); P.root.updateMatrixWorld(true);
  return +(want - d).toFixed(3); }
// the hand's frame now: f from the wrist to the middle knuckle, n the palm's face
function handNow(P, s) { const Bn = P.byName, w = wp(Bn['wrist.' + s]), f = wp(Bn['finger3-1.' + s]).sub(w).normalize(), k = wp(Bn['finger2-1.' + s]).sub(wp(Bn['finger5-1.' + s])).normalize();
  const n = (s === 'L' ? f.clone().cross(k) : k.clone().cross(f)).normalize(); return { w, f, n, len: wp(Bn['finger3-1.' + s]).distanceTo(w) }; }
// the hand turned at the wrist so its fingers run along F and its palm faces N
function orient(P, s, F, N) { const h = handNow(P, s), cur = frame(V(), h.f, h.n), des = frame(V(), F, N), R = new THREE.Quaternion().setFromRotationMatrix(des.multiply(cur.transpose()));
  setWorldQ(P.byName['wrist.' + s], R.multiply(wq(P.byName['wrist.' + s]))); }
// the fingers bent at their three joints about the knuckles' line, by k (0 open, 1 a loose fist); the thumb by kt
function curl(P, s, k, kt = 0) { const Bn = P.byName; P.root.updateMatrixWorld(true); const hinge = wp(Bn['finger2-1.' + s]).sub(wp(Bn['finger5-1.' + s])).normalize().applyQuaternion(wq(Bn['metacarpal2.' + s]).invert()), sg = s === 'L' ? -1 : 1;
  for (let f = 2; f <= 5; f++) for (let j = 1; j <= 3; j++) { const b = Bn[`finger${f}-${j}.${s}`]; if (b) b.quaternion.setFromAxisAngle(hinge, sg * k * [1.15, 1.35, .95][j - 1] * (1 + (f - 2) * .06)); }
  if (kt) for (let j = 2; j <= 3; j++) { const b = Bn[`finger1-${j}.${s}`]; if (b) b.quaternion.multiply(new THREE.Quaternion().setFromAxisAngle(V(0, 0, 1), -sg * kt * .5)); } P.root.updateMatrixWorld(true); }
// a hand to a grip: the palm's middle (most of the way from the wrist to the knuckles, 2 cm off the bones toward the palm) on G
function grip(P, s, G, F, N, pole, k = .8, kt = 0) { const h0 = handNow(P, s), off = h0.len * .62; let miss = 0;
  for (let it = 0; it < 3; it++) { const T = G.clone().addScaledVector(F.clone().normalize(), -off).addScaledVector(N.clone().normalize(), -.022); miss = reach(P, s, T, pole); orient(P, s, F, N); }
  curl(P, s, k, kt); return miss; }
// seated: the thighs level and a little apart, the shins to the floor (the people kit's own seated angles, Session 1106)
const SEAT = { hip: 1.5, knee: 1.42, spread: .1 };
function sit(P, o = {}) { const Bn = P.byName, q = (x, y, z) => new THREE.Quaternion().setFromEuler(new THREE.Euler(x, y, z, 'XYZ'));
  for (const s of ['L', 'R']) { const sg = s === 'L' ? 1 : -1; Bn['upperleg01.' + s].quaternion.copy(q(-SEAT.hip, 0, sg * (o.spread ?? SEAT.spread))); Bn['lowerleg01.' + s].quaternion.copy(q(o.knee ?? SEAT.knee, 0, 0)); Bn['foot.' + s].quaternion.copy(q(SEAT.hip - (o.knee ?? SEAT.knee), 0, 0)); }
  P.root.updateMatrixWorld(true); }
// where the seated body meets the floor and the seat, read off the bones (the body mesh leaves out what its clothes cover, and its buffer
// carries the pack's unposed helpers, so its vertices cannot say): the soles lie under the ankle by the ankle's standing height, and the
// thighs' undersides under their axis by the thigh's half depth, 8.5 cm on a 1.75 m body
function posedLows(P, ankle0, stature) { P.root.updateMatrixWorld(true); const Bn = P.byName, foot = Math.min(wp(Bn['foot.L']).y, wp(Bn['foot.R']).y) - ankle0;
  const th = s => wp(Bn['upperleg02.' + s]).lerp(wp(Bn['lowerleg01.' + s]), .35).y; return { foot, seat: Math.min(th('L'), th('R')) - .085 * stature / 1.75 }; }
// the joints a hold is measured from (world, the person unturned at the origin)
function joints(P) { const Bn = P.byName; P.root.updateMatrixWorld(true); const eL = wp(Bn['oculi01.L']), eR = wp(Bn['oculi01.R']), eye = eL.clone().add(eR).multiplyScalar(.5);
  return { eye, mouth: eye.clone().add(V(0, -.072, .018)), chin: eye.clone().add(V(0, -.125, -.005)), shL: wp(Bn['upperarm01.L']), shR: wp(Bn['upperarm01.R']), chest: wp(Bn['spine01']).add(V(0, -.02, .1)), hip: wp(Bn['spine05']),
    kneeL: wp(Bn['lowerleg01.L']), kneeR: wp(Bn['lowerleg01.R']), thighL: wp(Bn['upperleg02.L']), thighR: wp(Bn['upperleg02.R']), head: wp(Bn['head']) }; }
const at = (M, x, y, z) => V(x, y, z).applyMatrix4(M), dirOf = (M, x, y, z) => V(x, y, z).transformDirection(M);

// ——— the holds. Each takes the joints (J) and returns where the instrument goes (M), any second piece (bow, beater, stand), and each hand's
// grip: the point, the fingers' line F, the palm's face N, the elbow's pole, the curl. +x is the player's left, +z ahead, +y up.
const H = {};
const L_POLE = V(.8, -.6, -.2), R_POLE = V(-.8, -.6, -.2);
H.fiddle = J => { const dir = V(.62, .1, .78).normalize(), M = frame(J.chin.clone().add(V(.055, -.06, -.06)), dir, V(-.35, 1, 0));
  const cp = at(M, 0, .2, .055), b = dirOf(M, 1, 0, 0).negate(), bow = frame(cp.clone().addScaledVector(b, -.38), b, dirOf(M, 0, 0, 1));
  return { M, extra: [['fiddleBow', bow]], L: { G: at(M, -.012, .4, .02), F: dirOf(M, -.6, 0, 1), N: dirOf(M, -.4, -1, 0), pole: V(.2, -1, -.1), k: .75, kt: .4 },
    R: { G: at(bow, 0, .03, .022), F: V(.2, -.5, 1), N: dirOf(M, 0, 0, -1), pole: R_POLE, k: .55 } }; };
H.whistle = J => { const M = frame(J.mouth.clone().add(V(0, -.005, .012)), V(0, -1, .9), V(0, .9, 1)); return { M, L: { G: at(M, 0, .16, -.004), F: V(-1, .1, .05), N: dirOf(M, 0, 0, -1).add(V(-.2, 0, 0)), pole: L_POLE, k: .45, kt: .3 }, R: { G: at(M, 0, .235, -.004), F: V(1, .1, .05), N: dirOf(M, 0, 0, -1).add(V(.2, 0, 0)), pole: R_POLE, k: .45, kt: .3 } }; };
H.bodhran = J => { const c = J.thighL.clone().add(V(.08, .2, .12)), M = frame(c, V(.15, 1, .05), V(-.55, -.05, .85));
  const tp = at(M, -.02, .02, .15), tip = frame(tp, V(.25, -1, .25), V(0, 0, 1));
  return { M, extra: [['tipper', frame(tp.clone().add(V(-.04, .08, 0)), V(.3, -1, .2), V(0, 0, 1))]], L: { G: at(M, .06, -.02, -.04), F: dirOf(M, -1, .2, 0), N: dirOf(M, 0, 0, 1), pole: V(1, -.4, -.4), k: .35 },
    R: { G: tp.clone().add(V(-.04, .14, 0)), F: V(.1, .1, 1), N: V(1, 0, 0), pole: R_POLE, k: 1.05, kt: .5 } }; };
H.harp = J => { const base = V(J.hip.x - .02, J.thighL.y - .02, J.hip.z + .4), M = frame(base, V(-.05, 1, -.28), V(-1, 0, .05));
  return { M, L: { G: at(M, -.1, .66, .14).add(V(0, 0, 0)), F: V(.4, .2, -1), N: V(-1, 0, .1), pole: V(.9, -.3, -.3), k: .3 }, R: { G: at(M, .12, .42, .08), F: V(.3, 0, -1), N: V(1, 0, .1).negate().negate(), pole: R_POLE, k: .3 } }; };
H.lute = J => { const body = J.thighR.clone().lerp(J.thighL, .45).add(V(0, .13, .12)), dir = V(.86, .45, .2).normalize(), M = frame(body.clone().addScaledVector(dir, -.24), dir, V(-.1, .1, 1));
  return { M, L: { G: at(M, .0, .62, .0), F: dirOf(M, 0, 0, 1).add(V(-.3, 0, 0)), N: dirOf(M, 0, 1, 0).negate().add(dirOf(M, -1, 0, 0)), pole: V(.4, -1, -.3), k: .7, kt: .3 },
    R: { G: at(M, -.02, .16, .04), F: dirOf(M, 0, -.3, -1).add(V(0, -.6, 0)), N: dirOf(M, 0, 0, -1), pole: R_POLE, k: .45 } }; };
H.tagelharpa = J => { const M = frame(J.thighL.clone().lerp(J.kneeL, .55).add(V(-.02, .06, .02)), V(-.18, 1, .28), V(0, .2, 1));
  const cp = at(M, 0, .2, .06), b = dirOf(M, -1, 0, 0), bow = frame(cp.clone().addScaledVector(b, .2), b.clone().negate(), dirOf(M, 0, 0, 1).negate());
  return { M, extra: [['lyreBow', bow]], L: { G: at(M, 0, .54, .025), F: dirOf(M, 0, 0, 1), N: dirOf(M, 1, 0, 0).negate(), pole: V(.8, -.8, -.2), k: .55 }, R: { G: at(bow, 0, .05, 0), F: V(.3, -.4, 1), N: V(0, -1, 0).add(dirOf(M, 0, 0, 1).multiplyScalar(.5)), pole: R_POLE, k: .8, kt: .4 } }; };
H.warhorn = J => { const M = frame(J.mouth.clone().add(V(0, -.005, .015)), V(-.05, .2, 1), V(0, 1, -.2));
  return { M, L: { G: at(M, .02, .3, .0), F: V(-.6, .5, .2), N: V(0, 0, -1).add(V(0, -.5, 0)), pole: L_POLE, k: .9 }, R: { G: at(M, 0, .1, -.01), F: V(.6, .6, 0), N: V(0, -1, 0), pole: R_POLE, k: .95 } }; };
H.framedrum = J => { const c = J.shL.clone().add(V(.04, -.14, .34)), M = frame(c, V(0, 1, 0), V(-.35, .05, 1));
  const head = at(M, -.11, -.09, .04), hd = dirOf(M, -.6, -.45, .65).normalize(), hb = head.clone().addScaledVector(hd, .17);
  return { M, extra: [['hammer', frame(hb, hd.clone().negate(), V(0, 1, 0))]], L: { G: at(M, 0, 0, -.045), F: dirOf(M, 0, 1, 0), N: dirOf(M, 0, 0, 1), pole: V(1, -.6, 0), k: .9 },
    R: { G: hb.clone().addScaledVector(hd, -.02), F: V(0, 1, 0).cross(hd).negate().add(V(0, .3, 0)), N: V(0, 1, 0).cross(hd).cross(hd).negate(), pole: R_POLE, k: 1.05, kt: .5 } }; };
H.lyre = J => { const M = frame(J.chest.clone().add(V(-.1, -.25, .12)), V(.7, .7, .1), V(-.15, -.15, 1));
  const cp = at(M, 0, .2, .06), b = dirOf(M, -1, 0, 0), bow = frame(cp.clone().addScaledVector(b, .2), b.clone().negate(), dirOf(M, 0, 0, 1).negate());
  return { M, extra: [['lyreBow', bow]], L: { G: at(M, -.02, .44, .07), F: dirOf(M, -1, 0, 0), N: dirOf(M, 0, 0, -1), pole: V(.6, -1, -.2), k: .55 }, R: { G: at(bow, 0, .05, 0), F: V(.3, -.4, 1), N: V(0, -1, 0), pole: R_POLE, k: .8, kt: .4 } }; };
H.boneflute = J => { const M = frame(J.mouth.clone().add(V(0, -.004, .01)), V(0, -1, .7), V(0, .7, 1)); return { M, L: { G: at(M, 0, .1, -.004), F: V(-1, .1, .05), N: dirOf(M, 0, 0, -1).add(V(-.2, 0, 0)), pole: L_POLE, k: .5, kt: .3 }, R: { G: at(M, 0, .155, -.004), F: V(1, .1, .05), N: dirOf(M, 0, 0, -1).add(V(.2, 0, 0)), pole: R_POLE, k: .5, kt: .3 } }; };
H.oud = J => { const body = J.thighR.clone().lerp(J.thighL, .4).add(V(0, .14, .13)), dir = V(.92, .3, .25).normalize(), M = frame(body.clone().addScaledVector(dir, -.25), dir, V(-.12, .2, 1));
  return { M, extra: [['risha', null]], L: { G: at(M, 0, .6, 0), F: dirOf(M, 0, 0, 1).add(V(-.3, 0, 0)), N: dirOf(M, 0, 1, 0).negate().add(dirOf(M, -1, 0, 0)), pole: V(.4, -1, -.3), k: .7, kt: .3 },
    R: { G: at(M, -.02, .14, .05), F: dirOf(M, 0, -.3, -1).add(V(0, -.6, 0)), N: dirOf(M, 0, 0, -1), pole: R_POLE, k: .6, kt: .4 } }; };
// the qanun on the lap, as it is played: its player's edge over the hips' front, its far edge past the knees
H.qanun = J => { const M = new THREE.Matrix4().makeRotationY(Math.PI).setPosition(J.hip.x - .04, Math.max(J.thighL.y, J.kneeL.y) + .075, J.hip.z + .14);
  return { M, L: { G: at(M, -.1, .08, -.13), F: V(.2, -.5, 1), N: V(0, -1, .1), pole: L_POLE, k: .5, kt: .3 }, R: { G: at(M, .26, .08, -.11), F: V(-.1, -.5, 1), N: V(0, -1, .1), pole: R_POLE, k: .5, kt: .3 } }; };
H.ney = J => { const M = frame(J.mouth.clone().add(V(.012, -.01, .008)), V(-.5, -1, .7), V(.2, .4, 1)); return { M, L: { G: at(M, 0, .37, -.005), F: V(-1, .2, .2), N: dirOf(M, 0, 0, -1), pole: L_POLE, k: .45, kt: .3 }, R: { G: at(M, 0, .49, -.005), F: V(1, .2, .2), N: dirOf(M, 0, 0, -1), pole: R_POLE, k: .45, kt: .3 } }; };
H.riq = J => { const c = J.shL.clone().add(V(-.06, .02, .3)), M = frame(c, V(0, 1, 0), V(-.4, .15, 1)); return { M, L: { G: at(M, .02, -.1, -.01), F: dirOf(M, 0, 1, 0), N: dirOf(M, 0, 0, 1), pole: V(1, -.8, -.2), k: .85, kt: .4 },
  R: { G: at(M, -.05, -.02, .06), F: V(.6, .3, -.4), N: dirOf(M, 0, 0, -1), pole: R_POLE, k: .25 } }; };
// the santur on its low stand past the knees, its top a hand over them
H.santur = J => { const top = J.kneeL.y + .16, M = new THREE.Matrix4().makeRotationY(Math.PI).setPosition(J.hip.x, top - .074, J.kneeL.z + .17);
  return { M, extra: [['stand', new THREE.Matrix4().makeTranslation(J.hip.x, 0, J.kneeL.z + .3)], ['mezrab', null], ['mezrab', null]], standH: top - .074, L: { G: at(M, -.15, .12, -.05), F: V(-.1, -.3, 1), N: V(0, -1, 0), pole: L_POLE, k: .75, kt: .4 }, R: { G: at(M, .15, .12, -.05), F: V(.1, -.3, 1), N: V(0, -1, 0), pole: R_POLE, k: .75, kt: .4 } }; };

export const INSTR = {
  fiddle: { island: 'gatelands', name: 'Fiddle', sit: false }, whistle: { island: 'gatelands', name: 'Tin whistle', sit: false }, bodhran: { island: 'gatelands', name: 'Bodhrán', sit: true },
  harp: { island: 'gatelands', name: 'Harp', sit: true }, lute: { island: 'gatelands', name: 'Lute', sit: true },
  tagelharpa: { island: 'mark', name: 'Tagelharpa', sit: true }, warhorn: { island: 'mark', name: 'War horn', sit: false }, framedrum: { island: 'mark', name: 'Frame drum', sit: false },
  lyre: { island: 'mark', name: 'Bowed lyre', sit: false }, boneflute: { island: 'mark', name: 'Bone flute', sit: false },
  oud: { island: 'aurenne', name: 'Oud', sit: true }, qanun: { island: 'aurenne', name: 'Qanun', sit: true }, ney: { island: 'aurenne', name: 'Ney', sit: false },
  riq: { island: 'aurenne', name: 'Riq', sit: false }, santur: { island: 'aurenne', name: 'Santur', sit: true } };
export const BANDS = { gatelands: ['fiddle', 'whistle', 'bodhran', 'harp', 'lute'], mark: ['tagelharpa', 'warhorn', 'framedrum', 'lyre', 'boneflute'], aurenne: ['oud', 'qanun', 'ney', 'riq', 'santur'] };
export function build(key, ...a) { const p = B[key](...a); return { group: p.g, tris: count(p.g) }; }
// a measure of each instrument: its bounding size in metres and triangles
export function measure(key) { const { group, tris } = build(key); const b = new THREE.Box3().setFromObject(group), s = b.getSize(V()); return { key, tris, size: s.toArray().map(v => +v.toFixed(3)) }; }

// the player: a person posed to play. Returns the pieces added and how far each hand fell short of its grip (0 when it reached)
export function play(P, key, o = {}) { const I = INSTR[key], root = P.root; root.position.set(0, root.position.y, 0); root.rotation.set(0, 0, 0); root.updateMatrixWorld(true);
  let seatH = 0; if (I.sit) { const ankle0 = Math.min(wp(P.byName['foot.L']).y, wp(P.byName['foot.R']).y) , st = wp(P.byName['head']).y + .12; sit(P, o); const lo = posedLows(P, ankle0, st); root.position.y -= lo.foot; root.updateMatrixWorld(true); seatH = lo.seat - lo.foot; }
  const J = joints(P), h = H[key](J), inv = root.matrixWorld.clone().invert(), out = { pieces: [], tris: 0, seat: +seatH.toFixed(3) };
  const hang = (g, M) => { g.matrixAutoUpdate = false; g.matrix.copy(inv.clone().multiply(M)); root.add(g); };
  const main = build(key); hang(main.group, h.M); out.tris += main.tris; out.instrument = main.tris;
  if (I.sit) { const s = build('seat', o.island || I.island, seatH); hang(s.group, new THREE.Matrix4().makeTranslation(J.hip.x, 0, J.hip.z - .04)); out.tris += s.tris; out.seatTris = s.tris; }
  // the hands: the left first (it holds), then the right (it plays)
  out.missL = grip(P, 'L', h.L.G, h.L.F, h.L.N, h.L.pole, h.L.k, h.L.kt); out.missR = grip(P, 'R', h.R.G, h.R.F, h.R.N, h.R.pole, h.R.k, h.R.kt);
  for (const [k, M] of h.extra || []) { let MM = M, x;
    if (k === 'stand') x = build('stand', h.standH, key === 'qanun' ? .62 : .74, key === 'qanun' ? .3 : .36);
    else x = build(k);
    if (!MM) { const s = k === 'mezrab' ? (out.pieces.filter(p => p === 'mezrab').length ? 'L' : 'R') : 'R', hn = handNow(P, s), g = hn.w.clone().addScaledVector(hn.f, hn.len * .7).addScaledVector(hn.n, -.0);
      MM = k === 'risha' ? frame(g.clone().addScaledVector(hn.f, -.01), hn.f.clone().add(hn.n.clone().multiplyScalar(-.6)), hn.n) : frame(g.clone().addScaledVector(hn.f, -.03), hn.f.clone().multiplyScalar(-.3).add(hn.n.clone().cross(hn.f).multiplyScalar(s === 'R' ? 1 : -1)), hn.n); }
    hang(x.group, MM); out.tris += x.tris; out.pieces.push(k); }
  root.updateMatrixWorld(true); return out; }
