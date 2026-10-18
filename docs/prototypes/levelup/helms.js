// The armour's headgear by tier (the concept artist, 17 Oct 2026; backlog L7, "Armour's top tiers"; OG-052, kept over OG-019 for
// its headgear only). Ten helms for the heavy line and the hoods' dressing for the robe line, on people.js's people, in metres.
// Every helm is a shell fitted to the head it sits on: the head, the tucked hair, the beard and a raised hood, read in the head
// bone's own frame (each skinned point taken through its mesh's bind matrix and the head bone's inverse, so the shell rides that
// bone rigidly as the kit's kettle helm does), binned in 80 directions round and 36 down from a centre at the eyes, spread to the
// neighbours and smoothed, then 1.2 to 2.4 cm more. The face is cut out of it by a 2D shape in the head's front view (open, the
// Corinthian T, the great helm's slit), and the cut's vertices are moved onto the shape's edge, so the opening is a clean line and
// not stairs; every free edge gets a 5 mm lip, in the tier's trim or its glow. The rest (combs, the horsehair crest, fins, horns,
// the flame crest, the crescent and the halo, antlers) is placed on the shell's own surface.
//   fitHead(person) -> F: the cloud, the eyes, the chin, the crown, in the head bone's frame
//   helm(tier, F, { bold, closed }) -> { group, tris, draws, size, gap }   tier 1..10 (Wooden..Cosmic); Iron (3) is the kit's kettle
//   hoodDress(tier, F, { bold }) -> the same, for a robe's raised hood (circlet, antlers, horns, halo)
// bold: OG-052's silhouettes from Mithril up (else OG-019's: one helm shape, the tier read by colour, trim and glow); closed: the
// magical tiers' faces shut behind a visor's slit (OG-052 draws them so). Tiers 1 to 4 are OG-019's in every set.
import * as THREE from 'three';

const C = (r, g, b) => new THREE.Color().setRGB(r, g, b, THREE.SRGBColorSpace);
export const TIERS = [null,
  { key: 'wooden', name: 'Wooden', metal: [.36, .24, .15], mr: [0, .8], trim: [.52, .37, .22], cloth: [.42, .34, .24] },
  { key: 'bronze', name: 'Bronze', metal: [.74, .5, .26], mr: [.75, .34], trim: [.74, .5, .26], cloth: [.55, .14, .1], crest: [.6, .09, .07] },
  { key: 'iron', name: 'Iron', metal: [.42, .43, .45], mr: [.5, .4], trim: [.42, .43, .45], cloth: [.42, .36, .28] },
  { key: 'steel', name: 'Steel', metal: [.78, .8, .83], mr: [.75, .28], trim: [.78, .8, .83], cloth: [.24, .27, .34] },
  { key: 'mithril', name: 'Mithril', metal: [.4, .54, .84], mr: [.75, .26], trim: [.82, .86, .92], glow: [.45, .62, 1], cloth: [.16, .22, .44] },
  { key: 'adamant', name: 'Adamant', metal: [.2, .44, .24], mr: [.7, .3], trim: [.82, .64, .3], glow: [.4, 1, .45], cloth: [.18, .3, .16] },
  { key: 'obsidian', name: 'Obsidian', metal: [.07, .07, .08], mr: [.35, .14], trim: [.16, .14, .2], glow: [.62, .25, 1], cloth: [.12, .1, .14] },
  { key: 'draconic', name: 'Draconic', metal: [.72, .18, .07], mr: [.6, .32], trim: [.86, .64, .28], glow: [1, .48, .12], cloth: [.36, .1, .06] },
  { key: 'demonic', name: 'Demonic', metal: [.36, .12, .5], mr: [.6, .3], trim: [.2, .1, .14], glow: [.86, .26, 1], cloth: [.22, .08, .3], horn: [.2, .14, .14] },
  { key: 'cosmic', name: 'Cosmic', metal: [.86, .92, .97], mr: [.6, .22], trim: [.9, .78, .46], glow: [.55, .92, 1], cloth: [.8, .86, .92] }];

// the materials, one per key, so a helm is merged into as few draws as it has materials
const MATS = {};
// the metals' reflection: the page hands in a filtered sky (helms-view.js); only the helms take it, so the cloth and the skin stay as the kit lights them
export const ENV = { map: null, k: .9 };
function scaleTex() { const c = document.createElement('canvas'); c.width = c.height = 256; const x = c.getContext('2d'); x.fillStyle = '#808080'; x.fillRect(0, 0, 256, 256);
  for (let r = -1; r < 18; r++) for (let k = -1; k < 18; k++) { const cx = k * 16 + (r % 2 ? 8 : 0), cy = r * 14, g = x.createRadialGradient(cx, cy + 4, 1, cx, cy, 11); g.addColorStop(0, '#d8d8d8'); g.addColorStop(.75, '#909090'); g.addColorStop(1, '#303030');
    x.fillStyle = g; x.beginPath(); x.arc(cx, cy, 10, 0, Math.PI); x.fill(); }
  const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(10, 5); return t; }
