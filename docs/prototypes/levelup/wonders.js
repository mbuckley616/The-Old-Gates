// Strange places (the concept artist, 29 Oct 2026; backlog L5, "Strange places"; OG-106): wonders as landmarks, each the mark a failing
// gate has left on a place (the canon's Part I: "the stranger the failure, the stranger the shape"). One wonder an island, each built
// from the gate kit's own stones (gatekit.js) so a wonder and a gate are one stone, and the ruins' rule (ruins.js) for what lies fallen.
// A metre a unit, the ground at y 0 where the person stands.
//
// gatelandsLough ("a sunken gate still pulsing"): a peat lough 300 m across in a fen, and in it a ring of eight of the kit's piers at
//   1.5 times (6 m square, 31 m high) on a circle 52 m across, standing in 9 m of water, three leaning, one fallen across the ring; under
//   the water at the heart a dais of three steps with the ring sigil cut in it, 2.4 m under the surface. Uisce's blue. A boardwalk of
//   the fens (OG-099's Wildbloom Fens) runs out from the shore to 14 m short of the nearest pier; reeds round the shore.
// markSkyfall ("rocks floating over a snow valley under the aurora", OG-106's Skyfall Fields): a snow valley 300 m long between two
//   slopes; 34 boulders of 1.5 to 13 m hang 4 to 58 m over it, each over the pit it came out of, and two of the kit's walls stand
//   broken in the valley floor with their stones lifted (gatekit's 'broken'). Gaoth's pale blue at the seams under the stones.
// aurenneOrrery ("a shattered observatory whose rings still turn"): a round platform 46 m across on a headland 40 m over the sea, its
//   colonnade of sixteen columns broken to four standing; at its heart a pier carries an armillary of four rings of the kit's stone,
//   41, 33, 25 and 17 m across, nested on pivots, the script cut round each, and a stone sun 4 m across at the heart. The third ring is
//   broken: a quarter of it lies on the platform. Solas's gold.
//
// Every wonder is built once, its geometry the same in every mode; what a mode changes is what moves and what burns (W_MODES):
//   'quiet' (A)  the shape alone: the stones hang still, the rings stand where they stopped, every glyph and seam dead;
//   'alive' (B)  always awake: the stones drift and turn, the rings turn, the script and the seams burn, day and night;
//   'hour'  (C)  quiet by day, awake from dusk to dawn (the hour read from the clock: `night` true from 20h to 5h).
// wonder(kind, { mode, night }) -> { group, tris, draws, ground(x, z), tick(tSeconds), stand: { x, z, ry } (where a person stands to see it,
//   near), view: { wide, near } (the cameras), name, island, awake, lights: [PointLight], size }.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { mat, worldUV, fbm } from './common.js';
import { gatePiece, stream, GK_SCHOOLS } from './gatekit.js';

export const W_MODES = { quiet: 'A, quiet: the shape alone', alive: 'B, alive: always awake', hour: 'C, by the hour: awake from dusk to dawn' };
export const W_KINDS = { lough: { name: 'The Drowned Ring', island: 'gatelands', school: 'uisce' }, skyfall: { name: 'The Skyfall Fields', island: 'mark', school: 'gaoth' },
  orrery: { name: 'The Broken Orrery', island: 'aurenne', school: 'solas' } };
const DEAD = new THREE.MeshStandardMaterial({ color: new THREE.Color(.06, .055, .05), roughness: .9 });
const GLOWS = ['script', 'ring', 'seam'];

// merge a list of [key, geometry] into one mesh a key; materials from M (a key not in M takes `fallback`)
function bake(group, B, M, o = {}) { let tris = 0, draws = 0;
  for (const [k, gs] of B) { const clean = gs.map(g => { const x = g.index ? g.toNonIndexed() : g; for (const a of Object.keys(x.attributes)) if (!['position', 'normal', 'uv', 'color'].includes(a)) x.deleteAttribute(a); if (!x.attributes.normal) x.computeVertexNormals(); if (!x.attributes.uv) worldUV(x, .25); return x; });
    const g = mergeGeometries(clean, false), m = new THREE.Mesh(g, M[k]); m.name = k; m.userData.key = k; m.castShadow = !(o.noCast || []).includes(k); m.receiveShadow = true; group.add(m); tris += g.attributes.position.count / 3; draws++; }
  return { tris, draws }; }
const putter = B => (k, g) => (B.get(k) || B.set(k, []).get(k)).push(g);
// the gate kit's pieces, placed and merged in world space by material; returns the merged meshes' count
function mergePieces(group, pieces) { const by = new Map(); let tris = 0, draws = 0; group.updateMatrixWorld(true);
  for (const P of pieces) { P.updateMatrixWorld(true); P.traverse(m => { if (!m.isMesh) return; const k = m.material; (by.get(k) || by.set(k, { key: m.userData.key, gs: [] }).get(k)).gs.push(m.geometry.clone().applyMatrix4(m.matrixWorld)); }); }
  for (const [m, { key, gs }] of by) { const g = mergeGeometries(gs, false), mesh = new THREE.Mesh(g, m); mesh.userData.key = key; mesh.name = 'kit:' + key; mesh.castShadow = !GLOWS.includes(key) && key !== 'crack' && key !== 'dead'; mesh.receiveShadow = true; group.add(mesh); tris += g.attributes.position.count / 3; draws++; }
  return { tris, draws }; }
