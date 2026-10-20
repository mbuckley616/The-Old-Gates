// The new look's kit (Session 1037; DECISION #389, Michael's A, 17 Oct 2026; card F6 of docs/design/visual-foundation.md).
// The pieces drawn and checked in docs/prototypes/levelup/ come into the game here, one kind a session, as plain script.
// The prototype pages stay the drawing board: a piece is built and checked there first, then copied. This file loads in
// both looks but is only called when OG_LOOK is 'new'; nothing here touches THREE while the page loads, so on r128 it
// costs one object. F14 deletes the old builders and keeps this file.
// Everything is inside one function, so none of the kit's names (box, face, stack, building, …) reach the shared scope;
// the one global is PKIT:
//   PKIT.stream(key) -> a seeded stream in [0,1) keyed by a string (the co-op rule: a lot's look from its street and index)
//   PKIT.mergeByMaterial(group) -> bakes every mesh into the group's frame, one mesh per material; returns the triangles
//   PKIT.texturesMade() -> how many surfaces have been painted (0 until the first piece is built); PKIT.signsMade() -> how many signs; PKIT.panelsMade() -> name panels and banners
//   The Gatelands kit (pieces.js's concept-run plans, Sessions 834 to 964): PKIT.gl.PLANS (cottage, forge, temple, guildhall,
//   farmhouse, townhouse, merchant, warehouse), PKIT.gl.building(plan) -> a Group, one mesh per material, with userData
//   {name, tris, calls, size: {w, d, eave, ridge}, door}; PKIT.gl.lot(street, i, s) -> {plan, kind, colour, paint} (#280 A).
//   Plans by bays (#396 C, Session 1064): PKIT.gl.BAYS, bayPlan(kind, n, o), bayWidth(kind, n), baysFor(kind, lotW); lot(street, i, {bays, d}).
// Differences from the prototype: the surfaces are painted on first use, not all at once; textures carry no colour space
// (the game runs 0.170 with colour management off and a linear output, js/05-compat.js, so a texture is read as r128 read
// one); a plan with no stream of its own takes the kit's stream 'pkit', not the page's shared rnd(); and the piece measures
// are PS here (the prototype's SCALE), since SCALE is the game's (07-scale.js). The measures agree: a door 2.05 m.
var PKIT = (function () {
  'use strict';
  // ── seeds ──
  function hashKey(s) { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
  function stream(key) { let a = hashKey(String(key)); return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
  const rnd = stream('pkit');
  const mix = (a, b, t) => a + (b - a) * t;
  // ── tileable noise for the painters ──
function tn(x, y, f, s = 0) { const X = x * f, Y = y * f, i = Math.floor(X), j = Math.floor(Y), u = X - i, v = Y - j, h = (a, b) => { a = ((a % f) + f) % f; b = ((b % f) + f) % f; let n = a * 374761393 + b * 668265263 + s * 982451653; n = (n ^ (n >>> 13)) * 1274126177; return ((n ^ (n >>> 16)) >>> 0) / 4294967295; };
  const su = u * u * (3 - 2 * u), sv = v * v * (3 - 2 * v); return (h(i, j) * (1 - su) + h(i + 1, j) * su) * (1 - sv) + (h(i, j + 1) * (1 - su) + h(i + 1, j + 1) * su) * sv; }
const tfbm = (x, y, f, o = 4, s = 0) => { let a = 0, m = .5, t = 0; for (let k = 0; k < o; k++) { a += m * tn(x, y, f, s + k); t += m; f *= 2; m *= .5; } return a / t; };
const idr = id => { let n = (id * 2654435761) >>> 0; n ^= n >>> 15; return (n % 1000) / 1000; };
  // ── surfaces: painted on a canvas from a height field, with a normal map from the same height (common.js's texPair) ──
  function finishTex(cv) { const t = new THREE.CanvasTexture(cv); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 8; t.colorSpace = THREE.NoColorSpace; return t; }
  function texPair(N, fn, strength = 2.5) {
    const hgt = new Float32Array(N * N), col = new Uint8ClampedArray(N * N * 4);
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) { const r = fn(x / N, y / N); const i = y * N + x; hgt[i] = r[0]; col[i * 4] = r[1] * 255; col[i * 4 + 1] = r[2] * 255; col[i * 4 + 2] = r[3] * 255; col[i * 4 + 3] = 255; }
    const nor = new Uint8ClampedArray(N * N * 4), at = (x, y) => hgt[((y + N) % N) * N + ((x + N) % N)];
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) { const dx = (at(x + 1, y) - at(x - 1, y)) * strength, dy = (at(x, y + 1) - at(x, y - 1)) * strength, l = Math.hypot(dx, dy, 1), i = (y * N + x) * 4;
      nor[i] = (-dx / l * .5 + .5) * 255; nor[i + 1] = (dy / l * .5 + .5) * 255; nor[i + 2] = (1 / l * .5 + .5) * 255; nor[i + 3] = 255; }
    const mk = data => { const c = document.createElement('canvas'); c.width = c.height = N; c.getContext('2d').putImageData(new ImageData(data, N, N), 0, 0); return finishTex(c); };
    return { map: mk(col), normalMap: mk(nor) };
  }
  // the painters, as common.js's buildTextures has them; each runs once, the first time a material asks for it
  // the Mark's turf painters' tufts and their three-way mix (markTextures' own, Session 1159)
  const tuft = (x, y, s) => { const a = tfbm(x, y, 10, 3, s), b = tn(x, y, 22, s + 5), c = tfbm(x, y, 48, 2, s + 9); return { a, b, c, h: a * .55 + b * .3 + c * .15 }; };
  const mix3 = (p, q, t) => p.map((v, i) => v + (q[i] - v) * Math.max(0, Math.min(1, t)));
  const PAINTERS = {
    plaster: () => texPair(256, (x, y) => { const n = tfbm(x, y, 6, 5), s = tfbm(x, y, 3, 3, 9); const h = n * .5 + tfbm(x, y, 24, 3, 4) * .3; const c = .93 - .08 * s - .05 * tn(x, y, 40, 2); return [h, c, c * .975, c * .93]; }, 1.2),
    stone: () => texPair(512, (x, y) => { const rows = 7, row = Math.floor(y * rows), ry = y * rows - row, off = tn(row / rows, .3, 997, 7) * .9, cols = 4, xx = x * cols + off * (row % 2 ? 1 : .5), col = Math.floor(xx), rx = xx - col;
    const id = ((row % rows) * 31 + ((col % cols) + cols) % cols * 7), r = idr(id + 3), edge = Math.min(rx, 1 - rx, ry * 1.6, (1 - ry) * 1.6), n = tfbm(x, y, 16, 4, r * 5);
    const gap = edge < .045; const h = gap ? 0 : Math.min(1, edge * 7) * (.7 + .3 * n); const v = .45 + .17 * r + .12 * n; return [h, ...(gap ? [.2, .19, .17] : [v * 1.02, v * .99, v * .93])]; }, 2.6),
    ashlar: () => texPair(512, (x, y) => { const rows = 4, row = Math.floor(y * rows), ry = y * rows - row, cols = 2, xx = x * cols + (row % 2) * .5 + (row % 3 === 2 ? .23 : 0), col = Math.floor(xx), rx = xx - col, r = idr(row * 29 + ((col % cols) + cols) % cols * 11 + 5);
    const edge = Math.min(rx * 2, (1 - rx) * 2, ry, 1 - ry), n = tfbm(x, y, 10, 5, r * 7), tool = tn(x * 3, y * 40, 32, 9) * .5, gap = edge < .018, chip = edge < .06 && tn(x, y, 64, 4) > .62;
    const h = gap ? 0 : Math.min(1, edge * 14) * (.78 + .14 * n + .06 * tool) - (chip ? .25 : 0); const v = .5 + .14 * r + .14 * (n - .5) - (chip ? .08 : 0);
    return [h, ...(gap ? [.16, .15, .14] : [v * 1.02, v * .99, v * .94])]; }, 2.2),
    thatch: () => texPair(256, (x, y) => { const s = tn(x, y * .08, 64, 4), course = (y * 6) % 1, n = tfbm(x, y, 8, 3, 2), h = s * .7 + (1 - course) * .3; const c = .55 + .25 * s; return [h, c * .93 + .05 * n, c * .74 + .04 * n, c * .42]; }, 2.4),
    slate: () => texPair(256, (x, y) => { const rows = 10, row = Math.floor(y * rows), ry = y * rows - row, xx = x * 6 + (row % 2) * .5, col = Math.floor(xx), rx = xx - col, r = idr(row * 13 + ((col % 6) + 6) % 6);
    const gap = rx < .04 || rx > .96; const h = gap ? 0 : ry * .8 + .2 * tfbm(x, y, 20, 2, r); const v = .26 + .08 * r; return [h, ...(gap ? [.1, .1, .11] : [v * .92, v * .98, v * 1.1])]; }, 3),
    wood: () => texPair(256, (x, y) => { const p = 5, pl = Math.floor(x * p), px = x * p - pl, r = idr(pl + 1), g = Math.sin((y * 14 + tfbm(x, y, 4, 3, pl) * 3 + r * 6) * Math.PI * 2) * .5 + .5, gap = px < .03;
    const h = gap ? 0 : .6 + .25 * g; const v = .33 + .1 * r + .06 * g; return [h, ...(gap ? [.08, .06, .05] : [v * 1.0, v * .74, v * .52])]; }, 2),
    // the flags and the rock, for the rooms (Session 1157: the taproom's floor and its turf fire, rooms.js)
    flag: () => texPair(512, (x, y) => { const rows = 4, row = Math.floor(y * rows), ry = y * rows - row, xx = x * 3 + (row % 2) * .5, col = Math.floor(xx), rx = xx - col, r = idr(row * 7 + ((col % 3) + 3) % 3);
    const edge = Math.min(rx, 1 - rx, ry, 1 - ry), n = tfbm(x, y, 14, 4, r * 3), gap = edge < .025; const h = gap ? 0 : Math.min(1, edge * 6) * (.8 + .2 * n); const v = .3 + .1 * r + .1 * n; return [h, ...(gap ? [.06, .06, .06] : [v * .95, v * .97, v])]; }, 2.4),
    rock: () => texPair(512, (x, y) => { const n = tfbm(x, y, 4, 6, 21), m = tfbm(x, y, 16, 4, 23), strata = Math.sin((y * 9 + n * 2.2) * Math.PI) * .5 + .5, crack = Math.pow(1 - Math.abs(tfbm(x, y, 6, 4, 29) - .5) * 2, 14);
    const h = n * .55 + strata * .25 + m * .2 - crack * .25; const v = .48 + .14 * n + .05 * strata - .07 * crack; return [h, v * 1.03, v * .98, v * .9]; }, 3.0),
    // the Mark's (Session 1159, for the alehall: pieces.js's markTextures and common.js's beam; the fringe as the kit's other surfaces, no colour space)
    beam: () => texPair(256, (x, y) => { const g = Math.sin((x * 3 + tfbm(x, y, 3, 3, 4) * 4) * Math.PI * 2) * .5 + .5, n = tfbm(x, y, 18, 3, 5); const v = .16 + .05 * g + .04 * n; return [g * .5 + n * .5, v * 1.15, v * .82, v * .62]; }, 1.6),
    shingle: () => texPair(256, (x, y) => { const rows = 8, row = Math.floor(y * rows), v = y * rows - row, cols = 6, xx = x * cols + (row % 2) * .5, col = Math.floor(xx), u = xx - col, r = idr(row * 17 + ((col % cols) + cols) % cols + 9);
    const butt = Math.sqrt(Math.max(0, 1 - Math.pow((u - .5) * 2, 2))) * .25, edge = v < butt * .6 || u < .04 || u > .96, g = tn(x * 2, y * 30, 16, 3);
    const k = .26 + .08 * r + .05 * g; return [edge ? 0 : .5 + .5 * v, ...(edge ? [.07, .06, .05] : [k * 1.02, k * .95, k * .86])]; }, 2.6),
    turfDry: () => texPair(256, (x, y) => { const n = tfbm(x, y, 3, 4, 41), m = tfbm(x, y, 6, 3, 43), T = tuft(x, y, 47);
    let c = mix3([.44, .36, .22], [.53, .45, .3], n * 1.6 - .3); c = mix3(c, [.35, .33, .2], (m - .5) * 3); c = mix3(c, [.25, .26, .15], (.4 - T.h) * 4);
    c = mix3(c, [.2, .15, .1], (.22 - T.b * T.c) * 6); const k = .9 + .2 * T.c; return [T.h, c[0] * k, c[1] * k, c[2] * k]; }, 2.6),
    turfMoss: () => texPair(256, (x, y) => { const n = tfbm(x, y, 3, 4, 51), m = tfbm(x, y, 12, 3, 53), T = tuft(x, y, 57);
    let c = mix3([.18, .21, .12], [.26, .28, .16], n * 1.5 - .25); c = mix3(c, [.46, .4, .26], (T.h - .64) * 5); c = mix3(c, [.55, .56, .47], (m - .72) * 7);
    c = mix3(c, [.13, .11, .08], (.2 - T.c * T.b) * 6); const k = .9 + .2 * T.c; return [T.h * .8 + m * .2, c[0] * k, c[1] * k, c[2] * k]; }, 2.0),
    fringe: () => { const N = 256, cv = document.createElement('canvas'); cv.width = N; cv.height = 64; const x = cv.getContext('2d'); let sd = 7; const rr = () => (sd = (sd * 16807) % 2147483647) / 2147483647;
    for (let i = 0; i < 1100; i++) { const px = rr() * N, len = 8 + rr() ** 1.6 * 56, lean = (rr() - .5) * 14, t = rr(), col = t < .55 ? [140, 120, 80] : t < .85 ? [112, 98, 62] : [78, 74, 48];
      x.strokeStyle = `rgb(${col.map(v => v * (.85 + .3 * rr()) | 0)})`; x.lineWidth = .6 + rr() * 1.1; for (const dx of [0, -N, N]) { x.beginPath(); x.moveTo(px + dx, 0); x.quadraticCurveTo(px + dx + lean * .3, len * .5, px + dx + lean, len); x.stroke(); } }
    x.fillStyle = 'rgb(84,70,46)'; x.fillRect(0, 0, N, 5); const ft = new THREE.CanvasTexture(cv); ft.wrapS = ft.wrapT = THREE.RepeatWrapping; ft.anisotropy = 8; ft.colorSpace = THREE.NoColorSpace; return { map: ft }; },
  };
  const TEX = {};
  const tex = k => TEX[k] || (TEX[k] = PAINTERS[k]());
  function mat(k, o = {}) { const t = tex(k); return new THREE.MeshStandardMaterial({ map: t.map, normalMap: t.normalMap, normalScale: new THREE.Vector2(o.ns ?? 1, o.ns ?? 1), roughness: o.rough ?? .9, metalness: 0, color: o.color ?? 0xffffff }); }
  // UVs from position by the face's major axis, so a texture keeps its scale on any box; `slopeX` sends v down the slope
  function worldUV(g, s = 1, o = {}) {
    const P = g.attributes.position, N = g.attributes.normal, uv = new Float32Array(P.count * 2);
    for (let i = 0; i < P.count; i++) { const x = P.getX(i), y = P.getY(i), z = P.getZ(i), ax = Math.abs(N.getX(i)), ay = Math.abs(N.getY(i)), az = Math.abs(N.getZ(i));
      let u, v; if (ay >= ax && ay >= az) { [u, v] = o.slopeX ? [z, x] : [x, z]; } else if (ax >= az) { u = z; v = y; } else { u = x; v = y; }
      uv[i * 2] = u * s; uv[i * 2 + 1] = v * s; }
    g.setAttribute('uv', new THREE.BufferAttribute(uv, 2)); return g;
  }
  // ── merging: the vendored three.js has no addons, so this is BufferGeometryUtils.mergeGeometries for what the kit makes
  // (non-indexed, position, normal and uv) ──
  function mergeGeometries(list) {
    let n = 0; for (const g of list) n += g.attributes.position.count;
    const P = new Float32Array(n * 3), N = new Float32Array(n * 3), U = new Float32Array(n * 2); let o = 0;
    for (const g of list) { const c = g.attributes.position.count; P.set(g.attributes.position.array.subarray(0, c * 3), o * 3); N.set(g.attributes.normal.array.subarray(0, c * 3), o * 3); U.set(g.attributes.uv.array.subarray(0, c * 2), o * 2); o += c; }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(P, 3)); g.setAttribute('normal', new THREE.BufferAttribute(N, 3)); g.setAttribute('uv', new THREE.BufferAttribute(U, 2));
    g.computeBoundingSphere(); g.computeBoundingBox(); return g;
  }
  // every mesh of a group baked into the group's frame and merged by material: one draw per material, the same picture
  function mergeByMaterial(g) {
    g.updateMatrixWorld(true); const inv = g.matrixWorld.clone().invert(), by = new Map(); let tris = 0;
    g.traverse(o => { if (!o.isMesh) return; let geo = o.geometry.index ? o.geometry.toNonIndexed() : o.geometry.clone(); geo.clearGroups();
      geo.applyMatrix4(inv.clone().multiply(o.matrixWorld)); for (const k of Object.keys(geo.attributes)) if (!['position', 'normal', 'uv'].includes(k)) geo.deleteAttribute(k);
      if (!geo.attributes.uv) geo.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(geo.attributes.position.count * 2), 2));
      if (!by.has(o.material)) by.set(o.material, { geos: [], cast: o.castShadow }); by.get(o.material).geos.push(geo); });
    for (const c of [...g.children]) { g.remove(c); c.traverse(o => o.geometry && o.geometry.dispose()); }
    for (const [m, { geos, cast }] of by) { const geo = mergeGeometries(geos); geos.forEach(x => x.dispose()); const mesh = new THREE.Mesh(geo, m); mesh.castShadow = cast; mesh.receiveShadow = true; g.add(mesh); tris += geo.attributes.position.count / 3; }
    return Math.round(tris);
  }

  // ── the Gatelands kit, copied from docs/prototypes/levelup/pieces.js (the concept run of 13 Oct 2026; Sessions 834 to 964).
  // Copy it again from there when the prototype changes; only SCALE → PS and the texture colour space differ. ──
const PS = {
  person: 1.8, eye: 1.65, door: { h: 2.05, w: 1.0 }, step: .16, sill: .9, plinth: .45,
  wall: { cottage: .6, house: .5, town: .45, store: .7 },
  storey: { cottage: 2.7, house: [2.9, 2.7], town: [3.0, 2.9, 2.6], shop: [3.0, 2.9, 2.6], store: [3.0, 2.8, 2.8, 2.6] }, /* floor to floor, visual-foundation §1's 2.6 to 3.0 (Session 860; the town's were 3.3 to 3.6) */
  pitch: { thatch: 50, slate: 36, store: 40 }, thatchDepth: .5, slateDepth: .14, pot: .5,
};
const RAD = Math.PI / 180;

// ── materials, by key ──
const RENDER = { lime: 0xf3efe6, cream: 0xeadfc4, ochre: 0xdcb46e, sage: 0xa9b48e, oxblood: 0xa45a48, blue: 0x8ea2b2, rose: 0xd8a596 };
const PAINTS = { green: [.13, .30, .20], red: [.55, .12, .10], blue: [.14, .26, .44], black: [.06, .06, .07], yellow: [.75, .58, .18], teal: [.12, .36, .38] };
let MAT = null;
function glMats() {
  if (MAT) return MAT; MAT = {};
  for (const k in RENDER) MAT['w:' + k] = mat('plaster', { ns: .55, color: RENDER[k], rough: .95 });
  MAT.rubble = mat('stone', { ns: 1.0, color: 0xf4efe6 }); MAT.ashlar = mat('ashlar', { ns: .9, color: 0xece6da }); MAT.dress = mat('ashlar', { ns: .7, color: 0xf2ede2 });
  MAT.thatch = mat('thatch', { ns: 1.5, rough: 1, color: 0xffe6c4 }); MAT.slate = mat('slate', { ns: 1.3, rough: .55, color: 0xe0e4ec });
  MAT.ridge = new THREE.MeshStandardMaterial({ color: new THREE.Color(.36, .14, .09), roughness: .7 }); MAT.pot = new THREE.MeshStandardMaterial({ color: new THREE.Color(.62, .30, .18), roughness: .8 });
  MAT.tar = new THREE.MeshStandardMaterial({ color: new THREE.Color(.035, .035, .04), roughness: .45 }); MAT.iron = new THREE.MeshStandardMaterial({ color: new THREE.Color(.06, .06, .065), roughness: .45, metalness: .6 });
  MAT.frame = new THREE.MeshStandardMaterial({ color: new THREE.Color(.90, .88, .82), roughness: .6 }); MAT.board = mat('wood', { ns: 1.1, color: 0xb8a890 });
  MAT.glass = new THREE.MeshStandardMaterial({ color: new THREE.Color(.04, .05, .06), roughness: .05, metalness: .2 });
  MAT.lit = new THREE.MeshStandardMaterial({ color: new THREE.Color(.1, .08, .05), emissive: new THREE.Color(1, .66, .32), emissiveIntensity: .5, roughness: .2 });
  MAT.dark = new THREE.MeshStandardMaterial({ color: new THREE.Color(.025, .02, .016), roughness: 1, side: THREE.BackSide });
  for (const k in PAINTS) { const m = mat('wood', { ns: .7 }); m.color.setRGB(...PAINTS[k].map(v => Math.min(1, v * 2.7)), THREE.SRGBColorSpace); MAT['p:' + k] = m; }
  return MAT;
}
// one material for each sign's words and colours (Session 1074): a town's shops of one trade share it, so a town paints a handful
// of fascias, not one a shop, and a town unloaded and built again paints none
const SIGNS = {};
function signMat(text, bg, fg) { const key = `${text}|${bg}|${fg}`; return SIGNS[key] || (SIGNS[key] = paintSign(text, bg, fg)); }
function paintSign(text, bg, fg) {
  const c = document.createElement('canvas'); c.width = 1024; c.height = 128; const x = c.getContext('2d'); x.fillStyle = bg; x.fillRect(0, 0, 1024, 128); x.strokeStyle = fg; x.lineWidth = 6; x.strokeRect(10, 10, 1004, 108);
  x.fillStyle = fg; x.font = '600 64px Georgia, serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(text, 512, 68); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.NoColorSpace; t.anisotropy = 8;
  return new THREE.MeshStandardMaterial({ map: t, roughness: .6 });
}
// a name cut in a dressed stone panel (Session 964): dark letters in a light stone, the panel's aspect kept. Kept by its words and
// aspect as the signs are (Session 1083, the guild halls in the game's towns), and the banners by colour and guild
const PANEL_KEY = /^(panel|banner)\|/;
function panelMat(text, aspect) { const key = `panel|${text}|${aspect}`; return SIGNS[key] || (SIGNS[key] = paintPanel(text, aspect)); }
function bannerMat(colour, guild) { const key = `banner|${colour}|${guild}`; return SIGNS[key] || (SIGNS[key] = paintBanner(colour, guild)); }
function paintPanel(text, aspect) {
  const c = document.createElement('canvas'); c.width = 1024; c.height = Math.round(1024 / aspect); const x = c.getContext('2d'); x.fillStyle = '#d6cfbf'; x.fillRect(0, 0, c.width, c.height);
  x.strokeStyle = '#8f8676'; x.lineWidth = 8; x.strokeRect(16, 16, c.width - 32, c.height - 32); x.fillStyle = '#4a443b'; let fs = Math.round(c.height * .5); x.font = `600 ${fs}px Georgia, serif`; const tw = x.measureText(text).width; if (tw > c.width - 90) { fs = Math.floor(fs * (c.width - 90) / tw); x.font = `600 ${fs}px Georgia, serif`; } x.textAlign = 'center'; x.textBaseline = 'middle';
  x.fillText(text, 512, c.height * .54); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.NoColorSpace; t.anisotropy = 8; return new THREE.MeshStandardMaterial({ map: t, roughness: .9 });
}
// a guild's banner (Session 964): a wool field in the guild's colour, a gilt border, crossed swords for the Fighters, a star for the Mages
function paintBanner(colour, guild) {
  const c = document.createElement('canvas'); c.width = 256; c.height = 620; const x = c.getContext('2d'); x.fillStyle = colour; x.fillRect(0, 0, 256, 620); x.strokeStyle = '#d4ad55'; x.lineWidth = 14;
  x.beginPath(); x.moveTo(14, 8); x.lineTo(14, 600); x.moveTo(242, 8); x.lineTo(242, 600); x.moveTo(8, 18); x.lineTo(248, 18); x.stroke(); x.fillStyle = '#d4ad55'; x.lineCap = 'round';
  if (guild === 'mages') { x.beginPath(); for (let i = 0; i < 16; i++) { const a = i / 16 * Math.PI * 2 - Math.PI / 2, r = i % 2 ? 30 : 84; x.lineTo(128 + Math.cos(a) * r, 230 + Math.sin(a) * r); } x.closePath(); x.fill(); }
  else for (const s of [-1, 1]) { x.save(); x.translate(128, 230); x.rotate(s * .62); x.fillRect(-9, -120, 18, 190); x.fillRect(-40, 62, 80, 14); x.fillRect(-7, 76, 14, 44); x.beginPath(); x.arc(0, 128, 12, 0, Math.PI * 2); x.fill();
    x.beginPath(); x.moveTo(-9, -120); x.lineTo(0, -145); x.lineTo(9, -120); x.fill(); x.restore(); }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.NoColorSpace; t.anisotropy = 8; return new THREE.MeshStandardMaterial({ map: t, roughness: 1, side: THREE.DoubleSide });
}
// the trade sign's device (Session 936: device 'mortar', the apothecary's mortar and pestle; the harp otherwise)
function harpMat(device) {
  const c = document.createElement('canvas'); c.width = 256; c.height = 320; const x = c.getContext('2d'); x.fillStyle = '#1f3a2c'; x.fillRect(0, 0, 256, 320); x.strokeStyle = '#d4ad55'; x.lineWidth = 8; x.strokeRect(12, 12, 232, 296);
  if (device === 'mortar') { x.fillStyle = '#d4ad55'; x.beginPath(); x.moveTo(58, 160); x.lineTo(198, 160); x.quadraticCurveTo(196, 238, 150, 250); x.lineTo(106, 250); x.quadraticCurveTo(60, 238, 58, 160); x.fill();
    x.fillRect(96, 250, 64, 14); x.fillRect(80, 264, 96, 14); x.lineWidth = 18; x.lineCap = 'round'; x.strokeStyle = '#d4ad55'; x.beginPath(); x.moveTo(150, 150); x.lineTo(196, 62); x.stroke();
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.NoColorSpace; return new THREE.MeshStandardMaterial({ map: t, roughness: .6 }); }
  x.lineWidth = 12; x.beginPath(); x.moveTo(78, 262); x.lineTo(84, 70); x.quadraticCurveTo(150, 40, 190, 92); x.quadraticCurveTo(150, 170, 92, 262); x.closePath(); x.stroke();
  x.lineWidth = 3; for (let i = 0; i < 7; i++) { const t = (i + 1) / 8; x.beginPath(); x.moveTo(84 + (88 - 84) * t, 70 + 192 * t); x.lineTo(84 + 100 * t, 92 + 40 * t + 0 * i); x.stroke(); }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.NoColorSpace; return new THREE.MeshStandardMaterial({ map: t, roughness: .6 });
}

