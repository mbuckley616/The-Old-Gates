// Creatures from parts (Session 772). A body plan is a short list of parts (a spine, a neck and head, a tail, arms,
// wings, any number of leg pairs), and each part adds bones and flesh. The flesh is grown around the bones as one smooth
// surface; the skin weights are read off the same flesh; one gait engine walks any number of legs. Every creature here
// is data (PLANS, at the foot): adding one is adding an entry, not writing code. docs/design/character-builder.md,
// "Body plans from parts". Units are metres; a body faces +z with its left side at +x.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { ImprovedNoise } from 'three/addons/math/ImprovedNoise.js';

const V = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
const UP = V(0, 1, 0), DEG = Math.PI / 180;
const lerp = (a, b, t) => a + (b - a) * t;
const sstep = (a, b, x) => { const t = Math.max(0, Math.min(1, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
// a value along a list read as a polyline over 0..1 (radii along a chain)
const along = (arr, t) => { if (!Array.isArray(arr)) return arr; if (arr.length === 1) return arr[0]; const f = Math.max(0, Math.min(1, t)) * (arr.length - 1), i = Math.min(arr.length - 2, Math.floor(f)); return lerp(arr[i], arr[i + 1], f - i); };
const PN = new ImprovedNoise();

// ── seeds: a creature's looks come from a key of place and index (the co-op rule), never Math.random ──
export function hashKey(s) { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
export function rng(seed) { let a = seed >>> 0; return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

// ── the body under construction: bones, flesh (tapered capsules), rigid bits, and what the gait needs ──
// Every bone's rest rotation is the identity, so a bone's rest direction is simply the offset to its child.
class Body {
  constructor(plan, g) { this.plan = plan; this.g = g; this.S = g.sliders.size; this.bones = []; this.by = {}; this.flesh = []; this.bits = []; this.legs = []; this.arms = []; this.wings = []; this.chains = {}; this.nGroup = 0; this.sheets = []; this.tubes = []; this.radials = []; this.fins = []; }
  bone(name, parent, p) { const b = { name, parent: parent ? this.by[parent] : null, p: p.clone(), i: this.bones.length }; this.bones.push(b); this.by[name] = b; return b; }
  chain(name, parent, pts) { const names = []; let par = parent; pts.forEach((p, k) => { const n = name + k; this.bone(n, par, p); names.push(n); par = n; }); this.chains[name] = names; return names; }
  // flesh: a tapered capsule a→b on a bone; capsules sharing a group join hard (one limb), groups join smoothly
  meat(bone, a, b, ra, rb, o = {}) { const k = this.g.sliders.bulk; this.flesh.push({ bone: this.by[bone].i, a: a.clone(), b: b.clone(), ra: ra * k, rb: (rb ?? ra) * k, s: o.s || [1, 1, 1], tone: o.tone || 'coat', group: o.group ?? ('m' + this.nGroup++) }); }
  // a rigid bit (an eye, a claw, an antler) hung on a bone; `obj` is placed in body space at rest
  bit(bone, obj) { this.bits.push({ bone, obj }); return obj; }
}

// ── the parts. Each reads its options in metres at size 1; the generic sliders (leg, neck, tail, head, bulk) act here ──
const P = {};
// the spine, hips at the back (t = 0) to chest at the front (t = 1). The leg slider raises it: y' = r + (y - r) * leg.
P.spine = (B, o) => {
  const L = B.g.sliders.leg, r0 = along(o.r, 0), r1 = along(o.r, 1), raise = (y, r) => r + (y - r) * L;
  const hip = V(0, raise(o.hip[0], r0), o.hip[1]), chest = V(0, raise(o.chest[0], r1), o.chest[1]), n = o.n || 4, s = [o.s?.[0] ?? 1, o.s?.[1] ?? 1, 1];
  const pts = []; for (let k = 0; k < n; k++) { const t = k / (n - 1), p = hip.clone().lerp(chest, t); p.y += (o.arch || 0) * Math.sin(Math.PI * t); pts.push(p); }
  const names = B.chain('spine', null, pts), R = t => along(o.r, t);
  for (let k = 0; k < n - 1; k++) B.meat(names[k], pts[k], pts[k + 1], R(k / (n - 1)), R((k + 1) / (n - 1)), { s, group: 'spine', tone: o.tone });
  B.meat(names[0], hip, hip.clone().add(V(0, -(o.rumpDrop || 0), -(o.rump || 0))), r0, r0 * (o.rumpTaper ?? .85), { s, group: 'spine', tone: o.tone });
  B.meat(names[n - 1], chest, chest.clone().add(V(0, -(o.frontDrop || 0), o.front || 0)), r1, r1 * (o.frontTaper ?? .85), { s, group: 'spine', tone: o.tone });
  if (o.hump) { const t = o.hump.at, k = Math.min(n - 2, Math.floor(t * (n - 1))), c = hip.clone().lerp(chest, t); c.y += o.hump.up; B.meat(names[k], c.clone().add(V(0, 0, -o.hump.len / 2)), c.clone().add(V(0, 0, o.hump.len / 2)), o.hump.r, o.hump.r * .8, { s: [o.hump.sx || .8, 1, 1] }); }
  B.spinePts = pts; B.spineNames = names; B.spineR = R; B.spineS = s;
  B.spineAt = t => { const f = Math.max(0, Math.min(1, t)) * (n - 1), i = Math.min(n - 2, Math.floor(f)); return { bone: names[Math.round(f)], p: pts[i].clone().lerp(pts[i + 1], f - i), r: R(t) }; };
  B.front = chest.clone().add(V(0, -(o.frontDrop || 0) * .5, (o.front || 0) * .6)); B.back = hip.clone().add(V(0, -(o.rumpDrop || 0) * .5, -(o.rump || 0) * .6));
};
// the neck: from the chest's front, n bones rising at `rise` degrees and bending by `curve` over its length
P.neck = (B, o) => {
  const len = o.len * B.g.sliders.neck, n = o.n || 2, p0 = B.front.clone().add(V(0, o.up || 0, o.fwd || 0)), pts = [p0];
  for (let k = 0; k < n; k++) { const a = (o.rise + (o.curve || 0) * (k + .5) / n) * DEG; pts.push(pts[k].clone().add(V(0, Math.sin(a), Math.cos(a)).multiplyScalar(len / n))); }
  const names = B.chain('neck', B.spineNames[B.spineNames.length - 1], pts.slice(0, n));
  for (let k = 0; k < n; k++) B.meat(names[k], pts[k], pts[k + 1], along(o.r, k / n), along(o.r, (k + 1) / n), { s: [o.s?.[0] ?? 1, o.s?.[1] ?? 1, 1], group: 'neck', tone: o.tone });
  B.neckEnd = pts[n]; B.neckBone = names[n - 1]; B.neckPts = pts; B.neckR = t => along(o.r, t); B.neckS = [o.s?.[0] ?? 1, o.s?.[1] ?? 1];
};
// the head: a skull, a muzzle and a jaw; eyes, ears, horns and antlers are bits on it
P.head = (B, o) => {
  const S = B.g.sliders.head, len = o.len * S, r = o.r * S, base = (B.neckEnd || B.front).clone(), parent = B.neckBone || B.spineNames[B.spineNames.length - 1];
  const pitch = (o.pitch || 0) * DEG, dir = V(0, -Math.sin(pitch), Math.cos(pitch)), up = V(0, Math.cos(pitch), Math.sin(pitch)), s = o.s || [1, 1, 1];
  B.bone('head', parent, base);
  B.meat('head', base, base.clone().addScaledVector(dir, len * .42), r, r * .92, { s, tone: o.tone });
  const m = o.muzzle; if (m) { const a = base.clone().addScaledVector(dir, len * .35), b = base.clone().addScaledVector(dir, len).addScaledVector(up, -(m.drop || 0) * len);
    B.meat('head', a, b, m.r * S, m.r * S * (m.taper ?? .62), { s: m.s || s, tone: o.tone });
    if (m.nose) B.bit('head', ball(m.r * S * .42, B.tone('dark'), b.clone().addScaledVector(dir, m.r * S * .35).addScaledVector(up, m.r * S * .25), .35)); }
  if (o.jaw) { const j = base.clone().addScaledVector(dir, len * .3).addScaledVector(up, -r * .5); B.bone('jaw', 'head', j);
    B.meat('jaw', j, base.clone().addScaledVector(dir, len * o.jaw.len).addScaledVector(up, -r * o.jaw.drop), o.jaw.r * S, o.jaw.r * S * .55, { tone: o.tone }); }
  B.headFrame = { base, dir, up, len, r };
  const at = (f, u, x) => base.clone().addScaledVector(dir, len * f).addScaledVector(up, r * u).add(V(r * x, 0, 0));
  if (o.skull) skullBits(B, o, S * (o.skull.k || 1), base, dir, up);
  else for (const e of o.eyes || []) for (const sd of [1, -1]) B.bit('head', eye(e.r * S, e.color, at(e.f, e.up, e.out * sd)));
  if (o.ears) for (const sd of [1, -1]) B.bit('head', ear(o.ears, S, B.tone(o.ears.tone || o.tone || 'coat'), at(o.ears.f, o.ears.up, o.ears.out * sd), sd));
  if (o.horns) for (const sd of [1, -1]) B.bit('head', horn(o.horns, S, B.tone(o.horns.tone || 'horn'), at(o.horns.f, o.horns.up, o.horns.out * sd), sd));
  if (o.antlers) for (const sd of [1, -1]) { const m = B.bit('head', antler(o.antlers, S, B.tone('horn'), at(o.antlers.f, o.antlers.up, o.antlers.out * sd), sd, rng(B.g.seed + (sd > 0 ? 1 : 2))));
    if (o.antlers.mist) (B.mistTips ||= []).push(...m.userData.tips); }
  if (o.antlers?.mist) B.mist = { ...o.antlers.mist, tips: B.mistTips, color: B.tone(o.antlers.mist.tone || 'mist') };
  if (o.crystals) for (const sd of [1, -1]) B.bit('head', crystals(o.crystals, S, B.tone('horn'), at(o.crystals.f, o.crystals.up, o.crystals.out * sd), sd, rng(B.g.seed + (sd > 0 ? 3 : 4))));
  if (o.beak) B.bit('head', beak(o.beak, S, B.tone('horn'), at(1, o.beak.up || 0, 0), dir));
  // a throat sac (the Bellthroat's): a rigid ball under the jaw that the pose fills and empties
  if (o.sac) { const m = new THREE.Mesh(new THREE.SphereGeometry(o.sac.r * S, 24, 16), new THREE.MeshPhysicalMaterial({ color: B.tone('sac'), roughness: .25, clearcoat: .6, transmission: 0 })); m.position.copy(at(o.sac.f, -o.sac.drop, 0)); m.scale.set(1.15, .8, 1); B.bit('head', m); B.sac = m; }
  if (o.stalks) for (const sd of [1, -1]) { const p = at(o.stalks.f, o.stalks.up, o.stalks.out * sd); B.bit('head', claw(o.stalks.r * .5, o.stalks.len, B.tone('dark'), p.clone().addScaledVector(up, -o.stalks.len), up.clone()));
    B.bit('head', eye(o.stalks.r, o.stalks.color, p)); }
  // a brow (Session 927): a ridge of flesh across the skull over the eyes, grown into the head as one surface (the troll's)
  if (o.brow) B.meat('head', at(o.brow.f, o.brow.up, -o.brow.out), at(o.brow.f, o.brow.up, o.brow.out), o.brow.r * S, o.brow.r * S, { tone: o.tone });
  if (o.fangs) for (const sd of [1, -1]) B.bit('head', claw(o.fangs.r * S, o.fangs.len * S, B.tone('dark'), at(o.fangs.f, o.fangs.up, o.fangs.out * sd), V(0, -1, .4).normalize()));
};
// inclusions (Session 928): what a clear body has swallowed, seen through it (the slime's bones and rubble). Each is a rigid
// bit on the nearest spine bone, placed from the seed inside the body (never out of it): `rubble` a flat-faced stone,
// `bone` a long bone with its two knobs, `skull` a cranium with its eye holes
P.inclusions = (B, o) => { const r = rng(B.g.seed + 21);
  for (const [kind, n] of Object.entries(o.n)) for (let k = 0; k < n; k++) {
    let t, sp, p, sz; for (let tries = 0; tries < 16; tries++) { t = .08 + .84 * r(); sp = B.spineAt(t); const a = r() * Math.PI * 2, d = Math.sqrt(r()) * sp.r * (o.depth ?? .5); p = sp.p.clone().add(V(Math.cos(a) * d * B.spineS[0], Math.sin(a) * d * B.spineS[1] * .8, (r() - .5) * sp.r * .4)); sz = o.size * (.7 + .6 * r());
      if (!(B.holes || []).some(h => capDist(h, p.x, p.y, p.z) < sz * .7)) break; } // never hung in a hole (Session 954)
    let m;
    if (kind === 'rubble') { m = new THREE.Mesh(new THREE.DodecahedronGeometry(sz * .5, 0), stdMat(B.tone('rubble'), { rough: .95, flat: true })); m.scale.set(1, .6 + .4 * r(), .8 + .4 * r()); }
    else if (kind === 'bone') { const L = sz * 2.4, g = new THREE.CylinderGeometry(sz * .09, sz * .09, L, 7); for (const e of [1, -1]) { const k2 = new THREE.SphereGeometry(sz * .17, 8, 6); k2.translate(0, e * L / 2, 0); g.copy(mergeGeometries([g.toNonIndexed(), k2.toNonIndexed()])); }
      m = new THREE.Mesh(g, stdMat(B.tone('bone'), { rough: .7 })); }
    else { const g = new THREE.SphereGeometry(sz * .5, 14, 10); g.scale(.8, .85, 1); m = new THREE.Mesh(g, stdMat(B.tone('bone'), { rough: .7 }));
      for (const e of [1, -1]) { const h = ball(sz * .12, B.tone('dark'), V(e * sz * .16, sz * .06, sz * .42)); m.add(h); } }
    m.position.copy(p); m.rotation.set(r() * 6.3, r() * 6.3, r() * 6.3); B.bit(sp.bone, m); } };
// holes (Session 954, OG-041's slime: "with holes through it"): tunnels cut clean through the flesh, so daylight shows through the body.
// Each is a capsule across the body from flank to flank, `at` along the spine, `up` its height off the spine's line in the spine's
// radius there, `r` its radius, `tilt` degrees from level (its left end raised). The flesh grows as before and then is cut where a hole
// is (growFlesh); what a clear body holds keeps out of them (inclusions come after this part)
P.holes = (B, o) => { B.holes = B.holes || [];
  for (const h of o.list) { const sp = B.spineAt(h.at), c = sp.p.clone().add(V(0, h.up * sp.r * B.spineS[1], 0)), w = sp.r * B.spineS[0] * 2.2, tl = (h.tilt || 0) * DEG, d = V(Math.cos(tl), Math.sin(tl), Math.sin((h.yaw || 0) * DEG)).normalize();
    B.holes.push({ a: c.clone().addScaledVector(d, -w), b: c.clone().addScaledVector(d, w), ra: h.r, rb: h.r, s: [1, 1, 1], sm: 1, c, d, up: h.up, bone: sp.bone }); } };
// egg sacs (Session 929, OG-041's giant spider): a clutch of silk balls stuck to the underside of the tail (a spider's abdomen) toward
// its tip, each a lumpy wrapped sphere, half sunk into the hide, rigid on the tail bone it hangs from. `at` is the stretch of the tail
// they cover, `drop` how far down its girth they sit (1 is the skin's underside)
P.eggs = (B, o) => { const r = rng(B.g.seed + 41), pts = B.tailPts, n = pts.length - 1, by = {};
  for (let k = 0; k < o.n; k++) { const t = lerp(o.at[0], o.at[1], (k + .5 + (r() - .5) * .6) / o.n), f = t * n, i = Math.min(n - 1, Math.floor(f)), c = pts[i].clone().lerp(pts[i + 1], f - i);
    const R = B.tailR(t), a = (r() - .5) * 2 * (o.spread ?? .6), rad = o.r * (.75 + .5 * r()), g = new THREE.SphereGeometry(rad, 14, 10), q = g.attributes.position;
    for (let v = 0; v < q.count; v++) { const x = q.getX(v), y = q.getY(v), z = q.getZ(v), w = 1 + .12 * PN.noise(x / rad * 1.7 + k * 7.1, y / rad * 1.7, z / rad * 1.7) + .05 * Math.sin(8 * Math.atan2(y, x) + 3 * z / rad); q.setXYZ(v, x * w, y * w * .9, z * w); }
    g.computeVertexNormals(); const p = c.add(V(Math.sin(a) * R * B.tailS[0] * (o.drop ?? .9), -Math.cos(a) * R * B.tailS[1] * (o.drop ?? .9), 0)); g.translate(p.x, p.y, p.z);
    (by[i] = by[i] || []).push(g.toNonIndexed()); }
  for (const [i, gs] of Object.entries(by)) { const m = new THREE.Mesh(mergeGeometries(gs), stdMat(B.tone('silk'), { rough: .95 })); m.name = 'eggs'; B.bit(B.chains.tail[i], m); }
  B.eggs = o.n; };
// the tail: from the rump, n bones, starting at `droop` degrees below level and bending by `curl` a bone
P.tail = (B, o) => {
  const len = o.len * B.g.sliders.tail, n = o.n || 3, p0 = B.back.clone().add(V(0, o.up || 0, 0)), pts = [p0];
  for (let k = 0; k < n; k++) { const a = (-(o.droop || 0) + (o.curl || 0) * k) * DEG; pts.push(pts[k].clone().add(V(0, Math.sin(a), -Math.cos(a)).multiplyScalar(len / n))); }
  const names = B.chain('tail', B.spineNames[0], pts.slice(0, n));
  for (let k = 0; k < n; k++) B.meat(names[k], pts[k], pts[k + 1], along(o.r, k / n), along(o.r, (k + 1) / n), { s: [o.s?.[0] ?? 1, o.s?.[1] ?? 1, 1], group: 'tail', tone: o.tone });
  B.tailEnd = pts[n]; B.tailBone = names[n - 1]; B.tailPts = pts; B.tailR = t => along(o.r, t); B.tailS = [o.s?.[0] ?? 1, o.s?.[1] ?? 1];
  // a bird's tail: a fan of feathers off the last bone (Session 775)
  // `raise` (Session 853) stands the fan up from flat toward upright, a display (the Sunfan's)
  if (o.fan) for (let i = 0; i < o.fan.n; i++) { const a = (i / (o.fan.n - 1) - .5) * o.fan.spread * DEG, X = V(1, 0, 0), up = (o.fan.raise || 0) * DEG, d = V(Math.sin(a), -.08, -Math.cos(a)).normalize().applyAxisAngle(X, up); feather(B, pts[n].clone().add(V(0, .002 * i, 0)), d, V(Math.cos(a), 0, Math.sin(a)).applyAxisAngle(X, up), o.fan.len * (1 - .12 * Math.abs(i / (o.fan.n - 1) - .5)), o.fan.len * .2, names[n - 1], 'feather', 'featherTip'); }
  if (o.sting) B.bit(names[n - 1], claw(o.sting.r, o.sting.len, B.tone('dark'), pts[n], pts[n].clone().sub(pts[n - 1]).normalize().applyAxisAngle(V(1, 0, 0), -.9)));
};
// legs, in pairs. A leg is its preset's joints in a frame of its own: x outward, y up as a fraction of the root's height,
// z forward; `fan` turns the frame toward the front (an insect's legs splay), `reach` stretches it sideways and fore-and-aft.
const LEG = {
  // ik: the two segments the solver bends; before them, segments are yawed toward the foot (yaw) or held; after them, held
  canidFore: { j: [[0, 1, 0], [0, .6, -.13], [0, .24, -.04], [0, .07, .02], [0, 0, .08]], ik: 0, r: [.11, .065, .045, .04] },
  canidHind: { j: [[0, 1, 0], [0, .64, .19], [0, .3, -.11], [0, .06, -.06], [0, 0, .04]], ik: 0, r: [.13, .075, .045, .04] },
  ungulFore: { j: [[0, 1, 0], [0, .68, -.07], [0, .4, -.02], [0, .06, 0], [0, 0, .03]], ik: 0, r: [.1, .055, .032, .035], tips: 'hoof' },
  ungulHind: { j: [[0, 1, 0], [0, .7, .15], [0, .42, -.16], [0, .05, -.11], [0, 0, -.08]], ik: 0, r: [.13, .07, .034, .035], tips: 'hoof' },
  plantFore: { j: [[0, 1, 0], [0, .52, -.05], [0, .1, .02], [0, 0, .2]], ik: 0, r: [.16, .12, .1], tips: 'coat' },
  plantHind: { j: [[0, 1, 0], [0, .56, .13], [0, .1, -.06], [0, 0, .18]], ik: 0, r: [.18, .12, .1], tips: 'coat' },
  bird: { j: [[0, 1, 0], [0, .78, .14], [0, .42, -.12], [0, .04, .02], [0, 0, .14]], ik: 1, r: [.13, .07, .035, .025], tips: 'skin', bare: 1 },
  // Session 960: a griffin's foreleg, an eagle's on a beast's frame: the canid's joints, the shank and foot bare scaled skin, thinner
  talonFore: { j: [[0, 1, 0], [0, .6, -.13], [0, .24, -.04], [0, .07, .02], [0, 0, .08]], ik: 0, r: [.11, .06, .032, .03], tips: 'skin' },
  insect: { j: [[0, 1, 0], [.18, 1.06, 0], [.72, 1.42, 0], [1.3, .3, 0], [1.48, 0, 0]], ik: 1, yaw: 1, r: [.07, .06, .045, .025] },
  sprawl: { j: [[0, 1, 0], [.62, 1.05, .04], [.78, .14, .08], [.84, 0, .2]], ik: 0, yaw: 1, r: [.1, .08, .06] },
  // Session 773: a hare's hind leg (a long foot from the hock), and a frog's (folded in a Z, the foot longest of all)
  lagoHind: { j: [[0, 1, 0], [0, .6, .26], [0, .22, -.18], [0, .03, .04], [0, 0, .2]], ik: 0, r: [.16, .08, .05, .045] },
  leaperHind: { j: [[0, 1, 0], [.45, 1, .5], [.62, .72, -.42], [.64, .06, .05], [.68, 0, .45]], ik: 0, yaw: 1, r: [.3, .2, .12, .1] }
};
P.legs = (B, o) => {
  const pre = LEG[o.kind], sp = B.spineAt(o.at), fan = (o.fan || 0) * DEG, reach = o.reach || 1, pair = B.legs.length / 2;
  for (const side of [1, -1]) {
    const root = V(side * o.out, sp.p.y - (o.drop || 0), sp.p.z + (o.dz || 0)), hR = root.y;
    const u = V(side * Math.cos(fan), 0, Math.sin(fan)), f = V(-side * Math.sin(fan), 0, Math.cos(fan));
    const J = pre.j.map(([x, y, z]) => V(root.x, y * hR, root.z).addScaledVector(u, x * hR * reach).addScaledVector(f, z * hR * reach));
    const tag = 'leg' + pair + (side > 0 ? 'L' : 'R'), names = B.chain(tag + '_', sp.bone, J);
    const rr = o.r || pre.r.map(v => v * hR);
    for (let k = 0; k < J.length - 1; k++) B.meat(names[k], J[k], J[k + 1], along(rr, k / (J.length - 1)), along(rr, (k + 1) / (J.length - 1)), { group: tag, tone: k >= J.length - 2 && pre.tips ? pre.tips : (pre.bare ? 'skin' : o.tone) });
    if (o.claws) { const tip = J[J.length - 1], d = J[J.length - 1].clone().sub(J[J.length - 2]).normalize(); d.y = Math.min(d.y, -.3); d.normalize();
      for (let c = -1; c <= 1; c++) B.bit(names[J.length - 1], claw(o.claws.r, o.claws.len, B.tone('dark'), tip.clone().add(V(c * o.claws.r * 2.2, o.claws.r * .8, 0)), d.clone().add(V(c * .15, 0, 0)).normalize(), o.claws.hook));
      // a hind toe (Session 960, the griffin's talons): a fourth claw from the back of the foot, pointing back and down
      if (o.claws.back) B.bit(names[J.length - 1], claw(o.claws.r, o.claws.len * o.claws.back, B.tone('dark'), J[J.length - 2].clone().lerp(tip, .3).add(V(0, o.claws.r * .5, 0)), V(0, -.45, -1).normalize(), o.claws.hook)); }
    // thorns (Session 929, OG-041's spider): short dark spines up every segment past the hip, on its upper and outer faces, raked
    // toward the foot. One merged mesh a segment, rigid on its bone; `per` is thorns a metre of leg
    if (o.thorns) { const r2 = rng(B.g.seed + 31 + B.legs.length), th = o.thorns;
      for (let k = 1; k < J.length - 1; k++) { const a = J[k], d = J[k + 1].clone().sub(a), Ls = d.length(), gs = []; d.normalize();
        const out = u.clone().add(V(0, .8, 0)); out.addScaledVector(d, -out.dot(d)).normalize();
        const n = Math.max(1, Math.round(Ls * th.per));
        for (let i = 0; i < n; i++) { const t = (i + .5 + (r2() - .5) * .5) / n, rad = along(rr, (k + t) / (J.length - 1)) * B.g.sliders.bulk, o2 = out.clone().applyAxisAngle(d, (r2() - .5) * 1.6);
          const len = th.len * (.7 + .6 * r2()) * (1 - .35 * (k - 1) / Math.max(1, J.length - 3)), g = new THREE.ConeGeometry(th.r, len, 5); g.translate(0, len / 2, 0);
          g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(UP, o2.clone().addScaledVector(d, th.rake ?? .7).normalize())); const p = a.clone().addScaledVector(d, Ls * t).addScaledVector(o2, rad * .85); g.translate(p.x, p.y, p.z); gs.push(g.toNonIndexed()); }
        const m = new THREE.Mesh(mergeGeometries(gs), stdMat(B.tone(th.tone || 'dark'), { rough: .45 })); m.name = 'thorns'; B.bit(names[k], m); B.thorns = (B.thorns || 0) + n; } }
    B.legs.push({ names, J, side, at: o.at, pre, hR, ik: pre.ik, yaw: !!pre.yaw, fan, wobble: o.wobble || 0 });
  }
};
// arms: hang from a socket (the shoulders, or a seam on the back), swing against the legs; no feet to plant.
// Session 861: `s` flattens the flesh (a flipper is an arm squashed flat), and `stroke` beats it as a flipper does
P.arms = (B, o) => {
  const sp = B.spineAt(o.at), len = o.len, d = (o.dir || [0, -1, .2]);
  for (const side of [1, -1]) {
    const root = sp.p.clone().add(V(side * o.out, o.up || 0, o.dz || 0)), dir = V(side * d[0], d[1], d[2]).normalize();
    const elbow = root.clone().addScaledVector(dir, len * .5), d2 = o.dir2 ? V(side * o.dir2[0], o.dir2[1], o.dir2[2]).normalize() : dir.clone().applyAxisAngle(V(1, 0, 0), -(o.bend || 30) * DEG).normalize(), wrist = elbow.clone().addScaledVector(d2, len * .42), hand = wrist.clone().addScaledVector(d2, len * .14);
    const tag = 'arm' + (B.arms.length / 2 | 0) + (side > 0 ? 'L' : 'R'), names = B.chain(tag + '_', sp.bone, [root, elbow, wrist, hand]);
    const r = o.r; B.meat(names[0], root, elbow, r[0], r[1], { group: tag, tone: o.tone, s: o.s }); B.meat(names[1], elbow, wrist, r[1], r[2], { group: tag, tone: o.tone, s: o.s }); B.meat(names[2], wrist, hand, r[2], r[2] * .7, { group: tag, tone: o.tone, s: o.s });
    if (o.claws) for (let c = -1; c <= 1; c++) B.bit(names[3], claw(o.claws.r, o.claws.len, B.tone('dark'), hand.clone().add(V(c * o.claws.r * 2, 0, 0)), d2.clone().add(V(c * .2, 0, 0)).normalize()));
    // a pincer (Session 773): a swollen hand and two fingers, the fixed one longer
    if (o.chela) { const c = o.chela; B.meat(names[2], wrist.clone().addScaledVector(d2, -len * .04), hand, c.r, c.r * .8, { s: [1, .62, 1], tone: o.tone, group: tag + 'c' });
      const fx = d2.clone().add(V(-side * .25, 0, 0)).normalize(), mv = d2.clone().add(V(side * .3, .1, 0)).normalize();
      B.bit(names[3], claw(c.r * .45, c.len * 1.15, B.tone(c.tone || 'dark'), hand.clone().add(V(-side * c.r * .35, 0, 0)), fx));
      B.bit(names[3], claw(c.r * .4, c.len, B.tone(c.tone || 'dark'), hand.clone().add(V(side * c.r * .35, c.r * .15, 0)), mv)); }
    B.arms.push({ names, side, phase: o.phase || 0, swing: o.swing ?? .5, stroke: o.stroke || 0 });
  }
};
// gear in the hands (Session 933, OG-041's goblin): a spear gripped in a fist and a round shield strapped to a forearm, rigid on their
// bones, so they swing with the arm. `arm` is the arm pair, `side` 1 the left, -1 the right. A spear: `len`, `grip` (the fraction of
// the shaft behind the fist), `rise` (degrees the point stands above level, ahead), `head` its blade's length. A shield: `r`, strapped
// across the forearm's middle, its face turned out by `face` (x outward, z ahead), with a rim and a boss
P.gear = (B, o) => { for (const it of o.list) { const names = B.chains['arm' + (it.arm || 0) + (it.side > 0 ? 'L' : 'R') + '_']; if (!names) continue; const at = n => B.by[n].p;
  if (it.kind === 'spear') { const fist = at(names[2]).clone().lerp(at(names[3]), .7), a = (it.rise ?? 60) * DEG, ax = V(it.side * (it.splay || 0), Math.sin(a), Math.cos(a)).normalize(), L = it.len;
    const g = new THREE.CylinderGeometry(it.r, it.r * 1.15, L, 7); g.translate(0, L / 2, 0); const shaft = new THREE.Mesh(g, stdMat(B.tone('wood'), { rough: .8 }));
    const hg = new THREE.ConeGeometry(it.r * 2.8, it.head, 4); hg.scale(1, 1, .3); hg.translate(0, L + it.head / 2 - it.r, 0); shaft.add(new THREE.Mesh(hg, stdMat(B.tone('iron'), { rough: .45, flat: true })));
    const wg = new THREE.CylinderGeometry(it.r * 1.5, it.r * 1.5, it.head * .35, 7); wg.translate(0, L - it.head * .1, 0); shaft.add(new THREE.Mesh(wg, stdMat(B.tone('leather'), { rough: .9 })));
    shaft.position.copy(fist).addScaledVector(ax, -L * it.grip); shaft.quaternion.setFromUnitVectors(UP, ax); shaft.name = 'spear'; B.bit(names[3], shaft); B.gear = [...(B.gear || []), 'spear']; }
  if (it.kind === 'shield') { const e = at(names[1]), w = at(names[2]), arm = w.clone().sub(e).normalize(), n = V(it.side * (it.face?.[0] ?? 1), 0, it.face?.[1] ?? 0); n.addScaledVector(arm, -n.dot(arm)).normalize();
    const c = e.clone().lerp(w, .5).addScaledVector(n, (it.off ?? .1) + it.t / 2), sh = new THREE.Group();
    const disc = new THREE.CylinderGeometry(it.r, it.r * .96, it.t, 28); sh.add(new THREE.Mesh(disc, stdMat(B.tone(it.tone || 'hide'), { rough: .9 })));
    const rim = new THREE.TorusGeometry(it.r, it.t * .7, 6, 28); rim.rotateX(Math.PI / 2); sh.add(new THREE.Mesh(rim, stdMat(B.tone(it.rim || 'wood'), { rough: .8 })));
    const boss = new THREE.SphereGeometry(it.r * .2, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2); boss.translate(0, it.t / 2, 0); sh.add(new THREE.Mesh(boss, stdMat(B.tone(it.boss || 'iron'), { rough: .5 })));
    for (let k = 0; k < (it.lace || 0); k++) { const a = k / it.lace * Math.PI * 2, lg = new THREE.BoxGeometry(it.r * .06, it.t * 1.6, it.r * .16); lg.translate(Math.cos(a) * it.r * .86, 0, Math.sin(a) * it.r * .86); sh.add(new THREE.Mesh(lg, stdMat(B.tone('leather'), { rough: .9 }))); }
    sh.position.copy(c); sh.quaternion.setFromUnitVectors(UP, n); sh.name = 'shield'; B.bit(names[1], sh); B.gear = [...(B.gear || []), 'shield']; }
  // a sword (Session 934, the skeleton's): a flat blade narrowing to its point, its edges notched by the seed, a crossguard, a grip
  // in the fist and a pommel; `len` the blade, `rise` the point's angle above level, ahead (below it if negative)
  if (it.kind === 'sword') { const fist = at(names[2]).clone().lerp(at(names[3]), .7), a = (it.rise ?? -60) * DEG, ax = V(it.side * (it.splay || 0), Math.sin(a), Math.cos(a)).normalize(), L = it.len, w = it.w, r = rng(B.g.seed + 51), sw = new THREE.Group();
    const bg = new THREE.BoxGeometry(w, L, w * .16, 1, 16, 1), q = bg.attributes.position, nicks = new Set(Array.from({ length: it.notches || 0 }, () => Math.floor(r() * 26) - 13));
    for (let v = 0; v < q.count; v++) { const y = q.getY(v) / L + .5, x = q.getX(v), row = Math.round((y - .5) * 16 * 1.6), nick = nicks.has(row * Math.sign(x)) && y < .9 ? .55 : 1; q.setX(v, x * (1 - .55 * y ** 2) * (y > .9 ? (1 - y) / .1 : 1) * nick); }
    bg.computeVertexNormals(); bg.translate(0, L / 2 + w * .5, 0); sw.add(new THREE.Mesh(bg, stdMat(B.tone('iron'), { rough: .55, flat: true })));
    const cg = new THREE.BoxGeometry(w * 3.2, w * .35, w * .45); cg.translate(0, w * .3, 0); sw.add(new THREE.Mesh(cg, stdMat(B.tone('iron'), { rough: .6 })));
    const gg = new THREE.CylinderGeometry(w * .22, w * .22, w * 2.4, 7); gg.translate(0, -w * 1.1, 0); sw.add(new THREE.Mesh(gg, stdMat(B.tone('leather'), { rough: .9 })));
    const pg = new THREE.SphereGeometry(w * .38, 10, 8); pg.translate(0, -w * 2.4, 0); sw.add(new THREE.Mesh(pg, stdMat(B.tone('iron'), { rough: .6 })));
    sw.position.copy(fist).addScaledVector(ax, w * 1.1); sw.quaternion.setFromUnitVectors(UP, ax); sw.name = 'sword'; B.bit(names[3], sw); B.gear = [...(B.gear || []), 'sword']; } } };
// wings: an arm (humerus, forearm) and a fan of two-bone fingers; the membrane between them is its own skinned mesh
// a feather (Session 775): a tapered card from its root along dir, its width across in the wing's plane; the tip darker
function feather(B, root, dir, across, len, w, bone, tone, tip) {
  const pts = [root.clone().addScaledVector(across, -w * .25), root.clone().addScaledVector(across, w * .25), root.clone().addScaledVector(dir, len * .65).addScaledVector(across, w * .5), root.clone().addScaledVector(dir, len), root.clone().addScaledVector(dir, len * .65).addScaledVector(across, -w * .5)];
  const c0 = B.tone(tone), c1 = B.tone(tip || tone); B.sheets.push({ pts, tris: [0, 1, 2, 0, 2, 3, 0, 3, 4], bones: pts.map(() => B.by[bone].i), cols: [c0, c0, c0.clone().lerp(c1, .5), c1, c0.clone().lerp(c1, .5)] }); }
P.wings = (B, o) => {
  const sp = B.spineAt(o.at), span = o.span;
  // a bird's wing: humerus, forearm and hand, with the flight feathers fanned off the hand and laid back along the forearm
  if (o.feathers) { const F = o.feathers; for (const side of [1, -1]) {
    const root = sp.p.clone().add(V(side * o.out, o.up || 0, 0)), elbow = root.clone().add(V(side * span * .26, 0, -span * .04)), wrist = elbow.clone().add(V(side * span * .3, 0, span * .03)), tip = wrist.clone().add(V(side * span * .26, 0, -span * .04));
    const tag = 'wing' + (side > 0 ? 'L' : 'R'), arm = B.chain(tag, sp.bone, [root, elbow, wrist, tip]);
    B.meat(arm[0], root, elbow, o.r[0], o.r[1], { group: tag, tone: o.tone }); B.meat(arm[1], elbow, wrist, o.r[1], o.r[2], { group: tag, tone: o.tone }); B.meat(arm[2], wrist, tip, o.r[2], o.r[2] * .5, { group: tag, tone: o.tone });
    const back = V(0, -.02, -1), up = V(0, 1, 0);
    // each flight feather hangs on a bone of its own at its root (Session 974), so a folded wing can turn it back along the body,
    // as a bird's ligaments do; its covert rides on the same bone. `kind` is the row: c on the humerus, s the forearm, p the hand
    const quills = [], quill = (par, p, d, kind, t, ac) => { const n = tag + 'q' + quills.length; B.bone(n, par, p); quills.push({ name: n, d: d.clone(), n: d.clone().cross(ac).normalize(), kind, t }); return n; };
    for (let i = 0; i < F.ns; i++) { const t = i / (F.ns - 1), p = elbow.clone().lerp(wrist, t), d = back.clone().add(V(side * .15 * t, 0, 0)).normalize(), q = quill(arm[1], p, d, 's', t, V(side, 0, 0)); feather(B, p, d, V(side, 0, 0), span * F.len * (.62 + .08 * t), span * .07, q, 'feather', 'featherTip');
      feather(B, p.clone().add(V(0, .004 * span, .01 * span)), d, V(side, 0, 0), span * F.len * .34, span * .065, q, 'covert', 'feather'); }
    for (let i = 0; i < 3; i++) { const p = root.clone().lerp(elbow, .3 + .3 * i); feather(B, p, back, V(side, 0, 0), span * F.len * .5, span * .07, quill(arm[0], p, back, 'c', i / 2, V(side, 0, 0)), 'covert', 'feather'); }
    for (let i = 0; i < F.np; i++) { const t = i / (F.np - 1), p = wrist.clone().lerp(tip, t * .92), d = V(side * (.25 + .9 * t), 0, -(1 - .85 * t)).normalize(), ac = V(-d.z * side, 0, d.x * side).normalize(), q = quill(arm[2], p, d, 'p', t, ac);
      feather(B, p, d, ac, span * F.len * (.7 + .3 * t) * (F.primary || 1), span * .06, q, 'feather', 'featherTip');
      if (i < F.np - 2) feather(B, p.clone().add(V(0, .004 * span, .008 * span)), d, ac, span * F.len * .4, span * .055, q, 'covert', 'feather'); }
    B.wings.push({ side, arm, fingers: [], feathered: true, quills, ragged: F.ragged || 0 }); } return; }
  for (const side of [1, -1]) {
    const root = sp.p.clone().add(V(side * o.out, o.up || 0, 0)), X = V(side, 0, 0);
    const elbow = root.clone().add(V(side * span * .2, span * .16, -span * .05)), wrist = elbow.clone().add(V(side * span * .26, -span * .04, span * .04));
    const tag = 'wing' + (side > 0 ? 'L' : 'R'), arm = B.chain(tag, sp.bone, [root, elbow, wrist]);
    B.meat(arm[0], root, elbow, o.r[0], o.r[1], { group: tag, tone: o.tone }); B.meat(arm[1], elbow, wrist, o.r[1], o.r[2], { group: tag, tone: o.tone });
    const fingers = [];
    for (let k = 0; k < o.fingers; k++) { const a = (25 - 130 * k / (o.fingers - 1)) * DEG, L = span * (k === 0 ? .55 : .62 - .1 * k / o.fingers), d = V(side * Math.cos(a) * .9, -.08 - .25 * k / o.fingers, Math.sin(a)).normalize();
      const mid = wrist.clone().addScaledVector(d, L * .5), d2 = d.clone().add(V(0, -.06, -.12)).normalize(), tip = mid.clone().addScaledVector(d2, L * .5);
      fingers.push(B.chain(tag + 'f' + k + '_', arm[2], [wrist.clone(), mid, tip])); }
    B.wings.push({ side, arm, fingers, root, r: o.r[2], tone: o.membrane || 'membrane', sag: o.sag ?? .18 });
  }
};
// a row of spines down the back (bits on the spine bones)
// fins (Session 774): each a thin sheet on a bone of its own, so the pose can flutter it. A fin is an outline in its own
// plane (u back along the body, v out from it), scaled by len and h: 'tri' for a dorsal, pectoral, pelvic or anal fin,
// 'fork' for a fish's tail (v up) or a whale's flukes (v sideways). It hangs off the spine at t, or off the tail's end.
const FIN = { tri: [[-.15, 0], [.12, .75], [.3, 1], [.45, .8], [.62, .35], [.8, 0]],
  // Session 864: a moth's wings, the forewing pointed at its tip and the hindwing rounded
  fore: [[-.05, 0], [-.04, .5], [.06, .94], [.2, 1], [.36, .82], [.5, .52], [.56, .22], [.46, 0]], hind: [[0, 0], [.08, .55], [.28, .88], [.55, .82], [.74, .52], [.8, .2], [.6, 0]], fork: [[0, .22], [.55, 1], [.42, .5], [.38, .15], [.5, 0], [.38, -.15], [.42, -.5], [.55, -1], [0, -.22]] };
P.fins = (B, o) => { for (const f of o.list) for (const side of f.pair ? [1, -1] : [0]) {
  const onTail = f.on === 'tail', sp = onTail ? null : B.spineAt(f.at), parent = onTail ? B.tailBone : sp.bone;
  const R = onTail ? 0 : sp.r, base = onTail ? B.tailEnd.clone() : sp.p.clone().add(V(side * R * B.spineS[0] * (f.off?.[0] ?? .9), R * B.spineS[1] * (f.off?.[1] ?? 0), f.dz || 0));
  const back = V(...(f.back || [0, 0, -1])).normalize(), out = V((f.out?.[0] ?? 0) * (side || 1), f.out?.[1] ?? 1, f.out?.[2] ?? 0).normalize();
  const name = 'fin' + B.fins.length; B.bone(name, parent, base); B.fins.push({ name, kind: f.role || 'fin', side, out });
  const pts = [base.clone()], bones = [B.by[name].i]; for (const [u, v] of FIN[f.kind || 'tri']) { pts.push(base.clone().addScaledVector(back, u * f.len).addScaledVector(out, v * f.h)); bones.push(B.by[name].i); }
  const tris = []; for (let k = 1; k < pts.length - 1; k++) tris.push(0, k, k + 1); B.sheets.push({ pts, tris, bones, tone: f.tone || 'fin' }); } };
// radial arms (Session 774): n chains from a ring round a centre, each sinking at `down` degrees and bending by `curl` a
// bone. Thick ones are flesh (an octopus's arms, a jellyfish's oral arms); `thread` ones are thin glowing tubes (its tentacles).
P.radial = (B, o) => { const c = V(...o.c), parent = o.parent || B.spineNames[0], seg = o.seg || 6;
  for (let k = 0; k < o.n; k++) { const a = (k + (o.rot || 0)) / o.n * Math.PI * 2, rr = o.ring * (o.jitter ? 1 + (k % 3 - 1) * o.jitter : 1), pts = [c.clone().add(V(Math.cos(a) * rr, 0, Math.sin(a) * rr))];
    const len = o.len * (o.jitter ? 1 + ((k * 7) % 5 - 2) * o.jitter : 1);
    for (let j = 0; j < seg; j++) { const dn = Math.max(o.minDown ?? -90, (o.down || 0) + (o.curl || 0) * j) * DEG, d = V(Math.cos(a) * Math.cos(dn), -Math.sin(dn), Math.sin(a) * Math.cos(dn)); const p = pts[j].clone().addScaledVector(d, len / seg);
      if (o.floor !== undefined) p.y = Math.max(p.y, o.floor + along(o.r, (j + 1) / seg)); pts.push(p); }
    const tag = (o.tag || 'arm') + k + '_', names = B.chain(tag, parent, pts);
    if (o.thread) B.tubes.push({ names, r0: o.r[0], r1: o.r[1], tone: o.tone || 'thread' });
    else for (let j = 0; j < seg; j++) B.meat(names[j], pts[j], pts[j + 1], along(o.r, j / seg), along(o.r, (j + 1) / seg), { group: tag, tone: o.tone, s: o.s });
    B.radials.push({ names, a, thread: !!o.thread, k, n: o.n }); } };
// a shell (Session 775): a rigid dome over the spine with a rim and a flat plastron. Its scutes are cells of a hexagonal
// lattice seen from above, their seams darkened; a garden may grow on it (the Mossback), or a sail stand on it (the Sailshell)
P.shell = (B, o) => { const sp = B.spineAt(o.at), c = sp.p.clone().add(V(0, o.lift || 0, o.dz || 0)), rx = o.w / 2, rz = o.len / 2, base = B.tone(o.tone || 'shell'), seam = B.tone('seam'), r = rng(B.g.seed + 9);
  const g = new THREE.SphereGeometry(1, 48, 20, 0, Math.PI * 2, 0, Math.PI / 2); g.scale(rx, o.h, rz);
  const lat = []; const s = o.scute || rx * .5; for (let i = -6; i <= 6; i++) for (let j = -6; j <= 6; j++) lat.push([(i + (j % 2 ? .5 : 0)) * s, j * s * .87]);
  const P0 = g.attributes.position, col = [];
  for (let v = 0; v < P0.count; v++) { const x = P0.getX(v), y = P0.getY(v), z = P0.getZ(v); let d1 = 1e9, d2 = 1e9, k1 = 0;
    for (let k = 0; k < lat.length; k++) { const d = Math.hypot(x - lat[k][0], z - lat[k][1]); if (d < d1) { d2 = d1; d1 = d; k1 = k; } else if (d < d2) d2 = d; }
    const edge = sstep(s * .12, 0, d2 - d1), ring = .9 + .1 * Math.cos(d1 / s * 14), C = base.clone().multiplyScalar(ring * (.88 + .24 * ((k1 * 2654435761) % 97) / 97)).lerp(seam, edge * .85);
    if (o.top) C.lerp(B.tone(o.top), sstep(.55, .95, y / o.h) * .9); if (y < o.h * .12) C.lerp(seam, .35); col.push(C.r, C.g, C.b); }
  g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  const plast = new THREE.CircleGeometry(1, 40); plast.rotateX(Math.PI / 2); plast.scale(rx * .9, 1, rz * .92); plast.translate(0, -o.h * .02, 0); const pc = []; for (let v = 0; v < plast.attributes.position.count; v++) pc.push(...B.tone('belly').toArray()); plast.setAttribute('color', new THREE.Float32BufferAttribute(pc, 3));
  const m = new THREE.Mesh(mergeGeometries([g.toNonIndexed(), plast.toNonIndexed()]), new THREE.MeshStandardMaterial({ vertexColors: true, roughness: o.rough ?? .7, side: THREE.DoubleSide })); m.geometry.computeVertexNormals(); m.position.copy(c); B.bit(sp.bone, m);
  // a garden: ferns, grass and flowers rooted in the moss on top
  if (o.garden) { const G = o.garden, geos = [];
    const add = (geo, color, x, z, rot) => { const y = o.h * Math.sqrt(Math.max(0, 1 - (x / rx) ** 2 - (z / rz) ** 2)); geo.rotateY(rot); geo.translate(x, y - .01, z); const cc = []; for (let v = 0; v < geo.attributes.position.count; v++) cc.push(color.r, color.g, color.b); geo.setAttribute('color', new THREE.Float32BufferAttribute(cc, 3)); geos.push(geo.toNonIndexed()); };
    const spot = f => { const a = r() * Math.PI * 2, d = Math.sqrt(r()) * f; return [Math.cos(a) * d * rx, Math.sin(a) * d * rz]; };
    for (let i = 0; i < G.ferns; i++) { const [x, z] = spot(.62), h = G.size * (.6 + .6 * r()); for (let f = 0; f < 5; f++) { const fg = new THREE.ConeGeometry(h * .16, h, 3); fg.scale(1, 1, .25); fg.translate(0, h / 2, 0); fg.rotateZ((r() - .5) * 1.2); add(fg, B.tone('fern').clone().multiplyScalar(.8 + .4 * r()), x, z, f / 5 * Math.PI * 2 + r()); } }
    for (let i = 0; i < G.flowers; i++) { const [x, z] = spot(.7), st = new THREE.CylinderGeometry(.004, .004, G.size * .45, 4); st.translate(0, G.size * .22, 0); add(st, B.tone('fern'), x, z, 0); const fl = new THREE.SphereGeometry(G.size * .07, 6, 4); fl.translate(0, G.size * .46, 0); add(fl, B.tone(r() < .5 ? 'bloom' : 'bloom2'), x, z, 0); }
    const gm = new THREE.Mesh(mergeGeometries(geos), new THREE.MeshStandardMaterial({ vertexColors: true, roughness: .85, side: THREE.DoubleSide })); gm.position.copy(c); B.bit(sp.bone, gm); }
  // a sail: a sheet along the crest, striped, stiffened by its spines
  if (o.sail) { const top = c.clone().add(V(0, o.h * .97, 0)), pts = [top.clone()], cols = [B.tone('sail')], N = 9; for (let i = 0; i <= N; i++) { const t = i / N, z = (t - .5) * o.sail.len, h = o.sail.h * Math.sin(Math.PI * Math.pow(t, .8)) * (.85 + .15 * Math.sin(t * 40)); pts.push(top.clone().add(V(0, h - o.h * (1 - Math.sqrt(Math.max(0, 1 - (z / rz) ** 2))) , z))); cols.push(B.tone(i % 2 ? 'sail' : 'sail2')); }
    const tris = []; for (let i = 1; i < pts.length - 1; i++) tris.push(0, i, i + 1); B.sheets.push({ pts, tris, bones: pts.map(() => B.by[sp.bone].i), cols }); }
};
// a saddle on the back (Session 773): a socket's first rider. A leather seat over a wool blanket, both draped over the spine
P.saddle = (B, o) => { const sp = B.spineAt(o.at), fl = (B.plan.fur?.len || 0) * .8, R = sp.r * B.spineS[0] + fl, Ry = sp.r * B.spineS[1] + fl; // it sits on the fur, not under it
  const drape = (r, ry, len, th, c) => { const g = new THREE.CylinderGeometry(1, 1, len, 24, 1, true, Math.PI / 2 - th / 2, th); g.rotateZ(Math.PI / 2); g.rotateY(Math.PI / 2); g.scale(r, ry, 1); const m = new THREE.Mesh(g, stdMat(c, { rough: .8 })); m.material.side = THREE.DoubleSide; m.position.copy(sp.p); return m; };
  B.bit(sp.bone, drape(R * 1.06, Ry * 1.06, o.len * 1.25, 2.3, B.tone('blanket'))); B.bit(sp.bone, drape(R * 1.09, Ry * 1.09, o.len, 1.6, B.tone('leather')));
  const horn = new THREE.Mesh(new THREE.CylinderGeometry(o.len * .05, o.len * .07, o.len * .22, 10), stdMat(B.tone('leather'), { rough: .6 })); horn.position.copy(sp.p).add(V(0, Ry * 1.12, o.len * .42)); B.bit(sp.bone, horn); };
// or (Session 919, OG-088's corrupted row) `crystal`: each a cluster of glassy shards out of the hide (the Shatterhorn's crystal
// horns), leaning back and to either side by turns, so the back bristles with them as the blight boar's and the frost bear's do
// `dorsal` (Session 926): out of the back, square to the spine, not straight up (an upright body's back faces behind it)
P.spines = (B, o) => { const sd0 = B.spinePts[B.spinePts.length - 1].clone().sub(B.spinePts[0]).normalize(), dors = o.dorsal ? UP.clone().addScaledVector(sd0, -sd0.y).normalize() : UP;
  for (let k = 0; k < o.n; k++) { const t = lerp(o.from, o.to, k / (o.n - 1)), sp = B.spineAt(t), h = o.len * (1 - .5 * Math.abs(k / (o.n - 1) - .5) * 2 * (o.taper ?? .5));
  const at = sp.p.clone().addScaledVector(dors, sp.r * (o.dorsal ? B.spineS[0] * .7 + B.spineS[1] * .3 : B.spineS[1]) * .85);
  if (o.crystal) { const sd = k % 2 ? 1 : -1; B.bit(sp.bone, crystals({ n: o.crystal, len: h, r: o.r, stone: o.stone }, 1, B.tone(o.tone || 'horn'), at.add(V(sd * sp.r * .25, 0, 0)), sd, rng(B.g.seed + 11 + k))); continue; }
  B.bit(sp.bone, claw(o.r, h, B.tone(o.tone || 'dark'), at, V(0, 1, -.35).normalize())); } };

// a coiled shell (Session 862): a tube wound round an axis, growing as it goes, so the whorls stack into a spire. At the
// mouth the tube is widest; toward the apex it shrinks by `grow` a turn and rises. Spiral bands run along the whorls, pale at
// the lip, darker in the sutures where one whorl sits on the last. It is rigid on the spine, tilted back over the foot.
P.coil = (B, o) => { const sp = B.spineAt(o.at), turns = o.turns || 4, N = Math.round(turns * 40), M = 20, k = Math.log(o.grow || 1.9) / (Math.PI * 2), U = turns * Math.PI * 2;
  const base = B.tone(o.tone || 'shell'), band = B.tone(o.band || 'band'), seam = B.tone('seam'), lip = B.tone('belly'), pos = [], col = [], idx = [];
  for (let i = 0; i <= N; i++) { const u = i / N * U, g = Math.exp(-k * (U - u)), R = o.R * g, rho = o.r * g, h = o.spire * (1 - g), ca = Math.cos(u), sa = Math.sin(u);
    for (let j = 0; j <= M; j++) { const a = j / M * Math.PI * 2, out = Math.cos(a), up = Math.sin(a);
      pos.push((R + rho * out) * ca, h + rho * up * 1.1, (R + rho * out) * sa);
      const suture = sstep(.55, .95, -up) * sstep(-.2, .6, -out), stripe = sstep(.55, .8, Math.cos(a * (o.bands || 3) + u * .15)), C = base.clone().lerp(band, stripe * .7).lerp(seam, suture * .6).lerp(lip, sstep(U - .5, U, u) * .7);
      col.push(C.r, C.g, C.b); } }
  for (let i = 0; i < N; i++) for (let j = 0; j < M; j++) { const a = i * (M + 1) + j, b = a + M + 1; idx.push(a, b, a + 1, b, b + 1, a + 1); }
  const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); geo.setAttribute('color', new THREE.Float32BufferAttribute(col, 3)); geo.setIndex(idx); geo.computeVertexNormals();
  const m = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: o.rough ?? .45, side: THREE.DoubleSide }));
  m.rotation.set((o.tilt || 0) * DEG, (o.turn || 0) * DEG, (o.roll || 0) * DEG); m.position.copy(sp.p).add(V(0, sp.r * B.spineS[1] * .6 + (o.lift || 0), o.dz || 0)); B.bit(sp.bone, m); };

