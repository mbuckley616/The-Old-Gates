// A gate's condition, seen (the concept artist, 4 Nov 2026; backlog L10, "A gate's condition, seen"; OG-120, card F5): one nave of
// the gate kit (gatekit.js, whose stones already take the three conditions, Session 1097) lit as its condition. A metre a unit, the
// floor's top at y 0, the nave running down -z from its threshold.
//
// The hall: gatekit-page.js's nave, four bays of 14 m, piers 4 m square and 20.3 m high either side of a floor 26.9 m between their faces,
// an arcade arch between each pair, a rib vault over every bay to 33.3 m, the aisle walls (12 m) behind the arcades. At its end a wall of
// the kit's stone with the arch for a door (10 m wide, 18 m to its point) and two stone leaves 0.5 m thick in it, script up their meeting
// edge and the ring sigil across them; left of the door a lift (OG-120's "working lifts"): a platform of 3.4 m square on four chains
// between two posts of 16 m, up to a gallery at 12 m. Beyond the door, the ring chamber: the gate's ring of 24 stones, 16 m across,
// stood on its edge round its core. A lantern stone (0.5 by 0.8 m) on each pier's nave face at 7 m is the hall's own light.
//
// The three conditions (the canon's Part I; gate-interiors-build.md, Condition): the stones are gatekit's rule, steady 'whole', failing
// 'cracked' (and three slabs of the floor gone), catastrophic 'broken' (the entry bay's floor stays, cracked, so there is a threshold);
// what OG-120 adds is the light, the door, the lift and the ring:
//   steady        the leaves shut and lit, the lift running (its platform rises and falls), the lanterns burning, the ring whole.
//   failing       the right leaf sagged off its pivot and swung 35° in, the lift stuck 4 m up and tilted with a chain parted, a third
//                 of the lanterns dead and the rest guttering, the script flickering and part dead, the ring whole, its core faltering.
//   catastrophic  the leaves torn out and afloat in the nave, the platform afloat, the lanterns dead, the floor gone to a void lit far
//                 below, the ring's stones drifted apart round a core burning red.
// The question is what the light does (GC_MODES), the stones being the same in every mode:
//   'stones' (A) one light for every condition: the school's, at full; the condition is in the masonry and the script alone (the kit as built).
//   'drawn'  (B) OG-120 as drawn: the hall's light is the condition's colour on every school: amber steady, cold blue failing, violet and red
//                catastrophic; script, lanterns, air and core take it.
//   'school' (C) the school's colour holds in the script, the lanterns and the core while the gate holds; the condition takes the light's
//                strength and steadiness: full and even steady; failing dim, guttering, a third dead and the air drained cold; catastrophic
//                dark but for the violet seams (the kit's), the void below and a core gone red.
// gateHall({ cond, mode, school, t }) -> { group, tris, draws, lights, tick(tSeconds), stand: { x, y, z, ry }, view: {…}, counts }.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { mat, worldUV } from './common.js';
import { gatePiece, stream, hashKey, GK_SCHOOLS } from './gatekit.js';

export const GC_CONDS = { steady: 'whole', failing: 'cracked', catastrophic: 'broken' };
export const GC_MODES = { stones: 'A, one light: the condition in the stones', drawn: 'B, OG-120 as drawn: the light by condition', school: 'C, the school’s colour holds, the light weakens' };
const AMBER = [1.0, .62, .24], COLD = [.42, .62, 1.0], VIOLET = [.62, .30, 1.0], RED = [1.0, .2, .1];
const lerp3 = (a, b, t) => a.map((v, i) => v + (b[i] - v) * t);

