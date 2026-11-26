// ═══ THE LAND IN THE NEW LOOK (v80 S1180, card F3) ════════════════════════════════════════════════════════════════
// The vista slice's land (docs/prototypes/levelup/main.js, Sessions 768–769) brought into the game behind `?look=new`:
// the terrain shaded in its fragment shader, the sky as a gradient dome that follows the clock and the weather, the
// water's sheen, and the post (ACES and the warm-and-cool grade of P10b, OG-147). Everything here is the new look's
// alone: `LAND.on` is false on r128 and the old look's chunks, sky and water are built and drawn exactly as before.
// The world files call in at four places, all at run time: build() (88) takes `landTerrainMat`, `landSky` and
// `landWater`; buildChunk and refreshChunkTerrain (80) take `landMask`; atmosphere (80) ends with `landAtmosphere`.
// The land is fed by the game's own numbers: the vertex colour is groundColor's (biomes, the road verge, rock, the
// snow line, WX.cover's settled snow, sand, the sea bed), and the shader paints over it what a vertex cannot hold:
// field patchwork and hedgerows on the open country, grain and tussock, rock strata on the steep, woods read from afar.
// Positions reach the shader in chunk-local space (the float32 rule); the noise is hashed on cell indices taken modulo
// 289, so a world coordinate of 25,000 hashes as cleanly as one of 25.
const LAND={on:window.OG_LOOK==='new',mat:null,sky:null,skyMat:null,exposure:1,roomExposure:1,
  // the land's albedo against the old look's (whose detail map averaged .72), how near the fields come, and the soil's darkening
  // under the near ground; a uniform, so a later quality level or the corruption level can move it without a recompile
  k:{value:new THREE.Vector4(.5,22,.8,0)}};
// S2519 — holes in the land, where a prop brings its own ground below it (the fallen star's crater, 0.8 m deep): up to six discs in world x, z,
// each (x, z, radius, on); the terrain's fragments inside one are not drawn. Set by `starKitHoles` (82-world-structures.js); all off by default.
const LAND_HOLES={value:[0,1,2,3,4,5].map(()=>new THREE.Vector4(0,0,0,0))};
const LAND_NOISE=`
float lh12(vec2 p){ p = mod(p, 289.); p = fract(p * vec2(.1031, .1030)); p += dot(p, p.yx + 33.33); return fract((p.x + p.y) * p.x); }
float lvn(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f);
  return mix(mix(lh12(i), lh12(i + vec2(1., 0.)), f.x), mix(lh12(i + vec2(0., 1.)), lh12(i + vec2(1., 1.)), f.x), f.y); }
float lfb(vec2 p){ float a = 0., m = .5; for (int i = 0; i < 4; i++) { a += m * lvn(p); p = p * 2.03 + 17.1; m *= .5; } return a / .9375; }
`;
// ── the terrain ──────────────────────────────────────────────────────────────────────────────────────────────────
// aMask per vertex: x the trodden ground of a site's stamp, y the woods (the region's tree density where trees grow),
// z the open country where fields are laid (plains and autumn country, away from roads, stamps and the shore).
const LAND_FIELD_BIOMES={plains:1,autumn:.8,moor:.25};
function landMask(geo,ox,oz){
  if(!LAND.on)return;
  const pa=geo.attributes.position;let m=geo.attributes.aMask;
  if(!m){m=new THREE.BufferAttribute(new Float32Array(pa.count*3),3);geo.setAttribute('aMask',m);}
  for(let i=0;i<pa.count;i++){const x=pa.getX(i)+ox+CHUNK/2,z=pa.getZ(i)+oz+CHUNK/2,h=pa.getY(i);
    const st=stampAt(x,z);const ri=roadInfo(x,z);const rd=ri?ri.d:99;
    let field=0,wood=0;const ws=regionWeights(x,z);
    for(const e of ws){if(e.w<=0)continue;field+=e.w*(LAND_FIELD_BIOMES[e.r.biome]||0);wood+=e.w*(e.r.density||0)*(e.r.trees&&e.r.trees!=='dead'?1:.3);}
    const away=sstep(ROAD_BLEND,ROAD_BLEND+14,rd)*(st&&!st.natural?0:1)*sstep(2.5,7,h);
    m.setXYZ(i,st&&!st.natural?1:0,Math.min(1,wood*1.2)*sstep(1.6,4,h),Math.min(1,field)*away);}
  m.needsUpdate=true;
}
function landTerrainMat(){
  const m=new THREE.MeshLambertMaterial({vertexColors:true});
  m.onBeforeCompile=s=>{
    s.uniforms.uLandK=LAND.k;s.uniforms.uLandHoles=LAND_HOLES;
    s.vertexShader='attribute vec3 aMask;\nvarying vec3 vLW;\nvarying vec3 vLN;\nvarying vec3 vLMask;\n'+s.vertexShader.replace('#include <begin_vertex>',
      '#include <begin_vertex>\n vLW = (modelMatrix * vec4(position, 1.)).xyz; vLN = normalize(mat3(modelMatrix) * normal); vLMask = aMask;');
    s.fragmentShader='uniform vec4 uLandK;\nuniform vec4 uLandHoles[6];\nvarying vec3 vLW;\nvarying vec3 vLN;\nvarying vec3 vLMask;\n'+LAND_NOISE+`
vec3 landField(float r){ vec3 c = vec3(.40,.52,.20);
  if (r < .16) c = vec3(.66,.56,.24); else if (r < .27) c = vec3(.74,.64,.32); else if (r < .42) c = vec3(.46,.60,.20);
  else if (r < .56) c = vec3(.32,.48,.16); else if (r < .64) c = vec3(.56,.48,.28); else if (r < .80) c = vec3(.42,.58,.22); return c; }
vec3 landCol(vec3 base){
  vec2 p = vLW.xz; float dist = length(vLW - cameraPosition);
  float slope = 1. - clamp(vLN.y, 0., 1.);
  float n1 = lfb(p / 38.), n2 = lfb(p / 9.), n3 = lvn(p / 1.7);
  float lum = dot(base, vec3(.299, .587, .114));
  float green = smoothstep(.0, .08, base.g - max(base.r, base.b) * .92) * (1. - smoothstep(.62, .8, lum));
  vec3 c = base * (.84 + .26 * n1);
  c = mix(c, c * vec3(1.12, 1.05, .72), smoothstep(.55, .8, n2) * .45 * green);
  c *= .9 + .2 * n3;
  // the open country: a patchwork of fields with hedgerows between, from the middle distance on
  vec2 fp = p / vec2(74., 56.) + vec2(lfb(p / 160.), lfb(p / 160. + 9.)) * 1.4; vec2 ip = floor(fp), ff = fract(fp); float d1 = 9., d2 = 9.; vec2 id = vec2(0.);
  for (int y = -1; y <= 1; y++) for (int x = -1; x <= 1; x++) { vec2 o = vec2(float(x), float(y)); vec2 r = o + vec2(lh12(ip + o), lh12(ip + o + 7.3)) - ff; float d = dot(r, r);
    if (d < d1) { d2 = d1; d1 = d; id = ip + o; } else if (d < d2) d2 = d; }
  float edge = sqrt(d2) - sqrt(d1);
  float fm = vLMask.z * green * smoothstep(.16, .06, slope) * smoothstep(uLandK.y, uLandK.y * 3., dist);
  vec3 field = landField(lh12(id * 1.37)) * (.86 + .26 * n2) * (.7 + .5 * lum / .45);
  field *= .93 + .1 * (sin(dot(p, normalize(vec2(lh12(id), lh12(id + 3.)) - .5)) * 1.3) * .5 + .5);
  float keep = step(.22, lh12(id + 11.));
  c = mix(c, field, fm * keep);
  float hedge = (1. - smoothstep(.02, .05 + dist / 12000., edge)) * fm;
  c = mix(c, vec3(.12,.22,.07) * (.8 + .4 * n2), hedge);
  // woods seen from afar, where the near trees end
  c = mix(c, vec3(.11,.22,.08) * (.75 + .5 * n2), vLMask.y * smoothstep(120., 300., dist) * .85);
  // rock on the steep: strata and cracks over groundColor's own rock
  float rk = smoothstep(.32, .55, slope + (n1 - .5) * .2);
  vec3 rock = mix(vec3(.40,.38,.34), vec3(.56,.53,.47), n2) * (.86 + .22 * sin(vLW.y * 1.9 + n1 * 6.));
  c = mix(c, mix(rock, base * 1.1, smoothstep(.75, .9, lum)), rk);
  // trodden ground in a site's stamp
  c = mix(c, mix(c, vec3(.48,.43,.33) * (.85 + .3 * n3), .35), vLMask.x * smoothstep(.45, .7, n2) * green);
  // the sea and river bed seen through the water: shallows bright, depth into teal
  c = mix(c, vec3(.16,.34,.36), smoothstep(-.4, -5., vLW.y) * .7);
  // the ground at the feet reads darker, as soil between blades does
  c *= mix(uLandK.z, 1., smoothstep(4., 30., dist));
  // snow and the pale ground keep their brightness; the green and brown country takes the albedo cut
  return c * mix(uLandK.x, .82, smoothstep(.5, .78, lum)); }
`+s.fragmentShader.replace('#include <clipping_planes_fragment>','#include <clipping_planes_fragment>\n for (int i = 0; i < 6; i++) { vec4 h = uLandHoles[i]; if (h.w > .5 && length(vLW.xz - h.xy) < h.z) discard; }').replace('#include <color_fragment>','#include <color_fragment>\n diffuseColor.rgb = landCol(vColor);');
    LAND.terrainShader=s;};
  m.customProgramCacheKey=()=>'og-land-terrain';
  LAND.mat=m;return m;
}
// ── S2682 — the haze and the grade as uniforms every material shares (the light-and-grade card) ─────────────────────
// Two things the frame needs from every lit material, set per frame by the clock: an aerial haze over three's own fog, and the
// grade's warmth, saturation and contrast (and the corruption level's drain and hue turn, visual-foundation.md, 0 for now). three
// clones a built-in material's uniforms from ShaderLib when it compiles it, but a value that is a plain object (not a Color or a
// Vector) is copied by reference, so one object here reaches every material at once with no list to keep. The values are zero
// outside the open world's own frame (landPost's onBeforeRender sets them, onAfterRender puts them back), and zero is the old
// output to the bit: no haze, the S1180 grade. A ShaderMaterial of another file that never names them reads zero too.
// The haze is an exponential in distance, not FogExp2's square: the square keeps the first 300 m clear and then shuts like a
// door (a ridge at 900 m was gone), where the plain exponential lays the planes one behind the other, each a step nearer the sky.
// The weather's own FogExp2 (its sight, WX_SIGHT, which the foes' sight shares) is untouched and drawn over the haze.
const OG_U={haze:{x:0,y:0,z:0,w:0},hazeC:{r:0,g:0,b:0},gradeA:{x:0,y:0,z:0,w:0},gradeB:{x:0,y:0,z:0,w:0}};
if(LAND.on){
  for(const k in THREE.ShaderLib){const u=THREE.ShaderLib[k].uniforms;if(!u)continue;
    u.ogGradeA={value:OG_U.gradeA};u.ogGradeB={value:OG_U.gradeB};if('fogDensity' in u){u.ogHaze={value:OG_U.haze};u.ogHazeC={value:OG_U.hazeC};}}
  const F=THREE.UniformsLib.fog;F.ogHaze={value:OG_U.haze};F.ogHazeC={value:OG_U.hazeC};
  const C=THREE.ShaderChunk;
  C.fog_pars_fragment=C.fog_pars_fragment.replace('uniform vec3 fogColor;','uniform vec3 fogColor;\n\tuniform vec4 ogHaze;\n\tuniform vec3 ogHazeC;');
  C.fog_fragment=C.fog_fragment.replace('gl_FragColor.rgb = mix( gl_FragColor.rgb, fogColor, fogFactor );',
    'gl_FragColor.rgb = mix( gl_FragColor.rgb, ogHazeC, ( 1.0 - exp( - ogHaze.x * vFogDepth ) ) * ogHaze.y );\n\tgl_FragColor.rgb = mix( gl_FragColor.rgb, fogColor, fogFactor );');
}
// the world's values, written into OG_U for the world's own frame only
function landUniformsOn(){const L=LAND.L;if(!L)return;
  OG_U.haze.x=L.hazeD;OG_U.haze.y=L.hazeMax;OG_U.hazeC.r=L.haze.r;OG_U.hazeC.g=L.haze.g;OG_U.hazeC.b=L.haze.b;
  OG_U.gradeA.x=L.warm;OG_U.gradeA.y=L.sat;OG_U.gradeA.z=0;OG_U.gradeA.w=L.con;
  OG_U.gradeB.x=LAND.drain||0;OG_U.gradeB.y=LAND.hue||0;}
