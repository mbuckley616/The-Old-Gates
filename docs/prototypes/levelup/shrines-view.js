// The six gods' shrines, dressed by island (the concept artist, 18 Oct 2026; backlog L9, OG-113): shrines.js's kit beside a road, under
// an afternoon sun, with people of the four peoples' kit and the 1.8 m post.
// ?view=row&island=gatelands|mark|aurenne (default): the six niches and the Guest's in a row, as OG-113 draws the common form, in the
//   island's dressing. &cam=wide (default) | figures (the six close) | guest (the Guest's niche) | far (from 30 m down the road).
// ?view=three: one god's wayside shrine (An Teallach, the Hearth, the god of roads; &god=muir|speir|…) in the three dressings, 6 m
//   apart, a person of each island beside each. &cam=wide | scale (the Gatelands' with a person and the post).
// &time=dusk: the sun down, the candles and the Mark's lamps lit. &nopeople leaves the people out. &cam=x,y,z,tx,ty,tz anywhere.
import * as THREE from 'three';
import { Q, W, H, STATS, makeRenderer, makeComposer, buildTextures, mat, worldUV, skyDome, clouds, treeKit, run, reseed } from './common.js';
import { loadPack, makePerson, rollGenome, statureOf } from './people.js';
import { GODS, SPACING, NICHE, row, wayside, shrineTextures } from './shrines.js';

const VIEW = Q.get('view') || 'row', ISL = Q.get('island') || 'gatelands', CAM = Q.get('cam') || 'wide', DUSK = Q.get('time') === 'dusk', GOD = Q.get('god') || 'teallach';
const R = makeRenderer(DUSK ? .95 : .82), scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(DUSK ? new THREE.Color(.36, .32, .38) : new THREE.Color(.78, .8, .84), DUSK ? .012 : .007);
const cam = new THREE.PerspectiveCamera(46, W / H, .03, 30000); buildTextures(); shrineTextures(); reseed(11);
const SUN = DUSK ? new THREE.Vector3(-.75, .07, -.66).normalize() : new THREE.Vector3(-.5, .55, .67).normalize();
const sun = new THREE.DirectionalLight(DUSK ? new THREE.Color(1, .58, .36) : new THREE.Color(1, .9, .76), DUSK ? 1.1 : 3.3); sun.castShadow = true; sun.shadow.mapSize.set(4096, 4096); sun.shadow.bias = -.0002; sun.shadow.normalBias = .01;
scene.add(sun, sun.target, new THREE.HemisphereLight(DUSK ? new THREE.Color(.34, .36, .5) : new THREE.Color(.64, .72, .88), DUSK ? new THREE.Color(.16, .13, .12) : new THREE.Color(.36, .32, .26), DUSK ? .55 : 1.15));
skyDome(scene, SUN, DUSK ? { zen: [.05, .07, .2], mid: [.22, .2, .38], hor: [.86, .52, .36], glow: [1, .5, .25], glowK: .6, k: .9 } : {}); clouds(scene, SUN, { n: 12, d0: 1800, dw: 5000, y0: 300, ...(DUSK ? { lo: [.3, .26, .34], hi: [1.1, .62, .44] } : {}) });
// the ground: grass (the Mark's tawny), a road in front of the shrines, the Aurenne paving under its own
const ground = (w, d, m, x = 0, z = 0, y = 0, uv = .5) => { const g = new THREE.PlaneGeometry(w, d); g.rotateX(-Math.PI / 2); worldUV(g, uv); const o = new THREE.Mesh(g, m); o.position.set(x, y, z); o.receiveShadow = true; scene.add(o); return o; };
const grassM = mat('grass', { ns: 1, rough: 1 }), turfM = mat('grass', { ns: 1.2, color: 0xc8b090, rough: 1 }), road = mat('cobble', { ns: .8, color: 0xa89a86, rough: .95 }), earth = mat('rock', { ns: .6, color: 0xb09a7c, rough: 1 });
const post = new THREE.Group(); { const m = new THREE.MeshStandardMaterial({ color: 0x3a3028 }); post.add(new THREE.Mesh(new THREE.BoxGeometry(.03, 1.8, .03).translate(0, .9, 0), m)); for (let i = 1; i <= 18; i++) post.add(new THREE.Mesh(new THREE.BoxGeometry(i % 5 ? .08 : .16, .012, .03).translate(.04, i * .1, 0), m)); post.traverse(o => o.castShadow = true); scene.add(post); }
const sunBox = (cx, cz, half) => { sun.position.copy(SUN).multiplyScalar(40).add(new THREE.Vector3(cx, 0, cz)); sun.target.position.set(cx, 0, cz); Object.assign(sun.shadow.camera, { left: -half, right: half, top: half, bottom: -half, near: .5, far: 120 }); sun.shadow.camera.updateProjectionMatrix(); };
const TK = treeKit(SUN), trees = [], people = [], BUILT = STATS.built = [];
const lights = []; function light(p, c = 0xffb070, i = 1.2, d = 4) { if (!DUSK) return; const l = new THREE.PointLight(c, i, d, 1.6); l.position.set(...p); scene.add(l); lights.push(l); }
function show(o, x = 0, z = 0) { o.group.position.set(x, 0, z); scene.add(o.group); BUILT.push({ island: o.island, niches: o.niches.map(n => n.god), tris: o.tris, draws: o.draws });
  if (DUSK) { o.lamps.forEach(p => light([p[0] + x, p[1], p[2] + z], 0xffa860, 2.2, 6)); o.niches.forEach(n => { if (n.god !== 'guest' && o.island !== 'mark') light([n.x + x + .2, NICHE.sill + .25, z + .25], 0xffb070, .7, 2.6); }); } }

