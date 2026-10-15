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

// o.dress 'mark' (Session 900; Michael's A on #312 and #323: the Mark's dress is tar-black over a gilt line, tanned sails and a gilt
//   beast's head on the stem; the small hulls stay clinker): the same hull tarred black above a red-brown bottom, the wale gilt, the
//   Mark's rig (#306: one rig names each island; the Mark's is the cutter's gaff) with tanned sails, the beast's head on the stem head (o.head, default true), and o.shields (default true) a row of
//   painted round shields hung outboard on the rail along the waist, the Mark's "painted round" of OG-028. markSloop(o, r) is this.
let MSM = null;
function markSloopMats() { if (MSM) return MSM; const C = cutterMats(false), std = c => new THREE.MeshStandardMaterial({ color: c, roughness: .6 });
  MSM = { ...C, green: C.tar, cream: C.gilt, shieldA: std(0x24365e), shieldB: std(0x8a2a1e), shieldC: std(0xd8ccb0) }; return MSM; }
export function markSloop(o = {}, r = stream('marksloop')) { return gatelandsSloop({ ...o, dress: 'mark' }, r); }
// o.dress 'aurenne' (Session 902; #306's one rig to an island, Aurenne's the lateen; #316's A, the sun-star; #323, the small hulls clinker):
//   the same hull tallowed white below the water, oiled above, the sheer strake blue under a gilt wale (the caravel's colours), one
//   lateen on a mast raked 4° forward, its yard slung to starboard, white with the sun-star in gold (o.star, default true), its foot
//   2.2 m or more over the deck; a tiller (#306's 3 A). aurenneSloop(o, r) is this.
let ASM = null;
function aurSloopMats(star) { if (ASM && ASM.star === star) return ASM.M; const C = caravelMats(star);
  ASM = { star, M: { ...C, tar: C.hull, green: C.blue, cream: C.gilt, iron: new THREE.MeshStandardMaterial({ color: 0x2c2a28, roughness: .5, metalness: .6 }) } }; return ASM.M; }
