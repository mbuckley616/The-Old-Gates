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
  constructor(plan, g) { this.plan = plan; this.g = g; this.S = g.sliders.size; this.bones = []; this.by = {}; this.flesh = []; this.bits = []; this.legs = []; this.arms = []; this.wings = []; this.chains = {}; this.nGroup = 0; }
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
  B.neckEnd = pts[n]; B.neckBone = names[n - 1];
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
  for (const e of o.eyes || []) for (const sd of [1, -1]) B.bit('head', eye(e.r * S, e.color, at(e.f, e.up, e.out * sd)));
  if (o.ears) for (const sd of [1, -1]) B.bit('head', ear(o.ears, S, B.tone(o.ears.tone || o.tone || 'coat'), at(o.ears.f, o.ears.up, o.ears.out * sd), sd));
  if (o.horns) for (const sd of [1, -1]) B.bit('head', horn(o.horns, S, B.tone(o.horns.tone || 'horn'), at(o.horns.f, o.horns.up, o.horns.out * sd), sd));
  if (o.antlers) for (const sd of [1, -1]) B.bit('head', antler(o.antlers, S, B.tone('horn'), at(o.antlers.f, o.antlers.up, o.antlers.out * sd), sd, rng(B.g.seed + (sd > 0 ? 1 : 2))));
  if (o.crystals) for (const sd of [1, -1]) B.bit('head', crystals(o.crystals, S, B.tone('horn'), at(o.crystals.f, o.crystals.up, o.crystals.out * sd), sd, rng(B.g.seed + (sd > 0 ? 3 : 4))));
  if (o.beak) B.bit('head', beak(o.beak, S, B.tone('horn'), at(1, o.beak.up || 0, 0), dir));
  // a throat sac (the Bellthroat's): a rigid ball under the jaw that the pose fills and empties
  if (o.sac) { const m = new THREE.Mesh(new THREE.SphereGeometry(o.sac.r * S, 24, 16), new THREE.MeshPhysicalMaterial({ color: B.tone('sac'), roughness: .25, clearcoat: .6, transmission: 0 })); m.position.copy(at(o.sac.f, -o.sac.drop, 0)); m.scale.set(1.15, .8, 1); B.bit('head', m); B.sac = m; }
  if (o.stalks) for (const sd of [1, -1]) { const p = at(o.stalks.f, o.stalks.up, o.stalks.out * sd); B.bit('head', claw(o.stalks.r * .5, o.stalks.len, B.tone('dark'), p.clone().addScaledVector(up, -o.stalks.len), up.clone()));
    B.bit('head', eye(o.stalks.r, o.stalks.color, p)); }
  if (o.fangs) for (const sd of [1, -1]) B.bit('head', claw(o.fangs.r * S, o.fangs.len * S, B.tone('dark'), at(o.fangs.f, o.fangs.up, o.fangs.out * sd), V(0, -1, .4).normalize()));
};
// the tail: from the rump, n bones, starting at `droop` degrees below level and bending by `curl` a bone
P.tail = (B, o) => {
  const len = o.len * B.g.sliders.tail, n = o.n || 3, p0 = B.back.clone().add(V(0, o.up || 0, 0)), pts = [p0];
  for (let k = 0; k < n; k++) { const a = (-(o.droop || 0) + (o.curl || 0) * k) * DEG; pts.push(pts[k].clone().add(V(0, Math.sin(a), -Math.cos(a)).multiplyScalar(len / n))); }
  const names = B.chain('tail', B.spineNames[0], pts.slice(0, n));
  for (let k = 0; k < n; k++) B.meat(names[k], pts[k], pts[k + 1], along(o.r, k / n), along(o.r, (k + 1) / n), { s: [o.s?.[0] ?? 1, o.s?.[1] ?? 1, 1], group: 'tail', tone: o.tone });
  B.tailEnd = pts[n]; B.tailBone = names[n - 1];
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
      for (let c = -1; c <= 1; c++) B.bit(names[J.length - 1], claw(o.claws.r, o.claws.len, B.tone('dark'), tip.clone().add(V(c * o.claws.r * 2.2, o.claws.r * .8, 0)), d.clone().add(V(c * .15, 0, 0)).normalize())); }
    B.legs.push({ names, J, side, at: o.at, pre, hR, ik: pre.ik, yaw: !!pre.yaw, fan, wobble: o.wobble || 0 });
  }
};
// arms: hang from a socket (the shoulders, or a seam on the back), swing against the legs; no feet to plant
P.arms = (B, o) => {
  const sp = B.spineAt(o.at), len = o.len, d = (o.dir || [0, -1, .2]);
  for (const side of [1, -1]) {
    const root = sp.p.clone().add(V(side * o.out, o.up || 0, o.dz || 0)), dir = V(side * d[0], d[1], d[2]).normalize();
    const elbow = root.clone().addScaledVector(dir, len * .5), d2 = o.dir2 ? V(side * o.dir2[0], o.dir2[1], o.dir2[2]).normalize() : dir.clone().applyAxisAngle(V(1, 0, 0), -(o.bend || 30) * DEG).normalize(), wrist = elbow.clone().addScaledVector(d2, len * .42), hand = wrist.clone().addScaledVector(d2, len * .14);
    const tag = 'arm' + (B.arms.length / 2 | 0) + (side > 0 ? 'L' : 'R'), names = B.chain(tag + '_', sp.bone, [root, elbow, wrist, hand]);
    const r = o.r; B.meat(names[0], root, elbow, r[0], r[1], { group: tag, tone: o.tone }); B.meat(names[1], elbow, wrist, r[1], r[2], { group: tag, tone: o.tone }); B.meat(names[2], wrist, hand, r[2], r[2] * .7, { group: tag, tone: o.tone });
    if (o.claws) for (let c = -1; c <= 1; c++) B.bit(names[3], claw(o.claws.r, o.claws.len, B.tone('dark'), hand.clone().add(V(c * o.claws.r * 2, 0, 0)), d2.clone().add(V(c * .2, 0, 0)).normalize()));
    // a pincer (Session 773): a swollen hand and two fingers, the fixed one longer
    if (o.chela) { const c = o.chela; B.meat(names[2], wrist.clone().addScaledVector(d2, -len * .04), hand, c.r, c.r * .8, { s: [1, .62, 1], tone: o.tone, group: tag + 'c' });
      const fx = d2.clone().add(V(-side * .25, 0, 0)).normalize(), mv = d2.clone().add(V(side * .3, .1, 0)).normalize();
      B.bit(names[3], claw(c.r * .45, c.len * 1.15, B.tone(c.tone || 'dark'), hand.clone().add(V(-side * c.r * .35, 0, 0)), fx));
      B.bit(names[3], claw(c.r * .4, c.len, B.tone(c.tone || 'dark'), hand.clone().add(V(side * c.r * .35, c.r * .15, 0)), mv)); }
    B.arms.push({ names, side, phase: o.phase || 0, swing: o.swing ?? .5 });
  }
};
// wings: an arm (humerus, forearm) and a fan of two-bone fingers; the membrane between them is its own skinned mesh
P.wings = (B, o) => {
  const sp = B.spineAt(o.at), span = o.span;
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
// a saddle on the back (Session 773): a socket's first rider. A leather seat over a wool blanket, both draped over the spine
P.saddle = (B, o) => { const sp = B.spineAt(o.at), fl = (B.plan.fur?.len || 0) * .8, R = sp.r * B.spineS[0] + fl, Ry = sp.r * B.spineS[1] + fl; // it sits on the fur, not under it
  const drape = (r, ry, len, th, c) => { const g = new THREE.CylinderGeometry(1, 1, len, 24, 1, true, Math.PI / 2 - th / 2, th); g.rotateZ(Math.PI / 2); g.rotateY(Math.PI / 2); g.scale(r, ry, 1); const m = new THREE.Mesh(g, stdMat(c, { rough: .8 })); m.material.side = THREE.DoubleSide; m.position.copy(sp.p); return m; };
  B.bit(sp.bone, drape(R * 1.06, Ry * 1.06, o.len * 1.25, 2.3, B.tone('blanket'))); B.bit(sp.bone, drape(R * 1.09, Ry * 1.09, o.len, 1.6, B.tone('leather')));
  const horn = new THREE.Mesh(new THREE.CylinderGeometry(o.len * .05, o.len * .07, o.len * .22, 10), stdMat(B.tone('leather'), { rough: .6 })); horn.position.copy(sp.p).add(V(0, Ry * 1.12, o.len * .42)); B.bit(sp.bone, horn); };
P.spines = (B, o) => { for (let k = 0; k < o.n; k++) { const t = lerp(o.from, o.to, k / (o.n - 1)), sp = B.spineAt(t), h = o.len * (1 - .5 * Math.abs(k / (o.n - 1) - .5) * 2 * (o.taper ?? .5));
  B.bit(sp.bone, claw(o.r, h, B.tone(o.tone || 'dark'), sp.p.clone().add(V(0, sp.r * B.spineS[1] * .85, 0)), V(0, 1, -.35).normalize())); } };

// ── bits: small rigid meshes ──
const MATS = new Map();
function stdMat(c, o = {}) { const k = c.getHexString() + JSON.stringify(o); if (!MATS.has(k)) MATS.set(k, new THREE.MeshStandardMaterial({ color: c, roughness: o.rough ?? .6, metalness: 0, flatShading: !!o.flat, emissive: o.emissive || 0x000000, emissiveIntensity: o.ei ?? 1 })); return MATS.get(k); }
function ball(r, c, p, rough = .5) { const m = new THREE.Mesh(new THREE.SphereGeometry(r, 16, 12), stdMat(c, { rough })); m.position.copy(p); return m; }
function eye(r, color, p) { const m = new THREE.Mesh(new THREE.SphereGeometry(r, 16, 12), new THREE.MeshPhysicalMaterial({ color: new THREE.Color().setRGB(...color, THREE.SRGBColorSpace), roughness: .05, clearcoat: 1, emissive: new THREE.Color().setRGB(...color, THREE.SRGBColorSpace).multiplyScalar(.12) })); m.position.copy(p); return m; }
function claw(r, len, c, p, dir) { const g = new THREE.ConeGeometry(r, len, 7); g.translate(0, len / 2, 0); const m = new THREE.Mesh(g, stdMat(c, { rough: .4 })); m.position.copy(p); m.quaternion.setFromUnitVectors(UP, dir.clone().normalize()); return m; }
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
  const geos = [], L = o.len * S;
  const grow = (start, dir, len, rad, depth) => { const pts = [start.clone()]; let d = dir.clone(); const n = 5;
    for (let i = 1; i <= n; i++) { d.add(V(0, .08, -.04)).add(V((r() - .5) * .25, (r() - .5) * .15, (r() - .5) * .25)).normalize(); pts.push(pts[i - 1].clone().addScaledVector(d, len / n)); }
    geos.push(taperTube(pts, rad, rad * .3, 7));
    if (depth > 0) for (let i = 1; i < n; i++) if (r() < (depth > 1 ? .75 : .45)) { const td = V(side * (r() - .3) * .6, .8, .55 + r() * .4).normalize(); grow(pts[i], td, len * (.32 + r() * .2), rad * .55, depth - 1); } };
  grow(V(), V(side * .55, .7, -.15).normalize(), L, o.r * S, o.depth ?? 2);
  const m = new THREE.Mesh(mergeGeometries(geos), stdMat(c, { rough: .75 })); m.position.copy(p); return m;
}
// crystal horns: layered shards sweeping back from the brow (the Shatterhorn, OG-040)
function crystals(o, S, c, p, side, r) {
  const geos = []; for (let i = 0; i < o.n; i++) { const L = o.len * S * (1 - .55 * i / o.n) * (.8 + r() * .3), g = new THREE.ConeGeometry(o.r * S * (1 - .4 * i / o.n), L, 5); g.translate(0, L / 2, 0);
    g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(UP, V(side * (.35 + .5 * r()), .5 + .4 * r() - .25 * i / o.n, -.5 - .4 * i / o.n).normalize()));
    g.translate(side * i * o.r * S * .6, -i * o.r * S * .3, -i * o.r * S * .9); geos.push(g.toNonIndexed()); }
  const m = new THREE.Mesh(mergeGeometries(geos), new THREE.MeshPhysicalMaterial({ color: c, roughness: .15, metalness: 0, flatShading: true, emissive: c.clone().multiplyScalar(.25), clearcoat: 1, transparent: true, opacity: .92 })); m.position.copy(p); return m;
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
function dressFlesh(geo, B, pal, plan) {
  const pos = geo.attributes.position, nrm = geo.attributes.normal, n = pos.count;
  const si = new Uint16Array(n * 4), sw = new Float32Array(n * 4), col = new Float32Array(n * 3), fur = new Float32Array(n), glow = new Float32Array(n);
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
    const mott = 1 + (PN.noise(x * 4.1, y * 4.1, z * 4.1) * .16 + PN.noise(x * 17, y * 17, z * 17) * .06) * (plan.mottle ?? 1); C.multiplyScalar(mott);
    col[v * 3] = C.r; col[v * 3 + 1] = C.g; col[v * 3 + 2] = C.b; fur[v] = furry;
    // the binding's seams: a crack pattern along the line `glow.line` (the spine's seam) or over the whole hide
    if (gl) { const cr = Math.abs(PN.noise(x * gl.freq, y * gl.freq, z * gl.freq * .6)), seam = gl.seam ? sstep(gl.seam.w, 0, Math.abs(x)) * sstep(gl.seam.y0, gl.seam.y0 + .08, y) * (ny > .2 ? 1 : 0) : 0;
      glow[v] = Math.max(seam, sstep(gl.w, 0, cr) * (gl.all || 0)); }
  }
  geo.setAttribute('skinIndex', new THREE.Uint16BufferAttribute(si, 4)); geo.setAttribute('skinWeight', new THREE.Float32BufferAttribute(sw, 4));
  geo.setAttribute('color', new THREE.Float32BufferAttribute(col, 3)); geo.setAttribute('aFur', new THREE.Float32BufferAttribute(fur, 1)); geo.setAttribute('aGlow', new THREE.Float32BufferAttribute(glow, 1));
}

