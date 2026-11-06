// Impact by surface (the concept artist, 6 Nov 2026; backlog L, "Melee, read clearly"; OG-127): impacts.js's bursts where a blow lands,
// in the first bay of a steady Cloch gate (gatecond.js's nave), the blow posed at its contact on two people of people.js.
// ?surface=steel (the riposte into a raider's opened mail) | wood (a blow on a raised round shield) | stone (a blow the foe stepped from,
//   on a pier) | flesh (a brigand in a tunic, no armour),
// &level=a|b|c (quiet, clear, loud; impacts.js), &t=<seconds after contact; by default 0.04 for sparks, 0.05 for splinters and drops, 0.1 for dust>, &cam=close | back (a third-person camera, 3.4 m) |
//   side | scale (side on, a 1.8 m post) | x,y,z,tx,ty,tz, &nofx (the blow without its burst).
import * as THREE from 'three';
import { Q, W, H, STILL, STATS, makeRenderer, makeComposer, buildTextures, run } from './common.js';
import { loadPack, makePerson, rollGenome, statureOf, heightFor } from './people.js';
import { gateHall } from './gatecond.js';
import { bindPose, sword, fist, palm, stance, grip, wp } from './bind.js';
import { impact, IMPACT_SURFACES, LEVEL_OF, HOLD } from './impacts.js';

const SURF = IMPACT_SURFACES[Q.get('surface')] ? Q.get('surface') : 'steel', LV = LEVEL_OF[Q.get('level')] || Q.get('level') || 'clear', T = +(Q.get('t') ?? { steel: .04, wood: .05, stone: .1, flesh: .05 }[Q.get('surface') || 'steel'] ?? .04), CAM = Q.get('cam') || 'close';
const R = makeRenderer(1.0), scene = new THREE.Scene(), cam = new THREE.PerspectiveCamera(CAM === 'close' ? 34 : 42, W / H, .02, 2000); buildTextures();
const v = gateHall({ cond: 'steady', mode: 'school', school: 'cloch', t: 4 }); scene.add(v.group);
scene.fog = new THREE.FogExp2(new THREE.Color(...v.fog.color), v.fog.density); scene.background = new THREE.Color(...v.fog.color);
const comp = makeComposer(R, scene, cam, { bloom: .55, bloomT: .6, bloomR: .45, sat: 1.04, vig: .34 });
Object.assign(STATS, { surface: SURF, level: LV, t: T, cam: CAM, hold: HOLD[LV], hallTris: v.tris });
const strip = D => ({ ...D, cloak: null, hood: null, cape: false, basket: null, spear: null, staff: null, crossbow: null, shoulderWrap: null, wrapTail: null, lantern: null, tankard: null, hammer: null, pipe: null });
const Mof = P => new THREE.Matrix4().compose(new THREE.Vector3(P.root.position.x, 0, P.root.position.z), new THREE.Quaternion().setFromEuler(P.root.rotation), new THREE.Vector3(1, 1, 1));
const yawM = y => new THREE.Matrix4().makeRotationY(y);
const V = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);

// the foe's guard (wood, stone): the bind's stance, the round shield brought up before the chest, the sword cocked back over the shoulder
function guard(P) { const root = P.root, Bn = P.byName; root.position.set(0, root.position.y, 0); root.rotation.set(0, 0, 0); root.updateMatrixWorld(true);
  stance(P, { lean: .12, front: .3, frontKnee: .36, back: .28, backKnee: .14, twist: .1 });
  const shR = wp(Bn['upperarm01.R']), shL = wp(Bn['upperarm01.L']), rs = Math.sign(shR.x) || -1, miss = [];
  miss.push(grip(P, 'L', V(-rs * .02, shL.y - .2, .42), V(rs * .9, .35, 0), V(0, 0, -1), V(-rs, -.6, -.3), .85));
  miss.push(fist(P, 'R', V(rs * .3, shR.y + .12, -.02), V(rs * .15, .9, -.4), V(0, .1, 1), V(rs, -1, -.4)));
  const pm = palm(P, 'R'), sw = sword(), inv = root.matrixWorld.clone().invert(), Y = pm.k.clone().normalize(), Z = pm.n.clone().addScaledVector(Y, -pm.n.dot(Y)).normalize();
  sw.matrixAutoUpdate = false; sw.matrix.copy(inv.multiply(new THREE.Matrix4().makeBasis(Y.clone().cross(Z), Y, Z).setPosition(pm.o))); root.add(sw); root.updateMatrixWorld(true); return { miss }; }

