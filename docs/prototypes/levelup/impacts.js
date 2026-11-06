// Impact by surface (the concept artist, 6 Nov 2026; backlog L, "Melee, read clearly"; OG-127): what a blow throws off where it lands, by
// what it lands on. One unit is one metre, one second is one second.
//
// OG-127 asks for "sparks on armour, splinters on shields, blood on flesh, dust on stone". The game has none of it: a landed blow plays
// its sound (sndHitEnemy) and puts its number over the head (dmgNum, #198 A), and nothing comes off the thing that was hit. The question
// is how loud the thing that comes off should be (IMPACT_LEVELS):
//   'quiet' (A) true to the size of things: a dozen short sparks off mail, a few thumb-sized splinters, a breath of grit off stone, a
//               puff of the cloth's own fibre off a tunic and no blood. No light, no hold.
//   'clear' (B) the same things a size up and lit so they read at a third-person camera's distance (3 to 5 m): forty sparks and a warm
//               flash that lights the two bodies for 80 ms, a dozen splinters and a pale gouge left in the shield's paint, a puff
//               of dust that hangs for half a second and a pale scar left on the stone, a few dark drops and a dark nick in the cloth.
//               The frame holds 50 ms on contact (a hit-stop: a pause of the picture, not a window; nothing waits on it).
//   'loud'  (C) OG-127 as drawn: fans of sparks a metre long, a white star at the point, splinters to 12 cm, a cloud of dust, a bright
//               red spray and mist; a 90 ms hold and a 6 cm shake of the camera.
//
// impact(surface, level, o) returns a Group at the point of contact: o.at (where the edge met the thing, world), o.n (the surface's
// normal, toward the striker), o.cut (the edge's travel, along the surface), o.t (seconds since contact), o.seed, o.tint (the cloth or
// paint's colour, for fibres and the gouge's edge). Everything in it is placed for time t from a seeded stream, so a still is the same
// twice and the builder can drive it from a clock (the co-op rule: read the clock, not the frame). Cosmetic rolls, as the rule allows.
import * as THREE from 'three';
import { puffTex } from './common.js';

export const IMPACT_SURFACES = { steel: 'mail and plate: sparks', wood: 'a shield: splinters', stone: 'stone: dust and chips', flesh: 'cloth and flesh' };
export const IMPACT_LEVELS = { quiet: 'A, quiet: true to the size of things', clear: 'B, clear: a size up and lit, a 50 ms hold', loud: 'C, loud: OG-127 as drawn, a 90 ms hold and a shake' };
export const LEVEL_OF = { a: 'quiet', b: 'clear', c: 'loud' };
// what the camera does with each level (the builder's numbers; a still cannot show them)
export const HOLD = { quiet: { stop: 0, shake: 0 }, clear: { stop: .05, shake: 0 }, loud: { stop: .09, shake: .06 } };

const V = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
const G = V(0, -9.8, 0);
const pick = (lv, a, b, c) => lv === 'quiet' ? a : lv === 'clear' ? b : c;
function stream(seed) { let s = 0; for (const ch of String(seed)) s = (s * 31 + ch.charCodeAt(0)) % 2147483647; s = s || 7; return () => (s = (s * 16807) % 2147483647) / 2147483647; }
// a direction about `axis`, spread by `k` (0 a line, 1 a hemisphere and more)
function spray(r, axis, k) { return axis.clone().add(V(r() * 2 - 1, r() * 2 - 1, r() * 2 - 1).multiplyScalar(k)).normalize(); }
// where a thing thrown from p at v is after t, with air drag k (1/s; dust has a lot, a spark a little) and gravity scaled by gk
function at(p, v, t, k = 0, gk = 1) { const f = k ? (1 - Math.exp(-k * t)) / k : t; return p.clone().addScaledVector(v, f).addScaledVector(G, .5 * t * t * gk); }
function count(g) { let t = 0; g.traverse(o => { if (o.isMesh || o.isLineSegments) { const gg = o.geometry, n = (gg.index ? gg.index.count : gg.attributes.position.count) / (o.isLineSegments ? 2 : 3); t += o.isInstancedMesh ? n * o.count : o.isLineSegments ? 0 : n; } }); return t; }

