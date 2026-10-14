// The Makers' trials' props (Session 837): props.js's bladeStone and ringCairn on open ground under a clear sky, with the
// 1.8 m post. ?view=blade (default): the Gate-Blade in its stone, from the path; ?view=blade&close: the hilt at arm's length;
// ?view=cairn: the Noon Ring's cairn at noon, the sun through the slab's hole falling on the hollow; &sun=morning moves the sun off it.
// ?view=wreck (Session 839): the Drowned Bell's wreck on its skerry at low water, the bell on the last beam; &tide=high: the sea
// over it, the mast alone above; &close: the bell from where a person stands in the hull; &taken: the beam with the bell gone.
// ?view=den (Session 850): the Wolf-Mother's Cloak in its lair's last chamber, from the mouth by torchlight, a shaft of day down the
// crack onto the nest, the master's place a ghost (&noghost hides it); &close: the cloak's hem at your feet.
// &cam=x,y,z,tx,ty,tz puts the camera anywhere (Session 839).
// ?view=lamp (Session 838): the Waylamp on its inn's bracket at dusk, lit and (&unlit) put out, a candle's light from it.
import * as THREE from 'three';
import { Q, W, H, STATS, GLSL_NOISE, makeRenderer, makeComposer, buildTextures, mat, worldUV, skyDome, clouds, run } from './common.js';
import { bladeStone, ringCairn, waylamp, tidalWreck, beastDen } from './props.js';
import { stream } from './pieces.js';