function landUniformsOff(){OG_U.haze.x=OG_U.haze.y=0;OG_U.gradeA.x=OG_U.gradeA.y=OG_U.gradeA.w=0;OG_U.gradeB.x=OG_U.gradeB.y=0;}
// ── the sky: a gradient dome, the sun's glow and the haze at its foot ────────────────────────────────────────────
// S2682: the haze band at the dome's foot is the land's own haze colour, so a far ridge melts into the sky with no seam; a low
// sun spreads its glow along the horizon as a band (the sunset's), a high one keeps a round halo; the wash is broken by a broad,
// slow variation (a painted sky is never one flat gradient); High adds thin cirrus, lit by the glow.
function landSky(){
  const mat=new THREE.ShaderMaterial({side:THREE.BackSide,depthWrite:false,fog:false,
    uniforms:{uZen:{value:new THREE.Color()},uMid:{value:new THREE.Color()},uHor:{value:new THREE.Color()},uGlow:{value:new THREE.Color()},
      uHaze:{value:new THREE.Color()},uSun:{value:new THREE.Vector3(0,1,0)},uGlowK:{value:.35},uDisc:{value:1},uCirrus:{value:0},uDrift:{value:0},
      ogGradeA:{value:OG_U.gradeA},ogGradeB:{value:OG_U.gradeB}},
    vertexShader:'varying vec3 vD;\nvoid main(){ vD = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }',
    fragmentShader:`uniform vec3 uZen, uMid, uHor, uGlow, uHaze, uSun; uniform float uGlowK, uDisc, uCirrus, uDrift; varying vec3 vD;
${LAND_NOISE}
void main(){ vec3 d = normalize(vD); float y = max(d.y, 0.);
  vec3 c = mix(uHor, uMid, smoothstep(0., .22, y)); c = mix(c, uZen, smoothstep(.18, .85, y));
  c = mix(c, uHaze, (1. - smoothstep(0., .08, y)) * .7);
  vec3 S = normalize(uSun); float sd = max(dot(d, S), 0.);
  float low = 1. - smoothstep(.0, .4, S.y), band = exp(-y * 7.) * pow(sd * .5 + .5, 5.) * low;
  c += uGlow * (pow(sd, 6.) * uGlowK + pow(sd, 48.) * uGlowK * .8 + band * uGlowK * 1.1 + pow(sd, 1600.) * 6. * uDisc);
  vec2 q = d.xz / (y + .25);
  c *= .955 + .09 * lfb(q * .8 + 3.);
  if (uCirrus > 0.) { vec2 p = q * 1.3 + vec2(uDrift, uDrift * .3); float n = lfb(p * vec2(1., 3.5)) * .7 + lvn(p * 6.) * .3;
    float k = smoothstep(.5, .78, n) * smoothstep(.04, .3, y) * (1. - smoothstep(.6, .95, y)) * uCirrus;
    c = mix(c, mix(uHor, vec3(1.), .35) + uGlow * pow(sd, 3.) * uGlowK, k * .42); }
  c = mix(c, uHaze * .9, smoothstep(0., -.1, d.y));
  gl_FragColor = vec4(c, 1.);
  #include <tonemapping_fragment>
}`});
  const dome=new THREE.Mesh(new THREE.SphereGeometry(2900,40,20),mat);dome.renderOrder=-5;dome.frustumCulled=false;
  LAND.sky=dome;LAND.skyMat=mat;return dome;
}
// ── the water: the old shader's swell and foam, with a sheen of the sky at a grazing angle and the sun's glint ──────
function landWater(sh){
  sh.uniforms.uLSky=LAND.waterSky||(LAND.waterSky={value:new THREE.Color(.5,.66,.86)});
  sh.uniforms.uLSun=LAND.waterSun||(LAND.waterSun={value:new THREE.Vector3(0,1,0)});
  sh.uniforms.uLGlint=LAND.waterGlint||(LAND.waterGlint={value:1});
  sh.uniforms.uLSea=LAND.waterSea||(LAND.waterSea={value:new THREE.Color(1,1,1)}); // S2682 — the island's sea (Aurenne's turquoise), a tint on the lit water
  sh.vertexShader='varying vec3 vLWW;\n'+sh.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\n vLWW = (modelMatrix * vec4(position, 1.)).xyz;');
  sh.fragmentShader='uniform vec3 uLSky; uniform vec3 uLSun; uniform vec3 uLSea; uniform float uLGlint; varying vec3 vLWW;\n'+LAND_NOISE+sh.fragmentShader.replace('#include <opaque_fragment>',`
  { outgoingLight *= uLSea; vec2 p = vLWW.xz; float e = .9;
    float a = lfb(p / 7.), bx = lfb((p + vec2(e, 0.)) / 7.), bz = lfb((p + vec2(0., e)) / 7.);
    float a2 = lfb(p / 31. + 5.), bx2 = lfb((p + vec2(e, 0.)) / 31. + 5.), bz2 = lfb((p + vec2(0., e)) / 31. + 5.);
    vec3 nw = normalize(vec3((a - bx) * 1.4 + (a2 - bx2) * 2.2, 1., (a - bz) * 1.4 + (a2 - bz2) * 2.2));
    vec3 V = normalize(cameraPosition - vLWW);
    float fr = pow(1. - max(dot(V, nw), 0.), 5.) * .55 + .04;
    vec3 Rv = reflect(-V, nw);
    vec3 refl = mix(uLSky * .85, uLSky * 1.2, clamp(Rv.y * 2., 0., 1.));
    outgoingLight = mix(outgoingLight, refl, fr);
    outgoingLight += vec3(1., .88, .66) * pow(max(dot(Rv, normalize(uLSun)), 0.), 300.) * 4. * uLGlint;
    diffuseColor.a = mix(diffuseColor.a, 1., fr * .6); }
  #include <opaque_fragment>`);
}
// ── S2682 — the light by the hour (the light-and-grade card; P10b, OG-147) ─────────────────────────────────────────
// Every daytime frame was one flat noon: the sun's light never sank below 0.32 (atmosphere() clamped it), its colour and strength
// moved only with the night factor, the ambient and the hemisphere together matched the sun so shadows barely read, and the haze
// was the biome's one grey-green. The hour now reads its light from one curve, keyed at the hours P10b's lighting panel paints:
// night, the blue before dawn, sunrise, the early gold, morning, noon, the afternoon, golden hour, sunset, dusk and the blue hour.
// Each key holds the sun's colour and strength (the moon's, by night: the light turns to the moon when the sun is down, scaled by
// its phase), the ambient and the hemisphere (sky and ground), the dome's zenith, middle and horizon, the haze's colour and density,
// the sun's glow, the exposure, the grade (warmth, saturation, contrast) and the post's bloom and vignette. Between keys the values
// ease (smoothstep), so a dawn takes its hour and a half and never steps. Shadows read because the ambient is about a sixth of the
// sun by day (it was nearly level with it), and the sun stands as low as it is.
// The island's palette then tints the curve (P10b's regional palettes: the Gatelands moss and soft blue, the Mark slate and cold,
// crisp air, Aurenne ochre light, warm haze and a turquoise sea), blended by regionWeights so a coast between two islands is never
// a seam, with the biome's own nudge on top (a forest's green haze, the wastes' dust, a fen's thick air, the tundra's cold).
// Last, the weather: cloud greys the sky toward its own luminance, raises the ambient (an overcast's light comes from everywhere),
// thickens the haze, cools and flattens the grade. The weather's sight (its FogExp2, WX_SIGHT) is applyWeather's, as before.
// Colours are as the shader reads them (colour management off, 05-compat.js), before ACES.
const LIGHT_KEYS=[
  //  h      sun colour     sunI   ambient        ambI  hemi sky        hemi ground    hemiI  zenith            middle            horizon          haze             hazeD   glow           glowK exp   warm  sat   con  bloom vig
  [ 0,    [.50,.62,.95],.55, [.30,.38,.62],.22, [.30,.40,.70],[.06,.07,.09],.30, [.010,.016,.045],[.022,.036,.085],[.05,.075,.14], [.035,.05,.09], .0011, [0,0,0],        0, 1.05, -.5, -.6,  .06, .32, .45],
  [ 4.3,  [.50,.62,.95],.55, [.30,.38,.62],.22, [.30,.40,.70],[.06,.07,.09],.30, [.010,.016,.045],[.022,.036,.085],[.05,.075,.14], [.035,.05,.09], .0011, [0,0,0],        0, 1.05, -.5, -.6,  .06, .32, .45],
  [ 5.2,  [.60,.60,.85],.20, [.42,.42,.62],.24, [.50,.50,.75],[.12,.10,.10],.32, [.04,.07,.19],   [.16,.18,.34],   [.62,.42,.48],  [.30,.28,.38],  .0012, [1,.5,.4],      .25, 1.08, -.1, -.25, .03, .26, .38],
  [ 6.0,  [1,.55,.32],  .9,  [.50,.48,.60],.30, [.70,.62,.72],[.30,.24,.18],.45, [.14,.25,.55],   [.50,.50,.66],   [1.0,.62,.42],  [.78,.62,.56],  .0013, [1,.62,.38],    .8, 1.1,  .55, .08, .05, .30, .34],
  [ 7.0,  [1,.78,.56],  1.3, [.55,.58,.72],.26, [.70,.76,.92],[.36,.36,.26],.42, [.12,.30,.66],   [.40,.58,.84],   [.96,.84,.72],  [.80,.78,.76],  .0010, [1,.8,.6],      .5, 1.02,  .3,  .08, .05, .24, .30],
  [ 8.5,  [1,.92,.80],  1.5, [.58,.66,.84],.24, [.66,.78,1],  [.40,.44,.30],.42, [.10,.29,.70],   [.34,.56,.88],   [.80,.86,.92],  [.70,.78,.88],  .00075,[1,.9,.75],     .35, 1.0,  .1,  .10, .06, .22, .30],
  [12.5,  [1,.96,.90],  1.6, [.60,.68,.86],.24, [.66,.80,1],  [.42,.46,.30],.44, [.09,.26,.66],   [.32,.54,.88],   [.74,.84,.94],  [.66,.76,.90],  .00062,[1,.95,.85],    .3,  .98, .05, .10, .07, .20, .28],
  [15.5,  [1,.90,.74],  1.55,[.62,.64,.78],.24, [.72,.78,.95],[.44,.42,.28],.42, [.10,.27,.66],   [.36,.56,.86],   [.86,.86,.86],  [.76,.78,.84],  .0007, [1,.88,.68],    .4, 1.0,  .25, .12, .07, .22, .30],
  [17.0,  [1,.70,.40],  1.45,[.58,.52,.64],.26, [.78,.66,.70],[.44,.34,.22],.44, [.12,.24,.56],   [.48,.52,.70],   [1.0,.74,.48],  [.92,.72,.54],  .0009, [1,.68,.38],    .8, 1.04,  .7,  .16, .08, .30, .34],
  [17.85, [1,.50,.26],  1.05,[.52,.42,.56],.28, [.75,.52,.58],[.36,.26,.20],.44, [.12,.16,.42],   [.56,.40,.52],   [1.0,.52,.30],  [.80,.52,.44],  .0011, [1,.5,.28],    1.0, 1.1,  .75, .14, .08, .34, .38],
  [18.5,  [.60,.50,.70],.12, [.40,.36,.55],.28, [.50,.42,.60],[.14,.11,.12],.38, [.06,.09,.26],   [.28,.22,.40],   [.80,.42,.40],  [.38,.30,.40],  .0011, [1,.45,.35],    .4, 1.1,  .1,  .02, .06, .30, .40],
  [19.3,  [.50,.60,.90],.35, [.32,.38,.62],.24, [.34,.42,.70],[.07,.07,.09],.32, [.025,.045,.13], [.08,.12,.26],   [.20,.22,.38],  [.10,.12,.22],  .0011, [0,0,0],        0, 1.06, -.35,-.4,  .06, .32, .44],
  [20.6,  [.50,.62,.95],.55, [.30,.38,.62],.22, [.30,.40,.70],[.06,.07,.09],.30, [.010,.016,.045],[.022,.036,.085],[.05,.075,.14], [.035,.05,.09], .0011, [0,0,0],        0, 1.05, -.5, -.6,  .06, .32, .45],
  [24,    [.50,.62,.95],.55, [.30,.38,.62],.22, [.30,.40,.70],[.06,.07,.09],.30, [.010,.016,.045],[.022,.036,.085],[.05,.075,.14], [.035,.05,.09], .0011, [0,0,0],        0, 1.05, -.5, -.6,  .06, .32, .45]];