// ——— sparks: hot streaks, each drawn from where it was 12 to 22 ms ago to where it is (a camera's smear), white-yellow when new and
// orange-red as it cools, gone at its own life
function sparks(G0, r, o, n, sp, life, smear, axis, k) {
  const P = [], C = [];
  for (let i = 0; i < n; i++) { const d = spray(r, axis, k), v = d.multiplyScalar(sp[0] + r() * (sp[1] - sp[0])), L = life * (.35 + r() * .65), t = o.t * (.85 + r() * .3);
    if (t > L) continue; const a = Math.max(0, t - smear), p0 = at(V(), v, a, 1.5, .6), p1 = at(V(), v, t, 1.5, .6), age = t / L, hot = 1 - age;
    P.push(...p0.toArray(), ...p1.toArray()); C.push(1.2 * hot + .5, .55 * hot + .18, .12 * hot + .02, 2.2 * hot + .8, 1.6 * hot + .3, .7 * hot + .05); }
  if (!P.length) return 0; const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(C, 3));
  G0.add(new THREE.LineSegments(g, new THREE.LineBasicMaterial({ vertexColors: true, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false }))); return P.length / 6; }
// ——— bits: splinters (long thin boxes, along their flight, turning), chips of stone (small rough stones), drops (spheres drawn out along
// their speed); one InstancedMesh each
function bits(G0, r, o, kind, n, sp, size, axis, k, colours, matO = {}) {
  const geo = kind === 'chip' ? new THREE.IcosahedronGeometry(1, 0) : kind === 'drop' ? new THREE.SphereGeometry(1, 7, 5) : new THREE.BoxGeometry(1, 1, 1);
  const m = new THREE.MeshStandardMaterial({ roughness: kind === 'drop' ? .25 : .85, metalness: 0, ...matO }), im = new THREE.InstancedMesh(geo, m, n);
  const M = new THREE.Matrix4(), q = new THREE.Quaternion(), s = V(), col = new THREE.Color(); let j = 0;
  for (let i = 0; i < n; i++) { const d = spray(r, axis, k), v = d.multiplyScalar(sp[0] + r() * (sp[1] - sp[0])), t = o.t, p = at(V(), v, t, kind === 'drop' ? .8 : 2, 1), L = size[0] + r() * (size[1] - size[0]);
    const vt = v.clone().addScaledVector(G, t), dir = vt.lengthSq() > 1e-6 ? vt.clone().normalize() : V(0, 1, 0);
    if (kind === 'splinter') { q.setFromUnitVectors(V(0, 1, 0), dir).multiply(new THREE.Quaternion().setFromAxisAngle(V(1, 0, 0), t * (8 + r() * 30))); s.set(L * (.1 + r() * .12), L, L * (.05 + r() * .05)); }
    else if (kind === 'chip') { q.setFromEuler(new THREE.Euler(r() * 6, r() * 6, r() * 6)); s.set(L, L * (.6 + r() * .4), L * (.5 + r() * .4)); }
    else { q.setFromUnitVectors(V(0, 1, 0), dir); s.set(L, L * (1 + Math.min(3, vt.length() * .5 * (t > .005 ? 1 : 0))), L); }
    M.compose(p, q, s); im.setMatrixAt(j, M); im.setColorAt(j, col.setRGB(...colours[Math.floor(r() * colours.length)], THREE.SRGBColorSpace)); j++; }
  im.count = j; im.castShadow = true; G0.add(im); return j; }
// ——— dust: soft puffs thrown out with heavy drag, growing and thinning as they go; mist the same, finer and tinted
function puffs(G0, r, o, n, sp, r0, r1, axis, k, colour, op) {
  const tex = puffTex(); let j = 0;
  for (let i = 0; i < n; i++) { const d = spray(r, axis, k), v = d.multiplyScalar(sp[0] + r() * (sp[1] - sp[0])), t = o.t, grow = 1 - Math.exp(-t * 5), p = at(V(), v, t, 6, .05);
    const sm = new THREE.SpriteMaterial({ map: tex, color: new THREE.Color().setRGB(...colour, THREE.SRGBColorSpace).multiplyScalar((.85 + r() * .3) * (o.lit ?? .45)), transparent: true, depthWrite: false, opacity: op * (1 - grow * .55) * (.6 + r() * .4) });
    const s = new THREE.Sprite(sm); s.position.copy(p); s.scale.setScalar(r0 + (r1 - r0) * grow * (.6 + r() * .6)); s.material.rotation = r() * 6; G0.add(s); j++; }
  return j; }
