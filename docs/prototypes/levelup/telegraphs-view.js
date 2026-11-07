// A foe's tell (the concept artist, 7 Nov 2026; backlog L11, "Foes and bosses"; OG-130): telegraphs.js's three looks on a Markish raider
// winding up at a Gatelander, in the first bay of a steady Cloch gate (gatecond.js's nave), at the top of the tell (its last 0.15 s).
// ?kind=light (a forehand cut, gold) | heavy (an overhead, red) | slam (the war hammer and its 3 m ring, red),
// &level=a|b|c (body, edge, loud; telegraphs.js), &k=<0 to 1, the glow's share; 1 by default>, &cam=back (the third-person camera behind
//   the player, 3.4 m) | foe (close on the foe) | wide (high, the whole ring) | scale (side on, a 1.8 m post) | x,y,z,tx,ty,tz, &nofx.
import * as THREE from 'three';
import { Q, W, H, STILL, STATS, makeRenderer, makeComposer, buildTextures, run } from './common.js';
import { loadPack, makePerson, rollGenome, statureOf, heightFor } from './people.js';
import { gateHall } from './gatecond.js';
import { sword, fist, grip, stance, wp } from './bind.js';
import { tellPose, tellFx, TELL_KINDS, LEVEL_OF, SLAM_R } from './telegraphs.js';

const KIND = TELL_KINDS[Q.get('kind')] ? Q.get('kind') : 'heavy', LV = LEVEL_OF[Q.get('level')] || Q.get('level') || 'edge', K = +(Q.get('k') ?? 1), CAM = Q.get('cam') || 'back';
const R = makeRenderer(1.0), scene = new THREE.Scene(), cam = new THREE.PerspectiveCamera(CAM === 'foe' ? 34 : 42, W / H, .02, 2000); buildTextures();
const v = gateHall({ cond: 'steady', mode: 'school', school: 'cloch', t: 4 }); scene.add(v.group);
scene.fog = new THREE.FogExp2(new THREE.Color(...v.fog.color), v.fog.density); scene.background = new THREE.Color(...v.fog.color);
const comp = makeComposer(R, scene, cam, { bloom: .55, bloomT: .6, bloomR: .45, sat: 1.04, vig: .34 });
Object.assign(STATS, { kind: KIND, level: LV, k: K, cam: CAM, hallTris: v.tris });
const strip = D => ({ ...D, cloak: null, hood: null, cape: false, basket: null, spear: null, staff: null, crossbow: null, shoulderWrap: null, wrapTail: null, lantern: null, tankard: null, hammer: null, pipe: null });
const V = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);

// the player on guard: the bind's stance a little upright, the sword held before the body with the point up toward the foe's eyes
function onGuard(P) { const root = P.root, Bn = P.byName; root.position.set(0, root.position.y, 0); root.rotation.set(0, 0, 0); root.updateMatrixWorld(true);
  stance(P, { lean: .12, front: .3, frontKnee: .36, back: .28, backKnee: .16, twist: -.14 });
  const shR = wp(Bn['upperarm01.R']), rs = Math.sign(shR.x) || -1, hipY = wp(Bn['spine05']).y, miss = [];
  miss.push(fist(P, 'R', V(rs * .16, hipY + .2, .4), V(-rs * .15, .75, .55), V(0, .1, 1), V(rs, -1, -.3)));
  miss.push(grip(P, 'L', V(-rs * .36, hipY - .04, .04), V(0, -.7, .7), V(rs * .9, 0, .3), V(-rs, 0, -1), .5, .2));
  const Bw = wp(Bn['wrist.R']), f = wp(Bn['finger3-1.R']).sub(Bw).normalize(), k = wp(Bn['finger2-1.R']).sub(wp(Bn['finger5-1.R'])).normalize(), n = k.clone().cross(f).normalize(), len = wp(Bn['finger3-1.R']).distanceTo(Bw);
  const o = Bw.clone().addScaledVector(f, len * .62).addScaledVector(n, .022), Z = n.clone().addScaledVector(k, -n.dot(k)).normalize(), sw = sword();
  sw.matrixAutoUpdate = false; sw.matrix.copy(root.matrixWorld.clone().invert().multiply(new THREE.Matrix4().makeBasis(k.clone().cross(Z), k, Z).setPosition(o))); root.add(sw); root.updateMatrixWorld(true); return miss; }

