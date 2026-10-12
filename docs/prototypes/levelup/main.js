// The Gatelands, hero view: a from-scratch render slice toward the concept art (OG-077, OG-014). Session 768.
// Nothing here is the game's code. It asks one question: what does The Old Gates look like on a current renderer
// built for this look? Current three.js (0.170, vendored), physically based light, ACES, shadowed sun and sky light,
// a shaded terrain with fields and hedgerows, a hundred thousand blades of grass in the wind, leaf-card trees with
// rounded normals, a village of whitewashed thatch, a stone bridge, a Weaver ruin on the hill, water, cumulus clouds,
// aerial perspective, bloom and a grade.
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { ImprovedNoise } from 'three/addons/math/ImprovedNoise.js';

const Q = new URLSearchParams(location.search); const STATS = window.__stats = {};
const STILL = Q.has('still'), W = +(Q.get('w') || innerWidth), H_ = +(Q.get('h') || innerHeight);
const GRASS_N = +(Q.get('grass') || (STILL ? 160000 : 90000));

// ── a seeded random and noise ──
let seed = 7; const rnd = () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;
const PN = new ImprovedNoise(), n2 = (x, z) => PN.noise(x, z, 0.37);
const fbm = (x, z, o = 5) => { let a = 0, f = 1, m = 1, s = 0; for (let i = 0; i < o; i++) { a += m * n2(x * f, z * f); s += m; f *= 2.03; m *= .5; } return a / s; };
const sstep = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
const mix = (a, b, t) => a + (b - a) * t;

// ── the land ──
const RIVER = new THREE.CatmullRomCurve3([[-1500, -260], [-950, -430], [-520, -520], [-160, -560], [120, -610], [360, -740], [560, -930], [760, -1130], [980, -1360], [1200, -1600]].map(([x, z]) => new THREE.Vector3(x, 0, z)));
const RP = RIVER.getSpacedPoints(400).map(v => [v.x, v.z]);
function riverDist(x, z) { let b = 1e9; for (let i = 0; i < RP.length - 1; i++) { const [ax, az] = RP[i], [bx, bz] = RP[i + 1], dx = bx - ax, dz = bz - az; const t = Math.max(0, Math.min(1, ((x - ax) * dx + (z - az) * dz) / (dx * dx + dz * dz))); const ex = ax + dx * t - x, ez = az + dz * t - z, d = ex * ex + ez * ez; if (d < b) b = d; } return Math.sqrt(b); }
const PATH = new THREE.CatmullRomCurve3([[2, 8], [10, -30], [28, -70], [62, -130], [84, -220], [96, -330], [108, -470], [116, -560]].map(([x, z]) => new THREE.Vector3(x, 0, z)));
const PP = PATH.getSpacedPoints(200).map(v => [v.x, v.z]);
function pathDist(x, z) { if (z > 30 || z < -600 || x < -60 || x > 200) return 1e9; let b = 1e9; for (let i = 0; i < PP.length - 1; i++) { const [ax, az] = PP[i], [bx, bz] = PP[i + 1], dx = bx - ax, dz = bz - az; const t = Math.max(0, Math.min(1, ((x - ax) * dx + (z - az) * dz) / (dx * dx + dz * dz))); const ex = ax + dx * t - x, ez = az + dz * t - z, d = ex * ex + ez * ez; if (d < b) b = d; } return Math.sqrt(b); }
const seaT = (x, z) => sstep(980, 1420, x * .55 - z * .85);
const VILLAGE = { x: 120, z: -615 }, RUIN = { x: -430, z: -1060 };
function landH(x, z, dr) {
  dr = dr ?? riverDist(x, z);
  let h = 16 * fbm(x / 760, z / 760, 5) + 5 * fbm(x / 170 + 5, z / 170, 4);
  const valley = sstep(0, 460, dr);
  h = h * (.25 + .75 * valley) + valley * valley * 34;
  h = mix(-4, h, sstep(7, 30, dr));
  { const sz = z > 40 ? 220 : 115; h += 60 * Math.exp(-((x + 30) ** 2) / (2 * 280 ** 2) - ((z - 40) ** 2) / (2 * sz * sz)); }
  h += 125 * Math.exp(-((x - RUIN.x) ** 2 + (z - RUIN.z) ** 2) / (2 * 230 ** 2));
  const vd = Math.hypot(x - VILLAGE.x, z - VILLAGE.z); h = mix(h, Math.min(h, 4 + 6 * fbm(x / 90, z / 90, 2)), Math.exp(-(vd * vd) / (2 * 170 ** 2)) * sstep(14, 40, dr));
  h = mix(h, -26, seaT(x, z));
  return h;
}
const WATER_Y = -.6;

// ── renderer, scene, camera ──
const R = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true, powerPreference: 'high-performance' });
R.setPixelRatio(STILL ? 1 : Math.min(devicePixelRatio, 1.5)); R.setSize(W, H_, !STILL ? true : false);
R.toneMapping = THREE.ACESFilmicToneMapping; R.toneMappingExposure = .82;
R.shadowMap.enabled = true; R.shadowMap.type = THREE.PCFSoftShadowMap;
document.body.appendChild(R.domElement);
const scene = new THREE.Scene();
const HAZE = new THREE.Color(.70, .79, .90);
scene.fog = new THREE.FogExp2(HAZE, .00024);
const VIEW = Q.get('view') || 'hero'; const cam = new THREE.PerspectiveCamera(VIEW === 'hero' ? 47 : 58, W / H_, .3, 30000);
// views: the hero vista from the hill path; the village street by the bridge
const VIEWS = { hero: { x: 0, z: 0, eye: 1.75, look: [95, -112, -720] }, village: (() => { const p = RIVER.getPointAt(.405), t = RIVER.getTangentAt(.405), q = RIVER.getPointAt(.462); const nx = -t.z, nz = t.x; const cx = p.x + nx * 24, cz = p.z + nz * 24; return { x: cx, z: cz, eye: 1.7, look: [q.x + nx * 6 - cx, 1.5, q.z + nz * 6 - cz] }; })() };
const V0 = VIEWS[VIEW] || VIEWS.hero, CAM0 = { x: V0.x, z: V0.z }; const camY = landH(V0.x, V0.z) + V0.eye;
cam.position.set(CAM0.x, camY, CAM0.z);
const LOOK = new THREE.Vector3(V0.x + V0.look[0], camY + V0.look[1], V0.z + V0.look[2]); cam.lookAt(LOOK);