// ── the bucket: pieces collected by material key, merged per building ──
function bucket() {
  const g = {}; return { g, extra: [],
    add(key, geo, m) { let x = geo.index ? geo.toNonIndexed() : geo.clone(); x.clearGroups(); for (const k of Object.keys(x.attributes)) if (!['position', 'normal', 'uv'].includes(k)) x.deleteAttribute(k);
      if (!x.attributes.uv) x.setAttribute('uv', new THREE.Float32BufferAttribute(new Float32Array(x.attributes.position.count * 2), 2)); if (m) x.applyMatrix4(m); (g[key] ||= []).push(x); return x; } };
}
function finish(bk, name) {
  const M = glMats(), grp = new THREE.Group(); let tris = 0, calls = 0;
  for (const k in bk.g) { const geo = mergeGeometries(bk.g[k]), m = new THREE.Mesh(geo, M[k] || bk.mats?.[k]); m.castShadow = !['glass', 'lit', 'dark'].includes(k); m.receiveShadow = true; grp.add(m); tris += geo.attributes.position.count / 3; calls++; }
  grp.userData = { name, tris: Math.round(tris), calls }; return grp;
}
const box = (w, h, d, s = .5) => worldUV(new THREE.BoxGeometry(w, h, d), s);

// an opening's outline: a rectangle, or round-headed (a half circle on its width)
function outline(o, P) { const l = o.x - o.w / 2, r = o.x + o.w / 2, b = o.y, t = o.y + o.h;
  P.moveTo(l, b); P.lineTo(r, b); if (o.arch) { const sp = t - o.w / 2; P.lineTo(r, sp); P.absarc(o.x, sp, o.w / 2, 0, Math.PI, false); } else { P.lineTo(r, t); P.lineTo(l, t); } P.lineTo(l, b); return P; }

// ── the face: a wall slab with its openings, then the pieces on it. Face space: u along the face (right as seen
// from outside), v up, z out of the wall (0 is the outer face, -t the inner) ──
function face(bk, Mf, o) {
  const add = (k, g) => bk.add(k, g, Mf), sh = new THREE.Shape(o.outline.map(([u, v]) => new THREE.Vector2(u, v)));
  for (const op of o.open) sh.holes.push(outline(op, new THREE.Path()));
  const wg = new THREE.ExtrudeGeometry(sh, { depth: o.t, bevelEnabled: false, curveSegments: 12 }); wg.translate(0, 0, -o.t); worldUV(wg, o.fin.uv ?? .42); add(o.fin.key, wg);
  const half = o.outline.reduce((a, p) => Math.max(a, Math.abs(p[0])), 0);
  // the tarred plinth of a cottage, broken at the doors
  if (o.fin.plinth) { let a = -half - .03; const cuts = o.open.filter(p => p.y < .3).sort((p, q) => p.x - q.x).map(p => [p.x - p.w / 2, p.x + p.w / 2]); cuts.push([half + .03, 0]);
    for (const [c0, c1] of cuts) { if (c0 - a > .02) { const g = box(c0 - a, PS.plinth, .06); g.translate((a + c0) / 2, PS.plinth / 2, .0); add('tar', g); } a = c1; } }
  // string courses at the floors
  for (const y of o.strings || []) { const g = box(half * 2 + .06, .14, .1); g.translate(0, y, .03); add(o.fin.dressKey || 'dress', g); }
  for (const op of o.open) piece(add, op, o);
}

// ── the openings: what fills each hole ──
function piece(add, op, F) {
  const fin = F.fin, inset = op.inset ?? fin.inset, z0 = -inset, l = op.x - op.w / 2, r = op.x + op.w / 2, top = op.y + op.h, spring = op.arch ? top - op.w / 2 : top;
  const B = (k, w, h, d, x, y, z, rz = 0, s = .5) => { const g = box(w, h, d, s); if (rz) g.rotateZ(rz); g.translate(x, y, z); add(k, g); return g; };
  const glass = (y0, k) => { const s = outline({ ...op, y: y0, h: top - y0 }, new THREE.Shape()); const g = new THREE.ShapeGeometry(s, 12); g.translate(0, 0, z0 - .03); add(k || ((F.r || rnd)() < .14 ? 'lit' : 'glass'), g); };
  // a glazed sash: its frame and bars between y0 and y1, c by r panes
  const sash = (y0, y1, c, rr, z = z0) => { const fw = .055; B('frame', op.w, fw, .07, op.x, y0 + fw / 2, z); B('frame', op.w, fw, .07, op.x, y1 - fw / 2, z); B('frame', fw, y1 - y0, .07, l + fw / 2, (y0 + y1) / 2, z); B('frame', fw, y1 - y0, .07, r - fw / 2, (y0 + y1) / 2, z);
    for (let i = 1; i < c; i++) B('frame', .03, y1 - y0, .05, l + op.w * i / c, (y0 + y1) / 2, z); for (let j = 1; j < rr; j++) B('frame', op.w, .03, .05, op.x, y0 + (y1 - y0) * j / rr, z); };
  const fan = (z = z0) => { const rr = op.w / 2, sp = spring; for (let k = 0; k <= 6; k++) { const a = Math.PI * k / 6, g = box(.03, rr, .04); g.translate(0, rr / 2, 0); g.rotateZ(a - Math.PI / 2); g.translate(op.x, sp, z); add('frame', g); }
    const ring = new THREE.TorusGeometry(rr * .38, .02, 4, 16, Math.PI); ring.translate(op.x, sp, z); add('frame', ring); B('frame', op.w, .07, .08, op.x, sp, z); };
  const leaf = (k, x0, x1, y0, y1, z = z0 - .02) => B(k, x1 - x0, y1 - y0, .06, (x0 + x1) / 2, (y0 + y1) / 2, z, 0, .9);
  const step = () => B('dress', op.w + .5, PS.step, .42, op.x, PS.step / 2, .21);
  // the dressing round an opening: a cut-stone lintel, or a ring of voussoirs with a keystone over a round head
  if (fin.dress || op.dress) { const dk = fin.dressKey || 'dress';
    if (op.arch) { const rr = op.w / 2, s = new THREE.Shape(); s.absarc(op.x, spring, rr + .32, 0, Math.PI, false); s.lineTo(op.x - rr, spring); s.absarc(op.x, spring, rr, Math.PI, 0, true); s.lineTo(op.x + rr + .32, spring);
      const g = new THREE.ExtrudeGeometry(s, { depth: .05, bevelEnabled: false, curveSegments: 14 }); worldUV(g, .6); add(dk, g); B(dk, .3, .42, .09, op.x, spring + rr + .12, .03); }
    else if (op.kind !== 'shopwin' && op.kind !== 'shopdoor') B(dk, op.w + .36, .28, .06, op.x, top + .14, .02); }
  switch (op.kind) {
    case 'win': { glass(op.y); const s2 = op.sash !== false; const yb = op.arch ? spring : top; if (s2) { sash(op.y, (op.y + yb) / 2 + .02, ...op.bars, z0 + .02); sash((op.y + yb) / 2 - .02, yb, ...op.bars, z0 - .02); } else sash(op.y, yb, ...op.bars);
      if (op.arch) fan(); B(fin.sillKey || 'dress', op.w + .2, .08, inset + .1, op.x, op.y - .04, (-inset + .1) / 2); break; }
    case 'half': { // the Irish half-door: the lower leaf shut, the upper leaf open into the dark room
      const hl = 1.12; leaf(F.paint, l, r, op.y, op.y + hl); B('iron', op.w * .5, .04, .015, l + op.w * .25, op.y + .3, z0 + .02); B('iron', op.w * .5, .04, .015, l + op.w * .25, op.y + hl - .25, z0 + .02);
      const g = box(op.w, top - op.y - hl - .02, .06, .9); g.translate(op.w / 2, 0, 0); g.rotateY(1.25); g.translate(l, op.y + hl + (top - op.y - hl) / 2, z0 - .02); add(F.paint, g);
      B('frame', op.w + .02, .05, .1, op.x, op.y + hl, z0 + .03); step(); break; }
    case 'plank': { if (!op.ajar) /* Session 946: the temple's room hangs its own leaf, open */ leaf(op.paint || F.paint, l, r, op.y, spring); if (op.arch) glass(spring, 'glass'); for (const y of [.35, 1.6]) B('iron', op.w * .7, .05, .015, l + op.w * .35, op.y + y, z0 + .02); if (op.y < .3) step(); break; }
    case 'transom': { const tr = .42; if (!op.ajar) /* Session 893: a room inside hangs its own leaf, open */ leaf(F.paint, l, r, op.y, top - tr); glass(top - tr); sash(top - tr, top, 3, 1); B('iron', .05, .05, .06, r - .16, op.y + 1.05, z0 + .03); step(); break; }
    case 'fan': { leaf(F.paint, l, r, op.y, spring); for (const y of [.5, 1.35]) B(F.paint, op.w - .2, .5, .03, op.x, op.y + y, z0 + .02); glass(spring, 'glass'); fan();
      const kn = new THREE.TorusGeometry(.07, .015, 6, 14); kn.translate(op.x, op.y + 1.55, z0 + .03); add('iron', kn); step(); break; }
    case 'cart': case 'load': { const mid = op.x;
      if (op.open) { /* Session 929: a forge's doors stand open, each leaf swung back flat against the outer wall beside the opening */ const hw = op.w / 2;
        for (const [a, b] of [[l - hw, l - .02], [r + .02, r + hw]]) { B('board', b - a, spring - op.y, .06, (a + b) / 2, (op.y + spring) / 2, .05, 0, .9); for (const y of [.25, (spring - op.y) * .5, spring - op.y - .25]) B('iron', hw * .88, .07, .015, (a + b) / 2, op.y + y, .09); }
        break; }
      leaf('board', l, mid - .01, op.y, spring); leaf('board', mid + .01, r, op.y, spring); if (op.arch) { const s = outline({ ...op, y: spring - .001, h: top - spring + .001 }, new THREE.Shape()); const g = new THREE.ShapeGeometry(s, 12); g.translate(0, 0, z0 - .02); add('board', g); }
      for (const y of [.25, (spring - op.y) * .5, spring - op.y - .25]) { B('iron', op.w * .44, .07, .015, l + op.w * .22, op.y + y, z0 + .02); B('iron', op.w * .44, .07, .015, r - op.w * .22, op.y + y, z0 + .02); }
      if (op.kind === 'load') B('dress', op.w + .2, .1, inset + .1, op.x, op.y - .05, (-inset + .1) / 2); break; }
    case 'shopwin': { glass(op.y, 'glass'); sash(op.y, top, ...(op.bars || [4, 2])); B(F.paint, op.w + .1, op.y, .1, op.x, op.y / 2, z0 + .1); B('dress', op.w + .1, .08, inset + .12, op.x, op.y - .04, (-inset + .12) / 2); break; }
    case 'shopdoor': { const gl = op.y + 1.0; leaf(F.paint, l, r, op.y, gl); glass(gl); sash(gl, top - .5, 2, 2); sash(top - .5, top, 2, 1); step(); break; }
    case 'vent': { glass(op.y, 'glass'); sash(op.y, top, 1, 3); B('dress', op.w + .2, .08, inset + .1, op.x, op.y - .04, (-inset + .1) / 2); break; }
  }
}

// ── a roof as one solid slab: ridge along x, half-length L and half-depth D at the eaves, base ye, thickness t.
// hip: the ends slope too. smooth: normals averaged across the top (thatch reads round over the hips) ──
function roofSolid(L, D, pitch, t, hip, ye, smooth) {
  const tp = Math.tan(pitch), yr = ye + D * tp, tv = t / Math.cos(pitch), RL = hip ? Math.max(.01, L - D) : L, V = (x, y, z) => new THREE.Vector3(x, y, z);
  const b = { A: V(-L, ye, D), B: V(L, ye, D), C: V(L, ye, -D), D: V(-L, ye, -D), R0: V(-RL, yr, 0), R1: V(RL, yr, 0) }, T = {}; for (const k in b) T[k] = b[k].clone().setY(b[k].y + tv);
  const F = [];
  const top = (pts, hint) => F.push({ pts, hint, top: true }), bot = (pts, hint) => F.push({ pts, hint }), up = V(0, 1, 0);
  top([T.A, T.B, T.R1, T.R0], V(0, 1, 1)); top([T.C, T.D, T.R0, T.R1], V(0, 1, -1)); bot([b.A, b.B, b.R1, b.R0], V(0, -1, 0)); bot([b.C, b.D, b.R0, b.R1], V(0, -1, 0));
  bot([b.A, b.B, T.B, T.A], V(0, 0, 1)); bot([b.C, b.D, T.D, T.C], V(0, 0, -1));
  if (hip) { top([T.B, T.C, T.R1], V(1, 1, 0)); top([T.D, T.A, T.R0], V(-1, 1, 0)); bot([b.B, b.C, b.R1], V(0, -1, 0)); bot([b.D, b.A, b.R0], V(0, -1, 0)); bot([b.B, b.C, T.C, T.B], V(1, 0, 0)); bot([b.D, b.A, T.A, T.D], V(-1, 0, 0)); }
  else { bot([b.B, b.R1, T.R1, T.B], V(1, 0, 0)); bot([b.R1, b.C, T.C, T.R1], V(1, 0, 0)); bot([b.D, b.R0, T.R0, T.D], V(-1, 0, 0)); bot([b.R0, b.A, T.A, T.R0], V(-1, 0, 0)); }
  const pos = [], nor = [], uv = [], acc = new Map(), keyOf = v => v.x.toFixed(3) + ',' + v.y.toFixed(3) + ',' + v.z.toFixed(3), tops = [];
  for (const f of F) { let p = f.pts; const n = new THREE.Vector3().subVectors(p[1], p[0]).cross(new THREE.Vector3().subVectors(p[2], p[0])).normalize(); if (n.dot(f.hint) < 0) { p = [...p].reverse(); n.negate(); }
    const e = new THREE.Vector3().crossVectors(up, n); if (e.lengthSq() < 1e-6) e.set(1, 0, 0); e.normalize(); const s = new THREE.Vector3().crossVectors(n, e);
    for (let i = 1; i < p.length - 1; i++) for (const v of [p[0], p[i], p[i + 1]]) { pos.push(v.x, v.y, v.z); nor.push(n.x, n.y, n.z); uv.push(v.dot(e), v.dot(s)); if (f.top && smooth) { tops.push(pos.length / 3 - 1); const k = keyOf(v); acc.set(k, (acc.get(k) || V(0, 0, 0)).add(n)); } } }
  if (smooth) for (const i of tops) { const v = V(pos[i * 3], pos[i * 3 + 1], pos[i * 3 + 2]), n = acc.get(keyOf(v)).clone().normalize(); nor[i * 3] = n.x; nor[i * 3 + 1] = n.y; nor[i * 3 + 2] = n.z; }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); return { g, yr, tv, RL };
}
function scaleUV(g, s) { const u = g.attributes.uv; for (let i = 0; i < u.count; i++) u.setXY(i, u.getX(i) * s, u.getY(i) * s); return g; }

// a chimney stack: its shaft, a drip course and a cap, a pot per flue
function stack(bk, key, x, z, y0, y1, flues, alongZ = true) {
  const a = .72, b = .4 + .36 * flues, sx = alongZ ? a : b, sz = alongZ ? b : a, s = box(sx, y1 - y0, sz, .5); s.translate(x, (y0 + y1) / 2, z); bk.add(key, s);
  const dk = key.startsWith('w:') ? key : 'dress'; const c1 = box(sx + .14, .12, sz + .14); c1.translate(x, y1 - .42, z); bk.add(dk, c1); const c2 = box(sx + .1, .1, sz + .1); c2.translate(x, y1 + .05, z); bk.add(dk, c2);
  for (let i = 0; i < flues; i++) { const o = (i - (flues - 1) / 2) * .36, p = new THREE.CylinderGeometry(.11, .15, PS.pot, 10); p.translate(alongZ ? x : x + o, y1 + .1 + PS.pot / 2, alongZ ? z + o : z); bk.add('pot', p); }
}

// ── a building from its plan ──
// plan: { name, w, d, t, floors: [m], fin: {key, inset, plinth, quoins, dress, dressKey, sillKey}, paint, roof: {kind, pitch, hip, parapet, ov, ovg},
//   chim: [{x, flues, gable}], open: {front, back, left, right}, strings, cornice, shop, hoist, sign }
function building(P) {
  const M = glMats(), bk = bucket(), { w, d, t } = P, h = P.floors.reduce((a, b) => a + b, 0), roof = P.roof, p = roof.pitch * RAD, tp = Math.tan(p), thatch = roof.kind === 'thatch';
  const rt = thatch ? PS.thatchDepth : PS.slateDepth, tv = rt / Math.cos(p), di = d / 2 - t, park = .32;
  const F = { fin: P.fin, paint: 'p:' + (P.paint || 'green'), t, r: P.r || rnd }; // P.r: the lot's stream (Session 835); without one, the kit's stream
  const basis = (u, n, x, z) => new THREE.Matrix4().makeBasis(u, new THREE.Vector3(0, 1, 0), n).setPosition(x, 0, z);
  const MF = { front: basis(new THREE.Vector3(1, 0, 0), new THREE.Vector3(0, 0, 1), 0, d / 2), back: basis(new THREE.Vector3(-1, 0, 0), new THREE.Vector3(0, 0, -1), 0, -d / 2),
    right: basis(new THREE.Vector3(0, 0, -1), new THREE.Vector3(1, 0, 0), w / 2, 0), left: basis(new THREE.Vector3(0, 0, 1), new THREE.Vector3(-1, 0, 0), -w / 2, 0) };
  const rect = (hw, hh) => [[-hw, 0], [hw, 0], [hw, hh], [-hw, hh]];
  const gableTop = roof.hip ? rect(di, h) : roof.parapet ? [[-di, 0], [di, 0], [di, h + t * tp + tv + park], [0, h + d / 2 * tp + tv + park], [-di, h + t * tp + tv + park]] : [[-di, 0], [di, 0], [di, h + t * tp], [0, h + d / 2 * tp], [-di, h + t * tp]];
  const floorsAt = P.floors.slice(0, -1).reduce((a, f) => (a.push((a.at(-1) || 0) + f), a), []);
  for (const k of ['front', 'back']) face(bk, MF[k], { ...F, outline: rect(w / 2, h), open: P.open[k] || [], strings: P.strings ? floorsAt : [] });
  for (const k of ['left', 'right']) face(bk, MF[k], { ...F, outline: gableTop, open: P.open[k] || [], strings: [] });
  // the dark room behind every opening (P.interior, Session 852: left out when the rooms are built inside, rooms.js)
  if (!P.interior) { const g = new THREE.BoxGeometry(w - 2 * t + .04, h - .02, d - 2 * t + .04); g.translate(0, h / 2, 0); bk.add('dark', g); }
  // a footing under the ground line, so a building on a slope has no gap
  { const g = box(w + .1, .8, d + .1); g.translate(0, -.42, 0); bk.add(P.fin.key === 'rubble' ? 'rubble' : 'dress', g); }
  // quoins: dressed blocks wrapping each corner, long and short by turns
  if (P.fin.quoins) for (const sx of [-1, 1]) for (const sz of [-1, 1]) for (let k = 0, y = P.fin.plinth ? PS.plinth : .1; y < h - .2; k++, y += .34) {
    const a = k % 2 ? .3 : .55, b2 = k % 2 ? .55 : .3, g = box(a, .3, b2); g.translate(sx * (w / 2 - a / 2 + .03), y + .15, sz * (d / 2 - b2 / 2 + .03)); bk.add(P.fin.dressKey || 'dress', g); }
  // the eaves cornice of a town front
  if (P.cornice) for (const sz of [-1, 1]) { const g = box(w + .06, .26, .26); g.translate(0, h - .13, sz * (d / 2 + .08)); bk.add(P.fin.dressKey || 'dress', g); }
  // the roof
  const ov = roof.ov ?? (thatch ? .45 : .28), D = d / 2 + ov, ye = h - ov * tp, L = roof.hip ? w / 2 + ov : roof.parapet ? w / 2 - t * .5 : w / 2 + (roof.ovg ?? .3);
  const R = roofSolid(L, D, p, rt, roof.hip, ye, thatch); scaleUV(R.g, thatch ? .55 : .5); bk.add(thatch ? 'thatch' : 'slate', R.g);
  const ridgeY = R.yr + R.tv;
  if (thatch) { // the ridge: a roll, and a block-cut band with a scalloped lower edge down each slope, pinned with hazel liggers
    const RLr = roof.hip ? R.RL : L - .05, roll = new THREE.CylinderGeometry(.34, .34, RLr * 2 + (roof.hip ? .6 : .2), 14); roll.rotateZ(Math.PI / 2); scaleUV(roll, 3); roll.translate(0, ridgeY - .08, 0); bk.add('thatch', roll);
    for (const sz of [1, -1]) { const S = new THREE.Vector3(0, -Math.sin(p), sz * Math.cos(p)), N = new THREE.Vector3(0, Math.cos(p), sz * Math.sin(p)), X = new THREE.Vector3(-sz, 0, 0);
      const len = RLr * 2 + (roof.hip ? .4 : 0), n = Math.max(2, Math.round(len / .55)), s = new THREE.Shape(); s.moveTo(-len / 2, 0); s.lineTo(len / 2, 0);
      for (let i = n; i >= 0; i--) { const u = -len / 2 + len * i / n; s.lineTo(u, i % 2 ? .62 : .95); } s.lineTo(-len / 2, 0);
      const g = new THREE.ExtrudeGeometry(s, { depth: .1, bevelEnabled: true, bevelThickness: .04, bevelSize: .04, bevelSegments: 2 }); worldUV(g, .55);
      g.applyMatrix4(new THREE.Matrix4().makeBasis(X, S, N).setPosition(0, ridgeY - .12, 0)); bk.add('thatch', g);
      for (const y of [.12, .5]) { const lg = new THREE.CylinderGeometry(.018, .018, len, 5); lg.rotateZ(Math.PI / 2); lg.translate(0, 0, 0); lg.applyMatrix4(new THREE.Matrix4().makeBasis(new THREE.Vector3(1, 0, 0), S, N).setPosition(0, ridgeY - .12, 0).multiply(new THREE.Matrix4().makeTranslation(0, y, .14))); bk.add('board', lg); } }
  } else { // half-round clay ridge tiles, and on the hips; a cast-iron gutter and a downpipe
    const rl = new THREE.CylinderGeometry(.13, .13, (roof.hip ? R.RL : L) * 2 + .1, 10, 1, false); rl.rotateZ(Math.PI / 2); rl.translate(0, ridgeY + .02, 0); bk.add('ridge', rl);
    if (P.gutter !== false) for (const sz of [-1, 1]) { const gt = new THREE.CylinderGeometry(.075, .075, L * 2, 8); gt.rotateZ(Math.PI / 2); gt.translate(0, ye - .06, sz * (D - .03)); bk.add('iron', gt);
      const dp = new THREE.CylinderGeometry(.045, .045, ye, 8); dp.translate(sz * (w / 2 - .25), ye / 2, sz * (d / 2 + .07)); bk.add('iron', dp); }
  }
  // the gable parapets: coping along the slopes and a kneeler at each foot
  if (roof.parapet) for (const k of ['left', 'right']) { const Mf = MF[k], yTop = h + t * tp + tv + park, slope = (di) / Math.cos(p);
    for (const su of [-1, 1]) { const g = box(slope + .2, .14, t + .12); g.rotateZ(-su * p); g.translate(su * di / 2, yTop + di * tp / 2 + .07, -t / 2); g.applyMatrix4(Mf); bk.add('dress', g);
      const kn = box(t + .2, yTop - h + .3, .2 + t); kn.translate(su * (d / 2 - (t + .2) / 2 + .05), h + (yTop - h + .3) / 2, -t / 2); kn.applyMatrix4(Mf); bk.add('dress', kn); } }
  // chimneys: on a gable (in the wall) or on the ridge
  for (const c of P.chim || []) { const x = c.gable ? c.gable * (w / 2 - .36) : c.x, key = P.fin.key === 'rubble' ? 'rubble' : P.fin.stackKey || P.fin.key; stack(bk, key, x, 0, h - .6, ridgeY + (thatch ? 1.0 : .85), c.flues || 1, true); }
  // the shopfront: pilasters, a fascia with the name, a cornice
  if (P.shop) { const S = P.shop, Mf = MF.front, A = (k, w2, h2, d2, x, y, z) => { const g = box(w2, h2, d2, .5); g.translate(x, y, z); g.applyMatrix4(Mf); bk.add(k, g); };
    for (const sx of [-1, 1]) { A('p:' + S.paint, .38, S.top, .16, sx * (S.w / 2 - .19), S.top / 2, .08); A('dress', .48, .2, .22, sx * (S.w / 2 - .19), .1, .11); A('p:' + S.paint, .44, .22, .2, sx * (S.w / 2 - .19), S.top - .55, .1); }
    A('p:' + S.paint, S.w, .62, .14, 0, S.top + .26, .07); A('p:' + S.paint, S.w + .24, .14, .34, 0, S.top + .64, .17); A('iron', S.w + .2, .03, .3, 0, S.top + .72, .17);
    bk.mats = bk.mats || {}; bk.mats.fascia = signMat(S.name, '#1d3226', '#e3c26a'); const fg = new THREE.PlaneGeometry(S.w - .9, .46); fg.translate(0, S.top + .26, .145); fg.applyMatrix4(Mf); bk.add('fascia', fg); }
  // the hoist: a beam out of the gable over the loading doors, a pulley and a rope
  if (P.hoist) { const Mf = MF[P.hoist.face], y = P.hoist.y, A = (k, g) => { g.applyMatrix4(Mf); bk.add(k, g); };
    { const g = box(.26, .3, 1.9, .8); g.translate(0, y, .5); A('board', g); } { const g = box(1.2, .12, 1.1); g.rotateX(-.25); g.translate(0, y + .55, .7); A('slate', g); }
    { const g = new THREE.TorusGeometry(.16, .04, 6, 16); g.rotateY(Math.PI / 2); g.translate(0, y - .3, 1.2); A('iron', g); } { const g = new THREE.CylinderGeometry(.018, .018, 4.2, 5); g.translate(0, y - .3 - 2.1, 1.36); A('board', g); } }
  // a hanging trade sign on an iron bracket
  if (P.sign) { const S = P.sign, Mf = MF.front, A = (k, g) => { g.applyMatrix4(Mf); bk.add(k, g); };
    { const g = box(.05, .05, 1.15); g.translate(S.x, S.y, .58); A('iron', g); } { const g = box(.04, .5, .04); g.rotateX(.9); g.translate(S.x, S.y - .2, .2); A('iron', g); }
    bk.mats = bk.mats || {}; bk.mats.harp = harpMat(S.device); { const g = box(.06, .82, .66); g.translate(S.x, S.y - .5, .78); A('board', g); }
    for (const sx of [1, -1]) { const g = new THREE.PlaneGeometry(.6, .76); g.rotateY(sx * Math.PI / 2); g.translate(S.x + sx * .032, S.y - .5, .78); A('harp', g); } }
  // a carved name panel over a door: a dressed stone frame and the letters cut in its face (Session 964, the guild hall)
  if (P.plaque) { const S = P.plaque, Mf = MF[S.face || 'front'], A = (k, g) => { g.applyMatrix4(Mf); bk.add(k, g); };
    { const g = box(S.w + .24, S.h + .24, .12); g.translate(S.x, S.y + S.h / 2, .06); A(P.fin.dressKey || 'dress', g); } { const g = box(S.w + .4, .1, .2); g.translate(S.x, S.y + S.h + .17, .1); A(P.fin.dressKey || 'dress', g); }
    bk.mats = bk.mats || {}; bk.mats.plaque = panelMat(S.text, S.w / S.h); const g = new THREE.PlaneGeometry(S.w, S.h); g.translate(S.x, S.y + S.h / 2, .125); A('plaque', g); }
  // a banner on an iron pole out from the wall, hung flat across the street so it reads from along it (Session 964, the guild hall)
  if (P.banner) { const S = P.banner, Mf = MF[S.face || 'front'], A = (k, g) => { g.applyMatrix4(Mf); bk.add(k, g); };
    { const g = new THREE.CylinderGeometry(.03, .03, S.out, 8); g.rotateX(Math.PI / 2); g.translate(S.x, S.y, S.out / 2); A('iron', g); } { const g = box(.04, .7, .04); g.rotateX(.8); g.translate(S.x, S.y - .26, .22); A('iron', g); }
    { const g = new THREE.SphereGeometry(.05, 8, 6); g.translate(S.x, S.y, S.out); A('iron', g); } { const g = box(.14, .14, .03); g.translate(S.x, S.y, .015); A('iron', g); }
    { const g = new THREE.CylinderGeometry(.018, .018, S.w + .1, 6); g.rotateX(Math.PI / 2); g.translate(S.x, S.y - .05, S.out - .1 - S.w / 2); A('board', g); }
    bk.mats = bk.mats || {}; bk.mats.banner = bannerMat(S.colour, P.guild); const sh = new THREE.Shape(), hw = S.w / 2; sh.moveTo(-hw, 0); sh.lineTo(hw, 0); sh.lineTo(hw, -S.len); sh.lineTo(0, -S.len + .32); sh.lineTo(-hw, -S.len); sh.lineTo(-hw, 0);
    const g = new THREE.ShapeGeometry(sh); const uv = g.attributes.uv, pos = g.attributes.position; for (let i = 0; i < uv.count; i++) uv.setXY(i, (pos.getX(i) + hw) / S.w, 1 + pos.getY(i) / S.len); g.rotateY(Math.PI / 2); g.translate(S.x, S.y - .05, S.out - .1 - hw); A('banner', g); }
  const grp = finish(bk, P.name); grp.userData.plan = P; grp.userData.size = { w, d, eave: +h.toFixed(2), ridge: +(ridgeY).toFixed(2) };
  // where to stand a person: before the first door of the front (or the face named)
  const dface = P.doorFace || 'front', door = (P.open[dface] || []).find(o => /half|fan|transom|plank|shopdoor|cart/.test(o.kind));
  if (door) { const v = new THREE.Vector3(door.x + .9, 0, .9).applyMatrix4(MF[dface]); grp.userData.door = v; }
  return grp;
}

