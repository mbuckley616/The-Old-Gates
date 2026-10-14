// Ships in the new kit (card F11, backlog L6, OG-004; Session 858, a prototype).
// gatelandsSloop(o, r): the game's sloop (85-world-sea.js: L 13, W 4.4, draft 1.05, the deck 1.0 over the sea, DECK_Y) dressed as the
//   Gatelands' hull of OG-004: clinker-built, each strake's lower edge lapped outside the one below it, tarred below the water and oiled
//   oak above, the sheer strake painted green under a cream wale; a straight raked stem and sternpost, the rudder hung on the post with a
//   tiller; a flat deck of fore-and-aft planks at 1.0 with a hatch; bulwarks and a rail on stanchions, the rail 1.0 m over the deck
//   (scale-numbers-build.md: "waist height, so you cannot walk off a rolling deck") and higher where the sheer rises; one mast with a
//   square sail on its yard, green with the harp (o.harp, default true; OG-004's "green sails with the harp"), its foot 2.2 m over the deck;
//   shrouds, a forestay to the stem head and a backstay to the stern.
//   y = 0 is the sea's surface, +z the bow.
//   -> { group, tris, draws, top, L, W, deck (y), sections (each { z, pts: [[x, y]...] } the moulded half-section, keel to sheer),
//        sect(z, u) (the moulded section, u 0 at the keel to 1 at the sheer), nstr (strakes a side), deckAt(z) (the deck's
//        half-breadth), rail ([[z, y]...] the rail's top along the starboard side), sailFoot (y), mast ([x, z]), hatch {x0,x1,z0,z1} }
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { mat, worldUV } from './common.js';
import { stream } from './pieces.js';

let SM = null;
function sailTex(harp) { const c = document.createElement('canvas'); c.width = c.height = 512; const x = c.getContext('2d');
  x.fillStyle = '#3f6e3c'; x.fillRect(0, 0, 512, 512); x.fillStyle = 'rgba(0,0,0,.08)'; for (let i = 0; i < 512; i += 64) x.fillRect(i, 0, 3, 512); /* the cloths' seams */
  if (harp) { x.strokeStyle = x.fillStyle = '#e6d6a4'; x.lineCap = 'round'; x.lineJoin = 'round';
    // the harp side on: the soundbox a thick diagonal from the neck's head down to the foot, the neck curving over the top to the
    // forepillar, which bows out and down to the foot; the strings straight down from the neck to the soundbox
    const sb = xx => 130 + (xx - 175) * 2.4, nk = xx => { const t = (xx - 175) / 190; return 130 - 70 * Math.sin(Math.PI * t) + 40 * t; };
    x.lineWidth = 9; for (let xx = 196; xx < 352; xx += 13) { const y0 = nk(xx) + 6, y1 = Math.min(sb(xx), 440) - 10; if (y1 > y0 + 10) { x.beginPath(); x.moveTo(xx, y0); x.lineTo(xx, y1); x.stroke(); } }
    x.lineWidth = 30; x.beginPath(); x.moveTo(175, 130); x.lineTo(304, 440); x.stroke();
    x.lineWidth = 20; x.beginPath(); x.moveTo(175, 130); for (let xx = 175; xx <= 365; xx += 5) x.lineTo(xx, nk(xx)); x.stroke();
    x.lineWidth = 22; x.beginPath(); x.moveTo(365, nk(365)); x.bezierCurveTo(400, 260, 380, 380, 304, 440); x.stroke(); }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; }