// the striker at contact: posed at the origin facing +z (the kit's frame), then set where the hand must be. The blade lies across the
// struck surface along the cut, 35° into it (a body is round; the edge bites), the point of contact 0.68 m from the hand (the blade's outer third, where a cut lands); the hand in front of the
// sword shoulder. Returns how far the blade's line passes from the point (0 when the edge is on it).
function strike(P, Tw, Nw, yaw, o = {}) { const root = P.root, Bn = P.byName; root.position.set(0, root.position.y, 0); root.rotation.set(0, 0, 0); root.updateMatrixWorld(true);
  stance(P, { lean: .22, front: .44, frontKnee: .5, back: .34, backKnee: .1, twist: -.32 });
  const shR = wp(Bn['upperarm01.R']), rs = Math.sign(shR.x) || -1, hipY = wp(Bn['spine05']).y;
  // the blade's line in the world: from the striker's sword side across to its off side and a little down (a forehand cut, high right
  // to low left), laid along the surface and turned 15° in
  const Ry = yawM(yaw), left = V(-rs, 0, 0).applyMatrix4(Ry), fwd = V(0, 0, 1).applyMatrix4(Ry), d0 = left.clone().multiplyScalar(.8).addScaledVector(fwd, .45).add(V(0, o.down ?? -.25, 0));
  const tan = d0.addScaledVector(Nw, -d0.dot(Nw)).normalize(), D = tan.clone().multiplyScalar(Math.cos(.61)).addScaledVector(Nw, -Math.sin(.61)).normalize(), S = o.along ?? .68, Gw = Tw.clone().addScaledVector(D, -S);
  // the root: so the hand sits 0.5 m before the sword shoulder, a hand's width in from it
  const Gl0 = V(shR.x * .55, 0, .55).applyMatrix4(Ry), rootW = V(Gw.x - Gl0.x, 0, Gw.z - Gl0.z);
  const inv = new THREE.Matrix4().compose(rootW, new THREE.Quaternion().setFromAxisAngle(V(0, 1, 0), yaw), V(1, 1, 1)).invert(), Gl = Gw.clone().applyMatrix4(inv), Dl = D.clone().transformDirection(inv);
  const miss = [fist(P, 'R', Gl, Dl, V(0, .1, 1), V(rs, -1, -.2))];
  // the off hand out low and back for balance
  miss.push(grip(P, 'L', V(-rs * .38, hipY - .08, -.16), V(0, -.8, .3), V(rs * .9, 0, .3), V(-rs, -.3, -1), .5, .2));
  const pm = palm(P, 'R'), sw = sword(), Y = pm.k.clone().normalize(), Z = pm.n.clone().addScaledVector(Y, -pm.n.dot(Y)).normalize();
  root.updateMatrixWorld(true); sw.matrixAutoUpdate = false; sw.matrix.copy(root.matrixWorld.clone().invert().multiply(new THREE.Matrix4().makeBasis(Y.clone().cross(Z), Y, Z).setPosition(pm.o))); root.add(sw);
  root.position.x = rootW.x; root.position.z = rootW.z; root.rotation.y = yaw; root.updateMatrixWorld(true);
  const M = Mof(P), a0 = pm.o.clone().applyMatrix4(M), ad = Y.clone().transformDirection(M), s = Tw.clone().sub(a0).dot(ad);
  return { miss, lineMiss: +a0.clone().addScaledVector(ad, s).distanceTo(Tw).toFixed(3), along: +s.toFixed(3), cutDir: D.clone().cross(Nw).normalize(), D, sword: sw, root: rootW }; }

