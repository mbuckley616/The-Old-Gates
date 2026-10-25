// Each island's air, seen (the concept artist, 25 Oct 2026; backlog L12 "Each island's air", OG-140; card F3): air.js's rows over one
// viewpoint an island at a summer mid-afternoon. The Gatelands: hedged fields falling to a lake, woods, a range 1.5–3 km out, two
// limewashed cottages (pieces.js's kit). The Mark: a fjord between walls of 900–1,400 m, pines on the lower slopes, the snow line at
// 640 m, three halls by markLot. Aurenne: a hillside of stubble and olive groves over a bay, a limestone headland, a chain of islands,
// three houses by aurenneLot. Each with two of its own people.
// ?island=gatelands|mark|aurenne (gatelands the default), &air=one|own|marked (A, B, C; own the default),
// &cam=vista (default: on the rise, eye height, looking out) | scale (a house's door, a person at it) | high (60 m up) | x,y,z,tx,ty,tz.
// &nopeople. The live page has the island and the air (top left).
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { Q, STILL, W, H, STATS, rnd, reseed, GLSL_NOISE, makeRenderer, buildTextures, clouds, treeKit, run } from './common.js';
import { loadPack, makePerson, rollGenome, statureOf } from './people.js';
import { GL_PLANS, gatelandsBuilding, markHall, markLot, aurenneHouse, aurenneLot, aurenneTextures, markTextures } from './pieces.js';
import { corruptGrade, setGrade, corruptSky } from './corruption.js';
import { AIRS, ISLANDS, AIR_MODES, airRow, BASE, landHeight, landColour, airCover, airMist, airShimmer } from './air.js';

const ISLAND = ISLANDS.includes(Q.get('island')) ? Q.get('island') : 'gatelands', CAM = Q.get('cam') || 'vista';
let MODE = AIR_MODES[Q.get('air')] ? Q.get('air') : 'own';
const A = AIRS[ISLAND], B = BASE[ISLAND], gy = landHeight(ISLAND);
const nrm = (x, z) => { const e = 3, dx = gy(x + e, z) - gy(x - e, z), dz = gy(x, z + e) - gy(x, z - e); return 2 * e / Math.hypot(dx, 2 * e, dz); };

const R = makeRenderer(.82), scene = new THREE.Scene(); R.info.autoReset = false;
scene.fog = new THREE.FogExp2(new THREE.Color(...A.fog), A.fogD);
const cam = new THREE.PerspectiveCamera(50, W / H, .1, 60000); buildTextures(); markTextures(); aurenneTextures(); reseed(25);
const SUN = new THREE.Vector3(), sunAt = (el, az) => { const v = new THREE.Vector2(...az).normalize(); SUN.set(v.x * Math.cos(el), Math.sin(el), v.y * Math.cos(el)); };
sunAt(A.elev, A.az);
const sun = new THREE.DirectionalLight(0xffffff, 3); sun.castShadow = true; sun.shadow.mapSize.set(4096, 4096); sun.shadow.bias = -.0002; sun.shadow.normalBias = .04; if (Q.has('noshadow')) sun.castShadow = false;
const hemi = new THREE.HemisphereLight(0xa0b4e0, 0x5c5242, 1.2); scene.add(sun, sun.target, hemi);
const sky = corruptSky(SUN, new THREE.Vector3(0, 1, 0)); scene.add(sky.mesh);

