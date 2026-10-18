// The base below deck (Session 1099; backlog L6's "the base below deck", OG-027, OG-072): the player's ship as a home, fitted inside the
// hull's own lines. The cog first, the middle of the game's five classes (85-world-sea.js: L 17, W 5.6, draft 1.25, the deck 1.0 over the
// sea), built by ships.js with her hatch open (o.open). Everything is placed against the moulded section (S.sect), so nothing stands
// outside the planking:
//   - the cabin under the aftcastle (z -8.25 to -4.7 on the main deck, 2.03 m clear under the castle's deck beam): a box bunk along the port
//     side (rest and save), a sea chest, the chart table with its chart, dividers and a candle, a stool, a lantern hung from the beam;
//   - the hold below the hatch (its floor of ceiling planks at -0.9, the frames every 0.75 m, the deck beams every metre at 0.85, a
//     bulkhead at each end, a ladder up through the hatch): barrels in chocks and crates and sacks (the stores), the workbench with its vice
//     and a rack of tools (crafting), a table with a still, a retort and a rack of phials (alchemy), two chests (the stash), two lanterns;
//   - the galley under the forecastle, open beneath on its posts: a firebox on a tray of sand with an iron pot on a crane, a water cask.
// o.dress 'gatelands' (default: warm oak, a wool blanket in green and cream, a brick firebox) | 'mark' (tarred and plain: furs on the
// bunk, a hide on the floor, an iron firepan on stones) | 'aurenne' (oiled wood and brass: cushions in madder and indigo, a kilim, a
// firebox faced in blue tile), OG-027's interior dress by island. The ship is the island's own cog (ships.js gatelandsCog, markCog,
// aurenneCog). -> { group, ship (ships.js's result), tris, draws, items ([{ name, place, box: [x0, y0, z0, x1, y1, z1] }]), hb(z, y)
//   (the inside of the planking's half-breadth at that height), floor (the hold's floor y), beams ([z...]), beamY (their underside),
//   cabin { z0, z1, floor, ceil }, galley { z0, z1, floor, ceil }, hatch, ladder { foot, head }, lights ([{ x, y, z, warm }]) }
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { mat, worldUV } from './common.js';
import { stream } from './pieces.js';
import { gatelandsCog, markCog, aurenneCog, gatelandsSloop, markSloop, aurenneSloop } from './ships.js';

const DRESS = {
  gatelands: { wood: 0xb08a62, dark: 0x6e5238, cloth: [0x3f6a46, 0xe6dcc0], rug: [0x5c3a2a, 0xc9b48a], fire: 'brick', metal: 0x2a2826, trim: 0x3f6a46 },
  mark: { wood: 0x7a6650, dark: 0x3a3029, cloth: [0x6d6458, 0x8f8578], rug: [0x7a5e44, 0x5a4634], fire: 'iron', metal: 0x1e1c1b, trim: 0x8a2a1e, fur: true },
  aurenne: { wood: 0xc29a6a, dark: 0x8a6440, cloth: [0x9c2f2a, 0x2f3f74], rug: [0x9c2f2a, 0xd8b06a], fire: 'tile', metal: 0xb08a3a, trim: 0x2f5f9c },
};
let MATS = {};
function baseMats(dress) {
  if (MATS[dress]) return MATS[dress]; const D = DRESS[dress], M = {}, std = (c, o = {}) => new THREE.MeshStandardMaterial({ color: new THREE.Color(c), roughness: o.r ?? .8, metalness: o.m ?? 0 });
  M.wood = mat('wood', { ns: .8, color: D.wood }); M.dark = mat('wood', { ns: .8, color: D.dark }); M.plank = mat('wood', { ns: .9, color: new THREE.Color(D.wood).multiplyScalar(.8) });
  M.cloth0 = std(D.cloth[0], { r: 1 }); M.cloth1 = std(D.cloth[1], { r: 1 }); M.rug0 = std(D.rug[0], { r: 1 }); M.rug1 = std(D.rug[1], { r: 1 }); M.trim = std(D.trim, { r: .7 });
  M.metal = std(D.metal, { r: .4, m: .7 }); M.iron = std(0x1d1c1b, { r: .5, m: .6 }); M.copper = std(0xb06a3c, { r: .35, m: .8 }); M.glass = std(0x7aa08a, { r: .1 }); M.paper = std(0xe8dcbc, { r: .9 });
  M.brick = mat('stone', { ns: .8, color: 0xb0604a }); M.tile = std(0x3b6aa8, { r: .3 }); M.sand = std(0xc8b48a, { r: 1 }); M.fur = std(0x8a7a66, { r: 1 });
  M.flame = new THREE.MeshStandardMaterial({ color: new THREE.Color(.2, .08, .02), emissive: new THREE.Color(1, .55, .2), emissiveIntensity: 2.4 });
  M.lamp = new THREE.MeshStandardMaterial({ color: new THREE.Color(.3, .2, .1), emissive: new THREE.Color(1, .72, .38), emissiveIntensity: 2.0 });
  return (MATS[dress] = M);
}