// ── the plans ──
const FIN = {
  lime: () => ({ key: 'w:lime', inset: .3, plinth: true, sillKey: 'w:lime', stackKey: 'w:lime' }),
  render: c => ({ key: 'w:' + c, inset: .16, quoins: true, dress: false, uv: .42 }),
  whiteTown: () => ({ key: 'w:lime', inset: .16, quoins: false, stackKey: 'w:lime' }),
  stone: () => ({ key: 'rubble', inset: .18, quoins: true, dress: true, uv: .8 }),
  ashlar: () => ({ key: 'ashlar', inset: .18, quoins: false, dress: true, uv: .32 }),
};
const win = (x, y, w, h, bars, o = {}) => ({ kind: 'win', x, y, w, h, bars, ...o });
const PLANS = {
  cottage: (o = {}) => ({ name: 'Cottage', w: 9.6, d: 5.4, t: PS.wall.cottage, floors: [PS.storey.cottage], fin: FIN.lime(), paint: o.paint || 'red',
    roof: { kind: 'thatch', pitch: PS.pitch.thatch, hip: !!o.hip, ov: .45, ovg: .35 }, chim: o.hip ? [{ x: -1.7 }, { x: 2.9 }] : [{ x: -1.7 }, { gable: 1 }],
    open: { front: [{ kind: 'half', x: -.6, y: 0, w: .95, h: 2.0 }, win(-3.2, .95, .78, 1.0, [2, 1]), win(1.5, .95, .78, 1.0, [2, 1]), win(3.4, .95, .78, 1.0, [2, 1])],
      back: [{ kind: 'plank', x: 1.2, y: 0, w: .9, h: 1.95 }, win(-2.4, 1.0, .7, .9, [2, 1])], left: o.hip ? [] : [win(0, 2.9, .5, .6, [1, 1], { sash: false })] } }),
  // the forge (Session 929, card F9; OG-043's Gatelands blacksmith): one high storey of bare rubble under slate, the forge's stack in the
  // west gable, a cart door 2.4 m wide standing open for a horse, a window by the anvil, one over the bench at the back, one in the east gable
  forge: (o = {}) => ({ name: 'Forge', w: 8.4, d: 6.0, t: PS.wall.cottage, floors: [3.2], fin: FIN.stone(), paint: o.paint || 'black',
    roof: { kind: 'slate', pitch: PS.pitch.slate + 2, parapet: true, ov: .28 }, chim: [{ gable: -1, flues: 1 }], sign: { x: -3.5, y: 2.75 }, doorFace: 'front',
    open: { front: [{ kind: 'cart', x: 1.2, y: 0, w: 2.4, h: 2.6, open: o.open !== false }, win(-2.2, 1.0, .9, 1.0, [2, 2], { sash: false })],
      back: [win(-1.4, 1.1, 1.0, .9, [2, 2], { sash: false })], right: [win(0, 1.2, .8, .9, [2, 2], { sash: false })] } }),
  // the temple (Session 946, card F9; OG-043's Gatelands temple, the canon's §4.1: six gods have temples, each with a statue): one
  // high storey of bare rubble walls 0.75 m thick under a steep slate roof, no chimney; a round-headed door in the west gable (left),
  // two round-headed slits a side, and a round-headed window high in the east gable over the god's statue
  temple: (o = {}) => ({ name: 'Temple', w: 9.6, d: 6.0, t: .75, floors: [3.8], fin: FIN.stone(), paint: o.paint || 'red',
    roof: { kind: 'slate', pitch: PS.pitch.slate + 14, ov: .28, ovg: .2 }, chim: [], doorFace: 'left', gutter: false,
    open: { left: [{ kind: 'plank', x: 0, y: 0, w: 1.15, h: 2.65, arch: true, ajar: !!o.ajar }],
      front: [-1.6, 2.0].map(x => win(x, 1.55, .42, 1.45, [1, 3], { sash: false, arch: true })), back: [-1.6, 2.0].map(x => win(x, 1.55, .42, 1.45, [1, 3], { sash: false, arch: true })),
      right: [win(0, 2.95, .6, 1.45, [1, 3], { sash: false, arch: true })] } }),
  // the guild hall (Session 964, card F6/F9; Michael's C on #352: a guild hall of its own, a wider hall open to the roof with a gallery to
  // the dormitory): rubble with dressed quoins under slate between parapets, 14.4 by 9.0 m, walls of 0.7 m, 6.4 m to the wall plate. The
  // hall fills the west end, open to the roof, its hearth in the west gable; the east end (from x 2.6) is two storeys, the dormitory over
  // the steward's rooms, and a gallery at the first floor (3.2 m) runs along the back wall from the stair to it. Outside that reads as:
  // a great round-headed door under a carved name panel and two tall round-headed lights in the hall's front, low windows under high
  // lights at the back (the gallery between them), two storeys of sashes at the east end, and the guild's banner on a pole where the hall
  // meets the east end (Session 1005: it hung at the panel's end and hid its last letter from the street to the east, the critic's s639).
  // o.guild: 'fighters' (red; the default) | 'mages' (blue).
  guildhall: (o = {}) => { const mages = o.guild === 'mages', g = [3.2, 3.2]; return { name: 'Guild hall', w: 14.4, d: 9.0, t: PS.wall.store, floors: g, fin: o.fin || FIN.stone(), paint: mages ? 'blue' : 'red', guild: mages ? 'mages' : 'fighters', hallX: 2.6,
    roof: { kind: 'slate', pitch: PS.pitch.store, parapet: true, ov: .3 }, chim: [{ gable: -1, flues: 2 }], doorFace: 'front',
    plaque: { x: -2.0, y: 3.75, w: 2.9, h: .62, text: mages ? 'MAGES’ GUILD' : 'FIGHTERS’ GUILD' }, banner: { x: 2.6, y: 5.5, out: 1.7, w: .95, len: 2.3, colour: mages ? '#24406e' : '#7a1d1a' },
    open: { front: [{ kind: 'plank', x: -2.0, y: 0, w: 1.6, h: 3.3, arch: true, dress: true, ajar: !!o.ajar }, ...[-5.4, 1.2].map(x => win(x, 1.25, 1.05, 3.7, [2, 5], { sash: false, arch: true })),
        ...[4.1, 6.0].flatMap(x => [win(x, .95, .9, 1.5, [3, 2]), win(x, g[0] + .55, .9, 1.35, [3, 2])])],
      // the back (u runs as -x): the cross-passage door opposite the great door, the hall's high lights over the gallery in three bays with
      // low windows under two of them, and the east end's two storeys of sashes as the front's
      back: [{ kind: 'plank', x: 2.6, y: 0, w: 1.0, h: 2.2 }, ...[0, 2.6, 5.2].map(x => win(x, g[0] + .85, .9, 1.85, [2, 3], { sash: false, arch: true })), ...[0, 5.2].map(x => win(x, 1.0, .9, 1.3, [2, 2])),
        ...[-4.1, -6.0].flatMap(x => [win(x, .95, .9, 1.5, [3, 2]), win(x, g[0] + .55, .9, 1.35, [3, 2])])],
      left: [-2.5, 2.5].map(x => win(x, 1.6, .75, 2.4, [1, 4], { sash: false, arch: true })),
      right: [-1.9, 1.9].flatMap(x => [win(x, .95, .9, 1.5, [3, 2]), win(x, g[0] + .55, .9, 1.35, [3, 2])])} }; },
  farmhouse: (o = {}) => ({ name: 'Farmhouse', w: 10.5, d: 6.2, t: PS.wall.house, floors: PS.storey.house, fin: o.fin || FIN.whiteTown(), paint: o.paint || 'green',
    roof: { kind: 'slate', pitch: PS.pitch.slate + 2, parapet: true, ov: .28 }, chim: [{ gable: -1, flues: 2 }, { gable: 1, flues: 2 }],
    open: { front: [{ kind: 'transom', x: 0, y: 0, w: 1.05, h: 2.5 }, win(-3.1, .85, .95, 1.5, [3, 2]), win(3.1, .85, .95, 1.5, [3, 2]), win(-3.1, 3.55, .9, 1.3, [3, 2]), win(0, 3.55, .9, 1.3, [3, 2]), win(3.1, 3.55, .9, 1.3, [3, 2])],
      back: [{ kind: 'plank', x: -1.5, y: 0, w: .95, h: 2.05 }, win(2, 1.0, .8, 1.2, [2, 2]), win(-1.5, 3.6, .8, 1.1, [2, 2])] } }),
  townhouse: (o = {}) => { const g = PS.storey.town; return { name: 'Townhouse', w: 6.4, d: 9, t: PS.wall.town, floors: g, fin: o.fin || FIN.render(o.color || 'ochre'), paint: o.paint || 'blue', strings: true, cornice: true,
    roof: { kind: 'slate', pitch: PS.pitch.slate, parapet: true, ov: .25 }, chim: [{ gable: -1, flues: 4 }, { gable: 1, flues: 4 }],
    open: { front: [{ kind: 'fan', x: o.doorX ?? -1.95, y: 0, w: 1.1, h: 2.95, arch: true, dress: true }, ...[0, 1.95].map(x => win((o.doorX ?? -1.95) < 0 ? x : -x, .75, .95, 1.85, [3, 2])),
      ...[-1.95, 0, 1.95].map(x => win(x, g[0] + .4, 1.0, 2.15, [3, 3])), ...[-1.95, 0, 1.95].map(x => win(x, g[0] + g[1] + .35, .95, 1.4, [3, 1]))],
      back: [{ kind: 'plank', x: 1.6, y: 0, w: .95, h: 2.1 }, win(-1.2, .9, .9, 1.6, [2, 2]), win(0, g[0] + .4, .9, 1.7, [2, 2]), win(0, g[0] + g[1] + .35, .9, 1.4, [2, 2])] } }; },
  merchant: (o = {}) => { const g = PS.storey.shop; return { name: 'Merchant’s house and shop', w: 8.4, d: 9, t: PS.wall.town, floors: g, fin: o.fin || FIN.render(o.color || 'cream'), paint: o.paint || 'green', strings: true, cornice: true,
    roof: { kind: 'slate', pitch: PS.pitch.slate, parapet: true, ov: .25 }, chim: [{ gable: -1, flues: 3 }, { gable: 1, flues: 3 }], shop: { w: 8.0, top: 2.9, paint: o.paint || 'green', name: o.trade || 'WOOL · LINEN · DRAPERY' },
    sign: { x: -4.0, y: g[0] + .55 }, doorFace: 'front',
    open: { front: [{ kind: 'shopwin', x: -1.05, y: .62, w: 4.6, h: 2.05, bars: [4, 2] }, { kind: 'shopdoor', x: 2.55, y: 0, w: 1.1, h: 2.65 }, ...[-2.9, -.95, .95, 2.9].map(x => win(x, g[0] + .4, .95, 1.95, [3, 3])), ...[-2.9, -.95, .95, 2.9].map(x => win(x, g[0] + g[1] + .35, .9, 1.35, [3, 1]))],
      back: [{ kind: 'plank', x: -2.2, y: 0, w: 1.0, h: 2.1 }, win(1.5, .9, .9, 1.6, [2, 2]), win(1.5, g[0] + .4, .9, 1.7, [2, 2])] } }; },
  warehouse: (o = {}) => { const g = PS.storey.store, ys = g.reduce((a, f) => (a.push((a.at(-1) ?? 0) + f), a), [0]); return { name: 'Warehouse', w: 12, d: 10, t: PS.wall.store, floors: g, fin: o.fin || FIN.stone(), paint: 'black',
    roof: { kind: 'slate', pitch: PS.pitch.store, parapet: true, ov: .3 }, chim: [], hoist: { face: 'right', y: ys[4] + .75 }, doorFace: 'right',
    open: { front: [0, 1, 2, 3].flatMap(s => [-4.4, -2.2, 0, 2.2, 4.4].map(x => win(x, ys[s] + (s ? .7 : 1.4), .8, 1.1, [2, 2], { sash: false }))),
      back: [0, 1, 2, 3].flatMap(s => [-3.3, 0, 3.3].map(x => win(x, ys[s] + (s ? .7 : 1.4), .8, 1.1, [2, 2], { sash: false }))),
      right: [{ kind: 'cart', x: 0, y: 0, w: 3.4, h: 4.1, arch: true }, ...[1, 2, 3].map(s => ({ kind: 'load', x: 0, y: ys[s] + .2, w: 1.5, h: 2.2 })), ...[0, 1, 2, 3].flatMap(s => [-2.9, 2.9].map(x => win(x, ys[s] + (s ? .7 : 1.4), .8, 1.1, [2, 2], { sash: false }))),
        { kind: 'vent', x: 0, y: ys[4] + 1.6, w: .8, h: 1.3, arch: true }],
      left: [0, 1, 2, 3].flatMap(s => [-2.9, 2.9].map(x => win(x, ys[s] + (s ? .7 : 1.4), .8, 1.1, [2, 2], { sash: false })))} }; },
};
// ── plans by bays (Session 1063, Michael's C on DECISION #396: the plans laid out by bays, the town's lots widened to whole bays).
// A bay is one window's width of front with its pier: 1.95 m in a town house (the townhouse's and the merchant's sashes stood 1.95 m
// apart), 2.4 m in a cottage (the cottage was four of them) and 3.1 m in a farmhouse (three). A plan of n bays is n bays plus an end
// pier at each corner: glBayWidth(kind, n). glBayPlan(kind, n, o) lays the plan's openings out on its bays, every storey's windows over
// one another, the door in a bay; o.d sets its depth. glBaysFor(kind, lotW) is the most whole bays a lot of that width takes, so a town
// can widen its lots to whole bays. The default plans (no bays) are kept as they were drawn. Copied from pieces.js (Session 1064).
const BAYS = { cottage: { bay: 2.4, end: 0, min: 2, max: 4 }, farmhouse: { bay: 3.1, end: .6, min: 2, max: 3 }, townhouse: { bay: 1.95, end: .3, min: 2, max: 5 }, merchant: { bay: 1.95, end: .3, min: 3, max: 5 } };
const bayWidth = (kind, n) => +(n * BAYS[kind].bay + 2 * BAYS[kind].end).toFixed(3);
const baysFor = (kind, lotW) => { const B = BAYS[kind]; return Math.max(B.min, Math.min(B.max, Math.floor((lotW - 2 * B.end) / B.bay + 1e-6))); };
function bayPlan(kind, n, o = {}) {
  const P = PLANS[kind](o), B = BAYS[kind]; n = Math.max(B.min, Math.min(B.max, n));
  const xs = Array.from({ length: n }, (_, k) => +((k - (n - 1) / 2) * B.bay).toFixed(3)), w = bayWidth(kind, n), last = xs[n - 1], but = x0 => xs.filter(x => Math.abs(x - x0) > .01);
  P.w = w; P.bays = n; P.bayX = xs; if (o.d) P.d = o.d; const O = P.open;
  if (kind === 'cottage') { const dx = xs[Math.floor((n - 1) / 2)], far = but(dx).at(-1);
    O.front = [{ kind: 'half', x: dx, y: 0, w: .95, h: 2.0 }, ...but(dx).map(x => win(x, .95, .78, 1.0, [2, 1]))]; O.back = [{ kind: 'plank', x: -dx, y: 0, w: .9, h: 1.95 }, win(-far, 1.0, .7, .9, [2, 1])];
    P.chim = n === 2 ? (o.hip ? [{ x: w / 2 - 1.0 }] : [{ gable: 1 }]) : o.hip ? [{ x: dx - 1.1 }, { x: w / 2 - 1.9 }] : [{ x: dx - 1.1 }, { gable: 1 }]; P.doorX = dx; }
  else if (kind === 'farmhouse') { const g = PS.storey.house, dx = n === 3 ? 0 : xs[0], up = g[0] + .65;
    O.front = [{ kind: 'transom', x: dx, y: 0, w: 1.05, h: 2.5 }, ...but(dx).map(x => win(x, .85, .95, 1.5, [3, 2])), ...xs.map(x => win(x, up, .9, 1.3, [3, 2]))];
    O.back = [{ kind: 'plank', x: -last * .5, y: 0, w: .95, h: 2.05 }, win(last * .65, 1.0, .8, 1.2, [2, 2]), win(-last * .5, up + .05, .8, 1.1, [2, 2])]; P.doorX = dx; }
  else if (kind === 'townhouse') { const g = PS.storey.town, dx = (o.doorX ?? -1) < 0 ? xs[0] : last, far = dx < 0 ? last : xs[0];
    O.front = [{ kind: 'fan', x: dx, y: 0, w: 1.1, h: 2.95, arch: true, dress: true }, ...but(dx).map(x => win(x, .75, .95, 1.85, [3, 2])), ...xs.map(x => win(x, g[0] + .4, 1.0, 2.15, [3, 3])), ...xs.map(x => win(x, g[0] + g[1] + .35, .95, 1.4, [3, 1]))];
    O.back = [{ kind: 'plank', x: -dx, y: 0, w: .95, h: 2.1 }, win(-far, .9, .9, 1.6, [2, 2]), win(0, g[0] + .4, .9, 1.7, [2, 2]), win(0, g[0] + g[1] + .35, .9, 1.4, [2, 2])]; P.doorX = dx; }
  else if (kind === 'merchant') { const g = PS.storey.shop, dx = last - .35, x0 = xs[0] - .45, x1 = dx - .55 - .45;
    O.front = [{ kind: 'shopwin', x: (x0 + x1) / 2, y: .62, w: x1 - x0, h: 2.05, bars: [Math.max(2, Math.round((x1 - x0) / 1.15)), 2] }, { kind: 'shopdoor', x: dx, y: 0, w: 1.1, h: 2.65 },
      ...xs.map(x => win(x, g[0] + .4, .95, 1.95, [3, 3])), ...xs.map(x => win(x, g[0] + g[1] + .35, .9, 1.35, [3, 1]))];
    O.back = [{ kind: 'plank', x: -dx, y: 0, w: 1.0, h: 2.1 }, win(-(xs[0] + .5), .9, .9, 1.6, [2, 2]), win(-(xs[0] + .5), g[0] + .4, .9, 1.7, [2, 2])];
    P.shop = { ...P.shop, w: w - .4 }; P.sign = { ...P.sign, x: -w / 2 + .2 }; P.doorX = dx; }
  return P;
}
// the Gatelands' lots (Session 835, Michael's A on #280: coloured towns). A town's lots are rendered in the earth colours,
// with dressed quoins, string courses and a cornice; no two neighbours share a colour, as in Kinsale or Dingle, and the
// door and sashes are painted in a colour that does not drown in the wall's. Cottages stay limewashed under thatch, farmhouses
// white under slate, and the warehouse bare stone (the decision's text). s.kind: 'townhouse' | 'merchant' | 'warehouse' |
// 'farmhouse' | 'cottage'; by default a town lot, one in four a merchant's house with a shop. Everything comes from streams
// keyed by the street and the lot, the windows lit at night among them (plan.r). -> { plan, kind, colour, paint }
const GL_TOWN = ['ochre', 'rose', 'cream', 'sage', 'blue', 'oxblood'];
const GL_CLASH = { blue: ['blue', 'teal'], oxblood: ['red'], rose: ['red'], sage: ['green', 'teal'], ochre: ['yellow'], cream: ['yellow'] };
function gatelandsLot(street, i, s = {}) {
  let c = hashKey(`${street}:colour`) % GL_TOWN.length;
  for (let j = 1; j <= i; j++) c = (c + 1 + Math.floor(stream(`${street}:colour:${j}`)() * (GL_TOWN.length - 1))) % GL_TOWN.length;
  const r = stream(`${street}:lot:${i}`), kind = s.kind || (r() < .25 ? 'merchant' : 'townhouse'), colour = GL_TOWN[c];
  const ok = Object.keys(PAINTS).filter(p => !(GL_CLASH[colour] || []).includes(p)), paint = ok[Math.floor(r() * ok.length)];
  // s.bays (Session 1064, from pieces.js's Session 1063): the plan laid out on that many bays (bayPlan), s.d its depth; without them, as drawn
  const opts = kind === 'cottage' ? { hip: r() < .33, paint: Object.keys(PAINTS)[Math.floor(r() * 6)] } : kind === 'farmhouse' ? { paint } : kind === 'warehouse' ? { fin: FIN.stone() }
    : kind === 'merchant' ? { color: colour, paint, trade: s.trade } : { color: colour, paint, doorX: i % 2 ? 1.95 : -1.95 };
  const plan = s.bays && BAYS[kind] ? bayPlan(kind, s.bays, { ...opts, d: s.d }) : PLANS[kind](opts);
  plan.r = stream(`${street}:windows:${i}`);
  const town = kind === 'townhouse' || kind === 'merchant';
  return { plan, kind, colour: town ? colour : kind === 'warehouse' ? 'stone' : 'lime', paint: town ? paint : plan.paint };
}