function mats(harp) {
  if (SM && SM.harp === harp) return SM.M;
  const M = { tar: mat('wood', { ns: .6, color: 0x2a2420, rough: .55 }), oak: mat('wood', { ns: 1.0, color: 0xc29a6a, rough: .7 }), green: mat('wood', { ns: .8, color: 0x2f5a34, rough: .6 }),
    cream: mat('wood', { ns: .5, color: 0xe2d6b0, rough: .6 }), deck: mat('wood', { ns: .9, color: 0xb49a74, rough: .85 }), spar: mat('wood', { ns: .8, color: 0x7a5a3a, rough: .7 }),
    dark: new THREE.MeshStandardMaterial({ color: 0x14100c, roughness: 1 }), rope: new THREE.MeshStandardMaterial({ color: 0x3a3024, roughness: .95 }), iron: new THREE.MeshStandardMaterial({ color: 0x2c2a28, roughness: .5, metalness: .6 }),
    sail: new THREE.MeshStandardMaterial({ map: sailTex(harp), roughness: .9, side: THREE.DoubleSide }) };
  SM = { harp, M }; return M;
}
function kit(M) { const B = new Map();
  const put = (geo, key, x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0, uv = .6) => { const g = geo.index ? geo.toNonIndexed() : geo; for (const k of Object.keys(g.attributes)) if (!['position', 'normal', ...(uv === null ? ['uv'] : [])].includes(k)) g.deleteAttribute(k);
    g.applyMatrix4(new THREE.Matrix4().compose(new THREE.Vector3(x, y, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(rx, ry, rz, 'YXZ')), new THREE.Vector3(1, 1, 1))); if (uv !== null) worldUV(g, uv);
    if (!B.has(key)) B.set(key, []); B.get(key).push(g); };
  const rod = (a, b, r0, r1, key) => { const A = new THREE.Vector3(...a), Bv = new THREE.Vector3(...b), d = Bv.clone().sub(A), g = new THREE.CylinderGeometry(r1, r0, d.length(), 6);
    g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.clone().normalize())); const m = A.clone().add(Bv).multiplyScalar(.5); put(g, key, m.x, m.y, m.z, 0, 0, 0, 2); };
  const finish = extra => { const group = new THREE.Group(); let tris = 0; for (const [k, gs] of B) { const g = mergeGeometries(gs, false); gs.forEach(x => x.dispose()); const m = new THREE.Mesh(g, M[k]); m.name = k; m.castShadow = true; m.receiveShadow = true; group.add(m); tris += g.attributes.position.count / 3; }
    return { group, tris: Math.round(tris), draws: group.children.length, top: +new THREE.Box3().setFromObject(group).max.y.toFixed(2), ...extra }; };
  return { put, rod, finish }; }
// a ribbon through rows of points (rows along the hull, each row a line of points round the section), wound so its face looks out to +x
function ribbon(rows, flip) { const P = [], n = rows[0].length;
  const U = []; for (let i = 0; i + 1 < rows.length; i++) for (let k = 0; k + 1 < n; k++) { const a = rows[i][k], b = rows[i + 1][k], c = rows[i + 1][k + 1], d = rows[i][k + 1];
    const q = flip ? [a, c, b, a, d, c] : [a, b, c, a, c, d]; for (const v of q) { P.push(v[0], v[1], v[2]); U.push((v[1] + Math.abs(v[0]) * .5) * 1.6, v[2] * .45); } }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(U, 2)); g.computeVertexNormals(); return g; }