// ── sky and light ──
const SUN_DIR = new THREE.Vector3().setFromSphericalCoords(1, THREE.MathUtils.degToRad(90 - 27), THREE.MathUtils.degToRad(-72));
const sky = new THREE.Mesh(new THREE.SphereGeometry(26000, 48, 24), new THREE.ShaderMaterial({ side: THREE.BackSide, depthWrite: false, fog: false, uniforms: { uSun: { value: SUN_DIR } },
  vertexShader: 'varying vec3 vD; void main(){ vD = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }',
  fragmentShader: `uniform vec3 uSun; varying vec3 vD; void main(){ float y = max(vD.y, 0.);
    vec3 zen = vec3(.09, .25, .62), mid = vec3(.30, .52, .86), hor = vec3(.74, .83, .93);
    vec3 c = mix(hor, mid, smoothstep(0., .18, y)); c = mix(c, zen, smoothstep(.15, .75, y));
    float sd = max(dot(normalize(vD), normalize(uSun)), 0.); c += vec3(1., .82, .55) * (pow(sd, 8.) * .35 + pow(sd, 900.) * 18.);
    c = mix(c, hor * .9, smoothstep(0., -.08, vD.y));
    gl_FragColor = vec4(c * 1.15, 1.); }` }));
scene.add(sky);
const sun = new THREE.DirectionalLight(new THREE.Color(1.0, .9, .74), 3.4);
sun.position.copy(SUN_DIR).multiplyScalar(900).add(new THREE.Vector3(60, 0, -320)); sun.target.position.set(60, 0, -320);
sun.castShadow = true; sun.shadow.mapSize.set(4096, 4096); const SC = sun.shadow.camera; SC.left = -520; SC.right = 520; SC.top = 520; SC.bottom = -520; SC.near = 10; SC.far = 2200; sun.shadow.bias = -.0005; sun.shadow.normalBias = .12;
scene.add(sun, sun.target);
const hemi = new THREE.HemisphereLight(new THREE.Color(.62, .74, .96), new THREE.Color(.36, .32, .22), 1.25); scene.add(hemi);

// GLSL noise shared by the shaders
const GLSL_NOISE = `
float h12(vec2 p){ p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
float vn(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f); return mix(mix(h12(i), h12(i + vec2(1,0)), f.x), mix(h12(i + vec2(0,1)), h12(i + vec2(1,1)), f.x), f.y); }
float fb(vec2 p){ float a = 0., m = .5; for (int i = 0; i < 5; i++) { a += m * vn(p); p = p * 2.03 + 17.1; m *= .5; } return a; }
`;

// ── the terrain: a grid dense at the camera and coarse at the horizon, coloured in its shader ──
function buildTerrain() {
  const N = 760, E = 2.25, SPAN = 7600, pos = new Float32Array(N * N * 3), mask = new Float32Array(N * N * 3);
  for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) {
    const u = i / (N - 1) * 2 - 1, v = j / (N - 1) * 2 - 1, x = CAM0.x + Math.sign(u) * Math.abs(u) ** E * SPAN, z = CAM0.z + Math.sign(v) * Math.abs(v) ** E * SPAN;
    const dr = riverDist(x, z), k = (j * N + i) * 3; pos[k] = x; pos[k + 1] = landH(x, z, dr); pos[k + 2] = z;
    const pd = pathDist(x, z); mask[k] = 1 - sstep(1.2, 2.6, pd); mask[k + 1] = sstep(.18, .42, fbm(x / 420 + 31, z / 420 - 7, 4)) * (1 - seaT(x, z)) * sstep(30, 60, dr); mask[k + 2] = 1 - sstep(10, 34, dr);
  }
  const idx = new Uint32Array((N - 1) * (N - 1) * 6); let q = 0;
  for (let j = 0; j < N - 1; j++) for (let i = 0; i < N - 1; i++) { const a = j * N + i, b = a + 1, c = a + N, d = c + 1; idx[q++] = a; idx[q++] = c; idx[q++] = b; idx[q++] = b; idx[q++] = c; idx[q++] = d; }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('aMask', new THREE.BufferAttribute(mask, 3)); g.setIndex(new THREE.BufferAttribute(idx, 1)); g.computeVertexNormals();
  const m = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: .95, metalness: 0 });
  m.onBeforeCompile = s => {
    s.uniforms.uCam = { value: cam.position };
    s.vertexShader = 'attribute vec3 aMask; varying vec3 vW; varying vec3 vNw; varying vec3 vMask;\n' + s.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\n vW = (modelMatrix * vec4(position,1.)).xyz; vNw = normalize(mat3(modelMatrix) * normal); vMask = aMask;');
    s.fragmentShader = 'uniform vec3 uCam; varying vec3 vW; varying vec3 vNw; varying vec3 vMask;\n' + GLSL_NOISE + `
      vec3 fieldCol(float r){ vec3 c = vec3(.30,.46,.13);
        if (r < .18) c = vec3(.56,.48,.17); else if (r < .30) c = vec3(.66,.56,.24); else if (r < .45) c = vec3(.38,.52,.15);
        else if (r < .58) c = vec3(.24,.40,.12); else if (r < .66) c = vec3(.46,.40,.20); else if (r < .80) c = vec3(.33,.50,.17); return c; }
      vec3 landCol(){
        vec2 p = vW.xz; float dist = length(vW - uCam);
        float slope = 1. - clamp(vNw.y, 0., 1.);
        float n1 = fb(p / 38.), n2 = fb(p / 9.), n3 = fb(p / 2.3);
        vec3 grass = mix(vec3(.21,.38,.09), vec3(.42,.55,.16), n1);
        grass = mix(grass, vec3(.52,.55,.22), smoothstep(.55,.8,n2) * .5);
        grass *= .85 + .3 * n3;
        // fields and hedgerows: Voronoi cells over the gentle land
        vec2 fp = p / vec2(78., 58.) + vec2(fb(p/160.)*1.4, fb(p/160.+9.)*1.4); vec2 ip = floor(fp), ff = fract(fp); float d1 = 9., d2 = 9.; vec2 id = vec2(0);
        for (int y = -1; y <= 1; y++) for (int x = -1; x <= 1; x++) { vec2 o = vec2(float(x), float(y)); vec2 r = o + vec2(h12(ip + o), h12(ip + o + 7.3)) - ff; float d = dot(r, r);
          if (d < d1) { d2 = d1; d1 = d; id = ip + o; } else if (d < d2) d2 = d; }
        float edge = sqrt(d2) - sqrt(d1);
        float fm = smoothstep(.14, .05, slope) * smoothstep(110., 260., dist) * (1. - smoothstep(48., 80., vW.y)) * (1. - vMask.y) * (1. - vMask.z);
        vec3 field = fieldCol(h12(id * 1.37)) * (.88 + .24 * n2);
        float stripes = sin(dot(p, normalize(vec2(h12(id), h12(id+3.)) - .5)) * 1.3) * .5 + .5;
        field *= .93 + .1 * stripes;
        vec3 c = mix(grass, field, fm);
        float hedge = (1. - smoothstep(.018, .045 + dist / 14000., edge)) * fm;
        c = mix(c, vec3(.11,.22,.06) * (.8 + .4 * n2), hedge);
        // woods seen from afar
        c = mix(c, vec3(.10,.21,.07) * (.75 + .5 * n2), vMask.y * smoothstep(150., 600., dist) * .9);
        // rock on the steep, sand and shingle at the water, mud along the river
        vec3 rock = mix(vec3(.42,.40,.36), vec3(.58,.55,.48), n2);
        c = mix(c, rock, smoothstep(.34, .52, slope + (n1 - .5) * .18));
        c = mix(c, vec3(.74,.68,.52) * (.9 + .2 * n3), smoothstep(2.2, .4, vW.y) * smoothstep(-30., -3., vW.y));
        c = mix(c, vec3(.38,.33,.22), smoothstep(-1.5, -6., vW.y));
        // trodden ground and lanes in the village
        { float vd = length(vW.xz - vec2(120., -615.)); float vm = (1. - smoothstep(150., 260., vd)) * smoothstep(.35, .6, fb(vW.xz / 14.) + (1. - smoothstep(60., 220., vd)) * .35);
          c = mix(c, mix(vec3(.46,.42,.32), vec3(.56,.50,.38), n3), vm * .85); }
        // the path
        c = mix(c, mix(vec3(.47,.40,.29), vec3(.60,.52,.38), n3), vMask.x * .95);
        // soil under the near grass reads darker
        c *= mix(.62, 1., smoothstep(25., 70., dist));
        return c; }
    ` + s.fragmentShader.replace('vec4 diffuseColor = vec4( diffuse, opacity );', 'vec4 diffuseColor = vec4( landCol(), opacity );');
  };
  const mesh = new THREE.Mesh(g, m); mesh.receiveShadow = true; mesh.castShadow = true; scene.add(mesh);
  return mesh;
}
buildTerrain();

