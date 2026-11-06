// The bind (the concept artist, 5 Nov 2026; backlog L7, "The bind"; OG-045, OG-063, with OG-011 and OG-127's riposte): what the beat
// after a perfect parry looks like, posed on two people of people.js at their true size. One unit is one metre.
//
// combat.md (B, the loop of fights you learn) gives the perfect parry its rule: it drains 40% of the foe's posture and opens a riposte
// for 0.8 s. What it does not say is what the two bodies do in that beat. OG-045 and OG-063 draw it as a bind: blades crossed high, both
// fighters leaning in, the player's off hand cocked low behind him with a spell charging in it, released into the foe at arm's length
// (OG-011: "steel and magic in one beat"). The three poses here are the question (BIND_POSES):
//   'deflect' (A) the parry beats the blade aside: the foe's sword flung out wide and low to its right, the foe rocked back on its heels,
//                 the player's blade across its own body at the chest, weight forward. No contact held; the riposte opens at once.
//   'bind'    (B) OG-045 without the spell: the blades meet and hold, crossed high over the heads at the middle of the blades, both
//                 fighters leaning in from the hips; the foe's shield held low. The off hand empty, out for balance.
//   'spell'   (C) B with the off hand cocked low behind the hip, palm up, a spell of the school charging in it (a light of its colour on
//                 both bodies), the release the riposte. Shown only when a spell is readied; otherwise C is B.
// The poses are the people kit's own skeleton turned (musicians.js's way: a two-bone arm reached to a grip, the hand turned and curled),
// so every garment that is skinned follows, and a builder can lift them as three key poses for hbPose (32-people.js) or tpHBPose.
//
// bindPose(P, role, pose, o) poses a person made by makePerson standing at the origin facing +z, its partner at +z o.gap away (1.3 m);
// role 'player' or 'foe'. It hangs the sword (and, for C, the spell) on the person's root and returns { cross, tip, miss, tris }: the
// point where the blades meet (in the person's frame), where its tip is, how far each hand fell short of its grip (0 when it reached).
import * as THREE from 'three';

const V = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
const C = (r, g, b) => new THREE.Color().setRGB(r, g, b, THREE.SRGBColorSpace);
export const BIND_POSES = { deflect: 'A, the deflect: the blade beaten aside', bind: 'B, the bind: blades crossed high, both leaning in', spell: 'C, the bind with the spell cocked low behind' };
export const SPELL_COLOURS = { tine: [1.0, .42, .12], uisce: [.35, .72, 1.0], cloch: [.86, .62, .3], scath: [.66, .34, 1.0], solas: [1.0, .9, .6], gaoth: [.7, .95, 1.0] };

// ——— the sword: an arming sword of the Gatelands, 0.94 m whole: a blade of 0.78 m (4.6 cm at the guard, a fuller two thirds of its length),
// a crossguard of 20 cm, a grip of 11 cm bound in leather, a wheel pommel. Its frame: the grip's middle at the origin, the blade up +y, the
// edges along x, the flats facing z.
let TRI = 0;
function count(g) { let t = 0; g.traverse(o => { if (o.isMesh) { const gg = o.geometry; t += (gg.index ? gg.index.count : gg.attributes.position.count) / 3; } }); return t; }
export function sword(o = {}) {
  const g = new THREE.Group(), steel = new THREE.MeshStandardMaterial({ color: C(.86, .87, .9), metalness: .55, roughness: .3, emissive: C(.1, .1, .11) }), dark = new THREE.MeshStandardMaterial({ color: C(.32, .3, .28), metalness: .8, roughness: .4 });
  const leather = new THREE.MeshStandardMaterial({ color: C(...(o.grip || [.24, .14, .08])), roughness: .8 });
  // the blade: a lens in section, tapering to the point; the fuller a shallow dark groove on each face
  const L = .78, w0 = .046, w1 = .03, t0 = .0065, ns = 24, P = [], I = [];
  const sec = [[1, 0], [.45, .5], [0, 1], [-.45, .5], [-1, 0], [-.45, -.5], [0, -1], [.45, -.5]], m = sec.length;
  for (let i = 0; i <= ns; i++) { const s = i / ns, y = s * L, ws = s < .82 ? w0 + (w1 - w0) * s / .82 : w1 * Math.max(0, (1 - s) / .18) ** .8, ts = t0 * (1 - .55 * s);
    for (const [a, b] of sec) P.push(a * ws / 2, y, b * ts / 2); }
  for (let i = 0; i < ns; i++) for (let j = 0; j < m; j++) { const a = i * m + j, b = i * m + (j + 1) % m, c = a + m, d = b + m; I.push(a, c, b, b, c, d); }
  const bg = new THREE.BufferGeometry(); bg.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); bg.setIndex(I); bg.computeVertexNormals(); bg.translate(0, .075, 0);
  const blade = new THREE.Mesh(bg, steel); g.add(blade);
  for (const sz of [-1, 1]) { const f = new THREE.Mesh(new THREE.PlaneGeometry(.011, L * .62), dark); f.position.set(0, .075 + L * .33, sz * t0 * .48); if (sz < 0) f.rotation.y = Math.PI; g.add(f); }
  const guard = new THREE.Mesh(new THREE.BoxGeometry(.2, .018, .022), dark); guard.position.y = .066; g.add(guard);
  for (const sx of [-1, 1]) { const k = new THREE.Mesh(new THREE.SphereGeometry(.014, 10, 8), dark); k.position.set(sx * .1, .066, 0); g.add(k); }
  const gripM = new THREE.Mesh(new THREE.CylinderGeometry(.0145, .016, .115, 12), leather); g.add(gripM);
  const pom = new THREE.Mesh(new THREE.CylinderGeometry(.03, .03, .018, 18).rotateX(Math.PI / 2), dark); pom.position.y = -.075; g.add(pom);
  g.traverse(x => { if (x.isMesh) { x.castShadow = true; x.receiveShadow = true; } });
  g.userData = { tris: count(g), length: .075 + L + .084, blade: L, tip: .075 + L };
  return g;
}