// leafy fronds (Session 863): lobed leaves hung off a body's bones, as a leafy sea dragon wears its camouflage. `n` fronds
// are spread down the chains named in `on`, each leaning out to one side or the other (`out`), back, and up or down (`spread`), seeded
// by the genome; each is a sheet skinned to its bone, so it sways as the body moves. Lobes are notched into its two edges.
const LEAF = [[0, 0], [.18, .32], [.42, .5], [.38, .22], [.62, .42], [.78, .2], [1, 0], [.78, -.2], [.62, -.42], [.38, -.22], [.42, -.5], [.18, -.32]];
P.fronds = (B, o) => { const r = rng(B.g.seed + 21), names = (o.on || ['spine']).flatMap(c => c === 'spine' ? B.spineNames : c === 'head' ? ['head'] : (B.chains[c] || []));
  for (let i = 0; i < o.n; i++) { const nm = names[Math.min(names.length - 1, Math.floor((i + .5) / o.n * names.length))], b = B.by[nm], side = i % 2 ? 1 : -1;
    const d = V(side * (o.out ?? .7) * (.6 + .4 * r()), (r() - .5) * 2 * (o.spread ?? .6) + (o.lift || 0), -(o.back ?? .4) - .3 * r()).normalize(), a = d.clone().cross(V(1, 0, 0)).normalize(), L = o.len * (.7 + .6 * r()), W = o.w * (.8 + .4 * r());
    const base = b.p.clone().add(V(side * (o.root || 0), 0, 0)), pts = LEAF.map(([u, v]) => base.clone().addScaledVector(d, u * L).addScaledVector(a, v * W)), tris = [];
    for (let k = 1; k < pts.length - 1; k++) tris.push(0, k, k + 1); tris.push(0, pts.length - 1, 1);
    const c0 = B.tone(o.tone || 'frond'), c1 = B.tone(o.tip || o.tone || 'frond'); B.sheets.push({ pts, tris, bones: pts.map(() => b.i), cols: LEAF.map(([u]) => c0.clone().lerp(c1, u)) }); } };

// rags (Session 943, OG-041's skeleton, "rags at the hips"): the first cloth on a creature. A cord round the waist on the first
// spine bone, and `n` torn strips of cloth hanging from it, some missing, each `len` long give or take a third, its foot torn
// ragged. A strip's top is on the hip bone; where it hangs over a thigh (any strip off the middle), it passes to that thigh's
// bone down its length (smoothly, so no edge tears), so it swings forward and back with the leg and the leg never walks through it. `w` a strip's width, `rx`/`rz` the waist
P.rags = (B, o) => { const r = rng(B.g.seed + 43), h = B.spinePts[0].clone().add(V(0, o.up || 0, o.dz || 0)), hip = B.by[B.spineNames[0]].i, S = B.S;
  const thigh = sd => { const k = Object.keys(B.chains).find(c => new RegExp('^leg\\d' + (sd > 0 ? 'L' : 'R') + '_$').test(c)); return k ? B.by[B.chains[k][0]].i : hip; };
  const c0 = B.tone(o.tone || 'cloth'), c1 = B.tone(o.tip || o.tone || 'cloth'); let strips = 0, low = 1e9;
  for (let k = 0; k < o.n; k++) { if (r() < (o.gaps ?? .2)) continue; const th = (k + (r() - .5) * .5) / o.n * Math.PI * 2, at = (t, out) => V(Math.sin(t) * (o.rx * S + out), 0, Math.cos(t) * (o.rz * S + out));
    const len = o.len * S * (.67 + .66 * r()), w = o.w * S * (.8 + .4 * r()), dt = w / (o.rx * S) / 2, x = Math.sin(th), bone = Math.abs(x) > .3 ? thigh(Math.sign(x)) : hip, ROWS = 4, pts = [], bones = [], blend = [], cols = [], tris = [];
    for (let i = 0; i <= ROWS; i++) { const v = i / ROWS; for (let j = 0; j <= 2; j++) { const t = th + (j - 1) * dt * (1 + .25 * v), tear = i === ROWS ? (r() - .5) * .35 * len : 0, p = h.clone().add(at(t, .012 * S + .035 * S * v)).add(V(0, -v * len + tear, 0));
      pts.push(p); bones.push(hip); blend.push([bone, bone === hip ? 0 : .7 * v * v * (3 - 2 * v)]); cols.push(c0.clone().lerp(c1, v).multiplyScalar(.85 + .3 * r())); low = Math.min(low, p.y); } }
    for (let i = 0; i < ROWS; i++) for (let j = 0; j < 2; j++) { const a = i * 3 + j, b = a + 1, c = a + 3, d = c + 1; tris.push(a, c, b, b, c, d); }
    B.sheets.push({ pts, tris, bones, blend, cols }); strips++; }
  const g = new THREE.TorusGeometry(1, .06, 6, 28); g.rotateX(Math.PI / 2); g.scale(o.rx * S + .006, 1, o.rz * S + .006); const cord = new THREE.Mesh(g, stdMat(B.tone(o.cord || 'leather'), { rough: .8 })); cord.position.copy(h); cord.scale.y = .15; B.bit(B.spineNames[0], cord);
  B.rags = { strips, low: +low.toFixed(3) }; };

// straps (Session 944, OG-041's goblin, "a scrap-leather harness"): a harness laid on the grown skin. Each strap is a path of
// (t, angle) pairs round the spine (t along it, hip 0 to chest 1; angle 0 the belly, 90 its left), drawn as a ribbon `w` wide. It is
// laid after the flesh is grown: each of its points stands 7 mm outside the furthest of the skin's points near it (within 2.5 cm
// along the spine and 9° round it) and takes that skin point's bone weights, so it moves as the skin under it does. `lift` stands a
// strap further out, over another (a lashing over a plate, Session 945)
P.straps = (B, o) => { (B.after ||= []).push(geo => {
  const pos = geo.attributes.position, SI = geo.attributes.skinIndex, SW = geo.attributes.skinWeight, n = pos.count, out = [];
  // only the trunk's skin where there is any: points carried mostly by a spine bone (an arm's root, the neck or a thigh would pull a
  // strap out to them); past the trunk's ends (over a shoulder, round the hips) any skin
  const spineI = new Set(B.spineNames.map(nm => B.by[nm].i)), onTrunk = new Uint8Array(n); for (let i = 0; i < n; i++) { let bw = -1, bi = -1; for (let c = 0; c < 4; c++) { const w = SW.getComponent(i, c); if (w > bw) { bw = w; bi = SI.getComponent(i, c); } } onTrunk[i] = spineI.has(bi) ? 1 : 0; }
  const X = V(1, 0, 0), frame = t => { const a = B.spineAt(t - .03).p, b = B.spineAt(t + .03).p, ax = b.clone().sub(a).normalize(); return { p: B.spineAt(t).p, ax, belly: X.clone().cross(ax).normalize(), side: X }; };
  const surf = (t, deg, lift = 0, any = false) => { const F = frame(t), th = deg * DEG, dir = F.belly.clone().multiplyScalar(Math.cos(th)).addScaledVector(F.side, Math.sin(th)), v = V(0, 0, 0); let best = -1, R = 0;
    for (let i = 0; i < n; i++) { if (!any && !onTrunk[i]) continue; v.fromBufferAttribute(pos, i).sub(F.p); const along = v.dot(F.ax); if (Math.abs(along) > .025) continue; v.addScaledVector(F.ax, -along); const r = v.length(); if (r < 1e-4 || v.dot(dir) / r < Math.cos(9 * DEG)) continue; if (r > R) { R = r; best = i; } }
    if (best < 0 && !any) return surf(t, deg, lift, true);
    return best < 0 ? null : { p: F.p.clone().addScaledVector(dir, R + .007 + lift), n: dir, src: best }; };
  let laid = 0, miss = 0;
  for (const st of o.straps) { const cc = B.tone(st.tone || o.tone || 'leather'), pts = [], bones = [], skin = [], cols = [], tris = [], line = [];
    for (let k = 0; k < st.path.length - 1; k++) { const [t0, a0] = st.path[k], [t1, a1] = st.path[k + 1], N = st.steps || 10; for (let j = 0; j < N + (k === st.path.length - 2 ? 1 : 0); j++) { const u = j / N, q = surf(lerp(t0, t1, u), lerp(a0, a1, u), st.lift || 0); if (q) line.push(q); else miss++; } }
    for (let k = 0; k < line.length; k++) { const q = line[k], T = line[Math.min(line.length - 1, k + 1)].p.clone().sub(line[Math.max(0, k - 1)].p).normalize(), wd = q.n.clone().cross(T).normalize(), w = (st.w || o.w) / 2;
      for (const sd of [-1, 1]) { pts.push(q.p.clone().addScaledVector(wd, sd * w)); bones.push(SI.getX(q.src)); skin.push({ i: [SI.getX(q.src), SI.getY(q.src), SI.getZ(q.src), SI.getW(q.src)], w: [SW.getX(q.src), SW.getY(q.src), SW.getZ(q.src), SW.getW(q.src)] }); cols.push(cc.clone().multiplyScalar(.8 + .4 * ((k * 7 + (sd + 1) * 3) % 5) / 5)); }
      out.push({ v: pts.length - 2, src: q.src, off: .007 }); }
    for (let k = 0; k < line.length - 1; k++) { const a = k * 2; tris.push(a, a + 2, a + 1, a + 1, a + 2, a + 3); }
    if (st.closed && line.length > 2) { const a = (line.length - 1) * 2; tris.push(a, 0, a + 1, a + 1, 0, 1); }
    B.sheets.push({ pts, tris, bones, skin, cols }); laid++; }
  B.harness = { straps: laid, miss, laid: out }; }); };

// packs (Session 867): what a beast of burden carries. Two panniers hang either side of the spine at `at`, over a canvas
// blanket, joined by a strap across the back, with a bedroll lashed on top. All rigid on the spine bone, clear of the fur.
P.packs = (B, o) => { const sp = B.spineAt(o.at), fl = (B.plan.fur?.len || 0) * .8, R = sp.r * B.spineS[0] + fl, Ry = sp.r * B.spineS[1] + fl, L = o.len, W = o.w ?? L * .38, H = o.h ?? L * .7;
  const box = (w, h, d, c, p, rough = .8) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d, 2, 2, 2), stdMat(c, { rough })); m.position.copy(p); B.bit(sp.bone, m); return m; };
  const blanket = new THREE.CylinderGeometry(1, 1, L * 1.15, 24, 1, true, Math.PI / 2 - 1.25, 2.5); blanket.rotateZ(Math.PI / 2); blanket.rotateY(Math.PI / 2); blanket.scale(R * 1.04, Ry * 1.04, 1);
  const bm = new THREE.Mesh(blanket, stdMat(B.tone('blanket'), { rough: .9 })); bm.material.side = THREE.DoubleSide; bm.position.copy(sp.p); B.bit(sp.bone, bm);
  for (const sd of [1, -1]) { const p = sp.p.clone().add(V(sd * (R * 1.06 + W / 2), -Ry * .3 - H * .5, 0)); box(W, H, L, B.tone('pack'), p);
    box(W * 1.04, H * .16, L * 1.02, B.tone('leather'), p.clone().add(V(0, H * .5, 0)), .6);
    box(W * .1, Ry * .9 + H * .2, L * .12, B.tone('leather'), sp.p.clone().add(V(sd * R * .98, -Ry * .35, 0)), .6); }
  box(R * 2.1, Ry * .08, L * .12, B.tone('leather'), sp.p.clone().add(V(0, Ry * 1.05, 0)), .6);
  if (o.roll !== false) { const g = new THREE.CylinderGeometry(L * .16, L * .16, R * 2.2, 14); g.rotateZ(Math.PI / 2); const m = new THREE.Mesh(g, stdMat(B.tone('roll'), { rough: .9 })); m.position.copy(sp.p).add(V(0, Ry * 1.05 + L * .16, -L * .2)); B.bit(sp.bone, m); } };
// harness (Session 867): a draught horse's padded collar round the base of its neck, or an ox's wooden yoke over its
// neck with a bow under it. Rigid on the first neck bone, so the head moves free of it.
P.harness = (B, o) => { const t = o.at ?? .2, np = B.neckPts, f = t * (np.length - 1), i = Math.min(np.length - 2, Math.floor(f)), c = np[i].clone().lerp(np[i + 1], f - i), d = np[i + 1].clone().sub(np[i]).normalize();
  const fl = (B.plan.fur?.len || 0) * .8, k = o.fit ?? 1.1, rx = (B.neckR(t) * B.neckS[0] + fl) * k, ry = (B.neckR(t) * B.neckS[1] + fl) * k, q = new THREE.Quaternion().setFromUnitVectors(V(0, 0, 1), d), bone = B.chains.neck[i];
  if (o.kind === 'collar') { const g = new THREE.TorusGeometry(1, .2, 12, 32); g.scale(rx, ry, rx); const m = new THREE.Mesh(g, stdMat(B.tone('leather'), { rough: .55 })); m.quaternion.copy(q); m.position.copy(c); B.bit(bone, m);
    for (const sd of [1, -1]) { const h = new THREE.Mesh(new THREE.CylinderGeometry(rx * .06, rx * .06, ry * 2.1, 8), stdMat(B.tone('brass'), { rough: .35 })); h.quaternion.copy(q).multiply(new THREE.Quaternion().setFromAxisAngle(V(0, 0, 1), sd * .08));
      h.position.copy(c).add(V(sd * rx * 1.2, ry * .15, 0)); B.bit(bone, h); } }
  else { const wb = new THREE.Mesh(new THREE.BoxGeometry(rx * 2 + o.over * 2, ry * .32, ry * .38), stdMat(B.tone('wood'), { rough: .75 })); wb.quaternion.copy(q); wb.position.copy(c).add(V(0, ry * .82, 0)); B.bit(bone, wb);
    const g = new THREE.TorusGeometry(1, .05, 8, 24, Math.PI); g.rotateZ(Math.PI); g.scale(rx, ry * .95, rx); const bow = new THREE.Mesh(g, stdMat(B.tone('wood'), { rough: .75 })); bow.quaternion.copy(q); bow.position.copy(c).add(V(0, ry * .66, 0)); B.bit(bone, bow); } };

// ── bits: small rigid meshes ──
const MATS = new Map();
function stdMat(c, o = {}) { const k = c.getHexString() + JSON.stringify(o); if (!MATS.has(k)) MATS.set(k, new THREE.MeshStandardMaterial({ color: c, roughness: o.rough ?? .6, metalness: 0, flatShading: !!o.flat, emissive: o.emissive || 0x000000, emissiveIntensity: o.ei ?? 1 })); return MATS.get(k); }
function ball(r, c, p, rough = .5) { const m = new THREE.Mesh(new THREE.SphereGeometry(r, 16, 12), stdMat(c, { rough })); m.position.copy(p); return m; }
function eye(r, color, p) { const m = new THREE.Mesh(new THREE.SphereGeometry(r, 16, 12), new THREE.MeshPhysicalMaterial({ color: new THREE.Color().setRGB(...color, THREE.SRGBColorSpace), roughness: .05, clearcoat: 1, emissive: new THREE.Color().setRGB(...color, THREE.SRGBColorSpace).multiplyScalar(.12) })); m.position.copy(p); return m; }
// a claw: a cone along `dir`. With `hook` (Session 970, the griffin's talons) it arches: its middle raised `hook` / 2 of its length
// away from the ground, at right angles to the claw, and its root and tip where a straight claw's are, so it curls down onto the point
// without reaching any deeper. An eagle's talon, not a straight spike
function claw(r, len, c, p, dir, hook = 0) { const g = new THREE.ConeGeometry(r, len, 7, hook ? 6 : 1); g.translate(0, len / 2, 0); const m = new THREE.Mesh(g, stdMat(c, { rough: .4 })); m.position.copy(p);
  const d = dir.clone().normalize(); if (!hook) { m.quaternion.setFromUnitVectors(UP, d); return m; }
  const b = V(0, -1, 0).addScaledVector(d, d.y), P = g.attributes.position, q = new THREE.Quaternion().setFromUnitVectors(UP, d), v = V(0, 0, 0); if (b.lengthSq() < 1e-4) b.set(0, 0, -1); b.normalize();
  for (let i = 0; i < P.count; i++) { v.fromBufferAttribute(P, i); const t = v.y / len; v.applyQuaternion(q).addScaledVector(b, hook * len * 2 * (t * t - t)); P.setXYZ(i, v.x, v.y, v.z); }
  g.computeVertexNormals(); return m; }
// a tube along points, tapering from r0 to r1 (horns, antler beams and tines)
function taperTube(pts, r0, r1, radial = 8) {
  const curve = new THREE.CatmullRomCurve3(pts), seg = Math.max(4, pts.length * 4), g = new THREE.TubeGeometry(curve, seg, 1, radial, false), pos = g.attributes.position, fr = curve.computeFrenetFrames(seg, false);
  for (let i = 0; i <= seg; i++) { const c = curve.getPointAt(i / seg), r = lerp(r0, r1, i / seg); for (let j = 0; j <= radial; j++) { const k = i * (radial + 1) + j, v = V(pos.getX(k), pos.getY(k), pos.getZ(k)).sub(c).multiplyScalar(r).add(c); pos.setXYZ(k, v.x, v.y, v.z); } }
  g.computeVertexNormals(); return g;
}
function ear(o, S, c, p, side) {
  let g; if (o.kind === 'round') { g = new THREE.SphereGeometry(o.size * S, 12, 8); g.scale(1, 1, .45); }
  else if (o.kind === 'leaf') { g = new THREE.SphereGeometry(o.size * S, 12, 8); g.scale(.45, 1, .22); g.translate(0, o.size * S * .8, 0); }
  else { g = new THREE.ConeGeometry(o.size * S * .45, o.size * S, 4); g.scale(1, 1, .35); g.translate(0, o.size * S * .45, 0); }
  const m = new THREE.Mesh(g, stdMat(c, { rough: .85 })); m.position.copy(p); m.rotation.set(-(o.back || 0) * DEG, 0, -side * (o.splay || 20) * DEG); return m;
}
// a horn: a spiral or a sweep, tapering to a point
function horn(o, S, c, p, side) {
  const pts = []; for (let i = 0; i <= 8; i++) { const t = i / 8, a = t * (o.turn || 1.2) * Math.PI;
    pts.push(V(side * (o.out0 || .2 + t * (o.spread || .5)) * o.len * S * t, Math.sin(a) * o.len * S * .45 + t * o.len * S * (o.rise || .2), -(1 - Math.cos(a)) * o.len * S * .4 - t * o.len * S * (o.back || .3))); }
  const m = new THREE.Mesh(taperTube(pts, o.r * S, o.r * S * .12, 10), stdMat(c, { rough: .5 })); m.position.copy(p); return m;
}
// antlers: a beam that sweeps up and back, with tines along it that branch forward and up
function antler(o, S, c, p, side, r) {
  const geos = [], tips = [], L = o.len * S;
  const grow = (start, dir, len, rad, depth) => { const pts = [start.clone()]; let d = dir.clone(); const n = 5;
    for (let i = 1; i <= n; i++) { d.add(V(0, .08, -.04)).add(V((r() - .5) * .25, (r() - .5) * .15, (r() - .5) * .25)).normalize(); pts.push(pts[i - 1].clone().addScaledVector(d, len / n)); }
    geos.push(taperTube(pts, rad, rad * .3, 7)); tips.push(pts[n].clone());
    if (depth > 0) for (let i = 1; i < n; i++) if (r() < (depth > 1 ? .75 : .45)) { const td = V(side * (r() - .3) * .6, .8, .55 + r() * .4).normalize(); grow(pts[i], td, len * (.32 + r() * .2), rad * .55, depth - 1); } };
  grow(V(), V(side * .55, .7, -.15).normalize(), L, o.r * S, o.depth ?? 2);
  const m = new THREE.Mesh(mergeGeometries(geos), stdMat(c, { rough: .75 })); m.position.copy(p); m.userData.tips = tips.map(t => t.add(p)); return m;
}
// a mist the antlers breathe (Session 969, OG-088's stag of shadows): from each tine's tip `per` puffs rise, swell and fade, each one
// `life` of a stride behind the last, so the whole mist loops with the gait and a still picture is the same every time. The puffs are
// points on the head bone, soft discs of the plan's `mist` tone drawn after the body (no depth write, no shadow); they rise `rise`
// metres, drift back by `drift` and grow from `r0` to `r1`, their opacity `alpha` at the most. Up and back are the body's, not the head's
// (Session 975): `pose` passes the head's turn against the body, so a lowered head's mist still rises straight up from its tines
function mistPoints(o, seed) { const r = rng(seed + 31), per = o.per ?? 5, n = o.tips.length * per, pos = new Float32Array(n * 3), size = new Float32Array(n), alpha = new Float32Array(n), q = [];
  o.tips.forEach((t, i) => { for (let k = 0; k < per; k++) q.push({ t, off: (k + r() * .5) / per, dx: (r() - .5) * .6, dz: (r() - .5) * .6, sp: .8 + .4 * r() }); });
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('aSize', new THREE.BufferAttribute(size, 1)); g.setAttribute('aAlpha', new THREE.BufferAttribute(alpha, 1));
  const m = new THREE.ShaderMaterial({ transparent: true, depthWrite: false, uniforms: { uColor: { value: o.color }, uH: { value: 720 }, uS: { value: 1 } },
    vertexShader: 'attribute float aSize; attribute float aAlpha; uniform float uH; uniform float uS; varying float vA;\nvoid main(){ vec4 mv = modelViewMatrix * vec4(position, 1.); gl_Position = projectionMatrix * mv; gl_PointSize = aSize * uS * projectionMatrix[1][1] * uH * .5 / -mv.z; vA = aAlpha; }',
    fragmentShader: 'uniform vec3 uColor; varying float vA;\nvoid main(){ vec2 d = gl_PointCoord - .5; float e = 1. - smoothstep(.1, .5, length(d)); if (e <= 0.) discard; gl_FragColor = vec4(uColor, vA * e); }' });
  const pts = new THREE.Points(g, m); pts.name = 'mist'; pts.frustumCulled = false; pts.renderOrder = 2; pts.userData = { o, q };
  pts.onBeforeRender = R => { m.uniforms.uH.value = R.getDrawingBufferSize(new THREE.Vector2()).y; };
  mistTick(pts, 0); return pts; }
const _mX = new THREE.Vector3(), _mY = new THREE.Vector3(), _mZ = new THREE.Vector3();
function mistTick(pts, ph, qInv) { const { o, q } = pts.userData, g = pts.geometry, P = g.attributes.position, S = g.attributes.aSize, A = g.attributes.aAlpha, rate = o.rate ?? 2;
  _mX.set(1, 0, 0); _mY.set(0, 1, 0); _mZ.set(0, 0, 1); if (qInv) { _mX.applyQuaternion(qInv); _mY.applyQuaternion(qInv); _mZ.applyQuaternion(qInv); }
  q.forEach((u, i) => { const a = (ph * rate + u.off) % 1, rise = (o.rise ?? .35) * a * u.sp, x = u.dx * rise * .5, z = -(o.drift ?? .15) * a + u.dz * rise * .5;
    P.setXYZ(i, u.t.x + _mX.x * x + _mY.x * rise + _mZ.x * z, u.t.y + _mX.y * x + _mY.y * rise + _mZ.y * z, u.t.z + _mX.z * x + _mY.z * rise + _mZ.z * z);
    S.setX(i, lerp(o.r0 ?? .05, o.r1 ?? .22, Math.sqrt(a))); A.setX(i, (o.alpha ?? .35) * sstep(0, .15, a) * (1 - sstep(.45, 1, a))); });
  P.needsUpdate = S.needsUpdate = A.needsUpdate = true; }