// ── water: one surface for the river and the sea ──
{
  const g = new THREE.PlaneGeometry(40000, 40000, 1, 1); g.rotateX(-Math.PI / 2);
  const m = new THREE.MeshStandardMaterial({ color: new THREE.Color(.05, .20, .27), roughness: .08, metalness: 0, transparent: true, opacity: .92 });
  m.onBeforeCompile = s => {
    s.uniforms.uSky = { value: new THREE.Color(.36, .55, .82) }; s.uniforms.uSun = { value: SUN_DIR };
    s.vertexShader = 'varying vec3 vW;\n' + s.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\n vW = (modelMatrix * vec4(position,1.)).xyz;');
    s.fragmentShader = 'uniform vec3 uSky; uniform vec3 uSun; varying vec3 vW;\n' + GLSL_NOISE + s.fragmentShader
      .replace('#include <normal_fragment_maps>', `#include <normal_fragment_maps>
        { vec2 p = vW.xz; float e = .9; float a = fb(p / 7. + vec2(0., 0.)), bx = fb((p + vec2(e, 0.)) / 7.), bz = fb((p + vec2(0., e)) / 7.);
          float a2 = fb(p / 31. + 5.), bx2 = fb((p + vec2(e, 0.)) / 31. + 5.), bz2 = fb((p + vec2(0., e)) / 31. + 5.);
          vec3 nw = normalize(vec3((a - bx) * 1.6 + (a2 - bx2) * 2.4, 1., (a - bz) * 1.6 + (a2 - bz2) * 2.4)); normal = normalize((viewMatrix * vec4(nw, 0.)).xyz); }`)
      .replace('#include <opaque_fragment>', `
        vec3 V = normalize(cameraPosition - vW); vec3 Nw = normalize((inverse(viewMatrix) * vec4(normal, 0.)).xyz);
        float fr = pow(1. - max(dot(V, Nw), 0.), 5.) * .5 + .03;
        vec3 Rv = reflect(-V, Nw); vec3 refl = mix(uSky * .9, uSky * 1.25, clamp(Rv.y * 2., 0., 1.));
        outgoingLight = mix(outgoingLight, refl, fr);
        outgoingLight += vec3(1., .86, .62) * pow(max(dot(Rv, normalize(uSun)), 0.), 380.) * 7.;
        #include <opaque_fragment>`);
  };
  const water = new THREE.Mesh(g, m); water.position.y = WATER_Y; water.receiveShadow = true; scene.add(water);
}

// ── textures drawn on canvases ──
function canvasTex(w, h, draw, srgb = true) { const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h); const t = new THREE.CanvasTexture(c); if (srgb) t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t; }
const leafTex = canvasTex(256, 256, (x, w, h) => {
  x.clearRect(0, 0, w, h);
  for (let i = 0; i < 260; i++) { const a = rnd() * Math.PI * 2, r = Math.sqrt(rnd()) * 104, cx = 128 + Math.cos(a) * r, cy = 128 + Math.sin(a) * r * .9, s = 11 + rnd() * 9, l = 32 + rnd() * 36;
    x.save(); x.translate(cx, cy); x.rotate(rnd() * Math.PI * 2); x.fillStyle = `hsl(${88 + rnd() * 22},${42 + rnd() * 18}%,${l}%)`; x.beginPath(); x.ellipse(0, 0, s, s * .55, 0, 0, Math.PI * 2); x.fill(); x.restore(); }
});
const puffTex = canvasTex(128, 128, (x, w, h) => { const g = x.createRadialGradient(64, 64, 4, 64, 64, 62); g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(.55, 'rgba(255,255,255,.85)'); g.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = g; x.fillRect(0, 0, w, h); });
const thatchTex = canvasTex(128, 128, (x, w, h) => { x.fillStyle = '#b8924e'; x.fillRect(0, 0, w, h); for (let i = 0; i < 900; i++) { const y = rnd() * h, xx = rnd() * w; x.strokeStyle = `rgba(${90 + rnd() * 90},${70 + rnd() * 60},${30 + rnd() * 30},.5)`; x.beginPath(); x.moveTo(xx, y); x.lineTo(xx + (rnd() - .5) * 3, y + 8 + rnd() * 10); x.stroke(); } });
thatchTex.wrapS = thatchTex.wrapT = THREE.RepeatWrapping;
const stoneTex = canvasTex(256, 256, (x, w, h) => { x.fillStyle = '#8a857a'; x.fillRect(0, 0, w, h); let y = 0; while (y < h) { const rh = 14 + rnd() * 14; let xx = -rnd() * 30; while (xx < w) { const rw = 22 + rnd() * 30, l = 48 + rnd() * 22; x.fillStyle = `hsl(${35 + rnd() * 15},${8 + rnd() * 8}%,${l}%)`; x.fillRect(xx + 1.5, y + 1.5, rw - 3, rh - 3); xx += rw; } y += rh; } });
stoneTex.wrapS = stoneTex.wrapT = THREE.RepeatWrapping;
const plasterTex = canvasTex(128, 128, (x, w, h) => { x.fillStyle = '#f6f1e6'; x.fillRect(0, 0, w, h); for (let i = 0; i < 400; i++) { x.fillStyle = `rgba(${150 + rnd() * 60},${140 + rnd() * 50},${120 + rnd() * 40},${.04 + rnd() * .08})`; x.beginPath(); x.arc(rnd() * w, rnd() * h, 2 + rnd() * 10, 0, 7); x.fill(); } });
plasterTex.wrapS = plasterTex.wrapT = THREE.RepeatWrapping;

