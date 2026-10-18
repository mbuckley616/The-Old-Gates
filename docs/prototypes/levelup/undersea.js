// Under the sea (Session 1100; backlog L10's "under the sea", OG-125): the first place on the sea floor, the shallows under a coastal
// town. A metre a unit, the sea's surface at y 0, the town's quay along z 0 with the town behind it on +z and the sea before it on -z:
//   - the quay: a wall of coursed stone along x from -18 to 18, its face at z 0, from its foot on the sea floor to 1.8 m over the
//     water, a coping, iron mooring rings, a stair of 9 steps down its face into the water at its west end; on it two of the kit's
//     Gatelands houses, so the arches lie under a town;
//   - the drowned arches: an arcade of old dressed stone running 34 m straight out from the quay into deeper water, seven bays of round
//     arches 4 m wide on piers of 1.6 by 2.4 m. It was a causeway: its deck now lies 1.75 m under the water, so a galleon's keel (1.5 m)
//     passes over it. Its first four bays stand whole; from the fifth the deep end has gone: the fifth's arch has fallen and its stones lie
//     on the sand under it, the sixth and seventh piers stand as stumps; weed on every face that looks up;
//   - the floor: sand, rippled, from 4.5 m deep at the quay's foot to 16 m at 60 m out (the near piers silted to their springing), a reef
//     of rocks either side of the arcade;
//   - kelp: stalks rooted on the floor where it is shallower than 9 m, reaching to between 0.6 and 3 m under the surface;
//   - a rowing boat sunk on the sand at about 7.5 m beside the fourth pier, on her side, her oar beside her;
//   - a hidden alcove: a niche 1.2 m wide and 1.7 m high in the quay's face, its sill 3 m under the water behind the kelp, a small chest
//     in it (what is in it is the systems builder's; whose it was, the quest writer's).
// o.water (the question, Session 1100): 'green' (the Gatelands' northern water, visibility about 15 m) | 'clear' (turquoise, about 40 m) |
// 'isle' (by island: the Gatelands green, the Mark dark and cold blue, Aurenne clear turquoise); here it only sets the page's fog and light,
// the place is the same. -> { group, tris, draws, floor(x, z), quay { x0, x1, z, top, foot }, arcade { x, z0, z1, bays: [{ z, pier, whole }],
//   deck (y of its top), span, pier: [w, d] }, kelp: [{ x, z, y0, y1 }], boat { x, y, z, low }, alcove { x, y, z, w, h, d }, stair, fallen }
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { mat, worldUV, fbm } from './common.js';
import { stream, gatelandsBuilding, GL_PLANS, glBayPlan } from './pieces.js';