// crystal horns: layered shards sweeping back from the brow (the Shatterhorn, OG-040). `rake` (Session 920) scales how far they
// lean and step back: 1 the Shatterhorn's sweep, toward 0 a crown standing up from the brow. `stone` (Session 926): matte rock, not glass
function crystals(o, S, c, p, side, r) {
  const rk = o.rake ?? 1, geos = []; for (let i = 0; i < o.n; i++) { const L = o.len * S * (1 - .55 * i / o.n) * (.8 + r() * .3), g = new THREE.ConeGeometry(o.r * S * (1 - .4 * i / o.n), L, 5); g.translate(0, L / 2, 0);
    g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(UP, V(side * (.35 + .5 * r()), .5 + .4 * r() - .25 * i / o.n, (-.5 - .4 * i / o.n) * rk).normalize()));
    g.translate(side * i * o.r * S * .6, -i * o.r * S * .3, -i * o.r * S * .9 * rk); geos.push(g.toNonIndexed()); }
  const m = new THREE.Mesh(mergeGeometries(geos), o.stone ? stdMat(c, { rough: .95, flat: true }) : new THREE.MeshPhysicalMaterial({ color: c, roughness: .15, metalness: 0, flatShading: true, emissive: c.clone().multiplyScalar(.25), clearcoat: 1, transparent: true, opacity: .92 })); m.position.copy(p); return m;
}
function beak(o, S, c, p, dir) { const g = new THREE.ConeGeometry(o.r * S, o.len * S, 8); g.scale(1, 1, .75); g.translate(0, o.len * S / 2, 0); const m = new THREE.Mesh(g, stdMat(c, { rough: .4 })); m.position.copy(p); m.quaternion.setFromUnitVectors(UP, dir.clone().add(V(0, -(o.hook || .1), 0)).normalize()); return m; }

// ── the flesh: a smooth surface grown around the capsules, meshed by surface nets on a grid ──
// A capsule's field is exp(-d/k), d its distance; capsules of one group take their nearest (hard union), groups add
// (smooth union). The surface is where the sum is 1. Weights use the same distances, so a joint bends where flesh joins.
function capDist(c, x, y, z) {
  const ax = c.a.x, ay = c.a.y, az = c.a.z, bx = c.b.x - ax, by = c.b.y - ay, bz = c.b.z - az, px = x - ax, py = y - ay, pz = z - az, bb = bx * bx + by * by + bz * bz;
  const t = bb > 0 ? Math.max(0, Math.min(1, (px * bx + py * by + pz * bz) / bb)) : 0;
  const ox = (px - bx * t) / c.s[0], oy = (py - by * t) / c.s[1], oz = (pz - bz * t) / c.s[2];
  return (Math.sqrt(ox * ox + oy * oy + oz * oz) - (c.ra + (c.rb - c.ra) * t)) * c.sm;
}
function growFlesh(flesh, o) {
  const k = o.blend, cell = o.cell, pad = k * 5;
  for (const c of flesh) c.sm = (c.s[0] + c.s[1] + c.s[2]) / 3;
  const mn = V(1e9, 1e9, 1e9), mx = V(-1e9, -1e9, -1e9);
  for (const c of flesh) { const R = Math.max(c.ra, c.rb) * Math.max(...c.s) + pad; for (const p of [c.a, c.b]) { mn.min(p.clone().subScalar(R)); mx.max(p.clone().addScalar(R)); } }
  const nx = Math.ceil((mx.x - mn.x) / cell) + 1, ny = Math.ceil((mx.y - mn.y) / cell) + 1, nz = Math.ceil((mx.z - mn.z) / cell) + 1, F = new Float32Array(nx * ny * nz);
  const idx = (i, j, l) => i + nx * (j + ny * l);
  const groups = new Map(); for (const c of flesh) { if (!groups.has(c.group)) groups.set(c.group, []); groups.get(c.group).push(c); }
  for (const caps of groups.values()) {
    let i0 = 1e9, j0 = 1e9, l0 = 1e9, i1 = -1, j1 = -1, l1 = -1;
    for (const c of caps) { const R = Math.max(c.ra, c.rb) * Math.max(...c.s) + pad;
      i0 = Math.min(i0, Math.floor((Math.min(c.a.x, c.b.x) - R - mn.x) / cell)); i1 = Math.max(i1, Math.ceil((Math.max(c.a.x, c.b.x) + R - mn.x) / cell));
      j0 = Math.min(j0, Math.floor((Math.min(c.a.y, c.b.y) - R - mn.y) / cell)); j1 = Math.max(j1, Math.ceil((Math.max(c.a.y, c.b.y) + R - mn.y) / cell));
      l0 = Math.min(l0, Math.floor((Math.min(c.a.z, c.b.z) - R - mn.z) / cell)); l1 = Math.max(l1, Math.ceil((Math.max(c.a.z, c.b.z) + R - mn.z) / cell)); }
    i0 = Math.max(0, i0); j0 = Math.max(0, j0); l0 = Math.max(0, l0); i1 = Math.min(nx - 1, i1); j1 = Math.min(ny - 1, j1); l1 = Math.min(nz - 1, l1);
    for (let l = l0; l <= l1; l++) { const z = mn.z + l * cell; for (let j = j0; j <= j1; j++) { const y = mn.y + j * cell; for (let i = i0; i <= i1; i++) { const x = mn.x + i * cell;
      let d = 1e9; for (const c of caps) { const e = capDist(c, x, y, z); if (e < d) d = e; }
      if (d < pad) F[idx(i, j, l)] += Math.exp(-d / k); } } }
  }
  // holes (Session 954): the field is cut to nothing inside a hole and eased back over a cell and a half outside it, so its wall is smooth
  for (const h of o.holes || []) { const e = cell * 1.5, R = h.ra + e;
    const i0 = Math.max(0, Math.floor((Math.min(h.a.x, h.b.x) - R - mn.x) / cell)), i1 = Math.min(nx - 1, Math.ceil((Math.max(h.a.x, h.b.x) + R - mn.x) / cell));
    const j0 = Math.max(0, Math.floor((Math.min(h.a.y, h.b.y) - R - mn.y) / cell)), j1 = Math.min(ny - 1, Math.ceil((Math.max(h.a.y, h.b.y) + R - mn.y) / cell));
    const l0 = Math.max(0, Math.floor((Math.min(h.a.z, h.b.z) - R - mn.z) / cell)), l1 = Math.min(nz - 1, Math.ceil((Math.max(h.a.z, h.b.z) + R - mn.z) / cell));
    for (let l = l0; l <= l1; l++) for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) { const q = idx(i, j, l); if (F[q] > 0) F[q] *= sstep(0, e, capDist(h, mn.x + i * cell, mn.y + j * cell, mn.z + l * cell)); } }
  // surface nets: a vertex in every cell the surface crosses, at the mean of its edge crossings; a quad across every crossed edge
  const L = v => Math.log(Math.max(v, 1e-9)), cellV = new Int32Array(nx * ny * nz).fill(-1), pos = [];
  const CO = [[0, 0, 0], [1, 0, 0], [0, 1, 0], [1, 1, 0], [0, 0, 1], [1, 0, 1], [0, 1, 1], [1, 1, 1]], ED = [[0, 1], [2, 3], [4, 5], [6, 7], [0, 2], [1, 3], [4, 6], [5, 7], [0, 4], [1, 5], [2, 6], [3, 7]];
  const cv = new Float64Array(8);
  for (let l = 0; l < nz - 1; l++) for (let j = 0; j < ny - 1; j++) for (let i = 0; i < nx - 1; i++) {
    let inside = 0; for (let c = 0; c < 8; c++) { cv[c] = L(F[idx(i + CO[c][0], j + CO[c][1], l + CO[c][2])]); if (cv[c] > 0) inside++; }
    if (inside === 0 || inside === 8) continue;
    let sx = 0, sy = 0, sz = 0, n = 0;
    for (const [a, b] of ED) { if ((cv[a] > 0) === (cv[b] > 0)) continue; const t = cv[a] / (cv[a] - cv[b]); sx += lerp(CO[a][0], CO[b][0], t); sy += lerp(CO[a][1], CO[b][1], t); sz += lerp(CO[a][2], CO[b][2], t); n++; }
    cellV[idx(i, j, l)] = pos.length / 3; pos.push(mn.x + (i + sx / n) * cell, mn.y + (j + sy / n) * cell, mn.z + (l + sz / n) * cell);
  }
  const ind = [], quad = (a, b, c, d, flip) => { if (a < 0 || b < 0 || c < 0 || d < 0) return; if (flip) ind.push(a, c, b, a, d, c); else ind.push(a, b, c, a, c, d); };
  for (let l = 1; l < nz - 1; l++) for (let j = 1; j < ny - 1; j++) for (let i = 1; i < nx - 1; i++) {
    const v0 = F[idx(i, j, l)] > 1;
    if ((F[idx(i + 1, j, l)] > 1) !== v0) quad(cellV[idx(i, j - 1, l - 1)], cellV[idx(i, j, l - 1)], cellV[idx(i, j, l)], cellV[idx(i, j - 1, l)], !v0);
    if ((F[idx(i, j + 1, l)] > 1) !== v0) quad(cellV[idx(i - 1, j, l - 1)], cellV[idx(i - 1, j, l)], cellV[idx(i, j, l)], cellV[idx(i, j, l - 1)], !v0);
    if ((F[idx(i, j, l + 1)] > 1) !== v0) quad(cellV[idx(i - 1, j - 1, l)], cellV[idx(i, j - 1, l)], cellV[idx(i, j, l)], cellV[idx(i - 1, j, l)], !v0);
  }
  // two passes of Taubin smoothing take the grid's steps out without shrinking the body
  const nv = pos.length / 3, nb = Array.from({ length: nv }, () => new Set());
  for (let t = 0; t < ind.length; t += 3) for (let e = 0; e < 3; e++) { const a = ind[t + e], b = ind[t + (e + 1) % 3]; nb[a].add(b); nb[b].add(a); }
  const P0 = Float32Array.from(pos), tmp = new Float32Array(P0.length);
  for (let it = 0; it < 4; it++) { const f = it % 2 ? -.53 : .5; for (let v = 0; v < nv; v++) { let x = 0, y = 0, z = 0; for (const w of nb[v]) { x += P0[w * 3]; y += P0[w * 3 + 1]; z += P0[w * 3 + 2]; } const c = nb[v].size || 1;
    tmp[v * 3] = P0[v * 3] + f * (x / c - P0[v * 3]); tmp[v * 3 + 1] = P0[v * 3 + 1] + f * (y / c - P0[v * 3 + 1]); tmp[v * 3 + 2] = P0[v * 3 + 2] + f * (z / c - P0[v * 3 + 2]); } P0.set(tmp); }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(P0, 3)); g.setIndex(ind); g.computeVertexNormals();
  return { geo: g, grid: [nx, ny, nz] };
}

// skin weights, tone and the fur and glow masks, read off the flesh at every vertex
const FURRY = new Set(['coat', 'pale', 'mane']);
// a bare body (Session 934, the skeleton): no grown skin. Each capsule of flesh is drawn as the bone it stands for: a limb's as a
// shaft with a knob at each end, the spine's, neck's and tail's as a stack of vertebrae, the head's and jaw's whole, as the skull.
// The pieces are skinned as a hide is (dressFlesh), so a bone's shape moves with its bone
function bareGeo(B, o) { const gs = [];
  for (const f of B.flesh) { f.sm = (f.s[0] + f.s[1] + f.s[2]) / 3; const d = f.b.clone().sub(f.a), L = d.length(); if (L < 1e-4) continue;
    const q = new THREE.Quaternion().setFromUnitVectors(UP, d.clone().normalize()), put = (g, at, sc) => { if (sc) g.scale(...sc); g.applyQuaternion(q); g.translate(at.x, at.y, at.z); gs.push(g); };
    const name = B.bones[f.bone].name;
    if (name === 'head' || name === 'jaw') { if (!B.skull) put(new THREE.CapsuleGeometry((f.ra + f.rb) / 2, L, 6, 14), f.a.clone().lerp(f.b, .5), [f.s[0], 1, f.s[1]]); }
    else if (/^(spine|neck|tail)/.test(f.group)) { const n = Math.max(1, Math.round(L / (o.vert ?? .05)));
      for (let k = 0; k < n; k++) { const t = (k + .5) / n, r = lerp(f.ra, f.rb, t) * (o.vr ?? .3); put(new THREE.CylinderGeometry(r, r * 1.1, L / n * .6, 10), f.a.clone().lerp(f.b, t)); } }
    else { const sh = o.shaft ?? .32, kn = o.knob ?? .5; put(new THREE.CylinderGeometry(f.rb * sh, f.ra * sh, L, 8), f.a.clone().lerp(f.b, .5));
      for (const [p, r] of [[f.a, f.ra], [f.b, f.rb]]) { const g = new THREE.SphereGeometry(r * kn, 10, 8); g.translate(p.x, p.y, p.z); gs.push(g); } } }
  const geo = mergeGeometries(gs.map(g => { g.deleteAttribute('uv'); return g; })); return { geo, grid: [0, 0, 0] }; }
// a modelled skull (Session 942), for a bare head whose two capsules read soft and cartoonish: a cranium longer than it is wide, a
// brow ridge over two dark sockets, cheekbones swept back to the ears, a face and an upper jaw under a dark nasal hole, a row of
// upper teeth; and on the jaw bone a mandible, two branches from below the ears to the chin, with its own row. Built in the head's
// frame in metres (x across, y up, z ahead, the neck's joint at 0) and scaled by the head's slider. The capsules stay, unseen, so the
// weights are read as before. A socket holds a small lit eye when the plan's eyes are bright (the drowned skeleton's)
function skullBits(B, o, S, base, dir, up) {
  const side = up.clone().cross(dir).normalize(), M = new THREE.Matrix4().makeBasis(side, up, dir).scale(V(S, S, S)).setPosition(base);
  const bt = o.skull.tone || 'coat', boneM = stdMat(B.tone(bt), { rough: .7 }), dark = stdMat(B.tone('dark'), { rough: .95 }), toothM = stdMat(B.tone(bt).clone().lerp(new THREE.Color(1, .97, .88), .4), { rough: .45 });
  const L = (x, y, z) => V(x, y, z).applyMatrix4(M), ell = (h, c) => { const g = new THREE.SphereGeometry(1, 18, 12); g.scale(...h); g.translate(...c); return g; };
  const put = (bone, gs, m) => { const g = mergeGeometries(gs.map(q => { q.deleteAttribute('uv'); return q.applyMatrix4(M); })); g.computeVertexNormals(); const mesh = new THREE.Mesh(g, m); mesh.name = 'skull'; B.bit(bone, mesh); return g.index.count / 3; };
  const tube = (pts, r0, r1) => { const g = taperTube(pts.map(p => V(...p)), r0, r1, 8); return g; };
  const teeth = (cy, cz, rad, h, n = 10, span = 1.15) => { const gs = []; for (let k = 0; k < n; k++) { const a = -span + 2 * span * k / (n - 1), g = new THREE.BoxGeometry(.0068, h, .0055); g.rotateY(a); g.translate(Math.sin(a) * rad, cy, cz + Math.cos(a) * rad); gs.push(g); } return gs; };
  const head = [ell([.07, .072, .094], [0, .062, .005]), ell([.054, .046, .056], [0, -.002, .05]), ell([.036, .021, .032], [0, -.04, .072]),
    tube([[-.052, .029, .077], [-.028, .033, .086], [0, .03, .088], [.028, .033, .086], [.052, .029, .077]], .0075, .0075)];
  for (const sd of [1, -1]) head.push(tube([[sd * .05, -.006, .08], [sd * .064, -.01, .05], [sd * .066, -.006, .014]], .01, .007));
  let tris = put('head', head, boneM);
  const holes = [ell([.019, .017, .009], [.031, .01, .087]), ell([.019, .017, .009], [-.031, .01, .087]), ell([.009, .013, .006], [0, -.022, .098])];
  tris += put('head', holes, dark) + put('head', teeth(-.058, .075, .028, .012), toothM);
  const jaw = [ell([.016, .012, .012], [0, -.088, .082])]; for (const sd of [1, -1]) jaw.push(tube([[sd * .058, -.012, .008], [sd * .055, -.05, .0], [sd * .051, -.078, .008], [sd * .038, -.086, .055], [sd * .012, -.09, .08]], .0095, .008));
  tris += put('jaw', jaw, boneM) + put('jaw', teeth(-.072, .07, .025, .01), toothM);
  const e = (o.eyes || [])[0]; if (e && Math.max(...e.color) > .2) for (const sd of [1, -1]) B.bit('head', eye(.0075 * S, e.color, L(sd * .031, .01, .095)));
  B.skull = { tris: Math.round(tris), teeth: 20, top: +(.139 * S).toFixed(3) };
}
// ribs (Session 934): a cage of arcs off the spine, each from the spine round the side and forward toward a breastbone it stops short
// of; `from`/`to` the stretch of the spine they cover, `w` the cage's half-width, `d` its depth ahead of the spine, `drop` how far a rib
// falls on its way round. With `pelvis`, two flared blades of hip on the first spine bone
P.ribs = (B, o) => { const gs = [];
  for (let i = 0; i < o.n; i++) { const u = i / (o.n - 1), sp = B.spineAt(lerp(o.from, o.to, u)), k = Math.sin(Math.PI * (.25 + .75 * u)), W = o.w * k, D = o.d * (.6 + .4 * k), c = sp.p.clone().add(V(0, 0, D));
    for (const sd of [1, -1]) { const pts = []; for (let j = 0; j <= 8; j++) { const t = j / 8, th = t * Math.PI * (o.wrap ?? .82); pts.push(c.clone().add(V(sd * W * Math.sin(th), -o.drop * t, -D * Math.cos(th)))); }
      gs.push(taperTube(pts, o.r, o.r * .7, 6)); } }
  const m = new THREE.Mesh(mergeGeometries(gs), stdMat(B.tone('coat'), { rough: .7 })); m.name = 'ribs'; B.bit(B.spineAt((o.from + o.to) / 2).bone, m);
  if (o.pelvis) { const h = B.spinePts[0], P0 = o.pelvis; for (const sd of [1, -1]) { const g = new THREE.SphereGeometry(P0.r, 14, 10); g.scale(1, 1.1, .3); g.rotateY(sd * .9); g.translate(h.x + sd * P0.out, h.y + P0.up, h.z); B.bit(B.spineNames[0], new THREE.Mesh(g, stdMat(B.tone('coat'), { rough: .7 }))); } }
  B.ribs = o.n * 2; };
function dressFlesh(geo, B, pal, plan) {
  const pos = geo.attributes.position, nrm = geo.attributes.normal, n = pos.count;
  const si = new Uint16Array(n * 4), sw = new Float32Array(n * 4), col = new Float32Array(n * 3), fur = new Float32Array(n), glow = new Float32Array(n), alpha = plan.faceClear ? new Float32Array(n).fill(1) : null;
  const wb = new Float32Array(B.bones.length), tones = Object.keys(pal), tw = new Float32Array(tones.length), toneI = Object.fromEntries(tones.map((t, i) => [t, i]));
  const kw = B.flesh.map(c => Math.max(.006, .32 * (c.ra + c.rb) / 2)), C = new THREE.Color(), D = new THREE.Color(), pat = plan.pattern, gl = plan.glow;
  for (let v = 0; v < n; v++) {
    const x = pos.getX(v), y = pos.getY(v), z = pos.getZ(v); wb.fill(0); tw.fill(0);
    for (let c = 0; c < B.flesh.length; c++) { const f = B.flesh[c], d = capDist(f, x, y, z); if (d > kw[c] * 9) continue; const w = Math.exp(-Math.max(0, d) / kw[c]) * (d < 0 ? 1 + Math.min(4, -d / kw[c]) : 1); wb[f.bone] += w; tw[toneI[f.tone] ?? 0] += w; }
    const top = []; for (let b = 0; b < wb.length; b++) if (wb[b] > 0) top.push(b); top.sort((a, b) => wb[b] - wb[a]); const tsum = top.slice(0, 4).reduce((s, b) => s + wb[b], 0) || 1;
    for (let q = 0; q < 4; q++) { const b = top[q]; si[v * 4 + q] = b ?? 0; sw[v * 4 + q] = b === undefined ? 0 : wb[b] / tsum; }
    if (!top.length) sw[v * 4] = 1;
    let ts = 0; for (const t of tw) ts += t; C.setRGB(0, 0, 0); let furry = 0;
    for (let t = 0; t < tones.length; t++) if (tw[t] > 0) { const w = tw[t] / ts; D.copy(pal[tones[t]]); C.r += D.r * w; C.g += D.g * w; C.b += D.b * w; if (FURRY.has(tones[t])) furry += w; }
    // counter-shading: the saddle darkens what faces the sky, the belly lightens what faces the ground (the game's wolves do this)
    const ny = nrm.getY(v), coatW = (tw[toneI.coat] || 0) / (ts || 1);
    if (pal.saddle && coatW > 0) C.lerp(pal.saddle, coatW * sstep(.15, .85, ny) * .85);
    if (pal.belly && coatW > 0) C.lerp(pal.belly, coatW * sstep(-.1, -.75, ny));
    if (pat?.kind === 'bands') { const b = Math.sin(z * Math.PI * 2 / pat.period + PN.noise(x * 6, y * 6, z * 2) * 1.2); if (b > .35) C.lerp(pal[pat.tone], .85 * coatW); }
    if (pat?.kind === 'stripes') { const b = Math.sin(z * Math.PI * 2 / pat.period + PN.noise(x * 3, y * 3, z) * 2.5); if (b > .55 && ny > -.2) C.lerp(pal[pat.tone], .7 * coatW); }
    // patches (Session 845): a pied coat, where low-frequency noise crosses a threshold; the edge is a little ragged.
    // `up` (Session 926) keeps them to what faces the sky, as moss grows on stone (the troll's)
    if (pat?.kind === 'patches') { const q = PN.noise(x / pat.size, y / pat.size + 7.3, z / pat.size) + PN.noise(x * 9, y * 9, z * 9) * .08; if (q > (pat.cut ?? .1)) C.lerp(pal[pat.tone], (pat.amount ?? 1) * coatW * (pat.up === undefined ? 1 : sstep(pat.up, pat.up + .35, ny))); }
    // a face mask (Session 845): on the head, between two distances out from its middle line, from the nose back over
    // the eyes to the ears, a stripe of one tone, and the rest of the face another (the badger's black stripes on white)
    if (plan.face && B.headFrame && B.by.head && (wb[B.by.head.i] + (B.by.jaw ? wb[B.by.jaw.i] : 0)) / tsum > .5) { const F = plan.face, H = B.headFrame, rel = V(x, y, z).sub(H.base), along = rel.dot(H.dir) / H.len, side = Math.abs(rel.x) / H.r, upw = rel.dot(H.up) / H.r;
      if (along > (F.back ?? -.3) && upw > -.35) C.copy(pal[side > F.from && side < F.to ? F.stripe : F.ground]).multiplyScalar(.95 + .1 * PN.noise(x * 40, y * 40, z * 40)); }
    const mott = 1 + (PN.noise(x * 4.1, y * 4.1, z * 4.1) * .16 + PN.noise(x * 17, y * 17, z * 17) * .06) * (plan.mottle ?? 1); C.multiplyScalar(mott);
    col[v * 3] = C.r; col[v * 3 + 1] = C.g; col[v * 3 + 2] = C.b; fur[v] = furry;
    // the ice thin over the face (Session 968, the frozen man's): the hide's opacity falls from the plan's `clear` to `faceClear` over the
    // head's front, so the skull under it shows; the crown and the back of the head keep the full frost
    if (alpha && B.headFrame && B.by.head) { const H = B.headFrame, hs = (wb[B.by.head.i] + (B.by.jaw ? wb[B.by.jaw.i] : 0)) / tsum, rel = V(x, y, z).sub(H.base), fwd = rel.dot(H.dir) / H.len, upw = rel.dot(H.up) / H.r;
      alpha[v] = lerp(1, plan.faceClear / plan.clear, sstep(.5, .85, hs) * sstep(.25, .5, fwd) * sstep(.9, .45, upw)); }
    // the binding's seams: a crack pattern along the line `glow.line` (the spine's seam) or over the whole hide
    if (gl) { const cr = Math.abs(PN.noise(x * gl.freq, y * gl.freq, z * gl.freq * .6)), seam = gl.seam ? sstep(gl.seam.w, 0, Math.abs(x)) * sstep(gl.seam.y0, gl.seam.y0 + .08, y) * (ny > .2 ? 1 : 0) : 0;
      glow[v] = Math.max(seam, sstep(gl.w, 0, cr) * (gl.all || 0), (gl.base || 0) * (1 - .5 * Math.max(0, -ny))); }
  }
  geo.setAttribute('skinIndex', new THREE.Uint16BufferAttribute(si, 4)); geo.setAttribute('skinWeight', new THREE.Float32BufferAttribute(sw, 4));
  geo.setAttribute('color', new THREE.Float32BufferAttribute(col, 3)); geo.setAttribute('aFur', new THREE.Float32BufferAttribute(fur, 1)); geo.setAttribute('aGlow', new THREE.Float32BufferAttribute(glow, 1));
  if (alpha) geo.setAttribute('aAlpha', new THREE.Float32BufferAttribute(alpha, 1));
}

// ── materials: the hide, fur shells (cut by noise, as the people's mantles are), and the binding's glow ──
const GLOW_HEAD = 'attribute float aGlow; attribute float aFur; varying float vGlow; varying float vFur; varying vec3 vRP;\n';
function hideMat(o) {
  const m = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: o.rough ?? .85, metalness: 0, ...(o.opacity < 1 ? { transparent: true, opacity: o.opacity, depthWrite: false } : {}) });
  m.onBeforeCompile = s => { s.uniforms.uGlow = { value: new THREE.Color(...(o.glow || [0, 0, 0])) };
    s.vertexShader = GLOW_HEAD + (o.face ? 'attribute float aAlpha; varying float vAlpha;\n' : '') + s.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\n vGlow = aGlow; vFur = aFur; vRP = position;' + (o.face ? ' vAlpha = aAlpha;' : ''));
    s.fragmentShader = 'uniform vec3 uGlow; varying float vGlow; varying float vFur; varying vec3 vRP;\n' + (o.face ? 'varying float vAlpha;\n' : '') + s.fragmentShader.replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\n totalEmissiveRadiance += uGlow * vGlow;')
      .replace('vec4 diffuseColor = vec4( diffuse, opacity );', o.face ? 'vec4 diffuseColor = vec4( diffuse, opacity * vAlpha );' : 'vec4 diffuseColor = vec4( diffuse, opacity );'); };
  m.customProgramCacheKey = () => 'hide' + JSON.stringify(o.glow || 0) + (o.opacity < 1 ? 'c' : '') + (o.face ? 'f' : ''); return m;
}
function furMat(o, layer, layers) {
  const m = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: .9, side: THREE.DoubleSide, alphaTest: .5 });
  m.onBeforeCompile = s => {
    s.vertexShader = 'attribute vec3 aBase;\n' + GLOW_HEAD + s.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\n vGlow = aGlow; vFur = aFur; vRP = aBase;');
    s.fragmentShader = 'varying float vGlow; varying float vFur; varying vec3 vRP;\nfloat hh(vec3 p){ p = fract(p * .3183099 + .1); p *= 17.; return fract(p.x * p.y * p.z * (p.x + p.y + p.z)); }\nfloat nz(vec3 x){ vec3 i = floor(x), f = fract(x); f = f * f * (3. - 2. * f); return mix(mix(mix(hh(i), hh(i + vec3(1,0,0)), f.x), mix(hh(i + vec3(0,1,0)), hh(i + vec3(1,1,0)), f.x), f.y), mix(mix(hh(i + vec3(0,0,1)), hh(i + vec3(1,0,1)), f.x), mix(hh(i + vec3(0,1,1)), hh(i + vec3(1,1,1)), f.x), f.y), f.z); }\n'
      + s.fragmentShader.replace('vec4 diffuseColor = vec4( diffuse, opacity );', `float L = ${(layer / layers).toFixed(3)};
        vec3 q = vRP * vec3(${(o.sx || 300).toFixed(1)}, ${(o.sy || o.sx || 300).toFixed(1)}, ${(o.sz || o.sx || 300).toFixed(1)}); float strand = nz(q) * .7 + nz(q * 2.3) * .3;
        float keep = step(L * .85 + .1, strand) * step(.5, vFur) * step(vGlow, .25);
        vec4 diffuseColor = vec4(diffuse * (.55 + .6 * L) * (.85 + .3 * strand), keep);`); };
  m.customProgramCacheKey = () => 'cfur' + layer + '/' + layers + JSON.stringify(o); return m;
}

// ── the genome: a plan, a seed, the generic sliders and a palette shift; a few hundred bytes ──
export const SLIDERS = { size: [.5, 3], leg: [.6, 1.6], bulk: [.7, 1.4], neck: [.5, 1.8], tail: [.3, 1.8], head: [.7, 1.4] };
export function genome(plan, key, over = {}) {
  const seed = typeof key === 'number' ? key : hashKey(key), r = rng(seed), P0 = PLANS[plan], spread = P0.spread ?? .06;
  const sliders = {}, q = v => Math.round(v * 1000) / 1000; for (const k in SLIDERS) sliders[k] = q(1 + (r() - .5) * 2 * spread * (k === 'size' ? 1.5 : 1));
  const g = { plan, seed, sliders: { ...sliders, ...(over.sliders || {}) }, tint: over.tint ?? q((r() - .5) * .1), light: over.light ?? q((r() - .5) * .14) };
  if (ISLES.includes(over.island)) g.island = over.island; return g;
}
// the saved genome (Session 807, B5): the envelope a person's has (people.js, toSaved), so one page and one loader (kit.js)
// take both. A hand-edited genome is held to the sliders' ranges; a slider the kit does not know is dropped.
const q3 = v => Math.round(v * 1000) / 1000;
export function toSaved(g) { return { species: 'creature', v: 1, plan: g.plan, seed: g.seed, sliders: Object.fromEntries(Object.keys(SLIDERS).map(k => [k, q3(g.sliders?.[k] ?? 1)])), tint: q3(g.tint || 0), light: q3(g.light || 0), ...(g.island ? { island: g.island } : {}) }; }
export function fromSaved(J) {
  if (!J || J.species !== 'creature') throw new Error('not a creature genome'); if (J.v !== 1) throw new Error('creature genome version ' + J.v + ', the kit reads 1');
  if (!PLANS[J.plan]) throw new Error('no body plan called ' + J.plan); const g = genome(J.plan, J.seed ?? J.plan);
  for (const [k, [lo, hi]] of Object.entries(SLIDERS)) if (typeof J.sliders?.[k] === 'number') g.sliders[k] = q3(Math.max(lo, Math.min(hi, J.sliders[k])));
  for (const k of ['tint', 'light']) if (typeof J[k] === 'number') g[k] = q3(Math.max(-.5, Math.min(.5, J[k]))); if (ISLES.includes(J.island)) g.island = J.island; return g;
}

// ── build: run the plan's parts, grow the flesh, bind it to the skeleton ──
export function build(g) {
  const plan = PLANS[g.plan], t0 = performance.now(), pal = {};
  for (const [k, c] of Object.entries({ ...plan.palette, ...(COATS[g.island]?.[g.plan] || {}) })) { const C = new THREE.Color().setRGB(...c, THREE.SRGBColorSpace), hsl = {}; C.getHSL(hsl); C.setHSL((hsl.h + g.tint + 1) % 1, hsl.s, Math.max(0, Math.min(1, hsl.l * (1 + g.light)))); pal[k] = C; }
  const sg = { ...g, sliders: { ...g.sliders, size: 1 } }; // parts build at size 1; the size slider scales the finished body
  const B = new Body(plan, sg); B.tone = t => pal[t] || pal.coat;
  for (const [part, o] of plan.parts) P[part](B, o);
  const minR = Math.min(...B.flesh.map(c => Math.min(c.ra, c.rb) * Math.min(...c.s)));
  const ext = B.flesh.reduce((m, c) => Math.max(m, Math.abs(c.a.z), Math.abs(c.b.z), Math.abs(c.a.x), Math.abs(c.b.x), c.a.y, c.b.y), 0) * 2;
  const cell = plan.cell ?? Math.max(minR * .7, ext / 240), blend = plan.blend ?? Math.max(cell * 1.2, .25 * minR);
  const { geo, grid } = plan.bare ? bareGeo(B, plan.bare) : growFlesh(B.flesh, { cell, blend, holes: B.holes });
  dressFlesh(geo, B, pal, plan);
  for (const f of B.after || []) f(geo); // what is laid on the grown skin (a harness, Session 944)
  // the skeleton
  const root = new THREE.Group(), bones = B.bones.map(b => { const o = new THREE.Bone(); o.name = b.name; o.position.copy(b.parent ? b.p.clone().sub(b.parent.p) : b.p); return o; });
  B.bones.forEach((b, i) => { if (b.parent) bones[b.parent.i].add(bones[i]); }); const rig = new THREE.Group(); rig.add(bones[0]); root.add(rig); rig.updateMatrixWorld(true);
  const skel = new THREE.Skeleton(bones), meshes = [];
  const hide = new THREE.SkinnedMesh(geo, hideMat({ glow: plan.glow?.color, rough: plan.rough, opacity: plan.clear, face: !!plan.faceClear })); hide.castShadow = true; hide.name = 'hide'; meshes.push(hide);
  if (plan.fur) for (let k = 1; k <= plan.fur.layers; k++) { const fg = geo.clone(); fg.setAttribute('aBase', new THREE.BufferAttribute(geo.attributes.position.array.slice(), 3)); const p = fg.attributes.position, nm = fg.attributes.normal, fa = fg.attributes.aFur, d = plan.fur.len * k / plan.fur.layers;
    for (let v = 0; v < p.count; v++) { const e = d * fa.getX(v); p.setXYZ(v, p.getX(v) + nm.getX(v) * e, p.getY(v) + nm.getY(v) * e + (plan.fur.droop || 0) * -e * e / plan.fur.len, p.getZ(v) + nm.getZ(v) * e); }
    const m = new THREE.SkinnedMesh(fg, furMat(plan.fur, k, plan.fur.layers)); m.castShadow = k < 3; m.name = 'fur' + k; meshes.push(m); }
  if (B.sheets.length) { const m = new THREE.SkinnedMesh(sheetGeo(B, pal), new THREE.MeshStandardMaterial({ vertexColors: true, side: THREE.DoubleSide, roughness: plan.finRough ?? .5, transparent: true, opacity: plan.finOpacity ?? .9 })); m.castShadow = true; m.name = 'fins'; meshes.push(m); }
  if (B.tubes.length) { const m = new THREE.SkinnedMesh(tubeGeo(B, pal, plan.threadGlow || 1), plan.threadGlow ? new THREE.MeshBasicMaterial({ vertexColors: true, transparent: true, opacity: .85, blending: THREE.AdditiveBlending, depthWrite: false }) : new THREE.MeshStandardMaterial({ vertexColors: true, roughness: .6 })); m.name = 'threads'; meshes.push(m); }
  for (const w of B.wings) { const m = new THREE.SkinnedMesh(wingGeo(B, w, pal), new THREE.MeshStandardMaterial({ vertexColors: true, side: THREE.DoubleSide, roughness: .75, ...(plan.wingOpacity < 1 ? { transparent: true, opacity: plan.wingOpacity, depthWrite: false } : {}) })); m.castShadow = true; m.name = 'wing';
    // a membrane lets light through (Session 959): the face away from the sun was lit by nothing and drew near black, so a skin wing
    // gives back a share of its own colour (`wingLight`, 0.45 unless the plan says) as light that has come through it. Clear wings
    // (the glasswing's) are seen through already and keep their look
    const wl = w.feathered || plan.wingOpacity < 1 ? 0 : plan.wingLight ?? .45; if (wl) m.material.onBeforeCompile = sh => { sh.fragmentShader = sh.fragmentShader.replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\n\ttotalEmissiveRadiance += vColor.rgb * ' + wl.toFixed(3) + ';'); };
    meshes.push(m); }
  for (const m of meshes) { rig.add(m); m.bind(skel); m.frustumCulled = false; m.receiveShadow = true; }
  if (B.mist) B.mistObj = B.bit('head', mistPoints(B.mist, g.seed));
  for (const { bone, obj } of B.bits) { const b = B.by[bone]; obj.position.sub(b.p); obj.castShadow = !obj.isPoints; bones[b.i].add(obj); }
  rig.scale.setScalar(g.sliders.size * (plan.scale || 1)); // a plan may stand at a multiple of its parts (the post hare is a hare at 5.5)
  const C = { g, plan, B, root, rig, bones, byName: Object.fromEntries(bones.map(b => [b.name, b])), skel, meshes, phase: 0, gait: plan.gaits[0], stats: { bones: bones.length, tris: geo.index.count / 3, verts: geo.attributes.position.count, grid: grid.join('x'), cell: +cell.toFixed(3), ms: Math.round(performance.now() - t0) } };
  for (const L of B.legs) { L.bones = L.names.map(n => C.byName[n]); L.restLocal = L.bones[0].position.clone(); L.rest = L.J.map(p => p.clone()); L.dirs = L.J.slice(1).map((p, k) => p.clone().sub(L.J[k]).normalize()); L.lens = L.J.slice(1).map((p, k) => p.distanceTo(L.J[k]));
    // the knee's side of the line from the solved chain's root to its end: the way this leg bends
    const a = L.J[L.ik], b = L.J[L.ik + 2], u = b.clone().sub(a).normalize(), kn = L.J[L.ik + 1].clone().sub(a); L.pole = kn.sub(u.clone().multiplyScalar(kn.dot(u))).normalize(); if (!isFinite(L.pole.x) || L.pole.lengthSq() < .5) L.pole = V(0, 0, 1); }
  { let z0 = 1e9, z1 = -1e9; for (const f of B.flesh) for (const p of [f.a, f.b]) { z0 = Math.min(z0, p.z - f.ra); z1 = Math.max(z1, p.z + f.rb); } C.len = (z1 - z0) * g.sliders.size * (plan.scale || 1); } // its length, nose to tail, in world metres
  C.legH = Math.max(.1, ...B.legs.map(L => L.hR)) || .3; C.S = g.sliders.size * (plan.scale || 1); C.air = {}; C.sac = B.sac; C.mist = B.mistObj;
  if (C.mist) C.mist.material.uniforms.uS.value = C.S;
  const hd = (plan.heading || 0) * DEG; C.dir = V(Math.sin(hd), 0, Math.cos(hd)); // the way it walks in its own frame: a crab goes sideways
  return C;
}
// the wing's membrane: panels between neighbouring fingers and from the last finger back to the flank, skinned to both edges
// fins and other sheets: each vertex rigid on its bone, or shared with a second (`blend`: [bone, weight], the rags'), both faces drawn
function sheetGeo(B, pal) { const pos = [], si = [], sw = [], col = [], ind = [];
  for (const s of B.sheets) { const base = pos.length / 3, C0 = pal[s.tone] || pal.coat; s.pts.forEach((p, i) => { pos.push(p.x, p.y, p.z); const bl = s.blend && s.blend[i], sk = s.skin && s.skin[i]; if (sk) { si.push(...sk.i); sw.push(...sk.w); } else if (bl && bl[1] > 0) { si.push(s.bones[i], bl[0], 0, 0); sw.push(1 - bl[1], bl[1], 0, 0); } else { si.push(s.bones[i], 0, 0, 0); sw.push(1, 0, 0, 0); } const C = s.cols ? s.cols[i] : C0, k = s.cols ? 1 : i ? .85 + .3 * ((i * 37) % 7) / 7 : 1.15; col.push(C.r * k, C.g * k, C.b * k); }); for (const t of s.tris) ind.push(base + t); }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('skinIndex', new THREE.Uint16BufferAttribute(si, 4)); g.setAttribute('skinWeight', new THREE.Float32BufferAttribute(sw, 4)); g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3)); g.setIndex(ind); g.computeVertexNormals(); return g; }
