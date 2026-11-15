// A ship's arms in the new kit (card F11, backlog L6; naval combat B's first look session, docs/design/naval-combat.md: "the ballista and
// the gun deck's guns"; Session 2243, a prototype). The systems builder built the rules (Sessions 1820–1822): a ballista fitted to any
// hull looses from her bow over a 60° arc (BALLISTA.arc, 30° either side of the stem), and a galleon fires six guns a side through her
// ports. Nothing in the world drew either: the bow was bare and the ports stayed shut while the broadside fired.
//
// ballista(o): a torsion engine on a pivot, in true metres, +z forward, y 0 the deck it stands on.
//   The pedestal: two crossed sole timbers 1.1 m, strapped in iron, four braces, and a post 0.22 m square to an iron turntable at 1.1.
//   The traverse (o.yaw, radians): the fork, the stock and the head turn on the turntable together.
//   The head (the capitulum) at the stock's fore end: two skein frames, each two uprights between a top and a bottom beam, the skeins of
//   twisted sinew 0.6 m tall bound in iron washers with their levers. Two arms 0.75 m out of the skeins, drawn back 40°, and the string
//   to the claw on the slider. The stock 1.95 m long (a land engine's 2.3) with its trough, the slider, the trigger, the windlass at its tail with two spoked
//   hand wheels, and a bolt laid in the trough.
//   o.dress: 'gatelands' oiled oak and black iron, 'mark' tarred timber, red arms and iron, 'aurenne' pale oiled wood and bronze.
//   -> { group, tris, draws, R (the plan radius it sweeps), parts }
// bolt(o): the bolt alone, 1.2 m: an ash shaft, a square iron head, three wooden vanes; o.fire a head wrapped in pitched tow.
// fitBallista(S, o): stands a ballista on ship S (any ships.js hull) as far forward as its whole sweep (±30°) keeps 0.12 m inside her
//   rail: on her forecastle where she has one (the cog, the galleon), else on her foredeck forward of the mast. -> { ...ballista, x, y, z }
// runOutGuns(S, o): the galleon's six guns a side run out through her ports (S.ports, laid with o.guns so the lids stand open): a cast
//   barrel 2.4 m long (a saker's), its muzzle 0.55 m outside the planking, the dark of the port behind it. Iron for the Gatelands and the
//   Mark, bronze for Aurenne. -> { group, tris, draws, guns: [[side, z, y, muzzle x]] }
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { mat, worldUV } from './common.js';

const AM = new Map();
function armsMats(dress) { if (AM.has(dress)) return AM.get(dress);
  const MK = dress === 'mark', AU = dress === 'aurenne';
  const M = { frame: mat('wood', { ns: .8, color: MK ? 0x2e2723 : AU ? 0xd8b98a : 0xb08658, rough: .65 }),
    stock: mat('wood', { ns: .9, color: MK ? 0x6a4a32 : AU ? 0xc9a676 : 0x9c7448, rough: .7 }),
    arm: mat('wood', { ns: .7, color: MK ? 0x8a2a20 : AU ? 0x7a5236 : 0x6e4e32, rough: .6 }),
    metal: new THREE.MeshStandardMaterial({ color: AU ? 0xa8783a : 0x2c2a28, roughness: AU ? .38 : .5, metalness: AU ? .85 : .6 }),
    sinew: new THREE.MeshStandardMaterial({ color: 0x5a4632, roughness: .95 }),
    cord: new THREE.MeshStandardMaterial({ color: 0xcfc2a0, roughness: .9 }),
    dark: new THREE.MeshStandardMaterial({ color: 0x0c0a08, roughness: 1 }) };
  AM.set(dress, M); return M; }
