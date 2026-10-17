// The schools' magical implements in the new kit (the concept artist, 16 Oct 2026; backlog L7 "Magical implements by school",
// OG-094 kept with Tine redone as fire). One kit, in metres, for the builders to lift: every piece is built in its own frame and
// merged by material, as props.js does.
// SCHOOLS: each school's colour, its glow, its stone and its metal (OG-094: Uisce blue with a crescent, Cloch brown with a mountain,
//   Scáth purple with an eye, Solas gold with a sun, Gaoth grey with a spiral; Tine red and orange with a flame, redone as fire).
// implement(school, kind) -> { group, tris, draws, size }, kind one of 'staff' | 'hand' | 'focus' | 'tome': the high tier, one set
//   per school, OG-094's columns. A staff stands on its butt (y 0, the shaft up +y); a wand, a maul or a dagger lies along +y from its
//   pommel; a focus and a tome sit on y 0 as they lie on a table.
//   Tine: the ember staff (iron flame-tines round a live coal, charred oak), the brand (a wand with a coal at its tip), the hearth
//     censer (an iron cage on a foot, a coal inside), the tome in red leather.
//   Uisce: the tidecaller (a whalebone crook curled as a breaking wave round a moonpearl), the moonpearl wand (a silver crescent at
//     its tip), the stormglass (a glass ball half full of sea on a three-claw stand), the tome in sealskin.
//   Cloch: the runebound staff (three granite rings and a standing-stone head, amber runes), the stoneheart maul (a granite head
//     on an oak haft, banded in iron), the geomancer's foci (three stones that hang over a slate), the tome in slate boards.
//   Scáth: the nightweave staff (three ebony strands twisted, opening at the head into a cage round an eye), the veil dagger
//     (blued steel), the umbral lens (black glass in a blued ring), the tome in black.
//   Solas: the sunspire (a gold sun of twelve rays round a citrine, white oak), the dawnshard wand, the beacon (a sun medallion
//     on an ivory handle), the tome in white vellum.
//   Gaoth: the skyrunner (an open silver spiral round a floating quartz, feathers tied under it), the zephyr wand (twisted ash,
//     three vanes), the gale ring (a hoop of four vanes round a bead), the tome in grey cloth.
// islandStaff(island, school) -> the same: the common tier, a staff as each island makes it, the school shown only by its stone
//   (OG-094's cultural styles): the Gatelands blackthorn, a natural fork lashed with cord round the stone, a bone collar; the Mark
//   pine shod and banded in iron, the stone caged in four iron straps; Aurenne slim olive with gilt bands, a bronze crown round a cut
//   stone and a tassel in the school's colour.
// The shaft of every staff is 2.6 cm through for 0.6 to 1.3 m from its butt, the spear's (people.js's SPEAR_R), so a person's
// fist closes on it as it closes on the spear (Session 909); it swells above and below the hand.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { TEX, worldUV } from './common.js';

const S = (r, g, b) => new THREE.Color().setRGB(r, g, b, THREE.SRGBColorSpace);
export const SCHOOLS = {
  tine: { name: 'Tine', word: 'fire', cloth: [.5, .1, .05], glow: [1, .4, .08], gi: 3, stone: [.3, .07, .03], metal: 'iron', mark: [.72, .5, .26], markGlow: .9 },
  uisce: { name: 'Uisce', word: 'water', cloth: [.1, .24, .36], glow: [.5, .78, 1], gi: .9, stone: [.78, .88, .94], metal: 'silver', mark: [.8, .82, .85], markGlow: .3 },
  cloch: { name: 'Cloch', word: 'stone', cloth: [.36, .25, .15], glow: [1, .62, .2], gi: 2.2, stone: [.46, .42, .37], metal: 'iron', mark: [.42, .43, .45], markGlow: .5 },
  scath: { name: 'Scáth', word: 'shadow', cloth: [.07, .05, .09], glow: [.6, .28, 1], gi: 2.6, stone: [.05, .035, .07], metal: 'blued', mark: [.55, .4, .75], markGlow: 1 },
  solas: { name: 'Solas', word: 'light', cloth: [.9, .86, .76], glow: [1, .84, .45], gi: 2.4, stone: [1, .78, .36], metal: 'gold', mark: [.86, .62, .24], markGlow: .2 },
  gaoth: { name: 'Gaoth', word: 'wind', cloth: [.42, .47, .53], glow: [.82, .92, 1], gi: 1.4, stone: [.9, .92, .95], metal: 'silver', mark: [.8, .82, .85], markGlow: .2 } };
export const KINDS = ['staff', 'hand', 'focus', 'tome'];
export const ISLANDS = ['gatelands', 'mark', 'aurenne'];

// ── materials: wood takes the slices' beam grain as a normal map only, so a 3 cm shaft is not darkened by a plank texture ──
const MAT = {};
const WOOD = { char: [.09, .06, .05], oak: [.34, .24, .15], ash: [.68, .56, .4], blackthorn: [.2, .13, .1], ebony: [.06, .05, .07], whale: [.86, .82, .72], whiteoak: [.86, .8, .68], olive: [.56, .44, .28], pine: [.32, .23, .15], ivory: [.92, .88, .78] };
const METAL = { iron: [.22, .22, .23, .5], bronze: [.6, .42, .2, .35], gold: [.88, .64, .26, .26], silver: [.82, .84, .87, .22], blued: [.17, .18, .28, .3] };
const PLAIN = { leatherRed: [.42, .09, .05, .7], leatherBrown: [.3, .19, .11, .75], leatherBlack: [.06, .05, .05, .55], seal: [.16, .22, .26, .5], wool: [.36, .36, .34, .95], cord: [.62, .52, .36, .95],
  vellum: [.88, .83, .7, .85], pages: [.86, .8, .66, .9], slate: [.22, .24, .27, .6], bone: [.86, .8, .66, .6], feather: [.9, .9, .88, .8], featherTip: [.18, .18, .2, .8], greyCloth: [.4, .45, .5, .9], pearlStand: [.82, .84, .87, .22] };
