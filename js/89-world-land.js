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
const LAND={on:window.OG_LOOK==='new',mat:null,sky:null,skyMat:null,exposure:1,
  // the land's albedo against the old look's (whose detail map averaged .72), how near the fields come, and the soil's darkening
  // under the near ground; a uniform, so a later quality level or the corruption level can move it without a recompile
  k:{value:new THREE.Vector4(.5,22,.8,0)}};
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
    const away=sstep(ROAD_BLEND,ROAD_BLEND+14,rd)*(st?0:1)*sstep(2.5,7,h);
    m.setXYZ(i,st?1:0,Math.min(1,wood*1.2)*sstep(1.6,4,h),Math.min(1,field)*away);}
  m.needsUpdate=true;
}
function landTerrainMat(){
  const m=new THREE.MeshLambertMaterial({vertexColors:true});
  m.onBeforeCompile=s=>{
    s.uniforms.uLandK=LAND.k;
    s.vertexShader='attribute vec3 aMask;\nvarying vec3 vLW;\nvarying vec3 vLN;\nvarying vec3 vLMask;\n'+s.vertexShader.replace('#include <begin_vertex>',
      '#include <begin_vertex>\n vLW = (modelMatrix * vec4(position, 1.)).xyz; vLN = normalize(mat3(modelMatrix) * normal); vLMask = aMask;');
    s.fragmentShader='uniform vec4 uLandK;\nvarying vec3 vLW;\nvarying vec3 vLN;\nvarying vec3 vLMask;\n'+LAND_NOISE+`
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
`+s.fragmentShader.replace('#include <color_fragment>','#include <color_fragment>\n diffuseColor.rgb = landCol(vColor);');
    LAND.terrainShader=s;};
  m.customProgramCacheKey=()=>'og-land-terrain';
  LAND.mat=m;return m;
}
// ── the sky: a gradient dome, the sun's glow and the haze at its foot ────────────────────────────────────────────
function landSky(){
  const mat=new THREE.ShaderMaterial({side:THREE.BackSide,depthWrite:false,fog:false,
    uniforms:{uZen:{value:new THREE.Color()},uMid:{value:new THREE.Color()},uHor:{value:new THREE.Color()},uGlow:{value:new THREE.Color()},
      uSun:{value:new THREE.Vector3(0,1,0)},uGlowK:{value:.35},uDisc:{value:1}},
    vertexShader:'varying vec3 vD;\nvoid main(){ vD = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }',
    fragmentShader:`uniform vec3 uZen, uMid, uHor, uGlow, uSun; uniform float uGlowK, uDisc; varying vec3 vD;
void main(){ vec3 d = normalize(vD); float y = max(d.y, 0.);
  vec3 c = mix(uHor, uMid, smoothstep(0., .2, y)); c = mix(c, uZen, smoothstep(.16, .8, y));
  float sd = max(dot(d, normalize(uSun)), 0.);
  c += uGlow * (pow(sd, 6.) * uGlowK + pow(sd, 48.) * uGlowK * .8 + pow(sd, 1600.) * 6. * uDisc);
  c = mix(c, uHor * .92, smoothstep(0., -.1, d.y));
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
  sh.vertexShader='varying vec3 vLWW;\n'+sh.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\n vLWW = (modelMatrix * vec4(position, 1.)).xyz;');
  sh.fragmentShader='uniform vec3 uLSky; uniform vec3 uLSun; uniform float uLGlint; varying vec3 vLWW;\n'+LAND_NOISE+sh.fragmentShader.replace('#include <opaque_fragment>',`
  { vec2 p = vLWW.xz; float e = .9;
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
// ── per frame, at the end of atmosphere(): the dome's colours from the world's own sky, fog and clock ────────────
const _lC={zen:new THREE.Color(),mid:new THREE.Color(),hor:new THREE.Color(),glow:new THREE.Color(),tmp:new THREE.Color(),
  // the slice's clear day (P10b: a deep, saturated zenith over a pale warm horizon), the low sun's warmth, an overcast's grey
  dZen:new THREE.Color(.13,.33,.72),dMid:new THREE.Color(.36,.58,.88),dHor:new THREE.Color(.78,.85,.92),
  warm:new THREE.Color(1,.6,.32),grey:new THREE.Color(.62,.65,.68),greyZ:new THREE.Color(.5,.53,.57)};
function landAtmosphere(){
  if(!LAND.on||!LAND.skyMat)return;
  const U=LAND.skyMat.uniforms,bg=sc.background,fog=sc.fog.color;
  const hr=(typeof gameHour==='function')?gameHour():12,t=(typeof _nightFactor==='function')?_nightFactor():0;
  const dayAng=Math.PI*(hr-6)/12,el=Math.sin(dayAng),az=-.6+Math.cos(dayAng)*.9,c=Math.sqrt(Math.max(0,1-el*el));
  U.uSun.value.set(Math.sin(az)*c,el,Math.cos(az)*c);
  // the weather's curtain, as skyBodies reads it
  const cur=WX.type,nxt=WX.next,wk=(nxt!==cur)?WX.k:0,amt=k=>(cur===k?1:0)*(1-wk)+(nxt===k?1:0)*wk;
  const cloud=Math.min(1,amt('overcast')*.75+amt('rain')*.9+amt('storm')+amt('snow')*.85+amt('fog')*.95);
  const low=sstep(.42,.02,el)*sstep(-.14,.02,el)*(1-cloud);
  // day: the palette, greyed by cloud and warmed by a low sun; night: the world's own night sky (sc.background has eased to it)
  _lC.zen.copy(_lC.dZen).lerp(_lC.greyZ,cloud);_lC.mid.copy(_lC.dMid).lerp(_lC.grey,cloud);_lC.hor.copy(_lC.dHor).lerp(_lC.grey,cloud);
  _lC.hor.lerp(_lC.warm,low*.6);_lC.mid.lerp(_lC.warm,low*.22);_lC.zen.lerp(_lC.tmp.setRGB(.2,.24,.5),low*.35);
  const n=sstep(.05,.85,t);
  _lC.zen.lerp(_lC.tmp.copy(bg).multiplyScalar(.7),n);_lC.mid.lerp(bg,n);_lC.hor.lerp(_lC.tmp.copy(bg).lerp(fog,.5).multiplyScalar(1.2),n);
  // the dome's foot meets the world's haze, so the far land fades into the sky with no seam
  _lC.hor.lerp(fog,.25);
  U.uZen.value.copy(_lC.zen);U.uMid.value.copy(_lC.mid);U.uHor.value.copy(_lC.hor);
  _lC.glow.setRGB(1,.82-.25*low,.55-.3*low).multiplyScalar((1-t)*(1-cloud*.8));
  U.uGlow.value.copy(_lC.glow);U.uGlowK.value=.3+.35*low;U.uDisc.value=SKY.sun?SKY.sun.material.opacity:0;
  LAND.sky.position.set(px,worldH(px,pz)-60,pz);
  if(LAND.waterSky){LAND.waterSky.value.copy(_lC.mid).lerp(_lC.hor,.5);LAND.waterSun.value.copy(U.uSun.value);LAND.waterGlint.value=Math.max(0,el)*(1-cloud)*(1-t);}
}
// ── the post: ACES and the grade, on the open world's frame only ─────────────────────────────────────────────────
// No render targets: the grade rides in three's own tone-mapping chunk, so it costs no pass and no draw call. The
// world scene turns tone mapping on for its own render and off after it, so rooms, gates and the hands keep theirs.
// P10b's grade: shadows a touch cool, highlights warm, saturation lifted.
function landPost(scene){
  if(!LAND.on||scene.userData.landPost)return;scene.userData.landPost=true;
  if(!THREE.ShaderChunk.tonemapping_fragment.includes('og-grade'))THREE.ShaderChunk.tonemapping_fragment=THREE.ShaderChunk.tonemapping_fragment.replace('#endif',
`	{ /* og-grade */ vec3 gc = gl_FragColor.rgb; float gl = dot(gc, vec3(.2126, .7152, .0722));
	  gc *= mix(vec3(.95, .985, 1.05), vec3(1.05, 1., .92), smoothstep(.03, .6, gl));
	  gc = mix(vec3(gl), gc, 1.14);
	  gl_FragColor.rgb = max(gc, 0.); }
#endif`);
  const keep={tm:0,ex:1};
  scene.onBeforeRender=r=>{keep.tm=r.toneMapping;keep.ex=r.toneMappingExposure;r.toneMapping=THREE.ACESFilmicToneMapping;r.toneMappingExposure=LAND.exposure;};
  scene.onAfterRender=r=>{r.toneMapping=keep.tm;r.toneMappingExposure=keep.ex;};
}