const LIGHT_F=['sun','sunI','amb','ambI','hSky','hGnd','hemiI','zen','mid','hor','haze','hazeD','glow','glowK','exp','warm','sat','con','bloom','vig'];
// the islands' palettes (Michael's B on #719, 25 Oct 2026: each island its own air, OG-140 as the concept artist's air.js draws it,
// blended across the sea), as ratios of each island's row to the Gatelands' laid over the curve: colours multiply, sunK, hemiK, hazeD
// and cover multiply, warm, sat, con and exp add. The Gatelands soft and hazy (sight about 2.5 km at noon), green-grey water; the Mark a
// hard, strong sun with less fill, a deep blue sky, crisp air (a third of the haze: about 8 km), dark water, few clouds and a cool,
// contrasty, less saturated grade; Aurenne a fierce white sun, a bleached warm horizon and haze (about 4 km), a warm ground's bounce,
// turquoise water, a sky nearly bare of cloud and a warm, saturated grade. The biomes nudge on top (a forest's and a fen's green,
// thicker haze, the wastes' and the dunes' dust, the tundra's cold).
const LIGHT_PAL={
  gatelands:{sun:[1,1,1],amb:[1,1,1],sky:[1,1,1],hor:[1,1,1],haze:[1,1.01,.99],sea:[.88,.9,.82],sunK:1,hemiK:1,hazeD:1.1,cover:1,warm:0,sat:-.04,con:-.02,exp:0},
  mark:     {sun:[1,.95,.88],amb:[.82,.92,1.1],sky:[.62,.82,1.02],hor:[.86,.92,1.05],haze:[.84,.9,1.04],sea:[.55,.7,.85],sunK:1.2,hemiK:.8,hazeD:.35,cover:.55,warm:-.3,sat:-.14,con:.12,exp:.02},
  aurenne:  {sun:[1,1.03,1.06],amb:[1.06,1.03,.96],sky:[.82,1.04,1.16],hor:[1.12,1.06,.95],haze:[1.14,1.05,.92],sea:[.68,1.1,1.14],sunK:1.2,hemiK:1.05,hazeD:.6,cover:.3,warm:.3,sat:.14,con:-.01,exp:-.03}};
const LIGHT_BIOME={
  forest:{haze:[.9,1.03,.9],hazeD:1.25},fen:{haze:[.95,1.03,.96],hazeD:1.5},swamp:{haze:[.92,1.02,.9],hazeD:1.6},
  moor:{haze:[.96,.98,1.0],hazeD:1.15,sat:-.04},autumn:{haze:[1.04,.99,.92],warm:.1,sat:.04},
  tundra:{haze:[.94,.98,1.06],amb:[1,1,1.06],exp:.03},wastes:{haze:[1.12,.98,.8],hazeD:1.5,sat:-.06,warm:.08},
  wasteland:{haze:[1.1,.97,.82],hazeD:1.4,sat:-.08},dunes:{haze:[1.1,1,.82],hazeD:1.2,warm:.12},coast:{hazeD:.95}};
const LIGHT_C3=['sun','amb','sky','hor','haze','sea'],LIGHT_MUL=['sunK','hemiK','hazeD','cover'],LIGHT_ADD=['warm','sat','con','exp'];
const _lC={zen:new THREE.Color(),mid:new THREE.Color(),hor:new THREE.Color(),glow:new THREE.Color(),tmp:new THREE.Color(),v3:new THREE.Vector3(),
  pal:{sun:[1,1,1],amb:[1,1,1],sky:[1,1,1],hor:[1,1,1],haze:[1,1,1],sea:[1,1,1],sunK:1,hemiK:1,hazeD:1,cover:1,warm:0,sat:0,con:0,exp:0}};
// the curve at hour h, into out (an object of Colors and numbers, made once)
function lightAt(h,out){
  h=((h%24)+24)%24;let i=0;while(i<LIGHT_KEYS.length-2&&LIGHT_KEYS[i+1][0]<=h)i++;
  const A=LIGHT_KEYS[i],B=LIGHT_KEYS[i+1],u0=(h-A[0])/Math.max(1e-6,B[0]-A[0]),u=u0*u0*(3-2*u0);
  for(let f=0;f<LIGHT_F.length;f++){const a=A[f+1],b=B[f+1],k=LIGHT_F[f];
    if(Array.isArray(a)){const c=out[k]||(out[k]=new THREE.Color());c.setRGB(a[0]+(b[0]-a[0])*u,a[1]+(b[1]-a[1])*u,a[2]+(b[2]-a[2])*u);}
    else out[k]=a+(b-a)*u;}
  return out;}
// an island's key for a region: its centre's cell's nation (kept on the region; a region of the old legacy map is the Gatelands')
function lightIsle(r){if(r._isle)return r._isle;let k='gatelands';
  try{if(r.x!=null&&typeof nationKeyOf==='function'&&typeof cellOf==='function'){const c=cellOf(r.x,r.z);k=nationKeyOf(c[0],c[1])||k;}}catch(e){}
  return r._isle=k;}
// the palette where you stand: the islands' and the biomes' by the regions' weights
function lightPalette(ws){const P=_lC.pal;let W=0;
  for(const k of LIGHT_C3)P[k][0]=P[k][1]=P[k][2]=0;for(const k of LIGHT_MUL)P[k]=0;for(const k of LIGHT_ADD)P[k]=0;
  const add=(I,Bm,w)=>{W+=w;for(const k of LIGHT_C3)for(let j=0;j<3;j++)P[k][j]+=w*I[k][j]*(Bm[k]?Bm[k][j]:1);
    for(const k of LIGHT_MUL)P[k]+=w*I[k]*(Bm[k]||1);for(const k of LIGHT_ADD)P[k]+=w*(I[k]+(Bm[k]||0));};
  for(const e of ws)if(e.w>0)add(LIGHT_PAL[lightIsle(e.r)]||LIGHT_PAL.gatelands,LIGHT_BIOME[e.r.biome]||{},e.w);
  if(W<=0)add(LIGHT_PAL.gatelands,{},1);
  for(const k of LIGHT_C3)for(let j=0;j<3;j++)P[k][j]/=W;for(const k of LIGHT_MUL)P[k]/=W;for(const k of LIGHT_ADD)P[k]/=W;
  return P;}
// the moon's lit share, 0 new to 1 full (skyBodies' phase: day 0 is a full moon)
function lightMoon(){const day=Math.floor((worldState.gameTimeAbsMinutes||0)/1440),ph=((day+14)%29)/29;return(1-Math.cos(ph*Math.PI*2))/2;}
// the weather's cloud, as skyBodies reads it (0 clear, 1 a storm's lid), and the storm's own share
function lightCloud(){const cur=WX.type,nxt=WX.next,wk=(nxt!==cur)?WX.k:0,amt=k=>(cur===k?1:0)*(1-wk)+(nxt===k?1:0)*wk;
  return [Math.min(1,amt('overcast')*.75+amt('rain')*.9+amt('storm')+amt('snow')*.85+amt('fog')*.95),amt('storm')+amt('rain')*.4];}
const _lMul=(c,a)=>c.setRGB(c.r*a[0],c.g*a[1],c.b*a[2]);
// a colour toward its own grey (the weather's lid), darkened by dk
function _lGrey(c,k,dk){const l=c.r*.2126+c.g*.7152+c.b*.0722;c.lerp(_lC.tmp.setRGB(l*.95,l*.99,l*1.05),k);c.multiplyScalar(1-dk);return c;}
// called from atmosphere() (80) in place of the old night lerp, before the weather: the hour's light, the island's palette and the
// weather into LAND.L; the world's sky and fog colours (sc.background and sc.fog ease to them) from it. Returns the biome's FogExp2
// density, cut on the new look: the haze does the layering now, and the biome's exp2 is only a forest's or a fen's closeness.
function landHour(ws,den){
  const L=LAND.L||(LAND.L={});const hr=(typeof gameHour==='function')?gameHour():12;lightAt(hr,L);
  const P=lightPalette(ws);
  _lMul(L.sun,P.sun);_lMul(L.amb,P.amb);_lMul(L.hSky,P.amb);_lMul(L.zen,P.sky);_lMul(L.mid,P.sky);_lMul(L.hor,P.hor);_lMul(L.haze,P.haze);
  L.sunI*=P.sunK;L.hemiI*=P.hemiK;L.hazeD*=P.hazeD;L.cover=P.cover;L.warm+=P.warm;L.sat+=P.sat;L.con+=P.con;L.exp+=P.exp;L.sea=L.sea||new THREE.Color();L.sea.setRGB(P.sea[0],P.sea[1],P.sea[2]);
  // the night by the moon's phase, with starlight as a floor (Michael's C on #629, 22 Oct 2026; hours.js's nightRow): under a new moon a
  // fifth of a full moon's night is left in the sky, the haze, the ambient and the hemisphere, so the skyline and the roofs still read
  // against the sky while a lit window carries across a dark field; the moon's own light goes with its phase (landLights)
  const nt=(typeof _nightFactor==='function')?_nightFactor():0,moon=lightMoon(),nk=1-nt*(1-(.2+.8*moon));L.moon=moon;
  if(nk<1){for(const k of ['zen','mid','hor','haze','hSky'])L[k].multiplyScalar(nk);L.ambI*=nk;L.exp*=1+.06*nt;}
  const [cloud,storm]=lightCloud();L.cloud=cloud;
  if(cloud>0){const dk=storm*.3;
    for(const k of ['zen','mid','hor'])_lGrey(L[k],cloud*.85,dk);_lGrey(L.haze,cloud*.8,dk*.8);_lGrey(L.sun,cloud*.5,0);_lGrey(L.hSky,cloud*.6,0);
    L.sunI*=1-cloud*.65;L.ambI*=1+cloud*.9;L.hemiI*=1+cloud*.5; /* the lid takes the sun (shadows soften to nothing under a storm) and spreads it */L.hazeD*=1+cloud*1.6;L.glowK*=1-cloud*.8;
    L.warm*=1-cloud*.8;L.sat-=cloud*.12;L.con-=cloud*.03;L.exp*=1-storm*.08;}
  L.hazeMax=cameraUnderwater()?0:.92;
  // haze thins as you climb, as the exp2 does (from a summit the whole country is in view)
  L.hazeD*=Math.max(.35,1-Math.max(0,worldH(px,pz))/160);
  _atm.sky.copy(L.mid);_atm.fog.copy(L.haze);
  return den*.45;}
