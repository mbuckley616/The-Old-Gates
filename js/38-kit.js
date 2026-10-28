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
  // Session 1455: the farmyard's cobbles, common.js's painter and its tileable Voronoi ([distance to nearest, to second, cell id])
  function vor(x, y, n, s) { let d1 = 9, d2 = 9, id = 0; const X = x * n, Y = y * n, i = Math.floor(X), j = Math.floor(Y);
    for (let b = -1; b <= 1; b++) for (let a = -1; a <= 1; a++) { const ci = i + a, cj = j + b, wi = ((ci % n) + n) % n, wj = ((cj % n) + n) % n, h = tn(wi / n + .001, wj / n + .001, 997, s), h2 = tn(wi / n + .37, wj / n + .11, 991, s + 3);
      const px = ci + .15 + .7 * h, py = cj + .15 + .7 * h2, d = Math.hypot(px - X, py - Y); if (d < d1) { d2 = d1; d1 = d; id = wi * 131 + wj; } else if (d < d2) d2 = d; }
    return [d1, d2, id]; }
  PAINTERS.cobble = () => texPair(512, (x, y) => { const [d1, d2, id] = vor(x, y, 9, 5), e = d2 - d1, r = idr(id), dome = Math.min(1, e * 6) ** .5, n = tfbm(x, y, 32, 3, r * 9);
    const mortar = e < .07; const h = mortar ? .05 * n : dome * (.75 + .25 * n); const g = mortar ? [.22, .2, .16] : [.40 + .16 * r + .1 * n, .38 + .13 * r + .08 * n, .34 + .1 * r + .06 * n]; return [h, ...g]; }, 3.2);
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
  // the front door's leaf is 2.2 m to the spring of its fanlight (an opening of 2.75 m; it was 2.4 under 2.95), the foundation's house door
  // (Session 1217, Michael's A on DECISION #514); the same in bayPlan's townhouse
  // the farmstead's outbuildings (Session 1194; OG-115's "farmstead with outbuildings", OG-114's farming): the byre, one low storey of
  // limewashed rubble on a tarred plinth under slate, two half-doors on the yard and two small lights between them, a hay hatch in the
  // west gable to the loft over the cattle; the barn, two storeys of bare rubble with dressed quoins under a steeper slate roof, a cart
  // arch and a stable door on the yard, ventilation slits in both storeys, a pitching door in the east gable under a hoist beam
  byre: (o = {}) => ({ name: 'Byre', w: 12, d: 5.4, t: PS.wall.cottage, floors: [2.6], fin: FIN.lime(), paint: o.paint || 'red', gutter: false,
    roof: { kind: 'slate', pitch: PS.pitch.slate, ov: .3, ovg: .3 }, chim: [], doorFace: 'front',
    open: { front: [{ kind: 'half', x: -3.8, y: 0, w: 1.05, h: 2.0 }, win(-1.5, 1.25, .6, .55, [2, 1], { sash: false }), { kind: 'half', x: 1.0, y: 0, w: 1.05, h: 2.0 }, win(3.5, 1.25, .6, .55, [2, 1], { sash: false })],
      back: [-3, 3].map(x => win(x, 1.45, .5, .45, [1, 1], { sash: false })), left: [{ kind: 'load', x: 0, y: 2.75, w: .8, h: .75 }] } }),
  barn: (o = {}) => ({ name: 'Barn', w: 12, d: 6.4, t: PS.wall.store, floors: [2.7, 2.4], fin: FIN.stone(), paint: 'black', gutter: false,
    roof: { kind: 'slate', pitch: PS.pitch.store, ov: .3, ovg: .3 }, chim: [], doorFace: 'front', hoist: { face: 'right', y: 4.85 },
    open: { front: [{ kind: 'cart', x: -2.4, y: 0, w: 2.8, h: 2.6, arch: true }, { kind: 'plank', x: 2.6, y: 0, w: 1.05, h: 2.1 }, ...[-4.8, .4, 4.6].map(x => win(x, 3.2, .16, .95, [1, 1], { sash: false })), win(-4.8, .9, .16, .95, [1, 1], { sash: false })],
      back: [-3.6, 0, 3.6].flatMap(x => [win(x, .9, .16, .95, [1, 1], { sash: false }), win(x, 3.2, .16, .95, [1, 1], { sash: false })]),
      right: [{ kind: 'load', x: 0, y: 2.95, w: 1.2, h: 1.4 }] } }),
  townhouse: (o = {}) => { const g = PS.storey.town; return { name: 'Townhouse', w: 6.4, d: 9, t: PS.wall.town, floors: g, fin: o.fin || FIN.render(o.color || 'ochre'), paint: o.paint || 'blue', strings: true, cornice: true,
    roof: { kind: 'slate', pitch: PS.pitch.slate, parapet: true, ov: .25 }, chim: [{ gable: -1, flues: 4 }, { gable: 1, flues: 4 }],
    open: { front: [{ kind: 'fan', x: o.doorX ?? -1.95, y: 0, w: 1.1, h: 2.75, arch: true, dress: true }, ...[0, 1.95].map(x => win((o.doorX ?? -1.95) < 0 ? x : -x, .75, .95, 1.85, [3, 2])),
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
    O.front = [{ kind: 'fan', x: dx, y: 0, w: 1.1, h: 2.75, arch: true, dress: true }, ...but(dx).map(x => win(x, .75, .95, 1.85, [3, 2])), ...xs.map(x => win(x, g[0] + .4, 1.0, 2.15, [3, 3])), ...xs.map(x => win(x, g[0] + g[1] + .35, .95, 1.4, [3, 1]))];
    // (Session 1427) the back door into the kitchen, 0.35 m in from the far bay's middle (1.6 m from the house's on three bays, as the
    // drawn plan's), and the ground window between it and the hall's partition: behind the hall they stood under the stair's half-landing (a back face's x runs mirrored)
    const sf = Math.sign(far), two = n === 2 /* two bays (seven houses in the game) keep the old back: no room to part them */; O.back = [{ kind: 'plank', x: two ? -dx : -far + sf * .35, y: 0, w: .95, h: 2.1 }, win(two ? -far : -sf * .1875, .9, .9, 1.6, [2, 2]), win(0, g[0] + .4, .9, 1.7, [2, 2]), win(0, g[0] + g[1] + .35, .9, 1.4, [2, 2])]; P.doorX = dx; }
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
// the coaching inn's front alone (Session 1351): the plan coachInn builds its inn from, so a room (rooms.js's gatelandsCoachRoom) is built
// inside the very same shell. o.kind 'three' | 'two'; -> the plan, with nb (its bays) and xs (the bays' middles)
// (Session 1396: the front door 2.8 m, its leaf 2.2 to the fanlight's spring as the townhouse's, Michael's A on #514; it was 3.0, a leaf of
// 2.4, 1.33 of a 1.8 m person, past F2a's 1.1 to 1.25)
function coachInnPlan(o = {}) {
  const kind = o.kind || 'three', r = o.r || stream('coachinn'), three = kind === 'three', nb = three ? 5 : 7, bay = 2.4, w = +(nb * bay + .6).toFixed(2), d = three ? 9 : 7.5, g = three ? [3.0, 2.9, 2.6] : [3.0, 2.9], xs = Array.from({ length: nb }, (_, k) => +((k - (nb - 1) / 2) * bay).toFixed(2));
  const P = PLANS.townhouse({ color: o.color || 'cream', paint: o.paint || 'green' }); Object.assign(P, { name: three ? 'Coaching inn' : 'Coaching inn, two storeys', w, d, floors: g, r, doorFace: 'front' });
  P.chim = [{ gable: -1, flues: 4 }, { gable: 1, flues: 4 }]; P.sign = { x: bay / 2, y: g[0] + .55 };
  P.open = { front: [{ kind: 'fan', x: 0, y: 0, w: 1.2, h: 2.8, arch: true, dress: true }, ...xs.filter(x => x).map(x => win(x, .75, 1.0, 1.85, [3, 2])), ...xs.map(x => win(x, g[0] + .4, 1.0, three ? 2.0 : 1.8, [3, 3])),
      ...(three ? xs.map(x => win(x, g[0] + g[1] + .35, .95, 1.4, [3, 1])) : [])],
    back: [{ kind: 'plank', x: -xs[1], y: 0, w: 1.0, h: 2.2 }, ...xs.filter((x, k) => k % 2 === 0).map(x => win(x, .9, .9, 1.6, [2, 2])), ...xs.filter((x, k) => k % 2 === 0).map(x => win(x, g[0] + .4, .9, 1.7, [2, 2]))],
    right: [win(-1.6, .9, .8, 1.4, [2, 2]), win(1.6, g[0] + .4, .8, 1.5, [2, 2])] };
  P.nb = nb; P.xs = xs; return P;
}
// a town's coaching inn (Session 1339, card F6; Michael's A on DECISION #411: three storeys, a gateway and a stable yard). From pieces.js's
// Session 1088, as drawn: a rendered town front of three storeys and five bays of 2.4 m, 12.6 by 9 m to a ridge of 11.9 m, the door under
// a fanlight in its middle and the harp sign beside it; beside it to the east a gateway 3.2 by 3.9 m in a rubble wall 5 m along the street,
// its leaves swung back, into a cobbled yard 14 m deep with a trough and pump, closed by a stable range of four half-doors and a coach
// house's arch under slate. The whole is 17.6 by 23 m, the inn's front on +z, centred on the inn (the gateway east of it, the yard behind).
// o.kind 'two' and 'house' (the options Michael did not take) are kept as drawn. -> a Group, its userData {name, tris, calls, size, door, parts}
function coachInn(o = {}) {
  const kind = o.kind || 'three', r = o.r || stream('coachinn'), G = new THREE.Group(), parts = [], add = (g, x, z) => { g.position.set(x, 0, z); g.updateMatrix(); G.add(g); parts.push(g); return g; };
  if (kind === 'house') { const P = bayPlan('merchant', 4, { color: o.color || 'cream', paint: o.paint || 'green', trade: o.name || 'THE HARP · ROOMS · STABLING', d: 9 }); P.r = r; P.name = 'Inn (a merchant’s house)';
    const b = add(building(P), 0, 0); G.userData = { name: 'Inn in a merchant’s house', tris: b.userData.tris, calls: b.userData.calls, size: b.userData.size, door: b.userData.door, parts: [{ name: P.name, tris: b.userData.tris, calls: b.userData.calls }] }; return G; }
  const P = coachInnPlan({ ...o, r }), three = kind === 'three', nb = P.nb, bay = 2.4, w = P.w, d = P.d, g = P.floors;
  const inn = add(building(P), 0, 0), h = g.reduce((a, b) => a + b, 0);
  // the gateway: a rubble wall 5 m along the street from the inn's east end, 4.8 m high, a round-headed arch of 3.2 by 3.9 m with its leaves swung back
  const bk = bucket(), gw = 5.0, gh = 4.8, gt = .6, yardD = 14, x1 = w / 2 + gw, zB = -d / 2 - yardD, FS = FIN.stone(), M0 = new THREE.Matrix4().makeTranslation(w / 2 + gw / 2, 0, d / 2);
  face(bk, M0, { fin: FS, paint: 'p:' + P.paint, t: gt, r, outline: [[-gw / 2, 0], [gw / 2, 0], [gw / 2, gh], [-gw / 2, gh]], open: [{ kind: 'cart', x: 0, y: 0, w: 3.2, h: 3.9, arch: true, open: true }], strings: [] });
  { const c = box(gw + .1, .16, gt + .16); c.translate(w / 2 + gw / 2, gh + .08, d / 2 - gt / 2); bk.add('dress', c); }
  for (let k = 0, y = .1; y < gh - .2; k++, y += .34) { const a = k % 2 ? .3 : .55, q = box(a, .3, gt + .06); q.translate(x1 - a / 2 + .03, y + .15, d / 2 - gt / 2 + .03); bk.add('dress', q); }
  // the yard's walls: the east one from the gateway back to the stables, the west one from the inn's back corner, 2.6 m and coped
  for (const [x, z0, z1] of [[x1 - gt / 2, d / 2 - gt, zB + 5.5], [-w / 2 + gt / 2, -d / 2, zB + 5.5]]) { const L = z0 - z1, wl = box(gt, 2.6, L, .8); wl.translate(x, 1.3, (z0 + z1) / 2); bk.add('rubble', wl);
    const c = box(gt + .14, .14, L + .1); c.translate(x, 2.67, (z0 + z1) / 2); bk.add('dress', c); }
  { const f = box(gt + .1, .8, 4); f.translate(x1 - gt / 2, -.42, d / 2 - 2); bk.add('rubble', f); }
  // a trough of dressed stone by the pump in the yard
  { const tg = box(2.2, .7, .7); tg.translate(x1 - 1.3, .35, -d / 2 - 3); bk.add('dress', tg); const pm = box(.3, 1.5, .3); pm.translate(x1 - .5, .75, -d / 2 - 3); bk.add('p:' + P.paint, pm); const sp = box(.08, .08, .4); sp.translate(x1 - .5, 1.25, -d / 2 - 3 - .3); bk.add('iron', sp); }
  const yard = finish(bk, 'Gateway and yard walls'); add(yard, 0, 0);
  // the stable range across the back of the yard: rubble under slate, one high storey and its loft, four half-doors and the coach house's arch
  const sw = +(w + gw).toFixed(2), S = { name: 'Stable range', w: sw, d: 5.5, t: .6, floors: [3.4], fin: FIN.stone(), paint: P.paint, r, roof: { kind: 'slate', pitch: PS.pitch.slate + 2, ov: .3, ovg: .25 }, chim: [], gutter: false, doorFace: 'front',
    open: { front: [...[0, 1, 2, 3].map(k => ({ kind: 'half', x: -sw / 2 + 1.4 + k * 2.3, y: 0, w: 1.1, h: 2.1 })), ...[0, 1, 2, 3].map(k => win(-sw / 2 + 1.4 + k * 2.3, 2.45, .6, .6, [1, 1], { sash: false })), { kind: 'cart', x: sw / 2 - 2.6, y: 0, w: 2.9, h: 3.0, arch: true }] } };
  const st = add(building(S), (-w / 2 + x1) / 2, zB + 2.75);
  const ud = { name: three ? 'Coaching inn, three storeys' : 'Coaching inn, two storeys', tris: 0, calls: 0, parts: parts.map(p => ({ name: p.userData.name, tris: p.userData.tris, calls: p.userData.calls })) };
  for (const p of parts) { ud.tris += p.userData.tris; ud.calls += p.userData.calls; }
  ud.size = { w: +(w + gw).toFixed(2), d: +(d + yardD).toFixed(2), eave: +h.toFixed(2), ridge: inn.userData.size.ridge, inn: inn.userData.size, stables: st.userData.size, gate: { w: 3.2, h: 3.9, x: w / 2 + gw / 2 }, yard: { x0: -w / 2 + gt, x1: x1 - gt, z0: -d / 2, z1: zB + 5.5 } };
  ud.door = inn.userData.door; G.userData = ud; return G;
}
let FARM_M = null;
// the farmstead (Session 1194, card F6, copied in Session 1455 for Michael's C on #744; OG-115's "farmstead with outbuildings", OG-114's farming and herding): the kit's farmhouse, the
// byre and the barn round a cobbled yard, three ways (o.kind, asked of Michael): the Irish country's three farmyards.
//   'yard'  (the courtyard farm): the house to the road, the byre and the barn down either side of a yard behind it, a wall across its foot;
//   'line'  (the linear farm): the byre against the house's west gable and the barn against its east, one row facing a yard before it;
//   'range' (the parallel farm): the byre and the barn end to end in one range across the yard from the house's back door.
// The way in is a pair of round limewashed piers with conical caps and an iron field gate swung back, 3.4 m between them for a cart. In
// the yard: the dunghill before the byre, the pump and its trough by the house's yard door, a cart, a rick of hay and a clamp of turf.
// The road runs along +z: the house's front stands on z 3.1 ('line': the yard's wall on the road, 9 m before it). Merged by material.
// -> a Group; userData { name, kind, tris, calls, size: {w, d, eave, ridge}, lot: {x0, x1, z0, z1}, yard: [{x0, x1, z0, z1}], gate: {x, z, w},
//    foot: [{name, x0, x1, z0, z1}] (buildings, walls, piers, props), doors: [{name, x, z, nx, nz, w, h, cart}] (the doors on the yard) }
function farmstead(o = {}) {
  const kind = o.kind || 'yard', r = o.r || stream('farmstead:' + kind), G = new THREE.Group(), bk = bucket(), foot = [], doors = [], paint = o.paint || 'red';
  bk.mats = FARM_M || (FARM_M = { cobble: mat('cobble', { ns: 1.1, color: 0xbcb2a2, rough: 1 }), dung: new THREE.MeshStandardMaterial({ color: new THREE.Color(.16, .11, .06), roughness: .95 }),
    turf: mat('stone', { ns: 1.6, color: 0x5a4030, rough: 1 }) }); /* one set for every farm (Session 1455) */
  const bx = (k, x0, x1, y0, y1, z0, z1, s = .5) => { const g = box(x1 - x0, y1 - y0, z1 - z0, s); g.translate((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2); bk.add(k, g); return g; };
  const rot = (x, z, ry) => [x * Math.cos(ry) + z * Math.sin(ry), -x * Math.sin(ry) + z * Math.cos(ry)];
  // a building at (x, z), turned by ry (a quarter turn at a time): its footprint and the doors it opens on the yard (faces named in yardFaces)
  const FACE = { front: (P, u) => [u, P.d / 2, 0, 1], back: (P, u) => [-u, -P.d / 2, 0, -1], right: (P, u) => [P.w / 2, -u, 1, 0], left: (P, u) => [-P.w / 2, u, -1, 0] };
  const place = (P, x, z, ry, yardFaces) => { const g = building(P); g.position.set(x, 0, z); g.rotation.y = ry; G.add(g);
    const q = Math.abs(Math.round(ry / (Math.PI / 2))) % 2, hw = (q ? P.d : P.w) / 2, hd = (q ? P.w : P.d) / 2; foot.push({ name: P.name, x0: x - hw, x1: x + hw, z0: z - hd, z1: z + hd });
    for (const f of yardFaces) for (const op of P.open[f] || []) if (/half|plank|cart|transom/.test(op.kind) && op.y < .3) { const [lx, lz, nx, nz] = FACE[f](P, op.x), [wx, wz] = rot(lx, lz, ry), [wnx, wnz] = rot(nx, nz, ry);
      doors.push({ name: `${P.name}, ${op.kind === 'cart' ? 'cart arch' : op.kind === 'half' ? 'half-door' : 'door'}`, x: +(x + wx).toFixed(3), z: +(z + wz).toFixed(3), nx: Math.round(wnx), nz: Math.round(wnz), w: op.w, h: op.h, cart: op.kind === 'cart' }); }
    return g; };
  const house = PLANS.farmhouse({ paint: o.housePaint || 'green' }), byre = PLANS.byre({ paint }), barn = PLANS.barn({});
  house.r = stream('farmstead:windows:' + kind); byre.r = stream('farmstead:byre:' + kind); barn.r = stream('farmstead:barn:' + kind);
  // the walls of the yard: limewashed rubble 1.4 m high, 0.5 m thick, a rounded coping; along x or along z, a footprint each
  const WT = .5, WH = 1.4, wall = (x0, z0, x1, z1) => { if (x1 - x0 < .05 && z1 - z0 < .05) return; const ax = z1 - z0 < .01, X0 = ax ? x0 : x0 - WT / 2, X1 = ax ? x1 : x0 + WT / 2, Z0 = ax ? z0 - WT / 2 : z0, Z1 = ax ? z0 + WT / 2 : z1;
    bx('w:lime', X0, X1, -.3, WH - .1, Z0, Z1, .8); const c = new THREE.CylinderGeometry(WT / 2 + .03, WT / 2 + .03, ax ? X1 - X0 : Z1 - Z0, 8, 1, false, 0, Math.PI); c.rotateZ(Math.PI / 2); if (!ax) c.rotateY(Math.PI / 2); c.translate((X0 + X1) / 2, WH - .1, (Z0 + Z1) / 2); bk.add('w:lime', c);
    foot.push({ name: 'wall', x0: X0, x1: X1, z0: Z0, z1: Z1 }); };
  // the gate in a wall along x at z gz: the wall broken from gx - gw/2 to gx + gw/2, a round pier either side, the leaf hung on the east one and swung back into the yard (-z)
  const GW = 3.4, PR = .42; let gate = null;
  const gateWall = (x0, x1, gz, gx) => { const a = gx - GW / 2 - 2 * PR, b = gx + GW / 2 + 2 * PR; wall(x0, gz, a, gz); wall(b, gz, x1, gz); gate = { x: gx, z: gz, w: GW };
    for (const s of [-1, 1]) { const px = gx + s * (GW / 2 + PR); { const g = new THREE.CylinderGeometry(PR, PR + .03, 1.9, 16); g.translate(px, .95 - .3 / 2, gz); scaleUV(g, 1); bk.add('w:lime', g); }
      { const g = new THREE.CylinderGeometry(PR + .05, PR + .05, .1, 16); g.translate(px, 1.75, gz); bk.add('w:lime', g); } { const g = new THREE.ConeGeometry(PR + .02, .62, 16); g.translate(px, 2.1, gz); bk.add('w:lime', g); }
      foot.push({ name: 'gate pier', x0: px - PR, x1: px + PR, z0: gz - PR, z1: gz + PR }); }
    // the leaf: five rails, two stiles and a brace, 1.2 m high, 3.3 long, swung through a right angle to stand along -z from its hinge
    const hx = gx + GW / 2 - .02, L = GW - .1, lb = (x0, x1, y0, y1) => bx('iron', hx - .025, hx + .025, y0, y1, gz - x1, gz - x0);
    for (let k = 0; k < 5; k++) { const y = .22 + k * .25; lb(0, L, y - .02, y + .02); } lb(0, .06, .1, 1.3); lb(L - .06, L, .1, 1.3);
    { const g = box(.04, .04, Math.hypot(L, 1.0)); g.rotateX(Math.atan2(1.0, L)); g.translate(hx, .72, gz - L / 2); bk.add('iron', g); }
    foot.push({ name: 'gate leaf', x0: hx - .05, x1: hx + .05, z0: gz - L, z1: gz }); };
  let lot, yard;
  if (kind === 'line') { // the row: byre (west), house, barn (east), their fronts on z 3.1; the yard before them to the road wall at z 12.1
    place(house, 0, 0, 0, ['front']); place(byre, -11.25, .4, 0, ['front']); place(barn, 11.25, -.1, 0, ['front']);
    lot = { x0: -17.25, x1: 17.25, z0: -3.3, z1: 12.1 }; yard = [{ x0: -17.25 + WT, x1: 17.25 - WT, z0: 3.1, z1: 12.1 - WT }];
    gateWall(-17.25, 17.25, 12.1 - WT / 2, 0); wall(-17.25 + WT / 2, 3.1, -17.25 + WT / 2, 12.1 - WT); wall(17.25 - WT / 2, 3.1, 17.25 - WT / 2, 12.1 - WT);
  } else if (kind === 'range') { // the range: byre and barn end to end, their fronts on z -13.1 facing the house's back across the yard
    place(house, 0, 0, 0, ['back']); place(byre, -6, -15.8, 0, ['front']); place(barn, 6, -16.3, 0, ['front']);
    lot = { x0: -12, x1: 12, z0: -19.5, z1: 3.1 }; yard = [{ x0: -12 + WT, x1: 12 - WT, z0: -13.1, z1: -3.1 }, { x0: -12 + WT, x1: -5.25, z0: -3.1, z1: 3.1 - WT }, { x0: 5.25, x1: 12 - WT, z0: -3.1, z1: 3.1 - WT }];
    wall(-12, 3.1 - WT / 2, -5.25, 3.1 - WT / 2); gateWall(5.25, 12, 3.1 - WT / 2, 8.6); wall(-12 + WT / 2, -13.1, -12 + WT / 2, 3.1 - WT); wall(12 - WT / 2, -13.1, 12 - WT / 2, 3.1 - WT);
  } else { // the courtyard: the byre down the west side (its doors east), the barn down the east (its doors west), a wall across the foot
    place(house, 0, 0, 0, ['back']); place(byre, -8.7, -12.7, Math.PI / 2, ['front']); place(barn, 9.2, -12.7, -Math.PI / 2, ['front']);
    lot = { x0: -11.4, x1: 12.4, z0: -18.7, z1: 3.1 }; yard = [{ x0: -6, x1: 6, z0: -18.7 + WT, z1: -3.1 }, { x0: -11.4 + WT, x1: 12.4 - WT, z0: -6.7, z1: -3.1 }, { x0: -11.4 + WT, x1: -5.25, z0: -3.1, z1: 3.1 - WT }, { x0: 5.25, x1: 12.4 - WT, z0: -3.1, z1: 3.1 - WT }];
    wall(-6, -18.7 + WT / 2, 6, -18.7 + WT / 2); wall(-11.4, 3.1 - WT / 2, -5.25, 3.1 - WT / 2); gateWall(5.25, 12.4, 3.1 - WT / 2, 8.8);
    wall(-11.4 + WT / 2, -6.7, -11.4 + WT / 2, 3.1 - WT); wall(12.4 - WT / 2, -6.7, 12.4 - WT / 2, 3.1 - WT);
  }
  // the cobbled yard, laid over the whole lot (the buildings stand on it)
  { const g = new THREE.PlaneGeometry(lot.x1 - lot.x0, lot.z1 - lot.z0); g.rotateX(-Math.PI / 2); g.translate((lot.x0 + lot.x1) / 2, .015, (lot.z0 + lot.z1) / 2); worldUV(g, .8); bk.add('cobble', g); }
  // the props, each where its layout puts it: [x, z] of the dunghill, the pump (its trough to the west, or along -z when turned), the cart (ry), the rick, the turf clamp (along x or z)
  const S = { yard: { dung: [-3.5, -11.3, 1], pump: [-3.3, -3.45, 0], cart: [1.4, -17.0, 0], rick: [-3.9, -16.3], turf: [-8.6, -.8, 0] },
    line: { dung: [-12.7, 5.6, 0], pump: [2.6, 3.42, 0], cart: [12.6, 7.2, 0], rick: [-15.0, 9.8], turf: [13.6, 10.3, 0] },
    range: { dung: [-7.4, -10.6, 0], pump: [-3.3, -3.45, 0], cart: [-2.4, -9.2, .5], rick: [-9.4, -5.6], turf: [-8.6, -.6, 0] } }[kind];
  const prop = (name, x, z, hx, hz) => foot.push({ name, x0: +(x - hx).toFixed(3), x1: +(x + hx).toFixed(3), z0: +(z - hz).toFixed(3), z1: +(z + hz).toFixed(3) });
  { const [x, z, q] = S.dung, a = q ? .95 : 1.3, c = q ? 1.3 : .95, g = new THREE.SphereGeometry(1, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2); g.scale(a, .62, c); g.translate(x, 0, z); bk.add('dung', g);
    for (let k = 0; k < 14; k++) { const t = r() * Math.PI * 2, d = .2 + r() * .6, s = box(.5, .02, .03); s.rotateY(r() * Math.PI); s.translate(x + Math.cos(t) * a * d, .62 * Math.sqrt(Math.max(0, 1 - d * d)) + .005, z + Math.sin(t) * c * d); bk.add('thatch', s); }
    prop('dunghill', x, z, a, c); }
  { const [x, z] = S.pump; bx('dress', x - .35, x + .35, 0, .1, z - .3, z + .3); { const g = new THREE.CylinderGeometry(.12, .15, 1.3, 12); g.translate(x, .75, z); bk.add('iron', g); }
    { const g = new THREE.SphereGeometry(.15, 12, 6, 0, Math.PI * 2, 0, Math.PI / 2); g.translate(x, 1.4, z); bk.add('iron', g); } bx('iron', x - .04, x + .04, .86, .94, z - .1, z - .4 + .05);
    { const g = box(.05, .05, .8); g.rotateX(-.45); g.translate(x, 1.42, z + .3); bk.add('iron', g); }
    bx('dress', x - 1.75, x - .45, 0, .5, z - .23, z + .23); bx('dress', x - 1.65, x - .55, .5, .52, z - .13, z + .13); prop('pump', x, z, .35, .3); prop('trough', x - 1.1, z, .65, .23);
    const wg = new THREE.PlaneGeometry(1.1, .26); wg.rotateX(-Math.PI / 2); wg.translate(x - 1.1, .44, z); bk.add('glass', wg); }
  { const [x, z, ry] = S.cart, part = (k, g) => { g.rotateY(ry); g.translate(x, 0, z); bk.add(k, g); }, c = Math.cos(ry), s = Math.sin(ry);
    { const g = box(2.0, .1, 1.3, .9); g.translate(0, .82, 0); part('board', g); } for (const sz of [-1, 1]) { const g = box(2.0, .32, .05, .9); g.translate(0, 1.03, sz * .63); part('board', g); }
    for (const sx of [-1, 1]) { const g = box(.05, .32, 1.3, .9); g.translate(sx * .98, 1.03, 0); part('board', g); }
    for (const sz of [-1, 1]) { const w = new THREE.TorusGeometry(.6, .05, 6, 20); w.translate(-.1, .65, sz * .78); part('iron', w); const h = new THREE.CylinderGeometry(.09, .09, .14, 8); h.rotateX(Math.PI / 2); h.translate(-.1, .65, sz * .78); part('board', h);
      for (let k = 0; k < 6; k++) { const sp = box(.04, 1.12, .04); sp.rotateZ(k * Math.PI / 6); sp.translate(-.1, .65, sz * .78); part('board', sp); }
      const sh = box(2.1, .08, .08, .9); sh.rotateZ(Math.atan2(.7, 2.0)); sh.translate(1.85, .45, sz * .45); part('board', sh); }
    { const g = box(.12, .7, .12); g.translate(-.9, .4, 0); part('board', g); }
    const hx = Math.abs(c) * 1.95 + Math.abs(s) * .85, hz = Math.abs(s) * 1.95 + Math.abs(c) * .85, cx = x + c * .9, cz = z - s * .9; prop('cart', cx, cz, hx, hz); }
  { const [x, z] = S.rick; { const g = new THREE.CylinderGeometry(1.45, 1.3, 1.9, 18); g.translate(x, .95, z); scaleUV(g, 2); bk.add('thatch', g); } { const g = new THREE.ConeGeometry(1.6, 1.7, 18); g.translate(x, 2.75, z); scaleUV(g, 2); bk.add('thatch', g); }
    for (const y of [1.6, 2.2, 2.75]) { const t = new THREE.TorusGeometry(1.48 - (y - 1.6) * .8, .025, 4, 24); t.rotateX(Math.PI / 2); t.translate(x, y + .3, z); bk.add('board', t); }
    prop('rick', x, z, 1.6, 1.6); }
  { const [x, z, q] = S.turf, L = 3.2, W = 1.3, y0 = .8, y1 = 1.45, body = box(L, y0, W, .7), top = new THREE.BufferGeometry(); body.translate(0, y0 / 2, 0); /* the clamp: sods stacked square, a ridged top */
    { const v = [[-L / 2, y0, -W / 2], [L / 2, y0, -W / 2], [L / 2, y1, 0], [-L / 2, y1, 0], [-L / 2, y0, W / 2], [L / 2, y0, W / 2]], tri = [[0, 3, 2], [0, 2, 1], [4, 5, 2], [4, 2, 3], [0, 4, 3], [1, 2, 5]], pos = [];
      for (const t of tri) for (const i of t) pos.push(...v[i]); top.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); top.computeVertexNormals(); worldUV(top, .7); }
    for (const g of [body, top]) { if (q) g.rotateY(Math.PI / 2); g.translate(x, 0, z); bk.add('turf', g); }
    prop('turf clamp', x, z, q ? W / 2 : L / 2, q ? L / 2 : W / 2); }
  G.add(finish(bk, 'Farmyard: walls, gate, cobbles, pump, cart, rick, turf'));
  // the lot is everything on it: the gate's piers stand 0.17 m proud of the wall on the road
  for (const p of foot) { lot.x0 = Math.min(lot.x0, p.x0); lot.x1 = Math.max(lot.x1, p.x1); lot.z0 = Math.min(lot.z0, p.z0); lot.z1 = Math.max(lot.z1, p.z1); }
  // the house's, the byre's and the barn's sizes, before the merge
  const hs = G.children[0].userData.size, ys = G.children[1].userData.size, ns = G.children[2].userData.size;
  const tris = mergeByMaterial(G);
  G.userData = { name: { yard: 'Farmstead round a yard', line: 'Farmstead in a line', range: 'Farmstead, house and range' }[kind], kind, tris, calls: G.children.length,
    size: { w: +(lot.x1 - lot.x0).toFixed(2), d: +(lot.z1 - lot.z0).toFixed(2), eave: hs.eave, ridge: hs.ridge }, parts: { house: hs, byre: ys, barn: ns }, lot, yard, gate, foot, doors,
    door: new THREE.Vector3(gate.x - .6, 0, gate.z + 1.2) };
  return G;
}
// ── the rooms, copied from docs/prototypes/levelup/rooms.js (card F9; Session 1157 copies the Gatelander inn of Session 893, Michael's
// 2 A on #320). A room is built inside the very shell the street builds (building(plan) with plan.interior), in metres, the shell's
// centre on the ground and its front +z. Copy it again from there when the prototype changes; only the names below differ:
// mats() → roomMats(), GL_PLANS → PLANS, gatelandsBuilding → building (and glBayPlan → bayPlan: the inn on two bays, Session 1276). ──
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
  const two = o.bays === 2, plan = two ? bayPlan('farmhouse', 2, { paint: o.paint || 'green' }) : PLANS.farmhouse({ paint: o.paint || 'green' }); plan.interior = true; plan.r = stream('inn-shell'); plan.open.front[0].ajar = true;
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
  const settle = { x0: hx + BD + 1.6, x1: hx + BD + 2.1, z0: two ? -.3 : -1.0, z1: two ? 1.1 : .9, y: F0 + .44 }; bx('oak', settle.x0, settle.x1, F0, settle.y, settle.z0, settle.z1, 'settle', 0); bx('oak', settle.x1 - .08, settle.x1, settle.y, F0 + 1.35, settle.z0, settle.z1); for (const z of [settle.z0, settle.z1 - .06]) bx('oak', settle.x0, settle.x1, settle.y, F0 + .75, z, z + .06);
  bx('wool', settle.x0 + .02, settle.x1 - .1, settle.y, settle.y + .04, settle.z0 + .1, settle.z1 - .1);
  const seats = [settle.y - F0]; for (const [x, z] of two ? [] : [[hx + BD + 1.0, 1.35], [hx + BD + 1.0, -1.45]]) { bx('deal', x - .17, x + .17, F0 + .41, F0 + .45, z - .17, z + .17, 'stool', 0); for (const a of [0, 2.1, 4.2]) put(new THREE.CylinderGeometry(.018, .022, .41, 6), 'deal', x + Math.cos(a) * .11, F0 + .205, z + Math.sin(a) * .11); seats.push(.45 - .05 + .05); }
  // the bar across the back wall, between the back window (x = -2) and the back door (x = 1.5) (on two bays, from the hearth's corner to the
  // back door at x = 0.78, the back window over its kegs and its shelf in two): a counter of oak boards, a rack of kegs
  // behind it against the wall, jugs and tankards on the counter, a lantern from the beam over it
  const bar = { x0: two ? -2.1 : -1.35, x1: two ? 0 : .75, z0: -Z + .95, z1: -Z + 1.5, y: F0 + 1.05 }; bx('oak', bar.x0, bar.x1, F0, bar.y - .05, bar.z0, bar.z1, 'bar', 0); bx('deal', bar.x0 - .04, bar.x1 + .04, bar.y - .05, bar.y, bar.z0 - .04, bar.z1 + .04);
  const shelves = plan.open.back.filter(q => q.kind === 'win' && q.y < F1).map(q => [-q.x - q.w / 2 - .05, -q.x + q.w / 2 + .05]).sort((p, q) => p[0] - q[0]).reduce((S, [w0, w1]) => S.flatMap(([s0, s1]) => w1 <= s0 || w0 >= s1 ? [[s0, s1]] : [[s0, w0], [w1, s1]].filter(([u, v]) => v - u > .4)), [[bar.x0, bar.x1]]);
  bx('oak', bar.x0 + .1, bar.x1 - .1, F0, F0 + .45, -Z, -Z + .55, 'rack', 0); for (let x = bar.x0 + .4, k = 0; x < bar.x1 - .25; x += .62, k++) { const g = new THREE.CylinderGeometry(.24, .24, .5, 14); g.rotateX(Math.PI / 2); put(g, 'oak', x, F0 + .45 + .24, -Z + .27); put(new THREE.CylinderGeometry(.03, .03, .08, 6).rotateX(Math.PI / 2), 'iron', x, F0 + .5, -Z + .55); }
  for (const [s0, s1] of shelves) { bx('deal', s0, s1, F0 + 1.7, F0 + 1.73, -Z, -Z + .28); for (let x = s0 + .15; x < s1 - .1; x += .22) put(new THREE.CylinderGeometry(.05, .06, .18, 10), x % .44 < .22 ? 'crock' : 'delft', x, F0 + 1.82, -Z + .14); }
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
  const tables = [], benches = []; for (const [tx, tz] of two ? [[.85, .45]] : [[2.1, .45], [-1.2, 1.4]]) { const T = { x0: tx - .8, x1: tx + .8, z0: tz - .38, z1: tz + .38, y: F0 + .76 }; bx('deal', T.x0, T.x1, T.y - .05, T.y, T.z0, T.z1, 'table', 0);
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) bx('oak', tx + sx * .7 - .04, tx + sx * .7 + .04, F0, T.y - .05, tz + sz * .28 - .04, tz + sz * .28 + .04); tables.push(T);
    for (const sz of tx > 0 ? [-1, 1] : [-1]) { const bz = tz + sz * .62; bx('oak', tx - .75, tx + .75, F0 + .41, F0 + .45, bz - .15, bz + .15, 'bench', 0); for (const sx of [-1, 1]) bx('oak', tx + sx * .65 - .03, tx + sx * .65 + .03, F0, F0 + .41, bz - .12, bz + .12); benches.push(.45); }
    put(new THREE.CylinderGeometry(.012, .014, .14, 8), 'linen', tx + .2, T.y + .07, tz); put(new THREE.SphereGeometry(.012, 6, 5).scale(1, 2, 1), 'flame', tx + .2, T.y + .155, tz); }
  const lamp = [(bar.x0 + bar.x1) / 2, F1 - .95, bar.z1 + .3]; bx('iron', lamp[0] - .005, lamp[0] + .005, lamp[1] + .1, F1 - .42, lamp[2] - .005, lamp[2] + .005); put(new THREE.CylinderGeometry(.08, .09, .22, 6), 'glow', ...lamp); put(new THREE.ConeGeometry(.1, .1, 6), 'iron', lamp[0], lamp[1] + .16, lamp[2]);
  // upstairs: the rail round the well, a passage along the back wall, three rooms off it behind deal partitions with doors
  const PZ = -Z + 1.2, top = F1 + .95; { for (const [x0, z0, x1, z1] of [[well.x0, well.z0 + .1, well.x0, well.z1], [well.x0, well.z1, X, well.z1]]) { bx('oak', Math.min(x0, x1) - .04, Math.min(X, Math.max(x0, x1) + .04), top, top + .06, Math.min(z0, z1) - .04, Math.max(z0, z1) + .04, 'wellrail', 1);
      const n = Math.max(1, Math.round(Math.hypot(x1 - x0, z1 - z0) / .9)); for (let k = 0; k <= n; k++) { const x = x0 + (x1 - x0) * k / n, z = z0 + (z1 - z0) * k / n; bx('oak', x - .04, x + .04, F1, top, z - .04, z + .04); } } }
  const RX = two ? [-X, 0, SX0 - .1] : [-X, -1.45, 1.65, SX0 - .1], NR = RX.length - 1, rooms = [], wallK = 'deal';
  { const doorAt = i => (RX[i] + RX[i + 1]) / 2 + (i === 2 ? -.4 : 0), dw = .8, dh = 1.95;
    /* the passage's wall, along z = PZ from the west gable to the well, a door into each room */ for (let i = 0; i < NR; i++) { const dx = doorAt(i), a = RX[i] + (i ? .04 : 0), b = RX[i + 1] - .04; bx(wallK, a, dx - dw / 2, F1, CEIL, PZ - .04, PZ + .04, 'partition', 1); bx(wallK, dx + dw / 2, b, F1, CEIL, PZ - .04, PZ + .04, 'partition', 1); bx(wallK, dx - dw / 2, dx + dw / 2, F1 + dh, CEIL, PZ - .04, PZ + .04);
      rooms.push({ x0: RX[i], x1: RX[i + 1], door: { x: dx, z: PZ, w: dw, h: dh } }); }
    for (const x of RX.slice(1, -1)) bx(wallK, x - .04, x + .04, F1, CEIL, PZ + .04, Z, 'partition', 1);
    /* the last room's east side: a partition along the well's west edge from the passage to the well's end */ bx(wallK, RX[NR] - .04, RX[NR] + .04, F1, CEIL, PZ + .04, well.z1, 'partition', 1); }
  // each room: a bed against its partition, a chest at its foot, a washstand with a jug and basin under the front window
  const beds = []; rooms.forEach((R, i) => { const e = i === 1 && !two ? -1 : 1, bx0 = e > 0 ? R.x0 + .05 : R.x1 - .05 - 1.0, b = { x0: bx0, x1: bx0 + 1.0, z0: Z - 2.05, z1: Z - .05 };
    bx('oak', b.x0, b.x1, F1, F1 + .45, b.z0, b.z1, 'bed', 1); bx('straw', b.x0 + .04, b.x1 - .04, F1 + .45, F1 + .55, b.z0 + .04, b.z1 - .04); bx('wool', b.x0 + .03, b.x1 - .03, F1 + .55, F1 + .6, b.z0 + .04, b.z1 - .5); bx('linen', b.x0 + .1, b.x1 - .1, F1 + .55, F1 + .66, b.z1 - .45, b.z1 - .08);
    bx('oak', b.x0 + .05, b.x0 + .95, F1, F1 + .5, b.z0 - .55, b.z0 - .05, 'chest', 1); beds.push(b);
    const wx = (two ? [-1.55, 1.55] : [-3.1, 0, 3.1])[i] /* under the room's front window */, wz = Z - .3; bx('deal', wx - .25, wx + .25, F1, F1 + .78, wz - .2, wz + .2, 'washstand', 1); put(new THREE.CylinderGeometry(.16, .1, .08, 14), 'delft', wx, F1 + .82, wz); put(new THREE.CylinderGeometry(.06, .07, .22, 12), 'delft', wx + .12, F1 + .93, wz - .05); });
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
// ── the Gatelands cottage as a room, copied from docs/prototypes/levelup/rooms.js (Session 1392, card F9; Michael's A on #303, by bays
// since Session 1380): the hearth-lobby house inside the kit's cottage on 2, 3 or 4 bays (one room with the hearth in the east gable on
// two). roomKit, cottageWall and frustum are rooms.js's kit, crossWall and frustum; the same renames as the inn's above. ──
function roomKit() { const M = roomMats(), B = new Map(), boxes = [];
  const put = (geo, key, x = 0, y = 0, z = 0, ry = 0, uv = .6) => { const g = geo.index ? geo.toNonIndexed() : geo; for (const k of Object.keys(g.attributes)) if (!['position', 'normal'].includes(k)) g.deleteAttribute(k);
    g.applyMatrix4(new THREE.Matrix4().compose(new THREE.Vector3(x, y, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(0, ry, 0)), new THREE.Vector3(1, 1, 1))); worldUV(g, uv);
    if (!B.has(key)) B.set(key, []); B.get(key).push(g); return g; };
  // a box by its floor footprint: x0..x1, z0..z1, y0..y1 (most furniture is boxes; tag it to have its footprint kept for the checks)
  const bx = (key, x0, x1, y0, y1, z0, z1, tag) => { put(new THREE.BoxGeometry(x1 - x0, y1 - y0, z1 - z0), key, (x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2); if (tag) boxes.push({ tag, x0, x1, y0, y1, z0, z1 }); };
  const finish = () => { const group = new THREE.Group(); let tris = 0; for (const [k, gs] of B) { const g = mergeGeometries(gs, false); gs.forEach(x => x.dispose()); const m = new THREE.Mesh(g, M[k]); m.name = k;
    m.castShadow = !['flame', 'ember', 'glow'].includes(k); m.receiveShadow = true; group.add(m); tris += g.attributes.position.count / 3; } return { group, tris: Math.round(tris), draws: group.children.length }; };
  return { put, bx, finish, boxes }; }
// a wall in the z-y plane at x (thickness t along x), its top following the roof (yTop(z)), with openings [{z, w, y, h}] cut through
function cottageWall(put, key, x, t, z0, z1, yTop, holes) { const s = new THREE.Shape(); s.moveTo(z0, 0); s.lineTo(z1, 0); for (let k = 0; k <= 8; k++) { const z = z1 + (z0 - z1) * k / 8; s.lineTo(z, yTop(z)); } s.lineTo(z0, 0);
  for (const h of holes) { const p = new THREE.Path(); p.moveTo(h.z - h.w / 2, h.y); p.lineTo(h.z + h.w / 2, h.y); p.lineTo(h.z + h.w / 2, h.y + h.h); p.lineTo(h.z - h.w / 2, h.y + h.h); p.lineTo(h.z - h.w / 2, h.y); s.holes.push(p); }
  const g = new THREE.ExtrudeGeometry(s, { depth: t, bevelEnabled: false }); g.rotateY(-Math.PI / 2); put(g, key, x + t / 2, 0, 0, 0, .42); }
function frustum(b, y0, t, y1) { const g = new THREE.BoxGeometry(1, 1, 1).toNonIndexed(), P = g.attributes.position;
  for (let i = 0; i < P.count; i++) { const top = P.getY(i) > 0, R = top ? t : b, u = P.getX(i) + .5, w = P.getZ(i) + .5; P.setXYZ(i, R[0] + (R[1] - R[0]) * u, top ? y1 : y0, R[2] + (R[3] - R[2]) * w); }
  g.computeVertexNormals(); return g; }
function gatelandsCottage(o = {}, r = stream('cottage')) {
  // o.bays (Session 1380): the cottage on 2, 3 or 4 bays of 2.4 m, as the game's villages build it (bayPlan: the door in the middle
  // bay, the hearth wall 1.1 m west of it). Four bays are the drawn plan with the room below narrowed to 1.6 m (its bed under the front
  // window, the chest in the gable's back corner); three have no room above (the box bed against the east gable, the dresser east of
  // the back door); two are one room, the hearth in the east gable (its stack) facing west, the box bed against the back wall by
  // the back door, the dresser on the front wall, no jamb wall. With no bays it is the cottage as drawn. Always the gabled cottage: a hipped one's room is this one.
  const n = o.bays, plan = n ? bayPlan('cottage', n, { hip: false, paint: o.paint || 'red' }) : PLANS.cottage({ hip: false, paint: o.paint || 'red' }); plan.interior = true; plan.r = stream('cottage-shell');
  const shell = building(plan), { put, bx, finish, boxes } = roomKit(), t = plan.t, h = plan.floors[0], X = plan.w / 2 - t, Z = plan.d / 2 - t, tp = Math.tan(PS.pitch.thatch * Math.PI / 180);
  const under = z => h - .12 + (Z - Math.abs(z)) * tp - .1;
  const door = plan.open.front[0], back = plan.open.back.find(q => q.kind === 'plank'), mid = plan.chim.find(c => c.x != null), one = !mid;
  // the hearth wall at the plan's stack (x = -1.7 as drawn): the open hearth faces the kitchen (+x); in a cottage of one room the east
  // gable is the hearth wall and the hearth faces west (s = -1). xs(a, b): a span a..b out from the wall's face, into the room
  const HX = one ? X + .3 : mid.x, HT = .6, s = one ? -1 : 1, face = one ? X : HX + HT / 2, xs = (a, b) => s > 0 ? [face + a, face + b] : [face - b, face - a];
  const east = !one && X - (face + .55) > 4.2, PX = east ? X - 1.6 : X, KX0 = one ? -X : face, KX1 = one ? face : PX, west = one ? 0 : HX - HT / 2 + X;
  // the floor: flags in the kitchen, laid in courses of 0.55 to 0.9 m; beaten earth in the two rooms
  for (let z = -Z, row = 0; z < Z - .05; row++) { const d = Math.min(Z - z, .55 + r() * .35); for (let x = KX0; x < KX1 - .05;) { const w = Math.min(KX1 - x, .6 + r() * .4);
    put(new THREE.BoxGeometry(w - .02, .06, d - .02), 'flag', x + w / 2, .03 + (r() - .5) * .006, z + d / 2, (r() - .5) * .01, .7); x += w; } z += d; }
  if (!one) bx('earth', -X, HX - HT / 2, 0, .04, -Z, Z); if (east) bx('earth', PX, X, 0, .04, -Z, Z);
  const hw = 1.6, hh = 1.25, hd = .5, hz = .25, dB = { z: -1.45, w: .8, h: 1.95 };
  if (!one) cottageWall(put, 'lime', HX, HT, -Z, Z, under, [{ z: dB.z, w: dB.w, y: 0, h: dB.h }]);
  // the breast proud of it by 0.55 m, the hearth a recess in it, sooted at the back, an oak lintel over, a hearthstone before it
  const BD = .55, bxx = face, front = face + s * BD; { const bz0 = hz - hw / 2 - .35, bz1 = hz + hw / 2 + .35, [b0, b1] = xs(0, BD); /* the breast narrows up into the stack, so it stays under the thatch's slopes */ put(frustum([b0, b1, bz0, bz1], hh, [b0, b1, -.35, .35], under(0) - .4), 'lime', 0, 0, 0, 0, .42); bx('lime', b0, b1, 0, hh, bz0, hz - hw / 2, 'breast'); bx('lime', b0, b1, 0, hh, hz + hw / 2, bz1, 'breast');
    bx('soot', ...xs(0, .02), 0, hh, hz - hw / 2, hz + hw / 2); bx('soot', b0, b1, hh - .02, hh, hz - hw / 2, hz + hw / 2); bx('oak', ...xs(BD - .3, BD + .08), hh, hh + .24, hz - hw / 2 - .25, hz + hw / 2 + .25); bx('flag', ...xs(BD, BD + .8), 0, .07, hz - hw / 2, hz + hw / 2, 'hearthstone'); }
  // the fire: sods of turf on the hearth floor, embers between them; the crane from the cheek, a pot on its hook
  const fx = face + s * .25, fire = [fx + s * .05, .32, hz]; for (let i = 0; i < 7; i++) { const a = i / 7 * Math.PI * 2, g = new THREE.BoxGeometry(.24, .1, .12); put(g, 'turf', fx + Math.cos(a) * .15, .06 + (i % 2) * .08, hz + Math.sin(a) * .22, a + 1.3); }
  put(new THREE.SphereGeometry(.16, 10, 6).scale(1.2, .4, 1.4), 'ember', fx, .08, hz); for (let i = 0; i < 3; i++) put(new THREE.ConeGeometry(.07, .28 + i * .06, 7), 'flame', fx + s * (i - 1) * .04, .26, hz + (i - 1) * .09);
  { const cx = face + s * .06, cz = hz - hw / 2 + .08; bx('iron', cx - .02, cx + .02, .2, 1.15, cz - .02, cz + .02); put(new THREE.BoxGeometry(.03, .03, .75), 'iron', cx + s * .02, 1.05, cz + .37, 0); put(new THREE.CylinderGeometry(.008, .008, .4, 4), 'iron', cx + s * .02, .85, cz + .62);
    const pot = new THREE.SphereGeometry(.17, 14, 10, 0, Math.PI * 2, .35, Math.PI - .35); put(pot, 'iron', cx + s * .2, .55, cz + .62); put(new THREE.TorusGeometry(.13, .008, 4, 14, Math.PI).rotateY(Math.PI / 2), 'iron', cx + s * .2, .7, cz + .62); }
  // the jamb wall: from the breast to beside the door, a lobby between it and the front wall, a spy window toward the fire
  const JZ = Z - 1.0, jx1 = door.x + door.w / 2 + .05; if (!one) { const g = new THREE.BoxGeometry(1, 1, 1); const sw = .22, sx = bxx + BD + .3;
    bx('lime', bxx + BD, sx - sw / 2, 0, 2.05, JZ - .11, JZ + .11, 'jamb'); bx('lime', sx + sw / 2, jx1, 0, 2.05, JZ - .11, JZ + .11, 'jamb'); bx('lime', sx - sw / 2, sx + sw / 2, 0, 1.3, JZ - .11, JZ + .11, 'jamb'); bx('lime', sx - sw / 2, sx + sw / 2, 1.5, 2.05, JZ - .11, JZ + .11, 'jamb'); g.dispose(); }
  // the east partition: deal boards on a frame, a door at the front to the room above
  const dE = { z: .9, w: .8, h: 1.95 }; if (east) { cottageWall(put, 'deal', PX, .08, -Z, Z, z => Math.min(h + .3, under(z)), [{ z: dE.z, w: dE.w, y: 0, h: dE.h }]); bx('oak', PX - .06, PX + .06, h + .25, h + .4, -Z, Z); }
  // the dresser on the back wall, east of the back door (the back door stands opposite the front one, so in the drawn cottage the
  // dresser stood 0.2 m across it; Session 1380 moves it clear), short of the back window; in one room on the front wall, east of the
  // door and short of the window: a cupboard base, a rack of three shelves, plates leaning on them, jugs
  { const BX = -back.x, wins = (one ? plan.open.front.map(q => q.kind === 'win' ? q.x : null) : plan.open.back.map(q => q.kind === 'win' ? -q.x : null)).filter(x => x != null), DX = one ? door.x : BX, DW = one ? door.w : back.w,
      x0 = Math.max(one ? -X : bxx + .45, DX + DW / 2 + .1), bwin = wins.find(x => x > x0), x1 = Math.min(x0 + 1.45, bwin != null ? bwin - .45 : 9), nk = Math.floor((x1 - x0 - .27) / .235) + 1;
    const zz = (a, b) => one ? [Z - b, Z - a] : [-Z + a, -Z + b], z0 = one ? Z : -Z, f = one ? -1 : 1;
    bx('paint', x0, x1, 0, .85, ...zz(0, .48), 'dresser'); bx('deal', x0 - .02, x1 + .02, .85, .89, ...zz(0, .51)); bx('paint', x0, x1, .89, 2.05, ...zz(0, .05));
    for (const e of [x0, x1 - .05]) bx('paint', e, e + .05, .89, 2.05, ...zz(0, .3)); bx('paint', x0 - .04, x1 + .04, 2.05, 2.16, ...zz(0, .34));
    for (let s = 0; s < 3; s++) { const y = 1.2 + s * .3; bx('paint', x0, x1, y - .02, y, ...zz(0, .26)); for (let k = 0; k < nk; k++) { const px = x0 + .14 + k * .235, rp = .095 - (s === 0 ? 0 : .015);
      const p = new THREE.CylinderGeometry(rp, rp, .012, 18).rotateX(Math.PI / 2 - .2); if (one) p.rotateY(Math.PI); put(p, k % 3 === 1 ? 'blue' : 'delft', px, y + rp + .005, z0 + f * .08); } }
    for (let k = 0; k < 3; k++) put(new THREE.CylinderGeometry(.06, .07, .2, 12), 'crock', x0 + .3 + k * .45, .99, z0 + f * .3); }
  // the box bed against the east partition (in three bays the east gable's middle, clear of the back window; in one room against the
  // back wall beside the back door, its head to the wall as every home's bed): a cupboard of deal 0.9 by 2.0 m, its front half closed by
  // a curtain, a straw tick and a blanket
  const bed = one ? { x0: -back.x + back.w / 2 + .2, x1: -back.x + back.w / 2 + 1.12, z0: -Z + .05, z1: -Z + 2.08 } : east ? { x0: PX - .92, x1: PX - .04, z0: -Z + .05, z1: -Z + 2.08 } : { x0: X - .92, x1: X - .04, z0: -1.0, z1: 1.03 };
  { const { x0, x1, z0, z1 } = bed; bx('deal', x0, x1, 0, .32, z0, z1, 'bed'); bx('deal', x0, x0 + .04, .32, 1.95, z0, z0 + .05); bx('deal', x0, x0 + .04, .32, 1.95, z1 - .05, z1);
    bx('deal', x0, x1, 1.95, 2.0, z0, z1); bx('deal', x1 - .04, x1, .32, 1.95, z0, z1); bx('deal', x0 + .02, x1, .32, 1.95, z0 - .02, z0 + .02); bx('deal', x0 + .02, x1, .32, 1.95, z1 - .02, z1 + .02);
    bx('straw', x0 + .05, x1 - .05, .32, .5, z0 + .06, z1 - .06); bx('wool', x0 + .05, x1 - .05, .5, .55, z0 + .5, z1 - .06); bx('linen', x0 + .1, x1 - .1, .5, .62, z0 + .08, z0 + .45);
    const c = new THREE.PlaneGeometry(1.0, 1.45, 10, 1), P = c.attributes.position; for (let i = 0; i < P.count; i++) P.setZ(i, .04 * Math.sin(P.getX(i) * 18)); c.rotateY(-Math.PI / 2); c.computeVertexNormals(); put(c, 'wool', x0 - .01, .32 + .74, (z0 + z1) / 2 + .45); }
  // the table under the front window (the plan's at x = 1.5), two stools; a súgán chair at the hearth. In one room the table stands
  // east of the door under the window by the hearth, short of the breast
  const win = plan.open.front.find(p => p.kind === 'win' && p.x > KX0 && p.x < KX1), tw = one ? .45 : .62, tx = one ? bed.x0 + .5 : Math.min(win.x + .1, KX1 - .7), tz = one ? Z - 1.02 : Z - .5, table = { y: .76 };
  { bx('deal', tx - tw, tx + tw, .72, .76, tz - .36, tz + .36, 'table'); for (const sx of [-1, 1]) for (const sz of [-1, 1]) bx('deal', tx + sx * (tw - .07) - .03, tx + sx * (tw - .07) + .03, 0, .72, tz + sz * .29 - .03, tz + sz * .29 + .03);
    bx('deal', tx - tw + .07, tx + tw - .07, .14, .17, tz - .015, tz + .015); }
  const seats = []; for (const [x, z] of one ? [[tx - .68, tz]] : [[tx - .85, tz - .05], [tx + (east ? .3 : -.5), tz - .62]]) { /* one at the west end, one on the room side; the east end is the box bed's (in one room one, at the west end) */ bx('deal', x - .17, x + .17, .41, .45, z - .17, z + .17, 'stool'); for (const a of [0, 2.1, 4.2]) put(new THREE.CylinderGeometry(.018, .022, .41, 6), 'deal', x + Math.cos(a) * .11, .205, z + Math.sin(a) * .11); seats.push(.45); }
  { const x = one ? front - .55 : bxx + BD + 1.0, z = one ? -1.0 : hz - .75; bx('oak', x - .22, x + .22, .4, .44, z - .21, z + .21, 'chair'); bx('straw', x - .2, x + .2, .44, .46, z - .19, z + .19); for (const sx of [-1, 1]) for (const sz of [-1, 1]) bx('oak', x + sx * .19 - .02, x + sx * .19 + .02, 0, sz < 0 ? 1.0 : .4, z + sz * .18 - .02, z + sz * .18 + .02);
    bx('oak', x - .21, x + .21, .92, .97, z - .2, z - .16); seats.push(.46); }
  // the room below (west): a plain bed and a chest (in a room under 2 m wide the bed under the front window, the chest in the gable's
  // back corner, clear of the door in the hearth wall); the room above (east): a bed, a chest, a small grate in the gable
  if (!one && west >= 2) { bx('oak', -X + .05, -X + 1.0, 0, .45, -Z + .1, -Z + 2.1, 'bed2'); bx('wool', -X + .1, -X + .95, .45, .55, -Z + .15, -Z + 2.05); bx('oak', HX - HT / 2 - 1.0, HX - HT / 2 - .1, 0, .55, -Z + .05, -Z + .55, 'chest'); }
  else if (!one) { bx('oak', -X + .05, -X + 1.0, 0, .45, Z - 2.1, Z - .1, 'bed2'); bx('wool', -X + .1, -X + .95, .45, .55, Z - 2.05, Z - .15); bx('oak', -X + .05, -X + .55, 0, .55, -Z + .1, -Z + 1.0, 'chest'); }
  if (east) { bx('oak', X - 1.0, X - .05, 0, .45, -Z + .1, -Z + 2.1, 'bed3'); bx('linen', X - .95, X - .1, .45, .55, -Z + .15, -Z + 2.05); bx('oak', X - .95, X - .1, 0, .5, -Z + 2.2, -Z + 2.7, 'chest2');
    bx('soot', X - .25, X, 0, .7, -.35, .35); bx('lime', X - .45, X, .7, .82, -.5, .5); }
  // the roof's couples: pairs of oak blades up the slopes, a collar across, purlins along; the lantern hangs from the kitchen's collar
  const p = PS.pitch.thatch * Math.PI / 180, L2 = Z / Math.cos(p), kc = n ? +(((one ? KX0 : front) + KX1) / 2).toFixed(2) : .4;
  const couples = !n ? [-3.0, .4, 3.6] : [...(one ? [] : [+((-X + HX - HT / 2) / 2).toFixed(2)]), kc, ...(east ? [+((PX + X) / 2).toFixed(2)] : [])];
  for (const x of couples) { for (const s of [-1, 1]) { const g = new THREE.BoxGeometry(.14, .2, L2 - .2); g.rotateX(s * p); /* its foot stops on the wall's inner face */ /* the +z end down on the front slope, up on the back */ put(g, 'oak', x, under(s * Z / 2) - .16, s * Z / 2, 0); }
    /* the collar ends where its top meets the slopes' underside */ bx('oak', x - .07, x + .07, h + 1.35, h + 1.5, -Z + 1.74 / tp, Z - 1.74 / tp); }
  for (const f of [.35, .7]) for (const sz of [-1, 1]) { const zz = sz * Z * (1 - f), y = under(zz) - .2; put(new THREE.BoxGeometry(plan.w - 2 * t, .12, .12), 'oak', 0, y, zz); }
  const lantern = [kc, h + 1.0, 0]; { bx('iron', kc - .01, kc + .01, h + .9, h + 1.36, -.01, .01); put(new THREE.CylinderGeometry(.07, .08, .2, 6), 'glow', ...lantern); put(new THREE.ConeGeometry(.09, .1, 6), 'iron', lantern[0], lantern[1] + .15, lantern[2]); }
  // candles on the table
  put(new THREE.CylinderGeometry(.012, .014, .14, 8), 'linen', tx + .2, .83, tz + .1); put(new THREE.SphereGeometry(.012, 6, 5).scale(1, 2, 1), 'flame', tx + .2, .915, tz + .1);
  // the shell's glass was made for a dark house: inside, it is clear, so the day comes in and the outside shows
  { const G = glMats().glass; shell.traverse(m => { if (m.isMesh && m.material === G) { m.material = roomMats().pane; m.name = 'pane'; } }); }
  const R = finish(), group = new THREE.Group(); group.add(shell, R.group);
  const windows = Object.entries(plan.open).flatMap(([f, os]) => (os || []).filter(q => q.kind === 'win').map(q => ({ face: f, x: f === 'front' ? q.x : f === 'back' ? -q.x : 0, z: f === 'front' ? plan.d / 2 : f === 'back' ? -plan.d / 2 : 0, y: q.y, w: q.w, h: q.h })));
  const path = one ? [[door.x, Z - .3], [door.x, .4], [front + s * .4, .4]] : [[door.x, Z - .3], [n ? door.x + .85 : .25, Z - .45], [n ? door.x + .85 : .25, .5], [bxx + BD + .4, hz]];
  const doors = [...(one ? [] : [{ x: HX, z: dB.z, w: dB.w, h: dB.h, wall: 'hearth' }]), ...(east ? [{ x: PX, z: dE.z, w: dE.w, h: dE.h, wall: 'east' }] : [])];
  return { path, group, shell, room: R.group, tris: R.tris, draws: R.draws, shellTris: shell.userData.tris, shellCalls: shell.userData.calls, inner: { x0: -X, x1: X, z0: -Z, z1: Z }, hearth: [front, 0, hz], fire, lantern,
    door: { x: door.x, z: plan.d / 2, w: door.w, h: door.h }, back: { x: -back.x, z: -plan.d / 2, w: back.w, h: back.h }, doors, windows, table, seats, bed, boxes, under: under(0), bays: plan.bays || 0, w: plan.w, d: plan.d, one, kitchen: { x0: KX0, x1: KX1 } };
}
// ── the town's coaching inn as a room, copied from docs/prototypes/levelup/rooms.js (Session 1368, card F9; Michael's A on #660: three
// rooms to let across the first floor's front, eight in all). Copied as it stands; only the names differ: mats() → roomMats(),
// gatelandsCoachInnPlan → coachInnPlan, gatelandsBuilding → building. The prototype's comment follows. ──
// the town's coaching inn as a room (Session 1351, card F9; Michael's A on #411 put the inn in the street, his A on #642 on its plot;
// the room behind its door was still the old builder's). Built inside pieces.js's coaching inn front (gatelandsCoachInnPlan: 12.6 by 9 m,
// walls of 0.45 m rendered outside, three storeys of 3.0, 2.9 and 2.6 m, slate behind a parapet, a stack of four flues on each gable; the
// door under its fanlight in the middle bay, the back door to the yard in the second bay from the west). The ground floor is one
// taproom, the front door straight into it as the village inn's is: the open hearth under the west stack (its crane and pot, a settle
// and a stool), the bar across the back wall between the yard door and the stair, a rack of kegs and two shelves of jugs behind it
// round the back window; tables with benches by the front windows and the hearth; by the grate under the east stack the coach
// passengers' corner (a long table under the east window, two armchairs at the fire). The stair is the townhouse's dog-leg (16 risers a
// storey, the half-landing against the back wall, stacked twice) in its own well in the fourth bay, where the back wall has no window.
// Upstairs a corridor runs across the house from the landing; off it the rooms to let: three across the front on both floors, and on the
// first floor two behind (the back middle is the landing, lit by its window); the second floor's back, which has no window, is the
// garret (trunks, the linen press). o.first is the question asked of Michael: 'rooms' (as above, eight rooms) or 'long' (the first
// floor's front one long room, the coffee room, a table for twelve between its two fires; five rooms).
// gatelandsCoachRoom(o, r) -> { group, shell, room, tris, draws, shellTris, shellCalls, inner, floors [F0, F1, F2], ceils, eave, door, back,
//   steps, landings, well, rail, slabs, fires [[x, y, z, fl]], bar, tables, rooms [{x0, x1, z0, z1, fl, door, bed, name}], corridor, paths
//   [{fl, pts}], boxes, lamps, candles, windows, w, d, first }
function coachRoom(o = {}, r = stream('coachroom')) {
  const LONGR = o.first === 'long', plan = coachInnPlan({ kind: 'three', color: o.color || 'cream', paint: o.paint || 'green', r: stream('coachroom-shell') }); plan.interior = true;
  plan.open.front[0].ajar = true; plan.open.back[0].ajar = true;
  const shell = building(plan), M = { ...roomMats(), dress: glMats().dress, plaster: mat('plaster', { ns: .35, color: 0xf2ede2, rough: .95 }), wax: new THREE.MeshStandardMaterial({ color: 0xeee2c4, roughness: .6 }),
    brass: new THREE.MeshStandardMaterial({ color: 0xb8903e, roughness: .32, metalness: .85 }), rug: mat('plaster', { ns: .3, color: 0x6a2a24, rough: 1 }) }, B = new Map(), boxes = [];
  const t = plan.t, X = plan.w / 2 - t, Z = plan.d / 2 - t, g = plan.floors, F0 = .03, F1 = g[0], F2 = g[0] + g[1], EAVE = g[0] + g[1] + g[2], SL = .25;
  const CE = [F1 - SL, F2 - SL, EAVE - .2], floors = [F0, F1, F2];
  const put = (geo, key, x = 0, y = 0, z = 0, ry = 0, uv = .6, rx = 0, rz = 0) => { const q = geo.index ? geo.toNonIndexed() : geo; for (const k of Object.keys(q.attributes)) if (!['position', 'normal'].includes(k)) q.deleteAttribute(k);
    q.applyMatrix4(new THREE.Matrix4().compose(new THREE.Vector3(x, y, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(rx, ry, rz)), new THREE.Vector3(1, 1, 1))); worldUV(q, uv); if (!B.has(key)) B.set(key, []); B.get(key).push(q); return q; };
  const bx = (key, x0, x1, y0, y1, z0, z1, tag, fl) => { put(new THREE.BoxGeometry(x1 - x0, y1 - y0, z1 - z0), key, (x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2); if (tag) boxes.push({ tag, x0, x1, y0, y1, z0, z1, fl }); };
  // ── the plaster lining of the four walls, floor to the top ceiling, every opening cut through it and its reveal plastered (the townhouse's)
  const FACES = { front: [new THREE.Vector3(-1, 0, 0), new THREE.Vector3(0, 0, -1), [0, 0, Z - .004], X], back: [new THREE.Vector3(1, 0, 0), new THREE.Vector3(0, 0, 1), [0, 0, -Z + .004], X],
    left: [new THREE.Vector3(0, 0, -1), new THREE.Vector3(1, 0, 0), [-X + .004, 0, 0], Z], right: [new THREE.Vector3(0, 0, 1), new THREE.Vector3(-1, 0, 0), [X - .004, 0, 0], Z] };
  for (const [f, [U, N, P0, half]] of Object.entries(FACES)) { const s = new THREE.Shape(); s.moveTo(-half, F0 - .01); s.lineTo(half, F0 - .01); s.lineTo(half, CE[2] + .01); s.lineTo(-half, CE[2] + .01); s.lineTo(-half, F0 - .01);
    for (const q of plan.open[f] || []) { const u0 = -q.x - q.w / 2, u1 = -q.x + q.w / 2, y0 = Math.max(q.y, F0), y1 = q.y + q.h, h = new THREE.Path(); h.moveTo(u0, y0); h.lineTo(u0, y1); h.lineTo(u1, y1); h.lineTo(u1, y0); h.lineTo(u0, y0); s.holes.push(h);
      const dep = t - .17, R = (a, b, c, d, e, k) => { const q2 = new THREE.BoxGeometry(a, b, c); q2.applyMatrix4(new THREE.Matrix4().makeBasis(U, new THREE.Vector3(0, 1, 0), N).setPosition(P0[0], 0, P0[2]).multiply(new THREE.Matrix4().makeTranslation(d, e, k))); put(q2, 'plaster', 0, 0, 0, 0, .5); };
      for (const u of [u0, u1]) R(.01, y1 - y0, dep, u + (u === u0 ? -.005 : .005), (y0 + y1) / 2, -dep / 2); R(u1 - u0, .01, dep, (u0 + u1) / 2, y1 + .005, -dep / 2); if (q.y > F0 + .1) R(u1 - u0 + .04, .03, dep + .03, (u0 + u1) / 2, y0 - .015, -dep / 2 + .015); }
    const geo = new THREE.ShapeGeometry(s); geo.applyMatrix4(new THREE.Matrix4().makeBasis(U, new THREE.Vector3(0, 1, 0), N).setPosition(...P0)); put(geo, 'plaster', 0, 0, 0, 0, .5); }
  // ── the plan: the stair's well in the fourth bay against the back wall (S0..S1, from the back wall to WZ1), its flights A (east half,
  // up toward the back) and B (west half, back to the front); the corridor upstairs from CZ0 to CZ1 across the house; the front rooms'
  // partitions at ±PX; the back rooms' at -PX (the landing between) and the well's sides
  const S0 = 1.3, S1 = 3.2, SM = 2.25, WZ1 = -1.01, LZ = -2.9, pt = .04, CZ0 = WZ1 - pt, CZ1 = .2, PX = 1.2, DH = 2.05;
  const cut = (key, x0, x1, z0, z1, y0, y1, doors, tag, fl) => { /* a wall along z (x0..x1 thin) or along x (z0..z1 thin), doors [{a0, a1, h}] cut out, each framed */
    const alongZ = x1 - x0 < z1 - z0, A0 = alongZ ? z0 : x0, A1 = alongZ ? z1 : x1, cuts = [...doors].sort((a, b) => a.a0 - b.a0); let a = A0;
    const seg = (s0, s1, yy0, yy1, tg) => alongZ ? bx(key, x0, x1, yy0, yy1, s0, s1, tg, fl) : bx(key, s0, s1, yy0, yy1, z0, z1, tg, fl);
    for (const d of cuts) { if (d.a0 > a) seg(a, d.a0, y0, y1, tag); seg(d.a0, d.a1, y0 + d.h, y1); for (const e of [d.a0, d.a1]) seg(e - (e === d.a0 ? .06 : 0), e + (e === d.a1 ? .06 : 0), y0, y0 + d.h + .06); seg(d.a0, d.a1, y0 + d.h, y0 + d.h + .06); a = d.a1; }
    if (A1 > a) seg(a, A1, y0, y1, tag); };
  const dr = (x, w = .8) => ({ a0: x - w / 2, a1: x + w / 2, h: DH });
  // the rooms to let, with the doors off the corridor (the front rooms' in its front wall, the back rooms' in its back wall)
  const ROOMS = [], room = (name, fl, x0, x1, z0, z1, dx, bed, dw = .8) => { const R = { name, fl, x0, x1, z0, z1, door: { x: dx, z: z0 > CZ1 - .01 ? CZ1 : CZ0, w: dw, h: DH }, bed }; ROOMS.push(R); return R; };
  for (let fl = 1; fl <= 2; fl++) { const y0 = floors[fl], y1 = CE[fl], e = fl === 2 ? .32 : 0 /* the top floor's corridor stops at the stacks' breasts */, front = fl === 2 || !LONGR;
    cut('plaster', -X + e, X - e, CZ1 - pt, CZ1 + pt, y0, y1, front ? [dr(-4.6), dr(.65), dr(4.6)] : [dr(0, 1.4)], 'partition', fl);
    if (front) for (const x of [-PX, PX]) cut('plaster', x - pt, x + pt, CZ1 + pt, Z, y0, y1, [], 'partition', fl);
    for (const x of [S0 - .05, S1 + .05]) cut('plaster', x - pt, x + pt, -Z, CZ0 + pt, y0, y1, [], 'partition', fl);
    if (fl === 1) { cut('plaster', -X, -PX, CZ0 - pt, CZ0 + pt, y0, y1, [dr(-2.0)], 'partition', fl); cut('plaster', -PX - pt, -PX + pt, -Z, CZ0 - pt, y0, y1, [], 'partition', fl);
      cut('plaster', S1 + .05 + pt, X, CZ0 - pt, CZ0 + pt, y0, y1, [dr(4.9)], 'partition', fl); } }
  // on the ground the well is closed by the same two partitions, open to the taproom at its front; the cupboard under the flights
  for (const x of [S0 - .05, S1 + .05]) cut('plaster', x - pt, x + pt, -Z, WZ1, F0, CE[0], [], 'partition', 0);
  bx('deal', S0, S1, F0, 1.25, -Z, LZ, 'understair', 0); bx('deal', S0, SM, F0, 1.25, LZ, -1.75, 'understair', 0); bx('paint', SM - .02, SM, F0 + .1, 1.15, -2.7, -1.95) /* its door */;
  // the doors' leaves: the front's hung open inside against the front wall west of it, the back's against the back wall
  { const fd = plan.open.front[0], bd = plan.open.back[0], fx0 = fd.x - fd.w / 2, bx0 = -bd.x - bd.w / 2; bx('paint', fx0 - .06, fx0, F0, F0 + fd.h - fd.w / 2, Z - fd.w + .05, Z - .02, 'leaf', 0) /* Session 1396: the leaf to the fanlight's spring, 2.2 m */; bx('paint', bx0, bx0 + .06, F0, F0 + bd.h - .05, -Z + .02, -Z + bd.w - .02, 'leaf', 0); }
  // ── the floors: the taproom flagged; the upper floors boarded on joists with the plaster ceiling under, open over the well; the top ceiling
  const slabs = []; { for (let z = -Z; z < Z - .05;) { const d = Math.min(Z - z, .5 + r() * .3); for (let x = -X; x < X - .05;) { const w = Math.min(X - x, .55 + r() * .4); put(new THREE.BoxGeometry(w - .02, F0, d - .02), 'flag', x + w / 2, F0 / 2 + (r() - .5) * .004, z + d / 2, 0, .7); x += w; } z += d; }
    for (const [fl, y] of [[1, F1], [2, F2]]) { for (const [x0, x1, z0, z1] of [[-X, S0, -Z, Z], [S0, S1, WZ1, Z], [S1, X, -Z, Z]]) { bx('deal', x0, x1, y - .04, y, z0, z1); bx('oak', x0, x1, y - SL + .03, y - .04, z0, z1); bx('plaster', x0, x1, y - SL, y - SL + .03, z0, z1); slabs.push({ x0, x1, z0, z1, y0: y - SL, y1: y, fl }); }
      bx('oak', S0, S1, y - SL, y, WZ1 - .06, WZ1); }
    bx('plaster', -X, X, CE[2], CE[2] + .04, -Z, Z); slabs.push({ x0: -X, x1: X, z0: -Z, z1: Z, y0: CE[2], y1: CE[2] + .04, fl: 3 });
    for (let fl = 0; fl < 3; fl++) for (const s of [-1, 1]) bx('oak', -X, X, floors[fl], floors[fl] + .12, s > 0 ? Z - .02 : -Z, s > 0 ? Z : -Z + .02); }
  // ── the stair (the townhouse's, moved into the fourth bay): 8 risers up flight A to the half-landing, 8 back up flight B, twice
  const G = .27, steps = [], landings = []; let rail = [];
  for (let fl = 0; fl < 2; fl++) { const y0 = floors[fl], ri = (floors[fl + 1] - y0) / 16, yL = y0 + 8 * ri;
    for (let i = 1; i <= 7; i++) { const y = y0 + i * ri, z1 = WZ1 - (i - 1) * G, z0 = z1 - G; bx('oak', SM + .05, S1, Math.max(y - ri - .06, y0), y, z0, z1); steps.push({ x0: SM + .05, x1: S1, z0, z1, y, fl, flight: fl ? 'C' : 'A' }); }
    bx('oak', S0, S1, yL - .2, yL, -Z, LZ); landings.push({ x0: S0, x1: S1, z0: -Z, z1: LZ, y: yL, fl });
    for (let i = 1; i <= 7; i++) { const y = yL + i * ri, z0 = LZ + (i - 1) * G, z1 = z0 + G; bx('oak', S0, SM, y - ri - .06, y, z0, z1); steps.push({ x0: S0, x1: SM, z0, z1, y, fl, flight: fl ? 'D' : 'B' }); }
    for (const [zA, yA, zB, yB] of [[WZ1, y0, LZ, yL], [LZ, yL, WZ1, floors[fl + 1]]]) { const n = 8; for (let k = 0; k <= n; k++) { const z = zA + (zB - zA) * k / n, y = yA + (yB - yA) * k / n; bx('oak', SM + .01, SM + .04, y, y + .9, z - .015, z + .015); }
      const L = Math.hypot(zB - zA, yB - yA), q = new THREE.BoxGeometry(.06, .06, L); q.rotateX(Math.atan2(yB - yA, zA - zB)); put(q, 'oak', SM + .025, (yA + yB) / 2 + .92, (zA + zB) / 2); }
    for (const [z, y] of [[WZ1, y0], [LZ, yL], [WZ1, floors[fl + 1]]]) bx('oak', SM - .01, SM + .06, y, y + 1.05, z - .035, z + .035); }
  { const y = F2; for (let x = SM + .05; x <= S1 - .05; x += .12) bx('oak', x - .015, x + .015, y, y + .9, WZ1 + .02, WZ1 + .05); bx('oak', SM, S1, y + .9, y + .96, WZ1, WZ1 + .07, 'wellrail', 2); rail = [{ x0: SM, x1: S1, z: WZ1, y: y + .96 }]; }
  // ── the fires on the gables (s = -1 the west, +1 the east): a breast, an opening, a surround and a mantel and a grate; or the taproom's
  // open hearth, wide and deep, with its crane and pot over a turf fire
  const fires = []; const fireplace = (fl, s, z, w, open) => { const y0 = floors[fl], y1 = CE[fl], D = open ? .6 : .35, oh = open ? 1.35 : .9, ow = open ? 1.9 : .8, xw = s * X, xi = s * (X - D), lo = Math.min(xw, xi), hi = Math.max(xw, xi);
    bx('plaster', lo, hi, y0 + oh, y1, z - w / 2, z + w / 2); bx('plaster', lo, hi, y0, y0 + oh, z - w / 2, z - ow / 2); bx('plaster', lo, hi, y0, y0 + oh, z + ow / 2, z + w / 2); boxes.push({ tag: 'breast', x0: lo, x1: hi, y0, y1, z0: z - w / 2, z1: z + w / 2, fl });
    bx('soot', xw - s * .02, xw, y0, y0 + oh, z - ow / 2, z + ow / 2); bx('soot', lo, hi, y0 + oh - .02, y0 + oh, z - ow / 2, z + ow / 2);
    const ins = d => xw - s * d /* d metres in from the gable */;
    if (open) { const a = Math.min(ins(D - .3), ins(D + .08)), b = Math.max(ins(D - .3), ins(D + .08)); bx('oak', a, b, y0 + oh, y0 + oh + .26, z - ow / 2 - .25, z + ow / 2 + .25);
      const h0 = Math.min(ins(D), ins(D + .75)), h1 = Math.max(ins(D), ins(D + .75)); bx('flag', h0, h1, y0, y0 + .03, z - ow / 2, z + ow / 2, 'hearthstone', fl);
      const fx = ins(.32); for (let i = 0; i < 7; i++) { const a2 = i / 7 * Math.PI * 2; put(new THREE.BoxGeometry(.24, .1, .12), 'turf', fx + Math.cos(a2) * .15, y0 + .06 + (i % 2) * .08, z + Math.sin(a2) * .22, a2 + 1.3); }
      put(new THREE.SphereGeometry(.16, 10, 6).scale(1.2, .4, 1.4), 'ember', fx, y0 + .08, z); for (let i = 0; i < 3; i++) put(new THREE.ConeGeometry(.07, .28 + i * .06, 7), 'flame', fx + (i - 1) * .04, y0 + .26, z + (i - 1) * .09);
      const cx = ins(.08), cz = z - ow / 2 + .1; bx('iron', cx - .02, cx + .02, y0 + .2, y0 + 1.2, cz - .02, cz + .02); put(new THREE.BoxGeometry(.03, .03, .8), 'iron', cx - s * .02, y0 + 1.1, cz + .4); put(new THREE.CylinderGeometry(.008, .008, .4, 4), 'iron', cx - s * .02, y0 + .9, cz + .65);
      put(new THREE.SphereGeometry(.17, 14, 10, 0, Math.PI * 2, .35, Math.PI - .35), 'iron', ins(.28), y0 + .58, cz + .65); fires.push([fx, y0 + .32, z, fl, 'open']); return { x: xi, z, y: y0 + oh }; }
    const m0 = Math.min(xi, xi - s * .05), m1 = Math.max(xi, xi - s * .05); for (const k of [-1, 1]) bx('dress', m0, m1, y0, y0 + oh + .2, z + k * ow / 2 + (k > 0 ? 0 : -.2), z + k * ow / 2 + (k > 0 ? .2 : 0)); bx('dress', m0, m1, y0 + oh, y0 + oh + .2, z - ow / 2, z + ow / 2);
    { const a = Math.min(xi, xi - s * .22), b = Math.max(xi, xi - s * .22); bx('dress', a, b, y0 + oh + .2, y0 + oh + .25, z - ow / 2 - .3, z + ow / 2 + .3); } { const a = Math.min(xi, xi - s * .45), b = Math.max(xi, xi - s * .45); bx('dress', a, b, y0, y0 + .03, z - ow / 2 - .1, z + ow / 2 + .1); }
    { const a = Math.min(ins(.08), ins(.28)), b = Math.max(ins(.08), ins(.28)); bx('iron', a, b, y0 + .1, y0 + .13, z - .25, z + .25); for (const zz of [z - .25, z + .25]) bx('iron', Math.min(ins(.08), ins(.3)), Math.max(ins(.08), ins(.3)), y0, y0 + .32, zz - .015, zz + .015); }
    for (let k = 0; k < 7; k++) put(new THREE.BoxGeometry(.09, .05, .07), 'ember', ins(.12 + r() * .14), y0 + .15 + r() * .05, z + (r() - .5) * .4, r() * 3);
    put(new THREE.SphereGeometry(.05, 6, 4).scale(1, 2.2, 1), 'flame', ins(.2), y0 + .3, z - .05); put(new THREE.SphereGeometry(.04, 6, 4).scale(1, 2, 1), 'flame', ins(.22), y0 + .28, z + .1);
    fires.push([ins(.25), y0 + .3, z, fl]); return { x: xi, z, y: y0 + oh }; };
  // the top floor: the gables' stacks come down inside the walls, so their breasts stand floor to ceiling here
  const stackZ = (.4 + .36 * 4) / 2 + .04; for (const s of [-1, 1]) { const x0 = s < 0 ? -X : X - .32, x1 = s < 0 ? -X + .32 : X; bx('plaster', x0, x1, F2, CE[2], -stackZ, stackZ, 'breast', 2); }
  const hearth = fireplace(0, -1, 0, 2.6, true), grate = fireplace(0, 1, -2.0, 1.5); fireplace(1, -1, 2.1, 1.5); fireplace(1, -1, -2.1, 1.5); fireplace(1, 1, 2.1, 1.5);
  // ── furniture kit (the townhouse's)
  const chair = (fl, x, z, face, key = 'oak', arms = false) => { const y0 = floors[fl], c = { x0: x - .23, x1: x + .23, z0: z - .23, z1: z + .23, y: y0 + .44 }; bx(key, c.x0, c.x1, c.y - .04, c.y, c.z0, c.z1, 'chair', fl);
    for (const dx of [-.19, .19]) for (const dz of [-.19, .19]) bx(key, x + dx - .02, x + dx + .02, y0, c.y - .04, z + dz - .02, z + dz + .02);
    const bxs = face === 'x+' ? x - .21 : face === 'x-' ? x + .21 : null, bzs = face === 'z+' ? z - .21 : face === 'z-' ? z + .21 : null;
    if (bxs != null) { for (const dz of [-.19, .19]) bx(key, bxs - .02, bxs + .02, c.y, y0 + 1.0, z + dz - .02, z + dz + .02); bx(key, bxs - .02, bxs + .02, y0 + .78, y0 + .96, z - .19, z + .19); }
    else { for (const dx of [-.19, .19]) bx(key, x + dx - .02, x + dx + .02, c.y, y0 + 1.0, bzs - .02, bzs + .02); bx(key, x - .19, x + .19, y0 + .78, y0 + .96, bzs - .02, bzs + .02); }
    if (arms) { bx('wool', c.x0 + .03, c.x1 - .03, c.y, c.y + .06, c.z0 + .03, c.z1 - .03); for (const s of [-1, 1]) (bxs != null ? bx(key, x - .2, x + .2, y0 + .62, y0 + .66, z + s * .21 - .025, z + s * .21 + .025) : bx(key, x + s * .21 - .025, x + s * .21 + .025, y0 + .62, y0 + .66, z - .2, z + .2)); }
    return c; };
  const table = (fl, x0, x1, z0, z1, h = .76, key = 'deal', tag = 'table') => { const y0 = floors[fl], y = y0 + h; bx(key, x0, x1, y - .04, y, z0, z1, tag, fl);
    for (const xx of [x0 + .06, x1 - .06]) for (const zz of [z0 + .06, z1 - .06]) bx(key, xx - .03, xx + .03, y0, y - .04, zz - .03, zz + .03); return { x0, x1, z0, z1, y, fl }; };
  const bench = (fl, x0, x1, z0, z1) => { const y0 = floors[fl], alongX = x1 - x0 > z1 - z0; bx('oak', x0, x1, y0 + .41, y0 + .45, z0, z1, 'bench', fl);
    for (const s of [0, 1]) alongX ? bx('oak', s ? x1 - .13 : x0 + .07, s ? x1 - .07 : x0 + .13, y0, y0 + .41, z0 + .03, z1 - .03) : bx('oak', x0 + .03, x1 - .03, y0, y0 + .41, s ? z1 - .13 : z0 + .07, s ? z1 - .07 : z0 + .13); };
  const stool = (fl, x, z) => { const y0 = floors[fl]; bx('deal', x - .17, x + .17, y0 + .41, y0 + .45, z - .17, z + .17, 'stool', fl); for (const a of [0, 2.1, 4.2]) put(new THREE.CylinderGeometry(.018, .022, .41, 6), 'deal', x + Math.cos(a) * .11, y0 + .205, z + Math.sin(a) * .11); };
  const lamp = (fl, x, z, drop = .55) => { const y = CE[fl] - drop; bx('iron', x - .005, x + .005, y + .1, CE[fl], z - .005, z + .005); put(new THREE.CylinderGeometry(.08, .09, .22, 6), 'glow', x, y, z); put(new THREE.ConeGeometry(.1, .1, 6), 'iron', x, y + .16, z); return [x, y, z, fl]; };
  const candle = (x, y, z) => { put(new THREE.CylinderGeometry(.04, .05, .02, 10), 'brass', x, y + .01, z); put(new THREE.CylinderGeometry(.016, .018, .15, 8), 'wax', x, y + .095, z); put(new THREE.SphereGeometry(.011, 5, 4).scale(1, 2.2, 1), 'flame', x, y + .185, z); return [x, y + .2, z]; };
  const lamps = [], candles = [], tables = [];
  // ── the taproom. The settle facing the open hearth, its back to the room, and a stool; a table with benches by the hearth's back corner
  const settle = { x0: -3.7, x1: -3.2, z0: -1.0, z1: .9, y: F0 + .44 }; bx('oak', settle.x0, settle.x1, F0, settle.y, settle.z0, settle.z1, 'settle', 0); bx('oak', settle.x1 - .08, settle.x1, settle.y, F0 + 1.35, settle.z0, settle.z1);
  for (const z of [settle.z0, settle.z1 - .06]) bx('oak', settle.x0, settle.x1, settle.y, F0 + .75, z, z + .06); bx('wool', settle.x0 + .02, settle.x1 - .1, settle.y, settle.y + .04, settle.z0 + .1, settle.z1 - .1); stool(0, -4.3, 1.3);
  // the bar across the back wall, from the yard door's jamb to the well: oak boards at 1.05, the rack of kegs behind it, jugs on two
  // shelves either side of the back window, tankards on the counter
  const bar = { x0: -1.6, x1: .9, z0: -Z + .95, z1: -Z + 1.5, y: F0 + 1.05 }; bx('oak', bar.x0, bar.x1, F0, bar.y - .05, bar.z0, bar.z1, 'bar', 0); bx('deal', bar.x0 - .04, bar.x1 + .04, bar.y - .05, bar.y, bar.z0 - .04, bar.z1 + .04);
  bx('oak', bar.x0 + .1, bar.x1 - .1, F0, F0 + .45, -Z, -Z + .55, 'rack', 0); for (let x = bar.x0 + .4; x < bar.x1 - .25; x += .62) { const q = new THREE.CylinderGeometry(.24, .24, .5, 14); q.rotateX(Math.PI / 2); put(q, 'oak', x, F0 + .69, -Z + .27); put(new THREE.CylinderGeometry(.03, .03, .08, 6).rotateX(Math.PI / 2), 'iron', x, F0 + .5, -Z + .55); }
  const shelves = plan.open.back.filter(q => q.kind === 'win' && q.y < F1).map(q => [-q.x - q.w / 2 - .05, -q.x + q.w / 2 + .05]).reduce((S, [w0, w1]) => S.flatMap(([s0, s1]) => w1 <= s0 || w0 >= s1 ? [[s0, s1]] : [[s0, w0], [w1, s1]].filter(([u, v]) => v - u > .35)), [[bar.x0, bar.x1]]);
  for (const [s0, s1] of shelves) for (const y of [F0 + 1.55, F0 + 1.95]) { bx('deal', s0, s1, y, y + .03, -Z, -Z + .28); for (let x = s0 + .15; x < s1 - .1; x += .22) put(new THREE.CylinderGeometry(.05, .06, .18, 10), x % .44 < .22 ? 'crock' : 'delft', x, y + .12, -Z + .14); }
  for (let k = 0; k < 5; k++) put(new THREE.CylinderGeometry(.045, .045, .14, 10), k % 2 ? 'crock' : 'iron', bar.x0 + .35 + k * .45, bar.y + .07, (bar.z0 + bar.z1) / 2); lamps.push(lamp(0, (bar.x0 + bar.x1) / 2, bar.z1 + .45));
  // the tables: by the west front windows, at the hearth's back corner, east of the door; benches along their long sides
  for (const [tx, tz] of [[-3.4, 2.5], [-4.3, -3.0], [2.0, 2.5]]) { const T = table(0, tx - .8, tx + .8, tz - .38, tz + .38); tables.push(T); for (const sz of [-1, 1]) bench(0, tx - .75, tx + .75, tz + sz * .62 - .15, tz + sz * .62 + .15);
    candles.push(candle(tx + .2, T.y, tz)); if (tz > 0) lamps.push(lamp(0, tx, tz)); }
  // the coach passengers' corner: a long table under the east window, benches either side; two armchairs at the grate
  { const T = table(0, 4.3, 5.1, 0, 2.6, .76, 'oak', 'table'); tables.push(T); bench(0, 3.8, 4.1, .1, 2.5); bench(0, 5.3, 5.6, .1, 2.5); candles.push(candle(4.7, T.y, .8), candle(4.7, T.y, 1.9)); lamps.push(lamp(0, 4.7, 1.3));
    chair(0, 4.85, -3.15, 'z+', 'oak', true); chair(0, 4.85, -.85, 'z-', 'oak', true); bx('rug', 3.9, 5.5, F0, F0 + .01, -3.3, -.7); }
  // ── upstairs. A bed (2 m, a chest at its foot), a washstand with its jug and basin, a chair; a candle on the chest
  const bedAt = (fl, x0, z0, along = 'z') => { const y0 = floors[fl], b = along === 'z' ? { x0, x1: x0 + 1.0, z0, z1: z0 + 2.0 } : { x0, x1: x0 + 2.0, z0, z1: z0 + 1.0 };
    bx('oak', b.x0, b.x1, y0, y0 + .45, b.z0, b.z1, 'bed', fl); bx('straw', b.x0 + .04, b.x1 - .04, y0 + .45, y0 + .55, b.z0 + .04, b.z1 - .04); return { ...b, y: y0 + .55 }; };
  const dress = (b, headZ) => { const y = b.y, inZ = headZ === 'z0'; bx('linen', b.x0 + .1, b.x1 - .1, y, y + .11, inZ ? b.z0 + .08 : b.z1 - .45, inZ ? b.z0 + .45 : b.z1 - .08); bx('wool', b.x0 + .03, b.x1 - .03, y, y + .05, inZ ? b.z0 + .5 : b.z0 + .04, inZ ? b.z1 - .04 : b.z1 - .5);
    const y0 = b.y - .55; bx('oak', b.x0, b.x1, y0 + .45, y0 + 1.05, inZ ? b.z0 : b.z1 - .05, inZ ? b.z0 + .05 : b.z1) /* the headboard */; };
  const chest = (fl, x0, x1, z0, z1) => { const y0 = floors[fl]; bx('oak', x0, x1, y0, y0 + .5, z0, z1, 'chest', fl); candles.push(candle((x0 + x1) / 2, y0 + .5, (z0 + z1) / 2)); };
  const wash = (fl, x0, x1, z0, z1) => { const y0 = floors[fl], cx = (x0 + x1) / 2, cz = (z0 + z1) / 2; bx('deal', x0, x1, y0, y0 + .78, z0, z1, 'washstand', fl); put(new THREE.CylinderGeometry(.16, .1, .08, 14), 'delft', cx, y0 + .82, cz); put(new THREE.CylinderGeometry(.06, .07, .22, 12), 'delft', cx + .1, y0 + .93, cz - .05); };
  const front = (fl, name, x0, x1, dx, bx0) => { /* a front room: the bed's head to the corridor wall, its chest at the foot, the washstand against a partition */ const b = bedAt(fl, bx0, CZ1 + pt + .02); dress(b, 'z0'); chest(fl, b.x0 + .05, b.x1 - .05, b.z1 + .05, b.z1 + .55);
    const wide = x1 - x0 > 3, wx = wide ? (bx0 < 0 ? -PX - pt - .5 : PX + pt + .04) : x1 - .5; wash(fl, wx, wx + .46, wide ? 1.0 : 2.6, wide ? 1.5 : 3.0); return room(name, fl, x0, x1, CZ1 + pt, Z, dx, b); };
  for (let fl = 1; fl <= 2; fl++) if (fl === 2 || !LONGR) { const k = fl === 1 ? 'first' : 'second';
    front(fl, `the ${k} floor's west front room`, -X, -PX - pt, -4.6, -3.6); front(fl, `the ${k} floor's middle front room`, -PX + pt, PX - pt, .65, -1.1); front(fl, `the ${k} floor's east front room`, PX + pt, X, 4.6, 2.6); }
  { /* the first floor's two back rooms: the beds' heads to the back wall, clear of its windows */ const bw = bedAt(1, -3.6, -Z + .05); dress(bw, 'z0'); chest(1, bw.x0 + .05, bw.x1 - .05, bw.z1 + .05, bw.z1 + .5); wash(1, -PX - pt - .5, -PX - pt - .04, -3.9, -3.4); room('the first floor\'s west back room', 1, -X, -PX - pt, -Z, CZ0 - pt, -2.0, bw);
    const be = bedAt(1, S1 + .15, -Z + .05); dress(be, 'z0'); chest(1, be.x0 + .05, be.x1 - .05, be.z1 + .05, be.z1 + .5); wash(1, X - .5, X - .04, -3.4, -2.9); room('the first floor\'s east back room', 1, S1 + .05 + pt, X, -Z, CZ0 - pt, 4.9, be); }
  // the coffee room ('long'): the first floor's front in one, a table for twelve between the two fires, a sideboard against the corridor
  let coffee = null; if (LONGR) { const T = table(1, -2.9, 2.9, 1.65, 2.65, .76, 'oak', 'table'); tables.push(T); coffee = { x0: -X, x1: X, z0: CZ1 + pt, z1: Z, fl: 1, door: { x: 0, z: CZ1, w: 1.4, h: DH }, table: T };
    for (let k = 0; k < 5; k++) { const x = -2.4 + k * 1.2; chair(1, x, 1.3, 'z+'); chair(1, x, 3.0, 'z-'); } chair(1, -3.25, 2.15, 'x+'); chair(1, 3.25, 2.15, 'x-');
    bx('oak', 1.6, 3.4, F1, F1 + .9, CZ1 + pt, CZ1 + pt + .5, 'sideboard', 1); put(new THREE.CylinderGeometry(.07, .09, .26, 12), 'delft', 2.0, F1 + 1.03, CZ1 + .3); for (const x of [-1.5, 0, 1.5]) candles.push(candle(x, T.y, 2.15)); lamps.push(lamp(1, -1.5, 2.15), lamp(1, 1.5, 2.15)); bx('rug', -3.4, 3.4, F1, F1 + .01, 1.0, 3.3); }
  // the corridors' lamps; the garret behind the top floor's corridor: trunks against the back wall, the linen press against the well
  for (let fl = 1; fl <= 2; fl++) for (const x of [-3.6, 3.9]) lamps.push(lamp(fl, x, (CZ0 + CZ1) / 2, fl === 2 ? .3 : .4));
  for (const [x0, x1] of [[-5.2, -4.2], [-3.2, -2.2], [-.9, .1]]) bx('oak', x0, x1, F2, F2 + .55, -Z + .05, -Z + .6, 'trunk', 2); bx('paint', S1 + .5, S1 + 1.9, F2, F2 + 1.9, -Z + .05, -Z + .6, 'press', 2); lamps.push(lamp(2, -2.0, -2.6, .35));
  // the windows are clear from inside
  { const Gl = glMats().glass, Lt = glMats().lit; shell.traverse(m => { if (m.isMesh && (m.material === Gl || m.material === Lt)) { m.material = roomMats().pane; m.name = 'pane'; } }); }
  const group = new THREE.Group(); let tris = 0; for (const [k, gs] of B) { const q = mergeGeometries(gs, false); gs.forEach(x => x.dispose()); const m = new THREE.Mesh(q, M[k]); m.name = k; m.castShadow = !['flame', 'ember', 'glow'].includes(k); m.receiveShadow = true; group.add(m); tris += q.attributes.position.count / 3; }
  const all = new THREE.Group(); all.add(shell, group);
  const windows = Object.entries(plan.open).flatMap(([f, os]) => (os || []).filter(q => q.kind === 'win').map(q => ({ face: f, x: f === 'front' ? q.x : f === 'back' ? -q.x : f === 'right' ? X + t : -X - t, z: f === 'front' ? plan.d / 2 : f === 'back' ? -plan.d / 2 : -q.x, y: q.y, w: q.w, h: q.h })));
  const fd = plan.open.front[0], bd = plan.open.back[0], CZ = (CZ0 + CZ1) / 2, paths = [
    { fl: 0, pts: [[fd.x, Z - .3], [0, bar.z1 + .3]] }, { fl: 0, pts: [[fd.x, Z - .3], [.6, .5], [2.75, -.5], [2.75, WZ1 + .2]] }, { fl: 0, pts: [[fd.x, Z - .3], [fd.x, 2.3], [-1.9, -.8], [-bd.x, -Z + .35]] },
    { fl: 0, pts: [[fd.x, Z - .3], [.6, .5], [3.5, -.3], [4.0, -2.0]] }, { fl: 0, pts: [[fd.x, Z - .3], [fd.x, 2.3], [-2.0, -1.35], [-4.0, -1.35], [hearth.x + 1.0, -.5]] },
    ...[1, 2].flatMap(fl => [{ fl, pts: [[SM - .45, WZ1 + .2], [SM - .45, CZ], [-X + .85, CZ]] }, { fl, pts: [[SM - .45, WZ1 + .2], [SM - .45, CZ], [X - .85, CZ]] }]),
    ...ROOMS.map(R => ({ fl: R.fl, pts: [[SM - .45, CZ], [R.door.x, CZ], [R.door.x, R.door.z + (R.z0 > 0 ? .55 : -.55)]] }))];
  return { group: all, shell, room: group, tris: Math.round(tris), draws: group.children.length, shellTris: shell.userData.tris, shellCalls: shell.userData.calls, inner: { x0: -X, x1: X, z0: -Z, z1: Z }, floors, ceils: CE, eave: EAVE,
    door: { x: fd.x, z: plan.d / 2, w: fd.w, h: fd.h }, back: { x: -bd.x, z: -plan.d / 2, w: bd.w, h: bd.h }, steps, landings, well: { x0: S0, x1: S1, z0: -Z, z1: WZ1 }, rail, slabs, fires, hearth, grate, settle, bar, tables, rooms: ROOMS, coffee,
    corridor: { z0: CZ0 + pt, z1: CZ1 - pt }, paths, boxes, lamps, candles, windows, w: plan.w, d: plan.d, first: LONGR ? 'long' : 'rooms' };
}

// ── the Gatelands townhouse as a room (rooms.js's Session 1189, Michael's A on #303; laid out by bays in Session 1427; card F9), copied
// with the inn's renames (mats() → roomMats(), GL_PLANS → PLANS, gatelandsBuilding → building, glBayPlan → bayPlan). Its door is at
// the east end; the game's west-door house is this one mirrored (the room's frame, 83-world-generator.js's buildKitTownhouse). ──
// o.bays, o.d (Session 1427): the house on 3, 4 or 5 bays of 1.95 m and 6.75 to 9 m deep, as the game's towns build it (glBayPlan, its
// door in the east bay; a lot's west-door house is this one mirrored). Every piece is placed from the west gable, the hall's partition
// (1.15 m west of the door's middle), the front and back walls and the stair, which keeps the drawn well (its half-landing on the back
// wall, 3.04 m of flights). The cross wall between front and back rooms stands where the drawn one does, 4.4 of 8.1 m from the back; on
// the upper floors, where the landing in front of the well needs 1.36 m, the hall's bay keeps its cross wall there and the front room
// turns round the partition's end. Where a door off the landing into the back room would stand over the well (shallower than 9 m), the
// back rooms upstairs are reached through the front ones: the drawn double doors on the first floor, a door beside the bed on the second.
// Four and five bays widen the west rooms by 1.95 or 3.9 m: a bookcase (and a china press) in the parlour, a meal chest (and a settle) in the
// kitchen, the settee over to the partition upstairs, a bookcase on the landing's side of the drawing room and a clothes press in the bedroom.
// Under 7.6 m the children's bunks stand clear of the stack's breast; the dining table shortens to fit the room.
function townhouseRoom(o = {}, r = stream('townhouse')) {
  const n = o.bays, opt = { color: o.color || 'ochre', paint: o.paint || 'blue' };
  const plan = n ? bayPlan('townhouse', n, { ...opt, doorX: 1, d: o.d }) : PLANS.townhouse({ ...opt, doorX: 1.95 }); plan.interior = true; plan.r = stream('townhouse-shell');
  plan.open.front[0].ajar = true; plan.open.back[0].ajar = true;
  const shell = building(plan), M = { ...roomMats(), dress: glMats().dress, plaster: mat('plaster', { ns: .35, color: 0xf2ede2, rough: .95 }), wax: new THREE.MeshStandardMaterial({ color: 0xeee2c4, roughness: .6 }),
    brass: new THREE.MeshStandardMaterial({ color: 0xb8903e, roughness: .32, metalness: .85 }), rug: mat('plaster', { ns: .3, color: 0x6a2a24, rough: 1 }) }, B = new Map(), boxes = [];
  const t = plan.t, X = plan.w / 2 - t, Z = plan.d / 2 - t, g = plan.floors, F0 = .03, F1 = g[0], F2 = g[0] + g[1], EAVE = g[0] + g[1] + g[2], SL = .25 /* a floor's depth, boards to ceiling */;
  const CE = [F1 - SL, F2 - SL, EAVE - .2], floors = [F0, F1, F2];
  const put = (geo, key, x = 0, y = 0, z = 0, ry = 0, uv = .6, rx = 0, rz = 0) => { const q = geo.index ? geo.toNonIndexed() : geo; for (const k of Object.keys(q.attributes)) if (!['position', 'normal'].includes(k)) q.deleteAttribute(k);
    q.applyMatrix4(new THREE.Matrix4().compose(new THREE.Vector3(x, y, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(rx, ry, rz)), new THREE.Vector3(1, 1, 1))); worldUV(q, uv); if (!B.has(key)) B.set(key, []); B.get(key).push(q); return q; };
  const bx = (key, x0, x1, y0, y1, z0, z1, tag, fl) => { put(new THREE.BoxGeometry(x1 - x0, y1 - y0, z1 - z0), key, (x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2); if (tag) boxes.push({ tag, x0, x1, y0, y1, z0, z1, fl }); };
  // ── the plaster lining of the four walls, floor to the top ceiling, with every opening cut through it and its reveal plastered to the frame
  const FACES = { front: [new THREE.Vector3(-1, 0, 0), new THREE.Vector3(0, 0, -1), [0, 0, Z - .004], X], back: [new THREE.Vector3(1, 0, 0), new THREE.Vector3(0, 0, 1), [0, 0, -Z + .004], X],
    left: [new THREE.Vector3(0, 0, -1), new THREE.Vector3(1, 0, 0), [-X + .004, 0, 0], Z], right: [new THREE.Vector3(0, 0, 1), new THREE.Vector3(-1, 0, 0), [X - .004, 0, 0], Z] };
  for (const [f, [U, N, P0, half]] of Object.entries(FACES)) { const s = new THREE.Shape(); s.moveTo(-half, F0 - .01); s.lineTo(half, F0 - .01); s.lineTo(half, CE[2] + .01); s.lineTo(-half, CE[2] + .01); s.lineTo(-half, F0 - .01);
    for (const q of plan.open[f] || []) { const u0 = -q.x - q.w / 2, u1 = -q.x + q.w / 2, y0 = Math.max(q.y, F0), y1 = q.y + q.h, h = new THREE.Path(); h.moveTo(u0, y0); h.lineTo(u0, y1); h.lineTo(u1, y1); h.lineTo(u1, y0); h.lineTo(u0, y0); s.holes.push(h);
      const dep = t - .17, R = (a, b, c, d, e, k) => { const q2 = new THREE.BoxGeometry(a, b, c); q2.applyMatrix4(new THREE.Matrix4().makeBasis(U, new THREE.Vector3(0, 1, 0), N).setPosition(P0[0], 0, P0[2]).multiply(new THREE.Matrix4().makeTranslation(d, e, k))); put(q2, 'plaster', 0, 0, 0, 0, .5); };
      for (const u of [u0, u1]) R(.01, y1 - y0, dep, u + (u === u0 ? -.005 : .005), (y0 + y1) / 2, -dep / 2); R(u1 - u0, .01, dep, (u0 + u1) / 2, y1 + .005, -dep / 2); if (q.y > F0 + .1) R(u1 - u0 + .04, .03, dep + .03, (u0 + u1) / 2, y0 - .015, -dep / 2 + .015); }
    const geo = new THREE.ShapeGeometry(s); geo.applyMatrix4(new THREE.Matrix4().makeBasis(U, new THREE.Vector3(0, 1, 0), N).setPosition(...P0)); put(geo, 'plaster', 0, 0, 0, 0, .5); }
  // ── the plan: the partition between the hall (and the stair) and the rooms west of it; across the house between front and back rooms.
  // PX the partition, 1.15 m west of the door's middle; SX flight A's west side; the well from the back wall to WZ[1], the half-landing
  // LD deep on the back wall and seven treads of G each; PZ the west rooms' cross wall, PH the hall bay's upstairs (in front of the landing)
  const fd = plan.open.front[0], bd = plan.open.back[0], dx = fd.x, PX = dx - 1.15, pt = .05, W0 = PX + .05, SX = PX + 1.05, LD = 1.15, G = .27, WZ = [-Z, -Z + LD + 7 * G];
  const PZ = -Z + Z * 8.8 / 8.1, PH = Math.max(PZ, WZ[1] + 1.36), fz0 = PZ + pt, kz1 = PZ - pt, cF = (fz0 + Z) / 2 - .025, cB = (kz1 - Z) / 2 - .025, wide = PX - pt + X - 3.5 /* the west rooms' width past the drawn 3.5 m */;
  const ri0 = (F1 - F0) / 16, zH = -Z + LD + (Math.ceil(2.06 / ri0 - 7 - 1e-9) - 1) * G /* where flight B's underside is 2.0 m over the hall */;
  const ka1 = Math.min(WZ[1] + 1.06, kz1 - .05), ka0 = Math.max(ka1 - .9, zH), kdc = (ka0 + ka1) / 2 /* the back room's door off the hall, in front of the well or under flight B's top */;
  const upOK = ka0 >= WZ[1] + .1 /* and upstairs the same door off the landing, if it stands in front of the well */, pdc = Z - 1.7 /* the parlour's door */;
  const cut = (key, x0, x1, z0, z1, y0, y1, doors, tag, fl) => { /* a wall from a0 to a1 along z (x0..x1 thin) or along x (z0..z1 thin), doors [{a0, a1, h}] cut out */
    const alongZ = x1 - x0 < z1 - z0, A0 = alongZ ? z0 : x0, A1 = alongZ ? z1 : x1, cuts = [...doors].sort((a, b) => a.a0 - b.a0); let a = A0;
    const seg = (s0, s1, yy0, yy1, tg) => alongZ ? bx(key, x0, x1, yy0, yy1, s0, s1, tg, fl) : bx(key, s0, s1, yy0, yy1, z0, z1, tg, fl);
    for (const d of cuts) { if (d.a0 > a) seg(a, d.a0, y0, y1, tag); seg(d.a0, d.a1, y0 + d.h, y1); for (const e of [d.a0, d.a1]) seg(e - (e === d.a0 ? .06 : 0), e + (e === d.a1 ? .06 : 0), y0, y0 + d.h + .06); seg(d.a0, d.a1, y0 + d.h, y0 + d.h + .06); a = d.a1; }
    if (A1 > a) seg(a, A1, y0, y1, tag); };
  for (let fl = 0; fl < 3; fl++) { const y0 = floors[fl], y1 = CE[fl];
    cut('plaster', PX - pt, PX + pt, -Z, fl ? PH + pt : Z, y0, y1, fl === 0 ? [{ a0: pdc - .45, a1: pdc + .45, h: 2.1 }, { a0: ka0, a1: ka1, h: 2.1 }] : upOK ? [{ a0: ka0, a1: ka1, h: 2.05 }] : [], 'partition', fl);
    cut('plaster', -X, PX - pt, PZ - pt, PZ + pt, y0, y1, fl === 1 ? [{ a0: -X + .95, a1: -X + 2.15, h: 2.3 }] : fl === 2 && !upOK ? [{ a0: -X + 2.6, a1: -X + 3.45, h: 2.05 }] : [], 'partition', fl);
    if (fl) cut('plaster', PX + pt, X, PH - pt, PH + pt, y0, y1, [{ a0: PX + .6, a1: PX + 1.5, h: 2.05 }], 'partition', fl); }
  // the front door's leaf, hung open inside against the hall's west side; the back door's against the kitchen's back wall
  { const fx0 = fd.x - fd.w / 2, bx0 = -bd.x - bd.w / 2; bx('paint', fx0, fx0 + .06, F0, F0 + fd.h - fd.w / 2, Z - fd.w + .05, Z - .02, 'leaf', 0) /* Session 1396: the leaf to the fanlight's spring, 2.2 m */; bx('paint', bx0, bx0 + .06, F0, F0 + bd.h - .05, -Z + .02, -Z + bd.w - .02, 'leaf', 0); }
  // ── the floors: the hall and the kitchen flagged, the parlour boarded; the upper floors boarded on joists with the plaster ceiling under,
  // open over the stair's well; the top ceiling under the roof
  const slabs = []; { const flag = (x0, x1, z0, z1) => { for (let z = z0; z < z1 - .05;) { const d = Math.min(z1 - z, .5 + r() * .3); for (let x = x0; x < x1 - .05;) { const w = Math.min(x1 - x, .55 + r() * .4); put(new THREE.BoxGeometry(w - .02, F0, d - .02), 'flag', x + w / 2, F0 / 2 + (r() - .5) * .004, z + d / 2, 0, .7); x += w; } z += d; } };
    flag(PX + pt, X, -Z, Z); flag(-X, PX - pt, -Z, PZ - pt); bx('deal', -X, PX - pt, 0, F0, PZ + pt, Z);
    for (const [fl, y] of [[1, F1], [2, F2]]) { for (const [x0, x1, z0, z1] of [[-X, W0, -Z, Z], [W0, X, WZ[1], Z]]) { bx('deal', x0, x1, y - .04, y, z0, z1); bx('oak', x0, x1, y - SL + .03, y - .04, z0, z1); bx('plaster', x0, x1, y - SL, y - SL + .03, z0, z1); slabs.push({ x0, x1, z0, z1, y0: y - SL, y1: y, fl }); }
      bx('oak', W0, X, y - SL, y, WZ[1] - .06, WZ[1]) /* the trimmer at the landing's edge */; }
    bx('plaster', -X, X, CE[2], CE[2] + .04, -Z, Z); slabs.push({ x0: -X, x1: X, z0: -Z, z1: Z, y0: CE[2], y1: CE[2] + .04, fl: 3 });
    for (let fl = 0; fl < 3; fl++) for (const s of [-1, 1]) bx('oak', -X, X, floors[fl], floors[fl] + .12, s > 0 ? Z - .02 : -Z, s > 0 ? Z : -Z + .02); }
  // ── the stair: two flights a storey, 8 risers each, the half-landing against the back wall; flight A up the east wall to the back,
  // flight B back to the front along the partition, arriving on the landing at the well's front edge; then C and D over them
  const steps = [], landings = [], LZ = -Z + LD; let rail = [];
  for (let fl = 0; fl < 2; fl++) { const y0 = floors[fl], ri = (floors[fl + 1] - y0) / 16, yL = y0 + 8 * ri;
    for (let i = 1; i <= 7; i++) { const y = y0 + i * ri, z1 = WZ[1] - (i - 1) * G, z0 = z1 - G; bx('oak', SX, X, Math.max(y - ri - .06, y0), y, z0, z1); steps.push({ x0: SX, x1: X, z0, z1, y, fl, flight: fl ? 'C' : 'A' }); }
    bx('oak', W0, X, yL - .2, yL, -Z, LZ); landings.push({ x0: W0, x1: X, z0: -Z, z1: LZ, y: yL, fl });
    for (let i = 1; i <= 7; i++) { const y = yL + i * ri, z0 = LZ + (i - 1) * G, z1 = z0 + G; bx('oak', W0, PX + 1.0, y - ri - .06, y, z0, z1); steps.push({ x0: W0, x1: PX + 1.0, z0, z1, y, fl, flight: fl ? 'D' : 'B' }); }
    // the handrail and balusters between the two flights, on their newels
    for (const [zA, yA, zB, yB] of [[WZ[1], y0, LZ, yL], [LZ, yL, WZ[1], floors[fl + 1]]]) { const k8 = 8; for (let k = 0; k <= k8; k++) { const z = zA + (zB - zA) * k / k8, y = yA + (yB - yA) * k / k8; bx('oak', PX + 1.01, PX + 1.04, y, y + .9, z - .015, z + .015); }
      const L = Math.hypot(zB - zA, yB - yA), q = new THREE.BoxGeometry(.06, .06, L); q.rotateX(Math.atan2(yB - yA, zA - zB)); put(q, 'oak', PX + 1.025, (yA + yB) / 2 + .92, (zA + zB) / 2); }
    for (const [z, y] of [[WZ[1], y0], [LZ, yL], [WZ[1], floors[fl + 1]]]) bx('oak', PX + .99, PX + 1.06, y, y + 1.05, z - .035, z + .035); }
  // the rail round the top of the well on the second floor
  { const y = F2; for (let x = SX; x <= X - .05; x += .12) bx('oak', x - .015, x + .015, y, y + .9, WZ[1] + .02, WZ[1] + .05); bx('oak', PX + 1.0, X, y + .9, y + .96, WZ[1], WZ[1] + .07); rail = [{ x0: PX + 1.0, x1: X, z: WZ[1], y: y + .96 }]; }
  // ── fireplaces on the west gable (x = -X): a breast 0.35 m proud, an opening, a surround, a mantel; a grate of coals or the kitchen's range
  const fires = []; const fireplace = (fl, z, w, range) => { const y0 = floors[fl], y1 = CE[fl], D = range ? .55 : .35, oh = range ? 1.2 : .9, ow = range ? 1.5 : .8, x1 = -X + D;
    bx('plaster', -X, x1, y0 + oh, y1, z - w / 2, z + w / 2); bx('plaster', -X, x1, y0, y0 + oh, z - w / 2, z - ow / 2); bx('plaster', -X, x1, y0, y0 + oh, z + ow / 2, z + w / 2); boxes.push({ tag: 'breast', x0: -X, x1, y0, y1, z0: z - w / 2, z1: z + w / 2, fl });
    bx('soot', -X, -X + .02, y0, y0 + oh, z - ow / 2, z + ow / 2); bx('soot', -X, x1, y0 + oh - .02, y0 + oh, z - ow / 2, z + ow / 2);
    if (range) { bx('oak', x1 - .05, x1 + .06, y0 + oh, y0 + oh + .25, z - ow / 2 - .2, z + ow / 2 + .2); bx('flag', x1, x1 + .7, y0, y0 + .03, z - ow / 2, z + ow / 2);
      const cx = -X + .1, cz = z - ow / 2 + .1; bx('iron', cx - .02, cx + .02, y0 + .2, y0 + 1.1, cz - .02, cz + .02); put(new THREE.BoxGeometry(.03, .03, .8), 'iron', cx + .02, y0 + 1.0, cz + .4); put(new THREE.CylinderGeometry(.008, .008, .4, 4), 'iron', cx + .02, y0 + .8, cz + .65);
      put(new THREE.SphereGeometry(.17, 12, 8, 0, Math.PI * 2, .35, Math.PI - .35), 'iron', cx + .2, y0 + .5, cz + .65); }
    else { for (const s of [-1, 1]) bx('dress', x1, x1 + .05, y0, y0 + oh + .2, z + s * ow / 2 + (s > 0 ? 0 : -.2), z + s * ow / 2 + (s > 0 ? .2 : 0)); bx('dress', x1, x1 + .05, y0 + oh, y0 + oh + .2, z - ow / 2, z + ow / 2);
      bx('dress', x1, x1 + .22, y0 + oh + .2, y0 + oh + .25, z - ow / 2 - .3, z + ow / 2 + .3); bx('dress', x1, x1 + .45, y0, y0 + .03, z - ow / 2 - .1, z + ow / 2 + .1);
      bx('iron', -X + .08, -X + .28, y0 + .1, y0 + .13, z - .25, z + .25); for (const zz of [z - .25, z + .25]) bx('iron', -X + .08, -X + .3, y0, y0 + .32, zz - .015, zz + .015); for (let k = -3; k <= 3; k++) bx('iron', -X + .28, -X + .3, y0 + .13, y0 + .32, z + k * .07 - .008, z + k * .07 + .008); }
    for (let k = 0; k < (range ? 10 : 7); k++) put(new THREE.BoxGeometry(.09, .05, .07), 'ember', -X + .12 + r() * (range ? .3 : .14), y0 + (range ? .05 : .15) + r() * .05, z + (r() - .5) * (range ? .8 : .4), r() * 3);
    put(new THREE.SphereGeometry(.05, 6, 4).scale(1, 2.2, 1), 'flame', -X + .2, y0 + (range ? .2 : .3), z - .05); put(new THREE.SphereGeometry(.04, 6, 4).scale(1, 2, 1), 'flame', -X + .22, y0 + (range ? .18 : .28), z + .1);
    fires.push([-X + .25, y0 + .3, z, fl]); return { x1, z, y: y0 + oh }; };
  // the top floor: the gables' stacks come down inside the walls to 0.6 m under the wall head, so their breasts stand floor to ceiling here
  const stackZ = (.4 + .36 * 4) / 2 + .04; for (const s of [-1, 1]) { const x0 = s < 0 ? -X : X - .32, x1 = s < 0 ? -X + .32 : X; bx('plaster', x0, x1, F2, CE[2], -stackZ, stackZ, 'breast', 2); }
  // ── furniture kit
  const chair = (fl, x, z, face, key = 'oak', arms = false) => { const y0 = floors[fl], c = { x0: x - .23, x1: x + .23, z0: z - .23, z1: z + .23, y: y0 + .44 }; bx(key, c.x0, c.x1, c.y - .04, c.y, c.z0, c.z1, 'chair', fl);
    for (const dx of [-.19, .19]) for (const dz of [-.19, .19]) bx(key, x + dx - .02, x + dx + .02, y0, c.y - .04, z + dz - .02, z + dz + .02);
    const bxs = face === 'x+' ? x - .21 : face === 'x-' ? x + .21 : null, bzs = face === 'z+' ? z - .21 : face === 'z-' ? z + .21 : null;
    if (bxs != null) { for (const dz of [-.19, .19]) bx(key, bxs - .02, bxs + .02, c.y, y0 + 1.0, z + dz - .02, z + dz + .02); bx(key, bxs - .02, bxs + .02, y0 + .78, y0 + .96, z - .19, z + .19); }
    else { for (const dx of [-.19, .19]) bx(key, x + dx - .02, x + dx + .02, c.y, y0 + 1.0, bzs - .02, bzs + .02); bx(key, x - .19, x + .19, y0 + .78, y0 + .96, bzs - .02, bzs + .02); }
    if (arms) { bx('wool', c.x0 + .03, c.x1 - .03, c.y, c.y + .06, c.z0 + .03, c.z1 - .03); for (const s of [-1, 1]) (bxs != null ? bx(key, x - .2, x + .2, y0 + .62, y0 + .66, z + s * .21 - .025, z + s * .21 + .025) : bx(key, x + s * .21 - .025, x + s * .21 + .025, y0 + .62, y0 + .66, z - .2, z + .2)); }
    return c; };
  const table = (fl, x0, x1, z0, z1, h = .75, key = 'oak', tag = 'table') => { const y0 = floors[fl], y = y0 + h; bx(key, x0, x1, y - .04, y, z0, z1, tag, fl);
    for (const xx of [x0 + .06, x1 - .06]) for (const zz of [z0 + .06, z1 - .06]) bx(key, xx - .03, xx + .03, y0, y - .04, zz - .03, zz + .03); bx(key, x0 + .05, x1 - .05, y - .13, y - .04, z0 + .05, z0 + .07); bx(key, x0 + .05, x1 - .05, y - .13, y - .04, z1 - .07, z1 - .05); return { x0, x1, z0, z1, y }; };
  const press = (fl, x0, x1, z0, z1, h, key, tag, shelves, ware) => { const y0 = floors[fl]; bx(key, x0, x1, y0, y0 + h, z0, z1, tag, fl); bx(key, Math.max(x0 - .03, -X), Math.min(x1 + .03, X), y0 + h, y0 + h + .06, Math.max(z0 - .03, -Z), Math.min(z1 + .03, Z)) /* the cornice, stopped at a wall */;
    if (shelves) for (let k = 0; k < shelves; k++) { /* an open dresser against a wall at z1: its shelves over the low cupboard, plates standing on them */ const yy = y0 + h + .4 + k * .36;
      bx('oak', x0, x1, yy - .02, yy, z1 - .25, z1); for (let x = x0 + .12; x < x1 - .1; x += .2 + r() * .06) { const pr = .09 + r() * .03; put(new THREE.CylinderGeometry(pr, pr, .015, 14), ware, x, yy + pr, z1 - .1, 0, .6, Math.PI / 2, 0); } }
    if (shelves) for (const xx of [x0, x1 - .03]) bx('oak', xx, xx + .03, y0 + h, y0 + h + .4 + shelves * .36, z1 - .25, z1); };
  const rug = (fl, x0, x1, z0, z1) => bx('rug', x0, x1, floors[fl], floors[fl] + .01, z0, z1);
  const lamp = (fl, x, z, drop = .6) => { const y = CE[fl] - drop; bx('iron', x - .005, x + .005, y + .1, CE[fl], z - .005, z + .005); put(new THREE.CylinderGeometry(.13, .08, .08, 10), 'brass', x, y, z); put(new THREE.SphereGeometry(.06, 8, 6).scale(1, .5, 1), 'glow', x, y + .05, z); return [x, y, z, fl]; };
  const candle = (x, y, z) => { put(new THREE.CylinderGeometry(.04, .05, .02, 10), 'brass', x, y + .01, z); put(new THREE.CylinderGeometry(.016, .018, .15, 8), 'wax', x, y + .095, z); put(new THREE.SphereGeometry(.011, 5, 4).scale(1, 2.2, 1), 'flame', x, y + .185, z); return [x, y + .2, z]; };
  const lamps = [], candles = [];
  const zR = Math.max(Math.min(-Z + 2.05, kz1 - 1.35), -Z + 1.7) /* the range's middle: 2.05 m off the back wall as drawn, short of the dresser */;
  const parlourFire = fireplace(0, cF, 1.5), range = fireplace(0, zR, 2.1, true), drawFire = fireplace(1, cF, 1.6), dineFire = fireplace(1, cB, 1.5);
  // ground: the hall (a hall table and a mirror between the two doors where they leave room), the parlour (two chairs at the fire, a round
  // table, a press of good delft), the kitchen (the range, a dresser of plates, the table and two stools, the back door)
  { const hz1 = pdc - .65, hz0 = Math.max(hz1 - .8, ka1 + .15); if (hz1 - hz0 >= .5) { table(0, PX + pt, PX + pt + .4, hz0, hz1, .8, 'oak', 'halltable'); bx('oak', PX + pt, PX + pt + .02, F0 + 1.3, F0 + 2.0, hz0 + .1, hz1 - .1);
    bx('delft', PX + pt + .02, PX + pt + .03, F0 + 1.35, F0 + 1.95, hz0 + .15, hz1 - .15) /* the hall glass */; candles.push(candle(PX + pt + .2, F0 + .8, (hz0 + hz1) / 2)); } }
  lamps.push(lamp(0, PX + 1.0, Z - 1.45, .5));
  rug(0, -X + .75, -X + 2.55, Math.max(fz0 + .1, cF - 1.3), Math.min(Z - .1, cF + 1.2)); chair(0, -X + .9, cF - .95, 'z+', 'oak', true); chair(0, -X + .9, cF + 1.0, 'z-', 'oak', true);
  { const g2 = new THREE.CylinderGeometry(.42, .42, .04, 20), x = -X + 2.2; put(g2, 'oak', x, F0 + .72, cF); bx('oak', x - .05, x + .05, F0, F0 + .7, cF - .05, cF + .05); boxes.push({ tag: 'roundtable', x0: x - .42, x1: x + .42, y0: F0, y1: F0 + .74, z0: cF - .42, z1: cF + .42, fl: 0 }); candles.push(candle(x, F0 + .74, cF)); }
  { const x0 = n ? -X + 1.25 : -X + 1.05; press(0, x0, x0 + 1.6, fz0, fz0 + .42, 1.9, 'paint', 'press', 0); }
  if (wide > 1.5) press(0, -X + 3.55, -X + 4.75, fz0, fz0 + .36, 2.0, 'oak', 'press', 0) /* four and five bays: a bookcase on the cross wall */;
  if (wide > 3.5) press(0, -X + 5.3, -X + 6.5, fz0, fz0 + .4, 1.9, 'paint', 'press', 0) /* and a china press */;
  press(0, -X + .85, -X + 2.55, kz1 - .45, kz1, 1.0, 'oak', 'dresser', 3, 'delft'); bx('oak', -X + .85, -X + 2.55, F0 + 1.0, F0 + 2.1, kz1 - .03, kz1) /* the dresser's back */;
  table(0, -X + 2.0, -X + 3.2, -Z + .6, -Z + 1.5, .76, 'deal'); for (const x of [-X + 2.3, -X + 2.9]) { const z = -Z + 1.8, s2 = { x0: x - .17, x1: x + .17, z0: z - .17, z1: z + .17 }; bx('deal', s2.x0, s2.x1, F0 + .41, F0 + .45, s2.z0, s2.z1, 'stool', 0); for (const ddx of [-.13, .13]) for (const dz of [-.13, .13]) bx('deal', x + ddx - .02, x + ddx + .02, F0, F0 + .41, z + dz - .02, z + dz + .02); }
  put(new THREE.CylinderGeometry(.12, .1, .2, 12), 'crock', -X + 2.55, F0 + .86, -Z + 1.05); put(new THREE.SphereGeometry(.09, 10, 6).scale(1.3, .7, 1), 'straw', -X + 2.9, F0 + .8, -Z + .95) /* a loaf */; lamps.push(lamp(0, -X + 1.85, -Z + 2.45, .6));
  if (wide > 1.5) { bx('oak', -X + 3.6, -X + 4.6, F0, F0 + .8, -Z + .05, -Z + .6, 'mealchest', 0); bx('oak', -X + 3.58, -X + 4.62, F0 + .8, F0 + .84, -Z + .03, -Z + .62); }
  if (wide > 3.5) { const x0 = -X + 5.6, x1 = -X + 7.0, z0 = -Z + .05, z1 = -Z + .55; bx('oak', x0, x1, F0 + .41, F0 + .45, z0, z1, 'settle', 0); bx('oak', x0, x1, F0, F0 + 1.4, z0, z0 + .05); for (const x of [x0, x1 - .05]) bx('oak', x, x + .05, F0, F0 + .7, z0, z1); }
  // first floor: the drawing room (the fire with a mirror over it, two armchairs, a settee on the cross wall, a round table, a rug) and
  // the dining room behind (the table and four chairs, a sideboard on the back wall)
  rug(1, -X + .65, -X + 3.35, Math.max(fz0 + .1, cF - 1.3), Math.min(Z - .1, cF + 1.3)); chair(1, -X + .9, cF - .95, 'z+', 'oak', true); chair(1, -X + .9, cF + 1.0, 'z-', 'oak', true); bx('oak', -X + .35, -X + .37, drawFire.y + .3, drawFire.y + 1.2, cF - .5, cF + .5); bx('delft', -X + .37, -X + .38, drawFire.y + .36, drawFire.y + 1.14, cF - .44, cF + .44) /* the looking glass over the mantel */;
  const FD = Z - fz0, sx1 = PX - pt - .05, sx0 = Math.max(-X + 2.3, sx1 - 1.55), settee = FD >= 3.1 /* under 7.8 m deep the front room has no room for it */;
  if (settee) { const y0 = F1, x1 = sx1, x0 = sx0, z0 = fz0, z1 = fz0 + .7; bx('wool', x0, x1, y0 + .2, y0 + .45, z0, z1, 'settee', 1); bx('wool', x0, x1, y0 + .45, y0 + .95, z0, z0 + .16); for (const xx of [x0, x1 - .12]) bx('wool', xx, xx + .12, y0 + .45, y0 + .7, z0, z1); for (const xx of [x0 + .05, x1 - .05]) for (const zz of [z0 + .05, z1 - .05]) bx('oak', xx - .025, xx + .025, y0, y0 + .2, zz - .025, zz + .025); }
  { const tr = settee ? .45 : .42, g2 = new THREE.CylinderGeometry(tr, tr, .04, 20), x = -X + 2.2; put(g2, 'oak', x, F1 + .72, cF); bx('oak', x - .05, x + .05, F1, F1 + .7, cF - .05, cF + .05); boxes.push({ tag: 'roundtable', x0: x - tr, x1: x + tr, y0: F1, y1: F1 + .74, z0: cF - tr, z1: cF + tr, fl: 1 }); candles.push(candle(x, F1 + .74, cF)); }
  if (wide > 1.5 && PH >= PZ + .1) { const b1 = settee ? sx0 - .15 : -X + 4.75; press(1, b1 - 1.2, b1, fz0, fz0 + .36, 2.0, 'oak', 'press', 0); } /* a bookcase beside the settee */
  lamps.push(lamp(1, -X + 2.15, cF + .1, .55));
  { const DL = Math.min(1.7, kz1 + Z - 2.0); table(1, -X + 1.2, -X + 2.6, cB - DL / 2, cB + DL / 2, .75); for (const [x, z, f] of [[-X + 1.6, cB + DL / 2 + .3, 'z-'], [-X + 2.2, cB + DL / 2 + .3, 'z-'], [-X + 1.6, cB - DL / 2 - .3, 'z+'], [-X + 2.2, cB - DL / 2 - .3, 'z+']]) chair(1, x, z, f); }
  press(1, -X + .1, -X + .85, -Z, -Z + .5, .9, 'oak', 'sideboard', 0); put(new THREE.CylinderGeometry(.07, .09, .26, 12), 'delft', -X + .45, F1 + 1.05, -Z + .25); candles.push(candle(-X + 1.9, F1 + .75, cB)); lamps.push(lamp(1, -X + 1.9, cB, .6));
  // second floor: the bedroom (a bed with its curtains, a washstand, a chest at its foot) and the children's room (bunk beds, a toy chest,
  // a small table and stool, a hoop and stick, a ball, a doll on the lower bunk)
  { const y0 = F2, x0 = -X + .9, x1 = -X + 2.4, z0 = fz0, z1 = fz0 + 2.0, y = y0 + .6; bx('oak', x0, x1, y0 + .25, y - .2, z0, z1, 'bed', 2); bx('linen', x0 + .03, x1 - .03, y - .2, y, z0 + .05, z1 - .03); bx('wool', x0 + .02, x1 - .02, y - .1, y + .03, z0 + .7, z1 - .02);
    for (const xx of [x0 + .04, x1 - .04]) for (const zz of [z0 + .04, z1 - .04]) bx('oak', xx - .04, xx + .04, y0, y0 + 1.95, zz - .04, zz + .04); bx('oak', x0, x1, y0 + 1.9, y0 + 2.0, z0, z0 + .06); bx('oak', x0, x1, y0 + 1.9, y0 + 2.0, z1 - .06, z1);
    for (const xx of [x0, x1 - .06]) bx('oak', xx, xx + .06, y0 + 1.9, y0 + 2.0, z0, z1); for (const xx of [x0 - .01, x1 - .01]) bx('wool', xx, xx + .02, y0 + .9, y0 + 1.88, z0 + .1, z0 + .55); bx('oak', x0 + .1, x1 - .1, y0 + .6, y0 + 1.15, z0, z0 + .05) /* the headboard */;
    bx('oak', x0 + .15, x1 - .15, y0, y0 + .45, z1 + .05, z1 + .5, 'chest', 2); }
  table(2, -X + .05, -X + .5, Z - .85, Z - .25, .8, 'oak', 'washstand'); put(new THREE.CylinderGeometry(.18, .12, .1, 14), 'delft', -X + .28, F2 + .85, Z - .55); put(new THREE.CylinderGeometry(.06, .08, .24, 12), 'delft', -X + .33, F2 + .92, Z - .8); lamps.push(lamp(2, PX - .5, cF + .1, .3));
  if (wide > 1.5) press(2, -X + 3.55, -X + 4.75, fz0, fz0 + .6, 2.0, 'oak', 'clothespress', 0) /* four and five bays: a clothes press */;
  const bunkX = -Z + 2.05 > -stackZ - .02 ? -X + .35 : -X /* in a shallow house the bunks stand clear of the stack's breast */;
  { const y0 = F2, x0 = bunkX, x1 = bunkX + .95, z0 = -Z + .05, z1 = -Z + 2.05; for (const yy of [y0 + .35, y0 + 1.45]) { bx('oak', x0, x1, yy - .12, yy - .06, z0, z1); bx('linen', x0 + .03, x1 - .03, yy - .06, yy + .05, z0 + .03, z1 - .03); bx('wool', x0 + .04, x1 - .04, yy + .02, yy + .07, z0 + .55, z1 - .04); }
    boxes.push({ tag: 'bunks', x0, x1, y0, y1: y0 + 1.9, z0, z1, fl: 2 }); for (const xx of [x0 + .04, x1 - .04]) for (const zz of [z0 + .04, z1 - .04]) bx('oak', xx - .04, xx + .04, y0, y0 + 1.9, zz - .04, zz + .04); bx('oak', x0, x1, y0 + 1.6, y0 + 1.66, z1 - .07, z1 - .02) /* the top bunk's rail */;
    for (let k = 1; k <= 4; k++) bx('oak', x1 - .05, x1 - .02, y0 + k * .35, y0 + k * .35 + .03, z1 - .5, z1 - .1); for (const zz of [z1 - .5, z1 - .1]) bx('oak', x1 - .05, x1 - .02, y0, y0 + 1.6, zz - .02, zz + .02) /* the ladder */;
    put(new THREE.CylinderGeometry(.06, .07, .2, 8), 'linen', x0 + .5, y0 + .5, z0 + .4); put(new THREE.SphereGeometry(.045, 8, 6), 'linen', x0 + .5, y0 + .64, z0 + .4) /* the doll */; }
  bx('paint', -X + 2.15, -X + 3.05, F2, F2 + .45, -Z + .05, -Z + .5, 'toychest', 2); put(new THREE.SphereGeometry(.09, 12, 8), 'rug', -X + 2.65, F2 + .09, -Z + 1.45) /* a ball */; put(new THREE.TorusGeometry(.32, .012, 6, 24), 'oak', -X + 3.1, F2 + .333, -Z + 2.05, 0, .6, 0, 0) /* the hoop */;
  table(2, -X + 1.6, -X + 2.3, -Z + 1.5, -Z + 2.2, .55, 'deal', 'smalltable'); { const x = -X + 1.95, z = -Z + 1.15; bx('deal', x - .14, x + .14, F2 + .3, F2 + .33, z - .14, z + .14, 'stool', 2); for (const ddx of [-.1, .1]) for (const dz of [-.1, .1]) bx('deal', x + ddx - .015, x + ddx + .015, F2, F2 + .3, z + dz - .015, z + dz + .015); }
  candles.push(candle(-X + 1.95, F2 + .55, -Z + 1.85)); lamps.push(lamp(2, -X + 1.85, -Z + 2.05, .3));
  // the windows are clear from inside
  { const Gl = glMats().glass, Lt = glMats().lit; shell.traverse(m => { if (m.isMesh && (m.material === Gl || m.material === Lt)) { m.material = roomMats().pane; m.name = 'pane'; } }); }
  const group = new THREE.Group(); let tris = 0; for (const [k, gs] of B) { const q = mergeGeometries(gs, false); gs.forEach(x => x.dispose()); const m = new THREE.Mesh(q, M[k]); m.name = k; m.castShadow = !['flame', 'ember', 'glow'].includes(k); m.receiveShadow = true; group.add(m); tris += q.attributes.position.count / 3; }
  const all = new THREE.Group(); all.add(shell, group);
  const windows = Object.entries(plan.open).flatMap(([f, os]) => (os || []).filter(q => q.kind === 'win').map(q => ({ face: f, x: f === 'front' ? q.x : -q.x, z: f === 'front' ? plan.d / 2 : -plan.d / 2, y: q.y, w: q.w, h: q.h })));
  // the seven walks: from the front door to the back door through the kitchen, to the parlour's chairs, to the stair's foot; from the top
  // of the stair to the drawing room's chairs and into the dining room, to the bed's side and into the children's room
  const bdx = -bd.x, top = [PX + .5, WZ[1] + .4], hd = [PX + 1.05, PH + .5], turn = PH >= PZ + .4 ? [[PX - .35, PH + .5]] : [] /* round the partition's end into the front room */;
  const zr = settee ? (fz0 + .7 + cF - .45) / 2 : fz0 + .55 /* to the double doors, between the settee and the round table */;
  const paths = [
    { fl: 0, pts: [[dx, Z - .3], [PX + .75, Math.max(kdc, WZ[1] + .2)], [PX + .45, kdc], [PX - .35, kdc], [PX - .35, kz1 - .75], [bdx, kz1 - .75], [bdx, -Z + .3]] },
    { fl: 0, pts: [[dx, Z - .3], [dx, pdc], [PX - .35, pdc], [-X + 2.95, cF + .77], [-X + 1.55, cF + .77]] }, { fl: 0, pts: [[dx, Z - .3], [dx + .2, WZ[1] + .25]] },
    { fl: 1, pts: [top, hd, ...turn, [-X + 2.95, cF + .77], [-X + 1.55, cF + .77]] },
    { fl: 1, pts: upOK ? [top, [PX + .45, kdc], [PX - .35, kdc], [-X + 1.55, kz1 - .35], [-X + 1.55, fz0 + .6]] : [top, hd, ...turn, [-X + 2.95, zr], [-X + 1.55, zr], [-X + 1.55, kz1 - .3]] },
    { fl: 2, pts: [top, hd, ...turn, [-X + 2.75, fz0 + 1.4]] },
    { fl: 2, pts: upOK ? [top, [PX + .45, kdc], [PX - .35, kdc], [bunkX + 1.25, kz1 - .45]] : [top, hd, ...turn, [-X + 3.025, fz0 + .8], [-X + 3.025, kz1 - .45], [bunkX + 1.25, kz1 - .45]] }];
  const rooms = { hall: { x0: PX + pt, x1: X, z0: WZ[1], z1: Z, fl: 0 }, parlour: { x0: -X, x1: PX - pt, z0: fz0, z1: Z, fl: 0 }, kitchen: { x0: -X, x1: PX - pt, z0: -Z, z1: kz1, fl: 0 },
    drawing: { x0: -X, x1: X, z0: fz0, z1: Z, fl: 1 }, dining: { x0: -X, x1: PX - pt, z0: -Z, z1: kz1, fl: 1 }, bedroom: { x0: -X, x1: X, z0: fz0, z1: Z, fl: 2 }, children: { x0: -X, x1: PX - pt, z0: -Z, z1: kz1, fl: 2 } };
  return { group: all, shell, room: group, tris: Math.round(tris), draws: group.children.length, shellTris: shell.userData.tris, shellCalls: shell.userData.calls, inner: { x0: -X, x1: X, z0: -Z, z1: Z }, floors, ceils: CE, eave: EAVE,
    door: { x: fd.x, z: plan.d / 2, w: fd.w, h: fd.h }, back: { x: bdx, z: -plan.d / 2, w: bd.w, h: bd.h }, part: { x: PX, z: PZ, h: PH, t: pt }, mid: { front: cF, back: cB }, upOK, kdoor: { z0: ka0, z1: ka1 }, settee, steps, landings, well: { x0: W0, x1: X, z0: WZ[0], z1: WZ[1] }, rail, slabs, fires, rooms, range, paths, boxes, lamps, candles, windows, w: plan.w, d: plan.d, bays: plan.bays || 0 };
}

// ── the Gatelands farmhouse as a room (rooms.js's Session 1192, Michael's A on #303; OG-115's "farmstead"; card F9), copied in Session
// 1459 with the inn's renames (mats() → roomMats(), GL_PLANS → PLANS, gatelandsBuilding → building). Inside PLANS.farmhouse (10.5 by 6.2
// m, two storeys): the hall to a straight stair of 16 risers; the kitchen east of it round the open hearth under the east stack (the
// crane and pot, the dresser of delft, the settle bed, the table and its form, the churn, the spinning wheel, the bacon), the parlour west
// (the grate, the press, the clock, the round table); upstairs the landing, the parents' room west (their bed, the cradle) and the
// children's east (two beds). The game hangs it inside a village farm's house (83-world-generator.js's buildKitFarmhouse). ──
function farmhouseRoom(o = {}, r = stream('farmhouse')) {
  const plan = PLANS.farmhouse({ paint: o.paint || 'green' }); plan.interior = true; plan.r = stream('farmhouse-shell'); plan.open.front[0].ajar = true;
  const shell = building(plan), M = { ...roomMats(), dress: glMats().dress, rug: mat('plaster', { ns: .3, color: 0x5a3a5a, rough: 1 }), wax: new THREE.MeshStandardMaterial({ color: 0xeee2c4, roughness: .6 }),
    bacon: new THREE.MeshStandardMaterial({ color: 0x7a4a32, roughness: .6 }) }, B = new Map(), boxes = [];
  const t = plan.t, X = plan.w / 2 - t, Z = plan.d / 2 - t, F0 = .03, F1 = plan.floors[0], EAVE = plan.floors[0] + plan.floors[1], SL = .2 /* boards and joists */;
  const CE = [F1 - SL, EAVE - .15], floors = [F0, F1];
  const put = (geo, key, x = 0, y = 0, z = 0, ry = 0, uv = .6, rx = 0, rz = 0) => { const q = geo.index ? geo.toNonIndexed() : geo; for (const k of Object.keys(q.attributes)) if (!['position', 'normal'].includes(k)) q.deleteAttribute(k);
    q.applyMatrix4(new THREE.Matrix4().compose(new THREE.Vector3(x, y, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(rx, ry, rz)), new THREE.Vector3(1, 1, 1))); worldUV(q, uv); if (!B.has(key)) B.set(key, []); B.get(key).push(q); return q; };
  const bx = (key, x0, x1, y0, y1, z0, z1, tag, fl) => { put(new THREE.BoxGeometry(x1 - x0, y1 - y0, z1 - z0), key, (x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2); if (tag) boxes.push({ tag, x0, x1, y0, y1, z0, z1, fl }); };
  // ── the plan: two partitions of lime-plastered studding at x = ±0.9 make the hall; doors from it to the parlour (in front of the
  // stair's foot) and to the kitchen; upstairs a door off the landing's back to each room
  const PX = .9, pt = .05, H0 = PX - pt /* the hall's half width */;
  const wall = (x, y0, y1, doors, fl) => { let a = -Z; for (const d of [...doors].sort((p, q) => p.z0 - q.z0)) { if (d.z0 > a) bx('lime', x - pt, x + pt, y0, y1, a, d.z0, 'partition', fl); bx('lime', x - pt, x + pt, y0 + d.h, y1, d.z0, d.z1);
    for (const e of [d.z0, d.z1]) bx('oak', x - pt - .01, x + pt + .01, y0, y0 + d.h + .06, e - (e === d.z0 ? .06 : 0), e + (e === d.z1 ? .06 : 0)); bx('oak', x - pt - .01, x + pt + .01, y0 + d.h, y0 + d.h + .06, d.z0, d.z1); a = d.z1; }
    if (Z > a) bx('lime', x - pt, x + pt, y0, y1, a, Z, 'partition', fl); };
  const dParl = { z0: 1.6, z1: 2.4, h: 2.05 }, dKit = { z0: -.4, z1: .4, h: 2.05 }, dUp = { z0: -2.45, z1: -1.65, h: 2.0 };
  wall(-PX, F0, CE[0], [dParl], 0); wall(PX, F0, CE[0], [dKit], 0); wall(-PX, F1, CE[1], [dUp], 1); wall(PX, F1, CE[1], [dUp], 1);
  // the front door's leaf, hung open against the hall's east partition
  { const fd = plan.open.front[0]; bx('paint', H0 - .06, H0, F0, F0 + fd.h - .45, Z - fd.w - .02, Z - .02, 'leaf', 0); }
  // ── the stair: 16 risers up the hall's west side from the front to the landing at the back, on goings of 0.21 m
  const SX0 = -H0, SX1 = -.02, SF = 1.5, G = .21, ri = (F1 - F0) / 16, steps = [];
  for (let i = 1; i <= 15; i++) { const y = F0 + i * ri, z1 = SF - (i - 1) * G, z0 = z1 - G; bx('oak', SX0, SX1, Math.max(y - ri - .06, F0), y, z0, z1); steps.push({ x0: SX0, x1: SX1, z0, z1, y, fl: 0 }); }
  const kHead = Math.floor((CE[0] - 2.0 - F0) / ri) /* the last tread with 2 m under the floor over it */, well = { x0: SX0, x1: 0, z0: SF - 15 * G, z1: SF - kHead * G };
  // the string along the hall's side of the stair, a handrail on newels, and the rail round the well upstairs
  { const L = Math.hypot(15 * G, F1 - F0), a = Math.atan2(F1 - F0, 15 * G), q = new THREE.BoxGeometry(.05, .28, L); q.rotateX(a); put(q, 'oak', SX1 + .025, (F0 + F1) / 2 + .14, SF - 7.5 * G);
    const q2 = new THREE.BoxGeometry(.06, .06, L + .2); q2.rotateX(a); put(q2, 'oak', SX1 + .02, (F0 + F1) / 2 + .9, SF - 7.5 * G); bx('oak', SX1 - .02, SX1 + .06, F0, F0 + 1.05, SF - .08, SF);
    for (let k = 1; k <= 15; k += 1) { const z = SF - (k - .5) * G, y = F0 + k * ri; bx('oak', SX1 + .005, SX1 + .035, y, y + .88 + (F1 - F0) / 15 * .5 * 0, z - .012, z + .012); } }
  const rail = []; { const y = F1; for (let z = well.z0 + .1; z <= well.z1; z += .12) bx('oak', .005, .035, y, y + .9, z - .012, z + .012); bx('oak', -.01, .05, y + .9, y + .96, well.z0, well.z1 + .03, 'wellrail', 1);
    for (let x = SX0 + .1; x < -.02; x += .12) bx('oak', x - .012, x + .012, y, y + .9, well.z1 + .005, well.z1 + .035); bx('oak', SX0, .05, y + .9, y + .96, well.z1, well.z1 + .06, 'wellrail', 1); bx('oak', -.03, .07, y, y + 1.05, well.z1 - .03, well.z1 + .07);
    rail.push({ x: 0, z0: well.z0, z1: well.z1, y: y + .96 }, { z: well.z1, x0: SX0, x1: 0, y: y + .96 }); }
  // ── the floors: the kitchen and the hall flagged, the parlour boarded; the upper floor of deal boards on oak joists, open over the
  // well; the parlour's ceiling plastered, the kitchen's and the hall's the boards and joists bare, the kitchen's beams under them;
  // a boarded ceiling upstairs under the slate
  const slabs = []; { const flag = (x0, x1, z0, z1) => { for (let z = z0; z < z1 - .05;) { const d = Math.min(z1 - z, .5 + r() * .35); for (let x = x0; x < x1 - .05;) { const w = Math.min(x1 - x, .55 + r() * .45); put(new THREE.BoxGeometry(w - .02, F0, d - .02), 'flag', x + w / 2, F0 / 2 + (r() - .5) * .004, z + d / 2, 0, .7); x += w; } z += d; } };
    flag(-H0, X, -Z, Z); bx('deal', -X, -PX - pt, 0, F0, -Z, Z);
    for (const [x0, x1, z0, z1] of [[-X, SX0, -Z, Z], [0, X, -Z, Z], [SX0, 0, -Z, well.z0], [SX0, 0, well.z1, Z]]) { bx('deal', x0, x1, F1 - .04, F1, z0, z1); slabs.push({ x0, x1, z0, z1, y0: F1 - SL, y1: F1, fl: 1 }); }
    for (let x = -X + .2; x < X; x += .4) { if (x > SX0 - .03 && x < .03) continue; const zs = x > SX0 && x < 0 ? [[-Z, well.z0], [well.z1, Z]] : [[-Z, Z]]; for (const [z0, z1] of zs) bx('oak', x - .04, x + .04, F1 - SL, F1 - .04, z0, z1); }
    for (const x of [SX0 - .03, .03]) bx('oak', x - .04, x + .04, F1 - SL, F1 - .04, -Z, Z) /* the trimmers each side of the well */;
    for (const z of [well.z0, well.z1]) bx('oak', SX0, 0, F1 - SL, F1 - .04, z - .04, z + .04);
    bx('lime', -X, -PX - pt, F1 - SL - .03, F1 - SL, -Z, Z) /* the parlour's plaster ceiling */;
    bx('deal', -X, X, CE[1], CE[1] + .04, -Z, Z); slabs.push({ x0: -X, x1: X, z0: -Z, z1: Z, y0: CE[1], y1: CE[1] + .04, fl: 2 }); for (let x = -X + .5; x < X - .2; x += 1.2) bx('oak', x - .06, x + .06, CE[1] - .14, CE[1], -Z, Z);
    for (let fl = 0; fl < 2; fl++) for (const s of [-1, 1]) bx('oak', -X, X, floors[fl], floors[fl] + .1, s > 0 ? Z - .02 : -Z, s > 0 ? Z : -Z + .02); }
  // the kitchen's beams, across the house under the joists, clear of the hearth's breast
  const beams = [1.45, 2.4, 3.35]; for (const x of beams) bx('oak', x - .1, x + .1, CE[0] - .22, CE[0], -Z, Z);
  // ── the fires, on the gables (s = -1 the west, +1 the east): a breast proud of the wall, the opening sooted. The kitchen's is the open
  // hearth (a turf fire on the flags, the crane and its pot, an oak lintel, the hearthstone before it); the others a grate of coals in a
  // painted surround with a mantel shelf
  const fires = [], gx = (s, a) => s * (X - a); const fireplace = (fl, s, z, w, open) => { const y0 = floors[fl], y1 = CE[fl], D = open ? .5 : .35, oh = open ? 1.3 : .9, ow = open ? 1.6 : .8, xa = gx(s, 0), xb = gx(s, D), lo = Math.min(xa, xb), hi = Math.max(xa, xb);
    bx('lime', lo, hi, y0 + oh, y1, z - w / 2, z + w / 2); bx('lime', lo, hi, y0, y0 + oh, z - w / 2, z - ow / 2); bx('lime', lo, hi, y0, y0 + oh, z + ow / 2, z + w / 2); boxes.push({ tag: 'breast', x0: lo, x1: hi, y0, y1, z0: z - w / 2, z1: z + w / 2, fl });
    const back = [Math.min(xa, gx(s, .02)), Math.max(xa, gx(s, .02))]; bx('soot', back[0], back[1], y0, y0 + oh, z - ow / 2, z + ow / 2); bx('soot', lo, hi, y0 + oh - .02, y0 + oh, z - ow / 2, z + ow / 2);
    const slab = (a0, a1) => [Math.min(gx(s, a0), gx(s, a1)), Math.max(gx(s, a0), gx(s, a1))];
    if (open) { bx('oak', ...slab(D - .3, D + .08), y0 + oh, y0 + oh + .24, z - ow / 2 - .25, z + ow / 2 + .25); bx('flag', ...slab(D, D + .8), y0, y0 + .03, z - ow / 2, z + ow / 2, 'hearthstone', fl);
      const fx = gx(s, .28); for (let i = 0; i < 7; i++) { const a = i / 7 * Math.PI * 2; put(new THREE.BoxGeometry(.24, .1, .12), 'turf', fx + Math.cos(a) * .15, y0 + .06 + (i % 2) * .08, z + Math.sin(a) * .22, a + 1.3); }
      put(new THREE.SphereGeometry(.16, 10, 6).scale(1.2, .4, 1.4), 'ember', fx, y0 + .08, z); for (let i = 0; i < 3; i++) put(new THREE.ConeGeometry(.07, .28 + i * .06, 7), 'flame', fx + (i - 1) * .04, y0 + .26, z + (i - 1) * .09);
      const cx = gx(s, .06), cz = z - ow / 2 + .08; bx('iron', cx - .02, cx + .02, y0 + .2, y0 + 1.15, cz - .02, cz + .02); put(new THREE.BoxGeometry(.03, .03, .75), 'iron', cx - s * .02, y0 + 1.05, cz + .37); put(new THREE.CylinderGeometry(.008, .008, .4, 4), 'iron', cx - s * .02, y0 + .85, cz + .62);
      put(new THREE.SphereGeometry(.17, 14, 10, 0, Math.PI * 2, .35, Math.PI - .35), 'iron', cx - s * .2, y0 + .55, cz + .62); put(new THREE.TorusGeometry(.13, .008, 4, 14, Math.PI).rotateY(Math.PI / 2), 'iron', cx - s * .2, y0 + .7, cz + .62);
      put(new THREE.CylinderGeometry(.11, .13, .18, 12), 'iron', gx(s, .2), y0 + .09, z + ow / 2 - .2) /* the kettle on the hearth's edge */; fires.push([fx, y0 + .3, z, fl]); return { x: gx(s, D), z, y: y0 + oh, stone: slab(D, D + .8) }; }
    for (const e of [-1, 1]) bx('paint', ...slab(D, D + .05), y0, y0 + oh + .2, e < 0 ? z - ow / 2 - .2 : z + ow / 2, e < 0 ? z - ow / 2 : z + ow / 2 + .2); bx('paint', ...slab(D, D + .05), y0 + oh, y0 + oh + .2, z - ow / 2, z + ow / 2);
    bx('paint', ...slab(D, D + .22), y0 + oh + .2, y0 + oh + .25, z - ow / 2 - .3, z + ow / 2 + .3); bx('flag', ...slab(D, D + .45), y0, y0 + .03, z - ow / 2 - .1, z + ow / 2 + .1);
    bx('iron', ...slab(.08, .28), y0 + .1, y0 + .13, z - .25, z + .25); for (const zz of [z - .25, z + .25]) bx('iron', ...slab(.08, .3), y0, y0 + .32, zz - .015, zz + .015); for (let k = -3; k <= 3; k++) bx('iron', ...slab(.28, .3), y0 + .13, y0 + .32, z + k * .07 - .008, z + k * .07 + .008);
    for (let k = 0; k < 7; k++) put(new THREE.BoxGeometry(.09, .05, .07), 'ember', gx(s, .12 + r() * .14), y0 + .15 + r() * .05, z + (r() - .5) * .4, r() * 3);
    put(new THREE.SphereGeometry(.05, 6, 4).scale(1, 2.2, 1), 'flame', gx(s, .2), y0 + .3, z - .05); fires.push([gx(s, .25), y0 + .3, z, fl]); return { x: gx(s, D), z, y: y0 + oh + .25 }; };
  const parlourFire = fireplace(0, -1, 0, 1.5), hearth = fireplace(0, 1, 0, 2.4, true), westFire = fireplace(1, -1, 0, 1.4), eastFire = fireplace(1, 1, 0, 1.4);
  // ── the furniture kit
  const chair = (fl, x, z, face, key = 'oak', sugan = false) => { const y0 = floors[fl], c = { x0: x - .22, x1: x + .22, z0: z - .22, z1: z + .22, y: y0 + .44 }; bx(sugan ? 'straw' : key, c.x0, c.x1, c.y - .04, c.y, c.z0, c.z1, 'chair', fl);
    for (const dx of [-.18, .18]) for (const dz of [-.18, .18]) bx(key, x + dx - .02, x + dx + .02, y0, c.y - .04, z + dz - .02, z + dz + .02);
    const bxs = face === 'x+' ? x - .2 : face === 'x-' ? x + .2 : null, bzs = face === 'z+' ? z - .2 : face === 'z-' ? z + .2 : null, top = y0 + (sugan ? .85 : 1.0);
    if (bxs != null) { for (const dz of [-.18, .18]) bx(key, bxs - .02, bxs + .02, c.y, top, z + dz - .02, z + dz + .02); for (const yy of sugan ? [.6, .78] : [.82]) bx(key, bxs - .015, bxs + .015, y0 + yy, y0 + yy + .05, z - .18, z + .18); }
    else { for (const dx of [-.18, .18]) bx(key, x + dx - .02, x + dx + .02, c.y, top, bzs - .02, bzs + .02); for (const yy of sugan ? [.6, .78] : [.82]) bx(key, x - .18, x + .18, y0 + yy, y0 + yy + .05, bzs - .015, bzs + .015); }
    return c; };
  const table = (fl, x0, x1, z0, z1, h = .76, key = 'deal', tag = 'table') => { const y0 = floors[fl], y = y0 + h; bx(key, x0, x1, y - .04, y, z0, z1, tag, fl);
    for (const xx of [x0 + .06, x1 - .06]) for (const zz of [z0 + .06, z1 - .06]) bx(key, xx - .03, xx + .03, y0, y - .04, zz - .03, zz + .03); bx(key, x0 + .05, x1 - .05, y - .13, y - .04, z0 + .05, z0 + .07); bx(key, x0 + .05, x1 - .05, y - .13, y - .04, z1 - .07, z1 - .05); return { x0, x1, z0, z1, y }; };
  const stool = (fl, x, z) => { const y0 = floors[fl]; bx('deal', x - .16, x + .16, y0 + .41, y0 + .45, z - .16, z + .16, 'stool', fl); for (const a of [0, 2.1, 4.2]) put(new THREE.CylinderGeometry(.018, .022, .41, 6), 'deal', x + Math.cos(a) * .1, y0 + .205, z + Math.sin(a) * .1); };
  const bed = (fl, x0, x1, z0, z1, along) => { const y0 = floors[fl], y = y0 + .6; bx('oak', x0, x1, y0 + .12, y - .18, z0, z1, 'bed', fl); bx('straw', x0 + .04, x1 - .04, y - .18, y - .06, z0 + .04, z1 - .04); bx('linen', x0 + .05, x1 - .05, y - .06, y, z0 + .05, z1 - .05);
    for (const xx of [x0 + .04, x1 - .04]) for (const zz of [z0 + .04, z1 - .04]) bx('oak', xx - .04, xx + .04, y0, y0 + .14, zz - .04, zz + .04);
    if (along === 'z-') { bx('oak', x0, x1, y0, y0 + 1.1, z0, z0 + .06); bx('wool', x0 + .03, x1 - .03, y - .04, y + .03, z0 + .6, z1 - .03); bx('linen', x0 + .12, x1 - .12, y, y + .1, z0 + .1, z0 + .45); bx('oak', x0, x1, y0, y0 + .75, z1 - .05, z1); }
    else { const hx = along === 'x-' ? x0 : x1 - .06, px = along === 'x-' ? [x0 + .1, x0 + .45] : [x1 - .45, x1 - .1], fx = along === 'x-' ? [x1 - .05, x1] : [x0, x0 + .05], wx = along === 'x-' ? [x0 + .6, x1 - .03] : [x0 + .03, x1 - .6];
      bx('oak', hx, hx + .06, y0, y0 + 1.0, z0, z1); bx('wool', wx[0], wx[1], y - .04, y + .03, z0 + .03, z1 - .03); bx('linen', px[0], px[1], y, y + .1, z0 + .12, z1 - .12); bx('oak', fx[0], fx[1], y0, y0 + .7, z0, z1); }
    return { x0, x1, z0, z1, y }; };
  const chest = (fl, x0, x1, z0, z1, h = .5, key = 'oak') => { const y0 = floors[fl]; bx(key, x0, x1, y0, y0 + h - .04, z0, z1, 'chest', fl); bx(key, x0 - .01, x1 + .01, y0 + h - .04, y0 + h, z0 - .01, z1 + .01); for (const e of [x0 + .12, x1 - .12]) bx('iron', e - .02, e + .02, y0 + .05, y0 + h, z0 - .015, z0); };
  const washstand = (fl, x, z) => { const y0 = floors[fl]; table(fl, x - .25, x + .25, z - .2, z + .2, .78, 'deal', 'washstand'); put(new THREE.CylinderGeometry(.16, .1, .08, 14), 'delft', x, y0 + .82, z); put(new THREE.CylinderGeometry(.06, .07, .22, 12), 'delft', x + .12, y0 + .89, z - .05); };
  const candle = (x, y, z) => { put(new THREE.CylinderGeometry(.04, .05, .02, 10), 'iron', x, y + .01, z); put(new THREE.CylinderGeometry(.016, .018, .15, 8), 'wax', x, y + .095, z); put(new THREE.SphereGeometry(.011, 5, 4).scale(1, 2.2, 1), 'flame', x, y + .185, z); return [x, y + .2, z]; };
  const lantern = (fl, x, z, y, top) => { bx('iron', x - .005, x + .005, y + .14, top, z - .005, z + .005); put(new THREE.CylinderGeometry(.08, .09, .22, 6), 'glow', x, y, z); put(new THREE.ConeGeometry(.1, .1, 6), 'iron', x, y + .16, z); put(new THREE.CylinderGeometry(.095, .095, .02, 6), 'iron', x, y - .12, z); return [x, y, z, fl]; };
  const lamps = [], candles = [];
  // ── the kitchen: the settle bed against the hall (a bench by day, its box a bed by night); the table under the front window with its
  // form; a stool and a súgán chair at the hearth; the dresser of delft on the back wall; the churn by the back door; the spinning wheel
  { const x0 = PX + pt, x1 = x0 + .6, z0 = .55, z1 = 2.5, y = F0 + .45; bx('deal', x0, x1, F0, y, z0, z1, 'settle', 0); bx('deal', x0, x0 + .07, y, F0 + 1.15, z0, z1); for (const z of [z0, z1 - .06]) bx('deal', x0, x1, y, F0 + .72, z, z + .06);
    bx('paint', x0 + .03, x1 - .01, y - .3, y - .27, z0 + .05, z1 - .05) /* the seam of the box's lid */; bx('wool', x0 + .09, x1 - .04, y, y + .03, z0 + .15, z0 + .7) /* a folded blanket */; }
  const kt = table(0, 2.4, 3.8, 1.85, 2.5, .76); { const z0 = 1.35, z1 = 1.62; bx('deal', 2.5, 3.7, F0 + .41, F0 + .45, z0, z1, 'bench', 0); for (const x of [2.62, 3.58]) bx('deal', x - .03, x + .03, F0, F0 + .41, z0 + .03, z1 - .03); }
  candles.push(candle(3.45, kt.y, 2.2)); put(new THREE.CylinderGeometry(.12, .1, .2, 12), 'crock', 2.75, kt.y + .1, 2.2); put(new THREE.SphereGeometry(.1, 10, 6).scale(1.4, .7, 1), 'straw', 3.1, kt.y + .06, 2.15) /* a soda loaf */;
  stool(0, 3.05, 1.05); chair(0, 3.05, -1.1, 'z+', 'oak', true);
  { const x0 = 3.0, x1 = 4.6, z0 = -Z, z1 = -Z + .46, h = .88; bx('paint', x0, x1, F0, F0 + h, z0, z1, 'dresser', 0); bx('deal', x0 - .02, x1 + .02, F0 + h, F0 + h + .04, z0, z1 + .03); bx('paint', x0, x1, F0 + h + .04, F0 + 2.1, z0, z0 + .04);
    for (const e of [x0, x1 - .05]) bx('paint', e, e + .05, F0 + h + .04, F0 + 2.1, z0, z0 + .3); bx('paint', x0 - .04, x1 + .04, F0 + 2.1, F0 + 2.2, z0, z0 + .34);
    for (let s = 0; s < 3; s++) { const y = F0 + 1.22 + s * .3; bx('paint', x0, x1, y - .02, y, z0, z0 + .26); for (let k = 0; k < 7; k++) { const px = x0 + .14 + k * .22, rp = .09 - (s ? .015 : 0);
      put(new THREE.CylinderGeometry(rp, rp, .012, 16), 'delft', px, y + rp + .005, z0 + .08, 0, .6, Math.PI / 2 - .2, 0); } }
    for (let k = 0; k < 3; k++) put(new THREE.CylinderGeometry(.06, .07, .2, 12), 'crock', x0 + .35 + k * .45, F0 + h + .14, z0 + .32); }
  { const x = 2.45, z = -2.22; put(new THREE.CylinderGeometry(.15, .19, .8, 14), 'oak', x, F0 + .4, z); for (const y of [.15, .65]) put(new THREE.TorusGeometry(.18 - y * .03, .012, 4, 16).rotateX(Math.PI / 2), 'iron', x, F0 + y, z);
    put(new THREE.CylinderGeometry(.012, .012, .5, 5), 'deal', x, F0 + .95, z); boxes.push({ tag: 'churn', x0: x - .19, x1: x + .19, y0: F0, y1: F0 + 1.2, z0: z - .19, z1: z + .19, fl: 0 }); }
  { const x = 2.2, z = .95, y0 = F0; const q = new THREE.BoxGeometry(.7, .06, .24); q.rotateZ(-.12); put(q, 'oak', x, y0 + .45, z); for (const [dx, dz] of [[-.3, -.08], [-.3, .08], [.3, 0]]) put(new THREE.CylinderGeometry(.02, .02, .48, 5), 'oak', x + dx, y0 + .22, z + dz);
    for (const dz of [-.07, .07]) bx('oak', x - .2, x - .17, y0 + .45, y0 + .95, z + dz - .015, z + dz + .015); const wh = new THREE.TorusGeometry(.26, .018, 5, 28); put(wh, 'oak', x - .185, y0 + .78, z, Math.PI / 2);
    for (let k = 0; k < 6; k++) { const q2 = new THREE.BoxGeometry(.015, .5, .015); q2.rotateZ(k / 6 * Math.PI); put(q2, 'oak', x - .185, y0 + .78, z, Math.PI / 2); } bx('oak', x + .2, x + .23, y0 + .45, y0 + .82, z - .015, z + .015);
    put(new THREE.CylinderGeometry(.03, .03, .16, 8), 'linen', x + .215, y0 + .86, z, 0, .6, 0, Math.PI / 2) /* the flyer's bobbin of wool */; boxes.push({ tag: 'wheel', x0: x - .45, x1: x + .4, y0, y1: y0 + 1.05, z0: z - .2, z1: z + .2, fl: 0 }); }
  for (const [z, L] of [[-1.85, .55], [-1.45, .5]]) { bx('iron', 3.35 - .005, 3.35 + .005, CE[0] - .38, CE[0] - .22, z - .005, z + .005); put(new THREE.BoxGeometry(.26, L, .07), 'bacon', 3.35, CE[0] - .38 - L / 2, z) /* a flitch of bacon in its salt */; }
  lamps.push(lantern(0, 2.4, .3, CE[0] - .58, CE[0] - .22));
  // ── the parlour: the two chairs at the grate, the round table with the lamp, the press of good delft, the clock, the rug; a side table
  // under the front window
  chair(0, -3.7, 1.05, 'z-', 'oak'); chair(0, -3.7, -1.05, 'z+', 'oak'); bx('rug', -4.0, -1.5, F0, F0 + .01, -1.5, 1.5);
  { const g2 = new THREE.CylinderGeometry(.42, .42, .04, 20); put(g2, 'oak', -2.3, F0 + .72, -.6); bx('oak', -2.35, -2.25, F0, F0 + .7, -.65, -.55); put(new THREE.CylinderGeometry(.22, .25, .03, 16), 'oak', -2.3, F0 + .015, -.6); boxes.push({ tag: 'roundtable', x0: -2.72, x1: -1.88, y0: F0, y1: F0 + .74, z0: -1.02, z1: -.18, fl: 0 }); candles.push(candle(-2.3, F0 + .74, -.6)); }
  { const x0 = -4.3, x1 = -3.0, z0 = -Z, z1 = -Z + .42, h = 1.9; bx('paint', x0, x1, F0, F0 + .85, z0, z1, 'press', 0); bx('paint', x0, x1, F0 + .85, F0 + h, z0, z0 + .32); bx('paint', x0 - .03, x1 + .03, F0 + h, F0 + h + .07, z0, z0 + .36);
    bx('delft', x0 + .06, x1 - .06, F0 + .95, F0 + h - .08, z0 + .3, z0 + .32) /* the glazed doors, delft behind them */; for (const y of [1.25, 1.6]) bx('paint', x0 + .03, x1 - .03, F0 + y, F0 + y + .02, z0, z0 + .3); }
  { const x0 = -1.5, x1 = -1.08, z0 = -Z, z1 = -Z + .32; bx('oak', x0, x1, F0, F0 + 2.05, z0, z1, 'clock', 0); bx('oak', x0 - .03, x1 + .03, F0 + 2.05, F0 + 2.12, z0, z1 + .03); put(new THREE.CylinderGeometry(.13, .13, .01, 20), 'linen', (x0 + x1) / 2, F0 + 1.75, z1 + .005, 0, .6, Math.PI / 2, 0); }
  { const s2 = table(0, -3.65, -2.55, 2.12, 2.55, .74, 'oak', 'sidetable'); put(new THREE.CylinderGeometry(.07, .09, .24, 12), 'delft', -3.1, s2.y + .12, 2.33); }
  // ── upstairs: the landing's chest under the middle window; the west room's bed and the cradle by its fire, the chest at the bed's foot,
  // the washstand; the east room's two beds, the chest under the back window, the washstand, a chair by the fire
  chest(1, -.4, .4, 2.05, 2.5, .55);
  const beds = [bed(1, -3.4, -2.0, -Z + .05, -.55, 'z-')]; chest(1, -3.2, -2.2, -.45, -.02); washstand(1, -3.1, 2.3); candles.push(candle(-3.25, F1 + .78, 2.32));
  { const x0 = -4.25, x1 = -3.65, z0 = -2.35, z1 = -1.6, y0 = F1; bx('oak', x0, x1, y0 + .12, y0 + .45, z0, z1, 'cradle', 1); bx('wool', x0 + .04, x1 - .04, y0 + .4, y0 + .43, z0 + .04, z1 - .2); bx('oak', x0, x1, y0 + .45, y0 + .7, z0, z0 + .04) /* its hood end */;
    for (const z of [z0 + .08, z1 - .08]) { const q = new THREE.TorusGeometry(.4, .02, 4, 12, .9); put(q, 'oak', (x0 + x1) / 2, y0 + .43, z, 0, .6, 0, Math.PI * 1.5 - .45); } }
  beds.push(bed(1, PX + pt + .02, PX + pt + 1.92, .05, 1.0, 'x-'), bed(1, PX + pt + .02, PX + pt + 1.92, 1.45, 2.4, 'x-')); chest(1, 1.1, 1.9, -Z + .05, -Z + .4, .5, 'paint'); washstand(1, 4.1, -2.2); chair(1, 3.8, 1.3, 'x+', 'oak', true);
  lamps.push(lantern(1, -.45, -.2, CE[1] - .45, CE[1])); candles.push(candle(4.22, F1 + .78, -2.12));
  // the windows are clear from inside
  { const Gl = glMats().glass, Lt = glMats().lit; shell.traverse(m => { if (m.isMesh && (m.material === Gl || m.material === Lt)) { m.material = roomMats().pane; m.name = 'pane'; } }); }
  const group = new THREE.Group(); let tris = 0; for (const [k, gs] of B) { const q = mergeGeometries(gs, false); gs.forEach(x => x.dispose()); const m = new THREE.Mesh(q, M[k]); m.name = k; m.castShadow = !['flame', 'ember', 'glow'].includes(k); m.receiveShadow = true; group.add(m); tris += q.attributes.position.count / 3; }
  const all = new THREE.Group(); all.add(shell, group);
  const windows = Object.entries(plan.open).flatMap(([f, os]) => (os || []).filter(q => q.kind === 'win').map(q => ({ face: f, x: f === 'front' ? q.x : -q.x, z: f === 'front' ? plan.d / 2 : -plan.d / 2, y: q.y, w: q.w, h: q.h })));
  const fd = plan.open.front[0], bd = plan.open.back[0], paths = [
    { fl: 0, pts: [[fd.x, Z - .3], [.45, 1.2], [.45, 0], [1.4, 0], [2.6, -.3], [hearth.stone[0] - .2, -.1]] }, { fl: 0, pts: [[fd.x, Z - .3], [0, 2.0], [-1.3, 2.0], [-3.0, .2]] }, { fl: 0, pts: [[fd.x, Z - .3], [-.42, SF + .35]] },
    { fl: 0, pts: [[-bd.x, -Z + .3], [-bd.x, -1.2], [1.4, 0]] }, { fl: 1, pts: [[.45, -1.95], [-1.3, -1.95], [-1.5, -.3], [-2.5, 1.0]] }, { fl: 1, pts: [[.45, -1.95], [1.4, -1.85], [2.4, -.6], [3.4, -.3]] }, { fl: 1, pts: [[.45, -1.95], [.45, 1.6]] }];
  const rooms = { hall: { x0: -H0, x1: H0, z0: -Z, z1: Z, fl: 0 }, kitchen: { x0: PX + pt, x1: X, z0: -Z, z1: Z, fl: 0 }, parlour: { x0: -X, x1: -PX - pt, z0: -Z, z1: Z, fl: 0 },
    landing: { x0: -H0, x1: H0, z0: -Z, z1: Z, fl: 1 }, west: { x0: -X, x1: -PX - pt, z0: -Z, z1: Z, fl: 1 }, east: { x0: PX + pt, x1: X, z0: -Z, z1: Z, fl: 1 } };
  return { group: all, shell, room: group, tris: Math.round(tris), draws: group.children.length, shellTris: shell.userData.tris, shellCalls: shell.userData.calls, inner: { x0: -X, x1: X, z0: -Z, z1: Z }, floors, ceils: CE, eave: EAVE,
    door: { x: fd.x, z: plan.d / 2, w: fd.w, h: fd.h }, back: { x: -bd.x, z: -plan.d / 2, w: bd.w, h: bd.h }, part: { x: PX, t: pt }, doorsIn: { parlour: dParl, kitchen: dKit, up: dUp }, steps, rise: ri, going: G, well, rail, slabs, beams, fires, hearth,
    parlourFire, westFire, eastFire, rooms, paths, boxes, beds, table: kt, lamps, candles, windows, w: plan.w, d: plan.d };
}

// ── the farmstead's byre and barn as rooms (rooms.js's Session 1198), copied in Session 1480 with the farmhouse's renames (mats() →
// roomMats(), GL_PLANS → PLANS, gatelandsBuilding → building) and gatelandsByre → byreRoom, gatelandsBarn → barnRoom. The game hangs
// them behind the farmstead's byre and barn doors (83-world-generator.js's buildKitByre). ──
// ── the farmstead's outbuildings as rooms (Session 1198; OG-115's "farmstead with outbuildings", OG-114's farming), inside the shells of
// PLANS.byre and PLANS.barn (Session 1194). Neither has a ceiling under its roof: the slate's couples, purlins and ridge board
// show. farmKit(plan, M): put and bx as the farmhouse's (bx keeps a tagged footprint with its floor), under(z) the slate's underside
// over z, couple(x, Z, yc) a pair of rafters at x with a collar at yc, finish() the room merged by material.
function farmKit(plan, M) {
  const B = new Map(), boxes = [], h = plan.floors.reduce((a, b) => a + b, 0), p = plan.roof.pitch * Math.PI / 180, tp = Math.tan(p), ov = plan.roof.ov, D = plan.d / 2 + ov, ye = h - ov * tp;
  const under = z => ye + (D - Math.abs(z)) * tp;
  const put = (geo, key, x = 0, y = 0, z = 0, ry = 0, uv = .6, rx = 0, rz = 0) => { const q = geo.index ? geo.toNonIndexed() : geo; for (const k of Object.keys(q.attributes)) if (!['position', 'normal'].includes(k)) q.deleteAttribute(k);
    q.applyMatrix4(new THREE.Matrix4().compose(new THREE.Vector3(x, y, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(rx, ry, rz)), new THREE.Vector3(1, 1, 1))); worldUV(q, uv); if (!B.has(key)) B.set(key, []); B.get(key).push(q); return q; };
  const bx = (key, x0, x1, y0, y1, z0, z1, tag, fl) => { put(new THREE.BoxGeometry(x1 - x0, y1 - y0, z1 - z0), key, (x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2); if (tag) boxes.push({ tag, x0, x1, y0, y1, z0, z1, fl }); };
  const couple = (x, Z, yc) => { const L = Math.hypot(Z, Z * tp) - .12; for (const s of [-1, 1]) put(new THREE.BoxGeometry(.08, .15, L), 'oak', x, (under(Z) + under(0)) / 2 - .08 / Math.cos(p), s * Z / 2, 0, .6, s * p);
    if (yc != null) { const zc = (under(0) - .17 / Math.cos(p) - yc) / tp; bx('oak', x - .04, x + .04, yc - .14, yc, -zc, zc); } };
  // the purlins under the rafters halfway up each slope, and the ridge board, from x0 to x1
  const purlins = (x0, x1, Z) => { for (const s of [-1, 1]) { const z = s * Z / 2, y = under(Math.abs(z) + .06) - .16 / Math.cos(p); bx('oak', x0, x1, y - .14, y, z - .06, z + .06); } bx('oak', x0, x1, under(.03) - .24, under(.03) - .04, -.03, .03); };
  const finish = shell => { { const Gl = glMats().glass, Lt = glMats().lit; shell.traverse(m => { if (m.isMesh && (m.material === Gl || m.material === Lt)) { m.material = roomMats().pane; m.name = 'pane'; } }); }
    const group = new THREE.Group(); let tris = 0; for (const [k, gs] of B) { const q = mergeGeometries(gs, false); gs.forEach(x => x.dispose()); const m = new THREE.Mesh(q, M[k]); m.name = k; m.castShadow = !['flame', 'ember', 'glow'].includes(k); m.receiveShadow = true; group.add(m); tris += q.attributes.position.count / 3; }
    const all = new THREE.Group(); all.add(shell, group); return { group: all, room: group, tris: Math.round(tris), draws: group.children.length }; };
  // the openings of every face in the building's frame: front +z, back -z (its x mirrored), left -x and right +x (their x along z)
  const openings = kind => Object.entries(plan.open).flatMap(([f, os]) => (os || []).filter(q => kind(q.kind)).map(q => ({ face: f, kind: q.kind, y: q.y, w: q.w, h: q.h,
    x: f === 'front' ? q.x : f === 'back' ? -q.x : f === 'left' ? -plan.w / 2 : plan.w / 2, z: f === 'front' ? plan.d / 2 : f === 'back' ? -plan.d / 2 : f === 'left' ? q.x : -q.x })));
  return { put, bx, boxes, under, couple, purlins, finish, openings, eave: h };
}
// a lantern hung on an iron rod from top (the farmhouse's), and a pail
function farmLantern(K, fl, x, z, y, top) { K.bx('iron', x - .005, x + .005, y + .14, top, z - .005, z + .005); K.put(new THREE.CylinderGeometry(.08, .09, .22, 6), 'glow', x, y, z); K.put(new THREE.ConeGeometry(.1, .1, 6), 'iron', x, y + .16, z);
  K.put(new THREE.CylinderGeometry(.095, .095, .02, 6), 'iron', x, y - .12, z); return [x, y, z, fl]; }
function farmPail(K, fl, y0, x, z) { K.put(new THREE.CylinderGeometry(.15, .12, .3, 12, 1, true), 'oak', x, y0 + .15, z); K.put(new THREE.CylinderGeometry(.12, .12, .02, 12), 'oak', x, y0 + .02, z);
  for (const y of [.06, .24]) K.put(new THREE.TorusGeometry(.125 + y * .1, .008, 4, 14).rotateX(Math.PI / 2), 'iron', x, y0 + y, z); K.put(new THREE.TorusGeometry(.15, .006, 4, 12, Math.PI), 'iron', x, y0 + .3, z);
  K.boxes.push({ tag: 'pail', x0: x - .15, x1: x + .15, y0, y1: y0 + .45, z0: z - .15, z1: z + .15, fl }); }
// a heap of hay: half a squashed sphere on the floor at y0, rx by ry by rz
function farmHay(K, fl, y0, x, z, rx, ry, rz) { K.put(new THREE.SphereGeometry(1, 14, 6, 0, Math.PI * 2, 0, Math.PI / 2).scale(rx, ry, rz), 'straw', x, y0, z, 0, 2.2); K.boxes.push({ tag: 'hay', x0: x - rx, x1: x + rx, y0, y1: y0 + ry, z0: z - rz, z1: z + rz, fl }); }

// byreRoom(o, r) (the prototype's gatelandsByre): the byre of PLANS.byre (12 by 5.4 m outside, walls of 0.6 m, 2.6 m to the wall plate, slate at 36°) as the
//   Irish country's cow-house: six cows tied in three double stalls facing the back wall, each stall a cobbled standing 1.65 m long
//   between a manger of flags (a hay rack over it, below the back lights) and the dung channel; a flagged passage along the front
//   from both half-doors (their leaves standing open inward); a calf pen of boards at the east end on straw, its gate shut, a trough;
//   over the west half a hay loft of deal boards on joists at 2.45 m, reached by a ladder from the passage, its hatch in the west
//   gable, hay heaped under both slopes; the east half open to the couples. A milking stool, two pails, a meal bin, a hay fork.
//   -> { group, shell, room, tris, draws, inner, floors: [passage, loft], under(z), loft: {x0, x1, y, joists}, ladder, stalls, paths,
//        boxes, lamps, windows, doors, leaves, rooms } in the byre's frame (its centre on the ground, front +z).
function byreRoom(o = {}, r = stream('byre')) {
  const plan = PLANS.byre({ paint: o.paint || 'red' }); plan.interior = true; plan.r = stream('byre-shell'); for (const q of plan.open.front) if (q.kind === 'half') q.ajar = true; plan.open.left[0].open = true;
  const shell = building(plan), G = glMats(), M = { ...roomMats(), dress: G.dress, leaf: G['p:' + plan.paint], cobble: mat('flag', { ns: 1.8, color: 0x8a8476, rough: .85 }), straw: mat('thatch', { ns: 1.2, color: 0xeadcaa, rough: 1 }), dung: new THREE.MeshStandardMaterial({ color: 0x2c2418, roughness: .35 }) };
  const K = farmKit(plan, M), { bx, put, boxes, under } = K, X = plan.w / 2 - plan.t, Z = plan.d / 2 - plan.t, F0 = .03, FL = 2.45, JY = 2.27 /* the loft's joists' underside */, LX = -.6 /* the loft's open edge */;
  // ── the floor: the passage flagged, the dung channel a wet strip a step down, the standings cobbled a step up; the pen's straw
  const ZS = .15 /* the standings' heel */, ZC = .5 /* the channel's front edge */, ZM = -1.5 /* the manger's front */, XS = 2.45 /* the stalls' east end */;
  for (let z = ZC; z < Z - .05;) { const d = Math.min(Z - z, .5 + r() * .3); for (let x = -X; x < X - .05;) { const w = Math.min(X - x, .55 + r() * .4); put(new THREE.BoxGeometry(w - .02, F0, d - .02), 'flag', x + w / 2, F0 / 2, z + d / 2, 0, .7); x += w; } z += d; }
  bx('dung', -X, X, 0, .012, ZS, ZC); bx('cobble', -X, XS, 0, .12, ZM, ZS); bx('straw', XS + .05, X, 0, .06, -Z, ZS - .05);
  // ── the manger: a kerb of flags on edge, the trough's floor raised, hay in it; the rack over it, slatted, leaning out from the wall
  // under the back lights (their sills at 1.45 m); a ring and chain at the kerb for each cow
  bx('flag', -X, XS, 0, .62, ZM - .06, ZM, 'manger', 0); bx('flag', -X, XS, 0, .32, -Z, ZM - .06, 'manger', 0); for (let x = -X + .6; x < XS - .3; x += 1.3) put(new THREE.SphereGeometry(.4, 8, 4, 0, Math.PI * 2, 0, Math.PI / 2).scale(1.3, .3, .5), 'straw', x, .32, (ZM - Z) / 2 - .03);
  { const y0 = .82, y1 = 1.38, z1 = -1.72, L = Math.hypot(y1 - y0, z1 + Z - .03), a = -Math.atan2(y1 - y0, z1 + Z - .03); bx('oak', -X, XS, y0 - .06, y0, -Z, -Z + .06, 'rack', 0); bx('oak', -X, XS, y1 - .06, y1, z1 - .04, z1 + .04, 'rack', 0);
    for (let x = -X + .07; x < XS - .03; x += .14) put(new THREE.BoxGeometry(.025, .025, L), 'oak', x, (y0 + y1) / 2, (-Z + .03 + z1) / 2, 0, .6, a); }
  const stalls = [], cx = [-4.1, -1.5, 1.125]; for (const c of cx) { stalls.push({ x0: c - 1.3, x1: c + 1.3 }); for (const s of [-1, 1]) { const x = c + s * .62; put(new THREE.TorusGeometry(.05, .009, 4, 10), 'iron', x, .5, ZM + .012); for (let k = 0; k < 4; k++) put(new THREE.TorusGeometry(.022, .006, 3, 6), 'iron', x, .42 - k * .045, ZM + .015, k % 2 ? Math.PI / 2 : 0); } }
  // the divisions between the double stalls: boards on a heel post
  for (const x of [-2.8, -.2]) { bx('deal', x - .025, x + .025, .42, 1.12, ZM, ZS - .14, 'division', 0); bx('deal', x - .025, x + .025, .62, 1.12, ZM - .55, ZM - .06, 'division', 0); bx('oak', x - .06, x + .06, .12, 1.32, ZS - .14, ZS - .02, 'post', 0); }
  // ── the calf pen: a board wall from the stalls, a front of rails with its gate shut, a trough under the back wall
  bx('deal', XS, XS + .05, F0, 1.4, -Z, ZS - .02, 'penwall', 0);
  { const z0 = ZS - .07, z1 = ZS - .02; for (const y of [.3, .65, 1.0]) bx('deal', XS + .05, X, y, y + .12, z0, z1, 'penfront', 0); for (const x of [XS + .1, 3.6, X - .06]) bx('oak', x - .05, x + .05, F0, 1.16, z0 - .02, z1, 'penfront', 0);
    /* the gate's brace */ put(new THREE.BoxGeometry(Math.hypot(.95, .82), .06, .04), 'deal', 3.08, .71, z0 - .03, 0, .6, 0, Math.atan2(.82, .95)); }
  bx('oak', 4.3, 5.2, .06, .38, -Z, -1.75, 'trough', 0); bx('dung', 4.36, 5.14, .3, .385, -Z + .05, -1.81);
  // ── the loft: joists from wall to wall, a trimmer on its edge, deal boards; hay heaped under both slopes, clear of the hatch
  const joists = []; for (let x = -X + .25; x < LX - .12; x += .5) { bx('oak', x - .05, x + .05, JY, FL - .04, -Z, Z); joists.push(x); } bx('oak', LX - .1, LX, JY - .02, FL - .04, -Z, Z); bx('deal', -X, LX, FL - .04, FL, -Z, Z, null);
  farmHay(K, 1, FL, -3.4, -1.25, 1.75, .95, .72); farmHay(K, 1, FL, -3.6, 1.3, 1.45, .8, .62); farmHay(K, 1, FL, -1.7, -1.3, .8, .7, .6);
  // the ladder: two rails from the passage's back edge to over the loft's edge, oak rungs at 0.28 m
  const lad = { z0: .5, z1: .95, x0: LX + .9, yTop: FL + .95 }, dxdy = (lad.x0 - LX) / FL; { const L = Math.hypot(lad.yTop * dxdy, lad.yTop), a = Math.atan2(lad.yTop * dxdy, lad.yTop), cxl = lad.x0 - lad.yTop * dxdy / 2;
    for (const z of [lad.z0 + .03, lad.z1 - .03]) put(new THREE.BoxGeometry(.06, L, .05), 'oak', cxl, lad.yTop / 2 + .03, z, 0, .6, 0, a);
    for (let y = .28; y < FL; y += .28) { const x = lad.x0 - y * dxdy; bx('oak', x - .02, x + .02, y - .02, y + .02, lad.z0 + .05, lad.z1 - .05); }
    boxes.push({ tag: 'ladder', x0: LX - .02, x1: lad.x0 + .04, y0: 0, y1: JY, z0: lad.z0, z1: lad.z1, fl: 0 }, { tag: 'ladder', x0: LX - lad.yTop * dxdy + FL * dxdy - .04, x1: LX, y0: FL, y1: lad.yTop, z0: lad.z0, z1: lad.z1, fl: 1 }); }
  // ── the roof: a couple on every 1.6 m, collared where the byre is open to it, the purlins and the ridge board
  for (let x = -4.8; x <= 4.81; x += 1.6) K.couple(x, Z, x > LX ? 3.95 : null); K.purlins(-X, X, Z);
  // ── the doors' leaves, both standing open into the passage, each on the jamb away from the ladder; the passage's things
  const doors = K.openings(k => k === 'half'), leaves = [], hz = plan.d / 2 - .32; for (const d of doors) { const s = d.x < 0 ? -1 : 1, x = d.x + s * d.w / 2, x0 = s < 0 ? x : x - .05, x1 = x0 + .05;
    bx('leaf', x0, x1, 0, 1.12, hz - d.w + .02, hz); bx('leaf', x0, x1, 1.14, d.h, hz - d.w + .02, hz); for (const y of [.3, .85, 1.45]) bx('iron', s < 0 ? x1 : x0 - .01, s < 0 ? x1 + .01 : x0, y, y + .04, hz - .45, hz) /* the straps on the leaf's face to the room */;
    leaves.push({ x0, x1, z0: hz - d.w + .02, z1: hz }); boxes.push({ tag: 'leaf', x0, x1, y0: 0, y1: d.h, z0: hz - d.w + .02, z1: Z, fl: 0 }); }
  { const x = -1.25, z = 1.78; put(new THREE.CylinderGeometry(.15, .15, .04, 12), 'oak', x, .32, z); for (const a of [0, 2.1, 4.2]) put(new THREE.CylinderGeometry(.018, .02, .3, 5), 'oak', x + Math.cos(a) * .1, .15, z + Math.sin(a) * .1);
    boxes.push({ tag: 'stool', x0: x - .15, x1: x + .15, y0: 0, y1: .34, z0: z - .15, z1: z + .15, fl: 0 }); }
  farmPail(K, 0, F0, -.75, 1.86); farmPail(K, 0, F0, -1.7, 1.86);
  { const x0 = 4.45, x1 = 5.3, z0 = 1.45, z1 = Z - .02; bx('oak', x0, x1, F0, .66, z0, z1, 'bin', 0); bx('oak', x0 - .01, x1 + .01, .66, .7, z0 - .01, z1); }
  { const x = -2.55, L = 1.75, a = .17; put(new THREE.CylinderGeometry(.016, .016, L, 5), 'oak', x, L / 2 * Math.cos(a), Z - .06 - L / 2 * Math.sin(a), 0, .6, -a); for (const dx of [-.06, 0, .06]) put(new THREE.CylinderGeometry(.006, .004, .3, 4), 'iron', x + dx, L * Math.cos(a) + .1, Z - .06 - L * Math.sin(a) + .02);
    boxes.push({ tag: 'fork', x0: x - .1, x1: x + .1, y0: 0, y1: 1.95, z0: Z - .4, z1: Z, fl: 0 }); }
  const lamps = [farmLantern(K, 0, -2.4, 1.15, 2.08, JY), farmLantern(K, 0, 2.6, Z / 2, 2.25, under(Z / 2 + .06) - .3)];
  const F = K.finish(shell), windows = K.openings(k => k === 'win' || k === 'load'), inner = { x0: -X, x1: X, z0: -Z, z1: Z };
  const paths = [{ fl: 0, pts: [[doors[0].x, Z - .25], [doors[0].x, 1.12], [-X + .4, 1.12]] }, { fl: 0, pts: [[doors[0].x, 1.12], [3.9, 1.12]] }, { fl: 0, pts: [[doors[1].x, Z - .25], [doors[1].x, 1.12]] }, { fl: 0, pts: [[3.05, 1.12], [3.05, .5]] },
    { fl: 1, pts: [[LX - .6, .72], [LX - .6, 0], [-X + .4, 0]] }];
  const rooms = { passage: { x0: -X, x1: X, z0: ZC, z1: Z, fl: 0 }, standings: { x0: -X, x1: XS, z0: ZM, z1: ZS, fl: 0 }, pen: { x0: XS + .05, x1: X, z0: -Z, z1: ZS - .07, fl: 0 }, loft: { x0: -X, x1: LX, z0: -Z, z1: Z, fl: 1 } };
  return { ...F, shell, shellTris: shell.userData.tris, shellCalls: shell.userData.calls, inner, floors: [F0, FL], under, eave: K.eave, loft: { x0: -X, x1: LX, y: FL, joists: JY, n: joists.length }, ladder: { ...lad, x1: LX, rung: .28 },
    stalls, standing: { z0: ZM, z1: ZS, y: .12 }, channel: { z0: ZS, z1: ZC }, paths, boxes, lamps, windows, doors, leaves, rooms, w: plan.w, d: plan.d };
}

// barnRoom(o, r) (the prototype's gatelandsBarn): the barn of PLANS.barn (12 by 6.4 m outside, walls of 0.7 m, two storeys of 2.7 and 2.4 m, slate at 40°): below,
//   the cart bay behind the arch (its leaves swung back outside) with the plough, the harrow and the sacks, a scythe and a flail on the
//   back wall, and through a board partition the stable from the stable door: two horse stalls facing the back wall under a high rack,
//   their manger below the slits, the feed corner with the corn bin and the harness on the east gable; a straight stair of 16 risers
//   up the west gable to the loft, open to the couples, the hay heaped by the pitching door (swung open on the hoist's gable), the grain
//   in sacks and a chest at the west end.
//   -> { group, shell, room, tris, draws, inner, floors, ceils, under(z), steps, rise, going, well, rail, slabs, paths, boxes, lamps,
//        windows, doors, leaves, rooms } in the barn's frame (its centre on the ground, front +z).
function barnRoom(o = {}, r = stream('barn')) {
  const plan = PLANS.barn({}); plan.interior = true; plan.r = stream('barn-shell'); plan.open.front[0].open = true; plan.open.front[1].ajar = true; plan.open.right[0].open = true;
  const shell = building(plan), G = glMats(), M = { ...roomMats(), dress: G.dress, leaf: G['p:' + plan.paint], board: G.board, sack: mat('plaster', { ns: .5, color: 0xb8a27a, rough: 1 }), straw: mat('thatch', { ns: 1.2, color: 0xeadcaa, rough: 1 }), leather: new THREE.MeshStandardMaterial({ color: 0x3a2416, roughness: .75 }) };
  const K = farmKit(plan, M), { bx, put, boxes, under } = K, X = plan.w / 2 - plan.t, Z = plan.d / 2 - plan.t, F0 = .03, F1 = plan.floors[0], SL = .2, CE0 = F1 - SL, floors = [F0, F1];
  // ── the partition between the cart bay and the stable: boards on studs at x = PX, a doorway at the stable's passage
  const PX = .5, pt = .04, dSt = { z0: 1.0, z1: 1.9, h: 2.0 };
  { let a = -Z; for (const d of [dSt]) { bx('board', PX - pt, PX + pt, F0, CE0, a, d.z0, 'partition', 0); bx('board', PX - pt, PX + pt, F0 + d.h, CE0, d.z0, d.z1); for (const e of [d.z0, d.z1]) bx('oak', PX - pt - .01, PX + pt + .01, F0, F0 + d.h + .06, e - (e === d.z0 ? .06 : 0), e + (e === d.z1 ? .06 : 0)); a = d.z1; }
    bx('board', PX - pt, PX + pt, F0, CE0, a, Z, 'partition', 0); }
  // ── the floors: the bay beaten earth, the stable flagged
  bx('earth', -X, PX - pt, 0, F0, -Z, Z); for (let z = -Z; z < Z - .05;) { const d = Math.min(Z - z, .5 + r() * .3); for (let x = PX + pt; x < X - .05;) { const w = Math.min(X - x, .55 + r() * .4); put(new THREE.BoxGeometry(w - .02, F0, d - .02), 'flag', x + w / 2, F0 / 2, z + d / 2, 0, .7); x += w; } z += d; }
  // ── the stair: 16 risers up the west gable from the front to the landing at the back, on goings of 0.22 m
  const SX0 = -X, SX1 = -X + .9, SF = 1.9, Gg = .22, ri = (F1 - F0) / 16, steps = [];
  for (let i = 1; i <= 15; i++) { const y = F0 + i * ri, z1 = SF - (i - 1) * Gg, z0 = z1 - Gg; bx('oak', SX0, SX1, Math.max(y - ri - .06, F0), y, z0, z1); steps.push({ x0: SX0, x1: SX1, z0, z1, y, fl: 0 }); }
  const kHead = Math.floor((CE0 - 2.0 - F0) / ri), well = { x0: SX0, x1: SX1, z0: SF - 15 * Gg, z1: SF - kHead * Gg };
  { const L = Math.hypot(15 * Gg, F1 - F0), a = Math.atan2(F1 - F0, 15 * Gg), q = new THREE.BoxGeometry(.05, .28, L); q.rotateX(a); put(q, 'oak', SX1 + .025, (F0 + F1) / 2 + .14, SF - 7.5 * Gg);
    const q2 = new THREE.BoxGeometry(.06, .06, L + .2); q2.rotateX(a); put(q2, 'oak', SX1 + .02, (F0 + F1) / 2 + .9, SF - 7.5 * Gg); bx('oak', SX1 - .02, SX1 + .06, F0, F0 + 1.05, SF - .08, SF);
    for (let k = 1; k <= 15; k++) { const z = SF - (k - .5) * Gg, y = F0 + k * ri; bx('oak', SX1 + .005, SX1 + .035, y, y + .88, z - .012, z + .012); } }
  const rail = []; { const y = F1; for (let z = well.z0 + .1; z <= well.z1; z += .12) bx('oak', SX1 + .005, SX1 + .035, y, y + .9, z - .012, z + .012); bx('oak', SX1 - .01, SX1 + .05, y + .9, y + .96, well.z0, well.z1 + .03, 'wellrail', 1);
    for (let x = SX0 + .1; x < SX1 - .02; x += .12) bx('oak', x - .012, x + .012, y, y + .9, well.z1 + .005, well.z1 + .035); bx('oak', SX0, SX1 + .05, y + .9, y + .96, well.z1, well.z1 + .06, 'wellrail', 1); bx('oak', SX1 - .03, SX1 + .07, y, y + 1.05, well.z1 - .03, well.z1 + .07);
    rail.push({ x: SX1, z0: well.z0, z1: well.z1, y: y + .96 }, { z: well.z1, x0: SX0, x1: SX1, y: y + .96 }); }
  // ── the loft's floor: deal boards on oak joists across the barn, open over the well, bare from below
  const slabs = []; for (const [x0, x1, z0, z1] of [[SX1, X, -Z, Z], [SX0, SX1, -Z, well.z0], [SX0, SX1, well.z1, Z]]) { bx('deal', x0, x1, F1 - .04, F1, z0, z1); slabs.push({ x0, x1, z0, z1, y0: F1 - SL, y1: F1, fl: 1 }); }
  for (let x = -X + .2; x < X; x += .4) { if (x > SX0 - .03 && x < SX1 + .03) continue; bx('oak', x - .05, x + .05, CE0, F1 - .04, -Z, Z); }
  for (const x of [SX1 + .04]) bx('oak', x - .04, x + .04, CE0, F1 - .04, -Z, Z); for (const z of [well.z0, well.z1]) bx('oak', SX0, SX1, CE0, F1 - .04, z - .04, z + .04);
  // ── the roof: couples on every 1.5 m with collars at 6.6 m, the purlins and the ridge board
  for (let x = -4.5; x <= 4.51; x += 1.5) K.couple(x, Z, 6.6); K.purlins(-X, X, Z);
  // ── the stable: the manger along the back wall (its top 0.88 m, under the slits' sills), the rack high over it, two stalls between
  // boarded divisions on heel posts, the feed corner at the east gable
  const SXm = PX + pt, SXe = 4.2, ZMg = -Z + .5; bx('oak', SXm, SXe, .5, .88, -Z, ZMg, 'manger', 0); bx('oak', SXm, SXe, F0, .5, ZMg - .05, ZMg, 'manger', 0); bx('earth', SXm + .05, SXe - .05, .84, .885, -Z + .05, ZMg - .05);
  { const y0 = 1.92, y1 = 2.42, z1 = ZMg + .05, L = Math.hypot(y1 - y0, z1 + Z - .03), a = -Math.atan2(y1 - y0, z1 + Z - .03); bx('oak', SXm, SXe, y0 - .06, y0, -Z, -Z + .06, 'rack', 0); bx('oak', SXm, SXe, y1 - .06, y1, z1 - .04, z1 + .04, 'rack', 0);
    for (let x = SXm + .07; x < SXe - .03; x += .14) put(new THREE.BoxGeometry(.025, .025, L), 'oak', x, (y0 + y1) / 2, (-Z + .03 + z1) / 2, 0, .6, a); }
  const ZH = .5 /* the stalls' heels */; for (const x of [2.35, SXe]) { bx('board', x - .03, x + .03, F0, 1.45, ZMg, ZH - .12, 'stall', 0); bx('oak', x - .07, x + .07, F0, 1.9, ZH - .12, ZH, 'post', 0); put(new THREE.SphereGeometry(.07, 8, 6), 'oak', x, 1.95, ZH - .06); }
  for (const x of [1.45, 3.28]) put(new THREE.TorusGeometry(.05, .009, 4, 10), 'iron', x, .72, ZMg + .012);
  { const x0 = 4.35, x1 = 5.25, z0 = -Z + .03, z1 = -Z + .65; bx('oak', x0, x1, F0, .8, z0, z1, 'bin', 0); bx('oak', x0 - .01, x1 + .01, .8, .84, z0, z1 + .01); for (const e of [x0 + .15, x1 - .15]) bx('iron', e - .02, e + .02, .1, .84, z1, z1 + .012); }
  for (const z of [-.8, 0, .8]) { bx('oak', X - .26, X, 1.68, 1.73, z - .025, z + .025, 'peg', 0); }
  put(new THREE.TorusGeometry(.26, .06, 6, 14).scale(1, 1.25, 1), 'leather', X - .1, 1.42, -.8, Math.PI / 2); put(new THREE.TorusGeometry(.2, .035, 4, 12).scale(1, 1.3, 1), 'iron', X - .1, 1.42, -.8, Math.PI / 2);
  for (const z of [0, .8]) { for (let k = 0; k < 3; k++) bx('leather', X - .1, X - .08, 1.0 + k * .08, 1.7, z - .04 + k * .03, z - .02 + k * .03); }
  // the stable door's leaf, open into the passage on its east jamb
  const doors = K.openings(k => k === 'cart' || k === 'plank'), leaves = [], hz = plan.d / 2 - .2; { const d = doors.find(q => q.kind === 'plank'), x1 = d.x + d.w / 2, x0 = x1 - .05;
    bx('leaf', x0, x1, F0, d.h, hz - d.w + .02, hz); for (const y of [.35, 1.6]) bx('iron', x0 - .012, x0, y, y + .05, hz - .75, hz); leaves.push({ x0, x1, z0: hz - d.w + .02, z1: hz }); boxes.push({ tag: 'leaf', x0, x1, y0: F0, y1: d.h, z0: hz - d.w + .02, z1: Z, fl: 0 }); }
  // ── the cart bay: the plough by the back wall, the harrow leant on the partition, three sacks of seed, the scythe and the flail hung
  { const y = F0, z = -2.0; { const q = new THREE.BoxGeometry(2.3, .12, .1); q.rotateZ(.12); put(q, 'oak', -1.95, y + .5, z); } for (const s of [-1, 1]) { const q = new THREE.BoxGeometry(1.1, .05, .05); q.rotateZ(-.55); put(q, 'oak', -3.0, y + .6, z + s * .2, s * .15); }
    put(new THREE.BoxGeometry(.5, .32, .04).rotateY(.5), 'iron', -2.75, y + .2, z + .09); put(new THREE.BoxGeometry(.32, .04, .14), 'iron', -2.45, y + .03, z); bx('oak', -1.35, -1.29, y, y + .48, z - .03, z + .03); put(new THREE.CylinderGeometry(.18, .18, .05, 12).rotateX(Math.PI / 2), 'iron', -.85, y + .2, z);
    boxes.push({ tag: 'plough', x0: -3.3, x1: -.65, y0: y, y1: y + 1.0, z0: z - .3, z1: z + .3, fl: 0 }); }
  { const x0 = .18, x1 = PX - pt - .02, z0 = -2.35, z1 = -1.15, a = Math.atan2(x1 - x0, 1.25); for (const t2 of [0, .4, .8, 1.2]) { const q = new THREE.BoxGeometry(.06, 1.3, .07); q.rotateZ(-a); put(q, 'oak', (x0 + x1) / 2, .66, z0 + .05 + t2 * (z1 - z0 - .1) / 1.2); }
    for (const k of [0, .5, 1]) { const q = new THREE.BoxGeometry(.05, .06, z1 - z0); put(q, 'oak', x0 + .02 + k * (x1 - x0 - .06) + (1 - k) * .0, .12 + k * 1.05, (z0 + z1) / 2); }
    boxes.push({ tag: 'harrow', x0, x1, y0: F0, y1: 1.34, z0, z1, fl: 0 }); }
  for (const [x, z] of [[-.2, -.2], [.12, .25], [-.25, .45]]) { put(new THREE.SphereGeometry(.24, 10, 8).scale(1, 1.55, .9), 'sack', x, .38, z); put(new THREE.CylinderGeometry(.06, .1, .12, 8), 'sack', x, .78, z); boxes.push({ tag: 'sack', x0: x - .24, x1: x + .24, y0: F0, y1: .84, z0: z - .22, z1: z + .22, fl: 0 }); }
  { const y = 2.1, z = -Z + .05; bx('oak', -2.9, -1.3, y - .02, y + .02, z - .02, z + .03); put(new THREE.BoxGeometry(.6, .015, .1).rotateZ(-.2), 'iron', -1.15, y - .1, z + .02); for (const x of [-2.5, -1.6]) bx('oak', x - .02, x + .02, y - .06, y + .02, -Z, -Z + .1);
    bx('oak', -4.0, -3.95, 1.0, 2.15, -Z + .02, -Z + .07); bx('oak', -3.92, -3.88, .45, 1.05, -Z + .03, -Z + .07); }
  const lamps = [farmLantern(K, 0, -2.4, .55, 2.14, CE0), farmLantern(K, 0, 2.95, 1.25, 2.14, CE0), farmLantern(K, 1, .75, 0, F1 + 2.25, 6.6 - .14)];
  // ── the loft: the hay heaped under both slopes at the east end, by the pitching door; the grain at the west end in sacks and a chest
  farmHay(K, 1, F1, 3.1, 1.32, 1.9, 1.5, .6); farmHay(K, 1, F1, 2.9, -1.32, 2.1, 1.6, .6) /* off the walls by 0.55 m, clear of the slits */; farmHay(K, 1, F1, .6, -1.3, .9, .9, .55);
  for (const [x, z] of [[-3.0, -2.2], [-2.5, -2.2], [-2.0, -2.2], [-2.75, -1.75]]) { put(new THREE.SphereGeometry(.24, 10, 8).scale(1, 1.55, .9), 'sack', x, F1 + .35, z); put(new THREE.CylinderGeometry(.06, .1, .12, 8), 'sack', x, F1 + .75, z); boxes.push({ tag: 'sack', x0: x - .24, x1: x + .24, y0: F1, y1: F1 + .81, z0: z - .22, z1: z + .22, fl: 1 }); }
  { const x0 = -2.9, x1 = -1.7, z0 = Z - .62, z1 = Z - .02; bx('oak', x0, x1, F1, F1 + .66, z0, z1, 'chest', 1); bx('oak', x0 - .01, x1 + .01, F1 + .66, F1 + .7, z0 - .01, z1); }
  const F = K.finish(shell), windows = K.openings(k => k === 'win' || k === 'load'), inner = { x0: -X, x1: X, z0: -Z, z1: Z }, arch = doors.find(q => q.kind === 'cart'), sd = doors.find(q => q.kind === 'plank');
  const paths = [{ fl: 0, pts: [[arch.x, Z - .3], [arch.x, .9], [-.2, 1.45], [PX + .5, 1.45]] }, { fl: 0, pts: [[arch.x, Z - .3], [-3.6, 2.15], [(SX0 + SX1) / 2, 2.15]] }, { fl: 0, pts: [[sd.x, Z - .3], [sd.x, 1.45], [PX + .5, 1.45]] },
    { fl: 0, pts: [[sd.x, 1.45], [4.75, 1.45], [4.75, -1.45]] }, { fl: 1, pts: [[(SX0 + SX1) / 2, -1.85], [-3.85, -1.85], [-3.85, 0], [X - .45, 0]] }];
  const rooms = { bay: { x0: -X, x1: PX - pt, z0: -Z, z1: Z, fl: 0 }, stable: { x0: PX + pt, x1: X, z0: -Z, z1: Z, fl: 0 }, loft: { x0: -X, x1: X, z0: -Z, z1: Z, fl: 1 } };
  return { ...F, shell, shellTris: shell.userData.tris, shellCalls: shell.userData.calls, inner, floors, ceils: [CE0], under, eave: K.eave, steps, rise: ri, going: Gg, well, rail, slabs, paths, boxes, lamps, windows, doors, leaves, rooms,
    part: { x: PX, t: pt }, doorIn: dSt, stalls: [{ x0: SXm, x1: 2.32 }, { x0: 2.38, x1: SXe - .03 }], manger: { y: .88, z1: ZMg }, rack: { y0: 1.92, y1: 2.42 }, w: plan.w, d: plan.d };
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
// the Mark's lots (Session 1286: pieces.js's markLot of Session 831, copied as it stands; Michael's C on #277: two in three shingle, one turf, by lot). In every run of three lots one
// is turf, which one by the street's seed, as Aurenne's mix; a hall of note (s.note, a list of lot indices: the hall at the
// square, the lane's end) is never turf, and when the pick lands on one the turf moves to the next lot of the three that is
// not one (so a run holding a hall of note can be all shingle; nothing else breaks the two in three). The turf is the poorer
// house: a smaller, lower hall in the darker planks, set further back with more yard, rarely a porch or a chimney, carved
// only when it is one of the larger. Each lot's options come from a stream keyed by the street and the lot alone.
function markLot(street, i, s = {}) {
  const note = new Set(s.note || []), t = Math.floor(i / 3); let pick = t * 3 + hashKey(`${street}:triple:${t}`) % 3;
  for (let k = 0; k < 3 && note.has(pick); k++) pick = t * 3 + (pick - t * 3 + 1) % 3;
  const big = note.has(i), roof = !big && pick === i ? 'turf' : 'shingle', r = stream(`${street}:lot:${i}`), f = v => +v.toFixed(2);
  let o;
  if (big) o = { roof, note: true, w: f(8.4 + r() * 1.2), d: f(15 + r() * 3), porch: true, chimney: true, carve: true, wall: Math.floor(r() * 4), gap: f(3.5 + r() * 1.5), set: f(r() * .6) };
  else if (roof === 'turf') { const w = f(5.6 + r() * 1.2); o = { roof, w, d: f(8.5 + r() * 2.5), porch: r() < .2, chimney: r() < .3, carve: w > 6.4 && r() < .35, wall: 1 + Math.floor(r() * 2), gap: f(3 + r() * 2.5), set: f(1.2 + r() * 1.8) }; }
  else o = { roof, w: f(6.8 + r() * 1.6), d: f(11 + r() * 3.5), porch: r() < .55, chimney: r() < .65, carve: true, wall: Math.floor(r() * 4), gap: f(2.5 + r() * 1.5), set: f(r() * .8) };
  return { o, r };
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
// ── the Mark's longhouse, a home (Session 1453; card F9, Michael's A on #311, as drawn, and on #303: inside the street's own shell),
// copied from docs/prototypes/levelup/rooms.js's markLonghouse (Session 870, laid out by size in Session 1452) as it stands. Copy it
// again from there when the prototype changes. ──
// By size (Session 1452, card F9; for the game's halls, 5.6 to 8.4 m wide and 6.5 to 14.5 m deep, PKIT.mk.lot's mix): o.w, o.d and the
//   shell's own o.roof, o.turf, o.porch, o.chimney, o.carve and o.wall (a stream key in o.shell) build the room inside the hall the street
//   stands. With no options it is the hall as drawn, unchanged. The drawn plan (the partition and the family quarters) needs a louver
//   hall deep enough for the long hearth between the partition and the door; any other hall is one room: the bed a bench bed of furs at
//   the back of the left wall's bench, its chest at its foot, the cradle in the other back corner. A hall with a chimney (the shell's
//   stack, 0.9 m square, a quarter of the width left of the axis and a quarter of the depth back) has its fire on a peis raised against
//   the stack's face to the axis (the hunting cabin's, Session 1199) in place of the long hearth, the bed on the right, the walk down
//   the axis; the posts and the bench give way round the stack. Under 5.8 m inside (X < 2.9) the benches are 0.9 m deep and the posts
//   1.0 m in, so the aisle each side of the hearth is 0.6 m or more.
//   o.chest false leaves the drawn chest out (the game's own, that opens, stands in its place; Session 1453).
//   -> also { plan: 'parted' | 'one', chimney, stack, peis, chest } (doors and partition are [] and null in one room).
function markLonghouse(o = {}, r = stream('longhouse')) {
  const w = o.w ?? 7.6, d = o.d ?? 14, chim = !!o.chimney, hall = markHall({ roof: o.roof || 'shingle', turf: o.turf, w, d, porch: o.porch ?? true, chimney: chim, carve: o.carve ?? true, wall: o.wall ?? 1, interior: true }, stream(o.shell || 'longhouse-shell'));
  const M = longMats(), B = new Map(), boxes = [];
  const put = (geo, key, x = 0, y = 0, z = 0, ry = 0, uv = .6, rx = 0, rz = 0) => { const g = geo.index ? geo.toNonIndexed() : geo; for (const k of Object.keys(g.attributes)) if (!['position', 'normal'].includes(k)) g.deleteAttribute(k);
    g.applyMatrix4(new THREE.Matrix4().compose(new THREE.Vector3(x, y, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(rx, ry, rz, 'YXZ')), new THREE.Vector3(1, 1, 1))); worldUV(g, uv);
    if (!B.has(key)) B.set(key, []); B.get(key).push(g); return g; };
  const bx = (key, x0, x1, y0, y1, z0, z1, tag) => { put(new THREE.BoxGeometry(x1 - x0, y1 - y0, z1 - z0), key, (x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2); if (tag) boxes.push({ tag, x0, x1, y0, y1, z0, z1 }); };
  const X = w / 2 - .25, Z = d / 2 - .25, FY = hall.sill + .04, tp = Math.tan(hall.pitch), under = x => hall.ry0 + (w / 2 + hall.ov - Math.abs(x)) * tp - .02, WP = hall.sill + hall.wh;
  const narrow = X < 2.9, BD = narrow ? .9 : 1.1, hit = (a, b, m = 0) => a.x0 < b.x1 + m && b.x0 < a.x1 + m && a.z0 < b.z1 + m && b.z0 < a.z1 + m;
  // the shell's stack, when it has one (markHall: 0.9 m square at x = -w/4, z = -d/4, from the ground through the roof)
  const stack = chim ? { x0: -w / 4 - .45, x1: -w / 4 + .45, z0: -d * .25 - .45, z1: -d * .25 + .45 } : null, peisB = chim ? { x0: stack.x1, x1: stack.x1 + .44, z0: stack.z0 - .02, z1: stack.z1 + .02 } : null;
  // the plan: the drawn one (parted) when the long hearth fits between the partition (0.5 m clear before it) and the door's turn; its
  // length is the longest of 2.6 down to 1.1 m that fits, centred under the louver
  const hz = chim ? null : hall.louver ?? -1.5, PZ0 = -Z + 2.6, Ls = [2.6, 2.3, 2.0, 1.7, 1.4, 1.1], front = Z - 2.1;
  const Lp = chim ? null : Ls.find(L => hz + L / 2 <= front && hz - L / 2 - .2 >= PZ0 + .5), parted = !chim && Lp >= 1.7;
  // the floor: planks along the hall on the footing
  for (let x = -X; x < X - .01; x += .28) bx('plank', x + .005, Math.min(x + .275, X), hall.sill, FY, -Z, Z);
  // the frame: two rows of posts 1.25 m in from the walls (1.0 in a narrow hall), purlins along their heads, tie beams across each pair;
  // rafters every metre up each slope with a board lining over them under the roof. A post that would stand in the stack is left out.
  const PXr = narrow ? X - 1.0 : X - 1.25, TB = WP + .25, posts = []; for (let z = -Z + (parted ? 2.6 : 3.4); z < Z - 1.2; z += 2.75) posts.push(z); /* the first pair on the partition's line; in one room 0.8 m on, clear of the chest's front */
  const xa = Math.min(1.3, (.75 + PXr - .11) / 2) /* the aisle beside the long hearth */;
  for (const sx of [-1, 1]) { for (const z of posts) if (!(stack && hit({ x0: sx * PXr - .11, x1: sx * PXr + .11, z0: z - .11, z1: z + .11 }, stack, .05))) bx('post', sx * PXr - .11, sx * PXr + .11, FY, TB, z - .11, z + .11, 'post'); bx('post', sx * PXr - .12, sx * PXr + .12, TB, TB + .24, -Z, Z); }
  for (const z of posts) bx('post', -PXr - .1, PXr + .1, TB, TB + .24, z - .1, z + .1);
  // (each slope from the ridge: the rafters stop at the wall's inner face, the lining runs on to the wall plate)
  const XL = w / 2 - .02, rl = X / Math.cos(hall.pitch); for (const sx of [-1, 1]) { const xm = sx * X / 2, rz = -sx * hall.pitch;
    for (let z = -Z + .3; z < Z; z += 1.0) put(new THREE.BoxGeometry(rl, .14, .1), 'post', xm, under(xm) - .03 - .07 / Math.cos(hall.pitch), z, 0, .8, 0, rz);
    put(new THREE.BoxGeometry(XL / Math.cos(hall.pitch), .02, 2 * Z), 'board', sx * XL / 2, under(XL / 2) - .01, 0, 0, .8, 0, rz); /* the lining runs out onto the wall plate, so no shingle shows over the wall */ }
  const L = chim ? null : parted ? Lp : Ls.find(L => hz + L / 2 <= front && hz - L / 2 >= -Z + .5) ?? 1.1;
  const PZ = parted ? PZ0 : null, H = chim ? null : { x0: -.55, x1: .55, z0: hz - L / 2, z1: hz + L / 2 };
  let fire;
  if (!chim) {
    // the long hearth on the axis, under the louver: a kerb of stones round an ash bed, logs and embers, a cauldron on a tripod
    for (let z = H.z0; z < H.z1 - .01; z += .3) for (const x of [H.x0, H.x1]) { const s = .13 + r() * .04, g = new THREE.IcosahedronGeometry(s, 1); g.scale(1.3, .7, 1.1); put(g, 'kerb', x, FY + s * .55, z + .15, r() * 3); }
    for (let x = H.x0 + .3; x < H.x1 - .2; x += .3) for (const z of [H.z0, H.z1]) { const s = .13 + r() * .04, g = new THREE.IcosahedronGeometry(s, 1); g.scale(1.1, .7, 1.3); put(g, 'kerb', x, FY + s * .55, z, r() * 3); }
    boxes.push({ tag: 'hearth', x0: H.x0 - .2, x1: H.x1 + .2, y0: FY, y1: FY + .2, z0: H.z0 - .2, z1: H.z1 + .2 }); bx('ash', H.x0 + .1, H.x1 - .1, FY, FY + .04, H.z0 + .1, H.z1 - .1);
    fire = [0, FY + .25, hz]; for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI, g = new THREE.CylinderGeometry(.06, .07, .9, 7); g.rotateZ(Math.PI / 2); put(g, 'log', 0, FY + .1 + (i % 2) * .07, hz + (i - 2.5) * .14, a * .4 + .2); }
    put(new THREE.SphereGeometry(.22, 10, 6).scale(1.4, .35, 2.2), 'ember', 0, FY + .08, hz); for (let i = 0; i < 4; i++) put(new THREE.ConeGeometry(.09, .34 + (i % 2) * .12, 7), 'flame', (i % 2 - .5) * .12, FY + .3, hz + (i - 1.5) * .18);
    { const cz = hz + Math.min(.95, L / 2 - .3); for (const a of [0, 2.1, 4.2]) { const g = new THREE.CylinderGeometry(.015, .015, 1.25, 5); put(g, 'iron', Math.cos(a) * .32, FY + .58, cz + Math.sin(a) * .32, 0, .6, Math.sin(a) * .26, -Math.cos(a) * .26); }
      bx('iron', -.006, .006, FY + .62, FY + 1.18, cz - .006, cz + .006); const pot = new THREE.SphereGeometry(.2, 14, 10, 0, Math.PI * 2, .4, Math.PI - .4); put(pot, 'iron', 0, FY + .55, cz); }
  } else {
    // the peis: the hearth raised against the stack's face to the axis, a cheek each side, a stone hood back to the stack; the fire on it
    const hx1 = stack.x1 + .42, HY = FY + .32, HH = FY + 1.02, fz = (stack.z0 + stack.z1) / 2; bx('kerb', stack.x1, hx1, FY, HY, stack.z0, stack.z1); for (const z of [stack.z0, stack.z1 - .12]) bx('kerb', stack.x1, hx1 - .04, HY, HH, z, z + .12);
    bx('kerb', stack.x1 - .02, hx1 + .02, HH, HH + .26, stack.z0 - .02, stack.z1 + .02); bx('soot', stack.x1, stack.x1 + .015, HY, HH, stack.z0 + .12, stack.z1 - .12); bx('soot', stack.x1, hx1 - .04, HH - .02, HH, stack.z0 + .12, stack.z1 - .12);
    boxes.push({ tag: 'peis', x0: peisB.x0, x1: peisB.x1, y0: FY, y1: HH + .26, z0: peisB.z0, z1: peisB.z1 });
    const fx = stack.x1 + .2; for (let i = 0; i < 3; i++) { const q = new THREE.CylinderGeometry(.045, .05, .34, 6); q.rotateZ(Math.PI / 2); put(q, 'log', fx, HY + .05 + (i === 2 ? .07 : 0), fz + (i - 1) * .09, (i - 1) * .5); }
    put(new THREE.SphereGeometry(.13, 10, 6).scale(1.1, .35, 1.3), 'ember', fx, HY + .03, fz); for (let i = 0; i < 3; i++) put(new THREE.ConeGeometry(.055, .24 + i * .05, 7), 'flame', fx + (i - 1) * .03, HY + .2, fz + (i - 1) * .07);
    fire = [fx, HY + .25, fz];
    // a pot on a crane's hook over the fire, swung from the hood
    bx('iron', fx - .006, fx + .006, HY + .45, HH, fz - .006, fz + .006); put(new THREE.SphereGeometry(.13, 12, 8, 0, Math.PI * 2, .4, Math.PI - .4), 'iron', fx, HY + .38, fz);
  }
  // the bed: in the family quarters behind the partition (parted), else a bench bed of furs at the back of the left wall's bench (the
  // right's with a chimney), its chest at its foot; the cradle in the other back corner, where it is clear of the stack
  const bs = chim ? 1 : -1, bed = parted ? { x0: -X + .1, x1: -X + 2.2, z0: -Z, z1: -Z + 1.95 } : bs < 0 ? { x0: -X, x1: -X + BD, z0: -Z, z1: -Z + 2.1 } : { x0: X - BD, x1: X, z0: -Z, z1: -Z + 2.1 };
  bx('oak', bed.x0, bed.x1, FY, FY + .4, bed.z0, bed.z1, 'bed'); bx('fur', bed.x0 + .05, bed.x1 - .05, FY + .4, FY + .5, bed.z0 + .05, bed.z1 - .05);
  if (parted) bx('furPale', bed.x0 + .1, bed.x0 + .9, FY + .5, FY + .58, bed.z0 + .1, bed.z1 - .1); else bx('furPale', bed.x0 + .1, bed.x1 - .1, FY + .5, FY + .58, bed.z0 + .1, bed.z0 + .7) /* the pillow at the back wall */;
  const chest = parted ? { x0: bed.x1 + .1, x1: bed.x1 + 1.0, z0: -Z, z1: -Z + .55 } : bs < 0 ? { x0: -X, x1: -X + .55, z0: bed.z1 + .1, z1: bed.z1 + 1.0 } : { x0: X - .55, x1: X, z0: bed.z1 + .1, z1: bed.z1 + 1.0 };
  if (o.chest !== false) { bx('oak', chest.x0, chest.x1, FY, FY + .5, chest.z0, chest.z1, 'chest'); if (parted) bx('iron', chest.x0, chest.x1, FY + .3, FY + .34, chest.z1, chest.z1 + .02); else { const e = bs < 0 ? chest.x1 : chest.x0 - .02; bx('iron', e, e + .02, FY + .3, FY + .34, chest.z0, chest.z1); } } /* o.chest false: the game's own chest, that opens, stands in its place */
  // a small stone lamp of oil on the chest, the bed's own light
  const lamp2 = parted ? [bed.x1 + .55, FY + .56, -Z + .3] : [(chest.x0 + chest.x1) / 2, FY + .56, (chest.z0 + chest.z1) / 2]; put(new THREE.CylinderGeometry(.07, .05, .06, 10), 'kerb', lamp2[0], FY + .53, lamp2[2]); put(new THREE.SphereGeometry(.015, 6, 5).scale(1, 2, 1), 'flame', lamp2[0], FY + .585, lamp2[2]);
  let cradle = null; { const cx = -bs * (X - .7), cz = -Z + .85, c = { x0: cx - .3, x1: cx + .3, z0: cz - .45, z1: cz + .45 };
    if (!(stack && hit(c, stack, .4))) { cradle = c; /* its rockers reach 0.32 m past its ends */ bx('oak', c.x0, c.x1, FY + .1, FY + .42, c.z0, c.z1, 'cradle'); bx('furPale', cx - .25, cx + .25, FY + .42, FY + .46, cz - .4, cz + .4); for (const s of [-1, 1]) put(new THREE.TorusGeometry(.32, .03, 4, 12, Math.PI).rotateY(Math.PI / 2), 'oak', cx, FY + .1, cz + s * .45); } }
  // the benches down both long walls, laid with furs (to sit on by day, sleep on by night): between the larder and workshop at the front
  // and the partition at the back (parted); in one room from the chest or the cradle on, and round the stack where it stands in one
  const BH = .45, benches = [], BZ1 = Z - 2.4;
  for (const sx of [-1, 1]) { const x0 = sx > 0 ? X - BD : -X, x1 = sx > 0 ? X : -X + BD, z0 = parted ? -Z + 3.0 : sx === bs ? chest.z1 + .1 : cradle ? cradle.z1 + .2 : -Z + .3;
    let runs = [[z0, BZ1]]; if (stack && stack.x0 < x1 + .05 && x0 < stack.x1 + .05) runs = runs.flatMap(([a, b]) => [[a, Math.min(b, stack.z0 - .1)], [Math.max(a, stack.z1 + .1), b]]);
    for (const [a, b] of runs.filter(([a, b]) => b - a >= 1.0)) { bx('board', x0, x1, FY, FY + BH - .04, a, b, 'bench'); bx('plank', x0, x1, FY + BH - .04, FY + BH, a, b); benches.push({ x0, x1, y: FY + BH, z0: a, z1: b });
      for (let z = a + .3, k = 0; z < b - 1.2; z += 1.7 + r() * .6, k++) { const L = Math.min(1.5 + r() * .4, b - z - .1), W2 = Math.min(.8 + r() * .2, BD - .1), g = new THREE.PlaneGeometry(W2, L, 6, 6), P = g.attributes.position;
        for (let i = 0; i < P.count; i++) { const ex = Math.abs(P.getX(i)) / (W2 / 2), ey = Math.abs(P.getY(i)) / (L / 2); P.setZ(i, .015 + .02 * Math.sin(P.getX(i) * 9 + k) * Math.cos(P.getY(i) * 7) - (ex > .85 && ey > .8 ? .01 : 0)); }
        g.rotateX(-Math.PI / 2); g.computeVertexNormals(); put(g, ['fur', 'furPale', 'furGrey'][k % 3], (x0 + x1) / 2 + (r() - .5) * .1, FY + BH, z + L / 2, (r() - .5) * .12, .9); } } }
  // the workshop corner, front left: a bench along the front wall, tools on pegs over it (as many as its length holds), a chopping block with an axe
  { const x0 = -X, x1 = -.95, z1 = Z, z0 = Z - .7, nT = Math.min(5, Math.floor((x1 - x0 - .3) / .45)); bx('oak', x0, x1, FY + .8, FY + .88, z0, z1, 'workbench'); for (const x of [x0 + .1, x1 - .15]) for (const z of [z0 + .1, z1 - .1]) bx('oak', x - .05, x + .05, FY, FY + .8, z - .05, z + .05);
    for (let k = 0; k < nT; k++) { const x = x0 + .4 + k * .45; bx('oak', x - .015, x + .015, FY + 1.45, FY + 1.48, Z - .1, Z); const L = .4 + r() * .3; bx(k % 2 ? 'oak' : 'iron', x - .02, x + .02, FY + 1.45 - L, FY + 1.45, Z - .07, Z - .03); }
    const kx = narrow ? -X + .45 : -1.7 /* by the wall, clear of the posts, in a narrow hall */; put(new THREE.CylinderGeometry(.22, .25, .5, 12), 'log', kx, FY + .25, Z - 1.25); boxes.push({ tag: 'block', x0: kx - .25, x1: kx + .25, y0: FY, y1: FY + .5, z0: Z - 1.5, z1: Z - 1.0 });
    bx('oak', kx - .02, kx + .02, FY + .5, FY + 1.1, Z - 1.27, Z - 1.23); bx('iron', kx - .04, kx + .04, FY + .5, FY + .62, Z - 1.38, Z - 1.18); }
  // the larder, front right: a beam across the corner on two posts, hung with hams, dried fish and bunches of herbs; barrels and a crock below
  { const x0 = .95, x1 = X, z = Z - .9, by = FY + 2.05; for (const x of [x0 + .1, x1 - .1]) bx('post', x - .07, x + .07, FY, by, z - .07, z + .07, 'larderpost'); bx('post', x0, x1, by, by + .14, z - .07, z + .07);
    for (let k = 0; k < 7; k++) { const x = x0 + .4 + k * (x1 - x0 - .7) / 6, kind = k % 3; bx('linen', x - .006, x + .006, by - .3, by, z - .006, z + .006);
      if (kind === 0) put(new THREE.SphereGeometry(.13, 10, 8).scale(1, 1.7, .8), 'ham', x, by - .5, z); else if (kind === 1) for (let f = 0; f < 3; f++) put(new THREE.ConeGeometry(.05, .42, 6).rotateX(Math.PI), 'fish', x + (f - 1) * .07, by - .52, z);
      else put(new THREE.ConeGeometry(.09, .32, 7), 'herb', x, by - .46, z); }
    for (const [x, zz] of [[x1 - .4, Z - .4], [x1 - 1.05, Z - .38]]) { put(new THREE.CylinderGeometry(.3, .27, .75, 14), 'oak', x, FY + .375, zz); boxes.push({ tag: 'barrel', x0: x - .3, x1: x + .3, y0: FY, y1: FY + .75, z0: zz - .3, z1: zz + .3 }); }
    put(new THREE.CylinderGeometry(.13, .16, .4, 12), 'crock', x1 - .3, FY + .2, z - .45); }
  // the partition across the back: planks on a frame, a doorway right of the axis into the family quarters (the drawn plan only)
  const dP = { x: 1.0, w: .9, h: 2.0 }; if (parted) { const s = new THREE.Shape(); s.moveTo(-X, 0); s.lineTo(X, 0); s.lineTo(X, TB - FY); s.lineTo(-X, TB - FY); s.lineTo(-X, 0);
    const h = new THREE.Path(); h.moveTo(dP.x - dP.w / 2, 0); h.lineTo(dP.x + dP.w / 2, 0); h.lineTo(dP.x + dP.w / 2, dP.h); h.lineTo(dP.x - dP.w / 2, dP.h); h.lineTo(dP.x - dP.w / 2, 0); s.holes.push(h);
    const g = new THREE.ExtrudeGeometry(s, { depth: .08, bevelEnabled: false }); g.translate(0, FY, PZ - .04); put(g, 'board', 0, 0, 0, 0, .7); }
  // the lamp: an iron bowl of oil on a chain from the middle tie beam (over the right aisle with a chimney)
  const lz = posts[Math.floor(posts.length / 2)] ?? 0, lamp = [(chim ? 1 : -1) * Math.min(1.2, PXr - .4), TB - .6, lz]; bx('iron', lamp[0] - .005, lamp[0] + .005, lamp[1] + .05, TB, lz - .005, lz + .005);
  put(new THREE.SphereGeometry(.09, 10, 6, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), 'iron', ...lamp); put(new THREE.SphereGeometry(.02, 6, 5).scale(1, 2, 1), 'flame', lamp[0] + .05, lamp[1] + .03, lamp[2]);
  // the front door, hung open: its leaf swung in against the front wall, left of the doorway
  { const leaf = { x0: -hall.door.w / 2 - .07, x1: -hall.door.w / 2 - .01, z0: Z - hall.door.w - .01, z1: Z - .01 }; bx('board', leaf.x0, leaf.x1, FY, FY + hall.door.h - .12, leaf.z0, leaf.z1, 'door');
    for (const y of [.5, 1.5]) bx('iron', leaf.x0 - .02, leaf.x0, FY + y - .03, FY + y + .03, leaf.z0 + .1, leaf.z1 - .05); }
  // the walk: in at the door, between the larder and the workshop, down the left of the hearth, and through the partition's doorway
  // (parted) or to the bed's side (one room); with a chimney, straight down the axis past the peis to the bed's side
  const bedSide = [bs * (X - BD - .35), (bed.z0 + bed.z1) / 2];
  const path = parted ? [[0, Z - .1], [0, Z - 1.6], [-xa, H.z1 + .3], [-xa, PZ + .35], [dP.x, PZ + .35], [dP.x, PZ - .6]] : chim ? [[0, Z - .1], [0, Z - 1.6], [0, bedSide[1]], bedSide] : [[0, Z - .1], [0, Z - 1.6], [-xa, H.z1 + .3], [-xa, bedSide[1]], bedSide];
  const group = new THREE.Group(); let tris = 0; for (const [k, gs] of B) { const g = mergeGeometries(gs, false); gs.forEach(x => x.dispose()); const m = new THREE.Mesh(g, M[k]); m.name = k; m.castShadow = !['flame', 'ember', 'glow'].includes(k); m.receiveShadow = true; group.add(m); tris += g.attributes.position.count / 3; }
  const all = new THREE.Group(); all.add(hall.group, group);
  return { group: all, shell: hall.group, room: group, tris: Math.round(tris), draws: group.children.length, shellTris: hall.tris, shellCalls: hall.draws, inner: { x0: -X, x1: X, z0: -Z, z1: Z }, under, floor: FY, tieBeam: TB,
    fire, hearth: H, louver: hall.louver, door: { x: 0, z: d / 2, w: hall.door.w, h: hall.door.h }, doors: parted ? [{ x: dP.x, z: PZ, w: dP.w, h: dP.h, wall: 'partition' }] : [], partition: PZ, path, boxes, benches, bed, chest, cradle, lamp, lamp2, windows: hall.windows, w, d,
    plan: parted ? 'parted' : 'one', chimney: chim, stack, peis: peisB, narrow };
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

// a street's lots by Michael's mix (Session 1287: pieces.js's aurenneLot of Session 816, copied as it stands; #259 B): in every run of three lots one is Roman (which one, by the street's seed), two are flat.
// Each lot's own options come from a stream keyed by the street and the lot.
function aurenneLot(street, i) {
  const t = Math.floor(i / 3), roman = hashKey(`${street}:triple:${t}`) % 3 === i % 3, r = stream(`${street}:lot:${i}`);
  const w = +(6.4 + r() * 3.2).toFixed(2), d = +(6.0 + r() * 2.0).toFixed(2), o = { kind: roman ? 'tile' : 'flat', w, d, two: r() < (roman ? .4 : .5) };
  if (roman) { o.arcade = w > 7.6; } else { o.dome = w > 8.2 && r() < .45 ? (r() < .75 ? 'blue' : 'white') : null; o.stair = !o.two && r() < .55; o.pergola = r() < .45; o.lattice = o.two && r() < .65; o.pointed = r() < .2; }
  return { o, r };
}

// Aurenne's courtyard house (Session 1419: pieces.js's aurenneCourtyard of Session 899, copied as it stands; Michael's A on #329: 15 by 15 m,
// pantile sloping into the court). A rich house of the better quarter, OG-115's: blank plaster to the street, one arched door in a tile
// frame, a gallery round a court with its fountain and four orange trees. -> { group, tris, draws, w, d, solids, doors, front, top, ... }
function aurenneCourtyard(o = {}, r = stream('courtyard')) {
  const { put, wallGeo: wallG, box, finish } = aurKit(), S = o.size ?? 15, h = S / 2, T = .32, Ti = .24, C = 3.6, Rg = 2.2, pl = .24, yW = pl, F0 = yW + .02, F1 = yW + 3.1, SL = .2, BM = .18, A = h - T;
  const wallK = 'wall:' + (o.wall ?? Math.floor(r() * AUR.walls.length)), doorK = 'door:' + (o.door ?? Math.floor(r() * AUR.doors.length));
  const k = Math.tan(16 * Math.PI / 180), E0 = Rg - .35, yE = F1 + 2.35, Yr = d => yE + k * (d - E0), RT = .12, under = (x, z) => Yr(Math.max(Math.abs(x), Math.abs(z))) - RT - .12 /* the rafters */;
  const solids = [], doors = [], fl = y => (y > F1 - .5 ? 1 : 0);
  // a wall's footprint, cut at its doors (a hole that reaches the floor), for the room's checks
  const foot = (ax, c, a0, a1, y0, ht, holes, t) => { const ds = holes.filter(q => q.door).map(q => [q.at - q.w / 2, q.at + q.w / 2]).sort((p, q) => p[0] - q[0]); let s = a0;
    for (const q of holes.filter(q => q.door)) doors.push({ ax, c, at: q.at, w: q.w, h: q.h, fl: fl(y0) });
    for (const [d0, d1] of [...ds, [a1, a1]]) { if (d0 - s > .01) solids.push(ax === 'z' ? { tag: 'wall', x0: s, x1: d0, z0: c - t / 2, z1: c + t / 2, y0, y1: y0 + ht, fl: fl(y0) } : { tag: 'wall', x0: c - t / 2, x1: c + t / 2, z0: s, z1: d0, y0, y1: y0 + ht, fl: fl(y0) }); s = d1; } };
  // a wall along x at z (x0 to x1) and one along z at x (z0 to z1); a hole's `at` is its middle along the wall in the house's frame
  const wallZ = (z, x0, x1, y0, ht, holes = [], t = Ti) => { const xc = (x0 + x1) / 2; put(wallG(x1 - x0, ht, holes.map(q => ({ ...q, x: q.at - xc })), t), wallK, xc, y0, z); foot('z', z, x0, x1, y0, ht, holes, t); };
  const wallX = (x, z0, z1, y0, ht, holes = [], t = Ti) => { const zc = (z0 + z1) / 2; put(wallG(z1 - z0, ht, holes.map(q => ({ ...q, x: -(q.at - zc) })), t), wallK, x, y0, zc, Math.PI / 2); foot('x', x, z0, z1, y0, ht, holes, t); };
  const H0 = F1 - yW, top = Yr(h) + .45, H1 = top - F1, Hc = Yr(C + Ti / 2) - RT - F1;
  // ── the outer walls, by storey: the street door; small barred windows below (the house looks in, not out); arched windows above,
  // latticed on the street
  const door = { at: 0, y: 0, w: 1.1, h: 2.65, arch: 1, door: 1 }, upY = .75, win = (at, y, w, ht, arch = 1) => ({ at, y, w, h: ht, arch });
  put(box(S + .16, pl, S + .16), 'plinth', 0, pl / 2, 0);
  const outer = { front: [[door, win(-4.6, 1.5, .55, .75, 0), win(4.6, 1.5, .55, .75, 0)], [-4.6, -2.0, 2.0, 4.6].map(x => win(x, upY, .72, 1.25))],
    back: [[-4.4, 4.4].map(x => win(x, 1.6, .55, .7, 0)), [-5.0, -2.2, 2.2, 5.0].map(x => win(x, upY, .66, 1.1))], side: [[win(0, 1.5, .55, .75, 0)], [-1.9, 1.9].map(z => win(z, upY, .66, 1.1))] };
  for (const [s, F, Hs, st] of [[0, yW, H0, 0], [1, F1, H1, 1]]) {
    wallZ(h - T / 2, -h, h, F, Hs, outer.front[s], T); wallZ(-(h - T / 2), -h, h, F, Hs, outer.back[s].map(q => ({ ...q, at: -q.at })), T);
    for (const sx of [-1, 1]) wallX(sx * (h - T / 2), -A - .01, A + .01, F, Hs, outer.side[s], T); }
  // the cornice: four bars round the top of the outer walls
  const cornice = []; { const t2 = .5; for (const sz of [-1, 1]) cornice.push([0, sz * (h - t2 / 2 + .1), S + .2, t2]); for (const sx of [-1, 1]) cornice.push([sx * (h - t2 / 2 + .1), 0, t2, S + .2 - 2 * t2]); }
  put(box(S + .3, .14, .24), 'stone', 0, F1 - .02, h + .07); /* a string course over the door */
  // the street door: a tile frame, a stone step, its leaf of studded cedar boards to the arch's spring (left off when the rooms hang it
  // open), a cedar transom there and a fanlight of cedar spokes in the half-round (Session 1469: a house door's leaf is 2.1 m, as the
  // townhouse's and the coaching inn's are 2.2 under their fanlights, #514 A; the leaf had been 2.6 m to its crown, a church's)
  { const sh2 = door.h - door.w / 2, dz = h - T * .7, R = door.w / 2; if (!o.interior) { for (let i = 0; i < 6; i++) put(box(door.w / 6 - .012, sh2 + .02, .06), doorK, -door.w / 2 + (i + .5) * door.w / 6, yW + sh2 / 2, dz);
      for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) put(new THREE.SphereGeometry(.025, 6, 4), 'iron', -.45 + j * .3, yW + .4 + i * .5, dz + .04); }
    put(box(door.w + .02, .1, .12), 'cedar', 0, yW + sh2 + .05, dz); for (let i = 1; i < 6; i++) { const a = i * Math.PI / 6, g = box(.035, R - .1, .04); g.translate(0, (R - .1) / 2, 0); g.rotateZ(a - Math.PI / 2); put(g, 'cedar', 0, yW + sh2 + .1, dz); }
    put(new THREE.TorusGeometry(R * .55, .02, 4, 10, Math.PI), 'cedar', 0, yW + sh2 + .1, dz);
    put(box(door.w + .5, .12, .5), 'stone', 0, yW - .04, h + .2); const tz = h + .02, ts = .2, tp = yW + door.h + .14;
    for (const sx of [-1, 1]) put(box(ts, tp - yW - .05, .03), 'zellige', sx * (door.w / 2 + .2), yW + .05 + (tp - yW - .05) / 2, tz); put(box(door.w + .4 + ts, ts, .03), 'zellige', 0, tp + ts / 2, tz); }
  // windows: stone sills, iron bars below; lattice screens on brackets upstairs on the street; plain bars elsewhere
  const sides = [[0, 0, 1], [0, 0, -1], [1, 0, 0], [-1, 0, 0]];
  for (const [n, [nx, , nz]] of sides.entries()) { const list = n === 0 ? outer.front : n === 1 ? outer.back : outer.side;
    for (const [s, F] of [[0, yW], [1, F1]]) for (const q of list[s]) { if (q.door) continue; const at = n === 1 ? -q.at : q.at, cx = nz ? at : nx * h, cz = nz ? nz * h : at, ry = nz ? 0 : Math.PI / 2;
      put(box(q.w + .2, .08, .2), 'stone', cx + nx * .05, F + q.y - .04, cz + nz * .05, ry);
      if (n === 0 && s === 1) { const bw = q.w + .34, bh = q.h + .25, by = F + q.y + bh / 2 - .12; for (let i = 0; i <= 7; i++) put(box(i % 7 ? .035 : .07, bh, .04), 'cedar', cx - bw / 2 + i * bw / 7, by, h + .42);
        for (let i = 1; i < 10; i++) put(box(bw, .035, .035), 'cedar', cx, by - bh / 2 + i * bh / 10, h + .43); put(box(bw + .12, .08, .56), 'cedar', cx, by + bh / 2 + .04, h + .22); put(box(bw + .08, .08, .52), 'cedar', cx, by - bh / 2 - .04, h + .22);
        for (const sx of [-1, 1]) put(box(.08, .32, .3), 'cedar', cx + sx * (bw / 2 - .08), by - bh / 2 - .22, h + .12); continue; }
      const bh = q.h - (q.arch ? q.w / 2 : 0); for (let i = 0; i < 3; i++) { const off = -q.w / 3 + i * q.w / 3; put(new THREE.CylinderGeometry(.018, .018, bh, 5), 'iron', cx + (nz ? off : 0) - nx * .1, F + q.y + bh / 2, cz + (nz ? 0 : off) - nz * .1); } } }
  // ── the court's walls, by storey. Ground: the vestibule's arch and the store's and kitchen's doors (front), the hall's wide arch and two
  // low windows on the gallery (back), the stair hall's door (west), the dining room's door between two windows (east). Upstairs: a door
  // into each room; the bedroom's and the east room's windows on the gallery.
  const dr = (at, w = .9, ht = 2.2) => ({ at, y: 0, w, h: ht, arch: 1, door: 1 });
  const CW = { front: [[dr(0, 1.3, 2.6), dr(-2.4), dr(2.4)], [dr(-2.4, .9, 2.1), dr(0, .9, 2.1), dr(2.4, .9, 2.1)]], back: [[dr(0, 1.6, 2.7), win(-2.2, .5, .9, 1.7), win(2.2, .5, .9, 1.7)], [dr(0, 1.1, 2.15), win(-2.2, .6, .8, 1.25), win(2.2, .6, .8, 1.25)]],
    west: [[dr(2.6)], [dr(-2.6, .9, 2.1)]], east: [[dr(0, 1.1, 2.3), win(-1.9, .6, .8, 1.4), win(1.9, .6, .8, 1.4)], [dr(0, .9, 2.1), win(-1.9, .6, .8, 1.25), win(1.9, .6, .8, 1.25)]] };
  for (const [s, F, Hs] of [[0, yW, H0], [1, F1, Hc]]) {
    wallZ(C, -A, A, F, Hs, CW.front[s]); wallZ(-C, -A, A, F, Hs, CW.back[s]);
    wallX(-C, -C + Ti / 2, C - Ti / 2, F, Hs, CW.west[s]); wallX(C, -C + Ti / 2, C - Ti / 2, F, Hs, CW.east[s]);
    for (const sx of [-1, 1]) wallX(sx * 1.0, C + Ti / 2, A, F, Hs) /* the vestibule's walls, and over them the three front rooms' */; }
  // ── the floors: limestone throughout the ground floor and the court; upstairs, red tile on cedar boards on beams, open over the stair
  put(box(2 * A, F0 - yW, 2 * A), 'pave', 0, (yW + F0) / 2, 0);
  const N = 16, rise = (F1 - F0) / N, going = .26, SX = [-A, -A + 1.0], Z0 = C - Ti / 2 - .3, LZ = Z0 - (N - 1) * going, LZ0 = LZ - 1.0, keep = Math.floor((F1 - SL - BM - 2.0 - F0) / rise);
  const well = { x0: SX[0], x1: SX[1], z0: LZ0, z1: Z0 - keep * going };
  const B = Rg - .13, rects = [[-A, A, B, A], [-A, A, -A, -B], [-A, -B, -B, B], [B, A, -B, B]], cut = (q, w2) => { const [x0, x1, z0, z1] = q; if (w2.x0 >= x1 || w2.x1 <= x0 || w2.z0 >= z1 || w2.z1 <= z0) return [q];
    return [[x0, x1, z0, w2.z0], [x0, x1, w2.z1, z1], [x0, w2.x0, Math.max(z0, w2.z0), Math.min(z1, w2.z1)], [w2.x1, x1, Math.max(z0, w2.z0), Math.min(z1, w2.z1)]].filter(([a, b, c2, d2]) => b - a > .01 && d2 - c2 > .01); };
  for (const q of rects.flatMap(q => cut(q, well))) { const [x0, x1, z0, z1] = q; put(box(x1 - x0, SL - .03, z1 - z0), 'cedar', (x0 + x1) / 2, F1 - SL / 2 - .015, (z0 + z1) / 2); put(box(x1 - x0, .03, z1 - z0), 'floor', (x0 + x1) / 2, F1 - .015, (z0 + z1) / 2); }
  // the beams under it, across each range's short way (none over the gallery, which the boards span from the arcade to the wall)
  const beams = [], yB = F1 - SL - BM / 2;
  for (const sz of [-1, 1]) for (let x = -A + .45; x < A - .2; x += .9) { beams.push([x, sz]); put(box(.16, BM, A - C - Ti / 2), 'cedar', x, yB, sz * (C + Ti / 2 + A) / 2); }
  for (const sx of [-1, 1]) for (let z = -C + .6; z < C - .3; z += .9) { const over = sx < 0 && z > well.z0 - .1 && z < well.z1 + .1, x0 = over ? well.x1 : sx * A, x1 = sx * (C + Ti / 2); put(box(Math.abs(x1 - x0), BM, .16), 'cedar', (x0 + x1) / 2, yB, z); }
  // the stair: 15 masonry treads up the west wall from the front, a landing, the 16th riser onto the floor; a cedar rail round the well
  for (let i = 1; i < N; i++) { const z1 = Z0 - (i - 1) * going, z0 = Z0 - i * going; put(box(1.0, i * rise, going), wallK, (SX[0] + SX[1]) / 2, F0 + i * rise / 2, (z0 + z1) / 2); put(box(1.02, .04, going + .02), 'stone', (SX[0] + SX[1]) / 2, F0 + i * rise + .0, (z0 + z1) / 2);
    solids.push({ tag: 'stair', x0: SX[0], x1: SX[1], z0, z1, y0: F0, y1: F0 + i * rise, fl: 0 }); }
  put(box(1.0, F1 - rise - F0, LZ - LZ0), wallK, (SX[0] + SX[1]) / 2, (F0 + F1 - rise) / 2, (LZ + LZ0) / 2); solids.push({ tag: 'stair', x0: SX[0], x1: SX[1], z0: LZ0, z1: LZ, y0: F0, y1: F1 - rise, fl: 0 });
  { const rt = F1 + .95, rail = (x0, x1, z0, z1) => { const L = Math.max(x1 - x0, z1 - z0), n = Math.max(1, Math.round(L / .9)); for (let i = 0; i <= n; i++) { const x = x0 + (x1 - x0) * i / n, z = z0 + (z1 - z0) * i / n; put(box(.08, rt - F1, .08), 'cedar', x, (F1 + rt) / 2, z); }
      put(box(x1 - x0 + .1, .06, z1 - z0 + .1), 'cedar', (x0 + x1) / 2, rt + .03, (z0 + z1) / 2); for (const y of [.35, .65]) put(box(x1 - x0 + .04, .03, z1 - z0 + .04), 'cedar', (x0 + x1) / 2, F1 + y, (z0 + z1) / 2);
      solids.push({ tag: 'rail', x0: x0 - .05, x1: x1 + .05, z0: z0 - .05, z1: z1 + .05, y0: F1, y1: rt + .06, fl: 1 }); };
    rail(well.x1, well.x1, LZ, well.z1); rail(well.x0, well.x1, well.z1, well.z1); }
  // ── the gallery. Ground: the arcade on the column ring, three round arches a side on piers, a lathed column on each pier's court
  // face; a tiled kerb round the open court. Upstairs: cedar columns on the ring, the balustrade between them, the architrave the
  // eaves rest on.
  const n3 = 3, span = 2 * Rg / n3, At = .26, arcH = F1 - SL - yW, arch = [];
  for (let i = 0; i < n3; i++) arch.push({ at: -Rg + (i + .5) * span, y: 0, w: span - .36, h: arcH - .4, arch: 1, door: 1 });
  const n0 = solids.length; for (const sz of [-1, 1]) wallZ(sz * Rg, -Rg - At / 2, Rg + At / 2, yW, arcH, arch, At); for (const sx of [-1, 1]) wallX(sx * Rg, -Rg + At / 2, Rg - At / 2, yW, arcH, arch, At);
  for (const q of solids.slice(n0)) q.tag = 'pier';
  const colP = [[0, 0], [.17, 0], [.17, .12], [.12, .2], [.11, arcH - .55], [.14, arcH - .45], [.19, arcH - .36], [.19, arcH - .3], [0, arcH - .3]].map(([a, b]) => new THREE.Vector2(a, b));
  const ring = []; for (let i = 0; i <= n3; i++) { const t = -Rg + i * span; for (const sz of [-1, 1]) ring.push([t, sz * Rg]); if (i > 0 && i < n3) for (const sx of [-1, 1]) ring.push([sx * Rg, t]); }
  for (const [x, z] of ring) { const nx = Math.abs(x) >= Rg - .01 ? Math.sign(x) : 0, nz = Math.abs(z) >= Rg - .01 ? Math.sign(z) : 0, ox = Math.abs(nx) && Math.abs(nz) ? -nx * .12 : -nx * .12, oz = -nz * .12;
    put(new THREE.LatheGeometry(colP, 12), 'stone', x + ox, yW, z + oz); }
  for (const sz of [-1, 1]) put(box(2 * B, .14, .3), 'zellige', 0, F0 + .07, sz * (B - .15)); for (const sx of [-1, 1]) put(box(.3, .14, 2 * B - .6), 'zellige', sx * (B - .15), F0 + .07, 0);
  const yA = yE - .22, colU = [[0, 0], [.1, 0], [.1, .08], [.075, .14], [.07, yA - F1 - .2], [.1, yA - F1 - .1], [.12, yA - F1], [0, yA - F1]].map(([a, b]) => new THREE.Vector2(a, b));
  for (const [x, z] of ring) put(new THREE.LatheGeometry(colU, 10), 'cedar', x, F1, z);
  for (const sz of [-1, 1]) put(box(2 * Rg + .26, .22, .22), 'cedar', 0, yA + .11, sz * Rg); for (const sx of [-1, 1]) put(box(.22, .22, 2 * Rg - .22), 'cedar', sx * Rg, yA + .11, 0);
  { const bt = F1 + .95; for (const [nx, nz] of [[0, 1], [0, -1], [1, 0], [-1, 0]]) { const along = (a0, a1) => nz ? [a0, a1, nz * Rg - .04, nz * Rg + .04] : [nx * Rg - .04, nx * Rg + .04, a0, a1];
      for (let i = 0; i < n3; i++) { const a0 = -Rg + i * span + .12, a1 = -Rg + (i + 1) * span - .12, L = a1 - a0, [x0, x1, z0, z1] = along(a0, a1);
        put(box(nz ? L : .1, .07, nz ? .1 : L), 'cedar', (x0 + x1) / 2, bt - .035, (z0 + z1) / 2); put(box(nz ? L : .08, .05, nz ? .08 : L), 'cedar', (x0 + x1) / 2, F1 + .1, (z0 + z1) / 2);
        for (let a = a0 + .08; a < a1 - .04; a += .14) { const g = new THREE.LatheGeometry([[0, 0], [.025, 0], [.035, .2], [.02, .38], [.035, .58], [.025, .78], [0, .78]].map(([p, q]) => new THREE.Vector2(p, q)), 6); put(g, 'cedar', nz ? a : nx * Rg, F1 + .13, nz ? nz * Rg : a); }
        solids.push({ tag: 'balustrade', x0: Math.min(x0, x1) - .05, x1: Math.max(x0, x1) + .05, z0: Math.min(z0, z1) - .05, z1: Math.max(z0, z1) + .05, y0: F1, y1: bt, fl: 1 }); } } }
  for (const [x, z] of ring) solids.push({ tag: 'column', x0: x - .13, x1: x + .13, z0: z - .13, z1: z + .13, y0: F1, y1: yA, fl: 1 });
  // ── the roof: four pantile slopes from the parapet down to the eaves over the gallery, valleys of ridge tile at the corners, cedar
  // boards and rafters under it; a fascia at the eaves
  { const yo = Yr(h), C4 = [[-h, h], [h, h], [h, -h], [-h, -h]].map(([x, z]) => new THREE.Vector3(x, yo, z)), I4 = [[-E0, E0], [E0, E0], [E0, -E0], [-E0, -E0]].map(([x, z]) => new THREE.Vector3(x, yE, z));
    const plane = (pts, key, slopeX, down) => { const g = new THREE.BufferGeometry(), p = [], q = down ? [...pts].reverse() : pts; for (let i = 1; i < q.length - 1; i++) p.push(...q[0].toArray(), ...q[i].toArray(), ...q[i + 1].toArray());
      g.setAttribute('position', new THREE.Float32BufferAttribute(p, 3)); g.computeVertexNormals(); put(g, key, 0, 0, 0, 0, 0, 0, slopeX); };
    const low = v => v.clone().add(new THREE.Vector3(0, -RT, 0));
    for (let i = 0; i < 4; i++) { const j = (i + 1) % 4, sx = i % 2 === 1; plane([C4[i], C4[j], I4[j], I4[i]], 'pantile', sx) /* wound to face up */; plane([low(I4[i]), low(I4[j]), low(C4[j]), low(C4[i])], 'cedar', sx) /* wound as the tiles are, so it faces down */; }
    const rod = (P, Q2, rad) => { const L = P.distanceTo(Q2), g = new THREE.CylinderGeometry(rad, rad, L, 8, 1); g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), Q2.clone().sub(P).normalize())); g.translate(...P.clone().add(Q2).multiplyScalar(.5).toArray()); put(g, 'ridge'); };
    for (let i = 0; i < 4; i++) rod(I4[i].clone().add(new THREE.Vector3(0, .03, 0)), C4[i].clone().add(new THREE.Vector3(0, .03, 0)), .09);
    for (const sz of [-1, 1]) put(box(2 * E0 + .1, .2, .05), 'cedar', 0, yE - .1, sz * E0); for (const sx of [-1, 1]) put(box(.05, .2, 2 * E0 + .1), 'cedar', sx * E0, yE - .1, 0);
    const th = Math.atan(k); for (const sz of [-1, 1]) for (let x = -h + .6; x < h - .3; x += .75) { const d0 = Math.max(E0, Math.abs(x) + .12), d1 = A; if (d1 - d0 < .2) continue; const L = (d1 - d0) / Math.cos(th), dm = (d0 + d1) / 2;
      put(box(.08, .12, L), 'cedar', x, Yr(dm) - RT - .06, sz * dm, 0, -sz * th); }
    for (const sx of [-1, 1]) for (let z = -h + .6; z < h - .3; z += .75) { const d0 = Math.max(E0, Math.abs(z) + .12), d1 = A; if (d1 - d0 < .2) continue; const L = (d1 - d0) / Math.cos(th), dm = (d0 + d1) / 2;
      put(box(L, .12, .08), 'cedar', sx * dm, Yr(dm) - RT - .06, z, 0, 0, sx * th); } }
  // the cornice round the top of the outer walls
  for (const [x, z, a, b] of cornice) put(box(a, .14, b), 'stone', x, top + .07, z);
  // ── the court: the fountain (an octagonal basin faced in tile, a stone rim, water, a lathed pedestal with a bowl and a jet), four
  // orange trees in pots on the corners of the open court
  const fountain = { r: .95, y: F0 + .48 };
  { put(new THREE.CylinderGeometry(.95, .95, .42, 8), 'zellige', 0, F0 + .21, 0, Math.PI / 8); put(new THREE.TorusGeometry(.95, .07, 6, 8), 'stone', 0, F0 + .43, 0, Math.PI / 8, Math.PI / 2);
    put(new THREE.CylinderGeometry(.88, .88, .02, 8), 'water', 0, F0 + .37, 0, Math.PI / 8);
    put(new THREE.LatheGeometry([[0, 0], [.16, 0], [.12, .15], [.08, .7], [.12, .85], [.42, .95], [.44, 1.0], [.4, 1.0], [.1, .92], [0, .92]].map(([a, b]) => new THREE.Vector2(a, b)), 16), 'stone', 0, F0, 0);
    put(new THREE.CylinderGeometry(.4, .4, .02, 16), 'water', 0, F0 + .97, 0); put(new THREE.CylinderGeometry(.015, .03, .4, 6), 'water', 0, F0 + 1.15, 0);
    for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2, g = new THREE.TorusGeometry(.32, .012, 4, 10, Math.PI * .5); g.rotateY(-a); put(g, 'water', Math.cos(a) * .05, F0 + .72, Math.sin(a) * .05); }
    solids.push({ tag: 'fountain', x0: -.96, x1: .96, z0: -.96, z1: .96, y0: F0, y1: F0 + 1.1, fl: 0 }); }
  const trees = []; for (const [sx, sz] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) { const x = sx * 1.4, z = sz * 1.4; trees.push([x, z]);
    put(new THREE.LatheGeometry([[.001, 0], [.22, 0], [.3, .45], [.34, .5], [.001, .5]].map(([a, b]) => new THREE.Vector2(a, b)), 12), 'terra', x, F0, z);
    put(new THREE.CylinderGeometry(.04, .06, 1.1, 6), 'cedar', x, F0 + .95, z); const g = new THREE.IcosahedronGeometry(.62, 2), P = g.attributes.position; for (let i = 0; i < P.count; i++) { const f = 1 + .14 * Math.sin(P.getX(i) * 9 + P.getZ(i) * 7 + sx * 2) * Math.cos(P.getY(i) * 8 + sz); P.setXYZ(i, P.getX(i) * f, P.getY(i) * f * .9, P.getZ(i) * f); }
    g.computeVertexNormals(); put(g, 'leaf', x, F0 + 1.95, z); for (let j = 0; j < 9; j++) { const a = r() * Math.PI * 2, b = (r() - .3) * 1.2; put(new THREE.SphereGeometry(.05, 6, 5), 'orange', x + Math.cos(a) * Math.cos(b) * .6, F0 + 1.95 + Math.sin(b) * .5, z + Math.sin(a) * Math.cos(b) * .6); }
    solids.push({ tag: 'tree', x0: x - .34, x1: x + .34, z0: z - .34, z1: z + .34, y0: F0, y1: F0 + 2.6, fl: 0 }); }
  const { group, tris, draws, roofTop } = finish(); group.userData = { roofTop, kind: 'courtyard' };
  return { group, tris, draws, roofTop, kind: 'courtyard', w: S, d: S, A, C, Rg, Ti, T, yW, F0, F1, SL, BM, yE, yA, Yr, under, solids, doors, beams, stair: { x0: SX[0], x1: SX[1], z0: LZ, z1: Z0, rise: +rise.toFixed(4), going, n: N, landing: [LZ0, LZ] }, well, fountain, trees, front: h + .5, top, outer /* the outer walls' windows by storey, for the rooms' daylight (Session 1425) */ };
}

function aurenneHouse(o, r) {
  const { Mt, put, wallGeo: wallG, box, finish } = aurKit(), w = o.w, d = o.d;
  const T = .32, pl = .24, fh = 3.0, H = fh + (o.two ? 2.6 : 0), wallK = 'wall:' + (o.wall ?? Math.floor(r() * AUR.walls.length)), doorK = 'door:' + (o.door ?? Math.floor(r() * AUR.doors.length));
  const wallGeo = (len, ht, holes, t = T) => wallG(len, ht, holes, t);
  // the openings, by storey: an arched door on the front, windows small and deep as in a hot country
  const front = [], back = [], side = [], doorW = 1.05, doorH = 2.1, dx = o.kind === 'tile' ? 0 : (r() < .5 ? -1 : 1) * Math.min(w * .18, 1.1);
  // (Session 1321: the door 2.1 m to its head, was 2.0; 12 cm off its middle the half-round leaf read 1.95 m, under F2a's table: 1.1 of a 1.8 m person)
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
  // o.stairWin (Session 1307, the tavern's rooms): the west wall's ground window raised to { y, h }, a stair light over a flight up that wall
  const sideW = o.stairWin ? side.map(h => h.up ? h : { ...h, ...o.stairWin }) : side;
  put(wallGeo(d - 2 * T + .02, H, side), wallK, w / 2 - T / 2, yW, 0, Math.PI / 2); put(wallGeo(d - 2 * T + .02, H, sideW), wallK, -w / 2 + T / 2, yW, 0, -Math.PI / 2);
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
  for (const sx of [-1, 1]) for (const h of sx < 0 ? sideW : side) put(box(h.w + .2, .08, .2), 'stone', sx * (w / 2 + .05), yW + h.y - .04, 0, sx * Math.PI / 2);
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
  group.userData = { roofTop, kind: o.kind }; return { group, roofTop, tris, draws, kind: o.kind, front: depthOut, open: { front, back, side, west: sideW }, doorX: dx, T, fh, yW, top };
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
// ── the Church of the Weaver (Session 1305; card F6, Michael's C on #294: the dome by rank). Copied from pieces.js's aurenneChurch of
// Session 832 (with Session 885's rank and Session 947's o.interior) as it stands, UVS read as the kit's AUR_UVS. A cube of limewashed
// ashlar on a podium with three steps, tall arched windows, a band of glazed tile under the cornice; a drum with twelve arched lights and
// the great dome, in blue glaze (a town's, a cathedral's) or limewash (a village's), the Weaver's gilt shuttle on its top; an arcaded
// porch across the front; a square bell tower with an open belfry and a little dome; a cypress either side of the steps.
// o.rank 'village' | 'town' | 'cathedral', o.dome, o.w (12 to 22 m), o.tower 0 | 1 | 2, o.corners, o.wall, o.door, o.interior.
// aurenneChurch(o, r) -> { group, roofTop, tris, draws, kind: 'church', front, domeTop, towerTop, door, inner }.
function aurenneChurch(o, r) {
  const { put, wallGeo, box, finish } = aurKit(), W = o.w || 14, D = W, T = .8, pl = .9, H = +(W * .72).toFixed(2), pd = 4.4, wallK = 'wall:' + (o.wall ?? 4), rank = o.rank || (o.corners ? 'cathedral' : 'town'), dome = o.dome || (rank === 'village' ? 'white' : 'blue'), domeK = dome === 'white' ? wallK : 'glaze';
  const lathe = (pts, n) => new THREE.LatheGeometry(pts.map(([a, b]) => new THREE.Vector2(a, b)), n);
  const domeUV = (g, rad) => { if (domeK === 'glaze') g.userData.uvRep = [Math.max(1, Math.round(2 * Math.PI * rad * AUR_UVS.glaze)), Math.max(1, Math.round(rad * 1.7 * AUR_UVS.glaze))]; return g; };
  // the podium the church and its porch stand on, and three steps down to the square
  const front = D / 2 + pd + .6; put(box(W + 1.2, pl, D + pd + 1.2), 'plinth', 0, pl / 2, pd / 2);
  for (let i = 0; i < 3; i++) { const h = pl * (3 - i) / 4; put(box(W * .55, h, .46), 'stone', 0, h / 2, front + .23 + i * .46); }
  // the walls: the great door on the front, two tall windows beside it; three tall windows on each side and on the back
  const tall = n => { const hs = [], wi = Math.min(1.5, W * .08); for (let i = 0; i < n; i++) hs.push({ x: -W / 2 + (i + .5) * W / n, y: 3.2, w: wi, h: H * .42, arch: 1 }); return hs; };
  const door = { x: 0, y: 0, w: 2.6, h: 5.2, arch: 1, door: 1 }, fh = [door, { x: -W * .3, y: 3.2, w: Math.min(1.5, W * .08), h: H * .42, arch: 1 }, { x: W * .3, y: 3.2, w: Math.min(1.5, W * .08), h: H * .42, arch: 1 }];
  put(wallGeo(W, H, fh, T), wallK, 0, pl, D / 2 - T / 2); put(wallGeo(W, H, tall(3), T), wallK, 0, pl, -D / 2 + T / 2, Math.PI);
  for (const sx of [-1, 1]) put(wallGeo(D - 2 * T + .02, H, tall(3), T), wallK, sx * (W / 2 - T / 2), pl, 0, sx * Math.PI / 2);
  if (!o.interior) put(box(W - 2 * T, H - .4, D - 2 * T), 'dark', 0, pl + (H - .4) / 2, 0);
  // stone sills, and an iron grille in each window
  for (let f = 0; f < 4; f++) { const ry = [0, Math.PI, Math.PI / 2, -Math.PI / 2][f], hs = f ? tall(3) : fh.slice(1), cz = f < 2 ? D / 2 : W / 2;
    for (const h of hs) { const c = Math.cos(ry), sn = Math.sin(ry), at = (lx, z) => [lx * c + z * sn, -lx * sn + z * c];
      const [sx2, sz2] = at(h.x, cz + .08); put(box(h.w + .3, .12, .3), 'stone', sx2, pl + h.y - .06, sz2, ry);
      for (let i = 1; i < 4; i++) { const [gx, gz] = at(h.x - h.w / 2 + i * h.w / 4, cz - T * .5); put(new THREE.CylinderGeometry(.025, .025, h.h - h.w / 2, 5), 'iron', gx, pl + h.y + (h.h - h.w / 2) / 2, gz, ry); } } }
  // the great door: two leaves of cedar boards under the half-round head, set in the reveal, a frame of glazed tile round it
  { const dz = D / 2 - T * .6, sh = door.h - door.w / 2, doorK = 'door:' + (o.door ?? 3); if (!o.interior) for (let i = 0; i < 8; i++) put(box(door.w / 8 - .015, sh + .02, .08), doorK, -door.w / 2 + (i + .5) * door.w / 8, pl + sh / 2, dz);
    if (!o.interior) put(new THREE.CylinderGeometry(door.w / 2, door.w / 2, .08, 18, 1, false, -Math.PI / 2, Math.PI), doorK, 0, pl + sh, dz, 0, -Math.PI / 2);
    if (!o.interior) for (let i = 0; i < 4; i++) for (let k = 0; k < 2; k++) put(new THREE.SphereGeometry(.04, 6, 4), 'iron', (k ? 1 : -1) * door.w * .3, pl + .6 + i * .95, dz + .05);
    const ts = .3, top = pl + door.h + .2; for (const sx of [-1, 1]) put(box(ts, top - pl, .04), 'zellige', sx * (door.w / 2 + .3), pl + (top - pl) / 2, D / 2 + .02); put(box(door.w + .6 + ts, ts, .04), 'zellige', 0, top + ts / 2, D / 2 + .02); }
  // the band of glazed tile under the cornice, the cornice, the flat roof behind a parapet
  const top = pl + H; for (const [len, x, z, ry] of [[W, 0, D / 2 + .02, 0], [W, 0, -D / 2 - .02, Math.PI], [D, W / 2 + .02, 0, Math.PI / 2], [D, -W / 2 - .02, 0, -Math.PI / 2]]) put(box(len, .7, .04), 'zellige', x, top - 1.1, z, ry);
  const R = W * .31, dh = R * .72, y0 = top + .4, nl = 12, Ri = R - .45;
  if (!o.interior) { put(box(W + .6, .4, D + .6), 'stone', 0, top + .2, 0); put(box(W - .2, .2, D - .2), 'plinth', 0, top + .1, 0); }
  else { const sq = new THREE.Shape(), hw = (W + .6) / 2; sq.moveTo(-hw, -hw); sq.lineTo(hw, -hw); sq.lineTo(hw, hw); sq.lineTo(-hw, hw); sq.lineTo(-hw, -hw); const hole = new THREE.Path(); hole.absarc(0, 0, Ri, 0, Math.PI * 2, true); sq.holes.push(hole);
    const g = new THREE.ExtrudeGeometry(sq, { depth: .4, bevelEnabled: false, curveSegments: 36 }); g.rotateX(-Math.PI / 2); put(g, 'stone', 0, top, 0); }
  for (const sz of [1, -1]) put(box(W + .3, .8, .35), wallK, 0, top + .8, sz * (D / 2 + .1)); for (const sx of [-1, 1]) put(box(.35, .8, D - .4), wallK, sx * (W / 2 + .1), top + .8, 0);
  // the drum, its arched lights, the dome, the stone rings, and the Weaver's shuttle on a gilt rod
  put(new THREE.CylinderGeometry(R, R * 1.03, dh, 36, 1, true), wallK, 0, y0 + dh / 2, 0); if (!o.interior) put(new THREE.CylinderGeometry(R - .5, R - .5, dh, 24), 'dark', 0, y0 + dh / 2, 0);
  // inside (o.interior): the drum lined from the ceiling's oculus up, facing in (a lathe drawn top to bottom), a ring under the dome,
  // and the dome painted inside, its crown under the outer dome's
  if (o.interior) { put(lathe([[Ri, dh], [Ri, -.4]], 36), wallK, 0, y0, 0); put(new THREE.TorusGeometry(Ri - .05, .1, 6, 36), 'gold', 0, y0 + dh, 0, 0, Math.PI / 2);
    const pts = []; for (let i = 16; i >= 0; i--) { const a = i / 16 * Math.PI / 2; pts.push([Math.max(.001, Ri * Math.cos(a)), Ri * 1.12 * Math.sin(a)]); } put(lathe(pts, 36), 'heaven', 0, y0 + dh, 0); }
  { const lw = Math.min(1.1, 2 * Math.PI * R / nl * .38), lh = dh * .6, sh = new THREE.Shape(); sh.moveTo(-lw / 2, 0); sh.lineTo(lw / 2, 0); sh.lineTo(lw / 2, lh - lw / 2); sh.absarc(0, lh - lw / 2, lw / 2, 0, Math.PI, false); sh.lineTo(-lw / 2, 0);
    for (let i = 0; i < nl; i++) { const a = (i + .5) / nl * Math.PI * 2; put(new THREE.ShapeGeometry(sh, 6), 'dark', Math.sin(a) * (R + .03), y0 + dh * .2, Math.cos(a) * (R + .03), a); if (o.interior) put(new THREE.ShapeGeometry(sh, 6), 'sky', Math.sin(a) * (Ri - .03), y0 + dh * .2, Math.cos(a) * (Ri - .03), a + Math.PI); put(box(lw + .2, .1, .25), 'stone', Math.sin(a) * (R + .06), y0 + dh * .2 - .05, Math.cos(a) * (R + .06), a); } }
  put(new THREE.TorusGeometry(R * 1.03, .14, 6, 36), 'stone', 0, y0 + .05, 0, 0, Math.PI / 2); put(new THREE.TorusGeometry(R * 1.02, .12, 6, 36), 'stone', 0, y0 + dh, 0, 0, Math.PI / 2);
  const dTop = y0 + dh + R * 1.12; { const pts = []; for (let i = 0; i <= 16; i++) { const a = i / 16 * Math.PI / 2; pts.push([Math.max(.001, R * Math.cos(a) * (1 + .05 * Math.sin(a * 2))), R * 1.12 * Math.sin(a)]); } put(domeUV(lathe(pts, 40), R), domeK, 0, y0 + dh, 0); }
  put(lathe([[.001, 0], [.45, 0], [.3, .35], [.18, .5], [.22, .7], [.001, .75]], 14), 'stone', 0, dTop - .05, 0);
  put(new THREE.CylinderGeometry(.06, .06, 2.2, 8), 'gold', 0, dTop + 1.6, 0); put(new THREE.SphereGeometry(.3, 14, 10), 'gold', 0, dTop + 1.1, 0);
  // the shuttle sits on the rod's tip and leans, so that from the square it reads as the Weaver's tool and not as a cross
  { const L = 1.5, g = lathe([[.001, -L], [.08, -L * .8], [.22, -L * .35], [.26, 0], [.22, L * .35], [.08, L * .8], [.001, L]], 12); g.rotateZ(Math.PI / 2); g.scale(1, .55, 1); g.rotateZ(.38); put(g, 'gold', 0, dTop + 2.85, 0); }
  // a cathedral's four small domes at the cube's corners, each on a little drum
  if (o.corners) for (const [sx, sz] of [[1, 1], [1, -1], [-1, 1], [-1, -1]]) { const r2 = W * .085, x = sx * (W / 2 - r2 - .5), z = sz * (D / 2 - r2 - .5), y = top + .4, pts = [];
    put(new THREE.CylinderGeometry(r2, r2, r2 * 1.1, 16), wallK, x, y + r2 * .55, z); for (let i = 0; i <= 8; i++) { const a = i / 8 * Math.PI / 2; pts.push([Math.max(.001, r2 * Math.cos(a)), r2 * 1.1 * Math.sin(a)]); }
    put(domeUV(lathe(pts, 18), r2), domeK, x, y + r2 * 1.1, z); put(new THREE.SphereGeometry(.14, 8, 6), 'gold', x, y + r2 * 2.2 + .1, z); }
  // the porch: an arcade of round arches on columns across the front, an arch at each end, a flat roof behind a parapet
  { const n = W > 16 ? 7 : 5, span = (W + .4) / n, colH = 4.2, ah = colH + span / 2 + .9, az = D / 2 + pd - .3, hs = [];
    for (let i = 0; i < n; i++) hs.push({ x: -(W + .4) / 2 + (i + .5) * span, y: 0, w: span - .55, h: colH + (span - .55) / 2, arch: 1 });
    put(wallGeo(W + .4, ah, hs, .6), wallK, 0, pl, az);
    for (const sx of [-1, 1]) put(wallGeo(pd - .3, ah, [{ x: 0, y: 0, w: Math.min(2.2, pd - 1.6), h: colH + 1, arch: 1 }], .6), wallK, sx * (W / 2 - .1), pl, D / 2 + (pd - .3) / 2, sx * Math.PI / 2);
    const lp = [[0, 0], [.26, 0], [.26, .16], [.19, .26], [.17, colH - .38], [.21, colH - .24], [.3, colH - .1], [.3, colH], [0, colH]];
    for (let i = 0; i <= n; i++) { const x = Math.max(-W / 2 + .1, Math.min(W / 2 - .1, -(W + .4) / 2 + i * span)); put(lathe(lp, 14), 'stone', x, pl, az + .4); }
    put(box(W + .6, .3, pd + .2), 'stone', 0, pl + ah + .15, D / 2 + pd / 2 - .1); put(box(W + .4, .5, .04), 'zellige', 0, pl + ah - .45, az + .32);
    put(box(W + .5, .55, .3), wallK, 0, pl + ah + .57, az + .1); }
  // the bell tower: a square shaft with slit windows, a string course, an open belfry with a bell in it, a cornice and a small dome
  let towerTop = 0; for (let t = 0; t < (o.tower ?? 1); t++) { const sx = t ? -1 : 1, s = 3.6, Ht = +(H * 1.9).toFixed(2), bh = 4.2, x = sx * (W / 2 + s / 2 + .4), z = D / 2 + pd - s / 2 - .2, sh = Ht - bh;
    put(box(s + .4, pl, s + .4), 'plinth', x, pl / 2, z); put(box(s, sh, s), wallK, x, pl + sh / 2, z);
    for (let k = 1; k <= 3; k++) put(box(.28, 1.2, .06), 'dark', x, pl + k * sh / 4, z + s / 2 + .01);
    put(box(s + .3, .3, s + .3), 'stone', x, pl + sh * .55, z); put(box(s + .4, .35, s + .4), 'stone', x, pl + sh + .17, z);
    for (let f = 0; f < 4; f++) { const ry = f * Math.PI / 2; put(wallGeo(s, bh, [{ x: 0, y: .5, w: 1.5, h: 3.0, arch: 1 }], .5), wallK, x + Math.sin(ry) * (s / 2 - .25), pl + sh + .35, z + Math.cos(ry) * (s / 2 - .25), ry); }
    put(lathe([[.001, 0], [.75, 0], [.7, .1], [.45, .6], [.35, 1.25], [.001, 1.3]], 16), 'gold', x, pl + sh + bh - 1.75, z);
    const ty = pl + sh + .35 + bh; put(box(s + .5, .4, s + .5), 'stone', x, ty + .2, z); const rt = s * .44, pts = []; for (let i = 0; i <= 10; i++) { const a = i / 10 * Math.PI / 2; pts.push([Math.max(.001, rt * Math.cos(a)), rt * 1.15 * Math.sin(a)]); }
    put(new THREE.CylinderGeometry(rt, rt, .6, 20), wallK, x, ty + .7, z); put(domeUV(lathe(pts, 22), rt), domeK, x, ty + 1, z); put(new THREE.CylinderGeometry(.04, .04, 1.2, 6), 'gold', x, ty + 1 + rt * 1.15 + .5, z); put(new THREE.SphereGeometry(.16, 10, 8), 'gold', x, ty + 1 + rt * 1.15 + .3, z);
    towerTop = Math.max(towerTop, ty + 1 + rt * 1.15 + 1.1); }
  // a cypress either side of the steps
  for (const sx of [-1, 1]) { const ht = 7 + r() * 2, x = sx * (W * .275 + 1.4), z = front + .5, cp = [[.001, 0], [.6, .4], [.75, ht * .35], [.55, ht * .75], [.001, ht]];
    const g = lathe(cp, 12), P = g.attributes.position; for (let i = 0; i < P.count; i++) { const k = 1 + .12 * Math.sin(P.getY(i) * 5 + Math.atan2(P.getZ(i), P.getX(i)) * 5 + r() * .5); P.setX(i, P.getX(i) * k); P.setZ(i, P.getZ(i) * k); } g.computeVertexNormals();
    put(g, 'leaf2', x, .3, z); put(lathe([[.001, 0], [.4, 0], [.5, .3], [.46, .55], [.001, .55]], 12), 'terra', x, 0, z); }
  const out = finish(); out.group.userData = { roofTop: out.roofTop, kind: 'church', domeTop: dTop, towerTop };
  return { ...out, kind: 'church', front: front + 1.4, domeTop: dTop, towerTop, door, inner: { W, D, T, pl, H, top, R, Ri, y0, dh, crown: y0 + dh + Ri * 1.12 } };
}
// the church's ground, measured once for each size and kept (Session 1305: a town lays its plot before it builds): its box in the
// church's own frame, the door's middle at x 0 on the front; the cypresses' heights are the only rolls, and they stand inside it
const AU_CH_BOX = new Map();
function aurenneChurchBox(o) {
  const key = `${o.w || 14}:${o.tower ?? 1}`; if (AU_CH_BOX.has(key)) return AU_CH_BOX.get(key);
  const C = aurenneChurch(Object.assign({}, o), stream('church:box')), b = new THREE.Box3().setFromObject(C.group);
  C.group.traverse(m => { if (m.isMesh) m.geometry.dispose(); });
  const out = { x0: b.min.x, x1: b.max.x, z0: b.min.z, z1: b.max.z, y1: b.max.y, front: C.front, domeTop: C.domeTop, towerTop: C.towerTop, inner: C.inner };
  AU_CH_BOX.set(key, out); return out;
}
// aurenneChurchHall(o, r) (Session 947, card F9; OG-043's Aurenne temple, OG-061's domed hall; the canon's §1.3 and §3): the Church of the
//   Weaver inside, built in aurenneChurch's town church (14 m, o.interior: the ceiling open in an oculus into the drum, the dome painted
//   inside). A limestone floor with a roundel of tile under the dome, the bier of the dead under the oculus with its pall and four tall
//   candlesticks, cedar benches either side of the aisle by the door, the sanctuary two steps up across the back, the altar on it under
//   the gilt shuttle on chains, the lectern and its book, a panel of tile behind; a ring of twelve lamps under the dome; a tile dado; the
//   great door's leaves open inside. Copied from rooms.js as it stands (Session 1326); o.shell is the shell's stream key (the game passes
//   the town's, so the shell is the street's church). -> { group, shell, room, tris, draws, inner, floor, ceil, oculus, bier, sanctuary,
//   altar, shuttle, lectern, benches, ring, door, paths, boxes, w, d, front }
function aurenneChurchHall(o = {}, r = stream('church')) {
  const C = aurenneChurch({ rank: 'town', w: 14, tower: 1, interior: true }, stream(o.shell || 'church-shell')), I = C.inner, shell = C.group;
  const M = { ...homeMats(), gold: new THREE.MeshStandardMaterial({ color: 0xc8952e, roughness: .3, metalness: .75 }), wax: new THREE.MeshStandardMaterial({ color: 0xeee2c4, roughness: .6 }), flame: roomMats().flame, glow: roomMats().glow, linen: roomMats().linen,
    marble: mat('plaster', { ns: .25, color: 0xf2eee6, rough: .3 }), iron: roomMats().iron }, B = new Map(), boxes = [];
  const X = I.W / 2 - I.T, Z = I.D / 2 - I.T, F0 = I.pl, CEIL = I.top;
  const put = (geo, key, x = 0, y = 0, z = 0, ry = 0, uv = .6, rx = 0, rz = 0) => { const g = geo.index ? geo.toNonIndexed() : geo; for (const k of Object.keys(g.attributes)) if (!['position', 'normal'].includes(k)) g.deleteAttribute(k);
    g.applyMatrix4(new THREE.Matrix4().compose(new THREE.Vector3(x, y, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(rx, ry, rz)), new THREE.Vector3(1, 1, 1))); worldUV(g, uv); if (!B.has(key)) B.set(key, []); B.get(key).push(g); return g; };
  const bx = (key, x0, x1, y0, y1, z0, z1, tag) => { put(new THREE.BoxGeometry(x1 - x0, y1 - y0, z1 - z0), key, (x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2); if (tag) boxes.push({ tag, x0, x1, y0, y1, z0, z1 }); };
  const chain = (x, y0, y1, z) => bx('iron', x - .012, x + .012, y0, y1, z - .012, z + .012);
  // the floor: limestone, and under the dome a roundel of tile in a ring of marble
  bx('limestone', -X, X, F0, F0 + .03, -Z, Z); put(new THREE.CylinderGeometry(2.6, 2.6, .012, 40), 'marble', 0, F0 + .036, 0, 0, .5); put(new THREE.CylinderGeometry(2.3, 2.3, .014, 40), 'zellige', 0, F0 + .038, 0, 0, .9);
  // the tile dado round the walls, 1.4 m high, broken at the great door
  const dado = 1.4, dw = 1.3 + .45; for (const [x0, x1, z0, z1] of [[-X, X, -Z, -Z + .02], [-X, -X + .02, -Z, Z], [X - .02, X, -Z, Z], [-X, -dw, Z - .02, Z], [dw, X, Z - .02, Z]]) bx('zellige', x0, x1, F0, F0 + dado, z0, z1);
  for (const [x0, x1, z0, z1] of [[-X, X, -Z, -Z + .05], [-X, -X + .05, -Z, Z], [X - .05, X, -Z, Z], [-X, -dw, Z - .05, Z], [dw, X, Z - .05, Z]]) bx('step', x0, x1, F0 + dado, F0 + dado + .06, z0, z1);
  // the sanctuary at the back: a platform two steps up across the back wall, the altar on it, a panel of tile behind it under the middle window
  const SY = F0 + .32, sanctuary = { x0: -4.2, x1: 4.2, z0: -Z, z1: -3.3, y: SY }; bx('step', sanctuary.x0, sanctuary.x1, F0, SY, -Z, sanctuary.z1, 'sanctuary'); bx('step', -2.4, 2.4, F0, F0 + .16, sanctuary.z1, sanctuary.z1 + .34, 'sanctuary');
  bx('zellige', -2.3, 2.3, SY + dado, SY + 2.7, -Z, -Z + .03); for (const [x0, x1, y0, y1] of [[-2.4, 2.4, SY + 2.7, SY + 2.82], [-2.42, -2.3, SY + dado, SY + 2.82], [2.3, 2.42, SY + dado, SY + 2.82]]) bx('gold', x0, x1, y0, y1, -Z, -Z + .05);
  const altar = { x0: -1.0, x1: 1.0, z0: -4.6, z1: -3.85, y: SY + 1.0 }; { const { x0, x1, z0, z1, y } = altar; bx('marble', x0 + .08, x1 - .08, SY, y - .1, z0 + .08, z1 - .08, 'altar'); bx('marble', x0, x1, y - .1, y, z0, z1, 'altar'); bx('zellige', x0 + .2, x1 - .2, SY + .15, y - .25, z1 - .07, z1 - .06);
    bx('linen', x0 + .05, x1 - .05, y, y + .005, z0 + .05, z1 - .05); for (const xx of [x0 + .25, x1 - .25]) { put(new THREE.CylinderGeometry(.06, .09, .35, 10), 'gold', xx, y + .175, (z0 + z1) / 2); put(new THREE.CylinderGeometry(.03, .03, .3, 8), 'wax', xx, y + .5, (z0 + z1) / 2); put(new THREE.SphereGeometry(.018, 6, 5).scale(1, 2.2, 1), 'flame', xx, y + .69, (z0 + z1) / 2); }
    bx('indigo', -.25, .25, y, y + .06, (z0 + z1) / 2 - .17, (z0 + z1) / 2 + .17); bx('saffron', -.24, .24, y + .06, y + .065, (z0 + z1) / 2 - .16, (z0 + z1) / 2 + .16); }
  // the Weaver's sign: a gilt shuttle 2.2 m long hung level over the altar on two chains from the ceiling, a bobbin of gold thread in it
  const shuttle = { x: 0, y: SY + 3.6, z: (altar.z0 + altar.z1) / 2, L: 2.2 }; { const { x, y, z, L } = shuttle, h = L / 2, g = new THREE.LatheGeometry([[.001, -h], [.06, -h * .82], [.17, -h * .4], [.2, 0], [.17, h * .4], [.06, h * .82], [.001, h]].map(([a, b]) => new THREE.Vector2(a, b)), 16);
    g.scale(1, 1, .6); put(g, 'gold', x, y, z, 0, .6, 0, Math.PI / 2); put(new THREE.CylinderGeometry(.08, .08, .5, 12), 'saffron', x, y, z, 0, .6, 0, Math.PI / 2); for (const dx of [-.7, .7]) chain(x + dx, y + .1, CEIL, z); }
  // the lectern on the sanctuary's left: a cedar post and a sloped desk with the great book open on it
  const lectern = { x: -2.9, z: -3.95, y: SY + 1.12 }; { const { x, z, y } = lectern; bx('cedarD', x - .25, x + .25, SY, SY + .06, z - .25, z + .25, 'lectern'); put(new THREE.CylinderGeometry(.06, .08, 1.0, 8), 'cedarD', x, SY + .55, z);
    const desk = put(new THREE.BoxGeometry(.6, .04, .45), 'cedarD', x, y - .02, z, 0, .6, -.35); const bk = put(new THREE.BoxGeometry(.5, .06, .36), 'linen', x, y + .03, z + .02, 0, .6, -.35); bx('madder', x - .02, x + .02, y + .02, y + .07, z - .19, z + .21); }
  // the bier of the dead under the oculus: a marble slab on two trestles of cedar, a pall of indigo with a saffron border, a
  // candlestick at each corner
  const bier = { x0: -.45, x1: .45, z0: -1.05, z1: 1.05, y: F0 + .72 }; { const { x0, x1, z0, z1, y } = bier; for (const zz of [z0 + .2, z1 - .28]) { bx('cedarD', x0 + .05, x1 - .05, y - .2, y - .12, zz, zz + .08, 'bier'); for (const xx of [x0 + .07, x1 - .13]) bx('cedarD', xx, xx + .06, F0, y - .12, zz, zz + .08, 'bier'); }
    bx('marble', x0, x1, y - .12, y, z0, z1, 'bier'); bx('indigo', x0 - .06, x1 + .06, y, y + .01, z0 + .1, z1 - .1); for (const s of [-1, 1]) { bx('indigo', s > 0 ? x1 + .05 : x0 - .06, s > 0 ? x1 + .06 : x0 - .05, y - .42, y + .01, z0 + .1, z1 - .1); bx('saffron', s > 0 ? x1 + .055 : x0 - .065, s > 0 ? x1 + .065 : x0 - .055, y - .44, y - .36, z0 + .1, z1 - .1); }
    for (const [sx, sz] of [[-1, -1], [-1, 1], [1, -1], [1, 1]]) { const cx = sx * .78, cz = sz * 1.3; put(new THREE.CylinderGeometry(.14, .17, .06, 12), 'gold', cx, F0 + .06, cz); put(new THREE.CylinderGeometry(.025, .035, 1.25, 8), 'gold', cx, F0 + .68, cz); put(new THREE.CylinderGeometry(.07, .03, .06, 10), 'gold', cx, F0 + 1.32, cz);
      put(new THREE.CylinderGeometry(.03, .032, .26, 8), 'wax', cx, F0 + 1.48, cz); put(new THREE.SphereGeometry(.018, 6, 5).scale(1, 2.2, 1), 'flame', cx, F0 + 1.64, cz); boxes.push({ tag: 'candlestick', x0: cx - .17, x1: cx + .17, y0: F0, y1: F0 + 1.66, z0: cz - .17, z1: cz + .17 }); } }
  // the ring of lamps under the dome: a bronze hoop on chains from the dome's crown, twelve lamps of glass with a flame in each
  const ring = { y: F0 + 4.2, r: 1.7 }; { put(new THREE.TorusGeometry(ring.r, .04, 6, 36), 'gold', 0, ring.y, 0, 0, .6, Math.PI / 2); chain(0, ring.y + 1.2, I.crown - .05, 0);
    for (let k = 0; k < 4; k++) { const a = k / 4 * Math.PI * 2 + .4, ex = Math.cos(a) * ring.r, ez = Math.sin(a) * ring.r, g = new THREE.CylinderGeometry(.008, .008, Math.hypot(ring.r, 1.2), 4); g.rotateZ(Math.atan2(ring.r, 1.2)); g.rotateY(-a); put(g, 'iron', ex / 2, ring.y + .6, ez / 2); }
    for (let k = 0; k < 12; k++) { const a = k / 12 * Math.PI * 2, lx = Math.cos(a) * ring.r, lz = Math.sin(a) * ring.r; put(new THREE.CylinderGeometry(.06, .03, .12, 8), 'glow', lx, ring.y - .05, lz); } }
  // cedar benches either side of the aisle, four rows, back from the door
  const benches = []; for (let k = 0; k < 4; k++) { const z0 = 2.5 + k * .85; for (const [x0, x1] of [[-4.6, -1.0], [1.0, 4.6]]) { const b = { x0, x1, z0, z1: z0 + .38, y: F0 + .45 }; bx('cedar', x0, x1, b.y - .05, b.y, z0, b.z1, 'bench'); for (const xx of [x0 + .1, x1 - .16]) bx('cedar', xx, xx + .06, F0, b.y - .05, z0 + .04, b.z1 - .04);
    bx('cedar', x0, x1, b.y + .3, b.y + .42, b.z1 - .04, b.z1); for (const xx of [x0 + .1, x1 - .16]) bx('cedar', xx, xx + .06, b.y, b.y + .42, b.z1 - .05, b.z1); benches.push(b); } }
  // the ceiling lined in limewash round the oculus, a gilt ring at its edge; gilt stars over the dome's night blue
  { const sq = new THREE.Shape(); sq.moveTo(-X, -Z); sq.lineTo(X, -Z); sq.lineTo(X, Z); sq.lineTo(-X, Z); sq.lineTo(-X, -Z); const hole = new THREE.Path(); hole.absarc(0, 0, I.Ri, 0, Math.PI * 2, true); sq.holes.push(hole);
    const g = new THREE.ExtrudeGeometry(sq, { depth: .03, bevelEnabled: false, curveSegments: 36 }); g.rotateX(-Math.PI / 2); put(g, 'plaster', 0, CEIL - .03, 0, 0, .5); put(new THREE.TorusGeometry(I.Ri + .02, .07, 6, 36), 'gold', 0, CEIL - .06, 0, 0, .6, Math.PI / 2);
    for (let k = 0; k < 70; k++) { const a = r() * Math.PI * 2, e = Math.asin(.12 + r() * .8), rr = (I.Ri - .04) * Math.cos(e), y = I.y0 + I.dh + (I.Ri - .04) * 1.12 * Math.sin(e); put(new THREE.OctahedronGeometry(.05 + r() * .04, 0), 'gold', Math.cos(a) * rr, y, Math.sin(a) * rr, r() * 3); } }
  // the great door's two leaves, open inside against the front wall
  const dW = C.door.w; for (const s of [-1, 1]) bx('cedarD', s > 0 ? dW / 2 + .02 : -dW / 2 - .02 - dW / 2, s > 0 ? dW / 2 + .02 + dW / 2 : -dW / 2 - .02, F0, F0 + C.door.h - dW / 2, Z - .1, Z - .02, 'leaf');
  const group = new THREE.Group(); let tris = 0; for (const [k, gs] of B) { const g = mergeGeometries(gs); gs.forEach(x => x.dispose()); const m = new THREE.Mesh(g, M[k]); m.name = k; m.castShadow = !['flame', 'glow'].includes(k); m.receiveShadow = true; group.add(m); tris += g.attributes.position.count / 3; }
  const all = new THREE.Group(); all.add(shell, group);
  const paths = [[[0, Z - .3], [0, bier.z1 + .5]], [[0, Z - .3], [0, 2.05], [2.0, 2.05], [2.0, -2.05], [0, sanctuary.z1 + .65]], [[0, Z - .3], [0, 2.05], [-2.0, 2.05], [-2.0, -2.05], [-.6, sanctuary.z1 + .65]], [[0, 2.05], [-4.9, 2.05]]];
  return { group: all, shell, room: group, tris: Math.round(tris), draws: group.children.length, shellTris: C.tris, shellCalls: C.draws, inner: { x0: -X, x1: X, z0: -Z, z1: Z }, floor: F0, ceil: CEIL, oculus: { r: I.Ri, y: I.y0, crown: I.crown },
    bier, sanctuary, altar, shuttle, lectern, benches, ring, door: { x: 0, z: I.D / 2, w: C.door.w, h: C.door.h }, paths, boxes, w: I.W, d: I.D, front: C.front };
}
// aurenneCourtyardHouse(o, r) (Session 899, card F9; Michael's A on #318: OG-115's courtyard house, built next as its own piece; copied from
//   rooms.js as it stands in Session 1425, o.shell the shell's stream key, so the game's shell is the street's own house): the
//   rooms of pieces.js's aurenneCourtyard (15 by 15 m, four ranges two storeys high round an arcaded court with a fountain). Ground:
//   the vestibule with its masonry benches; the store of oil jars and sacks; the kitchen of OG-115 (a cooking bench of three braziers
//   under a rail of hanging copper pots, a bread oven, a work table, plates on shelves); the west range's stair and a loom; the
//   dining room's long table and benches and a sideboard; across the back the reception hall, divans round three walls, rugs, brass
//   tables, a tile dado to 1.2 m. Upstairs off the gallery: the bedroom across the back (a bed, chests, a table with a mirror and a
//   comb), the guest room, the children's room (two small beds, a toy chest, a wooden horse), a linen press, and a study (a lectern,
//   books, a divan under the lattices). Lanterns in every room and along both galleries.
//   -> { group, shell, room, tris, draws, shellTris, shellCalls, sh (the shell's numbers), rooms: {name: {x0, x1, z0, z1, fl}}, boxes
//        (tagged, with their floor), paths: [[floor, [[x, z], …]]], lamps: [[x, y, z, fl]], braziers, tables, seats, beds, door }
function aurenneCourtyardHouse(o = {}, r = stream('courtyard')) {
  const sh = aurenneCourtyard({ interior: true, wall: o.wall ?? 1, door: 0 }, stream(o.shell || 'courtyard-shell')), M = homeMats(), B = new Map(), boxes = [];
  const put = (geo, key, x = 0, y = 0, z = 0, ry = 0, uv = .6, rx = 0, rz = 0) => { const g = geo.index ? geo.toNonIndexed() : geo; for (const k of Object.keys(g.attributes)) if (!['position', 'normal', ...(key === 'rug' ? ['uv'] : [])].includes(k)) g.deleteAttribute(k);
    g.applyMatrix4(new THREE.Matrix4().compose(new THREE.Vector3(x, y, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(rx, ry, rz, 'YXZ')), new THREE.Vector3(1, 1, 1))); if (key !== 'rug') worldUV(g, uv);
    if (!B.has(key)) B.set(key, []); B.get(key).push(g); return g; };
  const UVK = { zellige: 1.47, tile: 1.1 }, bx = (key, x0, x1, y0, y1, z0, z1, tag, fl) => { put(new THREE.BoxGeometry(x1 - x0, y1 - y0, z1 - z0), key, (x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2, 0, UVK[key] ?? .6); if (tag) boxes.push({ tag, x0, x1, y0, y1, z0, z1, fl }); };
  const { A, C, Ti, F0, F1, SL, BM } = sh, ci = C + Ti / 2, co = C - Ti / 2, FL = [F0, F1], CEIL0 = F1 - SL - BM;
  const rooms = { vestibule: { x0: -.88, x1: .88, z0: ci, z1: A, fl: 0 }, store: { x0: -A, x1: -1.12, z0: ci, z1: A, fl: 0 }, kitchen: { x0: 1.12, x1: A, z0: ci, z1: A, fl: 0 }, stairhall: { x0: -A, x1: -ci, z0: -co, z1: co, fl: 0 },
    dining: { x0: ci, x1: A, z0: -co, z1: co, fl: 0 }, hall: { x0: -A, x1: A, z0: -A, z1: -ci, fl: 0 }, children: { x0: -A, x1: -1.12, z0: ci, z1: A, fl: 1 }, linen: { x0: -.88, x1: .88, z0: ci, z1: A, fl: 1 },
    study: { x0: 1.12, x1: A, z0: ci, z1: A, fl: 1 }, landing: { x0: -A, x1: -ci, z0: -co, z1: co, fl: 1 }, guest: { x0: ci, x1: A, z0: -co, z1: co, fl: 1 }, bedroom: { x0: -A, x1: A, z0: -A, z1: -ci, fl: 1 } };
  // a dado of glazed tile round a room, broken at its doors (read from the shell's doors on that floor)
  const dado = (R, ht) => { const y0 = FL[R.fl]; for (const [ax, f, a0, a1, s] of [['z', R.z0, R.x0, R.x1, 1], ['z', R.z1, R.x0, R.x1, -1], ['x', R.x0, R.z0, R.z1, 1], ['x', R.x1, R.z0, R.z1, -1]]) {
    const gaps = sh.doors.filter(d => d.fl === R.fl && d.ax === ax && Math.abs(d.c - f) < .2 && d.at > a0 && d.at < a1).map(d => [d.at - d.w / 2 - .02, d.at + d.w / 2 + .02]).sort((p, q) => p[0] - q[0]); let p = a0;
    for (const [g0, g1] of [...gaps, [a1, a1]]) { if (g0 - p > .02) { if (ax === 'z') bx('zellige', p, g0, y0, y0 + ht, Math.min(f, f + s * .02), Math.max(f, f + s * .02)); else bx('zellige', Math.min(f, f + s * .02), Math.max(f, f + s * .02), y0, y0 + ht, p, g0); } p = g1; } } };
  const lamps = [], lantern = (x, y, z, fl, ceil) => { if (ceil) bx('iron', x - .005, x + .005, y + .2, ceil, z - .005, z + .005); put(new THREE.CylinderGeometry(.1, .12, .26, 8), 'glow', x, y, z); put(new THREE.ConeGeometry(.14, .18, 8), 'brass', x, y + .22, z);
    put(new THREE.CylinderGeometry(.13, .13, .03, 8), 'brass', x, y - .14, z); lamps.push([x, y, z, fl]); };
  const jar = (x, z, fl, s = 1, key = 'terra', tag = 'jar') => { const y = FL[fl]; put(new THREE.LatheGeometry([[.001, 0], [.14, 0], [.28, .25], [.3, .55], [.18, .8], [.13, .86], [.15, .9], [.001, .9]].map(([a, b]) => new THREE.Vector2(a * s, b * s)), 14), key, x, y, z);
    boxes.push({ tag, x0: x - .3 * s, x1: x + .3 * s, y0: y, y1: y + .9 * s, z0: z - .3 * s, z1: z + .3 * s, fl }); };
  const rug = (x, z, w, d, fl, ry = 0) => { const g = new THREE.PlaneGeometry(w, d); g.rotateX(-Math.PI / 2); put(g, 'rug', x, FL[fl] + .006, z, ry); };
  const divan = (x0, x1, z0, z1, fl, back) => { const y = FL[fl]; bx('cedar', x0, x1, y, y + .3, z0, z1, 'divan', fl); bx('indigo', x0 + .02, x1 - .02, y + .3, y + .42, z0 + .02, z1 - .02);
    const along = x1 - x0 > z1 - z0, L = along ? x1 - x0 : z1 - z0; for (let t = .35, k = 0; t < L - .3; t += .62, k++) { const c = (along ? x0 : z0) + t, g = new THREE.BoxGeometry(along ? .52 : .16, .42, along ? .16 : .52);
      put(g, k % 2 ? 'madder' : 'saffron', along ? c : back, y + .62, along ? back : c, 0, .6, along ? (back > (z0 + z1) / 2 ? -.12 : .12) : 0, along ? 0 : (back > (x0 + x1) / 2 ? .12 : -.12)); } };
  const brassTable = (x, z, fl, rad = .48) => { const y = FL[fl] + .42; put(new THREE.CylinderGeometry(rad, rad, .03, 28), 'brass', x, y - .015, z); for (let k = 0; k < 6; k++) { const a = k * Math.PI / 3; bx('cedarD', x + Math.cos(a) * rad * .62 - .02, x + Math.cos(a) * rad * .62 + .02, FL[fl], y - .03, z + Math.sin(a) * rad * .62 - .02, z + Math.sin(a) * rad * .62 + .02); }
    boxes.push({ tag: 'lowtable', x0: x - rad, x1: x + rad, y0: FL[fl], y1: y, z0: z - rad, z1: z + rad, fl }); for (let k = 0; k < 3; k++) put(new THREE.CylinderGeometry(.035, .03, .08, 10), k ? 'delft' : 'blue', x - .18 + k * .18, y + .04, z + (k - 1) * .1); };
  const beds = [], bed = (x0, x1, z0, z1, fl, headZ) => { const y = FL[fl]; bx('cedar', x0, x1, y, y + .34, z0, z1, 'bed', fl); bx('linen', x0 + .04, x1 - .04, y + .34, y + .46, z0 + .04, z1 - .04);
    const hz = headZ ?? z0; bx('indigo', x0 + .02, x1 - .02, y + .46, y + .5, hz === z0 ? z0 + .55 : z0 + .02, hz === z0 ? z1 - .02 : z1 - .55); bx('cedarD', x0, x1, y, y + .95, hz === z0 ? z0 : z1 - .06, hz === z0 ? z0 + .06 : z1);
    { const g = new THREE.CylinderGeometry(.11, .11, x1 - x0 - .2, 12); g.rotateZ(Math.PI / 2); put(g, 'madder', (x0 + x1) / 2, y + .57, hz === z0 ? z0 + .3 : z1 - .3); } beds.push({ x0, x1, z0, z1, fl, len: +(z1 - z0).toFixed(2), y: y + .46 }); };
  const chest = (x0, x1, z0, z1, fl, ht = .5) => { const y = FL[fl]; bx('cedarD', x0, x1, y, y + ht, z0, z1, 'chest', fl); bx('brass', x0 + .02, x1 - .02, y + ht - .18, y + ht - .14, z0 - .01, z1 + .01); };
  const tables = [], seats = [], bench = (x0, x1, z0, z1, fl, key = 'cedar') => { const y = FL[fl]; bx(key, x0, x1, y + .41, y + .45, z0, z1, 'bench', fl); const along = x1 - x0 > z1 - z0;
    for (const e of [.12, .88]) { const c = along ? x0 + (x1 - x0) * e : z0 + (z1 - z0) * e; if (along) bx(key, c - .03, c + .03, y, y + .41, z0 + .03, z1 - .03); else bx(key, x0 + .03, x1 - .03, y, y + .41, c - .03, c + .03); } seats.push(.45); };
  // ── the ground floor
  // the vestibule: tile to 1.2 m, a masonry bench down each side, the street door's leaf hung open, a lantern
  dado(rooms.vestibule, 1.2);
  for (const s of [-1, 1]) { const [x0, x1] = s < 0 ? [-.88, -.43] : [.43, .88]; bx('plaster', x0, x1, F0, F0 + .41, 4.0, 5.6, 'bench', 0); bx('zellige', x0 - (s > 0 ? .02 : 0), x1 + (s < 0 ? .02 : 0), F0 + .41, F0 + .45, 3.98, 5.62); } seats.push(.45);
  bx('cedarD', .56, .62, F0, F0 + 2.1, A - 1.12, A - .02, 'leaf', 0);
  lantern(0, CEIL0 - .5, 5.4, 0, CEIL0);
  // the store: oil jars down the street wall, sacks of grain, a chest of the house's silver
  for (let x = -6.7; x < -2.9; x += .7) jar(x, A - .38, 0, 1.0, 'terra', 'oiljar');
  for (const [x, z, s] of [[-6.75, 4.4, 1], [-6.7, 5.05, .9], [-6.1, 4.35, .85]]) { put(new THREE.SphereGeometry(.32 * s, 10, 8).scale(1, .8, 1), 'linen', x, F0 + .24 * s, z); boxes.push({ tag: 'sack', x0: x - .32 * s, x1: x + .32 * s, y0: F0, y1: F0 + .5 * s, z0: z - .32 * s, z1: z + .32 * s, fl: 0 }); }
  chest(-2.3, -1.3, A - .6, A - .02, 0); lantern(-4.3, CEIL0 - .5, 5.2, 0, CEIL0);
  // the kitchen: a cooking bench of three braziers down the street wall, a rail of copper pots hung over it, the bread oven in the corner,
  // a work table, a water jar, shelves of blue and white plates on the vestibule's wall
  const braziers = [], kb = { x0: 2.0, x1: 5.6, z0: A - .65, z1: A }; bx('plaster', kb.x0, kb.x1, F0, F0 + .82, kb.z0, kb.z1, 'cookbench', 0); bx('zellige', kb.x0 - .03, kb.x1 + .03, F0 + .82, F0 + .86, kb.z0 - .03, kb.z1);
  for (const x of [2.6, 3.8, 5.0]) { bx('dark', x - .2, x + .2, F0 + .86, F0 + .87, kb.z0 + .15, kb.z1 - .15); put(new THREE.SphereGeometry(.13, 8, 5).scale(1.2, .3, 1.2), 'ember', x, F0 + .87, (kb.z0 + kb.z1) / 2); braziers.push([x, F0 + .87, (kb.z0 + kb.z1) / 2, 0]); }
  put(new THREE.SphereGeometry(.15, 12, 8, 0, Math.PI * 2, .4, Math.PI - .4), 'copper', 2.6, F0 + 1.0, (kb.z0 + kb.z1) / 2);
  { const y = F0 + 1.85; bx('iron', kb.x0 + .1, kb.x1 - .1, y, y + .03, A - .2, A - .17); for (let k = 0; k < 7; k++) { const x = kb.x0 + .35 + k * .5, rr = .09 + (k % 3) * .035; bx('iron', x - .005, x + .005, y - .2, y, A - .19, A - .18);
      put(new THREE.CylinderGeometry(rr, rr * .85, rr * 1.2, 14), 'copper', x, y - .2 - rr * .6, A - .19 - rr); } }
  { const ox = 6.55, oz = 6.55; bx('plaster', ox - .63, A, F0, F0 + .8, oz - .63, A, 'oven', 0); put(new THREE.SphereGeometry(.6, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2), 'plaster', ox, F0 + .8, oz); bx('dark', ox - .62, ox - .58, F0 + .85, F0 + 1.15, oz - .2, oz + .2); }
  { const t = { x0: 3.0, x1: 4.6, z0: 4.7, z1: 5.5, y: F0 + .85 }; bx('cedar', t.x0, t.x1, t.y - .05, t.y, t.z0, t.z1, 'worktable', 0); for (const [x, z] of [[t.x0 + .06, t.z0 + .06], [t.x1 - .06, t.z0 + .06], [t.x0 + .06, t.z1 - .06], [t.x1 - .06, t.z1 - .06]]) bx('cedarD', x - .035, x + .035, F0, t.y - .05, z - .035, z + .035);
    bx('cedarD', 3.2, 3.7, t.y, t.y + .03, 4.85, 5.2); put(new THREE.SphereGeometry(.16, 12, 6, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), 'terra', 4.2, t.y + .16, 5.1); tables.push(+(t.y - F0).toFixed(2)); }
  jar(1.55, A - .45, 0, .85, 'terra', 'waterjar');
  { for (const y of [1.2, 1.6, 2.0]) { bx('cedar', 1.12, 1.42, F0 + y - .03, F0 + y, 4.4, 6.1); for (let z = 4.55; z < 6.0; z += .22) put(new THREE.CylinderGeometry(.1, .1, .02, 14).rotateZ(Math.PI / 2), r() < .5 ? 'blue' : 'delft', 1.24, F0 + y + .1, z); }
    boxes.push({ tag: 'plates', x0: 1.12, x1: 1.42, y0: F0 + 1.17, y1: F0 + 2.2, z0: 4.4, z1: 6.1, fl: 0 }); }
  lantern(4.0, CEIL0 - .5, 5.1, 0, CEIL0);
  // the west range: the stair is the shell's; a loom by the court wall and the weaver's bench; two jars at the stair's high end
  { const lx = -3.98, z0 = -2.6, z1 = -.6, y = F0; for (const z of [z0, z1]) bx('cedarD', lx - .06, lx + .06, y, y + 2.0, z - .06, z + .06); for (const yy of [.35, 1.85]) bx('cedarD', lx - .07, lx + .07, y + yy - .06, y + yy + .06, z0, z1);
    bx('cedar', lx - .2, lx - .1, y + .85, y + .93, z0 + .1, z1 - .1); const cl = new THREE.PlaneGeometry(z1 - z0 - .25, .55); cl.rotateY(Math.PI / 2); put(cl, 'indigo', lx, y + .7, (z0 + z1) / 2);
    for (let z = z0 + .14; z < z1 - .1; z += .045) bx('linen', lx - .003, lx + .003, y + .97, y + 1.82, z - .003, z + .003); boxes.push({ tag: 'loom', x0: lx - .2, x1: lx + .07, y0: y, y1: y + 2.0, z0: z0 - .06, z1: z1 + .06, fl: 0 }); }
  bench(-5.0, -4.65, -2.1, -1.1, 0); jar(-6.68, -2.4, 0, .9); jar(-6.68, -3.05, 0, .8);
  lantern(-5.3, CEIL0 - .5, .6, 0, CEIL0);
  // the dining room: a long table and two benches, a sideboard of plates and jugs, a lantern over the table
  { const t = { x0: 4.95, x1: 5.75, z0: -1.5, z1: 1.5, y: F0 + .76 }; bx('cedar', t.x0, t.x1, t.y - .05, t.y, t.z0, t.z1, 'table', 0); for (const [x, z] of [[t.x0 + .07, t.z0 + .07], [t.x1 - .07, t.z0 + .07], [t.x0 + .07, t.z1 - .07], [t.x1 - .07, t.z1 - .07]]) bx('cedarD', x - .04, x + .04, F0, t.y - .05, z - .04, z + .04);
    for (let z = -1.2; z <= 1.21; z += .6) for (const x of [5.12, 5.58]) put(new THREE.CylinderGeometry(.11, .09, .03, 14), r() < .5 ? 'blue' : 'delft', x, t.y + .015, z); put(new THREE.CylinderGeometry(.07, .09, .26, 12), 'terra', 5.35, t.y + .13, 0); tables.push(+(t.y - F0).toFixed(2)); }
  bench(4.4, 4.7, -1.4, 1.4, 0); bench(6.0, 6.3, -1.4, 1.4, 0);
  { bx('cedarD', 6.75, A, F0, F0 + .9, -1.2, 1.2, 'sideboard', 0); for (let z = -1.0; z < 1.05; z += .25) put(new THREE.CylinderGeometry(.12, .12, .02, 14).rotateZ(Math.PI / 2), z > 0 ? 'blue' : 'delft', A - .1, F0 + 1.02, z); for (const z of [-.6, .6]) put(new THREE.CylinderGeometry(.06, .09, .24, 12), 'copper', 6.95, F0 + 1.02, z); }
  lantern(5.35, CEIL0 - .55, 0, 0, CEIL0);
  // the hall across the back: tile to 1.2 m, divans round three walls, two rugs and two brass tables, a ewer and cups, two lanterns
  dado(rooms.hall, 1.2);
  divan(-6.0, 6.0, -A, -A + .8, 0, -A + .12); divan(-A, -A + .8, -A + .8, -4.4, 0, -A + .12); divan(A - .8, A, -A + .8, -4.4, 0, A - .12);
  for (const s of [-1, 1]) { rug(s * 2.6, -5.4, 2.8, 1.9, 0); brassTable(s * 2.6, -5.5, 0); lantern(s * 3.3, CEIL0 - .55, -5.3, 0, CEIL0); }
  put(new THREE.LatheGeometry([[.001, 0], [.08, 0], [.11, .1], [.06, .22], [.04, .3], [.07, .34], [.001, .34]].map(([a, b]) => new THREE.Vector2(a, b)), 12), 'brass', 2.85, F0 + .42, -5.3);
  // ── the upper floor
  // the landing: a chest by the back wall, a rug, a lantern
  chest(-5.6, -4.6, -co, -co + .48, 1); rug(-5.0, .4, 1.4, 2.2, 1); lantern(-5.0, sh.under(-5.0, .4) - .5, .4, 1, sh.under(-5.0, .4));
  // the bedroom: the bed from the back wall, a chest each side of it, a table with a mirror and a comb at the east end and its stool, a
  // divan at the west end, a rug, a lantern
  dado(rooms.bedroom, .6); rug(0, -5.7, 3.2, 2.8, 1); bed(-1.0, 1.0, -A, -5.0, 1, -A); chest(-2.6, -1.6, -A, -A + .55, 1); chest(1.6, 2.6, -A, -A + .55, 1);
  { const y = F1, t = { x0: A - .5, x1: A, z0: -6.2, z1: -4.8 }; bx('cedar', t.x0, t.x1, y + .71, y + .75, t.z0, t.z1, 'dresser', 1); for (const z of [t.z0 + .05, t.z1 - .05]) bx('cedarD', t.x0 + .04, t.x1 - .04, y, y + .71, z - .03, z + .03);
    put(new THREE.CylinderGeometry(.22, .22, .02, 24).rotateZ(Math.PI / 2), 'brass', A - .04, y + 1.2, -5.5); bx('cedarD', A - .06, A - .02, y + .75, y + .98, -5.52, -5.48);
    bx('cedar', A - .3, A - .12, y + .75, y + .77, -5.0, -4.92); for (let k = 0; k < 9; k++) bx('cedar', A - .3 + k * .02, A - .29 + k * .02, y + .75, y + .79, -4.94, -4.93) /* the comb's teeth */;
    put(new THREE.CylinderGeometry(.04, .05, .14, 10), 'blue', A - .25, y + .82, -5.9); bx('cedar', A - 1.0, A - .66, y + .41, y + .45, -5.67, -5.33, 'stool', 1); for (const [dx, dz] of [[.04, .04], [.3, .04], [.04, .3], [.3, .3]]) bx('cedarD', A - 1.0 + dx - .02, A - 1.0 + dx + .02, y, y + .41, -5.67 + dz - .02, -5.67 + dz + .02); seats.push(.45); }
  divan(-A, -A + .8, -6.6, -4.2, 1, -A + .12); lantern(0, sh.under(0, -4.6) - .5, -4.6, 1, sh.under(0, -4.6));
  // the guest room: a bed along the outer wall, a chest, a rug, a lantern
  bed(A - 1.4, A, -2.9, -.8, 1); chest(A - .6, A, .3, 1.2, 1); rug(5.2, 0, 1.8, 2.6, 1); lantern(5.0, sh.under(5.0, 1.6) - .5, 1.6, 1, sh.under(5.0, 1.6));
  // the children's room: two small beds along the street wall, a toy chest, a wooden horse on rockers, a rug, a lantern
  bed(-6.9, -6.0, 5.4, A, 1, A); bed(-4.6, -3.7, 5.4, A, 1, A); chest(-A, -A + .55, 3.9, 4.7, 1, .42);
  { const y = F1, x = -4.0, z = 4.6; bx('saffron', x - .32, x + .32, y + .32, y + .52, z - .1, z + .1); bx('saffron', x + .26, x + .4, y + .5, y + .74, z - .07, z + .07); for (const sx of [-.24, .24]) for (const sz of [-.07, .07]) bx('cedarD', x + sx - .025, x + sx + .025, y + .06, y + .34, z + sz - .025, z + sz + .025);
    for (const sz of [-.09, .09]) { const g = new THREE.TorusGeometry(1.0, .02, 4, 20, .7); g.rotateZ(-Math.PI / 2 - .35) /* the bottom of the circle */; put(g, 'cedarD', x, y + 1.03, z + sz); }
    boxes.push({ tag: 'toyhorse', x0: x - .4, x1: x + .42, y0: y, y1: y + .74, z0: z - .12, z1: z + .12, fl: 1 }); }
  rug(-4.6, 4.7, 2.2, 1.4, 1); lantern(-4.6, sh.under(-4.6, 4.8) - .5, 4.8, 1, sh.under(-4.6, 4.8));
  // the linen press: shelves of folded cloth to the ceiling on the street wall
  { const z0 = A - .4; for (const y of [.02, .5, 1.0, 1.5, 1.95]) bx('cedar', -.8, .8, F1 + y, F1 + y + .03, z0, A); for (const x of [-.8, .77]) bx('cedar', x, x + .03, F1, F1 + 2.0, z0, A);
    for (const y of [.05, .53, 1.03, 1.53]) for (let x = -.7, k = 0; x < .6; x += .36, k++) { const ht = .12 + r() * .22; bx(['linen', 'indigo', 'madder', 'linen', 'weld'][(k + Math.floor(y * 3)) % 5], x, x + .3, F1 + y, F1 + y + ht, z0 + .04, A - .04); }
    boxes.push({ tag: 'press', x0: -.8, x1: .8, y0: F1, y1: F1 + 2.0, z0, z1: A, fl: 1 }); lantern(0, sh.under(0, 5.0) - .5, 5.0, 1, sh.under(0, 5.0)); }
  // the study: books on shelves against the vestibule's wall, a lectern with an open book, a divan under the lattices, a brass table and lamp
  { for (const y of [.3, .75, 1.2, 1.65]) { bx('cedar', 1.12, 1.45, F1 + y - .03, F1 + y, 5.9, A - .05); for (let z = 5.95; z < A - .15; z += .06 + r() * .03) { const ht = .22 + r() * .14; bx(['madder', 'indigo', 'cedarD', 'weld', 'saffron'][Math.floor(r() * 5)], 1.16, 1.4, F1 + y, F1 + y + ht, z, z + .05); } }
    boxes.push({ tag: 'books', x0: 1.12, x1: 1.45, y0: F1, y1: F1 + 2.0, z0: 5.9, z1: A - .05, fl: 1 });
    const lx = 1.85, lz = 5.15; bx('cedarD', lx - .05, lx + .05, F1, F1 + 1.05, lz - .05, lz + .05); const top = new THREE.BoxGeometry(.5, .03, .4); top.rotateX(-.45); put(top, 'cedar', lx, F1 + 1.12, lz);
    const pg = new THREE.BoxGeometry(.42, .02, .3); pg.rotateX(-.45); put(pg, 'linen', lx, F1 + 1.145, lz); bx('cedarD', lx - .22, lx + .22, F1, F1 + .04, lz - .2, lz + .2); boxes.push({ tag: 'lectern', x0: lx - .25, x1: lx + .25, y0: F1, y1: F1 + 1.25, z0: lz - .22, z1: lz + .22, fl: 1 }); }
  divan(3.2, 6.8, A - .8, A, 1, A - .12); rug(5.0, 5.4, 2.6, 1.6, 1); brassTable(5.0, 5.5, 1, .4); put(new THREE.SphereGeometry(.07, 10, 6).scale(1.6, .6, 1), 'brass', 5.1, F1 + .46, 5.6); put(new THREE.SphereGeometry(.014, 6, 5).scale(1, 2, 1), 'flame', 5.2, F1 + .52, 5.6); lamps.push([5.2, F1 + .55, 5.6, 1]);
  // ── the galleries: lanterns on brackets off the court's walls, four a floor
  for (const [fl, y] of [[0, F0 + 2.45], [1, F1 + 2.2]]) for (const sz of [-1, 1]) for (const x of [-1.2, 1.2]) { const z = sz * (co - .2); bx('iron', x - .01, x + .01, y + .3, y + .32, sz * (co - .2), sz * co); lantern(x, y, z, fl, y + .32); }
  // the walks, by floor: in at the street door through the vestibule and round the gallery to the hall; from the gallery into the store,
  // the kitchen, the dining room, the west range (to the stair's foot) and to the fountain; upstairs from the landing round the gallery to
  // the bedroom, and into the children's room, the linen press, the study and the guest room
  const g = 2.9, paths = [[0, [[0, A - .3], [0, g], [-g, g], [-g, -g], [0, -g], [0, -5.0]]], [0, [[-g, g], [-2.4, g], [-2.4, 4.6]]], [0, [[g, g], [2.4, g], [2.4, 4.4]]], [0, [[g, -g], [g, 0], [4.1, 0]]],
    [0, [[-g, g], [-g, 2.6], [-5.85, 2.6], [-5.85, 3.3]]], [0, [[0, g], [0, 1.3]]],
    [1, [[-6.68, -2.1], [-5.0, -2.6], [-g, -2.6], [-g, g], [g, g], [g, -g], [0, -g], [0, -4.4]]], [1, [[-g, g], [-2.4, g], [-2.4, 4.3]]], [1, [[0, g], [0, 5.6]]], [1, [[g, g], [2.4, g], [2.4, 4.4]]], [1, [[g, -g], [g, 0], [4.4, 0]]]];
  const group = new THREE.Group(); let tris = 0; for (const [k, gs] of B) { const geo = mergeGeometries(gs); gs.forEach(x => x.dispose()); const m = new THREE.Mesh(geo, M[k]); m.name = k; m.castShadow = !['flame', 'ember', 'glow'].includes(k); m.receiveShadow = true; group.add(m); tris += geo.attributes.position.count / 3; }
  const all = new THREE.Group(); all.add(sh.group, group);
  return { group: all, shell: sh.group, room: group, sh, tris: Math.round(tris), draws: group.children.length, shellTris: sh.tris, shellCalls: sh.draws, rooms, boxes, paths, lamps, braziers, tables, seats, beds, floors: FL, ceil0: CEIL0,
    door: { x: 0, z: sh.d / 2, w: 1.1, h: 2.65 }, w: sh.w, d: sh.d };
}
// aurenneTavern(o, r) (Session 895, card F9; L9's three inns, OG-108's "Aurenne tavern on a terrace over the sea"; Michael's A on #303: rooms
//   inside the street's own shell): pieces.js's Roman house of Aurenne (the tile kind, 9.6 by 8.0 m, one storey of 3.0 m under a hipped
//   pantile roof, its arcade of four round arches across the front; o.interior) as a tavern over the harbour. Inside: a tiled floor and
//   a glazed dado, the counter across the back faced in zellige with amphorae and jars on shelves behind it, a rack of amphorae in a
//   corner, the cooking bench with its braziers, two small tables by the side windows, cedar beams under the roof, brass lamps. Under the
//   arcade, the loggia with two small tables; beyond it a paved terrace of 4 m to a parapet over the quay wall, three round tables with
//   chairs under a pergola of vines. The sea is the page's (rooms-view.js), 3 m below the terrace.
//   -> { group, shell, room, tris, draws, inner, floor, terrace: { z0, z1, y, parapet }, loggia: { z0, z1 }, arches: [x...], door, open, yW, counter,
//        tables, seats, path, path2, boxes, lamps, braziers, w, d }
//   o.rooms (Session 1296; the keeper lets "a room ... up the stairs", INN_ROOM_LINES.aurennais): the same house two storeys high (the kit's
//   o.two, 5.6 m to the eaves, four arched windows over the arcade), a stair of 16 risers up the west wall from beside the door to a
//   landing in the back corner, the left table moved in off it; upstairs a passage along the back wall from the landing, three guest rooms
//   off it behind plaster partitions, each with a cedar bed under an indigo cover, a chest at its foot and a basin on a stand under its
//   front window, the first bed in the nook over the stair's foot. Adds floors, stair, well, passage, rooms [{ x0, x1, door }], beds, paths.
//   Session 1307 (the critic's walk): the upper flight open beneath, two oil jars stored under it; the well framed in cedar and lit by a
//   lamp on the west wall; the west window raised over the flight (o.stairWin); the pendant lamp over the left table, 2.06 m clear.
//   o.gate (Session 1320): -1 or +1, that side's parapet open for 1.2 m by the loggia with a step down outside (-> terrace.gate { x, z0, z1 }).
//   o.leaves false (Session 1320): the rooms' doorways empty, for the game to hang doors that open and shut (intDoorAt).
function aurenneTavern(o = {}, r = stream('tavern')) {
  const R2 = !!o.rooms, w = 9.6, d = 8.0, sh = aurenneHouse({ kind: 'tile', w, d, two: R2, arcade: true, wall: 0, door: 2, pointed: false, green: false, interior: true, ...(R2 ? { stairWin: { y: 1.95, h: .55 } } : {}) }, stream('tavern-shell'));
  const M = homeMats(), B = new Map(), boxes = [];
  const put = (geo, key, x = 0, y = 0, z = 0, ry = 0, uv = .6) => { const g = geo.index ? geo.toNonIndexed() : geo; for (const k of Object.keys(g.attributes)) if (!['position', 'normal'].includes(k)) g.deleteAttribute(k);
    g.applyMatrix4(new THREE.Matrix4().compose(new THREE.Vector3(x, y, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(0, ry, 0)), new THREE.Vector3(1, 1, 1))); worldUV(g, uv); if (!B.has(key)) B.set(key, []); B.get(key).push(g); return g; };
  const UVK = { zellige: 1.47, tile: 1.1 }, bx = (key, x0, x1, y0, y1, z0, z1, tag, fl) => { put(new THREE.BoxGeometry(x1 - x0, y1 - y0, z1 - z0), key, (x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2, 0, UVK[key] ?? .6); if (tag) boxes.push(fl === undefined ? { tag, x0, x1, y0, y1, z0, z1 } : { tag, x0, x1, y0, y1, z0, z1, fl }); };
  const X = w / 2 - sh.T, Z = d / 2 - sh.T, F0 = sh.yW + .06, TOP = sh.top, ad = 1.7, az = d / 2 + ad, FT = sh.yW + .09 /* the loggia's slab, as the shell lays it */, F1 = R2 ? sh.yW + 3.0 : TOP /* the upper floor's top, o.rooms */;
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
  for (const sx of [-1, 1]) { const x = R2 && sx < 0 ? -1.9 : sx * (X - .9), z = R2 && sx < 0 ? .9 : .2; table(x, z, false, 'in'); stool(x, z + .7, F0); stool(x, z - .7, F0); }
  for (const x of [arches[0] + .4, arches[n - 1] - .4]) { const z = d / 2 + ad / 2 + .05; table(x, z, true, 'out'); stool(x - .58, z, FT); stool(x + .58, z, FT); }
  // the terrace: paving from the arcade 4 m out to a parapet on the quay wall, which drops 3.2 m to the sea
  const T0 = az + .05, T1 = az + 4.05, terrace = { z0: T0, z1: T1, y: FT, parapet: FT + .62, quayFoot: -3.4, ...(o.gate === -1 || o.gate === 1 ? { gate: { x: o.gate * (w / 2 + .05), z0: T0 + .8, z1: T0 + 2.0 } } : {}) };
  bx('step', -w / 2 - .1, w / 2 + .1, FT - .4, FT, T0, T1); bx('step', -w / 2 - .1, w / 2 + .1, terrace.quayFoot, FT - .4, T1 - .5, T1 + .25);
  // o.gate (Session 1320, the game's quay: the tavern stands with its terrace to the water and you come to it along the quay): that side's
  // parapet (-1 the west, +1 the east) opened for 1.2 m between the loggia's end and the first table, a step down outside it
  const G0 = T0 + .8, G1 = T0 + 2.0, gate = o.gate === -1 || o.gate === 1 ? o.gate : 0;
  for (const [x0, x1, z0, z1] of [[-w / 2 - .1, w / 2 + .1, T1 - .3, T1], ...[-1, 1].flatMap(sx => { const a = sx < 0 ? -w / 2 - .1 : w / 2 - .2, b = sx < 0 ? -w / 2 + .2 : w / 2 + .1; return sx === gate ? [[a, b, T0, G0], [a, b, G1, T1]] : [[a, b, T0, T1]]; })]) { bx('plaster', x0, x1, FT, FT + .55, z0, z1, 'parapet'); bx('step', x0 - .03, x1 + .03, FT + .55, FT + .62, z0 - .03, z1 + .03); }
  if (gate) { const a = gate * (w / 2 + .1), b = gate * (w / 2 + .5); bx('step', Math.min(a, b), Math.max(a, b), FT - .4, FT / 2, G0, G1, 'gatestep'); }
  for (const [x, z] of [[-2.6, T0 + 1.5], [.3, T0 + 2.6], [2.9, T0 + 1.4]]) { table(x, z, true, 'out'); for (const a of [0, Math.PI]) { const cx = x + Math.cos(a) * .62, cz = z + Math.sin(a) * .62 + (a ? 0 : 0); stool(cx, cz, FT); } }
  // the pergola over the terrace: cedar posts, beams across, a vine over them with clusters of grapes
  const PZ0 = T0 + .5, PZ1 = T1 - .6, PY = FT + 2.6; for (const x of [-w / 2 + .5, 0, w / 2 - .5]) for (const z of [PZ0, PZ1]) bx('cedar', x - .06, x + .06, FT, PY, z - .06, z + .06, 'pergolapost');
  for (const z of [PZ0, PZ1]) bx('cedar', -w / 2 + .3, w / 2 - .3, PY, PY + .14, z - .07, z + .07); for (let x = -w / 2 + .5; x <= w / 2 - .4; x += .6) bx('cedar', x - .04, x + .04, PY + .14, PY + .22, PZ0 - .3, PZ1 + .3);
  for (let i = 0; i < 160; i++) { const x = -w / 2 + .4 + r() * (w - .8), z = PZ0 - .2 + r() * (PZ1 - PZ0 + .4); put(new THREE.IcosahedronGeometry(.12 + r() * .1, 0), 'leaf', x, PY + .26 + r() * .1, z, r() * 6); if (r() < .08) put(new THREE.ConeGeometry(.07, .2, 6).rotateX(Math.PI), 'grape', x, PY + .05, z); }
  for (const x of [-w / 2 + .5, w / 2 - .5]) for (let k = 0; k < 14; k++) put(new THREE.IcosahedronGeometry(.08 + r() * .05, 0), 'leaf', x + (r() - .5) * .2, FT + .3 + k * .17, PZ1 + (r() - .5) * .2, r() * 6);
  // the lamps: two brass lanterns inside from the beams, and one in the middle arch
  const lamps = [], LT = R2 ? F1 - .4 : TOP - .2 /* the beams they hang from */, LY = R2 ? F1 - .75 : TOP - .75; for (const [x, y, z] of [[R2 ? -1.9 : -1.6, LY, R2 ? .9 : .2] /* o.rooms: over the left table, off the stair's line (Session 1307) */, [1.8, LY, -.8]]) { bx('iron', x - .005, x + .005, y + .2, LT, z - .005, z + .005); put(new THREE.CylinderGeometry(.1, .12, .26, 8), 'glow', x, y, z); put(new THREE.ConeGeometry(.14, .18, 8), 'brass', x, y + .22, z); lamps.push([x, y, z]); }
  // o.rooms: the stair up the west wall, 16 masonry risers going 0.26 from beside the door to the landing in the back corner; the upper
  // floor of cedar boards under red tiles on beams every 0.9 m, open over the stair where a head would meet it (the well); a passage
  // along the back wall, three rooms off it behind plaster partitions; the rail-less well walled on its two open sides by the partitions
  const RM = []; let stair = null, well = null, PZ = null, beds = [], paths = null;
  if (R2) { const N = 16, rise = (F1 - F0) / N, going = .26, WX = -X + .95, LZ = -Z + 1.15, SZ0 = LZ + (N - 1) * going /* the foot */;
    // (Session 1307) the lower seven treads stand on a solid base; the upper flight bridges from it to the landing's pier as blocks
    // 0.45 m deep under each tread's nosing, so its stepped soffit shows and the store under it holds two oil jars
    const KS = 7; for (let k = 1; k < N; k++) bx('step', -X, WX, k > KS ? F0 + k * rise - .45 : F0, F0 + k * rise, SZ0 - k * going, SZ0 - (k - 1) * going, 'stair', 0);
    bx('step', -X, WX, F0, F1 - .2, -Z, LZ, 'landing', 0);
    for (const [z, s] of [[SZ0 - 10.6 * going, .78], [SZ0 - 13.4 * going, .9]]) { const jx = (-X + WX) / 2; put(new THREE.LatheGeometry([[.001, 0], [.14, 0], [.28, .25], [.3, .55], [.18, .8], [.13, .86], [.15, .9], [.001, .9]].map(([a, b]) => new THREE.Vector2(a * s, b * s)), 14), 'terra', jx, F0, z);
      boxes.push({ tag: 'oiljar', x0: jx - .3 * s, x1: jx + .3 * s, y0: F0, y1: F0 + .9 * s, z0: z - .3 * s, z1: z + .3 * s, fl: 0 }); }
    const kmax = Math.floor((F1 - .4 - F0 - 2.0) / rise) /* 2 m under the beams over the treads the floor covers */; well = { x0: -X, x1: WX, z0: LZ, z1: SZ0 - kmax * going };
    for (const [a0, a1, b0, b1] of [[WX, X, -Z, Z], [-X, WX, -Z, well.z0], [-X, WX, well.z1, Z]]) { bx('cedar', a0, a1, F1 - .2, F1 - .03, b0, b1); bx('tile', a0, a1, F1 - .03, F1, b0, b1); }
    for (let x = -X + .5; x < X - .2; x += .9) { const over = x < WX + .1; bx('cedarD', x - .08, x + .08, F1 - .4, F1 - .2, over ? well.z1 : -Z, Z); if (over) bx('cedarD', x - .08, x + .08, F1 - .4, F1 - .2, -Z, well.z0); }
    // (Session 1307) the well framed: a cedar trimmer down its open side and one across its foot, as deep as the beams, the floor's
    // edge lined in plaster between them, so the opening reads from the room below
    bx('cedarD', WX, WX + .18, F1 - .4, F1 - .2, well.z0, well.z1 + .18); bx('cedarD', -X, WX, F1 - .4, F1 - .2, well.z1, well.z1 + .18);
    bx('plaster', WX, WX + .02, F1 - .2, F1, well.z0, well.z1); bx('plaster', -X, WX, F1 - .2, F1, well.z1, well.z1 + .02);
    stair = { x0: -X, x1: WX, z0: LZ, z1: SZ0, rise: +rise.toFixed(4), going, n: N };
    // upstairs: a dado of glazed tile to 0.6 m, the partitions in plaster to the roof's beams, a door into each room off the passage
    for (const e of [-1, 1]) bx('zellige', e > 0 ? X - .02 : -X, e > 0 ? X : -X + .02, F1, F1 + .6, -Z, Z); bx('zellige', -X, X, F1, F1 + .6, -Z, -Z + .02); bx('zellige', -X, X, F1, F1 + .6, Z - .02, Z);
    PZ = LZ; const RX = [WX, -1.8, 1.95, X], dw = .8, dh = 1.95, CT = TOP - .22, pt = .05;
    for (let i = 0; i < 3; i++) { const dx = (RX[i] + RX[i + 1]) / 2, a = RX[i] + (i ? pt : 0), b = RX[i + 1] - (i < 2 ? pt : 0);
      bx('plaster', a, dx - dw / 2, F1, CT, PZ - pt, PZ + pt, 'partition', 1); bx('plaster', dx + dw / 2, b, F1, CT, PZ - pt, PZ + pt, 'partition', 1); bx('plaster', dx - dw / 2, dx + dw / 2, F1 + dh, CT, PZ - pt, PZ + pt);
      if (o.leaves !== false) bx('cedarD', dx - dw / 2 - .06, dx - dw / 2, F1, F1 + dh, PZ + pt, PZ + pt + dw - .04, 'roomdoor', 1) /* the leaf open into the room (o.leaves false: the game hangs its own) */; RM.push({ x0: i ? RX[i] : -X, x1: RX[i + 1], door: { x: dx, z: PZ, w: dw, h: dh } }); }
    for (const x of RX.slice(1, -1)) bx('plaster', x - pt, x + pt, F1, CT, PZ + pt, Z, 'partition', 1);
    bx('plaster', WX - pt, WX + pt, F1, CT, PZ + pt, well.z1 + pt, 'partition', 1); bx('plaster', -X, WX - pt, F1, CT, well.z1 - pt, well.z1 + pt, 'partition', 1) /* the well's two open sides: the first room's */;
    // each room: a cedar bed under an indigo cover with a madder bolster, its head to the front wall; a chest at its foot; a basin and jug
    // on a stand under the room's front window. The first bed lies in the nook over the stair's foot, the last against the east wall.
    const wins = [-2.925, .975, 2.925], side = [-1, -1, 1];
    RM.forEach((R, i) => { const x0 = side[i] < 0 ? R.x0 + .05 : R.x1 - 1.05, b = { x0, x1: x0 + 1.0, z0: Z - 2.05, z1: Z - .05, room: i };
      bx('cedar', b.x0, b.x1, F1, F1 + .32, b.z0, b.z1, 'bed', 1); bx('linen', b.x0 + .04, b.x1 - .04, F1 + .32, F1 + .44, b.z0 + .04, b.z1 - .04); bx('indigo', b.x0 + .02, b.x1 - .02, F1 + .44, F1 + .48, b.z0 + .02, b.z1 - .5);
      { const g = new THREE.CylinderGeometry(.1, .1, .86, 12); g.rotateZ(Math.PI / 2); put(g, 'madder', (b.x0 + b.x1) / 2, F1 + .54, b.z1 - .25); }
      bx('cedarD', b.x0 + .05, b.x1 - .05, F1, F1 + .48, b.z0 - .55, b.z0 - .05, 'chest', 1); bx('brass', b.x0 + .05, b.x1 - .05, F1 + .3, F1 + .33, b.z0 - .56, b.z0 - .55); beds.push(b);
      const wx = wins[i], wz = Z - .3; bx('cedar', wx - .22, wx + .22, F1, F1 + .78, wz - .2, wz + .2, 'washstand', 1); put(new THREE.CylinderGeometry(.16, .1, .07, 14), 'brass', wx, F1 + .815, wz); put(new THREE.LatheGeometry([[.001, 0], [.06, 0], [.08, .1], [.05, .2], [.04, .24], [.001, .24]].map(([a, c]) => new THREE.Vector2(a, c)), 10), 'terra', wx + .14, F1 + .78, wz - .06); });
    // (Session 1307) a lamp on a bracket in the well, on the west wall over the upper flight, so the opening shows lit from below
    { const lx = -X + .22, ly = F1 + 1.15, lz = well.z1 - .7; bx('iron', -X, lx, ly + .2, ly + .23, lz - .01, lz + .01); put(new THREE.CylinderGeometry(.1, .12, .26, 8), 'glow', lx, ly, lz); put(new THREE.ConeGeometry(.14, .18, 8), 'brass', lx, ly + .2, lz); lamps.push([lx, ly, lz]); }
    // a brass lamp on a bracket over the passage, on the back wall
    { const lx = .1, ly = F1 + 1.95, lz = -Z + .25; bx('iron', lx - .01, lx + .01, ly + .2, ly + .23, -Z, lz); put(new THREE.CylinderGeometry(.1, .12, .26, 8), 'glow', lx, ly, lz); put(new THREE.ConeGeometry(.14, .18, 8), 'brass', lx, ly + .2, lz); lamps.push([lx, ly, lz]); }
    // the walks, each on its floor: in at the door, across the front of the room to the stair's foot; off the landing along the passage
    // and in at each room's door to its bed's side
    const PM = (-Z + PZ) / 2, ax = (-X + WX) / 2; paths = [[0, [[sh.doorX, Z - .3], [sh.doorX, 2.3], [ax, 2.3], [ax, SZ0 + .2]]], [1, [[ax, (-Z + LZ) / 2], [WX + .4, PM], [RM[2].door.x, PM]]],
      ...RM.map((R, i) => [1, [[R.door.x, PM], [R.door.x, PZ + .45], [i === 0 ? WX + .45 : R.door.x, Z - 2.4]]])]; }
  // the door's leaf hung open inside, against the front wall
  { const lw = 1.05, lx = sh.doorX - lw / 2 - .04 - lw / 2; bx('cedarD', lx - lw / 2, lx + lw / 2, F0, F0 + 1.95, Z - .06, Z, 'leaf'); }
  // the walks: in at the door to the counter; out through the loggia and the arch beside the door, across the terrace to the parapet
  const path = [[sh.doorX, Z - .3], [sh.doorX, counter.z1 + .4]], path2 = [[sh.doorX, d / 2 + .3], [arches[Math.floor(n / 2)], d / 2 + ad * .6], [arches[Math.floor(n / 2)], T0 + .3], [arches[Math.floor(n / 2)] + .3, T1 - .7]];
  const group = new THREE.Group(); let tris = 0; for (const [k, gs] of B) { const g = mergeGeometries(gs, false); gs.forEach(x => x.dispose()); const m = new THREE.Mesh(g, M[k]); m.name = k; m.castShadow = !['flame', 'ember', 'glow'].includes(k); m.receiveShadow = true; group.add(m); tris += g.attributes.position.count / 3; }
  const all = new THREE.Group(); all.add(sh.group, group);
  return { group: all, shell: sh.group, room: group, tris: Math.round(tris), draws: group.children.length, shellTris: sh.tris, shellCalls: sh.draws, inner: { x0: -X, x1: X, z0: -Z, z1: Z }, floor: F0, ceil: TOP - .22, terrace, loggia: { z0: d / 2, z1: az },
    arches, door: { x: sh.doorX, z: d / 2, w: 1.05, h: 2.1 }, open: sh.open, yW: sh.yW, counter, tables, seats, path, path2, boxes, lamps, braziers, w, d,
    ...(R2 ? { floors: [F0, F1], ceil: [F1 - .4, TOP - .22], stair, well, passage: PZ, rooms: RM, beds, paths } : {}) };
}
// ── the six gods' row of seven at the town church (Session 1232; Michael's B on #464, after his C on #439; card F6) ──
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
const ROW_INK = '#5a5248', ROW_PAL = [0xa83a2a, 0xe6e0d0, 0x3a5a8a, 0x4e7a3a, 0xd8b040, 0x3e5a28, 0xf0dc6a, 0xf4f0e4, 0xeee2c4, 0x9e573a, 0xa8582f, 0x2a3c1e, 0x0c0a08];
const PAL = { rag0: 0, rag1: 1, rag2: 2, rag3: 3, rag4: 4, leaf: 5, prim: 6, bloomW: 7, wax: 8, brick: 9, terra: 10, cypress: 11, dark: 12 }; /* 9–12 Aurenne's row's (Session 1329) */
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
// them, the stroke dark with a pale lip under it; returns the material and each cell's rect in uv. Aurenne's (au, Session 1329) is
// lettered in the Church's blue and carries the Church's notice (512 by 640) under the roundels.
const ROW_SHEETS = {};
function rowSheet(au) {
  const sk = au ? 'au' : 'gl'; if (ROW_SHEETS[sk]) return ROW_SHEETS[sk]; const c = document.createElement('canvas'); c.width = 1024; c.height = au ? 1728 : 1088; const x = c.getContext('2d'), cells = {}, INK = au ? '#2a4a8a' : ROW_INK;
  const uvr = (px, py, w, h) => [px / c.width, 1 - (py + h) / c.height, (px + w) / c.width, 1 - py / c.height];
  ROW_GODS.forEach((god, i) => { const px = (i % 2) * 512, py = Math.floor(i / 2) * 192, w = 512, h = 192; x.save(); x.translate(px, py); x.textAlign = 'center'; x.textBaseline = 'middle';
    const line = (s, y, f) => { x.font = f; x.fillStyle = 'rgba(255,255,255,.35)'; x.fillText(s, w / 2, y + 2); x.fillStyle = INK; x.fillText(s, w / 2, y); };
    line(god.name.toUpperCase(), h * .4, `600 ${h * .3}px Georgia, 'Times New Roman', serif`); line(god.en, h * .76, `italic ${h * .2}px Georgia, 'Times New Roman', serif`); x.restore();
    cells['n:' + god.key] = uvr(px, py, w, h);
    const ix = (i % 4) * 256, iy = 576 + Math.floor(i / 4) * 256; x.save(); x.beginPath(); x.rect(ix, iy, 256, 256); x.clip(); x.translate(ix, iy);
    x.fillStyle = 'rgba(255,255,255,.3)'; x.translate(0, 3); ICON2D[god.icon](x); x.translate(0, -3); x.fillStyle = INK; x.strokeStyle = INK; ICON2D[god.icon](x);
    x.lineWidth = 6; x.beginPath(); x.arc(128, 128, 122, 0, Math.PI * 2); x.stroke(); x.restore(); cells['i:' + god.key] = uvr(ix, iy, 256, 256); });
  if (au) { const w = 512, h = 640; x.save(); x.translate(0, 1088); x.fillStyle = '#efe4c8'; x.fillRect(0, 0, w, h); x.strokeStyle = '#2a4a8a'; x.lineWidth = 10; x.strokeRect(14, 14, w - 28, h - 28);
    x.fillStyle = '#2a4a8a'; x.textAlign = 'center'; x.font = `600 34px Georgia, serif`; x.fillText('THE CHURCH OF THE WEAVER', w / 2, 82);
    x.fillStyle = '#3a2a1c'; x.font = 'italic 27px Georgia, serif'; ['This shrine is kept by order', 'of the Prior of the parish.', '', 'Offerings at the box.', 'A candle is one copper.', 'No rubbings to be taken.', 'The gate is shut', 'at the evening bell.'].forEach((s, i) => x.fillText(s, w / 2, 150 + i * 40));
    x.beginPath(); x.moveTo(w / 2 - 70, h - 64); x.quadraticCurveTo(w / 2, h - 96, w / 2 + 70, h - 64); x.quadraticCurveTo(w / 2, h - 32, w / 2 - 70, h - 64); x.fillStyle = '#2a4a8a'; x.fill(); x.restore(); cells.notice = uvr(0, 1088, w, h); }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.NoColorSpace; t.anisotropy = 8;
  const m = new THREE.MeshStandardMaterial({ map: t, transparent: true, alphaTest: .25, roughness: .95, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2 });
  return (ROW_SHEETS[sk] = { m, cells });
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
    pal: new THREE.MeshStandardMaterial({ map: pt, roughness: .9, side: THREE.DoubleSide }), sheet: rowSheet(false).m };
  return ROWM;
}
// Aurenne's (Session 1329): shrines.js's aurenne dress, the plaster, the ochre stone, the marble figures, the recess's glazed tile, the
// cupola's glaze, the gilt icons; the Gatelands' row's for the rest
let ROWM_AU = null;
function rowMatsAU() {
  if (ROWM_AU) return ROWM_AU; const A = aurMats(), std = (c, o = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: o.rough ?? .8, metalness: o.metal ?? 0 });
  ROWM_AU = Object.assign({}, rowMats(), { aurplaster: mat('plaster', { ns: .55, color: 0xf6eedc, rough: .95 }), newplaster: mat('plaster', { ns: .4, color: 0xfbf8f2, rough: .95 }),
    ochre: mat('ashlar', { ns: .9, color: 0xe8d2a6, rough: .85 }), marble: mat('plaster', { ns: .2, color: 0xf4f0e8, rough: .3 }), zellige: A.zellige, glaze: A.glaze,
    gilt: std(0xc8952e, { rough: .3, metal: .8 }), iron: A.iron, oak: mat('wood', { ns: 1, color: 0x7a5434, rough: .7 }), sheet: rowSheet(true).m });
  return ROWM_AU;
}
// o.island 'aurenne' (Session 1329; OG-113, Michael's C on #439, the row at the Church of the Weaver): shrines.js's row('aurenne') —
// each stele plastered and flat-topped under an ochre cornice and a blue-glazed cupola, the recess lined in glazed tile in an ochre
// frame, the figures marble and the icons gilt, the names in the Church's blue; the Guest's bricked up and plastered over, a patch fallen
// to show the brick. Before it an iron railing on a plaster dwarf wall with its gate before An Chloch, the tithe box inside the gate,
// two potted cypresses, the paving, a plaster pier at each end and the Church's notice on the Guest's; three votive candles on each sill
function shrineRow(o = {}) {
  const AU = o.island === 'aurenne', isl = AU ? 'aurenne' : 'gatelands', M = AU ? rowMatsAU() : rowMats(), SH = rowSheet(AU), B = new Map(), r = stream('row:' + isl), niches = [];
  const D = AU ? { stele: 'aurplaster', frame: 'ochre', stat: 'marble', recess: 'zellige', icon: 'gilt', plinth: 'ochre', basin: 'marble' } : { stele: 'lime', frame: 'limestone', stat: 'statG', recess: 'lime', icon: 'statG', plinth: 'limestone', basin: 'limestone' };
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
  const outline = () => { const s = new THREE.Shape(); s.moveTo(-W / 2, 0); s.lineTo(W / 2, 0); if (AU) { s.lineTo(W / 2, SPRING + .38); s.lineTo(-W / 2, SPRING + .38); } else { s.lineTo(W / 2, SPRING); s.absarc(0, SPRING, W / 2, 0, Math.PI, false); } s.lineTo(-W / 2, 0); return s; };
  const recess = P => { P.moveTo(-RW / 2, SILL); P.lineTo(RW / 2, SILL); P.lineTo(RW / 2, RSPRING); P.absarc(0, RSPRING, RW / 2, 0, Math.PI, false); P.lineTo(-RW / 2, SILL); return P; };
  const niche = (godKey, x0) => {
    const guest = godKey === 'guest', god = ROW_GODS.find(g => g.key === godKey), rn = stream(`niche:${isl}:${godKey}:${x0}`);
    // the plinth, a step wider than the stele, and the stele on it: a frame with the recess through it, and a back slab
    bx(D.plinth, x0 - .6, x0 + .6, -.35, PL, -.58, .14);
    const fr = outline(); fr.holes.push(recess(new THREE.Path())); put(new THREE.ExtrudeGeometry(fr, { depth: DF - .02, bevelEnabled: true, bevelThickness: .01, bevelSize: .01, bevelSegments: 1, curveSegments: 14 }), D.stele, x0, PL, -DF + .01);
    put(new THREE.ExtrudeGeometry(outline(), { depth: DB, bevelEnabled: false, curveSegments: 14 }), D.stele, x0, PL, -DF - DB);
    put(new THREE.ShapeGeometry(recess(new THREE.Shape()), 14), D.recess, x0, PL, -DF + .004);
    // the hood moulding over the arch and its two stops (Aurenne's flat stele a cornice, the cupola and a frame round the recess), and the sill, a lip out over the face
    if (!AU) { put(new THREE.TorusGeometry(RW / 2 + .06, .035, 6, 18, Math.PI), 'limestone', x0, PL + RSPRING, .015); for (const s of [-1, 1]) bx('limestone', x0 + s * (RW / 2 + .06) - .05, x0 + s * (RW / 2 + .06) + .05, PL + RSPRING - .1, PL + RSPRING, -.02, .05); }
    else { const T = PL + SPRING + .38, cz = -DF / 2 - DB / 2 + .02; bx('ochre', x0 - W / 2 - .05, x0 + W / 2 + .05, T, T + .08, -DF - DB - .04, .05); bx('ochre', x0 - W / 2 - .02, x0 + W / 2 + .02, T + .08, T + .14, -DF - DB - .01, .02);
      put(new THREE.CylinderGeometry(.3, .32, .16, 20), 'ochre', x0, T + .22, cz); put(new THREE.SphereGeometry(.3, 20, 10, 0, Math.PI * 2, 0, Math.PI / 2), 'glaze', x0, T + .3, cz); put(new THREE.SphereGeometry(.035, 8, 6), 'gilt', x0, T + .62, cz);
      for (const s of [-1, 1]) bx('ochre', x0 + s * (RW / 2 + .045) - .045, x0 + s * (RW / 2 + .045) + .045, PL + SILL - .04, PL + RSPRING, -.01, .03); put(new THREE.TorusGeometry(RW / 2 + .045, .045, 6, 18, Math.PI), 'ochre', x0, PL + RSPRING, .01); }
    bx(D.frame, x0 - RW / 2 - .08, x0 + RW / 2 + .08, PL + SILL - .05, PL + SILL, -DF + .01, .07);
    const sillY = PL + SILL, fz = -DF / 2 - .01, pY = PL + .63, rY = PL + RSPRING + RW / 2 + (AU ? .16 : .2);
    if (!guest) { plate('n:' + god.key, .78, .28, x0, pY, .006); plate('i:' + god.key, .24, .24, x0, rY, .006);
      if (god.icon === 'wolf') wolf(D.stat, x0, sillY, fz - .02); else icon3d(god.icon, D.icon, robed(D.stat, x0, sillY, fz, .95));
      const cx = x0 + .2, cz = -.04, ch = .1 + rn() * .06; put(new THREE.CylinderGeometry(.03, .032, ch, 10), 'wax', cx, sillY + ch / 2, cz); put(new THREE.SphereGeometry(.016, 6, 5).scale(1, 2.3, 1), 'flame', cx, sillY + ch + .035, cz);
    } else if (AU) {
      // bricked up and plastered over, the plaster newer and whiter than the stele's; a patch has fallen and shows the brick
      put(new THREE.ExtrudeGeometry(recess(new THREE.Shape()), { depth: DF - .04, bevelEnabled: false, curveSegments: 14 }), 'newplaster', x0, PL, -DF + .004);
      const p = new THREE.Shape(), rr = stream('fallen'); for (let i = 0; i <= 14; i++) { const a = i / 14 * Math.PI * 2, d = .1 + rr() * .06, q = [.04 + Math.cos(a) * d * 1.1, SILL + .44 + Math.sin(a) * d * .8]; i ? p.lineTo(...q) : p.moveTo(...q); } put(new THREE.ShapeGeometry(p), 'brick', x0, PL, -.032);
      bx('chisel', x0 - .4, x0 + .4, pY - .14, pY + .14, -.01, .004); put(new THREE.CircleGeometry(.12, 18), 'chisel', x0, rY, .004);
    } else {
      // the figure struck away: a stump of the hem on the sill, its outline a scar on the back of the recess, the name and the roundel cut back
      const k = .95 / 2.05, stump = new THREE.LatheGeometry([[.001, 0], [.36, 0], [.35, .12], [.31, .2], [.001, .26]].map(([a, b]) => new THREE.Vector2(a * k, b * k)), 12); stump.scale(1, 1, .78); put(stump, 'chisel', x0, sillY, fz);
      const sil = new THREE.Shape(); ROBE.forEach(([a, b], i) => i ? sil.lineTo(a * k * 1.02, b * k) : sil.moveTo(0, 0)); for (let i = ROBE.length - 1; i >= 0; i--) sil.lineTo(-ROBE[i][0] * k * 1.02, ROBE[i][1] * k);
      put(new THREE.ExtrudeGeometry(sil, { depth: .012, bevelEnabled: false }), 'chisel', x0, sillY, -DF + .006);
      bx('chisel', x0 - .4, x0 + .4, pY - .14, pY + .14, -.012, .002); put(new THREE.CylinderGeometry(.13, .13, .012, 18).rotateX(Math.PI / 2), 'chisel', x0, rY, -.002); }
    // the basin before the niche, a bowl on a stem with water in it; none before the Guest's
    let basin = null; if (!guest) { const bz = .55; put(new THREE.CylinderGeometry(.08, .12, .52, 12), D.basin, x0, .26, bz); put(new THREE.CylinderGeometry(.16, .16, .05, 14), D.basin, x0, .025, bz);
      put(new THREE.LatheGeometry([[0, 0], [.1, .005], [.19, .05], [.25, .13], [.25, .16], [.22, .16], [.18, .08], [0, .06]].map(([a, b]) => new THREE.Vector2(a * .85, b * .85)), 18), D.basin, x0, .52, bz);
      put(new THREE.CircleGeometry(.175, 18).rotateX(-Math.PI / 2), 'water', x0, .52 + .115, bz); basin = [x0, .52 + .136, bz]; }
    return { god: godKey, x: x0, sill: sillY, basin, pray: [x0, 1.1] }; };
  const ORDER = [...ROW_GODS.map(g => g.key), 'guest'], X = i => (i - 3) * 1.4;
  // o.ground: each niche's own ground over the row's (a row on a slope steps down it, each plinth sunk 0.35 m), its flowers and rag with it
  const dy = i => (o.ground && o.ground[i]) || 0, lift = (i, fn) => { const n0 = new Map([...B].map(([k, v]) => [k, v.length])); const out = fn(); const m = new THREE.Matrix4().makeTranslation(0, dy(i), 0);
    for (const [k, gs] of B) for (let j = n0.get(k) || 0; j < gs.length; j++) gs[j].applyMatrix4(m); return out; };
  ORDER.forEach((g, i) => { const n = lift(i, () => niche(g, X(i))); n.dy = dy(i); if (n.basin) n.basin[1] += dy(i); niches.push(n); });
  // Aurenne's: the railing and its gate, the tithe box, the notice, the pots, the paving and the piers, the votive candles
  let rail = null;
  if (AU) { const x0 = X(0) - .9, x1 = X(6) + .9, z = 2.0, gap = 0; /* the prototype's 1.45 left 0.52 m between a basin and the rail: 2.0 leaves room to kneel */ bx('aurplaster', x0, x1, 0, .5, z - .14, z + .14, .6); bx('ochre', x0 - .02, x1 + .02, .5, .56, z - .17, z + .17);
    for (let x = x0 + .06; x < x1; x += .13) { if (Math.abs(x - gap) < .62) continue; bx('iron', x - .011, x + .011, .56, 1.38, z - .011, z + .011); put(new THREE.ConeGeometry(.024, .07, 4), 'iron', x, 1.42, z); }
    for (const y of [.62, 1.3]) for (const [a, b] of [[x0, gap - .6], [gap + .6, x1]]) bx('iron', a, b, y - .012, y + .012, z - .014, z + .014);
    for (const s of [-1, 1]) { bx('ochre', gap + s * .62 - .1, gap + s * .62 + .1, 0, 1.55, z - .17, z + .17); put(new THREE.SphereGeometry(.08, 10, 8), 'ochre', gap + s * .62, 1.62, z);
      // the two leaves, hung on the piers and swung open inward
      const a = 1.1, dx = -s * Math.cos(a), dz = -Math.sin(a), hx = gap + s * .52; for (let k = 0; k < 4; k++) { const d = .04 + k * .14; bx('iron', hx + dx * d - .011, hx + dx * d + .011, .1, 1.25, z + dz * d - .011, z + dz * d + .011); }
      for (const y of [.18, 1.18]) { const g = new THREE.BoxGeometry(.5, .024, .024); g.translate(-.25, 0, 0); put(g, 'iron', hx, y, z, s > 0 ? -a : Math.PI + a); } }
    rail = { x0, x1, z, gap, t: .17 };
    { const x = .98, z = 1.6; bx('oak', x - .05, x + .05, 0, .9, z - .05, z + .05, 1); bx('oak', x - .2, x + .2, .9, 1.28, z - .15, z + .15, 1); for (const y of [.94, 1.24]) bx('iron', x - .205, x + .205, y - .018, y + .018, z - .155, z + .155);
      bx('dark', x - .07, x + .07, 1.281, 1.284, z - .012, z + .012); bx('iron', x - .04, x + .04, 1.08, 1.16, z + .15, z + .16); }
    { const x = X(6) + .95, z = -.52; bx('oak', x - .34, x + .34, 1.0, 1.84, z - .03, z, 1); plate('notice', .6, .76, x, 1.42, z + .002); }
    for (const x of [X(0) - .85, X(6) + .85]) { put(new THREE.LatheGeometry([[0, 0], [.14, 0], [.2, .2], [.18, .36], [.2, .4], [0, .4]].map(([a, b]) => new THREE.Vector2(a, b)), 14), 'terra', x, 0, .5);
      put(new THREE.ConeGeometry(.2 + r() * .06, 1.3 + r() * .5, 9).translate(0, .65, 0), 'cypress', x, .38, .5); }
    bx('ochre', X(0) - .95, X(6) + .95, 0, .03, -.9, z - .1, .5); bx('aurplaster', X(6) + .6, X(6) + 1.3, 0, 2.2, -.7, -.55, .6); bx('aurplaster', X(0) - 1.3, X(0) - .6, 0, 2.2, -.7, -.55, .6);
    for (let i = 0; i < 6; i++) for (let k = 0; k < 3; k++) lift(i, () => { const cx = X(i) - .2 + k * .06, ch = .05 + r() * .05; put(new THREE.CylinderGeometry(.018, .02, ch, 8), 'wax', cx, PL + SILL + ch / 2, -.06); put(new THREE.SphereGeometry(.01, 5, 4).scale(1, 2.3, 1), 'flame', cx, PL + SILL + ch + .02, -.06); }); }
  // primroses at the foot, and a rag tied on a hood moulding's stop of every niche but the Guest's
  if (!AU) for (let i = 0; i < 6; i++) for (let j = 0; j < 5; j++) lift(i, () => { const px = X(i) + (r() - .5) * .9, pz = .22 + (r() - .5) * .3; put(new THREE.IcosahedronGeometry(.07, 0).scale(1, .45, 1), 'leaf', px, .03, pz);
    for (let q = 0; q < 4; q++) put(new THREE.SphereGeometry(.018, 5, 4).scale(1, .5, 1), q % 3 ? 'prim' : 'bloomW', px + (r() - .5) * .1, .065, pz + (r() - .5) * .1); });
  if (!AU) ORDER.forEach((g, i) => { if (g === 'guest') return; const len = .22 + r() * .16; lift(i, () => put(new THREE.PlaneGeometry(.04, len), 'rag' + (i % 5), X(i) + (i % 2 ? 1 : -1) * (RW / 2 + .06), PL + RSPRING - .1 - len / 2, .06, (r() - .5) * .5, 0, (r() - .5) * .2)); });
  const group = new THREE.Group(); group.name = 'row of seven'; let tris = 0;
  for (const [k, gs] of B) { const g = mergeGeometries(gs); gs.forEach(x => x.dispose()); const m = new THREE.Mesh(g, M[k]); m.name = 'row:' + k; m.castShadow = !['flame', 'water', 'sheet', 'pal'].includes(k); m.receiveShadow = true; group.add(m); tris += g.attributes.position.count / 3; }
  return { group, tris: Math.round(tris), draws: group.children.length, niches, len: X(6) - X(0) + W, foot: { x0: X(0) - .6, x1: X(6) + .6, z0: -.58, z1: .14 }, rail, island: isl,
    ...(AU ? { piers: [[X(0) - 1.3, X(0) - .6], [X(6) + .6, X(6) + 1.3]].map(([a, b]) => ({ x0: a, x1: b, z0: -.7, z1: -.55 })), tithe: { x: .98, z: 1.6 }, reach: { z0: -.9, z1: 2.17 } } : {}) };
}
// ── the halls' fixtures (Session 1516; Michael's C on #805, 28 Oct 2026: each island its own), copied from the concept artist's
// docs/prototypes/levelup/halls.js (27 Oct): the Mark's pitch torch in an iron bracket, the Gatelands' sconce of two candles, Aurenne's
// lamp stand and wall lamp, and a candle on a table. A bracket's ring is at 1.95 m, a torch's flame 2.25, a sconce's candles 1.75, a
// stand's lamp 1.45: over a 1.9 m man's head, under a 2.4 m ceiling.
//   PKIT.halls.fixtures(list) -> { group, flames (the torches'), small, lights: [{ p, k, r, col, type }], tris, draws, tick(ms) }; list is [{ type, x, y, z,
//   nx, nz }] in the caller's frame: y the floor (or a table's top for 'tablecandle'), (nx, nz) the wall's way into the room (a stand
//   or a candle stands free). A light's k is the prototype's ×0.275, on the scale of the game's room lamps (the alehall's iron lamp,
//   1.1 here, is 4 there). The flames flicker by tick; the rest is one mesh a material.
let HM = null, HPUFF = null;
function hallPuff() { if (HPUFF) return HPUFF; const c = document.createElement('canvas'); c.width = c.height = 64; const x = c.getContext('2d'), g = x.createRadialGradient(32, 32, 0, 32, 32, 32);
  g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(.4, 'rgba(255,255,255,.45)'); g.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = g; x.fillRect(0, 0, 64, 64); return (HPUFF = new THREE.CanvasTexture(c)); }
function hallMats() {
  if (HM) return HM;
  HM = { iron: new THREE.MeshStandardMaterial({ color: 0x1c1a18, roughness: .55, metalness: .6 }), brand: new THREE.MeshStandardMaterial({ color: 0x5a3e26, roughness: .8 }),
    pitch: new THREE.MeshStandardMaterial({ color: 0x120c08, emissive: new THREE.Color(.6, .18, .04), emissiveIntensity: .6, roughness: 1 }),
    wax: new THREE.MeshStandardMaterial({ color: 0xeee2c4, roughness: .45, emissive: new THREE.Color(.5, .3, .12), emissiveIntensity: .25 }),
    bronze: new THREE.MeshStandardMaterial({ color: 0x9a6a32, roughness: .35, metalness: .85 }), clay: new THREE.MeshStandardMaterial({ color: 0xb0643a, roughness: .7 }),
    soot: new THREE.MeshBasicMaterial({ map: hallPuff(), color: 0x000000, transparent: true, opacity: .55, depthWrite: false }),
    flame: new THREE.MeshBasicMaterial({ color: new THREE.Color(2.6, 1.35, .45), transparent: true, opacity: .9, depthWrite: false, blending: THREE.AdditiveBlending }),
    core: new THREE.MeshBasicMaterial({ color: new THREE.Color(3, 2.3, 1.2), transparent: true, opacity: .95, depthWrite: false, blending: THREE.AdditiveBlending }) };
  HM.soot.polygonOffset = true; HM.soot.polygonOffsetFactor = -2; return HM;
}
function hallFlameGeo(r, h) { const pts = []; for (let i = 0; i <= 8; i++) { const t = i / 8; pts.push(new THREE.Vector2(r * Math.sin(Math.PI * Math.pow(t, .7)) * (1 - t * .35), t * h)); } return new THREE.LatheGeometry(pts, 8); }
function hallParts(type) {
  const cyl = (r0, r1, h, n = 8) => new THREE.CylinderGeometry(r1, r0, h, n);
  const at = (g, x, y, z, rx = 0, ry = 0, rz = 0) => g.applyMatrix4(new THREE.Matrix4().compose(new THREE.Vector3(x, y, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(rx, ry, rz)), new THREE.Vector3(1, 1, 1)));
  const P = [], F = [];
  if (type === 'torch') {
    // an iron plate on the wall, an arm out 0.15 m to a ring, the brand through the ring leaning 20 degrees out, its head wound in pitch
    P.push([at(new THREE.BoxGeometry(.07, .24, .015), 0, 1.95, .008), 'iron'], [at(new THREE.BoxGeometry(.018, .018, .15), 0, 1.92, .08), 'iron'], [at(new THREE.TorusGeometry(.03, .006, 4, 10), 0, 1.92, .155, Math.PI / 2), 'iron']);
    const lean = .35, d = new THREE.Vector3(0, Math.cos(lean), Math.sin(lean)), ring = new THREE.Vector3(0, 1.92, .155), foot = ring.clone().addScaledVector(d, -.3), tip = ring.clone().addScaledVector(d, .26);
    const mid = foot.clone().lerp(tip, .5); P.push([at(cyl(.016, .022, .56), mid.x, mid.y, mid.z, lean), 'brand']);
    const head = tip.clone().addScaledVector(d, -.05); P.push([at(cyl(.032, .028, .12, 8), head.x, head.y, head.z, lean), 'pitch']);
    F.push({ g: hallFlameGeo(.06, .34), p: tip.clone().addScaledVector(d, .005), core: .45 });
    P.push([at(new THREE.PlaneGeometry(.55, 1.0), 0, 2.55, .004), 'soot']);
    return { P, F, light: { at: [0, tip.y + .14, tip.z + .1], k: 5, r: 8, col: [1, .55, .24] } };
  }
  if (type === 'sconce') {
    // an iron back-plate with a scrolled top, an arm to a drip pan, two candles of 0.14 m
    P.push([at(new THREE.BoxGeometry(.11, .3, .012), 0, 1.6, .007), 'iron'], [at(new THREE.TorusGeometry(.04, .006, 4, 10, Math.PI), 0, 1.76, .01), 'iron'],
      [at(new THREE.BoxGeometry(.014, .014, .12), 0, 1.56, .07), 'iron'], [at(cyl(.06, .065, .012, 12), 0, 1.6, .12), 'iron']);
    for (const x of [-.035, .035]) { P.push([at(cyl(.011, .011, .14, 8), x, 1.676, .12), 'wax']); F.push({ g: hallFlameGeo(.008, .04), p: new THREE.Vector3(x, 1.752, .12), core: .5 }); }
    P.push([at(new THREE.PlaneGeometry(.22, .4), 0, 1.95, .004), 'soot']);
    return { P, F, light: { at: [0, 1.82, .2], k: 1.8, r: 5.5, col: [1, .68, .38] } };
  }
  if (type === 'stand') {
    // a bronze tripod, a shaft of 1.3 m, a disc, and on it a clay oil lamp, its flame at the nozzle
    for (let k = 0; k < 3; k++) { const a = k / 3 * Math.PI * 2 + .5, foot = new THREE.Vector3(Math.cos(a) * .17, 0, Math.sin(a) * .17), top = new THREE.Vector3(0, .22, 0), d = top.clone().sub(foot), g = cyl(.012, .008, d.length(), 5);
      g.applyMatrix4(new THREE.Matrix4().compose(foot.clone().lerp(top, .5), new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize()), new THREE.Vector3(1, 1, 1))); P.push([g, 'bronze']); }
    P.push([at(cyl(.014, .011, 1.3, 8), 0, .82, 0), 'bronze'], [at(new THREE.SphereGeometry(.03, 8, 6), 0, .2, 0), 'bronze'], [at(cyl(.1, .09, .014, 16), 0, 1.47, 0), 'bronze']);
    P.push([at(new THREE.SphereGeometry(1, 12, 6).scale(.07, .028, .045), 0, 1.5, 0), 'clay'], [at(cyl(.012, .012, .07, 6), .07, 1.51, 0, 0, 0, Math.PI / 2), 'clay']);
    F.push({ g: hallFlameGeo(.012, .06), p: new THREE.Vector3(.105, 1.515, 0), core: .5 });
    return { P, F, light: { at: [.1, 1.62, 0], k: 2.6, r: 6.5, col: [1, .74, .44] } };
  }
  if (type === 'walllamp') {
    // a bronze shelf on a curved arm, the clay lamp, its nozzle turned out into the room
    P.push([at(new THREE.BoxGeometry(.06, .16, .012), 0, 1.5, .007), 'bronze'], [at(new THREE.TorusGeometry(.07, .007, 4, 8, Math.PI / 2), 0, 1.5, .013, 0, Math.PI / 2, Math.PI), 'bronze'],
      [at(cyl(.06, .065, .01, 12), 0, 1.57, .08), 'bronze'], [at(new THREE.SphereGeometry(1, 12, 6).scale(.045, .028, .07), 0, 1.6, .08), 'clay'], [at(cyl(.012, .012, .07, 6), 0, 1.61, .15, Math.PI / 2), 'clay']);
    F.push({ g: hallFlameGeo(.012, .06), p: new THREE.Vector3(0, 1.615, .185), core: .5 });
    P.push([at(new THREE.PlaneGeometry(.2, .35), 0, 1.9, .004), 'soot']);
    return { P, F, light: { at: [0, 1.72, .28], k: 1.9, r: 5.5, col: [1, .74, .44] } };
  }
  if (type === 'tablecandle') {
    P.push([at(cyl(.035, .03, .015, 10), 0, .008, 0), 'iron'], [at(cyl(.008, .01, .07, 8), 0, .05, 0), 'iron'], [at(cyl(.011, .011, .12, 8), 0, .145, 0), 'wax']);
    F.push({ g: hallFlameGeo(.008, .04), p: new THREE.Vector3(0, .207, 0), core: .5 });
    return { P, F, light: { at: [0, .3, 0], k: .9, r: 3.5, col: [1, .68, .38] } };
  }
  throw new Error('fixture ' + type);
}
function hallFixtures(list) {
  const M = hallMats(), buckets = new Map(), flames = [], lights = [], small = [], group = new THREE.Group(); group.name = 'hall fixtures';
  for (const f of list) {
    const { P, F, light } = hallParts(f.type), ry = f.nx == null ? 0 : Math.atan2(f.nx, f.nz);
    const T = new THREE.Matrix4().compose(new THREE.Vector3(f.x, f.y || 0, f.z), new THREE.Quaternion().setFromEuler(new THREE.Euler(0, ry, 0)), new THREE.Vector3(1, 1, 1));
    for (const [g, k] of P) { const q = g.index ? g.toNonIndexed() : g; for (const a of Object.keys(q.attributes)) if (!['position', 'normal', 'uv'].includes(a)) q.deleteAttribute(a);
      if (!q.attributes.uv) q.setAttribute('uv', new THREE.Float32BufferAttribute(new Float32Array(q.attributes.position.count * 2), 2)); q.applyMatrix4(T); if (!buckets.has(k)) buckets.set(k, []); buckets.get(k).push(q); }
    if (f.type !== 'torch') { for (const fl of F) { const p = fl.p.clone().applyMatrix4(T); small.push([fl.g, p, fl.core]); } }
    else for (const fl of F) { const p = fl.p.clone().applyMatrix4(T), m = new THREE.Mesh(fl.g, M.flame), c = new THREE.Mesh(fl.g, M.core); c.scale.setScalar(fl.core); m.add(c); m.position.copy(p); m.renderOrder = 6;
      const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: hallPuff(), color: new THREE.Color(1, .55, .22), transparent: true, opacity: f.type === 'torch' ? .35 : .22, depthWrite: false, blending: THREE.AdditiveBlending }));
      const hs = f.type === 'torch' ? .7 : .16; halo.scale.set(hs, hs, 1); halo.position.y = fl.g.parameters.points.at(-1).y * .45; m.add(halo); m.userData.hallFlame = true; group.add(m); flames.push([m, flames.length * 1.7]); }
    const L = new THREE.Vector3(...light.at).applyMatrix4(T); lights.push({ p: L.toArray(), k: +(light.k * .275).toFixed(3), r: light.r, col: light.col, type: f.type });
  }
  let tris = 0;
  for (const [k, gs] of buckets) { const g = mergeGeometries(gs); gs.forEach(x => x.dispose()); const m = new THREE.Mesh(g, M[k]); m.name = 'hall:' + k; if (k === 'soot') m.renderOrder = 4; group.add(m); tris += g.attributes.position.count / 3; }
  for (const [m] of flames) tris += m.geometry.index.count / 3 * 2;
  // a candle's or a lamp's flame is a few centimetres: all of them are one flame mesh, one core and one set of halos (three draws for
  // the room, not three a flame), flickered by their brightness and the halos' size rather than one by one
  let sm = null;
  if (small.length) { const fg = [], cg = [], hp = [];
    for (const [g, p, c] of small) { const q = g.toNonIndexed(); fg.push(q.clone().translate(p.x, p.y, p.z)); cg.push(q.scale(c, c, c).translate(p.x, p.y, p.z)); hp.push(p.x, p.y + g.parameters.points.at(-1).y * .45, p.z); }
    const fm = M.flame.clone(), cm = M.core.clone(), F1 = new THREE.Mesh(mergeGeometries(fg), fm), C1 = new THREE.Mesh(mergeGeometries(cg), cm); fg.concat(cg).forEach(x => x.dispose());
    const hg = new THREE.BufferGeometry(); hg.setAttribute('position', new THREE.Float32BufferAttribute(hp, 3));
    const hm = new THREE.PointsMaterial({ map: hallPuff(), color: new THREE.Color(1, .55, .22), size: .16, sizeAttenuation: true, transparent: true, opacity: .22, depthWrite: false, blending: THREE.AdditiveBlending }), H1 = new THREE.Points(hg, hm);
    for (const m of [F1, C1, H1]) { m.renderOrder = 6; m.userData.hallFlame = true; group.add(m); } F1.name = 'hall:flames'; C1.name = 'hall:cores'; H1.name = 'hall:halos';
    tris += F1.geometry.attributes.position.count / 3 * 2; sm = { fm, cm, hm }; }
  const tick = t => { const s = t * .001; for (const [m, ph] of flames) { const a = 1 + .08 * Math.sin(s * 13 + ph) + .05 * Math.sin(s * 29 + ph * 2.3); m.scale.set(1 / Math.sqrt(a), a, 1 / Math.sqrt(a)); m.rotation.z = .05 * Math.sin(s * 7 + ph); }
    if (sm) { const a = .08 * Math.sin(s * 11) + .05 * Math.sin(s * 23.7); sm.fm.opacity = .85 + a; sm.cm.opacity = .92 + a * .5; sm.hm.size = .16 * (1 + a); } };
  return { group, flames: flames.map(f => f[0]), small: small.length, lights, tris: Math.round(tris), draws: buckets.size + flames.length * 3 + (sm ? 3 : 0), tick };
}
  return { stream, hashKey, mergeByMaterial, halls: { fixtures: hallFixtures }, texturesMade: () => Object.keys(TEX).length, signsMade: () => Object.keys(SIGNS).filter(k => !PANEL_KEY.test(k)).length, panelsMade: () => Object.keys(SIGNS).filter(k => PANEL_KEY.test(k)).length,
    mk: { hall: markHall, lot: markLot, alehall: markAlehall, longhouse: markLonghouse, mats: markMats },
    au: { house: aurenneHouse, lot: aurenneLot, courtyard: aurenneCourtyard, church: aurenneChurch, churchBox: aurenneChurchBox, churchHall: aurenneChurchHall, courtyardHouse: aurenneCourtyardHouse, tavern: aurenneTavern, mats: aurMats, roomMats: homeMats, AUR },
    gl: { PLANS, FIN, PS, PAINTS, TOWN: GL_TOWN, building, church, keep, farmstead, coachInn, coachInnPlan, coachRoom, townhouse: townhouseRoom, farmhouse: farmhouseRoom, byre: byreRoom, barn: barnRoom, row: shrineRow, ROW_GODS, inn: gatelandsInn, cottage: gatelandsCottage, churchLen: n => +((n === 2 ? 2 : 3) * 4.8 + 1.6 + 5.6 - .5 + 7.2 - .9 - .02).toFixed(2), lot: gatelandsLot, mats: glMats, BAYS, bayPlan, bayWidth, baysFor } };
})();
