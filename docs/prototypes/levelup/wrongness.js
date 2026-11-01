// Small wrongnesses in a pleasant world (the concept artist, 1 Nov 2026; backlog L5, "Small wrongnesses in a pleasant world"; OG-096,
// its three vignettes: a Weaver ruin "ancient, purposeful and slightly wrong", "a watchful moment: not every monster is hunting", and
// "a quiet detail: the carving of an adventurer, the carvers turned away"; and its rule for animals, "familiar anatomy with a single
// impossible element"). One Gatelands lane between drystone walls on a late afternoon, and the three beside it as world details a
// player may walk past. A metre a unit, the lane at x 0 running along z, the ground near y 0.
//
//   the Weaver door ('door'): the gate kit's pointed arch (gatekit.js) at half its size, alone in a pasture 26 m off the lane: an
//     opening of 5 by 9 m, 9 m to its point, every stone in place and none weathered, where the field wall beside it is lichened;
//   the watcher ('watcher'): a grey wolf (creatures.js's 'wolf') sitting on a rise 26 m off the lane on the other side, turned to the
//     lane, with three sheep grazing round it 5 to 9 m off, none of them troubled;
//   the carving ('carving'): a stele 2.25 m high, 1.0 m wide, set in the lane's wall: an adventurer in relief at its middle, sword
//     down and pack on, and round them four small carvers in profile, each turned away from the figure, their chisels at their feet.
//
// What the question decides is how loud the wrongness is (WR_MODES); the shapes are the same in every mode:
//   'plain'  (A) no impossible element: the door sits in the turf, the wolf has its shadow, the carving is old all through. Odd only
//                by where it is and what it does (a wolf among sheep that does not hunt);
//   'one'    (B) one impossible element each, nothing lit: the door stands a hand (0.14 m) clear of the grass, which grows on under it;
//                the wolf casts no shadow (the sheep do); the adventurer's figure is freshly cut, pale and sharp, in a stone worn and
//                lichened everywhere else. Found by the player who looks, never pointed at;
//   'marked' (C) B, and a faint light that draws the eye: the door's script burns low amber, the wolf's eyes shine, the fresh cut
//                holds a pale light in its lines. A thing to find, which could carry a journal line.
// wrongness({ mode }) -> { group, ground(x, z), tris, draws, parts: { door, watcher, carving } (each { tris, draws, at: [x, z], size }),
//   stand: { lane, door, carving, watcher } (where a person stands for the scale), view: { wide, door, doorWide, watcher, watcherHigh, carving } }.
// Everything that varies comes from a stream keyed by the place ('wrongness:<part>'), never Math.random.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { mat, worldUV, fbm, treeKit } from './common.js';
import { gatePiece, stream, GK_SCHOOLS } from './gatekit.js';
import { genome, build, pose } from './creatures.js';

export const WR_MODES = { plain: 'A, plain: no impossible element', one: 'B, one impossible element each, nothing lit', marked: 'C, the element and a faint light' };
const DEAD = new THREE.MeshStandardMaterial({ color: new THREE.Color(.09, .085, .08), roughness: .9 });

// ── the land: a lane along z, pasture either side, a rise to the east for the watcher ──
export const DOOR_AT = [-26, -44], WOLF_AT = [21, -46], STELE_AT = [2.75, -16];
export function ground(x, z) {
  const roll = fbm(x / 40, z / 40, 4) * 1.6 + fbm(x / 9, z / 9, 2) * .12;
  const rise = 3.2 * Math.exp(-((x - WOLF_AT[0]) ** 2 + (z - WOLF_AT[1]) ** 2) / (2 * 11 * 11));
  const lane = Math.exp(-(x * x) / 8) * .25; // the lane worn a little below the fields
  return roll + rise - lane;
}
const putter = B => (k, g) => { const x = g.index ? g.toNonIndexed() : g; for (const a of Object.keys(x.attributes)) if (!['position', 'normal', 'uv', 'color'].includes(a)) x.deleteAttribute(a); if (!x.attributes.normal) x.computeVertexNormals(); if (!x.attributes.uv) worldUV(x, .5); (B.get(k) || B.set(k, []).get(k)).push(x); };
function bake(group, B, M, noCast = []) { let tris = 0, draws = 0;
  for (const [k, gs] of B) { const hasC = gs.every(g => g.attributes.color); gs.forEach(g => { if (!hasC) g.deleteAttribute('color'); }); const g = mergeGeometries(gs, false), m = new THREE.Mesh(g, M[k]); m.name = k; m.castShadow = !noCast.includes(k); m.receiveShadow = true; group.add(m); tris += g.attributes.position.count / 3; draws++; }
  return { tris: Math.round(tris), draws }; }
