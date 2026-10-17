// Ships in the new kit (Session 858): ships.js's gatelandsSloop on a calm sea under a clear sky (trials.js's water).
// ?view=quarter (default): from off her starboard bow, the whole hull and its sail; ?view=side: broadside, the clinker strakes and the
// sheer; ?view=deck: from the tiller forward along the deck, the rail at the hip; ?view=lap: close on the strakes at the waterline.
// &noharp: the sail plain. &cam=x,y,z,tx,ty,tz puts the camera anywhere.
// ?ship=cutter (Session 871): the Mark's cutter, the same views (lap is close on her stem and its head); &stripe: the striped sails;
// &nohead: no beast's head on the stem.
// ?ship=caravel (Session 886): Aurenne's caravel; deck is from her castle by the wheel, castle from the waist aft to the castle's
// bulkhead and ladders, lap close on her stern. &nostar: the sails plain; &tiller: a tiller for the wheel.
// ?ship=cog (Session 892): the Gatelands cog; deck from her aftcastle by the wheel, castle from the waist aft, fore from the waist to the
// forecastle on its posts, lap close on her stern; &noharp.
// ?ship=galleon (Session 896): the Gatelands galleon, the cog's views.
// ?ship=aursloop (Session 902): the sloop in Aurenne's dress, the sloop's views (lap close on her bow); &nostar.
// ?ship=aurcutter (Session 922): the cutter in Aurenne's dress, the cutter's views (lap close on her bow); &nostar, &nojib.
// ?ship=glcutter (Session 923): the cutter in the Gatelands' dress, the cutter's views (lap close on her bow); &noharp, &nojib.
// ?ship=glcaravel (Session 924): the caravel in the Gatelands' dress, the caravel's views; &rig=redonda (default), square or lateen; &noharp.
// ?ship=markcog (Session 1039): the cog in the Mark's dress (#347 A: one gaff main), the cog's views; &stripe.
// ?ship=markcaravel (Session 1038): the caravel in the Mark's dress (#347 A: gaff fore and main, the lateen mizzen), the caravel's views; &stripe, &nohead.
// ?ship=marksloop (Session 900): the sloop in the Mark's dress, the sloop's views (lap is close on her bow and its head); &nohead, &noshields.
import * as THREE from 'three';
import { Q, W, H, STATS, GLSL_NOISE, makeRenderer, makeComposer, buildTextures, skyDome, clouds, run } from './common.js';
import { gatelandsSloop, markSloop, aurenneSloop, markCutter, aurenneCutter, gatelandsCutter, gatelandsCaravel, markCaravel, aurenneCaravel, gatelandsCog, markCog, gatelandsGalleon } from './ships.js';
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
const GCU = Q.get('ship') === 'glcutter', ACU = GCU || Q.get('ship') === 'aurcutter', ASL = Q.get('ship') === 'aursloop', MSL = Q.get('ship') === 'marksloop', CUT = Q.get('ship') === 'cutter', GCV = Q.get('ship') === 'glcaravel', MCV = Q.get('ship') === 'markcaravel', CAR = GCV || MCV || Q.get('ship') === 'caravel', MCG = Q.get('ship') === 'markcog', COG = MCG || Q.get('ship') === 'cog', GAL = Q.get('ship') === 'galleon', S = GAL ? gatelandsGalleon({ harp: !Q.has('noharp') }, stream('galleon:kilmore')) : MCG ? markCog({ stripe: Q.has('stripe') }, stream('cog:skarvik')) : COG ? gatelandsCog({ harp: !Q.has('noharp') }, stream('cog:kilmore')) : MCV ? markCaravel({ stripe: Q.has('stripe'), head: !Q.has('nohead') }, stream('caravel:skarvik')) : GCV ? gatelandsCaravel({ rig: Q.get('rig') || 'redonda', harp: !Q.has('noharp') }, stream('caravel:kilmore')) : CAR ? aurenneCaravel({ star: !Q.has('nostar'), tiller: Q.has('tiller') }, stream('caravel:sabrine')) : GCU ? gatelandsCutter({ harp: !Q.has('noharp'), jib: !Q.has('nojib') }, stream('cutter:kilmore')) : ACU ? aurenneCutter({ star: !Q.has('nostar'), jib: !Q.has('nojib') }, stream('cutter:sabrine')) : CUT ? markCutter({ stripe: Q.has('stripe'), head: !Q.has('nohead') }, stream('cutter:skarvik')) : ASL ? aurenneSloop({ star: !Q.has('nostar') }, stream('sloop:sabrine')) : MSL ? markSloop({ head: !Q.has('nohead'), shields: !Q.has('noshields') }, stream('sloop:skarvik')) : gatelandsSloop({ harp: !Q.has('noharp') }, stream('sloop:kilmore')); scene.add(S.group);
if (CUT || ACU) Object.assign(sun.shadow.camera, { left: -13, right: 13, top: 17 });
if (CAR || COG) Object.assign(sun.shadow.camera, { left: -16, right: 16, top: 22, bottom: -5 });
if (GAL) Object.assign(sun.shadow.camera, { left: -20, right: 20, top: 24, bottom: -6 });
let eye, at;
if (COG || GAL) { const CY = S.castles.aft.y, A = S.castles.aft, F = S.castles.fore, k = GAL ? 1.3 : 1;
  if (VIEW === 'side') { eye = [27 * k, 5.5 * k, .5]; at = [0, 5.6 * k, 0]; }
  else if (VIEW === 'deck') { eye = [1.5, CY + 1.65, A.z1 - 2.2]; at = [-.5, CY + .3, 7]; cam.fov = 62; }
  else if (VIEW === 'castle') { eye = [-1.1, S.deck + 1.65, -.6]; at = [0, S.deck + 2.1, A.z1 - 2]; cam.fov = 66; }
  else if (VIEW === 'fore') { eye = [1.0, S.deck + 1.65, -.3]; at = [0, S.deck + 2.0, F.z1]; cam.fov = 66; }
  else if (VIEW === 'lap') { eye = [8 * k, 4.0 * k, -15 * k]; at = [0, 3.0, A.z0 + .5]; cam.fov = 45; }
  else { eye = [18 * k, 6.5 * k, 19 * k]; at = [0, 5.4 * k, .5]; } }