export function M(key) {
  if (MAT[key]) return MAT[key];
  const [kind, s] = key.split(':'), SC = SCHOOLS[s]; let m;
  if (WOOD[kind]) m = new THREE.MeshStandardMaterial({ color: S(...WOOD[kind]), roughness: .7, normalMap: TEX.beam.normalMap, normalScale: new THREE.Vector2(.5, .5) });
  else if (METAL[kind]) m = new THREE.MeshStandardMaterial({ color: S(...METAL[kind]), roughness: METAL[kind][3], metalness: .9 });
  else if (PLAIN[kind]) m = new THREE.MeshStandardMaterial({ color: S(...PLAIN[kind]), roughness: PLAIN[kind][3], metalness: 0, side: /^feather/.test(kind) ? THREE.DoubleSide : THREE.FrontSide });
  else if (kind === 'granite') m = new THREE.MeshStandardMaterial({ color: S(.5, .46, .41), roughness: .9, map: TEX.rock.map, normalMap: TEX.rock.normalMap });
  else if (kind === 'glow') m = new THREE.MeshStandardMaterial({ color: S(...SC.glow), emissive: S(...SC.glow), emissiveIntensity: SC.gi, roughness: .4 });
  // a school's stone in the common tier: its colour, lit from inside at a third of the high tier's glow
  else if (kind === 'gem') m = new THREE.MeshStandardMaterial({ color: S(...SC.stone), emissive: S(...SC.glow), emissiveIntensity: SC.gi * .35, roughness: .25, metalness: .1 });
  else if (kind === 'cloth') m = new THREE.MeshStandardMaterial({ color: S(...SC.cloth), roughness: .85, side: THREE.DoubleSide });
  else if (kind === 'pearl') m = new THREE.MeshStandardMaterial({ color: S(.86, .92, .96), emissive: S(.5, .75, 1), emissiveIntensity: .7, roughness: .12 });
  else if (kind === 'glass') m = new THREE.MeshStandardMaterial({ color: S(.8, .9, .95), roughness: .04, metalness: .1, transparent: true, opacity: .28, depthWrite: false });
  else if (kind === 'sea') m = new THREE.MeshStandardMaterial({ color: S(.1, .35, .45), emissive: S(.15, .45, .6), emissiveIntensity: .5, roughness: .1, transparent: true, opacity: .8 });
  else if (kind === 'obsidian') m = new THREE.MeshStandardMaterial({ color: S(.04, .03, .05), roughness: .06, metalness: .3 });
  else if (kind === 'lens') m = new THREE.MeshStandardMaterial({ color: S(.03, .02, .05), emissive: S(.25, .1, .45), emissiveIntensity: .35, roughness: .03, metalness: .4, transparent: true, opacity: .9 });
  else if (kind === 'mark') m = new THREE.MeshStandardMaterial({ color: S(...SC.mark), emissive: S(...SC.glow), emissiveIntensity: SC.markGlow, metalness: .8, roughness: .3, alphaMap: markTex(s), alphaTest: .45 });
  else throw new Error('no material ' + key);
  m.name = key; return MAT[key] = m;
}

// each school's mark in its ring (gates.js's sigilTex, the gates' own marks), white on clear, for an alpha map
const MARKS = {};
export function markTex(mark) {
  if (MARKS[mark]) return MARKS[mark];
  const c = document.createElement('canvas'); c.width = c.height = 512; const x = c.getContext('2d'); x.strokeStyle = '#fff'; x.fillStyle = '#fff'; x.lineCap = 'round'; x.lineJoin = 'round';
  x.lineWidth = 22; x.beginPath(); x.arc(256, 256, 200, 0, 7); x.stroke(); x.lineWidth = 9; x.beginPath(); x.arc(256, 256, 170, 0, 7); x.stroke(); x.lineWidth = 26; x.beginPath();
  if (mark === 'tine') { x.moveTo(256, 92); x.bezierCurveTo(330, 190, 360, 250, 340, 320); x.bezierCurveTo(320, 390, 190, 400, 172, 320); x.bezierCurveTo(160, 260, 210, 230, 220, 170); x.bezierCurveTo(250, 210, 262, 240, 256, 280); x.bezierCurveTo(300, 250, 280, 170, 256, 92); }
  else if (mark === 'uisce') { x.arc(256, 256, 120, Math.PI * .3, Math.PI * 1.7); x.moveTo(256 + 120 * Math.cos(Math.PI * 1.7), 256 + 120 * Math.sin(Math.PI * 1.7)); x.quadraticCurveTo(170, 256, 256 + 120 * Math.cos(Math.PI * .3), 256 + 120 * Math.sin(Math.PI * .3)); }
  else if (mark === 'cloch') { x.moveTo(110, 350); x.lineTo(210, 160); x.lineTo(262, 250); x.lineTo(310, 190); x.lineTo(402, 350); x.closePath(); x.moveTo(180, 215); x.lineTo(210, 236); x.lineTo(236, 206); }
  else if (mark === 'scath') { x.moveTo(110, 256); x.quadraticCurveTo(256, 120, 402, 256); x.quadraticCurveTo(256, 392, 110, 256); x.stroke(); x.beginPath(); x.arc(256, 256, 48, 0, 7); x.stroke(); x.beginPath(); x.arc(256, 256, 18, 0, 7); x.fill(); x.beginPath(); }
  else if (mark === 'solas') { x.arc(256, 256, 64, 0, 7); for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2, r0 = 92, r1 = i % 2 ? 130 : 156; x.moveTo(256 + Math.cos(a) * r0, 256 + Math.sin(a) * r0); x.lineTo(256 + Math.cos(a) * r1, 256 + Math.sin(a) * r1); } }
  else { for (let i = 0; i <= 120; i++) { const t = i / 120, a = t * Math.PI * 4.2, r = 10 + t * 140; const px = 256 + Math.cos(a) * r, py = 256 + Math.sin(a) * r; i ? x.lineTo(px, py) : x.moveTo(px, py); } }
  x.stroke(); const t = new THREE.CanvasTexture(c); t.anisotropy = 8; return MARKS[mark] = t;
}