// ——— the spell held in the off hand: a core of the school's colour, a shell of motes turning round it, a light that falls on both bodies
export function spellBall(school = 'uisce') {
  const col = new THREE.Color(...(SPELL_COLOURS[school] || SPELL_COLOURS.uisce)), g = new THREE.Group();
  const core = new THREE.Mesh(new THREE.IcosahedronGeometry(.045, 2), new THREE.MeshBasicMaterial({ color: col.clone().lerp(new THREE.Color(1, 1, 1), .55), toneMapped: false })); g.add(core);
  const halo = new THREE.Mesh(new THREE.SphereGeometry(.085, 20, 14), new THREE.MeshBasicMaterial({ color: col.clone().multiplyScalar(1.6), transparent: true, opacity: .2, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false })); g.add(halo);
  // arcs: short bright strokes leaping off the core (OG-011's "crackling"), seeded so a still is the same twice
  let s = 7; const r = () => (s = (s * 16807) % 2147483647) / 2147483647, pts = [];
  for (let k = 0; k < 14; k++) { let p = V(r() - .5, r() - .5, r() - .5).normalize().multiplyScalar(.05); for (let j = 0; j < 3; j++) { const q = p.clone().add(V(r() - .5, r() - .5, r() - .5).multiplyScalar(.05)).add(p.clone().normalize().multiplyScalar(.03)); pts.push(p, q); p = q; } }
  const arcs = new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(pts), new THREE.LineBasicMaterial({ color: col.clone().lerp(new THREE.Color(1, 1, 1), .4).multiplyScalar(1.4), transparent: true, opacity: .9, blending: THREE.AdditiveBlending, toneMapped: false })); g.add(arcs);
  const light = new THREE.PointLight(col, .9, 3, 1.8); g.add(light);
  g.userData = { light, tris: count(g), tick: t => { arcs.rotation.set(t * 2.1, t * 3.3, 0); halo.scale.setScalar(1 + .12 * Math.sin(t * 9)); } };
  return g;
}

// ——— sparks where the blades meet: forty short strokes thrown out along the struck edge, hot at the root, and a small warm light
export function sparks(seed = 3, k = 1) {
  let s = seed * 7919 + 1; const r = () => (s = (s * 16807) % 2147483647) / 2147483647, P = [], Cc = [];
  for (let i = 0; i < 46 * k; i++) { const d = V(r() - .5, r() * .9 - .25, r() - .5).normalize(), a = .02 + r() * .05, b = a + .04 + r() * .16 * k; P.push(...d.clone().multiplyScalar(a).toArray(), ...d.clone().multiplyScalar(b).toArray()); Cc.push(1.8, 1.3, .6, 1.2, .45, .1); }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(Cc, 3));
  const G = new THREE.Group(); G.add(new THREE.LineSegments(g, new THREE.LineBasicMaterial({ vertexColors: true, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false })));
  G.add(new THREE.Mesh(new THREE.SphereGeometry(.03, 10, 8), new THREE.MeshBasicMaterial({ color: new THREE.Color(2, 1.5, .8), toneMapped: false })));
  const l = new THREE.PointLight(new THREE.Color(1, .72, .4), 1.6 * k, 3, 1.6); G.add(l); return G;
}

