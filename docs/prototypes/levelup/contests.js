// The festivals' two contest grounds (the look builder, Session 2317; Michael's B on #1628, docs/design/festivals.md, *The contests*;
// backlog L9 "Festivals on the calendar", OG-107). What the systems builder's contests stand on, in metres, built as festivals.js
// builds (three.js 0.170, painted canvases, no other textures), so a prop lifts straight into a world file:
//   Riverfair's butts (the Gatelands, Haysel 18; buttsStart, S2314): the butt, a straw boss 1.36 m across and 0.3 deep, bound in
//     twelve hoops of cord, with a painted linen face 1.2 m across (rings of 0.2, 0.4 and 0.6 m: weld, madder, cream, the game's
//     BUTT_RINGS), its centre 1.2 m up (BUTT_Y), leant back 8 degrees on an ash stand of three legs; the mark, a limed
//     line 3 m across the lane, the shooter on its middle, a peeled stake with a woad ribbon at its end 1.55 m off (BUTT_MARK_R 1.5); a range peg at 30, 50 and 70 m, a board with
//     its number cut in; and two bales behind each butt for what misses.
//   The Strait Fair's ring (the Mark, Highsun 4; fairRingStart, S2315): ten tarred stakes on a circle 5 m round its middle (FAIR_R),
//     two ropes of hemp sagging between them at 0.55 and 1.05 m, a gap nowhere (the rope is the bout's line); the reeve's post at
//     the north side, a stake 2.2 m high with a horn hung on it; the ground inside trodden bare.
// Each builder returns a Parts group in its own frame (+y up; the butt's face and the mark's line look to +z); tris(g) counts it.
import * as THREE from 'three';

const V = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
const C = (r, g, b) => new THREE.Color().setRGB(r, g, b, THREE.SRGBColorSpace);
const Y = V(0, 1, 0);
// the game's numbers (js/87-world-quests.js): a prop that disagrees with them is wrong, and contests.check.mjs reads them from here
export const BUTT = { ends: [30, 50, 70], rings: [[.2, 5], [.4, 3], [.6, 1]], r: .6, y: 1.2, markR: 1.5, lean: 8 * Math.PI / 180, boss: .68, depth: .3 };
export const RING = { r: 5, stakes: 10, ropes: [.55, 1.05], sag: .07 };

// ——— materials
const MATS = {}; let GRAIN = null;
function grainTex() { if (GRAIN) return GRAIN; const c = document.createElement('canvas'); c.width = c.height = 256; const x = c.getContext('2d'); x.fillStyle = '#d6d6d6'; x.fillRect(0, 0, 256, 256);
  let s = 7; const r = () => ((s = (s * 16807) % 2147483647) - 1) / 2147483646;
  for (let i = 0; i < 110; i++) { const px = r() * 256; x.strokeStyle = `rgba(40,30,20,${.05 + r() * .12})`; x.lineWidth = .5 + r() * 1.6; x.beginPath(); for (let y = 0; y <= 256; y += 16) x.lineTo(px + Math.sin(y * .02 + i) * 3, y); x.stroke(); }
  GRAIN = new THREE.CanvasTexture(c); GRAIN.wrapS = GRAIN.wrapT = THREE.RepeatWrapping; GRAIN.colorSpace = THREE.SRGBColorSpace; return GRAIN; }
const wood = col => MATS['w' + col] || (MATS['w' + col] = new THREE.MeshStandardMaterial({ map: grainTex(), color: C(...col), roughness: .75 }));
const plain = (col, o = {}) => { const k = 'p' + col + JSON.stringify(o); return MATS[k] || (MATS[k] = new THREE.MeshStandardMaterial({ color: C(...col), roughness: o.rough ?? .85, side: o.side ?? THREE.FrontSide })); };
function painted(w, h, draw, key) { if (MATS[key]) return MATS[key]; const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
  return (MATS[key] = new THREE.MeshStandardMaterial({ map: t, roughness: .92 })); }
