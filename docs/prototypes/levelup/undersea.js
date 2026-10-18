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
// clip a mesh's triangles to the part under a ragged height top(x, z) (Session 1105), where inside(c) holds for the triangle's centre: the
// triangles across the break are cut at it, so a tall face (a tower's shaft, one triangle from foot to cornice) is broken, not dropped whole.
// fine (Session 1108): a triangle across the break is first halved along its longest edge until no edge is longer than it, so a stepped
// top (courses of stone) is followed at that spacing, not drawn as one straight slant across a wall slab's long triangles.
// capT (Session 1109): a wall's thickness; each upright face's cut edge is carried half of it inward, level, so the two faces of a broken
// slab meet in a top of stone between them and the wall is not seen hollow from above
function clipMesh(m, top, inside, fine = 0, capT = 0) { const g = m.geometry, P = g.attributes.position, N = g.attributes.normal, U = g.attributes.uv, out = { p: [], n: [], u: [] }; let cut = 0, caps = 0;
  const vx = i => ({ p: [P.getX(i), P.getY(i), P.getZ(i)], n: N ? [N.getX(i), N.getY(i), N.getZ(i)] : null, u: U ? [U.getX(i), U.getY(i)] : null }), mix = (a, b, t) => ({ p: a.p.map((v, k) => v + (b.p[k] - v) * t), n: a.n && a.n.map((v, k) => v + (b.n[k] - v) * t), u: a.u && a.u.map((v, k) => v + (b.u[k] - v) * t) });
  const emit = v => { out.p.push(...v.p); if (v.n) out.n.push(...v.n); if (v.u) out.u.push(...v.u); };
  for (let t = 0; t < P.count; t += 3) { const T = [vx(t), vx(t + 1), vx(t + 2)], c = new THREE.Vector3(...[0, 1, 2].map(k => (T[0].p[k] + T[1].p[k] + T[2].p[k]) / 3));
    if (!inside(c)) { T.forEach(emit); continue; } const d0 = T.map(v => v.p[1] - top(v.p[0], v.p[2])); if (d0.every(x => x <= 0)) { T.forEach(emit); continue; } cut++;
    const clip = (T, depth) => { const d = T.map(v => v.p[1] - top(v.p[0], v.p[2])); if (d.every(x => x <= 0)) return T.forEach(emit); if (d.every(x => x > 0)) return;
      const L = [0, 1, 2].map(k => Math.hypot(...T[k].p.map((v, j) => v - T[(k + 1) % 3].p[j]))), k = L.indexOf(Math.max(...L));
      if (fine && L[k] > fine && depth < 12) { const mid = mix(T[k], T[(k + 1) % 3], .5), o = T[(k + 2) % 3]; clip([T[k], mid, o], depth + 1); clip([mid, T[(k + 1) % 3], o], depth + 1); return; }
      const poly = [], cutAt = []; for (let k = 0; k < 3; k++) { const a = T[k], b = T[(k + 1) % 3], da = d[k], db = d[(k + 1) % 3]; if (da <= 0) poly.push(a); if ((da <= 0) !== (db <= 0)) { const q = mix(a, b, da / (da - db)); poly.push(q); cutAt.push(q); } }
      for (let k = 1; k + 1 < poly.length; k++) [poly[0], poly[k], poly[k + 1]].forEach(emit);
      if (capT && cutAt.length === 2) { const [A, B, C] = T.map(v => new THREE.Vector3(...v.p)), n = T[0].n ? new THREE.Vector3(...T[0].n).normalize() : B.clone().sub(A).cross(C.clone().sub(A)).normalize(); /* the face's own normal, which points out of the wall whatever the winding */
        if (Math.abs(n.y) < .3) { n.y = 0; n.normalize().multiplyScalar(-capT / 2); const [a, b] = cutAt, a2 = { p: [a.p[0] + n.x, a.p[1], a.p[2] + n.z], n: a.n, u: a.u && [a.u[0], a.u[1] + capT / 2] }, b2 = { p: [b.p[0] + n.x, b.p[1], b.p[2] + n.z], n: b.n, u: b.u && [b.u[0], b.u[1] + capT / 2] };
          const up = v => ({ ...v, n: v.n && [0, 1, 0] }), q = [a, b, b2, a2].map(up), e1 = new THREE.Vector3(...q[1].p).sub(new THREE.Vector3(...q[0].p)), e2 = new THREE.Vector3(...q[2].p).sub(new THREE.Vector3(...q[0].p));
          if (e1.cross(e2).y < 0) q.reverse(); [q[0], q[1], q[2], q[0], q[2], q[3]].forEach(emit); caps++; } } };
    clip(T, 0); }
  if (!cut) return 0; m.userData.caps = caps; const h = new THREE.BufferGeometry(); h.setAttribute('position', new THREE.Float32BufferAttribute(out.p, 3)); if (N) h.setAttribute('normal', new THREE.Float32BufferAttribute(out.n, 3)); if (U) h.setAttribute('uv', new THREE.Float32BufferAttribute(out.u, 2)); g.dispose(); m.geometry = h; return cut; }
// a break that follows the stone (Session 1108): a ragged height f(x, z) rounded down to a course of 0.3 m, each 0.6 m stone along the wall
// (by its own hash) a course short or one higher, so a wall's top steps as laid stone falls. For clipMesh with fine at 0.3.
function courses(f, seed) { return (wx, wz) => { const i = Math.floor((wx + wz) / .6), hsh = Math.sin(i * 127.1 + seed * 311.7) * 43758.5453, rr = hsh - Math.floor(hsh); return Math.floor((f(wx, wz) + (rr - .5) * .6) / .3) * .3; }; }
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