export function aurenneSloop(o = {}, r = stream('aursloop')) { return gatelandsSloop({ ...o, dress: 'aurenne' }, r); }
export function gatelandsSloop(o = {}, r = stream('sloop')) {
  const MARK = o.dress === 'mark', AURD = o.dress === 'aurenne', star = AURD && o.star !== false, harp = !MARK && !AURD && o.harp !== false, M = MARK ? markSloopMats() : AURD ? aurSloopMats(star) : mats(harp), { put, rod, finish } = kit(M);
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
    const yMid = sect(0, (u0 + u1) / 2)[1], key = MARK ? (yMid < .08 ? 'bottom' : 'tar') : AURD ? (yMid < .08 ? 'tallow' : s === NSTR - 1 ? 'blue' : 'hull') : s === NSTR - 1 ? 'green' : yMid < .08 ? 'tar' : 'oak';
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
  // (the Mark's dress takes the Mark's rig instead, #306's one rig to an island: the cutter's gaff main and topsail, a staysail and a jib
  // on a bowsprit, the boom 2.15 m over the deck)
  const MH = 10.5, YY = DECK + 9, YL = 7.6, BY = DECK + 2.15, SF = MARK ? BY : DECK + 2.2, chains = []; let lateen = null;
  if (AURD) { /* Aurenne's lateen: the caravel's main, at the sloop's size */ const RAKE = 4 * Math.PI / 180, sy = 7.0, ang = 50 * Math.PI / 180, fw = 5.4, af = 7.4, side = 1, xs = .3, top = DECK + sy + .8, mast = y => MZ + (y - (keelAt(MZ) + .1)) * Math.tan(RAKE);
    const Sg = [xs, DECK + sy, mast(DECK + sy)], T = [xs, Sg[1] - fw * Math.sin(ang), Sg[2] + fw * Math.cos(ang)], P = [xs, Sg[1] + af * Math.sin(ang), Sg[2] - af * Math.cos(ang)], Cl = [xs, DECK + 2.5, -4.3];
    rod([0, keelAt(MZ) + .1, MZ], [0, top, mast(top)], .16, .1, 'spar'); rod(T, P, .085, .055, 'spar'); put(lateenSail([T[0], T[1] - .05, T[2] - .15], [P[0], P[1] - .15, P[2] + .2], Cl, side, .5), 'sail', 0, 0, 0, 0, 0, 0, null);
    const tz = Math.min(T[2], zb - .2); rod(T, [0, tz > zb - 1 ? sheerAt(zb) + .3 : DECK + .05, tz], .014, .014, 'rope'); rod(Cl, [side * (sect(-5.7, 1)[0] - .08), Math.max(DECK + 1.0, sheerAt(-5.7) + .12), -5.7], .012, .012, 'rope') /* the sheet, led aft of the deck's walk */;
    rod([xs * .5, top - .1, mast(top)], [0, DECK + .4, MZ - .3], .012, .012, 'rope'); for (const dz of [-.8, 0, .8]) { const z = MZ + dz - .3; rod([0, top - .3, mast(top - .3)], [-side * (sect(z, 1)[0] + .05), sheerAt(z) - .05, z], .012, .012, 'rope'); }
    rod([0, top - .2, mast(top - .2)], [0, sheerAt(zb) + .3, zb + .17], .014, .014, 'rope'); lateen = { tack: T.map(v => +v.toFixed(2)), peak: P.map(v => +v.toFixed(2)), clew: Cl, side, top: +top.toFixed(2) }; }
  else if (!MARK) {
  rod([0, keelAt(MZ) + .1, MZ], [0, DECK + MH, MZ], .16, .1, 'spar'); rod([-YL / 2, YY, MZ + .14], [YL / 2, YY, MZ + .14], .07, .07, 'spar');
  { const g = new THREE.PlaneGeometry(YL - .3, YY - SF - .1, 14, 12), P = g.attributes.position; for (let k = 0; k < P.count; k++) { const x = P.getX(k) / (YL / 2), y = P.getY(k) / ((YY - SF) / 2); P.setZ(k, .55 * (1 - x * x) * (1 - .6 * y * y) + .1 * (1 - y) / 2); }
    g.computeVertexNormals(); put(g, 'sail', 0, (YY + SF) / 2 - .05, MZ + .22, 0, 0, 0, null); }
  // the standing rigging: three shrouds a side to the chainplates, the forestay to the stem head, the backstay to the stern
  for (const e of [1, -1]) for (const dz of [-.6, .1, .8]) { const z = MZ + dz - .2; rod([0, DECK + MH * .93, MZ], [e * (sect(z, 1)[0] + .05), sheerAt(z) - .05, z], .012, .012, 'rope'); }
  rod([0, DECK + MH * .97, MZ], [0, sheerAt(zb) + .3, zb + .17], .014, .014, 'rope'); rod([0, DECK + MH * .97, MZ], [0, sheerAt(zs) + .15, zs - .1], .014, .014, 'rope');
  // braces from the yard's arms aft to the quarters, sheets from the sail's clews to the rail
  for (const e of [1, -1]) { rod([e * YL / 2, YY, MZ + .14], [e * (sect(zs + 1.4, 1)[0] - .05), sheerAt(zs + 1.4) + .1, zs + 1.4], .01, .01, 'rope'); rod([e * (YL / 2 - .3), SF, MZ + .3], [e * (sect(MZ - 2.2, 1)[0] - .06), DECK + 1.0, MZ - 2.2], .01, .01, 'rope'); }
  } else { const BZ1 = zs - .45, GT = DECK + 8.1, GL = 5.4, GA = 30 * Math.PI / 180, PK = [0, GT + GL * Math.sin(GA), MZ - GL * Math.cos(GA)], SP = [0, sheerAt(zb) + .3 + 3.6 * Math.sin(.08), zb + 3.6 * Math.cos(.08)];
    rod([0, keelAt(MZ) + .1, MZ], [0, DECK + MH, MZ], .16, .1, 'spar'); rod([0, DECK + MH - .8, MZ], [0, DECK + MH + 2.0, MZ], .075, .055, 'spar'); rod([0, sheerAt(zb) + .22, zb - 1.0], SP, .075, .05, 'spar');
    rod([0, BY, MZ - .2], [0, BY, BZ1], .08, .07, 'spar'); rod([0, GT, MZ - .2], PK, .07, .06, 'spar');
    put(quadSail([0, BY + .1, MZ - .25], [0, BY + .1, BZ1 + .3], PK, [0, GT - .05, MZ - .25], .5), 'sail', 0, 0, 0, 0, 0, 0, null);
    put(quadSail([0, DECK + MH + 1.9, MZ - .1], PK, PK, [0, GT + .15, MZ - .2], .22, 8, 8), 'sail', 0, 0, 0, 0, 0, 0, null);
    put(quadSail([0, DECK + 1.5, MZ + 1.0], [0, sheerAt(zb) + .3, zb - .15], [0, sheerAt(zb) + .3, zb - .15], [0, DECK + MH * .76, MZ + .2], .3, 8, 8), 'sail', 0, 0, 0, 0, 0, 0, null);
    put(quadSail([0, DECK + 2.2, zb - 1.0], SP, SP, [0, DECK + MH * .86, MZ + .25], .3, 8, 8), 'sail', 0, 0, 0, 0, 0, 0, null);
    for (const e of [1, -1]) for (const dz of [-.7, 0, .7]) { const z = MZ + dz - .3; if (e > 0) chains.push(z); rod([0, DECK + MH * .9, MZ], [e * (sect(z, 1)[0] + .05), sheerAt(z) - .05, z], .012, .012, 'rope'); }
    rod([0, DECK + MH * .76, MZ], [0, sheerAt(zb) + .3, zb], .014, .014, 'rope'); rod([0, DECK + MH * .86, MZ], SP, .014, .014, 'rope'); for (const e of [1, -1]) rod([0, DECK + MH, MZ], [e * (sect(zs + 1.5, 1)[0] - .05), sheerAt(zs + 1.5), zs + 1.5], .012, .012, 'rope');
    rod([0, BY, BZ1 + .4], [0, sheerAt(zs) + .1, zs + .3], .012, .012, 'rope') /* the mainsheet */; }
  // the rudder on the sternpost and its tiller over the stern; a bucket and a coil of rope by the mast
  { const pb = [zr(zs + .05, 0) + .05, keelAt(zs) - .12], pt = [zs - .08, sheerAt(zs) + .2], ang = Math.atan2(pt[0] - pb[0], pt[1] - pb[1]), rh = Math.hypot(pt[0] - pb[0], pt[1] - pb[1]) - .35;
    /* the rudder hung on the raked sternpost, its blade aft of it */ put(new THREE.BoxGeometry(.1, rh, .62).translate(0, rh / 2, -.36), 'tar', 0, pb[1] + .05, pb[0] - .02, ang);
    rod([0, sheerAt(zs) + .25, zs - .1], [0, DECK + .95, zs + 1.6], .045, .035, 'oak'); }
  put(new THREE.TorusGeometry(.22, .05, 6, 18).rotateX(Math.PI / 2), 'rope', .35, DECK + .05, MZ - .55); put(new THREE.CylinderGeometry(.16, .13, .3, 12), 'oak', -.45, DECK + .15, MZ - .7);
  // the Mark's dress: the beast's head on the stem head (the cutter's, scaled to the sloop's stem), the shields on the rail
  const head = MARK && o.head !== false, shields = [];
  if (head) { const sh = new THREE.Shape(), P = [[-.1, 0], [.12, 0], [.2, .3], [.3, .5], [.45, .52], [.7, .55], [.95, .6], [.75, .66], [1.0, .72], [.95, .82], [.62, .9], [.42, .98], [.3, .86], [.1, .6], [-.05, .3]];
    sh.moveTo(P[0][0], P[0][1]); for (const [a, b] of P.slice(1)) sh.lineTo(a, b); sh.lineTo(0, 0);
    const g = new THREE.ExtrudeGeometry(sh, { depth: .18, bevelEnabled: true, bevelThickness: .035, bevelSize: .035, bevelSegments: 2, curveSegments: 4 }); g.translate(0, 0, -.09); g.rotateY(-Math.PI / 2); g.scale(1, 1.15, 1.15);
    const hy = sheerAt(zb) + .25, hz = zb - .02; put(g, 'gilt', 0, hy, hz, 0, 0, 0, .8); for (const e of [1, -1]) put(new THREE.SphereGeometry(.045, 6, 5), 'dark', e * .13, hy + .84 * 1.15, hz + .62 * 1.15); }
  if (MARK && o.shields !== false) { const RS = .38, top = z => Math.max(DECK + 1.0, sheerAt(z) + .12);
    for (let z = -3.4, k = 0; z <= 3.41; z += .8, k++) for (const e of [1, -1]) { if (chains.some(c => Math.abs(c - z) < .45)) continue; /* clear of the shrouds' feet */ const x = e * (sect(z, 1)[0] + .07), y = top(z) - RS - .02, g = new THREE.CylinderGeometry(RS, RS, .03, 20); g.rotateZ(Math.PI / 2);
      put(g, k % 2 ? 'shieldA' : 'shieldB', x, y, z); const half = new THREE.CylinderGeometry(RS * .98, RS * .98, .032, 20, 1, false, 0, Math.PI / 2); half.rotateZ(Math.PI / 2); put(half, 'shieldC', x, y, z);
      const boss = new THREE.SphereGeometry(.09, 10, 6, 0, Math.PI * 2, 0, Math.PI / 2); boss.rotateZ(-e * Math.PI / 2); put(boss, 'iron', x + e * .015, y, z); shields.push({ x, y, z, r: RS }); } }
  return finish({ L, W, deck: DECK, sections, sect, nstr: NSTR, deckAt, rail, sailFoot: SF, mast: [0, MZ], hatch, sheerAt, keelAt, harp, dress: MARK ? 'mark' : AURD ? 'aurenne' : 'gatelands', head, shields, chains, rig: MARK ? 'gaff' : AURD ? 'lateen' : 'square', lateen, star });
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
// o.dress 'aurenne' (Session 922; #306's one rig to an island, Aurenne's the lateen; #316's A, the sun-star; a tiller, #306's 3 A): the
//   cutter's own lines and carvel planking, tallowed white below the water, oiled above, the top two strakes blue under the gilt line (the
//   caravel's colours); no beast's head (o.head defaults false); one lateen on the mast raked 4° forward, its yard slung to starboard, white
//   with the sun-star (o.star, default true), its foot 2.2 m or more over the deck; and the cutter's bowsprit kept, with one jib on it to the
//   masthead, bellied to port and wholly above and forward of the lateen's yard (o.jib, default true; a lateen with headsails on a bowsprit
//   is the polacre's and the mistico's rig). No boom: lateen and jib are loose-footed. aurenneCutter(o, r) is this.
//   -> as markCutter, with boom null, rig 'lateen', lateen ({ tack, peak, clew, side, top, sling }), jib ({ head, tack, clew } or null), star.
let ACM = null;
function aurCutterMats(star) { if (ACM && ACM.star === star) return ACM.M; const C = caravelMats(star);
  ACM = { star, M: { ...C, tar: C.hull, bottom: C.tallow, jib: new THREE.MeshStandardMaterial({ map: caravelSail(false), roughness: .9, side: THREE.DoubleSide }), iron: new THREE.MeshStandardMaterial({ color: 0x2c2a28, roughness: .5, metalness: .6 }) } }; return ACM.M; }
export function aurenneCutter(o = {}, r = stream('aurcutter')) { return markCutter({ ...o, dress: 'aurenne' }, r); }
// o.dress 'gatelands' (Session 923; #306's one rig to an island, the Gatelands' the square sail; the harp, #306's 2 A; a tiller, 3 A): the
//   cutter's own lines and carvel planking in the sloop's colours (tarred below the water, oiled oak above, the top two strakes green, the
//   sloop's sheer strake at this hull's lower freeboard, under a cream line; the transom oak); no head; one square course on a yard 8.4 m over the deck, green with the harp (o.harp, default true), its
//   foot 2.2 m over the deck, as the sloop's; and the bowsprit kept with one plain green jib (o.jib, default true) on a stay from the
//   masthead, wholly forward of the course. The cutter's topmast stays, bare: a topsail on it would meet the forestay. No boom.
//   gatelandsCutter(o, r) is this.
//   -> as markCutter, with boom null, rig 'square', yard ({ y, half }), jib, harp.
let GCM = null;
function glCutterMats(harp) { if (GCM && GCM.harp === harp) return GCM.M; const C = mats(harp);
  GCM = { harp, M: { ...C, bottom: C.tar, gilt: C.cream, jib: new THREE.MeshStandardMaterial({ map: sailTex(false), roughness: .9, side: THREE.DoubleSide }) } }; return GCM.M; }
export function gatelandsCutter(o = {}, r = stream('glcutter')) { return markCutter({ ...o, dress: 'gatelands' }, r); }
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
  const AURD = o.dress === 'aurenne', GLD = o.dress === 'gatelands', star = AURD && o.star !== false, harp = GLD && o.harp !== false, stripe = !AURD && !GLD && !!o.stripe, head = AURD || GLD ? !!o.head : o.head !== false,
    M = AURD ? aurCutterMats(star) : GLD ? glCutterMats(harp) : cutterMats(stripe), { put, rod, finish } = kit(M);
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
    const key = sect(0, (u0 + u1) / 2)[1] < .02 ? 'bottom' : AURD && s >= NSTR - 2 ? 'blue' : GLD ? (s >= NSTR - 2 ? 'green' : 'oak') : 'tar';
    for (const side of [1, -1]) { const mir = rows => rows.map(row => row.map(([x, y, z]) => [x * side, y, z])); put(ribbon(mir(outer), side > 0), key, 0, 0, 0, 0, 0, 0, null); put(ribbon(mir(inner), side < 0), key, 0, 0, 0, 0, 0, 0, null); } }
  // the transom: the stern's section closed by a flat board, black, the gilt line across its head
  { const pts = []; for (let k = 0; k <= 30; k++) { const [x, y] = sect(ZT, k / 30); pts.push(new THREE.Vector2(x + TH / 2, y)); } for (let k = 30; k >= 0; k--) { const [x, y] = sect(ZT, k / 30); pts.push(new THREE.Vector2(-x - TH / 2, y)); }
    const g = new THREE.ExtrudeGeometry(new THREE.Shape(pts), { depth: .06, bevelEnabled: false }); put(g, GLD ? 'oak' : 'tar', 0, 0, ZT - .06, 0, 0, 0, .6); put(new THREE.BoxGeometry(2 * sect(ZT, 1)[0] + .08, .06, .03), 'gilt', 0, sheerAt(ZT) - .14, ZT - .07); }
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
  // Aurenne's dress: the lateen on a mast raked forward, the yard slung to starboard, and the jib on the bowsprit above and forward of it
  let lateen = null, jib = null, yard = null, MH = 10.8, BY = DECK + 2.15, BZ1 = zs - .7;
  if (AURD) { const RAKE = 4 * Math.PI / 180, sy = 7.0, ang = 50 * Math.PI / 180, fw = 4.5, af = 7.6, side = 1, xs = .3, top = DECK + sy + .8, kb = keelAt(MZ) + .1, mast = y => MZ + (y - kb) * Math.tan(RAKE);
    const Sg = [xs, DECK + sy, mast(DECK + sy)], T = [xs, Sg[1] - fw * Math.sin(ang), Sg[2] + fw * Math.cos(ang)], P = [xs, Sg[1] + af * Math.sin(ang), Sg[2] - af * Math.cos(ang)], Cl = [xs, DECK + 2.5, -4.6];
    rod([0, kb, MZ], [0, top, mast(top)], .17, .11, 'spar'); rod(T, P, .09, .055, 'spar'); put(lateenSail([T[0], T[1] - .05, T[2] - .15], [P[0], P[1] - .15, P[2] + .2], Cl, side, .55), 'sail', 0, 0, 0, 0, 0, 0, null);
    rod([xs * .5, top - .1, mast(top)], Sg, .016, .016, 'rope') /* the halyard to the sling */; rod(T, [0, DECK + .05, T[2] + .3], .014, .014, 'rope') /* the tack to the deck */;
    rod(Cl, [side * (sect(-6.0, 1)[0] - .08), Math.max(DECK + 1.0, sheerAt(-6.0) + .12), -6.0], .012, .012, 'rope') /* the sheet, led aft of the deck's walk */;
    for (const dz of [-.8, 0, .8]) { const z = MZ + dz - .3; rod([0, top - .3, mast(top - .3)], [-side * (sect(z, 1)[0] + .05), sheerAt(z) - .05, z], .012, .012, 'rope'); } /* the shrouds on the weather side only */
    rod([0, top - .2, mast(top - .2)], [0, sheerAt(zb) + .35, zb], .014, .014, 'rope') /* the forestay */;
    if (o.jib !== false) { const JH = [0, top - .4, mast(top - .4) + .05], JT = [0, SP[1] - .05, SP[2] - .25], JC = [0, DECK + 2.8, zb - 1.0];
      put(quadSail(JT, JC, JC, JH, -.32, 8, 8), 'jib', 0, 0, 0, 0, 0, 0, null); rod([0, top - .3, mast(top - .3)], SP, .014, .014, 'rope') /* the jib's stay */;
      rod(JC, [-(sect(zb - 2.6, 1)[0] - .06), Math.max(DECK + 1.0, sheerAt(zb - 2.6) + .12), zb - 2.6], .01, .01, 'rope') /* its sheet to the port rail */; jib = { head: JH.map(v => +v.toFixed(2)), tack: JT.map(v => +v.toFixed(2)), clew: JC.map(v => +v.toFixed(2)) }; }
    lateen = { tack: T.map(v => +v.toFixed(2)), peak: P.map(v => +v.toFixed(2)), clew: Cl, side, top: +top.toFixed(2), sling: Sg.map(v => +v.toFixed(2)), ang: 50, fw, af }; }
  else if (GLD) { /* the Gatelands' square course, the sloop's at the cutter's size, and the jib forward of it */ const YY = DECK + 8.4, YL = 7.0, SF = DECK + 2.2, MT = DECK + MH;
    rod([0, keelAt(MZ) + .1, MZ], [0, MT, MZ], .17, .11, 'spar'); rod([0, MT - .8, MZ], [0, MT + 2.2, MZ], .08, .06, 'spar'); rod([-YL / 2, YY, MZ + .15], [YL / 2, YY, MZ + .15], .075, .07, 'spar');
    { const g = new THREE.PlaneGeometry(YL - .3, YY - SF - .1, 14, 12), Pp = g.attributes.position; for (let k = 0; k < Pp.count; k++) { const x = Pp.getX(k) / (YL / 2), y = Pp.getY(k) / ((YY - SF) / 2); Pp.setZ(k, .55 * (1 - x * x) * (1 - .6 * y * y) + .1 * (1 - y) / 2); }
      g.computeVertexNormals(); put(g, 'sail', 0, (YY + SF) / 2 - .05, MZ + .23, 0, 0, 0, null); }
    for (const e of [1, -1]) for (const dz of [-.7, 0, .7]) { const z = MZ + dz - .3; rod([0, MT - .3, MZ], [e * (sect(z, 1)[0] + .05), sheerAt(z) - .05, z], .012, .012, 'rope'); }
    rod([0, MT, MZ], [0, sheerAt(zb) + .35, zb], .014, .014, 'rope') /* the forestay */; for (const e of [1, -1]) rod([0, MT, MZ], [e * (sect(zs + 1.5, 1)[0] - .05), sheerAt(zs + 1.5), zs + 1.5], .012, .012, 'rope') /* the backstays */;
    for (const e of [1, -1]) { rod([e * YL / 2, YY, MZ + .15], [e * (sect(zs + 1.6, 1)[0] - .05), sheerAt(zs + 1.6) + .1, zs + 1.6], .01, .01, 'rope') /* the braces */; rod([e * (YL / 2 - .3), SF, MZ + .3], [e * (sect(MZ - 2.2, 1)[0] - .06), DECK + 1.0, MZ - 2.2], .01, .01, 'rope') /* the sheets */; }
    rod([0, MT, MZ], SP, .014, .014, 'rope') /* the jib's stay */;
    if (o.jib !== false) { const st = t => [0, MT + (SP[1] - MT) * t, MZ + (SP[2] - MZ) * t], JH = st(.15), JT = [0, SP[1] - .05, SP[2] - .25], JC = [0, DECK + 2.6, zb - .4];
      put(quadSail(JT, JC, JC, JH, -.32, 8, 8), 'jib', 0, 0, 0, 0, 0, 0, null); rod(JC, [-(sect(zb - 2.6, 1)[0] - .06), Math.max(DECK + 1.0, sheerAt(zb - 2.6) + .12), zb - 2.6], .01, .01, 'rope') /* its sheet to the port rail */;
      jib = { head: JH.map(v => +v.toFixed(2)), tack: JT.map(v => +v.toFixed(2)), clew: JC.map(v => +v.toFixed(2)) }; }
    yard = { y: YY, half: YL / 2, foot: SF, z: MZ + .23 }; }
  else {
  // the mast stepped well forward, its topmast; the boom at 2.15 over the deck to past the transom; the gaff peaked up at 30°
  const GT = DECK + 8.4, GL = 6.0, GA = 30 * Math.PI / 180, PK = [0, GT + GL * Math.sin(GA), MZ - GL * Math.cos(GA)];
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
  rod([0, BY, BZ1 + .4], [0, sheerAt(ZT) + .05, ZT + .2], .012, .012, 'rope') /* the mainsheet */; }
  // the rudder hung on the transom, outboard, and its tiller in over the stern
  { const ry0 = keelAt(zs) - .05, ry1 = sheerAt(ZT) + .1; put(new THREE.BoxGeometry(.1, ry1 - ry0, .7), 'tar', 0, (ry0 + ry1) / 2, ZT - .45); rod([0, ry1, ZT - .2], [0, DECK + .95, ZT + 1.9], .045, .035, 'oak'); }
  put(new THREE.TorusGeometry(.22, .05, 6, 18).rotateX(Math.PI / 2), 'rope', .4, DECK + .05, MZ - .6); put(new THREE.CylinderGeometry(.16, .13, .3, 12), 'oak', -.45, DECK + .15, MZ - .75);
  return finish({ L, W, deck: DECK, sections, sect, nstr: NSTR, deckAt, rail, sailFoot: AURD ? Math.min(lateen.tack[1], lateen.clew[1]) : GLD ? yard.foot : BY, boom: AURD || GLD ? null : { y: BY, z0: MZ - .2, z1: BZ1 }, mast: [0, MZ], hatch, sheerAt, keelAt, stem, transom: ZT, carvel: true, head, stripe,
    dress: AURD ? 'aurenne' : GLD ? 'gatelands' : 'mark', rig: AURD ? 'lateen' : GLD ? 'square' : 'gaff', lateen, jib, star, harp, yard });
}