// straw: pale gold streaks along the coil, a canvas wrapped round the boss's rim
function strawMat() { return painted(256, 64, (x, w, h) => { x.fillStyle = '#b89a58'; x.fillRect(0, 0, w, h); let s = 3; const r = () => ((s = (s * 16807) % 2147483647) - 1) / 2147483646;
  for (let i = 0; i < 420; i++) { const y = r() * h, x0 = r() * w; x.strokeStyle = `hsla(${40 + r() * 10},${45 + r() * 20}%,${42 + r() * 30}%,.7)`; x.lineWidth = .6 + r() * 1.2; x.beginPath(); x.moveTo(x0, y); x.lineTo(x0 + 20 + r() * 40, y + (r() - .5) * 3); x.stroke(); } }, 'straw'); }
// the face: rings out from the middle in the game's three (weld, madder, cream) with a dark line between, the linen's weave over all
const DYE = { weld: '#d9a92a', madder: '#a8301e', cream: '#ece4cc', line: '#2a2018' };
function faceMat() { return painted(512, 512, (x, w) => { const c = w / 2, k = c / BUTT.r, cols = [DYE.weld, DYE.madder, DYE.cream];
  x.fillStyle = DYE.cream; x.fillRect(0, 0, w, w);
  for (let i = BUTT.rings.length - 1; i >= 0; i--) { x.beginPath(); x.arc(c, c, BUTT.rings[i][0] * k, 0, 6.2832); x.fillStyle = cols[i]; x.fill(); x.lineWidth = 3; x.strokeStyle = DYE.line; x.stroke(); }
  x.globalAlpha = .07; x.strokeStyle = '#000'; x.lineWidth = 1; for (let i = 0; i < w; i += 4) { x.beginPath(); x.moveTo(i, 0); x.lineTo(i, w); x.stroke(); x.beginPath(); x.moveTo(0, i); x.lineTo(w, i); x.stroke(); }
  x.globalAlpha = 1; }, 'face'); }
const boardMat = n => painted(128, 64, (x, w, h) => { x.fillStyle = '#c8b694'; x.fillRect(0, 0, w, h); x.fillStyle = '#3a2a1a'; x.font = 'bold 44px serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(String(n), w / 2, h / 2 + 2); }, 'board' + n);

export function tris(g) { let t = 0; g.traverse(o => { if (o.isMesh) { const gg = o.geometry, n = (gg.index ? gg.index.count : gg.attributes.position.count) / 3; t += n * (o.isInstancedMesh ? o.count : 1); } }); return Math.round(t); }
class Parts { constructor() { this.g = new THREE.Group(); }
  add(geo, m, p = V(), r = null) { const o = new THREE.Mesh(geo, m); o.position.copy(p); if (r) o.rotation.set(...r); o.castShadow = o.receiveShadow = true; this.g.add(o); return o; }
  rod(a, b, r, m, seg = 7, r2 = r) { const d = b.clone().sub(a), L = d.length(), geo = new THREE.CylinderGeometry(r2, r, L, seg, 1); geo.translate(0, L / 2, 0); const o = this.add(geo, m, a); o.quaternion.setFromUnitVectors(Y, d.normalize()); return o; }
  box(w, h, d, m, p = V(), r = null) { return this.add(new THREE.BoxGeometry(w, h, d), m, p, r); } }
const tube = (pts, r, m, seg = 24, rs = 4) => { const o = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), seg, r, rs, false), m); o.castShadow = true; return o; };
const sag = (a, b, s, n = 10) => { const out = []; for (let i = 0; i <= n; i++) { const t = i / n; out.push(a.clone().lerp(b, t).add(V(0, -s * 4 * t * (1 - t), 0))); } return out; };