// threads: a thin tube along each chain, each ring rigid on its segment's bone; a glowing thread's colour is HDR, for the bloom
function tubeGeo(B, pal, glow) { const pos = [], si = [], sw = [], col = [], ind = [], RAD = 5;
  for (const t of B.tubes) { const P = t.names.map(n => B.by[n].p), C = (pal[t.tone] || pal.coat).clone().multiplyScalar(glow), base = pos.length / 3;
    for (let i = 0; i < P.length; i++) { const d = (i < P.length - 1 ? P[i + 1].clone().sub(P[i]) : P[i].clone().sub(P[i - 1])).normalize(), a = Math.abs(d.y) < .9 ? UP : V(1, 0, 0), u = a.clone().cross(d).normalize(), w = d.clone().cross(u), r = lerp(t.r0, t.r1, i / (P.length - 1)), f = 1 - .6 * i / (P.length - 1);
      for (let j = 0; j < RAD; j++) { const th = j / RAD * Math.PI * 2, p = P[i].clone().addScaledVector(u, Math.cos(th) * r).addScaledVector(w, Math.sin(th) * r); pos.push(p.x, p.y, p.z); si.push(B.by[t.names[Math.min(i, P.length - 2)]].i, 0, 0, 0); sw.push(1, 0, 0, 0); col.push(C.r * f, C.g * f, C.b * f); } }
    for (let i = 0; i < P.length - 1; i++) for (let j = 0; j < RAD; j++) { const a = base + i * RAD + j, b = base + i * RAD + (j + 1) % RAD; ind.push(a, b, a + RAD, b, b + RAD, a + RAD); } }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('skinIndex', new THREE.Uint16BufferAttribute(si, 4)); g.setAttribute('skinWeight', new THREE.Float32BufferAttribute(sw, 4)); g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3)); g.setIndex(ind); g.computeVertexNormals(); return g; }
function wingGeo(B, w, pal) {
  const pos = [], si = [], sw = [], col = [], ind = [], C = pal[w.tone] || pal.coat, Cb = (pal.membraneEdge || C);
  const chainPts = names => names.map(n => B.by[n].p), boneAt = (names, s) => { const k = Math.min(names.length - 2, Math.floor(s * (names.length - 1))); return B.by[names[k]].i; };
  const sample = (pts, s) => { const f = s * (pts.length - 1), i = Math.min(pts.length - 2, Math.floor(f)); return pts[i].clone().lerp(pts[i + 1], f - i); };
  const flank = B.spineNames.slice().reverse(), flankPts = flank.map(n => B.by[n].p.clone().add(V(w.side * B.spineR(.5) * B.spineS[0] * .7, B.spineR(.5) * .3, 0)));
  const edges = w.fingers.map(f => ({ names: f, pts: chainPts(f) })); edges.push({ names: flank, pts: flankPts, flank: true });
  const NS = 10, NU = 8;
  for (let e = 0; e < edges.length - 1; e++) { const A = edges[e], Bn = edges[e + 1], base = pos.length / 3;
    for (let i = 0; i <= NS; i++) for (let j = 0; j <= NU; j++) { const s = i / NS, u = j / NU, s2 = s * (1 - w.sag * Math.sin(Math.PI * u) * s);
      const pa = sample(A.pts, s2), pb = sample(Bn.pts, Bn.flank ? s2 * .9 : s2), p = pa.lerp(pb, u); p.y -= Math.sin(Math.PI * u) * .02 * pa.distanceTo(pb); pos.push(p.x, p.y, p.z);
      si.push(boneAt(A.names, s2), boneAt(Bn.names, s2), 0, 0); sw.push(1 - u, u, 0, 0); const c = C.clone().lerp(Cb, Math.pow(s, 3)); col.push(c.r, c.g, c.b); }
    for (let i = 0; i < NS; i++) for (let j = 0; j < NU; j++) { const a = base + i * (NU + 1) + j; ind.push(a, a + 1, a + NU + 1, a + 1, a + NU + 2, a + NU + 1); } }
  // the fingers themselves, as thin tubes rigid on their bones
  for (const f of w.fingers) for (let k = 0; k < f.length - 1; k++) { const a = B.by[f[k]].p, b = B.by[f[k + 1]].p, g = new THREE.CylinderGeometry(w.r * .5 * (1 - k * .4), w.r * .5 * (.6 - k * .3), a.distanceTo(b), 6);
    g.translate(0, a.distanceTo(b) / 2, 0); g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(UP, b.clone().sub(a).normalize())); g.translate(a.x, a.y, a.z);
    const base = pos.length / 3, gp = g.attributes.position; for (let v = 0; v < gp.count; v++) { pos.push(gp.getX(v), gp.getY(v), gp.getZ(v)); si.push(B.by[f[k]].i, 0, 0, 0); sw.push(1, 0, 0, 0); col.push(Cb.r * .7, Cb.g * .7, Cb.b * .7); }
    for (let t = 0; t < g.index.count; t++) ind.push(base + g.index.getX(t)); }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('skinIndex', new THREE.Uint16BufferAttribute(si, 4)); g.setAttribute('skinWeight', new THREE.Float32BufferAttribute(sw, 4)); g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3)); g.setIndex(ind); g.computeVertexNormals(); return g;
}

// ── gaits: one engine for any number of legs. A gait is a duty factor (the part of a stride a foot is down), a Froude
// number (speed against leg length, so a big body walks at a big body's pace), and the phase of each foot by its pair and side.
export const GAITS = {
  stand: { duty: 1, fr: 0, phase: () => 0 },
  // a wave from the back pair forward, left then right: a quadruped's four-beat walk, a hexapod's wave, a biped's walk
  walk: { duty: .68, fr: .22, lift: .14, bob: .02, sway: .05, phase: (p, s, n) => s * .5 + (n - 1 - p) * (.5 / n) },
  // alternating diagonals: a trot, an insect's tripods, a spider's tetrapods, a biped's run
  trot: { duty: .45, fr: .9, lift: .2, bob: .035, sway: .03, phase: (p, s) => ((p + s) % 2) * .5 },
  // the rotary gallop: hinds then fores, each pair a beat apart
  gallop: { duty: .34, fr: 2.6, lift: .26, bob: .06, flex: .14, phase: (p, s, n) => .5 * (1 - p / Math.max(1, n - 1)) + s * .1 },
  // Session 773. The half-bound: the hinds together, then the fores together (a hare, a weasel at speed)
  bound: { duty: .28, fr: 1.8, lift: .22, flex: .32, phase: (p, s, n) => (p === n - 1 ? 0 : .42) + s * .05 },
  // the hop: every foot at once, then a long flight; a pulse, so the body covers the stride unevenly (a frog, a toad)
  hop: { duty: .4, fr: 1.2, lift: .25, strideK: 5, pulse: 1, flex: .1, phase: (p, s) => s * .02 },
  slither: { duty: 1, fr: .3, wave: 1, phase: () => 0 },
  fly: { duty: 1, fr: 0, flap: 1, phase: () => 0 },
  // Session 774: gaits without feet, paced in body lengths a second (bl) and a stride of 0.7 of the body.
  // A fish's wave grows toward its tail (a whale's runs up and down); an octopus's arms ripple round the ring; a jellyfish's bell beats.
  swim: { duty: 1, bl: .8, swim: 1, phase: () => 0 },
  crawl: { duty: 1, bl: .18, ripple: 1, phase: () => 0 },
  drift: { duty: 1, bl: .25, bell: 1, phase: () => 0 },
  // Session 775: a bird in the air, its wings beating, its legs tucked up under it
  soar: { duty: 1, bl: 2.4, flap: 1, aloft: 1, phase: () => 0 },
  // Session 1114: a four-legged body sitting (Garrick's hound by his chair): the forefeet where they stand, the body pitched up about
  // the shoulders until the haunch is on the ground, the hind legs folded under it with the hocks laid flat (sitBody, sitLeg)
  sit: { duty: 1, fr: 0, sit: 1, phase: () => 0 }
};
const _q = new THREE.Quaternion(), _q2 = new THREE.Quaternion(), _v = V(), _m = new THREE.Matrix4();
// a bone's rotation and position in the rig's frame (the body's own space: the ground is y = 0)
function rigQuat(C, bone, out) { out.identity(); for (let b = bone; b && b !== C.rig; b = b.parent) out.premultiply(b.quaternion); return out; }
function rigPos(C, bone, out) { bone.getWorldPosition(out); return C.rig.worldToLocal(out); }
export function speedOf(C, gait = C.gait) { const G = GAITS[gait]; if (G.bl) return (C.plan.bl ?? G.bl) * C.len; return Math.sqrt(G.fr * 9.81 * C.legH * C.S) * (C.plan.speedK ?? 1); }
// one stride in the body's own metres (the world's is this times C.S); a stride grows with the Froude number
const strideBody = (C, G) => 1.6 * Math.pow(Math.max(G.fr, .05), .3) * C.legH * (G.strideK || 1);
// how far a foot sweeps while it is down: the stride's share, but a leaper's stance is short and its flight long
const sweepOf = (C, G) => Math.min(strideBody(C, G) * G.duty, G.pulse ? .9 * C.legH : 1e9);
export function strideOf(C, gait = C.gait) { const G = GAITS[gait]; return G.bl ? .7 * C.len : strideBody(C, G) * C.S; }
// the distance the body has covered by a phase, in world metres: even for most gaits; a pulse covers the stance's sweep, then flies
function travel(C, phase) { const G = GAITS[C.gait], k = Math.floor(phase), f = phase - k, L = strideOf(C);
  if (!G.pulse) return phase * L; const sw = sweepOf(C, G) * C.S; return k * L + (f < G.duty ? sw * f / G.duty : sw + (L - sw) * (f - G.duty) / (1 - G.duty)); }
// advance a creature's gait by dt seconds. C.moved is how far its root should go along C.dir this step. Returns the worst foot error.
export function step(C, dt) { const G = GAITS[C.gait], p0 = C.phase, goes = G.fr > 0 || G.bl > 0; C.phase += goes ? dt * speedOf(C) / strideOf(C) : dt * (G.flap ? .9 : .25); C.moved = goes ? travel(C, C.phase) - travel(C, p0) : 0; return pose(C, C.phase); }
// the gait's flights: the stretches of the stride with no foot down, found by sampling once per gait. In each the body follows
// a ballistic arc, h = g t² / 8 at the top for a flight of t seconds, so a trot barely leaves the ground and a frog's hop does.
function flights(C, G) { if (C.air[C.gait]) return C.air[C.gait]; const B = C.B, n = B.legs.length / 2, N = 240, up = [], out = [];
  if (!B.legs.length || G.duty >= 1 || !(G.fr > 0)) return C.air[C.gait] = out;
  const order = [...new Set(B.legs.map(L => L.at))].sort((a, b) => b - a);
  for (let i = 0; i < N; i++) { const ph = i / N; up.push(B.legs.every(L => { let fl = ph + G.phase(order.indexOf(L.at), L.side > 0 ? 0 : 1, n) + L.wobble; fl -= Math.floor(fl); return fl >= G.duty; })); }
  const T = strideOf(C) / speedOf(C); let i0 = up.indexOf(false); if (i0 < 0) return C.air[C.gait] = out;
  for (let k = 1; k <= N; k++) { const i = (i0 + k) % N; if (up[i] && !up[(i - 1 + N) % N]) { let len = 0; while (up[(i + len) % N] && len < N) len++; const t = len / N * T;
    out.push({ start: i / N, len: len / N, H: Math.min(.6 * C.legH, 9.81 * t * t / 8 / C.S) }); } }
  return C.air[C.gait] = out; }
const liftAt = (air, ph) => { for (const a of air) { let u = (ph - a.start + 1) % 1; if (u < a.len) { u /= a.len; return 4 * a.H * u * (1 - u); } } return 0; };
// pose the creature at a phase of its gait; returns the worst foot error (metres) for the test
// a folded wing's flight feathers turned back along the body (Session 974): each quill's bone is turned, in the frame of the spine
// bone the wing hangs from, from where the folded arm has carried it to lie back and a little down, the hand's primaries outermost and
// lowest, so the rows stack as a bird's do instead of fanning out from the wrist. `k` is how far (0 open, 1 stowed)
// Each quill is also rolled about its own line (Session 983) so the card leans out and down over the flank, as a folded wing wraps the
// body, instead of lying flat on the back and showing its edge from the side: the third number is how far the card's face is tipped
// up from facing straight out, in degrees, the coverts flattest (on the back), the primaries most upright (lowest on the flank).
// A wing whose primaries are too few to close (`feathers.ragged`, Session 984) fans them further down the flank, the outermost lowest,
// so their tips stand apart with the light between them instead of stacking into one blade
const QUILL_LIE = { p: t => [.01 + .04 * t, -.05 - .07 * t, 34 - 6 * t], s: t => [.02 + .03 * t, -.03 - .03 * t, 44 - 6 * t], c: t => [.01 + .01 * t, -.01, 58] };
const _qS = new THREE.Quaternion(), _qP = new THREE.Quaternion(), _qD = new THREE.Quaternion(), _qI = new THREE.Quaternion(), _qR = new THREE.Quaternion(), _vN = new THREE.Vector3(), _vT = new THREE.Vector3(), _vF = new THREE.Vector3();
function stowQuills(C, W, k) {
  if (!k) { for (const f of W.quills) C.byName[f.name].quaternion.identity(); return; }
  const arm0 = C.byName[W.arm[0]]; C.byName[W.arm[2]].updateWorldMatrix(true, false); arm0.parent.getWorldQuaternion(_qS).invert();
  const rel = {}; for (const nm of W.arm) rel[nm] = C.byName[nm].getWorldQuaternion(new THREE.Quaternion()).premultiply(_qS);
  for (const f of W.quills) {
    const b = C.byName[f.name], qp = rel[b.parent.name], [out, down, tip] = QUILL_LIE[f.kind](f.t), e = tip * Math.PI / 180;
    _vN.copy(f.d).applyQuaternion(qp); _vT.set(W.side * out, down - (f.kind === 'p' ? W.ragged * f.t : 0), -1).normalize(); _qD.setFromUnitVectors(_vN, _vT);
    _vN.copy(f.n).applyQuaternion(qp).applyQuaternion(_qD); _vF.set(W.side * Math.cos(e), Math.sin(e), 0).addScaledVector(_vT, -_vT.dot(_vF)).normalize();
    if (_vN.dot(_vF) < 0) _vF.negate(); _qD.premultiply(_qR.setFromUnitVectors(_vN, _vF));
    _qP.copy(qp).invert().multiply(_qD).multiply(qp); b.quaternion.copy(_qI).slerp(_qP, k); } }
export function pose(C, phase) {
  const G = GAITS[C.gait], B = C.B, n = B.legs.length / 2, tau = Math.PI * 2, ph = phase - Math.floor(phase);
  if (G.sit && C.sitA === undefined) sitFind(C);
  for (const b of C.bones) b.quaternion.identity();
  const sp = C.byName.spine0, rest = B.bones[0].p; sp.position.copy(rest);
  // the body: a bob twice a stride, a roll and a sway once, the gallop's flex; the neck nods against the bob, the tail swings behind
  const bob = (G.bob || 0) * C.legH * Math.cos(tau * ph * 2), breathe = .006 * Math.sin(tau * ph);
  const air = liftAt(flights(C, G), ph) + (G.aloft ? (C.plan.flyH || 0) + .04 * C.legH * Math.sin(tau * ph + 1.6) : 0);
  sp.position.y += -bob * .5 + air + (G.duty === 1 && !G.wave ? breathe * C.legH : 0);
  if (C.sac) { const s = 1 + .45 * Math.max(0, Math.sin(tau * (G.fr > 0 ? ph : ph * 3))) ** 2; C.sac.scale.set(1.15 * s, .8 * s, s); }
  sp.rotation.set((G.flex || 0) * Math.sin(tau * ph) * .4, (G.sway || 0) * Math.sin(tau * ph), (G.sway || 0) * .5 * Math.sin(tau * ph + 1));
  const spn = B.spineNames; for (let k = 1; k < spn.length; k++) C.byName[spn[k]].rotation.set(-(G.flex || 0) * Math.sin(tau * ph) / spn.length, -(G.sway || 0) * Math.sin(tau * ph - k * .4) / spn.length, 0);
  if (B.chains.neck) B.chains.neck.forEach((nm, k) => C.byName[nm].rotation.set(bob * .4 / C.legH + (C.plan.neckNod ?? .03) * Math.sin(tau * ph * 2 + 1) / B.chains.neck.length, (G.sway || 0) * -.5 * Math.sin(tau * ph) / B.chains.neck.length, 0));
  if (B.chains.tail) B.chains.tail.forEach((nm, k) => C.byName[nm].rotation.set(.04 * Math.sin(tau * ph * 2 - k * .6), (C.plan.wag ?? .12) * Math.sin(tau * ph - k * .7), 0));
  if (C.byName.jaw) C.byName.jaw.rotation.x = (C.plan.pant ?? .04) * (1 + Math.sin(tau * ph * 2));
  // a serpent moves by a wave that runs from its head to its tail
  if (G.wave) { const all = [...spn.slice().reverse(), ...(B.chains.tail || [])]; all.forEach((nm, k) => { C.byName[nm].rotation.y += (C.plan.waveAmp ?? .35) * Math.sin(tau * (ph * 1 - k / (C.plan.waveLen ?? 8))) * (k ? 1 : .3); }); }
  sp.scale.set(1, 1, 1);
  // a fish's wave (Session 774): from head to tail, growing toward the tail; a whale's runs in the vertical plane
  if (G.swim) { const all = [...spn.slice().reverse(), ...(B.chains.tail || [])], N = all.length, ax = C.plan.swimAxis === 'x' ? 'x' : 'y', A = C.plan.waveAmp ?? .22;
    all.forEach((nm, k) => { const u = k / (N - 1); C.byName[nm].rotation[ax] += A * (.08 + Math.pow(u, 1.6)) * Math.sin(tau * (ph - u * (C.plan.waveLen ?? .9))) / (k < spn.length ? 2 : 1); }); }
  for (const F of B.fins) { const b = C.byName[F.name]; if (F.kind === 'pec') b.rotation.set(0, 0, (F.side || 1) * .22 * Math.sin(tau * ph * (G.swim ? 1 : .4))); else if (F.kind === 'wing') b.rotation.set(0, 0, (F.side || 1) * (G.flap ? .1 + .8 * Math.sin(tau * ph * 2) : .28 + .04 * Math.sin(tau * ph))); else if (F.kind === 'caudal') b.rotation[C.plan.swimAxis === 'x' ? 'x' : 'y'] = .25 * Math.sin(tau * (ph - 1.05)); }
  // radial arms: an octopus's ripple round the ring, a jellyfish's bell that beats and threads that trail it
  for (const Rr of B.radials) { const axis = V(-Math.sin(Rr.a), 0, Math.cos(Rr.a)), np = Rr.names.length;
    for (let j = 0; j < np - 1; j++) { const b = C.byName[Rr.names[j]]; let ang;
      if (G.ripple) ang = .22 * Math.sin(tau * ph - Rr.k / Rr.n * tau * 2 - j * .7) + (j ? .05 : 0);
      else if (Rr.thread) ang = (G.bell ? .1 : .05) * Math.sin(tau * ph * (G.bell ? 1 : .3) - j * .55 + Rr.k * 1.7);
      else ang = .12 * Math.sin(tau * ph * (G.bell ? 1 : .3) - j * .5 + Rr.k);
      b.quaternion.setFromAxisAngle(axis, ang); } }
  if (G.bell || (B.radials.length && C.plan.bellBone)) { const beat = Math.pow(Math.max(0, Math.sin(tau * ph)), 2), s = 1 - (G.bell ? .14 : .04) * beat; sp.scale.set(s, 1 + (1 - s) * .7, s); sp.position.y += (G.bell ? .03 : .01) * C.len / C.S * Math.sin(tau * ph - 1); }
  else if (G.ripple && B.radials.length) sp.position.y += .015 * C.len / C.S * Math.sin(tau * ph * 2);
  // arms swing against the legs; wings rest half-folded, breathing, or beat
  // a flipper (Session 861) flies through the water: it beats down and up, sweeps back on the downstroke and feathers on the way up
  for (const A of B.arms) if (A.stroke) { const sd = A.side, w = tau * ph * (G.swim ? 1 : .4) + A.phase, k = A.stroke * (G.swim ? 1 : .25);
    const beat = Math.sin(w) * (Math.sin(w) > 0 ? .55 : 1);
    C.byName[A.names[0]].rotation.set(.45 * k * Math.cos(w), sd * .35 * k * Math.cos(w), sd * k * beat);
    C.byName[A.names[1]].rotation.set(0, sd * .15 * k * Math.cos(w - .5), sd * .25 * k * Math.sin(w - .6));
    C.byName[A.names[2]].rotation.set(0, 0, sd * .2 * k * Math.sin(w - 1.2)); }
  for (const A of B.arms) if (!A.stroke) { const s = A.swing * Math.sin(tau * ph + (A.side > 0 ? 0 : Math.PI) + A.phase); C.byName[A.names[0]].rotation.set(s, 0, 0); C.byName[A.names[1]].rotation.set(-Math.abs(s) * .6 - .2, 0, 0); C.byName[A.names[2]].rotation.set(.25 * Math.sin(tau * ph * 2 + A.side), 0, 0); }
  // a bird's wing folds in a Z against its side (humerus back, forearm forward, hand back), or beats: down hard, up folded a little
  for (const W of B.wings) if (W.feathered) { const fold = G.flap ? 0 : (C.plan.wingFold ?? 1), s = W.side, beat = G.flap ? Math.sin(tau * ph) : 0, up = G.flap ? Math.max(0, -Math.cos(tau * ph)) : 0;
    C.byName[W.arm[0]].rotation.set(.1 * fold, s * 1.2 * fold, s * (.55 * beat - .25 * fold));
    C.byName[W.arm[1]].rotation.set(0, -s * (2.5 * fold + .35 * up), -s * .15 * beat);
    C.byName[W.arm[2]].rotation.set(0, s * (2.3 * fold + .3 * up), -s * .2 * beat);
    if (W.quills) stowQuills(C, W, G.flap ? 0 : 1); }
  for (const W of B.wings) if (!W.feathered) { const flap = G.flap ? Math.sin(tau * ph) : 0, fold = G.flap ? 0 : (C.plan.wingFold ?? .5);
    // an upright body's wings at rest (Session 956, the gargoyle's): the fold above lays a level back's wings along it, which on an
    // upright one spreads them flat over its head. `wingRest` gives the arm's three bones their rest turns instead (x, then y and z
    // mirrored by side), and the fingers a spread between them
    if (!G.flap && C.plan.wingRest) { const R = C.plan.wingRest; for (let k = 0; k < 3; k++) C.byName[W.arm[k]].rotation.set(R[k][0], W.side * R[k][1], W.side * R[k][2] + W.side * .02 * Math.sin(tau * ph * .5));
      W.fingers.forEach((f, k) => C.byName[f[0]].rotation.set(0, W.side * (k / W.fingers.length) * (R[3] ?? .2), 0)); continue; }
    C.byName[W.arm[0]].rotation.set(-.15 * fold, -W.side * .7 * fold, W.side * (.5 * flap - .35 * fold + .03 * Math.sin(tau * ph * .5)));
    C.byName[W.arm[1]].rotation.set(0, W.side * 1.1 * fold, W.side * -.3 * flap); C.byName[W.arm[2]].rotation.set(0, -W.side * .9 * fold, W.side * -.2 * flap);
    W.fingers.forEach((f, k) => C.byName[f[0]].rotation.set(0, W.side * (k / W.fingers.length) * .4 * fold, 0)); }
  if (G.sit) sitBody(C);
  C.rig.updateMatrixWorld(true);
  // the legs: the foot's target from the gait, then IK
  const sweep = sweepOf(C, G), D = C.dir;
  let worst = 0; const order = [...new Set(B.legs.map(L => L.at))].sort((a, b) => b - a);
  for (const L of B.legs) {
    if (G.sit && L.at === order[order.length - 1]) { worst = Math.max(worst, sitLeg(C, L)); continue; }
    const p = order.indexOf(L.at), s = L.side > 0 ? 0 : 1, F0 = L.rest[L.rest.length - 1];
    let fl = ph + G.phase(p, s, n) + L.wobble; fl -= Math.floor(fl);
    const T = F0.clone(); let fold = 0;
    // aloft, the feet tuck up and back; an insect's splayed legs only lift a little and hang (Session 864)
    if (G.aloft) { if (L.yaw) { T.y += (C.plan.flyH || 0) - .1 * L.hR; T.x = lerp(T.x, L.rest[0].x, .25); } else { T.y += (C.plan.flyH || 0) + .55 * L.hR; T.addScaledVector(D, -.45 * L.hR); fold = 1.2; } }
    else if (G.fr > 0 && !G.wave) { if (fl < G.duty) T.addScaledVector(D, sweep * (.5 - fl / G.duty)); else { const u = (fl - G.duty) / (1 - G.duty), e = u * u * (3 - 2 * u); T.addScaledVector(D, sweep * (-.5 + e)); T.y += (G.lift || .15) * L.hR * Math.sin(Math.PI * u) + air; fold = (C.plan.fold ?? .9) * Math.sin(Math.PI * u); } }
    worst = Math.max(worst, solveLeg(C, L, T, fold));
  }
  if (C.mist) { const hd = C.mist.parent; hd.updateWorldMatrix(true, false); const qi = hd.getWorldQuaternion(new THREE.Quaternion()).invert().multiply(C.rig.getWorldQuaternion(new THREE.Quaternion())); mistTick(C.mist, ph, qi); }
  return worst;
}
// sitting (Session 1114). The body turns nose-up about the line through the forelegs' roots, so the forefeet stay where they
// stand; how far is found once per creature, halving the hip's height until the lowest point of the body and thighs (every vertex
// whose bone is the spine's, a thigh's or a shin's) is 5 mm off the ground. The neck takes back most of the pitch so the head looks ahead,
// and the tail is laid back along the ground and curled round toward the haunch
const SIT = { haunch: .005, neck: .8, tailCurl: .3, hock: .05 };
function sitFrame(C) {
  const B = C.B, order = [...new Set(B.legs.map(L => L.at))].sort((a, b) => b - a);
  const mean = at => { const v = V(), Ls = B.legs.filter(L => L.at === at); for (const L of Ls) v.add(L.rest[0]); return v.divideScalar(Ls.length); };
  const piv = mean(order[0]), hip = mean(order[order.length - 1]), dy = hip.y - piv.y, dz = hip.z - piv.z;
  // the pitch that puts the hip at height h: y' = dy cos a - dz sin a, solved by halving (a from 0 down to -1.4)
  const pitchFor = h => { let lo = -1.4, hi = 0; for (let k = 0; k < 30; k++) { const a = (lo + hi) / 2; if (piv.y + dy * Math.cos(a) - dz * Math.sin(a) > h) hi = a; else lo = a; } return (lo + hi) / 2; };
  return { B, order, piv, hip, pitchFor };
}
// the pitch, found once (before a pose, which it runs itself)
function sitFind(C) {
  const { B, order, hip, pitchFor } = sitFrame(C);
  C.sitA = 0; { const hL = B.legs.find(L => L.at === order[order.length - 1]), idx = new Set([...B.spineNames, ...B.legs.filter(L => L.at === order[order.length - 1]).flatMap(L => L.names.slice(0, 2))].map(n => C.bones.indexOf(C.byName[n])));
    const M = C.meshes[0], si = M.geometry.attributes.skinIndex, sw = M.geometry.attributes.skinWeight, vs = []; for (let v = 0; v < si.count; v++) { let best = 0, bi = -1; for (let j = 0; j < 4; j++) { const w = sw.getComponent(v, j); if (w > best) { best = w; bi = si.getComponent(v, j); } } if (idx.has(bi)) vs.push(v); }
    const low = () => { C.rig.updateMatrixWorld(true); M.skeleton.update(); const inv = C.rig.matrixWorld.clone().invert(), p = V(); let y = 1e9; for (let k = 0; k < vs.length; k++) { M.getVertexPosition(vs[k], p); p.applyMatrix4(M.matrixWorld).applyMatrix4(inv); y = Math.min(y, p.y); } return y; };
    let lo = .05 * hL.hR, hi = hip.y; for (let k = 0; k < 16; k++) { const h = (lo + hi) / 2; C.sitA = pitchFor(h); pose(C, 0); if (low() > SIT.haunch) hi = h; else lo = h; } C.sitA = pitchFor(hi); C.sitH = hi; }
}
function sitBody(C) {
  const { B, piv } = sitFrame(C), sp = C.byName.spine0;
  const R = new THREE.Quaternion().setFromAxisAngle(V(1, 0, 0), C.sitA); sp.quaternion.premultiply(R); sp.position.sub(piv).applyQuaternion(R).add(piv);
  if (B.chains.neck) C.byName[B.chains.neck[0]].rotation.x -= C.sitA * SIT.neck;
  // the tail: its first bone turned back level against the pitch and its droop, each bone after curled round to one side
  if (B.chains.tail) { const t0 = C.byName[B.chains.tail[0]]; C.rig.updateMatrixWorld(true); const a = rigPos(C, t0, V()), b = rigPos(C, C.byName[B.chains.tail[1]], V()), d = b.sub(a);
    t0.rotation.x += Math.atan2(-d.y, -d.z) - .06; B.chains.tail.forEach((nm, k) => { if (k) C.byName[nm].rotation.y += SIT.tailCurl; }); }
}
// a hind leg sitting: the toes' tip on the ground ahead, the toes and the hock's long bone laid back from it, the hock raised a
// twentieth of the leg off the paw's height so the shin's flesh clears the ground, just behind the hip, and the thigh and shin bent to meet it about the knee (which points forward, as it stands)
function sitLeg(C, L) {
  const m = L.J.length - 1, root = rigPos(C, L.bones[0], V()), parentQ = rigQuat(C, L.bones[0].parent, new THREE.Quaternion()), hR = L.hR;
  L.bones[0].position.copy(L.restLocal);
  const F0 = L.rest[m], P2 = L.rest[m - 1], toe = L.lens[m - 1], pawY = P2.y, tz = Math.sqrt(Math.max(0, toe * toe - (pawY - F0.y) ** 2));
  const hk = SIT.hock * hR, hock = V(F0.x, pawY + hk, root.z - .08 * hR), paw = hock.clone().add(V(0, -hk, Math.sqrt(L.lens[m - 2] ** 2 - hk * hk))), tip = paw.clone().add(V(0, F0.y - pawY, tz));
  const L1 = L.lens[0], L2 = L.lens[1], d = hock.clone().sub(root); let dl = d.length(); const u = d.divideScalar(dl || 1), err = Math.max(0, dl - (L1 + L2), Math.abs(L1 - L2) - dl);
  dl = Math.max(Math.abs(L1 - L2) + 1e-4, Math.min(L1 + L2 - 1e-4, dl));
  const a = (L1 * L1 - L2 * L2 + dl * dl) / (2 * dl), h = Math.sqrt(Math.max(0, L1 * L1 - a * a)), pole = L.pole.clone(); pole.sub(u.clone().multiplyScalar(pole.dot(u))).normalize();
  const Pp = [root, root.clone().addScaledVector(u, a).addScaledVector(pole, h), root.clone().addScaledVector(u, dl), paw, tip];
  let Qp = parentQ; for (let k = 0; k < m; k++) { const nd = Pp[k + 1].clone().sub(Pp[k]).normalize(), Qk = new THREE.Quaternion().setFromUnitVectors(L.dirs[k], nd); L.bones[k].quaternion.copy(Qp.clone().invert().multiply(Qk)); Qp = Qk; }
  return err;
}
// one leg: yaw the leg toward its foot (an insect's coxa), hold the distal segments (a paw, a hoof), bend the two in between
function solveLeg(C, L, T, fold) {
  const m = L.J.length - 1, ik = L.ik, root = rigPos(C, L.bones[0], V()), parentQ = rigQuat(C, L.bones[0].parent, new THREE.Quaternion());
  const yawQ = new THREE.Quaternion(); if (L.yaw) { const J0 = L.rest[0], Jm = L.rest[m], a0 = Math.atan2(Jm.x - J0.x, Jm.z - J0.z), a1 = Math.atan2(T.x - root.x, T.z - root.z); yawQ.setFromAxisAngle(UP, a1 - a0); }
  const O = L.dirs.map((d, k) => d.clone().multiplyScalar(L.lens[k]).applyQuaternion(yawQ));
  const lat = V(1, 0, 0).applyQuaternion(yawQ), foldQ = new THREE.Quaternion().setFromAxisAngle(L.yaw ? V(-L.side * Math.sin(L.fan), 0, Math.cos(L.fan)).applyQuaternion(yawQ) : lat, L.yaw ? L.side * fold * .5 : fold);
  const Pp = [root.clone()]; for (let k = 0; k < ik; k++) Pp.push(Pp[k].clone().add(O[k]));
  const dist = []; let dsum = V(); for (let k = ik + 2; k < m; k++) { const o = O[k].clone().applyQuaternion(foldQ); dist.push(o); dsum.add(o); }
  const A = T.clone().sub(dsum), L1 = L.lens[ik], L2 = L.lens[ik + 1];
  // past its reach, the leg's root slides toward the foot, as a shoulder blade swings or a pelvis tilts (up to a fifth of the leg)
  const over = A.distanceTo(Pp[ik]) - (L1 + L2) * .985, slide = V();
  if (over > 0) { slide.copy(A).sub(Pp[ik]).normalize().multiplyScalar(Math.min(over, .2 * L.hR)); for (const p of Pp) p.add(slide); }
  L.bones[0].position.copy(L.restLocal).add(slide.applyQuaternion(parentQ.clone().invert()));
  const S0 = Pp[ik], d = A.clone().sub(S0); let dl = d.length(); const u = d.divideScalar(dl || 1);
  dl = Math.max(Math.abs(L1 - L2) + 1e-4, Math.min(L1 + L2 - 1e-4, dl));
  const a = (L1 * L1 - L2 * L2 + dl * dl) / (2 * dl), h = Math.sqrt(Math.max(0, L1 * L1 - a * a));
  const pole = L.pole.clone().applyQuaternion(yawQ); pole.sub(u.clone().multiplyScalar(pole.dot(u))).normalize();
  Pp.push(S0.clone().addScaledVector(u, a).addScaledVector(pole, h)); Pp.push(S0.clone().addScaledVector(u, dl));
  for (const o of dist) Pp.push(Pp[Pp.length - 1].clone().add(o));
  let Qp = parentQ; for (let k = 0; k < m; k++) { const nd = Pp[k + 1].clone().sub(Pp[k]).normalize(), Qk = new THREE.Quaternion().setFromUnitVectors(L.dirs[k], nd); L.bones[k].quaternion.copy(Qp.clone().invert().multiply(Qk)); Qp = Qk; }
  return Pp[m].distanceTo(T);
}