// aurenneCaravel(o, r) (Session 886, card F11; Michael's A on #306 keeps one rig to name each island, and Aurenne's is the game's caravel,
//   his A on #202): the game's caravel (85-world-sea.js: L 17.5, W 5.0, draft 1.3, three lateen masts raked forward and the main tallest, a
//   square stern under a high sterncastle, no forecastle) dressed as Aurenne's of OG-004 ("white and blue sails with a gold sun-star,
//   painted hulls"): carvel-planked, tallowed white below the water, oiled wood above, the two top strakes in Aurenne's blue under a gilt
//   wale; the stem curved and raked; the deck at 1.0 over the sea, a rail at 1.0 m over it. The sterncastle is a real deck this time, not
//   the game's rails on a flat deck: 2.15 m over the main deck over the last 4.6 m, a cabin under it entered by a door in its forward
//   bulkhead, a companion ladder up either side of the door, a rail round its top. Each lateen yard is slung on the lee side of its mast,
//   the fore and the mizzen to port and the main to starboard, so no yard or sail crosses another mast, and the shrouds stand only on the
//   weather side, as on a lateen ship. The feet of the sails are 2.2 m or more over the deck they hang over.
//   o.star (default true): the gold sun-star on each sail (OG-004; like the harp, it is not in the canon). o.tiller: steered by a tiller
//   on the castle deck instead of a wheel (#306 3 A gives the wheel from the cog up, and the caravel is the cog's size).
//   -> as markCutter, with castle ({ z0, z1, y, door: { x0, x1, y1 }, ladders: [x...] }), lateens ([{ mast: [x, z], top, tack, peak, clew,
//      side }]), wheel (bool), and no boom.
let AM = null;
function caravelSail(star) { const c = document.createElement('canvas'); c.width = c.height = 512; const x = c.getContext('2d');
  x.fillStyle = '#ece5d2'; x.fillRect(0, 0, 512, 512); x.fillStyle = 'rgba(80,60,30,.09)'; for (let i = 0; i < 512; i += 48) x.fillRect(i, 0, 3, 512); /* the cloths' seams */
  if (star) { /* the sun-star: a disc with sixteen rays, long and short by turns, in gold */ x.fillStyle = '#c9982e'; x.beginPath();
    for (let k = 0; k < 32; k++) { const a = k * Math.PI / 16 - Math.PI / 2, rr = k % 2 ? 62 : (k / 2) % 2 ? 128 : 172; x.lineTo(256 + rr * Math.cos(a), 256 + rr * Math.sin(a)); } x.closePath(); x.fill();
    x.fillStyle = '#e2b84a'; x.beginPath(); x.arc(256, 256, 70, 0, Math.PI * 2); x.fill(); x.strokeStyle = '#a87a22'; x.lineWidth = 6; x.beginPath(); x.arc(256, 256, 54, 0, Math.PI * 2); x.stroke(); }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping; return t; }
function caravelMats(star) {
  if (AM && AM.star === star) return AM.M;
  const M = { tallow: mat('wood', { ns: .4, color: 0xd6ccb4, rough: .7 }), hull: mat('wood', { ns: .8, color: 0xb08458, rough: .6 }), blue: new THREE.MeshStandardMaterial({ color: 0x2b4a80, roughness: .72 }), paint: new THREE.MeshStandardMaterial({ color: 0xe6dcc4, roughness: .8 }),
    gilt: new THREE.MeshStandardMaterial({ color: 0xc8a850, roughness: .35, metalness: .7 }), deck: mat('wood', { ns: .9, color: 0xb8a07a, rough: .85 }), oak: mat('wood', { ns: 1.0, color: 0x9a7650, rough: .7 }),
    spar: mat('wood', { ns: .8, color: 0x6a4a2e, rough: .7 }), dark: new THREE.MeshStandardMaterial({ color: 0x14100c, roughness: 1 }), rope: new THREE.MeshStandardMaterial({ color: 0x3a3024, roughness: .95 }),
    lamp: new THREE.MeshStandardMaterial({ color: 0xffd890, emissive: 0xffb050, emissiveIntensity: .8, roughness: .4 }),
    sail: new THREE.MeshStandardMaterial({ map: caravelSail(star), roughness: .9, side: THREE.DoubleSide }) };
  AM = { star, M }; return M;
}
// a lateen sail: the triangle tack-peak-clew, bellied out to `side` (+1 starboard, -1 port) most at its middle; its UVs are the sail's
// own plane (z, y) about its incentre, so the sun-star sits whole in the middle of every sail at one size to the sail
function lateenSail(T, P, C, side, belly, n = 14) { const P3 = [], U = [], v = q => new THREE.Vector3(...q), A = v(T), B = v(P), Cc = v(C);
  const a = B.distanceTo(Cc), b = A.distanceTo(Cc), c = A.distanceTo(B), s = a + b + c, I = A.clone().multiplyScalar(a / s).add(B.clone().multiplyScalar(b / s)).add(Cc.clone().multiplyScalar(c / s)), rin = Math.sqrt((s / 2 - a) * (s / 2 - b) * (s / 2 - c) / (s / 2)), S = rin * 2.3;
  const at = (i, j) => { const k = n - i - j, p = A.clone().multiplyScalar(i / n).add(B.clone().multiplyScalar(j / n)).add(Cc.clone().multiplyScalar(k / n)); p.x += side * belly * 6.75 * (i / n) * (j / n) * (k / n) * 4; return p; };
  const tri = (q) => { for (const [i, j] of q) { const p = at(i, j); P3.push(p.x, p.y, p.z); U.push((p.z - I.z) / S * side + .5, (p.y - I.y) / S + .5); } };
  for (let i = 0; i < n; i++) for (let j = 0; i + j < n; j++) { tri([[i, j], [i + 1, j], [i, j + 1]]); if (i + j + 1 < n) tri([[i + 1, j], [i + 1, j + 1], [i, j + 1]]); }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(P3, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(U, 2)); g.computeVertexNormals(); return g; }