export function M(key, tier) { const k = key + ':' + tier; if (MATS[k]) return MATS[k]; const T = TIERS[tier];
  const m = key === 'metal' ? new THREE.MeshStandardMaterial({ color: C(...T.metal), metalness: T.mr[0], roughness: T.mr[1], side: THREE.DoubleSide, ...(T.key === 'draconic' ? { bumpMap: scaleTex(), bumpScale: 1.6 } : {}) })
    : key === 'trim' ? new THREE.MeshStandardMaterial({ color: C(...T.trim), metalness: T.key === 'wooden' ? 0 : .8, roughness: .3, side: THREE.DoubleSide })
    : key === 'glow' ? new THREE.MeshStandardMaterial({ color: C(...T.glow), emissive: C(...T.glow), emissiveIntensity: 1.1, roughness: .5, side: THREE.DoubleSide })
    : key === 'crest' ? new THREE.MeshStandardMaterial({ color: C(...T.crest), roughness: 1, side: THREE.DoubleSide })
    : key === 'horn' ? new THREE.MeshStandardMaterial({ color: C(...(T.horn || [.86, .8, .66])), roughness: .55, metalness: .1 })
    : key === 'dark' ? new THREE.MeshBasicMaterial({ color: 0x060505, side: THREE.DoubleSide })
    : key === 'antler' ? new THREE.MeshStandardMaterial({ color: C(.56, .46, .34), roughness: .75 })
    : key === 'flame' ? new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.DoubleSide, toneMapped: false })
    : new THREE.MeshStandardMaterial({ color: C(...T.cloth), roughness: .9 });
  if (ENV.map && m.isMeshStandardMaterial) { m.envMap = ENV.map; m.envMapIntensity = ENV.k; }
  return MATS[k] = m; }

// ── the head, read off a built person ──
export function fitHead(p) {
  const hb = p.byName['head'], sk = p.skeleton, hi = sk.bones.indexOf(hb), toHead = sk.boneInverses[hi], sub = new Set(), pts = [], body = [], v = new THREE.Vector3();
  hb.traverse(b => { if (b.isBone) sub.add(sk.bones.indexOf(b)); }); p.root.updateMatrixWorld(true);
  for (const m of p.meshes) { if (!m.isSkinnedMesh) continue; const g = m.geometry, P = g.attributes.position, SI = g.attributes.skinIndex, SW = g.attributes.skinWeight; if (!SI) continue;
    // only the points a mesh draws: a garment's shell holds every point of the body
    const used = g.index ? new Uint8Array(P.count) : null; if (used) for (const i of g.index.array) used[i] = 1;
    const isBody = m === p.meshes[0];
    for (let i = 0; i < P.count; i++) { if (used && !used[i]) continue; let w = 0; for (let k = 0; k < 4; k++) if (sub.has(SI.getComponent(i, k))) w += SW.getComponent(i, k); if (w < .5) continue;
      v.fromBufferAttribute(P, i).applyMatrix4(m.bindMatrix).applyMatrix4(toHead); pts.push(v.clone()); if (isBody) body.push(pts[pts.length - 1]); } }
  const inv = hb.matrixWorld.clone().invert(), bp = n => p.byName[n] ? p.byName[n].getWorldPosition(new THREE.Vector3()).applyMatrix4(inv) : null;
  const eL = bp('eye.L'), eR = bp('eye.R'), eye = eL && eR ? eL.clone().add(eR).multiplyScalar(.5) : new THREE.Vector3(0, .04, .09), ex = eL && eR ? Math.abs(eL.x - eR.x) / 2 : .031;
  let chin = 1, crown = -1, nose = -1, zb = 1; for (const q of body) { if (Math.abs(q.x) < .02 && q.z > eye.z - .04) chin = Math.min(chin, q.y); crown = Math.max(crown, q.y); nose = Math.max(nose, q.z); zb = Math.min(zb, q.z); }
  const box = new THREE.Box3(); for (const q of pts) box.expandByPoint(q);
  return { hb, pts, eye, ex, chin, crown, nose, back: zb, box, hood: p.meshes.some(m => m.name === 'hoodUp') };
}