// the light of a mode and condition: script (colour, strength, how much flickers, how much is dead), lanterns (colour, strength, dead),
// the air (the hemisphere's sky and ground, its strength, the fog), the void under the floor, the core, the cold light from above
export function lightOf(mode, cond, school) {
  const S = (GK_SCHOOLS[school] || GK_SCHOOLS.cloch).glow, warm = lerp3(S, AMBER, .35);
  const L = { script: S, sk: 2.2, flick: 0, dead: 0, lamp: warm, lk: 4.6, ldead: 0, lflick: 0, sky: [.32, .3, .3], gnd: [.14, .1, .07], hk: .55, fog: [.03, .026, .024], fd: .009, voidc: [0, 0, 0], vk: 0, core: S, ck: 5, above: [1, .92, .8], ak: .5, kit: false };
  if (mode === 'stones') { L.kit = true; if (cond === 'catastrophic') { L.core = S; } return L; }
  if (mode === 'drawn') { const C = cond === 'steady' ? AMBER : cond === 'failing' ? COLD : VIOLET; L.script = C; L.lamp = C; L.core = cond === 'catastrophic' ? RED : C;
    if (cond === 'steady') { L.sky = [.36, .3, .24]; L.gnd = [.16, .1, .05]; L.hk = .65; L.fog = [.04, .03, .02]; L.above = [1, .85, .6]; }
    if (cond === 'failing') Object.assign(L, { sk: 1.1, flick: .7, dead: .4, lk: 2.6, ldead: .34, lflick: .6, sky: [.16, .2, .3], gnd: [.04, .05, .07], hk: .4, fog: [.012, .018, .032], fd: .012, above: [.6, .75, 1], ak: .3, ck: 3 });
    if (cond === 'catastrophic') Object.assign(L, { sk: 1.3, flick: .5, dead: .55, lk: 0, ldead: 1, sky: [.14, .06, .2], gnd: [.1, .02, .04], hk: .3, fog: [.03, .01, .04], fd: .010, voidc: [.5, .14, .7], vk: 1.0, ak: .08, above: [.7, .5, 1], ck: 7 });
    return L; }
  // 'school': the colour holds, the strength goes
  if (cond === 'failing') Object.assign(L, { sk: 1.0, flick: .7, dead: .4, lk: 2.4, ldead: .34, lflick: .6, sky: [.17, .19, .23], gnd: [.05, .05, .06], hk: .38, fog: [.014, .017, .024], fd: .012, above: [.7, .8, 1], ak: .28, ck: 3 });
  if (cond === 'catastrophic') Object.assign(L, { sk: 1.0, flick: .6, dead: .7, lk: 0, ldead: 1, sky: [.1, .07, .14], gnd: [.07, .02, .04], hk: .28, fog: [.024, .012, .03], fd: .010, voidc: [.5, .14, .7], vk: .9, core: RED, ck: 7, ak: .08, above: [.7, .5, 1] });
  return L;
}

// a flicker: steady with drops and stutters, from a hash of the time step and the piece's own key (a still frame is the same twice)
function flicker(t, key, amt) { if (!amt) return 1; const h = (n) => { let x = (hashKey(key) ^ Math.imul(n, 2654435761)) >>> 0; x ^= x >>> 15; x = Math.imul(x, 2246822519) >>> 0; x ^= x >>> 13; return (x >>> 0) / 4294967296; };
  const s = Math.floor(t * 9), a = h(s), b = h(s + 1), f = t * 9 - s, v = a + (b - a) * f; return v < amt * .35 ? .08 : v < amt * .6 ? .45 + .3 * h(s * 7 + 3) : 1; }