function kit(M) { const B = new Map();
  const put = (geo, key, x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0) => { const g = geo.index ? geo.toNonIndexed() : geo; for (const k of Object.keys(g.attributes)) if (!['position', 'normal'].includes(k)) g.deleteAttribute(k);
    g.applyMatrix4(new THREE.Matrix4().compose(new THREE.Vector3(x, y, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(rx, ry, rz, 'YXZ')), new THREE.Vector3(1, 1, 1))); worldUV(g, .6);
    if (!B.has(key)) B.set(key, []); B.get(key).push(g); return g; };
  const rod = (a, b, r0, r1, key, seg = 6) => { const A = new THREE.Vector3(...a), Bv = new THREE.Vector3(...b), d = Bv.clone().sub(A), g = new THREE.CylinderGeometry(r1, r0, d.length(), seg);
    g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.clone().normalize())); const m = A.clone().add(Bv).multiplyScalar(.5); return put(g, key, m.x, m.y, m.z); };
  const finish = (M, extra) => { const group = new THREE.Group(); let tris = 0; for (const [k, gs] of B) { const g = mergeGeometries(gs, false); gs.forEach(x => x.dispose()); const m = new THREE.Mesh(g, M[k]); m.name = k; m.castShadow = true; m.receiveShadow = true; group.add(m); tris += g.attributes.position.count / 3; }
    return { group, tris: Math.round(tris), draws: group.children.length, ...extra }; };
  return { put, rod, finish }; }

// the bolt's parts, laid along +z from its nock at z0, its axis at y; into a kit
function boltInto(K, z0, y, fire) { const { put, rod } = K, L = 1.2;
  rod([0, y, z0], [0, y, z0 + L - .14], .022, .022, 'stock');
  put(new THREE.ConeGeometry(.04, .16, 4).rotateX(Math.PI / 2).rotateZ(Math.PI / 4), 'metal', 0, y, z0 + L - .07);
  put(new THREE.CylinderGeometry(.026, .03, .06, 6).rotateX(Math.PI / 2), 'metal', 0, y, z0 + L - .17);
  for (let k = 0; k < 3; k++) { const a = k * Math.PI * 2 / 3 + Math.PI / 2; put(new THREE.BoxGeometry(.006, .055, .22).translate(0, .045, 0).rotateZ(a), 'frame', 0, y, z0 + .16); }
  if (fire) { put(new THREE.SphereGeometry(.065, 8, 6).scale(1, 1, 1.9), 'sinew', 0, y, z0 + L - .3); for (const dz of [-.07, 0, .07]) put(new THREE.TorusGeometry(.06, .006, 4, 10), 'cord', 0, y, z0 + L - .3 + dz); } }

export function bolt(o = {}) { const M = armsMats(o.dress || 'gatelands'), K = kit(M); boltInto(K, -.6, 0, !!o.fire); return K.finish(M, { L: 1.2 }); }