export function aurenneCaravel(o = {}, r = stream('caravel')) {
  const star = o.star !== false, wheel = !o.tiller, M = caravelMats(star), { put, rod, finish } = kit(M);
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
  const sections = []; for (let i = 0; i <= NS; i++) { const z = zAt(i), pts = []; for (let k = 0; k <= 30; k++) pts.push(sect(z, k / 30).map(v => +v.toFixed(3))); sections.push({ z: +z.toFixed(3), pts }); }
  const norm = (z, u) => { const a = sect(z, Math.max(0, u - .01)), b = sect(z, Math.min(1, u + .01)), dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy) || 1; return [dy / l, -dx / l]; };
  // carvel: the strakes flush; tallow white below the waterline, oiled wood above, the top two strakes blue
  const KR = 4; for (let s = 0; s < NSTR; s++) { const u0 = s / NSTR, u1 = (s + 1) / NSTR, outer = [], inner = [];
    for (let i = 0; i <= NS; i++) { const z = zAt(i), ro = [], ri = []; for (let k = 0; k <= KR; k++) { const u = u0 + (u1 - u0) * k / KR, p = sect(z, u), n = norm(z, u); ro.push([p[0] + n[0] * TH / 2, p[1] + n[1] * TH / 2, zr(z, u)]); ri.push([p[0] - n[0] * TH / 2, p[1] - n[1] * TH / 2, zr(z, u)]); } outer.push(ro); inner.push(ri); }
    const key = s >= NSTR - 2 ? 'blue' : sect(0, (u0 + u1) / 2)[1] < .02 ? 'tallow' : 'hull';
    for (const side of [1, -1]) { const mir = rows => rows.map(row => row.map(([x, y, z]) => [x * side, y, z])); put(ribbon(mir(outer), side > 0), key, 0, 0, 0, 0, 0, 0, null); put(ribbon(mir(inner), side < 0), key, 0, 0, 0, 0, 0, 0, null); } }
  // the transom: the stern's section closed by a flat board, blue over the tallow line, the gilt wale across it
  { const pts = []; for (let k = 0; k <= 30; k++) { const [x, y] = sect(ZT, k / 30); pts.push(new THREE.Vector2(x + TH / 2, y)); } for (let k = 30; k >= 0; k--) { const [x, y] = sect(ZT, k / 30); pts.push(new THREE.Vector2(-x - TH / 2, y)); }
    put(new THREE.ExtrudeGeometry(new THREE.Shape(pts), { depth: .06, bevelEnabled: false }), 'hull', 0, 0, ZT - .06, 0, 0, 0, .6);
    const yb = sect(ZT, (NSTR - 2) / NSTR)[1]; put(new THREE.BoxGeometry(2 * sect(ZT, 1)[0] + .08, sheerAt(ZT) - yb, .03), 'blue', 0, (yb + sheerAt(ZT)) / 2, ZT - .075); }
  // the keel along the bottom, and the stem following the strakes' curve up to its head 0.4 m over the sheer
  const stem = []; { const pts = []; for (let i = 0; i <= NS; i++) { const z = zAt(i); pts.push([zr(z, 0), keelAt(z) - .06]); }
    for (let k = 1; k <= 12; k++) { const u = k / 12, z = zr(zb - .05, u) + .06 * u; pts.push([z + .04, sect(zb - .05, u)[1] + (k === 12 ? .4 : 0)]); }
    for (let i = 0; i + 1 < pts.length; i++) { const [z0, y0] = pts[i], [z1, y1] = pts[i + 1]; put(new THREE.BoxGeometry(.18, .22, Math.hypot(z1 - z0, y1 - y0) + .03), 'hull', 0, (y0 + y1) / 2, (z0 + z1) / 2, -Math.atan2(y1 - y0, z1 - z0)); }
    for (const [z, y] of pts.slice(NS + 1)) stem.push([+y.toFixed(2), +z.toFixed(2)]); }
  // the bowsprit, 2.6 m, steeved up
  const SH = [0, sheerAt(zb) + .3, zb - .1], SP = [0, SH[1] + 2.6 * Math.sin(.22), SH[2] + 2.6 * Math.cos(.22)]; rod([0, sheerAt(zb) - .1, zb - 1.4], SP, .1, .06, 'spar');
  // the main deck at DECK, fore-and-aft planks cut to the hull's half-breadth, a covering board out to the planking
  const deckAt = z => { let lo = 0, hi = 1; for (let k = 0; k < 30; k++) { const m = (lo + hi) / 2; if (sect(z, m)[1] < DECK) lo = m; else hi = m; } return sect(z, lo)[0] - TH * .6; };
  { const PW = .15; for (let x = -W / 2 + PW / 2; x < W / 2; x += PW) { const zz = []; for (let i = 0; i <= NS; i++) { const z = zAt(i); if (deckAt(z) >= Math.abs(x) + PW / 2) zz.push(z); } if (zz.length < 2) continue;
      const z0 = zz[0] - (zz[0] < ZT + .1 ? .06 : 0), z1 = zz[zz.length - 1]; put(new THREE.BoxGeometry(PW, .05, z1 - z0), 'deck', x, DECK - .025, (z0 + z1) / 2, 0, 0, 0, .35); }
    for (const e of [1, -1]) { const rows = []; for (let i = 0; i <= NS; i++) { const z = zAt(i), d = deckAt(z); rows.push([[e * Math.max(0, d - .3), DECK + .002, z], [e * (d + TH * .5), DECK + .002, z]]); } put(ribbon(rows, e < 0), 'oak', 0, 0, 0, 0, 0, 0, null); } }
  // the gilt wale along the top of the tallow-and-wood, under the blue
  for (let i = 0; i + 1 <= NS; i += 2) { const za = zAt(i), zc = zAt(Math.min(NS, i + 2)), u = (NSTR - 2) / NSTR; for (const e of [1, -1]) rod([e * (sect(za, u)[0] + .03), sect(za, u)[1], zr(za, u)], [e * (sect(zc, u)[0] + .03), sect(zc, u)[1], zr(zc, u)], .045, .045, 'gilt'); }
  // the sterncastle: its deck CY over the last 4.6 m, walled up from the sheer in blue boards with gilt panels; the bulkhead across its
  // forward end with a door and two windows; a companion ladder up either side; a rail round its top at 1.0 m
  const ZC = ZT + 4.6, CY = DECK + 2.15, cw = z => sect(z, 1)[0], door = { x0: -.5, x1: .5, y1: DECK + 1.95 }, ladders = [-1.55, 1.55];
  { const n = 16; for (const e of [1, -1]) { const rows = []; for (let i = 0; i <= n; i++) { const z = ZT + (ZC - ZT) * i / n; rows.push([[e * cw(z), sheerAt(z) - .1, z], [e * cw(z), CY + .25, z]]); }
      put(ribbon(rows, e > 0), 'blue', 0, 0, 0, 0, 0, 0, null); put(ribbon(rows.map(row => row.map(([x, y, z]) => [x - e * .05, y, z])), e < 0), 'blue', 0, 0, 0, 0, 0, 0, null);
      for (let i = 0; i < 5; i++) { const z = ZT + .5 + i * .85, y = (sheerAt(z) + CY + .25) / 2; put(new THREE.BoxGeometry(.03, Math.max(.2, CY - .05 - sheerAt(z)), .5), 'paint', e * (cw(z) + .015), y - .05, z); }
      for (let i = 0; i < 8; i++) { const za = ZT + (ZC - ZT) * i / 8, zc = ZT + (ZC - ZT) * (i + 1) / 8; rod([e * (cw(za) + .02), CY + .2, za], [e * (cw(zc) + .02), CY + .2, zc], .035, .035, 'gilt'); } }
    /* the castle's after wall, from the transom's head up to its rail's foot */ put(new THREE.BoxGeometry(2 * cw(ZT) + .06, CY + .25 - sheerAt(ZT) + .1, .06), 'blue', 0, (sheerAt(ZT) - .1 + CY + .25) / 2, ZT - .03);
    /* the castle's deck */ const PW = .15; for (let x = -W / 2 + PW / 2; x < W / 2; x += PW) { let z0 = null; for (let i = 0; i <= 40; i++) { const z = ZT + (ZC - ZT) * i / 40; if (cw(z) - .05 >= Math.abs(x) + PW / 2) { z0 = z; break; } } if (z0 === null) continue;
      put(new THREE.BoxGeometry(PW, .06, ZC + .05 - z0), 'deck', x, CY - .03, (z0 + ZC + .05) / 2, 0, 0, 0, .35); }
    /* the bulkhead: boards either side of the door, a lintel over it, a beam under the castle's edge */ const w = Math.min(cw(ZC), deckAt(ZC) + .05);
    for (const e of [1, -1]) put(new THREE.BoxGeometry(w - door.x1, CY - DECK, .08), 'oak', e * (door.x1 + (w - door.x1) / 2), (DECK + CY) / 2, ZC); put(new THREE.BoxGeometry(door.x1 - door.x0, CY - door.y1, .08), 'oak', 0, (door.y1 + CY) / 2, ZC);
    put(new THREE.BoxGeometry(2 * w + .1, .14, .16), 'blue', 0, CY - .07, ZC + .04);
    for (const e of [1, -1]) { put(new THREE.BoxGeometry(.5, .4, .02), 'dark', e * 1.05, DECK + 1.45, ZC + .05); put(new THREE.BoxGeometry(.6, .06, .06), 'gilt', e * 1.05, DECK + 1.68, ZC + .06); }
    put(new THREE.BoxGeometry(door.x1 - door.x0 + .16, .1, .1), 'gilt', 0, door.y1 + .05, ZC + .06);
    /* the companion ladders: two stringers and seven treads each, from the deck 1.25 m forward up to the castle's edge */
    for (const lx of ladders) { for (const e of [-1, 1]) rod([lx + e * .28, DECK, ZC + 1.25], [lx + e * .28, CY + .05, ZC + .02], .035, .035, 'oak'); for (let k = 1; k <= 7; k++) { const f = k / 8; put(new THREE.BoxGeometry(.56, .04, .2), 'oak', lx, DECK + (CY - DECK) * f, ZC + 1.25 * (1 - f)); } }
    /* the castle's rail: stanchions and a cap rail at 1.0 m along both sides and across the stern; across its forward edge, broken
       at the ladders' heads */ const top = CY + 1.0;
    for (const e of [1, -1]) { for (let i = 0; i <= 5; i++) { const z = ZT + .15 + (ZC - ZT - .2) * i / 5; put(new THREE.BoxGeometry(.08, top - CY - .25, .08), 'oak', e * (cw(z) - .04), (top + CY + .25) / 2, z); }
      for (let i = 0; i < 5; i++) { const za = ZT + .15 + (ZC - ZT - .2) * i / 5, zc = ZT + .15 + (ZC - ZT - .2) * (i + 1) / 5; rod([e * (cw(za) - .04), top, za], [e * (cw(zc) - .04), top, zc], .045, .045, 'oak'); } }
    { const a = cw(ZT + .15) - .04; rod([-a, top, ZT + .15], [a, top, ZT + .15], .045, .045, 'oak'); for (let x = -a; x <= a + .01; x += a / 3) put(new THREE.BoxGeometry(.08, top - CY - .25, .08), 'oak', x, (top + CY + .25) / 2, ZT + .15); }
    { const a = cw(ZC) - .04, gaps = ladders.map(lx => [lx - .36, lx + .36]), segs = [[-a, gaps[0][0]], [gaps[0][1], gaps[1][0]], [gaps[1][1], a]];
      for (const [x0, x1] of segs) { rod([x0, top, ZC - .05], [x1, top, ZC - .05], .045, .045, 'oak'); for (const x of [x0, x1]) put(new THREE.BoxGeometry(.08, top - CY, .08), 'oak', x, (top + CY) / 2, ZC - .05); } } }
  // the main deck's rail, from the castle's bulkhead forward: stanchions every 0.9 m, a cap rail at 1.0 m over the deck or 0.12 over the sheer
  const rail = []; { const n = Math.round(L / .9); const top = z => Math.max(DECK + 1.0, sheerAt(z) + .12), inset = z => sect(z, 1)[0] - .06, ok = z => z > ZC + .3 && inset(z) >= .25;
    for (let k = 1; k < n; k++) { const z = zs + L * k / n; if (!ok(z)) continue; for (const e of [1, -1]) put(new THREE.BoxGeometry(.08, top(z) - DECK, .08), 'oak', e * Math.min(inset(z), deckAt(z) - .05), (top(z) + DECK) / 2, z); rail.push([+z.toFixed(2), +top(z).toFixed(3)]); }
    for (let k = 1; k + 1 < n; k++) { const za = zs + L * k / n, zc = zs + L * (k + 1) / n; if (!ok(za) || !ok(zc)) continue;
      for (const e of [1, -1]) rod([e * Math.min(inset(za), deckAt(za) - .05), top(za), za], [e * Math.min(inset(zc), deckAt(zc) - .05), top(zc), zc], .045, .045, 'oak'); } }
  // the hatch between the main mast and the fore, its coaming 0.3 m
  const hatch = { x0: -.6, x1: .6, z0: 2.2, z1: 3.4 };
  { const hz = (hatch.z0 + hatch.z1) / 2, hw = hatch.x1 - hatch.x0 + .12, hd = hatch.z1 - hatch.z0 + .12; for (const e of [-1, 1]) { put(new THREE.BoxGeometry(hw, .3, .08), 'oak', 0, DECK + .15, hz + e * hd / 2); put(new THREE.BoxGeometry(.08, .3, hd), 'oak', e * hw / 2, DECK + .15, hz); }
    put(new THREE.BoxGeometry(hw - .1, .02, hd - .1), 'dark', 0, DECK + .02, hz); }
  // the three lateens. Each mast raked forward 4°; its yard slung on the lee side at 52° to 50°, a third of its length forward of the
  // mast; the sail hangs from the yard to a tack under its lower end and a clew aft, the foot 2.2 m or more over its deck.
  // [mast z, the deck it stands on, the sling's height over that deck, the yard's angle, its length forward and aft of the sling, the clew's z, side]
  const RAKE = 4 * Math.PI / 180, lateens = [];
  for (const [mz, dy, sy, ang, fw, af, cz, side] of [[5.0, DECK, 6.4, 50, 5.1, 6.8, 1.6, -1], [.8, DECK, 8.6, 52, 7.6, 10.0, -3.6, 1], [-7.2, CY, 5.4, 50, 4.1, 5.4, -9.5, -1]]) {
    const top = dy + sy + .8, xs = side * .3, mast = z => [0, mz + (z - (keelAt(mz) + .1)) * Math.tan(RAKE)];
    const S = [xs, dy + sy, mast(dy + sy)[1]], A = ang * Math.PI / 180, T = [xs, S[1] - fw * Math.sin(A), S[2] + fw * Math.cos(A)], P = [xs, S[1] + af * Math.sin(A), S[2] - af * Math.cos(A)], C = [xs, dy + 2.5, cz];
    rod([0, keelAt(mz) + .1, mz], [0, top, mast(top)[1]], mz > 0 && sy > 7 ? .18 : .15, .1, 'spar'); rod(T, P, .09, .06, 'spar');
    put(lateenSail([T[0], T[1] - .05, T[2] - .15], [P[0], P[1] - .15, P[2] + .2], C, side, .5), 'sail', 0, 0, 0, 0, 0, 0, null);
    /* the tack lashed down to the deck (or the stem head) under the yard's lower end, the sheet from the clew to the rail */
    const tz = Math.min(T[2], zb - .2, dy > DECK ? ZC - .1 : 99), sz = Math.max(cz, ZT + .1); rod(T, [0, tz > zb - 1 ? sheerAt(zb) + .3 : dy + .05, tz], .014, .014, 'rope');
    rod(C, [side * ((sz < ZC ? cw(sz) : sect(sz, 1)[0]) - .08), sz < ZC ? CY + 1.0 : Math.max(dy + 1.0, sheerAt(sz) + .12), sz], .012, .012, 'rope');
    /* the halyard down the mast, and the shrouds on the weather side only */ rod([xs * .5, top - .1, mast(top)[1]], [0, dy + .4, mz - .3], .012, .012, 'rope');
    for (const dz of [-.8, 0, .8]) { const z = Math.max(ZT + .3, mz + dz - .3); rod([0, top - .3, mast(top - .3)[1]], [-side * (sect(z, 1)[0] + .05), z < ZC ? CY + .2 : sheerAt(z) - .05, z], .012, .012, 'rope'); }
    lateens.push({ mast: [0, mz], top: +top.toFixed(2), topZ: +mast(top)[1].toFixed(2), tack: T.map(v => +v.toFixed(2)), peak: P.map(v => +v.toFixed(2)), clew: C.map(v => +v.toFixed(2)), side, deck: dy }); }
  // the forestay from the main's head to the bowsprit
  rod([0, lateens[1].top - .2, lateens[1].topZ - .2 * Math.tan(RAKE)], SP, .014, .014, 'rope');
  // the rudder hung on the transom, its head through the castle's deck; the wheel on the castle's deck (or a tiller)
  { const ry0 = keelAt(zs) - .05, ry1 = CY + .35; put(new THREE.BoxGeometry(.12, sheerAt(ZT) - ry0, .7), 'hull', 0, (ry0 + sheerAt(ZT)) / 2, ZT - .45); rod([0, sheerAt(ZT) - .2, ZT - .2], [0, ry1, ZT - .2], .08, .08, 'oak');
    if (wheel) { const wz = ZC - 1.0, wy = CY + 1.15; put(new THREE.TorusGeometry(.62, .035, 6, 24), 'oak', 0, wy, wz); for (let k = 0; k < 8; k++) { const a = k * Math.PI / 4; rod([0, wy, wz], [.78 * Math.cos(a), wy + .78 * Math.sin(a), wz], .022, .018, 'oak'); }
      put(new THREE.CylinderGeometry(.07, .07, .3, 8).rotateZ(Math.PI / 2).rotateY(Math.PI / 2), 'gilt', 0, wy, wz - .12); put(new THREE.BoxGeometry(.18, wy - CY, .18), 'oak', 0, (wy + CY) / 2 - .05, wz - .3); }
    else rod([0, ry1 - .05, ZT - .2], [0, CY + .95, ZT + 1.9], .05, .04, 'oak'); }
  // two stern lanterns on the castle's after corners
  for (const e of [1, -1]) { const x = e * (cw(ZT + .15) - .15), y = CY + 1.25; rod([x, CY + 1.0, ZT + .15], [x, y, ZT + .15], .03, .03, 'gilt'); put(new THREE.CylinderGeometry(.13, .1, .32, 8), 'lamp', x, y + .16, ZT + .15); put(new THREE.ConeGeometry(.16, .16, 8), 'gilt', x, y + .4, ZT + .15); }
  put(new THREE.TorusGeometry(.22, .05, 6, 18).rotateX(Math.PI / 2), 'rope', .45, DECK + .05, .2); put(new THREE.CylinderGeometry(.16, .13, .3, 12), 'oak', -.5, DECK + .15, -.1);
  return finish({ L, W, deck: DECK, sections, sect, nstr: NSTR, deckAt, rail, mast: [0, .8], hatch, sheerAt, keelAt, stem, transom: ZT, carvel: true, star, wheel,
    castle: { z0: ZT, z1: ZC, y: CY, door, ladders }, lateens });
}