// ── the shell ──
const sstep = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
// o: cl (clearance), bottom(θ) -> y of the rim, sd(x, y, z) -> the face opening's signed distance (< 0 cut), smooth (passes),
// ridge (a keel along the top, metres), flare (the rim turned out, metres), top (the crown raised, metres), NT, NP
export function shell(F, o = {}) {
  const NT = o.NT || 80, NB = 36, PH = Math.PI * .96, c = new THREE.Vector3(0, F.eye.y - .005, (F.nose + F.back) / 2 - .01), Mx = new Float32Array(NT * NB), CL = o.cl ?? .012;
  const bin = (th, ph) => [((Math.round(th / (Math.PI * 2) * NT) % NT) + NT) % NT, Math.max(0, Math.min(NB - 1, Math.round(ph / PH * (NB - 1))))];
  for (const q of F.pts) { const d = q.clone().sub(c), r = d.length(), [a, b] = bin(Math.atan2(d.x, d.z), Math.acos(d.y / r)); Mx[b * NT + a] = Math.max(Mx[b * NT + a], r); }
  const pass = (S, f) => { const O = new Float32Array(S.length); for (let b = 0; b < NB; b++) for (let a = 0; a < NT; a++) O[b * NT + a] = f(a, b, (da, db) => S[Math.max(0, Math.min(NB - 1, b + db)) * NT + (a + da + NT) % NT]); return O; };
  let S = pass(Mx, (a, b, at) => { let m = 0; for (let da = -2; da <= 2; da++) for (let db = -1; db <= 1; db++) m = Math.max(m, at(da, db)); return m; });
  // empty rows (under the chin, where the throat is the neck's) take the row above
  for (let b = 1; b < NB; b++) for (let a = 0; a < NT; a++) if (!S[b * NT + a]) S[b * NT + a] = S[(b - 1) * NT + a];
  for (let b = NB - 2; b >= 0; b--) for (let a = 0; a < NT; a++) if (!S[b * NT + a]) S[b * NT + a] = S[(b + 1) * NT + a];
  const floor = S; for (let k = 0; k < (o.smooth ?? 4); k++) S = pass(S, (a, b, at) => { let t = 0; for (let da = -2; da <= 2; da++) for (let db = -1; db <= 1; db++) t += at(da, db); return Math.max(floor[b * NT + a], t / 15); });
  const R0 = (th, ph) => { const u = ((th / (Math.PI * 2)) * NT % NT + NT) % NT, w = Math.max(0, Math.min(NB - 1.001, ph / PH * (NB - 1))), a = Math.floor(u), b = Math.floor(w), fu = u - a, fv = w - b, g = (aa, bb) => S[bb * NT + (aa % NT)];
    return (g(a, b) * (1 - fu) + g(a + 1, b) * fu) * (1 - fv) + (g(a, b + 1) * (1 - fu) + g(a + 1, b + 1) * fu) * fv; };
  const bottom = o.bottom || (th => F.chin - .02);
  let phB = null; const R = (th, ph) => { let r = R0(th, ph) + CL; const lat = Math.sin(ph) * Math.sin(th), up = Math.cos(ph);
    if (o.ridge) r += o.ridge * Math.exp(-((lat / .2) ** 2)) * sstep(-.3, .4, up);
    if (o.top) r += o.top * sstep(.2, .95, up);
    if (o.flare && phB) r += o.flare * sstep(phB(th) - .45, phB(th), ph) * (.6 + .4 * sstep(-1, -.2, -Math.cos(th)));
    return r; };
  const at = (th, ph, off = 0) => { const r = R(th, ph) + off; return new THREE.Vector3(c.x + r * Math.sin(ph) * Math.sin(th), c.y + r * Math.cos(ph), c.z + r * Math.sin(ph) * Math.cos(th)); };
  const phRim = th => { let lo = 0, hi = PH; for (let k = 0; k < 24; k++) { const m = (lo + hi) / 2; if (at(th, m).y > bottom(th)) lo = m; else hi = m; } return (lo + hi) / 2; };
  const RIM0 = Array.from({ length: NT + 1 }, (_, t) => phRim(t / NT * Math.PI * 2)); phB = th => RIM0[Math.round(((th / (Math.PI * 2)) * NT % NT + NT) % NT)];
  const RIM = Array.from({ length: NT + 1 }, (_, t) => phRim(t / NT * Math.PI * 2));
  // the grid: rows from the crown to the rim, denser near the rim and the face
  const NP = o.NP || 28, prm = [], pos = [], uv = [];
  for (let j = 0; j < NP; j++) for (let t = 0; t <= NT; t++) { const th = t / NT * Math.PI * 2, ph = RIM[t] * (j / (NP - 1)) ** .85; prm.push([th, ph]); const p = at(th, ph); pos.push(p.x, p.y, p.z); uv.push(t / NT, ph / PH); }
  const sd = o.sd, V = i => new THREE.Vector3(pos[i * 3], pos[i * 3 + 1], pos[i * 3 + 2]), sdv = i => sd(pos[i * 3], pos[i * 3 + 1], pos[i * 3 + 2]);
  const idx = [], N = pos.length / 3, inside = new Uint8Array(N); if (sd) for (let i = 0; i < N; i++) inside[i] = sdv(i) < 0 ? 1 : 0;
  // the last column is the first again (no seam down the back), and the first row is the crown's one point
  const tris = []; for (let j = 0; j < NP - 1; j++) for (let t = 0; t < NT; t++) { const a = j * (NT + 1) + t, d = a + NT + 1, a1 = j * (NT + 1) + (t + 1) % NT, d1 = a1 + NT + 1; if (j > 0) tris.push([a, d, a1]); tris.push([a1, d, d1]); }
  // the face: a triangle wholly inside the opening goes; a vertex inside that a kept triangle still uses moves along the grid,
  // towards the first of its triangle's outside corners, onto the opening's edge
  const moved = new Uint8Array(N);
  for (const T of tris) { const n = T.filter(i => inside[i]).length; if (n === 3) continue; idx.push(...T); if (!n) continue;
    for (const i of T) if (inside[i] && !moved[i]) { const out = T.find(k => !inside[k]); let lo = prm[i], hi = prm[out];
      for (let k = 0; k < 20; k++) { const m = [(lo[0] + hi[0]) / 2, (lo[1] + hi[1]) / 2], p = at(m[0], m[1]); if (sd(p.x, p.y, p.z) < 0) lo = m; else hi = m; }
      const p = at(hi[0], hi[1]); pos[i * 3] = p.x; pos[i * 3 + 1] = p.y; pos[i * 3 + 2] = p.z; moved[i] = 1; } }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx); g.computeVertexNormals();
  // the free edges (the rim and the face's opening): a lip turned out along the shell's normal
  const E = new Map(), key = (a, b) => a < b ? a + ',' + b : b + ',' + a; for (let k = 0; k < idx.length; k += 3) for (let e = 0; e < 3; e++) { const a = idx[k + e], b = idx[k + (e + 1) % 3], s = key(a, b); E.set(s, E.has(s) ? null : [a, b]); }
  const nrm = g.attributes.normal, lp = [], li = [], LIP = o.lip ?? .004, n = new THREE.Vector3();
  for (const e of E.values()) { if (!e) continue; const [a, b] = e, A = V(a), B = V(b), nA = n.fromBufferAttribute(nrm, a).clone(), nB = n.fromBufferAttribute(nrm, b).clone();
    // the normals face out of the head: check against the centre
    if (nA.dot(A.clone().sub(c)) < 0) nA.negate(); if (nB.dot(B.clone().sub(c)) < 0) nB.negate();
    const k = lp.length / 3; lp.push(...A.clone().addScaledVector(nA, -.002).toArray(), ...B.clone().addScaledVector(nB, -.002).toArray(), ...B.clone().addScaledVector(nB, LIP).toArray(), ...A.clone().addScaledVector(nA, LIP).toArray()); li.push(k, k + 1, k + 2, k, k + 2, k + 3); }
  const lip = new THREE.BufferGeometry(); lip.setAttribute('position', new THREE.Float32BufferAttribute(lp, 3)); lip.setIndex(li); lip.computeVertexNormals();
  // the gap: the nearest point of the head to the shell, over the points the shell covers (a point in the face's opening is not covered)
  let gap = 1; for (const q of F.pts) { if (sd && sd(q.x, q.y, q.z) < .004) continue; const d = q.clone().sub(c), r = d.length(), th = Math.atan2(d.x, d.z), ph = Math.acos(d.y / r); if (ph > phB(th)) continue; gap = Math.min(gap, R(th, ph) - r); }
  return { g, lip, at, R, c, RIM: th => phRim(th), gap, NT };
}

