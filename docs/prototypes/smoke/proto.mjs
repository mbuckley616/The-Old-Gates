// Prototype (look builder, Session 337): chimney smoke that drifts on the world's wind (windDir, Session 330). Not in the game:
// this script writes a patched copy of the build (tests/tmp/smoke-proto.html) in which the detailed house records its chimney's
// top in the geometry and each settlement's addMesh keeps the chimney's world position, boots it, and draws the smoke there:
// one Points object for the town, two dozen puffs a chimney that rise, drift downwind, swell and fade (a soft round sprite, sized
// by distance, tinted by the hour). Run: node docs/prototypes/smoke/proto.mjs  →  docs/prototypes/smoke-*.png
import { boot } from '../../../tests/lib/game.mjs';
import fs from 'fs'; import path from 'path'; import { fileURLToPath } from 'url';
const here = path.dirname(fileURLToPath(import.meta.url)), ROOT = path.resolve(here, '..', '..', '..');
let src = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const sub = (a, b) => { if (!src.includes(a)) throw new Error('patch point gone: ' + a.slice(0, 60)); src = src.replace(a, b); };
sub('if(opts.chimney){const chx=w*.3*(r0()<.5?1:-1),chz=-d*.18;', 'var CHT=null;if(opts.chimney){const chx=w*.3*(r0()<.5?1:-1),chz=-d*.18;');
sub('add(new THREE.BoxGeometry(.7,.1,.7),stoneC,chx,yb+rise*.4+1.55,chz);}', 'add(new THREE.BoxGeometry(.7,.1,.7),stoneC,chx,yb+rise*.4+1.55,chz);CHT=[chx,yb+rise*.4+1.62,chz];}');
sub('g.userData.eaveLow=eaveLow;return g;}', 'g.userData.eaveLow=eaveLow;g.userData.chimney=CHT;return g;}');
sub('const m=new THREE.Mesh(geo,SETTLE_MAT);m.position.set(x,worldH(x,z)-.06,z);m.rotation.y=ry||0;m.castShadow=true;m.receiveShadow=true;group.add(m);',
  'const m=new THREE.Mesh(geo,SETTLE_MAT);m.position.set(x,worldH(x,z)-.06,z);m.rotation.y=ry||0;m.castShadow=true;m.receiveShadow=true;group.add(m);\n      if(geo.userData&&geo.userData.chimney){const q=geo.userData.chimney,c=Math.cos(m.rotation.y),s=Math.sin(m.rotation.y);(window.SMOKE_SRC=window.SMOKE_SRC||[]).push([m.position.x+q[0]*c+q[2]*s,m.position.y+q[1],m.position.z-q[0]*s+q[2]*c]);}');
const tmp = path.join(ROOT, 'tests', 'tmp'); fs.mkdirSync(tmp, { recursive: true });
const patched = path.join(tmp, 'smoke-proto.html'); fs.writeFileSync(patched, src);