// a rough boulder: an icosahedron pushed about by noise, its underside flattened a little
function boulderGeo(r, seed, flat = .75) { const g = new THREE.IcosahedronGeometry(1, 3), p = g.attributes.position, v = new THREE.Vector3();
  for (let i = 0; i < p.count; i++) { v.fromBufferAttribute(p, i); const n = fbm(v.x * 1.3 + seed, v.z * 1.3 - seed * .7 + v.y, 4); v.multiplyScalar(1 + n * .55); if (v.y < 0) v.y *= flat; p.setXYZ(i, v.x * r, v.y * r * .8, v.z * r); }
  g.computeVertexNormals(); return worldUV(g, .35 / Math.max(1, r * .25)); }
// the ring sigil, drawn as gatekit draws it (its ringTex is private), white on black for an emissive map
let _ring = null;
function ringTex() { if (_ring) return _ring; const c = document.createElement('canvas'); c.width = c.height = 512; const x = c.getContext('2d'); x.fillStyle = '#000'; x.fillRect(0, 0, 512, 512); x.strokeStyle = '#fff'; x.fillStyle = '#fff'; x.lineCap = 'round';
  x.lineWidth = 16; x.beginPath(); x.arc(256, 256, 170, 0, 7); x.stroke(); x.lineWidth = 9; x.beginPath(); x.arc(256, 256, 96, 0, 7); x.stroke();
  x.lineWidth = 10; x.beginPath(); x.moveTo(256, 20); x.lineTo(256, 492); x.moveTo(20, 256); x.lineTo(492, 256); x.stroke(); x.beginPath(); x.arc(256, 256, 18, 0, 7); x.fill();
  const t = new THREE.CanvasTexture(c); t.anisotropy = 8; return (_ring = t); }
// glyphs round a band: the gate slice's seven shapes on a long strip (u along the band), white on black
let _band = null;
function bandTex() { if (_band) return _band; const L = 4096, S = 64, c = document.createElement('canvas'); c.width = L; c.height = S; const x = c.getContext('2d'), r = stream('wonders:band'); x.fillStyle = '#000'; x.fillRect(0, 0, L, S); x.strokeStyle = '#fff'; x.lineCap = 'round'; x.lineWidth = 4;
  for (let i = 0; i < 80; i++) { const k = Math.floor(r() * 7); x.save(); x.translate(26 + i * 51, 32); x.beginPath();
    if (k === 0) { x.arc(0, 0, 12, 0, 7); x.moveTo(0, -18); x.lineTo(0, 18); } else if (k === 1) { x.moveTo(-12, 18); x.lineTo(0, -18); x.lineTo(12, 18); x.moveTo(-7, 4); x.lineTo(7, 4); }
    else if (k === 2) { x.arc(0, 0, 13, .6, 5.7); x.moveTo(2, 0); x.arc(0, 0, 2, 0, 7); } else if (k === 3) { x.moveTo(-12, -14); x.lineTo(12, -14); x.moveTo(0, -14); x.lineTo(0, 18); x.moveTo(-8, 2); x.lineTo(8, 10); }
    else if (k === 4) { x.moveTo(-12, 0); x.lineTo(0, -16); x.lineTo(12, 0); x.lineTo(0, 16); x.closePath(); } else if (k === 5) { x.moveTo(-10, -16); x.lineTo(-10, 16); x.moveTo(10, -16); x.lineTo(10, 16); x.moveTo(-10, 0); x.lineTo(10, 0); }
    else { x.moveTo(0, -18); x.lineTo(0, 18); x.moveTo(-10, -8); x.lineTo(0, -2); x.lineTo(10, -8); } x.stroke(); x.restore(); }
  const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 8; return (_band = t); }
const glowMat = (map, col, k) => new THREE.MeshStandardMaterial({ color: new THREE.Color(.05, .045, .04), emissive: new THREE.Color(...col), emissiveIntensity: k, emissiveMap: map, roughness: .6 });

