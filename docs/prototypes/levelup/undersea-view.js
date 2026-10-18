// The page of undersea.js (Session 1100): the drowned arches seen under water, or from the quay above.
// ?view=swim (default: 4 m down beside the arcade, looking out along it) | arches (the whole bays from the side, 6 m down) | alcove (at the
// quay's face, the niche behind the kelp) | boat (the rowing boat on the sand by the fourth pier) | above (from the quay's stair, the
// arches' shapes under the water); &water=green (default, the Gatelands, visibility about 15 m) | clear (turquoise, about 40 m) | mark
// (dark cold blue, about 10 m): the question, the water's colour and clarity.
// ?place=wrecks (Session 1101): the wrecks at three depths, &view=pair (default) | storm | deep | wide.
import * as THREE from 'three';
import { Q, W, H, STATS, makeRenderer, makeComposer, buildTextures, skyDome, run } from './common.js';
import { drownedArches, wreckSite } from './undersea.js';

const PLACE = Q.get('place') === 'wrecks' ? 'wrecks' : 'arches', VIEW = Q.get('view') || (PLACE === 'wrecks' ? 'pair' : 'swim'), WATER = { green: { c: [.10, .24, .20], d: .085, sun: [.75, .95, .85], k: 2.4 }, clear: { c: [.08, .34, .40], d: .03, sun: [.85, 1, 1], k: 3.0 }, mark: { c: [.04, .10, .16], d: .12, sun: [.6, .75, .95], k: 1.8 } }[Q.get('water')] || null;
const WK = Q.get('water') && WATER ? Q.get('water') : 'green', WA = WATER || { c: [.10, .24, .20], d: .085, sun: [.75, .95, .85], k: 2.4 }, UNDER = VIEW !== 'above';
const R = makeRenderer(UNDER ? 1.1 : .9), scene = new THREE.Scene(), cam = new THREE.PerspectiveCamera(UNDER ? 70 : 55, W / H, .05, 30000);
buildTextures(); const SUN = new THREE.Vector3(-.35, .8, .35).normalize();
if (UNDER) { scene.background = new THREE.Color(...WA.c); scene.fog = new THREE.FogExp2(new THREE.Color(...WA.c), WA.d); }
else { skyDome(scene, SUN); scene.fog = new THREE.FogExp2(new THREE.Color(.72, .80, .88), .003); }
const sun = new THREE.DirectionalLight(new THREE.Color(...(UNDER ? WA.sun : [1, .93, .8])), UNDER ? WA.k : 3.2); sun.position.copy(SUN).multiplyScalar(80); sun.castShadow = true; sun.shadow.mapSize.set(4096, 4096);
Object.assign(sun.shadow.camera, { left: -40, right: 40, top: 40, bottom: -40, near: 1, far: 200 }); sun.shadow.bias = -.0005; sun.shadow.normalBias = .05; sun.target.position.set(0, -6, -18); sun.position.add(sun.target.position); scene.add(sun, sun.target);
scene.add(new THREE.HemisphereLight(new THREE.Color(...(UNDER ? WA.c.map(v => v * 4) : [.62, .72, .9])), new THREE.Color(.10, .10, .08), UNDER ? 1.2 : 1.0));
const P = PLACE === 'wrecks' ? wreckSite() : drownedArches(); scene.add(P.group);
// the surface: from below a bright rippled ceiling, from above a sheet of sea that lets the arches show through
{ const g = new THREE.PlaneGeometry(400, 400, 1, 1); g.rotateX(-Math.PI / 2);
  const m = UNDER ? new THREE.MeshBasicMaterial({ color: new THREE.Color(...WA.c.map(v => Math.min(1, v * 5.5))), side: THREE.BackSide, fog: true }) : new THREE.MeshStandardMaterial({ color: new THREE.Color(...WA.c), transparent: true, opacity: .55, roughness: .08, metalness: .1, depthWrite: false });
  const s = new THREE.Mesh(g, m); s.position.set(0, 0, -100); s.renderOrder = 2; scene.add(s); }
// the light from above in shafts: thin bright planes leaning with the sun, fading down (under water only)
if (UNDER) { const c = document.createElement('canvas'); c.width = 64; c.height = 256; const x = c.getContext('2d'), gr = x.createLinearGradient(0, 0, 64, 0); gr.addColorStop(0, 'rgba(255,255,255,0)'); gr.addColorStop(.5, 'rgba(255,255,255,1)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = gr; x.fillRect(0, 0, 64, 256);
  x.globalCompositeOperation = 'destination-in'; const gv = x.createLinearGradient(0, 0, 0, 256); gv.addColorStop(0, 'rgba(0,0,0,1)'); gv.addColorStop(1, 'rgba(0,0,0,0)'); x.fillStyle = gv; x.fillRect(0, 0, 64, 256); const tex = new THREE.CanvasTexture(c);
  const sm = new THREE.MeshBasicMaterial({ map: tex, color: new THREE.Color(...WA.sun), transparent: true, opacity: .16, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, fog: true });
  for (let k = 0; k < 26; k++) { const x = -14 + (k * 7.3) % 28, z = -2 - (k * 11.7) % (PLACE === 'wrecks' ? 80 : 40), h = 16, g = new THREE.PlaneGeometry(.6 + (k % 3) * .4, h); g.translate(0, -h / 2, 0); const m = new THREE.Mesh(g, sm); m.position.set(x, 0, z); m.rotation.set(-.25, k * .7, .2); scene.add(m); } }
const C = { swim: [[3.4, -3.0, -2.8], [-.2, -4.8, -26]], arches: [[11.5, -4.4, -9.5], [0, -4.2, -11]], alcove: [[6.4, -2.4, -4.4], [7, -2.4, .6]], boat: [[8.0, -5.4, -14.6], [4.6, -7.4, -18.4]], above: [[-16.9, 3.4, -.8], [-2, -3, -16]] }[VIEW] || [[3.4, -3.6, -2.6], [-.2, -4.6, -26]];
const CW = { storm: [[16, -6.5, -6], [6, -9.5, -15]], pair: [[-1, -11.5, -24.5], [-1.5, -16.5, -41]], deep: [[13, -20.5, -60], [1, -24, -74]], wide: [[22, -9, -20], [0, -18, -50]] }[VIEW];
if (PLACE === 'wrecks') { const c = CW || [[-1, -11.5, -24.5], [-1.5, -16.5, -41]]; C[0] = c[0]; C[1] = c[1]; }
cam.position.set(...C[0]); cam.lookAt(...C[1]);
STATS.view = VIEW; STATS.water = WK; STATS.tris = P.tris; STATS.draws = P.draws; STATS.kelp = P.kelp ? P.kelp.length : 0; STATS.place = PLACE; STATS.wrecks = P.wrecks ? P.wrecks.length : 0; STATS.plans = { arches: { tris: P.tris, draws: P.draws } };
const comp = makeComposer(R, scene, cam, { bloom: .2, sat: 1.0 }); run(comp, cam);