export function drownedArches(o = {}) {
  const r = o.r || stream('undersea:arches'), B = new Map(), put = (key, g) => { const x = g.index ? g.toNonIndexed() : g; for (const k of Object.keys(x.attributes)) if (!['position', 'normal', 'uv'].includes(k)) x.deleteAttribute(k); if (!x.attributes.uv) worldUV(x, .5); (B.get(key) || B.set(key, []).get(key)).push(x); return x; };
  const box = (key, w, h, d, x, y, z, s = .45) => { const g = new THREE.BoxGeometry(w, h, d); worldUV(g, s); g.translate(x, y, z); return put(key, g); };
  // the floor: 4.5 m at the quay's foot to 16 m at 60 m out, sand ripples and a little swell of the ground
  const floor = (x, z) => { const t = Math.min(1, Math.max(0, -z / 60)); return -(4.5 + 11.5 * t ** 1.1) + fbm(x / 14, z / 14, 3) * 1.2 + Math.sin(x * .9 + z * .35) * .04; };
  { const N = 120, S = 90, g = new THREE.PlaneGeometry(S, S + 10, N, N); g.rotateX(-Math.PI / 2); const P = g.attributes.position; for (let i = 0; i < P.count; i++) { const x = P.getX(i), z = P.getZ(i) - S / 2 + 4; P.setXYZ(i, x, Math.min(floor(x, Math.min(z, -.2)), -.4), Math.min(z, -.05)); }
    g.computeVertexNormals(); worldUV(g, .25); put('sand', g); }
  // the quay: a wall of coursed stone, its face at z 0; the land behind it; its coping; rings; the stair down into the water at its west end
  const QX0 = -18, QX1 = 18, QT = 1.8, qfoot = x => floor(x, -.3) - .3;
  { const ch = .55; for (let y = -5.85, k = 0; y < QT - .3; y += ch, k++) for (let x = QX0 + (k % 2 ? -.7 : 0); x < QX1; x += 1.4) { const x0 = Math.max(QX0, x), x1 = Math.min(QX1, x + 1.4); if (x1 - x0 < .2) continue;
      if (Math.abs((x0 + x1) / 2 - 7) < 1.0 && y > -3.3 && y < -1.0) continue; /* the alcove's opening */ box(y < -.3 ? 'quayweed' : 'quay', x1 - x0 - .03, ch - .03, .9, (x0 + x1) / 2, y + ch / 2, .45); }
    box('dress', QX1 - QX0 + .2, .3, 1.2, 0, QT - .15, .5); box('land', QX1 - QX0, .4, 14, 0, QT - .5, 7.9);
    for (const x of [-12, -4, 4, 12]) { const g = new THREE.TorusGeometry(.18, .03, 6, 16); g.translate(x, QT - .6, -.05); put('iron', g); }
    for (let k = 0; k < 9; k++) box(k < 4 ? 'quay' : 'quayweed', 1.4, .2, .45, QX0 + 1.1, QT - .3 - k * .38, -.22 - k * .3); }
  // the alcove: a niche through the face, its back and its round head; a small iron-bound chest on its floor
  const alcove = { x: 7, y: -2.2, z: 0, w: 1.2, h: 1.7, d: 1.4 };
  { const y0 = -3.0; box('dark', alcove.w + .1, .1, alcove.d, alcove.x, y0 - .05, -alcove.d / 2 + .9); box('quayweed', alcove.w + .6, 2.3, .3, alcove.x, y0 + 1.15, alcove.d - .5 + .15);
    for (const sx of [-1, 1]) box('quayweed', .3, 2.3, alcove.d, alcove.x + sx * (alcove.w / 2 + .15), y0 + 1.15, alcove.d / 2 - .5);
    box('quayweed', alcove.w + .6, .5, alcove.d, alcove.x, y0 + 2.05, alcove.d / 2 - .5); box('wood', .55, .35, .38, alcove.x + .15, y0 + .17, .3); box('iron', .57, .05, .4, alcove.x + .15, y0 + .3, .3);
    alcove.y0 = y0; }
  // the town on the quay: two of the kit's Gatelands houses, their fronts to the water
  const town = []; for (const [x, kind, n] of [[-8, 'townhouse', 3], [5, 'merchant', 4]]) { const P = glBayPlan(kind, n, { color: kind === 'merchant' ? 'cream' : 'ochre', paint: 'green' }); P.r = stream(`undersea:house:${x}`); /* its lit windows from its own stream, so the place is the same twice */ const g = gatelandsBuilding(P); g.rotation.y = Math.PI; g.position.set(x, QT - .3, 6.5); town.push(g); }
  // the drowned arcade: seven bays out from the quay along -z at x 0, piers 1.6 (along z) by 2.4 (across), round arches of 4 m, the deck at -1.75
  const SPAN = 4, PD = 1.6, PW = 2.4, DECK = -1.75, SPRING = DECK - 1.05 - SPAN / 2, bays = [], fallen = [], A = { x: 0 };
  const zp = i => -(1.0 + PD / 2 + i * (SPAN + PD)); /* the piers' centres; the first stands against the quay */
  for (let i = 0; i <= 7; i++) { const z = zp(i), fy = Math.min(floor(-PW / 2, z), floor(PW / 2, z), floor(0, z - PD / 2), floor(0, z + PD / 2)) - .4, stump = i >= 6, top = stump ? SPRING - 1.2 - (i - 6) * 1.4 : SPRING, ch = .8;
    for (let y = fy, k = 0; y < top - .01; y += ch, k++) { const h = Math.min(ch, top - y); box(y > top - 2 ? 'weedstone' : 'stone', PW - .03, h - .03, PD - .03, 0, y + h / 2, z, .4); }
    box('weedstone', PW + .2, .3, PD + .2, 0, top + .15, z); bays.push({ i, z: +z.toFixed(2), pier: [+fy.toFixed(2), +(top + .3).toFixed(2)], whole: i < 4 }); }
  // the arches between them: voussoirs round a half circle, the spandrel courses up to the deck, the deck's slabs and a parapet's stump
  for (let i = 0; i < 7; i++) { const z0 = zp(i) - PD / 2, z1 = zp(i + 1) + PD / 2, zc = (z0 + z1) / 2, R = SPAN / 2, n = 11, whole = i < 4, falling = i === 4;
    if (i >= 5) continue; /* the sixth and seventh bays have gone with their piers */
    for (let k = 0; k < n; k++) { const a0 = Math.PI * k / n, a1 = Math.PI * (k + 1) / n, q = [[R * Math.cos(a0), R * Math.sin(a0)], [R * Math.cos(a1), R * Math.sin(a1)], [(R + .7) * Math.cos(a1), (R + .7) * Math.sin(a1)], [(R + .7) * Math.cos(a0), (R + .7) * Math.sin(a0)]];
      const sh = new THREE.Shape(q.map(([u, v]) => new THREE.Vector2(u, v))), g = new THREE.ExtrudeGeometry(sh, { depth: PW - .04, bevelEnabled: false }); g.translate(0, 0, -(PW - .04) / 2); g.rotateY(Math.PI / 2); worldUV(g, .4);
      const cx = 0, cy = SPRING + .3, cz = zc;
      if (falling) { const u = (k + .5) / n, dx = (r() - .5) * 3, dz = (u - .5) * SPAN * 1.2, fy2 = floor(dx, zc + dz) + .35; g.translate(0, -(R + .35) * Math.sin((a0 + a1) / 2), (R + .35) * Math.cos((a0 + a1) / 2)); /* the stone to its own centre (the arch's u runs along -z) */ g.rotateX((r() - .5) * 1.2); g.rotateY(r() * Math.PI); g.translate(cx + dx, fy2, cz + dz); put('weedstone', g); fallen.push([+(cx + dx).toFixed(2), +fy2.toFixed(2), +(cz + dz).toFixed(2)]); }
      else { g.translate(cx, cy, cz); put(k > 2 && k < n - 3 ? 'weedstone' : 'stone', g); } }
    if (!whole) continue;
    // the spandrels and the deck over the whole bays
    for (const sz of [-1, 1]) box('stone', PW - .1, DECK - SPRING - .3 - 1.5, .9, 0, (SPRING + .3 + 1.5 + DECK) / 2 - .05, zc + sz * (SPAN / 2 - .1)); /* clear of the arch's opening: its intrados is at -3.12 where the spandrel's inner face stands */
    box('weedstone', PW - .1, .7, SPAN, 0, DECK - .35 - .05, zc); box('weedstone', PW + .1, .25, SPAN + PD, 0, DECK - .12, zc);
    for (const sx of [-1, 1]) for (let k = 0; k < 3; k++) if (r() < .6) box('weedstone', .35, .4 + r() * .3, .9, sx * (PW / 2 - .1), DECK + .2, zc - SPAN / 2 + .8 + k * 1.3); }
  // the deck over the piers themselves, the first against the quay
  for (let i = 0; i <= 4; i++) box('weedstone', PW + .1, .25, PD + .02, 0, DECK - .12, zp(i));
  // the reef: rocks either side of the arcade, a few grown over its feet
  const rocks = []; for (let k = 0; k < 70; k++) { const side = k % 2 ? 1 : -1, x = side * (3.5 + r() * 16), z = -3 - r() * 50, s = .4 + r() * 1.4; if (Math.hypot(x - 4.6, z - zp(3)) < 3.5 + s || Math.hypot(x - alcove.x, z) < 4 + s) continue; /* clear of the boat and the alcove */ const g = new THREE.IcosahedronGeometry(s, 1), P = g.attributes.position;
    const sq = .5 + r() * .3, ph = r() * 9; for (let i = 0; i < P.count; i++) { const x0 = P.getX(i), y0 = P.getY(i), z0 = P.getZ(i), n = 1 + .22 * Math.sin(x0 * 3.1 + ph) * Math.cos(z0 * 2.7 + y0 * 1.9 + ph); P.setXYZ(i, x0 * n, y0 * n * sq, z0 * n); } g.computeVertexNormals(); /* a boulder: one squash a rock, a lumpy surface the same at a vertex shared by two faces */ worldUV(g, .5); g.translate(x, floor(x, z) + s * .2, z); put('reef', g); rocks.push([x, z, s]); }
  // the kelp: stalks on the floor where it is shallower than 9 m, clear of the arcade and the stair; each a twisted ribbon to under the surface
  const kelp = []; for (let k = 0; k < 160; k++) { const x = (r() < .5 ? -1 : 1) * (2.4 + r() * 15), z = -1.5 - r() * 30, y0 = floor(x, z); if (y0 < -9 || (Math.abs(x - QX0 - 1.1) < 1.5 && z > -4)) continue;
    const y1 = -(.6 + r() * 2.4), h = y1 - y0; if (h < 1.5) continue; const n = 10, pos = [], idx = [], w = .14 + r() * .1, ph = r() * 6;
    for (let j = 0; j <= n; j++) { const t = j / n, a = ph + t * 4, cx = x + Math.sin(t * 2.2 + ph) * .35 * t, cz = z + Math.cos(t * 1.7 + ph) * .3 * t, wx = Math.cos(a) * w * (1 - .3 * t), wz = Math.sin(a) * w * (1 - .3 * t);
      pos.push(cx - wx, y0 + h * t, cz - wz, cx + wx, y0 + h * t, cz + wz); if (j) idx.push((j - 1) * 2, j * 2, (j - 1) * 2 + 1, (j - 1) * 2 + 1, j * 2, j * 2 + 1); }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals(); const uv = []; for (let j = 0; j <= n; j++) uv.push(0, j / n, 1, j / n); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); put('kelp', g);
    kelp.push({ x: +x.toFixed(2), z: +z.toFixed(2), y0: +y0.toFixed(2), y1: +y1.toFixed(2) }); }
  // the sunken rowing boat on her side by the fourth pier, her oar beside her
  const boat = (() => { const bz = zp(3) + .2, bx = 4.6, by = floor(bx, bz), BL = 4.0, W2 = .72, pts = []; for (let k = 0; k <= 10; k++) { const t = k / 10; pts.push(new THREE.Vector2(Math.sin(Math.PI * t) ** .6 * W2 + .05, (t - .5) * BL)); }
    const g = new THREE.LatheGeometry(pts, 14, -Math.PI / 2, Math.PI); g.rotateX(Math.PI / 2); g.scale(1, .55, 1); g.rotateZ(1.25); g.rotateY(.5); worldUV(g, .6); g.computeBoundingBox(); const low = g.boundingBox.min.y; g.translate(bx, by - low - .12, bz); put('boat', g);
    const oar = new THREE.CylinderGeometry(.03, .03, 2.6, 6); oar.rotateZ(Math.PI / 2); oar.rotateY(.9); oar.translate(bx - 1.6, floor(bx - 1.6, bz + 1) + .05, bz + 1); put('boat', oar); return { x: bx, y: +(by - .12).toFixed(2), z: +bz.toFixed(2), low: +(by - .12).toFixed(2) }; })();
  const M = o.mats || seaMats(), group = new THREE.Group(); let tris = 0;
  for (const [k, gs] of B) { const g = mergeGeometries(gs, false); gs.forEach(x => x.dispose()); const m = new THREE.Mesh(g, M[k]); m.name = k; m.castShadow = !['sand', 'kelp', 'dark'].includes(k); m.receiveShadow = true; group.add(m); tris += g.attributes.position.count / 3; }
  for (const t of town) { group.add(t); tris += t.userData.tris; }
  return { group, tris: Math.round(tris), draws: group.children.length - town.length + town.reduce((a, t) => a + t.userData.calls, 0), floor, quay: { x0: QX0, x1: QX1, z: 0, top: QT, foot: +qfoot(0).toFixed(2) },
    arcade: { x: 0, z0: zp(0) + PD / 2, z1: zp(7) - PD / 2, bays, deck: DECK, span: SPAN, pier: [PW, PD], spring: SPRING }, kelp, boat, alcove, fallen, rocks: rocks.length };
}

