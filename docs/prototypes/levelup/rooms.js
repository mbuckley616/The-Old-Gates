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
import { stream, gatelandsBuilding, GL_PLANS, SCALE, glMats, markHall } from './pieces.js';

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

// markLonghouse(o, r) (Session 863, Michael's A on #303: rooms inside the street's own shell; OG-115's Mark panel, OG-025's longhall): the
//   Markish hall of pieces.js (shingle, 7.6 by 14 m, its smoke louver on the ridge, o.interior so its dark fills are left out) as a home
//   round a central fire. Planked floor on the stone footing (0.8 m up, the porch's steps outside). Two rows of posts carry purlins and
//   tie beams under the rafters, a board lining under the shingle. The long hearth on the hall's axis under the louver: a kerb of stones,
//   an ash bed, a log fire, a cauldron on its tripod. Raised benches 0.45 m high and 1.1 m deep down both long walls, laid with furs (to
//   sit on by day, sleep on by night). By the door, a workshop corner (a bench, tools on pegs, a chopping block) on the left and the larder
//   on the right (a beam hung with hams, dried fish and herbs, barrels and a crock). A plank partition across the back with a doorway into
//   the family quarters: a bed of furs on a platform and a chest. A lamp of iron hangs from the middle tie beam. No whitewash (OG-115's
//   row: "nothing whitewashed in the Mark"). Not "clans": the League's free towns (L9).
//   -> { group, shell, room, tris, draws, inner, fire, hearth {x0, x1, z0, z1}, louver, floor, door, path, boxes, beams (the lowest timber
//        over the floor's walk), benches, bed, lamp } in the hall's frame (its centre on the ground, front +z).
let LM = null;
function longMats() {
  if (LM) return LM; const M = mats();
  LM = { ...M, plank: mat('wood', { ns: 1.0, color: 0x7a6048, rough: .8 }), board: mat('wood', { ns: .8, color: 0x4a3828, rough: .9 }), post: mat('beam', { ns: 1.2, color: 0x9a7a60 }),
    kerb: mat('rock', { ns: 1.4, color: 0x7a766c, rough: .95 }), ash: mat('rock', { ns: .6, color: 0x3a3632, rough: 1 }), fur: mat('plaster', { ns: .9, color: 0x6a5240, rough: 1 }), furPale: mat('plaster', { ns: .9, color: 0xb0a490, rough: 1 }),
    furGrey: mat('plaster', { ns: .9, color: 0x5e5a56, rough: 1 }), ham: new THREE.MeshStandardMaterial({ color: 0x6a3022, roughness: .6 }), fish: new THREE.MeshStandardMaterial({ color: 0x8a7a5a, roughness: .5, metalness: .2 }),
    herb: mat('thatch', { ns: .6, color: 0x7a8a4a, rough: 1 }), log: mat('beam', { ns: 1.4, color: 0x6a5040 }) };
  return LM;
}
export function markLonghouse(o = {}, r = stream('longhouse')) {
  const w = o.w ?? 7.6, d = o.d ?? 14, hall = markHall({ roof: 'shingle', w, d, porch: true, chimney: false, carve: true, wall: o.wall ?? 1, interior: true }, stream('longhouse-shell'));
  const M = longMats(), B = new Map(), boxes = [];
  const put = (geo, key, x = 0, y = 0, z = 0, ry = 0, uv = .6, rx = 0, rz = 0) => { const g = geo.index ? geo.toNonIndexed() : geo; for (const k of Object.keys(g.attributes)) if (!['position', 'normal'].includes(k)) g.deleteAttribute(k);
    g.applyMatrix4(new THREE.Matrix4().compose(new THREE.Vector3(x, y, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(rx, ry, rz, 'YXZ')), new THREE.Vector3(1, 1, 1))); worldUV(g, uv);
    if (!B.has(key)) B.set(key, []); B.get(key).push(g); return g; };
  const bx = (key, x0, x1, y0, y1, z0, z1, tag) => { put(new THREE.BoxGeometry(x1 - x0, y1 - y0, z1 - z0), key, (x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2); if (tag) boxes.push({ tag, x0, x1, y0, y1, z0, z1 }); };
  const X = w / 2 - .25, Z = d / 2 - .25, FY = hall.sill + .04, tp = Math.tan(hall.pitch), under = x => hall.ry0 + (w / 2 + hall.ov - Math.abs(x)) * tp - .02, WP = hall.sill + hall.wh;
  // the floor: planks along the hall on the footing
  for (let x = -X; x < X - .01; x += .28) bx('plank', x + .005, Math.min(x + .275, X), hall.sill, FY, -Z, Z);
  // the frame: two rows of posts 1.25 m in from the walls, purlins along their heads, tie beams across each pair; rafters every metre
  // up each slope with a board lining over them under the shingle
  const PXr = X - 1.25, TB = WP + .25, posts = []; for (let z = -Z + 2.6; z < Z - 1.2; z += 2.75) posts.push(z); /* the first pair on the partition's line */
  for (const sx of [-1, 1]) { for (const z of posts) bx('post', sx * PXr - .11, sx * PXr + .11, FY, TB, z - .11, z + .11, 'post'); bx('post', sx * PXr - .12, sx * PXr + .12, TB, TB + .24, -Z, Z); }
  for (const z of posts) bx('post', -PXr - .1, PXr + .1, TB, TB + .24, z - .1, z + .1);
  // (each slope from the ridge: the rafters stop at the wall's inner face, the lining runs on to the wall plate)
  const XL = w / 2 - .02, rl = X / Math.cos(hall.pitch); for (const sx of [-1, 1]) { const xm = sx * X / 2, rz = -sx * hall.pitch;
    for (let z = -Z + .3; z < Z; z += 1.0) put(new THREE.BoxGeometry(rl, .14, .1), 'post', xm, under(xm) - .03 - .07 / Math.cos(hall.pitch), z, 0, .8, 0, rz);
    put(new THREE.BoxGeometry(XL / Math.cos(hall.pitch), .02, 2 * Z), 'board', sx * XL / 2, under(XL / 2) - .01, 0, 0, .8, 0, rz); /* the lining runs out onto the wall plate, so no shingle shows over the wall */ }
  // the long hearth on the axis, under the louver: a kerb of stones round an ash bed, logs and embers, a cauldron on a tripod
  const hz = hall.louver ?? -1.5, H = { x0: -.55, x1: .55, z0: hz - 1.3, z1: hz + 1.3 };
  for (let z = H.z0; z < H.z1 - .01; z += .3) for (const x of [H.x0, H.x1]) { const s = .13 + r() * .04, g = new THREE.IcosahedronGeometry(s, 1); g.scale(1.3, .7, 1.1); put(g, 'kerb', x, FY + s * .55, z + .15, r() * 3); }
  for (let x = H.x0 + .3; x < H.x1 - .2; x += .3) for (const z of [H.z0, H.z1]) { const s = .13 + r() * .04, g = new THREE.IcosahedronGeometry(s, 1); g.scale(1.1, .7, 1.3); put(g, 'kerb', x, FY + s * .55, z, r() * 3); }
  boxes.push({ tag: 'hearth', x0: H.x0 - .2, x1: H.x1 + .2, y0: FY, y1: FY + .2, z0: H.z0 - .2, z1: H.z1 + .2 }); bx('ash', H.x0 + .1, H.x1 - .1, FY, FY + .04, H.z0 + .1, H.z1 - .1);
  const fire = [0, FY + .25, hz]; for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI, g = new THREE.CylinderGeometry(.06, .07, .9, 7); g.rotateZ(Math.PI / 2); put(g, 'log', 0, FY + .1 + (i % 2) * .07, hz + (i - 2.5) * .14, a * .4 + .2); }
  put(new THREE.SphereGeometry(.22, 10, 6).scale(1.4, .35, 2.2), 'ember', 0, FY + .08, hz); for (let i = 0; i < 4; i++) put(new THREE.ConeGeometry(.09, .34 + (i % 2) * .12, 7), 'flame', (i % 2 - .5) * .12, FY + .3, hz + (i - 1.5) * .18);
  { const cz = hz + .95; for (const a of [0, 2.1, 4.2]) { const g = new THREE.CylinderGeometry(.015, .015, 1.25, 5); put(g, 'iron', Math.cos(a) * .32, FY + .58, cz + Math.sin(a) * .32, 0, .6, Math.sin(a) * .26, -Math.cos(a) * .26); }
    bx('iron', -.006, .006, FY + .62, FY + 1.18, cz - .006, cz + .006); const pot = new THREE.SphereGeometry(.2, 14, 10, 0, Math.PI * 2, .4, Math.PI - .4); put(pot, 'iron', 0, FY + .55, cz); }
  // the benches down both long walls, between the larder and workshop at the front and the partition at the back; furs laid on them
  const BZ0 = -Z + 3.0, BZ1 = Z - 2.4, BH = .45, BD = 1.1, benches = [];
  for (const sx of [-1, 1]) { const x0 = sx > 0 ? X - BD : -X, x1 = sx > 0 ? X : -X + BD; bx('board', x0, x1, FY, FY + BH - .04, BZ0, BZ1, 'bench'); bx('plank', x0, x1, FY + BH - .04, FY + BH, BZ0, BZ1); benches.push({ x0, x1, y: FY + BH, z0: BZ0, z1: BZ1 });
    for (let z = BZ0 + .3, k = 0; z < BZ1 - 1.2; z += 1.7 + r() * .6, k++) { const L = 1.5 + r() * .4, W2 = .8 + r() * .2, g = new THREE.PlaneGeometry(W2, L, 6, 6), P = g.attributes.position;
      for (let i = 0; i < P.count; i++) { const ex = Math.abs(P.getX(i)) / (W2 / 2), ey = Math.abs(P.getY(i)) / (L / 2); P.setZ(i, .015 + .02 * Math.sin(P.getX(i) * 9 + k) * Math.cos(P.getY(i) * 7) - (ex > .85 && ey > .8 ? .01 : 0)); }
      g.rotateX(-Math.PI / 2); g.computeVertexNormals(); put(g, ['fur', 'furPale', 'furGrey'][k % 3], (x0 + x1) / 2 + (r() - .5) * .1, FY + BH, z + L / 2, (r() - .5) * .12, .9); } }
  // the workshop corner, front left: a bench along the front wall, tools on pegs over it, a chopping block with an axe
  { const x0 = -X, x1 = -.95, z1 = Z, z0 = Z - .7; bx('oak', x0, x1, FY + .8, FY + .88, z0, z1, 'workbench'); for (const x of [x0 + .1, x1 - .15]) for (const z of [z0 + .1, z1 - .1]) bx('oak', x - .05, x + .05, FY, FY + .8, z - .05, z + .05);
    for (let k = 0; k < 5; k++) { const x = x0 + .4 + k * .45; bx('oak', x - .015, x + .015, FY + 1.45, FY + 1.48, Z - .1, Z); const L = .4 + r() * .3; bx(k % 2 ? 'oak' : 'iron', x - .02, x + .02, FY + 1.45 - L, FY + 1.45, Z - .07, Z - .03); }
    put(new THREE.CylinderGeometry(.22, .25, .5, 12), 'log', -1.7, FY + .25, Z - 1.25); boxes.push({ tag: 'block', x0: -1.95, x1: -1.45, y0: FY, y1: FY + .5, z0: Z - 1.5, z1: Z - 1.0 });
    bx('oak', -1.72, -1.68, FY + .5, FY + 1.1, Z - 1.27, Z - 1.23); bx('iron', -1.74, -1.66, FY + .5, FY + .62, Z - 1.38, Z - 1.18); }
  // the larder, front right: a beam across the corner on two posts, hung with hams, dried fish and bunches of herbs; barrels and a crock below
  { const x0 = .95, x1 = X, z = Z - .9, by = FY + 2.05; for (const x of [x0 + .1, x1 - .1]) bx('post', x - .07, x + .07, FY, by, z - .07, z + .07, 'larderpost'); bx('post', x0, x1, by, by + .14, z - .07, z + .07);
    for (let k = 0; k < 7; k++) { const x = x0 + .4 + k * (x1 - x0 - .7) / 6, kind = k % 3; bx('linen', x - .006, x + .006, by - .3, by, z - .006, z + .006);
      if (kind === 0) put(new THREE.SphereGeometry(.13, 10, 8).scale(1, 1.7, .8), 'ham', x, by - .5, z); else if (kind === 1) for (let f = 0; f < 3; f++) put(new THREE.ConeGeometry(.05, .42, 6).rotateX(Math.PI), 'fish', x + (f - 1) * .07, by - .52, z);
      else put(new THREE.ConeGeometry(.09, .32, 7), 'herb', x, by - .46, z); }
    for (const [x, zz] of [[x1 - .4, Z - .4], [x1 - 1.05, Z - .38]]) { put(new THREE.CylinderGeometry(.3, .27, .75, 14), 'oak', x, FY + .375, zz); boxes.push({ tag: 'barrel', x0: x - .3, x1: x + .3, y0: FY, y1: FY + .75, z0: zz - .3, z1: zz + .3 }); }
    put(new THREE.CylinderGeometry(.13, .16, .4, 12), 'crock', x1 - .3, FY + .2, z - .45); }
  // the partition across the back: planks on a frame, a doorway right of the axis into the family quarters
  const PZ = -Z + 2.6, dP = { x: 1.0, w: .9, h: 2.0 }; { const s = new THREE.Shape(); s.moveTo(-X, 0); s.lineTo(X, 0); s.lineTo(X, TB - FY); s.lineTo(-X, TB - FY); s.lineTo(-X, 0);
    const h = new THREE.Path(); h.moveTo(dP.x - dP.w / 2, 0); h.lineTo(dP.x + dP.w / 2, 0); h.lineTo(dP.x + dP.w / 2, dP.h); h.lineTo(dP.x - dP.w / 2, dP.h); h.lineTo(dP.x - dP.w / 2, 0); s.holes.push(h);
    const g = new THREE.ExtrudeGeometry(s, { depth: .08, bevelEnabled: false }); g.translate(0, FY, PZ - .04); put(g, 'board', 0, 0, 0, 0, .7); }
  // the family quarters: a platform bed of furs along the back wall, a chest at its foot, a small cradle
  const bed = { x0: -X + .1, x1: -X + 2.2, z0: -Z, z1: -Z + 1.95 }; bx('oak', bed.x0, bed.x1, FY, FY + .4, bed.z0, bed.z1, 'bed'); bx('fur', bed.x0 + .05, bed.x1 - .05, FY + .4, FY + .5, bed.z0 + .05, bed.z1 - .05); bx('furPale', bed.x0 + .1, bed.x0 + .9, FY + .5, FY + .58, bed.z0 + .1, bed.z1 - .1);
  bx('oak', bed.x1 + .1, bed.x1 + 1.0, FY, FY + .5, -Z, -Z + .55, 'chest'); bx('iron', bed.x1 + .1, bed.x1 + 1.0, FY + .3, FY + .34, -Z + .55, -Z + .57);
  // a small stone lamp of oil on the chest, the quarters' own light
  const lamp2 = [bed.x1 + .55, FY + .56, -Z + .3]; put(new THREE.CylinderGeometry(.07, .05, .06, 10), 'kerb', lamp2[0], FY + .53, lamp2[2]); put(new THREE.SphereGeometry(.015, 6, 5).scale(1, 2, 1), 'flame', lamp2[0], FY + .585, lamp2[2]);
  { const cx = X - .7, cz = -Z + .85; bx('oak', cx - .3, cx + .3, FY + .1, FY + .42, cz - .45, cz + .45, 'cradle'); bx('furPale', cx - .25, cx + .25, FY + .42, FY + .46, cz - .4, cz + .4); for (const s of [-1, 1]) put(new THREE.TorusGeometry(.32, .03, 4, 12, Math.PI).rotateY(Math.PI / 2), 'oak', cx, FY + .1, cz + s * .45); }
  // the lamp: an iron bowl of oil on a chain from the middle tie beam
  const lz = posts[Math.floor(posts.length / 2)] ?? 0, lamp = [-1.2, TB - .6, lz]; bx('iron', lamp[0] - .005, lamp[0] + .005, lamp[1] + .05, TB, lz - .005, lz + .005);
  put(new THREE.SphereGeometry(.09, 10, 6, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), 'iron', ...lamp); put(new THREE.SphereGeometry(.02, 6, 5).scale(1, 2, 1), 'flame', lamp[0] + .05, lamp[1] + .03, lamp[2]);
  // the front door, hung open: its leaf swung in against the front wall, left of the doorway
  { const leaf = { x0: -hall.door.w / 2 - .07, x1: -hall.door.w / 2 - .01, z0: Z - hall.door.w - .01, z1: Z - .01 }; bx('board', leaf.x0, leaf.x1, FY, FY + hall.door.h - .12, leaf.z0, leaf.z1, 'door');
    for (const y of [.5, 1.5]) bx('iron', leaf.x0 - .02, leaf.x0, FY + y - .03, FY + y + .03, leaf.z0 + .1, leaf.z1 - .05); }
  // the walk: in at the door, between the larder and the workshop, down the left of the hearth, and through the partition's doorway
  const path = [[0, Z - .1], [0, Z - 1.6], [-1.3, H.z1 + .3], [-1.3, PZ + .35], [dP.x, PZ + .35], [dP.x, PZ - .6]];
  const group = new THREE.Group(); let tris = 0; for (const [k, gs] of B) { const g = mergeGeometries(gs, false); gs.forEach(x => x.dispose()); const m = new THREE.Mesh(g, M[k]); m.name = k; m.castShadow = !['flame', 'ember', 'glow'].includes(k); m.receiveShadow = true; group.add(m); tris += g.attributes.position.count / 3; }
  const all = new THREE.Group(); all.add(hall.group, group);
  return { group: all, shell: hall.group, room: group, tris: Math.round(tris), draws: group.children.length, shellTris: hall.tris, shellCalls: hall.draws, inner: { x0: -X, x1: X, z0: -Z, z1: Z }, under, floor: FY, tieBeam: TB,
    fire, hearth: H, louver: hall.louver, door: { x: 0, z: d / 2, w: hall.door.w, h: hall.door.h }, doors: [{ x: dP.x, z: PZ, w: dP.w, h: dP.h, wall: 'partition' }], partition: PZ, path, boxes, benches, bed, lamp, lamp2, windows: hall.windows, w, d };
}
