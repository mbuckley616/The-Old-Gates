// Ships in the new kit (Session 858): ships.js's gatelandsSloop on a calm sea under a clear sky (trials.js's water).
// ?view=quarter (default): from off her starboard bow, the whole hull and its sail; ?view=side: broadside, the clinker strakes and the
// sheer; ?view=deck: from the tiller forward along the deck, the rail at the hip; ?view=lap: close on the strakes at the waterline.
// &noharp: the sail plain. &cam=x,y,z,tx,ty,tz puts the camera anywhere.
import * as THREE from 'three';
import { Q, W, H, STATS, GLSL_NOISE, makeRenderer, makeComposer, buildTextures, skyDome, clouds, run } from './common.js';
import { gatelandsSloop } from './ships.js';
import { stream } from './pieces.js';

const R = makeRenderer(.85), scene = new THREE.Scene(), VIEW = Q.get('view') || 'quarter'; buildTextures();
scene.fog = new THREE.FogExp2(new THREE.Color(.74, .80, .88), .0025);
const cam = new THREE.PerspectiveCamera(45, W / H, .05, 30000);
const SUN = new THREE.Vector3(.55, .5, .65).normalize();
const sun = new THREE.DirectionalLight(new THREE.Color(1, .93, .82), 3.4); sun.castShadow = true; sun.shadow.mapSize.set(4096, 4096); sun.shadow.bias = -.0003; sun.shadow.normalBias = .03;
sun.position.copy(SUN).multiplyScalar(40); Object.assign(sun.shadow.camera, { left: -12, right: 12, top: 14, bottom: -4, near: 1, far: 90 }); scene.add(sun, sun.target);
scene.add(new THREE.HemisphereLight(new THREE.Color(.62, .72, .9), new THREE.Color(.2, .26, .3), 1.0));
skyDome(scene, SUN); clouds(scene, SUN, { n: 8, d0: 1800, dw: 5000, y0: 300 });
{ const g = new THREE.PlaneGeometry(6000, 6000, 1, 1); g.rotateX(-Math.PI / 2);
  const m = new THREE.MeshStandardMaterial({ color: new THREE.Color(.05, .20, .25), roughness: .08, transparent: true, opacity: .86, depthWrite: false });
  m.onBeforeCompile = s => { s.uniforms.uSky = { value: new THREE.Color(.42, .58, .78) }; s.uniforms.uSun = { value: SUN };
    s.vertexShader = 'varying vec3 vW;\n' + s.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\n vW = (modelMatrix * vec4(position,1.)).xyz;');
    s.fragmentShader = 'uniform vec3 uSky; uniform vec3 uSun; varying vec3 vW;\n' + GLSL_NOISE + s.fragmentShader
      .replace('#include <normal_fragment_maps>', `#include <normal_fragment_maps>
        { vec2 p = vW.xz; float e = .5; float a = fb(p / 3.), bx = fb((p + vec2(e, 0.)) / 3.), bz = fb((p + vec2(0., e)) / 3.);
          vec3 nw = normalize(vec3((a - bx) * 1.2, 1., (a - bz) * 1.2)); normal = normalize((viewMatrix * vec4(nw, 0.)).xyz); }`)
      .replace('#include <opaque_fragment>', `
        vec3 V = normalize(cameraPosition - vW); vec3 Nw = normalize((inverse(viewMatrix) * vec4(normal, 0.)).xyz);
        float fr = pow(1. - max(dot(V, Nw), 0.), 5.) * .55 + .04; vec3 Rv = reflect(-V, Nw);
        outgoingLight = mix(outgoingLight, mix(uSky * .9, uSky * 1.2, clamp(Rv.y * 2., 0., 1.)), fr);
        outgoingLight += vec3(1., .88, .66) * pow(max(dot(Rv, normalize(uSun)), 0.), 300.) * 6.;
        #include <opaque_fragment>`); };
  const sea = new THREE.Mesh(g, m); sea.renderOrder = 2; scene.add(sea); }
const S = gatelandsSloop({ harp: !Q.has('noharp') }, stream('sloop:kilmore')); scene.add(S.group);
let eye, at;
if (VIEW === 'side') { eye = [17, 3.2, .5]; at = [0, 3.4, 0]; }
else if (VIEW === 'deck') { eye = [.9, S.deck + 1.65, -5.2]; at = [-.2, S.deck + 1.6, 4]; cam.fov = 62; }
else if (VIEW === 'lap') { eye = [3.6, .6, 2.2]; at = [2.0, .35, 1.2]; cam.fov = 40; }
else { eye = [13, 5.2, 14]; at = [0, 3.4, .5]; }
cam.position.set(...eye); cam.lookAt(...at);
if (Q.get('cam')) { const c = Q.get('cam').split(',').map(Number); cam.position.set(c[0], c[1], c[2]); cam.lookAt(c[3], c[4], c[5]); }
cam.updateProjectionMatrix();
STATS.ship = { view: VIEW, tris: S.tris, draws: S.draws };
run(makeComposer(R, scene, cam, { bloom: .12, sat: 1.05, vig: .28 }), cam);
