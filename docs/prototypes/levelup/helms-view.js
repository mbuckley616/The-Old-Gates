// The armour's headgear by tier (the concept artist, 17 Oct 2026; backlog L7, "Armour's top tiers"; OG-052 and OG-019): helms.js's
// helms on people.js's people, in a walled yard under an afternoon sun, beside the 1.8 m post.
// ?view=line (default): the heavy line, Wooden to Cosmic left to right, each in mail of the tier's metal over a tunic of its cloth.
//   &set=a: OG-019's ladder, one helm shape from Mithril up, the tier in its colour, trim and glowing rim
//   &set=b: OG-052's silhouettes from Mithril up (fins, a leaf crest, swept horns, the flame crest, ram's horns, the crescent and
//           the halo), the face open
//   &set=c: as b, the face shut behind a visor's slit
//   &cam=whole (default) | far (from 30 m) | heads (Steel to Cosmic, the heads at 6 m) | close (Draconic, Demonic, Cosmic at 3 m)
// ?view=robes&set=a|b: the robe line's top six (Mithril to Cosmic) in robes and raised hoods: a plain circlet (a), or OG-052's
//   antlered, horned, crescent and haloed hoods (b).
// ?view=head&tier=1..10[&kind=robe]: one head close, three-quarter front (helms-sheet.mjs lays ten of them out as one sheet).
// ?view=scale&set=b: Steel, Demonic and Cosmic beside the post and two bare-headed people.
// &cam=x,y,z,tx,ty,tz puts the camera anywhere. Drag to look.
import * as THREE from 'three';
import { Q, W, H, STATS, makeRenderer, makeComposer, buildTextures, mat, worldUV, skyDome, clouds, run } from './common.js';
import { loadPack, makePerson, rollGenome, statureOf } from './people.js';
import { TIERS, ENV, fitHead, helm, hoodDress } from './helms.js';

const R = makeRenderer(.82), scene = new THREE.Scene(), VIEW = Q.get('view') || 'line', SET = Q.get('set') || 'b', CAM = Q.get('cam') || 'whole';
scene.fog = new THREE.FogExp2(new THREE.Color(.78, .8, .84), .004);
const cam = new THREE.PerspectiveCamera(40, W / H, .02, 30000); buildTextures();
const SUN = new THREE.Vector3(-.4, .6, .7).normalize();
const sun = new THREE.DirectionalLight(new THREE.Color(1, .9, .76), 3.3); sun.castShadow = true; sun.shadow.mapSize.set(4096, 4096); sun.shadow.bias = -.0002; sun.shadow.normalBias = .01;
scene.add(sun, sun.target, new THREE.HemisphereLight(new THREE.Color(.64, .72, .88), new THREE.Color(.36, .32, .26), 1.1));
skyDome(scene, SUN); clouds(scene, SUN, { n: 10, d0: 1800, dw: 5000, y0: 300 });
// the metal wants something to reflect: a sky over warm ground, filtered once (the slices have no environment; card F3 owes one)
{ const es = new THREE.Scene(), g = new THREE.SphereGeometry(50, 32, 16), col = [], P = g.attributes.position;
  for (let i = 0; i < P.count; i++) { const y = P.getY(i) / 50, c = y > 0 ? new THREE.Color(.62, .72, .88).lerp(new THREE.Color(.3, .45, .75), y) : new THREE.Color(.42, .36, .28).lerp(new THREE.Color(.2, .17, .13), -y); col.push(c.r, c.g, c.b); }
  g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3)); es.add(new THREE.Mesh(g, new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.BackSide })));
  const s = new THREE.Mesh(new THREE.SphereGeometry(3, 12, 8), new THREE.MeshBasicMaterial({ color: new THREE.Color(6, 5.4, 4.6) })); s.position.copy(SUN).multiplyScalar(40); es.add(s);
  const pm = new THREE.PMREMGenerator(R); ENV.map = pm.fromScene(es, .02).texture; }
{ const g = new THREE.PlaneGeometry(240, 240); g.rotateX(-Math.PI / 2); worldUV(g, .8); const m = new THREE.Mesh(g, mat('stone', { ns: .8, color: 0xe8dcc4, rough: .9 })); m.receiveShadow = true; scene.add(m); }
{ const g = new THREE.BoxGeometry(40, 1.4, .6); worldUV(g, .4); const m = new THREE.Mesh(g, mat('ashlar', { ns: 1, color: 0xf2e6d0, rough: .9 })); m.position.set(0, .7, -7); m.castShadow = m.receiveShadow = true; scene.add(m); }
const post = new THREE.Group(); { const m = new THREE.MeshStandardMaterial({ color: 0x3a3028 }); post.add(new THREE.Mesh(new THREE.BoxGeometry(.03, 1.8, .03).translate(0, .9, 0), m)); for (let i = 1; i <= 18; i++) post.add(new THREE.Mesh(new THREE.BoxGeometry(i % 5 ? .08 : .16, .012, .03).translate(.04, i * .1, 0), m)); post.traverse(o => o.castShadow = true); scene.add(post); }
function sunBox(cx, cz, half) { sun.position.copy(SUN).multiplyScalar(30).add(new THREE.Vector3(cx, 0, cz)); sun.target.position.set(cx, 0, cz); Object.assign(sun.shadow.camera, { left: -half, right: half, top: half, bottom: -half, near: .5, far: 90 }); sun.shadow.camera.updateProjectionMatrix(); }