const TM = (x = 0, y = 0, z = 0, ry = 0, rx = 0, rz = 0) => new THREE.Matrix4().compose(new THREE.Vector3(x, y, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(rx, ry, rz, 'YXZ')), new THREE.Vector3(1, 1, 1));
// the ring sigil and a strip of glyphs (gatekit's are private; its look, redrawn)
let _ring = null, _band = null;
function ringTex() { if (_ring) return _ring; const c = document.createElement('canvas'); c.width = c.height = 512; const x = c.getContext('2d'); x.fillStyle = '#000'; x.fillRect(0, 0, 512, 512); x.strokeStyle = '#fff'; x.fillStyle = '#fff'; x.lineCap = 'round';
  x.lineWidth = 16; x.beginPath(); x.arc(256, 256, 170, 0, 7); x.stroke(); x.lineWidth = 9; x.beginPath(); x.arc(256, 256, 96, 0, 7); x.stroke();
  x.lineWidth = 10; x.beginPath(); x.moveTo(256, 20); x.lineTo(256, 492); x.moveTo(20, 256); x.lineTo(492, 256); x.stroke(); x.beginPath(); x.arc(256, 256, 18, 0, 7); x.fill();
  const t = new THREE.CanvasTexture(c); t.anisotropy = 8; return (_ring = t); }
function bandTex() { if (_band) return _band; const L = 2048, S = 64, c = document.createElement('canvas'); c.width = S; c.height = L; const x = c.getContext('2d'), r = stream('gatecond:glyphs');
  x.fillStyle = '#000'; x.fillRect(0, 0, S, L); x.strokeStyle = '#fff'; x.lineCap = 'round'; x.lineWidth = 4;
  for (let i = 0; i < 40; i++) { const k = Math.floor(r() * 5); x.save(); x.translate(32, 25 + i * 51); x.beginPath();
    if (k === 0) { x.arc(0, 0, 12, 0, 7); x.moveTo(0, -18); x.lineTo(0, 18); } else if (k === 1) { x.moveTo(-12, 18); x.lineTo(0, -18); x.lineTo(12, 18); x.moveTo(-7, 4); x.lineTo(7, 4); }
    else if (k === 2) { x.arc(0, 0, 13, .6, 5.7); } else if (k === 3) { x.moveTo(-12, 0); x.lineTo(0, -16); x.lineTo(12, 0); x.lineTo(0, 16); x.closePath(); } else { x.moveTo(-10, -16); x.lineTo(-10, 16); x.moveTo(10, -16); x.lineTo(10, 16); x.moveTo(-10, 0); x.lineTo(10, 0); }
    x.stroke(); x.restore(); }
  const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 8; return (_band = t); }

// the pointed opening (gatekit's arch: span 10, springing 9, point 18) as a closed outline, x across, y up; side -1 / 1 a half
function pointed(side = 0, n = 16) { const S = 10, ys = 9, h = 9, a = (h * h - S * S / 4) / S, r = S / 2 + a, th1 = Math.atan2(h, -a), L = [];
  for (let i = 0; i <= n; i++) { const t = Math.PI + (th1 - Math.PI) * i / n; L.push([a + Math.cos(t) * r, ys + Math.sin(t) * r]); }
  const R = L.map(([x, y]) => [-x, y]).reverse();
  if (side < 0) return [[-5, 0], ...L, [0, 0]]; if (side > 0) return [[-5, 0], ...L, [0, 0]].map(([x, y]) => [-x, y]).reverse();
  return [[-5, 0], ...L, ...R.slice(1), [5, 0]]; }
const shapeOf = pts => { const s = new THREE.Shape(); s.moveTo(pts[0][0], pts[0][1]); for (const p of pts.slice(1)) s.lineTo(p[0], p[1]); s.closePath(); return s; };

