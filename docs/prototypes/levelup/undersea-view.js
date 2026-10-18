// The page of undersea.js (Session 1100): the drowned arches seen under water, or from the quay above.
// ?view=swim (default: 4 m down beside the arcade, looking out along it) | arches (the whole bays from the side, 6 m down) | alcove (at the
// quay's face, the niche behind the kelp) | boat (the rowing boat on the sand by the fourth pier) | above (from the quay's stair, the
// arches' shapes under the water); &water=green (default, the Gatelands, visibility about 15 m) | clear (turquoise, about 40 m) | mark
// (dark cold blue, about 10 m): the question, the water's colour and clarity.
// ?place=quarter (Session 1105): a drowned quarter of an Aurenne town, &view=temple (default) | bridge | theatre | wide.
// ?place=village (Session 1104): a sunken village, &view=lane (default) | house | church | tower.
// ?place=cave (Session 1103): a sea cave with air pockets, &view=mouth (default) | tunnel | pocket | top.
// ?place=wrecks (Session 1101): the wrecks at three depths, &view=pair (default) | storm | deep | wide | hole (Session 1102: where the cutter stove the cog in).
import * as THREE from 'three';
import { Q, W, H, STATS, makeRenderer, makeComposer, buildTextures, skyDome, run } from './common.js';
import { drownedArches, wreckSite, seaCave, sunkenVillage, sunkenQuarter } from './undersea.js';