// ── the face's openings, in the head's front view (x across, y up), for points in front of the ears ──
const rbox = (x, y, cx, cy, hw, hh, rr) => { const qx = Math.abs(x - cx) - hw + rr, qy = Math.abs(y - cy) - hh + rr; return Math.hypot(Math.max(qx, 0), Math.max(qy, 0)) + Math.min(Math.max(qx, qy), 0) - rr; };
export function face(kind, F) { const ey = F.eye.y, front = z => z > F.eye.z - .055;
  if (kind === 'open') return (x, y, z) => !front(z) ? 1 : Math.min(rbox(x, y, 0, (ey + .03 + F.chin - .05) / 2, .057, (ey + .03 - F.chin + .05) / 2, .03), rbox(x, y, 0, ey + .005, .07, .024, .016));
  if (kind === 'T') return (x, y, z) => !front(z) ? 1 : Math.min(Math.max(rbox(x, y, 0, ey + .002, .072, .017, .012), .012 - Math.abs(x)), rbox(x, y, 0, F.chin - .03, .03, ey - .03 - F.chin + .03, .012));
    return null; }

// ── the pieces on it ──
// a plate in the head's middle (x = 0) plane, from a 2D outline [(z, y)], `t` thick, centred on x0
function plate(outline, t, x0 = 0) { const s = new THREE.Shape(outline.map(([z, y]) => new THREE.Vector2(z, y))), g = new THREE.ExtrudeGeometry(s, { depth: t, bevelEnabled: false, curveSegments: 4 });
  g.translate(0, 0, -t / 2); g.rotateY(-Math.PI / 2); g.translate(x0, 0, 0); return g; }