// the materials: stone and weed, sand and reef, kelp that sways (o.water does not change them; the page's fog and light do)
let SM = null;
export function seaMats() {
  if (SM) return SM; const M = {};
  M.stone = mat('ashlar', { ns: .9, color: 0xb8b2a4 }); M.quay = mat('stone', { ns: 1.0, color: 0xd8d0c0 }); M.dress = mat('ashlar', { ns: .7, color: 0xe2dccc }); M.land = mat('cobble', { ns: 1.0, color: 0xb8b0a0 });
  const weedy = (m, k = .85) => { m.onBeforeCompile = s => { s.vertexShader = 'varying vec3 vNw;\n' + s.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\n vNw = normalize(mat3(modelMatrix) * normal);');
      s.fragmentShader = 'varying vec3 vNw;\n' + s.fragmentShader.replace('#include <map_fragment>', `#include <map_fragment>\n diffuseColor.rgb = mix(diffuseColor.rgb, vec3(.16, .26, .10), ${k.toFixed(2)} * smoothstep(.1, .7, vNw.y));\n diffuseColor.rgb = mix(diffuseColor.rgb, diffuseColor.rgb * vec3(.7, .85, .72), .5);`); };
    m.customProgramCacheKey = () => 'weedy' + k; return m; };
  M.weedstone = weedy(mat('ashlar', { ns: .9, color: 0xa8a294 })); M.quayweed = weedy(mat('stone', { ns: 1.0, color: 0xb8b0a0 }), .7); M.reef = weedy(mat('rock', { ns: 1.2, color: 0x8a8478 }), .6);
  M.sand = mat('plaster', { ns: 1.6, color: 0xd8c8a0, rough: 1 });
  M.kelp = new THREE.MeshStandardMaterial({ color: new THREE.Color(.30, .26, .08), roughness: .7, side: THREE.DoubleSide });
  M.boat = weedy(mat('wood', { ns: .9, color: 0x8a6a48 }), .5); M.wood = mat('wood', { ns: .9, color: 0x7a5a3a }); M.iron = new THREE.MeshStandardMaterial({ color: new THREE.Color(.16, .12, .09), roughness: .6, metalness: .5 });
  M.dark = new THREE.MeshStandardMaterial({ color: new THREE.Color(.03, .04, .04), roughness: 1 });
  return (SM = M);
}