// ── the Gatelands: the Drowned Ring ──
function lough(o) {
  const key = 'wonders:lough', r = stream(key), group = new THREE.Group(), B = new Map(), put = putter(B), S = GK_SCHOOLS.uisce, K = 1.5, RR = 26, LR = 150;
  // the land: a fen round a lough (open water within LR, its bed falling to 9 m under the ring), hummocks and pools beyond
  const ground = (x, z) => { const d = Math.hypot(x, z + 40), e = Math.max(0, d - LR); return e > 0 ? .25 + Math.min(1, e / 20) * (.6 + fbm(x / 30, z / 30, 4) * 2.4) + Math.max(0, e - 200) * .06 : -Math.min(9, (LR - d) * .2 + .4) + fbm(x / 20, z / 20, 3) * .6; };
  const CZ = -40, WATER = 0;
  { const N = 220, g = new THREE.PlaneGeometry(1400, 1400, N, N); g.rotateX(-Math.PI / 2); const P = g.attributes.position, col = new Float32Array(P.count * 3);
    for (let i = 0; i < P.count; i++) { const x = P.getX(i), z = P.getZ(i), y = ground(x, z); P.setY(i, y); const t = Math.min(1, Math.max(0, fbm(x / 14, z / 14, 3) + .5)), wet = y < .5 ? 1 : 0;
      const c = y < -.3 ? [.14, .11, .07] : wet ? [.22 + .06 * t, .26 + .05 * t, .10] : [.20 + .14 * t, .30 + .12 * t, .10 + .04 * t]; if (y > .3 && fbm(x / 9 + 4, z / 9, 3) > .25) c.splice(0, 3, .42, .30, .38); col.set(c, i * 3); }
    g.setAttribute('color', new THREE.BufferAttribute(col, 3)); g.computeVertexNormals(); put('land', g); }
  // the piers: eight on the circle, the kit's pier at K; four lean (the kit's 'cracked'), one has fallen across the ring
  const pieces = [], piers = [];
  for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4 + Math.PI / 8, x = RR * Math.sin(a), z = CZ + RR * Math.cos(a);
    if (i === 5) continue; /* fallen: laid below */
    const P = gatePiece('pier', { cond: i % 2 ? 'cracked' : 'whole', school: 'uisce', key: `${key}:pier:${i}` }); P.scale.setScalar(K); P.rotation.y = a; P.position.set(x, ground(x, z) - .5, z); group.add(P); pieces.push(P); piers.push({ i, x: +x.toFixed(1), z: +z.toFixed(1), cond: P.userData.cond, lean: P.userData.lean }); }
  { const a = 5 * Math.PI / 4 + Math.PI / 8, x = RR * Math.sin(a), z = CZ + RR * Math.cos(a), P = gatePiece('pier', { cond: 'cracked', school: 'uisce', key: `${key}:pier:5` });
    P.scale.setScalar(K); P.rotation.set(0, a, 0); P.rotateX(-1.42); P.position.set(x, ground(x, z) + 3.2, z); group.add(P); pieces.push(P); piers.push({ i: 5, fallen: true }); }
  // the lintel ring the piers once carried: two spans still sit across their piers' heads (one each side), the rest gone
  for (const [i, j] of [[0, 1], [3, 4]]) { const a0 = i * Math.PI / 4 + Math.PI / 8, a1 = j * Math.PI / 4 + Math.PI / 8, x0 = RR * Math.sin(a0), z0 = CZ + RR * Math.cos(a0), x1 = RR * Math.sin(a1), z1 = CZ + RR * Math.cos(a1);
    const len = Math.hypot(x1 - x0, z1 - z0) + 6, g = new THREE.BoxGeometry(len, 2.4, 5.2); worldUV(g, .25); g.rotateY(-Math.atan2(z1 - z0, x1 - x0)); g.translate((x0 + x1) / 2, ground((x0 + x1) / 2, (z0 + z1) / 2) * 0 - 9 + 20.6 * K + 1.2 + .4, (z0 + z1) / 2); put('lintel', g); }
  // the dais under the water: three round steps, its top 2.4 m under the surface, the sigil cut in it
  const top = WATER - 2.4; { const rs = [13, 10, 7]; let y = -9; const step = (top - y) / 3; for (const rad of rs) { const g = new THREE.CylinderGeometry(rad, rad + .2, step, 64, 1); g.translate(0, y + step / 2, CZ); put('step', g); y += step; }
    const s = new THREE.CircleGeometry(6.2, 64); s.rotateX(-Math.PI / 2); s.translate(0, top + .02, CZ); const uv = s.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, s.attributes.position.getX(i) / 12.4 + .5, -(s.attributes.position.getZ(i) - CZ) / 12.4 + .5); put('sigil', s); }
  // the water: a peat-brown surface you see a little way into
  { const g = new THREE.CircleGeometry(LR + 6, 96); g.rotateX(-Math.PI / 2); g.translate(0, WATER, CZ); put('water', g); }
  // the boardwalk: from the shore (z = 110) out over the water to 14 m short of the near pier, planks on posts, 1.6 m wide
  const BW0 = LR - 40 + 4, BW1 = CZ + RR + 14; { for (let z = BW0; z > BW1; z -= .32) { const g = new THREE.BoxGeometry(1.6 + (r() - .5) * .1, .06, .26); g.rotateY((r() - .5) * .05); g.translate((r() - .5) * .04, .55 + Math.sin(z * .07) * .05, z); put('plank', g); }
    for (let z = BW0; z > BW1; z -= 2.4) for (const sx of [-.75, .75]) { const g = new THREE.CylinderGeometry(.07, .08, 3.4, 6); g.translate(sx, -1.1, z); put('plank', g); } }
  // reeds round the shore: thin blades in clumps
  { const rg = []; for (let k = 0; k < 900; k++) { const a = r() * Math.PI * 2, d = LR - 6 + r() * 14, x = Math.sin(a) * d, z = CZ + Math.cos(a) * d; if (Math.abs(x) < 3 && z > 0) continue; const n = 4 + Math.floor(r() * 5);
      for (let j = 0; j < n; j++) { const h = 1.2 + r() * 1.1, g = new THREE.ConeGeometry(.025, h, 3, 1); g.translate(0, h / 2, 0); g.rotateZ((r() - .5) * .3); g.rotateY(r() * 6.3); g.translate(x + (r() - .5) * .8, Math.max(-.2, ground(x, z)) - .1, z + (r() - .5) * .8); rg.push(g); } }
    put('reed', mergeGeometries(rg.map(g => g.toNonIndexed()))); }
  const M = { land: new THREE.MeshStandardMaterial({ vertexColors: true, roughness: .97 }), lintel: mat('ashlar', { ns: 1, color: new THREE.Color(...S.stone) }), step: mat('ashlar', { ns: .8, color: new THREE.Color(...S.stone).multiplyScalar(.7) }),
    sigil: glowMat(ringTex(), S.glow, 2.4), water: new THREE.MeshStandardMaterial({ color: new THREE.Color(.20, .27, .30), roughness: .12, metalness: 0, transparent: true, opacity: .84, depthWrite: false }),
    plank: mat('wood', { ns: .8, color: 0x8a7a64 }), reed: new THREE.MeshStandardMaterial({ color: new THREE.Color(.42, .44, .2), roughness: .9 }) };
  M.sigil.userData.glow = 1;
  const a = mergePieces(group, pieces); pieces.forEach(p => group.remove(p)); const b = bake(group, B, M, { noCast: ['land', 'water', 'sigil'] });
  group.getObjectByName('water').renderOrder = 2;
  // under the water a light the colour of the script, for the night and the pulse
  const L = new THREE.PointLight(new THREE.Color(...S.glow), 0, 70, 1.6); L.position.set(0, top + 1, CZ); group.add(L);
  const near = { x: 0, z: BW1 + 2.5, ry: Math.PI };
  return { group, tris: a.tris + b.tris, draws: a.draws + b.draws, ground, lights: [L], stand: near, piers, size: { across: RR * 2, high: +(20.6 * K + 1.2).toFixed(1), water: 9, under: 2.4 },
    view: { wide: [-46, 9, 92, 0, 13, CZ], near: [5, 2.6, BW1 + 9, -4, 9, CZ - 4] },
    // alive: the script breathes on a 5 s pulse, the sigil under the water a beat behind it, and the water rings out over the sigil
    tick(t, on) { const p = .5 + .5 * Math.sin(t * 2 * Math.PI / 5); group.traverse(m => { if (m.isMesh && m.userData.key === 'script') m.material.emissiveIntensity = on ? .6 + 1.4 * p : 0; if (m.isMesh && m.userData.key === 'ring') m.material.emissiveIntensity = on ? .9 + 1.6 * p : 0; });
      M.sigil.emissiveIntensity = on ? 1.4 + 2.6 * (.5 + .5 * Math.sin(t * 2 * Math.PI / 5 - 1)) : 0; L.intensity = on ? 900 + 1400 * p : 0; } };
}

