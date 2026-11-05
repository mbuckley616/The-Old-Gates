// The bind (the concept artist, 5 Nov 2026; backlog L7, OG-045 and OG-063): bind.js's poses on two people in the first bay of a steady gate
// (gatecond.js's nave, the gate kit's stones, Cloch by default: OG-045's tunnel of arches lit by amber script).
// ?pose=deflect|bind|spell (A the blade beaten aside, B the blades crossed high, C the bind with the spell cocked low behind),
// &cam=back (over the player's shoulder, OG-045's framing) | side | close | front | wide | scale (side on, a 1.8 m post between them)
//   | x,y,z,tx,ty,tz, &school=<the spell's school> (Uisce by default: OG-045's blue), &hall=<the gate's school>, &gap=<metres between them>,
// &nopeople. The player is a Gatelander, the foe a Markish raider in mail and helm with a round shield.
import * as THREE from 'three';
import { Q, W, H, STILL, STATS, makeRenderer, makeComposer, buildTextures, run } from './common.js';
import { loadPack, makePerson, rollGenome, statureOf, heightFor } from './people.js';
import { gateHall } from './gatecond.js';
import { bindPose, sparks, BIND_POSES } from './bind.js';

const POSE = BIND_POSES[Q.get('pose')] ? Q.get('pose') : 'spell', CAM = Q.get('cam') || 'back', SCHOOL = Q.get('school') || 'uisce', HALL = Q.get('hall') || 'cloch', GAP = +(Q.get('gap') || 1.3);
const R = makeRenderer(1.0), scene = new THREE.Scene(), cam = new THREE.PerspectiveCamera(CAM === 'wide' ? 58 : 40, W / H, .03, 2000); buildTextures();
const v = gateHall({ cond: 'steady', mode: 'school', school: HALL, t: 4 }); scene.add(v.group);
scene.fog = new THREE.FogExp2(new THREE.Color(...v.fog.color), v.fog.density); scene.background = new THREE.Color(...v.fog.color);
// where they fight: the middle of the first bay, the player toward the threshold facing down the nave (-z), the foe beyond
const Z0 = -5.2, PZ = Z0, FZ = Z0 - GAP, XZ = 0, mid = new THREE.Vector3(XZ, 1.55, (PZ + FZ) / 2);
const CAMS = {
  back: [[XZ - 1.9, 1.9, PZ + 4.3], [XZ + .1, 1.45, mid.z - .2]],          /* behind the player's left shoulder, three-quarters, as OG-045 and OG-063 (the spell's side) */
  shoulder: [[XZ + .85, 2.0, PZ + 3.1], [XZ - .25, 1.5, FZ - .3]],      /* right over the shoulder, as a third-person camera */
  side: [[XZ + 4.4, 1.25, mid.z + .2], [XZ, 1.15, mid.z]],                /* side on, both whole */
  close: [[XZ + .95, 2.0, PZ + .7], [XZ, 1.75, mid.z - .1]],               /* the blades, the hands */
  front: [[XZ - 1.6, 1.55, FZ - 2.2], [XZ + .1, 1.35, PZ]],                       /* from behind the foe: the player's face and the spell */
  wide: [[XZ + 4.5, 2.8, PZ + 9], [XZ - 1, 3.8, FZ - 14]],                  /* in the hall */
  scale: [[XZ + 4.2, 1.0, mid.z], [XZ, .95, mid.z]] };
const C0 = CAMS[CAM] || CAMS.back; cam.position.set(...C0[0]); cam.lookAt(...C0[1]);
if (CAM.includes(',')) { const c = CAM.split(',').map(Number); cam.position.set(c[0], c[1], c[2]); cam.lookAt(c[3], c[4], c[5]); }
cam.updateProjectionMatrix();
// a measuring post of 1.8 m, ticked every 10 cm, between them and a step to the side (the scale view)
if (CAM === 'scale' || Q.has('post')) { const m = new THREE.MeshStandardMaterial({ color: 0xe8dcc0, roughness: .7 }), post = new THREE.Group(); post.add(new THREE.Mesh(new THREE.BoxGeometry(.03, 1.8, .03).translate(0, .9, 0), m));
  for (let i = 1; i <= 18; i++) post.add(new THREE.Mesh(new THREE.BoxGeometry(.03, .012, i % 5 ? .08 : .16).translate(0, i * .1, .04), m)); post.position.set(XZ + .7, 0, mid.z); scene.add(post); }