// who wears what: [x, z, ry, people, sex, tier, kind] with kind 'heavy' | 'robe' | 'bare'
const PEOPLE = ['markman', 'gatelander', 'aurennais', 'markman', 'gatelander', 'aurennais', 'oldblood', 'markman', 'gatelander', 'aurennais'], cast = [];
const DX = .95;
if (VIEW === 'line' && CAM === 'heads') { for (let t = 4; t <= 10; t++) cast.push([(t - 7) * .6, 0, .4, PEOPLE[t - 1], t % 3 === 0 ? 0 : 1, t, 'heavy']); post.position.set(-2.2, 0, -.3);
  cam.fov = 22; cam.position.set(0, 1.74, 6.1); cam.lookAt(0, 1.62, 0); sunBox(0, 0, 4); }
else if (VIEW === 'line' && CAM === 'close') { for (const [i, t] of [[0, 8], [1, 9], [2, 10]]) cast.push([(i - 1) * .62, 0, .4, PEOPLE[t - 1], t % 3 === 0 ? 0 : 1, t, 'heavy']);
  cam.fov = 20; cam.position.set(0, 1.72, 3.1); cam.lookAt(0, 1.64, 0); sunBox(0, 0, 3); }
else if (VIEW === 'line') { for (let t = 1; t <= 10; t++) cast.push([(t - 5.5) * DX, 0, 0, PEOPLE[t - 1], t % 3 === 0 ? 0 : 1, t, 'heavy']); post.position.set(-5.5 * DX - .25, 0, .25);
  if (CAM === 'far') { cam.fov = 22; cam.position.set(0, 1.7, 30); cam.lookAt(0, 1.05, 0); }
  else { cam.fov = 37; cam.position.set(0, 1.5, 8.8); cam.lookAt(0, 1.08, 0); }
  sunBox(0, 0, 7); }
else if (VIEW === 'head') { const t = +(Q.get('tier') || 10), k = Q.get('kind') || 'heavy'; cast.push([0, 0, .5, PEOPLE[t - 1], k === 'robe' ? t % 2 : t % 3 === 0 ? 0 : 1, t, k]); post.visible = false; cam.fov = 30; sunBox(0, 0, 2); }
else if (VIEW === 'robes') { for (let t = 5; t <= 10; t++) cast.push([(t - 7.5) * 1.0, 0, 0, PEOPLE[t - 1], t % 2, t, 'robe']); post.position.set(-3.1, 0, .25);
  if (CAM === 'heads') { cam.fov = 24; cam.position.set(0, 1.72, 4.2); cam.lookAt(0, 1.66, 0); } else { cam.fov = 34; cam.position.set(0, 1.5, 6.4); cam.lookAt(0, 1.12, 0); } sunBox(0, 0, 5); }