export function ballista(o = {}) {
  const SC = .8, LIFT = .3; /* what turns is 0.8 of the land engine; the post 0.3 m taller than a land mount, the bolt's bed 1.36 m over the deck, over a bow's rising rail */
  const dress = o.dress || 'gatelands', M = armsMats(dress), K = kit(M), { put, rod } = K, yaw = o.yaw || 0;
  // the pedestal, which does not turn
  for (const a of [0, Math.PI / 2]) { put(new THREE.BoxGeometry(1.1, .16, .2), 'frame', 0, .085, 0, 0, a); for (const e of [-1, 1]) put(new THREE.BoxGeometry(.04, .165, .22), 'metal', e * .45 * Math.cos(a), .0875, -e * .45 * Math.sin(a), 0, a); } /* 5 mm off the deck, so the check's rays do not graze it */
  for (const [x, z] of [[.42, .12], [-.42, -.12], [.12, -.42], [-.12, .42]]) put(new THREE.CylinderGeometry(.025, .025, .02, 6), 'metal', x, .17, z);
  put(new THREE.BoxGeometry(.22, .94, .22), 'frame', 0, .63, 0);
  for (const [x, z] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) rod([x * .1, .6, z * .1], [x * .44, .16, z * .44], .035, .035, 'frame'); /* four braces from the post down to the soles */
  put(new THREE.BoxGeometry(.24, .05, .24), 'metal', 0, LIFT + .73, 0); put(new THREE.CylinderGeometry(.19, .19, .05, 16), 'metal', 0, LIFT + .78, 0);
  // what turns: built about the pivot, then turned by yaw
  const T = []; const tput = (geo, key, x, y, z, rx, ry, rz) => T.push(put(geo, key, x, y, z, rx, ry, rz)), trod = (a, b, r0, r1, key, seg) => T.push(rod(a, b, r0, r1, key, seg));
  const SY = 1.08; /* the stock's top: the bolt's bed */
  tput(new THREE.CylinderGeometry(.17, .17, .04, 14), 'frame', 0, .825, 0);
  for (const e of [-1, 1]) tput(new THREE.BoxGeometry(.05, .22, .2), 'frame', e * .13, .94, 0);
  trod([-.18, .97, 0], [.18, .97, 0], .025, .025, 'metal');
  // the stock: two cheeks and a trough between them, the slider in the trough, drawn back
  const z0 = -.95, z1 = 1.0; /* a ship's stock is short: a land engine's is 2.3 m */ for (const e of [-1, 1]) tput(new THREE.BoxGeometry(.07, .16, z1 - z0), 'stock', e * .075, SY - .08, (z0 + z1) / 2);
  tput(new THREE.BoxGeometry(.08, .06, z1 - z0), 'stock', 0, SY - .13, (z0 + z1) / 2); tput(new THREE.BoxGeometry(.075, .01, z1 - z0 - .1), 'dark', 0, SY - .095, (z0 + z1) / 2);
  for (const z of [-.8, -.25, .5]) tput(new THREE.BoxGeometry(.23, .17, .035), 'metal', 0, SY - .08, z);
  const CZ = -.38; /* the claw, the string drawn to it */
  tput(new THREE.BoxGeometry(.07, .05, 1.0), 'frame', 0, SY - .02, CZ + .3); tput(new THREE.BoxGeometry(.08, .07, .1), 'metal', 0, SY + .035, CZ); tput(new THREE.BoxGeometry(.02, .12, .03), 'metal', 0, SY - .06, CZ - .08, -.5);
  // the head: two skein frames either side of the bolt's window
  const HZ = .82, HH = .34; for (const e of [-1, 1]) { for (const x of [.13, .4]) tput(new THREE.BoxGeometry(.07, HH * 2 + .12, .14), 'frame', e * x, SY, HZ);
    for (const s of [-1, 1]) { tput(new THREE.CylinderGeometry(.12, .12, .045, 12), 'metal', e * .265, SY + s * (HH + .085), HZ); tput(new THREE.BoxGeometry(.26, .025, .03), 'metal', e * .265, SY + s * (HH + .12), HZ, 0, e * .5); }
    const sk = new THREE.CylinderGeometry(.075, .075, HH * 2 - .04, 10, 6, true), P = sk.attributes.position; for (let k = 0; k < P.count; k++) { const a = Math.atan2(P.getZ(k), P.getX(k)) + P.getY(k) * 6, r = .072 + .008 * Math.cos(6 * a); P.setX(k, r * Math.cos(Math.atan2(P.getZ(k), P.getX(k)))); P.setZ(k, r * Math.sin(Math.atan2(P.getZ(k), P.getX(k)))); } sk.computeVertexNormals();
    tput(sk, 'sinew', e * .265, SY, HZ); }
  for (const s of [-1, 1]) tput(new THREE.BoxGeometry(.94, .09, .16), 'frame', 0, SY + s * (HH + .02), HZ);
  for (const s of [-1, 1]) for (const e of [-1, 1]) tput(new THREE.BoxGeometry(.03, .1, .17), 'metal', e * .44, SY + s * (HH + .02), HZ);
  // the arms, drawn back 40°, and the string to the claw
  const ad = 40 * Math.PI / 180, AL = .75, tip = e => [e * (.265 + AL * Math.cos(ad)), SY + .01, HZ - AL * Math.sin(ad) - .02];
  for (const e of [-1, 1]) { const t = tip(e); trod([e * .265, SY + .01, HZ - .03], t, .045, .026, 'arm'); tput(new THREE.SphereGeometry(.03, 6, 4), 'metal', ...t); trod(t, [0, SY + .045, CZ + .02], .008, .008, 'cord', 4); }
  boltInto({ put: tput, rod: trod }, CZ + .06, SY + .045, !!o.fire);
  // the windlass at the stock's tail: an axle, two hand wheels of four spokes, and its rope to the slider
  const WZ = -.85, WY = SY - .1; trod([-.27, WY, WZ], [.27, WY, WZ], .035, .035, 'frame'); trod([0, WY + .03, WZ], [0, SY - .01, CZ - .1], .01, .01, 'cord', 4);
  for (const e of [-1, 1]) { tput(new THREE.CylinderGeometry(.06, .06, .04, 10).rotateZ(Math.PI / 2), 'metal', e * .27, WY, WZ);
    for (let k = 0; k < 4; k++) { const a = k * Math.PI / 2 + Math.PI / 4; trod([e * .27, WY, WZ], [e * .27, WY + .21 * Math.sin(a), WZ + .21 * Math.cos(a)], .018, .014, 'frame'); trod([e * .27, WY + .21 * Math.sin(a), WZ + .21 * Math.cos(a)], [e * .37, WY + .21 * Math.sin(a), WZ + .21 * Math.cos(a)], .016, .016, 'frame'); } }
  /* a ship's engine, a scorpion's size: what turns is drawn at the land engine's measure and built at 0.8 of it, about its pivot */
  for (const g of T) { g.translate(0, -.8, 0).scale(SC, SC, SC).translate(0, .8 + LIFT, 0); if (yaw) g.rotateY(yaw); }
  // the plan radius it sweeps: every point of the part that turns, before the turn (a hand wheel's grip is the far point)
  let R = .62; for (const g of T) { const P = g.attributes.position; for (let k = 0; k < P.count; k++) R = Math.max(R, Math.hypot(P.getX(k), P.getZ(k))); }
  return K.finish(M, { R: +R.toFixed(3), dress, yaw, head: { z: HZ * SC, y: .8 + (SY - .8) * SC + LIFT, span: +(2 * tip(1)[0] * SC).toFixed(3) }, bed: .8 + (SY + .045 - .8) * SC + LIFT, plan: planPts() });
}
// the plan outline of what turns (x, z before the turn): the head's corners, the arms' tips, the stock's ends, the hand wheels' grips
function planPts() { const ad = 40 * Math.PI / 180, tx = .265 + .75 * Math.cos(ad), tz = .82 - .75 * Math.sin(ad) - .02, P = [];
  for (const e of [-1, 1]) { P.push([e * .47, .9], [e * .47, .75], [e * (tx + .03), tz], [e * .11, 1.0], [e * .11, -.95]); for (let k = 0; k < 4; k++) { const a = k * Math.PI / 2 + Math.PI / 4; P.push([e * .385, -.85 + .225 * Math.cos(a)]); } }
  return P.map(([x, z]) => [x * .8, z * .8]); }

