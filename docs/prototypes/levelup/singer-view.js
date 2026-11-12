// The singing ship (the concept artist, 12 Nov 2026; backlog L6 "Sea legends", OG-049): singer.js's dress on ships.js's Aurenne cog,
// at sea in fog (60 m to 95%, Michael's C on #679), seen from the deck of your own Gatelands sloop, your sail full ahead of you and hers
// full toward you: the wrong side of the wind.
// ?mode=close|lane|lit (A, B, C; lane the default), &cam=deck|near|scale|high, &plain (her as built, not long at sea), &fog=N (metres to
// 95%, for a check), &d=N (her distance), &nopeople, &cam=x,y,z,tx,ty,tz.
import * as THREE from 'three';
import { Q, W, H, STATS, GLSL_NOISE, makeRenderer, makeComposer, buildTextures, run } from './common.js';
import { loadPack, makePerson, rollGenome, statureOf } from './people.js';
import { gatelandsSloop, aurenneCog } from './ships.js';
import { stream } from './pieces.js';
import { SINGER_MODES, FOG_SIGHT, fogDensity, singerDress, singerFog } from './singer.js';

const MODE = SINGER_MODES[Q.get('mode')] ? Q.get('mode') : 'lane', CAM = Q.get('cam') || 'deck', PLAIN = Q.has('plain');
const CLEAR = CAM === 'near' || CAM === 'scale';
const D = +(Q.get('d') || (CLEAR ? 0 : SINGER_MODES[MODE].d)), SIGHT = +(Q.get('fog') || (CLEAR ? 900 : FOG_SIGHT));
const R = makeRenderer(.95), scene = new THREE.Scene(); buildTextures(); R.info.autoReset = false;
const cam = new THREE.PerspectiveCamera(CAM === 'deck' ? 50 : 42, W / H, .05, 30000);
const FOG = new THREE.Color(.66, .70, .72);
scene.background = FOG; scene.fog = new THREE.FogExp2(FOG, fogDensity(SIGHT));
const SUN = new THREE.Vector3(-.3, .8, .5).normalize();
const sun = new THREE.DirectionalLight(new THREE.Color(.95, .95, .92), CLEAR ? 1.6 : .9); sun.castShadow = true; sun.shadow.mapSize.set(4096, 4096); sun.shadow.bias = -.0003; sun.shadow.normalBias = .03;
scene.add(sun, sun.target, new THREE.HemisphereLight(new THREE.Color(.78, .82, .85), new THREE.Color(.22, .25, .27), 1.5));

// your sloop at the origin, bow to +z; her bearing and her heading: she comes on obliquely, her bow 40° off the line to you
const you = gatelandsSloop({ harp: true }, stream('sloop:kilmore')); scene.add(you.group);
const her = aurenneCog({ star: true }, stream('cog:safe-return'));
if (!PLAIN) singerDress(her, { lit: MODE === 'lit' && !CLEAR });
let hx, hz, hry;
if (CLEAR) { hx = 15; hz = 1.5; hry = Math.PI; }
else { const b = -.36; hx = D * Math.sin(b); hz = D * Math.cos(b); hry = Math.atan2(-hx, -hz) + .7; }
her.group.position.set(hx, 0, hz); her.group.rotation.y = hry; scene.add(her.group);

// the fog's lane runs from your bow to her
const EYE = { deck: [-.6, you.deck + 1.65, -4.6], high: [12, 34, -40] }[CAM] || [-8, 5, -14];
const fog = singerFog(CLEAR ? 'close' : MODE, [EYE[0], 0, EYE[2]], [hx, 0, hz]);