// the first surface a ray meets among `objs` (skinned bodies are tested as posed), its normal turned toward the ray's start
function hit(from, to, objs) { const rc = new THREE.Raycaster(from, to.clone().sub(from).normalize(), 0, from.distanceTo(to) + 1.5); const h = rc.intersectObjects(objs, true).find(x => x.face && !x.object.userData.noHit);
  if (!h) return null; const n = h.face.normal.clone().transformDirection(h.object.matrixWorld); if (n.dot(rc.ray.direction) > 0) n.negate(); return { p: h.point, n, obj: h.object.name || h.object.type }; }

const ticks = [];
loadPack('mh/').then(() => {
  // the striker: a Gatelander of 1.78 m in mail under a dark tunic (bind.js's player)
  const Gp = rollGenome('bind:player', { people: 'gatelander', g: 1 }); Gp.dress = { ...strip(Gp.dress), shield: null, mail: [.42, .42, .44], tunic: [.16, .17, .2], belt: [.22, .14, .08] }; Gp.height = heightFor(Gp, 1.78);
  // the foe: the bind's Markish raider (mail, helm; the round shield for wood and stone, none for steel, so the opened chest is seen); for flesh a Gatelander brigand in a tunic
  let Gf, tint;
  if (SURF === 'flesh') { Gf = rollGenome('impact:brigand', { people: 'gatelander', g: 1 }); tint = [.42, .3, .18]; Gf.dress = { ...strip(Gf.dress), shield: null, mail: null, helm: null, tunic: tint, belt: [.2, .13, .08] }; Gf.height = heightFor(Gf, 1.76); }
  else { Gf = rollGenome('bind:foe', { people: 'markman', g: 1 }); Gf.dress = { ...strip(Gf.dress), shield: SURF === 'steel' ? null : [.5, .14, .1], shieldShape: 'round', mail: [.38, .38, .4], helm: [.4, .4, .42] }; Gf.height = heightFor(Gf, 1.84); tint = [.5, .14, .1]; }
  const Pp = makePerson(Gp), Pf = makePerson(Gf); scene.add(Pp.root, Pf.root);
  for (const P of [Pp, Pf]) P.root.traverse(o => { if (o.isMesh) o.castShadow = o.receiveShadow = true; });
  // the foe placed and posed; then where the blow lands
  let Tw, Nw, yaw;
  const PZ = -5.2;
  if (SURF === 'steel' || SURF === 'flesh') {
    // the riposte: the foe beaten open (the bind's A), the blow on the chest's off side, below the collar
    const rf = bindPose(Pf, 'foe', 'deflect', { gap: 1.4 }); Pf.root.position.set(0, Pf.root.position.y, PZ - 1.5); Pf.root.updateMatrixWorld(true);
    const ch = wp(Pf.byName['spine03']), sh = wp(Pf.byName['upperarm01.L']), aim = ch.clone().lerp(sh, .55).add(V(0, .04, 0)), h = hit(aim.clone().add(V(-.15, .1, 1)), aim, [Pf.root]);
    if (!h) throw new Error('no hit on the foe'); Tw = h.p; Nw = h.n; yaw = Math.PI; STATS.on = h.obj;
  } else if (SURF === 'wood') {
    guard(Pf); Pf.root.position.set(0, Pf.root.position.y, PZ - 1.5); Pf.root.updateMatrixWorld(true);
    let shield = null; Pf.root.traverse(o => { if (o.name === 'shield') shield = o; }); if (!shield) throw new Error('no shield');
    const c = new THREE.Box3().setFromObject(shield).getCenter(V()), aim = c.clone().add(V(-.04, .25, 0)), h = hit(aim.clone().add(V(-.2, .15, 1.2)), aim, [shield]); /* on the boards above the boss */
    if (!h) throw new Error('no hit on the shield'); Tw = h.p; Nw = h.n; yaw = Math.PI; STATS.on = h.obj;
  } else {
    // a pier of the nave's left row (x −15.45, 4 m square): the foe stepped aside, the blow carries on into the stone
    v.group.updateMatrixWorld(true); yaw = -Math.PI / 2; const aim = V(-13.45, 1.28, -13.0), h = hit(V(-12.2, 1.36, -13.1), aim.clone().add(V(-.5, 0, 0)), [v.group]);
    if (!h) throw new Error('no hit on the pier'); Tw = h.p; Nw = h.n; STATS.on = h.obj;
    guard(Pf); Pf.root.position.set(Tw.x + 1.0, Pf.root.position.y, Tw.z + 1.2); Pf.root.rotation.y = -.35; Pf.root.updateMatrixWorld(true);
  }
  const s = strike(Pp, Tw, Nw, yaw, { down: { steel: -.35, flesh: -.4, wood: -.15, stone: -.3 }[SURF] });
  // the edge travels across the surface: down and to the striker's off side
  const cut = s.cutDir.y > 0 ? s.cutDir.negate() : s.cutDir;
  STATS.contact = { at: Tw.toArray().map(x => +x.toFixed(3)), n: Nw.toArray().map(x => +x.toFixed(2)), along: s.along, lineMiss: s.lineMiss, miss: s.miss };
  STATS.player = { height: +statureOf(Gp).toFixed(3) }; STATS.foe = { height: +statureOf(Gf).toFixed(3) }; STATS.apart = +Math.hypot(Pp.root.position.x - Pf.root.position.x, Pp.root.position.z - Pf.root.position.z).toFixed(2);
  if (!Q.has('nofx')) { const fx = impact(SURF, LV, { at: Tw, n: Nw, cut, t: T, tint, seed: 1 }); scene.add(fx); STATS.fx = { ...fx.userData, light: undefined }; }
  // the cameras, from the point and the striker
  const side = V(0, 1, 0).cross(Nw).normalize(), pr = V(Pp.root.position.x, 0, Pp.root.position.z), mid = pr.clone().lerp(Tw.clone().setY(0), .5);
  const fwd = Tw.clone().setY(0).sub(pr).normalize(), right = fwd.clone().cross(V(0, 1, 0)).normalize();
  const CAMS = {
    close: [Tw.clone().addScaledVector(Nw.clone().setY(0).normalize(), 1.0).addScaledVector(right, -1.05).add(V(0, .3, 0)), Tw.clone().addScaledVector(right, -.1).add(V(0, -.05, 0))],
    near: [Tw.clone().addScaledVector(Nw.clone().setY(0).normalize(), .55).addScaledVector(right, -.6).add(V(0, .15, 0)), Tw],
    back: [pr.clone().addScaledVector(fwd, -2.6).addScaledVector(right, .9).add(V(0, 2.0, 0)), Tw.clone().lerp(mid.clone().setY(1.2), .3)],
    side: [mid.clone().addScaledVector(right, 4.0).add(V(0, 1.3, 0)), mid.clone().add(V(0, 1.15, 0))],
    scale: [mid.clone().addScaledVector(right, 4.2).add(V(0, 1.0, 0)), mid.clone().add(V(0, .95, 0))] };
  const C0 = CAMS[CAM] || CAMS.close; cam.position.copy(C0[0]); cam.lookAt(C0[1]);
  if (CAM.includes(',')) { const c = CAM.split(',').map(Number); cam.position.set(c[0], c[1], c[2]); cam.lookAt(c[3], c[4], c[5]); }
  cam.updateProjectionMatrix(); STATS.camDist = +cam.position.distanceTo(Tw).toFixed(2);
  if (CAM === 'scale' || Q.has('post')) { const m = new THREE.MeshStandardMaterial({ color: 0xe8dcc0, roughness: .7 }), post = new THREE.Group(); post.add(new THREE.Mesh(new THREE.BoxGeometry(.03, 1.8, .03).translate(0, .9, 0), m));
    for (let i = 1; i <= 18; i++) post.add(new THREE.Mesh(new THREE.BoxGeometry(.03, .012, i % 5 ? .08 : .16).translate(0, i * .1, .04), m)); post.position.copy(mid.clone().addScaledVector(right, .9)); scene.add(post); }
}).catch(e => { STATS.err = String(e && e.stack || e); console.error(e); }).finally(() => {
  R.info.autoReset = !STILL; R.info.reset(); const t0 = performance.now(); run(comp, cam, { tick: t => { v.tick(4 + t / 1000); for (const f of ticks) f(t / 1000); } }); STATS.tris = R.info.render.triangles; STATS.calls = R.info.render.calls; STATS.ms = Math.round(performance.now() - t0); });