// ── per frame, at the end of atmosphere(): the dome, the clouds, the water and the post from LAND.L ────────────────────────
function landAtmosphere(){
  if(!LAND.on||!LAND.skyMat||!LAND.L)return;
  const U=LAND.skyMat.uniforms,L=LAND.L,cloud=L.cloud||0;
  const hr=(typeof gameHour==='function')?gameHour():12;
  const dayAng=Math.PI*(hr-6)/12,el=Math.sin(dayAng),az=-.6+Math.cos(dayAng)*.9,c=Math.sqrt(Math.max(0,1-el*el));
  U.uSun.value.set(Math.sin(az)*c,el,Math.cos(az)*c);
  // the weather's colour (applyWeather has eased sc.fog toward its grey) reaches the dome's foot and the haze in step with the fog
  const wxI=WX.intensity>0?Math.min(1,WX.intensity):0;
  U.uZen.value.copy(L.zen);U.uMid.value.copy(L.mid);U.uHor.value.copy(L.hor);
  U.uHaze.value.copy(L.haze).lerp(sc.fog.color,.35+.4*wxI);L.haze.copy(U.uHaze.value);
  U.uGlow.value.copy(L.glow);U.uGlowK.value=L.glowK;U.uDisc.value=SKY.sun?SKY.sun.material.opacity:0;
  U.uCirrus.value=(landQ().clouds>=30?1:0)*(1-cloud);U.uDrift.value=((worldState.gameTimeAbsMinutes||0)*.0004)%200;
  if(SKY.sun)SKY.sun.visible=false; // the dome draws the disc where skyBodies put it, bright under ACES, where the old flat disc read as a grey coin
  LAND.sky.position.set(px,worldH(px,pz)-60,pz);
  if(LAND.clouds){const C=LAND.clouds.material.uniforms;
    // lit tops: the sun's own colour over white, as bright as the sky allows; the shade: the sky's middle, dimmed, a touch of violet
    const day=Math.max(.05,Math.min(1,(L.mid.r*.2126+L.mid.g*.7152+L.mid.b*.0722)/.48));
    C.uHi.value.setRGB(1.3,1.27,1.2).multiply(_lC.tmp.copy(L.sun).lerp(_lC.glow.setRGB(1,1,1),.45)).multiplyScalar(.2+.8*day).lerp(_lC.zen.copy(L.mid).lerp(L.hor,.5).multiplyScalar(1.15),.1+.75*cloud);
    C.uLo.value.copy(L.mid).lerp(L.hor,.55).multiply(_lC.tmp.setRGB(.86,.84,.94)).multiplyScalar(.6+.35*day).lerp(_lC.glow.copy(L.glow),.12*L.glowK);
    C.uRim.value.copy(L.glow).multiplyScalar(L.glowK*.9+.15*day);C.uOp.value=.88+.12*cloud;C.uGrow.value=1+cloud*.7;C.uCover.value=Math.min(1.06,(L.cover==null?1:L.cover)+cloud*1.2); /* the island's share of the heaps (#719), all of them under a lid */
    LAND.clouds.rotation.y=(worldState.gameTimeAbsMinutes||0)*.00012;}
  if(LAND.waterSky){LAND.waterSky.value.copy(L.mid).lerp(L.hor,.5);LAND.waterSun.value.copy(U.uSun.value);LAND.waterGlint.value=Math.max(0,el)*(1-cloud);
    if(LAND.waterSea)LAND.waterSea.value.copy(L.sea).multiplyScalar(1-.3*cloud);} /* an overcast's sea is a darker, duller water */
  LAND.exposure=L.exp;LAND.bloomK=L.bloom;LAND.vig=L.vig;
  LAND.cloud=cloud;landStreak(); /* S2611 — the falling star's streak, by the clock */
}
// called at the end of atmosphere() (80) on the new look, after the old sun block: the sun (or the moon) as the light, from LAND.L
const _lLD=new THREE.Vector3();
function landLights(){
  const L=LAND.L;if(!L||!sun)return;
  const hr=(typeof gameHour==='function')?gameHour():12,dayAng=Math.PI*(hr-6)/12,eSun=Math.sin(dayAng);
  // by day the sun; when it is down, the moon (its own path, skyBodies'), scaled by its phase and whether it is up
  let e=eSun,a=dayAng,k=1;
  if(eSun<-.04){a=dayAng+Math.PI;e=Math.sin(a);const lit=lightMoon();
    k=lit*sstep(-.04,.15,e);} /* #629's C: the moon's light is its lit share; the floor is the sky's and the fill's (landHour) */
  const el=Math.max(.1,e),az=-.6+Math.cos(a)*.9,c=Math.sqrt(1-el*el);
  _lLD.set(Math.sin(az)*c,el,Math.cos(az)*c);
  sun.position.set(sunTarget.position.x+_lLD.x*260,sunTarget.position.y+_lLD.y*260,sunTarget.position.z+_lLD.z*260);
  sun.color.copy(L.sun);sun.intensity=L.sunI*k*(WX.sunMul||1);
  const eye=(typeof fxOn==='function'&&fxOn('nighteye'))?1+(typeof _nightFactor==='function'?_nightFactor():0)*2.2:1;
  amb.color.copy(L.amb);amb.intensity=L.ambI*eye;
  hemi.color.copy(L.hSky);hemi.groundColor.copy(L.hGnd);hemi.intensity=L.hemiI;
}
// ── S2611 — the falling star's streak (rare materials B, Michael's B on #1840, `docs/design/rare-materials.md`: "outdoors on that island
// at that hour, you see a streak across the sky toward it (1.5 s; the look builder's one quad)"). The star's minute is 50-travel.js's
// starOf(isle, week).at; the clock runs a game minute a real second, so the streak is up while the clock reads [at, at + 1.5), read
// from worldState.gameTimeAbsMinutes and never counted in frames (a dropped frame never moves it, a wait or a sleep across it skips it).
// Its path is the crater's own: it comes in from the bearing 82-world-structures.js's starKitMesh lays the crater from
// (seededRng('starfrom', id)), 6.5 km out and 5.2 km up, down to 0.9 km over the spot, where it burns out. Seen from where you stand,
// each point of that line is a direction, held between 6° and 62° up so the end stays over the near hills, and drawn on the dome
// at 2.5 km: one quad from the tail to the head, 38 % of the path long, 16 m wide at the head (0.37°, under 7 m it broke into dashes on a 720 px frame) and 4 at the tail,
// cold white over the bloom's threshold, fading in over the first 0.12 s, flaring and gone in the last 0.3. Behind the clouds (drawn
// before them), dimmed by cloud as the sun's glow is. Outdoors only (the open world, not a room), and only on the star's own island
// (nationKeyOf of the cell you stand in). 2 triangles, 1 draw while it shows, none otherwise.
const STREAK={dur:1.5,R:2500,len:.38,wHead:16,wTail:4,endUp:900,from:6500,up:5200,lo:6*Math.PI/180,hi:62*Math.PI/180,
  col:new THREE.Color(1.7,1.85,2.2)};
let _streak=null;
function landStreakMesh(){if(_streak)return _streak;
  const geo=new THREE.BufferGeometry();
  geo.setAttribute('position',new THREE.BufferAttribute(new Float32Array(12),3));
  geo.setAttribute('aT',new THREE.BufferAttribute(new Float32Array([0,-1,0,1,1,-1,1,1]),2));
  geo.setIndex([0,2,1,1,2,3]);
  const mat=new THREE.ShaderMaterial({transparent:true,depthWrite:false,fog:false,side:THREE.DoubleSide,blending:THREE.AdditiveBlending,
    uniforms:{uC:{value:STREAK.col},uA:{value:0}},
    vertexShader:'attribute vec2 aT; varying vec2 vT;\nvoid main(){ vT = aT; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }',
    fragmentShader:`uniform vec3 uC; uniform float uA; varying vec2 vT;
void main(){ float a = uA * pow(vT.x, 1.6) * (1. - vT.y * vT.y);
  gl_FragColor = vec4(uC * (.55 + .45 * vT.x), a);
  #include <tonemapping_fragment>
}`});
  const m=new THREE.Mesh(geo,mat);m.name='starStreak';m.frustumCulled=false;m.renderOrder=-4.5;m.visible=false;
  return _streak=m;}
// the star whose streak is up at game minute `now`, or null (this week's or last's: a star of day 6 after midnight falls in the next week)
function landStreakStar(now){if(typeof starOf!=='function'||typeof STAR==='undefined')return null;const w=starWeek(now);
  for(const isle of STAR.isles)for(const k of [w,w-1]){if(k<0)continue;const s=starOf(isle,k);if(s&&now>=s.at&&now<s.at+STREAK.dur)return s;}
  return null;}
// a point of the streak's path (k 0 the entry, 1 the end over the spot) as a direction from the eye, held in the band, out to R
function landStreakPt(s,k,eye,out){const F=seededRng('starfrom',s.id)()*Math.PI*2,g=rawH(s.x,s.z);
  const x=s.x+Math.sin(F)*STREAK.from*(1-k)-eye.x,z=s.z+Math.cos(F)*STREAK.from*(1-k)-eye.z,y=g+STREAK.endUp+STREAK.up*(1-k)-eye.y;
  const az=Math.atan2(x,z),el=Math.max(STREAK.lo,Math.min(STREAK.hi,Math.atan2(y,Math.hypot(x,z))));
  return out.set(Math.sin(az)*Math.cos(el),Math.sin(el),Math.cos(az)*Math.cos(el)).multiplyScalar(STREAK.R);}
