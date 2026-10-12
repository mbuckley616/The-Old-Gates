// The old gate (Session 769). ?view=gate: the concentric rings coming out of a hillside at dusk (OG-037, V1), with a
// camp at its foot. ?view=hall: inside, the dark look Michael keeps for the gates (12 Oct): a hall of ring arches,
// amber sigils, wet flagstones, a shaft of cold light, the shaft empty.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { Q, W, H, STILL, STATS, rnd, fbm, sstep, makeRenderer, makeComposer, buildTextures, TEX, mat, worldUV, skyDome, clouds, treeKit, run, WIND, windVS } from './common.js';

const VIEW = Q.get('view') || 'gate';
const R = makeRenderer(VIEW === 'hall' ? 1.0 : .9);
const scene = new THREE.Scene();
const cam = new THREE.PerspectiveCamera(VIEW === 'hall' ? 60 : 50, W / H, .1, 30000);
buildTextures();

// the Weaver script: a strip of sigils drawn on a canvas, lit amber
function glyphTex() {
  const c = document.createElement('canvas'); c.width = 2048; c.height = 64; const x = c.getContext('2d'); x.clearRect(0, 0, 2048, 64); x.strokeStyle = '#fff'; x.fillStyle = '#fff'; x.lineCap = 'round';
  for (let i = 0; i < 40; i++) { const cx = 25 + i * 51, k = Math.floor(rnd() * 6); x.lineWidth = 4; x.beginPath();
    if (k === 0) { x.arc(cx, 32, 12, 0, Math.PI * 2); x.moveTo(cx, 14); x.lineTo(cx, 50); }
    else if (k === 1) { x.moveTo(cx - 12, 50); x.lineTo(cx, 14); x.lineTo(cx + 12, 50); x.moveTo(cx - 7, 36); x.lineTo(cx + 7, 36); }
    else if (k === 2) { x.arc(cx, 32, 13, Math.PI * .2, Math.PI * 1.8); x.moveTo(cx + 2, 32); x.arc(cx, 32, 2, 0, 7); }
    else if (k === 3) { x.moveTo(cx - 12, 18); x.lineTo(cx + 12, 18); x.moveTo(cx, 18); x.lineTo(cx, 50); x.moveTo(cx - 8, 34); x.lineTo(cx + 8, 42); }
    else if (k === 4) { x.moveTo(cx - 12, 32); x.lineTo(cx, 16); x.lineTo(cx + 12, 32); x.lineTo(cx, 48); x.closePath(); }
    else { x.moveTo(cx - 10, 16); x.lineTo(cx - 10, 48); x.moveTo(cx + 10, 16); x.lineTo(cx + 10, 48); x.moveTo(cx - 10, 32); x.lineTo(cx + 10, 32); } x.stroke(); }
  const t = new THREE.CanvasTexture(c); t.wrapS = THREE.RepeatWrapping; t.anisotropy = 8; return t;
}
// a thick ring: a rounded rectangle turned about the z axis
function ringGeo(Ri, Ro, t, seg = 96, phi = Math.PI * 2, start = 0) {
  const p = [], c = .18; p.push(new THREE.Vector2(Ri + c, -t), new THREE.Vector2(Ro - c, -t), new THREE.Vector2(Ro, -t + c), new THREE.Vector2(Ro, t - c), new THREE.Vector2(Ro - c, t), new THREE.Vector2(Ri + c, t), new THREE.Vector2(Ri, t - c), new THREE.Vector2(Ri, -t + c), new THREE.Vector2(Ri + c, -t));
  const g = new THREE.LatheGeometry(p, seg, start, phi); g.rotateX(Math.PI / 2); g.computeVertexNormals(); return g;
}
// a strip of glyphs on a ring's face, with polar UVs
function glyphRing(Rm, wdt, z, tex, rep, seg = 192) {
  const pos = [], uv = [], idx = []; for (let i = 0; i <= seg; i++) { const a = i / seg * Math.PI * 2, c = Math.cos(a), s = Math.sin(a); pos.push(c * (Rm - wdt / 2), s * (Rm - wdt / 2), z, c * (Rm + wdt / 2), s * (Rm + wdt / 2), z); uv.push(i / seg * rep, 0, i / seg * rep, 1); if (i < seg) { const k = i * 2; idx.push(k, k + 1, k + 2, k + 1, k + 3, k + 2); } }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx); g.computeVertexNormals(); return g;
}
const GLYPH = glyphTex();
const sigilMat = (k = 3.2) => new THREE.MeshStandardMaterial({ color: 0x000000, emissive: new THREE.Color(1.0, .58, .2), emissiveIntensity: k, emissiveMap: GLYPH, alphaMap: GLYPH, transparent: true, depthWrite: false, roughness: 1 });
function fire(x, y, z, s = 1) {
  const c = document.createElement('canvas'); c.width = c.height = 64; const k = c.getContext('2d'), g = k.createRadialGradient(32, 40, 2, 32, 36, 30); g.addColorStop(0, 'rgba(255,240,200,1)'); g.addColorStop(.35, 'rgba(255,150,40,.9)'); g.addColorStop(1, 'rgba(255,60,0,0)'); k.fillStyle = g; k.fillRect(0, 0, 64, 64);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  for (let i = 0; i < 14; i++) { const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: t, color: new THREE.Color(2.4, 1.6, .9), blending: THREE.AdditiveBlending, depthWrite: false, transparent: true }));
    sp.position.set(x + (rnd() - .5) * .35 * s, y + .15 + rnd() * .7 * s, z + (rnd() - .5) * .35 * s); sp.scale.set(.55 * s * (1 - (sp.position.y - y) / (1.2 * s)), .9 * s, 1); scene.add(sp); }
  const L = new THREE.PointLight(new THREE.Color(1, .55, .22), 26 * s, 22 * s, 2); L.position.set(x, y + .7 * s, z); L.castShadow = true; L.shadow.mapSize.set(1024, 1024); L.shadow.bias = -.002; scene.add(L); return L;
}