// wind, shared by grass and leaves
const WIND = { value: 2.3 };
const windVS = (amp, freq) => `
  vec4 wpI = modelMatrix * instanceMatrix * vec4(0., 0., 0., 1.);
  float sway = sin(uWind * ${freq} + wpI.x * .11 + wpI.z * .07) * .6 + sin(uWind * ${freq} * 2.3 + wpI.x * .37) * .25;
  transformed.x += sway * ${amp} * position.y * position.y; transformed.z += sway * ${amp} * .5 * position.y * position.y;`;

// ── grass: blades near the camera ──
function buildGrass() {
  const seg = 4, bw = .07, posA = [], colA = [], idx = [];
  for (let k = 0; k <= seg; k++) { const t = k / seg, w = bw * (1 - t) ** .9; posA.push(-w, t, 0, w, t, 0); const c0 = [.07, .15, .03], c1 = [.36, .55, .13]; const c = c0.map((v, i) => v + (c1[i] - v) * t ** 1.3); colA.push(...c, ...c); }
  for (let k = 0; k < seg; k++) { const a = k * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(posA, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(colA, 3));
  g.setAttribute('normal', new THREE.Float32BufferAttribute(new Array(posA.length / 3).fill(0).flatMap(() => [0, 1, 0]), 3)); g.setIndex(idx);
  const m = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: .8, side: THREE.DoubleSide });
  m.onBeforeCompile = s => { s.uniforms.uWind = WIND; s.vertexShader = 'uniform float uWind;\n' + s.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>' + windVS(.22, 1.4)); s.fragmentShader = s.fragmentShader.replace('#include <normal_fragment_begin>', '#include <normal_fragment_begin>\n normal = normalize(vNormal);'); };
  const mesh = new THREE.InstancedMesh(g, m, GRASS_N); mesh.receiveShadow = true; mesh.frustumCulled = false;
  const M = new THREE.Matrix4(), qq = new THREE.Quaternion(), sc = new THREE.Vector3(), p = new THREE.Vector3(), col = new THREE.Color(), up = new THREE.Vector3(0, 1, 0);
  const fwd = new THREE.Vector3().subVectors(LOOK, cam.position).setY(0).normalize();
  let n = 0, tries = 0;
  while (n < GRASS_N && tries < GRASS_N * 4) { tries++;
    const r = 1.2 + 85 * rnd() ** 1.7, a = (rnd() - .5) * 1.9, dir = fwd.clone().applyAxisAngle(up, a);
    const x = CAM0.x + dir.x * r, z = CAM0.z + dir.z * r; if (pathDist(x, z) < 1.6) continue; { const vd = Math.hypot(x - VILLAGE.x, z - VILLAGE.z); if (vd < 250 && rnd() < .9 * (1 - sstep(150, 250, vd))) continue; }
    const y = landH(x, z), clump = .55 + .9 * Math.max(0, fbm(x / 6, z / 6, 2) + .3);
    p.set(x, y - .02, z); qq.setFromAxisAngle(up, rnd() * Math.PI); const hh = (.35 + rnd() * .55) * clump * (1 + r / 120); sc.set(1 + r / 60, hh, 1);
    M.compose(p, qq, sc); mesh.setMatrixAt(n, M);
    const dry = sstep(.2, .7, fbm(x / 18 + 3, z / 18, 2) + .3); col.setRGB(1 - .1 * rnd(), 1 - .15 * dry, 1 - .5 * dry - .1 * rnd()); mesh.setColorAt(n, col); n++; }
  mesh.count = n; STATS.grass = n; scene.add(mesh);
  // wildflowers: heather, foxglove, white campion, buttercups
  const fg = new THREE.IcosahedronGeometry(.032, 1).scale(1, .5, 1), fm = new THREE.MeshStandardMaterial({ roughness: .7 }), F = 5200, fl = new THREE.InstancedMesh(fg, fm, F);
  const pal = [[.62, .38, .78], [.78, .44, .70], [.96, .95, .90], [.98, .82, .20], [.85, .20, .18]];
  let f = 0; for (let t = 0; f < F && t < F * 5; t++) { const r = 4 + 60 * rnd() ** 1.3, a = (rnd() - .5) * 1.9, dir = fwd.clone().applyAxisAngle(up, a), x = CAM0.x + dir.x * r, z = CAM0.z + dir.z * r;
    if (pathDist(x, z) < 1.8) continue; const cl = fbm(x / 11 + 40, z / 11, 3); if (cl < .12 && rnd() > .06) continue;
    const kr = rnd(), kind = kr < .38 ? 0 : kr < .5 ? 1 : kr < .74 ? 2 : kr < .95 ? 3 : 4; p.set(x, landH(x, z) + .25 + rnd() * .55, z); sc.setScalar(.6 + rnd() * .5 + r / 45); M.compose(p, qq, sc); fl.setMatrixAt(f, M);
    col.setRGB(...pal[kind]).convertSRGBToLinear(); fl.setColorAt(f, col); f++; }
  fl.count = f; STATS.flowers = f; scene.add(fl);
}
buildGrass();

