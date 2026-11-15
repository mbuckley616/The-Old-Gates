// A sea fight's shot, fire and foundering in the new kit (card F11, backlog L6; naval combat B's second look session,
// docs/design/naval-combat.md: "shot, fire and foundering"; Session 2244, a prototype). The rules are the systems builder's (Sessions
// 1821–1823): a broadside's balls fly at BROADSIDE.speed in a 0.6 s ripple, four shot (round, chain, grape, shell), a rig alight burns
// 2–3 rig a second for 6–8 s unless her hands douse it, and a ship at 0 hull founders over 8 s (SHIP_FOUNDER_S: she settles 3 m and lists
// 0.35 rad, then she is gone). In the game none of it is drawn but the founder's sink: the balls fly unseen, the guns make no smoke, and a
// rig "alight" shows nothing. Every effect here is one point cloud (one draw), built for a moment t so a still can be taken at any time;
// the game would keep each as a pool and write the same numbers each frame.
//
// smoke(S, side, t): a broadside's smoke t seconds after the first gun (o.ripple 0.6 s across six guns): each gun's flash for 0.12 s, then
//   40 puffs a gun blown out of her port 6–14 m/s under a drag of 1.1/s (5 to 13 m out), swelling to 3 m and rising, drifting on the wind (o.wind,
//   m/s along +x/z), thinning over 6 s to nothing. White-grey, the burnt powder's colour.
// shot(kind): a ball in flight, true size: round a 9 cm iron ball; chain two half-balls on 0.5 m of chain; grape nine 3.5 cm balls spread
//   as they leave the muzzle; shell a ball with its burning fuse.
// splash(x, z, t): where a ball falls short: a column of spray 3 m high that falls back, over 1.4 s.
// splinters(p, n, t): a hit on her side: oak splinters thrown out of the planking.
// rigFire(S, t, o): her sails burning t seconds after catching (o.from, a point on the sail, or the lowest of her main course's foot). The fire
//   runs up and out from there at 0.55 m/s (from: the middle of the foot of the sail on her main mast): flames on the cloth inside the front, smoke rising off them; the cloth behind the front charred
//   (the sail's colour multiplied toward black, a vertex colour on a clone of her sail's material). o.out: the time her hands put it out
//   (the flames stop, the char stays).
// founder(S, u): her pose u (0 to 1) of the way down: as the game's 3 m and 0.35 rad, and down by the head 0.12 rad, so she goes bow first; a
//   ring of broken water where her sides meet the sea, strongest halfway.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

// a seeded stream: the same moment draws the same cloud
function rng(seed) { let s = (seed >>> 0) || 1; return () => (s = (s * 16807) % 2147483647) / 2147483647; }
const MATS = {};
function cloudMat(add) { const k = add ? 'add' : 'mix'; if (MATS[k]) return MATS[k];
  const m = new THREE.ShaderMaterial({ transparent: true, depthWrite: false, blending: add ? THREE.AdditiveBlending : THREE.NormalBlending, uniforms: { uScale: { value: 600 } },
    vertexShader: `attribute float aSize; attribute vec4 aCol; uniform float uScale; varying vec4 vC;
      void main(){ vec4 mv = modelViewMatrix * vec4(position, 1.); vC = aCol; gl_PointSize = aSize * uScale / max(.1, -mv.z); gl_Position = projectionMatrix * mv; }`,
    fragmentShader: `varying vec4 vC; void main(){ vec2 d = gl_PointCoord - .5; float r = length(d) * 2.; if (r > 1.) discard;
      float a = vC.a * (1. - smoothstep(.2, 1., r)); float lit = 1.08 - .3 * gl_PointCoord.y; /* lit from above, the underside in its own shade */ gl_FragColor = vec4(vC.rgb * lit, a); }` });
  MATS[k] = m; return m; }
// one point cloud from a list of { p:[x,y,z], s (m across), c:[r,g,b], a }
function cloud(list, add) { const n = list.length, P = new Float32Array(n * 3), S = new Float32Array(n), C = new Float32Array(n * 4);
  list.forEach((q, i) => { P.set(q.p, i * 3); S[i] = q.s; C.set([...q.c, q.a], i * 4); });
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(P, 3)); g.setAttribute('aSize', new THREE.BufferAttribute(S, 1)); g.setAttribute('aCol', new THREE.BufferAttribute(C, 4));
  const pts = new THREE.Points(g, cloudMat(add)); pts.frustumCulled = false; pts.renderOrder = 3;
  pts.onBeforeRender = (r, sc, cam) => { const v = new THREE.Vector2(); r.getDrawingBufferSize(v); pts.material.uniforms.uScale.value = v.y / (2 * Math.tan(cam.fov * Math.PI / 360)); };
  pts.userData.n = n; return pts; }