else if (CAR) { const CY = S.castle.y;
  if (VIEW === 'side') { eye = [27, 6.5, .5]; at = [0, 7.2, -.5]; }
  else if (VIEW === 'deck') { eye = [1.3, CY + 1.65, -6.6]; at = [-.3, CY + .5, 6]; cam.fov = 62; }
  else if (VIEW === 'castle') { eye = [-1.1, S.deck + 1.65, -.3]; at = [0, S.deck + 2.1, -6]; cam.fov = 66; cam.fov = 62; }
  else if (VIEW === 'lap') { eye = [8, 4.4, -15.5]; at = [0, 3.4, -7.6]; cam.fov = 45; }
  else { eye = [19, 7, 19.5]; at = [0, 6.4, .5]; } }
else if (ACU) { if (VIEW === 'side') { eye = [22, 5.0, .5]; at = [0, 6.0, 0]; } else if (VIEW === 'deck') { eye = [.9, S.deck + 1.65, -5.2]; at = [-.2, S.deck + 1.8, 4]; cam.fov = 62; }
  else if (VIEW === 'lap') { eye = [4.2, 3.0, 11.2]; at = [0, 2.6, 7.0]; cam.fov = 42; } else { eye = [16, 6.4, 17]; at = [0, 5.4, .5]; } }
else if (VIEW === 'side') { eye = CUT ? [21, 4.2, .5] : [17, 3.2, .5]; at = CUT ? [0, 5.4, 0] : [0, 3.4, 0]; }
else if (VIEW === 'deck') { eye = [.9, S.deck + 1.65, -5.2]; at = [-.2, S.deck + 1.6, 4]; cam.fov = 62; }
else if (VIEW === 'lap') { if (CUT) { eye = [3.4, 2.6, 10.2]; at = [0, 2.2, 7.1]; cam.fov = 40; } else if (MSL || ASL) { eye = [3.6, 2.4, 9.6]; at = [0, 1.9, 6.0]; cam.fov = 40; } else { eye = [3.6, .6, 2.2]; at = [2.0, .35, 1.2]; cam.fov = 40; } }
else { eye = CUT ? [15, 5.6, 16] : [13, 5.2, 14]; at = CUT ? [0, 4.6, .5] : [0, 3.4, .5]; }
cam.position.set(...eye); cam.lookAt(...at);
if (Q.get('cam')) { const c = Q.get('cam').split(',').map(Number); cam.position.set(c[0], c[1], c[2]); cam.lookAt(c[3], c[4], c[5]); }
cam.updateProjectionMatrix();
STATS.ship = { ship: MCG ? 'markcog' : MCV ? 'markcaravel' : GCV ? 'glcaravel' : GCU ? 'glcutter' : ACU ? 'aurcutter' : GAL ? 'galleon' : COG ? 'cog' : CAR ? 'caravel' : CUT ? 'cutter' : MSL ? 'marksloop' : ASL ? 'aursloop' : 'sloop', view: VIEW, tris: S.tris, draws: S.draws };
run(makeComposer(R, scene, cam, { bloom: .12, sat: 1.05, vig: .28 }), cam);