// ——— the skeleton's helpers (musicians.js's, Session of 19 Oct: the same reach, orient and curl)
const wp = b => new THREE.Vector3().setFromMatrixPosition(b.matrixWorld);
const wq = b => b.getWorldQuaternion(new THREE.Quaternion());
function setWorldQ(b, q) { b.quaternion.copy(wq(b.parent).invert().multiply(q)); b.updateMatrixWorld(true); }
function aim(b, from, to) { setWorldQ(b, new THREE.Quaternion().setFromUnitVectors(from.clone().normalize(), to.clone().normalize()).multiply(wq(b))); }
function turn(b, axis, ang) { setWorldQ(b, new THREE.Quaternion().setFromAxisAngle(axis.clone().normalize(), ang).multiply(wq(b))); }
function frame(o, y, z) { const Y = y.clone().normalize(), Z = z.clone().addScaledVector(Y, -z.dot(Y)).normalize(), X = Y.clone().cross(Z); return new THREE.Matrix4().makeBasis(X, Y, Z).setPosition(o); }
function reach(P, s, T, pole) { const Bn = P.byName, ua = Bn['upperarm01.' + s], la = Bn['lowerarm01.' + s], wr = Bn['wrist.' + s]; P.root.updateMatrixWorld(true);
  const S = wp(ua), E = wp(la), Wr = wp(wr), a = S.distanceTo(E), b = E.distanceTo(Wr), D = T.clone().sub(S); let d = D.length(); const want = d; d = Math.min(a + b - 1e-3, Math.max(Math.abs(a - b) + 1e-3, d)); D.normalize();
  const x = (a * a - b * b + d * d) / (2 * d), h = Math.sqrt(Math.max(0, a * a - x * x)), pl = pole.clone().addScaledVector(D, -pole.dot(D)).normalize(), E2 = S.clone().addScaledVector(D, x).addScaledVector(pl, h);
  aim(ua, E.clone().sub(S), E2.clone().sub(S)); P.root.updateMatrixWorld(true); const E3 = wp(la), W3 = wp(wr); aim(la, W3.sub(E3), S.clone().addScaledVector(D, d).sub(E3)); P.root.updateMatrixWorld(true);
  return +(want - d).toFixed(3); }
function handNow(P, s) { const Bn = P.byName, w = wp(Bn['wrist.' + s]), f = wp(Bn['finger3-1.' + s]).sub(w).normalize(), k = wp(Bn['finger2-1.' + s]).sub(wp(Bn['finger5-1.' + s])).normalize();
  const n = (s === 'L' ? f.clone().cross(k) : k.clone().cross(f)).normalize(); return { w, f, n, k, len: wp(Bn['finger3-1.' + s]).distanceTo(w) }; }
function orient(P, s, F, N) { const h = handNow(P, s), cur = frame(V(), h.f, h.n), des = frame(V(), F, N), R = new THREE.Quaternion().setFromRotationMatrix(des.multiply(cur.transpose()));
  setWorldQ(P.byName['wrist.' + s], R.multiply(wq(P.byName['wrist.' + s]))); }
function curl(P, s, k, kt = 0) { const Bn = P.byName; P.root.updateMatrixWorld(true); const hinge = wp(Bn['finger2-1.' + s]).sub(wp(Bn['finger5-1.' + s])).normalize().applyQuaternion(wq(Bn['metacarpal2.' + s]).invert()), sg = s === 'L' ? -1 : 1;
  for (let f = 2; f <= 5; f++) for (let j = 1; j <= 3; j++) { const b = Bn[`finger${f}-${j}.${s}`]; if (b) b.quaternion.setFromAxisAngle(hinge, sg * k * [1.15, 1.35, .95][j - 1] * (1 + (f - 2) * .06)); }
  if (kt) for (let j = 2; j <= 3; j++) { const b = Bn[`finger1-${j}.${s}`]; if (b) b.quaternion.multiply(new THREE.Quaternion().setFromAxisAngle(V(0, 0, 1), -sg * kt * .5)); } P.root.updateMatrixWorld(true); }
function grip(P, s, G, F, N, pole, k = .8, kt = 0) { const h0 = handNow(P, s), off = h0.len * .62; let miss = 0;
  for (let it = 0; it < 4; it++) { const T = G.clone().addScaledVector(F.clone().normalize(), -off).addScaledVector(N.clone().normalize(), -.022); miss = reach(P, s, T, pole); orient(P, s, F, N); }
  curl(P, s, k, kt); return miss; }
