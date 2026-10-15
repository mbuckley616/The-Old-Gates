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
import { stream, gatelandsBuilding, GL_PLANS, SCALE, glMats, markHall, aurenneHouse, aurenneCourtyard, aurenneTextures } from './pieces.js';

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

// markLonghouse(o, r) (Session 870, Michael's A on #303: rooms inside the street's own shell; OG-115's Mark panel, OG-025's longhall): the
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

// aurenneHome(o, r) (Session 891, card F9; Michael's A on #303: rooms inside the street's own shell; OG-115's Aurenne panel, "an urban
//   apartment over a shop, a kitchen with hanging pots, a rooftop terrace", and OG-061's blue tile): pieces.js's flat-roofed Aurennais
//   house (9.0 by 7.6 m, two storeys of 3.0 and 2.6 m, cream plaster, lattice screens upstairs, a pergola on the roof; o.interior so its
//   dark fill and its closed door are left out, o.hatch for the way up) as a dyer's shop with the family's flat over it. The canon's
//   Aurenne sells its dyes, so the shop is a dyer's: bolts of madder, indigo, saffron and weld on shelves behind a counter, lengths of
//   cloth hung to show, jars of dye by the door. A stair of masonry rises along the back wall to a landing; upstairs a tiled floor on
//   cedar beams, a dado of glazed tile, a divan under the lattice windows with a rug and a low brass table, a bed, and the kitchen: a
//   masonry cooking bench with two charcoal braziers, a rail of copper pots, a water jar. A steep stair goes up through a hatch to the
//   roof: the terrace, its pergola, and a line of dyed cloth drying. The door side follows the shell (o.shell, a stream key).
//   -> { group, shell, room, tris, draws, inner, floors: [ground, upper, roof], door, stair: { x0, x1, z0, z1, rise, going, n }, well,
//        hatch, roofStair, paths: [[x, z]...][] (each on its own floor), boxes (tagged, with the floor they stand on), bed, divan, table,
//        counter, lamp, braziers, windows }
let AH = null;
function homeMats() {
  if (AH) return AH; aurenneTextures(); const M = mats(), std = (c, o = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: o.rough ?? .8, metalness: o.metal ?? 0 });
  const rugTex = (() => { const c = document.createElement('canvas'); c.width = 256; c.height = 384; const x = c.getContext('2d'); x.fillStyle = '#8a2a20'; x.fillRect(0, 0, 256, 384); x.fillStyle = '#26386e'; x.fillRect(10, 10, 236, 364); x.fillStyle = '#8a2a20'; x.fillRect(30, 30, 196, 324);
    x.fillStyle = '#d8a030'; for (let i = 0; i < 3; i++) { const cy = 92 + i * 100; x.beginPath(); x.moveTo(128, cy - 42); x.lineTo(180, cy); x.lineTo(128, cy + 42); x.lineTo(76, cy); x.closePath(); x.fill(); }
    x.fillStyle = '#e8dcc0'; for (let i = 0; i < 24; i++) x.fillRect(16 + (i % 12) * 19, i < 12 ? 16 : 362, 8, 6); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; })();
  AH = { ...M, limestone: mat('limestone', { ns: 1.0, rough: .8 }), tile: mat('flag', { ns: .7, color: 0xf0a078, rough: .7 }), zellige: mat('zellige', { ns: .6, rough: .25 }), cedar: mat('wood', { ns: .9, color: 0xc89870, rough: .7 }),
    cedarD: mat('wood', { ns: .9, color: 0xa87048, rough: .7 }), plaster: mat('plaster', { ns: .5, color: 0xf3e6c8, rough: .95 }), brass: std(0xc8952e, { rough: .35, metal: .7 }), copper: std(0xb0603a, { rough: .4, metal: .6 }),
    terra: std(0xa8582f, { rough: .85 }), madder: mat('plaster', { ns: .3, color: 0x9a2a22, rough: 1 }), indigo: mat('plaster', { ns: .3, color: 0x26386e, rough: 1 }), saffron: mat('plaster', { ns: .3, color: 0xd8a030, rough: 1 }),
    weld: mat('plaster', { ns: .3, color: 0x8a9a3a, rough: 1 }), rug: new THREE.MeshStandardMaterial({ map: rugTex, roughness: 1 }), dark: std(0x0d0a08, { rough: 1 }), step: mat('limestone', { ns: .8, color: 0xe8e0d0, rough: .85 }), leaf: std(0x4f6e34, { rough: .9 }), grape: std(0x4a2a4a, { rough: .6 }), wine: std(0x5a1420, { rough: .2 }) };
  for (const k of ['madder', 'indigo', 'saffron', 'weld']) AH[k].side = THREE.DoubleSide; /* the hung cloths are one sheet */
  return AH;
}
export function aurenneHome(o = {}, r = stream('aurhome')) {
  const w = 9.0, d = 7.6, sh = aurenneHouse({ kind: 'flat', w, d, two: true, pergola: true, lattice: true, stair: false, dome: null, wall: 1, door: 0, pointed: false, interior: true, hatch: { x0: -1.62, x1: -.15, z0: -3.6, z1: -2.6 } }, stream(o.shell || 'aurhome-shell'));
  const M = homeMats(), B = new Map(), boxes = [];
  const put = (geo, key, x = 0, y = 0, z = 0, ry = 0, uv = .6, rx = 0, rz = 0) => { const g = geo.index ? geo.toNonIndexed() : geo; for (const k of Object.keys(g.attributes)) if (!['position', 'normal', ...(key === 'rug' ? ['uv'] : [])].includes(k)) g.deleteAttribute(k);
    g.applyMatrix4(new THREE.Matrix4().compose(new THREE.Vector3(x, y, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(rx, ry, rz, 'YXZ')), new THREE.Vector3(1, 1, 1))); if (key !== 'rug') worldUV(g, uv);
    if (!B.has(key)) B.set(key, []); B.get(key).push(g); return g; };
  const UVK = { zellige: 1.47, tile: 1.1 }, bx = (key, x0, x1, y0, y1, z0, z1, tag, fl) => { put(new THREE.BoxGeometry(x1 - x0, y1 - y0, z1 - z0), key, (x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2, 0, UVK[key] ?? .6); if (tag) boxes.push({ tag, x0, x1, y0, y1, z0, z1, fl }); };
  const X = w / 2 - sh.T, Z = d / 2 - sh.T, F0 = sh.yW + .02, F1 = sh.yW + sh.fh, F2 = sh.top, CEIL = F2 - .14, dx = sh.doorX, ds = dx < 0 ? -1 : 1, U = u => -ds * u /* u > 0 is the side away from the door */;
  const xs = (a, b) => [Math.min(U(a), U(b)), Math.max(U(a), U(b))];
  // ── the ground floor: limestone flags, a dado of glazed tile to 1.0 m, the stair along the back wall
  bx('limestone', -X, X, sh.yW, F0, -Z, Z);
  const dado = (y0, ht) => { for (const e of [-1, 1]) { bx('zellige', e * X - (e > 0 ? .02 : 0), e * X + (e < 0 ? .02 : 0), y0, y0 + ht, -Z, Z); }
    bx('zellige', -X, X, y0, y0 + ht, -Z, -Z + .02); const dg = 1.05 / 2 + .05; bx('zellige', -X, dx - dg, y0, y0 + ht, Z - .02, Z); bx('zellige', dx + dg, X, y0, y0 + ht, Z - .02, Z); };
  dado(F0, 1.0);
  // the stair: 16 risers of masonry from the shop's floor to the landing, going 0.26 m, against the back wall; the landing in the corner
  const N = 16, rise = (F1 - F0) / N, going = .26, SZ1 = -Z + .95, LX = X - .95, SX0 = LX - (N - 1) * going;
  for (let k = 1; k < N; k++) bx('step', SX0 + (k - 1) * going, SX0 + k * going, F0, F0 + k * rise, -Z, SZ1, 'stair', 0);
  bx('step', LX, X, F0, F1 - .2, -Z, SZ1, 'landing', 0);
  // the upper floor: a slab of cedar boards under red tiles, on cedar beams across the house every 0.9 m; open over the stair where the
  // head would meet it (the well), the beams cut there
  const well = { x0: SX0 + Math.floor((F1 - .2 - F0 - 2.0) / rise) * going /* the treads under the slab keep 2 m over them */, x1: LX, z0: -Z, z1: SZ1 };
  const slab = (y, hole, key) => { for (const [a0, a1, b0, b1] of [[-X, X, hole.z1, Z], [-X, hole.x0, -Z, hole.z1], [hole.x1, X, -Z, hole.z1]]) { if (a1 - a0 < .01 || b1 - b0 < .01) continue; bx('cedar', a0, a1, y - .2, y - .03, b0, b1); bx(key, a0, a1, y - .03, y, b0, b1); } };
  slab(F1, well, 'tile');
  const beams = []; for (let x = -X + .5; x < X - .2; x += .9) { const over = x > well.x0 - .1 && x < well.x1 + .1, z0 = over ? well.z1 : -Z; bx('cedarD', x - .08, x + .08, F1 - .4, F1 - .2, z0, Z); beams.push({ x, z0, y: F1 - .4 }); }
  // ── the shop: bolts of cloth on shelves along the far wall, a counter before them, the shopkeeper's stool between; lengths of dyed
  // cloth hung from a pole on the near wall; jars of dye by the door; a brass oil lamp on the counter
  const dyes = ['madder', 'indigo', 'saffron', 'weld'];
  { const sz0 = -Z + (ds < 0 ? 1.1 : .2) /* clear of the stair when the far wall is the east */, segs = [[sz0, -.45], [.45, Z - .2]];
    for (const [z0, z1] of segs) { const [a, b] = xs(X - .45, X); bx('cedar', a, b, F0, F0 + .06, z0, z1, 'shelves', 0); for (const y of [.5, 1.05, 1.6, 2.15]) bx('cedar', a, b, F0 + y - .03, F0 + y, z0, z1);
      for (const zz of [z0, z1 - .04]) bx('cedar', a, b, F0, F0 + 2.2, zz, zz + .04);
      for (const y of [.5, 1.05, 1.6]) for (let z = z0 + .1; z < z1 - .3; z += .32) { const k = dyes[Math.floor(r() * 4)], g = new THREE.CylinderGeometry(.13, .13, .38, 10); g.rotateZ(Math.PI / 2); put(g, k, U(X - .24), F0 + y + .13, z + .16, 0); } } }
  const counter = (() => { const [a, b] = xs(X - 1.75, X - 1.2), z0 = -Z + 1.2, z1 = Z - 1.4; bx('cedarD', a, b, F0, F0 + .92, z0, z1, 'counter', 0); bx('cedar', a - .04, b + .04, F0 + .92, F0 + .96, z0 - .04, z1 + .04);
    for (let z = z0 + .3; z < z1 - .2; z += .9) { const k = dyes[Math.floor(r() * 4)]; bx(k, a + .08, b - .08, F0 + .96, F0 + 1.02, z, z + .55); } return { x0: a, x1: b, z0, z1, y: F0 + .96 }; })();
  { const sx = U(X - .82); bx('cedar', sx - .17, sx + .17, F0 + .58, F0 + .62, -.17, .17, 'stool', 0); for (const a of [.6, 2.7, 4.8]) put(new THREE.CylinderGeometry(.02, .025, .58, 6), 'cedar', sx + Math.cos(a) * .12, F0 + .29, Math.sin(a) * .12); }
  const lamp0 = [(counter.x0 + counter.x1) / 2, counter.y + .1, counter.z1 - .4]; put(new THREE.SphereGeometry(.07, 10, 6).scale(1.6, .6, 1), 'brass', lamp0[0], counter.y + .04, lamp0[2]); put(new THREE.SphereGeometry(.014, 6, 5).scale(1, 2, 1), 'flame', lamp0[0] + .1, counter.y + .1, lamp0[2]);
  { const px = U(-(X - .3)); bx('cedar', px - .03, px + .03, F0 + 2.6, F0 + 2.66, -2.3, -.5); for (const z of [-2.3, -.5]) bx('cedar', px - .02, px + .02, F0 + 2.66, F1 - .4, z - .02, z + .02);
    for (let z = -2.15, k = 0; z < -.6; z += .38, k++) { const L = 1.2 + r() * .5, c = new THREE.PlaneGeometry(.34, L, 1, 6), P = c.attributes.position; for (let i = 0; i < P.count; i++) P.setZ(i, .03 * Math.sin(P.getY(i) * 6 + k)); c.rotateY(Math.PI / 2); c.computeVertexNormals();
      put(c, dyes[k % 4], px, F0 + 2.62 - L / 2, z, 0); } boxes.push({ tag: 'cloths', x0: px - .1, x1: px + .1, y0: F0 + 2.62 - 1.7, y1: F0 + 2.7, z0: -2.35, z1: -.45, fl: 0 }); }
  for (const [u, z, s] of [[-(X - .4), Z - .45, 1], [-(X - .4), Z - 1.25, .85], [-(X - 1.1), Z - .4, .7]]) { const g = new THREE.LatheGeometry([[.001, 0], [.2, 0], [.3, .2], [.32, .45], [.22, .62], [.18, .7], [.2, .74], [.001, .74]].map(([a, b]) => new THREE.Vector2(a * s, b * s)), 14);
    put(g, 'terra', U(u), F0, z); put(new THREE.CircleGeometry(.17 * s, 12).rotateX(-Math.PI / 2), dyes[Math.floor(r() * 2)], U(u), F0 + .7 * s, z); boxes.push({ tag: 'jar', x0: U(u) - .32 * s, x1: U(u) + .32 * s, y0: F0, y1: F0 + .74 * s, z0: z - .32 * s, z1: z + .32 * s, fl: 0 }); }
  // ── upstairs: the dado, the rail round the well, the divan and its rug and table, the bed and a chest, the kitchen
  dado(F1, .6);
  { const top = F1 + .95; for (const [x0, z0, x1, z1] of [[well.x0, well.z1, well.x1, well.z1], [well.x0, -Z, well.x0, well.z1]]) { const L = Math.hypot(x1 - x0, z1 - z0), n = Math.max(1, Math.round(L / .9));
      for (let k = 0; k <= n; k++) { const x = x0 + (x1 - x0) * k / n, z = z0 + (z1 - z0) * k / n; bx('cedar', x - .04, x + .04, F1, top, z - .04, z + .04); }
      bx('cedar', Math.min(x0, x1) - .05, Math.max(x0, x1) + .05, top, top + .06, Math.min(z0, z1) - .05, Math.max(z0, z1) + .05); for (const y of [.35, .65]) bx('cedar', Math.min(x0, x1) - .02, Math.max(x0, x1) + .02, F1 + y, F1 + y + .03, Math.min(z0, z1) - .02, Math.max(z0, z1) + .02); }
    boxes.push({ tag: 'wellrail', x0: well.x0 - .05, x1: well.x1, y0: F1, y1: top, z0: well.z1 - .05, z1: well.z1 + .05, fl: 1 }, { tag: 'wellrail', x0: well.x0 - .05, x1: well.x0 + .05, y0: F1, y1: top, z0: -Z, z1: well.z1, fl: 1 }); }
  const divan = { x0: -X + .05, x1: 1.6, z0: Z - .8, z1: Z, y: F1 + .42 }; bx('cedar', divan.x0, divan.x1, F1, F1 + .3, divan.z0, divan.z1, 'divan', 1); bx('indigo', divan.x0, divan.x1, F1 + .3, divan.y, divan.z0 + .02, divan.z1 - .02);
  for (let x = divan.x0 + .35, k = 0; x < divan.x1 - .3; x += .62, k++) { put(new THREE.BoxGeometry(.52, .42, .16).translate(0, 0, 0), k % 2 ? 'madder' : 'saffron', x, divan.y + .2, Z - .12, 0, .6, -.12); }
  { const g = new THREE.PlaneGeometry(2.8, 1.9); g.rotateX(-Math.PI / 2); put(g, 'rug', -1.0, F1 + .006, Z - 1.85); }
  const table = { x: -1.0, z: Z - 1.75, y: F1 + .42 }; put(new THREE.CylinderGeometry(.48, .48, .03, 28), 'brass', table.x, table.y - .015, table.z); for (let k = 0; k < 6; k++) { const a = k * Math.PI / 3; bx('cedarD', table.x + Math.cos(a) * .3 - .02, table.x + Math.cos(a) * .3 + .02, F1, table.y - .03, table.z + Math.sin(a) * .3 - .02, table.z + Math.sin(a) * .3 + .02); }
  boxes.push({ tag: 'table', x0: table.x - .48, x1: table.x + .48, y0: F1, y1: table.y, z0: table.z - .48, z1: table.z + .48, fl: 1 });
  for (let k = 0; k < 3; k++) put(new THREE.CylinderGeometry(.035, .03, .08, 10), k ? 'delft' : 'blue', table.x - .2 + k * .2, table.y + .04, table.z + (k - 1) * .1); put(new THREE.SphereGeometry(.09, 12, 8).scale(1, 1.2, 1), 'brass', table.x + .15, table.y + .1, table.z - .2);
  const bed = { x0: -X + .02, x1: -X + 1.42, z0: -2.45, z1: -.4 }; bx('cedar', bed.x0, bed.x1, F1, F1 + .32, bed.z0, bed.z1, 'bed', 1); bx('linen', bed.x0 + .04, bed.x1 - .04, F1 + .32, F1 + .44, bed.z0 + .04, bed.z1 - .04); bx('indigo', bed.x0 + .02, bed.x1 - .02, F1 + .44, F1 + .48, bed.z0 + .5, bed.z1 - .02);
  { const g = new THREE.CylinderGeometry(.11, .11, 1.2, 12); g.rotateZ(Math.PI / 2); put(g, 'madder', (bed.x0 + bed.x1) / 2, F1 + .55, bed.z0 + .25); }
  bx('cedarD', -X + .05, -X + .95, F1, F1 + .5, .3, .85, 'chest', 1); bx('brass', -X + .05, -X + .95, F1 + .32, F1 + .36, .85, .87);
  const braziers = [], kz0 = .45, kitchen = { x0: X - .65, x1: X, z0: kz0, z1: Z }; bx('plaster', kitchen.x0, kitchen.x1, F1, F1 + .82, kz0, Z, 'kitchen', 1); bx('zellige', kitchen.x0 - .03, kitchen.x1, F1 + .82, F1 + .86, kz0 - .03, Z);
  for (const z of [kz0 + .7, kz0 + 1.6]) { bx('dark', kitchen.x0 + .15, kitchen.x1 - .15, F1 + .86, F1 + .87, z - .2, z + .2); put(new THREE.SphereGeometry(.13, 8, 5).scale(1.2, .3, 1.2), 'ember', (kitchen.x0 + kitchen.x1) / 2, F1 + .87, z); braziers.push([(kitchen.x0 + kitchen.x1) / 2, F1 + .87, z]); }
  { const pot = new THREE.SphereGeometry(.15, 12, 8, 0, Math.PI * 2, .4, Math.PI - .4); put(pot, 'copper', (kitchen.x0 + kitchen.x1) / 2, F1 + 1.0, kz0 + .7); }
  { const y = F1 + 1.75; bx('iron', X - .2, X - .17, y, y + .03, kz0 + .1, Z - .2); for (let k = 0; k < 4; k++) { const z = kz0 + .4 + k * .6, rr = .1 + (k % 2) * .05; bx('iron', X - .19, X - .18, y - .2, y, z - .005, z + .005);
      put(new THREE.CylinderGeometry(rr, rr * .85, rr * 1.2, 14), 'copper', X - .19 - rr, y - .2 - rr * .6, z); } }
  const jar = [2.55, Z - .35]; put(new THREE.LatheGeometry([[.001, 0], [.12, 0], [.26, .22], [.28, .5], [.16, .72], [.13, .78], [.001, .78]].map(([a, b]) => new THREE.Vector2(a, b)), 14), 'terra', jar[0], F1, jar[1]);
  boxes.push({ tag: 'waterjar', x0: jar[0] - .28, x1: jar[0] + .28, y0: F1, y1: F1 + .78, z0: jar[1] - .28, z1: jar[1] + .28, fl: 1 });
  // the brass lantern on a chain from the middle of the upper room's ceiling
  const lamp = [.2, CEIL - .55, .6]; bx('iron', lamp[0] - .005, lamp[0] + .005, lamp[1] + .2, CEIL - .2, lamp[2] - .005, lamp[2] + .005);
  put(new THREE.CylinderGeometry(.1, .12, .26, 8), 'glow', ...lamp); put(new THREE.ConeGeometry(.14, .18, 8), 'brass', lamp[0], lamp[1] + .22, lamp[2]); put(new THREE.CylinderGeometry(.13, .13, .03, 8), 'brass', lamp[0], lamp[1] - .14, lamp[2]);
  // the roof's beams over the upper room, cut at the hatch
  const hatch = { x0: -1.62, x1: -.15, z0: -Z, z1: -2.6 };
  for (let x = -X + .5; x < X - .2; x += .9) { const over = x > hatch.x0 - .1 && x < hatch.x1 + .1; bx('cedarD', x - .07, x + .07, CEIL - .18, CEIL, over ? hatch.z1 : -Z, Z); }
  // the steep stair to the roof: two cedar stringers and ten treads along the back wall, its foot by the well, its head under the hatch
  const RS = { x0: -1.6, x1: -.3, z0: -Z + .08, z1: -Z + .73, n: 10 }; { const rr = (F2 - F1) / (RS.n + 1), gg = (RS.x1 - RS.x0) / RS.n;
    for (const z of [RS.z0, RS.z1 - .05]) { const L = Math.hypot(RS.x1 - RS.x0, F2 - F1), g = new THREE.BoxGeometry(L + .3, .2, .05); g.rotateZ(-Math.atan2(F2 - F1, RS.x1 - RS.x0)); put(g, 'cedar', (RS.x0 + RS.x1) / 2 - .02, (F1 + F2) / 2, z + .025); }
    for (let k = 1; k <= RS.n; k++) bx('cedar', RS.x1 - k * gg - .07, RS.x1 - k * gg + .07, F1 + k * rr - .04, F1 + k * rr, RS.z0 + .05, RS.z1 - .05); RS.rise = +rr.toFixed(3); }
  boxes.push({ tag: 'roofstair', x0: RS.x0, x1: RS.x1, y0: F1, y1: F2, z0: RS.z0, z1: RS.z1, fl: 1 });
  // ── the terrace: a coaming round the hatch, a bench and a jar under the pergola, a line of dyed cloth drying between two posts
  { const q = hatch, y = F2; /* open on the west, where the stair's head steps off */ bx('plaster', q.x0 + .4, q.x1 + .06, y, y + .14, q.z1, q.z1 + .06); bx('plaster', q.x1, q.x1 + .06, y, y + .14, -Z + .1, q.z1); }
  { const bxp = w / 2 - Math.min(2.6, w * .42) / 2 - .35, bzp = d / 2 - Math.min(2.2, d * .45) / 2 - .35; bx('cedar', bxp - .8, bxp + .8, F2 + .42, F2 + .46, bzp - .2, bzp + .2, 'roofbench', 2); for (const e of [-.7, .7]) bx('cedar', bxp + e - .04, bxp + e + .04, F2, F2 + .42, bzp - .16, bzp + .16);
    put(new THREE.LatheGeometry([[.001, 0], [.12, 0], [.22, .2], [.24, .45], [.14, .62], [.001, .62]].map(([a, b]) => new THREE.Vector2(a, b)), 12), 'terra', bxp + 1.2, F2, bzp - .5); }
  { const z = -.9, xa = -3.4, xb = 1.4, top = F2 + 1.85; for (const x of [xa, xb]) bx('cedar', x - .04, x + .04, F2, top, z - .04, z + .04, 'linepost', 2);
    bx('linen', xa, xb, top - .06, top - .05, z - .005, z + .005); for (let x = xa + .35, k = 0; x < xb - .4; x += .75, k++) { const L = .9 + r() * .5, c = new THREE.PlaneGeometry(.6, L, 4, 4), P = c.attributes.position; for (let i = 0; i < P.count; i++) P.setZ(i, .04 * Math.sin(P.getX(i) * 8 + k));
      c.computeVertexNormals(); put(c, dyes[(k + 1) % 4], x + .3, top - .06 - L / 2, z, 0); } }
  // the door's leaf, hung open against the front wall inside, on the side away from the window
  { const lw = 1.05, lx = dx + ds * (lw / 2 + .04); bx('cedarD', lx - .03, lx + .03, F0, F0 + 1.95, Z - lw - .02, Z - .02, 'leaf', 0); }
  // the walks, each on its own floor: in at the door, past the counter's end to the stair's foot; off the landing to the divan's table;
  // from the landing to the roof stair's foot
  const paths = [[[dx, Z - .3], [dx, -1.9], [SX0 - .35, -1.9], [SX0 - .35, (-Z + SZ1) / 2]], [[X - .45, (-Z + SZ1) / 2], [X - .45, -1.6], [-.1, -1.0], [table.x + .7, table.z - .7]], [[X - .45, -1.6], [0, -1.7], [RS.x1 + .25, (RS.z0 + RS.z1) / 2]]];
  const group = new THREE.Group(); let tris = 0; for (const [k, gs] of B) { const g = mergeGeometries(gs, false); gs.forEach(x => x.dispose()); const m = new THREE.Mesh(g, M[k]); m.name = k; m.castShadow = !['flame', 'ember', 'glow'].includes(k); m.receiveShadow = true; group.add(m); tris += g.attributes.position.count / 3; }
  const all = new THREE.Group(); all.add(sh.group, group);
  const windows = [...sh.open.front.filter(h => !h.door).map(h => ({ face: 'front', x: h.x, z: d / 2, y: sh.yW + h.y, w: h.w, h: h.h })), ...sh.open.back.map(h => ({ face: 'back', x: -h.x, z: -d / 2, y: sh.yW + h.y, w: h.w, h: h.h }))];
  return { group: all, shell: sh.group, room: group, tris: Math.round(tris), draws: group.children.length, shellTris: sh.tris, shellCalls: sh.draws, inner: { x0: -X, x1: X, z0: -Z, z1: Z }, floors: [F0, F1, F2], ceil: [F1 - .4, CEIL - .18], beams,
    door: { x: dx, z: d / 2, w: 1.05, h: 2.0 }, stair: { x0: SX0, x1: LX, z0: -Z, z1: SZ1, rise: +rise.toFixed(4), going, n: N }, well, hatch, roofStair: RS, paths, boxes, bed, divan, table, counter, lamp, lamp0, braziers, windows, w, d, top: F2 };
}

// gatelandsInn(o, r) (Session 893, card F9; L9's three inns, OG-108's "cosy Gatelander inn with a hearth"; Michael's A on #303: rooms
//   inside the street's own shell): the kit's farmhouse (GL_PLANS.farmhouse: 10.5 by 6.2 m, walls of 0.5 m, storeys of 2.9 and 2.7 m,
//   whitewashed under slate, a stack at each gable; its front door left ajar, plan.interior) as a village inn. The taproom round the
//   west gable's open hearth: a high-backed settle facing the fire and two stools, a crane and a pot; the bar across the back wall
//   between the back window and the back door, kegs on a rack behind it and a lantern over it; two tables with benches; a stair of
//   16 risers up the east gable wall to a landing. Upstairs, a passage along the back wall from the landing, three guest rooms off it
//   behind deal partitions, each with a bed, a chest and a washstand under its front window; a boarded ceiling under the slate.
//   -> { group, shell, room, tris, draws, inner, floors [ground, upper], ceil, door, hearth, fire, stair, well, rooms: [{ x0, x1, door }],
//        paths, boxes (tagged, with their floor), beds, tables, benches, settle, bar, lamp, windows }
export function gatelandsInn(o = {}, r = stream('inn')) {
  const plan = GL_PLANS.farmhouse({ paint: o.paint || 'green' }); plan.interior = true; plan.r = stream('inn-shell'); plan.open.front[0].ajar = true;
  const shell = gatelandsBuilding(plan), M = mats(), B = new Map(), boxes = [], t = plan.t, X = plan.w / 2 - t, Z = plan.d / 2 - t, F0 = .05, F1 = plan.floors[0], EAVE = plan.floors[0] + plan.floors[1], CEIL = EAVE - .12;
  const put = (geo, key, x = 0, y = 0, z = 0, ry = 0, uv = .6) => { const g = geo.index ? geo.toNonIndexed() : geo; for (const k of Object.keys(g.attributes)) if (!['position', 'normal'].includes(k)) g.deleteAttribute(k);
    g.applyMatrix4(new THREE.Matrix4().compose(new THREE.Vector3(x, y, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(0, ry, 0)), new THREE.Vector3(1, 1, 1))); worldUV(g, uv); if (!B.has(key)) B.set(key, []); B.get(key).push(g); return g; };
  const bx = (key, x0, x1, y0, y1, z0, z1, tag, fl) => { put(new THREE.BoxGeometry(x1 - x0, y1 - y0, z1 - z0), key, (x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2); if (tag) boxes.push({ tag, x0, x1, y0, y1, z0, z1, fl }); };
  // the taproom's floor: flags in courses
  for (let z = -Z, row = 0; z < Z - .05; row++) { const d = Math.min(Z - z, .55 + r() * .35); for (let x = -X; x < X - .05;) { const w = Math.min(X - x, .6 + r() * .45); put(new THREE.BoxGeometry(w - .02, .05, d - .02), 'flag', x + w / 2, .025 + (r() - .5) * .006, z + d / 2, (r() - .5) * .01, .7); x += w; } z += d; }
  // the hearth in the west gable under its stack: a breast 0.5 m proud, the opening 1.6 by 1.3 m sooted, an oak lintel, a hearthstone
  const hw = 1.6, hh = 1.3, BD = .5, hx = -X; { const z0 = -hw / 2 - .4, z1 = hw / 2 + .4; bx('lime', hx, hx + BD, hh, F1 - .45, z0, z1); bx('lime', hx, hx + BD, 0, hh, z0, -hw / 2, 'breast', 0); bx('lime', hx, hx + BD, 0, hh, hw / 2, z1, 'breast', 0);
    bx('soot', hx, hx + .02, 0, hh, -hw / 2, hw / 2); bx('soot', hx, hx + BD, hh - .02, hh, -hw / 2, hw / 2); bx('oak', hx + BD - .3, hx + BD + .08, hh, hh + .24, -hw / 2 - .25, hw / 2 + .25); bx('flag', hx + BD, hx + BD + .8, F0, F0 + .03, -hw / 2, hw / 2, 'hearthstone', 0); }
  const fx = hx + .28, fire = [fx + .05, .32, 0]; for (let i = 0; i < 7; i++) { const a = i / 7 * Math.PI * 2; put(new THREE.BoxGeometry(.24, .1, .12), 'turf', fx + Math.cos(a) * .15, .06 + (i % 2) * .08, Math.sin(a) * .22, a + 1.3); }
  put(new THREE.SphereGeometry(.16, 10, 6).scale(1.2, .4, 1.4), 'ember', fx, .08, 0); for (let i = 0; i < 3; i++) put(new THREE.ConeGeometry(.07, .28 + i * .06, 7), 'flame', fx + (i - 1) * .04, .26, (i - 1) * .09);
  { const cx = hx + .06, cz = -hw / 2 + .08; bx('iron', cx - .02, cx + .02, .2, 1.15, cz - .02, cz + .02); put(new THREE.BoxGeometry(.03, .03, .75), 'iron', cx + .02, 1.05, cz + .37); put(new THREE.CylinderGeometry(.008, .008, .4, 4), 'iron', cx + .02, .85, cz + .62);
    put(new THREE.SphereGeometry(.17, 14, 10, 0, Math.PI * 2, .35, Math.PI - .35), 'iron', cx + .2, .55, cz + .62); }
  // the settle facing the fire, two stools beside it
  const settle = { x0: hx + BD + 1.6, x1: hx + BD + 2.1, z0: -1.0, z1: .9, y: F0 + .44 }; bx('oak', settle.x0, settle.x1, F0, settle.y, settle.z0, settle.z1, 'settle', 0); bx('oak', settle.x1 - .08, settle.x1, settle.y, F0 + 1.35, settle.z0, settle.z1); for (const z of [settle.z0, settle.z1 - .06]) bx('oak', settle.x0, settle.x1, settle.y, F0 + .75, z, z + .06);
  bx('wool', settle.x0 + .02, settle.x1 - .1, settle.y, settle.y + .04, settle.z0 + .1, settle.z1 - .1);
  const seats = [settle.y - F0]; for (const [x, z] of [[hx + BD + 1.0, 1.35], [hx + BD + 1.0, -1.45]]) { bx('deal', x - .17, x + .17, F0 + .41, F0 + .45, z - .17, z + .17, 'stool', 0); for (const a of [0, 2.1, 4.2]) put(new THREE.CylinderGeometry(.018, .022, .41, 6), 'deal', x + Math.cos(a) * .11, F0 + .205, z + Math.sin(a) * .11); seats.push(.45 - .05 + .05); }
  // the bar across the back wall, between the back window (x = -2) and the back door (x = 1.5): a counter of oak boards, a rack of kegs
  // behind it against the wall, jugs and tankards on the counter, a lantern from the beam over it
  const bar = { x0: -1.35, x1: .75, z0: -Z + .95, z1: -Z + 1.5, y: F0 + 1.05 }; bx('oak', bar.x0, bar.x1, F0, bar.y - .05, bar.z0, bar.z1, 'bar', 0); bx('deal', bar.x0 - .04, bar.x1 + .04, bar.y - .05, bar.y, bar.z0 - .04, bar.z1 + .04);
  bx('oak', bar.x0 + .1, bar.x1 - .1, F0, F0 + .45, -Z, -Z + .55, 'rack', 0); for (let x = bar.x0 + .4, k = 0; x < bar.x1 - .25; x += .62, k++) { const g = new THREE.CylinderGeometry(.24, .24, .5, 14); g.rotateX(Math.PI / 2); put(g, 'oak', x, F0 + .45 + .24, -Z + .27); put(new THREE.CylinderGeometry(.03, .03, .08, 6).rotateX(Math.PI / 2), 'iron', x, F0 + .5, -Z + .55); }
  bx('deal', bar.x0, bar.x1, F0 + 1.7, F0 + 1.73, -Z, -Z + .28); for (let x = bar.x0 + .15; x < bar.x1 - .1; x += .22) put(new THREE.CylinderGeometry(.05, .06, .18, 10), x % .44 < .22 ? 'crock' : 'delft', x, F0 + 1.82, -Z + .14);
  for (let k = 0; k < 4; k++) put(new THREE.CylinderGeometry(.045, .045, .14, 10), k % 2 ? 'crock' : 'iron', bar.x0 + .4 + k * .4, bar.y + .07, (bar.z0 + bar.z1) / 2);
  // the stair up the east gable wall: 16 risers from the flags to the upper floor, going 0.25, its landing in the back corner
  const N = 16, rise = (F1 - F0) / N, going = .25, SX0 = X - .9, LZ = -Z + .75, SZ0 = LZ + (N - 1) * going /* the foot */;
  for (let k = 1; k < N; k++) bx('oak', SX0, X, F0, F0 + k * rise, SZ0 - k * going, SZ0 - (k - 1) * going, 'stair', 0);
  bx('oak', SX0, X, F0, F1 - .2, -Z, LZ, 'landing', 0);
  const kmax = Math.floor((F1 - .42 - F0 - 2.0) / rise) /* 2 m under the beams over the stair's foot */, well = { x0: SX0, x1: X, z0: LZ, z1: SZ0 - kmax * going };
  // the upper floor: deal boards on oak beams across the house every 0.9 m, open over the stair; a boarded ceiling under the slate
  for (const [a0, a1, b0, b1] of [[-X, SX0, -Z, Z], [SX0, X, -Z, well.z0], [SX0, X, well.z1, Z]]) { bx('oak', a0, a1, F1 - .2, F1 - .04, b0, b1); bx('deal', a0, a1, F1 - .04, F1, b0, b1); }
  const beams = []; for (let x = -X + .55; x < X - .2; x += .9) { const over = x > well.x0 - .12; bx('oak', x - .09, x + .09, F1 - .42, F1 - .2, -Z, over ? well.z0 : Z); if (over) bx('oak', x - .09, x + .09, F1 - .42, F1 - .2, well.z1, Z); beams.push(x); }
  bx('deal', -X, X, CEIL, CEIL + .04, -Z, Z); for (let x = -X + .55; x < X - .2; x += 1.2) bx('oak', x - .07, x + .07, CEIL - .16, CEIL, -Z, Z);
  // the tables: one before the front window east of the door, one by the hearth side; benches along their long sides
  const tables = [], benches = []; for (const [tx, tz] of [[2.1, .45], [-1.2, 1.4]]) { const T = { x0: tx - .8, x1: tx + .8, z0: tz - .38, z1: tz + .38, y: F0 + .76 }; bx('deal', T.x0, T.x1, T.y - .05, T.y, T.z0, T.z1, 'table', 0);
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) bx('oak', tx + sx * .7 - .04, tx + sx * .7 + .04, F0, T.y - .05, tz + sz * .28 - .04, tz + sz * .28 + .04); tables.push(T);
    for (const sz of tx > 0 ? [-1, 1] : [-1]) { const bz = tz + sz * .62; bx('oak', tx - .75, tx + .75, F0 + .41, F0 + .45, bz - .15, bz + .15, 'bench', 0); for (const sx of [-1, 1]) bx('oak', tx + sx * .65 - .03, tx + sx * .65 + .03, F0, F0 + .41, bz - .12, bz + .12); benches.push(.45); }
    put(new THREE.CylinderGeometry(.012, .014, .14, 8), 'linen', tx + .2, T.y + .07, tz); put(new THREE.SphereGeometry(.012, 6, 5).scale(1, 2, 1), 'flame', tx + .2, T.y + .155, tz); }
  const lamp = [(bar.x0 + bar.x1) / 2, F1 - .95, bar.z1 + .3]; bx('iron', lamp[0] - .005, lamp[0] + .005, lamp[1] + .1, F1 - .42, lamp[2] - .005, lamp[2] + .005); put(new THREE.CylinderGeometry(.08, .09, .22, 6), 'glow', ...lamp); put(new THREE.ConeGeometry(.1, .1, 6), 'iron', lamp[0], lamp[1] + .16, lamp[2]);
  // upstairs: the rail round the well, a passage along the back wall, three rooms off it behind deal partitions with doors
  const PZ = -Z + 1.2, top = F1 + .95; { for (const [x0, z0, x1, z1] of [[well.x0, well.z0 + .1, well.x0, well.z1], [well.x0, well.z1, X, well.z1]]) { bx('oak', Math.min(x0, x1) - .04, Math.min(X, Math.max(x0, x1) + .04), top, top + .06, Math.min(z0, z1) - .04, Math.max(z0, z1) + .04, 'wellrail', 1);
      const n = Math.max(1, Math.round(Math.hypot(x1 - x0, z1 - z0) / .9)); for (let k = 0; k <= n; k++) { const x = x0 + (x1 - x0) * k / n, z = z0 + (z1 - z0) * k / n; bx('oak', x - .04, x + .04, F1, top, z - .04, z + .04); } } }
  const RX = [-X, -1.45, 1.65, SX0 - .1], rooms = [], wallK = 'deal';
  { const doorAt = i => (RX[i] + RX[i + 1]) / 2 + (i === 2 ? -.4 : 0), dw = .8, dh = 1.95;
    /* the passage's wall, along z = PZ from the west gable to the well, a door into each room */ for (let i = 0; i < 3; i++) { const dx = doorAt(i), a = RX[i] + (i ? .04 : 0), b = RX[i + 1] - .04; bx(wallK, a, dx - dw / 2, F1, CEIL, PZ - .04, PZ + .04, 'partition', 1); bx(wallK, dx + dw / 2, b, F1, CEIL, PZ - .04, PZ + .04, 'partition', 1); bx(wallK, dx - dw / 2, dx + dw / 2, F1 + dh, CEIL, PZ - .04, PZ + .04);
      rooms.push({ x0: RX[i], x1: RX[i + 1], door: { x: dx, z: PZ, w: dw, h: dh } }); }
    for (const x of [RX[1], RX[2]]) bx(wallK, x - .04, x + .04, F1, CEIL, PZ + .04, Z, 'partition', 1);
    /* the third room's east side: a partition along the well's west edge from the passage to the well's end */ bx(wallK, RX[3] - .04, RX[3] + .04, F1, CEIL, PZ + .04, well.z1, 'partition', 1); }
  // each room: a bed against its partition, a chest at its foot, a washstand with a jug and basin under the front window
  const beds = []; rooms.forEach((R, i) => { const e = i === 1 ? -1 : 1, bx0 = e > 0 ? R.x0 + .05 : R.x1 - .05 - 1.0, b = { x0: bx0, x1: bx0 + 1.0, z0: Z - 2.05, z1: Z - .05 };
    bx('oak', b.x0, b.x1, F1, F1 + .45, b.z0, b.z1, 'bed', 1); bx('straw', b.x0 + .04, b.x1 - .04, F1 + .45, F1 + .55, b.z0 + .04, b.z1 - .04); bx('wool', b.x0 + .03, b.x1 - .03, F1 + .55, F1 + .6, b.z0 + .04, b.z1 - .5); bx('linen', b.x0 + .1, b.x1 - .1, F1 + .55, F1 + .66, b.z1 - .45, b.z1 - .08);
    bx('oak', b.x0 + .05, b.x0 + .95, F1, F1 + .5, b.z0 - .55, b.z0 - .05, 'chest', 1); beds.push(b);
    const wx = [-3.1, 0, 3.1][i] /* under the room's front window */, wz = Z - .3; bx('deal', wx - .25, wx + .25, F1, F1 + .78, wz - .2, wz + .2, 'washstand', 1); put(new THREE.CylinderGeometry(.16, .1, .08, 14), 'delft', wx, F1 + .82, wz); put(new THREE.CylinderGeometry(.06, .07, .22, 12), 'delft', wx + .12, F1 + .93, wz - .05); });
  // the front door's leaf, hung open against the front wall inside, west of the doorway
  const door = plan.open.front[0]; bx('paint', door.x - door.w / 2 - door.w - .02, door.x - door.w / 2 - .02, F0, F0 + 2.05, Z - .06, Z, 'leaf', 0);
  // the walks: in at the door to the bar; in at the door to the stair's foot; off the landing along the passage to each room's door
  const paths = [[[door.x, Z - .3], [door.x, bar.z1 + .3]], [[door.x, Z - .3], [.3, Z - .45], [SX0 + .45, Z - .35], [SX0 + .45, SZ0 + .25]],
    [[SX0 + .45, (LZ - Z) / 2], [SX0 - .5, (-Z + PZ) / 2], ...rooms.map(R => [R.door.x, (-Z + PZ) / 2]).reverse().slice(0, 1), [rooms[0].door.x, (-Z + PZ) / 2], [rooms[0].door.x, PZ + .5]]];
  { const G = glMats().glass, Lt = glMats().lit; /* the lamplit panes too: from inside they are glass */ shell.traverse(m => { if (m.isMesh && (m.material === G || m.material === Lt)) { m.material = mats().pane; m.name = 'pane'; } }); }
  const group = new THREE.Group(); let tris = 0; for (const [k, gs] of B) { const g = mergeGeometries(gs, false); gs.forEach(x => x.dispose()); const m = new THREE.Mesh(g, M[k]); m.name = k; m.castShadow = !['flame', 'ember', 'glow'].includes(k); m.receiveShadow = true; group.add(m); tris += g.attributes.position.count / 3; }
  const all = new THREE.Group(); all.add(shell, group);
  const windows = Object.entries(plan.open).flatMap(([f, os]) => (os || []).filter(q => q.kind === 'win').map(q => ({ face: f, x: f === 'front' ? q.x : -q.x, z: f === 'front' ? plan.d / 2 : -plan.d / 2, y: q.y, w: q.w, h: q.h })));
  return { group: all, shell, room: group, tris: Math.round(tris), draws: group.children.length, shellTris: shell.userData.tris, shellCalls: shell.userData.calls, inner: { x0: -X, x1: X, z0: -Z, z1: Z }, floors: [F0, F1], ceil: [F1 - .42, CEIL - .16], eave: EAVE,
    door: { x: door.x, z: plan.d / 2, w: door.w, h: door.h }, hearth: [hx + BD, 0, 0], fire, stair: { x0: SX0, x1: X, z0: LZ, z1: SZ0, rise: +rise.toFixed(4), going, n: N }, well, rooms, passage: PZ, paths, boxes, beds, tables, benches, seats, settle, bar, lamp, windows, w: plan.w, d: plan.d };
}

// markAlehall(o, r) (Session 894, card F9; L9's three inns, OG-108's "Markish longhouse with long tables"; Michael's A on #303: rooms
//   inside the street's own shell): the Mark's hall of pieces.js (shingle, its smoke louver on the ridge, o.interior), widened to 10 by 18 m,
//   as the Mark's inn. The longhouse's frame (Session 870): posts in two rows carrying purlins and tie beams, rafters and a board lining.
//   A long hearth on the axis under the louver, its kerb of stones, logs, and a cauldron on its tripod. Down both sides between the
//   posts, a long table of 12 m with a loose bench on the aisle side; against the walls behind the posts, the raised benches the guests
//   sit on to eat and sleep on at night, laid with furs. Across the back, the serving counter and the kegs behind it, horns on pegs; by
//   the door, a rack of spears and painted round shields (the Mark's soldiers for hire, §1.2) and a water barrel. Iron lamps hang
//   over the tables and before the counter. Captains and reeves, not clans (L9).
//   -> { group, shell, room, tris, draws, inner, under, floor, tieBeam, fire, hearth, louver, door, path, boxes, tables, benches, counter, lamps, w, d }
export function markAlehall(o = {}, r = stream('alehall')) {
  const w = o.w ?? 10, d = o.d ?? 18, hall = markHall({ roof: 'shingle', w, d, porch: true, chimney: false, carve: true, wall: o.wall ?? 1, interior: true }, stream('alehall-shell'));
  const M = longMats(), B = new Map(), boxes = [];
  const put = (geo, key, x = 0, y = 0, z = 0, ry = 0, uv = .6, rx = 0, rz = 0) => { const g = geo.index ? geo.toNonIndexed() : geo; for (const k of Object.keys(g.attributes)) if (!['position', 'normal'].includes(k)) g.deleteAttribute(k);
    g.applyMatrix4(new THREE.Matrix4().compose(new THREE.Vector3(x, y, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(rx, ry, rz, 'YXZ')), new THREE.Vector3(1, 1, 1))); worldUV(g, uv);
    if (!B.has(key)) B.set(key, []); B.get(key).push(g); return g; };
  const bx = (key, x0, x1, y0, y1, z0, z1, tag) => { put(new THREE.BoxGeometry(x1 - x0, y1 - y0, z1 - z0), key, (x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2); if (tag) boxes.push({ tag, x0, x1, y0, y1, z0, z1 }); };
  const X = w / 2 - .25, Z = d / 2 - .25, FY = hall.sill + .04, tp = Math.tan(hall.pitch), under = x => hall.ry0 + (w / 2 + hall.ov - Math.abs(x)) * tp - .02, WP = hall.sill + hall.wh;
  // the floor, the frame and the lining, as the longhouse's
  for (let x = -X; x < X - .01; x += .28) bx('plank', x + .005, Math.min(x + .275, X), hall.sill, FY, -Z, Z);
  const PXr = X - 1.25, TB = WP + .25, posts = []; for (let z = -Z + 2.6; z < Z - 1.2; z += 2.75) posts.push(z);
  for (const sx of [-1, 1]) { for (const z of posts) bx('post', sx * PXr - .11, sx * PXr + .11, FY, TB, z - .11, z + .11, 'post'); bx('post', sx * PXr - .12, sx * PXr + .12, TB, TB + .24, -Z, Z); }
  for (const z of posts) bx('post', -PXr - .1, PXr + .1, TB, TB + .24, z - .1, z + .1);
  const XL = w / 2 - .02, rl = X / Math.cos(hall.pitch); for (const sx of [-1, 1]) { const xm = sx * X / 2, rz = -sx * hall.pitch;
    for (let z = -Z + .3; z < Z; z += 1.0) put(new THREE.BoxGeometry(rl, .14, .1), 'post', xm, under(xm) - .03 - .07 / Math.cos(hall.pitch), z, 0, .8, 0, rz);
    put(new THREE.BoxGeometry(XL / Math.cos(hall.pitch), .02, 2 * Z), 'board', sx * XL / 2, under(XL / 2) - .01, 0, 0, .8, 0, rz); }
  // the long hearth under the louver: 4 m of kerb, ash, logs and embers, a cauldron on its tripod
  const hz = hall.louver ?? -2.7, H = { x0: -.55, x1: .55, z0: hz - 2.0, z1: hz + 2.0 };
  for (let z = H.z0; z < H.z1 - .01; z += .3) for (const x of [H.x0, H.x1]) { const s = .13 + r() * .04, g = new THREE.IcosahedronGeometry(s, 1); g.scale(1.3, .7, 1.1); put(g, 'kerb', x, FY + s * .55, z + .15, r() * 3); }
  for (let x = H.x0 + .3; x < H.x1 - .2; x += .3) for (const z of [H.z0, H.z1]) { const s = .13 + r() * .04, g = new THREE.IcosahedronGeometry(s, 1); g.scale(1.1, .7, 1.3); put(g, 'kerb', x, FY + s * .55, z, r() * 3); }
  boxes.push({ tag: 'hearth', x0: H.x0 - .2, x1: H.x1 + .2, y0: FY, y1: FY + .2, z0: H.z0 - .2, z1: H.z1 + .2 }); bx('ash', H.x0 + .1, H.x1 - .1, FY, FY + .04, H.z0 + .1, H.z1 - .1);
  const fire = [0, FY + .25, hz]; for (let i = 0; i < 9; i++) { const g = new THREE.CylinderGeometry(.06, .07, .9, 7); g.rotateZ(Math.PI / 2); put(g, 'log', 0, FY + .1 + (i % 2) * .07, hz + (i - 4) * .16, i * .3 + .2); }
  put(new THREE.SphereGeometry(.24, 10, 6).scale(1.4, .35, 3.2), 'ember', 0, FY + .08, hz); for (let i = 0; i < 6; i++) put(new THREE.ConeGeometry(.09, .34 + (i % 2) * .14, 7), 'flame', (i % 2 - .5) * .12, FY + .3, hz + (i - 2.5) * .22);
  { const cz = hz + 1.3; for (const a of [0, 2.1, 4.2]) put(new THREE.CylinderGeometry(.015, .015, 1.25, 5), 'iron', Math.cos(a) * .32, FY + .58, cz + Math.sin(a) * .32, 0, .6, Math.sin(a) * .26, -Math.cos(a) * .26);
    bx('iron', -.006, .006, FY + .62, FY + 1.18, cz - .006, cz + .006); put(new THREE.SphereGeometry(.24, 14, 10, 0, Math.PI * 2, .4, Math.PI - .4), 'iron', 0, FY + .55, cz); }
  // the wall benches behind the posts, from the counter's end to the door's corners, furs laid on them
  const BZ0 = -Z + 2.4, BZ1 = Z - 2.0, BH = .45, BD = 1.0, benches = [];
  for (const sx of [-1, 1]) { const x0 = sx > 0 ? X - BD : -X, x1 = sx > 0 ? X : -X + BD; bx('board', x0, x1, FY, FY + BH - .04, BZ0, BZ1, 'wallbench'); bx('plank', x0, x1, FY + BH - .04, FY + BH, BZ0, BZ1); benches.push({ x0, x1, y: FY + BH, z0: BZ0, z1: BZ1, kind: 'wall' });
    for (let z = BZ0 + .3, k = 0; z < BZ1 - 1.2; z += 1.8 + r() * .5, k++) { const L = 1.5 + r() * .4, W2 = .75 + r() * .15, g = new THREE.PlaneGeometry(W2, L, 6, 6), P = g.attributes.position;
      for (let i = 0; i < P.count; i++) P.setZ(i, .015 + .02 * Math.sin(P.getX(i) * 9 + k) * Math.cos(P.getY(i) * 7)); g.rotateX(-Math.PI / 2); g.computeVertexNormals(); put(g, ['fur', 'furPale', 'furGrey'][k % 3], (x0 + x1) / 2, FY + BH, z + L / 2, (r() - .5) * .1, .9); } }
  // the long tables inside the posts, legs every 1.5 m; a loose bench on the aisle side; horns, bowls and a jug along them
  const tables = [], TZ0 = BZ0 + .2, TZ1 = BZ1 - .3; for (const sx of [-1, 1]) { const tx1 = sx * (PXr - .15), tx0 = sx * (PXr - .9), a = Math.min(tx0, tx1), b = Math.max(tx0, tx1), T = { x0: a, x1: b, z0: TZ0, z1: TZ1, y: FY + .76 };
    bx('plank', a, b, T.y - .05, T.y, TZ0, TZ1, 'table'); for (let z = TZ0 + .2; z < TZ1; z += 1.5) for (const x of [a + .08, b - .08]) bx('post', x - .04, x + .04, FY, T.y - .05, z - .04, z + .04); tables.push(T);
    const ba = sx * (PXr - 1.1), bb = sx * (PXr - 1.45), c0 = Math.min(ba, bb), c1 = Math.max(ba, bb); bx('oak', c0, c1, FY + .41, FY + .45, TZ0, TZ1, 'bench'); for (let z = TZ0 + .3; z < TZ1; z += 2.0) bx('oak', c0 + .04, c1 - .04, FY, FY + .41, z - .04, z + .04); benches.push({ x0: c0, x1: c1, y: FY + .45, z0: TZ0, z1: TZ1, kind: 'loose' });
    for (let z = TZ0 + .5; z < TZ1 - .3; z += .9 + r() * .5) { const k = Math.floor(r() * 3), x = (a + b) / 2 + (r() - .5) * .3;
      if (k === 0) { const g = new THREE.ConeGeometry(.04, .32, 8); g.rotateZ(Math.PI / 2 - .3); put(g, 'furPale', x, T.y + .05, z, r() * 3); } else if (k === 1) put(new THREE.SphereGeometry(.09, 10, 6, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), 'oak', x, T.y + .09, z); else put(new THREE.CylinderGeometry(.06, .08, .22, 10), 'crock', x, T.y + .11, z); } }
  // the counter across the back, kegs on a rack behind it against the back wall, drinking horns on pegs over them
  const counter = { x0: -1.8, x1: 1.8, z0: -Z + 1.35, z1: -Z + 1.9, y: FY + 1.05 }; bx('board', counter.x0, counter.x1, FY, counter.y - .05, counter.z0, counter.z1, 'counter'); bx('plank', counter.x0 - .05, counter.x1 + .05, counter.y - .05, counter.y, counter.z0 - .04, counter.z1 + .04);
  bx('oak', -2.6, 2.6, FY, FY + .4, -Z, -Z + .65, 'kegrack'); for (let x = -2.25; x < 2.4; x += .7) { const g = new THREE.CylinderGeometry(.28, .28, .6, 14); g.rotateX(Math.PI / 2); put(g, 'oak', x, FY + .4 + .28, -Z + .32); put(new THREE.CylinderGeometry(.03, .03, .1, 6).rotateX(Math.PI / 2), 'iron', x, FY + .45, -Z + .65); }
  for (let x = -2.4; x < 2.5; x += .4) { bx('oak', x - .015, x + .015, FY + 1.75, FY + 1.78, -Z, -Z + .12); const g = new THREE.ConeGeometry(.045, .34, 8); g.rotateX(Math.PI); put(g, 'furPale', x, FY + 1.55, -Z + .1, 0, .6, .2); }
  // by the door: a rack of spears and round shields against the front wall on the left, a water barrel on the right
  { const x0 = -X + .2, x1 = -1.4, z = Z - .35; bx('oak', x0, x1, FY + .1, FY + .18, z - .12, z + .12, 'weaponrack'); bx('oak', x0, x1, FY + 1.6, FY + 1.68, z - .05, z + .05);
    for (let x = x0 + .2; x < x1 - .1; x += .32) { put(new THREE.CylinderGeometry(.018, .02, 2.3, 5), 'post', x, FY + 1.15, z, 0, .6, .05); put(new THREE.ConeGeometry(.03, .22, 5), 'iron', x, FY + 2.4, z + .05); }
    for (let k = 0; k < 3; k++) { const sx = x0 + .5 + k * .75, g = new THREE.CylinderGeometry(.38, .38, .04, 18); g.rotateX(Math.PI / 2); put(g, ['ham', 'board', 'furGrey'][k], sx, FY + .75, Z - .08); put(new THREE.SphereGeometry(.07, 8, 6), 'iron', sx, FY + .75, Z - .1); } }
  put(new THREE.CylinderGeometry(.32, .29, .8, 14), 'oak', X - .55, FY + .4, Z - .55); boxes.push({ tag: 'barrel', x0: X - .87, x1: X - .23, y0: FY, y1: FY + .8, z0: Z - .87, z1: Z - .23 });
  // two iron lamps on chains from the tie beams over the tables
  const lamps = []; for (const [sx, k] of [[-1, 1], [1, 3], [0, 0] /* the third over the aisle before the counter */]) { const lz = posts[k] ?? 0, L = [sx * (PXr - .5), TB - .7, lz]; bx('iron', L[0] - .005, L[0] + .005, L[1] + .05, TB, lz - .005, lz + .005);
    put(new THREE.SphereGeometry(.11, 10, 6, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), 'iron', ...L); put(new THREE.SphereGeometry(.025, 6, 5).scale(1, 2, 1), 'flame', L[0] + .05, L[1] + .04, L[2]); lamps.push(L); }
  // the front door hung open against the front wall, right of the doorway
  { const leaf = { x0: hall.door.w / 2 + .01, x1: hall.door.w / 2 + .07, z0: Z - hall.door.w - .01, z1: Z - .01 }; bx('board', leaf.x0, leaf.x1, FY, FY + hall.door.h - .12, leaf.z0, leaf.z1, 'door'); }
  // the walk: in at the door, down the aisle on the left of the hearth to the counter; and on the right, to the far end of the right table
  const path = [[0, Z - .1], [0, Z - 1.4], [-1.45, H.z1 + .5], [-1.45, counter.z1 + .45], [counter.x0 + .5, counter.z1 + .45]], path2 = [[0, Z - 1.4], [1.45, H.z1 + .5], [1.45, TZ0 + .3]];
  const group = new THREE.Group(); let tris = 0; for (const [k, gs] of B) { const g = mergeGeometries(gs, false); gs.forEach(x => x.dispose()); const m = new THREE.Mesh(g, M[k]); m.name = k; m.castShadow = !['flame', 'ember', 'glow'].includes(k); m.receiveShadow = true; group.add(m); tris += g.attributes.position.count / 3; }
  const all = new THREE.Group(); all.add(hall.group, group);
  return { group: all, shell: hall.group, room: group, tris: Math.round(tris), draws: group.children.length, shellTris: hall.tris, shellCalls: hall.draws, inner: { x0: -X, x1: X, z0: -Z, z1: Z }, under, floor: FY, tieBeam: TB,
    fire, hearth: H, louver: hall.louver, door: { x: 0, z: d / 2, w: hall.door.w, h: hall.door.h }, path, path2, boxes, tables, benches, counter, lamps, w, d };
}

// aurenneTavern(o, r) (Session 895, card F9; L9's three inns, OG-108's "Aurenne tavern on a terrace over the sea"; Michael's A on #303: rooms
//   inside the street's own shell): pieces.js's Roman house of Aurenne (the tile kind, 9.6 by 8.0 m, one storey of 3.0 m under a hipped
//   pantile roof, its arcade of four round arches across the front; o.interior) as a tavern over the harbour. Inside: a tiled floor and
//   a glazed dado, the counter across the back faced in zellige with amphorae and jars on shelves behind it, a rack of amphorae in a
//   corner, the cooking bench with its braziers, two small tables by the side windows, cedar beams under the roof, brass lamps. Under the
//   arcade, the loggia with two small tables; beyond it a paved terrace of 4 m to a parapet over the quay wall, three round tables with
//   chairs under a pergola of vines. The sea is the page's (rooms-view.js), 3 m below the terrace.
//   -> { group, shell, room, tris, draws, inner, floor, terrace: { z0, z1, y, parapet }, loggia: { z0, z1 }, arches: [x...], door, counter,
//        tables, seats, path, path2, boxes, lamps, braziers, w, d }
export function aurenneTavern(o = {}, r = stream('tavern')) {
  const w = 9.6, d = 8.0, sh = aurenneHouse({ kind: 'tile', w, d, two: false, arcade: true, wall: 0, door: 2, pointed: false, green: false, interior: true }, stream('tavern-shell'));
  const M = homeMats(), B = new Map(), boxes = [];
  const put = (geo, key, x = 0, y = 0, z = 0, ry = 0, uv = .6) => { const g = geo.index ? geo.toNonIndexed() : geo; for (const k of Object.keys(g.attributes)) if (!['position', 'normal'].includes(k)) g.deleteAttribute(k);
    g.applyMatrix4(new THREE.Matrix4().compose(new THREE.Vector3(x, y, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(0, ry, 0)), new THREE.Vector3(1, 1, 1))); worldUV(g, uv); if (!B.has(key)) B.set(key, []); B.get(key).push(g); return g; };
  const UVK = { zellige: 1.47, tile: 1.1 }, bx = (key, x0, x1, y0, y1, z0, z1, tag) => { put(new THREE.BoxGeometry(x1 - x0, y1 - y0, z1 - z0), key, (x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2, 0, UVK[key] ?? .6); if (tag) boxes.push({ tag, x0, x1, y0, y1, z0, z1 }); };
  const X = w / 2 - sh.T, Z = d / 2 - sh.T, F0 = sh.yW + .06, TOP = sh.top, ad = 1.7, az = d / 2 + ad, FT = sh.yW + .09 /* the loggia's slab, as the shell lays it */;
  const n = Math.max(3, Math.round(w / 2.2)), span = w / n, arches = Array.from({ length: n }, (_, i) => -w / 2 + (i + .5) * span);
  // inside: red tiles, the dado to 1.0 m, cedar beams across under the roof
  bx('tile', -X, X, sh.yW, F0, -Z, Z); for (const e of [-1, 1]) bx('zellige', e > 0 ? X - .02 : -X, e > 0 ? X : -X + .02, F0, F0 + 1.0, -Z, Z); bx('zellige', -X, X, F0, F0 + 1.0, -Z, -Z + .02);
  { const dg = 1.05 / 2 + .05; bx('zellige', -X, sh.doorX - dg, F0, F0 + 1.0, Z - .02, Z); bx('zellige', sh.doorX + dg, X, F0, F0 + 1.0, Z - .02, Z); }
  for (let x = -X + .6; x < X - .3; x += 1.1) bx('cedarD', x - .08, x + .08, TOP - .22, TOP, -Z, Z);
  // the counter across the back, faced in glazed tile; shelves behind it of amphorae and jars; a cedar top at 1.05 m
  const counter = { x0: -2.6, x1: 1.6, z0: -Z + .95, z1: -Z + 1.5, y: F0 + 1.05 }; bx('plaster', counter.x0, counter.x1, F0, counter.y - .05, counter.z0, counter.z1, 'counter'); bx('zellige', counter.x0, counter.x1, F0 + .1, counter.y - .1, counter.z1, counter.z1 + .02);
  bx('cedar', counter.x0 - .05, counter.x1 + .05, counter.y - .05, counter.y, counter.z0 - .04, counter.z1 + .06);
  const amph = s => new THREE.LatheGeometry([[.001, 0], [.04, 0], [.12, .15], [.2, .42], [.18, .62], [.07, .74], [.06, .86], [.08, .9], [.001, .9]].map(([a, b]) => new THREE.Vector2(a * s, b * s)), 12);
  for (const y of [1.25, 1.85]) for (const [s0, s1] of [[counter.x0, -.5], [.5, counter.x1]] /* broken round the back window */) { bx('cedar', s0, s1, F0 + y - .03, F0 + y, -Z, -Z + .35); for (let x = s0 + .2; x < s1 - .1; x += .32) { if (r() < .5) put(amph(.4), 'terra', x, F0 + y, -Z + .18); else put(new THREE.CylinderGeometry(.08, .1, .24, 10), r() < .5 ? 'blue' : 'delft', x, F0 + y + .12, -Z + .18); } }
  for (let k = 0; k < 4; k++) put(new THREE.CylinderGeometry(.04, .045, .12, 10), 'wine', counter.x0 + .5 + k * .9, counter.y + .06, (counter.z0 + counter.z1) / 2);
  // a rack of amphorae in the back right corner, leaning in a cedar frame; the cooking bench along the right wall's back half
  { const x0 = X - 1.6, x1 = X - .05, z0 = -Z + .05, z1 = -Z + .7; bx('cedar', x0, x1, F0 + .55, F0 + .6, z0, z1, 'amphorarack'); for (const x of [x0, x1 - .05]) bx('cedar', x, x + .05, F0, F0 + .6, z0, z1);
    for (let x = x0 + .25; x < x1 - .1; x += .4) { const g = amph(.95); g.rotateX(-.25); put(g, 'terra', x, F0 + .02, (z0 + z1) / 2 + .1); } }
  const braziers = [], kb = { x0: X - .65, x1: X, z0: -Z + 1.0, z1: -.6 }; bx('plaster', kb.x0, kb.x1, F0, F0 + .82, kb.z0, kb.z1, 'cookbench'); bx('zellige', kb.x0 - .03, kb.x1, F0 + .82, F0 + .86, kb.z0 - .03, kb.z1 + .03);
  for (const z of [kb.z0 + .5, kb.z0 + 1.3]) { bx('dark', kb.x0 + .15, kb.x1 - .15, F0 + .86, F0 + .87, z - .2, z + .2); put(new THREE.SphereGeometry(.13, 8, 5).scale(1.2, .3, 1.2), 'ember', (kb.x0 + kb.x1) / 2, F0 + .87, z); braziers.push([(kb.x0 + kb.x1) / 2, F0 + .87, z]); }
  put(new THREE.SphereGeometry(.15, 12, 8, 0, Math.PI * 2, .4, Math.PI - .4), 'copper', (kb.x0 + kb.x1) / 2, F0 + 1.0, kb.z0 + .5);
  { const y = F0 + 1.75; bx('iron', X - .2, X - .17, y, y + .03, kb.z0 + .1, kb.z1 - .1); for (let k = 0; k < 3; k++) { const z = kb.z0 + .4 + k * .45, rr = .09 + (k % 2) * .04; put(new THREE.CylinderGeometry(rr, rr * .85, rr * 1.2, 14), 'copper', X - .19 - rr, y - .2 - rr * .6, z); } }
  // tables: two small square ones by the side windows inside, two round ones in the loggia, three on the terrace; stools and chairs
  const tables = [], seats = [];
  const table = (x, z, round, tag) => { const y = F0 + .74, ty = (tag === 'out' ? FT : F0) + .74 - (tag === 'out' ? 0 : 0);
    if (round) { put(new THREE.CylinderGeometry(.36, .36, .04, 20), 'cedar', x, ty - .02, z); put(new THREE.CylinderGeometry(.04, .05, ty - (tag === 'out' ? FT : F0), 8), 'iron', x, (ty + (tag === 'out' ? FT : F0)) / 2, z); boxes.push({ tag: 'table', x0: x - .36, x1: x + .36, y0: ty - .74, y1: ty, z0: z - .36, z1: z + .36 }); }
    else { bx('cedar', x - .4, x + .4, ty - .04, ty, z - .4, z + .4, 'table'); for (const sx of [-1, 1]) for (const sz of [-1, 1]) bx('cedarD', x + sx * .34 - .03, x + sx * .34 + .03, ty - .74, ty - .04, z + sz * .34 - .03, z + sz * .34 + .03); }
    tables.push({ x, z, y: ty, base: ty - .74 }); put(new THREE.CylinderGeometry(.035, .03, .1, 10), 'wine', x + .1, ty + .05, z); put(new THREE.CylinderGeometry(.11, .11, .015, 14), 'delft', x - .12, ty + .008, z + .05); };
  const stool = (x, z, base) => { bx('cedar', x - .16, x + .16, base + .42, base + .46, z - .16, z + .16, 'stool'); for (const a of [.6, 2.7, 4.8]) put(new THREE.CylinderGeometry(.018, .022, .42, 6), 'cedarD', x + Math.cos(a) * .11, base + .21, z + Math.sin(a) * .11); seats.push(.46); };
  for (const sx of [-1, 1]) { const x = sx * (X - .9); table(x, .2, false, 'in'); stool(x, .2 + .7, F0); stool(x, .2 - .7, F0); }
  for (const x of [arches[0] + .4, arches[n - 1] - .4]) { const z = d / 2 + ad / 2 + .05; table(x, z, true, 'out'); stool(x - .58, z, FT); stool(x + .58, z, FT); }
  // the terrace: paving from the arcade 4 m out to a parapet on the quay wall, which drops 3.2 m to the sea
  const T0 = az + .05, T1 = az + 4.05, terrace = { z0: T0, z1: T1, y: FT, parapet: FT + .62, quayFoot: -3.4 };
  bx('step', -w / 2 - .1, w / 2 + .1, FT - .4, FT, T0, T1); bx('step', -w / 2 - .1, w / 2 + .1, terrace.quayFoot, FT - .4, T1 - .5, T1 + .25);
  for (const [x0, x1, z0, z1] of [[-w / 2 - .1, w / 2 + .1, T1 - .3, T1], [-w / 2 - .1, -w / 2 + .2, T0, T1], [w / 2 - .2, w / 2 + .1, T0, T1]]) { bx('plaster', x0, x1, FT, FT + .55, z0, z1, 'parapet'); bx('step', x0 - .03, x1 + .03, FT + .55, FT + .62, z0 - .03, z1 + .03); }
  for (const [x, z] of [[-2.6, T0 + 1.5], [.3, T0 + 2.6], [2.9, T0 + 1.4]]) { table(x, z, true, 'out'); for (const a of [0, Math.PI]) { const cx = x + Math.cos(a) * .62, cz = z + Math.sin(a) * .62 + (a ? 0 : 0); stool(cx, cz, FT); } }
  // the pergola over the terrace: cedar posts, beams across, a vine over them with clusters of grapes
  const PZ0 = T0 + .5, PZ1 = T1 - .6, PY = FT + 2.6; for (const x of [-w / 2 + .5, 0, w / 2 - .5]) for (const z of [PZ0, PZ1]) bx('cedar', x - .06, x + .06, FT, PY, z - .06, z + .06, 'pergolapost');
  for (const z of [PZ0, PZ1]) bx('cedar', -w / 2 + .3, w / 2 - .3, PY, PY + .14, z - .07, z + .07); for (let x = -w / 2 + .5; x <= w / 2 - .4; x += .6) bx('cedar', x - .04, x + .04, PY + .14, PY + .22, PZ0 - .3, PZ1 + .3);
  for (let i = 0; i < 160; i++) { const x = -w / 2 + .4 + r() * (w - .8), z = PZ0 - .2 + r() * (PZ1 - PZ0 + .4); put(new THREE.IcosahedronGeometry(.12 + r() * .1, 0), 'leaf', x, PY + .26 + r() * .1, z, r() * 6); if (r() < .08) put(new THREE.ConeGeometry(.07, .2, 6).rotateX(Math.PI), 'grape', x, PY + .05, z); }
  for (const x of [-w / 2 + .5, w / 2 - .5]) for (let k = 0; k < 14; k++) put(new THREE.IcosahedronGeometry(.08 + r() * .05, 0), 'leaf', x + (r() - .5) * .2, FT + .3 + k * .17, PZ1 + (r() - .5) * .2, r() * 6);
  // the lamps: two brass lanterns inside from the beams, and one in the middle arch
  const lamps = []; for (const [x, y, z] of [[-1.6, TOP - .75, .2], [1.8, TOP - .75, -.8]]) { bx('iron', x - .005, x + .005, y + .2, TOP - .2, z - .005, z + .005); put(new THREE.CylinderGeometry(.1, .12, .26, 8), 'glow', x, y, z); put(new THREE.ConeGeometry(.14, .18, 8), 'brass', x, y + .22, z); lamps.push([x, y, z]); }
  // the door's leaf hung open inside, against the front wall
  { const lw = 1.05, lx = sh.doorX - lw / 2 - .04 - lw / 2; bx('cedarD', lx - lw / 2, lx + lw / 2, F0, F0 + 1.95, Z - .06, Z, 'leaf'); }
  // the walks: in at the door to the counter; out through the loggia and the arch beside the door, across the terrace to the parapet
  const path = [[sh.doorX, Z - .3], [sh.doorX, counter.z1 + .4]], path2 = [[sh.doorX, d / 2 + .3], [arches[Math.floor(n / 2)], d / 2 + ad * .6], [arches[Math.floor(n / 2)], T0 + .3], [arches[Math.floor(n / 2)] + .3, T1 - .7]];
  const group = new THREE.Group(); let tris = 0; for (const [k, gs] of B) { const g = mergeGeometries(gs, false); gs.forEach(x => x.dispose()); const m = new THREE.Mesh(g, M[k]); m.name = k; m.castShadow = !['flame', 'ember', 'glow'].includes(k); m.receiveShadow = true; group.add(m); tris += g.attributes.position.count / 3; }
  const all = new THREE.Group(); all.add(sh.group, group);
  return { group: all, shell: sh.group, room: group, tris: Math.round(tris), draws: group.children.length, shellTris: sh.tris, shellCalls: sh.draws, inner: { x0: -X, x1: X, z0: -Z, z1: Z }, floor: F0, ceil: TOP - .22, terrace, loggia: { z0: d / 2, z1: az },
    arches, door: { x: sh.doorX, z: d / 2, w: 1.05, h: 2.0 }, counter, tables, seats, path, path2, boxes, lamps, braziers, w, d };
}

// aurenneCourtyardHouse(o, r) (Session 899, card F9; Michael's A on #318: OG-115's courtyard house, built next as its own piece): the
//   rooms of pieces.js's aurenneCourtyard (15 by 15 m, four ranges two storeys high round an arcaded court with a fountain). Ground:
//   the vestibule with its masonry benches; the store of oil jars and sacks; the kitchen of OG-115 (a cooking bench of three braziers
//   under a rail of hanging copper pots, a bread oven, a work table, plates on shelves); the west range's stair and a loom; the
//   dining room's long table and benches and a sideboard; across the back the reception hall, divans round three walls, rugs, brass
//   tables, a tile dado to 1.2 m. Upstairs off the gallery: the bedroom across the back (a bed, chests, a table with a mirror and a
//   comb), the guest room, the children's room (two small beds, a toy chest, a wooden horse), a linen press, and a study (a lectern,
//   books, a divan under the lattices). Lanterns in every room and along both galleries.
//   -> { group, shell, room, tris, draws, shellTris, shellCalls, sh (the shell's numbers), rooms: {name: {x0, x1, z0, z1, fl}}, boxes
//        (tagged, with their floor), paths: [[floor, [[x, z], …]]], lamps: [[x, y, z, fl]], braziers, tables, seats, beds, door }
export function aurenneCourtyardHouse(o = {}, r = stream('courtyard')) {
  const sh = aurenneCourtyard({ interior: true, wall: o.wall ?? 1, door: 0 }, stream(o.shell || 'courtyard-shell')), M = homeMats(), B = new Map(), boxes = [];
  const put = (geo, key, x = 0, y = 0, z = 0, ry = 0, uv = .6, rx = 0, rz = 0) => { const g = geo.index ? geo.toNonIndexed() : geo; for (const k of Object.keys(g.attributes)) if (!['position', 'normal', ...(key === 'rug' ? ['uv'] : [])].includes(k)) g.deleteAttribute(k);
    g.applyMatrix4(new THREE.Matrix4().compose(new THREE.Vector3(x, y, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(rx, ry, rz, 'YXZ')), new THREE.Vector3(1, 1, 1))); if (key !== 'rug') worldUV(g, uv);
    if (!B.has(key)) B.set(key, []); B.get(key).push(g); return g; };
  const UVK = { zellige: 1.47, tile: 1.1 }, bx = (key, x0, x1, y0, y1, z0, z1, tag, fl) => { put(new THREE.BoxGeometry(x1 - x0, y1 - y0, z1 - z0), key, (x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2, 0, UVK[key] ?? .6); if (tag) boxes.push({ tag, x0, x1, y0, y1, z0, z1, fl }); };
  const { A, C, Ti, F0, F1, SL, BM } = sh, ci = C + Ti / 2, co = C - Ti / 2, FL = [F0, F1], CEIL0 = F1 - SL - BM;
  const rooms = { vestibule: { x0: -.88, x1: .88, z0: ci, z1: A, fl: 0 }, store: { x0: -A, x1: -1.12, z0: ci, z1: A, fl: 0 }, kitchen: { x0: 1.12, x1: A, z0: ci, z1: A, fl: 0 }, stairhall: { x0: -A, x1: -ci, z0: -co, z1: co, fl: 0 },
    dining: { x0: ci, x1: A, z0: -co, z1: co, fl: 0 }, hall: { x0: -A, x1: A, z0: -A, z1: -ci, fl: 0 }, children: { x0: -A, x1: -1.12, z0: ci, z1: A, fl: 1 }, linen: { x0: -.88, x1: .88, z0: ci, z1: A, fl: 1 },
    study: { x0: 1.12, x1: A, z0: ci, z1: A, fl: 1 }, landing: { x0: -A, x1: -ci, z0: -co, z1: co, fl: 1 }, guest: { x0: ci, x1: A, z0: -co, z1: co, fl: 1 }, bedroom: { x0: -A, x1: A, z0: -A, z1: -ci, fl: 1 } };
  // a dado of glazed tile round a room, broken at its doors (read from the shell's doors on that floor)
  const dado = (R, ht) => { const y0 = FL[R.fl]; for (const [ax, f, a0, a1, s] of [['z', R.z0, R.x0, R.x1, 1], ['z', R.z1, R.x0, R.x1, -1], ['x', R.x0, R.z0, R.z1, 1], ['x', R.x1, R.z0, R.z1, -1]]) {
    const gaps = sh.doors.filter(d => d.fl === R.fl && d.ax === ax && Math.abs(d.c - f) < .2 && d.at > a0 && d.at < a1).map(d => [d.at - d.w / 2 - .02, d.at + d.w / 2 + .02]).sort((p, q) => p[0] - q[0]); let p = a0;
    for (const [g0, g1] of [...gaps, [a1, a1]]) { if (g0 - p > .02) { if (ax === 'z') bx('zellige', p, g0, y0, y0 + ht, Math.min(f, f + s * .02), Math.max(f, f + s * .02)); else bx('zellige', Math.min(f, f + s * .02), Math.max(f, f + s * .02), y0, y0 + ht, p, g0); } p = g1; } } };
  const lamps = [], lantern = (x, y, z, fl, ceil) => { if (ceil) bx('iron', x - .005, x + .005, y + .2, ceil, z - .005, z + .005); put(new THREE.CylinderGeometry(.1, .12, .26, 8), 'glow', x, y, z); put(new THREE.ConeGeometry(.14, .18, 8), 'brass', x, y + .22, z);
    put(new THREE.CylinderGeometry(.13, .13, .03, 8), 'brass', x, y - .14, z); lamps.push([x, y, z, fl]); };
  const jar = (x, z, fl, s = 1, key = 'terra', tag = 'jar') => { const y = FL[fl]; put(new THREE.LatheGeometry([[.001, 0], [.14, 0], [.28, .25], [.3, .55], [.18, .8], [.13, .86], [.15, .9], [.001, .9]].map(([a, b]) => new THREE.Vector2(a * s, b * s)), 14), key, x, y, z);
    boxes.push({ tag, x0: x - .3 * s, x1: x + .3 * s, y0: y, y1: y + .9 * s, z0: z - .3 * s, z1: z + .3 * s, fl }); };
  const rug = (x, z, w, d, fl, ry = 0) => { const g = new THREE.PlaneGeometry(w, d); g.rotateX(-Math.PI / 2); put(g, 'rug', x, FL[fl] + .006, z, ry); };
  const divan = (x0, x1, z0, z1, fl, back) => { const y = FL[fl]; bx('cedar', x0, x1, y, y + .3, z0, z1, 'divan', fl); bx('indigo', x0 + .02, x1 - .02, y + .3, y + .42, z0 + .02, z1 - .02);
    const along = x1 - x0 > z1 - z0, L = along ? x1 - x0 : z1 - z0; for (let t = .35, k = 0; t < L - .3; t += .62, k++) { const c = (along ? x0 : z0) + t, g = new THREE.BoxGeometry(along ? .52 : .16, .42, along ? .16 : .52);
      put(g, k % 2 ? 'madder' : 'saffron', along ? c : back, y + .62, along ? back : c, 0, .6, along ? (back > (z0 + z1) / 2 ? -.12 : .12) : 0, along ? 0 : (back > (x0 + x1) / 2 ? .12 : -.12)); } };
  const brassTable = (x, z, fl, rad = .48) => { const y = FL[fl] + .42; put(new THREE.CylinderGeometry(rad, rad, .03, 28), 'brass', x, y - .015, z); for (let k = 0; k < 6; k++) { const a = k * Math.PI / 3; bx('cedarD', x + Math.cos(a) * rad * .62 - .02, x + Math.cos(a) * rad * .62 + .02, FL[fl], y - .03, z + Math.sin(a) * rad * .62 - .02, z + Math.sin(a) * rad * .62 + .02); }
    boxes.push({ tag: 'lowtable', x0: x - rad, x1: x + rad, y0: FL[fl], y1: y, z0: z - rad, z1: z + rad, fl }); for (let k = 0; k < 3; k++) put(new THREE.CylinderGeometry(.035, .03, .08, 10), k ? 'delft' : 'blue', x - .18 + k * .18, y + .04, z + (k - 1) * .1); };
  const beds = [], bed = (x0, x1, z0, z1, fl, headZ) => { const y = FL[fl]; bx('cedar', x0, x1, y, y + .34, z0, z1, 'bed', fl); bx('linen', x0 + .04, x1 - .04, y + .34, y + .46, z0 + .04, z1 - .04);
    const hz = headZ ?? z0; bx('indigo', x0 + .02, x1 - .02, y + .46, y + .5, hz === z0 ? z0 + .55 : z0 + .02, hz === z0 ? z1 - .02 : z1 - .55); bx('cedarD', x0, x1, y, y + .95, hz === z0 ? z0 : z1 - .06, hz === z0 ? z0 + .06 : z1);
    { const g = new THREE.CylinderGeometry(.11, .11, x1 - x0 - .2, 12); g.rotateZ(Math.PI / 2); put(g, 'madder', (x0 + x1) / 2, y + .57, hz === z0 ? z0 + .3 : z1 - .3); } beds.push({ x0, x1, z0, z1, fl, len: +(z1 - z0).toFixed(2), y: y + .46 }); };
  const chest = (x0, x1, z0, z1, fl, ht = .5) => { const y = FL[fl]; bx('cedarD', x0, x1, y, y + ht, z0, z1, 'chest', fl); bx('brass', x0 + .02, x1 - .02, y + ht - .18, y + ht - .14, z0 - .01, z1 + .01); };
  const tables = [], seats = [], bench = (x0, x1, z0, z1, fl, key = 'cedar') => { const y = FL[fl]; bx(key, x0, x1, y + .41, y + .45, z0, z1, 'bench', fl); const along = x1 - x0 > z1 - z0;
    for (const e of [.12, .88]) { const c = along ? x0 + (x1 - x0) * e : z0 + (z1 - z0) * e; if (along) bx(key, c - .03, c + .03, y, y + .41, z0 + .03, z1 - .03); else bx(key, x0 + .03, x1 - .03, y, y + .41, c - .03, c + .03); } seats.push(.45); };
  // ── the ground floor
  // the vestibule: tile to 1.2 m, a masonry bench down each side, the street door's leaf hung open, a lantern
  dado(rooms.vestibule, 1.2);
  for (const s of [-1, 1]) { const [x0, x1] = s < 0 ? [-.88, -.43] : [.43, .88]; bx('plaster', x0, x1, F0, F0 + .41, 4.0, 5.6, 'bench', 0); bx('zellige', x0 - (s > 0 ? .02 : 0), x1 + (s < 0 ? .02 : 0), F0 + .41, F0 + .45, 3.98, 5.62); } seats.push(.45);
  bx('cedarD', .66, .72, F0, F0 + 1.95, A - 1.32, A - .02, 'leaf', 0);
  lantern(0, CEIL0 - .5, 5.4, 0, CEIL0);
  // the store: oil jars down the street wall, sacks of grain, a chest of the house's silver
  for (let x = -6.7; x < -2.9; x += .7) jar(x, A - .38, 0, 1.0, 'terra', 'oiljar');
  for (const [x, z, s] of [[-6.75, 4.4, 1], [-6.7, 5.05, .9], [-6.1, 4.35, .85]]) { put(new THREE.SphereGeometry(.32 * s, 10, 8).scale(1, .8, 1), 'linen', x, F0 + .24 * s, z); boxes.push({ tag: 'sack', x0: x - .32 * s, x1: x + .32 * s, y0: F0, y1: F0 + .5 * s, z0: z - .32 * s, z1: z + .32 * s, fl: 0 }); }
  chest(-2.3, -1.3, A - .6, A - .02, 0); lantern(-4.3, CEIL0 - .5, 5.2, 0, CEIL0);
  // the kitchen: a cooking bench of three braziers down the street wall, a rail of copper pots hung over it, the bread oven in the corner,
  // a work table, a water jar, shelves of blue and white plates on the vestibule's wall
  const braziers = [], kb = { x0: 2.0, x1: 5.6, z0: A - .65, z1: A }; bx('plaster', kb.x0, kb.x1, F0, F0 + .82, kb.z0, kb.z1, 'cookbench', 0); bx('zellige', kb.x0 - .03, kb.x1 + .03, F0 + .82, F0 + .86, kb.z0 - .03, kb.z1);
  for (const x of [2.6, 3.8, 5.0]) { bx('dark', x - .2, x + .2, F0 + .86, F0 + .87, kb.z0 + .15, kb.z1 - .15); put(new THREE.SphereGeometry(.13, 8, 5).scale(1.2, .3, 1.2), 'ember', x, F0 + .87, (kb.z0 + kb.z1) / 2); braziers.push([x, F0 + .87, (kb.z0 + kb.z1) / 2, 0]); }
  put(new THREE.SphereGeometry(.15, 12, 8, 0, Math.PI * 2, .4, Math.PI - .4), 'copper', 2.6, F0 + 1.0, (kb.z0 + kb.z1) / 2);
  { const y = F0 + 1.85; bx('iron', kb.x0 + .1, kb.x1 - .1, y, y + .03, A - .2, A - .17); for (let k = 0; k < 7; k++) { const x = kb.x0 + .35 + k * .5, rr = .09 + (k % 3) * .035; bx('iron', x - .005, x + .005, y - .2, y, A - .19, A - .18);
      put(new THREE.CylinderGeometry(rr, rr * .85, rr * 1.2, 14), 'copper', x, y - .2 - rr * .6, A - .19 - rr); } }
  { const ox = 6.55, oz = 6.55; bx('plaster', ox - .63, A, F0, F0 + .8, oz - .63, A, 'oven', 0); put(new THREE.SphereGeometry(.6, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2), 'plaster', ox, F0 + .8, oz); bx('dark', ox - .62, ox - .58, F0 + .85, F0 + 1.15, oz - .2, oz + .2); }
  { const t = { x0: 3.0, x1: 4.6, z0: 4.7, z1: 5.5, y: F0 + .85 }; bx('cedar', t.x0, t.x1, t.y - .05, t.y, t.z0, t.z1, 'worktable', 0); for (const [x, z] of [[t.x0 + .06, t.z0 + .06], [t.x1 - .06, t.z0 + .06], [t.x0 + .06, t.z1 - .06], [t.x1 - .06, t.z1 - .06]]) bx('cedarD', x - .035, x + .035, F0, t.y - .05, z - .035, z + .035);
    bx('cedarD', 3.2, 3.7, t.y, t.y + .03, 4.85, 5.2); put(new THREE.SphereGeometry(.16, 12, 6, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), 'terra', 4.2, t.y + .16, 5.1); tables.push(+(t.y - F0).toFixed(2)); }
  jar(1.55, A - .45, 0, .85, 'terra', 'waterjar');
  { for (const y of [1.2, 1.6, 2.0]) { bx('cedar', 1.12, 1.42, F0 + y - .03, F0 + y, 4.4, 6.1); for (let z = 4.55; z < 6.0; z += .22) put(new THREE.CylinderGeometry(.1, .1, .02, 14).rotateZ(Math.PI / 2), r() < .5 ? 'blue' : 'delft', 1.24, F0 + y + .1, z); }
    boxes.push({ tag: 'plates', x0: 1.12, x1: 1.42, y0: F0 + 1.17, y1: F0 + 2.2, z0: 4.4, z1: 6.1, fl: 0 }); }
  lantern(4.0, CEIL0 - .5, 5.1, 0, CEIL0);
  // the west range: the stair is the shell's; a loom by the court wall and the weaver's bench; two jars at the stair's high end
  { const lx = -3.98, z0 = -2.6, z1 = -.6, y = F0; for (const z of [z0, z1]) bx('cedarD', lx - .06, lx + .06, y, y + 2.0, z - .06, z + .06); for (const yy of [.35, 1.85]) bx('cedarD', lx - .07, lx + .07, y + yy - .06, y + yy + .06, z0, z1);
    bx('cedar', lx - .2, lx - .1, y + .85, y + .93, z0 + .1, z1 - .1); const cl = new THREE.PlaneGeometry(z1 - z0 - .25, .55); cl.rotateY(Math.PI / 2); put(cl, 'indigo', lx, y + .7, (z0 + z1) / 2);
    for (let z = z0 + .14; z < z1 - .1; z += .045) bx('linen', lx - .003, lx + .003, y + .97, y + 1.82, z - .003, z + .003); boxes.push({ tag: 'loom', x0: lx - .2, x1: lx + .07, y0: y, y1: y + 2.0, z0: z0 - .06, z1: z1 + .06, fl: 0 }); }
  bench(-5.0, -4.65, -2.1, -1.1, 0); jar(-6.68, -2.4, 0, .9); jar(-6.68, -3.05, 0, .8);
  lantern(-5.3, CEIL0 - .5, .6, 0, CEIL0);
  // the dining room: a long table and two benches, a sideboard of plates and jugs, a lantern over the table
  { const t = { x0: 4.95, x1: 5.75, z0: -1.5, z1: 1.5, y: F0 + .76 }; bx('cedar', t.x0, t.x1, t.y - .05, t.y, t.z0, t.z1, 'table', 0); for (const [x, z] of [[t.x0 + .07, t.z0 + .07], [t.x1 - .07, t.z0 + .07], [t.x0 + .07, t.z1 - .07], [t.x1 - .07, t.z1 - .07]]) bx('cedarD', x - .04, x + .04, F0, t.y - .05, z - .04, z + .04);
    for (let z = -1.2; z <= 1.21; z += .6) for (const x of [5.12, 5.58]) put(new THREE.CylinderGeometry(.11, .09, .03, 14), r() < .5 ? 'blue' : 'delft', x, t.y + .015, z); put(new THREE.CylinderGeometry(.07, .09, .26, 12), 'terra', 5.35, t.y + .13, 0); tables.push(+(t.y - F0).toFixed(2)); }
  bench(4.4, 4.7, -1.4, 1.4, 0); bench(6.0, 6.3, -1.4, 1.4, 0);
  { bx('cedarD', 6.75, A, F0, F0 + .9, -1.2, 1.2, 'sideboard', 0); for (let z = -1.0; z < 1.05; z += .25) put(new THREE.CylinderGeometry(.12, .12, .02, 14).rotateZ(Math.PI / 2), z > 0 ? 'blue' : 'delft', A - .1, F0 + 1.02, z); for (const z of [-.6, .6]) put(new THREE.CylinderGeometry(.06, .09, .24, 12), 'copper', 6.95, F0 + 1.02, z); }
  lantern(5.35, CEIL0 - .55, 0, 0, CEIL0);
  // the hall across the back: tile to 1.2 m, divans round three walls, two rugs and two brass tables, a ewer and cups, two lanterns
  dado(rooms.hall, 1.2);
  divan(-6.0, 6.0, -A, -A + .8, 0, -A + .12); divan(-A, -A + .8, -A + .8, -4.4, 0, -A + .12); divan(A - .8, A, -A + .8, -4.4, 0, A - .12);
  for (const s of [-1, 1]) { rug(s * 2.6, -5.4, 2.8, 1.9, 0); brassTable(s * 2.6, -5.5, 0); lantern(s * 3.3, CEIL0 - .55, -5.3, 0, CEIL0); }
  put(new THREE.LatheGeometry([[.001, 0], [.08, 0], [.11, .1], [.06, .22], [.04, .3], [.07, .34], [.001, .34]].map(([a, b]) => new THREE.Vector2(a, b)), 12), 'brass', 2.85, F0 + .42, -5.3);
  // ── the upper floor
  // the landing: a chest by the back wall, a rug, a lantern
  chest(-5.6, -4.6, -co, -co + .48, 1); rug(-5.0, .4, 1.4, 2.2, 1); lantern(-5.0, sh.under(-5.0, .4) - .5, .4, 1, sh.under(-5.0, .4));
  // the bedroom: the bed from the back wall, a chest each side of it, a table with a mirror and a comb at the east end and its stool, a
  // divan at the west end, a rug, a lantern
  dado(rooms.bedroom, .6); rug(0, -5.7, 3.2, 2.8, 1); bed(-1.0, 1.0, -A, -5.0, 1, -A); chest(-2.6, -1.6, -A, -A + .55, 1); chest(1.6, 2.6, -A, -A + .55, 1);
  { const y = F1, t = { x0: A - .5, x1: A, z0: -6.2, z1: -4.8 }; bx('cedar', t.x0, t.x1, y + .71, y + .75, t.z0, t.z1, 'dresser', 1); for (const z of [t.z0 + .05, t.z1 - .05]) bx('cedarD', t.x0 + .04, t.x1 - .04, y, y + .71, z - .03, z + .03);
    put(new THREE.CylinderGeometry(.22, .22, .02, 24).rotateZ(Math.PI / 2), 'brass', A - .04, y + 1.2, -5.5); bx('cedarD', A - .06, A - .02, y + .75, y + .98, -5.52, -5.48);
    bx('cedar', A - .3, A - .12, y + .75, y + .77, -5.0, -4.92); for (let k = 0; k < 9; k++) bx('cedar', A - .3 + k * .02, A - .29 + k * .02, y + .75, y + .79, -4.94, -4.93) /* the comb's teeth */;
    put(new THREE.CylinderGeometry(.04, .05, .14, 10), 'blue', A - .25, y + .82, -5.9); bx('cedar', A - 1.0, A - .66, y + .41, y + .45, -5.67, -5.33, 'stool', 1); for (const [dx, dz] of [[.04, .04], [.3, .04], [.04, .3], [.3, .3]]) bx('cedarD', A - 1.0 + dx - .02, A - 1.0 + dx + .02, y, y + .41, -5.67 + dz - .02, -5.67 + dz + .02); seats.push(.45); }
  divan(-A, -A + .8, -6.6, -4.2, 1, -A + .12); lantern(0, sh.under(0, -4.6) - .5, -4.6, 1, sh.under(0, -4.6));
  // the guest room: a bed along the outer wall, a chest, a rug, a lantern
  bed(A - 1.4, A, -2.9, -.8, 1); chest(A - .6, A, .3, 1.2, 1); rug(5.2, 0, 1.8, 2.6, 1); lantern(5.0, sh.under(5.0, 1.6) - .5, 1.6, 1, sh.under(5.0, 1.6));
  // the children's room: two small beds along the street wall, a toy chest, a wooden horse on rockers, a rug, a lantern
  bed(-6.9, -6.0, 5.4, A, 1, A); bed(-4.6, -3.7, 5.4, A, 1, A); chest(-A, -A + .55, 3.9, 4.7, 1, .42);
  { const y = F1, x = -4.0, z = 4.6; bx('saffron', x - .32, x + .32, y + .32, y + .52, z - .1, z + .1); bx('saffron', x + .26, x + .4, y + .5, y + .74, z - .07, z + .07); for (const sx of [-.24, .24]) for (const sz of [-.07, .07]) bx('cedarD', x + sx - .025, x + sx + .025, y + .06, y + .34, z + sz - .025, z + sz + .025);
    for (const sz of [-.09, .09]) { const g = new THREE.TorusGeometry(1.0, .02, 4, 20, .7); g.rotateZ(-Math.PI / 2 - .35) /* the bottom of the circle */; put(g, 'cedarD', x, y + 1.03, z + sz); }
    boxes.push({ tag: 'toyhorse', x0: x - .4, x1: x + .42, y0: y, y1: y + .74, z0: z - .12, z1: z + .12, fl: 1 }); }
  rug(-4.6, 4.7, 2.2, 1.4, 1); lantern(-4.6, sh.under(-4.6, 4.8) - .5, 4.8, 1, sh.under(-4.6, 4.8));
  // the linen press: shelves of folded cloth to the ceiling on the street wall
  { const z0 = A - .4; for (const y of [.02, .5, 1.0, 1.5, 1.95]) bx('cedar', -.8, .8, F1 + y, F1 + y + .03, z0, A); for (const x of [-.8, .77]) bx('cedar', x, x + .03, F1, F1 + 2.0, z0, A);
    for (const y of [.05, .53, 1.03, 1.53]) for (let x = -.7, k = 0; x < .6; x += .36, k++) { const ht = .12 + r() * .22; bx(['linen', 'indigo', 'madder', 'linen', 'weld'][(k + Math.floor(y * 3)) % 5], x, x + .3, F1 + y, F1 + y + ht, z0 + .04, A - .04); }
    boxes.push({ tag: 'press', x0: -.8, x1: .8, y0: F1, y1: F1 + 2.0, z0, z1: A, fl: 1 }); lantern(0, sh.under(0, 5.0) - .5, 5.0, 1, sh.under(0, 5.0)); }
  // the study: books on shelves against the vestibule's wall, a lectern with an open book, a divan under the lattices, a brass table and lamp
  { for (const y of [.3, .75, 1.2, 1.65]) { bx('cedar', 1.12, 1.45, F1 + y - .03, F1 + y, 5.9, A - .05); for (let z = 5.95; z < A - .15; z += .06 + r() * .03) { const ht = .22 + r() * .14; bx(['madder', 'indigo', 'cedarD', 'weld', 'saffron'][Math.floor(r() * 5)], 1.16, 1.4, F1 + y, F1 + y + ht, z, z + .05); } }
    boxes.push({ tag: 'books', x0: 1.12, x1: 1.45, y0: F1, y1: F1 + 2.0, z0: 5.9, z1: A - .05, fl: 1 });
    const lx = 1.85, lz = 5.15; bx('cedarD', lx - .05, lx + .05, F1, F1 + 1.05, lz - .05, lz + .05); const top = new THREE.BoxGeometry(.5, .03, .4); top.rotateX(-.45); put(top, 'cedar', lx, F1 + 1.12, lz);
    const pg = new THREE.BoxGeometry(.42, .02, .3); pg.rotateX(-.45); put(pg, 'linen', lx, F1 + 1.145, lz); bx('cedarD', lx - .22, lx + .22, F1, F1 + .04, lz - .2, lz + .2); boxes.push({ tag: 'lectern', x0: lx - .25, x1: lx + .25, y0: F1, y1: F1 + 1.25, z0: lz - .22, z1: lz + .22, fl: 1 }); }
  divan(3.2, 6.8, A - .8, A, 1, A - .12); rug(5.0, 5.4, 2.6, 1.6, 1); brassTable(5.0, 5.5, 1, .4); put(new THREE.SphereGeometry(.07, 10, 6).scale(1.6, .6, 1), 'brass', 5.1, F1 + .46, 5.6); put(new THREE.SphereGeometry(.014, 6, 5).scale(1, 2, 1), 'flame', 5.2, F1 + .52, 5.6); lamps.push([5.2, F1 + .55, 5.6, 1]);
  // ── the galleries: lanterns on brackets off the court's walls, four a floor
  for (const [fl, y] of [[0, F0 + 2.45], [1, F1 + 2.2]]) for (const sz of [-1, 1]) for (const x of [-1.2, 1.2]) { const z = sz * (co - .2); bx('iron', x - .01, x + .01, y + .3, y + .32, sz * (co - .2), sz * co); lantern(x, y, z, fl, y + .32); }
  // the walks, by floor: in at the street door through the vestibule and round the gallery to the hall; from the gallery into the store,
  // the kitchen, the dining room, the west range (to the stair's foot) and to the fountain; upstairs from the landing round the gallery to
  // the bedroom, and into the children's room, the linen press, the study and the guest room
  const g = 2.9, paths = [[0, [[0, A - .3], [0, g], [-g, g], [-g, -g], [0, -g], [0, -5.0]]], [0, [[-g, g], [-2.4, g], [-2.4, 4.6]]], [0, [[g, g], [2.4, g], [2.4, 4.4]]], [0, [[g, -g], [g, 0], [4.1, 0]]],
    [0, [[-g, g], [-g, 2.6], [-5.85, 2.6], [-5.85, 3.3]]], [0, [[0, g], [0, 1.3]]],
    [1, [[-6.68, -2.1], [-5.0, -2.6], [-g, -2.6], [-g, g], [g, g], [g, -g], [0, -g], [0, -4.4]]], [1, [[-g, g], [-2.4, g], [-2.4, 4.3]]], [1, [[0, g], [0, 5.6]]], [1, [[g, g], [2.4, g], [2.4, 4.4]]], [1, [[g, -g], [g, 0], [4.4, 0]]]];
  const group = new THREE.Group(); let tris = 0; for (const [k, gs] of B) { const geo = mergeGeometries(gs, false); gs.forEach(x => x.dispose()); const m = new THREE.Mesh(geo, M[k]); m.name = k; m.castShadow = !['flame', 'ember', 'glow'].includes(k); m.receiveShadow = true; group.add(m); tris += geo.attributes.position.count / 3; }
  const all = new THREE.Group(); all.add(sh.group, group);
  return { group: all, shell: sh.group, room: group, sh, tris: Math.round(tris), draws: group.children.length, shellTris: sh.tris, shellCalls: sh.draws, rooms, boxes, paths, lamps, braziers, tables, seats, beds, floors: FL, ceil0: CEIL0,
    door: { x: 0, z: sh.d / 2, w: 1.3, h: 2.6 }, w: sh.w, d: sh.d };
}

// gatelandsForge(o, r) (Session 929, card F9; L5's interiors by nation, OG-043's Gatelands blacksmith; Michael's A on #303: rooms inside
//   the street's own shell): the kit's forge (GL_PLANS.forge: 8.4 by 6.0 m of bare rubble, walls of 0.6 m, 3.2 m to the wall plate, slate,
//   the stack in the west gable, the cart door standing open) as a working smithy. Against the west gable, the forge: a raised hearth of
//   stone 0.78 m high, a bed of coals on it, a sooted hood over it narrowing into the stack. Beside it on the back side, the great
//   bellows on their frame, the nozzle into the hearth's flank, worked by a rocking pole and a chain with a handle. The anvil on an
//   elm stump 1.2 m out from the hearth, the slack tub of water and the coal bin either side of the hearth's front. Tongs and hammers on a
//   rack along the back wall; the bench under the back window with a leg vice; the grindstone and the farrier's box at the east end;
//   iron bars leaning on the gable, horseshoes on nails, a tethering ring. Cinders underfoot by the fire, flags in the shoeing bay
//   inside the door. The roof open to its couples and tie beams, a lantern from the middle one.
//   -> { group, shell, room, tris, draws, inner, under(z), floor, tieBeam, hearth {x0, x1, z0, z1, y}, hood, fire, anvil {x, z, y}, tub,
//        bench {y}, door, paths, boxes, lantern, windows, w, d }
let FM = null;
function forgeMats() {
  if (FM) return FM; const M = mats();
  FM = { ...M, rubble: glMats().rubble, sootstone: mat('stone', { ns: 1.0, color: 0x5a544c }), cinder: mat('rock', { ns: .9, color: 0x3e3a36, rough: 1 }), coal: new THREE.MeshStandardMaterial({ color: 0x111113, roughness: .55, metalness: .1 }),
    steel: new THREE.MeshStandardMaterial({ color: 0x5c5e62, roughness: .3, metalness: .85 }), leather: new THREE.MeshStandardMaterial({ color: 0x24170f, roughness: .75 }), elm: mat('beam', { ns: 1.2, color: 0x7a6048 }),
    water: new THREE.MeshStandardMaterial({ color: 0x14201f, roughness: .05, metalness: .1 }), grit: mat('rock', { ns: .8, color: 0xb0a690, rough: 1 }) };
  return FM;
}
// a solid whose bottom is the rectangle b [x0, x1, z0, z1] at y0 and whose top is t at y1 (the hood)
function frustum(b, y0, t, y1) { const g = new THREE.BoxGeometry(1, 1, 1).toNonIndexed(), P = g.attributes.position;
  for (let i = 0; i < P.count; i++) { const top = P.getY(i) > 0, R = top ? t : b, u = P.getX(i) + .5, w = P.getZ(i) + .5; P.setXYZ(i, R[0] + (R[1] - R[0]) * u, top ? y1 : y0, R[2] + (R[3] - R[2]) * w); }
  g.computeVertexNormals(); return g; }
export function gatelandsForge(o = {}, r = stream('forge')) {
  const plan = GL_PLANS.forge({}); plan.interior = true; plan.r = stream('forge-shell');
  const shell = gatelandsBuilding(plan), M = forgeMats(), B = new Map(), boxes = [], t = plan.t, h = plan.floors[0], X = plan.w / 2 - t, Z = plan.d / 2 - t, F0 = .04, p = (SCALE.pitch.slate + 2) * Math.PI / 180, tp = Math.tan(p);
  const under = z => h + (plan.d / 2 - Math.abs(z)) * tp - .03 /* the slate's underside */;
  const put = (geo, key, x = 0, y = 0, z = 0, ry = 0, uv = .6, rx = 0, rz = 0) => { const g = geo.index ? geo.toNonIndexed() : geo; for (const k of Object.keys(g.attributes)) if (!['position', 'normal'].includes(k)) g.deleteAttribute(k);
    g.applyMatrix4(new THREE.Matrix4().compose(new THREE.Vector3(x, y, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(rx, ry, rz)), new THREE.Vector3(1, 1, 1))); worldUV(g, uv); if (!B.has(key)) B.set(key, []); B.get(key).push(g); return g; };
  const bx = (key, x0, x1, y0, y1, z0, z1, tag) => { put(new THREE.BoxGeometry(x1 - x0, y1 - y0, z1 - z0), key, (x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2); if (tag) boxes.push({ tag, x0, x1, y0, y1, z0, z1 }); };
  // the floor: trodden cinders from the forge to the bench, flags in the shoeing bay inside the door (x > 0.2)
  const BAY = .2; bx('cinder', -X, BAY, 0, F0, -Z, Z);
  for (let z = -Z; z < Z - .05;) { const d = Math.min(Z - z, .5 + r() * .35); for (let x = BAY; x < X - .05;) { const w = Math.min(X - x, .55 + r() * .45); put(new THREE.BoxGeometry(w - .02, F0, d - .02), 'flag', x + w / 2, F0 / 2 + (r() - .5) * .006, z + d / 2, (r() - .5) * .01, .7); x += w; } z += d; }
  // the forge: a hearth of stone against the gable, a lip round its top, a bed of coals and the fire in it, the tuyère in its back flank
  const hearth = { x0: -X, x1: -X + 1.05, z0: -.8, z1: .8, y: .78 }; bx('rubble', hearth.x0, hearth.x1, 0, hearth.y - .06, hearth.z0, hearth.z1, 'hearth');
  bx('sootstone', hearth.x0, hearth.x1, hearth.y - .06, hearth.y, hearth.z0, hearth.z0 + .12); bx('sootstone', hearth.x0, hearth.x1, hearth.y - .06, hearth.y, hearth.z1 - .12, hearth.z1); bx('sootstone', hearth.x1 - .12, hearth.x1, hearth.y - .06, hearth.y, hearth.z0 + .12, hearth.z1 - .12);
  bx('coal', hearth.x0, hearth.x1 - .12, hearth.y - .1, hearth.y - .04, hearth.z0 + .12, hearth.z1 - .12);
  const fire = [hearth.x0 + .5, hearth.y + .04, -.15]; for (let i = 0; i < 16; i++) { const a = r() * Math.PI * 2, d = .2 + r() * .3; put(new THREE.DodecahedronGeometry(.05 + r() * .03, 0), 'coal', fire[0] + Math.cos(a) * d, hearth.y - .02, fire[2] + Math.sin(a) * d * 1.2, r() * 3); }
  put(new THREE.SphereGeometry(.2, 12, 6).scale(1.1, .35, 1.3), 'ember', fire[0], hearth.y - .03, fire[2]); for (let i = 0; i < 3; i++) put(new THREE.ConeGeometry(.05, .16 + i * .05, 7), 'flame', fire[0] + (i - 1) * .06, hearth.y + .07, fire[2] + (i - 1) * .07);
  // the hood: from 1.85 m over the hearth's front up into the stack in the gable (the shell's stack stands in the wall from 2.6 m)
  const hood = { y0: 1.85, y1: h - .55 }; put(frustum([hearth.x0, hearth.x1 + .05, hearth.z0 - .1, hearth.z1 + .1], hood.y0, [-X, -X + .4, -.36, .36], hood.y1), 'sootstone', 0, 0, 0, 0, .5);
  bx('soot', hearth.x0 + .02, hearth.x1 - .05, hood.y0 - .01, hood.y0, hearth.z0 - .05, hearth.z1 + .05); bx('iron', hearth.x1 - .02, hearth.x1 + .08, hood.y0 - .08, hood.y0, hearth.z0 - .12, hearth.z1 + .12);
  // the great bellows beside the hearth on the back side, on a frame: two boards and the leather between, the nozzle into the hearth's
  // flank; a rocking pole over them on a post, a chain down from its end to a handle
  const bel = { x0: hearth.x0 + .05, x1: hearth.x0 + .95, z0: -Z + .05, z1: hearth.z0 - .05 }; { const bxm = (bel.x0 + bel.x1) / 2, bz0 = bel.z0 + .05, bz1 = bel.z1 - .25;
    for (const x of [bel.x0, bel.x1 - .06]) for (const z of [bel.z0, bel.z1 - .3]) bx('oak', x, x + .06, 0, .9, z, z + .06); bx('oak', bel.x0, bel.x1, .84, .9, bel.z0, bel.z1 - .24); boxes.push({ tag: 'bellows', x0: bel.x0, x1: bel.x1, y0: 0, y1: 1.4, z0: bel.z0, z1: bel.z1 });
    const s = new THREE.Shape(); s.moveTo(-.38, 0); s.lineTo(.38, 0); s.quadraticCurveTo(.42, (bz1 - bz0) * .7, .1, bz1 - bz0); s.lineTo(-.1, bz1 - bz0); s.quadraticCurveTo(-.42, (bz1 - bz0) * .7, -.38, 0);
    const board = y => { const g = new THREE.ExtrudeGeometry(s, { depth: .05, bevelEnabled: false }); g.rotateX(Math.PI / 2); put(g, 'elm', bxm, y, bz0); };
    board(.97); board(1.32); /* the leather between the boards in four folds, pulled in under the boards' edges */ for (let j = 0; j < 4; j++) { const y = 1.27 - j * .075, k = j % 2 ? .7 : .88, lea = new THREE.ExtrudeGeometry(s, { depth: .075, bevelEnabled: false }); lea.scale(k, k, 1); lea.rotateX(Math.PI / 2); put(lea, 'leather', bxm, y, bz0 + (1 - k) * (bz1 - bz0) * .3); }
    const nz = new THREE.CylinderGeometry(.03, .06, .5, 8); put(nz, 'iron', bxm, .86, bz1 + .2, 0, .6, Math.PI / 2 - .5); }
  const pole = { x: hearth.x1 + .55, y: 2.0, z: -Z + .5 }; bx('oak', hearth.x0 + .35, hearth.x0 + .47, 0, pole.y - .05, -Z + .02, -Z + .14, 'bellows'); put(new THREE.BoxGeometry(pole.x - hearth.x0 + .1, .08, .08), 'oak', (hearth.x0 + .3 + pole.x) / 2, pole.y, -Z + .3, 0, .6, 0, -.05);
  bx('iron', pole.x - .2, pole.x - .19, 1.45, pole.y - .02, -Z + .29, -Z + .31); put(new THREE.CylinderGeometry(.02, .02, .22, 6), 'oak', pole.x - .2, 1.45, -Z + .3, 0, .6, Math.PI / 2);
  // the anvil on its stump: 1.2 m out from the hearth's front, its horn toward the door; the face at 0.82 m
  const anvil = { x: hearth.x1 + .9, z: .05, y: .82 }; { const { x, z, y } = anvil; put(new THREE.CylinderGeometry(.27, .3, .5, 12), 'elm', x, .25, z); bx('steel', x - .14, x + .14, .5, .58, z - .22, z + .22); bx('steel', x - .07, x + .07, .58, .7, z - .14, z + .14);
    bx('steel', x - .09, x + .09, .7, y, z - .26, z + .18); const horn = new THREE.ConeGeometry(.07, .3, 10); horn.rotateX(Math.PI / 2); horn.scale(1, .8, 1); put(horn, 'steel', x, y - .05, z + .33); bx('steel', x - .09, x + .09, y - .12, y - .02, z - .34, z - .26);
    boxes.push({ tag: 'anvil', x0: x - .3, x1: x + .3, y0: 0, y1: y, z0: z - .34, z1: z + .48 });
    /* a hammer laid on the face and the tongs leaning on the stump */ bx('oak', x - .015, x + .015, y + .01, y + .04, z - .05, z + .27); bx('iron', x - .04, x + .04, y, y + .06, z - .1, z - .02);
    put(new THREE.BoxGeometry(.02, .62, .02), 'iron', x + .28, .3, z - .1, 0, .6, 0, -.25); put(new THREE.BoxGeometry(.02, .62, .02), 'iron', x + .28, .3, z - .06, 0, .6, 0, -.2); }
  // the slack tub (a half barrel of water) at the hearth's door side, the coal bin in the corner beyond it
  const tub = { x: hearth.x1 + .32, z: 1.3, r: .32 }; put(new THREE.CylinderGeometry(tub.r, tub.r * .9, .6, 16, 1, true), 'oak', tub.x, .3, tub.z); put(new THREE.CylinderGeometry(tub.r * .9, tub.r * .9, .03, 16), 'oak', tub.x, .02, tub.z);
  put(new THREE.CircleGeometry(tub.r - .02, 16).rotateX(-Math.PI / 2), 'water', tub.x, .55, tub.z); for (const y of [.1, .5]) put(new THREE.TorusGeometry(tub.r + .005, .012, 4, 18).rotateX(Math.PI / 2), 'iron', tub.x, y, tub.z);
  boxes.push({ tag: 'tub', x0: tub.x - tub.r, x1: tub.x + tub.r, y0: 0, y1: .6, z0: tub.z - tub.r, z1: tub.z + tub.r });
  const bin = { x0: -X, x1: -X + .75, z0: hearth.z1 + .25, z1: Z }; { const { x0, x1, z0, z1 } = bin; bx('oak', x0, x1, 0, .45, z0, z0 + .05, 'bin'); bx('oak', x1 - .05, x1, 0, .45, z0, z1, 'bin');
    for (let i = 0; i < 26; i++) put(new THREE.DodecahedronGeometry(.06 + r() * .05, 0), 'coal', x0 + .1 + r() * (x1 - x0 - .2), .13 + r() * .3 * (1 - Math.abs(r() - .5)), z0 + .15 + r() * (z1 - z0 - .25), r() * 3);
    bx('coal', x0, x1 - .05, 0, .22, z0 + .05, z1); }
  // the tool rack along the back wall east of the bellows: a rail on two brackets, tongs and hammers hung from it
  { const x0 = bel.x1 + .5, x1 = x0 + 1.6, y = 1.75; bx('oak', x0, x1, y, y + .08, -Z, -Z + .1, 'rack'); for (const x of [x0 + .05, x1 - .1]) bx('iron', x, x + .05, y - .3, y, -Z, -Z + .06);
    for (let k = 0, x = x0 + .2; x < x1 - .12; x += .19, k++) { if (k % 3 === 2) { bx('oak', x - .015, x + .015, y - .42, y, -Z + .1, -Z + .13); bx('iron', x - .05, x + .05, y - .48, y - .4, -Z + .08, -Z + .16); }
      else { const L = .5 + (k % 2) * .12; put(new THREE.BoxGeometry(.015, L, .015), 'iron', x - .02, y - L / 2 + .02, -Z + .12, 0, .6, 0, .05); put(new THREE.BoxGeometry(.015, L, .015), 'iron', x + .02, y - L / 2 + .02, -Z + .12, 0, .6, 0, -.05); } } }
  // the bench under the back window, a leg vice on its end
  const bench = { x0: .1, x1: 2.5, z0: -Z, z1: -Z + .65, y: .9 }; { const { x0, x1, z0, z1, y } = bench; bx('oak', x0, x1, y - .08, y, z0, z1, 'bench'); for (const x of [x0 + .05, x1 - .12]) for (const z of [z0 + .04, z1 - .1]) bx('oak', x, x + .07, 0, y - .08, z, z + .07);
    bx('oak', x0 + .05, x1 - .05, .15, .19, z0 + .05, z1 - .05); bx('iron', x1 - .35, x1 - .15, y, y + .14, z1 - .05, z1 + .05); bx('iron', x1 - .29, x1 - .21, 0, y + .14, z1 + .05, z1 + .11, 'vice'); bx('iron', x1 - .45, x1 - .05, y + .08, y + .1, z1 + .12, z1 + .14);
    for (let k = 0; k < 5; k++) bx(k % 2 ? 'iron' : 'oak', x0 + .3 + k * .35, x0 + .5 + k * .35, y, y + .03, z0 + .2, z0 + .35); }
  // the east end: the grindstone on its frame, the farrier's box, iron bars against the gable, horseshoes on nails, a tethering ring
  const grind = { x: X - .55, z: -1.3 }; { const { x, z } = grind; for (const dz of [-.22, .22]) { bx('oak', x - .3, x + .3, .1, .16, z + dz - .03, z + dz + .03); bx('oak', x - .03, x + .03, 0, .7, z + dz - .03, z + dz + .03); }
    bx('oak', x - .3, x - .24, 0, .16, z - .25, z + .25); bx('oak', x + .24, x + .3, 0, .16, z - .25, z + .25); const st = new THREE.CylinderGeometry(.4, .4, .12, 24); st.rotateX(Math.PI / 2); put(st, 'grit', x, .74, z, 0, .4); bx('iron', x - .015, x + .015, .72, .76, z - .3, z + .3);
    bx('iron', x - .01, x + .01, .58, .76, z + .3, z + .32); boxes.push({ tag: 'grind', x0: x - .4, x1: x + .4, y0: 0, y1: 1.14, z0: z - .32, z1: z + .32 }); }
  bx('oak', X - .7, X - .1, 0, .35, Z - .55, Z - .1, 'farrier'); bx('oak', X - .42, X - .38, .35, .55, Z - .55, Z - .1); bx('oak', X - .42, X - .38, .52, .56, Z - .55, Z - .1);
  for (let i = 0; i < 7; i++) put(new THREE.BoxGeometry(.03, 2.1, .03), 'iron', X - .1 - i * .015, 1.07, .7 + i * .09, 0, .6, -.1 - i * .01, 0); boxes.push({ tag: 'stock', x0: X - .32, x1: X, y0: 0, y1: 2.1, z0: .65, z1: 1.35 });
  for (let k = 0; k < 8; k++) { const zz = -2.1 + (k % 4) * .2, y = 1.65 + Math.floor(k / 4) * .24; put(new THREE.TorusGeometry(.065, .012, 4, 12, Math.PI * 1.5), 'iron', X - .02, y, zz, Math.PI / 2, .6, 0, Math.PI * .75); }
  put(new THREE.TorusGeometry(.07, .012, 6, 14).rotateY(Math.PI / 2), 'iron', X - .03, 1.25, 1.75);
  // the roof: three couples, each with a tie beam across at the wall plate; a purlin either side; the lantern from the middle tie beam
  const TB = h - .2, L2 = Z / Math.cos(p); for (const x of [-1.6, .6, 2.6]) { for (const s of [-1, 1]) { /* each blade from the ridge to its foot on the wall's inner face */ const g = new THREE.BoxGeometry(.12, .16, L2 - .1); g.rotateX(s * p); put(g, 'oak', x, under(s * Z / 2) - .12, s * Z / 2); }
    bx('oak', x - .08, x + .08, TB, h - .02, -Z, Z); }
  for (const s of [-1, 1]) { const zz = s * Z * .5; put(new THREE.BoxGeometry(plan.w - 2 * t, .12, .14), 'oak', 0, under(zz) - .25, zz); }
  const lantern = [.6, TB - .7, .5]; bx('iron', .595, .605, lantern[1] + .12, TB, .495, .505); put(new THREE.CylinderGeometry(.07, .08, .2, 6), 'glow', ...lantern); put(new THREE.ConeGeometry(.09, .1, 6), 'iron', lantern[0], lantern[1] + .15, lantern[2]);
  // the windows are clear from inside
  { const G = glMats().glass, Lt = glMats().lit; shell.traverse(m => { if (m.isMesh && (m.material === G || m.material === Lt)) { m.material = mats().pane; m.name = 'pane'; } }); }
  const group = new THREE.Group(); let tris = 0; for (const [k, gs] of B) { const g = mergeGeometries(gs, false); gs.forEach(x => x.dispose()); const m = new THREE.Mesh(g, M[k]); m.name = k; m.castShadow = !['flame', 'ember', 'glow', 'water'].includes(k); m.receiveShadow = true; group.add(m); tris += g.attributes.position.count / 3; }
  const all = new THREE.Group(); all.add(shell, group); const door = plan.open.front[0];
  const windows = Object.entries(plan.open).flatMap(([f, os]) => (os || []).filter(q => q.kind === 'win').map(q => ({ face: f, x: f === 'front' ? q.x : f === 'back' ? -q.x : plan.w / 2, z: f === 'front' ? plan.d / 2 : f === 'back' ? -plan.d / 2 : -q.x, y: q.y, w: q.w, h: q.h })));
  const paths = [[[door.x, Z - .2], [door.x, .9], [anvil.x + .75, anvil.z]], [[door.x, Z - .2], [door.x, bench.z1 + .4]], [[door.x, Z - .2], [grind.x - .7, -.3], [grind.x - .7, grind.z]]];
  return { group: all, shell, room: group, tris: Math.round(tris), draws: group.children.length, shellTris: shell.userData.tris, shellCalls: shell.userData.calls, inner: { x0: -X, x1: X, z0: -Z, z1: Z }, under, floor: F0, tieBeam: TB,
    hearth, hood, fire, anvil, tub, bench, bellows: bel, grind, door: { x: door.x, z: plan.d / 2, w: door.w, h: door.h }, paths, boxes, lantern, windows, w: plan.w, d: plan.d, eave: h };
}