// ── the wrecks (Session 1101; OG-125's "wrecks at three depths, a reef-grown hull, two wrecks lying together from one fight") ──
// A slope of sand from 6 m deep to 28 m at 80 m out (z 0 to -80), the island hulls of ships.js laid on it with their sails and running
// rigging gone, their timbers grown with weed by depth:
//   - the storm wreck, 9 to 10 m down: a Gatelands sloop thrown on her starboard side across a reef of rocks, her mast along the sand;
//   - the fight, 16 to 17 m down: a Gatelands cog heeled over and settled, and the Mark cutter that rammed her, still in her side, bow down;
//   - the deep wreck, 25 to 27 m down: an Aurenne galleon sitting upright in the sand to her bilge, the most grown of the four;
//   - about each, her cargo strewn on the sand (crates, barrels, amphorae for Aurenne's), and a sea chest by her stern (what is in it is the
//     systems builder's; whose they were, the quest writer's).
// -> { group, tris, draws, floor(x, z), wrecks: [{ name, depth, box: [x0, y0, z0, x1, y1, z1], floorUnder, keel, heel }], cargo: [{ x, y, z, floor }],
//   chests: [{ x, y, z, floor }], gone: (meshes of sail and rope left off), pair (do the fight's two hulls meet) }
import { gatelandsSloop, gatelandsCog, markCutter, aurenneGalleon } from './ships.js';
function encrust(m, k) { const c = m.clone(); c.onBeforeCompile = s => { s.vertexShader = 'varying vec3 vNe;\n' + s.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\n vNe = normalize(mat3(modelMatrix) * normal);');
    s.fragmentShader = 'varying vec3 vNe;\n' + s.fragmentShader.replace('#include <map_fragment>', `#include <map_fragment>\n diffuseColor.rgb = mix(diffuseColor.rgb, vec3(.14, .22, .10), ${k.toFixed(2)} * smoothstep(-.2, .7, vNe.y));\n diffuseColor.rgb = mix(diffuseColor.rgb, vec3(.20, .24, .18), ${(k * .5).toFixed(2)});`); };
  c.customProgramCacheKey = () => 'encrust' + k; return c; }