if (VIEW === 'gate') buildGate(); else buildHall();

function buildGate() {
  // dusk: a low orange sun behind the camera's left, a deepening sky
  const SUN = new THREE.Vector3(-.62, .1, .78).normalize();
  scene.fog = new THREE.FogExp2(new THREE.Color(.42, .38, .46), .0065);
  skyDome(scene, SUN, { zen: [.04, .08, .22], mid: [.22, .26, .46], hor: [.95, .60, .38], glow: [1, .55, .25], glowK: .8, k: 1.0 });
  clouds(scene, SUN, { n: 18, d0: 1500, dw: 4000, y0: 300, lo: [.30, .26, .36], hi: [1.2, .72, .5], op: .8, a0: -1.5, aw: 3 });
  const sun = new THREE.DirectionalLight(new THREE.Color(1, .62, .36), 2.6); sun.position.copy(SUN).multiplyScalar(80); sun.castShadow = true; sun.shadow.mapSize.set(4096, 4096); Object.assign(sun.shadow.camera, { left: -45, right: 45, top: 45, bottom: -45, near: 1, far: 260 }); sun.shadow.bias = -.0004; sun.shadow.normalBias = .05;
  scene.add(sun, new THREE.HemisphereLight(new THREE.Color(.36, .40, .62), new THREE.Color(.22, .17, .14), .9));
  // the hillside the gate comes out of
  const gy = (x, z) => 15 * sstep(4, -34, z + .012 * x * x) + 1.3 * fbm(x / 14, z / 14, 4) + 30 * sstep(-30, -120, z) * (fbm(x / 80, z / 80, 3) + .7) - .02 * Math.max(0, z - 4) * 0;
  { const g = new THREE.PlaneGeometry(700, 700, 350, 350); g.rotateX(-Math.PI / 2); const P = g.attributes.position; for (let i = 0; i < P.count; i++) { const x = P.getX(i), z = P.getZ(i) - 100; P.setXYZ(i, x, gy(x, z), z); } g.computeVertexNormals();
    const m = new THREE.MeshStandardMaterial({ roughness: .95 }); m.onBeforeCompile = s => { s.vertexShader = 'varying vec3 vW; varying vec3 vNw;\n' + s.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\n vW = (modelMatrix * vec4(position,1.)).xyz; vNw = normal;');
      s.fragmentShader = 'varying vec3 vW; varying vec3 vNw;\nfloat h1(vec2 p){ p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }\nfloat v1(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f); return mix(mix(h1(i), h1(i + vec2(1,0)), f.x), mix(h1(i + vec2(0,1)), h1(i + vec2(1,1)), f.x), f.y); }\nfloat f1(vec2 p){ float a = 0., m = .5; for (int i = 0; i < 5; i++) { a += m * v1(p); p = p * 2.03 + 17.1; m *= .5; } return a; }\n'
        + s.fragmentShader.replace('vec4 diffuseColor = vec4( diffuse, opacity );', `float n1 = f1(vW.xz / 7.), n2 = f1(vW.xz * 1.5); vec3 c = mix(vec3(.18,.30,.09), vec3(.36,.44,.14), n1) * (.8 + .35 * n2);
          float rock = smoothstep(.45, .7, 1. - vNw.y + (n1 - .5) * .3); c = mix(c, mix(vec3(.36,.34,.30), vec3(.5,.48,.42), n2), rock);
          float path = (1. - smoothstep(.9, 1.6, abs(vW.x + sin(vW.z * .15) * .8))) * step(0., vW.z) * step(vW.z, 26.); c = mix(c, mix(vec3(.38,.32,.24), vec3(.48,.42,.32), n2), path * .9);
          vec4 diffuseColor = vec4(c, opacity);`); };
    const t = new THREE.Mesh(g, m); t.receiveShadow = true; scene.add(t); }
  // the rings: four, each set deeper into the hill, the stone lichened; sigils lit on their faces
  const stone = mat('lichen', { ns: 1.4, rough: .92 }); const cy = 3.2, glow = [];
  for (let k = 0; k < 4; k++) { const Ro = 8.6 - k * 1.65, Ri = Ro - 1.25, t = .85, z = -k * 1.9; const g = ringGeo(Ri, Ro, t); worldUV(g, .32); const m = new THREE.Mesh(g, stone); m.position.set(0, cy, z); m.castShadow = m.receiveShadow = true; scene.add(m);
    const gr = new THREE.Mesh(glyphRing((Ri + Ro) / 2, .78, t + .012, GLYPH, Math.max(2, Math.round(Ro * .55))), sigilMat(k === 0 ? 2.2 : 3.0)); gr.position.set(0, cy, z); scene.add(gr); glow.push(gr); }
  // the face of the innermost ring: a disc of dressed stone with a slit, amber light behind it
  { const Rd = 8.6 - 3 * 1.65 - 1.25 + .05, sh = new THREE.Shape(); sh.absarc(0, 0, Rd, 0, Math.PI * 2, false); const hole = new THREE.Path(); const sw = .55, sb = -cy + .1, st = 1.6; hole.moveTo(-sw, sb); hole.lineTo(sw, sb); hole.lineTo(sw * .7, st); hole.lineTo(0, st + .5); hole.lineTo(-sw * .7, st); hole.lineTo(-sw, sb); sh.holes.push(hole);
    const dg = new THREE.ExtrudeGeometry(sh, { depth: .6, bevelEnabled: false, curveSegments: 48 }); worldUV(dg, .32); const d = new THREE.Mesh(dg, stone); d.position.set(0, cy, -3 * 1.9 - .6); d.castShadow = d.receiveShadow = true; scene.add(d);
    const inner = new THREE.Mesh(new THREE.BoxGeometry(2.4, 6, 4), new THREE.MeshStandardMaterial({ color: 0x050403, emissive: new THREE.Color(1, .5, .15), emissiveIntensity: 1.6, side: THREE.BackSide })); inner.position.set(0, 2, -3 * 1.9 - 2.8); scene.add(inner);
    const L = new THREE.PointLight(new THREE.Color(1, .55, .2), 14, 14, 2); L.position.set(0, 1.4, -3 * 1.9 - 1.2); scene.add(L); }
  // fallen stones at the foot of the rings
  { const rg = new THREE.DodecahedronGeometry(.5, 1); for (let i = 0; i < 26; i++) { const a = rnd() * Math.PI, r = 8.6 + rnd() * 3, x = Math.cos(a) * r * (rnd() < .5 ? -1 : 1), z = 1.5 + rnd() * 4; const m = new THREE.Mesh(rg, stone); m.position.set(x, gy(x, z) + .1, z); m.scale.set(.6 + rnd() * 1.4, .4 + rnd() * .7, .6 + rnd()); m.rotation.set(rnd(), rnd() * 6, rnd()); m.castShadow = m.receiveShadow = true; scene.add(m); } }
  // the camp: two tents, a fire in a ring of stones, crates, a banner of the Crown
  const tent = (x, z, ry, s = 1) => { const sh = new THREE.Shape([new THREE.Vector2(-1.5, 0), new THREE.Vector2(1.5, 0), new THREE.Vector2(0, 2.1)]); const g = new THREE.ExtrudeGeometry(sh, { depth: 3, bevelEnabled: false }); g.translate(0, 0, -1.5);
    const cv = new THREE.MeshStandardMaterial({ color: new THREE.Color(.60, .50, .36), roughness: 1, side: THREE.DoubleSide }); const m = new THREE.Mesh(g, cv); m.position.set(x, gy(x, z) - .05, z); m.rotation.y = ry; m.scale.setScalar(s); m.castShadow = m.receiveShadow = true; scene.add(m);
  };
  tent(-6.8, 12.5, .12); tent(6.6, 14.5, -.18, .9);
  const fx = .6, fz = 13.5, fy = gy(fx, fz); { const sg = new THREE.DodecahedronGeometry(.18, 0); for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2, m = new THREE.Mesh(sg, stone); m.position.set(fx + Math.cos(a) * .75, fy + .08, fz + Math.sin(a) * .75); m.rotation.set(rnd(), rnd(), rnd()); scene.add(m); }
    for (let i = 0; i < 4; i++) { const l = new THREE.Mesh(new THREE.CylinderGeometry(.08, .08, 1.0, 6), new THREE.MeshStandardMaterial({ color: 0x2a1a10, roughness: 1 })); l.position.set(fx, fy + .15, fz); l.rotation.set(Math.PI / 2 - .5, i * Math.PI / 2, 0); scene.add(l); } }
  fire(fx, fy, fz, 1.1);
  for (const [x, z] of [[-3.8, 16], [-3.1, 16.4]]) { const b = new THREE.BoxGeometry(.7, .7, .7); worldUV(b, 1.3); const m = new THREE.Mesh(b, mat('wood')); m.position.set(x, gy(x, z) + .35, z); m.rotation.y = rnd(); m.castShadow = true; scene.add(m); }
  { const x = 9.5, z = 10.5, y = gy(x, z); const pole = new THREE.Mesh(new THREE.CylinderGeometry(.05, .06, 4.2, 8), mat('wood')); pole.position.set(x, y + 2.1, z); scene.add(pole);
    const fg = new THREE.PlaneGeometry(.8, 1.4, 6, 8); { const a = fg.attributes.position; for (let i = 0; i < a.count; i++) a.setZ(i, Math.sin(a.getY(i) * 4 + a.getX(i) * 5) * .05); fg.computeVertexNormals(); }
    const f = new THREE.Mesh(fg, new THREE.MeshStandardMaterial({ color: new THREE.Color(.55, .06, .05), side: THREE.DoubleSide, roughness: .85 })); f.position.set(x + .42, y + 3.35, z); f.castShadow = true; scene.add(f); }
  // grass, wildflowers, trees on the hill
  { const seg = 3, posA = [], colA = [], idx = []; for (let k = 0; k <= seg; k++) { const t = k / seg, w = .06 * (1 - t); posA.push(-w, t, 0, w, t, 0); const c = [.07 + .26 * t, .14 + .34 * t, .04 + .1 * t]; colA.push(...c, ...c); } for (let k = 0; k < seg; k++) { const a = k * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
    const bg = new THREE.BufferGeometry(); bg.setAttribute('position', new THREE.Float32BufferAttribute(posA, 3)); bg.setAttribute('color', new THREE.Float32BufferAttribute(colA, 3)); bg.setAttribute('normal', new THREE.Float32BufferAttribute(new Array(posA.length / 3).fill(0).flatMap(() => [0, 1, 0]), 3)); bg.setIndex(idx);
    const gm = new THREE.MeshStandardMaterial({ vertexColors: true, side: THREE.DoubleSide, roughness: .8 }); gm.onBeforeCompile = s => { s.uniforms.uWind = WIND; s.vertexShader = 'uniform float uWind;\n' + s.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>' + windVS(.18, 1.4)); s.fragmentShader = s.fragmentShader.replace('#include <normal_fragment_begin>', '#include <normal_fragment_begin>\n normal = normalize(vNormal);'); };
    const N = 110000, gr = new THREE.InstancedMesh(bg, gm, N), Mx = new THREE.Matrix4(), q = new THREE.Quaternion(), s = new THREE.Vector3(), p = new THREE.Vector3(), up = new THREE.Vector3(0, 1, 0); let n = 0;
    while (n < N) { const x = (rnd() - .5) * 60, z = 30 - rnd() * 50; if (Math.abs(x + Math.sin(z * .15) * .8) < 1.3 && z > 0) continue; if (Math.hypot(x, z) < 9.2 && z < 2) continue; if (Math.hypot(x - fx, z - fz) < 1.2) continue; p.set(x, gy(x, z) - .02, z); q.setFromAxisAngle(up, rnd() * 6.3); s.set(1.2, .3 + rnd() * .5, 1); Mx.compose(p, q, s); gr.setMatrixAt(n++, Mx); }
    gr.receiveShadow = true; scene.add(gr); }
  const trees = treeKit(SUN), tl = []; for (let i = 0; i < 220; i++) { const x = (rnd() - .5) * 240, z = -6 - rnd() * 200; if (Math.abs(x) < 13 && z > -16) continue; tl.push([x, gy(x, z), z, .8 + rnd() * .6, rnd() * 6.3, new THREE.Color(.7 + .15 * rnd(), .82 + .1 * rnd(), .55)]); }
  tl.push([-15, gy(-15, 6), 6, 1.3, 1], [16, gy(16, 2), 2, 1.2, 2]); trees.plant(scene, tl);
  // fireflies over the grass
  { const N = 70, g = new THREE.BufferGeometry(), a = []; for (let i = 0; i < N; i++) { const x = (rnd() - .5) * 22, z = 4 + rnd() * 16; a.push(x, gy(x, z) + .5 + rnd() * 1.6, z); } g.setAttribute('position', new THREE.Float32BufferAttribute(a, 3));
    scene.add(new THREE.Points(g, new THREE.PointsMaterial({ color: new THREE.Color(2.2, 2.0, .9), size: .06, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false }))); }
  cam.position.set(5.5, gy(5.5, 25) + 1.7, 25); cam.lookAt(-.3, 3.6, -1);
  const comp = makeComposer(R, scene, cam, { bloom: .55, bloomR: .5, bloomT: .75, warm: [1.08, .98, .9], cool: [.9, .95, 1.08], sat: 1.08, vig: .42 });
  run(comp, cam);
}

function buildHall() {
  scene.background = new THREE.Color(.004, .005, .008); scene.fog = new THREE.FogExp2(new THREE.Color(.012, .016, .024), .055);
  const stone = mat('stone', { ns: 1.6, rough: .85 }); stone.color.setRGB(.62, .62, .66);
  const ringStone = mat('lichen', { ns: 1.6, rough: .85 }); ringStone.color.setRGB(.55, .56, .6);
  // the floor: flagstones, wet in patches (low roughness where the noise is high)
  const fm = mat('flag', { ns: 1.4, rough: .5 }); fm.color.setRGB(.6, .6, .64);
  fm.onBeforeCompile = s => { s.vertexShader = 'varying vec3 vW;\n' + s.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\n vW = (modelMatrix * vec4(position,1.)).xyz;');
    s.fragmentShader = 'varying vec3 vW;\nfloat h1(vec2 p){ p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }\nfloat v1(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f); return mix(mix(h1(i), h1(i + vec2(1,0)), f.x), mix(h1(i + vec2(0,1)), h1(i + vec2(1,1)), f.x), f.y); }\n'
      + s.fragmentShader.replace('#include <roughnessmap_fragment>', '#include <roughnessmap_fragment>\n float wet = smoothstep(.52, .62, v1(vW.xz * .35) * .7 + v1(vW.xz * 1.3) * .3); roughnessFactor = mix(roughnessFactor, .04, wet);')
        .replace('#include <map_fragment>', '#include <map_fragment>\n diffuseColor.rgb *= mix(1., .45, smoothstep(.52, .62, v1(vW.xz * .35) * .7 + v1(vW.xz * 1.3) * .3));'); };
  const L = 60, Wd = 9;
  { const g = new THREE.PlaneGeometry(Wd, L, 1, 1); g.rotateX(-Math.PI / 2); g.translate(0, 0, -L / 2 + 8); worldUV(g, .34); const m = new THREE.Mesh(g, fm); m.receiveShadow = true; scene.add(m); }
  // walls and the vault
  for (const sx of [-1, 1]) { const g = new THREE.BoxGeometry(1, 5, L); worldUV(g, .3); const m = new THREE.Mesh(g, stone); m.position.set(sx * (Wd / 2 + .5), 2.5, -L / 2 + 8); m.receiveShadow = m.castShadow = true; scene.add(m); }
  { const g = new THREE.CylinderGeometry(Wd / 2 + .1, Wd / 2 + .1, L, 32, 1, true, -Math.PI / 2, Math.PI); g.rotateX(-Math.PI / 2); worldUV(g, .3); const m = new THREE.Mesh(g, stone); m.material = stone.clone(); m.material.side = THREE.BackSide; m.position.set(0, 5, -L / 2 + 8); m.receiveShadow = true; scene.add(m); }
  // the ring arches: each a ring set into the walls and floor, with its sigils; the far ones dim (a failing gate flickers)
  for (let k = 0; k < 8; k++) { const z = 2 - k * 6.5, Ro = 5.05, Ri = 3.95, t = .6; const g = ringGeo(Ri, Ro, t, 96); worldUV(g, .3); const m = new THREE.Mesh(g, ringStone); m.position.set(0, 3.2, z); m.castShadow = m.receiveShadow = true; scene.add(m);
    const gr = new THREE.Mesh(glyphRing((Ri + Ro) / 2, .62, t + .012, GLYPH, 3), sigilMat(k === 3 ? .6 : (2.4 - k * .22))); gr.position.set(0, 3.2, z); scene.add(gr);
    const gl = new THREE.PointLight(new THREE.Color(1, .5, .16), 2.2, 7, 2); gl.position.set(0, 3.2 + 4.5, z + .9); scene.add(gl); }
  // the shaft of cold light from a cleft in the vault, with dust in it
  const SZ = -17;
  { const sp = new THREE.SpotLight(new THREE.Color(.62, .76, 1), 900, 30, .26, .55, 1.6); sp.position.set(1.2, 14, SZ - 2.2); sp.target.position.set(0, 0, SZ); sp.castShadow = true; sp.shadow.mapSize.set(2048, 2048); sp.shadow.bias = -.0005; scene.add(sp, sp.target);
    const cg = new THREE.CylinderGeometry(.9, 2.1, 13, 32, 1, true); cg.translate(0, 6.5, 0); const cm = new THREE.ShaderMaterial({ transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, uniforms: { uC: { value: new THREE.Color(.5, .62, .85) } },
      vertexShader: 'varying vec3 vN; varying vec3 vV; varying float vY; void main(){ vec4 w = modelMatrix * vec4(position,1.); vN = normalize(mat3(modelMatrix) * normal); vV = normalize(cameraPosition - w.xyz); vY = position.y; gl_Position = projectionMatrix * viewMatrix * w; }',
      fragmentShader: 'uniform vec3 uC; varying vec3 vN; varying vec3 vV; varying float vY; void main(){ float f = pow(abs(dot(normalize(vN), normalize(vV))), 2.); float h = smoothstep(0., 2.5, vY) * smoothstep(13., 6., vY); gl_FragColor = vec4(uC * f * h * .32, 1.); }' });
    const cone = new THREE.Mesh(cg, cm); cone.position.set(.55, 0, SZ - 1.0); cone.rotation.z = .08; cone.rotation.x = -.12; scene.add(cone);
    const N = 400, g = new THREE.BufferGeometry(), a = []; for (let i = 0; i < N; i++) { const y = rnd() * 9, r = (1 + y * .1) * Math.sqrt(rnd()), th = rnd() * 6.3; a.push(Math.cos(th) * r + .5, y + .3, SZ - 1 + Math.sin(th) * r); } g.setAttribute('position', new THREE.Float32BufferAttribute(a, 3));
    scene.add(new THREE.Points(g, new THREE.PointsMaterial({ color: new THREE.Color(.9, 1.0, 1.2), size: .03, transparent: true, opacity: .8, blending: THREE.AdditiveBlending, depthWrite: false })));
    // the cleft itself
    const cl = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 3.6), new THREE.MeshBasicMaterial({ color: new THREE.Color(.55, .7, 1).multiplyScalar(2.2) })); cl.rotation.x = Math.PI / 2; cl.position.set(1.1, 9.45, SZ - 2.0); scene.add(cl); }
  // a brazier on the left, rubble and bones
  { const bx = -3.4, bz = -8; const bowl = new THREE.Mesh(new THREE.CylinderGeometry(.45, .25, .4, 16, 1, true), new THREE.MeshStandardMaterial({ color: 0x1a1612, metalness: .6, roughness: .5, side: THREE.DoubleSide })); bowl.position.set(bx, 1.2, bz); scene.add(bowl);
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(.05, .08, 1.1, 6), bowl.material); leg.position.set(bx, .55, bz); scene.add(leg); fire(bx, 1.25, bz, .55); }
  { const rg = new THREE.DodecahedronGeometry(.35, 1); for (let i = 0; i < 40; i++) { const x = (rnd() < .5 ? -1 : 1) * (3.2 + rnd() * 1.2), z = 4 - rnd() * 46; const m = new THREE.Mesh(rg, stone); m.position.set(x, .12, z); m.scale.set(.5 + rnd(), .3 + rnd() * .6, .5 + rnd()); m.rotation.set(rnd(), rnd() * 6, rnd()); m.castShadow = m.receiveShadow = true; scene.add(m); }
    const bm = new THREE.MeshStandardMaterial({ color: new THREE.Color(.78, .74, .64), roughness: .7 }); for (let i = 0; i < 26; i++) { const b = new THREE.Mesh(new THREE.CylinderGeometry(.03, .04, .45 + rnd() * .3, 6), bm); b.position.set((rnd() - .5) * 6, .04, -10 - rnd() * 14); b.rotation.set(Math.PI / 2, rnd() * 6, 0); b.castShadow = true; scene.add(b); }
    const pg = new THREE.CylinderGeometry(.75, .85, 3.2, 12); worldUV(pg, .3); const pil = new THREE.Mesh(pg, ringStone); pil.position.set(2.9, .6, -24); pil.rotation.set(1.2, .4, .2); pil.castShadow = pil.receiveShadow = true; scene.add(pil); }
  // the carried torch: the only warm light near the camera
  const tl = new THREE.PointLight(new THREE.Color(1, .6, .3), 22, 15, 2); tl.position.set(-.7, 1.75, 4.6); tl.castShadow = true; tl.shadow.mapSize.set(1024, 1024); tl.shadow.bias = -.003; scene.add(tl);
  scene.add(new THREE.HemisphereLight(new THREE.Color(.16, .2, .3), new THREE.Color(.04, .03, .02), .25));
  cam.position.set(.3, 1.65, 6); cam.lookAt(0, 1.7, -20);
  const comp = makeComposer(R, scene, cam, { bloom: .75, bloomR: .55, bloomT: .55, cool: [.86, .95, 1.14], warm: [1.08, .97, .86], sat: 1.0, vig: .6 });
  run(comp, cam);
}