// ── materials: the hide, fur shells (cut by noise, as the people's mantles are), and the binding's glow ──
const GLOW_HEAD = 'attribute float aGlow; attribute float aFur; varying float vGlow; varying float vFur; varying vec3 vRP;\n';
function hideMat(o) {
  const m = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: o.rough ?? .85, metalness: 0 });
  m.onBeforeCompile = s => { s.uniforms.uGlow = { value: new THREE.Color(...(o.glow || [0, 0, 0])) };
    s.vertexShader = GLOW_HEAD + s.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\n vGlow = aGlow; vFur = aFur; vRP = position;');
    s.fragmentShader = 'uniform vec3 uGlow; varying float vGlow; varying float vFur; varying vec3 vRP;\n' + s.fragmentShader.replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\n totalEmissiveRadiance += uGlow * vGlow;'); };
  m.customProgramCacheKey = () => 'hide' + JSON.stringify(o.glow || 0); return m;
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
  return { plan, seed, sliders: { ...sliders, ...(over.sliders || {}) }, tint: over.tint ?? q((r() - .5) * .1), light: over.light ?? q((r() - .5) * .14) };
}

// ── build: run the plan's parts, grow the flesh, bind it to the skeleton ──
export function build(g) {
  const plan = PLANS[g.plan], t0 = performance.now(), pal = {};
  for (const [k, c] of Object.entries(plan.palette)) { const C = new THREE.Color().setRGB(...c, THREE.SRGBColorSpace), hsl = {}; C.getHSL(hsl); C.setHSL((hsl.h + g.tint + 1) % 1, hsl.s, Math.max(0, Math.min(1, hsl.l * (1 + g.light)))); pal[k] = C; }
  const sg = { ...g, sliders: { ...g.sliders, size: 1 } }; // parts build at size 1; the size slider scales the finished body
  const B = new Body(plan, sg); B.tone = t => pal[t] || pal.coat;
  for (const [part, o] of plan.parts) P[part](B, o);
  const minR = Math.min(...B.flesh.map(c => Math.min(c.ra, c.rb) * Math.min(...c.s)));
  const ext = B.flesh.reduce((m, c) => Math.max(m, Math.abs(c.a.z), Math.abs(c.b.z), Math.abs(c.a.x), Math.abs(c.b.x), c.a.y, c.b.y), 0) * 2;
  const cell = plan.cell ?? Math.max(minR * .7, ext / 240), blend = plan.blend ?? Math.max(cell * 1.2, .25 * minR);
  const { geo, grid } = growFlesh(B.flesh, { cell, blend });
  dressFlesh(geo, B, pal, plan);
  // the skeleton
  const root = new THREE.Group(), bones = B.bones.map(b => { const o = new THREE.Bone(); o.name = b.name; o.position.copy(b.parent ? b.p.clone().sub(b.parent.p) : b.p); return o; });
  B.bones.forEach((b, i) => { if (b.parent) bones[b.parent.i].add(bones[i]); }); const rig = new THREE.Group(); rig.add(bones[0]); root.add(rig); rig.updateMatrixWorld(true);
  const skel = new THREE.Skeleton(bones), meshes = [];
  const hide = new THREE.SkinnedMesh(geo, hideMat({ glow: plan.glow?.color, rough: plan.rough })); hide.castShadow = true; hide.name = 'hide'; meshes.push(hide);
  if (plan.fur) for (let k = 1; k <= plan.fur.layers; k++) { const fg = geo.clone(); fg.setAttribute('aBase', new THREE.BufferAttribute(geo.attributes.position.array.slice(), 3)); const p = fg.attributes.position, nm = fg.attributes.normal, fa = fg.attributes.aFur, d = plan.fur.len * k / plan.fur.layers;
    for (let v = 0; v < p.count; v++) { const e = d * fa.getX(v); p.setXYZ(v, p.getX(v) + nm.getX(v) * e, p.getY(v) + nm.getY(v) * e + (plan.fur.droop || 0) * -e * e / plan.fur.len, p.getZ(v) + nm.getZ(v) * e); }
    const m = new THREE.SkinnedMesh(fg, furMat(plan.fur, k, plan.fur.layers)); m.castShadow = k < 3; m.name = 'fur' + k; meshes.push(m); }
  for (const w of B.wings) { const m = new THREE.SkinnedMesh(wingGeo(B, w, pal), new THREE.MeshStandardMaterial({ vertexColors: true, side: THREE.DoubleSide, roughness: .75 })); m.castShadow = true; m.name = 'wing'; meshes.push(m); }
  for (const m of meshes) { rig.add(m); m.bind(skel); m.frustumCulled = false; m.receiveShadow = true; }
  for (const { bone, obj } of B.bits) { const b = B.by[bone]; obj.position.sub(b.p); obj.castShadow = true; bones[b.i].add(obj); }
  rig.scale.setScalar(g.sliders.size * (plan.scale || 1)); // a plan may stand at a multiple of its parts (the post hare is a hare at 5.5)
  const C = { g, plan, B, root, rig, bones, byName: Object.fromEntries(bones.map(b => [b.name, b])), skel, meshes, phase: 0, gait: plan.gaits[0], stats: { bones: bones.length, tris: geo.index.count / 3, verts: geo.attributes.position.count, grid: grid.join('x'), cell: +cell.toFixed(3), ms: Math.round(performance.now() - t0) } };
  for (const L of B.legs) { L.bones = L.names.map(n => C.byName[n]); L.restLocal = L.bones[0].position.clone(); L.rest = L.J.map(p => p.clone()); L.dirs = L.J.slice(1).map((p, k) => p.clone().sub(L.J[k]).normalize()); L.lens = L.J.slice(1).map((p, k) => p.distanceTo(L.J[k]));
    // the knee's side of the line from the solved chain's root to its end: the way this leg bends
    const a = L.J[L.ik], b = L.J[L.ik + 2], u = b.clone().sub(a).normalize(), kn = L.J[L.ik + 1].clone().sub(a); L.pole = kn.sub(u.clone().multiplyScalar(kn.dot(u))).normalize(); if (!isFinite(L.pole.x) || L.pole.lengthSq() < .5) L.pole = V(0, 0, 1); }
  C.legH = Math.max(.1, ...B.legs.map(L => L.hR)) || .3; C.S = g.sliders.size * (plan.scale || 1); C.air = {}; C.sac = B.sac;
  const hd = (plan.heading || 0) * DEG; C.dir = V(Math.sin(hd), 0, Math.cos(hd)); // the way it walks in its own frame: a crab goes sideways
  return C;
}
// the wing's membrane: panels between neighbouring fingers and from the last finger back to the flank, skinned to both edges
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
  fly: { duty: 1, fr: 0, flap: 1, phase: () => 0 }
};
const _q = new THREE.Quaternion(), _q2 = new THREE.Quaternion(), _v = V(), _m = new THREE.Matrix4();
// a bone's rotation and position in the rig's frame (the body's own space: the ground is y = 0)
function rigQuat(C, bone, out) { out.identity(); for (let b = bone; b && b !== C.rig; b = b.parent) out.premultiply(b.quaternion); return out; }
function rigPos(C, bone, out) { bone.getWorldPosition(out); return C.rig.worldToLocal(out); }
export function speedOf(C, gait = C.gait) { const G = GAITS[gait]; return Math.sqrt(G.fr * 9.81 * C.legH * C.S) * (C.plan.speedK ?? 1); }
// one stride in the body's own metres (the world's is this times C.S); a stride grows with the Froude number
const strideBody = (C, G) => 1.6 * Math.pow(Math.max(G.fr, .05), .3) * C.legH * (G.strideK || 1);
// how far a foot sweeps while it is down: the stride's share, but a leaper's stance is short and its flight long
const sweepOf = (C, G) => Math.min(strideBody(C, G) * G.duty, G.pulse ? .9 * C.legH : 1e9);
export function strideOf(C, gait = C.gait) { return strideBody(C, GAITS[gait]) * C.S; }
// the distance the body has covered by a phase, in world metres: even for most gaits; a pulse covers the stance's sweep, then flies
function travel(C, phase) { const G = GAITS[C.gait], k = Math.floor(phase), f = phase - k, L = strideOf(C);
  if (!G.pulse) return phase * L; const sw = sweepOf(C, G) * C.S; return k * L + (f < G.duty ? sw * f / G.duty : sw + (L - sw) * (f - G.duty) / (1 - G.duty)); }