// drop a mesh's triangles that a test rejects (drop(v) on any of its vertices, or dropTri([a, b, c]) on all three; in the hull's own frame, before she is laid): how a wreck loses
// her top-hamper, a stove-in strake or a fallen quarter, from the ship's own meshes. -> the triangles dropped
function cutMesh(m, drop, dropTri) { const g = m.geometry, P = g.attributes.position, N = g.attributes.normal, U = g.attributes.uv, keep = { p: [], n: [], u: [] }, v = new THREE.Vector3(); let gone = 0;
  for (let t = 0; t < P.count; t += 3) { let out = false; if (dropTri) out = dropTri([0, 1, 2].map(k => new THREE.Vector3().fromBufferAttribute(P, t + k))); else for (let k = 0; k < 3; k++) { v.fromBufferAttribute(P, t + k); if (drop(v)) { out = true; break; } } if (out) { gone++; continue; }
    for (let k = 0; k < 3; k++) { keep.p.push(P.getX(t + k), P.getY(t + k), P.getZ(t + k)); if (N) keep.n.push(N.getX(t + k), N.getY(t + k), N.getZ(t + k)); if (U) keep.u.push(U.getX(t + k), U.getY(t + k)); } }
  if (!gone) return 0; const h = new THREE.BufferGeometry(); h.setAttribute('position', new THREE.Float32BufferAttribute(keep.p, 3)); if (N) h.setAttribute('normal', new THREE.Float32BufferAttribute(keep.n, 3)); if (U) h.setAttribute('uv', new THREE.Float32BufferAttribute(keep.u, 2)); g.dispose(); m.geometry = h; return gone; }