// a comb along the top, from φa in front to φb behind: its foot sunk 6 mm into the shell, its edge h(s) above it (s 0 front to 1 back)
function combLine(S, pha, phb, n = 40) { const L = []; for (let i = 0; i <= n; i++) { const s = i / n, ph = (pha + phb) * s - pha, p = S.at(ph < 0 ? 0 : Math.PI, Math.abs(ph)); L.push([p, new THREE.Vector3(0, p.y - S.c.y, p.z - S.c.z).normalize(), s]); } return L; }
function comb(S, pha, phb, h, t) { const L = combLine(S, pha, phb), out = [], inn = []; for (const [p, up, s] of L) { inn.push([p.z - up.z * .006, p.y - up.y * .006]); const hh = h(s); out.push([p.z + up.z * hh, p.y + up.y * hh]); }
  return plate([...inn, ...out.reverse()], t); }
// a tube along a curve, its radius r(s), 0 at the root to 1 at the tip, closed with a point
function taper(points, r, radial = 10, n = 28) { const cv = new THREE.CatmullRomCurve3(points), F = cv.computeFrenetFrames(n, false), pos = [], idx = [];
  for (let i = 0; i <= n; i++) { const p = cv.getPointAt(i / n), rr = r(i / n); for (let k = 0; k <= radial; k++) { const a = k / radial * Math.PI * 2, d = F.normals[i].clone().multiplyScalar(Math.cos(a)).addScaledVector(F.binormals[i], Math.sin(a)); pos.push(p.x + d.x * rr, p.y + d.y * rr, p.z + d.z * rr); } }
  for (let i = 0; i < n; i++) for (let k = 0; k < radial; k++) { const a = i * (radial + 1) + k, b = a + radial + 1; idx.push(a, b, a + 1, a + 1, b, b + 1); }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals(); return g; }
// a fin: a swept wing of `k` feathers, in the side plane, rooted along the shell's side above the ear
function fin(S, side, o = {}) { const k = o.k ?? 3, len = o.len ?? .16, rise = o.rise ?? .11, out = [];
  const root = S.at(side * Math.PI / 2, .95), back = S.at(side * Math.PI * .78, .9);
  const pts = [[root.z + .02, root.y - .015]]; for (let i = 0; i < k; i++) { const f = (i + 1) / k, tz = root.z - .03 - len * (.55 + .45 * f), ty = root.y + rise * (1.05 - .45 * f); pts.push([tz + .03, ty - .02 * f], [tz, ty], [tz + .045 - .01 * i, ty - .045 - .01 * f]); }
  pts.push([back.z, back.y - .01]); for (const [z, y] of pts) out.push([z, y]);
  const g = plate(out, .006, 0); g.translate(0, 0, 0); const x = Math.max(Math.abs(root.x), Math.abs(back.x)) - .004; g.rotateZ(side * -.22); g.translate(side * x, .0, 0); return g; }
// the flame crest: a comb whose edge rises into tongues leaning back, unlit and graded dark red to gold, so the bloom takes it
function flames(S, pha, phb, n, hmax) { const L = combLine(S, pha, phb, 120), out = [], inn = [];
  for (const [p, up, s] of L) { const u = (s * n) % 1, env = Math.sin(Math.PI * Math.min(1, s * 1.05 + .02)) ** .6, hh = .012 + hmax * env * (.35 + .65 * u ** 1.6) * (1 - .3 * Math.abs(Math.sin(s * 9)));
    inn.push([p.z - up.z * .004, p.y - up.y * .004]); out.push([p.z + up.z * hh - .012 * u, p.y + up.y * hh]); }
  const g = plate([...inn, ...out.reverse()], .014), P = g.attributes.position, col = []; let lo = 1e9, hi = -1e9; for (let i = 0; i < P.count; i++) { lo = Math.min(lo, P.getY(i)); hi = Math.max(hi, P.getY(i)); }
  for (let i = 0; i < P.count; i++) { const t = (P.getY(i) - S.at(0, 0).y + .02) / (hmax + .02), q = Math.max(0, Math.min(1, t)); const c = new THREE.Color().setRGB(.55 + .45 * q, .08 + .62 * q ** 1.4, .02 + .2 * q ** 3, THREE.SRGBColorSpace).multiplyScalar(1.6); col.push(c.r, c.g, c.b); }
  g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3)); return g; }
