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
import { stream, gatelandsBuilding, GL_PLANS, SCALE, glMats, markHall, aurenneHouse, aurenneCourtyard, aurenneTextures, aurenneChurch, aurenneAcademy, gatelandsMarket } from './pieces.js';

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
  const BD = .55, bxx = HX + HT / 2; { const bz0 = hz - hw / 2 - .35, bz1 = hz + hw / 2 + .35; /* the breast narrows up into the stack, so it stays under the thatch's slopes */ put(frustum([bxx, bxx + BD, bz0, bz1], hh, [bxx, bxx + BD, -.35, .35], under(0) - .4), 'lime', 0, 0, 0, 0, .42); bx('lime', bxx, bxx + BD, 0, hh, bz0, hz - hw / 2, 'breast'); bx('lime', bxx, bxx + BD, 0, hh, hz + hw / 2, bz1, 'breast');
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
    /* the collar ends where its top meets the slopes' underside */ bx('oak', x - .07, x + .07, h + 1.35, h + 1.5, -Z + 1.74 / tp, Z - 1.74 / tp); }
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

// markSmithy(o, r) (Session 930, card F9; L5's interiors by nation, OG-043's Mark blacksmith "in a timber hall with carved posts"; Michael's
//   A on #303): the Mark's hall of pieces.js (shingle, 6.4 by 9 m, its smoke louver on the ridge, o.interior) as a smithy. The hall's
//   floor is its stone footing, flagged: no planks near the fire. The forge stands free on the hall's axis under the louver, a waist-high
//   hearth of stone with a clay top, so the smoke goes straight up and out; at its back the bellows shield, an upright slab the nozzles
//   pass through, and behind it the twin bag bellows on a low frame, one worked while the other fills. Before the forge, the anvil, a
//   block on a great stump; the quench tub beside it; the charcoal bin against the left wall; the smith's tool chest, tongs and hammers
//   on pegs; a bench with a vice down the right wall, the whetstone in the back corner; spear shafts racked on the back wall and iron
//   bars leaning by them. The longhouse's frame (Session 870): two rows of posts, tie beams, rafters and a board lining under the shingle.
//   -> { group, shell, room, tris, draws, inner, under(x), floor, tieBeam, fire, hearth {x0, x1, z0, z1, y}, louver, anvil, tub, bench,
//        door, paths, boxes, lamp, windows, w, d }
export function markSmithy(o = {}, r = stream('smithy')) {
  const w = o.w ?? 6.4, d = o.d ?? 9, hall = markHall({ roof: 'shingle', w, d, porch: true, chimney: false, carve: true, wall: o.wall ?? 2, interior: true }, stream('smithy-shell'));
  const M = { ...longMats(), ...forgeMats(), slab: new THREE.MeshStandardMaterial({ color: 0x2e2a26, roughness: .9 }) /* fire-blackened stone */ }, B = new Map(), boxes = [];
  const put = (geo, key, x = 0, y = 0, z = 0, ry = 0, uv = .6, rx = 0, rz = 0) => { const g = geo.index ? geo.toNonIndexed() : geo; for (const k of Object.keys(g.attributes)) if (!['position', 'normal'].includes(k)) g.deleteAttribute(k);
    g.applyMatrix4(new THREE.Matrix4().compose(new THREE.Vector3(x, y, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(rx, ry, rz, 'YXZ')), new THREE.Vector3(1, 1, 1))); worldUV(g, uv);
    if (!B.has(key)) B.set(key, []); B.get(key).push(g); return g; };
  const bx = (key, x0, x1, y0, y1, z0, z1, tag) => { put(new THREE.BoxGeometry(x1 - x0, y1 - y0, z1 - z0), key, (x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2); if (tag) boxes.push({ tag, x0, x1, y0, y1, z0, z1 }); };
  const X = w / 2 - .25, Z = d / 2 - .25, FY = hall.sill + .04, tp = Math.tan(hall.pitch), under = x => hall.ry0 + (w / 2 + hall.ov - Math.abs(x)) * tp - .02, WP = hall.sill + hall.wh;
  // the floor: flags laid on the footing's stone
  for (let z = -Z; z < Z - .05;) { const dz = Math.min(Z - z, .5 + r() * .35); for (let x = -X; x < X - .05;) { const dx = Math.min(X - x, .55 + r() * .45); put(new THREE.BoxGeometry(dx - .02, .04, dz - .02), 'kerb', x + dx / 2, hall.sill + .02 + (r() - .5) * .006, z + dz / 2, (r() - .5) * .01, .7); x += dx; } z += dz; }
  // the frame (the longhouse's): two rows of posts 1.0 m in from the walls, clear of the forge, purlins and tie beams; rafters and lining
  const PXr = X - 1.0, TB = WP + .25, posts = [-Z + 1.15, .6];
  for (const sx of [-1, 1]) { for (const z of posts) bx('post', sx * PXr - .11, sx * PXr + .11, FY, TB, z - .11, z + .11, 'post'); bx('post', sx * PXr - .12, sx * PXr + .12, TB, TB + .24, -Z, Z); }
  for (const z of posts) bx('post', -PXr - .1, PXr + .1, TB, TB + .24, z - .1, z + .1);
  const XL = w / 2 - .02, rl = X / Math.cos(hall.pitch); for (const sx of [-1, 1]) { const xm = sx * X / 2, rz = -sx * hall.pitch;
    for (let z = -Z + .3; z < Z; z += 1.0) put(new THREE.BoxGeometry(rl, .14, .1), 'post', xm, under(xm) - .03 - .07 / Math.cos(hall.pitch), z, 0, .8, 0, rz);
    put(new THREE.BoxGeometry(XL / Math.cos(hall.pitch), .02, 2 * Z), 'board', sx * XL / 2, under(XL / 2) - .01, 0, 0, .8, 0, rz); }
  // the forge under the louver: a waist-high block of stone with rough stones round its rim, a clay top, a bed of charcoal and the fire
  const lz = hall.louver ?? -1.35, H = { x0: -.6, x1: .6, z0: lz - .55, z1: lz + .55, y: FY + .72 }; bx('kerb', H.x0, H.x1, FY, H.y - .06, H.z0, H.z1, 'hearth'); bx('ash', H.x0 + .04, H.x1 - .04, H.y - .06, H.y - .02, H.z0 + .04, H.z1 - .04);
  for (let k = 0; k < 12; k++) { const t = k / 12, per = 2 * (H.x1 - H.x0 + H.z1 - H.z0), s = t * per, wx = H.x1 - H.x0, wz = H.z1 - H.z0; let x, z;
    if (s < wx) { x = H.x0 + s; z = H.z0 + .06; } else if (s < wx + wz) { x = H.x1 - .06; z = H.z0 + s - wx; } else if (s < 2 * wx + wz) { x = H.x1 - (s - wx - wz); z = H.z1 - .06; } else { x = H.x0 + .06; z = H.z1 - (s - 2 * wx - wz); }
    const g = new THREE.IcosahedronGeometry(.06 + r() * .02, 1); g.scale(1.3, .5, 1.1); put(g, 'slab', Math.min(H.x1 - .07, Math.max(H.x0 + .07, x)), H.y - .03, Math.min(H.z1 - .08, Math.max(H.z0 + .08, z)), r() * 3); }
  const fire = [0, H.y + .04, lz - .1]; for (let i = 0; i < 14; i++) { const a = r() * Math.PI * 2, dd = .12 + r() * .22; put(new THREE.DodecahedronGeometry(.045 + r() * .025, 0), 'coal', Math.cos(a) * dd, H.y - .01, fire[2] + Math.sin(a) * dd, r() * 3); }
  put(new THREE.SphereGeometry(.18, 12, 6).scale(1.1, .35, 1.2), 'ember', 0, H.y - .02, fire[2]); for (let i = 0; i < 3; i++) put(new THREE.ConeGeometry(.05, .18 + i * .06, 7), 'flame', (i - 1) * .06, H.y + .08, fire[2] + (i - 1) * .06);
  // the bellows shield: an upright slab at the forge's back, the nozzles through it low over the fire; the twin bag bellows behind on a frame
  bx('slab', -.42, .42, H.y - .06, H.y + .55, H.z0 - .1, H.z0, 'shield'); const bz1 = H.z0 - .15, bz0 = bz1 - 1.05, by = FY + .35;
  bx('oak', -.5, .5, FY, by - .05, bz0, bz1); boxes.push({ tag: 'bellows', x0: -.5, x1: .5, y0: FY, y1: by + .6, z0: bz0, z1: bz1 }); for (const sx of [-1, 1]) { const cx = sx * .24, s = new THREE.Shape(); s.moveTo(-.15, 0); s.lineTo(.15, 0); s.quadraticCurveTo(.18, .7, .04, 1.0); s.lineTo(-.04, 1.0); s.quadraticCurveTo(-.18, .7, -.15, 0);
    /* the shape's narrow end (y 1.0) toward the shield; an extrusion hangs down from the height it is put at */ const board = y => { const g = new THREE.ExtrudeGeometry(s, { depth: .04, bevelEnabled: false }); g.rotateX(Math.PI / 2); put(g, 'elm', cx, y, bz0); };
    const top = by + .26 + (sx > 0 ? .06 : -.06) /* one bag full, one emptied */, fold = (top - .04 - (by - .01)) / 3; board(by - .01); board(top); for (let j = 0; j < 3; j++) { const k = j % 2 ? .72 : .9, g = new THREE.ExtrudeGeometry(s, { depth: fold, bevelEnabled: false }); g.scale(k, k, 1); g.rotateX(Math.PI / 2); put(g, 'leather', cx, top - .04 - j * fold, bz0 + (1 - k) * .3); }
    put(new THREE.CylinderGeometry(.02, .035, .45, 8), 'iron', cx * .5, H.y + .02, H.z0 - .05, 0, .6, Math.PI / 2 - .25); bx('oak', cx - .015, cx + .015, by + .3, by + .55, bz0 + .25, bz0 + .28); }
  // the anvil: a block on a great stump before the forge, a small beak to one side; a hammer on its face, tongs on the stump
  const anvil = { x: 0, z: H.z1 + .95, y: FY + .8 }; { const { x, z, y } = anvil; put(new THREE.CylinderGeometry(.32, .36, .62, 12), 'elm', x, FY + .31, z); bx('steel', x - .1, x + .1, FY + .62, y, z - .13, z + .13);
    const bk = new THREE.ConeGeometry(.04, .16, 8); bk.rotateZ(-Math.PI / 2); put(bk, 'steel', x + .18, y - .04, z); boxes.push({ tag: 'anvil', x0: x - .36, x1: x + .36, y0: FY, y1: y, z0: z - .36, z1: z + .36 });
    bx('oak', x - .2, x + .1, y + .01, y + .04, z + .02, z + .05); bx('iron', x + .06, x + .12, y, y + .06, z, z + .07); put(new THREE.BoxGeometry(.02, .6, .02), 'iron', x - .3, FY + .3, z + .2, 0, .6, .3, 0); }
  // the quench tub at the anvil's right, the charcoal bin against the left wall
  const tub = { x: .95, z: anvil.z - .35, r: .3 }; put(new THREE.CylinderGeometry(tub.r, tub.r * .9, .55, 16, 1, true), 'oak', tub.x, FY + .275, tub.z); put(new THREE.CylinderGeometry(tub.r * .9, tub.r * .9, .03, 16), 'oak', tub.x, FY + .02, tub.z);
  put(new THREE.CircleGeometry(tub.r - .02, 16).rotateX(-Math.PI / 2), 'water', tub.x, FY + .5, tub.z); for (const y of [.1, .45]) put(new THREE.TorusGeometry(tub.r + .005, .012, 4, 18).rotateX(Math.PI / 2), 'iron', tub.x, FY + y, tub.z);
  boxes.push({ tag: 'tub', x0: tub.x - tub.r, x1: tub.x + tub.r, y0: FY, y1: FY + .55, z0: tub.z - tub.r, z1: tub.z + tub.r });
  { const x0 = -X, x1 = -X + .8, z0 = lz - .8, z1 = lz + .6; bx('board', x0, x1, FY, FY + .5, z0, z0 + .05, 'bin'); bx('board', x0, x1, FY, FY + .5, z1 - .05, z1, 'bin'); bx('board', x1 - .05, x1, FY, FY + .5, z0, z1, 'bin'); bx('coal', x0, x1 - .05, FY, FY + .25, z0 + .05, z1 - .05);
    for (let i = 0; i < 22; i++) put(new THREE.DodecahedronGeometry(.05 + r() * .04, 0), 'coal', x0 + .12 + r() * (x1 - x0 - .3), FY + .3 + r() * .12, z0 + .15 + r() * (z1 - z0 - .3), r() * 3); }
  // the tool chest on the left, its lid up; tongs and hammers on pegs on the left wall between the windows
  { const x0 = -X + .1, x1 = -X + .8, z0 = posts[1] - .75, z1 = posts[1] - .2; bx('oak', x0, x1, FY, FY + .42, z0, z1, 'chest'); bx('iron', x0, x1, FY + .3, FY + .33, z1, z1 + .02);
    put(new THREE.BoxGeometry(x1 - x0, .03, z1 - z0), 'oak', (x0 + x1) / 2, FY + .42 + (z1 - z0) / 2 * .9, z0 - .02, 0, .6, -1.2, 0);
    for (let k = 0; k < 7; k++) { const z = lz + .9 + k * .26, L = .4 + (k % 3) * .1; bx('oak', -X, -X + .1, FY + 1.75, FY + 1.78, z - .015, z + .015); if (k % 3 === 1) { bx('oak', -X + .05, -X + .08, FY + 1.75 - L, FY + 1.75, z - .015, z + .015); bx('iron', -X + .03, -X + .1, FY + 1.7 - L, FY + 1.79 - L, z - .05, z + .05); }
      else { bx('iron', -X + .05, -X + .07, FY + 1.75 - L, FY + 1.75, z - .03, z - .01); bx('iron', -X + .05, -X + .07, FY + 1.75 - L, FY + 1.75, z + .01, z + .03); } } }
  // the bench down the right wall with a vice; the whetstone in the back right corner
  const bench = { x0: X - .7, x1: X, z0: posts[1] + .25, z1: posts[1] + 2.2, y: FY + .88 }; { const { x0, x1, z0, z1, y } = bench; bx('oak', x0, x1, y - .08, y, z0, z1, 'bench'); for (const x of [x0 + .05, x1 - .12]) for (const z of [z0 + .04, z1 - .1]) bx('oak', x, x + .07, FY, y - .08, z, z + .07);
    bx('iron', x0 - .05, x0 + .05, y, y + .14, z0 + .2, z0 + .4); bx('iron', x0 - .11, x0 - .05, FY, y + .14, z0 + .26, z0 + .34, 'vice'); for (let k = 0; k < 4; k++) bx(k % 2 ? 'iron' : 'oak', x0 + .2, x0 + .35, y, y + .03, z0 + .6 + k * .32, z0 + .8 + k * .32); }
  const grind = { x: X - .5, z: -Z + .55 }; { const { x, z } = grind; for (const dx of [-.22, .22]) bx('oak', x + dx - .03, x + dx + .03, FY, FY + .62, z - .03, z + .03); bx('oak', x - .25, x + .25, FY + .1, FY + .16, z - .03, z + .03);
    const st = new THREE.CylinderGeometry(.34, .34, .1, 22); st.rotateZ(Math.PI / 2); put(st, 'grit', x, FY + .66, z, 0, .4); bx('iron', x - .28, x + .28, FY + .64, FY + .68, z - .015, z + .015); boxes.push({ tag: 'grind', x0: x - .3, x1: x + .3, y0: FY, y1: FY + 1.0, z0: z - .36, z1: z + .36 }); }
  // the back wall: spear shafts in a rack, iron bars leaning
  { const x0 = -2.2, x1 = -.9; bx('oak', x0, x1, FY + 1.5, FY + 1.56, -Z, -Z + .12); bx('oak', x0, x1, FY, FY + .08, -Z, -Z + .12, 'rack'); for (let k = 0; k < 6; k++) { const x = x0 + .12 + k * .22; put(new THREE.CylinderGeometry(.016, .016, 2.2, 6), 'oak', x, FY + 1.12, -Z + .07); put(new THREE.ConeGeometry(.03, .22, 4).scale(1, 1, .3), 'steel', x, FY + 2.33, -Z + .07); } }
  for (let i = 0; i < 6; i++) put(new THREE.BoxGeometry(.03, 1.8, .03), 'iron', -.5 + i * .08, FY + .92, -Z + .1 + i * .01, 0, .6, -.12, 0); boxes.push({ tag: 'stock', x0: -.6, x1: .05, y0: FY, y1: FY + 1.8, z0: -Z, z1: -Z + .25 });
  // the lamp: an iron bowl on a chain from the front tie beam
  const lamp = [-1.0, TB - .6, posts[1]]; bx('iron', lamp[0] - .005, lamp[0] + .005, lamp[1] + .05, TB, lamp[2] - .005, lamp[2] + .005);
  put(new THREE.SphereGeometry(.09, 10, 6, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), 'iron', ...lamp); put(new THREE.SphereGeometry(.02, 6, 5).scale(1, 2, 1), 'flame', lamp[0] + .05, lamp[1] + .03, lamp[2]);
  // the front door, hung open against the front wall, left of the doorway
  { const leaf = { x0: -hall.door.w / 2 - .07, x1: -hall.door.w / 2 - .01, z0: Z - hall.door.w - .01, z1: Z - .01 }; bx('board', leaf.x0, leaf.x1, FY, FY + hall.door.h - .12, leaf.z0, leaf.z1, 'door');
    for (const y of [.5, 1.5]) bx('iron', leaf.x0 - .02, leaf.x0, FY + y - .03, FY + y + .03, leaf.z0 + .1, leaf.z1 - .05); }
  // the walks: in at the door to the anvil; to the bench; down the left past the forge to the spear rack
  const paths = [[[0, Z - .1], [0, anvil.z + .55]], [[0, Z - .1], [bench.x0 - .45, Z - .9], [bench.x0 - .45, bench.z0 + .5]], [[0, Z - .1], [0, Z - 1.5], [-1.35, Z - 2.0], [-1.35, -Z + .7]]];
  const group = new THREE.Group(); let tris = 0; for (const [k, gs] of B) { const g = mergeGeometries(gs, false); gs.forEach(x => x.dispose()); const m = new THREE.Mesh(g, M[k]); m.name = k; m.castShadow = !['flame', 'ember', 'glow', 'water'].includes(k); m.receiveShadow = true; group.add(m); tris += g.attributes.position.count / 3; }
  const all = new THREE.Group(); all.add(hall.group, group);
  return { group: all, shell: hall.group, room: group, tris: Math.round(tris), draws: group.children.length, shellTris: hall.tris, shellCalls: hall.draws, inner: { x0: -X, x1: X, z0: -Z, z1: Z }, under, floor: FY, tieBeam: TB,
    fire, hearth: H, louver: lz, anvil, tub, bench, grind, door: { x: 0, z: d / 2, w: hall.door.w, h: hall.door.h }, paths, boxes, lamp, windows: hall.windows, w, d };
}

// aurenneSmithy(o, r) (Session 931, card F9; L5's interiors by nation, OG-043's Aurenne blacksmith "arcades, tilework"; Michael's A on
//   #303): pieces.js's Roman house (one storey of 3.0 m, 7.2 by 6.0 m, a hipped pantile roof, the arcade before its front; o.interior so
//   its door stands open) as a smith's shop on a street. The forge in the back left corner: a hearth of plastered masonry with a band of
//   blue tile on its lip, a sooted hood over it narrowing into a flue that rises through the roof to a tiled cap. Beside it the two
//   goatskin bag bellows on the floor and the apprentice's stool; the anvil on a block of limestone before it; a stone quench trough
//   against the left wall. Cedar joists under the ceiling, a brass lamp from them. Tongs and hammers on a rail on the right wall, the bench
//   with a vice under it; charcoal in two baskets; bars of iron in the corner by the door. Limestone flags, cinders round the forge. Under
//   the arcade, the stall: a table of the smith's wares (a copper pot, a brass lamp, blades, hinges) beside the door, and a water trough.
//   -> { group, shell, room, tris, draws, inner, floor, ceil, hearth {x0, x1, z0, z1, y}, hood, flue {x0, x1, z0, z1, y1, roof}, fire,
//        anvil, trough, bench, stall [boxes], arcade {z0, z1}, door, paths, boxes, lamp, w, d }
export function aurenneSmithy(o = {}, r = stream('aursmithy')) {
  const w = 7.2, d = 6.0, sh = aurenneHouse({ kind: 'tile', w, d, two: false, arcade: true, wall: o.wall ?? 2, door: 1, pointed: false, interior: true }, stream(o.shell || 'aursmithy-shell'));
  const M = { ...homeMats(), ...forgeMats(), sootPlaster: new THREE.MeshStandardMaterial({ color: 0x3e3834, roughness: .95 }), slab: new THREE.MeshStandardMaterial({ color: 0x2e2a26, roughness: .9 }) }, B = new Map(), boxes = [], stall = [];
  const put = (geo, key, x = 0, y = 0, z = 0, ry = 0, uv = .6, rx = 0, rz = 0) => { const g = geo.index ? geo.toNonIndexed() : geo; for (const k of Object.keys(g.attributes)) if (!['position', 'normal'].includes(k)) g.deleteAttribute(k);
    g.applyMatrix4(new THREE.Matrix4().compose(new THREE.Vector3(x, y, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(rx, ry, rz, 'YXZ')), new THREE.Vector3(1, 1, 1))); worldUV(g, uv);
    if (!B.has(key)) B.set(key, []); B.get(key).push(g); return g; };
  const UVK = { zellige: 1.47 }, bx = (key, x0, x1, y0, y1, z0, z1, tag, list = boxes) => { put(new THREE.BoxGeometry(x1 - x0, y1 - y0, z1 - z0), key, (x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2, 0, UVK[key] ?? .6); if (tag) list.push({ tag, x0, x1, y0, y1, z0, z1 }); };
  const X = w / 2 - sh.T, Z = d / 2 - sh.T, F0 = sh.yW + .02, TOP = sh.top, CEIL = TOP - .2;
  // the floor: limestone flags, cinders trodden round the forge
  bx('limestone', -X, X, sh.yW, F0, -Z, Z); bx('cinder', -X, -.6, F0, F0 + .004, -Z, -.2);
  // the ceiling: cedar joists across the shop under the stone slab, every 0.6 m, stopping at the flue
  const flue = { x0: -X + .02, x1: -X + .55, z0: -Z + .02, z1: -Z + .55 }; for (let x = -X + .3; x < X - .1; x += .6) { const z0 = x < flue.x1 + .1 ? flue.z1 + .05 : -Z; bx('cedar', x - .06, x + .06, CEIL, TOP, z0, Z); }
  // the forge: a hearth of plastered masonry in the corner, its top sooted, a band of glazed tile on its lip; a bed of charcoal and the fire
  const H = { x0: -X, x1: -X + 1.2, z0: -Z, z1: -Z + 1.0, y: F0 + .8 }; bx('plaster', H.x0, H.x1, F0, H.y - .05, H.z0, H.z1, 'hearth'); bx('slab', H.x0, H.x1, H.y - .05, H.y, H.z0, H.z1);
  bx('zellige', H.x1, H.x1 + .02, H.y - .2, H.y - .05, H.z0, H.z1); bx('zellige', H.x0, H.x1 + .02, H.y - .2, H.y - .05, H.z1, H.z1 + .02);
  /* the corner behind the forge smoked black from the hearth to the joists */ bx('sootPlaster', H.x0, H.x0 + .012, H.y, CEIL, H.z0, H.z1 + .25); bx('sootPlaster', H.x0, H.x1 + .25, H.y, CEIL, H.z0, H.z0 + .012);
  const fire = [H.x0 + .5, H.y + .03, H.z0 + .45]; for (let i = 0; i < 14; i++) { const a = r() * Math.PI * 2, dd = .1 + r() * .22; put(new THREE.DodecahedronGeometry(.045 + r() * .025, 0), 'coal', fire[0] + Math.cos(a) * dd, H.y - .005, fire[2] + Math.sin(a) * dd, r() * 3); }
  put(new THREE.SphereGeometry(.17, 12, 6).scale(1.1, .35, 1.1), 'ember', fire[0], H.y - .01, fire[2]); for (let i = 0; i < 3; i++) put(new THREE.ConeGeometry(.045, .16 + i * .05, 7), 'flame', fire[0] + (i - 1) * .05, H.y + .07, fire[2] + (i - 1) * .05);
  // the hood from 1.9 m over the hearth into the flue; the flue up through the ceiling and the roof to a cap of pantile
  const hood = { y0: F0 + 1.9, y1: CEIL }; put(frustum([H.x0, H.x1 + .05, H.z0, H.z1 + .05], hood.y0, [flue.x0, flue.x1, flue.z0, flue.z1], hood.y1), 'sootPlaster', 0, 0, 0, 0, .5);
  bx('copper', H.x0, H.x1 + .07, hood.y0 - .06, hood.y0, H.z1 + .03, H.z1 + .07); bx('copper', H.x1 + .03, H.x1 + .07, hood.y0 - .06, hood.y0, H.z0, H.z1 + .07);
  const over = .45, roofAt = (x, z) => TOP + .16 + Math.tan(22 * Math.PI / 180) * Math.min(w / 2 + over - Math.abs(x), d / 2 + over - Math.abs(z)); flue.roof = roofAt(flue.x0, flue.z0); flue.y1 = flue.roof + .7;
  { const g = new THREE.BoxGeometry(flue.x1 - flue.x0, flue.y1 - CEIL, flue.z1 - flue.z0); g.translate((flue.x0 + flue.x1) / 2, (CEIL + flue.y1) / 2, (flue.z0 + flue.z1) / 2); put(g, 'flue', 0, 0, 0, 0, .5);
    const c = new THREE.BoxGeometry(flue.x1 - flue.x0 + .2, .06, flue.z1 - flue.z0 + .2); c.translate((flue.x0 + flue.x1) / 2, flue.y1 + .22, (flue.z0 + flue.z1) / 2); put(c, 'terra', 0, 0, 0);
    for (const [a, b] of [[flue.x0 + .05, flue.z0 + .05], [flue.x1 - .05, flue.z0 + .05], [flue.x0 + .05, flue.z1 - .05], [flue.x1 - .05, flue.z1 - .05]]) put(new THREE.BoxGeometry(.06, .2, .06), 'flue', a, flue.y1 + .1, b); }
  // the bag bellows: two goatskins on the floor at the hearth's right, their wooden mouths open to the room, the nozzles into the hearth's flank; the stool
  const bel = { x0: H.x1 + .1, x1: H.x1 + 1.0, z0: -Z + .05, z1: -Z + .95 }; boxes.push({ tag: 'bellows', ...bel, y0: F0, y1: F0 + .45 });
  for (const k of [0, 1]) { const cz = bel.z0 + .22 + k * .46, g = new THREE.SphereGeometry(.3, 14, 10); g.scale(1.2, .55 + k * .2, .7); put(g, 'leather', (bel.x0 + bel.x1) / 2 + .05, F0 + .2 + k * .04, cz, 0, .6);
    bx('cedar', bel.x1 - .06, bel.x1, F0 + .1, F0 + .35 + k * .06, cz - .15, cz - .12); bx('cedar', bel.x1 - .06, bel.x1, F0 + .1, F0 + .35 + k * .06, cz + .12, cz + .15);
    const nz = new THREE.CylinderGeometry(.025, .035, .35, 8); put(nz, 'iron', bel.x0 - .05, F0 + .45, cz * .6 + (H.z0 + .45) * .4, 0, .6, 0, Math.PI / 2 - .5); }
  { const x = bel.x1 + .35, z = -Z + .45; bx('cedar', x - .16, x + .16, F0 + .28, F0 + .32, z - .16, z + .16, 'stool'); for (const a of [0, 2.1, 4.2]) put(new THREE.CylinderGeometry(.018, .022, .28, 6), 'cedar', x + Math.cos(a) * .1, F0 + .14, z + Math.sin(a) * .1); }
  // the anvil on a block of limestone, 1.1 m out from the hearth's front; a hammer on it, tongs leaning
  const anvil = { x: H.x0 + .95, z: H.z1 + 1.1, y: F0 + .82 }; { const { x, z, y } = anvil; bx('limestone', x - .28, x + .28, F0, F0 + .5, z - .28, z + .28); bx('steel', x - .13, x + .13, F0 + .5, F0 + .58, z - .2, z + .2); bx('steel', x - .07, x + .07, F0 + .58, F0 + .7, z - .13, z + .13);
    bx('steel', x - .085, x + .085, F0 + .7, y, z - .24, z + .17); const horn = new THREE.ConeGeometry(.065, .28, 10); horn.rotateX(Math.PI / 2); horn.scale(1, .8, 1); put(horn, 'steel', x, y - .05, z + .31);
    boxes.push({ tag: 'anvil', x0: x - .28, x1: x + .28, y0: F0, y1: y, z0: z - .28, z1: z + .45 }); bx('cedar', x - .015, x + .015, y + .01, y + .04, z - .05, z + .25); bx('iron', x - .04, x + .04, y, y + .06, z - .1, z - .02);
    put(new THREE.BoxGeometry(.02, .6, .02), 'iron', x + .27, F0 + .3, z + .05, 0, .6, 0, -.25); }
  // the quench trough of limestone against the left wall
  const trough = { x0: -X, x1: -X + .55, z0: anvil.z - .35, z1: anvil.z + .75 }; { const { x0, x1, z0, z1 } = trough; bx('limestone', x0, x1, F0, F0 + .6, z0, z0 + .07, 'trough'); bx('limestone', x0, x1, F0, F0 + .6, z1 - .07, z1, 'trough'); bx('limestone', x1 - .07, x1, F0, F0 + .6, z0, z1, 'trough'); bx('limestone', x0, x1, F0, F0 + .1, z0, z1, 'trough');
    put(new THREE.PlaneGeometry(x1 - x0 - .1, z1 - z0 - .14).rotateX(-Math.PI / 2), 'water', (x0 + x1) / 2 - .03, F0 + .52, (z0 + z1) / 2); }
  // charcoal in two baskets at the back wall; iron bars in the corner by the door
  for (const bxx of [.6, 1.25]) { const z = -Z + .32; put(new THREE.CylinderGeometry(.3, .24, .5, 14, 1, true), 'straw', bxx, F0 + .25, z); put(new THREE.CircleGeometry(.29, 14).rotateX(-Math.PI / 2), 'coal', bxx, F0 + .42, z); boxes.push({ tag: 'basket', x0: bxx - .3, x1: bxx + .3, y0: F0, y1: F0 + .5, z0: z - .3, z1: z + .3 }); }
  for (let i = 0; i < 6; i++) put(new THREE.BoxGeometry(.03, 1.8, .03), 'iron', -X + .1 + i * .015, F0 + .91, Z - .9 + i * .1, 0, .6, 0, .1 + i * .01); boxes.push({ tag: 'stock', x0: -X, x1: -X + .32, y0: F0, y1: F0 + 1.8, z0: Z - .95, z1: Z - .3 });
  // the right wall: a rail of tongs and hammers behind the forge's side, the bench with a vice by the front
  { const z0 = -Z + .3, z1 = -.6, y = F0 + 1.7; bx('cedar', X - .1, X, y, y + .08, z0, z1); for (let k = 0, z = z0 + .15; z < z1 - .1; z += .2, k++) { const L = .45 + (k % 3) * .08;
      if (k % 3 === 2) { bx('cedar', X - .13, X - .1, y - L, y, z - .015, z + .015); bx('iron', X - .16, X - .08, y - L - .06, y - L + .02, z - .05, z + .05); } else { bx('iron', X - .12, X - .1, y - L, y, z - .03, z - .01); bx('iron', X - .12, X - .1, y - L, y, z + .01, z + .03); } } }
  const bench = { x0: X - .65, x1: X, z0: .55, z1: Z - .15, y: F0 + .9 }; { const { x0, x1, z0, z1, y } = bench; bx('cedar', x0, x1, y - .07, y, z0, z1, 'bench'); for (const xx of [x0 + .04, x1 - .1]) for (const zz of [z0 + .04, z1 - .1]) bx('cedar', xx, xx + .06, F0, y - .07, zz, zz + .06);
    bx('iron', x0 - .05, x0 + .05, y, y + .14, z0 + .2, z0 + .4); bx('iron', x0 - .1, x0 - .04, F0, y + .14, z0 + .26, z0 + .34, 'vice'); for (let k = 0; k < 4; k++) bx(k % 2 ? 'brass' : 'iron', x0 + .2, x0 + .4, y, y + .03, z0 + .6 + k * .28, z0 + .78 + k * .28); }
  // the brass lamp from the joists
  const lamp = [.6, CEIL - .7, .3]; bx('brass', lamp[0] - .005, lamp[0] + .005, lamp[1] + .1, CEIL, lamp[2] - .005, lamp[2] + .005); put(new THREE.SphereGeometry(.08, 10, 6, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), 'brass', ...lamp); put(new THREE.SphereGeometry(.018, 6, 5).scale(1, 2, 1), 'flame', lamp[0] + .05, lamp[1] + .03, lamp[2]);
  // under the arcade: the stall of wares on the left of the door's walk (the shell's cypress stands before the right end), a water trough on the right
  const AZ0 = d / 2 + .05, AZ1 = d / 2 + 1.55, YA = sh.yW; { const x0 = -2.9, x1 = -.9, z0 = AZ0 + .15, z1 = AZ0 + .75, y = YA + .85; bx('cedar', x0, x1, y - .06, y, z0, z1, 'table', stall); for (const xx of [x0 + .05, x1 - .11]) for (const zz of [z0 + .04, z1 - .1]) bx('cedar', xx, xx + .06, YA, y - .06, zz, zz + .06);
    put(new THREE.CylinderGeometry(.16, .13, .22, 16, 1, true), 'copper', x0 + .3, y + .11, (z0 + z1) / 2); put(new THREE.CircleGeometry(.13, 16).rotateX(-Math.PI / 2), 'copper', x0 + .3, y + .005, (z0 + z1) / 2);
    put(new THREE.SphereGeometry(.07, 10, 6).scale(1.6, .6, 1), 'brass', x0 + .75, y + .05, (z0 + z1) / 2); put(new THREE.ConeGeometry(.02, .14, 6).rotateZ(Math.PI / 2), 'brass', x0 + .92, y + .07, (z0 + z1) / 2);
    for (let k = 0; k < 3; k++) { bx('steel', x0 + 1.05 + k * .22, x0 + 1.1 + k * .22, y, y + .015, z0 + .08, z1 - .08); bx('cedar', x0 + 1.04 + k * .22, x0 + 1.11 + k * .22, y, y + .03, z1 - .2, z1 - .06); }
    for (let k = 0; k < 4; k++) bx('iron', x0 + 1.75 + (k % 2) * .1, x0 + 1.83 + (k % 2) * .1, y, y + .01, z0 + .1 + Math.floor(k / 2) * .25, z0 + .3 + Math.floor(k / 2) * .25); }
  { const x0 = 1.3, x1 = 2.7, z0 = AZ0 + .2, z1 = AZ0 + .65; bx('limestone', x0, x1, YA, YA + .55, z0, z1, 'horse trough', stall); put(new THREE.PlaneGeometry(x1 - x0 - .12, z1 - z0 - .12).rotateX(-Math.PI / 2), 'water', (x0 + x1) / 2, YA + .56, (z0 + z1) / 2); }
  const paths = [[[sh.doorX, Z - .1], [sh.doorX, .3], [anvil.x + .75, anvil.z]], [[sh.doorX, Z - .1], [bench.x0 - .45, Z - .5], [bench.x0 - .45, bench.z0 + .3]], [[sh.doorX, Z - .1], [.2, -1.2], [bel.x1 + .9, -Z + 1.3]]];
  const group = new THREE.Group(); let tris = 0; for (const [k, gs] of B) { const g = mergeGeometries(gs, false); gs.forEach(x => x.dispose()); const m = new THREE.Mesh(g, M[k] || M.plaster); m.name = k; m.castShadow = !['flame', 'ember', 'glow', 'water'].includes(k); m.receiveShadow = true; group.add(m); tris += g.attributes.position.count / 3; }
  const all = new THREE.Group(); all.add(sh.group, group);
  return { group: all, shell: sh.group, room: group, tris: Math.round(tris), draws: group.children.length, shellTris: sh.tris, shellCalls: sh.draws, inner: { x0: -X, x1: X, z0: -Z, z1: Z }, floor: F0, ceil: CEIL, top: TOP,
    hearth: H, hood, flue, fire, anvil, trough, bench, bellows: bel, stall, arcade: { z0: d / 2, z1: AZ1 + .2 }, door: { x: sh.doorX, z: d / 2, w: 1.05, h: 2.0 }, paths, boxes, lamp, w, d };
}

// gatelandsApothecary(o, r) (Session 936, card F9; L5's interiors by nation, OG-043's Gatelands alchemy shop of herbs, potions and
//   draughts, OG-133's alchemist's room and its four steps; Michael's A on #303): the Gatelands cottage of GL_PLANS, painted green, with
//   a hanging sign of a mortar and pestle, as an apothecary's shop. The front door opens on the customers' side: the open hearth in the
//   plan's stack with a pot of decoctions on its crane, a settle against the back wall, and the counter across the room with its scales.
//   Behind the counter the four steps of the work, in order round the room: the worktable under a drying rack of herbs (prepare), the
//   stone mortar on its stump under the east front window (combine), the still at the east gable (heat and distil: a copper pot on a
//   plastered furnace whose flue goes into the gable's stack, its helm and arm down to a worm tub, a jug under the worm), and the
//   bottling bench along the back wall, a chest of small drawers under it and shelves of jars and bottles over it (bottle). A barrel of
//   spirit in the back corner. Through the hearth wall's door, the store: shelves of crocks, sacks and a barrel, herbs hung to dry, and
//   the apothecary's bed. Flagged floor in the shop, beaten earth in the store; the cottage's couples and purlins under the thatch.
//   -> { group, shell, room, tris, draws, inner, under(z), floor, hearth, fire, still {furnace, pot, helm, arm [a, b], tub, outlet, jug,
//        flue}, counter, table, mortar, bench, stations [{step, x, z, y}], door, doors, paths, boxes, lantern, glow, windows, w, d, eave }
let PM = null;
function apoMats() {
  if (PM) return PM; const F = forgeMats();
  PM = { ...F, copper: new THREE.MeshStandardMaterial({ color: 0xb4683a, roughness: .32, metalness: .85 }), green: new THREE.MeshStandardMaterial({ color: 0x3e7a52, roughness: .08, transparent: true, opacity: .72 }),
    herb: mat('thatch', { ns: .6, color: 0x6e7a3a, rough: 1 }), heath: mat('thatch', { ns: .6, color: 0x8a5a7e, rough: 1 }), rope: mat('thatch', { ns: .4, color: 0xa08a60, rough: 1 }) };
  return PM;
}
export function gatelandsApothecary(o = {}, r = stream('apothecary')) {
  const plan = GL_PLANS.cottage({ hip: false, paint: o.paint || 'green' }); plan.interior = true; plan.r = stream('apothecary-shell'); plan.sign = { x: .45, y: 2.1, device: 'mortar' };
  const shell = gatelandsBuilding(plan), M = apoMats(), B = new Map(), boxes = [], t = plan.t, h = plan.floors[0], X = plan.w / 2 - t, Z = plan.d / 2 - t, tp = Math.tan(SCALE.pitch.thatch * Math.PI / 180), F0 = 0;
  const under = z => h - .12 + (Z - Math.abs(z)) * tp - .1;
  // the room's materials, folded to 18 draws: one wood for the oak and the elm, one copper for the brass, one stone for
  // the mortar and the flags, the soot for the furnace's top and the tub's dark water, the earth for the turf, stoneware for the amber,
  // the heather's dyed wool for the blanket and the day book's cover
  const AL = { herb2: 'herb', brass: 'copper', wool: 'heath', elm: 'oak', rubble: 'flag', sootstone: 'soot', turf: 'earth', sack: 'rope', amber: 'crock', water: 'soot', delft: 'linen' };
  const put = (geo, key, x = 0, y = 0, z = 0, ry = 0, uv = .6, rx = 0, rz = 0) => { key = AL[key] || key; const g = geo.index ? geo.toNonIndexed() : geo; for (const k of Object.keys(g.attributes)) if (!['position', 'normal'].includes(k)) g.deleteAttribute(k);
    g.applyMatrix4(new THREE.Matrix4().compose(new THREE.Vector3(x, y, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(rx, ry, rz)), new THREE.Vector3(1, 1, 1))); worldUV(g, uv); if (!B.has(key)) B.set(key, []); B.get(key).push(g); return g; };
  const bx = (key, x0, x1, y0, y1, z0, z1, tag) => { put(new THREE.BoxGeometry(x1 - x0, y1 - y0, z1 - z0), key, (x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2); if (tag) boxes.push({ tag, x0, x1, y0, y1, z0, z1 }); };
  // a round pipe from a to b
  const pipe = (key, a, b, rad, seg = 8) => { const A = new THREE.Vector3(...a), D = new THREE.Vector3(...b).sub(A), g = new THREE.CylinderGeometry(rad, rad, D.length(), seg, 1, true);
    g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), D.clone().normalize())); g.translate(A.x + D.x / 2, A.y + D.y / 2, A.z + D.z / 2); put(g, key); };
  // a bundle of herbs hung by its stems from y: a cord, the tie, the heads spreading down
  const bundle = (x, y, z, key, L = .3) => { put(new THREE.CylinderGeometry(.004, .004, .06, 3), 'rope', x, y - .03, z); put(new THREE.ConeGeometry(.055 + r() * .02, L, 6), key, x, y - .06 - L / 2, z, r() * 3, .5, 0, 0); };
  // the floor: flags in the shop, laid in courses; beaten earth in the store beyond the hearth wall
  const HX = -1.7, HT = .6, bxx = HX + HT / 2;
  for (let z = -Z; z < Z - .05;) { const d = Math.min(Z - z, .55 + r() * .35); for (let x = bxx; x < X - .05;) { const w = Math.min(X - x, .6 + r() * .4); put(new THREE.BoxGeometry(w - .02, .06, d - .02), 'flag', x + w / 2, .03 + (r() - .5) * .006, z + d / 2, (r() - .5) * .01, .7); x += w; } z += d; }
  bx('earth', -X, HX - HT / 2, 0, .04, -Z, Z);
  // the hearth wall and the open hearth facing the shop, as the cottage's (Session 852): the breast, the lintel, the hearthstone, the turf fire
  const hw = 1.6, hh = 1.25, hz = .25, dB = { z: -1.45, w: .8, h: 1.95 }, BD = .55;
  crossWall(put, 'lime', HX, HT, -Z, Z, under, [{ z: dB.z, w: dB.w, y: 0, h: dB.h }]);
  { const bz0 = hz - hw / 2 - .35, bz1 = hz + hw / 2 + .35; /* the breast narrows up into the stack, so it stays under the thatch's slopes */ put(frustum([bxx, bxx + BD, bz0, bz1], hh, [bxx, bxx + BD, -.35, .35], under(0) - .4), 'lime', 0, 0, 0, 0, .42); bx('lime', bxx, bxx + BD, 0, hh, bz0, hz - hw / 2, 'breast'); bx('lime', bxx, bxx + BD, 0, hh, hz + hw / 2, bz1, 'breast');
    bx('soot', bxx, bxx + .02, 0, hh, hz - hw / 2, hz + hw / 2); bx('soot', bxx, bxx + BD, hh - .02, hh, hz - hw / 2, hz + hw / 2); bx('oak', bxx + BD - .3, bxx + BD + .08, hh, hh + .24, hz - hw / 2 - .25, hz + hw / 2 + .25); bx('flag', bxx + BD, bxx + BD + .8, 0, .07, hz - hw / 2, hz + hw / 2); }
  const fx = bxx + .25, fire = [fx + .05, .32, hz]; for (let i = 0; i < 7; i++) { const a = i / 7 * Math.PI * 2; put(new THREE.BoxGeometry(.24, .1, .12), 'turf', fx + Math.cos(a) * .15, .06 + (i % 2) * .08, hz + Math.sin(a) * .22, a + 1.3); }
  put(new THREE.SphereGeometry(.16, 10, 6).scale(1.2, .4, 1.4), 'ember', fx, .08, hz); for (let i = 0; i < 3; i++) put(new THREE.ConeGeometry(.06, .22 + i * .05, 7), 'flame', fx + (i - 1) * .04, .22, hz + (i - 1) * .09);
  // the crane and its pot of decoctions over the fire; a ladle and a row of jugs on the breast's ledge
  { const cx = bxx + .06, cz = hz - hw / 2 + .08; bx('iron', cx - .02, cx + .02, .2, 1.15, cz - .02, cz + .02); put(new THREE.BoxGeometry(.03, .03, .75), 'iron', cx + .02, 1.05, cz + .37); put(new THREE.CylinderGeometry(.008, .008, .4, 4), 'iron', cx + .02, .85, cz + .62);
    put(new THREE.SphereGeometry(.17, 14, 10, 0, Math.PI * 2, .35, Math.PI - .35), 'iron', cx + .2, .55, cz + .62); put(new THREE.CircleGeometry(.15, 14).rotateX(-Math.PI / 2), 'herb2', cx + .2, .65, cz + .62); put(new THREE.TorusGeometry(.13, .008, 4, 14, Math.PI).rotateY(Math.PI / 2), 'iron', cx + .2, .7, cz + .62); }
  for (let k = 0; k < 4; k++) put(new THREE.CylinderGeometry(.05, .06, .16 + (k % 2) * .05, 10), 'crock', bxx + BD - .12, hh + .32 + (k % 2) * .025, hz - .6 + k * .38);
  // the settle on the customers' side, against the back wall
  const settle = { x0: -.25, x1: .5, z0: -Z, z1: -Z + .45 }; bx('oak', settle.x0, settle.x1, .42, .46, settle.z0 + .05, settle.z1, 'settle'); bx('oak', settle.x0, settle.x1, 0, .42, settle.z1 - .05, settle.z1, 'settle'); bx('oak', settle.x0, settle.x1, .46, 1.15, settle.z0, settle.z0 + .05, 'settle');
  for (const x of [settle.x0, settle.x1 - .05]) bx('oak', x, x + .05, 0, .7, settle.z0, settle.z1, 'settle');
  // the counter across the shop: a panelled front, an oak top at 0.92 m, the way behind it at the window end (0.65 m); the scales, bottles,
  // the day book and a candle on it
  const counter = { x0: .6, x1: 1.15, z0: -.8, z1: 1.45, y: .92 }; { const { x0, x1, z0, z1, y } = counter; bx('paint', x0, x0 + .05, 0, y - .04, z0, z1, 'counter'); bx('paint', x0, x1, 0, y - .04, z0, z0 + .05, 'counter'); bx('paint', x0, x1, 0, y - .04, z1 - .05, z1, 'counter');
    bx('oak', x0 - .04, x1, y - .04, y, z0, z1); bx('deal', x0 + .05, x1, .35, .38, z0 + .05, z1 - .05); for (let z = z0 + .3; z < z1 - .2; z += .45) bx('oak', x0 - .01, x0 + .01, .1, y - .14, z - .02, z + .02);
    const sx = (x0 + x1) / 2, sz = .1; bx('oak', sx - .08, sx + .08, y, y + .03, sz - .08, sz + .08); bx('brass', sx - .01, sx + .01, y + .03, y + .38, sz - .01, sz + .01); bx('brass', sx - .008, sx + .008, y + .36, y + .38, sz - .2, sz + .2);
    for (const s of [-1, 1]) { put(new THREE.CylinderGeometry(.075, .05, .02, 14), 'brass', sx, y + .14 + (s > 0 ? .01 : 0), sz + s * .2); for (const a of [0, 2.1, 4.2]) pipe('brass', [sx + Math.cos(a) * .06, y + .15, sz + s * .2 + Math.sin(a) * .06], [sx, y + .37, sz + s * .2], .002, 3); }
    for (let k = 0; k < 4; k++) put(new THREE.CylinderGeometry(.03, .035, .14, 8), k % 2 ? 'green' : 'amber', sx + (k % 2) * .1 - .05, y + .07, .75 + Math.floor(k / 2) * .1);
    bx('wool', sx - .12, sx + .12, y, y + .05, -.55, -.25); bx('linen', sx - .11, sx + .11, y + .05, y + .052, -.54, -.4);
    put(new THREE.CylinderGeometry(.012, .014, .14, 8), 'linen', sx + .1, y + .07, 1.25); put(new THREE.SphereGeometry(.012, 6, 5).scale(1, 2, 1), 'flame', sx + .1, y + .155, 1.25); }
  // PREPARE: the worktable in the middle of the workroom, a chopping board and knife, herbs laid out, a sieve, a basket of roots;
  // over it a drying rack of two poles hung by cords from the roof, bundles hung from it (their heads 1.95 m or more over the floor)
  const table = { x0: 1.9, x1: 2.9, z0: -.45, z1: .65, y: .86 }; { const { x0, x1, z0, z1, y } = table; bx('deal', x0, x1, y - .05, y, z0, z1, 'table'); for (const x of [x0 + .05, x1 - .1]) for (const z of [z0 + .05, z1 - .1]) bx('oak', x, x + .05, 0, y - .05, z, z + .05, 'table');
    bx('oak', x0 + .05, x1 - .05, .12, .15, z0 + .05, z1 - .05); bx('oak', x0 + .1, x0 + .55, y, y + .03, z0 + .1, z0 + .4); bx('iron', x0 + .25, x0 + .45, y + .03, y + .035, z0 + .3, z0 + .33); bx('oak', x0 + .45, x0 + .55, y + .03, y + .045, z0 + .3, z0 + .33);
    for (let k = 0; k < 6; k++) put(new THREE.ConeGeometry(.04, .32, 5).rotateZ(Math.PI / 2), k % 3 === 2 ? 'heath' : 'herb', x0 + .55 + r() * .3, y + .04, z0 + .55 + k * .07, r() * .4 - .2);
    put(new THREE.CylinderGeometry(.16, .16, .07, 16, 1, true), 'deal', x1 - .25, y + .035, z0 + .25); put(new THREE.CircleGeometry(.15, 16).rotateX(-Math.PI / 2), 'iron', x1 - .25, y + .02, z0 + .25);
    put(new THREE.CylinderGeometry(.17, .13, .16, 12, 1, true), 'rope', x1 - .25, y + .08, z1 - .25); for (let k = 0; k < 5; k++) put(new THREE.DodecahedronGeometry(.04, 0), 'crock', x1 - .25 + (r() - .5) * .15, y + .12, z1 - .25 + (r() - .5) * .15, r() * 3); }
  const RACK = 2.35; { const x0 = 1.75, x1 = 3.05; for (const z of [-.2, .4]) { put(new THREE.CylinderGeometry(.02, .02, x1 - x0, 6).rotateZ(Math.PI / 2), 'oak', (x0 + x1) / 2, RACK, z);
      for (const x of [x0 + .05, x1 - .05]) pipe('rope', [x, RACK, z], [x, under(z) - .06, z], .006, 3);
      for (let x = x0 + .15; x < x1 - .1; x += .16 + r() * .05) bundle(x, RACK - .02, z, ['herb', 'herb2', 'heath'][Math.floor(r() * 3)], .2 + r() * .1); }
    for (const x of [x0 + .1, x1 - .1]) bx('oak', x - .02, x + .02, RACK - .02, RACK + .02, -.25, .45); }
  // COMBINE: the mortar on its stump under the east front window, the pestle in it, a bowl of seed beside it on the sill's ledge
  const mortar = { x: 3.15, z: Z - .5, y: .86 }; { const { x, z, y } = mortar; put(new THREE.CylinderGeometry(.2, .23, .58, 12), 'elm', x, .29, z); put(new THREE.CylinderGeometry(.17, .14, .28, 14, 1, true), 'rubble', x, y - .14, z, 0, .4);
    put(new THREE.CircleGeometry(.17, 14).rotateX(-Math.PI / 2), 'rubble', x, y, z); put(new THREE.CircleGeometry(.13, 14).rotateX(-Math.PI / 2), 'soot', x, y + .002, z); put(new THREE.CylinderGeometry(.028, .034, .38, 8), 'deal', x + .04, y + .12, z, 0, .6, .25, -.25);
    boxes.push({ tag: 'mortar', x0: x - .23, x1: x + .23, y0: 0, y1: y, z0: z - .23, z1: z + .23 }); }
  // HEAT AND DISTIL: the still at the east gable. A furnace of plastered stone (its fire door toward the room, glowing) carries the copper
  // pot; its flue rises against the gable into the stack. On the pot the helm, and from the helm the arm falls to the worm tub (the coil
  // inside, the water over it); the worm's end comes out low on the tub's side over a jug.
  const furnace = { x0: 3.4, x1: X, z0: -.45, z1: .45, y: .72 }, still = { furnace }; { const { x0, x1, z0, z1, y } = furnace; bx('lime', x0, x1, 0, y - .06, z0, z1, 'furnace'); bx('sootstone', x0, x1, y - .06, y, z0, z1);
    bx('soot', x0 - .005, x0 + .02, .12, .38, -.16, .16); bx('ember', x0 - .012, x0 + .02, .15, .32, -.12, .12); bx('iron', x0 - .02, x0, .1, .4, -.18, -.15); bx('iron', x0 - .02, x0, .1, .4, .15, .18); bx('iron', x0 - .02, x0, .38, .41, -.18, .18);
    still.flue = { x0: 3.95, x1: X, z0: -.22, z1: .22, y0: y, y1: h - .25 }; bx('lime', 3.95, X, y, h - .25, -.22, .22, 'flue'); bx('soot', 3.94, 3.95, y, y + .5, -.18, .18);
    const pot = still.pot = [3.66, y + .2, 0, .25]; put(new THREE.SphereGeometry(pot[3], 18, 12, 0, Math.PI * 2, 0, Math.PI * .78), 'copper', pot[0], pot[1], pot[2]); put(new THREE.CylinderGeometry(.08, .1, .1, 12, 1, true), 'copper', pot[0], pot[1] + .27, pot[2]);
    const helm = still.helm = [pot[0], pot[1] + .45, pot[2]]; put(new THREE.SphereGeometry(.15, 14, 8), 'copper', ...helm); put(new THREE.ConeGeometry(.06, .1, 10), 'copper', helm[0], helm[1] + .17, helm[2]);
    const tub = still.tub = { x: 3.75, z: 1.15, r: .3, y: .75 }, a0 = [helm[0], helm[1] + .02, helm[2] + .1], a1 = [tub.x, tub.y + .05, tub.z - .05]; still.arm = [a0, a1]; pipe('copper', a0, a1, .025, 10);
    put(new THREE.CylinderGeometry(tub.r, tub.r * .9, tub.y, 16, 1, true), 'oak', tub.x, tub.y / 2, tub.z); put(new THREE.CylinderGeometry(tub.r * .9, tub.r * .9, .03, 16), 'oak', tub.x, .02, tub.z);
    put(new THREE.CircleGeometry(tub.r - .02, 16).rotateX(-Math.PI / 2), 'water', tub.x, tub.y - .06, tub.z); for (const yy of [.12, tub.y - .1]) put(new THREE.TorusGeometry(tub.r + .005, .012, 4, 18).rotateX(Math.PI / 2), 'iron', tub.x, yy, tub.z);
    put(new THREE.TorusGeometry(.17, .02, 6, 18).rotateX(Math.PI / 2), 'copper', tub.x, tub.y - .02, tub.z); boxes.push({ tag: 'tub', x0: tub.x - tub.r, x1: tub.x + tub.r, y0: 0, y1: tub.y, z0: tub.z - tub.r, z1: tub.z + tub.r });
    const out = still.outlet = [tub.x - tub.r - .13, .3, tub.z]; pipe('copper', [tub.x - tub.r + .02, .32, tub.z], out, .015, 8); put(new THREE.CylinderGeometry(.006, .006, .08, 4), 'green', out[0], out[1] - .05, out[2]);
    const jug = still.jug = { x: out[0], z: out[2], y: .22 }; put(new THREE.CylinderGeometry(.07, .09, .22, 12), 'crock', jug.x, .11, jug.z); put(new THREE.TorusGeometry(.05, .012, 4, 10, Math.PI).rotateY(Math.PI / 2), 'crock', jug.x + .08, .15, jug.z);
    boxes.push({ tag: 'jug', x0: jug.x - .09, x1: jug.x + .09, y0: 0, y1: jug.y, z0: jug.z - .09, z1: jug.z + .09 }); }
  // BOTTLE: the bottling bench along the back wall under its window (the back's window is at x = 2.4 from inside): a chest of small
  // drawers under its top, a funnel, a jug, bottles filled and corked; two stacks of shelves of jars, crocks and bottles either side of
  // the window
  const bench = { x0: 1.4, x1: 3.35, z0: -Z, z1: -Z + .5, y: .9 }, win = { x0: 2.0, x1: 2.8 }; { const { x0, x1, z0, z1, y } = bench; bx('oak', x0, x1, 0, y - .04, z0, z1 - .02, 'bench'); bx('deal', x0 - .02, x1 + .02, y - .04, y, z0, z1);
    for (let row = 0; row < 4; row++) for (let c = 0; c < 6; c++) { const dx = (x1 - x0) / 6, dy = (y - .14) / 4, xx = x0 + dx * c, yy = .08 + dy * row; bx('paint', xx + .015, xx + dx - .015, yy + .015, yy + dy - .015, z1 - .02, z1); bx('brass', xx + dx / 2 - .012, xx + dx / 2 + .012, yy + dy / 2 - .012, yy + dy / 2 + .012, z1, z1 + .02); }
    put(new THREE.ConeGeometry(.08, .12, 12, 1, true).rotateX(Math.PI), 'copper', x0 + .5, y + .26, z0 + .3); put(new THREE.CylinderGeometry(.012, .012, .08, 6), 'copper', x0 + .5, y + .16, z0 + .3);
    put(new THREE.CylinderGeometry(.04, .045, .16, 10), 'green', x0 + .5, y + .08, z0 + .3); put(new THREE.CylinderGeometry(.08, .1, .26, 12), 'crock', x0 + .25, y + .13, z0 + .3);
    for (let k = 0; k < 7; k++) { const xx = x0 + 1.0 + k * .09; put(new THREE.CylinderGeometry(.032, .036, .15, 8), k % 3 === 1 ? 'amber' : 'green', xx, y + .075, z0 + .32); put(new THREE.CylinderGeometry(.012, .012, .03, 6), 'deal', xx, y + .17, z0 + .32); }
    for (const [s0, s1] of [[x0, win.x0 - .05], [win.x1 + .05, x1]]) { for (let s = 0; s < 3; s++) { const sy = 1.25 + s * .38; bx('deal', s0, s1, sy - .025, sy, z0, z0 + .28); for (let k = 0, xx = s0 + .06; xx < s1 - .12; k++) { const big = (k + s) % 4 === 0, rr = big ? .07 : .04, hh2 = big ? .2 : .14 + (k % 2) * .04;
          put(new THREE.CylinderGeometry(rr * .8, rr, hh2, big ? 12 : 8), big ? 'crock' : ['green', 'amber', 'green', 'delft'][(k + s) % 4], xx + rr, sy + hh2 / 2, z0 + .14); xx += rr * 2 + .03; } }
      for (const xx of [s0, s1 - .03]) bx('deal', xx, xx + .03, y, 2.05, z0, z0 + .28); boxes.push({ tag: 'shelves', x0: s0, x1: s1, y0: y, y1: 2.05, z0, z1: z0 + .28 }); } }
  // a barrel of spirit for the tinctures in the back corner, a tap and a cup on it
  { const x = 3.85, z = -Z + .38, rb = .3; put(new THREE.CylinderGeometry(rb * .9, rb * .9, .8, 16).scale(1, 1, 1), 'oak', x, .4, z); put(new THREE.SphereGeometry(rb, 16, 8).scale(1, 1.25, 1), 'oak', x, .4, z);
    for (const yy of [.12, .4, .68]) put(new THREE.TorusGeometry(rb * (yy === .4 ? 1.01 : .93), .012, 4, 18).rotateX(Math.PI / 2), 'iron', x, yy, z); bx('oak', x - rb - .06, x - rb + .02, .18, .22, z - .02, z + .02);
    boxes.push({ tag: 'barrel', x0: x - rb, x1: x + rb, y0: 0, y1: .8, z0: z - rb, z1: z + rb }); }
  // THE STORE beyond the hearth wall: shelves of crocks on the back wall, sacks and a barrel against the hearth wall, herbs hung to dry
  // from a pole along the room, the apothecary's bed against the west gable
  { const x0 = -X, x1 = -2.9, z0 = -Z, z1 = -Z + .38; for (const sy of [.05, .7, 1.35, 2.0]) bx('deal', x0, x1, sy, sy + .03, z0, z1); for (const xx of [x0, x1 - .04]) bx('deal', xx, xx + .04, 0, 2.03, z0, z1);
    boxes.push({ tag: 'store', x0, x1, y0: 0, y1: 2.03, z0, z1 }); for (const sy of [.08, .73, 1.38]) for (let xx = x0 + .15; xx < x1 - .12; xx += .26) put(new THREE.CylinderGeometry(.08, .1, .24 + r() * .1, 10), 'crock', xx, sy + .15, z0 + .19); }
  { const x0 = -2.65; for (const [sx, sy, sz] of [[-2.3, .27, .78], [-2.36, .27, 1.3], [-2.3, .7, 1.04]]) { put(new THREE.SphereGeometry(.2, 10, 8).scale(1, 1.3, .95), 'sack', sx, sy, sz, r()); put(new THREE.CylinderGeometry(.05, .08, .1, 8), 'sack', sx, sy + .28, sz); }
    boxes.push({ tag: 'sacks', x0, x1: HX - HT / 2, y0: 0, y1: .95, z0: .55, z1: 1.55 }); }
  { const Y = 2.38; put(new THREE.CylinderGeometry(.025, .025, 1.7, 6).rotateZ(Math.PI / 2), 'oak', -3.1, Y, -.45); for (const x of [-3.9, -2.3]) pipe('rope', [x, Y, -.45], [x, under(-.45) - .06, -.45], .006, 3);
    for (let x = -3.85; x < -2.35; x += .14 + r() * .05) bundle(x, Y - .02, -.45, ['herb', 'herb2', 'heath'][Math.floor(r() * 3)], .22 + r() * .1); }
  { const x0 = -X + .05, x1 = -X + .95, z0 = .05, z1 = 2.05; bx('oak', x0, x1, 0, .45, z0, z1, 'bed'); bx('wool', x0 + .05, x1 - .05, .45, .55, z0 + .05, z1 - .45); bx('linen', x0 + .05, x1 - .05, .45, .58, z1 - .42, z1 - .05); }
  // the roof's couples, collars and purlins as the cottage's; the lantern from the shop's collar, over the customers' side
  const p = SCALE.pitch.thatch * Math.PI / 180, L2 = Z / Math.cos(p);
  for (const x of [-3.0, .4, 3.6]) { for (const s of [-1, 1]) { const g = new THREE.BoxGeometry(.14, .2, L2 - .2); g.rotateX(s * p); put(g, 'oak', x, under(s * Z / 2) - .16, s * Z / 2); }
    /* the collar ends where its top meets the slopes' underside */ bx('oak', x - .07, x + .07, h + 1.35, h + 1.5, -Z + 1.74 / tp, Z - 1.74 / tp); }
  for (const f of [.35, .7]) for (const sz of [-1, 1]) { const zz = sz * Z * (1 - f); put(new THREE.BoxGeometry(plan.w - 2 * t, .12, .12), 'oak', 0, under(zz) - .2, zz); }
  const lantern = [.4, h + 1.0, 0]; bx('iron', .39, .41, h + .9, h + 1.36, -.01, .01); put(new THREE.CylinderGeometry(.07, .08, .2, 6), 'glow', ...lantern); put(new THREE.ConeGeometry(.09, .1, 6), 'iron', lantern[0], lantern[1] + .15, lantern[2]);
  // the shell's glass is clear from inside
  { const G = glMats().glass; shell.traverse(m => { if (m.isMesh && m.material === G) { m.material = mats().pane; m.name = 'pane'; } }); }
  const group = new THREE.Group(); let tris = 0; for (const [k, gs] of B) { const g = mergeGeometries(gs, false); gs.forEach(x => x.dispose()); const m = new THREE.Mesh(g, M[k]); m.name = k; m.castShadow = !['flame', 'ember', 'glow', 'green'].includes(k); m.receiveShadow = true; group.add(m); tris += g.attributes.position.count / 3; }
  const all = new THREE.Group(); all.add(shell, group); const door = plan.open.front[0], back = plan.open.back.find(q => q.kind === 'plank');
  const windows = Object.entries(plan.open).flatMap(([f, os]) => (os || []).filter(q => q.kind === 'win').map(q => ({ face: f, x: f === 'front' ? q.x : f === 'back' ? -q.x : 0, z: f === 'front' ? plan.d / 2 : f === 'back' ? -plan.d / 2 : 0, y: q.y, w: q.w, h: q.h })));
  const bk = -back.x /* the back face's x runs the other way */, stations = [{ step: 'prepare', x: (table.x0 + table.x1) / 2, z: table.z1 + .4, y: table.y }, { step: 'combine', x: mortar.x - .5, z: mortar.z - .15, y: mortar.y },
    { step: 'distil', x: furnace.x0 - .45, z: .85, y: furnace.y }, { step: 'bottle', x: 2.4, z: bench.z1 + .45, y: bench.y }];
  // the walks: the front door to the counter; the back door (on the customers' side, x = -1.2 from inside) to the counter; behind the
  // counter from its gap to the still, and on to the bottling bench; the hearth wall's door into the shop and into the store
  const paths = [[[door.x, Z - .2], [-.3, .9], [.3, .3]], [[bk, -Z + .2], [-.6, -1.0], [.3, .3]], [[1.3, Z - .25], [1.45, .9], [2.4, 1.1], [3.0, .85]], [[1.45, .9], [1.45, -1.0], [2.4, -1.15]], [[-1.3, dB.z], [-.5, -1.3], [-.5, -.5]], [[-2.2, dB.z], [-2.3, -1.45], [-2.6, -.3]]];
  return { group: all, shell, room: group, tris: Math.round(tris), draws: group.children.length, shellTris: shell.userData.tris, shellCalls: shell.userData.calls, inner: { x0: -X, x1: X, z0: -Z, z1: Z }, under, floor: F0,
    hearth: [bxx + BD, 0, hz], fire, win, still, counter, table, mortar, bench, settle, stations, rack: RACK, door: { x: door.x, z: plan.d / 2, w: door.w, h: door.h }, back: { x: bk, w: back.w, h: back.h },
    doors: [{ x: HX, z: dB.z, w: dB.w, h: dB.h }], paths, boxes, lantern, glow: [furnace.x0 - .1, .26, 0], windows, w: plan.w, d: plan.d, eave: h };
}

// markApothecary(o, r) (Session 937, card F9; L5's interiors by nation, OG-043's Mark alchemy shop in "a timber hall with carved posts",
//   OG-133's four steps; Michael's A on #303): the Mark's hall of pieces.js (shingle, 6.4 by 9 m, its smoke louver, o.interior) as a
//   healer's hall where draughts are made and sold. No counter: a trade board on trestles inside the door, a steelyard over it. The
//   hearth is low and long on the axis under the louver (a kerb of stones and an ash bed), with two fires: a cauldron on an iron tripod
//   at its front, and at its back the still, an iron pot under a wooden helm sealed with clay, its arm out through a hollowed log of
//   snow-water on trestles to a jug (the Mark's cold does the cooling). The four steps run round the hearth: the long table down the left
//   wall (prepare), the stamp mortar, a hollowed stump and a long pestle, between the table and the hearth (combine), the still (heat and
//   distil), the bench and shelves down the right wall of horn flasks, birch-bark boxes and soapstone jars (bottle). Herbs hang from the
//   tie beams; a chest and two casks by the door; the healer's bed of furs on a platform across the back. The longhouse's frame.
//   -> { group, shell, room, tris, draws, inner, under(x), floor, tieBeam, hearth, louver, fires, still {pot, helm, arm [a, b], trough,
//        outlet, jug}, cauldron, table, mortar, bench, board, stations, door, paths, boxes, lamp, windows, w, d }
export function markApothecary(o = {}, r = stream('markapo')) {
  const w = o.w ?? 6.4, d = o.d ?? 9, hall = markHall({ roof: 'shingle', w, d, porch: true, chimney: false, carve: true, wall: o.wall ?? 2, interior: true }, stream('markapo-shell'));
  const P = apoMats(), M = { ...longMats(), iron: P.iron, oak: P.oak, ember: P.ember, flame: P.flame, coal: P.coal, copper: P.copper, crock: P.crock, linen: P.linen, herb: P.herb, heath: P.heath, rope: P.rope,
    soap: mat('stone', { ns: .6, color: 0x4a4e48 }) /* soapstone, and the hearth's smoked kerb */, horn: new THREE.MeshStandardMaterial({ color: 0xc8b48a, roughness: .45 }) }, B = new Map(), boxes = [];
  // folded to 20 draws: the shell's planks for the board, the post's beam for the log, the horn for the birch bark
  const AL = { plank: 'board', log: 'post', bark: 'horn', snow: 'linen', elm: 'oak' };
  const put = (geo, key, x = 0, y = 0, z = 0, ry = 0, uv = .6, rx = 0, rz = 0) => { key = AL[key] || key; const g = geo.index ? geo.toNonIndexed() : geo; for (const k of Object.keys(g.attributes)) if (!['position', 'normal'].includes(k)) g.deleteAttribute(k);
    g.applyMatrix4(new THREE.Matrix4().compose(new THREE.Vector3(x, y, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(rx, ry, rz, 'YXZ')), new THREE.Vector3(1, 1, 1))); worldUV(g, uv);
    if (!B.has(key)) B.set(key, []); B.get(key).push(g); return g; };
  const bx = (key, x0, x1, y0, y1, z0, z1, tag) => { put(new THREE.BoxGeometry(x1 - x0, y1 - y0, z1 - z0), key, (x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2); if (tag) boxes.push({ tag, x0, x1, y0, y1, z0, z1 }); };
  const pipe = (key, a, b, rad, seg = 8) => { const A = new THREE.Vector3(...a), D = new THREE.Vector3(...b).sub(A), g = new THREE.CylinderGeometry(rad, rad, D.length(), seg, 1, true);
    g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), D.clone().normalize())); g.translate(A.x + D.x / 2, A.y + D.y / 2, A.z + D.z / 2); put(g, key); };
  const bundle = (x, y, z, key, L = .3) => { put(new THREE.CylinderGeometry(.004, .004, .06, 3), 'rope', x, y - .03, z); put(new THREE.ConeGeometry(.055 + r() * .02, L, 6), key, x, y - .06 - L / 2, z, r() * 3); };
  const X = w / 2 - .25, Z = d / 2 - .25, FY = hall.sill + .04, tp = Math.tan(hall.pitch), under = x => hall.ry0 + (w / 2 + hall.ov - Math.abs(x)) * tp - .02, WP = hall.sill + hall.wh;
  // the floor: planks on the footing (no forge here), a hearth of stones let into it
  for (let x = -X; x < X - .05;) { const dx = Math.min(X - x, .22 + r() * .08); bx('plank', x + .005, x + dx - .005, FY - .04, FY, -Z, Z); x += dx; }
  // the frame (the longhouse's): two rows of posts, purlins and tie beams; rafters and a board lining under the shingle
  const PXr = X - 1.0, TB = WP + .25, posts = [-Z + 1.15, .6];
  for (const sx of [-1, 1]) { for (const z of posts) bx('post', sx * PXr - .11, sx * PXr + .11, FY, TB, z - .11, z + .11, 'post'); bx('post', sx * PXr - .12, sx * PXr + .12, TB, TB + .24, -Z, Z); }
  for (const z of posts) bx('post', -PXr - .1, PXr + .1, TB, TB + .24, z - .1, z + .1);
  const XL = w / 2 - .02, rl = X / Math.cos(hall.pitch); for (const sx of [-1, 1]) { const xm = sx * X / 2, rz = -sx * hall.pitch;
    for (let z = -Z + .3; z < Z; z += 1.0) put(new THREE.BoxGeometry(rl, .14, .1), 'post', xm, under(xm) - .03 - .07 / Math.cos(hall.pitch), z, 0, .8, 0, rz);
    put(new THREE.BoxGeometry(XL / Math.cos(hall.pitch), .02, 2 * Z), 'board', sx * XL / 2, under(XL / 2) - .01, 0, 0, .8, 0, rz); }
  // the hearth under the louver: a kerb of stones round an ash bed, 0.2 m high, 1.1 by 1.7 m; two fires in it
  const lz = hall.louver ?? -1.35, H = { x0: -.55, x1: .55, z0: lz - .85, z1: lz + .85, y: FY + .2 }; bx('ash', H.x0 + .08, H.x1 - .08, FY, H.y - .06, H.z0 + .08, H.z1 - .08); boxes.push({ tag: 'hearth', ...H, y0: FY, y1: H.y });
  for (let k = 0; k < 22; k++) { const t = k / 22, per = 2 * (H.x1 - H.x0 + H.z1 - H.z0), s = t * per, wx = H.x1 - H.x0, wz = H.z1 - H.z0; let x, z;
    if (s < wx) { x = H.x0 + s; z = H.z0 + .07; } else if (s < wx + wz) { x = H.x1 - .07; z = H.z0 + s - wx; } else if (s < 2 * wx + wz) { x = H.x1 - (s - wx - wz); z = H.z1 - .07; } else { x = H.x0 + .07; z = H.z1 - (s - 2 * wx - wz); }
    const g = new THREE.IcosahedronGeometry(.09 + r() * .02, 1); g.scale(1.1, .9, 1); put(g, 'soap', Math.min(H.x1 - .09, Math.max(H.x0 + .09, x)), FY + .09, Math.min(H.z1 - .09, Math.max(H.z0 + .09, z)), r() * 3); }
  const fires = [[0, H.y - .02, lz + .4], [0, H.y - .02, lz - .45]]; for (const [fx, fy, fz] of fires) { for (let i = 0; i < 4; i++) { const g = new THREE.CylinderGeometry(.04, .045, .5, 6); g.rotateZ(Math.PI / 2); put(g, 'oak', fx, fy - .06 + (i % 2) * .05, fz, i * .8 + .4); }
    put(new THREE.SphereGeometry(.15, 10, 6).scale(1.1, .35, 1.1), 'ember', fx, fy - .07, fz); for (let i = 0; i < 3; i++) put(new THREE.ConeGeometry(.045, .14 + i * .05, 7), 'flame', fx + (i - 1) * .05, fy + .04, fz + (i - 1) * .04); }
  // HEAT: the cauldron on its tripod over the front fire, a ladle hung on a leg
  const cauldron = [0, FY + .62, lz + .4, .24]; { const [cx, cy, cz, cr] = cauldron, apex = [cx, FY + 1.35, cz]; for (let k = 0; k < 3; k++) { const a = k * 2.094 + .5; pipe('iron', [cx + Math.cos(a) * .48, FY, cz + Math.sin(a) * .42], apex, .016, 5); }
    bx('iron', cx - .006, cx + .006, cy + .18, apex[1], cz - .006, cz + .006); put(new THREE.SphereGeometry(cr, 16, 10, 0, Math.PI * 2, .4, Math.PI - .4), 'iron', cx, cy, cz); put(new THREE.CircleGeometry(cr * .9, 16).rotateX(-Math.PI / 2), 'herb', cx, cy + .07, cz);
    put(new THREE.TorusGeometry(cr * .8, .008, 4, 14, Math.PI).rotateY(Math.PI / 2), 'iron', cx, cy + .1, cz); }
  // DISTIL: the iron pot over the back fire on three stones, a wooden helm sealed to it with clay; the arm out to a hollowed log of
  // snow-water on two trestles, the pipe along the log and out of its end over a jug
  const still = {}; { const pot = still.pot = [0, FY + .4, lz - .45, .22]; for (let k = 0; k < 3; k++) { const a = k * 2.094; put(new THREE.DodecahedronGeometry(.07, 0), 'kerb', Math.cos(a) * .18, FY + .2, pot[2] + Math.sin(a) * .18, k); }
    put(new THREE.SphereGeometry(pot[3], 16, 10, 0, Math.PI * 2, .3, Math.PI - .3), 'iron', pot[0], pot[1], pot[2]); put(new THREE.TorusGeometry(.15, .03, 6, 16).rotateX(Math.PI / 2), 'crock', pot[0], pot[1] + .2, pot[2]);
    const helm = still.helm = [pot[0], pot[1] + .32, pot[2]]; put(new THREE.CylinderGeometry(.06, .16, .2, 12), 'oak', helm[0], helm[1] - .06, helm[2]); put(new THREE.CylinderGeometry(.03, .06, .1, 10), 'oak', helm[0], helm[1] + .09, helm[2]);
    const T = still.trough = { x0: .95, x1: 2.15, z: pot[2], r: .22, y: FY + .62 }; const a0 = [helm[0] + .1, helm[1], helm[2]], a1 = [T.x0 + .1, T.y - .06, T.z]; still.arm = [a0, a1]; pipe('copper', a0, a1, .022, 10);
    { const g = new THREE.CylinderGeometry(T.r, T.r, T.x1 - T.x0, 14, 1, false, 0, Math.PI); /* the half-pipe laid along x, open to the sky, its ends closed */ g.rotateZ(Math.PI / 2); g.rotateX(Math.PI); put(g, 'log', (T.x0 + T.x1) / 2, T.y, T.z); }
    bx('snow', T.x0 + .02, T.x1 - .02, T.y - .1, T.y - .04, T.z - T.r + .04, T.z + T.r - .04);
    for (let k = 0; k < 6; k++) put(new THREE.DodecahedronGeometry(.05 + r() * .03, 0), 'snow', T.x0 + .15 + k * .18, T.y - .04, T.z + (r() - .5) * .2, r() * 3);
    for (const tx of [T.x0 + .2, T.x1 - .2]) { for (const s of [-1, 1]) pipe('oak', [tx, FY, T.z + s * .25], [tx, T.y - T.r + .02, T.z], .03, 5); } boxes.push({ tag: 'trough', x0: T.x0, x1: T.x1, y0: FY, y1: T.y, z0: T.z - .27, z1: T.z + .27 });
    pipe('copper', [T.x1 - .02, T.y - .12, T.z], [T.x1 + .14, T.y - .2, T.z], .015, 8); const out = still.outlet = [T.x1 + .14, T.y - .2, T.z];
    const jug = still.jug = { x: out[0], z: out[2], y: FY + .24 }; put(new THREE.CylinderGeometry(.075, .09, .24, 12), 'soap', jug.x, FY + .12, jug.z); boxes.push({ tag: 'jug', x0: jug.x - .09, x1: jug.x + .09, y0: FY, y1: jug.y, z0: jug.z - .09, z1: jug.z + .09 }); }
  // PREPARE: the long table down the left wall, a chopping block and knife, herbs and roots laid out, a basket, a wooden bowl
  const table = { x0: -X, x1: -X + .7, z0: -.5, z1: 1.7, y: FY + .86 }; { const { x0, x1, z0, z1, y } = table; bx('oak', x0, x1, y - .06, y, z0, z1, 'table'); for (const z of [z0 + .1, z1 - .16]) { bx('oak', x0 + .05, x1 - .05, FY, y - .06, z, z + .06, 'table'); }
    bx('post', x0 + .15, x0 + .55, y, y + .06, z0 + .15, z0 + .5); bx('iron', x0 + .25, x0 + .45, y + .06, y + .065, z0 + .35, z0 + .37);
    for (let k = 0; k < 9; k++) put(new THREE.ConeGeometry(.04, .3, 5).rotateX(Math.PI / 2), k % 3 === 2 ? 'heath' : 'herb', x0 + .2 + r() * .3, y + .04, z0 + .7 + k * .09, r() * .4 - .2);
    put(new THREE.CylinderGeometry(.18, .14, .18, 12, 1, true), 'rope', (x0 + x1) / 2, y + .09, z1 - .3); for (let k = 0; k < 6; k++) put(new THREE.DodecahedronGeometry(.045, 0), 'crock', (x0 + x1) / 2 + (r() - .5) * .16, y + .14, z1 - .3 + (r() - .5) * .16, r() * 3);
    put(new THREE.SphereGeometry(.13, 12, 6, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), 'oak', (x0 + x1) / 2, y + .13, z1 - .75); }
  // COMBINE: the stamp mortar, a hollowed stump with a long pestle standing in it, between the table and the hearth
  const mortar = { x: -1.45, z: lz + .2, y: FY + .7 }; { const { x, z, y } = mortar; put(new THREE.CylinderGeometry(.24, .28, y - FY, 12), 'post', x, (y + FY) / 2, z); put(new THREE.CircleGeometry(.17, 12).rotateX(-Math.PI / 2), 'ash', x, y + .003, z);
    put(new THREE.CylinderGeometry(.035, .045, 1.25, 8), 'oak', x + .03, y + .5, z, 0, .6, .06, -.05); boxes.push({ tag: 'mortar', x0: x - .28, x1: x + .28, y0: FY, y1: y, z0: z - .28, z1: z + .28 }); }
  // BOTTLE: the bench down the right wall between the posts, a funnel and horn flasks on it; three shelves over it of horn flasks,
  // birch-bark boxes and soapstone jars
  const bench = { x0: X - .6, x1: X, z0: -.9, z1: 1.3, y: FY + .9 }; { const { x0, x1, z0, z1, y } = bench; bx('oak', x0, x1, y - .06, y, z0, z1, 'bench'); for (const z of [z0 + .05, z1 - .11]) bx('oak', x0 + .05, x1 - .05, FY, y - .06, z, z + .06, 'bench');
    put(new THREE.ConeGeometry(.08, .12, 12, 1, true).rotateX(Math.PI), 'horn', x0 + .3, y + .26, z0 + .4); put(new THREE.CylinderGeometry(.05, .06, .18, 10), 'soap', x0 + .3, y + .09, z0 + .4);
    for (let k = 0; k < 6; k++) { const g = new THREE.ConeGeometry(.035, .22, 8); g.rotateZ(Math.PI / 2 + .3); put(g, 'horn', x0 + .3, y + .04, z0 + .75 + k * .18, .2); }
    for (let s = 0; s < 3; s++) { const sy = FY + 1.25 + s * .4; bx('oak', X - .3, X, sy - .03, sy, z0, z1); for (let k = 0, zz = z0 + .08; zz < z1 - .1; k++) { const kind = (k + s) % 3;
        if (kind === 0) { put(new THREE.CylinderGeometry(.07, .07, .14, 10), 'horn', X - .15, sy + .07, zz + .07); put(new THREE.CylinderGeometry(.075, .075, .03, 10), 'oak', X - .15, sy + .15, zz + .07); zz += .17; }
        else if (kind === 1) { put(new THREE.CylinderGeometry(.06, .075, .18, 10), 'soap', X - .15, sy + .09, zz + .075); zz += .18; }
        else { const g = new THREE.ConeGeometry(.03, .2, 8); g.rotateX(Math.PI / 2); put(g, 'horn', X - .15, sy + .04, zz + .1, 0, .6); zz += .12; } } }
    for (const z of [z0, z1 - .04]) bx('oak', X - .3, X, y, FY + 2.1, z, z + .04); boxes.push({ tag: 'shelves', x0: X - .3, x1: X, y0: y, y1: FY + 2.1, z0, z1 }); }
  // TRADE: the board on trestles inside the door, right of the walk; a steelyard on a cord from the tie plate over it, wares on the board
  const board = { x0: 1.0, x1: 2.6, z0: 2.75, z1: 3.3, y: FY + .84 }; { const { x0, x1, z0, z1, y } = board; bx('board', x0, x1, y - .05, y, z0, z1, 'board'); for (const tx of [x0 + .15, x1 - .15]) { for (const s of [-1, 1]) pipe('oak', [tx + s * .2, FY, (z0 + z1) / 2], [tx, y - .05, (z0 + z1) / 2], .025, 5); }
    boxes.push({ tag: 'board', x0, x1, y0: FY, y1: y, z0, z1 }); const sx = x1 - .3, sz = (z0 + z1) / 2; pipe('rope', [sx, y + .9, sz], [PXr, TB, sz], .005, 3); pipe('iron', [sx - .35, y + .85, sz], [sx + .1, y + .9, sz], .01, 5);
    put(new THREE.CylinderGeometry(.06, .07, .08, 10), 'iron', sx + .1, y + .8, sz); pipe('rope', [sx - .3, y + .86, sz], [sx - .3, y + .45, sz], .003, 3); put(new THREE.CylinderGeometry(.11, .07, .04, 12), 'iron', sx - .3, y + .45, sz);
    for (let k = 0; k < 5; k++) { const g = new THREE.ConeGeometry(.035, .22, 8); g.rotateZ(Math.PI / 2); put(g, 'horn', x0 + .2 + k * .14, y + .04, z0 + .2); } for (let k = 0; k < 3; k++) { put(new THREE.CylinderGeometry(.07, .07, .13, 10), 'horn', x0 + .25 + k * .2, y + .065, z1 - .15); put(new THREE.CylinderGeometry(.075, .075, .025, 10), 'oak', x0 + .25 + k * .2, y + .14, z1 - .15); }
    for (let k = 0; k < 3; k++) put(new THREE.ConeGeometry(.04, .3, 5).rotateZ(Math.PI / 2), 'herb', x1 - .7 + k * .05, y + .04, z1 - .2 - k * .05, .3 * k); }
  // a chest and two casks by the door on the left; the healer's bed of furs on a platform across the back, a cask at its foot
  bx('oak', -X, -X + .55, FY, FY + .5, 2.5, 3.4, 'chest'); bx('iron', -X + .55, -X + .57, FY + .35, FY + .4, 2.6, 3.3);
  for (const [cx, cz] of [[-X + .35, 3.75], [-X + 1.0, 3.75]]) { put(new THREE.CylinderGeometry(.26, .26, .7, 14), 'oak', cx, FY + .35, cz); put(new THREE.SphereGeometry(.28, 14, 8).scale(1, 1.2, 1), 'oak', cx, FY + .35, cz); for (const yy of [.12, .58]) put(new THREE.TorusGeometry(.265, .012, 4, 16).rotateX(Math.PI / 2), 'iron', cx, FY + yy, cz);
    boxes.push({ tag: 'cask', x0: cx - .28, x1: cx + .28, y0: FY, y1: FY + .7, z0: cz - .28, z1: cz + .28 }); }
  const bed = { x0: -X, x1: -.5, z0: -Z, z1: -Z + .85 }; { const { x0, x1, z0, z1 } = bed; bx('board', x0, x1, FY, FY + .4, z0, z1, 'bed'); bx('fur', x0 + .05, x1 - .05, FY + .4, FY + .5, z0 + .05, z1 - .05); bx('furPale', x0 + .3, x0 + 1.4, FY + .5, FY + .56, z0 + .1, z1 - .1); bx('furGrey', x0 + .05, x0 + .5, FY + .5, FY + .62, z0 + .1, z1 - .1); }
  { const cx = X - .4, cz = -Z + .45; put(new THREE.CylinderGeometry(.3, .3, .8, 14), 'oak', cx, FY + .4, cz); put(new THREE.SphereGeometry(.32, 14, 8).scale(1, 1.25, 1), 'oak', cx, FY + .4, cz); for (const yy of [.12, .68]) put(new THREE.TorusGeometry(.305, .012, 4, 16).rotateX(Math.PI / 2), 'iron', cx, FY + yy, cz);
    boxes.push({ tag: 'cask2', x0: cx - .32, x1: cx + .32, y0: FY, y1: FY + .8, z0: cz - .32, z1: cz + .32 }); }
  // herbs hung to dry from both tie beams and from the left purlin over the table
  for (const z of posts) for (let x = -PXr + .25; x < PXr - .2; x += .17 + r() * .06) bundle(x, TB, z + (r() > .5 ? .06 : -.06), ['herb', 'heath', 'herb'][Math.floor(r() * 3)], .22 + r() * .12);
  for (let z = -.3; z < 1.7; z += .16 + r() * .05) bundle(-PXr - .05, TB, z, r() > .4 ? 'herb' : 'heath', .25 + r() * .1);
  // the lamp: an iron bowl on a chain from the front tie beam
  const lamp = [-1.0, TB - .6, posts[1]]; bx('iron', lamp[0] - .005, lamp[0] + .005, lamp[1] + .05, TB, lamp[2] - .005, lamp[2] + .005);
  put(new THREE.SphereGeometry(.09, 10, 6, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), 'iron', ...lamp); put(new THREE.SphereGeometry(.02, 6, 5).scale(1, 2, 1), 'flame', lamp[0] + .05, lamp[1] + .03, lamp[2]);
  // the front door, hung open against the front wall, left of the doorway
  { const leaf = { x0: -hall.door.w / 2 - .07, x1: -hall.door.w / 2 - .01, z0: Z - hall.door.w - .01, z1: Z - .01 }; bx('board', leaf.x0, leaf.x1, FY, FY + hall.door.h - .12, leaf.z0, leaf.z1, 'door');
    for (const y of [.5, 1.5]) bx('iron', leaf.x0 - .02, leaf.x0, FY + y - .03, FY + y + .03, leaf.z0 + .1, leaf.z1 - .05); }
  const stations = [{ step: 'prepare', x: table.x1 + .45, z: 1.2, y: table.y }, { step: 'combine', x: mortar.x + .1, z: mortar.z + .55, y: mortar.y }, { step: 'distil', x: 1.2, z: still.trough.z + .65, y: still.trough.y }, { step: 'bottle', x: bench.x0 - .45, z: .2, y: bench.y }];
  // the walks: in at the door to the trade board's front; behind the board to the hearth; down the left aisle to the table and the
  // mortar; down the right aisle to the bench and the still's jug; round the hearth's back to the bed
  const paths = [[[0, Z - .1], [.4, 3.75], [1.8, 3.75]], [[0, Z - .1], [0, 2.3], [1.8, 2.3]], [[0, Z - .1], [0, 2.3], [-1.6, 1.6], [-1.6, -.5]], [[0, 2.3], [1.3, 1.6], [1.3, -.9]], [[0, 2.3], [-.9, .1], [-.9, -2.6], [.5, -3.0]]];
  const group = new THREE.Group(); let tris = 0; for (const [k, gs] of B) { const g = mergeGeometries(gs, false); gs.forEach(x => x.dispose()); const m = new THREE.Mesh(g, M[k]); m.name = k; m.castShadow = !['flame', 'ember'].includes(k); m.receiveShadow = true; group.add(m); tris += g.attributes.position.count / 3; }
  const all = new THREE.Group(); all.add(hall.group, group);
  return { group: all, shell: hall.group, room: group, tris: Math.round(tris), draws: group.children.length, shellTris: hall.tris, shellCalls: hall.draws, inner: { x0: -X, x1: X, z0: -Z, z1: Z }, under, floor: FY, tieBeam: TB,
    hearth: H, louver: lz, fires, fire: fires[0], still, cauldron, table, mortar, bench, board, bed, stations, door: { x: 0, z: d / 2, w: hall.door.w, h: hall.door.h }, paths, boxes, lamp, windows: hall.windows, w, d };
}

// aurenneApothecary(o, r) (Session 938, card F9; L5's interiors by nation, OG-043's Aurennais alchemy shop of glassware and tilework,
//   OG-114's ceramics and glass, OG-133's four steps; Michael's A on #303): the Roman house of pieces.js with its arcade (one storey, 7.2
//   by 6.0 m), as the smithy (931), as an apothecary of glass and glazed jars. A tiled counter across the shop, the brass scales on its
//   marble top, a tiled bench for those who wait by the front wall; behind it the back wall of glazed jars (albarelli) in blue and white.
//   The four steps behind the counter: the worktable in the middle (prepare), a bronze mortar on a block of limestone (combine), the
//   alembic of glass on a tiled furnace in the back corner (heat and distil), its hood and flue up through the roof as the smithy's, its
//   beak down to a glass receiver on a stand, and the bench of phials down the right wall (bottle). Under the arcade, a stall of jars and
//   herbs to the street. Cedar joists under the ceiling, a brass lamp.
//   -> { group, shell, room, tris, draws, inner, floor, ceil, top, furnace, flue, hood, still {cucurbit, head, beak [a, b], receiver},
//        counter, table, mortar, bench, shelves, stall, arcade, stations, door, paths, boxes, lamp, w, d }
export function aurenneApothecary(o = {}, r = stream('aurapo')) {
  const w = 7.2, d = 6.0, sh = aurenneHouse({ kind: 'tile', w, d, two: false, arcade: true, wall: o.wall ?? 2, door: 1, pointed: false, interior: true }, stream(o.shell || 'aurapo-shell'));
  const P = apoMats(), M = { ...homeMats(), sootPlaster: new THREE.MeshStandardMaterial({ color: 0x3e3834, roughness: .95 }), coal: P.coal, ember: P.ember, green: P.green, herb: P.herb, heath: P.heath, rope: P.rope,
    glass: new THREE.MeshStandardMaterial({ color: 0xdfeee8, roughness: .04, transparent: true, opacity: .38, depthWrite: false }), bronze: new THREE.MeshStandardMaterial({ color: 0x8a6a3a, roughness: .35, metalness: .8 }) }, B = new Map(), boxes = [], stall = [];
  // folded under the budget: one bronze for the brass and the copper, the herb's green for the weld, one cedar, the linen for the glaze's white
  const AL = { brass: 'bronze', copper: 'bronze', weld: 'herb', crock: 'terra', delft: 'linen', cedarD: 'cedar' };
  const put = (geo, key, x = 0, y = 0, z = 0, ry = 0, uv = .6, rx = 0, rz = 0) => { key = AL[key] || key; const g = geo.index ? geo.toNonIndexed() : geo; for (const k of Object.keys(g.attributes)) if (!['position', 'normal'].includes(k)) g.deleteAttribute(k);
    g.applyMatrix4(new THREE.Matrix4().compose(new THREE.Vector3(x, y, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(rx, ry, rz, 'YXZ')), new THREE.Vector3(1, 1, 1))); worldUV(g, uv);
    if (!B.has(key)) B.set(key, []); B.get(key).push(g); return g; };
  const UVK = { zellige: 1.47 }, bx = (key, x0, x1, y0, y1, z0, z1, tag, list = boxes) => { put(new THREE.BoxGeometry(x1 - x0, y1 - y0, z1 - z0), key, (x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2, 0, UVK[key] ?? .6); if (tag) list.push({ tag, x0, x1, y0, y1, z0, z1 }); };
  const pipe = (key, a, b, rad, seg = 8) => { const A = new THREE.Vector3(...a), D = new THREE.Vector3(...b).sub(A), g = new THREE.CylinderGeometry(rad, rad, D.length(), seg, 1, true);
    g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), D.clone().normalize())); g.translate(A.x + D.x / 2, A.y + D.y / 2, A.z + D.z / 2); put(g, key); };
  // an albarello: a waisted jar of blue-and-white glaze with a cover of parchment tied over its mouth
  const jar = (x, y, z, h, rr) => { put(new THREE.CylinderGeometry(rr, rr * .92, h, 12, 1, true), 'zellige', x, y + h / 2, z); put(new THREE.CylinderGeometry(rr * .86, rr * .86, h * .5, 12, 1, true), 'blue', x, y + h / 2, z);
    put(new THREE.CylinderGeometry(rr * .75, rr, .02, 12), 'delft', x, y + h, z); put(new THREE.CylinderGeometry(rr * .78, rr * .78, .03, 12), 'linen', x, y + h + .025, z); };
  const X = w / 2 - sh.T, Z = d / 2 - sh.T, F0 = sh.yW + .02, TOP = sh.top, CEIL = TOP - .2;
  // the floor: limestone flags; the ceiling: cedar joists every 0.6 m under the stone, stopping at the flue
  bx('limestone', -X, X, sh.yW, F0, -Z, Z);
  const flue = { x0: X - .55, x1: X - .02, z0: -Z + .02, z1: -Z + .55 }; for (let x = -X + .3; x < X - .1; x += .6) { const z0 = x > flue.x0 - .1 ? flue.z1 + .05 : -Z; bx('cedar', x - .06, x + .06, CEIL, TOP, z0, Z); }
  // the counter across the shop from the left wall, its way behind at the right end: a front of blue tile, a marble top at 0.95 m
  const counter = { x0: -X, x1: 1.6, z0: .25, z1: .85, y: F0 + .95 }; { const { x0, x1, z0, z1, y } = counter; bx('plaster', x0, x1, F0, y - .05, z0, z1, 'counter'); bx('zellige', x0 + .02, x1, F0 + .15, y - .2, z1, z1 + .015); bx('zellige', x1, x1 + .015, F0 + .15, y - .2, z0, z1);
    bx('limestone', x0, x1 + .04, y - .05, y, z0 - .03, z1 + .04);
    /* the scales: a post, a beam and two pans; brass weights in a box; a row of phials and a basket of dried rose */ const sx = -.4, sz = (z0 + z1) / 2; bx('cedar', sx - .1, sx + .1, y, y + .03, sz - .08, sz + .08); bx('brass', sx - .01, sx + .01, y + .03, y + .42, sz - .01, sz + .01); bx('brass', sx - .25, sx + .25, y + .4, y + .42, sz - .008, sz + .008);
    for (const s of [-1, 1]) { put(new THREE.CylinderGeometry(.08, .05, .02, 14), 'brass', sx + s * .24, y + .16, sz); for (const a of [0, 2.1, 4.2]) pipe('brass', [sx + s * .24 + Math.cos(a) * .065, y + .17, sz + Math.sin(a) * .065], [sx + s * .24, y + .41, sz], .002, 3); }
    bx('cedar', sx + .4, sx + .62, y, y + .05, sz - .1, sz + .1); for (let k = 0; k < 4; k++) put(new THREE.CylinderGeometry(.015 + k * .006, .015 + k * .006, .02 + k * .01, 8), 'brass', sx + .43 + k * .05, y + .06 + k * .005, sz);
    for (let k = 0; k < 5; k++) { put(new THREE.CylinderGeometry(.025, .03, .12, 8), k % 2 ? 'green' : 'glass', -2.2 + k * .1, y + .06, sz + .1); put(new THREE.CylinderGeometry(.008, .008, .05, 6), 'glass', -2.2 + k * .1, y + .145, sz + .1); }
    put(new THREE.CylinderGeometry(.16, .12, .12, 12, 1, true), 'rope', .8, y + .06, sz); for (let k = 0; k < 7; k++) put(new THREE.DodecahedronGeometry(.035, 0), 'madder', .8 + (r() - .5) * .18, y + .1, sz + (r() - .5) * .18, r() * 3); }
  // the bench by the front wall left of the door for those who wait: plastered, its riser tiled
  bx('plaster', -X, -1.0, F0, F0 + .45, Z - .42, Z, 'mastaba'); bx('zellige', -X, -1.0, F0 + .05, F0 + .4, Z - .435, Z - .42); bx('rug', -X + .1, -1.1, F0 + .45, F0 + .47, Z - .4, Z - .02);
  // the back wall of glazed jars, left of the back window: five shelves of cedar from the floor to 2.5 m, albarelli large below and small above
  const shelves = { x0: -X, x1: -.45, z0: -Z, z1: -Z + .36 } /* clear of the back window at x = 0 */; { const { x0, x1, z0, z1 } = shelves; for (let s = 0; s < 5; s++) { const sy = F0 + .1 + s * .5; bx('cedar', x0, x1, sy - .03, sy, z0, z1); const big = s < 2, rr = big ? .09 : .065, hh = big ? .3 : .22;
      for (let xx = x0 + .12; xx < x1 - .1; xx += rr * 2 + .05) jar(xx + rr * .5, sy, (z0 + z1) / 2, hh * (.9 + r() * .15), rr); }
    for (const xx of [x0, x1 - .04, (x0 + x1) / 2]) bx('cedar', xx, xx + .04, F0, F0 + 2.45, z0, z1); bx('cedar', x0, x1, F0 + 2.42, F0 + 2.48, z0, z1 + .04); boxes.push({ tag: 'shelves', x0, x1, y0: F0, y1: F0 + 2.48, z0, z1 }); }
  // PREPARE: the worktable in the middle, a board and knife, roots and petals laid out, a sieve of brass, a glass flask
  const table = { x0: -.6, x1: 1.0, z0: -1.6, z1: -.8, y: F0 + .86 }; { const { x0, x1, z0, z1, y } = table; bx('cedar', x0, x1, y - .05, y, z0, z1, 'table'); for (const xx of [x0 + .05, x1 - .1]) for (const zz of [z0 + .05, z1 - .1]) bx('cedar', xx, xx + .05, F0, y - .05, zz, zz + .05, 'table');
    bx('cedarD', x0 + .1, x0 + .55, y, y + .03, z0 + .15, z0 + .45); bx('iron', x0 + .2, x0 + .4, y + .03, y + .035, z0 + .3, z0 + .32);
    for (let k = 0; k < 7; k++) put(new THREE.ConeGeometry(.035, .26, 5).rotateZ(Math.PI / 2), k % 3 === 0 ? 'heath' : 'herb', x0 + .75 + r() * .25, y + .035, z0 + .12 + k * .085, r() * .4 - .2);
    for (let k = 0; k < 12; k++) put(new THREE.CircleGeometry(.02, 6).rotateX(-Math.PI / 2), k % 2 ? 'madder' : 'saffron', x0 + .2 + r() * .35, y + .004, z1 - .15 - r() * .2);
    put(new THREE.CylinderGeometry(.15, .15, .05, 16, 1, true), 'brass', x1 - .25, y + .025, z1 - .22); put(new THREE.SphereGeometry(.08, 12, 8), 'glass', x1 - .22, y + .08, z0 + .25); put(new THREE.CylinderGeometry(.02, .02, .14, 8, 1, true), 'glass', x1 - .22, y + .2, z0 + .25); }
  // COMBINE: the bronze mortar on a block of limestone behind the counter's left end, its pestle in it
  const mortar = { x: -1.6, z: -.4, y: F0 + .82 }; { const { x, z, y } = mortar; bx('limestone', x - .25, x + .25, F0, y - .22, z - .25, z + .25); put(new THREE.CylinderGeometry(.16, .13, .22, 16, 1, true), 'bronze', x, y - .11, z);
    put(new THREE.CircleGeometry(.16, 16).rotateX(-Math.PI / 2), 'sootPlaster', x, y - .02, z); put(new THREE.TorusGeometry(.16, .015, 6, 16).rotateX(Math.PI / 2), 'bronze', x, y, z); put(new THREE.CylinderGeometry(.025, .03, .34, 8), 'bronze', x + .04, y + .08, z, 0, .6, .3, -.3);
    boxes.push({ tag: 'mortar', x0: x - .25, x1: x + .25, y0: F0, y1: y, z0: z - .25, z1: z + .25 }); }
  // DISTIL: the furnace in the back right corner, plastered, its front tiled, a fire door glowing; on it the cucurbit of glass, the head over
  // it, the beak down to the receiver on a stand; the hood over all into the flue, the flue up through the ceiling and the roof
  const furnace = { x0: X - 1.05, x1: X, z0: -Z, z1: -Z + .95, y: F0 + .8 }, still = {}; { const { x0, x1, z0, z1, y } = furnace; bx('plaster', x0, x1, F0, y - .04, z0, z1, 'furnace'); bx('limestone', x0 - .02, x1, y - .04, y, z0, z1 + .02);
    bx('zellige', x0, x1, F0 + .45, y - .06, z1, z1 + .015); bx('sootPlaster', (x0 + x1) / 2 - .14, (x0 + x1) / 2 + .14, F0 + .1, F0 + .38, z1, z1 + .005); bx('ember', (x0 + x1) / 2 - .1, (x0 + x1) / 2 + .1, F0 + .12, F0 + .32, z1 + .005, z1 + .01);
    bx('iron', (x0 + x1) / 2 - .16, (x0 + x1) / 2 + .16, F0 + .38, F0 + .41, z1, z1 + .02);
    const cu = still.cucurbit = [X - .6, y + .18, -Z + .5, .19]; put(new THREE.SphereGeometry(cu[3], 16, 12), 'glass', cu[0], cu[1], cu[2]); put(new THREE.SphereGeometry(cu[3] * .9, 14, 8, 0, Math.PI * 2, Math.PI * .55, Math.PI * .45), 'madder', cu[0], cu[1], cu[2]);
    put(new THREE.TorusGeometry(.2, .03, 6, 18).rotateX(Math.PI / 2), 'terra', cu[0], y + .02, cu[2]); put(new THREE.CylinderGeometry(.06, .06, .12, 12, 1, true), 'glass', cu[0], cu[1] + .22, cu[2]);
    const hd = still.head = [cu[0], cu[1] + .38, cu[2]]; put(new THREE.SphereGeometry(.13, 14, 10, 0, Math.PI * 2, 0, Math.PI * .6), 'glass', hd[0], hd[1] - .04, hd[2]); put(new THREE.TorusGeometry(.1, .015, 6, 14).rotateX(Math.PI / 2), 'glass', hd[0], hd[1] - .1, hd[2]);
    const rc = still.receiver = { x: 1.85, z: -Z + .5, y: F0 + .72, r: .12 }; const b0 = [hd[0] - .1, hd[1] - .08, hd[2]], b1 = [rc.x + .04, rc.y + rc.r * 2 + .04, rc.z]; still.beak = [b0, b1]; pipe('glass', b0, b1, .014, 8);
    bx('cedar', rc.x - .14, rc.x + .14, rc.y - .03, rc.y, rc.z - .14, rc.z + .14, 'stand'); for (const [a, b] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) bx('cedar', rc.x + a * .11 - .02, rc.x + a * .11 + .02, F0, rc.y - .03, rc.z + b * .11 - .02, rc.z + b * .11 + .02, 'stand');
    put(new THREE.SphereGeometry(rc.r, 14, 10), 'glass', rc.x, rc.y + rc.r, rc.z); put(new THREE.SphereGeometry(rc.r * .9, 12, 6, 0, Math.PI * 2, Math.PI * .7, Math.PI * .3), 'green', rc.x, rc.y + rc.r, rc.z); put(new THREE.CylinderGeometry(.03, .04, .1, 8, 1, true), 'glass', rc.x, rc.y + rc.r * 2 + .03, rc.z); }
  const hood = { y0: F0 + 1.9, y1: CEIL }; put(frustum([furnace.x0, furnace.x1, furnace.z0, furnace.z1], hood.y0, [flue.x0, flue.x1, flue.z0, flue.z1], hood.y1), 'plaster', 0, 0, 0, 0, .5);
  bx('zellige', furnace.x0, furnace.x1, hood.y0 - .12, hood.y0, furnace.z1 - .015, furnace.z1); bx('zellige', furnace.x0 - .015, furnace.x0, hood.y0 - .12, hood.y0, furnace.z0, furnace.z1);
  const over = .45, roofAt = (x, z) => TOP + .16 + Math.tan(22 * Math.PI / 180) * Math.min(w / 2 + over - Math.abs(x), d / 2 + over - Math.abs(z)); flue.roof = roofAt(flue.x1, flue.z0); flue.y1 = flue.roof + .7;
  { const g = new THREE.BoxGeometry(flue.x1 - flue.x0, flue.y1 - CEIL, flue.z1 - flue.z0); g.translate((flue.x0 + flue.x1) / 2, (CEIL + flue.y1) / 2, (flue.z0 + flue.z1) / 2); put(g, 'flue', 0, 0, 0, 0, .5);
    const c = new THREE.BoxGeometry(flue.x1 - flue.x0 + .2, .06, flue.z1 - flue.z0 + .2); c.translate((flue.x0 + flue.x1) / 2, flue.y1 + .22, (flue.z0 + flue.z1) / 2); put(c, 'terra', 0, 0, 0);
    for (const [a, b] of [[flue.x0 + .05, flue.z0 + .05], [flue.x1 - .05, flue.z0 + .05], [flue.x0 + .05, flue.z1 - .05], [flue.x1 - .05, flue.z1 - .05]]) put(new THREE.BoxGeometry(.06, .2, .06), 'flue', a, flue.y1 + .1, b); }
  // BOTTLE: the bench of phials down the right wall: a rack of stoppered phials, a funnel in a flask, corks in a bowl; a shelf over it
  const bench = { x0: X - .58, x1: X, z0: -.55, z1: 1.3, y: F0 + .9 }; { const { x0, x1, z0, z1, y } = bench; bx('cedar', x0, x1, y - .05, y, z0, z1, 'bench'); for (const zz of [z0 + .05, z1 - .1]) bx('cedar', x0 + .05, x1 - .05, F0, y - .05, zz, zz + .05, 'bench');
    bx('cedarD', x0 + .1, x1 - .05, y, y + .08, z0 + .2, z0 + .75); for (let k = 0; k < 12; k++) { const px = x0 + .18 + (k % 3) * .12, pz = z0 + .28 + Math.floor(k / 3) * .13; put(new THREE.CylinderGeometry(.022, .025, .16, 8), k % 4 === 1 ? 'green' : 'glass', px, y + .1, pz); put(new THREE.CylinderGeometry(.012, .012, .03, 6), 'cedar', px, y + .195, pz); }
    put(new THREE.SphereGeometry(.09, 12, 8), 'glass', x0 + .25, y + .09, z0 + 1.1); put(new THREE.ConeGeometry(.07, .1, 12, 1, true).rotateX(Math.PI), 'brass', x0 + .25, y + .25, z0 + 1.1); put(new THREE.CylinderGeometry(.008, .008, .08, 6), 'brass', x0 + .25, y + .17, z0 + 1.1);
    put(new THREE.SphereGeometry(.09, 12, 6, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), 'terra', x0 + .25, y + .09, z1 - .3); for (let k = 0; k < 6; k++) put(new THREE.CylinderGeometry(.012, .014, .03, 6), 'cedar', x0 + .25 + (r() - .5) * .1, y + .05, z1 - .3 + (r() - .5) * .1, 0, .6, r(), 0);
    /* the shelf starts beyond the side wall's window at z = 0 */ const sy = F0 + 1.55, s0 = .45; bx('cedar', X - .28, X, sy - .03, sy, s0, z1); for (let zz = s0 + .1; zz < z1 - .1; zz += .17) jar(X - .14, sy, zz, .2, .06); boxes.push({ tag: 'shelf', x0: X - .28, x1: X, y0: sy - .03, y1: sy + .26, z0: s0, z1 }); }
  // the brass lamp from the joists over the customers' side
  const lamp = [-1.2, CEIL - .7, 1.6]; bx('brass', lamp[0] - .005, lamp[0] + .005, lamp[1] + .1, CEIL, lamp[2] - .005, lamp[2] + .005); put(new THREE.SphereGeometry(.08, 10, 6, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), 'brass', ...lamp); put(new THREE.SphereGeometry(.018, 6, 5).scale(1, 2, 1), 'flame', lamp[0] + .05, lamp[1] + .03, lamp[2]);
  // under the arcade, left of the door's walk: a stall of albarelli, baskets of herbs and petals, a rack of phials
  const AZ0 = d / 2 + .05, AZ1 = d / 2 + 1.55, YA = sh.yW; { const x0 = -2.9, x1 = -.9, z0 = AZ0 + .15, z1 = AZ0 + .75, y = YA + .85; bx('cedar', x0, x1, y - .06, y, z0, z1, 'table', stall); for (const xx of [x0 + .05, x1 - .11]) for (const zz of [z0 + .04, z1 - .1]) bx('cedar', xx, xx + .06, YA, y - .06, zz, zz + .06);
    for (let k = 0; k < 3; k++) jar(x0 + .2 + k * .22, y, z0 + .2, .24, .075);
    for (let k = 0; k < 3; k++) { const cx = x0 + .95 + k * .32, cz = (z0 + z1) / 2; put(new THREE.CylinderGeometry(.13, .1, .12, 12, 1, true), 'rope', cx, y + .06, cz); put(new THREE.CircleGeometry(.12, 12).rotateX(-Math.PI / 2), ['madder', 'saffron', 'heath'][k], cx, y + .1, cz); }
    for (let k = 0; k < 4; k++) put(new THREE.CylinderGeometry(.022, .025, .14, 8), k % 2 ? 'green' : 'glass', x1 - .35 + k * .07, y + .07, z1 - .15); }
  const stations = [{ step: 'prepare', x: (table.x0 + table.x1) / 2, z: table.z1 + .4, y: table.y }, { step: 'combine', x: mortar.x + .5, z: mortar.z - .1, y: mortar.y }, { step: 'distil', x: 1.6, z: -1.35, y: furnace.y }, { step: 'bottle', x: bench.x0 - .4, z: .1, y: bench.y }];
  // the walks: in at the door to the counter; round the counter's end behind it to the still; along behind the counter to the jars
  const paths = [[[sh.doorX, Z - .1], [sh.doorX, 1.3]], [[sh.doorX, Z - .1], [2.2, 1.6], [2.2, -.5], [1.6, -1.35]], [[2.2, -.5], [1.3, -.35], [-.9, -.35], [-1.1, -1.75]]];
  const group = new THREE.Group(); let tris = 0; for (const [k, gs] of B) { const g = mergeGeometries(gs, false); gs.forEach(x => x.dispose()); const m = new THREE.Mesh(g, M[k] || M.plaster); m.name = k; m.castShadow = !['flame', 'ember', 'glass', 'green'].includes(k); m.receiveShadow = true; group.add(m); tris += g.attributes.position.count / 3; }
  const all = new THREE.Group(); all.add(sh.group, group);
  return { group: all, shell: sh.group, room: group, tris: Math.round(tris), draws: group.children.length, shellTris: sh.tris, shellCalls: sh.draws, inner: { x0: -X, x1: X, z0: -Z, z1: Z }, floor: F0, ceil: CEIL, top: TOP,
    furnace, flue, hood, still, counter, table, mortar, bench, shelves, stall, arcade: { z0: d / 2, z1: AZ1 + .2 }, stations, door: { x: sh.doorX, z: d / 2, w: 1.05, h: 2.0 }, paths, boxes, lamp, glow: [furnace.x0 + .5, F0 + .25, furnace.z1 + .25], w, d };
}

// gatelandsGuildHall(o, r) (Session 939, card F9; L5's guildhall by nation, OG-043's guildhall "hall of trade, contracts and guild
//   meetings"; the game's Fighters' Guild hall, S12 and S292: a steward at the desk, the notice board, the weapon racks, armour stands,
//   the long table with benches, a grindstone, a dormitory of beds). Since Session 965 (Michael's C on #352) it stands in the kit's own
//   guild hall (GL_PLANS.guildhall: 14.4 by 9.0 m, walls of 0.7 m, 6.4 m to the wall plate, slate at 40°), its great door open:
//   the hall in the west end, open to the roof on three arch-braced collar trusses, purlins and a boarded lining; the hearth in the west
//   gable with the guild's red shield on its breast, the long table and its benches before it; the steward's desk facing the great door
//   with the ledger, the inkwell and a quill, and the notice board on the back wall behind it under the gallery; the rack of swords,
//   spears and axes under the gallery west of the back door; two armour stands by the front wall; the practice floor with its pell and
//   the grindstone; a wheel of candles from the middle collar. The stair rises along the partition from the front to the gallery, which
//   runs the hall's back wall at the first floor (3.2 m) with a rail over the hall and a bench under its high lights, and opens at its
//   east end into the dormitory: six beds heads to the east gable, a chest at each foot, the aisle along the partition. Under the
//   dormitory, through a door by the stair's foot, the steward's room: a table and the guild's books, a press, the strongbox.
//   o.guild 'mages' (Session 966; the game's Mages' Guild of S292: bookcases, potion shelves either side of the board, the still, a
//   reading table of open books): the same house and the same bones in blue, its banner a gilt star; the long table a reading table of
//   open codices; potion shelves where the rack and its pair stand, either side of the board; the still on its furnace by the front
//   wall where the armour stood, its green light; a lectern with a great book on the practice floor, a round table of scrolls by the
//   gallery; three presses of codices along the gallery between its high lights.
//   -> { group, shell, room, tris, draws, inner, floors [ground, upper], roofY(z), eave, door, hearth, fire, stair, gallery, part, doors
//        { steward, dorm }, desk, board, table, benches, stands, rack, pell, grind, beds, paths [{ fl, pts }], boxes (tagged, with their
//        floor), lamp, dormLamp, windows, w, d }
export function gatelandsGuildHall(o = {}, r = stream('guild')) {
  const MG = o.guild === 'mages', plan = GL_PLANS.guildhall({ ajar: true, guild: MG ? 'mages' : 'fighters' }); plan.interior = true; plan.r = stream('guild-shell');
  const shell = gatelandsBuilding(plan), F = forgeMats(), M = { ...mats(), steel: F.steel, leather: F.leather, grit: F.grit, red: mat('plaster', { ns: .4, color: 0x7a2020, rough: 1 }), mail: new THREE.MeshStandardMaterial({ color: 0x74767a, roughness: .55, metalness: .35 }) /* matte, with nothing round it to mirror */,
    blue: mat('plaster', { ns: .4, color: 0x24406e, rough: 1 }), gilt: new THREE.MeshStandardMaterial({ color: 0xc8952e, roughness: .3, metalness: .75 }), books: new THREE.MeshStandardMaterial({ map: libSpines(), roughness: .8 }),
    phial: new THREE.MeshStandardMaterial({ color: 0x3a8a52, emissive: 0x2a9a4a, emissiveIntensity: .35, roughness: .1, transparent: true, opacity: .8 }) }, B = new Map(), boxes = [], t = plan.t, X = plan.w / 2 - t, Z = plan.d / 2 - t, F0 = .05, F1 = plan.floors[0], EAVE = plan.floors[0] + plan.floors[1];
  const p = plan.roof.pitch * Math.PI / 180, tp = Math.tan(p), roofY = z => EAVE + (plan.d / 2 - Math.abs(z)) * tp /* the slate's underside */, LIN = .035 /* the lining under it */;
  const PX0 = plan.hallX + .3, PX1 = PX0 + .25 /* the partition between the hall and the east end */;
  const put = (geo, key, x = 0, y = 0, z = 0, ry = 0, uv = .6, rx = 0, rz = 0) => { const g = geo.index ? geo.toNonIndexed() : geo; for (const k of Object.keys(g.attributes)) if (!['position', 'normal'].includes(k)) g.deleteAttribute(k);
    g.applyMatrix4(new THREE.Matrix4().compose(new THREE.Vector3(x, y, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(rx, ry, rz)), new THREE.Vector3(1, 1, 1))); worldUV(g, uv); if (!B.has(key)) B.set(key, []); B.get(key).push(g); return g; };
  const bx = (key, x0, x1, y0, y1, z0, z1, tag, fl) => { const g = put(new THREE.BoxGeometry(x1 - x0, y1 - y0, z1 - z0), key, (x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2, 0, key === 'books' ? 1 : .6);
    if (key === 'books') { const U = g.attributes.uv, P = g.attributes.position; for (let i = 0; i < U.count; i++) U.setY(i, (P.getY(i) - y0) / (y1 - y0)); } if (tag) boxes.push({ tag, x0, x1, y0, y1, z0, z1, fl }); };
  const C1 = MG ? 'blue' : 'red' /* the guild's colour */;
  // a timber from (y0, z0) to (y1, z1) in the plane x, w wide (along x) and h deep
  const beam = (key, x, y0, z0, y1, z1, w, h) => { const L = Math.hypot(y1 - y0, z1 - z0); put(new THREE.BoxGeometry(w, h, L), key, x, (y0 + y1) / 2, (z0 + z1) / 2, 0, .6, Math.atan2(-(y1 - y0), z1 - z0)); };
  // the floor: flags in courses, the hall and the steward's room alike
  for (let z = -Z; z < Z - .05;) { const d = Math.min(Z - z, .55 + r() * .35); for (let x = -X; x < X - .05;) { const w = Math.min(X - x, .6 + r() * .45); put(new THREE.BoxGeometry(w - .02, .05, d - .02), 'flag', x + w / 2, .025 + (r() - .5) * .006, z + d / 2, (r() - .5) * .01, .7); x += w; } z += d; }
  // the partition: limewashed to the roof's lining, a door at its foot by the front wall into the steward's room, and one at the
  // gallery's end into the dormitory (shape in -z, y; extruded along x)
  const doors = { steward: { z0: Z - .95, z1: Z - .1, y0: F0, y1: F0 + 2.05 }, dorm: { z0: -Z + .45, z1: -Z + 1.25, y0: F1, y1: F1 + 2.0 } };
  { const s = new THREE.Shape(), top = z => roofY(z) - LIN - .005; s.moveTo(Z, 0); s.lineTo(-Z, 0); s.lineTo(-Z, top(Z)); s.lineTo(0, top(0)); s.lineTo(Z, top(Z)); s.lineTo(Z, 0);
    for (const d of Object.values(doors)) { const h = new THREE.Path(); h.moveTo(-d.z1, d.y0); h.lineTo(-d.z0, d.y0); h.lineTo(-d.z0, d.y1); h.lineTo(-d.z1, d.y1); h.lineTo(-d.z1, d.y0); s.holes.push(h); }
    const g = new THREE.ExtrudeGeometry(s, { depth: PX1 - PX0, bevelEnabled: false }); g.rotateY(Math.PI / 2); put(g, 'lime', PX0, 0, 0, 0, .5);
    for (const d of Object.values(doors)) { bx('oak', PX0 - .03, PX1 + .03, d.y1, d.y1 + .14, d.z0 - .08, d.z1 + .08); for (const zz of [d.z0 - .08, d.z1]) bx('oak', PX0 - .03, PX1 + .03, d.y0, d.y1, zz, zz + .08); }
    // the leaves, open into the east end flat against the partition
    bx('oak', PX1, PX1 + .05, doors.steward.y0, doors.steward.y1 - .02, doors.steward.z0 - .86, doors.steward.z0 - .02, 'leaf', 0); bx('oak', PX1, PX1 + .05, doors.dorm.y0, doors.dorm.y1 - .02, doors.dorm.z1 + .02, doors.dorm.z1 + .82, 'leaf', 1); }
  // the hearth in the west gable, its breast and flue to the roof; the guild's red shield on the breast over the mantel
  const hw = 1.6, hh = 1.3, BD = .5, hx = -X; { const z0 = -hw / 2 - .4, z1 = hw / 2 + .4; bx('lime', hx, hx + BD, hh, F1 + .6, z0, z1); bx('lime', hx, hx + BD, 0, hh, z0, -hw / 2, 'breast', 0); bx('lime', hx, hx + BD, 0, hh, hw / 2, z1, 'breast', 0);
    bx('lime', hx, hx + .35, F1 + .6, roofY(.6) - LIN - .02, -.6, .6);
    bx('soot', hx, hx + .02, 0, hh, -hw / 2, hw / 2); bx('soot', hx, hx + BD, hh - .02, hh, -hw / 2, hw / 2); bx('oak', hx + BD - .3, hx + BD + .08, hh, hh + .24, -hw / 2 - .25, hw / 2 + .25); bx('flag', hx + BD, hx + BD + .8, F0, F0 + .03, -hw / 2, hw / 2, 'hearthstone', 0);
    const s = new THREE.Shape(); s.moveTo(-.5, 0); s.lineTo(.5, 0); s.lineTo(.5, -1.0); s.lineTo(0, -1.22); s.lineTo(-.5, -1.0); s.lineTo(-.5, 0);
    const g = new THREE.ShapeGeometry(s); g.rotateY(Math.PI / 2); put(g, C1, hx + BD + .03, F1 + .3, 0); bx('iron', hx + BD + .02, hx + BD + .035, F1 - .55, F1 - .25, -.03, .03); bx('iron', hx + BD + .02, hx + BD + .035, F1 - .42, F1 - .38, -.16, .16);
    if (MG) { const st = new THREE.Shape(); for (let i = 0; i < 16; i++) { const a = i / 16 * Math.PI * 2, rr = i % 2 ? .1 : .3; st[i ? 'lineTo' : 'moveTo'](Math.cos(a) * rr, Math.sin(a) * rr); } const sg = new THREE.ShapeGeometry(st); sg.rotateY(Math.PI / 2); put(sg, 'gilt', hx + BD + .04, F1 - .2, 0); }
    else for (const s2 of [-1, 1]) { put(new THREE.BoxGeometry(.03, 1.5, .05), 'steel', hx + BD + .05, F1 - .2, 0, 0, .6, s2 * .62); } }
  const fx = hx + .28, fire = [fx + .05, .32, 0]; for (let i = 0; i < 7; i++) { const a = i / 7 * Math.PI * 2; put(new THREE.BoxGeometry(.24, .1, .12), 'turf', fx + Math.cos(a) * .15, .06 + (i % 2) * .08, Math.sin(a) * .22, a + 1.3); }
  put(new THREE.SphereGeometry(.16, 10, 6).scale(1.2, .4, 1.4), 'ember', fx, .08, 0); for (let i = 0; i < 3; i++) put(new THREE.ConeGeometry(.07, .28 + i * .06, 7), 'flame', fx + (i - 1) * .04, .26, (i - 1) * .09);
  // the long table before the hearth, a bench either side; tankards and a candle on it
  const table = { x0: -4.9, x1: -2.9, z0: .2, z1: 1.0, y: F0 + .76 }; { const { x0, x1, z0, z1, y } = table; bx('oak', x0, x1, y - .05, y, z0, z1, 'table', 0); for (const xx of [x0 + .1, x1 - .18]) for (const zz of [z0 + .08, z1 - .16]) bx('oak', xx, xx + .08, F0, y - .05, zz, zz + .08);
    if (MG) for (let k = 0; k < 4; k++) { const cx = x0 + .3 + k * .45, cz = k % 2 ? z0 + .22 : z1 - .22; bx('linen', cx - .17, cx + .17, y, y + .012, cz - .12, cz + .12); bx('leather', cx - .19, cx + .19, y, y + .006, cz - .13, cz + .13); bx('leather', cx - .01, cx + .01, y, y + .03, cz - .13, cz + .13); }
    else for (let k = 0; k < 4; k++) put(new THREE.CylinderGeometry(.045, .045, .14, 10), k % 2 ? 'crock' : 'iron', x0 + .3 + k * .45, y + .07, (k % 2 ? z0 + .2 : z1 - .2));
    put(new THREE.CylinderGeometry(.012, .014, .14, 8), 'linen', (x0 + x1) / 2, y + .07, (z0 + z1) / 2); put(new THREE.SphereGeometry(.012, 6, 5).scale(1, 2, 1), 'flame', (x0 + x1) / 2, y + .155, (z0 + z1) / 2); }
  const benches = []; for (const [bz0, bz1] of [[-.25, .05], [1.15, 1.45]]) { bx('oak', table.x0, table.x1, F0 + .41, F0 + .45, bz0, bz1, 'bench', 0); for (const xx of [table.x0 + .1, table.x1 - .16]) bx('oak', xx, xx + .06, F0, F0 + .41, bz0 + .03, bz1 - .03); benches.push({ z0: bz0, z1: bz1, y: .45 }); }
  // two armour stands by the front wall between the great door and the east light: a post on a cross foot, a mail shirt, a helm, a shield
  const stands = [], still = MG ? { x0: -.75, x1: -.05, z0: Z - .62, z1: Z - .02, y: F0 + .8 } : null; if (MG) { const S = still, cx = (S.x0 + S.x1) / 2, cz = (S.z0 + S.z1) / 2;
    // the still on its furnace by the front wall: a stone furnace with its fire, the flask, the head and its beak down to the receiver on a stool
    bx('rubble', S.x0, S.x1, F0, S.y, S.z0, S.z1, 'still', 0); bx('soot', cx - .14, cx + .14, F0 + .15, F0 + .45, S.z0 - .005, S.z0); put(new THREE.SphereGeometry(.08, 8, 6).scale(1.3, .5, 1), 'ember', cx, F0 + .2, S.z0 + .06);
    put(new THREE.SphereGeometry(.2, 14, 10), 'phial', cx, S.y + .2, cz); put(new THREE.CylinderGeometry(.05, .07, .22, 10), 'phial', cx, S.y + .48, cz); put(new THREE.SphereGeometry(.12, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2).scale(1, 1.1, 1), 'crock', cx, S.y + .58, cz);
    const rx2 = .45, h0 = [cx + .08, S.y + .6], h1 = [rx2, F0 + .76], dx = h1[0] - h0[0], dy = h1[1] - h0[1]; put(new THREE.CylinderGeometry(.012, .022, Math.hypot(dx, dy), 8), 'crock', (h0[0] + h1[0]) / 2, (h0[1] + h1[1]) / 2, cz, 0, .6, 0, Math.atan2(-dx, dy));
    bx('oak', rx2 - .2, rx2 + .2, F0 + .5, F0 + .54, cz - .2, cz + .2, 'still', 0); for (const [a, b] of [[rx2 - .18, cz - .18], [rx2 + .14, cz - .18], [rx2 - .18, cz + .14], [rx2 + .14, cz + .14]]) bx('oak', a, a + .04, F0, F0 + .5, b, b + .04);
    put(new THREE.SphereGeometry(.13, 12, 8), 'phial', rx2, F0 + .66, cz); still.glow = [cx, S.y + .3, cz]; still.receiver = [rx2, F0 + .66, cz]; }
  for (const sx of MG ? [] : [-.55, .2]) { const sz = Z - .4; bx('oak', sx - .25, sx + .25, F0, F0 + .05, sz - .04, sz + .04); bx('oak', sx - .04, sx + .04, F0, F0 + .05, sz - .25, sz + .25); bx('oak', sx - .03, sx + .03, F0, F0 + 1.5, sz - .03, sz + .03);
    bx('oak', sx - .22, sx + .22, F0 + 1.38, F0 + 1.43, sz - .03, sz + .03); put(new THREE.CylinderGeometry(.2, .17, .62, 12, 1, true).scale(1, 1, .7), 'mail', sx, F0 + 1.08, sz); put(new THREE.SphereGeometry(.2, 12, 6, 0, Math.PI * 2, 0, Math.PI / 2).scale(1.05, .35, .75), 'mail', sx, F0 + 1.38, sz); put(new THREE.SphereGeometry(.105, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2), 'mail', sx, F0 + 1.5, sz); bx('mail', sx - .012, sx + .012, F0 + 1.38, F0 + 1.52, sz + .095, sz + .11);
    put(new THREE.CylinderGeometry(.27, .27, .03, 18).rotateX(Math.PI / 2 - .2), C1, sx + .1, F0 + .38, sz - .28); boxes.push({ tag: 'stand', x0: sx - .27, x1: sx + .27, y0: F0, y1: F0 + 1.64, z0: sz - .32, z1: sz + .27, fl: 0 }); stands.push([sx, sz]); }
  // the steward's desk facing the great door: a ledger open on it, the inkwell and a quill; the steward's stool behind it
  const desk = { x0: -2.1, x1: -.5, z0: -2.0, z1: -1.45, y: F0 + .78 }; { const { x0, x1, z0, z1, y } = desk, cx = (x0 + x1) / 2; bx('oak', x0, x1, F0, y - .04, z1 - .05, z1, 'desk', 0); bx('oak', x0, x0 + .05, F0, y - .04, z0, z1, 'desk', 0); bx('oak', x1 - .05, x1, F0, y - .04, z0, z1, 'desk', 0); bx('deal', x0 - .03, x1 + .03, y - .04, y, z0 - .03, z1 + .03);
    bx('linen', cx - .15, cx + .25, y, y + .02, z0 + .12, z1 - .1); bx('leather', cx - .17, cx + .27, y, y + .012, z0 + .1, z1 - .08); bx('iron', cx + .45, cx + .51, y, y + .05, z0 + .2, z0 + .26); put(new THREE.ConeGeometry(.012, .3, 4), 'linen', cx + .5, y + .15, z0 + .23, 0, .6, .3, .2);
    bx('deal', cx - .2, cx + .15, F0 + .45, F0 + .49, z0 - .55, z0 - .2, 'stool', 0); for (const [a, b] of [[cx - .18, z0 - .53], [cx + .1, z0 - .53], [cx - .18, z0 - .27], [cx + .1, z0 - .27]]) bx('deal', a, a + .04, F0, F0 + .45, b, b + .04); }
  // the notice board on the back wall behind the desk, under the gallery: a frame of oak, pinned notes of every size
  const board = { x0: -1.95, x1: -.65, y0: F0 + 1.2, y1: F0 + 2.1 }; { const { x0, x1, y0, y1 } = board; bx('deal', x0, x1, y0, y1, -Z, -Z + .03); for (const [a, b, c, d] of [[x0, x1, y0 - .05, y0], [x0, x1, y1, y1 + .05], [x0 - .05, x0, y0 - .05, y1 + .05], [x1, x1 + .05, y0 - .05, y1 + .05]]) bx('oak', a, b, c, d, -Z, -Z + .05);
    for (let k = 0; k < 11; k++) { const w = .14 + r() * .12, h = .16 + r() * .14, cx = x0 + .12 + r() * (x1 - x0 - .24), cy = y0 + .12 + r() * (y1 - y0 - .24); const g = new THREE.PlaneGeometry(w, h); put(g, 'linen', cx, cy, -Z + .035 + k * .0008, 0, .6, 0, (r() - .5) * .2); put(new THREE.SphereGeometry(.008, 4, 3), 'iron', cx, cy + h / 2 - .02, -Z + .045); } }
  // the weapons' rack on the back wall west of the back door, under the gallery: swords hilt up, spears and axes in a frame
  // the Mages' potion shelves either side of the board: an open frame of four shelves of phials, crocks and jars, one where the
  // Fighters' rack stands and its pair east of the low window
  const shelves = MG ? [{ x0: -4.55, x1: -3.3 }, { x0: .62, x1: 1.9 }].map(q => ({ ...q, z0: -Z, z1: -Z + .36, y1: F0 + 1.95 })) : [];
  for (const q of shelves) { bx('oak', q.x0, q.x1, F0, F0 + .08, q.z0, q.z1, 'shelves', 0); for (const xx of [q.x0, q.x1 - .05]) bx('oak', xx, xx + .05, F0, q.y1, q.z0, q.z1); bx('oak', q.x0, q.x1, F0, q.y1, q.z0, q.z0 + .02);
    for (let k = 0; k < 4; k++) { const y = F0 + .45 + k * .44; bx('deal', q.x0 + .05, q.x1 - .05, y - .025, y, q.z0, q.z1); for (let u = q.x0 + .14; u < q.x1 - .12; u += .13 + r() * .06) { const kind = r(), hh = .1 + r() * .12;
      if (kind < .45) { put(new THREE.CylinderGeometry(.03, .035, hh, 8), 'phial', u, y + hh / 2, q.z0 + .2); } else if (kind < .75) put(new THREE.CylinderGeometry(.05, .045, hh + .04, 8), 'crock', u, y + (hh + .04) / 2, q.z0 + .18); else { put(new THREE.SphereGeometry(.05, 8, 6), 'phial', u, y + .05, q.z0 + .2); } } } }
  const rack = { x0: -4.55, x1: -3.3, z0: -Z, z1: -Z + .32 }; if (!MG) { const { x0, x1, z0, z1 } = rack; bx('oak', x0, x1, F0, F0 + .1, z0, z1, 'rack', 0); bx('oak', x0, x1, F0 + 1.0, F0 + 1.06, z0, z1); for (const xx of [x0, x1 - .06]) bx('oak', xx, xx + .06, F0, F0 + 1.75, z0, z1);
    bx('oak', x0, x1, F0 + 1.7, F0 + 1.75, z0, z0 + .1); for (let k = 0, xx = x0 + .15; xx < x1 - .1; k++, xx += .18) { const kind = k % 3, zz = (z0 + z1) / 2;
      if (kind === 0) { bx('steel', xx - .02, xx + .02, F0 + .1, F0 + .95, zz - .004, zz + .004); bx('iron', xx - .08, xx + .08, F0 + .95, F0 + .98, zz - .015, zz + .015); bx('leather', xx - .015, xx + .015, F0 + .98, F0 + 1.15, zz - .015, zz + .015); }
      else if (kind === 1) { put(new THREE.CylinderGeometry(.014, .014, 1.9, 6), 'oak', xx, F0 + 1.05, zz); put(new THREE.ConeGeometry(.03, .22, 4).scale(1, 1, .3), 'steel', xx, F0 + 2.1, zz); }
      else { put(new THREE.CylinderGeometry(.016, .016, .8, 6), 'oak', xx, F0 + .5, zz); bx('steel', xx, xx + .14, F0 + .78, F0 + .92, zz - .006, zz + .006); } } }
  // the practice floor: a pell, the post scarred by blows; the grindstone on its frame by the gallery
  const pell = { x: .5, z: .6 }; if (MG) { const { x, z } = pell; // the lectern on the practice floor, a great book open on it
    bx('oak', x - .25, x + .25, F0, F0 + .06, z - .25, z + .25, 'lectern', 0); put(new THREE.CylinderGeometry(.06, .07, 1.0, 8), 'oak', x, F0 + .55, z); put(new THREE.BoxGeometry(.6, .04, .45), 'oak', x, F0 + 1.1, z, 0, .6, .35);
    put(new THREE.BoxGeometry(.56, .03, .4), 'linen', x, F0 + 1.135, z + .01, 0, .6, .35); boxes.push({ tag: 'lectern', x0: x - .3, x1: x + .3, y0: F0, y1: F0 + 1.25, z0: z - .3, z1: z + .3, fl: 0 }); }
  else { const { x, z } = pell; bx('oak', x - .3, x + .3, F0, F0 + .08, z - .3, z + .3, 'pell', 0); put(new THREE.CylinderGeometry(.11, .12, 1.7, 10), 'oak', x, F0 + .93, z); for (let k = 0; k < 6; k++) bx('soot', x + .1, x + .125, F0 + .9 + k * .12, F0 + .92 + k * .12, z - .05 + (k % 2) * .04, z + .02 + (k % 2) * .04); }
  const grind = { x: 1.1, z: -1.3 }; if (MG) { const { x, z } = grind; // a round table of scrolls and a stool by the gallery
    put(new THREE.CylinderGeometry(.42, .42, .05, 18), 'oak', x, F0 + .74, z); put(new THREE.CylinderGeometry(.06, .08, .7, 8), 'oak', x, F0 + .37, z); put(new THREE.CylinderGeometry(.25, .28, .04, 12), 'oak', x, F0 + .02, z);
    for (let k = 0; k < 3; k++) put(new THREE.CylinderGeometry(.03, .03, .34, 8), 'linen', x - .12 + k * .1, F0 + .795, z - .05 + (k % 2) * .1, 0, .6, Math.PI / 2, .3 * k); put(new THREE.CylinderGeometry(.012, .014, .12, 8), 'linen', x + .2, F0 + .83, z + .15); put(new THREE.SphereGeometry(.012, 6, 5).scale(1, 2, 1), 'flame', x + .2, F0 + .905, z + .15);
    boxes.push({ tag: 'grind', x0: x - .42, x1: x + .42, y0: F0, y1: F0 + .9, z0: z - .42, z1: z + .42, fl: 0 }); }
  else { const { x, z } = grind; for (const dz of [-.22, .22]) { bx('oak', x - .3, x + .3, F0 + .1, F0 + .16, z + dz - .03, z + dz + .03); bx('oak', x - .03, x + .03, F0, F0 + .7, z + dz - .03, z + dz + .03); }
    const st = new THREE.CylinderGeometry(.36, .36, .1, 22); st.rotateX(Math.PI / 2); put(st, 'grit', x, F0 + .72, z, 0, .4); bx('iron', x - .015, x + .015, F0 + .7, F0 + .74, z - .3, z + .3); boxes.push({ tag: 'grind', x0: x - .36, x1: x + .36, y0: F0, y1: F0 + 1.08, z0: z - .32, z1: z + .32, fl: 0 }); }
  // the gallery along the back wall at the first floor: joists and boards, a bressummer on three posts, a rail of balusters over the hall
  // (open at the stair's head), a bench under the high lights
  const GZ = -Z + 1.35, N = 16, rise = +((F1 - F0) / N).toFixed(4), going = .27, SX0 = PX0 - .9, SZF = GZ + (N - 1) * going, gallery = { x0: -X, x1: PX0, z0: -Z, z1: GZ, y: F1 };
  bx('oak', -X, PX0, F1 - .2, F1 - .04, -Z, GZ); bx('deal', -X, PX0, F1 - .04, F1, -Z, GZ); bx('oak', -X, SX0, F1 - .32, F1 - .04, GZ - .16, GZ);
  const posts = [-4.4, -2.0, .4]; for (const x of posts) { bx('oak', x - .08, x + .08, F0, F1 - .32, GZ - .16, GZ, 'post', 0); bx('oak', x - .25, x + .25, F1 - .44, F1 - .32, GZ - .18, GZ + .02); }
  bx('oak', -X, SX0, F1 + .95, F1 + 1.01, GZ - .1, GZ, 'rail', 1); bx('oak', -X, SX0, F1, F1 + .06, GZ - .08, GZ); for (let x = -X + .15; x < SX0 - .05; x += .28) bx('oak', x - .02, x + .02, F1 + .06, F1 + .95, GZ - .07, GZ - .03);
  bx('oak', SX0 - .06, SX0 + .04, F1 - .3, F1 + 1.1, GZ - .1, GZ, 'rail', 1) /* the newel at the rail's end */;
  const gbench = { x0: -5.9, x1: -3.6 }, presses = MG ? [[-4.6, -3.2], [-2.0, -.6], [.6, 1.9]] : [];
  if (!MG) { bx('oak', gbench.x0, gbench.x1, F1 + .41, F1 + .45, -Z + .05, -Z + .38, 'gbench', 1); for (const xx of [gbench.x0 + .1, gbench.x1 - .16]) bx('oak', xx, xx + .06, F1, F1 + .41, -Z + .08, -Z + .35); }
  // the Mages' presses along the gallery, between its high lights: open cases of five shelves of codices
  for (const [x0, x1] of presses) { const z0 = -Z, z1 = -Z + .4, y1 = F1 + 2.2; bx('oak', x0, x1, F1, F1 + .1, z0, z1, 'press', 1); bx('oak', x0, x1, y1 - .06, y1, z0, z1); for (const xx of [x0, x1 - .05]) bx('oak', xx, xx + .05, F1, y1, z0, z1); bx('oak', x0, x1, F1, y1, z0, z0 + .02);
    for (let k = 0; k < 5; k++) { const y = F1 + .1 + k * .42; if (k) bx('oak', x0 + .05, x1 - .05, y - .025, y, z0, z1); for (let u = x0 + .07; u < x1 - .1;) { const w = Math.min(x1 - .07 - u, .3 + r() * .4); bx('books', u, u + w, y, y + .28 + r() * .06, z0 + .06, z1 - .05); u += w + .02; } } }
  // the stair along the partition, from the front up to the gallery's east end; a raking rail on its open side
  for (let k = 1; k < N; k++) bx('oak', SX0, PX0, F0, F0 + k * rise, SZF - k * going, SZF - (k - 1) * going, 'stair', 0);
  { const yb = F0 + rise + .9, yt = F1 + .9; bx('oak', SX0 - .06, SX0 + .04, F0, yb + .1, SZF - going - .05, SZF - going + .05); beam('oak', SX0 - .01, yb, SZF - going, yt, GZ, .06, .07);
    for (let k = 2; k < N; k += 2) { const z = SZF - k * going + going / 2, y = F0 + k * rise; bx('oak', SX0 - .03, SX0 + .01, y, y + .9, z - .02, z + .02); } }
  // the dormitory's floor over the steward's room, on joists
  bx('oak', PX1, X, F1 - .2, F1 - .04, -Z, Z); bx('deal', PX1, X, F1 - .04, F1, -Z, Z); for (let z = -Z + .4; z < Z - .2; z += .8) bx('oak', PX1, X, F1 - .36, F1 - .2, z - .08, z + .08);
  // the roof: a boarded lining under the slate, a ridge beam, two purlins a side, wall plates; three arch-braced collar trusses over the
  // hall, each on stone corbels and wall posts, and a plain collar truss over the dormitory
  for (const s of [-1, 1]) { const L = (plan.d / 2 - t + .02) / Math.cos(p); beam('deal', 0, roofY(0) - LIN / 2 / Math.cos(p) - .002, 0, roofY(Z + .02) - LIN / 2 / Math.cos(p) - .002, s * (Z + .02), 2 * X, LIN);
    for (const zz of [1.3, 2.6]) bx('oak', -X, X, roofY(zz + .09) - LIN - .24, roofY(zz + .09) - LIN, s * zz - .09, s * zz + .09); bx('oak', -X, X, roofY(Z - .1) - LIN - .26, roofY(Z - .1) - LIN, s * (Z - .2) - .1, s * (Z - .2) + .1); void L; }
  bx('oak', -X, X, roofY(0) - LIN - .28, roofY(.12) - LIN, -.1, .1);
  const CY = 8.4, SP = 5.6, trusses = [-3.9, -1.3, 1.3] /* clear of the back's high lights and the front's tall ones */; for (const x of [...trusses, (PX1 + X) / 2]) { const arch = x < PX0, zc = plan.d / 2 - (CY + .22 + LIN + .04 - EAVE) / tp;
    for (const s of [-1, 1]) { const off = .13, a = [roofY(Z - .12) - LIN - off / Math.cos(p), s * (Z - .12)], b = [roofY(0) - LIN - off / Math.cos(p), 0]; beam('oak', x, a[0], a[1], b[0], b[1], .2, .26); }
    bx('oak', x - .1, x + .1, CY, CY + .22, -zc, zc);
    if (arch) for (const s of [-1, 1]) { const A = Z - .1, Bh = CY - SP, pts = []; for (let i = 0; i <= 8; i++) { const th = i / 8 * Math.PI / 2; pts.push([SP + Bh * Math.sin(th), s * A * Math.cos(th)]); }
      for (let i = 0; i < 8; i++) beam('oak', x, pts[i][0], pts[i][1], pts[i + 1][0], pts[i + 1][1], .18, .16);
      bx('rubble', x - .2, x + .2, SP - .3, SP, s * Z - (s > 0 ? .3 : 0), s * Z + (s < 0 ? .3 : 0)); bx('oak', x - .1, x + .1, SP, roofY(Z - .2) - LIN - .2, s * (Z - .1) - .1, s * (Z - .1) + .1); } }
  // the wheel of candles from the middle collar over the practice floor
  const lamp = [trusses[1], 4.3, .4]; { const [lx, ly, lz] = lamp; bx('iron', lx - .006, lx + .006, ly + .55, CY, lz - .006, lz + .006); const ring = new THREE.TorusGeometry(.55, .025, 6, 24); ring.rotateX(Math.PI / 2); put(ring, 'iron', lx, ly, lz); bx('iron', lx - .56, lx + .56, ly + .54, ly + .56, lz - .01, lz + .01); bx('iron', lx - .01, lx + .01, ly + .54, ly + .56, lz - .56, lz + .56);
    for (let i = 0; i < 4; i++) { const a = i / 4 * Math.PI * 2; bx('iron', lx + Math.cos(a) * .55 - .005, lx + Math.cos(a) * .55 + .005, ly, ly + .55, lz + Math.sin(a) * .55 - .005, lz + Math.sin(a) * .55 + .005); }
    for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2, cx = lx + Math.cos(a) * .55, cz = lz + Math.sin(a) * .55; put(new THREE.CylinderGeometry(.018, .02, .14, 8), 'linen', cx, ly + .09, cz); put(new THREE.SphereGeometry(.014, 6, 5).scale(1, 2.2, 1), 'flame', cx, ly + .19, cz); } }
  // upstairs, the dormitory: six beds heads to the east gable, a chest at each foot, the aisle along the partition; a lamp on a bracket
  const beds = []; for (let k = 0; k < 6; k++) { const zc = -Z + .675 + k * 1.25, b = { x0: X - 2.0, x1: X - .05, z0: zc - .45, z1: zc + .45 }; bx('oak', b.x0, b.x1, F1, F1 + .42, b.z0, b.z1, 'bed', 1); bx('straw', b.x0 + .04, b.x1 - .04, F1 + .42, F1 + .52, b.z0 + .04, b.z1 - .04);
    bx(k % 2 ? 'wool' : C1, b.x0 + .04, b.x1 - .5, F1 + .52, F1 + .57, b.z0 + .03, b.z1 - .03); bx('linen', b.x1 - .45, b.x1 - .08, F1 + .52, F1 + .63, b.z0 + .1, b.z1 - .1); bx('oak', b.x0 - .5, b.x0 - .05, F1, F1 + .45, b.z0 + .08, b.z1 - .08, 'chest', 1); beds.push(b); }
  const dormLamp = [PX1 + .2, F1 + 2.1, 0]; bx('iron', PX1, PX1 + .25, dormLamp[1] + .2, dormLamp[1] + .23, -.01, .01); put(new THREE.CylinderGeometry(.07, .08, .2, 6), 'glow', ...dormLamp); put(new THREE.ConeGeometry(.09, .09, 6), 'iron', dormLamp[0], dormLamp[1] + .14, dormLamp[2]);
  // the steward's room under the dormitory: a table with the guild's books and a chair, a press against the partition, the strongbox
  // under the east gable between its windows
  const stTable = { x0: 4.4, x1: 5.6, z0: -.5, z1: .4, y: F0 + .76 }; { const { x0, x1, z0, z1, y } = stTable; bx('oak', x0, x1, y - .05, y, z0, z1, 'sttable', 0); for (const xx of [x0 + .08, x1 - .16]) for (const zz of [z0 + .08, z1 - .16]) bx('oak', xx, xx + .08, F0, y - .05, zz, zz + .08);
    for (let k = 0; k < 3; k++) bx(k % 2 ? 'leather' : C1, x0 + .2 + k * .08, x0 + .27 + k * .08, y, y + .26, z0 + .15, z0 + .45); bx('linen', x0 + .6, x0 + .95, y, y + .015, z0 + .3, z1 - .2);
    bx('oak', 4.8, 5.2, F0 + .44, F0 + .48, z1 + .2, z1 + .6, 'chair', 0); bx('oak', 4.8, 5.2, F0 + .48, F0 + 1.0, z1 + .56, z1 + .6); for (const [a, b] of [[4.8, z1 + .2], [5.16, z1 + .2], [4.8, z1 + .56], [5.16, z1 + .56]]) bx('oak', a, a + .04, F0, F0 + .44, b, b + .04); }
  bx('oak', PX1, PX1 + .45, F0, F0 + 1.9, -2.2, -.7, 'press', 0); for (const y of [.7, 1.3]) bx('deal', PX1 + .44, PX1 + .46, F0 + y, F0 + y + .02, -2.15, -.75); bx('iron', PX1 + .45, PX1 + .47, F0 + .9, F0 + 1.0, -1.47, -1.43);
  bx('oak', X - .5, X - .02, F0, F0 + .5, -.45, .45, 'strongbox', 0); for (const z of [-.3, 0, .3]) bx('iron', X - .52, X - .5, F0, F0 + .51, z - .025, z + .025); bx('iron', X - .53, X - .51, F0 + .3, F0 + .4, -.04, .04);
  // the great door's leaf, hung open against the front wall inside, west of the doorway
  const door = plan.open.front.find(q => q.kind === 'plank'); bx(C1, door.x - door.w / 2 - door.w - .02, door.x - door.w / 2 - .02, F0, F0 + door.h - door.w / 2, Z - .07, Z - .01, 'leaf', 0);
  // the walks: the great door to the desk; the great door past the stands and the stair's foot to the steward's room and its table; the
  // back door into the hall to the long table's end; the great door to the hearth; upstairs, from the stair's head along the gallery to
  // its bench, and in at the dormitory's door down the aisle
  const back = -plan.open.back.find(q => q.kind === 'plank').x, sd = (doors.steward.z0 + doors.steward.z1) / 2, dd = (doors.dorm.z0 + doors.dorm.z1) / 2, paths = [
    { fl: 0, pts: [[door.x, Z - .3], [door.x + .3, desk.z1 + .4]] }, { fl: 0, pts: [[door.x + .3, Z - .4], [-1.0, 2.5], [SX0 - .2, 2.5], [PX0 - .4, sd], [PX1 + .4, sd], [stTable.x0 - .4, stTable.z1 + .3]] },
    { fl: 0, pts: [[back, -Z + .25], [back, -.6], [table.x1 + .3, -.6]] }, { fl: 0, pts: [[door.x, Z - .3], [-2.5, 2.2], [hx + BD + 1.0, 2.2], [hx + BD + 1.0, 1.75]] },
    { fl: 1, pts: [[(SX0 + PX0) / 2, GZ - .3], [-X + .4, GZ - .55]] }, { fl: 1, pts: [[(SX0 + PX0) / 2, GZ - .3], [(SX0 + PX0) / 2, dd], [PX1 + .4, dd], [PX1 + .4, Z - .3]] }];
  { const G = glMats().glass, Lt = glMats().lit; shell.traverse(m => { if (m.isMesh && (m.material === G || m.material === Lt)) { m.material = mats().pane; m.name = 'pane'; } }); }
  const group = new THREE.Group(); let tris = 0; for (const [k, gs] of B) { const g = mergeGeometries(gs, false); gs.forEach(x => x.dispose()); const m = new THREE.Mesh(g, M[k]); m.name = k; m.castShadow = !['flame', 'ember', 'glow'].includes(k); m.receiveShadow = true; group.add(m); tris += g.attributes.position.count / 3; }
  const all = new THREE.Group(); all.add(shell, group);
  const windows = Object.entries(plan.open).flatMap(([f, os]) => (os || []).filter(q => q.kind === 'win').map(q => ({ face: f, x: f === 'front' ? q.x : f === 'back' ? -q.x : f === 'left' ? -plan.w / 2 : plan.w / 2, z: f === 'front' ? plan.d / 2 : f === 'back' ? -plan.d / 2 : f === 'left' ? q.x : -q.x, y: q.y, w: q.w, h: q.h })));
  return { group: all, shell, room: group, tris: Math.round(tris), draws: group.children.length, shellTris: shell.userData.tris, shellCalls: shell.userData.calls, inner: { x0: -X, x1: X, z0: -Z, z1: Z }, floors: [F0, F1], roofY, lining: LIN, eave: EAVE,
    door: { x: door.x, z: plan.d / 2, w: door.w, h: door.h }, hearth: [hx + BD, 0, 0], fire, stair: { x0: SX0, x1: PX0, z0: GZ, z1: SZF, rise, going, n: N }, gallery, posts, part: { x0: PX0, x1: PX1 }, doors, trusses,
    guild: MG ? 'mages' : 'fighters', desk, board, table, benches, stands, rack: MG ? null : rack, shelves, still, presses, pell, grind, beds, stTable, paths, boxes, lamp, dormLamp, windows, w: plan.w, d: plan.d };
}

// ── the Gatelands temple (Session 946, card F9; OG-043's temple and shrine, the canon's §4.1: the Irish-register culture worships the
// six makers by their work, and each has a temple with a statue and a boon). Built inside pieces.js's temple (GL_PLANS.temple: rubble
// walls 0.75 m thick, 9.6 by 6 m, 3.8 m to the wall plate, slate at 50°, the door in the west gable, the statue under the east window).
// o.god: 'hearth' (An Teallach, a lamp; the default, the god of towns), 'sea' (An Mhuir, a hull), 'sky' (An Spéir, the sundial),
// 'beasts' (Na Beithígh, a wolf), 'stone' (An Chloch, a gate), 'weaver' (An Fíodóir, a shuttle): the icon the statue holds.
// gatelandsTemple(o, r) -> { group, shell, room, tris, draws, inner, under(z), floor, eave, door, dais, plinth, statue {x, z, y0, y1,
//   face, icon [x, y, z]}, altar {x0, x1, z0, z1, y}, pray [x, z] (where you kneel, the game's altar within 2.6 m), prickets, lamp, bullaun,
//   benches, rags, ledge, paths, boxes, windows, w, d }
export const TEMPLE_GODS = { hearth: 'a lamp', sea: 'a hull', sky: 'the sundial', beasts: 'a wolf', stone: 'a gate', weaver: 'a shuttle' };
export function gatelandsTemple(o = {}, r = stream('temple')) {
  const god = TEMPLE_GODS[o.god] ? o.god : 'hearth', plan = GL_PLANS.temple({ ajar: true }); plan.interior = true; plan.r = stream('temple-shell');
  const shell = gatelandsBuilding(plan), F = forgeMats(), M = { ...mats(), grit: F.grit, water: F.water, steel: F.steel, sootstone: F.sootstone,
    stat: mat('plaster', { ns: .5, color: 0xcfc8b6, rough: .85 }) /* carved limestone: smooth, not coursed */, altar: mat('stone', { ns: .8, color: 0x8a867c, rough: .9 }), wax: new THREE.MeshStandardMaterial({ color: 0xeee2c4, roughness: .6 }),
    rag: mat('plaster', { ns: .3, color: 0xb8a070, rough: 1 }), bloom: new THREE.MeshStandardMaterial({ color: 0xd8b040, roughness: .8 }) }, B = new Map(), boxes = [];
  const t = plan.t, h = plan.floors[0], X = plan.w / 2 - t, Z = plan.d / 2 - t, F0 = .04, p = plan.roof.pitch * Math.PI / 180, tp = Math.tan(p);
  const under = z => h + (plan.d / 2 - Math.abs(z)) * tp - .03 /* the slate's underside */;
  const put = (geo, key, x = 0, y = 0, z = 0, ry = 0, uv = .6, rx = 0, rz = 0) => { const g = geo.index ? geo.toNonIndexed() : geo; for (const k of Object.keys(g.attributes)) if (!['position', 'normal'].includes(k)) g.deleteAttribute(k);
    g.applyMatrix4(new THREE.Matrix4().compose(new THREE.Vector3(x, y, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(rx, ry, rz)), new THREE.Vector3(1, 1, 1))); worldUV(g, uv); if (!B.has(key)) B.set(key, []); B.get(key).push(g); return g; };
  const bx = (key, x0, x1, y0, y1, z0, z1, tag) => { put(new THREE.BoxGeometry(x1 - x0, y1 - y0, z1 - z0), key, (x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2); if (tag) boxes.push({ tag, x0, x1, y0, y1, z0, z1 }); };
  // the floor: flags in courses down the nave
  for (let z = -Z; z < Z - .05;) { const d = Math.min(Z - z, .5 + r() * .35); for (let x = -X; x < X - .05;) { const w = Math.min(X - x, .55 + r() * .5); put(new THREE.BoxGeometry(w - .02, F0, d - .02), 'flag', x + w / 2, F0 / 2 + (r() - .5) * .006, z + d / 2, (r() - .5) * .01, .7); x += w; } z += d; }
  // the dais across the east end, one step up; the plinth on it under the east window, and the god's statue on that, facing the door
  const dais = { x0: X - 1.7, x1: X, z0: -Z, z1: Z, y: F0 + .18 }; bx('altar', dais.x0, dais.x1, F0, dais.y, -Z, Z, 'dais'); bx('stat', dais.x0 - .03, dais.x0 + .05, dais.y - .04, dais.y + .005, -Z, Z);
  const plinth = { x0: X - 1.0, x1: X - .2, z0: -.4, z1: .4, y: dais.y + .5 }; bx('stat', plinth.x0, plinth.x1, dais.y, plinth.y - .06, plinth.z0, plinth.z1, 'plinth'); bx('stat', plinth.x0 - .04, plinth.x1 + .04, plinth.y - .06, plinth.y, plinth.z0 - .04, plinth.z1 + .04);
  const sx = (plinth.x0 + plinth.x1) / 2, y0 = plinth.y, SH = 2.05;
  { // the figure: a robe turned on a lathe, flattened front to back; the hood over the head; the arms bent to hold the icon before the breast
    const prof = [[.001, 0], [.36, 0], [.34, .25], [.28, .7], [.25, 1.05], [.27, 1.3], [.25, 1.5], [.16, 1.62], [.08, 1.66], [.001, 1.67]].map(([a, b]) => new THREE.Vector2(a, b * SH / 2.05));
    const robe = new THREE.LatheGeometry(prof, 16); robe.scale(.78, 1, 1); put(robe, 'stat', sx, y0, 0);
    put(new THREE.SphereGeometry(.12, 14, 10).scale(1, 1.2, 1), 'stat', sx - .02, y0 + SH * .86, 0); put(new THREE.SphereGeometry(.15, 14, 10, 0, Math.PI * 2, 0, Math.PI * .62).scale(1.05, 1.25, 1).rotateZ(.35), 'stat', sx + .02, y0 + SH * .865, 0);
    const limb = (a, b, r0, r1) => { const A = new THREE.Vector3(...a), Bv = new THREE.Vector3(...b), d = Bv.clone().sub(A), g = new THREE.CylinderGeometry(r1, r0, d.length(), 8);
      g.applyMatrix4(new THREE.Matrix4().makeRotationFromQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.clone().normalize()))); g.translate(...A.clone().add(Bv).multiplyScalar(.5).toArray()); put(g, 'stat'); };
    for (const s of [-1, 1]) { const S = [sx - .02, y0 + SH * .74, s * .22], E = [sx - .1, y0 + SH * .55, s * .23], Hn = [sx - .36, y0 + SH * .6, s * .08];
      limb(S, E, .07, .06); limb(E, Hn, .06, .05); put(new THREE.SphereGeometry(.065, 8, 6), 'stat', ...E); put(new THREE.SphereGeometry(.055, 8, 6), 'stat', ...Hn); } }
  const icon = [sx - .44, y0 + SH * .62, 0], [ix, iy, iz] = icon;
  if (god === 'hearth') { const g = new THREE.CylinderGeometry(.1, .06, .06, 14); put(g, 'sootstone', ix, iy, iz); bx('sootstone', ix - .17, ix - .08, iy - .01, iy + .03, iz - .025, iz + .025);
    put(new THREE.SphereGeometry(.025, 8, 6).scale(1, 2.4, 1), 'flame', ix - .15, iy + .08, iz); }
  else if (god === 'sea') { const g = new THREE.SphereGeometry(.2, 14, 8, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2).scale(.5, .9, 1.5); put(g, 'stat', ix, iy + .1, iz); bx('stat', ix - .1, ix + .1, iy + .085, iy + .1, iz - .27, iz + .27); bx('stat', ix - .005, ix + .005, iy + .06, iy + .34, iz - .005, iz + .005); }
  else if (god === 'sky') { const g = new THREE.CylinderGeometry(.16, .16, .035, 20); put(g, 'stat', ix, iy + .1, iz, 0, .6, 0, Math.PI / 2); const s = new THREE.Shape(); s.moveTo(0, 0); s.lineTo(.13, 0); s.lineTo(0, .11); s.lineTo(0, 0);
    const gn = new THREE.ExtrudeGeometry(s, { depth: .015, bevelEnabled: false }); gn.rotateY(Math.PI / 2); put(gn, 'sootstone', ix - .02, iy + .08, iz - .06); }
  else if (god === 'beasts') { put(new THREE.SphereGeometry(.09, 10, 8).scale(1.5, .9, .8), 'stat', ix + .02, iy + .04, iz); put(new THREE.SphereGeometry(.06, 10, 8), 'stat', ix - .1, iy + .14, iz); put(new THREE.ConeGeometry(.04, .16, 8), 'stat', ix - .2, iy + .12, iz, 0, .6, 0, Math.PI / 2) /* the long muzzle */;
    for (const s of [-1, 1]) put(new THREE.ConeGeometry(.018, .05, 4), 'stat', ix - .07, iy + .2, iz + s * .03, 0, .6, s * .3, -.4); put(new THREE.CylinderGeometry(.025, .015, .2, 6), 'stat', ix + .15, iy - .02, iz + .06, 0, .6, .4, -.9) /* the tail */; }
  else if (god === 'stone') { for (const s of [-1, 1]) bx('stat', ix - .04, ix + .04, iy - .1, iy + .2, iz + s * .1 - .035, iz + s * .1 + .035); bx('stat', ix - .05, ix + .05, iy + .2, iy + .27, iz - .17, iz + .17); }
  else { for (const s of [-1, 1]) { const c = new THREE.ConeGeometry(.045, .2, 10); put(c, 'stat', ix, iy + .06, iz + s * .2, 0, .6, s * Math.PI / 2); } put(new THREE.CylinderGeometry(.045, .045, .2, 10), 'stat', ix, iy + .06, iz, 0, .6, Math.PI / 2); put(new THREE.CylinderGeometry(.03, .03, .14, 8), 'rag', ix - .03, iy + .06, iz, 0, .6, Math.PI / 2); }
  boxes.push({ tag: 'statue', x0: sx - .5, x1: sx + .3, y0: y0, y1: y0 + SH, z0: -.36, z1: .36 });
  // offerings at the statue's feet on the dais: bread, a bowl of grain, shells, marigolds
  { const fx = plinth.x0 - .22; put(new THREE.SphereGeometry(.09, 10, 6, 0, Math.PI * 2, 0, Math.PI / 2).scale(1.3, .8, 1), 'crock', fx, dais.y, -.3); put(new THREE.CylinderGeometry(.11, .07, .07, 12), 'crock', fx, dais.y + .035, .28); put(new THREE.SphereGeometry(.09, 10, 5, 0, Math.PI * 2, 0, Math.PI / 2).scale(1, .35, 1), 'straw', fx, dais.y + .07, .28);
    for (let k = 0; k < 5; k++) put(new THREE.SphereGeometry(.035, 6, 4).scale(1, .5, 1.3), 'linen', fx + (r() - .5) * .2, dais.y + .015, (r() - .5) * .25, r() * 3);
    for (let k = 0; k < 7; k++) put(new THREE.SphereGeometry(.03, 6, 4), 'bloom', fx - .05 + (r() - .5) * .14, dais.y + .03, -.62 + (r() - .5) * .25);
    boxes.push({ tag: 'offerings', x0: fx - .2, x1: fx + .14, y0: dais.y, y1: dais.y + .12, z0: -.75, z1: .4 }); }
  // the altar before the dais: a slab on two stone ends, a red woven runner, candles, and the bowl the prayers' coins go in
  const altar = { x0: dais.x0 - .65, x1: dais.x0 - .1, z0: -.75, z1: .75, y: F0 + .95 }; { const { x0, x1, z0, z1, y } = altar;
    for (const zz of [z0 + .05, z1 - .3]) bx('altar', x0 + .05, x1 - .05, F0, y - .12, zz, zz + .25, 'altar'); bx('altar', x0, x1, y - .12, y, z0, z1, 'altar'); bx('wool', x0 + .14, x1 - .14, y, y + .006, z0 - .02, z1 + .02); bx('wool', x0 + .14, x1 - .14, y - .3, y, z1 + .006, z1 + .012); bx('wool', x0 + .14, x1 - .14, y - .3, y, z0 - .012, z0 - .006);
    for (const zz of [z0 + .18, z0 + .42, z1 - .42, z1 - .18]) { const ch = .12 + r() * .1; put(new THREE.CylinderGeometry(.022, .024, ch, 8), 'wax', (x0 + x1) / 2 + .1, y + ch / 2, zz); put(new THREE.SphereGeometry(.014, 6, 5).scale(1, 2.2, 1), 'flame', (x0 + x1) / 2 + .1, y + ch + .03, zz); }
    put(new THREE.CylinderGeometry(.1, .065, .06, 14), 'crock', x0 + .15, y + .03, 0); }
  const pray = [altar.x0 - .75, 0];
  // two iron prickets each side of the altar, a ring of candles on each
  const prickets = []; for (const s of [-1, 1]) { const px = (altar.x0 + altar.x1) / 2, pz = s * 1.35; bx('iron', px - .2, px + .2, F0, F0 + .03, pz - .03, pz + .03); bx('iron', px - .03, px + .03, F0, F0 + .03, pz - .2, pz + .2); put(new THREE.CylinderGeometry(.015, .02, 1.15, 6), 'iron', px, F0 + .6, pz);
    put(new THREE.CylinderGeometry(.2, .2, .02, 14), 'iron', px, F0 + 1.18, pz); for (let k = 0; k < 6; k++) { const a = k / 6 * Math.PI * 2 + .3, ch = .08 + r() * .14, cx = px + Math.cos(a) * .14, cz = pz + Math.sin(a) * .14; put(new THREE.CylinderGeometry(.016, .018, ch, 6), 'wax', cx, F0 + 1.19 + ch / 2, cz); put(new THREE.SphereGeometry(.011, 5, 4).scale(1, 2.2, 1), 'flame', cx, F0 + 1.21 + ch, cz); }
    boxes.push({ tag: 'pricket', x0: px - .22, x1: px + .22, y0: F0, y1: F0 + 1.45, z0: pz - .22, z1: pz + .22 }); prickets.push([px, F0 + 1.3, pz]); }
  // stone benches along both side walls, between the slits, for the old and for vigils
  const benches = []; for (const s of [-1, 1]) { const b = { x0: -2.6, x1: .6, z0: s > 0 ? Z - .42 : -Z, z1: s > 0 ? Z : -Z + .42, y: F0 + .45 }; bx('altar', b.x0, b.x1, F0, b.y - .08, b.z0 + (s > 0 ? .06 : 0), b.z1 - (s > 0 ? 0 : .06), 'bench'); bx('stat', b.x0, b.x1, b.y - .08, b.y, b.z0, b.z1); benches.push(b); }
  // the bullaun by the door: a boulder with a hollow worn in it, holding rainwater, for the hands on the way in
  const bullaun = { x: -X + .75, z: -1.45 }; { const { x, z } = bullaun, g = new THREE.DodecahedronGeometry(.36, 1); g.scale(1.1, .85, 1); const P = g.attributes.position; for (let i = 0; i < P.count; i++) { const y = P.getY(i); P.setY(i, y > .18 ? .18 + (y - .18) * .2 : y); } g.computeVertexNormals();
    put(g, 'grit', x, .3, z, .4, .4); put(new THREE.CylinderGeometry(.13, .13, .01, 16), 'water', x, .49, z); boxes.push({ tag: 'bullaun', x0: x - .42, x1: x + .42, y0: 0, y1: .52, z0: z - .38, z1: z + .38 }); }
  // the rag rail on the south wall by the door: strips of cloth tied on for a sickness, a journey, a child
  const rags = { x0: -X + .45, x1: -2.75, z0: Z - .12, z1: Z, y: F0 + 1.7 }; { bx('oak', rags.x0, rags.x1, rags.y - .05, rags.y, rags.z0, rags.z1); for (const xx of [rags.x0 + .04, rags.x1 - .04]) bx('iron', xx - .01, xx + .01, rags.y - .05, rags.y + .04, Z - .02, Z);
    for (let k = 0, x = rags.x0 + .05; x < rags.x1 - .04; k++, x += .07 + r() * .05) { const len = .25 + r() * .4, g = new THREE.PlaneGeometry(.04 + r() * .03, len); put(g, k % 4 === 0 ? 'wool' : k % 5 === 1 ? 'linen' : 'rag', x, rags.y - .05 - len / 2, Z - .07 + (r() - .5) * .02, Math.PI + (r() - .5) * .6 /* turned to face the room */, .6, 0, (r() - .5) * .12); }
    boxes.push({ tag: 'rags', x0: rags.x0, x1: rags.x1, y0: rags.y - .7, y1: rags.y, z0: rags.z0, z1: Z }); }
  // the ledge on the north wall between the slits: small clay lamps, a carved figure or two, coins, left for the god
  const ledge = { x0: -.95, x1: 1.35, z0: -Z, z1: -Z + .22, y: F0 + 1.3 }; { bx('altar', ledge.x0, ledge.x1, ledge.y - .07, ledge.y, ledge.z0, ledge.z1, 'ledge'); bx('altar', ledge.x0 + .1, ledge.x0 + .2, ledge.y - .3, ledge.y - .07, -Z, -Z + .15); bx('altar', ledge.x1 - .2, ledge.x1 - .1, ledge.y - .3, ledge.y - .07, -Z, -Z + .15);
    for (let x = ledge.x0 + .12; x < ledge.x1 - .1; x += .22 + r() * .12) { const k = Math.floor(r() * 3); if (k === 0) { put(new THREE.CylinderGeometry(.045, .03, .04, 10), 'crock', x, ledge.y + .02, -Z + .11); put(new THREE.SphereGeometry(.009, 5, 4).scale(1, 2.2, 1), 'flame', x - .04, ledge.y + .06, -Z + .11); }
      else if (k === 1) { put(new THREE.CylinderGeometry(.03, .045, .16, 8), 'stat', x, ledge.y + .08, -Z + .1); put(new THREE.SphereGeometry(.03, 8, 6), 'stat', x, ledge.y + .19, -Z + .1); }
      else for (let j = 0; j < 3; j++) put(new THREE.CylinderGeometry(.012, .012, .004, 8), 'steel', x + j * .02, ledge.y + .002 + j * .004, -Z + .1); } }
  // the roof: four couples, each a pair of blades with a collar and a tie beam at the wall plate; a purlin either side; the lamp
  const TB = h - .2, L2 = Z / Math.cos(p), CY = under(Z * .4); for (const x of [-2.6, -.8, 1.0, 2.8]) { for (const s of [-1, 1]) { const g = new THREE.BoxGeometry(.13, .18, L2 - .35); g.rotateX(s * p); put(g, 'oak', x, under(s * (Z / 2 + .1)) - .2, s * (Z / 2 + .1)); /* clear of the ridge and the wall's face */ }
    bx('oak', x - .09, x + .09, TB, h - .02, -Z, Z); bx('oak', x - .07, x + .07, CY - .3, CY - .14, -Z * .4, Z * .4); }
  for (const s of [-1, 1]) { const zz = s * Z * .55; put(new THREE.BoxGeometry(plan.w - 2 * t, .14, .16), 'oak', 0, under(zz) - .28, zz); }
  const lamp = [1.0, TB - 1.0, 0]; bx('iron', lamp[0] - .005, lamp[0] + .005, lamp[1] + .08, TB, -.005, .005); put(new THREE.CylinderGeometry(.16, .1, .08, 12), 'iron', ...lamp); put(new THREE.SphereGeometry(.07, 10, 6).scale(1, .4, 1), 'glow', lamp[0], lamp[1] + .04, lamp[2]);
  for (let k = 0; k < 3; k++) { const a = k / 3 * Math.PI * 2; bx('iron', lamp[0] + Math.cos(a) * .14 - .004, lamp[0] + Math.cos(a) * .14 + .004, lamp[1], lamp[1] + .12, Math.sin(a) * .14 - .004, Math.sin(a) * .14 + .004); }
  // the door's leaf, hung open against the gable inside, south of the doorway
  const door = plan.open.left[0]; bx('paint', -X, -X + .06, F0, F0 + door.h - .1, door.w / 2 + .03, door.w / 2 + .03 + door.w, 'leaf');
  // the windows are clear from inside
  { const G = glMats().glass, Lt = glMats().lit; shell.traverse(m => { if (m.isMesh && (m.material === G || m.material === Lt)) { m.material = mats().pane; m.name = 'pane'; } }); }
  const group = new THREE.Group(); let tris = 0; for (const [k, gs] of B) { const g = mergeGeometries(gs, false); gs.forEach(x => x.dispose()); const m = new THREE.Mesh(g, M[k]); m.name = k; m.castShadow = !['flame', 'glow', 'water'].includes(k); m.receiveShadow = true; group.add(m); tris += g.attributes.position.count / 3; }
  const all = new THREE.Group(); all.add(shell, group);
  const windows = Object.entries(plan.open).flatMap(([f, os]) => (os || []).filter(q => q.kind === 'win').map(q => ({ face: f, x: f === 'front' ? q.x : f === 'back' ? -q.x : plan.w / 2, z: f === 'front' ? plan.d / 2 : f === 'back' ? -plan.d / 2 : -q.x, y: q.y, w: q.w, h: q.h })));
  const paths = [[[-X + .3, 0], [pray[0], 0]], [[-X + .3, 0], [-1.0, -.3], [-1.0, -Z + .7]], [[-X + .3, 0], [-1.6, .3], [-1.6, Z - .7]], [[pray[0], 0], [pray[0] - .2, -1.0], [ledge.x1 - .3, -Z + .65]]];
  return { group: all, shell, room: group, tris: Math.round(tris), draws: group.children.length, shellTris: shell.userData.tris, shellCalls: shell.userData.calls, inner: { x0: -X, x1: X, z0: -Z, z1: Z }, under, floor: F0, eave: h, tieBeam: TB,
    god, door: { x: -plan.w / 2, z: 0, w: door.w, h: door.h }, dais, plinth, statue: { x: sx, z: 0, y0, y1: y0 + SH, face: -1, icon }, altar, pray, prickets, lamp, bullaun, benches, rags, ledge, paths, boxes, windows, w: plan.w, d: plan.d };
}

// ── Aurenne's church (Session 947, card F9; OG-043's Aurenne temple, OG-061's domed hall; the canon's §1.3 and §3: the Church of the
// Weaver, whose sign is the shuttle, and which blesses the dead into the gates). Built inside pieces.js's aurenneChurch (a town's: the
// cube of 14 m, the drum and the blue dome) with o.interior: the ceiling open in an oculus into the drum, the dome painted inside.
// The nave: a limestone floor with a roundel of tile under the dome; the bier of the dead under the oculus with its pall and four tall
// candlesticks; cedar benches either side of the aisle by the door; the sanctuary raised at the back, the altar on it under the gilt
// shuttle hung on chains, the lectern and its great book, a panel of tile behind; a ring of lamps under the dome; a tile dado round
// the walls; the great door's leaves open inside. aurenneChurchHall(o, r) -> { group, shell, room, tris, draws, inner, floor, ceil,
// oculus {r, y}, bier, sanctuary, altar, shuttle, lectern, benches, ring, door, paths, boxes, windows, w, d }
export function aurenneChurchHall(o = {}, r = stream('church')) {
  const C = aurenneChurch({ rank: 'town', w: 14, tower: 1, interior: true }, stream(o.shell || 'church-shell')), I = C.inner, shell = C.group;
  const M = { ...homeMats(), gold: new THREE.MeshStandardMaterial({ color: 0xc8952e, roughness: .3, metalness: .75 }), wax: new THREE.MeshStandardMaterial({ color: 0xeee2c4, roughness: .6 }), flame: mats().flame, glow: mats().glow, linen: mats().linen,
    marble: mat('plaster', { ns: .25, color: 0xf2eee6, rough: .3 }), iron: mats().iron }, B = new Map(), boxes = [];
  const X = I.W / 2 - I.T, Z = I.D / 2 - I.T, F0 = I.pl, CEIL = I.top;
  const put = (geo, key, x = 0, y = 0, z = 0, ry = 0, uv = .6, rx = 0, rz = 0) => { const g = geo.index ? geo.toNonIndexed() : geo; for (const k of Object.keys(g.attributes)) if (!['position', 'normal'].includes(k)) g.deleteAttribute(k);
    g.applyMatrix4(new THREE.Matrix4().compose(new THREE.Vector3(x, y, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(rx, ry, rz)), new THREE.Vector3(1, 1, 1))); worldUV(g, uv); if (!B.has(key)) B.set(key, []); B.get(key).push(g); return g; };
  const bx = (key, x0, x1, y0, y1, z0, z1, tag) => { put(new THREE.BoxGeometry(x1 - x0, y1 - y0, z1 - z0), key, (x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2); if (tag) boxes.push({ tag, x0, x1, y0, y1, z0, z1 }); };
  const chain = (x, y0, y1, z) => bx('iron', x - .012, x + .012, y0, y1, z - .012, z + .012);
  // the floor: limestone, and under the dome a roundel of tile in a ring of marble
  bx('limestone', -X, X, F0, F0 + .03, -Z, Z); put(new THREE.CylinderGeometry(2.6, 2.6, .012, 40), 'marble', 0, F0 + .036, 0, 0, .5); put(new THREE.CylinderGeometry(2.3, 2.3, .014, 40), 'zellige', 0, F0 + .038, 0, 0, .9);
  // the tile dado round the walls, 1.4 m high, broken at the great door
  const dado = 1.4, dw = 1.3 + .45; for (const [x0, x1, z0, z1] of [[-X, X, -Z, -Z + .02], [-X, -X + .02, -Z, Z], [X - .02, X, -Z, Z], [-X, -dw, Z - .02, Z], [dw, X, Z - .02, Z]]) bx('zellige', x0, x1, F0, F0 + dado, z0, z1);
  for (const [x0, x1, z0, z1] of [[-X, X, -Z, -Z + .05], [-X, -X + .05, -Z, Z], [X - .05, X, -Z, Z], [-X, -dw, Z - .05, Z], [dw, X, Z - .05, Z]]) bx('step', x0, x1, F0 + dado, F0 + dado + .06, z0, z1);
  // the sanctuary at the back: a platform two steps up across the back wall, the altar on it, a panel of tile behind it under the middle window
  const SY = F0 + .32, sanctuary = { x0: -4.2, x1: 4.2, z0: -Z, z1: -3.3, y: SY }; bx('step', sanctuary.x0, sanctuary.x1, F0, SY, -Z, sanctuary.z1, 'sanctuary'); bx('step', -2.4, 2.4, F0, F0 + .16, sanctuary.z1, sanctuary.z1 + .34, 'sanctuary');
  bx('zellige', -2.3, 2.3, SY + dado, SY + 2.7, -Z, -Z + .03); for (const [x0, x1, y0, y1] of [[-2.4, 2.4, SY + 2.7, SY + 2.82], [-2.42, -2.3, SY + dado, SY + 2.82], [2.3, 2.42, SY + dado, SY + 2.82]]) bx('gold', x0, x1, y0, y1, -Z, -Z + .05);
  const altar = { x0: -1.0, x1: 1.0, z0: -4.6, z1: -3.85, y: SY + 1.0 }; { const { x0, x1, z0, z1, y } = altar; bx('marble', x0 + .08, x1 - .08, SY, y - .1, z0 + .08, z1 - .08, 'altar'); bx('marble', x0, x1, y - .1, y, z0, z1, 'altar'); bx('zellige', x0 + .2, x1 - .2, SY + .15, y - .25, z1 - .07, z1 - .06);
    bx('linen', x0 + .05, x1 - .05, y, y + .005, z0 + .05, z1 - .05); for (const xx of [x0 + .25, x1 - .25]) { put(new THREE.CylinderGeometry(.06, .09, .35, 10), 'gold', xx, y + .175, (z0 + z1) / 2); put(new THREE.CylinderGeometry(.03, .03, .3, 8), 'wax', xx, y + .5, (z0 + z1) / 2); put(new THREE.SphereGeometry(.018, 6, 5).scale(1, 2.2, 1), 'flame', xx, y + .69, (z0 + z1) / 2); }
    bx('indigo', -.25, .25, y, y + .06, (z0 + z1) / 2 - .17, (z0 + z1) / 2 + .17); bx('saffron', -.24, .24, y + .06, y + .065, (z0 + z1) / 2 - .16, (z0 + z1) / 2 + .16); }
  // the Weaver's sign: a gilt shuttle 2.2 m long hung level over the altar on two chains from the ceiling, a bobbin of gold thread in it
  const shuttle = { x: 0, y: SY + 3.6, z: (altar.z0 + altar.z1) / 2, L: 2.2 }; { const { x, y, z, L } = shuttle, h = L / 2, g = new THREE.LatheGeometry([[.001, -h], [.06, -h * .82], [.17, -h * .4], [.2, 0], [.17, h * .4], [.06, h * .82], [.001, h]].map(([a, b]) => new THREE.Vector2(a, b)), 16);
    g.scale(1, 1, .6); put(g, 'gold', x, y, z, 0, .6, 0, Math.PI / 2); put(new THREE.CylinderGeometry(.08, .08, .5, 12), 'saffron', x, y, z, 0, .6, 0, Math.PI / 2); for (const dx of [-.7, .7]) chain(x + dx, y + .1, CEIL, z); }
  // the lectern on the sanctuary's left: a cedar post and a sloped desk with the great book open on it
  const lectern = { x: -2.9, z: -3.95, y: SY + 1.12 }; { const { x, z, y } = lectern; bx('cedarD', x - .25, x + .25, SY, SY + .06, z - .25, z + .25, 'lectern'); put(new THREE.CylinderGeometry(.06, .08, 1.0, 8), 'cedarD', x, SY + .55, z);
    const desk = put(new THREE.BoxGeometry(.6, .04, .45), 'cedarD', x, y - .02, z, 0, .6, -.35); const bk = put(new THREE.BoxGeometry(.5, .06, .36), 'linen', x, y + .03, z + .02, 0, .6, -.35); bx('madder', x - .02, x + .02, y + .02, y + .07, z - .19, z + .21); }
  // the bier of the dead under the oculus: a marble slab on two trestles of cedar, a pall of indigo with a saffron border, a
  // candlestick at each corner
  const bier = { x0: -.45, x1: .45, z0: -1.05, z1: 1.05, y: F0 + .72 }; { const { x0, x1, z0, z1, y } = bier; for (const zz of [z0 + .2, z1 - .28]) { bx('cedarD', x0 + .05, x1 - .05, y - .2, y - .12, zz, zz + .08, 'bier'); for (const xx of [x0 + .07, x1 - .13]) bx('cedarD', xx, xx + .06, F0, y - .12, zz, zz + .08, 'bier'); }
    bx('marble', x0, x1, y - .12, y, z0, z1, 'bier'); bx('indigo', x0 - .06, x1 + .06, y, y + .01, z0 + .1, z1 - .1); for (const s of [-1, 1]) { bx('indigo', s > 0 ? x1 + .05 : x0 - .06, s > 0 ? x1 + .06 : x0 - .05, y - .42, y + .01, z0 + .1, z1 - .1); bx('saffron', s > 0 ? x1 + .055 : x0 - .065, s > 0 ? x1 + .065 : x0 - .055, y - .44, y - .36, z0 + .1, z1 - .1); }
    for (const [sx, sz] of [[-1, -1], [-1, 1], [1, -1], [1, 1]]) { const cx = sx * .78, cz = sz * 1.3; put(new THREE.CylinderGeometry(.14, .17, .06, 12), 'gold', cx, F0 + .06, cz); put(new THREE.CylinderGeometry(.025, .035, 1.25, 8), 'gold', cx, F0 + .68, cz); put(new THREE.CylinderGeometry(.07, .03, .06, 10), 'gold', cx, F0 + 1.32, cz);
      put(new THREE.CylinderGeometry(.03, .032, .26, 8), 'wax', cx, F0 + 1.48, cz); put(new THREE.SphereGeometry(.018, 6, 5).scale(1, 2.2, 1), 'flame', cx, F0 + 1.64, cz); boxes.push({ tag: 'candlestick', x0: cx - .17, x1: cx + .17, y0: F0, y1: F0 + 1.66, z0: cz - .17, z1: cz + .17 }); } }
  // the ring of lamps under the dome: a bronze hoop on chains from the dome's crown, twelve lamps of glass with a flame in each
  const ring = { y: F0 + 4.2, r: 1.7 }; { put(new THREE.TorusGeometry(ring.r, .04, 6, 36), 'gold', 0, ring.y, 0, 0, .6, Math.PI / 2); chain(0, ring.y + 1.2, I.crown - .05, 0);
    for (let k = 0; k < 4; k++) { const a = k / 4 * Math.PI * 2 + .4, ex = Math.cos(a) * ring.r, ez = Math.sin(a) * ring.r, g = new THREE.CylinderGeometry(.008, .008, Math.hypot(ring.r, 1.2), 4); g.rotateZ(Math.atan2(ring.r, 1.2)); g.rotateY(-a); put(g, 'iron', ex / 2, ring.y + .6, ez / 2); }
    for (let k = 0; k < 12; k++) { const a = k / 12 * Math.PI * 2, lx = Math.cos(a) * ring.r, lz = Math.sin(a) * ring.r; put(new THREE.CylinderGeometry(.06, .03, .12, 8), 'glow', lx, ring.y - .05, lz); } }
  // cedar benches either side of the aisle, four rows, back from the door
  const benches = []; for (let k = 0; k < 4; k++) { const z0 = 2.5 + k * .85; for (const [x0, x1] of [[-4.6, -1.0], [1.0, 4.6]]) { const b = { x0, x1, z0, z1: z0 + .38, y: F0 + .45 }; bx('cedar', x0, x1, b.y - .05, b.y, z0, b.z1, 'bench'); for (const xx of [x0 + .1, x1 - .16]) bx('cedar', xx, xx + .06, F0, b.y - .05, z0 + .04, b.z1 - .04);
    bx('cedar', x0, x1, b.y + .3, b.y + .42, b.z1 - .04, b.z1); for (const xx of [x0 + .1, x1 - .16]) bx('cedar', xx, xx + .06, b.y, b.y + .42, b.z1 - .05, b.z1); benches.push(b); } }
  // the ceiling lined in limewash round the oculus, a gilt ring at its edge; gilt stars over the dome's night blue
  { const sq = new THREE.Shape(); sq.moveTo(-X, -Z); sq.lineTo(X, -Z); sq.lineTo(X, Z); sq.lineTo(-X, Z); sq.lineTo(-X, -Z); const hole = new THREE.Path(); hole.absarc(0, 0, I.Ri, 0, Math.PI * 2, true); sq.holes.push(hole);
    const g = new THREE.ExtrudeGeometry(sq, { depth: .03, bevelEnabled: false, curveSegments: 36 }); g.rotateX(-Math.PI / 2); put(g, 'plaster', 0, CEIL - .03, 0, 0, .5); put(new THREE.TorusGeometry(I.Ri + .02, .07, 6, 36), 'gold', 0, CEIL - .06, 0, 0, .6, Math.PI / 2);
    for (let k = 0; k < 70; k++) { const a = r() * Math.PI * 2, e = Math.asin(.12 + r() * .8), rr = (I.Ri - .04) * Math.cos(e), y = I.y0 + I.dh + (I.Ri - .04) * 1.12 * Math.sin(e); put(new THREE.OctahedronGeometry(.05 + r() * .04, 0), 'gold', Math.cos(a) * rr, y, Math.sin(a) * rr, r() * 3); } }
  // the great door's two leaves, open inside against the front wall
  const dW = C.door.w; for (const s of [-1, 1]) bx('cedarD', s > 0 ? dW / 2 + .02 : -dW / 2 - .02 - dW / 2, s > 0 ? dW / 2 + .02 + dW / 2 : -dW / 2 - .02, F0, F0 + C.door.h - dW / 2, Z - .1, Z - .02, 'leaf');
  const group = new THREE.Group(); let tris = 0; for (const [k, gs] of B) { const g = mergeGeometries(gs, false); gs.forEach(x => x.dispose()); const m = new THREE.Mesh(g, M[k]); m.name = k; m.castShadow = !['flame', 'glow'].includes(k); m.receiveShadow = true; group.add(m); tris += g.attributes.position.count / 3; }
  const all = new THREE.Group(); all.add(shell, group);
  const paths = [[[0, Z - .3], [0, bier.z1 + .5]], [[0, Z - .3], [0, 2.05], [2.0, 2.05], [2.0, -2.05], [0, sanctuary.z1 + .65]], [[0, Z - .3], [0, 2.05], [-2.0, 2.05], [-2.0, -2.05], [-.6, sanctuary.z1 + .65]], [[0, 2.05], [-4.9, 2.05]]];
  return { group: all, shell, room: group, tris: Math.round(tris), draws: group.children.length, shellTris: C.tris, shellCalls: C.draws, inner: { x0: -X, x1: X, z0: -Z, z1: Z }, floor: F0, ceil: CEIL, oculus: { r: I.Ri, y: I.y0, crown: I.crown },
    bier, sanctuary, altar, shuttle, lectern, benches, ring, door: { x: 0, z: I.D / 2, w: C.door.w, h: C.door.h }, paths, boxes, w: I.W, d: I.D, front: C.front };
}

// ── Aurenne's library (Session 948, card F9; OG-043's Aurenne library and academy; the canon's §1.3: "the academy's white towers", the
// Mages' academy in Aurenne, "ledgers, learning, paper over oaths"). Built inside pieces.js's aurenneAcademy (the long hall of 30 by 13 m,
// 10.5 m high, its front an arcade of nine arches, three towers rising out of its back) with o.interior. The arches stay open: a loggia
// runs behind them, and a cedar lattice screen with three doorways closes the reading hall off from it. In the hall: cedar presses of
// codices and scrolls along the walls between the windows and the towers' round feet, a rolling ladder, four long reading tables
// with benches and brass lamps, two copyists' sloped desks, a brass armillary sphere in the middle (the observatory over it), window
// seats, rugs, painted beams across the ceiling, and a tile dado round the towers' feet.
// aurenneLibrary(o, r) -> { group, shell, room, tris, draws, inner, floor, ceil, screen {z, doors: [x]}, presses, tables, desks,
//   armillary, lamps, towers, ladder, paths, boxes, w, d }
let LIBLAT = null, LIBSP = null;
// a metre of spines for a press's shelves (Session 948; shared with the Mages' Guild since Session 966)
function libSpines() {
  if (!LIBSP) { /* a metre of spines: codices of every width in leathers and dyed cloth, two gilt bands on each, the tops uneven */ const c = document.createElement('canvas'); c.width = 512; c.height = 128; const x = c.getContext('2d'), q = stream('library-spines'), hues = ['#5a2a1c', '#6e3a22', '#3a2418', '#7a1e1a', '#26386e', '#2a4a3a', '#8a5a2a', '#4a2a3a', '#9a7a4a'];
    x.fillStyle = '#140c08'; x.fillRect(0, 0, 512, 128); for (let u = 0; u < 512;) { const w = 10 + Math.floor(q() * 22), top = Math.floor(q() * 26); x.fillStyle = hues[Math.floor(q() * hues.length)]; x.fillRect(u + 1, top, w - 2, 128 - top);
      x.fillStyle = 'rgba(214,170,80,.85)'; for (const y of [top + 14, 112]) x.fillRect(u + 2, y, w - 4, 3); x.fillStyle = 'rgba(255,255,255,.08)'; x.fillRect(u + 2, top, 2, 128 - top); u += w; }
    LIBSP = new THREE.CanvasTexture(c); LIBSP.colorSpace = THREE.SRGBColorSpace; LIBSP.wrapS = LIBSP.wrapT = THREE.RepeatWrapping; }
  return LIBSP;
}
export function aurenneLibrary(o = {}, r = stream('library')) {
  const A = aurenneAcademy({ w: 30, towers: 3, interior: true }, stream(o.shell || 'library-shell')), I = A.inner, shell = A.group;
  if (!LIBLAT) { const c = document.createElement('canvas'); c.width = c.height = 128; const x = c.getContext('2d'); x.fillStyle = '#8a5a36'; x.fillRect(0, 0, 128, 128); x.globalCompositeOperation = 'destination-out';
    /* an eight-pointed star in each cell of the lattice, a small square at each crossing */ for (const [cx, cy] of [[32, 32], [96, 32], [32, 96], [96, 96]]) for (const a of [0, Math.PI / 4]) { x.save(); x.translate(cx, cy); x.rotate(a); x.fillRect(-15, -15, 30, 30); x.restore(); }
    for (const [cx, cy] of [[0, 0], [64, 0], [128, 0], [0, 64], [64, 64], [128, 64], [0, 128], [64, 128], [128, 128]]) x.fillRect(cx - 7, cy - 7, 14, 14); LIBLAT = new THREE.CanvasTexture(c); LIBLAT.colorSpace = THREE.SRGBColorSpace; LIBLAT.wrapS = LIBLAT.wrapT = THREE.RepeatWrapping; }
  libSpines();
  const H0 = homeMats(), M = { ...H0, gold: new THREE.MeshStandardMaterial({ color: 0xc8952e, roughness: .3, metalness: .75 }), flame: mats().flame, glow: mats().glow, linen: mats().linen, iron: mats().iron,
    lattice: new THREE.MeshStandardMaterial({ map: LIBLAT, alphaTest: .5, side: THREE.DoubleSide, roughness: .7 }), vellum: mat('plaster', { ns: .2, color: 0xe6d8b4, rough: 1 }), spines: mat('wood', { ns: .5, color: 0x6a3a26, rough: .8 }), books: new THREE.MeshStandardMaterial({ map: LIBSP, roughness: .8 }), scroll: mat('plaster', { ns: .2, color: 0xd8c49a, rough: 1 }) },
    B = new Map(), boxes = [], X = I.W / 2 - I.T, Z = I.D / 2 - I.T, F0 = I.pl, CEIL = I.pl + I.H;
  const put = (geo, key, x = 0, y = 0, z = 0, ry = 0, uv = .6, rx = 0, rz = 0) => { const g = geo.index ? geo.toNonIndexed() : geo; for (const k of Object.keys(g.attributes)) if (!['position', 'normal', ...(key === 'lattice' ? ['uv'] : [])].includes(k)) g.deleteAttribute(k);
    g.applyMatrix4(new THREE.Matrix4().compose(new THREE.Vector3(x, y, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(rx, ry, rz)), new THREE.Vector3(1, 1, 1))); if (key !== 'lattice') worldUV(g, uv); if (!B.has(key)) B.set(key, []); B.get(key).push(g); return g; };
  const bx = (key, x0, x1, y0, y1, z0, z1, tag) => { const g = put(new THREE.BoxGeometry(x1 - x0, y1 - y0, z1 - z0), key, (x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2, 0, key === 'books' ? 1 : .6);
    if (key === 'books') { const U = g.attributes.uv, P = g.attributes.position; for (let i = 0; i < U.count; i++) U.setY(i, (P.getY(i) - y0) / (y1 - y0)); } if (tag) boxes.push({ tag, x0, x1, y0, y1, z0, z1 }); };
  // the shell's own pieces inside: the stone bench under the arcade and the towers' feet (their radius at the foot)
  const Bn = I.bench; boxes.push({ tag: 'loggiabench', x0: Bn.x0, x1: Bn.x1, y0: F0, y1: Bn.y, z0: Bn.z0, z1: Bn.z1 }); for (const T of I.towers) boxes.push({ tag: 'tower', x0: T.x - T.r, x1: T.x + T.r, y0: F0, y1: CEIL, z0: -Z, z1: Math.min(T.z + T.r, Z) });
  // the floor: terracotta tiles; rugs at the tables; the tile dado round each tower's foot
  bx('tile', -X, X, F0, F0 + .03, -Z, Z); for (const T of I.towers) { /* only the arc that stands in the room, in front of the back wall */ const h = Math.acos(Math.min(1, (-Z - T.z) / (T.r + .05))) - .02; put(new THREE.CylinderGeometry(T.r + .02, T.r + .02, 1.3, 32, 1, true, -h, 2 * h), 'zellige', T.x, F0 + .65, T.z, 0, .9); put(new THREE.CylinderGeometry(T.r + .05, T.r + .05, .06, 32, 1, true, -h, 2 * h), 'step', T.x, F0 + 1.33, T.z); }
  // the screen: a cedar frame and lattice from wall to wall behind the arcade, three doorways (the middle one on the arcade's middle arch)
  const SZ = 3.4, SH = 3.3, doors = [-10, 0, 10], dw = 1.5; { let x0 = -X; for (const dx of [...doors, X + dw / 2]) { const x1 = Math.min(X, dx - dw / 2); if (x1 - x0 > .05) { const g = new THREE.PlaneGeometry(x1 - x0, SH - .5); const uv = g.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * (x1 - x0) / .8, uv.getY(i) * (SH - .5) / .8); put(g, 'lattice', (x0 + x1) / 2, F0 + .5 + (SH - .5) / 2, SZ);
        bx('cedarD', x0, x1, F0, F0 + .5, SZ - .05, SZ + .05, 'screen'); bx('cedarD', x0, x1, F0 + SH, F0 + SH + .12, SZ - .06, SZ + .06); } x0 = dx + dw / 2; }
    for (const dx of doors) for (const s of [-1, 1]) bx('cedarD', dx + s * dw / 2 - .06, dx + s * dw / 2 + .06, F0, F0 + SH, SZ - .07, SZ + .07, 'screen');
    for (const dx of doors) { bx('cedarD', dx - dw / 2, dx + dw / 2, F0 + 2.5, F0 + 2.62, SZ - .06, SZ + .06); const g = new THREE.PlaneGeometry(dw, SH - 2.62); const uv = g.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * dw / .8, uv.getY(i) * (SH - 2.62) / .8); put(g, 'lattice', dx, F0 + 2.62 + (SH - 2.62) / 2, SZ); } }
  // the presses: cedar cases 2.7 m high and 0.45 deep, five shelves of codices and scroll racks, in the gaps the windows and the towers leave
  const presses = [], side = [[-3.35, -.55], [.55, 3.25]] /* the end towers stand within a metre of the side walls: the corner by them is left bare */, back = [[-8.9, -6.15], [-5.15, -2.95], [2.95, 5.15], [6.15, 8.9]], PH = 2.7, PD = .45;
  const press = (x0, x1, z0, z1, alongX) => { boxes.push({ tag: 'press', x0, x1, y0: F0, y1: F0 + PH, z0, z1 }); const len = alongX ? x1 - x0 : z1 - z0, face = alongX ? (z0 < 0 ? z1 : z0) : (x0 < 0 ? x1 : x0), dir = alongX ? (z0 < 0 ? -1 : 1) : (x0 < 0 ? -1 : 1);
    /* the case: its back against the wall, two ends, a top and a plinth, open to the room */ if (alongX) { const bz = face + dir * PD; bx('cedarD', x0, x1, F0, F0 + PH, Math.min(bz, bz - dir * .04), Math.max(bz, bz - dir * .04)); for (const xx of [x0, x1 - .05]) bx('cedarD', xx, xx + .05, F0, F0 + PH, z0, z1); bx('cedarD', x0, x1, F0 + PH - .08, F0 + PH, z0, z1); bx('cedarD', x0, x1, F0, F0 + .1, z0, z1); }
    else { const bxx = face + dir * PD; bx('cedarD', Math.min(bxx, bxx - dir * .04), Math.max(bxx, bxx - dir * .04), F0, F0 + PH, z0, z1); for (const zz of [z0, z1 - .05]) bx('cedarD', x0, x1, F0, F0 + PH, zz, zz + .05); bx('cedarD', x0, x1, F0 + PH - .08, F0 + PH, z0, z1); bx('cedarD', x0, x1, F0, F0 + .1, z0, z1); }
    for (let k = 0; k < 6; k++) { const y = F0 + .12 + k * .43; if (k === 5) break; for (let u = .08; u < len - .12;) { const scrolls = r() < .18, w = scrolls ? .3 + r() * .2 : .5 + r() * .7, ht = .3 + r() * .06, key = 'books';
        const a = (alongX ? x0 : z0) + u, b = Math.min(a + w, (alongX ? x1 : z1) - .06);
        if (scrolls) for (let q = a + .05; q < b - .04; q += .09) for (let j = 0; j < 3; j++) { const g = new THREE.CylinderGeometry(.04, .04, PD - .1, 5); g.rotateX(Math.PI / 2); if (!alongX) g.rotateY(Math.PI / 2); put(g, 'scroll', alongX ? q : face + dir * .22, y + .05 + j * .085, alongX ? face + dir * .22 : q); }
        else if (alongX) bx(key, a, b, y, y + ht, Math.min(face, face + dir * .38), Math.max(face, face + dir * .38)); else bx(key, Math.min(face, face + dir * .38), Math.max(face, face + dir * .38), y, y + ht, a, b);
        u += w + .02; } if (alongX) bx('cedar', x0, x1, y - .03, y, Math.min(face, face + dir * .02), Math.max(face, face + dir * .02)); else bx('cedar', Math.min(face, face + dir * .02), Math.max(face, face + dir * .02), y - .03, y, z0, z1); }
    presses.push({ x0, x1, z0, z1 }); };
  for (const [z0, z1] of side) for (const sx of [-1, 1]) press(sx < 0 ? -X : X - PD, sx < 0 ? -X + PD : X, z0, z1, false);
  for (const [x0, x1] of back) press(x0, x1, -Z, -Z + PD, true);
  // the rolling ladder against the west presses
  const ladder = { x: -X + PD + .25, z: -2.0 }; { const { x, z } = ladder; for (const dz of [-.22, .22]) put(new THREE.BoxGeometry(.05, 2.84, .06), 'cedar', x - .1, F0 + 1.45, z + dz, 0, .6, 0, .16); for (let k = 0; k < 9; k++) bx('cedar', x - .2 + k * .045 - .02, x - .2 + k * .045 + .02, F0 + .3 + k * .3, F0 + .33 + k * .3, z - .22, z + .22);
    boxes.push({ tag: 'ladder', x0: -X + PD + .005 /* it leans on the press's face */, x1: x + .3, y0: F0, y1: F0 + 2.9, z0: z - .26, z1: z + .26 }); }
  // window seats under the side walls' low windows (between the presses), a cushion on each
  for (const sx of [-1, 1]) for (const [z0, z1] of [[-4.35, -3.5], [-.45, .45]]) { const x0 = sx < 0 ? -X : X - .5, x1 = sx < 0 ? -X + .5 : X; bx('step', x0, x1, F0, F0 + .4, z0, z1, 'seat'); bx(sx < 0 ? 'madder' : 'indigo', x0 + .03, x1 - .03, F0 + .4, F0 + .47, z0 + .03, z1 - .03); }
  // four long reading tables with a bench either side, a rug under each, a brass lamp, codices open and a scroll weighted flat
  const tables = [], lamps = []; for (const tx of [-10.5, -4.6, 4.6, 10.5]) { const t = { x0: tx - 1.8, x1: tx + 1.8, z0: -1.05, z1: -.05, y: F0 + .76 }; tables.push(t); bx('rug', t.x0 - .4, t.x1 + .4, F0 + .03, F0 + .04, t.z0 - 1.0, t.z1 + 1.0);
    bx('cedar', t.x0, t.x1, t.y - .05, t.y, t.z0, t.z1, 'table'); for (const xx of [t.x0 + .1, t.x1 - .18]) for (const zz of [t.z0 + .08, t.z1 - .16]) bx('cedar', xx, xx + .08, F0, t.y - .05, zz, zz + .08);
    for (const [bz0, bz1] of [[t.z0 - .55, t.z0 - .2], [t.z1 + .2, t.z1 + .55]]) { bx('cedar', t.x0 + .1, t.x1 - .1, F0 + .41, F0 + .45, bz0, bz1, 'bench'); for (const xx of [t.x0 + .2, t.x1 - .26]) bx('cedar', xx, xx + .06, F0, F0 + .41, bz0 + .03, bz1 - .03); }
    for (let k = 0; k < 3; k++) { const cx = t.x0 + .6 + k * 1.2, cz = k % 2 ? t.z0 + .3 : t.z1 - .3; bx('vellum', cx - .22, cx + .22, t.y, t.y + .015, cz - .15, cz + .15); bx('spines', cx - .015, cx + .015, t.y, t.y + .03, cz - .16, cz + .16); }
    { const g = new THREE.CylinderGeometry(.06, .06, .5, 10); g.rotateZ(Math.PI / 2); put(g, 'scroll', tx + .3, t.y + .06, (t.z0 + t.z1) / 2); bx('scroll', tx - .4, tx + .3, t.y, t.y + .006, t.z0 + .25, t.z1 - .25); }
    put(new THREE.CylinderGeometry(.07, .09, .05, 10), 'gold', tx - .6, t.y + .025, (t.z0 + t.z1) / 2); put(new THREE.SphereGeometry(.06, 8, 6).scale(1.6, .7, 1), 'gold', tx - .6, t.y + .09, (t.z0 + t.z1) / 2); put(new THREE.SphereGeometry(.014, 6, 5).scale(1, 2.2, 1), 'flame', tx - .7, t.y + .14, (t.z0 + t.z1) / 2);
    const L = [tx, F0 + 3.4, (t.z0 + t.z1) / 2]; lamps.push(L); bx('iron', tx - .01, tx + .01, L[1] + .25, CEIL, L[2] - .01, L[2] + .01); put(new THREE.CylinderGeometry(.16, .12, .4, 8), 'gold', L[0], L[1] + .1, L[2]); put(new THREE.CylinderGeometry(.13, .1, .3, 8), 'glow', L[0], L[1] + .08, L[2]); put(new THREE.ConeGeometry(.2, .2, 8), 'gold', L[0], L[1] + .4, L[2]); }
  // two copyists' desks, sloped, by the screen: an inkhorn, a quill, a sheet half written, the codex it is copied from on a stand
  const desks = []; for (const dx of [-6.8, 6.8]) { const d = { x0: dx - .5, x1: dx + .5, z0: 1.6, z1: 2.25, y: F0 + .85 }; desks.push(d); for (const xx of [d.x0 + .04, d.x1 - .1]) bx('cedarD', xx, xx + .06, F0, d.y, d.z0 + .05, d.z1 - .05, 'desk');
    put(new THREE.BoxGeometry(1.0, .04, .7), 'cedarD', dx, d.y, (d.z0 + d.z1) / 2, 0, .6, -.25); put(new THREE.PlaneGeometry(.32, .44).rotateX(-Math.PI / 2 - .25), 'vellum', dx - .15, d.y + .03, (d.z0 + d.z1) / 2); put(new THREE.CylinderGeometry(.025, .03, .08, 8), 'iron', dx + .38, d.y + .1, d.z1 - .1);
    put(new THREE.ConeGeometry(.01, .3, 4), 'linen', dx + .38, d.y + .22, d.z1 - .1, 0, .6, .25, .2); bx('cedarD', dx - .05, dx + .05, F0, F0 + .45, d.z1 + .25, d.z1 + .6, 'stool'); }
  // the armillary sphere on its pedestal in the middle of the hall, its rings of brass: the meridian, the equator, the ecliptic, two colures
  const armillary = { x: 0, z: .6, y: F0 + 1.55, r: .5 }; { const { x, z, y, r: ar } = armillary; put(new THREE.CylinderGeometry(.35, .45, .1, 16), 'step', x, F0 + .05, z); put(new THREE.CylinderGeometry(.1, .14, .85, 12), 'step', x, F0 + .5, z); put(new THREE.CylinderGeometry(.22, .18, .1, 16), 'gold', x, F0 + .97, z);
    for (const [rx, ry, rz] of [[0, 0, 0], [Math.PI / 2, 0, 0], [Math.PI / 2, 0, .41], [0, Math.PI / 2, 0], [0, Math.PI / 4, 0]]) put(new THREE.TorusGeometry(ar, .015, 5, 40), 'gold', x, y, z, ry, .6, rx, rz);
    put(new THREE.CylinderGeometry(.012, .012, ar * 2.4, 6), 'gold', x, y, z, 0, .6, 0, .41); put(new THREE.SphereGeometry(.08, 10, 8), 'terra', x, y, z); bx('gold', x - .04, x + .04, F0 + 1.0, y - ar, z - .04, z + .04); boxes.push({ tag: 'armillary', x0: x - .55, x1: x + .55, y0: F0, y1: y + .6, z0: z - .55, z1: z + .55 }); }
  // the ceiling's painted beams across the hall
  for (let x = -X + 1.2; x < X - .5; x += 2.4) { /* a beam stops short of a tower it meets */ let z0 = -Z; for (const T of I.towers) { const dx = Math.max(0, Math.abs(x - T.x) - .13); if (dx < T.r) z0 = Math.max(z0, T.z + Math.sqrt(T.r * T.r - dx * dx) + .03); }
    bx('cedarD', x - .12, x + .12, CEIL - .3, CEIL, z0, Z); bx('indigo', x - .125, x + .125, CEIL - .2, CEIL - .14, z0, Z); }
  const group = new THREE.Group(); let tris = 0; for (const [k, gs] of B) { const g = mergeGeometries(gs, false); gs.forEach(x => x.dispose()); const m = new THREE.Mesh(g, M[k]); m.name = k; m.castShadow = !['flame', 'glow'].includes(k); m.receiveShadow = true; group.add(m); tris += g.attributes.position.count / 3; }
  const all = new THREE.Group(); all.add(shell, group);
  const arch = A.arches.find(x => x > 9), paths = [[[arch, Z + .3], [arch, Z - .4], [10, SZ + .5], [10, SZ - .5], [10, 1.0], [8.0, 1.0]], [[arch, Z - .4], [8.0, 4.4], [0, 4.4], [0, SZ - .5], [0, 1.4]], [[0, 1.4], [-2.3, 1.2], [-2.3, -2.2], [-7.5, -2.2]], [[-10, SZ - .5], [-10, 1.0], [-12.9, 1.0], [-12.9, -3.0]]];
  return { group: all, shell, room: group, tris: Math.round(tris), draws: group.children.length, shellTris: A.tris, shellCalls: A.draws, inner: { x0: -X, x1: X, z0: -Z, z1: Z }, floor: F0, ceil: CEIL,
    screen: { z: SZ, doors, w: dw, h: 2.5 }, presses, tables, desks, armillary, lamps, towers: I.towers, ladder, paths, boxes, w: I.W, d: I.D, front: A.front };
}

// ── the room over the market house (Session 1188, card F9; Michael's A on #475: the market house, two storeys, the arcade below). Built
// inside pieces.js's gatelandsMarket({ kind: 'house', interior: true }): 15 by 8.6 m outside, walls of 0.6 m, the floor on the arcade's
// beams at 3.6 m (the outside stair's landing), lime-plastered and ceiled at 2.85 m under the hipped slate. The ridge stack at x -4.6
// comes down a chimney breast to the floor (and on a pier through the arcade, pieces.js) and a lath partition runs across the room on
// it: east of it the town's room, 11.4 m long (a long table under two iron rings of candles, benches either side, a chair at its head,
// a hearth with two chairs at it, a press for the town's papers on the front wall, a sideboard, pegs by the stair door); west of it
// the clerk of the market's room (a desk under the west window, a press of the standard measures and weights with the yard on pegs
// over it, an iron-bound strongbox, a board of the tolls, a small grate). What the town uses its room for is left open (#475's text:
// a court, a hiring hall, the toll-taker); nothing in it is one of those. gatelandsMarketRoom(o, r) -> { group, shell, room, tris,
// draws, shellTris, shellCalls, inner, floor, ceil, door, stair, pier, breast, part, partDoor, hearth, fire, grate, table, benches,
// chairs, press, measures, desk, chest, rings, candle, paths, boxes, windows, w, d }
export function gatelandsMarketRoom(o = {}, r = stream('marketroom')) {
  const shell = gatelandsMarket({ kind: 'house', interior: true, r: stream('market-shell') }), U = shell.userData, P = U.arcade.plan, M = { ...mats(), dress: glMats().dress,
    plaster: mat('plaster', { ns: .35, color: 0xf0ebe0, rough: .95 }), wax: new THREE.MeshStandardMaterial({ color: 0xeee2c4, roughness: .6 }),
    brass: new THREE.MeshStandardMaterial({ color: 0xb8903e, roughness: .32, metalness: .85 }), board: mat('wood', { ns: .5, color: 0x2a3a30, rough: .7 }) }, B = new Map(), boxes = [];
  const t = P.t, X = P.w / 2 - t, Z = P.d / 2 - t, F = P.floors[0], CE = F + 2.85, h = F + P.floors[1];
  const put = (geo, key, x = 0, y = 0, z = 0, ry = 0, uv = .6, rx = 0, rz = 0) => { const g = geo.index ? geo.toNonIndexed() : geo; for (const k of Object.keys(g.attributes)) if (!['position', 'normal'].includes(k)) g.deleteAttribute(k);
    g.applyMatrix4(new THREE.Matrix4().compose(new THREE.Vector3(x, y, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(rx, ry, rz)), new THREE.Vector3(1, 1, 1))); worldUV(g, uv); if (!B.has(key)) B.set(key, []); B.get(key).push(g); return g; };
  const bx = (key, x0, x1, y0, y1, z0, z1, tag) => { put(new THREE.BoxGeometry(x1 - x0, y1 - y0, z1 - z0), key, (x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2); if (tag) boxes.push({ tag, x0, x1, y0, y1, z0, z1 }); };
  // the ceiling, lath and plaster, with a plain cornice round the walls
  bx('plaster', -X, X, CE, CE + .05, -Z, Z);
  for (const s of [-1, 1]) { bx('plaster', -X, X, CE - .1, CE, s > 0 ? Z - .09 : -Z, s > 0 ? Z : -Z + .09); bx('plaster', s > 0 ? X - .09 : -X, s > 0 ? X : -X + .09, CE - .1, CE, -Z + .09, Z - .09); }
  // the chimney breast on the ridge stack's line, floor to ceiling: the hall's fireplace on its east face, the clerk's grate on its west
  const breast = { x0: U.pier.x0, x1: U.pier.x1, z0: U.pier.z0, z1: U.pier.z1 }, fe = { z: .45, h: .9, d: .4 }, fw = { z: .3, h: .62, d: .3 };
  { const { x0, x1, z0, z1 } = breast; bx('lime', x0 + fw.d, x1 - fe.d, F, CE, z0, z1);
    bx('lime', x1 - fe.d, x1, F, F + fe.h, z0, -fe.z); bx('lime', x1 - fe.d, x1, F, F + fe.h, fe.z, z1); bx('lime', x1 - fe.d, x1, F + fe.h, CE, z0, z1);
    bx('lime', x0, x0 + fw.d, F, F + fw.h, z0, -fw.z); bx('lime', x0, x0 + fw.d, F, F + fw.h, fw.z, z1); bx('lime', x0, x0 + fw.d, F + fw.h, CE, z0, z1);
    boxes.push({ tag: 'breast', x0, x1, y0: F, y1: CE, z0, z1 });
    bx('soot', x1 - fe.d, x1 - fe.d + .02, F, F + fe.h, -fe.z, fe.z); bx('soot', x0 + fw.d - .02, x0 + fw.d, F, F + fw.h, -fw.z, fw.z); /* the backs of the fireplaces */
    // the east surround: dressed jambs and a lintel, the mantel shelf over; the hearthstones before both
    for (const s of [-1, 1]) bx('dress', x1, x1 + .06, F, F + fe.h, s * fe.z + (s > 0 ? 0 : -.2), s * fe.z + (s > 0 ? .2 : 0));
    bx('dress', x1, x1 + .06, F + fe.h, F + fe.h + .22, -fe.z - .2, fe.z + .2); bx('oak', x1, x1 + .2, F + 1.22, F + 1.27, -fe.z - .3, fe.z + .3);
    bx('dress', x1, x1 + .5, F, F + .03, -fe.z - .15, fe.z + .15); bx('dress', x0 - .4, x0, F, F + .03, -fw.z - .12, fw.z + .12); }
  // the grates: iron baskets of turf coals
  const grate = (x0, x1, z, w, key) => { bx('iron', x0, x1, F + .1, F + .13, -w, w); bx('iron', x0, x0 + .02, F + .13, F + .34, -w, w); for (const zz of [-w, w]) bx('iron', x0, x1, F, F + .34, zz - .015, zz + .015);
    for (let zz = -w + .05; zz < w - .02; zz += .06) bx('iron', x1 - .015, x1, F + .13, F + .34, zz - .008, zz + .008); for (let k = 0; k < 7; k++) put(new THREE.BoxGeometry(.09, .05, .07), 'ember', x0 + .04 + r() * (x1 - x0 - .08), F + .16 + r() * .05, (r() - .5) * (2 * w - .1), r() * 3);
    return [(x0 + x1) / 2, F + .22, z]; };
  const fire = grate(breast.x1 - fe.d + .04, breast.x1 - .06, 0, .3), grateW = grate(breast.x0 + .06, breast.x0 + fw.d - .04, 0, .2);
  put(new THREE.SphereGeometry(.05, 6, 4).scale(1, 2, 1), 'flame', fire[0], fire[1] + .1, -.06); put(new THREE.SphereGeometry(.04, 6, 4).scale(1, 2.2, 1), 'flame', fire[0] + .02, fire[1] + .09, .08);
  // the partition: lath and plaster on studs across the room on the breast's line, a door near the front wall, its leaf open into the clerk's room
  const PX = (breast.x0 + breast.x1) / 2, pt = .06, partDoor = { z0: 2.0, z1: 2.9, h: 2.05 };
  bx('lime', PX - pt, PX + pt, F, CE, -Z, breast.z0, 'partition'); bx('lime', PX - pt, PX + pt, F, CE, breast.z1, partDoor.z0, 'partition'); bx('lime', PX - pt, PX + pt, F, CE, partDoor.z1, Z, 'partition');
  bx('lime', PX - pt, PX + pt, F + partDoor.h, CE, partDoor.z0, partDoor.z1);
  for (const zz of [partDoor.z0, partDoor.z1]) bx('oak', PX - pt - .02, PX + pt + .02, F, F + partDoor.h + .07, zz - (zz === partDoor.z0 ? .07 : 0), zz + (zz === partDoor.z1 ? .07 : 0));
  bx('oak', PX - pt - .02, PX + pt + .02, F + partDoor.h, F + partDoor.h + .07, partDoor.z0, partDoor.z1);
  bx('paint', PX - pt - .06, PX - pt, F + .02, F + partDoor.h - .02, partDoor.z0 - .92, partDoor.z0 - .02, 'leaf');
  // skirting on the hall's walls and both faces of the partition
  for (const s of [-1, 1]) bx('oak', -X, X, F, F + .14, s > 0 ? Z - .025 : -Z, s > 0 ? Z : -Z + .025);
  // the stair door's leaf, ledged and braced, hung open inside against the east wall
  const sd = U.stair.door, door = { x: P.w / 2, z: sd.z, w: sd.w, h: sd.h, y: F }; bx('paint', X - .06, X, F + .02, F + sd.h - .04, sd.z - sd.w / 2 - sd.w + .02, sd.z - sd.w / 2 - .02, 'leaf');
  // the long table down the hall, benches either side, a chair at its head by the hearth
  const table = { x0: -1.4, x1: 3.4, z0: -.5, z1: .5, y: F + .76 }; { const { x0, x1, z0, z1, y } = table; bx('oak', x0, x1, y - .05, y, z0, z1, 'table'); for (const xx of [x0 + .12, x1 - .12, (x0 + x1) / 2]) for (const zz of [z0 + .1, z1 - .1]) bx('oak', xx - .04, xx + .04, F, y - .05, zz - .04, zz + .04);
    for (const zz of [z0 + .08, z1 - .08]) bx('oak', x0 + .1, x1 - .1, y - .14, y - .05, zz - .02, zz + .02); bx('oak', x0 + .1, x1 - .1, F + .18, F + .22, -.02, .02) /* the stretcher */; }
  const benches = []; for (const s of [-1, 1]) { const b = { x0: table.x0 + .2, x1: table.x1 - .2, z0: s > 0 ? .72 : -1.02, z1: s > 0 ? 1.02 : -.72, y: F + .45 }; bx('oak', b.x0, b.x1, b.y - .04, b.y, b.z0, b.z1, 'bench');
    for (const xx of [b.x0 + .15, b.x1 - .15, (b.x0 + b.x1) / 2]) bx('oak', xx - .03, xx + .03, F, b.y - .04, b.z0 + .04, b.z1 - .04); benches.push(b); }
  const chair = (x, z, face, key = 'oak', arms = false) => { const c = { x0: x - .23, x1: x + .23, z0: z - .23, z1: z + .23, y: F + .44 }; bx(key, c.x0, c.x1, c.y - .04, c.y, c.z0, c.z1, 'chair');
    for (const dx of [-.19, .19]) for (const dz of [-.19, .19]) bx(key, x + dx - .02, x + dx + .02, F, c.y - .04, z + dz - .02, z + dz + .02);
    const bxs = face === 'x+' ? x - .21 : face === 'x-' ? x + .21 : null, bzs = face === 'z+' ? z - .21 : face === 'z-' ? z + .21 : null;
    if (bxs != null) { for (const dz of [-.19, .19]) bx(key, bxs - .02, bxs + .02, c.y, F + 1.0, z + dz - .02, z + dz + .02); bx(key, bxs - .02, bxs + .02, F + .82, F + .96, z - .19, z + .19); }
    else { for (const dx of [-.19, .19]) bx(key, x + dx - .02, x + dx + .02, c.y, F + 1.0, bzs - .02, bzs + .02); bx(key, x - .19, x + .19, F + .82, F + .96, bzs - .02, bzs + .02); }
    if (arms) for (const dz of [-.21, .21]) bx(key, x - .2, x + .2, F + .64, F + .67, z + dz - .025, z + dz + .025);
    return c; };
  const chairs = [chair(table.x0 - .55, 0, 'x+', 'oak', true), chair(breast.x1 + .7, -1.3, 'z+', 'deal'), chair(breast.x1 + .7, 1.3, 'z-', 'deal')];
  // the town's press on the front wall where the name panel is outside (no window there): panelled doors, a cornice
  const press = { x0: -.8, x1: .8, z0: Z - .45, z1: Z, y: F + 2.1 }; { const { x0, x1, z0, z1, y } = press; bx('oak', x0, x1, F, y, z0, z1, 'press'); bx('oak', x0 - .04, x1 + .04, y, y + .07, z0 - .04, z1);
    for (const xx of [-.4, .4]) { bx('paint', xx - .34, xx + .34, F + .25, F + 1.1, z0 - .015, z0); bx('paint', xx - .34, xx + .34, F + 1.2, F + 1.95, z0 - .015, z0); } bx('iron', -.03, .03, F + 1.1, F + 1.2, z0 - .03, z0 - .015); }
  // the sideboard on the back wall between two windows: a jug and cups
  { const x0 = .75, x1 = 2.05, z0 = -Z, z1 = -Z + .45, y = F + .88; bx('oak', x0, x1, F + .12, y, z0 + .03, z1, 'sideboard'); bx('oak', x0 - .02, x1 + .02, y, y + .04, z0, z1 + .02); for (const xx of [x0 + .04, x1 - .04]) bx('oak', xx - .03, xx + .03, F, F + .12, z1 - .06, z1);
    put(new THREE.CylinderGeometry(.07, .09, .26, 12), 'crock', x0 + .3, y + .17, z0 + .25); for (let k = 0; k < 4; k++) put(new THREE.CylinderGeometry(.04, .035, .09, 10), 'delft', x0 + .6 + k * .15, y + .085, z0 + .22 + (r() - .5) * .06); }
  // pegs by the stair door for coats and hats
  { const z0 = sd.z + sd.w / 2 + .25, z1 = z0 + .9; bx('oak', X - .03, X, F + 1.6, F + 1.7, z0, z1); for (let zz = z0 + .12; zz < z1 - .05; zz += .22) bx('oak', X - .13, X - .03, F + 1.63, F + 1.67, zz - .015, zz + .015);
    put(new THREE.BoxGeometry(.06, .7, .34), 'wool', X - .1, F + 1.25, z0 + .34, 0, .6, 0, .05); }
  // two iron rings of candles over the table, hung from the ceiling on rods
  const rings = []; for (const x of [table.x0 + 1.3, table.x1 - 1.3]) { const y = F + 2.25; bx('iron', x - .01, x + .01, y + .02, CE, -.01, .01);
    put(new THREE.TorusGeometry(.42, .018, 6, 28).rotateX(Math.PI / 2), 'iron', x, y, 0); for (let k = 0; k < 4; k++) { const a = k / 4 * Math.PI * 2 + Math.PI / 4; bx('iron', x + Math.cos(a) * .21 - .006, x + Math.cos(a) * .21 + .006, y, y + .28, Math.sin(a) * .21 - .006, Math.sin(a) * .21 + .006); }
    for (let k = 0; k < 8; k++) { const a = k / 8 * Math.PI * 2, cx = x + Math.cos(a) * .42, cz = Math.sin(a) * .42, ch = .1 + r() * .08; put(new THREE.CylinderGeometry(.018, .02, ch, 6), 'wax', cx, y + .02 + ch / 2, cz); put(new THREE.SphereGeometry(.012, 5, 4).scale(1, 2.2, 1), 'flame', cx, y + .05 + ch, cz); }
    rings.push([x, y, 0]); }
  // the clerk's room: the desk under the west window, a stool, the ledger, the ink and a candle
  const desk = { x0: -X, x1: -X + .62, z0: 1.85, z1: 2.95, y: F + .78 }; { const { x0, x1, z0, z1, y } = desk; bx('oak', x0, x1, y - .04, y, z0, z1, 'desk'); bx('oak', x0, x1, F + .55, y - .04, z0, z0 + .04); bx('oak', x0, x1, F + .55, y - .04, z1 - .04, z1);
    for (const zz of [z0 + .02, z1 - .02]) bx('oak', x1 - .05, x1, F, F + .55, zz - .02, zz + .02); bx('oak', x0, x0 + .04, F, F + .55, z0, z1);
    bx('linen', x0 + .2, x0 + .5, y, y + .045, 2.15, 2.6); bx('oak', x0 + .2, x0 + .5, y + .045, y + .05, 2.15, 2.6); put(new THREE.CylinderGeometry(.03, .035, .05, 10), 'iron', x0 + .15, y + .025, 2.75); bx('linen', x0 + .148, x0 + .152, y + .05, y + .2, 2.749, 2.751); }
  const candle = [desk.x0 + .45, desk.y + .2, 2.05]; put(new THREE.CylinderGeometry(.05, .06, .02, 10), 'brass', candle[0], desk.y + .01, candle[2]); put(new THREE.CylinderGeometry(.018, .02, .16, 8), 'wax', candle[0], desk.y + .1, candle[2]); put(new THREE.SphereGeometry(.012, 5, 4).scale(1, 2.2, 1), 'flame', candle[0], desk.y + .2, candle[2]);
  const stool = { x0: -X + .85, x1: -X + 1.2, z0: 2.25, z1: 2.6, y: F + .46 }; bx('oak', stool.x0, stool.x1, stool.y - .04, stool.y, stool.z0, stool.z1, 'stool'); for (const dx of [.04, .31]) for (const dz of [.04, .31]) bx('oak', stool.x0 + dx - .02, stool.x0 + dx + .02, F, stool.y - .04, stool.z0 + dz - .02, stool.z0 + dz + .02);
  // the press of the standard measures: open shelves on the west wall (the bushel on the floor, the gallon to the gill, the weights stacked by size), the yard on two pegs over it
  const measures = { x0: -X, x1: -X + .45, z0: -1.7, z1: -.2, y: F + 1.95 }; { const { x0, x1, z0, z1, y } = measures; bx('oak', x0, x1, F, F + .04, z0, z1, 'measures'); bx('oak', x0, x1, y - .04, y, z0, z1); bx('oak', x0, x0 + .02, F, y, z0, z1);
    for (const zz of [z0, z1 - .04]) bx('oak', x0, x1, F, y, zz, zz + .04); boxes.push({ tag: 'measures', x0, x1, y0: F, y1: y, z0, z1 });
    const sh = [F + .55, F + 1.05, F + 1.5]; for (const yy of sh) bx('oak', x0, x1, yy - .03, yy, z0 + .04, z1 - .04);
    put(new THREE.CylinderGeometry(.2, .2, .32, 18, 1, true), 'brass', (x0 + x1) / 2, F + .2, (z0 + z1) / 2 - .2); put(new THREE.CylinderGeometry(.2, .2, .02, 18), 'brass', (x0 + x1) / 2, F + .05, (z0 + z1) / 2 - .2) /* the bushel */;
    [.13, .1, .08, .065, .05].forEach((rr, k) => put(new THREE.CylinderGeometry(rr, rr * 1.05, rr * 1.7, 14), 'brass', (x0 + x1) / 2, sh[0] + rr * .85, z0 + .16 + [0, .3, .54, .74, .9][k])) /* the gallon to the gill */;
    for (let k = 0, zz = z0 + .14; k < 6; k++) { const rr = .09 - k * .012, hh = rr * 1.1; put(new THREE.CylinderGeometry(rr, rr, hh, 12), 'brass', (x0 + x1) / 2, sh[1] + hh / 2, zz); zz += rr + .08 - k * .012; }
    for (let k = 0; k < 4; k++) put(new THREE.BoxGeometry(.24, .05, .33).translate(0, .025, 0), k % 2 ? 'linen' : 'oak', (x0 + x1) / 2, sh[2] + k * .05, z0 + .4 + (r() - .5) * .04, (r() - .5) * .08) /* the market's ledgers */;
    for (const zz of [z0 + .3, z0 + 1.21]) bx('oak', x0, x0 + .08, y + .25, y + .29, zz - .015, zz + .015); bx('brass', x0 + .05, x0 + .07, y + .29, y + .31, z0 + .3 - .05, z0 + .3 + .914 - .05) /* the yard */; }
  // the strongbox in the corner, iron-bound
  const chest = { x0: -X + .05, x1: -X + .75, z0: -Z + .05, z1: -Z + .52, y: F + .5 }; { const { x0, x1, z0, z1, y } = chest; bx('oak', x0, x1, F, y, z0, z1, 'chest'); for (const xx of [x0 + .12, x1 - .12]) bx('iron', xx - .025, xx + .025, F, y + .005, z0 - .005, z1 + .005);
    bx('iron', (x0 + x1) / 2 - .05, (x0 + x1) / 2 + .05, y - .16, y - .04, z1, z1 + .02); }
  // the board of the tolls on the partition's west face: painted dark, its lines in cream (unlettered here; the trade's words are the quest writer's)
  const tolls = { x: PX - pt, z0: -3.0, z1: -1.4, y0: F + 1.15, y1: F + 2.0 }; bx('board', tolls.x - .03, tolls.x, tolls.y0, tolls.y1, tolls.z0, tolls.z1); bx('oak', tolls.x - .04, tolls.x, tolls.y1, tolls.y1 + .04, tolls.z0 - .02, tolls.z1 + .02);
  for (let k = 0; k < 7; k++) { const yy = tolls.y1 - .14 - k * .1, l = k ? .9 + r() * .4 : .7; bx('linen', tolls.x - .035, tolls.x - .03, yy, yy + .02, (tolls.z0 + tolls.z1) / 2 - l / 2, (tolls.z0 + tolls.z1) / 2 + l / 2); }
  // the windows are clear from inside
  { const G = glMats().glass, Lt = glMats().lit; shell.traverse(m => { if (m.isMesh && (m.material === G || m.material === Lt)) { m.material = mats().pane; m.name = 'pane'; } }); }
  const group = new THREE.Group(); let tris = 0; for (const [k, gs] of B) { const g = mergeGeometries(gs, false); gs.forEach(x => x.dispose()); const m = new THREE.Mesh(g, M[k]); m.name = k; m.castShadow = !['flame', 'ember', 'glow'].includes(k); m.receiveShadow = true; group.add(m); tris += g.attributes.position.count / 3; }
  const all = new THREE.Group(); all.add(shell, group);
  const windows = Object.entries(P.open).flatMap(([f, os]) => (os || []).filter(q => q.kind === 'win' && q.y >= F).map(q => ({ face: f, x: f === 'front' ? q.x : f === 'back' ? -q.x : f === 'left' ? -P.w / 2 : P.w / 2, z: f === 'front' ? P.d / 2 : f === 'back' ? -P.d / 2 : f === 'left' ? q.x : -q.x, y: q.y, w: q.w, h: q.h })));
  const PZ = (partDoor.z0 + partDoor.z1) / 2, paths = [[[X - .35, sd.z], [-2.6, sd.z], [-2.6, 0], [breast.x1 + .6, 0]], [[X - .35, sd.z], [5.2, sd.z], [5.2, PZ], [PX + .4, PZ], [PX - .4, PZ], [stool.x1 + .2, PZ]],
    [[PX - .4, PZ], [-5.6, 1.0], [-5.75, -.95]], [[1.4, sd.z], [1.4, -2.95]]];
  return { group: all, shell, room: group, tris: Math.round(tris), draws: group.children.length, shellTris: U.tris, shellCalls: U.calls, inner: { x0: -X, x1: X, z0: -Z, z1: Z }, floor: F, ceil: CE, eave: h,
    door, stair: U.stair, pier: U.pier, breast, part: { x: PX, t: pt }, partDoor, hearth: [breast.x1, F, 0], fire, grate: grateW, table, benches, chairs, press, measures, desk, stool, chest, tolls, rings, candle, paths, boxes, windows, w: P.w, d: P.d };
}

// ── the Gatelands townhouse (Session 1189, card F9; OG-115's "townhouse" and "children's room with bunk beds", the last of the Gatelands'
// three homes; Michael's A on #303: the room inside the street's own shell). Built inside pieces.js's GL_PLANS.townhouse (6.4 by 9 m,
// walls of 0.45 m rendered outside, three storeys of 3.0, 2.9 and 2.6 m, a parapet roof of slate, the gables party walls with their
// stacks). The door is on the east bay (o.doorX 1.95; a lot's west-door house is this one mirrored), so the plan is the side-hall house:
// the hall runs back along the east wall to a dog-leg stair at the back (16 risers a storey, a half-landing against the back wall,
// stacked twice); west of it the parlour in front and the kitchen behind (its range, the back door to the yard); on the first floor the
// drawing room across the whole front and the dining room behind it, through double doors; on the second floor the bedroom across the
// front and the children's room behind (bunk beds, a toy chest). The walls are lined with lime plaster inside (the render is the
// street's), the ceilings plastered, the floors boarded (the kitchen and the hall flagged). The fires are on the west gable's four flues.
// gatelandsTownhouse(o, r) -> { group, shell, room, tris, draws, shellTris, shellCalls, inner, floors [F0, F1, F2], ceils, door, back, part,
//   steps [{x0, x1, z0, z1, y, fl, flight}], landings, well, slabs, fires, rooms, paths [{fl, pts}], boxes, lamps, windows, w, d }
export function gatelandsTownhouse(o = {}, r = stream('townhouse')) {
  const plan = GL_PLANS.townhouse({ doorX: 1.95, color: o.color || 'ochre', paint: o.paint || 'blue' }); plan.interior = true; plan.r = stream('townhouse-shell');
  plan.open.front[0].ajar = true; plan.open.back[0].ajar = true;
  const shell = gatelandsBuilding(plan), M = { ...mats(), dress: glMats().dress, plaster: mat('plaster', { ns: .35, color: 0xf2ede2, rough: .95 }), wax: new THREE.MeshStandardMaterial({ color: 0xeee2c4, roughness: .6 }),
    brass: new THREE.MeshStandardMaterial({ color: 0xb8903e, roughness: .32, metalness: .85 }), rug: mat('plaster', { ns: .3, color: 0x6a2a24, rough: 1 }) }, B = new Map(), boxes = [];
  const t = plan.t, X = plan.w / 2 - t, Z = plan.d / 2 - t, g = plan.floors, F0 = .03, F1 = g[0], F2 = g[0] + g[1], EAVE = g[0] + g[1] + g[2], SL = .25 /* a floor's depth, boards to ceiling */;
  const CE = [F1 - SL, F2 - SL, EAVE - .2], floors = [F0, F1, F2];
  const put = (geo, key, x = 0, y = 0, z = 0, ry = 0, uv = .6, rx = 0, rz = 0) => { const q = geo.index ? geo.toNonIndexed() : geo; for (const k of Object.keys(q.attributes)) if (!['position', 'normal'].includes(k)) q.deleteAttribute(k);
    q.applyMatrix4(new THREE.Matrix4().compose(new THREE.Vector3(x, y, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(rx, ry, rz)), new THREE.Vector3(1, 1, 1))); worldUV(q, uv); if (!B.has(key)) B.set(key, []); B.get(key).push(q); return q; };
  const bx = (key, x0, x1, y0, y1, z0, z1, tag, fl) => { put(new THREE.BoxGeometry(x1 - x0, y1 - y0, z1 - z0), key, (x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2); if (tag) boxes.push({ tag, x0, x1, y0, y1, z0, z1, fl }); };
  // ── the plaster lining of the four walls, floor to the top ceiling, with every opening cut through it and its reveal plastered to the frame
  const FACES = { front: [new THREE.Vector3(-1, 0, 0), new THREE.Vector3(0, 0, -1), [0, 0, Z - .004], X], back: [new THREE.Vector3(1, 0, 0), new THREE.Vector3(0, 0, 1), [0, 0, -Z + .004], X],
    left: [new THREE.Vector3(0, 0, -1), new THREE.Vector3(1, 0, 0), [-X + .004, 0, 0], Z], right: [new THREE.Vector3(0, 0, 1), new THREE.Vector3(-1, 0, 0), [X - .004, 0, 0], Z] };
  for (const [f, [U, N, P0, half]] of Object.entries(FACES)) { const s = new THREE.Shape(); s.moveTo(-half, F0 - .01); s.lineTo(half, F0 - .01); s.lineTo(half, CE[2] + .01); s.lineTo(-half, CE[2] + .01); s.lineTo(-half, F0 - .01);
    for (const q of plan.open[f] || []) { const u0 = -q.x - q.w / 2, u1 = -q.x + q.w / 2, y0 = Math.max(q.y, F0), y1 = q.y + q.h, h = new THREE.Path(); h.moveTo(u0, y0); h.lineTo(u0, y1); h.lineTo(u1, y1); h.lineTo(u1, y0); h.lineTo(u0, y0); s.holes.push(h);
      const dep = t - .17, R = (a, b, c, d, e, k) => { const q2 = new THREE.BoxGeometry(a, b, c); q2.applyMatrix4(new THREE.Matrix4().makeBasis(U, new THREE.Vector3(0, 1, 0), N).setPosition(P0[0], 0, P0[2]).multiply(new THREE.Matrix4().makeTranslation(d, e, k))); put(q2, 'plaster', 0, 0, 0, 0, .5); };
      for (const u of [u0, u1]) R(.01, y1 - y0, dep, u + (u === u0 ? -.005 : .005), (y0 + y1) / 2, -dep / 2); R(u1 - u0, .01, dep, (u0 + u1) / 2, y1 + .005, -dep / 2); if (q.y > F0 + .1) R(u1 - u0 + .04, .03, dep + .03, (u0 + u1) / 2, y0 - .015, -dep / 2 + .015); }
    const geo = new THREE.ShapeGeometry(s); geo.applyMatrix4(new THREE.Matrix4().makeBasis(U, new THREE.Vector3(0, 1, 0), N).setPosition(...P0)); put(geo, 'plaster', 0, 0, 0, 0, .5); }
  // ── the plan: the partition between the hall (and the stair) and the rooms west of it; across the house between front and back rooms
  const PX = .8, pt = .05, PZ = .35, W0 = .85 /* the well's west edge */, WZ = [-Z, -1.01] /* the well, front to back */;
  const cut = (key, x0, x1, z0, z1, y0, y1, doors, tag, fl) => { /* a wall from a0 to a1 along z (x0..x1 thin) or along x (z0..z1 thin), doors [{a0, a1, h}] cut out */
    const alongZ = x1 - x0 < z1 - z0, A0 = alongZ ? z0 : x0, A1 = alongZ ? z1 : x1, cuts = [...doors].sort((a, b) => a.a0 - b.a0); let a = A0;
    const seg = (s0, s1, yy0, yy1, tg) => alongZ ? bx(key, x0, x1, yy0, yy1, s0, s1, tg, fl) : bx(key, s0, s1, yy0, yy1, z0, z1, tg, fl);
    for (const d of cuts) { if (d.a0 > a) seg(a, d.a0, y0, y1, tag); seg(d.a0, d.a1, y0 + d.h, y1); for (const e of [d.a0, d.a1]) seg(e - (e === d.a0 ? .06 : 0), e + (e === d.a1 ? .06 : 0), y0, y0 + d.h + .06); seg(d.a0, d.a1, y0 + d.h, y0 + d.h + .06); a = d.a1; }
    if (A1 > a) seg(a, A1, y0, y1, tag); };
  for (let fl = 0; fl < 3; fl++) { const y0 = floors[fl], y1 = CE[fl];
    cut('plaster', PX - pt, PX + pt, -Z, fl ? PZ + pt : Z, y0, y1, fl === 0 ? [{ a0: 1.9, a1: 2.8, h: 2.1 }, { a0: -.85, a1: .05, h: 2.1 }] : [{ a0: -.85, a1: .05, h: 2.05 }], 'partition', fl);
    cut('plaster', -X, PX - pt, PZ - pt, PZ + pt, y0, y1, fl === 1 ? [{ a0: -1.8, a1: -.6, h: 2.3 }] : [], 'partition', fl);
    if (fl) cut('plaster', PX + pt, X, PZ - pt, PZ + pt, y0, y1, [{ a0: 1.4, a1: 2.3, h: 2.05 }], 'partition', fl); }
  // the front door's leaf, hung open inside against the hall's west side; the back door's against the kitchen's back wall
  { const fd = plan.open.front[0], bd = plan.open.back[0], fx0 = fd.x - fd.w / 2, bx0 = -bd.x - bd.w / 2; bx('paint', fx0, fx0 + .06, F0, F0 + 2.4, Z - fd.w + .05, Z - .02, 'leaf', 0); bx('paint', bx0, bx0 + .06, F0, F0 + bd.h - .05, -Z + .02, -Z + bd.w - .02, 'leaf', 0); }
  // ── the floors: the hall and the kitchen flagged, the parlour boarded; the upper floors boarded on joists with the plaster ceiling under,
  // open over the stair's well; the top ceiling under the roof
  const slabs = []; { const flag = (x0, x1, z0, z1) => { for (let z = z0; z < z1 - .05;) { const d = Math.min(z1 - z, .5 + r() * .3); for (let x = x0; x < x1 - .05;) { const w = Math.min(x1 - x, .55 + r() * .4); put(new THREE.BoxGeometry(w - .02, F0, d - .02), 'flag', x + w / 2, F0 / 2 + (r() - .5) * .004, z + d / 2, 0, .7); x += w; } z += d; } };
    flag(PX + pt, X, -Z, Z); flag(-X, PX - pt, -Z, PZ - pt); bx('deal', -X, PX - pt, 0, F0, PZ + pt, Z);
    for (const [fl, y] of [[1, F1], [2, F2]]) { for (const [x0, x1, z0, z1] of [[-X, W0, -Z, Z], [W0, X, WZ[1], Z]]) { bx('deal', x0, x1, y - .04, y, z0, z1); bx('oak', x0, x1, y - SL + .03, y - .04, z0, z1); bx('plaster', x0, x1, y - SL, y - SL + .03, z0, z1); slabs.push({ x0, x1, z0, z1, y0: y - SL, y1: y, fl }); }
      bx('oak', W0, X, y - SL, y, WZ[1] - .06, WZ[1]) /* the trimmer at the landing's edge */; }
    bx('plaster', -X, X, CE[2], CE[2] + .04, -Z, Z); slabs.push({ x0: -X, x1: X, z0: -Z, z1: Z, y0: CE[2], y1: CE[2] + .04, fl: 3 });
    for (let fl = 0; fl < 3; fl++) for (const s of [-1, 1]) bx('oak', -X, X, floors[fl], floors[fl] + .12, s > 0 ? Z - .02 : -Z, s > 0 ? Z : -Z + .02); }
  // ── the stair: two flights a storey, 8 risers each, the half-landing against the back wall; flight A up the east wall to the back,
  // flight B back to the front along the partition, arriving on the landing at the well's front edge; then C and D over them
  const G = .27, steps = [], landings = []; let rail = [];
  for (let fl = 0; fl < 2; fl++) { const y0 = floors[fl], ri = (floors[fl + 1] - y0) / 16, yL = y0 + 8 * ri;
    for (let i = 1; i <= 7; i++) { const y = y0 + i * ri, z1 = WZ[1] - (i - 1) * G, z0 = z1 - G; bx('oak', 1.85, X, Math.max(y - ri - .06, y0), y, z0, z1); steps.push({ x0: 1.85, x1: X, z0, z1, y, fl, flight: fl ? 'C' : 'A' }); }
    bx('oak', W0, X, yL - .2, yL, -Z, -2.9); landings.push({ x0: W0, x1: X, z0: -Z, z1: -2.9, y: yL, fl });
    for (let i = 1; i <= 7; i++) { const y = yL + i * ri, z0 = -2.9 + (i - 1) * G, z1 = z0 + G; bx('oak', W0, 1.8, y - ri - .06, y, z0, z1); steps.push({ x0: W0, x1: 1.8, z0, z1, y, fl, flight: fl ? 'D' : 'B' }); }
    // the handrail and balusters between the two flights, on their newels
    for (const [zA, yA, zB, yB] of [[WZ[1], y0, -2.9, yL], [-2.9, yL, WZ[1], floors[fl + 1]]]) { const n = 8; for (let k = 0; k <= n; k++) { const z = zA + (zB - zA) * k / n, y = yA + (yB - yA) * k / n; bx('oak', 1.81, 1.84, y, y + .9, z - .015, z + .015); }
      const L = Math.hypot(zB - zA, yB - yA), q = new THREE.BoxGeometry(.06, .06, L); q.rotateX(Math.atan2(yB - yA, zA - zB)); put(q, 'oak', 1.825, (yA + yB) / 2 + .92, (zA + zB) / 2); }
    for (const [z, y] of [[WZ[1], y0], [-2.9, yL], [WZ[1], floors[fl + 1]]]) bx('oak', 1.79, 1.86, y, y + 1.05, z - .035, z + .035); }
  // the rail round the top of the well on the second floor
  { const y = F2; for (let x = 1.85; x <= X - .05; x += .12) bx('oak', x - .015, x + .015, y, y + .9, WZ[1] + .02, WZ[1] + .05); bx('oak', 1.8, X, y + .9, y + .96, WZ[1], WZ[1] + .07); rail = [{ x0: 1.8, x1: X, z: WZ[1], y: y + .96 }]; }
  // ── fireplaces on the west gable (x = -X): a breast 0.35 m proud, an opening, a surround, a mantel; a grate of coals or the kitchen's range
  const fires = []; const fireplace = (fl, z, w, range) => { const y0 = floors[fl], y1 = CE[fl], D = range ? .55 : .35, oh = range ? 1.2 : .9, ow = range ? 1.5 : .8, x1 = -X + D;
    bx('plaster', -X, x1, y0 + oh, y1, z - w / 2, z + w / 2); bx('plaster', -X, x1, y0, y0 + oh, z - w / 2, z - ow / 2); bx('plaster', -X, x1, y0, y0 + oh, z + ow / 2, z + w / 2); boxes.push({ tag: 'breast', x0: -X, x1, y0, y1, z0: z - w / 2, z1: z + w / 2, fl });
    bx('soot', -X, -X + .02, y0, y0 + oh, z - ow / 2, z + ow / 2); bx('soot', -X, x1, y0 + oh - .02, y0 + oh, z - ow / 2, z + ow / 2);
    if (range) { bx('oak', x1 - .05, x1 + .06, y0 + oh, y0 + oh + .25, z - ow / 2 - .2, z + ow / 2 + .2); bx('flag', x1, x1 + .7, y0, y0 + .03, z - ow / 2, z + ow / 2);
      const cx = -X + .1, cz = z - ow / 2 + .1; bx('iron', cx - .02, cx + .02, y0 + .2, y0 + 1.1, cz - .02, cz + .02); put(new THREE.BoxGeometry(.03, .03, .8), 'iron', cx + .02, y0 + 1.0, cz + .4); put(new THREE.CylinderGeometry(.008, .008, .4, 4), 'iron', cx + .02, y0 + .8, cz + .65);
      put(new THREE.SphereGeometry(.17, 12, 8, 0, Math.PI * 2, .35, Math.PI - .35), 'iron', cx + .2, y0 + .5, cz + .65); }
    else { for (const s of [-1, 1]) bx('dress', x1, x1 + .05, y0, y0 + oh + .2, z + s * ow / 2 + (s > 0 ? 0 : -.2), z + s * ow / 2 + (s > 0 ? .2 : 0)); bx('dress', x1, x1 + .05, y0 + oh, y0 + oh + .2, z - ow / 2, z + ow / 2);
      bx('dress', x1, x1 + .22, y0 + oh + .2, y0 + oh + .25, z - ow / 2 - .3, z + ow / 2 + .3); bx('dress', x1, x1 + .45, y0, y0 + .03, z - ow / 2 - .1, z + ow / 2 + .1);
      bx('iron', -X + .08, -X + .28, y0 + .1, y0 + .13, z - .25, z + .25); for (const zz of [z - .25, z + .25]) bx('iron', -X + .08, -X + .3, y0, y0 + .32, zz - .015, zz + .015); for (let k = -3; k <= 3; k++) bx('iron', -X + .28, -X + .3, y0 + .13, y0 + .32, z + k * .07 - .008, z + k * .07 + .008); }
    for (let k = 0; k < (range ? 10 : 7); k++) put(new THREE.BoxGeometry(.09, .05, .07), 'ember', -X + .12 + r() * (range ? .3 : .14), y0 + (range ? .05 : .15) + r() * .05, z + (r() - .5) * (range ? .8 : .4), r() * 3);
    put(new THREE.SphereGeometry(.05, 6, 4).scale(1, 2.2, 1), 'flame', -X + .2, y0 + (range ? .2 : .3), z - .05); put(new THREE.SphereGeometry(.04, 6, 4).scale(1, 2, 1), 'flame', -X + .22, y0 + (range ? .18 : .28), z + .1);
    fires.push([-X + .25, y0 + .3, z, fl]); return { x1, z, y: y0 + oh }; };
  // the top floor: the gables' stacks come down inside the walls to 0.6 m under the wall head, so their breasts stand floor to ceiling here
  const stackZ = (.4 + .36 * 4) / 2 + .04; for (const s of [-1, 1]) { const x0 = s < 0 ? -X : X - .32, x1 = s < 0 ? -X + .32 : X; bx('plaster', x0, x1, F2, CE[2], -stackZ, stackZ, 'breast', 2); }
  const parlourFire = fireplace(0, 2.2, 1.5), range = fireplace(0, -2.0, 2.1, true), drawFire = fireplace(1, 2.2, 1.6), dineFire = fireplace(1, -1.9, 1.5);
  // ── furniture kit
  const chair = (fl, x, z, face, key = 'oak', arms = false) => { const y0 = floors[fl], c = { x0: x - .23, x1: x + .23, z0: z - .23, z1: z + .23, y: y0 + .44 }; bx(key, c.x0, c.x1, c.y - .04, c.y, c.z0, c.z1, 'chair', fl);
    for (const dx of [-.19, .19]) for (const dz of [-.19, .19]) bx(key, x + dx - .02, x + dx + .02, y0, c.y - .04, z + dz - .02, z + dz + .02);
    const bxs = face === 'x+' ? x - .21 : face === 'x-' ? x + .21 : null, bzs = face === 'z+' ? z - .21 : face === 'z-' ? z + .21 : null;
    if (bxs != null) { for (const dz of [-.19, .19]) bx(key, bxs - .02, bxs + .02, c.y, y0 + 1.0, z + dz - .02, z + dz + .02); bx(key, bxs - .02, bxs + .02, y0 + .78, y0 + .96, z - .19, z + .19); }
    else { for (const dx of [-.19, .19]) bx(key, x + dx - .02, x + dx + .02, c.y, y0 + 1.0, bzs - .02, bzs + .02); bx(key, x - .19, x + .19, y0 + .78, y0 + .96, bzs - .02, bzs + .02); }
    if (arms) { bx('wool', c.x0 + .03, c.x1 - .03, c.y, c.y + .06, c.z0 + .03, c.z1 - .03); for (const s of [-1, 1]) (bxs != null ? bx(key, x - .2, x + .2, y0 + .62, y0 + .66, z + s * .21 - .025, z + s * .21 + .025) : bx(key, x + s * .21 - .025, x + s * .21 + .025, y0 + .62, y0 + .66, z - .2, z + .2)); }
    return c; };
  const table = (fl, x0, x1, z0, z1, h = .75, key = 'oak', tag = 'table') => { const y0 = floors[fl], y = y0 + h; bx(key, x0, x1, y - .04, y, z0, z1, tag, fl);
    for (const xx of [x0 + .06, x1 - .06]) for (const zz of [z0 + .06, z1 - .06]) bx(key, xx - .03, xx + .03, y0, y - .04, zz - .03, zz + .03); bx(key, x0 + .05, x1 - .05, y - .13, y - .04, z0 + .05, z0 + .07); bx(key, x0 + .05, x1 - .05, y - .13, y - .04, z1 - .07, z1 - .05); return { x0, x1, z0, z1, y }; };
  const press = (fl, x0, x1, z0, z1, h, key, tag, shelves, ware) => { const y0 = floors[fl]; bx(key, x0, x1, y0, y0 + h, z0, z1, tag, fl); bx(key, Math.max(x0 - .03, -X), Math.min(x1 + .03, X), y0 + h, y0 + h + .06, Math.max(z0 - .03, -Z), Math.min(z1 + .03, Z)) /* the cornice, stopped at a wall */;
    if (shelves) for (let k = 0; k < shelves; k++) { /* an open dresser against a wall at z1: its shelves over the low cupboard, plates standing on them */ const yy = y0 + h + .4 + k * .36;
      bx('oak', x0, x1, yy - .02, yy, z1 - .25, z1); for (let x = x0 + .12; x < x1 - .1; x += .2 + r() * .06) { const pr = .09 + r() * .03; put(new THREE.CylinderGeometry(pr, pr, .015, 14), ware, x, yy + pr, z1 - .1, 0, .6, Math.PI / 2, 0); } }
    if (shelves) for (const xx of [x0, x1 - .03]) bx('oak', xx, xx + .03, y0 + h, y0 + h + .4 + shelves * .36, z1 - .25, z1); };
  const rug = (fl, x0, x1, z0, z1) => bx('rug', x0, x1, floors[fl], floors[fl] + .01, z0, z1);
  const lamp = (fl, x, z, drop = .6) => { const y = CE[fl] - drop; bx('iron', x - .005, x + .005, y + .1, CE[fl], z - .005, z + .005); put(new THREE.CylinderGeometry(.13, .08, .08, 10), 'brass', x, y, z); put(new THREE.SphereGeometry(.06, 8, 6).scale(1, .5, 1), 'glow', x, y + .05, z); return [x, y, z, fl]; };
  const candle = (x, y, z) => { put(new THREE.CylinderGeometry(.04, .05, .02, 10), 'brass', x, y + .01, z); put(new THREE.CylinderGeometry(.016, .018, .15, 8), 'wax', x, y + .095, z); put(new THREE.SphereGeometry(.011, 5, 4).scale(1, 2.2, 1), 'flame', x, y + .185, z); return [x, y + .2, z]; };
  const lamps = [], candles = [];
  // ground: the hall (a hall table and a mirror), the parlour (two chairs at the fire, a round table, a press of good delft), the kitchen
  // (the range, a dresser of plates, the table and two stools, a settle, the back door)
  table(0, PX + pt, PX + pt + .4, .9, 1.7, .8, 'oak', 'halltable'); bx('oak', PX + pt, PX + pt + .02, F0 + 1.3, F0 + 2.0, 1.0, 1.6); bx('delft', PX + pt + .02, PX + pt + .03, F0 + 1.35, F0 + 1.95, 1.05, 1.55) /* the hall glass */; candles.push(candle(PX + pt + .2, F0 + .8, 1.3)); lamps.push(lamp(0, 1.8, 2.6, .5));
  rug(0, -2.0, -.2, .9, 3.4); chair(0, -1.85, 1.25, 'z+', 'oak', true); chair(0, -1.85, 3.2, 'z-', 'oak', true); { const g2 = new THREE.CylinderGeometry(.42, .42, .04, 20); put(g2, 'oak', -.55, F0 + .72, 2.2); bx('oak', -.6, -.5, F0, F0 + .7, 2.15, 2.25); boxes.push({ tag: 'roundtable', x0: -.97, x1: -.13, y0: F0, y1: F0 + .74, z0: 1.78, z1: 2.62, fl: 0 }); }
  candles.push(candle(-.55, F0 + .74, 2.2)); press(0, -1.7, -.1, PZ + pt, PZ + pt + .42, 1.9, 'paint', 'press', 0);
  press(0, -1.9, -.2, PZ - pt - .45, PZ - pt, 1.0, 'oak', 'dresser', 3, 'delft'); bx('oak', -1.9, -.2, F0 + 1.0, F0 + 2.1, PZ - pt - .03, PZ - pt) /* the dresser's back */;
  table(0, -.75, .45, -3.45, -2.55, .76, 'deal'); for (const [x, z] of [[-.45, -2.25], [.15, -2.25]]) { const s2 = { x0: x - .17, x1: x + .17, z0: z - .17, z1: z + .17 }; bx('deal', s2.x0, s2.x1, F0 + .41, F0 + .45, s2.z0, s2.z1, 'stool', 0); for (const dx of [-.13, .13]) for (const dz of [-.13, .13]) bx('deal', x + dx - .02, x + dx + .02, F0, F0 + .41, z + dz - .02, z + dz + .02); }
  put(new THREE.CylinderGeometry(.12, .1, .2, 12), 'crock', -.2, F0 + .86, -3.0); put(new THREE.SphereGeometry(.09, 10, 6).scale(1.3, .7, 1), 'straw', .15, F0 + .8, -3.1) /* a loaf */; lamps.push(lamp(0, -.9, -1.6, .6));
  // first floor: the drawing room (the fire with a mirror over it, two armchairs, a settee along the back wall, a round table, a rug, a
  // looking glass between the windows) and the dining room behind (the table and four chairs, a sideboard under the back window's side)
  rug(1, -2.1, .6, .9, 3.5); chair(1, -1.85, 1.25, 'z+', 'oak', true); chair(1, -1.85, 3.2, 'z-', 'oak', true); bx('oak', -X + .35, -X + .37, drawFire.y + .3, drawFire.y + 1.2, 2.2 - .5, 2.2 + .5); bx('delft', -X + .37, -X + .38, drawFire.y + .36, drawFire.y + 1.14, 2.2 - .44, 2.2 + .44) /* the looking glass over the mantel */;
  { const y0 = F1, x0 = -.3, x1 = 1.25, z0 = PZ + pt, z1 = PZ + pt + .7; bx('wool', x0, x1, y0 + .2, y0 + .45, z0, z1, 'settee', 1); bx('wool', x0, x1, y0 + .45, y0 + .95, z0, z0 + .16); for (const xx of [x0, x1 - .12]) bx('wool', xx, xx + .12, y0 + .45, y0 + .7, z0, z1); for (const xx of [x0 + .05, x1 - .05]) for (const zz of [z0 + .05, z1 - .05]) bx('oak', xx - .025, xx + .025, y0, y0 + .2, zz - .025, zz + .025); }
  { const g2 = new THREE.CylinderGeometry(.45, .45, .04, 20); put(g2, 'oak', .5, F1 + .72, 2.9); bx('oak', .45, .55, F1, F1 + .7, 2.85, 2.95); boxes.push({ tag: 'roundtable', x0: .05, x1: .95, y0: F1, y1: F1 + .74, z0: 2.45, z1: 3.35, fl: 1 }); candles.push(candle(.5, F1 + .74, 2.9)); }
  lamps.push(lamp(1, -.6, 2.3, .55));
  table(1, -1.55, -.15, -2.75, -1.05, .75); for (const [x, z, f] of [[-1.15, -.75, 'z-'], [-.55, -.75, 'z-'], [-1.15, -3.05, 'z+'], [-.55, -3.05, 'z+']]) chair(1, x, z, f);
  press(1, -2.65, -1.9, -Z, -Z + .5, .9, 'oak', 'sideboard', 0); put(new THREE.CylinderGeometry(.07, .09, .26, 12), 'delft', -2.3, F1 + 1.05, -Z + .25); candles.push(candle(-.85, F1 + .75, -1.9)); lamps.push(lamp(1, -.85, -1.9, .6));
  // second floor: the bedroom (a bed with its curtains, a washstand, a chest at its foot) and the children's room (bunk beds, a toy chest,
  // a small table and stool, a hoop and stick, a ball, a doll on the lower bunk)
  { const y0 = F2, x0 = -1.85, x1 = -.35, z0 = PZ + pt, z1 = PZ + pt + 2.0, y = y0 + .6; bx('oak', x0, x1, y0 + .25, y - .2, z0, z1, 'bed', 2); bx('linen', x0 + .03, x1 - .03, y - .2, y, z0 + .05, z1 - .03); bx('wool', x0 + .02, x1 - .02, y - .1, y + .03, z0 + .7, z1 - .02);
    for (const xx of [x0 + .04, x1 - .04]) for (const zz of [z0 + .04, z1 - .04]) bx('oak', xx - .04, xx + .04, y0, y0 + 1.95, zz - .04, zz + .04); bx('oak', x0, x1, y0 + 1.9, y0 + 2.0, z0, z0 + .06); bx('oak', x0, x1, y0 + 1.9, y0 + 2.0, z1 - .06, z1);
    for (const xx of [x0, x1 - .06]) bx('oak', xx, xx + .06, y0 + 1.9, y0 + 2.0, z0, z1); for (const xx of [x0 - .01, x1 - .01]) bx('wool', xx, xx + .02, y0 + .9, y0 + 1.88, z0 + .1, z0 + .55); bx('oak', x0 + .1, x1 - .1, y0 + .6, y0 + 1.15, z0, z0 + .05) /* the headboard */;
    bx('oak', x0 + .15, x1 - .15, y0, y0 + .45, z1 + .05, z1 + .5, 'chest', 2); }
  table(2, -2.7, -2.25, 3.2, 3.8, .8, 'oak', 'washstand'); put(new THREE.CylinderGeometry(.18, .12, .1, 14), 'delft', -2.47, F2 + .85, 3.5); put(new THREE.CylinderGeometry(.06, .08, .24, 12), 'delft', -2.42, F2 + .92, 3.25); lamps.push(lamp(2, .3, 2.3, .3));
  { const y0 = F2, x0 = -X, x1 = -X + .95, z0 = -Z + .05, z1 = -Z + 2.05; for (const yy of [y0 + .35, y0 + 1.45]) { bx('oak', x0, x1, yy - .12, yy - .06, z0, z1); bx('linen', x0 + .03, x1 - .03, yy - .06, yy + .05, z0 + .03, z1 - .03); bx('wool', x0 + .04, x1 - .04, yy + .02, yy + .07, z0 + .55, z1 - .04); }
    boxes.push({ tag: 'bunks', x0, x1, y0, y1: y0 + 1.9, z0, z1, fl: 2 }); for (const xx of [x0 + .04, x1 - .04]) for (const zz of [z0 + .04, z1 - .04]) bx('oak', xx - .04, xx + .04, y0, y0 + 1.9, zz - .04, zz + .04); bx('oak', x0, x1, y0 + 1.6, y0 + 1.66, z1 - .07, z1 - .02) /* the top bunk's rail */;
    for (let k = 1; k <= 4; k++) bx('oak', x1 - .05, x1 - .02, y0 + k * .35, y0 + k * .35 + .03, z1 - .5, z1 - .1); for (const zz of [z1 - .5, z1 - .1]) bx('oak', x1 - .05, x1 - .02, y0, y0 + 1.6, zz - .02, zz + .02) /* the ladder */;
    put(new THREE.CylinderGeometry(.06, .07, .2, 8), 'linen', x0 + .5, y0 + .5, z0 + .4); put(new THREE.SphereGeometry(.045, 8, 6), 'linen', x0 + .5, y0 + .64, z0 + .4) /* the doll */; }
  bx('paint', -.6, .3, F2, F2 + .45, -Z + .05, -Z + .5, 'toychest', 2); put(new THREE.SphereGeometry(.09, 12, 8), 'rug', -.1, F2 + .09, -2.6) /* a ball */; put(new THREE.TorusGeometry(.32, .012, 6, 24), 'oak', .35, F2 + .333, -2.0, 0, .6, 0, 0) /* the hoop */;
  table(2, -1.15, -.45, -2.2, -1.5, .55, 'deal', 'smalltable'); { const x = -.8, z = -1.15; bx('deal', x - .14, x + .14, F2 + .3, F2 + .33, z - .14, z + .14, 'stool', 2); for (const dx of [-.1, .1]) for (const dz of [-.1, .1]) bx('deal', x + dx - .015, x + dx + .015, F2, F2 + .3, z + dz - .015, z + dz + .015); }
  candles.push(candle(-.8, F2 + .55, -1.85)); lamps.push(lamp(2, -.9, -2.0, .3));
  // the windows are clear from inside
  { const Gl = glMats().glass, Lt = glMats().lit; shell.traverse(m => { if (m.isMesh && (m.material === Gl || m.material === Lt)) { m.material = mats().pane; m.name = 'pane'; } }); }
  const group = new THREE.Group(); let tris = 0; for (const [k, gs] of B) { const q = mergeGeometries(gs, false); gs.forEach(x => x.dispose()); const m = new THREE.Mesh(q, M[k]); m.name = k; m.castShadow = !['flame', 'ember', 'glow'].includes(k); m.receiveShadow = true; group.add(m); tris += q.attributes.position.count / 3; }
  const all = new THREE.Group(); all.add(shell, group);
  const windows = Object.entries(plan.open).flatMap(([f, os]) => (os || []).filter(q => q.kind === 'win').map(q => ({ face: f, x: f === 'front' ? q.x : -q.x, z: f === 'front' ? plan.d / 2 : -plan.d / 2, y: q.y, w: q.w, h: q.h })));
  const fd = plan.open.front[0], bd = plan.open.back[0], paths = [
    { fl: 0, pts: [[fd.x, Z - .3], [1.95, 1.0], [1.3, -.4], [PX - .35, -.4], [-1.6, -.9], [-1.6, -Z + .3]] }, { fl: 0, pts: [[fd.x, Z - .3], [1.95, 2.35], [PX - .35, 2.35], [.2, 1.2], [-1.2, 1.0]] }, { fl: 0, pts: [[fd.x, Z - .3], [2.3, -.75]] },
    { fl: 1, pts: [[1.3, -.6], [1.85, -.1], [1.85, 1.6], [-1.3, 2.2]] }, { fl: 1, pts: [[1.3, -.6], [PX - .35, -.4], [.2, -.2], [-1.2, -.1], [-1.2, 1.0]] },
    { fl: 2, pts: [[1.3, -.6], [1.85, -.1], [1.85, .8], [.2, 2.9]] }, { fl: 2, pts: [[1.3, -.6], [PX - .35, -.4], [-.3, -.6], [-1.6, -.6]] }];
  const rooms = { hall: { x0: PX + pt, x1: X, z0: WZ[1], z1: Z, fl: 0 }, parlour: { x0: -X, x1: PX - pt, z0: PZ + pt, z1: Z, fl: 0 }, kitchen: { x0: -X, x1: PX - pt, z0: -Z, z1: PZ - pt, fl: 0 },
    drawing: { x0: -X, x1: X, z0: PZ + pt, z1: Z, fl: 1 }, dining: { x0: -X, x1: PX - pt, z0: -Z, z1: PZ - pt, fl: 1 }, bedroom: { x0: -X, x1: X, z0: PZ + pt, z1: Z, fl: 2 }, children: { x0: -X, x1: PX - pt, z0: -Z, z1: PZ - pt, fl: 2 } };
  return { group: all, shell, room: group, tris: Math.round(tris), draws: group.children.length, shellTris: shell.userData.tris, shellCalls: shell.userData.calls, inner: { x0: -X, x1: X, z0: -Z, z1: Z }, floors, ceils: CE, eave: EAVE,
    door: { x: fd.x, z: plan.d / 2, w: fd.w, h: fd.h }, back: { x: -bd.x, z: -plan.d / 2, w: bd.w, h: bd.h }, part: { x: PX, z: PZ, t: pt }, steps, landings, well: { x0: W0, x1: X, z0: WZ[0], z1: WZ[1] }, rail, slabs, fires, rooms, range, paths, boxes, lamps, candles, windows, w: plan.w, d: plan.d };
}

// ── the Gatelands farmhouse (Session 1192, card F9; OG-115's "farmstead", the last of the Gatelands' three homes; Michael's A on #303:
// the room inside the street's own shell). Built inside pieces.js's GL_PLANS.farmhouse (10.5 by 6.2 m, walls of 0.5 m whitewashed,
// two storeys of 2.9 and 2.7 m, a slate roof behind parapets, a stack of two flues on each gable; the door in the middle bay, the back
// door to the yard east of the middle). The plan is the two-storey farmhouse of the Irish country: a narrow hall from the front door
// to a straight stair along its west side; east of it the kitchen, the house's working room (the open hearth under the east stack with
// its crane and pot, the dresser of delft on the back wall, the settle bed against the hall, the deal table under the front window and
// its form, the churn by the back door, a spinning wheel, flitches of bacon from the beams, the beams bare); west of it the parlour,
// the good room (a small grate in a painted surround, two chairs at it, a round table, the press of good delft, the clock, a rug, the
// ceiling plastered). Upstairs, the landing over the hall to the middle front window and a blanket chest under it; the west room (the
// parents': their bed, a cradle by the fire, a chest at the bed's foot, a washstand) and the east room (two beds for the children, a
// chest under the back window, a washstand and a chair by the fire). Every fire is on the gables' two flues.
// gatelandsFarmhouse(o, r) -> { group, shell, room, tris, draws, shellTris, shellCalls, inner, floors [F0, F1], ceils, door, back, part,
//   steps [{x0, x1, z0, z1, y, fl}], well, slabs, fires [[x, y, z, fl]], hearth, rooms, paths [{fl, pts}], boxes, lamps, candles, windows, w, d }
export function gatelandsFarmhouse(o = {}, r = stream('farmhouse')) {
  const plan = GL_PLANS.farmhouse({ paint: o.paint || 'green' }); plan.interior = true; plan.r = stream('farmhouse-shell'); plan.open.front[0].ajar = true;
  const shell = gatelandsBuilding(plan), M = { ...mats(), dress: glMats().dress, rug: mat('plaster', { ns: .3, color: 0x5a3a5a, rough: 1 }), wax: new THREE.MeshStandardMaterial({ color: 0xeee2c4, roughness: .6 }),
    bacon: new THREE.MeshStandardMaterial({ color: 0x7a4a32, roughness: .6 }) }, B = new Map(), boxes = [];
  const t = plan.t, X = plan.w / 2 - t, Z = plan.d / 2 - t, F0 = .03, F1 = plan.floors[0], EAVE = plan.floors[0] + plan.floors[1], SL = .2 /* boards and joists */;
  const CE = [F1 - SL, EAVE - .15], floors = [F0, F1];
  const put = (geo, key, x = 0, y = 0, z = 0, ry = 0, uv = .6, rx = 0, rz = 0) => { const q = geo.index ? geo.toNonIndexed() : geo; for (const k of Object.keys(q.attributes)) if (!['position', 'normal'].includes(k)) q.deleteAttribute(k);
    q.applyMatrix4(new THREE.Matrix4().compose(new THREE.Vector3(x, y, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(rx, ry, rz)), new THREE.Vector3(1, 1, 1))); worldUV(q, uv); if (!B.has(key)) B.set(key, []); B.get(key).push(q); return q; };
  const bx = (key, x0, x1, y0, y1, z0, z1, tag, fl) => { put(new THREE.BoxGeometry(x1 - x0, y1 - y0, z1 - z0), key, (x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2); if (tag) boxes.push({ tag, x0, x1, y0, y1, z0, z1, fl }); };
  // ── the plan: two partitions of lime-plastered studding at x = ±0.9 make the hall; doors from it to the parlour (in front of the
  // stair's foot) and to the kitchen; upstairs a door off the landing's back to each room
  const PX = .9, pt = .05, H0 = PX - pt /* the hall's half width */;
  const wall = (x, y0, y1, doors, fl) => { let a = -Z; for (const d of [...doors].sort((p, q) => p.z0 - q.z0)) { if (d.z0 > a) bx('lime', x - pt, x + pt, y0, y1, a, d.z0, 'partition', fl); bx('lime', x - pt, x + pt, y0 + d.h, y1, d.z0, d.z1);
    for (const e of [d.z0, d.z1]) bx('oak', x - pt - .01, x + pt + .01, y0, y0 + d.h + .06, e - (e === d.z0 ? .06 : 0), e + (e === d.z1 ? .06 : 0)); bx('oak', x - pt - .01, x + pt + .01, y0 + d.h, y0 + d.h + .06, d.z0, d.z1); a = d.z1; }
    if (Z > a) bx('lime', x - pt, x + pt, y0, y1, a, Z, 'partition', fl); };
  const dParl = { z0: 1.6, z1: 2.4, h: 2.05 }, dKit = { z0: -.4, z1: .4, h: 2.05 }, dUp = { z0: -2.45, z1: -1.65, h: 2.0 };
  wall(-PX, F0, CE[0], [dParl], 0); wall(PX, F0, CE[0], [dKit], 0); wall(-PX, F1, CE[1], [dUp], 1); wall(PX, F1, CE[1], [dUp], 1);
  // the front door's leaf, hung open against the hall's east partition
  { const fd = plan.open.front[0]; bx('paint', H0 - .06, H0, F0, F0 + fd.h - .45, Z - fd.w - .02, Z - .02, 'leaf', 0); }
  // ── the stair: 16 risers up the hall's west side from the front to the landing at the back, on goings of 0.21 m
  const SX0 = -H0, SX1 = -.02, SF = 1.5, G = .21, ri = (F1 - F0) / 16, steps = [];
  for (let i = 1; i <= 15; i++) { const y = F0 + i * ri, z1 = SF - (i - 1) * G, z0 = z1 - G; bx('oak', SX0, SX1, Math.max(y - ri - .06, F0), y, z0, z1); steps.push({ x0: SX0, x1: SX1, z0, z1, y, fl: 0 }); }
  const kHead = Math.floor((CE[0] - 2.0 - F0) / ri) /* the last tread with 2 m under the floor over it */, well = { x0: SX0, x1: 0, z0: SF - 15 * G, z1: SF - kHead * G };
  // the string along the hall's side of the stair, a handrail on newels, and the rail round the well upstairs
  { const L = Math.hypot(15 * G, F1 - F0), a = Math.atan2(F1 - F0, 15 * G), q = new THREE.BoxGeometry(.05, .28, L); q.rotateX(a); put(q, 'oak', SX1 + .025, (F0 + F1) / 2 + .14, SF - 7.5 * G);
    const q2 = new THREE.BoxGeometry(.06, .06, L + .2); q2.rotateX(a); put(q2, 'oak', SX1 + .02, (F0 + F1) / 2 + .9, SF - 7.5 * G); bx('oak', SX1 - .02, SX1 + .06, F0, F0 + 1.05, SF - .08, SF);
    for (let k = 1; k <= 15; k += 1) { const z = SF - (k - .5) * G, y = F0 + k * ri; bx('oak', SX1 + .005, SX1 + .035, y, y + .88 + (F1 - F0) / 15 * .5 * 0, z - .012, z + .012); } }
  const rail = []; { const y = F1; for (let z = well.z0 + .1; z <= well.z1; z += .12) bx('oak', .005, .035, y, y + .9, z - .012, z + .012); bx('oak', -.01, .05, y + .9, y + .96, well.z0, well.z1 + .03, 'wellrail', 1);
    for (let x = SX0 + .1; x < -.02; x += .12) bx('oak', x - .012, x + .012, y, y + .9, well.z1 + .005, well.z1 + .035); bx('oak', SX0, .05, y + .9, y + .96, well.z1, well.z1 + .06, 'wellrail', 1); bx('oak', -.03, .07, y, y + 1.05, well.z1 - .03, well.z1 + .07);
    rail.push({ x: 0, z0: well.z0, z1: well.z1, y: y + .96 }, { z: well.z1, x0: SX0, x1: 0, y: y + .96 }); }
  // ── the floors: the kitchen and the hall flagged, the parlour boarded; the upper floor of deal boards on oak joists, open over the
  // well; the parlour's ceiling plastered, the kitchen's and the hall's the boards and joists bare, the kitchen's beams under them;
  // a boarded ceiling upstairs under the slate
  const slabs = []; { const flag = (x0, x1, z0, z1) => { for (let z = z0; z < z1 - .05;) { const d = Math.min(z1 - z, .5 + r() * .35); for (let x = x0; x < x1 - .05;) { const w = Math.min(x1 - x, .55 + r() * .45); put(new THREE.BoxGeometry(w - .02, F0, d - .02), 'flag', x + w / 2, F0 / 2 + (r() - .5) * .004, z + d / 2, 0, .7); x += w; } z += d; } };
    flag(-H0, X, -Z, Z); bx('deal', -X, -PX - pt, 0, F0, -Z, Z);
    for (const [x0, x1, z0, z1] of [[-X, SX0, -Z, Z], [0, X, -Z, Z], [SX0, 0, -Z, well.z0], [SX0, 0, well.z1, Z]]) { bx('deal', x0, x1, F1 - .04, F1, z0, z1); slabs.push({ x0, x1, z0, z1, y0: F1 - SL, y1: F1, fl: 1 }); }
    for (let x = -X + .2; x < X; x += .4) { if (x > SX0 - .03 && x < .03) continue; const zs = x > SX0 && x < 0 ? [[-Z, well.z0], [well.z1, Z]] : [[-Z, Z]]; for (const [z0, z1] of zs) bx('oak', x - .04, x + .04, F1 - SL, F1 - .04, z0, z1); }
    for (const x of [SX0 - .03, .03]) bx('oak', x - .04, x + .04, F1 - SL, F1 - .04, -Z, Z) /* the trimmers each side of the well */;
    for (const z of [well.z0, well.z1]) bx('oak', SX0, 0, F1 - SL, F1 - .04, z - .04, z + .04);
    bx('lime', -X, -PX - pt, F1 - SL - .03, F1 - SL, -Z, Z) /* the parlour's plaster ceiling */;
    bx('deal', -X, X, CE[1], CE[1] + .04, -Z, Z); slabs.push({ x0: -X, x1: X, z0: -Z, z1: Z, y0: CE[1], y1: CE[1] + .04, fl: 2 }); for (let x = -X + .5; x < X - .2; x += 1.2) bx('oak', x - .06, x + .06, CE[1] - .14, CE[1], -Z, Z);
    for (let fl = 0; fl < 2; fl++) for (const s of [-1, 1]) bx('oak', -X, X, floors[fl], floors[fl] + .1, s > 0 ? Z - .02 : -Z, s > 0 ? Z : -Z + .02); }
  // the kitchen's beams, across the house under the joists, clear of the hearth's breast
  const beams = [1.45, 2.4, 3.35]; for (const x of beams) bx('oak', x - .1, x + .1, CE[0] - .22, CE[0], -Z, Z);
  // ── the fires, on the gables (s = -1 the west, +1 the east): a breast proud of the wall, the opening sooted. The kitchen's is the open
  // hearth (a turf fire on the flags, the crane and its pot, an oak lintel, the hearthstone before it); the others a grate of coals in a
  // painted surround with a mantel shelf
  const fires = [], gx = (s, a) => s * (X - a); const fireplace = (fl, s, z, w, open) => { const y0 = floors[fl], y1 = CE[fl], D = open ? .5 : .35, oh = open ? 1.3 : .9, ow = open ? 1.6 : .8, xa = gx(s, 0), xb = gx(s, D), lo = Math.min(xa, xb), hi = Math.max(xa, xb);
    bx('lime', lo, hi, y0 + oh, y1, z - w / 2, z + w / 2); bx('lime', lo, hi, y0, y0 + oh, z - w / 2, z - ow / 2); bx('lime', lo, hi, y0, y0 + oh, z + ow / 2, z + w / 2); boxes.push({ tag: 'breast', x0: lo, x1: hi, y0, y1, z0: z - w / 2, z1: z + w / 2, fl });
    const back = [Math.min(xa, gx(s, .02)), Math.max(xa, gx(s, .02))]; bx('soot', back[0], back[1], y0, y0 + oh, z - ow / 2, z + ow / 2); bx('soot', lo, hi, y0 + oh - .02, y0 + oh, z - ow / 2, z + ow / 2);
    const slab = (a0, a1) => [Math.min(gx(s, a0), gx(s, a1)), Math.max(gx(s, a0), gx(s, a1))];
    if (open) { bx('oak', ...slab(D - .3, D + .08), y0 + oh, y0 + oh + .24, z - ow / 2 - .25, z + ow / 2 + .25); bx('flag', ...slab(D, D + .8), y0, y0 + .03, z - ow / 2, z + ow / 2, 'hearthstone', fl);
      const fx = gx(s, .28); for (let i = 0; i < 7; i++) { const a = i / 7 * Math.PI * 2; put(new THREE.BoxGeometry(.24, .1, .12), 'turf', fx + Math.cos(a) * .15, y0 + .06 + (i % 2) * .08, z + Math.sin(a) * .22, a + 1.3); }
      put(new THREE.SphereGeometry(.16, 10, 6).scale(1.2, .4, 1.4), 'ember', fx, y0 + .08, z); for (let i = 0; i < 3; i++) put(new THREE.ConeGeometry(.07, .28 + i * .06, 7), 'flame', fx + (i - 1) * .04, y0 + .26, z + (i - 1) * .09);
      const cx = gx(s, .06), cz = z - ow / 2 + .08; bx('iron', cx - .02, cx + .02, y0 + .2, y0 + 1.15, cz - .02, cz + .02); put(new THREE.BoxGeometry(.03, .03, .75), 'iron', cx - s * .02, y0 + 1.05, cz + .37); put(new THREE.CylinderGeometry(.008, .008, .4, 4), 'iron', cx - s * .02, y0 + .85, cz + .62);
      put(new THREE.SphereGeometry(.17, 14, 10, 0, Math.PI * 2, .35, Math.PI - .35), 'iron', cx - s * .2, y0 + .55, cz + .62); put(new THREE.TorusGeometry(.13, .008, 4, 14, Math.PI).rotateY(Math.PI / 2), 'iron', cx - s * .2, y0 + .7, cz + .62);
      put(new THREE.CylinderGeometry(.11, .13, .18, 12), 'iron', gx(s, .2), y0 + .09, z + ow / 2 - .2) /* the kettle on the hearth's edge */; fires.push([fx, y0 + .3, z, fl]); return { x: gx(s, D), z, y: y0 + oh, stone: slab(D, D + .8) }; }
    for (const e of [-1, 1]) bx('paint', ...slab(D, D + .05), y0, y0 + oh + .2, e < 0 ? z - ow / 2 - .2 : z + ow / 2, e < 0 ? z - ow / 2 : z + ow / 2 + .2); bx('paint', ...slab(D, D + .05), y0 + oh, y0 + oh + .2, z - ow / 2, z + ow / 2);
    bx('paint', ...slab(D, D + .22), y0 + oh + .2, y0 + oh + .25, z - ow / 2 - .3, z + ow / 2 + .3); bx('flag', ...slab(D, D + .45), y0, y0 + .03, z - ow / 2 - .1, z + ow / 2 + .1);
    bx('iron', ...slab(.08, .28), y0 + .1, y0 + .13, z - .25, z + .25); for (const zz of [z - .25, z + .25]) bx('iron', ...slab(.08, .3), y0, y0 + .32, zz - .015, zz + .015); for (let k = -3; k <= 3; k++) bx('iron', ...slab(.28, .3), y0 + .13, y0 + .32, z + k * .07 - .008, z + k * .07 + .008);
    for (let k = 0; k < 7; k++) put(new THREE.BoxGeometry(.09, .05, .07), 'ember', gx(s, .12 + r() * .14), y0 + .15 + r() * .05, z + (r() - .5) * .4, r() * 3);
    put(new THREE.SphereGeometry(.05, 6, 4).scale(1, 2.2, 1), 'flame', gx(s, .2), y0 + .3, z - .05); fires.push([gx(s, .25), y0 + .3, z, fl]); return { x: gx(s, D), z, y: y0 + oh + .25 }; };
  const parlourFire = fireplace(0, -1, 0, 1.5), hearth = fireplace(0, 1, 0, 2.4, true), westFire = fireplace(1, -1, 0, 1.4), eastFire = fireplace(1, 1, 0, 1.4);
  // ── the furniture kit
  const chair = (fl, x, z, face, key = 'oak', sugan = false) => { const y0 = floors[fl], c = { x0: x - .22, x1: x + .22, z0: z - .22, z1: z + .22, y: y0 + .44 }; bx(sugan ? 'straw' : key, c.x0, c.x1, c.y - .04, c.y, c.z0, c.z1, 'chair', fl);
    for (const dx of [-.18, .18]) for (const dz of [-.18, .18]) bx(key, x + dx - .02, x + dx + .02, y0, c.y - .04, z + dz - .02, z + dz + .02);
    const bxs = face === 'x+' ? x - .2 : face === 'x-' ? x + .2 : null, bzs = face === 'z+' ? z - .2 : face === 'z-' ? z + .2 : null, top = y0 + (sugan ? .85 : 1.0);
    if (bxs != null) { for (const dz of [-.18, .18]) bx(key, bxs - .02, bxs + .02, c.y, top, z + dz - .02, z + dz + .02); for (const yy of sugan ? [.6, .78] : [.82]) bx(key, bxs - .015, bxs + .015, y0 + yy, y0 + yy + .05, z - .18, z + .18); }
    else { for (const dx of [-.18, .18]) bx(key, x + dx - .02, x + dx + .02, c.y, top, bzs - .02, bzs + .02); for (const yy of sugan ? [.6, .78] : [.82]) bx(key, x - .18, x + .18, y0 + yy, y0 + yy + .05, bzs - .015, bzs + .015); }
    return c; };
  const table = (fl, x0, x1, z0, z1, h = .76, key = 'deal', tag = 'table') => { const y0 = floors[fl], y = y0 + h; bx(key, x0, x1, y - .04, y, z0, z1, tag, fl);
    for (const xx of [x0 + .06, x1 - .06]) for (const zz of [z0 + .06, z1 - .06]) bx(key, xx - .03, xx + .03, y0, y - .04, zz - .03, zz + .03); bx(key, x0 + .05, x1 - .05, y - .13, y - .04, z0 + .05, z0 + .07); bx(key, x0 + .05, x1 - .05, y - .13, y - .04, z1 - .07, z1 - .05); return { x0, x1, z0, z1, y }; };
  const stool = (fl, x, z) => { const y0 = floors[fl]; bx('deal', x - .16, x + .16, y0 + .41, y0 + .45, z - .16, z + .16, 'stool', fl); for (const a of [0, 2.1, 4.2]) put(new THREE.CylinderGeometry(.018, .022, .41, 6), 'deal', x + Math.cos(a) * .1, y0 + .205, z + Math.sin(a) * .1); };
  const bed = (fl, x0, x1, z0, z1, along) => { const y0 = floors[fl], y = y0 + .6; bx('oak', x0, x1, y0 + .12, y - .18, z0, z1, 'bed', fl); bx('straw', x0 + .04, x1 - .04, y - .18, y - .06, z0 + .04, z1 - .04); bx('linen', x0 + .05, x1 - .05, y - .06, y, z0 + .05, z1 - .05);
    for (const xx of [x0 + .04, x1 - .04]) for (const zz of [z0 + .04, z1 - .04]) bx('oak', xx - .04, xx + .04, y0, y0 + .14, zz - .04, zz + .04);
    if (along === 'z-') { bx('oak', x0, x1, y0, y0 + 1.1, z0, z0 + .06); bx('wool', x0 + .03, x1 - .03, y - .04, y + .03, z0 + .6, z1 - .03); bx('linen', x0 + .12, x1 - .12, y, y + .1, z0 + .1, z0 + .45); bx('oak', x0, x1, y0, y0 + .75, z1 - .05, z1); }
    else { const hx = along === 'x-' ? x0 : x1 - .06, px = along === 'x-' ? [x0 + .1, x0 + .45] : [x1 - .45, x1 - .1], fx = along === 'x-' ? [x1 - .05, x1] : [x0, x0 + .05], wx = along === 'x-' ? [x0 + .6, x1 - .03] : [x0 + .03, x1 - .6];
      bx('oak', hx, hx + .06, y0, y0 + 1.0, z0, z1); bx('wool', wx[0], wx[1], y - .04, y + .03, z0 + .03, z1 - .03); bx('linen', px[0], px[1], y, y + .1, z0 + .12, z1 - .12); bx('oak', fx[0], fx[1], y0, y0 + .7, z0, z1); }
    return { x0, x1, z0, z1, y }; };
  const chest = (fl, x0, x1, z0, z1, h = .5, key = 'oak') => { const y0 = floors[fl]; bx(key, x0, x1, y0, y0 + h - .04, z0, z1, 'chest', fl); bx(key, x0 - .01, x1 + .01, y0 + h - .04, y0 + h, z0 - .01, z1 + .01); for (const e of [x0 + .12, x1 - .12]) bx('iron', e - .02, e + .02, y0 + .05, y0 + h, z0 - .015, z0); };
  const washstand = (fl, x, z) => { const y0 = floors[fl]; table(fl, x - .25, x + .25, z - .2, z + .2, .78, 'deal', 'washstand'); put(new THREE.CylinderGeometry(.16, .1, .08, 14), 'delft', x, y0 + .82, z); put(new THREE.CylinderGeometry(.06, .07, .22, 12), 'delft', x + .12, y0 + .89, z - .05); };
  const candle = (x, y, z) => { put(new THREE.CylinderGeometry(.04, .05, .02, 10), 'iron', x, y + .01, z); put(new THREE.CylinderGeometry(.016, .018, .15, 8), 'wax', x, y + .095, z); put(new THREE.SphereGeometry(.011, 5, 4).scale(1, 2.2, 1), 'flame', x, y + .185, z); return [x, y + .2, z]; };
  const lantern = (fl, x, z, y, top) => { bx('iron', x - .005, x + .005, y + .14, top, z - .005, z + .005); put(new THREE.CylinderGeometry(.08, .09, .22, 6), 'glow', x, y, z); put(new THREE.ConeGeometry(.1, .1, 6), 'iron', x, y + .16, z); put(new THREE.CylinderGeometry(.095, .095, .02, 6), 'iron', x, y - .12, z); return [x, y, z, fl]; };
  const lamps = [], candles = [];
  // ── the kitchen: the settle bed against the hall (a bench by day, its box a bed by night); the table under the front window with its
  // form; a stool and a súgán chair at the hearth; the dresser of delft on the back wall; the churn by the back door; the spinning wheel
  { const x0 = PX + pt, x1 = x0 + .6, z0 = .55, z1 = 2.5, y = F0 + .45; bx('deal', x0, x1, F0, y, z0, z1, 'settle', 0); bx('deal', x0, x0 + .07, y, F0 + 1.15, z0, z1); for (const z of [z0, z1 - .06]) bx('deal', x0, x1, y, F0 + .72, z, z + .06);
    bx('paint', x0 + .03, x1 - .01, y - .3, y - .27, z0 + .05, z1 - .05) /* the seam of the box's lid */; bx('wool', x0 + .09, x1 - .04, y, y + .03, z0 + .15, z0 + .7) /* a folded blanket */; }
  const kt = table(0, 2.4, 3.8, 1.85, 2.5, .76); { const z0 = 1.35, z1 = 1.62; bx('deal', 2.5, 3.7, F0 + .41, F0 + .45, z0, z1, 'bench', 0); for (const x of [2.62, 3.58]) bx('deal', x - .03, x + .03, F0, F0 + .41, z0 + .03, z1 - .03); }
  candles.push(candle(3.45, kt.y, 2.2)); put(new THREE.CylinderGeometry(.12, .1, .2, 12), 'crock', 2.75, kt.y + .1, 2.2); put(new THREE.SphereGeometry(.1, 10, 6).scale(1.4, .7, 1), 'straw', 3.1, kt.y + .06, 2.15) /* a soda loaf */;
  stool(0, 3.05, 1.05); chair(0, 3.05, -1.1, 'z+', 'oak', true);
  { const x0 = 3.0, x1 = 4.6, z0 = -Z, z1 = -Z + .46, h = .88; bx('paint', x0, x1, F0, F0 + h, z0, z1, 'dresser', 0); bx('deal', x0 - .02, x1 + .02, F0 + h, F0 + h + .04, z0, z1 + .03); bx('paint', x0, x1, F0 + h + .04, F0 + 2.1, z0, z0 + .04);
    for (const e of [x0, x1 - .05]) bx('paint', e, e + .05, F0 + h + .04, F0 + 2.1, z0, z0 + .3); bx('paint', x0 - .04, x1 + .04, F0 + 2.1, F0 + 2.2, z0, z0 + .34);
    for (let s = 0; s < 3; s++) { const y = F0 + 1.22 + s * .3; bx('paint', x0, x1, y - .02, y, z0, z0 + .26); for (let k = 0; k < 7; k++) { const px = x0 + .14 + k * .22, rp = .09 - (s ? .015 : 0);
      put(new THREE.CylinderGeometry(rp, rp, .012, 16), 'delft', px, y + rp + .005, z0 + .08, 0, .6, Math.PI / 2 - .2, 0); } }
    for (let k = 0; k < 3; k++) put(new THREE.CylinderGeometry(.06, .07, .2, 12), 'crock', x0 + .35 + k * .45, F0 + h + .14, z0 + .32); }
  { const x = 2.45, z = -2.22; put(new THREE.CylinderGeometry(.15, .19, .8, 14), 'oak', x, F0 + .4, z); for (const y of [.15, .65]) put(new THREE.TorusGeometry(.18 - y * .03, .012, 4, 16).rotateX(Math.PI / 2), 'iron', x, F0 + y, z);
    put(new THREE.CylinderGeometry(.012, .012, .5, 5), 'deal', x, F0 + .95, z); boxes.push({ tag: 'churn', x0: x - .19, x1: x + .19, y0: F0, y1: F0 + 1.2, z0: z - .19, z1: z + .19, fl: 0 }); }
  { const x = 2.2, z = .95, y0 = F0; const q = new THREE.BoxGeometry(.7, .06, .24); q.rotateZ(-.12); put(q, 'oak', x, y0 + .45, z); for (const [dx, dz] of [[-.3, -.08], [-.3, .08], [.3, 0]]) put(new THREE.CylinderGeometry(.02, .02, .48, 5), 'oak', x + dx, y0 + .22, z + dz);
    for (const dz of [-.07, .07]) bx('oak', x - .2, x - .17, y0 + .45, y0 + .95, z + dz - .015, z + dz + .015); const wh = new THREE.TorusGeometry(.26, .018, 5, 28); put(wh, 'oak', x - .185, y0 + .78, z, Math.PI / 2);
    for (let k = 0; k < 6; k++) { const q2 = new THREE.BoxGeometry(.015, .5, .015); q2.rotateZ(k / 6 * Math.PI); put(q2, 'oak', x - .185, y0 + .78, z, Math.PI / 2); } bx('oak', x + .2, x + .23, y0 + .45, y0 + .82, z - .015, z + .015);
    put(new THREE.CylinderGeometry(.03, .03, .16, 8), 'linen', x + .215, y0 + .86, z, 0, .6, 0, Math.PI / 2) /* the flyer's bobbin of wool */; boxes.push({ tag: 'wheel', x0: x - .45, x1: x + .4, y0, y1: y0 + 1.05, z0: z - .2, z1: z + .2, fl: 0 }); }
  for (const [z, L] of [[-1.85, .55], [-1.45, .5]]) { bx('iron', 3.35 - .005, 3.35 + .005, CE[0] - .38, CE[0] - .22, z - .005, z + .005); put(new THREE.BoxGeometry(.26, L, .07), 'bacon', 3.35, CE[0] - .38 - L / 2, z) /* a flitch of bacon in its salt */; }
  lamps.push(lantern(0, 2.4, .3, CE[0] - .58, CE[0] - .22));
  // ── the parlour: the two chairs at the grate, the round table with the lamp, the press of good delft, the clock, the rug; a side table
  // under the front window
  chair(0, -3.7, 1.05, 'z-', 'oak'); chair(0, -3.7, -1.05, 'z+', 'oak'); bx('rug', -4.0, -1.5, F0, F0 + .01, -1.5, 1.5);
  { const g2 = new THREE.CylinderGeometry(.42, .42, .04, 20); put(g2, 'oak', -2.3, F0 + .72, -.6); bx('oak', -2.35, -2.25, F0, F0 + .7, -.65, -.55); put(new THREE.CylinderGeometry(.22, .25, .03, 16), 'oak', -2.3, F0 + .015, -.6); boxes.push({ tag: 'roundtable', x0: -2.72, x1: -1.88, y0: F0, y1: F0 + .74, z0: -1.02, z1: -.18, fl: 0 }); candles.push(candle(-2.3, F0 + .74, -.6)); }
  { const x0 = -4.3, x1 = -3.0, z0 = -Z, z1 = -Z + .42, h = 1.9; bx('paint', x0, x1, F0, F0 + .85, z0, z1, 'press', 0); bx('paint', x0, x1, F0 + .85, F0 + h, z0, z0 + .32); bx('paint', x0 - .03, x1 + .03, F0 + h, F0 + h + .07, z0, z0 + .36);
    bx('delft', x0 + .06, x1 - .06, F0 + .95, F0 + h - .08, z0 + .3, z0 + .32) /* the glazed doors, delft behind them */; for (const y of [1.25, 1.6]) bx('paint', x0 + .03, x1 - .03, F0 + y, F0 + y + .02, z0, z0 + .3); }
  { const x0 = -1.5, x1 = -1.08, z0 = -Z, z1 = -Z + .32; bx('oak', x0, x1, F0, F0 + 2.05, z0, z1, 'clock', 0); bx('oak', x0 - .03, x1 + .03, F0 + 2.05, F0 + 2.12, z0, z1 + .03); put(new THREE.CylinderGeometry(.13, .13, .01, 20), 'linen', (x0 + x1) / 2, F0 + 1.75, z1 + .005, 0, .6, Math.PI / 2, 0); }
  { const s2 = table(0, -3.65, -2.55, 2.12, 2.55, .74, 'oak', 'sidetable'); put(new THREE.CylinderGeometry(.07, .09, .24, 12), 'delft', -3.1, s2.y + .12, 2.33); }
  // ── upstairs: the landing's chest under the middle window; the west room's bed and the cradle by its fire, the chest at the bed's foot,
  // the washstand; the east room's two beds, the chest under the back window, the washstand, a chair by the fire
  chest(1, -.4, .4, 2.05, 2.5, .55);
  const beds = [bed(1, -3.4, -2.0, -Z + .05, -.55, 'z-')]; chest(1, -3.2, -2.2, -.45, -.02); washstand(1, -3.1, 2.3); candles.push(candle(-3.25, F1 + .78, 2.32));
  { const x0 = -4.25, x1 = -3.65, z0 = -2.35, z1 = -1.6, y0 = F1; bx('oak', x0, x1, y0 + .12, y0 + .45, z0, z1, 'cradle', 1); bx('wool', x0 + .04, x1 - .04, y0 + .4, y0 + .43, z0 + .04, z1 - .2); bx('oak', x0, x1, y0 + .45, y0 + .7, z0, z0 + .04) /* its hood end */;
    for (const z of [z0 + .08, z1 - .08]) { const q = new THREE.TorusGeometry(.4, .02, 4, 12, .9); put(q, 'oak', (x0 + x1) / 2, y0 + .43, z, 0, .6, 0, Math.PI * 1.5 - .45); } }
  beds.push(bed(1, PX + pt + .02, PX + pt + 1.92, .05, 1.0, 'x-'), bed(1, PX + pt + .02, PX + pt + 1.92, 1.45, 2.4, 'x-')); chest(1, 1.1, 1.9, -Z + .05, -Z + .4, .5, 'paint'); washstand(1, 4.1, -2.2); chair(1, 3.8, 1.3, 'x+', 'oak', true);
  lamps.push(lantern(1, -.45, -.2, CE[1] - .45, CE[1])); candles.push(candle(4.22, F1 + .78, -2.12));
  // the windows are clear from inside
  { const Gl = glMats().glass, Lt = glMats().lit; shell.traverse(m => { if (m.isMesh && (m.material === Gl || m.material === Lt)) { m.material = mats().pane; m.name = 'pane'; } }); }
  const group = new THREE.Group(); let tris = 0; for (const [k, gs] of B) { const q = mergeGeometries(gs, false); gs.forEach(x => x.dispose()); const m = new THREE.Mesh(q, M[k]); m.name = k; m.castShadow = !['flame', 'ember', 'glow'].includes(k); m.receiveShadow = true; group.add(m); tris += q.attributes.position.count / 3; }
  const all = new THREE.Group(); all.add(shell, group);
  const windows = Object.entries(plan.open).flatMap(([f, os]) => (os || []).filter(q => q.kind === 'win').map(q => ({ face: f, x: f === 'front' ? q.x : -q.x, z: f === 'front' ? plan.d / 2 : -plan.d / 2, y: q.y, w: q.w, h: q.h })));
  const fd = plan.open.front[0], bd = plan.open.back[0], paths = [
    { fl: 0, pts: [[fd.x, Z - .3], [.45, 1.2], [.45, 0], [1.4, 0], [2.6, -.3], [hearth.stone[0] - .2, -.1]] }, { fl: 0, pts: [[fd.x, Z - .3], [0, 2.0], [-1.3, 2.0], [-3.0, .2]] }, { fl: 0, pts: [[fd.x, Z - .3], [-.42, SF + .35]] },
    { fl: 0, pts: [[-bd.x, -Z + .3], [-bd.x, -1.2], [1.4, 0]] }, { fl: 1, pts: [[.45, -1.95], [-1.3, -1.95], [-1.5, -.3], [-2.5, 1.0]] }, { fl: 1, pts: [[.45, -1.95], [1.4, -1.85], [2.4, -.6], [3.4, -.3]] }, { fl: 1, pts: [[.45, -1.95], [.45, 1.6]] }];
  const rooms = { hall: { x0: -H0, x1: H0, z0: -Z, z1: Z, fl: 0 }, kitchen: { x0: PX + pt, x1: X, z0: -Z, z1: Z, fl: 0 }, parlour: { x0: -X, x1: -PX - pt, z0: -Z, z1: Z, fl: 0 },
    landing: { x0: -H0, x1: H0, z0: -Z, z1: Z, fl: 1 }, west: { x0: -X, x1: -PX - pt, z0: -Z, z1: Z, fl: 1 }, east: { x0: PX + pt, x1: X, z0: -Z, z1: Z, fl: 1 } };
  return { group: all, shell, room: group, tris: Math.round(tris), draws: group.children.length, shellTris: shell.userData.tris, shellCalls: shell.userData.calls, inner: { x0: -X, x1: X, z0: -Z, z1: Z }, floors, ceils: CE, eave: EAVE,
    door: { x: fd.x, z: plan.d / 2, w: fd.w, h: fd.h }, back: { x: -bd.x, z: -plan.d / 2, w: bd.w, h: bd.h }, part: { x: PX, t: pt }, doorsIn: { parlour: dParl, kitchen: dKit, up: dUp }, steps, rise: ri, going: G, well, rail, slabs, beams, fires, hearth,
    parlourFire, westFire, eastFire, rooms, paths, boxes, beds, table: kt, lamps, candles, windows, w: plan.w, d: plan.d };
}

// ── the farmstead's outbuildings as rooms (Session 1198; OG-115's "farmstead with outbuildings", OG-114's farming), inside the shells of
// GL_PLANS.byre and GL_PLANS.barn (Session 1194). Neither has a ceiling under its roof: the slate's couples, purlins and ridge board
// show. farmKit(plan, M): put and bx as the farmhouse's (bx keeps a tagged footprint with its floor), under(z) the slate's underside
// over z, couple(x, Z, yc) a pair of rafters at x with a collar at yc, finish() the room merged by material.
function farmKit(plan, M) {
  const B = new Map(), boxes = [], h = plan.floors.reduce((a, b) => a + b, 0), p = plan.roof.pitch * Math.PI / 180, tp = Math.tan(p), ov = plan.roof.ov, D = plan.d / 2 + ov, ye = h - ov * tp;
  const under = z => ye + (D - Math.abs(z)) * tp;
  const put = (geo, key, x = 0, y = 0, z = 0, ry = 0, uv = .6, rx = 0, rz = 0) => { const q = geo.index ? geo.toNonIndexed() : geo; for (const k of Object.keys(q.attributes)) if (!['position', 'normal'].includes(k)) q.deleteAttribute(k);
    q.applyMatrix4(new THREE.Matrix4().compose(new THREE.Vector3(x, y, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(rx, ry, rz)), new THREE.Vector3(1, 1, 1))); worldUV(q, uv); if (!B.has(key)) B.set(key, []); B.get(key).push(q); return q; };
  const bx = (key, x0, x1, y0, y1, z0, z1, tag, fl) => { put(new THREE.BoxGeometry(x1 - x0, y1 - y0, z1 - z0), key, (x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2); if (tag) boxes.push({ tag, x0, x1, y0, y1, z0, z1, fl }); };
  const couple = (x, Z, yc) => { const L = Math.hypot(Z, Z * tp) - .12; for (const s of [-1, 1]) put(new THREE.BoxGeometry(.08, .15, L), 'oak', x, (under(Z) + under(0)) / 2 - .08 / Math.cos(p), s * Z / 2, 0, .6, s * p);
    if (yc != null) { const zc = (under(0) - .17 / Math.cos(p) - yc) / tp; bx('oak', x - .04, x + .04, yc - .14, yc, -zc, zc); } };
  // the purlins under the rafters halfway up each slope, and the ridge board, from x0 to x1
  const purlins = (x0, x1, Z) => { for (const s of [-1, 1]) { const z = s * Z / 2, y = under(Math.abs(z) + .06) - .16 / Math.cos(p); bx('oak', x0, x1, y - .14, y, z - .06, z + .06); } bx('oak', x0, x1, under(.03) - .24, under(.03) - .04, -.03, .03); };
  const finish = shell => { { const Gl = glMats().glass, Lt = glMats().lit; shell.traverse(m => { if (m.isMesh && (m.material === Gl || m.material === Lt)) { m.material = mats().pane; m.name = 'pane'; } }); }
    const group = new THREE.Group(); let tris = 0; for (const [k, gs] of B) { const q = mergeGeometries(gs, false); gs.forEach(x => x.dispose()); const m = new THREE.Mesh(q, M[k]); m.name = k; m.castShadow = !['flame', 'ember', 'glow'].includes(k); m.receiveShadow = true; group.add(m); tris += q.attributes.position.count / 3; }
    const all = new THREE.Group(); all.add(shell, group); return { group: all, room: group, tris: Math.round(tris), draws: group.children.length }; };
  // the openings of every face in the building's frame: front +z, back -z (its x mirrored), left -x and right +x (their x along z)
  const openings = kind => Object.entries(plan.open).flatMap(([f, os]) => (os || []).filter(q => kind(q.kind)).map(q => ({ face: f, kind: q.kind, y: q.y, w: q.w, h: q.h,
    x: f === 'front' ? q.x : f === 'back' ? -q.x : f === 'left' ? -plan.w / 2 : plan.w / 2, z: f === 'front' ? plan.d / 2 : f === 'back' ? -plan.d / 2 : f === 'left' ? q.x : -q.x })));
  return { put, bx, boxes, under, couple, purlins, finish, openings, eave: h };
}
// a lantern hung on an iron rod from top (the farmhouse's), and a pail
function farmLantern(K, fl, x, z, y, top) { K.bx('iron', x - .005, x + .005, y + .14, top, z - .005, z + .005); K.put(new THREE.CylinderGeometry(.08, .09, .22, 6), 'glow', x, y, z); K.put(new THREE.ConeGeometry(.1, .1, 6), 'iron', x, y + .16, z);
  K.put(new THREE.CylinderGeometry(.095, .095, .02, 6), 'iron', x, y - .12, z); return [x, y, z, fl]; }
function farmPail(K, fl, y0, x, z) { K.put(new THREE.CylinderGeometry(.15, .12, .3, 12, 1, true), 'oak', x, y0 + .15, z); K.put(new THREE.CylinderGeometry(.12, .12, .02, 12), 'oak', x, y0 + .02, z);
  for (const y of [.06, .24]) K.put(new THREE.TorusGeometry(.125 + y * .1, .008, 4, 14).rotateX(Math.PI / 2), 'iron', x, y0 + y, z); K.put(new THREE.TorusGeometry(.15, .006, 4, 12, Math.PI), 'iron', x, y0 + .3, z);
  K.boxes.push({ tag: 'pail', x0: x - .15, x1: x + .15, y0, y1: y0 + .45, z0: z - .15, z1: z + .15, fl }); }
// a heap of hay: half a squashed sphere on the floor at y0, rx by ry by rz
function farmHay(K, fl, y0, x, z, rx, ry, rz) { K.put(new THREE.SphereGeometry(1, 14, 6, 0, Math.PI * 2, 0, Math.PI / 2).scale(rx, ry, rz), 'straw', x, y0, z, 0, 2.2); K.boxes.push({ tag: 'hay', x0: x - rx, x1: x + rx, y0, y1: y0 + ry, z0: z - rz, z1: z + rz, fl }); }

// gatelandsByre(o, r): the byre of GL_PLANS.byre (12 by 5.4 m outside, walls of 0.6 m, 2.6 m to the wall plate, slate at 36°) as the
//   Irish country's cow-house: six cows tied in three double stalls facing the back wall, each stall a cobbled standing 1.65 m long
//   between a manger of flags (a hay rack over it, below the back lights) and the dung channel; a flagged passage along the front
//   from both half-doors (their leaves standing open inward); a calf pen of boards at the east end on straw, its gate shut, a trough;
//   over the west half a hay loft of deal boards on joists at 2.45 m, reached by a ladder from the passage, its hatch in the west
//   gable, hay heaped under both slopes; the east half open to the couples. A milking stool, two pails, a meal bin, a hay fork.
//   -> { group, shell, room, tris, draws, inner, floors: [passage, loft], under(z), loft: {x0, x1, y, joists}, ladder, stalls, paths,
//        boxes, lamps, windows, doors, leaves, rooms } in the byre's frame (its centre on the ground, front +z).
export function gatelandsByre(o = {}, r = stream('byre')) {
  const plan = GL_PLANS.byre({ paint: o.paint || 'red' }); plan.interior = true; plan.r = stream('byre-shell'); for (const q of plan.open.front) if (q.kind === 'half') q.ajar = true; plan.open.left[0].open = true;
  const shell = gatelandsBuilding(plan), G = glMats(), M = { ...mats(), dress: G.dress, leaf: G['p:' + plan.paint], cobble: mat('flag', { ns: 1.8, color: 0x8a8476, rough: .85 }), straw: mat('thatch', { ns: 1.2, color: 0xeadcaa, rough: 1 }), dung: new THREE.MeshStandardMaterial({ color: 0x2c2418, roughness: .35 }) };
  const K = farmKit(plan, M), { bx, put, boxes, under } = K, X = plan.w / 2 - plan.t, Z = plan.d / 2 - plan.t, F0 = .03, FL = 2.45, JY = 2.27 /* the loft's joists' underside */, LX = -.6 /* the loft's open edge */;
  // ── the floor: the passage flagged, the dung channel a wet strip a step down, the standings cobbled a step up; the pen's straw
  const ZS = .15 /* the standings' heel */, ZC = .5 /* the channel's front edge */, ZM = -1.5 /* the manger's front */, XS = 2.45 /* the stalls' east end */;
  for (let z = ZC; z < Z - .05;) { const d = Math.min(Z - z, .5 + r() * .3); for (let x = -X; x < X - .05;) { const w = Math.min(X - x, .55 + r() * .4); put(new THREE.BoxGeometry(w - .02, F0, d - .02), 'flag', x + w / 2, F0 / 2, z + d / 2, 0, .7); x += w; } z += d; }
  bx('dung', -X, X, 0, .012, ZS, ZC); bx('cobble', -X, XS, 0, .12, ZM, ZS); bx('straw', XS + .05, X, 0, .06, -Z, ZS - .05);
  // ── the manger: a kerb of flags on edge, the trough's floor raised, hay in it; the rack over it, slatted, leaning out from the wall
  // under the back lights (their sills at 1.45 m); a ring and chain at the kerb for each cow
  bx('flag', -X, XS, 0, .62, ZM - .06, ZM, 'manger', 0); bx('flag', -X, XS, 0, .32, -Z, ZM - .06, 'manger', 0); for (let x = -X + .6; x < XS - .3; x += 1.3) put(new THREE.SphereGeometry(.4, 8, 4, 0, Math.PI * 2, 0, Math.PI / 2).scale(1.3, .3, .5), 'straw', x, .32, (ZM - Z) / 2 - .03);
  { const y0 = .82, y1 = 1.38, z1 = -1.72, L = Math.hypot(y1 - y0, z1 + Z - .03), a = -Math.atan2(y1 - y0, z1 + Z - .03); bx('oak', -X, XS, y0 - .06, y0, -Z, -Z + .06, 'rack', 0); bx('oak', -X, XS, y1 - .06, y1, z1 - .04, z1 + .04, 'rack', 0);
    for (let x = -X + .07; x < XS - .03; x += .14) put(new THREE.BoxGeometry(.025, .025, L), 'oak', x, (y0 + y1) / 2, (-Z + .03 + z1) / 2, 0, .6, a); }
  const stalls = [], cx = [-4.1, -1.5, 1.125]; for (const c of cx) { stalls.push({ x0: c - 1.3, x1: c + 1.3 }); for (const s of [-1, 1]) { const x = c + s * .62; put(new THREE.TorusGeometry(.05, .009, 4, 10), 'iron', x, .5, ZM + .012); for (let k = 0; k < 4; k++) put(new THREE.TorusGeometry(.022, .006, 3, 6), 'iron', x, .42 - k * .045, ZM + .015, k % 2 ? Math.PI / 2 : 0); } }
  // the divisions between the double stalls: boards on a heel post
  for (const x of [-2.8, -.2]) { bx('deal', x - .025, x + .025, .42, 1.12, ZM, ZS - .14, 'division', 0); bx('deal', x - .025, x + .025, .62, 1.12, ZM - .55, ZM - .06, 'division', 0); bx('oak', x - .06, x + .06, .12, 1.32, ZS - .14, ZS - .02, 'post', 0); }
  // ── the calf pen: a board wall from the stalls, a front of rails with its gate shut, a trough under the back wall
  bx('deal', XS, XS + .05, F0, 1.4, -Z, ZS - .02, 'penwall', 0);
  { const z0 = ZS - .07, z1 = ZS - .02; for (const y of [.3, .65, 1.0]) bx('deal', XS + .05, X, y, y + .12, z0, z1, 'penfront', 0); for (const x of [XS + .1, 3.6, X - .06]) bx('oak', x - .05, x + .05, F0, 1.16, z0 - .02, z1, 'penfront', 0);
    /* the gate's brace */ put(new THREE.BoxGeometry(Math.hypot(.95, .82), .06, .04), 'deal', 3.08, .71, z0 - .03, 0, .6, 0, Math.atan2(.82, .95)); }
  bx('oak', 4.3, 5.2, .06, .38, -Z, -1.75, 'trough', 0); bx('dung', 4.36, 5.14, .3, .385, -Z + .05, -1.81);
  // ── the loft: joists from wall to wall, a trimmer on its edge, deal boards; hay heaped under both slopes, clear of the hatch
  const joists = []; for (let x = -X + .25; x < LX - .12; x += .5) { bx('oak', x - .05, x + .05, JY, FL - .04, -Z, Z); joists.push(x); } bx('oak', LX - .1, LX, JY - .02, FL - .04, -Z, Z); bx('deal', -X, LX, FL - .04, FL, -Z, Z, null);
  farmHay(K, 1, FL, -3.4, -1.25, 1.75, .95, .72); farmHay(K, 1, FL, -3.6, 1.3, 1.45, .8, .62); farmHay(K, 1, FL, -1.7, -1.3, .8, .7, .6);
  // the ladder: two rails from the passage's back edge to over the loft's edge, oak rungs at 0.28 m
  const lad = { z0: .5, z1: .95, x0: LX + .9, yTop: FL + .95 }, dxdy = (lad.x0 - LX) / FL; { const L = Math.hypot(lad.yTop * dxdy, lad.yTop), a = Math.atan2(lad.yTop * dxdy, lad.yTop), cxl = lad.x0 - lad.yTop * dxdy / 2;
    for (const z of [lad.z0 + .03, lad.z1 - .03]) put(new THREE.BoxGeometry(.06, L, .05), 'oak', cxl, lad.yTop / 2 + .03, z, 0, .6, 0, a);
    for (let y = .28; y < FL; y += .28) { const x = lad.x0 - y * dxdy; bx('oak', x - .02, x + .02, y - .02, y + .02, lad.z0 + .05, lad.z1 - .05); }
    boxes.push({ tag: 'ladder', x0: LX - .02, x1: lad.x0 + .04, y0: 0, y1: JY, z0: lad.z0, z1: lad.z1, fl: 0 }, { tag: 'ladder', x0: LX - lad.yTop * dxdy + FL * dxdy - .04, x1: LX, y0: FL, y1: lad.yTop, z0: lad.z0, z1: lad.z1, fl: 1 }); }
  // ── the roof: a couple on every 1.6 m, collared where the byre is open to it, the purlins and the ridge board
  for (let x = -4.8; x <= 4.81; x += 1.6) K.couple(x, Z, x > LX ? 3.95 : null); K.purlins(-X, X, Z);
  // ── the doors' leaves, both standing open into the passage, each on the jamb away from the ladder; the passage's things
  const doors = K.openings(k => k === 'half'), leaves = [], hz = plan.d / 2 - .32; for (const d of doors) { const s = d.x < 0 ? -1 : 1, x = d.x + s * d.w / 2, x0 = s < 0 ? x : x - .05, x1 = x0 + .05;
    bx('leaf', x0, x1, 0, 1.12, hz - d.w + .02, hz); bx('leaf', x0, x1, 1.14, d.h, hz - d.w + .02, hz); for (const y of [.3, .85, 1.45]) bx('iron', s < 0 ? x1 : x0 - .01, s < 0 ? x1 + .01 : x0, y, y + .04, hz - .45, hz) /* the straps on the leaf's face to the room */;
    leaves.push({ x0, x1, z0: hz - d.w + .02, z1: hz }); boxes.push({ tag: 'leaf', x0, x1, y0: 0, y1: d.h, z0: hz - d.w + .02, z1: Z, fl: 0 }); }
  { const x = -1.25, z = 1.78; put(new THREE.CylinderGeometry(.15, .15, .04, 12), 'oak', x, .32, z); for (const a of [0, 2.1, 4.2]) put(new THREE.CylinderGeometry(.018, .02, .3, 5), 'oak', x + Math.cos(a) * .1, .15, z + Math.sin(a) * .1);
    boxes.push({ tag: 'stool', x0: x - .15, x1: x + .15, y0: 0, y1: .34, z0: z - .15, z1: z + .15, fl: 0 }); }
  farmPail(K, 0, F0, -.75, 1.86); farmPail(K, 0, F0, -1.7, 1.86);
  { const x0 = 4.45, x1 = 5.3, z0 = 1.45, z1 = Z - .02; bx('oak', x0, x1, F0, .66, z0, z1, 'bin', 0); bx('oak', x0 - .01, x1 + .01, .66, .7, z0 - .01, z1); }
  { const x = -2.55, L = 1.75, a = .17; put(new THREE.CylinderGeometry(.016, .016, L, 5), 'oak', x, L / 2 * Math.cos(a), Z - .06 - L / 2 * Math.sin(a), 0, .6, -a); for (const dx of [-.06, 0, .06]) put(new THREE.CylinderGeometry(.006, .004, .3, 4), 'iron', x + dx, L * Math.cos(a) + .1, Z - .06 - L * Math.sin(a) + .02);
    boxes.push({ tag: 'fork', x0: x - .1, x1: x + .1, y0: 0, y1: 1.95, z0: Z - .4, z1: Z, fl: 0 }); }
  const lamps = [farmLantern(K, 0, -2.4, 1.15, 2.08, JY), farmLantern(K, 0, 2.6, Z / 2, 2.25, under(Z / 2 + .06) - .3)];
  const F = K.finish(shell), windows = K.openings(k => k === 'win' || k === 'load'), inner = { x0: -X, x1: X, z0: -Z, z1: Z };
  const paths = [{ fl: 0, pts: [[doors[0].x, Z - .25], [doors[0].x, 1.12], [-X + .4, 1.12]] }, { fl: 0, pts: [[doors[0].x, 1.12], [3.9, 1.12]] }, { fl: 0, pts: [[doors[1].x, Z - .25], [doors[1].x, 1.12]] }, { fl: 0, pts: [[3.05, 1.12], [3.05, .5]] },
    { fl: 1, pts: [[LX - .6, .72], [LX - .6, 0], [-X + .4, 0]] }];
  const rooms = { passage: { x0: -X, x1: X, z0: ZC, z1: Z, fl: 0 }, standings: { x0: -X, x1: XS, z0: ZM, z1: ZS, fl: 0 }, pen: { x0: XS + .05, x1: X, z0: -Z, z1: ZS - .07, fl: 0 }, loft: { x0: -X, x1: LX, z0: -Z, z1: Z, fl: 1 } };
  return { ...F, shell, shellTris: shell.userData.tris, shellCalls: shell.userData.calls, inner, floors: [F0, FL], under, eave: K.eave, loft: { x0: -X, x1: LX, y: FL, joists: JY, n: joists.length }, ladder: { ...lad, x1: LX, rung: .28 },
    stalls, standing: { z0: ZM, z1: ZS, y: .12 }, channel: { z0: ZS, z1: ZC }, paths, boxes, lamps, windows, doors, leaves, rooms, w: plan.w, d: plan.d };
}

// gatelandsBarn(o, r): the barn of GL_PLANS.barn (12 by 6.4 m outside, walls of 0.7 m, two storeys of 2.7 and 2.4 m, slate at 40°): below,
//   the cart bay behind the arch (its leaves swung back outside) with the plough, the harrow and the sacks, a scythe and a flail on the
//   back wall, and through a board partition the stable from the stable door: two horse stalls facing the back wall under a high rack,
//   their manger below the slits, the feed corner with the corn bin and the harness on the east gable; a straight stair of 16 risers
//   up the west gable to the loft, open to the couples, the hay heaped by the pitching door (swung open on the hoist's gable), the grain
//   in sacks and a chest at the west end.
//   -> { group, shell, room, tris, draws, inner, floors, ceils, under(z), steps, rise, going, well, rail, slabs, paths, boxes, lamps,
//        windows, doors, leaves, rooms } in the barn's frame (its centre on the ground, front +z).
export function gatelandsBarn(o = {}, r = stream('barn')) {
  const plan = GL_PLANS.barn({}); plan.interior = true; plan.r = stream('barn-shell'); plan.open.front[0].open = true; plan.open.front[1].ajar = true; plan.open.right[0].open = true;
  const shell = gatelandsBuilding(plan), G = glMats(), M = { ...mats(), dress: G.dress, leaf: G['p:' + plan.paint], board: G.board, sack: mat('plaster', { ns: .5, color: 0xb8a27a, rough: 1 }), straw: mat('thatch', { ns: 1.2, color: 0xeadcaa, rough: 1 }), leather: new THREE.MeshStandardMaterial({ color: 0x3a2416, roughness: .75 }) };
  const K = farmKit(plan, M), { bx, put, boxes, under } = K, X = plan.w / 2 - plan.t, Z = plan.d / 2 - plan.t, F0 = .03, F1 = plan.floors[0], SL = .2, CE0 = F1 - SL, floors = [F0, F1];
  // ── the partition between the cart bay and the stable: boards on studs at x = PX, a doorway at the stable's passage
  const PX = .5, pt = .04, dSt = { z0: 1.0, z1: 1.9, h: 2.0 };
  { let a = -Z; for (const d of [dSt]) { bx('board', PX - pt, PX + pt, F0, CE0, a, d.z0, 'partition', 0); bx('board', PX - pt, PX + pt, F0 + d.h, CE0, d.z0, d.z1); for (const e of [d.z0, d.z1]) bx('oak', PX - pt - .01, PX + pt + .01, F0, F0 + d.h + .06, e - (e === d.z0 ? .06 : 0), e + (e === d.z1 ? .06 : 0)); a = d.z1; }
    bx('board', PX - pt, PX + pt, F0, CE0, a, Z, 'partition', 0); }
  // ── the floors: the bay beaten earth, the stable flagged
  bx('earth', -X, PX - pt, 0, F0, -Z, Z); for (let z = -Z; z < Z - .05;) { const d = Math.min(Z - z, .5 + r() * .3); for (let x = PX + pt; x < X - .05;) { const w = Math.min(X - x, .55 + r() * .4); put(new THREE.BoxGeometry(w - .02, F0, d - .02), 'flag', x + w / 2, F0 / 2, z + d / 2, 0, .7); x += w; } z += d; }
  // ── the stair: 16 risers up the west gable from the front to the landing at the back, on goings of 0.22 m
  const SX0 = -X, SX1 = -X + .9, SF = 1.9, Gg = .22, ri = (F1 - F0) / 16, steps = [];
  for (let i = 1; i <= 15; i++) { const y = F0 + i * ri, z1 = SF - (i - 1) * Gg, z0 = z1 - Gg; bx('oak', SX0, SX1, Math.max(y - ri - .06, F0), y, z0, z1); steps.push({ x0: SX0, x1: SX1, z0, z1, y, fl: 0 }); }
  const kHead = Math.floor((CE0 - 2.0 - F0) / ri), well = { x0: SX0, x1: SX1, z0: SF - 15 * Gg, z1: SF - kHead * Gg };
  { const L = Math.hypot(15 * Gg, F1 - F0), a = Math.atan2(F1 - F0, 15 * Gg), q = new THREE.BoxGeometry(.05, .28, L); q.rotateX(a); put(q, 'oak', SX1 + .025, (F0 + F1) / 2 + .14, SF - 7.5 * Gg);
    const q2 = new THREE.BoxGeometry(.06, .06, L + .2); q2.rotateX(a); put(q2, 'oak', SX1 + .02, (F0 + F1) / 2 + .9, SF - 7.5 * Gg); bx('oak', SX1 - .02, SX1 + .06, F0, F0 + 1.05, SF - .08, SF);
    for (let k = 1; k <= 15; k++) { const z = SF - (k - .5) * Gg, y = F0 + k * ri; bx('oak', SX1 + .005, SX1 + .035, y, y + .88, z - .012, z + .012); } }
  const rail = []; { const y = F1; for (let z = well.z0 + .1; z <= well.z1; z += .12) bx('oak', SX1 + .005, SX1 + .035, y, y + .9, z - .012, z + .012); bx('oak', SX1 - .01, SX1 + .05, y + .9, y + .96, well.z0, well.z1 + .03, 'wellrail', 1);
    for (let x = SX0 + .1; x < SX1 - .02; x += .12) bx('oak', x - .012, x + .012, y, y + .9, well.z1 + .005, well.z1 + .035); bx('oak', SX0, SX1 + .05, y + .9, y + .96, well.z1, well.z1 + .06, 'wellrail', 1); bx('oak', SX1 - .03, SX1 + .07, y, y + 1.05, well.z1 - .03, well.z1 + .07);
    rail.push({ x: SX1, z0: well.z0, z1: well.z1, y: y + .96 }, { z: well.z1, x0: SX0, x1: SX1, y: y + .96 }); }
  // ── the loft's floor: deal boards on oak joists across the barn, open over the well, bare from below
  const slabs = []; for (const [x0, x1, z0, z1] of [[SX1, X, -Z, Z], [SX0, SX1, -Z, well.z0], [SX0, SX1, well.z1, Z]]) { bx('deal', x0, x1, F1 - .04, F1, z0, z1); slabs.push({ x0, x1, z0, z1, y0: F1 - SL, y1: F1, fl: 1 }); }
  for (let x = -X + .2; x < X; x += .4) { if (x > SX0 - .03 && x < SX1 + .03) continue; bx('oak', x - .05, x + .05, CE0, F1 - .04, -Z, Z); }
  for (const x of [SX1 + .04]) bx('oak', x - .04, x + .04, CE0, F1 - .04, -Z, Z); for (const z of [well.z0, well.z1]) bx('oak', SX0, SX1, CE0, F1 - .04, z - .04, z + .04);
  // ── the roof: couples on every 1.5 m with collars at 6.6 m, the purlins and the ridge board
  for (let x = -4.5; x <= 4.51; x += 1.5) K.couple(x, Z, 6.6); K.purlins(-X, X, Z);
  // ── the stable: the manger along the back wall (its top 0.88 m, under the slits' sills), the rack high over it, two stalls between
  // boarded divisions on heel posts, the feed corner at the east gable
  const SXm = PX + pt, SXe = 4.2, ZMg = -Z + .5; bx('oak', SXm, SXe, .5, .88, -Z, ZMg, 'manger', 0); bx('oak', SXm, SXe, F0, .5, ZMg - .05, ZMg, 'manger', 0); bx('earth', SXm + .05, SXe - .05, .84, .885, -Z + .05, ZMg - .05);
  { const y0 = 1.92, y1 = 2.42, z1 = ZMg + .05, L = Math.hypot(y1 - y0, z1 + Z - .03), a = -Math.atan2(y1 - y0, z1 + Z - .03); bx('oak', SXm, SXe, y0 - .06, y0, -Z, -Z + .06, 'rack', 0); bx('oak', SXm, SXe, y1 - .06, y1, z1 - .04, z1 + .04, 'rack', 0);
    for (let x = SXm + .07; x < SXe - .03; x += .14) put(new THREE.BoxGeometry(.025, .025, L), 'oak', x, (y0 + y1) / 2, (-Z + .03 + z1) / 2, 0, .6, a); }
  const ZH = .5 /* the stalls' heels */; for (const x of [2.35, SXe]) { bx('board', x - .03, x + .03, F0, 1.45, ZMg, ZH - .12, 'stall', 0); bx('oak', x - .07, x + .07, F0, 1.9, ZH - .12, ZH, 'post', 0); put(new THREE.SphereGeometry(.07, 8, 6), 'oak', x, 1.95, ZH - .06); }
  for (const x of [1.45, 3.28]) put(new THREE.TorusGeometry(.05, .009, 4, 10), 'iron', x, .72, ZMg + .012);
  { const x0 = 4.35, x1 = 5.25, z0 = -Z + .03, z1 = -Z + .65; bx('oak', x0, x1, F0, .8, z0, z1, 'bin', 0); bx('oak', x0 - .01, x1 + .01, .8, .84, z0, z1 + .01); for (const e of [x0 + .15, x1 - .15]) bx('iron', e - .02, e + .02, .1, .84, z1, z1 + .012); }
  for (const z of [-.8, 0, .8]) { bx('oak', X - .26, X, 1.68, 1.73, z - .025, z + .025, 'peg', 0); }
  put(new THREE.TorusGeometry(.26, .06, 6, 14).scale(1, 1.25, 1), 'leather', X - .1, 1.42, -.8, Math.PI / 2); put(new THREE.TorusGeometry(.2, .035, 4, 12).scale(1, 1.3, 1), 'iron', X - .1, 1.42, -.8, Math.PI / 2);
  for (const z of [0, .8]) { for (let k = 0; k < 3; k++) bx('leather', X - .1, X - .08, 1.0 + k * .08, 1.7, z - .04 + k * .03, z - .02 + k * .03); }
  // the stable door's leaf, open into the passage on its east jamb
  const doors = K.openings(k => k === 'cart' || k === 'plank'), leaves = [], hz = plan.d / 2 - .2; { const d = doors.find(q => q.kind === 'plank'), x1 = d.x + d.w / 2, x0 = x1 - .05;
    bx('leaf', x0, x1, F0, d.h, hz - d.w + .02, hz); for (const y of [.35, 1.6]) bx('iron', x0 - .012, x0, y, y + .05, hz - .75, hz); leaves.push({ x0, x1, z0: hz - d.w + .02, z1: hz }); boxes.push({ tag: 'leaf', x0, x1, y0: F0, y1: d.h, z0: hz - d.w + .02, z1: Z, fl: 0 }); }
  // ── the cart bay: the plough by the back wall, the harrow leant on the partition, three sacks of seed, the scythe and the flail hung
  { const y = F0, z = -2.0; { const q = new THREE.BoxGeometry(2.3, .12, .1); q.rotateZ(.12); put(q, 'oak', -1.95, y + .5, z); } for (const s of [-1, 1]) { const q = new THREE.BoxGeometry(1.1, .05, .05); q.rotateZ(-.55); put(q, 'oak', -3.0, y + .6, z + s * .2, s * .15); }
    put(new THREE.BoxGeometry(.5, .32, .04).rotateY(.5), 'iron', -2.75, y + .2, z + .09); put(new THREE.BoxGeometry(.32, .04, .14), 'iron', -2.45, y + .03, z); bx('oak', -1.35, -1.29, y, y + .48, z - .03, z + .03); put(new THREE.CylinderGeometry(.18, .18, .05, 12).rotateX(Math.PI / 2), 'iron', -.85, y + .2, z);
    boxes.push({ tag: 'plough', x0: -3.3, x1: -.65, y0: y, y1: y + 1.0, z0: z - .3, z1: z + .3, fl: 0 }); }
  { const x0 = .18, x1 = PX - pt - .02, z0 = -2.35, z1 = -1.15, a = Math.atan2(x1 - x0, 1.25); for (const t2 of [0, .4, .8, 1.2]) { const q = new THREE.BoxGeometry(.06, 1.3, .07); q.rotateZ(-a); put(q, 'oak', (x0 + x1) / 2, .66, z0 + .05 + t2 * (z1 - z0 - .1) / 1.2); }
    for (const k of [0, .5, 1]) { const q = new THREE.BoxGeometry(.05, .06, z1 - z0); put(q, 'oak', x0 + .02 + k * (x1 - x0 - .06) + (1 - k) * .0, .12 + k * 1.05, (z0 + z1) / 2); }
    boxes.push({ tag: 'harrow', x0, x1, y0: F0, y1: 1.34, z0, z1, fl: 0 }); }
  for (const [x, z] of [[-.2, -.2], [.12, .25], [-.25, .45]]) { put(new THREE.SphereGeometry(.24, 10, 8).scale(1, 1.55, .9), 'sack', x, .38, z); put(new THREE.CylinderGeometry(.06, .1, .12, 8), 'sack', x, .78, z); boxes.push({ tag: 'sack', x0: x - .24, x1: x + .24, y0: F0, y1: .84, z0: z - .22, z1: z + .22, fl: 0 }); }
  { const y = 2.1, z = -Z + .05; bx('oak', -2.9, -1.3, y - .02, y + .02, z - .02, z + .03); put(new THREE.BoxGeometry(.6, .015, .1).rotateZ(-.2), 'iron', -1.15, y - .1, z + .02); for (const x of [-2.5, -1.6]) bx('oak', x - .02, x + .02, y - .06, y + .02, -Z, -Z + .1);
    bx('oak', -4.0, -3.95, 1.0, 2.15, -Z + .02, -Z + .07); bx('oak', -3.92, -3.88, .45, 1.05, -Z + .03, -Z + .07); }
  const lamps = [farmLantern(K, 0, -2.4, .55, 2.14, CE0), farmLantern(K, 0, 2.95, 1.25, 2.14, CE0), farmLantern(K, 1, .75, 0, F1 + 2.25, 6.6 - .14)];
  // ── the loft: the hay heaped under both slopes at the east end, by the pitching door; the grain at the west end in sacks and a chest
  farmHay(K, 1, F1, 3.1, 1.32, 1.9, 1.5, .6); farmHay(K, 1, F1, 2.9, -1.32, 2.1, 1.6, .6) /* off the walls by 0.55 m, clear of the slits */; farmHay(K, 1, F1, .6, -1.3, .9, .9, .55);
  for (const [x, z] of [[-3.0, -2.2], [-2.5, -2.2], [-2.0, -2.2], [-2.75, -1.75]]) { put(new THREE.SphereGeometry(.24, 10, 8).scale(1, 1.55, .9), 'sack', x, F1 + .35, z); put(new THREE.CylinderGeometry(.06, .1, .12, 8), 'sack', x, F1 + .75, z); boxes.push({ tag: 'sack', x0: x - .24, x1: x + .24, y0: F1, y1: F1 + .81, z0: z - .22, z1: z + .22, fl: 1 }); }
  { const x0 = -2.9, x1 = -1.7, z0 = Z - .62, z1 = Z - .02; bx('oak', x0, x1, F1, F1 + .66, z0, z1, 'chest', 1); bx('oak', x0 - .01, x1 + .01, F1 + .66, F1 + .7, z0 - .01, z1); }
  const F = K.finish(shell), windows = K.openings(k => k === 'win' || k === 'load'), inner = { x0: -X, x1: X, z0: -Z, z1: Z }, arch = doors.find(q => q.kind === 'cart'), sd = doors.find(q => q.kind === 'plank');
  const paths = [{ fl: 0, pts: [[arch.x, Z - .3], [arch.x, .9], [-.2, 1.45], [PX + .5, 1.45]] }, { fl: 0, pts: [[arch.x, Z - .3], [-3.6, 2.15], [(SX0 + SX1) / 2, 2.15]] }, { fl: 0, pts: [[sd.x, Z - .3], [sd.x, 1.45], [PX + .5, 1.45]] },
    { fl: 0, pts: [[sd.x, 1.45], [4.75, 1.45], [4.75, -1.45]] }, { fl: 1, pts: [[(SX0 + SX1) / 2, -1.85], [-3.85, -1.85], [-3.85, 0], [X - .45, 0]] }];
  const rooms = { bay: { x0: -X, x1: PX - pt, z0: -Z, z1: Z, fl: 0 }, stable: { x0: PX + pt, x1: X, z0: -Z, z1: Z, fl: 0 }, loft: { x0: -X, x1: X, z0: -Z, z1: Z, fl: 1 } };
  return { ...F, shell, shellTris: shell.userData.tris, shellCalls: shell.userData.calls, inner, floors, ceils: [CE0], under, eave: K.eave, steps, rise: ri, going: Gg, well, rail, slabs, paths, boxes, lamps, windows, doors, leaves, rooms,
    part: { x: PX, t: pt }, doorIn: dSt, stalls: [{ x0: SXm, x1: 2.32 }, { x0: 2.38, x1: SXe - .03 }], manger: { y: .88, z1: ZMg }, rack: { y0: 1.92, y1: 2.42 }, w: plan.w, d: plan.d };
}