export function wreckSite(o = {}) {
  const r = o.r || stream('undersea:wrecks'), B = new Map(), put = (key, g) => { const x = g.index ? g.toNonIndexed() : g; for (const k of Object.keys(x.attributes)) if (!['position', 'normal', 'uv'].includes(k)) x.deleteAttribute(k); if (!x.attributes.uv) worldUV(x, .5); (B.get(key) || B.set(key, []).get(key)).push(x); return x; };
  const floor = (x, z) => { const t = Math.min(1, Math.max(0, -z / 80)); return -(6 + 22 * t) + fbm(x / 16, z / 16, 3) * 1.4 + Math.sin(x * .8 + z * .4) * .04; };
  { const N = 130, g = new THREE.PlaneGeometry(110, 104, N, N); g.rotateX(-Math.PI / 2); const P = g.attributes.position; for (let i = 0; i < P.count; i++) { const x = P.getX(i), z = P.getZ(i) - 44; P.setXYZ(i, x, floor(x, z), z); } g.computeVertexNormals(); worldUV(g, .25); put('sand', g); }
  const group = new THREE.Group(), wrecks = [], cargo = [], chests = [], gone = []; let tris = 0, draws = 0;
  // lay a hull: heel (about her length), pitch, turn; sunk so her lowest point is `sink` under the sand at her middle; weed by depth
  const lay = (name, S, { x, z, heel = 0, pitch = 0, ry = 0, sink = .5, weed = .5, mast = null, drop = null }) => { const g = S.group, dmg = { spar: 0, hull: 0, top0: S.top };
    for (const m of [...g.children]) if (/sail|rope/.test(m.name)) { g.remove(m); gone.push(name + ':' + m.name); }
    // Session 1102, the damage: the masts broken off at `mast` over her deck (their tops and yards gone with them), her hull cut by `drop`
    if (mast != null) { const cy = S.deck + mast; for (const m of g.children) { if (/sail|rope/.test(m.name)) continue;
        // what lies wholly over the break goes (the yards, the tops, the topmasts); a spar that crosses it is cut off at it, a stump
        dmg.spar += cutMesh(m, null, t => t.every(v => v.y > cy)); if (m.name === 'spar') { const P = m.geometry.attributes.position; for (let i = 0; i < P.count; i++) if (P.getY(i) > cy) P.setY(i, cy); P.needsUpdate = true; } } }
    if (drop) for (const m of g.children) if (!/spar|sail|rope/.test(m.name)) dmg.hull += cutMesh(m, drop);
    for (const m of g.children) m.material = encrust(m.material, weed);
    // her keel follows the slope along her heading; then she settles by her planking (not her spars): the lowest point of her hull, against
    // the sand under that point, lies `sink` into it
    const L2 = S.L / 2, slope = (floor(x + Math.sin(ry) * L2, z + Math.cos(ry) * L2) - floor(x - Math.sin(ry) * L2, z - Math.cos(ry) * L2)) / S.L;
    g.rotation.set(pitch - Math.atan(slope), ry, heel, 'YXZ'); g.position.set(x, 0, z); g.updateMatrixWorld(true); const fy = floor(x, z), v = new THREE.Vector3(); let low = Infinity;
    for (const m of g.children) { if (/spar|iron|rope|sail/.test(m.name)) continue; const P = m.geometry.attributes.position; for (let i = 0; i < P.count; i += 3) { v.fromBufferAttribute(P, i).applyMatrix4(m.matrixWorld); low = Math.min(low, v.y - floor(v.x, v.z)); } }
    g.position.y = -sink - low; g.updateMatrixWorld(true);
    let rest = Infinity; for (const m of g.children) { if (/spar|iron|rope|sail/.test(m.name)) continue; const P = m.geometry.attributes.position; for (let i = 0; i < P.count; i += 3) { v.fromBufferAttribute(P, i).applyMatrix4(m.matrixWorld); rest = Math.min(rest, v.y - floor(v.x, v.z)); } }
    const b2 = new THREE.Box3().setFromObject(g); group.add(g); g.traverse(m => { if (m.isMesh) { tris += m.geometry.attributes.position.count / 3; draws++; } });
    const w = { name, depth: +(-fy).toFixed(2), box: [b2.min.x, b2.min.y, b2.min.z, b2.max.x, b2.max.y, b2.max.z].map(v => +v.toFixed(2)), floorUnder: +fy.toFixed(2), keel: +b2.min.y.toFixed(2), heel: +(heel * 180 / Math.PI).toFixed(1), sink, rest: +rest.toFixed(3), slope: +(Math.atan(slope) * 180 / Math.PI).toFixed(1), dmg, top: +new THREE.Box3().setFromObject(g).max.y.toFixed(2), group: g, S, at: { x, z, ry, heel } }; wrecks.push(w); return w; };
  // her cargo about her and her chest by her stern
  const strew = (w, n, amph, stern) => { const [x0, , z0, x1, , z1] = w.box, cx = (x0 + x1) / 2, cz = (z0 + z1) / 2;
    for (let k = 0; k < n; k++) { const a = r() * Math.PI * 2, d = 3 + r() * 6, x = cx + Math.cos(a) * d, z = cz + Math.sin(a) * d, fy = floor(x, z), kind = amph && k % 2 ? 2 : k % 3 ? 0 : 1;
      if (kind === 0) { const s = .5 + r() * .3, g = new THREE.BoxGeometry(s, s * .8, s); g.rotateY(r() * 3); g.rotateZ((r() - .5) * .4); g.translate(x, fy + s * .35, z); worldUV(g, .6); put('crate', g); cargo.push({ x, y: fy + s * .35 - s * .4, z, floor: fy }); }
      else if (kind === 1) { const g = new THREE.CylinderGeometry(.28, .25, .75, 12); g.rotateZ(Math.PI / 2); g.rotateY(r() * 3); g.translate(x, fy + .22, z); worldUV(g, .6); put('crate', g); cargo.push({ x, y: fy + .22 - .28, z, floor: fy }); }
      else { const pts = [[.02, 0], [.14, .1], [.2, .35], [.18, .6], [.07, .75], [.06, .85], [.09, .88]].map(([u, v]) => new THREE.Vector2(u, v)), g = new THREE.LatheGeometry(pts, 10); g.rotateZ(Math.PI / 2 * (.7 + r() * .3)); g.rotateY(r() * 3); g.translate(x, fy + .14, z); put('clay', g); cargo.push({ x, y: fy + .14 - .2, z, floor: fy }); } }
    const [sx, sz] = stern, fy = floor(sx, sz), g = new THREE.BoxGeometry(.9, .5, .55); g.rotateY(r() * 3); g.rotateZ(.25); g.translate(sx, fy + .2, sz); worldUV(g, .6); put('chest', g); chests.push({ x: sx, y: fy + .2 - .3, z: sz, floor: fy }); };
  // a fallen mast: a spar of length L and radius rad lying on the sand from (x, z) along heading a, bedded a little into it
  const spars = []; const fallSpar = (x, z, a, L, rad) => { const n = 8; for (let k = 0; k < n; k++) { const t0 = k / n, t1 = (k + 1) / n, xa = x + Math.sin(a) * L * t0, za = z + Math.cos(a) * L * t0, xb = x + Math.sin(a) * L * t1, zb = z + Math.cos(a) * L * t1,
      ya = floor(xa, za) + rad * .7, yb = floor(xb, zb) + rad * .7, d = new THREE.Vector3(xb - xa, yb - ya, zb - za), g = new THREE.CylinderGeometry(rad * (1 - .25 * t1), rad * (1 - .25 * t0), d.length() + .02, 10);
      g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.clone().normalize())); g.translate((xa + xb) / 2, (ya + yb) / 2, (za + zb) / 2); worldUV(g, .6); put('spar', g); }
    spars.push({ x: +x.toFixed(2), z: +z.toFixed(2), L, ends: [[x, z], [x + Math.sin(a) * L, z + Math.cos(a) * L]].map(([px, pz]) => [+px.toFixed(2), +pz.toFixed(2), +floor(px, pz).toFixed(2)]) }); };
  // the storm wreck on her side across the reef
  { for (let k = 0; k < 16; k++) { const x = 3 + r() * 9, z = -9 - r() * 9, s = .6 + r() * 1.3, g = new THREE.IcosahedronGeometry(s, 1), P = g.attributes.position, ph = r() * 9; for (let i = 0; i < P.count; i++) { const a = P.getX(i), b = P.getY(i), c = P.getZ(i), n = 1 + .22 * Math.sin(a * 3.1 + ph) * Math.cos(c * 2.7 + b * 1.9); P.setXYZ(i, a * n, b * n * .6, c * n); } g.computeVertexNormals(); worldUV(g, .5); g.translate(x, floor(x, z) + s * .1, z); put('reef', g); }
    const w = lay('storm wreck (Gatelands sloop)', gatelandsSloop({}, stream('wreck:sloop')), { x: 7, z: -14, heel: -1.25, pitch: .05, ry: .7, sink: .3, weed: .35, mast: 2.4 }); strew(w, 8, false, [3.2, -17.5]); fallSpar(12.5, -12.0, 2.3, 6.5, .14); }
  // the fight: the cog heeled and settled, the cutter's bow in her side
  { const w2 = lay('the fight (Mark cutter)', markCutter({}, stream('wreck:cutter')), { x: 2.5, z: -38.6, /* her stem 0.1 m inside the cog's planking (it stopped 2.1 m short at x 4.6) */ heel: -.22, pitch: .16, ry: -1.62, sink: .8, weed: .55, mast: 4.0 });
    // where her stem is, the cog is stove in: her strakes, rail and deck within 1.5 m of the cutter's stem head are gone (in the cog's frame)
    const cu = w2.S, stem = new THREE.Vector3(0, cu.sheerAt(cu.L / 2) - .3, cu.L / 2 - .4).applyMatrix4(w2.group.matrixWorld), cog = gatelandsCog({}, stream('wreck:cog'));
    const placeCog = { x: -6, z: -42, heel: .45, ry: -.25 }, Mc = new THREE.Matrix4().compose(new THREE.Vector3(placeCog.x, 0, placeCog.z), new THREE.Quaternion().setFromEuler(new THREE.Euler(0, placeCog.ry, placeCog.heel, 'YXZ')), new THREE.Vector3(1, 1, 1));
    const local = stem.clone(); /* the cog's y is not known until she settles: the hole is taken about the stem's place along her and its height over her keel */
    const w1 = lay('the fight (Gatelands cog)', cog, { ...placeCog, sink: .7, weed: .55, mast: 5.0, drop: v => { const wv = v.clone().applyMatrix4(Mc); return Math.hypot(wv.x - local.x, wv.z - local.z) < 1.5 && v.y > -.4; } });
    w1.hole = { at: [+local.x.toFixed(2), +local.y.toFixed(2), +local.z.toFixed(2)] }; strew(w1, 10, false, [-9.5, -49]); strew(w2, 6, false, [11.5, -37]); fallSpar(-12.5, -38, -1.0, 7.5, .17); fallSpar(9.5, -33.5, .5, 5.5, .12); }
  // the deep wreck: upright, sunk to her bilge, the most grown
  { const ga = aurenneGalleon({}, stream('wreck:galleon')), zq = -ga.L / 2 + 3.6; const w = lay('the deep wreck (Aurenne galleon)', ga, { x: 1, z: -74, heel: .1, ry: .45, sink: 1.3, weed: .8, mast: 9.0, drop: v => v.z < zq && v.x > .4 && v.y > ga.deck + .9 }); strew(w, 12, true, [-6, -80]); fallSpar(-7, -66, 2.6, 9, .2); fallSpar(8, -79, -.4, 7, .15); }
  const M = { sand: mat('plaster', { ns: 1.6, color: 0xd2c29a, rough: 1 }), reef: encrust(mat('rock', { ns: 1.2, color: 0x8a8478 }), .6), crate: encrust(mat('wood', { ns: .9, color: 0x7a5e40 }), .5), clay: encrust(new THREE.MeshStandardMaterial({ color: new THREE.Color(.62, .36, .22), roughness: .8 }), .4), chest: encrust(mat('wood', { ns: .9, color: 0x5e4630 }), .45), spar: encrust(mat('wood', { ns: .9, color: 0x6e5a42 }), .6) };
  for (const [k, gs] of B) { const g = mergeGeometries(gs, false); gs.forEach(x => x.dispose()); const m = new THREE.Mesh(g, M[k]); m.name = k; m.castShadow = k !== 'sand'; m.receiveShadow = true; group.add(m); tris += g.attributes.position.count / 3; draws++; }
  const [a, b] = wrecks.slice(1, 3).map(w => new THREE.Box3(new THREE.Vector3(...w.box.slice(0, 3)), new THREE.Vector3(...w.box.slice(3))));
  return { group, tris: Math.round(tris), draws, floor, wrecks: wrecks.map(({ group: _g, S: _s, ...w }) => w), cargo, chests, gone, spars, pair: a.intersectsBox(b) };
}