// ── the Mark: the Skyfall Fields ──
function skyfall(o) {
  const key = 'wonders:skyfall', r = stream(key), group = new THREE.Group(), B = new Map(), put = putter(B), S = GK_SCHOOLS.gaoth;
  // a valley along z: its floor about 0, the slopes climbing to 120 m at 260 m out, with ridges
  const ground = (x, z) => { const ax = Math.abs(x + fbm(z / 200, 3, 2) * 40), s = Math.max(0, ax - 60); return fbm(x / 40, z / 40, 4) * 1.6 + s * s * .0022 + Math.max(0, s - 40) * .35 * (1 + fbm(x / 70, z / 70, 4)); };
  { const N = 240, g = new THREE.PlaneGeometry(1600, 1600, N, N); g.rotateX(-Math.PI / 2); g.translate(0, 0, -300); const P = g.attributes.position;
    for (let i = 0; i < P.count; i++) P.setY(i, ground(P.getX(i), P.getZ(i))); g.computeVertexNormals(); const col = new Float32Array(P.count * 3), N2 = g.attributes.normal;
    for (let i = 0; i < P.count; i++) { const st = N2.getY(i), x = P.getX(i), z = P.getZ(i), rock = st < .78 || fbm(x / 11, z / 11, 3) > .42; col.set(rock ? [.30, .30, .32] : [.86, .89, .94], i * 3); }
    g.setAttribute('color', new THREE.BufferAttribute(col, 3)); put('land', g); }
  // the stones: 34 boulders hung over the valley floor, each over the pit it rose from; the biggest highest
  const stones = [];
  for (let k = 0; k < 34; k++) { const x = (r() - .5) * 130, z = -40 - r() * 300, big = Math.pow(r(), 2.2), rad = 1.5 + big * 11.5, lift = 4 + big * 32 + r() * 22, y = ground(x, z) + rad + lift;
    const g = boulderGeo(rad, k * 3.1); const m = new THREE.Mesh(g, null); m.position.set(x, y, z); m.rotation.set(r() * .6, r() * 6.3, r() * .6); stones.push({ m, x, y, z, rad, lift, ph: r() * 6.3, sp: .06 + r() * .1 });
    // the pit under it: a dark hollow ringed by thrown earth
    const pit = new THREE.RingGeometry(rad * .55, rad * 1.05, 24); pit.rotateX(-Math.PI / 2); pit.translate(x, ground(x, z) + .08, z); put('pit', pit);
    const hole = new THREE.CircleGeometry(rad * .56, 24); hole.rotateX(-Math.PI / 2); hole.translate(x, ground(x, z) + .1, z); put('hole', hole);
    // under the biggest, a seam: the glow at the stone's foot, where it tore from the ground
    if (rad > 5) { const sg = boulderGeo(rad * .5, k * 3.1 + 9, .2); sg.scale(1, .12, 1); sg.translate(x, y - rad * .62, z); put('seamS', sg); } }
  // two of the kit's walls stand broken in the valley floor, their stones lifted (gatekit's 'broken'), Gaoth's stone
  const pieces = []; for (const [i, x, z, a] of [[0, -18, -120, .3], [1, 22, -205, -.5]]) { const P = gatePiece('wall', { cond: 'broken', school: 'gaoth', key: `${key}:wall:${i}` }); P.scale.setScalar(1.4); P.rotation.y = a; P.position.set(x, ground(x, z) - .4, z); group.add(P); pieces.push(P); }
  // pines on the slopes, dark cones
  { const pg = []; for (let k = 0; k < 420; k++) { const x = (r() < .5 ? -1 : 1) * (60 + r() * 200), z = -r() * 900 + 100, y = ground(x, z); if (y > 95) continue; const h = 7 + r() * 9, g = new THREE.ConeGeometry(h * .22, h, 6, 1); g.translate(x, y + h / 2 - .3, z); pg.push(g.toNonIndexed()); }
    put('pine', mergeGeometries(pg)); }
  const rock = mat('rock', { ns: 1.3, color: 0x8a8a92, rough: .95 });
  const M = { land: new THREE.MeshStandardMaterial({ vertexColors: true, roughness: .9 }), pit: new THREE.MeshStandardMaterial({ color: new THREE.Color(.28, .25, .22), roughness: 1 }), hole: new THREE.MeshStandardMaterial({ color: new THREE.Color(.06, .05, .05), roughness: 1 }),
    seamS: new THREE.MeshStandardMaterial({ color: new THREE.Color(.1, .12, .14), emissive: new THREE.Color(...S.glow), emissiveIntensity: 1.6, roughness: .5 }), pine: new THREE.MeshStandardMaterial({ color: new THREE.Color(.09, .15, .11), roughness: .95 }) };
  const a = mergePieces(group, pieces); pieces.forEach(p => group.remove(p)); const b = bake(group, B, M, { noCast: ['land', 'pit', 'hole', 'seamS'] });
  // the stones stay their own meshes, to drift (34 draws; the game would instance them)
  let st = 0; for (const s of stones) { s.m.material = rock; s.m.castShadow = s.m.receiveShadow = true; s.m.userData.base = s.m.rotation.clone(); group.add(s.m); st += s.m.geometry.index ? s.m.geometry.index.count / 3 : s.m.geometry.attributes.position.count / 3; }
  const seam = group.getObjectByName('seamS'); seam.userData.key = 'seam';
  const near = { x: 6, z: -66, ry: Math.PI * .9 };
  return { group, tris: a.tris + b.tris + st, draws: a.draws + b.draws + stones.length, ground, lights: [], stand: near, stones: stones.map(s => ({ r: +s.rad.toFixed(1), lift: +s.lift.toFixed(1) })),
    size: { stones: stones.length, biggest: +Math.max(...stones.map(s => s.rad * 2)).toFixed(1), highest: +Math.max(...stones.map(s => s.lift)).toFixed(1) },
    view: { wide: [-30, 16, 40, 10, 34, -180], near: [10, 2.0, -58, -6, 14, -110] },
    // alive: each stone rises and settles over 8 to 16 s and turns slowly; the seams breathe
    tick(t, on) { for (const s of stones) { s.m.position.y = s.y + (on ? Math.sin(t * s.sp * 2 + s.ph) * (.4 + s.rad * .08) : 0); s.m.rotation.y = s.m.userData.base.y + (on ? t * s.sp * .2 : 0); }
      const p = .5 + .5 * Math.sin(t * 2 * Math.PI / 7); group.traverse(m => { if (m.isMesh && (m.userData.key === 'seam' || m.userData.key === 'script')) m.material.emissiveIntensity = on ? (m === seam ? .5 + .9 * p : .7 + 1.0 * p) : 0; }); } };
}