export function shipBase(o = {}) {
  const dress = DRESS[o.dress] ? o.dress : 'gatelands', D = DRESS[dress], M = baseMats(dress), r = o.r || stream(`shipbase:${dress}`);
  const S = (dress === 'mark' ? markCog : dress === 'aurenne' ? aurenneCog : gatelandsCog)({ open: true }, stream(`cog:${dress}`));
  const DECK = S.deck, TH = .04, CY = S.castles.aft.y, by = {}, items = [], lights = [];
  // the inside of the planking: the half-breadth at height y on the section at z, less the planking and the lap
  const hb = (z, y) => { let lo = 0, hi = 1; for (let k = 0; k < 30; k++) { const m = (lo + hi) / 2; if (S.sect(z, m)[1] < y) lo = m; else hi = m; } return S.sect(z, lo)[0] - TH - .03; };
  const add = (key, g) => { const x = g.index ? g.toNonIndexed() : g; for (const k of Object.keys(x.attributes)) if (!['position', 'normal', 'uv'].includes(k)) x.deleteAttribute(k);
    if (!x.attributes.uv) worldUV(x, .8); (by[key] ||= []).push(x); return x; };
  const box = (key, w, h, d, x, y, z, ry = 0) => { const g = new THREE.BoxGeometry(w, h, d); worldUV(g, .8); if (ry) g.rotateY(ry); g.translate(x, y, z); return add(key, g); };
  const cyl = (key, r0, r1, h, x, y, z, n = 12) => { const g = new THREE.CylinderGeometry(r0, r1, h, n); worldUV(g, .8); g.translate(x, y, z); return add(key, g); };
  // an item: what it is and where, its box recorded for the check that it stands inside the hull
  const item = (name, place, x0, y0, z0, x1, y1, z1) => { items.push({ name, place, box: [x0, y0, z0, x1, y1, z1].map(v => +v.toFixed(3)) }); };

  // ── the hold ──
  const FLOOR = -.9, BEAM = .85, BH = .18, beamY = BEAM - BH / 2, hz0 = -5.5, hz1 = 5.5;
  { const PW = .22; for (let x = -3 + PW / 2; x < 3; x += PW) { const zz = []; for (let z = hz0; z <= hz1 + 1e-6; z += .1) if (hb(z, FLOOR) - .02 >= Math.abs(x) + PW / 2) zz.push(z); if (zz.length < 2) continue;
      box('plank', PW - .01, .05, zz[zz.length - 1] - zz[0], x, FLOOR - .025, (zz[0] + zz[zz.length - 1]) / 2); } }
  // the frames: oak timbers up the inside of the planking from the floor to the deck, every 0.75 m
  for (let z = -5.25; z <= 5.26; z += .75) for (const e of [1, -1]) { const n = 7; for (let k = 0; k < n; k++) { const ya = FLOOR + (DECK - FLOOR - .05) * k / n, yb = FLOOR + (DECK - FLOOR - .05) * (k + 1) / n, xa = hb(z, ya) - .08, xb = hb(z, yb) - .08;
      const L = Math.hypot(xb - xa, yb - ya), g = new THREE.BoxGeometry(.14, L + .02, .16); worldUV(g, .8); g.rotateZ(-e * Math.atan2(xb - xa, yb - ya)); g.translate(e * (xa + xb) / 2, (ya + yb) / 2, z); add('dark', g); } }
  // the deck beams, the carlings at the hatch's sides, the knees at the beams' ends
  const beams = [-5.0, -4.0, -3.06, -1.14, 0, 1.0, 2.0, 3.0, 4.0, 5.0];
  for (const z of beams) { const w = 2 * (hb(z, BEAM) - .02); box('dark', w, BH, .2, 0, BEAM, z); for (const e of [1, -1]) box('dark', .16, .5, .16, e * (hb(z, BEAM - .35) - .1), BEAM - .3, z); }
  for (const e of [1, -1]) box('dark', .14, .14, 1.92, e * .66, BEAM + .02, -2.1);
  // the bulkheads: boards across the hold at each end, the hull's section cut out of them
  for (const zb of [hz0, hz1]) { const sh = new THREE.Shape(), ys = []; for (let k = 0; k <= 12; k++) ys.push(FLOOR - .05 + (DECK - FLOOR) * k / 12);
    sh.moveTo(-hb(zb, ys[0]), ys[0]); for (const y of ys) sh.lineTo(-hb(zb, y), y); for (const y of [...ys].reverse()) sh.lineTo(hb(zb, y), y); sh.lineTo(-hb(zb, ys[0]), ys[0]);
    const g = new THREE.ExtrudeGeometry(sh, { depth: .05, bevelEnabled: false }); g.translate(0, 0, zb - (zb < 0 ? .05 : 0)); worldUV(g, .8); add('wood', g);
    for (let x = -2.4; x <= 2.4; x += .3) if (hb(zb, 0) > Math.abs(x) + .05) box('dark', .03, DECK - FLOOR - .05, .02, x, (FLOOR + DECK) / 2, zb + (zb < 0 ? .01 : -.01)); }
  // the ladder from the floor up through the hatch, its foot aft, its head on the coaming's aft side
  const foot = [0, FLOOR, -2.95], head = [0, DECK + .3, -1.35];
  { const d = new THREE.Vector3(0, head[1] - foot[1], head[2] - foot[2]), L = d.length(), a = Math.atan2(d.z, d.y);
    for (const e of [-.26, .26]) { const g = new THREE.BoxGeometry(.06, L, .1); worldUV(g, .8); g.rotateX(a); g.translate(e, (foot[1] + head[1]) / 2, (foot[2] + head[2]) / 2); add('wood', g); }
    for (let k = 1; k * .28 < head[1] - foot[1] - .1; k++) { const f = k * .28 / (head[1] - foot[1]); box('wood', .5, .04, .12, 0, foot[1] + (head[1] - foot[1]) * f, foot[2] + (head[2] - foot[2]) * f); }
    item('ladder', 'hatch', -.3, FLOOR, -2.95, .3, DECK + .3, -1.35); }
  // the mast through the hold to its step on the keelson
  cyl('dark', .2, .2, DECK - FLOOR, 0, (FLOOR + DECK) / 2, S.mast[1], 14); box('dark', .3, .25, 1.4, 0, FLOOR + .12, S.mast[1]);
  // the stores: barrels in chocks along the port side aft, crates and sacks forward to starboard
  const onFloor = (z, half) => hb(z, FLOOR) - .04 - half;
  for (let k = 0; k < 4; k++) { const z = -4.85 + k * .66, R = .3, x = -Math.min(onFloor(z - R, R), onFloor(z + R, R)); cyl('wood', R * .9, R * .82, .8, x, FLOOR + .4, z, 14); for (const y of [.12, .68]) cyl('iron', R * .86 + .01, R * .86 + .01, .04, x, FLOOR + y, z, 14);
    item('barrel', 'hold', x - R, FLOOR, z - R, x + R, FLOOR + .8, z + R); if (k < 3) { const z2 = z + .33, x2 = x + .05, rr = .26; const g = new THREE.CylinderGeometry(rr * .9, rr * .9, .7, 12); worldUV(g, .8); g.rotateX(Math.PI / 2); g.translate(x2, FLOOR + .8 + rr, z2); add('wood', g);
      item('barrel, laid', 'hold', x2 - rr, FLOOR + .8, z2 - .35, x2 + rr, FLOOR + .8 + 2 * rr, z2 + .35); } }
  for (const [z, w, h] of [[1.7, .7, .6], [2.45, .6, .5], [3.1, .7, .7]]) { const x = Math.min(onFloor(z - w / 2, w / 2), onFloor(z + w / 2, w / 2)), ry = (r() - .5) * .2; box('plank', w, h, w, x, FLOOR + h / 2, z, ry); item('crate', 'hold', x - w * .6, FLOOR, z - w * .6, x + w * .6, FLOOR + h, z + w * .6); }
  for (let k = 0; k < 3; k++) { const z = 3.75 + k * .45, x = onFloor(z, .3) - .05, g = new THREE.SphereGeometry(.3, 10, 8); g.scale(1, .7, 1.1); worldUV(g, .8); g.translate(x, FLOOR + .2, z); add('cloth1', g); item('sack', 'hold', x - .3, FLOOR, z - .33, x + .3, FLOOR + .42, z + .33); }
  // the workbench (crafting) on the port side forward, a vice at its end, a rack of tools on the frames over it
  { const z0 = 1.8, z1 = 3.4, dpt = .7, xo = -Math.min(onFloor(z0, 0), onFloor(z1, 0)), x = xo + dpt / 2, ht = .85;
    box('wood', dpt, .08, z1 - z0, x, FLOOR + ht, (z0 + z1) / 2); for (const zz of [z0 + .1, z1 - .1]) for (const xx of [x - dpt / 2 + .08, x + dpt / 2 - .08]) box('dark', .08, ht - .04, .08, xx, FLOOR + (ht - .04) / 2, zz);
    box('dark', dpt - .1, .05, z1 - z0 - .2, x, FLOOR + .25, (z0 + z1) / 2); box('iron', .16, .14, .22, x + dpt / 2 - .12, FLOOR + ht + .11, z1 - .2); box('iron', .04, .04, .32, x + dpt / 2 - .12, FLOOR + ht + .11, z1 - .2);
    const rx = -Math.min(hb(1.95, .35), hb(3.25, .35)) + .12; box('dark', .04, .5, 1.3, rx, .35, 2.6); for (let k = 0; k < 5; k++) { box('iron', .03, .32, .03, rx + .05, .3, 2.1 + k * .25); box('wood', .03, .12, .05, rx + .05, .5, 2.1 + k * .25); }
    for (const [dx, dz, w] of [[-.1, .3, .4], [.15, .9, .3]]) box('plank', w, .04, .12, x + dx, FLOOR + ht + .06, z0 + dz);
    item('workbench', 'hold', x - dpt / 2, FLOOR, z0, x + dpt / 2, FLOOR + ht + .2, z1); item('tool rack', 'hold', rx - .03, .05, 1.95, rx + .1, .6, 3.25); }
  // the alchemist's table (alchemy) on the starboard side aft: the still, a retort, a rack of phials
  { const z0 = -4.55, z1 = -3.55, dpt = .6, xo = Math.min(onFloor(z0, 0), onFloor(z1, 0)), x = xo - dpt / 2, ht = .8;
    box('wood', dpt, .06, z1 - z0, x, FLOOR + ht, (z0 + z1) / 2); for (const zz of [z0 + .08, z1 - .08]) for (const xx of [x - dpt / 2 + .07, x + dpt / 2 - .07]) box('dark', .07, ht - .03, .07, xx, FLOOR + (ht - .03) / 2, zz);
    { const g = new THREE.SphereGeometry(.17, 14, 10); g.translate(x - .05, FLOOR + ht + .2, z0 + .3); add('copper', g); } cyl('copper', .03, .05, .3, x - .05, FLOOR + ht + .45, z0 + .3, 8);
    { const g = new THREE.CylinderGeometry(.02, .02, .45, 6); g.rotateX(Math.PI / 2.6); g.translate(x - .05, FLOOR + ht + .55, z0 + .5); add('copper', g); } { const g = new THREE.SphereGeometry(.09, 12, 8); g.translate(x - .05, FLOOR + ht + .1, z0 + .72); add('glass', g); }
    cyl('iron', .08, .1, .1, x - .05, FLOOR + ht + .05, z0 + .3, 10); { const g = new THREE.SphereGeometry(.04, 8, 6); g.translate(x - .05, FLOOR + ht + .05, z0 + .3); add('flame', g); }
    box('dark', .12, .25, .8, x + dpt / 2 - .08, FLOOR + ht + .15, (z0 + z1) / 2); for (let k = 0; k < 6; k++) cyl('glass', .025, .03, .13, x + dpt / 2 - .08, FLOOR + ht + .33, z0 + .15 + k * .13, 8);
    item('alchemy table', 'hold', x - dpt / 2, FLOOR, z0, x + dpt / 2, FLOOR + ht + .7, z1); }
  // the stash: two chests by the fore bulkhead, iron-bound, the island's trim on their lids
  for (const e of [1, -1]) { const z = 4.95, w = .9, d = .55, hgt = .5, x = e * (onFloor(z, w / 2) - .02); box('wood', w, hgt, d, x, FLOOR + hgt / 2, z); box('trim', w + .02, .06, d + .02, x, FLOOR + hgt - .03, z); for (const dx of [-.3, .3]) box('iron', .05, hgt + .02, d + .02, x + dx, FLOOR + hgt / 2, z);
    item('chest', 'hold', x - w / 2, FLOOR, z - d / 2, x + w / 2, FLOOR + hgt, z + d / 2); }
  // the lanterns hung from the beams
  for (const z of [-3.5, 2.5]) { cyl('metal', .1, .12, .26, .4, beamY - .32, z, 8); { const g = new THREE.SphereGeometry(.06, 8, 6); g.translate(.4, beamY - .33, z); add('lamp', g); } box('iron', .01, .18, .01, .4, beamY - .1, z); lights.push({ x: .4, y: beamY - .33, z, warm: 1 }); }
  // the island's rug on the hold's floor between the bench and the alchemy table: Mark a hide, else a woven rug in two colours
  if (D.fur) { const g = new THREE.CircleGeometry(.8, 9); g.scale(1, 1.3, 1); g.rotateX(-Math.PI / 2); g.translate(0, FLOOR + .006, -.6); add('fur', g); }
  else { box('rug0', 1.4, .01, 2.0, 0, FLOOR + .006, -.6); box('rug1', 1.1, .012, 1.7, 0, FLOOR + .008, -.6); box('rug0', .7, .014, 1.3, 0, FLOOR + .01, -.6); }

  // ── the cabin under the aftcastle ──
  const cz0 = S.castles.aft.z0, cz1 = S.castles.aft.z1, cceil = CY - .12, cin = (z, y) => Math.min(hb(z, y), S.sect(z, 1)[0] - .06);
  { // the box bunk along the port side: its frame, a straw tick, the island's blanket, a curtain rail; a headboard aft
    const z0 = -7.2, z1 = -5.3, w = .8, xo = -Math.min(cin(z0, DECK + .1), cin(z1, DECK + .1)) + .02, x = xo + w / 2, y0 = DECK, top = DECK + .55;
    box('wood', w, .3, z1 - z0, x, y0 + .15 + .1, (z0 + z1) / 2); box('cloth1', w - .1, .14, z1 - z0 - .1, x, y0 + .47, (z0 + z1) / 2); box(D.fur ? 'fur' : 'cloth0', w - .06, .05, (z1 - z0) * .64, x, y0 + .57, z1 - (z1 - z0) * .34);
    box('cloth1', .5, .1, .3, x, y0 + .58, z0 + .25); for (const zz of [z0, z1]) box('wood', w + .04, 1.3, .06, x, y0 + .65, zz); box('wood', .06, .32, z1 - z0, x + w / 2, y0 + .4, (z0 + z1) / 2);
    box('dark', .04, .04, z1 - z0, x + w / 2 - .02, y0 + 1.3, (z0 + z1) / 2); item('bunk', 'cabin', x - w / 2, y0, z0 - .03, x + w / 2 + .03, y0 + 1.3, z1 + .03); }
  { // the sea chest at the bunk's foot, to starboard of the door's way
    const z = -5.4, w = .5, d = .9, x = Math.min(cin(z - d / 2, DECK + .6), cin(z + d / 2, DECK + .6)) - w / 2 - .02, hgt = .55; box('wood', w, hgt, d, x, DECK + hgt / 2, z); box('trim', w + .02, .06, d + .02, x, DECK + hgt - .03, z); box('iron', w + .02, .06, .06, x, DECK + hgt * .6, z - d / 2);
    item('sea chest', 'cabin', x - w / 2, DECK, z - d / 2, x + w / 2, DECK + hgt, z + d / 2); }
  { // the chart table (the map table): a chart, a log, dividers and a candle; a stool
    const x = .55, z = -6.6, w = 1.1, d = .8, ht = .78; box('wood', w, .06, d, x, DECK + ht, z); for (const dx of [-w / 2 + .07, w / 2 - .07]) for (const dz of [-d / 2 + .07, d / 2 - .07]) box('dark', .06, ht - .03, .06, x + dx, DECK + (ht - .03) / 2, z + dz);
    box('paper', .7, .004, .5, x - .1, DECK + ht + .033, z, .12); box('dark', .22, .05, .3, x + .4, DECK + ht + .055, z - .15); { const g = new THREE.CylinderGeometry(.006, .006, .2, 4); g.rotateZ(1.2); g.translate(x - .05, DECK + ht + .04, z + .1); add('metal', g); }
    cyl('metal', .05, .06, .03, x + .4, DECK + ht + .045, z + .25, 8); cyl('paper', .02, .02, .1, x + .4, DECK + ht + .11, z + .25, 8); { const g = new THREE.SphereGeometry(.018, 6, 5); g.translate(x + .4, DECK + ht + .175, z + .25); add('flame', g); }
    cyl('dark', .18, .17, .45, x - .2, DECK + .225, z + .75, 10); item('chart table', 'cabin', x - w / 2, DECK, z - d / 2, x + w / 2, DECK + ht + .2, z + d / 2); item('stool', 'cabin', x - .38, DECK, z + .57, x - .02, DECK + .45, z + .93); }
  { // a lantern from the castle's beam, a rug, a shelf of books and bottles on the aft wall
    cyl('metal', .1, .12, .26, .55, cceil - .45, -6.6, 8); { const g = new THREE.SphereGeometry(.06, 8, 6); g.translate(.55, cceil - .46, -6.6); add('lamp', g); } box('iron', .01, .3, .01, .55, cceil - .17, -6.6); lights.push({ x: .55, y: cceil - .46, z: -6.6, warm: 1 });
    if (D.fur) { const g = new THREE.CircleGeometry(.7, 9); g.scale(1.2, 1, 1); g.rotateX(-Math.PI / 2); g.translate(.3, DECK + .006, -5.6); add('fur', g); } else { box('rug0', 1.2, .01, 1.0, .3, DECK + .006, -5.6); box('rug1', .9, .012, .7, .3, DECK + .008, -5.6); }
    const zs = cz0 + .9, sw = 2 * Math.min(cin(zs, DECK + 1.5), 1.2) - .2; box('wood', sw, .04, .25, 0, DECK + 1.5, zs); for (let k = 0; k < 7; k++) box(k % 3 ? 'cloth0' : 'trim', .06, .22, .18, -sw / 2 + .2 + k * .1, DECK + 1.63, zs);
    for (let k = 0; k < 4; k++) cyl('glass', .04, .045, .2, sw / 2 - .2 - k * .13, DECK + 1.62, zs, 8); item('shelf', 'cabin', -sw / 2, DECK + 1.48, zs - .13, sw / 2, DECK + 1.75, zs + .13); }

  // ── the galley under the forecastle ──
  const gz0 = S.castles.fore.z0, gz1 = S.castles.fore.z1;
  { const x = -.95, z = 6.55, w = 1.1, d = .9, ht = .55, fk = D.fire === 'tile' ? 'tile' : D.fire === 'iron' ? 'iron' : 'brick';
    box('sand', w + .2, .06, d + .2, x, DECK + .03, z);
    if (D.fire === 'iron') { for (let k = 0; k < 7; k++) { const a = k / 7 * Math.PI * 2, g = new THREE.DodecahedronGeometry(.13); worldUV(g, .8); g.translate(x + Math.cos(a) * .38, DECK + .14, z + Math.sin(a) * .32); add('dark', g); } cyl('iron', .36, .3, .12, x, DECK + .3, z, 14); }
    else { box(fk, w, ht, d, x, DECK + .06 + ht / 2, z); box('dark', w - .3, .08, d - .3, x, DECK + .06 + ht - .02, z); }
    { const g = new THREE.SphereGeometry(.16, 10, 8); g.scale(1.3, .6, 1); g.translate(x, DECK + (D.fire === 'iron' ? .4 : .06 + ht + .02), z); add('flame', g); } lights.push({ x, y: DECK + .9, z, warm: 2 });
    const cx = x - w / 2 - .05; box('iron', .05, 1.3, .05, cx, DECK + .7, z); box('iron', .7, .04, .04, cx + .35, DECK + 1.32, z); box('iron', .01, .3, .01, x, DECK + 1.15, z);
    { const g = new THREE.SphereGeometry(.2, 12, 8, 0, Math.PI * 2, Math.PI * .35, Math.PI * .65); g.translate(x, DECK + 1.05, z); add('iron', g); }
    cyl('wood', .28, .24, .7, .9, DECK + .35, 6.3, 12); for (const y of [.1, .6]) cyl('iron', .29, .29, .04, .9, DECK + y, 6.3, 12);
    item('firebox', 'galley', x - w / 2 - .1, DECK, z - d / 2 - .1, x + w / 2 + .1, DECK + 1.35, z + d / 2 + .1); item('water cask', 'galley', .62, DECK, 6.02, 1.18, DECK + .7, 6.58); }

  const G = new THREE.Group(); G.add(S.group); let tris = 0, draws = 0;
  for (const k in by) { const geo = mergeGeometries(by[k]), m = new THREE.Mesh(geo, M[k]); m.name = 'base:' + k; m.castShadow = !['flame', 'lamp'].includes(k); m.receiveShadow = true; G.add(m); tris += geo.attributes.position.count / 3; draws++; }
  return { group: G, ship: S, tris: Math.round(tris), draws, shipTris: S.tris, shipDraws: S.draws, items, hb, floor: FLOOR, beams, beamY, beamBottom: BEAM - BH / 2, deckUnder: DECK - .05,
    cabin: { z0: cz0, z1: cz1, floor: DECK, ceil: cceil }, galley: { z0: gz0, z1: gz1, floor: DECK, ceil: CY - .12 }, hatch: S.hatch, ladder: { foot, head }, lights, dress };
}