export function gatelandsSloop(o = {}, r = stream('sloop')) {
  const harp = o.harp !== false, M = mats(harp), { put, rod, finish } = kit(M);
  const L = 13, W = 4.4, DRAFT = 1.05, DECK = 1.0, SHEER = 1.42, BOW = .75, STERN = .5, NS = 40, NSTR = 10, TH = .035, LAP = .025;
  const zs = -L / 2, zb = L / 2;
  // the lines: the half-breadth falls to the stem and the sternpost (a fine bow, a fuller run aft); the keel's depth eases at the ends;
  // the sheer rises to both ends. A section from keel to sheer: a round bilge and a little flare at the top.
  const sheerAt = z => SHEER + BOW * Math.max(0, z / zb) ** 2 + STERN * Math.max(0, z / zs) ** 2;
  const beamAt = z => { const t = Math.max(-1, Math.min(1, z / (zb - .05))) /* 0 at the first and last stations: the strakes close on the posts */, e = t > 0 ? 1.7 : 2.1; return W / 2 / 1.04 * Math.max(0, 1 - Math.abs(t) ** e) ** (t > 0 ? .55 : .62); };
  const keelAt = z => -DRAFT * (1 - .35 * Math.abs(z / zb) ** 3);
  const sect = (z, u) => { const b = beamAt(z), k = keelAt(z), s = sheerAt(z), y = k + (s - k) * u ** 1.15; return [b * Math.sin(Math.PI / 2 * Math.min(1, u * 1.25)) ** .7 * (1 + .04 * Math.max(0, u - .8) / .2), y]; };
  const zAt = i => zs + .05 + (L - .1) * i / NS;
  // the rake: toward the ends a strake's low points draw in along the hull, so the keel is shorter than the sheer and the stem and
  // the sternpost lean out from it
  const zr = (z, u) => z * (1 - (z > 0 ? .13 : .09) * (1 - u) ** 1.5 * Math.abs(z / zb) ** 6);
  const sections = [];
  for (let i = 0; i <= NS; i++) { const z = zAt(i), pts = []; for (let k = 0; k <= 30; k++) pts.push(sect(z, k / 30).map(v => +v.toFixed(3))); sections.push({ z: +z.toFixed(3), pts }); }
  // the strakes: NSTR bands of girth from keel to sheer. Each is a plank TH thick, tilted so its lower edge stands LAP outside the
  // strake below and its upper edge tucks under the next: the clinker lap. Tarred to the waterline, oak above, the sheer strake green.
  const norm = (z, u) => { const a = sect(z, Math.max(0, u - .01)), b = sect(z, Math.min(1, u + .01)), dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy) || 1; return [dy / l, -dx / l]; };
  const KR = 6;
  for (let s = 0; s < NSTR; s++) { const u0 = s / NSTR, u1 = (s + 1) / NSTR + (s < NSTR - 1 ? .018 : 0), outer = [], inner = [];
    for (let i = 0; i <= NS; i++) { const z = zAt(i), ro = [], ri = []; for (let k = 0; k <= KR; k++) { const u = u0 + (u1 - u0) * k / KR, p = sect(z, u), n = norm(z, u), off = (LAP + TH * .3) * (1 - k / KR) * (s ? 1 : .2) + TH * .3;
        ro.push([p[0] + n[0] * off, p[1] + n[1] * off, zr(z, u)]); ri.push([p[0] + n[0] * (off - TH), p[1] + n[1] * (off - TH), zr(z, u)]); } outer.push(ro); inner.push(ri);
    }
    const yMid = sect(0, (u0 + u1) / 2)[1], key = s === NSTR - 1 ? 'green' : yMid < .08 ? 'tar' : 'oak';
    for (const side of [1, -1]) { const mir = rows => rows.map(row => row.map(([x, y, z]) => [x * side, y, z])); put(ribbon(mir(outer), side > 0), key, 0, 0, 0, 0, 0, 0, null); put(ribbon(mir(inner), side < 0), key, 0, 0, 0, 0, 0, 0, null);
      /* the strake's lower edge: a thin face closing the plank */ put(ribbon(mir(outer.map((row, i) => [row[0], inner[i][0]])), side < 0), key, 0, 0, 0, 0, 0, 0, null); } }
  // the keel, the stem and the sternpost: one timber along the bottom, rising raked at either end to the sheer
  { const pts = []; for (let i = 0; i <= NS; i++) { const z = zAt(i); pts.push([zr(z, 0), keelAt(z) - .06]); }
    for (let i = 0; i < NS; i++) { const [z0, y0] = pts[i], [z1, y1] = pts[i + 1]; put(new THREE.BoxGeometry(.16, .2, Math.hypot(z1 - z0, y1 - y0) + .02), 'tar', 0, (y0 + y1) / 2, (z0 + z1) / 2, -Math.atan2(y1 - y0, z1 - z0)); }
    rod([0, keelAt(zb) - .12, zr(zb - .05, 0) - .05], [0, sheerAt(zb) + .35, zb + .12], .1, .08, 'oak'); rod([0, keelAt(zs) - .12, zr(zs + .05, 0) + .05], [0, sheerAt(zs) + .2, zs - .08], .11, .09, 'oak'); }
  // the deck: fore-and-aft planks at DECK, each cut to the hull's half-breadth at that height (deckAt), on beams below
  const deckAt = z => { let lo = 0, hi = 1; for (let k = 0; k < 30; k++) { const m = (lo + hi) / 2; if (sect(z, m)[1] < DECK) lo = m; else hi = m; } return sect(z, lo)[0] - TH * .6; };
  { const PW = .16; for (let x = -W / 2 + PW / 2; x < W / 2; x += PW) { const zz = []; for (let i = 0; i <= NS; i++) { const z = zAt(i); if (deckAt(z) >= Math.abs(x) + PW / 2) zz.push(z); } if (zz.length < 2) continue;
      const z0 = zz[0], z1 = zz[zz.length - 1]; put(new THREE.BoxGeometry(PW, .05, z1 - z0), 'deck', x, DECK - .025, (z0 + z1) / 2, 0, 0, 0, .35); }
    /* the covering board: a strip along each side from the last plank out to the hull, so the deck meets the planking */
    for (const e of [1, -1]) { const rows = []; for (let i = 0; i <= NS; i++) { const z = zAt(i), d = deckAt(z); rows.push([[e * Math.max(0, d - .3), DECK + .002, z], [e * (d + TH * .5), DECK + .002, z]]); } put(ribbon(rows, e < 0), 'oak', 0, 0, 0, 0, 0, 0, null); } }
  // the bulwark's inner face is the top strakes' inside; the rail: stanchions every 0.9 m along the sheer, a cap rail at 1.0 m over the
  // deck or 0.12 m over the sheer, whichever is higher; the cream wale along the sheer strake's top
  const rail = []; { const n = Math.round(L / .9); const top = z => Math.max(DECK + 1.0, sheerAt(z) + .12), inset = z => sect(z, 1)[0] - .06;
    for (let k = 1; k < n; k++) { const z = zs + L * k / n; if (inset(z) < .25) continue; for (const e of [1, -1]) put(new THREE.BoxGeometry(.08, top(z) - DECK, .08), 'oak', e * Math.min(inset(z), deckAt(z) - .05), (top(z) + DECK) / 2, z); rail.push([+z.toFixed(2), +top(z).toFixed(3)]); }
    for (let k = 1; k + 1 < n; k++) { const za = zs + L * k / n, zc = zs + L * (k + 1) / n; if (inset(za) < .25 || inset(zc) < .25) continue;
      for (const e of [1, -1]) { rod([e * Math.min(inset(za), deckAt(za) - .05), top(za), za], [e * Math.min(inset(zc), deckAt(zc) - .05), top(zc), zc], .045, .045, 'oak'); rod([e * (sect(za, 1)[0] + .02), sheerAt(za) - .02, za], [e * (sect(zc, 1)[0] + .02), sheerAt(zc) - .02, zc], .04, .04, 'cream'); } } }
  // the hatch amidships aft of the mast: a coaming 0.3 m high round a dark opening, its cover leaning beside it
  const MZ = 1.0, hatch = { x0: -.6, x1: .6, z0: -2.6, z1: -1.4 };
  { const hz = (hatch.z0 + hatch.z1) / 2; for (const e of [-1, 1]) { put(new THREE.BoxGeometry(1.32, .3, .08), 'oak', 0, DECK + .15, hz + e * .62); put(new THREE.BoxGeometry(.08, .3, 1.24), 'oak', e * .62, DECK + .15, hz); }
    put(new THREE.BoxGeometry(1.16, .02, 1.16), 'dark', 0, DECK + .02, hz); }
  // the mast, stepped forward of amidships; the yard at 9 m, the square sail from it to its foot 2.2 m over the deck, bellied forward
  const MH = 10.5, YY = DECK + 9, SF = DECK + 2.2, YL = 7.6;
  rod([0, keelAt(MZ) + .1, MZ], [0, DECK + MH, MZ], .16, .1, 'spar'); rod([-YL / 2, YY, MZ + .14], [YL / 2, YY, MZ + .14], .07, .07, 'spar');
  { const g = new THREE.PlaneGeometry(YL - .3, YY - SF - .1, 14, 12), P = g.attributes.position; for (let k = 0; k < P.count; k++) { const x = P.getX(k) / (YL / 2), y = P.getY(k) / ((YY - SF) / 2); P.setZ(k, .55 * (1 - x * x) * (1 - .6 * y * y) + .1 * (1 - y) / 2); }
    g.computeVertexNormals(); put(g, 'sail', 0, (YY + SF) / 2 - .05, MZ + .22, 0, 0, 0, null); }
  // the standing rigging: three shrouds a side to the chainplates, the forestay to the stem head, the backstay to the stern
  for (const e of [1, -1]) for (const dz of [-.6, .1, .8]) { const z = MZ + dz - .2; rod([0, DECK + MH * .93, MZ], [e * (sect(z, 1)[0] + .05), sheerAt(z) - .05, z], .012, .012, 'rope'); }
  rod([0, DECK + MH * .97, MZ], [0, sheerAt(zb) + .3, zb + .17], .014, .014, 'rope'); rod([0, DECK + MH * .97, MZ], [0, sheerAt(zs) + .15, zs - .1], .014, .014, 'rope');
  // braces from the yard's arms aft to the quarters, sheets from the sail's clews to the rail
  for (const e of [1, -1]) { rod([e * YL / 2, YY, MZ + .14], [e * (sect(zs + 1.4, 1)[0] - .05), sheerAt(zs + 1.4) + .1, zs + 1.4], .01, .01, 'rope'); rod([e * (YL / 2 - .3), SF, MZ + .3], [e * (sect(MZ - 2.2, 1)[0] - .06), DECK + 1.0, MZ - 2.2], .01, .01, 'rope'); }
  // the rudder on the sternpost and its tiller over the stern; a bucket and a coil of rope by the mast
  { const pb = [zr(zs + .05, 0) + .05, keelAt(zs) - .12], pt = [zs - .08, sheerAt(zs) + .2], ang = Math.atan2(pt[0] - pb[0], pt[1] - pb[1]), rh = Math.hypot(pt[0] - pb[0], pt[1] - pb[1]) - .35;
    /* the rudder hung on the raked sternpost, its blade aft of it */ put(new THREE.BoxGeometry(.1, rh, .62).translate(0, rh / 2, -.36), 'tar', 0, pb[1] + .05, pb[0] - .02, ang);
    rod([0, sheerAt(zs) + .25, zs - .1], [0, DECK + .95, zs + 1.6], .045, .035, 'oak'); }
  put(new THREE.TorusGeometry(.22, .05, 6, 18).rotateX(Math.PI / 2), 'rope', .35, DECK + .05, MZ - .55); put(new THREE.CylinderGeometry(.16, .13, .3, 12), 'oak', -.45, DECK + .15, MZ - .7);
  return finish({ L, W, deck: DECK, sections, sect, nstr: NSTR, deckAt, rail, sailFoot: SF, mast: [0, MZ], hatch, sheerAt, keelAt, harp });
}