const _sk={eye:new THREE.Vector3(),a:new THREE.Vector3(),b:new THREE.Vector3(),d:new THREE.Vector3(),w:new THREE.Vector3()};
function landStreak(){if(!LAND.on||!LAND.sky)return;
  let s=null;const now=gameMinNow();
  if(activeZoneId==='world'&&!(typeof isInterior==='function'&&isInterior())){s=landStreakStar(now);
    if(s){try{const c=cellOf(px,pz);if(nationKeyOf(c[0],c[1])!==s.isle)s=null;}catch(e){s=null;}}}
  const m=_streak||(s?landStreakMesh():null);if(!m)return;
  if(m.parent!==LAND.sky)LAND.sky.add(m);
  if(!s){m.visible=false;m.userData.star=null;return;}
  const u=(now-s.at)/STREAK.dur,head=.2+.8*u,tail=Math.max(0,head-STREAK.len);
  _sk.eye.set(px,LAND.sky.position.y,pz);
  const A=landStreakPt(s,tail,_sk.eye,_sk.a),B=landStreakPt(s,head,_sk.eye,_sk.b);
  _sk.d.subVectors(B,A);const P=m.geometry.attributes.position;
  for(const [i,p,w] of [[0,A,STREAK.wTail],[2,B,STREAK.wHead]]){_sk.w.crossVectors(_sk.d,p).normalize().multiplyScalar(w/2);
    P.setXYZ(i,p.x-_sk.w.x,p.y-_sk.w.y,p.z-_sk.w.z);P.setXYZ(i+1,p.x+_sk.w.x,p.y+_sk.w.y,p.z+_sk.w.z);}
  P.needsUpdate=true;
  m.material.uniforms.uA.value=sstep(0,.08,u)*(1-sstep(.8,1,u))*(1+.8*sstep(.55,.8,u))*(1-.85*(LAND.cloud||0));
  m.visible=true;m.userData.star=s.id;m.userData.u=u;}