// grass blades: thin three-sided cones in tufts, merged; `skip(x, z)` leaves a spot bare
function tufts(r, n, cx, cz, rad, o = {}) { const gs = [];
  for (let k = 0; k < n; k++) { const a = r() * Math.PI * 2, d = Math.sqrt(r()) * rad, x = cx + Math.cos(a) * d, z = cz + Math.sin(a) * d; if (o.skip && o.skip(x, z)) continue; const m = 3 + Math.floor(r() * 4);
    for (let j = 0; j < m; j++) { const h = (o.h ?? .16) * (.6 + r() * .8), g = new THREE.ConeGeometry(.012, h, 3, 1); g.translate(0, h / 2, 0); g.rotateZ((r() - .5) * .5); g.rotateY(r() * 6.3);
      const px = x + (r() - .5) * .12, pz = z + (r() - .5) * .12; g.translate(px, ground(px, pz) - .02, pz); const c = new Float32Array(g.attributes.position.count * 3), t = r();
      for (let i = 0; i < c.length; i += 3) c.set([.24 + .12 * t, .36 + .1 * t, .12], i); g.setAttribute('color', new THREE.BufferAttribute(c, 3)); gs.push(g.toNonIndexed()); } }
  return gs; }

// ── the carving: a relief painted as a height field (the figures white on black), the worn part blurred, the fresh part sharp ──
const RW = 512, RH = 1024; // the relief's map: 0.9 by 1.8 m of the stele's face, drawn in a 256 by 512 frame at twice the size
function figurePaths() {
  // the adventurer, facing out: a hooded head, broad shoulders under a cloak, the left arm down, the right raising a sword across
  // the body to the upper left, a pack's roll over the right shoulder, two legs and boots
  const adv = c => { c.save(); c.globalAlpha = .55; c.beginPath(); c.arc(128, 134, 23, Math.PI, 0); c.lineTo(147, 160); c.lineTo(109, 160); c.closePath(); c.fill(); c.restore(); c.beginPath(); c.arc(128, 136, 14, 0, 7); c.fill();
    c.beginPath(); c.moveTo(119, 146); c.lineTo(137, 146); c.lineTo(139, 158); c.lineTo(117, 158); c.fill();
    c.beginPath(); c.moveTo(96, 166); c.quadraticCurveTo(128, 154, 160, 166); c.lineTo(166, 262); c.lineTo(156, 262); c.lineTo(152, 300); c.lineTo(104, 300); c.lineTo(100, 262); c.lineTo(90, 262); c.closePath(); c.fill();
    c.beginPath(); c.moveTo(102, 262); c.lineTo(84, 368); c.lineTo(172, 368); c.lineTo(154, 262); c.closePath(); c.globalAlpha = .7; c.fill(); c.globalAlpha = 1;
    c.fillRect(110, 300, 15, 92); c.fillRect(131, 300, 15, 92); c.fillRect(104, 388, 23, 10); c.fillRect(129, 388, 23, 10);
    c.lineWidth = 11; c.beginPath(); c.moveTo(158, 172); c.lineTo(170, 222); c.lineTo(164, 268); c.stroke();
    c.beginPath(); c.moveTo(98, 172); c.lineTo(84, 214); c.lineTo(78, 236); c.stroke();
    c.save(); c.translate(78, 236); c.rotate(-.42); c.fillRect(-3.5, -150, 7, 140); c.beginPath(); c.moveTo(-3.5, -150); c.lineTo(0, -162); c.lineTo(3.5, -150); c.fill(); c.fillRect(-15, -12, 30, 6); c.fillRect(-3, -6, 6, 14); c.beginPath(); c.arc(0, 11, 5, 0, 7); c.fill(); c.restore();
    c.save(); c.globalAlpha = .65; c.beginPath(); c.ellipse(160, 160, 16, 11, -.4, 0, 7); c.fill(); c.restore(); };
  // a carver in profile, turned away (dir -1 faces the viewer's left): a hooded head with the face to the outside, the back to the
  // figure, the shoulders bowed, the hands to the face, the chisel and the mallet dropped at the feet on the figure's side
  const carver = (c, x0, y0, s, dir) => { const X = v => x0 + dir * v * s, Y = v => y0 + v * s;
    c.beginPath(); c.arc(X(0), Y(0), 10 * s, 0, 7); c.fill(); c.beginPath(); c.moveTo(X(8), Y(-3)); c.lineTo(X(14), Y(2)); c.lineTo(X(8), Y(6)); c.fill();
    c.beginPath(); c.moveTo(X(-12), Y(0)); c.quadraticCurveTo(X(-6), Y(-17), X(7), Y(-9)); c.lineTo(X(2), Y(3)); c.fill();
    c.beginPath(); c.moveTo(X(-11), Y(6)); c.quadraticCurveTo(X(-22), Y(28), X(-15), Y(86)); c.lineTo(X(13), Y(86)); c.quadraticCurveTo(X(12), Y(36), X(5), Y(10)); c.closePath(); c.fill();
    c.lineWidth = 7 * s; c.beginPath(); c.moveTo(X(-4), Y(16)); c.quadraticCurveTo(X(14), Y(22), X(10), Y(6)); c.stroke();
    c.fillRect(Math.min(X(-11), X(-4)), Y(84), 7 * s, 15 * s); c.fillRect(Math.min(X(3), X(10)), Y(84), 7 * s, 15 * s);
    c.save(); c.translate(X(-24), Y(98)); c.rotate(dir * .3); c.fillRect(-10 * s, -2 * s, 20 * s, 4 * s); c.restore();
    c.save(); c.translate(X(-36), Y(97)); c.fillRect(-7 * s, -4 * s, 14 * s, 8 * s); c.fillRect(-1.5 * s, 3 * s, 3 * s, -1 * s); c.rotate(dir * 1.2); c.fillRect(-1.5 * s, 0, 3 * s, 14 * s); c.restore(); };
  return { adv, carvers: c => { carver(c, 36, 150, 1.0, -1); carver(c, 220, 150, 1.0, 1); carver(c, 34, 312, 1.05, -1); carver(c, 222, 312, 1.05, 1); },
    frame: c => { c.lineWidth = 10; c.strokeStyle = '#fff'; c.strokeRect(6, 6, 244, 500); c.lineWidth = 4; for (let i = 0; i < 9; i++) { c.beginPath(); c.moveTo(20 + i * 24, 30); c.lineTo(32 + i * 24, 54); c.lineTo(44 + i * 24, 30); c.stroke(); }
      c.fillRect(12, 458, 232, 6); c.fillRect(12, 72, 232, 5); } };
}
function paint(fn, blur) { const c = document.createElement('canvas'); c.width = RW; c.height = RH; const x = c.getContext('2d'); x.fillStyle = '#000'; x.fillRect(0, 0, RW, RH);
  x.filter = blur ? `blur(${blur}px)` : 'none'; x.scale(2, 2); x.fillStyle = '#fff'; x.strokeStyle = '#fff'; fn(x); const d = x.getImageData(0, 0, RW, RH).data, h = new Float32Array(RW * RH); for (let i = 0; i < h.length; i++) h[i] = d[i * 4] / 255; return h; }