export function gateHall(o = {}) {
  const cond = GC_CONDS[o.cond] ? o.cond : 'steady', mode = GC_MODES[o.mode] ? o.mode : 'school', school = GK_SCHOOLS[o.school] ? o.school : 'cloch', kc = GC_CONDS[cond];
  const L = lightOf(mode, cond, school), S = GK_SCHOOLS[school], group = new THREE.Group(), lights = [], ticks = [], counts = { pieces: 0, floating: 0, fallen: 0, seams: 0, cracks: 0, gaps: 0, lampsLit: 0, scriptDead: 0 };
  const r = stream(`gatecond:${cond}`), bays = 4, pitch = 14, half = 13 + 2.45, endZ = -bays * pitch, stone = new THREE.Color(...S.stone);
  const scriptMat = (key, k = L.sk) => { const m = new THREE.MeshStandardMaterial({ color: new THREE.Color(.05, .045, .04), emissive: new THREE.Color(...L.script), emissiveIntensity: k, emissiveMap: key === 'ring' ? ringTex() : bandTex(), roughness: .6 }); return m; };
  const seamMat = new THREE.MeshStandardMaterial({ color: new THREE.Color(.01, .005, .015), emissive: new THREE.Color(...VIOLET), emissiveIntensity: .12, roughness: .9 });
  const deadMat = new THREE.MeshStandardMaterial({ color: new THREE.Color(.06, .055, .05), roughness: .9, map: bandTex() });
  // a kit piece, its script and ring relit by the mode (A keeps the kit's own), each piece's script flickering on its own key
  const put = (kind, x, z, ry = 0, y = 0, extra = {}, c = kc) => { const key = extra.key || `gatecond:${kind}:${x.toFixed(1)}:${z.toFixed(1)}`, p = gatePiece(kind, { cond: c, school, key, ...extra });
    p.position.set(x, y, z); p.rotation.y = ry; group.add(p); p.traverse(m => { if (m.isMesh && m.userData.key === 'seam') m.material = seamMat; }); const u = p.userData; counts.pieces++; for (const k of ['floating', 'fallen', 'seams', 'cracks']) counts[k] += u[k] || 0;
    if (!L.kit) { const dead = r() < L.dead; p.traverse(m => { if (!m.isMesh) return; const k = m.userData.key; if (k === 'script' || k === 'ring') { if (dead) { m.material = deadMat; counts.scriptDead++; return; }
      const sm = scriptMat(k); m.material = sm; if (L.flick && r() < .6) ticks.push(t => { sm.emissiveIntensity = L.sk * flicker(t, key + k, L.flick); }); } }); }
    return p; };
  // ── the floor: the kit's slabs (four across a bay, two along), a void below; the entry bay stays when the rest is broken ──
  for (let i = 0; i < bays; i++) { const z = -(i + .5) * pitch, c = cond === 'catastrophic' && i === 0 ? 'cracked' : kc;
    for (let a = 0; a < 4; a++) for (let b = 0; b < 2; b++) { const gone = cond === 'failing' && i > 0 && r() < .12; if (gone) { counts.gaps++; continue; } put('slab', (a - 1.5) * 7.5, z + (b - .5) * 7, 0, 0, { key: `gatecond:slab:${i}:${a}:${b}` }, c); } }
  // the threshold before the first bay, and the ground under a steady hall; under the others the void, lit from far below when torn
  { const g = new THREE.PlaneGeometry(36, 10); g.rotateX(-Math.PI / 2); worldUV(g, .2); const m = new THREE.Mesh(g, mat('slab', { ns: .8, color: stone.clone().multiplyScalar(.6), rough: .45 })); m.position.set(0, 0, 5); m.receiveShadow = true; group.add(m); }
  if (cond === 'steady') { const g = new THREE.PlaneGeometry(36, bays * pitch); g.rotateX(-Math.PI / 2); const m = new THREE.Mesh(g, new THREE.MeshStandardMaterial({ color: 0x0c0b0a, roughness: 1 })); m.position.set(0, -.63, endZ / 2); group.add(m); }
  else { const g = new THREE.PlaneGeometry(200, 200); g.rotateX(-Math.PI / 2); const vm = new THREE.MeshBasicMaterial({ color: new THREE.Color(...L.voidc).multiplyScalar(L.vk * .35), fog: false }); const m = new THREE.Mesh(g, vm); m.position.set(0, -60, endZ / 2); group.add(m);
    if (L.vk) for (const z of [-18, -40]) { const l = new THREE.PointLight(new THREE.Color(...L.voidc), 60 * L.vk, 70, 1.2); l.position.set(0, -14, z); group.add(l); lights.push(l); } }
  // ── the piers, the arcades, the vaults, the aisle walls ──
  const hold = i => cond === 'catastrophic' && i === 0 ? 'cracked' : kc; /* the threshold bay holds when the rest is torn */
  for (let i = 0; i <= bays; i++) for (const sx of [-1, 1]) put('pier', sx * half, -i * pitch, 0, 0, { key: `gatecond:pier:${sx}:${i}` }, hold(i));
  for (let i = 0; i < bays; i++) { const z = -(i + .5) * pitch;
    for (const sx of [-1, 1]) { put('arch', sx * half, z, Math.PI / 2, 0, { key: `gatecond:arch:${sx}:${i}` }, hold(i)); put('wall', sx * (half + 9), z, Math.PI / 2, 0, { key: `gatecond:wall:${sx}:${i}` }, hold(i)); }
    put('vault', 0, z, 0, 21.3, { key: `gatecond:vault:${i}`, w: 2 * half, d: pitch, rise: 12, ground: -21.3, shadow: false }, hold(i)); }
  // the aisles' floors and roofs (plain: what the arcade frames)
  for (const sx of [-1, 1]) { const g = new THREE.PlaneGeometry(9, bays * pitch); g.rotateX(-Math.PI / 2); worldUV(g, .2); const m = new THREE.Mesh(g, mat('slab', { ns: .8, color: stone.clone().multiplyScalar(.5), rough: .5 })); m.position.set(sx * (half + 4.5), -.01, endZ / 2); m.receiveShadow = true; if (cond !== 'catastrophic') group.add(m); }
  // ── the lanterns: a stone on each pier's nave face at 7 m, its light; dead ones by the mode's share ──
  const lampOn = new THREE.MeshStandardMaterial({ color: 0x1a140c, emissive: new THREE.Color(...L.lamp), emissiveIntensity: 3.2, roughness: .5 }), lampOff = new THREE.MeshStandardMaterial({ color: 0x2a2622, roughness: .8 });
  for (let i = 0; i <= bays; i++) for (const sx of [-1, 1]) { const x = sx * (half - 2.15), z = -i * pitch, dead = L.lk === 0 || r() < L.ldead, key = `lamp:${sx}:${i}`;
    if (cond === 'catastrophic' && i >= 1) continue; /* those piers' stones are afloat */
    const lm = dead ? lampOff : lampOn.clone(), m = new THREE.Mesh(new THREE.BoxGeometry(.3, .8, .5), lm); m.position.set(x, 7, z); group.add(m);
    const c = new THREE.Mesh(new THREE.BoxGeometry(.5, .25, .7), lampOff); c.position.set(x + sx * .05, 6.5, z); group.add(c);
    if (dead) continue; counts.lampsLit++; const l = new THREE.PointLight(new THREE.Color(...L.lamp), L.lk * 14, 34, 1.4); l.position.set(x - sx * .8, 7, z); group.add(l); lights.push(l);
    if (L.lflick) ticks.push(t => { const f = flicker(t, key, L.lflick); l.intensity = L.lk * 14 * f; lm.emissiveIntensity = 3.2 * f; }); }
  // ── the end wall and its door ──
  const wallM = mat('ashlar', { ns: 1.0, color: stone.clone().multiplyScalar(.8), rough: .85 });
  { const s = shapeOf([[-24, 0], [24, 0], [24, 34], [-24, 34]]), hole = new THREE.Path(); const P = pointed(); hole.moveTo(P[0][0], P[0][1]); for (const p of P.slice(1)) hole.lineTo(p[0], p[1]); hole.closePath(); s.holes.push(hole);
    const g = new THREE.ExtrudeGeometry(s, { depth: 2, bevelEnabled: false, curveSegments: 4 }); worldUV(g, .25); const m = new THREE.Mesh(g, wallM); m.position.set(0, 0, endZ - 3.2); m.castShadow = m.receiveShadow = true; group.add(m); }
  put('arch', 0, endZ - 1.6, 0, 0, { key: 'gatecond:door' }); put('panel', 10, endZ - .9, 0, 0, { key: 'gatecond:panel:r' });
  const leafM = mat('ashlar', { ns: .9, color: stone.clone().multiplyScalar(.7), rough: .7 });
  const leaf = side => { const g = new THREE.ExtrudeGeometry(shapeOf(pointed(side, 14)), { depth: .5, bevelEnabled: false }); worldUV(g, .25); g.translate(-side * 5, 0, -.25); /* hinge at x 0 */
    const G = new THREE.Group(), m = new THREE.Mesh(g, leafM); m.castShadow = m.receiveShadow = true; G.add(m);
    const sm = scriptMat('script', L.sk * .9), strip = new THREE.Mesh(new THREE.PlaneGeometry(.5, 15), sm); strip.position.set(-side * 4.75, 7.9, .27); G.add(strip);
    const rg = new THREE.Mesh(new THREE.CircleGeometry(1.2, 32, side < 0 ? Math.PI / 2 : -Math.PI / 2, Math.PI), new THREE.MeshStandardMaterial({ color: 0x0e0b08, emissive: new THREE.Color(...L.script), emissiveIntensity: L.sk, emissiveMap: ringTex(), roughness: .6 }));
    { const uv = rg.geometry.attributes.uv, P = rg.geometry.attributes.position; for (let i = 0; i < uv.count; i++) uv.setXY(i, P.getX(i) / 2.4 + .5, P.getY(i) / 2.4 + .5); } rg.position.set(-side * 5, 9, .27); G.add(rg);
    if (L.kit && kc === 'broken') { sm.emissive.setRGB(...VIOLET); rg.material.emissive.setRGB(...VIOLET); }
    if (L.flick) ticks.push(t => { const f = flicker(t, 'leaf' + side, L.flick); sm.emissiveIntensity = L.sk * .9 * f; rg.material.emissiveIntensity = L.sk * f; });
    G.position.set(side * 5, 0, endZ - 1.6); group.add(G); return G; };
  const lL = leaf(-1), lR = leaf(1);
  if (cond === 'failing') { lR.rotation.set(0, .62, -.04); lR.position.y -= .3; }
  if (cond === 'catastrophic') { lL.position.set(-6.5, 4.2, endZ + 10); lL.rotation.set(.35, .6, -.25); lR.position.set(7.5, 7.5, endZ + 16); lR.rotation.set(-.4, -.9, .3); }
  // ── the lift: two posts, a beam, a gallery at 12 m, a platform on four chains ──
  { const lx = -10, lz = endZ + 6, postM = mat('ashlar', { ns: 1.0, color: stone.clone().multiplyScalar(.75), rough: .8 }), iron = new THREE.MeshStandardMaterial({ color: 0x2b2826, roughness: .5, metalness: .8 });
    for (const dx of [-2.6, 2.6]) { const m = new THREE.Mesh(new THREE.BoxGeometry(1, 16, 1), postM); m.position.set(lx + dx, 8, lz); m.castShadow = true; if (cond === 'catastrophic' && dx > 0) { m.position.set(lx + dx + 1.2, 9.5, lz + 1); m.rotation.set(.12, 0, -.18); } group.add(m); }
    const beam = new THREE.Mesh(new THREE.BoxGeometry(6.4, .9, 1.1), postM); beam.position.set(lx, 16.4, lz); if (cond === 'catastrophic') { beam.position.y += 2.4; beam.rotation.z = -.32; } group.add(beam);
    const gal = new THREE.Mesh(new THREE.BoxGeometry(7.4, .6, 5.5), postM); gal.position.set(-11.3, 12, endZ + 1.55); gal.castShadow = gal.receiveShadow = true; group.add(gal);
    const plat = new THREE.Group(), pm = new THREE.Mesh(new THREE.BoxGeometry(3.4, .4, 3.4), postM); pm.castShadow = pm.receiveShadow = true; plat.add(pm);
    const band = scriptMat('script', L.sk * .8); { const g = new THREE.PlaneGeometry(3.4, .3); const b = new THREE.Mesh(g, band); b.position.set(0, 0, 1.71); plat.add(b); }
    const chains = []; for (const [cx, cz] of [[-1.5, -1.5], [1.5, -1.5], [-1.5, 1.5], [1.5, 1.5]]) { const c = new THREE.Mesh(new THREE.CylinderGeometry(.05, .05, 1, 6), iron); c.userData.at = [cx, cz]; chains.push(c); group.add(c); }
    group.add(plat);
    const lay = (y, tilt = 0, broken = -1) => { plat.position.set(lx, y, lz); plat.rotation.set(tilt * .4, 0, tilt); plat.updateMatrixWorld();
      chains.forEach((c, k) => { const [cx, cz] = c.userData.at, p = new THREE.Vector3(cx, .2, cz).applyMatrix4(plat.matrixWorld), top = new THREE.Vector3(lx + cx, 16, lz + cz);
        const bot = k === broken ? top.clone().add(new THREE.Vector3(0, -3.2, 0)) : p, len = top.distanceTo(bot); c.scale.set(1, len, 1); c.position.copy(top).add(bot).multiplyScalar(.5); c.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), bot.clone().sub(top).normalize().negate()); }); };
    if (cond === 'steady') ticks.push(t => lay(6 + 5.6 * Math.sin(t * .25))); else if (cond === 'failing') lay(4, .1, 2);
    else { plat.position.set(lx + 3, 9, lz + 6); plat.rotation.set(.5, .7, -.4); chains.forEach((c, k) => { c.scale.set(1, 2 + k, 1); c.position.set(lx + (k % 2 ? 1.5 : -1.5), 16 - (2 + k) / 2 + 2.4, lz + (k < 2 ? -1.5 : 1.5)); }); }
    if (L.flick) ticks.push(t => { band.emissiveIntensity = L.sk * .8 * flicker(t, 'lift', L.flick); });
    if (cond === 'catastrophic' && !L.kit) band.emissiveIntensity = 0; }
  // ── the ring chamber beyond the door ──
  { const cz = endZ - 20, cy = 10, R = 8, n = 24, room = new THREE.Group();
    const back = new THREE.Mesh(new THREE.BoxGeometry(48, 34, 1), wallM); back.position.set(0, 17, cz - 10); room.add(back);
    for (const sx of [-1, 1]) { const w = new THREE.Mesh(new THREE.BoxGeometry(1, 34, 32), wallM); w.position.set(sx * 20, 17, cz); room.add(w); }
    const fl = new THREE.Mesh(new THREE.PlaneGeometry(40, 30).rotateX(-Math.PI / 2), mat('slab', { ns: .8, color: stone.clone().multiplyScalar(.55), rough: .45 })); fl.position.set(0, 0, cz); fl.receiveShadow = true; if (cond !== 'catastrophic') room.add(fl);
    const stoneM = mat('ashlar', { ns: 1.0, color: stone.clone().multiplyScalar(.85), rough: .7 }), ringGlow = scriptMat('script', L.sk * 1.1);
    if (L.kit && kc === 'broken') ringGlow.emissive.setRGB(...VIOLET);
    const rr = stream(`gatecond:ring:${cond}`);
    for (let k = 0; k < n; k++) { const a0 = k / n * Math.PI * 2, a1 = (k + 1) / n * Math.PI * 2 - .02, s = new THREE.Shape(); const ri = R - 1.4, steps = 4;
      for (let i = 0; i <= steps; i++) { const a = a0 + (a1 - a0) * i / steps; i ? s.lineTo(Math.cos(a) * R, Math.sin(a) * R) : s.moveTo(Math.cos(a) * R, Math.sin(a) * R); }
      for (let i = steps; i >= 0; i--) { const a = a0 + (a1 - a0) * i / steps; s.lineTo(Math.cos(a) * ri, Math.sin(a) * ri); }
      const g = new THREE.ExtrudeGeometry(s, { depth: 1.6, bevelEnabled: false }); g.translate(0, 0, -.8); worldUV(g, .25);
      const am = (a0 + a1) / 2, strip = new THREE.PlaneGeometry(.55, (a1 - a0) * (R - .7) * .9); strip.rotateZ(am); strip.translate(Math.cos(am) * (R - .7), Math.sin(am) * (R - .7), .82);
      const G = new THREE.Group(); const m = new THREE.Mesh(g, stoneM); m.castShadow = true; G.add(m); G.add(new THREE.Mesh(strip, ringGlow));
      if (cond === 'catastrophic') { const out = 1.5 + rr() * 5; G.position.set(Math.cos(am) * out, Math.sin(am) * out, (rr() - .5) * 6); G.rotation.set((rr() - .5) * .9, (rr() - .5) * .9, (rr() - .5) * .5); }
      const W = new THREE.Group(); W.add(G); W.position.set(0, cy, cz); room.add(W); }
    const coreM = new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: new THREE.Color(...L.core).lerp(new THREE.Color(1, 1, 1), .3), emissiveIntensity: L.ck, roughness: .1 });
    const core = new THREE.Mesh(new THREE.IcosahedronGeometry(cond === 'catastrophic' ? 2.2 : 1.4, 1), coreM); core.position.set(0, cy, cz); room.add(core);
    const cl = new THREE.PointLight(new THREE.Color(...L.core), L.ck * 60, 60, 1.3); cl.position.set(0, cy, cz + 3); room.add(cl); lights.push(cl);
    if (cond === 'catastrophic') { const nl = new THREE.PointLight(new THREE.Color(...L.core), L.ck * 40, 70, 1.2); nl.position.set(0, 9, endZ + 4); group.add(nl); lights.push(nl); }
    ticks.push(t => { core.rotation.y = t * .3; core.rotation.x = t * .17; if (L.flick) { const f = flicker(t, 'core', L.flick * .6); coreM.emissiveIntensity = L.ck * (.4 + .6 * f); cl.intensity = L.ck * 60 * (.4 + .6 * f); ringGlow.emissiveIntensity = L.sk * 1.1 * f; } });
    group.add(room); }
  // ── the light from above (the hall's even light; a gate is lit by its own stone, and this stands in for the bounce) ──
  const above = new THREE.DirectionalLight(new THREE.Color(...L.above), L.ak * 2.4); above.position.set(-30, 80, 30); above.target.position.set(0, 0, endZ / 2); above.castShadow = true; above.shadow.mapSize.set(4096, 4096);
  Object.assign(above.shadow.camera, { left: -60, right: 60, top: 60, bottom: -60, near: 1, far: 260 }); above.shadow.bias = -.0004; above.shadow.normalBias = .05; group.add(above, above.target); lights.push(above);
  const hemi = new THREE.HemisphereLight(new THREE.Color(...L.sky), new THREE.Color(...L.gnd), L.hk); group.add(hemi); lights.push(hemi);
  let tris = 0, draws = 0; group.traverse(m => { if (m.isMesh) { draws++; tris += (m.geometry.index ? m.geometry.index.count : m.geometry.attributes.position.count) / 3; } });
  const tick = t => { for (const f of ticks) f(t); }; tick(o.t ?? 4);
  return { group, tris: Math.round(tris), draws, lights, tick, light: L, counts, fog: { color: L.fog, density: L.fd },
    stand: { x: 2.2, y: 0, z: -4.5, ry: Math.PI * 1.05 },
    view: { wide: [3.4, 1.7, 6, -.6, 7.5, -50], high: [5, 15, 5, -2, 3, -46], door: [5, 2.6, -32, -2.5, 8, -58], scale: [-3.5, 1.75, 4.5, 9, 4.2, -14], script: [-8.6, 3.2, -9.6, -13.6, 4.2, -14] } };
}
