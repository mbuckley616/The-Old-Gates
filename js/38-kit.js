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
    // bark (Session 1540, the felled trunk): deep furrows along the trunk (y) between plates broken by short cross-cracks, grey-brown
    bark: () => texPair(256, (x, y) => { const w = tfbm(x, y, 3, 3, 61) * 1.6, f = Math.abs(Math.sin((x * 9 + w) * Math.PI)), cr = Math.pow(Math.abs(Math.sin((y * 7 + tfbm(x, y, 9, 2, 63) * 2) * Math.PI)), 18) * (f > .5 ? 1 : 0), n = tfbm(x, y, 20, 3, 67);
      const h = Math.max(0, f ** .6 - cr * .6) * .8 + n * .2, v = .14 + .12 * h + .03 * n; return [h, v * 1.05, v * .9, v * .74]; }, 2.6),
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
// ── the guild hall's room (Session 1701, card F9; rooms.js's gatelandsGuildHall of Sessions 939, 965 and 966, inside PLANS.guildhall,
// Michael's C on #352), with the inn's renames (mats() → roomMats(), GL_PLANS → PLANS, gatelandsBuilding → building) and two of its
// own: forgeMats() → guildForgeMats() (the three the room takes: steel, leather, the grindstone's grit) and libSpines() → guildSpines()
// (its texture carries no colour space, as every texture of the kit). The shell's stream is o.shell. The prototype's comment follows.
let GFM = null, GSPINE = null;
function guildForgeMats() {
  if (GFM) return GFM;
  GFM = { steel: new THREE.MeshStandardMaterial({ color: 0x5c5e62, roughness: .3, metalness: .85 }), leather: new THREE.MeshStandardMaterial({ color: 0x24170f, roughness: .75 }), grit: mat('rock', { ns: .8, color: 0xb0a690, rough: 1 }) };
  return GFM;
}
function guildSpines() {
  if (!GSPINE) { /* a metre of spines: codices of every width in leathers and dyed cloth, two gilt bands on each, the tops uneven */ const c = document.createElement('canvas'); c.width = 512; c.height = 128; const x = c.getContext('2d'), q = stream('library-spines'), hues = ['#5a2a1c', '#6e3a22', '#3a2418', '#7a1e1a', '#26386e', '#2a4a3a', '#8a5a2a', '#4a2a3a', '#9a7a4a'];
    x.fillStyle = '#140c08'; x.fillRect(0, 0, 512, 128); for (let u = 0; u < 512;) { const w = 10 + Math.floor(q() * 22), top = Math.floor(q() * 26); x.fillStyle = hues[Math.floor(q() * hues.length)]; x.fillRect(u + 1, top, w - 2, 128 - top);
      x.fillStyle = 'rgba(214,170,80,.85)'; for (const y of [top + 14, 112]) x.fillRect(u + 2, y, w - 4, 3); x.fillStyle = 'rgba(255,255,255,.08)'; x.fillRect(u + 2, top, 2, 128 - top); u += w; }
    GSPINE = new THREE.CanvasTexture(c); GSPINE.colorSpace = THREE.NoColorSpace; GSPINE.wrapS = GSPINE.wrapT = THREE.RepeatWrapping; }
  return GSPINE;
}
// gatelandsGuildHall(o, r) (Session 939, card F9; L5's guildhall by nation, OG-043's guildhall "hall of trade, contracts and guild
//   meetings"; the game's Fighters' Guild hall, S12 and S292: a steward at the desk, the notice board, the weapon racks, armour stands,
//   the long table with benches, a grindstone, a dormitory of beds). Since Session 965 (Michael's C on #352) it stands in the kit's own
//   guild hall (GL_PLANS.guildhall: 14.4 by 9.0 m, walls of 0.7 m, 6.4 m to the wall plate, slate at 40°), its great door open:
//   the hall in the west end, open to the roof on three arch-braced collar trusses, purlins and a boarded lining; the hearth in the west
//   gable with the guild's red shield on its breast, the long table and its benches before it; the steward's desk facing the great door
//   with the ledger, the inkwell and a quill, and the notice board on the back wall behind it under the gallery; the rack of swords,
//   spears and axes under the gallery west of the back door; two armour stands by the front wall; the practice floor with its pell and
//   the grindstone; a wheel of candles from the middle collar. The stair rises along the partition from the front to the gallery, which
//   runs the hall's back wall at the first floor (3.2 m) with a rail over the hall and a bench under its high lights, and opens at its
//   east end into the dormitory: six beds heads to the east gable, a chest at each foot, the aisle along the partition. Under the
//   dormitory, through a door by the stair's foot, the steward's room: a table and the guild's books, a press, the strongbox.
//   o.guild 'mages' (Session 966; the game's Mages' Guild of S292: bookcases, potion shelves either side of the board, the still, a
//   reading table of open books): the same house and the same bones in blue, its banner a gilt star; the long table a reading table of
//   open codices; potion shelves where the rack and its pair stand, either side of the board; the still on its furnace by the front
//   wall where the armour stood, its green light; a lectern with a great book on the practice floor, a round table of scrolls by the
//   gallery; three presses of codices along the gallery between its high lights.
//   -> { group, shell, room, tris, draws, inner, floors [ground, upper], roofY(z), eave, door, hearth, fire, stair, gallery, part, doors
//        { steward, dorm }, desk, board, table, benches, stands, rack, pell, grind, beds, paths [{ fl, pts }], boxes (tagged, with their
//        floor), lamp, dormLamp, windows, w, d }
function guildHallRoom(o = {}, r = stream('guild')) {
  const MG = o.guild === 'mages', plan = PLANS.guildhall({ ajar: true, guild: MG ? 'mages' : 'fighters' }); plan.interior = true; plan.r = stream(o.shell || 'guild-shell');
  const shell = building(plan), F = guildForgeMats(), M = { ...roomMats(), steel: F.steel, leather: F.leather, grit: F.grit, red: mat('plaster', { ns: .4, color: 0x7a2020, rough: 1 }), mail: new THREE.MeshStandardMaterial({ color: 0x74767a, roughness: .55, metalness: .35 }) /* matte, with nothing round it to mirror */,
    blue: mat('plaster', { ns: .4, color: 0x24406e, rough: 1 }), gilt: new THREE.MeshStandardMaterial({ color: 0xc8952e, roughness: .3, metalness: .75 }), books: new THREE.MeshStandardMaterial({ map: guildSpines(), roughness: .8 }),
    phial: new THREE.MeshStandardMaterial({ color: 0x3a8a52, emissive: 0x2a9a4a, emissiveIntensity: .35, roughness: .1, transparent: true, opacity: .8 }) }, B = new Map(), boxes = [], t = plan.t, X = plan.w / 2 - t, Z = plan.d / 2 - t, F0 = .05, F1 = plan.floors[0], EAVE = plan.floors[0] + plan.floors[1];
  const p = plan.roof.pitch * Math.PI / 180, tp = Math.tan(p), roofY = z => EAVE + (plan.d / 2 - Math.abs(z)) * tp /* the slate's underside */, LIN = .035 /* the lining under it */;
  const PX0 = plan.hallX + .3, PX1 = PX0 + .25 /* the partition between the hall and the east end */;
  const put = (geo, key, x = 0, y = 0, z = 0, ry = 0, uv = .6, rx = 0, rz = 0) => { const g = geo.index ? geo.toNonIndexed() : geo; for (const k of Object.keys(g.attributes)) if (!['position', 'normal'].includes(k)) g.deleteAttribute(k);
    g.applyMatrix4(new THREE.Matrix4().compose(new THREE.Vector3(x, y, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(rx, ry, rz)), new THREE.Vector3(1, 1, 1))); worldUV(g, uv); if (!B.has(key)) B.set(key, []); B.get(key).push(g); return g; };
  const bx = (key, x0, x1, y0, y1, z0, z1, tag, fl) => { const g = put(new THREE.BoxGeometry(x1 - x0, y1 - y0, z1 - z0), key, (x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2, 0, key === 'books' ? 1 : .6);
    if (key === 'books') { const U = g.attributes.uv, P = g.attributes.position; for (let i = 0; i < U.count; i++) U.setY(i, (P.getY(i) - y0) / (y1 - y0)); } if (tag) boxes.push({ tag, x0, x1, y0, y1, z0, z1, fl }); };
  const C1 = MG ? 'blue' : 'red' /* the guild's colour */;
  // a timber from (y0, z0) to (y1, z1) in the plane x, w wide (along x) and h deep
  const beam = (key, x, y0, z0, y1, z1, w, h) => { const L = Math.hypot(y1 - y0, z1 - z0); put(new THREE.BoxGeometry(w, h, L), key, x, (y0 + y1) / 2, (z0 + z1) / 2, 0, .6, Math.atan2(-(y1 - y0), z1 - z0)); };
  // the floor: flags in courses, the hall and the steward's room alike
  for (let z = -Z; z < Z - .05;) { const d = Math.min(Z - z, .55 + r() * .35); for (let x = -X; x < X - .05;) { const w = Math.min(X - x, .6 + r() * .45); put(new THREE.BoxGeometry(w - .02, .05, d - .02), 'flag', x + w / 2, .025 + (r() - .5) * .006, z + d / 2, (r() - .5) * .01, .7); x += w; } z += d; }
  // the partition: limewashed to the roof's lining, a door at its foot by the front wall into the steward's room, and one at the
  // gallery's end into the dormitory (shape in -z, y; extruded along x)
  const doors = { steward: { z0: Z - .95, z1: Z - .1, y0: F0, y1: F0 + 2.05 }, dorm: { z0: -Z + .45, z1: -Z + 1.25, y0: F1, y1: F1 + 2.0 } };
  { const s = new THREE.Shape(), top = z => roofY(z) - LIN - .005; s.moveTo(Z, 0); s.lineTo(-Z, 0); s.lineTo(-Z, top(Z)); s.lineTo(0, top(0)); s.lineTo(Z, top(Z)); s.lineTo(Z, 0);
    for (const d of Object.values(doors)) { const h = new THREE.Path(); h.moveTo(-d.z1, d.y0); h.lineTo(-d.z0, d.y0); h.lineTo(-d.z0, d.y1); h.lineTo(-d.z1, d.y1); h.lineTo(-d.z1, d.y0); s.holes.push(h); }
    const g = new THREE.ExtrudeGeometry(s, { depth: PX1 - PX0, bevelEnabled: false }); g.rotateY(Math.PI / 2); put(g, 'lime', PX0, 0, 0, 0, .5);
    for (const d of Object.values(doors)) { bx('oak', PX0 - .03, PX1 + .03, d.y1, d.y1 + .14, d.z0 - .08, d.z1 + .08); for (const zz of [d.z0 - .08, d.z1]) bx('oak', PX0 - .03, PX1 + .03, d.y0, d.y1, zz, zz + .08); }
    // the leaves, open into the east end flat against the partition
    bx('oak', PX1, PX1 + .05, doors.steward.y0, doors.steward.y1 - .02, doors.steward.z0 - .86, doors.steward.z0 - .02, 'leaf', 0); bx('oak', PX1, PX1 + .05, doors.dorm.y0, doors.dorm.y1 - .02, doors.dorm.z1 + .02, doors.dorm.z1 + .82, 'leaf', 1); }
  // the hearth in the west gable, its breast and flue to the roof; the guild's red shield on the breast over the mantel
  const hw = 1.6, hh = 1.3, BD = .5, hx = -X; { const z0 = -hw / 2 - .4, z1 = hw / 2 + .4; bx('lime', hx, hx + BD, hh, F1 + .6, z0, z1); bx('lime', hx, hx + BD, 0, hh, z0, -hw / 2, 'breast', 0); bx('lime', hx, hx + BD, 0, hh, hw / 2, z1, 'breast', 0);
    bx('lime', hx, hx + .35, F1 + .6, roofY(.6) - LIN - .02, -.6, .6);
    bx('soot', hx, hx + .02, 0, hh, -hw / 2, hw / 2); bx('soot', hx, hx + BD, hh - .02, hh, -hw / 2, hw / 2); bx('oak', hx + BD - .3, hx + BD + .08, hh, hh + .24, -hw / 2 - .25, hw / 2 + .25); bx('flag', hx + BD, hx + BD + .8, F0, F0 + .03, -hw / 2, hw / 2, 'hearthstone', 0);
    const s = new THREE.Shape(); s.moveTo(-.5, 0); s.lineTo(.5, 0); s.lineTo(.5, -1.0); s.lineTo(0, -1.22); s.lineTo(-.5, -1.0); s.lineTo(-.5, 0);
    const g = new THREE.ShapeGeometry(s); g.rotateY(Math.PI / 2); put(g, C1, hx + BD + .03, F1 + .3, 0); bx('iron', hx + BD + .02, hx + BD + .035, F1 - .55, F1 - .25, -.03, .03); bx('iron', hx + BD + .02, hx + BD + .035, F1 - .42, F1 - .38, -.16, .16);
    if (MG) { const st = new THREE.Shape(); for (let i = 0; i < 16; i++) { const a = i / 16 * Math.PI * 2, rr = i % 2 ? .1 : .3; st[i ? 'lineTo' : 'moveTo'](Math.cos(a) * rr, Math.sin(a) * rr); } const sg = new THREE.ShapeGeometry(st); sg.rotateY(Math.PI / 2); put(sg, 'gilt', hx + BD + .04, F1 - .2, 0); }
    else for (const s2 of [-1, 1]) { put(new THREE.BoxGeometry(.03, 1.5, .05), 'steel', hx + BD + .05, F1 - .2, 0, 0, .6, s2 * .62); } }
  const fx = hx + .28, fire = [fx + .05, .32, 0]; for (let i = 0; i < 7; i++) { const a = i / 7 * Math.PI * 2; put(new THREE.BoxGeometry(.24, .1, .12), 'turf', fx + Math.cos(a) * .15, .06 + (i % 2) * .08, Math.sin(a) * .22, a + 1.3); }
  put(new THREE.SphereGeometry(.16, 10, 6).scale(1.2, .4, 1.4), 'ember', fx, .08, 0); for (let i = 0; i < 3; i++) put(new THREE.ConeGeometry(.07, .28 + i * .06, 7), 'flame', fx + (i - 1) * .04, .26, (i - 1) * .09);
  // the long table before the hearth, a bench either side; tankards and a candle on it
  const table = { x0: -4.9, x1: -2.9, z0: .2, z1: 1.0, y: F0 + .76 }; { const { x0, x1, z0, z1, y } = table; bx('oak', x0, x1, y - .05, y, z0, z1, 'table', 0); for (const xx of [x0 + .1, x1 - .18]) for (const zz of [z0 + .08, z1 - .16]) bx('oak', xx, xx + .08, F0, y - .05, zz, zz + .08);
    if (MG) for (let k = 0; k < 4; k++) { const cx = x0 + .3 + k * .45, cz = k % 2 ? z0 + .22 : z1 - .22; bx('linen', cx - .17, cx + .17, y, y + .012, cz - .12, cz + .12); bx('leather', cx - .19, cx + .19, y, y + .006, cz - .13, cz + .13); bx('leather', cx - .01, cx + .01, y, y + .03, cz - .13, cz + .13); }
    else for (let k = 0; k < 4; k++) put(new THREE.CylinderGeometry(.045, .045, .14, 10), k % 2 ? 'crock' : 'iron', x0 + .3 + k * .45, y + .07, (k % 2 ? z0 + .2 : z1 - .2));
    put(new THREE.CylinderGeometry(.012, .014, .14, 8), 'linen', (x0 + x1) / 2, y + .07, (z0 + z1) / 2); put(new THREE.SphereGeometry(.012, 6, 5).scale(1, 2, 1), 'flame', (x0 + x1) / 2, y + .155, (z0 + z1) / 2); }
  const benches = []; for (const [bz0, bz1] of [[-.25, .05], [1.15, 1.45]]) { bx('oak', table.x0, table.x1, F0 + .41, F0 + .45, bz0, bz1, 'bench', 0); for (const xx of [table.x0 + .1, table.x1 - .16]) bx('oak', xx, xx + .06, F0, F0 + .41, bz0 + .03, bz1 - .03); benches.push({ z0: bz0, z1: bz1, y: .45 }); }
  // two armour stands by the front wall between the great door and the east light: a post on a cross foot, a mail shirt, a helm, a shield
  const stands = [], still = MG ? { x0: -.75, x1: -.05, z0: Z - .62, z1: Z - .02, y: F0 + .8 } : null; if (MG) { const S = still, cx = (S.x0 + S.x1) / 2, cz = (S.z0 + S.z1) / 2;
    // the still on its furnace by the front wall: a stone furnace with its fire, the flask, the head and its beak down to the receiver on a stool
    bx('rubble', S.x0, S.x1, F0, S.y, S.z0, S.z1, 'still', 0); bx('soot', cx - .14, cx + .14, F0 + .15, F0 + .45, S.z0 - .005, S.z0); put(new THREE.SphereGeometry(.08, 8, 6).scale(1.3, .5, 1), 'ember', cx, F0 + .2, S.z0 + .06);
    put(new THREE.SphereGeometry(.2, 14, 10), 'phial', cx, S.y + .2, cz); put(new THREE.CylinderGeometry(.05, .07, .22, 10), 'phial', cx, S.y + .48, cz); put(new THREE.SphereGeometry(.12, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2).scale(1, 1.1, 1), 'crock', cx, S.y + .58, cz);
    const rx2 = .45, h0 = [cx + .08, S.y + .6], h1 = [rx2, F0 + .76], dx = h1[0] - h0[0], dy = h1[1] - h0[1]; put(new THREE.CylinderGeometry(.012, .022, Math.hypot(dx, dy), 8), 'crock', (h0[0] + h1[0]) / 2, (h0[1] + h1[1]) / 2, cz, 0, .6, 0, Math.atan2(-dx, dy));
    bx('oak', rx2 - .2, rx2 + .2, F0 + .5, F0 + .54, cz - .2, cz + .2, 'still', 0); for (const [a, b] of [[rx2 - .18, cz - .18], [rx2 + .14, cz - .18], [rx2 - .18, cz + .14], [rx2 + .14, cz + .14]]) bx('oak', a, a + .04, F0, F0 + .5, b, b + .04);
    put(new THREE.SphereGeometry(.13, 12, 8), 'phial', rx2, F0 + .66, cz); still.glow = [cx, S.y + .3, cz]; still.receiver = [rx2, F0 + .66, cz]; }
  for (const sx of MG ? [] : [-.55, .2]) { const sz = Z - .4; bx('oak', sx - .25, sx + .25, F0, F0 + .05, sz - .04, sz + .04); bx('oak', sx - .04, sx + .04, F0, F0 + .05, sz - .25, sz + .25); bx('oak', sx - .03, sx + .03, F0, F0 + 1.5, sz - .03, sz + .03);
    bx('oak', sx - .22, sx + .22, F0 + 1.38, F0 + 1.43, sz - .03, sz + .03); put(new THREE.CylinderGeometry(.2, .17, .62, 12, 1, true).scale(1, 1, .7), 'mail', sx, F0 + 1.08, sz); put(new THREE.SphereGeometry(.2, 12, 6, 0, Math.PI * 2, 0, Math.PI / 2).scale(1.05, .35, .75), 'mail', sx, F0 + 1.38, sz); put(new THREE.SphereGeometry(.105, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2), 'mail', sx, F0 + 1.5, sz); bx('mail', sx - .012, sx + .012, F0 + 1.38, F0 + 1.52, sz + .095, sz + .11);
    put(new THREE.CylinderGeometry(.27, .27, .03, 18).rotateX(Math.PI / 2 - .2), C1, sx + .1, F0 + .38, sz - .28); boxes.push({ tag: 'stand', x0: sx - .27, x1: sx + .27, y0: F0, y1: F0 + 1.64, z0: sz - .32, z1: sz + .27, fl: 0 }); stands.push([sx, sz]); }
  // the steward's desk facing the great door: a ledger open on it, the inkwell and a quill; the steward's stool behind it
  const desk = { x0: -2.1, x1: -.5, z0: -2.0, z1: -1.45, y: F0 + .78 }; { const { x0, x1, z0, z1, y } = desk, cx = (x0 + x1) / 2; bx('oak', x0, x1, F0, y - .04, z1 - .05, z1, 'desk', 0); bx('oak', x0, x0 + .05, F0, y - .04, z0, z1, 'desk', 0); bx('oak', x1 - .05, x1, F0, y - .04, z0, z1, 'desk', 0); bx('deal', x0 - .03, x1 + .03, y - .04, y, z0 - .03, z1 + .03);
    bx('linen', cx - .15, cx + .25, y, y + .02, z0 + .12, z1 - .1); bx('leather', cx - .17, cx + .27, y, y + .012, z0 + .1, z1 - .08); bx('iron', cx + .45, cx + .51, y, y + .05, z0 + .2, z0 + .26); put(new THREE.ConeGeometry(.012, .3, 4), 'linen', cx + .5, y + .15, z0 + .23, 0, .6, .3, .2);
    bx('deal', cx - .2, cx + .15, F0 + .45, F0 + .49, z0 - .55, z0 - .2, 'stool', 0); for (const [a, b] of [[cx - .18, z0 - .53], [cx + .1, z0 - .53], [cx - .18, z0 - .27], [cx + .1, z0 - .27]]) bx('deal', a, a + .04, F0, F0 + .45, b, b + .04); }
  // the notice board on the back wall behind the desk, under the gallery: a frame of oak, pinned notes of every size
  const board = { x0: -1.95, x1: -.65, y0: F0 + 1.2, y1: F0 + 2.1 }; { const { x0, x1, y0, y1 } = board; bx('deal', x0, x1, y0, y1, -Z, -Z + .03); for (const [a, b, c, d] of [[x0, x1, y0 - .05, y0], [x0, x1, y1, y1 + .05], [x0 - .05, x0, y0 - .05, y1 + .05], [x1, x1 + .05, y0 - .05, y1 + .05]]) bx('oak', a, b, c, d, -Z, -Z + .05);
    for (let k = 0; k < 11; k++) { const w = .14 + r() * .12, h = .16 + r() * .14, cx = x0 + .12 + r() * (x1 - x0 - .24), cy = y0 + .12 + r() * (y1 - y0 - .24); const g = new THREE.PlaneGeometry(w, h); put(g, 'linen', cx, cy, -Z + .035 + k * .0008, 0, .6, 0, (r() - .5) * .2); put(new THREE.SphereGeometry(.008, 4, 3), 'iron', cx, cy + h / 2 - .02, -Z + .045); } }
  // the weapons' rack on the back wall west of the back door, under the gallery: swords hilt up, spears and axes in a frame
  // the Mages' potion shelves either side of the board: an open frame of four shelves of phials, crocks and jars, one where the
  // Fighters' rack stands and its pair east of the low window
  const shelves = MG ? [{ x0: -4.55, x1: -3.3 }, { x0: .62, x1: 1.9 }].map(q => ({ ...q, z0: -Z, z1: -Z + .36, y1: F0 + 1.95 })) : [];
  for (const q of shelves) { bx('oak', q.x0, q.x1, F0, F0 + .08, q.z0, q.z1, 'shelves', 0); for (const xx of [q.x0, q.x1 - .05]) bx('oak', xx, xx + .05, F0, q.y1, q.z0, q.z1); bx('oak', q.x0, q.x1, F0, q.y1, q.z0, q.z0 + .02);
    for (let k = 0; k < 4; k++) { const y = F0 + .45 + k * .44; bx('deal', q.x0 + .05, q.x1 - .05, y - .025, y, q.z0, q.z1); for (let u = q.x0 + .14; u < q.x1 - .12; u += .13 + r() * .06) { const kind = r(), hh = .1 + r() * .12;
      if (kind < .45) { put(new THREE.CylinderGeometry(.03, .035, hh, 8), 'phial', u, y + hh / 2, q.z0 + .2); } else if (kind < .75) put(new THREE.CylinderGeometry(.05, .045, hh + .04, 8), 'crock', u, y + (hh + .04) / 2, q.z0 + .18); else { put(new THREE.SphereGeometry(.05, 8, 6), 'phial', u, y + .05, q.z0 + .2); } } } }
  const rack = { x0: -4.55, x1: -3.3, z0: -Z, z1: -Z + .32 }; if (!MG) { const { x0, x1, z0, z1 } = rack; bx('oak', x0, x1, F0, F0 + .1, z0, z1, 'rack', 0); bx('oak', x0, x1, F0 + 1.0, F0 + 1.06, z0, z1); for (const xx of [x0, x1 - .06]) bx('oak', xx, xx + .06, F0, F0 + 1.75, z0, z1);
    bx('oak', x0, x1, F0 + 1.7, F0 + 1.75, z0, z0 + .1); for (let k = 0, xx = x0 + .15; xx < x1 - .1; k++, xx += .18) { const kind = k % 3, zz = (z0 + z1) / 2;
      if (kind === 0) { bx('steel', xx - .02, xx + .02, F0 + .1, F0 + .95, zz - .004, zz + .004); bx('iron', xx - .08, xx + .08, F0 + .95, F0 + .98, zz - .015, zz + .015); bx('leather', xx - .015, xx + .015, F0 + .98, F0 + 1.15, zz - .015, zz + .015); }
      else if (kind === 1) { put(new THREE.CylinderGeometry(.014, .014, 1.9, 6), 'oak', xx, F0 + 1.05, zz); put(new THREE.ConeGeometry(.03, .22, 4).scale(1, 1, .3), 'steel', xx, F0 + 2.1, zz); }
      else { put(new THREE.CylinderGeometry(.016, .016, .8, 6), 'oak', xx, F0 + .5, zz); bx('steel', xx, xx + .14, F0 + .78, F0 + .92, zz - .006, zz + .006); } } }
  // the practice floor: a pell, the post scarred by blows; the grindstone on its frame by the gallery
  const pell = { x: .5, z: .6 }; if (MG) { const { x, z } = pell; // the lectern on the practice floor, a great book open on it
    bx('oak', x - .25, x + .25, F0, F0 + .06, z - .25, z + .25, 'lectern', 0); put(new THREE.CylinderGeometry(.06, .07, 1.0, 8), 'oak', x, F0 + .55, z); put(new THREE.BoxGeometry(.6, .04, .45), 'oak', x, F0 + 1.1, z, 0, .6, .35);
    put(new THREE.BoxGeometry(.56, .03, .4), 'linen', x, F0 + 1.135, z + .01, 0, .6, .35); boxes.push({ tag: 'lectern', x0: x - .3, x1: x + .3, y0: F0, y1: F0 + 1.25, z0: z - .3, z1: z + .3, fl: 0 }); }
  else { const { x, z } = pell; bx('oak', x - .3, x + .3, F0, F0 + .08, z - .3, z + .3, 'pell', 0); put(new THREE.CylinderGeometry(.11, .12, 1.7, 10), 'oak', x, F0 + .93, z); for (let k = 0; k < 6; k++) bx('soot', x + .1, x + .125, F0 + .9 + k * .12, F0 + .92 + k * .12, z - .05 + (k % 2) * .04, z + .02 + (k % 2) * .04); }
  const grind = { x: 1.1, z: -1.3 }; if (MG) { const { x, z } = grind; // a round table of scrolls and a stool by the gallery
    put(new THREE.CylinderGeometry(.42, .42, .05, 18), 'oak', x, F0 + .74, z); put(new THREE.CylinderGeometry(.06, .08, .7, 8), 'oak', x, F0 + .37, z); put(new THREE.CylinderGeometry(.25, .28, .04, 12), 'oak', x, F0 + .02, z);
    for (let k = 0; k < 3; k++) put(new THREE.CylinderGeometry(.03, .03, .34, 8), 'linen', x - .12 + k * .1, F0 + .795, z - .05 + (k % 2) * .1, 0, .6, Math.PI / 2, .3 * k); put(new THREE.CylinderGeometry(.012, .014, .12, 8), 'linen', x + .2, F0 + .83, z + .15); put(new THREE.SphereGeometry(.012, 6, 5).scale(1, 2, 1), 'flame', x + .2, F0 + .905, z + .15);
    boxes.push({ tag: 'grind', x0: x - .42, x1: x + .42, y0: F0, y1: F0 + .9, z0: z - .42, z1: z + .42, fl: 0 }); }
  else { const { x, z } = grind; for (const dz of [-.22, .22]) { bx('oak', x - .3, x + .3, F0 + .1, F0 + .16, z + dz - .03, z + dz + .03); bx('oak', x - .03, x + .03, F0, F0 + .7, z + dz - .03, z + dz + .03); }
    const st = new THREE.CylinderGeometry(.36, .36, .1, 22); st.rotateX(Math.PI / 2); put(st, 'grit', x, F0 + .72, z, 0, .4); bx('iron', x - .015, x + .015, F0 + .7, F0 + .74, z - .3, z + .3); boxes.push({ tag: 'grind', x0: x - .36, x1: x + .36, y0: F0, y1: F0 + 1.08, z0: z - .32, z1: z + .32, fl: 0 }); }
  // the gallery along the back wall at the first floor: joists and boards, a bressummer on three posts, a rail of balusters over the hall
  // (open at the stair's head), a bench under the high lights
  const GZ = -Z + 1.35, N = 16, rise = +((F1 - F0) / N).toFixed(4), going = .27, SX0 = PX0 - .9, SZF = GZ + (N - 1) * going, gallery = { x0: -X, x1: PX0, z0: -Z, z1: GZ, y: F1 };
  bx('oak', -X, PX0, F1 - .2, F1 - .04, -Z, GZ); bx('deal', -X, PX0, F1 - .04, F1, -Z, GZ); bx('oak', -X, SX0, F1 - .32, F1 - .04, GZ - .16, GZ);
  const posts = [-4.4, -2.0, .4]; for (const x of posts) { bx('oak', x - .08, x + .08, F0, F1 - .32, GZ - .16, GZ, 'post', 0); bx('oak', x - .25, x + .25, F1 - .44, F1 - .32, GZ - .18, GZ + .02); }
  bx('oak', -X, SX0, F1 + .95, F1 + 1.01, GZ - .1, GZ, 'rail', 1); bx('oak', -X, SX0, F1, F1 + .06, GZ - .08, GZ); for (let x = -X + .15; x < SX0 - .05; x += .28) bx('oak', x - .02, x + .02, F1 + .06, F1 + .95, GZ - .07, GZ - .03);
  bx('oak', SX0 - .06, SX0 + .04, F1 - .3, F1 + 1.1, GZ - .1, GZ, 'rail', 1) /* the newel at the rail's end */;
  const gbench = { x0: -5.9, x1: -3.6 }, presses = MG ? [[-4.6, -3.2], [-2.0, -.6], [.6, 1.9]] : [];
  if (!MG) { bx('oak', gbench.x0, gbench.x1, F1 + .41, F1 + .45, -Z + .05, -Z + .38, 'gbench', 1); for (const xx of [gbench.x0 + .1, gbench.x1 - .16]) bx('oak', xx, xx + .06, F1, F1 + .41, -Z + .08, -Z + .35); }
  // the Mages' presses along the gallery, between its high lights: open cases of five shelves of codices
  for (const [x0, x1] of presses) { const z0 = -Z, z1 = -Z + .4, y1 = F1 + 2.2; bx('oak', x0, x1, F1, F1 + .1, z0, z1, 'press', 1); bx('oak', x0, x1, y1 - .06, y1, z0, z1); for (const xx of [x0, x1 - .05]) bx('oak', xx, xx + .05, F1, y1, z0, z1); bx('oak', x0, x1, F1, y1, z0, z0 + .02);
    for (let k = 0; k < 5; k++) { const y = F1 + .1 + k * .42; if (k) bx('oak', x0 + .05, x1 - .05, y - .025, y, z0, z1); for (let u = x0 + .07; u < x1 - .1;) { const w = Math.min(x1 - .07 - u, .3 + r() * .4); bx('books', u, u + w, y, y + .28 + r() * .06, z0 + .06, z1 - .05); u += w + .02; } } }
  // the stair along the partition, from the front up to the gallery's east end; a raking rail on its open side
  for (let k = 1; k < N; k++) bx('oak', SX0, PX0, F0, F0 + k * rise, SZF - k * going, SZF - (k - 1) * going, 'stair', 0);
  { const yb = F0 + rise + .9, yt = F1 + .9; bx('oak', SX0 - .06, SX0 + .04, F0, yb + .1, SZF - going - .05, SZF - going + .05); beam('oak', SX0 - .01, yb, SZF - going, yt, GZ, .06, .07);
    for (let k = 2; k < N; k += 2) { const z = SZF - k * going + going / 2, y = F0 + k * rise; bx('oak', SX0 - .03, SX0 + .01, y, y + .9, z - .02, z + .02); } }
  // the dormitory's floor over the steward's room, on joists
  bx('oak', PX1, X, F1 - .2, F1 - .04, -Z, Z); bx('deal', PX1, X, F1 - .04, F1, -Z, Z); for (let z = -Z + .4; z < Z - .2; z += .8) bx('oak', PX1, X, F1 - .36, F1 - .2, z - .08, z + .08);
  // the roof: a boarded lining under the slate, a ridge beam, two purlins a side, wall plates; three arch-braced collar trusses over the
  // hall, each on stone corbels and wall posts, and a plain collar truss over the dormitory
  for (const s of [-1, 1]) { const L = (plan.d / 2 - t + .02) / Math.cos(p); beam('deal', 0, roofY(0) - LIN / 2 / Math.cos(p) - .002, 0, roofY(Z + .02) - LIN / 2 / Math.cos(p) - .002, s * (Z + .02), 2 * X, LIN);
    for (const zz of [1.3, 2.6]) bx('oak', -X, X, roofY(zz + .09) - LIN - .24, roofY(zz + .09) - LIN, s * zz - .09, s * zz + .09); bx('oak', -X, X, roofY(Z - .1) - LIN - .26, roofY(Z - .1) - LIN, s * (Z - .2) - .1, s * (Z - .2) + .1); void L; }
  bx('oak', -X, X, roofY(0) - LIN - .28, roofY(.12) - LIN, -.1, .1);
  const CY = 8.4, SP = 5.6, trusses = [-3.9, -1.3, 1.3] /* clear of the back's high lights and the front's tall ones */; for (const x of [...trusses, (PX1 + X) / 2]) { const arch = x < PX0, zc = plan.d / 2 - (CY + .22 + LIN + .04 - EAVE) / tp;
    for (const s of [-1, 1]) { const off = .13, a = [roofY(Z - .12) - LIN - off / Math.cos(p), s * (Z - .12)], b = [roofY(0) - LIN - off / Math.cos(p), 0]; beam('oak', x, a[0], a[1], b[0], b[1], .2, .26); }
    bx('oak', x - .1, x + .1, CY, CY + .22, -zc, zc);
    if (arch) for (const s of [-1, 1]) { const A = Z - .1, Bh = CY - SP, pts = []; for (let i = 0; i <= 8; i++) { const th = i / 8 * Math.PI / 2; pts.push([SP + Bh * Math.sin(th), s * A * Math.cos(th)]); }
      for (let i = 0; i < 8; i++) beam('oak', x, pts[i][0], pts[i][1], pts[i + 1][0], pts[i + 1][1], .18, .16);
      bx('rubble', x - .2, x + .2, SP - .3, SP, s * Z - (s > 0 ? .3 : 0), s * Z + (s < 0 ? .3 : 0)); bx('oak', x - .1, x + .1, SP, roofY(Z - .2) - LIN - .2, s * (Z - .1) - .1, s * (Z - .1) + .1); } }
  // the wheel of candles from the middle collar over the practice floor
  const lamp = [trusses[1], 4.3, .4]; { const [lx, ly, lz] = lamp; bx('iron', lx - .006, lx + .006, ly + .55, CY, lz - .006, lz + .006); const ring = new THREE.TorusGeometry(.55, .025, 6, 24); ring.rotateX(Math.PI / 2); put(ring, 'iron', lx, ly, lz); bx('iron', lx - .56, lx + .56, ly + .54, ly + .56, lz - .01, lz + .01); bx('iron', lx - .01, lx + .01, ly + .54, ly + .56, lz - .56, lz + .56);
    for (let i = 0; i < 4; i++) { const a = i / 4 * Math.PI * 2; bx('iron', lx + Math.cos(a) * .55 - .005, lx + Math.cos(a) * .55 + .005, ly, ly + .55, lz + Math.sin(a) * .55 - .005, lz + Math.sin(a) * .55 + .005); }
    for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2, cx = lx + Math.cos(a) * .55, cz = lz + Math.sin(a) * .55; put(new THREE.CylinderGeometry(.018, .02, .14, 8), 'linen', cx, ly + .09, cz); put(new THREE.SphereGeometry(.014, 6, 5).scale(1, 2.2, 1), 'flame', cx, ly + .19, cz); } }
  // upstairs, the dormitory: six beds heads to the east gable, a chest at each foot, the aisle along the partition; a lamp on a bracket
  const beds = []; for (let k = 0; k < 6; k++) { const zc = -Z + .675 + k * 1.25, b = { x0: X - 2.0, x1: X - .05, z0: zc - .45, z1: zc + .45 }; bx('oak', b.x0, b.x1, F1, F1 + .42, b.z0, b.z1, 'bed', 1); bx('straw', b.x0 + .04, b.x1 - .04, F1 + .42, F1 + .52, b.z0 + .04, b.z1 - .04);
    bx(k % 2 ? 'wool' : C1, b.x0 + .04, b.x1 - .5, F1 + .52, F1 + .57, b.z0 + .03, b.z1 - .03); bx('linen', b.x1 - .45, b.x1 - .08, F1 + .52, F1 + .63, b.z0 + .1, b.z1 - .1); bx('oak', b.x0 - .5, b.x0 - .05, F1, F1 + .45, b.z0 + .08, b.z1 - .08, 'chest', 1); beds.push(b); }
  const dormLamp = [PX1 + .2, F1 + 2.1, 0]; bx('iron', PX1, PX1 + .25, dormLamp[1] + .2, dormLamp[1] + .23, -.01, .01); put(new THREE.CylinderGeometry(.07, .08, .2, 6), 'glow', ...dormLamp); put(new THREE.ConeGeometry(.09, .09, 6), 'iron', dormLamp[0], dormLamp[1] + .14, dormLamp[2]);
  // the steward's room under the dormitory: a table with the guild's books and a chair, a press against the partition, the strongbox
  // under the east gable between its windows
  const stTable = { x0: 4.4, x1: 5.6, z0: -.5, z1: .4, y: F0 + .76 }; { const { x0, x1, z0, z1, y } = stTable; bx('oak', x0, x1, y - .05, y, z0, z1, 'sttable', 0); for (const xx of [x0 + .08, x1 - .16]) for (const zz of [z0 + .08, z1 - .16]) bx('oak', xx, xx + .08, F0, y - .05, zz, zz + .08);
    for (let k = 0; k < 3; k++) bx(k % 2 ? 'leather' : C1, x0 + .2 + k * .08, x0 + .27 + k * .08, y, y + .26, z0 + .15, z0 + .45); bx('linen', x0 + .6, x0 + .95, y, y + .015, z0 + .3, z1 - .2);
    bx('oak', 4.8, 5.2, F0 + .44, F0 + .48, z1 + .2, z1 + .6, 'chair', 0); bx('oak', 4.8, 5.2, F0 + .48, F0 + 1.0, z1 + .56, z1 + .6); for (const [a, b] of [[4.8, z1 + .2], [5.16, z1 + .2], [4.8, z1 + .56], [5.16, z1 + .56]]) bx('oak', a, a + .04, F0, F0 + .44, b, b + .04); }
  bx('oak', PX1, PX1 + .45, F0, F0 + 1.9, -2.2, -.7, 'press', 0); for (const y of [.7, 1.3]) bx('deal', PX1 + .44, PX1 + .46, F0 + y, F0 + y + .02, -2.15, -.75); bx('iron', PX1 + .45, PX1 + .47, F0 + .9, F0 + 1.0, -1.47, -1.43);
  bx('oak', X - .5, X - .02, F0, F0 + .5, -.45, .45, 'strongbox', 0); for (const z of [-.3, 0, .3]) bx('iron', X - .52, X - .5, F0, F0 + .51, z - .025, z + .025); bx('iron', X - .53, X - .51, F0 + .3, F0 + .4, -.04, .04);
  // the great door's leaf, hung open against the front wall inside, west of the doorway
  const door = plan.open.front.find(q => q.kind === 'plank'); bx(C1, door.x - door.w / 2 - door.w - .02, door.x - door.w / 2 - .02, F0, F0 + door.h - door.w / 2, Z - .07, Z - .01, 'leaf', 0);
  // the walks: the great door to the desk; the great door past the stands and the stair's foot to the steward's room and its table; the
  // back door into the hall to the long table's end; the great door to the hearth; upstairs, from the stair's head along the gallery to
  // its bench, and in at the dormitory's door down the aisle
  const back = -plan.open.back.find(q => q.kind === 'plank').x, sd = (doors.steward.z0 + doors.steward.z1) / 2, dd = (doors.dorm.z0 + doors.dorm.z1) / 2, paths = [
    { fl: 0, pts: [[door.x, Z - .3], [door.x + .3, desk.z1 + .4]] }, { fl: 0, pts: [[door.x + .3, Z - .4], [-1.0, 2.5], [SX0 - .2, 2.5], [PX0 - .4, sd], [PX1 + .4, sd], [stTable.x0 - .4, stTable.z1 + .3]] },
    { fl: 0, pts: [[back, -Z + .25], [back, -.6], [table.x1 + .3, -.6]] }, { fl: 0, pts: [[door.x, Z - .3], [-2.5, 2.2], [hx + BD + 1.0, 2.2], [hx + BD + 1.0, 1.75]] },
    { fl: 1, pts: [[(SX0 + PX0) / 2, GZ - .3], [-X + .4, GZ - .55]] }, { fl: 1, pts: [[(SX0 + PX0) / 2, GZ - .3], [(SX0 + PX0) / 2, dd], [PX1 + .4, dd], [PX1 + .4, Z - .3]] }];
  { const G = glMats().glass, Lt = glMats().lit; shell.traverse(m => { if (m.isMesh && (m.material === G || m.material === Lt)) { m.material = roomMats().pane; m.name = 'pane'; } }); }
  const group = new THREE.Group(); let tris = 0; for (const [k, gs] of B) { const g = mergeGeometries(gs, false); gs.forEach(x => x.dispose()); const m = new THREE.Mesh(g, M[k]); m.name = k; m.castShadow = !['flame', 'ember', 'glow'].includes(k); m.receiveShadow = true; group.add(m); tris += g.attributes.position.count / 3; }
  const all = new THREE.Group(); all.add(shell, group);
  const windows = Object.entries(plan.open).flatMap(([f, os]) => (os || []).filter(q => q.kind === 'win').map(q => ({ face: f, x: f === 'front' ? q.x : f === 'back' ? -q.x : f === 'left' ? -plan.w / 2 : plan.w / 2, z: f === 'front' ? plan.d / 2 : f === 'back' ? -plan.d / 2 : f === 'left' ? q.x : -q.x, y: q.y, w: q.w, h: q.h })));
  return { group: all, shell, room: group, tris: Math.round(tris), draws: group.children.length, shellTris: shell.userData.tris, shellCalls: shell.userData.calls, inner: { x0: -X, x1: X, z0: -Z, z1: Z }, floors: [F0, F1], roofY, lining: LIN, eave: EAVE,
    door: { x: door.x, z: plan.d / 2, w: door.w, h: door.h }, hearth: [hx + BD, 0, 0], fire, stair: { x0: SX0, x1: PX0, z0: GZ, z1: SZF, rise, going, n: N }, gallery, posts, part: { x0: PX0, x1: PX1 }, doors, trusses,
    guild: MG ? 'mages' : 'fighters', desk, board, table, benches, stands, rack: MG ? null : rack, shelves, still, presses, pell, grind, beds, stTable, paths, boxes, lamp, dormLamp, windows, w: plan.w, d: plan.d };
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
  const C = aurenneChurch({ rank: o.rank || 'town', w: o.w || 14, tower: o.tower ?? 1, interior: true }, stream(o.shell || 'church-shell')), I = C.inner, shell = C.group;
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
  const SD = Math.min(2.9, Z - 2.85), SY = F0 + .32, sanctuary = { x0: -4.2, x1: 4.2, z0: -Z, z1: -Z + SD, y: SY }; /* S1690 — as deep as leaves the priest his place before the bier: a town's 2.9 m, a village's 2.35 */; bx('step', sanctuary.x0, sanctuary.x1, F0, SY, -Z, sanctuary.z1, 'sanctuary'); bx('step', -2.4, 2.4, F0, F0 + .16, sanctuary.z1, sanctuary.z1 + .34, 'sanctuary');
  bx('zellige', -2.3, 2.3, SY + dado, SY + 2.7, -Z, -Z + .03); for (const [x0, x1, y0, y1] of [[-2.4, 2.4, SY + 2.7, SY + 2.82], [-2.42, -2.3, SY + dado, SY + 2.82], [2.3, 2.42, SY + dado, SY + 2.82]]) bx('gold', x0, x1, y0, y1, -Z, -Z + .05);
  const altar = { x0: -1.0, x1: 1.0, z0: -Z + SD - 1.3, z1: -Z + SD - .55, y: SY + 1.0 }; { const { x0, x1, z0, z1, y } = altar; bx('marble', x0 + .08, x1 - .08, SY, y - .1, z0 + .08, z1 - .08, 'altar'); bx('marble', x0, x1, y - .1, y, z0, z1, 'altar'); bx('zellige', x0 + .2, x1 - .2, SY + .15, y - .25, z1 - .07, z1 - .06);
    bx('linen', x0 + .05, x1 - .05, y, y + .005, z0 + .05, z1 - .05); for (const xx of [x0 + .25, x1 - .25]) { put(new THREE.CylinderGeometry(.06, .09, .35, 10), 'gold', xx, y + .175, (z0 + z1) / 2); put(new THREE.CylinderGeometry(.03, .03, .3, 8), 'wax', xx, y + .5, (z0 + z1) / 2); put(new THREE.SphereGeometry(.018, 6, 5).scale(1, 2.2, 1), 'flame', xx, y + .69, (z0 + z1) / 2); }
    bx('indigo', -.25, .25, y, y + .06, (z0 + z1) / 2 - .17, (z0 + z1) / 2 + .17); bx('saffron', -.24, .24, y + .06, y + .065, (z0 + z1) / 2 - .16, (z0 + z1) / 2 + .16); }
  // the Weaver's sign: a gilt shuttle 2.2 m long hung level over the altar on two chains from the ceiling, a bobbin of gold thread in it
  const shuttle = { x: 0, y: SY + 3.6, z: (altar.z0 + altar.z1) / 2, L: 2.2 }; { const { x, y, z, L } = shuttle, h = L / 2, g = new THREE.LatheGeometry([[.001, -h], [.06, -h * .82], [.17, -h * .4], [.2, 0], [.17, h * .4], [.06, h * .82], [.001, h]].map(([a, b]) => new THREE.Vector2(a, b)), 16);
    g.scale(1, 1, .6); put(g, 'gold', x, y, z, 0, .6, 0, Math.PI / 2); put(new THREE.CylinderGeometry(.08, .08, .5, 12), 'saffron', x, y, z, 0, .6, 0, Math.PI / 2); for (const dx of [-.7, .7]) chain(x + dx, y + .1, CEIL, z); }
  // the lectern on the sanctuary's left: a cedar post and a sloped desk with the great book open on it
  const lectern = { x: -2.9, z: -Z + SD - .65, y: SY + 1.12 }; { const { x, z, y } = lectern; bx('cedarD', x - .25, x + .25, SY, SY + .06, z - .25, z + .25, 'lectern'); put(new THREE.CylinderGeometry(.06, .08, 1.0, 8), 'cedarD', x, SY + .55, z);
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
  // cedar benches either side of the aisle, back from the door: as many rows as leave 0.6 m behind the last (a town's four, a village's three)
  const benches = []; for (let k = 0; 2.5 + k * .85 + .38 <= Z - .6; k++) { const z0 = 2.5 + k * .85; for (const [x0, x1] of [[-4.6, -1.0], [1.0, 4.6]]) { const b = { x0, x1, z0, z1: z0 + .38, y: F0 + .45 }; bx('cedar', x0, x1, b.y - .05, b.y, z0, b.z1, 'bench'); for (const xx of [x0 + .1, x1 - .16]) bx('cedar', xx, xx + .06, F0, b.y - .05, z0 + .04, b.z1 - .04);
    bx('cedar', x0, x1, b.y + .3, b.y + .42, b.z1 - .04, b.z1); for (const xx of [x0 + .1, x1 - .16]) bx('cedar', xx, xx + .06, b.y, b.y + .42, b.z1 - .05, b.z1); benches.push(b); } }
  // the ceiling lined in limewash round the oculus, a gilt ring at its edge; gilt stars over the dome's night blue
  { const sq = new THREE.Shape(); sq.moveTo(-X, -Z); sq.lineTo(X, -Z); sq.lineTo(X, Z); sq.lineTo(-X, Z); sq.lineTo(-X, -Z); const hole = new THREE.Path(); hole.absarc(0, 0, I.Ri, 0, Math.PI * 2, true); sq.holes.push(hole);
    const g = new THREE.ExtrudeGeometry(sq, { depth: .03, bevelEnabled: false, curveSegments: 36 }); g.rotateX(-Math.PI / 2); put(g, 'plaster', 0, CEIL - .03, 0, 0, .5); put(new THREE.TorusGeometry(I.Ri + .02, .07, 6, 36), 'gold', 0, CEIL - .06, 0, 0, .6, Math.PI / 2);
    for (let k = 0; k < 70; k++) { const a = r() * Math.PI * 2, e = Math.asin(.12 + r() * .8), rr = (I.Ri - .04) * Math.cos(e), y = I.y0 + I.dh + (I.Ri - .04) * 1.12 * Math.sin(e); put(new THREE.OctahedronGeometry(.05 + r() * .04, 0), 'gold', Math.cos(a) * rr, y, Math.sin(a) * rr, r() * 3); } }
  // the great door's two leaves, open inside against the front wall
  const dW = C.door.w; for (const s of [-1, 1]) bx('cedarD', s > 0 ? dW / 2 + .02 : -dW / 2 - .02 - dW / 2, s > 0 ? dW / 2 + .02 + dW / 2 : -dW / 2 - .02, F0, F0 + C.door.h - dW / 2, Z - .1, Z - .02, 'leaf');
  const group = new THREE.Group(); let tris = 0; for (const [k, gs] of B) { const g = mergeGeometries(gs); gs.forEach(x => x.dispose()); const m = new THREE.Mesh(g, M[k]); m.name = k; m.castShadow = !['flame', 'glow'].includes(k); m.receiveShadow = true; group.add(m); tris += g.attributes.position.count / 3; }
  const all = new THREE.Group(); all.add(shell, group);
  const paths = [[[0, Z - .3], [0, bier.z1 + .5]], [[0, Z - .3], [0, 2.05], [2.0, 2.05], [2.0, Math.max(-2.05, sanctuary.z1 + .65)], [0, sanctuary.z1 + .65]], [[0, Z - .3], [0, 2.05], [-2.0, 2.05], [-2.0, Math.max(-2.05, sanctuary.z1 + .65)], [-.6, sanctuary.z1 + .65]], [[0, 2.05], [-4.9, 2.05]]];
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
// ── the halls' fixtures (Session 1521; Michael's C on #805, 28 Oct 2026: each island its own), copied from the concept artist's
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
// ── the joiner's bench (Session 1524; the survival sheet's props, "the bench"), drawn from the ship bases' workbench (shipbase.js,
// Michael's A on #418): an elm top 1.5 by 0.6 m at 0.85 on four square legs and a stretcher, an iron vice at its right end, a plank
// and an offcut on the top with shavings, and a rack of tools on the wall over it (a saw, a plane, a mallet, two chisels).
//   PKIT.props.bench() -> { group, tris, draws, foot: { x0, x1, z0, z1 }, top } in the wall's frame: the wall at z = 0, the bench
//   toward +z, its length along x centred on 0, the floor at y = 0. One mesh a material, three in all.
let BM = null;
function joinerBench() {
  if (!BM) BM = { wood: new THREE.MeshStandardMaterial({ color: 0x9a7650, roughness: .8 }), dark: new THREE.MeshStandardMaterial({ color: 0x4e3622, roughness: .85 }), iron: new THREE.MeshStandardMaterial({ color: 0x2a2826, roughness: .5, metalness: .6 }) };
  const L = 1.5, D = .6, H = .85, T = .08, B = new Map(), box = (k, w, h, d, x, y, z, ry = 0) => { const g = new THREE.BoxGeometry(w, h, d).toNonIndexed(); if (ry) g.rotateY(ry); g.translate(x, y, z); if (!B.has(k)) B.set(k, []); B.get(k).push(g); };
  box('wood', L, T, D, 0, H - T / 2, D / 2 + .02);
  for (const sx of [-1, 1]) for (const z of [.08, D - .04]) box('dark', .08, H - T, .08, sx * (L / 2 - .1), (H - T) / 2, z);
  for (const sx of [-1, 1]) box('dark', .06, .06, D - .12, sx * (L / 2 - .1), .22, D / 2 + .02); box('dark', L - .2, .06, .06, 0, .22, D - .04);
  // the vice: a jaw block over the right front leg and its screw's bar
  box('iron', .22, .14, .1, L / 2 - .2, H + .07, D + .06); box('iron', .04, .04, .2, L / 2 - .2, H + .07, D + .14); box('iron', .3, .03, .03, L / 2 - .2, H + .07, D + .24);
  // a plank in work and an offcut on the top, shavings
  box('wood', .9, .04, .14, -.15, H + .02, D * .55, .04); box('wood', .3, .04, .12, .35, H + .02, .16, -.3);
  for (let k = 0; k < 6; k++) box('wood', .05, .006, .02, -.55 + k * .09, H + .003, .32 + (k % 3) * .05, k * .9);
  // the rack on the wall: a board, and on its pegs the tools
  box('dark', 1.1, .05, .04, 0, 1.3, .02); for (let k = 0; k < 5; k++) box('dark', .02, .02, .08, -.44 + k * .22, 1.32, .06);
  box('iron', .5, .12, .006, -.44, 1.16, .07); box('dark', .12, .1, .03, -.13, 1.16, .07) /* the saw, its blade and handle */;
  box('dark', .22, .07, .06, .02, 1.22, .08); box('iron', .04, .02, .06, .02, 1.27, .08) /* the plane */;
  box('dark', .03, .22, .03, .24, 1.17, .07); box('dark', .12, .07, .07, .24, 1.05, .07) /* the mallet, head down */;
  for (const x of [.4, .46]) { box('dark', .025, .1, .025, x, 1.22, .07); box('iron', .012, .12, .006, x, 1.11, .07); }
  const group = new THREE.Group(); group.name = 'joiner bench'; let tris = 0;
  for (const [k, gs] of B) { const g = mergeGeometries(gs); gs.forEach(x => x.dispose()); const m = new THREE.Mesh(g, BM[k]); m.name = 'bench:' + k; group.add(m); tris += g.attributes.position.count / 3; }
  return { group, tris: Math.round(tris), draws: group.children.length, foot: { x0: -L / 2, x1: L / 2, z0: 0, z1: D + .26 }, top: H };
}
// ── the Mark's training yard (Session 1657; arenas-build.md session 2, Michael's B on #914: "a staff rack, a 5 m rope ring"): the
// yard behind a Markish Fighters' Guild hall where the spar (sparStart) and the evening brawl (brawlStart) are fought. A ring of
// trodden earth 5.7 m round, fourteen ash stakes 1 m high at 5 m with one rope at 0.9 m sagging 9 cm a span (the bout's rope: over
// it by 1 m is a loss, so it is stepped over, not gated), the staff rack outside it toward the hall (two uprights, a top rail and a
// slotted foot rail, five yard staves leaning in six slots: the sixth is the one in your hand), and a plank bench on two stumps
// across the ring for whoever watches. In the hall's materials (markMats' beam and planks), so in a town it costs two draws more
// (the rope and the earth) once the kit's houses are merged.
//   PKIT.mk.yard(hAt, o) -> { group, tris, draws, R, rack: {x, z, w, d}, bench: {x, z, w, d} } in the yard's frame: the ring's centre at
//   0, +z toward the hall, y = 0 the ground at the centre; hAt(x, z) is the ground's height in that frame (each stake and the earth
//   follow it). One mesh a material, five in all.
let YM = null;
function markYard(hAt = () => 0, o = {}) {
  const Mt = markMats();
  if (!YM) YM = { rope: new THREE.MeshStandardMaterial({ color: 0x8c7656, roughness: .95 }), earth: mat('rock', { ns: .35, color: 0x8a7458, rough: 1 }) };
  const M = { beam: Mt.beam, staff: Mt.carve, plank: Mt.wall[1], stump: Mt.wall[2], rope: YM.rope, earth: YM.earth };
  const R = o.r || 5, N = 14, B = new Map(), put = (k, g) => { const x = g.index ? g.toNonIndexed() : g; if (!B.has(k)) B.set(k, []); B.get(k).push(x); };
  const bx = (k, w, h, d, x, y, z, ry = 0, rx = 0) => { const g = worldUV(new THREE.BoxGeometry(w, h, d).toNonIndexed(), .5); if (rx) g.rotateX(rx); if (ry) g.rotateY(ry); g.translate(x, y, z); put(k, g); };
  // the earth: a disc of six rings over the ground, 3.5 cm up, ragged at its edge
  { const rings = 6, seg = 40, ER = R + .7, P = [], U = [], idx = [];
    for (let k = 0; k <= rings; k++) for (let s = 0; s < (k ? seg : 1); s++) { const a = s / seg * Math.PI * 2, rr = k / rings * ER * (k === rings ? .93 + .1 * tn(s / seg, .5, 8, 3) : 1), x = Math.cos(a) * rr, z = Math.sin(a) * rr; P.push(x, hAt(x, z) + .035, z); U.push(x * .35, z * .35); }
    const at = (k, s) => k ? 1 + (k - 1) * seg + (s % seg) : 0;
    for (let s = 0; s < seg; s++) idx.push(0, at(1, s + 1), at(1, s));
    for (let k = 1; k < rings; k++) for (let s = 0; s < seg; s++) { const a = at(k, s), b = at(k, s + 1), c = at(k + 1, s), d = at(k + 1, s + 1); idx.push(a, b, d, a, d, c); }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(U, 2)); g.setIndex(idx); g.computeVertexNormals(); put('earth', g); }
  // the stakes and the rope
  const tops = [];
  for (let i = 0; i < N; i++) { const a = (i + .5) / N * Math.PI * 2, x = Math.cos(a) * R, z = Math.sin(a) * R, y = hAt(x, z), g = new THREE.CylinderGeometry(.05, .07, 1.2, 6);
    g.rotateY(a); g.translate(x, y + .45, z); put('beam', g); tops.push(new THREE.Vector3(x, y + .9, z)); }
  for (let i = 0; i < N; i++) { const p = tops[i], q = tops[(i + 1) % N], pts = [];
    for (let k = 0; k <= 6; k++) { const t = k / 6, v = p.clone().lerp(q, t); v.y -= .09 * 4 * t * (1 - t); pts.push(v); }
    put('rope', new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 6, .016, 4, false)); }
  // the rack, 1.4 m out toward the hall, its face to the ring
  const rz = R + 1.0, ry0 = hAt(0, rz), W = 2.0;
  for (const sx of [-1, 1]) { bx('beam', .1, 1.7, .1, sx * W / 2, ry0 + .8, rz); bx('beam', .1, .08, .7, sx * W / 2, ry0 + .04, rz); }
  bx('beam', W + .2, .09, .09, 0, ry0 + 1.58, rz + .08); bx('beam', W, .07, .24, 0, ry0 + .32, rz - .06);
  for (let k = 0; k < 6; k++) { if (k === 4) continue; const x = -.75 + k * .3, g = new THREE.CylinderGeometry(.022, .026, 1.86, 5), lean = Math.atan2(.18, 1.5);
    g.rotateX(-lean); g.translate(x, ry0 + .3 + .93 * Math.cos(lean), rz - .1 + .93 * Math.sin(lean)); put('staff', g); }
  // the bench across the ring
  const bz = -(R + 1.0), by0 = hAt(0, bz);
  bx('plank', 2.2, .07, .34, 0, by0 + .46, bz);
  for (const sx of [-1, 1]) { const g = new THREE.CylinderGeometry(.15, .17, .44, 7); g.translate(sx * .75, by0 + .21, bz); put('stump', g); }
  const group = new THREE.Group(); group.name = 'mark yard'; let tris = 0;
  for (const [k, gs] of B) { const clean = gs.map(g => { for (const a of Object.keys(g.attributes)) if (!['position', 'normal', 'uv'].includes(a)) g.deleteAttribute(a); if (!g.attributes.normal) g.computeVertexNormals(); return g; });
    const g = mergeGeometries(clean); clean.forEach(x => x.dispose()); const m = new THREE.Mesh(g, M[k]); m.name = 'yard:' + k; m.castShadow = k !== 'earth'; m.receiveShadow = true; group.add(m); tris += g.attributes.position.count / 3; }
  return { group, tris: Math.round(tris), draws: group.children.length, R, rack: { x: 0, z: rz, w: W + .2, d: .8 }, bench: { x: 0, z: bz, w: 2.2, d: .4 } };
}
// ── the ladder's ring (Session 1658; arenas-build.md session 2, Michael's B on #914: "stands round an 8 m ring, the post with its
// names"): where the ladder's bouts are fought, at Caer Slige and the Mark's cities (ladderSites). Trodden earth 9 m round; twenty
// ash stakes at 8 m with the yard's rope at 0.9 m, broken at the gate (two taller posts 1.6 m apart toward the town, +z) where the
// ring master takes your call; three tiers of plank stands in three arcs across the ring from the gate, an aisle between each arc,
// the seats at 0.45, 0.9 and 1.35 m and level along an arc whatever the ground does under them (their legs follow it); and the post
// beside the gate, a squared oak 3 m high with a cap and six boards down its face, where the names are cut (the champion's, and
// the fighters killed after they yielded). In the yard's materials and the hall's wood, so it adds no material the yard has not.
//   PKIT.mk.ring(hAt, o) -> { group, tris, draws, R, gate: {x, z}, post: {x, z, w, d}, stands: [{x, z, w, d, ry, h}] } in the ring's
//   frame: its centre at 0, +z toward the town, y = 0 the ground at the centre; hAt(x, z) the ground's height in that frame.
function markRing(hAt = () => 0, o = {}) {
  markYard(); const Mt = markMats();
  const M = { beam: Mt.beam, carve: Mt.carve, plank: Mt.wall[1], oak: Mt.wall[2], rope: YM.rope, earth: YM.earth };
  const R = o.r || 8, B = new Map(), put = (k, g) => { const x = g.index ? g.toNonIndexed() : g; if (!B.has(k)) B.set(k, []); B.get(k).push(x); };
  const bx = (k, w, h, d, x, y, z, ry = 0) => { const g = worldUV(new THREE.BoxGeometry(w, h, d).toNonIndexed(), .5); if (ry) g.rotateY(ry); g.translate(x, y, z); put(k, g); };
  const P = (a, r) => [Math.cos(a) * r, Math.sin(a) * r];
  // the earth, as the yard's: rings over the ground, 3.5 cm up, ragged at its edge
  { const rings = 8, seg = 48, ER = R + 1, Pt = [], U = [], idx = [];
    for (let k = 0; k <= rings; k++) for (let s = 0; s < (k ? seg : 1); s++) { const a = s / seg * Math.PI * 2, rr = k / rings * ER * (k === rings ? .94 + .09 * tn(s / seg, .5, 8, 5) : 1), x = Math.cos(a) * rr, z = Math.sin(a) * rr; Pt.push(x, hAt(x, z) + .035, z); U.push(x * .35, z * .35); }
    const at = (k, s) => k ? 1 + (k - 1) * seg + (s % seg) : 0;
    for (let s = 0; s < seg; s++) idx.push(0, at(1, s + 1), at(1, s));
    for (let k = 1; k < rings; k++) for (let s = 0; s < seg; s++) { const a = at(k, s), b = at(k, s + 1), c = at(k + 1, s), d = at(k + 1, s + 1); idx.push(a, b, d, a, d, c); }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(Pt, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(U, 2)); g.setIndex(idx); g.computeVertexNormals(); put('earth', g); }
  // the stakes, from one gatepost round to the other, and the rope between them; the gate's span has none
  const N = 20, gate = Math.PI / 2, gh = .8 / R, tops = [];
  for (let i = 0; i <= N; i++) { const a = gate + gh + i / N * (Math.PI * 2 - 2 * gh), [x, z] = P(a, R), y = hAt(x, z), end = i === 0 || i === N;
    const g = new THREE.CylinderGeometry(end ? .08 : .05, end ? .1 : .07, end ? 1.75 : 1.2, end ? 8 : 6); g.translate(x, y + (end ? .7 : .45), z); put('beam', g); tops.push(new THREE.Vector3(x, y + .9, z)); }
  for (let i = 0; i < N; i++) { const p = tops[i], q = tops[i + 1], pts = [];
    for (let k = 0; k <= 6; k++) { const t = k / 6, v = p.clone().lerp(q, t); v.y -= .1 * 4 * t * (1 - t); pts.push(v); }
    put('rope', new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 6, .016, 4, false)); }
  // the stands: three arcs across the ring from the gate, each 0.95 rad, an aisle of 0.3 rad between them; three tiers 0.75 m deep
  const stands = [], r0 = R + 1.7, TD = .75, SEG = 6, arcW = .95;
  for (const ac of [-Math.PI / 2 - (arcW + .3), -Math.PI / 2, -Math.PI / 2 + (arcW + .3)]) for (let s = 0; s < SEG; s++) {
    const a0 = ac - arcW / 2 + s / SEG * arcW, a1 = a0 + arcW / SEG, am = (a0 + a1) / 2, ry = -am + Math.PI / 2;
    let base = -1e9; for (const a of [a0, a1]) for (let k = 0; k < 3; k++) { const [x, z] = P(a, r0 + k * TD); base = Math.max(base, hAt(x, z)); }
    for (let k = 0; k < 3; k++) { const rr = r0 + k * TD + TD / 2, len = 2 * rr * Math.sin((a1 - a0) / 2) + .02, [x, z] = P(am, rr), sy = base + .45 * (k + 1);
      bx('plank', len, .06, .34, x, sy, z, ry);
      if (k) { const [fx, fz] = P(am, rr - .3); bx('plank', len, .05, .22, fx, sy - .45 + .02, fz, ry); }
      for (const a of [a0 + .012, a1 - .012]) { const [lx, lz] = P(a, rr), gy = hAt(lx, lz) - .1, h = sy - .03 - gy; bx('beam', .09, h, .09, lx, gy + h / 2, lz, ry); } }
    const [cx, cz] = P(am, r0 + 1.5 * TD); stands.push({ x: cx, z: cz, w: 2 * (r0 + 3 * TD) * Math.sin((a1 - a0) / 2), d: 3 * TD, ry, h: base + 1.4 }); }
  // the post, beside the gate on the town's side: squared oak, a cap, six boards for the names
  const px = 2.2, pz = R + 1.3, py = hAt(px, pz);
  bx('oak', .32, 3.1, .32, px, py + 1.45, pz); bx('beam', .46, .1, .46, px, py + 3.03, pz); bx('beam', .2, .16, .2, px, py + 3.16, pz);
  for (let k = 0; k < 6; k++) bx('carve', .26, .13, .03, px, py + 2.6 - k * .27, pz + .17);
  const group = new THREE.Group(); group.name = 'mark ring'; let tris = 0;
  // the names (Session 1662): a face over each board, 4 mm proud of it, in one mesh with the ring's own canvas, row k of it on board k
  const names = ringNames(); { const P = [], U = [], I = []; for (let k = 0; k < 6; k++) { const y = py + 2.6 - k * .27, z = pz + .189, v0 = 1 - (k + 1) / 6, v1 = 1 - k / 6, o = k * 4;
      P.push(px - .125, y - .06, z, px + .125, y - .06, z, px + .125, y + .06, z, px - .125, y + .06, z); U.push(0, v0, 1, v0, 1, v1, 0, v1); I.push(o, o + 1, o + 2, o, o + 2, o + 3); }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(U, 2)); g.setIndex(I); g.computeVertexNormals();
    const m = new THREE.Mesh(g, names.mat); m.name = 'ring:names'; m.receiveShadow = true; group.add(m); tris += 12; }
  for (const [k, gs] of B) { const clean = gs.map(g => { for (const a of Object.keys(g.attributes)) if (!['position', 'normal', 'uv'].includes(a)) g.deleteAttribute(a); if (!g.attributes.normal) g.computeVertexNormals(); if (!g.attributes.uv) g.setAttribute('uv', new THREE.Float32BufferAttribute(new Float32Array(g.attributes.position.count * 2), 2)); return g; });
    const g = mergeGeometries(clean); clean.forEach(x => x.dispose()); const m = new THREE.Mesh(g, M[k]); m.name = 'ring:' + k; m.castShadow = k !== 'earth'; m.receiveShadow = true; group.add(m); tris += g.attributes.position.count / 3; }
  return { group, tris: Math.round(tris), draws: group.children.length, R, gate: { x: 0, z: R + .6 }, post: { x: px, z: pz, w: .36, d: .36 }, stands, paint: names.paint };
}
// the post's six boards as one canvas, a row of 256 by 128 to a board (the board's 0.26 by 0.13 m): paint(list) cuts list[k] into board k
// in capitals, cut (the fresh wood pale in the groove, its upper edge in shadow), one line or two to fit; a board with no name is left bare (the
// face is cut out by alphaTest, so the board's own wood shows). Each ring has its own, since each post has its own dead.
function ringNames() { const W = 256, H = 128, c = document.createElement('canvas'); c.width = W; c.height = H * 6; const x = c.getContext('2d'), t = finishTex(c);
  t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping; t.generateMipmaps = false; t.minFilter = THREE.LinearFilter;
  const mat = new THREE.MeshStandardMaterial({ map: t, alphaTest: .5, roughness: .9, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -1 });
  let sig = null;
  const paint = (list = []) => { const L = Array.from({ length: 6 }, (_, k) => String(list[k] || '').toUpperCase().replace(/\s+/g, ' ').trim().slice(0, 40)), key = L.join('|'); if (key === sig) return false; sig = key;
    x.clearRect(0, 0, W, H * 6); x.textAlign = 'center'; x.textBaseline = 'middle';
    for (let k = 0; k < 6; k++) { const n = L[k]; if (!n) continue; const fit = (str, max) => { x.font = `700 100px Georgia, serif`; return Math.min(max, 100 * (W - 24) / Math.max(1, x.measureText(str).width)); };
      let lines = [n], s = fit(n, 62); if (s < 28 && n.includes(' ')) { const w = n.split(' '); let best = null; for (let i = 1; i < w.length; i++) { const a = w.slice(0, i).join(' '), b = w.slice(i).join(' '), q = Math.min(fit(a, 50), fit(b, 50)); if (!best || q > best.q) best = { q, a, b }; } lines = [best.a, best.b]; s = best.q; }
      x.font = `700 ${Math.max(12, Math.floor(s))}px Georgia, serif`; const lh = s * 1.02, y0 = k * H + H / 2 - (lines.length - 1) * lh / 2;
      lines.forEach((ln, i) => { const y = y0 + i * lh; x.fillStyle = '#0c0704'; x.fillText(ln, W / 2 - 2, y - 2); x.fillStyle = '#9a7a52'; x.fillText(ln, W / 2, y); }); }
    t.needsUpdate = true; return true; };
  paint([]); return { mat, paint }; }
// ── a felled trunk (Session 1540, for survival B's Felling, Session 1534: "the trunk falls where you face"; the systems builder's ask):
// a log lying along +z from its butt at 0 to its top at L, its axis R over the ground (y = 0 the axis, the underside at −R), tapering
// to 0.8 R, a little crooked; bark of the kit's own (furrowed plates); the butt chopped round to a blunt point (pale, its rings drawn),
// the top torn off in splinters, four or five branch stubs off the sides, their sawn ends pale. Its top stays within 0.2 R of 2R over
// the ground, so the game's flat deck along it stays on it. Seeded: one id, one log.
//   PKIT.props.trunk(L, R, seed) -> { group, tris, draws, L, R }
let TKM = null;
function trunkEndTex() { const c = document.createElement('canvas'); c.width = c.height = 256; const x = c.getContext('2d');
  x.fillStyle = '#c9a874'; x.fillRect(0, 0, 256, 256); for (let r = 6; r < 128; r += 5 + (r % 3)) { x.strokeStyle = r % 2 ? 'rgba(120,80,40,.35)' : 'rgba(150,105,60,.25)'; x.lineWidth = 1.5; x.beginPath(); x.arc(128 + Math.sin(r) * 2, 128 + Math.cos(r * .7) * 2, r, 0, Math.PI * 2); x.stroke(); }
  x.strokeStyle = 'rgba(70,45,25,.5)'; x.lineWidth = 2; for (const a of [.4, 2.1, 3.9, 5.2]) { x.beginPath(); x.moveTo(128 + 12 * Math.cos(a), 128 + 12 * Math.sin(a)); x.lineTo(128 + 90 * Math.cos(a + .08), 128 + 90 * Math.sin(a + .08)); x.stroke(); }
  x.fillStyle = '#4a3020'; x.beginPath(); x.arc(128, 128, 122, 0, Math.PI * 2); x.arc(128, 128, 112, 0, Math.PI * 2, true); x.fill(); /* the bark's rim */
  const t = finishTex(c); t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping; return t; }
function felledTrunk(L = 9, R = .35, seed = 1) {
  if (!TKM) TKM = { bark: mat('bark', { ns: 1.4, color: 0xd8ccc0, rough: .95 }), end: new THREE.MeshStandardMaterial({ map: trunkEndTex(), roughness: .85 }), heart: new THREE.MeshStandardMaterial({ color: 0xc8a070, roughness: .9, side: THREE.DoubleSide }) };
  const rnd = stream('trunk:' + seed), B = new Map(), add = (k, g) => { g = g.index ? g.toNonIndexed() : g; for (const a of Object.keys(g.attributes)) if (!['position', 'normal', 'uv'].includes(a)) g.deleteAttribute(a);
    if (!g.attributes.uv) g.setAttribute('uv', new THREE.Float32BufferAttribute(new Float32Array(g.attributes.position.count * 2), 2)); if (!B.has(k)) B.set(k, []); B.get(k).push(g); };
  const NR = 12, NS = Math.max(4, Math.round(L / .5)), bend = (rnd() - .5) * .5 * R, ph = rnd() * 6.28;
  // the axis and the radius at t (0 the butt, 1 the top): tapering, crooked to one side, the underside kept on the ground
  const rad = (t, a) => R * (1 - .2 * t) * (1 + .05 * Math.sin(a * 3 + ph + t * 7) + .03 * Math.sin(a * 7 - t * 13)), cx = t => bend * Math.sin(Math.PI * t), cy = t => -.2 * R * t;
  const P = [], U = [], ring = (t, k) => { const a = k / NR * Math.PI * 2, r = rad(t, a); return [cx(t) + r * Math.sin(a), cy(t) + r * Math.cos(a), t * L]; };
  for (let i = 0; i < NS; i++) for (let k = 0; k < NR; k++) { const t0 = i / NS, t1 = (i + 1) / NS, q = [ring(t0, k), ring(t1, k), ring(t1, k + 1), ring(t0, k + 1)], uv = [[k / NR, t0 * L / 1.2], [k / NR, t1 * L / 1.2], [(k + 1) / NR, t1 * L / 1.2], [(k + 1) / NR, t0 * L / 1.2]];
    for (const j of [0, 1, 2, 0, 2, 3]) { P.push(...q[j]); U.push(uv[j][0] * 2, uv[j][1]); } }
  { const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(U, 2)); g.computeVertexNormals(); add('bark', g); }
  // the butt: chopped round to a blunt point by the axe, a low cone from the bark's last ring, its rings drawn on it
  { const E = [], EU = [], dz = R * .35; for (let k = 0; k < NR; k++) { const a0 = k / NR * Math.PI * 2, a1 = (k + 1) / NR * Math.PI * 2, q0 = ring(0, k), q1 = ring(0, k + 1), c = [cx(0), cy(0), -dz];
      for (const [p, a] of [[c, null], [q0, a0], [q1, a1]]) { E.push(...p); EU.push(a == null ? .5 : .5 + .47 * Math.sin(a), a == null ? .5 : .5 + .47 * Math.cos(a)); } }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(E, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(EU, 2)); g.computeVertexNormals(); add('end', g); }
  // the top: torn off, a crown of splinters standing out of the last ring, pale inside
  { const E = [], c = [cx(1), cy(1), L]; for (let k = 0; k < NR; k++) { const p0 = ring(1, k), p1 = ring(1, k + 1), h = R * (.25 + rnd() * .9), m = [(p0[0] + p1[0]) / 2 * .55 + c[0] * .45, (p0[1] + p1[1]) / 2 * .55 + c[1] * .45, L + h];
      E.push(...p0, ...p1, ...m, ...c, ...p0, ...m, ...c, ...m, ...p1); }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(E, 3)); g.computeVertexNormals(); add('heart', g); }
  // the branch stubs: off the sides, 80° to 105° from the top (never up, where you walk), cut 0.2 to 0.45 m out, their ends pale
  const nb = 4 + Math.floor(rnd() * 2); for (let b = 0; b < nb; b++) { const t = .4 + .55 * (b + rnd() * .8) / nb, side = b % 2 ? 1 : -1, a = side * (Math.PI / 2 - .17 + rnd() * .45), r = rad(t, a) * (.3 + rnd() * .14), len = .2 + rnd() * .25;
    const o = new THREE.Vector3(cx(t) + rad(t, a) * .8 * Math.sin(a), cy(t) + rad(t, a) * .8 * Math.cos(a), t * L), d = new THREE.Vector3(Math.sin(a), Math.cos(a), .4).normalize(), q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), d);
    const g = new THREE.CylinderGeometry(r * .8, r, len + rad(t, a) * .2, 6, 1, true); g.translate(0, (len + rad(t, a) * .2) / 2, 0); g.applyQuaternion(q); g.translate(o.x, o.y, o.z); add('bark', g);
    const cap = new THREE.CircleGeometry(r * .8, 6); cap.rotateX(-Math.PI / 2); cap.translate(0, len + rad(t, a) * .2, 0); cap.applyQuaternion(q); cap.translate(o.x, o.y, o.z); add('heart', cap); }
  const group = new THREE.Group(); group.name = 'felled trunk'; let tris = 0;
  for (const [k, gs] of B) { const g = mergeGeometries(gs); gs.forEach(x => x.dispose()); const m = new THREE.Mesh(g, TKM[k]); m.name = 'trunk:' + k; m.castShadow = true; m.receiveShadow = true; group.add(m); tris += g.attributes.position.count / 3; }
  return { group, tris: Math.round(tris), draws: group.children.length, L, R };
}
// ── ships (card F11, backlog L6, OG-004; Session 1531): the Gatelands sloop of docs/prototypes/levelup/ships.js (gatelandsSloop,
// Session 858; Michael's A on #306: the square sail, the harp, a tiller on the small hulls), in the game's sloop's numbers (L 13, W 4.4,
// draft 1.05, the deck 1.0 over the sea): clinker strakes lapped, tarred below the water and oak above, the sheer strake green under a
// cream wale; raked stem and sternpost; fore-and-aft deck planks on the hull's own half-breadth; stanchions and a rail 1.0 m over the
// deck; one mast, a square green sail with the harp on its yard 9 m up, its foot 2.2 m over the deck; shrouds and stays; the rudder on
// the post and a tiller over the stern.
//   PKIT.ships.sloop(o) -> { hull, rig, tiller, L, W, zs, zb, mast: [x, z], hatch, deckAt(z), at(z) -> {b, g, k}, tris, draws }, y = 0
//   the sea, +z the bow. hull and rig are { geo, mats }: one geometry, one group a material (a draw each). rig is the yard and the
//   sail in the mast's frame (z from the mast), so the game can brace it round; tiller is a Group pivoted on the stern head.
//   o.dress (Session 1538, Michael's A on #839: the yard's island): 'mark' is ships.js's markSloop (the same hull tar-black over a
//   red-brown bottom, the wale gilt, the gilt beast's head on the stem, painted round shields on the rail; the cutter's gaff main and
//   topsail on a topmast, a staysail and a jib on a bowsprit, tanned sails, the boom 2.15 m over the deck), 'aurenne' its aurenneSloop
//   (tallowed white below, oiled above, the sheer strake blue under a gilt wale; one lateen on a mast raked 4° forward, its yard slung to
//   starboard, white with the sun-star); anything else the Gatelands'. rigs lists every rig ({ geo, mats, tris, z, type }: 'square',
//   'gaff', the Mark's headsails 'jib' in the hull's frame, as the game's old cutter has them, 'lateen' about the sling); rig is the first.
//   Differences from the prototype: o.hatchZ puts the hatch (the game's is forward, L/2 - 3.2, where the cabin's door is); the braces and
//   sheets are left off (they would hang loose once the yard braces round); the sail's harp carries no colour space (the kit's rule).
const SHM = {};
function shipSailTex(harp) { const c = document.createElement('canvas'); c.width = c.height = 512; const x = c.getContext('2d');
  x.fillStyle = '#3f6e3c'; x.fillRect(0, 0, 512, 512); x.fillStyle = 'rgba(0,0,0,.08)'; for (let i = 0; i < 512; i += 64) x.fillRect(i, 0, 3, 512);
  if (harp) { x.strokeStyle = x.fillStyle = '#e6d6a4'; x.lineCap = 'round'; x.lineJoin = 'round';
    const sb = xx => 130 + (xx - 175) * 2.4, nk = xx => { const t = (xx - 175) / 190; return 130 - 70 * Math.sin(Math.PI * t) + 40 * t; };
    x.lineWidth = 9; for (let xx = 196; xx < 352; xx += 13) { const y0 = nk(xx) + 6, y1 = Math.min(sb(xx), 440) - 10; if (y1 > y0 + 10) { x.beginPath(); x.moveTo(xx, y0); x.lineTo(xx, y1); x.stroke(); } }
    x.lineWidth = 30; x.beginPath(); x.moveTo(175, 130); x.lineTo(304, 440); x.stroke();
    x.lineWidth = 20; x.beginPath(); x.moveTo(175, 130); for (let xx = 175; xx <= 365; xx += 5) x.lineTo(xx, nk(xx)); x.stroke();
    x.lineWidth = 22; x.beginPath(); x.moveTo(365, nk(365)); x.bezierCurveTo(400, 260, 380, 380, 304, 440); x.stroke(); }
  return finishTex(c); }
function shipMats(dress) { const key = dress === 'mark' || dress === 'aurenne' ? dress : 'gatelands'; if (SHM[key]) return SHM[key];
  const std = (c, r = .6, m = 0) => new THREE.MeshStandardMaterial({ color: c, roughness: r, metalness: m }), base = { dark: std(0x14100c, 1), rope: std(0x3a3024, .95), iron: std(0x2c2a28, .5, .6) };
  let M;
  if (key === 'mark') { M = { ...base, tar: mat('wood', { ns: .5, color: 0x1e1c1c, rough: .45 }), bottom: mat('wood', { ns: .5, color: 0x4a2a20, rough: .6 }), gilt: std(0xb08a3a, .35, .7),
      deck: mat('wood', { ns: .9, color: 0xa89270, rough: .85 }), oak: mat('wood', { ns: 1.0, color: 0x8a6a48, rough: .7 }), spar: mat('wood', { ns: .8, color: 0x6a4a2e, rough: .7 }),
      sail: new THREE.MeshStandardMaterial({ map: shipTannedTex(), roughness: .9, side: THREE.DoubleSide }), shieldA: std(0x24365e), shieldB: std(0x8a2a1e), shieldC: std(0xd8ccb0) };
    M.green = M.tar; M.cream = M.gilt; }
  else if (key === 'aurenne') { M = { ...base, tallow: mat('wood', { ns: .4, color: 0xd6ccb4, rough: .7 }), hull: mat('wood', { ns: .8, color: 0xb08458, rough: .6 }), blue: std(0x2b4a80, .72), gilt: std(0xc8a850, .35, .7),
      deck: mat('wood', { ns: .9, color: 0xb8a07a, rough: .85 }), oak: mat('wood', { ns: 1.0, color: 0x9a7650, rough: .7 }), spar: mat('wood', { ns: .8, color: 0x6a4a2e, rough: .7 }),
      sail: new THREE.MeshStandardMaterial({ map: shipStarTex(), roughness: .9, side: THREE.DoubleSide }) };
    M.tar = M.hull; M.green = M.blue; M.cream = M.gilt; }
  else M = { ...base, tar: mat('wood', { ns: .6, color: 0x2a2420, rough: .55 }), oak: mat('wood', { ns: 1.0, color: 0xc29a6a, rough: .7 }), green: mat('wood', { ns: .8, color: 0x2f5a34, rough: .6 }),
    cream: mat('wood', { ns: .5, color: 0xe2d6b0, rough: .6 }), deck: mat('wood', { ns: .9, color: 0xb49a74, rough: .85 }), spar: mat('wood', { ns: .8, color: 0x7a5a3a, rough: .7 }),
    sail: new THREE.MeshStandardMaterial({ map: shipSailTex(true), roughness: .9, side: THREE.DoubleSide }) };
  return SHM[key] = M; }
// the Mark's sails (ships.js's cutterSail): tanned red-brown cloths, their seams and reef bands
function shipTannedTex() { const c = document.createElement('canvas'); c.width = c.height = 512; const x = c.getContext('2d');
  for (let i = 0; i < 8; i++) { x.fillStyle = i % 2 ? '#7a3826' : '#723422'; x.fillRect(i * 64, 0, 64, 512); }
  x.fillStyle = 'rgba(0,0,0,.12)'; for (let i = 0; i < 512; i += 64) x.fillRect(i, 0, 3, 512); for (let j = 0; j < 512; j += 128) x.fillRect(0, j, 512, 2);
  return finishTex(c); }
// Aurenne's (ships.js's caravelSail): white cloths and the sun-star in gold, sixteen rays long and short by turns (#316 A)
function shipStarTex() { const c = document.createElement('canvas'); c.width = c.height = 512; const x = c.getContext('2d');
  x.fillStyle = '#ece5d2'; x.fillRect(0, 0, 512, 512); x.fillStyle = 'rgba(80,60,30,.09)'; for (let i = 0; i < 512; i += 48) x.fillRect(i, 0, 3, 512);
  x.fillStyle = '#c9982e'; x.beginPath(); for (let k = 0; k < 32; k++) { const a = k * Math.PI / 16 - Math.PI / 2, rr = k % 2 ? 62 : (k / 2) % 2 ? 128 : 172; x.lineTo(256 + rr * Math.cos(a), 256 + rr * Math.sin(a)); } x.closePath(); x.fill();
  x.fillStyle = '#e2b84a'; x.beginPath(); x.arc(256, 256, 70, 0, Math.PI * 2); x.fill(); x.strokeStyle = '#a87a22'; x.lineWidth = 6; x.beginPath(); x.arc(256, 256, 54, 0, Math.PI * 2); x.stroke();
  const t = finishTex(c); t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping; return t; }
// a sail through four corners (or three, d = c), bilinear, bellied out to +x most in its middle (ships.js's quadSail)
function shipQuadSail(a, b, c, d, belly, nu = 12, nv = 12) { const P = [], U = [], v3 = q => new THREE.Vector3(...q), A = v3(a), B = v3(b), C = v3(c), D = v3(d), at = (u, v) => A.clone().lerp(B, u).lerp(D.clone().lerp(C, u), v).add(new THREE.Vector3(belly * Math.sin(Math.PI * u) * Math.sin(Math.PI * Math.min(1, v * 1.1)), 0, 0));
  for (let i = 0; i < nu; i++) for (let j = 0; j < nv; j++) for (const [u, v] of [[i, j], [i + 1, j], [i + 1, j + 1], [i, j], [i + 1, j + 1], [i, j + 1]]) { const p = at(u / nu, v / nv); P.push(p.x, p.y, p.z); U.push(u / nu, v / nv); }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(U, 2)); g.computeVertexNormals(); return g; }
// a lateen: the triangle tack-peak-clew, bellied to `side`; its UVs the sail's own plane about its incentre, so the star sits whole (ships.js's lateenSail)
function shipLateenSail(T, P, C, side, belly, n = 14) { const P3 = [], U = [], v = q => new THREE.Vector3(...q), A = v(T), B = v(P), Cc = v(C);
  const a = B.distanceTo(Cc), b = A.distanceTo(Cc), c = A.distanceTo(B), s = a + b + c, I = A.clone().multiplyScalar(a / s).add(B.clone().multiplyScalar(b / s)).add(Cc.clone().multiplyScalar(c / s)), rin = Math.sqrt((s / 2 - a) * (s / 2 - b) * (s / 2 - c) / (s / 2)), S = rin * 2.3;
  const at = (i, j) => { const k = n - i - j, p = A.clone().multiplyScalar(i / n).add(B.clone().multiplyScalar(j / n)).add(Cc.clone().multiplyScalar(k / n)); p.x += side * belly * 27 * (i / n) * (j / n) * (k / n); return p; };
  const tri = q => { for (const [i, j] of q) { const p = at(i, j); P3.push(p.x, p.y, p.z); U.push((p.z - I.z) / S * side + .5, (p.y - I.y) / S + .5); } };
  for (let i = 0; i < n; i++) for (let j = 0; i + j < n; j++) { tri([[i, j], [i + 1, j], [i, j + 1]]); if (i + j + 1 < n) tri([[i + 1, j], [i + 1, j + 1], [i, j + 1]]); }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(P3, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(U, 2)); g.computeVertexNormals(); return g; }
// buckets of geometry by material key, baked into one geometry with a group a material (keys that share one share a draw)
function shipKit() { const B = new Map();
  const put = (geo, key, x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0, uv = .6) => { const g = geo.index ? geo.toNonIndexed() : geo; for (const k of Object.keys(g.attributes)) if (!['position', 'normal', 'uv'].includes(k)) g.deleteAttribute(k);
    g.applyMatrix4(new THREE.Matrix4().compose(new THREE.Vector3(x, y, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(rx, ry, rz, 'YXZ')), new THREE.Vector3(1, 1, 1))); if (uv !== null || !g.attributes.uv) worldUV(g, uv ?? .6);
    if (!B.has(key)) B.set(key, []); B.get(key).push(g); };
  const rod = (a, b, r0, r1, key) => { const A = new THREE.Vector3(...a), Bv = new THREE.Vector3(...b), d = Bv.clone().sub(A), g = new THREE.CylinderGeometry(r1, r0, d.length(), 6);
    g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.clone().normalize())); const m = A.clone().add(Bv).multiplyScalar(.5); put(g, key, m.x, m.y, m.z, 0, 0, 0, 2); };
  const bake = M => { const parts = [], mats = [], byM = new Map(); for (const [k, gs] of B) { if (!byM.has(M[k])) byM.set(M[k], []); byM.get(M[k]).push(...gs); }
    for (const [m, gs] of byM) { parts.push(mergeGeometries(gs)); gs.forEach(x => x.dispose()); mats.push(m); }
    const geo = mergeGeometries(parts); let s = 0; parts.forEach((p, i) => { const n = p.attributes.position.count; geo.addGroup(s, n, i); s += n; p.dispose(); }); B.clear();
    return { geo, mats, tris: s / 3 }; };
  return { put, rod, bake }; }
function shipRibbon(rows, flip) { const P = [], U = [], n = rows[0].length;
  for (let i = 0; i + 1 < rows.length; i++) for (let k = 0; k + 1 < n; k++) { const a = rows[i][k], b = rows[i + 1][k], c = rows[i + 1][k + 1], d = rows[i][k + 1];
    const q = flip ? [a, c, b, a, d, c] : [a, b, c, a, c, d]; for (const v of q) { P.push(v[0], v[1], v[2]); U.push((v[1] + Math.abs(v[0]) * .5) * 1.6, v[2] * .45); } }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(U, 2)); g.computeVertexNormals(); return g; }
// the Mark's beast's head on a stem head at (hy, hz): a neck rising and curling forward to a head with a snout and an open jaw, gilt,
// its eyes dark; k its scale, d its thickness (ships.js's, the sloop's at 1.15 and the cutter's at 1.35)
function shipBeastHead(put, hy, hz, k, d) { const sh = new THREE.Shape(), P = [[-.1, 0], [.12, 0], [.2, .3], [.3, .5], [.45, .52], [.7, .55], [.95, .6], [.75, .66], [1.0, .72], [.95, .82], [.62, .9], [.42, .98], [.3, .86], [.1, .6], [-.05, .3]];
  sh.moveTo(P[0][0], P[0][1]); for (const [a, b] of P.slice(1)) sh.lineTo(a, b); sh.lineTo(0, 0); const bv = d * .2;
  const g = new THREE.ExtrudeGeometry(sh, { depth: d, bevelEnabled: true, bevelThickness: bv, bevelSize: bv, bevelSegments: 2, curveSegments: 4 }); g.translate(0, 0, -d / 2); g.rotateY(-Math.PI / 2); g.scale(1, k, k);
  put(g, 'gilt', 0, hy, hz, 0, 0, 0, .8); for (const e of [1, -1]) put(new THREE.SphereGeometry(d / 4, 6, 5), 'dark', e * d * .7, hy + .84 * k, hz + .62 * k); }
function glSloop(o = {}) {
  const MARK = o.dress === 'mark', AURD = o.dress === 'aurenne', M = shipMats(o.dress), { put, rod, bake } = shipKit();
  const L = 13, W = 4.4, DRAFT = 1.05, DECK = 1.0, SHEER = 1.42, BOW = .75, STERN = .5, NS = 40, NSTR = 10, TH = .035, LAP = .025;
  const zs = -L / 2, zb = L / 2;
  const sheerAt = z => SHEER + BOW * Math.max(0, z / zb) ** 2 + STERN * Math.max(0, z / zs) ** 2;
  const beamAt = z => { const t = Math.max(-1, Math.min(1, z / (zb - .05))), e = t > 0 ? 1.7 : 2.1; return W / 2 / 1.04 * Math.max(0, 1 - Math.abs(t) ** e) ** (t > 0 ? .55 : .62); };
  const keelAt = z => -DRAFT * (1 - .35 * Math.abs(z / zb) ** 3);
  const sect = (z, u) => { const b = beamAt(z), k = keelAt(z), s = sheerAt(z), y = k + (s - k) * u ** 1.15; return [b * Math.sin(Math.PI / 2 * Math.min(1, u * 1.25)) ** .7 * (1 + .04 * Math.max(0, u - .8) / .2), y]; };
  const zAt = i => zs + .05 + (L - .1) * i / NS;
  const zr = (z, u) => z * (1 - (z > 0 ? .13 : .09) * (1 - u) ** 1.5 * Math.abs(z / zb) ** 6);
  // the strakes: NSTR bands of girth, each a plank TH thick whose lower edge stands LAP outside the one below (the clinker lap)
  const norm = (z, u) => { const a = sect(z, Math.max(0, u - .01)), b = sect(z, Math.min(1, u + .01)), dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy) || 1; return [dy / l, -dx / l]; };
  const KR = 6;
  for (let s = 0; s < NSTR; s++) { const u0 = s / NSTR, u1 = (s + 1) / NSTR + (s < NSTR - 1 ? .018 : 0), outer = [], inner = [];
    for (let i = 0; i <= NS; i++) { const z = zAt(i), ro = [], ri = []; for (let k = 0; k <= KR; k++) { const u = u0 + (u1 - u0) * k / KR, p = sect(z, u), n = norm(z, u), off = (LAP + TH * .3) * (1 - k / KR) * (s ? 1 : .2) + TH * .3;
        ro.push([p[0] + n[0] * off, p[1] + n[1] * off, zr(z, u)]); ri.push([p[0] + n[0] * (off - TH), p[1] + n[1] * (off - TH), zr(z, u)]); } outer.push(ro); inner.push(ri); }
    const yMid = sect(0, (u0 + u1) / 2)[1], key = MARK ? (yMid < .08 ? 'bottom' : 'tar') : AURD ? (yMid < .08 ? 'tallow' : s === NSTR - 1 ? 'blue' : 'hull') : s === NSTR - 1 ? 'green' : yMid < .08 ? 'tar' : 'oak';
    for (const side of [1, -1]) { const mir = rows => rows.map(row => row.map(([x, y, z]) => [x * side, y, z])); put(shipRibbon(mir(outer), side > 0), key, 0, 0, 0, 0, 0, 0, null); put(shipRibbon(mir(inner), side < 0), key, 0, 0, 0, 0, 0, 0, null);
      put(shipRibbon(mir(outer.map((row, i) => [row[0], inner[i][0]])), side < 0), key, 0, 0, 0, 0, 0, 0, null); } }
  // the keel, the stem and the sternpost
  { const pts = []; for (let i = 0; i <= NS; i++) { const z = zAt(i); pts.push([zr(z, 0), keelAt(z) - .06]); }
    for (let i = 0; i < NS; i++) { const [z0, y0] = pts[i], [z1, y1] = pts[i + 1]; put(new THREE.BoxGeometry(.16, .2, Math.hypot(z1 - z0, y1 - y0) + .02), 'tar', 0, (y0 + y1) / 2, (z0 + z1) / 2, -Math.atan2(y1 - y0, z1 - z0)); }
    rod([0, keelAt(zb) - .12, zr(zb - .05, 0) - .05], [0, sheerAt(zb) + .35, zb + .12], .1, .08, 'oak'); rod([0, keelAt(zs) - .12, zr(zs + .05, 0) + .05], [0, sheerAt(zs) + .2, zs - .08], .11, .09, 'oak'); }
  // the deck: fore-and-aft planks, each cut to the half-breadth at the deck's height; the covering board out to the planking
  const deckAt = z => { let lo = 0, hi = 1; for (let k = 0; k < 30; k++) { const m = (lo + hi) / 2; if (sect(z, m)[1] < DECK) lo = m; else hi = m; } return sect(z, lo)[0] - TH * .6; };
  { const PW = .16; for (let x = -W / 2 + PW / 2; x < W / 2; x += PW) { const zz = []; for (let i = 0; i <= NS; i++) { const z = zAt(i); if (deckAt(z) >= Math.abs(x) + PW / 2) zz.push(z); } if (zz.length < 2) continue;
      /* o.open (Session 1555, shipbase.js's): the hatch open to the hold below, the planks cut at the coaming's inside (the base below deck) */
      const z0 = zz[0], z1 = zz[zz.length - 1], HZo = o.hatchZ ?? -2.0;
      if (o.open && Math.abs(x) - PW / 2 < .6) { for (const [a2, b2] of [[z0, HZo - .6], [HZo + .6, z1]]) if (b2 - a2 > .02) put(new THREE.BoxGeometry(PW, .05, b2 - a2), 'deck', x, DECK - .025, (a2 + b2) / 2, 0, 0, 0, .35); continue; }
      put(new THREE.BoxGeometry(PW, .05, z1 - z0), 'deck', x, DECK - .025, (z0 + z1) / 2, 0, 0, 0, .35); }
    for (const e of [1, -1]) { const rows = []; for (let i = 0; i <= NS; i++) { const z = zAt(i), d = deckAt(z); rows.push([[e * Math.max(0, d - .3), DECK + .002, z], [e * (d + TH * .5), DECK + .002, z]]); } put(shipRibbon(rows, e < 0), 'oak', 0, 0, 0, 0, 0, 0, null); } }
  // stanchions every 0.9 m, the cap rail 1.0 m over the deck (or 0.12 over the sheer), the cream wale on the sheer strake
  { const n = Math.round(L / .9), top = z => Math.max(DECK + 1.0, sheerAt(z) + .12), inset = z => sect(z, 1)[0] - .06;
    for (let k = 1; k < n; k++) { const z = zs + L * k / n; if (inset(z) < .25) continue; for (const e of [1, -1]) put(new THREE.BoxGeometry(.08, top(z) - DECK, .08), 'oak', e * Math.min(inset(z), deckAt(z) - .05), (top(z) + DECK) / 2, z); }
    for (let k = 1; k + 1 < n; k++) { const za = zs + L * k / n, zc = zs + L * (k + 1) / n; if (inset(za) < .25 || inset(zc) < .25) continue;
      for (const e of [1, -1]) { rod([e * Math.min(inset(za), deckAt(za) - .05), top(za), za], [e * Math.min(inset(zc), deckAt(zc) - .05), top(zc), zc], .045, .045, 'oak'); rod([e * (sect(za, 1)[0] + .02), sheerAt(za) - .02, za], [e * (sect(zc, 1)[0] + .02), sheerAt(zc) - .02, zc], .04, .04, 'cream'); } } }
  // the hatch: a coaming 0.3 m high round a dark plate
  const MZ = 1.0, HZ = o.hatchZ ?? -2.0, hatch = { x0: -.66, x1: .66, z0: HZ - .66, z1: HZ + .66 };
  for (const e of [-1, 1]) { put(new THREE.BoxGeometry(1.32, .3, .08), 'oak', 0, DECK + .15, HZ + e * .62); put(new THREE.BoxGeometry(.08, .3, 1.24), 'oak', e * .62, DECK + .15, HZ); }
  if (!o.open) put(new THREE.BoxGeometry(1.16, .02, 1.16), 'dark', 0, DECK + .02, HZ);
  // the mast and its standing rigging, by the yard's island (#306: one rig names each island). The Gatelands': three shrouds a side to the
  // chainplates, the forestay to the stem head, the backstay to the stern. The Mark's: a topmast and a bowsprit, the forestay and the
  // jibstay, backstays to the quarters. Aurenne's: the mast raked 4° forward, shrouds to windward of the slung yard, the forestay.
  const MH = 10.5, YY = DECK + 9, YL = 7.6, SF = DECK + 2.2, BY = DECK + 2.15, chains = [];
  let mastAt = () => MZ, sling = null;
  if (AURD) { const RAKE = 4 * Math.PI / 180, sy = 7.0, top = DECK + sy + .8; mastAt = y => MZ + (y - (keelAt(MZ) + .1)) * Math.tan(RAKE); sling = { y: DECK + sy, z: mastAt(DECK + sy), top };
    rod([0, keelAt(MZ) + .1, MZ], [0, top, mastAt(top)], .16, .1, 'spar'); rod([.15, top - .1, mastAt(top)], [0, DECK + .4, MZ - .3], .012, .012, 'rope');
    for (const dz of [-.8, 0, .8]) { const z = MZ + dz - .3; rod([0, top - .3, mastAt(top - .3)], [-(sect(z, 1)[0] + .05), sheerAt(z) - .05, z], .012, .012, 'rope'); }
    rod([0, top - .2, mastAt(top - .2)], [0, sheerAt(zb) + .3, zb + .17], .014, .014, 'rope'); }
  else if (MARK) { const SP = [0, sheerAt(zb) + .3 + 3.6 * Math.sin(.08), zb + 3.6 * Math.cos(.08)];
    rod([0, keelAt(MZ) + .1, MZ], [0, DECK + MH, MZ], .16, .1, 'spar'); rod([0, DECK + MH - .8, MZ], [0, DECK + MH + 2.0, MZ], .075, .055, 'spar'); rod([0, sheerAt(zb) + .22, zb - 1.0], SP, .075, .05, 'spar');
    for (const e of [1, -1]) for (const dz of [-.7, 0, .7]) { const z = MZ + dz - .3; if (e > 0) chains.push(z); rod([0, DECK + MH * .9, MZ], [e * (sect(z, 1)[0] + .05), sheerAt(z) - .05, z], .012, .012, 'rope'); }
    rod([0, DECK + MH * .76, MZ], [0, sheerAt(zb) + .3, zb], .014, .014, 'rope'); rod([0, DECK + MH * .86, MZ], SP, .014, .014, 'rope');
    for (const e of [1, -1]) rod([0, DECK + MH, MZ], [e * (sect(zs + 1.5, 1)[0] - .05), sheerAt(zs + 1.5), zs + 1.5], .012, .012, 'rope'); }
  else { rod([0, keelAt(MZ) + .1, MZ], [0, DECK + MH, MZ], .16, .1, 'spar');
    for (const e of [1, -1]) for (const dz of [-.6, .1, .8]) { const z = MZ + dz - .2; rod([0, DECK + MH * .93, MZ], [e * (sect(z, 1)[0] + .05), sheerAt(z) - .05, z], .012, .012, 'rope'); }
    rod([0, DECK + MH * .97, MZ], [0, sheerAt(zb) + .3, zb + .17], .014, .014, 'rope'); rod([0, DECK + MH * .97, MZ], [0, sheerAt(zs) + .15, zs - .1], .014, .014, 'rope'); }
  // the rudder hung on the raked sternpost; a bucket and a coil of rope by the mast
  { const pb = [zr(zs + .05, 0) + .05, keelAt(zs) - .12], pt = [zs - .08, sheerAt(zs) + .2], ang = Math.atan2(pt[0] - pb[0], pt[1] - pb[1]), rh = Math.hypot(pt[0] - pb[0], pt[1] - pb[1]) - .35;
    put(new THREE.BoxGeometry(.1, rh, .62).translate(0, rh / 2, -.36), 'tar', 0, pb[1] + .05, pb[0] - .02, ang); }
  put(new THREE.TorusGeometry(.22, .05, 6, 18).rotateX(Math.PI / 2), 'rope', .35, DECK + .05, MZ - .55); put(new THREE.CylinderGeometry(.16, .13, .3, 12), 'oak', -.45, DECK + .15, MZ - .7);
  // the Mark's dress: the gilt beast's head on the stem head, and a row of painted round shields hung outboard on the rail (OG-028)
  const head = MARK && o.head !== false, shields = [];
  if (head) shipBeastHead(put, sheerAt(zb) + .25, zb - .02, 1.15, .18);
  if (MARK && o.shields !== false) { const RS = .38, top = z => Math.max(DECK + 1.0, sheerAt(z) + .12);
    for (let z = -3.4, k = 0; z <= 3.41; z += .8, k++) for (const e of [1, -1]) { if (chains.some(c => Math.abs(c - z) < .45)) continue; const x = e * (sect(z, 1)[0] + .07), y = top(z) - RS - .02, g = new THREE.CylinderGeometry(RS, RS, .03, 20); g.rotateZ(Math.PI / 2);
      put(g, k % 2 ? 'shieldA' : 'shieldB', x, y, z); const half = new THREE.CylinderGeometry(RS * .98, RS * .98, .032, 20, 1, false, 0, Math.PI / 2); half.rotateZ(Math.PI / 2); put(half, 'shieldC', x, y, z);
      const boss = new THREE.SphereGeometry(.09, 10, 6, 0, Math.PI * 2, 0, Math.PI / 2); boss.rotateZ(-e * Math.PI / 2); put(boss, 'iron', x + e * .015, y, z); shields.push({ x, y, z, r: RS }); } }
  const hull = bake(M), rigs = [];
  // the rigs, each in its own frame so the game trims it to the wind: the Gatelands' yard and square sail bellied forward, braced about
  // the mast; the Mark's boom, gaff, main and topsail swung about the mast and its staysail and jib in the hull's frame (bellied to
  // leeward, they turn no further); Aurenne's yard and lateen slung to starboard, swung about the sling. The braces and sheets are left off.
  if (AURD) { const ang = 50 * Math.PI / 180, fw = 5.4, af = 7.4, xs = .3, Sg = [xs, sling.y, 0], T = [xs, Sg[1] - fw * Math.sin(ang), fw * Math.cos(ang)], Pk = [xs, Sg[1] + af * Math.sin(ang), -af * Math.cos(ang)], Cl = [xs, DECK + 2.5, -4.3 - sling.z];
    rod(T, Pk, .085, .055, 'spar'); put(shipLateenSail([T[0], T[1] - .05, T[2] - .15], [Pk[0], Pk[1] - .15, Pk[2] + .2], Cl, 1, .5), 'sail', 0, 0, 0, 0, 0, 0, null);
    rigs.push({ ...bake(M), z: sling.z, type: 'lateen' }); }
  else if (MARK) { const BZ1 = zs - .45 - MZ, GT = DECK + 8.1, GL = 5.4, GA = 30 * Math.PI / 180, PK = [0, GT + GL * Math.sin(GA), -GL * Math.cos(GA)];
    rod([0, BY, -.2], [0, BY, BZ1], .08, .07, 'spar'); rod([0, GT, -.2], PK, .07, .06, 'spar');
    put(shipQuadSail([0, BY + .1, -.25], [0, BY + .1, BZ1 + .3], PK, [0, GT - .05, -.25], .5), 'sail', 0, 0, 0, 0, 0, 0, null);
    put(shipQuadSail([0, DECK + MH + 1.9, -.1], PK, PK, [0, GT + .15, -.2], .22, 8, 8), 'sail', 0, 0, 0, 0, 0, 0, null);
    rigs.push({ ...bake(M), z: MZ, type: 'gaff' });
    const SP = [0, sheerAt(zb) + .3 + 3.6 * Math.sin(.08), zb + 3.6 * Math.cos(.08)];
    put(shipQuadSail([0, DECK + 1.5, MZ + 1.0], [0, sheerAt(zb) + .3, zb - .15], [0, sheerAt(zb) + .3, zb - .15], [0, DECK + MH * .76, MZ + .2], .3, 8, 8), 'sail', 0, 0, 0, 0, 0, 0, null);
    put(shipQuadSail([0, DECK + 2.2, zb - 1.0], SP, SP, [0, DECK + MH * .86, MZ + .25], .3, 8, 8), 'sail', 0, 0, 0, 0, 0, 0, null);
    rigs.push({ ...bake(M), z: 0, type: 'jib' }); }
  else { rod([-YL / 2, YY, .14], [YL / 2, YY, .14], .07, .07, 'spar');
    const g = new THREE.PlaneGeometry(YL - .3, YY - SF - .1, 14, 12), P = g.attributes.position; for (let k = 0; k < P.count; k++) { const x = P.getX(k) / (YL / 2), y = P.getY(k) / ((YY - SF) / 2); P.setZ(k, .55 * (1 - x * x) * (1 - .6 * y * y) + .1 * (1 - y) / 2); }
    g.computeVertexNormals(); put(g, 'sail', 0, (YY + SF) / 2 - .05, .22, 0, 0, 0, null); rigs.push({ ...bake(M), z: MZ, type: 'square' }); }
  const rig = rigs[0];
  // the tiller: from the rudder head over the stern to the helmsman's hand, 0.95 m over the deck; its frame is the rudder head
  const TP = [0, sheerAt(zs) + .25, zs - .1], TT = [0, DECK + .95, zs + 1.6];
  rod([0, 0, 0], [TT[0] - TP[0], TT[1] - TP[1], TT[2] - TP[2]], .045, .035, 'oak'); const tb = bake(M);
  const tiller = new THREE.Group(); tiller.name = 'tiller'; tiller.position.set(...TP); const tm = new THREE.Mesh(tb.geo, tb.mats); tm.castShadow = true; tiller.add(tm);
  const at = z => ({ b: sect(z, 1)[0], g: sheerAt(z), k: keelAt(z), sect: u => sect(z, u) });
  return { hull, rig, rigs, tiller, L, W, zs, zb, mast: [0, MZ], hatch, deckAt, at, sheerAt, sailFoot: MARK ? BY : SF, yard: YY, tip: TT, dress: MARK ? 'mark' : AURD ? 'aurenne' : 'gatelands', head, shields,
    tris: Math.round(hull.tris + rigs.reduce((a, q) => a + q.tris, 0) + tb.tris), draws: hull.mats.length + rigs.reduce((a, q) => a + q.mats.length, 0) + tb.mats.length };
}
// ── the base below deck (backlog L6, OG-027, OG-072; Michael's A on #418: the base in the hull's own lines; Session 1555): the sloop's
// hold of docs/prototypes/levelup/shipbase.js (sloopBase, Session 1129), inside the kit's sloop built with her hatch open (o.open). One
// low hold from a bulkhead aft of the ladder (z -4.0) to one forward of the mast (2.0), its floor of ceiling planks where the hull is
// 1.5 m across amidships, the frames every 0.75 m, the deck beams but none over the hatch; a ladder from the floor aft up through the
// hatch; a box bunk raised against the port side (rest and save), the sea chest across from it (the stash), a water cask by the mast, a
// lantern from a beam, the island's rug (the Mark's hide). Sitting headroom, as a sloop's was: a person stoops everywhere below.
//   PKIT.ships.sloopBase(o) -> { group (the ship's hull and the base, in the ship's frame: y = 0 the sea, +z the bow), tris, draws, items
//   ([{ name, place, box: [x0, y0, z0, x1, y1, z1] }]), hb(z, y) (the inside of the planking's half-breadth), floor, beams, beamY,
//   beamBottom, deckUnder, hold { z0, z1 }, hatch, ladder { foot, head }, lights ([{ x, y, z }]), dress }. o.dress as the sloop's.
//   Differences from the prototype: the ship's rig and tiller are left out (nothing of them shows below); the materials are the kit's.
const SBM = {};
function shipBaseMats(dress) { if (SBM[dress]) return SBM[dress];
  const D = SHIP_BASE_DRESS[dress], std = (c, r = .8, m = 0) => new THREE.MeshStandardMaterial({ color: c, roughness: r, metalness: m }), M = {};
  M.wood = mat('wood', { ns: .8, color: D.wood }); M.dark = mat('wood', { ns: .8, color: D.dark }); M.plank = mat('wood', { ns: .9, color: new THREE.Color(D.wood).multiplyScalar(.8).getHex() });
  M.cloth0 = std(D.cloth[0], 1); M.cloth1 = std(D.cloth[1], 1); M.rug0 = std(D.rug[0], 1); M.rug1 = std(D.rug[1], 1); M.trim = std(D.trim, .7);
  M.metal = std(D.metal, .4, .7); M.iron = std(0x1d1c1b, .5, .6); M.fur = std(0x8a7a66, 1);
  M.lamp = new THREE.MeshStandardMaterial({ color: 0x4d3319, emissive: 0xffb861, emissiveIntensity: 2.0 });
  return SBM[dress] = M; }
const SHIP_BASE_DRESS = {
  gatelands: { wood: 0xb08a62, dark: 0x6e5238, cloth: [0x3f6a46, 0xe6dcc0], rug: [0x5c3a2a, 0xc9b48a], metal: 0x2a2826, trim: 0x3f6a46 },
  mark: { wood: 0x7a6650, dark: 0x3a3029, cloth: [0x6d6458, 0x8f8578], rug: [0x7a5e44, 0x5a4634], metal: 0x1e1c1b, trim: 0x8a2a1e, fur: true },
  aurenne: { wood: 0xc29a6a, dark: 0x8a6440, cloth: [0x9c2f2a, 0x2f3f74], rug: [0x9c2f2a, 0xd8b06a], metal: 0xb08a3a, trim: 0x2f5f9c },
};
function sloopBase(o = {}) {
  const dress = SHIP_BASE_DRESS[o.dress] ? o.dress : 'gatelands', D = SHIP_BASE_DRESS[dress], M = shipBaseMats(dress);
  const S = glSloop({ open: true, dress }), DECK = 1.0, TH = .035, by = {}, items = [], lights = [];
  const sect = (z, u) => S.at(z).sect(u);
  const hb = (z, y) => { let lo = 0, hi = 1; for (let k = 0; k < 30; k++) { const m = (lo + hi) / 2; if (sect(z, m)[1] < y) lo = m; else hi = m; } return sect(z, lo)[0] - TH - .03; };
  const add = (key, g) => { const x = g.index ? g.toNonIndexed() : g; for (const k of Object.keys(x.attributes)) if (!['position', 'normal', 'uv'].includes(k)) x.deleteAttribute(k);
    if (!x.attributes.uv) worldUV(x, .8); (by[key] || (by[key] = [])).push(x); return x; };
  const box = (key, w, h, d, x, y, z, ry = 0) => { const g = new THREE.BoxGeometry(w, h, d); worldUV(g, .8); if (ry) g.rotateY(ry); g.translate(x, y, z); return add(key, g); };
  const cyl = (key, r0, r1, h, x, y, z, n = 12) => { const g = new THREE.CylinderGeometry(r0, r1, h, n); worldUV(g, .8); g.translate(x, y, z); return add(key, g); };
  const item = (name, place, x0, y0, z0, x1, y1, z1) => { items.push({ name, place, box: [x0, y0, z0, x1, y1, z1].map(v => +v.toFixed(3)) }); };
  const hz0 = -4.0, hz1 = 2.0, mid = -1.0; let FLOOR = -1; for (let y = -.9; y < .2; y += .01) if (hb(mid, y) >= .75) { FLOOR = +y.toFixed(2); break; }
  const BEAM = DECK - .15, BH = .14, beamY = BEAM - BH / 2;
  { const PW = .2; for (let x = -1.6 + PW / 2; x < 1.6; x += PW) { const zz = []; for (let z = hz0; z <= hz1 + 1e-6; z += .1) if (hb(z, FLOOR) - .02 >= Math.abs(x) + PW / 2) zz.push(z); if (zz.length < 2) continue;
      box('plank', PW - .01, .05, zz[zz.length - 1] - zz[0], x, FLOOR - .025, (zz[0] + zz[zz.length - 1]) / 2); } }
  for (let z = hz0 + .25; z <= hz1 - .24; z += .75) for (const e of [1, -1]) { const n = 5; for (let k = 0; k < n; k++) { const ya = FLOOR + (DECK - FLOOR - .05) * k / n, yb = FLOOR + (DECK - FLOOR - .05) * (k + 1) / n, xa = hb(z, ya) - .07, xb = hb(z, yb) - .07;
      const L = Math.hypot(xb - xa, yb - ya), g = new THREE.BoxGeometry(.12, L + .02, .14); worldUV(g, .8); g.rotateZ(-e * Math.atan2(xb - xa, yb - ya)); g.translate(e * (xa + xb) / 2, (ya + yb) / 2, z); add('dark', g); } }
  const beams = [-3.5, -2.75, -1.25, -.25, .5, 1.5];
  for (const z of beams) { const w = 2 * (hb(z, BEAM) - .02); box('dark', w, BH, .16, 0, BEAM, z); for (const e of [1, -1]) box('dark', .12, .36, .12, e * (hb(z, BEAM - .25) - .08), BEAM - .22, z); }
  for (const e of [1, -1]) box('dark', .12, .12, 1.5, e * .66, BEAM + .01, -2.0);
  for (const zb of [hz0, hz1]) { const sh = new THREE.Shape(), ys = []; for (let k = 0; k <= 10; k++) ys.push(FLOOR - .05 + (DECK - FLOOR) * k / 10);
    sh.moveTo(-hb(zb, ys[0]), ys[0]); for (const y of ys) sh.lineTo(-hb(zb, y), y); for (const y of [...ys].reverse()) sh.lineTo(hb(zb, y), y); sh.lineTo(-hb(zb, ys[0]), ys[0]);
    const g = new THREE.ExtrudeGeometry(sh, { depth: .05, bevelEnabled: false }); g.translate(0, 0, zb - (zb < 0 ? .05 : 0)); worldUV(g, .8); add('wood', g);
    for (let x = -1.8; x <= 1.8; x += .3) if (hb(zb, (FLOOR + DECK) / 2) > Math.abs(x) + .05 && hb(zb, FLOOR) > Math.abs(x) + .05) box('dark', .03, DECK - FLOOR - .05, .02, x, (FLOOR + DECK) / 2, zb + (zb < 0 ? .01 : -.01)); }
  const head = [0, DECK + .3, -2.55], rise = head[1] - FLOOR, foot = [0, FLOOR, +(head[2] - rise * .45).toFixed(2)];
  { const d = new THREE.Vector3(0, head[1] - foot[1], head[2] - foot[2]), L = d.length(), a = Math.atan2(d.z, d.y);
    for (const e of [-.24, .24]) { const g = new THREE.BoxGeometry(.06, L, .1); worldUV(g, .8); g.rotateX(a); g.translate(e, (foot[1] + head[1]) / 2, (foot[2] + head[2]) / 2); add('wood', g); }
    for (let k = 1; k * .28 < rise - .1; k++) { const f = k * .28 / rise; box('wood', .46, .04, .12, 0, foot[1] + rise * f, foot[2] + (head[2] - foot[2]) * f); }
    item('ladder', 'hatch', -.27, FLOOR, foot[2], .27, DECK + .3, head[2]); }
  { const mz = S.mast[1]; cyl('dark', .16, .16, DECK - FLOOR, 0, (FLOOR + DECK) / 2, mz, 12); box('dark', .26, .2, 1.1, 0, FLOOR + .1, mz); item('mast', 'hold', -.16, FLOOR, mz - .55, .16, DECK, mz + .55); }
  const onFloor = (z, half) => hb(z, FLOOR) - .04 - half, inAt = (z0, z1, y) => Math.min(hb(z0, y), hb(z1, y));
  { const z0 = -1.15, z1 = .75, w = .72, y0 = FLOOR + .32, top = y0 + .62, xo = -(inAt(z0, z1, y0) - .02), x = xo + w / 2, xi = xo + w;
    box('wood', w, .14, z1 - z0, x, y0 + .07, (z0 + z1) / 2); box('cloth1', w - .1, .12, z1 - z0 - .1, x, y0 + .2, (z0 + z1) / 2); box(D.fur ? 'fur' : 'cloth0', w - .06, .05, (z1 - z0) * .64, x, y0 + .29, z1 - (z1 - z0) * .34);
    box('cloth1', .46, .1, .28, x, y0 + .3, z0 + .24); for (const zz of [z0, z1]) box('wood', w - .04, top - y0, .06, x + .02, y0 + (top - y0) / 2, zz); box('wood', .06, .22, z1 - z0, xi - .03, y0 + .2, (z0 + z1) / 2);
    box('wood', .05, y0 - FLOOR, z1 - z0, xi - .025, (FLOOR + y0) / 2, (z0 + z1) / 2); box('dark', .02, .22, .5, xi + .005, FLOOR + .16, -.2); box('iron', .02, .05, .05, xi + .015, FLOOR + .16, .02);
    item('bunk', 'hold', xo, y0, z0 - .03, xi, top, z1 + .03); item('bunk front', 'hold', xi - .05, FLOOR, z0, xi, y0, z1); }
  { const z = -.2, w = .5, d = .85, hgt = .5, x = Math.min(onFloor(z - d / 2, w / 2), onFloor(z + d / 2, w / 2)) - .02; box('wood', w, hgt, d, x, FLOOR + hgt / 2, z); box('trim', w + .02, .06, d + .02, x, FLOOR + hgt - .03, z);
    for (const dz of [-.28, .28]) box('iron', w + .02, hgt + .02, .05, x, FLOOR + hgt / 2, z + dz); item('sea chest', 'hold', x - w / 2, FLOOR, z - d / 2, x + w / 2, FLOOR + hgt, z + d / 2); }
  { const z = 1.45, R = .26, x = Math.min(onFloor(z - R, R), onFloor(z + R, R)) - .02; cyl('wood', R * .9, R * .82, .7, x, FLOOR + .35, z, 14); for (const y of [.1, .6]) cyl('iron', R * .86 + .01, R * .86 + .01, .04, x, FLOOR + y, z, 14);
    item('water cask', 'hold', x - R, FLOOR, z - R, x + R, FLOOR + .7, z + R); }
  { const z = -.25, x = .05; cyl('metal', .09, .1, .22, x, beamY - .26, z, 8); { const g = new THREE.SphereGeometry(.05, 8, 6); g.translate(x, beamY - .27, z); add('lamp', g); } box('iron', .01, .14, .01, x, beamY - .08, z); lights.push({ x, y: beamY - .27, z });
    if (D.fur) { const g = new THREE.CircleGeometry(.55, 9); g.scale(1, 1.4, 1); g.rotateX(-Math.PI / 2); g.translate(.05, FLOOR + .006, -.2); add('fur', g); }
    else { box('rug0', .7, .01, 1.5, .05, FLOOR + .006, -.2); box('rug1', .5, .012, 1.2, .05, FLOOR + .008, -.2); } }
  const G = new THREE.Group(), hull = new THREE.Mesh(S.hull.geo, S.hull.mats); hull.name = 'base:hull'; G.add(hull); let tris = S.hull.tris, draws = S.hull.mats.length;
  for (const k in by) { const geo = mergeGeometries(by[k]), m = new THREE.Mesh(geo, M[k]); m.name = 'base:' + k; G.add(m); tris += geo.attributes.position.count / 3; draws++; }
  return { group: G, kind: 'sloop', tris: Math.round(tris), draws, items, hb, floor: FLOOR, beams, beamY, beamBottom: BEAM - BH / 2, deckUnder: DECK - .05,
    hold: { z0: hz0, z1: hz1 }, hatch: S.hatch, ladder: { foot, head }, lights, dress };
}
// ── the cutter's base (Session 1558; shipbase.js's cutterBase, Session 1148; #418 A): one hold, as the sloop's, but 0.4 m deeper, so a
// person stands up between the beams; inside the kit's cutter (mkCutter) built with her hatch open, the hatch aft of the mast at z -1.05.
// The hold runs from a bulkhead before the tiller's sweep (z -4.6) to one forward of the mast (3.2): the box bunk aft to port (rest and
// save), the chart table across from it with a stool and a candle, the sea chest to port forward of the hatch (the stash), the workbench
// with a vice and a rack of tools to starboard across from it (the joiner's bench below, E at it), the water cask and a barrel by the
// mast, two lanterns, the Mark's hide on the floor. Only the Mark's dress, as her hull.
//   PKIT.ships.cutterBase(o) -> as PKIT.ships.sloopBase, kind 'cutter'. Differences from the prototype: her hatch is the kit's, 1.22 m
//   square (the prototype's 1.1), so the carlings stand at its sides; the mast is an item (a solid in the game); the stool is tucked under
//   the chart table (the prototype's stood in the 0.22 m between the table and the berth's front, closing the hold aft of the ladder),
//   and the table, 1.0 m long, stands forward of the ladder's foot beside the hatch (z -1.9 to -0.9), its lantern from the carling over
//   it: the floor is 1.3 m across, and at the prototype's z -3.3 to -2.2 the table left 0.64 m to the berth's front, a body's width;
//   rig and tiller left out.
function cutterBase(o = {}) {
  const dress = 'mark', D = SHIP_BASE_DRESS[dress], M = shipBaseMats(dress);
  const S = mkCutter({ open: true, hatchZ: -1.05 }), DECK = 1.0, TH = .04, by = {}, items = [], lights = [];
  const sect = (z, u) => S.at(z).sect(u);
  const hb = (z, y) => { let lo = 0, hi = 1; for (let k = 0; k < 30; k++) { const m = (lo + hi) / 2; if (sect(z, m)[1] < y) lo = m; else hi = m; } return sect(z, lo)[0] - TH - .03; };
  const add = (key, g) => { const x = g.index ? g.toNonIndexed() : g; for (const k of Object.keys(x.attributes)) if (!['position', 'normal', 'uv'].includes(k)) x.deleteAttribute(k);
    if (!x.attributes.uv) worldUV(x, .8); (by[key] || (by[key] = [])).push(x); return x; };
  const box = (key, w, h, d, x, y, z, ry = 0) => { const g = new THREE.BoxGeometry(w, h, d); worldUV(g, .8); if (ry) g.rotateY(ry); g.translate(x, y, z); return add(key, g); };
  const cyl = (key, r0, r1, h, x, y, z, n = 12) => { const g = new THREE.CylinderGeometry(r0, r1, h, n); worldUV(g, .8); g.translate(x, y, z); return add(key, g); };
  const item = (name, place, x0, y0, z0, x1, y1, z1) => { items.push({ name, place, box: [x0, y0, z0, x1, y1, z1].map(v => +v.toFixed(3)) }); };
  const hz0 = -4.6, hz1 = 3.2, mid = -1.0; let FLOOR = -1; for (let y = -1.3; y < .2; y += .01) if (hb(mid, y) >= .7) { FLOOR = +y.toFixed(2); break; }
  const BEAM = DECK - .15, BH = .14, beamY = BEAM - BH / 2, H = S.hatch;
  { const PW = .2; for (let x = -1.6 + PW / 2; x < 1.6; x += PW) { const zz = []; for (let z = hz0; z <= hz1 + 1e-6; z += .1) if (hb(z, FLOOR) - .02 >= Math.abs(x) + PW / 2) zz.push(z); if (zz.length < 2) continue;
      box('plank', PW - .01, .05, zz[zz.length - 1] - zz[0], x, FLOOR - .025, (zz[0] + zz[zz.length - 1]) / 2); } }
  for (let z = hz0 + .3; z <= hz1 - .24; z += .75) for (const e of [1, -1]) { const n = 5; for (let k = 0; k < n; k++) { const ya = FLOOR + (DECK - FLOOR - .05) * k / n, yb = FLOOR + (DECK - FLOOR - .05) * (k + 1) / n, xa = hb(z, ya) - .07, xb = hb(z, yb) - .07;
      const L = Math.hypot(xb - xa, yb - ya), g = new THREE.BoxGeometry(.12, L + .02, .14); worldUV(g, .8); g.rotateZ(-e * Math.atan2(xb - xa, yb - ya)); g.translate(e * (xa + xb) / 2, (ya + yb) / 2, z); add('dark', g); } }
  // the beams, none between -2.45 and -0.35 (the ladder and the hatch), where the carlings carry the deck either side of the opening
  const beams = [-4.0, -3.2, -2.45, -.35, .5, 1.2, 2.0, 2.75];
  for (const z of beams) { const w = 2 * (hb(z, BEAM) - .02); box('dark', w, BH, .16, 0, BEAM, z); for (const e of [1, -1]) box('dark', .12, .36, .12, e * (hb(z, BEAM - .25) - .08), BEAM - .22, z); }
  for (const e of [1, -1]) box('dark', .12, .12, 2.1 - .16, e * (H.x1 + .11), BEAM + .01, -1.4);
  for (const zb of [hz0, hz1]) { const sh = new THREE.Shape(), ys = []; for (let k = 0; k <= 10; k++) ys.push(FLOOR - .05 + (DECK - FLOOR) * k / 10);
    sh.moveTo(-hb(zb, ys[0]), ys[0]); for (const y of ys) sh.lineTo(-hb(zb, y), y); for (const y of [...ys].reverse()) sh.lineTo(hb(zb, y), y); sh.lineTo(-hb(zb, ys[0]), ys[0]);
    const g = new THREE.ExtrudeGeometry(sh, { depth: .05, bevelEnabled: false }); g.translate(0, 0, zb - (zb < 0 ? .05 : 0)); worldUV(g, .8); add('wood', g);
    for (let x = -1.8; x <= 1.8; x += .3) if (hb(zb, (FLOOR + DECK) / 2) > Math.abs(x) + .05 && hb(zb, FLOOR) > Math.abs(x) + .05) box('dark', .03, DECK - FLOOR - .05, .02, x, (FLOOR + DECK) / 2, zb + (zb < 0 ? .01 : -.01)); }
  // the ladder from the floor aft up through the hatch to its coaming's aft side, steep (her hold is deep and the beam aft of it is close)
  const head = [0, DECK + .3, H.z0 + .05], rise = head[1] - FLOOR, foot = [0, FLOOR, +(head[2] - rise * .32).toFixed(2)];
  { const d = new THREE.Vector3(0, head[1] - foot[1], head[2] - foot[2]), L = d.length(), a = Math.atan2(d.z, d.y);
    for (const e of [-.24, .24]) { const g = new THREE.BoxGeometry(.06, L, .1); worldUV(g, .8); g.rotateX(a); g.translate(e, (foot[1] + head[1]) / 2, (foot[2] + head[2]) / 2); add('wood', g); }
    for (let k = 1; k * .28 < rise - .1; k++) { const f = k * .28 / rise; box('wood', .46, .04, .12, 0, foot[1] + rise * f, foot[2] + (head[2] - foot[2]) * f); }
    item('ladder', 'hatch', -.27, FLOOR, foot[2] - .05, .27, DECK + .3, head[2] + .05); }
  // the mast through the hold to its step on the keelson
  { const mz = S.mast[1]; cyl('dark', .15, .15, DECK - FLOOR, 0, (FLOOR + DECK) / 2, mz, 12); box('dark', .26, .2, 1.1, 0, FLOOR + .1, mz); item('mast', 'hold', -.15, FLOOR, mz - .15, .15, DECK, mz + .15); }
  const onFloor = (z, half) => hb(z, FLOOR) - .04 - half, inAt = (z0, z1, y) => Math.min(hb(z0, y), hb(z1, y));
  { // the berth along the port side aft, raised against the side as the sloop's, with the Mark's furs and a locker in its board front
    const z0 = -4.35, z1 = -2.55, w = .72, y0 = FLOOR + .38, top = y0 + .62, xo = -(inAt(z0, z1, y0) - .02), x = xo + w / 2, xi = xo + w;
    box('wood', w, .14, z1 - z0, x, y0 + .07, (z0 + z1) / 2); box('cloth1', w - .1, .12, z1 - z0 - .1, x, y0 + .2, (z0 + z1) / 2); box(D.fur ? 'fur' : 'cloth0', w - .06, .05, (z1 - z0) * .64, x, y0 + .29, z1 - (z1 - z0) * .34);
    box('cloth1', .46, .1, .28, x, y0 + .3, z0 + .24); for (const zz of [z0, z1]) box('wood', w - .04, top - y0, .06, x + .02, y0 + (top - y0) / 2, zz); box('wood', .06, .22, z1 - z0, xi - .03, y0 + .2, (z0 + z1) / 2);
    box('wood', .05, y0 - FLOOR, z1 - z0, xi - .025, (FLOOR + y0) / 2, (z0 + z1) / 2); box('dark', .02, .22, .5, xi + .005, FLOOR + .19, -3.45); box('iron', .02, .05, .05, xi + .015, FLOOR + .19, -3.22);
    item('bunk', 'hold', xo, y0, z0 - .03, xi, top, z1 + .03); item('bunk front', 'hold', xi - .05, FLOOR, z0, xi, y0, z1); }
  { // the chart table (OG-027's navigation table) across from the berth: a top on two legs, cleats on the frames, a chart, the log,
    // dividers and a candle; a stool
    const z0 = -1.9, z1 = -.9, d = .62, ht = .78, ty = FLOOR + ht, xo = inAt(z0, z1, ty - .1) - .02, xi = Math.min(xo - d, inAt(z0, z1, FLOOR) - .14), D2 = xo - xi, x = (xo + xi) / 2;
    box('wood', D2, .06, z1 - z0, x, ty, (z0 + z1) / 2); for (const zz of [z0 + .07, z1 - .07]) box('dark', .06, ht - .03, .06, xi + .07, FLOOR + (ht - .03) / 2, zz);
    for (const zz of [z0 + .1, z1 - .1]) box('dark', .3, .06, .06, xo - .17, ty - .07, zz);
    box('paper', .44, .004, .7, x - .02, ty + .033, (z0 + z1) / 2, .1); box('dark', .2, .05, .28, x + .14, ty + .055, z0 + .2); { const g = new THREE.CylinderGeometry(.006, .006, .18, 4); g.rotateX(1.2); g.translate(x - .05, ty + .04, (z0 + z1) / 2 + .1); add('metal', g); }
    cyl('metal', .05, .06, .03, x + .12, ty + .045, z1 - .15, 8); cyl('paper', .02, .02, .1, x + .12, ty + .11, z1 - .15, 8); { const g = new THREE.SphereGeometry(.018, 6, 5); g.translate(x + .12, ty + .175, z1 - .15); add('lamp', g); }
    cyl('dark', .17, .16, .45, xi + .28, FLOOR + .225, (z0 + z1) / 2, 10);
    item('chart table', 'hold', xi, ty - .1, z0, xo, ty + .2, z1); item('chart table legs', 'hold', xi + .04, FLOOR, z0 + .04, xi + .1, ty, z1 - .04); item('stool', 'hold', xi + .11, FLOOR, (z0 + z1) / 2 - .17, xi + .45, FLOOR + .45, (z0 + z1) / 2 + .17); }
  { // the sea chest to port forward of the hatch, across from the bench, iron-bound, the Mark's red on its lid
    const z = .1, w = .5, d = .8, hgt = .5, x = -(Math.min(onFloor(z - d / 2, w / 2), onFloor(z + d / 2, w / 2)) - .02); box('wood', w, hgt, d, x, FLOOR + hgt / 2, z); box('trim', w + .02, .06, d + .02, x, FLOOR + hgt - .03, z);
    for (const dz of [-.26, .26]) box('iron', w + .02, hgt + .02, .05, x, FLOOR + hgt / 2, z + dz); item('sea chest', 'hold', x - w / 2, FLOOR, z - d / 2, x + w / 2, FLOOR + hgt, z + d / 2); }
  { // the workbench along the starboard side forward of the hatch: a top on legs, cleats on the frames, a vice, a rack of tools over it
    const z0 = -.2, z1 = 1.1, dpt = .6, ht = .85, ty = FLOOR + ht, xo = inAt(z0, z1, ty - .1) - .02, xi = Math.min(xo - dpt, inAt(z0, z1, FLOOR) - .14), D2 = xo - xi, x = (xo + xi) / 2;
    box('wood', D2, .08, z1 - z0, x, ty, (z0 + z1) / 2); for (const zz of [z0 + .08, z1 - .08]) box('dark', .08, ht - .04, .08, xi + .08, FLOOR + (ht - .04) / 2, zz);
    for (const zz of [z0 + .1, z1 - .1]) box('dark', .3, .08, .06, xo - .17, ty - .08, zz); box('dark', .06, .05, z1 - z0 - .2, xi + .08, FLOOR + .25, (z0 + z1) / 2);
    box('iron', .16, .14, .22, xi + .1, ty + .11, z1 - .2); box('iron', .32, .04, .04, xi + .1, ty + .11, z1 - .2);
    for (const [dx, dz, w] of [[.05, .3, .4], [-.08, .8, .3]]) box('plank', w, .04, .12, x + dx, ty + .06, z0 + dz);
    const ry = ty + .45, rx = inAt(z0 + .1, z1 - .1, ry - .25) - .04; box('dark', .04, .5, 1.1, rx, ry, (z0 + z1) / 2); for (let k = 0; k < 4; k++) { const zz = z0 + .25 + k * .27; box('iron', .03, .3, .03, rx - .05, ry - .05, zz); box('wood', .03, .12, .05, rx - .05, ry + .15, zz); }
    item('workbench', 'hold', xi, ty - .1, z0, xo, ty + .2, z1); item('workbench legs', 'hold', xi + .04, FLOOR, z0 + .04, xi + .12, ty, z1 - .04); item('tool rack', 'hold', rx - .08, ry - .25, z0 + .1, rx + .02, ry + .25, z1 - .1); }
  { // the stores forward by the mast: the water cask to port, a barrel of salt meat to starboard, both in chocks
    for (const [name, e, z] of [['water cask', -1, 2.45], ['barrel', 1, 2.45]]) { const R = .25, x = e * (Math.min(onFloor(z - R, R), onFloor(z + R, R)) - .02);
      cyl('wood', R * .9, R * .82, .7, x, FLOOR + .35, z, 14); for (const y of [.1, .6]) cyl('iron', R * .86 + .01, R * .86 + .01, .04, x, FLOOR + y, z, 14); box('dark', .08, .06, .5, x - e * .2, FLOOR + .03, z);
      item(name, 'hold', x - R, FLOOR, z - R, x + R, FLOOR + .7, z + R); } }
  { // two lanterns, over the chart table and over the bench; the Mark's hide on the floor between the berth and the table
    for (const [x, z] of [[.72, -1.4], [.1, .85]]) { cyl('metal', .09, .1, .22, x, beamY - .26, z, 8); const g = new THREE.SphereGeometry(.05, 8, 6); g.translate(x, beamY - .27, z); add('lamp', g); box('iron', .01, .14, .01, x, beamY - .08, z); lights.push({ x, y: beamY - .27, z }); }
    const g = new THREE.CircleGeometry(.5, 9); g.scale(1, 1.5, 1); g.rotateX(-Math.PI / 2); g.translate(0, FLOOR + .006, -3.45); add('fur', g); }
  if (!M.paper) M.paper = new THREE.MeshStandardMaterial({ color: 0xd8ccaa, roughness: 1 });
  const G = new THREE.Group(), hull = new THREE.Mesh(S.hull.geo, S.hull.mats); hull.name = 'base:hull'; G.add(hull); let tris = S.hull.tris, draws = S.hull.mats.length;
  for (const k in by) { const geo = mergeGeometries(by[k]), m = new THREE.Mesh(geo, M[k]); m.name = 'base:' + k; G.add(m); tris += geo.attributes.position.count / 3; draws++; }
  return { group: G, kind: 'cutter', tris: Math.round(tris), draws, items, hb, floor: FLOOR, beams, beamY, beamBottom: BEAM - BH / 2, deckUnder: DECK - .05,
    hold: { z0: hz0, z1: hz1 }, hatch: H, ladder: { foot, head }, lights, dress };
}
// ── the caravel's base (Session 1564; shipbase.js's caravelBase, Session 1149; #418 A): her hold under the main deck, inside the kit's
// caravel built with her hatch open (z 2.2 to 3.4, between the main mast and the fore). The hold runs from a bulkhead just forward of the
// cabin's (z -4.0) to one aft of the stem (5.8), 1.86 m between the beams: the workbench to port aft with its vice and a rack of tools
// (the joiner's bench below, E at it), the alchemist's table to starboard across from it (the still, a retort, a rack of phials), the
// island's rug between them, two iron-bound chests staggered aft of the ladder (the stash is the starboard one, by the ladder's foot),
// four barrels in chocks forward of the hatch, the main and fore masts through it to their steps, two lanterns. Her cabin under the
// sterncastle, the base's other room, is on the main deck, walked into from the waist (Session 1544), and is not part of this.
// Only Aurenne's dress, as her hull.
//   PKIT.ships.caravelBase(o) -> as PKIT.ships.sloopBase, kind 'caravel', with masts ([[z, rake]...]) and mastZ(mz, rake, y).
//   Differences from the prototype: the ship's rigs and wheel are left out (nothing of them shows below); the masts are items (solids in
//   the game); the starboard chest stands beside the main mast at z 0.5, not 0, so a body passes between them and on to the bench; the cabin and the galley
//   on deck are not built here.
function caravelBase(o = {}) {
  const dress = 'aurenne', D = SHIP_BASE_DRESS[dress], M = shipBaseMats(dress);
  const S = mkCaravel({ open: true }), DECK = 1.0, TH = .045, by = {}, items = [], lights = [];
  const sect = (z, u) => S.at(z).sect(u), keelAt = z => S.at(z).k;
  const hb = (z, y) => { let lo = 0, hi = 1; for (let k = 0; k < 30; k++) { const m = (lo + hi) / 2; if (sect(z, m)[1] < y) lo = m; else hi = m; } return sect(z, lo)[0] - TH - .03; };
  const add = (key, g) => { const x = g.index ? g.toNonIndexed() : g; for (const k of Object.keys(x.attributes)) if (!['position', 'normal', 'uv'].includes(k)) x.deleteAttribute(k);
    if (!x.attributes.uv) worldUV(x, .8); (by[key] || (by[key] = [])).push(x); return x; };
  const box = (key, w, h, d, x, y, z, ry = 0) => { const g = new THREE.BoxGeometry(w, h, d); worldUV(g, .8); if (ry) g.rotateY(ry); g.translate(x, y, z); return add(key, g); };
  const cyl = (key, r0, r1, h, x, y, z, n = 12) => { const g = new THREE.CylinderGeometry(r0, r1, h, n); worldUV(g, .8); g.translate(x, y, z); return add(key, g); };
  const item = (name, place, x0, y0, z0, x1, y1, z1) => { items.push({ name, place, box: [x0, y0, z0, x1, y1, z1].map(v => +v.toFixed(3)) }); };
  // the masts, each a lateen's raked 4° forward from its step (mkCaravel)
  const R4 = Math.tan(4 * Math.PI / 180), masts = [5.0, .8, -7.2].map(mz => [mz, R4]);
  const mastZ = (mz, rk, y) => mz + (y - (keelAt(mz) + .1)) * rk;
  const mastThrough = (mz, rk, y0, y1, r) => { const g = new THREE.CylinderGeometry(r, r, y1 - y0, 12); worldUV(g, .8); g.rotateX(Math.atan(rk)); g.translate(0, (y0 + y1) / 2, mastZ(mz, rk, (y0 + y1) / 2)); add('dark', g); };
  const hz0 = -4.0, hz1 = 5.8, mid = .5; let FLOOR = -1; for (let y = -1.2; y < .2; y += .01) if (hb(mid, y) >= .75) { FLOOR = +y.toFixed(2); break; }
  const BEAM = DECK - .15, BH = .14, beamY = BEAM - BH / 2, H = S.hatch;
  { const PW = .22; for (let x = -2 + PW / 2; x < 2; x += PW) { const zz = []; for (let z = hz0; z <= hz1 + 1e-6; z += .1) if (hb(z, FLOOR) - .02 >= Math.abs(x) + PW / 2) zz.push(z); if (zz.length < 2) continue;
      box('plank', PW - .01, .05, zz[zz.length - 1] - zz[0], x, FLOOR - .025, (zz[0] + zz[zz.length - 1]) / 2); } }
  for (let z = hz0 + .3; z <= hz1 - .24; z += .75) for (const e of [1, -1]) { const n = 5; for (let k = 0; k < n; k++) { const ya = FLOOR + (DECK - FLOOR - .05) * k / n, yb = FLOOR + (DECK - FLOOR - .05) * (k + 1) / n, xa = hb(z, ya) - .07, xb = hb(z, yb) - .07;
      const L = Math.hypot(xb - xa, yb - ya), g = new THREE.BoxGeometry(.13, L + .02, .15); worldUV(g, .8); g.rotateZ(-e * Math.atan2(xb - xa, yb - ya)); g.translate(e * (xa + xb) / 2, (ya + yb) / 2, z); add('dark', g); } }
  // the ladder from the floor aft up through the hatch to its coaming's aft side
  const head = [0, DECK + .3, H.z0 + .05], rise = head[1] - FLOOR, foot = [0, FLOOR, +(head[2] - rise * .36).toFixed(2)];
  { const d = new THREE.Vector3(0, head[1] - foot[1], head[2] - foot[2]), L = d.length(), a = Math.atan2(d.z, d.y);
    for (const e of [-.25, .25]) { const g = new THREE.BoxGeometry(.06, L, .1); worldUV(g, .8); g.rotateX(a); g.translate(e, (foot[1] + head[1]) / 2, (foot[2] + head[2]) / 2); add('wood', g); }
    for (let k = 1; k * .28 < rise - .1; k++) { const f = k * .28 / rise; box('wood', .48, .04, .12, 0, foot[1] + rise * f, foot[2] + (head[2] - foot[2]) * f); }
    item('ladder', 'hatch', -.28, FLOOR, foot[2] - .05, .28, DECK + .3, head[2] + .05); }
  // the beams about every 0.85 m, none over the ladder and the hatch, where carlings either side of the opening carry the deck
  const beams = [-3.7, -2.85, -2.0, -1.15, -.3, .3, 1.25, 3.65, 4.4, 5.3].filter(z => z < foot[2] - .15 || z > H.z1 + .2);
  for (const z of beams) { const w = 2 * (hb(z, BEAM) - .02); box('dark', w, BH, .16, 0, BEAM, z); for (const e of [1, -1]) box('dark', .12, .36, .12, e * (hb(z, BEAM - .25) - .08), BEAM - .22, z); }
  { const za = Math.max(...beams.filter(z => z < foot[2])), zf = Math.min(...beams.filter(z => z > H.z1)); for (const e of [1, -1]) box('dark', .12, .12, zf - za - .16, e * (H.x1 + .11), BEAM + .01, (za + zf) / 2); }
  for (const zb of [hz0, hz1]) { const sh = new THREE.Shape(), ys = []; for (let k = 0; k <= 10; k++) ys.push(FLOOR - .05 + (DECK - FLOOR) * k / 10);
    sh.moveTo(-hb(zb, ys[0]), ys[0]); for (const y of ys) sh.lineTo(-hb(zb, y), y); for (const y of [...ys].reverse()) sh.lineTo(hb(zb, y), y); sh.lineTo(-hb(zb, ys[0]), ys[0]);
    const g = new THREE.ExtrudeGeometry(sh, { depth: .05, bevelEnabled: false }); g.translate(0, 0, zb - (zb < 0 ? .05 : 0)); worldUV(g, .8); add('wood', g);
    for (let x = -2.4; x <= 2.4; x += .3) if (hb(zb, (FLOOR + DECK) / 2) > Math.abs(x) + .05 && hb(zb, FLOOR) > Math.abs(x) + .05) box('dark', .03, DECK - FLOOR - .05, .02, x, (FLOOR + DECK) / 2, zb + (zb < 0 ? .01 : -.01)); }
  // the main and fore masts through the hold to their steps
  for (const [mz, rk] of masts.slice(0, 2)) { const r = mz === .8 ? .18 : .15, zf = mastZ(mz, rk, FLOOR); mastThrough(mz, rk, FLOOR, DECK, r); box('dark', .28, .2, 1.2, 0, FLOOR + .1, zf);
    item('mast', 'hold', -r, FLOOR, Math.min(zf, mastZ(mz, rk, DECK)) - r, r, DECK, Math.max(zf, mastZ(mz, rk, DECK)) + r); }
  const onFloor = (z, half) => hb(z, FLOOR) - .04 - half, inAt = (z0, z1, y) => Math.min(hb(z0, y), hb(z1, y));
  // a top on cleats at the side and two legs at its inner edge, the inner edge brought in over the floor (the hull is a V below the waterline)
  const sideTop = (e, z0, z1, d, ht, th) => { const ty = FLOOR + ht, xo = inAt(z0, z1, ty - .1) - .02, xi = Math.min(xo - d, inAt(z0, z1, FLOOR) - .14), x = e * (xo + xi) / 2;
    box('wood', xo - xi, th, z1 - z0, x, ty, (z0 + z1) / 2); for (const zz of [z0 + .08, z1 - .08]) { box('dark', .07, ht - .04, .07, e * (xi + .08), FLOOR + (ht - .04) / 2, zz); box('dark', .3, .07, .06, e * (xo - .17), ty - .08, zz); }
    box('dark', .06, .05, z1 - z0 - .2, e * (xi + .08), FLOOR + .25, (z0 + z1) / 2); return { xo, xi, ty, x }; };
  const sideItem = (name, e, t, z0, z1, top) => { const a = [e * t.xi, e * t.xo].sort((p, q) => p - q); item(name, 'hold', a[0], t.ty - .1, z0, a[1], t.ty + top, z1);
    const b = [e * (t.xi + .04), e * (t.xi + .12)].sort((p, q) => p - q); item(name + ' legs', 'hold', b[0], FLOOR, z0 + .04, b[1], t.ty, z1 - .04); };
  { // the workbench (crafting) to port aft, a vice at its after end, a rack of tools on the frames over it
    const z0 = -3.7, z1 = -2.1, t = sideTop(-1, z0, z1, .6, .85, .08), x = t.x;
    box('iron', .16, .14, .22, -(t.xi + .1), t.ty + .11, z0 + .2); box('iron', .32, .04, .04, -(t.xi + .1), t.ty + .11, z0 + .2);
    for (const [dx, dz, w] of [[.05, .5, .4], [-.08, 1.1, .3]]) box('plank', w, .04, .12, x + dx, t.ty + .06, z0 + dz);
    const ry = t.ty + .45, rx = -(inAt(z0 + .1, z1 - .1, ry - .25) - .04); box('dark', .04, .5, 1.3, rx, ry, (z0 + z1) / 2); for (let k = 0; k < 5; k++) { const zz = z0 + .3 + k * .25; box('iron', .03, .3, .03, rx + .05, ry - .05, zz); box('wood', .03, .12, .05, rx + .05, ry + .15, zz); }
    sideItem('workbench', -1, t, z0, z1, .2); item('tool rack', 'hold', rx - .02, ry - .25, z0 + .1, rx + .08, ry + .25, z1 - .1); }
  { // the alchemist's table (alchemy) to starboard across from it: the still, a retort, a rack of phials
    const z0 = -3.5, z1 = -2.3, t = sideTop(1, z0, z1, .6, .82, .06), x = t.x, z = (z0 + z1) / 2;
    cyl('copper', .17, .2, .3, x + .05, t.ty + .18, z - .3, 14); { const g = new THREE.SphereGeometry(.15, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2); g.translate(x + .05, t.ty + .33, z - .3); add('copper', g); }
    { const g = new THREE.CylinderGeometry(.02, .02, .5, 6); g.rotateX(1.1); g.translate(x + .05, t.ty + .5, z - .1); add('copper', g); }
    { const g = new THREE.SphereGeometry(.09, 10, 8); g.translate(x - .1, t.ty + .12, z + .2); add('glass', g); } cyl('glass', .02, .025, .22, x - .1, t.ty + .27, z + .2, 6);
    box('wood', .14, .1, .5, t.xo - .1, t.ty + .08, z + .25); for (let k = 0; k < 4; k++) cyl('glass', .02, .02, .12, t.xo - .1, t.ty + .16, z + .07 + k * .12, 6);
    sideItem('alchemy table', 1, t, z0, z1, .6); }
  // Aurenne's rug between the bench and the table
  box('rug0', .7, .01, 1.4, 0, FLOOR + .006, -2.9); box('rug1', .5, .012, 1.1, 0, FLOOR + .008, -2.9);
  // the two chests (the stash) by and aft of the main mast, staggered so the way between the hatch and the bench stays open: 0.9 m between
  // their corners fore and aft (the prototype's starboard chest at z 0 left 0.55, under a body's width)
  for (const [e, z] of [[-1, -1.2], [1, .5]]) { const w = .5, d = .8, hgt = .5, x = e * (Math.min(onFloor(z - d / 2, w / 2), onFloor(z + d / 2, w / 2)) - .02); box('wood', w, hgt, d, x, FLOOR + hgt / 2, z); box('trim', w + .02, .06, d + .02, x, FLOOR + hgt - .03, z);
    for (const dz of [-.26, .26]) box('iron', w + .02, hgt + .02, .05, x, FLOOR + hgt / 2, z + dz); item(e > 0 ? 'sea chest' : 'chest', 'hold', x - w / 2, FLOOR, z - d / 2, x + w / 2, FLOOR + hgt, z + d / 2); }
  // the stores forward of the hatch: barrels in chocks both sides
  for (const [e, z] of [[1, 3.9], [-1, 3.9], [1, 4.5], [-1, 4.5]]) { const R = .25, x = e * (Math.min(onFloor(z - R, R), onFloor(z + R, R)) - .02);
    cyl('wood', R * .9, R * .82, .7, x, FLOOR + .35, z, 14); for (const y of [.1, .6]) cyl('iron', R * .86 + .01, R * .86 + .01, .04, x, FLOOR + y, z, 14); item('barrel', 'hold', x - R, FLOOR, z - R, x + R, FLOOR + .7, z + R); }
  for (const z of [-2.9, 4.0]) { const x = .35; cyl('metal', .09, .1, .22, x, beamY - .26, z, 8); const g = new THREE.SphereGeometry(.05, 8, 6); g.translate(x, beamY - .27, z); add('lamp', g); box('iron', .01, .14, .01, x, beamY - .08, z); lights.push({ x, y: beamY - .27, z }); }
  if (!M.copper) { M.copper = new THREE.MeshStandardMaterial({ color: 0xb06a3c, roughness: .35, metalness: .8 }); M.glass = new THREE.MeshStandardMaterial({ color: 0x7aa08a, roughness: .1 }); }
  const G = new THREE.Group(), hull = new THREE.Mesh(S.hull.geo, S.hull.mats); hull.name = 'base:hull'; G.add(hull); let tris = S.hull.tris, draws = S.hull.mats.length;
  for (const k in by) { const geo = mergeGeometries(by[k]), m = new THREE.Mesh(geo, M[k]); m.name = 'base:' + k; G.add(m); tris += geo.attributes.position.count / 3; draws++; }
  return { group: G, kind: 'caravel', tris: Math.round(tris), draws, items, hb, floor: FLOOR, beams, beamY, beamBottom: BEAM - BH / 2, deckUnder: DECK - .05,
    hold: { z0: hz0, z1: hz1 }, hatch: H, ladder: { foot, head }, lights, masts, mastZ, dress };
}
// ── the cog's base (Session 1578; shipbase.js's shipBase, Session 1099; #418 A): her hold under the main deck, inside the kit's cog built
// with her hatch open (z -3.0 to -1.2, aft of the mast). The hold runs from a bulkhead under the aftcastle's (z -5.5) to one under the
// forecastle's edge (5.5), its floor of ceiling planks at -0.9, the frames every 0.75 m, the beams every metre at 0.85 with carlings either
// side of the hatch; the ladder from the floor up through the hatch, its foot at the hatch's after end; the mast through it to its step;
// barrels in chocks to port aft, three laid on them, the alchemist's table to starboard aft (the still, a retort, a rack of phials), the
// workbench to port forward with its vice and a rack of tools (the joiner's bench below, E at it), crates and sacks to starboard across
// from it, two iron-bound chests by the fore bulkhead (the stash the starboard one), two lanterns, the island's rug (the Mark's hide).
// Her cabin under the aftcastle and the galley under the forecastle, the base's other rooms, are on the main deck and not part of this.
//   PKIT.ships.cogBase(o) -> as PKIT.ships.caravelBase, kind 'cog'. o.dress as the cog's.
//   Differences from the prototype: the ship's rig and wheel are left out (nothing of them shows below); the mast is an item (a solid in
//   the game), raked 4° in Aurenne's dress as her hull's; the starboard chest is the 'sea chest' (the stash); the cabin and the galley are
//   not built here.
function cogBase(o = {}) {
  const dress = SHIP_BASE_DRESS[o.dress] ? o.dress : 'gatelands', D = SHIP_BASE_DRESS[dress], M = shipBaseMats(dress);
  const S = mkCog({ open: true, dress }), DECK = 1.0, TH = .04, by = {}, items = [], lights = [];
  const sect = (z, u) => S.at(z).sect(u), keelAt = z => S.at(z).k;
  const hb = (z, y) => { let lo = 0, hi = 1; for (let k = 0; k < 30; k++) { const m = (lo + hi) / 2; if (sect(z, m)[1] < y) lo = m; else hi = m; } return sect(z, lo)[0] - TH - .03; };
  const add = (key, g) => { const x = g.index ? g.toNonIndexed() : g; for (const k of Object.keys(x.attributes)) if (!['position', 'normal', 'uv'].includes(k)) x.deleteAttribute(k);
    if (!x.attributes.uv) worldUV(x, .8); (by[key] || (by[key] = [])).push(x); return x; };
  const box = (key, w, h, d, x, y, z, ry = 0) => { const g = new THREE.BoxGeometry(w, h, d); worldUV(g, .8); if (ry) g.rotateY(ry); g.translate(x, y, z); return add(key, g); };
  const cyl = (key, r0, r1, h, x, y, z, n = 12) => { const g = new THREE.CylinderGeometry(r0, r1, h, n); worldUV(g, .8); g.translate(x, y, z); return add(key, g); };
  const item = (name, place, x0, y0, z0, x1, y1, z1) => { items.push({ name, place, box: [x0, y0, z0, x1, y1, z1].map(v => +v.toFixed(3)) }); };
  if (!M.copper) { M.copper = new THREE.MeshStandardMaterial({ color: 0xb06a3c, roughness: .35, metalness: .8 }); M.glass = new THREE.MeshStandardMaterial({ color: 0x7aa08a, roughness: .1 }); }
  const FLOOR = -.9, BEAM = .85, BH = .18, beamY = BEAM - BH / 2, hz0 = -5.5, hz1 = 5.5, H = S.hatch, HZ = (H.z0 + H.z1) / 2;
  { const PW = .22; for (let x = -3 + PW / 2; x < 3; x += PW) { const zz = []; for (let z = hz0; z <= hz1 + 1e-6; z += .1) if (hb(z, FLOOR) - .02 >= Math.abs(x) + PW / 2) zz.push(z); if (zz.length < 2) continue;
      box('plank', PW - .01, .05, zz[zz.length - 1] - zz[0], x, FLOOR - .025, (zz[0] + zz[zz.length - 1]) / 2); } }
  for (let z = -5.25; z <= 5.26; z += .75) for (const e of [1, -1]) { const n = 7; for (let k = 0; k < n; k++) { const ya = FLOOR + (DECK - FLOOR - .05) * k / n, yb = FLOOR + (DECK - FLOOR - .05) * (k + 1) / n, xa = hb(z, ya) - .08, xb = hb(z, yb) - .08;
      const L = Math.hypot(xb - xa, yb - ya), g = new THREE.BoxGeometry(.14, L + .02, .16); worldUV(g, .8); g.rotateZ(-e * Math.atan2(xb - xa, yb - ya)); g.translate(e * (xa + xb) / 2, (ya + yb) / 2, z); add('dark', g); } }
  // the deck beams, none over the hatch, where the carlings either side of it carry the deck; the knees at the beams' ends
  const beams = [-5.0, -4.0, H.z0 - .06, H.z1 + .06, 0, 1.0, 2.0, 3.0, 4.0, 5.0];
  for (const z of beams) { const w = 2 * (hb(z, BEAM) - .02); box('dark', w, BH, .2, 0, BEAM, z); for (const e of [1, -1]) box('dark', .16, .5, .16, e * (hb(z, BEAM - .35) - .1), BEAM - .3, z); }
  for (const e of [1, -1]) box('dark', .14, .14, H.z1 - H.z0 + .12, e * (H.x1 + .06), BEAM + .02, HZ);
  for (const zb of [hz0, hz1]) { const sh = new THREE.Shape(), ys = []; for (let k = 0; k <= 12; k++) ys.push(FLOOR - .05 + (DECK - FLOOR) * k / 12);
    sh.moveTo(-hb(zb, ys[0]), ys[0]); for (const y of ys) sh.lineTo(-hb(zb, y), y); for (const y of [...ys].reverse()) sh.lineTo(hb(zb, y), y); sh.lineTo(-hb(zb, ys[0]), ys[0]);
    const g = new THREE.ExtrudeGeometry(sh, { depth: .05, bevelEnabled: false }); g.translate(0, 0, zb - (zb < 0 ? .05 : 0)); worldUV(g, .8); add('wood', g);
    for (let x = -2.4; x <= 2.4; x += .3) if (hb(zb, 0) > Math.abs(x) + .05 && hb(zb, FLOOR) > Math.abs(x) + .05) box('dark', .03, DECK - FLOOR - .05, .02, x, (FLOOR + DECK) / 2, zb + (zb < 0 ? .01 : -.01)); }
  // the ladder from the floor at the hatch's after end up through it to the coaming's forward side
  const foot = [0, FLOOR, H.z0 + .05], head = [0, DECK + .3, H.z1 - .15];
  { const d = new THREE.Vector3(0, head[1] - foot[1], head[2] - foot[2]), L = d.length(), a = Math.atan2(d.z, d.y);
    for (const e of [-.26, .26]) { const g = new THREE.BoxGeometry(.06, L, .1); worldUV(g, .8); g.rotateX(a); g.translate(e, (foot[1] + head[1]) / 2, (foot[2] + head[2]) / 2); add('wood', g); }
    for (let k = 1; k * .28 < head[1] - foot[1] - .1; k++) { const f = k * .28 / (head[1] - foot[1]); box('wood', .5, .04, .12, 0, foot[1] + (head[1] - foot[1]) * f, foot[2] + (head[2] - foot[2]) * f); }
    item('ladder', 'hatch', -.3, FLOOR, foot[2], .3, DECK + .3, head[2]); }
  // the mast through the hold to its step on the keelson (raked 4° forward under Aurenne's lateen)
  const MZ = S.mast[1], rk = dress === 'aurenne' ? Math.tan(4 * Math.PI / 180) : 0, mastZ = y => MZ + (y - (keelAt(MZ) + .1)) * rk;
  { const g = new THREE.CylinderGeometry(.2, .2, DECK - FLOOR, 14); worldUV(g, .8); g.rotateX(Math.atan(rk)); g.translate(0, (FLOOR + DECK) / 2, mastZ((FLOOR + DECK) / 2)); add('dark', g);
    box('dark', .3, .25, 1.4, 0, FLOOR + .12, mastZ(FLOOR)); item('mast', 'hold', -.2, FLOOR, Math.min(mastZ(FLOOR), mastZ(DECK)) - .2, .2, DECK, Math.max(mastZ(FLOOR), mastZ(DECK)) + .2); }
  // the stores: barrels in chocks along the port side aft, three laid on them; crates and sacks forward to starboard
  const onFloor = (z, half) => hb(z, FLOOR) - .04 - half;
  for (let k = 0; k < 4; k++) { const z = -4.85 + k * .66, R = .3, x = -Math.min(onFloor(z - R, R), onFloor(z + R, R)); cyl('wood', R * .9, R * .82, .8, x, FLOOR + .4, z, 14); for (const y of [.12, .68]) cyl('iron', R * .86 + .01, R * .86 + .01, .04, x, FLOOR + y, z, 14);
    item('barrel', 'hold', x - R, FLOOR, z - R, x + R, FLOOR + .8, z + R); if (k < 3) { const z2 = z + .33, x2 = x + .05, rr = .26; const g = new THREE.CylinderGeometry(rr * .9, rr * .9, .7, 12); worldUV(g, .8); g.rotateX(Math.PI / 2); g.translate(x2, FLOOR + .8 + rr, z2); add('wood', g);
      item('barrel, laid', 'hold', x2 - rr, FLOOR + .8, z2 - .35, x2 + rr, FLOOR + .8 + 2 * rr, z2 + .35); } }
  { let q = 0; for (const [z, w, h] of [[1.7, .7, .6], [2.45, .6, .5], [3.1, .7, .7]]) { const x = Math.min(onFloor(z - w / 2, w / 2), onFloor(z + w / 2, w / 2)), ry = (q++ - 1) * .07; box('plank', w, h, w, x, FLOOR + h / 2, z, ry); item('crate', 'hold', x - w * .6, FLOOR, z - w * .6, x + w * .6, FLOOR + h, z + w * .6); } }
  for (let k = 0; k < 3; k++) { const z = 3.75 + k * .45, x = onFloor(z, .3) - .05, g = new THREE.SphereGeometry(.3, 10, 8); g.scale(1, .7, 1.1); worldUV(g, .8); g.translate(x, FLOOR + .2, z); add('cloth1', g); item('sack', 'hold', x - .3, FLOOR, z - .33, x + .3, FLOOR + .42, z + .33); }
  { // the workbench (crafting) on the port side forward, a vice at its end, a rack of tools on the frames over it
    const z0 = 1.8, z1 = 3.4, dpt = .7, xo = -Math.min(onFloor(z0, 0), onFloor(z1, 0)), x = xo + dpt / 2, ht = .85;
    box('wood', dpt, .08, z1 - z0, x, FLOOR + ht, (z0 + z1) / 2); for (const zz of [z0 + .1, z1 - .1]) for (const xx of [x - dpt / 2 + .08, x + dpt / 2 - .08]) box('dark', .08, ht - .04, .08, xx, FLOOR + (ht - .04) / 2, zz);
    box('dark', dpt - .1, .05, z1 - z0 - .2, x, FLOOR + .25, (z0 + z1) / 2); box('iron', .16, .14, .22, x + dpt / 2 - .12, FLOOR + ht + .11, z1 - .2); box('iron', .04, .04, .32, x + dpt / 2 - .12, FLOOR + ht + .11, z1 - .2);
    const rx = -Math.min(hb(1.95, .35), hb(3.25, .35)) + .12; box('dark', .04, .5, 1.3, rx, .35, 2.6); for (let k = 0; k < 5; k++) { box('iron', .03, .32, .03, rx + .05, .3, 2.1 + k * .25); box('wood', .03, .12, .05, rx + .05, .5, 2.1 + k * .25); }
    for (const [dx, dz, w] of [[-.1, .3, .4], [.15, .9, .3]]) box('plank', w, .04, .12, x + dx, FLOOR + ht + .06, z0 + dz);
    item('workbench', 'hold', x - dpt / 2, FLOOR, z0, x + dpt / 2, FLOOR + ht + .2, z1); item('tool rack', 'hold', rx - .03, .05, 1.95, rx + .1, .6, 3.25); }
  { // the alchemist's table (alchemy) on the starboard side aft: the still, a retort, a rack of phials
    const z0 = -4.55, z1 = -3.55, dpt = .6, xo = Math.min(onFloor(z0, 0), onFloor(z1, 0)), x = xo - dpt / 2, ht = .8;
    box('wood', dpt, .06, z1 - z0, x, FLOOR + ht, (z0 + z1) / 2); for (const zz of [z0 + .08, z1 - .08]) for (const xx of [x - dpt / 2 + .07, x + dpt / 2 - .07]) box('dark', .07, ht - .03, .07, xx, FLOOR + (ht - .03) / 2, zz);
    { const g = new THREE.SphereGeometry(.17, 14, 10); g.translate(x - .05, FLOOR + ht + .2, z0 + .3); add('copper', g); } cyl('copper', .03, .05, .3, x - .05, FLOOR + ht + .45, z0 + .3, 8);
    { const g = new THREE.CylinderGeometry(.02, .02, .45, 6); g.rotateX(Math.PI / 2.6); g.translate(x - .05, FLOOR + ht + .55, z0 + .5); add('copper', g); } { const g = new THREE.SphereGeometry(.09, 12, 8); g.translate(x - .05, FLOOR + ht + .1, z0 + .72); add('glass', g); }
    cyl('iron', .08, .1, .1, x - .05, FLOOR + ht + .05, z0 + .3, 10);
    box('dark', .12, .25, .8, x + dpt / 2 - .08, FLOOR + ht + .15, (z0 + z1) / 2); for (let k = 0; k < 6; k++) cyl('glass', .025, .03, .13, x + dpt / 2 - .08, FLOOR + ht + .33, z0 + .15 + k * .13, 8);
    item('alchemy table', 'hold', x - dpt / 2, FLOOR, z0, x + dpt / 2, FLOOR + ht + .7, z1); }
  // the stash: two chests by the fore bulkhead, iron-bound, the island's trim on their lids
  for (const e of [1, -1]) { const z = 4.95, w = .9, d = .55, hgt = .5, x = e * (onFloor(z, w / 2) - .02); box('wood', w, hgt, d, x, FLOOR + hgt / 2, z); box('trim', w + .02, .06, d + .02, x, FLOOR + hgt - .03, z); for (const dx of [-.3, .3]) box('iron', .05, hgt + .02, d + .02, x + dx, FLOOR + hgt / 2, z);
    item(e > 0 ? 'sea chest' : 'chest', 'hold', x - w / 2, FLOOR, z - d / 2, x + w / 2, FLOOR + hgt, z + d / 2); }
  // the lanterns hung from the beams
  for (const z of [-3.5, 2.5]) { cyl('metal', .1, .12, .26, .4, beamY - .32, z, 8); { const g = new THREE.SphereGeometry(.06, 8, 6); g.translate(.4, beamY - .33, z); add('lamp', g); } box('iron', .01, .18, .01, .4, beamY - .1, z); lights.push({ x: .4, y: beamY - .33, z }); }
  // the island's rug between the bench and the alchemy table: the Mark's a hide, else a woven rug in two colours
  if (D.fur) { const g = new THREE.CircleGeometry(.8, 9); g.scale(1, 1.3, 1); g.rotateX(-Math.PI / 2); g.translate(0, FLOOR + .006, -.6); add('fur', g); }
  else { box('rug0', 1.4, .01, 2.0, 0, FLOOR + .006, -.6); box('rug1', 1.1, .012, 1.7, 0, FLOOR + .008, -.6); box('rug0', .7, .014, 1.3, 0, FLOOR + .01, -.6); }
  const G = new THREE.Group(), hull = new THREE.Mesh(S.hull.geo, S.hull.mats); hull.name = 'base:hull'; G.add(hull); let tris = S.hull.tris, draws = S.hull.mats.length;
  for (const k in by) { const geo = mergeGeometries(by[k]), m = new THREE.Mesh(geo, M[k]); m.name = 'base:' + k; G.add(m); tris += geo.attributes.position.count / 3; draws++; }
  return { group: G, kind: 'cog', tris: Math.round(tris), draws, items, hb, floor: FLOOR, beams, beamY, beamBottom: BEAM - BH / 2, deckUnder: DECK - .05,
    hold: { z0: hz0, z1: hz1 }, hatch: H, ladder: { foot, head }, lights, mastZ, dress };
}
// ── the galleon's base (Session 1584; shipbase.js's galleonBase, Session 1150; #418 A): her hold under the main deck, inside the kit's
// galleon built with both hatches open (o.open). It runs from a bulkhead under the quarterdeck's (z -4.9) to one aft of the forecastle
// (6.8), its floor of ceiling planks where she is 2 m across at the main mast, 1.76 m between the beams; the ladder from the floor up
// through the after hatch, the forward one a cargo hatch, the main and fore masts through it to their steps. Aft, the workbench to port
// with two vices and a rack of tools (the joiner's bench below, E at it) and the alchemist's table to starboard across from it (the still,
// a retort, a rack of phials), the island's rug between; two iron-bound chests end-on against the sides aft of the main mast, the way
// between them (the stash the starboard one); under the forward hatch, where she is widest, four barrels in chocks; forward, the crew's
// quarters, four hammocks slung fore and aft between the beams at 3.0 and 4.8, and the arms rack against the forward bulkhead (OG-027's
// armoury: spears upright, two round shields); three lanterns. Her great cabin (o.cabin on the ship, Session 1581) and her galley are on
// the main deck and not part of this.
//   PKIT.ships.galleonBase(o) -> as PKIT.ships.caravelBase, kind 'galleon', with hatches (both). o.dress as the galleon's.
//   Differences from the prototype: the ship's rigs and wheel are left out (nothing of them shows below); the masts are items (solids in
//   the game), the main raked 4° only in Aurenne's dress, as her hull's; the starboard chest is the 'sea chest' (the stash); the chests
//   stand at z -1.9 and the barrels at 1.0 and 1.56, clear of the main mast; the cabin and the galley are not built here.
function galleonBase(o = {}) {
  const dress = SHIP_BASE_DRESS[o.dress] ? o.dress : 'gatelands', D = SHIP_BASE_DRESS[dress], M = shipBaseMats(dress);
  const S = mkGalleon({ open: true, dress }), DECK = 1.0, TH = .05, by = {}, items = [], lights = [];
  const sect = (z, u) => S.at(z).sect(u), keelAt = z => S.at(z).k;
  const hb = (z, y) => { let lo = 0, hi = 1; for (let k = 0; k < 30; k++) { const m = (lo + hi) / 2; if (sect(z, m)[1] < y) lo = m; else hi = m; } return sect(z, lo)[0] - TH - .03; };
  const add = (key, g) => { const x = g.index ? g.toNonIndexed() : g; for (const k of Object.keys(x.attributes)) if (!['position', 'normal', 'uv'].includes(k)) x.deleteAttribute(k);
    if (!x.attributes.uv) worldUV(x, .8); (by[key] || (by[key] = [])).push(x); return x; };
  const box = (key, w, h, d, x, y, z, ry = 0) => { const g = new THREE.BoxGeometry(w, h, d); worldUV(g, .8); if (ry) g.rotateY(ry); g.translate(x, y, z); return add(key, g); };
  const cyl = (key, r0, r1, h, x, y, z, n = 12) => { const g = new THREE.CylinderGeometry(r0, r1, h, n); worldUV(g, .8); g.translate(x, y, z); return add(key, g); };
  const item = (name, place, x0, y0, z0, x1, y1, z1) => { items.push({ name, place, box: [x0, y0, z0, x1, y1, z1].map(v => +v.toFixed(3)) }); };
  if (!M.copper) { M.copper = new THREE.MeshStandardMaterial({ color: 0xb06a3c, roughness: .35, metalness: .8 }); M.glass = new THREE.MeshStandardMaterial({ color: 0x7aa08a, roughness: .1 }); }
  // the masts: the fore square and upright; the main and the mizzen raked 4° forward under Aurenne's lateens (mkGalleon)
  const R4 = Math.tan(4 * Math.PI / 180), masts = [5.2, -.4, -8.0].map(mz => [mz, dress === 'aurenne' && mz !== 5.2 ? R4 : 0]);
  const mastZ = (mz, rk, y) => mz + (y - (keelAt(mz) + .1)) * rk;
  const mastThrough = (mz, rk, y0, y1, r) => { const g = new THREE.CylinderGeometry(r, r, y1 - y0, 12); worldUV(g, .8); g.rotateX(Math.atan(rk)); g.translate(0, (y0 + y1) / 2, mastZ(mz, rk, (y0 + y1) / 2)); add('dark', g); };
  const hz0 = -4.9, hz1 = 6.8, mid = -.4, HA = S.hatches[0], HB = S.hatches[1]; let FLOOR = -1; for (let y = -1.4; y < .2; y += .01) if (hb(mid, y) >= 1.0) { FLOOR = +y.toFixed(2); break; }
  const BEAM = DECK - .16, BH = .16, beamY = BEAM - BH / 2;
  { const PW = .22; for (let x = -3 + PW / 2; x < 3; x += PW) { const zz = []; for (let z = hz0; z <= hz1 + 1e-6; z += .1) if (hb(z, FLOOR) - .02 >= Math.abs(x) + PW / 2) zz.push(z); if (zz.length < 2) continue;
      box('plank', PW - .01, .05, zz[zz.length - 1] - zz[0], x, FLOOR - .025, (zz[0] + zz[zz.length - 1]) / 2); } }
  for (let z = hz0 + .3; z <= hz1 - .24; z += .75) for (const e of [1, -1]) { const n = 6; for (let k = 0; k < n; k++) { const ya = FLOOR + (DECK - FLOOR - .05) * k / n, yb = FLOOR + (DECK - FLOOR - .05) * (k + 1) / n, xa = hb(z, ya) - .08, xb = hb(z, yb) - .08;
      const L = Math.hypot(xb - xa, yb - ya), g = new THREE.BoxGeometry(.15, L + .02, .17); worldUV(g, .8); g.rotateZ(-e * Math.atan2(xb - xa, yb - ya)); g.translate(e * (xa + xb) / 2, (ya + yb) / 2, z); add('dark', g); } }
  // the ladder from the floor aft up through the after hatch to its coaming's aft side
  const head = [0, DECK + .3, HA.z0 + .05], rise = head[1] - FLOOR, foot = [0, FLOOR, +(head[2] - rise * .36).toFixed(2)];
  { const d = new THREE.Vector3(0, head[1] - foot[1], head[2] - foot[2]), L = d.length(), a = Math.atan2(d.z, d.y);
    for (const e of [-.26, .26]) { const g = new THREE.BoxGeometry(.06, L, .1); worldUV(g, .8); g.rotateX(a); g.translate(e, (foot[1] + head[1]) / 2, (foot[2] + head[2]) / 2); add('wood', g); }
    for (let k = 1; k * .28 < rise - .1; k++) { const f = k * .28 / rise; box('wood', .5, .04, .12, 0, foot[1] + rise * f, foot[2] + (head[2] - foot[2]) * f); }
    item('ladder', 'hatch', -.29, FLOOR, foot[2] - .05, .29, DECK + .3, head[2] + .05); }
  // the beams about every 0.85 m, none over the ladder and the after hatch nor over the forward hatch; carlings either side of each opening
  const beams = [-4.6, -1.3, -.4, .45, 3.0, 3.85, 4.8, 5.65, 6.5].filter(z => (z < foot[2] - .15 || z > HA.z1 + .2) && (z < HB.z0 - .2 || z > HB.z1 + .2));
  for (const z of beams) { const w = 2 * (hb(z, BEAM) - .02); box('dark', w, BH, .18, 0, BEAM, z); for (const e of [1, -1]) box('dark', .14, .42, .14, e * (hb(z, BEAM - .3) - .09), BEAM - .26, z); }
  for (const [z0, z1, h] of [[foot[2], HA.z1, HA], [HB.z0, HB.z1, HB]]) { const za = Math.max(...beams.filter(z => z < z0)), zf = Math.min(...beams.filter(z => z > z1)); for (const e of [1, -1]) box('dark', .13, .13, zf - za - .18, e * (h.x1 + .12), BEAM + .01, (za + zf) / 2); }
  for (const zb of [hz0, hz1]) { const sh = new THREE.Shape(), ys = []; for (let k = 0; k <= 12; k++) ys.push(FLOOR - .05 + (DECK - FLOOR) * k / 12);
    sh.moveTo(-hb(zb, ys[0]), ys[0]); for (const y of ys) sh.lineTo(-hb(zb, y), y); for (const y of [...ys].reverse()) sh.lineTo(hb(zb, y), y); sh.lineTo(-hb(zb, ys[0]), ys[0]);
    const g = new THREE.ExtrudeGeometry(sh, { depth: .05, bevelEnabled: false }); g.translate(0, 0, zb - (zb < 0 ? .05 : 0)); worldUV(g, .8); add('wood', g);
    for (let x = -3.3; x <= 3.3; x += .3) if (hb(zb, (FLOOR + DECK) / 2) > Math.abs(x) + .05 && hb(zb, FLOOR) > Math.abs(x) + .05) box('dark', .03, DECK - FLOOR - .05, .02, x, (FLOOR + DECK) / 2, zb + (zb < 0 ? .01 : -.01)); }
  // the fore and main masts through the hold to their steps
  for (const [mz, rk] of masts.slice(0, 2)) { const r = .24, zf = mastZ(mz, rk, FLOOR); mastThrough(mz, rk, FLOOR, DECK, r); box('dark', .34, .22, 1.4, 0, FLOOR + .11, zf);
    item('mast', 'hold', -r, FLOOR, Math.min(zf, mastZ(mz, rk, DECK)) - r, r, DECK, Math.max(zf, mastZ(mz, rk, DECK)) + r); }
  const onFloor = (z, half) => hb(z, FLOOR) - .04 - half, inAt = (z0, z1, y) => Math.min(hb(z0, y), hb(z1, y));
  // a top on cleats at the side and two legs at its inner edge, the inner edge brought in over the floor (the hull is a V below the waterline)
  const sideTop = (e, z0, z1, d, ht, th) => { const ty = FLOOR + ht, xo = inAt(z0, z1, ty - .1) - .02, xi = Math.min(xo - d, inAt(z0, z1, FLOOR) - .14), x = e * (xo + xi) / 2;
    box('wood', xo - xi, th, z1 - z0, x, ty, (z0 + z1) / 2); for (const zz of [z0 + .08, z1 - .08]) { box('dark', .07, ht - .04, .07, e * (xi + .08), FLOOR + (ht - .04) / 2, zz); box('dark', .3, .07, .06, e * (xo - .17), ty - .08, zz); }
    box('dark', .06, .05, z1 - z0 - .2, e * (xi + .08), FLOOR + .25, (z0 + z1) / 2); return { xo, xi, ty, x }; };
  const sideItem = (name, e, t, z0, z1, top) => { const a = [e * t.xi, e * t.xo].sort((p, q) => p - q); item(name, 'hold', a[0], t.ty - .1, z0, a[1], t.ty + top, z1);
    const b = [e * (t.xi + .04), e * (t.xi + .12)].sort((p, q) => p - q); item(name + ' legs', 'hold', b[0], FLOOR, z0 + .04, b[1], t.ty, z1 - .04); };
  { // the workbench (crafting) to port aft, longer than the smaller hulls': two vices, a rack of tools over it
    const z0 = -4.75, z1 = -2.75, t = sideTop(-1, z0, z1, .7, .85, .08), x = t.x;
    for (const zz of [z0 + .2, z1 - .2]) { box('iron', .16, .14, .22, -(t.xi + .1), t.ty + .11, zz); box('iron', .32, .04, .04, -(t.xi + .1), t.ty + .11, zz); }
    for (const [dx, dz, w] of [[.05, .6, .4], [-.08, 1.3, .3]]) box('plank', w, .04, .12, x + dx, t.ty + .06, z0 + dz);
    const ry = t.ty + .45, rx = -(inAt(z0 + .1, z1 - .1, ry - .25) - .04); box('dark', .04, .5, 1.7, rx, ry, (z0 + z1) / 2); for (let k = 0; k < 7; k++) { const zz = z0 + .3 + k * .23; box('iron', .03, .3, .03, rx + .05, ry - .05, zz); box('wood', .03, .12, .05, rx + .05, ry + .15, zz); }
    sideItem('workbench', -1, t, z0, z1, .2); item('tool rack', 'hold', rx - .02, ry - .25, z0 + .1, rx + .08, ry + .25, z1 - .1); }
  { // the alchemist's table (alchemy) to starboard across from it: the still, a retort, a rack of phials
    const z0 = -4.6, z1 = -3.2, t = sideTop(1, z0, z1, .65, .82, .06), x = t.x, z = (z0 + z1) / 2;
    cyl('copper', .18, .21, .32, x + .05, t.ty + .19, z - .35, 14); { const g = new THREE.SphereGeometry(.16, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2); g.translate(x + .05, t.ty + .35, z - .35); add('copper', g); }
    { const g = new THREE.CylinderGeometry(.02, .02, .5, 6); g.rotateX(1.1); g.translate(x + .05, t.ty + .52, z - .15); add('copper', g); }
    { const g = new THREE.SphereGeometry(.09, 10, 8); g.translate(x - .12, t.ty + .12, z + .25); add('glass', g); } cyl('glass', .02, .025, .22, x - .12, t.ty + .27, z + .25, 6);
    box('wood', .14, .1, .6, t.xo - .1, t.ty + .08, z + .3); for (let k = 0; k < 5; k++) cyl('glass', .02, .02, .12, t.xo - .1, t.ty + .16, z + .08 + k * .11, 6);
    sideItem('alchemy table', 1, t, z0, z1, .62); }
  // the island's rug between the chests: the Mark's a hide, else a woven rug in two colours
  if (D.fur) { const g = new THREE.CircleGeometry(.6, 9); g.scale(1, 1.4, 1); g.rotateX(-Math.PI / 2); g.translate(0, FLOOR + .006, -1.9); add('fur', g); }
  else { box('rug0', .9, .01, 1.5, 0, FLOOR + .006, -1.9); box('rug1', .7, .012, 1.2, 0, FLOOR + .008, -1.9); }
  // the two chests (the stash the starboard one) against the sides aft of the main mast, end-on to the side (the floor is 2 m across); at
  // z -1.9, not the prototype's -1.0, where they left 0.13 m either side of the mast and closed the hold
  for (const e of [1, -1]) { const z = -1.9, w = .55, d = .9, hgt = .5, x = e * (Math.min(onFloor(z - d / 2, w / 2), onFloor(z + d / 2, w / 2)) - .02); box('wood', w, hgt, d, x, FLOOR + hgt / 2, z); box('trim', w + .02, .06, d + .02, x, FLOOR + hgt - .03, z);
    for (const dz of [-.3, .3]) box('iron', w + .02, hgt + .02, .05, x, FLOOR + hgt / 2, z + dz); item(e > 0 ? 'sea chest' : 'chest', 'hold', x - w / 2, FLOOR, z - d / 2, x + w / 2, FLOOR + hgt, z + d / 2); }
  // the stores either side under the forward hatch, where she is widest: barrels in chocks (at z 0.3, as first drawn, they left 0.2 m to the
  // main mast and closed the hold with it)
  for (const e of [1, -1]) for (const z of [1.0, 1.56]) { const R = .26, x = e * Math.min(1.3, Math.min(onFloor(z - R, R), onFloor(z + R, R)) - .02);
    cyl('wood', R * .9, R * .82, .74, x, FLOOR + .37, z, 14); for (const y of [.1, .64]) cyl('iron', R * .86 + .01, R * .86 + .01, .04, x, FLOOR + y, z, 14); item('barrel', 'hold', x - R, FLOOR, z - R, x + R, FLOOR + .74, z + R); }
  { // the crew's quarters forward: four hammocks slung fore and aft between the beams at 3.0 and 4.8, their foot ropes to the beams
    const za = 3.0, zf = 4.8, hy = beamY - .05; for (const xc of [-1.95, -.95, .95, 1.95]) { const n = 8, P = [];
      for (let k = 0; k <= n; k++) { const t = k / n, z = za + .2 + (zf - za - .4) * t, y = hy - .55 - .25 * Math.sin(Math.PI * t); P.push([z, y]); }
      for (let k = 0; k < n; k++) { const [z0, y0] = P[k], [z1, y1] = P[k + 1], g = new THREE.BoxGeometry(.62, .04, Math.hypot(z1 - z0, y1 - y0) + .01); worldUV(g, .8); g.rotateX(-Math.atan2(y1 - y0, z1 - z0)); g.translate(xc, (y0 + y1) / 2, (z0 + z1) / 2); add('cloth1', g); }
      for (const [zz, y] of [[za, P[0][1]], [zf, P[n][1]]]) { const g = new THREE.CylinderGeometry(.012, .012, Math.hypot(.2, hy - y), 4); g.rotateX((zz < 3.5 ? 1 : -1) * Math.atan2(.2, hy - y)); g.translate(xc, (hy + y) / 2, zz + (zz < 3.5 ? .1 : -.1)); add('dark', g); }
      { const k = 4, g = new THREE.BoxGeometry(.5, .06, .9); g.translate(xc, P[k][1] + .05, P[k][0]); add('cloth0', g); }
      item('hammock', 'hold', xc - .31, hy - .82, za + .2, xc + .31, hy, zf - .2); } }
  { // the arms rack against the forward bulkhead (OG-027's armoury), as wide as the narrow floor there: spears upright and two round shields
    const z = hz1 - .12, w = Math.min(1.8, 2 * (Math.min(hb(z - .14, FLOOR + .02), hb(z + .07, FLOOR + .02)) - .03)), y0 = FLOOR + .1, ns = Math.max(3, Math.floor((w - .2) / .3) + 1); box('wood', w, .06, .1, 0, y0 + 1.25, z); box('wood', w, .06, .14, 0, y0 + .05, z); for (const dx of [-w / 2 + .05, w / 2 - .05]) box('dark', .06, 1.3, .08, dx, y0 + .65, z);
    for (let k = 0; k < ns; k++) { const x = -w / 2 + .15 + k * (w - .3) / (ns - 1); cyl('dark', .016, .016, 1.6, x, y0 + .85, z - .02, 6); { const g = new THREE.ConeGeometry(.03, .18, 6); g.translate(x, y0 + 1.74, z - .02); add('iron', g); } }
    for (let k = 0; k < 2; k++) { const g = new THREE.CylinderGeometry(.22, .22, .03, 16); g.rotateX(Math.PI / 2); g.translate(-.24 + k * .48, y0 + .5, z - .1); add(k % 2 ? 'trim' : 'wood', g); }
    item('arms rack', 'hold', -w / 2, FLOOR, z - .14, w / 2, y0 + 1.83, z + .07); }
  // the lanterns hung from the beams
  for (const [x, z] of [[.7, -3.9], [-.8, .9], [0, 6.1]]) { cyl('metal', .1, .12, .26, x, beamY - .26, z, 8); const g = new THREE.SphereGeometry(.06, 8, 6); g.translate(x, beamY - .27, z); add('lamp', g); box('iron', .01, .13, .01, x, beamY - .065, z); lights.push({ x, y: beamY - .27, z }); }
  const G = new THREE.Group(), hull = new THREE.Mesh(S.hull.geo, S.hull.mats); hull.name = 'base:hull'; G.add(hull); let tris = S.hull.tris, draws = S.hull.mats.length;
  for (const k in by) { const geo = mergeGeometries(by[k]), m = new THREE.Mesh(geo, M[k]); m.name = 'base:' + k; G.add(m); tris += geo.attributes.position.count / 3; draws++; }
  return { group: G, kind: 'galleon', tris: Math.round(tris), draws, items, hb, floor: FLOOR, beams, beamY, beamBottom: BEAM - BH / 2, deckUnder: DECK - .05,
    hold: { z0: hz0, z1: hz1 }, hatch: HA, hatches: S.hatches, ladder: { foot, head }, lights, masts, mastZ, dress };
}
// ── the Mark's cutter (Session 1539; ships.js's markCutter, Session 871, Michael's A on #202 and #306): the game's cutter (L 14, W 4.0,
// draft 1.45), carvel-planked flush, tarred black above a red-brown bottom with a gilt line along the sheer strake; a plumb stem with the
// gilt beast's head, a small transom with the gilt line across it; the deck at 1.0, the rail 1.0 m over it; one tall mast stepped well
// forward with a topmast; the gaff main and its topsail (the boom 2.15 m over the deck, so a person walks under it), a staysail to the stem
// and a jib out on a 4.2 m bowsprit, all tanned; the rudder on the transom and a tiller. Sold only at the Mark's yards, so only the Mark's dress.
//   PKIT.ships.cutter(o) -> as PKIT.ships.sloop, with boom ({ y, z0, z1 }) and transom (z); rigs [gaff, jib]. o.hatchZ as the sloop's;
//   o.open (Session 1558) the hatch open to the hold, for the base below deck (cutterBase).
function mkCutter(o = {}) {
  const M = shipMats('mark'), { put, rod, bake } = shipKit();
  const L = 14, W = 4.0, DRAFT = 1.45, DECK = 1.0, SHEER = 1.36, BOW = .45, STERN = .2, NS = 44, NSTR = 12, TH = .04, TRN = .32;
  const zs = -L / 2, zb = L / 2, ZT = zs + .05;
  const sheerAt = z => SHEER + BOW * Math.max(0, z / zb) ** 2 + STERN * Math.max(0, z / zs) ** 2;
  // fine and hollow forward to a plumb stem, the beam carried aft to a transom of a third of it; deep, the forefoot cut away
  const beamAt = z => { const t = Math.max(-1, Math.min(1, z / (zb - .05))); return t > 0 ? W / 2 / 1.03 * Math.max(0, 1 - t ** 1.9) ** .5 : W / 2 / 1.03 * (TRN + (1 - TRN) * Math.max(0, 1 - Math.abs(t) ** 2.4) ** .55); };
  const keelAt = z => { const t = z / zb; return -DRAFT * (t > 0 ? 1 - .55 * t ** 3 : 1 - .18 * t * t); };
  const sect = (z, u) => { const b = beamAt(z), k = keelAt(z), s = sheerAt(z), y = k + (s - k) * u; return [b * Math.sin(Math.PI / 2 * Math.min(1, u * 1.15)) ** .85 * (1 + .03 * Math.max(0, u - .8) / .2), y]; };
  const zAt = i => ZT + (zb - .05 - ZT) * i / NS;
  const norm = (z, u) => { const a = sect(z, Math.max(0, u - .01)), b = sect(z, Math.min(1, u + .01)), dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy) || 1; return [dy / l, -dx / l]; };
  // carvel: the strakes edge to edge, flush, TH thick; red-brown below the waterline, black above
  const KR = 4; for (let s = 0; s < NSTR; s++) { const u0 = s / NSTR, u1 = (s + 1) / NSTR, outer = [], inner = [];
    for (let i = 0; i <= NS; i++) { const z = zAt(i), ro = [], ri = []; for (let k = 0; k <= KR; k++) { const u = u0 + (u1 - u0) * k / KR, p = sect(z, u), n = norm(z, u); ro.push([p[0] + n[0] * TH / 2, p[1] + n[1] * TH / 2, z]); ri.push([p[0] - n[0] * TH / 2, p[1] - n[1] * TH / 2, z]); } outer.push(ro); inner.push(ri); }
    const key = sect(0, (u0 + u1) / 2)[1] < .02 ? 'bottom' : 'tar';
    for (const side of [1, -1]) { const mir = rows => rows.map(row => row.map(([x, y, z]) => [x * side, y, z])); put(shipRibbon(mir(outer), side > 0), key, 0, 0, 0, 0, 0, 0, null); put(shipRibbon(mir(inner), side < 0), key, 0, 0, 0, 0, 0, 0, null); } }
  // the transom: the stern's section closed by a flat board, the gilt line across its head
  { const pts = []; for (let k = 0; k <= 30; k++) { const [x, y] = sect(ZT, k / 30); pts.push(new THREE.Vector2(x + TH / 2, y)); } for (let k = 30; k >= 0; k--) { const [x, y] = sect(ZT, k / 30); pts.push(new THREE.Vector2(-x - TH / 2, y)); }
    put(new THREE.ExtrudeGeometry(new THREE.Shape(pts), { depth: .06, bevelEnabled: false }), 'tar', 0, 0, ZT - .06, 0, 0, 0, .6); put(new THREE.BoxGeometry(2 * sect(ZT, 1)[0] + .08, .06, .03), 'gilt', 0, sheerAt(ZT) - .14, ZT - .07); }
  // the keel; the stem plumb from the forefoot to its head 0.45 m over the sheer, and the beast's head on it
  { const pts = []; for (let i = 0; i <= NS; i++) { const z = zAt(i); pts.push([z, keelAt(z) - .06]); }
    for (let i = 0; i < NS; i++) { const [z0, y0] = pts[i], [z1, y1] = pts[i + 1]; put(new THREE.BoxGeometry(.18, .22, Math.hypot(z1 - z0, y1 - y0) + .02), 'tar', 0, (y0 + y1) / 2, (z0 + z1) / 2, -Math.atan2(y1 - y0, z1 - z0)); }
    const sy0 = keelAt(zb) - .12, sy1 = sheerAt(zb) + .45; put(new THREE.BoxGeometry(.16, sy1 - sy0, .2), 'tar', 0, (sy0 + sy1) / 2, zb + .02); }
  const head = o.head !== false; if (head) shipBeastHead(put, sheerAt(zb) + .4, zb - .08, 1.35, .2);
  // the bowsprit from the stem head forward, 4.2 m, a little up
  const SP = [0, sheerAt(zb) + .25 + 4.2 * Math.sin(.08), zb + 4.2 * Math.cos(.08)]; rod([0, sheerAt(zb) + .2, zb - 1.2], SP, .08, .05, 'spar');
  // the deck: fore-and-aft planks cut to the half-breadth at the deck's height, the covering board out to the planking
  const deckAt = z => { let lo = 0, hi = 1; for (let k = 0; k < 30; k++) { const m = (lo + hi) / 2; if (sect(z, m)[1] < DECK) lo = m; else hi = m; } return sect(z, lo)[0] - TH * .6; };
  const HZo = o.hatchZ ?? -1.05;
  { const PW = .14; for (let x = -W / 2 + PW / 2; x < W / 2; x += PW) { const zz = []; for (let i = 0; i <= NS; i++) { const z = zAt(i); if (deckAt(z) >= Math.abs(x) + PW / 2) zz.push(z); } if (zz.length < 2) continue;
      const z0 = zz[0] - (zz[0] < ZT + .1 ? .06 : 0), z1 = zz[zz.length - 1];
      /* o.open (Session 1558, shipbase.js's Session 1148): the hatch open to the hold below, the planks cut at the coaming's inside */
      if (o.open && Math.abs(x) - PW / 2 < .57) { for (const [a2, b2] of [[z0, HZo - .57], [HZo + .57, z1]]) if (b2 - a2 > .02) put(new THREE.BoxGeometry(PW, .05, b2 - a2), 'deck', x, DECK - .025, (a2 + b2) / 2, 0, 0, 0, .35); continue; }
      put(new THREE.BoxGeometry(PW, .05, z1 - z0), 'deck', x, DECK - .025, (z0 + z1) / 2, 0, 0, 0, .35); }
    for (const e of [1, -1]) { const rows = []; for (let i = 0; i <= NS; i++) { const z = zAt(i), d = deckAt(z); rows.push([[e * Math.max(0, d - .3), DECK + .002, z], [e * (d + TH * .5), DECK + .002, z]]); } put(shipRibbon(rows, e < 0), 'oak', 0, 0, 0, 0, 0, 0, null); } }
  // stanchions every 0.9 m, the cap rail 1.0 m over the deck (or 0.12 over the sheer), the gilt line along the sheer strake
  { const n = Math.round(L / .9), top = z => Math.max(DECK + 1.0, sheerAt(z) + .12), inset = z => sect(z, 1)[0] - .06;
    for (let k = 1; k < n; k++) { const z = zs + L * k / n; if (inset(z) < .25) continue; for (const e of [1, -1]) put(new THREE.BoxGeometry(.08, top(z) - DECK, .08), 'oak', e * Math.min(inset(z), deckAt(z) - .05), (top(z) + DECK) / 2, z); }
    for (let k = 1; k + 1 < n; k++) { const za = zs + L * k / n, zc = zs + L * (k + 1) / n; if (inset(za) < .25 || inset(zc) < .25) continue;
      for (const e of [1, -1]) { rod([e * Math.min(inset(za), deckAt(za) - .05), top(za), za], [e * Math.min(inset(zc), deckAt(zc) - .05), top(zc), zc], .045, .045, 'oak'); rod([e * (sect(za, .93)[0] + .025), sect(za, .93)[1], za], [e * (sect(zc, .93)[0] + .025), sect(zc, .93)[1], zc], .03, .03, 'gilt'); } } }
  // the hatch: a coaming 0.3 m high round a dark plate
  const MZ = 1.6, HZ = o.hatchZ ?? -1.05, hatch = { x0: -.61, x1: .61, z0: HZ - .61, z1: HZ + .61 };
  for (const e of [-1, 1]) { put(new THREE.BoxGeometry(1.22, .3, .08), 'oak', 0, DECK + .15, HZ + e * .61); put(new THREE.BoxGeometry(.08, .3, 1.22), 'oak', e * .61, DECK + .15, HZ); }
  if (!o.open) put(new THREE.BoxGeometry(1.12, .02, 1.12), 'dark', 0, DECK + .02, HZ);
  // the mast and its topmast; three shrouds a side, the forestay to the stem head, the topmast stay to the bowsprit, the backstays
  const MH = 10.8, BY = DECK + 2.15, BZ1 = zs - .7;
  rod([0, keelAt(MZ) + .1, MZ], [0, DECK + MH, MZ], .17, .11, 'spar'); rod([0, DECK + MH - .8, MZ], [0, DECK + MH + 2.2, MZ], .08, .06, 'spar');
  for (const e of [1, -1]) for (const dz of [-.7, 0, .7]) { const z = MZ + dz - .3; rod([0, DECK + MH * .9, MZ], [e * (sect(z, 1)[0] + .05), sheerAt(z) - .05, z], .012, .012, 'rope'); }
  rod([0, DECK + MH * .76, MZ], [0, sheerAt(zb) + .35, zb], .014, .014, 'rope'); rod([0, DECK + MH * .86, MZ], SP, .014, .014, 'rope');
  for (const e of [1, -1]) rod([0, DECK + MH, MZ], [e * (sect(zs + 1.5, 1)[0] - .05), sheerAt(zs + 1.5), zs + 1.5], .012, .012, 'rope');
  // the rudder hung on the transom, outboard; a bucket and a coil of rope by the mast
  const ry0 = keelAt(zs) - .05, ry1 = sheerAt(ZT) + .1; put(new THREE.BoxGeometry(.1, ry1 - ry0, .7), 'tar', 0, (ry0 + ry1) / 2, ZT - .45);
  put(new THREE.TorusGeometry(.22, .05, 6, 18).rotateX(Math.PI / 2), 'rope', .4, DECK + .05, MZ - .6); put(new THREE.CylinderGeometry(.16, .13, .3, 12), 'oak', -.45, DECK + .15, MZ - .75);
  const hull = bake(M), rigs = [];
  // the gaff rig about the mast (z from the mast): the boom to past the transom, the gaff peaked at 30°, the main between them, the
  // topsail over it; then the staysail and the jib in the hull's frame. The mainsheet is left off, as the sloop's braces are.
  { const B1 = BZ1 - MZ, GT = DECK + 8.4, GL = 6.0, GA = 30 * Math.PI / 180, PK = [0, GT + GL * Math.sin(GA), -GL * Math.cos(GA)];
    rod([0, BY, -.2], [0, BY, B1], .08, .07, 'spar'); rod([0, GT, -.2], PK, .07, .06, 'spar');
    put(shipQuadSail([0, BY + .1, -.25], [0, BY + .1, B1 + .3], PK, [0, GT - .05, -.25], .55), 'sail', 0, 0, 0, 0, 0, 0, null);
    put(shipQuadSail([0, DECK + MH + 2.1, -.1], PK, PK, [0, GT + .15, -.2], .25, 8, 8), 'sail', 0, 0, 0, 0, 0, 0, null);
    rigs.push({ ...bake(M), z: MZ, type: 'gaff' }); }
  put(shipQuadSail([0, DECK + 1.5, MZ + 1.1], [0, sheerAt(zb) + .35, zb - .1], [0, sheerAt(zb) + .35, zb - .1], [0, DECK + MH * .76, MZ + .2], .35, 8, 8), 'sail', 0, 0, 0, 0, 0, 0, null);
  put(shipQuadSail([0, DECK + 2.2, zb - 1.2], SP, SP, [0, DECK + MH * .86, MZ + .25], .35, 8, 8), 'sail', 0, 0, 0, 0, 0, 0, null);
  rigs.push({ ...bake(M), z: 0, type: 'jib' });
  // the tiller: from the rudder head in over the transom to the helmsman's hand, 0.95 m over the deck; its frame is the rudder head
  const TP = [0, ry1, ZT - .2], TT = [0, DECK + .95, ZT + 1.9];
  rod([0, 0, 0], [TT[0] - TP[0], TT[1] - TP[1], TT[2] - TP[2]], .045, .035, 'oak'); const tb = bake(M);
  const tiller = new THREE.Group(); tiller.name = 'tiller'; tiller.position.set(...TP); const tm = new THREE.Mesh(tb.geo, tb.mats); tm.castShadow = true; tiller.add(tm);
  const at = z => ({ b: sect(z, 1)[0], g: sheerAt(z), k: keelAt(z), sect: u => sect(z, u) });
  return { hull, rig: rigs[0], rigs, tiller, L, W, zs, zb, mast: [0, MZ], hatch, deckAt, at, sheerAt, sailFoot: BY, boom: { y: BY, z0: MZ - .2, z1: BZ1 }, transom: ZT, tip: TT, dress: 'mark', head, shields: [],
    tris: Math.round(hull.tris + rigs.reduce((a, q) => a + q.tris, 0) + tb.tris), draws: hull.mats.length + rigs.reduce((a, q) => a + q.mats.length, 0) + tb.mats.length };
}
// ── Aurenne's caravel (Session 1544; ships.js's aurenneCaravel, Session 890, Michael's A on #316): the game's caravel (L 17.5, W 5.0,
// draft 1.3), carvel, tallowed white below the water and oiled above, the top two strakes blue under a gilt wale; a curved raked stem and a
// square stern; the deck at 1.0. Her sterncastle is a real deck 2.15 m over it across her last 4.6 m, walled in blue with gilt panels and
// railed at 1.0 m, a cabin under it behind a bulkhead with a doorway and two windows, a companion ladder up either side; the wheel stands
// on it. Three lateens raked forward 4°, white with the sun-star; the mizzen stands on the castle. Sold only at Aurenne's yards, so only
// Aurenne's dress.
//   PKIT.ships.caravel(o) -> as PKIT.ships.sloop, with wheel (a Group at the hub, its rim in the hub's xy plane, so the game turns it on
//   z), helm ({ y, z }: where the wheel stands and the helmsman's z, a pace aft of it), castle ({ z0, z1, y, cw(z), door, ladders, lad }:
//   its deck's z from the stern to the bulkhead, its height over the sea, its half-breadth, the doorway, the ladders' x and their run
//   forward), masts ([[x, z]] at the deck) and rigs [lateen ×3]. o.hatchZ as the sloop's (her own between the main and the fore); o.open (Session 1564)
//   the hatch open to the hold, for the base below deck (caravelBase); o.cabin (Session 1565) the cabin under the castle furnished
//   (cabinItems).
//   Differences from the prototype: each lateen is slung to starboard in its rig's frame, which the game swings and mirrors to leeward
//   (the prototype alternates them), so the shrouds stand to port; the tack and sheet lines are left off with the sloop's braces.
function mkCaravel(o = {}) {
  const M = shipMats('aurenne'), { put, rod, bake } = shipKit();
  if (!M.paint) { M.paint = new THREE.MeshStandardMaterial({ color: 0xe6dcc4, roughness: .8 }); M.lamp = new THREE.MeshStandardMaterial({ color: 0xffd890, emissive: 0xffb050, emissiveIntensity: .8, roughness: .4 }); }
  const L = 17.5, W = 5.0, DRAFT = 1.3, DECK = 1.0, SHEER = 1.42, BOW = .5, STERN = 1.15, NS = 52, NSTR = 14, TH = .045, TRN = .6;
  const zs = -L / 2, zb = L / 2, ZT = zs + .05;
  const sheerAt = z => SHEER + BOW * Math.max(0, z / zb) ** 2 + STERN * Math.max(0, z / zs) ** 2;
  // a full body, fine only at the bow; the beam carried aft to a square stern of six tenths of it
  const beamAt = z => { const t = Math.max(-1, Math.min(1, z / (zb - .05))); return t > 0 ? W / 2 / 1.03 * Math.max(0, 1 - t ** 2.1) ** .5 : W / 2 / 1.03 * (TRN + (1 - TRN) * Math.max(0, 1 - Math.abs(t) ** 2.6) ** .55); };
  const keelAt = z => { const t = z / zb; return -DRAFT * (t > 0 ? 1 - .45 * t ** 3 : 1 - .2 * t * t); };
  const sect = (z, u) => { const b = beamAt(z), k = keelAt(z), s = sheerAt(z), y = k + (s - k) * u; return [b * Math.sin(Math.PI / 2 * Math.min(1, u * 1.18)) ** .8 * (1 + .03 * Math.max(0, u - .8) / .2), y]; };
  // the stem's curve: forward of amidships a strake's low points draw aft, so the forefoot rounds up into a raked stem
  const zr = (z, u) => z > 0 ? z * (1 - .16 * (1 - u) ** 1.6 * (z / zb) ** 6) : z;
  const zAt = i => ZT + (zb - .05 - ZT) * i / NS;
  const norm = (z, u) => { const a = sect(z, Math.max(0, u - .01)), b = sect(z, Math.min(1, u + .01)), dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy) || 1; return [dy / l, -dx / l]; };
  // carvel: the strakes flush; tallow white below the waterline, oiled wood above, the top two strakes blue
  const KR = 4; for (let s = 0; s < NSTR; s++) { const u0 = s / NSTR, u1 = (s + 1) / NSTR, outer = [], inner = [];
    for (let i = 0; i <= NS; i++) { const z = zAt(i), ro = [], ri = []; for (let k = 0; k <= KR; k++) { const u = u0 + (u1 - u0) * k / KR, p = sect(z, u), n = norm(z, u); ro.push([p[0] + n[0] * TH / 2, p[1] + n[1] * TH / 2, zr(z, u)]); ri.push([p[0] - n[0] * TH / 2, p[1] - n[1] * TH / 2, zr(z, u)]); } outer.push(ro); inner.push(ri); }
    const key = s >= NSTR - 2 ? 'blue' : sect(0, (u0 + u1) / 2)[1] < .02 ? 'tallow' : 'hull';
    for (const side of [1, -1]) { const mir = rows => rows.map(row => row.map(([x, y, z]) => [x * side, y, z])); put(shipRibbon(mir(outer), side > 0), key, 0, 0, 0, 0, 0, 0, null); put(shipRibbon(mir(inner), side < 0), key, 0, 0, 0, 0, 0, 0, null); } }
  // the transom: the stern's section closed by a flat board, blue over the tallow line
  { const pts = []; for (let k = 0; k <= 30; k++) { const [x, y] = sect(ZT, k / 30); pts.push(new THREE.Vector2(x + TH / 2, y)); } for (let k = 30; k >= 0; k--) { const [x, y] = sect(ZT, k / 30); pts.push(new THREE.Vector2(-x - TH / 2, y)); }
    put(new THREE.ExtrudeGeometry(new THREE.Shape(pts), { depth: .06, bevelEnabled: false }), 'hull', 0, 0, ZT - .06, 0, 0, 0, .6);
    const yb = sect(ZT, (NSTR - 2) / NSTR)[1]; put(new THREE.BoxGeometry(2 * sect(ZT, 1)[0] + .08, sheerAt(ZT) - yb, .03), 'blue', 0, (yb + sheerAt(ZT)) / 2, ZT - .075); }
  // the keel along the bottom, and the stem following the strakes' curve up to its head 0.4 m over the sheer
  { const pts = []; for (let i = 0; i <= NS; i++) { const z = zAt(i); pts.push([zr(z, 0), keelAt(z) - .06]); }
    for (let k = 1; k <= 12; k++) { const u = k / 12, z = zr(zb - .05, u) + .06 * u; pts.push([z + .04, sect(zb - .05, u)[1] + (k === 12 ? .4 : 0)]); }
    for (let i = 0; i + 1 < pts.length; i++) { const [z0, y0] = pts[i], [z1, y1] = pts[i + 1]; put(new THREE.BoxGeometry(.18, .22, Math.hypot(z1 - z0, y1 - y0) + .03), 'hull', 0, (y0 + y1) / 2, (z0 + z1) / 2, -Math.atan2(y1 - y0, z1 - z0)); } }
  // the bowsprit, 2.6 m, steeved up
  const SP = [0, sheerAt(zb) + .3 + 2.6 * Math.sin(.22), zb - .1 + 2.6 * Math.cos(.22)]; rod([0, sheerAt(zb) - .1, zb - 1.4], SP, .1, .06, 'spar');
  // the main deck at DECK, fore-and-aft planks cut to the hull's half-breadth (under the castle too: the cabin's floor), a covering board out to the planking
  const HZo = o.hatchZ ?? 2.8;
  const deckAt = z => { let lo = 0, hi = 1; for (let k = 0; k < 30; k++) { const m = (lo + hi) / 2; if (sect(z, m)[1] < DECK) lo = m; else hi = m; } return sect(z, lo)[0] - TH * .6; };
  { const PW = .15; for (let x = -W / 2 + PW / 2; x < W / 2; x += PW) { const zz = []; for (let i = 0; i <= NS; i++) { const z = zAt(i); if (deckAt(z) >= Math.abs(x) + PW / 2) zz.push(z); } if (zz.length < 2) continue;
      const z0 = zz[0] - (zz[0] < ZT + .1 ? .06 : 0), z1 = zz[zz.length - 1];
      /* o.open (Session 1564, shipbase.js's Session 1149): the hatch open to the hold below, the planks cut at the coaming's inside */
      if (o.open && Math.abs(x) - PW / 2 < .6) { for (const [a2, b2] of [[z0, HZo - .6], [HZo + .6, z1]]) if (b2 - a2 > .02) put(new THREE.BoxGeometry(PW, .05, b2 - a2), 'deck', x, DECK - .025, (a2 + b2) / 2, 0, 0, 0, .35); continue; }
      put(new THREE.BoxGeometry(PW, .05, z1 - z0), 'deck', x, DECK - .025, (z0 + z1) / 2, 0, 0, 0, .35); }
    for (const e of [1, -1]) { const rows = []; for (let i = 0; i <= NS; i++) { const z = zAt(i), d = deckAt(z); rows.push([[e * Math.max(0, d - .3), DECK + .002, z], [e * (d + TH * .5), DECK + .002, z]]); } put(shipRibbon(rows, e < 0), 'oak', 0, 0, 0, 0, 0, 0, null); } }
  // the gilt wale along the top of the tallow-and-wood, under the blue
  for (let i = 0; i + 1 <= NS; i += 2) { const za = zAt(i), zc = zAt(Math.min(NS, i + 2)), u = (NSTR - 2) / NSTR; for (const e of [1, -1]) rod([e * (sect(za, u)[0] + .03), sect(za, u)[1], zr(za, u)], [e * (sect(zc, u)[0] + .03), sect(zc, u)[1], zr(zc, u)], .045, .045, 'gilt'); }
  // the sterncastle: its deck CY over the last 4.6 m, walled up from the sheer in blue boards with panels; the bulkhead across its
  // forward end with a doorway and two windows; a companion ladder up either side; a rail round its top at 1.0 m
  const ZC = ZT + 4.6, CY = DECK + 2.15, cw = z => sect(z, 1)[0], door = { x0: -.5, x1: .5, y1: DECK + 1.95 }, ladders = [-1.55, 1.55], LAD = 1.25;
  { const n = 16; for (const e of [1, -1]) { const rows = []; for (let i = 0; i <= n; i++) { const z = ZT + (ZC - ZT) * i / n; rows.push([[e * cw(z), sheerAt(z) - .1, z], [e * cw(z), CY + .25, z]]); }
      put(shipRibbon(rows, e > 0), 'blue', 0, 0, 0, 0, 0, 0, null); put(shipRibbon(rows.map(row => row.map(([x, y, z]) => [x - e * .05, y, z])), e < 0), 'blue', 0, 0, 0, 0, 0, 0, null);
      for (let i = 0; i < 5; i++) { const z = ZT + .5 + i * .85, y = (sheerAt(z) + CY + .25) / 2; put(new THREE.BoxGeometry(.03, Math.max(.2, CY - .05 - sheerAt(z)), .5), 'paint', e * (cw(z) + .015), y - .05, z); }
      for (let i = 0; i < 8; i++) { const za = ZT + (ZC - ZT) * i / 8, zc = ZT + (ZC - ZT) * (i + 1) / 8; rod([e * (cw(za) + .02), CY + .2, za], [e * (cw(zc) + .02), CY + .2, zc], .035, .035, 'gilt'); } }
    /* the castle's after wall, from the transom's head up to its rail's foot */ put(new THREE.BoxGeometry(2 * cw(ZT) + .06, CY + .25 - sheerAt(ZT) + .1, .06), 'blue', 0, (sheerAt(ZT) - .1 + CY + .25) / 2, ZT - .03);
    /* the castle's deck */ const PW = .15; for (let x = -W / 2 + PW / 2; x < W / 2; x += PW) { let z0 = null; for (let i = 0; i <= 40; i++) { const z = ZT + (ZC - ZT) * i / 40; if (cw(z) - .05 >= Math.abs(x) + PW / 2) { z0 = z; break; } } if (z0 === null) continue;
      put(new THREE.BoxGeometry(PW, .06, ZC + .05 - z0), 'deck', x, CY - .03, (z0 + ZC + .05) / 2, 0, 0, 0, .35); }
    /* the bulkhead: boards either side of the doorway, a lintel over it, a beam under the castle's edge */ const w = Math.min(cw(ZC), deckAt(ZC) + .05);
    for (const e of [1, -1]) put(new THREE.BoxGeometry(w - door.x1, CY - DECK, .08), 'oak', e * (door.x1 + (w - door.x1) / 2), (DECK + CY) / 2, ZC); put(new THREE.BoxGeometry(door.x1 - door.x0, CY - door.y1, .08), 'oak', 0, (door.y1 + CY) / 2, ZC);
    put(new THREE.BoxGeometry(2 * w + .1, .14, .16), 'blue', 0, CY - .07, ZC + .04);
    for (const e of [1, -1]) { put(new THREE.BoxGeometry(.5, .4, .02), 'dark', e * 1.05, DECK + 1.45, ZC + .05); put(new THREE.BoxGeometry(.6, .06, .06), 'gilt', e * 1.05, DECK + 1.68, ZC + .06); }
    put(new THREE.BoxGeometry(door.x1 - door.x0 + .16, .1, .1), 'gilt', 0, door.y1 + .05, ZC + .06);
    /* the companion ladders: two stringers and seven treads each, from the deck LAD forward up to the castle's edge */
    for (const lx of ladders) { for (const e of [-1, 1]) rod([lx + e * .28, DECK, ZC + LAD], [lx + e * .28, CY + .05, ZC + .02], .035, .035, 'oak'); for (let k = 1; k <= 7; k++) { const f = k / 8; put(new THREE.BoxGeometry(.56, .04, .2), 'oak', lx, DECK + (CY - DECK) * f, ZC + LAD * (1 - f)); } }
    /* the castle's rail: stanchions and a cap rail at 1.0 m along both sides and across the stern; across its forward edge, broken
       at the ladders' heads */ const top = CY + 1.0;
    for (const e of [1, -1]) { for (let i = 0; i <= 5; i++) { const z = ZT + .15 + (ZC - ZT - .2) * i / 5; put(new THREE.BoxGeometry(.08, top - CY - .25, .08), 'oak', e * (cw(z) - .04), (top + CY + .25) / 2, z); }
      for (let i = 0; i < 5; i++) { const za = ZT + .15 + (ZC - ZT - .2) * i / 5, zc = ZT + .15 + (ZC - ZT - .2) * (i + 1) / 5; rod([e * (cw(za) - .04), top, za], [e * (cw(zc) - .04), top, zc], .045, .045, 'oak'); } }
    { const a = cw(ZT + .15) - .04; rod([-a, top, ZT + .15], [a, top, ZT + .15], .045, .045, 'oak'); for (let x = -a; x <= a + .01; x += a / 3) put(new THREE.BoxGeometry(.08, top - CY - .25, .08), 'oak', x, (top + CY + .25) / 2, ZT + .15); }
    { const a = cw(ZC) - .04, gaps = ladders.map(lx => [lx - .36, lx + .36]), segs = [[-a, gaps[0][0]], [gaps[0][1], gaps[1][0]], [gaps[1][1], a]];
      for (const [x0, x1] of segs) { rod([x0, top, ZC - .05], [x1, top, ZC - .05], .045, .045, 'oak'); for (const x of [x0, x1]) put(new THREE.BoxGeometry(.08, top - CY, .08), 'oak', x, (top + CY) / 2, ZC - .05); } } }
  // the main deck's rail, from the castle's bulkhead forward: stanchions every 0.9 m, a cap rail at 1.0 m over the deck or 0.12 over the sheer
  { const n = Math.round(L / .9), top = z => Math.max(DECK + 1.0, sheerAt(z) + .12), inset = z => sect(z, 1)[0] - .06, ok = z => z > ZC + .3 && inset(z) >= .25;
    for (let k = 1; k < n; k++) { const z = zs + L * k / n; if (!ok(z)) continue; for (const e of [1, -1]) put(new THREE.BoxGeometry(.08, top(z) - DECK, .08), 'oak', e * Math.min(inset(z), deckAt(z) - .05), (top(z) + DECK) / 2, z); }
    for (let k = 1; k + 1 < n; k++) { const za = zs + L * k / n, zc = zs + L * (k + 1) / n; if (!ok(za) || !ok(zc)) continue;
      for (const e of [1, -1]) rod([e * Math.min(inset(za), deckAt(za) - .05), top(za), za], [e * Math.min(inset(zc), deckAt(zc) - .05), top(zc), zc], .045, .045, 'oak'); } }
  // the hatch between the main mast and the fore, its coaming 0.3 m round a dark plate
  const HZ = o.hatchZ ?? 2.8, hatch = { x0: -.6, x1: .6, z0: HZ - .6, z1: HZ + .6 };
  { const hw = 1.32, hd = 1.32; for (const e of [-1, 1]) { put(new THREE.BoxGeometry(hw, .3, .08), 'oak', 0, DECK + .15, HZ + e * hd / 2); put(new THREE.BoxGeometry(.08, .3, hd), 'oak', e * hw / 2, DECK + .15, HZ); }
    if (!o.open) put(new THREE.BoxGeometry(hw - .1, .02, hd - .1), 'dark', 0, DECK + .02, HZ); }
  // the three masts, raked forward 4°: [mast z, the deck it stands on, the sling's height over that deck, the yard's angle, its length
  // forward and aft of the sling, the clew's z]. The halyard down each; three shrouds to port; the forestay from the main's head to the bowsprit.
  const RAKE = 4 * Math.PI / 180, LAT = [[5.0, DECK, 6.4, 50, 5.1, 6.8, 1.6], [.8, DECK, 8.6, 52, 7.6, 10.0, -3.6], [-7.2, CY, 5.4, 50, 4.1, 5.4, -9.5]], slings = [], masts = [];
  for (const [mz, dy, sy] of LAT) { const top = dy + sy + .8, mast = y => mz + (y - (keelAt(mz) + .1)) * Math.tan(RAKE);
    rod([0, keelAt(mz) + .1, mz], [0, top, mast(top)], mz > 0 && sy > 7 ? .18 : .15, .1, 'spar'); rod([.15, top - .1, mast(top)], [0, dy + .4, mz - .3], .012, .012, 'rope');
    for (const dz of [-.8, 0, .8]) { const z = Math.max(ZT + .3, mz + dz - .3); rod([0, top - .3, mast(top - .3)], [-(cw(z) + (z < ZC ? 0 : .05)), z < ZC ? CY + .2 : sheerAt(z) - .05, z], .012, .012, 'rope'); }
    slings.push({ y: dy + sy, z: mast(dy + sy), top, topZ: mast(top) }); masts.push([0, mast(DECK)]); }
  rod([0, slings[1].top - .2, slings[1].topZ], SP, .014, .014, 'rope');
  // the rudder hung on the transom, its head through the castle's deck; the wheel's post on the castle, two stern lanterns on its after corners
  const wz = ZC - 1.0, wy = CY + 1.15;
  { const ry0 = keelAt(zs) - .05; put(new THREE.BoxGeometry(.12, sheerAt(ZT) - ry0, .7), 'hull', 0, (ry0 + sheerAt(ZT)) / 2, ZT - .45); rod([0, sheerAt(ZT) - .2, ZT - .2], [0, CY + .35, ZT - .2], .08, .08, 'oak');
    put(new THREE.BoxGeometry(.18, wy - CY, .18), 'oak', 0, (wy + CY) / 2 - .05, wz - .3); put(new THREE.CylinderGeometry(.07, .07, .3, 8).rotateX(Math.PI / 2), 'gilt', 0, wy, wz - .12); }
  for (const e of [1, -1]) { const x = e * (cw(ZT + .15) - .15), y = CY + 1.25; rod([x, CY + 1.0, ZT + .15], [x, y, ZT + .15], .03, .03, 'gilt'); put(new THREE.CylinderGeometry(.13, .1, .32, 8), 'lamp', x, y + .16, ZT + .15); put(new THREE.ConeGeometry(.16, .16, 8), 'gilt', x, y + .4, ZT + .15); }
  put(new THREE.TorusGeometry(.22, .05, 6, 18).rotateX(Math.PI / 2), 'rope', .45, DECK + .05, .2); put(new THREE.CylinderGeometry(.16, .13, .3, 12), 'oak', -.5, DECK + .15, -.1);
  // o.cabin (Session 1565, shipbase.js's caravelBase, Session 1149): the cabin under the sterncastle furnished, the base's other room, on the
  // main deck behind the bulkhead's doorway: the box bunk along the port side aft (rest and save), the sea chest at its foot, the chart
  // table to starboard with its chart, the log, dividers and a candle, a stool, a shelf of books and bottles on the after wall, a lantern
  // from the castle's beam, Aurenne's rug; the mizzen already stands through it. Its pieces are in cabinItems ([{ name, box }]).
  const cabinItems = [];
  if (o.cabin) { if (!M.madder) M.madder = new THREE.MeshStandardMaterial({ color: 0x9c2f2a, roughness: 1 });
    const hbC = (z, y) => { let lo = 0, hi = 1; for (let k = 0; k < 30; k++) { const m = (lo + hi) / 2; if (sect(z, m)[1] < y) lo = m; else hi = m; } return sect(z, lo)[0] - TH - .03; };
    const cin = (z, y) => Math.min(hbC(z, y), cw(z) - .11), bx = (key, w, h, d, x, y, z) => put(new THREE.BoxGeometry(w, h, d), key, x, y, z);
    const cy = (key, r0, r1, h, x, y, z, n = 10) => put(new THREE.CylinderGeometry(r0, r1, h, n), key, x, y, z);
    const it = (name, x0, y0, z0, x1, y1, z1) => cabinItems.push({ name, box: [x0, y0, z0, x1, y1, z1].map(v => +v.toFixed(3)) }), cceil = CY - .12;
    { // the box bunk: its frame, a straw tick, the blanket in indigo, a bolster, a curtain rail, boards at its ends
      const z0 = -8.15, z1 = -6.25, w = .78, xo = -Math.min(cin(z0, DECK + .1), cin(z1, DECK + .1)) + .02, x = xo + w / 2, y0 = DECK;
      bx('oak', w, .3, z1 - z0, x, y0 + .25, (z0 + z1) / 2); bx('paint', w - .1, .14, z1 - z0 - .1, x, y0 + .47, (z0 + z1) / 2); bx('blue', w - .06, .05, (z1 - z0) * .64, x, y0 + .57, z1 - (z1 - z0) * .34);
      bx('paint', .5, .1, .3, x, y0 + .58, z0 + .25); for (const zz of [z0, z1]) bx('oak', w + .04, 1.3, .06, x, y0 + .65, zz); bx('oak', .06, .32, z1 - z0, x + w / 2, y0 + .4, (z0 + z1) / 2);
      bx('spar', .04, .04, z1 - z0, x + w / 2 - .02, y0 + 1.3, (z0 + z1) / 2); it('bunk', x - w / 2, y0, z0 - .03, x + w / 2 + .03, y0 + 1.3, z1 + .03); }
    { // the sea chest at the bunk's foot, gilt on its lid
      const z = -5.75, w = .5, d = .8, hgt = .55, x = -(Math.min(cin(z - d / 2, DECK + .1), cin(z + d / 2, DECK + .1)) - w / 2 - .02); bx('oak', w, hgt, d, x, DECK + hgt / 2, z); bx('gilt', w + .02, .06, d + .02, x, DECK + hgt - .03, z);
      bx('iron', w + .02, .06, .06, x, DECK + hgt * .6, z + d / 2); it('sea chest', x - w / 2, DECK, z - d / 2, x + w / 2, DECK + hgt, z + d / 2); }
    { // the chart table to starboard: a chart, the log, dividers and a candle; a stool
      const z = -6.6, w = .8, d = 1.1, ht = .78, x = Math.min(cin(z - d / 2, DECK + .1), cin(z + d / 2, DECK + .1)) - w / 2 - .02; bx('oak', w, .06, d, x, DECK + ht, z);
      for (const dx of [-w / 2 + .07, w / 2 - .07]) for (const dz of [-d / 2 + .07, d / 2 - .07]) bx('spar', .06, ht - .03, .06, x + dx, DECK + (ht - .03) / 2, z + dz);
      put(new THREE.BoxGeometry(.5, .004, .7), 'paint', x, DECK + ht + .033, z, 0, .1, 0); bx('spar', .22, .05, .3, x - .2, DECK + ht + .055, z - .35); put(new THREE.CylinderGeometry(.006, .006, .2, 4), 'iron', x + .05, DECK + ht + .04, z + .1, 1.2, 0, 0);
      cy('gilt', .05, .06, .03, x + .25, DECK + ht + .045, z + .4, 8); cy('paint', .02, .02, .1, x + .25, DECK + ht + .11, z + .4, 8); put(new THREE.SphereGeometry(.018, 6, 5), 'lamp', x + .25, DECK + ht + .175, z + .4);
      cy('spar', .17, .16, .45, x - w / 2 - .22, DECK + .225, z);
      it('chart table', x - w / 2, DECK, z - d / 2, x + w / 2, DECK + ht + .2, z + d / 2); it('stool', x - w / 2 - .39, DECK, z - .17, x - w / 2 - .05, DECK + .45, z + .17); }
    { // a shelf of books and bottles on the after wall over the transom's head, a lantern from the castle's beam, the rug
      const zs = ZT + .35, yS = DECK + 1.75, sw = 2 * cin(zs, yS) - .1; bx('oak', sw, .04, .25, 0, yS, zs); for (let k = 0; k < 7; k++) bx(k % 3 ? 'madder' : 'blue', .06, .22, .18, -sw / 2 + .2 + k * .1, yS + .13, zs);
      for (let k = 0; k < 4; k++) cy('blue', .04, .045, .2, sw / 2 - .2 - k * .13, yS + .12, zs, 8); it('shelf', -sw / 2, yS - .02, zs - .13, sw / 2, yS + .25, zs + .13);
      const lx = .35, lz = -5.4; cy('gilt', .1, .12, .26, lx, cceil - .45, lz, 8); put(new THREE.SphereGeometry(.06, 8, 6), 'lamp', lx, cceil - .46, lz); bx('iron', .01, .3, .01, lx, cceil - .17, lz);
      bx('madder', .9, .01, 1.3, 0, DECK + .006, -5.6); bx('gilt', .7, .012, 1.0, 0, DECK + .008, -5.6); }
  }
  const hull = bake(M), rigs = [];
  // the rigs: each yard slung to starboard of its mast, a third of its length forward of the sling, the lateen hung from it to a tack
  // under its lower end and a clew aft, the foot 2.5 m over its deck; each in its sling's frame, which the game swings to leeward
  LAT.forEach(([mz, dy, sy, ang, fw, af, cz], k) => { const S = slings[k], A = ang * Math.PI / 180, xs = .3, T = [xs, S.y - fw * Math.sin(A), fw * Math.cos(A)], P = [xs, S.y + af * Math.sin(A), -af * Math.cos(A)], C = [xs, dy + 2.5, cz - S.z];
    rod(T, P, .09, .06, 'spar'); put(shipLateenSail([T[0], T[1] - .05, T[2] - .15], [P[0], P[1] - .15, P[2] + .2], C, 1, .5), 'sail', 0, 0, 0, 0, 0, 0, null);
    rigs.push({ ...bake(M), z: S.z, type: 'lateen' }); });
  // the wheel: its rim and eight spokes about the hub, which the game turns with the helm
  { put(new THREE.TorusGeometry(.62, .035, 6, 24), 'oak'); for (let k = 0; k < 8; k++) { const a = k * Math.PI / 4; rod([0, 0, 0], [.78 * Math.cos(a), .78 * Math.sin(a), 0], .022, .018, 'oak'); } }
  const wb = bake(M), wheel = new THREE.Group(); wheel.name = 'wheel'; wheel.position.set(0, wy, wz); { const wm = new THREE.Mesh(wb.geo, wb.mats); wm.castShadow = true; wheel.add(wm); }
  const at = z => ({ b: sect(z, 1)[0], g: sheerAt(z), k: keelAt(z), sect: u => sect(z, u) });
  return { hull, rig: rigs[0], rigs, wheel, L, W, zs, zb, mast: masts[1], masts, hatch, deckAt, at, sheerAt, transom: ZT, dress: 'aurenne', head: false, shields: [],
    cabinItems, castle: { z0: ZT, z1: ZC, y: CY, cw, door, ladders, lad: LAD }, helm: { y: wy, z: wz - 1.1, wheelZ: wz },
    tris: Math.round(hull.tris + rigs.reduce((a, q) => a + q.tris, 0) + wb.tris), draws: hull.mats.length + rigs.reduce((a, q) => a + q.mats.length, 0) + wb.mats.length };
}
// ── the cog (Session 1551; ships.js's gatelandsCog, Session 892, Michael's A on #319, and its markCog and aurenneCog, Sessions 1039 and
// 1044, Michael's A on #347): the game's cog (L 17, W 5.6, draft 1.25), flat-floored, slab-sided and full to the ends, clinker-laid, a
// straight raked stem and sternpost, the deck at 1.0. Castles at both ends, real decks 2.15 m over the main one: the aftcastle over her
// last 3.8 m, a cabin under it behind a bulkhead with a doorway, a ladder up either side, the wheel on it; the forecastle over her first
// 3.0 m, open beneath on two posts, a ladder up the middle from the deck aft of it. One mast with a round fighting top. Sold at every
// island's yards, so she wears the yard's dress (#839 A): the Gatelands' (tarred, oiled oak, a green sheer strake and green castles under
// cream, the square green sail with the harp), the Mark's (red-brown below, tarred black above and on the castles, gilt; one gaff main in
// tanned cloths, the boom 2.15 m over the deck), Aurenne's (tallow below, oiled above, blue and gilt; one lateen with the sun-star, the
// mast raked 4° forward, shrouds to port only).
//   PKIT.ships.cog(o) -> as PKIT.ships.caravel, with fore ({ z0, z1, y, cw, ladders, lad, posts }: the forecastle, its ladder running
//   aft from z0), cargo ([[x, z, r]]: the barrels and crates lashed along her sides) and rigs [square | gaff | lateen]. o.dress as the sloop's.
//   o.open (Session 1578) the hatch open to the hold, for the base below deck (cogBase). o.cabin (Session 1579) the cabin under the aftcastle furnished.
//   Differences from the prototype: the rig is in its own frame (the square yard about the mast, the gaff about the mast, the lateen about
//   its sling, slung to starboard), which the game trims; the braces, the gaff's sheet and halyard and the lateen's tack and sheet are left
//   off, as the sloop's; the cargo is a fixed pattern, not drawn by a stream; a bucket and a coil of rope by the mast, as the other hulls'.
function mkCog(o = {}) {
  const MARK = o.dress === 'mark', AURD = o.dress === 'aurenne', SQR = !MARK && !AURD, M = shipMats(o.dress), { put, rod, bake } = shipKit();
  const L = 17, W = 5.6, DRAFT = 1.25, DECK = 1.0, SHEER = 1.55, BOW = .85, STERN = .9, NS = 46, NSTR = 12, TH = .04, LAP = .025;
  const zs = -L / 2, zb = L / 2;
  const sheerAt = z => SHEER + BOW * Math.max(0, z / zb) ** 2 + STERN * Math.max(0, z / zs) ** 2;
  // full to the ends: the half-breadth holds most of the beam to a quarter of her length from either post
  const beamAt = z => { const t = Math.max(-1, Math.min(1, z / (zb - .05))), e = t > 0 ? 2.6 : 2.8; return W / 2 / 1.02 * Math.max(0, 1 - Math.abs(t) ** e) ** .45; };
  const keelAt = z => -DRAFT * (1 - .3 * Math.abs(z / zb) ** 4);
  // flat-floored and slab-sided: the turn of the bilge is quick and the sides stand nearly upright
  const sect = (z, u) => { const b = beamAt(z), k = keelAt(z), s = sheerAt(z), y = k + (s - k) * u ** 1.1; return [b * Math.sin(Math.PI / 2 * Math.min(1, u * 1.7)) ** .45 * (1 + .02 * Math.max(0, u - .8) / .2), y]; };
  const zAt = i => zs + .05 + (L - .1) * i / NS;
  const zr = (z, u) => z * (1 - (z > 0 ? .15 : .13) * (1 - u) ** 1.3 * Math.abs(z / zb) ** 5);
  const norm = (z, u) => { const a = sect(z, Math.max(0, u - .01)), b = sect(z, Math.min(1, u + .01)), dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy) || 1; return [dy / l, -dx / l]; };
  // the strakes, clinker-laid as the sloop's, four rows of girth to a strake and 46 sections
  // (the prototype's six and 52 put her at 41k triangles)
  const KR = 4;
  for (let s = 0; s < NSTR; s++) { const u0 = s / NSTR, u1 = (s + 1) / NSTR + (s < NSTR - 1 ? .018 : 0), outer = [], inner = [];
    for (let i = 0; i <= NS; i++) { const z = zAt(i), ro = [], ri = []; for (let k = 0; k <= KR; k++) { const u = u0 + (u1 - u0) * k / KR, p = sect(z, u), n = norm(z, u), off = (LAP + TH * .3) * (1 - k / KR) * (s ? 1 : .2) + TH * .3;
        ro.push([p[0] + n[0] * off, p[1] + n[1] * off, zr(z, u)]); ri.push([p[0] + n[0] * (off - TH), p[1] + n[1] * (off - TH), zr(z, u)]); } outer.push(ro); inner.push(ri); }
    const yMid = sect(0, (u0 + u1) / 2)[1], key = s === NSTR - 1 ? 'green' : MARK ? (yMid < .08 ? 'bottom' : 'tar') : AURD ? (yMid < .08 ? 'tallow' : 'hull') : yMid < .08 ? 'tar' : 'oak';
    for (const side of [1, -1]) { const mir = rows => rows.map(row => row.map(([x, y, z]) => [x * side, y, z])); put(shipRibbon(mir(outer), side > 0), key, 0, 0, 0, 0, 0, 0, null); put(shipRibbon(mir(inner), side < 0), key, 0, 0, 0, 0, 0, 0, null);
      put(shipRibbon(mir(outer.map((row, i) => [row[0], inner[i][0]])), side < 0), key, 0, 0, 0, 0, 0, 0, null); } }
  // the keel; the stem and the sternpost, straight and raked, from the keel's ends to their heads over the sheer
  { const pts = []; for (let i = 0; i <= NS; i++) { const z = zAt(i); pts.push([zr(z, 0), keelAt(z) - .06]); }
    for (let i = 0; i < NS; i++) { const [z0, y0] = pts[i], [z1, y1] = pts[i + 1]; put(new THREE.BoxGeometry(.2, .22, Math.hypot(z1 - z0, y1 - y0) + .02), 'tar', 0, (y0 + y1) / 2, (z0 + z1) / 2, -Math.atan2(y1 - y0, z1 - z0)); }
    rod([0, keelAt(zb) - .12, zr(zb - .05, 0) - .05], [0, sheerAt(zb) + .4, zb + .14], .12, .1, 'oak'); rod([0, keelAt(zs) - .12, zr(zs + .05, 0) + .05], [0, sheerAt(zs) + .3, zs - .12], .13, .11, 'oak'); }
  // the bowsprit, 1.8 m
  const SP = [0, sheerAt(zb) + .3 + 1.8 * Math.sin(.25), zb + 1.8 * Math.cos(.25)]; rod([0, sheerAt(zb) - .05, zb - 1.0], SP, .1, .07, 'spar');
  // the deck, fore-and-aft planks on the half-breadth (under both castles too), a covering board out to the planking
  const deckAt = z => { let lo = 0, hi = 1; for (let k = 0; k < 30; k++) { const m = (lo + hi) / 2; if (sect(z, m)[1] < DECK) lo = m; else hi = m; } return sect(z, lo)[0] - TH * .6; };
  { const PW = .18, HZo = o.hatchZ ?? -2.1; for (let x = -W / 2 + PW / 2; x < W / 2; x += PW) { const zz = []; for (let i = 0; i <= NS; i++) { const z = zAt(i); if (deckAt(z) >= Math.abs(x) + PW / 2) zz.push(z); } if (zz.length < 2) continue;
      /* o.open (Session 1578, shipbase.js's shipBase, Session 1099): the hatch open to the hold below, the planks cut at the coaming's inside */
      if (o.open && Math.abs(x) - PW / 2 < .6) { const z0 = zz[0], z1 = zz[zz.length - 1]; for (const [a2, b2] of [[z0, HZo - .9], [HZo + .9, z1]]) if (b2 - a2 > .02) put(new THREE.BoxGeometry(PW, .05, b2 - a2), 'deck', x, DECK - .025, (a2 + b2) / 2, 0, 0, 0, .35); continue; }
      put(new THREE.BoxGeometry(PW, .05, zz[zz.length - 1] - zz[0]), 'deck', x, DECK - .025, (zz[0] + zz[zz.length - 1]) / 2, 0, 0, 0, .35); }
    for (const e of [1, -1]) { const rows = []; for (let i = 0; i <= NS; i++) { const z = zAt(i), d = deckAt(z); rows.push([[e * Math.max(0, d - .3), DECK + .002, z], [e * (d + TH * .5), DECK + .002, z]]); } put(shipRibbon(rows, e < 0), 'oak', 0, 0, 0, 0, 0, 0, null); } }
  // the wale along the sheer strake's top
  for (let i = 0; i + 2 <= NS; i += 2) { const za = zAt(i), zc = zAt(i + 2); for (const e of [1, -1]) rod([e * (sect(za, 1)[0] + .02), sheerAt(za) - .02, za], [e * (sect(zc, 1)[0] + .02), sheerAt(zc) - .02, zc], .045, .045, 'cream'); }
  // the castles: a deck CY over the main deck, walled up from the sheer to 0.25 over it, a rail at 1.0 m on stanchions
  const CY = DECK + 2.15, cw = z => sect(z, 1)[0], ZA = zs + 3.8, ZF = zb - 3.0, LAD = 1.25;
  const castleSides = (z0, z1) => { const n = 14; for (const e of [1, -1]) { const rows = []; for (let i = 0; i <= n; i++) { const z = z0 + (z1 - z0) * i / n; rows.push([[e * cw(z), sheerAt(z) - .1, z], [e * cw(z), CY + .25, z]]); }
      put(shipRibbon(rows, e > 0), 'green', 0, 0, 0, 0, 0, 0, null); put(shipRibbon(rows.map(row => row.map(([x, y, z]) => [x - e * .05, y, z])), e < 0), 'green', 0, 0, 0, 0, 0, 0, null);
      for (let i = 0; i < n; i++) { const za = z0 + (z1 - z0) * i / n, zc = z0 + (z1 - z0) * (i + 1) / n; rod([e * (cw(za) + .02), CY + .25, za], [e * (cw(zc) + .02), CY + .25, zc], .035, .035, 'cream'); }
      const top = CY + 1.0, k = Math.max(2, Math.round((z1 - z0) / .8)); for (let i = 0; i <= k; i++) { const z = z0 + .15 + (z1 - z0 - .3) * i / k; if (cw(z) < .3) continue; put(new THREE.BoxGeometry(.08, top - CY - .25, .08), 'oak', e * (cw(z) - .04), (top + CY + .25) / 2, z); }
      for (let i = 0; i < k; i++) { const za = z0 + .15 + (z1 - z0 - .3) * i / k, zc = z0 + .15 + (z1 - z0 - .3) * (i + 1) / k; if (cw(za) < .3 || cw(zc) < .3) continue; rod([e * (cw(za) - .04), top, za], [e * (cw(zc) - .04), top, zc], .045, .045, 'oak'); } }
    const PW = .16; for (let x = -W / 2 + PW / 2; x < W / 2; x += PW) { const zz = []; for (let i = 0; i <= 60; i++) { const z = z0 + (z1 - z0) * i / 60; if (cw(z) - .05 >= Math.abs(x) + PW / 2) zz.push(z); } if (zz.length < 2) continue;
      put(new THREE.BoxGeometry(PW, .06, zz[zz.length - 1] - zz[0] + .05), 'deck', x, CY - .03, (zz[0] + zz[zz.length - 1]) / 2, 0, 0, 0, .35); } };
  castleSides(zs + .25, ZA); castleSides(ZF, zb - .2);
  // a rail across a castle's open edge at z, broken at the ladders' heads (gaps [[x0, x1]...]), and a beam under the edge
  const edgeRail = (z, gaps, dz) => { const a = cw(z) - .04, xs = [-a, ...gaps.flat(), a], top = CY + 1.0; for (let i = 0; i < xs.length; i += 2) { const [x0, x1] = [xs[i], xs[i + 1]]; rod([x0, top, z + dz], [x1, top, z + dz], .045, .045, 'oak'); for (const x of [x0, x1]) put(new THREE.BoxGeometry(.08, top - CY, .08), 'oak', x, (top + CY) / 2, z + dz); }
    put(new THREE.BoxGeometry(2 * a + .08, .12, .18), 'green', 0, CY - .06, z); /* 0.12 deep, so 2.03 m stays under it */ };
  // the aftcastle's bulkhead: boards either side of a doorway, a lintel; a window either side; two ladders
  const door = { x0: -.5, x1: .5, y1: DECK + 1.95 }, ladders = [-1.6, 1.6];
  { const w = Math.min(cw(ZA), deckAt(ZA) + .05); for (const e of [1, -1]) put(new THREE.BoxGeometry(w - door.x1, CY - DECK, .08), 'oak', e * (door.x1 + (w - door.x1) / 2), (DECK + CY) / 2, ZA); put(new THREE.BoxGeometry(door.x1 - door.x0, CY - door.y1, .08), 'oak', 0, (door.y1 + CY) / 2, ZA);
    for (const e of [1, -1]) put(new THREE.BoxGeometry(.5, .4, .02), 'dark', e * 1.05, DECK + 1.45, ZA + .05); put(new THREE.BoxGeometry(1.16, .1, .1), 'cream', 0, door.y1 + .05, ZA + .06);
    for (const lx of ladders) { for (const e of [-1, 1]) rod([lx + e * .28, DECK, ZA + LAD], [lx + e * .28, CY + .05, ZA + .02], .035, .035, 'oak'); for (let k = 1; k <= 7; k++) { const f = k / 8; put(new THREE.BoxGeometry(.56, .04, .2), 'oak', lx, DECK + (CY - DECK) * f, ZA + LAD * (1 - f)); } }
    edgeRail(ZA, ladders.map(lx => [lx - .36, lx + .36]), -.05); }
  // the forecastle: open beneath, its edge carried on two posts; a ladder up the middle from the deck aft of it
  const posts = [-1.75, 1.75], fladder = 0;
  { for (const x of posts) put(new THREE.BoxGeometry(.16, CY - DECK - .16, .16), 'oak', x, (DECK + CY - .16) / 2, ZF + .1);
    for (const e of [-1, 1]) rod([fladder + e * .28, DECK, ZF - LAD], [fladder + e * .28, CY + .05, ZF - .02], .035, .035, 'oak'); for (let k = 1; k <= 7; k++) { const f = k / 8; put(new THREE.BoxGeometry(.56, .04, .2), 'oak', fladder, DECK + (CY - DECK) * f, ZF - LAD * (1 - f)); }
    edgeRail(ZF, [[fladder - .36, fladder + .36]], .05); }
  // the waist's rail, between the castles: stanchions every 0.9 m, a cap rail at 1.0 m over the deck or 0.12 over the sheer
  { const n = Math.round(L / .9), top = z => Math.max(DECK + 1.0, sheerAt(z) + .12), inset = z => sect(z, 1)[0] - .06, ok = z => z > ZA + .3 && z < ZF - .3;
    for (let k = 1; k < n; k++) { const z = zs + L * k / n; if (!ok(z)) continue; for (const e of [1, -1]) put(new THREE.BoxGeometry(.08, top(z) - DECK, .08), 'oak', e * Math.min(inset(z), deckAt(z) - .05), (top(z) + DECK) / 2, z); }
    for (let k = 1; k + 1 < n; k++) { const za = zs + L * k / n, zc = zs + L * (k + 1) / n; if (!ok(za) || !ok(zc)) continue; for (const e of [1, -1]) rod([e * Math.min(inset(za), deckAt(za) - .05), top(za), za], [e * Math.min(inset(zc), deckAt(zc) - .05), top(zc), zc], .045, .045, 'oak'); } }
  // the cargo hatch aft of the mast
  const MZ = .4, HZ = o.hatchZ ?? -2.1, hatch = { x0: -.6, x1: .6, z0: HZ - .9, z1: HZ + .9 };
  { const hw = hatch.x1 - hatch.x0 + .12, hd = hatch.z1 - hatch.z0 + .12; for (const e of [-1, 1]) { put(new THREE.BoxGeometry(hw, .3, .08), 'oak', 0, DECK + .15, HZ + e * hd / 2); put(new THREE.BoxGeometry(.08, .3, hd), 'oak', e * hw / 2, DECK + .15, HZ); }
    if (!o.open) put(new THREE.BoxGeometry(hw - .1, .02, hd - .1), 'dark', 0, DECK + .02, HZ); }
  // cargo along the sides, barrels and crates against the rail; a bucket and a coil of rope by the mast
  const cargo = []; for (const e of [1, -1]) [-.9, 1.8, 3.0].forEach((z, k) => { const x = e * (deckAt(z) - .45); if ((k + (e > 0 ? 0 : 1)) % 2) { put(new THREE.CylinderGeometry(.3, .27, .8, 12), 'oak', x, DECK + .4, z); cargo.push([x, z, .3]); }
    else { put(new THREE.BoxGeometry(.7, .6, .7), 'deck', x, DECK + .3, z, 0, e * .07 * (k - 1)); cargo.push([x, z, .45]); } });
  put(new THREE.TorusGeometry(.22, .05, 6, 18).rotateX(Math.PI / 2), 'rope', .4, DECK + .05, MZ - .6); put(new THREE.CylinderGeometry(.16, .13, .3, 12), 'oak', -.45, DECK + .15, MZ - .7);
  // the mast (raked 4° forward in Aurenne's dress, as the caravel's) and its round fighting top; the shrouds (to port only under a lateen),
  // the forestay to the stem head and another to the bowsprit
  const MH = 10.5, YY = DECK + 8.2, SF = DECK + 2.2, YL = 7.4, RAKE = AURD ? 4 * Math.PI / 180 : 0, mz = y => MZ + (y - (keelAt(MZ) + .1)) * Math.tan(RAKE), HZT = mz(DECK + MH);
  rod([0, keelAt(MZ) + .1, MZ], [0, DECK + MH, HZT], .2, .12, 'spar'); put(new THREE.CylinderGeometry(.45, .38, .5, 12), 'oak', 0, DECK + MH - .7, mz(DECK + MH - .7), RAKE);
  for (const e of AURD ? [-1] : [1, -1]) for (const dz of [-.9, -.3, .3, .9]) { const z = MZ + dz - .2, y = DECK + MH * .9; rod([0, y, mz(y)], [e * (sect(z, 1)[0] + .05), sheerAt(z) - .05, z], .013, .013, 'rope'); }
  { const y = DECK + MH * .95; rod([0, y, mz(y)], [0, sheerAt(zb) + .35, zb + .1], .015, .015, 'rope'); rod([0, y, mz(y)], SP, .013, .013, 'rope'); }
  if (AURD) rod([.18, DECK + MH - .1, HZT], [0, DECK + .4, MZ - .3], .012, .012, 'rope');
  // the rudder hung on the sternpost; the wheel's post and hub on the aftcastle 1 m aft of its edge
  const wz = ZA - 1.0, wy = CY + 1.15;
  { const pb = [zr(zs + .05, 0) + .05, keelAt(zs) - .12], pt = [zs - .12, sheerAt(zs) + .3], ang = Math.atan2(pt[0] - pb[0], pt[1] - pb[1]), rh = Math.hypot(pt[0] - pb[0], pt[1] - pb[1]) - .2;
    put(new THREE.BoxGeometry(.12, rh, .7).translate(0, rh / 2, -.4), 'oak', 0, pb[1] + .05, pb[0] - .02, ang);
    put(new THREE.BoxGeometry(.18, wy - CY, .18), 'oak', 0, (wy + CY) / 2 - .05, wz - .3); put(new THREE.CylinderGeometry(.07, .07, .3, 8).rotateX(Math.PI / 2), 'iron', 0, wy, wz - .12); }
  // o.cabin (Session 1579, shipbase.js's shipBase, Session 1099): the cabin under the aftcastle furnished, the base's other room, on the main
  // deck behind the bulkhead's doorway, in her yard's dress: the box bunk along the port side (rest and save; the Gatelands' blanket green, the
  // Mark's a fur, Aurenne's madder), the sea chest to starboard by the doorway, the chart table against the starboard side aft (the prototype's
  // stood mid-cabin, on the way in from the doorway) with its chart, the log, dividers and a candle, a stool, a shelf of books and bottles over the bunk's head, a lantern from the castle's beam, the island's rug (the Mark's a hide). Its
  // pieces are in cabinItems ([{ name, box }]), with the galley's (Session 1580).
  const cabinItems = [];
  if (o.cabin) { const D = SHIP_BASE_DRESS[MARK ? 'mark' : AURD ? 'aurenne' : 'gatelands'], std = (c, r = 1, m = 0) => new THREE.MeshStandardMaterial({ color: c, roughness: r, metalness: m });
    // the cloth, the paper and the brass share the hull's own materials where one is near enough (a material is a draw): two new at most
    if (!M.cabA) { M.cogLamp = new THREE.MeshStandardMaterial({ color: 0x4d3319, emissive: 0xffb861, emissiveIntensity: 2.0 });
      if (MARK) Object.assign(M, { cabA: M.rope, cabB: M.deck, paper: M.deck, brass: M.gilt, fur: std(0x8a7a66) });
      else if (AURD) { M.madder = M.madder || std(D.cloth[0]); Object.assign(M, { cabA: M.madder, rug0: M.madder, cabB: M.blue, rug1: M.tallow, paper: M.tallow, brass: M.gilt }); }
      else Object.assign(M, { cabA: M.green, cabB: M.cream, rug0: std(D.rug[0]), rug1: M.cream, paper: M.cream, brass: M.iron }); }
    const hbC = (z, y) => { let lo = 0, hi = 1; for (let k = 0; k < 30; k++) { const m = (lo + hi) / 2; if (sect(z, m)[1] < y) lo = m; else hi = m; } return sect(z, lo)[0] - TH - .03; };
    const cin = (z, y) => Math.min(hbC(z, y), cw(z) - .06), bx = (key, w, h, d, x, y, z, ry = 0) => put(new THREE.BoxGeometry(w, h, d), key, x, y, z, 0, ry, 0);
    const cy = (key, r0, r1, h, x, y, z, n = 10) => put(new THREE.CylinderGeometry(r0, r1, h, n), key, x, y, z);
    const it = (name, x0, y0, z0, x1, y1, z1) => cabinItems.push({ name, box: [x0, y0, z0, x1, y1, z1].map(v => +v.toFixed(3)) }), cceil = CY - .12;
    { // the box bunk: its frame, a straw tick, the island's blanket, a bolster, a curtain rail, boards at its ends
      const z0 = -7.2, z1 = -5.3, w = .8, xo = -Math.min(cin(z0, DECK + .1), cin(z1, DECK + .1)) + .02, x = xo + w / 2, y0 = DECK;
      bx('oak', w, .3, z1 - z0, x, y0 + .25, (z0 + z1) / 2); bx('cabB', w - .1, .14, z1 - z0 - .1, x, y0 + .47, (z0 + z1) / 2); bx(MARK ? 'fur' : 'cabA', w - .06, .05, (z1 - z0) * .64, x, y0 + .57, z1 - (z1 - z0) * .34);
      bx('cabB', .5, .1, .3, x, y0 + .58, z0 + .25); for (const zz of [z0, z1]) bx('oak', w + .04, 1.3, .06, x, y0 + .65, zz); bx('oak', .06, .32, z1 - z0, x + w / 2, y0 + .4, (z0 + z1) / 2);
      bx('spar', .04, .04, z1 - z0, x + w / 2 - .02, y0 + 1.3, (z0 + z1) / 2); it('bunk', x - w / 2, y0, z0 - .03, x + w / 2 + .03, y0 + 1.3, z1 + .03); }
    { // the sea chest to starboard of the doorway's way, the island's trim on its lid
      const z = -5.4, w = .5, d = .9, hgt = .55, x = Math.min(cin(z - d / 2, DECK + .6), cin(z + d / 2, DECK + .6)) - w / 2 - .02; bx('oak', w, hgt, d, x, DECK + hgt / 2, z); bx('green', w + .02, .06, d + .02, x, DECK + hgt - .03, z);
      bx('iron', w + .02, .06, .06, x, DECK + hgt * .6, z - d / 2); it('sea chest', x - w / 2, DECK, z - d / 2, x + w / 2, DECK + hgt, z + d / 2); }
    { // the chart table (the map table) against the starboard side aft: a chart, the log, dividers and a candle; a stool inboard of it
      const z = -6.9, w = .8, d = 1.1, ht = .78, x = Math.min(cin(z - d / 2, DECK + .8), cin(z + d / 2, DECK + .8)) - w / 2 - .02; bx('oak', w, .06, d, x, DECK + ht, z); for (const dx of [-w / 2 + .07, w / 2 - .07]) for (const dz of [-d / 2 + .07, d / 2 - .07]) bx('spar', .06, ht - .03, .06, x + dx, DECK + (ht - .03) / 2, z + dz);
      bx('paper', .5, .004, .7, x, DECK + ht + .033, z, .12); bx('spar', .22, .05, .3, x + .15, DECK + ht + .055, z - .4); put(new THREE.CylinderGeometry(.006, .006, .2, 4), 'brass', x - .1, DECK + ht + .04, z + .1, 0, 0, 1.2);
      cy('brass', .05, .06, .03, x + .2, DECK + ht + .045, z + .42, 8); cy('paper', .02, .02, .1, x + .2, DECK + ht + .11, z + .42, 8); put(new THREE.SphereGeometry(.018, 6, 5), 'cogLamp', x + .2, DECK + ht + .175, z + .42);
      cy('spar', .17, .16, .45, x - w / 2 - .22, DECK + .225, z); it('chart table', x - w / 2, DECK, z - d / 2, x + w / 2, DECK + ht + .2, z + d / 2); it('stool', x - w / 2 - .39, DECK, z - .17, x - w / 2 - .05, DECK + .45, z + .17); }
    { // a lantern from the castle's beam, the rug, a shelf of books and bottles on the after wall over the bunk's head
      cy('brass', .1, .12, .26, .55, cceil - .45, -6.4, 8); put(new THREE.SphereGeometry(.06, 8, 6), 'cogLamp', .55, cceil - .46, -6.4); bx('iron', .01, .3, .01, .55, cceil - .17, -6.4);
      if (MARK) put(new THREE.CircleGeometry(.7, 9).scale(1.2, 1, 1).rotateX(-Math.PI / 2), 'fur', .3, DECK + .006, -5.6); else { bx('rug0', 1.2, .01, 1.0, .3, DECK + .006, -5.6); bx('rug1', .9, .012, .7, .3, DECK + .008, -5.6); }
      const zh = zs + .25 + .9, sw = 2 * Math.min(cin(zh, DECK + 1.5), 1.2) - .2; bx('oak', sw, .04, .25, 0, DECK + 1.5, zh); for (let k = 0; k < 7; k++) bx(k % 3 ? 'cabA' : 'green', .06, .22, .18, -sw / 2 + .2 + k * .1, DECK + 1.63, zh);
      for (let k = 0; k < 4; k++) cy('brass', .04, .045, .2, sw / 2 - .2 - k * .13, DECK + 1.62, zh, 8); it('shelf', -sw / 2, DECK + 1.48, zh - .13, sw / 2, DECK + 1.75, zh + .13); }
    { // Session 1580 — the galley under the forecastle, open beneath on its posts: a firebox on a tray of sand (the Gatelands' brick, the Mark's
      // iron firepan on stones, Aurenne's faced in blue tile) with an iron pot on a crane, a water cask; the fire glows, and lights nothing
      if (!M.brick) M.brick = MARK || AURD ? M.iron : mat('stone', { ns: .8, color: 0xb0604a });
      const x = -.95, z = 6.55, w = 1.1, d = .9, ht = .55; bx('deck', w + .2, .06, d + .2, x, DECK + .03, z);
      if (MARK) { for (let k = 0; k < 7; k++) { const a = k / 7 * Math.PI * 2; put(new THREE.DodecahedronGeometry(.13), 'dark', x + Math.cos(a) * .38, DECK + .14, z + Math.sin(a) * .32); } cy('iron', .36, .3, .12, x, DECK + .3, z, 14); }
      else { bx(AURD ? 'blue' : 'brick', w, ht, d, x, DECK + .06 + ht / 2, z); bx('dark', w - .3, .08, d - .3, x, DECK + .06 + ht - .02, z); }
      put(new THREE.SphereGeometry(.16, 10, 8).scale(1.3, .6, 1), 'cogLamp', x, DECK + (MARK ? .4 : .06 + ht + .02), z);
      const kx = x - w / 2 - .05; bx('iron', .05, 1.3, .05, kx, DECK + .7, z); bx('iron', .7, .04, .04, kx + .35, DECK + 1.32, z); bx('iron', .01, .3, .01, x, DECK + 1.15, z);
      put(new THREE.SphereGeometry(.2, 12, 8, 0, Math.PI * 2, Math.PI * .35, Math.PI * .65), 'iron', x, DECK + 1.05, z);
      it('firebox', x - w / 2 - .1, DECK, z - d / 2 - .1, x + w / 2 + .1, DECK + 1.35, z + d / 2 + .1);
      /* the cask at x 1.6, not the prototype's 0.9, so the way forward under the forecastle stays open beside it */
      const cx = 1.6, czk = 6.3; cy('oak', .28, .24, .7, cx, DECK + .35, czk, 12); for (const y of [.1, .6]) cy('iron', .29, .29, .04, cx, DECK + y, czk, 12); it('water cask', cx - .28, DECK, czk - .28, cx + .28, DECK + .7, czk + .28); }
  }
  const hull = bake(M), rigs = [];
  // the rig in its own frame: the Gatelands' yard and square sail about the mast, bellied forward; the Mark's boom, gaff and main about
  // the mast, the boom 2.15 m over the deck and ending 1.1 m short of the aftcastle; Aurenne's yard and lateen slung to starboard at 56°
  // from a sling 8 m up, about the sling, the tack short of the forecastle and the clew 1.4 m short of the aftcastle, the foot 2.5 m up
  let sling = null;
  if (AURD) { const xs = .36, sy = 8.0, A = 56 * Math.PI / 180, fw = (sy - 2.6) / Math.sin(A), af = 10.0; sling = { y: DECK + sy, z: mz(DECK + sy) };
    const T = [xs, sling.y - fw * Math.sin(A), fw * Math.cos(A)], P = [xs, sling.y + af * Math.sin(A), -af * Math.cos(A)], C = [xs, DECK + 2.5, ZA + 1.4 - sling.z];
    rod(T, P, .09, .06, 'spar'); put(shipLateenSail([T[0], T[1] - .05, T[2] - .15], [P[0], P[1] - .15, P[2] + .2], C, 1, .5), 'sail', 0, 0, 0, 0, 0, 0, null);
    rigs.push({ ...bake(M), z: sling.z, type: 'lateen' }); }
  else if (MARK) { const BY = DECK + 2.15, BZ1 = ZA + 1.1 - MZ, TY = DECK + 7.6, GL = 4.4, GA = 28 * Math.PI / 180, PK = [0, TY + GL * Math.sin(GA), -.2 - GL * Math.cos(GA)];
    rod([0, BY, -.2], [0, BY, BZ1], .085, .07, 'spar'); rod([0, TY, -.2], PK, .07, .06, 'spar');
    put(shipQuadSail([0, BY + .1, -.25], [0, BY + .1, BZ1 + .25], PK, [0, TY - .05, -.25], .5), 'sail', 0, 0, 0, 0, 0, 0, null);
    rigs.push({ ...bake(M), z: MZ, type: 'gaff' }); }
  else { rod([-YL / 2, YY, .16], [YL / 2, YY, .16], .08, .08, 'spar');
    const g = new THREE.PlaneGeometry(YL - .3, YY - SF - .1, 14, 12), P = g.attributes.position; for (let k = 0; k < P.count; k++) { const x = P.getX(k) / (YL / 2), y = P.getY(k) / ((YY - SF) / 2); P.setZ(k, .6 * (1 - x * x) * (1 - .6 * y * y) + .1 * (1 - y) / 2); }
    g.computeVertexNormals(); put(g, 'sail', 0, (YY + SF) / 2 - .05, .25, 0, 0, 0, null); rigs.push({ ...bake(M), z: MZ, type: 'square' }); }
  // the wheel: its rim and eight spokes about the hub, which the game turns with the helm
  { put(new THREE.TorusGeometry(.62, .035, 6, 24), 'oak'); for (let k = 0; k < 8; k++) { const a = k * Math.PI / 4; rod([0, 0, 0], [.78 * Math.cos(a), .78 * Math.sin(a), 0], .022, .018, 'oak'); } }
  const wb = bake(M), wheel = new THREE.Group(); wheel.name = 'wheel'; wheel.position.set(0, wy, wz); { const wm = new THREE.Mesh(wb.geo, wb.mats); wm.castShadow = true; wheel.add(wm); }
  const at = z => ({ b: sect(z, 1)[0], g: sheerAt(z), k: keelAt(z), sect: u => sect(z, u) });
  return { hull, rig: rigs[0], rigs, wheel, L, W, zs, zb, mast: [0, MZ], hatch, deckAt, at, sheerAt, sailFoot: MARK ? DECK + 2.25 : AURD ? DECK + 2.5 : SF, cargo, dress: MARK ? 'mark' : AURD ? 'aurenne' : 'gatelands', head: false, shields: [],
    cabinItems, castle: { z0: zs + .25, z1: ZA, y: CY, cw, door, ladders, lad: LAD }, fore: { z0: ZF, z1: zb - .2, y: CY, cw, ladders: [fladder], lad: LAD, posts }, helm: { y: wy, z: wz - 1.1, wheelZ: wz },
    tris: Math.round(hull.tris + rigs.reduce((a, q) => a + q.tris, 0) + wb.tris), draws: hull.mats.length + rigs.reduce((a, q) => a + q.mats.length, 0) + wb.mats.length };
}
// ── the galleon (Session 1552; ships.js's gatelandsGalleon, Session 896, Michael's A on #323, and its markGalleon and aurenneGalleon,
// Sessions 1045 and 1046, Michael's A on #347): the game's galleon (L 22, W 7.0, draft 1.5), carvel with a little tumblehome, a long raked
// stem and a square stern of 0.62 of the beam with five windows; the deck at 1.0. The quarterdeck is a real deck 2.15 m over the main one
// across her last 6 m, the great cabin under it behind a bulkhead with a doorway, a ladder up either side, the wheel on it and the mizzen
// through it; the forecastle over her first 3.5 m, open beneath on two posts, a ladder up the middle. Two hatches, one either side of the
// main mast; six gun-port lids a side, closed, on the gun deck under the main deck (paint: no guns). Sold at every island's yards, so she
// wears the yard's dress (#839 A): the Gatelands' (tarred, oiled oak, the top two strakes and the castles green under cream; fore and main
// square with courses and topsails, the harp on the main course, a gaff mizzen, a spritsail under the bowsprit), the Mark's (the same rig
// in tanned cloths; red-brown below, tarred black above and on the castles, the transom and the lids, gilt), Aurenne's (tallow below,
// oiled above, blue and gilt; the fore square with the sun-star on its course and the spritsail kept, the main and the mizzen lateens on
// masts raked 4° forward, shrouds to port only).
//   PKIT.ships.galleon(o) -> as PKIT.ships.cog, with hatches (both), ports ([[side, z, y]]), masts ([[x, z]]: main, fore, mizzen) and rigs
//   [square, square, gaff] or [lateen, square, lateen] (the main first). o.dress as the sloop's. o.cabin (Session 1581) the great cabin furnished; o.open (Session 1584) both hatches open to the hold (galleonBase).
//   Differences from the prototype: 48 sections and 14 strakes (its 60 and 16 put her past 40k triangles); each rig in its own frame (the
//   squares' yards and sails about their masts, the gaff about the mizzen, each lateen about its sling, slung to starboard), which the
//   game trims; the braces, the gaff's sheet, the lateens' tacks and sheets are left off, as the other hulls'; the spritsail stays in
//   the hull, square under the bowsprit; a bucket and a coil of rope by the main mast, as the other hulls'.
function mkGalleon(o = {}) {
  const MARK = o.dress === 'mark', AURD = o.dress === 'aurenne', M = shipMats(o.dress), { put, rod, bake } = shipKit();
  /* the Mark's sails are the cloths whole; the Gatelands' plain sails and Aurenne's topsail and spritsail take a corner of the map, clear of the harp and the star */
  const corner = g => { if (MARK) return; const U = g.attributes.uv, c = AURD ? .18 : .3; for (let k = 0; k < U.count; k++) U.setXY(k, U.getX(k) * c, U.getY(k) * c); };
  const L = 22, W = 7.0, DRAFT = 1.5, DECK = 1.0, SHEER = 1.5, BOW = .7, STERN = 1.25, NS = 48, NSTR = 14, TH = .05, TRN = .62;
  const zs = -L / 2, zb = L / 2, ZT = zs + .05;
  const sheerAt = z => SHEER + BOW * Math.max(0, z / zb) ** 2 + STERN * Math.max(0, z / zs) ** 2;
  const beamAt = z => { const t = Math.max(-1, Math.min(1, z / (zb - .05))); return t > 0 ? W / 2 / .987 * Math.max(0, 1 - t ** 2.0) ** .5 : W / 2 / .987 * (TRN + (1 - TRN) * Math.max(0, 1 - Math.abs(t) ** 2.4) ** .55); };
  const keelAt = z => { const t = z / zb; return -DRAFT * (t > 0 ? 1 - .45 * t ** 3 : 1 - .2 * t * t); };
  // the tumblehome: the topsides draw in over the last quarter of the girth
  const sect = (z, u) => { const b = beamAt(z), k = keelAt(z), s = sheerAt(z), y = k + (s - k) * u; return [b * Math.sin(Math.PI / 2 * Math.min(1, u * 1.18)) ** .8 * (1 + .03 * Math.max(0, u - .8) / .2) * (1 - .06 * Math.max(0, u - .75) / .25), y]; };
  const zr = (z, u) => z > 0 ? z * (1 - .16 * (1 - u) ** 1.6 * (z / zb) ** 6) : z;
  const zAt = i => ZT + (zb - .05 - ZT) * i / NS;
  const norm = (z, u) => { const a = sect(z, Math.max(0, u - .01)), b = sect(z, Math.min(1, u + .01)), dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy) || 1; return [dy / l, -dx / l]; };
  // carvel: the strakes flush; below the water tarred (the Mark's red-brown, Aurenne's tallow), above oiled (the Mark's tarred), the top two the band
  const KR = 4; for (let s = 0; s < NSTR; s++) { const u0 = s / NSTR, u1 = (s + 1) / NSTR, outer = [], inner = [];
    for (let i = 0; i <= NS; i++) { const z = zAt(i), ro = [], ri = []; for (let k = 0; k <= KR; k++) { const u = u0 + (u1 - u0) * k / KR, p = sect(z, u), n = norm(z, u); ro.push([p[0] + n[0] * TH / 2, p[1] + n[1] * TH / 2, zr(z, u)]); ri.push([p[0] - n[0] * TH / 2, p[1] - n[1] * TH / 2, zr(z, u)]); } outer.push(ro); inner.push(ri); }
    const low = sect(0, (u0 + u1) / 2)[1] < .02, key = s >= NSTR - 2 ? 'green' : MARK ? (low ? 'bottom' : 'tar') : AURD ? (low ? 'tallow' : 'hull') : low ? 'tar' : 'oak';
    for (const side of [1, -1]) { const mir = rows => rows.map(row => row.map(([x, y, z]) => [x * side, y, z])); put(shipRibbon(mir(outer), side > 0), key, 0, 0, 0, 0, 0, 0, null); put(shipRibbon(mir(inner), side < 0), key, 0, 0, 0, 0, 0, 0, null); } }
  // the transom, five stern windows in it under a cream band
  const TRK = MARK ? 'tar' : AURD ? 'hull' : 'oak';
  { const pts = []; for (let k = 0; k <= 30; k++) { const [x, y] = sect(ZT, k / 30); pts.push(new THREE.Vector2(x + TH / 2, y)); } for (let k = 30; k >= 0; k--) { const [x, y] = sect(ZT, k / 30); pts.push(new THREE.Vector2(-x - TH / 2, y)); }
    put(new THREE.ExtrudeGeometry(new THREE.Shape(pts), { depth: .06, bevelEnabled: false }), TRK, 0, 0, ZT - .06, 0, 0, 0, .6);
    const wy = DECK + 1.25; for (let k = -2; k <= 2; k++) { put(new THREE.BoxGeometry(.5, .6, .03), 'dark', k * .72, wy, ZT - .075); put(new THREE.BoxGeometry(.62, .08, .05), 'cream', k * .72, wy + .34, ZT - .08); } put(new THREE.BoxGeometry(4.2, .1, .08), 'cream', 0, wy - .38, ZT - .08); }
  // the keel; the stem following the planking's curve to a long head
  { const pts = []; for (let i = 0; i <= NS; i++) { const z = zAt(i); pts.push([zr(z, 0), keelAt(z) - .06]); }
    for (let k = 1; k <= 12; k++) { const u = k / 12; pts.push([zr(zb - .05, u) + .08 * u + .04, sect(zb - .05, u)[1] + (k === 12 ? .5 : 0)]); }
    for (let i = 0; i + 1 < pts.length; i++) { const [z0, y0] = pts[i], [z1, y1] = pts[i + 1]; put(new THREE.BoxGeometry(.22, .26, Math.hypot(z1 - z0, y1 - y0) + .03), 'tar', 0, (y0 + y1) / 2, (z0 + z1) / 2, -Math.atan2(y1 - y0, z1 - z0)); } }
  // the bowsprit, 6 m, steeved up
  const SPL = 6.0, SP = [0, sheerAt(zb) + .4 + SPL * Math.sin(.28), zb + SPL * Math.cos(.28)]; rod([0, sheerAt(zb) - .1, zb - 2.0], SP, .14, .08, 'spar');
  // the main deck, fore-and-aft planks on the half-breadth (under both castles too: the great cabin's floor), a covering board out to the planking
  const deckAt = z => { let lo = 0, hi = 1; for (let k = 0; k < 30; k++) { const m = (lo + hi) / 2; if (sect(z, m)[1] < DECK) lo = m; else hi = m; } return sect(z, lo)[0] - TH * .6; };
  { const PW = .18; for (let x = -W / 2 + PW / 2; x < W / 2; x += PW) { const zz = []; for (let i = 0; i <= NS; i++) { const z = zAt(i); if (deckAt(z) >= Math.abs(x) + PW / 2) zz.push(z); } if (zz.length < 2) continue;
      const z0 = zz[0] - (zz[0] < ZT + .1 ? .06 : 0), z1 = zz[zz.length - 1];
      /* o.open (Session 1584, ships.js's Session 1150): both hatches open to the hold, the planks cut at the coamings' inside */
      if (o.open && Math.abs(x) - PW / 2 < .7) { for (const [a2, b2] of [[z0, -3.2], [-1.6, 1.2], [2.6, z1]]) if (b2 - a2 > .02) put(new THREE.BoxGeometry(PW, .05, b2 - a2), 'deck', x, DECK - .025, (a2 + b2) / 2, 0, 0, 0, .35); continue; }
      put(new THREE.BoxGeometry(PW, .05, z1 - z0), 'deck', x, DECK - .025, (z0 + z1) / 2, 0, 0, 0, .35); }
    for (const e of [1, -1]) { const rows = []; for (let i = 0; i <= NS; i++) { const z = zAt(i), d = deckAt(z); rows.push([[e * Math.max(0, d - .3), DECK + .002, z], [e * (d + TH * .5), DECK + .002, z]]); } put(shipRibbon(rows, e < 0), 'oak', 0, 0, 0, 0, 0, 0, null); } }
  // the wale under the band; six gun-port lids a side on the gun deck, closed, each with its iron hinge strap
  for (let i = 0; i + 2 <= NS; i += 2) { const za = zAt(i), zc = zAt(i + 2), u = (NSTR - 2) / NSTR; for (const e of [1, -1]) rod([e * (sect(za, u)[0] + .035), sect(za, u)[1], zr(za, u)], [e * (sect(zc, u)[0] + .035), sect(zc, u)[1], zr(zc, u)], .05, .05, 'cream'); }
  const ports = []; for (const e of [1, -1]) for (let k = 0; k < 6; k++) { const z = -5.5 + k * 2.1, y = DECK - .45, u = (y - keelAt(z)) / (sheerAt(z) - keelAt(z)), p = sect(z, u), n = norm(z, u);
    put(new THREE.BoxGeometry(.06, .5, .56), 'green', e * (p[0] + n[0] * .04), y, z); put(new THREE.BoxGeometry(.03, .06, .56), 'iron', e * (p[0] + n[0] * .08), y + .18, z); ports.push([e, +z.toFixed(2), +y.toFixed(2)]); }
  // the castles, as the cog's: boards from the sheer to 0.25 m over the castle's deck, a cream band, a rail at 1.0 m on stanchions
  const CY = DECK + 2.15, cw = z => sect(z, 1)[0], ZA = zs + 6.0, ZF = zb - 3.5, LAD = 1.25;
  const castleSides = (z0, z1) => { const n = 18; for (const e of [1, -1]) { const rows = []; for (let i = 0; i <= n; i++) { const z = z0 + (z1 - z0) * i / n; rows.push([[e * cw(z), sheerAt(z) - .1, z], [e * cw(z), CY + .25, z]]); }
      put(shipRibbon(rows, e > 0), 'green', 0, 0, 0, 0, 0, 0, null); put(shipRibbon(rows.map(row => row.map(([x, y, z]) => [x - e * .05, y, z])), e < 0), 'green', 0, 0, 0, 0, 0, 0, null);
      for (let i = 0; i < n; i++) { const za = z0 + (z1 - z0) * i / n, zc = z0 + (z1 - z0) * (i + 1) / n; rod([e * (cw(za) + .02), CY + .25, za], [e * (cw(zc) + .02), CY + .25, zc], .035, .035, 'cream'); }
      const top = CY + 1.0, k = Math.max(2, Math.round((z1 - z0) / .8)); for (let i = 0; i <= k; i++) { const z = z0 + .15 + (z1 - z0 - .3) * i / k; if (cw(z) < .3) continue; put(new THREE.BoxGeometry(.08, top - CY - .25, .08), 'oak', e * (cw(z) - .04), (top + CY + .25) / 2, z); }
      for (let i = 0; i < k; i++) { const za = z0 + .15 + (z1 - z0 - .3) * i / k, zc = z0 + .15 + (z1 - z0 - .3) * (i + 1) / k; if (cw(za) < .3 || cw(zc) < .3) continue; rod([e * (cw(za) - .04), top, za], [e * (cw(zc) - .04), top, zc], .045, .045, 'oak'); } }
    const PW = .16; for (let x = -W / 2 + PW / 2; x < W / 2; x += PW) { const zz = []; for (let i = 0; i <= 60; i++) { const z = z0 + (z1 - z0) * i / 60; if (cw(z) - .05 >= Math.abs(x) + PW / 2) zz.push(z); } if (zz.length < 2) continue;
      put(new THREE.BoxGeometry(PW, .06, zz[zz.length - 1] - zz[0] + .05), 'deck', x, CY - .03, (zz[0] + zz[zz.length - 1]) / 2, 0, 0, 0, .35); } };
  castleSides(ZT, ZA); castleSides(ZF, zb - .3);
  // the quarterdeck's after wall over the transom, the taffrail across it, two lanterns on its corners
  { const a = cw(ZT) - .04; put(new THREE.BoxGeometry(2 * cw(ZT) + .06, CY + .25 - sheerAt(ZT) + .1, .06), 'green', 0, (sheerAt(ZT) - .1 + CY + .25) / 2, ZT - .03); rod([-a, CY + 1.0, ZT + .15], [a, CY + 1.0, ZT + .15], .045, .045, 'oak');
    for (let x = -a; x <= a + .01; x += a / 4) put(new THREE.BoxGeometry(.08, .75, .08), 'oak', x, CY + .625, ZT + .15);
    for (const e of [1, -1]) { const x = e * (a - .15); rod([x, CY + 1.0, ZT + .15], [x, CY + 1.3, ZT + .15], .03, .03, 'iron'); put(new THREE.CylinderGeometry(.14, .11, .34, 8), 'cream', x, CY + 1.47, ZT + .15); } }
  // a rail across a castle's open edge at z, broken at the ladders' heads, and a beam under the edge (0.12 deep, so 2.03 m stays under it)
  const edgeRail = (z, gaps, dz) => { const a = cw(z) - .04, xs = [-a, ...gaps.flat(), a], top = CY + 1.0; for (let i = 0; i < xs.length; i += 2) { const [x0, x1] = [xs[i], xs[i + 1]]; rod([x0, top, z + dz], [x1, top, z + dz], .045, .045, 'oak'); for (const x of [x0, x1]) put(new THREE.BoxGeometry(.08, top - CY, .08), 'oak', x, (top + CY) / 2, z + dz); }
    put(new THREE.BoxGeometry(2 * a + .08, .12, .18), 'green', 0, CY - .06, z); };
  // the quarterdeck's bulkhead: boards either side of a doorway, a lintel; a window either side; two ladders
  const door = { x0: -.5, x1: .5, y1: DECK + 1.95 }, ladders = [-2.0, 2.0];
  { const w = Math.min(cw(ZA), deckAt(ZA) + .05); for (const e of [1, -1]) put(new THREE.BoxGeometry(w - door.x1, CY - DECK, .08), 'oak', e * (door.x1 + (w - door.x1) / 2), (DECK + CY) / 2, ZA); put(new THREE.BoxGeometry(door.x1 - door.x0, CY - door.y1, .08), 'oak', 0, (door.y1 + CY) / 2, ZA);
    for (const e of [1, -1]) put(new THREE.BoxGeometry(.6, .45, .02), 'dark', e * 1.2, DECK + 1.45, ZA + .05); put(new THREE.BoxGeometry(1.16, .1, .1), 'cream', 0, door.y1 + .05, ZA + .06);
    for (const lx of ladders) { for (const e of [-1, 1]) rod([lx + e * .28, DECK, ZA + LAD], [lx + e * .28, CY + .05, ZA + .02], .035, .035, 'oak'); for (let k = 1; k <= 7; k++) { const f = k / 8; put(new THREE.BoxGeometry(.56, .04, .2), 'oak', lx, DECK + (CY - DECK) * f, ZA + LAD * (1 - f)); } }
    edgeRail(ZA, ladders.map(lx => [lx - .36, lx + .36]), -.05); }
  // the forecastle: open beneath, its edge carried on two posts; a ladder up the middle from the deck aft of it
  const posts = [-2.0, 2.0], fladder = 0;
  { for (const x of posts) put(new THREE.BoxGeometry(.18, CY - DECK - .12, .18), 'oak', x, (DECK + CY - .12) / 2, ZF + .1);
    for (const e of [-1, 1]) rod([fladder + e * .28, DECK, ZF - LAD], [fladder + e * .28, CY + .05, ZF - .02], .035, .035, 'oak'); for (let k = 1; k <= 7; k++) { const f = k / 8; put(new THREE.BoxGeometry(.56, .04, .2), 'oak', fladder, DECK + (CY - DECK) * f, ZF - LAD * (1 - f)); }
    edgeRail(ZF, [[fladder - .36, fladder + .36]], .05); }
  // the waist's rail, between the castles
  { const n = Math.round(L / .9), top = z => Math.max(DECK + 1.0, sheerAt(z) + .12), inset = z => sect(z, 1)[0] - .06, ok = z => z > ZA + .3 && z < ZF - .3;
    for (let k = 1; k < n; k++) { const z = zs + L * k / n; if (!ok(z)) continue; for (const e of [1, -1]) put(new THREE.BoxGeometry(.08, top(z) - DECK, .08), 'oak', e * Math.min(inset(z), deckAt(z) - .05), (top(z) + DECK) / 2, z); }
    for (let k = 1; k + 1 < n; k++) { const za = zs + L * k / n, zc = zs + L * (k + 1) / n; if (!ok(za) || !ok(zc)) continue; for (const e of [1, -1]) rod([e * Math.min(inset(za), deckAt(za) - .05), top(za), za], [e * Math.min(inset(zc), deckAt(zc) - .05), top(zc), zc], .045, .045, 'oak'); } }
  // two hatches, one either side of the main mast; the after one is the way below
  const hatches = [{ x0: -.7, x1: .7, z0: -3.2, z1: -1.6 }, { x0: -.7, x1: .7, z0: 1.2, z1: 2.6 }];
  for (const h of hatches) { const hz = (h.z0 + h.z1) / 2, hw = h.x1 - h.x0 + .12, hd = h.z1 - h.z0 + .12; for (const e of [-1, 1]) { put(new THREE.BoxGeometry(hw, .3, .08), 'oak', 0, DECK + .15, hz + e * hd / 2); put(new THREE.BoxGeometry(.08, .3, hd), 'oak', e * hw / 2, DECK + .15, hz); } if (!o.open) put(new THREE.BoxGeometry(hw - .1, .02, hd - .1), 'dark', 0, DECK + .02, hz); }
  put(new THREE.TorusGeometry(.22, .05, 6, 18).rotateX(Math.PI / 2), 'rope', .4, DECK + .05, -1.0); put(new THREE.CylinderGeometry(.16, .13, .3, 12), 'oak', -.45, DECK + .15, -1.1);
  // the masts: [k, mast z, the deck it stands on, its head over that deck, the round top's height or 0]. The squares stand upright; under
  // Aurenne's lateens the main and the mizzen are raked 4° forward
  const RAKE = AURD ? 4 * Math.PI / 180 : 0, mastZ = (mz, y, rk) => mz + (y - (keelAt(mz) + .1)) * Math.tan(rk);
  const MAIN = -.4, FORE = 5.2, MIZ = -8.0, masts = [];
  const stand = (mz, top, r0, r1, rk) => { rod([0, keelAt(mz) + .1, mz], [0, top, mastZ(mz, top, rk)], r0, r1, 'spar'); masts.push([0, +mastZ(mz, DECK, rk).toFixed(3)]); };
  // the shrouds from under a mast's top to the rail (or a castle's top where they come down on one), both sides or to port only
  const shrouds = (mz, y, dzs, sides, rk) => { for (const e of sides) for (const dz of dzs) { const z = mz + dz - .3; rod([0, y, mastZ(mz, y, rk)], [e * (z < ZA || z > ZF ? cw(z) - .05 : sect(z, 1)[0] + .05), z < ZA || z > ZF ? CY + .2 : sheerAt(z) - .05, z], .014, .014, 'rope'); } };
  // the main: square with the harp, 13 m, its course's yard 9.4 m up; under a lateen 13 m with its round top 9.9 m up
  stand(MAIN, DECK + 13, .24, .14, RAKE); put(new THREE.CylinderGeometry(.55, .45, .45, 12), 'oak', 0, DECK + 9.9, mastZ(MAIN, DECK + 9.9, RAKE), RAKE);
  shrouds(MAIN, DECK + 9.8, AURD ? [-.8, 0, .8] : [-1.0, -.4, .2, .8], AURD ? [-1] : [1, -1], RAKE);
  // the fore: square, 10.5 m, its course's yard 7.4 m up (the sun-star on Aurenne's course)
  stand(FORE, DECK + 10.5, .24, .14, 0); put(new THREE.CylinderGeometry(.55, .45, .45, 12), 'oak', 0, DECK + 7.9, FORE); shrouds(FORE, DECK + 7.8, [-1.0, -.4, .2, .8], [1, -1], 0);
  // the mizzen through the quarterdeck: under the gaff 10.8 m from the deck; under a lateen 6.2 m over the quarterdeck
  const MZH = AURD ? CY + 6.2 : DECK + 10.8; stand(MIZ, MZH, .17, .11, RAKE); shrouds(MIZ, MZH - .4, AURD ? [-.8, 0, .8] : [-.2, .6], AURD ? [-1] : [1, -1], RAKE);
  // the stays: the main's head to the fore's, the fore's to the bowsprit's end; a halyard down each lateen's mast
  rod([0, DECK + 13 * .72, mastZ(MAIN, DECK + 13 * .72, RAKE)], [0, DECK + 10.5 * .72, FORE], .025, .025, 'rope'); rod([0, DECK + 10.5 * .72, FORE], SP, .025, .025, 'rope');
  if (AURD) for (const [mz, top] of [[MAIN, DECK + 13], [MIZ, MZH]]) rod([.18, top - .1, mastZ(mz, top - .1, RAKE)], [0, (mz === MIZ ? CY : DECK) + .4, mz - .3], .012, .012, 'rope');
  // the spritsail on its yard under the bowsprit, a third of the way out
  { const t = .4, sy = sheerAt(zb) + .4 + SPL * t * Math.sin(.28) - .25, sz = zb + SPL * t * Math.cos(.28); rod([-2.2, sy, sz], [2.2, sy, sz], .05, .05, 'spar'); const g = new THREE.PlaneGeometry(4.0, 1.8, 6, 4), P = g.attributes.position;
    for (let k = 0; k < P.count; k++) P.setZ(k, .25 * (1 - (P.getX(k) / 2) ** 2)); g.computeVertexNormals(); corner(g); put(g, 'sail', 0, sy - .95, sz + .1, 0, 0, 0, null); }
  // the rudder on the transom, its head through the quarterdeck; the wheel's post and hub on the quarterdeck 1 m aft of its edge
  const wz = ZA - 1.0, wy = CY + 1.15;
  { const ry0 = keelAt(zs) - .05; put(new THREE.BoxGeometry(.14, sheerAt(ZT) - ry0, .9), 'oak', 0, (ry0 + sheerAt(ZT)) / 2, ZT - .5); rod([0, sheerAt(ZT) - .2, ZT - .2], [0, CY + .3, ZT - .2], .09, .09, 'oak');
    put(new THREE.BoxGeometry(.18, wy - CY, .18), 'oak', 0, (wy + CY) / 2 - .05, wz - .3); put(new THREE.CylinderGeometry(.07, .07, .3, 8).rotateX(Math.PI / 2), 'iron', 0, wy, wz - .12); }
  // o.cabin (Session 1581, shipbase.js's galleonBase, Session 1150): the great cabin under the quarterdeck furnished, on the main deck behind
  // the bulkhead's doorway, in her yard's dress: the locker seat under her five stern windows (their panes inside too) and the captain's table before it with two
  // stools; the box bed to port forward of the mizzen (her berth: rest and save), the sea chest at its foot; the chart table and its globe to
  // starboard, a stool; the sideboard against the bulkhead to starboard of the doorway, bottles and two cups on it; two lanterns from the
  // quarterdeck's beams; the island's rug (the Mark's a hide). The mizzen already stands through it. Its pieces are in cabinItems
  // ([{ name, box }]; the bed is named 'bunk', the game's berth), with the galley's under the forecastle (Session 1585).
  const cabinItems = [];
  if (o.cabin) { const D = SHIP_BASE_DRESS[MARK ? 'mark' : AURD ? 'aurenne' : 'gatelands'], std = (c, r = 1, m = 0) => new THREE.MeshStandardMaterial({ color: c, roughness: r, metalness: m });
    // the cloth, the paper, the glass and the brass share the hull's own materials where one is near enough (a material is a draw)
    if (!M.gcabA) { M.galLamp = new THREE.MeshStandardMaterial({ color: 0x4d3319, emissive: 0xffb861, emissiveIntensity: 2.0 });
      if (MARK) Object.assign(M, { gcabA: M.rope, gcabB: M.deck, gpaper: M.deck, gbrass: M.gilt, gglass: M.tar, gfur: std(0x8a7a66) });
      else if (AURD) { M.madder = M.madder || std(D.cloth[0]); Object.assign(M, { gcabA: M.madder, grug0: M.madder, gcabB: M.blue, grug1: M.tallow, gpaper: M.tallow, gbrass: M.gilt, gglass: M.blue }); }
      else Object.assign(M, { gcabA: M.green, gcabB: M.cream, grug0: std(D.rug[0]), grug1: M.cream, gpaper: M.cream, gbrass: M.iron, gglass: M.green }); }
    const hbC = (z, y) => { let lo = 0, hi = 1; for (let k = 0; k < 30; k++) { const m = (lo + hi) / 2; if (sect(z, m)[1] < y) lo = m; else hi = m; } return sect(z, lo)[0] - TH - .03; };
    const cin = (z, y) => Math.min(hbC(z, y), cw(z) - .11), bx = (key, w, h, d, x, y, z, ry = 0) => put(new THREE.BoxGeometry(w, h, d), key, x, y, z, 0, ry, 0);
    const cy = (key, r0, r1, h, x, y, z, n = 10) => put(new THREE.CylinderGeometry(r0, r1, h, n), key, x, y, z);
    const it = (name, x0, y0, z0, x1, y1, z1) => cabinItems.push({ name, box: [x0, y0, z0, x1, y1, z1].map(v => +v.toFixed(3)) }), cceil = CY - .12;
    const lantern = (x, z, hang) => { cy('gbrass', .1, .12, .26, x, cceil - hang, z, 8); put(new THREE.SphereGeometry(.06, 8, 6), 'galLamp', x, cceil - hang - .01, z); bx('iron', .01, hang - .13, .01, x, cceil - (hang - .13) / 2, z); };
    { // the locker seat under the stern windows, its cushion in the island's cloth
      const z0 = ZT + .1, d = .5, z1 = z0 + d, hw = Math.min(cin(z0, DECK + .02), cin(z1, DECK + .02), cin(z0, DECK + .5), cin(z1, DECK + .5)) - .04; bx('oak', 2 * hw, .45, d, 0, DECK + .225, (z0 + z1) / 2); bx('gcabA', 2 * hw - .1, .08, d - .06, 0, DECK + .49, (z0 + z1) / 2);
      it('locker seat', -hw, DECK, z0, hw, DECK + .53, z1);
      /* the five stern windows from inside, pale with the day, over the seat (the transom's own panes are on its outside) */
      for (let k = -2; k <= 2; k++) { bx('gpaper', .46, .56, .015, k * .72, DECK + 1.25, ZT + .012); bx('spar', .04, .56, .03, k * .72, DECK + 1.25, ZT + .02); } }
    { // the captain's table before it, with two stools
      const z = ZT + 1.35, w = 1.8, d = .8, ht = .76; bx('oak', w, .06, d, 0, DECK + ht, z); for (const dx of [-w / 2 + .1, w / 2 - .1]) bx('spar', .08, ht - .03, d - .2, dx, DECK + (ht - .03) / 2, z);
      bx('gpaper', .5, .004, .36, -.4, DECK + ht + .033, z, .2); cy('gbrass', .05, .06, .2, .45, DECK + ht + .13, z, 8); cy('gglass', .04, .04, .14, .2, DECK + ht + .1, z - .2, 8);
      it('captain\'s table', -w / 2, DECK, z - d / 2, w / 2, DECK + ht + .25, z + d / 2);
      for (const dx of [-.5, .5]) { cy('spar', .17, .16, .45, dx, DECK + .225, z + .7, 10); it('stool', dx - .17, DECK, z + .53, dx + .17, DECK + .45, z + .87); } }
    { // the box bed to port forward of the mizzen, its curtain rail; the sea chest at its foot
      const z0 = -7.7, z1 = -5.8, w = .9, xo = -Math.min(cin(z0, DECK + .1), cin(z1, DECK + .1)) + .02, x = xo + w / 2, y0 = DECK;
      bx('oak', w, .3, z1 - z0, x, y0 + .25, (z0 + z1) / 2); bx('gcabB', w - .1, .14, z1 - z0 - .1, x, y0 + .47, (z0 + z1) / 2); bx(MARK ? 'gfur' : 'gcabA', w - .06, .05, (z1 - z0) * .64, x, y0 + .57, z1 - (z1 - z0) * .34);
      bx('gcabB', .55, .1, .3, x, y0 + .58, z0 + .25); for (const zz of [z0, z1]) bx('oak', w + .04, 1.4, .06, x, y0 + .7, zz); bx('oak', .06, .32, z1 - z0, x + w / 2, y0 + .4, (z0 + z1) / 2);
      bx('spar', .04, .04, z1 - z0, x + w / 2 - .02, y0 + 1.4, (z0 + z1) / 2); it('bunk', x - w / 2, y0, z0 - .03, x + w / 2 + .03, y0 + 1.4, z1 + .03);
      const cz = -5.45, cw2 = .8, cd = .5, cx = xo + cw2 / 2 + .02; bx('oak', cw2, .55, cd, cx, DECK + .275, cz); bx('green', cw2 + .02, .06, cd + .02, cx, DECK + .52, cz); for (const dx of [-.25, .25]) bx('iron', .05, .57, cd + .02, cx + dx, DECK + .275, cz);
      it('sea chest', cx - cw2 / 2, DECK, cz - cd / 2, cx + cw2 / 2, DECK + .55, cz + cd / 2); }
    { // the chart table and its globe to starboard, a stool
      const z = -7.0, w = .85, d = 1.2, ht = .8, x = Math.min(cin(z - d / 2, DECK + .1), cin(z + d / 2, DECK + .1)) - w / 2 - .02; bx('oak', w, .06, d, x, DECK + ht, z);
      for (const dx of [-w / 2 + .07, w / 2 - .07]) for (const dz of [-d / 2 + .07, d / 2 - .07]) bx('spar', .06, ht - .03, .06, x + dx, DECK + (ht - .03) / 2, z + dz);
      bx('gpaper', .55, .004, .75, x, DECK + ht + .033, z + .1, .1); put(new THREE.CylinderGeometry(.006, .006, .2, 4), 'gbrass', x + .05, DECK + ht + .04, z + .2, 1.2, 0, 0);
      cy('gbrass', .07, .09, .06, x, DECK + ht + .06, z - .4, 10); put(new THREE.SphereGeometry(.17, 16, 12), 'gpaper', x, DECK + ht + .27, z - .4); put(new THREE.TorusGeometry(.19, .012, 4, 24), 'gbrass', x, DECK + ht + .27, z - .4, 0, Math.PI / 2, 0);
      cy('spar', .17, .16, .45, x - w / 2 - .22, DECK + .225, z + .2, 10);
      it('chart table', x - w / 2, DECK, z - d / 2, x + w / 2, DECK + ht + .46, z + d / 2); it('stool', x - w / 2 - .39, DECK, z + .03, x - w / 2 - .05, DECK + .45, z + .37); }
    { // the sideboard against the bulkhead to starboard of the doorway, bottles and two cups on it
      const z = ZA - .27, w = 1.0, d = .42, x = 1.25, ht = .9; bx('oak', w, ht, d, x, DECK + ht / 2, z); bx('spar', w - .1, .5, .02, x, DECK + .4, z - d / 2 - .005);
      for (let k = 0; k < 4; k++) cy('gglass', .04, .045, .24, x - .35 + k * .14, DECK + ht + .12, z, 8); for (const dx of [.25, .38]) cy('gbrass', .035, .03, .08, x + dx, DECK + ht + .04, z, 8);
      it('sideboard', x - w / 2, DECK, z - d / 2, x + w / 2, DECK + ht + .25, z + d / 2); }
    lantern(.6, -9.0, .45); lantern(-.6, -6.2, .45);
    if (MARK) put(new THREE.CircleGeometry(.8, 9).scale(1.2, 1, 1).rotateX(-Math.PI / 2), 'gfur', 0, DECK + .006, -6.6); else { bx('grug0', 1.4, .01, 1.8, 0, DECK + .006, -6.6); bx('grug1', 1.1, .012, 1.5, 0, DECK + .008, -6.6); }
    { // Session 1585 — the galley under the forecastle, open beneath on its posts, as the cog's (Session 1580): a firebox on a tray of sand (the
      // Gatelands' brick, the Mark's iron firepan on stones, Aurenne's faced in blue tile) with an iron pot on a crane, a water cask; the fire
      // glows, and lights nothing. The way from the forecastle's ladder to the bow runs between them
      if (!M.brick) M.brick = MARK || AURD ? M.iron : mat('stone', { ns: .8, color: 0xb0604a });
      const x = -1.0, z = 8.7, w = 1.1, d = .9, ht = .55; bx('deck', w + .2, .06, d + .2, x, DECK + .03, z);
      if (MARK) { for (let k = 0; k < 7; k++) { const a = k / 7 * Math.PI * 2; put(new THREE.DodecahedronGeometry(.13), 'dark', x + Math.cos(a) * .38, DECK + .14, z + Math.sin(a) * .32); } cy('iron', .36, .3, .12, x, DECK + .3, z, 14); }
      else { bx(AURD ? 'blue' : 'brick', w, ht, d, x, DECK + .06 + ht / 2, z); bx('dark', w - .3, .08, d - .3, x, DECK + .06 + ht - .02, z); }
      put(new THREE.SphereGeometry(.16, 10, 8).scale(1.3, .6, 1), 'galLamp', x, DECK + (MARK ? .4 : .06 + ht + .02), z);
      const kx = x - w / 2 - .05; bx('iron', .05, 1.3, .05, kx, DECK + .7, z); bx('iron', .7, .04, .04, kx + .35, DECK + 1.32, z); bx('iron', .01, .3, .01, x, DECK + 1.15, z);
      put(new THREE.SphereGeometry(.2, 12, 8, 0, Math.PI * 2, Math.PI * .35, Math.PI * .65), 'iron', x, DECK + 1.05, z);
      it('firebox', x - w / 2 - .1, DECK, z - d / 2 - .1, x + w / 2 + .1, DECK + 1.35, z + d / 2 + .1);
      /* the cask at x 1.7, not the prototype's 1.0, so the way forward under the forecastle stays open beside it as well as between */
      const cx = 1.7, czk = 8.5; cy('oak', .28, .24, .7, cx, DECK + .35, czk, 12); for (const y of [.1, .6]) cy('iron', .29, .29, .04, cx, DECK + y, czk, 12); it('water cask', cx - .28, DECK, czk - .28, cx + .28, DECK + .7, czk + .28); }
  }
  const hull = bake(M), rigs = [];
  // a square rig in its mast's frame: the course and the topsail on their yards, bellied forward, the course's foot 2.2 m over the deck
  const square = (mz, mh, cy, cw2, tw, mark) => { rod([-cw2 / 2, cy, .2], [cw2 / 2, cy, .2], .1, .08, 'spar'); rod([-tw / 2, DECK + mh - .5, .16], [tw / 2, DECK + mh - .5, .16], .07, .06, 'spar');
    const sail = (w, top, bot, z, whole) => { const g = new THREE.PlaneGeometry(w - .3, top - bot - .1, 14, 12), P = g.attributes.position; for (let k = 0; k < P.count; k++) { const x = P.getX(k) / (w / 2), y = P.getY(k) / ((top - bot) / 2); P.setZ(k, .6 * (1 - x * x) * (1 - .6 * y * y) + .1 * (1 - y) / 2); }
      if (!whole) corner(g); g.computeVertexNormals(); put(g, 'sail', 0, (top + bot) / 2 - .05, z, 0, 0, 0, null); };
    sail(cw2, cy, DECK + 2.2, .28, mark); sail(tw, DECK + mh - .5, cy + .8, .24, false); rigs.push({ ...bake(M), z: mz, type: 'square' }); };
  // a lateen in its sling's frame, slung to starboard: [mast z, the deck it stands on, the sling's height over it, the yard's angle, its
  // length forward of the sling, aft of it, the clew's height over that deck and its z]. The main's tack comes down 2.6 m over the deck
  // short of the fore mast, its clew 1.4 m forward of the quarterdeck; the mizzen's clew over the transom
  const lateen = (mz, dy, sy, ang, fw, af, cy, cz) => { const A = ang * Math.PI / 180, xs = .36, Sy = dy + sy, Sz = mastZ(mz, Sy, RAKE), T = [xs, Sy - fw * Math.sin(A), fw * Math.cos(A)], P = [xs, Sy + af * Math.sin(A), -af * Math.cos(A)], C = [xs, dy + cy, cz - Sz];
    rod(T, P, mz === MAIN ? .1 : .085, .06, 'spar'); put(shipLateenSail([T[0], T[1] - .05, T[2] - .15], [P[0], P[1] - .15, P[2] + .2], C, 1, .55), 'sail', 0, 0, 0, 0, 0, 0, null); rigs.push({ ...bake(M), z: Sz, type: 'lateen' }); };
  if (AURD) { lateen(MAIN, DECK, 8.5, 56, (8.5 - 2.6) / Math.sin(56 * Math.PI / 180), 11.0, 2.5, ZA + 1.4); square(FORE, 10.5, DECK + 7.4, 7.4, 5.2, true); lateen(MIZ, CY, 5.4, 50, 4.1, 6.4, 2.5, ZT - .3); }
  else { square(MAIN, 13, DECK + 9.4, 9.0, 6.4, true); square(FORE, 10.5, DECK + 7.4, 7.4, 5.2, false);
    // the gaff mizzen about its mast: the boom 2.2 m over the quarterdeck, aft past the transom; the gaff from 6.2 m over it
    const BY = CY + 2.2, GT = CY + 6.2, BZ1 = ZT - 1.4 - MIZ, PK = [0, GT + 3.2 * Math.sin(.55), -3.2 * Math.cos(.55)];
    rod([0, BY, -.2], [0, BY, BZ1], .08, .07, 'spar'); rod([0, GT, -.2], PK, .07, .06, 'spar'); { const g = shipQuadSail([0, BY + .1, -.25], [0, BY + .1, BZ1 + .3], PK, [0, GT - .05, -.25], .45); corner(g); put(g, 'sail', 0, 0, 0, 0, 0, 0, null); }
    rigs.push({ ...bake(M), z: MIZ, type: 'gaff' }); }
  // the wheel: its rim and eight spokes about the hub, which the game turns with the helm
  { put(new THREE.TorusGeometry(.66, .035, 6, 24), 'oak'); for (let k = 0; k < 8; k++) { const a = k * Math.PI / 4; rod([0, 0, 0], [.82 * Math.cos(a), .82 * Math.sin(a), 0], .022, .018, 'oak'); } }
  const wb = bake(M), wheel = new THREE.Group(); wheel.name = 'wheel'; wheel.position.set(0, wy, wz); { const wm = new THREE.Mesh(wb.geo, wb.mats); wm.castShadow = true; wheel.add(wm); }
  const at = z => ({ b: sect(z, 1)[0], g: sheerAt(z), k: keelAt(z), sect: u => sect(z, u) });
  return { hull, rig: rigs[0], rigs, wheel, L, W, zs, zb, mast: masts[0], masts, hatch: hatches[0], hatches, ports, deckAt, at, sheerAt, transom: ZT, sailFoot: DECK + 2.2, dress: MARK ? 'mark' : AURD ? 'aurenne' : 'gatelands', head: false, shields: [],
    cabinItems, castle: { z0: ZT, z1: ZA, y: CY, cw, door, ladders, lad: LAD }, fore: { z0: ZF, z1: zb - .3, y: CY, cw, ladders: [fladder], lad: LAD, posts }, helm: { y: wy, z: wz - 1.1, wheelZ: wz },
    tris: Math.round(hull.tris + rigs.reduce((a, q) => a + q.tris, 0) + wb.tris), draws: hull.mats.length + rigs.reduce((a, q) => a + q.mats.length, 0) + wb.mats.length };
}
// ── The gate kit's wall and the Skyfall Fields (Session 1614; backlog L5, "Strange places", OG-106; Michael's C on #898) ──
// gatekit.js's 'wall' in its three conditions, and wonders.js's markSkyfall, copied for the world. The prototypes stay the drawing
// board. Differences: only the wall of the twelve pieces comes in (the one the Skyfall Fields stands); the valley, its pines and the
// prototype's own ground are the world's (the land, its trees), so the wonder is built over a height function it is handed; the 34
// stones are four shapes instanced (4 draws, not 34), each shape the prototype's boulder at a unit radius and scaled; the pits are
// laid on the drawn ground vertex by vertex. Asleep, every glowing face takes the dead stone (the prototype's DEAD), as in wonders.js.
//   PKIT.wonders.skyfall(hAt, o) -> { group, tris, draws, stones: [{x, z, y, rad, lift}], walls: [{x, z, ry, len, d}], tick(t, awake) }
//     in the wonder's frame (x across the valley, z along it, -150 to 150 m; y absolute from hAt(x, z)).
//   PKIT.wonders.gatePiece(kind, o) -> the gate kit's piece ('wall'), gatekit.js's userData.
const PN_P = [151, 160, 137, 91, 90, 15, 131, 13, 201, 95, 96, 53, 194, 233, 7, 225, 140, 36, 103, 30, 69, 142, 8, 99, 37, 240, 21, 10, 23, 190, 6, 148, 247, 120, 234, 75, 0, 26, 197, 62, 94, 252, 219, 203, 117, 35, 11, 32, 57, 177, 33, 88, 237, 149, 56, 87,
  174, 20, 125, 136, 171, 168, 68, 175, 74, 165, 71, 134, 139, 48, 27, 166, 77, 146, 158, 231, 83, 111, 229, 122, 60, 211, 133, 230, 220, 105, 92, 41, 55, 46, 245, 40, 244, 102, 143, 54, 65, 25, 63, 161, 1, 216, 80, 73, 209, 76, 132, 187, 208,
  89, 18, 169, 200, 196, 135, 130, 116, 188, 159, 86, 164, 100, 109, 198, 173, 186, 3, 64, 52, 217, 226, 250, 124, 123, 5, 202, 38, 147, 118, 126, 255, 82, 85, 212, 207, 206, 59, 227, 47, 16, 58, 17, 182, 189, 28, 42, 223, 183, 170, 213, 119,
  248, 152, 2, 44, 154, 163, 70, 221, 153, 101, 155, 167, 43, 172, 9, 129, 22, 39, 253, 19, 98, 108, 110, 79, 113, 224, 232, 178, 185, 112, 104, 218, 246, 97, 228, 251, 34, 242, 193, 238, 210, 144, 12, 191, 179, 162, 241, 81, 51, 145, 235, 249,
  14, 239, 107, 49, 192, 214, 31, 181, 199, 106, 157, 184, 84, 204, 176, 115, 121, 50, 45, 127, 4, 150, 254, 138, 236, 205, 93, 222, 114, 67, 29, 24, 72, 243, 141, 128, 195, 78, 66, 215, 61, 156, 180];
for (let i = 0; i < 256; i++) PN_P[256 + i] = PN_P[i];
// three.js's ImprovedNoise (Perlin's), which common.js's fbm reads at z .37
function pnoise(x, y, z) { const P = PN_P, fx = Math.floor(x), fy = Math.floor(y), fz = Math.floor(z), X = fx & 255, Y = fy & 255, Z = fz & 255; x -= fx; y -= fy; z -= fz;
  const fade = t => t * t * t * (t * (t * 6 - 15) + 10), lp = (t, a, b) => a + t * (b - a), gr = (h, x, y, z) => { h &= 15; const u = h < 8 ? x : y, v = h < 4 ? y : h == 12 || h == 14 ? x : z; return ((h & 1) == 0 ? u : -u) + ((h & 2) == 0 ? v : -v); };
  const u = fade(x), v = fade(y), w = fade(z), A = P[X] + Y, AA = P[A] + Z, AB = P[A + 1] + Z, B = P[X + 1] + Y, BA = P[B] + Z, BB = P[B + 1] + Z, x1 = x - 1, y1 = y - 1, z1 = z - 1;
  return lp(w, lp(v, lp(u, gr(P[AA], x, y, z), gr(P[BA], x1, y, z)), lp(u, gr(P[AB], x, y1, z), gr(P[BB], x1, y1, z))), lp(v, lp(u, gr(P[AA + 1], x, y, z1), gr(P[BA + 1], x1, y, z1)), lp(u, gr(P[AB + 1], x, y1, z1), gr(P[BB + 1], x1, y1, z1)))); }
const pfbm = (x, z, o = 5) => { let a = 0, f = 1, m = 1, s = 0; for (let i = 0; i < o; i++) { a += m * pnoise(x * f, z * f, .37); s += m; f *= 2.03; m *= .5; } return a / s; };
const GK_SCHOOLS = { tine: { stone: [.30, .28, .28], glow: [1.0, .34, .10] }, uisce: { stone: [.58, .64, .66], glow: [.30, .72, 1.0] }, cloch: { stone: [.70, .66, .60], glow: [1.0, .66, .30] },
  scath: { stone: [.40, .38, .44], glow: [.70, .34, 1.0] }, solas: { stone: [1.0, .84, .56], glow: [1.0, .86, .52] }, gaoth: { stone: [.84, .86, .88], glow: [.66, .92, 1.0] } };
const GK_VIOLET = [.62, .30, 1.0], GK_GLOWS = ['script', 'ring', 'seam'];
let _gkGlyph = null, _gkMats = {}, _gkDead = null;
function gkGlyphTex() { if (_gkGlyph) return _gkGlyph; const L = 2048, S = 64, c = document.createElement('canvas'); c.width = S; c.height = L; const x = c.getContext('2d'), r = stream('gatekit:glyphs');
  x.fillStyle = '#000'; x.fillRect(0, 0, S, L); x.strokeStyle = '#fff'; x.lineCap = 'round'; x.lineWidth = 4;
  for (let i = 0; i < 40; i++) { const k = Math.floor(r() * 7); x.save(); x.translate(32, 25 + i * 51); x.beginPath();
    if (k === 0) { x.arc(0, 0, 12, 0, 7); x.moveTo(0, -18); x.lineTo(0, 18); } else if (k === 1) { x.moveTo(-12, 18); x.lineTo(0, -18); x.lineTo(12, 18); x.moveTo(-7, 4); x.lineTo(7, 4); }
    else if (k === 2) { x.arc(0, 0, 13, .6, 5.7); x.moveTo(2, 0); x.arc(0, 0, 2, 0, 7); } else if (k === 3) { x.moveTo(-12, -14); x.lineTo(12, -14); x.moveTo(0, -14); x.lineTo(0, 18); x.moveTo(-8, 2); x.lineTo(8, 10); }
    else if (k === 4) { x.moveTo(-12, 0); x.lineTo(0, -16); x.lineTo(12, 0); x.lineTo(0, 16); x.closePath(); } else if (k === 5) { x.moveTo(-10, -16); x.lineTo(-10, 16); x.moveTo(10, -16); x.lineTo(10, 16); x.moveTo(-10, 0); x.lineTo(10, 0); }
    else { x.moveTo(0, -18); x.lineTo(0, 18); x.moveTo(-10, -8); x.lineTo(0, -2); x.lineTo(10, -8); } x.stroke(); x.restore(); }
  const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 8; return (_gkGlyph = t); }
function gkDead() { return _gkDead || (_gkDead = new THREE.MeshStandardMaterial({ color: new THREE.Color(.06, .055, .05), roughness: .9, map: gkGlyphTex() })); }
function gkMats(school, cond) { const k = school + '|' + cond; if (_gkMats[k]) return _gkMats[k]; const S = GK_SCHOOLS[school] || GK_SCHOOLS.cloch, col = new THREE.Color(...S.stone), M = {};
  M.stone = mat('ashlar', { ns: 1.0, color: col }); M.dress = mat('ashlar', { ns: .7, color: col.clone().multiplyScalar(.82) });
  const glow = cond === 'broken' ? GK_VIOLET : S.glow, gk = cond === 'whole' ? 2.2 : cond === 'cracked' ? .9 : 1.1;
  M.script = new THREE.MeshStandardMaterial({ color: new THREE.Color(.05, .045, .04), emissive: new THREE.Color(...glow), emissiveIntensity: gk, emissiveMap: gkGlyphTex(), roughness: .6 }); M.dead = gkDead();
  M.ring = new THREE.MeshStandardMaterial({ color: new THREE.Color(.05, .045, .04), emissive: new THREE.Color(...glow), emissiveIntensity: gk, emissiveMap: gkRingTex(), roughness: .6 });
  M.crack = new THREE.MeshStandardMaterial({ color: new THREE.Color(.012, .01, .01), roughness: 1 });
  M.seam = new THREE.MeshStandardMaterial({ color: new THREE.Color(.1, .04, .2), emissive: new THREE.Color(...GK_VIOLET), emissiveIntensity: 1.1, roughness: .4 });
  return (_gkMats[k] = M); }
const gkStone = (w, h, d, x, y, z, s = .25, joint = .03) => { const g = new THREE.BoxGeometry(Math.max(.02, w - joint), Math.max(.02, h - joint), Math.max(.02, d - joint)); g.translate(x, y, z); return worldUV(g, s); };
function gkScriptQuad(w, h, x, y, z, n, rep = 1) { const g = new THREE.PlaneGeometry(w, h), uv = g.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i), uv.getY(i) * rep);
  g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), n.clone().normalize())); g.translate(x, y, z); return g; }
function gkB(parts, o = {}) { const box = new THREE.Box3(); for (const p of parts) { p.geo.computeBoundingBox(); box.union(p.geo.boundingBox); } return { parts, c: box.getCenter(new THREE.Vector3()), lo: box.min.y, hi: box.max.y, box, ...o }; }
const GK_BUILD = {
  wall() { const bl = [], L = 14, H = 12, T = 2, ch = 1.25, r = stream('gatekit:wall:courses');
    for (let k = 0, y = 0; y < H - .01; k++, y += ch) { let x = -L / 2 + (k % 2 ? -1.1 : 0); while (x < L / 2 - .01) { const len = 2.2 + r() * .8, x0 = Math.max(-L / 2, x), x1 = Math.min(L / 2, x + len); if (x1 - x0 > .3) bl.push(gkB([{ key: 'stone', geo: gkStone(x1 - x0, ch, T, (x0 + x1) / 2, y + ch / 2, 0) }])); x += len; } }
    bl.push(gkB([{ key: 'dress', geo: gkStone(L + .3, .45, T + .4, 0, H + .22, 0) }]));
    for (const u of [-3.5, 3.5]) { const blk = bl.find(b => Math.abs(b.c.x - u) < 1.6 && b.lo > 4.9 && b.lo < 5.1) || bl[0]; blk.parts.push({ key: 'script', geo: gkScriptQuad(.7, 1.0, u, 5.62, T / 2 + .02, new THREE.Vector3(0, 0, 1), .5) }); }
    return { bl, axis: 'y', size: { w: L, h: H + .45, d: T } }; },
  // gatekit.js's pier (Session 1666, for the Drowned Ring): 4 m square and 18.6 m to its cap, script up all four faces, the ring sigil on one
  pier() { const bl = [], P = 4, H = 20, ch = 1.6; let k = 0;
    bl.push(gkB([{ key: 'dress', geo: gkStone(P + .8, 1.0, P + .8, 0, .5, 0) }]));
    for (let y = 1.0; y < H - 1.2; y += ch, k++) { const parts = [{ key: 'stone', geo: gkStone(P, ch, P, 0, y + ch / 2, 0) }];
      for (const [n, x, z] of [[[0, 0, 1], 0, P / 2 + .02], [[0, 0, -1], 0, -P / 2 - .02], [[1, 0, 0], P / 2 + .02, 0], [[-1, 0, 0], -P / 2 - .02, 0]]) parts.push({ key: 'script', geo: gkScriptQuad(.55, ch - .1, x, y + ch / 2, z, new THREE.Vector3(...n), .7) });
      if (k === 6) parts.push({ key: 'ring', geo: gkScriptQuad(2.6, 2.6, 0, y + ch / 2 + .4, P / 2 + .04, new THREE.Vector3(0, 0, 1)) });
      bl.push(gkB(parts)); }
    const top = 1.0 + k * ch; bl.push(gkB([{ key: 'dress', geo: gkStone(P + .9, .6, P + .9, 0, top + .3, 0) }])); bl.push(gkB([{ key: 'dress', geo: gkStone(P + .5, .5, P + .5, 0, top + .85, 0) }]));
    return { bl, axis: 'y', size: { w: P + .9, h: top + 1.1, d: P + .9 } }; } };
// the ring sigil of OG-037, as gatekit.js draws it: two circles, a cross that runs past them, a point at the heart (white on black)
let _gkRing = null;
function gkRingTex() { if (_gkRing) return _gkRing; const c = document.createElement('canvas'); c.width = c.height = 512; const x = c.getContext('2d'); x.fillStyle = '#000'; x.fillRect(0, 0, 512, 512); x.strokeStyle = '#fff'; x.fillStyle = '#fff'; x.lineCap = 'round';
  x.lineWidth = 16; x.beginPath(); x.arc(256, 256, 170, 0, 7); x.stroke(); x.lineWidth = 9; x.beginPath(); x.arc(256, 256, 96, 0, 7); x.stroke();
  x.lineWidth = 10; x.beginPath(); x.moveTo(256, 20); x.lineTo(256, 492); x.moveTo(20, 256); x.lineTo(492, 256); x.stroke(); x.beginPath(); x.arc(256, 256, 18, 0, 7); x.fill();
  const t = new THREE.CanvasTexture(c); t.anisotropy = 8; return (_gkRing = t); }
function gkCrack(r, b) { const bb = b.box, w = bb.max.x - bb.min.x, d = bb.max.z - bb.min.z, front = w >= d, out = [], n = 4;
  let u = (r() - .5) * (front ? w : d) * .5, v = bb.min.y + .1; const seg = (bb.max.y - bb.min.y - .2) / n;
  for (let i = 0; i < n; i++) { const u1 = u + (r() - .5) * .7, v1 = v + seg, g = new THREE.PlaneGeometry(.045, Math.hypot(u1 - u, seg)); g.rotateZ(Math.atan2(-(u1 - u), seg));
    if (front) g.translate(bb.min.x + w / 2 + (u + u1) / 2, (v + v1) / 2, bb.max.z + .012); else { g.rotateY(Math.PI / 2); g.translate(bb.max.x + .012, (v + v1) / 2, bb.min.z + d / 2 + (u + u1) / 2); }
    out.push(g); u = u1; v = v1; } return out; }
// gatekit.js's condition(), unchanged: a condition is a rule over the stones (the lean, the slipped stones, the break line, what floats and what falls)
function gkCondition(P, cond, key) {
  const r = stream(`${key}:${cond}`), { bl, axis, size } = P, out = [], st = { moved: 0, floating: 0, fallen: 0, seams: 0, cracks: 0, lean: 0 }, M4 = () => new THREE.Matrix4();
  const at = b => axis === 'z' ? b.c.z : b.c.x, lo = Math.min(...bl.map(b => axis === 'y' ? b.lo : at(b))), hi = Math.max(...bl.map(b => axis === 'y' ? b.hi : at(b))), M = M4();
  const lean = cond === 'whole' || axis !== 'y' || P.still ? 0 : (1.5 + r() * 1.5) * (r() < .5 ? -1 : 1) * Math.PI / 180, L = M4().makeRotationX(lean); st.lean = +(lean * 180 / Math.PI).toFixed(2);
  const cut = cond === 'broken' ? (axis === 'y' ? .42 + r() * .12 : .5 + r() * .1) : 2, rag = b => Math.sin((axis === 'x' ? b.c.z : b.c.x) * 1.7 + 3 * r()) * .08;
  for (const b of bl) { M.identity(); let seat = null, kind = 'in';
    const f = axis === 'y' ? (b.lo - lo) / Math.max(.01, hi - lo) : (at(b) - lo) / Math.max(.01, hi - lo);
    if (cond === 'cracked' && r() < .25) { const t = M4().makeTranslation(b.c.x, b.c.y, b.c.z).multiply(M4().makeRotationFromEuler(new THREE.Euler((r() - .5) * .03, (r() - .5) * .03, (r() - .5) * .03))).multiply(M4().makeTranslation(-b.c.x, -b.c.y, -b.c.z));
      M.premultiply(t).premultiply(M4().makeTranslation((r() - .5) * .06, -r() * .08, (r() - .5) * .06)); kind = 'slipped'; st.moved++; }
    if (cond === 'broken' && !b.fixed && f + rag(b) > cut) { const t = (f - cut) / Math.max(.05, 1 - cut);
      if (!P.ruin && r() < .72) { const lift = .5 + t * 2.6 + r() * .6, rot = new THREE.Euler((r() - .5) * .5 * (.4 + t), (r() - .5) * .4, (r() - .5) * .5 * (.4 + t));
        M.premultiply(M4().makeTranslation(-b.c.x, -b.c.y, -b.c.z)).premultiply(M4().makeRotationFromEuler(rot)).premultiply(M4().makeTranslation(b.c.x + (r() - .5) * .8, b.c.y + lift, b.c.z + (r() - .5) * 1.2));
        kind = 'floating'; st.floating++; seat = true; }
      else { const ang = (r() < .5 ? 1 : -1) * Math.PI / 2 * (.6 + r() * .4), out2 = 2 + r() * 3, sz = r() < .5 ? 1 : -1, rot = new THREE.Euler(b.flat ? 0 : ang, r() * Math.PI, 0), dy = b.flat ? -(b.hi + 3 + r() * 4) : 0;
        M.premultiply(M4().makeTranslation(-b.c.x, -b.c.y, -b.c.z)).premultiply(M4().makeRotationFromEuler(rot));
        const tmp = b.box.clone().applyMatrix4(M); M.premultiply(M4().makeTranslation(b.c.x + (r() - .5) * 2, b.flat ? dy : -tmp.min.y + (P.ground || 0) + .02, b.flat ? b.c.z : b.c.z + sz * (size.d / 2 + out2 * (.5 + .5 * t))));
        kind = 'fallen'; st.fallen++; seat = true; }
      st.moved++; }
    const ML = kind === 'fallen' ? M : M.clone().premultiply(L);
    for (const p of b.parts) out.push({ key: (p.key === 'script' || p.key === 'ring') && (kind === 'fallen' || P.ruin) ? 'dead' : p.key === 'script' && cond === 'cracked' && r() < .33 ? 'dead' : p.key, geo: p.geo.clone().applyMatrix4(ML), kind });
    if (cond === 'cracked' && b.parts[0].key !== 'dress' && r() < .3) for (const g of gkCrack(r, b)) { out.push({ key: 'crack', geo: g.applyMatrix4(ML) }); st.cracks++; }
    if (seat && !P.ruin) { const bb = b.box, w = bb.max.x - bb.min.x - .08, d = bb.max.z - bb.min.z - .08, g = new THREE.BoxGeometry(Math.max(.05, w), .05, Math.max(.05, d)); g.translate(b.c.x, bb.min.y + .03, b.c.z); out.push({ key: 'seam', geo: g.applyMatrix4(L) }); st.seams++;
      if (kind === 'floating') { const u = new THREE.BoxGeometry(Math.max(.05, w), .05, Math.max(.05, d)); u.translate(b.c.x, bb.min.y - .03, b.c.z); out.push({ key: 'seam', geo: u.applyMatrix4(M) }); st.seams++; } } }
  return { parts: out, st }; }
// the piece's parts by material key, each geometry non-indexed with position, normal and uv (for merging into a wonder), and its stats;
// `standing` is the box of what still stands on its foot (the piece's frame), for the solids
function gkParts(kind, o = {}) { const cond = ['whole', 'cracked', 'broken'].includes(o.cond) ? o.cond : 'whole', school = GK_SCHOOLS[o.school] ? o.school : 'cloch', key = o.key || `gatekit:${kind}`;
  const P = GK_BUILD[kind](o); P.ruin = !!o.ruin; const { parts, st } = gkCondition(P, cond, key), by = {}, standing = new THREE.Box3();
  for (const p of parts) { const g = p.geo.index ? p.geo.toNonIndexed() : p.geo; for (const a of Object.keys(g.attributes)) if (!['position', 'normal', 'uv'].includes(a)) g.deleteAttribute(a);
    if (!g.attributes.normal) g.computeVertexNormals(); if (!g.attributes.uv) g.setAttribute('uv', new THREE.Float32BufferAttribute(new Float32Array(g.attributes.position.count * 2), 2)); (by[p.key] ||= []).push(g);
    if (p.kind === 'in' && p.key === 'stone') { g.computeBoundingBox(); standing.union(g.boundingBox); } }
  return { by, M: gkMats(school, cond), st, size: P.size, standing, cond, school, key }; }
function gatePiece(kind, o = {}) { const R = gkParts(kind, o), G = new THREE.Group(); let tris = 0, calls = 0;
  for (const k in R.by) { const geo = mergeGeometries(R.by[k]), m = new THREE.Mesh(geo, R.M[k]); m.castShadow = o.shadow !== false && !['script', 'ring', 'seam', 'crack', 'dead'].includes(k); m.receiveShadow = true; m.userData.key = k; G.add(m); tris += geo.attributes.position.count / 3; calls++; }
  G.userData = { kind, cond: R.cond, school: R.school, key: R.key, tris: Math.round(tris), calls, ...R.st, size: R.size, standing: R.standing }; return G; }
// the prototype's boulder at a unit radius (it scales linearly: the noise is read on the unit sphere), its UVs at the scale a stone of 4 m had
function wonderBoulder(seed, flat = .75) { const g = new THREE.IcosahedronGeometry(1, 3), p = g.attributes.position, v = new THREE.Vector3();
  for (let i = 0; i < p.count; i++) { v.fromBufferAttribute(p, i); const n = pfbm(v.x * 1.3 + seed, v.z * 1.3 - seed * .7 + v.y, 4); v.multiplyScalar(1 + n * .55); if (v.y < 0) v.y *= flat; p.setXYZ(i, v.x, v.y * .8, v.z); }
  const q = g.toNonIndexed(); g.dispose(); q.computeVertexNormals(); return worldUV(q, 1.4); }
// a flat disc or ring laid on the ground: every vertex at hAt + lift
function onGround(g, x, z, hAt, lift) { g.rotateX(-Math.PI / 2); const P = g.attributes.position; for (let i = 0; i < P.count; i++) { const vx = P.getX(i) + x, vz = P.getZ(i) + z; P.setXYZ(i, vx, hAt(vx, vz) + lift, vz); }
  const q = g.index ? g.toNonIndexed() : g; q.computeVertexNormals(); if (!q.attributes.uv) worldUV(q, .3); return q; }
// places.js's auroraCurtains (Session 1243), as plain script for the game: the same three curtains and the same shader, with its two
// colours encoded as the prototype's page shows them (the game's output is linear, see skyfallSeamMat), and a slow drift along the rays
// by t (the page's is still). Additive, no depth write, no fog: it is light in the sky, not a thing in the air.
function skyfallAurora(r, base) {
  const mat = new THREE.ShaderMaterial({ transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, fog: false, uniforms: { t: { value: 0 } },
    vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
    fragmentShader: 'varying vec2 vUv; uniform float t; void main(){ float h = vUv.y, x = vUv.x + t * .0004; float rays = .55 + .45 * sin(x * 260.0 + sin(x * 31.0 + t * .05) * 4.0) * sin(x * 97.0 + 1.3);' +
      ' float foot = smoothstep(0.0, .08, h) * (1.0 - smoothstep(.35, 1.0, h)); float ends = smoothstep(0.0, .12, vUv.x) * (1.0 - smoothstep(.88, 1.0, vUv.x));' +
      ' vec3 c = mix(vec3(.54, 1.0, .77), vec3(.77, .58, .95), smoothstep(.25, .9, h)); gl_FragColor = vec4(c * foot * ends * (.35 + .65 * rays) * .55, 1.0); }' });
  const pos = [], uv = [], idx = [];
  for (let k = 0; k < 3; k++) { const N = 160, z0 = -340 - k * 180 - r() * 60, x0 = -700 + r() * 200, L = 1300 + r() * 300, lo = base + 90 + r() * 30 + k * 10, hi = lo + 120 + r() * 50, a = r() * 9, b = r() * 9, v0 = pos.length / 3;
    for (let i = 0; i <= N; i++) { const u = i / N, x = x0 + u * L, z = z0 + Math.sin(u * 7 + a) * 90 + Math.sin(u * 19 + b) * 25; for (const v of [0, 1]) { pos.push(x, v ? hi : lo, z + (v ? 20 : 0)); uv.push(u, v); } }
    for (let i = 0; i < N; i++) { const p = v0 + 2 * i; idx.push(p, p + 2, p + 1, p + 1, p + 2, p + 3); } }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx);
  const mesh = new THREE.Mesh(g, mat); mesh.name = 'aurora'; mesh.frustumCulled = false; mesh.castShadow = mesh.receiveShadow = false; mesh.visible = false;
  return { mesh, mat, tris: idx.length / 3 }; }
// The walls' seams (Session 1646; the critic, 31 Oct): the kit's violet (.62, .30, 1.0) is pale lilac on the prototype's page, which writes
// sRGB, but the game runs with colour management off and a linear output (05-compat.js), so there the same numbers are a raw magenta, and
// on the broad seats the lifted courses bare it read as blotches, not light through cracks. The Fields' walls take the colour the page
// shows (the violet encoded, about .81, .58, 1.0) on a copy of the kit's material; the gates' own walls are F5's and keep theirs.
function skyfallSeamMat(m) { const c = m.clone(); c.emissive.copy(m.emissive).convertLinearToSRGB(); c.color.copy(m.color).convertLinearToSRGB(); return c; }
// the Mark's wonder: wonders.js's markSkyfall over the world's valley. 34 stones of 1.5 to 13 m hang 4 to 58 m over the floor, each over
// the pit it came out of (a hollow ringed with thrown earth), a Gaoth seam glowing under every stone over 5 m; two of the gate kit's walls
// (1.4 times, 19.6 m long) stand broken on the floor with their stones lifted. The same stream ('wonders:skyfall') and the same draws in
// the same order as the prototype, so the stones are its stones; only the valley's length is centred on the wonder's middle.
function markSkyfall(hAt, o = {}) {
  const key = 'wonders:skyfall', r = stream(key), group = new THREE.Group(), B = new Map(), put = (k, g) => (B.get(k) || B.set(k, []).get(k)).push(g), S = GK_SCHOOLS.gaoth, NS = 4;
  group.name = 'wonder:skyfall'; const stones = [];
  for (let k = 0; k < 34; k++) { const x = (r() - .5) * 130, z = 150 - r() * 300, big = Math.pow(r(), 2.2), rad = 1.5 + big * 11.5, lift = 4 + big * 32 + r() * 22;
    let g0 = hAt(x, z); for (let k2 = 0; k2 < 8; k2++) g0 = Math.max(g0, hAt(x + Math.sin(k2 * Math.PI / 4) * rad * 1.2, z + Math.cos(k2 * Math.PI / 4) * rad * 1.2)); /* the world's ground is not the prototype's floor: over the highest of it under the stone */
    const y = g0 + rad + lift;
    const rot = [r() * .6, r() * 6.3, r() * .6]; stones.push({ x, y, z, rad, lift, rot, ph: r() * 6.3, sp: .06 + r() * .1, shape: k % NS });
    put('pit', onGround(new THREE.RingGeometry(rad * .55, rad * 1.05, 24), x, z, hAt, .08)); put('hole', onGround(new THREE.CircleGeometry(rad * .56, 24), x, z, hAt, .1));
    if (rad > 5) { const sg = wonderBoulder(k * 3.1 + 9, .2); sg.scale(rad * .5, rad * .5 * .12, rad * .5); sg.translate(x, y - rad * .62, z); put('seam', sg); } }
  // the walls: the kit's broken wall at 1.4 times, set on the lowest ground under its foot
  const walls = [], M = {};
  for (const [i, x, z, a] of [[0, -18, 70, .3], [1, 22, -15, -.5]]) { const W = gkParts('wall', { cond: 'broken', school: 'gaoth', key: `${key}:wall:${i}` }), s = 1.4, c = Math.cos(a), sn = Math.sin(a);
    let lo = 1e9; for (const u of [-1, -.5, 0, .5, 1]) for (const v of [-1, 1]) { const lx = u * W.size.w / 2 * s, lz = v * W.size.d / 2 * s; lo = Math.min(lo, hAt(x + lx * c + lz * sn, z - lx * sn + lz * c)); }
    const T = new THREE.Matrix4().makeTranslation(x, lo - .4, z).multiply(new THREE.Matrix4().makeRotationY(a)).multiply(new THREE.Matrix4().makeScale(s, s, s));
    for (const k in W.by) { const mk = 'w:' + k; M[mk] = M[mk] || (k === 'seam' ? skyfallSeamMat(W.M[k]) : W.M[k]); for (const g of W.by[k]) put(mk, g.applyMatrix4(T)); }
    walls.push({ x, z, ry: a, y: lo - .4, len: W.size.w * s, d: W.size.d * s, standH: (W.standing.max.y - W.standing.min.y) * s, floating: W.st.floating, fallen: W.st.fallen }); }
  const glowCol = new THREE.Color(...S.glow);
  Object.assign(M, { pit: new THREE.MeshStandardMaterial({ color: new THREE.Color(.28, .25, .22), roughness: 1 }), hole: new THREE.MeshStandardMaterial({ color: new THREE.Color(.06, .05, .05), roughness: 1 }),
    seam: new THREE.MeshStandardMaterial({ color: new THREE.Color(.1, .12, .14), emissive: glowCol, emissiveIntensity: 1.6, roughness: .5 }) });
  let tris = 0, draws = 0; const glows = [];
  for (const [k, gs] of B) { const g = mergeGeometries(gs); gs.forEach(x => x.dispose()); const m = new THREE.Mesh(g, M[k]); m.name = k; m.userData.key = k.replace(/^w:/, '');
    m.castShadow = !['pit', 'hole', 'seam', 'w:seam', 'w:script', 'w:dead', 'w:crack'].includes(k); m.receiveShadow = true; group.add(m); tris += g.attributes.position.count / 3; draws++;
    if (GK_GLOWS.includes(m.userData.key)) { m.userData.on = m.material; glows.push(m); } }
  // the stones: four shapes, each one InstancedMesh, the prototype's rock
  const rock = mat('rock', { ns: 1.3, color: 0x8a8a92, rough: .95 }), shapes = [], m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), sv = new THREE.Vector3(), pv = new THREE.Vector3();
  for (let s = 0; s < NS; s++) { const mine = stones.filter(t => t.shape === s); if (!mine.length) continue; const geo = wonderBoulder(s * 3.1), im = new THREE.InstancedMesh(geo, rock, mine.length);
    im.name = 'stones:' + s; im.castShadow = im.receiveShadow = true; im.userData.list = mine; group.add(im); shapes.push(im); tris += geo.attributes.position.count / 3 * mine.length; draws++; }
  const place = (t, awake, sec) => { pv.set(t.x, t.y + (awake ? Math.sin(sec * t.sp * 2 + t.ph) * (.4 + t.rad * .08) : 0), t.z); e.set(t.rot[0], t.rot[1] + (awake ? sec * t.sp * .2 : 0), t.rot[2]); q.setFromEuler(e); sv.setScalar(t.rad); return m4.compose(pv, q, sv); };
  // the aurora over the Fields (Session 1647; OG-106, the critic of 31 Oct): places.js's auroraCurtains, three curtains 1.3 to 1.6 km
  // long, 90 to 290 m over the field, 340 to 760 m off on its -z side, merged into one mesh (one draw); seen only while the Fields wake
  const aurora = skyfallAurora(stream(key + ':aurora'), hAt(0, 0)); group.add(aurora.mesh); tris += aurora.tris; draws++;
  let was = null;
  // alive: each stone rises and settles over 8 to 16 s and turns slowly, the seams breathe over 7 s; asleep, all still and every seam dead stone
  function tick(sec, awake) { awake = !!awake; aurora.mesh.visible = awake; aurora.mat.uniforms.t.value = sec;
    if (awake || was !== false) { for (const im of shapes) { im.userData.list.forEach((t, i) => im.setMatrixAt(i, place(t, awake, sec))); im.instanceMatrix.needsUpdate = true; im.computeBoundingSphere(); } }
    if (was !== awake) for (const m of glows) m.material = awake ? m.userData.on : gkDead();
    if (awake) { const p = .5 + .5 * Math.sin(sec * 2 * Math.PI / 7); for (const m of glows) m.material.emissiveIntensity = m.userData.key === 'seam' && m.name === 'seam' ? .5 + .9 * p : .7 + 1.0 * p; }
    was = awake; }
  tick(0, !!o.awake);
  return { group, tris: Math.round(tris), draws, stones: stones.map(t => ({ x: t.x, z: t.z, y: t.y, rad: t.rad, lift: t.lift })), walls, tick,
    size: { stones: stones.length, biggest: +Math.max(...stones.map(t => t.rad * 2)).toFixed(1), highest: +Math.max(...stones.map(t => t.lift)).toFixed(1) } };
}
// ── Aurenne's wonder, the Broken Orrery (Session 1634; backlog L5, "Strange places", OG-106; Michael's C on #898) ──
// wonders.js's aurenneOrrery, copied for the world. The prototype's own land, cliff and sea are the world's (a headland of Aurenne's
// coast), so it is built over a height function it is handed, the sea towards -z. The platform's lowest step goes down to the lowest
// ground under it, so it stands level on ground that is not; the columns' fallen drums lie on the step or the ground they fell on.
// The same stream ('wonders:orrery') drawn in the same order as the prototype, so the columns and the rings' set are its own. The
// static stone is merged by material (4 draws); each ring turns on its own, so it is a mesh and its script a second (8), and the sun
// one. The prototype's point light is left out: a light added and taken away recompiles every material in the world, and the sun and
// the script burn by their own emission (the bloom carries them at Middle and High).
//   PKIT.wonders.orrery(hAt, o) -> { group, tris, draws, top, base, plats: [{r, y}], cols: [{x, z, stand, h, r}], pier: {r, y}, tick(t, awake), size }
// Two textures from the one glyph stream (Session 1642): the glow (white strokes on black, the emissive map) and the cut (grey
// strokes on white, the colour map), so by day the strip is a bronze inlay with its script cut in, and by night that script burns.
// The strokes are 5 px (6 cm on the strip) so they hold a pixel at 40 m.
let _wBand = null, _wBandCut = null;
function wonderBandTex(cut) { if (cut ? _wBandCut : _wBand) return cut ? _wBandCut : _wBand; const L = 4096, S = 64, c = document.createElement('canvas'); c.width = L; c.height = S; const x = c.getContext('2d'), r = stream('wonders:band'); x.fillStyle = cut ? '#fff' : '#000'; x.fillRect(0, 0, L, S); x.strokeStyle = cut ? '#6e6e6e' : '#fff'; x.lineCap = 'round'; x.lineWidth = 5;
  for (let i = 0; i < 80; i++) { const k = Math.floor(r() * 7); x.save(); x.translate(26 + i * 51, 32); x.beginPath();
    if (k === 0) { x.arc(0, 0, 12, 0, 7); x.moveTo(0, -18); x.lineTo(0, 18); } else if (k === 1) { x.moveTo(-12, 18); x.lineTo(0, -18); x.lineTo(12, 18); x.moveTo(-7, 4); x.lineTo(7, 4); }
    else if (k === 2) { x.arc(0, 0, 13, .6, 5.7); x.moveTo(2, 0); x.arc(0, 0, 2, 0, 7); } else if (k === 3) { x.moveTo(-12, -14); x.lineTo(12, -14); x.moveTo(0, -14); x.lineTo(0, 18); x.moveTo(-8, 2); x.lineTo(8, 10); }
    else if (k === 4) { x.moveTo(-12, 0); x.lineTo(0, -16); x.lineTo(12, 0); x.lineTo(0, 16); x.closePath(); } else if (k === 5) { x.moveTo(-10, -16); x.lineTo(-10, 16); x.moveTo(10, -16); x.lineTo(10, 16); x.moveTo(-10, 0); x.lineTo(10, 0); }
    else { x.moveTo(0, -18); x.lineTo(0, 18); x.moveTo(-10, -8); x.lineTo(0, -2); x.lineTo(10, -8); } x.stroke(); x.restore(); }
  const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 8; return cut ? (_wBandCut = t) : (_wBand = t); }
// a band of stone round a circle in the xy plane (the ring stands upright), from a0 to a1, radius r0 to r1, th thick; its glyph strip
// on both faces as a second geometry (u along the band). wonders.js's band(), but for the strip's u: the prototype's 3.2 m a repeat
// squeezed each glyph to 4 cm wide and 54 cm tall, which read as a buzzing hatch (the critic, 31 Oct); WBAND_U, 61 m a repeat, gives
// the strip's 64 px the same scale both ways, so a glyph is about 0.5 m square (Session 1642).
const WBAND_U = 61;
// the dead inlay's colour: a weathered bronze about the tone of the columns' shade, not the near-black of the prototype's quiet mode,
// which read by day as a hollow cut round each ring (the critic, 31 Oct; Session 1642)
const WBAND_BRONZE = [.34, .25, .15];
function wonderBand(r0, r1, th, a0 = 0, a1 = Math.PI * 2, n = 96) { const pos = [], uv = [], gl = [], gu = [], seg = Math.max(8, Math.round(n * (a1 - a0) / (Math.PI * 2)));
  const P = (rr, a, z) => [rr * Math.cos(a), rr * Math.sin(a), z], quad = (A, Bq, C, D, U) => { pos.push(...A, ...Bq, ...C, ...A, ...C, ...D); uv.push(...U); };
  for (let i = 0; i < seg; i++) { const a = a0 + (a1 - a0) * i / seg, b = a0 + (a1 - a0) * (i + 1) / seg, u0 = a * r1 * .25, u1 = b * r1 * .25;
    for (const z of [th / 2, -th / 2]) { const s = z > 0 ? 1 : -1, A = P(r0, a, z), Bq = P(r1, a, z), C = P(r1, b, z), D = P(r0, b, z); if (s > 0) quad(A, Bq, C, D, [u0, 0, u0, 1, u1, 1, u0, 0, u1, 1, u1, 0]); else quad(A, D, C, Bq, [u0, 0, u1, 0, u1, 1, u0, 0, u1, 1, u0, 1]);
      const g0 = r0 + (r1 - r0) * .2, g1 = r0 + (r1 - r0) * .8, zz = z + s * .02, ga = P(g0, a, zz), gb = P(g1, a, zz), gc = P(g1, b, zz), gd = P(g0, b, zz), U0 = a * g1 / WBAND_U, U1 = b * g1 / WBAND_U;
      if (s > 0) { gl.push(...ga, ...gb, ...gc, ...ga, ...gc, ...gd); gu.push(U0, 0, U0, 1, U1, 1, U0, 0, U1, 1, U1, 0); } else { gl.push(...ga, ...gd, ...gc, ...ga, ...gc, ...gb); gu.push(U0, 0, U1, 0, U1, 1, U0, 0, U1, 1, U0, 1); } }
    for (const rr of [r1, r0]) { const A = P(rr, a, th / 2), Bq = P(rr, a, -th / 2), C = P(rr, b, -th / 2), D = P(rr, b, th / 2); if (rr === r1) quad(A, Bq, C, D, [u0, 0, u0, th * .25, u1, th * .25, u0, 0, u1, th * .25, u1, 0]); else quad(A, D, C, Bq, [u0, 0, u1, 0, u1, th * .25, u0, 0, u1, th * .25, u0, th * .25]); } }
  if (a1 - a0 < Math.PI * 2 - 1e-3) for (const a of [a0, a1]) { const s = a === a0 ? 1 : -1, A = P(r0, a, th / 2), Bq = P(r1, a, th / 2), C = P(r1, a, -th / 2), D = P(r0, a, -th / 2); if (s > 0) quad(A, D, C, Bq, [0, 0, 0, .3, .3, .3, 0, 0, .3, .3, .3, 0]); else quad(A, Bq, C, D, [0, 0, 0, .3, .3, .3, 0, 0, .3, .3, .3, 0]); }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.computeVertexNormals();
  const s = new THREE.BufferGeometry(); s.setAttribute('position', new THREE.Float32BufferAttribute(gl, 3)); s.setAttribute('uv', new THREE.Float32BufferAttribute(gu, 2)); s.computeVertexNormals(); return { g, s }; }
// the platform 46 m across (three steps), sixteen columns broken to four, and at its heart a pier carrying an armillary of four rings of
// the kit's stone, 41, 33, 25 and 17 m across, nested on pivots, the script cut round each, a stone sun 4 m across at the heart; the third
// ring broken, its quarter fallen on the platform. Solas's gold.
function aurenneOrrery(hAt, o = {}) {
  const key = 'wonders:orrery', r = stream(key), group = new THREE.Group(), B = new Map(), put = (k, g) => (B.get(k) || B.set(k, []).get(k)).push(g), S = GK_SCHOOLS.solas, R = 23;
  group.name = 'wonder:orrery';
  // the ground under the platform: its foot goes down to the lowest, its first step stands over the highest
  let lo = 1e9, hi = -1e9; for (let k = 0; k < 24; k++) for (const rr of [0, R * .5, R * .85, R + .3]) { const y = hAt(Math.sin(k * Math.PI / 12) * rr, Math.cos(k * Math.PI / 12) * rr); lo = Math.min(lo, y); hi = Math.max(hi, y); }
  const base = Math.max(hAt(0, 0) - .2, hi - .65), plats = [];
  let py = base; for (const [k, rad] of [[0, R], [1, R - 2.5], [2, R - 5]]) { const foot = k ? py : lo - .6, h = py + .8 - foot, g = new THREE.CylinderGeometry(rad, rad + .1, h, 96, 1); g.translate(0, foot + h / 2, 0); put(k === 2 ? 'floor' : 'stone', g); py += .8; plats.push({ r: rad, y: +py.toFixed(3) }); }
  const stepAt = (x, z) => { const d = Math.hypot(x, z); let y = null; for (const p of plats) if (d < p.r) y = p.y; return y ?? hAt(x, z); };
  // the colonnade: sixteen columns on the top step's edge, 1.3 m across and 11 m high with a capital; four stand, the rest broken low, their drums fallen
  const CR = R - 3.6, colH = 11, cols = []; for (let i = 0; i < 16; i++) { const a = i * Math.PI / 8 + .1, x = CR * Math.sin(a), z = CR * Math.cos(a), stand = [1, 6, 7, 12].includes(i), h = stand ? colH : 1 + r() * 4.5;
    const g = new THREE.CylinderGeometry(.62, .68, h, 16, 1); g.translate(x, py + h / 2, z); put('stone', g); const b = new THREE.BoxGeometry(1.8, .5, 1.8); b.translate(x, py + .25, z); put('stone', b);
    if (stand) { const c = new THREE.BoxGeometry(1.9, .7, 1.9); c.translate(x, py + h + .35, z); put('stone', c); }
    else for (let d = 0; d < 2; d++) { const dl = 1.4 + r(), dg = new THREE.CylinderGeometry(.62, .62, dl, 14, 1); dg.rotateZ(Math.PI / 2); dg.rotateY(r() * 6.3); const fa = a + (r() - .5) * .4, fd = CR + 2 + r() * 6, fx = fd * Math.sin(fa), fz = fd * Math.cos(fa);
      dg.translate(fx, stepAt(fx, fz) + .58, fz); put('stone', dg); }
    cols.push({ i, x: +x.toFixed(2), z: +z.toFixed(2), stand, h: +h.toFixed(1), r: .68 }); }
  // the pivot pier at the heart; the outer ring's foot rides its top
  { const g = new THREE.CylinderGeometry(2.2, 3.2, 3, 8, 1); g.translate(0, py + 1.5, 0); put('stone', g); }
  const hub = new THREE.Vector3(0, py + 3 + 20.5, 0), stoneCol = new THREE.Color(...S.stone);
  const ringM = mat('ashlar', { ns: .9, color: stoneCol.clone().multiplyScalar(.95) }), scriptM = new THREE.MeshStandardMaterial({ color: new THREE.Color(...WBAND_BRONZE), map: wonderBandTex(true), emissive: new THREE.Color(...S.glow), emissiveIntensity: 2.0, emissiveMap: wonderBandTex(), roughness: .55, metalness: .25 });
  const sunM = new THREE.MeshStandardMaterial({ color: new THREE.Color(.5, .38, .2), emissive: new THREE.Color(...S.glow), emissiveIntensity: 0, roughness: .45, metalness: .3 });
  const rings = [], radii = [20.5, 16.5, 12.5, 8.5]; let parent = new THREE.Group(), tris = 0, draws = 0; parent.position.copy(hub); parent.name = 'armillary'; group.add(parent);
  radii.forEach((rad, i) => { const pivot = new THREE.Group(), broken = i === 2, { g, s } = wonderBand(rad - 1.6, rad, 1.1, broken ? .5 : 0, broken ? Math.PI * 2 - 1.0 : Math.PI * 2);
    // the pivots: a stud each side where this ring rides the one outside it, merged into the ring
    const studs = [-1, 1].map(sx => { const p = new THREE.CylinderGeometry(.5, .5, 2.4, 10).toNonIndexed(); p.rotateZ(Math.PI / 2); p.translate(sx * (rad + .9), 0, 0); p.deleteAttribute('uv'); p.setAttribute('uv', new THREE.Float32BufferAttribute(new Float32Array(p.attributes.position.count * 2), 2)); return p; });
    const rg = mergeGeometries([g, ...studs]); g.dispose(); studs.forEach(x => x.dispose());
    const m = new THREE.Mesh(rg, ringM), sm = new THREE.Mesh(s, scriptM); m.name = 'ring:' + i; sm.name = 'script:' + i; sm.userData.key = 'script'; m.castShadow = m.receiveShadow = true; sm.castShadow = false; pivot.add(m, sm);
    pivot.rotation.set(i === 0 ? 0 : .5 + r() * .7, i * .8 + r(), r() * .4); parent.add(pivot); rings.push({ pivot, rad, axis: i % 2 ? 'x' : 'y', sp: [.035, -.05, .07, -.09][i], base: pivot.rotation.clone() }); parent = pivot;
    tris += rg.attributes.position.count / 3 + s.attributes.position.count / 3; draws += 2; });
  const sunG = new THREE.IcosahedronGeometry(2.0, 4), sun = new THREE.Mesh(sunG, sunM); sun.name = 'sun'; sun.castShadow = true; parent.add(sun); tris += sunG.index ? sunG.index.count / 3 : sunG.attributes.position.count / 3; draws++;
  // the broken quarter of the third ring, fallen on the platform, leaning on a drum
  { const { g, s } = wonderBand(12.5 - 1.6, 12.5, 1.1, 0, 1.46), mx = 11.7 * Math.cos(.73), my = 11.7 * Math.sin(.73), T = new THREE.Matrix4().makeTranslation(-8, py + 1.4, 9).multiply(new THREE.Matrix4().makeRotationFromEuler(new THREE.Euler(-Math.PI / 2 + .12, 0, 2.1))).multiply(new THREE.Matrix4().makeTranslation(-mx, -my, 0));
    put('ring', g.applyMatrix4(T)); put('dead', s.applyMatrix4(T)); }
  const M = { stone: mat('ashlar', { ns: .9, color: 0xf0e4cc, rough: .85 }), floor: mat('flag', { ns: .7, color: 0xe2d4b8, rough: .7 }), ring: ringM, dead: new THREE.MeshStandardMaterial({ color: new THREE.Color(...WBAND_BRONZE).multiplyScalar(.8), map: wonderBandTex(true), roughness: .8, metalness: .15 }) };
  for (const [k, gs] of B) { const clean = gs.map(g => { const x = g.index ? g.toNonIndexed() : g; for (const a of Object.keys(x.attributes)) if (!['position', 'normal', 'uv'].includes(a)) x.deleteAttribute(a); if (!x.attributes.normal) x.computeVertexNormals(); if (!x.attributes.uv) worldUV(x, .25); return x; });
    const g = mergeGeometries(clean); clean.forEach(x => x.dispose()); const m = new THREE.Mesh(g, M[k]); m.name = k; m.userData.key = k; m.castShadow = k !== 'dead'; m.receiveShadow = true; group.add(m); tris += g.attributes.position.count / 3; draws++; }
  // awake: each ring turns on its pivot (the outer once in three minutes, the inner faster), the sun burns and the script pulses over 6 s;
  // asleep the rings stand where they stopped and the script and the sun are dead stone
  function tick(sec, awake) { for (const g of rings) { g.pivot.rotation.copy(g.base); if (awake) g.pivot.rotation[g.axis] += sec * g.sp; }
    const p = .5 + .5 * Math.sin(sec * 2 * Math.PI / 6); scriptM.emissiveIntensity = awake ? 1.0 + 1.4 * p : 0; sunM.emissiveIntensity = awake ? 1.6 + .8 * p : 0; }
  tick(0, !!o.awake);
  return { group, tris: Math.round(tris), draws, top: +py.toFixed(3), base: +base.toFixed(3), foot: +(lo - .6).toFixed(3), plats, cols, pier: { r: 3.2, y: +(py + 3).toFixed(3) }, hub: +hub.y.toFixed(3), tick, script: scriptM, sunMat: sunM,
    size: { across: R * 2, rings: radii.map(v => v * 2), hubOver: +(hub.y - py).toFixed(1), standing: cols.filter(c => c.stand).length, top: +(hub.y + 20.5 - py).toFixed(1) } };
}
  // ── The Gatelands' wonder, the Drowned Ring (Session 1666; backlog L5, "Strange places", OG-106; Michael's C on #898) ──
  // wonders.js's gatelandsLough, copied for the world. The prototype's fen, its peat water and its point light are the world's or left out:
  // the lough is a routed lake of the Gatelands (its water the world's at y 0) whose bed a stamp sinks to 9 m under the ring, the reeds
  // stand on its own shore, and the boardwalk runs out from the nearest shore. The light is left out as the Orrery's was (a light added
  // and taken away recompiles every material); the script and the sigil burn by their own emission. Built over a height function it is
  // handed, in the wonder's frame: the ring's heart at (0, 0), the boardwalk along +z to the shore. The same stream ('wonders:lough')
  // for the piers' conditions as the prototype. The glows take the colour the prototype's page shows (Uisce's blue encoded, as the
  // Fields' seams were, Session 1646: the game's output is linear).
  //   PKIT.wonders.lough(hAt, o) -> { group, tris, draws, piers: [{i, x, z, a, y, h, fallen}], walk: {z0, z1, y, w}, dais: {r, y}, tick(t, awake), size }
  function gatelandsLough(hAt, o = {}) {
    const key = 'wonders:lough', r = stream(key), group = new THREE.Group(), B = new Map(), put = (k, g) => (B.get(k) || B.set(k, []).get(k)).push(g), S = GK_SCHOOLS.uisce, K = 1.5, RR = 26, WATER = o.water ?? 0;
    group.name = 'wonder:lough'; const M = {}, enc = m => { const c = m.clone(); c.emissive.copy(m.emissive).convertLinearToSRGB(); return c; };
    // asleep, the script and the sigil plates are the pier's stone in shadow, a groove (the kit's dead stone, near black, read as holes by day:
    // the critic's word on the Orrery's strips, 31 Oct)
    const sleep = new THREE.MeshStandardMaterial({ color: new THREE.Color(...S.stone).multiplyScalar(.42), roughness: .95 });
    // the piers: eight on the circle at 1.5 times, the odd ones cracked (they lean), the sixth fallen across the ring under the water
    const piers = [], m4 = (x, y, z, a, tilt) => { const T = new THREE.Matrix4().makeTranslation(x, y, z).multiply(new THREE.Matrix4().makeRotationY(a)); if (tilt) T.multiply(new THREE.Matrix4().makeRotationX(tilt)); return T.multiply(new THREE.Matrix4().makeScale(K, K, K)); };
    let footY = 0, nf = 0, pierH = 0;
    for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4 + Math.PI / 8, x = RR * Math.sin(a), z = RR * Math.cos(a), fallen = i === 5, cond = fallen || i % 2 ? 'cracked' : 'whole';
      const W = gkParts('pier', { cond, school: 'uisce', key: `${key}:pier:${i}` }), y = fallen ? hAt(x, z) + 3.2 : hAt(x, z) - .5, T = m4(x, y, z, a, fallen ? -1.42 : 0);
      for (const k in W.by) { M[k] = M[k] || (GK_GLOWS.includes(k) ? enc(W.M[k]) : k === 'dead' ? sleep : W.M[k]); for (const g of W.by[k]) put(k, g.applyMatrix4(T)); } /* one material a key: the tick sets the glows' strength for every pier alike */
      pierH = W.size.h * K; if (!fallen) { footY += y; nf++; }
      piers.push({ i, x: +x.toFixed(2), z: +z.toFixed(2), a: +a.toFixed(4), y: +y.toFixed(2), h: +pierH.toFixed(1), fallen, lean: W.st.lean }); }
    footY /= nf;
    // the lintel ring the piers once carried: two spans still across their piers' heads, the rest gone
    for (const [i, j] of [[0, 1], [3, 4]]) { const a0 = i * Math.PI / 4 + Math.PI / 8, a1 = j * Math.PI / 4 + Math.PI / 8, x0 = RR * Math.sin(a0), z0 = RR * Math.cos(a0), x1 = RR * Math.sin(a1), z1 = RR * Math.cos(a1);
      const len = Math.hypot(x1 - x0, z1 - z0) + 6, g = new THREE.BoxGeometry(len, 2.4, 5.2); worldUV(g, .25); g.rotateY(-Math.atan2(z1 - z0, x1 - x0)); g.translate((x0 + x1) / 2, footY + pierH + 1.2, (z0 + z1) / 2); put('stone', g); } /* the piers' own stone */
    // the dais under the water: three round steps from the bed, its top 2.4 m under the surface, the sigil cut in it
    const top = WATER - 2.4, bed = Math.min(hAt(0, 0), top - 3); { let y = bed - .5; const step = (top - y) / 3; for (const rad of [13, 10, 7]) { const g = new THREE.CylinderGeometry(rad, rad + .2, step, 64, 1); g.translate(0, y + step / 2, 0); put('step', g); y += step; }
      const sg = new THREE.CircleGeometry(6.2, 64); sg.rotateX(-Math.PI / 2); sg.translate(0, top + .02, 0); const uv = sg.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, sg.attributes.position.getX(i) / 12.4 + .5, -sg.attributes.position.getZ(i) / 12.4 + .5); put('sigil', sg); }
    // the boardwalk: from the shore out over the water along +z to 14 m short of the nearest piers, planks 1.6 m wide on posts
    let shore = null; for (let z = RR + 14; z < 420; z += 1) if (hAt(0, z) > WATER + .15) { shore = z; break; }
    const W0 = RR + 12, W1 = Math.min(shore ?? 420, 420) + 6, deck = WATER + .55;
    for (let z = W0; z < W1; z += .32) { const g = new THREE.BoxGeometry(1.6 + (r() - .5) * .1, .06, .26); g.rotateY((r() - .5) * .05); g.translate((r() - .5) * .04, Math.max(deck + Math.sin(z * .07) * .05, hAt(0, z) + .12), z); put('plank', g); }
    for (let z = W0 + .4; z < W1 - 1; z += 2.4) for (const sx of [-.75, .75]) { const gy = hAt(sx, z), h = deck - gy + .3; if (h < .2) continue; const g = new THREE.CylinderGeometry(.07, .08, h, 5, 1, true); g.translate(sx, gy - .3 + h / 2, z); put('plank', g); }
    // reeds round the shore: thin blades in clumps where the water is shallow or the bank just wet, none on the boardwalk
    { const rg = []; for (let k = 0; k < 520; k++) { const a = r() * Math.PI * 2, sx = Math.sin(a), sz = Math.cos(a); let d0 = null; for (let d = RR + 20; d < 440; d += 3) if (hAt(sx * d, sz * d) > WATER - .7) { d0 = d; break; } if (d0 == null) { r(); r(); continue; }
        const d = d0 + (r() - .3) * 10, x = sx * d, z = sz * d, gy = hAt(x, z), n = 4 + Math.floor(r() * 5); if (gy > WATER + .8 || gy < WATER - 1.2 || (Math.abs(x) < 3 && z > 0)) continue;
        for (let j = 0; j < n; j++) { const h = 1.2 + r() * 1.1, g = new THREE.ConeGeometry(.025, h, 3, 1, true); g.translate(0, h / 2, 0); g.rotateZ((r() - .5) * .3); g.rotateY(r() * 6.3); const bx = x + (r() - .5) * .8, bz = z + (r() - .5) * .8; g.translate(bx, Math.max(WATER - .3, hAt(bx, bz)) - .1, bz); rg.push(g); } }
      rg.forEach(g => put('reed', g)); }
    Object.assign(M, { step: mat('ashlar', { ns: .8, color: new THREE.Color(...S.stone).multiplyScalar(.7) }),
      sigil: enc(new THREE.MeshStandardMaterial({ color: new THREE.Color(.05, .045, .04), emissive: new THREE.Color(...S.glow), emissiveIntensity: 2.4, emissiveMap: gkRingTex(), roughness: .6 })),
      plank: mat('wood', { ns: .8, color: 0x8a7a64 }), reed: new THREE.MeshStandardMaterial({ color: new THREE.Color(.42, .44, .2), roughness: .9, side: THREE.DoubleSide }) });
    let tris = 0, draws = 0; const glows = [];
    for (const [k, gs] of B) { const clean = gs.map(g => { const x = g.index ? g.toNonIndexed() : g; for (const a of Object.keys(x.attributes)) if (!['position', 'normal', 'uv'].includes(a)) x.deleteAttribute(a); if (!x.attributes.normal) x.computeVertexNormals(); if (!x.attributes.uv) worldUV(x, .25); return x; });
      const g = mergeGeometries(clean); clean.forEach(x => x.dispose()); const m = new THREE.Mesh(g, M[k]); m.name = k; m.userData.key = k;
      m.castShadow = !['sigil', 'reed', 'script', 'ring', 'dead', 'crack'].includes(k); m.receiveShadow = true; group.add(m); tris += g.attributes.position.count / 3; draws++;
      if (GK_GLOWS.includes(m.userData.key)) { m.userData.on = m.material; glows.push(m); } }
    const sigil = group.getObjectByName('sigil');
    // awake: the script breathes on a 5 s pulse and the sigil under the water a beat behind it; asleep the script is a groove in the stone and
    // the sigil only the dais's own stone
    let was = null;
    function tick(sec, awake) { awake = !!awake; if (was !== awake) { for (const m of glows) m.material = awake ? m.userData.on : sleep; sigil.visible = awake; }
      if (awake) { const p = .5 + .5 * Math.sin(sec * 2 * Math.PI / 5); for (const m of glows) m.material.emissiveIntensity = m.userData.key === 'ring' ? .9 + 1.6 * p : .6 + 1.4 * p; M.sigil.emissiveIntensity = 1.4 + 2.6 * (.5 + .5 * Math.sin(sec * 2 * Math.PI / 5 - 1)); }
      was = awake; }
    tick(0, !!o.awake);
    return { group, tris: Math.round(tris), draws, piers, walk: { z0: W0, z1: W1, y: +(deck + .03).toFixed(3), w: 1.6, shore }, dais: { r: 13, y: +top.toFixed(2), bed: +bed.toFixed(2) }, tick,
      size: { across: RR * 2, high: +(footY + pierH - WATER).toFixed(1), water: +(WATER - bed).toFixed(1), under: +(WATER - top).toFixed(1), walk: +(W1 - W0).toFixed(1) } };
  }
  return { stream, hashKey, mergeByMaterial, wonders: { skyfall: markSkyfall, orrery: aurenneOrrery, lough: gatelandsLough, gatePiece }, halls: { fixtures: hallFixtures }, props: { bench: joinerBench, trunk: felledTrunk }, ships: { sloop: glSloop, sloopBase, cutter: mkCutter, cutterBase, caravel: mkCaravel, caravelBase, cog: mkCog, cogBase, galleon: mkGalleon, galleonBase }, texturesMade: () => Object.keys(TEX).length, signsMade: () => Object.keys(SIGNS).filter(k => !PANEL_KEY.test(k)).length, panelsMade: () => Object.keys(SIGNS).filter(k => PANEL_KEY.test(k)).length,
    mk: { hall: markHall, lot: markLot, alehall: markAlehall, longhouse: markLonghouse, mats: markMats, yard: markYard, ring: markRing },
    au: { house: aurenneHouse, lot: aurenneLot, courtyard: aurenneCourtyard, church: aurenneChurch, churchBox: aurenneChurchBox, churchHall: aurenneChurchHall, courtyardHouse: aurenneCourtyardHouse, tavern: aurenneTavern, mats: aurMats, roomMats: homeMats, AUR },
    gl: { PLANS, FIN, PS, PAINTS, guildHall: guildHallRoom, TOWN: GL_TOWN, building, church, keep, farmstead, coachInn, coachInnPlan, coachRoom, townhouse: townhouseRoom, farmhouse: farmhouseRoom, byre: byreRoom, barn: barnRoom, row: shrineRow, ROW_GODS, inn: gatelandsInn, cottage: gatelandsCottage, churchLen: n => +((n === 2 ? 2 : 3) * 4.8 + 1.6 + 5.6 - .5 + 7.2 - .9 - .02).toFixed(2), lot: gatelandsLot, mats: glMats, BAYS, bayPlan, bayWidth, baysFor } };
})();