// the town church (Session 1127, card F6; Michael's B on DECISION #410: a square west tower). From pieces.js's Session 1087, its
// 'square' tower only: a nave of rubble 8.4 m wide with walls 0.9 m thick and 6.2 m to the eaves under the temple's steep slate, a lower
// chancel 7.2 by 6.2 m to the east with a two-light east window, and a west tower 5.6 m square of four stages, 18.4 m to its stepped
// merlons, the door in its foot. Two things the prototype did not have, so a town can find it room: o.bays, the nave's bays of 4.8 m
// (3, 16 m long as drawn, or 2, 11.2 m), and o.side, a round-headed south door in the nave's middle bay for a church that stands
// side-on to its street. The Group comes in its lot's frame: o.side, the nave along x and its south side (+z) the street; else
// end-on, the tower's west face to the street (+z) and the chancel behind. The footprint is centred on the origin.
// -> a Group, its userData {name, tris, calls, size: {w, d, eave, ridge, tower}, door: x along the front, parts}
function church(o = {}) {
  const r = o.r || stream('church'), t = .9, n = o.bays === 2 ? 2 : 3, nw = n * 4.8 + 1.6, nd = 8.4, nh = 6.2, cw = 7.2, cd = 6.2, ch = 5.0, pitch = PS.pitch.slate + 14, paint = o.paint || 'red';
  const lancet = (x, y = 2.3, w = .6, h = 2.5) => win(x, y, w, h, [1, 4], { sash: false, arch: true });
  const xs = Array.from({ length: n }, (_, k) => (k - (n - 1) / 2) * 4.8), mid = xs.length % 2 ? 0 : null;
  const south = o.side ? [{ kind: 'plank', x: mid ?? 0, y: 0, w: 1.5, h: 3.2, arch: true, dress: true }, ...xs.filter(x => mid === null ? Math.abs(x) > 1.5 : x !== 0).map(x => lancet(x))] : xs.map(x => lancet(x));
  const N = { name: 'Nave', w: nw, d: nd, t, floors: [nh], fin: FIN.stone(), paint, r, roof: { kind: 'slate', pitch, ov: .3, ovg: .25 }, chim: [], doorFace: o.side ? 'front' : 'left', gutter: false,
    open: { left: [lancet(0, 2.6, .5, 1.9)], front: south, back: xs.map(x => lancet(x)) } };
  const C = { name: 'Chancel', w: cw, d: cd, t: .8, floors: [ch], fin: FIN.stone(), paint, r, roof: { kind: 'slate', pitch, ov: .3, ovg: .25 }, chim: [], gutter: false,
    open: { right: [-.55, .55].map(x => lancet(x, 1.9, .55, 2.4)), front: [lancet(.9, 2.0, .5, 2.0)], back: [lancet(.9, 2.0, .5, 2.0)] } };
  const inner = new THREE.Group(), parts = [], add = (g, x) => { g.position.set(x, 0, 0); inner.add(g); parts.push(g); return g; };
  add(building(N), 0); add(building(C), nw / 2 + cw / 2 - t - .02);
  const s = 5.6, st = [4.4, 4.4, 4.4, 3.6], h = st.reduce((a, b) => a + b, 0), ys = st.reduce((a, f) => (a.push(a.at(-1) + f), a), [0]), vent = { kind: 'vent', x: 0, y: ys[3] + .7, w: .8, h: 1.7, arch: true };
  const T = { name: 'West tower', w: s, d: s, t: 1.1, floors: st, fin: FIN.stone(), paint, r, roof: { kind: 'slate', pitch: 24, hip: true, ov: -.6 }, chim: [], doorFace: 'left', gutter: false,
    open: { left: [{ kind: 'plank', x: 0, y: 0, w: 1.4, h: 3.1, arch: true, dress: true }, lancet(0, ys[1] + 1.2, .35, 1.3), lancet(0, ys[2] + 1.2, .35, 1.3), vent],
      front: [lancet(0, ys[2] + 1.2, .35, 1.3), vent], back: [lancet(0, ys[1] + 1.2, .35, 1.3), vent], right: [vent] } };
  const tg = building(T), bk = bucket(); // the parapet: a wall walk's breastwork, stepped merlons in the island's way
  for (const [ax, az, len] of [[0, s / 2, s], [0, -s / 2, s], [s / 2, 0, s], [-s / 2, 0, s]]) { const along = ax === 0; { const b = box(along ? len + .2 : .5, .7, along ? .5 : len + .2); b.translate(ax - Math.sign(ax) * .25, h + .35, az - Math.sign(az) * .25); bk.add('rubble', b); }
    for (let k = 0; k < 4; k++) { const u = -len / 2 + .55 + k * (len - 1.1) / 3; for (const [mw, mh, my] of [[.9, .5, h + .95], [.5, .4, h + 1.4]]) { const b = box(along ? mw : .5, mh, along ? .5 : mw); b.translate(along ? u : ax - Math.sign(ax) * .25, my, along ? az - Math.sign(az) * .25 : u); bk.add('dress', b); } } }
  const P = finish(bk, 'Parapet'); tg.add(...P.children); tg.userData.tris += P.userData.tris; tg.userData.calls += P.userData.calls; add(tg, -nw / 2 - s / 2 + .5);
  const x0 = -nw / 2 - s + .5, x1 = nw / 2 + cw - t - .02, L = x1 - x0, cx = (x0 + x1) / 2, G = new THREE.Group();
  inner.position.x = -cx; if (!o.side) { const W = new THREE.Group(); W.rotation.y = Math.PI / 2; W.add(inner); G.add(W); } else G.add(inner);
  const ud = { name: 'Church with a west tower', tris: 0, calls: 0, parts: parts.map(p => ({ name: p.userData.name, tris: p.userData.tris, calls: p.userData.calls })) };
  for (const p of parts) { ud.tris += p.userData.tris; ud.calls += p.userData.calls; }
  ud.size = o.side ? { w: +L.toFixed(2), d: nd, eave: nh, ridge: +(h + 1.6).toFixed(2) } : { w: nd, d: +L.toFixed(2), eave: nh, ridge: +(h + 1.6).toFixed(2) };
  ud.size.tower = { h: +(h + 1.6).toFixed(2), s, at: o.side ? +(x0 + s / 2 - cx).toFixed(2) : +(cx - x0 - s / 2).toFixed(2) };
  ud.door = o.side ? +(-cx).toFixed(2) : 0; ud.bays = n; ud.side = !!o.side; ud.plans = { N, C, T }; G.userData = ud; return G;
}
// a town's keep in its bawn (Session 1139, card F6; Michael's B on DECISION #416: the tower in its bawn). Copied from pieces.js's
// Session 1093 as it stands, all three kinds (the hall and the tower alone are the answers he did not take, kept so the copy stays the
// prototype's); the game builds 'bawn'. Its frame is the bawn's: its front wall on z = +11, the tower in the back west corner.
// a town's keep (Session 1093, card F6): the lord's seat in a Gatelands town, the steward's door (the game's 'castle' lot, 14 by 11 m).
// The island's own lord's house is the tower house (the ruin of Session 1052 is one fallen): four storeys of rubble, 11 by 8.5 m, walls
// 1.5 m thick and 13.4 m to the wall walk, on a battered plinth; a round-headed door of 1.2 by 2.6 m in dressed stone off-centre in the
// front with a machicolation over it at the walk; slits to the ground floor and the stair, small lights above, the hall's two-light
// windows on the top floor; a parapet of stepped merlons along the long sides, two corbelled bartizans at opposite corners, a steep slate
// roof inside the walk between gables that stand proud of it with coping, and a stack of two flues on each gable's apex.
// o.kind is the question asked of Michael (DECISION, Session 1093): 'tower' (the tower alone, on the lot as it is), 'bawn' (the tower in
// the back corner of a walled yard 26 by 22 m, walls 3.6 m and coped, a gateway of 3 by 3.4 m, a round flanker at each front corner and a
// house for the household against the east wall) or 'hall' (the tower with a hall range of two storeys, 13 by 7.5 m, against its east
// side, the lord's hall on its first floor in three tall lights). -> a Group, its userData {name, tris, calls, size, door, parts, kind}
const cylUV = (g, su, sv) => { const uv = g.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * su, uv.getY(i) * sv); return g; };
function keep(o = {}) {
  const kind = o.kind || 'tower', r = o.r || stream('keep'), G = new THREE.Group(), parts = [], add = (g, x, z, ry = 0) => { g.position.set(x, 0, z); g.rotation.y = ry; g.updateMatrix(); G.add(g); parts.push(g); return g; };
  const w = 11, d = 8.5, t = 1.5, fl = [3.6, 3.2, 3.2, 3.4], h = fl.reduce((a, b) => a + b, 0), ys = fl.reduce((a, f) => (a.push(a.at(-1) + f), a), [0]), pitch = 50, tp = Math.tan(pitch * RAD), dx = -2.2;
  const lead = { sash: false, frame: 'iron' }, slit = (x, y, hh = .95) => win(x, y, .2, hh, [1, 1], { ...lead, arch: true }), light = (x, y, ww = .5, hh = 1.0) => win(x, y, ww, hh, [1, 2], lead);
  const pair = (x, y) => [x - .5, x + .5].map(u => win(u, y, .45, 1.5, [1, 3], { ...lead, arch: true }));
  const T = { name: 'Tower house', w, d, t, floors: fl, fin: FIN.stone(), paint: o.paint || 'green', r, chim: [], gutter: false, doorFace: 'front',
    roof: { kind: 'slate', pitch, ov: -1.1, ovg: -t, ye: .2 },
    open: { front: [{ kind: 'plank', x: dx, y: 0, w: 1.2, h: 2.6, arch: true, dress: true, ajar: !!o.ajar }, slit(1.2, 1.1), slit(3.6, 1.1), light(dx, ys[1] + 1.0), light(2.4, ys[1] + .9), slit(dx + 1.3, ys[1] + .4, .8),
        light(-.4, ys[2] + .9, .55, 1.15), light(3.0, ys[2] + .9, .55, 1.15), ...pair(-2.2, ys[3] + .8), ...pair(2.4, ys[3] + .8)],
      back: [slit(-2.5, 1.2), slit(2.5, 1.2), light(0, ys[1] + 1.0), light(-3.0, ys[2] + .9, .55, 1.15), ...pair(.4, ys[3] + .8)],
      left: [slit(0, 1.3), light(1.2, ys[1] + 1.0), light(-1.0, ys[2] + .9), ...pair(0, ys[3] + .8)],
      right: [slit(-1.4, 1.3), slit(1.4, ys[1] + .5, .8), slit(-1.4, ys[2] + .5, .8), light(.6, ys[3] + .9, .55, 1.2)] } };
  const tower = building(T), bk = bucket();
  // the battered plinth: 0.5 m out at the ground, in to the wall's face at 1.5 m
  { const g = new THREE.BoxGeometry(w + 1.0, 1.5, d + 1.0), P = g.attributes.position; for (let i = 0; i < P.count; i++) if (P.getY(i) > 0) P.setXYZ(i, P.getX(i) * (w + .04) / (w + 1.0), P.getY(i), P.getZ(i) * (d + .04) / (d + 1.0)); g.translate(0, .75, 0); g.computeVertexNormals(); worldUV(g, .8); bk.add('rubble', g); }
  // the parapet: a breastwork 1 m high on the long walls' outer edge, returns along the gable ends to the gables, stepped merlons on it
  const pt = .5, py = h + .5;
  for (const sz of [-1, 1]) { { const g = box(w, 1.0, pt, .8); g.translate(0, py, sz * (d / 2 - pt / 2)); bk.add('rubble', g); } { const g = box(w + .1, .12, pt + .1); g.translate(0, h + 1.06, sz * (d / 2 - pt / 2)); bk.add('dress', g); }
    const n = 7; for (let k = 0; k < n; k++) { const x = -w / 2 + .55 + k * (w - 1.1) / (n - 1); for (const [mw, mh, my] of [[.9, .5, h + 1.37], [.5, .4, h + 1.82]]) { const g = box(mw, mh, pt); g.translate(x, my, sz * (d / 2 - pt / 2)); bk.add('dress', g); } }
    for (const sx of [-1, 1]) { const g = box(pt, 1.0, d / 2 - pt - (d / 2 - t) + .02, .8); g.translate(sx * (w / 2 - pt / 2), py, sz * ((d / 2 - pt + d / 2 - t) / 2)); bk.add('rubble', g); } }
  // the gables' coping, down each slope from the apex to the walk
  { const di = d / 2 - t, len = di / Math.cos(pitch * RAD); for (const sx of [-1, 1]) for (const su of [-1, 1]) { const g = box(t + .12, .16, len + .3); g.rotateX(su * pitch * RAD); g.translate(sx * (w / 2 - t / 2), h + t * tp + di * tp / 2 + .1, su * di / 2); bk.add('dress', g); }
    for (const sx of [-1, 1]) stack(bk, 'rubble', sx * (w / 2 - .75), 0, h + 3.4, h + (d / 2) * tp + 1.3, 2, true); }
  // the bartizans: round turrets corbelled out at the front east and the back west corners, a ring of merlons on each
  for (const [sx, sz] of [[1, 1], [-1, -1]]) { const R = .95, cx = sx * (w / 2 - .25), cz = sz * (d / 2 - .25);
    { const g = new THREE.CylinderGeometry(R, .25, 1.6, 16, 1); cylUV(g, 2 * Math.PI * R * .8, 1.6 * .8); g.translate(cx, h - .8, cz); bk.add('rubble', g); }
    { const g = new THREE.CylinderGeometry(R, R, 1.1, 16, 1, true); cylUV(g, 2 * Math.PI * R * .8, 1.1 * .8); g.translate(cx, h + .55, cz); bk.add('rubble', g); }
    { const g = new THREE.CircleGeometry(R - .04, 16); g.rotateX(-Math.PI / 2); g.translate(cx, h + .08, cz); bk.add('rubble', g); }
    for (let k = 0; k < 6; k++) { const a = k * Math.PI / 3 + .3, g = box(.42, .55, .34); g.rotateY(a); g.translate(cx + Math.sin(a) * (R - .17), h + 1.37, cz + Math.cos(a) * (R - .17)); bk.add('dress', g); }
    { const a = Math.atan2(sx, sz), g = box(.12, .7, .05); g.rotateY(a); g.translate(cx + Math.sin(a) * (R + .01), h + .5, cz + Math.cos(a) * (R + .01)); bk.add('glass', g); } }
  // the machicolation over the door: a box on three corbels out from the parapet, its floor open over the step
  { const z = d / 2; { const g = box(1.9, 1.1, .75, .8); g.translate(dx, h + .45, z + .37); bk.add('rubble', g); } { const g = box(1.9, .5, .45); g.translate(dx, h + 1.25, z + .5); bk.add('dress', g); }
    for (const u of [-.8, 0, .8]) { const g = box(.26, .55, .72); g.translate(dx + u, h - .35, z + .36); bk.add('dress', g); }
    { const g = new THREE.PlaneGeometry(1.4, .4); g.rotateX(Math.PI / 2); g.translate(dx, h - .1, z + .45); bk.add('dark', g); } }
  const trim = finish(bk, 'Parapet, bartizans and machicolation'); tower.add(...trim.children); tower.userData.tris += trim.userData.tris; tower.userData.calls += trim.userData.calls;
  const top = +(h + (d / 2) * tp + 1.3 + .1 + PS.pot).toFixed(2);
  let door = tower.userData.door.clone(), size = { w, d, eave: h, ridge: top, walk: h, tower: { w, d, walk: h, ridge: tower.userData.size.ridge } }, gate = null;
  if (kind === 'tower') add(tower, 0, 0);
  else if (kind === 'bawn') { // the tower in the back west corner of a walled yard; the bawn's front on the lot's front line
    const bw = 26, bd = 22, bt = .9, bh = 3.6, tx = -bw / 2 + w / 2, tz = -bd / 2 + d / 2; add(tower, tx, tz); door.add(new THREE.Vector3(tx, 0, tz));
    const b2 = bucket(), FS = FIN.stone(), gx = 1.0, gw = 3.0, gh = 3.4;
    face(b2, new THREE.Matrix4().makeTranslation(0, 0, bd / 2), { fin: FS, paint: 'p:' + T.paint, t: bt, r, outline: [[-bw / 2, 0], [bw / 2, 0], [bw / 2, bh], [-bw / 2, bh]], open: [{ kind: 'cart', x: gx, y: 0, w: gw, h: gh, arch: true, open: true }], strings: [] });
    { const c = box(bw + .1, .16, bt + .16); c.translate(0, bh + .08, bd / 2 - bt / 2); b2.add('dress', c); }
    // the side and back walls, the back and west ones from the tower's faces
    for (const [x0, z0, x1, z1] of [[-bw / 2, bd / 2 - bt, -bw / 2, -bd / 2 + d], [bw / 2, bd / 2 - bt, bw / 2, -bd / 2], [-bw / 2 + w, -bd / 2, bw / 2, -bd / 2]]) {
      const along = z0 === z1, L = along ? x1 - x0 : z0 - z1, cx = along ? (x0 + x1) / 2 : x0 - Math.sign(x0) * bt / 2, cz = along ? z0 + bt / 2 : (z0 + z1) / 2;
      const wl = box(along ? L : bt, bh, along ? bt : L, .8); wl.translate(cx, bh / 2, cz); b2.add('rubble', wl); const c = box(along ? L + .1 : bt + .16, .16, along ? bt + .16 : L + .1); c.translate(cx, bh + .08, cz); b2.add('dress', c);
      const f = box(along ? L : bt + .1, .8, along ? bt + .1 : L); f.translate(cx, -.42, cz); b2.add('rubble', f); }
    // the flankers: round towers of 6.5 m at the front corners, slits on the field and a parapet ring
    for (const sx of [-1, 1]) { const R = 2.1, fh = 6.5, cx = sx * (bw / 2 - .4), cz = bd / 2 - .4;
      { const g = new THREE.CylinderGeometry(R, R + .15, fh, 24, 1); cylUV(g, 2 * Math.PI * R * .8, fh * .8); g.translate(cx, fh / 2, cz); b2.add('rubble', g); }
      { const g = new THREE.CylinderGeometry(R + .08, R + .08, .14, 24); g.translate(cx, fh + .07, cz); b2.add('dress', g); }
      for (let k = 0; k < 8; k++) { const a = k * Math.PI / 4, g = box(.6, .55, .4); g.rotateY(a); g.translate(cx + Math.sin(a) * (R - .15), fh + .42, cz + Math.cos(a) * (R - .15)); b2.add('dress', g); }
      for (const [a, y] of [[0, 1.4], [sx * Math.PI / 2, 1.4], [sx * Math.PI / 4, 4.3]]) { const g = box(.16, .8, .05); g.rotateY(a); g.translate(cx + Math.sin(a) * (R + .09), y, cz + Math.cos(a) * (R + .09)); b2.add('glass', g); } }
    // the well in the yard: a dressed ring and a windlass
    { const g = new THREE.CylinderGeometry(.85, .9, .8, 18, 1, true); g.translate(4, .4, -2); b2.add('dress', g); const c = new THREE.CircleGeometry(.8, 18); c.rotateX(-Math.PI / 2); c.translate(4, .35, -2); b2.add('dark', c);
      for (const sx of [-1, 1]) { const p = box(.12, 1.6, .12); p.translate(4 + sx * .8, .8, -2); b2.add('board', p); } const a = new THREE.CylinderGeometry(.08, .08, 1.8, 8); a.rotateZ(Math.PI / 2); a.translate(4, 1.45, -2); b2.add('board', a); }
    const yard = finish(b2, 'Bawn wall, gate and flankers'); add(yard, 0, 0);
    // the household's house against the east wall, its door and windows on the yard
    const Hh = { name: 'Bawn house', w: 12, d: 5.5, t: .6, floors: [3.0], fin: FIN.stone(), paint: T.paint, r, roof: { kind: 'slate', pitch: PS.pitch.slate + 2, ov: .3, ovg: .25 }, chim: [{ gable: 1, flues: 1 }], gutter: false, doorFace: 'front',
      open: { front: [{ kind: 'plank', x: -1.2, y: 0, w: 1.0, h: 2.1 }, ...[-4.2, 1.6, 4.2].map(x => win(x, .95, .8, 1.1, [2, 2], lead))], back: [] } };
    add(building(Hh), bw / 2 - bt - 5.5 / 2, 1.5, -Math.PI / 2);
    gate = { x: gx, w: gw, h: gh, z: bd / 2 }; size = { ...size, w: bw, d: bd, eave: bh, bawn: { w: bw, d: bd, t: bt, h: bh }, gate };
    door = new THREE.Vector3(gx + .9, 0, bd / 2 + .9);
  } else { // the hall range: two storeys against the tower's east face, its front flush with the tower's
    add(tower, 0, 0); const hw = 13, hd = 7.5, hf = [3.2, 3.0];
    const Hp = { name: 'Hall range', w: hw, d: hd, t: .9, floors: hf, fin: { ...FIN.stone(), quoins: false }, paint: T.paint, r, roof: { kind: 'slate', pitch: PS.pitch.store + 2, parapet: true, ov: .3 }, chim: [{ gable: 1, flues: 2 }], gutter: false, doorFace: 'front', interior: false,
      open: { front: [{ kind: 'plank', x: -3.8, y: 0, w: 1.3, h: 2.8, arch: true, dress: true, ajar: !!o.ajar }, ...[-1.0, 2.0, 5.0].map(x => win(x, 1.1, .7, 1.0, [2, 2], lead)), ...[-1.0, 2.0, 5.0].map(x => win(x, hf[0] + .7, .9, 2.1, [2, 4], { ...lead, arch: true }))],
        back: [{ kind: 'plank', x: 3.0, y: 0, w: 1.0, h: 2.2 }, ...[-2.0, 1.5].map(x => win(x, hf[0] + .7, .9, 2.1, [2, 4], { ...lead, arch: true }))], right: [win(0, hf[0] + .9, .7, 1.4, [2, 3], lead)] } };
    const hall = add(building(Hp), w / 2 + hw / 2 - .02, (d - hd) / 2); door = hall.userData.door.clone().add(hall.position);
    size = { ...size, w: +(w + hw - .02).toFixed(2), hall: hall.userData.size };
  }
  const ud = { name: { tower: 'Keep: a tower house', bawn: 'Keep: a tower house in its bawn', hall: 'Keep: a tower house and hall' }[kind], kind, tris: 0, calls: 0, parts: parts.map(p => ({ name: p.userData.name, tris: p.userData.tris, calls: p.userData.calls })) };
  for (const p of parts) { ud.tris += p.userData.tris; ud.calls += p.userData.calls; }
  ud.size = size; ud.door = door; ud.towerDoor = T.open.front[0]; G.userData = ud; return G;
}
// ── the rooms, copied from docs/prototypes/levelup/rooms.js (card F9; Session 1157 copies the Gatelander inn of Session 893, Michael's
// 2 A on #320). A room is built inside the very shell the street builds (building(plan) with plan.interior), in metres, the shell's
// centre on the ground and its front +z. Copy it again from there when the prototype changes; only the names below differ:
// mats() → roomMats(), GL_PLANS → PLANS, gatelandsBuilding → building. ──
let RMAT = null;
function roomMats() {
  if (RMAT) return RMAT; const G = glMats();
  RMAT = { lime: G['w:lime'], rubble: G.rubble, flag: mat('flag', { ns: 1.1, color: 0x9a968c, rough: .7 }), earth: mat('rock', { ns: .6, color: 0x6a5a48, rough: 1 }),
    oak: mat('wood', { ns: 1.0, color: 0x6a4a30, rough: .7 }), deal: mat('wood', { ns: .8, color: 0xb08a5c, rough: .75 }), paint: mat('wood', { ns: .6, color: 0x3e6a5a, rough: .6 }),
    delft: new THREE.MeshStandardMaterial({ color: 0xe8ecf2, roughness: .3 }), blue: new THREE.MeshStandardMaterial({ color: 0x2a4a8a, roughness: .35 }), crock: new THREE.MeshStandardMaterial({ color: 0x9a6a3a, roughness: .5 }),
    iron: new THREE.MeshStandardMaterial({ color: 0x1a1918, roughness: .5, metalness: .6 }), straw: mat('thatch', { ns: .8, color: 0xd8b878, rough: 1 }), wool: mat('plaster', { ns: .4, color: 0x8a3a2a, rough: 1 }),
    linen: mat('plaster', { ns: .3, color: 0xe2dccc, rough: 1 }), turf: mat('rock', { ns: 1.4, color: 0x3a2a1c, rough: 1 }), soot: new THREE.MeshStandardMaterial({ color: 0x141210, roughness: 1 }),
    ember: new THREE.MeshStandardMaterial({ color: 0x2a0e04, emissive: new THREE.Color(1, .42, .12), emissiveIntensity: 3, roughness: 1 }), flame: new THREE.MeshStandardMaterial({ color: 0xffb060, emissive: new THREE.Color(1, .6, .22), emissiveIntensity: 5, transparent: true, opacity: .85, depthWrite: false }),
    pane: new THREE.MeshStandardMaterial({ color: 0xc8d4dc, roughness: .05, metalness: 0, transparent: true, opacity: .14, depthWrite: false }),
    glow: new THREE.MeshStandardMaterial({ color: 0x302010, emissive: new THREE.Color(1, .7, .36), emissiveIntensity: 2.4, roughness: .5 }) };
  return RMAT;
}
function gatelandsInn(o = {}, r = stream('inn')) {
  const plan = PLANS.farmhouse({ paint: o.paint || 'green' }); plan.interior = true; plan.r = stream('inn-shell'); plan.open.front[0].ajar = true;
  const shell = building(plan), M = roomMats(), B = new Map(), boxes = [], t = plan.t, X = plan.w / 2 - t, Z = plan.d / 2 - t, F0 = .05, F1 = plan.floors[0], EAVE = plan.floors[0] + plan.floors[1], CEIL = EAVE - .12;
  const put = (geo, key, x = 0, y = 0, z = 0, ry = 0, uv = .6) => { const g = geo.index ? geo.toNonIndexed() : geo; for (const k of Object.keys(g.attributes)) if (!['position', 'normal'].includes(k)) g.deleteAttribute(k);
    g.applyMatrix4(new THREE.Matrix4().compose(new THREE.Vector3(x, y, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(0, ry, 0)), new THREE.Vector3(1, 1, 1))); worldUV(g, uv); if (!B.has(key)) B.set(key, []); B.get(key).push(g); return g; };
  const bx = (key, x0, x1, y0, y1, z0, z1, tag, fl) => { put(new THREE.BoxGeometry(x1 - x0, y1 - y0, z1 - z0), key, (x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2); if (tag) boxes.push({ tag, x0, x1, y0, y1, z0, z1, fl }); };
  // the taproom's floor: flags in courses
  for (let z = -Z, row = 0; z < Z - .05; row++) { const d = Math.min(Z - z, .55 + r() * .35); for (let x = -X; x < X - .05;) { const w = Math.min(X - x, .6 + r() * .45); put(new THREE.BoxGeometry(w - .02, .05, d - .02), 'flag', x + w / 2, .025 + (r() - .5) * .006, z + d / 2, (r() - .5) * .01, .7); x += w; } z += d; }
  // the hearth in the west gable under its stack: a breast 0.5 m proud, the opening 1.6 by 1.3 m sooted, an oak lintel, a hearthstone
  const hw = 1.6, hh = 1.3, BD = .5, hx = -X; { const z0 = -hw / 2 - .4, z1 = hw / 2 + .4; bx('lime', hx, hx + BD, hh, F1 - .45, z0, z1); bx('lime', hx, hx + BD, 0, hh, z0, -hw / 2, 'breast', 0); bx('lime', hx, hx + BD, 0, hh, hw / 2, z1, 'breast', 0);
    bx('soot', hx, hx + .02, 0, hh, -hw / 2, hw / 2); bx('soot', hx, hx + BD, hh - .02, hh, -hw / 2, hw / 2); bx('oak', hx + BD - .3, hx + BD + .08, hh, hh + .24, -hw / 2 - .25, hw / 2 + .25); bx('flag', hx + BD, hx + BD + .8, F0, F0 + .03, -hw / 2, hw / 2, 'hearthstone', 0); }
  const fx = hx + .28, fire = [fx + .05, .32, 0]; for (let i = 0; i < 7; i++) { const a = i / 7 * Math.PI * 2; put(new THREE.BoxGeometry(.24, .1, .12), 'turf', fx + Math.cos(a) * .15, .06 + (i % 2) * .08, Math.sin(a) * .22, a + 1.3); }
  put(new THREE.SphereGeometry(.16, 10, 6).scale(1.2, .4, 1.4), 'ember', fx, .08, 0); for (let i = 0; i < 3; i++) put(new THREE.ConeGeometry(.07, .28 + i * .06, 7), 'flame', fx + (i - 1) * .04, .26, (i - 1) * .09);
  { const cx = hx + .06, cz = -hw / 2 + .08; bx('iron', cx - .02, cx + .02, .2, 1.15, cz - .02, cz + .02); put(new THREE.BoxGeometry(.03, .03, .75), 'iron', cx + .02, 1.05, cz + .37); put(new THREE.CylinderGeometry(.008, .008, .4, 4), 'iron', cx + .02, .85, cz + .62);
    put(new THREE.SphereGeometry(.17, 14, 10, 0, Math.PI * 2, .35, Math.PI - .35), 'iron', cx + .2, .55, cz + .62); }
  // the settle facing the fire, two stools beside it
  const settle = { x0: hx + BD + 1.6, x1: hx + BD + 2.1, z0: -1.0, z1: .9, y: F0 + .44 }; bx('oak', settle.x0, settle.x1, F0, settle.y, settle.z0, settle.z1, 'settle', 0); bx('oak', settle.x1 - .08, settle.x1, settle.y, F0 + 1.35, settle.z0, settle.z1); for (const z of [settle.z0, settle.z1 - .06]) bx('oak', settle.x0, settle.x1, settle.y, F0 + .75, z, z + .06);
  bx('wool', settle.x0 + .02, settle.x1 - .1, settle.y, settle.y + .04, settle.z0 + .1, settle.z1 - .1);
  const seats = [settle.y - F0]; for (const [x, z] of [[hx + BD + 1.0, 1.35], [hx + BD + 1.0, -1.45]]) { bx('deal', x - .17, x + .17, F0 + .41, F0 + .45, z - .17, z + .17, 'stool', 0); for (const a of [0, 2.1, 4.2]) put(new THREE.CylinderGeometry(.018, .022, .41, 6), 'deal', x + Math.cos(a) * .11, F0 + .205, z + Math.sin(a) * .11); seats.push(.45 - .05 + .05); }
  // the bar across the back wall, between the back window (x = -2) and the back door (x = 1.5): a counter of oak boards, a rack of kegs
  // behind it against the wall, jugs and tankards on the counter, a lantern from the beam over it
  const bar = { x0: -1.35, x1: .75, z0: -Z + .95, z1: -Z + 1.5, y: F0 + 1.05 }; bx('oak', bar.x0, bar.x1, F0, bar.y - .05, bar.z0, bar.z1, 'bar', 0); bx('deal', bar.x0 - .04, bar.x1 + .04, bar.y - .05, bar.y, bar.z0 - .04, bar.z1 + .04);
  bx('oak', bar.x0 + .1, bar.x1 - .1, F0, F0 + .45, -Z, -Z + .55, 'rack', 0); for (let x = bar.x0 + .4, k = 0; x < bar.x1 - .25; x += .62, k++) { const g = new THREE.CylinderGeometry(.24, .24, .5, 14); g.rotateX(Math.PI / 2); put(g, 'oak', x, F0 + .45 + .24, -Z + .27); put(new THREE.CylinderGeometry(.03, .03, .08, 6).rotateX(Math.PI / 2), 'iron', x, F0 + .5, -Z + .55); }
  bx('deal', bar.x0, bar.x1, F0 + 1.7, F0 + 1.73, -Z, -Z + .28); for (let x = bar.x0 + .15; x < bar.x1 - .1; x += .22) put(new THREE.CylinderGeometry(.05, .06, .18, 10), x % .44 < .22 ? 'crock' : 'delft', x, F0 + 1.82, -Z + .14);
  for (let k = 0; k < 4; k++) put(new THREE.CylinderGeometry(.045, .045, .14, 10), k % 2 ? 'crock' : 'iron', bar.x0 + .4 + k * .4, bar.y + .07, (bar.z0 + bar.z1) / 2);
  // the stair up the east gable wall: 16 risers from the flags to the upper floor, going 0.25, its landing in the back corner
  const N = 16, rise = (F1 - F0) / N, going = .25, SX0 = X - .9, LZ = -Z + .75, SZ0 = LZ + (N - 1) * going /* the foot */;
  for (let k = 1; k < N; k++) bx('oak', SX0, X, F0, F0 + k * rise, SZ0 - k * going, SZ0 - (k - 1) * going, 'stair', 0);
  bx('oak', SX0, X, F0, F1 - .2, -Z, LZ, 'landing', 0);
  const kmax = Math.floor((F1 - .42 - F0 - 2.0) / rise) /* 2 m under the beams over the stair's foot */, well = { x0: SX0, x1: X, z0: LZ, z1: SZ0 - kmax * going };
  // the upper floor: deal boards on oak beams across the house every 0.9 m, open over the stair; a boarded ceiling under the slate
  for (const [a0, a1, b0, b1] of [[-X, SX0, -Z, Z], [SX0, X, -Z, well.z0], [SX0, X, well.z1, Z]]) { bx('oak', a0, a1, F1 - .2, F1 - .04, b0, b1); bx('deal', a0, a1, F1 - .04, F1, b0, b1); }
  const beams = []; for (let x = -X + .55; x < X - .2; x += .9) { const over = x > well.x0 - .12; bx('oak', x - .09, x + .09, F1 - .42, F1 - .2, -Z, over ? well.z0 : Z); if (over) bx('oak', x - .09, x + .09, F1 - .42, F1 - .2, well.z1, Z); beams.push(x); }
  bx('deal', -X, X, CEIL, CEIL + .04, -Z, Z); for (let x = -X + .55; x < X - .2; x += 1.2) bx('oak', x - .07, x + .07, CEIL - .16, CEIL, -Z, Z);
  // the tables: one before the front window east of the door, one by the hearth side; benches along their long sides
  const tables = [], benches = []; for (const [tx, tz] of [[2.1, .45], [-1.2, 1.4]]) { const T = { x0: tx - .8, x1: tx + .8, z0: tz - .38, z1: tz + .38, y: F0 + .76 }; bx('deal', T.x0, T.x1, T.y - .05, T.y, T.z0, T.z1, 'table', 0);
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) bx('oak', tx + sx * .7 - .04, tx + sx * .7 + .04, F0, T.y - .05, tz + sz * .28 - .04, tz + sz * .28 + .04); tables.push(T);
    for (const sz of tx > 0 ? [-1, 1] : [-1]) { const bz = tz + sz * .62; bx('oak', tx - .75, tx + .75, F0 + .41, F0 + .45, bz - .15, bz + .15, 'bench', 0); for (const sx of [-1, 1]) bx('oak', tx + sx * .65 - .03, tx + sx * .65 + .03, F0, F0 + .41, bz - .12, bz + .12); benches.push(.45); }
    put(new THREE.CylinderGeometry(.012, .014, .14, 8), 'linen', tx + .2, T.y + .07, tz); put(new THREE.SphereGeometry(.012, 6, 5).scale(1, 2, 1), 'flame', tx + .2, T.y + .155, tz); }
  const lamp = [(bar.x0 + bar.x1) / 2, F1 - .95, bar.z1 + .3]; bx('iron', lamp[0] - .005, lamp[0] + .005, lamp[1] + .1, F1 - .42, lamp[2] - .005, lamp[2] + .005); put(new THREE.CylinderGeometry(.08, .09, .22, 6), 'glow', ...lamp); put(new THREE.ConeGeometry(.1, .1, 6), 'iron', lamp[0], lamp[1] + .16, lamp[2]);
  // upstairs: the rail round the well, a passage along the back wall, three rooms off it behind deal partitions with doors
  const PZ = -Z + 1.2, top = F1 + .95; { for (const [x0, z0, x1, z1] of [[well.x0, well.z0 + .1, well.x0, well.z1], [well.x0, well.z1, X, well.z1]]) { bx('oak', Math.min(x0, x1) - .04, Math.min(X, Math.max(x0, x1) + .04), top, top + .06, Math.min(z0, z1) - .04, Math.max(z0, z1) + .04, 'wellrail', 1);
      const n = Math.max(1, Math.round(Math.hypot(x1 - x0, z1 - z0) / .9)); for (let k = 0; k <= n; k++) { const x = x0 + (x1 - x0) * k / n, z = z0 + (z1 - z0) * k / n; bx('oak', x - .04, x + .04, F1, top, z - .04, z + .04); } } }
  const RX = [-X, -1.45, 1.65, SX0 - .1], rooms = [], wallK = 'deal';
  { const doorAt = i => (RX[i] + RX[i + 1]) / 2 + (i === 2 ? -.4 : 0), dw = .8, dh = 1.95;
    /* the passage's wall, along z = PZ from the west gable to the well, a door into each room */ for (let i = 0; i < 3; i++) { const dx = doorAt(i), a = RX[i] + (i ? .04 : 0), b = RX[i + 1] - .04; bx(wallK, a, dx - dw / 2, F1, CEIL, PZ - .04, PZ + .04, 'partition', 1); bx(wallK, dx + dw / 2, b, F1, CEIL, PZ - .04, PZ + .04, 'partition', 1); bx(wallK, dx - dw / 2, dx + dw / 2, F1 + dh, CEIL, PZ - .04, PZ + .04);
      rooms.push({ x0: RX[i], x1: RX[i + 1], door: { x: dx, z: PZ, w: dw, h: dh } }); }
    for (const x of [RX[1], RX[2]]) bx(wallK, x - .04, x + .04, F1, CEIL, PZ + .04, Z, 'partition', 1);
    /* the third room's east side: a partition along the well's west edge from the passage to the well's end */ bx(wallK, RX[3] - .04, RX[3] + .04, F1, CEIL, PZ + .04, well.z1, 'partition', 1); }
  // each room: a bed against its partition, a chest at its foot, a washstand with a jug and basin under the front window
  const beds = []; rooms.forEach((R, i) => { const e = i === 1 ? -1 : 1, bx0 = e > 0 ? R.x0 + .05 : R.x1 - .05 - 1.0, b = { x0: bx0, x1: bx0 + 1.0, z0: Z - 2.05, z1: Z - .05 };
    bx('oak', b.x0, b.x1, F1, F1 + .45, b.z0, b.z1, 'bed', 1); bx('straw', b.x0 + .04, b.x1 - .04, F1 + .45, F1 + .55, b.z0 + .04, b.z1 - .04); bx('wool', b.x0 + .03, b.x1 - .03, F1 + .55, F1 + .6, b.z0 + .04, b.z1 - .5); bx('linen', b.x0 + .1, b.x1 - .1, F1 + .55, F1 + .66, b.z1 - .45, b.z1 - .08);
    bx('oak', b.x0 + .05, b.x0 + .95, F1, F1 + .5, b.z0 - .55, b.z0 - .05, 'chest', 1); beds.push(b);
    const wx = [-3.1, 0, 3.1][i] /* under the room's front window */, wz = Z - .3; bx('deal', wx - .25, wx + .25, F1, F1 + .78, wz - .2, wz + .2, 'washstand', 1); put(new THREE.CylinderGeometry(.16, .1, .08, 14), 'delft', wx, F1 + .82, wz); put(new THREE.CylinderGeometry(.06, .07, .22, 12), 'delft', wx + .12, F1 + .93, wz - .05); });
  // the front door's leaf, hung open against the front wall inside, west of the doorway
  const door = plan.open.front[0]; bx('paint', door.x - door.w / 2 - door.w - .02, door.x - door.w / 2 - .02, F0, F0 + 2.05, Z - .06, Z, 'leaf', 0);
  // the walks: in at the door to the bar; in at the door to the stair's foot; off the landing along the passage to each room's door
  const paths = [[[door.x, Z - .3], [door.x, bar.z1 + .3]], [[door.x, Z - .3], [.3, Z - .45], [SX0 + .45, Z - .35], [SX0 + .45, SZ0 + .25]],
    [[SX0 + .45, (LZ - Z) / 2], [SX0 - .5, (-Z + PZ) / 2], ...rooms.map(R => [R.door.x, (-Z + PZ) / 2]).reverse().slice(0, 1), [rooms[0].door.x, (-Z + PZ) / 2], [rooms[0].door.x, PZ + .5]]];
  { const G = glMats().glass, Lt = glMats().lit; /* the lamplit panes too: from inside they are glass */ shell.traverse(m => { if (m.isMesh && (m.material === G || m.material === Lt)) { m.material = roomMats().pane; m.name = 'pane'; } }); }
  const group = new THREE.Group(); let tris = 0; for (const [k, gs] of B) { const g = mergeGeometries(gs); gs.forEach(x => x.dispose()); const m = new THREE.Mesh(g, M[k]); m.name = k; m.castShadow = !['flame', 'ember', 'glow'].includes(k); m.receiveShadow = true; group.add(m); tris += g.attributes.position.count / 3; }
  const all = new THREE.Group(); all.add(shell, group);
  const windows = Object.entries(plan.open).flatMap(([f, os]) => (os || []).filter(q => q.kind === 'win').map(q => ({ face: f, x: f === 'front' ? q.x : -q.x, z: f === 'front' ? plan.d / 2 : -plan.d / 2, y: q.y, w: q.w, h: q.h })));
  return { group: all, shell, room: group, tris: Math.round(tris), draws: group.children.length, shellTris: shell.userData.tris, shellCalls: shell.userData.calls, inner: { x0: -X, x1: X, z0: -Z, z1: Z }, floors: [F0, F1], ceil: [F1 - .42, CEIL - .16], eave: EAVE,
    door: { x: door.x, z: plan.d / 2, w: door.w, h: door.h }, hearth: [hx + BD, 0, 0], fire, stair: { x0: SX0, x1: X, z0: LZ, z1: SZ0, rise: +rise.toFixed(4), going, n: N }, well, rooms, passage: PZ, paths, boxes, beds, tables, benches, seats, settle, bar, lamp, windows, w: plan.w, d: plan.d };
}
// ── the Mark's hall and its alehall (Session 1159; card F9, Michael's A on #321: wall benches, 10 by 18 m, as drawn). markHall and
// markMats are pieces.js's (Session 831), markAlehall and longMats rooms.js's (Session 894), copied as they stand: mats() → roomMats(),
// and the textures are painted on first use (markTextures' TEX.fringe → tex('fringe')). ──
let MM = null, LMAT = null;
function markMats() {
  if (MM) return MM;
  const std = (c, o = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: o.rough ?? .85 });
  const plank = c => { const m = mat('wood', { ns: 1.2 }); m.color.set(c).multiplyScalar(2.6); return m; };
  MM = { wall: [0x5a4430, 0x4a3826, 0x3e2e20, 0x66503a].map(plank), beam: mat('beam', { ns: 1.2, color: 0xa08068 }), stone: mat('stone', { ns: 1.4, color: 0xe0dcd2 }), shingle: mat('shingle', { ns: 1.5, rough: .8 }),
    turf: { dry: mat('turfDry', { ns: 1.3, rough: 1 }), moss: mat('turfMoss', { ns: 1.1, rough: .95 }) }, fringe: new THREE.MeshStandardMaterial({ map: tex('fringe').map, alphaTest: .5, side: THREE.DoubleSide, roughness: 1 }), bark: std(0xd8d0c0, { rough: .9 }), door: plank(0x3a2a1c), dark: std(0x0b0908, { rough: 1 }), iron: new THREE.MeshStandardMaterial({ color: 0x1c1a18, roughness: .5, metalness: .6 }),
    carve: mat('beam', { ns: 1.4, color: 0xc09070 }), glow: new THREE.MeshStandardMaterial({ color: 0x1a1008, emissive: new THREE.Color(1, .6, .28), emissiveIntensity: .5, roughness: .4 }) };
  MM.shingle.side = THREE.DoubleSide; for (const m of Object.values(MM.turf)) m.side = THREE.DoubleSide; return MM;
}
function markHall(o, r) {
  const Mt = markMats(), g = new THREE.Group(), w = o.w, d = o.d, turf = o.roof === 'turf', Turf = Mt.turf[o.turf || 'dry'], foot = .8, wh = turf ? 2.4 : 2.9, pitch = (turf ? 32 : 52) * Math.PI / 180, rise = Math.tan(pitch) * (w / 2 + .5);
  const wallM = Mt.wall[o.wall ?? Math.floor(r() * Mt.wall.length)];
  const add = (geo, m, x = 0, y = 0, z = 0, ry = 0, rx = 0, rz = 0, uv = .5, slopeX) => { if (m.map) worldUV(geo, uv, { slopeX }); const mesh = new THREE.Mesh(geo, m); mesh.position.set(x, y, z); mesh.rotation.set(rx, ry, rz, 'YXZ'); mesh.castShadow = m !== Mt.dark && m !== Mt.glow; mesh.receiveShadow = true; g.add(mesh); return mesh; };
  const box = (a, b, c) => new THREE.BoxGeometry(a, b, c);
  // the footing: a course of rough stone, a little proud of the walls
  add(box(w + .3, foot, d + .3), Mt.stone, 0, foot / 2, 0, 0, 0, 0, .45);
  // the walls: vertical planks (the wood texture's boards run up the wall), the gable ends rising to the roof's pitch, a door on the front gable
  const gable = (len) => { const s = new THREE.Shape([[-len / 2, 0], [len / 2, 0], [len / 2, wh], [0, wh + rise - .5 * Math.tan(pitch)], [-len / 2, wh]].map(([a, b]) => new THREE.Vector2(a, b))); return s; };
  const door = { w: 1.2, h: 2.1 };
  { const s = gable(w); const h = new THREE.Path(); h.moveTo(-door.w / 2, 0); h.lineTo(door.w / 2, 0); h.lineTo(door.w / 2, door.h - .25); h.quadraticCurveTo(0, door.h + .12, -door.w / 2, door.h - .25); h.lineTo(-door.w / 2, 0); s.holes.push(h);
    const wnd = new THREE.Path(), wy = wh + .5; wnd.moveTo(-.3, wy); wnd.lineTo(.3, wy); wnd.lineTo(.3, wy + .45); wnd.lineTo(-.3, wy + .45); wnd.lineTo(-.3, wy); s.holes.push(wnd);
    const geo = new THREE.ExtrudeGeometry(s, { depth: .22, bevelEnabled: false }); add(geo, wallM, 0, foot, d / 2 - .22, 0, 0, 0, .9);
    if (!o.interior) { add(box(w - .5, wh - .1, .05), Mt.dark, 0, foot + (wh - .1) / 2, d / 2 - .3); add(box(.5, .4, .04), Mt.glow, 0, foot + wy + .22, d / 2 - .26); } }
  add(new THREE.ExtrudeGeometry(gable(w), { depth: .22, bevelEnabled: false }), wallM, 0, foot, -d / 2, 0, 0, 0, .9);
  for (const sx of [-1, 1]) { const s = new THREE.Shape([[-d / 2, 0], [d / 2, 0], [d / 2, wh], [-d / 2, wh]].map(([a, b]) => new THREE.Vector2(a, b)));
    const n = Math.max(1, Math.floor(d / 4)); for (let i = 0; i < n; i++) { const z = -d / 2 + (i + .5) * d / n, p = new THREE.Path(); p.moveTo(z - .3, 1.3); p.lineTo(z + .3, 1.3); p.lineTo(z + .3, 1.8); p.lineTo(z - .3, 1.8); p.lineTo(z - .3, 1.3); s.holes.push(p);
      { const lit = r() < .4; if (!o.interior) add(box(.04, .5, .6), lit ? Mt.glow : Mt.dark, sx * (w / 2 - .2), foot + 1.55, z); } for (const k of [-1, 1]) add(box(.05, .58, .34), Mt.door, sx * (w / 2 + .06), foot + 1.55, z + k * .48, k * sx * .5); }
    add(new THREE.ExtrudeGeometry(s, { depth: .22, bevelEnabled: false }), wallM, sx * (w / 2 - .11), foot, 0, sx * Math.PI / 2 - Math.PI / 2 * sx + sx * Math.PI / 2, 0, 0, .9); }
  // the frame: corner posts, a sill and a wall plate, in dark beams
  for (const [sx, sz] of [[1, 1], [1, -1], [-1, 1], [-1, -1]]) add(box(.3, wh + .1, .3), Mt.beam, sx * (w / 2 - .05), foot + wh / 2, sz * (d / 2 - .05), 0, 0, 0, .8);
  for (const sx of [-1, 1]) { add(box(.26, .26, d + .1), Mt.beam, sx * (w / 2 - .02), foot + wh - .05, 0, 0, 0, 0, .8); add(box(.26, .2, d + .1), Mt.beam, sx * (w / 2 - .02), foot + .1, 0, 0, 0, 0, .8); }
  // the door: planks under a rounded head, iron strap hinges, a threshold of stone
  if (!o.interior) for (let i = 0; i < 5; i++) add(box(door.w / 5 - .01, door.h - .1, .06), Mt.door, -door.w / 2 + (i + .5) * door.w / 5, foot + (door.h - .1) / 2, d / 2 - .1, 0, 0, 0, .9);
  for (const y of [.5, 1.5]) add(box(door.w * .8, .06, .02), Mt.iron, -door.w * .1, foot + y, d / 2 - .06);
  // the threshold at the sill, and stone steps down from it to the ground, rises of foot / 5 (0.16 m; v2-scope §2's stairs are 0.18) and
  // treads of 0.3, each a little wider than the one above (Session 859: the critic's door 0.8 m up with no step)
  // with a porch the steps go down from the porch's stone floor, which is the threshold
  const RISE = foot / 5, TREAD = .3, z1 = o.porch ? d / 2 + 2.15 : d / 2 + .6; if (!o.porch) add(box(door.w + .5, .2, .45), Mt.stone, 0, foot - .1, d / 2 + .15 + .225, 0, 0, 0, .45);
  for (let k = 4; k >= 1; k--) { const n = 5 - k, z0 = z1 + (n - 1) * TREAD; add(box(door.w + .5 + n * .12, k * RISE, TREAD), Mt.stone, 0, k * RISE / 2, z0 + TREAD / 2, 0, 0, 0, .45); }
  // the roof: two slabs at the pitch, overhanging the gables; shingle, or turf over a birch-bark edge with a log holding it at the eaves
  const ov = .5, slope = (w / 2 + ov) / Math.cos(pitch), t = turf ? .32 : .12, ry0 = foot + wh - ov * Math.tan(pitch) + .05, len = d + (turf ? .8 : 1.2);
  for (const sx of [-1, 1]) { const geo = box(slope, t, len); geo.translate(sx * slope / 2, t / 2, 0); add(geo, turf ? Turf : Mt.shingle, sx * -(w / 2 + ov), ry0, 0, 0, 0, sx * pitch, turf ? .6 : .9, true).rotation.z = sx * pitch;
    if (turf) { add(box(.04, .3, len), Mt.bark, sx * (w / 2 + ov + .02), ry0 + .05, 0, 0, 0, 0); add(new THREE.CylinderGeometry(.12, .12, len, 8).rotateX(Math.PI / 2), Mt.beam, sx * (w / 2 + ov - .05), ry0 + .22, 0, 0, 0, 0, .8);
      // the grass hangs over the eaves, a little out from the bark, so the roof's edge is ragged and not a slab's
      const fg = new THREE.PlaneGeometry(len + .1, .38), uv = fg.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setX(i, uv.getX(i) * (len + .1) / 2.2); fg.rotateY(sx * Math.PI / 2); fg.rotateZ(sx * .12);
      const fm = new THREE.Mesh(fg, Mt.fringe); fm.position.set(sx * (w / 2 + ov + .07), ry0 + .12, 0); fm.castShadow = true; fm.receiveShadow = true; g.add(fm); } }
  const ridgeY = ry0 + (w / 2 + ov) * Math.tan(pitch);
  if (!turf) add(box(.22, .16, len + .05), Mt.beam, 0, ridgeY + .12, 0, 0, 0, 0, .8);
  // the gables' carving: crossed bargeboards along each verge, running past the ridge into beast heads (OG-034's carved gables)
  if (!turf || o.carve) for (const sz of [1, -1]) { const z = sz * (len / 2 + .03);
    for (const sx of [-1, 1]) { const E = new THREE.Vector2(sx * (w / 2 + ov), ry0 + t), Rg = new THREE.Vector2(0, ridgeY + t), dir = Rg.clone().sub(E).normalize(), P = Rg.clone().addScaledVector(dir, .75), L = P.distanceTo(E);
      const bb = box(L, .3, .08); add(bb, Mt.carve, (E.x + P.x) / 2, (E.y + P.y) / 2 + .08, z, 0, 0, Math.atan2(P.y - E.y, P.x - E.x), .8);
      // the head: a curl at the board's top end, the beast's snout turned out over the gable
      const hs = new THREE.Shape(); hs.moveTo(0, 0); hs.quadraticCurveTo(.2, .35, .05, .6); hs.quadraticCurveTo(-.1, .75, -.35, .68); hs.quadraticCurveTo(-.18, .6, -.14, .5); hs.quadraticCurveTo(-.02, .38, -.15, 0); hs.lineTo(0, 0);
      const hg = new THREE.ExtrudeGeometry(hs, { depth: .08, bevelEnabled: true, bevelThickness: .02, bevelSize: .02, bevelSegments: 1, curveSegments: 6 }); hg.translate(0, 0, -.04);
      add(hg, Mt.carve, P.x, P.y + .05, z, sx > 0 ? 0 : Math.PI, 0, 0, .8); } }
  // the porch on the front gable: two carved posts and a little roof
  if (o.porch) { const pd = 1.8, pw = door.w + 1.4, ph = 2.5; for (const sx of [-1, 1]) add(new THREE.CylinderGeometry(.12, .14, ph, 8), Mt.beam, sx * pw / 2, foot + ph / 2 - .2, d / 2 + pd, 0, 0, 0, .8);
    for (const sx of [-1, 1]) { const pl = (pw / 2 + .3) / Math.cos(pitch * .85), geo = box(pl, .1, pd + .4); geo.translate(sx * pl / 2, 0, 0); add(geo, turf ? Turf : Mt.shingle, sx * -(pw / 2 + .3), foot + ph - .2, d / 2 + pd / 2 + .1, 0, 0, sx * pitch * .85, .9, true); }
    add(box(pw + .3, .25, .25), Mt.beam, 0, foot + ph - .1, d / 2 + pd, 0, 0, 0, .8); add(box(pw + .2, .2, pd + .5), Mt.stone, 0, foot - .1, d / 2 + pd / 2 + .1, 0, 0, 0, .45); }
  // a stone chimney through the roof's back slope, or a smoke louver on the ridge
  if (o.chimney) { const cz = -d * .25, ch = ridgeY + .8; add(box(.9, ch, .9), Mt.stone, -(w / 4), ch / 2, cz, 0, 0, 0, .45); add(box(1.05, .15, 1.05), Mt.stone, -(w / 4), ch + .07, cz, 0, 0, 0, .45); }
  else { add(box(.7, .4, 1.2), Mt.beam, 0, ridgeY + .3, -d * .15, 0, 0, 0, .8); add(box(.9, .08, 1.4), turf ? Turf : Mt.shingle, 0, ridgeY + .54, -d * .15, 0, 0, 0, .9); }
  const tris = mergeByMaterial(g); return { group: g, tris, draws: g.children.length, roofTop: new THREE.Box3().setFromObject(g).max.y, sill: foot, front: d / 2, stairOut: z1 + 4 * TREAD, wh, pitch, ry0, ov, louver: o.chimney ? null : -d * .15, door, windows: Array.from({ length: Math.max(1, Math.floor(d / 4)) }, (_, i) => -d / 2 + (i + .5) * d / Math.max(1, Math.floor(d / 4))) };
}
function longMats() {
  if (LMAT) return LMAT; const M = roomMats();
  LMAT = { ...M, plank: mat('wood', { ns: 1.0, color: 0x7a6048, rough: .8 }), board: mat('wood', { ns: .8, color: 0x4a3828, rough: .9 }), post: mat('beam', { ns: 1.2, color: 0x9a7a60 }),
    kerb: mat('rock', { ns: 1.4, color: 0x7a766c, rough: .95 }), ash: mat('rock', { ns: .6, color: 0x3a3632, rough: 1 }), fur: mat('plaster', { ns: .9, color: 0x6a5240, rough: 1 }), furPale: mat('plaster', { ns: .9, color: 0xb0a490, rough: 1 }),
    furGrey: mat('plaster', { ns: .9, color: 0x5e5a56, rough: 1 }), ham: new THREE.MeshStandardMaterial({ color: 0x6a3022, roughness: .6 }), fish: new THREE.MeshStandardMaterial({ color: 0x8a7a5a, roughness: .5, metalness: .2 }),
    herb: mat('thatch', { ns: .6, color: 0x7a8a4a, rough: 1 }), log: mat('beam', { ns: 1.4, color: 0x6a5040 }) };
  return LMAT;
}
function markAlehall(o = {}, r = stream('alehall')) {
  const w = o.w ?? 10, d = o.d ?? 18, hall = markHall({ roof: 'shingle', w, d, porch: true, chimney: false, carve: true, wall: o.wall ?? 1, interior: true }, stream('alehall-shell'));
  const M = longMats(), B = new Map(), boxes = [];
  const put = (geo, key, x = 0, y = 0, z = 0, ry = 0, uv = .6, rx = 0, rz = 0) => { const g = geo.index ? geo.toNonIndexed() : geo; for (const k of Object.keys(g.attributes)) if (!['position', 'normal'].includes(k)) g.deleteAttribute(k);
    g.applyMatrix4(new THREE.Matrix4().compose(new THREE.Vector3(x, y, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(rx, ry, rz, 'YXZ')), new THREE.Vector3(1, 1, 1))); worldUV(g, uv);
    if (!B.has(key)) B.set(key, []); B.get(key).push(g); return g; };
  const bx = (key, x0, x1, y0, y1, z0, z1, tag) => { put(new THREE.BoxGeometry(x1 - x0, y1 - y0, z1 - z0), key, (x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2); if (tag) boxes.push({ tag, x0, x1, y0, y1, z0, z1 }); };
  const X = w / 2 - .25, Z = d / 2 - .25, FY = hall.sill + .04, tp = Math.tan(hall.pitch), under = x => hall.ry0 + (w / 2 + hall.ov - Math.abs(x)) * tp - .02, WP = hall.sill + hall.wh;
  // the floor, the frame and the lining, as the longhouse's
  for (let x = -X; x < X - .01; x += .28) bx('plank', x + .005, Math.min(x + .275, X), hall.sill, FY, -Z, Z);
  const PXr = X - 1.25, TB = WP + .25, posts = []; for (let z = -Z + 2.6; z < Z - 1.2; z += 2.75) posts.push(z);
  for (const sx of [-1, 1]) { for (const z of posts) bx('post', sx * PXr - .11, sx * PXr + .11, FY, TB, z - .11, z + .11, 'post'); bx('post', sx * PXr - .12, sx * PXr + .12, TB, TB + .24, -Z, Z); }
  for (const z of posts) bx('post', -PXr - .1, PXr + .1, TB, TB + .24, z - .1, z + .1);
  const XL = w / 2 - .02, rl = X / Math.cos(hall.pitch); for (const sx of [-1, 1]) { const xm = sx * X / 2, rz = -sx * hall.pitch;
    for (let z = -Z + .3; z < Z; z += 1.0) put(new THREE.BoxGeometry(rl, .14, .1), 'post', xm, under(xm) - .03 - .07 / Math.cos(hall.pitch), z, 0, .8, 0, rz);
    put(new THREE.BoxGeometry(XL / Math.cos(hall.pitch), .02, 2 * Z), 'board', sx * XL / 2, under(XL / 2) - .01, 0, 0, .8, 0, rz); }
  // the long hearth under the louver: 4 m of kerb, ash, logs and embers, a cauldron on its tripod
  const hz = hall.louver ?? -2.7, H = { x0: -.55, x1: .55, z0: hz - 2.0, z1: hz + 2.0 };
  for (let z = H.z0; z < H.z1 - .01; z += .3) for (const x of [H.x0, H.x1]) { const s = .13 + r() * .04, g = new THREE.IcosahedronGeometry(s, 1); g.scale(1.3, .7, 1.1); put(g, 'kerb', x, FY + s * .55, z + .15, r() * 3); }
  for (let x = H.x0 + .3; x < H.x1 - .2; x += .3) for (const z of [H.z0, H.z1]) { const s = .13 + r() * .04, g = new THREE.IcosahedronGeometry(s, 1); g.scale(1.1, .7, 1.3); put(g, 'kerb', x, FY + s * .55, z, r() * 3); }
  boxes.push({ tag: 'hearth', x0: H.x0 - .2, x1: H.x1 + .2, y0: FY, y1: FY + .2, z0: H.z0 - .2, z1: H.z1 + .2 }); bx('ash', H.x0 + .1, H.x1 - .1, FY, FY + .04, H.z0 + .1, H.z1 - .1);
  const fire = [0, FY + .25, hz]; for (let i = 0; i < 9; i++) { const g = new THREE.CylinderGeometry(.06, .07, .9, 7); g.rotateZ(Math.PI / 2); put(g, 'log', 0, FY + .1 + (i % 2) * .07, hz + (i - 4) * .16, i * .3 + .2); }
  put(new THREE.SphereGeometry(.24, 10, 6).scale(1.4, .35, 3.2), 'ember', 0, FY + .08, hz); for (let i = 0; i < 6; i++) put(new THREE.ConeGeometry(.09, .34 + (i % 2) * .14, 7), 'flame', (i % 2 - .5) * .12, FY + .3, hz + (i - 2.5) * .22);
  { const cz = hz + 1.3; for (const a of [0, 2.1, 4.2]) put(new THREE.CylinderGeometry(.015, .015, 1.25, 5), 'iron', Math.cos(a) * .32, FY + .58, cz + Math.sin(a) * .32, 0, .6, Math.sin(a) * .26, -Math.cos(a) * .26);
    bx('iron', -.006, .006, FY + .62, FY + 1.18, cz - .006, cz + .006); put(new THREE.SphereGeometry(.24, 14, 10, 0, Math.PI * 2, .4, Math.PI - .4), 'iron', 0, FY + .55, cz); }
  // the wall benches behind the posts, from the counter's end to the door's corners, furs laid on them
  const BZ0 = -Z + 2.4, BZ1 = Z - 2.0, BH = .45, BD = 1.0, benches = [];
  for (const sx of [-1, 1]) { const x0 = sx > 0 ? X - BD : -X, x1 = sx > 0 ? X : -X + BD; bx('board', x0, x1, FY, FY + BH - .04, BZ0, BZ1, 'wallbench'); bx('plank', x0, x1, FY + BH - .04, FY + BH, BZ0, BZ1); benches.push({ x0, x1, y: FY + BH, z0: BZ0, z1: BZ1, kind: 'wall' });
    for (let z = BZ0 + .3, k = 0; z < BZ1 - 1.2; z += 1.8 + r() * .5, k++) { const L = 1.5 + r() * .4, W2 = .75 + r() * .15, g = new THREE.PlaneGeometry(W2, L, 6, 6), P = g.attributes.position;
      for (let i = 0; i < P.count; i++) P.setZ(i, .015 + .02 * Math.sin(P.getX(i) * 9 + k) * Math.cos(P.getY(i) * 7)); g.rotateX(-Math.PI / 2); g.computeVertexNormals(); put(g, ['fur', 'furPale', 'furGrey'][k % 3], (x0 + x1) / 2, FY + BH, z + L / 2, (r() - .5) * .1, .9); } }
  // the long tables inside the posts, legs every 1.5 m; a loose bench on the aisle side; horns, bowls and a jug along them
  const tables = [], TZ0 = BZ0 + .2, TZ1 = BZ1 - .3; for (const sx of [-1, 1]) { const tx1 = sx * (PXr - .15), tx0 = sx * (PXr - .9), a = Math.min(tx0, tx1), b = Math.max(tx0, tx1), T = { x0: a, x1: b, z0: TZ0, z1: TZ1, y: FY + .76 };
    bx('plank', a, b, T.y - .05, T.y, TZ0, TZ1, 'table'); for (let z = TZ0 + .2; z < TZ1; z += 1.5) for (const x of [a + .08, b - .08]) bx('post', x - .04, x + .04, FY, T.y - .05, z - .04, z + .04); tables.push(T);
    const ba = sx * (PXr - 1.1), bb = sx * (PXr - 1.45), c0 = Math.min(ba, bb), c1 = Math.max(ba, bb); bx('oak', c0, c1, FY + .41, FY + .45, TZ0, TZ1, 'bench'); for (let z = TZ0 + .3; z < TZ1; z += 2.0) bx('oak', c0 + .04, c1 - .04, FY, FY + .41, z - .04, z + .04); benches.push({ x0: c0, x1: c1, y: FY + .45, z0: TZ0, z1: TZ1, kind: 'loose' });
    for (let z = TZ0 + .5; z < TZ1 - .3; z += .9 + r() * .5) { const k = Math.floor(r() * 3), x = (a + b) / 2 + (r() - .5) * .3;
      if (k === 0) { const g = new THREE.ConeGeometry(.04, .32, 8); g.rotateZ(Math.PI / 2 - .3); put(g, 'furPale', x, T.y + .05, z, r() * 3); } else if (k === 1) put(new THREE.SphereGeometry(.09, 10, 6, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), 'oak', x, T.y + .09, z); else put(new THREE.CylinderGeometry(.06, .08, .22, 10), 'crock', x, T.y + .11, z); } }
  // the counter across the back, kegs on a rack behind it against the back wall, drinking horns on pegs over them
  const counter = { x0: -1.8, x1: 1.8, z0: -Z + 1.35, z1: -Z + 1.9, y: FY + 1.05 }; bx('board', counter.x0, counter.x1, FY, counter.y - .05, counter.z0, counter.z1, 'counter'); bx('plank', counter.x0 - .05, counter.x1 + .05, counter.y - .05, counter.y, counter.z0 - .04, counter.z1 + .04);
  bx('oak', -2.6, 2.6, FY, FY + .4, -Z, -Z + .65, 'kegrack'); for (let x = -2.25; x < 2.4; x += .7) { const g = new THREE.CylinderGeometry(.28, .28, .6, 14); g.rotateX(Math.PI / 2); put(g, 'oak', x, FY + .4 + .28, -Z + .32); put(new THREE.CylinderGeometry(.03, .03, .1, 6).rotateX(Math.PI / 2), 'iron', x, FY + .45, -Z + .65); }
  for (let x = -2.4; x < 2.5; x += .4) { bx('oak', x - .015, x + .015, FY + 1.75, FY + 1.78, -Z, -Z + .12); const g = new THREE.ConeGeometry(.045, .34, 8); g.rotateX(Math.PI); put(g, 'furPale', x, FY + 1.55, -Z + .1, 0, .6, .2); }
  // by the door: a rack of spears and round shields against the front wall on the left, a water barrel on the right
  { const x0 = -X + .2, x1 = -1.4, z = Z - .35; bx('oak', x0, x1, FY + .1, FY + .18, z - .12, z + .12, 'weaponrack'); bx('oak', x0, x1, FY + 1.6, FY + 1.68, z - .05, z + .05);
    for (let x = x0 + .2; x < x1 - .1; x += .32) { put(new THREE.CylinderGeometry(.018, .02, 2.3, 5), 'post', x, FY + 1.15, z, 0, .6, .05); put(new THREE.ConeGeometry(.03, .22, 5), 'iron', x, FY + 2.4, z + .05); }
    for (let k = 0; k < 3; k++) { const sx = x0 + .5 + k * .75, g = new THREE.CylinderGeometry(.38, .38, .04, 18); g.rotateX(Math.PI / 2); put(g, ['ham', 'board', 'furGrey'][k], sx, FY + .75, Z - .08); put(new THREE.SphereGeometry(.07, 8, 6), 'iron', sx, FY + .75, Z - .1); } }
  put(new THREE.CylinderGeometry(.32, .29, .8, 14), 'oak', X - .55, FY + .4, Z - .55); boxes.push({ tag: 'barrel', x0: X - .87, x1: X - .23, y0: FY, y1: FY + .8, z0: Z - .87, z1: Z - .23 });
  // two iron lamps on chains from the tie beams over the tables
  const lamps = []; for (const [sx, k] of [[-1, 1], [1, 3], [0, 0] /* the third over the aisle before the counter */]) { const lz = posts[k] ?? 0, L = [sx * (PXr - .5), TB - .7, lz]; bx('iron', L[0] - .005, L[0] + .005, L[1] + .05, TB, lz - .005, lz + .005);
    put(new THREE.SphereGeometry(.11, 10, 6, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), 'iron', ...L); put(new THREE.SphereGeometry(.025, 6, 5).scale(1, 2, 1), 'flame', L[0] + .05, L[1] + .04, L[2]); lamps.push(L); }
  // the front door hung open against the front wall, right of the doorway
  { const leaf = { x0: hall.door.w / 2 + .01, x1: hall.door.w / 2 + .07, z0: Z - hall.door.w - .01, z1: Z - .01 }; bx('board', leaf.x0, leaf.x1, FY, FY + hall.door.h - .12, leaf.z0, leaf.z1, 'door'); }
  // the walk: in at the door, down the aisle on the left of the hearth to the counter; and on the right, to the far end of the right table
  const path = [[0, Z - .1], [0, Z - 1.4], [-1.45, H.z1 + .5], [-1.45, counter.z1 + .45], [counter.x0 + .5, counter.z1 + .45]], path2 = [[0, Z - 1.4], [1.45, H.z1 + .5], [1.45, TZ0 + .3]];
  const group = new THREE.Group(); let tris = 0; for (const [k, gs] of B) { const g = mergeGeometries(gs); gs.forEach(x => x.dispose()); const m = new THREE.Mesh(g, M[k]); m.name = k; m.castShadow = !['flame', 'ember', 'glow'].includes(k); m.receiveShadow = true; group.add(m); tris += g.attributes.position.count / 3; }
  const all = new THREE.Group(); all.add(hall.group, group);
  return { group: all, shell: hall.group, room: group, tris: Math.round(tris), draws: group.children.length, shellTris: hall.tris, shellCalls: hall.draws, inner: { x0: -X, x1: X, z0: -Z, z1: Z }, under, floor: FY, tieBeam: TB,
    fire, hearth: H, louver: hall.louver, door: { x: 0, z: d / 2, w: hall.door.w, h: hall.door.h }, path, path2, boxes, tables, benches, counter, lamps, w, d };
}
// ── Aurenne's tavern (Session 1167; card F9, Michael's A on #322: the Roman house, a vine on a pergola). Copied from
// docs/prototypes/levelup/pieces.js (the Aurennais house, Session 816, with aurKit, its materials and its surfaces) and rooms.js
// (homeMats and aurenneTavern, Session 897) as they stand. Copy it again from there when the prototype changes; only the names
// below differ: mats() → aurMats() (pieces.js's) or roomMats() (rooms.js's), TEXTURED → AUR_TEXTURED, UVS → AUR_UVS; the surfaces
// are painters on first use (aurenneTextures' eager TEX goes), and the rug's canvas carries no colour space, as the kit's others. ──
  Object.assign(PAINTERS, {
    // pantile: half-round tiles, four across a repeat, three courses down it, alternately laid hollow and round, each course lapping the one below
    pantile: () => texPair(256, (x, y) => { const fx = x * 4, col = Math.floor(fx), u = fx - col, fy = y * 3, crs = Math.floor(fy), v = fy - crs, r = idr(col * 7 + crs * 31 + 3), round = col % 2 === 0;
      const s = Math.sin(Math.PI * u), h = (round ? s : 1 - s * .7) * .7 + (1 - v) * .3 + .05 * tn(x, y, 32, 5), gap = !round && (u < .06 || u > .94);
      const k = .78 + .3 * r + .08 * tfbm(x, y, 16, 3, 2) - (round ? 0 : .12) - (v > .9 ? .18 : 0); return [h, ...(gap ? [.18, .08, .05] : [.70 * k, .36 * k, .22 * k])]; }, 3.4),
    // glazed tile: a square frame in blue and white by turns with saffron stars at the crossings (OG-061's "blue glazed tilework")
    zellige: () => texPair(256, (x, y) => { const n = 4, fx = x * n, fy = y * n, i = Math.floor(fx), j = Math.floor(fy), u = fx - i, v = fy - j, e = Math.min(u, 1 - u, v, 1 - v), gap = e < .05;
      const cx = Math.abs(u - .5), cy = Math.abs(v - .5), star = cx + cy < .2 || Math.max(cx, cy) < .12, blue = (i + j) % 2 === 0, w = .03 * tn(x, y, 64, 7);
      const c = gap ? [.82, .8, .74] : star ? [.86, .62, .18] : blue ? [.13 + w, .3 + w, .62 + w] : [.92 + w, .93 + w, .9 + w]; return [gap ? 0 : .8 + .2 * Math.min(1, e * 8), ...c]; }, 2.2),
    // a dome's glaze: small blue tiles, each a shade of its own
    glaze: () => texPair(256, (x, y) => { const n = 12, i = Math.floor(x * n), j = Math.floor(y * n), u = x * n - i, v = y * n - j, e = Math.min(u, 1 - u, v, 1 - v), r = idr(i * 13 + j * 7 + 1), gap = e < .06;
      return [gap ? 0 : .85, ...(gap ? [.7, .7, .66] : [.1 + .06 * r, .26 + .1 * r, .55 + .12 * r])]; }, 1.6),
    // limestone paving (Session 820): pale slabs in courses of two widths, edges worn round, ochre and grey stains, the joints
    // filled with dust rather than cut black
    limestone: () => texPair(512, (x, y) => { const rows = 4, row = Math.floor(y * rows), v = y * rows - row, wide = row % 2 ? 3 : 2, xx = x * wide + idr(row + 7) * .7, col = Math.floor(xx), u = xx - col, r = idr(row * 19 + ((col % wide) + wide) % wide + 5);
      const e = Math.min(u * wide / 2.5, (1 - u) * wide / 2.5, v, 1 - v), n = tfbm(x, y, 10, 5, r * 11), st = tfbm(x, y, 3, 4, 41), gap = e < .012;
      const h = gap ? .1 : Math.min(1, Math.sqrt(e * 18)) * (.85 + .15 * n), k = .8 + .1 * r + .08 * (n - .5), ochre = Math.max(0, st - .55) * 1.2;
      return [h, ...(gap ? [.62, .57, .48] : [k * (1 + ochre * .1), k * (.95 - ochre * .05), k * (.86 - ochre * .2)])]; }, 1.8),
    // the awning's canvas: madder and cream in stripes, a weave in the height
    awning: () => texPair(128, (x, y) => { const st = Math.floor(x * 8) % 2, wv = (Math.sin(x * 128 * Math.PI) * Math.sin(y * 128 * Math.PI)) * .5 + .5, n = tfbm(x, y, 8, 3, 4);
      return [wv * .4 + n * .3, ...(st ? [.93 - .05 * n, .88 - .05 * n, .78 - .05 * n] : [.62 - .06 * n, .14, .1])]; }, 1.2),
  });
// colours from the proposal (AUR): lime white, warm lime, ochre, rose, chalk; doors in indigo, verdigris, madder, night blue, bare cedar
const AUR = { walls: [0xf6f1e4, 0xf3e6c8, 0xedd3a8, 0xefcfbb, 0xfaf7ef], doors: [0x2f5f9a, 0x2a7a78, 0x9a3a2a, 0x3a4a7a, 0x8a5a36], leaf: 0x4f6e34, leaf2: 0x34501f, bloom: 0xb0306a };
let AM = null;
function aurMats() {
  if (AM) return AM;
  const std = (c, o = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: o.rough ?? .8, metalness: o.metal ?? 0, side: o.side ?? THREE.FrontSide });
  AM = { wall: AUR.walls.map(c => mat('plaster', { ns: .55, color: c, rough: .95 })), stone: mat('ashlar', { ns: .9, color: 0xfff1d6, rough: .85 }), plinth: mat('ashlar', { ns: 1.1, color: 0xd9c9a8, rough: .9 }),
    pantile: mat('pantile', { ns: 1.4, rough: .75 }), ridge: std(0x8a4428, { rough: .7 }), zellige: mat('zellige', { ns: .6, rough: .25 }), glaze: mat('glaze', { ns: .7, rough: .2 }),
    cedar: mat('wood', { ns: 1, color: 0xc89870 }), door: AUR.doors.map(c => { const m = mat('wood', { ns: .9 }); m.color.set(c).multiplyScalar(2.1); return m; }),
    awning: mat('awning', { ns: .6, rough: .95 }), dark: std(0x0d0a08, { rough: 1 }), iron: std(0x1c1a18, { rough: .5, metal: .5 }), terra: std(0xa8582f, { rough: .85 }),
    gold: std(0xc8952e, { rough: .35, metal: .7 }), leaf: std(AUR.leaf, { rough: .9 }), leaf2: std(AUR.leaf2, { rough: .95 }), bloom: std(AUR.bloom, { rough: .8 }),
    /* the courtyard house's (Session 899) */ pave: mat('limestone', { ns: 1.0, rough: .8 }), floor: mat('flag', { ns: .7, color: 0xf0a078, rough: .7 }), orange: std(0xe07a1c, { rough: .6 }),
    water: new THREE.MeshStandardMaterial({ color: 0x2f6f82, roughness: .05, metalness: .1, transparent: true, opacity: .78 }),
    /* the church's inside (Session 947): the dome painted night blue, its lights seen from within */ heaven: mat('plaster', { ns: .3, color: 0x2a3e72, rough: .95 }), sky: new THREE.MeshStandardMaterial({ color: 0xdfe8f0, emissive: new THREE.Color(.85, .9, 1), emissiveIntensity: 1.1, roughness: 1 }) };
  AM.pantile.side = THREE.DoubleSide; AM.awning.side = THREE.DoubleSide; return AM;
}
const AUR_TEXTURED = new Set(['wall', 'stone', 'plinth', 'pantile', 'zellige', 'glaze', 'cedar', 'door', 'awning', 'pave', 'floor']);
const AUR_UVS = { wall: .42, stone: .45, plinth: .5, pantile: .96, zellige: 1.47, glaze: 1.2, cedar: .9, door: .9, awning: .5, pave: .55, floor: 1.1 };