// ── trees: leaf cards around clumps, normals turned out from the crown so the canopy shades as one soft volume ──
function treeTemplate(kind) {
  const parts = [], cards = { pos: [], nor: [], uv: [], col: [] };
  const trunkH = kind === 1 ? 7 : 5, crownY = trunkH + (kind === 1 ? 3.5 : 3), crownR = kind === 1 ? 4.2 : 5.5;
  const trunk = new THREE.CylinderGeometry(.28, .5, trunkH + 1.5, 7, 3); trunk.translate(0, (trunkH + 1.5) / 2 - .4, 0); parts.push(trunk);
  for (let b = 0; b < 4; b++) { const br = new THREE.CylinderGeometry(.09, .2, 3.4, 5); br.translate(0, 1.7, 0); br.rotateZ(.75 + rnd() * .3); br.rotateY(b * Math.PI / 2 + rnd()); br.translate(0, trunkH - .6 + rnd() * .8, 0); parts.push(br); }
  const clumps = []; const nC = kind === 1 ? 5 : 7;
  for (let c = 0; c < nC; c++) { const a = c / nC * Math.PI * 2 + rnd(), r = crownR * (.35 + .25 * rnd()); clumps.push([Math.cos(a) * r, crownY + (rnd() - .3) * crownR * (kind === 1 ? 1.3 : .7), Math.sin(a) * r, crownR * (.55 + .2 * rnd())]); }
  clumps.push([0, crownY + crownR * .45, 0, crownR * .7]);
  const ctr = new THREE.Vector3(0, crownY, 0), v = new THREE.Vector3(), nrm = new THREE.Vector3(), q = new THREE.Quaternion(), e = new THREE.Euler();
  for (const [cx, cy, cz, cr] of clumps) for (let i = 0; i < 22; i++) {
    const d = new THREE.Vector3(rnd() - .5, rnd() - .5, rnd() - .5).normalize(), p = new THREE.Vector3(cx, cy, cz).addScaledVector(d, cr * (.55 + .45 * Math.sqrt(rnd())));
    e.set(rnd() * 6.3, rnd() * 6.3, rnd() * 6.3); q.setFromEuler(e); const s = 2.3 + rnd() * 1.1;
    const corners = [[-1, -1, 0, 0], [1, -1, 1, 0], [1, 1, 1, 1], [-1, 1, 0, 1]], base = cards.pos.length / 3;
    for (const [a, b, uu, vv] of corners) { v.set(a * s * .5, b * s * .5, 0).applyQuaternion(q).add(p); cards.pos.push(v.x, v.y, v.z);
      nrm.subVectors(v, ctr).normalize().multiplyScalar(.7).add(new THREE.Vector3().subVectors(v, new THREE.Vector3(cx, cy, cz)).normalize().multiplyScalar(.3)).normalize(); cards.nor.push(nrm.x, nrm.y, nrm.z); cards.uv.push(uu, vv);
      const ao = .45 + .55 * sstep(-crownR, crownR * .9, v.y - crownY + (v.x * SUN_DIR.x + v.z * SUN_DIR.z) * .4); cards.col.push(ao, ao, ao); }
    cards.idx = cards.idx || []; cards.idx.push(base, base + 1, base + 2, base, base + 2, base + 3); }
  const lg = new THREE.BufferGeometry(); lg.setAttribute('position', new THREE.Float32BufferAttribute(cards.pos, 3)); lg.setAttribute('normal', new THREE.Float32BufferAttribute(cards.nor, 3)); lg.setAttribute('uv', new THREE.Float32BufferAttribute(cards.uv, 2)); lg.setAttribute('color', new THREE.Float32BufferAttribute(cards.col, 3)); lg.setIndex(cards.idx);
  return { trunk: mergeGeometries(parts.map(p => p.toNonIndexed ? p.toNonIndexed() : p)), leaves: lg };
}
const barkMat = new THREE.MeshStandardMaterial({ color: new THREE.Color(.20, .14, .10), roughness: .95 });
const leafMat = new THREE.MeshStandardMaterial({ map: leafTex, alphaTest: .42, side: THREE.DoubleSide, vertexColors: true, roughness: .78 });
leafMat.onBeforeCompile = s => { s.uniforms.uWind = WIND; s.vertexShader = 'uniform float uWind;\n' + s.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>' + windVS(.004, .9)); s.fragmentShader = s.fragmentShader.replace('#include <normal_fragment_begin>', '#include <normal_fragment_begin>\n normal = normalize(vNormal);'); };
const leafDepth = new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking, map: leafTex, alphaTest: .42 });
function placeTrees() {
  const T = [treeTemplate(0), treeTemplate(1), treeTemplate(0)], spots = [[], [], []];
  const near = (x, z) => Math.hypot(x - VILLAGE.x, z - VILLAGE.z);
  // the framing trees
  spots[0].push([-15, -9, 2.1, .3], [24, -16, 1.6, 1.9]);
  for (let t = 0; t < 26000 && spots[0].length + spots[1].length + spots[2].length < 3000; t++) {
    const x = -1900 + rnd() * 3600, z = 40 - rnd() * 2400; const ang = Math.atan2(x, -z); if (Math.abs(ang) > 1.05 && Math.hypot(x, z) > 300) continue;
    if (Math.hypot(x, z) < 22) continue; if (seaT(x, z) > .05) continue; const dr = riverDist(x, z); if (dr < 16) continue;
    const vd = near(x, z); if (vd < 120 && rnd() > .12) continue; if (pathDist(x, z) < 6) continue;
    const forest = sstep(.18, .42, fbm(x / 420 + 31, z / 420 - 7, 4)), bank = dr < 60 ? .55 : 0, hedge = .05;
    if (rnd() > Math.max(forest * .95, bank, hedge)) continue;
    const y = landH(x, z, dr); if (y > 150) continue; const k = rnd() < .62 ? 0 : (rnd() < .5 ? 1 : 2);
    spots[k].push([x, z, .8 + rnd() * .55, rnd() * 6.3]); }
  STATS.trees = spots[0].length + spots[1].length + spots[2].length;
  const M = new THREE.Matrix4(), q = new THREE.Quaternion(), s = new THREE.Vector3(), p = new THREE.Vector3(), c = new THREE.Color();
  T.forEach((tpl, k) => { const L = spots[k]; if (!L.length) return;
    const tr = new THREE.InstancedMesh(tpl.trunk, barkMat, L.length), lv = new THREE.InstancedMesh(tpl.leaves, leafMat, L.length);
    lv.customDepthMaterial = leafDepth; tr.castShadow = lv.castShadow = true; tr.receiveShadow = lv.receiveShadow = true;
    L.forEach(([x, z, sc, ry], i) => { p.set(x, landH(x, z) - .3, z); q.setFromAxisAngle(new THREE.Vector3(0, 1, 0), ry); s.setScalar(sc); M.compose(p, q, s); tr.setMatrixAt(i, M); lv.setMatrixAt(i, M);
      const autumn = sstep(.35, .7, fbm(x / 300 + 70, z / 300, 3) + .25) * .7, hue = rnd(); c.setRGB(.86 + .2 * hue + autumn * .55, .95 + .1 * hue - autumn * .1, .62 + .12 * hue - autumn * .25); lv.setColorAt(i, c); });
    scene.add(tr, lv); });
}
placeTrees();

// ── the village: whitewashed walls, thatch and slate, a church, a stone bridge ──
const plasterMat = new THREE.MeshStandardMaterial({ map: plasterTex, roughness: .95 });
const thatchMat = new THREE.MeshStandardMaterial({ map: thatchTex, roughness: 1, color: new THREE.Color(1, .92, .78) });
const slateMat = new THREE.MeshStandardMaterial({ color: new THREE.Color(.20, .23, .28), roughness: .7 });
const stoneMat = new THREE.MeshStandardMaterial({ map: stoneTex, roughness: .92 });
const darkMat = new THREE.MeshStandardMaterial({ color: new THREE.Color(.05, .04, .035), roughness: .6 });
const woodMat = new THREE.MeshStandardMaterial({ color: new THREE.Color(.24, .15, .09), roughness: .9 });
const frameMat = new THREE.MeshStandardMaterial({ color: new THREE.Color(.82, .78, .70), roughness: .85 }); const paint = (r, g, b) => new THREE.MeshStandardMaterial({ color: new THREE.Color().setRGB(r, g, b, THREE.SRGBColorSpace), roughness: .8 });
function roofGeo(w, d, rh, ov) { const sh = new THREE.Shape(); sh.moveTo(-w / 2 - ov, 0); sh.lineTo(0, rh); sh.lineTo(w / 2 + ov, 0); sh.lineTo(-w / 2 - ov, 0);
  const g = new THREE.ExtrudeGeometry(sh, { depth: d + ov * 2, bevelEnabled: true, bevelThickness: .25, bevelSize: .22, bevelSegments: 3, steps: 1 }); g.translate(0, 0, -(d + ov * 2) / 2); return g; }