// ── Aurenne: the Broken Orrery ──
// a band of stone round a circle in the xy plane (the ring stands upright), from a0 to a1, radius r0 to r1, th thick; its glyph band
// on both faces as a second geometry (u along the band)
function band(r0, r1, th, a0 = 0, a1 = Math.PI * 2, n = 96) { const pos = [], uv = [], gl = [], gu = [], seg = Math.max(8, Math.round(n * (a1 - a0) / (Math.PI * 2)));
  const P = (rr, a, z) => [rr * Math.cos(a), rr * Math.sin(a), z], quad = (A, Bq, C, D, U) => { pos.push(...A, ...Bq, ...C, ...A, ...C, ...D); uv.push(...U); };
  for (let i = 0; i < seg; i++) { const a = a0 + (a1 - a0) * i / seg, b = a0 + (a1 - a0) * (i + 1) / seg, u0 = a * r1 * .25, u1 = b * r1 * .25;
    for (const z of [th / 2, -th / 2]) { const s = z > 0 ? 1 : -1, A = P(r0, a, z), Bq = P(r1, a, z), C = P(r1, b, z), D = P(r0, b, z); if (s > 0) quad(A, Bq, C, D, [u0, 0, u0, 1, u1, 1, u0, 0, u1, 1, u1, 0]); else quad(A, D, C, Bq, [u0, 0, u1, 0, u1, 1, u0, 0, u1, 1, u0, 1]);
      // the glyph strip, 0.6 of the band's width, just proud of the face
      const g0 = r0 + (r1 - r0) * .2, g1 = r0 + (r1 - r0) * .8, zz = z + s * .02, ga = P(g0, a, zz), gb = P(g1, a, zz), gc = P(g1, b, zz), gd = P(g0, b, zz), U0 = a * g1 / 3.2, U1 = b * g1 / 3.2;
      if (s > 0) { gl.push(...ga, ...gb, ...gc, ...ga, ...gc, ...gd); gu.push(U0, 0, U0, 1, U1, 1, U0, 0, U1, 1, U1, 0); } else { gl.push(...ga, ...gd, ...gc, ...ga, ...gc, ...gb); gu.push(U0, 0, U1, 0, U1, 1, U0, 0, U1, 1, U0, 1); } }
    for (const rr of [r1, r0]) { const A = P(rr, a, th / 2), Bq = P(rr, a, -th / 2), C = P(rr, b, -th / 2), D = P(rr, b, th / 2); if (rr === r1) quad(A, Bq, C, D, [u0, 0, u0, th * .25, u1, th * .25, u0, 0, u1, th * .25, u1, 0]); else quad(A, D, C, Bq, [u0, 0, u1, 0, u1, th * .25, u0, 0, u1, th * .25, u0, th * .25]); } }
  if (a1 - a0 < Math.PI * 2 - 1e-3) for (const a of [a0, a1]) { const s = a === a0 ? 1 : -1, A = P(r0, a, th / 2), Bq = P(r1, a, th / 2), C = P(r1, a, -th / 2), D = P(r0, a, -th / 2); if (s > 0) quad(A, D, C, Bq, [0, 0, 0, .3, .3, .3, 0, 0, .3, .3, .3, 0]); else quad(A, Bq, C, D, [0, 0, 0, .3, .3, .3, 0, 0, .3, .3, .3, 0]); }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.computeVertexNormals();
  const s = new THREE.BufferGeometry(); s.setAttribute('position', new THREE.Float32BufferAttribute(gl, 3)); s.setAttribute('uv', new THREE.Float32BufferAttribute(gu, 2)); s.computeVertexNormals(); return { g, s }; }