// the kit every Aurenne builder shares (lifted out of aurenneHouse in Session 832 for the church): put() places a piece (a
// turn about y and a tilt, then a move), takes its UVs from where it lies and drops it in its material's bucket ('wall:2'
// is the third wall colour); wallGeo() is a wall with arched openings cut through; finish() merges each bucket to one mesh.
function aurKit() {
  const Mt = aurMats(), buckets = new Map();
  // a piece with userData.uvRep = [around, up] keeps its own UVs, repeated that many times (a dome's tiles, which a world projection seams)
  const put = (geo, key, x = 0, y = 0, z = 0, ry = 0, rx = 0, rz = 0, slopeX) => { const rep = geo.userData.uvRep, g = geo.index ? geo.toNonIndexed() : geo;
    if (rep) { const uv = g.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * rep[0], uv.getY(i) * rep[1]); } else g.deleteAttribute('uv');
    g.applyMatrix4(new THREE.Matrix4().compose(new THREE.Vector3(x, y, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(rx, ry, rz, 'YXZ')), new THREE.Vector3(1, 1, 1)));
    const base = key.split(':')[0]; if (!rep) { if (AUR_TEXTURED.has(base)) worldUV(g, AUR_UVS[base], { slopeX }); else g.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(g.attributes.position.count * 2), 2)); }
    if (!buckets.has(key)) buckets.set(key, []); buckets.get(key).push(g); };
  // an outline with holes; a hole {x,y,w,h,arch} has a half-round (1) or pointed (2) head
  const holePath = h => { const p = new THREE.Path(), x0 = h.x - h.w / 2, x1 = h.x + h.w / 2, y0 = h.y, y1 = h.y + h.h - (h.arch ? h.w / 2 : 0);
    p.moveTo(x0, y0); p.lineTo(x1, y0); p.lineTo(x1, y1);
    if (h.arch === 1) p.absarc(h.x, y1, h.w / 2, 0, Math.PI, false); else if (h.arch === 2) { p.quadraticCurveTo(x1, y1 + h.w * .42, h.x, y1 + h.w * .62); p.quadraticCurveTo(x0, y1 + h.w * .42, x0, y1); } else p.lineTo(x0, y1);
    p.lineTo(x0, y0); return p; };
  const wallGeo = (len, ht, holes, t) => { const s = new THREE.Shape(); s.moveTo(-len / 2, 0); s.lineTo(len / 2, 0); s.lineTo(len / 2, ht); s.lineTo(-len / 2, ht); s.lineTo(-len / 2, 0);
    holes.forEach(h => s.holes.push(holePath(h))); const g = new THREE.ExtrudeGeometry(s, { depth: t - .06, bevelEnabled: true, bevelThickness: .03, bevelSize: .03, bevelSegments: 1, curveSegments: 9 }); g.translate(0, 0, -(t - .06) / 2); return g; };
  const box = (a, b, c) => new THREE.BoxGeometry(a, b, c);
  const finish = () => { const group = new THREE.Group(); let tris = 0;
    for (const [key, geos] of buckets) { const [base, idx] = key.split(':'), m = idx != null ? Mt[base][+idx] : Mt[base], g = mergeGeometries(geos, false); for (const x of geos) x.dispose();
      const mesh = new THREE.Mesh(g, m); mesh.castShadow = base !== 'dark'; mesh.receiveShadow = true; mesh.name = key; group.add(mesh); tris += g.attributes.position.count / 3; }
    return { group, tris: Math.round(tris), draws: group.children.length, roofTop: new THREE.Box3().setFromObject(group).max.y }; };
  return { Mt, put, holePath, wallGeo, box, finish };
}