if (VIEW === 'row') {
  const o = row(ISL), sp = SPACING[ISL]; show(o);
  ground(400, 400, ISL === 'mark' ? turfM : grassM, 0, 0, -.005); ground(60, 3.2, ISL === 'aurenne' ? road : earth, 0, 4.4, 0, .6);
  if (ISL === 'aurenne') ground(14, 6, mat('flag', { ns: .8, color: 0xf0e2c8, rough: .85 }), 0, 1.6, .002, .7);
  post.position.set(-3 * sp - (ISL === 'gatelands' ? 3.0 : 1.4), 0, .6);
  for (let i = 0; i < 14; i++) { const a = i / 14, x = -40 + a * 80 + Math.sin(i * 7.1) * 3, z = -18 - (i % 3) * 7 - Math.cos(i * 3.3) * 3; trees.push([x, 0, z, ISL === 'mark' ? .9 : .75 + (i % 4) * .08, i, ISL === 'mark' ? new THREE.Color(.7, .78, .5) : ISL === 'aurenne' ? new THREE.Color(.8, .85, .55) : null, ISL === 'mark' ? 1 : undefined]); }
  // people: one of the island at the basin of An Teallach, praying; one walking the road
  const who = { gatelands: 'gatelander', mark: 'markman', aurenne: 'aurennais' }[ISL]; people.push([sp * 1 + .62, 1.0, Math.PI + .35, who, 'pray:' + ISL, 1], [-3 * sp + .8, 4.1, 1.6, who, 'road:' + ISL, 0]);
  const far = ISL === 'gatelands' ? 3 * sp + 3 : 3 * sp + 1.4;
  if (CAM === 'figures') { cam.fov = 40; cam.position.set(-.7 * sp, 1.5, 4.1); cam.lookAt(-.7 * sp, 1.35, 0); }
  else if (CAM === 'guest') { cam.fov = 40; if (ISL === 'aurenne') cam.fov = 56; cam.position.set(3 * sp - .45, 1.5, ISL === 'aurenne' ? 1.32 : 2.05); cam.lookAt(3 * sp - .05, 1.3, 0); }
  else if (CAM === 'far') { cam.fov = 40; cam.position.set(-6, 1.65, 30); cam.lookAt(0, 1.3, 0); }
  else { cam.fov = 48; cam.position.set(.4, 1.75, 9.6); cam.lookAt(0, 1.25, 0); }
  sunBox(0, 1, far + 3);
} else {
  const XS = [-6, 0, 6]; ground(400, 400, grassM, 0, 0, -.005); ground(60, 3.2, earth, 0, 4.0, 0, .6); 
  ISLANDS3().forEach((isl, i) => { show(wayside(isl, GOD), XS[i], 0); if (isl === 'aurenne') ground(2.6, 2.5, mat('flag', { ns: .8, color: 0xf0e2c8, rough: .85 }), XS[i], .1, .002, .7); });
  const who = ['gatelander', 'markman', 'aurennais']; XS.forEach((x, i) => people.push([x - 1.0, 1.95, .45, who[i], 'way:' + who[i], i % 2]));
  post.position.set(-5.05, 0, .55);
  for (let i = 0; i < 12; i++) trees.push([-34 + i * 6.2 + Math.sin(i * 5.3) * 2, 0, -16 - (i % 3) * 6, .78, i, null]);
  if (CAM === 'scale') { cam.fov = 42; cam.position.set(-5.7, 1.45, 5.0); cam.lookAt(-6.1, 1.2, .4); }
  else { cam.fov = 44; cam.position.set(0, 1.9, 11.2); cam.lookAt(0, 1.3, 0); }
  sunBox(0, 0, 13);
}
function ISLANDS3() { return ['gatelands', 'mark', 'aurenne']; }
TK.plant(scene, trees.map(t => [t[0], t[1], t[2], t[3], t[4], t[5] || new THREE.Color(.95, 1, .7), t[6]]));
if (Q.get('cam') && Q.get('cam').includes(',')) { const c = Q.get('cam').split(',').map(Number); cam.position.set(c[0], c[1], c[2]); cam.lookAt(c[3], c[4], c[5]); }
cam.updateProjectionMatrix();
STATS.view = VIEW; STATS.tris = BUILT.reduce((a, o) => a + o.tris, 0); STATS.niche = NICHE; STATS.lights = lights.length;
const comp = makeComposer(R, scene, cam, DUSK ? { bloom: .5, bloomT: .7, sat: 1.06, vig: .34, warm: [1.08, .98, .88] } : { bloom: .24, bloomT: .9, sat: 1.06, vig: .28 });
(Q.has('nopeople') || !people.length ? Promise.reject('nopeople') : loadPack('mh/')).then(() => { STATS.people = [];
  for (const [x, z, ry, kind, seed, g] of people) { const G = rollGenome(seed, { people: kind, g }); G.dress = { ...G.dress, shield: false, spear: false };
    const p = makePerson(G); p.root.position.set(x, p.root.position.y, z); p.root.rotation.y = ry; scene.add(p.root); p.root.traverse(o => { if (o.isMesh) o.castShadow = o.receiveShadow = true; });
    STATS.people.push({ kind, height: +statureOf(G).toFixed(3) }); }
}).catch(e => { if (e !== 'nopeople') { STATS.err = String(e); console.error(e); } }).finally(() => run(comp, cam));