function village() {
  const G = { plaster: [], thatch: [], slate: [], stone: [], dark: [], wood: [], frame: [], blue: [], green: [], red: [], bloom: [] };
  const put = (key, geo, x, y, z, ry) => { geo.rotateY(ry); geo.translate(x, y, z); G[key].push(geo.index ? geo.toNonIndexed() : geo); };
  function house(x, z, ry, big) {
    STATS.houses = (STATS.houses || 0) + 1;
    const w = (big ? 9 : 6.5) + rnd() * 2.5, d = 4.6 + rnd() * 1.6, h = (big ? 5.6 : 3.4) + rnd() * .8, y = Math.min(landH(x, z), landH(x + 4, z), landH(x - 4, z), landH(x, z + 3), landH(x, z - 3)) - .6;
    const walls = new RoundedBoxGeometry(w, h + .6, d, 2, .14); walls.translate(0, (h + .6) / 2, 0); put('plaster', walls, x, y, z, ry);
    const slate = big ? rnd() < .6 : rnd() < .18, rg = roofGeo(w, d, 2.7 + (slate ? 0 : .7), slate ? .3 : .75); rg.translate(0, h + .55, 0); put(slate ? 'slate' : 'thatch', rg, x, y, z, ry);
    const ch = new THREE.BoxGeometry(.7, 2.4, .7); ch.translate(w * .32 * (rnd() < .5 ? 1 : -1), h + 2.2, 0); put('stone', ch, x, y, z, ry);
    const shut = ['blue', 'green', 'red'][Math.floor(rnd() * 3)];
    for (const side of [1, -1]) for (let k = 0; k < (big ? 4 : 2); k++) { const wx = -w / 2 + (k + .7) * w / (big ? 4.3 : 2.6), wy = h * .55 + .4, fz = side * (d / 2 + .05);
      const add = (key, gw, gh, gd, ox, oy, oz) => { const b = new THREE.BoxGeometry(gw, gh, gd); b.translate(wx + ox, wy + oy, fz + oz * side); put(key, b, x, y, z, ry); };
      add('dark', .7, .9, .1, 0, 0, 0); add('frame', .86, .1, .16, 0, .5, 0); add('frame', .86, .1, .16, 0, -.5, 0); add('frame', .08, 1.0, .14, -.42, 0, 0); add('frame', .08, 1.0, .14, .42, 0, 0); add('frame', .08, .9, .12, 0, 0, 0);
      add(shut, .36, .96, .06, -.66, 0, .03); add(shut, .36, .96, .06, .66, 0, .03);
      if (rnd() < .6) { add('wood', .9, .2, .26, 0, -.6, .1); add('bloom', .82, .18, .2, 0, -.44, .12); } }
    const dr = new THREE.BoxGeometry(1.0, 1.95, .14); dr.translate(w * .1, 1.55, d / 2 + .05); put('wood', dr, x, y, z, ry);
    const df = new THREE.BoxGeometry(1.25, .14, .2); df.translate(w * .1, 2.58, d / 2 + .07); put('frame', df, x, y, z, ry);
  }
  // streets: along the river both sides, and a lane up the hill
  for (let side = -1; side <= 1; side += 2) for (let u = .34; u < .56; u += .0075) {
    const pt = RIVER.getPointAt(u), tg = RIVER.getTangentAt(u), nx = -tg.z * side, nz = tg.x * side;
    for (let row = 0; row < 3; row++) { if (rnd() < .25) continue; const off = 30 + row * 17 + rnd() * 5, x = pt.x + nx * off + tg.x * (rnd() - .5) * 4, z = pt.z + nz * off + tg.z * (rnd() - .5) * 4;
      if (Math.hypot(x - VILLAGE.x, z - VILLAGE.z) > 260 - row * 40) continue; if (riverDist(x, z) < 22) continue; house(x, z, Math.atan2(tg.x, tg.z) + (rnd() - .5) * .15, rnd() < .18); } }
  for (let k = 0; k < 18; k++) { const x = 300 + rnd() * 240, z = -520 + rnd() * 160; if (landH(x, z) > 60 || riverDist(x, z) < 30) continue; house(x, z, rnd() * 6.3, false); }
  // the church: a nave and a tower with a slate spire
  { const x = VILLAGE.x - 45, z = VILLAGE.z + 95, y = landH(x, z) - .5, ry = .4;
    const nave = new RoundedBoxGeometry(8, 7, 18, 2, .15); nave.translate(0, 3.5, 0); put('stone', nave, x, y, z, ry); const nr = roofGeo(8, 18, 4, .3); nr.translate(0, 7, 0); put('slate', nr, x, y, z, ry);
    const tw = new RoundedBoxGeometry(5, 16, 5, 2, .12); tw.translate(0, 8, -11); put('stone', tw, x, y, z, ry); const sp = new THREE.ConeGeometry(3.6, 10, 4); sp.rotateY(Math.PI / 4); sp.translate(0, 21, -11); put('slate', sp, x, y, z, ry); }
  // the bridge: three arches over the river at the village
  { const u = .446, pt = RIVER.getPointAt(u), tg = RIVER.getTangentAt(u), L = 52, sh = new THREE.Shape();
    sh.moveTo(-L / 2, -5); sh.lineTo(L / 2, -5); sh.lineTo(L / 2, 4.2); sh.quadraticCurveTo(0, 6.4, -L / 2, 4.2); sh.lineTo(-L / 2, -5);
    for (const cx of [-15, 0, 15]) { const hole = new THREE.Path(); hole.moveTo(cx - 5.2, -5); hole.lineTo(cx - 5.2, -.5); hole.absarc(cx, -.5, 5.2, Math.PI, 0, true); hole.lineTo(cx + 5.2, -5); hole.lineTo(cx - 5.2, -5); sh.holes.push(hole); }
    const bg = new THREE.ExtrudeGeometry(sh, { depth: 6, bevelEnabled: true, bevelSize: .2, bevelThickness: .2, bevelSegments: 2 }); bg.translate(0, 0, -3);
    const uvs = bg.attributes.uv; for (let i = 0; i < uvs.count; i++) uvs.setXY(i, uvs.getX(i) * .12, uvs.getY(i) * .12);
    put('stone', bg, pt.x, WATER_Y + .1, pt.z, Math.atan2(tg.x, tg.z) + Math.PI / 2); }
  for (const [key, list] of Object.entries(G)) { if (!list.length) continue; const g = mergeGeometries(list); const mat = { plaster: plasterMat, thatch: thatchMat, slate: slateMat, stone: stoneMat, dark: darkMat, wood: woodMat, frame: frameMat, blue: paint(.16, .30, .46), green: paint(.18, .34, .22), red: paint(.50, .14, .10), bloom: paint(.86, .30, .42) }[key];
    if (key === 'thatch' || key === 'stone' || key === 'plaster') { const uv = g.attributes.uv; if (uv && key !== 'stone') for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * .35, uv.getY(i) * .35); }
    const m = new THREE.Mesh(g, mat); m.castShadow = m.receiveShadow = true; scene.add(m); }
}
village();