// ── the land: one grid warped so its rows are 2–3 m apart by the houses and 70 m at 7 km, coloured by landColour ──
const land = { tris: 0 };
{ const N = 420, S = 7500, g = new THREE.PlaneGeometry(2, 2, N, N); g.rotateX(-Math.PI / 2); const P = g.attributes.position, col = new Float32Array(P.count * 3);
  const warp = u => Math.sign(u) * S * u * u;
  for (let i = 0; i < P.count; i++) { const x = warp(P.getX(i)), z = warp(P.getZ(i)) - 25; P.setXYZ(i, x, gy(x, z), z); }
  g.computeVertexNormals(); const Nn = g.attributes.normal;
  for (let i = 0; i < P.count; i++) col.set(landColour(ISLAND, A.land, P.getY(i), Nn.getY(i), P.getX(i), P.getZ(i)), i * 3);
  g.setAttribute('color', new THREE.BufferAttribute(col, 3));
  const lm = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 1 });
  // the land's grain: two octaves of value noise in world space over the vertex colour, fading with distance (no texture to tile)
  lm.onBeforeCompile = sh => { sh.vertexShader = 'varying vec3 vWp;\n' + sh.vertexShader.replace('#include <worldpos_vertex>', '#include <worldpos_vertex>\n vWp = (modelMatrix * vec4(transformed, 1.)).xyz;');
    sh.fragmentShader = 'varying vec3 vWp;\n' + GLSL_NOISE + sh.fragmentShader.replace('#include <color_fragment>', `#include <color_fragment>
      { float fd = clamp(length(vWp - cameraPosition) / 400., 0., 1.); float g = vn(vWp.xz * .9) * .5 + vn(vWp.xz * 3.7) * .3 + vn(vWp.xz * .12) * .6;
        diffuseColor.rgb *= mix(.78 + .36 * g / 1.4, 1., fd * .7); }`); };
  const m = new THREE.Mesh(g, lm); m.receiveShadow = true; scene.add(m); land.tris = g.index.count / 3; }
// the water: one plane at the sea, the sky's reflection from a PMREM of the dome
const water = new THREE.Mesh(new THREE.PlaneGeometry(60000, 60000).rotateX(-Math.PI / 2), new THREE.MeshStandardMaterial({ color: new THREE.Color(...A.water), roughness: A.waterR, metalness: 0, envMapIntensity: 1 }));
scene.add(water);

// ── the houses: three of the island's own kit about the rise, each turned to face the viewpoint ──
const BUILT = STATS.built = [], HOUSES = [];
const face = (g, x, z) => { g.position.set(x, B, z); g.rotation.y = Math.atan2(-x, -z) + Math.PI; scene.add(g); g.traverse(o => { if (o.isMesh) o.castShadow = o.receiveShadow = true; }); };
const SPOTS = [[-15, -8], [17, -16], [-33, -28]];
SPOTS.forEach(([x, z], i) => { let g, tris;
  if (ISLAND === 'gatelands') { const P = GL_PLANS.cottage({ paint: ['red', 'green', 'blue'][i] }); g = gatelandsBuilding(P); tris = g.userData.tris; }
  else if (ISLAND === 'mark') { const lot = markLot('air:mark', i, { note: [1] }); const h = markHall(lot.o, lot.r); g = h.group; tris = h.tris; }
  else { const lot = aurenneLot('air:aurenne', i); const h = aurenneHouse(lot.o, lot.r); g = h.group; tris = h.tris; }
  face(g, x, z); g.rotation.y -= Math.PI; BUILT.push(tris); HOUSES.push(g); });

// ── the cover: the near trees from treeKit in the Gatelands (the broadleaf), the instanced kits everywhere ──
const free = (x, z) => SPOTS.every(([sx, sz]) => Math.hypot(x - sx, z - sz) > 14) && Math.hypot(x, z) > 12;
// nothing stands on the bank, on the flat in front of it, or in a wedge of the view out from the viewpoint
const keep = (x, z) => free(x, z) && z < 20 && !(z > -120 && Math.abs(x) < 50) && Math.abs(x) > 40 + (-z) * .05;
const nearTrees = [];
if (ISLAND === 'gatelands') { const TK = treeKit(SUN);
  for (let i = 0; i < 90; i++) { const a = -1.4 + rnd() * 2.8, d = 30 + rnd() * 220, x = Math.sin(a) * d, z = -Math.cos(a) * d; if (free(x, z) && (Math.abs(x) > 45 + d * .25 || d > 170)) nearTrees.push([x, gy(x, z), z, .85 + rnd() * .4, rnd() * 6.3, new THREE.Color(.78, .88, .58)]); }
  TK.plant(scene, nearTrees); }