// where on S the ballista stands: the deck it stands on, its breadth there and the stretch it may stand in
function bowDeck(S) { const F = S.castles && S.castles.fore;
  if (F) return { y: F.y, z0: F.z0 + .25, zmin: F.z0 + .1, z1: F.z1 - .1, half: z => S.sect(z, 1)[0] - .09 };
  /* forward of her foremost mast: a caravel's fore lateen stands well forward of S.mast, her main */
  const mz = Math.max(S.mast[1], ...[...(S.lateens || []), ...(S.squares || []), ...(S.gaffs || [])].map(m => m.mast[1]), ...(S.sails || []).map(m => m.mz));
  return { y: S.deck, z0: mz + .45, zmin: mz + .3 /* nothing of it aft of the foremost mast's face */, z1: S.L / 2 - .2, half: z => Math.min(S.deckAt(z), S.sect(z, 1)[0] - .06) - .05 }; }
export const ARC = Math.PI / 6;
// It stands off the centreline, to starboard (-x): the stem head, the bowsprit, the stays and the headsails' tacks all
// come down to the middle of her bow, and the bolt flies past them, as a bow-chaser's port is cut beside the bowsprit.
export function fitBallista(S, o = {}) { const D = bowDeck(S), P = planPts(), clear = .12;
  /* 0.8 m to starboard: at its traverse's ends nothing of the engine comes within 7 cm of her centreline, where her stays and her
     headsails' feet run; the bow narrows, so the small hulls stand it nearer the mast. Where her bow is too fine for that forward of her
     foremost mast (the caravel's), the most outboard of 0.75 to 0.5 m that fits */
  if (o.z == null) { let z = null, x = o.x ?? -.8; for (const t of o.x != null ? [o.x] : [-.8, -.75, -.7, -.65, -.6, -.55, -.5]) { z = fitAt(S, D, P, clear, t); if (z != null) { x = t; break; } }
    if (z == null) return null; o = { ...o, x, z }; }
  const X = o.x ?? -.8, z = o.z;
  const B = ballista({ dress: o.dress || S.dress, yaw: o.yaw || 0, fire: o.fire }); B.group.position.set(X, D.y, z); S.group.add(B.group);
  return { ...B, x: X, y: D.y, z: +z.toFixed(2), deck: D }; }