// ── the Weaver ruin on the hill, a lighthouse on the coast, boats ──
function ruin() {
  const y = landH(RUIN.x, RUIN.z) - 2, pale = new THREE.MeshStandardMaterial({ map: stoneTex, color: new THREE.Color(1.15, 1.12, 1.05), roughness: .9 }), parts = [];
  const add = (g, x, yy, z, ry = 0) => { g.rotateY(ry); g.translate(RUIN.x + x, y + yy, RUIN.z + z); parts.push(g.index ? g.toNonIndexed() : g); };
  // the great arch: two piers and a ring
  const pier = (x, z, h) => { const g = new RoundedBoxGeometry(7, h, 7, 2, .3); g.translate(0, h / 2, 0); add(g, x, 0, z); };
  pier(-14, 0, 44); pier(14, 0, 40);
  { const g = new THREE.TorusGeometry(14, 3.3, 10, 40, Math.PI); add(g, 0, 40, 0); }
  // broken walls, spires and a ring of stones
  for (let k = 0; k < 9; k++) { const a = k / 9 * Math.PI * 2, r = 34 + rnd() * 8, h = 6 + rnd() * 24, g = new RoundedBoxGeometry(5 + rnd() * 5, h, 3.2, 2, .25); g.translate(0, h / 2, 0); add(g, Math.cos(a) * r, -1, Math.sin(a) * r, -a); }
  for (const [x, z, h] of [[-46, 12, 58], [40, 22, 50], [-30, -30, 38]]) { const g = new THREE.CylinderGeometry(2.2, 3.6, h, 8); g.translate(0, h / 2, 0); add(g, x, -1, z); const c = new THREE.ConeGeometry(2.6, 7, 8); c.translate(0, h + 3.4, 0); add(c, x, -1, z); }
  const m = new THREE.Mesh(mergeGeometries(parts), pale); m.castShadow = m.receiveShadow = true; scene.add(m);
}
ruin();
{ // lighthouse
  const x = 1060, z = -1120, y = Math.max(landH(x, z), 0) - 1, g = new THREE.CylinderGeometry(3, 4.2, 26, 16); g.translate(x, y + 13, z);
  const t = new THREE.Mesh(g, plasterMat); const cap = new THREE.Mesh(new THREE.ConeGeometry(4.2, 5, 16).translate(x, y + 29, z), new THREE.MeshStandardMaterial({ color: new THREE.Color(.55, .12, .08) }));
  const lamp = new THREE.Mesh(new THREE.CylinderGeometry(2.6, 2.6, 3, 12).translate(x, y + 25.5, z), new THREE.MeshStandardMaterial({ color: 0x222222, emissive: new THREE.Color(1, .75, .4), emissiveIntensity: 2.5 }));
  t.castShadow = true; scene.add(t, cap, lamp);
}
{ // sailing boats on the estuary and the sea
  const hull = new THREE.CapsuleGeometry(1.4, 7, 4, 8); hull.rotateZ(Math.PI / 2); hull.scale(1, .55, 1); const sail = new THREE.BufferGeometry(); sail.setAttribute('position', new THREE.Float32BufferAttribute([0, 1, 0, 0, 13, 0, 5.5, 1.5, 0], 3)); sail.computeVertexNormals();
  const hm = new THREE.MeshStandardMaterial({ color: new THREE.Color(.25, .15, .1), roughness: .8 }), sm = new THREE.MeshStandardMaterial({ color: new THREE.Color(.95, .92, .85), side: THREE.DoubleSide, roughness: .9 });
  for (const [x, z, r] of [[780, -1160, .4], [960, -1300, 1.2], [1180, -1420, 2], [700, -1010, -.3], [1400, -1300, .8]]) { const b = new THREE.Group(); b.add(new THREE.Mesh(hull, hm), new THREE.Mesh(sail, sm)); b.position.set(x, WATER_Y + .3, z); b.rotation.y = r; b.scale.setScalar(1.4); scene.add(b); }
}

// ── the foreground: a dry-stone wall by the path, a signpost with a banner ──
{
  const sg = new THREE.IcosahedronGeometry(.44, 2); const pa = sg.attributes.position; for (let i = 0; i < pa.count; i++) { const k = 1 + .12 * n2(pa.getX(i) * 4, pa.getZ(i) * 4 + pa.getY(i) * 3); pa.setXYZ(i, pa.getX(i) * k * 1.25, pa.getY(i) * k * .62, pa.getZ(i) * k); } sg.computeVertexNormals();
  const wm = new THREE.MeshStandardMaterial({ color: new THREE.Color(.40, .39, .35), roughness: .95 }), N = 1400, stones = new THREE.InstancedMesh(sg, wm, N), M = new THREE.Matrix4(), q = new THREE.Quaternion(), s = new THREE.Vector3(), p = new THREE.Vector3(), c = new THREE.Color();
  let n = 0; for (let u = 0; u < 1 && n < N; u += .0016) { const pt = PATH.getPointAt(u * .45), tg = PATH.getTangentAt(u * .45); if (pt.z > 2) continue; const ox = -tg.z * 3.4, oz = tg.x * 3.4;
    for (let row = 0; row < 2 && n < N; row++) { const x = pt.x + ox + (rnd() - .5) * .2, z = pt.z + oz + (rnd() - .5) * .2; p.set(x, landH(x, z) + .2 + row * .4, z); q.setFromEuler(new THREE.Euler(rnd() * .4, rnd() * 6, rnd() * .4)); s.set(1 + rnd() * .5, 1 + rnd() * .3, 1 + rnd() * .4); M.compose(p, q, s); stones.setMatrixAt(n, M);
      const moss = rnd() < .45 ? .5 + rnd() * .4 : 0; c.setRGB(1 - moss * .45 + (rnd() - .5) * .15, 1 + moss * .05 + (rnd() - .5) * .12, 1 - moss * .7 + (rnd() - .5) * .1); stones.setColorAt(n, c); n++; } }
  stones.count = n; stones.castShadow = stones.receiveShadow = true; scene.add(stones);
  const px = -3.6, pz = -7, py = landH(px, pz); const post = new THREE.Mesh(new THREE.CylinderGeometry(.09, .11, 3.4, 8).translate(px, py + 1.6, pz), woodMat);
  const arm = new THREE.Mesh(new THREE.BoxGeometry(1.5, .26, .07).translate(px + .55, py + 2.7, pz), woodMat);
  const fgeo = new THREE.PlaneGeometry(.46, .95, 6, 10); { const a = fgeo.attributes.position; for (let i = 0; i < a.count; i++) a.setZ(i, Math.sin(a.getY(i) * 6 + a.getX(i) * 4) * .035 + (a.getY(i) < -.4 ? (a.getX(i) > 0 ? .02 : -.02) : 0)); fgeo.computeVertexNormals(); }
  fgeo.translate(px + .62, py + 2.08, pz + .05);
  const ftex = canvasTex(64, 128, (x, w, h) => { x.fillStyle = '#8e1410'; x.fillRect(0, 0, w, h); x.fillStyle = '#d4a63a'; x.fillRect(0, 8, w, 5); x.fillRect(0, h - 22, w, 4); x.beginPath(); x.arc(w / 2, h * .45, 13, 0, 7); x.lineWidth = 4; x.strokeStyle = '#d4a63a'; x.stroke(); x.fillStyle = '#8e1410'; x.beginPath(); x.moveTo(0, h); x.lineTo(w / 2, h - 14); x.lineTo(w, h); x.fill(); });
  const flag = new THREE.Mesh(fgeo, new THREE.MeshStandardMaterial({ map: ftex, side: THREE.DoubleSide, roughness: .85, alphaTest: .5 }));
  post.castShadow = arm.castShadow = flag.castShadow = true; scene.add(post, arm, flag);
}

