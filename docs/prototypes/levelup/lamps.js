// The Lamps on the Water (the look builder, Session 2352; backlog L9, *Festivals on the Calendar, III* §4, built by the systems builder
// in Session 2347 on Michael's B on #1628): "a small clay lamp of oil goes onto the water for each [hull at sea], on a board, and the
// ebb takes them out toward the harbour mouth in a slow line. Then the hulls lost that year are read, and struck through in the ledger,
// and their lamps go last." The lamp in metres, as the game would draw it, and the line it makes:
//   lamp(o): a board of pine 0.24 by 0.17 m and 0.03 thick, floating 0.01 proud; on it Aurenne's clay lamp, a closed bowl 0.1 across
//     with a filling hole and a nozzle, red-brown unglazed (the house lamps of rooms.js's Aurennais houses); the flame at the nozzle's
//     tip, 0.035 m, emissive. o.how: 'flame' (the flame alone), 'pool' (and a glow on the water under it, an additive disc 1.4 m across,
//     and its reflection, a streak toward the eye), 'light' (and a real point light, 2.5 m reach: what the game cannot afford for 20).
//   line(n, from, to, t, seed): n lamps along the ebb's path from the water stairs to the harbour mouth, a slow line: each set 2.4 m
//     after the last, wandering 0.6 m either side, t the minutes since the first went in (the ebb at 0.12 m/s, a lamp every 20 s).
// Each returns { g, tris }.
import * as THREE from 'three';

const V = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
const C = (r, g, b) => new THREE.Color().setRGB(r, g, b, THREE.SRGBColorSpace);
export const LAMP = { board: [.24, .03, .17], bowl: .05, flameH: .035, ebb: .12, every: 20, gap: 2.4, wander: .6, pool: 1.4 };
const M = {};
const mats = () => M.board || Object.assign(M, {
  board: new THREE.MeshStandardMaterial({ color: C(.55, .42, .28), roughness: .85 }),
  clay: new THREE.MeshStandardMaterial({ color: C(.6, .32, .2), roughness: .9 }),
  flame: new THREE.MeshBasicMaterial({ color: C(1, .78, .42) }),
  core: new THREE.MeshBasicMaterial({ color: C(1, .95, .8) }),
  pool: new THREE.MeshBasicMaterial({ map: glowTex(), color: C(1, .62, .3), transparent: true, opacity: .32, blending: THREE.AdditiveBlending, depthWrite: false }),
  streak: new THREE.MeshBasicMaterial({ map: glowTex(), color: C(1, .66, .34), transparent: true, opacity: .26, blending: THREE.AdditiveBlending, depthWrite: false }) }).board;
function glowTex() { const c = document.createElement('canvas'); c.width = c.height = 128; const x = c.getContext('2d'), g = x.createRadialGradient(64, 64, 0, 64, 64, 64);
  g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(.12, 'rgba(255,255,255,.55)'); g.addColorStop(.4, 'rgba(255,255,255,.14)'); g.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = g; x.fillRect(0, 0, 128, 128);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; }
export function tris(g) { let t = 0; g.traverse(o => { if (o.isMesh) { const gg = o.geometry; t += (gg.index ? gg.index.count : gg.attributes.position.count) / 3; } }); return Math.round(t); }

// one lamp on its board; the board's middle at the origin, its top at y = 0.02 over the water (y = 0), the nozzle to +x
export function lamp(o = {}) {
  mats(); const g = new THREE.Group(), how = o.how || 'pool', [bw, bh, bd] = LAMP.board;
  const add = (geo, m, p = V(), shadow = true) => { const k = new THREE.Mesh(geo, m); k.position.copy(p); k.castShadow = shadow; k.receiveShadow = true; g.add(k); return k; };
  add(new THREE.BoxGeometry(bw, bh, bd), M.board, V(0, bh / 2 - .01, 0));
  const top = bh - .01, r = LAMP.bowl;
  const bowl = new THREE.LatheGeometry([[.001, 0], [.03, 0], [.045, .008], [r, .022], [.046, .036], [.03, .042], [.012, .044], [.01, .038], [.001, .036]].map(([a, b]) => new THREE.Vector2(a, b)), 14);
  add(bowl, M.clay, V(-.02, top, 0));
  const noz = new THREE.CylinderGeometry(.012, .016, .055, 8); noz.rotateZ(Math.PI / 2); add(noz, M.clay, V(.045, top + .022, 0));
  const tip = V(.074, top + .03, 0), fl = new THREE.ConeGeometry(.009, LAMP.flameH, 8); fl.translate(0, LAMP.flameH / 2, 0);
  add(fl, M.flame, tip, false); const core = new THREE.SphereGeometry(.006, 6, 4); add(core, M.core, tip.clone().add(V(0, .006, 0)), false);
  const flame = tip.clone().add(V(0, LAMP.flameH * .4, 0));
  if (how === 'pool' || how === 'light') { const d = new THREE.PlaneGeometry(LAMP.pool, LAMP.pool); d.rotateX(-Math.PI / 2); const p = add(d, M.pool, V(.07, .004, 0), false); p.renderOrder = 2; }
  if (how === 'light') { const L = new THREE.PointLight(C(1, .7, .4), .6, 2.5, 2); L.position.copy(flame).add(V(0, .03, 0)); g.add(L); }
  g.userData.flame = flame; g.userData.how = how;
  return { g, tris: tris(g) };
}
// the reflection's streak: a long soft card lying on the water under a lamp, its length toward the eye (made per view, it follows the camera)
export function streak(at, eye, len = 2.6) { mats(); const d = V(eye.x - at.x, 0, eye.z - at.z).normalize(), geo = new THREE.PlaneGeometry(.28, len); geo.rotateX(-Math.PI / 2);
  const m = new THREE.Mesh(geo, M.streak); m.position.set(at.x + d.x * len * .45, .005, at.z + d.z * len * .45); m.rotation.y = Math.atan2(d.x, d.z); m.renderOrder = 3; return m; }

// a seeded stream
export const seeded = s => () => ((s = (s * 16807) % 2147483647) - 1) / 2147483646;
// the line on the ebb: n lamps from `from` to `to` (V3s on the water); the first in has gone furthest; t minutes since it went in
export function line(n, from, to, t = 6, seed = 5, how = 'pool') {
  const g = new THREE.Group(), r = seeded(seed), dir = to.clone().sub(from), L = dir.length(); dir.normalize(); const side = V(-dir.z, 0, dir.x), lamps = [];
  for (let i = 0; i < n; i++) { const gone = Math.max(0, t * 60 - i * LAMP.every) * LAMP.ebb, s = Math.min(L, gone), w = Math.sin(s * .35 + i * 1.7) * LAMP.wander * Math.min(1, s / 4) + (r() - .5) * .2;
    const p = from.clone().addScaledVector(dir, s).addScaledVector(side, w), Lp = lamp({ how }); Lp.g.position.copy(p); Lp.g.rotation.y = r() * 6.28; g.add(Lp.g); lamps.push({ p, s, i }); }
  return { g, lamps, tris: tris(g) };
}