function relief(mode, glowCol) {
  const F = figurePaths(), fresh = mode !== 'plain';
  const worn = paint(c => { F.frame(c); F.carvers(c); if (!fresh) F.adv(c); }, 3.4), freshH = fresh ? paint(F.adv, 1.2) : new Float32Array(RW * RH), halo = fresh ? paint(F.adv, 5) : null;
  const H = new Float32Array(RW * RH); for (let i = 0; i < H.length; i++) H[i] = Math.max(worn[i] * .92, freshH[i]);
  const col = new Uint8ClampedArray(RW * RH * 4), nor = new Uint8ClampedArray(RW * RH * 4), emi = new Uint8ClampedArray(RW * RH * 4), at = (x, y) => H[Math.min(RH - 1, Math.max(0, y)) * RW + Math.min(RW - 1, Math.max(0, x))];
  for (let y = 0; y < RH; y++) for (let x = 0; x < RW; x++) { const i = y * RW + x, u = x / RW, v = y / RH, n = fbm(u * 9, v * 18, 4), lich = Math.max(0, fbm(u * 5 + 3, v * 10, 4) - .12) * 3.2;
    let c = [.55, .54, .49].map(k => k * (.62 + .38 * H[i]) * (.9 + .25 * n)); c = c.map((k, j) => k + ([.50, .55, .34][j] - k) * Math.min(.85, lich));
    if (fresh) { const f = Math.min(1, halo[i] * 1.2 + freshH[i] * .5); c = c.map((k, j) => k + ([.80, .76, .66][j] * (.8 + .2 * freshH[i]) - k) * f); }
    col.set([c[0] * 255, c[1] * 255, c[2] * 255, 255], i * 4);
    const dx = (at(x + 1, y) - at(x - 1, y)) * 5, dy = (at(x, y + 1) - at(x, y - 1)) * 5, l = Math.hypot(dx, dy, 1); nor.set([(-dx / l * .5 + .5) * 255, (dy / l * .5 + .5) * 255, (1 / l * .5 + .5) * 255, 255], i * 4);
    const e = mode === 'marked' ? Math.min(1, Math.hypot(freshH[Math.min(RH * RW - 1, i + 1)] - freshH[Math.max(0, i - 1)], freshH[Math.min(RH * RW - 1, i + RW)] - freshH[Math.max(0, i - RW)]) * 3.5) : 0;
    emi.set([e * 255, e * 255, e * 255, 255], i * 4); }
  const tex = (d, srgb) => { const c = document.createElement('canvas'); c.width = RW; c.height = RH; c.getContext('2d').putImageData(new ImageData(d, RW, RH), 0, 0); const t = new THREE.CanvasTexture(c); t.anisotropy = 8; t.colorSpace = srgb ? THREE.SRGBColorSpace : THREE.NoColorSpace; return t; };
  const g = new THREE.PlaneGeometry(.9, 1.8, 90, 180), P = g.attributes.position, uv = g.attributes.uv;
  for (let i = 0; i < P.count; i++) { const x = Math.round(uv.getX(i) * (RW - 1)), y = Math.round((1 - uv.getY(i)) * (RH - 1)); P.setZ(i, at(x, y) * .035); }
  g.computeVertexNormals();
  const m = new THREE.MeshStandardMaterial({ map: tex(col, true), normalMap: tex(nor, false), roughness: .93, emissive: new THREE.Color(...glowCol), emissiveIntensity: mode === 'marked' ? .9 : 0, emissiveMap: tex(emi, false) });
  return { geo: g, mat: m };
}