// ── shapes ──
const V = (x, y, z) => new THREE.Vector3(x, y, z);
const T = (x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0, s = 1) => new THREE.Matrix4().compose(V(x, y, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(rx, ry, rz, 'YXZ')), typeof s === 'number' ? V(s, s, s) : V(...s));
const lathe = (prof, seg = 14) => new THREE.LatheGeometry(prof.map(([r, y]) => new THREE.Vector2(Math.max(r, 1e-4), y)), seg);
const ring = (R, r, seg = 20, arc = Math.PI * 2) => new THREE.TorusGeometry(R, r, 6, seg, arc).rotateX(Math.PI / 2);   /* round the y axis */
const box = (w, h, d) => new THREE.BoxGeometry(w, h, d);
const ball = (r, w = 16, h = 10) => new THREE.SphereGeometry(r, w, h);
// a tube along points that runs from r0 to r1 over its length (TubeGeometry is one radius: each ring is scaled about the curve)
function taper(pts, r0, r1, seg = 24, rs = 7) { const c = new THREE.CatmullRomCurve3(pts.map(p => V(...p))), g = new THREE.TubeGeometry(c, seg, 1, rs, false), P = g.attributes.position, v = V();
  for (let i = 0; i <= seg; i++) { const t = i / seg, p = c.getPointAt(t), r = r0 + (r1 - r0) * t; for (let j = 0; j <= rs; j++) { const k = i * (rs + 1) + j; v.fromBufferAttribute(P, k).sub(p).multiplyScalar(r).add(p); P.setXYZ(k, v.x, v.y, v.z); } }
  g.computeVertexNormals(); return g; }
// a wrap of cord or a thong: a helix of `turns` round the y axis at radius R from y0 to y1
const helix = (R, y0, y1, turns, r = .0022, ph = 0) => taper(Array.from({ length: turns * 10 + 1 }, (_, i) => { const t = i / (turns * 10), a = ph + t * turns * Math.PI * 2; return [Math.cos(a) * R, y0 + (y1 - y0) * t, Math.sin(a) * R]; }), r, r, turns * 14, 5);
// a crystal: a six-sided double point, r across and h long, its waist at w of the length
const crystal = (r, h, w = .35, sides = 6) => lathe([[0, 0], [r, h * w], [r * .92, h * .75], [0, h]], sides);
// a rough stone: a ball pushed about by smooth noise of its own position, so shared vertices stay shared
function rough(g, amp, ph = 1.3, f = 60) { const P = g.attributes.position, v = V(); for (let i = 0; i < P.count; i++) { v.fromBufferAttribute(P, i); const l = v.length() || 1, n = Math.sin(v.x * f + ph) * Math.sin(v.y * f * 1.3 + ph * 2) * Math.sin(v.z * f + ph * 3) + .5 * Math.sin(v.x * f * 2.7 + ph) * Math.sin(v.z * f * 2.3 + ph);
  v.multiplyScalar((l + n * amp) / l); P.setXYZ(i, v.x, v.y, v.z); } g.computeVertexNormals(); return g; }
// a shaft by its radius up its length, [r, y] pairs; the fist's stretch (0.6 to 1.3 m) at the spear's 1.3 cm
const shaft = (prof, seg = 12) => lathe(prof, seg);
const GRIP_R = .013;

function kit() {
  const B = new Map();
  const put = (geo, key, m = null) => { let g = geo.index ? geo.toNonIndexed() : geo.clone(); geo.dispose?.();
    if (m) g.applyMatrix4(m); if (!g.attributes.normal) g.computeVertexNormals();
    if (!/^mark/.test(key)) worldUV(g, 6); else if (!g.attributes.uv) worldUV(g, 6);
    for (const k of Object.keys(g.attributes)) if (!['position', 'normal', 'uv'].includes(k)) g.deleteAttribute(k);
    if (!B.has(key)) B.set(key, []); B.get(key).push(g); };
  const finish = (extra = {}) => { const group = new THREE.Group(); let tris = 0;
    for (const [k, gs] of B) { const g = mergeGeometries(gs, false); const m = new THREE.Mesh(g, M(k)); m.name = k; m.castShadow = !/glass|mark|sea/.test(k); m.receiveShadow = true; group.add(m); tris += g.attributes.position.count / 3; }
    const bb = new THREE.Box3().setFromObject(group), sz = bb.getSize(V());
    return { group, tris: Math.round(tris), draws: group.children.length, size: [+sz.x.toFixed(3), +sz.y.toFixed(3), +sz.z.toFixed(3)], ...extra }; };
  return { put, finish };
}
// shared pieces: an iron or bronze shoe on the butt, a band, a leather grip wrapped with a thong
function shoe(K, metal, r = .0135, h = .07, spike = false) { K.put(lathe(spike ? [[0, 0], [r * .6, .03], [r + .0015, .042], [r + .0015, h], [r, h + .004]] : [[0, 0], [r * .8, 0], [r + .0015, .008], [r + .0015, h], [r, h + .004]]), metal); }
const band = (K, metal, y, r, w = .006) => K.put(lathe([[r, y - w / 2], [r + .0028, y - w / 4], [r + .0028, y + w / 4], [r, y + w / 2]], 16), metal);
function grip(K, key, y0 = .82, y1 = 1.18, thong = key) { K.put(lathe([[GRIP_R, y0 - .004], [GRIP_R + .0012, y0], [GRIP_R + .0012, y1], [GRIP_R, y1 + .004]], 14), key); K.put(helix(GRIP_R + .0016, y0, y1, 9, .0011), thong); }