// markCutter(o, r) (Session 871, card F11; Michael's A on #306 keeps one rig to name each island, and the Mark's is the game's cutter, his
//   A on #202): the game's cutter (85-world-sea.js: L 14, W 4.0, draft 1.45, a plumb stem, a small transom, one tall mast stepped well
//   forward with a gaff main and a topsail, a staysail to the stem and a jib on a bowsprit) dressed as the Mark's of OG-004 ("dragon prows,
//   dark sails"): carvel-planked, flush and smooth, tarred black above a gilt line as the game's cutter is; the deck at 1.0 over the sea,
//   a low bulwark and a rail at 1.0 m over the deck; the boom at 2.15 m over the deck so a person walks under it (the game's is at 1.35);
//   a rudder on the transom with a tiller (#306, 3 A: a tiller on the small hulls).
//   o.head (default true): a carved beast's head on the stem head, gilt, as the Mark's halls end their bargeboards (OG-034).
//   o.stripe: the sails in red and black cloths (OG-004's raiding longship) instead of tanned red-brown.
//   -> as gatelandsSloop, with boom ({ y, z0, z1 }), stem ([[y, z]...] the stem's line), transom (z), carvel: true.
let CM2 = null;
function cutterSail(stripe) { const c = document.createElement('canvas'); c.width = c.height = 512; const x = c.getContext('2d');
  for (let i = 0; i < 8; i++) { x.fillStyle = stripe ? (i % 2 ? '#1c1a1a' : '#8a2a1e') : (i % 2 ? '#7a3826' : '#723422'); x.fillRect(i * 64, 0, 64, 512); }
  x.fillStyle = 'rgba(0,0,0,.12)'; for (let i = 0; i < 512; i += 64) x.fillRect(i, 0, 3, 512); for (let j = 0; j < 512; j += 128) x.fillRect(0, j, 512, 2); /* the cloths' seams and the reef bands */
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; }
function cutterMats(stripe) {
  if (CM2 && CM2.stripe === stripe) return CM2.M;
  const M = { tar: mat('wood', { ns: .5, color: 0x1e1c1c, rough: .45 }), bottom: mat('wood', { ns: .5, color: 0x4a2a20, rough: .6 }), gilt: new THREE.MeshStandardMaterial({ color: 0xb08a3a, roughness: .35, metalness: .7 }),
    deck: mat('wood', { ns: .9, color: 0xa89270, rough: .85 }), oak: mat('wood', { ns: 1.0, color: 0x8a6a48, rough: .7 }), spar: mat('wood', { ns: .8, color: 0x6a4a2e, rough: .7 }),
    dark: new THREE.MeshStandardMaterial({ color: 0x14100c, roughness: 1 }), rope: new THREE.MeshStandardMaterial({ color: 0x3a3024, roughness: .95 }), iron: new THREE.MeshStandardMaterial({ color: 0x2c2a28, roughness: .5, metalness: .6 }),
    sail: new THREE.MeshStandardMaterial({ map: cutterSail(stripe), roughness: .9, side: THREE.DoubleSide }) };
  CM2 = { stripe, M }; return M;
}
// a sail through four corners (or three, d = c), bilinear, bellied out to +x most in its middle
function quadSail(a, b, c, d, belly, nu = 12, nv = 12) { const P = [], U = [], v3 = q => new THREE.Vector3(...q), A = v3(a), B = v3(b), C = v3(c), D = v3(d), at = (u, v) => A.clone().lerp(B, u).lerp(D.clone().lerp(C, u), v).add(new THREE.Vector3(belly * Math.sin(Math.PI * u) * Math.sin(Math.PI * Math.min(1, v * 1.1)), 0, 0));
  for (let i = 0; i < nu; i++) for (let j = 0; j < nv; j++) { const q = [[i, j], [i + 1, j], [i + 1, j + 1], [i, j], [i + 1, j + 1], [i, j + 1]]; for (const [u, v] of q) { const p = at(u / nu, v / nv); P.push(p.x, p.y, p.z); U.push(u / nu, v / nv); } }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(U, 2)); g.computeVertexNormals(); return g; }