// ——— a mark left on the thing struck: a sliver drawn along the cut, laid flat on the surface (the shield's gouge, the stone's scar, the
// cloth's nick)
function markTex(kind) { const c = document.createElement('canvas'); c.width = 256; c.height = 64; const x = c.getContext('2d');
  const g = x.createLinearGradient(0, 0, 0, 64); if (kind === 'nick') { g.addColorStop(0, 'rgba(40,6,6,0)'); g.addColorStop(.5, 'rgba(60,8,8,.95)'); g.addColorStop(1, 'rgba(40,6,6,0)'); }
  else { g.addColorStop(0, 'rgba(255,240,215,0)'); g.addColorStop(.35, 'rgba(240,222,190,.9)'); g.addColorStop(.6, 'rgba(255,248,232,1)'); g.addColorStop(1, 'rgba(120,96,70,0)'); }
  x.fillStyle = g; x.beginPath(); x.moveTo(4, 32); x.quadraticCurveTo(128, -4, 252, 30); x.quadraticCurveTo(128, 70, 4, 32); x.fill(); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; }
function mark(G0, o, kind, len, wid) { const m = new THREE.Mesh(new THREE.PlaneGeometry(len, wid), new THREE.MeshStandardMaterial({ map: markTex(kind), transparent: true, depthWrite: false, roughness: .9, polygonOffset: true, polygonOffsetFactor: -4 }));
  const Z = o.n.clone(), X = o.cut.clone().addScaledVector(Z, -o.cut.dot(Z)).normalize(), Y = Z.clone().cross(X); m.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(X, Y, Z)); m.position.copy(Z.clone().multiplyScalar(.004)); G0.add(m); return 2; }
// ——— a flash: a small hot core, a light that falls off in 80 ms, and (C) a star
function flash(G0, o, I, core, star, col = [1, .72, .4]) { const f = Math.max(0, 1 - o.t / .08);
  if (I) { const l = new THREE.PointLight(new THREE.Color(...col), I * f, 4, 1.6); l.position.copy(o.n.clone().multiplyScalar(.08)); G0.add(l); G0.userData.light = l; }
  if (core && f > 0) G0.add(new THREE.Mesh(new THREE.SphereGeometry(core * (.5 + f * .5), 10, 8), new THREE.MeshBasicMaterial({ color: new THREE.Color(2.2, 1.7, 1.1), toneMapped: false, transparent: true, opacity: f })));
  if (star && f > 0) { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: puffTex(), color: new THREE.Color(2.4, 2.1, 1.7), blending: THREE.AdditiveBlending, transparent: true, depthWrite: false, toneMapped: false, opacity: f }));
    s.scale.setScalar(star); G0.add(s); for (const a of [0, Math.PI / 2]) { const ray = new THREE.Sprite(new THREE.SpriteMaterial({ map: puffTex(), color: new THREE.Color(2.4, 2.1, 1.7), blending: THREE.AdditiveBlending, transparent: true, depthWrite: false, toneMapped: false, opacity: f, rotation: a })); ray.scale.set(star * 2.4, star * .12, 1); G0.add(ray); } } }