const cover = STATS.cover = airCover(scene, ISLAND, gy, nrm, { n: ISLAND === 'mark' ? 14000 : ISLAND === 'gatelands' ? 12000 : 7000, r0: ISLAND === 'gatelands' ? 200 : 60, r1: ISLAND === 'mark' ? 5200 : 3200, keep, hedges: true });
// near the houses in the Mark and Aurenne, a few of the instanced kits cast shadows, kept off the houses
if (ISLAND !== 'gatelands') airCover(scene, ISLAND + ':near', gy, nrm, { n: ISLAND === 'mark' ? 40 : 46, r0: 30, r1: 160, shadow: true, keep });

// ── clouds; C's marks ──
const cl = A.cloud; clouds(scene, SUN, { n: cl.n, d0: 1600, dw: 6000, y0: cl.y0, lo: cl.lo, hi: cl.hi, op: cl.op });
const mist = ISLAND === 'gatelands' ? airMist(scene, gy) : null;

// ── the cameras ──
const sunBox = (cx, cz, half) => { sun.position.copy(SUN).multiplyScalar(400).add(new THREE.Vector3(cx, B, cz)); sun.target.position.set(cx, B, cz); Object.assign(sun.shadow.camera, { left: -half, right: half, top: half, bottom: -half, near: 1, far: 1000 }); sun.shadow.camera.updateProjectionMatrix(); };
const LOOK = { gatelands: [-80, -75, -900], mark: [60, 120, -2400], aurenne: [-150, -95, -1600] }[ISLAND];
const people = [[-2.6, -12, .3, 'a', 0], [2.2, -19, 2.7, 'b', 1]];
let BOX = [0, -20, 80];
if (CAM === 'scale') { const h = HOUSES[ISLAND === 'mark' ? 1 : 0], bb = new THREE.Box3().setFromObject(h), c = bb.getCenter(new THREE.Vector3()), to = new THREE.Vector3(-c.x, 0, -c.z).normalize();
  const door = c.clone().addScaledVector(to, (bb.max.x - bb.min.x + bb.max.z - bb.min.z) / 4 + .2); people.length = 0; people.push([door.x + to.z * 1.2, door.z - to.x * 1.2, Math.atan2(to.x, to.z), 'door', 1]);
  cam.fov = 40; cam.position.set(door.x + to.x * 9 - to.z * 3, B + 1.6, door.z + to.z * 9 + to.x * 3); cam.lookAt(door.x, B + 2, door.z); BOX = [c.x, c.z, 30]; }
else if (CAM === 'high') { cam.position.set(10, B + 60, 40); cam.lookAt(LOOK[0], LOOK[1] * .6, LOOK[2]); }
else { cam.fov = 55; cam.position.set(2, gy(2, 44) + 1.65, 44); cam.lookAt(LOOK[0], B + LOOK[1], LOOK[2]); }
if (CAM.includes(',')) { const c = CAM.split(',').map(Number); cam.position.set(c[0], c[1], c[2]); cam.lookAt(c[3], c[4], c[5]); }
cam.updateProjectionMatrix(); sunBox(...BOX);

// ── the post: the slices' bloom, Aurenne's shimmer, corruption.js's grade ──
const comp = new EffectComposer(R); comp.setSize(W, H); comp.addPass(new RenderPass(scene, cam)); comp.addPass(new UnrealBloomPass(new THREE.Vector2(W, H), .22, .6, .9));
const shim = airShimmer(); comp.addPass(shim); const grade = corruptGrade(); comp.addPass(grade); comp.addPass(new OutputPass());
const pmrem = new THREE.PMREMGenerator(R), skyScene = new THREE.Scene(); let envRT = null;