const comp = makeComposer(R, scene, cam, { bloom: .55, bloomT: .6, bloomR: .45, sat: 1.04, vig: .34 });
const ticks = [];
Object.assign(STATS, { pose: POSE, cam: CAM, school: SCHOOL, hall: HALL, gap: GAP, hallTris: v.tris, hallDraws: v.draws });
const strip = D => ({ ...D, cloak: null, hood: null, cape: false, basket: null, spear: null, staff: null, crossbow: null, shoulderWrap: null, wrapTail: null, lantern: null, tankard: null, hammer: null, pipe: null });
(Q.has('nopeople') ? Promise.reject('nopeople') : loadPack('mh/')).then(() => {
  // the player: a Gatelander in a dark tunic and mail under it, no cloak (OG-045's dark cloak hangs from the arms, which these poses lift)
  const Gp = rollGenome('bind:player', { people: 'gatelander', g: 1 }); Gp.dress = { ...strip(Gp.dress), shield: null, mail: [.42, .42, .44], tunic: [.16, .17, .2], belt: [.22, .14, .08] };
  // the foe: a Markish raider, mail, an iron helm, a round shield on the left arm
  const Gf = rollGenome('bind:foe', { people: 'markman', g: 1 }); Gf.dress = { ...strip(Gf.dress), shield: [.5, .14, .1], shieldShape: 'round', mail: [.38, .38, .4], helm: [.4, .4, .42] };
  Gp.height = heightFor(Gp, +(Q.get('ph') || 1.78)); Gf.height = heightFor(Gf, +(Q.get('fh') || 1.84));
  const Pp = makePerson(Gp), Pf = makePerson(Gf); scene.add(Pp.root, Pf.root);
  const crossY = Math.max(statureOf(Gp), statureOf(Gf)) * 1.06;
  const rp = bindPose(Pp, 'player', POSE, { gap: GAP, school: SCHOOL, crossY }), rf = bindPose(Pf, 'foe', POSE, { gap: GAP, crossY });
  Pp.root.rotation.y = Math.PI; Pp.root.position.x = XZ; Pp.root.position.z = PZ; Pf.root.position.x = XZ; Pf.root.position.z = FZ;
  for (const P of [Pp, Pf]) P.root.traverse(o => { if (o.isMesh) o.castShadow = o.receiveShadow = true; });
  Pp.root.updateMatrixWorld(true); Pf.root.updateMatrixWorld(true);
  // the sparks: where the steel meets (B, C), or where the beaten blade left the player's (A)
  const toWorld = (P, p) => p.clone().applyMatrix4(new THREE.Matrix4().compose(new THREE.Vector3(P.root.position.x, 0, P.root.position.z), new THREE.Quaternion().setFromEuler(P.root.rotation), new THREE.Vector3(1, 1, 1)));
  // where the two blades' lines come closest (B, C: the contact; their gap is the steel's thickness when they touch)
  const Mp = new THREE.Matrix4().compose(new THREE.Vector3(Pp.root.position.x, 0, Pp.root.position.z), new THREE.Quaternion().setFromEuler(Pp.root.rotation), new THREE.Vector3(1, 1, 1)), Mf = new THREE.Matrix4().compose(new THREE.Vector3(Pf.root.position.x, 0, Pf.root.position.z), new THREE.Quaternion().setFromEuler(Pf.root.rotation), new THREE.Vector3(1, 1, 1));
  const a0 = rp.palm.clone().applyMatrix4(Mp), ad = rp.dir.clone().transformDirection(Mp), b0 = rf.palm.clone().applyMatrix4(Mf), bd = rf.dir.clone().transformDirection(Mf);
  const w0 = a0.clone().sub(b0), A = ad.dot(ad), B = ad.dot(bd), Cc = bd.dot(bd), Dd = ad.dot(w0), E = bd.dot(w0), den = A * Cc - B * B, sc = (B * E - Cc * Dd) / den, tc = (A * E - B * Dd) / den;
  const pa = a0.clone().addScaledVector(ad, sc), pb = b0.clone().addScaledVector(bd, tc); STATS.contact = { gap: +pa.distanceTo(pb).toFixed(3), alongPlayer: +sc.toFixed(3), alongFoe: +tc.toFixed(3) };
  const sp = sparks(POSE === 'deflect' ? 5 : 3, POSE === 'deflect' ? .8 : 1); sp.position.copy(POSE === 'deflect' ? toWorld(Pp, rp.cross) : pa.clone().add(pb).multiplyScalar(.5)); scene.add(sp);
  if (rp.spell) ticks.push(t => rp.spell.userData.tick(t));
  STATS.player = { height: +statureOf(Gp).toFixed(3), miss: rp.miss, crossMiss: rp.crossMiss, crossAt: rp.crossAt, swordTris: rp.tris };
  STATS.foe = { height: +statureOf(Gf).toFixed(3), miss: rf.miss, crossMiss: rf.crossMiss, crossAt: rf.crossAt };
  STATS.cross = toWorld(Pp, rp.cross).toArray().map(x => +x.toFixed(3)); STATS.crossY = +crossY.toFixed(3);
}).catch(e => { if (e !== 'nopeople') { STATS.err = String(e && e.stack || e); console.error(e); } }).finally(() => {
  R.info.autoReset = !STILL; R.info.reset(); const t0 = performance.now(); run(comp, cam, { tick: t => { v.tick(4 + t / 1000); for (const f of ticks) f(1.3 + t / 1000); } }); STATS.tris = R.info.render.triangles; STATS.calls = R.info.render.calls; STATS.ms = Math.round(performance.now() - t0); });
