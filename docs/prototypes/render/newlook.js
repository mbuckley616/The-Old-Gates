// The render pipeline prototype (Session 768): the same scene, the same meshes, drawn three ways.
//   NEWLOOK.render(scene, cam, 'today')    the game as it draws now (Lambert in sRGB numbers, no post).
//   NEWLOOK.render(scene, cam, 'modern')   colour handled in linear light, ACES tone mapping, less flat fill and a
//                                          stronger sun, ambient occlusion, bloom, distance haze, a warm/cool grade.
//   NEWLOOK.render(scene, cam, 'smooth')   'modern' with soft shapes: auto-smoothed normals (no new geometry).
//   NEWLOOK.render(scene, cam, 'painted')  'smooth' plus a Kuwahara filter (flat strokes that keep their edges),
//                                          toward the painterly concept art.
// Nothing in the game is changed: every colour, light and texture touched for a render is put back after it.
// Plain script for three.js r128, no addons (the CDN's examples are not reachable from the test box).
(function () {
  const S2L = v => v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  let saved = null;
  // Auto-smooth (as in Blender): a vertex's normal averages the faces around its position that meet it at under ~50
  // degrees, so an icosphere crown or a rock goes round while a box keeps its edges. Cached per geometry.
  const SMOOTH = new WeakMap();
  // Returns {n, nb}: the smoothed normals, and for each vertex the list of vertices it blends with (same place, faces
  // under ~50 degrees apart), so the per-corner colour jitter of mergeParts can be blended the same way.
  function smoothNormals(g) {
    if (SMOOTH.has(g)) return SMOOTH.get(g);
    const P = g.attributes.position, N = g.attributes.normal; if (!P || !N || P.count > 1500000) { SMOOTH.set(g, null); return null; }
    const idx = g.index ? g.index.array : null, nTri = Math.floor((idx ? idx.length : P.count) / 3), fn = new Float32Array(nTri * 3), vOf = i => idx ? idx[i] : i;
    const a = new THREE.Vector3(), b = new THREE.Vector3(), c = new THREE.Vector3(), key = new Map(), triOfV = new Int32Array(P.count).fill(-1), kOf = new Array(P.count);
    for (let t = 0; t < nTri; t++) { a.fromBufferAttribute(P, vOf(t * 3)); b.fromBufferAttribute(P, vOf(t * 3 + 1)); c.fromBufferAttribute(P, vOf(t * 3 + 2));
      c.sub(b); a.sub(b); c.cross(a); const l = c.length() || 1; fn[t * 3] = c.x / l; fn[t * 3 + 1] = c.y / l; fn[t * 3 + 2] = c.z / l;
      for (let k = 0; k < 3; k++) { const v = vOf(t * 3 + k); if (triOfV[v] >= 0) continue; triOfV[v] = t;
        const q = Math.round(P.getX(v) * 500) + ',' + Math.round(P.getY(v) * 500) + ',' + Math.round(P.getZ(v) * 500); kOf[v] = q; let L = key.get(q); if (!L) key.set(q, L = []); L.push(v); } }
    const out = new Float32Array(N.array.length), nb = new Array(P.count);
    for (let v = 0; v < P.count; v++) { const t = triOfV[v]; if (t < 0) { out[v * 3] = N.getX(v); out[v * 3 + 1] = N.getY(v); out[v * 3 + 2] = N.getZ(v); continue; }
      let x = 0, y = 0, z = 0; const L = [];
      for (const u of key.get(kOf[v])) { const s2 = triOfV[u]; const d = fn[s2 * 3] * fn[t * 3] + fn[s2 * 3 + 1] * fn[t * 3 + 1] + fn[s2 * 3 + 2] * fn[t * 3 + 2]; if (d > .64) { x += fn[s2 * 3]; y += fn[s2 * 3 + 1]; z += fn[s2 * 3 + 2]; L.push(u); } }
      const l = Math.hypot(x, y, z) || 1; out[v * 3] = x / l; out[v * 3 + 1] = y / l; out[v * 3 + 2] = z / l; nb[v] = L; }
    const r = { n: out, nb }; SMOOTH.set(g, r); return r;
  }
  function linearize(scene, look) {
    saved = { mats: [], attrs: [], tex: [], lights: [], fog: null, bg: null, geos: new Map() };
    const mseen = new Set(), aseen = new Set(), tseen = new Set();
    const attr = a => {
      if (!a || aseen.has(a)) return; aseen.add(a); saved.attrs.push([a, a.array.slice()]);
      const arr = a.array, isF = arr instanceof Float32Array || arr instanceof Float64Array, max = isF ? 1 : (arr instanceof Uint16Array ? 65535 : 255);
      for (let i = 0; i < arr.length; i++) { const v = arr[i] / max; arr[i] = isF ? S2L(v) : Math.round(S2L(v) * max); }
      a.needsUpdate = true;
    };
    scene.traverse(o => {
      if (o.isLight) {
        saved.lights.push([o, o.color.clone(), o.groundColor ? o.groundColor.clone() : null, o.intensity]);
        o.color.convertSRGBToLinear(); if (o.groundColor) o.groundColor.convertSRGBToLinear();
        // Less flat fill, more sun: form reads from light and shade, not from a uniform wash.
        if (o.isAmbientLight) o.intensity *= look.amb;
        else if (o.isHemisphereLight) o.intensity *= look.hemi;
        else if (o.isDirectionalLight) o.intensity *= look.sun;
        else if (o.isPointLight || o.isSpotLight) o.intensity *= look.point;
      }
      const ms = o.material ? (Array.isArray(o.material) ? o.material : [o.material]) : [];
      for (const m of ms) {
        if (mseen.has(m)) continue; mseen.add(m);
        saved.mats.push([m, m.color ? m.color.clone() : null, m.emissive ? m.emissive.clone() : null]);
        if (m.color) m.color.convertSRGBToLinear(); if (m.emissive) m.emissive.convertSRGBToLinear();
        for (const k of ['map', 'emissiveMap']) { const t = m[k]; if (t && !tseen.has(t)) { tseen.add(t); saved.tex.push([t, t.encoding]); t.encoding = THREE.sRGBEncoding; t.needsUpdate = true; } }
        m.needsUpdate = true;
      }
      if (o.geometry && o.geometry.attributes) attr(o.geometry.attributes.color);
      if (look.smooth && (o.isMesh || o.isInstancedMesh) && !o.isSkinnedMesh && o.geometry && !saved.geos.has(o.geometry)) { const g = o.geometry, sn = smoothNormals(g);
        if (sn) { saved.geos.set(g, g.attributes.normal.array.slice()); g.attributes.normal.array.set(sn.n); g.attributes.normal.needsUpdate = true;
          const C = g.attributes.color; if (C && C.array instanceof Float32Array && C.itemSize >= 3) { const src = C.array.slice(), it = C.itemSize;
            for (let v = 0; v < sn.nb.length; v++) { const L = sn.nb[v]; if (!L || L.length < 2) continue; let r = 0, gg = 0, bb = 0; for (const u of L) { r += src[u * it]; gg += src[u * it + 1]; bb += src[u * it + 2]; } C.array[v * it] = r / L.length; C.array[v * it + 1] = gg / L.length; C.array[v * it + 2] = bb / L.length; }
            C.needsUpdate = true; } } }
      if (o.instanceColor) attr(o.instanceColor);
    });
    if (scene.fog) { saved.fog = scene.fog.color.clone(); scene.fog.color.convertSRGBToLinear(); }
    if (scene.background && scene.background.isColor) { saved.bg = scene.background.clone(); scene.background.convertSRGBToLinear(); }
  }
  function restore(scene) {
    if (!saved) return;
    for (const [o, c, g, i] of saved.lights) { o.color.copy(c); if (g) o.groundColor.copy(g); o.intensity = i; }
    for (const [m, c, e] of saved.mats) { if (c) m.color.copy(c); if (e) m.emissive.copy(e); m.needsUpdate = true; }
    for (const [t, enc] of saved.tex) { t.encoding = enc; t.needsUpdate = true; }
    for (const [a, arr] of saved.attrs) { a.array.set(arr); a.needsUpdate = true; }
    for (const [g, arr] of saved.geos) { g.attributes.normal.array.set(arr); g.attributes.normal.needsUpdate = true; }
    if (saved.fog) scene.fog.color.copy(saved.fog);
    if (saved.bg) scene.background.copy(saved.bg);
    saved = null;
  }

  // ── the passes ──
  const quadCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1), quadScene = new THREE.Scene();
  const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), null); quadScene.add(quad);
  const VS = 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0., 1.); }';
  const pass = (R, mat, target) => { quad.material = mat; R.setRenderTarget(target || null); R.render(quadScene, quadCam); };
  const K = []; for (let i = 0; i < 16; i++) { let v = new THREE.Vector3(Math.random() * 2 - 1, Math.random() * 2 - 1, Math.random()).normalize(); let s = i / 16; s = .1 + .9 * s * s; K.push(v.multiplyScalar(s * (.4 + .6 * Math.random()))); }
  const AO = new THREE.ShaderMaterial({ extensions: { derivatives: true }, uniforms: { tDepth: { value: null }, uProj: { value: new THREE.Matrix4() }, uInv: { value: new THREE.Matrix4() }, uK: { value: K }, uR: { value: 1 } }, vertexShader: VS,
    fragmentShader: `uniform sampler2D tDepth; uniform mat4 uProj, uInv; uniform vec3 uK[16]; uniform float uR; varying vec2 vUv;
      vec3 vp(vec2 uv){ float d = texture2D(tDepth, uv).x; vec4 c = uInv * vec4(uv * 2. - 1., d * 2. - 1., 1.); return c.xyz / c.w; }
      float h(vec2 p){ return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
      void main(){ float d = texture2D(tDepth, vUv).x; if (d >= .99999) { gl_FragColor = vec4(1.); return; }
        vec3 P = vp(vUv); vec3 N = normalize(cross(dFdx(P), dFdy(P))); if (dot(N, P) > 0.) N = -N;
        float a = h(gl_FragCoord.xy) * 6.2831; vec3 rv = vec3(cos(a), sin(a), 0.);
        vec3 T = normalize(rv - N * dot(rv, N)); vec3 B = cross(N, T); mat3 TBN = mat3(T, B, N);
        float r = uR * clamp(-P.z / 20., 1., 4.), occ = 0.;
        for (int i = 0; i < 16; i++) { vec3 s = P + TBN * uK[i] * r; vec4 o = uProj * vec4(s, 1.); vec2 su = o.xy / o.w * .5 + .5;
          float sz = vp(su).z; float rc = smoothstep(0., 1., r / abs(P.z - sz)); occ += (sz >= s.z + .03 * r ? 1. : 0.) * rc; }
        gl_FragColor = vec4(vec3(1. - occ / 16.), 1.); }` });
  const BRIGHT = new THREE.ShaderMaterial({ uniforms: { tCol: { value: null }, uT: { value: 1 } }, vertexShader: VS,
    fragmentShader: `uniform sampler2D tCol; uniform float uT; varying vec2 vUv; void main(){ vec3 c = texture2D(tCol, vUv).rgb; float l = max(c.r, max(c.g, c.b)); gl_FragColor = vec4(c * smoothstep(uT, uT * 2., l), 1.); }` });
  const BLUR = new THREE.ShaderMaterial({ uniforms: { tSrc: { value: null }, uDir: { value: new THREE.Vector2() } }, vertexShader: VS,
    fragmentShader: `uniform sampler2D tSrc; uniform vec2 uDir; varying vec2 vUv; void main(){ vec3 c = vec3(0.); float w[7]; w[0]=.1996; w[1]=.1760; w[2]=.1210; w[3]=.0648; w[4]=.0270; w[5]=.0088; w[6]=.0022;
      c += texture2D(tSrc, vUv).rgb * w[0]; for (int i = 1; i < 7; i++) { c += texture2D(tSrc, vUv + uDir * float(i)).rgb * w[i]; c += texture2D(tSrc, vUv - uDir * float(i)).rgb * w[i]; } gl_FragColor = vec4(c, 1.); }` });
  const COMP = new THREE.ShaderMaterial({ uniforms: { tCol: { value: null }, tAO: { value: null }, tBloom: { value: null }, tDepth: { value: null }, uInv: { value: new THREE.Matrix4() }, uAOPx: { value: new THREE.Vector2() },
      uAO: { value: .8 }, uBloom: { value: .25 }, uExp: { value: 1 }, uSat: { value: 1.1 }, uCon: { value: .25 }, uCool: { value: new THREE.Vector3(.92, .97, 1.08) }, uWarm: { value: new THREE.Vector3(1.06, 1.0, .92) },
      uHaze: { value: new THREE.Vector3(.6, .7, .85) }, uDbg: { value: 0 }, uHazeK: { value: .0 }, uVig: { value: .25 } }, vertexShader: VS,
    fragmentShader: `uniform sampler2D tCol, tAO, tBloom, tDepth; uniform mat4 uInv; uniform vec2 uAOPx; uniform float uDbg, uAO, uBloom, uExp, uSat, uCon, uHazeK, uVig; uniform vec3 uCool, uWarm, uHaze; varying vec2 vUv;
      vec3 aces(vec3 x){ return clamp((x * (2.51 * x + .03)) / (x * (2.43 * x + .59) + .14), 0., 1.); }
      vec3 enc(vec3 c){ return mix(c * 12.92, 1.055 * pow(c, vec3(1. / 2.4)) - .055, step(.0031308, c)); }
      void main(){ vec3 c = texture2D(tCol, vUv).rgb; float ao = 0.;
        for (int x = -2; x <= 2; x++) for (int y = -2; y <= 2; y++) ao += texture2D(tAO, vUv + vec2(float(x), float(y)) * uAOPx).r; ao /= 25.;
        if (uDbg > .5) { gl_FragColor = vec4(vec3(ao), 1.); return; } c *= mix(1., ao, uAO);
        float d = texture2D(tDepth, vUv).x; vec4 vp = uInv * vec4(vUv * 2. - 1., d * 2. - 1., 1.); float dist = d >= .99999 ? 1e4 : length(vp.xyz / vp.w);
        if (d < .99999) c = mix(c, uHaze, (1. - exp(-dist * uHazeK)) * .7);
        c += texture2D(tBloom, vUv).rgb * uBloom;
        c = aces(c * uExp);
        float l = dot(c, vec3(.2126, .7152, .0722));
        c *= mix(uCool, uWarm, smoothstep(.05, .7, l));
        c = mix(vec3(l), c, d >= .99999 ? 1.7 : uSat); float g = d >= .99999 ? 0. : clamp((c.g - max(c.r, c.b)) * 2., 0., 1.); c = mix(c, vec3(c.g * .78, c.g * .86, c.g * .52) + vec3(c.r * .2, 0., 0.), g * .22);
        c = mix(c, c * c * (3. - 2. * c), uCon);
        vec2 q = vUv - .5; c *= 1. - uVig * dot(q, q) * 2.2;
        gl_FragColor = vec4(enc(clamp(c, 0., 1.)), 1.); }` });
  const KUW = new THREE.ShaderMaterial({ uniforms: { tSrc: { value: null }, uPx: { value: new THREE.Vector2() } }, vertexShader: VS,
    fragmentShader: `uniform sampler2D tSrc; uniform vec2 uPx; varying vec2 vUv;
      void q(vec2 o, inout vec3 bestM, inout float bestS){ vec3 m = vec3(0.), s = vec3(0.);
        for (int i = 0; i <= 6; i++) for (int j = 0; j <= 6; j++) { vec3 c = texture2D(tSrc, vUv + (o * vec2(float(i), float(j))) * uPx).rgb; m += c; s += c * c; }
        m /= 49.; s = abs(s / 49. - m * m); float v = s.r + s.g + s.b; if (v < bestS) { bestS = v; bestM = m; } }
      void main(){ vec3 bm = vec3(0.); float bs = 1e9; q(vec2(-1., -1.), bm, bs); q(vec2(1., -1.), bm, bs); q(vec2(-1., 1.), bm, bs); q(vec2(1., 1.), bm, bs); gl_FragColor = vec4(bm, 1.); }` });

  let T = null;
  function targets(R, W, H) {
    if (T && T.W === W && T.H === H) return T;
    const hf = R.capabilities.isWebGL2 ? THREE.HalfFloatType : THREE.UnsignedByteType, o = { minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter, type: hf };
    const scene = new THREE.WebGLRenderTarget(W, H, o); scene.depthTexture = new THREE.DepthTexture(W, H); scene.depthTexture.type = THREE.UnsignedIntType;
    T = { W, H, scene, ao: new THREE.WebGLRenderTarget(W >> 1, H >> 1), b1: new THREE.WebGLRenderTarget(W >> 2, H >> 2, o), b2: new THREE.WebGLRenderTarget(W >> 2, H >> 2, o), ldr: new THREE.WebGLRenderTarget(W, H) };
    return T;
  }
  const LOOKS = {
    modern: { amb: .3, hemi: 1.6, sun: 2.0, point: 1.6, exp: .95, ao: 1, aoR: 1.4, bloom: .25, bloomT: .9, sat: 1.1, con: .22, haze: .0007, vig: .28 },
    // the dungeon: no sun; the lantern does the work, the dark stays dark
    gate: { amb: .7, hemi: 1, sun: 1, point: 1.5, exp: 1.25, ao: .9, aoR: .6, bloom: .4, bloomT: .6, sat: .82, con: .22, haze: 0, vig: .45 },
  };
  function render(scene, cam, mode, opt) {
    const R = REN; opt = opt || {};
    if (mode === 'today') { R.setRenderTarget(null); R.render(scene, cam); return; }
    const L = Object.assign({}, LOOKS[opt.look || 'modern'], { smooth: mode === 'smooth' || mode === 'painted' }, opt.tune || {});
    const W = R.domElement.width, H = R.domElement.height, t = targets(R, W, H);
    linearize(scene, L);
    try {
      R.setRenderTarget(t.scene); R.clear(); R.render(scene, cam);
      cam.updateMatrixWorld(); const inv = cam.projectionMatrixInverse.clone();
      AO.uniforms.tDepth.value = t.scene.depthTexture; AO.uniforms.uProj.value.copy(cam.projectionMatrix); AO.uniforms.uInv.value.copy(inv); AO.uniforms.uR.value = L.aoR; pass(R, AO, t.ao);
      BRIGHT.uniforms.tCol.value = t.scene.texture; BRIGHT.uniforms.uT.value = L.bloomT; pass(R, BRIGHT, t.b1);
      for (let k = 0; k < 2; k++) { BLUR.uniforms.tSrc.value = t.b1.texture; BLUR.uniforms.uDir.value.set(1.6 / t.b1.width, 0); pass(R, BLUR, t.b2); BLUR.uniforms.tSrc.value = t.b2.texture; BLUR.uniforms.uDir.value.set(0, 1.6 / t.b1.height); pass(R, BLUR, t.b1); }
      const U = COMP.uniforms; U.tCol.value = t.scene.texture; U.tAO.value = t.ao.texture; U.tBloom.value = t.b1.texture; U.tDepth.value = t.scene.depthTexture; U.uInv.value.copy(inv); U.uAOPx.value.set(1 / t.ao.width, 1 / t.ao.height);
      U.uAO.value = L.ao; U.uBloom.value = L.bloom; U.uExp.value = L.exp; U.uSat.value = L.sat; U.uCon.value = L.con; U.uHazeK.value = L.haze; U.uVig.value = L.vig; U.uDbg.value = mode === 'ao' ? 1 : 0;
      if (scene.fog) U.uHaze.value.set(scene.fog.color.r, scene.fog.color.g, scene.fog.color.b);
      if (mode === 'painted') { pass(R, COMP, t.ldr); KUW.uniforms.tSrc.value = t.ldr.texture; KUW.uniforms.uPx.value.set(1 / W, 1 / H); pass(R, KUW, null); }
      else pass(R, COMP, null);
    } finally { R.setRenderTarget(null); restore(scene); }
  }
  window.NEWLOOK = { render, LOOKS };
})();