const PLACE = ['wrecks', 'cave', 'village', 'quarter'].includes(Q.get('place')) ? Q.get('place') : 'arches', VIEW = Q.get('view') || (PLACE === 'wrecks' ? 'pair' : PLACE === 'cave' ? 'mouth' : PLACE === 'village' ? 'lane' : PLACE === 'quarter' ? 'temple' : 'swim'), WATER = { green: { c: [.10, .24, .20], d: .085, sun: [.75, .95, .85], k: 2.4 }, clear: { c: [.08, .34, .40], d: .03, sun: [.85, 1, 1], k: 3.0 }, mark: { c: [.04, .10, .16], d: .12, sun: [.6, .75, .95], k: 1.8 } }[Q.get('water')] || null;
const WK = Q.get('water') && WATER ? Q.get('water') : 'green', WA = WATER || { c: [.10, .24, .20], d: .085, sun: [.75, .95, .85], k: 2.4 }, UNDER = VIEW !== 'above' && VIEW !== 'pocket' && VIEW !== 'top' && VIEW !== 'tower';
const R = makeRenderer(UNDER ? 1.1 : .9), scene = new THREE.Scene(), cam = new THREE.PerspectiveCamera(UNDER ? 70 : 55, W / H, .05, 30000);
buildTextures(); const SUN = new THREE.Vector3(-.35, .8, .35).normalize();
if (UNDER) { scene.background = new THREE.Color(...WA.c); scene.fog = new THREE.FogExp2(new THREE.Color(...WA.c), WA.d); }
else { skyDome(scene, SUN); scene.fog = new THREE.FogExp2(new THREE.Color(.72, .80, .88), .003); }
const sun = new THREE.DirectionalLight(new THREE.Color(...(UNDER ? WA.sun : [1, .93, .8])), UNDER ? WA.k : 3.2); sun.position.copy(SUN).multiplyScalar(80); sun.castShadow = true; sun.shadow.mapSize.set(4096, 4096);
Object.assign(sun.shadow.camera, { left: -40, right: 40, top: 40, bottom: -40, near: 1, far: 200 }); sun.shadow.bias = -.0005; sun.shadow.normalBias = .05; sun.target.position.set(0, -6, -18); sun.position.add(sun.target.position); scene.add(sun, sun.target);
scene.add(new THREE.HemisphereLight(new THREE.Color(...(UNDER ? WA.c.map(v => v * 4) : [.62, .72, .9])), new THREE.Color(.10, .10, .08), UNDER ? 1.2 : 1.0));
const P = PLACE === 'wrecks' ? wreckSite() : PLACE === 'cave' ? seaCave() : PLACE === 'village' ? sunkenVillage() : PLACE === 'quarter' ? sunkenQuarter() : drownedArches(); scene.add(P.group);
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
const CW = { storm: [[16, -6.5, -6], [6, -9.5, -15]], pair: [[-1, -11.5, -24.5], [-1.5, -16.5, -41]], deep: [[13, -20.5, -60], [1, -24, -74]], wide: [[22, -9, -20], [0, -18, -50]], hole: [[-.8, -14.2, -45.5], [-4.3, -15.6, -38.6]] }[VIEW];
if (PLACE === 'wrecks') { const c = CW || [[-1, -11.5, -24.5], [-1.5, -16.5, -41]]; C[0] = c[0]; C[1] = c[1]; }
// the sunken village (Session 1104): lane (down the drowned lane between the cottages to the church) | house (a cottage's broken walls) | walls
// (Session 1109: down onto a cottage's broken wall tops) |
// church (the nave and its tower from the lane's end) | tower (from a boat on the surface: the round tower standing out of the sea)
const CV = { lane: [[0.4, -8.6, -2], [0, -12, -40]], house: [[-2.2, -9.4, -12.5], [-7.4, -11, -9.2]], walls: [[-4.6, -7.0, -13.2], [-7.6, -10.6, -9.4]], church: [[-9, -11.5, -38], [3, -9, -56]], tower: [[-30, 2.2, -20], [-4, 6, -54]] }[VIEW];
if (PLACE === 'village') { const c = CV || [[0.4, -8.6, -2], [0, -12, -40]]; C[0] = c[0]; C[1] = c[1]; }
// the drowned quarter (Session 1105): temple (the church's broken dome and tower from the east) | bridge (the gap of its fallen span, from
// upstream) | theatre (from over its top tier, down into the orchestra and the stage wall) | wide (the three together)
const CQ_DEF = [[23, -4.5, -68], [11, -12.5, -55]], CQ = { temple: [[23, -4.5, -68], [11, -12.5, -55]], bridge: [[-16, -14.6, -18.5], [-21, -17, -30]], theatre: [[15.5, -10.4, -20.6], [13.5, -13.4, -3]], wide: [[30, -5, 6], [-6, -18, -38]] }[VIEW];
if (PLACE === 'quarter') { const c = CQ || CQ_DEF; C[0] = c[0]; C[1] = c[1]; }
// the sea cave (Session 1103): mouth (from the sea, at the cliff's foot) | tunnel (inside, looking up it toward the chamber) | pocket (in the
// chamber's air on the shelf, the water and the shaft's light) | top (the shaft's mouth on the land)
const CC = { mouth: [[6, -8.5, -14], [0, -9, 0]], tunnel: [[-.5, -7.6, 6], [1.6, -2.5, 24]], pocket: [[5.4, 1.65, 33.5], [-2, .2, 44]], top: [[9, 14.2, 37], [2, 11, 44]] }[VIEW];
if (PLACE === 'cave') { const c = CC || [[6, -8.5, -14], [0, -9, 0]]; C[0] = c[0]; C[1] = c[1];
  for (const E of [P.chamber, P.pocket2]) { const l = new THREE.PointLight(new THREE.Color(.5, .9, 1), 3, 14, 1.5); l.position.set(P.shelf.x0 + 4, 1.0, E.c[2]); if (E === P.chamber) scene.add(l); }
  const sp = new THREE.SpotLight(new THREE.Color(.95, .95, .9), 60, 30, .3, .5, 1.2); sp.position.set(P.shaft.x, P.land + 2, P.shaft.z); sp.target.position.set(P.shaft.x, -2, P.shaft.z); scene.add(sp, sp.target);
  if (!UNDER) { scene.background = new THREE.Color(.03, .035, .04); scene.fog = new THREE.FogExp2(new THREE.Color(.03, .035, .04), VIEW === 'top' ? .002 : .03); } }
cam.position.set(...C[0]); cam.lookAt(...C[1]);
STATS.view = VIEW; STATS.water = WK; STATS.tris = P.tris; STATS.draws = P.draws; STATS.kelp = P.kelp ? P.kelp.length : 0; STATS.place = PLACE; STATS.wrecks = P.wrecks ? P.wrecks.length : 0; STATS.plans = { arches: { tris: P.tris, draws: P.draws } };
const comp = makeComposer(R, scene, cam, { bloom: .2, sat: 1.0 }); run(comp, cam);