// a fist round a grip whose blade runs along D (the index finger's side, as a sword is held): the fingers square to D, the palm's face
// from k × f (the right hand) or f × k (the left)
function fist(P, s, G, D, fHint, pole, k = .95) { const Dn = D.clone().normalize(), f = fHint.clone().addScaledVector(Dn, -fHint.dot(Dn)).normalize(), n = s === 'L' ? f.clone().cross(Dn) : Dn.clone().cross(f);
  const miss = grip(P, s, G, f, n, pole, k, .7);
  // then the wrist turned so the hand's own line lies along D (the reach leaves it a few degrees off), and the arm reached again
  for (let it = 0; it < 3; it++) { const h = handNow(P, s); setWorldQ(P.byName['wrist.' + s], new THREE.Quaternion().setFromUnitVectors(h.k, Dn).multiply(wq(P.byName['wrist.' + s]))); P.root.updateMatrixWorld(true);
    const p = palm(P, s); reach(P, s, wp(P.byName['wrist.' + s]).add(G.clone().sub(p.o)), pole); const h2 = handNow(P, s); setWorldQ(P.byName['wrist.' + s], new THREE.Quaternion().setFromUnitVectors(h2.k, Dn).multiply(wq(P.byName['wrist.' + s]))); P.root.updateMatrixWorld(true); }
  return miss; }
// the palm where a hand is now (what grip() aims at), and its blade's line (pinky to index)
function palm(P, s) { const h = handNow(P, s); return { o: h.w.clone().addScaledVector(h.f, h.len * .62).addScaledVector(h.n, .022), k: h.k, f: h.f, n: h.n }; }

// the body: a lean from the hips (spine05 the most, the chest a little), the head brought back up to the foe; the feet set a stride apart,
// the sword side forward, the knees soft; then the root lowered or raised so the lower sole stands on y 0
function stance(P, o) { const Bn = P.byName, X = V(1, 0, 0), Y = V(0, 1, 0); P.root.updateMatrixWorld(true);
  const ankle0 = Math.min(wp(Bn['foot.L']).y, wp(Bn['foot.R']).y), side = wp(Bn['upperarm01.R']).x < 0 ? 'R' : 'L', other = side === 'R' ? 'L' : 'R';
  const leg = (s, thigh, knee, out = 0) => { turn(Bn['upperleg01.' + s], X, thigh); if (out) turn(Bn['upperleg01.' + s], V(0, 0, 1), out); turn(Bn['lowerleg01.' + s], X, knee); turn(Bn['foot.' + s], X, -(thigh + knee) * .9); };
  leg('R', -o.front, o.frontKnee, -.05); leg('L', o.back, o.backKnee, .06);
  if (o.twist) turn(Bn['spine05'], Y, o.twist);
  turn(Bn['spine05'], X, o.lean * .55); turn(Bn['spine03'], X, o.lean * .3); turn(Bn['spine01'], X, o.lean * .15);
  if (o.side) { turn(Bn['spine03'], V(0, 0, 1), o.side); }
  turn(Bn['neck01'] || Bn['neck'], X, -o.lean * .55 + (o.chin || 0)); P.root.updateMatrixWorld(true);
  const foot = Math.min(wp(Bn['foot.L']).y, wp(Bn['foot.R']).y); P.root.position.y += ankle0 - foot; P.root.updateMatrixWorld(true);
  return { side, other }; }