function orrery(o) {
  const key = 'wonders:orrery', r = stream(key), group = new THREE.Group(), B = new Map(), put = putter(B), S = GK_SCHOOLS.solas, R = 23, CLIFF = -95, SEA = -40;
  const ground = (x, z) => { const d = Math.hypot(x, z), roll = fbm(x / 50, z / 50, 4) * 7 * Math.min(1, Math.max(0, (d - R - 14) / 50)); return .1 * fbm(x / 9, z / 9, 2) + roll + (z < CLIFF + 8 ? -1.4 * (z - CLIFF - 8) ** 2 / 50 : 0); };
  { const N = 200, g = new THREE.PlaneGeometry(900, 900, N, N); g.rotateX(-Math.PI / 2); g.translate(0, 0, 250); const P = g.attributes.position, col = new Float32Array(P.count * 3);
    for (let i = 0; i < P.count; i++) { const x = P.getX(i), z = Math.max(CLIFF, P.getZ(i)); P.setXYZ(i, x, ground(x, z), z); const t = Math.min(1, Math.max(0, fbm(x / 12, z / 12, 3) + .5)); col.set([.62 + .12 * t, .52 + .1 * t, .30 + .06 * t].map((v, j) => fbm(x / 40 + 7, z / 40, 3) > .1 ? [.44, .46, .26][j] : v), i * 3); }
    g.setAttribute('color', new THREE.BufferAttribute(col, 3)); g.computeVertexNormals(); put('land', g); }
  { const N2 = 140, M2 = 14, pos = []; const Pt = (i, j) => { const x = -450 + 900 * i / N2, y = SEA - 4 + (ground(x, CLIFF) - SEA + 4) * j / M2; return [x, y, CLIFF - 1.5 + fbm(x / 7, y / 7, 3) * 4 - (M2 - j) * .3]; };
    for (let i = 0; i < N2; i++) for (let j = 0; j < M2; j++) { const a = Pt(i, j), b = Pt(i + 1, j), c = Pt(i + 1, j + 1), d = Pt(i, j + 1); pos.push(...a, ...c, ...b, ...a, ...d, ...c); }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.computeVertexNormals(); worldUV(g, .1); put('cliff', g); }
  { const g = new THREE.PlaneGeometry(4000, 2000); g.rotateX(-Math.PI / 2); g.translate(0, SEA, CLIFF - 1000); put('sea', g); }
  // the platform: three steps, 46, 41 and 36 m across
  let py = ground(0, 0) - .2; for (const [k, rad] of [[0, R], [1, R - 2.5], [2, R - 5]]) { const g = new THREE.CylinderGeometry(rad, rad + .1, .8, 96, 1); g.translate(0, py + .4, 0); put(k === 2 ? 'floor' : 'stone', g); py += .8; }
  // the colonnade: sixteen columns on the top step's edge, 1.3 m across and 11 m high with a capital; four stand, the rest broken low, their drums fallen
  const CR = R - 3.6, colH = 11, cols = []; for (let i = 0; i < 16; i++) { const a = i * Math.PI / 8 + .1, x = CR * Math.sin(a), z = CR * Math.cos(a), stand = [1, 6, 7, 12].includes(i), h = stand ? colH : 1 + r() * 4.5;
    const g = new THREE.CylinderGeometry(.62, .68, h, 16, 1); g.translate(x, py + h / 2, z); put('stone', g); const b = new THREE.BoxGeometry(1.8, .5, 1.8); b.translate(x, py + .25, z); put('stone', b);
    if (stand) { const c = new THREE.BoxGeometry(1.9, .7, 1.9); c.translate(x, py + h + .35, z); put('stone', c); }
    else for (let d = 0; d < 2; d++) { const dl = 1.4 + r(), dg = new THREE.CylinderGeometry(.62, .62, dl, 14, 1); dg.rotateZ(Math.PI / 2); dg.rotateY(r() * 6.3); const fa = a + (r() - .5) * .4, fd = CR + 2 + r() * 6; dg.translate(fd * Math.sin(fa), ground(fd * Math.sin(fa), fd * Math.cos(fa)) + .62 + (fd < R ? py - ground(0, 0) : 0), fd * Math.cos(fa)); put('stone', dg); }
    cols.push({ i, stand, h: +h.toFixed(1) }); }
  // the pivot pier at the heart and the armillary on it: rings of 20.5, 16.5, 12.5 and 8.5 m radius, 1.6 m deep and 1.1 m thick, nested on pivots
  const hub = new THREE.Vector3(0, py + 3 + 20.5, 0); { /* the outer ring's foot rides the pedestal's top */ const g = new THREE.CylinderGeometry(2.2, 3.2, 3, 8, 1); g.translate(0, py + 1.5, 0); put('stone', g); }
  const rings = [], ringM = mat('ashlar', { ns: .9, color: new THREE.Color(...S.stone).multiplyScalar(.95) }), scriptM = glowMat(bandTex(), S.glow, 2.0), sunM = new THREE.MeshStandardMaterial({ color: new THREE.Color(.5, .38, .2), emissive: new THREE.Color(...S.glow), emissiveIntensity: 0, roughness: .45, metalness: .3 });
  scriptM.userData.glow = 1; let rt = 0;
  const radii = [20.5, 16.5, 12.5, 8.5]; let parent = new THREE.Group(); parent.position.copy(hub); group.add(parent); const root = parent;
  radii.forEach((rad, i) => { const pivot = new THREE.Group(), broken = i === 2, { g, s } = band(rad - 1.6, rad, 1.1, broken ? .5 : 0, broken ? Math.PI * 2 - 1.0 : Math.PI * 2);
    const m = new THREE.Mesh(g, ringM), sm = new THREE.Mesh(s, scriptM); sm.userData.key = 'script'; m.castShadow = m.receiveShadow = true; pivot.add(m, sm);
    // the pivots: a stud each side where this ring rides the one outside it
    for (const sx of [-1, 1]) { const p = new THREE.Mesh(new THREE.CylinderGeometry(.5, .5, 2.4, 10), ringM); p.rotation.z = Math.PI / 2; p.position.set(sx * (rad + .9), 0, 0); p.castShadow = true; pivot.add(p); }
    pivot.rotation.set(i === 0 ? 0 : .5 + r() * .7, i * .8 + r(), r() * .4); parent.add(pivot); rings.push({ pivot, rad, axis: i % 2 ? 'x' : 'y', sp: [.035, -.05, .07, -.09][i], base: pivot.rotation.clone() }); parent = pivot;
    rt += g.attributes.position.count / 3 + s.attributes.position.count / 3; });
  const sun = new THREE.Mesh(new THREE.IcosahedronGeometry(2.0, 4), sunM); parent.add(sun); sun.castShadow = true; rt += 320 * 2;
  // the broken quarter of the third ring, fallen on the platform, leaning on a drum
  { const { g, s } = band(12.5 - 1.6, 12.5, 1.1, 0, 1.46), mx = 11.7 * Math.cos(.73), my = 11.7 * Math.sin(.73); g.translate(-mx, -my, 0); s.translate(-mx, -my, 0); const m = new THREE.Mesh(g, ringM), sm = new THREE.Mesh(s, DEAD); const f = new THREE.Group(); f.add(m, sm); m.castShadow = m.receiveShadow = true;
    f.rotation.set(-Math.PI / 2 + .12, 0, 2.1); f.position.set(-8, py + 1.4, 9); group.add(f); }
  const M = { land: new THREE.MeshStandardMaterial({ vertexColors: true, roughness: .96 }), cliff: mat('rock', { ns: 1.3, color: 0xe6dcc6, rough: .95 }), sea: new THREE.MeshStandardMaterial({ color: new THREE.Color(.06, .26, .36), roughness: .12, metalness: .1 }),
    stone: mat('ashlar', { ns: .9, color: 0xf0e4cc, rough: .85 }), floor: mat('slab', { ns: .7, color: 0xe2d4b8, rough: .7 }) };
  const b = bake(group, B, M, { noCast: ['land', 'sea', 'cliff'] });
  const L = new THREE.PointLight(new THREE.Color(...S.glow), 0, 80, 1.8); L.position.copy(hub); group.add(L);
  const near = { x: 3, z: 34, ry: Math.PI * 1.05 };
  return { group, tris: b.tris + rt, draws: b.draws + 4 * 4 + 2, ground, lights: [L], stand: near, cols, size: { across: R * 2, rings: radii.map(v => v * 2), hub: +(hub.y - py).toFixed(1), cliff: -SEA },
    view: { wide: [-58, 22, 82, 0, 18, -6], near: [13, 3.2, 50, -2, 15, 0] },
    // alive: each ring turns on its pivot, the outer once in three minutes, the inner faster, the sun at the heart burns and the script pulses
    tick(t, on) { for (const g of rings) { g.pivot.rotation.copy(g.base); if (on) g.pivot.rotation[g.axis] += t * g.sp; }
      const p = .5 + .5 * Math.sin(t * 2 * Math.PI / 6); scriptM.emissiveIntensity = on ? 1.0 + 1.4 * p : 0; sunM.emissiveIntensity = on ? 1.6 + .8 * p : 0; L.intensity = on ? 260 + 160 * p : 0; } };
}