// ── the plans. Each is its source in the concept art, a palette, the gaits it has, and its parts ──
// Tones: coat, saddle and belly (counter-shading), dark (nose, claws, pads), hoof, horn, skin (bare), pale, membrane.
export const PLANS = {
  ironwolf: { name: 'Ironwolf', src: 'OG-084, OG-031 (Stonefang Wolf)', gaits: ['trot', 'walk', 'gallop', 'stand'],
    palette: { coat: [.44, .42, .4], saddle: [.16, .15, .14], belly: [.78, .75, .69], dark: [.06, .05, .05], horn: [.8, .76, .7] },
    fur: { len: .035, layers: 9, sx: 260 },
    parts: [
      ['spine', { hip: [.78, -.4], chest: [.82, .34], n: 4, r: [.15, .135, .18], s: [.8, 1.12], rump: .13, rumpDrop: .03, front: .14, frontDrop: .05, arch: .03 }],
      ['neck', { len: .3, n: 2, rise: 38, r: [.15, .115], s: [.85, 1.1], fwd: .02, up: .05 }],
      ['head', { len: .38, r: .105, pitch: 12, s: [.95, .95, 1.1], muzzle: { len: 1, r: .058, nose: 1, drop: .04 }, jaw: { len: .82, r: .045, drop: .62 }, eyes: [{ f: .4, up: .32, out: .55, r: .016, color: [.85, .6, .2] }], ears: { kind: 'cone', size: .13, f: .12, up: .85, out: .5, back: 12, splay: 18 } }],
      ['tail', { len: .5, n: 4, r: [.065, .075, .04], droop: 36, curl: -7, s: [1, 1.1] }],
      ['legs', { at: 1, kind: 'canidFore', out: .1, drop: .06, claws: { r: .008, len: .025 } }],
      ['legs', { at: 0, kind: 'canidHind', out: .1, drop: .03, claws: { r: .008, len: .025 } }]
    ] },
  faolchu: { name: 'The Faolchú', src: 'lore_canon (the Faolchú), OG-073 (the failing form)', gaits: ['walk', 'trot', 'gallop', 'stand'],
    palette: { coat: [.2, .18, .17], saddle: [.07, .06, .06], belly: [.36, .32, .3], dark: [.04, .03, .03], skin: [.3, .22, .2] },
    fur: { len: .045, layers: 9, sx: 200 }, glow: { color: [3.2, .55, .2], freq: 2.4, w: .04, all: .55, seam: { w: .07, y0: .9 } }, wag: .05, pant: .1, spread: .03,
    parts: [
      ['spine', { hip: [.98, -.55], chest: [1.08, .42], n: 5, r: [.17, .19, .24], s: [.85, 1.15], rump: .15, front: .2, frontDrop: .1, arch: .1 }],
      ['neck', { len: .34, n: 2, rise: 18, r: [.16, .12], fwd: .02 }],
      ['head', { len: .44, r: .12, pitch: 22, muzzle: { len: 1, r: .07, nose: 1, drop: .06 }, jaw: { len: .85, r: .055, drop: .7 }, eyes: [{ f: .4, up: .3, out: .55, r: .017, color: [1, .3, .1] }, { f: .58, up: .42, out: .42, r: .011, color: [1, .3, .1] }], ears: { kind: 'cone', size: .09, f: .1, up: .8, out: .5, back: 35, splay: 30 } }],
      ['tail', { len: .45, n: 3, r: [.06, .03], droop: 70 }],
      ['legs', { at: 1, kind: 'canidFore', out: .12, drop: .08, claws: { r: .01, len: .04 } }],
      ['legs', { at: 0, kind: 'canidHind', out: .12, drop: .04, claws: { r: .01, len: .04 } }],
      // the extra arms that come out of the seam down its back (canon: "extra arms emerging from a spine seam that glows red")
      ['arms', { at: .6, out: .08, up: .18, len: 1.05, r: [.055, .042, .03], dir: [.75, .45, .45], dir2: [.3, -.8, .5], tone: 'skin', claws: { r: .008, len: .06 }, swing: .35, phase: .8 }]
    ] },
  bear: { name: 'Frostreach Bear', src: 'OG-031, OG-084 (Crag Bear)', gaits: ['walk', 'trot', 'gallop', 'stand'], fold: .6,
    palette: { coat: [.8, .78, .72], saddle: [.64, .61, .55], belly: [.88, .86, .81], dark: [.08, .07, .06] },
    fur: { len: .07, layers: 11, sx: 150, droop: .3 },
    parts: [
      ['spine', { hip: [1.02, -.72], chest: [1.12, .42], n: 4, r: [.38, .4, .42], s: [.95, 1.08], rump: .3, rumpDrop: .1, front: .24, frontDrop: .1, hump: { at: .8, up: .28, len: .45, r: .26 } }],
      ['neck', { len: .32, n: 2, rise: 8, r: [.3, .24], fwd: .02 }],
      ['head', { len: .5, r: .2, pitch: 15, muzzle: { len: 1, r: .1, nose: 1, drop: .05 }, jaw: { len: .8, r: .08, drop: .5 }, eyes: [{ f: .42, up: .35, out: .55, r: .016, color: [.08, .05, .03] }], ears: { kind: 'round', size: .055, f: .12, up: .85, out: .6 } }],
      ['tail', { len: .12, n: 1, r: [.07, .05], droop: 30 }],
      ['legs', { at: 1, kind: 'plantFore', out: .22, drop: .16, r: [.17, .14, .12, .11], claws: { r: .014, len: .07 } }],
      ['legs', { at: 0, kind: 'plantHind', out: .22, drop: .1, r: [.21, .15, .12, .11], claws: { r: .012, len: .05 } }]
    ] },
  stag: { name: 'Elderstag', src: 'OG-009, OG-014 (a stag in the fields)', gaits: ['walk', 'trot', 'gallop', 'stand'],
    palette: { coat: [.46, .29, .17], saddle: [.3, .18, .1], belly: [.86, .79, .66], dark: [.05, .04, .04], hoof: [.1, .08, .07], horn: [.72, .64, .5] },
    fur: { len: .018, layers: 6, sx: 380 },
    parts: [
      ['spine', { hip: [1.22, -.55], chest: [1.28, .42], n: 4, r: [.19, .2, .23], s: [.78, 1.18], rump: .15, front: .16, frontDrop: .1 }],
      ['neck', { len: .62, n: 3, rise: 52, curve: -10, r: [.17, .1], s: [.75, 1.2] }],
      ['head', { len: .44, r: .1, pitch: 30, muzzle: { len: 1, r: .055, nose: 1 }, jaw: { len: .85, r: .04, drop: .55 }, eyes: [{ f: .38, up: .25, out: .7, r: .02, color: [.06, .04, .03] }], ears: { kind: 'leaf', size: .09, f: .12, up: .7, out: .75, splay: 55, back: 20 }, antlers: { len: .95, r: .03, f: .1, up: .85, out: .35, depth: 2 } }],
      ['tail', { len: .14, n: 1, r: [.05, .03], droop: 40 }],
      ['legs', { at: 1, kind: 'ungulFore', out: .1, drop: .12 }],
      ['legs', { at: 0, kind: 'ungulHind', out: .1, drop: .08 }]
    ] },
  shatterhorn: { name: 'Shatterhorn', src: 'OG-040 (six-legged, the Mark)', gaits: ['walk', 'trot', 'stand'], speedK: .8, fold: .5,
    palette: { coat: [.5, .43, .35], saddle: [.32, .27, .22], belly: [.62, .56, .48], dark: [.08, .07, .06], hoof: [.14, .12, .1], horn: [.62, .82, .95] },
    fur: { len: .3, layers: 12, sx: 45, sy: 14, droop: .6 },
    parts: [
      ['spine', { hip: [3.05, -2.3], chest: [3.3, 1.9], n: 5, r: [1.05, 1.2, 1.3], s: [.92, 1.08], rump: .7, rumpDrop: .25, front: .5, frontDrop: .3, hump: { at: .85, up: .75, len: 1.6, r: .8 } }],
      ['neck', { len: 1, n: 2, rise: -5, r: [.9, .7], fwd: .1 }],
      ['head', { len: 1.25, r: .48, pitch: 50, muzzle: { len: 1, r: .3, nose: 1 }, jaw: { len: .8, r: .22, drop: .5 }, eyes: [{ f: .36, up: .3, out: .7, r: .05, color: [.1, .08, .05] }], crystals: { n: 7, len: 2.6, r: .3, f: .05, up: 1.1, out: .55 } }],
      ['tail', { len: .9, n: 2, r: [.2, .12], droop: 60 }],
      ['legs', { at: 1, kind: 'ungulFore', out: .62, drop: .3, r: [.42, .3, .2, .22] }],
      ['legs', { at: .5, kind: 'ungulFore', out: .66, drop: .4, r: [.4, .28, .2, .22] }],
      ['legs', { at: 0, kind: 'ungulHind', out: .62, drop: .25, r: [.48, .32, .2, .22] }]
    ] },
  mineprowler: { name: 'Mineprowler', src: 'OG-040 (six-legged, Aurenne)', gaits: ['trot', 'walk', 'stand'], speedK: 1.6, wag: .06, fold: .6,
    palette: { coat: [.74, .56, .34], saddle: [.48, .33, .19], belly: [.88, .79, .62], dark: [.18, .1, .06], skin: [.6, .45, .3] },
    pattern: { kind: 'stripes', period: .22, tone: 'saddle' },
    parts: [
      ['spine', { hip: [.5, -.62], chest: [.55, .5], n: 5, r: [.21, .23, .21], s: [1.3, .8], rump: .14, front: .12 }],
      ['neck', { len: .22, n: 2, rise: 16, r: [.15, .12], s: [1.2, .85] }],
      ['head', { len: .4, r: .13, pitch: 4, s: [1.25, .78, 1], muzzle: { len: 1, r: .08, s: [1.2, .7, 1] }, jaw: { len: .9, r: .06, drop: .5 }, eyes: [{ f: .36, up: .45, out: .62, r: .024, color: [.95, .75, .1] }], ears: { kind: 'cone', size: .09, f: .1, up: .7, out: .6, back: 50, splay: 60 } }],
      ['tail', { len: 1.6, n: 8, r: [.15, .04], droop: 5, curl: 30, s: [1, 1], sting: { r: .04, len: .18 } }],
      ['legs', { at: 1, kind: 'sprawl', out: .2, drop: .04, fan: 35, r: [.085, .07, .055, .045], claws: { r: .007, len: .035 } }],
      ['legs', { at: .55, kind: 'sprawl', out: .22, drop: .04, fan: 0, r: [.085, .07, .055, .045], claws: { r: .007, len: .035 } }],
      ['legs', { at: .05, kind: 'sprawl', out: .2, drop: .04, fan: -35, r: [.095, .075, .055, .045], claws: { r: .007, len: .035 } }],
      ['spines', { n: 9, from: .05, to: 1, len: .14, r: .02, taper: .5 }]
    ] },
  spider: { name: 'Giant spider', src: 'OG-041, OG-088', gaits: ['walk', 'trot', 'stand'], speedK: 1.4, wag: .02, rough: .55, mottle: .6,
    palette: { coat: [.12, .1, .09], pale: [.76, .73, .63], dark: [.03, .02, .02], skin: [.12, .1, .09], silk: [.95, .94, .9] },
    parts: [
      ['spine', { hip: [.62, -.12], chest: [.62, .26], n: 3, r: [.17, .2, .17], s: [1.1, .62], rump: .02, front: .1, tone: 'skin' }],
      ['head', { len: .16, r: .1, pitch: 10, s: [1.1, .7, 1], tone: 'skin', eyes: [{ f: .65, up: .7, out: .3, r: .02, color: [.85, .05, .03] }, { f: .55, up: .85, out: .55, r: .014, color: [.85, .05, .03] }, { f: .45, up: .95, out: .2, r: .012, color: [.85, .05, .03] }], fangs: { r: .02, len: .1, f: .95, up: -.4, out: .3 } }],
      ['tail', { len: .85, n: 2, r: [.32, .42, .2], droop: -20, s: [1, .85], tone: 'pale' }],
      ['eggs', { n: 7, r: .12, at: [.62, .98], drop: 1.4, spread: .5 }],
      ['legs', { at: 1, kind: 'insect', out: .12, drop: -.02, fan: 55, reach: 1.25, r: [.05, .045, .035, .02], thorns: { per: 7, len: .085, r: .016 } }],
      ['legs', { at: .72, kind: 'insect', out: .14, drop: -.02, fan: 20, reach: 1.15, r: [.05, .045, .035, .02], thorns: { per: 7, len: .085, r: .016 } }],
      ['legs', { at: .42, kind: 'insect', out: .14, drop: -.02, fan: -18, reach: 1.1, r: [.05, .045, .035, .02], thorns: { per: 7, len: .085, r: .016 } }],
      ['legs', { at: .12, kind: 'insect', out: .12, drop: -.02, fan: -50, reach: 1.25, r: [.05, .045, .035, .02], thorns: { per: 7, len: .085, r: .016 } }]
    ] },
  stormplume: { name: 'Stormplume', src: 'OG-040 (flightless bird, the Mark)', gaits: ['walk', 'trot', 'stand'], speedK: 1.2, neckNod: .12, fold: 1.2,
    palette: { coat: [.34, .38, .44], saddle: [.17, .19, .23], belly: [.74, .74, .72], dark: [.08, .07, .06], skin: [.56, .48, .3], horn: [.66, .58, .36] },
    fur: { len: .1, layers: 10, sx: 34, sy: 18, droop: .7 },
    parts: [
      ['spine', { hip: [1.6, -.32], chest: [1.72, .3], n: 3, r: [.4, .46, .38], s: [.86, 1.05], rump: .45, rumpDrop: -.15, front: .22, frontDrop: .05 }],
      ['neck', { len: 1.05, n: 4, rise: 78, curve: -50, r: [.2, .085], fwd: -.06 }],
      ['head', { len: .28, r: .095, pitch: 5, eyes: [{ f: .48, up: .3, out: .6, r: .02, color: [.9, .55, .1] }], beak: { len: .26, r: .06, up: -.1, hook: .3 } }],
      ['tail', { len: .55, n: 2, r: [.2, .12], droop: -25 }],
      ['legs', { at: .38, kind: 'bird', out: .18, drop: .3, claws: { r: .012, len: .07 } }]
    ] },
  dragon: { name: 'Dragon', src: 'lore_canon §5, OG-085/OG-088 (winged things)', gaits: ['walk', 'trot', 'fly', 'stand'], speedK: .9, wingFold: .22, wag: .18, fold: .7, rough: .6, spread: .03,
    palette: { coat: [.34, .14, .09], saddle: [.16, .06, .04], belly: [.7, .55, .34], dark: [.05, .03, .02], horn: [.82, .76, .62], membrane: [.42, .16, .1], membraneEdge: [.22, .07, .05] },
    glow: { color: [3, 1.2, .3], freq: .9, w: .012, all: .35 }, mottle: 1.6,
    parts: [
      ['spine', { hip: [2.5, -2.1], chest: [2.75, 1.5], n: 5, r: [.85, .95, .9], s: [.92, 1.05], rump: .5, front: .5, frontDrop: .25, arch: .2 }],
      ['neck', { len: 3.1, n: 6, rise: 38, curve: 20, r: [.62, .3], fwd: .1 }],
      ['head', { len: 1.4, r: .36, pitch: 22, s: [1.05, .85, 1], muzzle: { len: 1, r: .25, drop: .05 }, jaw: { len: .9, r: .2, drop: .55 }, eyes: [{ f: .38, up: .45, out: .62, r: .06, color: [1, .55, .1] }], horns: { len: 1.1, r: .09, f: .08, up: .7, out: .45, turn: .5, rise: .4, back: .9, spread: .3 } }],
      ['tail', { len: 6.5, n: 10, r: [.62, .3, .06], droop: 8, curl: -1.5 }],
      ['legs', { at: 1, kind: 'plantFore', out: .62, drop: .45, r: [.36, .28, .22, .2], claws: { r: .05, len: .26 } }],
      ['legs', { at: 0, kind: 'plantHind', out: .66, drop: .3, r: [.44, .32, .24, .22], claws: { r: .05, len: .26 } }],
      ['wings', { at: .82, out: .45, up: .6, span: 7, fingers: 4, r: [.22, .16, .12], sag: .22 }],
      ['spines', { n: 12, from: 0, to: 1, len: .4, r: .07, tone: 'horn', taper: .4 }]
    ] },
  miresnake: { name: 'Mire Snake', src: 'OG-009 (a banded water snake)', gaits: ['slither', 'stand'], speedK: 1, waveAmp: .45, waveLen: 9, rough: .45, spread: .05,
    palette: { coat: [.32, .36, .22], saddle: [.2, .24, .14], belly: [.78, .72, .5], dark: [.05, .05, .04], band: [.09, .09, .07] },
    pattern: { kind: 'bands', period: .16, tone: 'band' }, mottle: .5,
    parts: [
      ['spine', { hip: [.045, -.5], chest: [.05, .3], n: 8, r: [.04, .05, .045], s: [1.15, .8], rump: .02, front: .02 }],
      ['head', { len: .1, r: .032, pitch: 0, s: [1.2, .7, 1], muzzle: { len: 1, r: .024, s: [1.2, .7, 1] }, eyes: [{ f: .45, up: .45, out: .7, r: .007, color: [.6, .45, .1] }] }],
      ['tail', { len: .75, n: 9, r: [.04, .006], droop: 0 }]
    ] },
  // ── Session 773: the bound, the hop, the sideways walk and the pincer ──
  snowhare: { name: 'Snowleap Hare', src: 'OG-031, OG-084 (Snow Hare)', gaits: ['bound', 'walk', 'stand'], wag: .02, fold: 1.1, neckNod: .05,
    palette: { coat: [.93, .93, .91], saddle: [.84, .84, .82], belly: [.98, .98, .97], dark: [.08, .07, .07], pale: [1, 1, 1], blanket: [.55, .14, .1], leather: [.36, .22, .12] },
    fur: { len: .022, layers: 8, sx: 420 },
    parts: [
      ['spine', { hip: [.25, -.17], chest: [.21, .12], n: 3, r: [.085, .075, .068], s: [.85, 1], rump: .09, rumpDrop: .02, front: .06, frontDrop: .02, arch: .05 }],
      ['neck', { len: .07, n: 1, rise: 45, r: [.055, .045] }],
      ['head', { len: .12, r: .046, pitch: 18, muzzle: { len: 1, r: .028, nose: 1, drop: .05 }, eyes: [{ f: .32, up: .3, out: .82, r: .011, color: [.12, .07, .04] }], ears: { kind: 'leaf', size: .085, f: .05, up: .85, out: .35, back: 30, splay: 8 } }],
      ['tail', { len: .05, n: 1, r: [.035, .03], droop: -40, tone: 'pale' }],
      ['legs', { at: 1, kind: 'canidFore', out: .035, drop: .03, r: [.024, .016, .012, .011] }],
      ['legs', { at: 0, kind: 'lagoHind', out: .05, drop: .02, r: [.05, .028, .016, .014] }]
    ] },
  posthare: { name: 'Post hare', src: 'OG-077 (a post rider on a horse-sized hare)', scale: 5.5, gaits: ['bound', 'walk', 'stand'], wag: .02, fold: 1.1, neckNod: .05, spread: .03,
    palette: { coat: [.6, .46, .32], saddle: [.4, .29, .19], belly: [.86, .8, .7], dark: [.08, .06, .05], pale: [.96, .95, .92], blanket: [.18, .38, .26], leather: [.34, .2, .1] },
    fur: { len: .02, layers: 8, sx: 160 },
    parts: null }, // the Snowleap Hare's parts and a saddle, filled in below: a plan may be another plan at another size
  bellthroat: { name: 'Bellthroat', src: 'OG-040 (a red frog with a violet throat sac)', gaits: ['hop', 'stand'], rough: .4, mottle: 1.4, fold: .3, wag: 0, pant: 0,
    palette: { coat: [.78, .2, .1], saddle: [.45, .07, .04], belly: [.93, .8, .55], dark: [.06, .04, .03], sac: [.56, .3, .78] },
    parts: [
      ['spine', { hip: [.075, -.07], chest: [.085, .07], n: 3, r: [.055, .065, .06], s: [1.3, .72], rump: .035, front: .02 }],
      ['head', { len: .1, r: .055, pitch: -4, s: [1.35, .62, 1], muzzle: { len: 1, r: .042, s: [1.4, .55, 1], taper: .75 }, eyes: [{ f: .3, up: .8, out: 1.05, r: .016, color: [.95, .7, .15] }], sac: { r: .045, f: .55, drop: 1.05 } }],
      ['legs', { at: .95, kind: 'sprawl', out: .05, drop: -.005, fan: 30, r: [.016, .013, .011, .01] }],
      ['legs', { at: .02, kind: 'leaperHind', out: .055, drop: -.01, fan: -10, r: [.032, .024, .015, .013] }]
    ] },
  dunescorpion: { name: 'Dunescorpion', src: 'OG-030, OG-085 (scorpion); the game\'s Sand Scorpion', gaits: ['walk', 'trot', 'stand'], speedK: 1.3, rough: .45, mottle: .6, wag: .05,
    palette: { coat: [.66, .48, .26], skin: [.66, .48, .26], saddle: [.42, .28, .14], dark: [.22, .13, .07] },
    parts: [
      ['spine', { hip: [.3, -.3], chest: [.32, .25], n: 4, r: [.13, .15, .13], s: [1.35, .55], rump: .03, front: .06, tone: 'skin' }],
      ['head', { len: .12, r: .09, pitch: 0, s: [1.3, .6, 1], tone: 'skin', eyes: [{ f: .5, up: .75, out: .18, r: .012, color: [.08, .05, .03] }] }],
      ['tail', { len: 1.05, n: 7, r: [.07, .035], droop: -18, curl: 33, tone: 'skin', sting: { r: .028, len: .13 } }],
      ['legs', { at: .95, kind: 'insect', out: .1, drop: .02, fan: 40, reach: .85, r: [.03, .028, .022, .014] }],
      ['legs', { at: .68, kind: 'insect', out: .12, drop: .02, fan: 15, reach: .85, r: [.03, .028, .022, .014] }],
      ['legs', { at: .42, kind: 'insect', out: .12, drop: .02, fan: -15, reach: .85, r: [.03, .028, .022, .014] }],
      ['legs', { at: .15, kind: 'insect', out: .1, drop: .02, fan: -42, reach: .9, r: [.03, .028, .022, .014] }],
      ['arms', { at: 1, out: .09, up: -.04, dz: .06, len: .62, r: [.038, .034, .034], dir: [.65, .08, .75], dir2: [-.2, 0, 1], chela: { r: .07, len: .12 }, tone: 'skin', swing: .06 }]
    ] },
  tidecrab: { name: 'Tidecrab', src: 'OG-016, OG-047 (the blue Aurennais kind)', gaits: ['walk', 'trot', 'stand'], heading: 90, speedK: 1.2, rough: .4, mottle: .8, wag: 0,
    palette: { coat: [.22, .42, .78], skin: [.22, .42, .78], saddle: [.1, .2, .48], belly: [.88, .82, .7], dark: [.1, .08, .07] },
    parts: [
      ['spine', { hip: [.17, -.08], chest: [.17, .08], n: 2, r: [.11, .12, .11], s: [1.9, .52], rump: .03, front: .03 }],
      ['head', { len: .05, r: .035, pitch: 0, s: [1.6, .6, 1], stalks: { f: .6, up: 1.4, out: 1.2, r: .011, len: .04, color: [.08, .06, .05] } }],
      ['legs', { at: .9, kind: 'insect', out: .17, drop: .0, fan: 30, reach: .75, r: [.024, .022, .018, .01] }],
      ['legs', { at: .62, kind: 'insect', out: .19, drop: .0, fan: 10, reach: .8, r: [.024, .022, .018, .01] }],
      ['legs', { at: .35, kind: 'insect', out: .19, drop: .0, fan: -10, reach: .8, r: [.024, .022, .018, .01] }],
      ['legs', { at: .08, kind: 'insect', out: .17, drop: .0, fan: -32, reach: .75, r: [.024, .022, .018, .01] }],
      ['arms', { at: 1, out: .12, up: -.01, dz: .02, len: .34, r: [.03, .028, .028], dir: [.55, .2, .8], dir2: [-.45, 0, 1], chela: { r: .058, len: .085 }, swing: .05 }]
    ] },
  // ── Session 774: fins and radial bodies ──
  riverjaw: { name: 'Riverjaw Salmon', src: 'OG-031 (leaps the falls on its migration)', gaits: ['swim', 'stand'], bl: 1.3, water: 1.2, rough: .35, mottle: .7, wag: 0, pant: .06,
    palette: { coat: [.68, .36, .27], saddle: [.22, .26, .2], belly: [.86, .85, .8], dark: [.06, .05, .05], fin: [.34, .3, .26] },
    parts: [
      ['spine', { hip: [.8, -.15], chest: [.8, .18], n: 4, r: [.07, .085, .08], s: [.5, 1.15], rump: .02, front: .04 }],
      ['head', { len: .2, r: .068, pitch: 3, s: [.55, .95, 1], muzzle: { len: 1, r: .045, s: [.6, .85, 1], taper: .55 }, jaw: { len: .97, r: .034, drop: .55 }, eyes: [{ f: .3, up: .25, out: .85, r: .012, color: [.75, .6, .2] }] }],
      ['tail', { len: .34, n: 5, r: [.065, .016], s: [.45, 1.1] }],
      ['fins', { list: [
        { at: .45, off: [0, 1.0], out: [0, 1, 0], len: .14, h: .09 },
        { at: .9, off: [.85, -.55], out: [1, -.6, 0], len: .09, h: .07, pair: 1, role: 'pec' },
        { at: .3, off: [.5, -.85], out: [.6, -1, 0], len: .06, h: .05, pair: 1 },
        { at: 0, dz: -.07, off: [0, -1.0], out: [0, -1, 0], len: .08, h: .055 },
        { on: 'tail', kind: 'fork', out: [0, 1, 0], len: .12, h: .11, role: 'caudal' }] }]
    ] },
  stormwhale: { name: 'Storm Whale', src: 'OG-016 (Tempest Whale), OG-084', gaits: ['swim', 'stand'], bl: .22, swimAxis: 'x', waveAmp: .12, water: 5.2, rough: .5, mottle: 1.2, wag: 0, pant: .02, spread: .03,
    palette: { coat: [.32, .38, .45], saddle: [.17, .21, .27], belly: [.8, .8, .78], dark: [.05, .05, .06], fin: [.26, .31, .38] },
    parts: [
      ['spine', { hip: [2.4, -3], chest: [2.5, 2.2], n: 6, r: [1.35, 1.65, 1.55], s: [.95, .88], rump: .5, front: .8 }],
      ['head', { len: 3.4, r: 1.2, pitch: 4, s: [.95, .8, 1], muzzle: { len: 1, r: .75, taper: .6, drop: .05 }, jaw: { len: .95, r: .6, drop: .65 }, eyes: [{ f: .55, up: -.25, out: .95, r: .07, color: [.08, .06, .05] }] }],
      ['tail', { len: 5.5, n: 7, r: [1.15, .3], droop: -3, s: [.85, 1] }],
      ['fins', { list: [
        { at: .82, off: [.8, -.6], out: [1, -.5, 0], back: [0, -.15, -1], len: 1.4, h: 2.6, pair: 1, role: 'pec' },
        { at: .15, off: [0, 1.0], out: [0, 1, 0], len: .9, h: .45 },
        { on: 'tail', kind: 'fork', out: [1, 0, 0], len: 1.3, h: 2.2, role: 'caudal' }] }]
    ] },
  octopus: { name: 'Giant octopus', src: 'OG-084 (marine life), OG-016 (drifter squid)', gaits: ['crawl', 'stand'], rough: .45, mottle: 1.8, wag: 0, pant: 0,
    palette: { coat: [.72, .3, .19], saddle: [.48, .15, .1], belly: [.92, .76, .64], dark: [.05, .04, .04] },
    parts: [
      ['spine', { hip: [.78, -.32], chest: [.44, .02], n: 3, r: [.28, .25, .17], s: [1, 1], rump: .12 }],
      ['head', { len: .22, r: .15, pitch: 70, s: [1.25, 1, 1], eyes: [{ f: .3, up: .35, out: .92, r: .03, color: [.85, .65, .2] }] }],
      ['radial', { c: [0, .22, .1], parent: 'head', n: 8, ring: .1, len: 1.5, seg: 7, down: 50, curl: -16, minDown: -4, r: [.075, .01], floor: 0, jitter: .12, tag: 'oct' }]
    ] },
  wisp: { name: 'Wisp', src: 'OG-018 (Gaoth: a glowing jellyfish-like air spirit with trailing threads)', gaits: ['drift', 'stand'], rough: .25, mottle: .4, threadGlow: 2.4, wag: 0, pant: 0,
    glow: { color: [.3, .45, 1.1], base: .6, freq: 3, w: .02, all: .5 },
    palette: { coat: [.45, .52, .82], belly: [.62, .66, .9], pale: [.72, .62, .95], thread: [.6, .72, 1] },
    parts: [
      ['spine', { hip: [1.8, 0], chest: [2.15, 0], n: 3, r: [.38, .36, .16], s: [1, 1] }],
      ['radial', { c: [0, 1.55, 0], parent: 'spine0', n: 4, ring: .08, len: .9, seg: 5, down: 82, r: [.05, .012], tone: 'pale', tag: 'oral' }],
      ['radial', { c: [0, 1.5, 0], parent: 'spine0', n: 14, ring: .32, len: 2.4, seg: 7, down: 88, curl: -1, r: [.009, .003], thread: 1, jitter: .1, tag: 'thr' }]
    ] },
  // ── Session 775: shells and feathered wings ──
  mossback: { name: 'Mossback', src: 'OG-040 (an ancient tortoise carrying a living garden)', gaits: ['walk', 'stand'], speedK: .22, wag: .02, pant: .02, fold: .4, rough: .8,
    palette: { coat: [.42, .4, .32], saddle: [.32, .3, .24], belly: [.62, .56, .42], dark: [.06, .05, .04], shell: [.44, .31, .18], seam: [.17, .11, .06], moss: [.3, .43, .16], fern: [.26, .5, .18], bloom: [.88, .76, .3], bloom2: [.62, .36, .78] },
    parts: null },
  sailshell: { name: 'Sailshell', src: 'OG-040 (a desert tortoise with a sail-like shell)', gaits: ['walk', 'stand'], speedK: .25, wag: .02, pant: .02, fold: .4, rough: .7, finOpacity: 1,
    palette: { coat: [.62, .5, .36], saddle: [.48, .37, .25], belly: [.8, .7, .52], dark: [.08, .06, .04], shell: [.76, .58, .34], seam: [.34, .21, .1], sail: [.8, .3, .15], sail2: [.93, .56, .25] },
    parts: null },
  skyraven: { name: 'Skyraven', src: 'OG-031 (follows travellers, scavenges battlefields)', gaits: ['hop', 'soar', 'walk', 'stand'], flyH: .9, finOpacity: 1, rough: .35, neckNod: .1, wag: .04, fold: 1.1,
    palette: { coat: [.08, .08, .1], saddle: [.05, .05, .07], belly: [.1, .1, .12], dark: [.03, .03, .03], horn: [.05, .05, .06], skin: [.08, .08, .08], feather: [.08, .08, .1], featherTip: [.03, .03, .05], covert: [.1, .1, .13] },
    fur: { len: .012, layers: 6, sx: 160, sy: 60 },
    parts: null },
  craghawk: { name: 'Crag Hawk', src: 'OG-009 (nests on ruined towers), OG-047 (Cliffhawk)', gaits: ['soar', 'walk', 'stand'], flyH: 1.3, finOpacity: 1, rough: .5, neckNod: .06, wag: .03, fold: 1.1,
    palette: { coat: [.44, .31, .2], saddle: [.3, .2, .12], belly: [.88, .82, .7], dark: [.04, .03, .03], horn: [.22, .2, .18], skin: [.82, .66, .2], feather: [.46, .33, .2], featherTip: [.17, .11, .06], covert: [.54, .4, .26] },
    pattern: { kind: 'stripes', period: .028, tone: 'saddle' }, fur: { len: .013, layers: 6, sx: 150, sy: 60 },
    parts: null }
};
// a tortoise: a low spine, pillar legs, a neck out of the shell's front, and the shell; the two differ in what it carries
const tortoise = shell => [
  ['spine', { hip: [.55, -.7], chest: [.6, .6], n: 3, r: [.32, .35, .3], s: [1.3, .7], rump: .1, front: .1 }],
  ['neck', { len: .55, n: 3, rise: 14, curve: 8, r: [.17, .12], fwd: .1, up: -.05 }],
  ['head', { len: .3, r: .12, pitch: 10, muzzle: { len: 1, r: .085, taper: .8 }, jaw: { len: .9, r: .06, drop: .45 }, eyes: [{ f: .45, up: .3, out: .78, r: .017, color: [.15, .1, .05] }] }],
  ['tail', { len: .25, n: 2, r: [.1, .03], droop: 30 }],
  ['legs', { at: .95, kind: 'plantFore', out: .55, drop: .15, r: [.17, .16, .15, .15], claws: { r: .02, len: .05 } }],
  ['legs', { at: .05, kind: 'plantHind', out: .55, drop: .1, r: [.19, .17, .16, .16], claws: { r: .02, len: .05 } }],
  ['shell', shell]];
PLANS.mossback.parts = tortoise({ at: .5, lift: .02, len: 2.3, w: 1.75, h: 1.0, top: 'moss', garden: { ferns: 14, flowers: 20, size: .35 } });
PLANS.sailshell.parts = tortoise({ at: .5, lift: .02, len: 2.0, w: 1.5, h: .8, sail: { h: 1.3, len: 1.8 } });
// a bird of the air: a perching body on bird legs, a fanned tail and feathered wings; a raven and a hawk differ in beak and colour
const flier = o => [
  ['spine', { hip: [.27, -.1], chest: [.29, .1], n: 3, r: [.055, .07, .065], s: [.85, 1], rump: .04, front: .03, frontDrop: .01 }],
  ['neck', { len: .07, n: 1, rise: 45, r: [.048, .04] }],
  ['head', { len: .085, r: .038, pitch: 0, eyes: [{ f: .45, up: .3, out: .72, r: .008, color: o.eye }], beak: { len: o.beak, r: .016, up: -.05, hook: o.hook } }],
  ['tail', { len: .05, n: 1, r: [.03, .02], droop: 15, fan: { n: 7, len: .2, spread: 35 } }],
  ['legs', { at: .45, kind: 'bird', out: .03, drop: .06, claws: { r: .003, len: .015 } }],
  ['wings', { at: .82, out: .04, up: .03, span: .62, r: [.025, .018, .012], feathers: { ns: 8, np: 9, len: .42, primary: o.primary } }]];
PLANS.skyraven.parts = flier({ eye: [.1, .08, .06], beak: .075, hook: .12, primary: 1 });
PLANS.craghawk.parts = flier({ eye: [.9, .75, .15], beak: .05, hook: .4, primary: 1.1 });
// the post hare is the Snowleap Hare's body at five and a half times its size, saddled
PLANS.posthare.parts = [...PLANS.snowhare.parts, ['saddle', { at: .55, len: .14 }]];
// ── Session 843: the common set (OG-084's "all islands": wolf, red fox, brown hare, raven, crow, wild boar, deer, badger,
// otter, trout; backlog L3). Peaceful animals, the first the game has. Five are other plans at another size and colour;
// the fox, the boar, the badger and the otter have parts of their own, from the kit's parts and leg presets ──
const re = (base, o) => ({ fur: base.fur, pattern: base.pattern, glow: base.glow, gaits: base.gaits, wag: base.wag, fold: base.fold, neckNod: base.neckNod, flyH: base.flyH, finOpacity: base.finOpacity, rough: base.rough, bl: base.bl, water: base.water, mottle: base.mottle, pant: base.pant, ...o, parts: o.parts || base.parts });
Object.assign(PLANS, {
  wolf: re(PLANS.ironwolf, { name: 'Grey wolf', src: 'OG-084 (all islands: wolf)', scale: .92, palette: { coat: [.5, .45, .38], saddle: [.24, .21, .18], belly: [.84, .8, .72], dark: [.06, .05, .05], horn: [.8, .76, .7] }, fur: { len: .032, layers: 9, sx: 260 } }),
  redfox: { name: 'Red fox', src: 'OG-084 (all islands: red fox), OG-009 (Redspine Fox)', gaits: ['trot', 'walk', 'gallop', 'stand'], wag: .06, speedK: 1.1,
    palette: { coat: [.72, .34, .12], saddle: [.55, .24, .08], belly: [.95, .92, .86], dark: [.08, .05, .04], pale: [.97, .95, .9] },
    fur: { len: .028, layers: 8, sx: 320 },
    parts: [
      ['spine', { hip: [.36, -.24], chest: [.38, .19], n: 4, r: [.075, .07, .085], s: [.82, 1.1], rump: .07, front: .07, frontDrop: .02, arch: .02 }],
      ['neck', { len: .14, n: 2, rise: 35, r: [.07, .055], fwd: .01 }],
      ['head', { len: .2, r: .055, pitch: 10, s: [1, .92, 1.1], muzzle: { len: 1, r: .026, nose: 1, drop: .03, taper: .5 }, jaw: { len: .85, r: .02, drop: .55 }, eyes: [{ f: .4, up: .4, out: .55, r: .009, color: [.85, .55, .1] }], ears: { kind: 'cone', size: .09, f: .1, up: .9, out: .55, back: 8, splay: 14 } }],
      ['tail', { len: .42, n: 4, r: [.06, .085, .05], droop: 30, curl: -4, s: [1, 1] }],
      ['legs', { at: 1, kind: 'canidFore', out: .05, drop: .03, r: [.05, .028, .018, .016], claws: { r: .004, len: .012 } }],
      ['legs', { at: 0, kind: 'canidHind', out: .05, drop: .02, r: [.06, .032, .02, .017], claws: { r: .004, len: .012 } }]
    ] },
  brownhare: re(PLANS.snowhare, { name: 'Brown hare', src: 'OG-084 (all islands: brown hare)', scale: 1.2, palette: { coat: [.56, .42, .28], saddle: [.4, .29, .18], belly: [.9, .86, .78], dark: [.08, .06, .05], pale: [.95, .94, .9] }, fur: { len: .02, layers: 8, sx: 380 }, parts: PLANS.snowhare.parts }),
  raven: re(PLANS.skyraven, { name: 'Raven', src: 'OG-084 (all islands: raven)', scale: .9, palette: PLANS.skyraven.palette, fur: PLANS.skyraven.fur }),
  crow: re(PLANS.skyraven, { name: 'Crow', src: 'OG-084 (all islands: crow)', scale: .72, gaits: ['walk', 'hop', 'soar', 'stand'],
    palette: { coat: [.13, .13, .15], saddle: [.09, .09, .11], belly: [.16, .16, .18], dark: [.03, .03, .03], horn: [.06, .06, .07], skin: [.08, .08, .08], feather: [.12, .12, .14], featherTip: [.05, .05, .06], covert: [.15, .15, .18] }, fur: PLANS.skyraven.fur,
    parts: flier({ eye: [.1, .08, .06], beak: .055, hook: .06, primary: .9 }) }),
  boar: { name: 'Wild boar', src: 'OG-084 (all islands: wild boar), OG-009 (Gatefen Boar)', gaits: ['trot', 'walk', 'gallop', 'stand'], wag: .08, fold: .7, speedK: .9, rough: .7,
    palette: { coat: [.3, .25, .2], saddle: [.18, .15, .12], belly: [.4, .34, .28], dark: [.06, .05, .04], hoof: [.1, .08, .07], horn: [.88, .84, .74], skin: [.42, .32, .28] },
    fur: { len: .045, layers: 9, sx: 110, sy: 30, droop: .2 },
    parts: [
      ['spine', { hip: [.62, -.5], chest: [.7, .38], n: 4, r: [.24, .27, .3], s: [.82, 1.08], rump: .16, rumpDrop: .06, front: .2, frontDrop: .08, hump: { at: .85, up: .1, len: .35, r: .2 } }],
      ['neck', { len: .16, n: 1, rise: -8, r: [.24, .2], fwd: .02 }],
      ['head', { len: .46, r: .15, pitch: 32, s: [.9, 1, 1], muzzle: { len: 1, r: .075, taper: .7, drop: .02 }, jaw: { len: .82, r: .06, drop: .55 }, eyes: [{ f: .35, up: .45, out: .6, r: .011, color: [.12, .07, .04] }], ears: { kind: 'leaf', size: .07, f: .15, up: .9, out: .6, back: 15, splay: 40 },
        horns: { len: .11, r: .014, f: .82, up: -.55, out: .5, turn: .5, rise: 1.1, spread: .1, back: -.3, out0: .1 } }],
      ['tail', { len: .2, n: 2, r: [.04, .028], droop: 70 }],
      ['legs', { at: 1, kind: 'ungulFore', out: .12, drop: .1, r: [.11, .065, .035, .036] }],
      ['legs', { at: 0, kind: 'ungulHind', out: .12, drop: .07, r: [.14, .075, .036, .036] }]
    ] },
  deer: re(PLANS.stag, { name: 'Deer', src: 'OG-084 (all islands: deer), OG-014 (deer in the fields)', scale: .74,
    palette: { coat: [.58, .38, .22], saddle: [.42, .27, .15], belly: [.9, .84, .72], dark: [.05, .04, .04], hoof: [.1, .08, .07], horn: [.7, .62, .48] }, fur: PLANS.stag.fur,
    parts: PLANS.stag.parts.map(([k, o]) => k === 'head' ? [k, { ...o, antlers: { ...o.antlers, len: .5, depth: 1 } }] : [k, o]) }),
  badger: { name: 'Badger', src: 'OG-084 (all islands: badger; Woodland Badger)', gaits: ['walk', 'trot', 'stand'], wag: .02, fold: .5, speedK: .7, rough: .7, face: { from: .28, to: .78, stripe: 'dark', ground: 'pale', back: -.45 },
    palette: { coat: [.52, .5, .48], saddle: [.38, .37, .36], belly: [.12, .11, .11], dark: [.05, .05, .05], pale: [.92, .91, .88] },
    fur: { len: .03, layers: 8, sx: 200, droop: .3 },
    parts: [
      ['spine', { hip: [.2, -.3], chest: [.22, .2], n: 4, r: [.13, .14, .12], s: [1.25, .8], rump: .09, rumpDrop: .03, front: .08 }],
      ['neck', { len: .07, n: 1, rise: 5, r: [.1, .08] }],
      ['head', { len: .18, r: .065, pitch: 12, s: [1, .85, 1], muzzle: { len: 1, r: .032, nose: 1, taper: .55, drop: .04 }, jaw: { len: .82, r: .025, drop: .5 }, eyes: [{ f: .42, up: .35, out: .55, r: .007, color: [.06, .04, .03] }], ears: { kind: 'round', size: .022, f: .15, up: .8, out: .75, tone: 'pale' } }],
      ['tail', { len: .12, n: 1, r: [.04, .025], droop: 20 }],
      ['legs', { at: 1, kind: 'plantFore', out: .1, drop: .05, r: [.06, .05, .045, .04], claws: { r: .006, len: .028 } }],
      ['legs', { at: 0, kind: 'plantHind', out: .1, drop: .03, r: [.065, .05, .045, .04], claws: { r: .005, len: .02 } }]
    ] },
  otter: { name: 'Otter', src: 'OG-084 (all islands: otter; River Otter)', gaits: ['bound', 'walk', 'stand'], wag: .04, fold: .8, speedK: .9, rough: .3,
    palette: { coat: [.32, .22, .14], saddle: [.24, .16, .1], belly: [.62, .52, .4], dark: [.05, .04, .03] },
    fur: { len: .012, layers: 6, sx: 420 },
    parts: [
      ['spine', { hip: [.13, -.3], chest: [.14, .2], n: 5, r: [.07, .075, .07], s: [1.05, .95], rump: .05, front: .05, arch: .04 }],
      ['neck', { len: .1, n: 2, rise: 18, r: [.062, .055] }],
      ['head', { len: .13, r: .05, pitch: 4, s: [1.15, .85, 1], muzzle: { len: 1, r: .032, nose: 1, taper: .7 }, jaw: { len: .85, r: .024, drop: .45 }, eyes: [{ f: .45, up: .5, out: .6, r: .007, color: [.05, .03, .02] }], ears: { kind: 'round', size: .012, f: .2, up: .7, out: .85 } }],
      ['tail', { len: .4, n: 5, r: [.06, .012], droop: 8, s: [1.15, .85] }],
      ['legs', { at: 1, kind: 'plantFore', out: .06, drop: .02, r: [.032, .026, .024, .022], claws: { r: .003, len: .01 } }],
      ['legs', { at: 0, kind: 'plantHind', out: .065, drop: .01, r: [.038, .03, .028, .026], claws: { r: .003, len: .01 } }]
    ] },
  trout: re(PLANS.riverjaw, { name: 'Trout', src: 'OG-084 (all islands: trout; Rock Trout)', scale: .48, mottle: 1.6,
    palette: { coat: [.52, .5, .32], saddle: [.3, .32, .2], belly: [.9, .86, .74], dark: [.06, .05, .05], fin: [.42, .38, .26] } })
});
// the common set, for the page and the check
export const COMMON = ['wolf', 'redfox', 'brownhare', 'raven', 'crow', 'boar', 'deer', 'badger', 'otter', 'trout'];
// the common set and the farms' livestock by island (Sessions 865, 866; OG-084: "the shared base set that can be built once and recoloured"). A genome may
// carry an island; its plan's palette then takes that island's coat over the plan's own. The plans are the Gatelands' (the
// temperate middle); the Mark's coats run colder, greyer and paler, Aurenne's sandier and warmer, as animals' do with
// climate. Only the coat changes: the same bones, the same flesh. The raven is black on every island.
export const ISLES = ['gatelands', 'mark', 'aurenne'];
export const COATS = {
  mark: {
    wolf: { coat: [.62, .6, .56], saddle: [.36, .35, .33], belly: [.9, .88, .84] },
    redfox: { coat: [.7, .4, .22], saddle: [.32, .24, .2], belly: [.96, .94, .9] },
    brownhare: { coat: [.62, .58, .52], saddle: [.48, .44, .38], belly: [.94, .92, .88] },
    crow: { coat: [.48, .48, .5], belly: [.56, .56, .58], covert: [.45, .45, .48] },
    boar: { coat: [.24, .22, .2], saddle: [.13, .12, .11], belly: [.34, .31, .28] },
    deer: { coat: [.5, .42, .34], saddle: [.36, .3, .24], belly: [.88, .86, .8] },
    badger: { coat: [.58, .57, .56], saddle: [.44, .43, .42] },
    otter: { coat: [.24, .18, .13], saddle: [.17, .12, .09], belly: [.5, .44, .36] },
    trout: { coat: [.5, .54, .52], saddle: [.24, .3, .32], belly: [.94, .94, .92], fin: [.4, .42, .4] },
    // the farms' breeds (Session 866): a black hill cow, a dark brown fleece, a white goat, a grey speckled hen
    cow: { coat: [.1, .08, .08], saddle: [.07, .06, .06], pale: [.12, .1, .09], belly: [.16, .13, .12] },
    sheep: { coat: [.3, .22, .16], saddle: [.26, .19, .14], belly: [.24, .18, .13] },
    goat: { coat: [.84, .82, .78], saddle: [.74, .72, .68], belly: [.9, .88, .84] },
    hen: { coat: [.5, .48, .46], saddle: [.24, .23, .22], belly: [.62, .6, .58] } },
  aurenne: {
    wolf: { coat: [.64, .56, .46], saddle: [.42, .34, .26], belly: [.9, .86, .78] },
    redfox: { coat: [.84, .62, .38], saddle: [.68, .48, .28], belly: [.97, .94, .88] },
    brownhare: { coat: [.74, .62, .46], saddle: [.58, .46, .32], belly: [.94, .9, .82] },
    crow: { coat: [.34, .22, .14], belly: [.36, .24, .16], covert: [.36, .25, .16], feather: [.16, .12, .1] },
    boar: { coat: [.46, .36, .26], saddle: [.3, .22, .16], belly: [.56, .46, .36] },
    deer: { coat: [.64, .5, .36], saddle: [.5, .38, .26], belly: [.94, .9, .82] },
    badger: { coat: [.66, .64, .6], saddle: [.52, .5, .47] },
    otter: { coat: [.42, .3, .2], saddle: [.32, .22, .14], belly: [.72, .62, .48] },
    trout: { coat: [.64, .56, .32], saddle: [.42, .36, .18], belly: [.94, .88, .66], fin: [.54, .46, .28] },
    // the farms' breeds (Session 866): a pale cream cow, a tan fleece, a black goat, a buff-gold hen
    cow: { coat: [.84, .76, .62], saddle: [.74, .64, .5], pale: [.88, .82, .7], belly: [.92, .88, .8] },
    sheep: { coat: [.82, .68, .5], saddle: [.74, .6, .42], belly: [.76, .62, .46] },
    goat: { coat: [.16, .13, .12], saddle: [.09, .08, .07], belly: [.24, .2, .18] },
    hen: { coat: [.86, .66, .36], saddle: [.7, .5, .24], belly: [.9, .74, .46] } } };