function aurenneHouse(o, r) {
  const { Mt, put, wallGeo: wallG, box, finish } = aurKit(), w = o.w, d = o.d;
  const T = .32, pl = .24, fh = 3.0, H = fh + (o.two ? 2.6 : 0), wallK = 'wall:' + (o.wall ?? Math.floor(r() * AUR.walls.length)), doorK = 'door:' + (o.door ?? Math.floor(r() * AUR.doors.length));
  const wallGeo = (len, ht, holes, t = T) => wallG(len, ht, holes, t);
  // the openings, by storey: an arched door on the front, windows small and deep as in a hot country
  const front = [], back = [], side = [], doorW = 1.05, doorH = 2.0, dx = o.kind === 'tile' ? 0 : (r() < .5 ? -1 : 1) * Math.min(w * .18, 1.1);
  front.push({ x: dx, y: 0, w: doorW, h: doorH, arch: o.pointed ? 2 : 1, door: 1 });
  const nWin = Math.max(1, Math.floor((w - 2) / 2.4));
  for (let i = 0; i < nWin; i++) { const x = -w / 2 + 1.0 + (i + .5) * (w - 2) / nWin; if (Math.abs(x - dx) < 1.3) continue; front.push({ x, y: 1.1, w: .62, h: .95, arch: 1 }); }
  back.push({ x: 0, y: 1.1, w: .62, h: .95, arch: 1 }); side.push({ x: 0, y: 1.1, w: .55, h: .8, arch: 0 });
  if (o.two) { for (let i = 0; i < nWin + 1; i++) { const x = -w / 2 + .9 + (i + .5) * (w - 1.8) / (nWin + 1); front.push({ x, y: fh + .7, w: .66, h: 1.15, arch: 1, up: 1 }); }
    back.push({ x: -w * .2, y: fh + .7, w: .62, h: 1.0, arch: 1, up: 1 }); side.push({ x: 0, y: fh + .8, w: .55, h: .85, arch: 1, up: 1 }); }
  // the plinth, the four walls, the room's gloom behind every opening
  put(box(w + .16, pl, d + .16), 'plinth', 0, pl / 2, 0);
  const yW = pl;
  put(wallGeo(w, H, front), wallK, 0, yW, d / 2 - T / 2); put(wallGeo(w, H, back), wallK, 0, yW, -d / 2 + T / 2, Math.PI);
  put(wallGeo(d - 2 * T + .02, H, side), wallK, w / 2 - T / 2, yW, 0, Math.PI / 2); put(wallGeo(d - 2 * T + .02, H, side), wallK, -w / 2 + T / 2, yW, 0, -Math.PI / 2);
  if (!o.interior) put(box(w - 2 * T, H - .3, d - 2 * T), 'dark', 0, yW + (H - .3) / 2, 0);
  // the door: five cedar boards in its colour set back in the reveal under a half-round head, iron studs, a stone step, the tile frame round it
  for (const h of front.filter(h => h.door)) { const dz = d / 2 - T * .7, nb = 5, sh = h.h - h.w / 2;
    /* o.interior (Session 891, rooms.js): the room hangs its own leaf, open */ if (!o.interior) for (let i = 0; i < nb; i++) put(box(h.w / nb - .012, sh + .02, .06), doorK, h.x - h.w / 2 + (i + .5) * h.w / nb, yW + sh / 2, dz);
    if (!o.interior) put(new THREE.CylinderGeometry(h.w / 2, h.w / 2, .06, 14, 1, false, -Math.PI / 2, Math.PI), doorK, h.x, yW + sh, dz, 0, -Math.PI / 2);
    if (!o.interior) for (let i = 0; i < 3; i++) for (let k = 0; k < 3; k++) put(new THREE.SphereGeometry(.025, 6, 4), 'iron', h.x - .3 + k * .3, yW + .45 + i * .55, dz + .04);
    put(box(h.w + .3, .1, .42), 'stone', h.x, yW - .02, d / 2 + .12);
    const tz = d / 2 + .02, ts = .17, top = yW + h.h + .12;
    for (const sx of [-1, 1]) put(box(ts, top - yW - .05, .03), 'zellige', h.x + sx * (h.w / 2 + .17), yW + .05 + (top - yW - .05) / 2, tz);
    put(box(h.w + .34 + ts, ts, .03), 'zellige', h.x, top + ts / 2, tz); }
  // windows: a stone sill, a grille of three iron bars, or (upstairs at the front, if o.lattice) a cedar lattice screen on brackets
  for (const [list, face] of [[front, 0], [back, 1]]) for (const h of list) { if (h.door) continue; const z = face ? -(d / 2) : d / 2, s = face ? -1 : 1, hx = h.x * s;
    put(box(h.w + .22, .08, .2), 'stone', hx, yW + h.y - .04, z + s * .05);
    if (h.up && o.lattice && !face) { const bw = h.w + .34, bh = h.h + .25, by = yW + h.y + bh / 2 - .12;
      if (!o.interior) put(box(bw, bh, .4), 'dark', hx, by, z + s * .2);
      for (let i = 0; i <= 7; i++) put(box(i % 7 ? .035 : .07, bh, .04), 'cedar', hx - bw / 2 + i * bw / 7, by, z + s * .42);
      for (let i = 1; i < 10; i++) put(box(bw, .035, .035), 'cedar', hx, by - bh / 2 + i * bh / 10, z + s * .43);
      put(box(bw + .12, .08, .56), 'cedar', hx, by + bh / 2 + .04, z + s * .22); put(box(bw + .08, .08, .52), 'cedar', hx, by - bh / 2 - .04, z + s * .22);
      for (const sx of [-1, 1]) put(box(.08, .32, .3), 'cedar', hx + sx * (bw / 2 - .08), by - bh / 2 - .22, z + s * .12);
      continue; }
    for (let i = 0; i < 3; i++) put(new THREE.CylinderGeometry(.018, .018, h.h - h.w / 2, 5), 'iron', hx - h.w / 3 + i * h.w / 3, yW + h.y + (h.h - h.w / 2) / 2, z - s * .1); }
  for (const sx of [-1, 1]) for (const h of side) put(box(h.w + .2, .08, .2), 'stone', sx * (w / 2 + .05), yW + h.y - .04, 0, sx * Math.PI / 2);
  const top = yW + H; let roofTop = top, depthOut = d / 2 + .3;
  if (o.kind === 'tile') {
    // Roman: a stone cornice, a hipped roof at 22° in pantile, ridge tiles on the hips and the ridge, rafter ends under the eaves
    put(box(w + .36, .16, d + .36), 'stone', 0, top + .08, 0);
    const over = .45, rw = (w + 2 * over) / 2, rd = (d + 2 * over) / 2, y0 = top + .16, k = Math.tan(22 * Math.PI / 180), long = rw >= rd, a = Math.min(rw, rd), rise = k * a, rl = Math.abs(rw - rd);
    const R0 = long ? [new THREE.Vector3(-rl, y0 + rise, 0), new THREE.Vector3(rl, y0 + rise, 0)] : [new THREE.Vector3(0, y0 + rise, -rl), new THREE.Vector3(0, y0 + rise, rl)];
    const C = [[-rw, rd], [rw, rd], [rw, -rd], [-rw, -rd]].map(([x, z]) => new THREE.Vector3(x, y0, z));
    const plane = (pts, slopeX) => { const g = new THREE.BufferGeometry(), p = []; for (let i = 1; i < pts.length - 1; i++) p.push(...pts[0].toArray(), ...pts[i].toArray(), ...pts[i + 1].toArray());
      g.setAttribute('position', new THREE.Float32BufferAttribute(p, 3)); g.computeVertexNormals(); put(g, 'pantile', 0, 0, 0, 0, 0, 0, slopeX); };
    // the four slopes: two trapezoids along the ridge, two triangles at its ends (the ridge's near end is R0[1] on +x or +z)
    if (long) { plane([C[0], C[1], R0[1], R0[0]], false); plane([C[2], C[3], R0[0], R0[1]], false); plane([C[1], C[2], R0[1]], true); plane([C[3], C[0], R0[0]], true); }
    else { plane([C[1], C[2], R0[0], R0[1]], true); plane([C[3], C[0], R0[1], R0[0]], true); plane([C[0], C[1], R0[1]], false); plane([C[2], C[3], R0[0]], false); }
    const rod = (A, B, rad) => { const L = A.distanceTo(B), g = new THREE.CylinderGeometry(rad, rad, L, 8, 1); g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), B.clone().sub(A).normalize())); g.translate(...A.clone().add(B).multiplyScalar(.5).toArray()); put(g, 'ridge'); };
    const lift = v => v.clone().add(new THREE.Vector3(0, .05, 0));
    rod(lift(C[0]), lift(R0[long ? 0 : 1]), .085); rod(lift(C[1]), lift(R0[1]), .085); rod(lift(C[2]), lift(R0[long ? 1 : 0]), .085); rod(lift(C[3]), lift(R0[0]), .085); if (rl > .05) rod(lift(R0[0]), lift(R0[1]), .1);
    put(box(w + 2 * over, .06, d + 2 * over), 'ridge', 0, y0 - .03, 0);
    for (const sz of [1, -1]) for (let x = -w / 2; x <= w / 2 + .01; x += .55) put(box(.09, .09, over), 'cedar', x, y0 - .1, sz * (d / 2 + over / 2 + .02));
    roofTop = y0 + rise;
    // the arcade (a loggia before the ground floor): round arches on lathed columns, a pantile lean-to over it
    if (o.arcade) { const n = Math.max(3, Math.round(w / 2.2)), ad = 1.7, az = d / 2 + ad, span = w / n, colH = 2.05;
      put(box(w + .2, .18, ad + .1), 'stone', 0, pl - .09 + .09, d / 2 + ad / 2);
      const hs = []; for (let i = 0; i < n; i++) hs.push({ x: -w / 2 + (i + .5) * span, y: 0, w: span - .36, h: colH + (span - .36) / 2, arch: 1 });
      put(wallGeo(w, colH + span / 2 + .35, hs, .26), wallK, 0, yW, az);
      const lp = [[0, 0], [.16, 0], [.16, .1], [.11, .16], [.1, colH - .25], [.13, colH - .15], [.18, colH - .06], [.18, colH], [0, colH]].map(([a, b]) => new THREE.Vector2(a, b));
      for (let i = 0; i <= n; i++) { const x = Math.max(-w / 2 + .16, Math.min(w / 2 - .16, -w / 2 + i * span)); put(new THREE.LatheGeometry(lp, 12), 'stone', x, yW, az + .24); }
      const lw = w + .3, lt = yW + colH + span / 2 + .35, ll = ad + .6, lpitch = .2; put(box(lw, .12, .3), 'stone', 0, lt + .06, az);
      const g = new THREE.PlaneGeometry(lw, ll); g.rotateX(-Math.PI / 2); put(g, 'pantile', 0, lt + .22, d / 2 + ll / 2, 0, lpitch);
      depthOut = az + .4; }
  } else {
    // flat: a slab, a parapet with a rounded top, rainwater spouts through it, the terrace behind
    if (!o.hatch) put(box(w - .2, .14, d - .2), 'plinth', 0, top - .07, 0);
    else { /* o.hatch {x0, x1, z0, z1} (Session 891): the slab in four pieces round a hatch to the terrace */ const q = o.hatch, X0 = -w / 2 + .1, X1 = w / 2 - .1, Z0 = -d / 2 + .1, Z1 = d / 2 - .1;
      for (const [a0, a1, b0, b1] of [[X0, X1, q.z1, Z1], [X0, X1, Z0, q.z0], [X0, q.x0, q.z0, q.z1], [q.x1, X1, q.z0, q.z1]]) if (a1 - a0 > .01 && b1 - b0 > .01) put(box(a1 - a0, .14, b1 - b0), 'plinth', (a0 + a1) / 2, top - .07, (b0 + b1) / 2); }
    const ph = .62, pt = .26, cap = (len) => { const g = new THREE.CylinderGeometry(pt / 2, pt / 2, len, 10, 1, false, 0, Math.PI); g.rotateZ(Math.PI / 2); return g; };
    for (const sz of [1, -1]) { put(box(w + .04, ph - pt / 2, pt), wallK, 0, top + (ph - pt / 2) / 2 - .05, sz * (d / 2 - pt / 2 + .02)); put(cap(w + .04), wallK, 0, top + ph - pt / 2 - .05, sz * (d / 2 - pt / 2 + .02)); }
    for (const sx of [-1, 1]) { put(box(pt, ph - pt / 2, d - .2), wallK, sx * (w / 2 - pt / 2 + .02), top + (ph - pt / 2) / 2 - .05, 0); put(cap(d - .2), wallK, sx * (w / 2 - pt / 2 + .02), top + ph - pt / 2 - .05, 0, Math.PI / 2); }
    for (const sx of [-1, 1]) put(new THREE.CylinderGeometry(.06, .07, .55, 8), 'terra', sx * w * .3, top - .05, d / 2 + .22, 0, Math.PI / 2 + .25);
    roofTop = top + ph;
    // the dome (a rich house's or a temple's): a drum, the dome in blue glaze or limewash, a stone ring, a gilt finial
    if (o.dome) { const R = Math.min(w, d) * .27, x2 = -w * .18, z2 = -d * .1, pts = [];
      put(new THREE.CylinderGeometry(R * 1.02, R * 1.02, 1.0, 24), wallK, x2, top + .5, z2);
      for (let i = 0; i <= 12; i++) { const a = i / 12 * Math.PI / 2; pts.push(new THREE.Vector2(Math.max(.001, R * Math.cos(a) * (1 + .06 * Math.sin(a * 2))), R * 1.08 * Math.sin(a))); }
      put(new THREE.LatheGeometry(pts, 28), o.dome === 'white' ? wallK : 'glaze', x2, top + 1.0, z2);
      put(new THREE.TorusGeometry(R * 1.03, .05, 6, 28), 'stone', x2, top + 1.01, z2, 0, Math.PI / 2);
      put(new THREE.LatheGeometry([[.001, 0], [.07, 0], [.05, .12], [.09, .2], [.001, .42]].map(([a, b]) => new THREE.Vector2(a, b)), 10), 'gold', x2, top + 1.0 + R * 1.08 - .02, z2);
      roofTop = Math.max(roofTop, top + 1.0 + R * 1.08 + .4); }
    // the pergola: four cedar posts, two beams, the striped awning
    if (o.pergola) { const pw = Math.min(2.6, w * .42), pd = Math.min(2.2, d * .45), px0 = w / 2 - pw / 2 - .35, pz0 = d / 2 - pd / 2 - .35, ph2 = 1.95;
      for (const [sx, sz] of [[1, 1], [1, -1], [-1, 1], [-1, -1]]) put(new THREE.CylinderGeometry(.05, .06, ph2, 8), 'cedar', px0 + sx * pw / 2, top + ph2 / 2, pz0 + sz * pd / 2);
      for (const sz of [1, -1]) put(box(pw + .3, .09, .09), 'cedar', px0, top + ph2, pz0 + sz * pd / 2);
      const g = new THREE.PlaneGeometry(pw + .1, pd + .2); g.rotateX(-Math.PI / 2); put(g, 'awning', px0, top + ph2 + .07, pz0, 0, .06);
      roofTop = Math.max(roofTop, top + ph2 + .1); }
    // pots on the parapet, a bush in each
    for (let i = 0; i < 2; i++) { const x = (i ? 1 : -1) * (w / 2 - .5) * (.4 + r() * .5);
      put(new THREE.LatheGeometry([[.001, 0], [.12, 0], [.17, .12], [.15, .26], [.18, .3], [.001, .3]].map(([a, b]) => new THREE.Vector2(a, b)), 12), 'terra', x, top + ph - .05, d / 2 - .13);
      put(new THREE.IcosahedronGeometry(.22, 2), 'leaf', x, top + ph + .37, d / 2 - .13); }
  }
  // the outside stair to the roof (Greek-island): a solid flight up the side wall, stone treads
  if (o.stair && o.kind !== 'tile') { const sx = -(w / 2 + .5), n = Math.round(H / .24), run = Math.min(d - .6, n * .27), step = run / n, rise = H / n;
    for (let i = 0; i < n; i++) { const z = d / 2 - .4 - i * step, hy = (i + 1) * rise; put(box(.9, hy, step + .01), wallK, sx, yW + hy / 2, z - step / 2); put(box(.92, .04, step + .02), 'stone', sx, yW + hy + .02, z - step / 2); } }
  // greenery at the door: a cypress in a pot (a Roman house always), or a bougainvillea up the wall
  if (o.green !== false) { const gx = (dx > 0 ? -1 : 1) * (w / 2 - .55), gz = d / 2 + (o.kind === 'tile' ? (o.arcade ? 2.2 : .45) : .45);
    if (o.kind === 'tile' || r() < .5) { const ht = 3.4 + r() * 1.6, cp = [[.001, 0], [.34, .25], [.42, ht * .35], [.3, ht * .75], [.001, ht]].map(([a, b]) => new THREE.Vector2(a, b));
      const g = new THREE.LatheGeometry(cp, 12), P = g.attributes.position; for (let i = 0; i < P.count; i++) { const k = 1 + .12 * Math.sin(P.getY(i) * 7 + Math.atan2(P.getZ(i), P.getX(i)) * 5 + r() * .5); P.setX(i, P.getX(i) * k); P.setZ(i, P.getZ(i) * k); } g.computeVertexNormals();
      put(g, 'leaf2', gx, yW + .3, gz); put(new THREE.LatheGeometry([[.001, 0], [.2, 0], [.26, .2], [.24, .42], [.001, .42]].map(([a, b]) => new THREE.Vector2(a, b)), 12), 'terra', gx, 0, gz); }
    else { // a bougainvillea: a woody stem up the wall and a spray of small leaves and blooms thinning toward its top, spreading under the parapet
      const ht = Math.min(top - .3, yW + 2.4 + r() * (top - yW - 2.4)), lean = (r() - .5) * .6; put(new THREE.CylinderGeometry(.03, .05, ht - .1, 5), 'cedar', gx + lean / 2, (ht - .1) / 2 + .05, d / 2 + .1, 0, 0, -lean / ht);
      for (let i = 0; i < 120; i++) { const t = Math.pow(r(), .7), y = .3 + t * (ht - .3), spread = .25 + .9 * t * t, x = Math.max(-w / 2 + .1, Math.min(w / 2 - .1, gx + lean * t + (r() - .5) * 2 * spread));
        put(new THREE.IcosahedronGeometry(.045 + r() * .05, 0), r() < .55 ? 'bloom' : 'leaf', x, y, d / 2 + .1 + r() * .14, r() * 6, r() * 6); } } }
  // one mesh per material; the top it reports is the whole house's (pots, bushes and the cypress included), for whatever stands over or labels it
  const { group, tris, draws, roofTop: rt } = finish(); roofTop = rt;
  group.userData = { roofTop, kind: o.kind }; return { group, roofTop, tris, draws, kind: o.kind, front: depthOut, open: { front, back, side }, doorX: dx, T, fh, yW, top };
}