export function impact(surface, level, o = {}) {
  const lv = IMPACT_LEVELS[level] ? level : LEVEL_OF[level] || 'clear', t = o.t ?? .04, n = (o.n || V(0, 0, 1)).clone().normalize(), cut = (o.cut || V(1, 0, 0)).clone().normalize();
  const O = { ...o, t, n, cut }, r = stream(`impact:${surface}:${lv}:${o.seed ?? 1}`), g = new THREE.Group(), out = { surface, level: lv, t };
  // the spray's axis: off the surface and on along the cut, as a struck thing throws (a glancing blow throws along it)
  const off = (a, b) => n.clone().multiplyScalar(a).addScaledVector(cut, b).normalize();
  if (surface === 'steel') {
    out.sparks = sparks(g, r, O, pick(lv, 12, 40, 120), pick(lv, [2.5, 5], [4, 9], [6, 14]), pick(lv, .1, .22, .38), pick(lv, .010, .014, .024), off(.7, 1), pick(lv, .6, .75, 1));
    flash(g, O, pick(lv, 0, 1.8, 4.5), pick(lv, 0, .022, .05), pick(lv, 0, 0, .42));
  } else if (surface === 'wood') {
    const paint = o.tint || [.5, .14, .1], fresh = [[.86, .72, .52], [.8, .64, .44], [.74, .58, .4]], cols = lv === 'quiet' ? fresh : [...fresh, paint];
    out.splinters = bits(g, r, O, 'splinter', pick(lv, 5, 14, 30), pick(lv, [1, 2.5], [1.6, 4], [2.5, 6]), pick(lv, [.012, .03], [.025, .065], [.05, .12]), off(1, .6), .65, cols);
    out.dust = puffs(g, r, O, pick(lv, 0, 4, 10), [.3, .9], .03, pick(lv, .1, .14, .32), off(1, .3), .8, [.72, .6, .44], pick(lv, .3, .28, .4));
    if (lv !== 'quiet') out.mark = mark(g, O, 'gouge', pick(lv, 0, .13, .22), pick(lv, 0, .028, .045));
    flash(g, O, pick(lv, 0, .5, 2), 0, pick(lv, 0, 0, .4), [1, .85, .6]);
  } else if (surface === 'stone') {
    out.dust = puffs(g, r, O, pick(lv, 4, 10, 26), pick(lv, [.3, .7], [.6, 1.6], [1, 3]), pick(lv, .03, .05, .1), pick(lv, .08, .24, .7), off(1, .5), .9, [.66, .6, .5], pick(lv, .25, .32, .5));
    out.chips = bits(g, r, O, 'chip', pick(lv, 3, 8, 22), pick(lv, [1.5, 3.5], [2, 5], [3, 7]), pick(lv, [.003, .008], [.005, .014], [.008, .028]), off(1, .7), .7, [[.62, .58, .5], [.5, .47, .42], [.72, .68, .6]]);
    out.sparks = sparks(g, r, O, pick(lv, 0, 8, 40), [3, 8], pick(lv, .1, .14, .26), .012, off(.4, 1), .7);
    if (lv !== 'quiet') out.mark = mark(g, O, 'scar', pick(lv, 0, .16, .26), pick(lv, 0, .025, .04));
    flash(g, O, pick(lv, 0, .6, 2.4), 0, pick(lv, 0, 0, .45));
  } else {
    // flesh, under its cloth: A the cloth's own fibre and no blood; B a few dark drops and a nick; C a bright spray and a mist
    const cloth = o.tint || [.3, .26, .2];
    if (lv === 'quiet') out.fibre = puffs(g, r, O, 3, [.2, .5], .02, .07, off(1, .5), .8, cloth.map(x => Math.min(1, x * 1.6 + .1)), .35);
    else { out.drops = bits(g, r, O, 'drop', pick(lv, 0, 9, 42), pick(lv, 0, [1.2, 3], [2, 5.5]), pick(lv, 0, [.003, .007], [.004, .012]), off(.45, 1), pick(lv, 0, .45, .7), lv === 'clear' ? [[.24, .03, .03], [.18, .02, .02]] : [[.62, .05, .04], [.5, .03, .03], [.7, .08, .06]]);
      out.mark = mark(g, O, 'nick', pick(lv, 0, .09, .16), pick(lv, 0, .014, .024));
      if (lv === 'loud') out.mist = puffs(g, r, O, 8, [.6, 1.6], .03, .22, off(.5, 1), .6, [.6, .08, .06], .45); }
    flash(g, O, 0, 0, pick(lv, 0, 0, .3), [1, .9, .8]);
  }
  // the group: at the point, its own axes the world's (every part above is placed in world directions from the point)
  g.position.copy(o.at || V()); out.tris = count(g); out.hold = HOLD[lv]; g.userData = { ...g.userData, ...out };
  return g;
}