export function markCutter(o = {}, r = stream('cutter')) {
  const stripe = !!o.stripe, head = o.head !== false, M = cutterMats(stripe), { put, rod, finish } = kit(M);
  const L = 14, W = 4.0, DRAFT = 1.45, DECK = 1.0, SHEER = 1.36, BOW = .45, STERN = .2, NS = 44, NSTR = 12, TH = .04, TRN = .32;
  const zs = -L / 2, zb = L / 2, ZT = zs + .05;
  const sheerAt = z => SHEER + BOW * Math.max(0, z / zb) ** 2 + STERN * Math.max(0, z / zs) ** 2;
  // fine and hollow forward to a plumb stem, the beam carried aft to a transom of a third of it; deep, with the forefoot cut away
  const beamAt = z => { const t = Math.max(-1, Math.min(1, z / (zb - .05))); return t > 0 ? W / 2 / 1.03 * Math.max(0, 1 - t ** 1.9) ** .5 : W / 2 / 1.03 * (TRN + (1 - TRN) * Math.max(0, 1 - Math.abs(t) ** 2.4) ** .55); };
  const keelAt = z => { const t = z / zb; return -DRAFT * (t > 0 ? 1 - .55 * t ** 3 : 1 - .18 * t * t); };
  const sect = (z, u) => { const b = beamAt(z), k = keelAt(z), s = sheerAt(z), y = k + (s - k) * u; return [b * Math.sin(Math.PI / 2 * Math.min(1, u * 1.15)) ** .85 * (1 + .03 * Math.max(0, u - .8) / .2), y]; };
  const zAt = i => ZT + (zb - .05 - ZT) * i / NS;
  const sections = []; for (let i = 0; i <= NS; i++) { const z = zAt(i), pts = []; for (let k = 0; k <= 30; k++) pts.push(sect(z, k / 30).map(v => +v.toFixed(3))); sections.push({ z: +z.toFixed(3), pts }); }
  const norm = (z, u) => { const a = sect(z, Math.max(0, u - .01)), b = sect(z, Math.min(1, u + .01)), dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy) || 1; return [dy / l, -dx / l]; };
  // carvel: the strakes laid edge to edge, flush, the planking TH thick; red-brown below the waterline, black above
  const KR = 4; for (let s = 0; s < NSTR; s++) { const u0 = s / NSTR, u1 = (s + 1) / NSTR, outer = [], inner = [];
    for (let i = 0; i <= NS; i++) { const z = zAt(i), ro = [], ri = []; for (let k = 0; k <= KR; k++) { const u = u0 + (u1 - u0) * k / KR, p = sect(z, u), n = norm(z, u); ro.push([p[0] + n[0] * TH / 2, p[1] + n[1] * TH / 2, z]); ri.push([p[0] - n[0] * TH / 2, p[1] - n[1] * TH / 2, z]); } outer.push(ro); inner.push(ri); }
    const key = sect(0, (u0 + u1) / 2)[1] < .02 ? 'bottom' : 'tar';
    for (const side of [1, -1]) { const mir = rows => rows.map(row => row.map(([x, y, z]) => [x * side, y, z])); put(ribbon(mir(outer), side > 0), key, 0, 0, 0, 0, 0, 0, null); put(ribbon(mir(inner), side < 0), key, 0, 0, 0, 0, 0, 0, null); } }
  // the transom: the stern's section closed by a flat board, black, the gilt line across its head
  { const pts = []; for (let k = 0; k <= 30; k++) { const [x, y] = sect(ZT, k / 30); pts.push(new THREE.Vector2(x + TH / 2, y)); } for (let k = 30; k >= 0; k--) { const [x, y] = sect(ZT, k / 30); pts.push(new THREE.Vector2(-x - TH / 2, y)); }
    const g = new THREE.ExtrudeGeometry(new THREE.Shape(pts), { depth: .06, bevelEnabled: false }); put(g, 'tar', 0, 0, ZT - .06, 0, 0, 0, .6); put(new THREE.BoxGeometry(2 * sect(ZT, 1)[0] + .08, .06, .03), 'gilt', 0, sheerAt(ZT) - .14, ZT - .07); }
  // the keel along the bottom; the stem plumb from the forefoot to its head 0.45 m over the sheer
  const stem = []; { const pts = []; for (let i = 0; i <= NS; i++) { const z = zAt(i); pts.push([z, keelAt(z) - .06]); }
    for (let i = 0; i < NS; i++) { const [z0, y0] = pts[i], [z1, y1] = pts[i + 1]; put(new THREE.BoxGeometry(.18, .22, Math.hypot(z1 - z0, y1 - y0) + .02), 'tar', 0, (y0 + y1) / 2, (z0 + z1) / 2, -Math.atan2(y1 - y0, z1 - z0)); }
    const sy0 = keelAt(zb) - .12, sy1 = sheerAt(zb) + .45; put(new THREE.BoxGeometry(.16, sy1 - sy0, .2), 'tar', 0, (sy0 + sy1) / 2, zb + .02); for (let y = sy0; y <= sy1 + .001; y += (sy1 - sy0) / 6) stem.push([+y.toFixed(2), +(zb + .02).toFixed(2)]); }
  // the beast's head on the stem head: a neck rising and curling forward to a head with a snout and an open jaw, gilt (o.head)
  if (head) { const s = new THREE.Shape(), P = [[-.1, 0], [.12, 0], [.2, .3], [.3, .5], [.45, .52], [.7, .55], [.95, .6], [.75, .66], [1.0, .72], [.95, .82], [.62, .9], [.42, .98], [.3, .86], [.1, .6], [-.05, .3]];
    s.moveTo(P[0][0], P[0][1]); for (const [a, b] of P.slice(1)) s.lineTo(a, b); s.lineTo(0, 0);
    const g = new THREE.ExtrudeGeometry(s, { depth: .2, bevelEnabled: true, bevelThickness: .04, bevelSize: .04, bevelSegments: 2, curveSegments: 4 }); g.translate(0, 0, -.1); g.rotateY(-Math.PI / 2); g.scale(1, 1.35, 1.35);
    put(g, 'gilt', 0, sheerAt(zb) + .4, zb - .08, 0, 0, 0, .8); for (const e of [1, -1]) put(new THREE.SphereGeometry(.05, 6, 5), 'dark', e * .14, sheerAt(zb) + .4 + .84 * 1.35, zb - .08 + .62 * 1.35); }
  // the bowsprit from the stem head forward, 4.2 m, a little up
  const SP = [0, sheerAt(zb) + .25 + 4.2 * Math.sin(.08), zb + 4.2 * Math.cos(.08)]; rod([0, sheerAt(zb) + .2, zb - 1.2], SP, .08, .05, 'spar');
  // the deck at DECK, fore-and-aft planks cut to the hull's half-breadth there, a covering board out to the planking
  const deckAt = z => { let lo = 0, hi = 1; for (let k = 0; k < 30; k++) { const m = (lo + hi) / 2; if (sect(z, m)[1] < DECK) lo = m; else hi = m; } return sect(z, lo)[0] - TH * .6; };
  { const PW = .14; for (let x = -W / 2 + PW / 2; x < W / 2; x += PW) { const zz = []; for (let i = 0; i <= NS; i++) { const z = zAt(i); if (deckAt(z) >= Math.abs(x) + PW / 2) zz.push(z); } if (zz.length < 2) continue;
      const z0 = zz[0] - (zz[0] < ZT + .1 ? .06 : 0), z1 = zz[zz.length - 1]; put(new THREE.BoxGeometry(PW, .05, z1 - z0), 'deck', x, DECK - .025, (z0 + z1) / 2, 0, 0, 0, .35); }
    for (const e of [1, -1]) { const rows = []; for (let i = 0; i <= NS; i++) { const z = zAt(i), d = deckAt(z); rows.push([[e * Math.max(0, d - .3), DECK + .002, z], [e * (d + TH * .5), DECK + .002, z]]); } put(ribbon(rows, e < 0), 'oak', 0, 0, 0, 0, 0, 0, null); } }
  // the rail: stanchions every 0.9 m, a cap rail at 1.0 m over the deck or 0.12 over the sheer, the gilt line along the sheer strake
  const rail = []; { const n = Math.round(L / .9); const top = z => Math.max(DECK + 1.0, sheerAt(z) + .12), inset = z => sect(z, 1)[0] - .06;
    for (let k = 1; k < n; k++) { const z = zs + L * k / n; if (inset(z) < .25) continue; for (const e of [1, -1]) put(new THREE.BoxGeometry(.08, top(z) - DECK, .08), 'oak', e * Math.min(inset(z), deckAt(z) - .05), (top(z) + DECK) / 2, z); rail.push([+z.toFixed(2), +top(z).toFixed(3)]); }
    for (let k = 1; k + 1 < n; k++) { const za = zs + L * k / n, zc = zs + L * (k + 1) / n; if (inset(za) < .25 || inset(zc) < .25) continue;
      for (const e of [1, -1]) { rod([e * Math.min(inset(za), deckAt(za) - .05), top(za), za], [e * Math.min(inset(zc), deckAt(zc) - .05), top(zc), zc], .045, .045, 'oak'); rod([e * (sect(za, .93)[0] + .025), sect(za, .93)[1], za], [e * (sect(zc, .93)[0] + .025), sect(zc, .93)[1], zc], .03, .03, 'gilt'); } } }
  // a hatch aft of the mast, its coaming 0.3 m
  const MZ = 1.6, hatch = { x0: -.55, x1: .55, z0: -1.6, z1: -.5 };
  { const hz = (hatch.z0 + hatch.z1) / 2, hw = hatch.x1 - hatch.x0 + .12, hd = hatch.z1 - hatch.z0 + .12; for (const e of [-1, 1]) { put(new THREE.BoxGeometry(hw, .3, .08), 'oak', 0, DECK + .15, hz + e * hd / 2); put(new THREE.BoxGeometry(.08, .3, hd), 'oak', e * hw / 2, DECK + .15, hz); }
    put(new THREE.BoxGeometry(hw - .1, .02, hd - .1), 'dark', 0, DECK + .02, hz); }
  // the mast stepped well forward, its topmast; the boom at 2.15 over the deck to past the transom; the gaff peaked up at 30°
  const MH = 10.8, BY = DECK + 2.15, BZ1 = zs - .7, GT = DECK + 8.4, GL = 6.0, GA = 30 * Math.PI / 180, PK = [0, GT + GL * Math.sin(GA), MZ - GL * Math.cos(GA)];
  rod([0, keelAt(MZ) + .1, MZ], [0, DECK + MH, MZ], .17, .11, 'spar'); rod([0, DECK + MH - .8, MZ], [0, DECK + MH + 2.2, MZ], .08, .06, 'spar');
  rod([0, BY, MZ - .2], [0, BY, BZ1], .08, .07, 'spar'); rod([0, GT, MZ - .2], PK, .07, .06, 'spar');
  // the sails: the gaff main from the boom to the gaff, the topsail over it, the staysail to the stem, the jib to the bowsprit's end
  put(quadSail([0, BY + .1, MZ - .25], [0, BY + .1, BZ1 + .3], PK, [0, GT - .05, MZ - .25], .55), 'sail', 0, 0, 0, 0, 0, 0, null);
  put(quadSail([0, DECK + MH + 2.1, MZ - .1], PK, PK, [0, GT + .15, MZ - .2], .25, 8, 8), 'sail', 0, 0, 0, 0, 0, 0, null);
  put(quadSail([0, DECK + 1.5, MZ + 1.1], [0, sheerAt(zb) + .35, zb - .1], [0, sheerAt(zb) + .35, zb - .1], [0, DECK + MH * .76, MZ + .2], .35, 8, 8), 'sail', 0, 0, 0, 0, 0, 0, null);
  put(quadSail([0, DECK + 2.2, zb - 1.2], SP, SP, [0, DECK + MH * .86, MZ + .25], .35, 8, 8), 'sail', 0, 0, 0, 0, 0, 0, null);
  // the standing rigging: three shrouds a side, the forestay to the stem head, the topmast stay to the bowsprit, the backstays
  for (const e of [1, -1]) for (const dz of [-.7, 0, .7]) { const z = MZ + dz - .3; rod([0, DECK + MH * .9, MZ], [e * (sect(z, 1)[0] + .05), sheerAt(z) - .05, z], .012, .012, 'rope'); }
  rod([0, DECK + MH * .76, MZ], [0, sheerAt(zb) + .35, zb], .014, .014, 'rope'); rod([0, DECK + MH * .86, MZ], SP, .014, .014, 'rope'); for (const e of [1, -1]) rod([0, DECK + MH, MZ], [e * (sect(zs + 1.5, 1)[0] - .05), sheerAt(zs + 1.5), zs + 1.5], .012, .012, 'rope');
  rod([0, BY, BZ1 + .4], [0, sheerAt(ZT) + .05, ZT + .2], .012, .012, 'rope') /* the mainsheet */;
  // the rudder hung on the transom, outboard, and its tiller in over the stern
  { const ry0 = keelAt(zs) - .05, ry1 = sheerAt(ZT) + .1; put(new THREE.BoxGeometry(.1, ry1 - ry0, .7), 'tar', 0, (ry0 + ry1) / 2, ZT - .45); rod([0, ry1, ZT - .2], [0, DECK + .95, ZT + 1.9], .045, .035, 'oak'); }
  put(new THREE.TorusGeometry(.22, .05, 6, 18).rotateX(Math.PI / 2), 'rope', .4, DECK + .05, MZ - .6); put(new THREE.CylinderGeometry(.16, .13, .3, 12), 'oak', -.45, DECK + .15, MZ - .75);
  return finish({ L, W, deck: DECK, sections, sect, nstr: NSTR, deckAt, rail, sailFoot: BY, boom: { y: BY, z0: MZ - .2, z1: BZ1 }, mast: [0, MZ], hatch, sheerAt, keelAt, stem, transom: ZT, carvel: true, head, stripe });
}