// ── a sea cave with air pockets (Session 1103; OG-125's "sea caves with air pockets, tunnels between them, a vertical shaft to air, glowing
// flowers, hidden exits to the surface"). The cliff's face along x at z 0, the sea before it (z < 0) on a floor 14 m down, the land on its
// top at 12 m over the water (z > 0):
//   - the mouth: an opening 4.6 m across in the face, its foot 11.3 m down, the tunnel's tube standing round it;
//   - the tunnel: a winding tube of rock 5.2 m across, rising from the mouth 30 m in and 8 m up to the chamber;
//   - the chamber: a hollow 18 m across and 22 m long, its lower part flooded to the sea's level and its roof 5.5 m over it: the air pocket.
//     A shelf of shingle rises out of the water along its east side (to 0.6 m), the glowing flowers on it;
//   - the shaft: a round well 3 m across from the chamber's roof to the land, the light and the air coming down it (a hidden way out);
//   - the side tunnel: 3.4 m across from the chamber's far end 16 m on to a second, smaller pocket (8 by 8 m, 2.4 m of air).
// -> { group, tris, draws, floor, mouth { x, y0, y1, w }, spine: [[x, y, z]...] (the tunnel's), tubeR (its least clear half-width), chamber
//   { c: [x, y, z], r: [rx, ry, rz], air }, shelf { x0, x1, z0, z1, top }, shaft { x, z, r, y0, y1 }, pocket2 { c, r, air }, flowers }
export function seaCave(o = {}) {
  const r = o.r || stream('undersea:seacave'), B = new Map(), put = (key, g) => { const x = g.index ? g.toNonIndexed() : g; for (const k of Object.keys(x.attributes)) if (!['position', 'normal', 'uv'].includes(k)) x.deleteAttribute(k); x.computeVertexNormals(); worldUV(x, .3); (B.get(key) || B.set(key, []).get(key)).push(x); return x; };
  const ph = Array.from({ length: 6 }, () => r() * 9), noise = (x, y, z) => .55 * Math.sin(x * .55 + ph[0]) * Math.sin(z * .5 + ph[1]) + .35 * Math.sin(y * .8 + x * .3 + ph[2]) + .25 * Math.sin(z * 1.3 + y * 1.1 + ph[3]);
  const LAND = 12, FLOOR = -14, floor = (x, z) => FLOOR + fbm(x / 12, z / 12, 3) * 1.2;
  // the chamber and the second pocket: lumpy ellipsoids; a point is inside one when its scaled radius is under 1
  const CH = { c: [0, 0, 40], r: [9, 5.5, 11] }, P2 = { c: [9, 0, 64], r: [4, 2.4, 4] }, MOUTH = { x: 0, y0: -11.3, y1: -6.7, w: 4.6 };
  const spine = []; for (let k = 0; k <= 30; k++) { const t = k / 30; spine.push([2.2 * Math.sin(t * Math.PI * 1.3), -9 + 8 * t * t * (3 - 2 * t) * .95, -2 + t * (CH.c[2] - CH.r[2] + 2 - -2)]); }
  const side = []; for (let k = 0; k <= 16; k++) { const t = k / 16; side.push([CH.c[0] + 4 + (P2.c[0] - 4) * t, -1.0 + .6 * Math.sin(t * Math.PI), CH.c[2] + CH.r[2] - 3 + (P2.c[2] - P2.r[2] + 1.5 - (CH.c[2] + CH.r[2] - 3)) * t]); }
  const TR = 2.6, SR = 1.7;
  const inEll = (E, x, y, z, m = 0) => Math.hypot((x - E.c[0]) / (E.r[0] - m), (y - E.c[1]) / (E.r[1] - m), (z - E.c[2]) / (E.r[2] - m)) < 1;
  const nearSpine = (S, R, x, y, z, m = 0) => S.some(([a, b, c]) => Math.hypot(x - a, y - b, z - c) < R - m);
  // a lumpy shell round an ellipsoid (its faces looking in), with a test to drop faces where something opens into it
  const shell = (E, nTh, nPh, drop) => { const pos = []; const P = (i, j) => { const th = i / nTh * Math.PI, phi = j / nPh * Math.PI * 2, d = [Math.sin(th) * Math.cos(phi), Math.cos(th), Math.sin(th) * Math.sin(phi)], p = [E.c[0] + d[0] * E.r[0], E.c[1] + d[1] * E.r[1], E.c[2] + d[2] * E.r[2]], n = noise(...p) * .8; return [p[0] + d[0] * n, p[1] + d[1] * n, p[2] + d[2] * n]; };
    for (let i = 0; i < nTh; i++) for (let j = 0; j < nPh; j++) { const a = P(i, j), b = P(i + 1, j), c = P(i + 1, j + 1), d = P(i, j + 1); for (const tri of [[a, c, b], [a, d, c]]) { const cx = (tri[0][0] + tri[1][0] + tri[2][0]) / 3, cy = (tri[0][1] + tri[1][1] + tri[2][1]) / 3, cz = (tri[0][2] + tri[1][2] + tri[2][2]) / 3; if (drop(cx, cy, cz)) continue; pos.push(...tri.flat()); } }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); return g; };
  // a tube along a spine (its faces looking in), its ends left open, a test to drop faces inside what it opens into
  const tube = (S, R, nA, drop) => { const pos = [], ring = k => { const p = S[Math.min(S.length - 1, k)], q = S[Math.min(S.length - 1, k + 1)], pp = S[Math.max(0, k - 1)], t = new THREE.Vector3(q[0] - pp[0], q[1] - pp[1], q[2] - pp[2]).normalize(), u = new THREE.Vector3(0, 1, 0).sub(t.clone().multiplyScalar(t.y)).normalize(), w = new THREE.Vector3().crossVectors(t, u);
      return Array.from({ length: nA + 1 }, (_, j) => { const a = j / nA * Math.PI * 2, d = u.clone().multiplyScalar(Math.sin(a)).add(w.clone().multiplyScalar(Math.cos(a))), x = p[0] + d.x * R, y = p[1] + d.y * R, z = p[2] + d.z * R, n = noise(x, y, z) * .5; return [x + d.x * n, y + d.y * n, z + d.z * n]; }); };
    const rings = S.map((_, k) => ring(k)); for (let k = 0; k < S.length - 1; k++) for (let j = 0; j < nA; j++) { const a = rings[k][j], b = rings[k + 1][j], c = rings[k + 1][j + 1], d = rings[k][j + 1]; for (const tri of [[a, b, c], [a, c, d]]) { const cx = (tri[0][0] + tri[1][0] + tri[2][0]) / 3, cy = (tri[0][1] + tri[1][1] + tri[2][1]) / 3, cz = (tri[0][2] + tri[1][2] + tri[2][2]) / 3; if (drop(cx, cy, cz)) continue; pos.push(...tri.flat()); } }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); return { g, rings }; };
  const SHAFT = { x: 2.0, z: 44, r: 1.5, y0: 4.0, y1: LAND };
  // the chamber's shell: open where the tunnel, the side tunnel and the shaft come in
  put('rock', shell(CH, 36, 48, (x, y, z) => nearSpine(spine.slice(-4), TR + .4, x, y, z) || nearSpine(side.slice(0, 4), SR + .4, x, y, z) || (y > 2 && Math.hypot(x - SHAFT.x, z - SHAFT.z) < SHAFT.r + .5)));
  put('rock', shell(P2, 18, 24, (x, y, z) => nearSpine(side.slice(-4), SR + .4, x, y, z)));
  const T1 = tube(spine, TR, 18, (x, y, z) => inEll(CH, x, y, z, .6) || z < -1.5), T2 = tube(side, SR, 14, (x, y, z) => inEll(CH, x, y, z, .6) || inEll(P2, x, y, z, .4)); put('rock', T1.g); put('rock', T2.g);
  // the shaft: a tube of rock from the roof to the land, straight up
  { const S = []; for (let k = 0; k <= 8; k++) S.push([SHAFT.x, SHAFT.y0 + (SHAFT.y1 - SHAFT.y0 + .2) * k / 8, SHAFT.z]); put('rock', tube(S, SHAFT.r, 16, (x, y, z) => inEll(CH, x, y, z, .3)).g); }
  // the cliff's face, its foot on the floor and its top at the land, the mouth cut out of it
  { const N = 60, M2 = 40, pos = [], W2 = 70, Pt = (i, j) => { const x = -W2 / 2 + W2 * i / N, y = FLOOR - 1 + (LAND - FLOOR + 1) * j / M2; return [x, y, -1.2 + noise(x, y, 0) * 1.4 + Math.max(0, (y - 6) * .15)]; };
    for (let i = 0; i < N; i++) for (let j = 0; j < M2; j++) { const a = Pt(i, j), b = Pt(i + 1, j), c = Pt(i + 1, j + 1), d = Pt(i, j + 1); for (const tri of [[a, b, c], [a, c, d]]) { const cx = (tri[0][0] + tri[1][0] + tri[2][0]) / 3, cy = (tri[0][1] + tri[1][1] + tri[2][1]) / 3; if (Math.hypot(cx - MOUTH.x, cy - (MOUTH.y0 + MOUTH.y1) / 2) < MOUTH.w / 2) continue; /* the hole the tunnel's own size, inside its walls, so no water shows between the face and the tube */ pos.push(...tri.flat()); } }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); put('rock', g); }
  // the land on the cliff's top, the shaft's mouth open in it; and the sea floor before the cliff
  { const sh = new THREE.Shape(); sh.moveTo(-35, -0.5); sh.lineTo(35, -0.5); sh.lineTo(35, -80); sh.lineTo(-35, -80); sh.lineTo(-35, -0.5); const h = new THREE.Path(); h.absarc(SHAFT.x, -SHAFT.z, SHAFT.r + .2, 0, Math.PI * 2, true); sh.holes.push(h); const g = new THREE.ShapeGeometry(sh, 24); g.rotateX(-Math.PI / 2); g.translate(0, LAND, 0); put('turf', g); }
  { const N = 70, g = new THREE.PlaneGeometry(80, 50, N, N); g.rotateX(-Math.PI / 2); const P = g.attributes.position; for (let i = 0; i < P.count; i++) { const x = P.getX(i), z = P.getZ(i) - 24; P.setXYZ(i, x, floor(x, z), Math.min(z, 0)); } put('sand', g); }
  // the tunnel's floor: rubble along its foot, so it reads as a passage; the chamber's shelf of shingle along its east side, out of the water
  const shelf = { x0: CH.c[0] + 3.0, x1: CH.c[0] + 8.2, z0: CH.c[2] - 6, z1: CH.c[2] + 6, top: .6 };
  { const N = 16, g = new THREE.PlaneGeometry(shelf.x1 - shelf.x0, shelf.z1 - shelf.z0, N, N); g.rotateX(-Math.PI / 2); const P = g.attributes.position; for (let i = 0; i < P.count; i++) { const x = P.getX(i) + (shelf.x0 + shelf.x1) / 2, z = P.getZ(i) + CH.c[2], t = (x - shelf.x0) / (shelf.x1 - shelf.x0), e = Math.min(1, Math.abs(z - CH.c[2]) / 6);
      P.setXYZ(i, x, -1.2 + (shelf.top + 1.2) * Math.min(1, t * 2.2) * (1 - e * e) + noise(x, 0, z) * .05, z); } put('shingle', g); }
  // the glowing flowers on the shelf: clusters of small cups on stems, lit from within (the caves' flowers, OG-099)
  const flowers = []; for (let k = 0; k < 9; k++) { const x = shelf.x0 + 2.6 + r() * 2.2, z = CH.c[2] - 4 + r() * 8; for (let q = 0; q < 6; q++) { const fx = x + (r() - .5) * .7, fz = z + (r() - .5) * .7, t = (fx - shelf.x0) / (shelf.x1 - shelf.x0), e = Math.min(1, Math.abs(fz - CH.c[2]) / 6), fy = -1.2 + (shelf.top + 1.2) * Math.min(1, t * 2.2) * (1 - e * e), h = .15 + r() * .2; if (fy < .08) continue; /* on the dry shingle only, never at the water's edge */
      const s = new THREE.CylinderGeometry(.008, .012, h, 4); s.translate(fx, fy + h / 2, fz); put('stem', s); const c = new THREE.ConeGeometry(.04, .06, 6, 1, true); c.rotateX(Math.PI); c.translate(fx, fy + h + .02, fz); put('glow', c); flowers.push([+fx.toFixed(2), +fy.toFixed(2), +fz.toFixed(2)]); } }
  // the water in the pockets: a surface at the sea's level over each, seen from the air above it and from the water under it
  { for (const E of [CH, P2]) { const g = new THREE.CircleGeometry(1, 40); g.rotateX(-Math.PI / 2); g.scale(E.r[0] * 1.02, 1, E.r[2] * 1.02); g.translate(E.c[0], 0, E.c[2]); put('pocketwater', g); } }
  const M = { rock: mat('rock', { ns: 1.3, color: 0x6e6a62, rough: .95 }), sand: mat('plaster', { ns: 1.6, color: 0xd2c29a, rough: 1 }), turf: new THREE.MeshStandardMaterial({ color: new THREE.Color(.24, .36, .14), roughness: 1 }), shingle: mat('rock', { ns: 1.4, color: 0x8a8478, rough: 1 }),
    stem: new THREE.MeshStandardMaterial({ color: new THREE.Color(.2, .3, .16), roughness: .8 }), glow: new THREE.MeshStandardMaterial({ color: new THREE.Color(.2, .3, .4), emissive: new THREE.Color(.45, .85, 1), emissiveIntensity: 2.2, side: THREE.DoubleSide }),
    pocketwater: new THREE.MeshStandardMaterial({ color: new THREE.Color(.06, .16, .16), roughness: .08, metalness: .1, transparent: true, opacity: .7, side: THREE.DoubleSide, depthWrite: false }) };
  M.rock.side = THREE.DoubleSide;
  const group = new THREE.Group(); let tris = 0; for (const [k, gs] of B) { const g = mergeGeometries(gs, false); gs.forEach(x => x.dispose()); const m = new THREE.Mesh(g, M[k]); m.name = k; m.castShadow = !['pocketwater', 'glow', 'sand'].includes(k); m.receiveShadow = true; group.add(m); tris += g.attributes.position.count / 3; }
  const ringMin = T1.rings.slice(1, -3).map((rg, k) => Math.min(...rg.map(p => Math.hypot(p[0] - spine[k + 1][0], p[1] - spine[k + 1][1], p[2] - spine[k + 1][2])))), sideMin = T2.rings.slice(2, -2).map((rg, k) => Math.min(...rg.map(p => Math.hypot(p[0] - side[k + 2][0], p[1] - side[k + 2][1], p[2] - side[k + 2][2]))));
  return { group, tris: Math.round(tris), draws: group.children.length, floor, mouth: MOUTH, spine, side, tubeR: +Math.min(...ringMin).toFixed(2), sideR: +Math.min(...sideMin).toFixed(2), chamber: { ...CH, air: CH.c[1] + CH.r[1] }, shelf, shaft: SHAFT, pocket2: { ...P2, air: P2.c[1] + P2.r[1] }, flowers, land: LAND };
}