const R = makeRenderer(.85), scene = new THREE.Scene(), VIEW = Q.get('view') || 'blade';
scene.fog = new THREE.FogExp2(new THREE.Color(.74, .80, .88), .006);
const cam = new THREE.PerspectiveCamera(45, W / H, .02, 30000); buildTextures();
const noon = Q.get('sun') !== 'morning', alt = 40 * Math.PI / 180, SUN = noon ? new THREE.Vector3(0, Math.sin(alt), Math.cos(alt)) : new THREE.Vector3(.8, .35, .3).normalize();
const sun = new THREE.DirectionalLight(new THREE.Color(1, .92, .8), 3.6); sun.castShadow = true; sun.shadow.mapSize.set(4096, 4096); sun.shadow.bias = -.0002; sun.shadow.normalBias = .02;
scene.add(sun, sun.target, new THREE.HemisphereLight(new THREE.Color(.62, .72, .9), new THREE.Color(.34, .32, .24), 1.1));
skyDome(scene, SUN); clouds(scene, SUN, { n: 8, d0: 1800, dw: 5000, y0: 300 });
if (VIEW !== 'wreck' && VIEW !== 'den') { const g = new THREE.PlaneGeometry(400, 400); g.rotateX(-Math.PI / 2); worldUV(g, .3); const m = new THREE.Mesh(g, mat('rock', { ns: .7, color: 0x8a9a6a, rough: 1 })); m.receiveShadow = true; scene.add(m); }
// the sea for the wreck (main.js's water, its waves and its sky in the fresnel), at low water (y 0) or high (the prop's HW)
function sea(y) { const g = new THREE.PlaneGeometry(6000, 6000, 1, 1); g.rotateX(-Math.PI / 2);
  const m = new THREE.MeshStandardMaterial({ color: new THREE.Color(.05, .20, .25), roughness: .08, transparent: true, opacity: .8, depthWrite: false });
  m.onBeforeCompile = s => { s.uniforms.uSky = { value: new THREE.Color(.42, .58, .78) }; s.uniforms.uSun = { value: SUN };
    s.vertexShader = 'varying vec3 vW;\n' + s.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\n vW = (modelMatrix * vec4(position,1.)).xyz;');
    s.fragmentShader = 'uniform vec3 uSky; uniform vec3 uSun; varying vec3 vW;\n' + GLSL_NOISE + s.fragmentShader
      .replace('#include <normal_fragment_maps>', `#include <normal_fragment_maps>
        { vec2 p = vW.xz; float e = .5; float a = fb(p / 3.), bx = fb((p + vec2(e, 0.)) / 3.), bz = fb((p + vec2(0., e)) / 3.);
          float a2 = fb(p / 17. + 5.), bx2 = fb((p + vec2(e, 0.)) / 17. + 5.), bz2 = fb((p + vec2(0., e)) / 17. + 5.);
          vec3 nw = normalize(vec3((a - bx) * 1.4 + (a2 - bx2) * 2.2, 1., (a - bz) * 1.4 + (a2 - bz2) * 2.2)); normal = normalize((viewMatrix * vec4(nw, 0.)).xyz); }`)
      .replace('#include <opaque_fragment>', `
        vec3 V = normalize(cameraPosition - vW); vec3 Nw = normalize((inverse(viewMatrix) * vec4(normal, 0.)).xyz);
        float fr = pow(1. - max(dot(V, Nw), 0.), 5.) * .55 + .04; vec3 Rv = reflect(-V, Nw);
        outgoingLight = mix(outgoingLight, mix(uSky * .9, uSky * 1.2, clamp(Rv.y * 2., 0., 1.)), fr);
        outgoingLight += vec3(1., .88, .66) * pow(max(dot(Rv, normalize(uSun)), 0.), 300.) * 6.;
        #include <opaque_fragment>`); };
  const w = new THREE.Mesh(g, m); w.position.y = y; w.renderOrder = 2; scene.add(w);
  { const b = new THREE.PlaneGeometry(600, 600); b.rotateX(-Math.PI / 2); worldUV(b, .4); const f = new THREE.Mesh(b, mat('rock', { ns: .5, color: 0x8a8068, rough: 1 })); f.position.y = -3.2; f.receiveShadow = true; scene.add(f); }
  /* the port's headland across the water, a low dark shore 260 m off */
  { const h = new THREE.Mesh(new THREE.SphereGeometry(1, 24, 10), new THREE.MeshStandardMaterial({ color: 0x4a5a3a, roughness: 1 })); h.scale.set(420, 26, 70); h.position.set(-120, -6, -330); scene.add(h); } }
{ const m = new THREE.MeshStandardMaterial({ color: 0x3a3028 }), post = new THREE.Group(); post.add(new THREE.Mesh(new THREE.BoxGeometry(.03, 1.8, .03).translate(0, .9, 0), m)); for (let i = 1; i <= 18; i++) post.add(new THREE.Mesh(new THREE.BoxGeometry(i % 5 ? .08 : .16, .012, .03).translate(.04, i * .1, 0), m)); post.position.set(1.4, 0, 1.2); scene.add(post); window.__post = post; }
let P;
if (VIEW === 'wreck') { const high = Q.get('tide') === 'high'; P = tidalWreck({ taken: Q.has('taken') }, stream('wreck:carrigcarra')); scene.add(P.group); sea(high ? P.HW : 0); window.__post.position.set(3.2, P.rockTop, 3.4);
  scene.fog.density = .004;
  if (Q.has('close')) { cam.fov = 40; cam.position.set(P.stand[0], P.stand[1] + 1.62, P.stand[2]); cam.lookAt(...P.bell); cam.position.addScaledVector(cam.getWorldDirection(new THREE.Vector3()), -.6); }
  else { cam.position.set(11, high ? 3.6 : 2.6, 13); cam.lookAt(-.5, high ? 2.2 : 1.3, 0); }
} else if (VIEW === 'den') { P = beastDen({ ghost: !Q.has('noghost') }, stream('den:dunkeel')); scene.add(P.group); window.__post.position.set(1.6, 0, P.master.z + 1.6);
  sun.intensity = 0; scene.fog.color.setRGB(.05, .045, .04); scene.fog.density = .02; scene.children.filter(c => c.isHemisphereLight).forEach(h => h.intensity = .2);
  { const c = new THREE.Vector3(...P.crack), sp = new THREE.SpotLight(new THREE.Color(.75, .85, 1), 60, 12, .32, .6, 1.4); sp.position.copy(c); sp.target.position.set(P.nest[0], 0, P.nest[2]); sp.castShadow = true; sp.shadow.mapSize.set(2048, 2048); scene.add(sp, sp.target); }
  const tp = Q.has('close') ? new THREE.Vector3(P.master.x + .9, 1.62, P.hem + 1.5) : new THREE.Vector3(.4, 1.6, 4.2); { const t = new THREE.PointLight(new THREE.Color(1, .62, .3), 40, 16, 1.5); t.position.copy(tp).add(new THREE.Vector3(.35, -.1, -.2)); scene.add(t); }
  if (Q.has('close')) { cam.fov = 45; cam.position.copy(tp); cam.lookAt(P.master.x, .2, P.hem - .3); } else { cam.fov = 55; cam.position.copy(tp); cam.lookAt(P.nest[0], .6, P.nest[2]); }
} else if (VIEW === 'lamp') { const unlit = Q.has('unlit'); P = waylamp({ hook: true, lit: !unlit }, stream('waylamp:biafaira')); scene.add(P.group);
  const pair = waylamp({ lit: unlit }, stream('waylamp:pair')); pair.group.position.set(.55, 1.0, .25); scene.add(pair.group);
  { const t = new THREE.Mesh(new THREE.BoxGeometry(.9, .06, .5), mat('wood', { ns: 1, color: 0x8a6a4a })); t.position.set(.55, .97, .2); t.castShadow = t.receiveShadow = true; scene.add(t); const l = new THREE.Mesh(new THREE.BoxGeometry(.08, .94, .08), t.material); l.position.set(.55, .47, .2); scene.add(l); }
  if (!unlit) { const pl = new THREE.PointLight(new THREE.Color(1, .7, .4), 2.2, 6, 2); pl.position.set(0, 1.7, .05); scene.add(pl); }
  sun.intensity = .35; sun.color.setRGB(1, .55, .35); scene.fog.color.setRGB(.25, .22, .3);
  cam.fov = 35; cam.position.set(.9, 1.7, 1.6); cam.lookAt(.2, 1.45, 0);
} else if (VIEW === 'cairn') { P = ringCairn({ sunAlt: alt }, stream('cairn:sliabh')); scene.add(P.group);
  if (Q.has('close')) { cam.position.set(-1.1, 2.4, -.9); cam.lookAt(0, P.ring[1], 0); cam.fov = 35; } else { cam.position.set(-4.5, 2.4, 4.8); cam.lookAt(0, 1.2, 0); }
} else { P = bladeStone({}, stream('blade:dunmore')); scene.add(P.group);
  if (Q.has('close')) { cam.position.set(.9, 1.6, 1.7); cam.lookAt(...P.grip); cam.fov = 40; } else { cam.position.set(2.6, 1.65, 6.2); cam.lookAt(-.4, 1.4, 0); } }
if (Q.get('cam')) { const c = Q.get('cam').split(',').map(Number); cam.position.set(c[0], c[1], c[2]); cam.lookAt(c[3], c[4], c[5]); } /* &cam=x,y,z,tx,ty,tz, any view from anywhere */
cam.updateProjectionMatrix();
sun.position.copy(SUN).multiplyScalar(40); sun.target.position.set(0, 0, 0); Object.assign(sun.shadow.camera, { left: -8, right: 8, top: 8, bottom: -8, near: .5, far: 100 }); sun.shadow.camera.updateProjectionMatrix();
STATS.prop = { view: VIEW, tris: P.tris, draws: P.draws, top: P.top, grip: P.grip, ring: P.ring, hole: P.hole, handle: P.handle, lit: P.lit, bell: P.bell, stand: P.stand, mastTop: P.mastTop, HW: P.HW, master: P.master, hem: P.hem };
run(makeComposer(R, scene, cam, { bloom: .12, sat: 1.0, vig: .3 }), cam);