// ── the post: ACES and the grade, on the open world's frame only ─────────────────────────────────────────────────
// No render targets: the grade rides in three's own ACES function, so it costs no pass and no draw call. The world scene
// turns tone mapping on for its own render and off after it, so gates and the hands keep theirs; rooms take the neutral
// curve (landRoomPost), which the grade does not touch (Session 1257: it was in the tone-mapping chunk, under every curve).
// P10b's grade: shadows a touch cool, highlights warm, saturation lifted. S2682: by the hour (OG_U.gradeA, from LAND.L): the
// warmth pushes the highlights to amber at golden hour and the shadows to blue at night, the saturation and a contrast about the
// middle move with it. A negative saturation (night, the blue hour, an overcast) drains the dark tones and spares the bright ones,
// as eyes do in the dark: the moonlit land goes blue-grey while a lamp's pool keeps its amber. OG_U.gradeB is the corruption level's (visual-foundation.md: the colour drained toward grey, the hue turned
// by a torn gate's school), LAND.drain and LAND.hue, both 0 until that card sets them. All four at zero is the S1180 grade exactly.
function landGrade(){
  const C=THREE.ShaderChunk,A='vec3 ACESFilmicToneMapping( vec3 color ) {';
  if(C.tonemapping_pars_fragment.includes('og-grade'))return;
  const i=C.tonemapping_pars_fragment.indexOf(A),j=C.tonemapping_pars_fragment.indexOf('return saturate( color );',i);if(i<0||j<0)return;
  C.tonemapping_pars_fragment=C.tonemapping_pars_fragment.slice(0,i)+
`uniform vec4 ogGradeA; uniform vec4 ogGradeB;
vec3 ogGrade( vec3 gc ) { /* og-grade */ const vec3 LW = vec3(.2126, .7152, .0722); float gl = dot(gc, LW);
	vec3 cool = vec3(.95, .985, 1.05) + vec3(-.03, -.01, .06) * max(-ogGradeA.x, 0.);
	vec3 warm = vec3(1.05, 1., .92) + vec3(.06, .005, -.09) * ogGradeA.x;
	gc *= mix(cool, warm, smoothstep(.03, .6, gl));
	gc = mix(vec3(gl), gc, 1.14 + (ogGradeA.y < 0. ? ogGradeA.y * (1. - smoothstep(.15, .55, gl)) : ogGradeA.y));
	gc = (gc - .42) * (1. + ogGradeA.w) + .42;
	if (ogGradeB.x > 0.) gc = mix(gc, vec3(dot(gc, LW)), ogGradeB.x);
	if (ogGradeB.y != 0.) { float ch = cos(ogGradeB.y), shh = sin(ogGradeB.y); vec3 k = vec3(.57735);
		gc = gc * ch + cross(k, gc) * shh + k * dot(k, gc) * (1. - ch); }
	return max(gc, 0.); }
`+C.tonemapping_pars_fragment.slice(i,j)+'return ogGrade( saturate( color ) );'+C.tonemapping_pars_fragment.slice(j+'return saturate( color );'.length);
}
function landPost(scene){
  if(!LAND.on||scene.userData.landPost)return;scene.userData.landPost=true;qualityApply();landGrade();
  const keep={tm:0,ex:1};
  scene.onBeforeRender=r=>{keep.tm=r.toneMapping;keep.ex=r.toneMappingExposure;r.toneMapping=THREE.ACESFilmicToneMapping;r.toneMappingExposure=LAND.exposure;landUniformsOn();};
  scene.onAfterRender=r=>{r.toneMapping=keep.tm;r.toneMappingExposure=keep.ex;landUniformsOff();};
  if(!LAND.rawRender){const raw=REN.render.bind(REN);LAND.rawRender=raw;REN.render=(sc2,cam)=>landRender(raw,sc2,cam);} // S1183: bloom wraps the world's frame
}
// ── the rooms' post (Session 1257, backlog I, the critic's s782): a generated room's frame tone-mapped ──────────────────
// A room drew linear and clipped: the shop's lantern (2.2) and the room's warm ambient put about 2.2 on a keeper 3.4 m off, and
// a forge or a lamp close by more, so skin and pale cloth clipped flat to yellow-white and a dark purple tunic's red channel ran
// ahead of the rest and read as bare skin. Khronos' neutral curve, not the world's ACES: it is the identity up to about 0.76 and
// rolls off above it, keeping hue, so a room keeps its brightness and its firelight's orange (ACES greyed both) and a lamp close
// by shades instead of burning out. Not the world's grade either: its saturation lift on firelight turned plaster orange.
// No bloom: a room has no target.
function landRoomPost(scene){
  if(!LAND.on||!scene||scene.userData.landPost)return;scene.userData.landPost=true;
  const keep={tm:0,ex:1};
  scene.onBeforeRender=r=>{keep.tm=r.toneMapping;keep.ex=r.toneMappingExposure;r.toneMapping=THREE.NeutralToneMapping;r.toneMappingExposure=LAND.roomExposure;};
  scene.onAfterRender=r=>{r.toneMapping=keep.tm;r.toneMappingExposure=keep.ex;};
}
// ── bloom (Session 1183): the world's frame through a render target, as the slice's composer does it ────────────────
// At Middle and High the world renders into a half-float target, its own lights unclamped (three tone-maps nothing drawn
// into a target), then a bright pass and a two-way blur at a quarter of the size, then one quad to the screen that adds the
// glow, tone-maps with ACES and grades (the same chunk the materials use) and darkens the frame's edge a little, as the slice's
// grade did. Six full-screen quads (the bright pass, four blurs, the composite), no change to the scene. Every other scene, a target someone else set, and Low take the
// direct path. REN.info counts the whole frame, so the draw-call budget reads the same.
const LAND_BLOOM={rt:null,a:null,b:null,qs:null,cam:null,quad:null,mBright:null,mBlur:null,mComp:null,size:new THREE.Vector2(),frames:0};
function landBloomSetup(){
  const B=LAND_BLOOM;if(B.qs)return;
  const vs='varying vec2 vUv;\nvoid main(){ vUv = uv; gl_Position = vec4(position.xy, 0., 1.); }';
  B.mBright=new THREE.ShaderMaterial({depthTest:false,depthWrite:false,toneMapped:false,uniforms:{tDiffuse:{value:null},uT:{value:.85}},vertexShader:vs,
    fragmentShader:'uniform sampler2D tDiffuse; uniform float uT; varying vec2 vUv;\nvoid main(){ vec3 c = texture2D(tDiffuse, vUv).rgb; float l = dot(c, vec3(.2126, .7152, .0722));\n  gl_FragColor = vec4(c * smoothstep(uT, uT + .5, l), 1.); }'});
  B.mBlur=new THREE.ShaderMaterial({depthTest:false,depthWrite:false,toneMapped:false,uniforms:{tDiffuse:{value:null},uDir:{value:new THREE.Vector2()}},vertexShader:vs,
    fragmentShader:'uniform sampler2D tDiffuse; uniform vec2 uDir; varying vec2 vUv;\nvoid main(){ vec3 c = texture2D(tDiffuse, vUv).rgb * .227;\n  c += (texture2D(tDiffuse, vUv + uDir * 1.385).rgb + texture2D(tDiffuse, vUv - uDir * 1.385).rgb) * .316;\n  c += (texture2D(tDiffuse, vUv + uDir * 3.231).rgb + texture2D(tDiffuse, vUv - uDir * 3.231).rgb) * .07;\n  gl_FragColor = vec4(c, 1.); }'});
  B.mComp=new THREE.ShaderMaterial({depthTest:false,depthWrite:false,uniforms:{tScene:{value:null},tBloom:{value:null},uK:{value:.22},uVig:{value:.3},
      ogGradeA:{value:OG_U.gradeA},ogGradeB:{value:OG_U.gradeB}},vertexShader:vs,
    fragmentShader:'uniform sampler2D tScene, tBloom; uniform float uK, uVig; varying vec2 vUv;\nvoid main(){ vec3 c = texture2D(tScene, vUv).rgb + texture2D(tBloom, vUv).rgb * uK;\n  vec2 q = vUv - .5; c *= 1. - uVig * dot(q, q) * 2.;\n  gl_FragColor = vec4(c, 1.);\n  #include <tonemapping_fragment>\n}'});
  B.quad=new THREE.Mesh(new THREE.PlaneGeometry(2,2),B.mBright);B.quad.frustumCulled=false;B.qs=new THREE.Scene();B.qs.add(B.quad);B.cam=new THREE.OrthographicCamera(-1,1,1,-1,0,1);
}
function landBloomTargets(w,h){
  const B=LAND_BLOOM;if(B.rt&&B.size.x===w&&B.size.y===h)return;B.size.set(w,h);
  for(const k of ['rt','a','b'])if(B[k])B[k].dispose();
  const o={type:THREE.HalfFloatType,depthBuffer:false};
  B.rt=new THREE.WebGLRenderTarget(w,h,{type:THREE.HalfFloatType,samples:4});
  const qw=Math.max(1,w>>2),qh=Math.max(1,h>>2);B.a=new THREE.WebGLRenderTarget(qw,qh,o);B.b=new THREE.WebGLRenderTarget(qw,qh,o);
}
function landRender(raw,s,c){
  if(!LAND.on||s!==sc||!landQ().bloom||REN.getRenderTarget()!==null)return raw(s,c);
  const B=LAND_BLOOM;landBloomSetup();const sz=_lC.v2||(_lC.v2=new THREE.Vector2());REN.getDrawingBufferSize(sz);landBloomTargets(sz.x,sz.y);
  const info=REN.info,ar=info.autoReset;if(ar)info.reset();info.autoReset=false;
  const pass=(m,to)=>{B.quad.material=m;REN.setRenderTarget(to);raw(B.qs,B.cam);};
  try{
    REN.setRenderTarget(B.rt);raw(s,c);
    B.mBright.uniforms.tDiffuse.value=B.rt.texture;pass(B.mBright,B.a);
    const qx=1/B.a.width,qy=1/B.a.height;
    for(let i=0;i<2;i++){B.mBlur.uniforms.tDiffuse.value=B.a.texture;B.mBlur.uniforms.uDir.value.set(qx*(1+i),0);pass(B.mBlur,B.b);
      B.mBlur.uniforms.tDiffuse.value=B.b.texture;B.mBlur.uniforms.uDir.value.set(0,qy*(1+i));pass(B.mBlur,B.a);}
    const tm=REN.toneMapping,ex=REN.toneMappingExposure;REN.toneMapping=THREE.ACESFilmicToneMapping;REN.toneMappingExposure=LAND.exposure;
    B.mComp.uniforms.tScene.value=B.rt.texture;B.mComp.uniforms.tBloom.value=B.a.texture;
    B.mComp.uniforms.uK.value=LAND.bloomK!=null?LAND.bloomK:.22;B.mComp.uniforms.uVig.value=LAND.vig!=null?LAND.vig:.3; /* S2682 — by the hour */
    landUniformsOn();
    try{pass(B.mComp,null);}finally{REN.toneMapping=tm;REN.toneMappingExposure=ex;landUniformsOff();}
    B.frames++;
  }finally{REN.setRenderTarget(null);info.autoReset=ar;}
}
// ── the quality levels: what each spends (item 6 of the card) ──────────────────────────────────────────────────────
// Kept with the other settings in this browser (SETTINGS.quality, 0 low, 1 middle, 2 high); the middle level is the budget's
// (v2-scope.md §5). The rows are QUALITY's (10-player.js, S1341), every drawing knob in one table; the land reads its own from it.
// Grass: blades a chunk and how many chunks out from the player's own; flowers are a share of the blades; trees: how many chunks out a tree keeps all its cards (S1515).
function landQ(){return qualityRow();}
// ── grass and wildflowers: instanced blades near the player, on one wind ────────────────────────────────────────────
// A chunk within the quality level's ring of the player's own gets its grass, built a chunk a frame and dropped when it leaves
// the ring or unloads. Blades sit in chunk-local space (the mesh at the chunk's corner), placed by a stream seeded by the chunk,
// so a chunk grows the same grass each time; they keep out of roads, site stamps, water, the steep and anything solid.
const LAND_WIND={value:0};
let _landBlade=null,_landFlower=null;
function landGrassMats(){
  if(_landBlade)return;
  const seg=4,bw=.035,pos=[],col=[],idx=[];
  for(let k=0;k<=seg;k++){const t=k/seg,w=bw*Math.pow(1-t,.9);pos.push(-w,t,0,w,t,0);const c0=[.10,.18,.05],c1=[.42,.60,.17];const c=c0.map((v,i)=>v+(c1[i]-v)*Math.pow(t,1.3));col.push(...c,...c);}
  for(let k=0;k<seg;k++){const a=k*2;idx.push(a,a+1,a+2,a+1,a+3,a+2);}
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));g.setAttribute('color',new THREE.Float32BufferAttribute(col,3));
  g.setAttribute('normal',new THREE.Float32BufferAttribute(new Array(pos.length/3).fill(0).flatMap(()=>[0,1,0]),3));g.setIndex(idx);
  const wind=(amp,f)=>`
  vec4 lwI = modelMatrix * instanceMatrix * vec4(0., 0., 0., 1.);
  float lsw = sin(uLWind * ${f} + mod(lwI.x, 628.3) * .11 + mod(lwI.z, 628.3) * .07) * .6 + sin(uLWind * ${f} * 2.3 + mod(lwI.x, 628.3) * .37) * .25;
  transformed.x += lsw * ${amp} * position.y * position.y; transformed.z += lsw * ${amp} * .5 * position.y * position.y;`;
  const m=new THREE.MeshLambertMaterial({vertexColors:true,side:THREE.DoubleSide});
  m.onBeforeCompile=s=>{s.uniforms.uLWind=LAND_WIND;s.vertexShader='uniform float uLWind;\n'+s.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>'+wind('.22','1.4'));};
  m.customProgramCacheKey=()=>'og-land-grass';
  _landBlade={geo:g,mat:m};
  const fg=new THREE.IcosahedronGeometry(.035,0).scale(1,.55,1);
  const fm=new THREE.MeshLambertMaterial({});
  _landFlower={geo:fg,mat:fm};
}
const LAND_FLOWERS=[[.62,.38,.78],[.78,.44,.70],[.96,.95,.90],[.98,.82,.20],[.85,.20,.18]]; // heather, foxglove, campion, buttercup, poppy
function landGrassChunk(ch){
  const Q=landQ();if(!Q.grass)return;
  landGrassMats();
  const ox=ch.cx*CHUNK,oz=ch.cz*CHUNK;let s=(Math.imul(ch.cx|0,73856093)^Math.imul(ch.cz|0,19349663)^0x5bd1e995)>>>0;
  const r=()=>{s=(s+0x6D2B79F5)>>>0;let t=s;t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return((t^(t>>>14))>>>0)/4294967296;};
  const N=Q.grass,F=Math.round(N*Q.flowers);
  const gm=new THREE.InstancedMesh(_landBlade.geo,_landBlade.mat,N),fl=F?new THREE.InstancedMesh(_landFlower.geo,_landFlower.mat,F):null;
  const M=new THREE.Matrix4(),q=new THREE.Quaternion(),sc=new THREE.Vector3(),p=new THREE.Vector3(),c=new THREE.Color(),up=new THREE.Vector3(0,1,0);
  // where grass may grow, once a vertex (289 tests, not one per blade): green ground by the chunk's own vertex colour (no sand,
  // rock, verge or snow), above the water, not steep, off roads, out of stamps and solids. A blade between four good vertices
  // grows; one beside a bad vertex is tested exactly. Heights come from the chunk's own mesh, so a blade stands on what is drawn.
  const T=ch.terrain.attributes,P=T.position,col=T.color,NR=T.normal,V=SEGS+1,G=CHUNK/SEGS,ok=new Uint8Array(V*V);
  for(let j=0;j<V;j++)for(let i=0;i<V;i++){const vi=j*V+i,x=ox+i*G,z=oz+j*G,h=P.getY(vi),cr=col.getX(vi),cg=col.getY(vi),cb=col.getZ(vi);
    if(h<SEA_Y+.35||NR.getY(vi)<.82||cg<=Math.max(cr,cb)*.95||cr+cg+cb>1.9)continue;
    const ri=roadInfo(x,z);if(ri&&ri.d<ROAD_HALF+.6)continue;if(stampAt(x,z)||solidAt(x,z))continue;ok[vi]=1;}
  // S1573 (Michael's C on #855) — the chunk's herbs, lifted: no blade inside a herb's own spread, and short in a 0.35 m ring round it
  const HB=(ch.herbs||[]).filter(h=>!h.bed&&h.spread).map(h=>[h.x-ox,h.z-oz,h.spread*.5]);
  let n=0,f=0,tries=0;
  while(n<N&&tries<N*3){tries++;
    const lx=r()*CHUNK,lz=r()*CHUNK,x=ox+lx,z=oz+lz,i0=Math.min(SEGS-1,Math.floor(lx/G)),j0=Math.min(SEGS-1,Math.floor(lz/G)),u=lx/G-i0,v=lz/G-j0;
    const a00=j0*V+i0,a10=a00+1,a01=a00+V,a11=a01+1,good=ok[a00]+ok[a10]+ok[a01]+ok[a11];
    if(!good)continue;
    if(good<4){const ri=roadInfo(x,z);if(ri&&ri.d<ROAD_HALF+.6)continue;if(stampAt(x,z)||solidAt(x,z))continue;if(!ok[u<.5?(v<.5?a00:a01):(v<.5?a10:a11)])continue;}
    const h00=P.getY(a00),h10=P.getY(a10),h01=P.getY(a01),h11=P.getY(a11); // the quad's two triangles, split as PlaneGeometry splits it
    const h=u+v<1?h00+u*(h10-h00)+v*(h01-h00):h11+(1-u)*(h01-h11)+(1-v)*(h10-h11);
    const clump=.55+.9*Math.max(0,_smoothNoise(x,z,SEED+71,6)-.2);if(r()>clump*.9)continue;
    let near=9;for(let k=0;k<HB.length;k++){const b=HB[k],dx=lx-b[0],dz=lz-b[1];if(Math.abs(dx)<1&&Math.abs(dz)<1)near=Math.min(near,Math.hypot(dx,dz)-b[2]);}if(near<0)continue;
    p.set(lx,h-.02,lz);q.setFromAxisAngle(up,r()*Math.PI);const hh=(.16+r()*.3)*clump*(near<.35?.25+near:1);sc.set(1+r()*.6,hh,1);
    M.compose(p,q,sc);gm.setMatrixAt(n,M);
    const dry=sstep(.3,.8,_smoothNoise(x,z,SEED+72,18));c.setRGB(1-.1*r(),1-.12*dry,1-.45*dry-.1*r());gm.setColorAt(n,c);n++;
    if(fl&&f<F&&_smoothNoise(x,z,SEED+73,11)>.55&&r()<.5){const kr=r(),kind=kr<.38?0:kr<.5?1:kr<.74?2:kr<.95?3:4;
      p.set(lx,h+.18+r()*.4,lz);sc.setScalar(.7+r()*.6);M.compose(p,q,sc);fl.setMatrixAt(f,M);c.setRGB(...LAND_FLOWERS[kind]);fl.setColorAt(f,c);f++;}}
  gm.count=n;gm.position.set(ox,0,oz);gm.receiveShadow=true;gm.userData.landGrass=true;gm.frustumCulled=true;
  gm.computeBoundingSphere();
  ch.landGrass={grass:gm,flowers:fl,q:Q.name};ch.group.add(gm);
  if(fl){fl.count=f;fl.position.set(ox,0,oz);fl.userData.landGrass=true;fl.computeBoundingSphere();ch.group.add(fl);}
}
function landGrassDrop(ch){const G=ch.landGrass;if(!G)return;for(const m of [G.grass,G.flowers])if(m){ch.group.remove(m);m.dispose();}ch.landGrass=null;}
// per frame from the world's tick: the wind, and one chunk's grass built or dropped
function landTick(dt){
  if(!LAND.on||!sc)return;
  LAND_WIND.value=(performance.now()*.001)%1000;
  const Q=landQ(),cx=Math.floor(px/CHUNK),cz=Math.floor(pz/CHUNK);let built=0;
  for(const ch of chunks.values()){if(ch.group)landTreeRing(ch);const near=Q.grass&&Math.abs(ch.cx-cx)<=Q.ring&&Math.abs(ch.cz-cz)<=Q.ring;
    if(ch.landGrass&&(!near||ch.landGrass.q!==Q.name))landGrassDrop(ch);
    if(near&&!ch.landGrass&&built<1){landGrassChunk(ch);built++;}}
}
// the level changed in the settings sheet: the sun's shadow map now, the grass as the next frames rebuild it
function landQuality(){
  if(!LAND.on||!sun)return;const Q=landQ();
  if(LAND.sky&&(!LAND.clouds?Q.clouds:LAND.clouds.userData.q!==Q.name))landClouds();
  if(sun.shadow.mapSize.x!==Q.shadow){sun.shadow.mapSize.set(Q.shadow,Q.shadow);if(sun.shadow.map){sun.shadow.map.dispose();sun.shadow.map=null;}}
}
// ── the first-run probe (S1352; streaming-and-quality-build.md, Michael's B on #543) ───────────────────────────────
// Once in this browser, on the first entry to the world on the new look, the probe times the machine and may set Low; it never
// picks Middle or High over a lower level and never runs again once it has decided (SETTINGS.qualityProbed, kept in og.settings
// with the level, never in a save). It waits for the world to settle (no chunk queued, no cell job, no body building; 15 s at
// most), skips 30 frames (the first sight compiles programs), then takes the median of the next 120 frame times from the clock.
// A frame over 250 ms, or one while the tab is hidden or a panel is open, is not the machine's and is dropped; with fewer than 60
// kept 10 s after it began measuring it gives up undecided and tries again on the next entry. Over 28 ms (under about 36 fps)
// sets Low. Moving the Quality row first marks it probed. Under a webdriver (the suites) it runs only when forced; `o.ms` holds
// every frame time at one value, for the suite.
const QPROBE={on:false,clock:0,settled:-1,measure:0,last:0,skip:0,ft:[],held:null,median:null,result:null};
function qualityProbe(o){o=o||{};const P=QPROBE;
  if(!LAND.on||SETTINGS.qualityProbed||P.on)return false;
  if(navigator.webdriver&&!o.force)return false;
  Object.assign(P,{on:true,clock:0,settled:-1,measure:0,last:performance.now(),skip:30,ft:[],held:o.ms!=null?o.ms:null,median:null,result:null});return true;}