// ── a sunken village (Session 1104; OG-125's "sunken settlements: a village, temples"): a Gatelands village drowned where it stood, on a
// valley floor 10 to 18 m down, built from the kit's own pieces and broken by the sea:
//   - seven cottages (pieces.js's bay plans, 2 to 4 bays) along a lane, their thatch long gone, their walls broken at a ragged height by
//     house (each a band 0.6 to 2.2 m under its eaves; what stood over it, frames and stacks too, gone); the lane between low dry-stone walls;
//   - the church at the lane's end (pieces.js's gatelandsChurch, its round tower): the nave and chancel roofless, their walls broken; the
//     round tower whole, so its cap stands out of the sea, the village's mark from the surface (OG-104's "towers half-sunk at low tide");
//   - a high cross fallen across the lane, the village well.
// Who lived there and why the sea took it is the quest writer's. -> { group, tris, draws, floor, houses: [{ x, z, bays, low, floorUnder, walls,
//   gone }], church { low, floorUnder, top, roof }, cross, lane: [z0, z1] }
import { gatelandsChurch, glMats } from './pieces.js';
export function sunkenVillage(o = {}) {
  const r = o.r || stream('undersea:village'), B = new Map(), put = (key, g) => { const x = g.index ? g.toNonIndexed() : g; for (const k of Object.keys(x.attributes)) if (!['position', 'normal', 'uv'].includes(k)) x.deleteAttribute(k); if (!x.attributes.uv) worldUV(x, .5); (B.get(key) || B.set(key, []).get(key)).push(x); return x; };
  const floor = (x, z) => { const t = Math.min(1, Math.max(0, -z / 70)); return -(10 + 8 * t) + fbm(x / 18, z / 18, 3) * .9; };
  { const N = 120, g = new THREE.PlaneGeometry(90, 100, N, N); g.rotateX(-Math.PI / 2); const P = g.attributes.position; for (let i = 0; i < P.count; i++) { const x = P.getX(i), z = P.getZ(i) - 40; P.setXYZ(i, x, floor(x, z), z); } g.computeVertexNormals(); worldUV(g, .25); put('sand', g); }
  const KEY = new Map(Object.entries(glMats()).map(([k, m]) => [m, k])), group = new THREE.Group(); let tris = 0, draws = 0;
  // settle a built piece on the slope: turned, then lowered so its lowest point is `sink` under the sand beneath it; the roofs taken away,
  // the walls cut at a ragged height `brk(x, z)` over its foot; weed on all of it
  const settle = (g, x, z, ry, sink, roofKeys, brk, capT = 0) => { g.rotation.y = ry; g.position.set(x, 0, z); g.updateMatrixWorld(true); const res = { roof: 0, walls: 0, caps: 0 };
    const meshes = []; g.traverse(m => { if (m.isMesh) meshes.push(m); });
    for (const m of meshes) { const k = KEY.get(m.material) || '', mw = m.matrixWorld.clone(), v = new THREE.Vector3();
      if (roofKeys.includes(k) || k === 'dark' || k === 'glass' || k === 'lit') { m.parent.remove(m); res.roof++; continue; }
      if (brk) { if (m.geometry.index) m.geometry = m.geometry.toNonIndexed(); res.walls += clipMesh(m, (lx, lz) => { v.set(lx, 0, lz).applyMatrix4(mw); return brk(v.x, v.z); }, () => true, .3, /^(w:|rubble)/.test(k) ? capT : 0); res.caps += m.userData.caps || 0; } /* every material: the frames, leaves and stacks over the break go with the walls; Session 1108: clipped along the courses, not dropped by whole triangles */
      m.material = encrust(m.material, .55); }
    g.updateMatrixWorld(true); let low = Infinity; const v = new THREE.Vector3(); g.traverse(m => { if (!m.isMesh) return; const P = m.geometry.attributes.position; for (let i = 0; i < P.count; i += 5) { v.fromBufferAttribute(P, i).applyMatrix4(m.matrixWorld); low = Math.min(low, v.y - floor(v.x, v.z)); } });
    g.position.y = -sink - low; g.updateMatrixWorld(true); group.add(g); g.traverse(m => { if (m.isMesh) { tris += m.geometry.attributes.position.count / 3; draws++; } }); return { ...res, low: +(-sink).toFixed(2), floorUnder: +floor(x, z).toFixed(2) }; };
  // the cottages along the lane, their fronts to it; each one's walls broken at its own ragged band under its eaves
  const houses = []; for (let k = 0; k < 7; k++) { const sx = k % 2 ? 1 : -1, z = -8 - k * 5.2 - r() * 1.2, x = sx * (7 + r() * 1.5), bays = 2 + Math.floor(r() * 3), P = glBayPlan('cottage', bays, { hip: r() < .3, paint: ['red', 'green', 'blue', 'yellow'][k % 4] }); P.r = stream(`undersea:village:${k}`);
    // its walls broken over its foot at its eaves less 0.6 to 2.2 m, ragged by 0.6 m along them (the cottage's eaves are at 2.7 m)
    const g = gatelandsBuilding(P), ry = sx > 0 ? -Math.PI / 2 : Math.PI / 2, b0 = .6 + r() * 1.6, ph1 = r() * 9, foot0 = floor(x, z), h = { k, x: +x.toFixed(2), z: +z.toFixed(2), bays };
    const res = settle(g, x, z, ry, .35, ['thatch', 'pot'], courses((wx, wz) => (2.7 - b0) + .6 * Math.sin(wx * 1.3 + wz * .9 + ph1), k), P.t || .6); /* in the house's own height: it is cut standing at y 0, before it is lowered */
    houses.push({ ...h, ...res }); }
  // the church at the lane's end, roofless, its walls broken; its round tower whole
  const church = (() => { const C = gatelandsChurch({ tower: 'round', r: stream('undersea:church') }), x = 2, z = -52, foot0 = floor(x, z), ry = Math.PI / 2;
    // the round tower is the church's third part: taken out and settled whole on its own, so only the nave's and the chancel's walls break
    const T = C.children[2]; C.remove(T); const tw = new THREE.Group(); tw.add(T);
    const res = settle(C, x, z, ry, .4, ['slate', 'ridge'], courses((wx, wz) => 3.2 + .8 * Math.sin(wx * .9 + wz * 1.1), 9), .9), tres = settle(tw, x, z, ry, .6, [], null);
    return { ...res, tower: tres, top: +new THREE.Box3().setFromObject(tw).max.y.toFixed(2) }; })();
  // the lane's walls: dry-stone runs either side, broken in places; the fallen high cross; the well
  for (const sx of [-1, 1]) for (let z = -6; z > -48; z -= 1.2) { if (r() < .2) continue; const x = sx * 3.6 + (r() - .5) * .2, h = .6 + r() * .5, g = new THREE.BoxGeometry(.7, h, 1.15); g.rotateY((r() - .5) * .2); g.translate(x, floor(x, z) + h / 2 - .1, z); worldUV(g, .6); put('field', g); }
  const cross = (() => { const x = -1.2, z = -45, fy = floor(x, z); { const g = new THREE.BoxGeometry(1.3, .7, 1.0); g.translate(x - 1.6, floor(x - 1.6, z) + .25, z); put('field', g); }
    { const g = new THREE.BoxGeometry(.42, 3.0, .3); g.rotateZ(Math.PI / 2 - .1); g.translate(x, fy + .2, z); put('field', g); } { const g = new THREE.TorusGeometry(.48, .07, 6, 20); g.rotateX(Math.PI / 2 + .1); g.translate(x + 1.2, fy + .12, z); put('field', g); } return { x, z, floor: +fy.toFixed(2) }; })();
  { const x = 1.8, z = -22, fy = floor(x, z), g = new THREE.CylinderGeometry(.85, .9, .8, 18, 1, true); g.translate(x, fy + .3, z); put('field', g); }
  const M = { sand: mat('plaster', { ns: 1.6, color: 0xd2c29a, rough: 1 }), field: encrust(mat('stone', { ns: 1.0, color: 0xb8b0a0 }), .6) };
  for (const [k, gs] of B) { const g = mergeGeometries(gs, false); gs.forEach(x => x.dispose()); const m = new THREE.Mesh(g, M[k]); m.name = k; m.castShadow = k !== 'sand'; m.receiveShadow = true; group.add(m); tris += g.attributes.position.count / 3; draws++; }
  return { group, tris: Math.round(tris), draws, floor, houses, church, cross, lane: [-6, -48] };
}