function fitAt(S, D, P, clear, X) {
  const fits = z => { if (z < D.z0) return false; for (let a = -ARC; a <= ARC + 1e-6; a += ARC / 6) { const c = Math.cos(a), s = Math.sin(a);
      for (const [x, pz] of P) { const wx = X + x * c + pz * s, wz = -x * s + pz * c + z; if (wz > D.z1 || wz < D.zmin || Math.abs(wx) > D.half(wz) - clear) return false; } } return true; };
  for (let t = D.z1; t >= D.z0; t -= .05) if (fits(t)) return +t.toFixed(2); return null; }

export function runOutGuns(S, o = {}) { const AU = (o.dress || S.dress) === 'aurenne', M = armsMats(AU ? 'aurenne' : 'gatelands'), K = kit(M), guns = [];
  // a saker turned in the lathe: the breech's cascabel, three reinforces stepping down, the chase, the muzzle's swell and its lip
  const prof = [[0, -.06], [.05, -.06], [.06, -.02], [.035, 0], [.13, 0], [.135, .06], [.125, .08], [.125, .7], [.135, .72], [.115, .76], [.112, 1.4], [.12, 1.42], [.098, 1.46], [.095, 2.15], [.11, 2.22], [.115, 2.3], [.1, 2.34], [.06, 2.34], [.06, 2.2]];
  const barrel = new THREE.LatheGeometry(prof.map(([r, y]) => new THREE.Vector2(r, y)), 14); barrel.rotateX(Math.PI / 2); barrel.translate(0, 0, -2.34 + .55); /* the muzzle at z = +0.55 */
  for (const [e, z, y] of S.ports) { const u = (y - S.keelAt(z)) / (S.sheerAt(z) - S.keelAt(z)), p = S.sect(z, u), x = e * p[0];
    const g = barrel.clone(); g.rotateY(e > 0 ? Math.PI / 2 : -Math.PI / 2); K.put(g, 'metal', x, y - .02, z);
    K.put(new THREE.BoxGeometry(.03, .44, .5), 'dark', x + e * .012, y, z); /* the dark of the open port */
    guns.push([e, z, y, +(x + e * .55).toFixed(2)]); }
  const r = K.finish(M, { guns }); S.group.add(r.group); return r; }