// a crescent, horns up, standing on the brow
function crescent(R, w) { const s = new THREE.Shape(), r2 = R * .86, dy = R * .55; // the inner circle's centre above the outer's
  const a = Math.acos((R * R + dy * dy - r2 * r2) / (2 * R * dy)); // where the two circles cross, as an angle on the outer from straight up
  s.absarc(0, 0, R, Math.PI / 2 + a, Math.PI * 2 + Math.PI / 2 - a, false);
  const b = Math.PI - Math.acos((r2 * r2 + dy * dy - R * R) / (2 * r2 * dy)); s.absarc(0, dy, r2, Math.PI / 2 - b + Math.PI * 2, Math.PI / 2 + b, true);
  const g = new THREE.ExtrudeGeometry(s, { depth: w, bevelEnabled: true, bevelThickness: .002, bevelSize: .002, bevelSegments: 1, curveSegments: 18 }); g.translate(0, 0, -w / 2); return g; }
function halo(S, F, r, rays) { const gs = [], ctr = new THREE.Vector3(0, F.crown - .01, F.back - .045); const ring = new THREE.TorusGeometry(r, .0055, 6, 72); ring.translate(ctr.x, ctr.y, ctr.z); gs.push(ring);
  const ring2 = new THREE.TorusGeometry(r * .78, .003, 5, 60); ring2.translate(ctr.x, ctr.y, ctr.z + .004); gs.push(ring2);
  for (let i = 0; i < rays; i++) { const a = i / rays * Math.PI * 2, long = i % 2 ? .035 : .07, cn = new THREE.ConeGeometry(.006, long, 4); cn.translate(0, r + long / 2 + .004, 0); cn.rotateZ(a); cn.translate(ctr.x, ctr.y, ctr.z); gs.push(cn); }
  return gs; }
function antler(S, side, F, scale = .72) { const base = S.at(side * .7, .55, -.004), gs = [], P = (x, y, z) => new THREE.Vector3(base.x + side * x * scale, base.y + y * scale, base.z + z * scale);
  const beam = [P(0, 0, 0), P(.03, .06, -.01), P(.07, .13, -.035), P(.09, .2, -.03), P(.08, .27, -.01)]; gs.push(taper(beam, s => .011 * (1 - .65 * s), 8, 22));
  for (const [f, dx, dy, dz] of [[.35, .045, .05, .045], [.6, .06, .06, -.02], [.85, -.02, .06, .03]]) { const cv = new THREE.CatmullRomCurve3(beam), p = cv.getPointAt(f); gs.push(taper([p, p.clone().add(new THREE.Vector3(side * dx * .5 * scale, dy * .5 * scale, dz * .5 * scale)), p.clone().add(new THREE.Vector3(side * dx * scale, dy * scale, dz * scale))], s => .0075 * (1 - .8 * s), 6, 10)); }
  return gs; }
// horns: from the temple, out and back, then forward and up (the great ram horns), or swept back (Obsidian)
function horn(S, side, kind) { const base = S.at(side * (kind === 'ram' ? 1.05 : 1.15), kind === 'ram' ? .75 : .7, -.006), P = (x, y, z) => new THREE.Vector3(base.x + side * x, base.y + y, base.z + z);
  if (kind === 'ram') return taper([P(0, 0, 0), P(.055, .04, -.03), P(.11, .055, -.07), P(.145, .1, -.06), P(.14, .16, -.01), P(.1, .19, .02)], s => .028 * (1 - s) ** .8 + .002, 12, 36);
  if (kind === 'back') return taper([P(0, 0, 0), P(.04, .05, -.05), P(.06, .08, -.13), P(.06, .1, -.21)], s => .019 * (1 - s) ** .9 + .0015, 10, 24);
  return taper([P(0, 0, 0), P(.025, .04, -.01), P(.04, .085, -.015), P(.045, .12, -.035)], s => .013 * (1 - s) ** .9 + .001, 8, 18); }

// the slats of the Wooden cap: six boards lashed round it, the crown plate over them
function slats(S, n) { const gs = []; for (let i = 0; i < n; i++) { const th = i / n * Math.PI * 2 + Math.PI / n, L = []; for (let k = 0; k <= 12; k++) L.push(S.at(th, .15 + (S.RIM(th) - .2) * k / 12, .003));
    gs.push(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(L), 12, .006, 4, false)); } return gs; }
function band(S, ph, off, w, th0 = 0, th1 = Math.PI * 2) { const L = []; for (let k = 0; k <= 72; k++) { const th = th0 + (th1 - th0) * k / 72; L.push(S.at(th, typeof ph === 'function' ? ph(th) : ph, off)); }
  return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(L, th1 - th0 > 6), 72, w, 5, th1 - th0 > 6); }