function qualityProbeAway(){return document.hidden||!started||dead||invOpen||shopOpen||lootOpen||stashOpen||hubOpen||dlgOpen||(typeof isBookOpen==='function'&&isBookOpen());}
function qualityProbeTick(){const P=QPROBE;if(!P.on)return;
  if(SETTINGS.qualityProbed){P.on=false;P.result='moved';return;}
  const now=performance.now(),ms=P.held!=null?P.held:now-P.last;P.last=now;P.clock+=ms;
  if(P.settled<0){const busy=buildQueue.length||JOBS.length||(typeof HBODY!=='undefined'&&HBODY.job);if(busy&&P.clock<15000)return;P.settled=P.clock;return;}
  if(P.skip>0){P.skip--;return;}
  if(!P.measure)P.measure=P.clock;
  if(ms<=250&&!qualityProbeAway())P.ft.push(ms);
  if(P.ft.length>=120)qualityProbeEnd(true);
  else if(P.clock-P.measure>10000&&P.ft.length<60)qualityProbeEnd(false);}
function qualityProbeEnd(decided){const P=QPROBE;P.on=false;
  if(!decided){P.result='undecided';return null;}
  const s=P.ft.slice().sort((a,b)=>a-b);P.median=s[s.length>>1];SETTINGS.qualityProbed=true;
  if(P.median>28&&SETTINGS.quality>0){SETTINGS.quality=0;settingsSave();qualityApply();showMsg('Set to Low for this machine. Settings can change it.');P.result='low';}
  else{settingsSave();P.result='kept';}
  return P.result;}
// ── the clouds: painted cumulus heaps, in one draw call ──────────────────────────────────────────────────────────
// Each heap is a few dozen puffs, one instanced quad turned to face the eye in the vertex shader, so a sky of 30 heaps is one draw
// call, not two thousand sprites. The heaps ride with the dome (they are scenery at the sky's distance, not places) and drift with
// the wind; the quality level sets the count. S2682 (the light-and-grade card): they were round cotton puffs, lit by their height
// alone. Now each puff is a lumpy blob, shaded by the sun as part of its heap (the heap's own roundness, out from its centre and up
// at its top, with a little of the puff's), so a heap has one lit side and one shadow side with a painted, soft-edged terminator between; the heap is cut flat at its base (cumulus sit on a level, the
// condensation height) and darkest there; a sun behind it lights its edge (the silver lining); every puff varies a little in tone.
// Colours come from LAND.L each frame (landAtmosphere): lit tops in the sun's colour, the shade in the sky's, so they go gold and
// violet at a low sun, grey under an overcast (and swell, uGrow) and dark blue at night.
let _landPuff=null;
function landPuffTex(){if(_landPuff)return _landPuff;const N=128,c=document.createElement('canvas');c.width=c.height=N;const x=c.getContext('2d');
  let s=0x51ed27;const r=()=>{s=(s*1103515245+12345)>>>0;return((s>>>8)&0xffff)/65536;};
  x.globalCompositeOperation='lighter';
  for(let i=0;i<11;i++){const a=r()*Math.PI*2,d=r()*N*.2,cx=N/2+Math.cos(a)*d,cy=N/2+Math.sin(a)*d*.8,R=N*(.16+r()*.16),g=x.createRadialGradient(cx,cy,R*.1,cx,cy,R);
    g.addColorStop(0,'rgba(255,255,255,.75)');g.addColorStop(.6,'rgba(255,255,255,.5)');g.addColorStop(1,'rgba(255,255,255,0)');x.fillStyle=g;x.fillRect(0,0,N,N);}
  x.globalCompositeOperation='destination-in';const m=x.createRadialGradient(N/2,N/2,N*.3,N/2,N/2,N*.5);m.addColorStop(0,'rgba(0,0,0,1)');m.addColorStop(1,'rgba(0,0,0,0)');x.fillStyle=m;x.fillRect(0,0,N,N);
  _landPuff=new THREE.CanvasTexture(c);return _landPuff;}
function landClouds(){
  if(LAND.clouds){LAND.sky.remove(LAND.clouds);LAND.clouds.dispose();LAND.clouds=null;}
  const Q=landQ();if(!Q.clouds)return;
  let s=0x9e3779b9;const r=()=>{s=(s+0x6D2B79F5)>>>0;let t=s;t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return((t^(t>>>14))>>>0)/4294967296;};
  const list=[],per=Q.clouds>=30?34:Q.clouds>=14?26:18;
  for(let k=0;k<Q.clouds;k++){const a=r()*Math.PI*2,d=900+r()*1500,cx=Math.sin(a)*d,cz=Math.cos(a)*d,cy=330+r()*220+d*.05,size=90+r()*170,tall=.55+r()*.6,hk=r();
    const N=per+Math.floor(r()*per*.6);
    for(let i=0;i<N;i++){const ox=(r()-.5)*size*2.2,oz=(r()-.5)*size*1.2,dome=Math.max(0,1-Math.pow(ox/(size*1.1),2)-Math.pow(oz/(size*.62),2));
      const oy=Math.sqrt(dome)*size*tall*(.5+r()*.6),hn=Math.min(1,oy/(size*tall*.9));
      list.push([cx+ox,cy+oy,cz+oz,size*(.5+r()*.34)*(1.25-.4*hn),hn,ox/size,oz/size,cy,hk]);}}
  const mat=new THREE.ShaderMaterial({transparent:true,depthWrite:false,fog:false,
    uniforms:{uMap:{value:landPuffTex()},uLo:{value:new THREE.Color()},uHi:{value:new THREE.Color()},uRim:{value:new THREE.Color()},uSunV:{value:new THREE.Vector3(0,1,0)},uSun:LAND.skyMat.uniforms.uSun,
      uOp:{value:.9},uGrow:{value:1},uCover:{value:1},ogGradeA:{value:OG_U.gradeA},ogGradeB:{value:OG_U.gradeB}},
    vertexShader:`attribute vec4 aPuff; attribute float aHeap; varying vec2 vUv; varying vec4 vP; varying float vH; varying float vJ; varying float vK;
void main(){ vUv = uv; vP = aPuff; vK = aHeap; vec4 c = modelViewMatrix * vec4(instanceMatrix[3].xyz, 1.); float sz = length(instanceMatrix[0].xyz) * uGrow;
  vec2 o = position.xy * sz; c.xy += o;
  vec3 upV = (viewMatrix * vec4(0., 1., 0., 0.)).xyz;
  vH = (modelMatrix * vec4(instanceMatrix[3].xyz, 1.)).y + dot(vec3(o, 0.), upV) - modelMatrix[3][1];
  vJ = fract(sin(float(gl_InstanceID) * 12.9898) * 43758.5453);
  gl_Position = projectionMatrix * c; }`.replace('void main','uniform float uGrow;\nvoid main'),
    fragmentShader:`uniform sampler2D uMap; uniform vec3 uLo, uHi, uRim, uSunV, uSun; uniform float uOp, uCover; varying vec2 vUv; varying vec4 vP; varying float vH; varying float vJ; varying float vK;
${LAND_NOISE}
void main(){ float base = vP.w; vec2 q = vUv * 2. - 1.;
  float ta = texture2D(uMap, vUv).a, er = lvn(q * 2.6 + vJ * 37.) * .6 + lvn(q * 6.1 + vJ * 11.) * .4;
  float a = smoothstep(.04, .7, ta * (.35 + 1.1 * er)) * uOp * smoothstep(base - 6., base + 26., vH) * (1. - smoothstep(uCover - .06, uCover, vK)); if (a < .01) discard; vec3 n = normalize(vec3(q * .9, sqrt(max(0., 1. - dot(q, q) * .81))));
  vec3 nh = normalize(vec3(vP.y, vP.x * 1.4 - .35, vP.z)), nw = (vec4(n, 0.) * viewMatrix).xyz;
  vec3 S = normalize(uSunV); float lit = .5 + .5 * dot(normalize(nh + nw * .18), normalize(uSun));
  float shade = smoothstep(.22, .78, lit * .7 + vP.x * .45 - .08 + (er - .5) * .12);
  vec3 c = mix(uLo, uHi, shade);
  c += uRim * pow(clamp(1. - n.z, 0., 1.), 2.) * max(-S.z, 0.) * max(dot(normalize(q + 1e-4), normalize(S.xy + 1e-4)), 0.);
  c *= (.8 + .2 * smoothstep(base, base + 70., vH)) * (.95 + .1 * vJ);
  gl_FragColor = vec4(c, a);
  #include <tonemapping_fragment>
}`});
  const geo=new THREE.PlaneGeometry(1,1),im=new THREE.InstancedMesh(geo,mat,list.length),M=new THREE.Matrix4(),pf=new Float32Array(list.length*4),hf=new Float32Array(list.length);
  list.forEach((p,i)=>{M.makeScale(p[3],p[3],p[3]).setPosition(p[0],p[1],p[2]);im.setMatrixAt(i,M);pf[i*4]=p[4];pf[i*4+1]=p[5];pf[i*4+2]=p[6];pf[i*4+3]=p[7];hf[i]=p[8];});
  geo.setAttribute('aPuff',new THREE.InstancedBufferAttribute(pf,4));geo.setAttribute('aHeap',new THREE.InstancedBufferAttribute(hf,1));
  im.onBeforeRender=(rn,sc2,cam)=>{mat.uniforms.uSunV.value.copy(LAND.skyMat.uniforms.uSun.value).transformDirection(cam.matrixWorldInverse);};
  im.frustumCulled=false;im.renderOrder=-4;im.userData.puffs=list.length;im.userData.q=Q.name;
  LAND.clouds=im;LAND.sky.add(im);
}
// ── trees: leaf cards around clumps, normals turned out from the crown (item 3, Session 1182) ──────────────────────────
// The scatter decides every tree as before (where, which species, its size, girth, turn and tint, its collider and its tree
// point; S533: keyed by the hash and the cell), and the new look only draws it differently: for the leafy kinds and the conifers,
// the slice's kit in place of the low-poly crown. Leaves are cards around clumps, their normals turned out from the crown's
// centre so the canopy shades as one soft volume, shaded darker inside and on the side away from the light; conifers stack their
// clumps in a cone. The trunk is in the same mesh and the same material (its bark is a patch of the leaf texture), so a species
// in a chunk is still one draw call. A template is sized to the prototype it replaces (its height and its spread), so a tree
// covers what it covered. Dead trees, scrub and mushrooms keep their old shapes.
const LAND_TREE_KIT={broadleaf:'broad',oak:'oak',willow:'broad',autumn:'broad',autumnRed:'broad',autumnGold:'broad',oakAutumn:'oak',
  birch:'birch',birchAutumn:'birch',conifer:'cone',spruce:'cone',pine:'pine'};
