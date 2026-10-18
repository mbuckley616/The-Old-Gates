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
  return { stream, hashKey, mergeByMaterial, texturesMade: () => Object.keys(TEX).length, signsMade: () => Object.keys(SIGNS).filter(k => !PANEL_KEY.test(k)).length, panelsMade: () => Object.keys(SIGNS).filter(k => PANEL_KEY.test(k)).length,
    gl: { PLANS, FIN, PS, PAINTS, TOWN: GL_TOWN, building, church, churchLen: n => +((n === 2 ? 2 : 3) * 4.8 + 1.6 + 5.6 - .5 + 7.2 - .9 - .02).toFixed(2), lot: gatelandsLot, mats: glMats, BAYS, bayPlan, bayWidth, baysFor } };
})();