function apply() {
  const X = airRow(ISLAND, MODE);
  sunAt(X.elev, A.az); sunBox(...BOX); sun.color.setRGB(...X.sun); sun.intensity = X.sunK;
  hemi.color.setRGB(...X.hemi); hemi.groundColor.setRGB(...X.gnd); hemi.intensity = X.hemiK;
  const U = sky.U; U.uZen.value.set(...X.zen); U.uMid.value.set(...X.mid); U.uHor.value.set(...X.hor); U.uGlow.value.set(...X.glow); U.uRing.value = 0; for (let i = 0; i < 6; i++) U.uLobe.value[i].set(0, -1, 0, 0);
  scene.fog.color.setRGB(...X.fog); scene.fog.density = X.fogD;
  setGrade(grade, { sat: X.sat, keep: 0, con: X.con, cast: X.cast, vig: X.vig });
  if (mist) mist.group.visible = X.mist > 0;
  shim.uniforms.uK.value = X.shimmer; { const p = new THREE.Vector3(cam.position.x - 20000 * Math.sin(0), cam.position.y, cam.position.z - 20000).project(cam); shim.uniforms.uH.value = p.y * .5 + .5; }
  // the water's reflection: the dome alone, re-rendered when the sky changes
  scene.remove(sky.mesh); skyScene.add(sky.mesh); if (envRT) envRT.dispose(); envRT = pmrem.fromScene(skyScene, 0, 1, 60000); skyScene.remove(sky.mesh); scene.add(sky.mesh); water.material.envMap = envRT.texture; water.material.needsUpdate = true;
  STATS.island = ISLAND; STATS.air = MODE; STATS.row = { fogD: X.fogD, sightM: X.sight, sunDeg: +(X.elev * 180 / Math.PI).toFixed(1), sunK: X.sunK, sat: X.sat, mist: X.mist, shimmer: X.shimmer };
}
apply();

if (!STILL) { const d = document.createElement('div'); d.style.cssText = 'position:fixed;left:12px;top:10px;color:#f3ead6;font:13px system-ui;background:rgba(0,0,0,.5);padding:8px 10px;border-radius:6px;display:grid;gap:6px';
  d.innerHTML = `<label>The island <select id="is">${ISLANDS.map(k => `<option value="${k}">${AIRS[k].label}</option>`).join('')}</select></label>
    <label>The air <select id="md">${Object.entries(AIR_MODES).map(([k, v]) => `<option value="${k}">${v.label}</option>`).join('')}</select></label><span id="sg"></span>`;
  document.body.appendChild(d); d.querySelector('#is').value = ISLAND; d.querySelector('#md').value = MODE;
  const sg = () => d.querySelector('#sg').textContent = `sight ${STATS.row.sightM} m · sun ${STATS.row.sunDeg}°`; sg();
  d.querySelector('#is').onchange = e => { const q = new URLSearchParams(location.search); q.set('island', e.target.value); q.set('air', MODE); location.search = q; };
  d.querySelector('#md').onchange = e => { MODE = e.target.value; apply(); sg(); }; }
let tris = 0; scene.traverse(o => { if (o.isMesh && o !== sky.mesh && o !== water && o.visible) tris += (o.geometry.index ? o.geometry.index.count : o.geometry.attributes.position.count) / 3 * (o.isInstancedMesh ? o.count : 1); });
STATS.scene = { land: land.tris, nearTrees: nearTrees.length, houses: BUILT, trisNoPeople: Math.round(tris) };
const tick = t => { R.info.reset(); shim.uniforms.uT.value = t * .001; };
const go = () => { run(comp, cam, { tick }); STATS.calls = R.info.render.calls; STATS.tris = R.info.render.triangles; };
(Q.has('nopeople') ? Promise.reject('nopeople') : loadPack('mh/')).then(() => { STATS.people = [];
  for (const [x, z, ry, seed, g] of people) { const G = rollGenome(ISLAND + ':' + seed, { people: A.people, g }); G.dress = { ...G.dress, shield: false, spear: false };
    const p = makePerson(G); p.root.position.set(x, p.root.position.y + gy(x, z), z); p.root.rotation.y = ry; scene.add(p.root); p.root.traverse(o => { if (o.isMesh) o.castShadow = o.receiveShadow = true; });
    STATS.people.push(+statureOf(G).toFixed(3)); }
}).catch(e => { if (e !== 'nopeople') { STATS.err = String(e); console.error(e); } }).finally(go);