// the pose, in the person's own frame (standing at the origin facing +z, the partner at +z gap away)
export function bindPose(P, role, pose, o = {}) {
  const root = P.root, gap = o.gap ?? 1.3, Bn = P.byName; root.position.set(0, root.position.y, 0); root.rotation.set(0, 0, 0); root.updateMatrixWorld(true);
  const foe = role === 'foe', S = {
    deflect: foe ? { lean: -.22, front: .12, frontKnee: .2, back: .34, backKnee: .3, twist: .38, side: .05, chin: .1 } : { lean: .2, front: .42, frontKnee: .48, back: .3, backKnee: .12, twist: -.22 },
    bind: { lean: .24, front: .36, frontKnee: .42, back: .32, backKnee: .1, twist: -.12 },
    spell: foe ? { lean: .24, front: .36, frontKnee: .42, back: .32, backKnee: .1, twist: -.12 } : { lean: .26, front: .4, frontKnee: .46, back: .34, backKnee: .1, twist: -.3 } }[pose];
  stance(P, S);
  const shR = wp(Bn['upperarm01.R']), shL = wp(Bn['upperarm01.L']), rs = Math.sign(shR.x) || -1, hipY = wp(Bn['spine05']).y, out = { miss: [] };
  // the cross: over the middle of the gap, as high as the taller head (OG-045: "blades crossed high"); each blade passes it 1 cm to its own
  // side of the other, so the steel touches and does not pass through
  const crossY = o.crossY ?? (shR.y + .48), cross = V(.005 * rs, crossY, gap / 2), down = V(0, -1, 0), back = V(0, 0, -1);
  let G, D;
  if (pose === 'deflect') {
    if (!foe) { G = V(rs * .0, shR.y - .12, .46); D = V(-rs * .8, .55, .25); }   /* across the chest, the point up and out to the off side */
    else { G = V(rs * .6, shR.y - .3, .12); D = V(rs * .85, -.2, -.15); }      /* flung wide and low to its sword side */
  } else { G = V(rs * .26, shR.y + .2, .34); D = cross.clone().sub(G); G.addScaledVector(D.clone().normalize(), 0); }
  const fHint = pose === 'deflect' && foe ? V(0, -.3, 1) : V(0, .1, 1), pole = pose === 'deflect' && foe ? V(rs, -1, -.6) : V(rs * 1, -1, -.2);
  out.miss.push(fist(P, 'R', G, D, fHint, pole));
  // the sword in the hand: its grip's middle on the palm, the blade along the hand's own line (pinky to index), its edge toward the knuckles
  const pm = palm(P, 'R'), sw = sword(o.sword), M = frame(pm.o, pm.k, pm.n), inv = root.matrixWorld.clone().invert();
  sw.matrixAutoUpdate = false; sw.matrix.copy(inv.clone().multiply(M)); root.add(sw); out.tris = sw.userData.tris;
  out.palm = pm.o.clone(); out.dir = pm.k.clone(); out.tip = pm.o.clone().addScaledVector(pm.k, sw.userData.tip); out.cross = pose === 'deflect' ? pm.o.clone().addScaledVector(pm.k, .7) : cross.clone();
  out.bladeAt = pm.o.clone().addScaledVector(pm.k, sw.userData.tip * .5);
  // how far the blade's line passes from the cross (0 when it goes through it)
  { const t = cross.clone().sub(pm.o).dot(pm.k); out.crossMiss = +pm.o.clone().addScaledVector(pm.k, t).distanceTo(cross).toFixed(3); out.crossAt = +t.toFixed(3); }
  // the off hand
  if (foe) {
    // the shield's arm: the forearm across the body at the waist (B, C), or thrown out behind (A)
    if (pose === 'deflect') out.miss.push(grip(P, 'L', V(-rs * .5, shL.y - .3, .12), V(-rs * .4, -.6, .5), V(-rs * .2, 0, 1), V(-rs, -.4, -1), .7));
    else out.miss.push(grip(P, 'L', V(-rs * .05, hipY + .16, .4), V(rs * .9, .25, 0), V(0, 0, 1), V(-rs, -.6, -.3), .85));
  } else if (pose === 'spell') {
    // C: cocked low behind the hip, the elbow back, the palm up and a little forward, the fingers half open round the charge
    const H = V(-rs * .3, hipY - .02, -.2); out.miss.push(grip(P, 'L', H, V(0, .1, 1), V(-rs * .15, 1, .25), V(-rs * .4, .2, -1), .38, .1));
    const h = palm(P, 'L'), sp = spellBall(o.school), Ms = new THREE.Matrix4().makeTranslation(...h.o.clone().addScaledVector(h.n, .07).toArray());
    sp.matrixAutoUpdate = false; sp.matrix.copy(inv.clone().multiply(Ms)); root.add(sp); out.spell = sp; out.tris += sp.userData.tris;
  } else {
    // A and B: the off hand out low for balance, half closed
    const H = pose === 'deflect' ? V(-rs * .42, hipY + .02, .12) : V(-rs * .36, hipY - .05, .0); out.miss.push(grip(P, 'L', H, V(0, -.7, .7), V(rs * .9, 0, .3), V(-rs, 0, -1), .5, .2));
  }
  root.updateMatrixWorld(true); return out;
}

// the skeleton helpers, for impacts.js (the concept artist, 6 Nov 2026): the same reach, fist and stance, to pose a blow at its contact
export { fist, palm, stance, grip, wp };