// the tavern's own materials (rooms.js's homeMats): the room kit's, with Aurenne's tile, cedar, brass and cloth
let AH = null;
function homeMats() {
  if (AH) return AH; const M = roomMats(), std = (c, o = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: o.rough ?? .8, metalness: o.metal ?? 0 });
  const rugTex = (() => { const c = document.createElement('canvas'); c.width = 256; c.height = 384; const x = c.getContext('2d'); x.fillStyle = '#8a2a20'; x.fillRect(0, 0, 256, 384); x.fillStyle = '#26386e'; x.fillRect(10, 10, 236, 364); x.fillStyle = '#8a2a20'; x.fillRect(30, 30, 196, 324);
    x.fillStyle = '#d8a030'; for (let i = 0; i < 3; i++) { const cy = 92 + i * 100; x.beginPath(); x.moveTo(128, cy - 42); x.lineTo(180, cy); x.lineTo(128, cy + 42); x.lineTo(76, cy); x.closePath(); x.fill(); }
    x.fillStyle = '#e8dcc0'; for (let i = 0; i < 24; i++) x.fillRect(16 + (i % 12) * 19, i < 12 ? 16 : 362, 8, 6); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.NoColorSpace; return t; })();
  AH = { ...M, limestone: mat('limestone', { ns: 1.0, rough: .8 }), tile: mat('flag', { ns: .7, color: 0xf0a078, rough: .7 }), zellige: mat('zellige', { ns: .6, rough: .25 }), cedar: mat('wood', { ns: .9, color: 0xc89870, rough: .7 }),
    cedarD: mat('wood', { ns: .9, color: 0xa87048, rough: .7 }), plaster: mat('plaster', { ns: .5, color: 0xf3e6c8, rough: .95 }), brass: std(0xc8952e, { rough: .35, metal: .7 }), copper: std(0xb0603a, { rough: .4, metal: .6 }),
    terra: std(0xa8582f, { rough: .85 }), madder: mat('plaster', { ns: .3, color: 0x9a2a22, rough: 1 }), indigo: mat('plaster', { ns: .3, color: 0x26386e, rough: 1 }), saffron: mat('plaster', { ns: .3, color: 0xd8a030, rough: 1 }),
    weld: mat('plaster', { ns: .3, color: 0x8a9a3a, rough: 1 }), rug: new THREE.MeshStandardMaterial({ map: rugTex, roughness: 1 }), dark: std(0x0d0a08, { rough: 1 }), step: mat('limestone', { ns: .8, color: 0xe8e0d0, rough: .85 }), leaf: std(0x4f6e34, { rough: .9 }), grape: std(0x4a2a4a, { rough: .6 }), wine: std(0x5a1420, { rough: .2 }) };
  for (const k of ['madder', 'indigo', 'saffron', 'weld']) AH[k].side = THREE.DoubleSide; /* the hung cloths are one sheet */
  return AH;
}
// aurenneTavern(o, r) (Session 895, card F9; L9's three inns, OG-108's "Aurenne tavern on a terrace over the sea"; Michael's A on #303: rooms
//   inside the street's own shell): pieces.js's Roman house of Aurenne (the tile kind, 9.6 by 8.0 m, one storey of 3.0 m under a hipped
//   pantile roof, its arcade of four round arches across the front; o.interior) as a tavern over the harbour. Inside: a tiled floor and
//   a glazed dado, the counter across the back faced in zellige with amphorae and jars on shelves behind it, a rack of amphorae in a
//   corner, the cooking bench with its braziers, two small tables by the side windows, cedar beams under the roof, brass lamps. Under the
//   arcade, the loggia with two small tables; beyond it a paved terrace of 4 m to a parapet over the quay wall, three round tables with
//   chairs under a pergola of vines. The sea is the page's (rooms-view.js), 3 m below the terrace.
//   -> { group, shell, room, tris, draws, inner, floor, terrace: { z0, z1, y, parapet }, loggia: { z0, z1 }, arches: [x...], door, counter,
//        tables, seats, path, path2, boxes, lamps, braziers, w, d }
function aurenneTavern(o = {}, r = stream('tavern')) {
  const w = 9.6, d = 8.0, sh = aurenneHouse({ kind: 'tile', w, d, two: false, arcade: true, wall: 0, door: 2, pointed: false, green: false, interior: true }, stream('tavern-shell'));
  const M = homeMats(), B = new Map(), boxes = [];
  const put = (geo, key, x = 0, y = 0, z = 0, ry = 0, uv = .6) => { const g = geo.index ? geo.toNonIndexed() : geo; for (const k of Object.keys(g.attributes)) if (!['position', 'normal'].includes(k)) g.deleteAttribute(k);
    g.applyMatrix4(new THREE.Matrix4().compose(new THREE.Vector3(x, y, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(0, ry, 0)), new THREE.Vector3(1, 1, 1))); worldUV(g, uv); if (!B.has(key)) B.set(key, []); B.get(key).push(g); return g; };
  const UVK = { zellige: 1.47, tile: 1.1 }, bx = (key, x0, x1, y0, y1, z0, z1, tag) => { put(new THREE.BoxGeometry(x1 - x0, y1 - y0, z1 - z0), key, (x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2, 0, UVK[key] ?? .6); if (tag) boxes.push({ tag, x0, x1, y0, y1, z0, z1 }); };
  const X = w / 2 - sh.T, Z = d / 2 - sh.T, F0 = sh.yW + .06, TOP = sh.top, ad = 1.7, az = d / 2 + ad, FT = sh.yW + .09 /* the loggia's slab, as the shell lays it */;
  const n = Math.max(3, Math.round(w / 2.2)), span = w / n, arches = Array.from({ length: n }, (_, i) => -w / 2 + (i + .5) * span);
  // inside: red tiles, the dado to 1.0 m, cedar beams across under the roof
  bx('tile', -X, X, sh.yW, F0, -Z, Z); for (const e of [-1, 1]) bx('zellige', e > 0 ? X - .02 : -X, e > 0 ? X : -X + .02, F0, F0 + 1.0, -Z, Z); bx('zellige', -X, X, F0, F0 + 1.0, -Z, -Z + .02);
  { const dg = 1.05 / 2 + .05; bx('zellige', -X, sh.doorX - dg, F0, F0 + 1.0, Z - .02, Z); bx('zellige', sh.doorX + dg, X, F0, F0 + 1.0, Z - .02, Z); }
  for (let x = -X + .6; x < X - .3; x += 1.1) bx('cedarD', x - .08, x + .08, TOP - .22, TOP, -Z, Z);
  // the counter across the back, faced in glazed tile; shelves behind it of amphorae and jars; a cedar top at 1.05 m
  const counter = { x0: -2.6, x1: 1.6, z0: -Z + .95, z1: -Z + 1.5, y: F0 + 1.05 }; bx('plaster', counter.x0, counter.x1, F0, counter.y - .05, counter.z0, counter.z1, 'counter'); bx('zellige', counter.x0, counter.x1, F0 + .1, counter.y - .1, counter.z1, counter.z1 + .02);
  bx('cedar', counter.x0 - .05, counter.x1 + .05, counter.y - .05, counter.y, counter.z0 - .04, counter.z1 + .06);
  const amph = s => new THREE.LatheGeometry([[.001, 0], [.04, 0], [.12, .15], [.2, .42], [.18, .62], [.07, .74], [.06, .86], [.08, .9], [.001, .9]].map(([a, b]) => new THREE.Vector2(a * s, b * s)), 12);
  for (const y of [1.25, 1.85]) for (const [s0, s1] of [[counter.x0, -.5], [.5, counter.x1]] /* broken round the back window */) { bx('cedar', s0, s1, F0 + y - .03, F0 + y, -Z, -Z + .35); for (let x = s0 + .2; x < s1 - .1; x += .32) { if (r() < .5) put(amph(.4), 'terra', x, F0 + y, -Z + .18); else put(new THREE.CylinderGeometry(.08, .1, .24, 10), r() < .5 ? 'blue' : 'delft', x, F0 + y + .12, -Z + .18); } }
  for (let k = 0; k < 4; k++) put(new THREE.CylinderGeometry(.04, .045, .12, 10), 'wine', counter.x0 + .5 + k * .9, counter.y + .06, (counter.z0 + counter.z1) / 2);
  // a rack of amphorae in the back right corner, leaning in a cedar frame; the cooking bench along the right wall's back half
  { const x0 = X - 1.6, x1 = X - .05, z0 = -Z + .05, z1 = -Z + .7; bx('cedar', x0, x1, F0 + .55, F0 + .6, z0, z1, 'amphorarack'); for (const x of [x0, x1 - .05]) bx('cedar', x, x + .05, F0, F0 + .6, z0, z1);
    for (let x = x0 + .25; x < x1 - .1; x += .4) { const g = amph(.95); g.rotateX(-.25); put(g, 'terra', x, F0 + .02, (z0 + z1) / 2 + .1); } }
  const braziers = [], kb = { x0: X - .65, x1: X, z0: -Z + 1.0, z1: -.6 }; bx('plaster', kb.x0, kb.x1, F0, F0 + .82, kb.z0, kb.z1, 'cookbench'); bx('zellige', kb.x0 - .03, kb.x1, F0 + .82, F0 + .86, kb.z0 - .03, kb.z1 + .03);
  for (const z of [kb.z0 + .5, kb.z0 + 1.3]) { bx('dark', kb.x0 + .15, kb.x1 - .15, F0 + .86, F0 + .87, z - .2, z + .2); put(new THREE.SphereGeometry(.13, 8, 5).scale(1.2, .3, 1.2), 'ember', (kb.x0 + kb.x1) / 2, F0 + .87, z); braziers.push([(kb.x0 + kb.x1) / 2, F0 + .87, z]); }
  put(new THREE.SphereGeometry(.15, 12, 8, 0, Math.PI * 2, .4, Math.PI - .4), 'copper', (kb.x0 + kb.x1) / 2, F0 + 1.0, kb.z0 + .5);
  { const y = F0 + 1.75; bx('iron', X - .2, X - .17, y, y + .03, kb.z0 + .1, kb.z1 - .1); for (let k = 0; k < 3; k++) { const z = kb.z0 + .4 + k * .45, rr = .09 + (k % 2) * .04; put(new THREE.CylinderGeometry(rr, rr * .85, rr * 1.2, 14), 'copper', X - .19 - rr, y - .2 - rr * .6, z); } }
  // tables: two small square ones by the side windows inside, two round ones in the loggia, three on the terrace; stools and chairs
  const tables = [], seats = [];
  const table = (x, z, round, tag) => { const y = F0 + .74, ty = (tag === 'out' ? FT : F0) + .74 - (tag === 'out' ? 0 : 0);
    if (round) { put(new THREE.CylinderGeometry(.36, .36, .04, 20), 'cedar', x, ty - .02, z); put(new THREE.CylinderGeometry(.04, .05, ty - (tag === 'out' ? FT : F0), 8), 'iron', x, (ty + (tag === 'out' ? FT : F0)) / 2, z); boxes.push({ tag: 'table', x0: x - .36, x1: x + .36, y0: ty - .74, y1: ty, z0: z - .36, z1: z + .36 }); }
    else { bx('cedar', x - .4, x + .4, ty - .04, ty, z - .4, z + .4, 'table'); for (const sx of [-1, 1]) for (const sz of [-1, 1]) bx('cedarD', x + sx * .34 - .03, x + sx * .34 + .03, ty - .74, ty - .04, z + sz * .34 - .03, z + sz * .34 + .03); }
    tables.push({ x, z, y: ty, base: ty - .74 }); put(new THREE.CylinderGeometry(.035, .03, .1, 10), 'wine', x + .1, ty + .05, z); put(new THREE.CylinderGeometry(.11, .11, .015, 14), 'delft', x - .12, ty + .008, z + .05); };
  const stool = (x, z, base) => { bx('cedar', x - .16, x + .16, base + .42, base + .46, z - .16, z + .16, 'stool'); for (const a of [.6, 2.7, 4.8]) put(new THREE.CylinderGeometry(.018, .022, .42, 6), 'cedarD', x + Math.cos(a) * .11, base + .21, z + Math.sin(a) * .11); seats.push(.46); };
  for (const sx of [-1, 1]) { const x = sx * (X - .9); table(x, .2, false, 'in'); stool(x, .2 + .7, F0); stool(x, .2 - .7, F0); }
  for (const x of [arches[0] + .4, arches[n - 1] - .4]) { const z = d / 2 + ad / 2 + .05; table(x, z, true, 'out'); stool(x - .58, z, FT); stool(x + .58, z, FT); }
  // the terrace: paving from the arcade 4 m out to a parapet on the quay wall, which drops 3.2 m to the sea
  const T0 = az + .05, T1 = az + 4.05, terrace = { z0: T0, z1: T1, y: FT, parapet: FT + .62, quayFoot: -3.4 };
  bx('step', -w / 2 - .1, w / 2 + .1, FT - .4, FT, T0, T1); bx('step', -w / 2 - .1, w / 2 + .1, terrace.quayFoot, FT - .4, T1 - .5, T1 + .25);
  for (const [x0, x1, z0, z1] of [[-w / 2 - .1, w / 2 + .1, T1 - .3, T1], [-w / 2 - .1, -w / 2 + .2, T0, T1], [w / 2 - .2, w / 2 + .1, T0, T1]]) { bx('plaster', x0, x1, FT, FT + .55, z0, z1, 'parapet'); bx('step', x0 - .03, x1 + .03, FT + .55, FT + .62, z0 - .03, z1 + .03); }
  for (const [x, z] of [[-2.6, T0 + 1.5], [.3, T0 + 2.6], [2.9, T0 + 1.4]]) { table(x, z, true, 'out'); for (const a of [0, Math.PI]) { const cx = x + Math.cos(a) * .62, cz = z + Math.sin(a) * .62 + (a ? 0 : 0); stool(cx, cz, FT); } }
  // the pergola over the terrace: cedar posts, beams across, a vine over them with clusters of grapes
  const PZ0 = T0 + .5, PZ1 = T1 - .6, PY = FT + 2.6; for (const x of [-w / 2 + .5, 0, w / 2 - .5]) for (const z of [PZ0, PZ1]) bx('cedar', x - .06, x + .06, FT, PY, z - .06, z + .06, 'pergolapost');
  for (const z of [PZ0, PZ1]) bx('cedar', -w / 2 + .3, w / 2 - .3, PY, PY + .14, z - .07, z + .07); for (let x = -w / 2 + .5; x <= w / 2 - .4; x += .6) bx('cedar', x - .04, x + .04, PY + .14, PY + .22, PZ0 - .3, PZ1 + .3);
  for (let i = 0; i < 160; i++) { const x = -w / 2 + .4 + r() * (w - .8), z = PZ0 - .2 + r() * (PZ1 - PZ0 + .4); put(new THREE.IcosahedronGeometry(.12 + r() * .1, 0), 'leaf', x, PY + .26 + r() * .1, z, r() * 6); if (r() < .08) put(new THREE.ConeGeometry(.07, .2, 6).rotateX(Math.PI), 'grape', x, PY + .05, z); }
  for (const x of [-w / 2 + .5, w / 2 - .5]) for (let k = 0; k < 14; k++) put(new THREE.IcosahedronGeometry(.08 + r() * .05, 0), 'leaf', x + (r() - .5) * .2, FT + .3 + k * .17, PZ1 + (r() - .5) * .2, r() * 6);
  // the lamps: two brass lanterns inside from the beams, and one in the middle arch
  const lamps = []; for (const [x, y, z] of [[-1.6, TOP - .75, .2], [1.8, TOP - .75, -.8]]) { bx('iron', x - .005, x + .005, y + .2, TOP - .2, z - .005, z + .005); put(new THREE.CylinderGeometry(.1, .12, .26, 8), 'glow', x, y, z); put(new THREE.ConeGeometry(.14, .18, 8), 'brass', x, y + .22, z); lamps.push([x, y, z]); }
  // the door's leaf hung open inside, against the front wall
  { const lw = 1.05, lx = sh.doorX - lw / 2 - .04 - lw / 2; bx('cedarD', lx - lw / 2, lx + lw / 2, F0, F0 + 1.95, Z - .06, Z, 'leaf'); }
  // the walks: in at the door to the counter; out through the loggia and the arch beside the door, across the terrace to the parapet
  const path = [[sh.doorX, Z - .3], [sh.doorX, counter.z1 + .4]], path2 = [[sh.doorX, d / 2 + .3], [arches[Math.floor(n / 2)], d / 2 + ad * .6], [arches[Math.floor(n / 2)], T0 + .3], [arches[Math.floor(n / 2)] + .3, T1 - .7]];
  const group = new THREE.Group(); let tris = 0; for (const [k, gs] of B) { const g = mergeGeometries(gs, false); gs.forEach(x => x.dispose()); const m = new THREE.Mesh(g, M[k]); m.name = k; m.castShadow = !['flame', 'ember', 'glow'].includes(k); m.receiveShadow = true; group.add(m); tris += g.attributes.position.count / 3; }
  const all = new THREE.Group(); all.add(sh.group, group);
  return { group: all, shell: sh.group, room: group, tris: Math.round(tris), draws: group.children.length, shellTris: sh.tris, shellCalls: sh.draws, inner: { x0: -X, x1: X, z0: -Z, z1: Z }, floor: F0, ceil: TOP - .22, terrace, loggia: { z0: d / 2, z1: az },
    arches, door: { x: sh.doorX, z: d / 2, w: 1.05, h: 2.0 }, counter, tables, seats, path, path2, boxes, lamps, braziers, w, d };
}
// ── the six gods' row of seven at the town church (Session 1224; Michael's B on #464, after his C on #439; card F6) ──
// shrines.js's row('gatelands', { yard: true }) (Session 1172), as plain script. One common niche a god: a limewashed stele 1.0 m wide and
// 2.3 m to the top of its arch on a limestone plinth, a recess 0.62 m wide with its sill at 1.03 m, a robed figure 0.95 m tall holding
// the god's icon (a wolf sitting in its place for Na Beithígh), the god's name cut under the sill and the icon in a roundel over the
// arch, a candle on the sill and a stone basin before it; the Guest's the same stele with all of it struck away. In a churchyard the row
// has no wall, well, thorn or cross of its own: rags on the hood mouldings' stops and primroses at the foot. The niches' front faces at
// z 0, the church at +z, 1.4 m apart, the Guest's last at +x. Differences from the prototype: the names and roundels are painted on one
// sheet and drawn as one mesh, and the rags, leaves, flowers and wax are one material over a strip of their colours, so the row is
// 8 materials, not 25; the same streams roll the same candles, rags and flowers.
const ROW_GODS = [
  { key: 'muir', name: 'An Mhuir', en: 'the Sea', icon: 'hull' }, { key: 'speir', name: 'An Spéir', en: 'the Sky', icon: 'sundial' },
  { key: 'beithigh', name: 'Na Beithígh', en: 'the Beasts', icon: 'wolf' }, { key: 'cloch', name: 'An Chloch', en: 'the Stone', icon: 'gate' },
  { key: 'teallach', name: 'An Teallach', en: 'the Hearth', icon: 'lamp' }, { key: 'fiodoir', name: 'An Fíodóir', en: 'the Weaver', icon: 'shuttle' }];
const ROW_INK = '#5a5248', ROW_PAL = [0xa83a2a, 0xe6e0d0, 0x3a5a8a, 0x4e7a3a, 0xd8b040, 0x3e5a28, 0xf0dc6a, 0xf4f0e4, 0xeee2c4];
const PAL = { rag0: 0, rag1: 1, rag2: 2, rag3: 3, rag4: 4, leaf: 5, prim: 6, bloomW: 7, wax: 8 };
// struck stone: the face cut back with a point chisel, rows of short gouges over a rough ground, paler than the weathered face
PAINTERS.chisel = () => texPair(256, (x, y) => { const g = tn(x * 2, y * 2, 64, 3), n = tfbm(x, y, 16, 4, 5), pit = Math.max(0, tn(x, y, 96, 9) - .72) * 2, h = g * .45 + n * .55 - pit; const v = .74 + .08 * n - pit * .12; return [h, v, v * .97, v * .92]; }, 1.6);
const ICON2D = {
  hull: x => { x.beginPath(); x.moveTo(30, 132); x.quadraticCurveTo(128, 230, 226, 132); x.lineTo(196, 132); x.quadraticCurveTo(128, 196, 60, 132); x.closePath(); x.fill(); x.fillRect(122, 40, 12, 96); x.beginPath(); x.moveTo(136, 48); x.lineTo(196, 118); x.lineTo(136, 118); x.closePath(); x.fill(); },
  sundial: x => { x.lineWidth = 12; x.beginPath(); x.arc(128, 128, 84, 0, Math.PI * 2); x.stroke(); x.lineWidth = 6; for (let k = 0; k < 12; k++) { const a = k / 12 * Math.PI * 2; x.beginPath(); x.moveTo(128 + Math.cos(a) * 58, 128 + Math.sin(a) * 58); x.lineTo(128 + Math.cos(a) * 76, 128 + Math.sin(a) * 76); x.stroke(); }
    x.beginPath(); x.moveTo(128, 128); x.lineTo(196, 72); x.lineTo(128, 72); x.closePath(); x.fill(); },
  wolf: x => { x.beginPath(); [[60, 200], [76, 120], [64, 52], [100, 92], [128, 84], [150, 60], [160, 96], [214, 128], [208, 146], [160, 146], [150, 200]].forEach(([a, b], i) => i ? x.lineTo(a, b) : x.moveTo(a, b)); x.closePath(); x.fill(); },
  gate: x => { x.fillRect(60, 70, 34, 140); x.fillRect(162, 70, 34, 140); x.fillRect(44, 44, 168, 32); x.lineWidth = 8; x.beginPath(); x.arc(128, 150, 32, Math.PI, 0); x.stroke(); },
  lamp: x => { x.beginPath(); x.ellipse(118, 160, 72, 30, 0, 0, Math.PI * 2); x.fill(); x.beginPath(); x.moveTo(180, 148); x.lineTo(222, 128); x.lineTo(222, 146); x.lineTo(186, 172); x.closePath(); x.fill(); x.fillRect(100, 186, 36, 22);
    x.beginPath(); x.moveTo(214, 122); x.quadraticCurveTo(196, 80, 220, 40); x.quadraticCurveTo(246, 84, 226, 122); x.closePath(); x.fill(); },
  shuttle: x => { x.beginPath(); x.moveTo(20, 128); x.quadraticCurveTo(128, 72, 236, 128); x.quadraticCurveTo(128, 184, 20, 128); x.closePath(); x.fill(); x.save(); x.globalCompositeOperation = 'destination-out'; x.fillRect(96, 116, 64, 24); x.restore(); x.fillRect(104, 122, 48, 12); } };
// the sheet: the six names (512 by 192 each, two columns) over the six roundels (256 square, four to a row), letters as a mason cuts
// them, the stroke dark with a pale lip under it; returns the material and each cell's rect in uv
let ROW_SHEET = null;
function rowSheet() {
  if (ROW_SHEET) return ROW_SHEET; const c = document.createElement('canvas'); c.width = 1024; c.height = 1088; const x = c.getContext('2d'), cells = {};
  const uvr = (px, py, w, h) => [px / c.width, 1 - (py + h) / c.height, (px + w) / c.width, 1 - py / c.height];
  ROW_GODS.forEach((god, i) => { const px = (i % 2) * 512, py = Math.floor(i / 2) * 192, w = 512, h = 192; x.save(); x.translate(px, py); x.textAlign = 'center'; x.textBaseline = 'middle';
    const line = (s, y, f) => { x.font = f; x.fillStyle = 'rgba(255,255,255,.35)'; x.fillText(s, w / 2, y + 2); x.fillStyle = ROW_INK; x.fillText(s, w / 2, y); };
    line(god.name.toUpperCase(), h * .4, `600 ${h * .3}px Georgia, 'Times New Roman', serif`); line(god.en, h * .76, `italic ${h * .2}px Georgia, 'Times New Roman', serif`); x.restore();
    cells['n:' + god.key] = uvr(px, py, w, h);
    const ix = (i % 4) * 256, iy = 576 + Math.floor(i / 4) * 256; x.save(); x.beginPath(); x.rect(ix, iy, 256, 256); x.clip(); x.translate(ix, iy);
    x.fillStyle = 'rgba(255,255,255,.3)'; x.translate(0, 3); ICON2D[god.icon](x); x.translate(0, -3); x.fillStyle = ROW_INK; x.strokeStyle = ROW_INK; ICON2D[god.icon](x);
    x.lineWidth = 6; x.beginPath(); x.arc(128, 128, 122, 0, Math.PI * 2); x.stroke(); x.restore(); cells['i:' + god.key] = uvr(ix, iy, 256, 256); });
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.NoColorSpace; t.anisotropy = 8;
  const m = new THREE.MeshStandardMaterial({ map: t, transparent: true, alphaTest: .25, roughness: .95, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2 });
  return (ROW_SHEET = { m, cells });
}
let ROWM = null;
function rowMats() {
  if (ROWM) return ROWM;
  const std = (c, o = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: o.rough ?? .8, metalness: o.metal ?? 0, side: o.side ?? THREE.FrontSide, ...(o.em ? { emissive: new THREE.Color(...o.em), emissiveIntensity: o.ei ?? 2 } : {}) });
  const pc = document.createElement('canvas'); pc.width = 16; pc.height = 1; const px = pc.getContext('2d'); ROW_PAL.forEach((h, i) => { px.fillStyle = '#' + h.toString(16).padStart(6, '0'); px.fillRect(i, 0, 1, 1); });
  const pt = new THREE.CanvasTexture(pc); pt.colorSpace = THREE.NoColorSpace; pt.magFilter = pt.minFilter = THREE.NearestFilter; pt.generateMipmaps = false;
  ROWM = { lime: mat('plaster', { ns: .7, color: 0xf4f1ea, rough: .95 }), limestone: mat('plaster', { ns: .9, color: 0xc2bcb0, rough: .9 }), statG: mat('plaster', { ns: .5, color: 0xd6d0c2, rough: .85 }),
    chisel: mat('chisel', { ns: 1.6, color: 0xf2eee6, rough: 1 }), water: std(0x1a2a2c, { rough: .05, metal: .2 }),
    flame: new THREE.MeshStandardMaterial({ color: 0xffb060, emissive: new THREE.Color(1, .6, .22), emissiveIntensity: 5, transparent: true, opacity: .9, depthWrite: false }),
    pal: new THREE.MeshStandardMaterial({ map: pt, roughness: .9, side: THREE.DoubleSide }), sheet: rowSheet().m };
  return ROWM;
}
function shrineRow(o = {}) {
  const M = rowMats(), SH = rowSheet(), B = new Map(), r = stream('row:gatelands'), niches = [];
  // a geometry into its material's list; a palette key ('rag0', 'leaf', …) takes its colour's texel in the strip as every uv
  const put = (geo, key, x = 0, y = 0, z = 0, ry = 0, rx = 0, rz = 0, s = 1, uv = .8) => { const g = geo.index ? geo.toNonIndexed() : geo; for (const k of Object.keys(g.attributes)) if (!['position', 'normal'].includes(k)) g.deleteAttribute(k);
    g.applyMatrix4(new THREE.Matrix4().compose(new THREE.Vector3(x, y, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(rx, ry, rz, 'YXZ')), new THREE.Vector3(s, s, s))); worldUV(g, uv);
    let k = key; if (k in PAL) { const U = g.attributes.uv; for (let i = 0; i < U.count; i++) U.setXY(i, (PAL[k] + .5) / 16, .5); k = 'pal'; }
    if (!B.has(k)) B.set(k, []); B.get(k).push(g); return g; };
  const bx = (key, x0, x1, y0, y1, z0, z1, uv) => put(new THREE.BoxGeometry(x1 - x0, y1 - y0, z1 - z0), key, (x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2, 0, 0, 0, 1, uv);
  const rod = (key, a, b, r0, r1, seg = 8) => { const A = new THREE.Vector3(...a), Bv = new THREE.Vector3(...b), d = Bv.clone().sub(A), g = new THREE.CylinderGeometry(r1, r0, d.length(), seg);
    g.applyMatrix4(new THREE.Matrix4().makeRotationFromQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.clone().normalize()))); g.translate(...A.clone().add(Bv).multiplyScalar(.5).toArray()); return put(g, key); };
  // a sub-builder whose pieces are moved as one (an icon built at the temple's size, then scaled into a figure's hands)
  const sub = (fn, x, y, z, s = 1) => { const n0 = new Map([...B].map(([k, v]) => [k, v.length])); fn(); const m = new THREE.Matrix4().compose(new THREE.Vector3(x, y, z), new THREE.Quaternion(), new THREE.Vector3(s, s, s));
    for (const [k, gs] of B) for (let i = n0.get(k) || 0; i < gs.length; i++) { gs[i].applyMatrix4(m); if (k !== 'pal') worldUV(gs[i], .8 / s); } };
  // a plane of the sheet, its uvs the cell's
  const plate = (cell, w, h, x, y, z) => { const g = new THREE.PlaneGeometry(w, h), [u0, v0, u1, v1] = SH.cells[cell], U = g.attributes.uv; for (let i = 0; i < U.count; i++) U.setXY(i, U.getX(i) ? u1 : u0, U.getY(i) ? v1 : v0);
    g.translate(x, y, z); const n = g.toNonIndexed(); if (!B.has('sheet')) B.set('sheet', []); B.get('sheet').push(n); };
  // the figure: a robe turned on a lathe, flattened front to back, a hood over the head, the arms bent to hold the icon at the breast
  const ROBE = [[.001, 0], [.36, 0], [.34, .25], [.28, .7], [.25, 1.05], [.27, 1.3], [.25, 1.5], [.16, 1.62], [.08, 1.66], [.001, 1.67]];
  const robed = (key, x, y0, z, sh) => { const k = sh / 2.05;
    const robe = new THREE.LatheGeometry(ROBE.map(([a, b]) => new THREE.Vector2(a * k, b * k)), 16); robe.scale(1, 1, .78); put(robe, key, x, y0, z);
    put(new THREE.SphereGeometry(.12 * k, 14, 10).scale(1, 1.2, 1), key, x, y0 + sh * .86, z + .02 * k); put(new THREE.SphereGeometry(.15 * k, 14, 10, 0, Math.PI * 2, 0, Math.PI * .62).scale(1.05, 1.25, 1).rotateX(.35), key, x, y0 + sh * .865, z - .02 * k);
    for (const s of [-1, 1]) { const S = [x + s * .22 * k, y0 + sh * .74, z + .02 * k], E = [x + s * .23 * k, y0 + sh * .55, z + .1 * k], Hn = [x + s * .08 * k, y0 + sh * .6, z + .36 * k];
      rod(key, S, E, .07 * k, .06 * k); rod(key, E, Hn, .06 * k, .05 * k); put(new THREE.SphereGeometry(.065 * k, 8, 6), key, ...E); put(new THREE.SphereGeometry(.055 * k, 8, 6), key, ...Hn); }
    return [x, y0 + sh * .62, z + .44 * k, k]; };
  const icon3d = (icon, key, [x, y, z, k]) => sub(() => {
    if (icon === 'lamp') { put(new THREE.CylinderGeometry(.1, .06, .06, 14), key); bx(key, -.025, .025, -.01, .03, .08, .17); put(new THREE.SphereGeometry(.025, 8, 6).scale(1, 2.4, 1), 'flame', 0, .08, .15); }
    else if (icon === 'hull') { put(new THREE.SphereGeometry(.2, 14, 8, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2).scale(1.5, .9, .5), key, 0, .1, 0); bx(key, -.27, .27, .085, .1, -.1, .1); bx(key, -.005, .005, .06, .34, -.005, .005); }
    else if (icon === 'sundial') { put(new THREE.CylinderGeometry(.16, .16, .035, 20).rotateX(Math.PI / 2), key, 0, .1, 0); const s = new THREE.Shape(); s.moveTo(0, 0); s.lineTo(.13, 0); s.lineTo(0, .11); s.lineTo(0, 0);
      put(new THREE.ExtrudeGeometry(s, { depth: .015, bevelEnabled: false }), key, -.02, .1, .018); }
    else if (icon === 'gate') { for (const s of [-1, 1]) bx(key, s * .1 - .035, s * .1 + .035, -.1, .2, -.04, .04); bx(key, -.17, .17, .2, .27, -.05, .05); }
    else if (icon === 'shuttle') { put(new THREE.CylinderGeometry(.045, .045, .2, 10).rotateZ(Math.PI / 2), key); for (const s of [-1, 1]) put(new THREE.ConeGeometry(.045, .2, 10).rotateZ(-s * Math.PI / 2), key, s * .2, 0, 0);
      put(new THREE.CylinderGeometry(.03, .03, .14, 8).rotateZ(Math.PI / 2), 'rag4', 0, 0, .03); } }, x, y, z, k);
  // Na Beithígh's wolf, sitting, 0.8 m to the ears, facing +z
  const wolf = (key, x, y0, z) => sub(() => {
    put(new THREE.SphereGeometry(.2, 14, 10).scale(1.1, .85, 1.25), key, 0, .19, -.08); put(new THREE.SphereGeometry(.16, 14, 10).scale(.9, 1.45, .95), key, 0, .42, .03, 0, -.25);
    put(new THREE.SphereGeometry(.105, 14, 10).scale(1, .95, 1.1), key, 0, .66, .1); put(new THREE.ConeGeometry(.055, .17, 10).rotateX(Math.PI / 2), key, 0, .63, .23); put(new THREE.SphereGeometry(.02, 6, 5), key, 0, .635, .315);
    for (const s of [-1, 1]) { put(new THREE.ConeGeometry(.035, .1, 6), key, s * .055, .77, .06, 0, -.15, s * -.25); rod(key, [s * .075, .02, .17], [s * .07, .4, .1], .032, .04); put(new THREE.SphereGeometry(.04, 8, 6).scale(1, .6, 1.4), key, s * .075, .025, .19);
      put(new THREE.SphereGeometry(.07, 10, 8).scale(.8, .6, 1.8), key, s * .14, .08, -.02); }
    rod(key, [.12, .05, -.24], [.2, .04, .05], .045, .025); rod(key, [.2, .04, .05], [.12, .04, .2], .025, .012); }, x, y0, z);
  // the common niche
  const W = 1.0, SPRING = 1.8, PL = .25, SILL = .78, RW = .62, RSPRING = 1.52, DF = .32, DB = .16;
  const outline = () => { const s = new THREE.Shape(); s.moveTo(-W / 2, 0); s.lineTo(W / 2, 0); s.lineTo(W / 2, SPRING); s.absarc(0, SPRING, W / 2, 0, Math.PI, false); s.lineTo(-W / 2, 0); return s; };
  const recess = P => { P.moveTo(-RW / 2, SILL); P.lineTo(RW / 2, SILL); P.lineTo(RW / 2, RSPRING); P.absarc(0, RSPRING, RW / 2, 0, Math.PI, false); P.lineTo(-RW / 2, SILL); return P; };
  const niche = (godKey, x0) => {
    const guest = godKey === 'guest', god = ROW_GODS.find(g => g.key === godKey), rn = stream(`niche:gatelands:${godKey}:${x0}`);
    // the plinth, a step wider than the stele, and the stele on it: a frame with the recess through it, and a back slab
    bx('limestone', x0 - .6, x0 + .6, -.35, PL, -.58, .14);
    const fr = outline(); fr.holes.push(recess(new THREE.Path())); put(new THREE.ExtrudeGeometry(fr, { depth: DF - .02, bevelEnabled: true, bevelThickness: .01, bevelSize: .01, bevelSegments: 1, curveSegments: 14 }), 'lime', x0, PL, -DF + .01);
    put(new THREE.ExtrudeGeometry(outline(), { depth: DB, bevelEnabled: false, curveSegments: 14 }), 'lime', x0, PL, -DF - DB);
    put(new THREE.ShapeGeometry(recess(new THREE.Shape()), 14), 'lime', x0, PL, -DF + .004);
    // the hood moulding over the arch and its two stops, and the sill, a lip out over the face
    put(new THREE.TorusGeometry(RW / 2 + .06, .035, 6, 18, Math.PI), 'limestone', x0, PL + RSPRING, .015); for (const s of [-1, 1]) bx('limestone', x0 + s * (RW / 2 + .06) - .05, x0 + s * (RW / 2 + .06) + .05, PL + RSPRING - .1, PL + RSPRING, -.02, .05);
    bx('limestone', x0 - RW / 2 - .08, x0 + RW / 2 + .08, PL + SILL - .05, PL + SILL, -DF + .01, .07);
    const sillY = PL + SILL, fz = -DF / 2 - .01, pY = PL + .63, rY = PL + RSPRING + RW / 2 + .2;
    if (!guest) { plate('n:' + god.key, .78, .28, x0, pY, .006); plate('i:' + god.key, .24, .24, x0, rY, .006);
      if (god.icon === 'wolf') wolf('statG', x0, sillY, fz - .02); else icon3d(god.icon, 'statG', robed('statG', x0, sillY, fz, .95));
      const cx = x0 + .2, cz = -.04, ch = .1 + rn() * .06; put(new THREE.CylinderGeometry(.03, .032, ch, 10), 'wax', cx, sillY + ch / 2, cz); put(new THREE.SphereGeometry(.016, 6, 5).scale(1, 2.3, 1), 'flame', cx, sillY + ch + .035, cz);
    } else {
      // the figure struck away: a stump of the hem on the sill, its outline a scar on the back of the recess, the name and the roundel cut back
      const k = .95 / 2.05, stump = new THREE.LatheGeometry([[.001, 0], [.36, 0], [.35, .12], [.31, .2], [.001, .26]].map(([a, b]) => new THREE.Vector2(a * k, b * k)), 12); stump.scale(1, 1, .78); put(stump, 'chisel', x0, sillY, fz);
      const sil = new THREE.Shape(); ROBE.forEach(([a, b], i) => i ? sil.lineTo(a * k * 1.02, b * k) : sil.moveTo(0, 0)); for (let i = ROBE.length - 1; i >= 0; i--) sil.lineTo(-ROBE[i][0] * k * 1.02, ROBE[i][1] * k);
      put(new THREE.ExtrudeGeometry(sil, { depth: .012, bevelEnabled: false }), 'chisel', x0, sillY, -DF + .006);
      bx('chisel', x0 - .4, x0 + .4, pY - .14, pY + .14, -.012, .002); put(new THREE.CylinderGeometry(.13, .13, .012, 18).rotateX(Math.PI / 2), 'chisel', x0, rY, -.002); }
    // the basin before the niche, a bowl on a stem with water in it; none before the Guest's
    let basin = null; if (!guest) { const bz = .55; put(new THREE.CylinderGeometry(.08, .12, .52, 12), 'limestone', x0, .26, bz); put(new THREE.CylinderGeometry(.16, .16, .05, 14), 'limestone', x0, .025, bz);
      put(new THREE.LatheGeometry([[0, 0], [.1, .005], [.19, .05], [.25, .13], [.25, .16], [.22, .16], [.18, .08], [0, .06]].map(([a, b]) => new THREE.Vector2(a * .85, b * .85)), 18), 'limestone', x0, .52, bz);
      put(new THREE.CircleGeometry(.175, 18).rotateX(-Math.PI / 2), 'water', x0, .52 + .115, bz); basin = [x0, .52 + .136, bz]; }
    return { god: godKey, x: x0, sill: sillY, basin, pray: [x0, 1.1] }; };
  const ORDER = [...ROW_GODS.map(g => g.key), 'guest'], X = i => (i - 3) * 1.4;
  // o.ground: each niche's own ground over the row's (a row on a slope steps down it, each plinth sunk 0.35 m), its flowers and rag with it
  const dy = i => (o.ground && o.ground[i]) || 0, lift = (i, fn) => { const n0 = new Map([...B].map(([k, v]) => [k, v.length])); const out = fn(); const m = new THREE.Matrix4().makeTranslation(0, dy(i), 0);
    for (const [k, gs] of B) for (let j = n0.get(k) || 0; j < gs.length; j++) gs[j].applyMatrix4(m); return out; };
  ORDER.forEach((g, i) => { const n = lift(i, () => niche(g, X(i))); n.dy = dy(i); if (n.basin) n.basin[1] += dy(i); niches.push(n); });
  // primroses at the foot, and a rag tied on a hood moulding's stop of every niche but the Guest's
  for (let i = 0; i < 6; i++) for (let j = 0; j < 5; j++) lift(i, () => { const px = X(i) + (r() - .5) * .9, pz = .22 + (r() - .5) * .3; put(new THREE.IcosahedronGeometry(.07, 0).scale(1, .45, 1), 'leaf', px, .03, pz);
    for (let q = 0; q < 4; q++) put(new THREE.SphereGeometry(.018, 5, 4).scale(1, .5, 1), q % 3 ? 'prim' : 'bloomW', px + (r() - .5) * .1, .065, pz + (r() - .5) * .1); });
  ORDER.forEach((g, i) => { if (g === 'guest') return; const len = .22 + r() * .16; lift(i, () => put(new THREE.PlaneGeometry(.04, len), 'rag' + (i % 5), X(i) + (i % 2 ? 1 : -1) * (RW / 2 + .06), PL + RSPRING - .1 - len / 2, .06, (r() - .5) * .5, 0, (r() - .5) * .2)); });
  const group = new THREE.Group(); group.name = 'row of seven'; let tris = 0;
  for (const [k, gs] of B) { const g = mergeGeometries(gs); gs.forEach(x => x.dispose()); const m = new THREE.Mesh(g, M[k]); m.name = 'row:' + k; m.castShadow = !['flame', 'water', 'sheet', 'pal'].includes(k); m.receiveShadow = true; group.add(m); tris += g.attributes.position.count / 3; }
  return { group, tris: Math.round(tris), draws: group.children.length, niches, len: X(6) - X(0) + W, foot: { x0: X(0) - .6, x1: X(6) + .6, z0: -.58, z1: .14 } };
}
  return { stream, hashKey, mergeByMaterial, texturesMade: () => Object.keys(TEX).length, signsMade: () => Object.keys(SIGNS).filter(k => !PANEL_KEY.test(k)).length, panelsMade: () => Object.keys(SIGNS).filter(k => PANEL_KEY.test(k)).length,
    mk: { hall: markHall, alehall: markAlehall, mats: markMats },
    au: { house: aurenneHouse, tavern: aurenneTavern, mats: aurMats, roomMats: homeMats, AUR },
    gl: { PLANS, FIN, PS, PAINTS, TOWN: GL_TOWN, building, church, keep, row: shrineRow, ROW_GODS, inn: gatelandsInn, churchLen: n => +((n === 2 ? 2 : 3) * 4.8 + 1.6 + 5.6 - .5 + 7.2 - .9 - .02).toFixed(2), lot: gatelandsLot, mats: glMats, BAYS, bayPlan, bayWidth, baysFor } };
})();