const ASH = [.78, .68, .52], TAR = [.16, .13, .11], HEMP = [.72, .63, .45], WOAD = [.16, .28, .56];
export const PROPS = {
  // the butt: the boss's middle at (0, BUTT.y, 0), its face to +z, leant back by BUTT.lean about the middle; userData.face is the face's
  // centre and normal in the group's frame, so a check can put an arrow through it
  butt() { const p = new Parts(), straw = strawMat(), cord = plain(HEMP, { rough: 1 }), leg = wood(ASH), tilt = new THREE.Group();
    tilt.position.set(0, BUTT.y, 0); tilt.rotation.x = -BUTT.lean; p.g.add(tilt);
    const boss = new THREE.Mesh(new THREE.CylinderGeometry(BUTT.boss, BUTT.boss, BUTT.depth, 28, 1, true), straw); boss.rotation.x = Math.PI / 2; boss.castShadow = boss.receiveShadow = true; tilt.add(boss);
    // the back: a disc of coiled straw; the face: the painted linen just proud of the front, the straw's rim round it
    const back = new THREE.Mesh(new THREE.CircleGeometry(BUTT.boss, 28), straw); back.position.z = -BUTT.depth / 2; back.rotation.y = Math.PI; tilt.add(back);
    const rim = new THREE.Mesh(new THREE.RingGeometry(BUTT.r, BUTT.boss, 28, 1), straw); rim.position.z = BUTT.depth / 2; tilt.add(rim);
    const face = new THREE.Mesh(new THREE.CircleGeometry(BUTT.r, 36), faceMat()); face.position.z = BUTT.depth / 2 + .004; face.receiveShadow = true; tilt.add(face);
    // twelve hoops of cord round the rim, the coil's binding
    for (let i = 0; i < 12; i++) { const a = i / 12 * 6.2832; const o = new THREE.Mesh(new THREE.BoxGeometry(.03, .026, BUTT.depth + .02), cord); o.position.set(Math.cos(a) * (BUTT.boss + .005), Math.sin(a) * (BUTT.boss + .005), 0); o.rotation.z = a; tilt.add(o); }
    // the stand: two front legs from under the boss's sides to the ground ahead, one back leg, a rail the boss sits on
    const fy = BUTT.y - BUTT.boss * .82;
    p.rod(V(-.62, 0, .22), V(-.5, BUTT.y + .25, -.06), .035, leg, 6, .03); p.rod(V(.62, 0, .22), V(.5, BUTT.y + .25, -.06), .035, leg, 6, .03);
    p.rod(V(0, 0, -.95), V(0, BUTT.y + .3, -.2), .035, leg, 6, .03);
    p.rod(V(-.62, fy, .06), V(.62, fy, .06), .03, leg, 6);
    p.rod(V(-.52, .35, .17), V(.52, .35, .17), .025, leg, 6);
    p.g.traverse(o => { if (o.isMesh) o.castShadow = o.receiveShadow = true; });
    // the whole butt moved so the face's middle is (0, BUTT.y, 0): the point the game reads an arrow's crossing at (buttPlace, buttsCross)
    const n = V(0, 0, 1).applyAxisAngle(V(1, 0, 0), -BUTT.lean), c = V(0, BUTT.y, 0).addScaledVector(n, BUTT.depth / 2 + .004), off = c.clone().sub(V(0, BUTT.y, 0));
    for (const o of p.g.children) o.position.sub(off);
    p.g.userData = { face: { c: [0, BUTT.y, 0], n: n.toArray(), r: BUTT.r } }; return p; },
  // two bales behind a butt, side by side and one across on top, for the arrows that miss
  bales() { const p = new Parts(), straw = strawMat(), cord = plain(HEMP, { rough: 1 });
    const bale = (x, y, z, ry) => { const b = p.box(1.0, .42, .5, straw, V(x, y + .21, z), [0, ry, 0]); for (const dx of [-.25, .25]) { const t = p.box(.02, .44, .52, cord, V(0, 0, 0)); b.add(t); t.position.set(dx, 0, 0); } };
    bale(-.52, 0, 0, 0); bale(.52, 0, 0, 0); bale(-.52, .42, 0, 0); bale(.52, .42, 0, 0); bale(0, .84, 0, .02); return p; },
  // the mark: a limed line 3 m across the lane (its middle the mark, downrange -z) and a peeled stake 1.1 m at its west end, a woad
  // ribbon tied at its head; the stake is 1.55 m out, at the edge of BUTT_MARK_R, so the archer on the mark never stands in it
  mark() { const p = new Parts(), ash = wood(ASH), lime = plain([.93, .92, .86], { rough: 1 });
    const sx = -1.55; p.rod(V(sx, -.2, 0), V(sx, 1.1, 0), .035, ash, 7, .028); p.add(new THREE.ConeGeometry(.03, .06, 7), ash, V(sx, 1.13, 0));
    const rib = plain(WOAD, { rough: .9, side: THREE.DoubleSide }); p.g.add(tube([V(sx, 1.02, 0), V(sx + .06, .99, .02), V(sx + .1, .82, .05), V(sx + .13, .66, .03)], .009, rib, 10, 3));
    const ln = new THREE.Mesh(new THREE.PlaneGeometry(3, .08), lime); ln.rotation.x = -Math.PI / 2; ln.position.y = .006; ln.receiveShadow = true; p.g.add(ln);
    return p; },
  // a range peg: a stake with a board cut with its number, facing back up the lane (+z toward the mark)
  peg(n = 30) { const p = new Parts(), ash = wood(ASH); p.rod(V(0, -.2, 0), V(0, .75, 0), .03, ash, 6);
    p.box(.32, .16, .025, boardMat(n), V(0, .72, .035)); return p; },
  // the ring: RING.stakes tarred stakes round a circle of RING.r, two hemp ropes sagging between them, the reeve's post and horn to -z,
  // the earth inside trodden bare (o.floor, the view's earth)
  ring(o = {}) { const p = new Parts(), tar = wood(TAR), rope = plain(HEMP, { rough: 1 }), earth = o.floor || plain([.5, .41, .3], { rough: 1 });
    const pts = []; for (let i = 0; i < RING.stakes; i++) { const a = (i + .5) / RING.stakes * 6.2832; pts.push(V(Math.sin(a) * RING.r, 0, Math.cos(a) * RING.r)); }
    for (const s of pts) { p.rod(s.clone().add(V(0, -.25, 0)), s.clone().add(V(0, 1.2, 0)), .055, tar, 7, .045); p.add(new THREE.SphereGeometry(.05, 7, 4), tar, s.clone().add(V(0, 1.2, 0))); }
    for (const h of RING.ropes) for (let i = 0; i < pts.length; i++) { const a = pts[i].clone().setY(h), b = pts[(i + 1) % pts.length].clone().setY(h); p.g.add(tube(sag(a, b, RING.sag, 8), .014, rope, 10, 4)); }
    const floor = new THREE.Mesh(new THREE.CircleGeometry(RING.r - .15, 32), earth); floor.rotation.x = -Math.PI / 2; floor.position.y = .004; floor.receiveShadow = true; p.g.add(floor);
    const post = V(0, 0, -(RING.r + .7)); p.rod(post.clone().add(V(0, -.3, 0)), post.clone().add(V(0, 2.2, 0)), .06, tar, 7, .05);
    const horn = plain([.82, .74, .58], { rough: .55 }); const hg = new THREE.ConeGeometry(.07, .44, 9, 1, true); const hm = p.add(hg, horn, post.clone().add(V(.16, 1.72, .04)), [0, 0, -1.1]); hm.material.side = THREE.DoubleSide;
    p.g.add(tube([post.clone().add(V(.05, 1.95, 0)), post.clone().add(V(.1, 1.86, .03)), post.clone().add(V(.04, 1.72, .03))], .006, rope, 6, 3));
    p.g.userData = { stakes: pts.map(s => s.toArray()), r: RING.r }; return p; } };
export function build(key, ...a) { const p = PROPS[key](...a); return { g: p.g, tris: tris(p.g), ...p.g.userData }; }