// the sea: ships-view's water (a noise normal, a Fresnel to the sky's colour), the sky here the fog's grey
{ const g = new THREE.PlaneGeometry(4000, 4000, 1, 1); g.rotateX(-Math.PI / 2);
  const m = new THREE.MeshStandardMaterial({ color: new THREE.Color(.10, .16, .18), roughness: .12 });
  m.onBeforeCompile = s => { s.uniforms.uSky = { value: FOG.clone() };
    s.vertexShader = 'varying vec3 vW;\n' + s.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\n vW = (modelMatrix * vec4(position,1.)).xyz;');
    s.fragmentShader = 'uniform vec3 uSky; varying vec3 vW;\n' + GLSL_NOISE + s.fragmentShader
      .replace('#include <normal_fragment_maps>', `#include <normal_fragment_maps>
        { vec2 p = vW.xz; float e = .5; float a = fb(p / 3.), bx = fb((p + vec2(e, 0.)) / 3.), bz = fb((p + vec2(0., e)) / 3.);
          vec3 nw = normalize(vec3((a - bx) * .9, 1., (a - bz) * .9)); normal = normalize((viewMatrix * vec4(nw, 0.)).xyz); }`)
      .replace('#include <opaque_fragment>', `
        vec3 V = normalize(cameraPosition - vW); vec3 Nw = normalize((inverse(viewMatrix) * vec4(normal, 0.)).xyz);
        float fr = pow(1. - max(dot(V, Nw), 0.), 5.) * .6 + .04; outgoingLight = mix(outgoingLight, uSky * .95, fr);
        #include <opaque_fragment>`); };
  const sea = new THREE.Mesh(g, m); sea.receiveShadow = true; scene.add(sea); }

let at;
if (CAM === 'deck') at = [hx * .75, 2.4, hz * .75];
else if (CAM === 'near') { you.group.visible = false; EYE.splice(0, 3, hx - 19, 5.2, hz + 17); at = [hx, 5.2, hz]; }
else if (CAM === 'scale') { EYE.splice(0, 3, -3.4, you.deck + 1.9, -7.5); at = [8, 3.4, 1.5]; }
else at = [hx * .6, 2, hz * .6];
cam.position.set(...EYE); cam.lookAt(...at);
if (Q.get('cam') && Q.get('cam').includes(',')) { const c = Q.get('cam').split(',').map(Number); cam.position.set(c[0], c[1], c[2]); cam.lookAt(c[3], c[4], c[5]); }
cam.updateProjectionMatrix();
const mid = new THREE.Vector3((hx + cam.position.x) / 2, 0, (hz + cam.position.z) / 2);
sun.position.copy(mid).addScaledVector(SUN, 60); sun.target.position.copy(mid); const sr = CLEAR ? 26 : 30;
Object.assign(sun.shadow.camera, { left: -sr, right: sr, top: sr, bottom: -sr, near: 1, far: 160 }); sun.shadow.camera.updateProjectionMatrix();

STATS.singer = { mode: MODE, cam: CAM, plain: PLAIN, distance: +Math.hypot(hx - cam.position.x, hz - cam.position.z).toFixed(1), sight: SIGHT, density: +scene.fog.density.toFixed(4), fog,
  her: { tris: her.tris + (her.singer && her.singer.weed ? her.singer.weed.tris : 0), draws: her.draws + (her.singer && her.singer.weed ? 1 : 0), L: her.L, top: her.top, dress: her.singer || null },
  you: { tris: you.tris, draws: you.draws } };

// for scale: you on your own deck, at the rail, looking across at her
const people = (Q.has('nopeople') || CAM !== 'scale') ? Promise.resolve() : loadPack('mh/').then(() => {
  const G = rollGenome('singer:you', { people: 'gatelander', g: 0 }); G.dress = { ...G.dress, shield: false, spear: false };
  const p = makePerson(G); p.root.position.set(1.2, you.deck, -1.2); p.root.rotation.y = Math.PI / 2 - .35; scene.add(p.root);
  p.root.traverse(o => { if (o.isMesh) o.castShadow = o.receiveShadow = true; }); STATS.person = +statureOf(G).toFixed(3); }).catch(e => { STATS.peopleErr = String(e); });
people.then(() => { run(makeComposer(R, scene, cam, { bloom: MODE === 'lit' ? .3 : .1, bloomT: MODE === 'lit' ? .6 : .92, sat: .92, vig: .3, cool: [.96, 1, 1.04] }), cam,
  { tick: () => R.info.reset() }); STATS.frame = { tris: R.info.render.triangles, calls: R.info.render.calls }; });