// ── the high tier, one set a school ──
const BUILD = {
  tine: {
    staff(K) { K.put(shaft([[.0115, 0], [.0135, .06], [GRIP_R, .6], [GRIP_R, 1.3], [.0155, 1.5], [.0175, 1.6], [.015, 1.63], [0, 1.635]]), 'char'); shoe(K, 'iron');
      grip(K, 'leatherRed', .84, 1.16, 'iron'); band(K, 'iron', 1.45, .0153); band(K, 'iron', 1.6, .0175, .02);
      // five iron tines rise from the collar, flare and curl in over the coal, each turning a little as it climbs, as a flame does
      for (let i = 0; i < 5; i++) { const a0 = i / 5 * Math.PI * 2, pts = []; for (let k = 0; k <= 8; k++) { const t = k / 8, a = a0 + t * .9, r = .016 + Math.sin(Math.PI * Math.min(1, t * 1.15)) * .046 - t * t * .012, y = 1.6 + t * (.25 + (i % 2) * .04); pts.push([Math.cos(a) * r, y, Math.sin(a) * r]); }
        K.put(taper(pts, .0052, .0011, 20, 6), 'iron'); }
      K.put(rough(new THREE.IcosahedronGeometry(.031, 2), .006, 2.1), 'glow:tine', T(0, 1.715, 0));
      K.put(rough(new THREE.IcosahedronGeometry(.036, 2), .004, 4.4), 'iron', T(0, 1.68, 0, 0, 0, 0, [1, .45, 1])); /* the cup the coal sits in */ },
    hand(K) { K.put(lathe([[0, 0], [.012, .004], [.013, .02], [.009, .028], [.0095, .1], [.008, .11], [.0068, .3], [.005, .335], [0, .338]]), 'char'); band(K, 'iron', .03, .0095, .01); band(K, 'iron', .105, .0085, .008);
      K.put(rough(new THREE.IcosahedronGeometry(.0085, 1), .0015, 1.7), 'glow:tine', T(0, .34, 0)); K.put(rough(new THREE.IcosahedronGeometry(.012, 1), .002), 'iron', T(0, .006, 0, 0, 0, 0, [1, .6, 1])); },
    focus(K) { const c = .085, R = .055; K.put(lathe([[0, 0], [.04, 0], [.042, .006], [.022, .02], [.012, .032], [.016, c - R + .004], [0, c - R + .004]], 18), 'iron');
      for (let i = 0; i < 4; i++) K.put(new THREE.TorusGeometry(R, .0028, 5, 32), 'iron', T(0, c, 0, 0, i * Math.PI / 4, 0)); K.put(ring(R, .003, 32), 'iron', T(0, c, 0)); K.put(ring(R * .7, .0025, 28), 'iron', T(0, c + R * .71, 0)); K.put(ring(R * .7, .0025, 28), 'iron', T(0, c - R * .71, 0));
      K.put(rough(new THREE.IcosahedronGeometry(.026, 2), .006, .7), 'glow:tine', T(0, c - .008, 0)); K.put(new THREE.TorusGeometry(.011, .0025, 5, 14), 'iron', T(0, c + R + .01, 0)); /* the carrying ring */ },
    tome(K) { tome(K, 'tine', { cover: 'leatherRed', metal: 'iron' }); } },
  uisce: {
    staff(K) { K.put(shaft([[.012, 0], [.014, .06], [GRIP_R, .6], [GRIP_R, 1.3], [.0145, 1.45], [.0158, 1.53], [.0145, 1.56]]), 'whale'); shoe(K, 'silver');
      grip(K, 'seal', .84, 1.16, 'silver'); for (const y of [.5, 1.36, 1.5]) band(K, 'silver', y, y > 1.4 ? .0158 : GRIP_R + .0005);
      // the crook rises off the shaft and curls over like a breaking wave, tightening round the pearl
      const pts = [[0, 1.5, 0], [0, 1.6, 0], [.002, 1.67, 0]], cx = .068, cy = 1.7; for (let k = 0; k <= 22; k++) { const t = k / 22, a = Math.PI - t * Math.PI * 1.75, r = .068 - t * .038; pts.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r * 1.08 + .01 * t, 0]); }
      K.put(taper(pts, .0158, .005, 48, 10), 'whale');
      K.put(ball(.022, 20, 14), 'pearl', T(cx + .004, cy + .004, 0)); },
    hand(K) { K.put(lathe([[0, 0], [.009, .003], [.0095, .016], [.0085, .02], [.0088, .11], [.0065, .3], [.0045, .318], [0, .32]]), 'whale'); band(K, 'silver', .02, .0085, .008); band(K, 'silver', .11, .0086, .006);
      K.put(new THREE.TorusGeometry(.017, .0024, 6, 22, Math.PI * 1.35), 'silver', T(0, .331, 0, 0, 0, -Math.PI * 1.17)); K.put(ball(.0085, 14, 10), 'pearl', T(0, .334, 0)); },
    focus(K) { const R = .056, c = .02 + R; K.put(lathe([[0, 0], [.038, 0], [.04, .005], [.03, .012], [.03, .02], [0, .02]], 22), 'silver');
      for (let i = 0; i < 3; i++) { const a = i / 3 * Math.PI * 2, pts = [[Math.cos(a) * .026, .016, Math.sin(a) * .026], [Math.cos(a) * .046, .03, Math.sin(a) * .046], [Math.cos(a) * .058, c - .01, Math.sin(a) * .058], [Math.cos(a) * .05, c + .02, Math.sin(a) * .05]]; K.put(taper(pts, .004, .0015, 14, 5), 'silver'); }
      K.put(ball(R, 28, 18), 'glass', T(0, c, 0)); K.put(new THREE.SphereGeometry(R * .93, 26, 8, 0, Math.PI * 2, Math.PI * .56, Math.PI * .44), 'sea', T(0, c, 0));
      K.put(new THREE.CircleGeometry(R * .93 * Math.sin(Math.PI * .56), 26).rotateX(-Math.PI / 2), 'sea', T(0, c + R * .93 * Math.cos(Math.PI * .56), 0)); },
    tome(K) { tome(K, 'uisce', { cover: 'seal', metal: 'silver' }); } },
  cloch: {
    staff(K) { K.put(shaft([[.012, 0], [.0145, .06], [GRIP_R, .6], [GRIP_R, 1.3], [.016, 1.6], [.017, 1.64], [0, 1.645]]), 'oak'); shoe(K, 'iron', .0145, .08);
      grip(K, 'leatherBrown', .84, 1.16, 'leatherBrown');
      // three granite rings on the shaft, each cut with amber runes; then a standing stone for a head, socketed in iron
      for (const [i, y] of [1.3, 1.4, 1.5].entries()) { K.put(rough(new THREE.TorusGeometry(.024, .011, 8, 18).rotateX(Math.PI / 2), .0018, i + 1, 90), 'granite', T(0, y, 0));
        for (let k = 0; k < 5; k++) { const a = k / 5 * Math.PI * 2 + i; K.put(box(.0028, .011 + (k % 2) * .004, .002), 'glow:cloch', T(Math.cos(a) * .0352, y, Math.sin(a) * .0352, 0, -a + Math.PI / 2, (k % 3 - 1) * .4)); } }
      K.put(lathe([[.017, 1.6], [.026, 1.62], [.026, 1.66], [.019, 1.672]], 14), 'iron');
      K.put(rough(lathe([[.001, 1.655], [.034, 1.67], [.043, 1.72], [.04, 1.78], [.026, 1.84], [.001, 1.86]], 12), .003, .8, 70), 'granite');
      for (let k = 0; k < 4; k++) { const a = k * Math.PI / 2; K.put(box(.0035, .05, .002), 'glow:cloch', T(Math.cos(a) * .0428, 1.745, Math.sin(a) * .0428, 0, -a + Math.PI / 2, 0)); K.put(box(.016, .003, .002), 'glow:cloch', T(Math.cos(a) * .0425, 1.735 + (k % 2) * .02, Math.sin(a) * .0425, 0, -a + Math.PI / 2, .5)); } },
    // the maul: an oak haft of 0.82 m, its grip at the foot, and a granite head 0.24 × 0.13 × 0.13 m bound in two iron bands
    hand(K) { K.put(lathe([[0, 0], [.018, .004], [.018, .03], [.016, .04], [.016, .62], [.02, .72], [.02, .76], [0, .762]]), 'oak'); grip(K, 'leatherBrown', .04, .3, 'leatherBrown'); band(K, 'iron', .03, .017, .02);
      for (const s of [-1, 1]) K.put(box(.006, .2, .036), 'iron', T(s * .021, .63, 0));
      K.put(rough(new RoundedBoxGeometry(.24, .13, .13, 2, .018), .003, 2, 80), 'granite', T(0, .8, 0));
      for (const x of [-.07, .07]) K.put(box(.012, .136, .136), 'iron', T(x, .8, 0));
      for (const s of [-1, 1]) { K.put(box(.04, .005, .002), 'glow:cloch', T(0, .82, s * .066)); K.put(box(.005, .05, .002), 'glow:cloch', T(-.012, .8, s * .066)); K.put(box(.005, .034, .002), 'glow:cloch', T(.014, .79, s * .066, 0, 0, .5)); } },
    // three stones that hang over a slate: the geomancer keeps them in the air (the slate is 16 × 10 cm)
    focus(K) { K.put(new RoundedBoxGeometry(.18, .012, .11, 2, .003), 'slate', T(0, .006, 0));
      [[-.05, .052, 0, .3, .4], [.0, .08, .01, .9, .1], [.052, .058, -.004, .2, 1.1]].forEach(([x, y, z, rx, ry], i) => { K.put(rough(new RoundedBoxGeometry(.046, .046, .046, 2, .006), .0012, i * 2, 120), 'granite', T(x, y, z, rx, ry, rx * .5));
        const n = V(0, 1, 0).applyEuler(new THREE.Euler(rx, ry, rx * .5, 'YXZ')); K.put(box(.022, .0016, .004), 'glow:cloch', T(x + n.x * .0235, y + n.y * .0235, z + n.z * .0235, rx, ry, rx * .5)); K.put(box(.004, .0016, .022), 'glow:cloch', T(x + n.x * .0235, y + n.y * .0235, z + n.z * .0235, rx, ry, rx * .5)); }); },
    tome(K) { tome(K, 'cloch', { cover: 'slate', metal: 'iron', ct: .009, straps: true }); } },
  scath: {
    staff(K) { shoe(K, 'blued', .0125, .06);
      // three ebony strands twisted round each other a turn and a half up the shaft, then parting into a cage round the eye
      for (let i = 0; i < 3; i++) { const pts = []; for (let k = 0; k <= 40; k++) { const t = k / 40, y = .03 + t * 1.81, a = i / 3 * Math.PI * 2 + y * 6.2;
          const open = y < 1.6 ? 0 : Math.sin(Math.PI * Math.min(1, (y - 1.6) / .24)) * .046, r = .0058 + open; pts.push([Math.cos(a) * r, y, Math.sin(a) * r]); }
        K.put(taper(pts, .0072, .0035, 120, 7), 'ebony'); }
      grip(K, 'leatherBlack', .84, 1.16, 'blued'); band(K, 'blued', 1.58, .0136, .014); band(K, 'blued', 1.845, .006, .01);
      K.put(ball(.029, 20, 14), 'obsidian', T(0, 1.715, 0)); K.put(new THREE.TorusGeometry(.0125, .0026, 6, 24), 'glow:scath', T(0, 1.715, .0262)); K.put(ball(.0075, 10, 8), 'glow:scath', T(0, 1.715, .025, 0, 0, 0, [1, 1, .4])); },
    // the veil dagger: a blued leaf blade 0.2 m, a straight guard, a black grip and a violet stone for a pommel
    hand(K) { K.put(lathe([[0, 0], [.008, .004], [.0105, .015], [.0065, .026], [.0075, .03], [0, .031]]), 'blued'); K.put(lathe([[.0075, .03], [.0085, .07], [.0075, .11], [.0068, .115]], 10), 'leatherBlack'); K.put(helix(.0083, .034, .108, 6, .0008), 'blued');
      K.put(ball(.0085, 12, 8), 'glow:scath', T(0, .002, 0)); K.put(new RoundedBoxGeometry(.072, .009, .014, 2, .003), 'blued', T(0, .118, 0));
      const prof = []; for (let k = 0; k <= 16; k++) { const t = k / 16; prof.push([Math.max(.0004, .0165 * Math.sin(Math.PI * Math.min(1, t * 1.25) ** .8) * (1 - .2 * t) + .004 * (1 - t)), t * .2]); }
      K.put(lathe(prof, 4), 'blued', T(0, .122, 0, 0, 0, 0, [1, 1, .2])); },
    focus(K) { const R = .045; K.put(new THREE.TorusGeometry(R, .0055, 8, 40), 'blued', T(0, .1, 0)); K.put(new THREE.CylinderGeometry(R, R, .005, 40).rotateX(Math.PI / 2), 'lens', T(0, .1, 0));
      K.put(new THREE.TorusGeometry(R - .003, .0016, 5, 40), 'glow:scath', T(0, .1, .0035)); K.put(lathe([[0, 0], [.03, 0], [.032, .006], [.012, .014], [.009, .05], [.006, .052]], 16), 'ebony'); band(K, 'blued', .049, .006, .008); },
    tome(K) { tome(K, 'scath', { cover: 'leatherBlack', metal: 'blued' }); } },
  solas: {
    staff(K) { K.put(shaft([[.012, 0], [.0145, .06], [GRIP_R, .6], [GRIP_R, 1.3], [.015, 1.55], [.016, 1.7], [.012, 1.73], [0, 1.735]]), 'whiteoak'); shoe(K, 'gold');
      grip(K, 'vellum', .84, 1.16, 'gold'); for (const y of [.55, 1.32, 1.5]) band(K, 'gold', y, y > 1.4 ? .0152 : GRIP_R + .0005);
      // a gold sun stands on the staff's top: a ring of 7 cm with twelve rays, long and short by turns, round a citrine
      const cy = 1.81; K.put(lathe([[.016, 1.68], [.019, 1.7], [.019, 1.72], [.008, 1.745]], 14), 'gold'); K.put(new THREE.TorusGeometry(.064, .0058, 8, 48), 'gold', T(0, cy, 0)); K.put(new THREE.TorusGeometry(.05, .0025, 6, 40), 'gold', T(0, cy, 0));
      for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2, L = i % 2 ? .034 : .058, g = new THREE.ConeGeometry(.0085, L, 4).scale(1, 1, .35); K.put(g, 'gold', T(Math.cos(a) * (.069 + L / 2), cy + Math.sin(a) * (.069 + L / 2), 0, 0, 0, a - Math.PI / 2)); }
      for (let i = 0; i < 4; i++) { const a = i / 4 * Math.PI * 2 + Math.PI / 4; K.put(box(.003, .048, .003), 'gold', T(Math.cos(a) * .028, cy + Math.sin(a) * .028, 0, 0, 0, a - Math.PI / 2)); }
      K.put(crystal(.017, .1), 'glow:solas', T(0, cy - .05, 0)); },
    hand(K) { K.put(lathe([[0, 0], [.0095, .004], [.0098, .02], [.0088, .028], [.0088, .1], [.0066, .29], [.006, .3], [0, .301]]), 'whiteoak'); band(K, 'gold', .024, .0089, .012); band(K, 'gold', .1, .0088, .006);
      K.put(ball(.0105, 12, 8), 'gold', T(0, .003, 0)); K.put(lathe([[.006, .296], [.0085, .302], [.0072, .312]], 10), 'gold'); K.put(crystal(.0072, .052, .25), 'glow:solas', T(0, .3, 0)); },
    // the beacon: a sun medallion 12 cm across, rays and a crystal dome, on an ivory handle; it lies face up
    focus(K) { K.put(new THREE.CylinderGeometry(.048, .05, .007, 40), 'gold', T(0, .0035, 0)); K.put(ring(.04, .0025, 36), 'gold', T(0, .0075, 0));
      for (let i = 0; i < 16; i++) { const a = i / 16 * Math.PI * 2, L = i % 2 ? .016 : .03; K.put(new THREE.ConeGeometry(.0075, L, 4).scale(1, 1, .3), 'gold', T(Math.cos(a) * (.05 + L / 2), .0035, Math.sin(a) * (.05 + L / 2), Math.PI / 2, -a + Math.PI / 2, 0).multiply(new THREE.Matrix4().makeRotationZ(0))); }
      K.put(new THREE.SphereGeometry(.026, 20, 8, 0, Math.PI * 2, 0, Math.PI / 2).scale(1, .6, 1), 'glow:solas', T(0, .007, 0));
      K.put(lathe([[.007, 0], [.0085, .02], [.0075, .08], [.0105, .092], [0, .096]], 12), 'ivory', T(0, .009, .08, Math.PI / 2, 0, 0)); },
    tome(K) { tome(K, 'solas', { cover: 'vellum', metal: 'gold' }); } },
  gaoth: {
    staff(K) { K.put(shaft([[.0115, 0], [.0135, .06], [GRIP_R, .6], [GRIP_R, 1.3], [.0135, 1.5], [.012, 1.58], [0, 1.585]]), 'ash'); shoe(K, 'silver', .0135, .05);
      grip(K, 'greyCloth', .84, 1.16, 'silver'); band(K, 'silver', 1.42, .0135); band(K, 'silver', 1.56, .0125, .012);
      // an open silver spiral, wide at its foot and closing as it rises, round a quartz that floats in it
      const pts = []; for (let k = 0; k <= 30; k++) { const t = k / 30, a = t * Math.PI * 3.6, r = .012 + Math.sin(Math.PI * Math.min(1, t * 1.6)) * .05 * (1 - t * .55); pts.push([Math.cos(a) * r, 1.575 + t * .29, Math.sin(a) * r]); }
      K.put(taper(pts, .0055, .0016, 90, 6), 'silver'); K.put(crystal(.012, .07, .5), 'glow:gaoth', T(0, 1.69, 0, .15, 0, .1));
      // feathers on cords from the band: grey with dark tips, three of them
      for (let i = 0; i < 3; i++) { const a = i * 2.1 + .4, x = Math.cos(a) * .016, z = Math.sin(a) * .016, L = .1 + i * .015; K.put(taper([[x, 1.555, z], [x * 1.6, 1.52, z * 1.6], [x * 1.8, 1.49 - i * .01, z * 1.8]], .0008, .0008, 6, 3), 'cord');
        const sh = new THREE.Shape(); sh.moveTo(0, 0); sh.quadraticCurveTo(.014, -L * .35, .006, -L); sh.quadraticCurveTo(-.004, -L * .6, 0, 0);
        const fy = 1.49 - i * .01; K.put(new THREE.ShapeGeometry(sh, 6), 'feather', T(x * 1.8, fy, z * 1.8, 0, -a, .08)); K.put(new THREE.ShapeGeometry(sh, 6).scale(.9, .25, 1).translate(0, -L * .75, .0004), 'featherTip', T(x * 1.8, fy, z * 1.8, 0, -a, .08)); } },
    hand(K) { const g = lathe([[0, 0], [.0092, .004], [.0092, .02], [.0085, .1], [.0062, .3], [.0045, .315], [0, .318]], 5), P = g.attributes.position;
      for (let i = 0; i < P.count; i++) { const y = P.getY(i), a = y * 30, x = P.getX(i), z = P.getZ(i); P.setXYZ(i, x * Math.cos(a) - z * Math.sin(a), y, x * Math.sin(a) + z * Math.cos(a)); } g.computeVertexNormals(); K.put(g, 'ash');
      band(K, 'silver', .02, .0089, .008); for (let i = 0; i < 3; i++) { const a = i / 3 * Math.PI * 2; K.put(taper([[Math.cos(a) * .004, .3, Math.sin(a) * .004], [Math.cos(a + .5) * .014, .31, Math.sin(a + .5) * .014], [Math.cos(a + 1.1) * .016, .325, Math.sin(a + 1.1) * .016]], .0022, .0006, 10, 4), 'silver'); }
      K.put(crystal(.004, .02), 'glow:gaoth', T(0, .312, 0)); },
    // the gale ring: a silver hoop of 13 cm with four curved vanes turning in to a bead, held by a short grip
    focus(K) { const R = .065, y = .006; K.put(new THREE.TorusGeometry(R, .0048, 6, 44).rotateX(Math.PI / 2), 'silver', T(0, y, 0));
      for (let i = 0; i < 4; i++) { const a0 = i / 4 * Math.PI * 2, pts = []; for (let k = 0; k <= 8; k++) { const t = k / 8, a = a0 + t * 1.3, r = R - t * (R - .012); pts.push([Math.cos(a) * r, y, Math.sin(a) * r]); } K.put(taper(pts, .0034, .0014, 16, 5), 'silver'); }
      K.put(ball(.0085, 12, 8), 'glow:gaoth', T(0, y + .002, 0)); K.put(lathe([[.0075, 0], [.0082, .07], [.006, .075]], 10), 'greyCloth', T(0, y, R + .002, Math.PI / 2, 0, 0)); },
    tome(K) { tome(K, 'gaoth', { cover: 'greyCloth', metal: 'silver' }); } } };