export function smoke(S, side, t, o = {}) { const ripple = o.ripple ?? .6, wind = o.wind || [1.5, 0, -1.0], mix = [], add = [], ports = S.ports.filter(p => p[0] === side);
  ports.forEach(([e, z, y], gi) => { const tg = t - gi * ripple / Math.max(1, ports.length - 1); if (tg < 0) return; const r = rng(9001 + gi * 131 + (side > 0 ? 7 : 0));
    const u = (y - S.keelAt(z)) / (S.sheerAt(z) - S.keelAt(z)), x0 = e * (S.sect(z, u)[0] + .55);
    if (tg < .12) for (let k = 0; k < 6; k++) { const d = k * .25 * (1 + tg * 6); add.push({ p: [x0 + e * d, y + (r() - .5) * .1, z + (r() - .5) * .1], s: (.9 - k * .12) * (1.4 - tg * 5), c: [1, .62 + k * .05, .25], a: .95 }); }
    for (let k = 0; k < 40; k++) { const v0 = 6 + r() * 8, ang = (r() - .5) * .9, el = (r() - .3) * .5, kd = 1.1, dist = v0 * (1 - Math.exp(-kd * tg)) / kd;
      const dx = e * Math.cos(ang) * Math.cos(el), dz = Math.sin(ang) * Math.cos(el), dy = Math.sin(el), rise = .35 * tg + .05 * tg * tg;
      const s = (.3 + 2.2 * (1 - Math.exp(-1.6 * tg)) + .3 * tg) * (.5 + r() * .9), a = (.35 + r() * .5) * Math.exp(-tg / 6) * Math.min(1, tg * 12 + .2), g = .8 + r() * .14 - .12 * Math.exp(-tg * 2);
      if (a < .01) continue; mix.push({ p: [x0 + dx * dist + wind[0] * tg, y + dy * dist + rise, z + dz * dist + wind[2] * tg], s, c: [g, g, g * .98], a }); } });
  const G = new THREE.Group(); if (mix.length) G.add(cloud(mix, false)); if (add.length) G.add(cloud(add, true)); G.userData.puffs = mix.length; G.userData.flash = add.length; S.group.add(G); return G; }

export function shot(kind) { const iron = new THREE.MeshStandardMaterial({ color: 0x1e1c1a, roughness: .45, metalness: .7 }), gs = [];
  if (kind === 'chain') { /* the chain across the line of flight, as it spins */ for (const e of [-1, 1]) gs.push(new THREE.SphereGeometry(.045, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2).rotateZ(-e * Math.PI / 2).translate(e * .25, 0, 0));
    for (let k = 0; k < 7; k++) { const g = new THREE.TorusGeometry(.03, .008, 4, 8); if (k % 2) g.rotateY(Math.PI / 2); g.rotateZ(Math.PI / 2); gs.push(g.translate(-.21 + k * .07, 0, 0)); } }
  else if (kind === 'grape') { const r = rng(77); for (let k = 0; k < 9; k++) gs.push(new THREE.SphereGeometry(.0175, 8, 6).translate((r() - .5) * .5, (r() - .5) * .5, (r() - .5) * .5)); }
  else gs.push(new THREE.SphereGeometry(.045, 14, 10));
  const m = new THREE.Mesh(mergeGeometries(gs.map(g => g.toNonIndexed()), false), iron), G = new THREE.Group(); G.add(m);
  if (kind === 'shell') { m.add(new THREE.Mesh(new THREE.CylinderGeometry(.008, .008, .03, 6).translate(0, .055, 0), new THREE.MeshStandardMaterial({ color: 0x5a4632 })));
    G.add(cloud([{ p: [0, .075, 0], s: .09, c: [1, .7, .3], a: 1 }, { p: [0, .09, -.03], s: .06, c: [1, .45, .15], a: .8 }], true)); }
  G.userData.kind = kind; return G; }

export function splash(x, z, t, seed = 5) { const r = rng(seed), L = []; if (t < 0 || t > 1.6) return cloud([], false);
  for (let k = 0; k < 70; k++) { const v = 4 + r() * 4.5, a = r() * Math.PI * 2, sp = r() * .9, x1 = Math.cos(a) * sp * t * 1.2, z1 = Math.sin(a) * sp * t * 1.2, y = Math.max(0, v * t - 4.9 * t * t);
    L.push({ p: [x + x1, y, z + z1], s: .25 + r() * .35 + t * .4, c: [.92, .96, 1], a: .85 * (1 - t / 1.6) }); }
  for (let k = 0; k < 16; k++) { const a = k / 16 * Math.PI * 2, rr = .4 + t * 1.6; L.push({ p: [x + Math.cos(a) * rr, .05, z + Math.sin(a) * rr], s: .6, c: [.95, .97, 1], a: .6 * (1 - t / 1.6) }); }
  return cloud(L, false); }