// ── Session 844: livestock (backlog L3; OG-023 and OG-035, the farms): the cow, the sheep, the goat and the hen ──
Object.assign(PLANS, {
  cow: { name: 'Cow', src: 'OG-035, OG-023 (livestock on the farms)', gaits: ['walk', 'trot', 'stand'], speedK: .75, wag: .1, fold: .5, rough: .6, pattern: { kind: 'patches', size: .32, cut: .12, tone: 'pale' },
    palette: { coat: [.48, .3, .18], saddle: [.36, .21, .12], belly: [.86, .82, .74], dark: [.07, .05, .05], hoof: [.12, .1, .08], horn: [.86, .82, .72], skin: [.78, .55, .5], pale: [.9, .87, .8] },
    fur: { len: .012, layers: 6, sx: 300 },
    parts: [
      ['spine', { hip: [1.3, -.72], chest: [1.32, .58], n: 4, r: [.36, .42, .38], s: [.9, 1.15], rump: .24, rumpDrop: .02, front: .22, frontDrop: .12 }],
      ['neck', { len: .4, n: 2, rise: 10, r: [.3, .2], s: [.8, 1.25], fwd: .02 }],
      ['head', { len: .56, r: .14, pitch: 48, s: [.95, 1, 1], muzzle: { len: 1, r: .1, nose: 1, taper: .9 }, jaw: { len: .85, r: .07, drop: .5 }, eyes: [{ f: .34, up: .45, out: .78, r: .02, color: [.06, .04, .03] }], ears: { kind: 'leaf', size: .08, f: .22, up: .5, out: 1.05, back: 70, splay: 85 },
        horns: { len: .2, r: .024, f: .12, up: .95, out: .65, turn: .45, rise: .5, spread: .8, back: .1, out0: .3 } }],
      ['tail', { len: .75, n: 3, r: [.07, .045], droop: 85 }],
      ['legs', { at: 1, kind: 'ungulFore', out: .2, drop: .18, r: [.16, .09, .055, .06] }],
      ['legs', { at: 0, kind: 'ungulHind', out: .2, drop: .1, r: [.2, .1, .055, .06] }]
    ] },
  sheep: { name: 'Sheep', src: 'OG-035, OG-023 (livestock on the farms)', gaits: ['walk', 'trot', 'stand'], speedK: .9, wag: .04, fold: .6, rough: .9,
    palette: { coat: [.86, .82, .72], saddle: [.8, .76, .66], belly: [.78, .74, .64], dark: [.1, .08, .07], hoof: [.1, .08, .07], skin: [.2, .17, .15] },
    fur: { len: .07, layers: 11, sx: 90, sy: 40, droop: .15 },
    parts: [
      ['spine', { hip: [.62, -.38], chest: [.64, .32], n: 4, r: [.22, .25, .22], s: [1, 1.05], rump: .16, front: .12 }],
      ['neck', { len: .2, n: 2, rise: 30, r: [.16, .1], fwd: .02 }],
      ['head', { len: .26, r: .07, pitch: 40, tone: 'skin', muzzle: { len: 1, r: .045, nose: 1, taper: .8 }, eyes: [{ f: .4, up: .4, out: .75, r: .011, color: [.6, .5, .2] }], ears: { kind: 'leaf', size: .055, f: .2, up: .55, out: 1, back: 75, splay: 85, tone: 'skin' } }],
      ['tail', { len: .2, n: 2, r: [.05, .035], droop: 80 }],
      ['legs', { at: 1, kind: 'ungulFore', out: .1, drop: .1, r: [.08, .035, .022, .024] }],
      ['legs', { at: 0, kind: 'ungulHind', out: .1, drop: .06, r: [.1, .04, .022, .024] }]
    ] },
  goat: { name: 'Goat', src: 'OG-035, OG-023 (livestock on the farms)', gaits: ['walk', 'trot', 'gallop', 'stand'], speedK: 1, wag: .1, neckNod: .06, rough: .6,
    palette: { coat: [.6, .54, .46], saddle: [.4, .34, .28], belly: [.84, .8, .72], dark: [.08, .07, .06], hoof: [.12, .1, .08], horn: [.42, .38, .32] },
    fur: { len: .03, layers: 8, sx: 160, droop: .4 },
    parts: [
      ['spine', { hip: [.62, -.36], chest: [.66, .3], n: 4, r: [.16, .18, .17], s: [.82, 1.12], rump: .1, rumpDrop: .03, front: .1, frontDrop: .05 }],
      ['neck', { len: .26, n: 2, rise: 48, r: [.12, .08], fwd: .02 }],
      ['head', { len: .27, r: .07, pitch: 38, muzzle: { len: 1, r: .04, nose: 1, taper: .75 }, jaw: { len: .85, r: .028, drop: .55 }, eyes: [{ f: .4, up: .45, out: .72, r: .012, color: [.75, .6, .2] }], ears: { kind: 'leaf', size: .06, f: .2, up: .55, out: .95, back: 50, splay: 75 },
        horns: { len: .17, r: .026, f: .15, up: 1, out: .4, turn: .5, rise: .8, spread: .4, back: .8, out0: .15 } }],
      ['tail', { len: .1, n: 1, r: [.03, .02], droop: -35 }],
      ['legs', { at: 1, kind: 'ungulFore', out: .08, drop: .08, r: [.07, .032, .02, .022] }],
      ['legs', { at: 0, kind: 'ungulHind', out: .08, drop: .05, r: [.09, .036, .02, .022] }]
    ] },
  hen: { name: 'Hen', src: 'OG-035, OG-023 (livestock on the farms)', gaits: ['walk', 'trot', 'stand'], speedK: 1.1, neckNod: .14, fold: 1.1, wag: .02,
    palette: { coat: [.6, .36, .18], saddle: [.42, .22, .1], belly: [.7, .46, .26], dark: [.06, .05, .04], skin: [.88, .72, .3], horn: [.86, .72, .36], comb: [.78, .1, .08] },
    fur: { len: .025, layers: 8, sx: 120, sy: 50, droop: .5 },
    parts: [
      ['spine', { hip: [.26, -.08], chest: [.28, .08], n: 3, r: [.085, .1, .085], s: [.85, 1.05], rump: .07, rumpDrop: -.05, front: .05, frontDrop: .01 }],
      ['neck', { len: .12, n: 2, rise: 75, curve: -30, r: [.05, .03], fwd: -.01 }],
      ['head', { len: .07, r: .028, pitch: 5, eyes: [{ f: .45, up: .3, out: .7, r: .006, color: [.85, .5, .1] }], beak: { len: .03, r: .01, up: -.1, hook: .3 }, ears: { kind: 'leaf', size: .022, f: .35, up: 1.05, out: .12, back: -10, splay: 0, tone: 'comb' } }],
      ['tail', { len: .12, n: 2, r: [.05, .03], droop: -55 }],
      ['legs', { at: .38, kind: 'bird', out: .04, drop: .05, r: [.032, .012, .008, .006], claws: { r: .003, len: .012 } }]
    ] }
});
export const LIVESTOCK = ['cow', 'sheep', 'goat', 'hen'];
// ── Session 846: the Gatelands' fifteen (OG-009; backlog L3). Three were built (the Elderstag, the Crag Hawk, the Mire
// Snake) and two are the common set's (the River Otter, the Woodland Badger); these are the other ten, the Grove Turkey
// a capercaillie as the catalogue's note has it (a New World bird on an Irish island) ──
Object.assign(PLANS, {
  gatefenboar: re(PLANS.boar, { name: 'Gatefen Boar', src: 'OG-009 (roots up old ruins and exposes forgotten paths)', scale: 1.08, spines: 1,
    palette: { coat: [.24, .2, .16], saddle: [.12, .1, .08], belly: [.32, .27, .22], dark: [.05, .04, .03], hoof: [.1, .08, .07], horn: [.9, .86, .76], skin: [.4, .3, .26] }, fur: { len: .06, layers: 10, sx: 90, sy: 24, droop: .3 },
    parts: [...PLANS.boar.parts, ['spines', { n: 10, from: .35, to: 1.05, len: .09, r: .02, tone: 'saddle', taper: .3 }]] }),
  redspinefox: re(PLANS.redfox, { name: 'Redspine Fox', src: 'OG-009 (follows settlements, eats crop scraps)', palette: { coat: [.66, .3, .1], saddle: [.32, .1, .04], belly: [.95, .92, .86], dark: [.07, .05, .04], pale: [.97, .95, .9] }, fur: PLANS.redfox.fur }),
  heron: { name: 'Great Heron', src: 'OG-009 (wetlands), OG-084', gaits: ['walk', 'stand'], speedK: .7, neckNod: .16, fold: 1, wag: .01,
    palette: { coat: [.62, .64, .66], saddle: [.48, .5, .54], belly: [.88, .88, .86], dark: [.08, .08, .09], skin: [.74, .62, .3], horn: [.82, .7, .3] },
    fur: { len: .02, layers: 7, sx: 120, sy: 50, droop: .6 },
    parts: [
      ['spine', { hip: [.66, -.1], chest: [.7, .12], n: 3, r: [.075, .09, .07], s: [.8, 1.15], rump: .08, rumpDrop: .02, front: .04 }],
      ['neck', { len: .48, n: 5, rise: 80, curve: -42, r: [.04, .022], fwd: -.02 }],
      ['head', { len: .1, r: .026, pitch: 2, eyes: [{ f: .4, up: .3, out: .7, r: .006, color: [.95, .85, .2] }], beak: { len: .14, r: .011, up: 0, hook: 0 } }],
      ['tail', { len: .14, n: 1, r: [.05, .03], droop: 20 }],
      ['legs', { at: .4, kind: 'bird', out: .04, drop: .04, r: [.04, .014, .01, .008], claws: { r: .003, len: .03 } }]
    ] },
  hollowcat: { name: 'Hollowcat', src: 'OG-009 (a tufted-eared wildcat of remote woods)', gaits: ['walk', 'trot', 'gallop', 'stand'], wag: .1, speedK: 1, neckNod: .02,
    palette: { coat: [.5, .42, .32], saddle: [.24, .19, .14], belly: [.84, .78, .66], dark: [.06, .05, .04], pale: [.9, .86, .78] },
    pattern: { kind: 'stripes', period: .07, tone: 'saddle' }, fur: { len: .022, layers: 8, sx: 300 },
    parts: [
      ['spine', { hip: [.32, -.22], chest: [.32, .17], n: 4, r: [.08, .075, .085], s: [.85, 1.05], rump: .07, front: .06, arch: .04 }],
      ['neck', { len: .07, n: 1, rise: 30, r: [.07, .06] }],
      ['head', { len: .13, r: .062, pitch: 6, s: [1.08, .95, .95], muzzle: { len: .8, r: .032, nose: 1, taper: .7 }, jaw: { len: .7, r: .024, drop: .5 }, eyes: [{ f: .48, up: .45, out: .5, r: .011, color: [.75, .8, .25] }], ears: { kind: 'cone', size: .075, f: .1, up: .95, out: .62, back: 5, splay: 12 } }],
      ['tail', { len: .3, n: 4, r: [.04, .038], droop: 40, curl: -6 }],
      ['legs', { at: 1, kind: 'canidFore', out: .05, drop: .03, r: [.045, .028, .02, .02], claws: { r: .003, len: .01 } }],
      ['legs', { at: 0, kind: 'canidHind', out: .05, drop: .02, r: [.055, .032, .022, .02], claws: { r: .003, len: .01 } }]
    ] },
  stoat: re(PLANS.otter, { name: 'Greenward Stoat', src: 'OG-009 (rivers and fields, near stone walls)', scale: .55, rough: .45,
    palette: { coat: [.5, .34, .2], saddle: [.42, .27, .15], belly: [.92, .88, .76], dark: [.05, .04, .03] }, fur: { len: .012, layers: 6, sx: 520 } }),
  marshfrog: re(PLANS.bellthroat, { name: 'Marsh Frog', src: 'OG-009 (wetlands; its calls mark spring)', scale: .8,
    palette: { coat: [.36, .5, .22], saddle: [.2, .3, .12], belly: [.86, .84, .66], dark: [.05, .05, .04], sac: [.7, .72, .6] } }),
  riverpike: re(PLANS.riverjaw, { name: 'River Pike', src: 'OG-009 (deep rivers and lakes; a fishing target)', scale: .9, mottle: 2,
    palette: { coat: [.4, .46, .24], saddle: [.2, .26, .14], belly: [.88, .86, .7], dark: [.05, .05, .04], fin: [.5, .38, .22] },
    parts: PLANS.riverjaw.parts.map(([k, o]) => k === 'spine' ? [k, { ...o, hip: [.8, -.28], chest: [.8, .22], r: [.06, .07, .065] }] : k === 'head' ? [k, { ...o, len: .24, s: [.6, .7, 1], muzzle: { ...o.muzzle, s: [.7, .5, 1], taper: .75 } }] : [k, o]) }),
  stonecrawler: { name: 'Stonecrawler', src: 'OG-009 (a black-and-blue lizard of the dry-stone walls), OG-084', gaits: ['trot', 'walk', 'stand'], speedK: 1.4, wag: .1, fold: .5, rough: .4,
    palette: { coat: [.1, .12, .16], saddle: [.06, .07, .1], belly: [.3, .42, .62], dark: [.03, .03, .04], skin: [.1, .12, .16], band: [.22, .38, .7] },
    pattern: { kind: 'bands', period: .05, tone: 'band' },
    parts: [
      ['spine', { hip: [.06, -.1], chest: [.065, .08], n: 4, r: [.03, .034, .03], s: [1.3, .72], rump: .02, front: .02, tone: 'skin' }],
      ['neck', { len: .03, n: 1, rise: 8, r: [.025, .022], s: [1.2, .8] }],
      ['head', { len: .05, r: .02, pitch: 4, s: [1.2, .7, 1], muzzle: { len: 1, r: .014, s: [1.1, .7, 1] }, eyes: [{ f: .4, up: .5, out: .7, r: .004, color: [.8, .6, .1] }] }],
      ['tail', { len: .22, n: 6, r: [.025, .006], droop: 0, curl: 4 }],
      ['legs', { at: .95, kind: 'sprawl', out: .03, drop: .005, fan: 35, r: [.01, .009, .008, .007], claws: { r: .0015, len: .006 } }],
      ['legs', { at: .05, kind: 'sprawl', out: .03, drop: .005, fan: -35, r: [.011, .009, .008, .007], claws: { r: .0015, len: .006 } }]
    ] },
  capercaillie: re(PLANS.hen, { name: 'Capercaillie', src: 'OG-009 (the Grove Turkey, as a capercaillie: catalogue note)', scale: 1.45, neckNod: .1,
    palette: { coat: [.12, .13, .14], saddle: [.07, .08, .09], belly: [.14, .2, .16], dark: [.04, .04, .04], skin: [.5, .45, .4], horn: [.82, .78, .66], comb: [.78, .12, .08] },
    parts: PLANS.hen.parts.map(([k, o]) => k === 'tail' ? [k, { ...o, len: .16, r: [.06, .05], droop: -30 }] : [k, o]) }),
  // built at ten times its size and scaled down: the kit floors a leg's height at 10 cm when it paces a stride
  lanternbeetle: { name: 'Lantern Beetle', src: 'OG-009 (glows near old trees and ruins; an ingredient)', gaits: ['walk', 'trot', 'stand'], scale: .1, speedK: 1, wag: 0, pant: 0, rough: .3, mottle: .3,
    glow: { color: [1.6, 1.25, .35], base: .7, freq: 3, w: .02, all: 0 },
    palette: { coat: [.16, .14, .08], skin: [.16, .14, .08], saddle: [.08, .07, .04], belly: [.6, .52, .2], dark: [.04, .03, .02] },
    parts: [
      ['spine', { hip: [0.18, -0.3], chest: [0.2, 0.2], n: 3, r: [0.16, 0.14, 0.11], s: [1.25, .62], rump: 0.12, front: 0.06, tone: 'skin' }],
      ['head', { len: 0.12, r: 0.08, pitch: 10, s: [1.2, .7, 1], tone: 'skin', eyes: [{ f: .6, up: .3, out: .8, r: 0.022, color: [.05, .04, .03] }] }],
      ['legs', { at: .9, kind: 'insect', out: 0.2, drop: 0.02, fan: 30, reach: .7, r: [0.03, 0.028, 0.022, 0.014] }],
      ['legs', { at: .55, kind: 'insect', out: 0.21, drop: 0.02, fan: 0, reach: .7, r: [0.03, 0.028, 0.022, 0.014] }],
      ['legs', { at: .2, kind: 'insect', out: 0.2, drop: 0.02, fan: -30, reach: .7, r: [0.03, 0.028, 0.022, 0.014] }]
    ] }
});
export const GATELANDS = ['stag', 'gatefenboar', 'redspinefox', 'otter', 'heron', 'badger', 'hollowcat', 'stoat', 'craghawk', 'marshfrog', 'riverpike', 'stonecrawler', 'capercaillie', 'miresnake', 'lanternbeetle'];
// ── Session 847: the Mark's fifteen (OG-031; backlog L3). Five were built (the Frostreach Bear, the Skyraven, the Snowleap
// Hare, the Riverjaw Salmon, and the Ironwolf, which is the sheet's Stonefang Wolf); these are the other ten ──
const curled = { len: .42, r: .05, f: .15, up: .95, out: .55, turn: 1.7, rise: .05, spread: .35, back: .25, out0: .25 };
Object.assign(PLANS, {
  icehorn: re(PLANS.goat, { name: 'Icehorn', src: 'OG-031 (huge curled hollow horns that moan in the wind)', scale: 1.15, rough: .8,
    palette: { coat: [.86, .84, .8], saddle: [.74, .72, .68], belly: [.9, .89, .86], dark: [.08, .07, .06], hoof: [.12, .1, .08], horn: [.62, .58, .5] }, fur: { len: .08, layers: 11, sx: 70, sy: 22, droop: .75 },
    parts: PLANS.goat.parts.map(([k, o]) => k === 'head' ? [k, { ...o, horns: { ...curled, len: .5 } }] : [k, o]) }),
  stormlynx: re(PLANS.hollowcat, { name: 'Stormlynx', src: 'OG-031 (high ridges; snowshoe paws, long ear tufts)', scale: 1.4,
    palette: { coat: [.66, .64, .6], saddle: [.42, .4, .38], belly: [.9, .88, .84], dark: [.06, .05, .05], pale: [.92, .9, .86] }, fur: { len: .035, layers: 9, sx: 240 }, pattern: null,
    parts: PLANS.hollowcat.parts.map(([k, o]) => k === 'tail' ? [k, { ...o, len: .1, r: [.04, .035] }] : k === 'head' ? [k, { ...o, ears: { ...o.ears, size: .1 } }] : k === 'legs' ? [k, { ...o, r: o.r.map((x, i) => i === 3 ? x * 1.8 : x * 1.15) }] : [k, o]) }),
  ironpineelk: re(PLANS.stag, { name: 'Ironpine Elk', src: 'OG-031 (dark, with sweeping antlers)', scale: 1.22,
    palette: { coat: [.3, .22, .15], saddle: [.2, .14, .09], belly: [.5, .42, .32], dark: [.04, .03, .03], hoof: [.08, .07, .06], horn: [.62, .55, .42] }, fur: { len: .03, layers: 8, sx: 260, droop: .4 },
    parts: PLANS.stag.parts.map(([k, o]) => k === 'head' ? [k, { ...o, antlers: { ...o.antlers, len: 1.15, r: .036, depth: 2 } }] : [k, o]) }),
  craghornram: re(PLANS.sheep, { name: 'Craghorn Ram', src: 'OG-031 (scales near-vertical rock)', speedK: 1.1, gaits: ['walk', 'trot', 'gallop', 'stand'],
    palette: { coat: [.52, .44, .34], saddle: [.4, .33, .24], belly: [.84, .8, .72], dark: [.08, .07, .06], hoof: [.1, .08, .07], skin: [.46, .4, .32], horn: [.7, .64, .52] }, fur: { len: .025, layers: 8, sx: 200 },
    parts: PLANS.sheep.parts.map(([k, o]) => k === 'head' ? [k, { ...o, tone: undefined, horns: curled }] : [k, o]) }),
  glacialmarmot: { name: 'Glacial Marmot', src: 'OG-031 (alpine slopes; hibernates)', gaits: ['walk', 'bound', 'stand'], wag: .05, fold: .7, speedK: .8, rough: .7,
    palette: { coat: [.56, .48, .38], saddle: [.42, .35, .27], belly: [.8, .72, .58], dark: [.06, .05, .04] }, fur: { len: .028, layers: 8, sx: 260, droop: .3 },
    parts: [
      ['spine', { hip: [.12, -.17], chest: [.13, .12], n: 3, r: [.1, .095, .08], s: [1.05, 1], rump: .08, front: .05, arch: .03 }],
      ['neck', { len: .04, n: 1, rise: 20, r: [.07, .06] }],
      ['head', { len: .1, r: .05, pitch: 8, muzzle: { len: .9, r: .03, nose: 1, taper: .8 }, eyes: [{ f: .45, up: .45, out: .6, r: .007, color: [.05, .04, .03] }], ears: { kind: 'round', size: .015, f: .2, up: .85, out: .75 } }],
      ['tail', { len: .14, n: 2, r: [.035, .03], droop: 20 }],
      ['legs', { at: 1, kind: 'plantFore', out: .06, drop: .02, r: [.036, .03, .028, .026], claws: { r: .003, len: .012 } }],
      ['legs', { at: 0, kind: 'plantHind', out: .065, drop: .01, r: [.042, .034, .03, .028], claws: { r: .003, len: .01 } }]
    ] },
  stormshrike: re(PLANS.craghawk, { name: 'Stormshrike', src: 'OG-031 (a white falcon that stoops and hangs in the wind)', scale: .85, pattern: { kind: 'stripes', period: .022, tone: 'saddle' },
    palette: { coat: [.9, .9, .9], saddle: [.48, .5, .54], belly: [.96, .96, .95], dark: [.04, .03, .03], horn: [.2, .2, .22], skin: [.86, .74, .25], feather: [.9, .9, .92], featherTip: [.25, .27, .3], covert: [.82, .83, .86] }, fur: PLANS.craghawk.fur }),
  frostspinelizard: re(PLANS.stonecrawler, { name: 'Frostspine Lizard', src: 'OG-031 (rocky slopes; mineral-hardened scales that store sunlight)', scale: 1.7, pattern: null,
    palette: { coat: [.46, .56, .62], saddle: [.32, .4, .46], belly: [.78, .84, .86], dark: [.05, .05, .06], skin: [.46, .56, .62], horn: [.7, .88, .98] },
    parts: [...PLANS.stonecrawler.parts, ['spines', { n: 10, from: .05, to: 1, len: .02, r: .006, tone: 'horn', taper: .4 }]] }),
  tundragrouse: re(PLANS.hen, { name: 'Tundra Grouse', src: 'OG-031 (highlands; flushes noisily from the snow)', scale: 1, mottle: 1.6,
    palette: { coat: [.86, .84, .8], saddle: [.5, .4, .3], belly: [.95, .94, .92], dark: [.04, .04, .04], skin: [.9, .88, .84], horn: [.2, .18, .16], comb: [.82, .16, .1] } }),
  icecrab: re(PLANS.tidecrab, { name: 'Icecrab', src: 'OG-031 (northern coasts; armoured, harvested for its meat)', scale: 1.35, heading: 90,
    palette: { coat: [.72, .8, .86], skin: [.72, .8, .86], saddle: [.42, .52, .62], belly: [.9, .9, .88], dark: [.1, .1, .12] } }),
  shatterback: re(PLANS.stormwhale, { name: 'Shatterback', src: 'OG-031 (a colossal slow armoured sea beast whose back sailors mistake for rocks)', scale: 1.5, swimAxis: 'x', waveAmp: .06, bl: .12, rough: .9, mottle: 2.2, spread: .03,
    palette: { coat: [.36, .36, .34], saddle: [.26, .26, .25], belly: [.56, .55, .52], dark: [.06, .06, .06], fin: [.3, .3, .29], horn: [.44, .43, .4] },
    parts: [...PLANS.stormwhale.parts, ['spines', { n: 14, from: .1, to: .95, len: .9, r: .45, tone: 'horn', taper: .6 }]] })
});
export const MARK = ['icehorn', 'bear', 'stormlynx', 'ironpineelk', 'skyraven', 'ironwolf', 'craghornram', 'glacialmarmot', 'stormshrike', 'snowhare', 'frostspinelizard', 'riverjaw', 'tundragrouse', 'icecrab', 'shatterback'];
// ── Session 848: Aurenne's fifteen (OG-030; backlog L3). The Dunescorpion was built (Session 773); these are thirteen
// more. The Glasswing Moth waits: crystal wings on an insect are a part the kit does not have ──
const spiral = { ...curled, len: .62, r: .06, turn: 2.1 };
Object.assign(PLANS, {
  duneskimmer: re(PLANS.stag, { name: 'Duneskimmer', src: 'OG-030 (a gazelle with wide hooves for sand)', scale: .62,
    palette: { coat: [.8, .62, .4], saddle: [.66, .48, .28], belly: [.96, .93, .86], dark: [.06, .05, .04], hoof: [.12, .1, .08], horn: [.2, .17, .14] }, fur: { len: .01, layers: 5, sx: 420 },
    parts: PLANS.stag.parts.map(([k, o]) => k === 'head' ? [k, { ...o, antlers: undefined, horns: { len: .32, r: .016, f: .12, up: .95, out: .3, turn: .35, rise: 1.1, spread: .2, back: .5, out0: .1 } }] : [k, o]) }),
  sunspirelynx: re(PLANS.hollowcat, { name: 'Sunspire Lynx', src: 'OG-030 (caracal-like, long ears, a heat-shedding crest)', scale: 1.25, pattern: null,
    palette: { coat: [.66, .52, .38], saddle: [.54, .4, .27], belly: [.94, .89, .8], dark: [.06, .04, .03], pale: [.95, .92, .86] }, fur: { len: .014, layers: 6, sx: 380 },
    parts: [...PLANS.hollowcat.parts.map(([k, o]) => k === 'head' ? [k, { ...o, ears: { ...o.ears, size: .13, tone: 'dark' } }] : [k, o]), ['spines', { n: 8, from: .55, to: 1.05, len: .05, r: .012, tone: 'saddle', taper: .3 }]] }),
  terraceram: re(PLANS.craghornram, { name: 'Terrace Ram', src: 'OG-030 (huge spiral horns; fights on terraced cliffs)', scale: 1.05,
    palette: { coat: [.86, .78, .62], saddle: [.74, .64, .48], belly: [.94, .9, .82], dark: [.08, .07, .06], hoof: [.1, .08, .07], skin: [.7, .6, .46], horn: [.78, .72, .58] },
    parts: PLANS.sheep.parts.map(([k, o]) => k === 'head' ? [k, { ...o, tone: undefined, horns: spiral }] : [k, o]) }),
  saltspinemonitor: re(PLANS.frostspinelizard, { name: 'Saltspine Monitor', src: 'OG-030 (coasts; spines crusted with salt; aggressive)', scale: 4.2,
    palette: { coat: [.42, .4, .34], saddle: [.3, .28, .24], belly: [.66, .62, .52], dark: [.05, .05, .05], skin: [.42, .4, .34], horn: [.94, .93, .9] } }),
  oasishare: re(PLANS.brownhare, { name: 'Oasis Hare', src: 'OG-030 (deserts and oases; big ears)', scale: 1.05,
    palette: { coat: [.82, .68, .5], saddle: [.68, .54, .38], belly: [.96, .94, .9], dark: [.08, .06, .05], pale: [.98, .97, .94] },
    parts: PLANS.snowhare.parts.map(([k, o]) => k === 'head' ? [k, { ...o, ears: { ...o.ears, size: .12 } }] : [k, o]) }),
  scarletibis: re(PLANS.heron, { name: 'Scarlet Ibis', src: 'OG-030 (coastal wetlands; a sign of a healthy marsh)', scale: .72,
    palette: { coat: [.9, .2, .14], saddle: [.78, .14, .1], belly: [.95, .32, .24], dark: [.06, .04, .04], skin: [.86, .3, .22], horn: [.3, .12, .1] },
    parts: PLANS.heron.parts.map(([k, o]) => k === 'head' ? [k, { ...o, beak: { len: .17, r: .01, up: -.05, hook: .55 } }] : [k, o]) }),
  miragefox: re(PLANS.redfox, { name: 'Mirage Fox', src: 'OG-030 (fennec-like; scavenges ruins and caravan routes)', scale: .62,
    palette: { coat: [.9, .78, .58], saddle: [.8, .66, .46], belly: [.98, .96, .92], dark: [.08, .06, .05], pale: [.98, .97, .94] }, fur: PLANS.redfox.fur,
    parts: PLANS.redfox.parts.map(([k, o]) => k === 'head' ? [k, { ...o, ears: { ...o.ears, size: .15, out: .6 } }] : [k, o]) }),
  cliffswift: re(PLANS.skyraven, { name: 'Cliffswift', src: 'OG-030 (coasts and sea stacks; swirling flocks)', scale: .42, gaits: ['soar', 'stand'], flyH: 1.6,
    palette: { coat: [.2, .19, .2], saddle: [.12, .11, .12], belly: [.82, .8, .76], dark: [.03, .03, .03], horn: [.06, .06, .07], skin: [.12, .12, .12], feather: [.18, .17, .18], featherTip: [.07, .07, .08], covert: [.22, .21, .22] }, fur: PLANS.skyraven.fur,
    parts: flier({ eye: [.1, .08, .06], beak: .02, hook: .1, primary: 1.4 }) }),
  ambershellcrab: re(PLANS.tidecrab, { name: 'Amber Shellcrab', src: 'OG-030 (tide pools; shells prized for crafts and trade)', scale: .8, heading: 90,
    palette: { coat: [.86, .52, .16], skin: [.86, .52, .16], saddle: [.6, .3, .08], belly: [.95, .86, .66], dark: [.12, .07, .04] } }),
  cypressstalker: re(PLANS.heron, { name: 'Cypress Stalker', src: 'OG-030 (rivers and marshes; a violet heron whose plumage shifts with the light)', scale: 1.05,
    palette: { coat: [.42, .3, .58], saddle: [.26, .18, .4], belly: [.62, .5, .74], dark: [.05, .04, .06], skin: [.56, .5, .3], horn: [.62, .56, .3] } }),
  sandwyrm: re(PLANS.miresnake, { name: 'Sand Wyrm', src: 'OG-030 (a massive burrowing predator, known by its tracks and sand funnels)', scale: 14, pattern: { kind: 'bands', period: .2, tone: 'band' },
    palette: { coat: [.7, .56, .38], saddle: [.52, .4, .26], belly: [.86, .78, .62], dark: [.08, .06, .04], band: [.56, .42, .26] } }),
  sunbeakvulture: re(PLANS.craghawk, { name: 'Sunbeak Vulture', src: 'OG-030 (deserts and cliffs; carrion cleaner)', scale: 1.4, pattern: null,
    palette: { coat: [.32, .24, .18], saddle: [.22, .16, .12], belly: [.46, .36, .28], dark: [.04, .03, .03], horn: [.86, .66, .22], skin: [.8, .62, .52], feather: [.28, .21, .16], featherTip: [.1, .07, .05], covert: [.38, .29, .22] }, fur: PLANS.craghawk.fur }),
  spinedgekko: re(PLANS.frostspinelizard, { name: 'Spined Gekko', src: 'OG-030 (ruins; nocturnal, climbs walls)', scale: 1,
    palette: { coat: [.66, .58, .42], saddle: [.5, .42, .28], belly: [.86, .8, .66], dark: [.05, .05, .04], skin: [.66, .58, .42], horn: [.42, .34, .22] } })
});
export const AURENNE = ['duneskimmer', 'sunspirelynx', 'terraceram', 'saltspinemonitor', 'oasishare', 'scarletibis', 'dunescorpion', 'miragefox', 'cliffswift', 'ambershellcrab', 'cypressstalker', 'sandwyrm', 'sunbeakvulture', 'spinedgekko'];
// ── Session 853: OG-040's strange beasts (backlog L3), five an island, none of them gate-made. Six were built in Sessions
// 773 to 775 (the Bellthroat, the Mossback, the Shatterhorn, the Stormplume, the Mineprowler, the Sailshell); these are
// the other eight. A raised tail fan (the Sunfan's display) and see-through membrane wings (the Glasswing's) are the kit's
// two new options; every older plan builds as it did ──
Object.assign(PLANS, {
  crownstag: re(PLANS.stag, { name: 'Crownstag', src: 'OG-040 (Gatelands: a forest monarch; antlers like living branches hung with moss)', scale: 1.3, rough: .8,
    palette: { coat: [.36, .25, .16], saddle: [.22, .15, .09], belly: [.74, .66, .52], dark: [.05, .04, .04], hoof: [.1, .08, .07], horn: [.34, .38, .2] }, fur: { len: .03, layers: 8, sx: 260, droop: .35 },
    parts: PLANS.stag.parts.map(([k, o]) => k === 'head' ? [k, { ...o, antlers: { len: 1.15, r: .04, f: .1, up: .85, out: .4, depth: 3 } }] : [k, o]) }),
  lanternfox: re(PLANS.redfox, { name: 'Lanternfox', src: 'OG-040 (Gatelands: a black fox whose fur glows blue and silver at night)', scale: 1.05,
    palette: { coat: [.07, .08, .11], saddle: [.03, .03, .05], belly: [.2, .22, .3], dark: [.02, .02, .03], pale: [.7, .78, .92] }, fur: PLANS.redfox.fur,
    glow: { color: [.7, 1.5, 3.2], freq: 9, w: .06, all: .8 } }),
  thornrunner: re(PLANS.redfox, { name: 'Thornrunner', src: 'OG-040 (Gatelands: a long-legged quilled omnivore of hills and farms; very fast)', scale: 1.45, speedK: 1.5,
    palette: { coat: [.58, .36, .2], saddle: [.24, .14, .08], belly: [.88, .82, .7], dark: [.05, .04, .03], pale: [.92, .88, .78] }, fur: { len: .022, layers: 7, sx: 300 },
    parts: [...PLANS.redfox.parts.map(([k, o]) => k === 'spine' ? [k, { ...o, hip: [.52, -.25], chest: [.55, .2] }] : [k, o]), ['spines', { n: 18, from: .15, to: 1.05, len: .17, r: .008, tone: 'pale', taper: .5 }]] }),
  frostmane: { name: 'Frostmane', src: 'OG-040 (the Mark: a long-necked maned browser in small herds; a candidate pack beast)', gaits: ['walk', 'trot', 'stand'], speedK: .9, neckNod: .05, wag: .03, fold: .6, rough: .9,
    palette: { coat: [.82, .8, .76], saddle: [.6, .58, .55], belly: [.9, .88, .84], dark: [.06, .05, .05], hoof: [.12, .1, .09] },
    fur: { len: .075, layers: 11, sx: 110, sy: 28, droop: .55 },
    parts: [
      ['spine', { hip: [1.02, -.48], chest: [1.08, .38], n: 4, r: [.22, .23, .26], s: [.8, 1.15], rump: .16, rumpDrop: .04, front: .16, frontDrop: .06 }],
      ['neck', { len: .85, n: 3, rise: 74, curve: -8, r: [.17, .11], s: [.85, 1.1] }],
      ['head', { len: .3, r: .085, pitch: 38, muzzle: { len: 1, r: .055, nose: 1, taper: .75 }, jaw: { len: .85, r: .04, drop: .5 }, eyes: [{ f: .4, up: .35, out: .7, r: .018, color: [.08, .06, .05] }], ears: { kind: 'leaf', size: .1, f: .1, up: .9, out: .5, splay: 12, back: 5 } }],
      ['tail', { len: .22, n: 2, r: [.06, .04], droop: 25 }],
      ['legs', { at: 1, kind: 'ungulFore', out: .1, drop: .1, r: [.1, .055, .034, .036] }],
      ['legs', { at: 0, kind: 'ungulHind', out: .1, drop: .07, r: [.13, .065, .036, .036] }]
    ] },
  glasswing: { name: 'Glasswing', src: 'OG-040 (the Mark: a gliding predator of cliffs and ridges, its wings translucent)', gaits: ['soar', 'walk', 'stand'], flyH: 2.2, wingFold: .3, wingOpacity: .5, wag: .06, neckNod: .06, fold: 1, rough: .45,
    palette: { coat: [.7, .74, .78], saddle: [.46, .52, .58], belly: [.9, .92, .92], dark: [.05, .05, .06], horn: [.3, .32, .36], skin: [.5, .52, .56], membrane: [.72, .86, .96], membraneEdge: [.4, .54, .7] },
    parts: [
      ['spine', { hip: [.48, -.32], chest: [.5, .24], n: 3, r: [.09, .11, .1], s: [.82, 1], rump: .06, front: .06 }],
      ['neck', { len: .3, n: 2, rise: 42, curve: -14, r: [.07, .05] }],
      ['head', { len: .22, r: .052, pitch: 6, muzzle: { len: 1, r: .028, taper: .5 }, jaw: { len: .9, r: .02, drop: .5 }, eyes: [{ f: .42, up: .4, out: .62, r: .011, color: [.55, .85, 1] }], horns: { len: .14, r: .012, f: .2, up: .8, out: .4, turn: .2, rise: .3, back: 1, spread: .2 } }],
      ['tail', { len: 1.1, n: 6, r: [.06, .008], droop: 8, curl: -1 }],
      ['legs', { at: .35, kind: 'bird', out: .07, drop: .05, r: [.055, .025, .016, .012], claws: { r: .005, len: .03 } }],
      ['wings', { at: .85, out: .07, up: .04, span: 3.4, fingers: 4, r: [.04, .03, .02], sag: .12 }]
    ] },
  stonejaw: { name: 'Stonejaw', src: 'OG-040 (the Mark: an armoured burrower with a shovel skull; digs through snow and rock)', gaits: ['walk', 'trot', 'stand'], speedK: .6, wag: .03, fold: .5, rough: .8,
    palette: { coat: [.46, .42, .36], saddle: [.34, .31, .27], belly: [.66, .6, .5], dark: [.06, .05, .05], shell: [.5, .48, .44], seam: [.2, .19, .17], skin: [.46, .42, .36] },
    parts: [
      ['spine', { hip: [.32, -.42], chest: [.34, .32], n: 4, r: [.18, .2, .18], s: [1.2, .85], rump: .1, front: .08, tone: 'skin' }],
      ['neck', { len: .1, n: 1, rise: -10, r: [.14, .12], s: [1.2, .85] }],
      ['head', { len: .26, r: .11, pitch: 14, s: [1.3, .8, 1], muzzle: { len: 1, r: .1, s: [1.7, .42, 1], taper: 1 }, eyes: [{ f: .3, up: .55, out: .62, r: .009, color: [.1, .07, .05] }], ears: { kind: 'round', size: .025, f: .08, up: .7, out: .7 } }],
      ['tail', { len: .3, n: 3, r: [.08, .02], droop: 20 }],
      ['legs', { at: 1, kind: 'plantFore', out: .17, drop: .06, r: [.07, .06, .055, .05], claws: { r: .01, len: .07 } }],
      ['legs', { at: 0, kind: 'plantHind', out: .17, drop: .04, r: [.08, .065, .055, .05], claws: { r: .008, len: .04 } }],
      ['shell', { at: .5, lift: -.04, len: .95, w: .6, h: .3, scute: .09, rough: .85 }]
    ] },
  redcrest: { name: 'Redcrest', src: 'OG-040 (Aurenne: a feathered raptor-like predator of scrub and cliffs; hunts in packs)', gaits: ['walk', 'trot', 'stand'], speedK: 1.5, neckNod: .1, wag: .04, fold: 1.1, rough: .6,
    palette: { coat: [.5, .27, .14], saddle: [.28, .14, .07], belly: [.84, .74, .58], dark: [.05, .04, .03], skin: [.42, .34, .24], horn: [.2, .16, .12], comb: [.82, .12, .07], feather: [.46, .22, .1], featherTip: [.14, .07, .04] },
    pattern: { kind: 'stripes', period: .09, tone: 'saddle' }, fur: { len: .03, layers: 8, sx: 110, sy: 45, droop: .5 },
    parts: [
      ['spine', { hip: [.82, -.3], chest: [.86, .3], n: 3, r: [.16, .19, .15], s: [.8, 1.1], rump: .12, front: .08 }],
      ['neck', { len: .4, n: 3, rise: 50, curve: -45, r: [.1, .065] }],
      ['head', { len: .26, r: .06, pitch: 6, s: [.9, 1, 1], muzzle: { len: 1, r: .036, taper: .6 }, jaw: { len: .9, r: .026, drop: .5 }, eyes: [{ f: .4, up: .45, out: .6, r: .011, color: [.95, .6, .1] }], ears: { kind: 'leaf', size: .11, f: .3, up: 1, out: .15, back: 45, splay: 0, tone: 'comb' } }],
      ['tail', { len: 1.05, n: 6, r: [.1, .02], droop: -4, curl: 1.5, fan: { n: 7, len: .3, spread: 34 } }],
      ['arms', { at: .95, out: .1, up: -.04, len: .4, r: [.035, .026, .018], dir: [.35, -.55, .6], tone: 'coat', claws: { r: .004, len: .045 }, swing: .08 }],
      ['legs', { at: .35, kind: 'bird', out: .09, drop: .08, r: [.1, .045, .026, .02], claws: { r: .008, len: .05 } }]
    ] },
  sunfan: re(PLANS.heron, { name: 'Sunfan', src: 'OG-040 (Aurenne: a long-legged bird of plains and oases with a radiant fan it displays)', scale: 1.15,
    palette: { coat: [.86, .72, .44], saddle: [.72, .56, .3], belly: [.94, .88, .72], dark: [.06, .05, .04], skin: [.5, .32, .2], horn: [.4, .3, .18], comb: [.98, .68, .14], feather: [1, .74, .2], featherTip: [.92, .4, .08] },
    parts: PLANS.heron.parts.map(([k, o]) => k === 'neck' ? [k, { ...o, len: .36 }] : k === 'head' ? [k, { ...o, beak: { len: .07, r: .012, up: -.05, hook: .2 }, ears: { kind: 'leaf', size: .045, f: .2, up: 1, out: .2, back: 35, splay: 8, tone: 'comb' } }] : k === 'tail' ? [k, { ...o, droop: -40, fan: { n: 15, len: .62, spread: 170, raise: 72 } }] : [k, o]) })
});
export const STRANGE = ['crownstag', 'mossback', 'bellthroat', 'lanternfox', 'thornrunner', 'shatterhorn', 'frostmane', 'glasswing', 'stonejaw', 'stormplume', 'redcrest', 'sunfan', 'mineprowler', 'sailshell'];
// ── Session 854: the sea (OG-016's coastal and open-ocean bands, OG-084; backlog L3). The Tidecrab, the Storm Whale,
// the giant octopus and the Shatterback were built; these are twelve more, and the gate eel and the Gate Leviathan are
// a sea gate's antibodies, their seams lit as the Faolchú's are. The fish are the salmon's plan, the dolphin the whale's,
// the moray the snake's, the jelly the wisp's; the rays, the squid and the seal have parts of their own ──
Object.assign(PLANS, {
  reefmoray: re(PLANS.miresnake, { name: 'Reef Moray', src: 'OG-016 (coastal: a reef moray)', scale: 1.1, water: 1.6, pattern: null, mottle: 2.2,
    palette: { coat: [.4, .42, .16], saddle: [.24, .26, .1], belly: [.62, .6, .3], dark: [.05, .05, .04] },
    parts: [
      ['spine', { hip: [.09, -.5], chest: [.095, .3], n: 8, r: [.075, .09, .085], s: [.8, 1.15], rump: .02, front: .02 }],
      ['head', { len: .17, r: .06, pitch: 0, s: [.85, 1.05, 1], muzzle: { len: 1, r: .042, taper: .7 }, jaw: { len: .92, r: .034, drop: .6 }, eyes: [{ f: .55, up: .55, out: .62, r: .009, color: [.85, .75, .2] }] }],
      ['tail', { len: .75, n: 9, r: [.08, .01], s: [.55, 1.25], droop: 0 }]
    ] }),
  starweedray: { name: 'Starweed Ray', src: 'OG-016 (coastal: a starweed ray of the shallows)', gaits: ['swim', 'stand'], bl: .6, swimAxis: 'x', waveAmp: .08, water: 4, rough: .4, mottle: 1.4, wag: 0, pant: .02, finOpacity: 1,
    palette: { coat: [.52, .45, .34], saddle: [.38, .31, .22], belly: [.92, .9, .84], dark: [.05, .05, .04], fin: [.46, .4, .3], pale: [.9, .86, .62] },
    pattern: { kind: 'patches', size: .04, cut: .38, tone: 'pale' },
    parts: [
      ['spine', { hip: [.12, -.22], chest: [.12, .22], n: 4, r: [.08, .12, .07], s: [2.6, .35], rump: .02, front: .04 }],
      ['head', { len: .06, r: .04, pitch: 0, s: [1.6, .5, 1], eyes: [{ f: .4, up: .95, out: .5, r: .008, color: [.7, .6, .2] }] }],
      ['tail', { len: .6, n: 5, r: [.025, .004], droop: 0 }],
      ['fins', { list: [{ at: .55, off: [.95, 0], out: [1, 0, 0], len: .42, h: .3, pair: 1, role: 'pec' }] }]
    ] },
  lanternjelly: re(PLANS.wisp, { name: 'Lantern Jelly', src: 'OG-016 (coastal: blooms on warm nights and draws fish and birds)', scale: .35, water: 7.5,
    glow: { color: [1.5, 1.05, .35], base: .6, freq: 3, w: .02, all: .5 },
    palette: { coat: [.92, .74, .42], belly: [.96, .86, .6], pale: [.96, .72, .46], thread: [1, .82, .46] } }),
  coastaltuna: re(PLANS.riverjaw, { name: 'Coastal Tuna', src: 'OG-016 (open ocean: coastal tuna in fast schools)', scale: 1.5, bl: 1.6, mottle: .3,
    palette: { coat: [.72, .76, .8], saddle: [.08, .12, .32], belly: [.92, .92, .92], dark: [.04, .04, .06], fin: [.2, .24, .42] },
    parts: PLANS.riverjaw.parts.map(([k, o]) => k === 'spine' ? [k, { ...o, r: [.075, .1, .08], s: [.62, 1.12] }] : [k, o]) }),
  skyskimmer: re(PLANS.riverjaw, { name: 'Skyskimmer', src: 'OG-016 (open ocean: a flying fish that glides on its fins)', scale: .45, mottle: .3,
    palette: { coat: [.66, .72, .8], saddle: [.16, .28, .5], belly: [.92, .93, .94], dark: [.04, .04, .06], fin: [.55, .66, .82] }, finOpacity: .8,
    parts: PLANS.riverjaw.parts.map(([k, o]) => k === 'fins' ? [k, { list: o.list.map(f => f.role === 'pec' ? { ...f, out: [1, .1, 0], len: .32, h: .26 } : f) }] : [k, o]) }),
  reefshark: re(PLANS.riverjaw, { name: 'Reef Shark', src: 'OG-016 (open ocean: a reef shark)', scale: 2.6, bl: .9, mottle: .3,
    palette: { coat: [.44, .48, .52], saddle: [.3, .34, .38], belly: [.9, .9, .88], dark: [.04, .04, .05], fin: [.36, .4, .44] },
    parts: PLANS.riverjaw.parts.map(([k, o]) => k === 'head' ? [k, { ...o, s: [.62, .78, 1], muzzle: { ...o.muzzle, taper: .45 } }] : k === 'fins' ? [k, { list: o.list.map((f, i) => i === 0 ? { ...f, len: .16, h: .16 } : f.role === 'pec' ? { ...f, len: .15, h: .14 } : f) }] : [k, o]) }),
  stormswift: re(PLANS.stormwhale, { name: 'Stormswift', src: 'OG-016 (open ocean: rides the bow wave), OG-084 (dolphins)', scale: .17, bl: .9, waveAmp: .16, mottle: .4,
    palette: { coat: [.46, .5, .56], saddle: [.24, .28, .34], belly: [.88, .88, .86], dark: [.04, .04, .05], fin: [.3, .34, .4] },
    parts: PLANS.stormwhale.parts.map(([k, o]) => k === 'head' ? [k, { ...o, len: 3.1, muzzle: { ...o.muzzle, r: .38, taper: .75 }, jaw: { ...o.jaw, r: .32 } }] : k === 'fins' ? [k, { list: o.list.map((f, i) => i === 1 ? { ...f, at: .45, len: 1.5, h: 1.7 } : f) }] : [k, o]) }),
  driftersquid: { name: 'Drifter Squid', src: 'OG-016 (open ocean: a drifter squid)', gaits: ['drift', 'stand'], rough: .35, mottle: 1.6, wag: 0, pant: 0, water: 2.9, finOpacity: .95,
    palette: { coat: [.66, .22, .22], saddle: [.42, .1, .12], belly: [.88, .62, .58], dark: [.05, .04, .04], fin: [.66, .26, .26], thread: [.7, .3, .3] },
    parts: [
      ['spine', { hip: [2.4, 0], chest: [1.4, 0], n: 3, r: [.05, .16, .14], s: [1, 1] }],
      ['head', { len: .22, r: .12, pitch: 90, eyes: [{ f: .35, up: 0, out: .95, r: .03, color: [.9, .75, .3] }] }],
      ['radial', { c: [0, 1.3, 0], parent: 'head', n: 8, ring: .07, len: .8, seg: 6, down: 80, curl: 1, r: [.035, .006], tag: 'arm' }],
      ['radial', { c: [0, 1.3, 0], parent: 'head', n: 2, ring: .04, len: 1.6, seg: 7, down: 86, r: [.009, .004], thread: 1, rot: .25, tag: 'ten' }],
      ['fins', { list: [{ at: .05, off: [.9, 0], out: [1, 0, 0], back: [0, -1, 0], len: .32, h: .2, pair: 1, role: 'pec' }] }]
    ] },
  seal: { name: 'Grey seal', src: 'OG-084 (marine life: seals), OG-016', gaits: ['swim', 'stand'], bl: .5, water: 2.2, rough: .3, mottle: 1.5, wag: 0, pant: .03, finOpacity: 1,
    palette: { coat: [.44, .42, .4], saddle: [.28, .27, .26], belly: [.72, .7, .64], dark: [.04, .04, .04], fin: [.3, .28, .26] },
    pattern: { kind: 'patches', size: .06, cut: .32, tone: 'saddle' },
    parts: [
      ['spine', { hip: [.3, -.6], chest: [.3, .35], n: 5, r: [.14, .2, .18], s: [1, .95], rump: .1, front: .08 }],
      ['neck', { len: .12, n: 1, rise: 10, r: [.15, .12] }],
      ['head', { len: .22, r: .09, pitch: 4, muzzle: { len: .9, r: .05, nose: 1, taper: .8 }, jaw: { len: .8, r: .03, drop: .5 }, eyes: [{ f: .5, up: .4, out: .6, r: .016, color: [.04, .03, .03] }] }],
      ['tail', { len: .3, n: 2, r: [.1, .05], droop: 0 }],
      ['fins', { list: [
        { at: .85, off: [.85, -.6], out: [1, -.6, 0], back: [0, -.2, -1], len: .2, h: .18, pair: 1, role: 'pec' },
        { on: 'tail', kind: 'fork', out: [1, 0, 0], len: .22, h: .22, role: 'caudal' }] }]
    ] }
});
Object.assign(PLANS, {
  sailfinray: re(PLANS.starweedray, { name: 'Sailfin Ray', src: 'OG-016 (open ocean: a great ray that glides in the deep channels)', scale: 3.2, bl: .4, pattern: null,
    palette: { coat: [.12, .13, .16], saddle: [.06, .06, .08], belly: [.9, .9, .88], dark: [.03, .03, .04], fin: [.12, .13, .16] },
    parts: PLANS.starweedray.parts.map(([k, o]) => k === 'fins' ? [k, { list: [{ ...o.list[0], len: .36, h: .46 }] }] : [k, o]) }),
  blackcurrenteel: re(PLANS.reefmoray, { name: 'Blackcurrent Eel', src: 'OG-016 (deep: an eel that glows in the dark channels)', scale: 1.6,
    palette: { coat: [.08, .09, .12], saddle: [.04, .05, .07], belly: [.16, .18, .24], dark: [.02, .02, .03] }, glow: { color: [.4, 1.2, 2.8], freq: 7, w: .04, all: .7 } }),
  gateeel: re(PLANS.reefmoray, { name: 'Gate Eel', src: 'OG-016 (deep: drawn to the gates), a sea gate’s antibody (the Mouth, the Vault of the Tide)', scale: 3,
    palette: { coat: [.16, .18, .2], saddle: [.08, .09, .1], belly: [.3, .3, .3], dark: [.03, .03, .03] }, glow: { color: [3.2, 1.6, .4], freq: 2.6, w: .035, all: .6 } }),
  gateleviathan: re(PLANS.stormwhale, { name: 'The Gate Leviathan', src: 'OG-016 (said to move between the islands as the gates change), a sea gate’s antibody', scale: 1.8, bl: .15, mottle: 1.8,
    palette: { coat: [.14, .16, .2], saddle: [.07, .08, .1], belly: [.36, .36, .38], dark: [.03, .03, .04], fin: [.12, .14, .18], horn: [.5, .62, .78] },
    glow: { color: [3, 1.5, .4], freq: .35, w: .025, all: .55 },
    parts: PLANS.stormwhale.parts.map(([k, o]) => k === 'head' ? [k, { ...o, crystals: { n: 6, len: 3.2, r: .35, f: .15, up: 1, out: .5 } }] : [k, o]) })
});
export const SEA = ['tidecrab', 'reefmoray', 'starweedray', 'lanternjelly', 'coastaltuna', 'skyskimmer', 'stormwhale', 'stormswift', 'sailfinray', 'driftersquid', 'reefshark', 'octopus', 'seal', 'blackcurrenteel', 'gateeel', 'shatterback', 'gateleviathan'];
// ── Session 855: beasts of burden (OG-046's roads; OG-077's post hare, built in Session 773; backlog L3). The horse is
// its own plan and the mule and the donkey are the horse; the ox and the yak are the cow, the reindeer the stag, the
// giant goat the goat with a saddle. OG-046's llama is the Frostmane (Session 853) and its cow is the livestock's ──
Object.assign(PLANS, {
  horse: { name: 'Horse', src: 'OG-046 (beasts of burden: the horse)', gaits: ['walk', 'trot', 'gallop', 'stand'], speedK: 1.1, wag: .06, neckNod: .08, rough: .5,
    palette: { coat: [.34, .22, .14], saddle: [.24, .15, .09], belly: [.44, .3, .2], dark: [.04, .03, .03], hoof: [.1, .08, .07], mane: [.07, .05, .04] },
    fur: { len: .01, layers: 5, sx: 420 },
    parts: [
      ['spine', { hip: [1.42, -.68], chest: [1.48, .52], n: 4, r: [.3, .3, .33], s: [.82, 1.12], rump: .22, rumpDrop: .05, front: .2, frontDrop: .1 }],
      ['neck', { len: .75, n: 3, rise: 55, curve: -12, r: [.22, .12], s: [.7, 1.3], fwd: .04 }],
      ['head', { len: .58, r: .12, pitch: 62, s: [.85, 1, 1], muzzle: { len: 1, r: .085, nose: 1, taper: .85 }, jaw: { len: .85, r: .06, drop: .5 }, eyes: [{ f: .3, up: .4, out: .8, r: .022, color: [.05, .04, .03] }], ears: { kind: 'leaf', size: .08, f: .08, up: .9, out: .5, splay: 10, back: 5 } }],
      ['tail', { len: .7, n: 3, r: [.07, .06], droop: 75, tone: 'mane' }],
      ['legs', { at: 1, kind: 'ungulFore', out: .14, drop: .14, r: [.13, .07, .04, .045] }],
      ['legs', { at: 0, kind: 'ungulHind', out: .14, drop: .08, r: [.17, .08, .042, .045] }]
    ] },
  ox: re(PLANS.cow, { name: 'Ox', src: 'OG-046 (beasts of burden: the ox)', scale: 1.15, pattern: null, speedK: .7,
    palette: { coat: [.32, .21, .14], saddle: [.22, .14, .09], belly: [.56, .46, .36], dark: [.06, .04, .04], hoof: [.1, .08, .07], horn: [.84, .78, .64], skin: [.5, .36, .3] },
    parts: PLANS.cow.parts.map(([k, o]) => k === 'head' ? [k, { ...o, horns: { ...o.horns, len: .42, r: .04, spread: 1 } }] : [k, o]) }),
  yak: re(PLANS.cow, { name: 'Highland yak', src: 'OG-046 (beasts of burden: the highland yak)', scale: 1.05, pattern: null, speedK: .7,
    palette: { coat: [.16, .12, .1], saddle: [.1, .08, .07], belly: [.22, .18, .15], dark: [.04, .03, .03], hoof: [.08, .07, .06], horn: [.78, .74, .66], skin: [.3, .24, .22] },
    fur: { len: .14, layers: 12, sx: 80, sy: 18, droop: .75 },
    parts: PLANS.cow.parts.map(([k, o]) => k === 'spine' ? [k, { ...o, hump: { at: .85, up: .22, len: .5, r: .3 } }] : k === 'head' ? [k, { ...o, horns: { ...o.horns, len: .36, r: .034, turn: .7, rise: .9, spread: .9 } }] : [k, o]) }),
  camel: { name: 'Camel', src: 'OG-046 (beasts of burden: the camel, the caravans)', gaits: ['walk', 'trot', 'stand'], speedK: .9, wag: .05, neckNod: .1, rough: .7,
    palette: { coat: [.74, .58, .4], saddle: [.62, .46, .3], belly: [.84, .72, .56], dark: [.06, .05, .04], hoof: [.3, .24, .18] },
    fur: { len: .02, layers: 7, sx: 260, droop: .3 },
    parts: [
      ['spine', { hip: [1.7, -.7], chest: [1.75, .55], n: 4, r: [.28, .3, .32], s: [.75, 1.1], rump: .2, front: .2, frontDrop: .12, hump: { at: .5, up: .26, len: .45, r: .34, sx: .7 } }],
      ['neck', { len: 1.0, n: 4, rise: -15, curve: 120, r: [.2, .11], s: [.75, 1.2] }],
      ['head', { len: .55, r: .11, pitch: 20, muzzle: { len: 1, r: .08, nose: 1, taper: .85 }, jaw: { len: .85, r: .055, drop: .5 }, eyes: [{ f: .32, up: .5, out: .75, r: .02, color: [.05, .04, .03] }], ears: { kind: 'round', size: .04, f: .08, up: .85, out: .6 } }],
      ['tail', { len: .5, n: 2, r: [.05, .03], droop: 75 }],
      ['legs', { at: 1, kind: 'ungulFore', out: .16, drop: .12, r: [.14, .07, .045, .07] }],
      ['legs', { at: 0, kind: 'ungulHind', out: .16, drop: .08, r: [.16, .075, .045, .07] }]
    ] },
  reindeer: re(PLANS.stag, { name: 'Reindeer', src: 'OG-046 (beasts of burden: the reindeer, the Mark)', scale: .85,
    palette: { coat: [.46, .4, .34], saddle: [.32, .27, .22], belly: [.86, .84, .8], dark: [.05, .04, .04], hoof: [.1, .08, .07], horn: [.7, .64, .52] }, fur: { len: .04, layers: 9, sx: 200, droop: .4 },
    parts: PLANS.stag.parts.map(([k, o]) => k === 'head' ? [k, { ...o, antlers: { len: 1.1, r: .026, f: .1, up: .85, out: .3, depth: 3 } }] : [k, o]) })
});
Object.assign(PLANS, {
  mule: re(PLANS.horse, { name: 'Mule', src: 'OG-046 (beasts of burden: the mule)', scale: .9,
    palette: { coat: [.3, .22, .16], saddle: [.22, .16, .11], belly: [.62, .54, .46], dark: [.04, .03, .03], hoof: [.1, .08, .07], mane: [.1, .08, .06] },
    parts: PLANS.horse.parts.map(([k, o]) => k === 'head' ? [k, { ...o, ears: { ...o.ears, size: .15, splay: 18 } }] : [k, o]) }),
  donkey: re(PLANS.horse, { name: 'Donkey', src: 'OG-046 (beasts of burden: the donkey)', scale: .72, speedK: .9, fur: { len: .022, layers: 7, sx: 260, droop: .3 },
    palette: { coat: [.5, .48, .46], saddle: [.4, .38, .36], belly: [.86, .84, .8], dark: [.04, .04, .04], hoof: [.1, .08, .07], mane: [.16, .15, .14] },
    parts: PLANS.horse.parts.map(([k, o]) => k === 'head' ? [k, { ...o, ears: { ...o.ears, size: .18, splay: 22 } }] : [k, o]) }),
  giantgoat: re(PLANS.goat, { name: 'Giant goat', src: 'OG-046 (beasts of burden: a giant goat, saddled)', scale: 2.1,
    palette: { ...PLANS.goat.palette, blanket: [.2, .32, .5], leather: [.36, .22, .12] }, parts: [...PLANS.goat.parts, ['saddle', { at: .55, len: .24 }]] })
});
export const BURDEN = ['horse', 'mule', 'donkey', 'ox', 'camel', 'reindeer', 'yak', 'giantgoat', 'posthare'];
// ── Session 856: three of OG-016's deep band (backlog L3). The angler and the stonefish are the salmon's plan with
// another head and body; the crimson leviathan is the Mire Snake at a sea serpent's size. The kelpstrider and the
// pierwinkle want parts the kit lacks (a leafy frond, a coiled shell) ──
Object.assign(PLANS, {
  abyssalangler: re(PLANS.riverjaw, { name: 'Abyssal Angler', src: 'OG-016 (deep: a lure of light over a mouth of teeth)', scale: 1.4, bl: .5, mottle: 1.8, rough: .55,
    palette: { coat: [.12, .1, .1], saddle: [.07, .06, .06], belly: [.2, .17, .16], dark: [.03, .02, .02], fin: [.14, .12, .12] },
    glow: { color: [.6, 1.6, 2.4], base: 0, freq: 10, w: .02, all: .25 },
    parts: PLANS.riverjaw.parts.map(([k, o]) => k === 'spine' ? [k, { ...o, r: [.07, .11, .14], s: [.8, 1.05] }] : k === 'head' ? [k, { ...o, len: .26, r: .13, s: [1, .95, 1], muzzle: { len: .9, r: .1, s: [1.1, .8, 1], taper: .9 }, jaw: { len: 1, r: .085, drop: .9 }, eyes: [{ f: .35, up: .7, out: .5, r: .008, color: [.6, .7, .7] }],
      stalks: { f: .35, up: 2.6, out: 0, r: .03, len: .2, color: [.7, 1, 1] }, fangs: { r: .006, len: .045, f: .9, up: -.2, out: .7 } }] : [k, o]) }),
  stonefish: re(PLANS.riverjaw, { name: 'Stonefish', src: 'OG-016 (coastal: a stonefish that lies as a rock among rocks)', scale: .5, bl: .2, mottle: 3, rough: .95,
    palette: { coat: [.42, .36, .3], saddle: [.3, .24, .2], belly: [.56, .46, .4], dark: [.05, .04, .04], fin: [.4, .32, .26], horn: [.5, .42, .34] },
    parts: [...PLANS.riverjaw.parts.map(([k, o]) => k === 'spine' ? [k, { ...o, hip: [.2, -.15], chest: [.2, .18], r: [.09, .13, .12], s: [1.1, .9] }] : k === 'head' ? [k, { ...o, pitch: -8, s: [1.2, .85, 1], muzzle: { ...o.muzzle, s: [1.2, .7, 1], taper: .9 } }] : [k, o]), ['spines', { n: 9, from: .1, to: .9, len: .09, r: .012, tone: 'horn', taper: .3 }]] }),
  crimsonleviathan: re(PLANS.miresnake, { name: 'Crimson Leviathan', src: 'OG-016 (deep: a great red serpent of the open sea)', scale: 22, water: .2, pattern: { kind: 'bands', period: .14, tone: 'band' }, mottle: 1.2,
    palette: { coat: [.56, .1, .08], saddle: [.34, .05, .04], belly: [.86, .62, .44], dark: [.05, .03, .03], band: [.38, .06, .05], horn: [.86, .78, .62] },
    parts: [...PLANS.miresnake.parts.map(([k, o]) => k === 'head' ? [k, { ...o, jaw: { len: .9, r: .016, drop: .5 }, horns: { len: .05, r: .005, f: .2, up: .9, out: .5, turn: .3, rise: .3, back: 1, spread: .3 } }] : [k, o]), ['spines', { n: 16, from: .05, to: 1, len: .025, r: .005, tone: 'horn', taper: .3 }]] })
});
SEA.push('abyssalangler', 'stonefish', 'crimsonleviathan');
// ── Session 861: the turtles of OG-016 and OG-084 (backlog L3). A sea turtle is the tortoise's low body under a flatter
// shell, with flippers for legs: the front pair long and beating together, the rear pair short and steering. The maw turtle
// is the same turtle at an island's size, with a reef growing on its back ──
const seaTurtle = o => [
  ['spine', { hip: [.35, -.45], chest: [.37, .4], n: 3, r: [.18, .2, .16], s: [2, .6], rump: .06, front: .06 }],
  ['neck', { len: .2, n: 2, rise: 4, r: [.09, .07], fwd: .02 }],
  ['head', { len: .21, r: .085, pitch: 6, muzzle: { len: 1, r: .062, taper: .72 }, jaw: { len: .85, r: .045, drop: .45 }, eyes: [{ f: .42, up: .35, out: .8, r: .017, color: [.06, .05, .04] }] }],
  ['tail', { len: .12, n: 2, r: [.05, .015], droop: 8 }],
  ['arms', { at: .92, out: .26, up: -.05, dz: .1, len: .64, r: [.06, .085, .05], s: [1, .3, 1], dir: [1, -.12, -.12], dir2: [.7, -.06, -.7], swing: 0, stroke: .6, tone: 'coat' }],
  ['arms', { at: .06, out: .24, up: -.05, len: .3, r: [.05, .07, .045], s: [1, .3, 1], dir: [.7, -.1, -.7], dir2: [.35, -.02, -.94], swing: 0, stroke: .18, phase: Math.PI, tone: 'coat' }],
  ['shell', { at: .5, lift: -.01, len: 1.05, w: .92, h: .26, scute: .2, rough: .45, ...o }]];