const BUILD = { lough, skyfall, orrery };
export function wonder(kind, o = {}) {
  const mode = W_MODES[o.mode] ? o.mode : 'hour', W = BUILD[kind](o), awake = mode === 'alive' || (mode === 'hour' && !!o.night);
  // asleep, every glyph, ring and seam is dead stone: the materials are swapped, the geometry is the same in every mode
  if (!awake) W.group.traverse(m => { if (m.isMesh && GLOWS.includes(m.userData.key)) m.material = DEAD; if (m.isMesh && m.material && m.material.userData && m.material.userData.glow) m.material = DEAD; });
  W.tick(o.t ?? 0, awake);
  // counted from the meshes: the wonder itself, and its setting (the land, the water, the reeds, the pines, the cliff and the sea)
  const SET = ['land', 'water', 'reed', 'pine', 'cliff', 'sea', 'pit', 'hole', 'plank']; let tris = 0, draws = 0, setTris = 0, setDraws = 0;
  W.group.traverse(m => { if (!m.isMesh) return; const n = (m.geometry.index ? m.geometry.index.count : m.geometry.attributes.position.count) / 3; if (SET.includes(m.name)) { setTris += n; setDraws++; } else { tris += n; draws++; } });
  return { ...W, kind, mode, awake, name: W_KINDS[kind].name, island: W_KINDS[kind].island, tris: Math.round(tris), draws, setting: { tris: Math.round(setTris), draws: setDraws }, tick: t => W.tick(t, awake) };
}
