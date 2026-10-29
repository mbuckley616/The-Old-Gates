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
  if(SKY.sun)SKY.sun.visible=false; // the dome draws the disc where skyBodies put it, bright under ACES, where the old flat disc read as a grey coin
  LAND.sky.position.set(px,worldH(px,pz)-60,pz);
  if(LAND.clouds){const C=LAND.clouds.material.uniforms,lit=(1-t)*(1-cloud*.55);
    C.uHi.value.setRGB(1.4,1.36,1.28).lerp(_lC.warm,low*.5).lerp(_lC.grey,cloud*.6).multiplyScalar(.25+.75*lit).lerp(_lC.mid,.12);
    C.uLo.value.setRGB(.78,.82,.92).lerp(_lC.grey,cloud*.5).multiplyScalar(.2+.8*lit).lerp(_lC.mid,.25).lerp(_lC.warm,low*.3);
    C.uOp.value=.85+.15*cloud;LAND.clouds.rotation.y=(worldState.gameTimeAbsMinutes||0)*.00012;}
  if(LAND.waterSky){LAND.waterSky.value.copy(_lC.mid).lerp(_lC.hor,.5);LAND.waterSun.value.copy(U.uSun.value);LAND.waterGlint.value=Math.max(0,el)*(1-cloud)*(1-t);}
}
// ── the post: ACES and the grade, on the open world's frame only ─────────────────────────────────────────────────
// No render targets: the grade rides in three's own ACES function, so it costs no pass and no draw call. The world scene
// turns tone mapping on for its own render and off after it, so gates and the hands keep theirs; rooms take the neutral
// curve (landRoomPost), which the grade does not touch (Session 1257: it was in the tone-mapping chunk, under every curve).
// P10b's grade: shadows a touch cool, highlights warm, saturation lifted.
function landGrade(){
  const C=THREE.ShaderChunk,A='vec3 ACESFilmicToneMapping( vec3 color ) {';
  if(C.tonemapping_pars_fragment.includes('og-grade'))return;
  const i=C.tonemapping_pars_fragment.indexOf(A),j=C.tonemapping_pars_fragment.indexOf('return saturate( color );',i);if(i<0||j<0)return;
  C.tonemapping_pars_fragment=C.tonemapping_pars_fragment.slice(0,i)+
`vec3 ogGrade( vec3 gc ) { /* og-grade */ float gl = dot(gc, vec3(.2126, .7152, .0722));
	gc *= mix(vec3(.95, .985, 1.05), vec3(1.05, 1., .92), smoothstep(.03, .6, gl));
	gc = mix(vec3(gl), gc, 1.14);
	return max(gc, 0.); }
`+C.tonemapping_pars_fragment.slice(i,j)+'return ogGrade( saturate( color ) );'+C.tonemapping_pars_fragment.slice(j+'return saturate( color );'.length);
}
function landPost(scene){
  if(!LAND.on||scene.userData.landPost)return;scene.userData.landPost=true;qualityApply();landGrade();
  const keep={tm:0,ex:1};
  scene.onBeforeRender=r=>{keep.tm=r.toneMapping;keep.ex=r.toneMappingExposure;r.toneMapping=THREE.ACESFilmicToneMapping;r.toneMappingExposure=LAND.exposure;};
  scene.onAfterRender=r=>{r.toneMapping=keep.tm;r.toneMappingExposure=keep.ex;};
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
  B.mComp=new THREE.ShaderMaterial({depthTest:false,depthWrite:false,uniforms:{tScene:{value:null},tBloom:{value:null},uK:{value:.22},uVig:{value:.3}},vertexShader:vs,
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
    try{pass(B.mComp,null);}finally{REN.toneMapping=tm;REN.toneMappingExposure=ex;}
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
  // S1570 (Michael's C on #855) — the chunk's herbs, lifted: no blade inside a herb's own spread, and short in a 0.35 m ring round it
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
// ── the clouds: lit cumulus heaps, as the slice's, in one draw call ─────────────────────────────────────────────────
// Each heap is a few dozen soft puffs, bright on top and on the sun's side and blue-grey beneath; the puffs are one instanced
// quad turned to face the eye in the vertex shader, so a sky of 30 heaps is one draw call, not two thousand sprites. The heaps
// ride with the dome (they are scenery at the sky's distance, not places) and drift with the wind; the sky's colours tint them
// each frame, so they go gold at the low sun, grey under an overcast and dark blue at night. The quality level sets the count.
let _landPuff=null;
function landPuffTex(){if(_landPuff)return _landPuff;const c=document.createElement('canvas');c.width=c.height=64;const x=c.getContext('2d'),g=x.createRadialGradient(32,32,2,32,32,31);
  g.addColorStop(0,'rgba(255,255,255,1)');g.addColorStop(.55,'rgba(255,255,255,.8)');g.addColorStop(1,'rgba(255,255,255,0)');x.fillStyle=g;x.fillRect(0,0,64,64);
  _landPuff=new THREE.CanvasTexture(c);return _landPuff;}
function landClouds(){
  if(LAND.clouds){LAND.sky.remove(LAND.clouds);LAND.clouds.dispose();LAND.clouds=null;}
  const Q=landQ();if(!Q.clouds)return;
  let s=0x9e3779b9;const r=()=>{s=(s+0x6D2B79F5)>>>0;let t=s;t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return((t^(t>>>14))>>>0)/4294967296;};
  const list=[];
  for(let k=0;k<Q.clouds;k++){const a=r()*Math.PI*2,d=900+r()*1500,cx=Math.sin(a)*d,cz=Math.cos(a)*d,cy=360+r()*260+d*.06,size=90+r()*170;
    const N=26+Math.floor(r()*22);
    for(let i=0;i<N;i++){const ox=(r()-.5)*size*2.2,oz=(r()-.5)*size*1.2,oy=Math.max(0,1-Math.hypot(ox/(size*1.1),oz/(size*.6)))*size*(.6+r()*.7);
      list.push([cx+ox,cy+oy,cz+oz,size*(.42+r()*.42),sstep(0,size*.9,oy),ox/size,oz/size]);}}
  const mat=new THREE.ShaderMaterial({transparent:true,depthWrite:false,fog:false,
    uniforms:{uMap:{value:landPuffTex()},uLo:{value:new THREE.Color()},uHi:{value:new THREE.Color()},uSun:LAND.skyMat.uniforms.uSun,uOp:{value:.9}},
    vertexShader:`attribute vec3 aPuff; varying vec2 vUv; varying vec3 vP;
void main(){ vUv = uv; vP = aPuff; vec4 c = modelViewMatrix * vec4(instanceMatrix[3].xyz, 1.); float sz = length(instanceMatrix[0].xyz);
  c.xy += position.xy * sz; gl_Position = projectionMatrix * c; }`,
    fragmentShader:`uniform sampler2D uMap; uniform vec3 uLo, uHi, uSun; uniform float uOp; varying vec2 vUv; varying vec3 vP;
void main(){ float a = texture2D(uMap, vUv).a * uOp; if (a < .01) discard;
  float side = dot(normalize(vec2(vP.y, vP.z) + 1e-4), normalize(uSun.xz + 1e-4)) * length(vec2(vP.y, vP.z)) * .25;
  vec3 c = mix(uLo, uHi, .3 + .7 * vP.x) * (1. + side * .3);
  gl_FragColor = vec4(c, a);
  #include <tonemapping_fragment>
}`});
  const geo=new THREE.PlaneGeometry(1,1),im=new THREE.InstancedMesh(geo,mat,list.length),M=new THREE.Matrix4(),pf=new Float32Array(list.length*3);
  list.forEach((p,i)=>{M.makeScale(p[3],p[3],p[3]).setPosition(p[0],p[1],p[2]);im.setMatrixAt(i,M);pf[i*3]=p[4];pf[i*3+1]=p[5];pf[i*3+2]=p[6];});
  geo.setAttribute('aPuff',new THREE.InstancedBufferAttribute(pf,3));
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
  birch:'birch',birchAutumn:'birch',conifer:'cone',spruce:'cone',pine:'pine',snowpine:'cone'};
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
