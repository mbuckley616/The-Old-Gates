// Rare materials B's props (Session 2500): props.js's starCrater, skywoodPine and scriptStone, with the 1.8 m post.
// ?view=crater (default): the fallen star the morning after, from 11 m downrange at a standing eye; &close: the lump from where you
// stand to strike it; &night: under the moon, the glint lit as the game would within 40 m; &left=N (0 to 3): lobes still in it.
// ?view=pine: the skywood pine on its Mark summit, from 30 m down the slope; &far: from the valley 600 m off, on the skyline;
// &felled: the stump. ?view=stone: the script stone in a failing gate's keep, by torchlight, beside the crystal vein; &school=tine|uisce|
// cloch|scath|solas|gaoth (default cloch); &cut: hewn out. &cam=x,y,z,tx,ty,tz puts the camera anywhere.
import * as THREE from 'three';
import { Q, W, H, STATS, makeRenderer, makeComposer, buildTextures, mat, worldUV, skyDome, clouds, run, fbm } from './common.js';
import { starCrater, skywoodPine, scriptStone } from './props.js';
import { stream } from './pieces.js';

const R = makeRenderer(.85), scene = new THREE.Scene(), VIEW = Q.get('view') || 'crater', NIGHT = Q.has('night');
scene.fog = new THREE.FogExp2(new THREE.Color(.74, .80, .88), .004);
const cam = new THREE.PerspectiveCamera(50, W / H, .02, 30000); buildTextures();
const SUN = NIGHT ? new THREE.Vector3(-.4, .55, -.6).normalize() : new THREE.Vector3(.55, .5, .65).normalize();
const sun = new THREE.DirectionalLight(NIGHT ? new THREE.Color(.55, .65, .9) : new THREE.Color(1, .92, .8), NIGHT ? .7 : 3.4); sun.castShadow = true; sun.shadow.mapSize.set(4096, 4096); sun.shadow.bias = -.0002; sun.shadow.normalBias = .02;
const hemi = new THREE.HemisphereLight(new THREE.Color(.62, .72, .9), new THREE.Color(.34, .32, .24), NIGHT ? .3 : 1.1); scene.add(sun, sun.target, hemi);
const post = (x, y, z) => { const m = new THREE.MeshStandardMaterial({ color: 0x3a3028 }), g = new THREE.Group(); g.add(new THREE.Mesh(new THREE.BoxGeometry(.03, 1.8, .03).translate(0, .9, 0), m));
  for (let i = 1; i <= 18; i++) g.add(new THREE.Mesh(new THREE.BoxGeometry(i % 5 ? .06 : .1, .008, .008).translate(0, i * .1, 0), m)); g.position.set(x, y, z); scene.add(g); return g; };