export function wrongness(o = {}) {
  const mode = WR_MODES[o.mode] ? o.mode : 'one', group = new THREE.Group(), B = new Map(), put = putter(B), parts = {};
  const amber = GK_SCHOOLS.cloch.glow, lit = mode === 'marked', odd = mode !== 'plain';
  // the land: a plane 600 m square, the pasture's greens, the lane's worn earth
  { const N = 200, g = new THREE.PlaneGeometry(600, 600, N, N); g.rotateX(-Math.PI / 2); g.translate(0, 0, -150); const P = g.attributes.position, col = new Float32Array(P.count * 3);
    for (let i = 0; i < P.count; i++) { const x = P.getX(i), z = P.getZ(i); P.setY(i, ground(x, z)); const t = Math.min(1, Math.max(0, fbm(x / 16, z / 16, 3) + .5)), lane = Math.exp(-(x * x) / 2.2);
      let c = [.20 + .1 * t, .33 + .1 * t, .10 + .03 * t]; c = c.map((k, j) => k + ([.38, .32, .22][j] - k) * lane); col.set(c, i * 3); }
    g.setAttribute('color', new THREE.BufferAttribute(col, 3)); g.computeVertexNormals(); put('land', g); }
  // the lane's drystone walls, 1.2 m high and 0.6 thick at x = ±2.75, laid as rough stones in three courses and a row of cope stones
  // on edge, with a gap for the stele and a field gate on each side; then the field walls running off the lane
  const wallR = stream('wrongness:walls');
  const course = (x0, z0, x1, z1) => { const L = Math.hypot(x1 - x0, z1 - z0), ang = Math.atan2(x1 - x0, z1 - z0); let t = 0;
    while (t < L) { const len = .35 + wallR() * .4, tm = Math.min(L, t + len), x = x0 + (x1 - x0) * (t + tm) / 2 / L, z = z0 + (z1 - z0) * (t + tm) / 2 / L, y0 = ground(x, z) - .12; let y = y0;
      for (let c = 0; c < 3; c++) { const h = .26 + wallR() * .14, w = .62 - c * .07, g = new THREE.BoxGeometry(w, h, (tm - t) * (.9 + wallR() * .12)); g.rotateX((wallR() - .5) * .14); g.rotateZ((wallR() - .5) * .12);
        g.rotateY(ang + (wallR() - .5) * .1); g.translate(x + (wallR() - .5) * .05, y + h / 2, z); worldUV(g, .7); const cc = .8 + wallR() * .35, cv = new Float32Array(g.attributes.position.count * 3); for (let i = 0; i < cv.length; i += 3) cv.set([cc, cc * .98, cc * .93], i); g.setAttribute('color', new THREE.BufferAttribute(cv, 3)); put('wall', g); y += h * .96; }
      for (let k = 0; k < Math.round((tm - t) / .16); k++) { const zz = t + (k + .5) * .16, xx = x0 + (x1 - x0) * zz / L, z2 = z0 + (z1 - z0) * zz / L, h = .22 + wallR() * .1, g = new THREE.BoxGeometry(.4, h, .1 + wallR() * .05); g.rotateX((wallR() - .5) * .35); g.rotateY(ang); g.translate(xx, y + h / 2 - .03, z2); worldUV(g, .7);
        const cc = .75 + wallR() * .35, cv = new Float32Array(g.attributes.position.count * 3); for (let i = 0; i < cv.length; i += 3) cv.set([cc, cc * .98, cc * .93], i); g.setAttribute('color', new THREE.BufferAttribute(cv, 3)); put('wall', g); }
      t = tm; } };
  const run = (x0, z0, x1, z1, gaps = []) => { const L = Math.hypot(x1 - x0, z1 - z0), cut = [0, ...gaps.flat(), L].map(v => Math.max(0, Math.min(L, v))); for (let i = 0; i < cut.length; i += 2) if (cut[i + 1] > cut[i]) course(x0 + (x1 - x0) * cut[i] / L, z0 + (z1 - z0) * cut[i] / L, x0 + (x1 - x0) * cut[i + 1] / L, z0 + (z1 - z0) * cut[i + 1] / L); };
  run(-2.75, 25, -2.75, -130, [[25 + 38 - 1.8, 25 + 38 + 1.8]]);
  run(2.75, 25, 2.75, -130, [[25 + 16 - .58, 25 + 16 + .58], [25 + 58 - 1.8, 25 + 58 + 1.8]]);
  for (const [x0, z0, x1, z1] of [[-3.1, -70, -60, -70], [-60, -70, -60, -10], [3.1, -26, 60, -26], [60, -26, 60, -90]]) run(x0, z0, x1, z1);

  // ── the Weaver door ──
  { const r = stream('wrongness:door'), K = .5, [dx, dz] = DOOR_AT, P = gatePiece('arch', { cond: 'whole', school: 'cloch', key: 'wrongness:door:arch', shadow: true }); P.scale.setScalar(K); P.rotation.y = .35;
    // where its feet are: the highest ground under the two jambs, so B's gap is a clear hand everywhere and A sits 0.3 m into the turf
    let gmax = -1e9, gmin = 1e9; for (let i = -4; i <= 4; i++) for (const dd of [-.6, .6]) { const x = dx + Math.cos(.35) * i * .9 + Math.sin(.35) * dd, z = dz - Math.sin(.35) * i * .9 + Math.cos(.35) * dd, y = ground(x, z); gmax = Math.max(gmax, y); gmin = Math.min(gmin, y); }
    const lift = odd ? .14 : -.3; P.position.set(dx, (odd ? gmax : gmin) + lift, dz); group.add(P); P.updateMatrixWorld(true);
    P.traverse(m => { if (!m.isMesh) return; const k = m.userData.key; if (k !== 'script' && k !== 'ring') { m.material = m.material.clone(); m.material.color = new THREE.Color(1.55, 1.5, 1.38); } if (k === 'script' || k === 'ring') { if (lit) { m.material = m.material.clone(); m.material.emissiveIntensity = (m.material.emissiveIntensity || 1) * .22; } else m.material = DEAD; } });
    // the grass round its feet, growing on under the stones in B and C (the turf is uncut: nothing was ever set down there)
    tufts(r, 2600, dx, dz, 6.5, { h: .065 }).forEach(g => put('grass', g));
    const b = new THREE.Box3().setFromObject(P), s = b.getSize(new THREE.Vector3());
    parts.door = { at: DOOR_AT, tris: P.userData.tris, draws: P.userData.calls, size: { w: +s.x.toFixed(2), h: +s.y.toFixed(2), opening: [5, 9] }, foot: +(P.position.y - gmax).toFixed(2), lift }; }

  // ── the watcher: a grey wolf sitting on the rise, turned to the lane; three sheep grazing round it ──
  const beasts = []; { const [wx, wz] = WOLF_AT, C = build(genome('wolf', 'wrongness:watcher', { island: 'gatelands' })); C.gait = 'sit'; pose(C, 0);
    const face = Math.atan2(-1, -10); C.root.rotation.y = face; C.root.position.set(wx, ground(wx, wz), wz); group.add(C.root);
    C.root.traverse(m => { if (m.isMesh) { m.castShadow = !odd; m.receiveShadow = true; } if (m.isMesh && !m.isSkinnedMesh && m.material?.clearcoat === 1 && lit) { m.material = m.material.clone(); m.material.emissive.setRGB(.75, 1, .7); m.material.emissiveIntensity = 2.6; } });
    beasts.push(C); const r = stream('wrongness:flock');
    for (const [d, a, f] of [[4.6, .75, .3], [6.8, -.9, 2.6], [7.5, 2.3, 1.4]]) { const x = wx + Math.sin(face + a) * d, z = wz + Math.cos(face + a) * d, S = build(genome('sheep', `wrongness:flock:${beasts.length}`)); S.gait = 'stand'; pose(S, 0);
      // grazing: the head and neck bowed to the grass
      const nk = S.bones.filter(b => /^neck/.test(b.name)); nk.forEach(b => b.rotateX(.7 / Math.max(1, nk.length))); if (S.byName.head) S.byName.head.rotateX(.45); S.root.userData.bones = S.bones.map(b => b.name).join(',');
      S.root.rotation.y = f + r() * .4; S.root.position.set(x, ground(x, z), z); S.root.traverse(m => { if (m.isMesh) m.castShadow = m.receiveShadow = true; }); group.add(S.root); beasts.push(S); }
    tufts(r, 700, wx, wz, 9, { h: .22 }).forEach(g => put('grass', g));
    parts.watcher = { at: WOLF_AT, tris: Math.round(C.stats.tris), bones: C.stats.bones, shadow: !odd, eyes: lit, sheep: 3, sheepTris: beasts.slice(1).reduce((s, b) => s + Math.round(b.stats.tris), 0), face: +face.toFixed(2) }; }

  // ── the carving: a stele in the lane's east wall, its face to the lane (-x) ──
  { const [sx, sz] = STELE_AT, y0 = ground(sx, sz) - .25, W2 = 1.0, H2 = 2.0, T = .34, g = new THREE.BoxGeometry(T, H2, W2); g.translate(sx, y0 + H2 / 2, sz); worldUV(g, .9); put('stele', g);
    const top = new THREE.CylinderGeometry(W2 / 2, W2 / 2, T, 32, 1, false, 0, Math.PI); top.rotateZ(Math.PI / 2); top.translate(sx, y0 + H2, sz); worldUV(top, .9); put('stele', top);
    const R = relief(mode, amber), m = new THREE.Mesh(R.geo, R.mat); m.rotation.y = -Math.PI / 2; m.position.set(sx - T / 2 - .018, y0 + 1.12, sz); m.castShadow = false; m.receiveShadow = true; group.add(m);
    tufts(stream('wrongness:carving'), 260, sx - .6, sz, 1.6, { h: .18, skip: (x) => x > sx - T / 2 }).forEach(g => put('grass', g));
    parts.carving = { at: STELE_AT, tris: Math.round(R.geo.index.count / 3) + 12 + 64, size: { w: W2, h: +(H2 + W2 / 2 - .25).toFixed(2), d: T, relief: [.9, 1.8], depth: .035 }, fresh: odd, glow: lit }; }

  // a few trees on the walls' lines and behind the fields
  const T = treeKit(new THREE.Vector3(-.62, .42, .45).normalize()), tr = stream('wrongness:trees'), trees = [];
  for (const [x, z, s] of [[-6, 8, .9], [7, -8, 1], [-5, -95, 1.1], [6, -120, .95], [-62, -30, 1.2], [-58, -78, 1.05], [62, -40, 1.1], [64, -84, 1.2], [-110, -150, 1.3], [90, -170, 1.3], [-30, -190, 1.2], [30, -210, 1.1], [-80, -230, 1.3], [120, -110, 1.25], [-140, -60, 1.3]])
    trees.push([x, ground(x, z), z, s, tr() * 6.3, new THREE.Color(.85 + tr() * .15, 1, .62 + tr() * .15)]);
  T.plant(group, trees);

  const M = { land: new THREE.MeshStandardMaterial({ vertexColors: true, roughness: .97 }), wall: Object.assign(mat('rock', { ns: 1.4, color: 0xc8c6be }), { vertexColors: true }), grass: new THREE.MeshStandardMaterial({ vertexColors: true, roughness: .9 }),
    stele: mat('rock', { ns: 1, color: 0xbcb8ae }) };
  const bk = bake(group, B, M, ['land', 'grass']);
  const tris = bk.tris + parts.door.tris + parts.watcher.tris + parts.watcher.sheepTris + parts.carving.tris;
  // the people for the scale: on the lane by the stele, at the door's jamb, on the rise's foot below the wolf
  const stand = { lane: { x: -.6, z: -12.5, ry: 2.6 }, carving: { x: 1.55, z: -17.1, ry: 1.75 }, door: { x: DOOR_AT[0] + 5.5, z: DOOR_AT[1] + 3.2, ry: -1.9 }, watcher: { x: WOLF_AT[0] - 3.4, z: WOLF_AT[1] - 5.6, ry: Math.atan2(3.4, 5.6) } };
  const at = (x, z, h) => [x, ground(x, z) + h, z];
  const view = { wide: [...at(-.6, 2, 2.4), -2, 2.4, -48], door: [...at(-23.13 + .34 * 2.4, -45.04 + .94 * 2.4, .1), -23.13, ground(-23.13, -45.04) + .28, -45.04], doorWide: [...at(DOOR_AT[0] + 13, DOOR_AT[1] + 12, 1.65), DOOR_AT[0], ground(...DOOR_AT) + 3.5, DOOR_AT[1]],
    watcher: [...at(WOLF_AT[0] - 1, WOLF_AT[1] - 10.5, 1.65), WOLF_AT[0] - .6, ground(...WOLF_AT) + .3, WOLF_AT[1] + 1], watcherHigh: [...at(WOLF_AT[0] - 2.5, WOLF_AT[1] - 7.5, 4.2), WOLF_AT[0] + .6, ground(...WOLF_AT) - .2, WOLF_AT[1] - .5], carving: [...at(.15, -14.6, 1.5), STELE_AT[0], ground(...STELE_AT) + 1.1, STELE_AT[1] - .15] };
  const census = {}; for (const ch of group.children) { let t = 0; ch.traverse(o => { if (o.isMesh) t += (o.geometry.index ? o.geometry.index.count : o.geometry.attributes.position.count) / 3 * (o.isInstancedMesh ? o.count : 1); }); const k = ch.name || ch.type; census[k] = (census[k] || 0) + Math.round(t); }
  return { census, group, ground, tris, draws: bk.draws + parts.door.draws + 2, parts, stand, view, mode, beasts };
}
