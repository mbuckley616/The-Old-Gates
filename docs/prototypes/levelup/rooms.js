// Rooms in the new kit (card F9, Session 852; backlog L5's interiors by nation and L9's homes, OG-115, lit as OG-141). A room is built
// inside the very shell the street builds (pieces.js's gatelandsBuilding, with plan.interior so the shell's dark box is left out), so
// its walls are the walls you saw from outside, at their thickness, with the same openings.
// gatelandsCottage(o, r): the Gatelands cottage of GL_PLANS (9.6 by 5.4 m outside, walls of 0.6 m, 2.7 m to the wall plate, thatch at
//   50°) as a hearth-lobby house: the front door opens into a lobby screened by a jamb wall with a spy window; the hearth wall (the
//   plan's ridge stack at x = -1.7) carries an open hearth facing the kitchen, a crane and a pot over a turf fire; beyond it the
//   room below (west), and through a partition the room above (east). Kitchen: a dresser of plates on the back wall, a box bed
//   against the east partition, a table under the front window with two stools, a súgán chair at the hearth, a lantern from the
//   collar beam. Flagged floor, whitewashed inside, the roof's couples and purlins under the thatch.
//   -> { group, shell, room, tris, draws (the room's), inner: {x0, x1, z0, z1}, hearth, fire, lantern, door, path, seats, table, bed,
//        doors: [{x, z, w, h}], windows: [{x, y, z, w, h}] } in the cottage's frame (its centre on the ground, front +z).
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { mat, worldUV } from './common.js';
import { stream, gatelandsBuilding, GL_PLANS, SCALE, glMats } from './pieces.js';