// S2076 — the snowpine keeps its own shape on the new look (the old low-poly tiers, whose snow lies on the needles: S522, Michael's note).
// The cone kit drew it as rounded masses of green cards with a tall bare trunk; from under it and beside the Mark's places it read as a
// summer broadleaf in the snow (the critic, 10 Nov), beside the places' own snowed spruce. The kit's other conifers are unchanged.
const LAND_LEAVES={green:[88,110,42,60,30,66],autumn:[14,46,62,82,34,62],birch:[70,92,40,58,40,72],needle:[90,122,32,48,34,54]}; // hue, sat and light ranges
const LAND_LEAF_PAL={autumn:'autumn',autumnRed:'autumn',autumnGold:'autumn',oakAutumn:'autumn',birchAutumn:'autumn',birch:'birch',conifer:'needle',spruce:'needle',pine:'needle',snowpine:'needle'};
const _landTreeMat={},_landTreeGeo={};
function landLeafTex(pal){
  const P=LAND_LEAVES[pal],c=document.createElement('canvas');c.width=c.height=256;const x=c.getContext('2d');let s=pal.length*7919;
  const r=()=>{s=(s*16807)%2147483647;return(s-1)/2147483646;};
  const N=pal==='needle'?340:260;
  for(let i=0;i<N;i++){const a=r()*Math.PI*2,rr=Math.sqrt(r())*100,cx=128+Math.cos(a)*rr,cy=128+Math.sin(a)*rr*.9,sz=pal==='needle'?6+r()*5:10+r()*9;
    x.save();x.translate(cx,cy);x.rotate(r()*Math.PI*2);x.fillStyle=`hsl(${P[0]+r()*(P[1]-P[0])},${P[2]+r()*(P[3]-P[2])}%,${P[4]+r()*(P[5]-P[4])}%)`;
    x.beginPath();x.ellipse(0,0,sz,sz*(pal==='needle'?.28:.55),0,0,Math.PI*2);x.fill();x.restore();}
  x.fillStyle=pal==='birch'?'#dcd8cc':'#6a5038';x.fillRect(228,228,28,28); // the bark's patch, where the trunk's UVs point
  const t=new THREE.CanvasTexture(c);t.anisotropy=4;return t;
}
function landTreeMat(pal){
  if(_landTreeMat[pal])return _landTreeMat[pal];
  const map=landLeafTex(pal);
  const m=new THREE.MeshLambertMaterial({map,alphaTest:.42,side:THREE.DoubleSide,vertexColors:true});
  m.onBeforeCompile=s=>{s.uniforms.uLWind=LAND_WIND;s.vertexShader='uniform float uLWind;\n'+s.vertexShader.replace('#include <begin_vertex>',`#include <begin_vertex>
  { vec4 lwI = modelMatrix * instanceMatrix * vec4(0., 0., 0., 1.);
    float lsw = sin(uLWind * .9 + mod(lwI.x, 628.3) * .11 + mod(lwI.z, 628.3) * .07) * .6 + sin(uLWind * 2.07 + mod(lwI.x, 628.3) * .37) * .25;
    transformed.x += lsw * .0035 * position.y * position.y; transformed.z += lsw * .0018 * position.y * position.y; }`);
    s.fragmentShader=s.fragmentShader.replace('#include <normal_fragment_begin>','#include <normal_fragment_begin>\n normal = normalize(vNormal);');};
  m.customProgramCacheKey=()=>'og-land-tree';
  const depth=new THREE.MeshDepthMaterial({depthPacking:THREE.RGBADepthPacking,map,alphaTest:.42});
  return(_landTreeMat[pal]={mat:m,depth});
}
// one template a kind of kit and prototype, built to the prototype's own height and spread. The far one (S1515, the budget's
// triangles at Dunmore) lays the same clumps with fewer, larger cards on a four-sided trunk: 88 triangles a broadleaf against
// 204, 200 a conifer against 444. A chunk past the level's ring (`trees` in QUALITY) draws it; `landTick` swaps as you walk.
function landTreeGeo(sp,far){
  const key=far?sp+'|far':sp;if(_landTreeGeo[key])return _landTreeGeo[key];
  const kit=LAND_TREE_KIT[sp],pg=PROTO[sp];if(!pg.boundingBox)pg.computeBoundingBox();const B=pg.boundingBox;
  const H=Math.max(2,B.max.y),R=Math.max(1,Math.max(-B.min.x,B.max.x,-B.min.z,B.max.z));
  let s=0;for(const ch of sp)s=(s*31+ch.charCodeAt(0))>>>0;s=s%2147483646+1;const r=()=>{s=(s*16807)%2147483647;return(s-1)/2147483646;};
  const pos=[],nor=[],uv=[],col=[],idx=[];
  const cone=kit==='cone'||kit==='pine';
  // the trunk: a tapered prism up into the crown, its UVs on the bark patch
  const tH=kit==='pine'?H*.72:cone?H*.6:kit==='birch'?H*.62:H*.5,tR=Math.min(R*.06,H*.026)*(kit==='oak'?1.35:kit==='birch'?.8:1),SEG=far?4:6;
  {const b=pos.length/3;for(let k=0;k<=1;k++)for(let i=0;i<SEG;i++){const a=i/SEG*Math.PI*2,rr=tR*(k?.55:1),y=k?tH:-.3;pos.push(Math.cos(a)*rr,y,Math.sin(a)*rr);nor.push(Math.cos(a),0,Math.sin(a));uv.push(.95,.045);const g=k?.9:.55;col.push(g,g,g);}
    for(let i=0;i<SEG;i++){const a=b+i,b2=b+(i+1)%SEG,c=a+SEG,d=b2+SEG;idx.push(a,c,b2,b2,c,d);}}
  // the crown's clumps
  const cl=[];
  if(cone){const tiers=kit==='pine'?3:6,base=kit==='pine'?H*.62:H*.22;
    for(let t=0;t<tiers;t++){const f=t/(tiers-1),y=base+(H-base)*f*.92,rad=R*(kit==='pine'?.8-.3*f:1-f*.85),n=Math.max(1,Math.round((kit==='pine'?4:6)*(1-f*.7)));
      for(let i=0;i<n;i++){const a=i/n*Math.PI*2+r();cl.push([Math.cos(a)*rad*.5,y,Math.sin(a)*rad*.5,Math.max(.5,rad*.55)]);}}
    cl.push([0,H*.94,0,R*.18]);}
  else{const cy=kit==='birch'?H*.68:H*.62,cr=Math.min(R*.95,(H-cy)*1.4+R*.2),n=kit==='oak'?8:kit==='birch'?6:7;
    for(let i=0;i<n;i++){const a=i/n*Math.PI*2+r(),rr=cr*(.35+.25*r());cl.push([Math.cos(a)*rr,cy+(r()-.3)*cr*(kit==='birch'?.9:.6),Math.sin(a)*rr,cr*(.5+.2*r())]);}
    cl.push([0,Math.min(H-cr*.35,cy+cr*.4),0,cr*.62]);}
  const ctrY=cone?H*.55:(kit==='birch'?H*.68:H*.62),q=new THREE.Quaternion(),e=new THREE.Euler(),v=new THREE.Vector3(),nv=new THREE.Vector3(),cv=new THREE.Vector3();
  const per=far?(cone?4:5):(cone?9:12),grow=far?1.35:1;
  for(const [cx,cy,cz,cr] of cl)for(let i=0;i<per;i++){
    const d=new THREE.Vector3(r()-.5,(r()-.5)*(cone?.5:1),r()-.5).normalize(),p=new THREE.Vector3(cx,cy,cz).addScaledVector(d,cr*(.5+.5*Math.sqrt(r())));
    e.set(r()*6.3,r()*6.3,r()*6.3);q.setFromEuler(e);const sz=cr*(cone?1.1:1.05)*(.8+.4*r())*grow,b=pos.length/3;
    for(const [a,bb,uu,vv] of [[-1,-1,0,0],[1,-1,.88,0],[1,1,.88,.88],[-1,1,0,.88]]){v.set(a*sz*.5,bb*sz*.5,0).applyQuaternion(q).add(p);pos.push(v.x,v.y,v.z);
      nv.set(v.x,(v.y-ctrY)*(cone?.6:1),v.z).normalize().multiplyScalar(.7).add(cv.set(v.x-cx,v.y-cy,v.z-cz).normalize().multiplyScalar(.3)).normalize();nor.push(nv.x,nv.y,nv.z);uv.push(uu,vv);
      const ao=(cone?.56:.42)+(cone?.44:.58)*sstep(-H*.25,H*.3,v.y-ctrY+(v.x*.35+v.z*.2));col.push(ao,ao,ao);}
    idx.push(b,b+1,b+2,b,b+2,b+3);}
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));g.setAttribute('normal',new THREE.Float32BufferAttribute(nor,3));
  g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));g.setAttribute('color',new THREE.Float32BufferAttribute(col,3));g.setIndex(idx);g.computeBoundingSphere();
  return(_landTreeGeo[key]=g);
}
// from scatterChunk, for one species' list in a chunk: the same matrices, tints and colliders `place` would make; false: not ours
function landTrees(group,list,sp,tint,solR,sol){
  if(!LAND.on||!LAND_TREE_KIT[sp]||!PROTO[sp]||!list.length)return false;
  const far=landTreeFar(Math.floor(list[0].x/CHUNK),Math.floor(list[0].z/CHUNK));
  const T=landTreeMat(LAND_LEAF_PAL[sp]||'green'),im=new THREE.InstancedMesh(landTreeGeo(sp,far),T.mat,list.length);
  const m4=new THREE.Matrix4(),q=new THREE.Quaternion(),e=new THREE.Euler(),v=new THREE.Vector3(),s3=new THREE.Vector3(),c=new THREE.Color();
  list.forEach((t,i)=>{e.set(0,t.r,0);q.setFromEuler(e);v.set(t.x,t.h,t.z);s3.set(t.s*(t.g||1),t.s*(t.sy||1),t.s*(t.g||1));m4.compose(v,q,s3);im.setMatrixAt(i,m4);
    tint(t,c);if(sp==='snowpine')c.lerp(_lC.tmp.setRGB(1.25,1.28,1.32),.35);im.setColorAt(i,c);
    if(solR)sol.push({cx:t.x,cz:t.z,rx:solR*t.s*(t.g||1),rz:solR*t.s*(t.g||1),tid:t.id});}); /* tid: the tree it is, for felling (S1511) */
  im.instanceMatrix.needsUpdate=true;if(im.instanceColor)im.instanceColor.needsUpdate=true;
  im.customDepthMaterial=T.depth;im.castShadow=true;im.receiveShadow=false; /* a crown in its own shadow map went near black; its normals already shade it as one volume */ im.userData.scatter=sp;im.userData.landTree=true;im.userData.far=far;im.frustumCulled=true;
  im.computeBoundingSphere();group.add(im);return true;
}
// is a chunk past the level's near ring of the player's own (in chunks, as the grass's ring)
function landTreeFar(cx,cz){const R=landQ().trees;return R!=null&&Math.max(Math.abs(cx-Math.floor(px/CHUNK)),Math.abs(cz-Math.floor(pz/CHUNK)))>R;}
// a chunk's trees take the template its ring calls for; a geometry is shared, so a swap is two assignments
function landTreeRing(ch){const far=landTreeFar(ch.cx,ch.cz);if(ch.landTreeFar===far)return;ch.landTreeFar=far;
  for(const o of ch.group.children)if(o.userData.landTree&&o.userData.far!==far){o.geometry=landTreeGeo(o.userData.scatter,far);o.userData.far=far;}}