const ticks = [];
loadPack('mh/').then(() => {
  // the player: a Gatelander of 1.78 m in mail under a dark tunic (bind.js's player)
  const Gp = rollGenome('bind:player', { people: 'gatelander', g: 1 }); Gp.dress = { ...strip(Gp.dress), shield: null, mail: [.42, .42, .44], tunic: [.16, .17, .2], belt: [.22, .14, .08] }; Gp.height = heightFor(Gp, 1.78);
  // the foe: the bind's Markish raider, 1.84 m, mail and an iron helm; the round shield for the sword's tells, none for the hammer
  const Gf = rollGenome('bind:foe', { people: 'markman', g: 1 }); Gf.dress = { ...strip(Gf.dress), shield: KIND === 'slam' ? null : [.5, .14, .1], shieldShape: 'round', mail: [.38, .38, .4], helm: [.4, .4, .42] }; Gf.height = heightFor(Gf, 1.84);
  const Pp = makePerson(Gp), Pf = makePerson(Gf); scene.add(Pp.root, Pf.root);
  for (const P of [Pp, Pf]) P.root.traverse(o => { if (o.isMesh) o.castShadow = o.receiveShadow = true; });
  // the foe 2.4 m before the player, down the nave's middle: a sword's reach and a step (the hammer's ring of 3 m takes the player in)
  const FZ = -8.0, PZ = FZ + 2.4;
  const pose = tellPose(Pf, KIND); Pf.root.position.set(0, Pf.root.position.y, FZ); Pf.root.updateMatrixWorld(true);
  const pm = onGuard(Pp); Pp.root.position.set(0, Pp.root.position.y, PZ); Pp.root.rotation.y = Math.PI; Pp.root.updateMatrixWorld(true);
  STATS.foe = { height: +statureOf(Gf).toFixed(3), miss: pose.miss, weapon: pose.weapon.userData.kind || 'sword' }; STATS.player = { height: +statureOf(Gp).toFixed(3), miss: pm };
  const tipW = pose.tip.clone().applyMatrix4(Pf.root.matrixWorld), handW = pose.hand.clone().applyMatrix4(Pf.root.matrixWorld);
  STATS.tipY = +tipW.y.toFixed(2); STATS.handY = +handW.y.toFixed(2); STATS.apart = 2.4; STATS.ringR = KIND === 'slam' ? SLAM_R : null;
  if (!Q.has('nofx')) { const fx = tellFx(Pf, pose, KIND, LV, { k: K }); scene.add(fx); STATS.fx = fx.userData; }
  // the cameras
  const chest = V(0, 1.35, FZ), mid = V(0, 1.0, (FZ + PZ) / 2);
  const CAMS = {
    back: [V(1.25, 2.05, PZ + 2.9), V(0, 1.25, FZ)],
    foe: [V(1.05, 1.62, FZ + 2.0), chest.clone().add(V(0, .18, 0))],
    wide: [V(3.6, 5.4, PZ + 4.6), V(0, 0, FZ + .6)],
    scale: [V(4.6, 1.15, (FZ + PZ) / 2), V(0, 1.0, (FZ + PZ) / 2)] };
  const C0 = CAMS[CAM] || CAMS.back; cam.position.copy(C0[0]); cam.lookAt(C0[1]);
  if (CAM.includes(',')) { const c = CAM.split(',').map(Number); cam.position.set(c[0], c[1], c[2]); cam.lookAt(c[3], c[4], c[5]); }
  cam.updateProjectionMatrix();
  if (CAM === 'scale' || Q.has('post')) { const m = new THREE.MeshStandardMaterial({ color: 0xe8dcc0, roughness: .7 }), post = new THREE.Group(); post.add(new THREE.Mesh(new THREE.BoxGeometry(.03, 1.8, .03).translate(0, .9, 0), m));
    for (let i = 1; i <= 18; i++) post.add(new THREE.Mesh(new THREE.BoxGeometry(.03, .012, i % 5 ? .08 : .16).translate(0, i * .1, .04), m)); post.position.set(1.3, 0, (FZ + PZ) / 2); scene.add(post); }
}).catch(e => { STATS.err = String(e && e.stack || e); console.error(e); }).finally(() => {
  R.info.autoReset = !STILL; R.info.reset(); const t0 = performance.now(); run(comp, cam, { tick: t => { v.tick(4 + t / 1000); for (const f of ticks) f(t / 1000); } }); STATS.tris = R.info.render.triangles; STATS.calls = R.info.render.calls; STATS.ms = Math.round(performance.now() - t0); });