let RM = null;
function mats() {
  if (RM) return RM; const G = glMats();
  RM = { lime: G['w:lime'], rubble: G.rubble, flag: mat('flag', { ns: 1.1, color: 0x9a968c, rough: .7 }), earth: mat('rock', { ns: .6, color: 0x6a5a48, rough: 1 }),
    oak: mat('wood', { ns: 1.0, color: 0x6a4a30, rough: .7 }), deal: mat('wood', { ns: .8, color: 0xb08a5c, rough: .75 }), paint: mat('wood', { ns: .6, color: 0x3e6a5a, rough: .6 }),
    delft: new THREE.MeshStandardMaterial({ color: 0xe8ecf2, roughness: .3 }), blue: new THREE.MeshStandardMaterial({ color: 0x2a4a8a, roughness: .35 }), crock: new THREE.MeshStandardMaterial({ color: 0x9a6a3a, roughness: .5 }),
    iron: new THREE.MeshStandardMaterial({ color: 0x1a1918, roughness: .5, metalness: .6 }), straw: mat('thatch', { ns: .8, color: 0xd8b878, rough: 1 }), wool: mat('plaster', { ns: .4, color: 0x8a3a2a, rough: 1 }),
    linen: mat('plaster', { ns: .3, color: 0xe2dccc, rough: 1 }), turf: mat('rock', { ns: 1.4, color: 0x3a2a1c, rough: 1 }), soot: new THREE.MeshStandardMaterial({ color: 0x141210, roughness: 1 }),
    ember: new THREE.MeshStandardMaterial({ color: 0x2a0e04, emissive: new THREE.Color(1, .42, .12), emissiveIntensity: 3, roughness: 1 }), flame: new THREE.MeshStandardMaterial({ color: 0xffb060, emissive: new THREE.Color(1, .6, .22), emissiveIntensity: 5, transparent: true, opacity: .85, depthWrite: false }),
    pane: new THREE.MeshStandardMaterial({ color: 0xc8d4dc, roughness: .05, metalness: 0, transparent: true, opacity: .14, depthWrite: false }),
    glow: new THREE.MeshStandardMaterial({ color: 0x302010, emissive: new THREE.Color(1, .7, .36), emissiveIntensity: 2.4, roughness: .5 }) };
  return RM;
}
function kit() { const M = mats(), B = new Map(), boxes = [];
  const put = (geo, key, x = 0, y = 0, z = 0, ry = 0, uv = .6) => { const g = geo.index ? geo.toNonIndexed() : geo; for (const k of Object.keys(g.attributes)) if (!['position', 'normal'].includes(k)) g.deleteAttribute(k);
    g.applyMatrix4(new THREE.Matrix4().compose(new THREE.Vector3(x, y, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(0, ry, 0)), new THREE.Vector3(1, 1, 1))); worldUV(g, uv);
    if (!B.has(key)) B.set(key, []); B.get(key).push(g); return g; };
  // a box by its floor footprint: x0..x1, z0..z1, y0..y1 (most furniture is boxes; tag it to have its footprint kept for the checks)
  const bx = (key, x0, x1, y0, y1, z0, z1, tag) => { put(new THREE.BoxGeometry(x1 - x0, y1 - y0, z1 - z0), key, (x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2); if (tag) boxes.push({ tag, x0, x1, y0, y1, z0, z1 }); };
  const finish = () => { const group = new THREE.Group(); let tris = 0; for (const [k, gs] of B) { const g = mergeGeometries(gs, false); gs.forEach(x => x.dispose()); const m = new THREE.Mesh(g, M[k]); m.name = k;
    m.castShadow = !['flame', 'ember', 'glow'].includes(k); m.receiveShadow = true; group.add(m); tris += g.attributes.position.count / 3; } return { group, tris: Math.round(tris), draws: group.children.length }; };
  return { put, bx, finish, boxes }; }
// a wall in the z-y plane at x (thickness t along x), its top following the roof (yTop(z)), with openings [{z, w, y, h}] cut through
function crossWall(put, key, x, t, z0, z1, yTop, holes) { const s = new THREE.Shape(); s.moveTo(z0, 0); s.lineTo(z1, 0); for (let k = 0; k <= 8; k++) { const z = z1 + (z0 - z1) * k / 8; s.lineTo(z, yTop(z)); } s.lineTo(z0, 0);
  for (const h of holes) { const p = new THREE.Path(); p.moveTo(h.z - h.w / 2, h.y); p.lineTo(h.z + h.w / 2, h.y); p.lineTo(h.z + h.w / 2, h.y + h.h); p.lineTo(h.z - h.w / 2, h.y + h.h); p.lineTo(h.z - h.w / 2, h.y); s.holes.push(p); }
  const g = new THREE.ExtrudeGeometry(s, { depth: t, bevelEnabled: false }); g.rotateY(-Math.PI / 2); put(g, key, x + t / 2, 0, 0, 0, .42); }

export function gatelandsCottage(o = {}, r = stream('cottage')) {
  const plan = GL_PLANS.cottage({ hip: false, paint: o.paint || 'red' }); plan.interior = true; plan.r = stream('cottage-shell');
  const shell = gatelandsBuilding(plan), { put, bx, finish, boxes } = kit(), t = plan.t, h = plan.floors[0], X = plan.w / 2 - t, Z = plan.d / 2 - t, tp = Math.tan(SCALE.pitch.thatch * Math.PI / 180);
  const under = z => h - .12 + (Z - Math.abs(z)) * tp - .1;
  // the floor: flags in the kitchen, laid in courses of 0.55 to 0.9 m; beaten earth in the two rooms
  const HX = -1.7, PX = 2.6, HT = .6;
  for (let z = -Z, row = 0; z < Z - .05; row++) { const d = Math.min(Z - z, .55 + r() * .35); for (let x = HX + HT / 2; x < PX - .05;) { const w = Math.min(PX - x, .6 + r() * .4);
    put(new THREE.BoxGeometry(w - .02, .06, d - .02), 'flag', x + w / 2, .03 + (r() - .5) * .006, z + d / 2, (r() - .5) * .01, .7); x += w; } z += d; }
  bx('earth', -X, HX - HT / 2, 0, .04, -Z, Z); bx('earth', PX, X, 0, .04, -Z, Z);
  // the hearth wall at the plan's stack, x = -1.7: the open hearth faces the kitchen (+x), a door to the room below at the back
  const hw = 1.6, hh = 1.25, hd = .5, hz = .25, dB = { z: -1.45, w: .8, h: 1.95 };
  crossWall(put, 'lime', HX, HT, -Z, Z, under, [{ z: dB.z, w: dB.w, y: 0, h: dB.h }]);
  // the breast proud of it by 0.55 m, the hearth a recess in it, sooted at the back, an oak lintel over, a hearthstone before it
  const BD = .55, bxx = HX + HT / 2; { const bz0 = hz - hw / 2 - .35, bz1 = hz + hw / 2 + .35; bx('lime', bxx, bxx + BD, hh, under(0) - .4, bz0, bz1); bx('lime', bxx, bxx + BD, 0, hh, bz0, hz - hw / 2, 'breast'); bx('lime', bxx, bxx + BD, 0, hh, hz + hw / 2, bz1, 'breast');
    bx('soot', bxx, bxx + .02, 0, hh, hz - hw / 2, hz + hw / 2); bx('soot', bxx, bxx + BD, hh - .02, hh, hz - hw / 2, hz + hw / 2); bx('oak', bxx + BD - .3, bxx + BD + .08, hh, hh + .24, hz - hw / 2 - .25, hz + hw / 2 + .25); bx('flag', bxx + BD, bxx + BD + .8, 0, .07, hz - hw / 2, hz + hw / 2, 'hearthstone'); }
  // the fire: sods of turf on the hearth floor, embers between them; the crane from the cheek, a pot on its hook
  const fx = bxx + .25, fire = [fx + .05, .32, hz]; for (let i = 0; i < 7; i++) { const a = i / 7 * Math.PI * 2, g = new THREE.BoxGeometry(.24, .1, .12); put(g, 'turf', fx + Math.cos(a) * .15, .06 + (i % 2) * .08, hz + Math.sin(a) * .22, a + 1.3); }
  put(new THREE.SphereGeometry(.16, 10, 6).scale(1.2, .4, 1.4), 'ember', fx, .08, hz); for (let i = 0; i < 3; i++) put(new THREE.ConeGeometry(.07, .28 + i * .06, 7), 'flame', fx + (i - 1) * .04, .26, hz + (i - 1) * .09);
  { const cx = bxx + .06, cz = hz - hw / 2 + .08; bx('iron', cx - .02, cx + .02, .2, 1.15, cz - .02, cz + .02); put(new THREE.BoxGeometry(.03, .03, .75), 'iron', cx + .02, 1.05, cz + .37, 0); put(new THREE.CylinderGeometry(.008, .008, .4, 4), 'iron', cx + .02, .85, cz + .62);
    const pot = new THREE.SphereGeometry(.17, 14, 10, 0, Math.PI * 2, .35, Math.PI - .35); put(pot, 'iron', cx + .2, .55, cz + .62); put(new THREE.TorusGeometry(.13, .008, 4, 14, Math.PI).rotateY(Math.PI / 2), 'iron', cx + .2, .7, cz + .62); }
  // the jamb wall: from the breast to beside the door, a lobby between it and the front wall, a spy window toward the fire
  const door = plan.open.front[0], JZ = Z - 1.0, jx1 = door.x + door.w / 2 + .05; { const g = new THREE.BoxGeometry(1, 1, 1); const sw = .22, sx = bxx + BD + .3;
    bx('lime', bxx + BD, sx - sw / 2, 0, 2.05, JZ - .11, JZ + .11, 'jamb'); bx('lime', sx + sw / 2, jx1, 0, 2.05, JZ - .11, JZ + .11, 'jamb'); bx('lime', sx - sw / 2, sx + sw / 2, 0, 1.3, JZ - .11, JZ + .11, 'jamb'); bx('lime', sx - sw / 2, sx + sw / 2, 1.5, 2.05, JZ - .11, JZ + .11, 'jamb'); g.dispose(); }
  // the east partition: deal boards on a frame, a door at the front to the room above
  const dE = { z: .9, w: .8, h: 1.95 }; crossWall(put, 'deal', PX, .08, -Z, Z, z => Math.min(h + .3, under(z)), [{ z: dE.z, w: dE.w, y: 0, h: dE.h }]); bx('oak', PX - .06, PX + .06, h + .25, h + .4, -Z, Z);
  // the dresser on the back wall, west of the back door: a cupboard base, a rack of three shelves, plates leaning on them, jugs
  { const x0 = HX + HT / 2 + .45, x1 = x0 + 1.45, z0 = -Z, z1 = -Z + .48; bx('paint', x0, x1, 0, .85, z0, z1, 'dresser'); bx('deal', x0 - .02, x1 + .02, .85, .89, z0, z1 + .03); bx('paint', x0, x1, .89, 2.05, z0, z0 + .05);
    for (const e of [x0, x1 - .05]) bx('paint', e, e + .05, .89, 2.05, z0, z0 + .3); bx('paint', x0 - .04, x1 + .04, 2.05, 2.16, z0, z0 + .34);
    for (let s = 0; s < 3; s++) { const y = 1.2 + s * .3; bx('paint', x0, x1, y - .02, y, z0, z0 + .26); for (let k = 0; k < 6; k++) { const px = x0 + .14 + k * .235, rp = .095 - (s === 0 ? 0 : .015);
      const p = new THREE.CylinderGeometry(rp, rp, .012, 18).rotateX(Math.PI / 2 - .2); put(p, k % 3 === 1 ? 'blue' : 'delft', px, y + rp + .005, z0 + .08); } }
    for (let k = 0; k < 3; k++) put(new THREE.CylinderGeometry(.06, .07, .2, 12), 'crock', x0 + .3 + k * .45, .99, z0 + .3); }
  // the box bed against the east partition: a cupboard of deal 0.9 by 2.0 m, its front half closed by a curtain, a straw tick and a blanket
  const bed = { x0: PX - .92, x1: PX - .04, z0: -Z + .05, z1: -Z + 2.08 }; { const { x0, x1, z0, z1 } = bed; bx('deal', x0, x1, 0, .32, z0, z1, 'bed'); bx('deal', x0, x0 + .04, .32, 1.95, z0, z0 + .05); bx('deal', x0, x0 + .04, .32, 1.95, z1 - .05, z1);
    bx('deal', x0, x1, 1.95, 2.0, z0, z1); bx('deal', x1 - .04, x1, .32, 1.95, z0, z1); bx('deal', x0 + .02, x1, .32, 1.95, z0 - .02, z0 + .02); bx('deal', x0 + .02, x1, .32, 1.95, z1 - .02, z1 + .02);
    bx('straw', x0 + .05, x1 - .05, .32, .5, z0 + .06, z1 - .06); bx('wool', x0 + .05, x1 - .05, .5, .55, z0 + .5, z1 - .06); bx('linen', x0 + .1, x1 - .1, .5, .62, z0 + .08, z0 + .45);
    const c = new THREE.PlaneGeometry(1.0, 1.45, 10, 1), P = c.attributes.position; for (let i = 0; i < P.count; i++) P.setZ(i, .04 * Math.sin(P.getX(i) * 18)); c.rotateY(-Math.PI / 2); c.computeVertexNormals(); put(c, 'wool', x0 - .01, .32 + .74, (z0 + z1) / 2 + .45); }
  // the table under the front window (the plan's at x = 1.5), two stools; a súgán chair at the hearth
  const win = plan.open.front.find(p => p.kind === 'win' && p.x > HX && p.x < PX), tx = win.x + .1, tz = Z - .5, table = { y: .76 };
  { bx('deal', tx - .62, tx + .62, .72, .76, tz - .36, tz + .36, 'table'); for (const sx of [-1, 1]) for (const sz of [-1, 1]) bx('deal', tx + sx * .55 - .03, tx + sx * .55 + .03, 0, .72, tz + sz * .29 - .03, tz + sz * .29 + .03);
    bx('deal', tx - .55, tx + .55, .14, .17, tz - .015, tz + .015); }
  const seats = []; for (const [x, z] of [[tx - .85, tz - .05], [tx + .3, tz - .62]]) { /* one at the west end, one on the room side; the east end is the box bed's */ bx('deal', x - .17, x + .17, .41, .45, z - .17, z + .17, 'stool'); for (const a of [0, 2.1, 4.2]) put(new THREE.CylinderGeometry(.018, .022, .41, 6), 'deal', x + Math.cos(a) * .11, .205, z + Math.sin(a) * .11); seats.push(.45); }
  { const x = bxx + BD + 1.0, z = hz - .75; bx('oak', x - .22, x + .22, .4, .44, z - .21, z + .21, 'chair'); bx('straw', x - .2, x + .2, .44, .46, z - .19, z + .19); for (const sx of [-1, 1]) for (const sz of [-1, 1]) bx('oak', x + sx * .19 - .02, x + sx * .19 + .02, 0, sz < 0 ? 1.0 : .4, z + sz * .18 - .02, z + sz * .18 + .02);
    bx('oak', x - .21, x + .21, .92, .97, z - .2, z - .16); seats.push(.46); }
  // the room below (west): a plain bed and a chest; the room above (east): a bed, a chest, a small grate in the gable
  bx('oak', -X + .05, -X + 1.0, 0, .45, -Z + .1, -Z + 2.1, 'bed2'); bx('wool', -X + .1, -X + .95, .45, .55, -Z + .15, -Z + 2.05); bx('oak', HX - HT / 2 - 1.0, HX - HT / 2 - .1, 0, .55, -Z + .05, -Z + .55, 'chest');
  bx('oak', X - 1.0, X - .05, 0, .45, -Z + .1, -Z + 2.1, 'bed3'); bx('linen', X - .95, X - .1, .45, .55, -Z + .15, -Z + 2.05); bx('oak', X - .95, X - .1, 0, .5, -Z + 2.2, -Z + 2.7, 'chest2');
  bx('soot', X - .25, X, 0, .7, -.35, .35); bx('lime', X - .45, X, .7, .82, -.5, .5);
  // the roof's couples: pairs of oak blades up the slopes, a collar across, purlins along; the lantern hangs from the kitchen's collar
  const p = SCALE.pitch.thatch * Math.PI / 180, L2 = Z / Math.cos(p);
  for (const x of [-3.0, .4, 3.6]) { for (const s of [-1, 1]) { const g = new THREE.BoxGeometry(.14, .2, L2 - .2); g.rotateX(s * p); /* its foot stops on the wall's inner face */ /* the +z end down on the front slope, up on the back */ put(g, 'oak', x, under(s * Z / 2) - .16, s * Z / 2, 0); }
    bx('oak', x - .07, x + .07, h + 1.35, h + 1.5, -Z + .02 + 1.3 / tp, Z - .02 - 1.3 / tp); }
  for (const f of [.35, .7]) for (const sz of [-1, 1]) { const zz = sz * Z * (1 - f), y = under(zz) - .2; put(new THREE.BoxGeometry(plan.w - 2 * t, .12, .12), 'oak', 0, y, zz); }
  const lantern = [.4, h + 1.0, 0]; { bx('iron', .39, .41, h + .9, h + 1.36, -.01, .01); put(new THREE.CylinderGeometry(.07, .08, .2, 6), 'glow', ...lantern); put(new THREE.ConeGeometry(.09, .1, 6), 'iron', lantern[0], lantern[1] + .15, lantern[2]); }
  // candles on the table
  put(new THREE.CylinderGeometry(.012, .014, .14, 8), 'linen', tx + .2, .83, tz + .1); put(new THREE.SphereGeometry(.012, 6, 5).scale(1, 2, 1), 'flame', tx + .2, .915, tz + .1);
  // the shell's glass was made for a dark house: inside, it is clear, so the day comes in and the outside shows
  { const G = glMats().glass; shell.traverse(m => { if (m.isMesh && m.material === G) { m.material = mats().pane; m.name = 'pane'; } }); }
  const R = finish(), group = new THREE.Group(); group.add(shell, R.group);
  const windows = Object.entries(plan.open).flatMap(([f, os]) => (os || []).filter(q => q.kind === 'win').map(q => ({ face: f, x: f === 'front' ? q.x : f === 'back' ? -q.x : 0, z: f === 'front' ? plan.d / 2 : f === 'back' ? -plan.d / 2 : 0, y: q.y, w: q.w, h: q.h })));
  return { path: [[door.x, Z - .3], [.25, Z - .45], [.25, .5], [bxx + BD + .4, hz]], group, shell, room: R.group, tris: R.tris, draws: R.draws, shellTris: shell.userData.tris, shellCalls: shell.userData.calls, inner: { x0: -X, x1: X, z0: -Z, z1: Z }, hearth: [bxx + BD, 0, hz], fire, lantern,
    door: { x: door.x, z: plan.d / 2, w: door.w, h: door.h }, doors: [{ x: HX, z: dB.z, w: dB.w, h: dB.h, wall: 'hearth' }, { x: PX, z: dE.z, w: dE.w, h: dE.h, wall: 'east' }], windows, table, seats, bed, boxes, under: under(0) };
}