// The sloop's base (Session 1129; Michael's A on DECISION #418, the base in the hull's own lines, OG-027's ladder: the sloop a bunk and a
// chest). The smallest of the five classes (L 13, W 4.4, draft 1.05, the deck 1.0 over the sea, no castles) has room for one low hold
// under her deck and nothing else, so her base is that hold: entered by a ladder down her open hatch (ships.js, o.open), its floor of
// ceiling planks laid where the hull is 1.5 m across, the frames every 0.75 m, the deck beams every metre, a bulkhead at each end; a box
// bunk along the port side forward of the hatch (rest and save), the sea chest across from it (the stash), a water cask by the mast,
// a lantern from a beam, the mast through the hold to its step. No cabin, no galley, no bench or still: those come with the cog. It is
// sitting headroom, as a sloop's was: a 1.8 m person stoops everywhere below. Dressed by island as the cog's (DRESS).
// -> as shipBase: { group, ship, tris, draws, items, hb, floor, beams, beamY, beamBottom, deckUnder, hold { z0, z1 }, hatch, ladder, lights, dress }
export function sloopBase(o = {}) {
  const dress = DRESS[o.dress] ? o.dress : 'gatelands', D = DRESS[dress], M = baseMats(dress);
  const S = (dress === 'mark' ? markSloop : dress === 'aurenne' ? aurenneSloop : gatelandsSloop)({ open: true }, stream(`sloop:${dress}`));
  const DECK = S.deck, TH = .035, by = {}, items = [], lights = [];
  const hb = (z, y) => { let lo = 0, hi = 1; for (let k = 0; k < 30; k++) { const m = (lo + hi) / 2; if (S.sect(z, m)[1] < y) lo = m; else hi = m; } return S.sect(z, lo)[0] - TH - .03; };
  const add = (key, g) => { const x = g.index ? g.toNonIndexed() : g; for (const k of Object.keys(x.attributes)) if (!['position', 'normal', 'uv'].includes(k)) x.deleteAttribute(k);
    if (!x.attributes.uv) worldUV(x, .8); (by[key] ||= []).push(x); return x; };
  const box = (key, w, h, d, x, y, z, ry = 0) => { const g = new THREE.BoxGeometry(w, h, d); worldUV(g, .8); if (ry) g.rotateY(ry); g.translate(x, y, z); return add(key, g); };
  const cyl = (key, r0, r1, h, x, y, z, n = 12) => { const g = new THREE.CylinderGeometry(r0, r1, h, n); worldUV(g, .8); g.translate(x, y, z); return add(key, g); };
  const item = (name, place, x0, y0, z0, x1, y1, z1) => { items.push({ name, place, box: [x0, y0, z0, x1, y1, z1].map(v => +v.toFixed(3)) }); };
  // the hold from the bulkhead aft of the ladder to the one forward of the mast; its floor where the hull is 1.5 m across amidships
  const hz0 = -4.0, hz1 = 2.0, mid = -1.0; let FLOOR = -1; for (let y = -.9; y < .2; y += .01) if (hb(mid, y) >= .75) { FLOOR = +y.toFixed(2); break; }
  const BEAM = DECK - .15, BH = .14, beamY = BEAM - BH / 2;
  { const PW = .2; for (let x = -1.6 + PW / 2; x < 1.6; x += PW) { const zz = []; for (let z = hz0; z <= hz1 + 1e-6; z += .1) if (hb(z, FLOOR) - .02 >= Math.abs(x) + PW / 2) zz.push(z); if (zz.length < 2) continue;
      box('plank', PW - .01, .05, zz[zz.length - 1] - zz[0], x, FLOOR - .025, (zz[0] + zz[zz.length - 1]) / 2); } }
  for (let z = hz0 + .25; z <= hz1 - .24; z += .75) for (const e of [1, -1]) { const n = 5; for (let k = 0; k < n; k++) { const ya = FLOOR + (DECK - FLOOR - .05) * k / n, yb = FLOOR + (DECK - FLOOR - .05) * (k + 1) / n, xa = hb(z, ya) - .07, xb = hb(z, yb) - .07;
      const L = Math.hypot(xb - xa, yb - ya), g = new THREE.BoxGeometry(.12, L + .02, .14); worldUV(g, .8); g.rotateZ(-e * Math.atan2(xb - xa, yb - ya)); g.translate(e * (xa + xb) / 2, (ya + yb) / 2, z); add('dark', g); } }
  const beams = [-3.5, -2.75, -1.25, -.25, .5, 1.5]; // none over the hatch (z -2.6 to -1.4) but its ends' carlings
  for (const z of beams) { const w = 2 * (hb(z, BEAM) - .02); box('dark', w, BH, .16, 0, BEAM, z); for (const e of [1, -1]) box('dark', .12, .36, .12, e * (hb(z, BEAM - .25) - .08), BEAM - .22, z); }
  for (const e of [1, -1]) box('dark', .12, .12, 1.5, e * .66, BEAM + .01, -2.0);
  for (const zb of [hz0, hz1]) { const sh = new THREE.Shape(), ys = []; for (let k = 0; k <= 10; k++) ys.push(FLOOR - .05 + (DECK - FLOOR) * k / 10);
    sh.moveTo(-hb(zb, ys[0]), ys[0]); for (const y of ys) sh.lineTo(-hb(zb, y), y); for (const y of [...ys].reverse()) sh.lineTo(hb(zb, y), y); sh.lineTo(-hb(zb, ys[0]), ys[0]);
    const g = new THREE.ExtrudeGeometry(sh, { depth: .05, bevelEnabled: false }); g.translate(0, 0, zb - (zb < 0 ? .05 : 0)); worldUV(g, .8); add('wood', g);
    for (let x = -1.8; x <= 1.8; x += .3) if (hb(zb, (FLOOR + DECK) / 2) > Math.abs(x) + .05 && hb(zb, FLOOR) > Math.abs(x) + .05) box('dark', .03, DECK - FLOOR - .05, .02, x, (FLOOR + DECK) / 2, zb + (zb < 0 ? .01 : -.01)); }
  // the ladder from the floor aft up through the hatch to its coaming's aft side
  const head = [0, DECK + .3, -2.55], rise = head[1] - FLOOR, foot = [0, FLOOR, +(head[2] - rise * .45).toFixed(2)];
  { const d = new THREE.Vector3(0, head[1] - foot[1], head[2] - foot[2]), L = d.length(), a = Math.atan2(d.z, d.y);
    for (const e of [-.24, .24]) { const g = new THREE.BoxGeometry(.06, L, .1); worldUV(g, .8); g.rotateX(a); g.translate(e, (foot[1] + head[1]) / 2, (foot[2] + head[2]) / 2); add('wood', g); }
    for (let k = 1; k * .28 < rise - .1; k++) { const f = k * .28 / rise; box('wood', .46, .04, .12, 0, foot[1] + rise * f, foot[2] + (head[2] - foot[2]) * f); }
    item('ladder', 'hatch', -.27, FLOOR, foot[2], .27, DECK + .3, head[2]); }
  // the mast through the hold to its step on the keelson (Aurenne's raked forward with her lateen)
  { const mz = S.mast[1]; cyl('dark', .16, .16, DECK - FLOOR, 0, (FLOOR + DECK) / 2, mz, 12); box('dark', .26, .2, 1.1, 0, FLOOR + .1, mz); }
  const onFloor = (z, half) => hb(z, FLOOR) - .04 - half, inAt = (z0, z1, y) => Math.min(hb(z0, y), hb(z1, y));
  { // the berth along the port side forward of the hatch, raised against the side as a sloop's was (the hull is 1.5 m across at the
    // floor and 2.5 m half a metre up): its frame, a straw tick, the island's blanket (the Mark's furs), a bolster, boards at its ends, and a
    // board front down to the floor with a locker door in it
    const z0 = -1.15, z1 = .75, w = .72, y0 = FLOOR + .32, top = y0 + .62, xo = -(inAt(z0, z1, y0) - .02), x = xo + w / 2, xi = xo + w;
    box('wood', w, .14, z1 - z0, x, y0 + .07, (z0 + z1) / 2); box('cloth1', w - .1, .12, z1 - z0 - .1, x, y0 + .2, (z0 + z1) / 2); box(D.fur ? 'fur' : 'cloth0', w - .06, .05, (z1 - z0) * .64, x, y0 + .29, z1 - (z1 - z0) * .34);
    box('cloth1', .46, .1, .28, x, y0 + .3, z0 + .24); for (const zz of [z0, z1]) box('wood', w - .04, top - y0, .06, x + .02, y0 + (top - y0) / 2, zz); box('wood', .06, .22, z1 - z0, xi - .03, y0 + .2, (z0 + z1) / 2);
    box('wood', .05, y0 - FLOOR, z1 - z0, xi - .025, (FLOOR + y0) / 2, (z0 + z1) / 2); box('dark', .02, .22, .5, xi + .005, FLOOR + .16, -.2); box('iron', .02, .05, .05, xi + .015, FLOOR + .16, .02);
    item('bunk', 'hold', xo, y0, z0 - .03, xi, top, z1 + .03); item('bunk front', 'hold', xi - .05, FLOOR, z0, xi, y0, z1); }
  { // the sea chest across from the bunk, iron-bound, the island's trim on its lid
    const z = -.2, w = .5, d = .85, hgt = .5, x = Math.min(onFloor(z - d / 2, w / 2), onFloor(z + d / 2, w / 2)) - .02; box('wood', w, hgt, d, x, FLOOR + hgt / 2, z); box('trim', w + .02, .06, d + .02, x, FLOOR + hgt - .03, z);
    for (const dz of [-.28, .28]) box('iron', w + .02, hgt + .02, .05, x, FLOOR + hgt / 2, z + dz); item('sea chest', 'hold', x - w / 2, FLOOR, z - d / 2, x + w / 2, FLOOR + hgt, z + d / 2); }
  { // the water cask in chocks forward by the mast, to starboard
    const z = 1.45, R = .26, x = Math.min(onFloor(z - R, R), onFloor(z + R, R)) - .02; cyl('wood', R * .9, R * .82, .7, x, FLOOR + .35, z, 14); for (const y of [.1, .6]) cyl('iron', R * .86 + .01, R * .86 + .01, .04, x, FLOOR + y, z, 14);
    item('water cask', 'hold', x - R, FLOOR, z - R, x + R, FLOOR + .7, z + R); }
  { // the lantern from the beam over the bunk's foot, and the island's rug (the Mark's hide) between the bunk and the chest
    const z = -.25, x = .05; cyl('metal', .09, .1, .22, x, beamY - .26, z, 8); { const g = new THREE.SphereGeometry(.05, 8, 6); g.translate(x, beamY - .27, z); add('lamp', g); } box('iron', .01, .14, .01, x, beamY - .08, z); lights.push({ x, y: beamY - .27, z, warm: 1 });
    if (D.fur) { const g = new THREE.CircleGeometry(.55, 9); g.scale(1, 1.4, 1); g.rotateX(-Math.PI / 2); g.translate(.05, FLOOR + .006, -.2); add('fur', g); }
    else { box('rug0', .7, .01, 1.5, .05, FLOOR + .006, -.2); box('rug1', .5, .012, 1.2, .05, FLOOR + .008, -.2); } }
  const G = new THREE.Group(); G.add(S.group); let tris = 0, draws = 0;
  for (const k in by) { const geo = mergeGeometries(by[k]), m = new THREE.Mesh(geo, M[k]); m.name = 'base:' + k; m.castShadow = !['flame', 'lamp'].includes(k); m.receiveShadow = true; G.add(m); tris += geo.attributes.position.count / 3; draws++; }
  return { group: G, ship: S, kind: 'sloop', tris: Math.round(tris), draws, shipTris: S.tris, shipDraws: S.draws, items, hb, floor: FLOOR, beams, beamY, beamBottom: BEAM - BH / 2, deckUnder: DECK - .05,
    hold: { z0: hz0, z1: hz1 }, hatch: S.hatch, ladder: { foot, head }, lights, dress };
}