Object.assign(PLANS, {
  seaturtle: { name: 'Sea turtle', src: 'OG-084 (marine life: turtles), OG-016 (the coastal reefs)', gaits: ['swim', 'stand'], bl: .45, waveAmp: .015, cell: .016, water: 1.4, rough: .45, mottle: 1.4, wag: .02, pant: .02, neckNod: .02,
    palette: { coat: [.44, .44, .32], saddle: [.3, .3, .2], belly: [.84, .78, .58], dark: [.05, .05, .04], shell: [.44, .32, .16], seam: [.2, .13, .06] },
    pattern: { kind: 'patches', size: .03, cut: .4, tone: 'saddle' },
    parts: seaTurtle({}) }
});
Object.assign(PLANS, {
  mawturtle: re(PLANS.seaturtle, { name: 'Maw Turtle', src: 'OG-016 (deep and legendary: carries an ecosystem on its back)', scale: 11, bl: .08, mottle: 2.2, rough: .85, water: .62, cell: .016, pattern: null,
    palette: { coat: [.34, .36, .32], saddle: [.24, .25, .22], belly: [.62, .6, .5], dark: [.04, .04, .04], shell: [.4, .4, .37], seam: [.2, .2, .18], moss: [.22, .34, .26], fern: [.18, .4, .26], bloom: [.92, .46, .38], bloom2: [.95, .78, .5] },
    parts: seaTurtle({ h: .3, top: 'moss', rough: .9, garden: { ferns: 70, flowers: 90, size: .11 } }) })
});
SEA.push('seaturtle', 'mawturtle');
// ── Session 862: the pierwinkle (OG-016's tide pools). A sea snail: a broad foot, a head with two eye stalks, and the coiled
// shell. It creeps at a tenth of its length a second. The kelpstrider still waits for a leafy frond ──
Object.assign(PLANS, {
  pierwinkle: { name: 'Pierwinkle', src: 'OG-016 (coastal: a snail of the tide pools and the piers)', gaits: ['crawl', 'stand'], scale: .16, bl: .1, water: 1.1, rough: .35, mottle: 1, wag: 0, pant: 0, neckNod: .05,
    palette: { coat: [.5, .44, .38], saddle: [.36, .3, .26], belly: [.92, .84, .7], dark: [.05, .04, .04], shell: [.4, .18, .34], seam: [.14, .07, .14], band: [.82, .66, .62] },
    parts: [
      ['spine', { hip: [.05, -.24], chest: [.06, .16], n: 4, r: [.04, .065, .06], s: [1.35, .55], rump: .1, rumpTaper: .4, front: .04 }],
      ['neck', { len: .07, n: 1, rise: 30, r: [.045, .04] }],
      ['head', { len: .08, r: .04, pitch: 30, stalks: { f: .55, up: 2.8, out: .7, r: .012, len: .1, color: [.05, .04, .04] } }],
      ['coil', { at: .4, lift: .06, R: .1, r: .125, spire: .28, turns: 4, grow: 1.9, tilt: -60, turn: 180, bands: 3 }]
    ] }
});
SEA.push('pierwinkle');
// ── Session 863: the kelpstrider (OG-016's kelp forests): a leafy seahorse. The body stands upright on the spine (hip low,
// chest high), the neck bends the head forward, the tail curls forward under it, and leafy fronds hang off all of it ──
Object.assign(PLANS, {
  kelpstrider: { name: 'Kelpstrider', src: 'OG-016 (coastal: a leafy seahorse of the kelp forests)', gaits: ['swim', 'stand'], bl: .15, swimAxis: 'x', waveAmp: .06, water: .5, cell: .004, rough: .5, mottle: 1.8, wag: .15, pant: .02, neckNod: .04, finOpacity: .9,
    palette: { coat: [.66, .54, .2], saddle: [.5, .38, .14], belly: [.8, .7, .36], dark: [.04, .04, .03], fin: [.8, .72, .4], frond: [.46, .54, .18], frondTip: [.7, .62, .24] },
    parts: [
      ['spine', { hip: [.13, -.012], chest: [.25, .012], n: 4, r: [.022, .03, .026], s: [.75, 1], arch: -.012 }],
      ['neck', { len: .035, n: 2, rise: 75, curve: -90, r: [.02, .016] }],
      ['head', { len: .085, r: .019, pitch: 35, muzzle: { len: 1, r: .0075, taper: .9 }, eyes: [{ f: .2, up: .45, out: .75, r: .0055, color: [.12, .08, .03] }] }],
      ['tail', { len: .17, n: 6, r: [.02, .005], droop: 88, curl: -28 }],
      ['fins', { list: [{ at: .45, off: [0, 0], dz: -.025, out: [0, 0, -1], back: [0, -1, 0], len: .035, h: .018, role: 'pec' }] }],
      ['fronds', { on: ['head', 'neck', 'spine', 'tail'], n: 28, len: .1, w: .045, out: .35, spread: .9, back: .7, tip: 'frondTip' }]
    ] }
});
SEA.push('kelpstrider');
// ── Session 864: the Glasswing Moth (OG-030: oases and ruins; crystalline wings, drawn to moonlight and flowers; a night
// ingredient), the last of Aurenne's fifteen. An insect's six legs under a furry moth body, and four wings as sheets of
// glass: clear, glossy and faintly blue, faceted by the kit's per-vertex tint. Held half-raised at rest; in the air they beat ──
Object.assign(PLANS, {
  glasswingmoth: { name: 'Glasswing Moth', src: 'OG-030 (oases and ruins; crystalline wings drawn to moonlight and flowering plants)', gaits: ['walk', 'soar', 'stand'], scale: .1, cell: .01, speedK: .8, flyH: .9, wag: 0, pant: 0, neckNod: .02, rough: .7, finOpacity: .38, finRough: .08,
    palette: { coat: [.86, .82, .72], saddle: [.62, .56, .46], belly: [.92, .9, .84], dark: [.05, .05, .06], skin: [.7, .64, .54], horn: [.66, .6, .5], glass: [.8, .92, 1] },
    fur: { len: .02, layers: 6, sx: 220, droop: .3 },
    parts: [
      ['spine', { hip: [.24, -.2], chest: [.25, .1], n: 3, r: [.06, .085, .075], rump: .2, rumpTaper: .35, front: .04 }],
      ['head', { len: .08, r: .058, pitch: 15, eyes: [{ f: .55, up: .2, out: .78, r: .034, color: [.12, .16, .22] }], horns: { len: .3, r: .007, f: .4, up: .85, out: .35, turn: .12, rise: .8, back: -.6, spread: .5 } }],
      ['legs', { at: .95, kind: 'insect', out: .07, drop: .03, fan: 35, reach: .45, r: [.014, .012, .009, .006] }],
      ['legs', { at: .6, kind: 'insect', out: .075, drop: .03, fan: 0, reach: .5, r: [.014, .012, .009, .006] }],
      ['legs', { at: .25, kind: 'insect', out: .07, drop: .03, fan: -35, reach: .45, r: [.014, .012, .009, .006] }],
      ['fins', { list: [
        { at: .9, kind: 'fore', off: [.6, .55], out: [1, .12, 0], back: [0, 0, -1], len: .42, h: .72, pair: 1, role: 'wing', tone: 'glass' },
        { at: .6, kind: 'hind', off: [.6, .45], out: [1, .06, -.25], back: [0, 0, -1], len: .36, h: .5, pair: 1, role: 'wing', tone: 'glass' }] }]
    ] }
});
AURENNE.push('glasswingmoth');
// ── Session 867: harness and packs on the beasts of burden (OG-046's roads). The pack mule carries panniers and a bedroll,
// the draught horse wears a collar with brass hames, the ox a yoke and bow; they are the same animals, with what they carry ──
const GEAR = { blanket: [.46, .36, .22], pack: [.5, .42, .3], leather: [.3, .19, .1], roll: [.36, .32, .24], brass: [.72, .56, .26], wood: [.42, .3, .18] };
Object.assign(PLANS, {
  packmule: re(PLANS.mule, { name: 'Pack mule', src: 'OG-046 (beasts of burden: the mule with its packs)', scale: PLANS.mule.scale, palette: { ...PLANS.mule.palette, ...GEAR }, parts: [...PLANS.mule.parts, ['packs', { at: .55, len: .55 }]] }),
  draughthorse: re(PLANS.horse, { name: 'Draught horse', src: 'OG-046 (beasts of burden: the horse in harness)', scale: 1.1, palette: { ...PLANS.horse.palette, ...GEAR }, parts: [...PLANS.horse.parts, ['harness', { kind: 'collar', at: .1, fit: 1.4 }]] }),
  yokedox: re(PLANS.ox, { name: 'Yoked ox', src: 'OG-046 (beasts of burden: the ox under its yoke)', scale: PLANS.ox.scale, speedK: PLANS.ox.speedK, palette: { ...PLANS.ox.palette, ...GEAR }, parts: [...PLANS.ox.parts, ['harness', { kind: 'yoke', at: .7, over: .5, fit: 1.05 }]] })
});
export const HARNESSED = ['packmule', 'draughthorse', 'yokedox'];