// advance a creature's gait by dt seconds. C.moved is how far its root should go along C.dir this step. Returns the worst foot error.
export function step(C, dt) { const G = GAITS[C.gait], p0 = C.phase; C.phase += G.fr > 0 ? dt * speedOf(C) / strideOf(C) : dt * (G.flap ? .9 : .25); C.moved = G.fr > 0 ? travel(C, C.phase) - travel(C, p0) : 0; return pose(C, C.phase); }
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
export function pose(C, phase) {
  const G = GAITS[C.gait], B = C.B, n = B.legs.length / 2, tau = Math.PI * 2, ph = phase - Math.floor(phase);
  for (const b of C.bones) b.quaternion.identity();
  const sp = C.byName.spine0, rest = B.bones[0].p; sp.position.copy(rest);
  // the body: a bob twice a stride, a roll and a sway once, the gallop's flex; the neck nods against the bob, the tail swings behind
  const bob = (G.bob || 0) * C.legH * Math.cos(tau * ph * 2), breathe = .006 * Math.sin(tau * ph);
  const air = liftAt(flights(C, G), ph);
  sp.position.y += -bob * .5 + air + (G.duty === 1 && !G.wave ? breathe * C.legH : 0);
  if (C.sac) { const s = 1 + .45 * Math.max(0, Math.sin(tau * (G.fr > 0 ? ph : ph * 3))) ** 2; C.sac.scale.set(1.15 * s, .8 * s, s); }
  sp.rotation.set((G.flex || 0) * Math.sin(tau * ph) * .4, (G.sway || 0) * Math.sin(tau * ph), (G.sway || 0) * .5 * Math.sin(tau * ph + 1));
  const spn = B.spineNames; for (let k = 1; k < spn.length; k++) C.byName[spn[k]].rotation.set(-(G.flex || 0) * Math.sin(tau * ph) / spn.length, -(G.sway || 0) * Math.sin(tau * ph - k * .4) / spn.length, 0);
  if (B.chains.neck) B.chains.neck.forEach((nm, k) => C.byName[nm].rotation.set(bob * .4 / C.legH + (C.plan.neckNod ?? .03) * Math.sin(tau * ph * 2 + 1) / B.chains.neck.length, (G.sway || 0) * -.5 * Math.sin(tau * ph) / B.chains.neck.length, 0));
  if (B.chains.tail) B.chains.tail.forEach((nm, k) => C.byName[nm].rotation.set(.04 * Math.sin(tau * ph * 2 - k * .6), (C.plan.wag ?? .12) * Math.sin(tau * ph - k * .7), 0));
  if (C.byName.jaw) C.byName.jaw.rotation.x = (C.plan.pant ?? .04) * (1 + Math.sin(tau * ph * 2));
  // a serpent moves by a wave that runs from its head to its tail
  if (G.wave) { const all = [...spn.slice().reverse(), ...(B.chains.tail || [])]; all.forEach((nm, k) => { C.byName[nm].rotation.y += (C.plan.waveAmp ?? .35) * Math.sin(tau * (ph * 1 - k / (C.plan.waveLen ?? 8))) * (k ? 1 : .3); }); }
  // arms swing against the legs; wings rest half-folded, breathing, or beat
  for (const A of B.arms) { const s = A.swing * Math.sin(tau * ph + (A.side > 0 ? 0 : Math.PI) + A.phase); C.byName[A.names[0]].rotation.set(s, 0, 0); C.byName[A.names[1]].rotation.set(-Math.abs(s) * .6 - .2, 0, 0); C.byName[A.names[2]].rotation.set(.25 * Math.sin(tau * ph * 2 + A.side), 0, 0); }
  for (const W of B.wings) { const flap = G.flap ? Math.sin(tau * ph) : 0, fold = G.flap ? 0 : (C.plan.wingFold ?? .5);
    C.byName[W.arm[0]].rotation.set(-.15 * fold, -W.side * .7 * fold, W.side * (.5 * flap - .35 * fold + .03 * Math.sin(tau * ph * .5)));
    C.byName[W.arm[1]].rotation.set(0, W.side * 1.1 * fold, W.side * -.3 * flap); C.byName[W.arm[2]].rotation.set(0, -W.side * .9 * fold, W.side * -.2 * flap);
    W.fingers.forEach((f, k) => C.byName[f[0]].rotation.set(0, W.side * (k / W.fingers.length) * .4 * fold, 0)); }
  C.rig.updateMatrixWorld(true);
  // the legs: the foot's target from the gait, then IK
  const sweep = sweepOf(C, G), D = C.dir;
  let worst = 0; const order = [...new Set(B.legs.map(L => L.at))].sort((a, b) => b - a);
  for (const L of B.legs) {
    const p = order.indexOf(L.at), s = L.side > 0 ? 0 : 1, F0 = L.rest[L.rest.length - 1];
    let fl = ph + G.phase(p, s, n) + L.wobble; fl -= Math.floor(fl);
    const T = F0.clone(); let fold = 0;
    if (G.fr > 0 && !G.wave) { if (fl < G.duty) T.addScaledVector(D, sweep * (.5 - fl / G.duty)); else { const u = (fl - G.duty) / (1 - G.duty), e = u * u * (3 - 2 * u); T.addScaledVector(D, sweep * (-.5 + e)); T.y += (G.lift || .15) * L.hR * Math.sin(Math.PI * u) + air; fold = (C.plan.fold ?? .9) * Math.sin(Math.PI * u); } }
    worst = Math.max(worst, solveLeg(C, L, T, fold));
  }
  return worst;
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
    palette: { coat: [.12, .1, .09], pale: [.76, .73, .63], dark: [.03, .02, .02], skin: [.12, .1, .09] },
    parts: [
      ['spine', { hip: [.62, -.12], chest: [.62, .26], n: 3, r: [.17, .2, .17], s: [1.1, .62], rump: .02, front: .1, tone: 'skin' }],
      ['head', { len: .16, r: .1, pitch: 10, s: [1.1, .7, 1], tone: 'skin', eyes: [{ f: .65, up: .7, out: .3, r: .02, color: [.85, .05, .03] }, { f: .55, up: .85, out: .55, r: .014, color: [.85, .05, .03] }, { f: .45, up: .95, out: .2, r: .012, color: [.85, .05, .03] }], fangs: { r: .02, len: .1, f: .95, up: -.4, out: .3 } }],
      ['tail', { len: .85, n: 2, r: [.32, .42, .2], droop: -20, s: [1, .85], tone: 'pale' }],
      ['legs', { at: 1, kind: 'insect', out: .12, drop: -.02, fan: 55, reach: 1.25, r: [.05, .045, .035, .02] }],
      ['legs', { at: .72, kind: 'insect', out: .14, drop: -.02, fan: 20, reach: 1.15, r: [.05, .045, .035, .02] }],
      ['legs', { at: .42, kind: 'insect', out: .14, drop: -.02, fan: -18, reach: 1.1, r: [.05, .045, .035, .02] }],
      ['legs', { at: .12, kind: 'insect', out: .12, drop: -.02, fan: -50, reach: 1.25, r: [.05, .045, .035, .02] }]
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
    ] }
};
// the post hare is the Snowleap Hare's body at five and a half times its size, saddled
PLANS.posthare.parts = [...PLANS.snowhare.parts, ['saddle', { at: .55, len: .14 }]];