// ── a drowned quarter of an Aurenne town (Session 1105; OG-125's "sunken settlements: an amphitheatre, temples, a bridge") ──
// A slope of pale sand from 12 m deep at z 0 to 28 m at 80 m out, the bed of the town's river cut 3 m into it along x -20, and on it three of
// the town's stones, in Aurenne's limestone and glaze:
//   - the bridge: three round arches of 7 m on two piers of 2.2 m, 32 m from bank to bank and 4.6 m wide, across the river at z -30, its deck
//     about 9 m under the water; its middle span has fallen, two stubs of its arch left on the piers and its stones on the bed under the gap;
//   - the theatre: a cavea of nine tiers (0.9 m treads, 0.42 m risers) from 7 to 15 m out about its orchestra, opening to the deep water, its
//     back cut into the slope; built in eight wedges, one fallen (its stones spilled into the orchestra) and one slumped 0.55 m; across the
//     orchestra its stage wall of three arched doors, broken at ragged heights, and its six columns, two standing, three broken, one fallen;
//   - the church of the Weaver: pieces.js's town church (OG-061, the blue dome) on its podium at about 23 m, its porch to the shore; its
//     dome's crown and east half fallen in (the stones inside it), its tower's shaft broken at about 13.6 m and its belfry's stones on the
//     sand beside it, the sand drifted over its steps.
// -> { group, tris, draws, floor(x, z), bridge { x, z, deck, bed, spring, spans: [x], faces: [x], fallen: [{ x, y, z, floor }] },
//   theatre { c: [x, z], base, tiers, top, wedges, gone, slumped, columns: [h] }, church { x, z, gone: { dome, tower, fills }, low, floorUnder, foot, top } }
import { aurenneChurch, aurenneTextures } from './pieces.js';
export function sunkenQuarter(o = {}) {
  aurenneTextures(); const r = o.r || stream('undersea:quarter'), B = new Map(), put = (key, g) => { const x = g.index ? g.toNonIndexed() : g; for (const k of Object.keys(x.attributes)) if (!['position', 'normal', 'uv'].includes(k)) x.deleteAttribute(k); if (!x.attributes.uv) worldUV(x, .5); (B.get(key) || B.set(key, []).get(key)).push(x); return x; };
  const RX = -20, floor = (x, z) => { const t = Math.min(1, Math.max(0, -z / 80)); return -(12 + 16 * t) - 3.2 * Math.exp(-(((x - RX) / 6) ** 2)) + fbm(x / 16, z / 16, 3) * .8; };
  { const N = 130, g = new THREE.PlaneGeometry(100, 100, N, N); g.rotateX(-Math.PI / 2); const P = g.attributes.position; for (let i = 0; i < P.count; i++) { const x = P.getX(i) - 4, z = P.getZ(i) - 36; P.setXYZ(i, x, floor(x, z), z); } g.computeVertexNormals(); worldUV(g, .25); put('sand', g); }
  const group = new THREE.Group(); let tris = 0, draws = 0;
  const block = (key, w, h, d, x, z, sink = .15) => { const g = new THREE.BoxGeometry(w, h, d); g.rotateX((r() - .5) * .6); g.rotateY(r() * Math.PI); g.rotateZ((r() - .5) * .6); g.computeBoundingBox(); const lo = g.boundingBox.min.y, y = floor(x, z) - lo - sink; g.translate(x, y, z); worldUV(g, .6); put(key, g); return { x: +x.toFixed(2), y: +(y + lo).toFixed(2), z: +z.toFixed(2), floor: +floor(x, z).toFixed(2) }; };
  // the bridge, drawn as four sections cut at the arches' crowns, each one polygon of deck, half-arches and pier, extruded across its width;
  // the middle span's halves are stubs: its arch's first courses left on the pier, a ragged break up to the deck
  const bridge = (() => { const BX = RX, BZ = -30, Wd = 4.6, s = 7, R = s / 2, pw = 2.2, c = [-(s + pw), 0, s + pw], half = 16, bank = Math.max(floor(BX - 12, BZ), floor(BX + 12, BZ)), yS = bank + .5, yD = yS + R + 2.4, yB = floor(BX, BZ) - 2;
    const arc = (cx, a0, a1, n = 10) => Array.from({ length: n + 1 }, (_, i) => { const a = (a0 + (a1 - a0) * i / n) * Math.PI / 180; return [cx + R * Math.cos(a), yS + R * Math.sin(a)]; });
    // the stub of a broken half-arch on a pier face xf, toward the span (dir +1 to +x): the arch's first 30 degrees, then ragged to the deck
    const stub = (xf, dir) => { const cx = xf + dir * R, a = arc(cx, dir > 0 ? 180 : 0, dir > 0 ? 150 : 30, 3), p = a.at(-1); return [...a, [p[0] + dir * .4, p[1] + .9], [xf + dir * .9, yD - 1.6], [xf + dir * .45, yD - .8], [xf + dir * .15, yD - .3]]; };
    const secs = [
      [[-half, yB], [c[0] - R, yB], ...arc(c[0], 180, 90), [c[0], yD], [-half, yD]],
      [[c[0], yD], ...arc(c[0], 90, 0), [c[0] + R, yB], [c[1] - R, yB], ...stub(c[1] - R, 1), [c[1] - R - .3, yD]],
      [[c[1] + R + .3, yD], ...stub(c[1] + R, -1).reverse(), [c[1] + R, yB], [c[2] - R, yB], ...arc(c[2], 180, 90), [c[2], yD]],
      [[c[2], yD], ...arc(c[2], 90, 0), [c[2] + R, yB], [half, yB], [half, yD]]];
    for (const pts of secs) { const sh = new THREE.Shape(pts.map(([x, y]) => new THREE.Vector2(x, y))), g = new THREE.ExtrudeGeometry(sh, { depth: Wd, bevelEnabled: false }); g.translate(BX, 0, BZ - Wd / 2); worldUV(g, .7); put('stone', g); }
    // its parapets, in 1.6 m lengths with gaps, over the deck that is left
    for (const [a, b] of [[-half, c[1] - R - .3], [c[1] + R + .3, half]]) for (const sz of [-1, 1]) for (let x = a; x < b - .4; x += 1.6) { if (r() < .18) continue; const L = Math.min(1.6, b - x) - .05, h = .7 + r() * .35, g = new THREE.BoxGeometry(L, h, .38); g.translate(BX + x + L / 2, yD + h / 2, BZ + sz * (Wd / 2 - .19)); put('stone', g); }
    // the middle span's stones on the bed under the gap
    const fallen = []; for (let k = 0; k < 18; k++) fallen.push(block('stone', .7 + r() * .5, .5 + r() * .3, 1.0 + r() * 1.0, BX + (r() - .5) * 6.2, BZ + (r() - .5) * 7));
    return { x: BX, z: BZ, width: Wd, deck: +yD.toFixed(2), bed: +floor(BX, BZ).toFixed(2), spring: +yS.toFixed(2), spans: c.map(v => BX + v), faces: [c[0] + R, c[1] - R, c[1] + R, c[2] - R].map(v => BX + v), half, fallen }; })();
  // the theatre: the cavea as eight lathe wedges of tiers about the orchestra (a little over a half ring, open to -z); one fallen, one slumped
  const theatre = (() => { const cx = 14, cz = -14, base = floor(cx, cz) + .05, N = 9, tr = .9, rs = .42, r0 = 7, pts = [[r0, -1.4]];
    for (let i = 0; i < N; i++) { pts.push([r0 + tr * i, rs * (i + 1)], [r0 + tr * (i + 1), rs * (i + 1)]); } const ro = r0 + tr * N, top = rs * N; pts.push([ro, top + .9], [ro + .7, top + .9], [ro + .7, -1.6]);
    const prof = pts.map(([a, b]) => new THREE.Vector2(a, b)), W = 8, span = 3.5, gone = 5, slump = 2, wedges = [];
    // the step profile as a flat cap, closing a wedge's cut end where it meets the fallen wedge or ends the cavea
    const cap = (phi, dy) => { const g = new THREE.ShapeGeometry(new THREE.Shape(prof)); g.rotateY(phi - Math.PI / 2); g.translate(cx, base + dy, cz); worldUV(g, .6); put('theatre', g); };
    for (let k = 0; k < W; k++) { const p0 = -span / 2 + span * k / W, dy = k === slump ? -.55 : 0; if (k === 0 || k === gone + 1) cap(p0, dy); if (k === W - 1 || k === gone - 1) cap(p0 + span / W, dy); if (k === gone) { for (let j = 0; j < 14; j++) { const a = p0 + r() * span / W, rr = r0 - .5 - r() * 5; block('theatre', .9, .42, .8 + r() * .6, cx + rr * Math.sin(a), cz + rr * Math.cos(a)); } continue; }
      const g = new THREE.LatheGeometry(prof, 7, p0, span / W); g.translate(cx, base - (k === slump ? .55 : 0), cz); if (k === slump) { g.translate(-cx, 0, -cz); g.rotateY(.012); g.translate(cx, 0, cz); } const x = put('theatre', g); x.computeVertexNormals(); wedges.push(k); }
    { const g = new THREE.CircleGeometry(r0, 40); g.rotateX(-Math.PI / 2); g.translate(cx, base + .02, cz); worldUV(g, .5); put('pave', g); }
    // the stage wall across the orchestra: three arched doors, its top broken in a ragged line from 2.6 to 7 m
    const zw = cz - 8.2, wb = Math.min(floor(cx - 13, zw), floor(cx + 13, zw)) - .4, sh = new THREE.Shape(); sh.moveTo(-13, 0); sh.lineTo(13, 0);
    for (let x = 13; x >= -13; x -= 1.3) sh.lineTo(x, (x > 7 ? 2.6 : 4.4) + 2.4 * Math.abs(Math.sin(x * .37 + 1.1)) + (r() - .5) * .8 + (base - wb));
    sh.lineTo(-13, 0); for (const [dx, w, h] of [[-7, 1.8, 3.4], [0, 2.6, 4.2], [7, 1.8, 3.4]]) { const p = new THREE.Path(), y0 = base - wb, rr = w / 2; p.moveTo(dx - rr, y0); p.lineTo(dx + rr, y0); p.lineTo(dx + rr, y0 + h - rr); p.absarc(dx, y0 + h - rr, rr, 0, Math.PI, false); p.lineTo(dx - rr, y0); sh.holes.push(p); }
    { const g = new THREE.ExtrudeGeometry(sh, { depth: 1.2, bevelEnabled: false, curveSegments: 8 }); g.translate(cx, wb, zw - 1.2); worldUV(g, .6); put('theatre', g); }
    // its columns before it: two standing whole (6 m), three broken, one fallen on the orchestra's edge
    const columns = []; [6, 2.4, 6, 3.6, 1.3, 0].forEach((h, i) => { const x = cx - 10 + i * 4, z = zw + 1.4, fy = floor(x, z) - .2;
      if (!h) { const g = new THREE.CylinderGeometry(.36, .4, 5.4, 14); g.rotateZ(Math.PI / 2); g.rotateY(.5); g.translate(x - .4, base + .32, z + 3); put('theatre', g); columns.push(0); return; }
      const g = new THREE.CylinderGeometry(.34, .4, h + (base - fy), 14); g.translate(x, fy + (h + base - fy) / 2, z); put('theatre', g); if (h >= 6) { const k = new THREE.BoxGeometry(1.0, .4, 1.0); k.translate(x, base + h + .2, z); put('theatre', k); } columns.push(h); });
    return { c: [cx, cz], base: +base.toFixed(2), tiers: N, top: +(base + top).toFixed(2), r: [r0, ro], wedges, gone: [gone], slumped: [slump], columns, wall: { z: zw, foot: +wb.toFixed(2) } }; })();
  // the church of the Weaver, its dome's east half fallen in and its belfry gone; settled on its podium, the dark fills taken away
  const church = (() => { const C = aurenneChurch({ rank: 'town', w: 14, tower: 1 }, stream('undersea:temple')), I = C.inner, x = 12, z = -56, sink = .5, g = C.group, gone = { dome: 0, tower: 0, fills: 0 };
    const tx = I.W / 2 - 1, ys = I.y0 + I.dh * .55, crown = I.y0 + I.dh + I.R * .75, shaft = I.H * 1.35; /* the dome's crown gone whole and its east half below it; the tower broken at about 13.6 m, over its foot, its belfry fallen */
    for (const m of [...g.children]) { if (!m.isMesh) continue; if (/^(dark|leaf|tree|bloom)/.test(m.name)) { g.remove(m); gone.fills++; continue; } /* the dark fills, and the cypresses by its porch, long dead */ if (m.geometry.index) m.geometry = m.geometry.toNonIndexed();
      gone.dome += cutMesh(m, v => Math.hypot(v.x, v.z) < I.R + 1.6 && v.y > ys && (v.y > crown || v.x > -.6 + .9 * Math.sin(v.z * .9 + v.y * .4)));
      gone.tower += clipMesh(m, courses((px, pz) => shaft + .5 * Math.sin(px * 2.1 + pz * 1.3) - .35 * (px - tx), 3), c => c.x > tx && c.z > I.D / 2 - 1, .3, .6); gone.caps = (gone.caps || 0) + (m.userData.caps || 0); /* everything of the tower over the break: its belfry, cornice and little dome */
      m.material = encrust(m.material, .75); m.material.side = THREE.DoubleSide; } /* both faces: the broken dome is seen from inside, where it has no skin of its own */
    // the dome's stones inside the church, and the belfry's on the sand by its tower
    g.rotation.y = 0; g.position.set(x, 0, z); g.updateMatrixWorld(true); let low = Infinity; const v = new THREE.Vector3(); g.traverse(m => { if (!m.isMesh) return; const P = m.geometry.attributes.position; for (let i = 0; i < P.count; i += 5) { v.fromBufferAttribute(P, i).applyMatrix4(m.matrixWorld); low = Math.min(low, v.y - floor(v.x, v.z)); } });
    g.position.y = -sink - low; g.updateMatrixWorld(true); group.add(g); g.traverse(m => { if (m.isMesh) { tris += m.geometry.attributes.position.count / 3; draws++; } });
    const floorY = g.position.y + I.pl; for (let k = 0; k < 16; k++) { const a = r() * Math.PI - Math.PI / 2, rr = r() * I.R * .9, bx = x + Math.abs(rr * Math.cos(a)), bz = z + rr * Math.sin(a), gg = new THREE.BoxGeometry(.8 + r() * .6, .45 + r() * .3, .7 + r() * .5); gg.rotateY(r() * 3); gg.rotateZ((r() - .5) * .5); gg.translate(bx, floorY + .3, bz); put(k % 3 ? 'stone' : 'glaze', gg); }
    for (let k = 0; k < 10; k++) block('stone', .7 + r() * .4, .5 + r() * .3, .8 + r() * .6, x + I.W / 2 + 4 + r() * 5, z + I.D / 2 + 2 + r() * 6);
    const box = new THREE.Box3().setFromObject(g); return { x, z, gone, low: -sink, floorUnder: +floor(x, z).toFixed(2), foot: +g.position.y.toFixed(2), top: +box.max.y.toFixed(2), domeTop: +(g.position.y + C.domeTop).toFixed(2) }; })();
  const lime = mat('limestone', { ns: 1.0, color: 0xe6dcc6 }), M = { sand: mat('plaster', { ns: 1.6, color: 0xe2d6b2, rough: 1 }), stone: encrust(lime, .55), theatre: encrust(lime, .5), pave: encrust(mat('limestone', { ns: .8, color: 0xd8ccb0 }), .35),
    glaze: encrust(new THREE.MeshStandardMaterial({ color: new THREE.Color(.16, .32, .62), roughness: .5 }), .4) };
  M.theatre.side = THREE.DoubleSide;
  for (const [k, gs] of B) { const g = mergeGeometries(gs, false); gs.forEach(x => x.dispose()); const m = new THREE.Mesh(g, M[k]); m.name = k; m.castShadow = k !== 'sand'; m.receiveShadow = true; group.add(m); tris += g.attributes.position.count / 3; draws++; }
  return { group, tris: Math.round(tris), draws, floor, bridge, theatre, church };
}