// ── Session 919: the corrupted (OG-088's second row; backlog L4, "corrupted animals by school"). A gate's antibodies wear
// the animals of its country, and each is a change of shape, never a recolour: the gate's work shows in what grows out of it.
// Each is tagged with its school (canon §9a) and keeps its familiar's bones, so it walks as its familiar does. OG-088's stone
// troll came with the troll (Session 926, below); its corrupted wolf is the Faolchú's kind and its void spider a Scáth spider for later ──
Object.assign(PLANS, {
  // Uisce: the frost wraith bear, blue ice: its coat iced over and thin, shards of ice through its back and a crown of them at the brow, pale light in its seams
  frostbear: re(PLANS.bear, { name: 'Frost Wraith Bear', src: 'OG-088 (corrupted: a frost wraith bear of blue ice)', school: 'Uisce', from: 'bear', scale: 1.1, rough: .35,
    palette: { coat: [.62, .74, .86], saddle: [.42, .56, .72], belly: [.8, .88, .94], dark: [.05, .07, .1], horn: [.62, .84, 1], ice: [.7, .9, 1] },
    fur: { len: .03, layers: 7, sx: 150, droop: .2 }, glow: { color: [.5, 1.1, 2.2], freq: 2, w: .03, all: .35, seam: { w: .05, y0: .9 } },
    parts: [...PLANS.bear.parts.map(([k, o]) => k === 'head' ? [k, { ...o, crystals: { n: 5, len: .3, r: .05, f: .34, up: .8, out: .38, rake: .3 }, eyes: o.eyes.map(e => ({ ...e, color: [.6, .9, 1] })) }] : [k, o]),
      ['spines', { n: 11, from: .1, to: 1, len: .36, r: .06, tone: 'ice', taper: .5, crystal: 3 }]] }),
  // Cloch: the blight boar, crystal spikes in its hide: a ridge of violet crystal from the withers to the rump, the tusks longer, the hide gone grey as stone
  blightboar: re(PLANS.boar, { name: 'Blight Boar', src: 'OG-088 (corrupted: a blight boar with crystal spikes in its hide)', school: 'Cloch', from: 'boar', scale: 1.15,
    palette: { coat: [.26, .24, .24], saddle: [.16, .15, .16], belly: [.34, .32, .32], dark: [.05, .04, .05], hoof: [.1, .08, .07], horn: [.82, .78, .7], skin: [.36, .3, .3], crystal: [.62, .36, .9] },
    glow: { color: [1.4, .5, 2.4], freq: 2.5, w: .025, all: .3 },
    parts: [...PLANS.boar.parts.map(([k, o]) => k === 'head' ? [k, { ...o, horns: { ...o.horns, len: .19, r: .018 }, eyes: o.eyes.map(e => ({ ...e, color: [.8, .45, 1] })) }] : [k, o]),
      ['spines', { n: 9, from: .25, to: 1.02, len: .3, r: .045, tone: 'crystal', taper: .35, crystal: 3 }]] }),
  // Scáth: the stag of shadows: gaunt, its legs longer and its body drawn in, its antlers spread half again and as dark as its hide, violet in its seams; its antlers breathe a violet mist from every tine (Session 969, `antlers.mist`)
  shadowstag: re(PLANS.stag, { name: 'Stag of Shadows', src: 'OG-088 (corrupted: a stag of shadows whose antlers breathe a mist)', school: 'Scáth', from: 'stag', scale: 1.08,
    palette: { coat: [.14, .12, .17], saddle: [.08, .07, .1], belly: [.24, .2, .28], dark: [.02, .02, .03], hoof: [.05, .04, .06], horn: [.16, .13, .2], mist: [.46, .34, .62] },
    fur: { len: .022, layers: 6, sx: 380, droop: .3 }, glow: { color: [1.3, .5, 2.6], freq: 1.6, w: .02, all: .45, seam: { w: .04, y0: .9 } },
    parts: PLANS.stag.parts.map(([k, o]) => k === 'spine' ? [k, { ...o, r: o.r.map(v => v * .82), hip: [o.hip[0] * 1.12, o.hip[1]], chest: [o.chest[0] * 1.12, o.chest[1]] }]
      : k === 'head' ? [k, { ...o, antlers: { ...o.antlers, len: 1.45, r: .034, depth: 3, mist: { per: 7, rate: 2, rise: .45, drift: .22, r0: .08, r1: .4, alpha: .2 } }, eyes: o.eyes.map(e => ({ ...e, color: [.75, .5, 1] })) }] : k === 'neck' ? [k, { ...o, r: o.r.map(v => v * .85) }] : [k, o]) }),
  // Gaoth: the dusk eagle, its feathers draining to violet: the Crag Hawk grown to a giant eagle, its flight feathers dark at their tips, violet light in its seams
  duskeagle: re(PLANS.craghawk, { name: 'Dusk Eagle', src: 'OG-088 (corrupted: a dusk eagle with draining violet feathers)', school: 'Gaoth', from: 'craghawk', scale: 2.6,
    palette: { coat: [.26, .2, .32], saddle: [.16, .12, .22], belly: [.44, .36, .52], dark: [.03, .02, .04], horn: [.18, .16, .2], skin: [.5, .42, .2], feather: [.3, .22, .4], featherTip: [.08, .04, .14], covert: [.38, .3, .48] },
    glow: { color: [1.2, .45, 2.2], freq: 3, w: .02, all: .3 },
    // the shape: wings a third wider with longer primaries, too few of them to close (ragged, the light through their gaps), a heavier hooked beak, a longer tail fan
    parts: PLANS.craghawk.parts.map(([k, o]) => k === 'wings' ? [k, { ...o, span: o.span * 1.32, feathers: { ...o.feathers, np: 6, primary: 1.4, ragged: .24 } }]
      : k === 'head' ? [k, { ...o, beak: { ...o.beak, len: o.beak.len * 1.35, r: o.beak.r * 1.25, hook: .55 }, eyes: (o.eyes || []).map(e => ({ ...e, color: [.85, .5, 1] })) }]
      : k === 'tail' ? [k, { ...o, fan: { ...o.fan, len: o.fan.len * 1.4, spread: 50 } }] : [k, o]) })
});
// ── Session 926: the troll (OG-041's cave troll, OG-088's mossy river troll; canon §9a puts cave trolls in Tine, Uisce and
// Cloch gates). The kit's first upright walker with hands: a hunched biped, the hips over its feet and the chest thrown forward
// over them, a shoulder hump, the head slung low in front, and arms long enough to reach its knees. One leg pair walks it (the
// gait engine's biped walk); the arms swing against the legs. Its hide is grey as stone with moss on what faces the sky.
// The scraps of armour lashed on (OG-041) wait for gear on a creature; the Tine and Uisce trolls of OG-018 are its recolours ──
Object.assign(PLANS, {
  troll: { name: 'Cave Troll', src: 'OG-041 (cave troll: hunched and huge, a stone-grey hide with moss and lichen, a wide fanged mouth), OG-088 (a mossy river troll)', gaits: ['walk', 'trot', 'stand'],
    rough: .9, mottle: 1.6, speedK: .8, wag: 0, pant: .04, neckNod: .05,
    palette: { coat: [.4, .4, .37], saddle: [.33, .34, .3], belly: [.5, .48, .44], moss: [.25, .33, .12], dark: [.06, .05, .05], horn: [.76, .7, .56], skin: [.36, .35, .32] },
    pattern: { kind: 'patches', tone: 'moss', size: .22, cut: .02, amount: .9, up: .15 },
    parts: [
      ['spine', { hip: [1.25, -.08], chest: [2.15, .26], n: 4, r: [.3, .4, .4], s: [1.2, 1], arch: .04, rump: .1, front: .08, frontDrop: .04, hump: { at: .85, up: .1, len: .3, r: .28 } }],
      ['neck', { len: .26, n: 1, rise: 0, r: [.2, .14], fwd: .12, up: -.02 }],
      ['head', { len: .42, r: .22, pitch: 10, s: [1.2, 1.05, 1], muzzle: { len: .88, r: .13, taper: .8, nose: 1, drop: .1 }, jaw: { len: .96, r: .14, drop: 1 },
        brow: { f: .42, up: .66, out: .5, r: .07 }, eyes: [{ f: .4, up: .45, out: .5, r: .022, color: [.75, .5, .12] }], ears: { kind: 'cone', size: .07, f: .12, up: .55, out: .95, back: 20, splay: 70, tone: 'skin' },
        horns: { len: .17, r: .03, f: .86, up: -.8, out: .6, turn: .4, rise: 1.2, spread: .15, back: -.2, out0: .1 } }],
      ['legs', { at: 0, kind: 'plantHind', out: .28, drop: .08, r: [.22, .17, .14], claws: { r: .02, len: .06 } }],
      ['arms', { at: 1, out: .5, up: -.1, len: 1.5, r: [.15, .13, .12], dir: [.25, -1, .05], bend: 18, tone: 'coat', claws: { r: .02, len: .09 }, swing: .28 }]
    ] }
});
Object.assign(PLANS, {
  // Cloch: the stone troll, fused with rock: the troll grown heavier, its hide gone to bare grey stone with the moss scoured off,
  // slabs of rock through its back and shoulders and on its crown, its arms thicker, violet in its cracks
  stonetroll: re(PLANS.troll, { name: 'Stone Troll', src: 'OG-088 (corrupted: a stone troll fused with rock)', school: 'Cloch', from: 'troll', scale: 1.12, rough: .95, mottle: 2.4, pattern: undefined,
    palette: { coat: [.48, .46, .44], saddle: [.4, .39, .37], belly: [.54, .52, .5], rock: [.56, .53, .49], dark: [.05, .04, .05], horn: [.5, .48, .45], skin: [.32, .31, .3] },
    glow: { color: [1.3, .45, 2.2], freq: 1.4, w: .012, all: .35 },
    parts: [...PLANS.troll.parts.map(([k, o]) => k === 'arms' ? [k, { ...o, r: o.r.map(v => v * 1.22), len: o.len * 1.05 }]
      : k === 'head' ? [k, { ...o, crystals: { n: 4, len: .2, r: .06, f: .3, up: .85, out: .4, rake: .5, stone: 1 }, eyes: o.eyes.map(e => ({ ...e, color: [.8, .45, 1] })) }]
      : k === 'spine' ? [k, { ...o, hump: { ...o.hump, up: .22, r: .38 } }] : [k, o]),
      ['spines', { n: 7, from: .1, to: 1, len: .28, r: .16, tone: 'rock', taper: .3, crystal: 2, stone: 1, dorsal: 1 }]] })
});
export const CORRUPTED = ['frostbear', 'blightboar', 'shadowstag', 'duskeagle', 'stonetroll'];
// ── Session 927: OG-018's trolls of the gates, the cave troll as each school's antibody wears it: recolours of one plan, as the
// sheet draws them (and the Cloch troll is the moss-backed troll itself). Tine's is basalt with forge-light in its cracks;
// Uisce's is drowned-pale, weed in its folds, its eyes gone to the sea's blue ──
Object.assign(PLANS, {
  tinetroll: re(PLANS.troll, { name: 'Cave Troll of Tine', src: 'OG-018 (Tine: a cave troll with glowing cracks)', school: 'Tine', from: 'troll', pattern: undefined, mottle: 2,
    palette: { coat: [.17, .15, .14], saddle: [.12, .11, .1], belly: [.22, .19, .17], dark: [.04, .03, .03], horn: [.4, .36, .3], skin: [.15, .13, .12] },
    glow: { color: [3.2, .8, .18], freq: 1.6, w: .016, all: .4 },
    parts: PLANS.troll.parts.map(([k, o]) => k === 'head' ? [k, { ...o, eyes: o.eyes.map(e => ({ ...e, color: [1, .45, .1] })) }] : [k, o]) }),
  uiscetroll: re(PLANS.troll, { name: 'Cave Troll of Uisce', src: 'OG-018 (Uisce: a pale cave troll of the drowned halls)', school: 'Uisce', from: 'troll', rough: .6,
    palette: { coat: [.66, .7, .7], saddle: [.56, .62, .63], belly: [.74, .77, .76], weed: [.16, .3, .24], dark: [.05, .06, .07], horn: [.7, .72, .66], skin: [.6, .64, .64] },
    pattern: { kind: 'patches', tone: 'weed', size: .12, cut: .32, amount: .7 },
    parts: PLANS.troll.parts.map(([k, o]) => k === 'head' ? [k, { ...o, eyes: o.eyes.map(e => ({ ...e, color: [.45, .75, .9] })) }] : [k, o]) })
});
export const TROLLS = ['troll', 'tinetroll', 'uiscetroll', 'stonetroll'];
// ── Session 928: the slime (OG-041: translucent pale green, arched like a wave, bones and rubble suspended inside; canon §9a
// puts slimes in Uisce gates, a magma one in Tine's). No legs and no head: a body that heaves along (the crawl, paced in body
// lengths), its crest rolled forward over its front like a wave about to break, clear enough to see what it has taken in ──
Object.assign(PLANS, {
  slime: { name: 'Slime', src: 'OG-041 (slime: translucent pale green, arched like a wave, bones and rubble suspended inside)', gaits: ['crawl', 'stand'], bl: .12, clear: .55, cell: .06, blend: .14, rough: .12, mottle: .5, wag: 0, pant: .05,
    palette: { coat: [.62, .78, .5], saddle: [.7, .84, .56], belly: [.45, .6, .36], bone: [.82, .78, .66], rubble: [.42, .4, .36], dark: [.08, .07, .06] },
    parts: [
      ['spine', { hip: [.32, -.55], chest: [.62, .3], n: 6, r: [.36, .52, .5, .3], s: [1.25, 1.05], arch: .14, rump: .3, rumpDrop: .2, rumpTaper: .7, front: .32, frontDrop: .42, frontTaper: .55 }],
      ['holes', { list: [{ at: .66, up: .22, r: .12, tilt: 5 }, { at: .3, up: -.1, r: .085, tilt: -4 }, { at: .14, up: .3, r: .06 }] }],
      ['inclusions', { n: { skull: 1, bone: 5, rubble: 7 }, size: .16, depth: .55 }]
    ] }
});
Object.assign(PLANS, {
  // Tine's (OG-018: "orange jelly with dark holes"): molten, less clear, lit from inside, carrying clinker instead of bones
  magmaslime: re(PLANS.slime, { name: 'Magma Slime', src: 'OG-018 (Tine: a magma slime, orange jelly with dark holes)', school: 'Tine', from: 'slime', clear: .8, cell: .06, blend: .14, rough: .3, mottle: 1.4, bl: .1,
    palette: { coat: [.6, .17, .03], saddle: [.32, .08, .02], belly: [.85, .36, .06], bone: [.3, .24, .2], rubble: [.08, .07, .06], dark: [.04, .03, .03] },
    glow: { color: [2.6, .7, .12], freq: 2.4, w: .06, all: .7, base: .2 },
    parts: PLANS.slime.parts.map(([k, o]) => k === 'inclusions' ? [k, { ...o, n: { rubble: 11 } }] : [k, o]) })
});
export const SLIMES = ['slime', 'magmaslime'];
// ── Session 955: the Winged Thing (OG-018's Gaoth row: "a feathered griffin-like beast"; canon §9a gives Gaoth "wisps, Gargoyle,
// something winged", and the Wisp is Session 783's). A big cat's body on four legs, an eagle's head and hooked beak on a short neck,
// feathered wings off the shoulders, a long tail ending in a fan of feathers. Pale storm-grey, barred darker, the beak and talons horn.
// It walks and trots on the ground and flies with the flap; nothing of it is new to the kit ──
Object.assign(PLANS, {
  wingedthing: { name: 'Winged Thing', src: 'OG-018 (Gaoth: a feathered griffin-like beast)', school: 'Gaoth', gaits: ['walk', 'trot', 'fly', 'stand'], speedK: 1.1, flyH: 1.4, cell: .05, finOpacity: 1, wingFold: 1.2, fold: 1.1, wag: .08, neckNod: .06, rough: .6, spread: .04,
    palette: { coat: [.66, .68, .7], saddle: [.42, .45, .5], belly: [.86, .86, .84], dark: [.05, .05, .06], horn: [.6, .52, .34], skin: [.5, .43, .28], feather: [.6, .63, .68], featherTip: [.18, .2, .26], covert: [.78, .8, .82] },
    pattern: { kind: 'stripes', period: .06, tone: 'saddle' }, fur: { len: .03, layers: 6, sx: 150, sy: 60 },
    parts: [
      ['spine', { hip: [1.02, -.68], chest: [1.12, .5], n: 4, r: [.27, .3, .34], s: [.82, 1.05], rump: .18, front: .24, frontDrop: .06, arch: .06 }],
      ['neck', { len: .56, n: 2, rise: 62, curve: -14, r: [.24, .14] }],
      ['head', { len: .38, r: .14, pitch: 4, eyes: [{ f: .45, up: .35, out: .72, r: .028, color: [.95, .72, .18] }], beak: { len: .22, r: .07, up: -.12, hook: .45 } }],
      ['tail', { len: 1.05, n: 4, r: [.09, .045], droop: 38, curl: -5, fan: { n: 5, len: .34, spread: 32 } }],
      ['legs', { at: 1, kind: 'talonFore', out: .16, drop: .08, r: [.14, .07, .038, .036], claws: { r: .022, len: .14, back: .7, hook: .45 } }],
      ['legs', { at: 0, kind: 'canidHind', out: .16, drop: .06, r: [.18, .1, .07, .06], claws: { r: .016, len: .06 } }],
      ['wings', { at: .82, out: .2, up: .26, span: 3.4, r: [.085, .062, .042], feathers: { ns: 9, np: 10, len: .4, primary: 1.05 } }]
    ] }
});
// ── Session 933: the goblin (OG-041: crouched, long ears, a long spear and a round hide shield). Canon §9a makes goblins no gate's
// antibody but a gate's occupiers: they hold a spent gate as a warren. The troll's frame, half its height and thin: the same
// hunched biped walk, the knees deep, the head big for the body and slung forward, ears long and swept out, the eyes large and
// yellow; it carries a spear in its right fist and a hide shield on its left forearm (the kit's first gear). The sheet's harness of
// scrap leather waits for straps on a creature ──
Object.assign(PLANS, {
  goblin: re(PLANS.troll, { name: 'Goblin', src: 'OG-041 (goblin: crouched, long ears, a long spear and a round hide shield, a scrap-leather harness)', occupier: 1, from: 'troll', scale: .5, finOpacity: 1,
    rough: .7, mottle: 1.1, speedK: 1.15, pant: .05, neckNod: .07, spread: .07,
    palette: { coat: [.44, .37, .25], saddle: [.33, .28, .18], belly: [.54, .46, .33], dark: [.06, .05, .04], horn: [.62, .56, .42], skin: [.46, .38, .27],
      wood: [.36, .26, .15], iron: [.32, .31, .3], hide: [.56, .43, .29], leather: [.22, .15, .09] },
    pattern: { kind: 'patches', tone: 'saddle', size: .3, cut: .25, amount: .5 },
    parts: [
      ['spine', { hip: [1.3, -.06], chest: [2.05, .3], n: 4, r: [.21, .24, .25], s: [1.15, .95], arch: .06, rump: .08, front: .05, frontDrop: .03, hump: { at: .85, up: .06, len: .24, r: .17 } }],
      ['neck', { len: .26, n: 1, rise: 10, r: [.11, .1], fwd: .08, up: 0 }],
      ['head', { len: .5, r: .27, pitch: 6, s: [1.1, 1, 1], muzzle: { len: .9, r: .12, taper: .5, nose: 1, drop: .22 }, jaw: { len: .88, r: .12, drop: .8 },
        brow: { f: .5, up: .62, out: .45, r: .06 }, eyes: [{ f: .52, up: .42, out: .48, r: .055, color: [.9, .75, .15] }],
        ears: { kind: 'cone', size: .5, f: .2, up: .5, out: .95, back: 25, splay: 72, tone: 'skin' }, fangs: { r: .02, len: .07, f: .9, up: -.75, out: .35 } }],
      ['legs', { at: 0, kind: 'plantHind', out: .22, drop: .06, r: [.15, .1, .09], claws: { r: .015, len: .06 } }],
      ['arms', { at: 1, out: .32, up: -.08, len: 1.25, r: [.085, .075, .07], dir: [.3, -1, .15], bend: 30, tone: 'coat', claws: { r: .014, len: .07 }, swing: .22 }],
      ['gear', { list: [
        { kind: 'spear', arm: 0, side: -1, len: 3.8, r: .03, head: .4, grip: .2, rise: 72, splay: .05 },
        { kind: 'shield', arm: 0, side: 1, r: .56, t: .05, face: [1, .7], off: .1, lace: 8, boss: 'iron' }] }],
      ['straps', { w: .1, tone: 'leather', straps: [
        { path: [[.12, 0], [.12, 90], [.12, 180], [.12, 270], [.12, 360]], closed: true, steps: 12 },
        { path: [[.92, -75], [.55, 0], [.18, 70], [.18, 110], [.55, 180], [.92, 255], [1, 280]], w: .09, steps: 10 },
        { path: [[.97, -120], [.97, -60]], w: .2, steps: 8, tone: 'hide' }] }]
    ] })
});
export const GOBLINS = ['goblin'];
// ── Session 956: the gargoyle (OG-018: a stone Gargoyle in Cloch's row, a wind-swept one in Gaoth's; canon §9a puts gargoyles in both,
// and the game's dormant Gargoyle is the foe it would replace). The goblin's crouched frame at five eighths of the troll's height, made of
// stone: no ears, a heavy brow, horns swept back from it, fangs, a long tail, a ridge of stone spines down the back and bat's wings of
// stone skin off the shoulders. It walks and trots crouched and beats its wings in `fly`. Gaoth's is the same body weathered pale by
// the wind, its moss scoured off, its horns laid flatter and its wings a quarter wider ──
Object.assign(PLANS, {
  gargoyle: re(PLANS.goblin, { name: 'Gargoyle', src: 'OG-018 (Cloch: a stone Gargoyle)', school: 'Cloch', from: 'goblin', occupier: undefined, scale: .62, gaits: ['walk', 'trot', 'fly', 'stand'],
    rough: .95, mottle: 2.2, speedK: .9, wag: .1, pant: 0, neckNod: .04, spread: .05, wingRest: [[.4, .9, 0], [0, 0, -1.6], [0, .5, .6], .2], fold: .7, finOpacity: 1, cell: .06,
    palette: { coat: [.44, .43, .41], saddle: [.36, .35, .34], belly: [.5, .49, .46], moss: [.24, .3, .14], dark: [.05, .05, .05], horn: [.36, .35, .33], skin: [.4, .39, .37], rock: [.47, .45, .42], membrane: [.38, .37, .35], membraneEdge: [.25, .24, .23] },
    pattern: { kind: 'patches', tone: 'moss', size: .2, cut: .1, amount: .5, up: .2 },
    parts: [
      ...PLANS.goblin.parts.filter(([k]) => !['gear', 'straps', 'head'].includes(k)),
      ['head', { len: .48, r: .26, pitch: 8, s: [1.1, 1, 1], muzzle: { len: .85, r: .13, taper: .6, nose: 1, drop: .15 }, jaw: { len: .85, r: .12, drop: .9 },
        brow: { f: .5, up: .66, out: .5, r: .08 }, eyes: [{ f: .52, up: .42, out: .48, r: .04, color: [.5, .48, .44] }], fangs: { r: .022, len: .08, f: .9, up: -.75, out: .35 },
        horns: { len: .45, r: .075, f: .15, up: .75, out: .5, turn: .3, rise: .8, back: .6, spread: .2 } }],
      ['tail', { len: 1.5, n: 5, r: [.11, .03], droop: 30, curl: 5 }],
      ['wings', { at: .85, out: .25, up: .3, span: 3.5, fingers: 4, r: [.08, .06, .04], sag: .2, tone: 'membrane' }],
      ['spines', { n: 8, from: .1, to: 1, len: .14, r: .06, tone: 'rock', taper: .4, stone: 1, dorsal: 1 }]
    ] })
});
Object.assign(PLANS, {
  gaothgargoyle: re(PLANS.gargoyle, { name: 'Gargoyle of Gaoth', src: 'OG-018 (Gaoth: a wind-swept Gargoyle)', school: 'Gaoth', from: 'gargoyle', scale: .62, rough: .8, mottle: 1.4, pattern: undefined, wingRest: PLANS.gargoyle.wingRest, cell: .06, spread: .05,
    palette: { coat: [.66, .66, .64], saddle: [.56, .57, .56], belly: [.74, .74, .71], dark: [.06, .06, .07], horn: [.52, .52, .5], skin: [.6, .6, .58], rock: [.68, .68, .66], membrane: [.6, .61, .6], membraneEdge: [.42, .43, .44] },
    parts: PLANS.gargoyle.parts.map(([k, o]) => k === 'wings' ? [k, { ...o, span: o.span * 1.25 }] : k === 'head' ? [k, { ...o, horns: { ...o.horns, back: 1.1, rise: .3, len: o.horns.len * 1.15 } }] : [k, o]) })
});
export const GARGOYLES = ['gargoyle', 'gaothgargoyle'];
// ── Session 934: the skeleton (OG-041: a notched sword and a round wooden shield, rags at the hips; canon §9a puts skeletons in Solas
// and Uisce gates, so OG-018's drowned skeleton is the next to follow). The kit's first bare body: an upright biped with a man's
// proportions whose capsules are drawn as bones (`bare`), a cage of ribs and a pelvis on its spine, a skull with dark sockets and a
// hinged jaw. It walks as the troll does, upright; the sheet's rags wait for cloth on a creature ──
Object.assign(PLANS, {
  skeleton: { name: 'Skeleton', src: 'OG-041 (skeleton: a notched sword and a round wooden shield, rags at the hips)', gaits: ['walk', 'trot', 'stand'], bare: { shaft: .3, knob: .48, vr: .34, vert: .045 },
    rough: .7, mottle: .9, speedK: .9, wag: 0, pant: 0, neckNod: .05, spread: .04,
    palette: { coat: [.78, .73, .6], dark: [.05, .04, .03], wood: [.38, .27, .16], iron: [.36, .35, .33], leather: [.2, .14, .09], cloth: [.36, .31, .24], clothTip: [.2, .17, .13] }, finOpacity: 1,
    parts: [
      ['spine', { hip: [.98, -.03], chest: [1.44, .01], n: 4, r: [.12, .13, .14], s: [1, 1], rump: 0, front: 0 }],
      ['neck', { len: .13, n: 1, rise: 80, r: [.06, .05], up: .02 }],
      ['head', { len: .2, r: .1, pitch: -8, s: [.85, 1.05, 1], muzzle: { len: .62, r: .06, taper: .85, drop: .45 }, jaw: { len: .62, r: .04, drop: 1.05 }, skull: true,
        eyes: [{ f: .55, up: .2, out: .42, r: .028, color: [.02, .02, .02] }] }],
      ['ribs', { n: 7, from: .3, to: 1, w: .15, d: .1, drop: .1, r: .011, wrap: .8, pelvis: { r: .11, out: .09, up: .02 } }],
      ['legs', { at: 0, kind: 'plantHind', out: .1, drop: .02, r: [.08, .065, .05] }],
      ['arms', { at: 1, out: .19, up: -.04, len: .7, r: [.055, .045, .04], dir: [.12, -1, .02], bend: 16, tone: 'coat', swing: .3 }],
      ['gear', { list: [
        { kind: 'sword', arm: 0, side: -1, len: .7, w: .05, rise: -40, splay: .1, notches: 5 },
        { kind: 'shield', arm: 0, side: 1, r: .3, t: .03, face: [1, .8], off: .04, tone: 'wood', rim: 'iron', boss: 'iron' }] }],
      ['rags', { n: 11, len: .3, w: .075, rx: .13, rz: .1, up: .03, gaps: .25, tone: 'cloth', tip: 'clothTip', cord: 'leather' }]
    ] }
});
// ── Session 935: OG-018's drowned skeleton, Uisce's (weed-hung, in a pair): the skeleton grey-green from the sea, its bones stained
// with weed, strands of it hanging from its skull, spine and arms (the kelpstrider's fronds, Session 863, hung down), its sockets lit
// the sea's blue, its sword rusted and its shield waterlogged ──
Object.assign(PLANS, {
  drownedskeleton: re(PLANS.skeleton, { name: 'Drowned Skeleton', src: 'OG-018 (Uisce: a drowned skeleton, weed-hung, in a pair)', school: 'Uisce', from: 'skeleton', bare: PLANS.skeleton.bare, speedK: .8, rough: .55, mottle: 1.6,
    palette: { coat: [.6, .64, .56], weed: [.16, .3, .2], frond: [.18, .32, .16], frondTip: [.34, .42, .2], dark: [.04, .05, .06], wood: [.22, .24, .2], iron: [.34, .27, .2], leather: [.12, .12, .1], cloth: [.2, .26, .2], clothTip: [.1, .16, .12] },
    pattern: { kind: 'patches', tone: 'weed', size: .06, cut: 0, amount: .9 }, finOpacity: .95,
    parts: [...PLANS.skeleton.parts.map(([k, o]) => k === 'head' ? [k, { ...o, eyes: o.eyes.map(e => ({ ...e, r: .02, color: [.35, .75, .95] })) }] : [k, o]),
      ['fronds', { on: ['head', 'neck', 'spine', 'arm0L_', 'arm0R_'], n: 36, len: .34, w: .04, out: .25, spread: .2, lift: -1.6, back: .15, tip: 'frondTip' }]] })
});
export const SKELETONS = ['skeleton', 'drownedskeleton'];
// ── Session 958: the Frost Thing, two ways (OG-018's Uisce row: "a crystalline ice-shard figure, all spikes"; canon §9a gives Uisce
// "frost things", and says a steady gate makes "the shapes the local folklore had words for"). The catalogue flags the sheet's figure as
// an elemental with no folk shape under the ice. Two plans for Michael to choose between (DECISION, decisions.md):
// A `frostshard`, the sheet's figure: the troll's hunched frame in clear blue ice, shards out of its crown and down its back, lit cold;
// B `frostfolk`, a folk shape under the ice: a man's frame (the skeleton's) grown whole and frozen, frosted white over blue, head bowed,
// shards breaking from his shoulders and crown, the eyes lit pale. The drowned of the Uisce halls, walking. Michael took B (DECISION #362);
// Session 968 gave him a face: the skeleton's skull inside his head (`skull.k` .85, in bone grey), under ice thinned to `faceClear` ──
Object.assign(PLANS, {
  frostshard: re(PLANS.troll, { name: 'Frost Thing (shards)', src: 'OG-018 (Uisce: a Frost Thing, a crystalline ice-shard figure, all spikes)', school: 'Uisce', from: 'troll', scale: .85, clear: .72, rough: .1, mottle: .6, pattern: undefined, finOpacity: 1,
    palette: { coat: [.6, .78, .92], saddle: [.45, .62, .8], belly: [.74, .86, .96], dark: [.04, .06, .1], horn: [.66, .86, 1], ice: [.72, .9, 1], skin: [.58, .74, .88] },
    glow: { color: [.5, 1.1, 2.4], freq: 2.2, w: .03, all: .3 },
    parts: [...PLANS.troll.parts.map(([k, o]) => k === 'head' ? [k, { ...o, ears: undefined, horns: undefined, brow: undefined, crystals: { n: 6, len: .42, r: .07, f: .3, up: .8, out: .3, rake: .4 }, eyes: o.eyes.map(e => ({ ...e, color: [.6, .9, 1] })) }]
      : k === 'arms' ? [k, { ...o, r: o.r.map(v => v * .8) }] : [k, o]),
      ['spines', { n: 10, from: .05, to: 1, len: .5, r: .08, tone: 'ice', taper: .3, crystal: 4, dorsal: 1 }]] }),
  frostfolk: re(PLANS.skeleton, { name: 'Frost Thing (the frozen)', src: 'OG-018 (Uisce: a Frost Thing), with a folk shape under the ice (canon §9a)', school: 'Uisce', from: 'skeleton', clear: .88, faceClear: .4, rough: .25, mottle: 1.2, finOpacity: 1, speedK: .7, cell: .028,
    palette: { coat: [.82, .88, .93], saddle: [.62, .74, .86], belly: [.88, .92, .96], dark: [.05, .07, .1], horn: [.7, .88, 1], ice: [.74, .9, 1], skin: [.8, .86, .92], bone: [.56, .57, .5] },
    glow: { color: [.45, .95, 2], freq: 1.6, w: .02, all: .22 },
    parts: [
      ...PLANS.skeleton.parts.filter(([k]) => ['spine', 'neck', 'legs', 'arms'].includes(k)).map(([k, o]) => k === 'spine' ? [k, { ...o, r: [.12, .125, .15], s: [1.15, .8] }] : k === 'neck' ? [k, { ...o, len: .16, r: [.055, .05] }] : k === 'arms' ? [k, { ...o, r: [.06, .05, .045], dir: [.1, -1, .12], bend: 22 }] : [k, o]),
      ['head', { len: .22, r: .108, pitch: 12, s: [.9, 1.08, 1], muzzle: { len: .42, r: .062, taper: .85, drop: .25 }, jaw: { len: .5, r: .048, drop: .85 }, skull: { k: .85, tone: 'bone' },
        eyes: [{ f: .55, up: .25, out: .42, r: .02, color: [.6, .92, 1] }], crystals: { n: 5, len: .16, r: .03, f: .2, up: .85, out: .25, rake: .5 } }],
      ['spines', { n: 6, from: .55, to: 1, len: .3, r: .05, tone: 'ice', taper: .2, crystal: 3, dorsal: 1 }]] })
});
export const FROST = ['frostshard', 'frostfolk'];
// ── Session 945: the cave troll's lashed-on armour (OG-041: scraps of plate and hide tied on with rope). Laid on its grown skin as the
// goblin's harness is (Session 944): a dented iron plate on its chest, an iron plate over its left shoulder, a rawhide sheet across its
// back, and three leather lashings over them, standing 1.2 cm further out. Only the OG-041 troll wears it: the trolls built from it
// (the stone troll, Tine's and Uisce's) copied its parts before this, and keep their bare hides ──
Object.assign(PLANS.troll.palette, { iron: [.3, .29, .28], ironDark: [.22, .2, .19], leather: [.24, .17, .11], hide: [.5, .4, .28] });
PLANS.troll.parts.push(['straps', { w: .08, tone: 'leather', straps: [
  { path: [[.6, -28], [.84, -28]], w: .34, steps: 6, tone: 'iron' },
  { path: [[.94, 62], [.94, 118]], w: .3, steps: 8, tone: 'ironDark' },
  { path: [[.42, 160], [.42, 200]], w: .4, steps: 6, tone: 'hide' },
  { path: [[.74, 0], [.74, 90], [.74, 180], [.74, 270], [.74, 360]], closed: true, steps: 12, lift: .012 },
  { path: [[.98, 90], [.66, 10], [.34, -60]], steps: 10, lift: .012 },
  { path: [[.36, 140], [.36, 220]], steps: 8, lift: .012 }] }]);
// ── Session 1107: Garrick's wolfhound (OG-065, "with a black wolfhound"; backlog L1 and L3). The first dog the kit has: a sighthound
// on the wolf's kit of parts, taller than the grey wolf and lighter in the loin, the chest deep and the belly tucked up, the head long
// and narrow with a long tapering muzzle and small ears folded back along the skull, the tail long and low with an upward sweep at its
// end, the coat rough and wiry (long, coarse, drooping shells). Black, as OG-065 draws it ──
Object.assign(PLANS, {
  wolfhound: { name: 'Black wolfhound', src: 'OG-065 (Garrick\'s black wolfhound)', gaits: ['trot', 'walk', 'gallop', 'stand', 'sit'], wag: .07, pant: .08, speedK: 1.15, rough: .6,
    palette: { coat: [.16, .15, .14], saddle: [.1, .095, .09], belly: [.22, .21, .2], dark: [.03, .025, .02], horn: [.7, .66, .6] },
    fur: { len: .05, layers: 10, sx: 120, sy: 32, droop: .3 },
    parts: [
      ['spine', { hip: [.86, -.42], chest: [.9, .36], n: 4, r: [.12, .11, .19], s: [.78, 1.25], rump: .11, rumpDrop: .02, front: .15, frontDrop: .09, arch: .05 }],
      ['neck', { len: .34, n: 2, rise: 40, r: [.12, .085], s: [.85, 1.1], fwd: .02, up: .04 }],
      ['head', { len: .4, r: .08, pitch: 10, s: [.85, .95, 1.15], muzzle: { len: 1, r: .045, nose: 1, drop: .03, taper: .6 }, jaw: { len: .85, r: .034, drop: .6 }, eyes: [{ f: .4, up: .38, out: .55, r: .013, color: [.22, .13, .06] }], ears: { kind: 'leaf', size: .075, f: .1, up: .8, out: .55, back: 70, splay: 30 } }],
      ['tail', { len: .58, n: 5, r: [.045, .04, .022], droop: 62, curl: 13, s: [1, 1] }],
      ['legs', { at: 1, kind: 'canidFore', out: .085, drop: .06, r: [.075, .04, .026, .022], claws: { r: .007, len: .022 } }],
      ['legs', { at: 0, kind: 'canidHind', out: .085, drop: .03, r: [.09, .048, .028, .023], claws: { r: .007, len: .022 } }]
    ] }
});
export const HOUNDS = ['wolfhound'];