// a tome lying shut, cover up, spine to -x: boards, a page block set back from the edges, a round spine with three bands,
// metal corners, a clasp across the fore-edge and the school's mark on the cover. 19 × 25 × 5.5 cm
function tome(K, s, o) {
  const w = o.w ?? .19, d = o.d ?? .25, t = o.t ?? .055, ct = o.ct ?? .005, cv = o.cover, mt = o.metal;
  for (const y of [ct / 2, t - ct / 2]) K.put(new RoundedBoxGeometry(w, ct, d, 1, ct * .45), cv, T(.002, y, 0));
  K.put(box(w - .01, t - 2 * ct, d - .012), 'pages', T(-.002, t / 2, 0)); K.put(new THREE.CylinderGeometry(t / 2, t / 2, d, 12, 1, false, 0, Math.PI).rotateX(Math.PI / 2).rotateZ(Math.PI), cv, T(-w / 2 + .004, t / 2, 0));
  for (const z of [-.06, 0, .06]) K.put(new THREE.CylinderGeometry(t / 2 + .0018, t / 2 + .0018, .007, 12, 1, false, 0, Math.PI).rotateX(Math.PI / 2).rotateZ(Math.PI), cv, T(-w / 2 + .004, t / 2, z));
  for (const y of [t + .0008, -.0008]) for (const sz of [-1, 1]) for (const sx of [-1, 1]) K.put(box(.032, .0016, .032), mt, T(sx > 0 ? w / 2 - .013 : -w / 2 + .019, y, sz * (d / 2 - .013)));
  K.put(box(.004, t + .006, .03), mt, T(w / 2 + .004, t / 2, 0)); K.put(box(.04, .0025, .03), mt, T(w / 2 - .016, t + .0012, 0)); K.put(box(.04, .0025, .03), mt, T(w / 2 - .016, -.0012, 0));
  if (o.straps) for (const z of [-.075, .075]) K.put(box(w * .8, .0025, .016), mt, T(-w * .1 + .002, t + .0012, z));
  const mw = Math.min(w, d) * .62; K.put(new THREE.PlaneGeometry(mw, mw).rotateX(-Math.PI / 2), 'mark:' + s, T(.008, t + .0015, 0));
}