else { const L = [[-1.6, 'gatelander', 0, 0, 'bare'], [-.8, 'markman', 1, 4, 'heavy'], [0, 'aurennais', 1, 9, 'heavy'], [.8, 'gatelander', 0, 10, 'heavy'], [1.6, 'markman', 1, 0, 'bare']];
  for (const [x, p, g, t, k] of L) cast.push([x, 0, 0, p, g, t, k]); post.position.set(-2.25, 0, .25); cam.fov = 30; cam.position.set(0, 1.6, 5.6); cam.lookAt(0, 1.12, 0); sunBox(0, 0, 4); }
if (Q.get('cam') && Q.get('cam').includes(',')) { const c = Q.get('cam').split(',').map(Number); cam.position.set(c[0], c[1], c[2]); cam.lookAt(c[3], c[4], c[5]); }
cam.updateProjectionMatrix(); STATS.view = VIEW; STATS.set = SET;
const comp = makeComposer(R, scene, cam, { bloom: .3, bloomT: .86, sat: 1.04, vig: .26 });

const o = { bold: SET !== 'a', closed: SET === 'c' };
(Q.has('nopeople') ? Promise.reject('nopeople') : loadPack('mh/')).then(() => { STATS.people = [];
  for (const [x, z, ry, people, g, tier, kind] of cast) { const T = TIERS[tier] || { name: 'bare' }, G = rollGenome('helm:' + tier + ':' + kind + ':' + people, { people, g });
    const D = { ...G.dress, shield: false, spear: null, crossbow: null, basket: null, cloak: null, cape: null, tabard: null, apron: null, sash: null, wrap: null, scarf: null, shoulderWrap: null, mantle: null };
    if (kind === 'heavy') Object.assign(D, { mail: T.metal, tunic: T.cloth, skirt: null, trousers: D.trousers || [.3, .26, .2], sandals: null, helm: tier === 3 ? T.metal : [.4, .4, .42], boots: [.2, .15, .1], belt: [.22, .15, .1] });
    if (kind === 'robe') Object.assign(D, { robe: T.cloth, cord: T.trim, cloak: T.cloth.map(v => v * .85), hood: 'up', mail: null });
    if (kind === 'bare') Object.assign(D, { mail: null, helm: null });
    const p = makePerson({ ...G, dress: D }); p.root.position.set(x, p.root.position.y, z); p.root.rotation.y = ry; scene.add(p.root);
    const hb = p.byName['head'], kit = hb.getObjectByName('helm'); let h = null;
    if (kind === 'heavy' && tier !== 3) { if (kit) hb.remove(kit); const F = fitHead(p); h = helm(tier, F, o); hb.add(h.group); }
    if (kind === 'robe') { const F = fitHead(p); h = hoodDress(tier, F, o); if (h) hb.add(h.group); }
    p.root.traverse(m => { if (m.isMesh) { m.castShadow = m.receiveShadow = true; } });
    if (VIEW === 'head') { p.root.updateMatrixWorld(true); const c = hb.getWorldPosition(new THREE.Vector3()).add(new THREE.Vector3(0, .1, 0)); cam.position.set(c.x - .22, c.y + .06, c.z + 1.16); cam.lookAt(c); }
    STATS.people.push({ tier: T.name, kind, people, height: +statureOf(G).toFixed(3), tris: h ? h.tris : kind === 'heavy' ? p.helm?.tris : 0, draws: h ? h.draws : kind === 'heavy' ? 2 : 0, size: h?.size, above: h?.top, gap: h?.gap ?? p.helm?.gap }); }
}).catch(e => { if (e !== 'nopeople') { STATS.err = String(e && e.stack || e); console.error(e); } }).finally(() => run(comp, cam));