// the visor's slit: narrower than the shell's cells, so not cut but drawn, a dark band 2.2 cm high on the surface at the eyes, from
// θ0 to θ1, either side of a bar 1.6 cm wide (the slit's depth is the dark; the eyes behind it are not seen, as through a real one)
function slit(S, F, th0, th1) { const yAt = (th, y) => { let lo = .3, hi = 2.6; for (let k = 0; k < 22; k++) { const m = (lo + hi) / 2; if (S.at(th, m).y > y) lo = m; else hi = m; } return (lo + hi) / 2; };
  const pos = [], idx = [], n = 32, y0 = F.eye.y + .004 - .011, y1 = F.eye.y + .004 + .011;
  for (const [a, b] of [[th0, -.075], [.075, th1]]) { const k0 = pos.length / 3; for (let i = 0; i <= n; i++) { const th = a + (b - a) * i / n; for (const y of [y0, y1]) pos.push(...S.at(th, yAt(th, y), .0012).toArray()); }
    for (let i = 0; i < n; i++) { const q = k0 + i * 2; idx.push(q, q + 2, q + 1, q + 1, q + 2, q + 3); } }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals(); return g; }
// a strip down one meridian, from φ0 to φ1, standing `off` proud
function meridian(S, th, ph0, ph1, off, w) { const L = []; for (let k = 0; k <= 24; k++) L.push(S.at(th, ph0 + (ph1 - ph0) * k / 24, off)); return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(L), 24, w, 5, false); }
// merge each material's geometries into one mesh; the result in the head bone's frame
function assemble(parts, tier, S, F) { const by = {}; for (const [k, g] of parts) (by[k] = by[k] || []).push(g.index ? g.toNonIndexed() : g);
  const group = new THREE.Group(); group.name = 'tierHelm'; let tris = 0, draws = 0;
  for (const [k, gs] of Object.entries(by)) { const g = mergeAll(gs); const m = new THREE.Mesh(g, M(k, tier)); m.castShadow = k !== 'flame'; m.receiveShadow = true; group.add(m); tris += g.attributes.position.count / 3; draws++; }
  const bb = new THREE.Box3().setFromObject(group); return { group, tris: Math.round(tris), draws, size: bb.getSize(new THREE.Vector3()).toArray().map(v => +v.toFixed(3)), top: +(bb.max.y - F.crown).toFixed(3), gap: S ? +S.gap.toFixed(4) : null }; }
function mergeAll(gs) { let n = 0; for (const g of gs) n += g.attributes.position.count; const P = new Float32Array(n * 3), N = new Float32Array(n * 3), U = new Float32Array(n * 2), Cc = gs.some(g => g.attributes.color) ? new Float32Array(n * 3) : null; let o = 0;
  for (const g of gs) { if (!g.attributes.normal) g.computeVertexNormals(); const c = g.attributes.position.count; P.set(g.attributes.position.array, o * 3); N.set(g.attributes.normal.array, o * 3); if (g.attributes.uv) U.set(g.attributes.uv.array, o * 2); if (Cc && g.attributes.color) Cc.set(g.attributes.color.array, o * 3); o += c; }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(P, 3)); g.setAttribute('normal', new THREE.BufferAttribute(N, 3)); g.setAttribute('uv', new THREE.BufferAttribute(U, 2)); if (Cc) g.setAttribute('color', new THREE.BufferAttribute(Cc, 3)); return g; }

// the rims: a cap's above the ears; a full helm's at the chin in front and the nape behind
const capRim = F => th => { const f = Math.cos(th); return F.eye.y + .028 * Math.max(0, f) + .012 - .055 * Math.max(0, -f) ** 1.4; };
const fullRim = (F, d = .02, nape = -.085) => th => { const f = (1 - Math.cos(th)) / 2; return (F.chin - d) * (1 - f) + nape * f - .015 * Math.sin(th) ** 2; };