// ── the common tier: one staff as each island makes it, the school in its stone ──
export function islandStaff(island, school) {
  const K = kit(), gem = 'gem:' + school;
  if (island === 'gatelands') {
    // blackthorn, knobbled where the thorns were cut, a natural fork at the head lashed with cord round the stone, a bone collar
    const prof = []; for (let k = 0; k <= 30; k++) { const y = k / 30 * 1.55, base = y < .6 ? .0135 - y * .001 : y < 1.3 ? GRIP_R : GRIP_R + (y - 1.3) * .012; prof.push([base + (y < .6 || y > 1.3 ? .0018 * Math.max(0, Math.sin(y * 47) * Math.sin(y * 13)) : 0), y]); } prof.push([0, 1.555]);
    K.put(shaft(prof, 9), 'blackthorn'); grip(K, 'leatherBrown', .84, 1.16, 'cord'); K.put(lathe([[.017, 1.42], [.021, 1.44], [.021, 1.48], [.017, 1.5]], 12), 'bone');
    for (const s of [-1, 1]) K.put(taper([[0, 1.53, 0], [s * .016, 1.6, .002], [s * .036, 1.68, 0], [s * .03, 1.76, -.004], [s * .018, 1.8, 0]], .011, .004, 20, 7), 'blackthorn');
    K.put(rough(new THREE.IcosahedronGeometry(.028, 2), .004, school.length), gem, T(0, 1.68, 0)); K.put(helix(.0175, 1.55, 1.6, 4, .0016), 'cord');
    K.put(new THREE.TorusGeometry(.03, .0016, 4, 22), 'cord', T(0, 1.68, 0, 0, .3, 0)); K.put(new THREE.TorusGeometry(.03, .0016, 4, 22), 'cord', T(0, 1.68, 0, 0, -.3, Math.PI / 2));
  } else if (island === 'mark') {
    // pine, iron-shod with a spike, banded in iron, the stone held in four iron straps over a collar
    K.put(shaft([[.0125, 0], [.0145, .1], [GRIP_R, .6], [GRIP_R, 1.3], [.016, 1.5], [.017, 1.58], [0, 1.585]], 10), 'pine'); shoe(K, 'iron', .0145, .1, true);
    grip(K, 'wool', .84, 1.16, 'leatherBrown'); for (const y of [.32, 1.33, 1.46]) band(K, 'iron', y, y > 1.4 ? .0158 : .014, .012);
    K.put(lathe([[.017, 1.56], [.026, 1.58], [.026, 1.6], [.02, 1.61]], 12), 'iron'); K.put(rough(new THREE.IcosahedronGeometry(.036, 2), .005, school.length + 1), gem, T(0, 1.65, 0));
    for (let i = 0; i < 4; i++) { const a = i * Math.PI / 2 + .3, P = (r, y) => [Math.cos(a) * r, y, Math.sin(a) * r]; K.put(taper([P(.022, 1.595), P(.036, 1.62), P(.041, 1.66), P(.03, 1.7), P(.005, 1.722)], .0035, .003, 18, 4), 'iron', T(0, 0, 0, 0, 0, 0, [1, 1, 1])); }
    K.put(ball(.008, 10, 8), 'iron', T(0, 1.725, 0));
  } else {
    // olive, slim, gilt bands up the top third, a cast bronze crown round a cut stone, a tassel in the school's colour
    K.put(shaft([[.0115, 0], [.013, .06], [GRIP_R, .6], [GRIP_R, 1.3], [.0128, 1.55], [.014, 1.6], [0, 1.605]], 12), 'olive'); shoe(K, 'bronze', .013, .06);
    grip(K, 'cloth:' + school, .84, 1.16, 'gold'); for (const y of [1.34, 1.4, 1.46, 1.52]) band(K, 'gold', y, GRIP_R, .004);
    K.put(lathe([[.014, 1.58], [.021, 1.6], [.02, 1.625], [.012, 1.635]], 16), 'bronze'); K.put(new THREE.OctahedronGeometry(.024, 0).scale(1, 1.5, 1), gem, T(0, 1.68, 0, 0, .4, 0));
    for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2, P = (r, y) => [Math.cos(a) * r, y, Math.sin(a) * r]; K.put(taper([P(.018, 1.62), P(.028, 1.65), P(.024, 1.69), P(.008, 1.73), P(.002, 1.75)], .0024, .0012, 18, 4), 'bronze'); }
    K.put(ball(.0045, 8, 6), 'gold', T(0, 1.752, 0));
    for (let i = 0; i < 7; i++) { const a = i / 7 * Math.PI * 2; K.put(new THREE.CylinderGeometry(.0012, .0012, .1, 4), 'cloth:' + school, T(.022 + Math.cos(a) * .004, 1.53, Math.sin(a) * .004, 0, 0, .06)); }
    K.put(taper([[.016, 1.59, 0], [.023, 1.585, 0], [.023, 1.58, 0]], .0012, .0012, 4, 3), 'gold'); K.put(ball(.0055, 8, 6), 'gold', T(.023, 1.581, 0));
  }
  return K.finish({ island, school, kind: 'staff' });
}

export function implement(school, kind) { const K = kit(); BUILD[school][kind](K); return K.finish({ school, kind }); }
export const NAMES = {
  tine: ['the ember staff', 'the brand (a wand)', 'the hearth censer (a focus)', 'the tome'], uisce: ['the tidecaller (a staff)', 'the moonpearl wand', 'the stormglass (an orb)', 'the tome'],
  cloch: ['the runebound staff', 'the stoneheart maul', "the geomancer's foci", 'the tome'], scath: ['the nightweave staff', 'the veil dagger', 'the umbral lens (an orb)', 'the tome'],
  solas: ['the sunspire (a staff)', 'the dawnshard wand', 'the beacon (a sigil)', 'the tome'], gaoth: ['the skyrunner (a staff)', 'the zephyr wand', 'the gale ring (a focus)', 'the tome'] };