// gatelandsCog(o, r) (Session 892, card F11; Michael's 3 A on DECISION #192/#306's ladder keeps the game's five classes, each dressed by
//   its island, and OG-004 draws the Gatelands' "merchant cog"): the game's cog (85-world-sea.js: L 17, W 5.6, draft 1.25, the sheer
//   0.55 over the deck amidships rising 0.85 to the bow and 0.9 to the stern, a straight raked stem and sternpost, one tall mast with one
//   great square sail, castles at both ends) in the Gatelands' dress, the sloop's (Session 858): clinker, tarred below the water, oiled
//   oak above, the sheer strake green under a cream wale; the square sail green with the harp (o.harp). Her body is a cog's: flat-floored,
//   slab-sided and full to the ends. The castles are real decks, as the caravel's (Session 890): the aftcastle 2.15 m over the deck over
//   her last 3.8 m, a cabin under it behind a bulkhead with a door, a ladder up either side, the wheel on it (#306's 3 A: the wheel from
//   the cog up); the forecastle 2.15 m over the deck over her first 3.0 m, open beneath on two posts, a ladder up the middle. Both walled
//   in green-painted boards with a rail at 1.0 m. A cargo hatch aft of the mast; barrels and crates lashed along the sides.
//   -> as gatelandsSloop, with castles: { aft: { z0, z1, y, door, ladders }, fore: { z0, z1, y, ladder, posts } }, wheel: true.
export function gatelandsCog(o = {}, r = stream('cog')) {
  const harp = o.harp !== false, M = mats(harp), { put, rod, finish } = kit(M);
  const L = 17, W = 5.6, DRAFT = 1.25, DECK = 1.0, SHEER = 1.55, BOW = .85, STERN = .9, NS = 52, NSTR = 12, TH = .04, LAP = .025;
  const zs = -L / 2, zb = L / 2;
  const sheerAt = z => SHEER + BOW * Math.max(0, z / zb) ** 2 + STERN * Math.max(0, z / zs) ** 2;
  // full to the ends: the half-breadth holds most of the beam to a quarter of her length from either post
  const beamAt = z => { const t = Math.max(-1, Math.min(1, z / (zb - .05))), e = t > 0 ? 2.6 : 2.8; return W / 2 / 1.02 /* the topsides' flare brings it back to W */ * Math.max(0, 1 - Math.abs(t) ** e) ** .45; };
  const keelAt = z => -DRAFT * (1 - .3 * Math.abs(z / zb) ** 4);
  // flat-floored and slab-sided: the turn of the bilge is quick and the sides stand nearly upright
  const sect = (z, u) => { const b = beamAt(z), k = keelAt(z), s = sheerAt(z), y = k + (s - k) * u ** 1.1; return [b * Math.sin(Math.PI / 2 * Math.min(1, u * 1.7)) ** .45 * (1 + .02 * Math.max(0, u - .8) / .2), y]; };
  const zAt = i => zs + .05 + (L - .1) * i / NS;
  const zr = (z, u) => z * (1 - (z > 0 ? .15 : .13) * (1 - u) ** 1.3 * Math.abs(z / zb) ** 5);
  const sections = []; for (let i = 0; i <= NS; i++) { const z = zAt(i), pts = []; for (let k = 0; k <= 30; k++) pts.push(sect(z, k / 30).map(v => +v.toFixed(3))); sections.push({ z: +z.toFixed(3), pts }); }
  const norm = (z, u) => { const a = sect(z, Math.max(0, u - .01)), b = sect(z, Math.min(1, u + .01)), dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy) || 1; return [dy / l, -dx / l]; };
  // the strakes, clinker-laid as the sloop's
  const KR = 6;
  for (let s = 0; s < NSTR; s++) { const u0 = s / NSTR, u1 = (s + 1) / NSTR + (s < NSTR - 1 ? .018 : 0), outer = [], inner = [];
    for (let i = 0; i <= NS; i++) { const z = zAt(i), ro = [], ri = []; for (let k = 0; k <= KR; k++) { const u = u0 + (u1 - u0) * k / KR, p = sect(z, u), n = norm(z, u), off = (LAP + TH * .3) * (1 - k / KR) * (s ? 1 : .2) + TH * .3;
        ro.push([p[0] + n[0] * off, p[1] + n[1] * off, zr(z, u)]); ri.push([p[0] + n[0] * (off - TH), p[1] + n[1] * (off - TH), zr(z, u)]); } outer.push(ro); inner.push(ri); }
    const yMid = sect(0, (u0 + u1) / 2)[1], key = s === NSTR - 1 ? 'green' : yMid < .08 ? 'tar' : 'oak';
    for (const side of [1, -1]) { const mir = rows => rows.map(row => row.map(([x, y, z]) => [x * side, y, z])); put(ribbon(mir(outer), side > 0), key, 0, 0, 0, 0, 0, 0, null); put(ribbon(mir(inner), side < 0), key, 0, 0, 0, 0, 0, 0, null);
      put(ribbon(mir(outer.map((row, i) => [row[0], inner[i][0]])), side < 0), key, 0, 0, 0, 0, 0, 0, null); } }
  // the keel; the stem and the sternpost, straight and raked, from the keel's ends to their heads over the sheer
  { const pts = []; for (let i = 0; i <= NS; i++) { const z = zAt(i); pts.push([zr(z, 0), keelAt(z) - .06]); }
    for (let i = 0; i < NS; i++) { const [z0, y0] = pts[i], [z1, y1] = pts[i + 1]; put(new THREE.BoxGeometry(.2, .22, Math.hypot(z1 - z0, y1 - y0) + .02), 'tar', 0, (y0 + y1) / 2, (z0 + z1) / 2, -Math.atan2(y1 - y0, z1 - z0)); }
    rod([0, keelAt(zb) - .12, zr(zb - .05, 0) - .05], [0, sheerAt(zb) + .4, zb + .14], .12, .1, 'oak'); rod([0, keelAt(zs) - .12, zr(zs + .05, 0) + .05], [0, sheerAt(zs) + .3, zs - .12], .13, .11, 'oak'); }
  // the bowsprit, 1.8 m
  const SP = [0, sheerAt(zb) + .3 + 1.8 * Math.sin(.25), zb + 1.8 * Math.cos(.25)]; rod([0, sheerAt(zb) - .05, zb - 1.0], SP, .1, .07, 'spar');
  // the deck
  const deckAt = z => { let lo = 0, hi = 1; for (let k = 0; k < 30; k++) { const m = (lo + hi) / 2; if (sect(z, m)[1] < DECK) lo = m; else hi = m; } return sect(z, lo)[0] - TH * .6; };
  { const PW = .18; for (let x = -W / 2 + PW / 2; x < W / 2; x += PW) { const zz = []; for (let i = 0; i <= NS; i++) { const z = zAt(i); if (deckAt(z) >= Math.abs(x) + PW / 2) zz.push(z); } if (zz.length < 2) continue;
      const z0 = zz[0], z1 = zz[zz.length - 1]; put(new THREE.BoxGeometry(PW, .05, z1 - z0), 'deck', x, DECK - .025, (z0 + z1) / 2, 0, 0, 0, .35); }
    for (const e of [1, -1]) { const rows = []; for (let i = 0; i <= NS; i++) { const z = zAt(i), d = deckAt(z); rows.push([[e * Math.max(0, d - .3), DECK + .002, z], [e * (d + TH * .5), DECK + .002, z]]); } put(ribbon(rows, e < 0), 'oak', 0, 0, 0, 0, 0, 0, null); } }
  // the cream wale along the sheer strake's top
  for (let i = 0; i + 2 <= NS; i += 2) { const za = zAt(i), zc = zAt(i + 2); for (const e of [1, -1]) rod([e * (sect(za, 1)[0] + .02), sheerAt(za) - .02, za], [e * (sect(zc, 1)[0] + .02), sheerAt(zc) - .02, zc], .045, .045, 'cream'); }
  // the castles: a deck CY over the main deck, walled up from the sheer in green boards to 0.25 over it, a rail at 1.0 m on stanchions
  const CY = DECK + 2.15, cw = z => sect(z, 1)[0], ZA = zs + 3.8, ZF = zb - 3.0;
  const castleSides = (z0, z1) => { const n = 14; for (const e of [1, -1]) { const rows = []; for (let i = 0; i <= n; i++) { const z = z0 + (z1 - z0) * i / n; rows.push([[e * cw(z), sheerAt(z) - .1, z], [e * cw(z), CY + .25, z]]); }
      put(ribbon(rows, e > 0), 'green', 0, 0, 0, 0, 0, 0, null); put(ribbon(rows.map(row => row.map(([x, y, z]) => [x - e * .05, y, z])), e < 0), 'green', 0, 0, 0, 0, 0, 0, null);
      for (let i = 0; i < n; i++) { const za = z0 + (z1 - z0) * i / n, zc = z0 + (z1 - z0) * (i + 1) / n; rod([e * (cw(za) + .02), CY + .25, za], [e * (cw(zc) + .02), CY + .25, zc], .035, .035, 'cream'); }
      const top = CY + 1.0, k = Math.max(2, Math.round((z1 - z0) / .8)); for (let i = 0; i <= k; i++) { const z = z0 + .15 + (z1 - z0 - .3) * i / k; if (cw(z) < .3) continue; put(new THREE.BoxGeometry(.08, top - CY - .25, .08), 'oak', e * (cw(z) - .04), (top + CY + .25) / 2, z); }
      for (let i = 0; i < k; i++) { const za = z0 + .15 + (z1 - z0 - .3) * i / k, zc = z0 + .15 + (z1 - z0 - .3) * (i + 1) / k; if (cw(za) < .3 || cw(zc) < .3) continue; rod([e * (cw(za) - .04), top, za], [e * (cw(zc) - .04), top, zc], .045, .045, 'oak'); } }
    const PW = .16; for (let x = -W / 2 + PW / 2; x < W / 2; x += PW) { const zz = []; for (let i = 0; i <= 60; i++) { const z = z0 + (z1 - z0) * i / 60; if (cw(z) - .05 >= Math.abs(x) + PW / 2) zz.push(z); } if (zz.length < 2) continue;
      put(new THREE.BoxGeometry(PW, .06, zz[zz.length - 1] - zz[0] + .05), 'deck', x, CY - .03, (zz[0] + zz[zz.length - 1]) / 2, 0, 0, 0, .35); } };
  castleSides(zs + .25, ZA); castleSides(ZF, zb - .2);
  // a rail across a castle's open edge at z, broken at the ladders' heads (gaps [[x0, x1]...]), and a beam under the edge
  const edgeRail = (z, gaps, dz) => { const a = cw(z) - .04, xs = [-a, ...gaps.flat(), a], top = CY + 1.0; for (let i = 0; i < xs.length; i += 2) { const [x0, x1] = [xs[i], xs[i + 1]]; rod([x0, top, z + dz], [x1, top, z + dz], .045, .045, 'oak'); for (const x of [x0, x1]) put(new THREE.BoxGeometry(.08, top - CY, .08), 'oak', x, (top + CY) / 2, z + dz); }
    put(new THREE.BoxGeometry(2 * a + .08, .12, .18), 'green', 0, CY - .06, z); /* 0.12 deep, so 2.03 m stays under it */ };
  // the aftcastle's bulkhead: boards either side of a door, a lintel; a window either side; two ladders
  const door = { x0: -.5, x1: .5, y1: DECK + 1.95 }, ladders = [-1.6, 1.6];
  { const w = Math.min(cw(ZA), deckAt(ZA) + .05); for (const e of [1, -1]) put(new THREE.BoxGeometry(w - door.x1, CY - DECK, .08), 'oak', e * (door.x1 + (w - door.x1) / 2), (DECK + CY) / 2, ZA); put(new THREE.BoxGeometry(door.x1 - door.x0, CY - door.y1, .08), 'oak', 0, (door.y1 + CY) / 2, ZA);
    for (const e of [1, -1]) put(new THREE.BoxGeometry(.5, .4, .02), 'dark', e * 1.05, DECK + 1.45, ZA + .05); put(new THREE.BoxGeometry(1.16, .1, .1), 'cream', 0, door.y1 + .05, ZA + .06);
    for (const lx of ladders) { for (const e of [-1, 1]) rod([lx + e * .28, DECK, ZA + 1.25], [lx + e * .28, CY + .05, ZA + .02], .035, .035, 'oak'); for (let k = 1; k <= 7; k++) { const f = k / 8; put(new THREE.BoxGeometry(.56, .04, .2), 'oak', lx, DECK + (CY - DECK) * f, ZA + 1.25 * (1 - f)); } }
    edgeRail(ZA, ladders.map(lx => [lx - .36, lx + .36]), -.05); }
  // the forecastle: open beneath, its edge carried on two posts; a ladder up the middle from the deck aft of it
  const posts = [-1.75, 1.75], fladder = 0;
  { for (const px of posts) put(new THREE.BoxGeometry(.16, CY - DECK - .16, .16), 'oak', px, (DECK + CY - .16) / 2, ZF + .1);
    for (const e of [-1, 1]) rod([fladder + e * .28, DECK, ZF - 1.25], [fladder + e * .28, CY + .05, ZF - .02], .035, .035, 'oak'); for (let k = 1; k <= 7; k++) { const f = k / 8; put(new THREE.BoxGeometry(.56, .04, .2), 'oak', fladder, DECK + (CY - DECK) * f, ZF - 1.25 * (1 - f)); }
    edgeRail(ZF, [[fladder - .36, fladder + .36]], .05); }
  // the waist's rail, between the castles: stanchions every 0.9 m, a cap rail at 1.0 m over the deck or 0.12 over the sheer
  const rail = []; { const n = Math.round(L / .9); const top = z => Math.max(DECK + 1.0, sheerAt(z) + .12), inset = z => sect(z, 1)[0] - .06, ok = z => z > ZA + .3 && z < ZF - .3;
    for (let k = 1; k < n; k++) { const z = zs + L * k / n; if (!ok(z)) continue; for (const e of [1, -1]) put(new THREE.BoxGeometry(.08, top(z) - DECK, .08), 'oak', e * Math.min(inset(z), deckAt(z) - .05), (top(z) + DECK) / 2, z); rail.push([+z.toFixed(2), +top(z).toFixed(3)]); }
    for (let k = 1; k + 1 < n; k++) { const za = zs + L * k / n, zc = zs + L * (k + 1) / n; if (!ok(za) || !ok(zc)) continue; for (const e of [1, -1]) rod([e * Math.min(inset(za), deckAt(za) - .05), top(za), za], [e * Math.min(inset(zc), deckAt(zc) - .05), top(zc), zc], .045, .045, 'oak'); } }
  // the cargo hatch aft of the mast
  const MZ = .4, hatch = { x0: -.6, x1: .6, z0: -3.0, z1: -1.2 };
  { const hz = (hatch.z0 + hatch.z1) / 2, hw = hatch.x1 - hatch.x0 + .12, hd = hatch.z1 - hatch.z0 + .12; for (const e of [-1, 1]) { put(new THREE.BoxGeometry(hw, .3, .08), 'oak', 0, DECK + .15, hz + e * hd / 2); put(new THREE.BoxGeometry(.08, .3, hd), 'oak', e * hw / 2, DECK + .15, hz); }
    put(new THREE.BoxGeometry(hw - .1, .02, hd - .1), 'dark', 0, DECK + .02, hz); }
  // cargo along the sides: barrels and crates against the rail, lashed
  const cargo = []; for (const e of [1, -1]) for (const z of [-.9, 1.8, 3.0]) { const x = e * (deckAt(z) - .45); if (r() < .5) { put(new THREE.CylinderGeometry(.3, .27, .8, 12), 'oak', x, DECK + .4, z); cargo.push([x, z, .3]); }
    else { put(new THREE.BoxGeometry(.7, .6, .7), 'deck', x, DECK + .3, z, 0, (r() - .5) * .2); cargo.push([x, z, .45]); } }
  // the mast, the yard at 8.2 m over the deck, the square sail from it to its foot 2.2 m over the deck, bellied forward
  const MH = 10.5, YY = DECK + 8.2, SF = DECK + 2.2, YL = 7.4;
  rod([0, keelAt(MZ) + .1, MZ], [0, DECK + MH, MZ], .2, .12, 'spar'); rod([-YL / 2, YY, MZ + .16], [YL / 2, YY, MZ + .16], .08, .08, 'spar');
  { put(new THREE.CylinderGeometry(.45, .38, .5, 12), 'oak', 0, DECK + MH - .7, MZ); /* the top, a round fighting top */ }
  { const g = new THREE.PlaneGeometry(YL - .3, YY - SF - .1, 14, 12), P = g.attributes.position; for (let k = 0; k < P.count; k++) { const x = P.getX(k) / (YL / 2), y = P.getY(k) / ((YY - SF) / 2); P.setZ(k, .6 * (1 - x * x) * (1 - .6 * y * y) + .1 * (1 - y) / 2); }
    g.computeVertexNormals(); put(g, 'sail', 0, (YY + SF) / 2 - .05, MZ + .25, 0, 0, 0, null); }
  for (const e of [1, -1]) for (const dz of [-.9, -.3, .3, .9]) { const z = MZ + dz - .2; rod([0, DECK + MH * .9, MZ], [e * (sect(z, 1)[0] + .05), sheerAt(z) - .05, z], .013, .013, 'rope'); }
  rod([0, DECK + MH * .95, MZ], [0, sheerAt(zb) + .35, zb + .1], .015, .015, 'rope'); rod([0, DECK + MH * .95, MZ], SP, .013, .013, 'rope');
  for (const e of [1, -1]) { rod([e * YL / 2, YY, MZ + .16], [e * (cw(zs + 2.2) - .05), CY + 1.0, zs + 2.2], .01, .01, 'rope'); rod([e * (YL / 2 - .3), SF, MZ + .3], [e * (sect(MZ - 2.6, 1)[0] - .06), DECK + 1.0, MZ - 2.6], .01, .01, 'rope'); }
  // the rudder hung on the sternpost; the wheel on the aftcastle 1 m aft of its edge
  { const pb = [zr(zs + .05, 0) + .05, keelAt(zs) - .12], pt = [zs - .12, sheerAt(zs) + .3], ang = Math.atan2(pt[0] - pb[0], pt[1] - pb[1]), rh = Math.hypot(pt[0] - pb[0], pt[1] - pb[1]) - .2;
    put(new THREE.BoxGeometry(.12, rh, .7).translate(0, rh / 2, -.4), 'oak', 0, pb[1] + .05, pb[0] - .02, ang);
    const wz = ZA - 1.0, wy = CY + 1.15; put(new THREE.TorusGeometry(.62, .035, 6, 24), 'oak', 0, wy, wz); for (let k = 0; k < 8; k++) { const a = k * Math.PI / 4; rod([0, wy, wz], [.78 * Math.cos(a), wy + .78 * Math.sin(a), wz], .022, .018, 'oak'); }
    put(new THREE.CylinderGeometry(.07, .07, .3, 8).rotateZ(Math.PI / 2).rotateY(Math.PI / 2), 'iron', 0, wy, wz - .12); put(new THREE.BoxGeometry(.18, wy - CY, .18), 'oak', 0, (wy + CY) / 2 - .05, wz - .3); }
  return finish({ L, W, deck: DECK, sections, sect, nstr: NSTR, deckAt, rail, sailFoot: SF, mast: [0, MZ], hatch, sheerAt, keelAt, harp, wheel: true, cargo,
    castles: { aft: { z0: zs + .25, z1: ZA, y: CY, door, ladders }, fore: { z0: ZF, z1: zb - .2, y: CY, ladder: fladder, posts } } });
}