let P, shadowR = 10, bloom = .12;
if (VIEW === 'pine') {
  // a Mark summit: a ridge of bare rock and scree, falling 40 m in the first 100 m, snow in its hollows; the pine on the top
  if (NIGHT) scene.fog.color.setRGB(.05, .06, .1); else skyDome(scene, SUN), clouds(scene, SUN, { n: 10, d0: 1500, dw: 5000, y0: 260 });
  const S = 1600, N = 200, g = new THREE.PlaneGeometry(S, S, N, N); g.rotateX(-Math.PI / 2); const Pp = g.attributes.position, col = [];
  const hAt = (x, z) => { const d = Math.hypot(x * .8, z * 1.25); return 120 * Math.exp(-((d / 260) ** 1.4)) - 120 + fbm(x / 90, z / 90) * 26 * Math.min(1, d / 30) + fbm(x / 14, z / 14) * 2.2 * Math.min(1, d / 6); };
  for (let i = 0; i < Pp.count; i++) { const x = Pp.getX(i), z = Pp.getZ(i), y = hAt(x, z); Pp.setY(i, y); col.push(0, 0, 0); }
  g.computeVertexNormals(); const Nn = g.attributes.normal, c = new THREE.Color();
  for (let i = 0; i < Pp.count; i++) { const y = Pp.getY(i), up = Nn.getY(i), snow = up > .9 && y > -70 ? Math.min(1, (up - .9) * 12) * (fbm(Pp.getX(i) / 20, Pp.getZ(i) / 20) > .0 ? 1 : .3) : 0;
    c.setRGB(.5, .49, .46).lerp(new THREE.Color(.42, .46, .32), y < -85 ? Math.min(1, (-85 - y) / 20) : 0).lerp(new THREE.Color(.92, .94, .98), snow); col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b; }
  g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3)); worldUV(g, .25);
  const m = new THREE.Mesh(g, mat('rock', { ns: 1.2, rough: 1 })); m.material.vertexColors = true; m.receiveShadow = true; scene.add(m);
  const ty = hAt(0, 0); P = skywoodPine({ felled: Q.has('felled'), wind: .9 }, stream('sky:mark:3')); P.group.position.set(0, ty, 0); scene.add(P.group); post(2.6, ty + .1, -1.2);
  if (Q.has('far')) { const a = 1.0, d = 380; cam.fov = 22; cam.position.set(Math.sin(a) * d, hAt(Math.sin(a) * d, Math.cos(a) * d) + 1.65, Math.cos(a) * d); cam.lookAt(0, ty + 4, 0); scene.fog.density = .0009; }
  else { const a = 1.25, d = 22; cam.position.set(Math.sin(a) * d, hAt(Math.sin(a) * d, Math.cos(a) * d) + 1.65, Math.cos(a) * d); cam.lookAt(0, ty + 4.2, 0); scene.fog.density = .0012; }
  shadowR = 14; sun.target.position.set(0, ty, 0);
  STATS.ground = { summit: +ty.toFixed(1), at100: +hAt(100, 0).toFixed(1) };
} else if (VIEW === 'stone') {
  P = scriptStone({ school: Q.get('school') || 'cloch', cut: Q.has('cut') }, stream('sigilstone:' + (Q.get('school') || 'cloch'))); scene.add(P.group);
  sun.intensity = 0; hemi.intensity = .1; scene.fog.color.setRGB(.03, .028, .026); scene.fog.density = .03; bloom = .45;
  const G = new THREE.Color(...({ tine: [1.0, .40, .12], uisce: [.30, .72, 1.0], cloch: [1.0, .66, .30], scath: [.70, .34, 1.0], solas: [1.0, .86, .52], gaoth: [.66, .92, 1.0] }[P.school]));
  { const l = new THREE.PointLight(G, P.cut ? .4 : 1.6, 4, 1.8); l.position.set(0, .7, P.face + .4); scene.add(l); const v = new THREE.PointLight(G, 1.2, 3.5, 1.8); v.position.set(-1.4, .5, .6); scene.add(v); }
  const tp = Q.has('close') ? new THREE.Vector3(.55, 1.55, 1.35) : new THREE.Vector3(1.2, 1.62, 3.0); { const t = new THREE.PointLight(new THREE.Color(1, .64, .34), 14, 12, 1.6); t.position.copy(tp).add(new THREE.Vector3(.35, -.1, -.2)); t.castShadow = true; scene.add(t); }
  cam.fov = Q.has('close') ? 45 : 55; cam.position.copy(tp); cam.lookAt(-.3, .65, 0); post(1.75, 0, .5);
} else {
  if (NIGHT) { scene.fog.color.setRGB(.04, .05, .08); scene.fog.density = .012; bloom = .5;
    const moon = new THREE.Mesh(new THREE.SphereGeometry(80, 16, 12), new THREE.MeshBasicMaterial({ color: 0xdfe6f2, fog: false })); moon.position.copy(SUN).multiplyScalar(9000); scene.add(moon); }
  else { skyDome(scene, SUN); clouds(scene, SUN, { n: 8, d0: 1800, dw: 5000, y0: 300 }); }
  const grass = 0x6c7a3c, g = new THREE.RingGeometry(6.4, 400, 64, 1); g.rotateX(-Math.PI / 2); /* the land round the crater's own ground (2.2 radii, 6.6 m) */ worldUV(g, .5); const m = new THREE.Mesh(g, mat('rock', { ns: .7, color: grass, rough: 1 })); m.position.y = -.005; m.receiveShadow = true; scene.add(m);
  const left = Q.has('left') ? +Q.get('left') : 3; P = starCrater({ left, night: NIGHT, from: 2.4, grass }, stream('star:gatelands:7')); scene.add(P.group);
  const down = [-Math.sin(P.from), -Math.cos(P.from)];
  if (Q.has('close')) { const s = [P.lump[0] + down[0] * 2.9 + .6, P.lump[2] + down[1] * 2.9 - .4]; cam.fov = 45; cam.position.set(s[0], P.hAt(s[0], s[1]) + 1.62, s[1]); cam.lookAt(P.lump[0], P.lump[1] + .35, P.lump[2]); post(s[0] - .9, P.hAt(s[0] - .9, s[1] + .4), s[1] + .4); }
  else { const d = 6.8, s = [down[0] * d + 1.4, down[1] * d - 1]; cam.position.set(s[0], P.hAt(s[0], s[1]) + 1.65, s[1]); cam.lookAt(0, -.35, 0); post(down[0] * 3.9 + 1.2, P.hAt(down[0] * 3.9 + 1.2, down[1] * 3.9), down[1] * 3.9); }
  if (NIGHT) { /* the glint as the game would light it: a faint cold point on the lump, seen from the 40 m it reaches */ const gl = new THREE.PointLight(new THREE.Color(.6, .72, 1), .8, 5, 2); gl.position.set(P.lump[0], P.lump[1] + .9, P.lump[2]); scene.add(gl); }
}
if (Q.get('cam')) { const c = Q.get('cam').split(',').map(Number); cam.position.set(c[0], c[1], c[2]); cam.lookAt(c[3], c[4], c[5]); }
cam.updateProjectionMatrix();
sun.position.copy(SUN).multiplyScalar(60).add(sun.target.position); Object.assign(sun.shadow.camera, { left: -shadowR, right: shadowR, top: shadowR, bottom: -shadowR, near: .5, far: 200 }); sun.shadow.camera.updateProjectionMatrix();
STATS.prop = { view: VIEW, tris: P.tris, draws: P.draws, top: P.top, depth: P.depth, rim: P.rim, left: P.left, lobes: P.lobes, H: P.H, pads: P.pads, felled: P.felled, lean: P.lean, school: P.school, cut: P.cut, split: P.split, lit: P.lit };
run(makeComposer(R, scene, cam, { bloom, sat: 1.0, vig: .3 }), cam);