const g = await boot({ src: patched }); const { page } = g;
await g.intoWorld(); await g.settle('dunmore');
const res = await page.evaluate(() => {
  for (let k = 0; k < 900 && (WORLD.jobs.length || [...WORLD.LOADED.values()].some(L => L.pending || !L.staticsBuilt)); k++) { WORLD.tick(1 / 60, performance.now()); while (WORLD.jobs.length) { const j = WORLD.jobs.shift(); let more = false; try { more = j.fn(); } catch (e) {} if (more) WORLD.jobs.push(j); } }
  const T = WORLD.siteAnywhere('dunmore'), srcs = (window.SMOKE_SRC || []).filter(p => Math.hypot(p[0] - T.x, p[2] - T.z) < 90);
  // the smoke: K puffs a chimney, each at its own phase of a life of L seconds
  const K = 24, L = 10, N = srcs.length * K, pos = new Float32Array(N * 3), size = new Float32Array(N), alpha = new Float32Array(N), seed = new Float32Array(N);
  for (let i = 0; i < N; i++) seed[i] = Math.random();
  const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(pos, 3)); geo.setAttribute('aSize', new THREE.BufferAttribute(size, 1)); geo.setAttribute('aAlpha', new THREE.BufferAttribute(alpha, 1));
  const cv = document.createElement('canvas'); cv.width = cv.height = 64; const cx = cv.getContext('2d');
  for (let k = 0; k < 5; k++) { const ox = 32 + (Math.random() - .5) * 18, oy = 32 + (Math.random() - .5) * 18, gr = cx.createRadialGradient(ox, oy, 0, ox, oy, 22); gr.addColorStop(0, 'rgba(255,255,255,.8)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); cx.fillStyle = gr; cx.fillRect(0, 0, 64, 64); }
  const mat = new THREE.ShaderMaterial({ transparent: true, depthWrite: false, fog: true,
    uniforms: THREE.UniformsUtils.merge([THREE.UniformsLib.fog, { map: { value: new THREE.CanvasTexture(cv) }, tint: { value: new THREE.Color(0xb8b4ae) }, scale: { value: 770 } }]),
    vertexShader: 'attribute float aSize;attribute float aAlpha;varying float vA;uniform float scale;\n#include <fog_pars_vertex>\nvoid main(){vA=aAlpha;vec4 mvPosition=modelViewMatrix*vec4(position,1.);gl_PointSize=aSize*scale/max(.1,-mvPosition.z);gl_Position=projectionMatrix*mvPosition;\n#include <fog_vertex>\n}',
    fragmentShader: 'uniform sampler2D map;uniform vec3 tint;varying float vA;\n#include <fog_pars_fragment>\nvoid main(){vec4 t=texture2D(map,gl_PointCoord);gl_FragColor=vec4(tint,t.a*vA);\n#include <fog_fragment>\n}' });
  // positions are kept relative to the town's centre (the world sits at x, z ≈ 13–25k: float32 on the GPU, see CLAUDE.md)
  const pts = new THREE.Points(geo, mat); pts.position.set(T.x, 0, T.z); pts.frustumCulled = false; WORLD.scene.add(pts);
  let clock = 0;
  const step = (dt) => { clock += dt; const w = WORLD.windDir(), wx = Math.sin(w), wz = Math.cos(w), storm = WORLD.wx.storm || 0, drift = .45 + 1.2 * storm;
    for (let c = 0; c < srcs.length; c++) { const [sx, sy, sz] = srcs[c];
      for (let k = 0; k < K; k++) { const i = c * K + k, a = ((clock / L + k / K + seed[i] * .05) % 1), t = a * L;
        const wob = Math.sin(t * 1.3 + seed[i] * 20) * .12 * a;
        pos[i * 3] = sx - T.x + wx * drift * Math.pow(t, 1.25) + wz * wob; pos[i * 3 + 1] = sy + .1 + .38 * t / (1 + drift * .4); pos[i * 3 + 2] = sz - T.z + wz * drift * Math.pow(t, 1.25) - wx * wob;
        size[i] = .5 + 2.8 * a; alpha[i] = Math.min(1, a * 6) * Math.pow(1 - a, 1.3) * .9; } }
    geo.attributes.position.needsUpdate = geo.attributes.aSize.needsUpdate = geo.attributes.aAlpha.needsUpdate = true; };
  const cvR = REN.domElement, W = cvR.width, H = cvR.height, TW = 640, TH = 360, cam = new THREE.PerspectiveCamera(50, W / H, .1, 600), tiles = [];
  const snap = (label, hour, pos, look, smoke) => { forceTime(hour); pts.visible = smoke; mat.uniforms.tint.value.set(hour > 19 || hour < 6 ? 0x4a4c56 : hour > 17 ? 0x9a8a84 : 0xb8b4ae);
    for (let i = 0; i < 40; i++) step(1 / 10);
    cam.position.set(...pos); cam.lookAt(...look); CAM.position.copy(cam.position); for (let i = 0; i < 3; i++) WORLD.tick(1 / 60, performance.now()); WORLD.scene.updateMatrixWorld(true);
    REN.render(WORLD.scene, cam); const c = document.createElement('canvas'); c.width = TW; c.height = TH; const x = c.getContext('2d'); x.drawImage(cvR, 0, 0, W, H, 0, 0, TW, TH);
    x.fillStyle = '#000a'; x.fillRect(0, 0, 330, 28); x.fillStyle = '#fff'; x.font = 'bold 17px serif'; x.fillText(label, 8, 20); tiles.push(c); };
  // the vantage: 70 units out from the centre, up the hill, looking over the roofs
  const va = 2.3, vx = T.x + Math.sin(va) * 70, vz = T.z + Math.cos(va) * 70, vy = WORLD.worldH(vx, vz) + 14, look = [T.x, WORLD.worldH(T.x, T.z) + 3, T.z];
  const mid = srcs.reduce((b, p) => Math.hypot(p[0] - T.x, p[2] - T.z) < Math.hypot(b[0] - T.x, b[2] - T.z) ? p : b, srcs[0] || [T.x, 0, T.z]);
  const nx = mid[0] + Math.sin(va) * 14, nz = mid[2] + Math.cos(va) * 14, near = [nx, WORLD.worldH(nx, nz) + 2.2, nz], nlook = [mid[0], mid[1] + 1.5, mid[2]];
  const t0 = worldState.gameTimeAbsMinutes;
  snap('today, noon', 12, [vx, vy, vz], look, false);
  snap('smoke, noon', 12, [vx, vy, vz], look, true);
  worldState.gameTimeAbsMinutes = t0 + 60 * 20; snap('smoke, the wind turned (20 h on)', 12, [vx, vy, vz], look, true);
  worldState.gameTimeAbsMinutes = t0; snap('smoke, dusk', 18.5, [vx, vy, vz], look, true);
  snap('smoke, close by a house', 10, near, nlook, true);
  WORLD.wx.storm = 1; snap('smoke, in a storm', 10, near, nlook, true); WORLD.wx.storm = 0;
  const out = document.createElement('canvas'); out.width = TW * 2; out.height = TH * 3; const o = out.getContext('2d'); tiles.forEach((c, i) => o.drawImage(c, (i % 2) * TW, Math.floor(i / 2) * TH));
  return { png: out.toDataURL(), chimneys: srcs.length, puffs: N, wind: [WORLD.windDir()] };
});
fs.writeFileSync(path.join(ROOT, 'docs', 'prototypes', 'smoke-dunmore.png'), Buffer.from(res.png.split(',')[1], 'base64'));
console.log(JSON.stringify({ chimneys: res.chimneys, puffs: res.puffs, wind: res.wind }));
if (g.errs.length) console.log('page errors', g.errs);
await g.close();