export function helm(tier, F, o = {}) { const T = TIERS[tier], bold = !!o.bold && tier >= 5, closed = !!o.closed && tier >= 5, parts = [], add = (k, g) => parts.push([k, g]);
  const rim = tier >= 5 && T.glow ? 'glow' : 'trim';
  let S;
  if (tier === 1) { S = shell(F, { cl: .016, bottom: capRim(F), smooth: 5, lip: .006 }); add('metal', S.g); add('trim', S.lip); slats(S, 8).forEach(g => add('trim', g)); add('trim', band(S, th => S.RIM(th) - .06, .002, .006)); }
  else if (tier === 2) { S = shell(F, { cl: .014, bottom: fullRim(F, .03, -.09), sd: face('T', F), smooth: 6, flare: .012 }); add('metal', S.g); add('trim', S.lip);
    // the horsehair: seven thin combs fanned 13 degrees either side about the keel, so it reads as a brush and not a board
    const cy = S.at(0, 0).y; for (let k = -3; k <= 3; k++) { const g = comb(S, .95, 1.35, s => (.03 + .085 * Math.sin(Math.PI * Math.min(1, s * 1.05)) ** .6) * (1 - .1 * Math.abs(k)), .005); g.translate(0, -cy, 0); g.rotateZ(k * .05); g.translate(0, cy, 0); add('crest', g); } add('trim', comb(S, .95, 1.3, () => .012, .008)); }
  else if (tier === 4) { S = shell(F, { cl: .02, bottom: fullRim(F, .045, -.1), smooth: 14, top: -.008 }); add('metal', S.g); add('trim', S.lip); add('dark', slit(S, F, -.75, .75));
    // the great helm's cross: a reinforce down the middle of the face and the brow band over the slit
    add('trim', band(S, 1.36, .003, .005, -1.05, 1.05)); add('trim', meridian(S, 0, .25, 1.5, .002, .009)); add('trim', meridian(S, 0, 1.64, S.RIM(0) - .04, .002, .009)); }
  else { // the magical tiers: an armet fitted closer, its face open (or shut behind a visor's slit), a keel along the top
    S = shell(F, { cl: closed ? .018 : .014, bottom: fullRim(F, closed ? .035 : .018, -.09), sd: closed ? null : face('open', F), smooth: closed ? 10 : 7, ridge: bold || tier < 5 ? .012 : .006, flare: .01 });
    add('metal', S.g); add(rim, S.lip); if (closed) { add('dark', slit(S, F, -.7, .7)); add(rim, meridian(S, 0, 1.64, S.RIM(0) - .03, .002, .006)); }
    // the brow band in the trim, and (plain) a low comb: OG-019's ladder, one shape, the tier in its colour and glow
    add('trim', band(S, 1.1, .002, .0045, -1.25, 1.25));
    if (!bold) add('trim', comb(S, .9, 1.4, s => .012 + .01 * Math.sin(Math.PI * s), .008));
    if (bold && tier === 5) { add('metal', fin(S, 1, { k: 3 })); add('metal', fin(S, -1, { k: 3 })); add('trim', comb(S, .8, 1.5, s => .014 + .03 * Math.sin(Math.PI * s) ** 2, .006)); }
    if (bold && tier === 6) { // Adamant: a crest of five leaf blades rising off the keel, the middle tallest
      for (let i = 0; i < 5; i++) { const ph = -.45 + i * .26, th = ph < 0 ? 0 : Math.PI, p = S.at(th, Math.abs(ph)), hgt = .06 + .05 * (1 - Math.abs(i - 2) / 2), lean = (i - 2) * -.15;
        const lf = []; for (let k = 0; k <= 10; k++) { const a = k / 10; lf.push([p.z + Math.sin(a * Math.PI) * .018 + lean * hgt * a, p.y - .008 + hgt * a]); } for (let k = 10; k >= 0; k--) { const a = k / 10; lf.push([p.z - Math.sin(a * Math.PI) * .018 + lean * hgt * a, p.y - .008 + hgt * a]); }
        add('trim', plate(lf, .005)); } }
    if (bold && tier === 7) { add('horn', horn(S, 1, 'back')); add('horn', horn(S, -1, 'back')); add('metal', comb(S, .5, 1.7, s => .012 + .065 * Math.sin(Math.PI * Math.min(1, s * 1.08)) ** 1.6, .008)); add('glow', comb(S, .72, 1.5, () => .004, .007)); }
    if (bold && tier === 8) { add('flame', flames(S, .85, 1.55, 5, .12)); add('trim', comb(S, .9, 1.6, () => .01, .02)); }
    if (bold && tier === 9) { add('horn', horn(S, 1, 'ram')); add('horn', horn(S, -1, 'ram')); add('glow', comb(S, .75, 1.3, () => .005, .006)); }
    if (bold && tier === 10) { const cr = crescent(.055, .007), p = S.at(0, .62); cr.rotateX(-.2); cr.translate(0, p.y + .03, p.z + .004); add('trim', cr); halo(S, F, .17, 16).forEach(g => add('glow', g)); }
  }
  return assemble(parts, tier, S, F); }

// the robe line's hood dressings (OG-052's antlered and haloed hoods): the hood is the kit's; these are pieces placed over it, on a
// shell read off the hood itself (no face cut, nothing drawn of the shell)
export function hoodDress(tier, F, o = {}) { const parts = [], add = (k, g) => parts.push([k, g]), S = shell(F, { cl: 0, bottom: capRim(F), smooth: 4 });
  const ring = () => add('trim', band(S, th => .78 + .12 * Math.max(0, Math.cos(th)), -.003, .004, -1.3, 1.3));
  if (!o.bold) { if (tier >= 5) ring(); }
  else if (tier === 6) { antler(S, 1, F).forEach(g => add('antler', g)); antler(S, -1, F).forEach(g => add('antler', g)); }
  else if (tier === 9) { add('horn', horn(S, 1, 'small')); add('horn', horn(S, -1, 'small')); ring(); }
  else if (tier === 10) { halo(S, F, .15, 12).forEach(g => add('glow', g)); ring(); }
  else if (tier === 8) { const p = S.at(0, .72); const cr = crescent(.03, .005); cr.translate(0, p.y + .012, p.z); add('trim', cr); ring(); }
  else if (tier >= 5) ring();
  if (!parts.length) return null; return assemble(parts, tier, null, F); }