// gatelandsGalleon(o, r) (Session 896, card F11; the ladder's 3 A: the game's five classes each dressed by its island; OG-004's Gatelands
//   "galleon warship"): the game's galleon (85-world-sea.js: L 22, W 7.0, draft 1.5, the sheer 0.5 m over the deck amidships rising 0.7
//   to the bow and 1.25 to the stern, a long raked stem, a square stern of 0.62 of the beam; fore and main square-rigged with topsails,
//   a gaff mizzen, a spritsail under the bowsprit; six gun ports a side; stern windows) in the Gatelands' dress: tarred below the water,
//   oiled oak above, a green band under a cream wale, green sails, the harp on the main course (o.harp). She is carvel-built: no 22 m
//   ship was clinker, and the sloop's laps stay the small hulls' mark (asked). The castles are real decks, 2.15 m over the main deck:
//   the quarterdeck over her last 6 m, the great cabin under it lit by five stern windows, two ladders up, the wheel on it, the mizzen
//   through it; the forecastle over her first 3.5 m, open beneath on two posts, a ladder up the middle. The gun ports are closed lids
//   along the gun deck under the main deck, which is the systems builder's (the ports are paint, no guns).
//   -> as markCutter, with castles ({ aft, fore } as the cog's), sails ([{ mast z, course foot y }]), ports, wheel: true.
export function gatelandsGalleon(o = {}, r = stream('galleon')) {
  const harp = o.harp !== false, M = mats(harp), { put, rod, finish } = kit(M);
  const L = 22, W = 7.0, DRAFT = 1.5, DECK = 1.0, SHEER = 1.5, BOW = .7, STERN = 1.25, NS = 60, NSTR = 16, TH = .05, TRN = .62;
  const zs = -L / 2, zb = L / 2, ZT = zs + .05;
  const sheerAt = z => SHEER + BOW * Math.max(0, z / zb) ** 2 + STERN * Math.max(0, z / zs) ** 2;
  const beamAt = z => { const t = Math.max(-1, Math.min(1, z / (zb - .05))); return t > 0 ? W / 2 / .987 /* the tumblehome takes the flare back: the widest section is then W */ * Math.max(0, 1 - t ** 2.0) ** .5 : W / 2 / .987 * (TRN + (1 - TRN) * Math.max(0, 1 - Math.abs(t) ** 2.4) ** .55); };
  const keelAt = z => { const t = z / zb; return -DRAFT * (t > 0 ? 1 - .45 * t ** 3 : 1 - .2 * t * t); };
  const sect = (z, u) => { const b = beamAt(z), k = keelAt(z), s = sheerAt(z), y = k + (s - k) * u; return [b * Math.sin(Math.PI / 2 * Math.min(1, u * 1.18)) ** .8 * (1 + .03 * Math.max(0, u - .8) / .2) * (1 - .06 * Math.max(0, u - .75) / .25) /* the tumblehome */, y]; };
  const zr = (z, u) => z > 0 ? z * (1 - .16 * (1 - u) ** 1.6 * (z / zb) ** 6) : z;
  const zAt = i => ZT + (zb - .05 - ZT) * i / NS;
  const sections = []; for (let i = 0; i <= NS; i++) { const z = zAt(i), pts = []; for (let k = 0; k <= 30; k++) pts.push(sect(z, k / 30).map(v => +v.toFixed(3))); sections.push({ z: +z.toFixed(3), pts }); }
  const norm = (z, u) => { const a = sect(z, Math.max(0, u - .01)), b = sect(z, Math.min(1, u + .01)), dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy) || 1; return [dy / l, -dx / l]; };
  // carvel: tarred below the water, oiled oak above, the top two strakes green
  const KR = 4; for (let s = 0; s < NSTR; s++) { const u0 = s / NSTR, u1 = (s + 1) / NSTR, outer = [], inner = [];
    for (let i = 0; i <= NS; i++) { const z = zAt(i), ro = [], ri = []; for (let k = 0; k <= KR; k++) { const u = u0 + (u1 - u0) * k / KR, p = sect(z, u), n = norm(z, u); ro.push([p[0] + n[0] * TH / 2, p[1] + n[1] * TH / 2, zr(z, u)]); ri.push([p[0] - n[0] * TH / 2, p[1] - n[1] * TH / 2, zr(z, u)]); } outer.push(ro); inner.push(ri); }
    const key = s >= NSTR - 2 ? 'green' : sect(0, (u0 + u1) / 2)[1] < .02 ? 'tar' : 'oak';
    for (const side of [1, -1]) { const mir = rows => rows.map(row => row.map(([x, y, z]) => [x * side, y, z])); put(ribbon(mir(outer), side > 0), key, 0, 0, 0, 0, 0, 0, null); put(ribbon(mir(inner), side < 0), key, 0, 0, 0, 0, 0, 0, null); } }
  // the transom, and five stern windows in it under the cream wale; two lanterns over it
  { const pts = []; for (let k = 0; k <= 30; k++) { const [x, y] = sect(ZT, k / 30); pts.push(new THREE.Vector2(x + TH / 2, y)); } for (let k = 30; k >= 0; k--) { const [x, y] = sect(ZT, k / 30); pts.push(new THREE.Vector2(-x - TH / 2, y)); }
    put(new THREE.ExtrudeGeometry(new THREE.Shape(pts), { depth: .06, bevelEnabled: false }), 'oak', 0, 0, ZT - .06, 0, 0, 0, .6);
    const wy = DECK + 1.25; for (let k = -2; k <= 2; k++) { put(new THREE.BoxGeometry(.5, .6, .03), 'dark', k * .72, wy, ZT - .075); put(new THREE.BoxGeometry(.62, .08, .05), 'cream', k * .72, wy + .34, ZT - .08); } put(new THREE.BoxGeometry(4.2, .1, .08), 'cream', 0, wy - .38, ZT - .08); }
  // the keel; the stem following the planking's curve to a long head; the beak under the bowsprit
  { const pts = []; for (let i = 0; i <= NS; i++) { const z = zAt(i); pts.push([zr(z, 0), keelAt(z) - .06]); }
    for (let k = 1; k <= 12; k++) { const u = k / 12; pts.push([zr(zb - .05, u) + .08 * u + .04, sect(zb - .05, u)[1] + (k === 12 ? .5 : 0)]); }
    for (let i = 0; i + 1 < pts.length; i++) { const [z0, y0] = pts[i], [z1, y1] = pts[i + 1]; put(new THREE.BoxGeometry(.22, .26, Math.hypot(z1 - z0, y1 - y0) + .03), 'tar', 0, (y0 + y1) / 2, (z0 + z1) / 2, -Math.atan2(y1 - y0, z1 - z0)); } }
  const SPL = 6.0, SP = [0, sheerAt(zb) + .4 + SPL * Math.sin(.28), zb + SPL * Math.cos(.28)]; rod([0, sheerAt(zb) - .1, zb - 2.0], SP, .14, .08, 'spar');
  // the deck, the covering boards
  const deckAt = z => { let lo = 0, hi = 1; for (let k = 0; k < 30; k++) { const m = (lo + hi) / 2; if (sect(z, m)[1] < DECK) lo = m; else hi = m; } return sect(z, lo)[0] - TH * .6; };
  { const PW = .18; for (let x = -W / 2 + PW / 2; x < W / 2; x += PW) { const zz = []; for (let i = 0; i <= NS; i++) { const z = zAt(i); if (deckAt(z) >= Math.abs(x) + PW / 2) zz.push(z); } if (zz.length < 2) continue;
      const z0 = zz[0] - (zz[0] < ZT + .1 ? .06 : 0), z1 = zz[zz.length - 1]; put(new THREE.BoxGeometry(PW, .05, z1 - z0), 'deck', x, DECK - .025, (z0 + z1) / 2, 0, 0, 0, .35); }
    for (const e of [1, -1]) { const rows = []; for (let i = 0; i <= NS; i++) { const z = zAt(i), d = deckAt(z); rows.push([[e * Math.max(0, d - .3), DECK + .002, z], [e * (d + TH * .5), DECK + .002, z]]); } put(ribbon(rows, e < 0), 'oak', 0, 0, 0, 0, 0, 0, null); } }
  // the cream wale under the green; six gun-port lids a side on the gun deck, closed
  for (let i = 0; i + 2 <= NS; i += 2) { const za = zAt(i), zc = zAt(i + 2), u = (NSTR - 2) / NSTR; for (const e of [1, -1]) rod([e * (sect(za, u)[0] + .035), sect(za, u)[1], zr(za, u)], [e * (sect(zc, u)[0] + .035), sect(zc, u)[1], zr(zc, u)], .05, .05, 'cream'); }
  const ports = []; for (const e of [1, -1]) for (let k = 0; k < 6; k++) { const z = -5.5 + k * 2.1, y = DECK - .45, u = (y - keelAt(z)) / (sheerAt(z) - keelAt(z)), p = sect(z, u), n = norm(z, u);
    put(new THREE.BoxGeometry(.06, .5, .56).rotateZ(-e * Math.atan2(n[1], n[0]) * 0), 'green', e * (p[0] + n[0] * .04), y, z); put(new THREE.BoxGeometry(.03, .06, .56), 'iron', e * (p[0] + n[0] * .08), y + .18, z); ports.push([e, z, y]); }
  // the castles, as the cog's: green boards from the sheer to 0.25 m over the castle deck, a cream band, a rail at 1.0 m
  const CY = DECK + 2.15, cw = z => sect(z, 1)[0], ZA = zs + 6.0, ZF = zb - 3.5;
  const castleSides = (z0, z1) => { const n = 18; for (const e of [1, -1]) { const rows = []; for (let i = 0; i <= n; i++) { const z = z0 + (z1 - z0) * i / n; rows.push([[e * cw(z), sheerAt(z) - .1, z], [e * cw(z), CY + .25, z]]); }
      put(ribbon(rows, e > 0), 'green', 0, 0, 0, 0, 0, 0, null); put(ribbon(rows.map(row => row.map(([x, y, z]) => [x - e * .05, y, z])), e < 0), 'green', 0, 0, 0, 0, 0, 0, null);
      for (let i = 0; i < n; i++) { const za = z0 + (z1 - z0) * i / n, zc = z0 + (z1 - z0) * (i + 1) / n; rod([e * (cw(za) + .02), CY + .25, za], [e * (cw(zc) + .02), CY + .25, zc], .035, .035, 'cream'); }
      const top = CY + 1.0, k = Math.max(2, Math.round((z1 - z0) / .8)); for (let i = 0; i <= k; i++) { const z = z0 + .15 + (z1 - z0 - .3) * i / k; if (cw(z) < .3) continue; put(new THREE.BoxGeometry(.08, top - CY - .25, .08), 'oak', e * (cw(z) - .04), (top + CY + .25) / 2, z); }
      for (let i = 0; i < k; i++) { const za = z0 + .15 + (z1 - z0 - .3) * i / k, zc = z0 + .15 + (z1 - z0 - .3) * (i + 1) / k; if (cw(za) < .3 || cw(zc) < .3) continue; rod([e * (cw(za) - .04), top, za], [e * (cw(zc) - .04), top, zc], .045, .045, 'oak'); } }
    const PW = .16; for (let x = -W / 2 + PW / 2; x < W / 2; x += PW) { const zz = []; for (let i = 0; i <= 60; i++) { const z = z0 + (z1 - z0) * i / 60; if (cw(z) - .05 >= Math.abs(x) + PW / 2) zz.push(z); } if (zz.length < 2) continue;
      put(new THREE.BoxGeometry(PW, .06, zz[zz.length - 1] - zz[0] + .05), 'deck', x, CY - .03, (zz[0] + zz[zz.length - 1]) / 2, 0, 0, 0, .35); } };
  castleSides(ZT, ZA); castleSides(ZF, zb - .3);
  { const a = cw(ZT) - .04; put(new THREE.BoxGeometry(2 * cw(ZT) + .06, CY + .25 - sheerAt(ZT) + .1, .06), 'green', 0, (sheerAt(ZT) - .1 + CY + .25) / 2, ZT - .03); rod([-a, CY + 1.0, ZT + .15], [a, CY + 1.0, ZT + .15], .045, .045, 'oak');
    for (let x = -a; x <= a + .01; x += a / 4) put(new THREE.BoxGeometry(.08, .75, .08), 'oak', x, CY + .625, ZT + .15);
    for (const e of [1, -1]) { const x = e * (a - .15); rod([x, CY + 1.0, ZT + .15], [x, CY + 1.3, ZT + .15], .03, .03, 'iron'); put(new THREE.CylinderGeometry(.14, .11, .34, 8), 'cream', x, CY + 1.47, ZT + .15); } }
  const edgeRail = (z, gaps, dz) => { const a = cw(z) - .04, xs = [-a, ...gaps.flat(), a], top = CY + 1.0; for (let i = 0; i < xs.length; i += 2) { const [x0, x1] = [xs[i], xs[i + 1]]; rod([x0, top, z + dz], [x1, top, z + dz], .045, .045, 'oak'); for (const x of [x0, x1]) put(new THREE.BoxGeometry(.08, top - CY, .08), 'oak', x, (top + CY) / 2, z + dz); }
    put(new THREE.BoxGeometry(2 * a + .08, .12, .18), 'green', 0, CY - .06, z); };
  const door = { x0: -.5, x1: .5, y1: DECK + 1.95 }, ladders = [-2.0, 2.0];
  { const w = Math.min(cw(ZA), deckAt(ZA) + .05); for (const e of [1, -1]) put(new THREE.BoxGeometry(w - door.x1, CY - DECK, .08), 'oak', e * (door.x1 + (w - door.x1) / 2), (DECK + CY) / 2, ZA); put(new THREE.BoxGeometry(door.x1 - door.x0, CY - door.y1, .08), 'oak', 0, (door.y1 + CY) / 2, ZA);
    for (const e of [1, -1]) put(new THREE.BoxGeometry(.6, .45, .02), 'dark', e * 1.2, DECK + 1.45, ZA + .05); put(new THREE.BoxGeometry(1.16, .1, .1), 'cream', 0, door.y1 + .05, ZA + .06);
    for (const lx of ladders) { for (const e of [-1, 1]) rod([lx + e * .28, DECK, ZA + 1.25], [lx + e * .28, CY + .05, ZA + .02], .035, .035, 'oak'); for (let k = 1; k <= 7; k++) { const f = k / 8; put(new THREE.BoxGeometry(.56, .04, .2), 'oak', lx, DECK + (CY - DECK) * f, ZA + 1.25 * (1 - f)); } }
    edgeRail(ZA, ladders.map(lx => [lx - .36, lx + .36]), -.05); }
  const posts = [-2.0, 2.0], fladder = 0;
  { for (const px of posts) put(new THREE.BoxGeometry(.18, CY - DECK - .12, .18), 'oak', px, (DECK + CY - .12) / 2, ZF + .1);
    for (const e of [-1, 1]) rod([fladder + e * .28, DECK, ZF - 1.25], [fladder + e * .28, CY + .05, ZF - .02], .035, .035, 'oak'); for (let k = 1; k <= 7; k++) { const f = k / 8; put(new THREE.BoxGeometry(.56, .04, .2), 'oak', fladder, DECK + (CY - DECK) * f, ZF - 1.25 * (1 - f)); }
    edgeRail(ZF, [[fladder - .36, fladder + .36]], .05); }
  // the waist's rail
  const rail = []; { const n = Math.round(L / .9); const top = z => Math.max(DECK + 1.0, sheerAt(z) + .12), inset = z => sect(z, 1)[0] - .06, ok = z => z > ZA + .3 && z < ZF - .3;
    for (let k = 1; k < n; k++) { const z = zs + L * k / n; if (!ok(z)) continue; for (const e of [1, -1]) put(new THREE.BoxGeometry(.08, top(z) - DECK, .08), 'oak', e * Math.min(inset(z), deckAt(z) - .05), (top(z) + DECK) / 2, z); rail.push([+z.toFixed(2), +top(z).toFixed(3)]); }
    for (let k = 1; k + 1 < n; k++) { const za = zs + L * k / n, zc = zs + L * (k + 1) / n; if (!ok(za) || !ok(zc)) continue; for (const e of [1, -1]) rod([e * Math.min(inset(za), deckAt(za) - .05), top(za), za], [e * Math.min(inset(zc), deckAt(zc) - .05), top(zc), zc], .045, .045, 'oak'); } }
  // two hatches, one each side of the main mast
  const hatches = [{ x0: -.7, x1: .7, z0: -3.2, z1: -1.6 }, { x0: -.7, x1: .7, z0: 1.2, z1: 2.6 }];
  for (const h of hatches) { const hz = (h.z0 + h.z1) / 2, hw = h.x1 - h.x0 + .12, hd = h.z1 - h.z0 + .12; for (const e of [-1, 1]) { put(new THREE.BoxGeometry(hw, .3, .08), 'oak', 0, DECK + .15, hz + e * hd / 2); put(new THREE.BoxGeometry(.08, .3, hd), 'oak', e * hw / 2, DECK + .15, hz); } put(new THREE.BoxGeometry(hw - .1, .02, hd - .1), 'dark', 0, DECK + .02, hz); }
  // the square masts: course and topsail on each, a round top, the courses' feet 2.2 m over the deck,
  // bellied forward; the main course bears the harp, the others plain cloth (their UVs take a corner of the sail's map)
  const square = (mz, mh, cy, cw2, tw, foot, harpOn) => { rod([0, keelAt(mz) + .1, mz], [0, DECK + mh, mz], .24, .14, 'spar'); put(new THREE.CylinderGeometry(.55, .45, .45, 12), 'oak', 0, cy + .5, mz);
    rod([-cw2 / 2, cy, mz + .2], [cw2 / 2, cy, mz + .2], .1, .08, 'spar'); rod([-tw / 2, DECK + mh - .5, mz + .16], [tw / 2, DECK + mh - .5, mz + .16], .07, .06, 'spar');
    const sail = (w, top, bot, z, harpSail) => { const g = new THREE.PlaneGeometry(w - .3, top - bot - .1, 14, 12), P = g.attributes.position; for (let k = 0; k < P.count; k++) { const x = P.getX(k) / (w / 2), y = P.getY(k) / ((top - bot) / 2); P.setZ(k, .6 * (1 - x * x) * (1 - .6 * y * y) + .1 * (1 - y) / 2); }
      if (!harpSail) { const U = g.attributes.uv; for (let k = 0; k < U.count; k++) U.setXY(k, U.getX(k) * .3, U.getY(k) * .3); } g.computeVertexNormals(); put(g, 'sail', 0, (top + bot) / 2 - .05, z, 0, 0, 0, null); };
    sail(cw2, cy, foot, mz + .28, harpOn); sail(tw, DECK + mh - .5, cy + .8, mz + .24, false);
    for (const e of [1, -1]) for (const dz of [-1.0, -.4, .2, .8]) { const z = mz + dz - .3; rod([0, cy + .4, mz], [e * (sect(z, 1)[0] + .05), (z < ZA ? CY + .2 : z > ZF ? CY + .2 : sheerAt(z) - .05), z], .014, .014, 'rope'); }
    return { mz, foot }; };
  const sails = [square(-.4, 13, DECK + 9.4, 9.0, 6.4, DECK + 2.2, harp), square(5.2, 10.5, DECK + 7.4, 7.4, 5.2, DECK + 2.2, false)];
  rod([0, DECK + 13 * .72, -.4], [0, DECK + 10.5 * .72, 5.2], .025, .025, 'rope'); rod([0, DECK + 10.5 * .72, 5.2], SP, .025, .025, 'rope');
  // the mizzen through the quarterdeck: a gaff sail with its boom 2.2 m over the quarterdeck, aft past the transom
  const MZ = -8.0, MH = 9, BY = CY + 2.2, GT = CY + 6.2; rod([0, keelAt(MZ) + .1, MZ], [0, DECK + MH + 1.8, MZ], .17, .11, 'spar'); rod([0, BY, MZ - .2], [0, BY, ZT - 1.4], .08, .07, 'spar');
  const PK = [0, GT + 3.2 * Math.sin(.55), MZ - 3.2 * Math.cos(.55)]; rod([0, GT, MZ - .2], PK, .07, .06, 'spar'); { const g = quadSail([0, BY + .1, MZ - .25], [0, BY + .1, ZT - 1.1], PK, [0, GT - .05, MZ - .25], .45), U = g.attributes.uv; for (let k = 0; k < U.count; k++) U.setXY(k, U.getX(k) * .3, U.getY(k) * .3); put(g, 'sail', 0, 0, 0, 0, 0, 0, null); }
  for (const e of [1, -1]) for (const dz of [-.5, .3]) { const z = MZ + dz; rod([0, DECK + MH, MZ], [e * (cw(z) - .05), CY + .2, z], .012, .012, 'rope'); }
  // the spritsail on its yard under the bowsprit, a third of the way out
  { const t = .4, sy = sheerAt(zb) + .4 + SPL * t * Math.sin(.28) - .25, sz = zb + SPL * t * Math.cos(.28); rod([-2.2, sy, sz], [2.2, sy, sz], .05, .05, 'spar'); const g = new THREE.PlaneGeometry(4.0, 1.8, 6, 4); const P = g.attributes.position; for (let k = 0; k < P.count; k++) P.setZ(k, .25 * (1 - (P.getX(k) / 2) ** 2)); g.computeVertexNormals(); { const U = g.attributes.uv; for (let k = 0; k < U.count; k++) U.setXY(k, U.getX(k) * .3, U.getY(k) * .3); } put(g, 'sail', 0, sy - .95, sz + .1, 0, 0, 0, null); }
  // the rudder on the transom, its head through the quarterdeck; the wheel on the quarterdeck
  { const ry0 = keelAt(zs) - .05; put(new THREE.BoxGeometry(.14, sheerAt(ZT) - ry0, .9), 'oak', 0, (ry0 + sheerAt(ZT)) / 2, ZT - .5); rod([0, sheerAt(ZT) - .2, ZT - .2], [0, CY + .3, ZT - .2], .09, .09, 'oak');
    const wz = ZA - 1.0, wy = CY + 1.15; put(new THREE.TorusGeometry(.66, .035, 6, 24), 'oak', 0, wy, wz); for (let k = 0; k < 8; k++) { const a = k * Math.PI / 4; rod([0, wy, wz], [.82 * Math.cos(a), wy + .82 * Math.sin(a), wz], .022, .018, 'oak'); }
    put(new THREE.CylinderGeometry(.07, .07, .3, 8).rotateZ(Math.PI / 2).rotateY(Math.PI / 2), 'iron', 0, wy, wz - .12); put(new THREE.BoxGeometry(.18, wy - CY, .18), 'oak', 0, (wy + CY) / 2 - .05, wz - .3); }
  return finish({ L, W, deck: DECK, sections, sect, nstr: NSTR, deckAt, rail, sailFoot: DECK + 2.2, mast: [0, -.4], hatch: hatches[0], hatches, sheerAt, keelAt, transom: ZT, carvel: true, harp, wheel: true, ports, sails, boom: { y: BY, z0: MZ - .2, z1: ZT - 1.4 },
    castles: { aft: { z0: ZT, z1: ZA, y: CY, door, ladders }, fore: { z0: ZF, z1: zb - .3, y: CY, ladder: fladder, posts } } });
}