export function splinters(p, n, t, out, seed = 3) { const r = rng(seed), L = []; if (t < 0 || t > 1.2) return cloud([], false);
  for (let k = 0; k < n; k++) { const v = 3 + r() * 6, ang = (r() - .5) * 1.6, el = r() * .9, dx = out[0] * Math.cos(ang) - out[2] * Math.sin(ang), dz = out[2] * Math.cos(ang) + out[0] * Math.sin(ang);
    L.push({ p: [p[0] + dx * v * Math.cos(el) * t, p[1] + v * Math.sin(el) * t - 4.9 * t * t, p[2] + dz * v * Math.cos(el) * t], s: .06 + r() * .08, c: [.62, .46, .3], a: 1 }); }
  for (let k = 0; k < 8; k++) L.push({ p: [p[0] + out[0] * (.3 + t), p[1] + (r() - .3) * .4, p[2] + out[2] * (.3 + t) + (r() - .5) * .5], s: .4 + t * 1.2, c: [.55, .5, .44], a: .5 * (1 - t / 1.2) });
  return cloud(L, false); }

// her sails' vertices, in her own space (the merged sail mesh's positions)
function sailPts(S) { const m = S.group.children.find(c => c.name === 'sail'); if (!m) return null; return m; }
export function rigFire(S, t, o = {}) { const m = sailPts(S); if (!m) return null; const P = m.geometry.attributes.position, n = P.count, rate = .55;
  const mz = S.mast[1]; let from = o.from; if (!from) { let lo = 1e9; for (let i = 0; i < n; i++) { const y = P.getY(i), x = P.getX(i); if (Math.abs(x) < 1.2 && Math.abs(P.getZ(i) - mz) < 1.5 && y < lo) { lo = y; from = [x, y, P.getZ(i)]; } } }
  const tb = Math.min(t, o.out ?? 1e9), front = .3 + rate * tb, F = new THREE.Vector3(...from);
  // the char: the cloth behind the front, as a vertex colour on a clone of the sail's material
  const col = new Float32Array(n * 3), v = new THREE.Vector3(); let charred = 0;
  for (let i = 0; i < n; i++) { v.fromBufferAttribute(P, i); const d = v.distanceTo(F) + (v.y < F.y ? 0 : 0) - (v.y - F.y) * .25 /* fire climbs */, burnt = Math.max(0, Math.min(1, (front - d - .2) / .8));
    const k = 1 - .9 * burnt; col.set([k * 1.05, k * .9, k * .8], i * 3); /* scorched toward a brown-black */ if (burnt > .5) charred++; }
  m.geometry.setAttribute('color', new THREE.BufferAttribute(col, 3)); if (!m.material.vertexColors) { m.material = m.material.clone(); m.material.vertexColors = true; m.material.needsUpdate = true; }
  const live = t < (o.out ?? 1e9), fl = [], sm = [], r = rng(4242 + Math.floor(t * 10));
  if (live) for (let i = 0; i < n; i += 3) { v.fromBufferAttribute(P, i); const d = v.distanceTo(F) - (v.y - F.y) * .25; if (d > front || d < front - 1.0) continue;
    const h = .5 + r() * .9, j = () => (r() - .5) * .35; /* three tongues stacked up from the cloth, merging into one sheet of flame */ fl.push({ p: [v.x + j(), v.y + h * .25, v.z + j()], s: 1.0 + r() * .6, c: [1, .62 + r() * .25, .22], a: .45 }); fl.push({ p: [v.x + j(), v.y + h * .7, v.z + j()], s: .75 + r() * .4, c: [1, .4, .1], a: .38 }); fl.push({ p: [v.x + j(), v.y + h * 1.2, v.z + j()], s: .45 + r() * .3, c: [.9, .22, .05], a: .3 });
    for (let q = 0; q < 2; q++) { const age = r() * 4; sm.push({ p: [v.x + age * .8, v.y + 1 + age * 1.8, v.z - age * .5], s: .8 + age * 1.1, c: [.16, .14, .13], a: .5 * (1 - age / 4.3) }); } }
  const G = new THREE.Group(); if (sm.length) G.add(cloud(sm, false)); if (fl.length) G.add(cloud(fl, true)); G.userData = { flames: fl.length, smoke: sm.length, charred, verts: n, front: +front.toFixed(2) }; S.group.add(G); return G; }

export const FOUNDER = { sink: 3, list: .35, head: .12 };
export function founder(S, u, scene) { u = Math.max(0, Math.min(1, u)); const e = u * u * (3 - 2 * u);
  S.group.position.y = -FOUNDER.sink * u; S.group.rotation.z = FOUNDER.list * Math.min(1, u * 1.6); S.group.rotation.x = FOUNDER.head * e;
  // broken water round her where her sides meet the sea
  const r = rng(31), L = [], k = Math.sin(Math.PI * u); S.group.updateMatrixWorld(true);
  if (k > .02) for (let i = 0; i < 260; i++) { const z = -S.L / 2 + r() * S.L, side = r() < .5 ? -1 : 1, x = side * (S.W / 2) * (1 - (2 * z / S.L) ** 2) ** .5 * (1.05 + r() * .4);
    L.push({ p: [x, .03 + r() * .04, z], s: .15 + r() * .25, c: [.92, .95, .97], a: .45 * k }); }
  const C = cloud(L, false); if (scene) scene.add(C); return { cloud: C, u, sink: +S.group.position.y.toFixed(2), list: +S.group.rotation.z.toFixed(3), head: +S.group.rotation.x.toFixed(3) }; }