// ── distant mountains ──
{
  const pos = [], col = [], idx = [], SEG = 220, ROWS = 14;
  for (let i = 0; i <= SEG; i++) { const a = -1.45 + 2.0 * i / SEG; for (let r = 0; r <= ROWS; r++) { const t = r / ROWS, dist = 5200 + 3200 * t + 600 * fbm(a * 3, t * 2, 3);
    const ridge = Math.pow(Math.max(0, 1 - Math.abs(fbm(a * 2.4 + t * .5, t * 1.1 + 3, 5)) * 1.9), 1.6) * (.55 + .45 * (fbm(a * 7, t * 3, 3) + .5)), h = (220 + 1100 * t) * ridge * (1 - .45 * Math.abs(a + .2)) - 40;
    const x = Math.sin(a) * dist, z = -Math.cos(a) * dist; pos.push(x, h, z); const snow = sstep(820, 980, h + fbm(a * 20, t * 9, 2) * 90); col.push(mix(.17, .93, snow), mix(.21, .95, snow), mix(.27, 1, snow)); } }
  for (let i = 0; i < SEG; i++) for (let r = 0; r < ROWS; r++) { const a = i * (ROWS + 1) + r, b = a + 1, c = a + ROWS + 1, d = c + 1; idx.push(a, b, c, b, d, c); }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3)); g.setIndex(idx); g.computeVertexNormals();
  const mm = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 1, fog: false }); mm.onBeforeCompile = sh => { sh.fragmentShader = sh.fragmentShader.replace('#include <opaque_fragment>', 'outgoingLight = mix(outgoingLight, vec3(.52,.63,.80), .5);\n#include <opaque_fragment>'); }; scene.add(new THREE.Mesh(g, mm));
}

// ── cumulus: soft puffs in flat-bottomed heaps, lit from the sun's side ──
{
  const sunH = new THREE.Vector3(SUN_DIR.x, 0, SUN_DIR.z).normalize();
  for (let k = 0; k < 34; k++) { const a = -1.2 + rnd() * 2.2, dist = 2600 + rnd() * 6500, cx = Math.sin(a) * dist, cz = -Math.cos(a) * dist, cy = 380 + rnd() * 380 + dist * .05, size = 160 + rnd() * 260;
    const N = 40 + Math.floor(rnd() * 34); for (let i = 0; i < N; i++) { const u = rnd(), v = rnd(); const ox = (u - .5) * size * 2.2, oz = (v - .5) * size * 1.2, oy = Math.max(0, (1 - Math.hypot(ox / (size * 1.1), oz / (size * .6))) ) * size * (.6 + rnd() * .7);
      const t = sstep(0, size * .9, oy), side = (ox * sunH.x + oz * sunH.z) / size * .25;
      const c = new THREE.Color().setRGB(mix(.62, 1.35, t) + side * .25, mix(.68, 1.32, t) + side * .2, mix(.82, 1.26, t) + side * .1);
      const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: puffTex, color: c, transparent: true, depthWrite: false, fog: false, opacity: .9 }));
      STATS.puffs = (STATS.puffs || 0) + 1; sp.position.set(cx + ox, cy + oy, cz + oz); sp.scale.setScalar(size * (.42 + rnd() * .42)); scene.add(sp); } }
}

// ── post: bloom, a warm and cool grade, a vignette; ACES in the output pass ──
const comp = new EffectComposer(R); comp.setSize(W, H_);
comp.addPass(new RenderPass(scene, cam));
comp.addPass(new UnrealBloomPass(new THREE.Vector2(W, H_), .22, .6, .92));
comp.addPass(new ShaderPass({ uniforms: { tDiffuse: { value: null } }, vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }',
  fragmentShader: `uniform sampler2D tDiffuse; varying vec2 vUv;
    void main(){ vec3 c = texture2D(tDiffuse, vUv).rgb; float l = dot(c, vec3(.2126,.7152,.0722));
      c *= mix(vec3(.94,.98,1.06), vec3(1.06,1.0,.91), smoothstep(.02, .6, l));
      c = mix(vec3(l), c, 1.12);
      vec2 q = vUv - .5; c *= 1. - .32 * dot(q, q) * 2.;
      gl_FragColor = vec4(c, 1.); }` }));
comp.addPass(new OutputPass());

// ── drive ──
let yaw = 0, pitch = 0, drag = null; const base = cam.quaternion.clone();
addEventListener('pointerdown', e => drag = [e.clientX, e.clientY, yaw, pitch]); addEventListener('pointerup', () => drag = null);
addEventListener('pointermove', e => { if (!drag) return; yaw = drag[2] - (e.clientX - drag[0]) * .003; pitch = Math.max(-.6, Math.min(.5, drag[3] - (e.clientY - drag[1]) * .003)); });
addEventListener('resize', () => { if (STILL) return; cam.aspect = innerWidth / innerHeight; cam.updateProjectionMatrix(); R.setSize(innerWidth, innerHeight); comp.setSize(innerWidth, innerHeight); });
function frame(t) { WIND.value = 2.3 + (STILL ? 0 : t * .001); cam.quaternion.copy(base).multiply(new THREE.Quaternion().setFromEuler(new THREE.Euler(pitch, yaw, 0, 'YXZ'))); comp.render(); }
if (STILL) { frame(0); window.__done = true; } else { R.setAnimationLoop(frame); window.__done = true; }
